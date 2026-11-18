---
title: Trucking Cost & Revenue Intelligence Dashboard
slug: trucking-dashboard
track: analytics
featured: true
order: 1
year: 2026
status: active
role: Sole designer and developer
period: 2026
type: Analytics engineering · Reporting product
summary: A Python-generated monthly dashboard that reads trucking cost against the revenue it enables, station by station and lane by lane. Now on v12 with twelve tabs, including schedule recommendations, carrier reliability, vendor scorecards and a rate lookup for Sales.
stack: [Python, pandas, Plotly, Jinja2, openpyxl, HTML/JS]
repo: https://github.com/DOYOUHAVETHEGUTS/trucking-dashboard
demo: /files/trucking-dashboard-v12/October%202026/Trucking%20Dashboard%20%28What-If%29%20-%20October%202026.html
demo_embed: true
demo_note: The v12 build on a fully synthetic 13-month dataset. Use the tabs, the month picker and the what-if sliders. Every carrier, rate, weight, cost and revenue figure is invented.
---

!!! note "Synthetic data"
    The sample above runs on a generated dataset: invented carriers, rates, weights,
    costs and revenue on public airport codes. It shows how the dashboard works, not
    what any real network spends. The real build runs on internal figures that are not
    published here, and earlier samples have been taken down for the same reason.

## Problem

Trucking is one of the larger controllable costs in air cargo, but a cost total
can't tell you whether you're spending well. A station can be cheap per pound
and still be a poor use of the network if the freight it moves is low-value.
Another can look expensive until you see it carries the highest-revenue product
on the system. Cost has to be read against the revenue it enables, at the level
where decisions get made: the station and the lane.

The monthly reporting that existed answered the total but not the judgment. I
wanted one artifact a manager could open and, within a minute, see which
stations and lanes to look at and why.

## Approach

The core idea is a two-axis read on every station: **cost efficiency on one
axis, revenue enablement on the other.** Each station is plotted against the
system average, which turns a flat cost table into four quadrants with different
meanings. Low cost with high-value freight is the goal; costly with low-value
freight is where attention goes.

![Cost & Revenue tab on the synthetic October 2026 build: each station plotted on cost per pound and revenue per pound against the system average.](/img/trucking-dashboard-v12.jpg)

## How it grew to v12

v1 had five tabs and a month library. Each version since added a view because
someone using it asked the next question.

| Group | Tab | Question it answers |
|---|---|---|
| Spend & efficiency | Cost & Revenue | Which stations cost more per pound than they earn? |
| | Regions | Where is the volume, and which parts of the network run expensive? |
| | What-If | What happens if rates, volume or truck counts change? |
| Utilization & schedule | TPI | Are we filling the trucks we pay for? |
| | Stage Length | Does a longer haul earn its cost? |
| | Schedule Advisor | Should a scheduled truck be added, removed or consolidated? |
| Vendors & rates | Vendors | Which carriers are cheapest and most reliable on each lane? |
| | Reliability | Are trucks arriving on the published schedule, not just the system's? |
| | Rate Lookup | What should a lane cost for a Sales quote, and who can run it? |
| Trends | Y/Y and Prior Months | Is this month better, or just seasonal? |

Three of those tabs are fed by tools I built separately. The Schedule Advisor
tab reads the monthly [Truck Schedule Advisor](/projects/truck-schedule-advisor/)
workbook, and the Reliability tab reads the history kept by
[Late Trucks](/projects/late-trucks/). An input that's missing only blanks its
own tab, and the Home tab lists which inputs the build found that month.

## The decisions that mattered

**A persistent actuals store, which fixed a quiet bug.** Early versions could only
read trucking actuals for months that still had a raw export in the inputs
folder. For any other month they fell back to a different cost column. The page
still rendered; it was just comparing two definitions of cost. Actuals now live in
a history store, so a month's figures stay correct after its raw export is gone.
This is the kind of defect I care most about catching: nothing errors, the output
looks fine, and the number is wrong.

**Fuel separated from cost.** Burdened cost and cost before fuel surcharge are
shown separately, driven by a maintained fuel assumption. When fuel moves, a
station can look like it's getting worse when only the surcharge changed. Keeping
them apart points the carrier conversation at the part the carrier controls.

**One governed reference workbook.** Region mapping, fuel assumptions, lane stage
lengths and airport coordinates moved from separate files into one workbook. New
lanes are added automatically, and manual overrides are never overwritten.

**A three-minute monthly build.** Drop the month's files in, double-click, and
upload the output folder to the team site. Every month is rebuilt on every run,
so every page has the same tabs and the full month list.

### The reframing

The project didn't end up answering the question it started with. The original
framing was profitability: cost against margin, station by station. The revenue
data isn't segmented cleanly enough to support that, and forcing it would have
produced a confident answer built on a join the data couldn't carry.

So the question changed from *how profitable is this station* to *how much
revenue does this trucking spend enable*. Almost none of the work had to be
thrown out. The cost derivations, joins and quadrant logic didn't depend on which
revenue definition sat on the second axis. Keeping metric definitions in one
place is what made that switch cheap.

## How it's used

The dashboard supports carrier negotiations. Carriers bid on schedules and lanes
on a recurring cycle, and the lanes it flags give the team a specific list to take
back to a carrier. The Rate Lookup tab is built for Revenue Management and Sales to
price a lane with every contracted option visible. I'm not publishing negotiated
outcomes; the honest claim is that it's in active use in a recurring commercial
process.

## Architecture

```text
monthly drop-ins (cost analysis, TLM export, optional add-on workbooks)
        │
        ▼
   build.py
   ├─ load + reconcile (pandas), persist actuals to the history store
   ├─ derive metrics: cost/lb, rev/lb, TPI, fuel-adjusted cost, variances
   ├─ read add-ons: Schedule Advisor, Late Trucks history, rate sheet
   ├─ render figures (Plotly) + template the page and what-if engine
        │
        ▼
   one self-contained HTML file per month + index.html → team site
```

## What I'd do differently

- The what-if engine is JavaScript injected into a template. Past this size it
  wants to be a small typed module with its own tests.
- Quadrant thresholds are fixed constants. They'd be better as settings a reader
  can move to watch the quadrants reshuffle.
- The add-on readers find their workbooks by file name. A small manifest would
  make the inputs self-describing.

## Next

- A data-quality gate that blocks a build when the cost and TLM exports disagree
  beyond a tolerance
- Shared metric definitions factored into a module the other trucking tools import
