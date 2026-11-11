#!/bin/zsh
# How handoff/audio-candidates/sfx was made. S was a scratch folder holding the unpacked sources listed in
# handoff/audio-candidates/SOURCES.md; point S, K, DR and FA at your own copies to run it again.
# Real CC0 recordings (Kenney packs, qubodup's bottle set, "Gastric Distress"), roughened a little toward pixel:
# down to 16 kHz and back, light log bit-crush mixed in, then levelled. Output: sfx/<event>-<n>.mp3
S=/private/tmp/claude-501/-Users-chrissu-Library-Application-Support-Claude-scratch-workspaces-76374db5-963e-4128-ac2c-dc6441f32964-25715e33-67dd-49ee-9c59-0a0a8be02726-scratch-2026-11-04-c607f6/7bcb32a5-9c69-4758-933c-5a833a241577/scratchpad
K=$S/kenney; IM=$K/impact-sounds/Audio; RPG=$K/rpg-audio/Audio; UI=$K/interface-sounds/Audio
DR=$S/oga/drink/x/qubodup-bottle-and-drink-sounds; FA=$S/oga/fart/gastricdistress.wav
OUT=$S/sfx; mkdir -p "$OUT"
PIX="aresample=16000,aresample=44100,acrusher=bits=9:mix=0.3:mode=log:aa=0.6,highpass=f=70"
one() {   # one <name> <gain dB> <ffmpeg input args...>
  local name=$1 gain=$2; shift 2
  ffmpeg -loglevel error -y "$@" -af "$PIX,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,afade=t=in:d=0.02,areverse,loudnorm=I=-18:TP=-1.5:LRA=11,volume=${gain}dB" -ac 1 -ar 44100 -b:a 80k "$OUT/$name.mp3"
}
one jump-1 -10 -i $RPG/cloth1.ogg
one jump-2 -10 -i $RPG/cloth2.ogg
one land-1 -6 -i $IM/footstep_carpet_000.ogg
one land-2 -6 -i $IM/footstep_carpet_002.ogg
one bounce-1 -2 -i $IM/impactSoft_heavy_000.ogg
one warp-1 -4 -i $UI/maximize_006.ogg
one recall-1 -4 -i $UI/minimize_006.ogg
one tick-1 -10 -i $UI/tick_002.ogg
one warn-1 -8 -i $UI/tick_004.ogg
one ready-1 -4 -i $UI/select_006.ogg
one reveal-1 -2 -i $UI/confirmation_002.ogg
one deny-1 -6 -i $UI/error_006.ogg
one cap-1 -2 -i $RPG/handleCoins.ogg
one break-1 -2 -i $IM/impactGlass_heavy_002.ogg
one break-2 -2 -i $IM/impactGlass_heavy_004.ogg
one knock-1 0 -i $IM/impactPunch_heavy_001.ogg
one die-1 0 -i $IM/impactPunch_heavy_003.ogg
one crash-1 0 -i $IM/impactMetal_heavy_002.ogg
one crumble-1 -4 -i $IM/impactPlank_medium_001.ogg
one lift-1 -6 -i $RPG/metalLatch.ogg
one throw-1 -6 -i $RPG/cloth4.ogg
one stageUp-1 -4 -i $UI/glass_004.ogg
one stageDown-1 -6 -i $UI/glass_001.ogg
one gulp-1 -4 -i $DR/swallow-01.flac
one gulp-2 -4 -i $DR/swallow-03.flac
one fart-1 0 -ss 8.40 -to 8.85 -i $FA
one fart-2 0 -ss 10.37 -to 10.93 -i $FA
one fart-3 0 -ss 19.45 -to 19.80 -i $FA
one bigfart-1 2 -ss 0.04 -to 1.26 -i $FA
# drink: the cap comes off, then a swallow
ffmpeg -loglevel error -y -i $DR/bottle-open-02.flac -i $DR/swallow-02.flac -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1" "$S/drink-raw.wav"
one drink-1 -4 -i "$S/drink-raw.wav"
ls "$OUT" | wc -l
