/* Strategy Toolkit – Werkzeuge für das strategische Management
   Reiner Client, Persistenz über localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "strategy-toolkit-v1";
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const emptyLists = (keys) => keys.reduce((o, k) => ((o[k] = []), o), {});

  const PESTEL_CATS = [
    { key: "political", label: "Politisch" },
    { key: "economic", label: "Ökonomisch" },
    { key: "social", label: "Sozio-kulturell" },
    { key: "technological", label: "Technologisch" },
    { key: "environmental", label: "Ökologisch" },
    { key: "legal", label: "Rechtlich" },
  ];
  const VC_SUPPORT = [
    { key: "infrastructure", label: "Unternehmens­infrastruktur" },
    { key: "hr", label: "Personalwirtschaft" },
    { key: "technology", label: "Technologie­entwicklung" },
    { key: "procurement", label: "Beschaffung" },
  ];
  const VC_PRIMARY = [
    { key: "inbound", label: "Eingangslogistik" },
    { key: "operations", label: "Produktion" },
    { key: "outbound", label: "Ausgangslogistik" },
    { key: "marketing", label: "Marketing & Vertrieb" },
    { key: "service", label: "Kundendienst" },
  ];
  const BMC_BLOCKS = [
    { key: "partners", label: "Schlüsselpartner" },
    { key: "activities", label: "Schlüsselaktivitäten" },
    { key: "resources", label: "Schlüsselressourcen" },
    { key: "value", label: "Wertangebote" },
    { key: "relationships", label: "Kundenbeziehungen" },
    { key: "channels", label: "Kanäle" },
    { key: "segments", label: "Kundensegmente" },
    { key: "costs", label: "Kostenstruktur" },
    { key: "revenue", label: "Einnahmequellen" },
  ];
  const BSC_VIEWS = [
    { key: "financial", label: "Finanzperspektive" },
    { key: "customer", label: "Kundenperspektive" },
    { key: "process", label: "Interne Prozesse" },
    { key: "learning", label: "Lernen & Entwicklung" },
  ];

  const defaultState = () => ({
    swot: emptyLists(["strengths", "weaknesses", "opportunities", "threats"]),
    forces: {
      rivalry: { v: 3, note: "" }, newEntrants: { v: 3, note: "" },
      suppliers: { v: 3, note: "" }, buyers: { v: 3, note: "" }, substitutes: { v: 3, note: "" },
    },
    bcg: [],
    stakeholders: [],
    pestel: emptyLists(PESTEL_CATS.map((c) => c.key)),
    valuechain: emptyLists(VC_SUPPORT.concat(VC_PRIMARY).map((c) => c.key)),
    bmc: emptyLists(BMC_BLOCKS.map((c) => c.key)),
    bsc: emptyLists(BSC_VIEWS.map((c) => c.key)),
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return deepMerge(defaultState(), JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }
  function deepMerge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (over && typeof over === "object" && !Array.isArray(over)) {
      Object.keys(over).forEach((k) => {
        out[k] = (base[k] && typeof base[k] === "object" && !Array.isArray(base[k]))
          ? deepMerge(base[k], over[k]) : over[k];
      });
    }
    return over === undefined ? base : (typeof over === "object" ? out : over);
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ---------- Tab-Navigation ---------- */
  function showView(name) {
    $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + name));
    if (name === "bcg") drawBCG();
    if (name === "stakeholder") drawStakeholder();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("#tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (btn) showView(btn.dataset.view);
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); showView(g.dataset.goto); }
  });

  /* ---------- Generisches Listen-Werkzeug (PESTEL, Wertkette, BMC) ---------- */
  function initListTool(rootSel, store, cats) {
    const root = $(rootSel);
    if (!root) return;
    const isGrid = root.dataset.grid === "1";
    cats.forEach((cat) => {
      if (!store[cat.key]) store[cat.key] = [];
      const card = document.createElement("div");
      card.className = "list-card";
      if (isGrid) card.style.gridArea = cat.key;
      const h = document.createElement("h3");
      h.innerHTML = cat.label;
      const ul = document.createElement("ul");
      ul.className = "item-list";
      const form = document.createElement("form");
      form.className = "add-form";
      form.innerHTML = '<input type="text" placeholder="Hinzufügen …" /><button type="submit">+</button>';

      const render = () => {
        ul.innerHTML = "";
        store[cat.key].forEach((text, i) => {
          const li = document.createElement("li");
          const span = document.createElement("span");
          span.textContent = text;
          const btn = document.createElement("button");
          btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
          btn.addEventListener("click", () => { store[cat.key].splice(i, 1); save(); render(); });
          li.append(span, btn); ul.appendChild(li);
        });
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = form.querySelector("input");
        const v = inp.value.trim();
        if (!v) return;
        store[cat.key].push(v); inp.value = ""; save(); render();
      });
      card.append(h, ul, form);
      root.appendChild(card);
      render();
    });
  }

  /* ---------- SWOT ---------- */
  const SWOT_FIELDS = ["strengths", "weaknesses", "opportunities", "threats"];
  function renderSwotList(field) {
    const ul = $(`[data-list="${field}"]`);
    ul.innerHTML = "";
    state.swot[field].forEach((text, i) => {
      const li = document.createElement("li");
      const span = document.createElement("span"); span.textContent = text;
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.swot[field].splice(i, 1); save(); renderSwotList(field); renderTows(); });
      li.append(span, btn); ul.appendChild(li);
    });
  }
  function wireSwotForms() {
    $$(".add-form[data-add]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const field = form.dataset.add;
        const input = form.querySelector("input");
        const val = input.value.trim();
        if (!val) return;
        state.swot[field].push(val); input.value = "";
        save(); renderSwotList(field); renderTows();
      });
    });
  }
  function renderTows() {
    const { strengths: S, weaknesses: W, opportunities: O, threats: T } = state.swot;
    const combine = (a, b) => a.flatMap((x) => b.map((y) => `${x} × ${y}`)).slice(0, 6);
    const fill = (id, items) => {
      const ul = $("#" + id); ul.innerHTML = "";
      items.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    };
    fill("tows-so", combine(S, O)); fill("tows-st", combine(S, T));
    fill("tows-wo", combine(W, O)); fill("tows-wt", combine(W, T));
  }

  /* ---------- Five Forces ---------- */
  const FORCES = [
    { key: "rivalry", label: "Rivalität unter Wettbewerbern" },
    { key: "newEntrants", label: "Bedrohung durch neue Anbieter" },
    { key: "suppliers", label: "Verhandlungsmacht der Lieferanten" },
    { key: "buyers", label: "Verhandlungsmacht der Abnehmer" },
    { key: "substitutes", label: "Bedrohung durch Ersatzprodukte" },
  ];
  function buildForces() {
    const box = $("#forces-list"); box.innerHTML = "";
    FORCES.forEach((f) => {
      const cur = state.forces[f.key];
      const el = document.createElement("div");
      el.className = "force";
      el.innerHTML = `
        <div class="force-top"><h3>${f.label}</h3><span class="force-val" id="val-${f.key}">${cur.v}</span></div>
        <input type="range" min="1" max="5" step="1" value="${cur.v}" aria-label="${f.label}" />
        <div class="scale-hint"><span>1 – schwach</span><span>5 – stark</span></div>
        <textarea placeholder="Begründung / Notizen …">${escapeHtml(cur.note || "")}</textarea>`;
      const range = el.querySelector("input");
      const ta = el.querySelector("textarea");
      range.addEventListener("input", () => {
        state.forces[f.key].v = Number(range.value);
        $("#val-" + f.key).textContent = range.value; save(); updateForcesResult();
      });
      ta.addEventListener("input", () => { state.forces[f.key].note = ta.value; save(); });
      box.appendChild(el);
    });
  }
  function updateForcesResult() {
    const vals = FORCES.map((f) => state.forces[f.key].v);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const attractiveness = ((5 - avg) / 4) * 100;
    const gauge = $("#forces-gauge");
    gauge.style.width = attractiveness + "%";
    let color = "var(--good)", verdict = "hohe Attraktivität";
    if (attractiveness < 35) { color = "var(--critical)"; verdict = "geringe Attraktivität"; }
    else if (attractiveness < 60) { color = "var(--warning)"; verdict = "mittlere Attraktivität"; }
    gauge.style.background = color;
    $("#forces-score").textContent = Math.round(attractiveness);
    $("#forces-verdict").textContent = verdict + " · Ø Kräfte " + avg.toFixed(1);
  }

  /* ---------- Stakeholder-Matrix ---------- */
  const stkForm = $("#stk-form");
  stkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(stkForm);
    const s = {
      name: String(fd.get("name")).trim(),
      power: clamp(Number(fd.get("power")), 1, 5),
      interest: clamp(Number(fd.get("interest")), 1, 5),
    };
    if (!s.name || !isFinite(s.power) || !isFinite(s.interest)) return;
    state.stakeholders.push(s); save(); stkForm.reset(); renderStkTable(); drawStakeholder();
  });
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function renderStkTable() {
    const tb = $("#stk-tbody"); tb.innerHTML = "";
    state.stakeholders.forEach((s, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(s.name)}</td><td>${s.power}</td><td>${s.interest}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.stakeholders.splice(i, 1); save(); renderStkTable(); drawStakeholder(); });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function drawStakeholder() {
    const canvas = $("#stk-canvas"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const pad = { l: 64, r: 24, t: 24, b: 52 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-primary"), muted = cssVar("--muted"), grid = cssVar("--grid"), surface = cssVar("--surface-1"), series = cssVar("--series-1");
    ctx.clearRect(0, 0, W, H);
    // x = Interesse (1..5, links niedrig), y = Macht (1..5, oben hoch)
    const xToPx = (i) => pad.l + ((clamp(i,1,5) - 1) / 4) * plotW;
    const yToPx = (p) => pad.t + (1 - (clamp(p,1,5) - 1) / 4) * plotH;
    const xMid = pad.l + plotW / 2, yMid = pad.t + plotH / 2;
    const quads = [
      { x: pad.l, y: pad.t, w: plotW/2, h: plotH/2, label: "Zufrieden halten", c: series },
      { x: xMid, y: pad.t, w: plotW/2, h: plotH/2, label: "Eng managen", c: cssVar("--good") },
      { x: pad.l, y: yMid, w: plotW/2, h: plotH/2, label: "Beobachten", c: muted },
      { x: xMid, y: yMid, w: plotW/2, h: plotH/2, label: "Informiert halten", c: cssVar("--warning") },
    ];
    quads.forEach((q) => {
      ctx.globalAlpha = 0.06; ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(q.label, q.x + q.w / 2, q.y + 8);
    });
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = cssVar("--baseline");
    ctx.beginPath(); ctx.moveTo(xMid, pad.t); ctx.lineTo(xMid, pad.t + plotH);
    ctx.moveTo(pad.l, yMid); ctx.lineTo(pad.l + plotW, yMid); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Interesse (niedrig → hoch)", pad.l + plotW / 2, H - 22);
    ctx.save(); ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle"; ctx.fillText("Macht (niedrig → hoch)", 0, 0); ctx.restore();
    // Punkte (leichtes Jitter gegen Überlappung identischer Positionen)
    const seen = {};
    state.stakeholders.forEach((s) => {
      const kkey = s.power + ":" + s.interest; const n = (seen[kkey] = (seen[kkey] || 0) + 1);
      const off = (n - 1) * 12;
      const cx = xToPx(s.interest) + off, cy = yToPx(s.power) + off;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = series; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      const nearRight = cx > pad.l + plotW * 0.72;
      ctx.textAlign = nearRight ? "right" : "left";
      ctx.fillText(s.name, cx + (nearRight ? -13 : 13), cy);
    });
    if (state.stakeholders.length === 0) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Stakeholder – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }

  /* ---------- BCG-Portfolio ---------- */
  const bcgForm = $("#bcg-form");
  bcgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(bcgForm);
    const unit = {
      name: String(fd.get("name")).trim(),
      growth: Number(fd.get("growth")), share: Number(fd.get("share")), revenue: Number(fd.get("revenue")),
    };
    if (!unit.name || !isFinite(unit.growth) || !(unit.share > 0) || !(unit.revenue >= 0)) return;
    state.bcg.push(unit); save(); bcgForm.reset(); renderBcgTable(); drawBCG();
  });
  function renderBcgTable() {
    const tb = $("#bcg-tbody"); tb.innerHTML = "";
    state.bcg.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(u.name)}</td><td>${u.growth}%</td><td>${u.share}×</td><td>${u.revenue}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.bcg.splice(i, 1); save(); renderBcgTable(); drawBCG(); });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function drawBCG() {
    const canvas = $("#bcg-canvas"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const pad = { l: 64, r: 24, t: 24, b: 52 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-primary"), muted = cssVar("--muted"), grid = cssVar("--grid"), surface = cssVar("--surface-1"), series = cssVar("--series-1");
    ctx.clearRect(0, 0, W, H);
    const xMin = Math.log10(0.1), xMax = Math.log10(10);
    const xToPx = (share) => {
      const v = Math.log10(Math.min(10, Math.max(0.1, share)));
      return pad.l + (1 - (v - xMin) / (xMax - xMin)) * plotW;
    };
    const maxGrowth = Math.max(20, ...state.bcg.map((u) => u.growth + 2));
    const yToPx = (g) => pad.t + (1 - Math.min(maxGrowth, Math.max(0, g)) / maxGrowth) * plotH;
    const xMid = xToPx(1), yMid = yToPx(10);
    const quad = [
      { x: pad.l, y: pad.t, w: xMid - pad.l, h: yMid - pad.t, label: "Stars", c: cssVar("--good") },
      { x: xMid, y: pad.t, w: pad.l + plotW - xMid, h: yMid - pad.t, label: "Question Marks", c: cssVar("--warning") },
      { x: pad.l, y: yMid, w: xMid - pad.l, h: pad.t + plotH - yMid, label: "Cash Cows", c: series },
      { x: xMid, y: yMid, w: pad.l + plotW - xMid, h: pad.t + plotH - yMid, label: "Dogs", c: muted },
    ];
    quad.forEach((q) => {
      ctx.globalAlpha = 0.06; ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(q.label, q.x + q.w / 2, q.y + 8);
    });
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = cssVar("--baseline");
    ctx.beginPath(); ctx.moveTo(xMid, pad.t); ctx.lineTo(xMid, pad.t + plotH);
    ctx.moveTo(pad.l, yMid); ctx.lineTo(pad.l + plotW, yMid); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Relativer Marktanteil (hoch → niedrig)", pad.l + plotW / 2, H - 22);
    [10, 1, 0.1].forEach((t) => ctx.fillText(t + "×", xToPx(t), pad.t + plotH + 6));
    ctx.save(); ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle"; ctx.fillText("Marktwachstum (%)", 0, 0); ctx.restore();
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 10, maxGrowth].forEach((g) => ctx.fillText(Math.round(g) + "%", pad.l - 8, yToPx(g)));
    const maxRev = Math.max(1, ...state.bcg.map((u) => u.revenue));
    state.bcg.forEach((u) => {
      const cx = xToPx(u.share), cy = yToPx(u.growth);
      const r = 10 + Math.sqrt(u.revenue / maxRev) * 32;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.55; ctx.fillStyle = series; ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(u.name, cx, cy);
    });
    if (state.bcg.length === 0) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Geschäftseinheiten – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }

  /* ---------- Balanced Scorecard ---------- */
  function buildBSC() {
    const root = $("#bsc-root"); root.innerHTML = "";
    BSC_VIEWS.forEach((p) => {
      if (!state.bsc[p.key]) state.bsc[p.key] = [];
      const card = document.createElement("div");
      card.className = "bsc-card";
      card.innerHTML = `<h3>${p.label}</h3>
        <table class="bsc-table"><thead><tr><th>Ziel</th><th>Kennzahl</th><th>Zielwert</th><th>Maßnahme</th><th></th></tr></thead>
        <tbody></tbody></table>
        <form class="bsc-form">
          <input type="text" name="ziel" placeholder="Ziel" required />
          <input type="text" name="kennzahl" placeholder="Kennzahl" />
          <input type="text" name="zielwert" placeholder="Zielwert" />
          <input type="text" name="massnahme" placeholder="Maßnahme" />
          <button type="submit">+</button>
        </form>`;
      const tbody = card.querySelector("tbody");
      const render = () => {
        tbody.innerHTML = "";
        state.bsc[p.key].forEach((row, i) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${escapeHtml(row.ziel)}</td><td>${escapeHtml(row.kennzahl)}</td><td>${escapeHtml(row.zielwert)}</td><td>${escapeHtml(row.massnahme)}</td>`;
          const td = document.createElement("td");
          const btn = document.createElement("button");
          btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
          btn.addEventListener("click", () => { state.bsc[p.key].splice(i, 1); save(); render(); });
          td.appendChild(btn); tr.appendChild(td); tbody.appendChild(tr);
        });
      };
      card.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const row = {
          ziel: String(fd.get("ziel")).trim(), kennzahl: String(fd.get("kennzahl")).trim(),
          zielwert: String(fd.get("zielwert")).trim(), massnahme: String(fd.get("massnahme")).trim(),
        };
        if (!row.ziel) return;
        state.bsc[p.key].push(row); save(); e.target.reset(); render();
      });
      root.appendChild(card);
      render();
    });
  }

  /* ---------- Footer-Aktionen ---------- */
  $("#btn-export").addEventListener("click", () => window.print());
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich alle Eingaben löschen?")) {
      state = defaultState(); save();
      $("#pestel-root").innerHTML = ""; $("#vc-support").innerHTML = "";
      $("#vc-primary").innerHTML = ""; $("#bmc-root").innerHTML = "";
      initAll();
    }
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { drawBCG(); drawStakeholder(); });
  }
  window.addEventListener("resize", () => {
    if ($("#view-bcg").classList.contains("is-active")) drawBCG();
    if ($("#view-stakeholder").classList.contains("is-active")) drawStakeholder();
  });

  function initAll() {
    SWOT_FIELDS.forEach(renderSwotList);
    renderTows();
    buildForces(); updateForcesResult();
    renderStkTable(); drawStakeholder();
    renderBcgTable(); drawBCG();
    initListTool("#pestel-root", state.pestel, PESTEL_CATS);
    initListTool("#vc-support", state.valuechain, VC_SUPPORT);
    initListTool("#vc-primary", state.valuechain, VC_PRIMARY);
    initListTool("#bmc-root", state.bmc, BMC_BLOCKS);
    buildBSC();
  }
  wireSwotForms();
  initAll();
})();
