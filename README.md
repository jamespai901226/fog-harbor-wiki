# 霧港撤離 Wiki

《霧港撤離》是一款以火山噴發為背景的撤離生存文字遊戲，這個網站是它的世界觀資料庫：道具、地圖區域、勢力……

- 🌐 網站：https://<你的帳號>.github.io/fog-harbor-wiki/
- 🤖 AI 規則：[CLAUDE.md](./CLAUDE.md)
- 📝 AI 協作紀錄：[docs/ai-log.md](./docs/ai-log.md)

## 特色
- **資料驅動**：所有內容寫在 `data/*.json`，頁面由通用模板自動產生
- **新增分類免寫程式**：在 `data/categories.json` 註冊後，首頁、導覽列、列表頁、詳細頁都會自動出現
- **自動反向連結**：道具標註出現區域後，區域頁面會自動列出能找到的道具
- **資料檢查**：`python tools/check.py` 會檢查格式、命名與參照是否正確

## 本機預覽
```bash
python -m http.server 8000
```
打開 http://localhost:8000
