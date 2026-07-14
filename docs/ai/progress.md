# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-14.*

## Now (start here)
**Active spec:** `specs/001-core-rendering/` — extension skeleton + core render pipeline.
**State:** mid-M1 — SHELL GROUP + golden-fixtures/perf group (5.1, 5.2) + document_start
first-paint pass complete. The reader is detect → hide-raw → mount@DOMContentLoaded → parse →
sanitize → themed reading → Raw toggle → never-blank fallback, on Chrome + Firefox,
`permissions:[]`, ~266KB packed. 137 unit + 62 in-browser tests green.
Next action = the **remote-resource policy** task (block remote images by default + one-click
opt-in + network indicator; the last M1 feature before trust docs 6.x).

## Done
- 2026-07-14 — Fixed the Firefox mount-timing regression (caught by the human manual gate, NOT
  jsdom — it's an engine-timing class of bug the unit env can't see). Root cause: `runReader`
  mounted once at DOMContentLoaded and its `finally` revealed the raw text on EVERY outcome,
  including a "source wasn't ready yet" no-op. On Firefox the `file://` `<pre>` is still empty at
  DCL (readable only by `load`), so that no-op `reveal()` dropped the hide `<style>`, cleared the
  safety timer, and removed the `load` listener — the mount path was torn down and the user was
  stuck on raw text forever, silently. This also corrected the record: the prior session's
  "Firefox platform gap" was a misdiagnosis of this self-inflicted regression (remote and local
  `.md` both failed by the same mechanism; the localhost-workaround research was unnecessary).
  Fix shape: `mountReader` returns a commit boolean (`true` = committed, incl. degraded raw-fallback
  + idempotent re-entry; `false` = the no-source no-op); `runReader.tryMount(final)` attempts at DCL
  (not final → keep hide + backstops, wait) and again at `load` (final → reveal + one warn
  breadcrumb); the safety timer becomes a pure never-blank FLOOR that reveals raw without disarming
  the attempts (a late mount still wins). Test gap closed: a red-first regression test (empty body +
  `readyState=loading` → DCL no-op → seed `<pre>` + `load` → reader mounts, raw hidden) plus both
  timer directions. 139 unit + 62 browser green, lint clean, ~flat perf (a-median 1217 ms; Chromium
  still mounts at DCL). See decisions.md (the Gecko gotcha). No pointer move — next action unchanged.
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
- 2026-07-14 — document_start + hidden-raw first-paint pass (perf group follow-up to 5.2). Two of
  the 5.2 levers landed: the content script now runs at `runAt:'document_start'` and injects a
  `<style>` (under `<html>`, since `<head>`/`<body>` may not exist yet) that sets the raw `<pre>` to
  `display:none` BEFORE the browser can paint it, then mounts at DOMContentLoaded. Never-blank is
  preserved by detect-before-hide + a safety unhide (3s timer + window `load`) + a finally that drops
  the hide style on every mount outcome (`src/render/runReader.ts`). Re-measured with `pnpm perf`
  (same protocol: 7 runs, cold discarded, median of warm 6), same machine as 5.2 (i7-13700, Windows,
  headless chromium via Playwright), on the same 1.12 MB huge-doc fixture, TWO runs:
  - **(a) navigationStart → reader painted: run-1 median 1261.5 ms, run-2 median 1340.7 ms.**
    **(b) responseEnd → reader painted: run-1 median 1259.8 ms, run-2 median 1338.6 ms.**
  - **Before → after: (a) ~1245 ms → ~1261–1341 ms. FLAT — no improvement, within run-to-run noise.**
  - **GATE: still FAIL vs <150 ms (~8–9×). Acceptance box stays UNTICKED** (per plan: if it still
    fails, record honestly and stop — no further optimization in this group).
  - Why flat, verified (not assumed): a Playwright probe sampled the raw `<pre>` at 27 ms — well
    before mount (`readerMountedYet:false`) — and found the hide `<style>` present and the `<pre>`
    computing `display:none`. So the hide genuinely works in Chromium (the `<style>` under `<html>`
    IS honored) and the raw-text flash is gone. But per-run marks show DCL/mount now fire at
    ~470–590 ms (was after `load` ~1050 ms at `document_idle`), while first-paint still lands at
    ~1260–1340 ms — the ~750 ms gap is the browser laying out the reader's OWN ~1400-section rendered
    DOM. That cost, not the raw-`<pre>` layout we eliminated, now dominates first-paint on this
    fixture. Value delivered: the raw-text flash is eliminated for every doc size (qualitative win,
    manual-checked); the <150 ms number is unmoved.
  - Only remaining lever for the number is chunked/virtualized/deferred reader render (don't build
    the whole 1400-section DOM synchronously) — explicitly out of scope for this group.

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
