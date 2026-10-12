import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../prototype/editor.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('  function buildNpcVisual(npc)'), html.indexOf("  $('bNpcPreview').onclick"));
class Element {
  children = []; value = ''; disabled = false; hidden = false; textContent = '';
  append(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  setAttribute() {}
}
function setup() {
  const panels = { npcVisual: new Element(), npcPreview: new Element() };
  let npc = { name: 'Guard', start: 'hello', nodes: { hello: { text: 'Hello', next: 'reply' }, reply: { text: 'Bye', next: null } } };
  const context = vm.createContext({ document: { createElement: () => new Element() }, $: id => panels[id], editNpc: edit => { edit(npc); context.buildNpcVisual(npc); } });
  vm.runInContext(source, context); context.buildNpcVisual(npc);
  const all = (root = panels.npcVisual) => root.children.flatMap(c => [c, ...all(c)]);
  const click = label => all().find(e => e.textContent === label).onclick();
  return { panels, context, all, click, npc };
}
test('visual cards create branches, save text, and repair links when deleting a node', () => {
  const ui = setup();
  ui.click('＋ 回答選項');
  assert.equal(ui.npc.nodes.hello.choices[0].next, 'reply');
  assert.equal(ui.npc.nodes.hello.next, undefined);
  const name = ui.all().find(e => e.value === 'Guard'); name.value = 'Reception'; name.onchange();
  assert.equal(ui.npc.name, 'Reception');
  ui.click('＋ 對話段落'); assert.ok(ui.npc.nodes.line1);
  const replyCard = ui.panels.npcVisual.children.find(e => e.className?.startsWith('dialogue-node') && e.children.some(c => c.textContent === 'reply'));
  const remove = replyCard.children.flatMap(c => [c, ...c.children]).find(e => e.textContent === '刪除段落'); remove.onclick();
  assert.equal(ui.npc.nodes.reply, undefined); assert.equal(ui.npc.nodes.hello.choices[0].next, null);
  ui.click('刪除回答'); assert.equal(ui.npc.nodes.hello.choices, undefined); assert.equal(ui.npc.nodes.hello.next, null);
});
test('preview follows branches and restarts without modifying saved dialogue', () => {
  const ui = setup(); ui.click('＋ 回答選項');
  const before = JSON.stringify(ui.npc);
  ui.context.previewNpc(ui.npc, 'hello');
  const preview = ui.panels.npcPreview;
  preview.children.find(e => e.textContent === '新的回答').onclick();
  assert.match(preview.children[0].textContent, /Bye/);
  preview.children.find(e => e.textContent === '繼續').onclick();
  assert.equal(preview.children[0].textContent, '對話結束');
  preview.children.find(e => e.textContent === '重新試播').onclick();
  assert.match(preview.children[0].textContent, /Hello/);
  assert.equal(JSON.stringify(ui.npc), before);
});
