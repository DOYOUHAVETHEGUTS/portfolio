---
title: StarStruck — Engineering Career Map
slug: constellation-map
track: data-ai
featured: true
order: 12
year: 2025
status: active
role: Founding member
period: 2025
type: Data visualization · Interactive graph
summary: An interactive graph that maps fields to the skills they need, the education that grounds them, and the careers they open — and hands concrete goals off to the mentorship tracker.
stack: [JavaScript, custom force-directed layout, SVG, JSON schema]
demo: /apps/constellation-map/
demo_embed: true
demo_note: Click any node. Selecting a skill or career reveals goals you can send to the Waypoint tracker.
demo_versions:
  - label: v1 — current
    url: /apps/constellation-map/
    note: Click any node. Selecting a skill or career reveals goals you can send to the Waypoint tracker.
  - label: v2 — redesigned
    url: /apps/constellation-map-v2/
    note: Fields, Skills, Education, and Careers sit in four fixed columns. Loads d3 from a CDN — see the note below.
---

## Founding members

StarStruck was built by four founding members:

- **KeAndre Williams**
- **Fares Ali**
- **Eric Licona**
- **Grant Anderson**

## Problem

Career advice for students tends to arrive as a flat list — "here are some jobs,
here are some skills" — with the connections left implicit. The connections are
the whole point. A student who likes one field can't see which skills it actually
needs, what grounds those skills, or which careers they open, because nobody drew
the edges.

This started as the "Industry Ranking" feature from a mentorship platform's
roadmap — an R3 item that never shipped. Rather than a ranking, I built the thing
the ranking was gesturing at: a navigable map of how fields, skills, education,
and careers connect.

## Approach

The map is a directed graph with four kinds of node — **field → skill →
education → role** — laid out with a d3 force simulation. Selecting a node dims
everything but its neighbors and shows where it sits in the chain: a skill traces
back to its field and forward to the careers it supports; a career gathers the
skills that lead into it.

The design choice that matters most isn't visual. **The graph is data, not code.**
Every node and edge lives in one JSON file, separate from the rendering. Adding a
field, a skill, or a career is a data edit — the force layout, the inspector, and
the filtering all read from the same structure and never need to change. That
separation is what lets the map scale past a demo without a rewrite.

```javascript
// nodes carry a kind and, for skills, checkable goals
{ id: "ml", kind: "skill", label: "Machine Learning", field: "data-science",
  goals: [
    { title: "Train a baseline model and beat it with a second approach", credits: 8 },
    { title: "Evaluate with a proper holdout and a calibration check", credits: 6 }
  ] }
```

## The handoff — why this connects to the mentorship tracker

A map that only shows connections is a poster. The point of exploring a career is
to do something about it, so the map closes the loop into the [Waypoint mentorship
platform](/projects/waypoint-mentorship/).

Select a career and it gathers the goals from every skill that leads into it.
"Send to Waypoint" opens the progress tracker with those goals loaded as
milestones — so a student who explores *ML Engineer* in one tool arrives in the
other with a concrete, credit-weighted plan already built. **Try it in the demo:
click a career node, then the send button.**

The contract between the two apps is deliberately thin: a list of
`{ title, credits }`. Neither app knows anything about the other's internals —
the map emits goals, the tracker consumes them, and either could be replaced
without touching the other. That's the same lesson as the rest of this portfolio:
the integration is a small, well-defined interface, not a tangle.

## Dual-layer view

The prompt behind this asked for two audiences, and the structure serves both.
The **portfolio view** is this case study — the overview, the challenge, the
architecture decision. The **application view** is the embedded map itself:
full interaction, filtering by node kind, deep-linkable to any node. One artifact,
read two ways depending on who's looking.

## Version 2 — the redesign

A second version is available from the demo toggle at the top of this page under
**v2 — redesigned**, so the two sit side by side rather than one replacing the
other. v2 keeps the same data model and reworks the experience around it:

- **A layout that doesn't overlap.** v1's free-floating force simulation let
  nodes drift and collide. v2 fixes Fields, Skills, Education, and Careers into
  four columns connected by curved links, so the whole structure is legible at a
  glance without dragging anything into view.
- **A much richer detail panel.** Selecting a node now surfaces real,
  role-specific resources: self-assessment tools, mentor-guidance prompts, labor
  market research links (O\*NET, BLS), internship pointers, and the connected
  skills that feed into it — where v1 showed little more than a node's neighbors.
- **Direct links out.** The panel connects each field and career to external
  resources a student can actually act on, turning the map from a picture into a
  starting point.
- **Search and reset.** A search box highlights matching nodes and a single reset
  clears selection, filters, and zoom.

**One honest trade-off:** v2 loads d3 from a CDN, where v1 was deliberately
rewritten *away* from that dependency after the original prototype rendered blank
behind a blocked network (see Provenance). Both are kept so the layout gains and
that deployment risk can be weighed against each other rather than hidden.

## Provenance

The first version was a v0-generated Next.js prototype: a d3 force graph of
disciplines and subfields with click-to-inspect and interest-based filtering. It
was a good starting point and the wrong shape for this site — a full Next.js app
with sixty-odd UI dependencies and its data hardcoded as a component tree with the
icons baked in, so the data couldn't be reused.

The team kept the interaction model that worked — force layout, click to focus
neighbors, filter by category — and re-architected the rest: extending the chain
from fields-and-subfields to the full field → skill → education → career path,
pulling the data out into a standalone JSON schema, dropping the framework so
it's one self-contained file, and adding the handoff that makes it more than a
viewer. My own work centered on the data model and the cross-app handoff; the
version rendered here is the one I rebuilt for this portfolio.

## What I'd do differently

- **The force layout is legible at this size but won't stay that way.** Past a few
  dozen nodes it wants either clustering by field or a switch to a tidier layout
  (a radial tree) for dense regions.
- **Goals live on skills only.** Education nodes could carry their own
  prerequisites so the handoff includes foundations, not just applied skills.
- **The schema is hand-written.** At scale it should be validated against a
  formal shape so a malformed node fails loudly at load rather than rendering
  half a graph.
