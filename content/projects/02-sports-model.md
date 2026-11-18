---
title: Parlay Outcome Simulator
slug: sports-model
track: data-ai
featured: true
order: 10
year: 2025
status: active
role: Sole developer
period: 2025 – present
type: Data pipeline · Simulation tool
summary: A daily pipeline that accumulates live sportsbook odds, and a simulator that reconstructs what a given set of picks would have paid — built to answer a question a group of friends kept asking and never resolving.
stack: [Python, pandas, The Odds API, scheduled ingestion]
demo: /apps/parlay/
---

## Problem

A group of us had a run of games we called correctly and didn't bet. The question
that followed every one of them was the same — *how much would that have been
worth?* — and nobody could answer it, because reconstructing a parlay after the
fact means knowing the odds that were actually on the board at the time, not the
odds you remember.

I like numbers, so I wanted the real figure rather than the speculation. That is
the entire origin of this project, and it is also the reason I don't gamble: once
you compute the number honestly, you also compute how often the same method would
have lost.

## What it does

Given a set of match selections over a chosen period, it returns a complete slip:

- the chosen winner for each match
- the bookmaker offering the best price on that selection
- the best available odds at the time the data was captured
- the combined parlay odds across all legs
- the projected payout for a given stake, if every leg hits

It is a what-if calculator, not a predictor. It makes no forecast about who will
win — it reconstructs what a set of picks would have returned at real prices.

## The data problem that shaped the build

Odds come from **The Odds API**. The constraint that drove the architecture is
that its standard endpoints don't serve backlogged historical data — you can read
the board now, but you can't ask what it looked like last month.

That inverts the usual data project. There was no historical dataset to download
and analyze; the history had to be *accumulated*. So the pipeline runs on a daily
schedule and appends each capture, building the archive forward in time. Every
day the project runs is a day of history it will have later and couldn't have
retrieved otherwise.

The practical consequence is that the dataset is young by design:

- roughly **60 matches** across about **two months**
- competitions covered: Premier League, Bundesliga, LaLiga, MLS, Serie A
- about **40% is live accumulated data** captured by the daily run
- the remaining **60% is structured placeholder data** standing in for captures
  the pipeline hadn't accumulated yet

That last point is stated plainly because it changes what the tool's output
means today. The simulator runs correctly end to end, but a slip built across
the placeholder portion reflects the data structure rather than prices that were
genuinely on the board. Every additional day of scheduled ingestion moves that
ratio, and the tool becomes fully real once the accumulated archive covers the
window being queried.

## Worked example

The demo above is the tool's interface rebuilt to run in the browser: pick a
result on each match, switch between best-price and a single book, toggle
American and decimal odds, and the slip grades itself against fixed outcomes so
you see both the payout and whether it would actually have hit.

Two behaviors in it are the substance of the project. **Best-price selection**
scans every book for each pick rather than assuming one — the same selection can
differ by thirty or forty cents on the dollar depending on where it was priced.
And **grading** is what separates this from a payout calculator: the slip reports
what a set of picks returned, including when the answer is nothing, which is the
part the original question always skipped.

The demo runs on a fixed sample dataset with mock prices, so nothing there is a
historical result.

## Architecture

```text
The Odds API
     │  daily scheduled pull
     ▼
append-only capture store        ← history accumulates forward
     │
     ▼
selection + pricing layer        ← best price per selection across books
     │
     ▼
parlay combiner                  ← combined odds, payout on stake
     │
     ▼
slip summary
```

The append-only store is the piece that matters. Because captures are never
overwritten, a slip built for a past date reads the prices recorded on that date
rather than today's board — which is the whole point of accumulating rather than
querying live.

## What I'd do differently

- The dataset should have started accumulating months before I needed it. The
  single biggest limitation here is a scheduling decision, not a technical one.
- Best-price selection currently reads across the books the API returns for a
  match; it doesn't account for a book being unavailable in a given region, which
  would make the "best available" claim regionally wrong.
- There is no evaluation layer. The tool computes what picks *would* have paid,
  and deliberately makes no claim about whether the picks were good.

## Next

- Keep the daily ingestion running until the accumulated archive covers a full
  season, and retire the placeholder portion entirely
- Add a screenshot of a real slip once the archive supports one end to end
- Track how often a reconstructed slip would have lost, alongside what it would
  have paid — the honest version of the question is both numbers, not one
