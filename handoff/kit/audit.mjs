// node audit.mjs <campaign.json> [roomId ...]  — solvability per room under restricted verbs.
//   bare: walk+jump only · fart: + K · j: + J (no fart) · full: everything · caps: everything + all caps
import { readFileSync } from 'node:fs';
import { solve, compress } from './dsim.mjs';
const [file, ...only] = process.argv.slice(2);
const data = JSON.parse(readFileSync(file, 'utf8'));
for (const map of data.maps) for (const room of map.rooms) {
  if (only.length && !only.includes(room.id)) continue;
  const cfg = { bare: { fart: false, skill: false }, fart: { skill: false }, j: { fart: false }, full: {}, caps: { caps: true } };
  const out = {};
  for (const [name, o] of Object.entries(cfg)) {
    const r = solve(room, map.cells, { maxT: 14, ...o });
    out[name] = r.ok ? `OK ${r.t}s J=${r.j} K=${r.farts} drinks=${r.drinks} caps=${r.caps} :: ${compress(r.plan)}` : `NO (${r.reason})`;
  }
  console.log(`== ${room.id} ${room.name || ''} (cells ${map.cells}, booze ${room.booze ?? 'carry'})`);
  for (const [k, v] of Object.entries(out)) console.log(`  ${k.padEnd(5)} ${v}`);
}
