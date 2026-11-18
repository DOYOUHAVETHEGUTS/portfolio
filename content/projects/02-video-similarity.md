---
title: FrameMatch — Video Similarity Detection
slug: video-similarity
track: data-ai
featured: true
order: 9
year: 2025
status: active
role: Developer, with one collaborator
period: 2025
type: Computer vision · Near-duplicate detection
summary: A tool that finds re-encoded, trimmed, or resized copies of a video by fingerprinting frames and matching them — built through three versions, ending on ORB feature matching parallelized across CPU cores.
stack: [Python, OpenCV, ORB, perceptual hashing, imagehash, multiprocessing, NumPy]
demo: /apps/framematch/
demo_embed: true
demo_note: An interactive model of the two levers that drive the tool. The real pipeline runs OpenCV; this runs in your browser.
repo: /files/framematch_orb_parallel.py
---

<!-- Grounded in the actual source. The demo above models the sampling/threshold
     trade-off; the "Source" link is the real ORB + parallel-CPU script. -->

## Credit

Built collaboratively with a contributor who preferred to remain unnamed. The
work below reflects that collaboration; where a decision or a piece of the
implementation was mine specifically, I've said so.

## Problem

I make gameplay clips, and I kept re-uploading footage I'd already used without
realizing it. Filenames don't help — the moment a clip is trimmed or re-encoded,
the bytes change completely while the content is identical. I wanted to hand the
tool a new clip and ask a real question: *have I already used this footage, even
in an edited form?*

That's near-duplicate detection, and it's harder than exact-match because the
thing you're looking for has been deliberately or incidentally altered.

## Approach, in three versions

The interesting part of this project is that it has a history — each version
failed in a way that taught me what the next one needed.

**Version 1 — perceptual hashing.** The prototype extracted a frame every 30
frames, computed a pHash per frame, and compared clips by Hamming distance. It
worked when two videos were near-aligned, but it compared frame *i* of one to
frame *i* of the other — so a single cut early in a clip shifted everything and
the whole comparison fell apart. It proved the fingerprinting idea and exposed
the real problem: alignment.

**Version 2 — a GUI, because I wanted to actually use it.** I wrapped the pHash
comparison in a Tkinter interface with file pickers, three progress bars, and a
log pane, and ran the work on a background thread so the window didn't freeze
during extraction. It made the tool usable and made its weakness obvious in the
progress bars: comparing every frame to every frame doesn't scale, and the
position-locked matching still broke on any edit.

**Version 3 — ORB features and parallel matching.** The current version fixes
both. It samples roughly one frame per second instead of a fixed frame count,
so clips of different lengths stay comparable. It swaps position-locked hashing
for ORB descriptors, which match on visual structure rather than frame order, so
a trimmed or resized copy still matches. And the matching runs across all CPU
cores, because fingerprinting frames is independent work.

## How version 3 works

```text
new clip ──► sample ~1 fps ──► ORB descriptors ─┐
                                                 ├─► brute-force match ──► score
parent videos ──► sample ~1 fps ──► descriptor DB┘   (Hamming, crossCheck)
                                    │
                            ProcessPoolExecutor across all cores
```

The matcher builds a descriptor database from the parent videos once, then scores
each new-clip frame against it in parallel:

```python
def match_frame_cpu(args):
    frame_path, descriptors_db = args
    des_new = compute_orb_descriptors(frame_path)
    if des_new is None:
        return 0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = []
    for db_desc in descriptors_db:
        matches.extend(bf.match(des_new, db_desc))
    return sum(1 for m in matches if m.distance < 50)

with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count()) as ex:
    match_counts = list(ex.map(match_frame_cpu, args))
```

A frame counts as a strong match past a minimum number of good descriptor pairs;
the clip's confidence is the fraction of its frames that matched strongly.

## The two levers (try the demo)

The whole tool comes down to two decisions, and the demo above lets you move both:

- **Sampling rate** — how many frames per second to fingerprint. Lower is
  dramatically cheaper but risks skipping the frames that would have matched.
- **Match threshold** — how different two fingerprints can be and still count as
  the same frame. Too loose matches unrelated frames; too tight breaks on a heavy
  re-encode.

Those two knobs trade recall against cost and robustness against false positives.
Watching them fight is the whole intuition behind the tool.

## What I'd do differently

- **Brute-force matching is O(frames × database).** It's fine for my clip library
  but wouldn't hold at scale — the descriptors want a proper vector index (FAISS)
  so lookup stays sublinear as the database grows. That's the clear next step.
- **The match cutoffs are magic numbers.** `distance < 50` and the strong-match
  minimum were tuned by hand on my own footage; they should be calibrated against
  a labeled set and exposed as parameters rather than buried as constants.
- **Descriptors are recomputed every run.** The parent database is rebuilt from
  scratch each time; persisting it would make repeat comparisons near-instant.

## What I took from it

Two things. First, the honest version of "I built a computer vision tool" is a
sequence of prototypes that each broke — the pHash version taught me that
alignment, not fingerprinting, was the hard part, and I wouldn't have known to
reach for feature matching without it. Second, the demo makes a point I keep
relearning: most of the engineering in a matcher isn't the match, it's choosing
what to sample and how strict to be, because those two numbers decide whether the
whole thing is fast, accurate, or neither.
