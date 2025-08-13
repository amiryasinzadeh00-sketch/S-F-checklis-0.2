(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // Defaults from your PDFs (swing/day/scalp) — editable in-app.
  const DEFAULTS = {
    rrMin: 2.5,
    weights: {
      sync: { WD: 10, D4: 10, ALL: 10 },
      swing: {
        "Weekly & Daily": [
          ["At/Rejected W AOI", 10],
          ["At/Rejected D AOI", 10],
          ["Touching/Rejecting W 50 EMA", 5],
          ["Touching/Rejecting D 50 EMA", 5],
          ["Round Psychological Level", 5],
          ["Rejection from W previous structure point", 10],
          ["Rejection from D previous structure point", 10],
          ["W Candlestick Rejection", 10],
          ["D Candlestick Rejection", 10],
          ["W Patterns - H&S / Double Top or Bottom", 10],
          ["D Patterns - H&S / Double Top or Bottom", 10]
        ],
        "4H": [
          ["Touching/Rejecting 50 EMA", 5],
          ["Candlestick Rejection", 10],
          ["Rejection from previous structure point", 5],
          ["Patterns", 10]
        ],
        "Entry": [
          ["Shift of Structure (required)", 10, "reqShift"],
          ["Engulfing (required)", 10, "reqEngulf"],
          ["Pattern", 5]
        ]
      },
      day: {
        "Daily & 4H": [
          ["At/Rejected D AOI", 10],
          ["At/Rejected 4H AOI", 5],
          ["Touching/Rejecting D 50 EMA", 5],
          ["Touching/Rejecting 4H 50 EMA", 5],
          ["Round Psychological Level", 5],
          ["Rejection from D previous structure point", 10],
          ["Rejection from 4H previous structure point", 5],
          ["D Candlestick Rejection", 10],
          ["4H Candlestick Rejection", 10],
          ["D Patterns - H&S / Double Top or Bottom", 10],
          ["4H Patterns - H&S / Double Top or Bottom", 10]
        ],
        "Entry": [
          ["Shift of Structure (required)", 10, "reqShift"],
          ["Engulfing (required)", 10, "reqEngulf"],
          ["Pattern", 5]
        ]
      },
      scalp: {
        "Sync (4H/2H/1H)": [
          ["4H & 2H in sync", 5],
          ["2H & 1H in sync", 5],
          ["All 3 aligned", 5]
        ],
        "4H & 2H": [
          ["At/Rejected 4H AOI", 5],
          ["At/Rejected 2H AOI", 5],
          ["Touching/Rejecting 4H 50 EMA", 5],
          ["Touching/Rejecting 2H 50 EMA", 5],
          ["Round Psychological Level", 5],
          ["Rejection from 4H previous structure point", 5],
          ["Rejection from 2H previous structure point", 5],
          ["4H Candlestick Rejection", 5],
          ["2H Candlestick Rejection", 5],
          ["4H Patterns - H&S / Double Top/Bottom", 5],
          ["2H Patterns - H&S / Double Top/Bottom", 5]
        ],
        "1H": [
          ["Touching/Rejecting 50 EMA", 5],
          ["Candlestick Rejection", 5],
          ["Rejection from previous structure point", 5],
          ["Patterns", 5]
        ],
        "Entry (1H / 30M / 15M)": [
          ["Shift of Structure (required)", 10, "reqShift"],
          ["Engulfing (required)", 10, "reqEngulf"]
        ]
      }
    }
  };

  // Local storage handling
  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem("cc_state") || "{}");
    } catch { return {}; }
  };
  const saveState = (obj) => localStorage.setItem("cc_state", JSON.stringify(obj));

  const S = Object.assign({}, DEFAULTS, loadState());

  // Populate months
  const monthEl = $("#month");
  MONTHS.forEach((m,i)=>{
    const opt = document.createElement("option");
    opt.value = i; opt.textContent = m;
    monthEl.appendChild(opt);
  });
  monthEl.value = new Date().getMonth();

  // Load persisted inputs
  $("#rrMin").value = S.rrMin || DEFAULTS.rrMin;
  $("#pair").value = S.pair || "";
  $("#bias").value = S.bias || "";
  $("#acctType").value = S.acctType || "Live";
  $("#tradeType").value = S.tradeType || "swing";
  $("#riskPct").value = S.riskPct || "";
  $("#rrPlanned").value = S.rrPlanned || "";
  $("#slBuffer").value = S.slBuffer || 6;
  $("#brokerUrl").value = S.brokerUrl || "";
  $("#tvUrl").value = S.tvUrl || "";
  $("#syncWD").checked = !!S.syncWD;
  $("#syncD4").checked = !!S.syncD4;
  $("#syncAll").checked = !!S.syncAll;

  // Theme toggle
  const THEM = localStorage.getItem("cc_theme") || "dark";
  if (THEM === "light") document.body.classList.add("light");
  $("#btnDark").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("cc_theme", document.body.classList.contains("light") ? "light" : "dark");
  });

  // Render sections based on trade type
  function renderSections() {
    const t = $("#tradeType").value;
    const box = $("#sections");
    box.innerHTML = "";
    const weights = (S.weights || DEFAULTS.weights)[t];
    for (const [group, items] of Object.entries(weights)) {
      const sec = document.createElement("div");
      sec.className = "section";
      const h3 = document.createElement("h3"); h3.textContent = group;
      sec.appendChild(h3);
      items.forEach(([name, pts, idKey]) => {
        const line = document.createElement("div");
        line.className = "line";
        const left = document.createElement("label");
        left.className = "check";
        const input = document.createElement("input");
        input.type = "checkbox";
        const key = keyFor(t, group, name);
        input.checked = !!S[key];
        input.addEventListener("change", () => { S[key] = input.checked; persist(); calc(); });
        left.appendChild(input);
        const span = document.createElement("span"); span.textContent = name;
        left.appendChild(span);
        const right = document.createElement("span"); right.className = "badge"; right.textContent = `+${pts}%`;
        line.appendChild(left); line.appendChild(right);
        sec.appendChild(line);

        // Wire required boxes to the global required toggles if idKey provided
        if (idKey === "reqShift") { $("#reqShift").checked = !!S[key]; input.addEventListener("change",()=>{$("#reqShift").checked=input.checked;}); $("#reqShift").addEventListener("change",()=>{input.checked=$("#reqShift").checked; S[key]=$("#reqShift").checked; persist(); calc();}); }
        if (idKey === "reqEngulf") { $("#reqEngulf").checked = !!S[key]; input.addEventListener("change",()=>{$("#reqEngulf").checked=input.checked;}); $("#reqEngulf").addEventListener("change",()=>{input.checked=$("#reqEngulf").checked; S[key]=$("#reqEngulf").checked; persist(); calc();}); }
      });
      box.appendChild(sec);
    }
  }

  function keyFor(t, g, n) { return `w:${t}|g:${g}|i:${n}`; }

  function persist(){
    S.pair = $("#pair").value;
    S.bias = $("#bias").value;
    S.acctType = $("#acctType").value;
    S.tradeType = $("#tradeType").value;
    S.riskPct = $("#riskPct").value;
    S.rrMin = parseFloat($("#rrMin").value||DEFAULTS.rrMin);
    S.rrPlanned = $("#rrPlanned").value;
    S.slBuffer = $("#slBuffer").value;
    S.brokerUrl = $("#brokerUrl").value;
    S.tvUrl = $("#tvUrl").value;
    S.syncWD = $("#syncWD").checked;
    S.syncD4 = $("#syncD4").checked;
    S.syncAll = $("#syncAll").checked;
    S.month = $("#month").value;
    localStorage.setItem("cc_state", JSON.stringify(S));
  }

  // Risk suggestions based on month + acct type (from strategy doc)
  function riskSuggestion(monthIndex, acctType) {
    // Best: Jan-Mar (0-2), Oct-Dec (9-11)
    const best = [0,1,2,9,10,11];
    // Slow: Jun, Jul (5,6)
    const slow = [5,6];
    const isBest = best.includes(monthIndex);
    const isSlow = slow.includes(monthIndex);
    if (acctType === "Live") {
      if (isBest) return "2–4%";
      if (isSlow) return "2%";
      return "2–3%";
    }
    if (acctType === "Funded") {
      if (isBest) return "2–3%";
      if (isSlow) return "1%";
      return "1–2%";
    }
    // Challenge
    if (isBest) return "0.5–1.5%";
    if (isSlow) return "0.5–1%";
    return "0.5–1%";
  }

  function calc() {
    const t = $("#tradeType").value;
    const weights = (S.weights || DEFAULTS.weights)[t];
    let total = 0;

    // Higher timeframe sync scoring: 10 + 10 + (extra 10 if both true)
    const WD = $("#syncWD").checked ? (S.weights.sync?.WD ?? 10) : 0;
    const D4 = $("#syncD4").checked ? (S.weights.sync?.D4 ?? 10) : 0;
    const allAuto = ($("#syncWD").checked && $("#syncD4").checked) ? (S.weights.sync?.ALL ?? 10) : 0;
    $("#syncAll").checked = allAuto > 0;
    total += WD + D4 + allAuto;

    // Sum checked confluences
    for (const [group, items] of Object.entries(weights)) {
      for (const [name, pts] of items) {
        const key = keyFor(t, group, name);
        if (S[key]) total += pts;
      }
    }

    // Grade boundaries (from doc)
    let grade = "—";
    if (total >= 90) grade = "A";
    else if (total >= 80) grade = "B";
    else if (total >= 70) grade = "C";
    else if (total >= 60) grade = "D";
    else if (total >= 50) grade = "F";
    $("#score").textContent = `${total}%`;
    $("#grade").textContent = grade;

    // Blockers (required checks + RR)
    let reason = "";
    const reqShift = $("#reqShift").checked;
    const reqEng = $("#reqEngulf").checked;
    const rrMin = parseFloat($("#rrMin").value || DEFAULTS.rrMin);
    const rrPlan = parseFloat($("#rrPlanned").value || "0");
    if (!reqShift) reason = "Shift of Structure is required.";
    else if (!reqEng) reason = "Engulfing confirmation is required.";
    else if (!rrPlan || rrPlan < rrMin) reason = `Planned RR must be ≥ ${rrMin}.`;
    $("#blocker").textContent = reason;
    $("#btnEnter").disabled = !!reason;

    // Risk advice
    const advice = riskSuggestion(parseInt($("#month").value,10), $("#acctType").value);
    $("#riskAdvice").textContent = advice;

    persist();
  }

  // Weights editor
  function renderWeightsEditor() {
    const box = $("#weightsEditor");
    box.innerHTML = "";
    const weights = S.weights || DEFAULTS.weights;

    // Sync group
    const gSync = document.createElement("div");
    gSync.className = "group";
    gSync.innerHTML = `<div class="small tag">Timeframe Sync Weights</div>`;
    for (const key of ["WD","D4","ALL"]) {
      const row = document.createElement("div");
      row.className = "row";
      const lab = document.createElement("label");
      lab.textContent = key === "WD" ? "W & D in sync" : key === "D4" ? "D & 4H in sync" : "All three align bonus";
      const inp = document.createElement("input");
      inp.type = "number"; inp.min = 0; inp.step = 1;
      inp.value = (weights.sync?.[key] ?? DEFAULTS.weights.sync[key]);
      inp.addEventListener("change", ()=>{
        weights.sync[key] = parseFloat(inp.value || 0);
        S.weights = weights; persist(); calc();
      });
      row.appendChild(lab); row.appendChild(inp);
      gSync.appendChild(row);
    }
    box.appendChild(gSync);

    // Mode groups
    for (const mode of ["swing","day","scalp"]) {
      const modeBox = document.createElement("div");
      modeBox.className = "group";
      const title = document.createElement("div");
      title.className = "small tag";
      title.textContent = `Weights: ${mode.toUpperCase()}`;
      modeBox.appendChild(title);
      for (const [group, items] of Object.entries(weights[mode])) {
        const gTitle = document.createElement("div");
        gTitle.style.fontWeight = "700";
        gTitle.style.margin = "6px 0";
        gTitle.textContent = group;
        modeBox.appendChild(gTitle);
        items.forEach((item, idx) => {
          const [name, pts] = item;
          const row = document.createElement("div");
          row.className = "row";
          const lab = document.createElement("label"); lab.textContent = name;
          const inp = document.createElement("input"); inp.type = "number"; inp.min = 0; inp.step = 1; inp.value = pts;
          inp.addEventListener("change", ()=>{
            weights[mode][group][idx][1] = parseFloat(inp.value || 0);
            S.weights = weights; persist(); calc();
          });
          row.appendChild(lab); row.appendChild(inp);
          modeBox.appendChild(row);
        });
      }
      box.appendChild(modeBox);
    }
  }

  // Share/copy ticket
  async function shareTicket() {
    const nl = "\n";
    const t = $("#tradeType").value;
    const name = t==="swing"?"Swing/Inter-Day":t==="day"?"Day Trade":"Scalp";
    const msg = [
      `Pair: ${$("#pair").value || "-"}`,
      `Bias: ${$("#bias").value || "-"}`,
      `Type: ${name}`,
      `Score: ${$("#score").textContent} | Grade: ${$("#grade").textContent}`,
      `RR: ${$("#rrPlanned").value || "-"} (min ${$("#rrMin").value})`,
      `Risk: ${$("#riskPct").value || "-"}% (suggested ${$("#riskAdvice").textContent})`,
      `SL buffer: ${$("#slBuffer").value || "-"} pips`,
      `Sync: W&D ${$("#syncWD").checked ? "✔" : "✘"}, D&4H ${$("#syncD4").checked ? "✔" : "✘"}, All ${$("#syncAll").checked ? "✔" : "✘"}`
    ].join(nl);

    if (navigator.share) {
      try { await navigator.share({ title: "Confluence Ticket", text: msg }); return; } catch(_){}
    }
    try {
      await navigator.clipboard.writeText(msg);
      alert("Copied to clipboard ✅");
    } catch {
      prompt("Copy your ticket:", msg);
    }
  }

  // Buttons
  $("#btnShare").addEventListener("click", shareTicket);
  $("#btnTV").addEventListener("click", ()=>{
    const url = $("#tvUrl").value.trim();
    if (url) window.open(url, "_blank");
    else alert("Add a TradingView URL in Settings.");
  });
  $("#btnBroker").addEventListener("click", ()=>{
    const url = $("#brokerUrl").value.trim();
    if (url) window.open(url, "_blank");
    else alert("Add your broker URL in Settings.");
  });
  $("#btnEnter").addEventListener("click", ()=>{
    shareTicket(); // on "enter" we just share the ticket & leave it to you to execute on your broker
  });
  $("#btnReset").addEventListener("click", ()=>{
    if (confirm("Reset all weights to defaults?")) {
      S.weights = DEFAULTS.weights;
      persist(); renderWeightsEditor(); renderSections(); calc();
    }
  });

  // Inputs events
  ["pair","bias","acctType","tradeType","riskPct","rrMin","rrPlanned","slBuffer","brokerUrl","tvUrl","month"].forEach(id=>{
    $( "#" + id ).addEventListener("input", ()=>{ persist(); if (id==="tradeType") { renderSections(); } calc(); });
  });
  $("#syncWD").addEventListener("change", ()=>{calc()});
  $("#syncD4").addEventListener("change", ()=>{calc()});

  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('./service-worker.js').catch(_=>{});
    });
  }

  renderSections();
  renderWeightsEditor();
  calc();
})();
