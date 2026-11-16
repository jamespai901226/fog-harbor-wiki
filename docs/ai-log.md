# AI 協作紀錄

這份紀錄用來證明：只要依照 `CLAUDE.md`，AI 就能在**不修改任何 HTML/JS** 的情況下持續擴充網站內容。

---

## 2026-11-16｜建立專案骨架
- 指令：依規劃建立霧港撤離 Wiki（資料驅動、GitHub Pages）
- 修改的檔案：全部（初始建立）
- 新增內容：道具 6 筆、地圖區域 3 筆、`CLAUDE.md`、`tools/check.py`
- check.py 結果：✅ 全部通過：2 個分類、9 筆資料

---

## 2026-11-16｜新增 factions（勢力）分類
- 指令：請先完整閱讀專案根目錄的 CLAUDE.md，之後所有修改都必須遵守它的規則。
- 修改的檔案：`data/categories.json`、`CLAUDE.md`（4.3 節）、`docs/ai-log.md`；新增 `data/factions.json`、`templates/factions.json`
- 新增內容：勢力分類（欄位 `threat` level、`members` number、`hostile` bool、`territory` refs→zones、`tags`），勢力 3 筆：漁會殘部、守鐘人、赤喉信眾
- check.py 結果：✅ 全部通過：3 個分類、12 筆資料

---

<!--
下一步示範（請在新的 AI 對話中執行，然後把結果記錄在下面）：

指令（只丟這一句）：
「請閱讀 CLAUDE.md，依照 5.2 節新增一個 factions（勢力）分類，至少 3 筆資料，並用 refs 連到 zones。」

完成後檢查：
1. 首頁和導覽列自動出現「勢力」
2. 區域頁面自動出現反向連結
3. git diff 確認 render.js / list.html / entry.html 沒有被修改
-->
