// node qa.mjs <file> <roomId> <mode>  mode: full | bare | fart | j | caps
import { readFileSync } from 'node:fs';
import { solve, compress } from './dsim.mjs';
const [file, id, mode] = process.argv.slice(2);
const data = JSON.parse(readFileSync(file, 'utf8'));
const map = data.maps.find(m => m.rooms.some(r => r.id === id)), room = map.rooms.find(r => r.id === id);
const o = { bare: { fart: false, skill: false }, fart: { skill: false }, j: { fart: false }, full: {}, caps: { caps: true } }[mode];
const r = solve(room, map.cells, { maxT: 12, beam: 1500, limit: 3000000, ...o });
console.log(`${id} ${mode.padEnd(4)} ` + (r.ok ? `OK ${r.t}s J=${r.j} K=${r.farts} caps=${r.caps} :: ${compress(r.plan)}` : `NO (${r.reason} ${r.expanded})`));
