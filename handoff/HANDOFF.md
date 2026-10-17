# 交接文件：醉隱「醉意量表」新玩法

## 接手更新（2026-10-17）

以下舊交接保留作背景，現況以本段為準。

- 已整合三天共 12 間到 `prototype/game.html`，不再使用舊 J／L 預設關卡。
- 原 13 間 J／L 關卡已備份 `prototype/legacy-jl-days.json`。
- 前兩間 K 教學已有不使用 J 的含瓶蓋路線；1-3／1-5 用高牆引導 J；1-4 保留醉階與放屁的運用。
- 第二天四間加入橫向封死的箱牆，必須衝破才能往右出關；第三天三間改成可升天破頂的幾何。
- 12 間都有經 240 Hz 重播驗證的含瓶蓋路線；第三天三間均完整觸發升天、衝、丟。
- `routes.json` 保存 P 路線；`routes.mjs` 驗證快取並只在整組含瓶蓋路線有效時寫入遊戲。
- `build.mjs` → `integrate.mjs` → `routes.mjs` 可由專案根目錄執行。工具已改成相對檔案位置，不再依賴原機器絕對路徑。
- P 現在也比對醉意格數、進場量、覆蓋層和出口等規則，避免改了地形以外的玩法仍播放舊路線。
- README 已更新。原型測試指令：`node --test tests/prototype-portals.test.mjs tests/dialogue-editor.test.mjs`。
- 求解器失敗不代表數學上無解；這次驗證保證所存路線可過關，手感與其他繞路仍待使用者實玩。
- 編輯器內建 SAMPLE 仍是舊版；要編新關卡請匯入 `handoff/kit/days.json`，新醉意欄位目前需由 JSON 維護。

更新：2026-10-17 22:xx。前一位 agent 在設計第一～三天關卡時被停止。

## 1. 目標（使用者已拍板的設計）

主角喝醉後發現會出現「醉影」幫他回家，於是開始控制醉的程度：越醉，醉影越強，但幻覺讓地圖越危險。

**唯一資源：酒精量表**
- 每天的格數上限 `cells`：第一天 1 格、第二天 2 格、第三天 3 格。
- 能量（`booze`）**會自動回復**：醉意自己上來。
- **已拿掉酒瓶**，使用者的決定。

**K：放屁**
- 只能點按，不能按住。冷卻 0.14 秒，要一直點（Flappy Bird 式）。
- 每噴扣 1/6 格。
- 按住 A／D：往前加速（氮氣）。不按方向或按住 W：往上噴。

**J：醉影**
- 一次用掉全部滿格，**連段全自動演完**。這是使用者明確選的「全自動」，不是逐段按。
  - 1 格：丟
  - 2 格：衝 → 丟
  - 3 格：升天（主角放超大屁）→ 衝 → 丟
- 最後一定是「丟」，因為醉影丟完就放手了。

**醉階**
- 醉階＝滿格數，每階可疊加地圖覆蓋層（`stages`）。越醉越危險，也可以有幻覺平台。
- 醉階要變之前會先預告約 0.9 秒，落地才會真的切換。
- 預告期間放屁讓那一格不滿，就能取消。

**流程要求**
- 使用者要求：手感好、關卡符合角色邏輯、好玩。
- 不要一開始技能全開，從第 1 格開始，到第三天才 3 格。
- 使用者最後說：**「直接改，不要審查，我來就好，趕快改」**。不要再跑子代理盲測流程。

## 2. 已完成，並已提交到 `99f6518`（已推到 origin/main）

### `prototype/game.html` 引擎（第一個 `<script>`）

**TUNING 新增**

| 參數 | 值 |
|---|---|
| `fartCost` | 1/6 |
| `fartCooldown` | 0.14 |
| `fartUp` | 300 |
| `fartDash` | 560 |
| `fartDashLift` | 60 |
| `ascendVY` | 1200 |
| `ascendBreak` | 0.45 |
| `stageWarn` | 0.9 |
| `regen` | 0.4 格／秒 |
| `regenDelay` | 0.8 |
| `chainAscend` | 0.45 |
| `chainCharge` | 0.7 |

**觸發條件**
- 地圖有 `cells`（1–3）就是 drunk mode，`get drunk()`。
- 沒有 `cells` 的舊關卡沿用舊規則（J 摔角手、L 保鑣），測試靠這點保持穩定。

**房間欄位**
- `booze`：進房時的量。
- `stages: { "1": [18×32], "2": …, "3": … }`：覆蓋層。
  - `.` 保留原格，`_` 清空，`#^=BC<>` 取代。
  - 疊加計算，只能用靜態格子。

**相關方法**

| 方法 | 作用 |
|---|---|
| `targetStage` / `stageChar` / `stageDiff` | 計算醉階與各階地形差異 |
| `applyStage` | 新的實心格會壓到人時拒絕切換 |
| `updateStage` | 預告，然後落地才切換 |
| `fart` | 放屁 |
| `pressZui` | J：清空滿格，排入 `this.chain` |
| `ascend` | 升天：往上衝，會破壞頭上的 B／C |

**連段與回復**
- 升天 → 隔 `chainAscend` 自動 `startCharge`。
- 衝刺時間到或撞牆，自動 `startLift`（丟）。
- 衝刺中按 W 跳離會中斷連段。
- 回復只在沒有連段、也不在 lift／charge 時進行。
- 死亡後回到進房時的量。

**其他**
- `refreshAir` 在 drunk mode 不作用。

### 畫面（第二個 `<script>`）

- `drawGauge`
  - 三格量表，未解鎖的格顯示「？」。
  - 上方顯示「J 升天→衝→丟」，以及醉階名稱（清醒／微醺／大醉／爛醉）和預告文字。
- `drawHallucination`：幻覺地形紫色發光；即將改變的格子會閃爍。
- `drawDrunkGrade`：醉階畫面濾鏡。
- 醉影在 drunk mode 一律紫色。
- 音效：`fart`、`bigfart`、`stageUp`、`stageDown`。（`gulp` 已無用，可刪。）
- Esc 說明文字已更新。

### 自動通關（P 鍵）

- `Drunk.AUTO` 的 `STEPS` 已換成新的動作標籤，與 `handoff/kit/dsim.mjs` 的 `ACTIONS` 相同。
- **`ROUTES` 仍是舊關卡的路線**，所以目前無效。

### 測試（`tests/prototype-portals.test.mjs`）

- 新增 2 個 drunk mode 測試：一鍵連段、回復、預告、放屁取消、死亡重置。
- **目前 13/14 通過**。失敗的是 P 路線測試，換上新關卡並重新產生路線後就會過。

### 尚未做

- `DEFAULT_CAMPAIGN` 還是舊的 13 間 J／L 關卡，新關卡還沒放進去。
- README 還沒寫新玩法。

## 3. 關卡工具：`handoff/kit/`（從 scratchpad 複製出來）

| 檔案 | 用途 |
|---|---|
| `dsim.mjs` | headless 引擎核心：直接讀取 `prototype/game.html`。提供 `makeGame`、beam search 的 `solve`、240 Hz `replay`、`ascii`、`compress`/`expand`、動作表 `ACTIONS` |
| `qa.mjs <file> <roomId> <full\|bare\|fart\|j\|caps>` | 驗證單間房。full 約 1 分鐘，可以平行跑 |
| `audit.mjs` | 一次跑 5 種條件，比較慢 |
| `play.mjs <file> <id> "<plan>"` | 重播一條路線並印出 ASCII |
| `measure.mjs` | 量各招式的距離與高度 |
| `build.mjs` | 用程式畫房間，輸出 `days.json`（目前的草稿） |
| `integrate.mjs` | 把關卡寫進 game.html 的 `DEFAULT_CAMPAIGN`。注意：它讀的是 `day1/2/3.json`，要改成讀 `days.json` |
| `routes.mjs` | 為每間預設房間找 P 路線，含瓶蓋 |

`DESIGN.md` **已過時**：裡面寫的是酒瓶，以及每按一次 J 扣一格。只能參考格式和地格說明。

**量到的距離**（格，1 格＝40 px）

| 動作 | 結果 |
|---|---|
| 跑跳 | 高 2.8，遠 5.4 |
| 放屁往上（1 格量） | 3.3 高；先跳再噴 6.2 高 |
| 放屁加速（1 格量，先跳） | 約 13 遠 |
| 丟 | 普通 16.7 遠、7.8 高；W 高拋 10 高；S 低飛 14.6 遠 |
| 2 格連段 衝→丟 | 約 29 遠，幾乎橫跨整個畫面 |
| 3 格連段 | 約 14 高 |

## 4. 草稿關卡現況：`handoff/kit/days.json`

由 `build.mjs` 產生，共 12 間：第一天 5 間、第二天 4 間、第三天 3 間。

| 房間 | full | bare | 問題 |
|---|---|---|---|
| 1-1～1-5 | 都能過 | 都過不了 | 大多只靠放屁就能過（J=0）。1-3、1-5 的瓶蓋拿不到 |
| 2-1～2-4 | 都能過 | 都過不了 | 2-2、2-4 只靠放屁就過，J 不是必要的 |
| 3-1、3-2、3-3 | **都過不了** | — | 需要重新調整幾何（升天高度約 9 格，連段方向依照面向） |

**主要的設計問題**
- 自動回復讓放屁幾乎無限，所以只靠放屁就能過很多房間。
- 可以考慮的方向：
  - 降低 `regen`
  - 提高 `fartCost`
  - 用天花板、牆、玻璃限制放屁路線
  - 讓「醉階危險」逼玩家用 J 清空來醒酒

## 5. 建議的下一步

1. 調整 `days.json`（或直接改 `build.mjs`），讓每間房都需要該天的新招，第三天三間要能過。
2. 改 `integrate.mjs`，讀 `days.json`，寫進 `DEFAULT_CAMPAIGN`。
   - 舊的 13 間建議先存成 `prototype/legacy-jl-days.json`，目前還沒存。舊版在 git `99f6518` 裡的 `DEFAULT_CAMPAIGN`。
3. 跑 `routes.mjs`，把結果貼進 game.html 的 `ROUTES`（key 是 `day-1:1-1` 這種格式），讓 P 路線測試通過。
4. 更新 README 的新玩法段落、操作表和 JSON 契約（`cells`、`booze`、`stages`）。
5. 使用者要自己試玩，不需要子代理審查。

## 6. 其他

- scratchpad 裡 `d3/`、`day1work/`、`work/` 是被停掉的三位設計子代理的成果，用的是**舊規則**：每按一次 J 扣一格，而且有酒瓶。內容已過時，可以忽略。
- 使用者偏好：一律用繁體中文回覆，每句開頭加「您好，Chris Su！」，回答要精簡、結構化。刪除或移動檔案前要先確認。
