// node listen.mjs <file...>  → what Gemini hears in each clip, with timestamps
import { readFileSync } from 'node:fs';
const key = readFileSync(new URL('../../../.env', import.meta.url), 'utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim();
const ask = process.env.ASK ?? 'Describe exactly what is audible in this clip, with timestamps (mm:ss.s). List every word spoken (if any) verbatim, and every non-verbal vocal sound. Be brief.';
await Promise.all(process.argv.slice(2).map(async file => {
  const mime = file.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: mime, data: readFileSync(file).toString('base64') } }, { text: ask }] }] }),
  });
  const d = await res.json();
  console.log(`== ${file}\n${d.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? JSON.stringify(d).slice(0, 300)}`);
}));
