---
title: StudyForge — Agentic Study Pipeline
slug: studyforge
track: data-ai
featured: true
order: 7
year: 2026
status: active
role: Sole developer
period: 2026
type: AI pipeline · Full-stack application
summary: Turns textbooks, papers, and language material into grounded, exam- or goal-targeted study output, then delivers it to your inbox one section at a time — and, as the same targeting idea generalized, language-proficiency plans and job-specific interview prep. A four-agent Python pipeline with grounding checks and a FastAPI dashboard.
stack: [Python, FastAPI, Anthropic API, pypdf, python-docx, reportlab, SQLite, Jinja2]
repo: https://github.com/DOYOUHAVETHEGUTS/studyforge
demo: /apps/studyforge/
demo_embed: true
demo_note: Three versions, oldest to newest. v1 is the original desktop prototype, v2 the in-browser study app, v3 the deployed service.
demo_versions:
  - label: v1 — original
    short: v1
    url: /apps/studyforge-v1/
    note: A re-creation of the original desktop prototype — one summarization call per chapter, emailed out, including the failure modes that drove the rewrite.
  - label: v2 — study app
    short: v2
    url: /apps/studyforge/
    note: The rebuilt study app — Library, Languages, and Interview Prep, with flashcards and quizzes. Runs entirely in the browser.
  - label: v3 — deployed
    short: v3
    url: https://studyforge-k9uj.onrender.com/
    note: The deployed service on Render — settings, API configuration, live case practice, and account-gated access. Password required.
---

## Problem

I was studying for CompTIA Security+ and Network+ at the same time, both against
this year's exam objectives, and the existing flashcard tools I tried kept
producing the same failure: cards that were generically about the subject rather
than targeted at what the current exam version actually tests. Some were built
from outdated objective versions; none of them let me point them at a specific
exam and say "test me on this, not the general topic."

I also didn't want to summarize hundreds of pages by hand, and handing a whole
textbook to a language model produces a confident wall of text you have to trust
blind, with no guarantee it reflects what the source actually says or what the
exam actually asks.

So I wanted two things in one tool: study material generated *once*, grounded
against the source and targeted at a specific exam's objectives, then delivered
back to me in small daily pieces so the studying stayed manageable.

## From prototype to pipeline

The first version was a local desktop app built with Tkinter. It worked on my
machine and almost nowhere else. Chapter detection was brittle, file paths were
hard-coded for Windows, email delivery would stop working without saying why, and
the summaries were one-shot and ungrounded — no check that a summary matched its
source.

The rebuild kept the one idea worth keeping and threw out the rest. That idea:
**separate the expensive step from the cheap one.** Generating grounded summaries
for a whole book is costly and happens once; delivering the next section to your
inbox is cheap and happens daily. Splitting those two concerns is what the whole
architecture is organized around.

The demo panel above holds all three versions, and they're worth clicking in
order. **v1** is a re-creation of that original desktop prototype, failure modes
included — run it and watch a chapter get summarized, fail to send, and report
success anyway. **v2** is the rebuilt study app: flashcards, quizzes, languages,
and interview prep, running entirely in the browser. **v3** is the deployed
service, with settings, API configuration, and live case practice.

## Approach — four agents, deterministic glue

The pipeline runs four LLM agents, each with one job, and lets ordinary
deterministic Python do everything that doesn't need a model:

- **Structure** maps a document into sections when its own bookmarks and the
  heuristics aren't enough to do it reliably.
- **Summarize** writes the grounded study summary for a section, with a separate
  strategy for language material, which needs different treatment than a textbook.
- **Learning** generates flashcards and a quiz from that summary.
- **Grounding** verifies the summary is actually supported by the source text and
  flags anything that isn't.

Text extraction, bookmark parsing, chunking, PDF rendering, email, and the
database are all deterministic Python — the model is used only where judgment is
needed, not everywhere it could technically fit.

```text
Add material ─▶ Ingest ─▶ Structure ─▶ [ per section ] ─▶ Outputs ─▶ Deliver
 (pdf/docx/       (extract   (section     Summarize → Ground    md + pdf   one section
  txt/url)         text,      mapping)     → Learning           + json     per run,
                   scanned                 retry + isolate                 email or
                   gate)                                                   local fallback
```

## The design decisions that mattered

**Agents run isolated, per section, so one failure never sinks the book.** Each
section is summarized, grounded, and turned into learning material on its own,
with retry and backoff, and an explicit `failed` status when it can't complete.
A single bad section is marked failed and skipped rather than taking the whole
job down, and `process --failed-only` retries just those later.

**Grounding is a first-class step, not a prompt instruction.** A dedicated agent
checks each summary against the source and flags unsupported claims, because the
failure mode I cared about most was a summary that reads well and quietly says
something the book doesn't.

**Failures are visible by design.** The original app's email "silently stopped
working." The real cause turned out to be TLS certificate verification failing on
`starttls()` — an OS cert-store and TLS-inspection problem, not a bad password.
The rebuild pins a known CA bundle, ships a `diagnose-email` command that explains
SMTP and TLS failures in plain terms, and deliberately **does not advance the
delivery queue when a send fails**, so a failure is obvious instead of looking
like a finished send. A readiness banner tells you what's unconfigured before you
start a run, and processing refuses to begin rather than dying halfway through.

## Interface

There's a command-line interface for the whole flow — add a book, detect chapters
from its PDF bookmarks, process it, send the next section — and a FastAPI web
dashboard that does the same from the browser, including drag-and-drop upload,
settings, and inline PDF viewing of any generated section. Scheduled delivery runs
as a background loop inside the app process; the README is explicit that this
isn't a system cron and points at Task Scheduler or cron for delivery that must
fire whether or not the app is open.

## What it looks like running

The dashboard's Library lists each material as a card with its type, section
progress, and delivery count — a Network+ textbook at 21/21 sections complete
with 4 emailed, a Security+ textbook at 29/29, and a paper mid-run showing
7 failed sections and 7 of 14 done. The card states are the pipeline's real
status model surfaced directly: complete, in-progress, and failed are all
visible rather than hidden.

Open a material and the section list is where the honesty of the system shows.
Each chapter carries its page range, a **grounding flag** when the grounding
agent found unsupported claims, and — when a send didn't go through — the actual
delivery error inline rather than a generic failure. One section in the
screenshots records a Resend API 403 explaining the send was restricted to the
account's own address, saved locally instead of lost. That's the "failures are
visible, queue doesn't advance" design working as intended.

Clicking a section's **Study** view opens the generated flashcards and quiz for
that chapter, and the summary itself opens as a PDF inline. The demo above is
that study view, rebuilt to run in the browser.

## Growing past one textbook

The targeting idea that started with exam objectives generalized further than I
expected. Once the material pipeline could take a **focus** — "target this exam,
not the general subject" — the same idea applied to two problems I ran into
right after:

**Languages.** I wanted to get my professional Spanish to a specific,
work-usable level rather than restart from a generic beginner course. Languages
in StudyForge run a short diagnostic, produce an honest skill estimate across
grammar, vocabulary, reading, writing, and speaking — labeled plainly as a
StudyForge estimate, not an official CEFR result — and generate a weekly plan
and review queue aimed at the actual goal (professional/workplace Spanish, in my
case), not a generic curriculum.

**Interview prep.** When I started interviewing, the same targeting model
applied again: point the tool at a specific job posting and get back the
questions that posting is actually likely to ask, organized the way I'd want to
rehearse them, rather than a generic bank of interview questions.

All three features — material targeting, language diagnostics, interview prep —
are the same underlying idea applied three times: **generic content is a worse
starting point than content aimed at the specific thing you're being measured
against**, whether that's an exam version, a proficiency goal, or a job posting.

## The demo

The demo above now mirrors the app's own navigation — **Library**, **Languages**,
and **Interview Prep** — each rebuilt to run in the browser from real output.

- **Library** is the study view for two chapters that actually went through the
  pipeline: the Network+ OSI-models chapter and the Security+ security-controls
  chapter. Flip the flashcards, switch to the quiz, and each answer explains why
  it's right. The Security+ section keeps its grounding warning intact — the
  same flag the app raises — because a study tool should say when it isn't fully
  sure, not hide it.
- **Languages** is the Spanish dashboard: the skill estimate, the immediate
  priorities, and a sample of the generated weekly plan.
- **Interview Prep** is a rehearsal flow for a genericized example role, built
  the same way the real feature works: real question types (behavioral, case
  reasoning, rapid technical) with a suggested approach that stays hidden until
  you click to reveal it, the same interaction as the real app.



This is a **single-user, no-auth local application**, and the code says so on
purpose. Non-secret settings live in one JSON file; the API key and email app
password live in a separate `secrets.json` that's gitignored, `chmod 600` where
the OS supports it, masked to its last four characters in the UI, never logged,
and never referenced from frontend JavaScript. There's one settings store, not a
per-user one — a deliberate MVP scope call documented in the code, not an
oversight. Real multi-user support means proper auth and a per-user encrypted
credential store, which is out of scope until the app needs more than one user.

## What changed across the three versions

**v1 → v2** is the rewrite described above: one ungrounded call per chapter
became four specialized agents per section with a grounding check, brittle
"Chapter N" bookmark matching became a detector that reads any bookmark tree with
a text-segmentation fallback, silent skips became visible `failed` states that
can be re-run on their own, and the email path that advanced its queue on failure
stopped doing that. v2 also added the browser interface, SQLite storage in place
of hand-edited JSON with absolute Windows paths, and a real Settings page.

**v2 → v3** is deployment, and most of what changed follows from that shift plus
one substantial new feature.

**It's actually deployed.** v2 ships with a Dockerfile and a Render blueprint,
running as a long-lived Python service with a persistent disk. That matters more
than it sounds: a static host can't run StudyForge, because the pipeline is
stateful — it needs somewhere to keep processed sections, delivery state, and
generated PDFs between runs. Secrets are environment variables in the deployed
configuration rather than a local file.

**Access control.** v1 was explicitly a single-user, no-auth local app, and I
said so in the original writeup. v2 adds a shared access password so the app can
be handed to someone else without exposing the account behind it. That's still
not per-user auth with an encrypted credential store — it's the honest minimum
that makes sharing safe, and the gap between the two is still documented rather
than papered over.

**Live case practice — the biggest addition.** Interview prep in v1 generated
questions and a suggested approach. v2 adds generated case studies with a
scenario, a difficulty level, and a timed or untimed run you actually sit for:
you answer in the browser, and each answer comes back with AI feedback, plus a
résumé-compared read on where a role's requirements and your experience don't
line up yet. The output is labeled as practice feedback, not an official
interview outcome, for the same reason the language level is labeled an estimate
rather than a CEFR result — a tool that implies more certainty than it has is
worse than one that doesn't.

**Printable output.** Cases export as a printable PDF with the solutions on a
page at the end, so the practice happens before the answers are visible.

The demo panel above lets you switch between all three: v1 re-creates the
original prototype, v2 is the study app that runs with nothing installed, and v3
opens the deployed service.

## What I'd do differently

- The scheduler living inside the app process is the right MVP call but the wrong
  long-term one; durable delivery belongs in an external scheduler or a small
  always-on worker.
- Grounding currently flags unsupported claims; the natural next step is to feed
  those flags back into a targeted re-summarize rather than surfacing them for a
  human to resolve.
- Scanned PDFs are gated out rather than OCR'd — a clear, honest boundary today,
  and an obvious place to extend.

## Next

- An always-on delivery path independent of the dashboard process
- A grounding-to-revision loop that repairs weakly-supported summaries automatically
- OCR ingestion so scanned material is a supported input rather than a blocked one
