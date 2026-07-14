# Decisions — Peekover
*Append-only. Newest first. Format: date · decision · why · revisit-when.*

- **2026-07-14 · The reader HIDES the page's original nodes (`display:none`), not detach.**
  `mountReader` (src/render/mountReader.ts) sets inline `display:none` on the body's original
  children rather than removing them, so task 4.2's Raw toggle can reveal them again without a
  reload. This MUTATES the host page's DOM (inline display on body children). To keep the
  never-blank invariant (AGENTS.md #5) on the real injection path, mountReader renders into its
  shadow host and confirms non-empty content FIRST, and only THEN hides the originals; on any
  throw — or an empty render — it removes the host and leaves the browser's own rendering exactly
  as it was, so the user is never left with the page hidden AND nothing valid shown. (mount()'s
  own throw→raw fallback can't see this hide step, hence the guard lives in mountReader; the core
  was extracted from the entrypoint so it's unit-testable in jsdom.) Revisit-when: task 4.2 Raw
  toggle implementation, which reads/reverses this `display:none`.
- **2026-07-14 · Remote resources are BLOCKED by default.** Peekover does not load remote
  images or any remote resource a document's HTML would fetch until the user opts in with one
  click, which loads them AND lights the network indicator; permitted/local media is lazy-loaded
  (native `loading="lazy"`, offscreen deferral). Why: makes the "zero network by default" promise
  literally visible and demoable — core positioning, not a preference (AGENTS.md #1). The sanitize
  allow-list is unchanged (it still permits http/https `src`); blocking is a RENDER-LAYER policy
  (mount/shell decides what actually loads), not a sanitize strip. Revisit-when: never for the
  default; the load mechanism may evolve.
- **2026-07-14 · Dropped `id` and `align` from the sanitize allow-list.** The strict
  DOMPurify profile (`src/render/sanitize.ts`) no longer permits `id` or `align`. Why:
  `id` is a DOM-clobbering surface (attacker-controlled ids can shadow named
  `document`/form properties) with **no M1 producer** — markdown-it emits no heading ids;
  `align` is inert — markdown-it emits table alignment as inline `style` (which we strip),
  never as an `align` attribute, so allowing it did nothing. Revisit-when: M2 heading
  anchors, where we generate ids ourselves and re-allow `id` deliberately; and the M2 task
  to restore GFM table alignment by mapping to a class (never inline style).
- **2026-07-14 · Security tests run in jsdom; add an in-browser sanitize check at the
  golden/e2e milestone.** The sanitize suite uses jsdom, whose HTML parser differs from real
  browser engines — notably for mXSS, where namespace/reparsing quirks (SVG/MathML foreign
  content, template/noscript) can diverge, so a payload inert under jsdom is not proof it is
  inert in Chrome/Firefox. Scheduling note (not a code change now): during the golden-fixture
  / e2e milestone (tasks 5.x), run the malicious fixtures through DOMPurify in an actual
  Chrome and Firefox context and assert no script executes. Revisit-when: task 5.1/5.2 lands.

- **2026-07-14 · Target MV3 on Firefox (over WXT's MV2 default).** Set `manifestVersion: 3`
  in wxt.config.ts so the Firefox build is MV3, not WXT's default MV2; chose gecko.id
  `peekover@peekover.dev` (stable, on-brand, we own the domain — required before an MV3 AMO
  submission). Why: consistency with our MV3 / no-persistent-background security claim (spec §6),
  and MV2 is legacy for new extensions. Firefox MV3 uses a non-persistent **event page**
  (`background.scripts`), not a Chrome service worker — WXT emits the right shape from our
  `defineBackground` automatically, so no background code changed. gecko keys are gated on
  `browser === 'firefox'` so they never leak into the Chrome manifest. Revisit-when: AMO changes
  ID rules, or we adopt a real background listener.
- **2026-07-14 · Lowercase-only file:// match patterns.** `isRenderableContext()` is
  case-insensitive, but the manifest `file:///*.<ext>` patterns are lowercase, so a local file with
  an UPPERCASE extension (e.g. `README.MD`) won't trigger browser injection. Why: doubling every
  file:// pattern to cover uppercase is a poor tradeoff for a rare case; raw hosts are host-matched
  and unaffected, and most local files use lowercase extensions. Revisit-when: we next touch match
  patterns (Firefox/manifest task 2.3 or folder-mode), or if a user actually reports it.
- **2026-07-11 · Name: Peekover** (DocPeek withdrawn — live App Store collision). Eight-surface
  verification passed; domain peekover.dev owned+verified. Full record: names.md in design archive.
- **2026-07-11 · Umbrella ship model:** repo under github.com/mosuvo/peekover (personal), org
  `peekover` dormant insurance, one publisher account for all future free tools, hello@peekover.dev
  public contact, no product X handle. Revisit: if a tool needs contributors/governance.
- **2026-07-10 · Brand: monochrome + one highlighter.** No chromatic accent (indigo/orange/red all
  rejected — clashed with yellow). Interactive = ink + highlighter underline. Logo internals fixed-ink.
- **2026-07-09 · Stack: WXT + markdown-it + DOMPurify + Shiki + KaTeX + Mermaid + CM6.** One
  battle-tested parser over hand-rolled; WXT over Plasmo (maintenance, MV3+Firefox story).
  Revisit: only if 5MB budget breaks.
- **2026-07-09 · Zero-network default is architecture, not policy** — no code path may fetch
  without explicit user trigger + indicator. Revisit: never.
- **2026-07-08 · Strategy: markdown wedge → universal raw viewer (Phase 2).** Free forever,
  credibility play, $0 infra.
