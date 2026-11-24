// dashboard.js — reads data/facts.json and draws it. No server involved.
"use strict";

const COLORS = ["#d97757", "#3f6f8a", "#8a6f3f", "#5a8a5f", "#8a3f6f", "#4a4a8a", "#8a7a3f"];

const state = { data: null, metric: null, tickers: new Set(), chart: null };

function money(value) {
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (value / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(1) + "K";
  return String(value);
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
}

function rowsFor(metric) {
  return state.data.rows.filter((r) => r.tag === metric);
}

function buildMetricSelect() {
  const select = document.getElementById("metric");
  const metrics = uniqueSorted(state.data.rows.map((r) => r.tag));
  select.replaceChildren();
  for (const m of metrics) {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = (state.data.labels && state.data.labels[m]) || m;
    select.append(option);
  }
  state.metric = metrics[0];
  select.value = state.metric;
  select.addEventListener("change", () => {
    state.metric = select.value;
    draw();
  });
}

function buildCompanyChips() {
  const box = document.getElementById("company-chips");
  const tickers = uniqueSorted(state.data.rows.map((r) => r.ticker));
  box.replaceChildren();
  for (const t of tickers) {
    state.tickers.add(t);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip active";
    button.textContent = (state.data.companies && state.data.companies[t]) || t;
    button.addEventListener("click", () => {
      if (state.tickers.has(t)) state.tickers.delete(t);
      else state.tickers.add(t);
      button.classList.toggle("active", state.tickers.has(t));
      draw();
    });
    box.append(button);
  }
}

function draw() {
  const rows = rowsFor(state.metric).filter((r) => state.tickers.has(r.ticker));
  const years = uniqueSorted(rows.map((r) => r.fiscal_year));
  const tickers = uniqueSorted(rows.map((r) => r.ticker));
  const label = (state.data.labels && state.data.labels[state.metric]) || state.metric;

  document.getElementById("chart-title").textContent = label + " over time";
  document.getElementById("chart-note").textContent =
    tickers.length ? `${tickers.length} companies · fiscal ${years[0]} to ${years[years.length - 1]}` : "Pick at least one company.";
  document.getElementById("table-title").textContent = label + ", by year";

  // ----- line chart
  const datasets = tickers.map((t, i) => ({
    label: (state.data.companies && state.data.companies[t]) || t,
    data: years.map((y) => {
      const hit = rows.find((r) => r.ticker === t && r.fiscal_year === y);
      return hit ? hit.value : null;
    }),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: COLORS[i % COLORS.length],
    tension: 0.25,
    spanGaps: true,
    pointRadius: 3,
    borderWidth: 2,
  }));

  if (state.chart) state.chart.destroy();
  state.chart = new Chart(document.getElementById("line-chart"), {
    type: "line",
    data: { labels: years.map(String), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${money(c.parsed.y)}` } },
      },
      scales: {
        y: { ticks: { callback: (v) => money(v) }, grid: { color: "rgba(128,128,128,.15)" } },
        x: { grid: { display: false } },
      },
    },
  });

  // ----- table
  const table = document.getElementById("facts-table");
  table.replaceChildren();

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "Company";
  headRow.append(corner);
  for (const y of years) {
    const th = document.createElement("th");
    th.textContent = "FY" + y;
    headRow.append(th);
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (const t of tickers) {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    name.textContent = (state.data.companies && state.data.companies[t]) || t;
    tr.append(name);
    for (const y of years) {
      const td = document.createElement("td");
      const hit = rows.find((r) => r.ticker === t && r.fiscal_year === y);
      td.textContent = hit ? money(hit.value) : "—";
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
}

async function load() {
  try {
    const response = await fetch("data/facts.json");
    if (!response.ok) throw new Error("missing");
    const data = await response.json();
    if (!data.rows || !data.rows.length) throw new Error("empty");

    state.data = data;
    document.getElementById("dash").classList.remove("hidden");
    document.getElementById("updated").textContent = data.generated || "—";
    buildMetricSelect();
    buildCompanyChips();
    draw();
  } catch (error) {
    document.getElementById("no-data").classList.remove("hidden");
  }
}

load();
