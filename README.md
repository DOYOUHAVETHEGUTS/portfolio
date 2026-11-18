# Portfolio site

A small Python static site generator and the content that runs on it. Markdown
in, flat HTML out. No Node, no build toolchain, no framework to upgrade.

## Run it locally

**Windows (PowerShell):**

```powershell
cd portfolio
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt      # <- don't skip this
python serve.py
```

**macOS / Linux:**

```bash
cd portfolio
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt      # <- don't skip this
python serve.py
```

Creating the venv does **not** install anything into it — `pip install -r
requirements.txt` is a separate step, and skipping it is the most common reason
this won't start. Once your prompt shows `(.venv)`, run that install once; after
that, `python serve.py` is all you need.

That opens <http://localhost:8000>. Edit anything in `content/`, `templates/`,
`static/`, or `site.yaml` and the page rebuilds and reloads by itself. `Ctrl-C`
to stop.

To build without the server: `python build.py` — output lands in `dist/`.

### If something goes wrong

| Symptom | Cause and fix |
| --- | --- |
| `ModuleNotFoundError: jinja2` (or yaml, markdown, watchdog) | Dependencies aren't installed in the active environment. Activate the venv, then `pip install -r requirements.txt`. |
| `Could not start on port 8000` | Another process has the port. Use `python serve.py --port 8001`. |
| `Duplicate slug ...` / `Duplicate title ...` | Two files in `content/projects/` claim the same URL or name. The message names both — delete the older one. |
| The page looks out of date | You're viewing a stale `dist/`. Check the build time in the site footer; if it's old, stop the server, delete `dist/`, and run `python serve.py` again. |
| Auto-rebuild isn't happening | Run with `python serve.py --no-watch` to confirm the server itself works, then reinstall watchdog. |

## The order I'd do things in

1. **`site.yaml`** — set your GitHub and LinkedIn URLs (they still say
   `yourusername`), and set `base_url` to your domain before you deploy.
2. **`content/projects/*.md`** — fill in the remaining bracketed prompts. See
   "What still needs your input" below.
3. **`content/pages/about.md`** — one bracket left in the opening paragraph.

Every content file is full of bracketed prompts like `[what the data was]`.
They're there so you never face a blank page. Delete each one as you replace it.
Search for `[` before you publish to make sure none survived.

## Adding something new

```bash
python new.py project "Freight Demand Forecast" --track analytics
python new.py lab "Detecting scheduled task persistence"
```

Tracks are defined in `site.yaml` (`data-ai`, `analytics`, `security`,
`software`). The build fails loudly if a project claims a track that doesn't
exist — that's deliberate, it catches typos before they reach the site.

## How the pieces fit

```
site.yaml            identity, nav tracks, capabilities, links
content/projects/    one Markdown file per case study
content/lab/         short security writeups
content/pages/       standalone pages (about, and anything else)
templates/           Jinja2 — base, home, project, lab, page
static/              copied verbatim to the site root (css, js, img, files)
build.py             the generator: front matter -> HTML
serve.py             local preview with rebuild-on-save
new.py               scaffolds a new file with front matter filled in
dist/                generated output — never edit, never commit
```

### Front matter reference — projects

| Key | Notes |
| --- | --- |
| `title` | Shown everywhere |
| `slug` | URL segment: `/projects/<slug>/` |
| `track` | Must match an id in `site.yaml` |
| `featured` | Reserved for a future homepage highlight block |
| `order` | Sort position; lower is higher on the board |
| `year`, `period` | `year` sorts and displays; `period` is the manifest line |
| `status` | `active` shows "live", `archived` shows "arch", anything else is blank |
| `role`, `type` | Manifest strip |
| `summary` | One sentence — appears on the board, cards, and social previews |
| `stack` | List; the first three show on the board |
| `repo`, `demo` | Optional links |
| `draft: true` | Excludes the file from the build |

Images go in `static/img/` and are referenced as `/img/name.png`.

## Publishing to a domain

`dist/` is a plain folder of HTML. Any static host will take it.

1. Set `base_url: "https://yourdomain.com"` in `site.yaml` — this fixes canonical
   URLs and `sitemap.xml`.
2. Run `python build.py`.
3. Push `dist/` to a host:
   - **Cloudflare Pages / Netlify** — connect the GitHub repo, set the build
     command to `pip install -r requirements.txt && python build.py` and the
     output directory to `dist`. Custom domains are free on both.
   - **GitHub Pages** — a workflow that runs the same two commands and publishes
     `dist/`. Free, but you'll want a custom domain for a portfolio.
4. Point your domain's DNS at the host and let it issue the certificate.

Deploy the whole repo, not just `dist/` — the generator being visible is part of
the pitch. Add `dist/` and `.venv/` to `.gitignore` (already done).

## Adding a chart to one case study

The generator doesn't ship a chart library, because most pages don't need one.
When a page does, put the script in the Markdown directly:

```html
<div id="calibration"></div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>/* build the chart */</script>
```

Markdown passes raw HTML through untouched. If you end up wanting this on three
or more pages, that's the signal to move it into a template block instead.

## What still needs your input

Everything below is a real gap — the site builds and looks finished, but these
spots contain prompts rather than facts. Nothing here was invented for you.

### Identity — do this first (5 minutes)

- `site.yaml` — `GitHub` and `LinkedIn` still point at `yourusername`.
- `site.yaml` — `base_url` is empty. Set it to your domain before deploying so
  canonical URLs and `sitemap.xml` resolve.
- `content/projects/02-sports-model.md` and `03-market-data-automation.md` —
  the `repo:` fields point at `yourusername`. Fix or delete the line.

Your email is already set to the address from your résumé.

### Content gaps, by file

| File | Line | What's needed |
| --- | --- | --- |
| `projects/01-trucking-dashboard.md` | ~112 | **Results** — one concrete outcome: a decision it informed, or time saved vs. the old process. Highest-value single sentence on the site. |
| `projects/02-sports-model.md` | 33 | Which data `[sources]` you actually pull from |
| `projects/02-sports-model.md` | 73–74 | Leakage you caught; a feature that looked predictive and wasn't |
| `projects/03-market-data-automation.md` | 30 | Which market data `[source]` |
| `projects/03-market-data-automation.md` | ~60 | **Results** — runtime, how long it's run unattended, manual work replaced |
| `projects/05-security-lab.md` | 30 | `[N]` user accounts in the domain |
| `projects/05-security-lab.md` | 55 | Which benchmark you hardened against, or delete the clause |
| `projects/05-security-lab.md` | 57 | Which protocols/behaviors you examined in Wireshark |
| `projects/05-security-lab.md` | 59 | `[Add as you go]` — delete or extend |

Both lab writeups (`content/lab/`) are complete. `about.md`, `portfolio.md`, and
the four other case studies are complete.

### Before you deploy

- [ ] Set `base_url` in `site.yaml`
- [ ] Replace the `yourusername` links
- [ ] Fill the two **Results** sections
- [ ] Run `python build.py` and confirm it says "Built 14 pages"
- [ ] Search the repo for `[` in `content/` to catch anything left
