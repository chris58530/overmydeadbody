// Day 2 under bottle rules: grades 0-2, single skills. Grade 1 throws (an arc), grade 2 charges (flat, through
// crates, guards and glass, needs about four tiles of headroom). Bottles bring a grade up, one in hand; K is free.
// Overlays stack, so the grade-2 world also shows anything drawn for grade 1.
import { artRoom } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

export const rooms = [
  // The crate wall runs up to the ceiling, so the throw cannot clear it: drink and charge through.
  artRoom('B2-1', '紙箱牆', 'office', 1,
    ['解法：撿酒 E 到大醉，走到紙箱牆前 J。衝會撞破紙箱、踩過碎玻璃。'], [
      EMPTY, EMPTY, EMPTY,
      FLOOR,
      ...Array(11).fill('..........BB....................'),
      '..P..D....BB..................O.',
      '############^^^^^^^^^^##########',
      FLOOR,
    ]),

  // No bottles. Charge through the crates and over the glass, then fart down a grade: K picks the throw too.
  artRoom('B2-2', '換一招', 'office', 2,
    ['解法：大醉 J 衝過紙箱和玻璃，撞到平台會彈回來。', 'K 降到微醺，J 就變成丟，丟上平台。'], [
      EMPTY, EMPTY, EMPTY,
      '##################..............',
      ...Array(5).fill('........BB......................'),
      '........BB....................O.',
      ...Array(5).fill('........BB..............########'),
      '..P.....BB..............########',
      '##########^^^^^^^^##############',
      FLOOR,
    ]),

  // Under the arcade awning the throw falls short. The charge just fits, but in the grade-two world
  // the awning hangs one tile lower: drink at the glass and charge at once.
  artRoom('B2-3', '騎樓', 'street', 1,
    ['解法：雨棚下丟不遠。大醉的衝剛好塞得下，但大醉的世界裡雨棚會再低一格。', '撿酒，E 之後馬上 J。'], [
      ...Array(11).fill(EMPTY),
      '#########################.......',
      EMPTY, EMPTY, EMPTY,
      '..P.D.........................O.',
      '######^^^^^^^^^^^^^^############',
      FLOOR,
    ], {
      2: [
        ...Array(12).fill(EMPTY),
        '#########################.......',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // One bottle in hand at a time. Drink the first and throw up to the roof, where the second waits;
  // drink it too and charge through the crates and over the glass.
  artRoom('B2-4', '兩瓶', 'street', 0,
    ['解法：一次只拿得動一瓶。撿第一瓶喝掉，丟上屋頂。', '屋頂上撿第二瓶，等三秒後再喝，到大醉衝過紙箱和玻璃。'], [
      EMPTY, EMPTY, EMPTY,
      '..........######################',
      ...Array(4).fill('................BB..............'),
      '............D...BB............O.',
      '..........########^^^^^^^^######',
      ...Array(5).fill('..........######################'),
      '..P.D.....######################',
      FLOOR, FLOOR,
    ]),

  // The guard walks the arcade beyond the glass; only the charge gets past him. The steps up to the
  // throw exist only in the grade-two world: climb them, fart down, and throw before they fade.
  artRoom('B2-5', '回家的第二段', 'street', 2,
    ['解法：雨棚下跳不過警衛。大醉 J 衝過玻璃，撞飛警衛。', '台階只在大醉的世界裡。爬上去，K 降到微醺，馬上 J 丟上樓頂：三秒後台階就不見了。'], [
      EMPTY, EMPTY, EMPTY, EMPTY,
      '.............................O..',
      ...Array(6).fill('..........................######'),
      '################..........######',
      ...Array(3).fill('..........................######'),
      '.P......R.................######',
      '####^^^^########################',
      FLOOR,
    ], {
      2: [
        ...Array(12).fill(EMPTY),
        '....................###.........',
        EMPTY,
        '..................##............',
        EMPTY, EMPTY, EMPTY,
      ],
    }),
];

const landRight = r => r.until(g => g.body.grounded && !g.chillAirUsed, 8, { right: true });

export const plans = {
  'B2-1': r => {
    r.until(g => g.held, 2, { right: true });
    r.grade(1);
    r.until(g => g.body.x >= 360, 3, { right: true });
    r.skill(); r.land(); r.finish();
  },
  'B2-2': r => {
    r.until(g => g.body.x >= 290, 2, { right: true });
    r.skill(); r.land();
    r.grade(-1); r.skill();
    r.until(g => g.body.grounded && g.body.y <= 400, 4, { right: true });
    r.finish();
  },
  'B2-3': r => {
    r.until(g => g.held, 2, { right: true });
    r.grade(1); r.skill(); r.land(); r.finish();
  },
  'B2-4': r => {
    r.until(g => g.held, 2, { right: true });
    r.grade(1); r.skill();
    r.until(g => g.body.grounded && g.body.y <= 360, 4, { right: true });
    r.until(g => g.held, 3, { left: true });
    r.world();
    r.grade(1); r.skill(); r.land(); r.finish();
  },
  'B2-5': r => {
    r.skill(); r.land();
    r.stair(760, 560); r.stair(860, 480);
    r.grade(-1); r.skill();
    landRight(r);
    r.finish();
  },
};
