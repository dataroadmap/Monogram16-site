// chat.js — the page only ASKS. It has no data and no model.
// It sends POST /ask to whatever address assets/config.js names, and shows what
// comes back. Everything is written with textContent, never innerHTML, so text
// from the model can not inject HTML.
"use strict";

const API = (window.MARKETLENS_API || "").replace(/\/+$/, "");
const SECTION_NAMES = { "1": "Business", "1A": "Risk factors", "7": "MD&A" };

// ---------------------------------------------------------------- pure helpers
// Turns "Sales rose [NVDA FY2024 Item 7]." into text and citation pieces.
function splitCitations(text) {
  const parts = [];
  const re = /\[([^\[\]]{2,90})\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1];
    const isCitation = /FY\d{4}/.test(inner) || inner.trim().toLowerCase() === "database";
    if (!isCitation) continue;
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "cite", value: inner });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

// A friendly message for each HTTP status (the numbers from the slides).
function describeError(status, detail) {
  const text = typeof detail === "string" ? detail : "";
  if (status === 404) return { title: "Error 404 · nothing found", text: text || "No matching text was found.",
                               hint: "Try another company, or set the year to Any." };
  if (status === 422) return { title: "Error 422 · wrong shape", text: "The question is missing or too short.",
                               hint: "Write at least three characters." };
  if (status === 503) return { title: "Error 503 · a part of the system is off", text: text || "The AI model is not reachable.",
                               hint: "Check that Ollama is running, then try again." };
  if (status >= 500) return { title: `Error ${status} · the server broke`, text: text || "Something failed on the server.",
                              hint: "Read the terminal where uvicorn is running." };
  return { title: `Error ${status}`, text: text || "The request was not accepted.", hint: "" };
}

// ---------------------------------------------------------------- the page
function init() {
  const $ = (id) => document.getElementById(id);
  const questionBox = $("question");
  const yearSelect = $("year");
  const askButton = $("ask-button");
  const offlineNote = $("offline-note");
  const chips = Array.from(document.querySelectorAll("#company-chips .chip"));
  let selectedTicker = "";
  let timer = null;
  let lastText = "";
  let online = false;

  // ----- server status (GET /health)
  async function checkHealth() {
    const pill = $("status-pill");
    const label = $("status-text");
    try {
      const h = await (await fetch(API + "/health")).json();
      online = Boolean(h.ollama && h.chroma_chunks);
      if (online) {
        pill.className = "pill ok";
        label.textContent = `Ready · ${h.chroma_chunks.toLocaleString("en-US")} passages`;
      } else if (!h.ollama) {
        pill.className = "pill warn";
        label.textContent = "AI model is off";
      } else {
        pill.className = "pill warn";
        label.textContent = "Filings database not found";
      }
    } catch (error) {
      online = false;
      pill.className = "pill bad";
      label.textContent = "Assistant offline";
    }
    offlineNote.classList.toggle("hidden", online);
  }

  // ----- company chips
  function selectTicker(ticker) {
    selectedTicker = ticker;
    for (const chip of chips) {
      const on = chip.dataset.ticker === ticker;
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-checked", String(on));
    }
  }
  for (const chip of chips) chip.addEventListener("click", () => selectTicker(chip.dataset.ticker));

  // ----- examples
  for (const ex of document.querySelectorAll(".example")) {
    ex.addEventListener("click", () => {
      questionBox.value = ex.dataset.q;
      selectTicker(ex.dataset.ticker || "");
      yearSelect.value = ex.dataset.year || "";
      growBox();
      questionBox.focus();
    });
  }

  // ----- textarea grows with the text
  function growBox() {
    questionBox.style.height = "auto";
    questionBox.style.height = Math.min(questionBox.scrollHeight, 260) + "px";
  }
  questionBox.addEventListener("input", growBox);

  // ----- states: loading / error / result
  function show(which) {
    for (const id of ["loading", "error", "result"]) $(id).classList.toggle("hidden", id !== which);
  }
  function startLoading() {
    askButton.disabled = true;
    show("loading");
    let seconds = 0;
    $("elapsed").textContent = "0";
    timer = setInterval(() => { seconds += 1; $("elapsed").textContent = String(seconds); }, 1000);
  }
  function stopLoading() {
    askButton.disabled = false;
    clearInterval(timer);
  }
  function showError(info) {
    $("error-title").textContent = info.title;
    $("error-text").textContent = info.text;
    $("error-hint").textContent = info.hint;
    show("error");
  }

  // ----- the answer
  function addBadge(parent, text, accent) {
    const b = document.createElement("span");
    b.className = accent ? "badge accent" : "badge";
    b.textContent = text;
    parent.append(b);
  }

  function renderResult(data) {
    const meta = $("meta");
    meta.replaceChildren();
    if (data.ticker) addBadge(meta, data.ticker, true);
    if (data.year) addBadge(meta, `FY${data.year}`, false);
    addBadge(meta, data.used_database_numbers ? "uses database numbers" : "text only", false);
    if (data.model) addBadge(meta, data.model, false);

    const box = $("answer");
    box.replaceChildren();
    const paragraphs = data.answer.split(/\n{2,}/).filter((p) => p.trim() !== "");
    for (const para of (paragraphs.length ? paragraphs : [data.answer])) {
      const p = document.createElement("p");
      for (const piece of splitCitations(para.trim())) {
        if (piece.type === "cite") {
          const tag = document.createElement("span");
          tag.className = "cite";
          tag.textContent = piece.value;
          p.append(tag);
        } else {
          p.append(document.createTextNode(piece.value));
        }
      }
      box.append(p);
    }

    const list = $("sources");
    list.replaceChildren();
    (data.sources || []).forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "source";
      const num = document.createElement("div");
      num.className = "num";
      num.textContent = String(i + 1);
      const body = document.createElement("div");
      const title = document.createElement("div");
      title.className = "source-title";
      title.textContent = `${s.ticker} · FY${s.fiscal_year} `;
      const where = document.createElement("span");
      where.textContent = `${SECTION_NAMES[s.section] || "Section"} (Item ${s.section})`;
      title.append(where);
      const text = document.createElement("p");
      text.className = "source-text";
      text.textContent = s.snippet + " …";
      body.append(title, text);
      row.append(num, body);
      list.append(row);
    });
    $("source-count").textContent = (data.sources || []).length ? `(${data.sources.length})` : "";

    lastText = data.answer + "\n\nSources:\n" +
      (data.sources || []).map((s) => `- ${s.ticker} FY${s.fiscal_year} Item ${s.section}`).join("\n");
    $("copy-button").textContent = "Copy";
    show("result");
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ----- ask (POST /ask)
  async function ask() {
    const question = questionBox.value.trim();
    if (question.length < 3) {
      showError({ title: "Write a question first", text: "Type at least three characters.", hint: "" });
      return;
    }
    const body = { question };
    if (selectedTicker) body.ticker = selectedTicker;
    if (yearSelect.value) body.year = Number(yearSelect.value);

    startLoading();
    try {
      // 1. the request goes out
      const response = await fetch(API + "/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // 2. the response comes back: a number, then JSON
      let data = null;
      try { data = await response.json(); } catch (e) { /* no JSON in the answer */ }

      if (!response.ok) showError(describeError(response.status, data && data.detail));
      else renderResult(data);
    } catch (error) {
      // "no number": nothing is running at that address
      showError({
        title: "The assistant is offline",
        text: "Nothing answered at this address.",
        hint: "It runs on a laptop during live sessions. You can also run it yourself from the repository.",
      });
    } finally {
      stopLoading();
      checkHealth();
    }
  }

  askButton.addEventListener("click", ask);
  questionBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) ask();
  });

  $("copy-button").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(lastText);
      $("copy-button").textContent = "Copied";
    } catch (e) {
      $("copy-button").textContent = "Press Ctrl + C";
    }
  });

  checkHealth();
}

if (typeof document !== "undefined") init();
