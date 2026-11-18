---
title: This Site — Portfolio Platform
slug: portfolio-site
track: software
featured: true
order: 15
year: 2026
status: active
role: Architect and developer
period: 2025 – present
type: Static site generator · Design system · Interactive apps
summary: The site you're reading. A custom Python static site generator, a hand-built design system, and four self-contained browser applications — built to consolidate scattered projects into one place and prove the work is real.
stack: [Python, Jinja2, Markdown, YAML, JavaScript, CSS]
---

## Problem

My work was scattered. A dashboard on a work machine, a computer-vision tool in a
folder on my desktop, a mentorship platform whose source I still had but whose
site no longer existed, security lab notes in a text file. Individually each one
was a thing I'd done. Together they were nothing — no one could see them, and
nothing connected them into a single story.

A résumé can list those projects. It can't let anyone *use* one. That was the
gap I wanted to close: somewhere that both consolidates the work and demonstrates
that the things I build actually function.

## Approach

The obvious choice was a React framework. I went the other direction and wrote a
static site generator in Python — roughly 250 lines that read Markdown files with
YAML front matter, render them through Jinja2 templates, and emit flat HTML.

That decision drove everything else:

- **Content is separate from presentation.** Every case study is a Markdown file.
  Adding a project means writing a file, never touching a template. The front
  matter carries the structured fields — track, status, period, stack, demo and
  repo links — and the templates read from it.
- **One source of truth.** The homepage board, the Portfolio index, and the
  individual case study pages all read the same files. There is no second data
  structure to fall out of sync.
- **No build toolchain.** Five pure-Python dependencies, no `node_modules`,
  nothing that needs upgrading in two years for the site to still build.
- **Output is flat HTML.** It deploys anywhere, costs nothing to host, and has
  no server to keep running.

## Architecture

```text
content/            site.yaml           templates/
  projects/*.md     identity, tracks,     base, home, project,
  lab/*.md          capabilities,         portfolio, lab, page
  pages/*.md        professional work
      │                   │                     │
      └───────────────────┴──────────┬──────────┘
                                     ▼
                                 build.py
                    (front matter → Jinja2 → flat HTML)
                                     │
                                     ▼
                          dist/  →  any static host
```

`serve.py` wraps the build in a dev server that rebuilds on save and reloads the
browser. `new.py` scaffolds a new case study with its front matter pre-filled.

## Key features

- **Track filtering** on the homepage board — a recruiter hiring for security can
  hide everything else in one click.
- **Four interactive demos**, each a self-contained page with no external
  dependencies: a mentorship platform rebuilt from my original source, a
  video-similarity explainer, a market-data pipeline walkthrough with a simulated
  brokerage, and a force-directed career map.
- **Cross-project integration** — the career map hands goals to the mentorship
  tracker through a deliberately thin contract.
- **A build guard** that stops the build if two case studies would collide on a
  URL or title.
- **Responsive, reduced-motion aware, and printable**, with a build timestamp in
  the footer so stale output is immediately obvious.

## How I worked, including the AI part

I set the direction and the structure: the concept, the boilerplate, the
pseudocode, the backend hierarchy, and specific front-end elements I wanted built
a particular way. I used AI assistance to connect those pieces, tighten the
implementation, and review the result — particularly for edge cases and safe
handling of inputs, which is exactly the kind of review that benefits from a
second pass that doesn't get bored.

I'm explicit about this because I think it's the honest description of how a lot
of software gets built now, and because the interesting skill isn't typing every
character. It's knowing what to build, deciding how the pieces fit, and being
able to tell when the output is wrong. The judgment calls in this project — a
Python generator over a JS framework, Markdown over a database, self-contained
demos over CDN dependencies — are the parts that determined whether it works.

## Design

The visual identity comes from the domain I actually work in. The homepage isn't
a hero banner over a gradient; it's a **manifest board** — a dense, sortable index
with track, stack, status, and year, the way an operations board reads. Metadata
sits in monospace, prose in a serif, headings in a grotesk. Every case study
carries the same fixed metadata strip beneath its title.

The constraint I held to: a recruiter should understand who I am, what I do, and
what I've built within one screen, and should never wonder whether they're
reading about a project or using one.

## Problems worth naming

Three real ones, all of which changed the code:

**Phantom duplicates.** The board once showed thirteen rows when only seven
projects existed — old and new titles of the same project, side by side. The
cause wasn't the generator; it was a stale output folder from before several
files were renamed. The fix was a build timestamp in the footer so stale output
announces itself, plus a guard that fails the build loudly on a duplicate slug
or title rather than silently rendering both.

**The dev server hung on Windows.** It told the file watcher to watch two
individual *files*. On Linux that works; on Windows the watcher needs a directory
handle, so the thread spun. Rewritten to watch only directories, with the project
root watched non-recursively to catch top-level edits — and a proper ignore list,
since watching the output folder would have made the build retrigger itself
forever.

**The career map showed up blank.** It relied on a charting library loaded from
an outside server. If anything blocked that request — a corporate firewall, a
strict network — the library never arrived and the page rendered as an empty box.
A visitor would have seen nothing and assumed the project was broken. I replaced
the library with about seventy lines of my own layout code, so the map now
depends on nothing outside the page.

## What I learned

The recurring lesson is that the interesting failures are never in the algorithm.
They're at the boundaries: a stale folder, a platform difference in a file
watcher, a network that blocks a script. Each of those produced a symptom that
looked like a code bug and wasn't.

The other lesson is about restraint. Every one of these features could have been
a framework, a database, a hosted service. Choosing the smaller version each time
is why the site still builds in under a second and why I can add a project by
writing a file.

## Next

- Deploy to a custom domain and set the canonical base URL
- Add a build-and-publish workflow so pushing to the repository ships the site
- Continue adding case studies and lab writeups as the work accumulates
