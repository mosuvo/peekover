# Plan 001
1. **Scaffold** — `pnpm dlx wxt@latest init`, TS strict, eslint, vitest; wire scripts; commit CI.
2. **Detection** — content script matches + a `isRenderableContext()` util with unit tests
   (URL patterns + content-type sniff). Firefox file:// nuance documented as found.
3. **Pipeline core** — `src/render/pipeline.ts` composing pure stages; markdown-it configured
   options-object-first (future engine toggles); DOMPurify strict profile in `sanitize.ts`
   with the allowlist as data, not code.
4. **Shell** — shadow-DOM mount, tokens.css injection, font loading (Literata subset woff2),
   Raw/Reading toggle, error banner.
5. **Golden tests + perf check** — fixtures in `tests/golden/`, snapshot runner, perf note.
6. **Trust docs** — PERMISSIONS.md first real version; update progress.md; retro if >2 surprises.

Order matters: 3 before 4 so the shell mounts a proven pipeline. Each step = one session-ish.
Risk watch: WXT+Firefox file:// (step 2), font FOUT in shadow DOM (step 4).
