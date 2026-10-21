import * as day1 from './chill-day1.mjs';
import * as day2 from './chill-day2.mjs';
import * as day3 from './chill-day3.mjs';

// Route plans per room id. Plans may read the simulation but act only through normal inputs.
export const plans = { ...day1.plans, ...day2.plans, ...day3.plans };
// Routes that collect each room's bottle cap; they need not reach the door.
export const capPlans = { ...day1.capPlans, ...day2.capPlans, ...day3.capPlans };
