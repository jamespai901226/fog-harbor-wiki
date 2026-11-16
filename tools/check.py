"""
霧港撤離 Wiki — 資料檢查工具
用法（在專案根目錄）：python tools/check.py
只用 Python 標準函式庫。全部通過時印出「✅ 全部通過」，否則列出每一個錯誤並以代碼 1 結束。
規則來源：CLAUDE.md 第 4 節「資料規格」。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
RARITIES = {"普通", "稀有", "傳說"}
FIELD_TYPES = {"text", "number", "rarity", "level", "bool", "tags", "refs"}
COMMON_REQUIRED = ["id", "name", "desc", "lore"]

errors = []


def err(where, msg):
    errors.append(f"[{where}] {msg}")


def load(path):
    try:
        return json.loads((ROOT / path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        err(path, "檔案不存在")
    except json.JSONDecodeError as e:
        err(path, f"JSON 格式錯誤：第 {e.lineno} 行 {e.msg}")
    return None


cats = load("data/categories.json") or []
data = {}

# ---- 1. 分類註冊表 ----
seen_keys = set()
for c in cats:
    key = c.get("key", "?")
    where = f"categories.json:{key}"
    for k in ["key", "name", "icon", "file", "template", "desc", "fields"]:
        if k not in c:
            err(where, f"缺少欄位「{k}」")
    if key in seen_keys:
        err(where, "分類 key 重複")
    seen_keys.add(key)
    if not ID_RE.match(key):
        err(where, "key 必須是英文小寫，可用連字號")
    if c.get("file") != f"data/{key}.json":
        err(where, f"file 應為 data/{key}.json")
    if c.get("template") != f"templates/{key}.json":
        err(where, f"template 應為 templates/{key}.json")
    if not (ROOT / c.get("template", "")).exists():
        err(where, f"範本檔 {c.get('template')} 不存在")
    for f in c.get("fields", []):
        if f.get("type") not in FIELD_TYPES:
            err(where, f"欄位 {f.get('key')} 的 type「{f.get('type')}」不在允許清單 {sorted(FIELD_TYPES)}")
        if f.get("type") == "refs" and not f.get("refCat"):
            err(where, f"refs 欄位 {f.get('key')} 缺少 refCat")
        if f.get("key") in COMMON_REQUIRED:
            err(where, f"欄位 {f.get('key')} 是共通欄位，不要寫進 fields")
    data[key] = load(c.get("file", "")) or []

# ---- 2. 每一筆資料 ----
all_ids = {k: {e.get("id") for e in v} for k, v in data.items()}
for c in cats:
    key = c["key"]
    ids = set()
    for i, e in enumerate(data.get(key, [])):
        where = f"{key}.json:{e.get('id', f'#{i}')}"
        for k in COMMON_REQUIRED + [f["key"] for f in c.get("fields", [])]:
            if k not in e:
                err(where, f"缺少欄位「{k}」")
        eid = e.get("id", "")
        if not ID_RE.match(str(eid)):
            err(where, "id 必須是英文小寫 kebab-case，例如 gas-mask")
        if eid in ids:
            err(where, "id 重複")
        ids.add(eid)
        if len(e.get("desc", "")) > 40:
            err(where, f"desc 超過 40 字（目前 {len(e['desc'])} 字）")
        lore_len = len(e.get("lore", ""))
        if not 40 <= lore_len <= 120:
            err(where, f"lore 應為 40～120 字（目前 {lore_len} 字）")
        for f in c.get("fields", []):
            v = e.get(f["key"])
            if v is None:
                continue
            t = f["type"]
            if t == "rarity" and v not in RARITIES:
                err(where, f"{f['key']} 只能是 {sorted(RARITIES)}")
            if t == "number" and (not isinstance(v, (int, float)) or isinstance(v, bool) or v < 0):
                err(where, f"{f['key']} 必須是非負數字")
            if t == "level" and (not isinstance(v, int) or not 1 <= v <= 5):
                err(where, f"{f['key']} 必須是 1～5 的整數")
            if t == "bool" and not isinstance(v, bool):
                err(where, f"{f['key']} 必須是 true / false")
            if t in ("tags", "refs") and (not isinstance(v, list) or not v):
                err(where, f"{f['key']} 必須是非空陣列")
            if t == "refs" and isinstance(v, list):
                for rid in v:
                    if rid not in all_ids.get(f["refCat"], set()):
                        err(where, f"{f['key']} 參照了不存在的 {f['refCat']} id「{rid}」")

if errors:
    print(f"❌ 發現 {len(errors)} 個問題：")
    for e in errors:
        print("  -", e)
    sys.exit(1)
total = sum(len(v) for v in data.values())
print(f"✅ 全部通過：{len(cats)} 個分類、{total} 筆資料")
