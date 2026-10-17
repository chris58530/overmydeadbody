# 醉隱 (Over My Dead Body) — drunk-mode design brief

Single-screen rooms, 2D platformer, HTML5 canvas. Game file (read-only for you):
`C:/Users/user/Documents/DrunkenRoomStudio/prototype/game.html` (engine = first `<script>`).

## Story & character logic
Jim, an exhausted office worker, gets drunk after work and discovers that when drunk a "drunk shadow" (醉影,
a purple wrestler-like hallucination of himself) appears and helps him get home. So he manages how drunk he is.
Drunker = the shadow can do more, but his hallucinations make the world more dangerous. Farting lets alcohol out
(small movement bursts) and sobers him up. Tone: deadpan office-worker comedy. Seven days to get home; days 1-3 now.

## The one resource: booze gauge (cells)
- A day has `cells` = 1, 2 or 3 (day 1 = 1, day 2 = 2, day 3 = 3). Gauge value `booze` is 0..cells, float.
- Drinks (`D` tile, a beer bottle) add +1.0 (capped). A bottle cannot be picked up while the gauge is full (it stays).
- **K = fart**: tap only (no hold), 0.14 s cooldown, costs 1/6 cell (6 puffs per cell).
  - holding A or D (and not W): a forward burst (vx = 560 forward, tiny lift) — "nitro"
  - nothing or W held: an upward puff (vy = -300) — Flappy-Bird style, keep tapping to stay up
  - usable on the ground, in the air, and while flying after a throw. Not while carried by the shadow.
- **J = the drunk shadow**, needs a full cell, spends exactly 1.0. The move depends on how many FULL cells remain
  (the gauge drains from the right; the leftmost cell is always the throw):
  - 3 full: **升天** — Jim's own giant fart: straight up ~9 tiles, breaks crates (B, C) overhead
  - 2 full: **衝** — the shadow shoulders Jim and charges horizontally ~700 px/s for 1 s (~17 tiles), smashing
    crates B/C, knocking guards R, walking over glass ^; flies flat 0.5 s if started in the air; hitting a wall bounces.
    W during a ground charge = leap off keeping speed. J during the charge = cut straight to the throw.
  - 1 full: **丟** — the shadow lifts and throws Jim: normal arc (~17 tiles far, ~8 high), W held = high arc
    (~10 tiles up), S held = low fast (~15 far, ~4 high). A/D steer in flight.
  - So with 3 cells, pressing J three times chains 升天 → 衝 → 丟; with 2 cells 衝 → 丟; with 1 cell 丟.
  - Farting eats into the rightmost cell, so a fart can cost you the move that cell would have given.
- **Drunk stage = number of FULL cells.** Each stage can change the map (cumulative overlays, see JSON).
  When the full-cell count changes, the change is announced ~0.9 s ahead (gauge/tiles blink); it lands only when Jim
  is standing on the ground. Farting the cell below full during the warning cancels it. Spending a cell with J
  sobers Jim up one stage (the map reverts on landing).
- Death resets the room (tiles, drinks, booze back to the room's start).

Measured reach (tiles of 40 px): run-jump 2.8 high / 5.4 far · fart up, 1 cell: 3.3 high (6.2 with a jump first) ·
fart dash, 1 cell, after a jump: ~13 far · 丟 mid 16.7 far / 7.8 high · 丟 high 10 up · 丟 low 14.6 far / 3.8 high ·
衝 ~17-22 far · 升天 ~9 up · 升天→衝→丟 ~14 up.
Body is 44x72 px (just over 1 x 2 tiles). Room is 32 x 18 tiles (1280 x 720). Bottom rows are usually ground.

## Room JSON (drunken-rooms v2)
```json
{ "format": "drunken-rooms", "version": 2, "maps": [ {
  "id": "day-1", "name": "第一天", "intro": "...", "outro": "...", "cells": 1, "abilities": ["wrestler"],
  "rooms": [ { "id": "1-1", "name": "工位", "theme": "office", "booze": 0,
      "tiles": [ 18 strings x 32 chars ],
      "stages": { "1": [ 18 strings x 32 chars ] },
      "exits": { "right": "1-2" }, "lines": ["short line", "line naming a key like K"] } ] } ] }
```
- tiles: `.` empty `#` ground `^` broken glass (deadly) `=` plank (one-way, stand on top) `B` crate (charge / 升天 break)
  `C` crumbling boxes (fall 0.45 s after you stand on them, come back later) `<` `>` conveyor `R` patrol (chair indoors,
  guard on street; touching kills; a charge knocks it away) `L` falling sign/tube (drops when you pass under) `*` bottle cap
  (optional collectible) `D` drink `P` spawn (exactly one) `N` NPC (avoid for now) `O` portal (avoid).
- stages: overlays per stage "1","2","3" (only up to the day's cells). Chars: `.` = keep what is below, `_` = clear to
  empty, or one of `#^=BC<>` to replace. Stage 2 applies overlay 1 then 2, etc. No entities in overlays.
- booze: the gauge at room start (always set it; rooms are self-contained puzzles).
- exits: sides `right`/`left`/`top`/`bottom` → next room id, or null = end of day. The room is left by walking off
  that screen edge (top: fly above y < 0). Edges without an exit are walls (bottom without exit = death pit).
- theme: `office`, `pantry`, `elevator`, `lobby` (indoor, day 1) or `street` (outdoor). Indoor glass = broken mugs, R = office chair.
- lines: 1-2 short Chinese lines Jim says on entering (deadpan humour). A line containing a capital key letter
  (J, K, W, S) also stays at the bottom of the screen as the room's hint — use it to teach the room's new idea.

## What makes a good room here
- One question per room ("Should I drink now?", "Fart, or keep the cell for the throw?", "Which stage do I need?").
- The newest verb is required: check with the audit that `bare` fails, and the room's lesson verb is needed.
- Hallucinations follow the logic: stage overlays add tempting help (floating ground, planks) AND danger
  (glass, conveyors, crates in the way). Higher stage = more danger. Make the danger readable, never a surprise kill.
- Character logic: drinks sit where drinks would be (party leftovers, pantry fridge, vending machine, bar, 7-11).
- Teach before testing: first room of a day introduces its new cell safely; last room combines.
- Difficulty should rise; the player should have to think AND execute (tap rhythm, timing a J mid-air).
- Caps `*` are optional harder lines (extra precision or a smarter plan), one per room.
- Do not make rooms solvable by one J press from the spawn. Aim for 4-10 s rooms.

## Tools (node 24, run from this kit folder)
- `node audit.mjs <file.json> [roomId...]` — beam-search solver per room under: bare (walk+jump), fart (+K), j (+J, no K),
  full, caps (full + every cap). Prints time, J count, K count, drinks, and the found plan. ~1-3 min per room.
  `NO` means the search found nothing in 14 s (strong evidence, not proof).
- `node play.mjs <file.json> <roomId> "<plan>" [every]` — replays a plan, prints ASCII frames and events.
  Plan = 0.1 s actions: N R L RJ LJ NJ (jump press) RH LH NH (hold W) RD ND (hold S) NF RF LF RUF LUF (fart, with held
  dir / W) S RS LS US RUS RDS (J with held dir / W / S). `RFx3` repeats.
- `measure.mjs` shows how the reach numbers above were measured.
