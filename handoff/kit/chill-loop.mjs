// The drink-use-sober loop (bottles: "drink"). Touching a bottle drinks it (it comes back a few seconds later),
// J spends the grade it uses, K spends one as a double jump, and the world is the body three seconds ago.
// No room can be lost for good: every bottle comes back.
// Day 1 is the office prologue: run and jump only. Day 2: bottles and farts, no shadow. Day 3 brings the body, then the throw.
// No words anywhere under these rules: only the room number. The story comes later.
// node handoff/kit/chill-loop.mjs   writes prototype/chill-loop.json and chill-loop-routes.json
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artRoom, getEngine, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const { TUNING } = getEngine();
const FLOOR = '################################';

// The office prologue: run and jump only. No words; each room is one skill to get right.
// Jim on foot: a full jump is 2.8 tiles high and 6.3 far; a tap is 1.5 high and 3.4 far. He is 1.1 by 1.8 tiles.
export const day1 = [
  // Broken mugs: gaps of 3, 5 and 5 tiles, the last two onto and off a one-tile pillar two tiles up.
  // Cocktail: from the pillar, jump back up-left for it and steer back onto the pillar.
  artRoom('P1-1', '碎杯', 'office', 0, [], [
    ...Array(10).fill(EMPTY),
    '......................*.........',
    EMPTY, EMPTY, EMPTY,
    '.......................#........',
    '.P.....................#......O.',
    '#####^^^###^^^^^##^^^^^#^^^^^###',
    FLOOR,
  ]),

  // Sagging boxes over glass: up three stacks, then hop the single boxes.
  // Cocktail: from the first stack, jump back up-left for it and drop to the floor; wait for the boxes to return. Each stack gives way 0.45 s
  // after you land on it, and a full jump overshoots a single box: short hops, no stopping.
  artRoom('P1-2', '紙箱', 'office', 0, [], [
    ...Array(9).fill(EMPTY),
    '..............................O.',
    '....*.........CC...C...C...#####',
    '...........................#####',
    '..........CC...............#####',
    '...........................#####',
    '......CC...................#####',
    '.P.........................#####',
    '####^^^^^^^^^^^^^^^^^^^^^^^#####',
    FLOOR,
  ]),

  // The hallway: in high from the boxes, down a hole into a low corridor where the floor runs against you and a
  // tube lets go when you walk under it. Step in and back to drop it, or jump through. One firm tile before the
  // pit to time the chair from; the chair rolls the far half up to the way out.
  artRoom('P1-3', '走廊', 'office', 0, [], [
    ...Array(6).fill(FLOOR),
    '......##########################',
    '......##########################',
    '......##########################',
    '..P...##########################',
    '####..##########################',
    '####..##########################',
    '.........L...........L..........',
    EMPTY, EMPTY,
    '............................R...',
    '####<<<<<<<<#^^<<<<<<<<<<#######',
    FLOOR,
  ]),

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
  // Cocktail: spend the first sip on a K straight up, then wait for the bottle to come back.
  artRoom('L2-1', '一口', 'office', 0, [], [
    ...Array(10).fill(EMPTY),
    '.....*..........................',
    '..........D...................O.',
    '.........######^^^^^^^^#########',
    '.........#######################',
    '.........#######################',
    '.P..D....#######################',
    FLOOR, FLOOR,
  ]),

  // Bottles hang over the glass, each at the top of the last double jump: K at the top, three times.
  artRoom('L2-2', '續杯', 'office', 0, [], [
    ...Array(8).fill(EMPTY),
    '.............D..................',
    '..................##############',
    '..........D.......##############',
    '..................##############',
    '..................##############',
    '..................##############',
    '..................##############',
    '.P.D..............##############',
    '####^^^^^^^^^^^^^^##############',
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
  // Cocktail: K straight up from the middle of the ledge. That sobers you: run back to the floor as it returns,
  // drink again, and make the jump onto the ledge a second time.
  artRoom('L2-4', '踩空', 'street', 0, [], [
    ...Array(8).fill(EMPTY),
    '....................*...........',
    '..............................O.',
    ...Array(5).fill('...........................#####'),
    '.P.......D.................#####',
    '############^^^^^^^^^^^^^^^#####',
    '####........####################',
  ], {
    1: [...Array(14).fill(EMPTY), '................########........', EMPTY, '....________....................', EMPTY],
  }),

  // Start drunk: the bridge is up and a guard walks it. Double jump over him, and that sobers you: the bridge
  // goes three seconds later, and him with it. Be on the far ledge by then.
  artRoom('L2-5', '警衛下橋', 'street', 1, [], [
    ...Array(12).fill(EMPTY),
    '..............................O.',
    '.P..............................',
    '####.........................###',
    '####.....................R...###',
    '####^^^^^^^^^^^^^^^^^^^^^^^^^###',
    FLOOR,
  ], {
    1: [...Array(16).fill(EMPTY), '....#########################...', EMPTY],
  }),

  // Drunk, the belts run the other way, three seconds after the sip. Sober, the near belt drags you back; drunk,
  // it throws you over the glass. The far belt does the opposite, and the door is a double jump up.
  artRoom('L2-6', '反向輸送帶', 'office', 0, [], [
    ...Array(11).fill(EMPTY),
    EMPTY,
    '...........................#####',
    '...........................#####',
    '...........................#####',
    '.P.D.......................#####',
    '##<<<<<<<<<<<<^^^^^^^^>>>>>#####',
    FLOOR,
  ], {
    1: [...Array(16).fill(EMPTY), '..>>>>>>>>>>>>........<<<<<.....', EMPTY],
  }),

  // A cart rolls over the glass. Board it, ride it under the shards and hop each one, keeping up with it.
  // Cocktail: one more hop between the shards, landing back on the cart.
  artRoom('L2-7', '台車', 'office', 0, [], [
    ...Array(10).fill(EMPTY),
    '..............*.................',
    EMPTY,
    '..............................O.',
    '..........^......^..........####',
    '.....M......................####',
    '.P..........................####',
    '####^^^^^^^^^^^^^^^^^^^^^^^^####',
    FLOOR,
  ]),

  // Home: ride the cart under the shard, onto the post, over the guard from the post, then jump, K, catch the
  // bottle at that top and K again up to the way out. Spend the first K on the guard and the shelf is out of reach.
  artRoom('L2-8', '回家', 'street', 1, [], [
    ...Array(10).fill(EMPTY),
    '...........................D####',
    '............................####',
    '............................####',
    '..........^.....#...........####',
    '.....M..........#...........####',
    '.P..............#.......R...####',
    '####^^^^^^^^^^^^#^^^^^^^^^^^####',
    FLOOR,
  ], {
    1: [...Array(16).fill(EMPTY), '.................###########....', EMPTY],
  }),
];

// Day 3: the drunk shadow, and only its first move. One bottle in you leaves Jim's body behind and sends him back to
// the last bottle he drank, which stays empty while the body is there (walk back into it, or J with no drink left, to
// take the body away: a body in the wrong place is never a reason to die). The day holds Jim to one bottle, so the
// world is only ever drunk or sober, and K spends the same bottle the body would. Everything from day 2 comes back:
// bottles in the air, K, the three-second world, the cart, belts, sofas, the guard.
// The rooms are one map that climbs and falls: right, up, right, down, and out. Each puzzle ends in a fast stretch.
export const day3 = [
  // Leave your body over the pit, wake up by the bottle, and cross on it. A jump and a double jump fall short.
  // Then hop the glass and the box on the way out.
  artRoom('L3-1', '留位置', 'office', 0, [], [
    ...Array(6).fill('...............................#'),
    ...Array(3).fill(EMPTY),
    '.P..D.......................#...',
    '#######.............####^^######',
    ...Array(5).fill('#######.............############'),
    '#######^^^^^^^^^^^^^############',
    FLOOR,
  ]),

  // The wall at the end of the rail is a jump and a double jump too high from the cart. Ride out, hop the glass hanging
  // over the rail, jump at the end and leave the body at the top of it; you wake at the first bottle. Ride out again
  // through the second bottle and over the glass, jump and K up onto the body, and jump from it onto the wall.
  // Hop the glass along the top of it, then up the shelves in the shaft and out the top. The cart is quick: it is back for you in a couple of seconds.
  { ...artRoom('L3-2', '台車', 'pantry', 0, [], [
    '#############################..#',
    '#...........................===#',
    '#..............................#',
    '#...........................===#',
    '#..............................#',
    '#................####^^#^^######',
    ...Array(2).fill('.................###############'),
    '......D....^.....###############',
    '.P.D.............###############',
    '####.M...........###############',
    ...Array(5).fill('####.............###############'),
    '####^^^^^^^^^^^^^###############',
    FLOOR,
  ]), cartSpeed: 220 },

  // A breather. In from the floor; the sofa throws you up into a run of bottles: drink, K, drink, K, up onto the
  // shelf. Then over the gap in it, the belt and a long jump out over the drop. Fall short and the sofa is still there.
  artRoom('L3-3', '續攤', 'street', 0, [], [
    FLOOR, FLOOR,
    '#..............................#',
    '#...............................',
    '#...............................',
    '#...............................',
    '#########====.D.===>>>>>....####',
    '#..............................#',
    '#................D.............#',
    '#..............................#',
    '#....................D.........#',
    ...Array(4).fill('#..............................#'),
    '#..........................P...#',
    '######################SSS####..#',
    '#############################==#',
  ]),

  // The bridge is there only drunk, with a gap in it. Drink, cross it, jump off the end and leave the body out over the glass: you wake
  // back at the bottle, sober, and the bridge goes three seconds later. Run it and jump to the body before it does, and
  // straight on to the drop: the same three seconds bring a sober wall down onto the body. Down below, hop the glass and
  // the block; the guard walks a short beat between you and the way down: drink and K over him.
  { ...artRoom('L3-4', '斷橋', 'lobby', 0, [], [
    FLOOR,
    ...Array(2).fill('#..............................#'),
    '...............................#',
    '...D.............######........#',
    '.P...............######........#',
    '#####..........................#',
    '#####..........................#',
    '#####^^^^^^^^^^^^^^^^^^^.......#',
    '########################.......#',
    ...Array(5).fill('#..............................#'),
    '#........R.....#..............D#',
    '##..################^^##########',
    '#...############################',
  ], {
    1: [...Array(4).fill(EMPTY), ...Array(2).fill('.................______.........'),
      '.....###..###...................', ...Array(11).fill(EMPTY)],
  }), patrol: 'guard' },

  // Home time. Off the ledge over the glass (a box that gives way is a step on the way down), onto the belt and the two bottles on it. The ledge out is a jump and a double jump too high, and a
  // jump from the body is not enough either: run off the belt, leave the body out over the glass, wake at the first
  // bottle, drink the second on the way, jump onto the body and K up onto the ledge.
  artRoom('L3-5', '下班', 'street', 0, [], [
    '#...############################',
    ...Array(6).fill('#..............................#'),
    '#.P.............................',
    '#######.........................',
    '#...............................',
    ...Array(3).fill('#..........................#####'),
    '#.......C..................#####',
    '#..........................#####',
    '#...........D...D..........#####',
    '#^^^^^^^^^^#>>>>>>>^^^^^^^^#####',
    FLOOR,
  ]),
  // The guard's well. The block on the right is a jump and a K too high from the well floor, and too far from the
  // ledge. Follow the guard down to the wall and leave the body over him at the top of a jump: he is shut in against
  // the wall, and the body is a step. Wake at one ledge bottle, take the other, go down again, K onto the body, and up.
  // (A bottle hanging in the well would let you jump, K, drink and K again straight up the block.) The cocktail
  // hangs over the body. Then over the glass, across the boxes before they give, the belt, and up the step. Shelves on
  // the left wall of the well climb back to the ledge, so the well is never a dead end.
  { ...artRoom('L3-6', '轉角', 'lobby', 0, [], [
    FLOOR,
    ...Array(5).fill('#..............................#'),
    '#...............................',
    '...............*................',
    '................................',
    '.PDD..........................##',
    '####..............##^##^CCC>>>##',
    '####==............######...#####',
    '####..............######...#####',
    '####==............######...#####',
    '####.R............######...#####',
    '##################^^^^^^^^^^#####'.slice(0, 18) + '######^^^#####',
    FLOOR, FLOOR,
  ]), patrol: 'guard' },
  // The lift shaft. The shelf out of the door is there only sober: drink and go before it goes (the cocktail is over
  // it, if you are quick). K up onto the landing. The way out is a jump and a K too high from there: drink the bottle on
  // the landing (wake here, not down at the door), jump out over the shaft and leave the body at the top. Back on the
  // landing, the other bottle there, K onto the body, and up through the ledge under the hatch. (A bottle in the air
  // over the landing would let you jump, K, drink and K again up to the ledge.)
  artRoom('L3-7', '電梯井', 'elevator', 0, [], [
    '#########################......#',
    '#..............................#',
    '#........................======#',
    ...Array(2).fill('#..............................#'),
    '#.........*....................#',
    '...............................#',
    '.....................DD........#',
    '.P.D................####.......#',
    '#####....===...................#',
    ...Array(5).fill('#####..........................#'),
    '#####^^^^^^^^^^^^^^^^^^^^^^^^^^#',
    FLOOR, FLOOR,
  ], {
    1: [...Array(9).fill(EMPTY), '.........___....................', ...Array(8).fill(EMPTY)],
  }),
  // The sensor. Up from the shaft at the bottom right; the way out is the top right, behind a door that opens only
  // while something is in the sensor, and the sensor hangs in the air over the sofa. Drink, hop the chair, and at the
  // top of the bounce leave the body in the sensor: the door opens and the bridge comes. Wake by the bottle, bounce
  // again onto the bridge, up the shelves (the cocktail over the second), the quick cart over the glass, and out.
  { ...artRoom('L3-8', '感應門', 'office', 0, [], [
    FLOOR,
    '#..............................#',
    '#.............................G.',
    '#.............................G.',
    '#......*......................G.',
    '#............#####M.......######',
    '#.........==...................#',
    '#.................^^^^^^^^.....#',
    '#......==......................#',
    '#..............................#',
    '#.H........==..................#',
    '#..............................#',
    '#....ggggggggg.................#',
    ...Array(2).fill('#..............................#'),
    '#.............#.R.......#.D.P..#',
    '#SSS#####################======#',
    '#########################======#',
  ]), cartSpeed: 200 },
  // Downhill, at a run. The walkway is there only sober and the belt under its end only drunk: drink at the door, run the
  // walkway over the glass, and drop off its end just before the world turns, so you land as the belt comes. The belt
  // throws you off onto the sofa; K at the top of the bounce to reach the shelf over the glass, and down the hole.
  // Miss the sofa and the shelves on the right wall climb back up to the walkway.
  artRoom('L3-9', '下坡', 'street', 0, [], [
    FLOOR,
    '#..............................#',
    '...............................#',
    '...............................#',
    '.P.D...........................#',
    '###########^#####^#####........#',
    '#......................L.==....#',
    '#..............................#',
    '#...#####....................==#',
    '#..............................#',
    '#............................==#',
    '#................*.............#',
    '#............................==#',
    '#..............................#',
    '#............................==#',
    '#..............................#',
    '#...^^^^^^^^^^SSS###############',
    '#...############################',
  ], {
    1: [...Array(5).fill(EMPTY), '......_________________.........', ...Array(3).fill(EMPTY), '....................<<<<<<<<<...', ...Array(8).fill(EMPTY)],
  }),
  // Home. The bridge over the glass is there only while something stands in the sensor at the end of the guard's beat,
  // and he only walks through it. From the shelf, drop in behind him as he reaches it and leave the body at his back:
  // he paces on the sensor for good and holds the bridge for you. Wake on the ledge, take the second bottle there,
  // and run: shelf, wall, bridge (the sign over it lets go as you pass). The last step up is there only drunk:
  // three seconds after that bottle. K up onto it, and out. Shelves up the left wall lead back to the ledge and its
  // bottles from anywhere below.
  { ...artRoom('L3-10', '回家', 'street', 0, [], [
    '#...############################',
    '#..............................#',
    '#........................L.....#',
    '#...............................',
    '#.P.DD..........................',
    '#######.........................',
    '#......==..........*............',
    '#..............................#',
    '#.....==.......................#',
    '#..............................#',
    '#...==..########...#ggggggggg..#',
    '#..................#...........#',
    '#.==...............#...........#',
    '#.........#R......H#...........#',
    '####################...........#',
    '####################^^^^^^^^^^^#',
    FLOOR, FLOOR,
  ], {
    1: [...Array(6).fill(EMPTY), '..............................##', ...Array(11).fill(EMPTY)],
  }) },
];

// run toward the target until past `from` (0: jump where Jim stands), jump, and steer in the air to land at (x, y), letting go of jump after `hold` seconds
// `farts`: K at each top of the flight while Jim holds a grade, at most that many times
const leap = (r, from, x, y, hold = 1, farts = 0) => {
  let n = 0;
  const right = x > r.game.body.x, dir = right ? { right: true } : { left: true };
  if (from) r.until(g => right ? g.body.x >= from : g.body.x <= from, 4, dir);
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
// J to the right, then steer the flight to land at (x, y), with K at each top while a grade is held;
// a flight that comes down on a sofa ends at the bounce
const fling = (r, x, y, farts = 0) => {
  let n = 0;
  r.skill();
  for (const b = r.game.body; !(b.grounded && n > 60 && ['free', 'recover'].includes(r.game.state)) && !(r.game.state === 'free' && b.vy < -TUNING.sofa + 1) && n < 4 * STEP_HZ && r.game.phase === 'play'; n++) {
    const dx = x - b.x - b.vx * 0.3, input = {};
    if (dx > 6) input.right = true; else if (dx < -6) input.left = true;
    if (farts && r.game.state === 'thrown' && b.vy >= 0 && r.game.targetStage() > 0) { input.kPressed = true; farts--; }
    r.tick(input);
  }
  if (r.game.phase === 'play' && r.game.body.grounded) assert.ok(Math.abs(r.game.body.y - y) < 1 && Math.abs(r.game.body.x - x) < 90, `fling to (${x}, ${y}) landed at (${r.game.body.x.toFixed(1)}, ${r.game.body.y.toFixed(1)})`);
};
// steer the flight Jim is already in (a bounce or a fall) to land at (x, y)
const landOn = (r, x, y) => {
  const b = r.game.body;
  for (let n = 0; n < 4 * STEP_HZ && r.game.phase === 'play' && !(b.grounded && n > 4); n++) {
    const dx = x - b.x - b.vx * 0.12;
    r.tick(dx > 6 ? { right: true } : dx < -6 ? { left: true } : {});
  }
  if (r.game.phase === 'play') assert.ok(Math.abs(b.y - y) < 1 && Math.abs(b.x - x) < 90, `landOn (${x}, ${y}) landed at (${b.x.toFixed(1)}, ${b.y.toFixed(1)})`);
};
// run past `from` (0: from here), jump, and steer onto the sofa at x until it throws Jim back up
const toSofa = (r, from, x) => {
  const b = r.game.body, way = x > b.x ? { right: true } : { left: true };
  if (from) r.until(g => g.body.x >= from, 4, { right: true });
  r.tick({ ...way, jump: true, jumpPressed: true });
  for (let n = 0; n < 3 * STEP_HZ && !(b.vy < -TUNING.sofa + 1); n++) {
    const dx = x - b.x - b.vx * 0.12;
    r.tick({ jump: true, ...(dx > 6 ? { right: true } : dx < -6 ? { left: true } : {}) });
  }
  assert.ok(b.vy < -TUNING.sofa + 1, 'missed the sofa');
};
const bottleAt = (g, x) => g.entities.find(e => e.kind === 'bottle' && Math.floor(e.x / 40) === x);
// jump (unless already in the air) and steer for the cocktail at x, with K at the top while a grade is held,
// then steer to land at (back, y) holding it
const fetch = (r, x, back, y, farts = 0, jump = true) => {
  const b = r.game.body;
  if (jump) r.tick({ jump: true, jumpPressed: true, ...(x > b.x ? { right: true } : x < b.x ? { left: true } : {}) });
  for (let n = 0; n < 4 * STEP_HZ && r.game.phase === 'play' && !(b.grounded && n > 4); n++) {
    const dx = (r.game.berry ? back : x) - b.x - b.vx * 0.12, input = { jump: true };
    if (dx > 6) input.right = true; else if (dx < -6) input.left = true;
    if (farts && n > 8 && b.vy >= 0 && r.game.targetStage() > 0) { input.kPressed = true; farts--; }
    r.tick(input);
  }
  assert.ok(!r.game.berry && Math.abs(b.y - y) < 1, `fetch: landed at (${b.x.toFixed(1)}, ${b.y.toFixed(1)})${r.game.berry ? ' still carrying' : ''}`);
};
const guard = g => g.entities.find(e => e.kind === 'patrol' && e.alive);
const cart = g => g.entities.find(e => e.kind === 'cart');
// jump and stay over the cart until standing on its deck again
const hopOnCart = (r, ahead = 0) => {
  r.tick({ jump: true, jumpPressed: true });
  for (let n = 0; n < 3 * STEP_HZ && r.game.phase === 'play' && !(n > 8 && r.game.body.grounded); n++) {
    const dx = cart(r.game).x + ahead - r.game.body.x - (r.game.body.vx - cart(r.game).dir * cart(r.game).speed) * 0.12;
    r.tick({ jump: true, ...(dx > 6 ? { right: true } : dx < -6 ? { left: true } : {}) });
  }
  assert.ok(r.game.body.cart >= 0, 'hop missed the cart');
};
// from the spawn, jump after the cart as it sets off and land on it
const board = r => hopOnCart(r);
// run right past `from`, jump (a tap unless `full`), and J the moment `when` holds: the body stays, Jim wakes at his bottle
const leaveBody = (r, from, when, full = true) => {
  r.until(g => g.body.x >= from, 4, { right: true });
  r.tick({ right: true, jump: true, jumpPressed: true });
  r.until(when, 2, { right: true, jump: full });
  r.skill();
  assert.ok(r.game.entities.some(e => e.kind === 'corpse'), 'no body left behind');
};
// the top of the body left last
const deck = r => r.game.entities.filter(e => e.kind === 'corpse').at(-1).y;
const plank = r => r.game.entities.filter(e => e.kind === 'corpse').at(-1).x;
const drunk = (r, input) => r.until(g => g.targetStage() > 0, 10, input);
// jump out through the hatch overhead
const out = r => { r.tick({ jump: true, jumpPressed: true }); r.wait(1, { jump: true }); };
// run left past x and stop, jump straight up, and J at the top: the body lies across the beam just left of Jim, and he wakes at his bottle
const shade = (r, x) => {
  r.until(g => g.body.x <= x, 4, { left: true });
  r.until(g => Math.abs(g.body.vx) < 5, 1);
  r.tick({ jump: true, jumpPressed: true });
  r.until(g => g.body.vy >= 0, 2, { jump: true });
  r.skill(-1);
};

export const plans = {
  'P1-1': r => {
    for (const [from, x, y] of [[190, 360, 640], [430, 690, 640], [710, 940, 560]]) leap(r, from, x, y);
    fetch(r, 895, 945, 560);   // up and left off the pillar for the cocktail, and back onto it
    leap(r, 950, 1220, 640);
    r.finish();
  },
  'P1-2': r => {
    leap(r, 150, 280, 560);
    fetch(r, 160, 100, 640);   // back up-left off the first stack for the cocktail, down to the floor
    r.until(g => g.tiles[14][6] === 'C', 4);
    for (const [from, x, y, hold] of [[150, 280, 560], [300, 440, 480], [460, 600, 400], [620, 780, 400, 0.15], [790, 940, 400, 0.15], [950, 1120, 400]]) leap(r, from, x, y, hold);
    r.finish();
  },
  'P1-3': r => {
    const tube = i => r.game.entities.filter(e => e.kind === 'faller')[i];
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    r.until(g => g.body.y >= 640, 3, { right: true });   // down the hole into the corridor
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
    fetch(r, 220, 220, 640, 1);   // K straight up for the cocktail
    r.until(g => !bottleAt(g, 4).got, 4);
    r.until(g => g.targetStage() > 0, 4, { left: true });
    leap(r, 320, 420, 480, 1, 1);
    leap(r, 590, 980, 480, 1, 1);
    r.finish();
  },
  'L2-2': r => {
    drunk(r, { right: true });
    leap(r, 150, 780, 360, 1, 3);
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
    r.until(g => g.body.x >= 800, 2, { right: true });
    leap(r, 0, 820, 560, 1, 1);   // K straight up through the cocktail, back onto the ledge
    // that K sobers: three seconds later the ledge goes and the floor comes back. Jump back across as it does,
    // drink again, and make the jump onto the ledge once more
    r.until(g => g.body.x <= 670, 2, { left: true });
    r.until(g => g.stageWarn && g.stageWarn.t < 0.35, 4);
    leap(r, 0, 440, 640);
    r.until(g => g.targetStage() > 0, 4, { left: true });
    r.until(g => g.body.x >= 440, 2, { right: true });
    r.until(g => g.stageWarn.t < 0.35, 3);
    leap(r, 440, 700, 560);
    leap(r, 940, 1120, 400, 1, 1);
    r.finish();
  },
  'L2-5': r => {
    // walk the bridge toward the guard and double jump him as he comes; then run before the bridge goes
    r.until(g => guard(g).dir < 0 && guard(g).x - g.body.x < 300 && g.body.grounded && g.body.y === 640, 16, { right: true });
    leap(r, 0, guard(r.game).x + 90, 640, 1, 1);
    leap(r, 1110, 1220, 560);
    r.finish();
  },
  'L2-6': r => {
    drunk(r, { right: true });
    r.world();
    leap(r, 540, 960, 640);
    leap(r, 1020, 1110, 480, 1, 1);
    r.finish();
  },
  'L2-7': r => {
    board(r);
    for (const x of [420, 580, 700]) { r.until(g => g.body.x >= x - 44, 10); hopOnCart(r); }   // 580: the cocktail
    r.until(g => cart(g).x >= 1020, 10);
    leap(r, 0, 1180, 640);   // off the cart and down the way out
    r.finish();
  },
  'L2-8': r => {
    board(r);
    r.until(g => g.body.x >= 376, 10); hopOnCart(r);
    // off the cart onto the post, and down onto the bridge once the guard has walked off
    r.until(g => cart(g).x >= 520, 10);
    leap(r, 0, 660, 520);
    // from the post, jump the guard as he walks up to it
    r.until(g => guard(g).dir < 0 && guard(g).x < 800, 14);
    leap(r, 0, 900, 640);
    leap(r, 0, 1180, 400, 1, 2);
    r.finish();
  },
  'L3-1': r => {
    drunk(r, { right: true });
    // off the ledge, and J as Jim comes back down to its height: the body lies over the pit
    leaveBody(r, 290, g => g.body.vy > 0 && g.body.y >= 400);
    leap(r, 290, 560, deck(r));
    leap(r, 580, 880, 400);
    leap(r, 0, 1080, 400);   // over the glass
    leap(r, 1060, 1200, 400);   // and the box
    r.finish();
  },
  'L3-2': r => {
    const hopGlass = () => { r.until(g => g.body.x >= 385, 4); hopOnCart(r); };
    drunk(r, { right: true });
    r.until(g => cart(g).dir > 0 && cart(g).x < 240, 6);
    hopOnCart(r);
    hopGlass();
    // jump at the end of the rail and leave the body at the top
    r.until(g => cart(g).x >= 600, 4);
    r.tick({ jump: true, jumpPressed: true });
    r.until(g => g.body.vy >= 0, 2, { jump: true });
    r.skill();
    const x = plank(r);
    // awake at the first bottle: back on the cart, through the second one and over the glass, then jump and K onto the body
    r.until(g => cart(g).dir < 0 && cart(g).x < 230, 6);
    hopOnCart(r);
    hopGlass();
    assert.ok(r.game.targetStage() > 0, 'the second bottle on the way');
    r.until(g => cart(g).x >= 540, 4);
    leap(r, 0, x - 20, deck(r), 1, 1);
    leap(r, 0, 760, 200);
    // over the glass on top of the wall, to the foot of the shaft
    leap(r, 0, 940, 200);
    leap(r, 0, 1100, 200);
    r.until(g => g.body.x >= 1170, 2, { right: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    leap(r, 0, 1180, 120);
    leap(r, 0, 1180, 40);
    out(r);
  },
  'L3-3': r => {
    // onto the sofa, and K at the top of every rise while a bottle is in you: up the bottles onto the shelf
    const b = r.game.body;
    let rising = false;
    for (let n = 0; n < 6 * STEP_HZ && !(n > 60 && b.grounded && b.y <= 240); n++) {
      const top = rising && b.vy >= 0;
      rising = !b.grounded && b.vy < 0;
      r.tick({ left: true, jump: true, ...(top && r.game.targetStage() > 0 ? { kPressed: true } : {}) });
    }
    leap(r, 480, 700, 240);   // over the gap in the shelf
    r.until(g => g.body.x >= 940, 4, { right: true });
    r.tick({ right: true, jump: true, jumpPressed: true });
    r.finish({ right: true, jump: true });
  },
  'L3-4': r => {
    drunk(r, { right: true });
    r.world();   // the bridge comes three seconds after the sip
    leap(r, 290, 440, 240);   // over the gap in it
    leaveBody(r, 530, g => g.body.vy > 0 && g.body.y >= 250);
    // awake at the bottle and sober: in three seconds the bridge goes and a wall comes down on the body.
    // Run the bridge, jump onto the body, and straight on down the drop past the glass
    const x = plank(r), y = deck(r);
    leap(r, 290, 440, 240);
    leap(r, 500, x, y);
    leap(r, 0, 1150, 640);
    r.until(g => g.targetStage() > 0, 3, { right: true });
    // over the block behind the guard as he walks off, and K over him when he turns back
    r.until(g => guard(g).dir < 0 && guard(g).x < 480 && guard(g).x > 420, 12);
    leap(r, 920, 760, 640);   // over the glass
    leap(r, 720, 560, 640);
    r.until(g => guard(g).dir > 0 && g.body.x - guard(g).x < 240, 8);
    leap(r, 0, 320, 640, 1, 1);
    r.finish({ left: true });
  },
  'L3-5': r => {
    // off the ledge, over the glass and onto the foot of the belt (the box over the glass is a step for a short fall)
    drunk(r, { right: true });
    // off the end of the belt, and the body out over the glass on the way down
    leaveBody(r, 700, g => g.body.vy > 0 && g.body.y >= 570);
    const x = plank(r);
    r.until(g => g.targetStage() > 0, 3, { right: true });   // the second bottle, on the way
    leap(r, 755, x, deck(r));
    leap(r, 0, 1180, 400, 1, 1);
    r.finish();
  },  'L3-6': r => {
    drunk(r, { right: true });   // the ledge bottle: this is the one to wake at
    // down into the well behind the guard as he walks to the wall; jump behind him and leave the body at the top
    r.until(g => guard(g).dir > 0 && guard(g).x > 260, 20);
    // keep three tiles behind him; jump as he reaches the wall
    for (let n = 0; n < 8 * STEP_HZ && !(guard(r.game).x >= 650 && r.game.body.y >= 600); n++) r.tick(r.game.body.x < guard(r.game).x - 120 ? { right: true } : {});
    r.tick({ jump: true, jumpPressed: true });
    r.until(g => g.body.vy >= 0, 2, { jump: true });
    r.skill();
    assert.ok(r.game.entities.some(e => e.kind === 'corpse'), 'no body left behind');
    const x = plank(r), y = deck(r);
    // awake on the ledge: the other bottle, down again, and K onto the body
    r.until(g => g.targetStage() > 0, 2, { right: true });
    r.until(g => g.body.x >= 300 && g.body.y >= 600, 4, { right: true });
    leap(r, 420, x - 10, y, 1, 1);
    fetch(r, 620, 760, 400);   // up through the cocktail and onto the block
    leap(r, 770, 880, 400, 0.2);   // over the glass
    leap(r, 890, 1000, 400, 0.2);   // and the next
    r.until(g => g.body.x >= 1150, 2, { right: true });   // across the boxes and the belt
    leap(r, 0, 1220, 360);   // up the step and out
    r.finish();
  },  'L3-7': r => {
    drunk(r, { right: true });   // the shelf goes three seconds after this
    leap(r, 190, 420, 360, 0.3);
    fetch(r, 420, 420, 360);   // straight up for the cocktail
    leap(r, 470, 830, 320, 1, 1);   // K up onto the landing, sober again
    r.until(g => g.targetStage() > 0, 2, { right: true });   // the landing bottle: wake here
    jumpThrow(r, 960);
    r.skill();
    const x = plank(r), y = deck(r);
    r.until(g => g.targetStage() > 0, 2, { right: true });   // the other bottle on the landing
    leap(r, 0, x + 10, y, 1, 1);   // K at the top onto the body
    leap(r, 0, x + 20, 80);   // straight up through the ledge under the hatch
    out(r);
  },  'L3-8': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    // over the curb, across the chair's beat (hop him as he comes, keep back while he rolls away), down off the next
    // curb, under the bridge, and onto the sofa
    const toTheSofa = () => {
      r.until(g => chair().dir < 0 && chair().x < 800, 12);
      leap(r, 0, 900, 640, 0.3);
      for (let n = 0; n < 10 * STEP_HZ && r.game.body.x > 660; n++) {
        const b = r.game.body, gap = b.x - chair().x, ahead = gap > 0;
        if (ahead && chair().dir > 0 && gap < 105 && b.grounded) r.tick({ left: true, jump: true, jumpPressed: true });
        else if (!b.grounded) r.tick({ left: true, jump: true });
        else r.tick(ahead && chair().dir < 0 && gap < 140 ? {} : { left: true });
      }
      r.until(g => g.body.vy < -TUNING.sofa + 1, 4, { left: true });   // off the curb, under the bridge, and the sofa throws him up
      assert.ok(r.game.body.vy < -TUNING.sofa + 1, 'missed the sofa');
    };
    drunk(r, { left: true });   // the bottle by the shaft: wake here
    toTheSofa();
    r.until(g => g.body.y <= 440, 2);   // rising through the sensor
    r.skill();
    assert.ok(r.game.sensed, 'the body is not in the sensor');
    toTheSofa();   // awake by the bottle: the same way again
    landOn(r, 300, 480);   // off the top of the bounce onto the bridge
    leap(r, 0, 480, 400);
    leap(r, 0, 300, 320);
    fetch(r, 300, 300, 320);   // straight up for the cocktail
    leap(r, 0, 440, 240);
    leap(r, 0, 560, 200);
    r.until(g => g.body.x >= 660, 2, { right: true });
    r.until(g => g.body.grounded && Math.abs(g.body.vx) < 5, 1);
    r.until(g => cart(g).dir < 0 && cart(g).x < 830, 12);   // wait at the edge for the cart to come back
    hopOnCart(r);
    r.until(g => cart(g).x >= 1000, 10);
    leap(r, 0, 1120, 200);
    r.finish();
  },  'L3-9': r => {
    drunk(r, { right: true });   // the walkway goes in three seconds, and the belt comes
    for (const [from, x] of [[410, 520], [650, 760]]) leap(r, from, x, 200, 0.3);   // over the glass
    r.until(g => g.body.x >= 890, 2, { right: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    r.until(g => g.stageWarn && g.stageWarn.t < 0.45, 3);   // drop off the end just before the world turns
    leap(r, 0, 960, 360, 0.1);
    for (let n = 0; n < 4 * STEP_HZ && !(r.game.body.vy < -TUNING.sofa + 1); n++) {
      const dx = 620 - r.game.body.x - r.game.body.vx * 0.12;
      r.tick(dx > 6 ? { right: true } : dx < -6 ? { left: true } : {});
    }
    assert.ok(r.game.body.vy < -TUNING.sofa + 1, 'missed the sofa');
    // K at the top of the bounce over to the shelf
    const b = r.game.body;
    for (let n = 0; n < 4 * STEP_HZ && !(b.grounded && n > 4); n++) {
      const dx = 260 - b.x - b.vx * 0.12, input = {};
      if (dx > 6) input.right = true; else if (dx < -6) input.left = true;
      if (b.vy >= 0 && r.game.targetStage() > 0) input.kPressed = true;
      r.tick(input);
    }
    assert.ok(b.y === 320, `the shelf missed: (${b.x.toFixed(0)}, ${b.y.toFixed(0)})`);
    r.finish({ left: true });   // off its end and down the hole
  },  'L3-10': r => {
    drunk(r, { right: true });   // the first bottle on the ledge: wake here
    leap(r, 270, 480, 400);   // down onto the shelf
    // step off its end behind the guard as he walks onto the sensor, and leave the body at his back as you drop
    r.until(g => guard(g).dir > 0 && guard(g).x > 650, 20);
    r.until(g => g.body.x >= 655, 2, { right: true });
    r.until(g => g.body.vy > 0 && g.body.y >= 420, 2);
    r.skill();
    r.wait(0.5);
    assert.ok(r.game.sensed, 'the guard is not held on the sensor');
    // awake on the ledge: the second bottle, and three seconds to the step
    r.until(g => g.targetStage() > 0, 2, { right: true });
    leap(r, 270, 480, 400);
    leap(r, 590, 780, 400);   // onto the wall through the cocktail
    r.until(g => g.body.x >= 1080, 3, { right: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    r.until(g => g.stage > 0 || (g.stageWarn && g.stageWarn.t < 0.3), 3);   // jump as the step comes, clear of its edge
    leap(r, 0, 1220, 240, 1, 1);
    r.finish();
  },
};

// A day is one map: its rooms sit side by side ("at"), each walked out of its right edge into the next one's left.
// bands[i] is the run of rows open between room i and room i + 1 (the last one leaves the day). The rest of
// both edge columns is wall; the row under an entrance band is the ledge you come in on. Doors (O) are gone.
const PASS = c => !'#BC<>SGV'.includes(c);
const setCol = (rows, x, keep) => rows.map((row, y) => row.slice(0, x) + (keep(y) ? row[x] === 'O' ? '.' : row[x] : '#') + row.slice(x + 1));
// The way out of a room drops down a two-tile shaft (columns 29-30) to floor height: the wall stops a running
// Jim, and he walks into the next room at its floor instead of falling into it from high up.
const shaft = room => {
  const top = room.tiles.findIndex(row => row[29] === '#');
  return { ...room, tiles: room.tiles.map((row, y) => y >= top && y <= 15 ? row.slice(0, 29) + '..' + row.slice(31) : row) };
};
function connect(list, bands) {
  assert.equal(bands.length, list.length, 'one band per room');
  const rooms = list.map((room, i) => {
    let tiles = room.tiles.map(row => row.replace('O', '.'));
    const [o0, o1] = bands[i];
    tiles = setCol(tiles, 31, y => y >= o0 && y <= o1);
    tiles = tiles.map((row, y) => y >= o0 && y <= o1 ? row.slice(0, 31) + '.' : row);
    if (i) {
      const [i0, i1] = bands[i - 1];
      tiles = setCol(tiles, 0, y => y >= i0 && y <= i1);
      tiles = tiles.map((row, y) => y >= i0 && y <= i1 ? '.' + row.slice(1) : row);
      // a spawn against the left wall moves a tile in, clear of it
      tiles = tiles.map(row => row[1] === 'P' ? row[0] + '.P' + row.slice(3) : row);
    }
    const exits = { right: list[i + 1]?.id ?? null };
    if (i) exits.left = list[i - 1].id;
    return { ...room, tiles, at: [i, 0], exits, portalTarget: undefined };
  });
  // the open rows of each seam must match on both sides
  rooms.slice(1).forEach((room, i) => {
    const a = rooms[i].tiles.map(row => PASS(row[31])).join(), b = room.tiles.map(row => PASS(row[0])).join();
    assert.equal(a, b, `${rooms[i].id} → ${room.id}: the edges do not line up`);
  });
  return rooms;
}

// Day 3 climbs and falls: each room says which way it goes on ('right', 'top' or 'bottom'), and the rooms stand where
// that puts them. The open cells on both sides of a seam must match. A way up comes in through a one-way plank in the
// next room's floor; a way down is a hole in the floor, and the room below has the same hole in its ceiling.
function climb(list, ways) {
  assert.equal(ways.length, list.length, 'one way on per room');
  let [col, row] = [0, 0];
  const rooms = list.map((room, i) => {
    const exits = { [ways[i]]: list[i + 1]?.id ?? null };
    if (ways[i - 1] === 'right') exits.left = list[i - 1].id;
    const placed = { ...room, at: [col, row], exits, portalTarget: undefined };
    if (ways[i] === 'right') col++; else if (ways[i] === 'top') row--; else row++;
    return placed;
  });
  rooms.slice(1).forEach((room, i) => {
    const from = rooms[i];
    const edge = ways[i] === 'right' ? [from.tiles.map(row => PASS(row[31])).join(), room.tiles.map(row => PASS(row[0])).join()]
      : ways[i] === 'top' ? [[...from.tiles[0]].map(PASS).join(), [...room.tiles[17]].map(PASS).join()]
      : [[...from.tiles[17]].map(PASS).join(), [...room.tiles[0]].map(PASS).join()];
    assert.equal(edge[0], edge[1], `${from.id} → ${room.id}: the edges do not line up`);
  });
  return rooms;
}

// day-3 rooms with a painted background so far; the rest are greybox until their pictures are drawn
const PAINTED = new Set(['L3-1', 'L3-2', 'L3-3', 'L3-4', 'L3-5']);

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
  maps: [{
    id: 'day-1', name: '第一天　辦公室', cells: 1, abilities: [], hud: false,
    rooms: connect(day1, [[12, 15], [6, 9], [12, 15], [0, 3]]),
  }, {
    id: 'day-2', name: '第二天　微醺', cells: 1, abilities: [],
    rooms: connect(day2.map((room, i) => [0, 1, 5, 6].includes(i) ? shaft(room) : room), [[12, 15], [12, 15], [8, 11], [6, 9], [10, 13], [12, 15], [12, 15], [6, 9]]),
  }, {
    id: 'day-3', name: '第三天　醉影', cells: 1, abilities: ['wrestler'], zui: 'corpse',
    // painted backgrounds (prototype/art/day3, drawn from handoff/art-day3); redraw them when a room's tiles change
    rooms: climb(day3, ['right', 'top', 'right', 'bottom', 'right', 'right', 'top', 'right', 'bottom', 'right'].slice(0, day3.length))
      .map(room => PAINTED.has(room.id) ? { ...room, background: `art/day3/map-${room.id}.webp` } : room),
  }],
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const routes = { stepHz: STEP_HZ, rules: 'chill-puzzle', rooms: {} };
  campaign.maps.forEach((map, mapIndex) => {
    for (const room of map.rooms) {
      const recorded = recordRoom(campaign, room.id, plans[room.id], { mapIndex });
      // P takes the room's cocktail on the way
      if (room.tiles.join('').includes('*')) assert.ok([...recorded.game.capsGot].some(key => key.includes(`:${room.id}:`)), `${room.id}: P route missed the cocktail`);
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
