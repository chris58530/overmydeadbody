# 關卡重做待辦（2026-10-21）

目標：讓十五間解謎房更好玩，方向是**解謎深度**和**動態元素**。保留三天 × 五間的骨架，可以小幅加機制。

## 已完成

- 新機制：解謎模式的巡邏保全有重力。腳下地形消失就會往下掉，落在玻璃上或掉出房間就會被撞飛；新出現的實心格會等保全走開才出現。程式在 `prototype/game.html` 的 `patrolFall`、`updateChillStage`，測試在 `tests/chill-puzzles.test.mjs` 最後兩個。
- 第一天 5 間重新設計並上線（`handoff/kit/chill-day1.mjs`），P 路線已重錄，`npm test` 94 項全過。
  - 1-3、1-5 是時間差房（instant 模式找不到解）。
  - `chill-day1.mjs` 另外 export `capPlans`：五條拿瓶蓋的錄製路線，目前沒有接進測試。

## 設計原則（第二、三天沿用）

1. 房名只是氛圍，不寫解法；解法寫在 `lines`（不顯示）。
2. 每間一個核心點子，至少兩步推理，最好有一個看起來對、但會失敗的錯誤做法。
3. 動態元素要和三秒時間差產生時機或預判上的抉擇：保全掉玻璃、輸送帶隨醉階反轉、崩落紙箱、掉落招牌。
4. 每間一個瓶蓋，放在需要進階技巧的支線上。
5. 公平：時間差房在每次換階後遲疑 0.5 秒也要過得去。

## 待辦

- [ ] **第二天**：進行中的版本在 `handoff/wip/chill-day2.wip.mjs`（agent 正式寫進的檔案）和 `chill-day2.work-copy.mjs`（agent 最後的工作副本，應該比較新）。捷徑搜尋結果在 `handoff/wip/day2-probe-results.txt`；2-2 在 still 模式找得到解，因為 2-2 是教學房，這是預期的。尚未確認：重錄路線、瓶蓋可達、單 J 測試。
  - 構想：2-1 衝破紙箱並撞飛後面的保全；2-2 玻璃地道加招牌或輸送帶；2-3 趕在天花板下沉前衝，順便撞飛地道裡的保全；2-4 第二次 K 要讓低屋頂的保全掉到玻璃上；2-5 輸送帶隨醉階反轉，讓換階的順序和位置都有影響。
- [ ] **第三天**：未完成的版本在 `handoff/wip/chill-day3.wip.mjs`，捷徑搜尋結果在 `handoff/wip/day3-probe-results.txt`。
  - 構想：3-1 教升天；3-2 升天在雨棚下卡住，掉到保全旁邊，要改用衝；3-3 蓋子在爛醉時是鐵的，等待的位置要配合崩落紙箱或招牌；3-4 只在大醉存在的台子改成崩落紙箱；3-5 一階一階醒酒回家，途中要讓保全在正確的那次 K 掉到玻璃上。
- [ ] 把 wip 版本搬回 `handoff/kit/chill-day2.mjs`、`chill-day3.mjs`，用 scratch 腳本只建單日 campaign 來驗證：錄製並重播、單 J 測試、`chill-probe` still／instant、瓶蓋可達。
- [ ] 更新 `tests/chill-routes.test.mjs` 的 `expectedSkills` 和「必須換階」房間清單。目前沿用舊版，第一天的時間差房仍是 1-3、1-5，維持不變。
- [ ] **引擎 bug**：吉姆寬 44 px，比一格（40 px）寬。出生點貼著實心格時，往反方向走，`moveX` 會把他推到那格的另一邊，等於穿牆。建議 `moveX` 只檢查移動方向前緣那一欄。修完要重錄全部路線，並確認三天醉意量表版的舊路線仍能重播。
- [ ] 把 `capPlans`（瓶蓋路線）接進測試。
- [ ] 檢查每天的開場文字（`build-chill.mjs`）：只教操作，不給解法。
- [ ] 全部完成後：`node handoff/kit/build-chill.mjs`、`build-chill-routes.mjs`、`build-beaverkit.mjs`，再跑 `npm test`，更新 README 的十五間表格，最後重新匯入 BeaverKit。
