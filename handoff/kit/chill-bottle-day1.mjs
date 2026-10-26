// Day 1 under bottle rules (bottles: "carry"): E only drinks a bottle picked up in the room, one in hand at a time;
// K is free. Grades 0-1, so the only move is the throw. The rooms are the day-1 layouts with bottles as the new question:
// where you find one, and where you drink it.
import { rooms as day1 } from './chill-day1.mjs';

const put = (rows, at) => rows.map((row, y) => [...row].map((ch, x) => at.find(([px, py]) => px === x && py === y)?.[2] ?? ch).join(''));
const reroom = (id, bottles, lines) => {
  const room = day1.find(r => r.id === id);
  return { ...room, id: 'B' + id, tiles: put(room.tiles, bottles.map(([x, y]) => [x, y, 'D'])), lines };
};

export const rooms = [
  reroom('1-1', [[6, 15]], ['解法：清醒叫不出醉影。走出櫃子撿酒，E 喝，J 丟過隔板。',
    '瓶蓋：酒先別喝，跳上紙箱，馬上 E、跳、J 往左，落在櫃頂。']),
  reroom('1-2', [[3, 15]], ['解法：撿酒 E 喝。馬上 J 差一截；等三秒樓梯出現再爬，順便跳過轉椅。',
    '瓶蓋：喝完在地上跳起來再 J 往左，落在層板上。']),
  // the bottle is at the spawn, but the awning closes the open strip three seconds after you drink it
  reroom('1-3', [[3, 15]], ['解法：酒就在腳邊，但別急著喝：喝了三秒後雨棚會蓋住。',
    '帶著酒頂著輸送帶走到檯子邊，再 E，馬上 J。在這裡只有一瓶，喝錯地方按 R 重來。',
    '瓶蓋：在檯子邊 E，跳起來再 J，貼著牆往上。']),
  reroom('1-4', [], ['解法：沒有酒，只能 K。爬到自己那段橋上，看警衛走：K 之後三秒他大約走八格。',
    '算好讓他三秒後在玻璃上方，掉下去就倒了；落地後跳過玻璃進門。',
    '瓶蓋：在右邊屋頂，J 從警衛頭上丟過去，再找時機 K。']),
  // a second bottle sits on the guard's bridge, only for the cap line
  reroom('1-5', [[8, 15], [29, 8]], ['解法：先把招牌騙下來。撿酒，到台子邊看警衛：E 之後馬上 J 上台子，三秒後他的橋消失。',
    '瓶蓋：警衛倒了之後 K，橋回來；走到橋尾撿第二瓶，拿瓶蓋，E，橋消失掉到門口。']),
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
const YARD = { 'B1-4': [582, 1058, 820], 'B1-5': [862, 1258, 1100] };
const waitForGuard = (r, id, input = {}) => {
  const [lo, hi, glass] = YARD[id];
  r.until(g => Math.abs(ahead(guard(g), 3, lo, hi) - glass) < 24, 10, input);
};

export const plans = {
  'B1-1': r => {
    r.until(g => g.body.x >= 320, 2, { right: true });
    r.grade(1); r.skill(); r.land(); r.finish();
  },
  'B1-2': r => {
    const chair = () => r.game.entities.find(e => e.kind === 'patrol');
    // drink, then hop the chair in place each time it rolls up while the stairs come in
    r.until(g => g.held, 2, { right: true });
    r.grade(1);
    for (let n = 0; n < 6 * 240 && (r.game.stageWarn || r.game.stageDeferred.length || !r.game.body.grounded); n++) {
      const g = r.game, c = chair(), near = Math.abs(c.x - g.body.x) < 120 && Math.sign(g.body.x - c.x) === c.dir;
      const over = c.dir < 0 ? { right: true } : { left: true };   // jump over it, against its roll
      r.tick(near && g.body.grounded ? { jumpPressed: true, jump: true, ...over } : g.body.grounded ? {} : { jump: true, ...over });
    }
    for (const [x, y] of [[300, 560], [420, 480], [540, 400], [660, 320], [780, 240], [940, 160]]) r.stair(x, y);
    r.finish();
  },
  'B1-3': r => {
    r.until(g => g.body.x >= 930, 8, { right: true });
    r.grade(1); r.skill(); landRight(r); r.finish();
  },
  'B1-4': r => {
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [460, 320]]) r.stair(x, y);
    waitForGuard(r, 'B1-4');
    r.grade(-1); r.world();
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 715, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
  'B1-5': r => {
    const sign = () => r.game.entities.find(e => e.kind === 'faller');
    r.until(g => sign().phase !== 'idle', 6, { right: true });
    r.until(g => sign().phase === 'gone', 3, { left: true });
    r.until(g => g.body.x >= 610, 4, { right: true });
    waitForGuard(r, 'B1-5', { right: true });
    r.grade(1); r.skill(); landRight(r); r.world();
    r.until(g => g.body.x >= 830, 3, { right: true });
    r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.until(g => g.body.x >= 1000, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true });
    r.until(g => g.body.grounded, 2, { jump: true, right: true });
    r.finish();
  },
};

// Optional bottle-cap routes, checked by chill-single.mjs (not published as P routes).
export const capPlans = {
  'B1-1': r => {   // carry the bottle onto the crumbling boxes, then drink, jump and throw left before they give way
    r.until(g => g.body.x >= 330, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.grounded && g.body.y < 600, 2, { jump: true, right: true });
    r.grade(1);
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  'B1-2': r => {
    r.until(g => g.held, 2, { right: true }); r.grade(1); r.until(g => g.body.x >= 200, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, left: true }); r.wait(0.3, { jump: true, left: true }); r.skill(-1); r.wait(2, { left: true });
  },
  'B1-3': r => {
    r.until(g => g.body.x >= 930, 8, { right: true }); r.grade(1); r.wait(0.2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.wait(0.3, { jump: true, right: true });
    r.skill(); r.wait(0.5); landRight(r); r.finish();
  },
  'B1-4': r => {
    for (const [x, y] of [[140, 560], [200, 480], [280, 400], [340, 320], [480, 320]]) r.stair(x, y);
    r.until(g => guard(g).dir < 0 && guard(g).x < 700, 10);
    r.skill(); landRight(r);
    r.until(g => g.body.x >= 1030, 3, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.grounded, 2, { jump: true, right: true });
    waitForGuard(r, 'B1-4');
    r.grade(-1); r.world(); r.wait(0.3);
    r.tick({ jumpPressed: true, jump: true, left: true }); r.until(g => g.body.x < 1030, 2, { jump: true, left: true });
    r.until(g => g.body.grounded && g.body.y > 600, 3); r.finish({ right: true }, 4);
  },
  'B1-5': r => {
    const sign = () => r.game.entities.find(e => e.kind === 'faller');
    r.until(g => sign().phase !== 'idle', 6, { right: true }); r.until(g => sign().phase === 'gone', 3, { left: true });
    r.until(g => g.body.x >= 610, 4, { right: true });
    waitForGuard(r, 'B1-5', { right: true });
    r.grade(1); r.skill(); landRight(r); r.world();
    r.wait(0.8); r.grade(-1); r.world();
    r.until(g => g.body.x >= 790, 2, { right: true });
    r.tick({ jumpPressed: true, jump: true, right: true }); r.until(g => g.body.x >= 1250, 4, { right: true, jump: true });
    r.grade(1); r.world(); r.until(g => g.body.grounded && g.body.y > 600, 3);
    r.finish({ left: true }, 4);
  },
};
