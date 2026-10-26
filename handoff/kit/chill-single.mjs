// Single-skill test rooms (skills: "single"): each grade is one move of its own.
// 1 丟 = arc, 2 衝 = flat, 3 升天 = straight up. Each grade's map is drawn so its own move falls short;
// the three seconds after E/K are the only time a move meets another grade's map.
// node handoff/kit/chill-single.mjs   writes prototype/chill-single.json and chill-single-routes.json
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artRoom, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';
import * as day1 from './chill-bottle-day1.mjs';
import * as day2 from './chill-bottle-day2.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';
const CEIL = FLOOR;

export const rooms = [
  // The crate wall runs up to the ceiling, so the throw cannot clear it. One sip, and the charge
  // goes through the crates and over the glass.
  artRoom('S-1', '紙箱牆', 'office', 1,
    ['解法：E 到大醉，走到紙箱牆前 J。衝會撞破紙箱、踩過碎玻璃。'], [
      EMPTY, EMPTY, EMPTY,
      CEIL,
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..P.......BB..................O.',
      '############^^^^^^^^^^##########',
      FLOOR,
    ]),

  // The way up is a crate lid. 升天 breaks crates overhead, but at grade three the lid is steel.
  // Sip under the lid and rise at once, while the world still shows grade two.
  artRoom('S-2', '紙箱蓋', 'lobby', 2,
    ['解法：大醉的衝與微醺的丟都打不破頭上的紙箱。', '爛醉的升天可以，但爛醉的世界裡蓋子是鐵的：站到蓋子下面 E，馬上 J，往旁邊飄上去。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '.............................O..',
      '##############BBBB##############',
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '...P............................',
      FLOOR, FLOOR,
    ], {
      3: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '..............####..............',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // Under the arcade awning the rise only bumps its head and the throw falls short. The charge just fits,
  // but at grade two the awning hangs one tile lower. Fart and charge at once.
  artRoom('S-3', '騎樓', 'street', 3,
    ['解法：雨棚下升天會撞頭，丟也丟不遠。', '大醉的衝剛好塞得下，但大醉的世界裡雨棚會再低一格：K 之後馬上 J。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '#########################.......',
      EMPTY, EMPTY, EMPTY,
      '..P...........................O.',
      '######^^^^^^^^^^^^^^############',
      FLOOR,
    ], {
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '#########################.......',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      // overlays stack: grade three lifts the grade-two awning back up
      3: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '_________________________.......',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // The roof is far and high: only a running jump and a throw get there. Two farts down to grade one,
  // and three seconds later a hoarding goes up at the edge. Run, jump, throw before it does.
  artRoom('S-4', '屋頂', 'street', 3,
    ['解法：升天再怎麼飄都差一截；衝撞到屋頂邊只會彈回玻璃上。', 'K 兩次到微醺（中間要等三秒）。微醺的世界裡邊上會立起圍籬：第二次 K 之後馬上助跑、跳、J。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '.............................O..',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '.P....................##########',
      '######^^^^^^^^^^^^^^^^##########',
      FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY,
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        '.......#........................',
        EMPTY, EMPTY,
      ],
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY,
        ...Array(12).fill('......._........................'),
        EMPTY, EMPTY,
      ],
    }),

  // The way down is a crate trapdoor. Nothing breaks crates underfoot except the pound,
  // and the pound only comes out of a rise: rise from the trapdoor, then S.
  artRoom('S-5', '活板門', 'lobby', 3,
    ['解法：站上紙箱活板門，J 升天（會先蹲一下），在空中按 S 往下砸，砸穿紙箱掉到樓下。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '...P............................',
      '##############BBBB##############',
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '..............................O.',
      FLOOR, FLOOR,
    ]),
];

export const plans = {
  'S-1': r => {
    r.grade(1);
    r.until(g => g.body.x >= 360, 3, { right: true });
    r.skill(); r.land(); r.finish();
  },
  'S-2': r => {
    r.until(g => g.body.x >= 640, 4, { right: true });
    r.wait(0.2);
    r.grade(1); r.skill();
    r.wait(0.5);
    r.until(g => g.body.grounded && g.body.y < 400, 3, { right: true });
    r.finish();
  },
  'S-5': r => {
    r.until(g => g.body.x >= 640, 4, { right: true });
    r.wait(0.2);
    r.skill();
    r.until(g => g.body.vy >= 0 && !g.body.grounded && !g.windupT, 2);
    r.tick({ down: true });
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.finish();
  },
  'S-3': r => {
    r.grade(-1); r.skill(); r.land(); r.finish();
  },
  'S-4': r => {
    r.grade(-1); r.world();
    r.until(g => g.body.x <= 50, 2, { left: true });
    r.grade(-1);
    r.until(g => g.body.x >= 200, 2, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.wait(0.3, { right: true, jump: true });
    r.skill();
    r.until(g => g.body.grounded && g.body.y < 500, 4, { right: true });
    r.finish();
  },
};

const chain = list => list.map((room, i) => ({ ...room, portalTarget: list[i + 1]?.id ?? null }));
// Under bottle rules S-1 and S-2 need one sip; they start with the bottle in hand.
const HELD = { 'S-1': 1, 'S-2': 1 };

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'carry',
  maps: [{
    id: 'bottle-1', name: '第一天　微醺', cells: 1, abilities: ['wrestler'],
    intro: '加班到十一點。路上撿到一瓶酒。\n撿起來的酒放在身上，E 才喝；一次只拿得動一瓶。\n喝了醉影就會來，世界晚三秒才跟上。K 放屁醒一點。',
    outro: '醉影把我丟過了半個城市。明天再走。',
    rooms: chain(day1.rooms),
  }, {
    id: 'bottle-2', name: '第二天　大醉', cells: 2, abilities: ['wrestler'],
    intro: '同事又約了。今天喝得到大醉。\n微醺時醉影把你丟出去，大醉時醉影扛著你衝。\n衝撞得破紙箱、撞得飛警衛，但頭上要有空間。放屁降一階，就換回丟。',
    outro: '肩膀好痛。醉影的。',
    rooms: chain(day2.rooms),
  }, {
    id: 'single-1', name: '試玩　單招', cells: 3, abilities: ['wrestler'],
    intro: '每一階只有一招。\n微醺：丟（斜的）　大醉：衝（平的）　爛醉：升天（直的，會先蹲一下；在空中按 S 往下砸）\n想用哪一招，就喝到或放屁到那一階。世界一樣晚三秒。',
    outro: '單招試玩結束。',
    rooms: chain(rooms.map(room => HELD[room.id] ? { ...room, held: HELD[room.id] } : room)),
  }],
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const routes = { stepHz: STEP_HZ, rules: 'chill-puzzle', rooms: {} };
  const allPlans = { ...plans, ...day1.plans, ...day2.plans };
  campaign.maps.forEach((map, mapIndex) => {
    for (const room of map.rooms) {
      const recorded = recordRoom(campaign, room.id, allPlans[room.id], { mapIndex });
      const route = { signature: recorded.signature, steps: recorded.steps };
      assert.equal(replayRoom(campaign, room.id, route, mapIndex).nextRoom, recorded.game.nextRoom, `${room.id}: replay differs`);
      routes.rooms[`${map.id}:${room.id}`] = route;
      console.log(`${room.id}: ${(recorded.frames / STEP_HZ).toFixed(2)} s, replayed`);
    }
  });
  for (const [id, plan] of Object.entries(day1.capPlans)) {
    const { game } = recordRoom(campaign, id, plan, { requireExit: false });
    // roomCaps resets once the route walks out of the door; capsGot keeps every cap taken
    assert.ok([...game.capsGot].some(key => key.includes(`:${id}:`)), `${id}: cap route missed the cap`);
    console.log(`${id}: cap route ok`);
  }
  writeFileSync(new URL('../../prototype/chill-single.json', import.meta.url), JSON.stringify(campaign, null, 2) + '\n');
  writeFileSync(new URL('../../prototype/chill-single-routes.json', import.meta.url), JSON.stringify(routes, null, 2) + '\n');
  console.log('Wrote prototype/chill-single.json and chill-single-routes.json');
}
