// The drink-use-sober loop (bottles: "drink"). Touching a bottle drinks it (it comes back a few seconds later),
// J spends the grade it uses, K spends one as a double jump, and the world is the body three seconds ago.
// No room can be lost for good: every bottle comes back.
// Day 1 is the office prologue: run and jump only. Day 2: bottles and farts, no shadow. Day 3 brings the throw.
// No words anywhere under these rules: only the room number. The story comes later.
// node handoff/kit/chill-loop.mjs   writes prototype/chill-loop.json and chill-loop-routes.json
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artRoom, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

// The office prologue: run and jump only. No words; each room is one skill to get right.
// Jim on foot: a full jump is 2.8 tiles high and 6.3 far; a tap is 1.5 high and 3.4 far. He is 1.1 by 1.8 tiles.
export const day1 = [
  // Broken mugs: gaps of 3, 5 and 5 tiles, the last two onto and off a one-tile pillar two tiles up.
  artRoom('P1-1', '碎杯', 'office', 0, [], [
    ...Array(14).fill(EMPTY),
    '.......................#........',
    '.P.....................#......O.',
    '#####^^^###^^^^^##^^^^^#^^^^^###',
    FLOOR,
  ]),

  // Sagging boxes over glass: up three stacks, then hop the single boxes. Each stack gives way 0.45 s
  // after you land on it, and a full jump overshoots a single box: short hops, no stopping.
  artRoom('P1-2', '紙箱', 'office', 0, [], [
    ...Array(9).fill(EMPTY),
    '..............................O.',
    '..............CC...C...C...#####',
    '...........................#####',
    '..........CC...............#####',
    '...........................#####',
    '......CC...................#####',
    '.P.........................#####',
    '####^^^^^^^^^^^^^^^^^^^^^^^#####',
    FLOOR,
  ]),

  // The hallway: a low ceiling, the floor runs against you, and a tube lets go when you walk under it.
  // Step in and back to drop it, or jump through. One firm tile before the pit to time the chair from;
  // the chair rolls the far half up to the door.
  artRoom('P1-3', '走廊', 'office', 0, [], [
    ...Array(11).fill(FLOOR),
    FLOOR,
    '.........L...........L..........',
    EMPTY, EMPTY,
    '.P............................O.',
    '####<<<<<<<<#^^<<<<<<<<<<#######',
    FLOOR,
  ].map((row, y) => y === 15 ? row.slice(0, 28) + 'R' + row.slice(29) : row)),

  // Up to the door: rock, box, rail, box, back left onto the shelf, and out along the top past a tube.
  // Glass hangs under the top floor, so the box below it has to be left sideways.
  artRoom('P1-4', '下班', 'office', 0, [], [
    '...........................L....',
    EMPTY, EMPTY,
    '..............................O.',
    '......................##########',
    '......................^^^^^^^^^^',
    '................##..............',
    EMPTY,
    '.....................C..........',
    EMPTY,
    '................===.............',
    EMPTY,
    '............CC..................',
    EMPTY,
    '........##......................',
    '.P..............................',
    '######^^^^^^^^^^^^^^^^^^^^^^^^^^',
    FLOOR,
  ]),
];

// Day 2: bottles and K, no shadow. K is a double jump in the air, paid for by sobering up; a bottle touched in the
// air refills it, like a dash crystal. Every change of grade reaches the world three seconds later.
// Reach (tiles): a jump is 2.8 high and 6.3 far; jump, then K at the top, is 4.7 high and 9.6 far.
// K at every top, with a bottle there each time, climbs 2 tiles and moves 3.1 per K.
export const day2 = [
  // One sip, one double jump: up a wall a jump cannot reach, then a second bottle for the glass on top.
  artRoom('L2-1', '一口', 'office', 0, [], [
    ...Array(11).fill(EMPTY),
    '..........D...................O.',
    '.........######^^^^^^^^#########',
    '.........#######################',
    '.........#######################',
    '.P..D....#######################',
    FLOOR, FLOOR,
  ]),

  // Bottles hang over the glass, each at the top of the last double jump: K at the top, every time.
  artRoom('L2-2', '續杯', 'office', 0, [], [
    ...Array(5).fill(EMPTY),
    '..............................O.',
    '................D...############',
    '....................############',
    '.............D......############',
    '....................############',
    '..........D.........############',
    '....................############',
    '....................############',
    '....................############',
    '....................############',
    '.P.D................############',
    '####^^^^^^^^^^^^^^^^############',
    FLOOR,
  ]),

  // Drink, wait for the bridge. The post in the middle takes a double jump, and that sobers you: three seconds
  // later the bridge goes. Make the far ledge before it does, with the bottle hanging in front of it.
  artRoom('L2-3', '倒數', 'pantry', 0, [], [
    ...Array(11).fill(EMPTY),
    '..............................O.',
    '.........................D.#####',
    '..........##...............#####',
    '..........##...............#####',
    '.P.D......##...............#####',
    '#####^^^^^##^^^^^^^^^^^^^^^#####',
    FLOOR,
  ], {
    1: [...Array(16).fill(EMPTY), '.....#####..###############.....', EMPTY],
  }),

  // Drunk, the floor under the bottle is gone and a ledge hangs over the glass instead, both three seconds after
  // the sip. Jump off the end of the floor just before it goes, and be above the ledge when it comes.
  artRoom('L2-4', '踩空', 'street', 0, [], [
    ...Array(9).fill(EMPTY),
    '..............................O.',
    ...Array(5).fill('...........................#####'),
    '.P.......D.................#####',
    '############^^^^^^^^^^^^^^^#####',
    '####........####################',
  ], {
    1: [...Array(14).fill(EMPTY), '................########........', EMPTY, '....________....................', EMPTY],
  }),

  // Home: the floor that goes, the double jump up to the shelf, then one more sip and a climb back left over
  // the glass, refilled once in the air.
  artRoom('L2-5', '回家', 'street', 0, [], [
    EMPTY, EMPTY, EMPTY,
    '.O..............................',
    '##########...D..................',
    EMPTY, EMPTY, EMPTY, EMPTY,
    '.....................D..........',
    '....................####........',
    EMPTY, EMPTY, EMPTY, EMPTY,
    '.P......D.......................',
    '##########^^^^^^^^^^^^^^^^^^^^^^',
    '####......######################',
  ], {
    1: [...Array(14).fill(EMPTY), '.............#####..............', EMPTY, '....______......................', EMPTY],
  }),
];

// Day 3: the shadow's throw. J spends the grade, so you fly sober: a bottle on the arc refills K.
// A throw lifts Jim 2 tiles, tops out 7.8 above where he stood and lands about 17 tiles on; holding the
// other way pulls the landing back to about 9.5. J at the top of a jump tops out 10.5 up, 10 tiles on:
// every door sits above that, or behind a wall it cannot clear.
export const day3 = [
  // Over a wall nothing else clears, onto a pillar the throw overshoots: pull back in the air.
  artRoom('L3-1', '丟', 'office', 0, [], [
    ...Array(10).fill(EMPTY),
    '........##......................',
    '........##......................',
    '........##....................O.',
    '........##.......##......#######',
    '........##.......##......#######',
    '.P.D....##.......##......#######',
    '##########^^^^^^^##^^^^^^#######',
    FLOOR,
  ]),

  // The ledge is higher than any throw goes. Jump, J at the top of the jump, catch the bottle at the top of
  // the throw and K: only all three together reach it.
  artRoom('L3-2', '空中一杯', 'office', 0, [], [
    EMPTY, EMPTY, EMPTY,
    '..............................O.',
    '.............D.....#############',
    ...Array(10).fill('...................#############'),
    '.P.D...............#############',
    '####^^^^^^^^^^^^^^^#############',
    FLOOR,
  ]),

  // Drunk, a shelf hangs over the glass. Throw onto it: the throw sobers you, so the shelf goes three seconds
  // later. Drink at its end and leave before it does (double jump, or throw again); no throw from the floor
  // reaches the door.
  artRoom('L3-3', '台子會散', 'street', 0, [], [
    ...Array(4).fill(EMPTY),
    '..............................O.',
    '.......................#########',
    '.......................#########',
    '.......................#########',
    '................D......#########',
    ...Array(6).fill('.......................#########'),
    '.P.D...................#########',
    '#####^^^^^^^^^^^^^^^^^^#########',
    FLOOR,
  ], {
    1: [...Array(9).fill(EMPTY), '............#####...............', ...Array(8).fill(EMPTY)],
  }),

  // All of it: drink on the floor that goes, jump to the ledge as it comes, jump and throw from it, grab the
  // bottle at the top, and K over the glass-topped wall down onto the door's shelf. The glass overhangs the
  // wall by a tile, so its corner is no place to stand.
  artRoom('L3-4', '醉了又醒', 'street', 0, [], [
    EMPTY, EMPTY,
    '.....................D..........',
    '.......................^^^......',
    ...Array(3).fill('........................##......'),
    '........................##....O.',
    '........................##.#####',
    ...Array(6).fill('........................##......'),
    '.P....D.................##......',
    '########^^^^^^^^^^^^^^^^##^^^^^^',
    '####....########################',
  ], {
    1: [...Array(14).fill(EMPTY), '..........####..................', EMPTY, '....____........................', EMPTY],
  }),
];

// run toward the target until past `from`, jump, and steer in the air to land at (x, y), letting go of jump after `hold` seconds
// `farts`: K at each top of the flight while Jim holds a grade, at most that many times
const leap = (r, from, x, y, hold = 1, farts = 0) => {
  let n = 0;
  const right = x > r.game.body.x, dir = right ? { right: true } : { left: true };
  r.until(g => right ? g.body.x >= from : g.body.x <= from, 4, dir);
  r.tick({ jumpPressed: true, jump: true, ...(x > r.game.body.x ? { right: true } : { left: true }) });
  for (const b = r.game.body; !(b.grounded && n > 4) && n < 3 * STEP_HZ && r.game.phase === 'play';) {
    const dx = x - b.x - b.vx * 0.12, input = { jump: ++n < hold * STEP_HZ };   // steer by where Jim is heading
    if (farts && n > 8 && b.vy >= 0 && r.game.targetStage() > 0) { input.kPressed = true; farts--; }
    if (dx > 6) input.right = true; else if (dx < -6) input.left = true;
    r.tick(input);
  }
  if (r.game.phase === 'play') assert.ok(Math.abs(r.game.body.y - y) < 1 && Math.abs(r.game.body.x - x) < 90, `leap to (${x}, ${y}) landed at (${r.game.body.x.toFixed(1)}, ${r.game.body.y.toFixed(1)})`);
};
// run right past `from`, jump, and hold jump to the top, ready for J
const jumpThrow = (r, from) => {
  r.until(g => g.body.x >= from, 4, { right: true });
  r.tick({ right: true, jump: true, jumpPressed: true });
  r.until(g => g.body.vy >= 0, 2, { right: true, jump: true });
};
// J to the right, then steer the flight to land at (x, y), with K at each top while a grade is held
const fling = (r, x, y, farts = 0) => {
  let n = 0;
  r.skill();
  for (const b = r.game.body; !(b.grounded && n > 60 && ['free', 'recover'].includes(r.game.state)) && n < 4 * STEP_HZ && r.game.phase === 'play'; n++) {
    const dx = x - b.x - b.vx * 0.3, input = {};
    if (dx > 6) input.right = true; else if (dx < -6) input.left = true;
    if (farts && r.game.state === 'thrown' && b.vy >= 0 && r.game.targetStage() > 0) { input.kPressed = true; farts--; }
    r.tick(input);
  }
  if (r.game.phase === 'play') assert.ok(Math.abs(r.game.body.y - y) < 1 && Math.abs(r.game.body.x - x) < 90, `fling to (${x}, ${y}) landed at (${r.game.body.x.toFixed(1)}, ${r.game.body.y.toFixed(1)})`);
};
const drunk = (r, input) => r.until(g => g.targetStage() > 0, 10, input);

export const plans = {
  'P1-1': r => {
    for (const [from, x, y] of [[190, 360, 640], [430, 690, 640], [710, 940, 560], [950, 1220, 640]]) leap(r, from, x, y);
    r.finish();
  },
  'P1-2': r => {
    for (const [from, x, y, hold] of [[150, 280, 560], [300, 440, 480], [460, 600, 400], [620, 780, 400, 0.15], [790, 940, 400, 0.15], [950, 1120, 400]]) leap(r, from, x, y, hold);
    r.finish();
  },
  'P1-3': r => {
    const tube = i => r.game.entities.filter(e => e.kind === 'faller')[i];
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    // walk in under each tube until it shakes and let the belt carry you back while it falls
    r.until(() => tube(0).phase !== 'idle', 6, { right: true });
    r.until(() => tube(0).phase === 'gone', 2);
    // cross the pit while the chair is rolling away to the far wall
    r.until(g => g.body.x >= 500, 4, { right: true });
    r.until(() => chair().dir > 0 && chair().x > 1000, 14);
    leap(r, 530, 680, 640);
    r.until(() => tube(1).phase !== 'idle', 6, { right: true });
    r.until(() => tube(1).phase === 'gone', 2);
    // hop the chair as it rolls at you
    r.until(g => chair().dir < 0 && chair().x - g.body.x < 110, 12, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.until(g => g.body.grounded, 2, { right: true, jump: true });
    r.finish();
  },
  'P1-4': r => {
    for (const [from, x, y] of [[230, 360, 560], [370, 520, 480], [530, 690, 400], [710, 845, 320], [850, 690, 240], [700, 920, 160]]) leap(r, from, x, y);
    r.finish();
  },
  'L2-1': r => {
    drunk(r, { right: true });
    leap(r, 320, 420, 480, 1, 1);
    leap(r, 590, 980, 480, 1, 1);
    r.finish();
  },
  'L2-2': r => {
    drunk(r, { right: true });
    leap(r, 150, 840, 240, 1, 4);
    r.finish();
  },
  'L2-3': r => {
    drunk(r, { right: true });
    r.world();
    leap(r, 330, 600, 640, 1, 1);
    leap(r, 860, 1100, 480, 1, 1);
    r.finish();
  },
  'L2-4': r => {
    drunk(r, { right: true });
    // wait at the end of the floor and jump a moment before the world changes
    r.until(g => g.body.x >= 440, 2, { right: true });
    r.until(g => g.stageWarn.t < 0.35, 3);
    leap(r, 440, 700, 560);
    leap(r, 940, 1120, 400, 1, 1);
    r.finish();
  },
  'L2-5': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 370, 2, { right: true });
    r.until(g => g.stageWarn.t < 0.35, 3);
    leap(r, 370, 600, 560);
    leap(r, 700, 860, 400, 1, 1);
    leap(r, 810, 300, 160, 1, 2);
    r.finish({ left: true });
  },
  'L3-1': r => {
    drunk(r, { right: true });
    fling(r, 720, 520);
    leap(r, 750, 1080, 520);
    r.finish();
  },
  'L3-2': r => {
    drunk(r, { right: true });
    jumpThrow(r, 140);
    fling(r, 850, 160, 1);
    r.finish();
  },
  'L3-3': r => {
    drunk(r, { right: true });
    r.world();
    fling(r, 560, 360);
    leap(r, 670, 1000, 200, 1, 1);
    r.finish();
  },
  'L3-4': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 290, 2, { right: true });
    r.until(g => g.stageWarn.t < 0.35, 3);
    leap(r, 290, 460, 560);
    jumpThrow(r, 440);
    fling(r, 1180, 320, 1);
    r.finish();
  },
};

const chain = list => list.map((room, i) => ({ ...room, portalTarget: list[i + 1]?.id ?? null }));

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
  maps: [{
    id: 'day-1', name: '第一天　辦公室', cells: 1, abilities: [], hud: false,
    rooms: chain(day1),
  }, {
    id: 'day-2', name: '第二天　微醺', cells: 1, abilities: [],
    rooms: chain(day2),
  }, {
    id: 'day-3', name: '第三天　醉影', cells: 1, abilities: ['wrestler'],
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
  writeFileSync(new URL('../../prototype/chill-loop.json', import.meta.url), JSON.stringify(campaign, null, 2) + '\n');
  writeFileSync(new URL('../../prototype/chill-loop-routes.json', import.meta.url), JSON.stringify(routes, null, 2) + '\n');
  console.log('Wrote prototype/chill-loop.json and chill-loop-routes.json');
}
