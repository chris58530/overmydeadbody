# python3 loop.py in.wav out.wav bpm bars  -> a seamless loop: the cut point that best matches the start, then a crossfade
import sys, wave, numpy as np
src, dst, bpm, bars = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
w = wave.open(src); sr, ch = w.getframerate(), w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, ch).astype(np.float32)
start = int(6 * sr)                                   # skip the warm-up
want = int(bars * 4 * 60 / bpm * sr)
mono = x.mean(1)
hop = 512
env = np.sqrt(np.convolve(mono ** 2, np.ones(hop) / hop, 'same')[::hop])
head = env[start // hop: start // hop + int(4 * sr / hop)]  # the first 4 s, by loudness envelope
best, bestL = -1, want
for L in range(want - sr, want + sr, hop):            # search +-1 s around the bar length
    i = (start + L) // hop
    seg = env[i:i + len(head)]
    if len(seg) < len(head) or start + L + 2 * sr > len(mono): continue
    c = np.corrcoef(seg, head)[0, 1]
    if c > best: best, bestL = c, L
fade = int(2 * sr)
loop = x[start:start + bestL].copy()
tail = x[start + bestL:start + bestL + fade]
r = np.linspace(0, 1, fade)[:, None]
loop[:fade] = loop[:fade] * np.sqrt(r) + tail * np.sqrt(1 - r)  # equal-power crossfade of the overrun into the head
o = wave.open(dst, 'wb'); o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
o.writeframes(np.clip(loop, -32768, 32767).astype(np.int16).tobytes())
print(dst, f'{bestL / sr:.2f}s (bar length {want / sr:.2f}s), match {best:.3f}')
