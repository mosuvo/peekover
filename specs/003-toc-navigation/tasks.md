# Tasks 003 — TOC / navigation — check off, add discovered tasks BELOW the line they came from
*Gear 3 tasks stage. Approved: `spec.md` (60cd12f · b2ab23f · d4040b0) + `plan.md` (b6b578d). CC commits*
*per task; human reviews + pushes. Each capability task carries its OWN real-engine test (not a trailing*
*"add tests" task). Real-engine tests are `tests/browser/*`, run on BOTH Chromium + Firefox, **red-first +*
*non-vacuous** (M1/M2 retro rule). Module split + placement approved at the plan gate (plan §3, §4, §8).*

**Plan-gate decisions locked by the human — encoded here, not re-opened:**
- **Keyboard toggle key = BACKTICK `` ` `` (NOT bare `t`).** Chosen to avoid colliding with `role=tree`
  type-ahead in the app-page folder browser. Guarded EXACTLY like `\` (bare key, no Ctrl/Cmd/Alt, ignored
  in input/textarea/select/contenteditable). Any task/text still saying `t` is a bug. *(plan §3-#5 named `t`;
  the gate overrode it to backtick — treat the gate as authoritative.)*
- **Right-side rail, both surfaces.** Initial state: present only at **≥2 headings** (0 → omit entirely;
  1 → omit rail); default **open on a wide `:host` scrollport, collapsed on a narrow one** (measured on the
  reader's own `:host`, not `window`).
- **a11y = `nav` landmark + nested list**, `aria-current="location"` — **NOT** `role=tree`.
- **Module split = pure `tocModel` / DOM `tocView`** + 4 tests + `scripts/perf-toc.ts`; `mount.ts` /
  `readerCss.ts` touched **additively**; `sanitize.ts` / `parse.ts` / manifest / PERMISSIONS.md **untouched**.
- **The pre-existing "`\` is inert on the app page" gap is OUT of 003 scope** (§6-#1) but gets a **durable
  one-line record in `docs/ai/decisions.md`** at the close task (6.1) — not only in plan.md.
- **Progress.md Now-pointer advances at EACH task/group boundary during implementation** (M1 retro rule,
  retro.md 2026-07-14: the pointer once lagged four tasks — it is the one line the next session trusts, so
  it MUST be moved per task/group, not batched to the end). 6.1 is the FINAL reconciliation (pointer →
  "003 complete / next milestone" + decisions.md entries), **not** the pointer's first move.

---

## 1 — Pure heading model (crash-free foundation, no DOM/engine)

- [x] **1.1 `tocModel.ts` (PURE) + `tocModel.test.ts`.** `buildTocModel(root: ParentNode): TocEntry[]` —
      `root.querySelectorAll('h1,h2,h3,h4,h5,h6')` in document order, hold the element **ref** per entry,
      nest by the **nearest-strictly-shallower-ancestor stack** (plan §3-#9: h1→h3 nests directly under h1,
      **no synthetic h2**; a doc starting at h3 normalizes its baseline to the shallowest level present).
      Label = `heading.textContent.trim()`; empty (truly empty / emoji-only stripped to nothing /
      image-only whose remote `<img>` became a media-policy placeholder) → designed fallback
      (`"Untitled section"` or `Hn`+ordinal), **never blank**. Duplicate texts kept **verbatim** (no
      slug/`id`, no dedup suffix — that's the deferred permalink feature). No DOM writes, no engine.
      Files: `src/render/tocModel.ts` · `src/render/tocModel.test.ts`
      Verify (**jsdom/unit**): `pnpm test tocModel` green — asserts (a) doc-order + nesting policy incl.
      non-monotonic (h1→h3) and h3-start baseline; (b) label fallback for empty/emoji-only/image-only;
      (c) duplicates kept verbatim; (d) **consistency-with-root** — every `entry.headingRef` is one of
      `root.querySelectorAll('h1..h6')` and NO entry exists for a heading absent from `root` (§3-c4).
      [§6 F1 (order/nest half) · F6 · F7 (label = textContent half)]

## 2 — Rail chrome + compose at the ONE seam + styles + trust pin (jsdom-shaped)

- [x] **2.1 `tocView.ts` rail build + `tocView.test.ts` (shape).** `buildTocView(host, model, {contained})`
      → a right-side `<nav aria-label="Table of contents">` wrapping a nested `<ol>`; each entry is a
      `<button>` that will scroll to `entry.headingRef` (wired in 3.1) — the button **carries that exact
      `headingRef` node** (via closure/`WeakMap` set HERE in 2.1), and 3.1's scroll handler acts on **that
      same carried ref**, so the jsdom identity test below guards the real-engine scroll target itself, not
      an independently re-derived node (M1/M2 retro: a green test must exercise the real mechanism, not one
      beside it); a level with children carries a
      disclosure `<button aria-expanded>`; collapse hides/shows that subtree. **Threshold omit:** returns
      `null` at <2 headings (0 and 1 → no rail). Labels set via **`textContent` only** (never innerHTML).
      Initial open/collapsed decided from `:host` scrollport width (open wide / collapsed narrow). Returns
      the rail `Node` or `null`.
      Files: `src/render/tocView.ts` · `src/render/tocView.test.ts`
      Verify (**jsdom/unit**): `pnpm test tocView` green — asserts rail **present at ≥2 / omitted at 0 and 1**;
      `nav`+nested-`<ol>` + `aria-current` shape; collapse flips `aria-expanded` AND hides the subtree;
      **entry→heading-ref identity** (button maps to the correct `headingRef` node); **no innerHTML** used
      to build any label (spy/guard); **`location.href` + history length unchanged** after activating an
      entry in jsdom (structural F2 — real scroll is R1/3.1).
      [§6 F1 (both-surface shape) · F2 (structural) · F4 · F5]

- [x] **2.2 Compose at the seam (`mount.ts`) + styles (`readerCss.ts`) + golden/manifest pins.** In
      `mount.ts:118–125`, after `root` is built (`root.append(tpl.content)` — headings now live in `root`),
      call `buildTocModel(root)` then push `buildTocView(host, model, {contained})` into the SAME `children[]`
      array (omit when it returns `null`), committed by the existing single `shadow.replaceChildren(...)`.
      **Keep `mountRawFallback`'s second `replaceChildren` TOC-FREE** (raw-fallback path builds no model/rail —
      a failed render shows banner + raw `<pre>` only). In `readerCss.ts` add rail/list/twist/active/current/
      resizer rules to `READER_CSS` (tokens only — `--muted`/`--faint`/`--line`/`--hl`), add the rail selector
      to `CONTAINED_CSS`'s `position:fixed→absolute` list, and add `scroll-margin-top` on `h1..h6`. **The
      `.peekover-reader` column rules stay unchanged.**
      Files: `src/render/mount.ts` · `src/theme/readerCss.ts` (`tests/manifest.test.ts`, `tests/golden/*` —
      **no edit**, must stay green)
      Verify (**jsdom/golden + build**): `pnpm test` green incl. `manifest` (T1 — built manifest still
      `permissions:[]`, no `host_permissions`/`web_accessible_resources`/`webRequest`/`tabs`/`scripting`
      added) AND golden. **CONFIRM golden scope first:** `golden.test.ts` snapshots the pure
      `sanitize(parse(source))` string / huge-doc SHA-256 — i.e. the `.peekover-reader` COLUMN, which the
      sibling rail does not touch → expect `git diff tests/golden/output/` **EMPTY** and huge-doc
      `sha256=8bc5094c…e61bbd` **unchanged**. **Any golden diff means the column changed — STOP and flag,
      do NOT re-baseline.** (T2's "re-baseline only where TOC presence is the sole reviewed diff" is thus
      expected to be a **no-op**.)
      [§6 F1 · F5 · F7 (sanitize path unchanged) · T1 · T2 (golden-green half)]

- [x] **2.3 Keyboard toggle (BACKTICK) + host registry + de-register on teardown.** One document-level
      `keydown` listener (mirroring `installToggleShortcut`) toggles the rail on bare `` ` ``: no Ctrl/Cmd/Alt,
      ignored when focus is in input/textarea/select/contenteditable, `preventDefault` only after deciding to
      handle, and only when a mounted reader **with a TOC rail** exists — so it never collides with `\`
      (Raw/Reading) and passes through on any page without our rail. **Host resolution via a module-level
      `Set<HTMLElement>`** (registered by `mount()` when a rail is composed): active host = the registered
      host containing `document.activeElement`, else the sole/last-registered host. **De-register (the plan's
      task-level note):** a torn-down host MUST be removed from the Set — `mount()`'s raw-fallback path
      un-registers, and the resolver prunes any `!host.isConnected` entry — so the "last host" fallback can
      **never resolve to a dead node** (e.g. after `mountReader` removes its `<peekover-root>` on failure).
      Files: `src/render/tocView.ts` (registry + shortcut) · `src/render/mount.ts` (register/unregister
      hooks) · `src/render/tocView.test.ts` (guards + registry)
      Verify (**jsdom/unit**): `pnpm test tocView` green — backtick toggles; guarded key ignored in an
      `<input>`/contenteditable and under Ctrl/Cmd/Alt; **`\` still routes to Raw/Reading, not the TOC** (no
      collision); resolver returns the active host by `activeElement`; and after a registered host is removed
      from the DOM, the resolver **prunes it and does not return the dead node**. (`\`-app-page gap explicitly
      NOT retrofitted — recorded at 6.1.)
      [§6 F3]

## 3 — Scroll · scroll-spy · reduced-motion · resize (real engine; each lands WITH its capability)

- [x] **3.1 Click-to-scroll, BOTH surfaces (real).** Wire entry click/Enter → `entry.headingRef
      .scrollIntoView({block:'start'})` (NO `behavior` arg → CSS `:host{scroll-behavior}` governs; plan §3-#2).
      The handler MUST scroll to the **exact `headingRef` node the button carries from 2.1** (the closure/
      `WeakMap` ref set at build time) — not a node re-derived here — so 2.1's jsdom entry→heading-ref
      identity test genuinely guards this real scroll target (M1/M2 retro: exercise the real mechanism, not an
      adjacent one).
      Add `scroll-margin-top` if not already in 2.2. Drive both hosts: the `<peekover-root>` full-page host AND
      the `{contained}` app-page host (via `mountAppShell` + an in-memory folder source, as
      `readerPaneContained.browser.test.ts` does).
      Files: `src/render/tocView.ts` · `tests/browser/tocScroll.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): `pnpm test:browser tocScroll` green — activating an entry moves the
      `:host` scroll box so the target heading enters view, on both surfaces. **Red-first + non-vacuous:** with
      the entry wired to the WRONG heading the assertion FAILS on both engines; correct → passes. If an engine
      does not honor `:host scroll-behavior` for `scrollIntoView`, take the documented fallback
      (`behavior: prefersReducedMotion()?'auto':'smooth'`) — the test picks the path, not a guess (plan §6-#3).
      [§6 R1]

- [x] **3.2 Scroll-spy tracking (real).** One `IntersectionObserver({root: host, rootMargin:'0px 0px -70% 0px',
      threshold:0})` over the heading refs; the intersecting entry gets `aria-current="location"` + `.is-active`.
      Tune `-70%` against a real doc here; handle the trailing-short-section edge (promote the final entry at
      scroll-bottom) so the highlight can reach the last section (plan §3-#3). Root is `host` on **both** surfaces.
      Files: `src/render/tocView.ts` · `tests/browser/tocScroll.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): `pnpm test:browser tocScroll` green — scroll to section-3's offset →
      highlight = 3; scroll to top → 1; scroll to bottom → last. **Non-vacuous:** the test FAILS if the highlight
      stays **pinned to entry 1**; asserted on both surfaces (container is `:host` in both — proven, not assumed).
      [§6 R2]

- [x] **3.3 Reduced-motion (real).** Confirm TOC navigation scrolls **instantly** under
      `prefers-reduced-motion: reduce` and **smooth** without it (via the CSS `:host` reduced-motion block, or
      the §3-#2 JS fallback if 3.1 selected it).
      Files: `src/render/tocView.ts` (only if the fallback path is active) · `tests/browser/tocScroll.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): `pnpm test:browser tocScroll` green — Playwright `emulateMedia({
      reducedMotion:'reduce'})` → navigation lands within one frame (no animated interpolation); default
      preference → smooth (multi-frame). Red-first: FAILS if motion is not gated on the media query.
      [§6 R3]

- [x] **3.4 Resize drag (real).** A pointer-draggable resizer sets `--toc-w` on `:host`, clamped to sensible
      min/max; width holds **per view** (not persisted — 003 scope).
      Files: `src/render/tocView.ts` · `src/theme/readerCss.ts` (resizer rule if not in 2.2) ·
      `tests/browser/tocScroll.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): `pnpm test:browser tocScroll` green — a pointer drag changes the rail
      width within bounds and it persists for the view; drag past a bound clamps. Red-first: FAILS if the drag
      does not move `--toc-w`.
      [§6 R5]

## 4 — Zero-network guard (real; bytes-on-wire discipline)

- [x] **4.1 `tocNetwork.browser.test.ts` (real).** Extend the `remoteMedia.browser.test.ts` /
      `folderMode.network.browser.test.ts` Resource-Timing discipline: building + rendering + toggling +
      scroll-spying the TOC issues **zero** network requests.
      Files: `tests/browser/tocNetwork.browser.test.ts`
      Verify (**tests/browser** — Cr+Fx): `pnpm test:browser tocNetwork` green — zero request entries across
      build/toggle/spy on both engines. **Non-vacuous:** a control same-origin `fetch` DOES register (proves
      the assertion can fail); **red-first** — a deliberately-injected stray request FAILS it.
      [§6 R4]

## 5 — Perf measure · first-paint re-run · byte re-measure (measured — no un-measured thresholds)

- [x] **5.1 `scripts/perf-toc.ts` — MEASUREMENT, not a threshold.** Same protocol as
      `perf-first-paint.ts`/`perf-folder-tree.ts` (7 iters, cold discarded, median of warm 6). Measures
      (a) TOC model-build + rail-render time vs heading count (swept), (b) scroll-spy overhead during active
      scroll on a large many-heading doc. Record numbers honestly in progress.md; **assert NO threshold** — a
      gate is set from the number later. Note whether the number argues for the carried chunked/virtualized
      **TOC-tree** render lever (the one-DOM-node-per-heading suspect, 6.2-analogous) — a **post-measurement**
      decision, not asserted now.
      Files: `scripts/perf-toc.ts` (+ `package.json` `perf:toc` script)
      Verify (**measured**): `pnpm perf:toc` runs, prints per-heading-count medians + scroll-spy overhead,
      recorded in progress.md. No acceptance number asserted (M1 retro standing rule).
      [§6 P1]

- [x] **5.2 First-paint gate RE-RUN (P2) — also the ~1400-entry pathological-TOC first-paint number.** Re-run
      the existing `pnpm perf` two-part M1 gate (decisions.md 2026-07-14: **(a)** ≤50 KB nav→paint <150 ms;
      **(b)** 1 MB doc — no raw-flash both engines + reader painted <1.7 s) **after** the reader gains the TOC;
      confirm still passing OR honestly re-measure and re-scope (bound taken from the 2026-07-14 rescope, not
      re-guessed). **The 1 MB fixture is `buildHugeDoc` (~1400 sections/headings), so its first-paint number IS
      simultaneously the pathological ~1400-entry-TOC first-paint measurement** — the rail now builds and lays
      out on that same doc; read (b) as covering both. The T2 byte re-measure (5.3) is a SIZE check and does
      **not** substitute for this TIME re-run.
      Files: (measurement only — no `src/` change to chase a number)
      Verify (**measured**): `pnpm perf` (default 1 MB = `buildHugeDoc`) + `pnpm perf -- --size 50kb` re-run,
      medians recorded in progress.md; (a) PASS or honest re-scope; (b) no raw-flash (manual, both engines at
      6.2) + painted <1.7 s or honest re-scope; the ~1400-entry-TOC first-paint number stated explicitly.
      [§6 P2 · P1 (large-doc render lever input)]

- [x] **5.3 Re-measure content-script + `pnpm zip` byte sizes (T2 size half).** The reader gained the TOC, so
      the M2 270,879 B content-script invariant is deliberately spent (spec §Surface-scope). Re-measure and
      record the new content-script byte size and both-engine `pnpm zip` sizes; confirm under budget
      (≤5 MB packed / <2 MB zip).
      Files: (measurement + progress.md/decisions.md record at 6.1)
      Verify (**measured + gate**): `pnpm zip` both engines < 2 MB; new content-script byte size recorded;
      **all M1 golden + regression suites green** (`pnpm test`), any golden re-baseline is the reviewed TOC
      diff only (expected: none — see 2.2). Numbers recorded, not asserted as a first-paint proxy.
      [§6 T2]

## 6 — Close + named human gate

- [x] **6.1 Final memory reconciliation + record decisions.** **ONLY-at-tasks-complete scope applies to the
      items in THIS task — the `decisions.md` entries below and the FINAL progress.md Now-pointer
      reconciliation (pointer → "003 complete / next milestone").** It does NOT govern the pointer's earlier
      movements: per the standing note above, the Now-pointer has already been advanced at each task/group
      boundary during implementation (M1 retro rule) — this task is that pointer's last move, not its first.
      Append `decisions.md` entries for what 003 settles: the ONE-seam TOC compose, element-ref
      navigation (no `id`, sanitize `id`-closure stays shut), host-rooted IO scroll-spy for both surfaces,
      right-rail + ≥2-heading heuristic, backtick toggle + host registry, and the re-measured sizes / perf /
      first-paint-re-run numbers. **Durable one-liner (the plan's task-level note): record the pre-existing
      "`\` (Raw/Reading) is inert on the app page" gap in `decisions.md`** (not only plan.md) as a carried
      hardening item — 003's TOC toggle works on both surfaces; `\` is not retrofitted onto the registry.
      Files: `docs/ai/progress.md` · `docs/ai/decisions.md`
      Verify: `pnpm lint` + `pnpm test` + `pnpm test:browser` green; `pnpm zip` under budget both engines;
      decisions.md contains the `\`-app-page-gap line.
      [§6 T2 (record half)]

- [x] **6.2 Milestone-close human gate (NAMED, required — not removable by adding jsdom tests).** Chrome +
      Firefox, current build, **Network tab open**, on **BOTH** surfaces (a `file://`/raw-git doc via the
      content script AND a file opened in the app-page reader pane): multi-heading doc → **TOC appears** →
      click an entry **scrolls to the section** → scroll and watch the **active entry track** (scroll-spy) →
      **collapse/expand** levels → **resize** the sidebar → **toggle via backtick** → **smooth** scroll
      normally and **instant** under an OS reduced-motion setting → open a **no-heading** doc and a
      **pathological-heading** doc and confirm a designed state, **never blank**. Confirm **zero unexpected
      network**, no console errors, the document stays the hero. Also confirms the (b) **no-raw-flash on the
      1 MB doc** ground truth from 5.2. This gate has caught 5/5 milestone-shipping defects in exactly the
      classes jsdom can't see (layout, engine timing, bytes-on-wire, wiring/visibility) — the TOC is
      visual/scroll/engine-timing end to end.
      Verify (**human gate**): human walks the full checklist above, both engines, and records the pass in
      progress.md (the one 003 acceptance an agent cannot self-certify).
      [§6 H1]

- [x] **6.3 Retro.** Run `/retro`: append an R-entry to `docs/ai/retro.md` (corrections · first-try
      verification pass · sessions). Note whether the chunked/virtualized TOC-tree render lever is now decided
      (from 5.1) or carried; confirm the `\`-app-page gap is durably recorded (6.1).
      Verify: `docs/ai/retro.md` has the 003 entry with the three metrics.

---
*Discovered tasks go BELOW the line they came from (M1/M2 convention). Carried levers that may surface here:
chunked/virtualized **TOC-tree** render (decide from 5.1 measurement) · chunked/virtualized **reader** render
(large-doc first-paint lever, decide from 5.2) · GFM table-alignment restore (unrelated to 003 — leave to its
own work). Any need to edit `sanitize.ts` / `parse.ts` / the manifest / PERMISSIONS.md means scope drifted out
of 003 — STOP and flag (plan §4).*
