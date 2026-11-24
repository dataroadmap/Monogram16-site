// Shared navigation and footer, so there is one copy to edit instead of five.
// Each page sets <body data-page="home"> and includes <div id="nav"></div> and <div id="foot"></div>.
"use strict";

const PAGES = [
  { id: "home",      href: "index.html",     label: "Home" },
  { id: "dashboard", href: "dashboard.html", label: "Dashboard" },
  { id: "chat",      href: "chat.html",      label: "Chatbot" },
  { id: "team",      href: "team.html",      label: "Team" },
  { id: "materials", href: "materials.html", label: "Course" },
];

const LOGO = `<span class="logo" aria-hidden="true">
  <svg viewBox="0 0 24 24" stroke-width="2.6" stroke-linecap="round">
    <circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5 21 21"></path>
  </svg></span>`;

function buildNav(current) {
  const links = PAGES.map(
    (p) => `<a href="${p.href}"${p.id === current ? ' class="active" aria-current="page"' : ""}>${p.label}</a>`
  ).join("");
  return `<nav class="nav"><div class="nav-inner">
      <a class="brand" href="index.html">${LOGO}MarketLens<span> · DataRoadmap</span></a>
      <div class="nav-links">${links}</div>
    </div></nav>`;
}

function buildFooter() {
  return `<footer><div class="wrap foot-inner">
      <div>Built by the <b>Monogram 16</b> cohort · DataRoadmap</div>
      <div>From API to Production · ${new Date().getFullYear()}</div>
    </div></footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  const nav = document.getElementById("nav");
  const foot = document.getElementById("foot");
  if (nav) nav.outerHTML = buildNav(page);
  if (foot) foot.outerHTML = buildFooter();
});
