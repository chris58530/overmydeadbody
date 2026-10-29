import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
const html = readFileSync(new URL('../prototype/game.html', import.meta.url), 'utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, AUTO } = context.Drunk;
const campaign = parseCampaign(readFileSync(new URL('../prototype/chill-loop.json', import.meta.url), 'utf8'));
const routes = JSON.parse(readFileSync(new URL('../prototype/chill-loop-routes.json', import.meta.url), 'utf8'));
const DT = 1 / 240;

function make(id) {
  const mapIndex = campaign.maps.findIndex(map => map.rooms.some(room => room.id === id));
  const game = new Game(campaign);
  game.startMap(mapIndex);
  game.enterRoom(id);
  game.phase = 'play';
  return game;
}
const run = (game, seconds, input = {}) => { for (let n = 0; n < seconds * 240 && game.phase === 'play'; n++) game.step(DT, input); };

test('every loop room replays its P route from the spawn, whatever happened before P', () => {
  const before = [[], [[90, { right: true }]], [[2, { jump: true, jumpPressed: true, right: true }], [40, { jump: true, right: true }]], [[1, { kPressed: true }]]];
  for (const map of campaign.maps) for (const room of map.rooms) for (const seq of before) {
    const game = make(room.id);
    for (const [n, input] of seq) run(game, n / 240, input);
    if (game.phase !== 'play') continue;
    const steps = AUTO.puzzleRoute(game, routes);
    assert.ok(steps, `${room.id}: no route`);
    game.enterRoom(room.id);
    const start = game.room;
    for (let f = 0; f < steps.at(-1).end && game.phase === 'play' && game.room === start; f++) {
      game.step(AUTO.STEP_DT, AUTO.puzzleInput(steps, f));
      assert.notEqual(game.state, 'dead', `${room.id}: replay died`);
    }
    assert.notEqual(game.phase, 'play', `${room.id}: replay did not exit`);
  }
});

test('the office prologue has no shadow: J does nothing and the grade panel is hidden', () => {
  const game = make('P1-1');
  assert.equal(game.map.hud, false);
  assert.equal(game.hasShadow, false);
  game.step(DT, { skill: 'wrestler', right: true });
  assert.equal(game.state, 'free');
  assert.equal(game.chillAirUsed, false);
});

test('the loop campaign carries no words: no day cards, room cards or wall signs', () => {
  for (const map of campaign.maps) {
    assert.equal(map.intro, undefined, `${map.id}: intro card`);
    assert.equal(map.outro, undefined, `${map.id}: outro card`);
    for (const room of map.rooms) {
      assert.equal(room.cutscene, undefined, `${room.id}: cutscene`);
      assert.equal(room.signs, undefined, `${room.id}: signs`);
    }
  }
  // the day ends on a dark screen and the next day starts by itself
  const game = make('P1-4');
  game.leave('right', null);
  assert.equal(game.phase, 'mapEnd');
  for (let n = 0; n < 1.2 * 240; n++) game.step(DT, {});
  assert.equal(game.mapIndex, 1);
  assert.equal(game.phase, 'play');
});

test('a hallucinated solid that lands on Jim kills him instead of waiting for him', () => {
  // L2-3: the bottle brings a bridge over the glass three seconds later; stand where it will appear
  const game = make('L2-3');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  while (game.stageWarn.t > 1.5 * DT) game.step(DT, {});   // the very next step lands the bridge
  const [x, y] = game.stageWarn.cells.find(([, , c]) => c === '#');
  game.body.x = x * 40 + 20; game.body.y = (y + 1) * 40; game.body.vy = 0;
  game.step(DT, {});
  assert.equal(game.state, 'dead');
  assert.equal(game.tiles[y][x], '#', 'the solid lands anyway');
});

// A one-room campaign for engine objects, from 18 rows of 32 tiles.
function sandbox(rows, abilities = []) {
  rows = ['.'.repeat(31) + 'O', ...rows.slice(1)];   // a door out of reach, for the validator
  const room = { id: 'T', name: 't', theme: 'office', booze: 0, tiles: rows, exits: {}, portalTarget: null, lines: [] };
  const game = new Game(parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
    maps: [{ id: 'd', name: 'd', cells: 1, abilities, rooms: [room] }] })));
  game.startMap(0); game.enterRoom('T'); game.phase = 'play';
  return game;
}
const E = '.'.repeat(32), F = '#'.repeat(32);

test('a sofa throws Jim up, higher the faster he lands, and gives J back', () => {
  const peak = (game, input) => {
    let top = Infinity, bounced = false;
    for (let n = 0; n < 4 * 240; n++) {
      game.step(DT, input(n));
      if (game.events.includes('bounce')) { if (bounced) break; bounced = true; }
      game.events.length = 0;
      if (bounced) top = Math.min(top, game.body.y);
    }
    assert.ok(bounced, 'no bounce');
    return (640 - top) / 40;
  };
  const rows = [...Array(15).fill(E), '.P' + '.'.repeat(30), '#####SSSSS' + '#'.repeat(22), F];
  const walk = peak(sandbox(rows), () => ({ right: true }));
  assert.ok(walk > 4.5 && walk < 5.5, `walking on: ${walk}`);
  const thrown = sandbox(rows, ['wrestler']);
  thrown.booze = 1; thrown.chillAirUsed = true;
  const throwPeak = peak(thrown, n => ({ ...(n === 2 ? { skill: 'wrestler', right: true } : {}), left: n > 60 }));
  assert.ok(throwPeak > 7.5, `from a throw: ${throwPeak}`);
  assert.equal(thrown.chillAirUsed, false, 'the bounce counts as touching down');
});

test('a cart rolls until something solid turns it, and carries Jim like a belt', () => {
  const game = sandbox([...Array(13).fill(E), '....M.......................#...', E, '.P' + '.'.repeat(30), F, F]);
  const cart = game.entities.find(e => e.kind === 'cart');
  let turned = false;
  for (let n = 0; n < 12 * 240; n++) { game.step(DT, {}); if (cart.dir < 0) turned = true; }
  assert.ok(turned, 'the post at x 28 turns it');
  assert.ok(cart.x + cart.w / 2 <= 28 * 40 + 1e-6);
  // stand Jim on the deck: he moves with it and keeps its speed into a jump
  game.body.x = cart.x; game.body.y = cart.y - 4; game.body.vy = 0;
  for (let n = 0; n < 240; n++) game.step(DT, {});
  assert.ok(game.body.cart >= 0 && game.body.grounded, 'standing on the cart');
  assert.ok(Math.abs(game.body.x - cart.x) < 30, 'carried along');
  assert.ok(Math.abs(game.body.vx - cart.dir * 120) < 5, 'moving at the cart speed');
});

test('walking off a room edge slides into the next room and keeps going; a death there goes back to its spawn', () => {
  const game = make('P1-1');
  game.body.x = 1250; game.body.y = 640; game.body.vx = 370;
  for (let n = 0; n < 240 && game.room.id === 'P1-1'; n++) game.step(DT, { right: true });
  assert.equal(game.room.id, 'P1-2');
  assert.equal(game.phase, 'transition');
  assert.equal(game.pan.side, 'right');
  assert.ok(game.body.x < 40 && game.body.vx > 300, `came in at ${game.body.x} moving ${game.body.vx}`);
  for (let n = 0; n < 0.5 * 240; n++) game.step(DT, { right: true });
  assert.equal(game.phase, 'play');
  assert.equal(game.pan, null);
  const spawn = { ...game.spawn };
  game.die('glass');
  for (let n = 0; n < 240; n++) game.step(DT, {});
  assert.equal(game.room.id, 'P1-2');
  assert.deepEqual([game.body.x, game.body.y], [spawn.x, spawn.y]);
});

test('every day is one map: rooms side by side, each leading into the next, the last out of the day', () => {
  for (const map of campaign.maps) map.rooms.forEach((room, i) => {
    assert.equal(JSON.stringify(room.at), JSON.stringify([i, 0]), `${room.id} position`);
    assert.equal(room.exits.right, map.rooms[i + 1]?.id ?? null, `${room.id} leads on`);
    assert.ok(!room.tiles.join('').includes('O'), `${room.id} has no door`);
  });
});

test('half on a sofa still bounces, with the floor on either side, and drops a belt push', () => {
  for (const floor of ['#####SSSS#', '>>>>>SSSS>']) {
    const game = sandbox([...Array(15).fill(E), '.P' + '.'.repeat(30), floor + '#'.repeat(22), F]);
    game.body.x = 5 * 40; game.body.y = 600; game.body.vy = 300; game.body.carry = 180;   // straddling the first sofa tile
    let bounced = false;
    for (let n = 0; n < 60 && !bounced; n++) { game.step(DT, {}); bounced = game.events.includes('bounce'); game.events.length = 0; }
    assert.ok(bounced, `${floor}: no bounce`);
    assert.equal(game.body.carry, 0);
  }
});

test('a cocktail follows Jim, counts only when he lands, and a death before that loses it', () => {
  const game = make('L3-1');
  const cap = game.entities.find(e => e.kind === 'cap');
  assert.ok(cap, 'L3-1 has a cocktail');
  // carried in the air: not yet counted
  game.body.x = cap.x; game.body.y = cap.y + 40; game.body.vy = -100; game.body.grounded = false;
  game.step(DT, {});
  assert.ok(game.berry, 'picked up');
  assert.equal(game.capsGot.size, 0);
  game.die('glass');
  assert.equal(game.berry, null, 'lost on death');
  for (let n = 0; n < 240; n++) game.step(DT, {});
  assert.ok(game.entities.find(e => e.kind === 'cap' && !e.got), 'back in place after the respawn');
  // picked up again and carried down to the floor: now it counts
  const again = game.entities.find(e => e.kind === 'cap');
  game.body.x = again.x; game.body.y = again.y + 40; game.body.vy = 0; game.body.grounded = false;
  for (let n = 0; n < 3 * 240 && !game.capsGot.size; n++) game.step(DT, {});
  assert.equal(game.capsGot.size, 1);
  assert.equal(game.berry, null);
});

test('a drunk bottle comes back three seconds later once Jim has stepped off it', () => {
  const game = make('L2-1');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  const bottle = game.entities.find(e => e.kind === 'bottle' && e.got);
  run(game, 0.5, { right: true });   // off its spot, up against the wall
  run(game, 2.4, {});
  assert.equal(bottle.got, true, 'not before three seconds');
  run(game, 0.3, {});
  assert.equal(bottle.got, false, 'back after three seconds');
});
