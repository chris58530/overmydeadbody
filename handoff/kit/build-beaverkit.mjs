// Single-file build for BeaverKit (and phones): game.html with the drink-loop rooms and P routes
// embedded, so it opens straight into the loop campaign without a server or ?chill=loop.
// Each day is also built on its own, as its own BeaverKit work: beaverkit-day1.html and so on hold just that day.
// Painted rooms read their pictures from art/ next to the page. BeaverKit keeps only the page, so a build holding any
// painted room points each picture at its copy in the BeaverKit asset library instead: the library names a file by the
// SHA-256 of its bytes, so the address comes from the file itself. Upload a new or changed picture to the library
// (素材庫) before uploading the page, or it shows as greybox.
// node handoff/kit/build-beaverkit.mjs   ->  prototype/beaverkit.html, prototype/beaverkit-day{1,2,3}.html
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = name => readFileSync(new URL(`../../prototype/${name}`, import.meta.url), 'utf8');
const inline = (id, data) => `<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n`;

// day: 1-based, or nothing for every day in one file
export function buildBeaverkit(day) {
  const html = read('game.html');
  const at = html.indexOf('<script>');
  if (at < 0) throw new Error('game.html: engine script not found');
  let campaign = JSON.parse(read('chill-loop.json')), routes = JSON.parse(read('chill-loop-routes.json'));
  if (day) {
    const map = campaign.maps[day - 1];
    if (!map) throw new Error(`no day ${day}`);
    campaign = { ...campaign, maps: [map] };
    routes = { ...routes, rooms: Object.fromEntries(Object.entries(routes.rooms).filter(([key]) => key.startsWith(map.id + ':'))) };
  }
  const painted = campaign.maps.some(map => map.rooms.some(room => room.background));
  return html.slice(0, at) + inline('chill-puzzles-data', campaign) + inline('chill-routes-data', routes) + (painted ? inline('art-data', artData()) : '') + html.slice(at);
}

// every picture under prototype/art, as path -> its address in the asset library (the folder game.html uses for Jim)
const LIBRARY = 'https://assets.beaverkit.io/8b8492c8-d4c0-4051-abac-cb6fe421fa89/';
function artData() {
  const out = {}, root = new URL('../../prototype/art/', import.meta.url);
  for (const dir of readdirSync(root)) for (const file of readdirSync(new URL(`${dir}/`, root)).sort()) {
    const bytes = readFileSync(new URL(`${dir}/${file}`, root));
    out[`art/${dir}/${file}`] = LIBRARY + createHash('sha256').update(bytes).digest('hex') + '.' + file.split('.').pop();
  }
  return out;
}

export const DAYS = 3;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const day of [undefined, ...Array.from({ length: DAYS }, (_, i) => i + 1)]) {
    const out = buildBeaverkit(day), name = day ? `beaverkit-day${day}.html` : 'beaverkit.html';
    writeFileSync(new URL(`../../prototype/${name}`, import.meta.url), out);
    console.log(`Wrote prototype/${name} (${(out.length / 1024).toFixed(0)} KB).`);
  }
}
