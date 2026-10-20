import { plans as day1 } from './chill-day1.mjs';
import { plans as day2 } from './chill-day2.mjs';
import { plans as day3 } from './chill-day3.mjs';

// Route plans per room id. Plans may read the simulation but act only through normal inputs.
export const plans = { ...day1, ...day2, ...day3 };
