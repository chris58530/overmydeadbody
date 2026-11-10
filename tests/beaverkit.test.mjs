import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildBeaverkit, DAYS } from '../handoff/kit/build-beaverkit.mjs';

const read = name => readFileSync(new URL(`../prototype/${name}`, import.meta.url), 'utf8');

test('the BeaverKit single file is up to date with game.html, the rooms and the routes', () => {
  assert.equal(read('beaverkit.html'), buildBeaverkit(), 'run node handoff/kit/build-beaverkit.mjs');
});

test('each day has its own single file, holding that day and its routes only', () => {
  const all = JSON.parse(read('chill-loop.json'));
  assert.equal(all.maps.length, DAYS);
  for (let day = 1; day <= DAYS; day++) {
    const html = read(`beaverkit-day${day}.html`), map = all.maps[day - 1];
    assert.equal(html, buildBeaverkit(day), 'run node handoff/kit/build-beaverkit.mjs');
    const block = id => JSON.parse(html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`))[1]);
    assert.deepEqual(block('chill-puzzles-data').maps, [map]);
    const keys = Object.keys(block('chill-routes-data').rooms);
    assert.deepEqual(keys.sort(), map.rooms.map(room => `${map.id}:${room.id}`).sort());
  }
});

test('every painted room has its picture next to the page', () => {
  for (const map of JSON.parse(read('chill-loop.json')).maps) for (const room of map.rooms) {
    if (room.background) assert.ok(existsSync(new URL(`../prototype/${room.background}`, import.meta.url)), `${room.id}: ${room.background}`);
  }
});

test('every voice and music loop the game plays is next to the page', () => {
  const html = read('game.html'), clips = html.match(/const CLIPS = \{([\s\S]*?)\};/)[1].match(/'(?:jim|guard)-[a-z0-9-]+'/g).map(s => s.slice(1, -1));
  assert.ok(clips.length > 10);
  for (const name of [...new Set(clips), 'bgm-sober', 'bgm-drunk']) assert.ok(existsSync(new URL(`../prototype/art/audio/${name}.mp3`, import.meta.url)), name);
});

test('the single file embeds both puzzle files and keeps the engine script first', () => {
  const html = read('beaverkit.html');
  const block = id => JSON.parse(html.match(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`))[1]);
  assert.deepEqual(block('chill-puzzles-data'), JSON.parse(read('chill-loop.json')));
  assert.deepEqual(block('chill-routes-data'), JSON.parse(read('chill-loop-routes.json')));
  assert.ok(html.indexOf('chill-routes-data') < html.indexOf('<script>'), 'data must exist before the game starts');
});

test('touch controls cover every action a keyboard player uses', () => {
  const html = read('game.html');
  for (const act of ['dpad', 'jump', 'skill', 'talk', 'k', 'r', 'auto', 'menu']) assert.ok(html.includes(`data-pad="${act}"`), act);
});
