# CLAUDE.md — 霧港撤離 Wiki

> 給 AI 的專案說明書。動手修改任何檔案之前，請先完整讀完這份文件。
> 這份文件的目標是讓你能回答：「這個專案應該怎麼繼續做下去？」

---

## 1. 專案目的

《霧港撤離》是一款撤離生存類文字遊戲（類似 Escape from Tarkov ＋ PUBG 縮圈）的**世界觀資料庫網站**。

- **世界觀**：虛構港口城市「霧港市」，赤喉火山噴發後被火山灰逐步吞沒。玩家（撤離者）從安全屋出發，在**火山灰圈收縮**與**熔岩轟炸區**之間搜刮物資，在灰圈覆蓋前抵達撤離點。
- **核心規則**：只有撐得過火山灰的貴重物品能帶回安全屋（`extractable: true`），消耗品會在撤離時損毀。
- **網站用途**：用一致的格式收錄道具、地區、勢力等設定。之後也會當作遊戲本體的資料來源。
- **設計原則**：**內容與版面分離**。所有內容都寫在 `data/*.json`，HTML 和 JS 是通用模板。**新增內容只改 JSON，不改 HTML 和 JS。**

---

## 2. 檔案結構

```
fog-harbor-wiki/
├─ CLAUDE.md            這份文件（AI 規則）
├─ AGENTS.md            指向本文件
├─ README.md            給人看的專案介紹
├─ index.html           首頁：世界觀介紹＋分類入口（自動從 categories.json 產生）
├─ list.html            通用列表頁   → list.html?cat=<分類key>
├─ entry.html           通用詳細頁   → entry.html?cat=<分類key>&id=<條目id>
├─ css/style.css        共用樣式（顏色變數＋元件）
├─ js/render.js         通用渲染器（讀 JSON → 產生畫面）
├─ data/
│  ├─ categories.json   分類註冊表：有哪些分類、每個分類有哪些欄位
│  ├─ items.json        道具
│  └─ zones.json        地圖區域
├─ templates/           每個分類一份空白範本，新增資料時複製使用
├─ tools/check.py       資料檢查工具（每次修改後必跑）
└─ docs/ai-log.md       AI 協作紀錄
```

| 檔案 | AI 可以改嗎 | 說明 |
|---|---|---|
| `data/*.json` | ✅ 可以 | 主要的工作區 |
| `templates/*.json` | ✅ 新增分類時建立 | |
| `docs/ai-log.md` | ✅ 每次任務後追加 | |
| `index.html` 的 hero 文字 | ⚠️ 使用者要求時才改 | |
| `css/style.css` | ⚠️ 只能新增元件，不能改既有變數 | 見第 6 節 |
| `js/render.js`、`list.html`、`entry.html` | ❌ 不要改 | 除非使用者明確要求新增欄位類型 |

---

## 3. 命名規則

- **分類 key**：英文小寫複數，例如 `items`、`zones`、`factions`
- **資料檔**：`data/<分類key>.json`；**範本**：`templates/<分類key>.json`
- **條目 id**：英文小寫 kebab-case，例如 `gas-mask`、`old-docks`。必須在同一分類內唯一，**建立後不要更改**，因為其他資料會用 id 參照它
- **中文用語**統一使用：金幣（貨幣）、撤離者（玩家）、安全屋、灰圈、熔岩轟炸區、撤離點、赤喉火山、霧港市

---

## 4. 資料規格

### 4.1 共通欄位（所有分類的每一筆資料都必須有）

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | string | kebab-case，唯一 |
| `name` | string | 中文名稱 |
| `desc` | string | 一句話說明，**40 字以內**，會顯示在卡片上 |
| `lore` | string | 背景故事，**40～120 字**，要有具體的人、地點或事件 |

### 4.2 欄位類型（`categories.json` 的 `fields[].type`）

`render.js` 只支援以下 7 種類型，**不可自創類型**：

| type | 資料格式 | 顯示方式 | 額外設定 |
|---|---|---|---|
| `text` | 字串 | 純文字 | |
| `number` | 非負數字 | 數字＋單位 | `unit`：單位文字 |
| `rarity` | `"普通"`、`"稀有"`、`"傳說"` | 彩色徽章 | |
| `level` | 1～5 整數 | 五格條 | |
| `bool` | `true` / `false` | 綠／紅徽章 | `trueText`、`falseText` |
| `tags` | 非空字串陣列 | 標籤列 | |
| `refs` | 非空 id 陣列 | 可點擊的連結 | `refCat`：參照哪個分類 |

- 欄位加上 `"card": true` 會顯示在列表頁的卡片上，**每個分類最多 3 個**。`refs` 類型不能設 `card`
- `refs` 會在被參照的那一頁**自動產生反向連結**。例如道具的 `foundIn` 指向區域，該區域的頁面就會自動列出「這裡能找到的道具」。所以**關聯只需要寫在一邊**

### 4.3 現有分類

**items（道具）**：`rarity`、`value`（金幣）、`weight`（kg）、`extractable`、`foundIn` → zones、`tags`
- 消耗品（食物、濾灰罐、彈藥）一律 `extractable: false`
- 價值參考：普通 10～200、稀有 300～1500、傳說 3000 以上

**zones（地圖區域）**：`danger`（1～5）、`ashPhase`（第幾階段被灰圈覆蓋）、`extractions`（撤離點名稱）
- 越靠近赤喉火山：`ashPhase` 越小、`danger` 越高、戰利品越值錢

---

## 5. 標準作業流程（SOP）

### 5.1 在既有分類新增一筆資料
1. 打開 `templates/<分類>.json`，複製結構
2. 依第 4 節規則填寫，接在 `data/<分類>.json` 陣列的最後面
3. 如果有 `refs` 欄位，確認參照的 id 確實存在；不存在的話，先建立被參照的那筆
4. 執行 `python tools/check.py`，必須顯示 ✅
5. 在 `docs/ai-log.md` 追加一筆紀錄（格式見第 8 節）

### 5.2 新增一個分類（例如 factions）
1. 在 `data/categories.json` 陣列後面追加分類設定（`key`、`name`、`icon`、`file`、`template`、`desc`、`fields`）
2. 建立 `templates/<key>.json`：共通欄位加上所有自訂欄位，值寫成填寫說明
3. 建立 `data/<key>.json`，至少放 3 筆資料
4. 如果新分類和既有分類有關聯，用 `refs` 欄位連過去，例如勢力的 `territory` → zones
5. 在本文件 4.3 節補上新分類的欄位說明
6. 執行 `python tools/check.py`，然後在 `docs/ai-log.md` 追加紀錄
7. **不需要**修改任何 HTML 或 JS：首頁、導覽列、列表頁、詳細頁都會自動出現新分類

### 5.3 本機預覽
```bash
python -m http.server 8000
# 打開 http://localhost:8000
```
不要直接雙擊 HTML 檔，因為瀏覽器會擋下 `file://` 讀取 JSON。

---

## 6. 網頁風格

- 氛圍：火山灰籠罩的夜晚港口，冷色霧灰底加上熔岩橘點綴，**深色主題**
- 顏色**只能使用** `css/style.css` 的 `:root` 變數，不准在任何地方寫死色碼：
  - `--bg` 夜霧底、`--surface` 霧灰藍、`--text` 火山灰白、`--accent` 熔岩橘
  - 稀有度：`--rarity-common` 灰、`--rarity-rare` 藍、`--rarity-legendary` 金
- 現有元件：`.card`、`.grid`、`.badge`、`.tag`、`.tag-list`、`.level`、`.stat-table`、`.lore`、`.section-title`、`.hero`、`.search`、`.breadcrumb`、`.error`
- 確實需要新元件時，加在 `style.css` 最下方，並在這裡補上元件名稱
- 文字使用繁體中文，語氣沉穩、帶一點末日紀實感，不用網路流行語、不用表情符號（分類 icon 除外）

---

## 7. 禁止事項

- ❌ 不使用任何框架或套件（React、Vue、Tailwind、jQuery…）。純 HTML/CSS/JS，GitHub Pages 能直接執行
- ❌ 不在 HTML 裡寫死條目內容。所有內容都來自 JSON
- ❌ 不修改既有條目的 `id`
- ❌ 不新增第 4.2 節以外的欄位類型
- ❌ 世界觀一致性：災難是**火山噴發**，不寫核災、殭屍、外星人；不出現現實中的國家、政黨或真實人物
- ❌ 不刪除使用者寫的資料，除非被明確要求

---

## 8. 完成後自我檢查清單

每次任務結束前逐項確認：

- [ ] `python tools/check.py` 顯示 ✅
- [ ] 新增的 `id` 符合 kebab-case 且沒有重複
- [ ] `desc` ≤ 40 字、`lore` 40～120 字
- [ ] 沒有修改 `render.js`、`list.html`、`entry.html`
- [ ] 用語符合第 3 節，世界觀符合第 7 節
- [ ] 在 `docs/ai-log.md` 追加紀錄，格式如下：

```markdown
## YYYY-MM-DD｜任務標題
- 指令：使用者原本的那句話
- 修改的檔案：…
- 新增內容：…
- check.py 結果：✅
```
