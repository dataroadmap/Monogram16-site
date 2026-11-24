# MarketLens — the website

The public site for **MarketLens**, built by the Monogram 16 cohort at DataRoadmap
during *API to Production*.

**Live:** https://dataroadmap.github.io/Monogram16-site/

| Page | What it is |
|---|---|
| `index.html` | What MarketLens is and how it was built |
| `dashboard.html` | Figures from the filings, charted in the browser |
| `chat.html` | The assistant — talks to the MarketLens backend |
| `team.html` | The eighteen people who built it |
| `materials.html` | Slides, code and notes from all eight sessions |

Plain HTML, CSS and JavaScript. No build step, no framework. Edit a file, push,
and GitHub Pages publishes it within a minute.

---

## The one moving part

Everything here is static except the assistant, which needs the MarketLens backend
(FastAPI + the databases + a language model). That backend runs on a laptop, so the
assistant answers during live sessions and shows an "offline" message the rest of
the time. **The rest of the site works either way.**

The address it calls lives in one file:

```js
// assets/config.js
window.MARKETLENS_API = "http://127.0.0.1:8000";
```

A browser will not let a page served over `https://` call a plain `http://` address,
so with the site on GitHub Pages the assistant works when you open the backend's own
address directly, or when the backend is reachable over `https://`.

---

## Updating the dashboard

The dashboard reads `data/facts.json`. Regenerate it from the MarketLens database:

```bash
pip install psycopg2-binary python-dotenv
python tools/export_facts.py
```

It needs `DATABASE_URL` in a `.env` file — the same value MarketLens uses. Commit the
JSON it writes and push.

---

## Running it locally

Opening `index.html` by double-clicking mostly works, but `fetch` is blocked on
`file://` addresses, so the team page and dashboard will look empty. Serve it instead:

```bash
python -m http.server 5500
```

Then open http://127.0.0.1:5500

---

## Students: editing your profile

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: edit your own entry in
`data/team.json`, open a pull request, done.

---

## Layout

```
index.html  dashboard.html  chat.html  team.html  materials.html
assets/
  styles.css      the whole theme — colours and type live here
  site.js         shared navigation and footer
  config.js       the backend address
  chat.js         the assistant
  dashboard.js    the charts
  team/           profile photos
data/
  team.json       the team page
  facts.json      the dashboard (generated)
tools/
  export_facts.py PostgreSQL -> data/facts.json
```
