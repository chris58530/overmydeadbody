// Single-file build for BeaverKit (and phones): game.html with the drink-loop rooms and P routes
// embedded, so it opens straight into the loop campaign without a server or ?chill=loop.
// node handoff/kit/build-beaverkit.mjs   ->  prototype/beaverkit.html
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = name => readFileSync(new URL(`../../prototype/${name}`, import.meta.url), 'utf8');
const inline = (id, json) => `<script type="application/json" id="${id}">${JSON.stringify(JSON.parse(json)).replace(/</g, '\\u003c')}</script>\n`;

export function buildBeaverkit() {
  const html = read('game.html');
  const at = html.indexOf('<script>');
  if (at < 0) throw new Error('game.html: engine script not found');
  return html.slice(0, at) + inline('chill-puzzles-data', read('chill-loop.json')) + inline('chill-routes-data', read('chill-loop-routes.json')) + html.slice(at);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = buildBeaverkit();
  writeFileSync(new URL('../../prototype/beaverkit.html', import.meta.url), out);
  console.log(`Wrote prototype/beaverkit.html (${(out.length / 1024).toFixed(0)} KB).`);
}
