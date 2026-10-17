// Generate, verify and checkpoint cap-complete P routes. Optional arguments: room IDs.
import { solve, compress, replay, expand, D, ENGINE_FILE } from './dsim.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const campaign = JSON.parse(readFileSync(new URL('days.json', import.meta.url), 'utf8'));
D.parseCampaign(JSON.stringify(campaign));
const output = new URL('routes.json', import.meta.url);
const routes = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')) : {};
const only = process.argv.slice(2);
for (const map of campaign.maps) for (const room of map.rooms) {
  if (only.length && !only.includes(room.id)) continue;
  const key = `${map.id}:${room.id}`;
  const caps = room.tiles.join('').split('*').length - 1;
  const cached = routes[key] && replay(room, map.cells, expand(routes[key]));
  if (cached?.ok && cached.caps === caps) { console.log(key, 'cached'); continue; }
  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    result = solve(room, map.cells, { caps: true, maxT: 14, beam: 1800 + attempt * 600, limit: 3000000 });
    if (result.ok) break;
  }
  if (!result.ok) throw new Error(`${key}: ${result.reason}`);
  routes[key] = compress(result.plan);
  writeFileSync(output, JSON.stringify(routes, null, 2) + '\n');
  console.log(JSON.stringify({ key, route: routes[key], caps: result.caps, j: result.j, farts: result.farts }));
}
const keys = campaign.maps.flatMap(m => m.rooms.map(r => `${m.id}:${r.id}`));
if (keys.every(k => routes[k])) {
  for (const map of campaign.maps) for (const room of map.rooms) {
    const r = replay(room, map.cells, expand(routes[`${map.id}:${room.id}`]));
    if (!r.ok || r.caps !== room.tiles.join('').split('*').length - 1) throw new Error(`Invalid route: ${room.id}`);
  }
  const html = readFileSync(ENGINE_FILE, 'utf8');
  writeFileSync(ENGINE_FILE, html.replace(/  const ROUTES = \{[\s\S]*?\n  \};/, '  const ROUTES = ' + JSON.stringify(Object.fromEntries(keys.map(k => [k, routes[k]])), null, 2).replace(/\n/g, '\n  ') + ';'));
  console.log('Installed all verified routes.');
}
