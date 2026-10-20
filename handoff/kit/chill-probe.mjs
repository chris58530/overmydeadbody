// Shortcut probe for chill-puzzle rooms: a beam search over 0.1 s inputs on the live engine.
// It looks for a way to the room's portal under restricted rules, to show which idea a room really needs.
// "NO" means the search found nothing within its budget: strong evidence, not proof.
//   node handoff/kit/chill-probe.mjs [roomId ...] [--mode=full,still,instant,nolag] [--beam=1500] [--time=14]
// Modes: full = every input; still = no E/K (only the starting grade);
//        instant = the world changes at once, and E/K still wait three seconds between changes,
//        so a room that needs the delay itself (old world + new skill) comes back NO.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { D } from './dsim.mjs';

const T = 40;
export const PROBE_ACTIONS = {
  N: [{}, {}], R: [{}, { right: true }], L: [{}, { left: true }],
  RJ: [{ jumpPressed: true }, { right: true, jump: true }], LJ: [{ jumpPressed: true }, { left: true, jump: true }], NJ: [{ jumpPressed: true }, { jump: true }],
  RH: [{}, { right: true, jump: true }], LH: [{}, { left: true, jump: true }],
  RS: [{ skill: 'wrestler', right: true }, { right: true }], LS: [{ skill: 'wrestler', left: true }, { left: true }],
  RSN: [{ skill: 'wrestler', right: true }, {}], LSN: [{ skill: 'wrestler', left: true }, {}],
  E: [{ gradeUpPressed: true }, {}], K: [{ kPressed: true }, {}],
  RE: [{ gradeUpPressed: true }, { right: true }], LE: [{ gradeUpPressed: true }, { left: true }],
  RK: [{ kPressed: true }, { right: true }], LK: [{ kPressed: true }, { left: true }],
};
const MOVES = ['N', 'R', 'L', 'RJ', 'LJ', 'NJ', 'RH', 'LH'];
const SKILLS = ['RS', 'LS', 'RSN', 'LSN'];
const GRADES = ['E', 'K', 'RE', 'LE', 'RK', 'LK'];

export function makeRoomGame(campaign, mapId, roomId) {
  const g = new D.Game(D.parseCampaign(JSON.stringify(campaign)));
  const mi = g.campaign.maps.findIndex(m => m.id === mapId);
  g.startMap(mi); g.enterRoom(roomId); g.phase = 'play';
  return g;
}

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

function advance(g, first, hold, instant) {
  for (let f = 0; f < 12; f++) {
    g.step(1 / 120, f === 0 ? { ...hold, ...first } : hold);
    if (instant && g.stageWarn) g.updateChillStage(3);
    g.particles.length = 0; g.bubbles.length = 0; g.events.length = 0;
    if (g.phase !== 'play' || g.state === 'dead') return;
  }
}

function key(g, cool) {
  const b = g.body, s = g.stand;
  let k = (cool > 0 ? Math.ceil(cool / 5) : 0) + '|' + g.state + '|' + Math.round(b.x / 20) + '|' + Math.round(b.y / 20) + '|' + Math.round(b.vx / 150) + '|' + Math.round(b.vy / 250) + '|' + (b.grounded ? 1 : 0)
    + '|' + g.targetStage() + '|' + g.stage + '|' + (g.stageWarn ? Math.round(g.stageWarn.t * 4) : '') + '|' + (g.chillAirUsed ? 1 : 0) + '|' + g.chain.length + '|' + g.tilesVersion;
  if (g.state === 'charge' || g.state === 'lift') k += '|' + Math.round(g.timer / 0.1) + '|' + (s ? Math.round(s.y / 20) : '');
  return k;
}

function portals(room) {
  const out = [];
  room.tiles.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'O') out.push({ x: x * T + T / 2, y: y * T + T / 2 }); });
  return out;
}

export function probe(campaign, mapId, roomId, opt = {}) {
  const mode = opt.mode || 'full', beam = opt.beam ?? 1500, maxT = opt.maxT ?? 14;
  const instant = mode === 'instant';
  const g0 = makeRoomGame(campaign, mapId, roomId);
  // opt.cap = [x, y]: search for that bottle cap instead of the portal
  const targets = opt.cap ? [{ x: opt.cap[0] * T + T / 2, y: opt.cap[1] * T + T / 2 }] : portals(g0.room);
  const capKey = opt.cap && opt.cap.join(',');
  const gotCap = g => g.capsGot.has(`${g.map.id}:${g.room.id}:${capKey}`) || [...g.capsGot].some(k => k.endsWith(':' + capKey));
  const labels = MOVES.concat(SKILLS, mode === 'still' ? [] : GRADES);
  const seen = new Set();
  let frontier = [{ g: g0, plan: [], cool: 0 }], expanded = 0;
  for (let depth = 0; depth * 0.1 < maxT && frontier.length; depth++) {
    const next = [];
    for (const node of frontier) {
      for (const label of labels) {
        const [first, hold] = PROBE_ACTIONS[label];
        if (first.skill && (node.g.chillAirUsed || node.g.targetStage() < 1)) continue;
        const grade = first.gradeUpPressed || first.kPressed;
        if (grade && (node.g.stageWarn || node.cool > 0)) continue;
        const g = clone(node.g);
        advance(g, first, hold, instant);
        expanded++;
        if (g.state === 'dead') continue;
        const plan = node.plan.concat(label);
        const cool = grade && instant && g.targetStage() !== node.g.targetStage() ? 30 : Math.max(0, node.cool - 1);
        if (capKey ? gotCap(g) : g.phase !== 'play') return { ok: true, plan, t: +((depth + 1) * 0.1).toFixed(1), expanded };
        if (g.phase !== 'play') continue;
        const k = key(g, cool);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ g, plan, cool });
      }
    }
    if (next.length > beam) {
      for (const n of next) {
        const b = n.g.body;
        n.sc = -Math.min(...targets.map(p => Math.hypot(p.x - b.x, p.y - (b.y - 36)))) + Math.random() * 60;
      }
      next.sort((a, b) => b.sc - a.sc);
      // keep the closest states, plus a random share of the rest so detours survive
      const keep = next.slice(0, Math.floor(beam * 0.7));
      const rest = next.slice(keep.length);
      for (let i = 0; i < beam - keep.length && rest.length; i++) keep.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
      frontier = keep;
    } else frontier = next;
  }
  return { ok: false, expanded };
}

export function compress(plan) {
  const out = []; let prev = null, n = 0;
  for (const p of plan) { if (p === prev) n++; else { if (prev) out.push(n > 1 ? `${prev}x${n}` : prev); prev = p; n = 1; } }
  if (prev) out.push(n > 1 ? `${prev}x${n}` : prev);
  return out.join(' ');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { campaign } = await import('./build-chill.mjs');
  const args = process.argv.slice(2);
  const flag = (name, def) => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;
  const modes = flag('mode', 'still,instant').split(',');
  const ids = args.filter(a => !a.startsWith('--'));
  for (const map of campaign.maps) for (const room of map.rooms) {
    if (ids.length && !ids.includes(room.id)) continue;
    for (const mode of modes) {
      const t0 = Date.now();
      const r = probe(campaign, map.id, room.id, { mode, beam: +flag('beam', 1500), maxT: +flag('time', 14) });
      console.log(`${room.id.padEnd(5)} ${mode.padEnd(8)} ${r.ok ? `FOUND ${r.t}s  ${compress(r.plan)}` : 'NO'}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
}
