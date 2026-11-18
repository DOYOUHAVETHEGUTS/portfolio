#!/usr/bin/env python3
"""
Build a single self-contained HTML file of the whole portfolio — every case
study, the About page, and the project index — inlined with the site's CSS so it
opens on a double-click with no server and can be attached to a job application.

    python build_standalone.py   ->  dist_standalone/KeAndre_Williams_Portfolio.html

Interactive demos are not inlined (they're separate apps); the file links to the
live site for those, and reads as a complete written portfolio on its own.
"""

from __future__ import annotations

import re
from pathlib import Path

import markdown
import yaml

ROOT = Path(__file__).parent.resolve()
CONTENT = ROOT / "content"
OUT = ROOT / "dist_standalone"

MD = markdown.Markdown(extensions=["extra", "sane_lists", "codehilite", "toc", "admonition"])


def render_md(text: str) -> str:
    MD.reset()
    return MD.convert(text)


def split_front_matter(raw: str):
    if raw.startswith("---"):
        _, fm, body = raw.split("---", 2)
        return yaml.safe_load(fm) or {}, body.strip()
    return {}, raw.strip()


def load(folder: str):
    items = []
    for path in sorted((CONTENT / folder).glob("*.md")):
        meta, body = split_front_matter(path.read_text(encoding="utf-8"))
        meta["_body"] = body
        items.append(meta)
    return items


def commas(seq):
    return ", ".join(seq or [])


def main() -> None:
    site = yaml.safe_load((ROOT / "site.yaml").read_text(encoding="utf-8"))
    css = (ROOT / "static" / "css" / "site.css").read_text(encoding="utf-8")

    projects = sorted(load("projects"), key=lambda p: p.get("order", 999))
    labs = sorted(load("lab"), key=lambda p: str(p.get("date", "")), reverse=True)
    about = next((p for p in load("pages") if p.get("title") == "About"), None)

    base = (site.get("base_url") or "").rstrip("/")
    live = f'<a href="{base}/">{base or "the live site"}</a>' if base else "the live site"

    parts = []
    parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{site['name']} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
<style>
{css}

/* Standalone-only overrides: this is one long scroll, not a multi-page site. */
body {{ }}
.sa-wrap {{ max-width: var(--measure); margin: 0 auto; padding: 0 var(--step); }}
.sa-hero {{ padding: clamp(2.5rem,6vw,4rem) 0 2rem; border-bottom: 1px solid var(--ink); }}
.sa-hero h1 {{ font-size: clamp(2rem,5vw,3rem); font-weight: 600; letter-spacing: -.02em; margin: .3rem 0 0; }}
.sa-hero .role {{ font-family: var(--mono); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); }}
.sa-hero .lede {{ font-family: var(--body); font-size: 1.15rem; color: var(--ink-muted); max-width: 60ch; margin: 1rem 0 0; }}
.sa-contact {{ font-family: var(--mono); font-size: .72rem; margin-top: 1.25rem; display: flex; gap: 1.25rem; flex-wrap: wrap; }}
.sa-contact a {{ color: var(--accent); text-decoration: none; }}
.sa-note {{ font-family: var(--mono); font-size: .62rem; color: var(--ink-faint); background: var(--accent-dim); padding: .5rem .75rem; margin-top: 1.5rem; }}
.sa-toc {{ padding: 2rem 0; border-bottom: 1px solid var(--rule); }}
.sa-toc p {{ font-family: var(--mono); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); margin: 0 0 .75rem; }}
.sa-toc ol {{ columns: 2; column-gap: 2rem; margin: 0; padding-left: 1.1rem; }}
.sa-toc a {{ color: var(--ink); text-decoration: none; }}
.sa-toc a:hover {{ color: var(--accent); }}
.sa-section {{ padding: clamp(2.5rem,6vw,4rem) 0; border-bottom: 1px solid var(--rule); }}
.sa-section > .kicker {{ font-family: var(--mono); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); }}
.sa-proj-meta {{ font-family: var(--mono); font-size: .66rem; color: var(--ink-faint); display: flex; gap: 1rem; flex-wrap: wrap; margin: .5rem 0 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--rule-soft); }}
.sa-proj-meta b {{ color: var(--ink-muted); font-weight: 500; }}
.sa-demo-link {{ font-family: var(--mono); font-size: .7rem; }}
.sa-body h2 {{ font-size: 1.4rem; margin-top: 2rem; }}
.sa-body h3 {{ font-size: 1.1rem; margin-top: 1.5rem; }}
.sa-body pre {{ background: var(--panel); color: #E8E6DF; padding: 1rem; overflow-x: auto; font-size: .8rem; border-radius: 3px; }}
.sa-body code {{ font-family: var(--mono); font-size: .85em; }}
.sa-body table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .9rem; }}
.sa-body th, .sa-body td {{ text-align: left; padding: .4rem .6rem; border-bottom: 1px solid var(--rule-soft); }}
.sa-foot {{ padding: 2rem 0 3rem; font-family: var(--mono); font-size: .62rem; color: var(--ink-faint); }}
</style>
</head>
<body>
<div class="sa-wrap">

<header class="sa-hero">
  <p class="role">{site.get('role','')}</p>
  <h1>{site['name']}</h1>
  <p class="lede">{site.get('tagline','')}</p>
  <div class="sa-contact">""")

    if site.get("email"):
        parts.append(f'<a href="mailto:{site["email"]}">{site["email"]}</a>')
    links = site.get("links", {})
    for label, url in links.items():
        if "yourusername" not in url:
            parts.append(f'<a href="{url}">{label}</a>')
    if base:
        parts.append(f'<a href="{base}/">{base.replace("https://","")}</a>')

    parts.append("""</div>
  <p class="sa-note">Self-contained portfolio document. Interactive demos run on the live site; everything else reads here in full.</p>
</header>

<nav class="sa-toc">
  <p>Contents</p>
  <ol>""")
    for p in projects:
        parts.append(f'<li><a href="#{p["slug"]}">{p["title"]}</a></li>')
    parts.append('<li><a href="#about">About</a></li>')
    for lab in labs:
        parts.append(f'<li><a href="#{lab["slug"]}">Lab — {lab["title"]}</a></li>')
    parts.append("</ol></nav>")

    # Projects
    for p in projects:
        meta_bits = []
        if p.get("type"):
            meta_bits.append(f'<span><b>{p["type"]}</b></span>')
        if p.get("stack"):
            meta_bits.append(f'<span>Stack: {commas(p["stack"])}</span>')
        if p.get("status"):
            meta_bits.append(f'<span>Status: {p["status"]}</span>')
        if p.get("role"):
            meta_bits.append(f'<span>{p["role"]}</span>')
        demo = ""
        if p.get("demo") and base:
            demo = f'<p class="sa-demo-link">▶ Live demo: <a href="{base}{p["demo"]}">{base}{p["demo"]}</a></p>'
        elif p.get("demo"):
            demo = f'<p class="sa-demo-link">▶ Interactive demo available on the live site ({p["demo"]})</p>'
        parts.append(f"""<section class="sa-section" id="{p['slug']}">
  <p class="kicker">Project</p>
  <h1 style="font-size:1.7rem;font-weight:600;letter-spacing:-.02em;margin:.3rem 0 0;">{p['title']}</h1>
  <div class="sa-proj-meta">{''.join(meta_bits)}</div>
  {demo}
  <div class="sa-body">{render_md(p['_body'])}</div>
</section>""")

    # About
    if about:
        parts.append(f"""<section class="sa-section" id="about">
  <p class="kicker">About</p>
  <h1 style="font-size:1.7rem;font-weight:600;letter-spacing:-.02em;margin:.3rem 0 1rem;">About</h1>
  <div class="sa-body">{render_md(about['_body'])}</div>
</section>""")

    # Labs
    for lab in labs:
        parts.append(f"""<section class="sa-section" id="{lab['slug']}">
  <p class="kicker">Security lab · {lab.get('date','')}</p>
  <h1 style="font-size:1.7rem;font-weight:600;letter-spacing:-.02em;margin:.3rem 0 1rem;">{lab['title']}</h1>
  <div class="sa-body">{render_md(lab['_body'])}</div>
</section>""")

    parts.append(f"""<footer class="sa-foot">
  <p>{site['name']} — portfolio document. {"Live site: " + base if base else "Not yet deployed."}</p>
</footer>
</div>
</body>
</html>""")

    OUT.mkdir(exist_ok=True)
    out_file = OUT / "KeAndre_Williams_Portfolio.html"
    out_file.write_text("\n".join(parts), encoding="utf-8")
    kb = out_file.stat().st_size / 1024
    print(f"Wrote {out_file} ({kb:.0f} KB, {len(projects)} projects, {len(labs)} labs)")


if __name__ == "__main__":
    main()
