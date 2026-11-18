#!/usr/bin/env python3
"""
Scaffold a new piece of content.

    python new.py project "Freight Demand Forecast" --track analytics
    python new.py lab "Detecting scheduled task persistence"

Creates the Markdown file with front matter filled in and prints the path.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).parent.resolve()

PROJECT = """---
title: {title}
slug: {slug}
track: {track}
featured: false
order: {order}
year: {year}
status: active
role: Sole developer
period: "{year}"
type: ""
summary: One sentence. What it is and what it produced.
stack: []
repo: ""
---

## Problem

## Approach

## Architecture

## Data

## Results

## What I'd do differently

## Next
"""

LAB = """---
title: {title}
slug: {slug}
date: {today}
technique: ""
tactic: ""
environment: Isolated home lab
summary: One sentence. What behavior you simulated and what you learned to look for.
stack: []
---

## Scenario

## Topology

## Execution

## Artifacts

## Detection

## Hardening

## What I took from it
"""


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "untitled"


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a new case study or writeup.")
    parser.add_argument("kind", choices=["project", "lab"])
    parser.add_argument("title")
    parser.add_argument("--track", default="data-ai", help="project track id from site.yaml")
    args = parser.parse_args()

    today = dt.date.today()
    slug = slugify(args.title)

    if args.kind == "project":
        site = yaml.safe_load((ROOT / "site.yaml").read_text(encoding="utf-8"))
        valid = [t["id"] for t in site.get("tracks", [])]
        if args.track not in valid:
            raise SystemExit(f"Unknown track '{args.track}'. Options: {', '.join(valid)}")
        folder = ROOT / "content" / "projects"
        order = len(list(folder.glob("*.md"))) + 1
        path = folder / f"{order:02d}-{slug}.md"
        body = PROJECT.format(title=args.title, slug=slug, track=args.track,
                              order=order, year=today.year)
    else:
        folder = ROOT / "content" / "lab"
        path = folder / f"{today:%Y-%m}-{slug}.md"
        body = LAB.format(title=args.title, slug=slug, today=today)

    if path.exists():
        raise SystemExit(f"{path} already exists.")
    path.write_text(body, encoding="utf-8")
    print(f"Created {path.relative_to(ROOT)} — open it and start writing.")


if __name__ == "__main__":
    main()
