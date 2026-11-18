---
title: Trucking Pulse — Mailbox Archive & Reporting
slug: trucking-pulse
track: software
featured: true
order: 2
year: 2026
status: active
role: Sole developer
period: 2026
type: Internal tool · Reporting application
summary: A searchable archive and reporting tool for a cargo trucking team's shared mailbox. It files and indexes every email sent and received, classifies what each one asks for, and gives management a daily read on volume, requests, stations and delivery failures. It started as a triage console and was rebuilt as a read-only reporting tool in v5.
stack: [Python, SQLite, standard-library HTTP server, vanilla JavaScript, Power Automate, unittest, Playwright]
repo: https://github.com/DOYOUHAVETHEGUTS/trucking-pulse
demo: /apps/trucking-pulse-v5/
demo_embed: true
demo_note: The real v5.2 interface replaying a synthetic two-week mailbox. Search, open an email, and switch to Overview and Stations. Read-only.
demo_versions:
  - label: v5.2 — current
    short: v5.2
    url: /apps/trucking-pulse-v5/
    note: The real v5.2 interface replaying a synthetic two-week mailbox. Search, open an email, and switch to Overview and Stations. Read-only.
  - label: v4.1 — triage console
    short: v4.1
    url: /apps/trucking-pulse/
    note: The earlier triage console on a synthetic Monday-morning inbox. Click a queue item, switch tabs, try EN / ES. Actions stay in your browser.
---

!!! note "Anonymized"
    This tool was built for a real team, so everything public here is anonymized. The
    demo inbox is generated, carriers are fictional, the rate card is synthetic, air
    waybills use an unassigned prefix, and the team's internal FAQ and procedures are
    replaced with a short generic sample. The code and its history are otherwise intact.

## Problem

A cargo trucking desk runs on one shared mailbox. Carriers ask whether tomorrow's
truck runs, stations report missing pieces, sales wants a quote for a lane, someone
needs approval to put dangerous goods on a trailer, and all of it lands in the same
inbox, hundreds of messages a day, mixed in with automated notices nobody needs to act
on.

The failure modes were the ordinary ones for a shared inbox. An email gets read by
three people and answered by none. An email gets moved to a folder and everyone
assumes that means it was handled. The urgent item (a truck leaving in two hours)
sits under twenty FYIs. And the context needed to answer well (the contracted rate on
the lane, whether the station is having a bad day, whether the connecting flight is
delayed) lives in other places, so every reply starts with a lookup.

## Approach

The mailbox already had a Power Automate flow saving each email as a file. Trucking
Pulse starts from that folder rather than from the mail server, which kept it inside
what the team could run without new access requests: a Python script on a work PC,
a local SQLite database, and a browser tab at `localhost`.

Each pass does the same five things:

1. **Reconcile** new files into the database, with explicit handling for duplicates.
2. **Clean** each message down to its newest reply (quoted history, signatures, legal
   footers and safelinks removed).
3. **Extract** air waybills, truck numbers, lanes, flight numbers and service dates,
   in the many formats people actually type them.
4. **Classify and score** into case types (trace, no-show, dangerous goods, schedule
   change, quote, detention and so on), with a priority, a due time and a suggested
   next action and reply template.
5. **File** the email into a dated folder, and only count it as filed once the move is
   verified.

The console then sorts the work by time horizon (**Now**, **Today**, **Upcoming**,
**Waiting**, **FYI**) instead of by arrival order, and flags what needs a reply, what
has no owner, and what is overdue.

## v5: from triage console to reporting tool

By v4.1 the console could triage the mailbox, but the team keeps working in its
existing case tool and Outlook. The need that remained was visibility for management:
how much mail arrives, what it asks for, which stations generate it, and where
replies are going missing.

So v5 is a rewrite with a narrower job. It is **read-only**: it never answers, claims,
prioritizes or routes an email. It files and indexes every email the mailbox sends
and receives, and reports on them. The people using it are the coordinator, the team
lead and the manager.

- **Search** across every email ever received or sent, by air waybill in any format,
  truck, station, lane, sender, organization or words. Opening one shows the whole
  conversation, how its case type was decided, and the station's facts.
- **Overview** for leadership: received vs sent per day, top asks, FYI share, arrival
  by hour, replies by person and an Excel report built on formulas over a detail sheet,
  so every number can be traced.
- **Stations**: hub and spoke tiles and heat maps of stations by day and by request type.
- **Supervisor tools** to assign case types and signers in bulk when the rules can't
  decide, with a review workbook that round-trips through Excel.
- **Delivery errors (v5.2).** Bounce-backs used to be counted as questions. v5.2
  detects them by subject and sender, records the failed address, reason and status
  code, and reports them separately, so leadership sees which addresses fail and on
  which stations' conversations.

The v4.1 console is still in the demo panel for comparison.

## How it grew, v1 to v4.1

The repository has one tagged commit per release, so each step can be read on its own.

- **v1** was a script and a static HTML dashboard: clean, extract, classify, score
  and file, refreshed every minute. It proved the parsing and the scoring, and showed
  that a read-only page wasn't enough, because the team needed to claim and close work.
- **v2** became a local web app. A work queue with **Claim**, **Done**, **Note** and
  **Draft reply**; a rate check built from the team's rate workbook (tiers, fuel,
  all-in cost per pound, lane volume and the carriers actually moving it); and the
  team's working standards pinned beside the case types they apply to.
- **v3** reorganized around the question "what needs action, and when": the
  Now/Today/Upcoming tabs, a **Stations** view showing which stations are generating
  open problems, flight status for connecting flights through a pluggable provider with
  a hard daily call budget, and a synthetic demo inbox so it could be shown without
  real mail.
- **v4** made intake trustworthy and the app shareable. **Flush / Reconcile** checks
  byte-identical files (SHA-256), repeated Message-IDs and a content fingerprint, and
  sends ambiguous cases to a person instead of guessing. It added hub and spoke station
  views, a Rules / FAQ tab, a full English / Spanish interface, and an automated test
  suite including browser tests.
- **v4.1** fixed a defect v4 shipped with and added a supervisor area. More on both below.

## The design decisions that mattered

**Nothing is deleted, and nothing is assumed.** Intake reconciles; it never removes a
file. A duplicate is moved to a duplicates folder with its reason recorded. A message
without a Message-ID whose content matches an existing email is left in place for a
person to decide. Every run is written to an audit log with who ran it, when, and the
outcome for each file. In a shared mailbox, an email that silently disappears is worse
than one that shows up twice.

**A metric's name has to match what it measures.** v3 labelled a number "FTL
utilization" that was really the average load of a full truck divided by trailer
capacity. v4 corrected the definition to the share of a lane's pounds that moved on
full trucks, de-duplicated the underlying rows before summing, and kept the old number
under an honest name, *truck fill*, rather than deleting it. Zero or missing
denominators show a dash instead of a misleading 0%.

**Translation stops at the email.** v4 added a full Spanish interface. Everything the app owns (navigation, labels, statuses, case types, team
standards, the FAQ) is translated. The email itself, air waybills, truck numbers,
airport codes and reply templates are never translated, and the reading pane says the
text is shown as received.

**Identity comes from the machine, not the form.** Each action stores the name typed in
the app and, server-side, the Windows login of the PC running it. The browser can't
supply or override that login. There's no central sign-on, and the docs say so.

## The defect v4.1 fixed

v4 could record an email as imported even when moving the file into its dated folder
failed (a file locked by Outlook, a OneDrive placeholder that wasn't downloaded yet),
and later passes then skipped it. The result was files sitting in the intake folder
while the console reported nothing pending.

v4.1 counts a file as filed only once it is verified at the destination. A failed move
still stores the email so it shows up in triage, marks the file **stored, not filed**
with the reason, and retries on every pass. Emails that v4 had stranded are detected
and re-filed on the first run under the same key, so their notes and history stay
attached. There are tests for each of these paths.

v4.1 also added a password-protected **Supervisor** area: a leadership report with team-
level figures only (volume, queue aging, category mix, intake outcomes; no per-person
numbers), an intake health page with a plain-language fix for each unfiled file, and
folder settings that validate before saving. The password is salted and hashed, and the
README is explicit that this is local protection, not company single sign-on.

## Architecture

```text
Shared mailbox ──Power Automate──▶ intake folder (.eml)
                                        │
                     reconcile (SHA-256 · Message-ID · fingerprint)
                                        │
                    clean ▶ extract ▶ classify & score ▶ file by day
                                        │
                              SQLite (pulse.db) + audit log
                                        │
                 stdlib HTTP server ── localhost:8765 ── single-page UI
                                        │
                rate card · station config · flight provider · FAQ
```

One Python file with no required packages, one built HTML file for the interface
(assembled from separate HTML, script and translation sources), and JSON files for
everything a team lead might want to edit. Rebuilding the rate card from the workbook
needs `openpyxl`, and that is the only optional dependency.

## What's verified, and what isn't

Verified: v5.2 runs 28 tests covering intake, filing, classification, signer
attribution, bounce detection and the reports; the anonymized repository passes the
same suite. The v4.1 suite ran 35 tests (29 backend, 6 in a headless browser), covering
intake reconciliation, duplicate handling, overlapping runs, failed-move retry and
re-filing, the corrected utilization math, translation key parity, the supervisor
endpoints and the main UI flows. The anonymized repository passes the same suite.

Not verified in that suite: behavior on a real Windows and OneDrive machine. The tests
run on Linux, and the sync and file-lock behavior they guard against is simulated.

## What I'd do differently

- **The intake model should have been the first thing built, not the fourth.** Three
  releases trusted that a file in the folder meant an email handled once. Reconciliation
  and an audit trail belong at the start of any tool that touches shared records.
- **One large Python file ran too long.** v5 moved the reports and runtime into their
  own modules; parsing and intake still want the same treatment.
- **Monitoring only runs while someone has the app open.** A scheduled one-shot run
  covers it today; a small always-on service would be the real fix.

## Next

- Finish splitting the backend (v5 moved reports and runtime into their own modules)
- Weekly leadership summary generated from the same report definitions
- Measure response times before and after, rather than relying on the app's own
  time-saved estimate, which is labelled as an estimate for that reason
