// node gen-voices.mjs [only...]  → raw/<name>.wav, checked by ear (Gemini), trimmed and levelled into out/<name>.mp3
// Run it from a scratch folder, listen, then copy out/*.mp3 to prototype/art/audio. With no names it makes only the missing ones.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const key = readFileSync(new URL('../../../.env', import.meta.url), 'utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim();
const sleep = s => new Promise(r => setTimeout(r, s * 1000));
// free tier: a few requests a minute, so wait out each short 429; a model out for the day hands over to the next TTS model
const CHAIN = {
  tts: ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-2.5-flash-preview-tts'],
  ear: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'],
};
const spent = new Set();
const api = async (chain, body) => {
  for (;;) {
    const use = CHAIN[chain].find(m => !spent.has(m));
    if (!use) return { error: { message: `every ${chain} model is out for the day` } };
    const d = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${use}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) })
      .then(r => r.json()).catch(e => ({ error: { code: 'timeout', message: `${use}: ${e.message}` } }));   // a hung call counts as a failed one
    if (d.error?.code !== 429) { d.model = use; return d; }
    const wait = parseFloat(d.error.details?.find(x => x.retryDelay)?.retryDelay ?? '30');
    if (wait > 120 || /per day/.test(d.error.message)) { spent.add(use); console.log(use, 'out for the day'); continue; }
    await sleep(wait + 2);
  }
};
const JIM = 'Algenib', GUARD = 'Fenrir';
const LINES = {
  'jim-drink-1': [JIM, 'Say like a tired man gulping down a drink, then sighing with relief: [gulping] Ahhh~'],
  'jim-drink-2': [JIM, 'Say like a tipsy man taking a big swig, then a pleased grunt: [glug glug] Mmh!'],
  'jim-hic-1': [JIM, 'Say drunkenly, as one sharp hiccup: Hic!'],
  'jim-hic-2': [JIM, 'Say like a drunk man hiccuping, then a tiny giggle: Hic! Heh.'],
  'jim-chuckle-1': [JIM, 'Say with a sly, embarrassed little chuckle: Heh heh.'],
  'jim-chuckle-2': [JIM, 'Say like a cheeky tipsy man snickering to himself: Hehehe.'],
  'jim-relief': [JIM, 'Say with a long, deeply relieved exhale: Phewww~'],
  'jim-whoa': [JIM, 'Say dreamily, as if floating out of his own body, surprised: Whoooa~'],
  'jim-hmm': [JIM, 'Say lazily, a quick grumbling acknowledgment: Mm-hm.'],
  'jim-tsk': [JIM, 'Say annoyed, a short grunt: Nngh.'],
  'jim-ouch-1': [JIM, 'Say in pained surprise, short and sharp: Oof!'],
  'jim-ouch-2': [JIM, 'Say like a man who just got squashed, comically: Ugh—!'],
  'jim-sigh': [JIM, 'Say like a man sobering up, a disappointed sigh: Haaah...'],
  'jim-yawn': [JIM, 'Say like a sleepy man stretching and yawning: Hnnngh... aaah.'],
  'jim-hum': [JIM, 'Hum drunkenly and happily with mouth closed, a short wobbly tune: Hmm hm hmm~ hm hm hmmm~'],
  'guard-yelp-1': [GUARD, 'Say in startled panic while falling: Waaah—!'],
  'guard-yelp-2': [GUARD, 'Say like a security guard tripping over, yelping: Whoa-oh—!'],
  'guard-hey': [GUARD, 'Shout sternly, like a night security guard catching someone: Hey!'],
};
const EAR = 'This clip should contain only a short non-verbal vocal sound (like hic, heh, ahh, whoa, phew, hmm, oof, waah, hey). ' +
  'Reply with JSON only: {"words": [every intelligible word spoken that is NOT such a vocal sound, e.g. instructions read aloud], "start": seconds where the wanted vocal sound begins, "end": seconds where it ends}.';
mkdirSync('raw', { recursive: true }); mkdirSync('out', { recursive: true });
const only = process.argv.slice(2);
const run = async name => {
  const [voice, prompt] = LINES[name];
  for (let attempt = 1; attempt <= 4; attempt++) {
    let wav, d = { model: 'earlier take' };
    if (attempt === 1 && existsSync(`raw/${name}.wav`)) wav = readFileSync(`raw/${name}.wav`);   // a take made but never checked
    else {
      d = await api('tts', { contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
      const part = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part) { console.log(name, 'no audio', JSON.stringify(d).slice(0, 160)); if (d.error && !d.error.code) return; continue; }
      wav = Buffer.from(part.inlineData.data, 'base64');
      if (wav.toString('ascii', 0, 4) !== 'RIFF') {   // the 2.5 model sends bare 24 kHz PCM
        const h = Buffer.alloc(44);
        h.write('RIFF', 0); h.writeUInt32LE(36 + wav.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
        h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(wav.length, 40);
        wav = Buffer.concat([h, wav]);
      }
      writeFileSync(`raw/${name}.wav`, wav);
    }
    let v;
    for (let ear = 0; ear < 3 && !v; ear++) {   // a failed listen is listened again, not spoken again: speech is the scarce quota
      const heard = await api('ear', { contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: wav.toString('base64') } }, { text: EAR }] }],
        generationConfig: { responseMimeType: 'application/json' } });
      try { v = JSON.parse(heard.candidates[0].content.parts[0].text); } catch { console.log(name, 'ear failed', heard.error?.message?.slice(0, 80) ?? ''); }
    }
    if (!v) { console.log(name, 'FAILED (no ear)'); return; }
    if (v.words?.length || !(v.end > v.start)) { console.log(name, `try ${attempt}: heard words`, JSON.stringify(v.words)); continue; }
    const from = Math.max(0, v.start - 0.12), len = v.end - from + 0.25;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(from), '-t', String(len), '-i', `raw/${name}.wav`, '-af',
      'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.01,areverse,afade=t=in:d=0.005,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ar', '24000', '-ac', '1', '-b:a', '64k', `out/${name}.mp3`]);
    const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `out/${name}.mp3`]).toString().trim();
    console.log(name, `ok (try ${attempt}, ${d.model})`, (+dur).toFixed(2) + 's'); return;
  }
  console.log(name, 'FAILED');
};
const names = Object.keys(LINES).filter(n => (!only.length || only.includes(n)) && (only.length || !existsSync(`out/${n}.mp3`)));
for (const n of names) await run(n);
