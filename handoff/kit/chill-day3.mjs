// Day 3 (grades 0-3): Jim's own enormous fart. The rise breaks crates overhead and goes very high,
// but its charge needs about four tiles above the peak: under a low awning the chain stalls.
import { artRoom } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

export const rooms = [
  // A crate lid over the cellar: the charge only bumps it, the rise goes straight through.
  // A chair rolls along the lid; break the lid under it and it drops on your head.
  artRoom('3-1', '酒窖', 'lobby', 2,
    ['解法：大醉的衝撞牆後往上丟，只會撞到紙箱蓋子。E 到爛醉，J 升天撞破蓋子，接著衝、丟，落在門口。',
      '椅子在蓋子上來回滾：蓋子一破，上面的東西會掉下來。等椅子滾到右邊的屋頂上再升天，不要從它正下方升。',
      '瓶蓋：在高處，一般升天的衝刺從它下面掠過；先跳起來再 J，整條連段高一截，衝刺會掃到它。'], [
      EMPTY,
      EMPTY,
      '........*.......................',
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '...........R....................',
      'BBBBBB#######...................',
      '......#######...................',
      '......#######...................',
      '......#######...................',
      '......#######...................',
      '......#######...................',
      '..P...#######.................O.',
      FLOOR, FLOOR,
    ]),

  // Under the arcade awning the rise has no room left for its charge: it stalls and drops Jim back
  // where he started, with the guard walking up the arcade toward him. One grade lower the charge
  // flattens the guard, crosses the glass and the throw clears the far wall.
  artRoom('3-2', '騎樓', 'street', 3,
    ['解法：爛醉 J 升天會卡在雨棚下，掉回原地；跳起來再升天也一樣。',
      '警衛沿著騎樓走過來，兩秒就到身邊（升天卡住掉回來後只剩一秒多）：K 到大醉，馬上 J。衝撞飛警衛、踩過玻璃，撞牆往上丟上樓頂。',
      '瓶蓋：在雨棚頂上。上了樓頂還是大醉，面向左 J：衝一撞到雨棚尾端就往上丟，落在雨棚頂。再從雨棚尾端跳回樓頂。'], [
      EMPTY, EMPTY, EMPTY,
      '......*.........................',
      '###################.............',
      EMPTY, EMPTY,
      '..............................O.',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '....................############',
      '.P......R^^^^^^^^^^^############',
      FLOOR, FLOOR,
    ]),

  // The same lid, but at grade three it is a steel shutter. Sober up, let the crates come back,
  // then sip and rise before the shutter does. The cellar floor under the lid is crumbling boxes
  // over glass, so the waiting happens on the ledge.
  artRoom('3-3', '鐵捲門', 'lobby', 3,
    ['解法：爛醉時蓋子是鐵的，升天撞不破；大醉的衝撞牆往上丟也撞不破紙箱。',
      'K 到大醉，三秒後蓋子變回紙箱。站在左邊的地板上 E 回爛醉，趁世界還是大醉的三秒內走上紙箱地板 J（或跳過去在空中 J）。',
      '只有站在蓋子正下方才撞得破；那裡是紙箱地板，踩上去不到半秒就塌，下面是玻璃：不能站在上面等。',
      '瓶蓋：在左邊天花板上面。升天時面向左：衝撞到左牆往上丟，落在天花板上。拿到後往右走下去，在外面的地上再升天一次上樓頂。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '..............................O.',
      '......................##########',
      '......................##########',
      '.*....................##########',
      '###BBB#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '......#...............##########',
      '.P....#...............##########',
      '###CCC##########################',
      '###^^^##########################',
      FLOOR,
    ], {
      3: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '...###..........................',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // The canopy over the street is low enough to stall the rise. Past its edge there is only glass,
  // until grade two lays a plank walk out to a stack of crumbling boxes. At grade three the boxes
  // are gone and the hanging billboard seals the sky in front of the tower: rise in between.
  artRoom('3-4', '醉到剛好', 'street', 1,
    ['解法：雨棚下爛醉升天會卡住；雨棚外只有玻璃。E 到大醉，三秒後木棧道和尾端的紙箱出現。',
      '紙箱一踩就塌，不能站在上面等：走到棧道尾端（還在雨棚下）E 到爛醉，再走上紙箱 J。',
      '三秒後紙箱消失、招牌垂下來封住大樓前的天空；升天、衝撞牆、往上丟，趕在那之前上樓頂。',
      '瓶蓋：在雨棚頂上。站上紙箱後面向左 J：衝一撞到雨棚邊就往上丟，落在雨棚頂。拿完 K 回大醉，等招牌收起來，從雨棚頂衝向大樓。'], [
      EMPTY, EMPTY,
      '..............................O.',
      '........................########',
      '........................########',
      '..*.....................########',
      '##################......########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '.P......................########',
      '############^^^^^^^^^^^^########',
      FLOOR,
    ], {
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '............######CCC...........',
        EMPTY,
      ],
      3: [
        '..................######........',
        '..................######........',
        '..................######........',
        '..................######........',
        '..................######........',
        '..................######........',
        '..................######........',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '............^^^^^^^^^...........',
        EMPTY,
      ],
    }),

  // Home. Rise out of the bar onto a crawlspace roof too low for the charge. A guard walks the far half,
  // fenced in by a wall that only stands while blackout drunk. Each K takes one layer away three seconds
  // later: the wall and the bridge under the guard, then the high roof, then the low roof by the door.
  artRoom('3-5', '天亮前', 'street', 3,
    ['解法：升天撞破酒吧的蓋子，衝撞牆、丟上低矮的屋頂夾層。夾層太矮，大醉的衝出不來，也跳不過警衛。',
      '警衛在牆後來回走。K 之後三秒，牆和他腳下的橋一起消失：要算好，讓他三秒後正好走在橋上，掉進下面的玻璃。',
      '警衛掉下去之後跳過缺口，站到右半邊（下面有低屋頂的地方）再 K：高屋頂消失，落到低屋頂。',
      '低屋頂是往左的輸送帶，左邊是玻璃，按住右；馬上再 K，三秒後落地進門。',
      '瓶蓋：右邊高處。落到低屋頂後還是微醺，K 之前 J 把自己丟上去拿。'], [
      EMPTY, EMPTY,
      '........................R.......',
      '..............#.................',
      '..............#................*',
      '..............#.................',
      '..............#.................',
      '..............#.................',
      '..............#.................',
      'BBBBBB........#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '......#.......#.................',
      '..P...#.......#^^^^^^^^^^^^^...O',
      FLOOR, FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '........................<<<<<<<<',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      2: [
        '...........................#....',
        '...........................#....',
        '...........................#....',
        '...............#####...####.....',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      3: [
        '...................#............',
        '...................#............',
        '...................#............',
        '....................###.........',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),
];

const untilLanded = r => r.until(g => g.body.grounded && !['thrown', 'lift', 'charge'].includes(g.state) && !g.chain.length, 5, { right: true });
const guard = g => g.entities.find(e => e.kind === 'patrol');
// Patrol centre x after t seconds, bouncing between turning points lo and hi.
const patrolAt = (e, t, lo, hi) => {
  const span = hi - lo, speed = 110;
  let s = (e.dir > 0 ? e.x - lo : 2 * span - (e.x - lo)) + speed * t;
  s %= 2 * span;
  return s <= span ? lo + s : hi - (s - span);
};

export const plans = {
  '3-1': r => { r.grade(1); r.skill(); r.land(); r.finish(); },
  '3-2': r => { r.grade(-1); r.skill(); untilLanded(r); r.land(); r.finish(); },
  '3-3': r => {
    r.grade(-1); r.world(); r.grade(1);
    r.until(g => g.body.x >= 160, 2, { right: true });
    r.skill(); r.land(); r.finish();
  },
  '3-4': r => {
    r.grade(1);
    r.until(g => g.body.x >= 430, 3, { right: true });
    r.world();
    r.until(g => g.body.x >= 650, 3, { right: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    r.grade(1);
    r.until(g => g.body.x >= 750, 2, { right: true });
    r.skill(); untilLanded(r); r.finish();
  },
  '3-5': r => {
    r.skill(); untilLanded(r); r.land();
    // sober up once the guard will be over the bridge three seconds from now
    r.until(g => { const x = patrolAt(guard(g), 3.1, 822, 1058); return x > 835 && x < 885; }, 6);
    r.grade(-1); r.world();
    r.until(g => g.body.x >= 818, 2, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded && g.body.x >= 1000, 2, { right: true, jump: true });
    r.grade(-1); r.world(); r.land();
    // the low roof carries you left toward the glass: keep walking right while it fades
    r.grade(-1); r.until(g => !g.stageWarn, 4, { right: true }); r.land(); r.finish();
  },
};

// Optional bottle-cap routes (verified with recordRoom; not published as P routes).
export const capPlans = {
  '3-1': r => {
    r.grade(1);
    r.tick({ jumpPressed: true, jump: true }); r.wait(0.3, { jump: true });
    r.skill(); untilLanded(r); r.finish();
  },
  '3-2': r => {
    r.grade(-1); r.skill(); untilLanded(r); r.land();
    r.skill(-1); r.land();
    r.until(g => g.body.x <= 260, 3, { left: true });
    r.until(g => g.body.x >= 690, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 3, { jump: true, right: true });
    r.finish();
  },
  '3-3': r => {
    r.grade(-1); r.world(); r.grade(1);
    r.until(g => g.body.x >= 160, 2, { right: true });
    r.skill(-1); r.land();
    r.until(g => g.body.x <= 60, 2, { left: true });
    r.world();
    r.until(g => g.body.grounded && g.body.y > 560, 4, { right: true });
    r.skill(); untilLanded(r); r.finish();
  },
  '3-4': r => {
    r.grade(1);
    r.until(g => g.body.x >= 430, 3, { right: true });
    r.world();
    r.until(g => g.body.x >= 650, 3, { right: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    r.grade(1);
    r.until(g => g.body.x >= 750, 2, { right: true });
    r.skill(-1); r.land();
    r.until(g => g.body.x <= 100, 4, { left: true });
    r.world(); r.grade(-1); r.world();
    r.until(g => g.body.x >= 600, 3, { right: true });
    r.skill(); untilLanded(r); r.finish();
  },
  '3-5': r => {
    r.skill(); untilLanded(r); r.land();
    r.until(g => { const x = patrolAt(guard(g), 3.1, 822, 1058); return x > 835 && x < 885; }, 6);
    r.grade(-1); r.world();
    r.until(g => g.body.x >= 818, 2, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded && g.body.x >= 1000, 2, { right: true, jump: true });
    r.grade(-1); r.world(); r.land();
    r.until(g => g.body.x >= 1180, 2, { right: true });
    r.skill(); r.land();
    r.grade(-1); r.until(g => !g.stageWarn, 4, { right: true }); r.land(); r.finish();
  },
};
