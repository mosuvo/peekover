# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*

*Updated: 2026-10-05 (M12 task 4.1 DONE — the watch's deferral gate widens to edit mode: an external
change renders nothing while a document is being edited, and leaving edit flushes it.) M12
(`specs/012-editor-mode/`, F8 Editor Mode's focused core) is in implementation: gates 1–3 approved,
tasks 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3 and 4.1 landed; **task 4.2 (the dirty-exit asymmetry and the
hint) is next — and 4.1 found it cannot be built as its line is written (the exit-order finding).**
**3.2's informal eyeball is DEFERRED to 7.1 by human ruling (2026-10-05); automated proxies stand in
and filed eight findings (E-1…E-8, § Carried items). 3.3 filed three more (P-1…P-3) — P-1, the
preview's enhancers not running, wants a human ruling before 7.1.** **The editor is REACHABLE on
`main` and can lose edits — exit discards without a warning (6.1), and Save reports "not yet
available" (5.3): planned sequencing, not released. A watch re-render no longer destroys the buffer
(4.1).**
Current numbers: `.output` 5,814,275 B (Cr) / 5,814,391 B (Fx) against ≤ 7 MiB, content script
342,520 B both engines (moved at 4.1 by its own glue, +136 B), `dependencies` 10, `permissions: []`. M11 (math
rendering, Temml/MathML) closed 2026-09-11 — its summary is under § Closed milestones, its narrative in
`progress-archive.md`.)*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.
> **Order is deliberate: what to do (Now · Up next · Blockers) comes before what to know (Closed
> milestones · Baselines).**

## Now (start here)

**M11 CLOSED, 2026-09-11 (task 8.3-R — records reconcile).** Math rendering shipped: inline `$…$`, block
`$$…$$` and fence math via Temml/MathML (KaTeX was reopened and replaced after a busted byte gate),
copy-as-LaTeX/MathML, both engines. See § Closed milestones below for the one-paragraph summary and the
link to the full archived narrative.

**M12 gate-1 APPROVED, 2026-10-03 (`decisions.md`'s M12 GATE 1 entry) — `plan.md` is next, fresh
session.** Preceded by a human product ruling the same day (`decisions.md`) raising the package-size
ceiling ≤ 5 MiB → ≤ 7 MiB specifically to give CodeMirror 6 real working room, and by this session's own
editor-feasibility spike (CodeMirror 6 measured ~500–607 KB, lazy-loadable, app-page-only; CodeJar
rejected as too thin). M12 = F8 Editor Mode's focused core — edit → live preview → save-back — not the
full ~21-item surface `spec-coverage.md`'s F8 row (5%) names; the remaining items are explicitly deferred
to a later F8 pass (spec §6). Gate 1 ruled all four §9 decisions: **D-A** in-shell mode on the existing
`readerMode.ts` shape, approved as recommended. **D-B** the save-back write surface, approved as the
spec's own three-way routing — (i) the permission mechanism is a task-level verification against the
current File System Access API spec, escalating to a human gate only if it surprises; (ii) the
conflict/overwrite policy is a gate-3 product-feel decision from a measured walk; (iii) the
`PERMISSIONS.md` ledger update is a mandatory, tested acceptance criterion — **plus a human addition: the
new ledger sentence's exact wording comes back for a one-sentence sign-off when the save task drafts it.**
**D-C** live preview through the existing render pipeline, debounced, no new sanitizer profile — approved
as recommended. **D-D** the dependency gate reframed as a confirmation (not a bust-risk fork like M10's
docx or M11's KaTeX/MathJax) — approved; the human declined the spec's own offered distrust escape. Spec
body stays sealed/"draft" per M7–M11 precedent; the approval lives in `decisions.md`.

**M12 gate-2 APPROVED, 2026-10-04 (`decisions.md`'s M12 GATE 2 entry) — `tasks.md` is next, fresh
session, the final gate before implementation.** `specs/012-editor-mode/plan.md` (the HOW) approved; its
body and "draft" status line stay sealed, the approval lives in `decisions.md`. The four §8 rulings:
- **§8-1 / D-1** — a dedicated edit-entry control, not a third state on the bare `\` toggle key. Approved.
- **§8-2 / D-9** — the draft ledger wording is on track; no sign-off taken at this gate.
- **§8-3 / D-4** — nested-host live preview, `mount.ts` byte-untouched; partial-replace `mount()` declined.
  Approved, with the build-at-group-2 / measure-at-group-6 sequencing accepted as proposed.
- **§8-4 / D-8** — watch+edit is SUPPORTED, DEGRADED: `watchController.ts`'s existing deferral gate
  extended, external changes surface through D-7's save-time content-compare, edit exit does not
  auto-flush. Approved.

Gate-1's four §9 rulings are inherited unchanged; D-7's content-comparison lead stands.

**M12 `tasks.md` DRAFTED, 2026-10-04 — awaiting gate 3 (NOT approved, NOT sealed).**
`specs/012-editor-mode/tasks.md` decomposes the plan's seven groups into 22 test-first tasks with the
three hard sequencing constraints enforced. Group 3's tests run on an UNWATCHED document (the gate-2
residual, resolved in group 3's own text); the D-9 ledger sign-off is task 5.1, a human gate sequenced
BEFORE the first write commit. The draft carries six findings (F-1…F-6) from re-deriving the plan's
citations and six questions (Q1–Q6) for gate 3 — read those first. No code, no dependency installed.

**M12 D-4 RE-RULED, then gate-3 APPROVED, 2026-10-04 (`decisions.md`'s M12 D-4 RE-RULED and M12 GATE 3
entries) — implementation is authorized; task 1.1 is next, fresh session.** Doc-only session, no build.
- **D-4's mechanism corrected.** The chrome investigation found gate 2's premise false: `mount()` always
  composes chrome (`mount.ts:157-211`), and the watch / diff / identity registries are module-level
  singletons, so a nested preview `mount()` gets three LIVE hazards (a preview watch pill, a
  preview-acting diff, a preview TOC rail the backtick can resolve to). CSS-hiding cannot undo registry
  wiring. The human ruled **Option B** — an additive `chrome?: boolean` on `mount()`, default `true`, every
  existing caller byte-identical — over editorView composing its own primitives, which would fork the
  sanitize → inert-template → adopt path into a third copy. The nested shadow-root boundary is unchanged.
  `mount.ts` itself was NOT edited this session; that is task 2.2's.
- **`tasks.md` redlined to it**: F-3, task 2.2 (now: add the option, prove existing callers
  byte-identical, build the preview on it, the three hazards proven absent red-first), the Gate-2 locked
  line, group 2's acceptance, 3.3's scroll clause, 7.1's walk item, and the content-script / `mount.ts`
  standing invariants. The scroll-preservation finding (`resolveScrollContainer` falls back to a
  non-scrolling nested host) is carried into 2.2 as a design requirement.
- **Gate 3: Q1–Q6 all approved as proposed** — the fence is scanner fixtures + `editorImportFence.test.ts`;
  group 3 is three tasks; the conflict policy is ruled at 5.5 on 5.3's safe floor; the provisional
  debounce is cost-proportional at multiplier 1; no material-cost threshold; the content-script invariant
  is "zero `codemirror` bytes + decomposed glue", not "340,492 B unmoved". Spec / plan / tasks status
  lines stay "draft"; `decisions.md` is the approval of record.

**M12 task 1.1 DONE, 2026-10-04 — `codemirror` 6.0.2 + `@codemirror/lang-markdown` 6.5.2 installed,
measured, governed; D-D CONFIRMED; `basicSetup` chosen.** Baseline re-derived by a clean rebuild (not
cited) and it matches: `.output` 5,197,425 B (Cr) / 5,197,541 B (Fx), content script 340,492 B, manifest
654 / 770 B. Installing alone moves zero shipped bytes. Arms measured through a scratch app-page dynamic
import of a constructed `EditorView` (reverted); the `.output` delta is identical on both engines:

| Arm | `.output` delta | zip delta | Headroom left (Cr / Fx) |
|---|---|---|---|
| (a) `codemirror` + `basicSetup` | +382,623 B | +121,521 B | 1,759,984 / 1,759,868 B |
| (b) `codemirror` + `minimalSetup` | +281,094 B | +90,392 B | 1,861,513 / 1,861,397 B |
| (c) `@codemirror/lang-markdown` alone | +465,064 B | +159,323 B | 1,677,543 / 1,677,427 B |
| (d) **shipping: `basicSetup` + `markdown()`** | **+605,443 B** | +203,368 B | **1,537,164 / 1,537,048 B** |
| (e) `minimalSetup` + `markdown()` | +508,217 B | +173,681 B | 1,634,390 / 1,634,274 B |
| (z) empty probe (glue control) | +135 B | +380 B | — |

- **Decomposed, residual 0 per file:** every arm is the probe chunk plus +93 B of `import()` glue in the
  app chunk; no other file changes size. Net of the 135 B glue: shared core (state/view/language/
  autocomplete/lezer) 242,109 B · `basicSetup`-only 140,379 B · markdown-only 222,820 B = 605,308 B.
  `lang-markdown` is the larger half because `markdown()` statically pulls `lang-html` → `lang-css` +
  `lang-javascript` and their Lezer grammars. The spike's ~500–607 KB is CONFIRMED (508 KB / 605 KB).
- **Setup choice — `basicSetup`.** Rule (plan D-2): `basicSetup` unless its cost surprises. It costs
  +97,226 B over `minimalSetup` in the shipping combination (4.5% of headroom) and the shipping arm lands
  inside the spike range, so it does not. The shipping arm uses 28% of headroom.
- **App-page-only:** content-script md5 identical to baseline in every arm, both engines. Firing control —
  a scratch static `codemirror` import in `entrypoints/peekover.content.ts` moved it 340,492 → 622,009 B
  with a new md5; reverted, rebuilt, byte-identical to baseline again.
- **Governance:** 23 packages added, all MIT, none with install scripts; lockfile +212 / −0; `dompurify`
  still one copy; `dependencies` 8 → 10; SBOM regenerated (transient) at 191 components. Scanner self-test
  7 firing + 10 silent with the two new stay-silent fixtures (gate-3 Q1); the content-script EXCLUSION
  proof is still task 3.1's `editorImportFence.test.ts`. Lint 0 · unit 1145 · browser 1663 (15 skipped) ·
  golden unchanged · `permissions: []`.
- **★ OPEN — `pnpm audit --prod` exits 1, so 1.1's audit clause is NOT met.** Two advisories on
  PRE-EXISTING dependencies the install did not touch: `markdown-it` 14.3.0 (moderate,
  GHSA-253c-mchw-3w2r, fixed 14.3.1) and `dompurify` 3.4.13 (low, GHSA-p98j-92pf-mc4p, fixed 3.4.16).
  Human ruling 2026-10-04: commit 1.1 with this flagged; the bump is its own task, next.
- **★ OPEN — `basicSetup` vs spec §6's IS-NOT fence.** `basicSetup` bundles `searchKeymap` (a find/replace
  panel on Ctrl-F), `lintKeymap` and `autocompletion()`; spec §6 lists find/replace and lint as OUT, while
  plan D-2 says the winner ships its default bindings unmodified. Human ruling 2026-10-04: record
  `basicSetup`, carry this to be ruled before task 3.1 first uses the setup.

**M12 task-1.1 CLOSE, 2026-10-04 (`decisions.md`'s M12 TASK 1.1 entry) — both OPEN items above are
ruled.** Doc-only session, no build, no dependency change.
- **`basicSetup` ships AS-IS (Option A).** §6's deferred find/replace + lint are read as PEEKOVER-BUILT
  deferrals, not a mandate to strip CodeMirror's defaults; plan D-2's "default bindings unmodified" holds
  literally. CodeMirror's Ctrl-F search and autocompletion are present for free. Recorded precisely:
  `lintKeymap` is bindings only — no lint source, so no linting runs. The cost, stated: §6's IS-NOT text
  reads slightly loosened; its sealed text is untouched and the `decisions.md` entry is the
  reconciliation of record. Strip-the-keymaps (bends D-2) and `minimalSetup` (a thinner editor to save
  ~97 KB) were both rejected.
- **The audit failure has an owner: task 1.2** (`tasks.md`, a DISCOVERED task — 22 → 23), before 2.1.
  1.1's "audit EXIT=0" clause is recorded as unmet at `e001f9e` and closed by 1.2.
- **✅ RULED 2026-10-04 (`decisions.md`'s M12 TASK 1.1 EXTENDED entry) — ships AS-IS: `markdown()` is
  called with its defaults, `addKeymap` stays `true`; §6's "smart lists/continuation" is read as a
  Peekover-built deferral, the same reading as find/replace and lint. `markdown({ addKeymap: false })`
  rejected. The item below is kept as written.** *★ STILL OPEN, same class, surfaced by this session —
  NOT ruled:* `markdown()` defaults to
  `addKeymap: true`, binding Enter to list/markup continuation, and §6 lists "smart lists/continuation"
  as deferred. The ruling named find/replace and lint only; extending it is the human's call. Owed
  before 3.1.

**M12 task 1.2 DONE, 2026-10-04 — the audit bump: `markdown-it` 14.3.0 → 14.3.2, `dompurify` 3.4.13 →
3.4.16. `pnpm audit --prod` EXIT=0 ("No known vulnerabilities found"; the CI form `--audit-level low`
also 0). 1.1's audit clause is CLOSED.**
- **★ ONE HUMAN-RULED DEVIATION (`decisions.md`, M12 TASK 1.2): `markdown-it` landed at 14.3.2, not the
  task's named 14.3.1.** The registry check found 14.3.2 (2026-09-12), which also fixes GHSA-r7fv-28h4-cvq7
  (high; smartquotes quadratic; `< 14.3.2`) — published only in markdown-it's own repo advisories so far,
  so audit passes on 14.3.1 today and would have re-reddened on ingestion. `^14.3.1` resolves to 14.3.2 on
  a plain install anyway. Floors are `^14.3.2` / `^3.4.16`; no overrides.
- **Advisories, read at source.** GHSA-253c-mchw-3w2r (markdown-it, moderate): two quadratic paths under
  `linkify: true` — `rules_core/linkify` rebuilding `children` per linkified token, `rules_inline/linkify`
  rescanning `state.pending` at every `://`. **Exercised here**: `parse.ts:26` sets `linkify: true`, so a
  few hundred KB of soft-broken emails could stall a render; availability only. GHSA-r7fv-28h4-cvq7: needs
  `typographer: true`; `parse.ts:27` has it off — **not exercised**. GHSA-p98j-92pf-mc4p (dompurify, low):
  under `IN_PLACE`, a node-REMOVING `afterSanitizeElements` / `afterSanitizeAttributes` hook leaves the
  detached subtree's `on*` handlers armed. **Not exercised**: no profile uses `IN_PLACE` (all three sanitize
  strings). `sanitizeSvg` is the only profile with an afterSanitize hook (`cssPassHook`, `sanitize.ts:788`)
  and it rewrites `<style>` text, never removes a node; `sanitize()` and `sanitizeMath` use
  `uponSanitizeAttribute` only.
- **Dependent ranges admit both targets, one copy each:** `mermaid` 11.16.1 declares `dompurify ^3.3.3`;
  `@mdit/plugin-tex` 1.1.0 (and `@mdit/helper`) declare an OPTIONAL peer `markdown-it ^15.0.0` — unmet
  before and after (carried item, unchanged); `markdown-it-task-lists` declares none.
- **Lockfile +17 / −17:** only the two packages' versions and integrities moved, plus the
  `(markdown-it@…)` peer suffix on the two `@mdit` entries (their versions did not). Temml `patch_hash`
  `ba3cf1c4…` unchanged, `patches/` byte-identical, the patch confirmed present in the installed copy.
- **Bytes, clean rebuild, both engines — baseline re-derived, and it matched the cited figures exactly:**

  | | Baseline (`0eef927`) | Post-bump | Delta | Headroom vs 7,340,032 B |
  |---|---|---|---|---|
  | `.output` Chrome | 5,197,425 B | 5,200,689 B | +3,264 B | 2,139,343 B |
  | `.output` Firefox | 5,197,541 B | 5,200,805 B | +3,264 B | 2,139,227 B |
  | zip Chrome | 1,627,711 B | 1,629,302 B | +1,591 B | — |
  | zip Firefox | 1,627,770 B | 1,629,360 B | +1,590 B | — |
  | `content-scripts/peekover.js` | 340,492 B | 342,161 B | +1,669 B | — |
  | content-script md5 Cr / Fx | `bcdcf231…` / `49e218a1…` | `966f0198…` / `ae78e2ad…` | — | — |

- **Decomposed, residual 0:** exactly two files change size, the same on both engines — the content
  script (+1,669 B) and the app chunk (`chunks/app-*.js` 509,815 → 511,410 B, +1,595 B); 1,669 + 1,595 =
  3,264. Both carry the parser and the sanitizer. The app chunk's new content hash renames 81 other
  chunks that import it (same sizes, as a multiset) and rewrites `app.html`'s reference at an unchanged
  495 B. Not split per package — the Verify line asks per file. 135 files per engine, before and after.
- **Firing control (attribution):** pre-bump `package.json` + lockfile restored, reinstalled, rebuilt —
  EVERY file md5-identical to baseline on both engines; bump restored, rebuilt — every file md5-identical
  to the first post-bump build. Zero `codemirror` bytes in the content script: still unreferenced, 1.1's
  firing control is the standing proof.
- **Suites — all green on the first full run, no flake observed:** lint 0 · unit 1145 / 1145 (66 files)
  · browser 1663 pass / 15 skip (chromium 838 + 1, firefox 825 + 14; 82 files per engine).
  Sanitizer, all profiles — `sanitize.test.ts` 119: `sanitize()` 38, `sanitizeSvg` 55 (exact-set,
  denied-by-absence, the no-hook guard and the `<style>` CSS pass among them), `sanitizeMath` 26; real
  engines, per engine: `sanitize.browser` 31, `diagramSanitize` 5, `diagramSecure` 9, `diagramStyleCss`
  18, `diagramRender` 19, `mathInline` 7, `mathBlock` 11, `mathDegrade` 12. Parser and math grammar —
  `parse.test.ts` 37 (the `$5` false-positive, code-span exclusion and escaping cases included). Golden —
  `golden.test.ts` 11, HUGE-DOCUMENT included; `git diff tests/golden/output/` EMPTY. `pipeline.perf.test.ts`
  1 / 1. The two carried wall-clock flakes did not fire in two unit runs.
- **`_isValidAttribute` re-confirmed** (the M7 §2.2 AMENDMENT's revisit-when): 3.4.16 re-expresses it as
  early returns; same branches, same order, same conditions. Recorded in the M12 TASK 1.2 entry.
- **Governance:** `dependencies` 10, names unchanged · `dompurify` one copy (3.4.16), `markdown-it` one
  copy (14.3.2) · licences MIT and (MPL-2.0 OR Apache-2.0), unchanged; neither version has install
  scripts · SBOM regenerated (transient, not staged): **191 components**, unchanged — MIT 143, ISC 35,
  BSD-3-Clause 7, Apache-2.0 1, BSD-2-Clause 1, Python-2.0 1, Unlicense 1, (MPL-2.0 OR Apache-2.0) 1,
  Unknown 1; the generator still does not represent the temml patch (carried blind spot) · manifest
  654 / 770 B, `permissions: []`, no `web_accessible_resources`, no `contextMenus`; `manifest.test.ts` 8.
- **Noted, nothing changed:** `mermaid` resolves 11.16.1, where M7's records cite 11.16.0 — it has been
  11.16.1 since `8f6c59f` (the pre-009 audit bump), not a move of this task's.

**M12 task 2.1 DONE, 2026-10-04 — `ReaderMode = 'reading' | 'raw' | 'edit'`; async `enterEditMode` and
`exitEditMode`; the backslash shortcut inert in edit; the edit visibility CSS. Tested-but-unreached: no
production caller until 3.2, nothing imports `codemirror`. `mount.ts` zero-diff. D-1's `decisions.md`
entry landed with it. Two human rulings were taken mid-task (both in that entry).**
- **★ Hazard (a) — F-2 does NOT fire on the surface edit mode runs on (human-ruled: guard as
  defense-in-depth).** `installToggleShortcut` resolves `document.querySelector('peekover-root')`; the
  app-page host is a `<div>` (`readerPane.ts:167-168`), so the listener returns before it acts — the
  2026-07-17 carried inertness. The guard (`data-mode === 'edit'` → return, before `preventDefault`)
  ships anyway; it becomes load-bearing when the carried "unify the two shortcuts on one host registry"
  item lands. Its red-first and positive control run on the `peekover-root` shape and say so; the
  app-page-shape case is a pin that passes with or without the guard (it stayed green under ablation).
  F-2's retargeting claim, "read from the code, not yet observed", is now OBSERVED on both engines.
- **Hazard (b) — the type ripple needs no `mount.ts` edit.** The widened union type-checks against
  `mount.ts:74/223/261` untouched (`tsc` 0). At runtime a `preserveReading` re-render during edit hands
  `'edit'` back to `setReaderMode` after `replaceChildren` has dropped the editor; `setReaderMode(host,
  'edit')` therefore lands in `'reading'` and ends the edit session (a later exit cannot resurrect a
  stale return mode). Never a bare `'edit'` with both views hidden. Group 4 (D-8) stops the re-render.
- **The build seam.** `enterEditMode(host, { loader, build? })`: `await loader()`, then
  `await build?.(engine, host)`, then the flip + relabel. 2.2 plugs its shell in as `build`; a rejection
  from either step propagates with the host untouched (`build` owns cleanup of its own partial DOM). The
  return mode is read at the flip, not at the call. `exitEditMode(host)` is a no-op outside edit.
  Teardown on exit is 2.2's own, called beside `exitEditMode` — no seam added for it.
- **Stated, not hidden:** the mode pill in edit reads "Raw" (`toggleReaderMode` stays binary, so that is
  where its click goes — and it leaves edit without `exitEditMode`). What the pill does during an edit
  session is 3.2's to decide when it adds the edit control.
- **★ The `:host` pin (human-ruled: fold).** A separate `[data-mode="edit"]` rule moved
  `htmlExport.test.ts`'s 26-`:host`-site pin to 27 (persistent, not a flake). Ruled: `'edit'` is a second
  selector on each of the two existing `data-mode` rules — count stays 26, no assertion edited.
- **Red-first.** Unit, before implementation: 9 failed (`enterEditMode is not a function`). Unit ablation
  (flip before the await): 4 failed — the pending-state case `expected 'edit' to be 'reading'`. Browser,
  guard removed: 4 failed (textarea + contenteditable × Cr + Fx), `expected 'raw' to be 'edit'`, the
  mode assertion first. Browser, CSS reverted: 4 failed, `expected 'block' to be 'none'`. Positive
  control (reading: `\` writes `raw`, then from raw writes `reading`) green on both engines. Listener
  instruments are per-press deltas (the `data-mode` writes to this host; `preventDefault` calls on a `\`
  keydown), driven by real trusted key presses.
- **Bytes, clean rebuild, both engines (baseline re-derived at `c173d4e`, matched the cited figures):**

  | | Baseline | Post-2.1 | Delta | Headroom vs 7,340,032 B |
  |---|---|---|---|---|
  | `.output` Chrome | 5,200,689 B | 5,201,045 B | +356 B | 2,138,987 B |
  | `.output` Firefox | 5,200,805 B | 5,201,161 B | +356 B | 2,138,871 B |
  | zip Chrome | 1,629,302 B | 1,629,407 B | +105 B | — |
  | zip Firefox | 1,629,360 B | 1,629,465 B | +105 B | — |
  | `content-scripts/peekover.js` | 342,161 B | 342,339 B | +178 B | — |
  | content-script md5 Cr / Fx | `966f0198…` / `ae78e2ad…` | `d4d48d23969c91750e055be61a3ea767` / `5ff11e424a1b5fd669e446b888ce9875` | — | — |

- **Decomposed, residual 0.** Two files change size, the same on both engines: the content script and
  the app chunk (`chunks/app-*.js` 511,410 → 511,588 B), +178 B each = 356. Content-script arms, by
  ablation: `readerMode.ts` reverted → 342,231 B (arm **108 B**: the guard, the `'edit'` → `'reading'`
  branch, the `editReturn` WeakMap + its delete; `enterEditMode`/`exitEditMode` tree-shake out, having
  no caller); `readerCss.ts` reverted → 342,269 B (arm **70 B**); both reverted → 342,161 B, md5
  identical to baseline on both engines. 108 + 70 = 178. Zero `codemirror` bytes in the content script:
  still unreferenced, 1.1's firing control is the standing proof (a 0-count grep here proves nothing).
- **Suites, all green:** lint 0 · unit 1155 / 1155 (66 files; `readerMode.test.ts` 17, `mount.test.ts`
  10, `mount.fallback.test.ts` 3, `tocView.test.ts` 27, `htmlExport.test.ts` 13, `golden.test.ts` 11) ·
  browser 1675 pass / 15 skip (83 files per engine; `editMode` 6, `watchRemount` 12, `tocNetwork` 2,
  `exportShortcut` 8, per engine). The carried wall-clock flakes did not fire. Golden diff EMPTY ·
  `mount.ts` and every other zero-diff file EMPTY · manifest 654 / 770 B, `permissions: []`.

**M12 task 2.2 DONE, 2026-10-04 — `mount()` gains the additive `chrome?: boolean` (default `true`);
`editorView.ts` builds the split-pane shell and the nested preview host on it; `EDITOR_CSS` lays it out.
Tested-but-unreached: no production caller until 3.2, nothing imports `codemirror`. `mount.ts`'s ONE
authorized diff is spent. D-4's `decisions.md` landing entry is in the same commit. No human ruling was
needed; nothing hit a stop.**
- **Step 0(a) — the guard range was unmoved** at `f9e6439`: pill `:157`, theme `:169`, watch `:183`, diff
  `:191`, badge `:198`, remote bar + indicator `:199-201`, rail `:209-210`; stylesheets `:155-156` and the
  reading column `:211` outside it. `tocRail` is read again by the post-commit wiring, so the guard keeps
  the declaration and makes it `null` — that is what let the range be guarded with nothing else touched.
  The diff: one `const chrome = options.chrome !== false`, `if (chrome)` on five pushes, `chrome &&` on the
  remote-load condition, the rail as a conditional. No line re-indented, no comment moved.
- **Step 0(b) — the post-commit wiring is harmless on the nested host; none of it is guarded.**
  `registerReaderSource`: the preview text, under the nested host's own key. `setReaderMode`:
  `data-mode="reading"` on the nested host, no pill to relabel. `removeAttribute('data-diff')`: no-op. The
  two installers: once-guarded, already installed. `unregisterTocHost(nested)`: runs because no rail was
  composed — this is what keeps the preview out of the TOC registry. `initReaderRuntime`: the nested host
  becomes a themed host and gets `data-theme` — NEEDED, since the nested root carries its own token block.
  A nested render makes ZERO attribute writes to the outer host (measured), and the outer host's
  registered source is unchanged.
- **Step 0(c) — the CSS is a new `EDITOR_CSS` export in `readerCss.ts`,** injected by the shell as its own
  `<style>` and removed with it. `READER_CSS` gains nothing, so `htmlExport.test.ts`'s pin stays 26 with
  no file outside the list touched. Tokens: `--line`, `--r`, `--code-bg`, `--ink`, `--mono` (all in
  `design/tokens.css` and `READER_CSS`'s `:host` block), plus `--toc-w`, `READER_CSS`'s own rail width.
- **The scroll choice: a wrapper.** The nested host sits inside `.peekover-editor__preview`
  (`overflow:auto`, definite height); `resolveScrollContainer(nested, true)` returns it by identity. The
  nested-host-scrolls alternative would have been reached only through the resolver's fallback — the
  same answer a failed resolution gives.
- **★ Step 0(d) — bypass state, a carry for 3.2.** The shell is `display:none` unless the host carries
  `data-mode="edit"`. After enter → pill click (which leaves edit through `toggleReaderMode`, no
  teardown): nothing of the shell is on screen in raw or in reading, on both engines. What REMAINS in the
  outer shadow root: the shell's `<style>`, the grid container, the source slot (and whatever was built
  into it), the preview pane and the nested host with its shadow root — hidden, and reused by the next
  `buildEditorShell` rather than duplicated. 3.2 owns what the pill does in edit.
- **Step 0(e) — the seam is consumed, `readerMode.ts` zero-diff.** `buildEditorShell(host)` is the `build`
  step; it is idempotent, throws before creating anything on a host with no shadow root, and removes its
  own nodes if the initial render throws. `teardownEditorShell(host)` is called beside `exitEditMode`.
- **Shape notes for the human (7.1's walk), none ruled:** the two panes are children of ONE grid
  container (the mockup's `.editor`), which is the reading column's sibling; the shell's height is a
  definite `60vh` (90vh stacked) where the mockup has `min-height:60vh`, because a minimum-height pane
  never scrolls; its margin is the reading column's own `56px 32px 130px`, and it yields `--toc-w` to an
  open rail. A preview holding remote media shows it blocked with no in-preview opt-in (the bar is inside
  the ruled range); the media policy still runs.
- **Red-first.** Unit, before the option: 1 failed — the `chrome: false` case, `['STYLE','STYLE','BUTTON',
  'BUTTON','BUTTON','DIV','NAV','DIV']` against `['STYLE','STYLE','DIV']`. The omitted-vs-`true` equality
  cannot be red before the option exists; it was seen red under a wrong default (`=== true`), the
  equality being the assertion that failed. Unit, before the shell: the file failed to import. Browser,
  both engines, by editing `editorView.ts`'s one `mount()` call: **routed at the outer host** → `the
  source pane is gone: expected false to be true`; **`chrome: false` dropped** → `expected
  ['peekover-watch', …(2)] to deeply equal []` (the watch control, the diff affordance and the rail all
  composed) and, for the backtick, `expected ['data-toc=open'] to deeply equal []` (the key resolved to
  the preview). CSS, one property at a time: preview without `overflow:auto` → the resolver returned the
  nested host; no at-rest `display:none` → `expected 'grid' to be 'none'`; no narrow stack → `592.6 ≤ 58`
  failed; no rail yield → `1367 ≤ 1150` failed (by rect — the pane's centre is not under the rail, so
  the hit-test alone does not see it).
- **Hazards absent, positive control firing — registries LIVE** (a watch target, a diff context,
  `CLAUDE.md` as the identity, a two-heading preview): the nested root is `[STYLE, STYLE, DIV]` with none
  of the six chrome classes and a non-empty reading column; the outer host, same registry state, carries
  all six. A real backtick writes `data-toc` to the outer host and nothing to the preview.
- **Outer-chrome identity:** the same node set, serialising identically, across ten enter/exit toggles
  and across twenty preview re-renders; the outer reading column identical by reference.
- **Viewports, by hit-test:** WIDE **1400×900** — side by side, equal widths, rail open, the preview's
  right edge left of the rail. NARROW **414×896** — stacked, source above preview. Both engines.
- **Bytes, clean rebuild, both engines (baseline re-derived at `f9e6439`, matched the cited figures):**

  | | Baseline | Post-2.2 | Delta | Headroom vs 7,340,032 B |
  |---|---|---|---|---|
  | `.output` Chrome | 5,201,045 B | 5,201,135 B | +90 B | 2,138,897 B |
  | `.output` Firefox | 5,201,161 B | 5,201,251 B | +90 B | 2,138,781 B |
  | zip Chrome | 1,629,407 B | 1,629,492 B | +85 B | — |
  | zip Firefox | 1,629,465 B | 1,629,550 B | +85 B | — |
  | `content-scripts/peekover.js` | 342,339 B | 342,384 B | +45 B | — |
  | content-script md5 Cr / Fx | `d4d48d23…` / `5ff11e42…` | `129deda5156522a75ac41eaabbdc1c5f` / `94c2d14b9e08144f0c932415edb28acf` | — | — |

- **Decomposed, residual 0.** Two files change size, the same on both engines: the content script and
  the app chunk (`chunks/app-*.js` 511,588 → 511,633 B), +45 B each = 90; 82 other chunks are renamed by
  the hash cascade at unchanged sizes. Arms, each a full rebuild compared file-by-file: **`mount.ts`
  reverted, `EDITOR_CSS` and `editorView.ts` kept** → every file md5-identical to baseline (the guard arm
  is the whole **45 B**; the CSS and the shell contribute **0 B** anywhere); **`readerCss.ts` reverted and
  `editorView.ts` removed, guard kept** → every file md5-identical to post (CSS arm **0 B**, and
  `editorView.ts` reaches no built file — proven by the build, not by grep); both ablated is the baseline
  build itself. 45 + 0 = 45. Zero `codemirror` bytes in the content script: still unreferenced, 1.1's
  firing control is the standing proof.
- **Suites:** lint 0 · unit 1168 / 1168 (67 files; `mount.test.ts` 12, `mount.fallback.test.ts` 3,
  `editorView.test.ts` 11, `htmlExport.test.ts` 13 — pin still 26, `tocView.test.ts` 27,
  `readerMode.test.ts` 17, `golden.test.ts` 11) · browser 1699 pass / 15 skip (84 files per engine; per
  engine: `editorNestedHost` 12, `editMode` 6, `watchRemount` 12, `watchControl` 36, `watchDiffDefer` 2,
  `diffChrome` 39, `diffView` 10, `tocNetwork` 2, `themeControl` 19). No red on the full run; the carried
  wall-clock flakes did not fire. NO existing assertion edited. Golden diff EMPTY · `readerMode.ts`,
  `htmlExport.ts`, `htmlExport.test.ts` and every other zero-diff file EMPTY · manifest 654 / 770 B,
  `permissions: []`.

**M12 task 3.1 DONE, 2026-10-05 — `src/render/editorEngine.ts` is the ONE module importing CodeMirror;
`editorImportFence.test.ts` proves the content script cannot reach it. Tested-but-unreached: no production
caller until 3.2, so NO CodeMirror chunk is emitted and every shipped file is md5-identical to 2.2's.
D-2's and D-10's `decisions.md` landing entries are in the same commit. No human ruling was taken; nothing
hit a stop. Three things are surfaced for the human — the two ★ findings and the open memo key below.**
- **The fence, written first and seen red** (module absent: 4 of 8 failing — clause B, both clause-C
  assertions, clause D's tree-scan landmark). Four clauses, 8 assertions, on `diagramImportFence.test.ts`'s
  shape: **A** the content-script graph reaches no `src/render/editor*.ts` module (by name) and no
  `codemirror` / `@codemirror/*` specifier · **B** the control — the same walker started at
  `editorEngine.ts` finds both specifiers (the engine's OWN edge; the app page reaches nothing until 3.2)
  · **C** over every shipped `.ts` under `src/` + `entrypoints/`, the only CodeMirror imports are two
  DYNAMIC edges in `editorEngine.ts`, no static or type-only one · **D** non-vacuity. The pattern's
  ablation is 007 3.4's / 009 4.5's, cited.
- **The specifier set: exactly two**, `codemirror` and `@codemirror/lang-markdown`, both dynamic, both in
  `loadCodeMirror`. `EditorView` comes through `codemirror`'s re-export; every type is inferred from the
  two edges, so there is no `import type` and no third specifier.
- **The surface:** `loadCodeMirror` · `loadEditorEngine(host, loader?)` · `EditorEngine` = `{ EditorView,
  createView(parent, doc, extra?) }` · types `EditorModules`, `EditorModuleLoader`, `EditorViewHandle`,
  `EditorExtension`. 2.1's seam takes `{ loader: () => loadEditorEngine(el) }`. `createView` builds
  `basicSetup` + `markdown()` (no argument), then the caller's optional `extra` — the engine adds nothing
  of its own. `extra` exists because 3.2 / 3.3 need an update listener and CodeMirror takes one only as an
  extension.
- **Memo + retry:** one promise per host in a `WeakMap`; two loads for one host return the SAME promise
  (pending or settled), the loader runs once, and a second host runs it again (the control). A REJECTED
  load is evicted as it settles — waiting callers get the rejection, the next call retries. A loader that
  throws synchronously is a rejection too.
- **What jsdom was and was not asked:** the memo, the setup (on a recording fake) and the document
  round-trip (text in, text out — no layout) are unit tests. That a view renders, focuses or takes typed
  input is NOT claimed here — 3.2's real-engine tests.
- **Bytes, clean rebuild, both engines.** Baseline re-derived at `d505890`, matching the cited figures;
  post-3.1 **every one of 135 files md5-identical to baseline on both engines** — `.output` 5,201,135 /
  5,201,251 B, zip 1,629,492 / 1,629,550 B, content script 342,384 B, md5 unchanged. **2.2's Up-next line
  "the +605,443 B lands at 3.1" was wrong: with no caller there is no chunk. It lands at 3.2.**
- **The chunk, measured through a scratch app-page caller (reverted):** `.output` **+607,325 B** on both
  engines (5,808,460 / 5,808,576 B; headroom would be 1,531,572 / 1,531,456 B), zip +205,275 B. Decomposed,
  residual 0: three new lazy chunks — 342,426 B (the shared core) + 209,493 B (`lang-markdown`) + 54,680 B
  (`codemirror`: the `EditorView` re-export + the setups) = 606,599 B — plus the app chunk 511,633 →
  512,359 B (+726 B); 81 chunks renamed at unchanged sizes, `app.html` rewritten at 495 B. **Against 1.1's
  shipping arm (+605,443 B = a 605,350 B probe chunk + 93 B glue): +1,882 B.** +1,249 B in the chunks: one
  probe chunk became three (two dynamic entries and their shared core, each with its own import/export
  table), and each entry keeps its package's whole namespace (`minimalSetup`, `commonmarkLanguage`, … —
  destructuring at the `import()` did not shake them). +633 B in the app chunk: this module's own glue
  (the memo, `engineFrom`, the loader) and the scratch caller, where 1.1 had a bare `import()`. That split
  is read from the emitted chunks, NOT ablated arm by arm — a 0.3% residual, re-measured for real at 3.2.
  Content-script md5 unchanged under the scratch caller, both engines; after the revert, every file
  md5-identical to the post-change build.
- **★ Finding for the human — plan §4 risk 6: `markdown()`'s defaults do NOT recognise GFM.** The default
  `base` is `commonmarkLanguage` (`lang-markdown` 6.5.2 `dist/index.js:407`); measured, the default tree
  has no `Task` / `TaskMarker` / `Table*` / `Strikethrough` / `URL` node and `{ base: markdownLanguage }`
  has all of them. Footnotes are recognised under NEITHER (`@lezer/markdown` 1.7.2 has no footnote
  extension). Highlighting (and table folding) only: the preview is markdown-it's, and the ruled Enter /
  Backspace keymap works under the default base (measured: `- [ ] todo` continues `- [ ] ` either way).
  Nothing was configured — defaults are ruled. **Question owed an answer before or at 3.2's eyeball:**
  keep strict-CommonMark highlighting, or rule `markdown({ base: markdownLanguage })`?
- **★ Finding for 3.2 / 5.2 / 5.3 — D-7's round-trip, measured** (`doc.toString()` and `sliceDoc()` agree):

  | Case | Input | Output | Preserved |
  |---|---|---|---|
  | LF, trailing newline | `a\nb\n` | `a\nb\n` | Y |
  | LF, no trailing newline | `a\nb` | `a\nb` | Y |
  | CRLF, trailing newline | `a\r\nb\r\n` | `a\nb\n` | N |
  | CRLF, no trailing newline | `a\r\nb` | `a\nb` | N |
  | mixed CRLF / LF / lone CR | `a\r\nb\nc\rd\r\n` | `a\nb\nc\nd\n` | N |
  | lone CR | `a\rb` | `a\nb` | N |
  | empty | (empty) | (empty) | Y |

  Every line ending becomes LF; whether the text ends in a newline is kept. Inserted text is normalized
  the same way. So on a CRLF file the buffer differs from `originalText` before a keystroke: **3.2's
  dirty attribute cannot be a raw `buffer !== originalText`** (it would mark every CRLF file dirty on
  entry), and 5.3 must decide what a save writes for one. D-7's baseline never passes through the editor.
- **★ Open for 3.2's kickoff — the memo key.** The plan says "the editor's own nested host". But
  `enterEditMode` loads THEN builds, so the nested host does not exist when the loader runs, and
  `teardownEditorShell` discards it on exit. The engine keys on whatever element it is handed; the outer
  host is the key under which edit → reading → edit actually reuses the promise.
- **Read-only, carried from 2.2's review — module-level collections a nested `mount()` writes to:**
  `themeRegistry.ts`'s `themeHosts` is a `Set`, self-pruning (`!isConnected` entries dropped before every
  broadcast) with an exported `unregisterThemeHost`. `initReaderRuntime` registers the nested host;
  **`teardownEditorShell` already unregisters it** (`editorView.ts:143`) after removing its nodes — so
  nothing is left registered on the `exitEditMode` path. On the pill-bypass path there is no teardown: the
  nested host stays connected (hidden) AND registered, which is right while the shell is reused — it keeps
  receiving theme flips. `readerMode.ts`'s `sources` and `editReturn`, and `editorView.ts`'s `shells`, are
  `WeakMap`s keyed by host — nothing to unregister. `tocView.ts`'s `tocHosts` (a `Set`, also
  connected-pruned): the nested mount composes no rail and calls `unregisterTocHost(nested)`, so it is
  never in it. No leak found; 3.1 changed none of those files.
- **Suites:** lint 0 · unit 1194 / 1194 (69 files; `editorImportFence` 8, `editorEngine` 18,
  `diagramImportFence` 8, `codeImportFence` 9, `mathImportFence` 11, `editorView` 11) · scanner self-test
  7 firing + 10 silent, scan clean over 78 shipped files · browser 1699 pass / 15 skip (168 files, 84 per engine — unchanged from 2.2, as it must be: no browser file was added or touched; `editorNestedHost` 12 and `editMode` 6 per engine, 2.2's counts). No red on the full run; the carried wall-clock flakes did not fire. NO existing test or fixture edited. Golden diff EMPTY · every
  zero-diff file EMPTY (`mount.ts`, `readerPane.ts`, `appShell.ts`, `editorView.ts`, `readerMode.ts`,
  `chromiumFolderSource.ts`, `htmlExport.ts`, the diagram/math modules, `runReader.ts`, `mountReader.ts`,
  `contentWatch.ts`, `scripts/check-dynamic-imports.ts`) · manifest 654 / 770 B, `permissions: []`.

**M12 task 3.2 DONE, 2026-10-05 — the edit control, the editor pane and the save-capability injection.
`enhanceEditor(host, { save })` is wired at the two app-page call sites; activating the control loads
CodeMirror, builds it into 2.2's source slot and enters edit. This is the task where CodeMirror's bytes
first ship (+612,335 B `.output`, the content script md5-identical). Three human rulings were taken in
the kickoff (R1–R3) and are banked in `decisions.md` with D-3's landing and D-1's control half.**

> **★ HONESTY NOTE — WHAT `main` SHIPS FROM THIS COMMIT.** The editor is now REACHABLE from the app page,
> and it can lose edits. **Leaving edit discards the buffer with no warning** (the unsaved-changes guard
> is 6.1). **A watch re-render during an edit destroys the buffer** (4.1–4.2; the watch pill is still
> live beside the editor). **Save does not exist** — the injected capability reports "not yet
> available" and nothing calls it (5.3). This is planned sequencing on an unreleased branch, not a
> shipped state: nothing here is released, and it must not be until groups 4–6 land.

- **Step-0 re-derivations, all four clear — no stop.** (a) *The seed is the raw read:* `readerPane.ts:268`
  `await file.read()` → `classifyReaderOutcome` passes `read.text` through verbatim (`trim()` only tests
  for emptiness) → `mount(outcome.text, host, …)` (`:198`) → `registerReaderSource(host, source)`
  (`mount.ts:238`). (b) *The normaliser:* 006 D-5's `normalise` (`app/snapshots.ts:259`) would pull
  nothing new into the app graph (`appShell.ts` and `diffEngine.ts` already import that module) but is
  NOT equivalent — it rewrites CRLF only, and CodeMirror splits on `/\r\n?|\n/` (`@codemirror/state`
  `dist/index.js:608`), so a lone CR also becomes a break. A one-line `normaliseLineBreaks` is in
  `editorView.ts`, tested as a pure function. (c) *F-5:* see `decisions.md` 012 D-3. (d) *The control's
  stylesheet:* `CONTAINED_CSS` rides into the content script, so the home is an enhancer-injected
  `<style>` from a new `EDIT_CONTROL_CSS` export.
- **Tests first, seen red.** `editorEnhancer.test.ts` before the module existed (unresolvable import);
  the fence's clause-B app-page half (2 red: the app graph reached no editor module and found no
  CodeMirror specifier); R1's pin and its three measurements (4 red).
- **What was built.** `editorEnhancer.ts` (new): one `<button>` after the mode pill + its own `<style>`,
  idempotent, re-installed after every outer `mount()`, nothing on a failed render. `editorView.ts`
  (editor half): `buildEditor` / `editorSessionFor` / `dropStaleEditorSession` / `normaliseLineBreaks` /
  `EDITOR_DIRTY_ATTR`, and `teardownEditorShell` now ends the session first. The session keeps
  `originalText` RAW and writes `data-edit-dirty="true"` on the OUTER host while the buffer differs
  from it (normalised), removing it when it matches again. `readerCss.ts`: `EDIT_CONTROL_CSS` (new
  export) and, in `EDITOR_CSS`, R3's pill-hide rule plus five rules for the engine's view.
- **Degrade (§3.7), red-first on both engines.** A rejecting loader — and a REAL failed module fetch
  (`import()` of a URL the server lacks) — leaves the prior mode (reading, and raw), no shell, no
  `.cm-editor`, the shadow root's children unchanged, the document still on screen, the control reading
  "Editor unavailable". *Reverted* (flip on click, load after, swallow the failure): unit `expected
  'edit' to be 'reading'`; browser, Cr and Fx alike, `the document is still in its prior mode: expected
  'edit' to be 'reading'` / `… to be 'raw'` — 5 of 7 red per engine, the positive control among them.
- **Absent on the content-script reader, red-first by un-gating.** With `enhanceEditor(host)` added to
  `mountReader.ts` (reverted): the browser test reds on both engines (`expected <button …> to be null`),
  fence clause A reds on both its assertions, and the built content script goes 342,384 → 956,490 B.
- **Real engine, Chromium + Firefox, every fixture asserting it is UNWATCHED.** LF fixture: the view is
  on screen in the source slot, fills it, and its state and DRAWN text equal the source. CRLF fixture:
  the view holds the LF-normalised text, `originalText` is the raw CRLF string, the dirty attribute is
  absent on entry. Real typed keys land in the buffer and set the attribute; the editor's own Ctrl-Z
  clears it. The control, selected by class alone, is a `<button type="button">`; Enter enters, Space
  exits; its name carries the state. It is hit-testable and never overlaps the pill under either pill
  label, at 414×896 and 1400×900 (gap 20 px beside "Reading", 43–44 px beside "Raw"). R3: the pill is
  `display:none` in edit; after the exit the shadow root's children are the same nodes as before entry.
- **R2's memo, and the two `import()` observations** (harness page, not the built extension): the module
  loader runs once across edit → reading → edit and again for a second host. The page's first
  `import()` of the engine's specifiers made 2 requests, the repeat 0 — both engines. **A repeated
  `import()` of a URL whose fetch failed made 1 request then 0, and rejected both times — both
  engines.** The engine's memo forgets a failure, but the browser's module map does not: after a failed
  chunk fetch, "try again" needs a reload. (A packaged extension's chunks are local files, so this is a
  corrupted-install case.) The control's wording does not promise success; flagged for the human.
- **Bytes, clean rebuilds, both engines identical arm for arm.** Baseline at `3affcae` matched 3.1's
  figures exactly. Post-change: **`.output` 5,813,470 B (Cr) / 5,813,586 B (Fx), +612,335 B** — headroom
  1,526,562 / 1,526,446 B (~1.46 MiB) · zip 1,836,121 / 1,836,179 B (+206,629) · manifest 654 / 770 B.
  Decomposed by ablation, residual 0:

  | Arm | `.output` (Cr) | Step | What it is |
  |---|---|---|---|
  | A · baseline (`3affcae`) | 5,201,135 | — | — |
  | E · both `enhanceEditor` lines removed | 5,201,239 | +104 | shell plumbing: the save closure, the render-of-`save`, the pane option |
  | B · engine imports stubbed out | 5,206,555 | +5,316 | enhancer + view + control + their CSS, in the app chunk |
  | C · real engine, default base | 5,813,405 | +606,850 | three lazy chunks (54,680 + 209,493 + 342,426 = 606,599) + 251 B import glue in the app chunk |
  | D · R1 (`markdownLanguage`) | 5,813,470 | +65 | R1, all in the app chunk; the lazy chunks are unchanged |

  Only two built names change size: the app chunk (511,633 → 517,369 B, +5,736) and the three new
  chunks. 135 files → 138. **Content script md5-identical to 3.1's in arms A, E, B, C and D on both
  engines** (`129deda5…` Cr / `94c2d14b…` Fx), and it MOVES under the un-gate arm — an identity proven
  with an instrument seen to fire, not a grep. 3.1's scratch estimate was +607,325 B; the real figure
  for the engine alone is +606,850.
- **Suites.** lint 0 · unit **1227** / 1227 (70 files; `editorEnhancer` 28, `editorEngine` 21,
  `editorImportFence` 10, `editorView` 11, `readerMode` 17, `readerPane` 11, `appShell` 62,
  `htmlExport` 13 with its 26-site pin unmoved) · scanner clean over 79 shipped files, self-test 7
  firing + 10 silent · browser **1733 pass / 15 skip** (172 files, 86 per engine; `editorRender` 10,
  `editorDegrade` 7, `editorNestedHost` 12, `editMode` 6 per engine). No red on the full run; the carried
  wall-clock flakes did not fire. One existing assertion edited — R1's authorized pin. Golden diff
  EMPTY · zero-diff files EMPTY (`mount.ts`, `readerMode.ts`, `chromiumFolderSource.ts`, `htmlExport.ts`
  and its test, the diagram/math modules, `runReader.ts`, `mountReader.ts`, `contentWatch.ts`,
  `src/watch/*`) · `permissions: []`.
- **★ The informal eyeball is OWED and NOT done** — it is the human's (WORKFLOW §7.2); the steps are in
  this task's report. Nothing in the suites stands in for it. *(2026-10-05: DEFERRED to 7.1 by human
  ruling — the record directly below.)*
- **Surfaced for the human, none ruled:**
  1. *Styling choices no ruling covers:* the control's wording and placement; five token-only rules that
     make CodeMirror fill its pane, take the pane's mono face, and draw its gutter / caret / cursor from
     the reader's tokens (its black caret is invisible on the dark pane). The active-line band,
     selection, search panel and completion tooltip are left at CodeMirror's light-page defaults — look
     at them in the dark theme.
  2. *A stale session is ended on re-install.* When an outer `mount()` replaces a host mid-edit (a
     document switch), `enhanceEditor` destroys the orphaned view and clears the dirty attribute, so it
     cannot describe the next document. It is this task's own attribute kept truthful, not watch
     handling — but it is behaviour the task line did not spell out.
  3. *Ctrl/Cmd+S while typing in the editor — read from the code, NOT observed.* `main.ts`'s export
     shortcut guards with `isEditableTarget(e.target)`; a key typed inside the shadow root reaches
     `document` retargeted to the host, which is not editable. So Ctrl+S in the editor is expected to
     run the last export (an HTML download of the on-disk document, not the buffer). It is F-2's hazard
     class on the app page, and `main.ts` is outside this task's files. Owed a look before 5.3 makes
     Ctrl+S mean "save" in anyone's head.
  4. *Printing while in edit* is untested: the reading column is hidden in edit.
  5. *`AGENTS.md`'s "Current milestone" paragraph still says "task 1.1 DONE, task 1.2 next".* Stale
     since 1.2; not in any task's file list. Left untouched.

**M12 task 3.2 — the informal eyeball DEFERRED to 7.1, 2026-10-05 (human ruling; `decisions.md`'s
entry of that name). Automated proxies stand in: `tests/browser/editorEyeballProxy.browser.test.ts`,
test-only, ZERO production diff, 11 tests per engine, green on Chromium and Firefox.** A departure from
WORKFLOW §7.2 and `tasks.md` 3.2's clause, accepted on the record with M11's three by-eye-only defects
as the named risk. The proxies measure; they are not the eyeball.

- **Method.** WCAG 2.1 AA, stated before measuring: text 4.5:1, non-text 3:1; light is the control.
  007's sweep (`diagramTheme.browser.test.ts`: computed colour, relative luminance, background found by
  walking ancestors across the shadow boundary) plus compositing — translucent layers flattened
  source-over in sRGB down to the first opaque ancestor; the selection layer (a sibling of the text)
  inserted by hand beneath the in-content layers; a gradient taken at its worst stop.
- **Proxy 1 — contrast, 27 pairs × 2 themes × 2 engines. Chromium = Firefox on every row.** Every
  surface opened (Ctrl-F by a real keypress; the tooltip by typing `<`). ✗ = below the bar.

  | Surface · pair | Bar | Light | Dark |
  |---|---|---|---|
  | content · body text on the pane | 4.5 | 15.74 | 13.61 |
  | active line · band against the pane | 3 | 1.02 ✗ | 2.2 ✗ |
  | active line · text on the band | 4.5 | 15.43 | 6.18 |
  | gutter · line number | 4.5 | 2.38 ✗ | 3.26 ✗ |
  | gutter · ACTIVE line number on its band | 4.5 | 2.36 ✗ | 4.34 ✗ |
  | gutter · active-number band against the gutter | 3 | 1.01 ✗ | 14.15 |
  | gutter · rule against the pane | 3 | 1.11 ✗ | 1.13 ✗ |
  | caret · drawn caret on the active line | 3 | 15.43 | 6.18 |
  | selection, focused · against the pane | 3 | 1.27 ✗ | 11.22 |
  | selection, focused · selected text on it | 4.5 | 12.95 | **1.16 ✗** |
  | selection, unfocused · against the pane | 3 | 1.24 ✗ | 11.46 |
  | selection, unfocused · selected text on it | 4.5 | 13.15 | **1.14 ✗** |
  | search panel · panel against the pane | 3 | 1.04 ✗ | 14.83 |
  | search panel · top rule against the pane | 3 | 1.2 ✗ | 11.91 |
  | search panel · label text | 4.5 | 19.26 | 19.26 |
  | search panel · typed text in the field | 4.5 | 21 | 21 |
  | search panel · field border against the panel | 3 | 1.67 ✗ | 1.67 ✗ |
  | search panel · field fill against the panel | 3 | 1.09 ✗ | 1.09 ✗ |
  | search panel · button text (worst gradient stop) | 4.5 | 14.94 | 14.94 |
  | search panel · close × | 4.5 | 19.26 | 19.26 |
  | search match · matched text | 4.5 | 15.75 | 4.85 |
  | search match, current · its text | 4.5 | 9.86 | **1.52 ✗** |
  | autocomplete · tooltip against the pane | 3 | 1.04 ✗ | 14.83 |
  | autocomplete · tooltip border against the pane | 3 | 1.69 ✗ | 8.42 |
  | autocomplete · an option's text | 4.5 | 16.37 | **1.09 ✗** |
  | autocomplete · the SELECTED option's text | 4.5 | 4.63 | 4.63 |
  | autocomplete · selected band against the tooltip | 3 | 4.25 | 4.25 |

  Bold = fails on dark with light clear: the dark theme's own defects (light ink on CodeMirror's
  light selection / tooltip). The panel, tooltip and selection are un-themed light slabs on the dark
  pane — their numbers pass; whether that LOOKS acceptable is the human's.
- **Proxy 2 — collisions, 414×896 and 1400×900, rail open and collapsed. Identical on both engines
  (± 0.1 px).** Reading: control / pill / handle pairwise disjoint, each hit at its own centre, in all
  four cases. Edit: control × handle none; control × rail list none; control × pane none.

  | Viewport | Rail | Mode | Asserted overlaps | Pane right → rail left |
  |---|---|---|---|---|
  | 414×896 | open | reading | none | — |
  | 414×896 | open | edit | none | +124.7 px clear (pane only 100 px wide) |
  | 414×896 | collapsed | reading | none | — |
  | 414×896 | collapsed | edit | **pane × handle 103×26 px** | handle box over the pane |
  | 1400×900 | open | reading | none | — |
  | 1400×900 | open | edit | none | +32 px clear |
  | 1400×900 | collapsed | reading | none | — |
  | 1400×900 | collapsed | edit | **pane × handle 103×26 px** | handle box over the pane |

  The overlap was the proxy's stop condition; the human ruled it PINNED (kept out of the violations,
  asserted still present, so the fix must delete `KNOWN_PANE_UNDER_HANDLE`). Reported, by design: the
  control sits inside the rail's BOX (35–104×30 px) exactly as the mode pill does (56.5×30 px) — the
  rail's top padding is there for it; asserted against the handle and the list instead.
- **Proxy 3 — GFM and R1 as drawn. Identical on both engines.** Spans and what differs from the line;
  the last two columns are the span colours' contrast on the pane.

  | Source | Styled ranges | Style | On light | On dark |
  |---|---|---|---|---|
  | `# Heading` | `#` · the text | mark `#404740`; both bold + underline | 8.44 · 15.74 | 1.69 ✗ · 13.61 |
  | `- [ ] task` | `-` · `[ ]` | `#404740` · `#221199` | 8.44 · 11.52 | 1.69 ✗ · 1.24 ✗ |
  | table header row | each pipe · each cell | pipe `#404740`; all bold + underline | 8.44 · 15.74 | 1.69 ✗ · 13.61 |
  | table delimiter and body rows | the delimiter row · each pipe | `#404740` | 8.44 | 1.69 ✗ |
  | `~~struck~~` | `~~` · `struck` · `~~` | line-through; marks `#404740` | 8.44 · 15.74 | 1.69 ✗ · 13.61 |
  | `H~2~O` (R1) | the two `~` ONLY | `#404740`; the `2` gets no span | 8.44 | 1.69 ✗ |
  | `x^2^` (R1) | the two `^` ONLY | `#404740`; the `2` gets no span | 8.44 | 1.69 ✗ |
  | `:smile:` (R1) | `:smile:` | `#aa1111` | 6.62 | 2.15 ✗ |
  | plain line (control) | none | — | — | — |

  The dark column is beyond the kickoff's listed surfaces — found because the spans' colours were
  being read anyway: CodeMirror's default highlight palette is a light-page palette.
- **Proxy 4 — Ctrl/Cmd+S with focus in the editor: 3.2's read is CONFIRMED, both engines identical.**
  Dispatched key: 1 reaction at `document`, **1 at the editor's content** (Ctrl and Meta alike), 0 at a
  light-DOM input (the guard's control arm). Real Ctrl+S, focus in CodeMirror, buffer carrying an
  unsaved marker: `'html'` → `preventDefault` ×1 and ONE export of the on-disk document (21,487
  chars; no buffer marker, no editor markup), confirmed again as a real download; editor still in
  edit, buffer intact. `null` → `preventDefault` ×1 and nothing else — the key is swallowed. Nothing
  asserted about what it should do. The download is named `export.html` here because the route
  (`loadMain()` + `main.ts`'s dev `__peekover.selectFile`) sets no active file; from a folder it would
  carry the file's name. `null` is not a state the store yields (it loads as `'html'`).
- **Proxy 5 — what this is NOT.** The vitest harness page on both engines, not a loaded extension: no
  extension CSP, no `app.html`, no real settings store, no browser-chrome handling of Ctrl+S / Ctrl+F,
  and no Firefox extension load at all. All of that, and the look itself, is 7.1's.
- **Kickoff vs repo, flagged:** (i) "against the rail" read as handle + list, not the box (above);
  (ii) `lastExportFormat: null` is seam-only (above); (iii) the default reporter prints console output
  only for FAILED tests — the `EYEBALL {json}` records need `--reporter=verbose`; (iv) 7.1's sentence
  "the informal fidelity eyeball is NOT this task's" is superseded in place by a dated note.
- **Verify.** New file 22 / 22 (11 per engine). Targeted: `editorRender`, `editorNestedHost`,
  `editMode`, `exportShortcut` — 72 / 72 across both engines. lint 0. `git diff --stat`: the test file
  and three records, no `src/`, `entrypoints/` or package file; golden EMPTY. No build was run — the
  byte figures in § Up next are 3.2's and cannot have moved.

**M12 task 3.3 DONE, 2026-10-05 — the live preview: the editor's buffer reaches the nested host through
a cost-proportional cooldown; the preview-failure degrade (D-4, D-5's mechanism). ★ GROUP 3 IS
COMPLETE** — spec §4's edit and preview clauses hold on an unwatched document, D-4 is proven red-first
under real typing, the engine has one importer and is absent from the content script, Save is plumbed
and not wired to disk. One human ruling was taken (the degrade's red-first); `decisions.md`'s 012 D-5
entry is the record.
- **What landed, in `src/render/editorView.ts` and nowhere else in production.**
  `createPreviewCooldown(render, now)` — the watch's shape rebuilt as one instance per edit session:
  first render immediate · wait = the last render's cost, from its END · one pending slot, newest wins
  · the timer never re-armed per change · `flush` re-arms only for a remainder · an injected `now`.
  `PREVIEW_COOLDOWN_MULTIPLIER = 1` is the one place marked provisional (Q4; 6.4 removes it). The feed
  is the last line of 3.2's one update listener (dirty tracking unchanged); it hands the cooldown the
  editor's document, read only when rendered. `BuildEditorOptions` gains `now`. `endEditorSession`
  cancels the session's cooldown.
- **Step 0, re-derived.** (a) `createView`'s `extra` is a CodeMirror `Extension` (one or an array) — no
  engine change. (b) The render at BUILD is not timed and is not "the first": the first keystroke
  renders at once. `watchController.ts` has nothing extractable. (c) A pending render has THREE layers
  against outliving its session, not two: `renderPreview`'s live-shell check (2.2), the session's
  cancel, and the feed's fire-time session check. (d) `mount()` catches every failure in its own
  pipeline and degrades it in the host it was handed — the nested one.
- **★ The human ruling — tasks.md 3.3's revert clause is false in mechanism; record both reds.** "Let
  the throw propagate → the editor or the buffer is lost" did not reproduce: CodeMirror runs update
  listeners inside its own `try/catch` (`@codemirror/view` 6.43.13 `dist/index.js:8074`). The Verify
  text is unedited; its post-landing note carries the correction.
- **Red-first, each seen with its own signature.** Unit, before implementation: 13 of the 16 new tests
  red (the other three are negative claims, each red under its own ablation below).

  | Ablation | Where | Signature (both engines unless unit) |
  |---|---|---|
  | session cancel removed (guard A) | unit | `expected "clearTimeout" to be called with arguments: [ {…} ]` — that test alone |
  | fire-time session check removed (guard B) | unit | `expected [ Array(1) ] to deeply equal []` — that test alone |
  | both removed | unit · browser | unit: A, B and exit-then-re-enter red · browser: `the discarded text was rendered: expected 'qzxIntro line.…' not to contain 'qz'` |
  | either guard alone | browser | GREEN — each hides the other (the reason for the unit pair) |
  | timer re-armed per change | unit | `expected "setTimeout" to be called 1 times, but got 3 times` · `renders during the stream: expected 1 to be greater than or equal to 5` · `expected 40 to be 10` |
  | preview pane `overflow:hidden` (scroll fallback) | browser | `the marker left the view: expected 710.6 to be less than 538` |
  | the feed's render routed at the OUTER host | browser | `the editor node was destroyed mid-typing: expected false to be true` |
  | feed guard removed (the LITERAL degrade revert) | browser · unit | `a preview failure reached the page as an error: expected [ …(24) ] to deeply equal []` — editor and buffer intact |
  | failed feed render torn down like the build render | browser | `the editor node was lost: expected false to be true` |

- **Real engine, Chromium and Firefox, every fixture asserted unwatched.**
  - *Marker:* 13 typed keys appear in the nested host's column and nowhere in the outer one; the outer
    registered source is still the file. 13 feed renders for 13 keys on that small document (the
    cooldown is shorter than the gap between keys), after 1 at build.
  - *Responsiveness:* on a 212,682-byte document, 7 of 8 keys landed in the buffer while a render was
    pending in the cooldown (2.3 ms / 4.0 ms for the slowest of them). "Pending" is waiting in the
    cooldown — `mount()` is synchronous, a render is never in flight.
  - *Coalescing:* 16 keys → 2 feed renders, plus the 1 at build, counted apart.
  - *Scroll:* scrolled to a marker heading, then 16 paragraphs typed above it (718 px of new content
    in a 538 px pane): the marker sits at −7.6 → −7.4 px from the pane's top (Chromium, 4 renders) /
    −7.9 → −9.4 px (Firefox, 193 renders).
  - *Exit while pending:* no commit into the torn-down preview host in the 700 ms after, no error;
    re-entering at once, the discarded text never reaches the new session's preview.
  - *Degrade:* a forced render throw shows the reader's banner and raw source inside the preview
    pane (348×72 px in a 348×402 px pane), none in the outer root; the buffer is byte-identical, the
    next key lands, and the preview recovers when rendering does. A throw that leaves `mount()`:
    48 forced throws, 24 logged by the feed, 0 reached the page.
- **★ FINDING P-1 — the reader's enhancers do not run in the preview** (§ Carried items; home: a human
  ruling before 7.1). In units, identical on both engines, at build and after a key:

  | | Outer document | Preview |
  |---|---|---|
  | ` ```mermaid ` | figure 1, SVG 1 | figure 0, SVG 0 — the raw `pre > code.language-mermaid` |
  | `$x^2$` | `<math>` 1 | `<math>` 0 — the literal `$x^2$` in `code.peekover-math-inline` |
  | ` ```javascript ` | wrapper 1, highlighted 1 | wrapper 0, highlighted 0 — a plain `pre > code` |
  | ` ```js ` | wrapper 1, state `failed` (not a highlighter key) | wrapper 0 |

  Reason: the enhancers are called at the two app-page call sites with the OUTER host; `renderPreview`
  calls `mount()` only; a query on the outer root does not cross into the nested shadow root.
- **Findings P-2 and P-3** (§ Carried items; home: 6.2 and the §8-2 ruling): the first key after a
  pause renders synchronously inside its own keystroke — 217.7 ms (Cr) / 205.0 ms (Fx) on the large
  document; and under a driven burst 512 keys cost 4 renders on Chromium, 193 on Firefox.
- **Appearance proxies (human-authorized addition) — every pair MATCHED, no finding.** Preview column
  against outer column: light — ink `rgb(22, 23, 31)`, paper `rgb(251, 251, 248)`, `Literata, Georgia,
  serif`; dark — ink `rgb(234, 235, 243)`, paper `rgb(18, 20, 28)`, same face. A flip while editing
  re-themes the preview each way, and holds across the next feed render.
- **Bytes, both engines, against 3.2's figures (clean rebuild first: reproduced exactly).** `.output`
  5,814,005 B (Cr) / 5,814,121 B (Fx), +535 each; headroom 1,526,027 / 1,525,911 B. Zips 1,836,279 /
  1,836,337 B (+158). ONE file changed size: the app chunk, 517,369 → 517,904 B. Decomposed by
  ablation: the feed without the cooldown +114 B; the cooldown +421 B; residual 0 (a path
  decomposition; second path: cooldown unfed +525 B, the `push` call +10 B). Content script 342,384 B,
  md5 `129deda5156522a75ac41eaabbdc1c5f` / `94c2d14b9e08144f0c932415edb28acf` — IDENTICAL in every
  arm, and MOVED to 342,772 B when the content-script entry was made to call the cooldown. Manifest
  654 / 770 B, `permissions: []`, `dependencies` 10.
- **Verify.** lint 0 · unit **1243** (70 files; `editorView` 27, `editorEnhancer` 28, `editorEngine`
  21, `editorImportFence` 10, `readerMode` 17, `mount` 12, `htmlExport` 13 with the 26-site pin) ·
  browser **1779 pass / 15 skip** (176 files, 88 per engine; per engine `editorPreview` 10,
  `editorDegrade` 9, `editorRender` 10, `editorNestedHost` 12,
  `editorEyeballProxy` 11) · scanner and `--self-test` EXIT 0 (79 shipped files; 7 firing + 10 silent) · golden diff EMPTY · the
  zero-diff list empty. No red on the full run; the two carried wall-clock flakes did not fire. No existing assertion edited: `editorDegrade` gained a block, its
  seven cases stand.
- **Kickoff vs repo, flagged.** (i) The degrade revert, above. (ii) "Route the preview at the OUTER
  host" — done on the feed's render; `renderPreview` itself routed there destroys the shell at build.
  (iii) "The marker leaves the view" needed more inserted than the pane is tall. (iv) "A ```js fence"
  is not highlighted by the reader itself; a ```javascript fence was added as the code row's control.
  (v) Plan §0 D-5 has no one-line "entry draft"; its paragraph was quoted whole. (vi) Console records
  need `--reporter=verbose`, and `pnpm test:browser -- --reporter=…` does not pass the flag through —
  call `pnpm exec vitest` directly.

**M12 task 4.1 DONE, 2026-10-05 — the watch's deferral gate widens to edit mode; leaving edit flushes
(D-8, direction 1 and the clean half of direction 2).** The first WATCHED-document editor test. No
human ruling was taken; two judgment calls and one finding are flagged for one. `decisions.md`'s 012
D-8 entry is the record.
- **What landed, in `src/watch/watchController.ts` and nowhere else in production** (its DECISION 5
  comment). `deferring(target)` — a displayed diff OR the literal `data-mode === 'edit'` — read at
  both sites (`onText`, and `flushPending` for a timer armed before edit entry). The observer's
  filter is `[data-diff, data-mode]`; its callback flushes when NOTHING defers any longer. No import
  added (Clause C). The flush is `renderNow`: `preserveReading`, the signal, the capture.
- **Step 0, re-derived at `07a7d08`.** (a) The two reads were `flushPending` `:494` and `onText`
  `:524`, the filter `:341` — as `tasks.md` cites. (b) The observer now hears every reading ↔ raw
  flip and `mount()`'s own `data-mode` write per render; none releases anything, because the flush
  acts only on text labelled deferred. Edit entered under an open diff, or a diff closed while
  editing: nothing is released until both are gone. (c) and (d) are the two items below.
- **★ THE EXIT-ORDER FINDING (step 0(c)) — an input to 4.2, not worked around.**
  `editorEnhancer.ts:124-125`: `exitEditMode(host)` then `teardownEditorShell(host)`, both
  synchronous, in one click handler. `exitEditMode` (`readerMode.ts:144`) writes `data-mode`;
  `teardownEditorShell` (`editorView.ts:393`) → `endEditorSession` removes `data-edit-dirty`
  (`editorView.ts:276`). The observer's callback is a microtask, after both. **The kickoff's reading
  holds: an attribute read in `watchController.ts` cannot tell a dirty exit from a clean one.** One
  qualification: the observer's RECORDS could (the dirty attribute's removal arrives in the same
  batch with its old value) — reasoned, not measured. § Up next carries the options.
- **★ THE INTERIM STATE (step 0(d)).** Every exit reaches the controller looking clean and flushes.
  Leaving edit with unsaved text discards the buffer (3.2; the guard is 6.1) and then shows the
  on-disk text, including what arrived while editing. 4.1 claims no dirty-exit property.
- **★ Judgment calls, flagged.** (i) *The observer does not read `oldValue`* — the kickoff asked for
  "flush only when `oldValue` is `'edit'`"; the built condition is "the text was deferred and nothing
  defers now", which gives the same behaviour without a second source of truth. (ii) *The "changed
  again" line is not said on an edit-only flush* — it reads "…while the comparison was open". A new
  flag records whether a diff was displayed while the text was held; the line is said only then.
  `tasks.md` says "exactly as a diff exit does"; plan §0 D-8 says a clean exit "simply flushes
  (equivalent to never having edited at all)". The diff-only path is unchanged.
- **The cooldown's three properties, each whole.** No timer is armed or re-armed by the new
  condition (it returns where the diff condition already did) · the injected `now` is untouched ·
  `stop()` and `start()` both still call `cancelPending`, which also clears the new flag.
- **Red-first.** Unit, before the change: 5 of the 10 new tests red.

  | Ablation | Where | Signature |
  |---|---|---|
  | none — unchanged `07a7d08` | unit | 5 red: `expected [ 'v0', 'v1' ] to deeply equal [ 'v0' ]` (defers · timer armed before entry · reverse · drift) and `to have a length of 1 but got 2` (leaving edit) |
  | the `data-mode` read removed | unit | the same 5 |
  | the `data-mode` filter entry removed | unit · browser | unit: 7 red, among them "leaving edit for RAW flushes too" · browser: `waitFor timed out: the deferred text to reach the reading column after the exit` |
  | the line said on every flush | unit | 1 red: the edit-only flush sets the note |
  | the callback asks about edit only | unit | 6 red: 5 EXISTING `data-diff` tests and "with a diff displayed, leaving edit does not flush" |
  | the deferred-label check removed | unit | 1 red: a mode flip releases a cooldown-pending render early |
  | the `data-mode` read removed | browser, both engines | `the external change re-rendered the document under the editor`: `outerRootMutations` 1 (want 0) · `editorNodeConnected` false · `mode` "reading" · `outerColumnIsTheSameNode` false — and `the external change destroyed the editor and the unsaved text in it`: `editorNodeConnected` false · `liveSessionBuffer` null · `typedTextOnScreen` false |

  One new unit test — a reading ↔ raw flip with nothing pending renders nothing — has no ablation
  that reddens it alone.
- **Real engine, Chromium and Firefox (414 × 896; no new chrome), every fixture asserted WATCHED.**
  The watch is hand-driven through the detector seam (the `watchDiffDefer` precedent).
  - *Deferred:* one external change in edit → 0 mutation records on the outer root's child list and
    inside the outer reading column; the editor node is the same connected node; the buffer is the
    file as opened.
  - *Clean exit:* the reading column shows the new text; the mode is `reading`; no "changed again"
    line; the flush captured the document it replaced (one snapshot, the text as opened).
  - *Typed buffer:* 8 typed characters survive the external change — same node, same session, mode
    `edit`, dirty attribute still set — and the next key lands in the same buffer.
  - *Nothing arrived:* a clean exit re-renders nothing (same column node, no line, no snapshot).
  - *Positive control, inside the same tests:* with edit off, the same change through the same seam
    → 1 mutation record on the outer root, and the new text in the column.
- **Bytes, both engines, against 3.3's figures (clean rebuild first: reproduced exactly).** `.output`
  5,814,275 B (Cr) / 5,814,391 B (Fx), +270 each; headroom 1,525,757 / 1,525,641 B. Zips 1,836,372 /
  1,836,430 B (+93). TWO files changed size, residual 0:

  | | Content script | App chunk |
  |---|---|---|
  | 3.3 baseline | 342,384 B | 517,904 B |
  | 4.1 | 342,520 B (+136) | 518,038 B (+134) |
  | the deferral-read glue (the `data-mode` read) | 38 | 38 |
  | the observer glue (the filter entry) | 12 | 12 |
  | the held-under-a-diff flag (the line's condition) | 35 | 37 |
  | the two helpers those hang on (`deferring`, `markDeferred`) | 51 | 47 |
  | residual | 0 | 0 |

  Each of the first three is the full build minus the build with that piece removed; the three pairs
  and the triple are additive to the byte (50 · 73 · 47 · 85 in the content script; 50 · 75 · 49 · 87
  in the app chunk), so the helpers' figure is a measured remainder, not a fit. **With all four
  removed, every built file is name- and md5-identical to the baseline on both engines** — content
  script `129deda5156522a75ac41eaabbdc1c5f` (Cr) / `94c2d14b9e08144f0c932415edb28acf` (Fx). New md5
  `e051533e430646c410dfa7c5a200da2d` / `a791ceae1241502dede01f25738b3d33`. The three CodeMirror
  chunks are unchanged (54,680 + 209,493 + 342,426 B) and no editor module is in the content script:
  `editorImportFence` green, and the content script's whole delta is accounted for above. Manifest
  654 / 770 B, `permissions: []`, `dependencies` 10.
- **Verify.** lint 0 · unit **1253** (70 files; `watchController` 36 — 26 existing, unedited, + 10 —
  `editorView` 27, `editorEnhancer` 28, `editorEngine` 21, `readerMode` 17, `mount` 12; the two fences
  over what `watchController.ts` may import: `diffEngine` 15 (the 5.1 fence, Clause C) and
  `editorImportFence` 10) · browser **1785 pass / 15 skip** (178 files, 89 per engine; per engine
  `editorWatch` 3, `watchDiffDefer` 2, `watchControl` 36, `watchRemount` 12, `diffChrome` 39,
  `diffView` 10, `editorPreview` 10, `editorDegrade` 9, `editorRender` 10, `editorNestedHost` 12,
  `editorEyeballProxy` 11) · scanner and `--self-test` EXIT 0 (79 shipped files; 7 firing + 10
  silent) · golden diff EMPTY · the zero-diff list empty. The full browser run and the first full
  unit run had no red. **One red, classified:** a second, verbose unit run started as the browser
  run's engines were shutting down timed out two `diagramEnhancer` tests (`Test timed out in
  5000ms`; that run took 44 s against 10 s). Green in isolation (58 / 58) and on the full rerun
  (1253). A wall-clock timeout on a loaded machine — NOT one of the two carried flakes, and in a
  file this task does not touch. No existing assertion edited: `watchController.test.ts` is
  +243 / −0, and `watchDiffDefer.browser.test.ts` is zero-diff.
- **Kickoff vs repo, flagged.** (i) `oldValue`, above. (ii) The "changed again" line, above. (iii)
  "The observer cannot tell a dirty exit from a clean one" — true of a read, not of its records. (iv)
  The decomposition has four parts, not two: the kickoff's "read glue vs observer glue" leaves 86 B
  (content script) unaccounted until the flag and the helpers are ablated too. (v) The positive
  control is inside the deferral tests (the standing invariant's "in the same test"), after the exit,
  rather than a separate edit-off test: a watch render through the default render removes the edit
  control, so it cannot come first. (vi) `tasks.md` names the diff-deferral browser file
  `watchDiffDefer` — that is its real name. (vii) Plan §0 D-8's draft says a diff's exit flush is
  "silent"; it has not been since 006 D-11. Quoted verbatim, annotated.

## Up next

**FIRST — M12 task 4.2** (the exit asymmetry: a DIRTY exit does not auto-flush; the deferred change is
raised as D-7's early hint — D-8, the unsafe half of direction 2; F-4), fresh session, test-first, one
commit. Files, per `tasks.md`: `src/watch/watchController.ts` · `watchController.test.ts` ·
`tests/browser/editorWatch.browser.test.ts`.
**★ 4.2's NAMED INPUT — the exit-order finding (4.1; `decisions.md`'s 012 D-8 entry). Its kickoff must
rule on this BEFORE drafting the work; do not guess a workaround in `watchController.ts`.**
`editorEnhancer.ts:124-125` leaves edit as `exitEditMode` then `teardownEditorShell`, both synchronous;
the teardown removes `data-edit-dirty` (`editorView.ts:276`). The watch's observer runs as a microtask,
after both — so 4.2's own line, "with the dirty attribute present, leaving edit does NOT call
`renderNow`", cannot be built as an attribute read. The options, none chosen:
- **(a) the observer's records** — add `data-edit-dirty` to the filter with `attributeOldValue`; its
  removal (old value `"true"`) arrives in the same batch as the mode change. Stays inside 4.2's file
  list. Reasoned from the DOM standard, NOT measured — 4.2 measures it on both engines first. It also
  makes the observer hear every dirty ↔ clean flip while typing.
- **(b) the exit order changes**, or **(c) the editor leaves a literal behind** before its teardown
  clears the attribute. Both touch `editorEnhancer.ts` / `editorView.ts` — outside 4.2's file list, so
  a necessary-ripple enumeration or a human ruling.
- **Under any of them:** until 6.1, the exit has already DISCARDED the buffer when the watch hears of
  it. Withholding the flush protects no typed text at 4.2; and "once the session is no longer dirty
  (saved, or discarded through 6.1's guard) the flush proceeds" has no trigger yet — neither save
  (5.3) nor the guard (6.1) exists. What releases a withheld flush at 4.2 needs stating.
- **Also for that ruling:** whether a flush after editing should SAY anything. 4.1 says nothing on an
  edit-only flush (the "changed again" line names the comparison); 4.2's hint is the natural home.
**Byte snapshot for its kickoff (4.1's measured figures):** `.output` 5,814,275 B (Cr) / 5,814,391 B (Fx)
against ≤ 7 MiB (7,340,032 B) — headroom 1,525,757 / 1,525,641 B · zip 1,836,372 / 1,836,430 B · content
script 342,520 B both engines, md5 `e051533e430646c410dfa7c5a200da2d` (Cr) /
`a791ceae1241502dede01f25738b3d33` (Fx) · the app chunk 518,038 B, the three CodeMirror lazy chunks
54,680 + 209,493 + 342,426 B · manifest 654 / 770 B, `permissions: []` · `dependencies` 10 · lint 0 ·
unit 1253 · browser 1785 / 15 skipped · golden empty.
`tasks.md`'s standing-invariants block still prints the content script as 340,492 B (sealed text) — the
figure above supersedes it. `watchController.ts` is on the content-script graph: 4.2 moves that figure
again, by its own glue only, decomposed.
**Carried inputs to 4.2, from 4.1:**
- **The interim state 4.2 changes.** Every exit from edit flushes. A dirty exit discards the buffer
  (3.2) and then shows the on-disk text. No test asserts it, so 4.2 edits no assertion to change it.
- **`editorWatch.browser.test.ts`'s rig** is hand-driven with the default render, so a flush there does
  not re-install the edit control (production's `renderWithEnhancements` does). A 4.2 test that needs
  the control AFTER a watch render must build its controller with a render that calls `enhanceEditor`.
- **Its positive control fires a capture** (fire-and-forget) and waits it out; a test that ends with a
  watch render and does not wait rejects into the next test when the store's connection closes.
- **A heredoc whose body holds an apostrophe fails the whole command** (twice this session) — write
  the file, then run it.
- **The full browser suite does not finish inside one 10-minute tool call** on this machine — run it
  in the background, or in batches.
- **Console records** in browser tests print only under `pnpm exec vitest run --project browser
  --reporter=verbose`; `pnpm test:browser -- --reporter=verbose` does not pass the flag through.
**Open, for the human, before 7.1:** P-1 (the preview's enhancers — § Carried items). **For 6.2 and the
§8-2 ruling:** P-2, P-3. Still open from 3.2: E-7 (Ctrl/Cmd+S in the editor, a ruling owed before 5.3),
E-1…E-6 and E-8 (the 7.1 walk), the failed-chunk "try again" finding.
**The editor defaults are RULED ship-as-is** (2026-10-04, `decisions.md`'s M12 TASK 1.1 and M12 TASK 1.1
EXTENDED entries); 7.1's walk carries one item for the editing feel of those defaults.
**Carried touchpoints — the task-level human gates:**
- **5.1 — the `PERMISSIONS.md` ledger-wording sign-off**, before the first write commit (5.3).
- **5.5 — the conflict/overwrite policy**, from a walk on 5.3's safe floor (loaded extension, human-only).
- **7.1 — the milestone-close walk** (live picker + real disk write, Firefox everything, WIDE viewport).
- Also: the informal eyeball owed at 3.2, DEFERRED to 7.1 (2026-10-05); 6.2's numbers → the §8-2 debounce ruling;
  6.3 STOPS and surfaces a material nested-host cost. (2.2's stop-and-flag did not fire: the post-commit
  wiring needed no guard.)

*Superseded, kept for provenance:* gate 3 — the human's review of `specs/012-editor-mode/tasks.md`
(drafted 2026-10-04). The paragraph below is the brief that draft was written to.

**`tasks.md` on `specs/012-editor-mode/plan.md`** — the next artifact, a fresh session, and the final
gate (gate 3) before implementation: decompose the plan's seven groups into tasks, re-deriving every
`file:line` against its own HEAD. No implementation code before `tasks.md` is approved (WORKFLOW.md
§5.3). **Carried into it:**
- **The D-B(iii) ledger-wording sign-off is still owed at group 5** — the save task drafts the final
  `PERMISSIONS.md` sentence and routes it to the human before it lands; mandatory to land, not to word
  unilaterally. Gate 2 did not take it.
- **Group 3's nested-host tests run on an UNWATCHED document** — group 3's live preview lands before
  group 4 closes the watch/edit collision, so no watch may fire mid-test. A gate-2 residual for
  `tasks.md` to resolve; the plan body states the hazard only for group 5's tests (§6).
- **D-4's build-then-measure consequence** — the nested host is built at group 2 and its cost measured
  at group 6. If that cost is material it is a finding to surface to the human, not a number to file,
  and overturning the nested host by then is a rework of groups 2–5. Accepted on the record.

M11 closed with no forced follow-on
task of its own — every carried item from its close is either resolved, a deferred-post-M11 standing
item, or a human-drafted-not-placed retro action (see § Carried items below).

### Carried items
*Banked deliberately, each with a recorded home. Do NOT guess at any of them; every one is either
measurement-driven or explicitly deferred.*

- **NEW 2026-10-05 — TASK 3.3's FINDINGS (P-1…P-3). None is fixed and none was ruled; the numbers are in
  the 3.3 record above § Up next and in `decisions.md`'s 012 D-5 entry. Both engines agree unless
  stated.**
  - **P-1 · the reader's enhancers do not run in the live preview. Home: HUMAN RULING BEFORE 7.1.** A
    mermaid fence, `$x^2$` and a code fence render in the document (figure + SVG, `<math>`,
    highlighted) and stay raw source in the preview (the fence's `<pre><code>`, the literal `$x^2$`,
    an un-highlighted block). The enhancers are wired at the two app-page call sites on the OUTER host
    only; `renderPreview` calls `mount()` and nothing else. The question is preview fidelity against
    the reader: accept a plain preview, or wire the enhancers to the nested host (a new task — it
    touches the two call sites or `editorView.ts`, and re-runs lazy engines on every preview render).
    Measured by `editorPreview.browser.test.ts`'s REPORTED test; nothing is pinned.
  - **P-2 · the first key after a pause pays one whole preview render inside its own keystroke. Home:
    6.2 → the §8-2 ruling.** The cooldown's first render is immediate, which here means synchronous:
    217.7 ms (Chromium) / 205.0 ms (Firefox) on a 212,682-byte document, in the harness. Keys that
    arrive inside the cooldown are unaffected (2.3 / 4.0 ms). On a small document every key renders.
  - **P-3 · under a driven burst, 512 keys cost 4 feed renders on Chromium and 193 on Firefox. Home:
    6.2.** Chromium runs queued input ahead of the cooldown's timer. Human typing speed was not
    measured, and the scroll restore drifted 1.5 px over Firefox's 193 renders (0.2 px over
    Chromium's 4).
- **NEW 2026-10-05 — THE 3.2 EYEBALL PROXIES' FINDINGS (E-1…E-8). Home for all eight: the 7.1 walk,
  unless the human routes one elsewhere sooner. None is fixed; the numbers are in the record above
  § Up next and in `decisions.md`'s "informal eyeball DEFERRED" entry. Both engines agree on each.**
  - **E-1 · the collapsed TOC handle covers the split pane's top-right corner — 103×26 px**, in edit,
    rail collapsed, at 414×896 and 1400×900. `EDITOR_CSS` reserves the rail only while it is open.
    PINNED in `editorEyeballProxy.browser.test.ts` (`KNOWN_PANE_UNDER_HANDLE`) — the fix deletes it.
  - **E-2 · dark only, text unreadable:** selected text 1.16:1 (1.14 unfocused); the current search
    match 1.52:1; unselected autocomplete options 1.09:1. Light: 12.95 / 9.86 / 16.37.
  - **E-3 · dark only, highlight colours:** markup marks (`#`, `-`, the table pipe, `~~`, `~`, `^`)
    1.69:1; the task marker 1.24:1; the emoji shortcode 2.15:1. CodeMirror's default palette is
    light-page.
  - **E-4 · both themes, gutter numbers:** 2.38:1 light / 3.26:1 dark (`--faint`, 3.2's own rule); the
    active line's number 2.36 / 4.34.
  - **E-5 · non-text pairs under 3:1:** active-line band 1.02 / 2.2; gutter rule 1.11 / 1.13; search
    field border 1.67 and fill 1.09 (both themes); light only — selection 1.27, search panel 1.04,
    tooltip 1.04 (border 1.69) against the pane. Several are arguably decorative; the bar was applied
    as stated.
  - **E-6 · at 414 px with the rail OPEN the split pane is 100 px wide** (source pane 98 px). No
    overlap — reported, not asserted.
  - **E-7 · Ctrl/Cmd+S in the editor runs the export shortcut** — downloads the ON-DISK document as
    HTML (not the buffer); with no export format it is swallowed. A ruling is owed before 5.3.
  - **E-8 · R1 as drawn:** `H~2~O` / `x^2^` colour only their marks; `:smile:` is coloured `#aa1111`.
    Measured, not judged.
- **✅ RESOLVED AT THE §8-1(b) FIX, 2026-09-10 (`63aedb4`) — NEW AT TASK 6.2-R, 2026-09-09 — GATE-2's
  §8-1(b) RULING WAS FALSE FOR A SUCCESSFULLY-RENDERED INLINE FORMULA (THE COMMON CASE); NO WAY TO
  RECOVER ITS LATEX SOURCE EXISTED THEN.** The 8.1-R human walk ruled this fix-before-close, not
  ship-with-a-gap (`decisions.md`'s 2026-09-10 "M11 8.1-R / 1.2-R" entry). Fixed via a
  `data-math-source` attribute set on the already-mounted `<code>` element (mechanism 1 of two
  measured candidates — the other, a visually-hidden source node, regressed whole-sentence text
  copy) — read back through a new document-level "Copy formulas as LaTeX" action
  (`decisions.md`'s 2026-09-10 "M11 §8-1(b) FIX" entry). `sanitize.ts` has a ZERO-line diff; no
  per-formula inline chrome was added (row 11 stays negative). Text-selection of a settled inline
  formula still copies the rendered glyph, never the source — this is now the PERMANENT, by-design
  shape, not a residual defect. Original entry, preserved for the record: *"See § Now above for the
  full measurement (real engine, both browsers: selecting a settled inline formula and copying
  yields the rendered glyph string, never the retained `$…$` source — `annotate: false` means no
  fallback annotation either). The claim genuinely holds only for a FAILED formula and the
  content-script surface, both proven in `tests/browser/mathActions.browser.test.ts`. HOME: 8.1-R's
  milestone-close walk, or a fresh §8-1 gate reopening — whichever lands first. Not fixable inside a
  task diff: the two live options are new per-formula inline chrome (§8-1(b) explicitly rules this
  out) or a D-7-R architecture change to what `markMathInlineRendered` retains on success (a gate
  decision). Human-reviewed 2026-09-09 (mid-task): ship the honest verification, route the gap here,
  build nothing new."*
- **✅ RESOLVED AT TASK 6.2-R, 2026-09-09 — A HARNESS-SHARED-STATE TEST FLAKE, FOUND AND FIXED.**
  `mathActions.browser.test.ts`'s own 6.1-R manifest re-proof test started failing (real pointer-
  event interception from `mount()`'s own fixed-position "Watching isn't available" note) once more
  tests ran before it in the same file — a pre-existing fragility in `appPageReader`'s bare-pane
  harness (present since 6.1-R, invisible until this task's added test volume shifted things),
  not a defect in this task's own logic. Fixed by switching that one test's own button activation
  to a plain synthetic `.click()` (its claim is post-copy manifest state, not click realism, which
  is proven elsewhere). See § Now above for the full geometry trace. No further action needed.
- **STANDING AT M11 CLOSE — `runCopyMathMathml` IS DELIBERATELY NOT WIRED INTO
  `lastExportFormat`/Ctrl+S's "repeat last export," AND THE SAME CALL WAS EXTENDED TO
  `copy-math-latex` AT THE §8-1(b) FIX.** A stated scope decision (outside 6.2-R's Files line, no
  Verify clause asked for it), not an oversight — `decisions.md`'s 2026-09-10 "M11 §8-1(b) FIX"
  entry confirms the identical call for the new copy-as-LaTeX action, "for the identical reason."
  Not a gap; a deliberate, now-doubly-confirmed scope boundary. **HOME:** if a future task/human
  wants "repeat the MathML/LaTeX copy" on Ctrl+S, it needs its own kickoff — `settings.ts`'s
  `lastExportFormat` union and `appShell.ts`'s `triggerLastExport` switch both need extending.
- **(post-M11 follow-up) Upstream the temml lone-surrogate fix to Temml + retire
  `patches/temml.patch` once merged.** The local patch is version-pinned (a temml bump needs a
  conscious patch-refresh — the regression guard in `mathBlock.browser.test.ts` catches a silent
  break, per the 2026-09-09 TEMML-BUNDLING DEFECT — FIXED entry).
- **(post-M11 follow-up) Close the SBOM generator's patched-dependency blind spot.**
  `scripts/generate-sbom.ts` has no patched-dependency representation; the patch record lives only
  in `pnpm-lock.yaml`'s `patch_hash` + `patches/` (named already in the temml-patch commit's own
  message).
- **✅ RESOLVED, 2026-09-10 (RULE-9 HARDENING, TEST-FILES-ONLY, standalone session, HEAD `13795f2`)
  — THE MILESTONE-CLOSE PREREQUISITE FOR 8.1-R: THE FULL BROWSER SUITE NOW GOES GREEN IN ONE PASS,
  REPEATABLY.** RED first, then fixed, per file:
  - **`diagramActions.browser.test.ts` (confirmed, not hypothetical — this WAS the leak's own
    source, previously routed around defensively by `tableCopy.browser.test.ts`/
    `mathActions.browser.test.ts`, never fixed at the root).** Its §7.3 `afterEach` called
    `Browser.resetPermissions` with NO `browserContextId`, which clears the DEFAULT context and
    leaves the grant this file made (WITH an id) outlived. Fixed at the source: the grant's
    `browserContextId` is now captured and reused at reset, plus an `afterEach` assertion the
    consent did not survive — the exact shape `tableCopy.browser.test.ts` already had to duct-tape
    around. This removes the coupling for every future file, not just the two that happened to
    defend themselves already.
  - **`mathNetwork.browser.test.ts` — investigated, NOT fixed (no red found).** The kickoff's own
    hypothesis (an idempotent `registerMathFont()` flag surviving from an earlier math test file,
    making the "guaranteed-cold first render" claim false) did not reproduce: run standalone, in a
    5-file math-only combination, and inside 4 full-suite passes, its font-specific non-vacuity
    assertion held every time. Left untouched per "don't fix blind" — a real fix here would need a
    reproduced red first.
  - **`tocScroll.browser.test.ts` / `watchAnchor.browser.test.ts` / `watchControl.browser.test.ts`
    — a THIRD class, found fresh this session, not named in the kickoff.** Bisected from a real
    failure on a 4th consecutive full-suite pass down to a 2-file repro (`tocScroll` + any unrelated
    second file), confirmed non-deterministic and confirmed clean in isolation every time (the rule-9
    signature). Root mechanism: `watchAnchor.browser.test.ts`'s and `watchControl.browser.test.ts`'s
    own header comments already document a measured 3× layout swing on first mount
    (scrollHeight 81798px → 26069px) before the reader truly settles; each file's own
    "wait until scrollable/settled" helper required only 3 consecutive stable reads across 60ms
    before trusting the geometry, which was long enough in isolation but not always under the
    extra CPU/layout contention of a second browser test file sharing the run. Fixed by widening
    every affected helper (`waitForScrollable` ×2, `waitForSettled`, and the three `settle`/
    `stableActiveIndex` scroll-completion pollers) from 3-consecutive-stable to 8-consecutive-stable,
    with a proportionally longer timeout budget. No assertion's claim changed — only how patiently
    each waits for the geometry it measures to actually be final.
  - **Acceptance:** `pnpm test:browser` green in ONE pass, 164/164 files, 1645/1645 passed (15
    pre-existing skips), across **4 consecutive full runs** after the fix (the exact combination that
    reproduced red pre-fix — `tocNetwork`+`tocPersist`+`tocScroll`+`watchAnchor`+`watchControl`, and
    `tocScroll`+`wipe` — also reran clean 3/3 each). No test's assertion intent was weakened; every
    fix narrows or removes an isolation gap (a consent-reset id, a settle-poll's patience), never a
    threshold the test's own claim depends on.
  - **★ A DIVERGENCE, FLAGGED RATHER THAN SILENTLY ABSORBED: two UNIT-project tests
    (`src/render/pipeline.perf.test.ts`'s parse+sanitize budget, `tests/golden/golden.test.ts`'s
    huge-document case) intermittently failed on wall-clock/timeout grounds during this session's
    `pnpm test` runs, ONLY when run as part of the full 66-file unit suite, always passing instantly
    run alone.** Confirmed PRE-EXISTING and unrelated to this session's diff: reproduced identically
    on bare, unmodified HEAD via `git stash` (both failed there too, byte-for-byte the same
    assertions). Out of this task's TEST-FILES-ONLY-under-`tests/browser/` fence (these are unit
    tests, not browser tests, and not touched by this session's diff) — not fixed here, carried as
    its own item below.
- **STANDING AT M11 CLOSE (8.3-R, 2026-09-11), DEFERRED-POST-M11, NOT SMOOTHED INTO "ALL GREEN" — TWO
  UNIT-SUITE WALL-CLOCK BUDGETS ARE CONCURRENCY-SENSITIVE: `pipeline.perf.test.ts`'s parse+sanitize
  budget and `golden.test.ts`'s huge-document case.** Both intermittently red inside a full `pnpm
  test` run (worker-thread contention from the other ~64 files sharing this machine's cores), both
  green in <3s run alone, both confirmed to fail IDENTICALLY on bare unmodified HEAD (`git stash` +
  `pnpm test`) — a pre-existing property of this dev machine's core count against these two tests'
  fixed thresholds, not a regression from anything in this session. **Re-confirmed at 8.3-R's own
  close, HEAD `6eff5dc` (no diff to stash — reproduced directly): full `pnpm test` failed exactly
  these two (`129.56ms vs 100ms budget`; a 5000ms timeout), both passed in <3s run in isolation.**
  M11's own browser suite goes green in ONE pass, repeatably (rule-9 hardening) — this is a UNIT-suite-
  only property, and the milestone's own "suite green" close claim carries this caveat explicitly,
  not rounded into "all green." **HOME:** whoever next touches either file — a defensible fix is a
  per-machine-relative budget or an explicit CPU-count-aware skip rather than a bigger constant.
- **✅ RESOLVED — the 2026-09-09 harness eyeball's own open question (whether both engines clear
  RULING 2's bar) is answered: the FORMAL 8.1-R walk ruled PROCEED, 2026-09-10** (`decisions.md`'s
  "M11 8.1-R / 1.2-R" entry) — after the walk's own first pass caught the radical-render defect and
  the re-walk confirmed the fix. Original record, kept: *"The 2026-09-09 harness eyeball: both
  engines read acceptable against RULING 2's bar; fidelity risk substantially de-risked; the FORMAL
  1.2-R walk (8.1-R) still owns the PROCEED/CLOSE-M11 ruling — this did NOT tick 1.2-R or resolve
  the fork."*

- **✅ RESOLVED — THE URL-LOADED FONT LEVER WAS TAKEN AT 4.2-R, NOT LEFT AS A SEPARATE RESERVE.**
  Confirmed by reading the shipped code: `src/theme/mathFont.ts` imports
  `'../../assets/fonts/stix-two-math-subset.woff2'` with no `?inline` suffix — Vite emits it as its
  own asset file (confirmed in `.output/chrome-mv3/assets/`), not a base64 `data:` URI. The module's
  own header states the lever was "taken here given 1.1-R's own '~33 KiB headroom, on a knife edge'
  finding." **This means the current ~44.4/44.3 KiB `.output` headroom ALREADY reflects the ~28.2
  KiB recovery** — it is spent margin, not an available-if-needed reserve; had the base64 form
  shipped instead, headroom would be roughly 16 KiB tighter. Original entry, preserved: *"NEW AT THE
  2026-09-07 BYTE-FORECAST SPIKE — THE URL-LOADED FONT LEVER, REAL-MEASURED (~28.2 KiB recovery, no
  WAR cost, no dependency change). HOME: whoever lands D-13's font wiring for real at task 4.2-R —
  take the lever there (a normal asset import instead of `?inline`) rather than shipping the base64
  form and revisiting later, since the URL form is strictly better on every measured axis and the
  milestone's own headroom stays thin."*

- **✅ RESOLVED AT THE 2026-09-07 CODEDETECT-DRIFT MAINTENANCE (standalone, HEAD `defb797`) — NEW AT
  M11 1.1, PRE-EXISTING, NOT CAUSED BY THIS TASK — `codeDetect.test.ts`'s CORPUS-DRIFT RECURS.**
  `pnpm test` at 1.1's own close: 1053/1056 passed, 1 file / 3 tests red in
  `src/render/codeDetect.test.ts` (the "reproduces the corpus split" / "scores every corpus item"
  cases) — its live repo-wide unlabeled-fence scan now picks up an unlabeled fence at
  `specs/011-math-rendering/plan.md:503` (an M11 gate-2 planning doc, landed before this session) that
  its hardcoded `CODE_ITEMS`/count baseline predates. **Confirmed pre-existing, not introduced by 1.1**:
  `git stash` + `pnpm test` at bare HEAD `a210c37` reproduces the identical 3 failures; `git stash pop`
  restored. This is the SAME named pattern as the 11.2 retro's "codeDetect corpus-drift" facet (a
  fixture that scans real repo prose drifts whenever new prose lands) — a recurrence, not a new class of
  defect. Out of 1.1's own Files-list fence (package.json/pnpm-lock.yaml only); not fixed here. **HOME:**
  whichever session next touches `codeDetect.test.ts` or re-calibrates its corpus baseline — likely
  whoever closes out or reopens M11, since the drift's source is M11's own planning docs. **Resolved**:
  the intent was confirmed genuine (the live repo-wide `.md` scan, specs/ included, is the established
  8.3/8.4/M10 methodology, not a scoping bug); by 2.1-R the same doc had grown one more fence
  (`plan.md:790`, since renumbered as the doc grew — the line shifted, the fence didn't move files) plus
  a sibling at `:816`, for n=26→28. `plan.md:790` (the `parse.ts` wiring snippet — real `md.use(tex,
  …)` / `md.renderer.rules[…] = …` calls) was independently confirmed CODE and added to `CODE_ITEMS`;
  `:816` (the enhancer's own annotated-pseudocode block) was confirmed non-code and left out. All three
  assertions re-pinned to the current true state (n=28, 8/20 split, 28/28 scored) — exact-and-current
  again, not a bare count.
- **✅ RESOLVED — PRICED, NOT JUST FLAGGED: `tasks.md`'s TASKS REVISIT block REWROTE the content-script
  byte invariant (INPUT B) around exactly this falsification before 3.2-R landed, and 3.2-R landed the
  real tax it names (+3,959 B, both graphs, the "THE figure INPUT B's rewritten invariant cites"),
  confirmed unmoved at every task since (340,492 B both engines at M11 close).** The behavioral
  cousin (a `$x$` span rendering as inert monospace `<code>` on the content-script `file://` reader)
  was priced as its own named cost at 3.1-R's own read-only audit and read acceptable, not jarring,
  at the 8.1-R walk — no spec §3.2 amendment was needed. Original entry, preserved: *"NEW AT THIS
  REVISIT-RECORD AMENDMENT, 2026-09-06 — A FALSIFIED MILESTONE INVARIANT: `@mdit/plugin-tex`
  PUTS MATH ON THE CONTENT-SCRIPT MODULE GRAPH, WHICH `tasks.md`'s OWN STANDING INVARIANTS SAY NEVER
  HAPPENS.** 1.1's own arm (a) measured `@mdit/plugin-tex` — D-1's tokenizer, wired into `parse.ts`'s
  SHARED `md` instance — at **+3,957 B on EACH of the content-script and app-page graphs** (real,
  unconditional on every document, math or not). `tasks.md`'s standing-invariants block states flatly:
  "Content-script bytes — byte-identical for the WHOLE MILESTONE, structural, not contingent (D-3/RULING
  2). Math never goes through `mount()` and never enters the content-script module graph." **That
  invariant is FALSIFIED the moment task 3.2 lands the parse rule** — RULING 2 held for 1.1's own COMMITTED
  state only because `parse.ts` was never actually wired with the tokenizer in the shipped diff (1.1's own
  probe was scratch, reverted); the moment `parse.ts` genuinely gains `md.use(tex, ...)`,
  `content-scripts/peekover.js` moves +3,957 B — a SECOND structural content-script mover the plan never
  anticipated (D-11's contingent MathJax settings field was named as the ONLY one). **A behavioral cousin,
  contingent on 3.2 landing as specified:** D-1's rule emits its passthrough markers (`<code
  class="peekover-math-inline">`) from that SAME shared `parse.ts`, but `enhanceMath` is app-page-only
  (D-3) — so a `$x$` span in a `file://`-opened document would render wrapped in monospace `<code>` styling
  at rest, never enhanced, a visible artifact of D-1's rule leaking onto the content-script surface that
  departs from spec §3.2's own framing ("no math affordance and no explanatory note ships on the
  content-script reader in M11") — not an interactive affordance, but not plain literal text either.
  **Neither is a defect IN 1.1** — M11 is suspended, and task 3.2 never landed — **both are COSTS a reopen
  must price**, verified against the real tree at reopen time, not assumed from this note. **HOME:**
  whoever reopens M11 — likely task 3.2's own kickoff, since that is where the invariant's falsification
  actually lands.
- **MITIGATED, NOT ELIMINATED — STANDING AT M11 CLOSE. THE `@mdit/plugin-tex` / `markdown-it`
  PEER-DEPENDENCY MISMATCH WAS NEVER BUMPED, BUT TWO INDEPENDENT ZERO-MISCLASSIFICATION GRAMMAR
  AUDITS CLOSED THE PRACTICAL CORRECTNESS RISK.** 1.1-R's own 51-formula corpus (price `$5`/`$10`,
  escaped `\$5`, code-span exclusion, table cells, unbalanced `$`) and 3.1-R's independent re-audit
  against real ruler inspection found ZERO misclassifications on `markdown-it@14.3.0` despite the
  plugin's own `^15.0.0` peer-dep declaration. The version mismatch itself is still unbumped — pnpm
  still warns, does not block — so this is empirically mitigated, not formally closed. **HOME:**
  unchanged — a future `markdown-it` major-version bump, if ever forced by something else, should
  re-run this same grammar corpus rather than assume it still holds. Original entry, preserved: *"NEW
  AT THIS REVISIT-RECORD AMENDMENT, 2026-09-06 — THE `@mdit/plugin-tex` / `markdown-it`
  PEER-DEPENDENCY MISMATCH IS A LATENT CORRECTNESS RISK, NOT JUST A VERSION WARNING."* 1.1 flagged,
  informationally, that `@mdit/plugin-tex@1.1.0` declares a peer dependency on `markdown-it@^15.0.0`
  against this repo's installed `14.3.0`, and that the plugin "functions in the probe" — but that probe
  exercised only RULE REGISTRATION (`md.renderer.rules['math_inline']`/`['math_block']` present and
  overridable after supplying a throwaway stub), never the TOKENIZER-CORRECTNESS edge cases D-1 chose a
  maintained plugin FOR in the first place: `$5`-style false positives, code-span exclusion of a backtick
  `$HOME`, escaping. **A plugin authored against `markdown-it` 15's own internals, running on 14.3.0, is a
  latent correctness risk on exactly those cases** — task 3.2's own Verify line already plans to test them,
  so this is not an untested gap, but a genuine possibility that 3.2 surfaces a real internals mismatch, and
  closing it may force a `markdown-it` major-version bump whose OWN cross-stack ripple (parse rules,
  plugins, golden fixtures) is unassessed by anything measured so far. **HOME:** the M11 reopen /
  spec-revisit, to price alongside the byte problem before deciding whether task 3.2 proceeds on 14.3.0 or
  the bump is folded into the reopen's own scope.
- **✅ SETTLED AT 6.3 (M8's records reconcile) — THE PLACEMENT-TENSION NAMED AT 6.1: CARRIED-ITEMS-ONLY,
  NO NEW `tasks.md` CHECKBOX.** The item below is kept as written, because it is the record of the
  tension and why it was routed to 6.3. **The call:** M8's two 6.1 findings (the badge lane, the
  unstyled toolbar controls) stay exactly where 6.1 filed them — in this section — and get no numbered
  task-stub in the gate-sealed `tasks.md`. **This follows 007's 9.1→9.3 precedent exactly, not by
  analogy:** 9.1's dark-mode and gantt-axis findings landed in § Carried items, not as new 007
  checkboxes, and 9.3 (M7's own reconcile) confirmed that was the right read of 9.1's own "a task added
  below this line" wording — M7 never once added a task that way. **Three instances deep now** (D-10 (b)
  new-work-at-a-gate, 9.1's two findings, this one), the convention is written down rather than
  re-decided each time: a gate finding is filed in `progress.md` § Carried items; the sealed tasks file
  is never re-opened to hold it. Both findings await the same future styling-pass session named at 6.1.
- **★ NEW AT 6.3 (M8's records reconcile), FILED RATHER THAN LEFT UNFILED — `runReader.ts:140`'s STALE
  COMMENT (found at task 4.1, never routed to this section).** The parenthetical still describes
  `contentWatch`'s controller as *"passes no `render` and gets bare `mount`"* — true of the render call,
  not of the argument the comment is illustrating (the badge re-reads the registry every render
  regardless). 4.1 named it *"outside this task's file list... belongs to whichever task next touches
  that file"* and moved on; no later M8 task touched `runReader.ts` again, so it was never picked up and
  never reached this section either. **Comment-only; the code is correct.** **HOME:** whichever session
  next touches `runReader.ts` for any reason.
- **★ NEW AT 6.3 (M8's records reconcile), FILED RATHER THAN LEFT UNFILED — A CROSS-FILE CLIPBOARD
  CONSENT LEAK (found at task 3.8, never routed to this section).** `diagramActions.browser.test.ts`
  grants the Chromium clipboard consent WITH a `browserContextId` and resets it WITHOUT one;
  `Browser.resetPermissions` with no id clears the DEFAULT context only, so the grant outlives its own
  file and arrives in the shared window already `granted`. It surfaced once, in `tableCopy.browser.test.ts`'s
  OFF arm (`expected 'granted' to be 'prompt'`) — the pin doing its job — and 3.8 gave that file its own
  floor (a per-case reset by id, with an `afterEach` assertion the consent did not survive) rather than
  fix the sibling, which sits outside 3.8's Files-list fence. **The sibling's cleanup is still id-less**,
  and any future file that pins `prompt` after `diagramActions.browser.test.ts` runs will meet the same
  leak. **HOME:** whoever next adds a browser test that asserts a `prompt`/`denied` clipboard state,
  fixing `diagramActions.browser.test.ts`'s `resetPermissions` call to pass its `browserContextId`.
  **★ RESOLVED-BY-RETRO, 2026-09-06 (M10 11.3, final pass) — this item is one of the FOUR facets
  (alongside the enhancer-timing flake, the shared-document cross-file listener leak, and the codeDetect
  corpus-drift cited at both) the `/retro` interview (11.2, `retro.md` 2026-09-06) consolidated into ONE
  named observation with ONE drafted standing rule** (*"the browser test suite runs files serially
  sharing one real per-engine `document`/`window`; any assertion about shared state … must be delta-based
  or specific-content-matched … never asserted as an absolute count or non-empty check"*) — **drafted,
  human to place/commit per C2** (WORKFLOW.md — agent drafts, human owns) — **PLACED in `AGENTS.md`,
  2026-09-06** (the M10→M11 seam edit); this bullet's own guidance stays the concrete worked instance
  alongside the now-live rule.
- **★ FILED AT THE POST-M8 FRESHNESS SWEEP (2026-08-13) — THE D-6…D-12 `decisions.md` LEDGER GAP (found
  and named at 6.3's own D-VALUE AUDIT, never routed to this section).** `plan.md` §0 pre-writes verbatim
  `decisions.md` entry text for D-6 through D-12, each meant to land with its implementing commit — **none
  of the seven ever did.** The only place any of them appears in `decisions.md` is the pre-implementation
  2026-08-03 M8 GATE 2 entry, which predates every group-3/4/5 implementing commit by weeks and so cannot
  by construction be "landing with the commit that implements it." 6.3's own D-VALUE AUDIT named this gap
  in full but — unlike the two items immediately above, found the same session — never promoted it into
  this section; this entry closes that omission. Filing the missing text is a decision about ledger
  hygiene, not a records reconcile, so it is **not done here either**. **HOME:** whoever next touches
  `decisions.md` can land D-6…D-12's pre-written text (`plan.md` §0) with a real commit, the way the
  convention asks.

- **✅ FIXED (commit `fix(diagrams): dark-mode diagram text legibility via themed engine config`) —
  DARK-MODE DIAGRAM TEXT. The item below is kept as written, with the resolution appended, because the
  DIAGNOSIS IT CARRIED WAS WRONG IN A WAY WORTH KEEPING ON THE RECORD.**
  **What it said:** *"some of mermaid's own label colours are not driven by the effective theme"*.
  **What was true:** **NONE of them were.** The effective theme reached `diagramCacheKey` and nothing
  else — `DIAGRAM_ENGINE_CONFIG` carried no `theme` and no `themeVariables`, and `initialize()` was
  handed that theme-free constant once per load. Proven, not argued: the adopted `<svg>` was
  **byte-identical at dark and at light** on both engines once the render id was normalised. Mermaid
  drew its default LIGHT picture at every theme, and dark mode was that light picture on dark paper —
  which is exactly why labels on a mermaid FILL stayed readable (the fill came with them) and labels on
  the CANVAS did not. **D-7's flip machinery was never at fault** and is byte-untouched by the fix.
  **The fix:** a light/dark/sepia `themeVariables` mapping transcribed from `design/tokens.css` (§3.7's
  *"the effective theme is OURS"*), applied by a **per-render** `initialize()` immediately before
  `engine.render` — per render rather than per load because `renderDiagrams` reads the theme PER FENCE,
  so a load-time theme would draw a mid-pass flip's remaining fences with the OLD paint while stamping
  them with the NEW `data-diagram-theme`. It sits INSIDE the cache-miss branch: a hit re-configures
  nothing (asserted).
  **Measured, both engines, production path:** dark pie title/legend **1.14:1 → 15.1:1**, gantt
  tick/title **1.45:1 → 15.1:1**, gantt section title **1.32:1 → 15.1:1**; the same five labels on
  **light stayed clear the whole time** (12–20:1 before, 16.2:1 after) — the light arm is the control
  that makes the dark arm mean something. **Three labels the walk never named were failing by the same
  mechanism and are fixed too:** sequence message text (1.45:1), and flowchart + state edge labels
  (2.30:1 / 3.24:1, from mermaid's TRANSLUCENT default edge-label chip compositing to mid-grey over
  dark paper). **A whole-fixture contrast sweep** over eight diagram shapes at both themes is what
  found them, and what proved the mapping does not trade one illegibility for another — an early
  text-only candidate was measured putting node labels at **1.02:1**, worse than the bug it fixed.
  **The one sub-4.5 label left is the gantt's task-bar text at 2.95:1 — identical BEFORE and AFTER and
  at BOTH themes**, so it is mermaid's own default rather than anything this fix touched, and it is not
  claimed as fixed.
  **★ FIRST REAL TWO-PICTURE FLIP — FOR 9.2's RETRO.** Every D-7 test was green throughout the period
  when the two renderings were pixel-identical: *"was it re-rendered"* and *"does it look different"*
  are different questions, and the suite only ever asked the first. The flip now swaps two genuinely
  different artifacts, a new test asserts exactly that, and the whole existing D-7 suite stayed green
  across the change (so none of it was secretly asserting picture-identity). **The lesson to bank: a
  green re-render suite is not evidence about pixels** — and the new assertion was itself vacuous on
  its first run (two renderings always differ by their `peekover-diagram-N` id) until an ablation
  caught it, which is the same lesson one level up.
- **★ NEW AT 9.1, AND IT IS A TASK, NOT A NOTE — FIX DARK-MODE DIAGRAM TEXT (a D-7 theme-legibility
  gap). THE MILESTONE-CLOSE GATE'S ONE FINDING. — ✅ RESOLVED, see the entry above.** Filed by §9.1's own
  mechanism (*"a real finding → a
  task added below this line, not a silent fix"*), placed here rather than in the **gate-sealed**
  `tasks.md` by 8.4's D-10 (b) precedent — **the tension over that placement is recorded in the 9.1 walk
  record and is a 9.3 call, not one taken here.**
  **THE DEFECT, as walked on both engines with the extension loaded:** text that **mermaid itself draws
  as text on the canvas** — the **pie's title and legend**, the **gantt's axis DATE labels** — renders
  **near-black on the dark background and is unreadable**. **DARK THEME ONLY, human-confirmed by flipping
  the theme**: the same labels are readable on LIGHT (dark-on-light), and text on **coloured fills** (the
  gantt's "parse / sanitize / adopt" bars) is readable in **both**.
  **THE DIAGNOSIS (stated as a diagnosis, to be re-proved by the fix, not assumed):** the diagram **does**
  re-render on the theme flip — **D-7 works** — but some of mermaid's own label colours are **not driven
  by the effective theme** and fall back to mermaid's dark defaults. **Not D-11** (that is confirmed
  static) and **not a render failure** (nothing blanks, nothing errors, never-blank #5 is intact).
  **★ THE BINDING CONSTRAINT: the fix must make DARK legible WITHOUT regressing LIGHT.** Light is
  currently correct, so a change that repaints both is a regression risk, not a wash — the light arm needs
  a control in the same run, exactly as the dark arm needs an assertion.
  **★ SUB-ITEM, AN OPEN QUESTION — NOT ASSERTED AS A DEFECT: the gantt's DATE AXIS OVERPRINTS.** The
  "2020…2026" tick labels stack on top of each other into an unreadable smear. **Two candidate causes and
  the fix task INVESTIGATES WHICH before touching anything:** (a) `diagrams-50.md` is the dense tail
  fixture and may pack a compressed time axis into a narrow figure — a *fixture* property, not a product
  one; or (b) a real gantt defect that any document would hit. **It is recorded as a question because the
  walk could not separate them**, and a fix aimed at the wrong one would be a change with no observable.
  **→ ANSWERED: (b). It is a REAL defect, it is NOT the fixture, and it is now its own item below.**
  **HOME:** its own session and its own commit — the first thing group 9 does after this record.

- **✅ FIXED (commit `fix(diagrams): gantt date-axis legibility via compact format + layout width`) —
  THE GANTT DATE AXIS OVERPRINT, M7's SECOND human-gate defect. The item below is kept as written,
  with the resolution appended; its mechanism was RIGHT and its implied fix was WRONG, which is the
  part worth keeping.**
  **What it implied:** give the container a real width. **What was true:** *width alone cannot fix
  this.* Re-measured on the sparse fixture: none → 12 of 12 adjacent labels overlap; 700 → 12 of 12;
  1200 → 0. **The reading column is 684 and sits INSIDE the overlapping regime**, so the obvious
  constant is the one that does not work. Nor does any larger one — d3 picks tick COUNT by count and
  never by pixels, so the width a gantt needs grows with its SPAN, and `useMaxWidth` then scales an
  over-wide layout back DOWN, shrinking the glyph below its designed 11px. That trades an
  illegibility defect for an overlap one, so a fixed *display* width is self-defeating.
  **THE FIX — the lever is the axis FORMAT, and it needs a layout width to work IN.** Both keys, in
  the **base** `DIAGRAM_ENGINE_CONFIG` (they are LAYOUT, theme-independent, so all three per-theme
  configs inherit them through the existing spread and the colour fix's per-render `initialize()`
  carries them unchanged): `gantt.axisFormat: '%b %d'` shortens the label, `gantt.useWidth: 684`
  lifts the layout off the 300 accident. **Neither works without the other** — at 300 even short
  labels cram, and at 684 the full date still smears. **The enhancer needed NO code change**: the
  measuring container stays width-less, because `gantt.*` is scoped by mermaid's own config
  namespace to the one type that asks its parent. Only its doc-comment was refined.
  **THE ONE PRODUCT CHANGE, ACCEPTED DELIBERATELY: `%b %d` DROPS THE YEAR.** A gantt in a reading
  column shows a relative schedule and takes its year from the prose around it, and the multi-year
  case where every tick truly needs a year is exactly the long-span smear a year would be illegible
  in anyway. **It is a DEFAULT, not a mandate** — an in-fence `axisFormat %Y-%m-%d` still wins
  (`ganttDiagram-NO4QXBWP.mjs:1856-1862` reads the parser db BEFORE `conf.axisFormat`), asserted as
  its own arm. Neither key is in `secure`, deliberately: adding them would break exactly that
  override, and a date-format string and a layout number are not a security surface.
  **Measured, production path, BOTH engines** (`tests/browser/diagramGanttAxis.browser.test.ts`, four
  arms): **12 overlaps → 0**. The pre-fix `viewBox` was `0 0 300 172` with thirteen `2026-08-01`
  labels; it is now `0 0 684 172` with `Aug 01`. **The scaled-display arm** renders the fixed layout
  into a 400px host (painted 336–350px, proven actually scaled) and still reports **0** — that is the
  one property the constant width rests on, asserted rather than argued. **The ablation arm** restates
  the pre-fix geometry (`useWidth: 300`, `axisFormat: '%Y-%m-%d'`) and must report many overlaps: it
  is the firing control, without which every `toBe(0)` here could be a broken detector.
  **NON-GANTT OUTPUT IS BYTE-IDENTICAL** — flowchart/sequence/pie/state normalised SVG hashes match
  across the change on both engines, so the colour fix's paint is undisturbed; all three per-theme
  config hashes DID move, which is what proves the key is actually inherited.
  **Bundle:** content script **byte-identical both engines**; app chunk **+55 B**, decomposed to zero
  residual (54 B emitted literal + 1 B separating comma) with the string present post-fix and absent
  at HEAD.
- **★ THE GANTT DATE AXIS OVERPRINTS — A REAL DEFECT, MECHANISM KNOWN, DELIBERATELY NOT FIXED WITH THE
  COLOUR BUG. — ✅ RESOLVED, see the entry above.** Promoted from the open sub-question above: the two candidates were separated by
  measurement, and it is **(b), a product defect** — the SPARSE `diagrams-10` gantt (three days, three
  tasks) overprints exactly as badly as the dense 50-fence one, at **both** themes, on **both** engines.
  So it is not a fixture artifact and no dense document is needed to see it. **★ M7's human-gate defect
  count is therefore TWO, not one (M7:2).**
  **THE MECHANISM, from mermaid's own source:** `ganttDiagram-NO4QXBWP.mjs:1508` reads
  `w = elem.parentElement.offsetWidth` — the gantt takes its width from **OUR measuring container**, and
  `createMeasureContainer` (`diagramEnhancer.ts:260-270`) sets no width by design, so `offsetWidth` is
  **0** and the axis lays out at a 300-unit fallback. Mermaid never thins ticks, it only scales, so 13
  date labels needing ≈740px are drawn into 300. **Measured at three container widths:** none → 12 of 12
  adjacent labels overlap; 700px → 12 of 12; 1200px → **0**.
  **WHY IT IS NOT IN THE COLOUR COMMIT:** different mechanism (layout, not paint), different region, and
  it lands on **D-6 step 1's load-bearing prose** — the container is width-less *on purpose*, and the
  stated reason (`htmlLabels:false` makes every label an SVG `<text>` the engine measures itself, so a
  parent box would constrain nothing) is **true for flowcharts and false for gantt**, which asks its
  parent. Reconciling that is a real decision, not a tweak, and bundling it into a colour fix would have
  hidden it. **HOME:** its own session and its own commit; the D-6-step-1 prose is edited there, not here.
- **★ NEW AT THE GANTT-AXIS FIX — THE 6-HOUR-TICK REPEATED LABEL. A POLISH ITEM, NOT A DEFECT, AND
  DELIBERATELY NOT BUNDLED WITH THE OVERPRINT FIX.** On a three-day gantt d3 lands on **6-hour**
  ticks, so four consecutive ticks format to the same string: the fixed axis reads
  `Aug 01 | Aug 01 | Aug 01 | Aug 01 | Aug 02 | …`. **Distinguish it from the bug just fixed:** these
  labels are legible and **do not intersect** — the overprint assertion is genuinely 0. This is
  redundancy, not illegibility, which is why it is a polish candidate and not a second defect.
  **WHY NOT FIXED HERE:** it needs a **span-dependent `tickInterval`** (mermaid takes
  `gantt.tickInterval`, but a single constant is wrong by construction — `1day` is right for a
  three-day chart and absurd for a three-year one, so this needs a rule computed from the gantt's own
  span, which the config route cannot express). That is a different and harder mechanism than a format
  string, and bundling a speculative one into a measured fix would have hidden it — the same reasoning
  that kept this fix out of the colour commit. **REVISIT WHEN:** a gantt-heavy document makes the
  repetition worth the machinery, or mermaid grows a span-aware default upstream.
- **✅ DISCHARGED 2026-08-03 AT M8's GATE 3 — THE CHECKBOX CONVENTION IS SETTLED: OPTION (c), WITH A
  PREDECESSOR NOTE. It is now a STANDING INVARIANT, banked in `decisions.md`'s 2026-08-03 M8 GATE 3
  entry.** The item below is kept as written, because it is the record of what was counted and why the
  call was routed rather than taken. **The ruling:** **(1) FORWARD, from 008 onward — PER-TASK TICKING.**
  Each task's box is ticked **in ITS OWN commit**, the same commit that lands that task's code and
  advances this file's Now-pointer; `tasks.md` ships with unticked boxes and they tick as tasks land.
  006's shipped shape, promoted from habit to invariant so the divergence cannot recur. **(2)
  PREDECESSORS ARE NOT RETROACTIVELY TICKED — 002 (0/15) and 007 (0/28) PREDATE the convention.** Their
  done-ness signal is **this file's pointer and § Closed milestones**, NOT their boxes. ★ **Recorded
  explicitly so a future reader does not read "007 is 0/28" as "007 is unstarted": the boxes are a
  FORWARD convention, not a historical one** — M7 shipped all 28 tasks plus five further code commits.
  Option (a) is **declined**: a retroactive 28-box commit is the per-task-in-its-own-commit convention
  performed backwards. **Settled BEFORE M8's implementation begins, as the item below asked.**
- **★ NEW AT 9.3, AND IT IS A HUMAN DECISION RATHER THAN WORK — THE CHECKBOX CONVENTION. 007 CLOSED WITH
  ALL 28 BOXES UNTICKED, AND 9.3 DELIBERATELY DID NOT TICK THEM. — ✅ DISCHARGED, see the entry above.**
  Counted at HEAD, not recalled:
  **001 15/15 · 003 15/15 · 004 19/19 · 005 25/25 · 006 20/20 ticked; 002 0/15; 007 0/28.** 006's boxes
  moved **per task, in each task's own commit** (22 commits touch its `tasks.md`); 007's `tasks.md` has
  not been touched since before task 1.1, and its own title line says *"check off in order"*. **So a
  future planner reading only the boxes sees 0/28 on a milestone that shipped 28 tasks plus five further
  code commits** (three out-of-plan implementations and the two post-gate fixes) — M6 finding 3 recurring, and worse, because there are also **no landing
  notes** in the file. **Why 9.3 did not just tick them:** `tasks.md` is outside §9.3's Files list and
  8.4's D-10 (b) precedent makes a Files list a fence even for true corrections; and *ticking 27 boxes in
  one close commit is not this repo's convention* — the convention is per-task-in-its-own-commit, which
  cannot be performed retroactively. **THE CALL IS THE HUMAN'S, and the options are stated without a
  recommendation hidden in them: (a)** tick all 28 in a separate, explicitly-scoped commit, labelled
  retroactive; **(b)** leave 007 unticked and record in M8's tasks file that the `progress.md` pointer,
  not the boxes, is this repo's done-ness signal; **(c)** keep per-task ticking and promote it to M8's
  standing invariants so the divergence cannot recur. **Nothing is blocked either way — settle it before
  M8's tasks file is drafted**, because whichever answer is chosen has to be written into that file.
  *(Full context: § Baselines, THE 9.3 RECONCILE RECORD.)*

- **★ NEW AT 9.3 — RE-AUDIT `spec-coverage.md`'s F2 BEFORE M8 SCOPING. ✅ DONE 2026-08-03 at HEAD
  `59dcb20`** — `spec-coverage.md` carries a third dated audit stamp; **F2 moved 3% → 42%** (19 items:
  **7 shipped, 2 partial, 10 not** — every diagram row landed, **all seven math/formula rows stayed ✗**),
  §7-6's *"re-themed diagrams"* sub-surface and the dependency count (**4 → 5**) are updated, and the
  item count was corrected **18 → 19** as an enumeration slip (the section always listed 19 rows), moving
  §5 to **21%** and the whole spec to **26%**. **The re-audit is numbers only — it adds no direction
  recommendation and ranks no M8 candidate**; the weighing remains a separate human step that reads it.
  *(One question it raises rather than answers: all seven ✓ rows are app-page-only by 007 §3.2, scored ✓
  on the F6 `Diff view` precedent — see the file's uncertain-items §5, which prices the alternative.)*
  **Original entry, preserved as the record of why 9.3 left it:** The file is dated **2026-07-27 at HEAD
  `d470ab2`** — entirely pre-M7 — and scores **F2
  Math & Diagrams at 3% (18 items: 0 shipped, 1 partial)**. **M7 shipped diagrams**, so F2 is stale by
  construction, and so are §6-6's *"re-themed diagrams"* row and the stated dependency count (**4 → 5**).
  **Why 9.3 left it:** §9.3's own Files line makes the coverage file **conditional** (*"F2's score, if the
  coverage file is in the reconcile's scope at that time"*), and a coverage score is a **weighted re-audit
  of 18 rows against shipped code** — an audit with its own evidence standard, not a figure a reconcile
  can re-derive from a build. Guessing at it would have put an unaudited number in the one file M8's
  scoping argument reads. **Trigger: before M8 is scoped.** *(§ Blockers' "Spec coverage audit" bullet
  still cites the 2026-07-27 numbers and is correct AS a dated record of that audit — it is the SCORE
  that needs re-running, not that bullet that needs rewriting.)*

- **★ NEW AT 8.4 — NARROW THE `mermaid/package.json` INLINE (D-10 disposition (b)), ~3,818 B. THIS IS
  NEW CARRIED WORK, AND ITS PLACEMENT WAS RESOLVED RATHER THAN ASSUMED.** 8.4's human gate **took the
  disposition**; it did not do the work. **§8.5 did NOT own it, and 8.5 HAS NOW LANDED without touching it — this STAYS CARRIED, its trigger
  still unmet** — §8.5's Files are
  `src/app/diagramCache.ts` · `src/app/diagramCache.test.ts` and its body says *"The ALGORITHM does not
  move — only constants"*, and narrowing the inline is neither of those files nor a constant. It is
  **not** added to `specs/007-mermaid-diagrams/tasks.md` either: 8.4's own Files list is
  `docs/ai/decisions.md` alone, and **§9.1 is this milestone's stated mechanism for adding a task**
  ("a real finding → a task added below this line, not a silent fix"). So it lands here.
  **The work:** a Vite `define` narrowing the static `import pkg from 'mermaid/package.json'` to the one
  field `engineVersion()` reads (the D-3/D-13 amendment, `decisions.md` 2026-07-28). **The number:**
  8.1's second ablation moved the app chunk **387,837 → 384,019 B, −3,818 B**. **Why now-ish and not at
  close:** the `< 2 MB` zip bound is **not breached** (1,299,871 / 1,299,930 B) but the *trend* is —
  **0.70 MB of headroom where M6 had 1.65 MB, 58% of M6's margin consumed by this one milestone**.
  **What is NOT carried with it:** option **(d)** (a stricter lazy-load boundary) is **WITHDRAWN as
  INERT** — it moves bytes *loaded*, which 8.1 measured at **0** on the content script already, so it
  collapses into (c); option **(c)** (a mermaid subset build) recovers more but risks mermaid's lazy
  chunk graph, which §3.2's whole content-script fence depends on, and is **DEFERRED until headroom
  forces it**. **REVISIT WHEN:** zip headroom falls below ~0.5 MB or any further dependency lands —
  **(c) is then forced and (b) is no longer sufficient**. Full reasoning in `decisions.md` 2026-08-01
  (the M7 D-10 entry).
- **★ THE WATCH PILL IS NOT DISCOVERABLE — the 7.1 gate's ONE finding, SHIPPED AS-IS by human decision,
  carried rather than filed as a defect.** Asked whether they would have found it unaided, the human said
  **no**: bottom-left, third in a stack (network → theme → watch), unlabelled until looked at.
  **The placement is correct AND measured, which is why this is not a placement bug** — 4.1's throwaway
  probe ruled out top-right (collides with the TOC handle) and bottom-right (inside the TOC rail's live
  entry list) with real rects, and bottom-left was the only corner clearing everything. **"Right corner"
  and "discoverable" are different properties**, and the geometry offers nowhere better.
  **WHY IT SHIPS: discoverability is an ONBOARDING problem** (product spec F11), and **005 has no
  onboarding surface to hang a hint on**. Inventing chrome at a gate is how you get unwalked UI — the one
  thing this project's whole gate discipline exists to prevent. **REVISIT WHEN:** onboarding lands, or a
  first-run hint becomes cheap on an existing surface. Recorded in `decisions.md` (2026-07-21) with its
  reasoning; kept here so it survives into the next milestone instead of living only in a gate note.
- **A POLISH CANDIDATE, NOT A DEFECT — the anchor's visible correction (seen at 7.1).** When content is
  inserted above the reading position, the view **visibly moves up and then returns**: the browser holds
  `scrollTop` through `replaceChildren`, then the anchor corrects it. That is 5.1's measured **~2738 px**
  correction made visible — **correct behaviour with a slightly visible mechanism.** Any fix belongs with
  006's diff work (which knows *what* changed and could avoid the full replace), not with a scroll hack.
- **Comment-only nit, to ride along with the NEXT `src/render/tocView.ts` touch.** `clampTocWidth`'s doc
  comment claims a non-finite input yields `TOC_MIN_WIDTH` via NaN being "caught by the caller's guard".
  **Wrong twice; the CODE is right.** `Math.max(180, Math.min(480, NaN))` is **`NaN`** (it propagates, it
  is not clamped), and the caller does not "catch" it — `applyStoredTocWidth` guards with
  `Number.isFinite` and **returns early**, so `clampTocWidth` never sees a non-finite value. That guard is
  load-bearing: without it the restore path writes literal `"NaNpx"` and silently kills `--toc-w`.
  **Fix the comment only** — the function is *partial* on non-finite input, guarded by the caller.
- **Sepia stays DEFERRED** (D-1 = A; `design/tokens.css` defines only 4 of ~15 sepia tokens, so completing
  the palette is a brand/design decision, not an implementation fill). A candidate for a later themes pass.
- **Unify the two keyboard shortcuts on ONE host registry.** 003 left `` ` `` (TOC toggle) on a host
  registry while readerMode's `\` still resolves differently and is inert on the app page. The
  inconsistency is deliberate and recorded (decisions.md 2026-07-17) — **revisit at a settings/hardening
  pass, or the next time `readerMode`'s shortcut host-resolution is touched.**
- **Chunked/virtualized *TOC-tree* render** — the many-heading lever (003 §5.1: ~45 ms rail build @1401
  headings, scales ~linearly). **NOT forced for typical docs**; revisit at N-thousand headings
  (decisions.md 2026-07-17).
- **Chunked/virtualized *folder-tree* render** — the large-folder lever. 6.2 measured the pure
  walk+build+filter as **cheap** (~7 ms typical, ~40 ms at the 5000-file cap); the suspect is `treeView`
  laying out one DOM node per file+dir. **Decide from a real-browser tree-render measurement** (the
  deferred half of 6.2), not from a guessed bound.
- **Chunked/virtualized *reader* render** — the M1-carried large-*doc* first-paint lever (decisions.md
  2026-07-14). Same class, different surface; 003's 5.2 and 004's 7.1 both confirmed no first-paint
  regression, so it stays carried rather than forced. **005's 5.1 gives it a second, sharper motivation:
  a 1 MB WATCH re-render blocks the main thread for ~717 ms and cannot be interrupted (`mount()` has no
  scheduling and no abort), and unlike a first paint it happens repeatedly while the user is reading.**
  Still not forced — 5.2/5.3's coalescing is the cheaper lever first — but this is now the strongest
  evidence for it.
- **Restore GFM table alignment safely** (map to a class, never an inline style) — carried from M1;
  spec 003 §Out-of-scope leaves it to table work.
- **A shared browser-test helper module.** `flush()` / `afterFrames()` / `waitFor()` are duplicated
  verbatim across 6+ files (plan §4-7 named it; 005 added more). When it lands, the three instrument rules
  in `decisions.md` 2026-07-21 belong in it — and the stability-polling wait should **replace**
  `waitForScrollable`, not sit beside it.
- **★ NEW AT 6.1, AND IT IS A PRESENTATION FINDING, NOT A DEFECT — THE AGENT-FILE BADGE'S LANE (plan §8
  Q3, walked with 1.5's measurement in hand).** The human walked real Chromium and real Firefox with the
  extension loaded, on `plan.md`: the badge WORKS and its `top:56px;left:16px` position is not broken,
  but it reads better GROUPED with the other pills (Watch this file, Theme, the pins — stacked
  bottom-left at `readerCss.ts:259,294,352,371`) than sitting alone, separated from them, in the top
  band 1.5 measured (`readerCss.ts:448-449`). **RECORDED, not fixed** — the human ruled record-not-fix
  for 6.1, and `readerCss.ts` is BYTE-UNTOUCHED by this task. This is the design call plan §8 Q3 asked
  6.1 to make, and the call taken is: **regroup, don't fix here** — 1.5's own three findings (the 1280
  collision, the `position:fixed` containment, rows 5/8) stay exactly as 1.5 left them; this finding is
  additive, not a resolution of those three. **HOME:** its own styling-pass task, its own session — see
  the toolbar-controls finding below, which is the same pass's other half.
- **★ NEW AT 6.1 — THE TOOLBAR CONTROLS SHIP UNSTYLED (the 3.3-carried debt, confirmed by the walk).**
  Filter input, Clear, Copy CSV and Copy Markdown render as **default browser form elements** — never
  integrated with the reader's design language, reading as bolted-on against the polished markdown
  around them. **Confirmed accurate to the code, not just to the eye:** 3.3's own doc comment names
  exactly this gap (`readerCss.ts:838-843`, *"no sort control (3.6), no filter (3.7), no copy buttons
  (3.8)"*), and 3.6/3.7/3.8 confirm it by omission — none of their Files lists touch `readerCss.ts`.
  **FUNCTION IS NOT THE FINDING**: sort, filter, clear and both copy buttons all work; this is
  presentation only. **RECORDED, not fixed** — the human ruled record-not-fix for 6.1, no
  `readerCss.ts` edit rides this commit. **HOME:** the same future styling pass as the badge-lane
  finding above.
- **★ A PLACEMENT TENSION, NAMED RATHER THAN SILENTLY RESOLVED — WHERE 6.1's TWO FINDINGS LAND.** 6.1's
  own Verify text says a clutter/broken/illegible verdict is *"a real finding → a task added below this
  line, not a silent fix"* — read literally, a new checkbox in `specs/008-persona-1-qol/tasks.md`. But
  `tasks.md` PASSED GATE 3 (`87532ad`, 2026-08-03) and is gate-sealed by the same **D-10 (b) precedent**
  named above (*"narrow the mermaid/package.json inline"*) — a Files-list fence holds even for a true
  addition, and 6.1's own Files list is `decisions.md` / `progress.md` / `tasks.md`-checkbox-only, never
  a new task body. **9.1 resolved the identical tension the same way** (its dark-mode and gantt-axis
  findings landed here, in § Carried items, not as new 007 checkboxes) and named the tension for 9.3 to
  settle, never silently. **This entry does the same, naming it for 6.3:** whether M8's two 6.1 findings
  get their own numbered task-stub in `tasks.md`, or stay carried-items-only the way 007's did, is
  **6.3's call, not 6.1's** — 6.1 is doc-only by the human's ruling and adds no checkbox.
- **✅ RESOLVED AT 4.2 (009) — THE `codeEngine.ts` MERMAID/`hasCodeFence` GAP CARRIED FROM 4.1.** 4.1
  found (and fixed in `codeEnhancer.ts`'s own `codeFencesIn`) that `CODE_FENCE_SELECTOR` matches
  `language-mermaid` too, and named `codeEngine.ts`'s identically-unscoped `hasCodeFence` as the same
  gap, carried because 4.2 is the first task to actually call it. **Fixed at 4.2** with the same literal
  class-check pattern, confined to `codeEngine.ts` (two independent copies of the exclusion, matching
  `CODE_FENCE_SELECTOR`'s own established duplication — see both modules' headers). Regression-tested at
  both levels: `codeEnhancer.test.ts` (4.1, pre-existing) and `codeEngine.test.ts` (new at 4.2). **The
  SPECIFIC instance is closed; the underlying architectural pattern is not** — any `language-*` selector
  a future D-value's engine adds can collide with an earlier-running engine's claim the same way, an
  O(N²) coupling that grows with each new engine. **HOME:** M9's own retro (task 9.2), the trigger this
  finding was already routed to at 4.1.
- **★ NEW AT 4.2 (009) — SHIKI'S `shiki/langs`/`shiki/themes` BARREL MANIFESTS BLOW THE PACKED-SIZE
  BUDGET; FIXED, BUT THE REMAINING HEADROOM IS NOW MEASURED AND TIGHT.** D-4's `codeToTokens` needs a
  REAL loaded language/theme (`createHighlighterCore`'s fine-grained API ships with neither); the
  obvious route — importing Shiki's own `shiki/langs`/`shiki/themes` manifests and indexing
  `bundledLanguages`/`bundledThemes` at runtime — makes Vite/Rollup discover and chunk EVERY one of
  Shiki's ~700 bundled language files as a build output (the manifest's own source is one `import()`
  per language), regardless of which are ever called. Built and measured before reverting: packed
  `.output` **13.6 MB** (AGENTS.md's ≤5 MB budget) and the Chrome zip **2.99 MB** (this milestone's own
  <2 MB bound) — caught by measurement, never committed. **Fixed** with a small, explicit, hand-written
  loader map in `codeEngine.ts` — each language/theme its own literal `import('shiki/langs/<name>.mjs')`
  / `import('shiki/themes/<name>.mjs')` specifier (the exact per-file shape `codeEngine.test.ts` already
  used at task 1.2 to capture `codeToTokens`'s shape, now the production pattern too) — so Vite only
  chunks what is actually listed. **4.2's own curated set is deliberately minimal and named PROVISIONAL**
  in `codeEngine.ts`'s own header (six languages: `javascript`/`python`/`json`/`css`/`html`/`bash`; one
  theme: `github-dark`) — and it ALREADY costs real headroom: packed `.output` **4.66 MB** (both
  engines), zip **1.42 MB** (both engines) — under budget, but with materially less room than before
  009 started. **HOME, two follow-ons named rather than silently assumed:** (1) task 5.2 (the
  ≥14-theme picker) and any future language-catalog growth (M-3 auto-detection, more fence languages)
  must budget against THESE measured numbers, not assume free headroom — every addition should be
  priced the way this finding was, not eyeballed. (2) task 4.5's own prospective clause-C text
  ("exactly one dynamic edge, two static specifiers") no longer holds — `codeEngine.ts` now carries
  SEVEN dynamic loader edges (six languages + one theme) plus a pre-existing type-only static edge on
  `shiki/core` 4.5's draft text didn't account for; `codeEngine.ts`'s own module header names this in
  full for 4.5 to measure and pin for real, not re-derive from scratch.
  ★ RESOLUTION LOCKED (post-4.2 review, resolution (c)): the curated language set becomes a component
  of D-11's decomposition at task 8.1 (ablation-proven byte accounting) and is ruled at task 8.5 (the
  human decision gate) alongside M-4's default theme. No new task added; 4.3+ ship with the
  6-language set as-is; 8.1/8.5 own the eventual real ruling.
- **★ NEW AT 4.3 (009) — BUNDLE-AFFECTING TASKS REQUIRE `pnpm build` + `pnpm zip` + `.output` SIZE
  MEASUREMENT AS A PRE-COMMIT VERIFY GATE, NOT AN OPTIONAL CHECK.** 4.2's barrel-manifest defect would
  have shipped had CC trusted *"unit + browser suites pass = ready."* Every subsequent task in this
  milestone that touches bundle-influencing files (`src/`, `entrypoints/`, imports, `package.json`)
  includes this as a MANDATORY step in Verify. Re-confirmed at 4.3, which additionally found that a
  SHARED-GRAPH file (`sanitize.ts`, `readerCss.ts`, `parse.ts`) moves CONTENT-SCRIPT bytes even when
  the feature it serves is app-page-only — §3.8's own guarantee is about the ENHANCER/ENGINE staying
  off the content-script graph, not about every file the enhancer's supporting infrastructure touches
  staying byte-inert there. A kickoff or kickoff-style fence that asserts blanket CS byte-identity for
  a task touching a shared file should be checked against the milestone's own byte history (3.4: +339
  B, 4.1: +306 B, 4.3: +18 B from `sanitize.ts` alone) before being treated as a hard stop. **HOME:**
  M9 retro (task 9.2).

**Roadmap:** 003 TOC/navigation ✓ · 004 themes+settings ✓ · **005 watch mode ✓** (the differentiator) ·
**006 snapshots + diff ✓** (closed 2026-07-27 — gate 9.1 PASSED, retro banked; gate score **10/10** at that close, corrected
from the 8/8 recorded at its 9.1 — **now 12/12 after M7's 9.1 and the dark-mode fix task, which confirmed the gantt overprint as M7's second defect**) · **007 Mermaid + diagram cache (M7a) ✓** (closed 2026-08-02 — gate 9.1 PASSED 8/8, both its findings fixed, retro banked; *(this line corrected at M8's 6.3 — it had read "IN IMPLEMENTATION... ONLY 9.3 REMAINS" since before M7's own close, a pointer-walk miss neither 9.1 nor 9.3 caught)*) · **008 Persona-#1 QoL: compare two files + agent-file awareness + table tools ✓** (closed 2026-08-13 — 35/35 tasks, gate score 12/12 unmoved, retro banked) ·
**009 Code blocks: Shiki syntax highlighting + code themes + per-block toolbar + collapsible blocks ✓**
(closed 2026-08-22 — 24/24 tasks, gate 9.1 PASSED 8 PASS/1 PASS+FINDING (not a defect, ship-as-is
carried), gate score 12/12 unmoved, retro banked, records reconciled at 9.3 — `spec-coverage.md` F3
0%→78%) ·
… full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **NOTHING IS BLOCKED. M7's three Gear-3 gates have all run AND ARE ALL BANKED IN WRITING** (gate 1
  `e09520f`, gate 2 `cab93c7`, gate 3 in `decisions.md`'s M7 GATE 3 entry — banked at `66634fa`, closing
  the flag task 1.1 raised; `tasks.md`'s "DRAFT awaiting gate 3" status line stays by precedent).
  **M7's cache bound-values / typical-case-target human gate — 8.4 — HAS RUN, is banked, AND ITS THREE
  CONSTANT-BEARING DECISIONS ARE NOW IMPLEMENTED (8.5)**: six
  dated entries in `decisions.md` 2026-08-01 (count **150** · totalBytes **8 MiB** · maxAgeMs **30
  days** · D-9 **165 ms** · D-10 **(b)** · flip cost **accepted**), each naming the § Baselines
  measurement that justifies it. **★ 9.1 — THE MILESTONE-CLOSE WALK, AND THE LAST HUMAN GATE M7 OWES —
  HAS NOW RUN** (2026-08-02, real Chromium and real Firefox, extension loaded, wide viewport). **Its
  verdicts are recorded in § Baselines: D-11 CONFIRMED STATIC (no shimmer built), six PASSes, §3.11
  touch N/A — not tested.** **★ IT IS NOW DISCHARGED — ALL EIGHT ITEMS CARRY A VERDICT, so §9.1's Verify
  is MET and M7 owes NO further human gate.** The one item that held it open — **item 7, app-page
  responsiveness after M7** — has been walked on a NORMAL non-fixture page on both engines and **PASSED**
  (no slowdown, no jank; plan §4-5's *"nothing else will notice"* holds). **★ AND WHAT THE GATE FOUND IS
  NOW FIXED — BOTH OF IT.** Its finding — **dark-mode diagram text renders black** (a D-7
  theme-legibility gap) — was fixed at `662b90e`, and its open sub-question — **the gantt date-axis
  overprint** — was separated by measurement, **confirmed a REAL product defect (M7's second)** and fixed
  at `fc3a142`. Each landed in its own session and its own commit per §9.1's own mechanism, with the
  resolutions appended in § Carried items; **the running gate score is 12/12.** ★ **9.2 (the M7 retro) IS
  ALSO DONE** — banked in `docs/ai/retro.md`, 2026-08-02. ★ **AND 9.3 IS DONE, SO M7 OWES NOTHING AT ALL:
  THE MILESTONE IS CLOSED (2026-08-02) — 28/28 tasks, 9/9 groups, no gate outstanding, no next task.**
  9.3 delivered `architecture.md`'s gate-2 (c) `enhance`-stage correction plus the memory reconcile, and
  answered the retro's whole routed set by KIND-sorting it (§ Baselines' *THE 9.3 RECONCILE RECORD*):
  § Baselines' stale rows **re-derived** from a clean build at HEAD; the "2975 B" mislabel, §9.1's
  preamble-vs-body count and §8.3's struck clause **recorded rather than fixed in place**, because
  `tasks.md` is gate-sealed and outside 9.3's Files list; `decisions.md`'s dated `PROPOSED_` line-refs
  **left exactly as written**. **TWO ITEMS ARE ROUTED OUT OF M7 AS OPEN HUMAN DECISIONS and are in
  § Carried items — the checkbox convention (007 closed with 0/28 boxes ticked) and `spec-coverage.md`'s
  F2 re-audit.** Neither blocked anything, and **both were settled**: the checkbox convention was banked
  at M8 GATE 3 (2026-08-03), and the F2 re-audit ran 2026-08-03 and again at M8's 6.3 (2026-08-13, six
  rows total across F5/F6 — see `spec-coverage.md`). M6's gates are all closed and recorded (spec gate 1 2026-07-22, plan
  gate 2 + gate-3 product decisions 2026-07-23, D-8's bound-value gate at 7.2 2026-07-26, close gate 9.1
  2026-07-26), alongside M5's three (2.3, 5.2, 7.1). *(This bullet has been corrected SIX times for
  pointer inversion — at 8.2, at 9.1, at the archive pass, at 007 task 1.1, and again at 007 task 8.4,
  which found it still asserting 8.4 as the pending gate in the very commit that discharged it — and a
  SIXTH time at 8.5, which found it still saying "only 8.5 stands between here and 9.1" in the very
  commit that removed 8.5. It is the single
  most inversion-prone line in the file: it states pending human state, which is false by construction
  the next time anything ships. **A SEVENTH correction at 9.3** — it was still saying *"the only work M7
  still owes is 9.3"* in the very commit that discharged 9.3, the same failure mode as the previous six.
  ★ **AND THE SEVENTH IS THE ONE THAT SHOULD END THE SERIES: the line no longer names any pending item.**
  Six of the seven corrections were *"pending X"* → *"pending Y"*, which re-arms the trap; this one is
  *"pending X"* → **NONE**. The next thing that can falsify it is M8 opening a gate, which is a deliberate
  act by whoever opens it, not decay.)*
- **★ SETTLED 2026-08-03 — PERSONA #1 IS 56%, AND ONE OF THE TWO ROUTED HUMAN DECISIONS ABOVE IS
  THEREFORE HALF-ANSWERED.** `spec-coverage.md`'s uncertain-items §5 asked whether app-page-only
  rendering is a scoped boundary or a gap. **A human ran the walk (a `file://` document with a
  `mermaid` fence, then the same file through the app page) and ruled GAP** — persona #1's core job is
  done at `file://` URLs and that surface renders no diagrams. The derivation's bracket was
  **67% (boundary arm) / 56% (gap arm)**; the gap arm is the figure of record. **Recorded in
  `spec-coverage.md` § Summary**, alongside — not over — the 2026-07-27 dated ~56%, which stays valid
  as a dated record and is still cited correctly by the bullets above and in § Closed milestones.
  **The three "56%"s are different numbers and the entry says so.** ★ **WHAT IS STILL OPEN:** the F2
  **row-level** re-score the ruling implies (42% → roughly 24%, items 4 and 5 moving together) is
  **CARRIED, not applied** — it is a row-level re-audit, and it merges with the F2 re-audit already
  routed out of M7 in § Carried items. ★ **AND SEPARATELY: the COST of closing the gap was
  investigated read-only on 2026-08-03 and lives in that session's report, NOT in a file** — it found
  the gap is **three mechanisms, not one** (diagrams · diff · snapshot history), each fenced for a
  **different** reason (007 §3.2 bytes-and-manifest · 006 §1.4 closure provisioning · 006 §3.2 the
  background's stateless-proxy character), and **no direction was chosen**. M8 scoping is where that
  choice belongs.
- **★ MEASURED 2026-08-03 (ABLATION-AND-REVERT SPIKE) — THE DIAGRAM MECHANISM'S INLINE ROUTE IS
  INFEASIBLE, AND THE COST INVESTIGATION'S UNMEASURED LOWER BOUND IS NOW A NUMBER.** That investigation
  bracketed the cost of putting diagrams on the content-script surface at *"[+3.35 MB upper /
  **unmeasured** lower]"* and inferred *"no plausible reading under 20 ms"* of first-paint headroom.
  The spike made `enhanceDiagrams` reachable from the content graph by ONE scratch edge in
  `mountReader.ts` (the mirror of 007 task 1.3's app-page ablation), built, measured, and **reverted to
  a byte-identical tree**. ★ **THE LOWER BOUND IS NOT LOWER — IT IS HIGHER THAN THE UPPER BRACKET.**
  The content script goes **318,747 B → 3,705,875 B, a measured +3,387,128 B**, identical on both
  engines, decomposed to a **0 B residual**: **3,347,306 B** engine graph (the same 99 chunks the app
  page splits out) · **20,658 B** inline/flatten glue + `diagramEngine.ts` · **19,164 B** enhancer +
  cache + `sanitizeSvg` + theme wiring. That is **+37,443 B MORE than the app page's own +3,349,685 B**
  (1.3's figure): flattening the split *loses* what the split buys. ★ **THE IIFE INLINES IT WITHOUT
  COMPLAINT — the build is NOT the blocker, so the inline and WAR routes do NOT converge on an
  ESM-conversion cost.** `import(` stays **0** in the output and no chunks directory appears beside the
  content script; rollup folds the lazy edge flat. ★ **TWO INDEPENDENT BLOCKERS WERE MEASURED, AND THE
  FIRST IS TOTAL.** (1) **Chrome refuses to load the WHOLE EXTENSION** — not the content script, the
  extension, background included: *"Could not load file 'content-scripts/peekover.js' for content
  script. It isn't UTF-8 encoded."* The file **is** strictly valid UTF-8; Chromium's
  `base::IsStringUTF8()` additionally rejects Unicode **non-characters**, and mermaid's inlined graph
  carries **exactly one — U+FFFF at offset 542,008, a literal inside a regex character class** (the
  repo's own AGENTS.md rule about escaping such characters, met from the other side, in a dependency).
  **Size is NOT the cause and this was proven by control:** a size-matched **inert** 3,705,870 B content
  script loads and mounts in ~103 ms. (2) With that one character escaped **purely as a measurement
  instrument** (semantically inert inside the template literal, so the engine really runs), first paint
  on a **fence-free** 50.4 KB `file://` document goes **146.5 ms → 385.3 ms median** — **+238.8 ms**
  against **~20 ms of headroom**, **2.3× the <165 ms gate**, floor 360.3 ms, `DOMContentLoaded` +225 ms.
  **A-B-A, quiesced, swapping ONLY the content-script file so the rest of the tree is held byte-
  identical: A1 147.7 · B 385.3 · A2 145.3 ms medians — A-vs-A disagreement 2.4 ms, ~1% of the A→B
  delta**, so 8.1's *"A disagrees with A ⇒ nothing measured"* rule is satisfied and B stands. **§3.2's
  "diagrams or not" claim is confirmed on the harm's own terms: this document had no `mermaid` fence.**
  ★ **NO DIRECTION IS CHOSEN HERE.** This prices ONE of the gap's three mechanisms; the surface-milestone
  vs defer call is M8 scoping's, and it belongs to a human.
- **RESOLVED, noted once so it is not re-opened: `scripts/generate-sbom.ts` no longer under-reports the
  production tree.** Found by 007 task 1.1 (which correctly did not take it — the file is outside 1.1's
  commit fence), fixed at **`1a202fd`** as its own act. **Root cause: `collect()` conflated DEDUP with
  DESCENT** — one `if (!acc.has(id))` gate both created the component and recursed, so a package was
  walked only on FIRST SIGHT, and `pnpm list --json` emits a repeated package **shallow** at its first
  occurrence in traversal order and **full** at exactly one later one. First sight is therefore precisely
  the childless occurrence. **Fix: the two concerns are now separate sets** — `acc` dedups, a new
  `expanded` set gates descent, so any node that actually carries children is walked. **Counts: 90 → 120
  `name@version` (113 distinct names); 30 recovered**, all of `d3@7.9.0`'s subtree plus `d3-dsv`'s
  children. **Proof, and it is graded against something other than itself:** a red-first unit test
  (`tests/sbomWalk.test.ts`, synthetic shallow-first/full-later fixture, revert-and-fail reproduced, with
  a firing control asserting the OLD walk drops exactly the shallow-first payload and keeps the
  full-first one), plus set-equality — not just count-equality — between the fixed generator and an
  **independent** `pnpm licenses list --prod --json` enumeration (a different pnpm subcommand that never
  reads the nested tree). **It was a pre-existing latent defect, not a mermaid regression:** the
  4-dependency tree had no diamond deep enough to produce a shallow-first pair, so it had never fired.
  CycloneDX version, output format and byte-determinism are unchanged (two runs byte-identical); the
  serial number moved because it digests the component list, which is the point.
- **Spec coverage audit** at [`spec-coverage.md`](spec-coverage.md) — **re-audited 2026-07-27 at HEAD
  `d470ab2`** (targeted: §6-4 and §6-9 only, after the §6 side-quest landed the CI those items named).
  **~17% of Phase 1's F1–F12 is shipped** by weighted item count (**§6 59%** — up from 56% — §7 67%,
  whole spec ~23%); **persona-#1 killer-feature coverage is ~56%** and is unchanged by the re-audit.
  Only 4 of §10's 14 stack layers are provisioned, and **F2/F3/F9/F10/F11 have never been touched by any
  milestone**. **Read before scoping M7.** *(It also half-answers the single-file-drop question below —
  see the audit's uncertain-items §1.)*
  **↳ FORWARD-NOTE 2026-08-03: the figures in this bullet are a DATED RECORD of the `d470ab2` audit and
  are left standing as such. They are no longer current — `spec-coverage.md` was re-audited 2026-08-03 at
  HEAD `59dcb20` (F2 only, plus the dependency count): F2 3% → 42%, §5 ~17% → ~21%, whole spec ~23% → ~26%,
  4 of 14 stack layers → 5, and F2 is no longer on the never-touched list. The persona-#1 ~56% was NOT
  re-derived and is now an undercount — do not quote it. Read `spec-coverage.md` itself for current
  numbers; read this bullet for what was true on 2026-07-27.**
- **★ ONE GAP THE RE-AUDIT FOUND AND DID NOT FIX, because `.github/` is outside an archive pass's scope
  fence: the SBOM's release-attach step cannot fire on a tag push.** `supply-chain.yml`'s `on.push` is
  filtered to `branches: [main]` with **no `tags:` key**, so pushing `v0.1.0` triggers no run, and the
  `sbom` job's `if: startsWith(github.ref, 'refs/tags/')` step is reachable only by a manual
  `workflow_dispatch` against a tag ref. `decisions.md` 2026-07-27 says the step *"will fire on the first
  tag"* — **not supported by the trigger block as written.** The fix is one line (`tags: ['v*']`) and
  belongs with whoever cuts the first release, alongside §6-10's hashes and attestations. No tag has ever
  been cut (`git tag -l` is empty), so nothing is broken today.
- **GAPS IN AUTOMATED COVERAGE — closed as *findings*, still open as *coverage*. Plan for these; do not
  assume CI will catch a regression in them.** Per the harness ledger (decisions.md 2026-07-19 + the
  2026-07-21 addenda) there is **no roadmap to any of them**:
  - **The real content→background transport.** No test on any milestone has ever exercised it — the
    harness loads no extension, so `runtime.sendMessage` has no receiving end. **This is where M5's one
    shipping defect lived (4.8).** 4.8 added the closest reachable substitutes (a call-site pin and
    source-text pins on the entrypoint); **neither reaches the transport.**
  - **Firefox first paint and Firefox's watch re-render cost.** Playwright cannot load an extension into
    Firefox (upstream, closed out-of-scope), so both perf harnesses are Chromium-only by construction.
    Firefox's evidence is the human gate and nothing else.
  - **Local-disk `FileSystemObserver` latency.** No automated route to a local-disk handle exists; every
    harness number is an OPFS inference (confirmed once, at 5.1a — see § Watch-mode numbers).
  - **From M4 and still true:** the end-to-end settings/TOC round-trip through the background, and the
    cold-start theme flash.
- **OPEN QUESTION (an M2 finding, NOT an 004 defect — recorded so it is not lost). Dropping a single `.md`
  file onto the app page does nothing; only folders work.** Found by the human during the 8.1 session. 004
  touched no folder/drop code and this did not affect the gate result; it is **spec-002 / M2 territory**.
  **UNVERIFIED — do not assume either way.** The evidence points at folder-only **BY DESIGN** (the
  PERMISSIONS.md ledger describes only folder drop/pick; the architecture is folder-shaped throughout —
  `FolderSource → MarkdownFile[]`, `folderId`-keyed recents/pins, remembered directory handles, and a lone
  file has none of those) — **but that is inference from surrounding artifacts, not verification.**
  **Two checks would settle it:** (1) does `docs/product/spec.md` name "open a single file from the app
  page" as a feature at all? (2) does the drop handler bail **SILENTLY**? `getAsFileSystemHandle()`
  returns handles for files *and* directories, so it very likely checks `kind === 'directory'` — the real
  question is whether the user gets **any** feedback. **Worth flagging regardless of the answer:** a
  reasonable gesture producing total silence is its own small **never-blank (#5)** gap, and a line like
  *"Drop a folder — single files open directly from your file manager"* would close it cheaply.
  *Recorded only — not investigated, not fixed.*
- **RESOLVED, noted once so it is not re-opened: the `remoteMedia` positive-control flake is FIXED.** It
  now awaits the Resource-Timing entries instead of sampling for them (22/22 consecutive runs green, both
  engines; deliberate break goes red). Retro 2026-07-19's watch item is **discharged**; the rule and the
  structural reason only that file was ever at risk are in `decisions.md` 2026-07-21.
- **CARRIED — `codeEnhancer.test.ts` / `diagramEnhancer.test.ts` have ~3 timing-sensitive unit tests that
  can fail on a cold or machine-loaded first run and pass on rerun.** Observed 2026-08-29 at the codeDetect
  corpus re-pin (`57d18b8`). **The determination that these are flaky-not-real rests on the CAUSAL
  argument — a codeDetect fixture re-pin cannot affect enhancer timing — not merely on "reran clean and it
  passed."** A single clean rerun alone does not distinguish flaky from intermittently-real; the causal
  argument is what actually rules out the latter here. **Guidance for a future session:** a red confined to
  exactly these two files that clears on rerun matches this known pattern and does not need re-deriving. A
  red that PERSISTS across reruns, or that appears in any OTHER file, does NOT match this pattern and must
  be treated as real and investigated. **★ RESOLVED-BY-RETRO, 2026-09-06 (M10 11.3, final pass) — this is
  one of the FOUR facets (alongside the clipboard-consent leak, the shared-document listener leak below,
  and the codeDetect repo-wide unlabeled-fence corpus's own re-pin drift, observed 2026-08-28/29,
  `57d18b8` and the entries above it — it has no bullet of its own in this section; it now lives in the
  archived task-by-task narrative, `progress-archive.md`'s M10 entry, cited here as prior art) the
  `/retro` interview (11.2, `retro.md` 2026-09-06) consolidated into ONE named observation with ONE
  drafted standing rule — **PLACED in `AGENTS.md`, 2026-09-06** (the M10→M11 seam edit).**
- **CARRIED — the browser suite's shared-document cross-file listener leak: assert deltas, not
  absolutes.** Found at task 8.1 (`exportShortcut.browser.test.ts`). The browser test suite runs files
  SERIALLY, sharing ONE real `document`/`window` per engine (`vitest.config.ts`'s own task-4.5 note);
  document-level listeners installed by one file — or by `appHarnessSeam.browser.test.ts`'s repeated
  `main.ts` imports, or a file's own repeated `loadMain()` — LEAK into later files and are never torn down.
  **Guidance for a future session:** a test asserting anything about a document-level listener's reaction
  must use a DELTA-based instrument (a `preventDefault`/handler spy CLEARED before each measured dispatch,
  asserting "this dispatch added exactly N reactions"), never an absolute count ("exactly N listeners
  exist" / "nothing reacts yet") — the absolute form is contaminated by leaked listeners and fails or
  passes by file run-order, not by the code under test. `exportShortcut.browser.test.ts`'s `reactionsTo()`
  (8.1) is the worked reference. **★ RESOLVED-BY-RETRO, 2026-09-06 (M10 11.3, final pass) — this is the
  worked reference among the FOUR facets (alongside the clipboard-consent leak above, the enhancer-timing
  flake above, and the codeDetect corpus drift cited at both) the `/retro` interview (11.2, `retro.md`
  2026-09-06) consolidated into ONE named observation, with ONE drafted standing rule: *"the browser test
  suite runs files serially sharing one real per-engine `document`/`window`; any assertion about shared
  state (clipboard, document-level listeners, timing, module-level caches) must be delta-based or
  specific-content-matched … never asserted as an absolute count or non-empty check."* **PLACED in
  `AGENTS.md`, 2026-09-06** (the M10→M11 seam edit). This bullet and the two it points at stay as the
  worked instances alongside the now-live rule.**

## Closed milestones

**M11 · spec 011 — Math rendering: Temml/MathML inline `$…$` and block `$$…$$`/fence math, copy-as-LaTeX/
MathML · CLOSED 2026-09-11.** Ships math rendering via **Temml/MathML, not KaTeX** — the milestone's own
task 1.1 busted the byte headroom for BOTH KaTeX and MathJax (1,361,716 B / 1,339,852 B against
~352.8/352.7 KiB available, and MathJax independently failed `pnpm audit --prod`), suspending M11 at its
own hard gate; a human-reviewed **three-gate REVISIT** (spec/plan/tasks, `decisions.md`'s 2026-09-06
GATE 1/2/3 — REVISIT entries) reopened the milestone on the MathML/Temml direction instead, with a ruled
readable-on-both-engines fidelity bar (not KaTeX-HTML equivalence) and MathJax **struck permanently**
(D-10/D-11 vacated). The reopened nine-task decomposition (1-R…8-R) shipped inline/block/fence math, a
bundled STIX Two Math font (D-13, subsetted, `document.fonts.add()`-registered — a real divergence from the
sealed `@font-face` text, flagged not silently followed), a single MathML-only sanitizer profile (D-5-R),
copy-as-LaTeX (block: a per-figure button; inline: text-selection + a document-level "Copy formulas as
LaTeX" action) and copy-as-MathML (a document-level action) — both engines, `permissions: []` unmoved, no
`web_accessible_resources`. **Three out-of-sequence fix-spikes, each its own dated `decisions.md` entry, no
tasks.md checkbox:** a temml bundling lone-surrogate defect (macros silently didn't render, fixed via
`pnpm patch`), a font-subset MATH-table blind spot (radicals rendered with no radical sign — the subset was
derived by scanning rendered TEXT for codepoints, structurally blind to U+221A, which the browser draws
from the font's OpenType MATH table; fixed by re-subsetting with U+221A seeded from the shipped `cmap`), and
the §8-1(b) inline-copy-source gap (a successfully-rendered inline formula had no way to recover its LaTeX
source; fixed via a `data-math-source` attribute, ruled fix-before-close by the 8.1-R human walk). **All
three are the SAME failure class** (a correct-looking method, green tests, blind to one untested case,
caught only by a human looking at real rendered output) — the milestone's own retro headline.
**★ THE 8.1-R HUMAN MILESTONE-CLOSE WALK CAUGHT THE RADICAL DEFECT AND SENT IT BACK** — real Chromium +
real Firefox, the packed extension, `harness/math-fidelity/walk-corpus.md`'s eight fidelity classes; the
FIRST walk found radicals broken on Chrome, the RE-walk post-fix passed clean both engines. Ruled **PROCEED**
(`decisions.md`'s 2026-09-10 "M11 8.1-R / 1.2-R" entry) — the 2026-09-07 conditional-proceed deviation is
cleared retroactively. **8.3-R's own D-N-R-landed audit: every reopened D-value (D-1-R…D-9-R, D-12-R, D-13)
lands with a named implementing commit** (per-task commit messages + `tasks.md`'s own detailed RESULT
blocks carry the full landing text; unlike M9's own named gap, no D-value went undocumented) — **with one
named divergence from the sealed per-task discipline**: no D-value received its OWN standalone
`decisions.md` bullet the way the original M8-era convention intended (`decisions.md`'s M11 entries are
gate/fix-spike/human-walk shaped, not per-D-value); D-10/D-11 confirmed vacated with correctly zero
implementing commits. **8.1-R's own tasks.md checkbox/RESULT block was never completed** — its work landed
(banked in decisions.md's merged "8.1-R / 1.2-R" entry, `harness/math-fidelity/walk-corpus.md` committed)
but the task's own `[ ]`/RESULT slot in `tasks.md` was left as drafted; named here, not silently ticked by
8.3-R (out of 8.3-R's own Files-list fence — ticking a DIFFERENT task's box is not this task's call).
**Byte ledger, closed:** content-script **340,492 B both engines**, md5-identical to 3.2-R's own landed
floor — the milestone's own closing invariant, re-proven by a fresh build, never moved again after landing
once. `.output` **5,197,425 B Cr / 5,197,541 B Fx**, headroom **~44.4/44.3 KiB** against the 5 MiB bound —
thin by design (the URL-loaded-font lever, ~28.2 KiB real-measured, was TAKEN at 4.2-R, not left as an
unspent reserve — `src/theme/mathFont.ts`'s own header confirms a plain, non-`?inline` import). Manifest
**654 / 770 B**, `permissions: []`, no `web_accessible_resources`. `spec-coverage.md` **F2 (Math &
Diagrams) 42% → 68%** — four rows moved ✗→✓ (Temml shipped in place of the named KaTeX engine, inline,
block, fence), two ✗→~ (copy-as-LaTeX/MathML ship as document-level panel actions, not the spec's literal
"right-click" mechanism — `permissions: []` holds, no `contextMenus`), one row (MathJax toggle) stays ✗
**permanently by ruling**, not as a gap. **Carried items, dispositioned honestly:** the harness-shared-state
rule-9 hardening made the full **browser** suite green in one pass, repeatably (164 files, confirmed across
4 consecutive runs); **the UNIT suite does NOT get the same claim** — `pipeline.perf.test.ts`'s parse+sanitize
budget and `golden.test.ts`'s huge-document case are two concurrency-sensitive wall-clock flakes, confirmed
pre-existing (reproduced on bare HEAD, pass instantly in isolation), **deferred-post-M11** (a
machine-relative/CPU-aware budget is the fix, not a bigger constant). Two patch-governance follow-ups
(upstream the temml fix + retire `patches/temml.patch`; the SBOM generator's patched-dependency blind spot)
and the `@mdit/plugin-tex`/`markdown-it` peer-dependency version mismatch (mitigated by two independent
zero-misclassification grammar audits, 1.1-R and 3.1-R, but never bumped) are **deferred-post-M11**, standing.
Two of the retro's three drafted process actions (the informal-eyeball-as-soon-as-a-surface-renders rule;
the shorter-check-ins-plus-tree-hygiene-near-close rule) are **DRAFTED, not placed** — the human's own call
per C2, not placed by this task. The font-subset MATH-table rule (the retro's third action) **IS placed** —
`AGENTS.md`'s Style & structure section, 2026-09-11.
→ narrative:
[archive § M11](progress-archive.md#m11--spec-011--math-rendering-temmlmathml-inline--and-block-fence-math-copy-as-latexmathml--closed-2026-09-11)
· tasks: `specs/011-math-rendering/tasks.md` (the reopened decomposition, 1-R…8-R, per-task ticking; 8.1-R's
own checkbox left as drafted, named above) · plan D-1-R…D-13: `specs/011-math-rendering/plan.md`'s "PLAN
REVISIT" block (sealed at gate-2-revisit) · decisions: `decisions.md` **2026-09-06** (GATE 1/2/3 — REVISIT),
**2026-09-07** (1.2-R sequencing deviation), **2026-09-09** (temml-bundling defect, fixed), **2026-09-10**
(8.1-R / 1.2-R PROCEED ruling; radical-render defect, fixed; §8-1(b) fix), **2026-09-11** (M11 CLOSED) ·
lessons: `retro.md` **2026-09-11** (M11 close — three instances of one failure class; the font-subset rule
placed in `AGENTS.md`; two further actions drafted for human placement).


**M10 · spec 010 — Local exports: HTML export, copy as rich text/HTML/plain text, PDF export via
`window.print()`, the Ctrl/Cmd+S export shortcut with last-format memory, F5 print mode · CLOSED
2026-09-06.** Ships HTML file export, three copy actions (rich-text/HTML/plain-text), PDF via the browser's
own print pipeline (no fallback dependency), an app-page-only Ctrl/Cmd+S shortcut defaulting to HTML on
first use, per-action failure states, a milestone-wide zero-network guard, and `@media print`/`@page`
chrome-hiding + fidelity CSS. **Four features DROPPED, each by a human-ruled, evidence-backed scope
reduction, none cut for time:** DOCX export (§3.10 — `docx`'s own weight busted the `.output` ceiling by
4,550 B against the thinnest headroom (~367 KiB) any gate-1 close has carried, MEASURED out); local-image
Base64 embedding (§3.1 — the folder-source seam retains no byte-readable local-image reference, DIAGNOSED
out, empirically CONFIRMED at 11.1's human walk, finding A1); ZIP export (§3.1(cont.) — redundant with
Copy-as-plain-text once images were gone, REASONED out); the progress indicator (§8.3/§10.4 — 10.2 measured
0.30–26.95 ms across a 1 KB–1.12 MB corpus, no surviving export "heavy," MEASURED out). **19 active tasks
ticked + 3 struck-in-place = 22 sealed, ZERO discovered tasks.** `dependencies` **6 → 8 (task 1.1's
ablation) → 6 at close** — net **zero** new production dependencies, confirmed against the installed tree,
not assumed. `permissions: []` intact throughout.
**★ THE MILESTONE'S CENTRAL ENGINEERING FACT: A HARD GATE BUSTED, AND THE GATE'S REAL OUTPUT WAS SCOPE
DISCIPLINE, NOT A GO/NO-GO ANSWER.** Task 1.1's ablation (`docx` + a ZIP writer) measured **+380,358 B**
against the ~367 KiB headroom — busting the ceiling by 4,550 B (~1.2% over) — suspending the milestone at
its own hard gate. The resolution was four scope reductions, not "find room": every dependency installed at
1.1 was later removed, and the accumulated delta across the reduced, shipped scope (14,838 B) never came
close to re-busting the reduced headroom. `.output` **4,881,585 B (Cr) / 4,881,701 B (Fx)** at close, `pnpm
zip` **1,474,790 B (Cr) / 1,474,848 B (Fx)** (+4,060 B both from the milestone-start baseline) — byte-ledger
residual **0**, both engines, against the summed per-task deltas (10.4's reconciliation).
**★ THE HUMAN GATE AND THE RETRO BOTH RAN CLEAN.** 11.1 — the milestone-close walk, real Chromium and real
Firefox, extension loaded — **ALL ITEMS PASS**, no SURPRISE, no FAIL; finding A1 (local-image break
confirmed) and A2 (the M-3 print margin/header/footer visual sign-off, turning Ruling M-3's "keep
provisional" into CONFIRMED-FINAL) both closed clean. 11.2 — the `/retro` interview, fresh session,
WORKFLOW.md §7.5 — answered "it worked well" / "none" / "nothing wasted," and banked ONE reusable
engineering lesson: the browser suite's shared cross-file `document`/`window` state (four facets —
clipboard-content race, document-listener leak, enhancer timing-flakiness, codeDetect corpus-drift) needed
delta/specific-content assertions throughout the milestone and had no standing rule naming it; the rule is
now **PLACED in `AGENTS.md`, 2026-09-06** (the M10→M11 seam edit). A real, named residual is carried, not
silently patched: PDF export's `@page` margin-box fidelity works on Chromium/app-page only — Firefox and the
content-script surface get none, ruled shipped-as-is (`decisions.md`, 2026-09-03).
**★ THE RECORDS RECONCILE (11.3) CONFIRMED M10 DID NOT REPEAT M9'S OWN NAMED GAP:** every D-1…D-10 has a
`decisions.md` entry dated at/near its own implementing task's commit, not backfilled at close.
`spec-coverage.md` **F9 (Export & Publishing) 0% → 38%**, **F5 (Navigation & Reading UX) 36% → 38%**.
→ narrative:
[archive § M10](progress-archive.md#m10--spec-010--local-exports-htmlpdf-export-copy-as-rich-texthtmlplain-text-export-shortcut-print-mode--closed-2026-09-06)
· tasks: `specs/010-local-exports/tasks.md` (**19/19 active ticked + 3 struck-in-place, per-task, in each
task's own commit**) · plan D-1…D-10: `specs/010-local-exports/plan.md` (sealed at gate 2) · decisions:
`decisions.md` **2026-08-22** (GATE 1, GATE 2 with four rulings, GATE 3), **2026-08-24** (D-1; §3.10 DOCX
scope-reduction ruling), **2026-08-29** (§3.1 local-image ruling; §3.1(cont.) ZIP-export ruling; D-2/D-10/
Ruling-2, D-3, D-4 per their implementing tasks), **2026-09-03** (D-4/D-5/D-6/D-7/D-10 per their
implementing tasks), **2026-09-04** (§8.3/§10.4 ruling; the GATE task-10.4 entry; task-9.2; task-9.1) ·
lessons: `retro.md` **2026-09-06** (M10 close — the dependency-gate fork fired then was resolved by scope
reduction; the browser-suite shared-cross-file-state rule drafted for human placement per C2).

**M9 · spec 009 — Code blocks: Shiki syntax highlighting · code themes · per-block toolbar ·
collapsible blocks · CLOSED 2026-08-22.** Shiki fences render as real syntax highlighting **on the
app page only** (§3.8's gate-1 disposition, mirroring 007's Mermaid decision), behind the pure-JS regex
engine (`shiki/engine/javascript`, D-3 — no WASM, no CSP/manifest change), never producing an HTML
string to sanitize (D-4 — `codeToTokens`'s structured token data adopted directly into DOM). Plus a
≥14-theme picker (20 shipped, independent of document theme in both directions), a per-block toolbar
(copy / line numbers / line highlighting / word wrap), collapsible long blocks (40-line threshold), and
degradation paths for total engine-load and theme-apply failure. **Nine groups, 24 planned tasks, ZERO
discovered tasks.** `dependencies` **5 → 6** (`shiki@4.4.3`, the governed addition, D-13) and
`permissions: []` intact throughout.
**★ THE MILESTONE'S CENTRAL ENGINEERING FACT: a real production automation seam was built and used
honestly.** D-1's `__peekoverHarness` query-gated seam put Shiki — an engine — on the app-page render
path for the FIRST TIME this codebase has ever instrumented first paint there, discharging D-11 (iii)'s
carried trigger (two milestones old, 007/008) rather than shipping an engine on that path unmeasured
again. Pre-Shiki floor (2.2): 89.2/89.3 ms median, 84.8/86.8 ms floor. Post-Shiki (8.2, HEAD `a44e17f`):
90.8-96.3 ms median, 86.2-88.1 ms floor — flat within noise, against `GATE_MS = 165` (~69-79 ms
headroom). Ruling 4's standing-baseline claim HOLDS (9.2 retro finding 7), with one honest gap named:
two numeric readings plus one subjective walk-time confirmation, not three numeric ones.
**★ THE OTHER FACT WORTH CARRYING: THE BYTE BUDGET RAN TIGHTER THAN THE STANDING MENTAL MODEL FOR MOST
OF THE MILESTONE.** M-1's four-component ablation (D-11) found `.output` **4,866,741 / 4,866,857 B**
against the 5 MiB bound (~367 KiB headroom, ~7% free) and zip **1,470,730 / 1,470,788 B** against the
2 MB bound (~612 KiB headroom) — neither bound bound, but a first-try barrel import of Shiki's full
~700-language/65-theme catalog blew both (13.6 MB `.output`, 2.99 MB zip), caught by measurement and
reverted before it reached a commit (4.2). The shipped catalog is a hand-curated **6 languages / 20
themes**, explicitly `PROVISIONAL` past M9 (`codeEngine.ts`'s own header) — named in `spec-coverage.md`
F3's own re-audit rather than credited as the spec's full 190+-language promise.
**★ THE MILESTONE-CLOSE GATE (9.1) FOUND ONE FINDING, NOT A DEFECT — the running human-gate score stays
12/12, unmoved.** Real Chromium + real Firefox, extension loaded, both `GEOMETRY_WIDTHS` (1280/1400),
both surfaces, all 20 code themes cycled across all 3 document modes, Network+Console clean throughout:
8 PASS, 1 PASS+FINDING (the toolbar/code-block vertical spacing reads a bit too generous — a subjective
preference, no correctness or a11y break, CARRIED not fixed, `decisions.md` 2026-08-22 · M9 9.1).
**★ THE RECORDS RECONCILE (9.3) FOUND A REAL GAP AND NAMED IT: none of D-1…D-13's thirteen individually
pre-written `decisions.md` entries ever landed with an implementing commit** — a larger version of M8's
own D-6…D-12 gap. Not backfilled (no genuine new decision landing; `decisions.md` read and left
untouched). `spec-coverage.md` F3 moved **0% → 78%** (six items ✓, two ~, one ✗ — auto-detection built
and tested, `codeDetect.ts`, but deliberately unwired to any live document). Full record: § Baselines
and this file's own 9.3 entry above.
→ narrative:
[archive § M9](progress-archive.md#m9--spec-009--code-blocks-shiki-syntax-highlighting--code-themes--per-block-toolbar--collapsible-blocks--closed-2026-08-22)
· tasks: `specs/009-code-blocks/tasks.md` (**24/24 ticked,
per-task, in each task's own commit**) · plan D-1…D-13: `specs/009-code-blocks/plan.md` (sealed at
gate 2) · decisions: `decisions.md` **2026-08-14** (GATE 1), **2026-08-15** (GATE 2 with four rulings,
GATE 3 with two rulings), **2026-08-19** (task 8.5's decision gate, all seven M-1…M-4 values),
**2026-08-22** (task 9.1's carried spacing finding) · lessons: `retro.md` 2026-08-22 (M9 close — six
kickoff scope-hypothesis misses including a recurrence of M8's own named failure shape; a missing
PROVISIONAL-constant-resolution rule; a missing bidirectional necessary-ripple rule; the byte-budget
headroom running tighter than modeled; two ceremony-waste items bounded by the full-suite gate's own
load-bearing catch; Ruling 4 HOLDS with one honest gap named).

**M8 · spec 008 — Persona-#1 QoL: compare two files · agent-file awareness · table tools · CLOSED
2026-08-13.** Three features for the AI-agent-file reader: a **file-vs-file diff** (current document vs
any picked file **or** snapshot, named in the status line — snapshot diffs stay uncaptioned, current-
vs-picked only, both sealed at gate 1 §9-5), an **agent-file badge** (a name comparison over a frozen
5-name set — `CLAUDE.md`, `AGENTS.md`, `spec.md`, `plan.md`, `tasks.md` — through a new data-only
identity registry, `src/render/docIdentity.ts`), and **table tools** (sort, per-table filter, copy as
CSV/Markdown) on **both** reader surfaces through **five explicit call sites, deliberately not one
shared seam** (D-6 — a shared `enhance()` would put the table/diagram enhancers on the content-script
import graph and take 007's 8/8 fence red). **Six groups, 35 planned tasks, ZERO discovered tasks** —
`specs/008-persona-1-qol/tasks.md` shows exactly 35 commits touching it, a 1:1 correspondence with the
per-task-ticking convention M8 adopted as this repo's first forward-ticked tasks file. `dependencies`
stays at **five** — no addition — and `permissions: []` intact throughout, including through the
milestone's first **deliberately non-zero** content-script byte delta (+10,486 B, decomposed to a
measured zero residual against five named features).
**★ THE MILESTONE'S CENTRAL ENGINEERING FACT: the byte ledger reconciled three independent ways.**
Content script +10,486 B (4.3) and app chunk +10,503 B (5.4), each decomposed to its own zero residual,
sum to the **package total's** +20,989 B exactly (10,503 + 10,486) — re-confirmed at 6.3's clean rebuild.
The one honest wrinkle (5.4's −2 B minifier name-pool non-linearity) is named, not smoothed (`retro.md`
2026-08-13).
**★ THE OTHER FACT WORTH CARRYING: THE MILESTONE-CLOSE GATE FOUND ZERO DEFECTS, AND THAT IS NOT THE SAME
CLAIM M4's CLEAN GATE MADE.** The 6.1 human walk (real Chromium, real Firefox, extension loaded, at both
1280 and 1400 px — the wide-viewport rule M6's escaped defect forced) found **two presentation
findings, neither stop-the-milestone**: the badge's lane reads better grouped with the other pills than
alone (plan §8 Q3, produced not chosen — the human's own call), and the toolbar controls ship unstyled
(the styling debt 3.3 named by its own doc comment). **Both recorded, neither fixed** — filed in §
Carried items rather than a new `tasks.md` checkbox, following 007's 9.1→9.3 precedent exactly (settled
at 6.3). §8-2 (per-table filtering) was walked and AFFIRMED, not altered.
**★ THE RECORDS RECONCILE (6.3) FOUND A REAL GAP AND NAMED IT RATHER THAN HIDING IT: seven of M8's twelve
D-values (D-6 through D-12) never had their individual, plan-§0-pre-written `decisions.md` entry land
with an implementing commit** — only the pre-implementation gate-2 summary exists for them. D-1/D-2 are
compliant; D-3/D-4/D-5 landed late and self-disclosed it already. Not backfilled at 6.3 (no genuine new
decision landing; `decisions.md` read and left untouched) — named for whoever next has reason to touch
`decisions.md`. Full record: § Baselines *THE M8 FIRST-PAINT PRICE* and this file's own 6.3 entry above.
→ narrative:
[archive § M8](progress-archive.md#m8--spec-008--persona-1-qol-compare-two-files--agent-file-awareness--table-tools--closed-2026-08-13)
· tasks:
`specs/008-persona-1-qol/tasks.md` (**35/35 ticked, per-task, in each task's own commit — the first
tasks file built under the forward-ticking convention 008 itself banked at gate 3**) · plan D-1…D-12:
`specs/008-persona-1-qol/plan.md` (sealed at gate 2) · decisions: `decisions.md` **2026-08-03** (GATE 1,
GATE 2 with D-1/D-6 confirmed and D-2…D-12 approved as drafted, GATE 3), **2026-08-04/05** (D-1…D-5),
**2026-08-13** (task 5.5's decision gate, task 6.1's milestone-close walk) · lessons: `retro.md`
2026-08-13 (M8 close — the floor-delta-before-re-baseline discipline applied to M8's own code; the
byte-ledger's three-way reconciliation; two `AGENTS.md` lines drafted for human review, not committed by
the retro itself).

**M7 · spec 007 — Mermaid diagrams + diagram cache (M7a) · CLOSED 2026-08-02.** Mermaid fences render as
real diagrams **on the app page only** (§3.2's gate-1 disposition, walked and confirmed at 9.1: the
content-script surface still shows a plain code fence, no affordance, no note), behind a **second named
sanitizer** (`sanitizeSvg`, D-1) and a **cached** render keyed on `hash ∥ effective-theme ∥ engine
version` (D-3) with oldest-first-global eviction at **150 rows / 8 MiB / 30 days** (D-8, chosen at 8.4's
human gate from 8.2's measurements). Plus per-diagram copy/download, a lightbox, D-7 theme re-render, and
degradation for engine-load and storage-unavailable. **Nine groups, 28 planned tasks, ZERO discovered
tasks — and FIVE commits of shipped code the box list cannot see:** THREE out-of-plan implementations —
the D-6 `secure` hardening (`3d7c8ed`), the D-1/D-6 option-B `<style>` CSS pass (`367d051`) and §4's
source guard (`eae7b08`) — plus the TWO post-gate fixes (`662b90e`, `fc3a142`). **`dependencies` 4 → 5** (`mermaid@11.16.0`, the first since M6) and
**`permissions: []` intact throughout**.
**★ THE MILESTONE'S CENTRAL ENGINEERING FACT: a ~3.3 MB engine shipped without one byte of it reaching
the gated content-script path** — 99 lazy chunks / 3,347,306 B behind a single `import()`, with the
content script up **+3,076 B** for its own named features, decomposed to a **0 B residual**. ★ **And the
fence that proves it was RE-FOUNDED mid-milestone: the byte reading is a COINCIDENCE-DETECTOR.** 3.4
measured that a scratch content-script import of `diagramEnhancer` builds to a **byte-identical** content
script (315,974 B, same md5, `grep -c mermaid` still 0) — **the byte fence calls the architectural
violation green** — so the guarantee is now a **source-graph reachability assertion** (8/8), with the
app-page graph as its control in the same run.
**★ THE OTHER FACT WORTH CARRYING: D-7 WAS GREEN AND VACUOUS FOR THE ENTIRE MILESTONE.** Every theme test
asked *"did it re-render"*; none asked *"does it look different"*. The 9.1 human gate found the answer was
no — mermaid drew **one LIGHT picture at every theme**, byte-identical at dark and light — and the gate
found a second layout defect beside it. **Both were fixed before close; the score is 12/12, "caught at its
own gate" holds for both**, and the lesson (a test proves what it ASSERTS, not what it is NAMED) is the
retro's headline corollary. **The close reconcile (9.3) is itself on the record** — § Baselines'
*THE 9.3 RECONCILE RECORD* — including **what it deliberately did not do**: the 28 checkboxes are still
unticked and `spec-coverage.md`'s F2 is still pre-M7, both routed to a human in § Carried items.
→ narrative:
[archive § M7](progress-archive.md#m7--spec-007--mermaid-diagrams--diagram-cache-m7a--closed-2026-08-02)
· tasks:
`specs/007-mermaid-diagrams/tasks.md` (**gate-sealed: 28 boxes, none ticked, no landing notes — the
evidence is in the commit bodies and this file's folds**) · plan D-1…D-16:
`specs/007-mermaid-diagrams/plan.md` (sealed at gate 2) · decisions: `decisions.md` **2026-07-27**
(M7 direction; **GATE 2** + its four sub-decisions), **2026-07-28** (**GATE 3** approval + four of the six
mid-implementation amendments — `ff8f323` · `bddd5af` · `b19c068` · `16c7790`), **2026-07-30** (§4's
remote-reference closure `4061398` and the D-6 window finding) and **2026-08-01** (the six 8.4 gate
values) · lessons: `retro.md`
2026-08-02 (**a kickoff premise is a HYPOTHESIS — measure it before executing it**; a green suite can be
vacuous on the property that matters; the contract is the section body, not its preamble; the pointer
walk's trigger is any commit that changes state a pointer site asserts).

**M6 · spec 006 — snapshots + diff · CLOSED 2026-07-27.** Snapshot capture on the app page, bounded
retention (**count 15 / 20 MiB / 30 days**, D-8), a global erase control, a **persistent** capture
disclosure, and an inline line-diff against any stored snapshot — with **`permissions: []` still
intact**, the **FIRST `dependencies` addition since M1** (`diff@^9.0.0`, a governed act), `DB_VERSION`
2 → 3, and PERMISSIONS.md's *"file contents are never stored"* claim corrected **in the same commit as
the first stored byte** (1.4). Nine groups, **twenty planned tasks, ZERO discovered tasks** — but
**five unplanned recovery sessions the box list cannot see**, which is its own finding. The 9.1 gate
**PASSED and caught THREE layout defects plus a disclosure gap**, all fixed before close (`e231941`,
`8255380`); the first-paint gate was **re-baselined `<150` → `<165` ms** at the human's call.
**★ THE MILESTONE ALSO AUDITED ITS OWN PRIOR EVIDENCE HARD ENOUGH TO FIND IT HOLLOW — two formal
RETRACTIONS, a metric class M4 and M5 both scored zero on:** the import-fence grep proved nothing
(identifiers, minified bundle — the app chunk greps 0 too), and the coalescer never dropped anything
(a probe sampled once, unfalsifiable while the proposed byte bound clamped the count). Both retracted
claims were **unfalsifiable under the conditions they were measured in** — one defect class, not two.
→ narrative:
[archive § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27) · tasks:
`specs/006-snapshots-diff/tasks.md` · decisions: `decisions.md` 2026-07-22/23/26 (D-1…D-16, the bound
values, the gate re-baseline) and 2026-07-27 (the §6 side-quest + the §6-17 correction) · lessons:
`retro.md` 2026-07-27 (the two retractions as one class; **every empirical claim needs a positive
control that fires**; the gate-score arithmetic; the broken "none escaping" invariant; the pointer-walk
rule; the sibling-checklist audit).

**M5 · spec 005 — watch mode · CLOSED 2026-07-21.** The Phase-1 differentiator: **watch a chosen local
markdown file and re-render it in place while an agent rewrites it**, both engines, both surfaces, with
**`permissions: []` intact**, **no new dependency** (still three) and **no file contents stored** — so
PERMISSIONS.md's *"file contents are never stored"* claim stayed TRUE throughout. Seven groups **plus five
discovered tasks**. **SPLIT AT THE PLAN GATE (D-1): 005 = watch; 006 = snapshots + diff.** Detection is a
measured **2×2, not a per-engine split**: Chromium's app page is event-driven (`FileSystemObserver` over a
real handle), everything else polls and compares **content**, because on Firefox's drag path
`size`/`lastModified` are frozen at drop time. **Firefox watch is app-page-only** — a background
`fetch("file://…")` throws under Gecko's URI security policy and no permission grants it. Continuity is
**anchor-based, not `scrollTop`-based** (D-3), which is why **`mount()` stopped being the read-only
library four milestones had treated it as** — additive, defaulted-off, both directions red-first proven.
**★ THE FACT TO CARRY: the 7.1 gate caught a shipping defect (4.8) in the first five minutes, on the
first item checked, on the surface the automated stack provably cannot reach** — watch on the
content-script `file://` surface detected every change and rendered **none** of them. **The score moved to
7/7** *(the running total AT M5's CLOSE; it is **10/10** now — see the score paragraph below)*, its first
move since M3, confirming M4's keep-the-gate reasoning **by instance**: the item M4 kept
*because nothing else could observe it* is the item that caught the defect. The gate's other output was a
**product judgement, not a defect** — the pill is not discoverable, shipped as-is and carried.
→ narrative:
[archive § M5](progress-archive.md#m5--spec-005--watch-mode--closed-2026-07-21) · decisions:
`decisions.md` 2026-07-19 (Firefox `file://` · the harness ledger) and 2026-07-21 (the cooldown; the
WXT-entrypoint rule; the 5.1a confirmation; the pill; the instrument rules; `fileParallelism`) · lessons:
`retro.md` 2026-07-21 (the **built-tested-and-wired-to-nothing** defect class; red-first is a count and a
reason; "it's the harness" needs an isolating variable; layout MOVED not ADDED; the `mount()`-boundary
answer).

**M4 · spec 004 — themes + settings · CLOSED 2026-07-19.** Auto/light/dark (sepia deferred, D-1),
persisted in the existing IndexedDB with **`permissions: []` still intact**, applied coherently across the
app shell and **both** reader surfaces through one theme-host registry, plus the 003 TOC rail's state
carried over as a global preference. Eight groups. **The headline result is a NEGATIVE one and it is the
milestone's best work:** group 4 built the paint gate D-2 specified, measured it, found it breached the
<150 ms budget on **every cold typical-doc open** by a cost **insensitive to the deadline** (75 ms →
172.7 ms; 40 ms → 172.9 ms), and **deleted it** — shipping D-2's own recorded fallback. The 8.1 gate
PASSED **with no defects found** — the first milestone whose gate found nothing, which the retro answers
rather than celebrates (verdict: **discipline-dominant**; the boundary moved for *coherence*, not for
*appearance*, so **the gate stays load-bearing**). It also discharged the three items groups 6–7 deferred
into it. → narrative:
[archive § M4](progress-archive.md#m4--spec-004--themes--settings--closed-2026-07-19) · decisions:
`decisions.md` 2026-07-18 (D-2 + its correction of record) and 2026-07-19 (stored-vs-applied split; the
three promoted entries) · lessons: `retro.md` 2026-07-19 (the **vacuous persistence test** defect class;
inference-does-not-survive-configuration; pin scope; the harness-honesty loop; the `git checkout`
process failure).

**M3 · spec 003 — TOC / navigation · CLOSED 2026-07-17.** An in-reader right-side table-of-contents rail
serving **both** reader surfaces from one `mount()`-seam compose: pure `buildTocModel` + `buildTocView`,
click/Enter scroll by element ref, host-rooted scroll-spy, backtick toggle, pointer-drag resize.
`permissions: []` intact, zero network on every TOC action. The 6.2 human gate caught **1 real defect** a
158-test green real-engine stack missed — the rail rendered fully **TRANSPARENT** with the column
reserving no room for it — establishing the **"visual occlusion is gate-only"** defect class that every
milestone since plans around. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-16/17 · lessons: `retro.md` 2026-07-17.

**M2 · spec 002 — active-source foundation · CLOSED 2026-07-15.** Peekover's second surface — a dedicated
full-tab app page that reads a chosen folder of markdown from disk — shipped **without spending a single
manifest permission** (folder access via user-gesture web APIs; consent is at-use, visible, revocable).
The `FolderSource → MarkdownFile[]` seam is the one engine boundary; everything above it is
engine-agnostic. The 6.3 human gate caught **3** defects the green stack missed (containment ·
drag-navigation · the storage-UI gap). → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-15 · lessons: `retro.md` 2026-07-15.

**M1 · spec 001 — core render pipeline · CLOSED 2026-07-14.** The reader itself: detect → hide-raw →
mount → parse → markdown-it/GFM → DOMPurify → shadow-DOM themed reading → Raw toggle →
block-remote-media → never-blank fallback, on Chrome + Firefox, `permissions: []`, ~270 KB packed. Its
gate caught **2** defects, both invisible to jsdom: a pre-opt-in remote-image **fetch leak** (the
"a detached node doesn't fetch" assumption is FALSE — the safe property is an *inert* document) and the
Firefox mount-timing regression. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-14 · lessons: `retro.md` 2026-07-14.

**The human-gate score: 12/12, and M8 adds ZERO to the numerator** *(was 10/10 through M6; **9.1 moved
it**, and the dark-mode fix task moved it once more — see below; M8's 6.1 walk found two presentation
findings, filed and carried, matching M4's shape — a clean gate about a genuinely clean build, not a
gate that missed something)* — M1:2 + M2:3 +
M3:1 + M4:0 + M5:1 + **M6:3** + **M7:2** + **M8:0**. **M7's two are 9.1's dark-mode diagram-text defect** — caught at
its own gate on the surface no test reaches — **and the gantt date-axis overprint**. **The "SO FAR" HEDGE
IS RETIRED: 9.1 is COMPLETE** — all eight items walked, item 7 (app-page responsiveness) PASSED — **so the
gate itself can contribute nothing further.** ★ **The one named way it could still move HAS MOVED, exactly
as pre-registered:** the overprint was carried as an open sub-question and *"if the dark-mode fix task
confirms it as a distinct defect, M7 becomes 2 and the score 12/12"*. **It did** — the sparse
`diagrams-10` gantt overprints as badly as the dense one, at both themes on both engines, from a
measuring-container width of 0 (§ Carried items has the mechanism). **So M7:2 and 12/12, and this figure
is now final:** the prediction was resolved by measurement rather than left standing. The score counts
**DEFECTS, not milestones**, which is what 9.1's own "8/8" got wrong: its landing block says *"M6
contributes THREE"* and then writes 8/8, contradicting itself. **7 + 3 = 10.** (On the stricter
denominator that also counts the Firefox app-page disclosure gap the 9.1 walk closed it is 11/11; prior
milestones did not count copy gaps, so 10/10 is the like-for-like figure — **stating the denominator's
definition is the point**.)

**★ BUT "NONE ESCAPING" IS NO LONGER TRUE, AND THE QUALIFICATION MATTERS MORE THAN THE NUMBER.** For
five milestones this section read *"all N caught by the milestone-close gate, NONE escaping it."*
**M6's finding A — the reader right-aligning against the TOC rail on wide viewports — ships on BOTH
surfaces and has done SINCE M3**, present and missed at **M3's, M4's and M5's close gates**. So: **nine
of ten were caught at their own gate; one escaped three.** M4's clean gate therefore has a known miss —
its retro's *discipline-dominant* verdict still stands **for what M4 built**, but the gate was not clean
about the shipped product. *A clean gate is evidence about the BUILD, not about the GATE* was M4's own
caveat (retro 2026-07-19); **M6 is where it cashed out.** The mechanical cause is fixable and named:
**no gate record on any milestone states the walk's VIEWPORT** — engine and surface are recorded every
time, the dimension that decides whether a layout defect is visible is not. **Standing rule: a gate walk
records its viewport(s) the way it records its engines, and a milestone shipping positioned chrome walks
at least one WIDE viewport deliberately** (`retro.md` 2026-07-27, finding 2).

**Read the ratio precisely either way:** it says every *known* shipping defect was caught at some gate,
not that the gate catches everything — the denominator only counts what someone eventually found.
**M5 remains the sharpest instance FOR the gate:** task 4.8 was found in the **first five minutes, on
the first item checked, on the surface the automated stack provably cannot reach** (no test on any
milestone has ever exercised the real content→background transport).

**Product progress (rough):** M1 opened build-order phase 1-of-7 (product spec §11). Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch · 006 snapshots+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly
this is early foundation, **~sixth of ~12+ spec-milestones**. Don't over-read the fraction.
**The sharper number is now measured rather than guessed:** [`spec-coverage.md`](spec-coverage.md) puts
the whole spec at **~28%** (re-derived at M8's 6.3, up from ~26% pre-M8 — F5 and F6 moved, six rows
total). **Persona #1's ~56% is now STALE INPUT, not a current reading** — M8 shipped three of the
sub-items its own 18-item enumeration counts (the badge, sort+filter, copy), but 56% is a **human walk's
answer to a scoping question** (is app-page-only a boundary or a gap?), not row arithmetic, and that walk
has not re-run against M8's shipped code. Do not quote 56% as current, and do not compute a replacement
from the row deltas — re-walk it. Prefer `spec-coverage.md` to this paragraph when scoping.

## Baselines / pins
*Current measured truth. **The ARTIFACT rows and SUITE counts were transcribed 2026-08-22 at HEAD
`174b94a` by 009 task 9.3 (the M9 close reconcile) FROM 8.6's own fresh bundle-verify-gate — NOT
re-rebuilt at 9.3.** 8.6 is the last commit touching `src/`; its own clean rebuild already measured
these figures, and 9.1/9.2 are both doc-only and confirmed byte-identical at each one's own close — 9.3
declines the redundant rebuild the way its own Verify line permits ("carries re-run numbers or states
plainly it did not, and why"). **The APP-PAGE FIRST-PAINT row is BANKED at 9.3 (Ruling 4)**, from 8.2's
own A-B-A reading against 2.2's pre-Shiki floor — both already-measured, not re-run here. **The
CONTENT-SCRIPT first-paint, diagram-bearing and 1 MB/TOC rows are UNTOUCHED by M9** (009 never touches
the content-script render path or the diagram fixtures) and are carried forward exactly as 008 task 6.3
left them; the diagram-bearing/1 MB rows are now FOUR milestones' distance from their last measurement
(007 task 8.1, 2026-07-31, `4c580c4`) — named rather than left to imply currency; see the ⚠ provenance
note under the table.*
*This section is MUTABLE — each milestone's close task overwrites the numbers and moves the previous ones
into the "vs" column. It lives here, not in decisions.md, because decisions.md is dated append-only and a
current-numbers table cannot be corrected there without either lying or duplicating.*
*⚠ **"8.1" IS AMBIGUOUS IN THIS FILE AND THE COLLISION IS REAL.** The M6 table's *"vs 8.1's record"*
column meant **spec-005 task 8.1**. Everything dated 2026-07-31 below is **spec-007 task 8.1**. Where the
distinction matters the milestone is named; a bare "8.1" in the M6 prose belongs to 005.*
*Per-milestone historical pins, and the whole M6-close § Baselines verbatim, are in
[`progress-archive.md` § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27). The
M7-close § Baselines (the D-8/D-9 bounds measurement, the D-11 placeholder record, the 9.1 walk record
and the 9.3 reconcile record) moved the same way in this pass — see
[`progress-archive.md` § M7](progress-archive.md#m7--spec-007--mermaid-diagrams--diagram-cache-m7a--closed-2026-08-02).*

**★ WHY THIS TABLE WAS RE-MEASURED (007 8.1) AND WHAT "0 DELTA" TURNED OUT TO MEAN.** The table below is
**every figure re-run against the BUILT ARTIFACT at `4c580c4`**, not carried forward and not computed.
The M6 table above it had gone stale in exactly the way `retro.md` 2026-07-27 finding 3 predicted — five
M7 commits moved bytes it still described. **007 §8.1's own text asks for "content-script bytes vs
315,671 B — MUST be 0 delta"; the measured delta is +3,076 B and that clause is a STALE BASELINE, not a
breach.** The distinction is not a convenience: §8.1's fence is *the diagram engine contributes nothing
to the gated path*, and that is tested **by ablation**, which passes exactly (below). The +3,076 B is
five named, previously-recorded content-script features, **decomposed to a residual of 0 B**. Growth that
every task recorded as it landed is accounted growth. See *THE M7 BYTE LEDGER*.

| pin | now | vs prior pin *(first-paint rows: M8's own pre-implementation reading, `757f953`, 2026-08-03; artifact/suite rows: M7 close, `94f7da5`)* | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) — **CONTENT SCRIPT** *(008 task 5.1, quiesced A-B-A, HEAD `bdcb2ad` — bytes unchanged since 5.1 — **the current reading, NOT re-run at 6.3**)* | **149.7 / 146.3 ms** medians (2 reach-IN arms), floors **145.7 / 143.4 ms**; **+ a 3rd, non-interleaved shipped-harness reading (6.2): 155.4 ms median, 145.2 ms floor** | 138.1 / 134.3 / 137.0 ms medians, floors 135.1 / 132.6 / 134.7 ms | **<165 ms GATE** | **PASS, all readings — the M8 table-tools reach costs +8.9 ms median / +11.1 ms floor against a 26.9 / 29.9 ms budget (008 task 5.1); worst-arm headroom now 15.3 ms (median) / 19.3 ms (floor)** |
| ↳ *the pin this row supersedes, kept not overwritten* — First paint, typical doc *(RE-MEASURED 2026-08-03, HEAD `757f953`, quiesced — M8's pre-implementation reading)* | **138.1 / 134.3 / 137.0 ms** medians, floors **135.1 / 132.6 / 134.7 ms** (3 arms; A-vs-A 3.8 ms median / 2.5 ms floor) | 133.7 ms / floor 132.1 ms | **<165 ms GATE** | PASS, all 3 arms — worst-arm headroom 26.9 ms (median) / 29.9 ms (floor), **consumed 33-41% by M8's reach, per 5.1** |
| First paint, typical doc (50.4 KB) — **APP PAGE, POST-SHIKI** *(009 task 8.2, HEAD `a44e17f`, A-B-A within M9 against 2.2's pre-Shiki floor, 3 back-to-back runs)* | **90.8–96.3 ms** medians, floors **86.2–88.1 ms** (A-vs-A floor spread **1.9 ms**, median spread **5.5 ms**, same order of magnitude as 2.2's own precedent) | 89.2 / 89.3 ms medians, floors 84.8 / 86.8 ms (2.2, pre-Shiki) — **delta flat, inside the same noise band** | **<165 ms** (~69–79 ms median headroom, ~77–79 ms floor headroom) | **PASS, BANKED AS THE STANDING BASELINE (Ruling 4, confirmed at 9.3).** Two independent numeric A-B-A readings (2.2, 8.2) agree within noise; 9.1's walk-time confirmation is subjective, not a third numeric run — the honest gap 9.2 retro finding 7 names, not smoothed. |
| ↳ *the pin this row supersedes, kept not overwritten* — First paint, typical doc — **APP PAGE, FIRST EVER READING** *(009 task 2.2, HEAD `7c5d05b`, `__peekoverHarness` seam + OPFS handle, quiesced, pre-Shiki)* | **89.2 / 89.3 ms** medians, floors **84.8 / 86.8 ms** (A-vs-A **0.1 ms median / 2.0 ms floor**) | *(no prior pin — this WAS the baseline)* | **<165 ms** (printed for reference) | Superseded by 8.2's post-Shiki reading above; served as M-2's pre-Shiki floor in the interim, per 8.2's own A-B-A. |
| First paint, diagram-bearing (51.7 KB, 10 fences) *(8.1, `4c580c4` — **NOT re-run at 9.3, not at 6.3, not at the 2026-08-03 redline — now FOUR milestones' distance; 009 never touches the diagram render path**)* | **157.6 ms** median, **floor 146.7 ms** | *(unchanged pin)* | **<165 ms GATE** | **PASS as last measured — see the vacuity note; the app-page instrument hole (D-11 (iii)) still means this number is not re-derivable on demand** |
| First paint, 1 MB / ~1400-entry TOC *(8.1, `4c580c4` — value **NOT re-derived at 9.3, at 6.3, or at the redline**)* | **1304.8 ms**, floor 1267.6 ms | 1188.5 ms (**+116.3, +9.8%**) | <1.7 s (informational) | PASS as last measured |
| Content script (`content-scripts/peekover.js`) *(★ M11 8.3-R close, fresh `rm -rf .output` rebuild, HEAD `6eff5dc`)* | **340,492 B** both engines, md5 `bcdcf231…` Cr / `49e218a1…` Fx — 3.2-R's own landed floor, unmoved since | 334,858 B (M9 8.6 close — **M10 never updated this row; the M9→M11 delta of +5,634 B bundles M10's own D-1…D-10 changes with M11's D-1-R tokenizer floor (+3,959 B) undifferentiated — named as a gap in this table's own upkeep, not re-derived here**) | none — **stated, not gated** | — |
| App-page chunk *(★ M11 8.3-R close — no single eager `app-*.js` chunk name is stable across this milestone's own dynamic-import-heavy math/diagram/code chunk graph; see `.output` total row below instead)* | *(superseded by the `.output` total row — a per-chunk row stopped being the useful unit once M11 added the lazy `temml`/font chunks)* | 475,579 B (M9 8.6 close, stale) | none — **stated, not gated** | — |
| Background (`background.js`) *(★ M11 8.3-R close, same rebuild)* | **3,548 B** both engines | 3,548 B (M9 8.6 close, **unmoved across M10 and M11 — the one row this table's own M10 gap does not affect**) | none — **stated, not gated** | — |
| Built manifests, Chrome / Firefox *(★ M11 8.3-R close, same rebuild)* | **654 / 770 B**, `permissions: []` and no `web_accessible_resources` on both, no `contextMenus` | 654 / 770 B (M9 8.6 close, **unmoved across M10 and M11**) | — | — |
| `pnpm zip` Chrome / Firefox *(★ M11 8.3-R close, same rebuild)* | **1,632,857 / ~1,632,900 B** (~1.63 MB) | 1,470,730 / 1,470,788 B (M9 8.6 close — **the M9→M11 delta bundles M10's export code with M11's temml/font/sanitizer weight, undifferentiated, same named gap as the content-script row**) | **<2 MB** | **PASS — headroom ~461.8/461.7 KiB** |
| Packed unzipped (`.output/<engine>`) *(★ M11 8.3-R close, same rebuild)* | **5,197,425 / 5,197,541 B** | 4,866,741 / 4,866,857 B (M9 8.6 close, same undifferentiated-gap caveat as above) | **≤5 MiB** (AGENTS.md) | **PASS — headroom ~44.4/44.3 KiB (~0.85% free) — the THINNEST headroom any milestone close has carried, ~90% of M11's own 1.1-R-measured starting headroom spent** |
| Suites *(★ M11 8.3-R close — unit re-run fresh at HEAD `6eff5dc`; browser count carried from the §8-1(b) fix, `63aedb4`, confirmed unchanged by `git diff --stat` through HEAD)* | **1145 unit** (66 files) — **1143 passed, 2 failed** (`pipeline.perf.test.ts`/`golden.test.ts`'s own confirmed-pre-existing wall-clock flakes, both pass in isolation — the milestone's own "suite green" claim carries this caveat, not rounded away) · **164 browser files, 1663 passed, 15 skipped, 0 failed** (green in ONE pass, repeatably — rule-9 hardening) | 1042 unit (61 files) / 134 browser files, 1395 passed (M9 8.6 close) | — | **green, WITH the unit-suite caveat stated** |

**★ THE M8 FIRST-PAINT PRICE, SUMMARIZED HERE SO THIS SECTION STAYS SELF-CONTAINED (full protocol and
per-arm detail: § Now, task 5.1).** 5.1 ran 8.1's own quiesced A-B-A protocol — `A` = HEAD's build, `B`
= the same tree with D-6's content-script sites 3/4 and their imports removed — on the gated 50.4 KB
fixture, and read the reach's cost off the DIFFERENCE, not off a single build's absolute number:
**+8.9 ms median / +11.1 ms floor**, against the standing **26.9 ms / 29.9 ms** worst-arm headroom the
2026-08-03 pre-implementation reading set — **33–41% of the budget, on every one of four readings**.
6.2's retro folded in a third, non-interleaved confirmation with the shipped harness (`pnpm perf --
size 50kb`): **155.4 ms median / 145.2 ms floor**, whose floor sits 0.5 ms from 5.1's own worst floor
arm and whose median sits 5.7 ms above it — read as a warning about the median's session-to-session
noise, not a fourth A arm (it was not interleaved). **The floor is the load-bearing statistic**, and it
agrees within 0.5 ms across both measurements. Content script byte-identical throughout 5.1→6.2→6.3
(329,233 B both engines), so all three readings describe the same shipped bytes.

**⚠ PER-ROW PROVENANCE IS NOW EXPLICIT, AND THE SPLIT IS THE POINT (007 task 9.3).** The header used to
date the WHOLE table to 8.1 / `4c580c4`; after 9.3 that is true of the first-paint rows ONLY. **Why the
first-paint rows were not re-run, stated plainly as §9.3's Verify requires:** 8.1's own protocol is an
**A-B-A against a same-session baseline plus the 1 MB machine-state discriminator**, and at 8.1 it
returned a **NEGATIVE verdict — A disagreed with A by 13.4 ms on the floor**, larger than any delta it
was asked to adjudicate. Worst-arm headroom against the <165 ms gate is **1.8 ms**. A single un-quiesced
`pnpm perf` run in a reconcile session that had just built both engines twice, zipped twice and run the
full browser suite would produce a number **this table could not honestly print** — and printing a false
red or a false green into a gated row is worse than carrying a dated one. **★ AND THESE ROWS ARE NOT
MERELY OLD — SAY IT RATHER THAN IMPLY IT: `662b90e` ADDED A PER-RENDER `initialize()` CALL INSIDE THE
CACHE-MISS BRANCH**, so the diagram path genuinely changed after these numbers were taken. **9.3 itself
changed no code** (doc-only), but it cannot claim these three rows still hold — it can only date them
honestly. **The re-measurement is OWED, and it is owed to the diagram-bearing row in particular: the next
session that touches the render path runs 8.1's full protocol on a quiesced machine.** It is not owed to
9.3, which has no instrument that would make the answer trustworthy.

**★ THE NOTE ABOVE IS KEPT VERBATIM AND ITS INFERENCE IS CORRECTED (2026-08-03).** Its *facts* hold — the
rows were dated honestly, and `662b90e` really did add a per-render `initialize()`. Its *inference* —
that this made the three first-paint rows describe a **superseded path** — is **falsified by the
re-measurement below**. `662b90e` is app-page-only, which **this very section already said** four
paragraphs down (*"Both post-gate fixes are app-page-only, which is why the content script never
moved"*), and `perf-first-paint.ts` can drive only the content script. The note was right to refuse to
print an un-quiesced number and right to call a re-measurement owed; it was wrong about **why**.

**★ THE 2026-08-03 FIRST-PAINT RE-MEASUREMENT — THE CONTENT-SCRIPT HEADROOM IS 26.9 ms, AND IT SUPERSEDES
1.8 ms AS A *NUMBER*, NOT AS A *PATH*.** Run at HEAD `757f953` on a quiesced machine under 8.1's own
protocol. Every commit between `94f7da5` and `757f953` is doc-only, so **the built content script is
byte-identical to 8.1's at `4c580c4`** — 318,747 B, both engines' md5s unchanged (the M7 ledger
continuation below records this independently). That byte-identity is not a footnote; it is the control
this whole reading rests on.

- **THE NUMBER.** Three A arms on the 50.4 KB typical doc: **A1 138.1 ms median / 135.1 ms floor · A2
  134.3 / 132.6 · A3 137.0 / 134.7**. **A-vs-A disagreement is 3.8 ms on the median and 2.5 ms on the
  floor** — against 8.1's 10.9 / 13.4 ms, which is the difference between an instrument that resolves and
  one that does not. All three arms PASS. **Worst-arm headroom against the <165 ms gate: 26.9 ms on the
  median, 29.9 ms on the floor.**
- **★ SO 1.8 ms WAS MACHINE-STATE, NOT A SUPERSEDED PATH — AND THIS IS A CORRECTION TO THIS FILE'S OWN
  REASONING, SAID PLAINLY RATHER THAN QUIETLY SWAPPED.** `662b90e` moved **app-chunk bytes ONLY**:
  content script **0 B**, both engines' md5s unchanged, and 007 §3.4's import fence asserts
  *structurally* that the content-script graph reaches neither `diagramEngine` nor `diagramEnhancer`. The
  per-render `initialize()` is real, but it sits on a path `perf-first-paint.ts` has never been able to
  drive. **So `662b90e` changed a path the 1.8 ms number never described, and the 1.8 ms number described
  a path `662b90e` never changed.** The instinct to re-measure was right and produced this number; the
  stated reason for it was wrong. A premise is a hypothesis, and a measurement killed this one.
- **THE FLOOR MOVED 145.3 → 132.6 ms, AND THE EXCEPTION TO *"A MOVED FLOOR IS CODE"* IS STATED, NOT
  ASSUMED** (M6 retro finding 8). −12.7 ms, **−8.7%**. The 1 MB machine-state discriminator moved the
  **same direction, −5.4%**; scaling 145.3 ms by that predicts ~137.5 ms against a measured 132.6 ms.
  **But the scaling is corroboration, not the control — BYTE-IDENTITY is:** the artifact under both
  readings is the same bytes with the same md5s, so there is no code delta that *could* have moved this
  floor. Finding 8's rule is not repealed; it is met by an ablation the calendar performed for us. **The
  ~4.9 ms residual beyond the machine's −5.4% is NOT resolved here** — it is larger than this session's
  2.5 ms floor A-vs-A, and it is named as unexplained rather than absorbed into a comfortable story.
- **THE STANDING *"quiesce before believing anything"* WARNING IS DISCHARGED FOR THIS READING AND STAYS
  STANDING FOR THE NEXT.** At 26.9 ms the worst-arm margin is no longer luck-shaped. It was thin at 8.1
  because the machine was slow, not because the code had grown — which is also why M6's 133.7 ms median
  and this session's 134.3–138.1 ms sit in the same band across a milestone that added 3,076 B.

**★ FINDING — THE APP-PAGE RENDER PATH HAS NO FIRST-PAINT INSTRUMENT AT ALL. THIS IS THE OTHER HALF OF
THE OWED NUMBER, IT IS THE MILESTONE'S CENTRAL CONSTRAINT, AND IT IS *ROUTED TO A HUMAN*, NOT RESOLVED
HERE.** The redline asked for one number. There are **two**, and only one was takeable.

- **8.1 already recorded the hole** — *"the claim §8.1 actually wants is testable only on the APP PAGE,
  which has zero automated first-paint coverage (plan §4-5) — carried unfixed"* (the vacuity bullet
  below). **This sharpens it:** it is not merely the diagram claim that is uncovered, it is **the app
  page's first paint outright** — and `662b90e`, the commit the redline's premise rested on, landed
  exactly **there**. The redline pointed at a real hole; it just named the wrong path as the measured one.
- **CHECKED AT HEAD, ALL SEVEN `perf-*` HARNESSES, AND NONE OF THEM MEASURES IT.** `perf-first-paint.ts`
  drives a real `file://` document — the **content script**, the only surface it can drive.
  `perf-diff.ts`, `perf-snapshot-capture.ts`, `perf-theme-flash.ts` and `perf-watch.ts` DO open
  `chrome-extension://<id>/app.html`, but each measures its own axis (diff, capture, theme flash, watch
  re-render), never the app page's first paint. `perf-toc.ts` and `perf-folder-tree.ts` run in
  **jsdom / node**, which has no layout and no paint at all.
- **WHY IT IS NOT A SMALL FIX.** Driving the app page's render requires a **user gesture** (the file
  picker), and the only programmatic seam — `__peekover.selectFile`, `entrypoints/app/main.ts:20` — is
  guarded by `import.meta.env.DEV` and therefore **stripped from the production build a harness would
  have to measure**. Measuring DEV bytes would not be measuring the gated artifact.
- **★ ROUTED, NOT RULED.** Whether M8 builds an app-page first-paint harness, or re-scopes §8-1's claim to
  what the content script can actually prove, is a **human call at the plan gate** — it trades a
  milestone's worth of instrument work against a QoL milestone's budget. **This record names the hole and
  stops.** Nothing here decides it.

**★ THE M7 BYTE LEDGER — EVERY BYTE ASSIGNED, BY BUILDING AT EVERY COMMIT.** Not reasoned from commit
bodies: a detached worktree at each of the 21 M7 commits, `wxt build` per commit, `wc -c` per artifact.
The instrument was validated first — the worktree at `d470ab2` reproduces **315,671 B / 361,500 B /
`app-CEHD9mSZ.js`** exactly, and at `4c580c4` reproduces the main tree's md5s exactly.

| commit | task | content script | app chunk | background |
|---|---|---|---|---|
| `d470ab2` → `367d051` | 1.1 · 1.2 · 1.3 · 2.1 · 2.2 · D-6 · option B | 315,671 (**0**) | 361,500 (**0**) | 3,435 (**0**) |
| `1e09164` | **3.1** synchronous prologue, D-12's two call sites | 315,974 (**+303**) | 362,293 (**+793**) | — |
| `763f94d` | **3.2** async render body | — | 370,387 (**+8,094**) | — |
| `eae7b08` | §4 source guard (app-page only) | — | 370,579 (**+192**) | — |
| `01339fd` | **4.2** DB_VERSION 4 + two diagram stores | 316,087 (**+113**) | 370,692 (**+113**) | 3,548 (**+113**) |
| `a3005db` | **4.3** cache + trust surface | — | 377,847 (**+7,155**) | — |
| `85d5cbc` | **5.1** D-7 re-theme | 316,122 (**+35**) | 379,044 (**+1,197**) | — |
| `a222af5` | **6.2** storage-unavailable degrade | — | 379,445 (**+401**) | — |
| `2a4884f` | **7.1** per-diagram copy/download | 317,337 (**+1,215**) | 384,710 (**+5,265**) | — |
| `6fa71a0` | **7.2** lightbox | 318,747 (**+1,410**) | 387,837 (**+3,127**) | — |
| `4c580c4` | **7.3** empirical permission re-proof (test-only) | — (**0**) | — (**0**) | — |
| | **TOTAL** | **+3,076** | **+26,337** | **+113** |

**The columns sum EXACTLY: 303+113+35+1,215+1,410 = 3,076 · 793+8,094+192+113+7,155+1,197+401+5,265+3,127
= 26,337. RESIDUAL 0 B in both — no unnamed byte.** Three corrections to the ledger this task inherited:
**(1)** 6.2 moved the **app chunk only** (+401), never the content script — it had been carried as a
content-script mover and is not one. **(2)** Two movers were unrecorded in the carried ledger: **3.1
(+303)** and **4.2 (+113)**. **(3)** `01339fd` is the one commit that moved **all three** artifacts by the
identical **+113 B** — the shared store module, reached from the content script, the app page and the
background alike.

**★ LEDGER CONTINUATION — THE THREE COMMITS THAT LANDED AFTER 8.1 (added by 007 task 9.3; the table above
is 8.1's dated build-at-every-commit measurement and is NOT edited).** The table stops at `4c580c4`
because that was HEAD when 8.1 ran. Three M7 commits landed after it, and the app-chunk row in § Baselines
moved with them — so the ledger is CONTINUED rather than left to disagree with the table it feeds. These
three figures are **taken from each commit's own recorded decomposition**, not re-derived by a worktree
build at 9.3, and that provenance is stated because it differs from the table above:

| commit | task | content script | app chunk | source of the figure |
|---|---|---|---|---|
| `c75a81d` | **8.5** chosen D-8 bounds, `PROPOSED_` framing stripped | 318,747 (**0**) | 387,837 (**0**) | commit body: whole `.output` tree 0 B, **ONE residual byte** at app-chunk offset 323,975 (`count:100`→`count:150`) |
| `662b90e` | post-gate FIX 1 — dark-mode diagram text (9.1 finding) | — (**0**) | 389,088 (**+1,251**) | commit body, decomposed to 0 residual: **+1,199** theme config data/code, **+52** import binding + the one `initialize()` call site |
| `fc3a142` | post-gate FIX 2 — gantt date-axis (9.1 finding, M7's 2nd defect) | — (**0**) | 389,143 (**+55**) | commit body: **54 B** literal + **1 B** separating comma |
| | **M7 TOTAL, `d470ab2` → `94f7da5`** | **318,747 (+3,076)** | **389,143 (+27,643)** | — |

**It closes to zero at 9.3's own measurement, which is what makes the continuation worth writing rather
than asserting.** App chunk: 387,837 + 0 + 1,251 + 55 = **389,143 B**, and 9.3's clean build reads
**389,143 B** — **residual 0**. Content script: three commits at 0 delta each, and 9.3 reads **318,747 B**
with **both engines' md5s unchanged from 8.1's** — residual 0. **The packed tree agrees independently:**
8.1's 4,058,587 B + 1,251 + 55 = **4,059,893 B**, and 9.3 measures **4,059,893 B** (Chrome) —
**the two post-gate fixes are the whole of the tree delta, with nothing unnamed.** *(Both post-gate fixes
are app-page-only, which is why the content script never moved: `diagramEngine` / `diagramEnhancer` are
off the content-script graph, asserted structurally by 3.4's import fence, not by the byte reading.)*

- **★ THE A-B-A RAN AND ITS VERDICT IS NEGATIVE: A DISAGREES WITH A, SO NO DIAGRAM DELTA WAS MEASURED
  HERE.** Same session, contiguous, same build — **A1 median 163.2 ms (floor 158.7) · B 157.6 ms (floor
  146.7) · A2 152.3 ms (floor 145.3)**. The **A-vs-A disagreement is 10.9 ms on the median and 13.4 ms on
  the floor**, which is *larger than the entire A-to-B difference* (A-mean 157.75 vs B 157.6 ≈ **0 ms**).
  §8.1 states the rule and it binds against its own author: **A disagrees with A ⇒ nothing measured here
  means anything.** No diagram-bearing first-paint cost is claimed in either direction. A drifted
  monotonically downward across the session (163.2 → 152.3), the signature of a warming machine, not of
  code.
- **THE GATE PASSES ON EVERY ARM AND THE HEADROOM IS NOW THIN.** 152.3 / 157.6 / 157.9 / 163.2 ms medians
  across four arms, all **< 165 ms**; worst-arm headroom **1.8 ms**. Against M6's 133.7 ms median /
  132.1 ms floor this reads +18.6 to +29.5 ms — **but that comparison is NOT licensed**, see the next
  bullet. **The standing warning is NOT repealed and is now load-bearing:** at ~2 ms of worst-arm
  headroom a passing median on a busy machine is luck, and the next session touching the render path must
  quiesce before believing anything.
- **THE 1 MB DISCRIMINATOR SAYS THE MACHINE IS SLOWER, NOT THAT THE CODE IS.** **1304.8 ms** (floor
  1267.6) against M6's 1188.5 ms — **+9.8%**. That is the protocol's machine-state control, and it moved.
  Scaling M6's 50 KB figures by the same 9.8% predicts ~146.8 ms median / ~145.1 ms floor; the measured
  floor is **145.3 ms**, i.e. **the floor lands on the machine-corrected prediction almost exactly**.
  **So the honest reading is: most and plausibly all of the 50 KB movement is the machine.** Any residual
  is smaller than this instrument's own 13.4 ms A-vs-A disagreement and is **not resolvable here.** The
  harness still prints `-> FAIL` on the 1 MB line because it compares that fixture against the
  *typical-doc* bar — the known false FAIL (plan §4-9), **carried unfixed**. Against its OWN <1.7 s bound:
  PASS.
- **★ THE DIAGRAM-BEARING ARM PASSES THE TEXT-PAINT GATE, AND IT IS **NOT** EVIDENCE THAT THE ENHANCEMENT
  IS POST-PAINT. A non-vacuity probe caught this.** §8.1 asks for the second gate *"because §3.3 puts the
  engine after the commit — a miss there means the enhancement is not actually post-paint."* Measuring it
  on the harness's surface reads **PASS (157.6 ms)** — and a probe of the resolved DOM shows
  **`{svg: 0, figures: 0, mermaidFences: 72}`: ZERO diagrams rendered.** That is correct behaviour, not a
  defect: **`enhanceDiagrams` is imported by `src/app/appShell.ts` and `src/app/readerPane.ts` only**, so
  the content-script surface — which is the ONLY surface `perf-first-paint.ts` can drive — never runs the
  enhancer at all, exactly as the ablation proves by bytes. The 10 fences paint as ordinary code blocks.
  **A "PASS" quoted from this arm as proof of post-paint enhancement would have been vacuous**, which is
  why the probe was written to fail loudly first (it did: `0/10 diagrams resolved`) rather than to
  confirm. **The claim §8.1 actually wants is testable only on the APP PAGE, which has zero automated
  first-paint coverage (plan §4-5) — carried unfixed, and stated as the weaker claim it is, never as
  "within budget".**
- **★ THE CONTENT-SCRIPT FENCE, IN ITS EXACT FORM — AND IT IS NOT CROSS-ENGINE md5 EQUALITY.** Wherever
  this file says *"md5-IDENTICAL both engines"* it means **each engine's md5 is unchanged task-over-task**,
  never that the two engines hash alike. **They do not and never have.** The fence has three parts:
  (i) **byte-LENGTH identical across engines** — 318,747 B both; (ii) **per-engine md5 stable** across a
  task that should move nothing — Chrome `c7b33b36b1a727fdacb77eefe64083e1`, Firefox
  `67717921bdf646c7366176392d0c37d7`; (iii) the two engines' scripts differ by **exactly ONE byte**.
  `cmp -l` this session: **one differing byte, 1-based position 315,471 (0-based offset 315,470)**, octal
  `60` vs `61` — `backgroundCanReadFileUrls:!0` (Chrome, true) vs `:!1` (Firefox, false), a pre-existing
  WXT capability flag. **The offset MOVES as the script grows** (312,846 pre-7.2 → 315,470 after 7.2's
  CSS; unchanged at 7.3, which shipped no production bytes) — so re-confirm it, never carry it.
- **★ THE "2975" IS A TEST-FILE SIZE. THE LABEL WAS WRONG; THE MEASUREMENT WAS NOT.** Carried to 8.1 and
  closed here. `wc -c tests/manifest.test.ts` = **2,975 B** — correct, and byte-unmodified since M2
  (`3b6c575`). The **BUILT** manifests are **654 B (Chrome) / 770 B (Firefox)**, `permissions: []` and no
  `web_accessible_resources` on both. Write it as **"test-file 2,975 B / built manifests 654 + 770 B"**;
  *"manifest green 2975 B"* conflates a test file with a shipped artifact that is **4.5× smaller**.
  **Nothing was re-measured to fix this — a correct number was given a wrong name.** ⚠ **The mislabel's
  SOURCE text is in `specs/007-mermaid-diagrams/tasks.md`** (§7.1/§7.2, and the same shorthand in every
  §8.x fence line). 8.1's Files list does not scope `tasks.md`, **so the source is NOT fixed here** —
  routed to **9.3**, which owns the doc reconcile.
- **Standing pins, all green this session:** `git diff tests/golden/output/` **EMPTY** ·
  `tests/manifest.test.ts` green, **test-file 2,975 B**, byte-unmodified since M2 (`3b6c575`) · **built
  manifests 654 B (Cr) / 770 B (Fx)**, `permissions: []` and no `web_accessible_resources` on both ·
  `diagramImportFence.test.ts` **8/8** · `pnpm lint` EXIT=0 · `vitest.config.ts` and `wxt.config.ts`
  unmodified.
- **★ THE ZIPS QUADRUPLED AND STILL PASS — THIS IS 8.4's HEADLINE, AND 8.1 CHOOSES NOTHING.**
  **1,299,871 B (Cr) / 1,299,930 B (Fx)** against M6's 349,744 / 349,803 — **+950,127 B each, +272%**,
  from mermaid's 99 lazy chunks, which **ship inside the package even though they never load in the
  content script**. Against `< 2 MB`: **PASS**, with **0.70 MB of headroom where M6 had 1.65 MB — 58% of
  the margin consumed by one milestone.** Unzipped the package is **4.06 MB against AGENTS.md's ≤5 MB**.
  **No disposition is taken here** — whether that headroom licenses shipping as-is, a subset build, or a
  stricter lazy-load boundary is **D-10's package-size question and it belongs to the 8.4 human gate**
  (which §8.4 already names). Recorded so 8.4 reads a number rather than an impression.
- **`pnpm zip` emits a THIRD artifact that is NOT the bound:** the Firefox run also writes
  `peekover-0.0.0-sources.zip` — **1,919,941 B this session** (`tests` 636 KB · `specs` 313 KB · `src`
  303 KB · `docs` 291 KB compressed). It is the archive AMO requires for review, not a shipped package;
  the <2 MB bound is on the extension zips. ⚠ **This reads 2.37 MB BELOW M6's recorded 4.29 MB while the
  repo only grew, and the gap is NOT reconciled.** The obvious hypothesis — that a populated `.output/`
  rode into it — was **tested and REFUTED**: re-zipping with a full build present gives the same
  1,919,941 B and **0 entries** under `.output`. What IS established is that the archive's contents vary
  with the checkout's shape (the same commit zipped from a detached worktree yields 1,279,322 B, omitting
  `tests/`), so a provenance difference is the likely class of explanation. **Stated rather than
  silently overwritten; the number is not gated in either direction.**
- **⚠ THE `pnpm zip -- -b firefox` TRAP IS STILL LIVE and was worked around again this session.** Use
  `pnpm exec wxt zip -b firefox`; the `--` form silently rebuilds and rezips **chrome**.

**★ THE IMPORT FENCE — THE GREP IS RETRACTED; THE FENCE HOLDS BY ABLATION.** Do not propagate the old
check. Every recorded *"content-script grep for `diffLines|jsdiff|computeDiff|enterDiff|…` = 0"* proved
**nothing**: those are identifiers, the bundle is minified, and the negative control nobody ran until 8.1
— grep the app-page chunk, which indisputably *does* contain the engine — **also returns 0**. The fence
was carried the whole time by the source-text allowlist in `diffEngine.test.ts`, which remains **the
architectural proof**. It was re-established at 8.1 by **controlled ablation**: removing the engine and
view left the content script **byte-identical (0 B, md5-identical, both engines)** and dropped the app
chunk **−9,481 B** — the diff feature's contribution to the gated path is not "small", it is **nil**.
Full ablation tables: archive § M6.

**Replacement heuristic for future measure-tasks — use literals that survive minification, and ALWAYS run
the negative control.** Re-verified this session against the current build:

| marker set | app chunk (CONTROL — must be >0) | content script (FENCE — must be 0) |
|---|---|---|
| `diff` pkg option props — `newlineIsToken\|stripTrailingCr\|ignoreWhitespace\|oneChangePerToken\|maxEditLength` | **12** ✓ fires | **0** ✓ |
| `diffView` strings — `diff could not be rendered\|no reader shadow root to show a diff in` | **2** ✓ fires | **0** ✓ |

Identical on **both engines**. **This is a heuristic, not a proof** — it depends on the minifier
preserving those literals, and a bundler upgrade could silently blunt it exactly as it blunted the old
one. **It is worth something only while its control fires; check that first, every time.** Note that
`peekover-diff` class names DO appear in the content script — **30 hits** for that literal, on both
engines — and this is **correct, not a breach**: `mount.ts` imports `diffChrome.ts` by design, and that
module reaches the engine only through
the `showDiff`/`hideDiff` closures the app page provisions. A fence grep must target the **engine and the
view**, never the string "diff". *(8.1 recorded **36** here under an unstated pattern; this pass measured
**30** for the literal `peekover-diff`. The gap is not reconciled — it is either the recovery commits'
CSS changes or a different pattern, and **the number is decoration either way**: it is the two marker
rows above, with their firing control, that carry the fence's evidence. Stated rather than silently
overwritten.)*

**★ 007 TASK 8.1 — THE ABLATION RE-RUN AGAINST THE PRODUCTION-WIRED GRAPH (D-10).** 1.3 measured a
*scratch-wired* graph; at `4c580c4` the engine is **really reachable**, so the fence is re-established
against the shipped thing. Method: sever the sole `import('mermaid')` in `src/render/diagramEngine.ts`
(→ `Promise.reject`), rebuild **both engines**, restore from a `cp` copy. Restored file md5
`dd79b2d40868f381930a2f18d6c9ff5d`, worktree clean after.

| arm | content script (FENCE — must not move) | app chunk | emitted chunk files | chunk bytes (CONTROL — must move) |
|---|---|---|---|---|
| HEAD `4c580c4` | **318,747 B** · Cr `c7b33b36…` Fx `67717921…` | 387,837 B | **100** | **3,735,143 B** |
| engine ablated | **318,747 B** · Cr `c7b33b36…` Fx `67717921…` | 385,777 B (−2,060) | **1** | **385,777 B (−3,349,366)** |

- **THE FENCE HOLDS AT FULL STRENGTH: the content script is byte- AND md5-identical on BOTH engines with
  mermaid removed entirely — 0 B of the engine reach the gated path.** *Byte-identical means it was never
  there.* **That null discriminates only because the control fired in the same run: −3,349,366 B and 99
  chunk files vanished.** The 99 chunks account for 3,349,366 − 2,060 = **3,347,306 B — reproducing 1.3's
  engine figure to the byte**, from a differently-wired graph.
- **THE `mermaid/package.json` INLINE IS STILL MATERIAL AND STILL NOT NARROWED.** Second ablation
  (stub the static `import pkg from 'mermaid/package.json'`): app chunk **387,837 → 384,019 B, −3,818 B**,
  confirming 1.3's 3,847 B (the 29 B gap is the stub's own literal). The bundler still inlines the WHOLE
  package object to carry a seven-character version string. **8.1 measures; it does not narrow.** The
  Vite `define` narrowing remains a **D-13/D-16 disposition for a later task.**
- **NOTHING SHIPS THAT SHOULD NOT.** Emitted non-chunk files: `app.html`, `background.js`,
  `content-scripts/peekover.js`, `manifest.json` — **and nothing else**. **Zero `.css` files** (mermaid
  carries its styles as JS strings inside the lazy chunks, already counted) · **zero `.map` files** ·
  **zero `__ablation` markers** in either production bundle.

**★ 007 TASK 1.3 — THE LAZY-CHUNK ABLATION (plan §7-1 RESOLVED). ABLATION / SCRATCH-WIRED FIGURES —
SUPERSEDED AS THE PRODUCTION FIGURE BY 8.1 ABOVE; RETAINED BECAUSE ITS DECOMPOSITION STILL STANDS. THE
M6 TABLE ABOVE WAS UNCHANGED BY THIS NOTE**, and that is a
measured fact rather than an intention: `diagramEngine.ts` is imported by nothing at HEAD, the scratch
`appShell.ts` reference existed only inside the measurement, and the restored file is md5-identical
(`b99512d3b9079b492910b553c21b4c34`) with the rebuild landing back on 315,671 B / 361,500 B
(`app-CEHD9mSZ.js`) on both engines. Chunking had never been exercised in this repo — zero dynamic
imports in `src/` before 1.2 — so it was measured before anything was allowed to depend on it.

- **(a) THE FENCE HOLDS, AND THE CONTROL FIRED IN THE SAME RUN.** With `diagramEngine` reachable from
  the app-page graph, `content-scripts/peekover.js` is **byte-identical: 315,671 B, md5 unchanged on
  both engines** (Chrome `c8251651d0ae3b348053a54c6ba2e4a4`, Firefox `b597b1b472ebb983f40b6d8ee11fd83c`)
  — *byte-identical means it was never there.* **That null is only worth something because the negative
  control moved in the same comparison: the app page gained +3,349,685 B** (5 emitted files → 104). A
  measurement reading 0 on both sides discriminates nothing — this is retraction A's disposition, and
  the fence is now carried by bytes rather than by a grep.
- **(b) EVERY BYTE OF THE APP-PAGE DELTA ASSIGNED.** +3,349,685 B total = **engine 3,347,306 B** (99
  lazy chunks: 591,209 B fetched with the core via the 20-entry `__vite__mapDeps`, 2,756,097 B in 79
  further-deferred per-diagram-type chunks) **+ app-chunk 2,379 B**. The app chunk decomposes exactly:
  **glue 1,971 B** (`__vitePreload` helper 1,192 · `__vite__mapDeps` table 741 · helper re-export 38) ·
  **`diagramEngine`'s own emitted code 375 B** · **scratch artifact 29 B** (`globalThis.__ablation_1_3=`,
  not production) · **residual 4 B, NAMED: a `var ` statement-boundary realign** (plus 22 single-char
  identifier renames, net 0). **CSS = 0 B** — no `.css` file is emitted at all; mermaid carries its
  styles as JS strings inside the lazy chunks, already counted in the engine block.
- **(c) A SEPARATE LAZY ASYNC CHUNK, NAMED AND REACHABLE — §10's guarantee holds.**
  `chunks/mermaid.core-D7K4dyvy.js` (**34,946 B**), reached by a real call site the bundler rewrote from
  the bare specifier: `()=>kd(()=>import("./mermaid.core-D7K4dyvy.js"),__vite__mapDeps([0…19]))`. **Not
  statically inlined** — the app chunk moved 2,379 B while the engine payload sits in 99 separate files,
  and mermaid's own `11.16.0` appears in `mermaid.core-*`, never in the app chunk. No bare specifier and
  no orphan chunk survive into the output, closing 1.2's second handoff item.
- **★ (b)'s NAMED LINE-ITEM — THE `mermaid/package.json` INLINE COSTS 3,847 B, AND IT IS MATERIAL.**
  1.2 handed this forward and it is now measured, isolated by a second ablation (retaining
  `engineVersion` as well moves the app chunk 363,879 → 367,788 B, +3,909 B = **package.json literal
  3,847** · `engineVersion()` accessor 32 · scratch artifact #2 30 · hash churn 0). The bundler inlines
  the WHOLE object — `description`, the `exports` map, `devDependencies`, `scripts` — to carry a
  seven-character version string, ~1.06% of the app chunk's own 361,500 B baseline and larger than the
  entire rest of the app-chunk delta combined. **NOT narrowed here: 1.3 measures, it does not decide.**
  A Vite `define` reading only `version` is the obvious narrowing and is a D-13/D-16 disposition for a
  later task, recorded so it is not lost.
- **(d) SCANNER GREEN WITH ITS SELF-TEST FIRING.** `check-dynamic-imports.ts` **EXIT=0** over 55 shipped
  files, and `--self-test` **EXIT=0** with **7 firing + 8 silent** cases — including the MUST_NOT_FIRE
  fixture *"bare-specifier lazy chunk"* that is exactly the shape 1.2 shipped. Scanner and
  `supply-chain.yml` byte-identical; no threshold asserted anywhere in this task.
- **STALENESS FOUND, ROUTED TO 9.3 RATHER THAN FIXED HERE (baseline reconciliation is 9.3's task):** the
  table above reads **549 unit (46 files)**; the suite is now **563 passed (48 files)** — `+14` cases from
  `diagramEngine.test.ts` (`1391118`) and `tests/sbomWalk.test.ts` (`1a202fd`). Every BYTE pin in the
  table re-measured true this session; only the suite row has drifted.
  **↳ CLOSED at 007 8.1** — the table at the top of this section is re-measured in full (suites now
  **728 unit / 51 files · 911 browser + 15 skipped / 98 file-instances**), so this routing to 9.3 is
  discharged. 9.3 still owns the `architecture.md` correction and the `tasks.md` "2975" mislabel.

**★ THE TWO 006 HARNESSES, RE-RUN THIS SESSION (`--no-build`). Neither emits an exit-code gate, by
design — they choose nothing.**

**`perf:snapshot-capture` — 7.3's chosen bounds still behave as reasoned.** Accumulation over 12
sequential edits through the production controller: **50 KB → 13 snapshots, 659.5 KB** (`2,3,…,13`;
mean 50.7 KB); **1 MB → 13 snapshots, 14.57 MB** (`2,3,…,13`; every snapshot 1.12 MB). **Neither bound
bites** — 13 < 15 and 14.57 MB < 20 MiB — reproducing 8.1 and 7.3 exactly. **`12 of 12 edits rendered`
at BOTH fixtures**, holding 8.1's discriminator fix (the retracted `9 of 12` was a sampled probe).
**Capture cost remains UNRESOLVABLE at both sizes and the harness says so itself:** 50 KB sync delta
**+7.5 ms** against a 24.4 ms within-arm spread; 1 MB **−5.3 ms** against a 199.3 ms spread — **the sign
flips between fixtures, which is the point. No delta here may be quoted as "the capture cost" in either
direction.** Isolated D-5 guard **2.5 µs / 55.0 µs** (a FLOOR on added work, measured hot — retro
finding 2's ~13× warning stands); awaited `storeSnapshot` **0.7 ms / 7.5 ms**, off the synchronous path
by construction. Non-vacuity held every run: ON captured 2 per run, OFF captured 0.
**STILL NOT OBSERVED and still out of this harness's reach: whether the count bound actually STOPS
growth at 15** — `EDIT_SEQUENCE` is 12, so decisions.md's *"~17 snapshots of 1 MB fit in 20 MiB"* remains
**reasoning, not measurement**.

**`perf:diff` — no movement against 8.1.** (a) engine **635.2 ms** (8.1: 587.5) · (b) parse+sanitize
**444.9 ms** (441.5) · (c) DOM **138.1 ms** *derived* (137.8) · (d) **TOTAL enter 1224.8 ms** (1202.2) ·
first scroll frame **388.5 ms**, settling to 73.6 / 54.3 / 59.2 / 52.9 ms. Fixture determinism holds to
the hunk across a third session: **5882 hunks (1961+ / 1961− / 1960=) → 5882 blocks on all 7 runs.**
(a)+(b)+(c) deliberately do **not** reconcile to (d) — (d) also carries two IDB round-trips, event
dispatch and the browser's own layout of the appended subtree, and that gap is left visible. **Memory
stays DIRECTIONAL ONLY** and the caveats are load-bearing (Chromium-only `performance.memory`, **V8 heap
only — DOM nodes are NOT counted**, GC-timing dependent, non-default flag): heap at rest **15.50 MB**;
before→after enter median **+22.68 MB across a −16.40 to +37.18 MB range**; net before→after-exit median
**+7.05 MB across a −41.46 to +37.57 MB range**. **The spread is printed beside every median precisely
because a single confident median here would be a fiction, and the net is NOT evidence of a clean
teardown.**

**⚠ TOOLING TRAP, recorded so the next session does not lose time to it: `pnpm zip -- -b firefox` SILENTLY
BUILDS CHROME.** There is no `zip:firefox` script; pnpm forwards the bare `--` as a literal argument and
wxt's CLI ignores what follows, so the command exits 0 having rebuilt and rezipped **chrome-mv3** — a
green run that produced the wrong artifact. **The correct invocation is `pnpm exec wxt zip -b firefox`**
(likewise `pnpm exec wxt build -b firefox`). The `pnpm perf -- --size 50kb` form is unaffected — `tsx`
ignores the bare `--`, which is why the perf harnesses never exposed this.

- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run
  1 discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from
  a measurement task** (standing M1 retro rule). **Signal-vs-noise is decided on the FLOOR, not the
  middle** — real added cost raises the floor; noise moves only the middle.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is
  untouched" is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and
  stayed empty through the 5.1 chrome addition. Before citing a pin as evidence, break the property and
  check it goes red (retro 2026-07-19, finding 3).
- **And a pin can be perfectly scoped and still be BLIND.** That is the other half, and it is M6's
  (retro 2026-07-27, finding 1): **every empirical claim needs a positive control that fires under the
  same conditions the negative claim disclaims.** Green tells you neither.

### Watch-mode numbers (spec 005 task 5.1, measured 2026-07-21 — `pnpm perf:watch`)
*Same machine and protocol as the table above. **NOT a gate**: no threshold is asserted. Re-run twice at
6.1 and the numbers did not move — **`perf-watch.ts` calls `mount()` and `observerDetector` directly and
never drives `watchController`, so it is structurally blind to 5.3's cooldown.** A moved number here would
have needed a different explanation than "the cooldown".*

**(b) RE-RENDER COST — production's own `mount(text, host, {preserveReading:true})`, real headless Chromium,
on the REAL content-script `<peekover-root>` and on the app page's `.peekover-app__reader` pane shape.**

| ms (median of warm 6) | 50 KB full-page | 50 KB contained | 1 MB full-page | 1 MB contained |
|---|---|---|---|---|
| **shipped mount, SYNCHRONOUS** | **34.9** | **35.7** | **717.3** | **713.9** |
| shipped, start → 2nd rAF | 49.8 | 49.7 | 811.5 | 806.3 |
| plain mount, synchronous (control) | 16.8 | 17.0 | 359.9 | 379.3 |
| plain, start → 2nd rAF (control) | 49.9 | 49.8 | 801.6 | 845.4 |
| parse+sanitize only | 12.5 | 12.7 | 266.8 | 261.6 |

- **READ THE TWO ROWS TOGETHER OR YOU WILL DRAW THE WRONG CONCLUSION.** Continuity doubles the SYNCHRONOUS
  block but adds **≈0 ms at 50 KB** and **nothing distinguishable from noise at 1 MB** (+9.9 full-page,
  −39.1 contained, against a plain-path spread of 793–908) to the **whole** unresponsive window.
  `restoreReadingAnchor` reads `getBoundingClientRect` after the commit and forces layout the plain path
  pays a frame later regardless. **Layout MOVED, not ADDED** — reproduced on the 6.1 re-runs, with the two
  surfaces moving in **opposite** directions (+24.1 / −24.8 ms), i.e. noise around zero.
- **Non-vacuity, proven per cell:** with the changed block INSERTED ABOVE, the shipped path moved the scroll
  box **2738 px** to hold the reader's place while the plain control moved it **0 px** — on both surfaces.
- **BOTH SURFACES NOW RE-RENDER, and this corrects what this section said before task 4.8.** The table's
  contained column governs the app page (`appShell.ts`), but the content script is **no longer** the
  never-re-rendering surface the pre-4.8 note described — it registers a real `createWatchController` too.
  Its cost is the full-page column.

**(a) OBSERVER LATENCY — programmatic write → `observerDetector` callback, no human in the loop.**

| | 50 KB | 1 MB |
|---|---|---|
| **close() → detector cb** | **18.7 ms** | **109.5 ms** |
| write (createWritable…close) | 2.2 ms | 4.2 ms |
| per-tick read (`getFile().text()`) | 0.6 ms | 2.4 ms |

- **★ THE INFERENCE IS CONFIRMED — MEASURED ON LOCAL DISK AT THE 7.1 GATE, 2026-07-21 (task 5.1a).** With
  a production build loaded and a real picker-opened folder rewritten from outside the browser: **a small
  file updates INSTANTLY; the 1 MB file updates in A FEW MILLISECONDS.** The OPFS numbers **did NOT
  under-predict local disk**, so 5.2's named revisit trigger did not fire.
- **THE TABLE'S PROVENANCE IS STILL OPFS and the confirmation does not overwrite it.** 18.7 / 109.5 ms
  were measured on **OPFS**, the only handle obtainable without a user gesture (`showDirectoryPicker`
  opens a native dialog Playwright cannot drive — recorded M2 limit); no local-disk number was faked then
  or invented now. **The gate instrument is COARSER than the harness instrument** — a human cannot resolve
  18.7 from 109.5 ms and did not try — so 5.1a confirms a **magnitude class**, not a rival figure. *(Why
  the confirmation was worth a task, and why it is the counter-example to retro finding 2: `decisions.md`
  2026-07-21.)*
- **The task-0 probe's 5127 ms is RETIRED** — it was human reaction time. Never quote it as a latency.
- **The 1 MB latency cell looks unstable and is not:** 5.1 read 109.5 ms, the 6.1 passes 130.4 / 126.4 ms,
  but the second pass's own spread is **100.5–132.7 ms**, a band *containing* 109.5. **50 KB is stable
  across all three passes (18.7 / 19.3 / 18.3)** — the control that makes the 1 MB band read as
  fixture-size variance rather than instrument drift.
- **CHROMIUM ONLY, twice over:** Playwright cannot load an extension into Firefox, and `FileSystemObserver`
  does not exist on Firefox (measured, task 1.2). Firefox's app-page watch (drag-opened folders) IS a
  shipped surface, so **its re-render cost is UNMEASURED** and evidenced only at 7.1.
- **Fidelity residual, stated:** the content script's isolated world exports nothing, so `perf-watch.ts`
  bundles the same SOURCE with esbuild (via `tsx`'s own dependency — no devDependency added) and evaluates
  it in the page. Production source, not the production build artifact; and the bundle's own registry holds
  no watch target, so the measured mount omits the watch pill. No measurement-only code ships.
