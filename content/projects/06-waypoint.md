---
title: Waypoint — Mentorship Platform
slug: waypoint-mentorship
track: software
featured: true
order: 13
year: 2025
status: archived
role: Founding member
period: 2025
type: Full-stack web application
summary: A college and career mentorship platform for underserved high school students — student journals, a cohort forum, and credit-based progress tracking. No longer operating; rebuilt here as a working demo from my original source.
stack: [JavaScript, Velo, Wix Data, REST, HTML/CSS]
demo: /apps/waypoint/
demo_embed: true
demo_note: Rebuilt client-side from the original source. All data is fictional.
---

!!! note "Archived, and renamed"
    The platform is no longer live and the organization is not named here. The
    product framing, student data, and forum content below are fictional; the
    architecture and code are my own work from the original build.

## Founding members

Waypoint was built by four founding members:

- **KeAndre Williams**
- **Fares Ali**
- **Eric Licona**
- **Grant Anderson**

## Context

Students without well-resourced counseling arrive at post-secondary decisions
with the least information and the least time. Mentors want to help and mostly
can't do it well — they meet a student every few weeks with no memory of what
happened in between, so the first ten minutes of every meeting go to rebuilding
context instead of using it.

The platform I worked on was a cohort tool aimed at that gap: give students a
place to write in their own words, give mentors something to read before the
meeting, and make progress toward graduation legible to both.

## My contribution

I built three features end to end — the page logic and the server-side modules
behind them. I did not build the platform alone; where a teammate's work is
adjacent to mine I've left it out rather than blur the line.

The product had a tiered roadmap, and all three of the features I owned sat in
the first release tier — the set the team judged essential to have a working
product at all. The later tiers were where the AI-driven features lived:
analysis of student journal entries to surface insights for mentors, chatbot
interfaces for both students and counselors, and meeting-preparation prompts
generated from student data. Those were roadmap, not shipped work, and I didn't
build them. What I built was the foundation they would have read from — which is
the less glamorous half and the half that had to be right first.

- **Student journal** — entry submission and retrieval, with server-side
  authorship scoping so a student's queries only ever returned their own entries.
- **Cohort forum and private channels** — channel creation and the permissions
  records that gated access.
- **Progress tracking** — credit-based graduation progress, computed server-side
  and rendered against a target.

## The interesting problem: input you didn't write

The journal accepts free text from teenagers and displays it back to a cohort.
That is an injection surface and a moderation surface at the same time, and both
had to be handled where the user couldn't reach them.

Everything ran through a server module before touching the database — escape on
write, screen against a wordlist, attach the authenticated author, then insert.
Doing it server-side wasn't incidental: a client-side filter ships the wordlist
to the browser and can be stepped around with the dev tools open.

```javascript
// original: escape on write, then store
const post = {
  postTitle: escapeHtml(postTitle),
  content:   escapeHtml(postContent),
  author:    userId,        // from the session, never from the client
  isPrivate,
  createdAt: new Date(),
};
```

Retrieval was scoped the same way — the author filter was applied on the server
from the session identity, so "show me my entries" could not be widened into
"show me everyone's" by editing a request.

## Architecture

```text
page code ──► backend modules ──► collections
  journal        submitPost         BlogPosts
  forum          getBlogPosts       PrivateChannels
  progress       createChannel      Permissions
                 setPermissions     GraduationProgress
                 getProgress
```

The split matters: page code only ever called named server functions, so
authorship, moderation, and permissions logic never existed in the browser.

## The demo above

The original ran on a hosted platform I no longer have access to, so rather than
link a dead URL I rebuilt the three features as a self-contained client-side app.
It's a faithful port of the behavior, not a screenshot: the journal escapes and
screens input on write, the forum threads across public and private channels, and
the progress bar is derived from the credits attached to completed milestones
rather than being a separate number that can drift out of sync.

What the demo necessarily loses is the part that mattered most — the server
boundary. Everything it does is in the browser because there's nothing behind it.

## What I'd do differently

Reading this code back, three things stand out.

**The forum page reimplemented its own channel creation.** The page inserted a
record directly while the backend module created a real channel through the
platform's forum API. Two implementations of one operation, and the page's copy
shadowed the correct one. That's the kind of drift that happens when a workaround
gets written next to the thing it was working around instead of replacing it.

**A handler registered inside a re-run function.** The journal's "load more"
click handler was bound inside the same routine that reloads entries after every
submission, so handlers stacked with each save and the paging index reset under
them. It's a small bug with a general lesson: binding belongs in setup, not in
the render path.

**The progress update path never identified the record.** The update was written
against a user id rather than the row's own key, which the data layer needs to
target a document. Writing a test against a real record would have surfaced it
immediately; there were no tests.

## What I took from it

The features that were hardest weren't the ones that looked hard. Rendering a
progress bar is an afternoon; deciding what it should be derived *from* so it
can't lie is the actual design work. The same went for the journal — the text box
was trivial, and everything that made it safe to publish lived somewhere the user
never sees.
