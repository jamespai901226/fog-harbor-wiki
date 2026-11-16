# 繳交內容草稿（複製貼到 NTU COOL）

標題：臺大 <學號> <系級> <姓名> 霧港撤離 Wiki

---

**1. 專案簡介**
《霧港撤離》是我期末專題規劃中的撤離生存文字遊戲（火山噴發背景，類似 Tarkov＋PUBG 縮圈），這個網站是它的世界觀資料庫，收錄道具、地圖區域、勢力等設定。網站採用「資料驅動」設計：所有內容寫在 JSON，頁面由通用模板自動產生，之後也能直接作為遊戲本體的資料來源。

**2. GitHub Repository**
https://github.com/<帳號>/fog-harbor-wiki

**3. 網頁連結**
https://<帳號>.github.io/fog-harbor-wiki/

**4. CLAUDE.md**
https://github.com/<帳號>/fog-harbor-wiki/blob/main/CLAUDE.md

**5. 簡短說明：規則如何幫助 AI 繼續新增內容**
- 內容與版面分離：新增內容只需要改 `data/*.json`，CLAUDE.md 明確規定 AI 不准修改 HTML/JS，畫面因此永遠保持一致。
- 規則具體到可以驗證：欄位型別、命名格式（kebab-case）、字數限制、稀有度只能三選一，都寫成表格；另外附有 `tools/check.py`，AI 改完後執行就能自我檢查，不必靠人工核對。
- 有逐步 SOP：「新增一筆資料」和「新增一個分類」各有編號步驟，加上完成後的檢查清單。
- 實際驗證：我開啟新的 AI 對話，只輸入一句「請閱讀 CLAUDE.md，新增 factions 分類」，AI 就新增了整個「勢力」分類，首頁、導覽列、反向連結都自動出現，且 `render.js` 和 HTML 完全沒有被修改（過程記錄在 docs/ai-log.md）。
- 延伸性：同一套架構可以繼續加入敵人、任務、事件等分類，未來遊戲本體也能直接讀取同一批 JSON。
