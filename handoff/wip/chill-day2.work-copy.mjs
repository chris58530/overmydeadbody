// Day 2 (grades 0-2): the shoulder charge. A charge breaks crates and walks over glass,
// but needs four tiles of headroom; under a three-tile ceiling only the short, low throw works.
import { artRoom } from '../kit/chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

export const rooms = [
  // A crate plug in a low tunnel, a guard pacing behind it. The throw bounces off the crates;
  // the charge breaks them and knocks the guard, but only if he is inside its twelve tiles.
  artRoom('2-1', '紙箱牆', 'street', 1,
    ['丟：撞到紙箱彈回來。', 'E 到大醉，走近紙箱，等警衛走過來再衝：衝只有十二格，衝完在地道裡只丟得出五格。', '瓶蓋：大廳裡跳起來再衝右牆，衝撞牆往上丟比地面高三格。'], [
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############......*',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........###############.......',
      '..........BB....................',
      '..........BB....................',
      '..........BB....................',
      '..P.......BB........R........O..',
      FLOOR, FLOOR,
    ]),

  // Glass from the belt's end to the far wall. A K and a plain throw land on the glass; a charge
  // from the spawn runs out over it. Charge from the last tiles of the belt: the shadow walks the
  // glass, meets the wall and throws up its face.
  artRoom('2-2', '玻璃地道', 'elevator', 2,
    ['K 到微醺丟：地道只丟得出五格，落在玻璃上。', '從出生點衝：十二格衝到玻璃中間就停，往前丟五格還是玻璃。', '輸送帶把人推向玻璃：走到最後兩三格（玻璃前）就衝，撞到牆往上丟。', '瓶蓋：在樓頂邊跳起來往左衝，平飛過天井。'], [
      EMPTY,
      '..............*.................',
      EMPTY, EMPTY, EMPTY, EMPTY,
      '.............................O..',
      '......................##########',
      '......................##########',
      '......................##########',
      '####################..##########',
      '####################..##########',
      '......................##########',
      '......................##########',
      '......................##########',
      '..P.........^^^^^^^^^^##########',
      '####>>>>>>>>####################',
      FLOOR,
    ]),

  // One sip does two things: the charge now, the stairs in three seconds. Wait, and the
  // grade-two ceiling sinks too low for the shadow; the guard past the glass pit stays standing.
  artRoom('2-3', '地下道', 'street', 1,
    ['微醺丟：地道裡丟不過玻璃坑。', 'E 之後三秒內要衝：大醉的天花板會壓到三格高，衝不出來。', '從坑邊衝才撞得到另一頭的警衛；三秒後大醉的台階出現，爬上去再衝牆往上丟。', '瓶蓋：趁世界還是微醺時跳起來往左衝；或在台階頂 K，趁台階還在往左丟。'], [
      EMPTY, EMPTY, EMPTY,
      '..............*...............O.',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '........................########',
      '##################......########',
      '##################......########',
      '........................########',
      '........................########',
      '........................########',
      '.P............R...#.....########',
      '####^^^^^^^#####################',
      FLOOR,
    ], {
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '##################....##........',
        '......................##........',
        '.....................###........',
        '.....................###........',
        EMPTY, EMPTY,
      ],
    }),

  // Two roofs over a glass pit, a guard pacing the low one. Sober up on the high roof and you
  // land on the low roof three seconds later, with only a throw left; sober up again and the low
  // roof goes too, guard and all.
  artRoom('2-4', '雙層天橋', 'street', 2,
    ['衝撞樓房往上丟，走上大醉的高屋頂。K 之後三秒落到低屋頂，那時你只剩微醺的丟。', '警衛在低屋頂來回：等他走到你腳下（或剛走過）再 K，落下時他已走遠；落地馬上再 K。', '三秒後低屋頂消失：你要站在右邊實地上方，他要在玻璃坑上方。', '瓶蓋在低屋頂左端（玻璃上方）：落在那裡，再丟過警衛回右邊；或 E 回大醉衝倒他。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '..........####..................',
      '..........####..................',
      '..........####..................',
      '..........####*.R...............',
      '..........####..................',
      '..........####..................',
      '..........####..................',
      '..........####..................',
      '..P.......####..........O.......',
      '##############^^^^^^^^^#########',
      FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '..............##################',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '..............##################',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),

  // The whole cycle in one room. Sip and throw before the awning; the roof belt runs back
  // toward the edge while sober and toward the glass once the world turns tipsy, so the next
  // sip and charge go right then, before the ceiling over the glass sinks. The charge ends on a
  // trapdoor that opens at grade two; sober up twice in the courtyard and the wall before the
  // real door is gone.
  artRoom('2-5', '回家的第二段', 'lobby', 0,
    ['E 馬上丟上屋頂（微醺的雨棚會封住地面）。清醒時屋頂的輸送帶往左把人送下屋頂，先頂著走。', '世界變微醺後輸送帶反向推向玻璃：E 馬上衝（大醉的天花板會壓低），衝過玻璃停在活板門上。', '大醉時活板門打開掉進院子，K 兩次，微醺的牆消失，門在牆後。', '瓶蓋：落在活板門上後馬上再衝右牆，趁門還沒開往上丟；或貼著玻璃邊才衝，衝完在露天處丟進右牆。'], [
      '.................##########....*',
      '.................##########.....',
      '.................##########.....',
      '.................##########.....',
      '.................##########.....',
      '.................##########.....',
      EMPTY, EMPTY, EMPTY,
      '..................^^^^^^^.......',
      '..........<<<<<<<<##############',
      '..........######................',
      '..........######................',
      '..........######................',
      '..........######................',
      '..P.......######.O..............',
      FLOOR, FLOOR,
    ], {
      1: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '##########>>>>>>>>..............',
        '##########........#.............',
        '..................#.............',
        '..................#.............',
        '..................#.............',
        '..................#.............',
        EMPTY, EMPTY,
      ],
      2: [
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
        '.................##########.....',
        EMPTY, EMPTY, EMPTY,
        '..........<<<<<<<<........._____',
        EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      ],
    }),
];

export const plans = {
  '2-1': r => { r.grade(1); r.until(g => g.body.x >= 300, 2, { right: true }); r.skill(); r.land(); r.finish(); },
  '2-2': r => { r.until(g => g.body.x >= 380, 2, { right: true }); r.skill(); r.until(g => g.body.grounded && g.state === 'free' && g.body.y < 400, 4, { right: true }); r.finish(); },
  '2-3': r => {
    r.grade(1); r.until(g => g.body.x >= 150, 2, { right: true }); r.skill(); r.land(); r.world();
    r.stair(860, 560); r.stair(920, 480);
    r.skill(); r.until(g => g.body.grounded && g.state === 'free' && g.body.y < 200, 4, { right: true }); r.finish();
  },
  '2-4': r => {
    const guard = g => g.entities.find(e => e.kind === 'patrol');
    r.skill(); r.until(g => g.body.grounded && g.state === 'free' && g.body.y < 300, 3, { right: true });
    r.until(g => g.body.x >= 1180, 3, { right: true });
    // sober up once he has passed under Jim (or is about to turn at the wall above the door)
    r.until(g => { const e = guard(g); return e.dir < 0 ? e.x >= 900 : e.x >= 1150; }, 14);
    r.grade(-1); r.world(); r.grade(-1); r.world(); r.land(); r.finish({ left: true });
  },
  '2-5': r => {
    r.grade(1); r.skill(); r.land();
    // the sober belt runs left: hold a spot on it until the world turns tipsy
    while (r.game.stageWarn) r.tick(r.game.body.x < 520 ? { right: true } : {});
    r.grade(1); r.skill(); r.land(); r.world(); r.land();
    r.grade(-1); r.world(); r.grade(-1); r.world();
    r.finish({ left: true });
  },
};
