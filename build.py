#!/usr/bin/env python3
"""
Static site generator for the portfolio.

    python build.py            build once into dist/
    python build.py --dev      build with the live-reload client injected

Content lives in content/ as Markdown with YAML front matter. Templates live in
templates/. Anything in static/ is copied to the site root. Nothing else is
magic — read `build()` at the bottom to see the whole pipeline.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pygments.formatters import HtmlFormatter

ROOT = Path(__file__).parent.resolve()
CONTENT = ROOT / "content"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"

FRONT_MATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)

MD_EXTENSIONS = [
    "extra",          # tables, footnotes, fenced code, attribute lists
    "admonition",     # !!! note blocks
    "toc",
    "sane_lists",
    "codehilite",
]
MD_CONFIG = {
    "codehilite": {"guess_lang": False, "css_class": "highlight"},
    "toc": {"permalink": False, "toc_depth": "2-3"},
}


# ---------------------------------------------------------------------------
# Content model
# ---------------------------------------------------------------------------

@dataclass
class Doc:
    """One Markdown file: its front matter, its rendered body, its URL."""
    source: Path
    meta: dict
    body_md: str
    html: str = ""
    toc: str = ""

    @property
    def slug(self) -> str:
        return self.meta.get("slug") or self.source.stem

    @property
    def title(self) -> str:
        return self.meta.get("title", self.slug.replace("-", " ").title())

    @property
    def url(self) -> str:
        return self.meta["url"]

    @property
    def stack(self) -> list[str]:
        return self.meta.get("stack", []) or []

    def __getattr__(self, key):
        # Lets templates write project.summary instead of project.meta.summary.
        try:
            return self.__dict__["meta"][key]
        except KeyError:
            return None


def read_doc(path: Path) -> Doc:
    raw = path.read_text(encoding="utf-8")
    match = FRONT_MATTER.match(raw)
    if not match:
        raise SystemExit(
            f"{path.relative_to(ROOT)}: missing YAML front matter.\n"
            "Every content file must start with a --- fenced block."
        )
    meta = yaml.safe_load(match.group(1)) or {}
    return Doc(source=path, meta=meta, body_md=match.group(2))


def render_markdown(doc: Doc) -> None:
    md = markdown.Markdown(extensions=MD_EXTENSIONS, extension_configs=MD_CONFIG)
    doc.html = md.convert(doc.body_md)
    doc.toc = getattr(md, "toc", "")


def load_collection(folder: Path, url_prefix: str) -> list[Doc]:
    docs = []
    for path in sorted(folder.glob("*.md")):
        doc = read_doc(path)
        if doc.meta.get("draft"):
            continue
        doc.meta["url"] = f"/{url_prefix}/{doc.slug}/"
        render_markdown(doc)
        docs.append(doc)
    return docs


def sort_projects(projects: list[Doc]) -> list[Doc]:
    """Explicit `order:` wins; then most recent year; then title."""
    return sorted(
        projects,
        key=lambda p: (p.meta.get("order", 999), -int(p.meta.get("year", 0) or 0), p.title),
    )


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def write(url_path: str, html: str) -> None:
    """/projects/foo/ -> dist/projects/foo/index.html"""
    target = DIST / url_path.strip("/") / "index.html" if url_path != "/" else DIST / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8")


def copy_static() -> None:
    if STATIC.exists():
        shutil.copytree(STATIC, DIST, dirs_exist_ok=True)


def write_code_theme() -> None:
    """Generate syntax-highlighting CSS from Pygments so it stays in sync."""
    css = HtmlFormatter(style="default").get_style_defs(".highlight")
    (DIST / "css").mkdir(parents=True, exist_ok=True)
    (DIST / "css" / "code.css").write_text(css, encoding="utf-8")


def write_sitemap(urls: list[str], base_url: str) -> None:
    today = dt.date.today().isoformat()
    entries = "\n".join(
        f"  <url><loc>{base_url.rstrip('/')}{u}</loc><lastmod>{today}</lastmod></url>"
        for u in urls
    )
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n</urlset>\n",
        encoding="utf-8",
    )
    robots = "User-agent: *\nAllow: /\n"
    if base_url:
        robots += f"Sitemap: {base_url.rstrip('/')}/sitemap.xml\n"
    (DIST / "robots.txt").write_text(robots, encoding="utf-8")


LIVE_RELOAD = """
<script>
(function () {
  let current = null;
  setInterval(async function () {
    try {
      const stamp = await (await fetch('/__build', {cache: 'no-store'})).text();
      if (current === null) current = stamp;
      else if (stamp !== current) location.reload();
    } catch (e) { /* dev server restarting */ }
  }, 700);
})();
</script>
"""


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def build(dev: bool = False, theme: str = "", lang: str = "") -> None:
    site = yaml.safe_load((ROOT / "site.yaml").read_text(encoding="utf-8"))

    env = Environment(
        loader=FileSystemLoader(TEMPLATES),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["commas"] = lambda seq: ", ".join(seq or [])

    track_labels = {t["id"]: t["label"] for t in site.get("tracks", [])}

    projects = sort_projects(load_collection(CONTENT / "projects", "projects"))

    # Guard against duplicates. A clean build can't produce them (dist/ is wiped
    # every run), but this catches two source files that accidentally share a
    # slug or title before they ever reach the board — failing loudly here beats
    # discovering a doubled row in the browser.
    seen_slugs, seen_titles = {}, {}
    for project in projects:
        if project.slug in seen_slugs:
            raise SystemExit(
                f"Duplicate slug '{project.slug}': {seen_slugs[project.slug]} and "
                f"{project.source.name}. Two projects can't share a URL."
            )
        if project.title in seen_titles:
            raise SystemExit(
                f"Duplicate title '{project.title}': {seen_titles[project.title]} and "
                f"{project.source.name}. Rename one, or you'll get two identical board rows."
            )
        seen_slugs[project.slug] = project.source.name
        seen_titles[project.title] = project.source.name

    # Duplicate `order` values aren't fatal — the sort falls back to year then
    # title — but they mean the board order is being decided alphabetically
    # rather than by you. Worth a warning.
    orders = {}
    for project in projects:
        o = project.meta.get("order")
        if o in orders:
            print(f"  note: {orders[o]} and {project.source.name} both use order: {o} "
                  f"— board position will fall back to a title sort")
        orders[o] = project.source.name

    for project in projects:
        track = project.meta.get("track")
        if track not in track_labels:
            raise SystemExit(
                f"{project.source.name}: track '{track}' is not defined in site.yaml.\n"
                f"Valid tracks: {', '.join(track_labels) or 'none'}"
            )
        project.meta["track_label"] = track_labels[track]
    lab = load_collection(CONTENT / "lab", "lab")
    lab.sort(key=lambda d: str(d.meta.get("date", "")), reverse=True)
    pages = load_collection(CONTENT / "pages", "")

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)
    copy_static()
    write_code_theme()

    base_ctx = {
        "site": site,
        "projects": projects,
        "lab": lab,
        "featured": [p for p in projects if p.meta.get("featured")],
        "year": dt.date.today().year,
        "built_at": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "dev": dev,
        "theme": theme,
        "lang": lang,
    }

    def render(template: str, url: str, **ctx) -> str:
        html = env.get_template(template).render(**base_ctx, **ctx, page_url=url)
        return html.replace("</body>", LIVE_RELOAD + "</body>") if dev else html

    urls = []

    write("/", render("home.html", "/"))
    urls.append("/")

    write("/projects/", render("projects.html", "/projects/"))
    urls.append("/projects/")

    for project in projects:
        write(project.url, render("project.html", project.url, project=project))
        urls.append(project.url)

    write("/lab/", render("lab.html", "/lab/"))
    urls.append("/lab/")

    for entry in lab:
        write(entry.url, render("writeup.html", entry.url, entry=entry))
        urls.append(entry.url)

    for page in pages:
        page.meta["url"] = f"/{page.slug}/"
        tmpl = page.meta.get("template", "page.html")
        write(page.url, render(tmpl, page.url, page=page))
        urls.append(page.url)

    write_sitemap(urls, site.get("base_url") or "")

    print(
        f"Built {len(urls)} pages into dist/ "
        f"({len(projects)} projects, {len(lab)} lab writeups, {len(pages)} pages)"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the portfolio site.")
    parser.add_argument("--dev", action="store_true", help="inject the live-reload client")
    parser.add_argument("--theme", default="", help="visual theme variant (e.g. 'retro'); default is the base theme")
    parser.add_argument("--lang", default="", help="default UI language for this build (e.g. 'es'); default English")
    args = parser.parse_args()
    build(dev=args.dev, theme=args.theme, lang=args.lang)
    return 0


if __name__ == "__main__":
    sys.exit(main())
