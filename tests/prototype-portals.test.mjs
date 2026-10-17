import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../prototype/game.html', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, T } = context.Drunk;
function campaign() {
  const room = id => ({ id, tiles: Array.from({ length: 18 }, (_, y) => y === 15 ? '..P...O.........................' : y >= 16 ? '#'.repeat(32) : '.'.repeat(32)), exits: {} });
  return parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'one', abilities: ['wrestler'], rooms: [room('a'), room('b')] }, { id: 'two', abilities: ['bodyguard'], rooms: [room('c')] }] }));
}
test('portal-only rooms load and contact transitions to the next ordered room', () => {
  const game = new Game(campaign());
  game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits();
  assert.equal(game.phase, 'transition'); assert.equal(game.nextRoom, 'b');
  for (let i = 0; i < 70; i++) game.step(1 / 120);
  assert.equal(game.room.id, 'b'); assert.equal(game.phase, 'play');
});
test('last-room portal banks collectibles and finishes the day', () => {
  const game = new Game(campaign()); game.enterRoom('b'); game.roomCaps = ['cap'];
  game.body.x = 6.5 * T; game.body.y = 16 * T; game.checkExits();
  assert.equal(game.phase, 'mapEnd'); assert.ok(game.capsGot.has('cap'));
  game.step(.7); game.step(.01, { confirmPressed: true });
  assert.equal(game.mapIndex, 1); assert.equal(game.room.id, 'c');
});
test('portal does not activate from a distance and existing edge exits still work', () => {
  const data = campaign(); data.maps[0].rooms[0].exits.right = 'b';
  const game = new Game(data); game.checkExits(); assert.equal(game.phase, 'play');
  game.body.x = 32 * T + 1; game.checkExits(); assert.equal(game.nextRoom, 'b');
});
test('both prototype scripts remain valid JavaScript', async () => {
  for (const file of ['game', 'editor']) {
    const source = await readFile(new URL(`../prototype/${file}.html`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  }
});

test('manual portal destinations override room order and survive serialization', () => {
  const data = campaign();
  data.maps[0].rooms[1].portalTarget = 'a';
  const game = new Game(parseCampaign(JSON.stringify(data)));
  game.enterRoom('b'); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.nextRoom, 'a');
});

test('manual end destination and invalid targets are handled', () => {
  const data = campaign(); data.maps[0].rooms[0].portalTarget = null;
  const game = new Game(data); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.phase, 'mapEnd');
  data.maps[0].rooms[0].portalTarget = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /missing/);
});

test('two portals in one room use their own destinations after JSON round trip', () => {
  const data = campaign(), room = data.maps[0].rooms[0];
  room.tiles[15] = '..P...O...O.....................';
  room.portalTargets = { '6,15': 'b', '10,15': null };
  const loaded = parseCampaign(JSON.stringify(data));
  const game = new Game(loaded); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.nextRoom, 'b');
  const other = new Game(loaded); other.body.x = 10.5 * T; other.body.y = 16 * T;
  other.checkExits(); assert.equal(other.phase, 'mapEnd');
  room.portalTargets['10,15'] = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /missing/);
  room.portalTargets = { '5,15': 'b' };
  assert.throws(() => parseCampaign(JSON.stringify(data)), /5,15/);
});

test('direct mode fires a skill from its own key, within the day pool and air limit', () => {
  const { TUNING } = context.Drunk;
  const game = new Game(campaign()); game.phase = 'play';
  assert.equal(TUNING.directMode, 1);
  game.step(.01, { kPressed: true }); assert.equal(game.slot, null);
  game.step(.01, { skill: 'bodyguard' }); assert.equal(game.state, 'free');
  game.step(.01, { skill: 'wrestler' }); assert.equal(game.state, 'lift'); assert.equal(game.slot, null);
  for (let i = 0; i < 60; i++) game.step(1 / 120);
  assert.equal(game.state, 'thrown');
  game.step(.01, { skill: 'wrestler' }); assert.equal(game.state, 'thrown');
  TUNING.directMode = 0;
  try {
    const draw = new Game(campaign()); draw.phase = 'play';
    draw.step(.01, { skill: 'wrestler' }); assert.equal(draw.state, 'free');
    draw.step(.01, { kPressed: true }); assert.ok(draw.slot);
  } finally { TUNING.directMode = 1; }
});

test('a ground charge spends the air use, a smash refreshes it, and jump leaps off the charge', () => {
  const room = row => ({ id: 'r', tiles: Array.from({ length: 18 }, (_, y) => y === 15 ? row : y >= 16 ? '#'.repeat(32) : '.'.repeat(32)), exits: { right: null } });
  const make = row => { const g = new Game(parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'm', abilities: ['wrestler', 'bodyguard'], rooms: [room(row)] }] }))); g.phase = 'play'; return g; };
  const plain = make('..P.............................');
  plain.step(.01, { skill: 'bodyguard' }); assert.equal(plain.state, 'charge');
  plain.step(.01, { skill: 'wrestler' }); assert.equal(plain.state, 'charge');
  const crates = make('..P...B.........................');
  crates.step(.01, { skill: 'bodyguard' });
  for (let i = 0; i < 40 && crates.airDraws; i++) crates.step(1 / 120);
  assert.equal(crates.airDraws, 0); assert.equal(crates.activeSkill, null);
  crates.step(.01, { skill: 'wrestler' }); assert.equal(crates.state, 'lift');
  const leap = make('..P.............................');
  leap.step(.01, { skill: 'bodyguard' }); leap.step(.05);
  leap.step(.01, { jumpPressed: true, jump: true });
  assert.equal(leap.state, 'free'); assert.ok(leap.body.vy < 0); assert.ok(leap.body.vx > 500);
});

test('drunk mode: one J spends every full cell and the shadow plays the chain by itself', () => {
  const rows = Array.from({ length: 18 }, (_, y) => y >= 16 ? '#'.repeat(32) : y === 15 ? '..P.............................' : '.'.repeat(32));
  const make = booze => { const g = new Game(parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'm', cells: 3, rooms: [{ id: 'r', tiles: rows, exits: { right: null }, booze }] }] }))); g.phase = 'play'; return g; };
  const game = make(3), seen = [];
  game.step(1 / 240, { skill: 'wrestler' }); assert.equal(game.booze, 0); assert.ok(game.body.vy < -1000);
  for (let i = 0; i < 240 * 2.5; i++) { game.step(1 / 240, { skill: 'wrestler' }); if (seen.at(-1) !== game.state) seen.push(game.state); }
  assert.ok(seen.join(',').startsWith('free,charge,lift,thrown'), seen.join(','));
  const two = make(2.5); two.step(1 / 240, { skill: 'wrestler' }); assert.equal(two.state, 'charge'); assert.equal(two.booze, 0);
  const none = make(0.9); none.step(1 / 240, { skill: 'wrestler' }); assert.equal(none.state, 'free'); assert.ok(none.bubbles.some(b => b.deny));
});

test('drunk mode: booze comes back by itself, a stage change is announced and lands on the ground, and a fart cancels it', () => {
  const rows = Array.from({ length: 18 }, (_, y) => y >= 16 ? '#'.repeat(32) : y === 15 ? '..P.............................' : '.'.repeat(32));
  const overlay = Array.from({ length: 18 }, (_, y) => y === 10 ? '.'.repeat(20) + '####' + '.'.repeat(8) : '.'.repeat(32));
  const make = () => { const g = new Game(parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'm', cells: 1, rooms: [{ id: 'r', tiles: rows, exits: { right: null }, booze: 0.9, stages: { 1: overlay } }] }] }))); g.phase = 'play'; return g; };
  const game = make();
  for (let i = 0; i < 120 && game.booze < 1; i++) game.step(1 / 240);
  assert.equal(game.booze, 1); assert.equal(game.stage, 0); assert.equal(game.stageWarn.to, 1);
  for (let i = 0; i < 300; i++) game.step(1 / 240);
  assert.equal(game.stage, 1); assert.equal(game.tiles[10][20], '#');
  game.step(1 / 240, { kPressed: true }); assert.ok(Math.abs(game.booze - 5 / 6) < 0.01); assert.ok(game.body.vy < 0);
  game.step(1 / 240, { kPressed: true }); assert.ok(game.booze < 5 / 6 + 0.01);   // cooldown: no second fart
  const cancel = make();
  for (let i = 0; i < 120 && cancel.booze < 1; i++) cancel.step(1 / 240);
  cancel.step(1 / 240, { kPressed: true });
  for (let i = 0; i < 60; i++) cancel.step(1 / 240);
  assert.equal(cancel.stage, 0); assert.equal(cancel.stageWarn, null); assert.equal(cancel.tiles[10][20], '.');
  cancel.die(); for (let i = 0; i < 120; i++) cancel.step(1 / 240);
  assert.ok(cancel.booze < 1);
});

test('the shipped days load and every room keeps one spawn', () => {
  const { DEFAULT_CAMPAIGN } = context;
  const data = parseCampaign(JSON.stringify(DEFAULT_CAMPAIGN));
  assert.equal(data.maps.map(m => m.rooms.length).join(), '5,4,3');
  assert.equal(data.maps.map(m => m.cells).join(), '1,2,3');
  for (const r of data.maps.flatMap(m => m.rooms)) assert.equal(r.tiles.join('').split('P').length - 1, 1, r.id);
});

test('auto-clear (P) leaves every shipped room from the spawn with its cap, and skips edited rooms', () => {
  const { DEFAULT_CAMPAIGN } = context, { AUTO } = context.Drunk;
  DEFAULT_CAMPAIGN.maps.forEach((map, mi) => map.rooms.forEach(room => {
    const game = new Game(DEFAULT_CAMPAIGN); game.startMap(mi); game.enterRoom(room.id); game.phase = 'play';
    const steps = AUTO.route(game); assert.ok(steps, room.id);
    const events = new Set();
    for (let f = 0; f < 240 * 15 && game.phase === 'play' && game.room === room && game.state !== 'dead'; f++) {
      game.step(AUTO.STEP_DT, AUTO.input(steps, f));
      for (const event of game.events) events.add(event);
    }
    assert.notEqual(game.state, 'dead', room.id); assert.notEqual(game.phase, 'play', room.id);
    if (mi === 0 && ['1-1', '1-2'].includes(room.id)) { assert.ok(events.has('fart'), room.id); assert.ok(!events.has('lift'), room.id); }
    if (mi === 1) assert.ok(events.has('charge'), `${room.id} must demonstrate the two-cell charge`);
    if (mi === 2) for (const e of ['bigfart', 'charge', 'lift', 'throw']) assert.ok(events.has(e), `${room.id}: ${e}`);
    const caps = room.tiles.flatMap((row, y) => [...row].map((c, x) => c === '*' ? `${map.id}:${room.id}:${x},${y}` : null)).filter(Boolean);
    for (const k of caps) assert.ok(game.capsGot.has(k), `${room.id} cap ${k}`);
  }));
  const edited = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN)); edited.maps[0].rooms[0].tiles[0] = '#'.repeat(32);
  assert.equal(AUTO.route(new Game(parseCampaign(JSON.stringify(edited)))), null);
  for (const change of [
    c => { c.maps[0].cells = 2; },
    c => { c.maps[0].rooms[0].booze = 0; },
    c => { c.maps[0].rooms[0].stages = { 1: Array(18).fill('#'.repeat(32)) }; },
    c => { c.maps[0].rooms[0].exits = { left: null }; },
  ]) {
    const modified = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN)); change(modified);
    assert.equal(AUTO.route(new Game(parseCampaign(JSON.stringify(modified)))), null);
  }
});

test('NPC conversations branch, pause movement, end, and remain independent', async () => {
  const data = campaign(), r = data.maps[0].rooms[0];
  r.tiles[15] = '..P.N.O.N.......................';
  const dialogue = JSON.parse(await readFile(new URL('../prototype/dialogue-example.json', import.meta.url), 'utf8'));
  r.npcs = { '4,15': dialogue, '8,15': { name: 'Other', start: 'a', nodes: { a: { text: 'Other dialogue', next: null } } } };
  const game = new Game(parseCampaign(JSON.stringify(data))); game.phase = 'play';
  game.step(.01, { talkPressed: true }); assert.equal(game.dialogue, null);
  game.body.x = 4.5 * T; game.body.y = 16 * T;
  game.step(.01, { talkPressed: true }); assert.equal(game.dialogue.node, 'hello');
  const x = game.body.x; game.step(.1, { right: true, choice: 9 });
  assert.equal(game.body.x, x); assert.equal(game.dialogue.node, 'hello');
  game.step(.01, { choice: 1 }); assert.equal(game.dialogue.node, 'directions');
  game.step(.01, { confirmPressed: true }); assert.equal(game.dialogue, null);
  game.body.x = 8.5 * T; game.step(.01, { talkPressed: true }); assert.equal(game.dialogue.data.name, 'Other');
  game.enterRoom('b'); assert.equal(game.dialogue, null);
  dialogue.nodes.hello.choices[0].next = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /Unknown|choices/);
});
