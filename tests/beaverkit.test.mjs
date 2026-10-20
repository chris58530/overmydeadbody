import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildBeaverkit } from '../handoff/kit/build-beaverkit.mjs';

const read = name => readFileSync(new URL(`../prototype/${name}`, import.meta.url), 'utf8');

test('the BeaverKit single file is up to date with game.html, the rooms and the routes', () => {
  assert.equal(read('beaverkit.html'), buildBeaverkit(), 'run node handoff/kit/build-beaverkit.mjs');
});

test('the single file embeds both puzzle files and keeps the engine script first', () => {
  const html = read('beaverkit.html');
  const block = id => JSON.parse(html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`))[1]);
  assert.deepEqual(block('chill-puzzles-data'), JSON.parse(read('chill-puzzles.json')));
  assert.deepEqual(block('chill-routes-data'), JSON.parse(read('chill-routes.json')));
  assert.ok(html.indexOf('chill-routes-data') < html.indexOf('<script>'), 'data must exist before the game starts');
});

test('touch controls cover every action a keyboard player uses', () => {
  const html = read('game.html');
  for (const act of ['dpad', 'jump', 'skill', 'talk', 'k', 'r', 'auto', 'menu']) assert.ok(html.includes(`data-pad="${act}"`), act);
});
