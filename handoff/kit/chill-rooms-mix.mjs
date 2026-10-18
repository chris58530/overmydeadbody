import { room, rect } from './chill-room-tools.mjs';

export const rooms = [
  // A small throw fits below the shop awning. The shoulder-carry does not.
  // Keep the second-grade scaffold for long enough to leave it at grade one.
  room('chill-6', '便利店的雨棚', 'pantry', 2,
    ['雨停了，店門口的貓還在睡。', '借過一下，我們快到家了。'],
    g => {
      rect(g, 'P', 2, 15);
      rect(g, '#', 17, 1, 25, 2);
      rect(g, '#', 22, 6, 22, 15);
      rect(g, '#', 23, 7, 31, 15);
      rect(g, '*', 24, 5);
      rect(g, 'O', 30, 6);
    }, {
      2: g => {
        rect(g, '#', 4, 14, 6, 15);
        rect(g, '#', 7, 12, 9, 15);
        rect(g, '#', 10, 10, 12, 15);
        rect(g, '#', 13, 8, 15, 15);
        rect(g, '#', 16, 6, 18, 15);
        rect(g, '#', 27, 3, 27, 6);
      },
    }),

  // Cross the closing stairwell before the third-grade world arrives. The
  // full ascend/charge/throw lands on a permanent terrace, with time to rest.
  // The second switch opens the front gate; a second-grade shoulder carry
  // may begin while its old bridge is still present, or after it disappears.
  room('chill-7', '家門口的天橋', 'street', 2,
    ['熟悉的窗戶，今晚好像又高了一點。', '先歇口氣，鑰匙應該還在口袋裡。'],
    g => {
      rect(g, 'P', 2, 15);
      rect(g, '#', 13, 8, 13, 15);
      rect(g, '#', 18, 9, 25, 15);
      rect(g, '#', 29, 5, 31, 15);
      rect(g, '*', 22, 6);
      rect(g, 'O', 31, 4);
    }, {
      2: g => {
        rect(g, '#', 4, 14, 6, 15);
        rect(g, '#', 7, 12, 9, 15);
      },
      3: g => {
        rect(g, '#', 13, 0, 13, 7);
        rect(g, '#', 26, 9, 28, 15);
        rect(g, '#', 28, 0, 28, 4);
      },
    }),
];

export const plans = {
  'chill-6': r => {
    for (const [x, y] of [[200, 560], [320, 480], [440, 400], [560, 320], [680, 240], [740, 240]]) r.stair(x, y);
    r.grade(-1);
    r.skill();
    r.finish();
  },
  'chill-7': r => {
    r.stair(200, 560);
    r.grade(1);
    r.skill();
    r.until(g => g.body.x >= 810, 4, { right: true });
    r.until(g => g.body.grounded, 5, { left: true });
    r.land();
    r.world();
    r.stair(920, 360);
    r.wait(3);
    r.grade(-1);
    r.until(g => !g.stageWarn || g.stageWarn.t <= 0.3, 3);
    r.skill();
    r.finish();
  },
};
