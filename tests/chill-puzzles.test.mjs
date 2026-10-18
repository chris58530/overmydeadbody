import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../prototype/game.html', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, T } = context.Drunk;
const DT = 1 / 240;

function grid(cells = []) {
  const rows = Array.from({ length: 18 }, () => Array(32).fill('.'));
  for (const [x, y, tile] of cells) rows[y][x] = tile;
  return rows.map(row => row.join(''));
}

function make({ booze = 1, tiles, stages, rules = 'chill-puzzle', npcs } = {}) {
  const room = {
    id: 'room',
    tiles: tiles || grid([[5, 15, 'P'], ...Array.from({ length: 32 }, (_, x) => [x, 16, '#'])]),
    exits: { left: null }, booze,
    ...(stages ? { stages } : {}), ...(npcs ? { npcs } : {}),
  };
  const data = parseCampaign(JSON.stringify({
    format: 'drunken-rooms', version: 2, ...(rules ? { rules } : {}),
    maps: [{ id: 'test', cells: 3, rooms: [room] }],
  }));
  const game = new Game(data);
  game.phase = 'play';
  return game;
}

function tick(game, seconds, input = {}) {
  for (let i = 0; i < Math.round(seconds / DT); i++) game.step(DT, input);
}

function until(game, condition, seconds = 5, input = {}) {
  for (let i = 0; i < Math.round(seconds / DT) && !condition(); i++) game.step(DT, input);
  assert.ok(condition(), `condition not reached: state=${game.state}, phase=${game.phase}`);
}

test('chill rules are opt-in and idle thinking never changes the selected grade', () => {
  const chill = make();
  tick(chill, 8);
  assert.equal(chill.chill, true);
  assert.equal(chill.booze, 1);
  assert.equal(chill.stage, 1);
  assert.equal(chill.stageWarn, null);
  const legacy = make({ rules: null });
  tick(legacy, 4);
  assert.equal(legacy.chill, false);
  assert.ok(legacy.booze > 1, 'the existing automatic refill remains available');
});

test('grade input changes the body immediately and the airborne world follows after three real seconds', () => {
  const game = make({ stages: { 2: grid([[20, 10, '#']]) } });
  game.body.grounded = false;
  game.body.y = 400;
  game.hitStop = 4;
  game.step(DT, { gradeUpPressed: true });
  assert.equal(game.booze, 2);
  assert.equal(game.stage, 1);
  assert.equal(game.tiles[10][20], '.');
  assert.equal(game.stageWarn.to, 2);
  tick(game, 2.75);
  assert.equal(game.stage, 1);
  tick(game, .25);
  assert.equal(game.stage, 2);
  assert.equal(game.tiles[10][20], '#');
  assert.equal(game.stageWarn, null);
  assert.equal(game.body.grounded, false, 'the change must not wait for a landing or a hit-stop to end');
});

test('pending changes cannot be cancelled, redirected or extended by repeated adjustment inputs', () => {
  const game = make();
  assert.equal(game.changeGrade(1), true);
  game.updateChillStage(1);
  assert.equal(game.changeGrade(1), false);
  assert.equal(game.changeGrade(-1), false);
  game.step(.25, { gradeUpPressed: true, kPressed: true });
  assert.equal(game.booze, 2);
  assert.equal(game.stageWarn.to, 2);
  assert.equal(game.stageWarn.t, 1.75);
  game.updateChillStage(1.75);
  assert.equal(game.stage, 2);
  assert.equal(game.changeGrade(1), true);
  game.updateChillStage(3);
  assert.equal(game.stage, 3);
  assert.equal(game.changeGrade(1), false, 'the upper grade stays at three');
});

test('a small fart lowers one whole grade without launching or accelerating the player', () => {
  const game = make({ booze: 2 });
  Object.assign(game.body, { vx: 123, vy: -45, grounded: false });
  const before = { ...game.body };
  game.fart({ right: true }, 1);
  for (const key of ['x', 'y', 'vx', 'vy', 'grounded', 'face']) assert.equal(game.body[key], before[key], key);
  assert.equal(game.booze, 1);
  assert.equal(game.stage, 2);
  assert.equal(game.stageWarn.to, 1);
  game.updateChillStage(3);
  assert.equal(game.changeGrade(-1), false, 'the lower grade stays at one');
  assert.equal(game.booze, 1);
});

test('K input selects a lower grade and E still gives nearby NPC dialogue priority', () => {
  const lowered = make({ booze: 2 });
  lowered.step(DT, { kPressed: true });
  assert.equal(lowered.booze, 1);
  assert.equal(lowered.body.grounded, true);
  const rows = grid([[5, 15, 'P'], [6, 15, 'N'], ...Array.from({ length: 32 }, (_, x) => [x, 16, '#'])]);
  const game = make({ tiles: rows, npcs: { '6,15': { name: '醉影', start: 'hello', nodes: { hello: { text: '慢慢來。', next: null } } } } });
  game.step(DT, { talkPressed: true });
  assert.equal(game.dialogue.node, 'hello');
  assert.equal(game.booze, 1);
  game.step(DT, { talkPressed: true });
  assert.equal(game.dialogue, null);
  assert.equal(game.booze, 1, 'closing dialogue must not also increase the grade');
  game.body.x = 12 * T;
  game.step(DT, { talkPressed: true });
  assert.equal(game.booze, 2);
});

test('J uses the body grade during the world delay without consuming it', () => {
  const game = make();
  game.changeGrade(1);
  game.step(DT, { skill: 'wrestler' });
  assert.equal(game.stage, 1);
  assert.equal(game.booze, 2);
  assert.equal(game.state, 'charge', 'two body grades choose charge then throw even in the one-grade world');
  assert.equal(game.chillAirUsed, true);
});

test('the complete third-grade move runs as one chain and retains its selected grade', () => {
  const game = make({ booze: 3 });
  game.step(DT, { skill: 'wrestler', right: true });
  const states = [game.state];
  const events = new Set(game.events);
  until(game, () => game.state === 'thrown', 3, { left: true });
  // Event history verifies all three sections even if the head hits the ceiling.
  for (const event of game.events) events.add(event);
  for (const event of ['bigfart', 'charge', 'lift', 'throw']) assert.ok(events.has(event), event);
  assert.equal(states[0], 'free');
  assert.equal(game.booze, 3);
  assert.equal(game.stage, 3);
  assert.equal(game.chillFace, 1);
  assert.equal(game.body.vx > 0, true, 'holding the opposite direction during the chain does not reverse the final throw');
});

test('a completed airborne throw rejects extra J presses and becomes ready on landing', () => {
  const game = make();
  game.step(DT, { skill: 'wrestler' });
  until(game, () => game.state === 'thrown');
  const lifts = game.events.filter(event => event === 'lift').length;
  game.step(DT, { skill: 'wrestler' });
  assert.equal(game.state, 'thrown');
  assert.equal(game.events.filter(event => event === 'lift').length, lifts);
  assert.equal(game.chillAirUsed, true);
  until(game, () => !game.chillAirUsed && game.body.grounded);
  game.step(DT, { skill: 'wrestler' });
  assert.equal(game.state, 'lift');
  assert.equal(game.events.filter(event => event === 'lift').length, lifts + 1);
});

test('throw input stays on the ordinary arc while steering remains available after release', () => {
  const game = make();
  game.step(DT, { skill: 'wrestler', right: true });
  until(game, () => game.state === 'thrown', 1, { left: true, down: true, jump: true });
  assert.equal(game.throwKind, 'mid');
  assert.equal(game.body.vx, context.Drunk.TUNING.throwVX);
  const released = game.body.vx;
  tick(game, .15, { left: true });
  assert.ok(game.body.vx < released, 'A/D still allows a correction after the automatic throw');
});

test('one blocked solid delays only that cell while the rest of the world changes on schedule', () => {
  const game = make({ stages: {
    1: grid([[8, 8, '#']]),
    2: grid([[5, 14, '#'], [20, 10, '#'], [8, 8, '_']]),
  } });
  game.changeGrade(1);
  game.updateChillStage(3);
  assert.equal(game.stage, 2);
  assert.equal(game.stageWarn, null);
  assert.equal(game.tiles[14][5], '.', 'the solid overlapping the body stays intangible');
  assert.equal(game.tiles[10][20], '#', 'a safe new solid appears on time');
  assert.equal(game.tiles[8][8], '.', 'the old platform disappears on time');
  assert.equal(game.stageDeferred.length, 1);
  assert.equal(game.changeGrade(-1), false, 'a second world change waits until the body is clear');
  game.body.x = 12 * T;
  game.updateChillStage(DT);
  assert.equal(game.tiles[14][5], '#');
  assert.equal(game.stageDeferred.length, 0);
  assert.equal(game.changeGrade(-1), true);
  game.updateChillStage(3);
  assert.equal(game.tiles[14][5], '.');
  game.updateChillStage(1);
  assert.equal(game.tiles[14][5], '.', 'a completed deferred cell must not reappear in an older world');
});

test('room retry clears in-flight skills and world changes while keeping collected bottle caps', () => {
  const rows = grid([[5, 15, 'P'], [8, 15, '*'], ...Array.from({ length: 32 }, (_, x) => [x, 16, '#'])]);
  const game = make({ tiles: rows, stages: { 2: grid([[20, 10, '#']]) } });
  game.body.x = 8.5 * T;
  game.updateEntities(0);
  assert.equal(game.capsGot.size, 1);
  game.changeGrade(1);
  game.step(DT, { skill: 'wrestler' });
  game.die('pit');
  until(game, () => game.state !== 'dead');
  assert.equal(game.booze, 1);
  assert.equal(game.stage, 1);
  assert.equal(game.stageWarn, null);
  assert.equal(game.stageDeferred.length, 0);
  assert.equal(game.chain.length, 0);
  assert.equal(game.chillAirUsed, false);
  assert.equal(game.tiles[10][20], '.');
  assert.equal(game.body.x, game.spawn.x);
  assert.equal(game.body.y, game.spawn.y);
  assert.equal(game.capsGot.size, 1);
  assert.equal(game.entities.filter(entity => entity.kind === 'cap').length, 0);
});
