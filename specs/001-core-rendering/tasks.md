# Tasks 001 — check off, add discovered tasks BELOW the line they came from
- [x] 1.1 Init WXT+TS project; pnpm scripts (dev/dev:firefox/build/zip/test/lint) all run clean
- [x] 1.2 CI: .github/workflows/ci.yml → lint+test+build on PR (keep ai-hygiene.yml)
- [x] 2.1 `isRenderableContext()` + tests (file:// ext match, content-type, raw-host allowlist)
- [x] 2.2 Content script mounts a hello-shell in matched contexts, Chrome + Firefox
- [x] 2.3 Firefox build → MV3 (WXT default is MV2) + gecko.id + data_collection none; Chrome manifest unaffected
- [x] 3.1 pipeline.ts: decode+parse stages w/ markdown-it GFM set; unit tests
- [x] 3.2 sanitize.ts: DOMPurify strict profile (data-driven allowlist); malicious-fixture tests
  - [ ] M2: restore GFM table alignment safely (map to class, never inline style)
- [x] 3.3 mount stage: shadow root, patch-on-rerender, <150ms perf harness
  - [ ] C12: patch-on-rerender is a DEFERRED optimization — M1 ships full innerHTML
    replacement (correct + idempotent, no diffing dep). Revisit if re-render cost bites.
- [x] 4.1 tokens.css import + light/dark auto; Literata subset bundled; 76ch reader column
  - tokens + reader styles inject into the SHADOW ROOT (<style>, scoped to :host); light
    default + dark via OS prefers-color-scheme (data-theme on host). Sepia + manual switch
    DEFINED-but-dormant (settings milestone). Literata Latin subset (4 faces, ~86KB) bundled
    inline as base64 data: URIs, registered via FontFace API — zero network, no WAR. See
    decisions.md (2026-07-14 font strategy + theme deferral).
- [x] 4.2 Raw/Reading toggle + error-banner fallback path (test: throwing stage → raw view)
- [x] Remote-resource policy: block remote images/resources by default; one-click opt-in that loads
  them + lights the network indicator; lazy-load permitted media (loading="lazy" / IntersectionObserver).
  Depends on: reader shell + a minimal status-bar network indicator. Target: end of M1 (completes the
  core reader's security story); movable to M2 if scope tightens.
  - Landed: `applyMediaPolicy` seam filled (`src/render/mediaPolicy.ts` classify/neutralize/restore
    + `src/render/remoteMediaUi.ts` opt-in pill + network indicator). Neutralization on the DETACHED
    reader root before commit (no fetch ever fires — no-leak test, red-first proven). Classify by
    RESOLVED scheme vs `document.baseURI`: http/https (incl. protocol-relative) blocked -> inert themed
    placeholder (src -> data-peekover-src); file: on a file page allowed + `loading="lazy"`. Opt-in is
    per page-view (permissions:[] = no storage; reload re-blocks) and lights a persistent
    `data-network="active"` indicator. images.md golden regenerated through the full reader path;
    huge-doc digest unchanged. 159 unit + 62 browser green. See decisions.md 2026-07-14 (mechanics).
    IntersectionObserver deferral not needed — native `loading="lazy"` covers M1.
- [x] 5.1 10 golden fixtures + snapshot runner; wire into CI
  - Part A: 9 fixture snapshots (tests/golden/) + a pinned-digest ~1MB huge-doc case;
    CI-gated by Vitest's refuse-to-write-under-CI. Part B: in-browser mXSS re-check
    (Vitest Browser Mode, real Chromium + Firefox via @vitest/browser-playwright) over
    MALICIOUS_CASES + observable EXECUTION_CASES; `pnpm test:browser`, wired into ci.yml.
- [x] 5.2 Perf measurement on 1MB fixture recorded in progress.md
  - `pnpm perf` (scripts/perf-first-paint.ts): real headless-Chromium first-paint of the built
    extension over the 1.12MB huge-doc, 7 runs (cold discarded). Local gate only, NOT in CI.
    Result: nav→paint median ~1187–1310ms — misses a flat <150ms on the 1MB doc (~8×). Breakdown in
    progress.md: browser's own 1MB parse/layout dominates, not the pipeline. Measurement task — no
    src/ changes to chase the target.
  - [x] 5.2b document_start + hidden-raw first-paint pass (perf-group follow-up): runAt:'document_start'
    + inject a `<style>` that display:none's the raw `<pre>` before paint, mount at DOMContentLoaded;
    never-blank kept by detect-before-hide + safety unhide (3s timer + window load) + finally-unhide
    (`src/render/runReader.ts`). Eliminates the raw-text FLASH (verified: raw `<pre>` is display:none at
    27ms, pre-mount). First-paint is now dominated by laying out the reader's own ~1400-section DOM,
    not the raw-`<pre>` layout we removed. Only remaining lever = chunked/virtualized render (M2).
  - [x] 5.2c Gate RESCOPED from a size-sweep (measurement + docs only; zero src/+entrypoints/ changes).
    `pnpm perf` now takes `--size` (default = the 1400-section 1MB fixture, byte-identical to the golden
    digest — golden suite green, digest unchanged). Swept 10/50/200KB + re-confirmed 1MB (same protocol,
    two invocations each): nav→paint medians 10KB ~78–82ms, 50KB ~118–122ms (both PASS <150ms), 200KB
    ~345ms, 1MB ~1187–1310ms. Spec-001 acceptance rewritten as a two-part gate, BOTH parts ticked:
    (i) typical ≤50KB <150ms; (ii) 1MB no-flash (both engines) + painted <1.7s honest bound. See
    progress.md table + decisions.md (2026-07-14 gate rescope). Chunked/virtualized render carried to M2.
- [ ] 6.1 docs/trust/PERMISSIONS.md v1 (every manifest line justified)
- [ ] 6.2 Update progress.md; run /retro if warranted
