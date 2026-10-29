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
