// node realtime.mjs <out.wav> <seconds> <bpm> <prompt>  → records Lyria RealTime (48 kHz stereo PCM) to a wav
// The two loops in prototype/art/audio were made with:
//   node realtime.mjs sober-raw.wav 84 85 'Instrumental lo-fi jazz hop loop for a cozy pixel-art puzzle game: an empty office and city street late at night, purple-blue moonlight, warm desk lamps. Mellow, sleepy, playful sneaking. Soft Rhodes electric piano, upright bass, brushed drums, light vinyl crackle, small chiptune bell accents. Steady and even, no build-ups.'
//   node realtime.mjs drunk-raw.wav 84 85 'Instrumental drunken lounge jazz loop for a cozy pixel-art puzzle game, the same late-night office but the world is swaying and dreamy. Woozy detuned Rhodes with heavy chorus and tape wobble, warbly muted trumpet, wah-wah bass, lazy swung brushed drums, hazy reverb, giggly playful mood. Steady and even, no build-ups.'
//   python3 loop.py sober-raw.wav sober-loop.wav 85 24     (and the same for drunk)
//   ffmpeg -i sober-loop.wav -af loudnorm=I=-20:TP=-2:LRA=11 -ar 44100 -b:a 96k bgm-sober.mp3
//   ffmpeg -i drunk-loop.wav -af "vibrato=f=0.49764:d=0.06,aecho=0.8:0.7:60:0.25,loudnorm=I=-20:TP=-2:LRA=11" -ar 44100 -b:a 96k bgm-drunk.mp3
//   (the wobble's rate is a whole number of cycles over the loop, so the seam stays smooth)
import { readFileSync, writeFileSync } from 'node:fs';
const key = readFileSync(new URL('../../../.env', import.meta.url), 'utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim();
const [out, seconds, bpm, prompt] = process.argv.slice(2);
const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateMusic?key=${key}`);
const chunks = []; let bytes = 0, rate = 48000, ch = 2;
const need = () => +seconds * rate * ch * 2;
const done = () => {
  ws.close();
  const pcm = Buffer.concat(chunks).subarray(0, need()), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * ch * 2, 28); h.writeUInt16LE(ch * 2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  writeFileSync(out, Buffer.concat([h, pcm])); console.log(out, (pcm.length / rate / ch / 2).toFixed(1) + 's'); process.exit(0);
};
setTimeout(() => { console.error('timeout, got', (bytes / rate / ch / 2).toFixed(1), 's'); if (bytes) done(); else process.exit(1); }, (+seconds * 3 + 60) * 1000);
ws.onopen = () => ws.send(JSON.stringify({ setup: { model: 'models/lyria-realtime-exp' } }));
ws.onerror = e => { console.error('ws error', e.message ?? e); };
ws.onclose = e => { if (bytes < need()) { console.error('closed', e.code, e.reason); process.exit(1); } };
ws.onmessage = async ev => {
  const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(await ev.data.arrayBuffer()).toString());
  if (msg.setupComplete) {
    ws.send(JSON.stringify({ clientContent: { weightedPrompts: [{ text: prompt, weight: 1 }] } }));
    ws.send(JSON.stringify({ musicGenerationConfig: { bpm: +bpm, temperature: 1.0, guidance: 4.0 } }));
    ws.send(JSON.stringify({ playbackControl: 'PLAY' }));
    return;
  }
  for (const c of msg.serverContent?.audioChunks ?? []) {
    const m = c.mimeType?.match(/rate=(\d+)/); if (m) rate = +m[1]; const n = c.mimeType?.match(/channels=(\d+)/); if (n) ch = +n[1];
    const b = Buffer.from(c.data, 'base64'); chunks.push(b); bytes += b.length;
    if (bytes >= need()) done();
  }
  if (msg.filteredPrompt || msg.warning || msg.error) console.error(JSON.stringify(msg).slice(0, 300));
};
