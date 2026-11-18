---
title: Market Data Reporting Pipeline
slug: market-data-automation
track: analytics
featured: true
order: 11
year: 2025
status: active
role: Sole developer
period: 2025
type: Data engineering · Automated reporting
summary: A scheduled Python pipeline that ingests market data, computes portfolio performance, and delivers daily and weekly reports without anyone opening a spreadsheet.
stack: [Python, pandas, SQLite, APScheduler, Jinja2, SMTP, matplotlib]
---

## Problem

Performance tracking that lives in a spreadsheet is a recurring manual task that
silently rots: someone forgets a week, a formula gets dragged wrong, and the
history is no longer trustworthy. I wanted the reporting to happen whether or
not anyone remembered to do it.

## Approach

The same shape as any production reporting system, scaled down:

**Ingest → store → compute → render → deliver → monitor**

- **Ingest** — pull prices and corporate actions from [source] on a schedule,
  with retries and a raw-response cache so a failed run never loses a day.
- **Store** — append-only price history plus a positions table, so any past
  report can be regenerated exactly.
- **Compute** — time-weighted returns, contribution by holding, drawdown, and
  benchmark comparison in pandas.
- **Render** — a Jinja2 HTML email with inline charts; the same templates render
  the weekly summary at a different aggregation.
- **Deliver** — scheduled send, with per-recipient scoping so multiple accounts
  can be reported separately from the same pipeline.
- **Monitor** — a heartbeat and a failure email, because a silent pipeline is
  indistinguishable from a working one.

## Architecture

```text
scheduler ──► fetchers ──► raw cache ──► normalize ──► metrics ──► templates ──► email
    │                                                                            │
    └──────────────────── run log + failure alert ◄──────────────────────────────┘
```

## Why this matters for analytics work

Most of the value in an analytics role is not the model — it's building the
thing that produces the same correct number every morning without a human in the
loop. This project is that, end to end: idempotent ingestion, replayable history,
templated reporting, and alerting on its own failure.

## Results

The automated pipeline has been running on a daily schedule for about two months.
It's still in active development — the ingestion, reporting, and alerting paths are
working end to end, and the current focus is hardening the data-quality checks and
moving scheduling onto a dedicated task runner before I put real runtime and
uptime figures behind it.

## Next

- Move scheduling to a proper task runner and containerize the deployment
- Add a data-quality check that blocks a report on suspicious price moves
