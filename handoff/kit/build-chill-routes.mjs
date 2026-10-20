// Record normal inputs, then independently replay every route before publishing
// local browser data. node handoff/kit/build-chill-routes.mjs
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEngine, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';
import { plans } from './chill-room-plans.mjs';
export { routeSignature } from './chill-room-tools.mjs';

export function buildChillRoutes() {
  const { parseCampaign } = getEngine();
  const campaign = parseCampaign(readFileSync(new URL('../../prototype/chill-puzzles.json', import.meta.url), 'utf8'));
  const result = { stepHz: STEP_HZ, rules: 'chill-puzzle', rooms: {} };
  campaign.maps.forEach((map, mapIndex) => {
    for (const room of map.rooms) {
      assert.ok(plans[room.id], `${room.id}: missing route plan`);
      const recorded = recordRoom(campaign, room.id, plans[room.id], { mapIndex });
      const route = { signature: recorded.signature, steps: recorded.steps };
      const replay = replayRoom(campaign, room.id, route, mapIndex);
      assert.equal(replay.phase, recorded.game.phase, `${room.id}: replay exit differs`);
      assert.equal(replay.nextRoom, recorded.game.nextRoom, `${room.id}: replay destination differs`);
      result.rooms[`${map.id}:${room.id}`] = route;
    }
  });
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const routes = buildChillRoutes();
  writeFileSync(new URL('../../prototype/chill-routes.json', import.meta.url), JSON.stringify(routes, null, 2) + '\n');
  for (const [id, route] of Object.entries(routes.rooms)) {
    const frames = route.steps.reduce((sum, step) => sum + step.frames, 0);
    console.log(`${id}: ${frames} frames, ${(frames / STEP_HZ).toFixed(2)} seconds; independently replayed`);
  }
}
