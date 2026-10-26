// The drink-use-sober loop (bottles: "drink"), day 1: grades 0-1, so the only move is the throw.
// Touching a bottle drinks it (it comes back a few seconds later), J spends the grade it uses, K spends one with a hop,
// and the world is the body three seconds ago. No room can be lost for good: every bottle comes back.
// node handoff/kit/chill-loop.mjs   writes prototype/chill-loop.json and chill-loop-routes.json
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artRoom, recordRoom, replayRoom, STEP_HZ } from './chill-room-tools.mjs';
import { rooms as day1 } from './chill-day1.mjs';

//                                    0         1         2         3
//                                    01234567890123456789012345678901
const EMPTY = '................................';
const FLOOR = '################################';

const put = (rows, at) => rows.map((row, y) => [...row].map((ch, x) => at.find(([px, py]) => px === x && py === y)?.[2] ?? ch).join(''));
const reroom = (id, name, bottles, lines) => {
  const room = day1.find(r => r.id === id);
  return { ...room, id: 'L' + id, name, tiles: put(room.tiles, bottles.map(([x, y]) => [x, y, 'D'])), lines };
};

export const rooms = [
  reroom('1-1', '第一口', [[6, 15]], ['解法：清醒叫不出醉影。走過去碰到酒就喝了，J 丟過隔板。', '出招會把醉意用掉：丟完你又是清醒的。']),
  reroom('1-2', '轉椅', [[3, 15]], ['解法：喝了酒，樓梯三秒後才出現。等它出現再爬，等的時候跳過轉椅。', '幻覺是真的，踩得上去。']),
  reroom('1-3', '午後雷陣雨', [[22, 15]], ['解法：酒在檯子邊。喝了三秒後雨棚會蓋住：喝完馬上 J。']),
  reroom('1-4', '夜班警衛', [], ['解法：橋是幻覺。爬上去，看警衛走：K 放屁會小跳一下，三秒後橋消失。',
    '算好讓他三秒後在玻璃上方，掉下去就倒了。']),

  // Drink and throw up onto the deck: the throw spends the grade, so you land sober. The door is in the
  // covered passage underneath, over glass, and its floor is a hallucination: drink the second bottle on the
  // deck, wait for the floor to appear, drop through the hatch and walk in. Throwing there would fade it.
  artRoom('L1-5', '醉了又醒', 'street', 0,
    ['解法：喝，丟上平台。丟完你又清醒了。', '門在下面的騎樓裡，地板是幻覺：平台上再喝一瓶，等地板出現，再從洞口跳下去走進門。'], [
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
      '......................D.........',
      '........####################..##',
      '........########................',
      '........########................',
      '........########................',
      '........########................',
      '........########................',
      '.P..D...########O...............',
      '##################^^^^^^^^^^^^##',
      FLOOR,
    ], {
      1: [
        ...Array(16).fill(EMPTY),
        '..................############..',
        EMPTY,
      ],
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

export const plans = {
  'L1-1': r => {
    drunk(r, { right: true });
    r.until(g => g.body.x >= 320, 2, { right: true });
    r.skill(); r.land(); r.finish();
  },
  'L1-2': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    drunk(r, { right: true });
    // hop the chair against its roll each time it comes by while the stairs come in
    for (let n = 0; n < 6 * 240 && (r.game.stageWarn || r.game.stageDeferred.length || !r.game.body.grounded); n++) {
      const g = r.game, c = chair(), near = Math.abs(c.x - g.body.x) < 120 && Math.sign(g.body.x - c.x) === c.dir;
      const over = c.dir < 0 ? { right: true } : { left: true };
      r.tick(near && g.body.grounded ? { jumpPressed: true, jump: true, ...over } : g.body.grounded ? {} : { jump: true, ...over });
    }
    for (const [x, y] of [[300, 560], [420, 480], [540, 400], [660, 320], [780, 240], [940, 160]]) r.stair(x, y);
    r.finish();
  },
  'L1-3': r => {
    drunk(r, { right: true });
    r.skill(); landRight(r); r.finish();
  },
  'L1-4': r => {
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [460, 320]]) r.stair(x, y);
    r.until(g => Math.abs(ahead(guard(g), 3, 582, 1058) - 820) < 24, 10);
    r.grade(-1); r.world();
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 715, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
  'L1-5': r => {
    drunk(r, { right: true });
    r.skill(); landRight(r);
    r.until(g => g.targetStage() > 0, 3, { right: true });
    r.until(g => g.stage === 1 && !g.stageWarn, 8);
    r.until(g => g.body.grounded && g.body.y > 600, 4, { right: true });
    r.finish({ left: true });
  },
};

const chain = list => list.map((room, i) => ({ ...room, portalTarget: list[i + 1]?.id ?? null }));

export const campaign = {
  format: 'drunken-rooms', version: 2, rules: 'chill-puzzle', skills: 'single', bottles: 'drink',
  maps: [{
    id: 'loop-1', name: '第一天　微醺', cells: 1, abilities: ['wrestler'],
    intro: '加班到十一點。路邊有酒。\n喝了就有幻覺，幻覺是真的，醉影也會來。\n醉影出手一次，酒就醒一點；醒了，幻覺三秒後就散。',
    outro: '醉影把我丟過了半個城市。明天再走。',
    rooms: chain(rooms),
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
