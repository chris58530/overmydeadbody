// Rebuild the chill-puzzle campaign: three days of five rooms, one new move per day.
// node handoff/kit/build-chill.mjs   (then node handoff/kit/build-chill-routes.mjs)
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rooms as day1 } from './chill-day1.mjs';
import { rooms as day2 } from './chill-day2.mjs';
import { rooms as day3 } from './chill-day3.mjs';

const day = (id, name, cells, intro, outro, rooms) => {
  rooms.forEach((room, i) => { room.portalTarget = rooms[i + 1]?.id ?? null; });
  return { id, name, cells, abilities: ['wrestler'], intro, outro, rooms };
};

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle',
  maps: [
    day('day-1', '第一天　微醺', 1,
      '加班到十一點。喝了一口，身邊多了一個醉影。\nE 喝一口升階，K 放屁降階，J 叫醉影。\n技能立刻換，世界晚三秒才跟上。',
      '醉影把我丟過了半個城市。明天再走。', day1),
    day('day-2', '第二天　大醉', 2,
      '同事又約了。今天喝到大醉。\n大醉時 J：醉影扛著你衝，衝完再丟。\n紙箱擋不住它，但它需要頭頂的空間。',
      '肩膀好痛。醉影的。', day2),
    day('day-3', '第三天　爛醉', 3,
      '最後一攤。爛醉。\n爛醉時 J：先放一個升天的屁，再衝，再丟。\n家就在前面。',
      '鑰匙插進門裡。醉影揮了揮手，散了。', day3),
  ],
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../../prototype/chill-puzzles.json', import.meta.url), JSON.stringify(campaign, null, 2) + '\n');
  console.log(`Wrote prototype/chill-puzzles.json (${campaign.maps.map(m => m.rooms.length).join(' + ')} rooms).`);
}
