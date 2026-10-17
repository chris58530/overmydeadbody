// node play.mjs <campaign.json> <roomId> "<plan>" [every=0.5]
// Plays 0.1 s actions (see ACTIONS in dsim.mjs, e.g. "Rx5 RJ NFx3 S") at 240 Hz and prints ASCII snapshots.
// Legend: @ Jim  # ground  h hallucinated ground  , hallucinated hole  = plank  ^ glass  B crate  C crumbling box  < > conveyor  D drink  * cap  R guard/chair  L falling sign
import { readFileSync } from 'node:fs';
import { makeGame, ACTIONS, expand, ascii } from './dsim.mjs';
const [file, id, route, every = '0.5'] = process.argv.slice(2);
const data = JSON.parse(readFileSync(file, 'utf8'));
const map = data.maps.find(m => m.rooms.some(r => r.id === id)), room = map.rooms.find(r => r.id === id);
const g = makeGame(room, map.cells), plan = expand(route || 'N');
const snap = Math.round(+every * 240);
for (let frame = 0; frame < (plan.length + 20) * 24; frame++) {
  const i = Math.floor(frame / 24), [first, hold] = ACTIONS[plan[Math.min(i, plan.length - 1)]];
  g.step(1 / 240, frame % 24 === 0 ? { ...hold, ...first } : hold);
  const ev = g.events.filter(e => !['land', 'jump'].includes(e)); g.particles.length = 0; g.events.length = 0;
  if (ev.length) console.log(`t=${(frame / 240).toFixed(2)} events: ${ev.join(',')}  booze=${g.booze.toFixed(2)} stage=${g.stage}${g.stageWarn ? ' warn->' + g.stageWarn.to : ''}`);
  for (const b of g.bubbles) if (!b._shown) { b._shown = 1; }
  if (frame % snap === 0 || g.phase !== 'play' || g.state === 'dead') {
    console.log(`--- t=${(frame / 240).toFixed(2)} state=${g.state} x=${Math.round(g.body.x)} y=${Math.round(g.body.y)} booze=${g.booze.toFixed(2)} stage=${g.stage}`);
    console.log(ascii(g));
  }
  if (g.phase !== 'play') { console.log('RESULT: cleared', g.roomCaps.length ? `(cap x${g.roomCaps.length})` : ''); break; }
  if (g.state === 'dead') { console.log('RESULT: died at', Math.round(g.body.x), Math.round(g.body.y)); break; }
  if (frame === (plan.length + 20) * 24 - 1) console.log('RESULT: still in room');
}
