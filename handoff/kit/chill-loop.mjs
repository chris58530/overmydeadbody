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

// Day 3: the drunk shadow. One grade leaves Jim's body behind and sends him back to the last bottle he drank, which
// stays empty while the body is there (walk back into it, or J with no grade left, to take the body away: a body in the
// wrong place is never a reason to die); two grades are the throw. The body is more than a plank: it holds a sensor, stops a beam, turns a
// chair back, and the jump home is a way out of anywhere. Rooms are one climbing map: every way on is right or up.
// The first rooms hold Jim to one grade (cells: 1): the body and K are the moves there, and the throw comes in its own room.
// A throw lifts Jim 2 tiles, tops out 7.8 above where he stood and lands about 17 tiles on; holding the
// other way pulls the landing back to about 9.5. J at the top of a jump tops out 10.5 up, 10 tiles on.
export const day3 = [
  // Leave your body over the pit, wake up by the bottle, and cross on it. A jump and a double jump fall short.
  { ...artRoom('L3-1', '留位置', 'office', 0, [], [
    ...Array(6).fill('...............................#'),
    ...Array(3).fill(EMPTY),
    '.P..D...........................',
    ...Array(6).fill('#######.............############'),
    '#######^^^^^^^^^^^^^############',
    FLOOR,
  ]), cells: 1 },

  // The door opens while the sensor over the glass holds something. Leave the body inside it: it holds the door and
  // it is the only step across. Too high and it cannot be reached, too far and it misses the sensor.
  // Cocktail: straight up from the body.
  { ...artRoom('L3-2', '開門', 'office', 0, [], [
    '##########################...###',
    '#.......................#......#',
    '#.......................#..==..#',
    '#.......................#......#',
    '#..............*........#.==...#',
    '#.......................#......#',
    '........................G..==..#',
    '...............HH.......G......#',
    '...............HH.......G==....#',
    '.P.....D.......HH.......G......#',
    ...Array(6).fill('##########............##########'),
    '##########^^^^^^^^^^^^##########',
    FLOOR,
  ]), cells: 1 },

  // Beams from the ceiling of the tunnel. A body lying across a beam stops it: leave it from the side, close enough to
  // reach and not close enough to burn, and walk under. Each bottle is good for one beam, and the last for the step up
  // the wall: left too high it cannot be reached, so go back and leave it lower.
  { ...artRoom('L3-3', '遮', 'office', 0, [], [
    '################################',
    '#..............................#',
    ...Array(4).fill('#...............................'),
    ...Array(3).fill('#.........................######'),
    '#......................D..######',
    '#.....==.V######V###############',
    '#..............................#',
    '#..==..........................#',
    '#..............................#',
    '#.....==.......................#',
    '#...........D.........D.P......#',
    '##########################===###',
    '##########################...###',
  ]), cells: 1 },

  // The bridge is there only while the chair is in its nook, under a roof Jim cannot fit. Left alone the chair rolls
  // out again and the bridge goes before anyone is across. Follow it in and leave the body at the mouth: it turns the
  // chair back, the chair stays in, and the bridge stays up.
  { ...artRoom('L3-4', '關椅子', 'pantry', 0, [], [
    FLOOR, FLOOR,
    ...Array(3).fill('............####################'),
    '.P..........####################',
    '#######.....####################',
    '#######.........................',
    '#######.........................',
    '#####HH..RD.....................',
    '############gggggggggggggggggg##',
    ...Array(5).fill('############..................##'),
    '############^^^^^^^^^^^^^^^^^^##',
    FLOOR,
  ]), cells: 1 },

  // The sensor is down the shaft, and the jump home is the way back up: drink, go down, leave the body in it on the way
  // past, and wake on the ledge. Then the sofa, not a jump, carries Jim over to the open door.
  // Nothing here kills: fall in with nothing and the sofa throws you back out.
  { ...artRoom('L3-5', '下去再回來', 'pantry', 0, [], [
    '####################...#########',
    '#.................#............#',
    '#.................#.==.........#',
    '#.................#............#',
    '#.................#..==........#',
    '#.................#............#',
    '#.................G==..........#',
    '..................G............#',
    '..................G...==.......#',
    '.P..D.............G............#',
    '######........##################',
    ...Array(4).fill('######..HHHHH.##################'),
    '######SSSSSSSS##################',
    FLOOR, FLOOR,
  ]), cells: 1 },

  // Which bottle you wake at. The body from the first bottle is the step up to the second; drink that one, and the body
  // left in the sensor sends you back up to it, not down to the floor. The hatch above opens only with the sensor held.
  { ...artRoom('L3-6', '先後', 'pantry', 0, [], [
    '########...#####################',
    '#..............................#',
    '#.......==.....................#',
    '##########################GGG###',
    '#############.............==...#',
    '#############..................#',
    '#############..............==..#',
    '#############..................#',
    '#############........HHH==.....#',
    '#############........HHH.......#',
    '#############.D......HHH.......#',
    ...Array(4).fill('#################..............#'),
    '#################..D....P......#',
    '####################===#########',
    '####################...#########',
  ]), cells: 1 },

  // Two bottles for the throw: over a wall nothing else clears, onto a pillar the throw overshoots: pull back in the air.
  artRoom('L3-7', '丟', 'street', 0, [], [
    FLOOR,
    ...Array(6).fill('#..............................#'),
    ...Array(2).fill('#...............................'),
    ...Array(2).fill('#.............##................'),
    ...Array(2).fill('#.............##............####'),
    ...Array(2).fill('#.............##.......##...####'),
    '#.DD..P.......##.......##...####',
    '########===#####^^^^^^^##^^^####',
    '########...#####################',
  ]),

  // Drink both and throw: the throw comes down on the sofa, and from that high a sofa sends you up to the high ledge,
  // where no jump onto it reaches. The ceiling stops a throw from up in a jump going straight over.
  artRoom('L3-8', '丟上沙發', 'street', 0, [], [
    FLOOR,
    '#..##################...........',
    ...Array(3).fill('#...............................'),
    ...Array(2).fill('#....................###########'),
    ...Array(3).fill('.....................###########'),
    '.P.DD................###########',
    '#######..............###########',
    '#######.......SSS....###########',
    ...Array(3).fill('#######.......###....###########'),
    '#######^^^^^^^###^^^^###########',
    FLOOR,
  ]),

  // The sensor is up where you came in, the door down on the floor. Drink on the floor, climb back up, leave the body in
  // the sensor, and the jump home drops you at the door. The two bottles past it are the throw over the glass.
  artRoom('L3-9', '留一手', 'street', 0, [], [
    FLOOR,
    ...Array(2).fill('............####################'),
    '..HH........####################',
    '.PHH........####################',
    '#####.......####################',
    '#.......==..#..................#',
    '#...........#..................#',
    '#....==.....#..................#',
    '#...........#..................#',
    '#.......==..#..................#',
    '#...........#..................#',
    '#....==.....G...................',
    '#...........G...................',
    '#.......==..G...................',
    '#..D........GDD.................',
    '###############^^^^^^^^^^^^^####',
    FLOOR,
  ]),

  // All of it. Shut in at the start: the sensor overhead takes the first bottle's body. Then drink twice on the floor that
  // goes, jump to the ledge as it comes, jump and throw from it, grab the bottle at the top, and K over the glass-topped wall.
  // Fall short and the sofa below throws you back up to it. Cocktail: come down on the sofa on purpose.
  artRoom('L3-10', '醉了又醒', 'street', 0, [], [
    ...Array(2).fill('#.......#......................#'),
    '#.......#............D.........#',
    '#.......#..............^^^.....#',
    ...Array(4).fill('#.......#...............##......'),
    ...Array(2).fill('#.......#...............##....##'),
    ...Array(2).fill('#.......G...............##....##'),
    '.HHH....G...............##..*.##',
    '.HHH....G...............##....##',
    '........G...............##....##',
    '.PD.D.D.G...............##....##',
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
    r.finish();
  },
  'L3-2': r => {
    drunk(r, { right: true });
    leaveBody(r, 370, g => g.body.vy > 0 && g.body.y >= 350);   // into the sensor, on the way down
    const x = plank(r);
    assert.ok(r.game.sensed, 'the sensor holds the body');
    leap(r, 370, x, deck(r));
    fetch(r, 620, x, deck(r));
    leap(r, x + 10, 900, 400);
    r.until(g => g.body.x >= 1000, 2, { right: true });
    for (const [x, y] of [[1040, 320], [1130, 240], [1090, 160], [1100, 80]]) leap(r, 0, x, y);
    out(r);
  },
  'L3-3': r => {
    drunk(r, { left: true });
    shade(r, 705);   // beside the first beam
    r.until(g => g.targetStage() > 0, 4, { left: true });
    shade(r, 425);   // the second, from its own bottle
    r.until(g => g.body.x <= 320, 3, { left: true });
    for (const [x, y] of [[280, 560], [160, 480], [280, 400]]) leap(r, 0, x, y);
    drunk(r, { right: true });
    leaveBody(r, 960, g => g.body.vy < 0 && g.body.y <= 350);   // low enough to reach: a step up the wall
    leap(r, 0, plank(r) - 10, deck(r));
    leap(r, 0, 1100, 240);
    r.finish();
  },
  'L3-4': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    r.until(g => g.body.x >= 258, 2, { right: true });
    r.until(() => chair().dir < 0 && chair().x < 400, 12);   // down behind the chair as it rolls for the nook
    drunk(r, { right: true });
    r.until(g => g.body.x <= 325, 2, { left: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    r.until(() => chair().x < 284, 3);
    r.skill();
    assert.ok(chair().x < plank(r) && plank(r) < 362, 'the chair is shut in behind the body');
    r.until(g => g.tiles[10][12] === 'G', 4);
    r.wait(0.3);
    r.finish();
  },
  'L3-5': r => {
    drunk(r, { right: true });
    leaveBody(r, 150, g => g.body.vy > 0 && g.body.y >= 480);   // down the shaft and into the sensor
    assert.ok(r.game.sensed, 'the sensor holds the body');
    toSofa(r, 215, 530);
    landOn(r, 640, 400);
    r.until(g => g.body.x >= 820, 3, { right: true });
    for (const [x, y] of [[920, 320], [810, 240], [880, 160], [850, 80]]) leap(r, 0, x, y);
    out(r);
  },
  'L3-6': r => {
    drunk(r, { left: true });
    r.until(g => g.body.x <= 730, 2, { left: true });
    r.tick({ left: true, jump: true, jumpPressed: true });
    r.until(g => g.body.vy < 0 && g.body.y <= 572, 2, { jump: true });
    r.skill();
    leap(r, 0, plank(r) + 6, deck(r));
    leap(r, 0, 660, 440);
    drunk(r, { left: true });   // the second bottle
    leaveBody(r, 640, g => g.body.vy > 0 && g.body.y >= 400);
    assert.ok(r.game.sensed, 'the sensor holds the body');
    leap(r, 640, plank(r), deck(r));
    leap(r, 0, 1000, 320);
    leap(r, 0, 1110, 240);
    leap(r, 0, 1085, 160);
    leap(r, 0, 1020, 120);
    r.until(g => g.body.x <= 385, 3, { left: true });
    r.until(g => Math.abs(g.body.vx) < 5, 1);
    leap(r, 0, 372, 80);
    out(r);
  },
  'L3-7': r => {
    r.until(g => g.targetStage() === 2, 4, { left: true });
    r.until(g => g.body.x >= 330, 2, { right: true });
    fling(r, 990, 520);
    leap(r, 980, 1180, 440);
    r.finish();
  },
  'L3-8': r => {
    r.until(g => g.targetStage() === 2, 4, { right: true });
    r.until(g => g.body.x <= 110, 2, { left: true });   // the throw comes down on the sofa
    fling(r, 600, 480);
    landOn(r, 880, 200);
    r.finish();
  },
  'L3-9': r => {
    r.until(g => g.body.y >= 640, 3, { right: true });
    drunk(r, { left: true });
    r.until(g => g.body.x >= 260, 2, { right: true });
    for (const [x, y] of [[360, 560], [240, 480], [360, 400], [240, 320], [360, 240], [180, 200]]) leap(r, 0, x, y);
    r.until(g => g.body.x <= 120, 2, { left: true });
    r.skill();   // the body holds the sensor, and Jim wakes on the floor
    r.until(g => g.targetStage() === 2, 4, { right: true });
    r.until(g => g.body.x >= 585, 1, { right: true });
    fling(r, 1180, 640);
    r.finish();
  },
  'L3-10': r => {
    drunk(r, { right: true });
    r.tick({ jump: true, jumpPressed: true });
    r.until(g => g.body.vy < 0 && g.body.y <= 540, 2, { jump: true });
    r.skill();
    assert.ok(r.game.sensed, 'the sensor holds the body');
    r.world();
    r.until(g => g.targetStage() === 2, 4, { right: true });
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

// Day 3 climbs: each room says which way it goes on ('right' or 'top'), and the rooms stand where that puts them.
// The open cells on both sides of a seam must match. A way up comes in through a one-way plank in the next room's floor.
function climb(list, ways) {
  assert.equal(ways.length, list.length, 'one way on per room');
  let [col, row] = [0, 0];
  const rooms = list.map((room, i) => {
    const exits = { [ways[i]]: list[i + 1]?.id ?? null };
    if (ways[i - 1] === 'right') exits.left = list[i - 1].id;
    const placed = { ...room, at: [col, row], exits, portalTarget: undefined };
    if (ways[i] === 'right') col++; else row--;
    return placed;
  });
  rooms.slice(1).forEach((room, i) => {
    const from = rooms[i];
    const edge = ways[i] === 'right' ? [from.tiles.map(row => PASS(row[31])).join(), room.tiles.map(row => PASS(row[0])).join()]
      : [[...from.tiles[0]].map(PASS).join(), [...room.tiles[17]].map(PASS).join()];
    assert.equal(edge[0], edge[1], `${from.id} → ${room.id}: the edges do not line up`);
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
    id: 'day-3', name: '第三天　醉影', cells: 2, abilities: ['wrestler'], zui: 'corpse',
    rooms: climb(day3, ['right', 'top', 'right', 'right', 'top', 'top', 'right', 'right', 'right', 'right']),
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
