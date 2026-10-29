// The drink-use-sober loop (bottles: "drink"). Touching a bottle drinks it (it comes back a few seconds later),
// J spends the grade it uses, K spends one with a hop, and the world is the body three seconds ago.
// No room can be lost for good: every bottle comes back.
// Day 1 is the office prologue from the story plan (walk and jump only, credits on the walls; Jim faints at the
// printer and does not know he died). Day 2: bottles and farts, no shadow. Day 3 brings the throw.
// node handoff/kit/chill-loop.mjs   writes prototype/chill-loop.json and chill-loop-routes.json
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artRoom, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';
import { rooms as oldDay1 } from './chill-day1.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

const put = (rows, at) => rows.map((row, y) => [...row].map((ch, x) => at.find(([px, py]) => px === x && py === y)?.[2] ?? ch).join(''));
const reroom = (from, id, name, marks, lines, booze) => {
  const room = oldDay1.find(r => r.id === from);
  return { ...room, id, name, tiles: put(room.tiles, marks), lines, ...(booze === undefined ? {} : { booze }) };
};
const D = (x, y) => [x, y, 'D'];

// The office prologue: walking and jumping only. Credits are painted on the walls; names are placeholders.
export const day1 = [
  // From the desk to the print room: a desk, a strip of broken mugs, the filing cabinets up to a walkway,
  // and two stacks of paper boxes over more glass that sag the moment you stand on them.
  { ...artRoom('P1-1', '辦公室', 'office', 0, [], [
      ...Array(11).fill(EMPTY),
      '.............................O..',
      '...............##====CC..CC#####',
      '...............##..........#####',
      '.............####..........#####',
      '.P...##......####..........#####',
      '#########^^######^^^^^^^^^^#####',
      FLOOR,
    ]), signs: [[3, 3, '醉隱　Over My Dead Body', 40], [3, 6, '製作　DrunkenRoomStudio', 22]] },

  // The print room: the paper feed runs against you under a flickering tube, the rolling chair guards the
  // floor, and the paper boxes up to the printer give way under you.
  { ...artRoom('P1-2', '列印室', 'office', 0, [], [
      EMPTY, EMPTY,
      '.........L......................',
      ...Array(8).fill(EMPTY),
      '..............................O.',
      '............................####',
      '............................####',
      '...............#.........CC.####',
      '.P.............#....R....CC.####',
      '###<<<<<<<<<<<<#################',
      FLOOR,
    ]), signs: [[2, 4, '企劃　○○○', 22], [2, 6, '程式　○○○', 22], [17, 4, '美術　○○○', 22], [17, 6, '音樂　○○○', 22], [27, 9, '印表機（卡紙）', 18]] },

  // After the faint: the lights are out and the floor is broken glass. Up the shelves, over the sagging boxes,
  // past the tube that lets go, and around the chair rolling in front of the door.
  { ...artRoom('P1-3', '醒來', 'office', 0, [], [
      ...Array(5).fill(EMPTY),
      '..................L........R..O.',
      '.......................#########',
      EMPTY,
      '...................===..........',
      EMPTY,
      '..............====..............',
      EMPTY,
      '.........CCCC...................',
      EMPTY,
      '....====........................',
      '..P.............................',
      '#########^^^^^^^^^^^^^^^^^^^^^^^',
      FLOOR,
    ]), signs: [[2, 2, '特別感謝　所有還在加班的人', 22]],
    cutscene: '印表機吐出最後一張。\n按下「送出」的那一刻，懸著的心終於放下。\n眼皮，終於可以闔上了。\n\n……\n\n醒來時，整層樓的燈都暗了。不知道過了多久。' },
];

// Reach on foot (tiles): a jump is 2.8 high; jump, then K at the top, is 4.2 high and up to 10.5 far.
export const day2 = [
  // A pit too wide to jump. One sip, and three seconds later the bridge you imagine is there.
  artRoom('L2-1', '加班完', 'office', 0,
    ['解法：坑跳不過去。碰到酒就喝了，三秒後幻覺橋出現，再走過去。'], [
      ...Array(15).fill(EMPTY),
      '..P...D.......................O.',
      '########^^^^^^^^^^^^^^##########',
      FLOOR,
    ], {
      1: [...Array(16).fill(EMPTY), '........##############..........', EMPTY],
    }),

  // The ledge is a tile and more above a jump. Drunk, a fart in the air is one more little hop.
  artRoom('L2-2', '打嗝', 'office', 0,
    ['解法：平台跳不上去。喝了酒，跳起來在最高點 K：放屁會再把你往上推一點。', '屁放了，酒也醒一點。'], [
      ...Array(11).fill(EMPTY),
      '.............................O..',
      '..............##################',
      '..............##################',
      '..............##################',
      '..P..D........##################',
      FLOOR, FLOOR,
    ]),

  // The bridge again, with a post in the middle you can only fart over. The fart sobers you, so the bridge
  // fades three seconds later: grab the bottle beyond the post and fart up onto the ledge before it goes.
  artRoom('L2-3', '醒得太快', 'pantry', 0,
    ['解法：喝，等橋出現。柱子要跳起來放屁才過得去，但一放屁，橋三秒後就散了。',
      '柱子後面還有一瓶：落地就喝到，馬上衝到平台前，跳起來再放屁上去。'], [
      ...Array(11).fill(EMPTY),
      '.............................O..',
      '..........................######',
      '..............##..........######',
      '..............##..........######',
      '..P.D.........##....D.....######',
      '########^^^^^^##^^^^^^^^^^######',
      FLOOR,
    ], {
      1: [...Array(16).fill(EMPTY), '........######..##########......', EMPTY],
    }),

  // The night guard on the bridge, now with farts only: time the fart so he falls on the glass.
  reroom('1-4', 'L2-4', '夜班警衛', [[31, 7, '.']], ['解法：橋是幻覺。爬上去，看警衛走：K 放屁之後三秒橋就消失。',
    '算好讓他三秒後在玻璃上方，掉下去就倒了。']),

  // The same sip that brings the bridge raises a wall in front of the door. Cross, then sober up by the wall.
  artRoom('L2-5', '回家的第一段', 'street', 0,
    ['解法：喝了，橋才會出現，但門前也會長出一道牆。', '過了橋站到牆前放屁，三秒後牆就散了。'], [
      ...Array(15).fill(EMPTY),
      '..P.D........................O..',
      '#######^^^^^^^^^^^^^^###########',
      FLOOR,
    ], {
      1: [
        ...Array(10).fill(EMPTY),
        ...Array(6).fill('.........................#......'),
        '.......##############...........',
        EMPTY,
      ],
    }),
];

export const day3 = [
  reroom('1-1', 'L3-1', '第一口', [D(6, 15)], ['解法：清醒叫不出醉影。走過去碰到酒就喝了，J 丟過隔板。', '出招會把醉意用掉：丟完你又是清醒的。']),
  reroom('1-2', 'L3-2', '轉椅', [D(3, 15)], ['解法：喝了酒，樓梯三秒後才出現。等它出現再爬，等的時候跳過轉椅。', '幻覺是真的，踩得上去。']),
  reroom('1-3', 'L3-3', '午後雷陣雨', [D(22, 15)], ['解法：酒在檯子邊。喝了三秒後雨棚會蓋住：喝完馬上 J。']),

  // Drink and throw up onto the deck: the throw spends the grade, so you land sober. The door is in the
  // covered passage underneath, over glass, and its floor is a hallucination: drink the second bottle on the
  // deck, wait for the floor to appear, drop through the hatch and walk in. Throwing there would fade it.
  artRoom('L3-4', '醉了又醒', 'street', 0,
    ['解法：喝，丟上平台。丟完你又清醒了。', '門在下面的騎樓裡，地板是幻覺：平台上再喝一瓶，等地板出現，再從洞口跳下去走進門。'], [
      ...Array(8).fill(EMPTY),
      '......................D.........',
      '........####################..##',
      ...Array(5).fill('........########................'),
      '.P..D...########O...............',
      '##################^^^^^^^^^^^^##',
      FLOOR,
    ], {
      1: [...Array(16).fill(EMPTY), '..................############..', EMPTY],
    }),
];

// Where a patrol stands after `secs`, bouncing between its two turning points.
const ahead = (e, secs, lo, hi) => {
  let x = e.x, dir = e.dir, left = secs * 110;
  while (left > 0) {
    const room = dir > 0 ? hi - x : x - lo, step = Math.min(room, left);
    x += dir * step; left -= step;
    if (left > 0) dir = -dir;
  }
  return x;
};
const guard = g => g.entities.find(e => e.kind === 'patrol' && e.alive);
const landRight = r => r.until(g => g.body.grounded && !g.chillAirUsed, 8, { right: true });
const drunk = (r, input) => r.until(g => g.targetStage() > 0, 10, input);
// jump, fart near the top, and keep pushing right until standing above `y`
const fartUp = (r, y) => {
  r.tick({ right: true, jump: true, jumpPressed: true });
  r.wait(0.3, { right: true, jump: true });
  r.tick({ right: true, jump: true, kPressed: true });
  r.until(g => g.body.grounded && g.body.y <= y, 3, { right: true, jump: true });
};

export const plans = {
  'P1-1': r => {
    for (const [x, y] of [[230, 600], [560, 560], [640, 480], [800, 480]]) r.stair(x, y);
    // leap from the walkway over the first boxes and keep moving before the second stack gives way
    r.until(g => g.body.x >= 830, 1, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded, 2, { right: true, jump: true });
    r.until(g => g.body.x >= 1110 && g.body.grounded, 2, { right: true });
    r.finish();
  },
  'P1-2': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    r.stair(620, 560);
    // hop the chair as it rolls up to the desk, then run for the paper boxes
    r.until(g => chair().dir < 0 && chair().x < 800 && chair().x > 720, 12);
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded, 2, { right: true, jump: true });
    r.stair(1040, 560);
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded && g.body.y <= 480, 2, { right: true, jump: true });
    r.finish();
  },
  'P1-3': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    for (const [x, y] of [[230, 560], [430, 480], [600, 400], [820, 320], [960, 240]]) r.stair(x, y);
    r.until(g => chair().dir < 0 && chair().x - g.body.x < 170, 12);
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded, 2, { right: true, jump: true });
    r.finish();
  },
  'L2-1': r => {
    drunk(r, { right: true });
    r.world(); r.finish();
  },
  'L2-2': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 500, 3, { right: true });
    fartUp(r, 480); r.finish();
  },
  'L2-3': r => {
    drunk(r, { right: true });
    r.world();
    r.until(g => g.body.x >= 500, 3, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.wait(0.3, { right: true, jump: true });
    r.tick({ right: true, jump: true, kPressed: true });
    r.until(g => g.targetStage() > 0, 3, { right: true });
    r.until(g => g.body.grounded && g.body.x >= 980, 3, { right: true });
    fartUp(r, 480); r.finish();
  },
  'L2-4': r => {
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [460, 320]]) r.stair(x, y);
    r.until(g => Math.abs(ahead(guard(g), 3, 582, 1058) - 820) < 24, 10);
    r.grade(-1); r.world();
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 715, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
  'L2-5': r => {
    drunk(r, { right: true });
    r.world();
    r.until(g => g.body.x >= 960, 3, { right: true });
    r.grade(-1); r.world();
    r.finish();
  },
  'L3-1': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 320, 2, { right: true });
    r.skill(); r.land(); r.finish();
  },
  'L3-2': r => {
    // drink at the spawn and stand clear of the steps: under loop rules a step that lands on you is a death
    drunk(r, { right: true });
    r.world();
    for (const [x, y] of [[300, 560], [420, 480], [540, 400], [660, 320], [780, 240], [940, 160]]) r.stair(x, y);
    r.finish();
  },
  'L3-3': r => {
    drunk(r, { right: true });
    r.skill(); landRight(r); r.finish();
  },
  'L3-4': r => {
    drunk(r, { right: true });
    r.skill(); landRight(r);
    r.until(g => g.targetStage() > 0, 3, { right: true });
    r.until(g => g.stage === 1 && !g.stageWarn, 8);
    r.until(g => g.body.grounded && g.body.y > 600, 4, { right: true });
    r.finish({ left: true });
  },
};

// Bottle-cap routes for the day-3 rooms that keep their old caps; checked when this file runs, not published as P.
export const capPlans = {
  'L3-1': r => {   // over the bottle, onto the sagging boxes, then jump and throw left onto the cabinet
    r.until(g => g.body.x >= 330, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.grounded && g.body.y < 600, 2, { jump: true, right: true });
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  'L3-2': r => {   // drink, then jump and throw left onto the shelf
    drunk(r, { right: true }); r.until(g => g.body.x >= 200, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  'L3-3': r => {   // drink at the counter, jump and throw up the counter face into the pocket
    drunk(r, { right: true }); r.wait(0.2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.wait(0.3, { jump: true, right: true });
    r.skill(); r.wait(0.5); landRight(r);
  },
};

const chain = list => list.map((room, i) => ({ ...room, portalTarget: list[i + 1]?.id ?? null }));

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
  maps: [{
    id: 'day-1', name: '第一天　辦公室', cells: 1, abilities: [], hud: false,
    intro: '連假前一晚。整層樓只剩吉姆一個人。\n老闆的專案明天要交，印表機又卡紙了。\n先去列印室，把那疊東西印出來。',
    outro: '推開公司大門。\n街上來來往往，全是醉漢。\n……三小？',
    rooms: chain(day1),
  }, {
    id: 'day-2', name: '第二天　微醺', cells: 1, abilities: [],
    intro: '街上每個人都在喝。有人塞了一瓶給吉姆。\n喝了，路就歪了：不存在的橋，走得上去。\n放個屁，酒醒一點，幻覺三秒後就散。',
    outro: '門後站著一個紫色的人影。\n長得跟我一模一樣。',
    rooms: chain(day2),
  }, {
    id: 'day-3', name: '第三天　醉影', cells: 1, abilities: ['wrestler'],
    intro: '喝醉的時候，那個人影就在。\n他把我整個舉起來，丟了出去。\n只是他每出手一次，我就醒一點。',
    outro: '醉影把我丟過了半個城市。明天再走。',
    rooms: chain(day3),
  }],
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const routes = { stepHz: STEP_HZ, rules: 'chill-puzzle', rooms: {} };
  campaign.maps.forEach((map, mapIndex) => {
    for (const room of map.rooms) {
      const recorded = recordRoom(campaign, room.id, plans[room.id], { mapIndex });
      const route = { signature: recorded.signature, steps: recorded.steps };
      assert.equal(replayRoom(campaign, room.id, route, mapIndex).nextRoom, recorded.game.nextRoom, `${room.id}: replay differs`);
      routes.rooms[`${map.id}:${room.id}`] = route;
      console.log(`${room.id}: ${(recorded.frames / STEP_HZ).toFixed(2)} s, replayed`);
    }
  });
  for (const [id, plan] of Object.entries(capPlans)) {
    const { game } = recordRoom(campaign, id, plan, { mapIndex: campaign.maps.findIndex(m => m.rooms.some(room => room.id === id)), requireExit: false });
    assert.ok([...game.capsGot].some(key => key.includes(`:${id}:`)), `${id}: cap route missed the cap`);
    console.log(`${id}: cap route ok`);
  }
  writeFileSync(new URL('../../prototype/chill-loop.json', import.meta.url), JSON.stringify(campaign, null, 2) + '\n');
  writeFileSync(new URL('../../prototype/chill-loop-routes.json', import.meta.url), JSON.stringify(routes, null, 2) + '\n');
  console.log('Wrote prototype/chill-loop.json and chill-loop-routes.json');
}
