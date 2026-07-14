# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-14.*

## Now (start here)
**Active spec:** `specs/001-core-rendering/` — extension skeleton + core render pipeline.
**State:** mid-M1 — SHELL GROUP + golden-fixtures/perf group (5.1, 5.2) complete. The reader is
detect → parse → sanitize → mount → themed reading → Raw toggle → never-blank fallback, on
Chrome + Firefox, `permissions:[]`, ~266KB packed. 128 unit + 62 in-browser tests green.
Next action = the **remote-resource policy** task (block remote images by default + one-click
opt-in + network indicator; the last M1 feature before trust docs 6.x).

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
- 2026-07-14 — 5.2 real-browser first-paint measured on the 1.12 MB huge-doc fixture (task 5.2).
  Local gate only (NOT in CI — wall-clock asserts flake on shared runners). `pnpm perf`
  (`scripts/perf-first-paint.ts`) drives the BUILT extension in headless Chromium via Playwright,
  7 iterations, cold run discarded. Metric: reader first-paint = `performance.now()` at the 2nd
  rAF after `<peekover-root>` first has populated open-shadow content (timeOrigin-relative).
  - **(a) navigationStart → reader painted: median ~1245 ms** (two runs: 1254.2 / 1236.6 ms;
    stable). **(b) responseEnd → reader painted: median ~1243 ms** (1252.0 / 1235.0 ms).
  - Machine: 13th Gen Intel Core i7-13700 (24 threads), Windows, dev machine, headless chromium
    via Playwright.
  - **GATE: FAIL vs <150 ms** (~8×). Acceptance box left UNTICKED. This is a measurement task —
    no src/ changes were made to chase the target; the orchestrator decides next steps.
  - Breakdown (why): the cost is NOT the pipeline. Per-run navigation marks show the browser's own
    raw-text render of the 1.12 MB file:// `<pre>` (`load` mark ~0.94–1.13 s) dominates, and the
    content script only runs at `runAt:'document_idle'` AFTER that; the reader's own parse→sanitize→
    mount adds ~200 ms on top. Pure parse+sanitize is well under budget (pipeline.perf.test.ts).
    Browser first-contentful-paint is not reported for file:// text here (printed as n/a).
  - Levers for a future optimization pass (out of scope for 5.2): earlier `runAt`, streaming/chunked
    mount, or not waiting on the browser's full raw-text layout before mounting.

## Up next
Immediate — remaining in M1 (spec 001):
- Remote-resource policy (tasks.md): block remote images/resources by default; one-click opt-in
  that loads them + lights the network indicator; lazy-load permitted media (loading="lazy" / IO).
- Trust docs 6.x: docs/trust/PERMISSIONS.md v1 (every manifest line justified); progress update.

Done in the golden-fixtures + perf group (spec 001, tasks 5.1/5.2), see Done above:
- 5.1: 10 golden fixtures + snapshot runner in CI, plus the in-browser mXSS re-check
  (real Chrome + Firefox). 5.2: 1 MB first-paint measured (FAILs the <150 ms gate; recorded).

Carried to M2:
- Restore GFM table alignment safely (map to class, never inline style).

After 001: 002 file/folder sources + permissions UX · 003 TOC/navigation · 004 themes+settings ·
005 watch mode + diff (the differentiator) · … full order in docs/product/spec.md §Phase-1.

## Blockers / open questions
- none
