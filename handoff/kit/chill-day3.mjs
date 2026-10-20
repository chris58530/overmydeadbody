// Day 3 (grades 0-3): Jim's own enormous fart. The rise breaks crates overhead and goes very high,
// but under an awning eight to eleven tiles up the shadow has no room to carry him.
import { artRoom } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

export const rooms = [
  // A crate lid over a short shaft: the charge only bumps it, the rise goes straight through.
  artRoom('3-1', '升天', 'lobby', 2,
    ['頭上是紙箱。', '爛醉時 J：先升天，再衝，再丟。'], [
      EMPTY,
      '................*...............',
      EMPTY, EMPTY, EMPTY,
      '..............................O.',
      '......................##########',
      '......................##########',
      '......................##########',
      'BBBBBB................##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '..P...#...............##########',
      FLOOR, FLOOR,
    ]),

  // Under the hall awning the rise leaves the shadow no room, even from a jump. One grade lower,
  // the charge crosses the glass and throws up the far wall.
  artRoom('3-2', '擠不出來', 'pantry', 3,
    ['雨棚太低，升不上去。', '爛醉不行，就 K 一下。'], [
      EMPTY, EMPTY,
      '.......................*........',
      EMPTY,
      '##################..............',
      EMPTY, EMPTY,
      '..............................O.',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '...P..^^^^^^^^^^^^^^############',
      FLOOR, FLOOR,
    ]),

  // The same crate lid, but at grade three it hardens. Sober up one grade, let the crates come back,
  // then sip and rise before the lid turns hard again.
  artRoom('3-3', '先醒一點', 'lobby', 3,
    ['蓋子是鐵做的？', '剛剛明明是紙箱。'], [
      EMPTY, EMPTY, EMPTY,
      '.........................*......',
      EMPTY,
      '..............................O.',
      '......................##########',
      '......................##########',
      '......................##########',
      'BBBBBB................##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '..P...#...............##########',
      FLOOR, FLOOR,
    ], {
      3: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '######..........................',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // Home is above a crate lid, too high to reach from the floor. The step under it exists only
  // at grade two: climb on drunk, then sip and rise before the step fades at grade three.
  artRoom('3-4', '醉到剛好', 'office', 1,
    ['門在天花板上面。', '大醉才看得到台子，再喝一口它就不見了。'], [
      '..........##OO##................',
      '..........BBBBBB................',
      EMPTY, EMPTY,
      '.........................*......',
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '...P............................',
      FLOOR, FLOOR,
    ], {
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '...........####.................',
        '.........######.................',
        '.........######.................',
        '.......########.................',
        '.......########.................',
        EMPTY, EMPTY,
      ],
      3: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '...........____.................',
        '.........______.................',
        '.........______.................',
        '.......________.................',
        '.......________.................',
        EMPTY, EMPTY,
      ],
    }),

  // Home. Rise out of the bar, then sober up one grade at a time: the wall on the roof goes,
  // the high roof goes, the low roof goes. Stand above the safe side before each step down.
  artRoom('3-5', '醒酒回家', 'street', 3,
    ['回家要清醒。'], [
      EMPTY, EMPTY, EMPTY, EMPTY,
      '..............#.................',
      '..............#.................',
      '..............#.................',
      '..............#................*',
      '..............#.................',
      'BBBBBB........#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '..P...#.......#^^^^^^^^^......O.',
      FLOOR, FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '........................########',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY,
        '...............#################',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      3: [
        '....................#...........',
        '....................#...........',
        '....................#...........',
        '....................#...........',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),
];

const untilLanded = r => r.until(g => g.body.grounded && !['thrown', 'lift', 'charge'].includes(g.state) && !g.chain.length, 5, { right: true });

export const plans = {
  '3-1': r => { r.grade(1); r.skill(); r.land(); r.finish(); },
  '3-2': r => {
    r.until(g => g.body.x >= 216, 2, { right: true });
    r.grade(-1); r.skill(); untilLanded(r); r.land(); r.finish();
  },
  '3-3': r => { r.grade(-1); r.world(); r.grade(1); r.skill(); r.land(); r.finish(); },
  '3-4': r => {
    r.grade(1); r.world();
    for (const [x, y] of [[320, 560], [400, 480], [520, 440]]) r.stair(x, y);
    r.grade(1); r.skill(); r.finish({}, 3);
  },
  '3-5': r => {
    r.skill(); untilLanded(r); r.land();
    r.grade(-1); r.world();
    r.until(g => g.body.x >= 1100, 4, { right: true });
    r.grade(-1); r.world(); r.land();
    r.grade(-1); r.world(); r.land(); r.finish();
  },
};
