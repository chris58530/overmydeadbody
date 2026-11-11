# 第二版聲音（候選，還沒接進遊戲）

使用者 2026-11-11 聽過：配樂 A、B、C 都可以，音效也可以。

## 配樂候選（Gemini `lyria-realtime-exp`，純音樂）
- `配樂候選A-大鍵琴小提琴.mp3`：偷溜小樂團，撥弦、單簧管、低音提琴（100 BPM）
- `配樂候選B-電子偷溜.mp3`：偷溜爵士小樂團的提示，生成結果偏電子（92 BPM）
- `配樂候選C-撥弦童話.mp3`：撥弦、豎琴、低音號、雙簧管（108 BPM）
- 提示詞寫在 `handoff/kit/audio/realtime.mjs` 同一套流程，這三首各錄 50 秒、剪成 40 秒試聽，還沒剪成循環。

## 音效（`sfx/`，真實錄音，全部 CC0）
- Kenney：Impact Sounds、RPG Audio、Interface Sounds（kenney.nl，CC0）
- qubodup：Liquid Bottle Drink Set（opengameart.org/content/liquid-bottle-drink-set，CC0）→ 喝酒、吞嚥
- Gastric Distress（opengameart.org/content/gastric-distress，CC0）→ 放屁、大屁
- 處理：降到 16 kHz 再升回、輕微 log 位元壓縮（9 bit、混 30%），讓它帶一點像素感但仍是真實聲音。做法見 `handoff/kit/audio/make-sfx.sh`。
- 檔名 = 遊戲事件名（`jump`、`land`、`drink`、`fart`、`break`、`die`…），接進遊戲時直接對應 `Sfx` 的事件。
