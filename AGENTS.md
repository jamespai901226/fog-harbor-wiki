# AGENTS.md

本專案的完整 AI 規則寫在 [CLAUDE.md](./CLAUDE.md)，所有 AI 工具（Claude、Codex、Cursor、Copilot 等）請以該文件為準。

最重要的三條：
1. 新增內容只改 `data/*.json`，不改 HTML/JS。
2. 每次修改後執行 `python tools/check.py`，必須顯示 ✅。
3. 在 `docs/ai-log.md` 追加紀錄。
