import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { plans, capPlans } from '../handoff/kit/chill-room-plans.mjs';
import { recordRoom, replayRoom } from '../handoff/kit/chill-room-tools.mjs';

const context = vm.createContext({});
const html = readFileSync(new URL('../prototype/game.html', import.meta.url), 'utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, AUTO } = context.Drunk;
const campaign = parseCampaign(readFileSync(new URL('../prototype/chill-puzzles.json', import.meta.url), 'utf8'));
const autoRoutes = JSON.parse(readFileSync(new URL('../prototype/chill-routes.json', import.meta.url), 'utf8'));
const DT = 1 / 240;
const rooms = [...campaign.maps].flatMap((map, mapIndex) => [...map.rooms].map(room => ({ id: room.id, map, mapIndex })));
const plain = value => JSON.parse(JSON.stringify(value));
const where = id => rooms.find(room => room.id === id);

function make(id) {
  const { mapIndex } = where(id);
  const game = new Game(campaign);
  game.startMap(mapIndex);
  game.enterRoom(id);
  game.phase = 'play';
  const spawnY = game.room.tiles.findIndex(row => row.includes('P'));
  const spawnX = game.room.tiles[spawnY].indexOf('P');
  assert.equal(game.body.x, (spawnX + 0.5) * 40);
  assert.equal(game.body.y, (spawnY + 1) * 40);
  return game;
}

function assertExit(game) {
  const list = game.map.rooms, next = list[list.indexOf(game.room) + 1];
  assert.equal(game.phase, next ? 'transition' : 'mapEnd', `${game.room.id}: wrong exit phase`);
  if (next) assert.equal(game.nextRoom, next.id, `${game.room.id}: exit must continue to the next room`);
}

function tick(game, input = {}) {
  game.step(DT, input);
  game.particles.length = 0;
  game.bubbles.length = 0;
}

test('three days of five rooms, one new move per day', () => {
  assert.equal(campaign.rules, 'chill-puzzle');
  assert.deepEqual(plain(campaign.maps.map(map => map.cells)), [1, 2, 3]);
  assert.deepEqual(plain(campaign.maps.map(map => map.rooms.map(room => room.id))), [1, 2, 3].map(day => [1, 2, 3, 4, 5].map(n => `${day}-${n}`)));
  for (const map of campaign.maps) {
    assert.ok(map.intro.includes('J'), `${map.id}: the day intro names its move`);
    for (const room of map.rooms) {
      assert.ok(room.booze >= 0 && room.booze <= map.cells, `${room.id}: start grade inside the day`);
      assert.equal(room.tiles.join('').split('*').length - 1, 1, `${room.id}: one optional bottle cap`);
      assert.ok(Object.keys(room.stages || {}).every(grade => +grade <= map.cells), `${room.id}: overlays only up to the day's grade`);
    }
  }
});

test('recorded automatic routes are exact-match, 240 Hz data', () => {
  assert.equal(autoRoutes.stepHz, 240);
  assert.equal(autoRoutes.rules, 'chill-puzzle');
  assert.deepEqual(Object.keys(autoRoutes.rooms).sort(), rooms.map(room => `${room.map.id}:${room.id}`).sort());
  for (const { id } of rooms) {
    const game = make(id);
    assert.equal(autoRoutes.rooms[`${game.map.id}:${id}`].signature, AUTO.puzzleSignature(game), `${id}: stale signature`);
  }
  const game = make('1-1');
  assert.equal(AUTO.STEP_DT, DT);
  const original = game.room.booze;
  game.room.booze = 1;
  try { assert.equal(AUTO.puzzleRoute(game, autoRoutes), null); }
  finally { game.room.booze = original; }
});

test('automatic route integration rejects stale signatures and invalid frame counts, and stops input at the end', () => {
  const game = make('1-1');
  const key = `${game.map.id}:${game.room.id}`;
  const route = autoRoutes.rooms[key];
  const dataWith = entry => ({ ...autoRoutes, rooms: { ...autoRoutes.rooms, [key]: entry } });
  assert.equal(AUTO.puzzleRoute(game, dataWith({ ...route, signature: route.signature + 'stale' })), null);
  for (const frames of [0, -1, 1.5]) {
    assert.equal(AUTO.puzzleRoute(game, dataWith({ ...route, steps: [{ frames, input: { right: true } }] })), null);
  }
  const steps = AUTO.puzzleRoute(game, autoRoutes);
  assert.ok(steps);
  assert.equal(Object.keys(AUTO.puzzleInput(steps, steps.at(-1).end)).length, 0);
  assert.equal(Object.keys(AUTO.puzzleInput(steps, steps.at(-1).end + 240)).length, 0);
});

// Rooms built on the three-second delay: the route must use a skill of one grade
// while the world still shows the grade it came from.
const expectedSkills = {
  '1-3': [{ grade: 1, world: 0, event: 'lift' }],
  '1-5': [{ grade: 1, world: 0, event: 'lift' }],
  '2-3': [{ grade: 2, world: 1, event: 'charge' }],
  '2-5': [{ grade: 1, world: 0, event: 'lift' }, { grade: 2, world: 1, event: 'charge' }],
  '3-3': [{ grade: 3, world: 2, event: 'bigfart' }],
  '3-4': [{ grade: 3, world: 2, event: 'bigfart' }],
};

for (const { id } of rooms) {
  test(`${id}: integrated AUTO methods independently replay the recorded route from spawn to the exit`, () => {
    const game = make(id);
    const steps = AUTO.puzzleRoute(game, autoRoutes);
    assert.ok(steps);
    const frameCount = steps.at(-1).end;
    const events = new Set(), skillUses = [];
    for (let frame = 0; frame < frameCount; frame++) {
      assert.equal(game.phase, 'play', `${id}: route must stop at the exit`);
      game.events.length = 0;
      tick(game, AUTO.puzzleInput(steps, frame));
      assert.notEqual(game.state, 'dead', `${id}: safe routes must not kill Jim`);
      for (const event of game.events) events.add(event);
      if (game.events.includes('drink')) skillUses.push({ grade: game.targetStage(), world: game.stage });
    }
    assert.ok(frameCount > 0 && frameCount <= 240 * 20, `${id}: rooms should remain short`);
    assertExit(game);
    for (const expected of expectedSkills[id] || []) {
      assert.ok(skillUses.some(use => use.grade === expected.grade && use.world === expected.world), `${id}: use grade ${expected.grade} while the world is still grade ${expected.world}`);
      assert.ok(events.has(expected.event), `${id}: route must perform ${expected.event}`);
    }
  });

  test(`${id}: one J from the spawn at the starting grade does not clear the room`, () => {
    for (const jumpFirst of [false, true]) {
      const game = make(id);
      if (jumpFirst) {
        tick(game, { jumpPressed: true, jump: true, right: true });
        for (let i = 0; i < 90; i++) tick(game, { jump: true, right: true });
      }
      tick(game, { skill: 'wrestler', right: true });
      for (let i = 0; i < 240 * 8 && game.phase === 'play' && game.state !== 'dead'; i++) tick(game, { right: true });
      assert.equal(game.phase, 'play', `${id}: a single J${jumpFirst ? ' after a jump' : ''} must not reach the door`);
    }
  });

  test(`${id}: the optional bottle cap can be collected`, () => {
    assert.ok(capPlans[id], `${id}: missing cap route`);
    const { game } = recordRoom(campaign, id, capPlans[id], { mapIndex: where(id).mapIndex, requireExit: false });
    assert.ok([...game.capsGot].some(key => key.startsWith(`${game.map.id}:${id}:`)), `${id}: cap route must collect the cap`);
  });

  if (expectedSkills[id]) {
    test(`${id}: the puzzle still works with half a second of hesitation after every grade change`, () => {
      const delayed = recordRoom(campaign, id, plans[id], { actionDelay: 0.5, mapIndex: where(id).mapIndex });
      assertExit(delayed.game);
      assertExit(replayRoom(campaign, id, delayed, where(id).mapIndex));
    });

    test(`${id}: without the delay, the same route with the same half-second hesitation fails`, () => {
      assert.throws(
        () => recordRoom(campaign, id, plans[id], { instantWorld: true, actionDelay: 0.5, mapIndex: where(id).mapIndex }),
        error => error.code === 'ERR_ASSERTION' && error.message.startsWith(`${id}:`),
      );
    });
  }
}

// Rooms that need a grade change for the world itself (a roof to fall through, a wall that must go,
// an awning the rise cannot clear): staying at the starting grade never reaches the door.
for (const id of ['1-4', '2-3', '2-4', '2-5', '3-2', '3-3', '3-4', '3-5']) {
  test(`${id}: walking, jumping and the starting grade's J alone never reach the door`, () => {
    for (const dir of ['right', 'left']) {
      const game = make(id);
      for (let i = 0; i < 240 * 6 && game.phase === 'play' && game.state !== 'dead'; i++) {
        tick(game, { [dir]: true, jump: true, jumpPressed: i % 120 === 0, ...(i % 240 === 60 ? { skill: 'wrestler' } : {}) });
      }
      assert.equal(game.phase, 'play', `${id}: no grade change, no exit`);
    }
  });
}
