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

// Day 3: the shadow's throw. J spends the grade, so you fly sober: a bottle on the arc refills K.
// A throw lifts Jim 2 tiles, tops out 7.8 above where he stood and lands about 17 tiles on; holding the
// other way pulls the landing back to about 9.5. J at the top of a jump tops out 10.5 up, 10 tiles on:
// every door sits above that, or behind a wall it cannot clear.
export const day3 = [
  // Over a wall nothing else clears, onto a pillar the throw overshoots: pull back in the air.
  // Cocktail: a throw from the top of a jump, straight into the wall, comes up high enough for it.
  artRoom('L3-1', '丟', 'office', 0, [], [
    ...Array(4).fill(EMPTY),
    '.......*........................',
    ...Array(5).fill(EMPTY),
    '........##......................',
    '........##......................',
    '........##....................O.',
    '........##.....##......#########',
    '........##.....##......#########',
    '.P.D....##.....##......#########',
    '##########^^^^^##^^^^^^#########',
    FLOOR,
  ]),

  // The sofa: walk onto it and it throws you 5 tiles up, jump onto it for 6.
  // Cocktail: from the pillar, jump back down onto the first sofa: from that high it throws you to the cocktail. Drop onto one from high up and it
  // throws you 8: the door is only that high.
  artRoom('L3-2', '沙發', 'office', 0, [], [
    ...Array(7).fill(EMPTY),
    '.......*........................',
    '..............................O.',
    '........................########',
    '........................########',
    '........................########',
    '............####........########',
    '............####........########',
    '............####........########',
    '.P..........####........########',
    '####^^SS^^^^####^^^SS^^^########',
    FLOOR,
  ]),

  // Drink and throw: the throw comes down on the sofa, and from that high a sofa sends you back up 8 tiles,
  // where no jump onto it reaches. The ceiling stops a throw from up in a jump going straight over; a throw
  // from the floor and the sofa's bounce both stay just under it.
  artRoom('L3-3', '丟上沙發', 'office', 0, [], [
    ...Array(4).fill(EMPTY),
    '....#################...........',
    '....#################...........',
    EMPTY, EMPTY, EMPTY,
    ...Array(6).fill('.....................###########'),
    '.P.D.................###########',
    '####^^^^^^^^SSS^^^^^^###########',
    FLOOR,
  ]),

  // The ledge is higher than any throw goes. Jump, J at the top of the jump, catch the bottle at the top of
  // the throw and K: only all three together reach it.
  artRoom('L3-4', '空中一杯', 'office', 0, [], [
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
  artRoom('L3-5', '台子會散', 'street', 0, [], [
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

  // The throw lands on boxes under a tube: the tube lets go as you come in and the boxes as you land. Get off at
  // once, and keep running under the second tube. The ceiling stops a throw from up in a jump flying past.
  artRoom('L3-6', '燈管落點', 'office', 0, [], [
    ...Array(4).fill(EMPTY),
    '....############................',
    '....############................',
    EMPTY,
    '.................L.......L......',
    EMPTY, EMPTY, EMPTY,
    '..............................O.',
    '................CCC......#######',
    '.........................#######',
    '.........................#######',
    '.P.D.....................#######',
    '####^^^^^^^^^^^^^^^^^^^^^#######',
    FLOOR,
  ]),

  // All of it: drink on the floor that goes, jump to the ledge as it comes, jump and throw from it, grab the
  // bottle at the top, and K over the glass-topped wall onto the way out. Fall short and the sofa below
  // throws you back up to it. The glass overhangs the wall by a tile, so its corner is no place to stand.
  // Cocktail: come down on the sofa on purpose; it hangs in the bounce up to the way out.
  artRoom('L3-7', '醉了又醒', 'street', 0, [], [
    EMPTY, EMPTY,
    '.....................D..........',
    '.......................^^^......',
    ...Array(3).fill('........................##......'),
    '........................##....O.',
    ...Array(4).fill('........................##....##'),
    '........................##..*.##',
    ...Array(2).fill('........................##....##'),
    '.P....D.................##....##',
    '########^^^^^^^^^^^^^^^^##^SSS##',
    '####....########################',
  ], {
    1: [...Array(14).fill(EMPTY), '..........####..................', EMPTY, '....____........................', EMPTY],
  }),
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
    const dx = cart(r.game).x + ahead - r.game.body.x - (r.game.body.vx - cart(r.game).dir * TUNING.cartSpeed) * 0.12;
    r.tick({ jump: true, ...(dx > 6 ? { right: true } : dx < -6 ? { left: true } : {}) });
  }
  assert.ok(r.game.body.cart >= 0, 'hop missed the cart');
};
// from the spawn, jump after the cart as it sets off and land on it
const board = r => hopOnCart(r);
const drunk = (r, input) => r.until(g => g.targetStage() > 0, 10, input);

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
    jumpThrow(r, 130);
    r.skill();   // a throw from the top of the jump, into the wall and up to the cocktail
    r.until(g => g.body.grounded && g.state === 'free', 4);
    r.until(g => !bottleAt(g, 3).got, 4);
    r.until(g => g.targetStage() > 0, 4, { left: true });
    r.until(g => g.body.x <= 110, 2, { left: true });   // back to where a throw clears the wall
    fling(r, 640, 520);
    leap(r, 670, 1000, 520);
    r.finish();
  },
  'L3-4': r => {
    drunk(r, { right: true });
    jumpThrow(r, 140);
    fling(r, 850, 160, 1);
    r.finish();
  },
  'L3-2': r => {
    toSofa(r, 150, 290);
    landOn(r, 560, 480);
    toSofa(r, 0, 290);   // back down onto the first sofa from the pillar: high enough for the cocktail
    fetch(r, 300, 560, 480, 0, false);
    toSofa(r, 620, 800);
    landOn(r, 1100, 360);
    r.finish();
  },
  'L3-3': r => {
    drunk(r, { right: true });
    fling(r, 540, 640);
    landOn(r, 880, 360);
    r.finish();
  },
  'L3-5': r => {
    drunk(r, { right: true });
    r.world();
    fling(r, 560, 360);
    leap(r, 670, 1000, 200, 1, 1);
    r.finish();
  },
  'L3-6': r => {
    drunk(r, { right: true });
    fling(r, 700, 480);
    leap(r, 752, 1060, 480);   // run out from under the tube to the end of the boxes, then jump
    r.finish();
  },
  'L3-7': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 290, 2, { right: true });
    r.until(g => g.stageWarn.t < 0.35, 3);
    leap(r, 290, 460, 560);
    jumpThrow(r, 440);
    fling(r, 1110, 640, 1);   // down onto the sofa on purpose: the cocktail hangs in its bounce
    fetch(r, 1140, 1240, 320, 0, false);
    r.finish();
  },
};

// A day is one map: its rooms sit side by side ("at"), each walked out of its right edge into the next one's left.
// bands[i] is the run of rows open between room i and room i + 1 (the last one leaves the day). The rest of
// both edge columns is wall; the row under an entrance band is the ledge you come in on. Doors (O) are gone.
const PASS = c => !'#BC<>S'.includes(c);
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

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
  maps: [{
    id: 'day-1', name: '第一天　辦公室', cells: 1, abilities: [], hud: false,
    rooms: connect(day1, [[12, 15], [6, 9], [12, 15], [0, 3]]),
  }, {
    id: 'day-2', name: '第二天　微醺', cells: 1, abilities: [],
    rooms: connect(day2.map((room, i) => [0, 1, 5, 6].includes(i) ? shaft(room) : room), [[12, 15], [12, 15], [8, 11], [6, 9], [10, 13], [12, 15], [12, 15], [6, 9]]),
  }, {
    id: 'day-3', name: '第三天　醉影', cells: 1, abilities: ['wrestler'],
    rooms: connect(day3.map((room, i) => i < 6 ? shaft(room) : room), [[12, 15], [12, 15], [12, 15], [12, 15], [12, 15], [12, 15], [4, 7]]),
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
