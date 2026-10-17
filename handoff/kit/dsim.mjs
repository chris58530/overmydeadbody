// Drunk-mode headless kit: loads the live game engine, builds single-room games, solves and replays rooms.
// Usage from other scripts: import { load, makeGame, solve, replay, compress, ascii } from './dsim.mjs'
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export const ENGINE_FILE = process.env.ENGINE_FILE || new URL('../../prototype/game.html', import.meta.url);
const html = readFileSync(ENGINE_FILE, 'utf8');
const src = html.match(/<script>([\s\S]*?)<\/script>/)[1];
// speed: particles and shouts do nothing (they never touch physics)
const fast = src.replace('    emit(x, y, color, count, spread = 220, lift = 180) {', '    emit() { return; }\n    emitOrig(x, y, color, count, spread = 220, lift = 180) {')
  .replace('    shout(who, lines) {', '    shout() { return; }\n    shoutOrig(who, lines) {');
const ctx = vm.createContext({});
vm.runInContext('(function () { const { Math, Object, Array, Set, Map, JSON, Number, String, Error } = globalThis;\n' + fast + '\n})();', ctx);
export const D = ctx.Drunk;
export const TUNING = D.TUNING;

// map: { cells }, room: a drunken-rooms room object. Exits are kept as sides but lead nowhere (null = day end).
export function makeGame(room, cells) {
  const exits = Object.fromEntries(Object.keys(room.exits || { right: 1 }).map(k => [k, null]));
  const r = { ...room, id: 'r', exits };
  delete r.npcs; r.tiles = r.tiles.map(row => row.replace(/N/g, '.'));
  const g = new D.Game(D.parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'x', cells, abilities: ['wrestler'], rooms: [r] }] })));
  g.phase = 'play';
  return g;
}

// 0.1 s macro actions: [pressed on the first frame, held for the whole 0.1 s]
export const ACTIONS = {
  N: [{}, {}], R: [{}, { right: true }], L: [{}, { left: true }],
  RJ: [{ jumpPressed: true }, { right: true, jump: true }], LJ: [{ jumpPressed: true }, { left: true, jump: true }], NJ: [{ jumpPressed: true }, { jump: true }],
  RH: [{}, { right: true, jump: true }], LH: [{}, { left: true, jump: true }], NH: [{}, { jump: true }],
  RD: [{}, { right: true, down: true }], ND: [{}, { down: true }],
  NF: [{ kPressed: true }, {}], RF: [{ kPressed: true }, { right: true }], LF: [{ kPressed: true }, { left: true }],
  RUF: [{ kPressed: true }, { right: true, jump: true }], LUF: [{ kPressed: true }, { left: true, jump: true }],
  S: [{ skill: 'wrestler' }, {}], RS: [{ skill: 'wrestler' }, { right: true }], LS: [{ skill: 'wrestler' }, { left: true }],
  US: [{ skill: 'wrestler' }, { jump: true }], RUS: [{ skill: 'wrestler' }, { right: true, jump: true }], RDS: [{ skill: 'wrestler' }, { right: true, down: true }],
};
const MOVES = ['N', 'R', 'L', 'RJ', 'LJ', 'NJ', 'RH', 'NH', 'RD', 'ND'];
const FARTS = ['NF', 'RF', 'LF', 'RUF'];
const SKILLS = ['S', 'RS', 'LS'];

function clone(g) {
  const c = Object.create(Object.getPrototypeOf(g));
  for (const k of Object.keys(g)) {
    const v = g[k];
    if (k === 'campaign' || k === 'room' || k === 'exits' || k === 'seen') c[k] = v;
    else if (k === 'particles' || k === 'events' || k === 'bubbles') c[k] = [];
    else if (k === 'tiles') c[k] = v.map(r => r.slice());
    else if (k === 'entities') c[k] = v.map(e => ({ ...e }));
    else if (k === 'crumbles') c[k] = new Map([...v].map(([a, b]) => [a, { ...b }]));
    else if (Object.prototype.toString.call(v) === '[object Set]') c[k] = new v.constructor(v);
    else if (v && typeof v === 'object') c[k] = Array.isArray(v) ? v.slice() : { ...v };
    else c[k] = v;
  }
  return c;
}

function advance(g, first, hold, stat) {
  for (let f = 0; f < 12; f++) {
    g.step(1 / 120, f === 0 ? { ...hold, ...first } : hold);
    for (const e of g.events) { if (e === 'lift' || e === 'charge' || e === 'bigfart') stat.j++; if (e === 'fart') stat.f++; if (e === 'gulp') stat.d++; }
    g.particles.length = 0; g.bubbles.length = 0; g.events.length = 0;
    if (g.phase !== 'play' || g.state === 'dead') return;
  }
}

function key(g, stat) {
  const b = g.body, s = g.stand;
  let k = g.state + '|' + Math.round(b.x / 20) + '|' + Math.round(b.y / 20) + '|' + Math.round(b.vx / 120) + '|' + Math.round(b.vy / 200) + '|' + (b.grounded ? 1 : 0) + '|' + Math.round(g.booze * 8) + '|' + g.stage + '|' + (g.stageWarn ? g.stageWarn.to + ':' + Math.round(g.stageWarn.t * 5) : '') + '|' + stat.j + '|' + g.chain.length + ':' + Math.round(g.chainT * 10) + '|' + Math.round(Math.max(0, g.regenWait) * 5);
  if (g.state === 'charge' || g.state === 'lift') k += '|' + Math.round(g.timer / 0.1) + '|' + g.chargeDir + '|' + g.aim + '|' + (s ? Math.round(s.vy / 200) + ',' + Math.round(s.y / 20) : '');
  if (g.state === 'thrown') k += '|' + g.throwKind;
  k += '|' + g.tilesVersion;
  for (const e of g.entities) if (e.kind === 'patrol') k += e.alive ? '' : 'x'; else if (e.kind === 'faller') k += e.phase[0]; else if (e.kind === 'cap' || e.kind === 'drink') k += e.got ? '1' : '0';
  return k;
}

function score(g, ex, caps) {
  const b = g.body; let sc = 0;
  if (caps) { const left = g.entities.filter(e => e.kind === 'cap' && !e.got); if (left.length) return 3000 * g.roomCaps.length - Math.min(...left.map(e => Math.hypot(e.x - b.x, e.y - (b.y - 36)))); }
  if (ex.right !== undefined) sc = Math.max(sc, b.x);
  if (ex.left !== undefined) sc = Math.max(sc, 1280 - b.x);
  if (ex.top !== undefined) sc = Math.max(sc, 720 - b.y);
  if (ex.bottom !== undefined) sc = Math.max(sc, b.y);
  return sc + 3000 * g.roomCaps.length + (b.grounded ? 30 : 0) + g.booze * 40;
}

// Plays a plan of action labels at 240 Hz (what the game does for P). Returns the outcome.
export function replay(room, cells, plan, extra = 1.5) {
  const g = makeGame(room, cells);
  const total = plan.length + Math.round(extra * 10);
  for (let frame = 0; frame < total * 24; frame++) {
    const i = Math.floor(frame / 24), [first, hold] = ACTIONS[plan[Math.min(i, plan.length - 1)]];
    g.step(1 / 240, frame % 24 === 0 ? { ...hold, ...first } : hold);
    g.particles.length = 0; g.bubbles.length = 0; g.events.length = 0;
    if (g.phase !== 'play') return { ok: true, t: +(frame / 240).toFixed(2), caps: g.capsGot.size + g.roomCaps.length };
    if (g.state === 'dead') return { ok: false, dead: true, t: +(frame / 240).toFixed(2), x: Math.round(g.body.x), y: Math.round(g.body.y) };
  }
  return { ok: false, t: total / 10, x: Math.round(g.body.x), y: Math.round(g.body.y) };
}

// Beam search. opt: { fart: bool, skill: bool, caps: bool, maxJ, maxT, beam, limit }
export function solve(room, cells, opt = {}) {
  const useF = opt.fart ?? true, useS = opt.skill ?? true, maxJ = opt.maxJ ?? 9;
  const maxT = opt.maxT ?? 14, beam = opt.beam ?? 2500, limit = opt.limit ?? 1500000;
  const g0 = makeGame(room, cells), ex = room.exits || { right: null };
  const totalCaps = g0.entities.filter(e => e.kind === 'cap').length;
  const seen = new Set();
  let frontier = [{ g: g0, plan: [], stat: { j: 0, f: 0, d: 0 } }], expanded = 0;
  for (let depth = 0; depth * 0.1 < maxT && frontier.length; depth++) {
    const next = [];
    for (const node of frontier) {
      const labels = MOVES.concat(useF ? FARTS : [], useS && node.stat.j < maxJ ? SKILLS : []);
      for (const label of labels) {
        const g = clone(node.g), stat = { ...node.stat };
        const [first, hold] = ACTIONS[label];
        if (first.kPressed && g.booze < TUNING.fartCost - 1e-9) continue;
        if (first.skill && g.booze < 1 - 1e-9) continue;
        advance(g, first, hold, stat);
        expanded++;
        if (g.state === 'dead') continue;
        const plan = node.plan.concat(label);
        if (g.phase !== 'play') {
          if (opt.caps && g.capsGot.size + g.roomCaps.length < totalCaps) continue;
          const rp = replay(room, cells, plan);
          if (!rp.ok || (opt.caps && rp.caps < totalCaps)) continue;
          return { ok: true, plan, t: +((depth + 1) * 0.1).toFixed(1), j: stat.j, farts: stat.f, drinks: stat.d, expanded, caps: `${rp.caps}/${totalCaps}` };
        }
        const k = key(g, stat);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ g, plan, stat });
      }
      if (expanded > limit) return { ok: false, reason: 'limit', expanded, depth };
    }
    if (next.length > beam) { for (const n of next) n.sc = score(n.g, ex, opt.caps) + Math.random() * 40; next.sort((a, b) => b.sc - a.sc); next.length = beam; }
    frontier = next;
  }
  return { ok: false, reason: 'exhausted', expanded };
}

export function compress(plan) {
  const out = []; let prev = null, n = 0;
  for (const p of plan) { if (p === prev) n++; else { if (prev) out.push(n > 1 ? `${prev}x${n}` : prev); prev = p; n = 1; } }
  if (prev) out.push(n > 1 ? `${prev}x${n}` : prev);
  return out.join(' ');
}
export const expand = route => route.split(' ').flatMap(s => { const [k, n] = s.split('x'); return Array(+(n || 1)).fill(k); });

// ASCII snapshot of a running game: tiles, Jim (@), shadow (&), entities, hallucinated cells in lower case marks.
export function ascii(g) {
  const rows = g.tiles.map(r => r.slice());
  for (const k of g.hallu || []) { const [x, y] = k.split(',').map(Number); if (rows[y][x] === '#') rows[y][x] = 'h'; else if (rows[y][x] === '.') rows[y][x] = ','; }
  for (const e of g.entities) {
    const x = Math.floor(e.x / 40), y = Math.min(17, Math.floor((e.y - 1) / 40));
    if (x < 0 || x > 31 || y < 0) continue;
    if (e.kind === 'cap' && !e.got) rows[y][x] = '*'; else if (e.kind === 'patrol' && e.alive) rows[y][x] = 'R'; else if (e.kind === 'faller' && e.phase !== 'gone') rows[y][x] = 'L';
  }
  const bx = Math.floor(g.body.x / 40), by = Math.floor((g.body.y - 1) / 40);
  for (const dy of [0, 1]) if (by - dy >= 0 && by - dy < 18 && bx >= 0 && bx < 32) rows[by - dy][bx] = '@';
  return rows.map(r => r.join('')).join('\n');
}
