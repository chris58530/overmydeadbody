import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export const STEP_HZ = 240;
export const grid = () => Array.from({ length: 18 }, () => Array(32).fill('.'));
export const rect = (g, ch, x0, y0, x1 = x0, y1 = y0) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
};
export function room(id, name, theme, booze, lines, draw, overlays = {}, portalTarget = null) {
  const g = grid(); rect(g, '#', 0, 16, 31, 17); draw(g);
  const stages = {};
  for (const [grade, paint] of Object.entries(overlays)) { const layer = grid(); paint(layer); stages[grade] = layer.map(row => row.join('')); }
  return { id, name, theme, booze, tiles: g.map(row => row.join('')), ...(Object.keys(stages).length ? { stages } : {}), exits: {}, portalTarget, lines };
}

let engine;
export function getEngine() {
  if (!engine) {
    const context = vm.createContext({});
    const source = readFileSync(new URL('../../prototype/game.html', import.meta.url), 'utf8');
    vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    engine = context.Drunk;
  }
  return engine;
}
export const routeSignature = game => JSON.stringify([game.campaign.rules, game.map.id, game.map.cells, game.map.abilities, game.room]);

// Plans may inspect the simulation but can change it only through normal inputs.
// The browser receives just the recorded inputs, never these controllers.
export function recordRoom(campaign, id, plan, options = {}) {
  const { Game } = getEngine();
  const game = new Game(campaign); game.enterRoom(id); game.phase = 'play';
  const signature = routeSignature(game), steps = [], trace = [];
  let frames = 0, lastKey = '';
  const tick = (input = {}) => {
    if (game.phase !== 'play') return;
    assert.ok(frames < STEP_HZ * 120, `${id}: plan exceeded two minutes`);
    const key = JSON.stringify(input);
    if (key === lastKey) steps.at(-1).frames++;
    else { steps.push({ frames: 1, input: { ...input } }); lastKey = key; }
    game.step(1 / STEP_HZ, input); frames++;
    if (options.instantWorld && game.stageWarn) game.updateChillStage(3);
    assert.notEqual(game.state, 'dead', `${id}: route must remain safe`);
    if (game.events.length) trace.push({ frame: frames, x: game.body.x, y: game.body.y, grade: game.targetStage(), world: game.stage, events: [...game.events] });
    game.events.length = 0; game.particles.length = 0; game.bubbles.length = 0;
  };
  const wait = (seconds, input = {}) => { for (let n = 0; n < Math.round(seconds * STEP_HZ) && game.phase === 'play'; n++) tick(input); };
  const until = (condition, seconds = 6, input = {}) => {
    for (let n = 0; n < Math.round(seconds * STEP_HZ) && game.phase === 'play' && !condition(game); n++) tick(input);
    assert.ok(condition(game) || game.phase !== 'play', `${id}: condition missed at (${game.body.x.toFixed(1)}, ${game.body.y.toFixed(1)}), ${game.state}`);
  };
  const stair = (x, y, seconds = 6) => {
    let lastJump = -1000;
    for (let n = 0; n < seconds * STEP_HZ && game.phase === 'play'; n++) {
      const b = game.body, desired = Math.max(-220, Math.min(220, (x - b.x) * 8)), input = { jump: true };
      if (b.vx < desired - 8) input.right = true;
      else if (b.vx > desired + 8) input.left = true;
      if (b.grounded && n - lastJump > 72 && b.y > y + 1) { input.jumpPressed = true; lastJump = n; }
      tick(input);
      if (b.grounded && Math.abs(b.x - x) < 3 && Math.abs(b.y - y) < 1) return;
    }
    assert.fail(`${id}: cannot reach (${x}, ${y}); at (${game.body.x.toFixed(1)}, ${game.body.y.toFixed(1)})`);
  };
  const grade = delta => {
    const before = game.targetStage(); tick(delta > 0 ? { gradeUpPressed: true } : { kPressed: true });
    assert.equal(game.targetStage(), before + delta, `${id}: grade change denied`);
    if (options.actionDelay) wait(options.actionDelay);
  };
  const recorder = {
    game, tick, wait, until, stair, grade,
    skill: (direction = 1) => tick({ skill: 'wrestler', ...(direction > 0 ? { right: true } : { left: true }) }),
    world: () => until(g => !g.stageWarn && !g.stageDeferred.length, 5),
    land: () => until(g => g.body.grounded && !g.chillAirUsed, 8),
    finish: (input = { right: true }, seconds = 10) => { wait(seconds, input); assert.notEqual(game.phase, 'play', `${id}: door not reached`); },
  };
  plan(recorder);
  if (options.requireExit !== false) assert.notEqual(game.phase, 'play', `${id}: plan did not exit`);
  return { game, signature, steps, frames, trace };
}

export function replayRoom(campaign, id, route) {
  const { Game } = getEngine();
  const game = new Game(campaign); game.enterRoom(id); game.phase = 'play';
  assert.equal(routeSignature(game), route.signature, `${id}: stale route`);
  for (const step of route.steps) for (let frame = 0; frame < step.frames; frame++) {
    assert.equal(game.phase, 'play', `${id}: route continues after exit`);
    game.step(1 / STEP_HZ, step.input);
    assert.notEqual(game.state, 'dead', `${id}: replay died`);
    game.events.length = 0; game.particles.length = 0; game.bubbles.length = 0;
  }
  assert.notEqual(game.phase, 'play', `${id}: replay did not exit`);
  return game;
}
