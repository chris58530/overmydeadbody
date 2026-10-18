import { plans as risePlans } from './chill-rooms-rise.mjs';
import { plans as mixPlans } from './chill-rooms-mix.mjs';

export const plans = {
  'chill-1': r => { r.skill(); r.finish(); },
  'chill-2': r => {
    for (const [x, y] of [[200, 560], [320, 480], [440, 400], [560, 320], [680, 240], [740, 240]]) r.stair(x, y);
    r.grade(-1); r.finish();
  },
  'chill-3': r => {
    for (const [x, y] of [[200, 560], [320, 480], [440, 400]]) r.stair(x, y);
    r.grade(-1); r.skill(); r.finish();
  },
  ...risePlans,
  ...mixPlans,
};
