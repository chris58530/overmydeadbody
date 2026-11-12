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

test('days 1 and 2 are one map side by side; day 3 climbs and falls, each room leading into the next', () => {
  for (const map of campaign.maps.slice(0, 2)) map.rooms.forEach((room, i) => {
    assert.equal(JSON.stringify(room.at), JSON.stringify([i, 0]), `${room.id} position`);
    assert.equal(room.exits.right, map.rooms[i + 1]?.id ?? null, `${room.id} leads on`);
  });
  const day3 = campaign.maps[2].rooms, step = { right: [1, 0], top: [0, -1], bottom: [0, 1] };
  const wayOf = room => Object.keys(step).find(side => room.exits[side] !== undefined);
  assert.equal(day3.length, 10);
  day3.forEach((room, i) => {
    const next = day3[i + 1], way = wayOf(room);
    assert.ok(!room.tiles.join('').includes('O'), `${room.id} has no door`);
    assert.equal(room.exits[way], next?.id ?? null, `${room.id} leads on`);
    if (next) assert.equal(JSON.stringify(next.at), JSON.stringify([room.at[0] + step[way][0], room.at[1] + step[way][1]]), `${next.id} stands where ${room.id} leads`);
  });
  assert.deepEqual([...new Set(day3.map(wayOf))].sort(), ['bottom', 'right', 'top'], 'the day goes right, up and down');
  // no room goes on at the same spot as the one before it (no room that is flat all the way through)
  const seams = day3.map(room => ({ right: () => 'right ' + room.tiles.findIndex(row => row[31] === '.'), top: () => 'top ' + room.tiles[0].indexOf('.'), bottom: () => 'bottom ' + room.tiles[17].indexOf('.') })[wayOf(room)]());
  seams.slice(1).forEach((seam, i) => assert.notEqual(seam, seams[i], seams.join(', ')));
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
  const game = make('L2-1');
  const cap = game.entities.find(e => e.kind === 'cap');
  assert.ok(cap, 'L2-1 has a cocktail');
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

test('day 3: one grade leaves the body as a plank and wakes Jim at his bottle; walking back into it takes the body away', () => {
  const game = make('L3-1');
  assert.equal(game.cells, 1, 'the first room holds Jim to one grade');
  game.step(DT, { skill: 'wrestler' });
  assert.ok(!game.entities.some(e => e.kind === 'corpse'), 'no bottle drunk yet: nothing to wake at');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  const bottle = game.entities.find(e => e.kind === 'bottle');
  run(game, 0.2, { right: true });
  game.step(DT, { jump: true, jumpPressed: true, right: true });
  run(game, 0.2, { jump: true, right: true });
  const at = { x: game.body.x, y: game.body.y };
  game.step(DT, { skill: 'wrestler', right: true });
  const corpse = game.entities.find(e => e.kind === 'corpse');
  assert.ok(corpse, 'body left behind');
  assert.ok(Math.abs(corpse.x - at.x) < 4 && Math.abs(corpse.y - (at.y - 22)) < 4, 'where Jim was');
  assert.equal(game.targetStage(), 0, 'the grade is spent');
  assert.ok(Math.abs(game.body.x - bottle.x) < 1, 'woke at the bottle');
  assert.ok(bottle.got && bottle.corpse === corpse, 'the bottle holds the body');
  run(game, 4, {});
  assert.ok(bottle.got, 'stays empty while the body is there, even standing on its spot');
  run(game, 0.6, { left: true });
  run(game, 0.6, { right: true });
  assert.ok(!game.entities.includes(corpse), 'walking back in takes the body away');
  assert.equal(game.targetStage(), 1, 'and the bottle is drunk again');
});

test('day 3 holds Jim to one bottle: the world is only drunk or sober, and J is only ever the body', () => {
  assert.equal(campaign.maps[2].cells, 1);
  for (const room of campaign.maps[2].rooms) assert.ok(Object.keys(room.stages || {}).every(k => k === '1'), `${room.id}: one drunk world`);
  const game = make('L3-2');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  game.step(DT, { skill: 'wrestler' });
  assert.ok(game.entities.some(e => e.kind === 'corpse'), 'the body');
  assert.notEqual(game.state, 'lift', 'not the throw');
});

test('day 3: the drunk bridge goes three seconds after the body, and the body stays', () => {
  const game = make('L3-4');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  const bridge = () => game.tiles[6][6];
  assert.notEqual(bridge(), '#', 'no bridge yet');
  run(game, 3.1, {});
  assert.equal(bridge(), '#', 'the bridge comes three seconds after the sip');
  game.step(DT, { skill: 'wrestler' });
  const corpse = game.entities.find(e => e.kind === 'corpse');
  assert.ok(corpse, 'body left');
  run(game, 2.8, {});
  assert.equal(bridge(), '#', 'still there just before three seconds');
  run(game, 0.3, {});
  assert.notEqual(bridge(), '#', 'gone after three seconds');
  assert.ok(game.entities.includes(corpse), 'the body stays');
});

test('L3-4: no standing on the body: three seconds after it, a sober wall comes down where Jim would stand', () => {
  const game = make('L3-4');
  while (game.targetStage() === 0) game.step(DT, { right: true });
  run(game, 3.1, {});
  Object.assign(game.body, { x: 780, y: 250, vy: 0, grounded: false });
  game.step(DT, { skill: 'wrestler' });
  const corpse = game.entities.find(e => e.kind === 'corpse');
  assert.ok(corpse, 'body left over the glass');
  Object.assign(game.body, { x: corpse.x, y: corpse.y, vx: 0, vy: 0, grounded: true });
  run(game, 2.8, {});
  assert.notEqual(game.state, 'dead', 'safe for now');
  run(game, 0.4, {});
  assert.equal(game.state, 'dead', 'the wall lands on him');
});

// The body's other uses (sensors, beams, walkers) are in the engine but in no room of day 3 yet: rooms of their own.
function bodyRoom(rows) { const game = sandbox(rows, ['wrestler']); game.map.zui = 'corpse'; return game; }
const machines = [...Array(13).fill(E), '..........HH...........G........', '..........HH...........G........', '.P..D.....HH...........G........', F, F];

const leaveAt = (game, x, y) => {
  while (game.targetStage() === 0 && !game.anchor) game.body.x = game.entities.find(e => e.kind === 'bottle').x, game.step(DT, {});
  game.body.x = x; game.body.y = y; game.body.vy = 0; game.chillAirUsed = false;
  game.step(DT, { skill: 'wrestler' });
  return game.entities.find(e => e.kind === 'corpse');
};

test('a sensor works the door while Jim or a body is in it, and taking the body away shuts it', () => {
  const game = bodyRoom(machines);
  const door = () => game.tiles[14][23];
  assert.equal(door(), 'G', 'shut to start with');
  game.body.x = 440; game.body.y = 640; game.body.vy = 0; game.step(DT, {});
  assert.equal(door(), '.', 'Jim in the sensor opens it');
  game.body.x = 60; game.body.y = 640; game.step(DT, {});
  assert.equal(door(), 'G', 'and it shuts when he leaves');
  const corpse = leaveAt(game, 440, 640);
  assert.ok(corpse);
  run(game, 0.5, {});
  assert.equal(door(), '.', 'a body holds it open');
  game.step(DT, { skill: 'wrestler' });
  game.step(DT, {});
  assert.ok(!game.entities.includes(corpse));
  assert.equal(door(), 'G');
});

test('a door does not shut on Jim', () => {
  const game = bodyRoom(machines);
  game.body.x = 440; game.body.y = 640; game.step(DT, {});
  game.body.x = 940; game.body.y = 640; game.body.vy = 0;
  run(game, 0.1, {});
  assert.equal(game.tiles[14][23], '.', 'he is standing in it');
  assert.notEqual(game.state, 'dead');
});

test('J with no grade left calls the last body back and wakes Jim at its bottle, from anywhere', () => {
  const game = make('L3-2');
  const corpse = leaveAt(game, 640, 360);
  const bottle = game.entities.find(e => e.kind === 'bottle');
  assert.equal(game.targetStage(), 0);
  game.body.x = 500; game.body.y = 300; game.body.vy = 0;
  run(game, 0.1, {});
  game.step(DT, { skill: 'wrestler' });
  assert.ok(!game.entities.includes(corpse), 'the body is gone');
  assert.ok(Math.abs(game.body.x - bottle.x) < 1, 'Jim is at the bottle');
  run(game, 0.2, {});
  assert.notEqual(game.state, 'dead');
  assert.equal(game.targetStage(), 1, 'and has drunk it again');
});

test('a beam kills, and a body across it stops it short', () => {
  const game = bodyRoom([...Array(10).fill(E), '................V...............', ...Array(4).fill(E), '.P..............................', F, F]);
  const beam = game.beams.find(v => v.x === 16);
  assert.equal(game.beamEnd(beam), 640, 'down to the floor');
  game.entities.push({ kind: 'corpse', x: 660, y: 540, w: 84, t: 0, face: 1 });
  assert.equal(game.beamEnd(beam), 540, 'stops at the body');
  game.body.x = 660; game.body.y = 640; game.body.vy = 0;
  run(game, 0.1, {});
  assert.notEqual(game.state, 'dead', 'safe under it');
  game.entities = game.entities.filter(e => e.kind !== 'corpse');
  run(game, 0.1, {});
  assert.equal(game.state, 'dead');
});

test('a body turns a walker back like a wall', () => {
  const game = bodyRoom([...Array(15).fill(E), '.P........R.....................', F, F]);
  const chair = game.entities.find(e => e.kind === 'patrol');
  game.body.x = 1200;   // out of the way
  game.entities.push({ kind: 'corpse', x: 600, y: 618, w: 84, t: 0, face: 1 });
  let right = 0;
  for (let n = 0; n < 12 * 240; n++) { game.step(DT, {}); right = Math.max(right, chair.x); }
  assert.ok(right < 600 - 42 && chair.alive, `kept to its side of the body (got to ${right.toFixed(0)})`);
});

// Nothing the jump home cannot fix is left: from every spot Jim can get to on his feet, sober, with no body out,
// he can walk or jump to a bottle or a way out without dying. Bottles and ways out end the search.
test('day 3 has no dead ends: no room makes you die to start over', () => {
  const STEP = 1 / 120, cellOf = g => [Math.floor(g.body.x / 40), Math.round(g.body.y / 40)];
  for (const room of campaign.maps[2].rooms) {
    const fresh = (x, y, booze) => {
      const g = make(room.id);
      g.entities = g.entities.filter(e => e.kind !== 'patrol');
      if (booze) { g.booze = 1; g.stage = 0; }
      // Jim is wider than a tile: beside a wall he stands a little off its middle
      const clear = [0, -4, 4].map(d => x + d).find(cx => !g.hitsSolid(g.box({ x: cx, y }))) ?? x;
      Object.assign(g.body, { x: clear, y, vx: 0, vy: 0, grounded: true });
      g.step(STEP, {});
      return g;
    };
    const atGoal = g => g.phase !== 'play' || g.room.id !== room.id || g.targetStage() > 0 && g.anchor;
    // one move: returns the cell Jim stands on after it, 'goal', or null (dead or nowhere)
    const move = ([cx, cy], dir, jump, steer, fart) => {
      // a beam may run through the middle of the tile: he stands to one side of it
      const g = [0, 15, -15].map(d => fresh(cx * 40 + 20 + d, cy * 40, fart)).find(g => g.state !== 'dead' && g.body.y === cy * 40);
      if (!g) return null;
      if (!fart && atGoal(g)) return 'goal';
      const key = dir > 0 ? { right: true } : dir < 0 ? { left: true } : {};
      if (jump) g.step(STEP, { ...key, jump: true, jumpPressed: true });
      let farted = !fart;
      for (let n = 0; n < 360; n++) {
        const input = { ...(n < steer ? key : {}), jump: jump > n };
        if (!farted && g.body.vy >= 0 && !g.body.grounded) { input.kPressed = true; farted = true; }
        g.step(STEP, input);
        if (g.state === 'dead') return null;
        if (!fart && atGoal(g)) return 'goal';
        if (g.phase !== 'play' || g.room.id !== room.id) return 'goal';
        // a cart always rolls back to where it set off: riding it is never stuck
        if (g.body.grounded && g.body.cart >= 0) return 'goal';
        if (g.body.grounded && (jump ? n > 2 : Math.floor(g.body.x / 40) !== cx || n > 60)) return cellOf(g).join();
      }
      return null;
    };
    const moves = c => [[1, 0, 90], [-1, 0, 90], [0, 90, 0], [1, 90, 180], [-1, 90, 180], [1, 90, 24], [-1, 90, 24], [1, 20, 180], [-1, 20, 180]].map(([d, j, s]) => move(c, d, j, s));
    const g0 = make(room.id), start = [Math.floor(g0.spawn.x / 40), Math.round(g0.spawn.y / 40)].join();
    const seen = new Set([start]), edges = new Map();
    const parse = k => k.split(',').map(Number);
    for (const k of seen) {
      const out = moves(parse(k)).filter(Boolean);
      // a double jump gets further on a sip; what it reaches counts as somewhere Jim can be, not as a way back
      const further = [[1, 90, 180, 1], [-1, 90, 180, 1], [0, 90, 0, 1]].map(([d, j, s, f]) => move(parse(k), d, j, s, f)).filter(v => v && v !== 'goal');
      edges.set(k, out);
      for (const v of [...out, ...further]) if (v !== 'goal') seen.add(v);
    }
    const good = new Set(), reverse = [...edges];
    for (let changed = true; changed;) {
      changed = false;
      for (const [k, out] of reverse) if (!good.has(k) && out.some(v => v === 'goal' || good.has(v))) { good.add(k); changed = true; }
    }
    const stuck = [...seen].filter(k => !good.has(k));
    assert.deepEqual(stuck, [], `${room.id}: stuck at`);
  }
});

test('day 3 is one walk: each room hands Jim on to the next where he left it, alive and on his feet', () => {
  const rooms = campaign.maps[2].rooms;
  rooms.slice(0, -1).forEach((room, i) => {
    const game = make(room.id), steps = AUTO.puzzleRoute(game, routes);
    game.enterRoom(room.id);
    for (let f = 0; f < steps.at(-1).end && game.room === room; f++) game.step(AUTO.STEP_DT, AUTO.puzzleInput(steps, f));
    assert.equal(game.room.id, rooms[i + 1].id, `${room.id} leads on`);
    assert.ok(game.pan, `${room.id}: the camera slides over`);
    const came = { x: game.body.x, y: game.body.y };
    assert.notDeepEqual([came.x, came.y], [game.spawn.x, game.spawn.y], `${room.id}: went on from where it left, not from the spawn`);
    for (let n = 0; n < 2 * 240; n++) game.step(DT, {});
    assert.notEqual(game.state, 'dead', `${rooms[i + 1].id}: alive after coming in`);
    assert.ok(game.body.grounded, `${rooms[i + 1].id}: standing after coming in`);
  });
});
