/* Strategy Toolkit – SWOT, Five Forces, BCG-Portfolio
   Reiner Client, Persistenz über localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "strategy-toolkit-v1";
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const defaultState = () => ({
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    forces: {
      rivalry: { v: 3, note: "" },
      newEntrants: { v: 3, note: "" },
      suppliers: { v: 3, note: "" },
      buyers: { v: 3, note: "" },
      substitutes: { v: 3, note: "" },
    },
    bcg: [],
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      return defaultState();
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- Tab-Navigation ---------- */
  function showView(name) {
    $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + name));
    if (name === "bcg") drawBCG();
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

  /* ---------- SWOT ---------- */
  const SWOT_FIELDS = ["strengths", "weaknesses", "opportunities", "threats"];

  function renderSwotList(field) {
    const ul = $(`[data-list="${field}"]`);
    ul.innerHTML = "";
    state.swot[field].forEach((text, i) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = text;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Entfernen");
      btn.textContent = "×";
      btn.addEventListener("click", () => {
        state.swot[field].splice(i, 1);
        save(); renderSwotList(field); renderTows();
      });
      li.append(span, btn);
      ul.appendChild(li);
    });
  }

  $$(".add-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const field = form.dataset.add;
      const input = form.querySelector("input");
      const val = input.value.trim();
      if (!val) return;
      state.swot[field].push(val);
      input.value = "";
      save(); renderSwotList(field); renderTows();
    });
  });

  function renderTows() {
    const { strengths: S, weaknesses: W, opportunities: O, threats: T } = state.swot;
    const combine = (a, b) =>
      a.flatMap((x) => b.map((y) => `${x} × ${y}`)).slice(0, 6);
    const fill = (id, items) => {
      const ul = $("#" + id);
      ul.innerHTML = "";
      items.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        ul.appendChild(li);
      });
    };
    fill("tows-so", combine(S, O));
    fill("tows-st", combine(S, T));
    fill("tows-wo", combine(W, O));
    fill("tows-wt", combine(W, T));
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
    const box = $("#forces-list");
    box.innerHTML = "";
    FORCES.forEach((f) => {
      const cur = state.forces[f.key];
      const el = document.createElement("div");
      el.className = "force";
      el.innerHTML = `
        <div class="force-top"><h3>${f.label}</h3><span class="force-val" id="val-${f.key}">${cur.v}</span></div>
        <input type="range" min="1" max="5" step="1" value="${cur.v}" aria-label="${f.label}" />
        <div class="scale-hint"><span>1 – schwach</span><span>5 – stark</span></div>
        <textarea placeholder="Begründung / Notizen …">${cur.note || ""}</textarea>`;
      const range = el.querySelector("input");
      const ta = el.querySelector("textarea");
      range.addEventListener("input", () => {
        state.forces[f.key].v = Number(range.value);
        $("#val-" + f.key).textContent = range.value;
        save(); updateForcesResult();
      });
      ta.addEventListener("input", () => { state.forces[f.key].note = ta.value; save(); });
      box.appendChild(el);
    });
  }

  function updateForcesResult() {
    const vals = FORCES.map((f) => state.forces[f.key].v);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length; // 1..5, hoch = starke Kräfte
    const attractiveness = ((5 - avg) / 4) * 100; // 0..100, hoch = attraktiv
    const gauge = $("#forces-gauge");
    gauge.style.width = attractiveness + "%";
    let color = "var(--good)", verdict = "hohe Attraktivität";
    if (attractiveness < 35) { color = "var(--critical)"; verdict = "geringe Attraktivität"; }
    else if (attractiveness < 60) { color = "var(--warning)"; verdict = "mittlere Attraktivität"; }
    gauge.style.background = color;
    $("#forces-score").textContent = Math.round(attractiveness);
    $("#forces-verdict").textContent = verdict + " · Ø Kräfte " + avg.toFixed(1);
  }

  /* ---------- BCG-Portfolio ---------- */
  const bcgForm = $("#bcg-form");
  bcgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(bcgForm);
    const unit = {
      name: String(fd.get("name")).trim(),
      growth: Number(fd.get("growth")),
      share: Number(fd.get("share")),
      revenue: Number(fd.get("revenue")),
    };
    if (!unit.name || !isFinite(unit.growth) || !(unit.share > 0) || !(unit.revenue >= 0)) return;
    state.bcg.push(unit);
    save(); bcgForm.reset(); renderBcgTable(); drawBCG();
  });

  function renderBcgTable() {
    const tb = $("#bcg-tbody");
    tb.innerHTML = "";
    state.bcg.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(u.name)}</td><td>${u.growth}%</td><td>${u.share}×</td><td>${u.revenue}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.bcg.splice(i, 1); save(); renderBcgTable(); drawBCG(); });
      td.appendChild(btn); tr.appendChild(td);
      tb.appendChild(tr);
    });
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawBCG() {
    const canvas = $("#bcg-canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const pad = { l: 64, r: 24, t: 24, b: 52 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;

    const ink = cssVar("--text-primary") || "#0b0b0b";
    const muted = cssVar("--muted") || "#898781";
    const grid = cssVar("--grid") || "#e1e0d9";
    const surface = cssVar("--surface-1") || "#fcfcfb";
    const series = cssVar("--series-1") || "#2a78d6";

    ctx.clearRect(0, 0, W, H);

    // x-Achse: relativer Marktanteil, log, 10 (links) -> 0.1 (rechts), Grenze bei 1
    const xMin = Math.log10(0.1), xMax = Math.log10(10);
    const xToPx = (share) => {
      const v = Math.log10(Math.min(10, Math.max(0.1, share)));
      // hoher Anteil links -> invertieren
      return pad.l + (1 - (v - xMin) / (xMax - xMin)) * plotW;
    };
    // y-Achse: Marktwachstum 0..maxGrowth (oben hoch), Grenze bei 10
    const maxGrowth = Math.max(20, ...state.bcg.map((u) => u.growth + 2));
    const yToPx = (g) => pad.t + (1 - Math.min(maxGrowth, Math.max(0, g)) / maxGrowth) * plotH;

    // Quadranten-Hintergründe (dezent)
    const xMid = xToPx(1), yMid = yToPx(10);
    const quad = [
      { x: pad.l, y: pad.t, w: xMid - pad.l, h: yMid - pad.t, label: "Stars", c: cssVar("--good") },
      { x: xMid, y: pad.t, w: pad.l + plotW - xMid, h: yMid - pad.t, label: "Question Marks", c: cssVar("--warning") },
      { x: pad.l, y: yMid, w: xMid - pad.l, h: pad.t + plotH - yMid, label: "Cash Cows", c: series },
      { x: xMid, y: yMid, w: pad.l + plotW - xMid, h: pad.t + plotH - yMid, label: "Dogs", c: muted },
    ];
    quad.forEach((q) => {
      ctx.globalAlpha = 0.06; ctx.fillStyle = q.c;
      ctx.fillRect(q.x, q.y, q.w, q.h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(q.label, q.x + q.w / 2, q.y + 8);
    });

    // Rahmen + Mittellinien
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = cssVar("--baseline") || "#c3c2b7";
    ctx.beginPath(); ctx.moveTo(xMid, pad.t); ctx.lineTo(xMid, pad.t + plotH);
    ctx.moveTo(pad.l, yMid); ctx.lineTo(pad.l + plotW, yMid); ctx.stroke();
    ctx.setLineDash([]);

    // Achsentitel + Ticks
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Relativer Marktanteil (hoch → niedrig)", pad.l + plotW / 2, H - 22);
    [10, 1, 0.1].forEach((t) => ctx.fillText(t + "×", xToPx(t), pad.t + plotH + 6));
    ctx.save();
    ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle"; ctx.fillText("Marktwachstum (%)", 0, 0);
    ctx.restore();
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 10, maxGrowth].forEach((g) => ctx.fillText(Math.round(g) + "%", pad.l - 8, yToPx(g)));

    // Blasen (Umsatz -> Radius)
    const maxRev = Math.max(1, ...state.bcg.map((u) => u.revenue));
    state.bcg.forEach((u) => {
      const cx = xToPx(u.share), cy = yToPx(u.growth);
      const r = 10 + Math.sqrt(u.revenue / maxRev) * 32;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.55; ctx.fillStyle = series; ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(u.name, cx, cy);
    });

    if (state.bcg.length === 0) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Geschäftseinheiten – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Footer-Aktionen ---------- */
  $("#btn-export").addEventListener("click", () => window.print());
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich alle Eingaben löschen?")) {
      state = defaultState(); save(); initAll();
    }
  });

  /* Redraw bei Theme-Wechsel */
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawBCG);
  }
  window.addEventListener("resize", () => { if ($("#view-bcg").classList.contains("is-active")) drawBCG(); });

  function initAll() {
    SWOT_FIELDS.forEach(renderSwotList);
    renderTows();
    buildForces();
    updateForcesResult();
    renderBcgTable();
    drawBCG();
  }
  initAll();
})();
