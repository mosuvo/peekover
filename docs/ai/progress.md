# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-14.*

## Now (start here)
**Active spec:** `specs/001-core-rendering/` — extension skeleton + core render pipeline.
**State:** mid-M1 — skeleton (1.x/2.x) and the pipeline group (3.1 parse, 3.2 sanitize) done.
Next action = Task 3.3 (mount stage: shadow root, patch-on-rerender, <150ms perf harness).

## Done
- 2026-07-08..11 — Research, product spec (v2.1), full design system (design/), landing page
  (site/index.html), name verified+claimed (Peekover), this repo scaffolded.

## Up next
Remaining in M1 (spec 001):
- Remote-resource policy (late M1, per tasks.md): block remote images/resources by default;
  one-click opt-in that loads them + lights the network indicator; lazy-load permitted media.
- Golden-fixture work (tasks 5.x) must ALSO (a) run the malicious fixtures through DOMPurify in
  real Chrome + Firefox — the in-browser mXSS check logged in decisions.md — and (b) cover the
  remote-resource block behavior.

Carried to M2:
- Restore GFM table alignment safely (map to class, never inline style).

After 001: 002 file/folder sources + permissions UX · 003 TOC/navigation · 004 themes+settings ·
005 watch mode + diff (the differentiator) · … full order in docs/product/spec.md §Phase-1.

## Blockers / open questions
- none
