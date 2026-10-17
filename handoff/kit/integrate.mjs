// node handoff/kit/integrate.mjs — validate and ship days.json; preserve the previous J/L campaign once.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { D } from './dsim.mjs';
const P = new URL('../../prototype/game.html', import.meta.url);
const camp = JSON.parse(readFileSync(new URL('days.json', import.meta.url), 'utf8'));
const { maps } = camp;
D.parseCampaign(JSON.stringify(camp));
let h = readFileSync(P, 'utf8');
const a = h.indexOf('  root.DEFAULT_CAMPAIGN = '), b = h.indexOf('\n})(typeof window', a);
if (a < 0 || b < 0) throw new Error('DEFAULT_CAMPAIGN boundary missing');
const old = JSON.parse(h.slice(a + '  root.DEFAULT_CAMPAIGN = '.length, b).trim().replace(/;$/, ''));
const legacy = new URL('../../prototype/legacy-jl-days.json', import.meta.url);
if (!existsSync(legacy) && old.maps.every(m => !m.cells)) writeFileSync(legacy, JSON.stringify(old, null, 2) + '\n');
const body = JSON.stringify(camp, null, 2).split('\n').map((l, i) => i ? '  ' + l : l).join('\n');
h = h.slice(0, a) + '  root.DEFAULT_CAMPAIGN = ' + body + ';' + h.slice(b);
writeFileSync(P, h);
console.log('integrated', maps.map(m => `${m.id}:${m.rooms.length}`).join(' '));
