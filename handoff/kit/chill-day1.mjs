// Day 1 (grades 0-1): sober or tipsy. The only move is the throw.
// Rooms teach E/J, then the three-second delay in both directions, then K and the falling guard.
import { artRoom } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

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
// Hold right through the throw: against a face, the shadow's arc slides up and tips over the top.
const landRight = r => r.until(g => g.body.grounded && !g.chillAirUsed, 8, { right: true });

export const rooms = [
  // Sober Jim cannot call the shadow. Under the cabinet the throw only bumps his head;
  // step out, sip, throw over the partition. Cap: on the cabinet, from the crumbling boxes.
  artRoom('1-1', '檔案櫃', 'office', 0,
    ['解法：清醒時 J 叫不出醉影；E 喝一口。', '櫃子下面頭頂只有三格，J 只會撞頭：走出來再 J，丟過隔板。',
      '瓶蓋：跳上紙箱（0.45 秒就塌），馬上跳起來再 J 往左，落在櫃頂。'], [
      EMPTY, EMPTY, EMPTY,
      '..*.............................',
      '#######.........................',
      '#######.........................',
      '#######.........................',
      '#######.........................',
      '#######.........................',
      '#######.........................',
      '#######.......##................',
      '#######.......##................',
      '#######.......##................',
      '..............##................',
      '.........CC...##................',
      '...P.....CC...##.............O..',
      FLOOR, FLOOR,
    ]),

  // Grade-one stairs arrive three seconds after the sip. A throw from the floor, even after a jump,
  // tops out two tiles under the landing. The office chair rolls in while you wait.
  artRoom('1-2', '轉椅', 'office', 0,
    ['解法：E 之後馬上 J 會差一截；等三秒，樓梯出現再爬。', '等的時候轉椅會滾過來，跳過它。',
      '瓶蓋：在左上的層板上，樓梯出現後從中段往左丟，或從地上跳起來再 J。'], [
      EMPTY, EMPTY, EMPTY,
      '..............................O.',
      '......................##########',
      '.*....................##########',
      '###...................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '..P.........R.........##########',
      FLOOR, FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '..................###...........',
        '..................###...........',
        '...............###..............',
        '...............###..............',
        '............###.................',
        '............###.................',
        '.........###....................',
        '.........###....................',
        '......###.......................',
        EMPTY, EMPTY, EMPTY,
      ],
    }),

  // Only the strip by the counter is open to the sky, and the belt drags you away from it.
  // The grade-one awning closes the strip three seconds after the sip: walk there first, then sip and throw.
  artRoom('1-3', '午後雷陣雨', 'pantry', 0,
    ['解法：先頂著輸送帶走到檯子邊，再 E，馬上 J。', '在出生點喝或喝完等，雨棚會先蓋住（K 可以收回來重來）。',
      '瓶蓋：在檯子邊趁雨棚還沒出現，跳起來再 J，貼著牆往上。'], [
      EMPTY, EMPTY, EMPTY, EMPTY,
      '.......................*........',
      '........................########',
      '###################.............',
      EMPTY,
      '..............................O.',
      '........................########',
      '###################.....########',
      '###################.....########',
      '........................########',
      '........................########',
      '........................########',
      '.P......................########',
      '######<<<<<<<<<<<<<<<<<<########',
      FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '...................#####........',
        '...................#####........',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // The courtyard roof is a grade-one bridge with a guard on it; glass in the middle of the yard.
  // K on your own stretch of bridge: three seconds later both of you drop. Time it so he lands on the glass.
  artRoom('1-4', '夜班警衛', 'street', 1,
    ['解法：爬到自己那段橋上，看警衛走：K 之後三秒他大約走八格，碰到盡頭會折返。',
      '算好讓他三秒後在中間的玻璃上方，掉下去就倒了；落地後跳過玻璃進門。',
      '亂按：他落在門那邊或你這邊，堵門或撞死你。',
      '瓶蓋：在右邊屋頂，趁警衛朝你走來時 J 從他頭上丟過去，跳過屋頂的矮牆，再找時機 K。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '....................R......#...*',
      '........#..................#####',
      '........#.......................',
      '......###.......................',
      '......###.......................',
      '....#####.......................',
      '....#####.......................',
      '...######.......................',
      '.P.######.....................O.',
      '###################^^^##########',
      FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '.........####.#############.....',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // One sip does three things: the throw now, the awning in three seconds, and the guard's
  // bridge gone in three seconds. Lure the sign down, wait at the counter for the guard, then sip.
  artRoom('1-5', '回家的第一段', 'street', 0,
    ['解法：先走進空地把招牌騙下來，退開等它砸地。', '貼著台子看警衛：E 之後馬上 J 上台子；同一口酒三秒後拆掉警衛的橋，要讓他掉在玻璃上。',
      '台子上等橋消失，走下院子，跳過玻璃進門。',
      '瓶蓋：在橋的盡頭。警衛倒了之後 K，橋回來，走過去拿，再 E 掉下去。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '..............L.................',
      EMPTY, EMPTY,
      '..........................R....*',
      '................####.###########',
      '############....####............',
      '############....####............',
      '................####............',
      '................####............',
      '................####............',
      '.P..............####..........O.',
      '###<<<<<<<<<<<<<##########^^^###',
      FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '.....................___________',
        '............####................',
        '............####................',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),
];

// Guard turning points (patrol centre x) and the glass centre under each bridge.
const YARD = { '1-4': [582, 1058, 820], '1-5': [862, 1258, 1100] };
const waitForGuard = (r, id, input = {}) => {
  const [lo, hi, glass] = YARD[id];
  r.until(g => Math.abs(ahead(guard(g), 3, lo, hi) - glass) < 24, 10, input);
};

export const plans = {
  '1-1': r => {
    r.grade(1);
    r.until(g => g.body.x >= 320, 2, { right: true });
    r.skill(); r.land(); r.finish();
  },
  '1-2': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    r.grade(1);
    r.until(g => chair().x < g.body.x + 120, 6);
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.world();
    for (const [x, y] of [[300, 560], [420, 480], [540, 400], [660, 320], [780, 240], [940, 160]]) r.stair(x, y);
    r.finish();
  },
  '1-3': r => {
    r.until(g => g.body.x >= 930, 8, { right: true });
    r.grade(1); r.skill(); landRight(r); r.finish();
  },
  '1-4': r => {
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [460, 320]]) r.stair(x, y);
    waitForGuard(r, '1-4');
    r.grade(-1); r.world();
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 715, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
  '1-5': r => {
    const sign = () => r.game.entities.find(e => e.kind === 'faller');
    r.until(g => sign().phase !== 'idle', 6, { right: true });
    r.until(g => sign().phase === 'gone', 3, { left: true });
    r.until(g => g.body.x >= 610, 4, { right: true });
    waitForGuard(r, '1-5', { right: true });
    r.grade(1); r.skill(); landRight(r); r.world();
    r.until(g => g.body.x >= 830, 3, { right: true });
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 1000, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
};

// Optional bottle-cap routes (verified with recordRoom; not published as P routes).
export const capPlans = {
  '1-1': r => {   // onto the crumbling boxes, then jump + J left before they give way
    r.grade(1); r.until(g => g.body.x >= 330, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.grounded && g.body.y < 600, 2, { jump: true, right: true });
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  '1-2': r => {   // jump + J from the floor onto the shelf
    r.grade(1); r.until(g => g.body.x >= 200, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  '1-3': r => {   // inside the window: jump + J up the counter face, then tip into the pocket
    r.until(g => g.body.x >= 930, 8, { right: true }); r.grade(1); r.wait(0.2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.wait(0.3, { jump: true, right: true });
    r.skill(); r.wait(0.5); landRight(r); r.finish();
  },
  '1-4': r => {   // throw over the guard as he walks toward you, hop the low wall, then time K from the roof
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [480, 320]]) r.stair(x, y);
    r.until(g => guard(g).dir < 0 && guard(g).x < 700, 10);
    r.skill(); landRight(r);
    r.until(g => g.body.x >= 1030, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.grounded, 2, { jump: true, right: true });
    waitForGuard(r, '1-4');
    r.grade(-1); r.world(); r.wait(0.3);
    r.tick({ jumpPressed: true, jump: true, left: true }); r.until(g => g.body.x < 1030, 2, { jump: true, left: true });
    r.until(g => g.body.grounded && g.body.y > 600, 3); r.finish({ right: true }, 4);
  },
  '1-5': r => {   // after the guard is down: K brings the bridge back, walk to its end, E drops you by the door
    const sign = () => r.game.entities.find(e => e.kind === 'faller');
    r.until(g => sign().phase !== 'idle', 6, { right: true }); r.until(g => sign().phase === 'gone', 3, { left: true });
    r.until(g => g.body.x >= 610, 4, { right: true });
    waitForGuard(r, '1-5', { right: true });
    r.grade(1); r.skill(); landRight(r); r.world();
    r.wait(0.8); r.grade(-1); r.world();
    r.until(g => g.body.x >= 790, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.x >= 1250, 4, { right: true, jump: true });
    r.grade(1); r.world(); r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.finish({ left: true }, 4);
  },
};
