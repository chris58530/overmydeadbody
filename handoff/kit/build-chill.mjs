// Rebuild the chill-puzzle rooms; the original three-day campaign stays separate.
// node handoff/kit/build-chill.mjs
import { writeFileSync } from 'node:fs';
import { rect, room } from './chill-room-tools.mjs';
import { rooms as riseRooms } from './chill-rooms-rise.mjs';
import { rooms as mixRooms } from './chill-rooms-mix.mjs';

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle',
  maps: [{
    id: 'chill-night', name: '晚一拍的回家路', cells: 3, abilities: ['wrestler'],
    intro: '技能先換，世界晚三秒。慢慢想，醉影會接住你。',
    outro: '原來，晚一拍也能到家。',
    rooms: [
      room('chill-1', '先試一下', 'lobby', 1,
        ['E 升一階，K 原地降一階。J 一次演完整招。', '試著越過矮台，出口就在右邊。高處瓶蓋，想拿再拿。'],
        g => {
          rect(g, 'P', 3, 15);
          rect(g, '#', 9, 14, 12, 15);
          rect(g, '#', 17, 12, 20, 15);
          rect(g, '*', 11, 12); rect(g, '*', 19, 8);
          rect(g, 'O', 31, 15);
        }, {}, 'chill-2'),

      // At stage 2 the stairway continues over a walled courtyard as its roof.
      // Stage 1 removes that entire stairway/roof. Lower the stage on the roof,
      // walk above the courtyard during the generous delay, and fall safely in.
      room('chill-2', '橋下的門', 'street', 2,
        ['二階的橋，把門蓋住了。', '先站上橋，K 降一階；趁橋還在，走到門的上方。'],
        g => {
          rect(g, 'P', 2, 15);
          rect(g, '#', 20, 7, 20, 15);
          rect(g, '#', 31, 0, 31, 15);
          rect(g, '*', 25, 9);
          rect(g, 'O', 30, 15);
        }, {
          2: g => {
            rect(g, '#', 4, 14, 6, 15);
            rect(g, '#', 7, 12, 9, 15);
            rect(g, '#', 10, 10, 12, 15);
            rect(g, '#', 13, 8, 15, 15);
            rect(g, '#', 16, 6, 19, 15);
            rect(g, '#', 20, 6, 31, 6);
          },
        }, 'chill-3'),

      // The stage-3 launch shelf gives 160 px of clearance under the awning:
      // a 152 px shoulder charge fits; the upward opener hits the awning.
      // K changes the skill at once, leaving the launch shelf for three seconds.
      room('chill-3', '借一下高台', 'street', 3,
        ['三階才有高台；二階，回家的門才會打開。', '站上高台朝右，K → J：借舊平台，用二階衝出去。'],
        g => {
          rect(g, 'P', 2, 15);
          rect(g, '#', 8, 4, 19, 5);
          rect(g, '#', 24, 4, 31, 15);
          rect(g, '*', 26, 2);
          rect(g, 'O', 30, 3);
        }, {
          3: g => {
            rect(g, '#', 4, 14, 6, 15);
            rect(g, '#', 7, 12, 9, 15);
            rect(g, '#', 10, 10, 22, 15);
            rect(g, '#', 28, 0, 28, 3);
          },
        }, null),
      ...riseRooms,
      ...mixRooms,
    ],
  }],
};

const rooms = campaign.maps[0].rooms;
for (let index = 0; index < rooms.length; index++) rooms[index].portalTarget = rooms[index + 1]?.id ?? null;

writeFileSync(new URL('../../prototype/chill-puzzles.json', import.meta.url), JSON.stringify(campaign, null, 2) + '\n');
console.log(`Wrote prototype/chill-puzzles.json (${rooms.length} rooms).`);
