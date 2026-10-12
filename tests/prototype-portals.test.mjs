import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../prototype/game.html', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { Game, parseCampaign, T } = context.Drunk;
function campaign() {
  const room = id => ({ id, tiles: Array.from({ length: 18 }, (_, y) => y === 15 ? '..P...O.........................' : y >= 16 ? '#'.repeat(32) : '.'.repeat(32)), exits: {} });
  return parseCampaign(JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [{ id: 'one', abilities: ['wrestler'], rooms: [room('a'), room('b')] }, { id: 'two', abilities: ['bodyguard'], rooms: [room('c')] }] }));
}
test('portal-only rooms load and contact transitions to the next ordered room', () => {
  const game = new Game(campaign());
  game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits();
  assert.equal(game.phase, 'transition'); assert.equal(game.nextRoom, 'b');
  for (let i = 0; i < 70; i++) game.step(1 / 120);
  assert.equal(game.room.id, 'b'); assert.equal(game.phase, 'play');
});
test('last-room portal banks collectibles and finishes the day', () => {
  const game = new Game(campaign()); game.enterRoom('b'); game.roomCaps = ['cap'];
  game.body.x = 6.5 * T; game.body.y = 16 * T; game.checkExits();
  assert.equal(game.phase, 'mapEnd'); assert.ok(game.capsGot.has('cap'));
  game.step(.7); game.step(.01, { confirmPressed: true });
  assert.equal(game.mapIndex, 1); assert.equal(game.room.id, 'c');
});
test('portal does not activate from a distance and existing edge exits still work', () => {
  const data = campaign(); data.maps[0].rooms[0].exits.right = 'b';
  const game = new Game(data); game.checkExits(); assert.equal(game.phase, 'play');
  game.body.x = 32 * T + 1; game.checkExits(); assert.equal(game.nextRoom, 'b');
});
test('both prototype scripts remain valid JavaScript', async () => {
  for (const file of ['game', 'editor']) {
    const source = await readFile(new URL(`../prototype/${file}.html`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  }
});

test('manual portal destinations override room order and survive serialization', () => {
  const data = campaign();
  data.maps[0].rooms[1].portalTarget = 'a';
  const game = new Game(parseCampaign(JSON.stringify(data)));
  game.enterRoom('b'); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.nextRoom, 'a');
});

test('manual end destination and invalid targets are handled', () => {
  const data = campaign(); data.maps[0].rooms[0].portalTarget = null;
  const game = new Game(data); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.phase, 'mapEnd');
  data.maps[0].rooms[0].portalTarget = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /missing/);
});

test('two portals in one room use their own destinations after JSON round trip', () => {
  const data = campaign(), room = data.maps[0].rooms[0];
  room.tiles[15] = '..P...O...O.....................';
  room.portalTargets = { '6,15': 'b', '10,15': null };
  const loaded = parseCampaign(JSON.stringify(data));
  const game = new Game(loaded); game.body.x = 6.5 * T; game.body.y = 16 * T;
  game.checkExits(); assert.equal(game.nextRoom, 'b');
  const other = new Game(loaded); other.body.x = 10.5 * T; other.body.y = 16 * T;
  other.checkExits(); assert.equal(other.phase, 'mapEnd');
  room.portalTargets['10,15'] = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /missing/);
  room.portalTargets = { '5,15': 'b' };
  assert.throws(() => parseCampaign(JSON.stringify(data)), /5,15/);
});

test('NPC conversations branch, pause movement, end, and remain independent', async () => {
  const data = campaign(), r = data.maps[0].rooms[0];
  r.tiles[15] = '..P.N.O.N.......................';
  const dialogue = JSON.parse(await readFile(new URL('../prototype/dialogue-example.json', import.meta.url), 'utf8'));
  r.npcs = { '4,15': dialogue, '8,15': { name: 'Other', start: 'a', nodes: { a: { text: 'Other dialogue', next: null } } } };
  const game = new Game(parseCampaign(JSON.stringify(data))); game.phase = 'play';
  game.step(.01, { talkPressed: true }); assert.equal(game.dialogue, null);
  game.body.x = 4.5 * T; game.body.y = 16 * T;
  game.step(.01, { talkPressed: true }); assert.equal(game.dialogue.node, 'hello');
  const x = game.body.x; game.step(.1, { right: true, choice: 9 });
  assert.equal(game.body.x, x); assert.equal(game.dialogue.node, 'hello');
  game.step(.01, { choice: 1 }); assert.equal(game.dialogue.node, 'directions');
  game.step(.01, { confirmPressed: true }); assert.equal(game.dialogue, null);
  game.body.x = 8.5 * T; game.step(.01, { talkPressed: true }); assert.equal(game.dialogue.data.name, 'Other');
  game.enterRoom('b'); assert.equal(game.dialogue, null);
  dialogue.nodes.hello.choices[0].next = 'missing';
  assert.throws(() => parseCampaign(JSON.stringify(data)), /Unknown|choices/);
});
