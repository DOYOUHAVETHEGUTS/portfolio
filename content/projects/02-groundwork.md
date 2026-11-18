---
title: Groundwork — Capital Request Intake
slug: groundwork
track: software
featured: true
order: 5
year: 2026
status: active
role: Developer; concept by Justin Uwagboe
period: 2026
type: Internal tool · Scoring and workflow application
summary: A front door for capital requests. Turns a plain-language need into a structured five-section request, scores it the way Finance actually reads it, coaches it with guided questions, and blocks it until the non-negotiable items are met.
stack: [Python, SQLite, standard-library HTTP server, python-docx, Pillow]
demo: /apps/groundwork/
demo_embed: true
demo_note: Pick a draft, open a section to read its findings, then answer the guided questions and watch the score move.
---

## Credit

The idea for this is **Justin Uwagboe's**. He is the one receiving these requests,
so he is the one who could describe precisely what arrives broken and why it costs
the team time. The scoring standard the tool enforces is his read of the problem;
my part was building the thing that enforces it.

## Problem

Capital requests arrive at Finance late and thin. A request shows up missing the
quotes, missing a measured baseline, with four unrelated asks bundled under one
title and a single lump-sum number for the cost. None of that can be approved as
written, so the work turns into urgent back-and-forth rework at exactly the moment
there is least time for it.

The deeper cost isn't the rework. It's that the whole function ends up reactive —
chasing requests that need rescuing — instead of working planned requests that
arrived complete. That's the actual goal here: **shift the work from reactive
approval to proactive planning**, by making it hard to submit an incomplete
request in the first place.

## Approach

Groundwork sits in front of Finance as a deliberate barrier, with the emphasis on
*clear and direct* rather than merely strict. It tells a requester exactly what is
missing, why it matters to the person reading it, and how to fix it — and it will
not pass the request through until the non-negotiables are met.

The workflow is five steps:

1. **Describe** — the requester speaks or writes the need, guided by a short set
   of questions asked one at a time.
2. **Review** — the draft lands in the five sections Finance reads, with an
   itemized quote editor, a cost build-up, and builders for the supporting
   exhibits.
3. **Score** — required items first, then a score per section, each with findings.
4. **Improve** — guided questions aimed at wherever the most points are at stake.
5. **Hand off** — exports stay marked as drafts until the request actually passes.

## The scoring standard

Five literal sections, weighted the way the reader weights them:

| Section | Points | What earns them |
|---|---|---|
| Current Situation | 25 | Measured baseline, why the problem happens, real detail, visuals |
| Proposal | 15 | One ask that matches the title, specific scope, timeline and constraints |
| Cost | 20 | Quantity × unit cost, itemized quotes, contingency, totals that reconcile, funding source |
| Justification | 20 | Explicit recommendation, quantified benefit tied to the baseline, risks |
| Alternatives | 20 | Real options, competing quotes, which vendor and why, compared on one basis |

**Required items sit above the score and override it.** Three vendor quotes is an
automatic fail if unmet. The request must declare whether it is facility-driven,
and a facility-driven request is blocked until the right template is recorded.
A request can't pass a round or hand off while any required item is open,
regardless of how well it scores.

**Caps** handle the failure modes that a point total would otherwise hide: bundled
asks or a title mismatch cap Proposal at 4; a lump-sum cost caps Cost at 6; no
explicit recommendation caps Justification at 12.

Passing is 75, and it's configurable — the bar is a setting, not a belief.

## The design decisions that mattered

**Rules decide the gates. The model only grades quality.** The required items are
enforced in code, never by the language model. That split is the core of the
design: a model is good at reading a draft and saying *this benefit isn't tied to
the baseline*, and bad at being the thing that reliably refuses to let a request
through. The deterministic rules engine is both the floor and the fallback — with
no model endpoint available, the tool still scores, still gates, still coaches,
just with rougher prose.

**Every lost point is a finding, not a number.** A score alone tells a requester
they failed without telling them anything useful. So each deduction carries four
parts: what went wrong, why Finance cares, the evidence quoted from their own
draft, and the fix. The demo above shows these — open any section.

**Coaching, not rejection.** After the first score, the tool asks ten questions
aimed at wherever the most points are at stake, writes the answers back into the
draft, and re-scores it. Below the bar after a second round of different
questions, it alerts the requester's finance partner with the score path and the
questions they couldn't answer — the escalation carries context instead of blame.

**One ask per request.** The single most common failure was four unrelated items
bundled under one title, which can't be approved or declined cleanly. The cap on
Proposal makes bundling cost more points than it saves effort.

## Architecture and scope

A standard-library HTTP server with SQLite, plus `python-docx` for Word import and
export and `Pillow` for generating the diagrams and labeling exhibit images. Two
dependencies total. That was deliberate: a tool meant to be approved and deployed
inside an enterprise has an easier path when its dependency list is short enough
to read.

The same build ships three editions, selected by a setting:

- **Pilot** — one shared password, everyone sees everything, sample or anonymized
  data only.
- **Group** — named accounts, analyst/director/admin roles, an audit log, and
  access isolation so analysts see their own work and a director sees their group
  read-only.
- **Divisions** — enterprise SSO with roles read from the identity provider at
  every sign-in, division and finance-admin scopes, and a retention policy.

Each edition previews the next using seeded personas and sample data that never
mixes with real requests, so a reviewer can see where it's going without a second
deployment.

## What the reviewers told us, and what changed

Before taking it further, we asked the finance group that reviews these requests
two questions: what kinds of requests do you see most, and what is your biggest
headache? The answers changed the tool more than any scoring tweak.

| What we heard | What the tool does now |
|---|---|
| The five sections are literal, plus an optional appendix | Drafts, edits and scores exactly those five; each sentence lands in one section |
| Three vendor quotes are non-negotiable, each broken out by cost | Fewer than three valid quotes is an automatic fail; a quote editor itemizes each one |
| Finance needs to know which vendor was chosen and why, and it isn't always the cheapest | A selected-vendor flag and an all-in rationale; price-only reasons are flagged |
| The weakest requests have no pictures, no data, and one lump-sum cost | Photo upload, a process-flow builder with the bottleneck marked, and a cost build-up that caps the score for a single total |
| NPV has its own template and method | NPV and payback were removed from the form, the scoring and the exports |
| Facility-driven requests need a specific template | Every request declares facility yes/no, and a facility request is blocked until the template is recorded |

One quality fix came out of the same review: the drafter sometimes copied one
sentence into two sections. The root cause was in the drafting step, not the model,
and duplicates are now removed before scoring. Existing Word drafts can also be
imported and scored as they are.

## Rollout, with a gate at each step

All three editions are in the build today. Each has an exit criterion before the
next one starts:

| Edition | Who uses it | Gate to move on |
|---|---|---|
| Pilot | Shared password, sample or anonymized data only | The reviewers sign off on the rubric and gates; 5–10 real drafts scored |
| Group | One director's floor, named accounts | One director runs a full cycle; access review passes; no analyst sees another's work |
| Divisions | Company sign-on, division and finance-admin roles | Identity, security and data-governance approval; a division rollout plan |

Two decisions are still open: whether a documented sole-source justification can
satisfy the three-quote rule (and who approves the exception), and exactly which
facility template the gate should check for.

## What's verified, and what isn't

Verified in testing: calibration against a set of training drafts, all three
guided-round paths (pass, second chance, escalate), the access rules per edition,
identity-token verification against tampered, expired, wrong-audience and
replayed signatures, and Word import and export.

Not yet verified: sign-in against a live enterprise tenant, live model-scored runs
on real drafts, and the image generation path against a production API. Those sit
behind approvals rather than code.

## What I'd do differently

- The scoring rules and the prompt grew together, and they should be separable —
  the rubric belongs in a data file that a finance owner can edit without touching
  code.
- Required-item logic is correct but spread across the scorer; it wants to be one
  explicit gate module, since it is the part of the system that cannot be allowed
  to drift.
- There are no automated tests around the findings text itself, only around the
  scores. The wording is what the requester actually reads, so it deserves the
  same scrutiny as the number.

## Next

- Move the rubric into an editable configuration owned by Finance
- Run the model-connected mode against real drafts once an approved endpoint exists
- Tune the finding wording with the people receiving the requests, which is the
  only way to know whether the coaching actually reads as helpful
