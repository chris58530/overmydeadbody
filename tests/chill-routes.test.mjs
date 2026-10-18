import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { plans } from '../handoff/kit/chill-room-plans.mjs';
import { recordRoom, replayRoom } from '../handoff/kit/chill-room-tools.mjs';

const context = vm.createContext({});
const html = readFileSync(new URL('../prototype/game.html', import.meta.url), 'utf8');
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, AUTO } = context.Drunk;
const campaign = parseCampaign(readFileSync(new URL('../prototype/chill-puzzles.json', import.meta.url), 'utf8'));
const DT = 1 / 240;
const rooms = campaign.maps[0].rooms;

function make(id) {
  const game = new Game(campaign);
  game.enterRoom(id);
  game.phase = 'play';
  const spawnY = game.room.tiles.findIndex(row => row.includes('P'));
  const spawnX = game.room.tiles[spawnY].indexOf('P');
  assert.equal(game.body.x, (spawnX + 0.5) * 40);
  assert.equal(game.body.y, (spawnY + 1) * 40);
  return game;
}

function assertExit(game) {
  const index = rooms.findIndex(room => room.id === game.room.id);
  const next = rooms[index + 1];
  assert.equal(game.phase, next ? 'transition' : 'mapEnd', `${game.room.id}: wrong exit phase`);
  if (next) assert.equal(game.nextRoom, next.id, `${game.room.id}: exit must continue to the next room`);
}

function tick(game, input = {}) {
  game.step(DT, input);
  assert.notEqual(game.state, 'dead', `${game.room.id}: safe routes must not kill Jim`);
  game.particles.length = 0;
  game.bubbles.length = 0;
}

// Walk/jump to each visible stair. The small controller only aims for the
// middle of a broad 120 px step; it does not teleport or change game state.
function stair(game, targetX, targetY) {
  let lastJump = -1000;
  for (let frame = 0; frame < 240 * 5; frame++) {
    const b = game.body;
    const desired = Math.max(-220, Math.min(220, (targetX - b.x) * 8));
    const input = { jump: true };
    if (b.vx < desired - 8) input.right = true;
    else if (b.vx > desired + 8) input.left = true;
    if (b.grounded && frame - lastJump > 72 && b.y > targetY + 1) {
      input.jumpPressed = true; lastJump = frame;
    }
    tick(game, input);
    if (b.grounded && Math.abs(b.x - targetX) < 3 && Math.abs(b.y - targetY) < 1) return;
  }
  assert.fail(`${game.room.id}: did not reach stair (${targetX}, ${targetY}), got (${game.body.x}, ${game.body.y})`);
}

function rightUntilExit(game, seconds = 7) {
  for (let i = 0; i < seconds * 240 && game.phase === 'play'; i++) tick(game, { right: true });
}

function climbBridge(game) {
  for (const [x, y] of [[200, 560], [320, 480], [440, 400], [560, 320], [680, 240], [740, 240]]) stair(game, x, y);
}

function climbLaunchShelf(game) {
  for (const [x, y] of [[200, 560], [320, 480], [440, 400]]) stair(game, x, y);
}

test('practice room: one first-grade J and ordinary steering reach the door from spawn', () => {
  const game = make('chill-1');
  tick(game, { skill: 'wrestler', right: true });
  rightUntilExit(game);
  assert.equal(game.phase, 'transition');
  assert.equal(game.nextRoom, 'chill-2');
});

test('bridge room: climb from spawn, lower grade, cross the lingering roof, and safely drop to the door', () => {
  const game = make('chill-2');
  climbBridge(game);
  tick(game, { kPressed: true });
  assert.equal(game.booze, 1);
  assert.equal(game.stage, 2);
  rightUntilExit(game);
  assert.equal(game.phase, 'transition');
  assert.equal(game.nextRoom, 'chill-3');
});

test('bridge room: removing the delay makes the same walking route fall outside the courtyard', () => {
  const game = make('chill-2');
  climbBridge(game);
  tick(game, { kPressed: true });
  game.applyStage(1, true); // Experimental control: swap the world immediately.
  rightUntilExit(game);
  assert.equal(game.phase, 'play');
  assert.ok(game.body.x < 800);
});

test('bridge room: a third-grade J from spawn cannot enter the roofed courtyard', () => {
  const game = make('chill-2');
  tick(game, { gradeUpPressed: true });
  for (let i = 0; i < 240 * 3.1; i++) tick(game);
  tick(game, { skill: 'wrestler', right: true });
  rightUntilExit(game);
  assert.equal(game.phase, 'play');
  assert.equal(game.stage, 3);
  assert.ok(game.body.y <= 240);
});

test('launch room: climb from spawn and borrow the old third-grade shelf for a second-grade J', () => {
  const game = make('chill-3');
  climbLaunchShelf(game);
  tick(game, { kPressed: true });
  assert.equal(game.booze, 2);
  assert.equal(game.stage, 3);
  tick(game, { skill: 'wrestler', right: true });
  assert.equal(game.state, 'charge');
  rightUntilExit(game);
  assertExit(game);
});

test('launch room: without the delay, the same second-grade J loses its runway and cannot reach the high door', () => {
  const game = make('chill-3');
  climbLaunchShelf(game);
  tick(game, { kPressed: true });
  game.applyStage(2, true);
  tick(game, { skill: 'wrestler', right: true });
  rightUntilExit(game);
  assert.equal(game.phase, 'play');
  assert.equal(game.body.y, 640);
});

test('launch room: a third-grade J from the launch shelf still needs a world-state change at the final gate', () => {
  const game = make('chill-3');
  climbLaunchShelf(game);
  tick(game, { skill: 'wrestler', right: true });
  rightUntilExit(game);
  assert.equal(game.phase, 'play');
  assert.ok(game.body.x < 28 * 40);
});

test('launch room: lowering to second grade on the ground cannot clear the high landing', () => {
  const game = make('chill-3');
  tick(game, { kPressed: true });
  for (let i = 0; i < 240 * 3.1; i++) tick(game);
  tick(game, { skill: 'wrestler', right: true });
  rightUntilExit(game);
  assert.equal(game.phase, 'play');
  assert.equal(game.body.y, 640);
});

const autoRoutes = JSON.parse(readFileSync(new URL('../prototype/chill-routes.json', import.meta.url), 'utf8'));
test('recorded automatic routes are exact-match, 240 Hz data', () => {
  assert.equal(autoRoutes.stepHz, 240);
  assert.equal(autoRoutes.rules, 'chill-puzzle');
  assert.deepEqual([...rooms.map(room => room.id)], Array.from({ length: 7 }, (_, index) => `chill-${index + 1}`));
  assert.deepEqual(Object.keys(autoRoutes.rooms).sort(), [...rooms.map(room => `${campaign.maps[0].id}:${room.id}`)].sort());
  for (const room of rooms) {
    const game = make(room.id);
    assert.equal(autoRoutes.rooms[`${game.map.id}:${room.id}`].signature, AUTO.puzzleSignature(game), `${room.id}: stale signature`);
  }
  const game = make('chill-1');
  const route = autoRoutes.rooms[`${game.map.id}:${game.room.id}`];
  assert.equal(route.signature, AUTO.puzzleSignature(game));
  assert.equal(AUTO.STEP_DT, DT);
  const original = game.room.booze;
  game.room.booze = 2;
  try { assert.equal(AUTO.puzzleRoute(game, autoRoutes), null); }
  finally { game.room.booze = original; }
});

test('automatic route integration rejects stale signatures and invalid frame counts, and stops input at the end', () => {
  const game = make('chill-1');
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

const expectedSkills = {
  'chill-4': [{ grade: 2, world: 1, event: 'charge' }],
  'chill-5': [{ grade: 3, world: 2, event: 'bigfart' }],
  'chill-6': [{ grade: 1, world: 2, event: 'lift' }],
  'chill-7': [{ grade: 3, world: 2, event: 'bigfart' }, { grade: 2, world: 3, event: 'charge' }],
};

for (const { id } of rooms) {
  test(`${id}: integrated AUTO methods independently replay the recorded route from spawn to the exit`, () => {
    const game = make(id);
    const steps = AUTO.puzzleRoute(game, autoRoutes);
    assert.ok(steps);
    const frameCount = steps.at(-1).end;
    const events = new Set();
    const skillUses = [];
    let gradeChanges = 0;
    for (let frame = 0; frame < frameCount; frame++) {
      assert.equal(game.phase, 'play', `${id}: route must stop at the exit`);
      game.events.length = 0;
      const grade = game.targetStage();
      tick(game, AUTO.puzzleInput(steps, frame));
      if (grade !== game.targetStage()) gradeChanges++;
      for (const event of game.events) events.add(event);
      if (game.events.includes('drink')) skillUses.push({ grade: game.targetStage(), world: game.stage });
    }
    assert.ok(frameCount > 0 && frameCount <= 240 * 60, `${id}: rooms should remain short`);
    assertExit(game);
    if (expectedSkills[id]) {
      assert.ok(gradeChanges >= expectedSkills[id].length, `${id}: route must actively change the grade`);
      assert.ok(events.has('warn'), `${id}: route must start a delayed world change`);
      for (const expected of expectedSkills[id]) {
        assert.ok(skillUses.some(use => use.grade === expected.grade && use.world === expected.world), `${id}: use grade ${expected.grade} while the world is still grade ${expected.world}`);
        assert.ok(events.has(expected.event), `${id}: route must perform ${expected.event}`);
      }
      assert.ok(events.has('throw'), `${id}: the automatic chain must complete`);
    }
  });

  if (expectedSkills[id]) {
    test(`${id}: the puzzle still works with half a second of hesitation after every grade change`, () => {
      const delayed = recordRoom(campaign, id, plans[id], { actionDelay: 0.5 });
      assertExit(delayed.game);
      const replay = replayRoom(campaign, id, delayed);
      assertExit(replay);
    });
  }

  if (id === 'chill-4' || id === 'chill-5') {
    test(`${id}: switching the world immediately blocks the same ordinary-input route`, () => {
      assert.throws(
        () => recordRoom(campaign, id, plans[id], { instantWorld: true }),
        error => error.code === 'ERR_ASSERTION' && error.message.includes(`${id}: door not reached`),
      );
    });
  }
}

test('chill-7: the final launch stays safe even when the player waits until the world has already changed', () => {
  let skillCalls = 0;
  const delayed = recordRoom(campaign, 'chill-7', recorder => {
    plans['chill-7']({
      ...recorder,
      skill: (...args) => {
        if (++skillCalls === 2) {
          recorder.wait(1);
          assert.equal(recorder.game.stage, 2);
          assert.equal(recorder.game.stageWarn, null);
        }
        recorder.skill(...args);
      },
    });
  });
  assert.equal(skillCalls, 2);
  assertExit(delayed.game);
  assertExit(replayRoom(campaign, 'chill-7', delayed));
});
