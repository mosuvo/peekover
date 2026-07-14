# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-14.*

## Now (start here)
**Active spec:** `specs/001-core-rendering/` — extension skeleton + core render pipeline.
**State:** mid-M1 — the SHELL GROUP is complete. The reader is functionally done:
detect → parse → sanitize → mount → themed reading → Raw toggle → never-blank fallback,
on Chrome + Firefox, `permissions:[]`, ~266KB packed, 111 tests green.
Next action = the golden-fixtures + perf group (tasks 5.1 / 5.2).

## Done
- 2026-07-08..11 — Research, product spec (v2.1), full design system (design/), landing page
  (site/index.html), name verified+claimed (Peekover), this repo scaffolded.
- 2026-07-14 — Reader shell group (M1), all pushed:
  - 3.3 mount stage: parse→sanitize→shadow DOM, + hardening (restore the page if mount fails —
    never blank).
  - 4.1 design tokens, Literata bundled inline (zero-network), auto light/dark, 76ch column.
  - 4.2 Raw/Reading toggle (pill + bare `\` shortcut) + render-error banner.
  Net: the reader is end-to-end functional (Chrome + Firefox), `permissions:[]`, ~266KB packed,
  111 tests green.

## Up next
Immediate — golden-fixtures + perf group (spec 001, tasks 5.1/5.2):
- 5.1: 10 golden fixtures + snapshot runner wired into CI. Must ALSO (a) run the malicious
  fixtures through DOMPurify in a real Chrome + Firefox context — the scheduled in-browser mXSS
  re-check logged in decisions.md — and (b) cover the remote-resource block behavior.
- 5.2: perf measurement on a 1MB fixture, recorded here in progress.md.

Then, remaining in M1 (spec 001):
- Remote-resource policy (tasks.md): block remote images/resources by default; one-click opt-in
  that loads them + lights the network indicator; lazy-load permitted media (loading="lazy" / IO).
- Trust docs 6.x: docs/trust/PERMISSIONS.md v1 (every manifest line justified); progress update.

Carried to M2:
- Restore GFM table alignment safely (map to class, never inline style).

After 001: 002 file/folder sources + permissions UX · 003 TOC/navigation · 004 themes+settings ·
005 watch mode + diff (the differentiator) · … full order in docs/product/spec.md §Phase-1.

## Blockers / open questions
- none
