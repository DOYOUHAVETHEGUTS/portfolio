---
title: Late Trucks — Daily Lateness Report & Worklist
slug: late-trucks
track: analytics
featured: true
order: 4
year: 2026
status: active
role: Sole developer
period: 2026
type: Operations reporting · Data pipeline
summary: Turns the daily truck export into a supervisor report, a worklist for the agents and a 13-month history, and measures arrivals against the published schedule instead of a time that can be moved after the fact. It surfaced late trucks the system was showing as on time.
stack: [Python, pandas, xlsxwriter, SQL (Teradata, Databricks), Power BI (TMDL), Tableau, unittest]
repo: https://github.com/DOYOUHAVETHEGUTS/late-trucks
demo: /files/trucking-dashboard-v12/October%202026/Trucking%20Dashboard%20%28What-If%29%20-%20October%202026.html
demo_embed: false
demo_note: Opens the synthetic v12 dashboard. Pick the Reliability tab for the history this tool produces.
---

!!! note "Synthetic data"
    The screenshot and the linked dashboard come from a generated 13-month truck history:
    invented carriers, trucks and times. Open the dashboard's **Reliability** tab to see the
    history this tool produces.

## Problem

Every day the team works through trucks that left late, arrived late or never
departed. The input was a reporting export that took manual sorting, and the
result lived in a shared report card typed up by hand.

There was a deeper problem with the number itself. When a truck runs late,
agents move its scheduled arrival in the cargo system so the destination station
knows when to expect it. That's the right thing to do for the station. But the
reporting reads the same field, so a truck that missed its published time can show
as on time. The on-time rate looked better than the operation was.

## Approach

**Measure against the published schedule.** Scheduled arrival comes from the
truck schedule for that truck number, lane and weekday on that date, in the
destination's local time. The cargo system's time is kept alongside it. When the
system's time is later and the truck missed the schedule, the truck is counted as
**pushed (hidden late)**. Trucks that aren't on the schedule (ad hocs) are measured
against the system's time, and a column on every row says which basis was used.

**Rebuild the schedule's history.** A truck in March should be judged against the
schedule as it stood in March. The tool rebuilds schedule versions from the
change log, so the trend measures each month fairly.

**Don't call a truck late before the data could know.** Trucks due after the
overnight data refresh are marked *Pending* rather than *No arrival*, and the log
says how old the data is.

```text
truck export (reporting tool download)  or  direct pull (Teradata + Databricks SQL)
        │
        ▼
  collapse rows to one per truck order · keep the newest version
        │
        ▼
  match to the published schedule (as it stood that day) · station-local times
        │
        ▼
  status: on time · late · pushed (hidden late) · no departure · pending · check date
        │
        ├─▶ supervisor report: Dashboard, Worklist (worst first), Report Card rows
        ├─▶ agent workbook on the team site
        ├─▶ history store + snapshots + shift-to-shift comparison
        └─▶ Power BI model · dashboard Reliability tab
```

## What it produces

- **Worklist**, worst first: no-shows, overdue arrivals, records keyed on the wrong
  date, late arrivals, projected late, late departures. Each row says what to check.
- **Report Card rows** already in the shared card's column layout. A row turns green
  once its reason, summary and initials are filled in, ready to paste.
- **Agent workbook** for the shared site, with the same logic in formulas so agents
  can work it without running Python. On a full day's extract, its departure status,
  arrival status and scheduled arrival matched the Python report on every truck.
- **History and trends** by month and week, by carrier, destination and origin, plus
  a comparison with the previous shift so a supervisor sees what changed.
- **Checks**: schedule match rates, reconciliation with the report card, and an
  air-waybill audit when a shipment file is provided.

![Reliability tab of the trucking dashboard, fed by this tool's history (synthetic data): true on-time against the published schedule next to the system figure, and a 13-month carrier heat table.](/img/late-trucks-reliability.jpg)

## What it found

Measured against the system's own time, on-time arrival looked steady and even
improving. Measured against the published schedule, it was flat, and the gap
between the two widened through the year as more arrival times were pushed. The
report now shows both figures side by side, and the pushed trucks have their own
column so a carrier conversation can start from what actually happened. I'm not
publishing the rates themselves.

## How it runs

One batch file. Download the export (it picks up the newest file from Downloads on
its own), press Enter, and the report, history and agent workbook are rebuilt. A
menu covers the less frequent jobs: rebuild the agent workbook after a schedule
change, snapshot a worked report, compare against the last snapshot, rebuild
history, check the schedule for rows the report can't read, or pull straight from
the databases instead of the download.

## What I'd do differently

- The direct database pull reproduces the export's quirks to stay comparable. Once
  the team trusts it, it should become the only path and the download can go.
- Two copies of the status logic exist, Python and spreadsheet formulas. They're
  tested against each other, but one definition would be safer.

## Next

- Feed pushed-truck counts into the carrier scorecard on the dashboard's Vendors tab
- Retire the manual report card once the generated rows are the record
