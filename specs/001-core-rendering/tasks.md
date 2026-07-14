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
- [ ] 4.2 Raw/Reading toggle + error-banner fallback path (test: throwing stage → raw view)
- [ ] Remote-resource policy: block remote images/resources by default; one-click opt-in that loads
  them + lights the network indicator; lazy-load permitted media (loading="lazy" / IntersectionObserver).
  Depends on: reader shell + a minimal status-bar network indicator. Target: end of M1 (completes the
  core reader's security story); movable to M2 if scope tightens.
- [ ] 5.1 10 golden fixtures + snapshot runner; wire into CI
- [ ] 5.2 Perf measurement on 1MB fixture recorded in progress.md
- [ ] 6.1 docs/trust/PERMISSIONS.md v1 (every manifest line justified)
- [ ] 6.2 Update progress.md; run /retro if warranted
