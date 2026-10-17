// node build.mjs — writes days.json (days 1-3) from the room sketches below.
import { writeFileSync } from 'node:fs';
const grid = () => Array.from({ length: 18 }, () => Array(32).fill('.'));
const put = (g, ch, x0, y0, x1 = x0, y1 = y0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; return g; };
const floor = (g, x0 = 0, x1 = 31) => put(g, '#', x0, 16, x1, 17);
const out = g => g.map(r => r.join(''));
function room(id, name, theme, booze, exits, lines, draw, stages = {}) {
  const g = grid(); draw(g);
  const st = {}; for (const [k, f] of Object.entries(stages)) { const o = grid(); f(o); st[k] = out(o); }
  return { id, name, theme, booze, tiles: out(g), ...(Object.keys(st).length ? { stages: st } : {}), exits, lines };
}

const day1 = { id: 'day-1', name: '第一天', intro: '尾牙喝到最後一個。醉了以後，好像有人在幫我。', outro: '至少走出公司了。', cells: 1, abilities: ['wrestler'], rooms: [
  room('1-1', '工位', 'office', 1, { right: '1-2' }, ['K 放屁：往上噴。要一直點。', '醉意會自己回來。'], g => {
    floor(g); put(g, 'P', 3, 15); put(g, '#', 14, 11, 16, 15); put(g, '*', 15, 10);
  }),
  room('1-2', '影印機走道', 'office', 1, { right: '1-3' }, ['按住 D 再點 K：往前噴。'], g => {
    floor(g, 0, 9); floor(g, 22, 31); put(g, 'P', 3, 15); put(g, '#', 8, 10, 23, 10); put(g, '*', 27, 15);
  }),
  room('1-3', '茶水間', 'pantry', 0, { right: '1-4' }, ['滿一格按 J：醉影把我丟過去。', '先放屁，就不夠滿了。'], g => {
    floor(g); put(g, 'P', 3, 15); put(g, '#', 17, 7, 19, 15); put(g, '*', 18, 6);
  }),
  room('1-4', '儲藏室', 'office', 0.4, { right: '1-5' }, ['……地上怎麼都是碎杯子？', '醉的時候看到的東西，是真的。'], g => {
    floor(g, 0, 12); floor(g, 23, 31); put(g, '#', 0, 13, 3, 15); put(g, 'P', 2, 12); put(g, '*', 18, 9);
  }, { 1: o => { put(o, '^', 4, 15, 12, 15); put(o, '=', 14, 13, 21, 13); } }),
  room('1-5', '大廳', 'lobby', 0, { right: null }, ['大門在上面。', '先上矮櫃，滿一格 J，按住 W 高拋。'], g => {
    floor(g); put(g, 'P', 2, 15); put(g, '#', 20, 5, 31, 15); put(g, '#', 10, 12, 13, 15); put(g, '*', 23, 4);
  }, { 1: o => { put(o, '^', 14, 15, 19, 15); } }),
] };

const day2 = { id: 'day-2', name: '第二天', intro: '醒來在公園長椅上。今天的醉影，好像更壯了。', outro: '便利商店的店員看了我很久。', cells: 2, abilities: ['wrestler'], rooms: [
  room('2-1', '後巷', 'street', 2, { right: '2-2' }, ['兩格滿的時候按 J：衝過去，再丟出去。'], g => {
    floor(g, 0, 21); floor(g, 28, 31); put(g, 'P', 3, 15); put(g, 'B', 9, 0, 10, 15); put(g, 'R', 15, 15); put(g, '*', 25, 5);
  }),
  room('2-2', '鷹架人行道', 'street', 0, { right: '2-3' }, ['越醉越壯，也越危險。', '等兩格滿再 J。'], g => {
    floor(g, 0, 18); floor(g, 26, 31); put(g, '#', 1, 13, 4, 15); put(g, 'P', 2, 12); put(g, 'B', 12, 0, 13, 15); put(g, '*', 30, 15);
  }, { 1: o => { put(o, '^', 5, 15, 11, 15); }, 2: o => { put(o, '<', 1, 13, 4, 13); put(o, '^', 14, 15, 18, 15); } }),
  room('2-3', '保全亭', 'street', 0, { right: '2-4' }, ['一格是丟，兩格是衝。', '這裡要的是哪一個？'], g => {
    floor(g); put(g, 'P', 3, 15); put(g, 'B', 9, 2, 10, 15); put(g, '#', 22, 8, 31, 15); put(g, 'R', 12, 15); put(g, '#', 0, 0, 31, 2); put(g, '*', 27, 7);
  }, { 2: o => { put(o, '^', 6, 15, 10, 15); } }),
  room('2-4', '停車場', 'street', 0.5, { right: null }, ['最後一段。', '醉意上來之前，先想好。'], g => {
    floor(g, 0, 13); floor(g, 27, 31); put(g, 'P', 2, 15); put(g, 'B', 7, 0, 8, 15); put(g, '*', 28, 7);
  }, { 1: o => { put(o, '=', 16, 14, 18, 14); }, 2: o => { put(o, '^', 9, 15, 13, 15); put(o, '_', 16, 14, 18, 14); } }),
] };

const day3 = { id: 'day-3', name: '第三天', intro: '第三天。今天，醉影會飛。', outro: '到家了。……鑰匙呢？', cells: 3, abilities: ['wrestler'], rooms: [
  room('3-1', '工地', 'street', 3, { right: '3-2' }, ['三格滿按 J：升天、衝、丟，一口氣。'], g => {
    floor(g); put(g, 'P', 3, 15); put(g, '#', 9, 9, 9, 15); put(g, 'B', 0, 12, 8, 12); put(g, '#', 10, 12, 20, 15); put(g, '^', 10, 11, 20, 11); put(g, '*', 17, 6);
  }),
  room('3-2', '夜市', 'street', 1, { right: '3-3' }, ['要飛，就要醉到最後一格。', '紙箱頂棚要從下面衝破。'], g => {
    floor(g); put(g, 'P', 2, 15); put(g, 'B', 0, 12, 10, 12); put(g, '#', 11, 8, 12, 15); put(g, '#', 23, 12, 31, 15); put(g, '*', 24, 3);
  }, { 1: o => { put(o, '^', 14, 15, 22, 15); }, 2: o => { put(o, '^', 6, 15, 10, 15); }, 3: o => { put(o, '>', 0, 16, 4, 16); } }),
  room('3-3', '回家的路', 'street', 0.5, { right: null }, ['家就在前面。', '最後一次，全部用上。'], g => {
    floor(g, 0, 8); floor(g, 26, 31); put(g, 'P', 2, 15); put(g, 'B', 0, 12, 7, 12); put(g, '#', 8, 9, 9, 17); put(g, '#', 26, 10, 31, 15); put(g, '*', 27, 8);
  }, { 1: o => { put(o, '=', 13, 13, 15, 13); }, 2: o => { put(o, '^', 4, 15, 7, 15); }, 3: o => { put(o, '=', 19, 12, 21, 12); put(o, '_', 13, 13, 15, 13); } }),
] };

writeFileSync(new URL('days.json', import.meta.url), JSON.stringify({ format: 'drunken-rooms', version: 2, maps: [day1, day2, day3] }, null, 1));
console.log('wrote days.json');
