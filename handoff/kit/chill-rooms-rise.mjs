import { room, rect } from './chill-room-tools.mjs';

export const rooms = [
  // The cardboard delivery and the shutter are separate obstacles: grade two
  // breaks the first while the grade-one world keeps the shutter open briefly.
  room('chill-4', '末班貨梯', 'office', 1,
    ['貨還沒送完，鐵門倒是準時下班。'],
    g => {
      rect(g, 'P', 2, 15);
      rect(g, 'B', 7, 0, 7, 15);
      rect(g, '#', 24, 8, 31, 15);
      rect(g, '*', 20, 5);
      rect(g, 'O', 30, 7);
    }, {
      2: g => rect(g, '#', 12, 0, 12, 15),
      3: g => rect(g, '#', 12, 0, 12, 15),
    }),

  // The awning closes the entire low road at grade three. Leave the old open
  // sky first; the new balcony catches the long, complete third-grade flight.
  room('chill-5', '月台上的月亮', 'street', 2,
    ['末班車沒等人，月亮還在月台上。'],
    g => {
      rect(g, 'P', 2, 15);
      rect(g, '*', 21, 2);
      rect(g, 'O', 30, 7);
    }, {
      1: g => rect(g, '#', 27, 0, 27, 15),
      2: g => rect(g, '#', 27, 0, 27, 15),
      3: g => {
        rect(g, '_', 27, 0, 27, 15);
        rect(g, '#', 0, 9, 21, 9);
        rect(g, '#', 22, 8, 31, 15);
      },
    }),
];

export const plans = {
  'chill-4': r => {
    r.grade(1);
    r.skill();
    r.finish();
  },
  'chill-5': r => {
    r.grade(1);
    r.wait(1.25);
    r.skill();
    r.finish();
  },
};
