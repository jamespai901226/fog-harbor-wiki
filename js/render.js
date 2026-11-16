/* =========================================================
   霧港撤離 Wiki — 通用渲染器
   所有頁面共用這一支。新增內容或分類「不需要」修改這個檔案，
   只要改 data/ 底下的 JSON（規則見 CLAUDE.md）。
   ========================================================= */

const RARITY_CLASS = { "普通": "rarity-common", "稀有": "rarity-rare", "傳說": "rarity-legendary" };

const params = new URLSearchParams(location.search);
const $ = (sel) => document.querySelector(sel);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`讀取失敗：${path}（HTTP ${res.status}）`);
  return res.json();
}

/** 讀取分類註冊表與所有分類的資料 */
async function loadAll() {
  const cats = await loadJSON("data/categories.json");
  const data = {};
  await Promise.all(cats.map(async (c) => { data[c.key] = await loadJSON(c.file); }));
  return { cats, data };
}

function entryLink(catKey, id) {
  return `entry.html?cat=${encodeURIComponent(catKey)}&id=${encodeURIComponent(id)}`;
}

/* ---------- 欄位渲染：依 type 決定外觀 ---------- */
function renderValue(field, value, ctx) {
  if (value === undefined || value === null || value === "") return `<span class="muted">—</span>`;
  switch (field.type) {
    case "rarity":
      return `<span class="badge ${RARITY_CLASS[value] || "rarity-common"}">${esc(value)}</span>`;
    case "number":
      return `${esc(value)}${field.unit ? " " + esc(field.unit) : ""}`;
    case "level": {
      const n = Math.max(0, Math.min(5, Number(value)));
      let pips = "";
      for (let i = 1; i <= 5; i++) pips += `<i class="${i <= n ? "on" : ""}"></i>`;
      return `<span class="level" title="${n} / 5">${pips}</span>`;
    }
    case "bool":
      return value
        ? `<span class="badge ok">${esc(field.trueText || "是")}</span>`
        : `<span class="badge no">${esc(field.falseText || "否")}</span>`;
    case "tags":
      return `<ul class="tag-list">${[].concat(value).map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>`;
    case "refs": {
      const pool = ctx.data[field.refCat] || [];
      return `<ul class="tag-list">${[].concat(value).map((id) => {
        const hit = pool.find((e) => e.id === id);
        return hit
          ? `<li><a class="tag" href="${entryLink(field.refCat, id)}">${esc(hit.name)}</a></li>`
          : `<li><span class="badge broken">找不到：${esc(id)}</span></li>`;
      }).join("")}</ul>`;
    }
    default: // "text"
      return esc(value);
  }
}

/* ---------- 共用：導覽列 ---------- */
function renderNav(cats, activeKey) {
  const nav = $("#site-nav");
  if (!nav) return;
  nav.innerHTML =
    `<a href="index.html" class="${activeKey ? "" : "active"}">首頁</a>` +
    cats.map((c) =>
      `<a href="list.html?cat=${c.key}" class="${c.key === activeKey ? "active" : ""}">${esc(c.icon)} ${esc(c.name)}</a>`
    ).join("");
}

/* ---------- 卡片（列表頁用） ---------- */
function renderCard(cat, entry, ctx) {
  // 卡片只顯示 card: true 且不是 refs 的欄位（避免 <a> 巢狀）
  const meta = cat.fields
    .filter((f) => f.card && f.type !== "refs")
    .map((f) => renderValue(f, entry[f.key], ctx))
    .join("");
  return `
    <a class="card" href="${entryLink(cat.key, entry.id)}" data-search="${esc((entry.name + " " + (entry.desc || "") + " " + [].concat(entry.tags || []).join(" ")).toLowerCase())}">
      <h3>${esc(entry.name)}</h3>
      <div class="meta">${meta}</div>
      <p>${esc(entry.desc)}</p>
    </a>`;
}

/* ---------- 頁面：首頁 ---------- */
function pageIndex(ctx) {
  const box = $("#category-grid");
  box.innerHTML = ctx.cats.map((c) => `
    <a class="card" href="list.html?cat=${c.key}">
      <div class="icon">${esc(c.icon)}</div>
      <h3>${esc(c.name)} <span class="badge plain">${(ctx.data[c.key] || []).length} 筆</span></h3>
      <p>${esc(c.desc)}</p>
    </a>`).join("");
}

/* ---------- 頁面：列表 ---------- */
function pageList(ctx) {
  const cat = ctx.cats.find((c) => c.key === params.get("cat"));
  if (!cat) return showError(`找不到分類「${esc(params.get("cat"))}」。請確認它已登記在 <code>data/categories.json</code>。`);

  document.title = `${cat.name}｜霧港撤離 Wiki`;
  renderNav(ctx.cats, cat.key);

  const entries = ctx.data[cat.key] || [];
  $("#content").innerHTML = `
    <div class="breadcrumb"><a href="index.html">首頁</a> / ${esc(cat.name)}</div>
    <h1>${esc(cat.icon)} ${esc(cat.name)}</h1>
    <p class="muted">${esc(cat.desc)}</p>
    <input class="search" type="search" placeholder="搜尋名稱、描述或標籤…" aria-label="搜尋">
    <div class="grid">${entries.map((e) => renderCard(cat, e, ctx)).join("")}</div>
    <p class="muted" id="empty" hidden>沒有符合的結果。</p>`;

  const input = $(".search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll(".grid .card").forEach((el) => {
      const ok = !q || el.dataset.search.includes(q);
      el.hidden = !ok;
      if (ok) shown++;
    });
    $("#empty").hidden = shown > 0;
  });
}

/* ---------- 頁面：詳細 ---------- */
function pageEntry(ctx) {
  const cat = ctx.cats.find((c) => c.key === params.get("cat"));
  const entry = cat && (ctx.data[cat.key] || []).find((e) => e.id === params.get("id"));
  if (!entry) return showError(`找不到這個條目（cat=${esc(params.get("cat"))}, id=${esc(params.get("id"))}）。`);

  document.title = `${entry.name}｜霧港撤離 Wiki`;
  renderNav(ctx.cats, cat.key);

  const rows = cat.fields
    .map((f) => `<tr><th>${esc(f.label)}</th><td>${renderValue(f, entry[f.key], ctx)}</td></tr>`)
    .join("");

  // 反向連結：找出其他分類裡用 refs 指向這筆資料的條目
  const backrefs = [];
  ctx.cats.forEach((c) => {
    c.fields.filter((f) => f.type === "refs" && f.refCat === cat.key).forEach((f) => {
      const hits = (ctx.data[c.key] || []).filter((e) => [].concat(e[f.key] || []).includes(entry.id));
      if (hits.length) backrefs.push({ title: `${c.icon} ${c.name}（${f.label}）`, cat: c, hits });
    });
  });
  const backrefHTML = backrefs.map((b) => `
    <h2 class="section-title">${esc(b.title)}</h2>
    <div class="grid">${b.hits.map((e) => renderCard(b.cat, e, ctx)).join("")}</div>`).join("");

  $("#content").innerHTML = `
    <div class="breadcrumb"><a href="index.html">首頁</a> / <a href="list.html?cat=${cat.key}">${esc(cat.name)}</a> / ${esc(entry.name)}</div>
    <h1>${esc(entry.name)}</h1>
    <p>${esc(entry.desc)}</p>
    <h2 class="section-title">資料</h2>
    <table class="stat-table">${rows}</table>
    ${entry.lore ? `<h2 class="section-title">背景故事</h2><div class="lore">${esc(entry.lore)}</div>` : ""}
    ${backrefHTML}`;
}

function showError(html) {
  const box = $("#content") || $("main");
  box.innerHTML = `<div class="error">${html}</div>`;
}

/* ---------- 啟動 ---------- */
(async function init() {
  try {
    const ctx = await loadAll();
    const page = document.body.dataset.page;
    if (page === "index") { renderNav(ctx.cats, null); pageIndex(ctx); }
    else if (page === "list") pageList(ctx);
    else if (page === "entry") pageEntry(ctx);
  } catch (err) {
    console.error(err);
    const local = location.protocol === "file:";
    showError(
      `資料載入失敗：${esc(err.message)}` +
      (local ? `<br>你是直接雙擊開啟 HTML 的嗎？請在專案資料夾執行 <code>python -m http.server</code>，再打開 <code>http://localhost:8000</code>。` : "")
    );
  }
})();
