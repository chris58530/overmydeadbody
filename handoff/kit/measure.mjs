import { makeGame, ACTIONS } from './dsim.mjs';
const rows = Array.from({ length: 18 }, (_, y) => y === 17 ? '#'.repeat(32) : '.'.repeat(32)); rows[16] = '##' + '.'.repeat(30); rows[15] = '.P' + '.'.repeat(30);
const room = { tiles: rows, exits: { right: null } };
function m(name, cells, booze, inp, dur = 3) {
  const g = makeGame({ ...room, booze }, cells); const x0 = g.body.x, y0 = g.body.y; let minY = y0, xAtGround = null;
  for (let f = 0; f < dur * 240; f++) { g.step(1 / 240, inp(f / 240, g) || {}); g.events.length = 0; minY = Math.min(minY, g.body.y); if (xAtGround === null && f > 30 && g.body.y > y0 + 1) xAtGround = g.body.x; }
  console.log(name.padEnd(34), 'rise', ((y0 - minY) / 40).toFixed(1) + ' tiles', ' dist at start height', xAtGround === null ? '-' : ((xAtGround - x0) / 40).toFixed(1) + ' tiles', ' booze left', g.booze.toFixed(2));
}
const at = (t, a) => t >= a && t < a + 1 / 240;
m('run-jump (held)', 1, 0, t => ({ right: true, jump: true, jumpPressed: at(t, 0) }));
m('J 丟 mid (1 cell)', 1, 1, t => ({ right: true, skill: at(t, 0) ? 'wrestler' : 0 }));
m('J 丟 W high', 1, 1, t => ({ right: true, jump: true, skill: at(t, 0) ? 'wrestler' : 0 }));
m('J 丟 S low', 1, 1, t => ({ right: true, down: true, skill: at(t, 0) ? 'wrestler' : 0 }));
m('fart up tap 0.15s', 1, 1, t => ({ kPressed: Math.abs(t % 0.15) < 1 / 240 }));
m('jump + up-fart drift (W held)', 1, 1, t => ({ right: true, jump: true, jumpPressed: at(t, 0), kPressed: t > 0.2 && Math.abs(t % 0.15) < 1 / 240 }));
m('jump + fart dash (no W) x10', 1, 1, t => ({ right: true, jump: t < 0.3, jumpPressed: at(t, 0), kPressed: t > 0.2 && Math.abs(t % 0.15) < 1 / 240 }), 3);
m('2 cells: J (衝) then J (丟)', 2, 2, t => ({ right: true, skill: at(t, 0) || at(t, 0.9) ? 'wrestler' : 0 }));
m('2 cells: J 衝 only', 2, 2, t => ({ right: true, skill: at(t, 0) ? 'wrestler' : 0 }));
m('3 cells: J 升天 only', 3, 3, t => ({ skill: at(t, 0) ? 'wrestler' : 0 }));
m('3 cells: 升天, 衝 at .5, 丟 at 1.4', 3, 3, t => ({ right: true, skill: at(t, 0) || at(t, 0.5) || at(t, 1.4) ? 'wrestler' : 0 }), 4);
