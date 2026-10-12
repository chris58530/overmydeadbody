# Over My Dead Body · 醉隱

更新日期：2026-10-12。本文描述 `prototype/game.html` 與 `prototype/editor.html` 的目前實作；未實作的故事範圍另行標示。

## 產品與範圍

吉姆加班後醒來，只想回家睡覺，卻走了七天。遊戲為網頁平台跳躍原型，以固定鏡頭、單畫面房間與抽卡發動「醉隱」能力為核心。目前預設內容只有第一天與第二天；完整七天劇情與關卡尚未完成。

遊戲與編輯器各為獨立 HTML，透過 `drunken-rooms` v2 JSON 交接。可直接開啟檔案；編輯器內試玩需要兩個檔案位於同一資料夾。遠端美術與字型需要網路，不能保證完整離線呈現。

## 檔案與試玩

| 檔案 | 說明 |
|---|---|
| `prototype/game.html` | 遊戲本體；可直接開啟或貼上 BeaverKit |
| `prototype/editor.html` | 關卡編輯器；匯出 `drunken-rooms` v2 JSON |
| `prototype/dialogue-example.json` | NPC 對話匯入範例 |
| `tests/prototype-portals.test.mjs`、`tests/dialogue-editor.test.mjs` | 目前原型測試 |
| `server.mjs`、`tests/game.test.mjs` | 早期版本；舊測試依賴此工作目錄未提供的 `dist/` |

1. 開啟 `prototype/editor.html` 編輯關卡，可按「試玩目前房間」測試尚未匯出的修改。
2. 按「結束試玩 · 返回編輯」繼續編輯，完成後按「匯出 JSON」。
3. 開啟 `prototype/game.html`，按 Esc →「載入關卡 JSON」，或將 JSON 檔案拖進遊戲畫面。

放置 NPC 後可點選角色，使用右側視覺對話工具編輯，或在「進階：對話 JSON」按「套用對話」及「匯入對話檔」。放置傳送門後，可點選傳送門或選取其座標，再設定個別目的房間或「結束這一天」。

## 遊戲行為

房間固定 32 × 18 格，遊戲每格 40 px，邏輯畫面為 1280 × 720。每間房間必須有且只有一個出生點。日／地圖決定可抽能力，房間決定地形、出口、場景與對話。

| 操作 | 行為 |
|---|---|
| A / D | 左右移動 |
| W / 空白鍵 | 跳躍 |
| K | 開始抽卡、鎖定卡片、喝完後發動能力 |
| R | 重試房間 |
| E | 靠近 NPC 開始交談，交談中繼續 |
| Enter | 交談中繼續 |
| 1–9 | 選擇對話回答 |
| Esc | 暫停與關卡載入選單 |
| M | 靜音 |
| ` | 手感調整面板 |

抽卡與喝酒時世界速度預設為 0.2 倍；卡片輪替間隔 0.32 秒，喝酒時間 0.8 秒。喝完後有 5 秒可發動。作用中的能力不進入抽卡池。離地後預設只能抽一次，落地重置。以上數值由遊戲的 `TUNING` 控制，調整值儲存在 `drunk-tuning` localStorage。

| 能力 ID | 名稱 | 行為 |
|---|---|---|
| `wrestler` | 摔角手 | 舉起吉姆，選方向後拋出 |
| `bodyguard` | 保鑣 | 扛著吉姆衝刺，可破壞箱子、撞飛保全並通過碎玻璃 |

房間出口可位於四個畫面邊緣，或使用接觸觸發的傳送門。目的地為同一天的房間 ID；`null` 表示結束這一天。日結束後確認進入下一天。NPC 交談時暫停角色與世界。

## 關卡編輯器

編輯畫布每格 30 px。支援左鍵畫格子、右鍵擦除、Shift 拖曳矩形，以及房間與日的編輯、房間排序、主題、能力池、出口與文字設定。

資料自動儲存於 `drunk-editor` localStorage；復原保留最多 120 個快照，支援重做。localStorage 被環境封鎖時無法保證保存，使用者應匯出 JSON 留存。

匯入接受 v2 JSON 與 32 × 18 房間尺寸，編輯器提供錯誤與警告檢查。試玩前必須通過錯誤檢查。匯出包含 NPC、個別傳送門目的地與所有房間；空的 `lines` 與舊 `notes` 欄位不輸出。

「試玩目前房間」以最新編輯內容建立快照，從選取的日與房間開始，在 iframe 中載入 `game.html?editorTest=1`。遊戲送出 `drunk-test-ready`，編輯器回傳 `drunk-editor-test`，內容為 `campaign` JSON 字串、`mapIndex` 與 `roomId`。每次重新開啟試玩更新快照，結束後返回編輯。

## JSON 契約

| 層級 | 欄位 | 說明 |
|---|---|---|
| 根物件 | `format`, `version`, `maps` | `"drunken-rooms"`、`2`、至少一張地圖 |
| 地圖 | `id`, `name`, `intro`, `outro` | 識別、顯示名稱、開場與結尾文字 |
| 地圖 | `abilities`, `rooms` | 非空能力 ID 陣列、非空房間陣列 |
| 房間 | `id`, `name`, `theme` | 同一天內 ID 不重複；主題為 `office`、`pantry`、`elevator`、`lobby` 或 `street` |
| 房間 | `tiles` | 18 個字串，每個長度 32，恰好一個 `P` |
| 房間 | `exits` | `left`、`right`、`top`、`bottom` 對應同一天房間 ID 或 `null` |
| 房間 | `lines` | 房間文字陣列 |
| 房間 | `portalTargets` | `"x,y"` 對應房間 ID 或 `null`，座標必須位於 `O` |
| 房間 | `portalTarget` | 相容舊資料的房間級傳送門目的地 |
| 房間 | `npcs` | `"x,y"` 對應對話物件，座標必須位於 `N` |

座標從左上角 `(0,0)` 開始。房間至少有一個邊緣出口或一個 `O`。所有非空出口目的地必須存在於同一天。

傳送門目的地依序使用：個別 `portalTargets["x,y"]` → 舊 `portalTarget` → 房間列表下一間 → 結束這一天。明確的 `null` 直接結束一天。編輯器更改房間 ID 時同步更新目的地；刪除目的房間時將引用改為 `null`；擦除傳送門時移除該格目的地設定。

| 格子 | 用途 |
|---|---|
| `.` / `#` | 空白／地形 |
| `^` / `=` | 碎玻璃／木板 |
| `B` / `C` | 衝刺可破壞箱子／會崩落的紙箱 |
| `<` / `>` | 左／右輸送帶 |
| `R` / `L` | 巡邏角色／掉落物 |
| `*` / `P` | 瓶蓋／出生點 |
| `O` / `N` | 傳送門／NPC |

## NPC 對話

每個 NPC 擁有獨立 `name`、`start` 與 `nodes`。`start` 必須指向既有節點。節點包含 `text`，以及可選的 `next` 或 `choices`；目的地為既有節點 ID 或 `null`（結束）。每節點文字最多 500 字元；回答最多 9 個，每個最多 100 字元。提供 `choices` 時陣列不可為空，每個回答需有 `text` 與 `next`。

```json
{
  "name": "同事",
  "start": "hello",
  "nodes": {
    "hello": {
      "text": "下班了？",
      "choices": [{ "text": "我要回家。", "next": "bye" }]
    },
    "bye": { "text": "路上小心。", "next": null }
  }
}
```

編輯器提供視覺節點／回答工具、起始節點與目的地選單、分支試播，以及進階 JSON 編輯與檔案匯入。修改自動保存並支援復原／重做；擦除 NPC 格子移除其對話。

## 驗證與維護

目前原型測試：`node --test tests/prototype-portals.test.mjs tests/dialogue-editor.test.mjs`。測試涵蓋傳送門、關卡驗證、NPC 對話、編輯器試玩與腳本語法；瀏覽器視覺、音效及操作手感仍需人工試玩。

`tests/game.test.mjs` 屬於舊版，依賴 `dist/game/`。此工作目錄未提供該目錄，因此 `npm test` 的完整測試入口仍有舊版依賴問題。新規格以 `prototype/` 為準；未完成的七天內容、離線素材封裝與舊測試入口整理不列為已實作功能。

