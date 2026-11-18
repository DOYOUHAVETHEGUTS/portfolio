---
title: Truck Schedule Advisor — Add, Remove or Consolidate
slug: truck-schedule-advisor
track: analytics
featured: true
order: 3
year: 2026
status: active
role: Sole developer
period: 2026
type: Decision tool · Excel workbook generator
summary: Reads a month of carrier purchase orders, the truck schedule and container movement reports, then recommends where an ad hoc truck should become a scheduled day, which scheduled days to drop, and where trucks could have been consolidated. Its central finding is that trucks run out of space long before they run out of weight.
stack: [Python, pandas, openpyxl, xlsxwriter, LibreOffice (formula checks), unittest]
repo: https://github.com/DOYOUHAVETHEGUTS/truck-schedule-advisor
demo: /files/trucking-dashboard-v12/October%202026/Trucking%20Dashboard%20%28What-If%29%20-%20October%202026.html
demo_embed: false
demo_note: Opens the synthetic v12 dashboard. Pick the Schedule Advisor tab.
---

!!! note "Synthetic data"
    The screenshots and the linked dashboard use the synthetic sample that ships with the
    repository: invented carriers, trucks, rates and weights. Open the dashboard and pick the
    **Schedule Advisor** tab to use the same views interactively.

## Problem

Every ad hoc truck costs the team time. Someone has to bid it out to carriers,
compare the answers and book it, which takes one to two hours per truck. When the
same lane needs an ad hoc truck every Friday, that work repeats every week for
something a scheduled truck would cover.

The opposite problem hides in the schedule: scheduled trucks that run light or
empty on certain days, paid for whether or not they carry freight. Neither
pattern is visible in a purchase-order export one line at a time.

## Approach

The tool answers three questions for a month, domestic and international side by
side:

1. **Should we add a truck or a day?** It counts ad hoc full trucks by lane and
   weekday and compares them with the schedule. If the carrier that runs the ad
   hocs already runs scheduled trucks on that lane, the action is to ask them for
   the extra day. If not, the action is to bid it out. Every recommendation carries
   a transit-day check, because a schedule change can break a customer connection.
2. **Should we remove a scheduled day?** It flags scheduled days that carried no
   freight, and days that ran light even after counting container space. Anything
   the purchase-order data can't prove becomes **Check**, not **Remove**: trucks
   that moved containers with no charge recorded, trucks billed monthly, trucks with
   no weight entered.
3. **Could the day's trucks have fit on fewer?** It checks consolidation against
   both weight and space.

![The Schedule Advisor view on the synthetic sample: ranked add, remove, consolidate and justify actions, each with its reason and numbers.](/img/schedule-advisor-actions.jpg)

## The finding: space, not weight

Measured by weight alone, scheduled trucks look half empty, which makes a lot of
them look like candidates to cut. They aren't. Trucks fill their container
positions long before they reach the weight limit. A truck carrying bulky but
light freight has no room left, even though the weight says otherwise.

So the tool measures fill both ways. It counts positions from the container
movement report (a large container is one position, a small one is half) and
works out, per lane, how much weight a truck carries when its space is full. A
truck's **fill** is the higher of its weight fill and its position fill. On lanes
that are mostly loose freight, where positions can't be counted, it uses the
weight the heaviest tenth of that lane's trucks actually reached.

That change moved the recommendations. Trucks that looked like removal candidates
on weight turned out to be full on space, and the ones still flagged are the ones
light on both. The Space vs Weight tab shows the evidence, so a reader can check
the reasoning rather than take the label.

![Ad hocs by lane and weekday, and the space-versus-weight split on the synthetic sample.](/img/schedule-advisor-space-weight.jpg)

## What it produces

One workbook per month, built to be read by someone who didn't run it:

- **Summary** with domestic, international and total side by side, linked to the
  top actions
- **Lane x Day** grid of ad hocs, with scheduled days outlined
- **Add, Remove, Consolidation and Ad Hoc Review** tabs, each row stating the
  action, the reason and the numbers behind it
- **Change Log and Change Review**: proposals are written into the team's existing
  change log, and eight weeks before and after a logged change are compared to
  check whether it worked
- **Emails**: drafted wording to ask a carrier for a day, request bids, or ask a
  requester to justify a light truck

The workbook keeps its formulas live over the input tabs, so every number can be
traced back to the purchase-order line it came from. The same output feeds the
Schedule Advisor tab of the [Trucking Cost & Revenue Dashboard](/projects/trucking-dashboard/).

## How it's checked

- **Formulas against Python.** The workbook's formulas are recalculated in
  LibreOffice and compared cell by cell with the Python analysis. On a full real
  month, every compared cell matched.
- **52 tests** on the synthetic sample cover truck-number ranges, vendor alias
  matching, the add, remove and consolidation rules, and the workbook itself.

## What I'd do differently

- Positions per truck is a setting (5 domestic, 7 international) based on the
  container history. It should be confirmed with the carriers rather than inferred.
- The lane history export from the reporting tool has a row limit, so older months
  need a filtered re-export. A direct query would remove that step.

## Next

- Track the logged changes over a quarter to measure hours saved on ad hoc booking
- Feed the recommendations into the carrier bid cycle as a standing input
