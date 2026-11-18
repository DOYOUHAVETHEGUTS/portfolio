---
title: The Flyback Machine — Flight History to Calendar
slug: flyback-machine
track: data-ai
featured: true
order: 8
year: 2026
status: active
role: Sole developer
period: 2026
type: Document extraction · Browser application
summary: Reads flights out of boarding passes, confirmation emails, and itinerary screenshots, de-duplicates them against each other, and exports the result as calendar events a flight tracker can import. One self-contained HTML file with no backend.
stack: [JavaScript, vision LLM APIs, ICS, CSV, single-file HTML]
demo: /apps/flyback/
demo_embed: true
demo_note: Runs entirely in your browser. Reading images needs your own API key; everything else — review, de-duplication, export — works without one.
---

## Problem

Flight trackers are good at recording flights you take from the moment you start
using them. They are bad at the flights you already took. The history exists, but
it's scattered across years of boarding passes, confirmation emails, screenshots,
and loyalty-account pages, in no consistent format, and typing it in by hand is
the reason most people never backfill it.

I wanted to point something at that pile of documents and get a clean,
de-duplicated flight list out the other side, in a format a calendar or a flight
tracker could import directly.

## Approach

The flow is a three-step rail — **Upload → Review → Export** — and each step
solves a different problem.

**Upload** takes anything that shows a flight: boarding passes, confirmation
emails, itinerary screenshots, loyalty-account history, PDFs. A vision model
reads each one and returns structured flight records rather than text, so the
output is already in the shape the rest of the pipeline needs.

**Review** is the step that makes it usable. Extraction from real-world documents
is never clean — a screenshot is cropped, a confirmation email lists four
segments, the same flight appears in both a boarding pass and an itinerary. So
every extracted flight is shown for confirmation before it counts, and
**de-duplication runs on two rules**: same flight number and date, or same route
and date. Matched duplicates are grouped rather than silently dropped, and detail
present on one copy but missing from another is merged in — the second document
usually knows something the first one didn't.

**Export** writes standard `.ics` calendar events and CSV, so the result imports
into a calendar app or a flight tracker rather than being trapped in the tool.

## Architecture

The whole application is a single HTML file. No backend, no build step, no
dependencies beyond the fonts:

```text
documents (images / PDFs)
        │
        ▼
  vision model call ──► structured flight records
        │
        ▼
  review queue ──► de-duplication (flight+date, or route+date)
        │              └─ merge details across duplicate copies
        ▼
  export ──► .ics calendar events  +  CSV
```

Choosing a single file was the same instinct as the rest of my work: the thing
that survives is the thing with nothing to keep running. It opens from a file
system, a static host, or an embed on this page, and behaves identically.

## How the API key is handled

Reading images requires a vision model, and the app lets you pick the provider.
The key you enter **stays in your browser** and is sent only to the provider you
chose — there's no server in this application to send it anywhere else, and
nothing is logged. The app states this in the settings panel rather than burying
it. If you'd rather not enter a key at all, the review, de-duplication, and
export steps still work on flights already in the list.

## What I'd do differently

- De-duplication rules are good heuristics, not a model of reality. A
  tail-number change or a same-day rebooking on a different flight number still
  needs a human eye in the review step; the rules narrow the work rather than
  finishing it.
- There is no persistence between sessions beyond the browser, so a long
  backfill is one sitting. A saved working set would make a multi-year import
  less fragile.
- Extraction quality is only as good as the document. Low-resolution screenshots
  of old boarding passes are the weakest input and there is no confidence score
  surfaced to say so — the review step is currently doing that job implicitly.

## Next

- Confidence scoring on each extracted field so the review step can sort by
  what's most likely wrong
- A saved working set so a large backfill can span sessions
- Broader export targets beyond calendar and CSV
