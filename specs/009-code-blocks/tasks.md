# Tasks 009 — Code Blocks: Shiki syntax highlighting, code themes, per-block toolbar (M9) — check off in order; add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews these against the plan and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M9 GATE 1** entry (`1ab8db5`). `plan.md` —*
*gate 2, banked in `decisions.md`'s **M9 GATE 2** entry (`beeb224`).*
*One commit per task (`-F` heredoc, `Co-Authored-By: Claude` trailer); the human reviews the pasted evidence and*
*pushes. Each capability gets its OWN real-engine test (`tests/browser/*`, Cr+Fx, red-first + non-vacuous) —*
*never a trailing "add tests" task. Layout, rAF, computed style, pointer geometry, bytes-on-wire, clipboard*
*availability, cross-context messaging and paint timing are jsdom-**BLIND**: proven in the real engine, never*
*in jsdom.*

**★ THE FOUR GATE-2 RULINGS — APPLIED HERE, NEVER RE-ARGUED.** Gate 2 is **banked**: `decisions.md`'s
**M9 GATE 2** entry (`2026-08-15`) approves `plan.md` as it stands at `40b4ed1`, confirms **D-1 … D-13**, rules
plan §8's four questions, and adds no scope instruction (unlike M8's gate 2, which split one task and re-scoped
another — nothing here needed either). Each ruling is applied **verbatim** below; none is a plan D-value and
none is re-decided here.
- **Ruling 1 · Q1, the harness (D-1) — APPROVED.** The capability-free, query-gated production seam
  (`entrypoints/app/main.ts`'s `__peekoverHarness` search-param check + `window.__peekoverHarness
  .openFromHandle` reusing the production `folderSourceFromHandle`) plus the Playwright driver mirroring
  `perf-first-paint.ts`, explicitly blessed as new production code for an automation need — permitted because
  it is capability-free by construction. **Noted in the ruling: this does NOT set a precedent for other
  automation seams** — each is its own decision. → **group 2.**
- **Ruling 2 · Q2, the `parse.ts` change (D-8) — APPROVED.** The additive, conditional fence-renderer override
  is the minimum viable fix for the spec's corrected §3.6/§7-3 premise, byte-identical for every existing
  fence, proven a no-op against all four golden fixtures. → **group 3.**
- **Ruling 3 · Q3, the D-3 engine revisit-when — CONFIRMED.** "Grammar/perf inadequacy discovered at
  measurement or walk" is the trigger to reconsider the WASM/Oniguruma path — not before, not never. → carried
  as a standing condition, re-stated at group 9's reconcile (9.3).
- **Ruling 4 · Q4, the harness output as a standing baseline — CONFIRMED YES.** D-1's harness first-paint
  number becomes a STANDING BASELINE future app-page work prices against, the way the content-script harness's
  26.9/29.9 ms headroom became 008's own input. → produced at group 2 (2.2), sanity-read at group 9's human
  gate (9.1), banked at the reconcile (9.3).

**Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **spec §3.1–§3.10**, sealed at gate 1: F3 in full, done-whole except §3.7 (auto-detection, measured-then-ruled)
  · §3.2 Shiki off the content-script static import graph · §3.3 progressive first paint, plain-code degrade ·
  §3.8 **app-page-only**, sealed at gate 1 (not routed here) · §3.10 dependency governance, confirmed in full.
- **plan D-1 … D-13**, sealed at gate 2. **Every task names the D-values it services.** ★ **Each D-value's
  `decisions.md` entry text is ALREADY WRITTEN in `plan.md` §0 and is applied VERBATIM — never re-authored —
  landing with the commit that implements it, never after** (plan §0's own rule; the 007 gate-2 (a) shape).
- **spec §6's IS-NOT list is a fence:** F4 (remote URLs, per-origin permissions, raw-Git rendering) · inline
  code spans · every other F-area · a new document-theme system · a standalone code-file viewer · auto-
  detection's *mechanism* (scoped in, chosen at §8) · the collapse threshold / default code theme /
  line-numbers-word-wrap defaults, each asserted from prose · the content-script surface's highlighting reach
  (**DECIDED: app-page-only**, not a deferral to re-open). **No task proposes any of them.**

**Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism (retro finding
9's own conclusion):**
- **Golden pin:** `git diff tests/golden/output/` **EMPTY**; the ONE exception is group 3's own regression
  fixture proving D-8's negative case, which is a pinned addition to the SUITE, not a change to any existing
  fixture's bytes (plan §2's Explicitly-NOT-touched list; the unit-level pin is the default, no new golden file
  unless 3.1 states otherwise).
- **Manifest pin:** `tests/manifest.test.ts` green and **2975 B, byte-unmodified**; `permissions: []` on **both
  built manifests**; `web_accessible_resources` **absent**. A needed manifest edit is an AGENTS.md #4 event and
  a **hard stop** — D-3's whole point is that this milestone never reaches one.
- **Content-script bytes — byte-identical THROUGH THIS ENTIRE MILESTONE, and that is a DECISION (§3.2/§3.8),
  never contingent.** Baseline **329,233 B**, both engines, re-confirmed at HEAD `beeb224`. Every group's task
  re-proves the content-script graph never reaches `codeEngine.ts`/`codeEnhancer.ts`/`codeView.ts` and imports
  no `shiki` specifier — structurally (D-2's fence), never by grep (the standing M6 retraction: an identifier
  grep over a minified bundle returns 0 whether or not the code shipped — and `diagramEngine.ts:12`'s own doc
  comment already contains the literal text "Shiki pattern," a live demonstration in this tree).
- **App-page bytes MOVE for the first time at group 4** (once the fence proves the graph reaches the engine);
  every delta from there is **stated with its baseline 399,646 B, decomposed, never asserted by grep**. `pnpm
  zip` baseline **1,306,513 / 1,306,571 B** (Chrome/Firefox). Full ablation-proven decomposition is **group 8's
  job (D-11/M-1)** — earlier tasks state raw deltas only and explicitly do not attempt the full accounting.
- **Revert-and-fail (finding 5) is the standard, not an option:** every regression test is verified red **with
  the defect's own signature in the defect's own units**. No revert-and-fail, task unfinished.
- **A positive control that FIRES (finding 1)**, named in the Verify line and asserted **in the same test**,
  under the same conditions the negative claim disclaims.
- **Perf: A-B-A against a same-session control, FLOOR reported beside MEDIAN** (finding 7), quiesced. ★ **The
  content-script 26.9 ms median / 29.9 ms floor headroom is an INPUT and is NOT re-measured** — 009 does not
  touch that surface at all. ★ **The app-page first-paint number this milestone produces (group 2) has NO
  prior floor to compare against** (plan §4 risk 2) — the first measurement IS the baseline; 009's own
  regression check is A-B-A **within this milestone** (pre-Shiki floor vs. post-Shiki, group 8's M-2), not
  against history that does not exist.
- **Two surfaces via `describe.each` EXCEPT where §3.8 collapses it to one:** the content-script reader carries
  **no** code-block affordance at all — group 4 asserts that absence with the app page as the control that
  fires in the same run (§3.11 row 2/3's shape), never a bare two-arm suite.
- **CSS rationale lives in the TypeScript doc comment ABOVE the template literal, never inside the string**
  (finding 9 — the minifier cannot strip what is inside the backticks; `readerCss.ts` is on **both** graphs).
  **Every token is verified against all three theme blocks before use** (`readerCss.ts:31-40` light, `:42-48`
  dark, `:50-51` sepia — ★ **sepia overrides ONLY `--paper`, `--ink`, `--accent`, `--accent-soft`, so
  `--code-bg` resolves to the LIGHT value (`#F1F1EB`) on sepia paper** — plan §1.4's own flagged finding, a
  walk judgement at group 9, never a silent substitution). **No `ch` unit in any layout-blocking property**
  (`margin`/`padding`/`transform`) — a monospace-heavy surface is exactly where it looks attractive; `max-width`
  is free (finding 6).
- **NUL check on any task that writes a control character** (D-8's HTML-escaping of fence-meta values is the
  one place this could arise): `tr -d -c '\000' < f | wc -c` **and** `python3 -c "print(open(F,'rb')
  .read().count(b'\x00'))"` — **both forms, every time**, never a grep. Control characters are written as the
  six visible characters backslash-u-0-0-0-0, never as an embedded byte.
- **No production dependency beyond the ONE governed addition (`shiki`, task 1.1):** `dependencies` moves
  **5 → 6 at 1.1 and stays exactly 6 for the rest of the milestone**, asserted not eyeballed. A second
  dependency appearing anywhere (including for M-3's local-model row, if chosen) is priced **explicitly at the
  ruling that chooses it** (spec §5), never folded in silently.
- **`docs/trust/PERMISSIONS.md` gains exactly ONE field name in the EXISTING settings row** (D-9, task 5.1) —
  no new row, nothing new stored. If a task needs more than that, it is a **stop-and-flag**.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit**; group 9's 9.3 is its final
  reconciliation. **Stage explicit paths — NEVER `git add -A` / `git add .`**

**★ THE §3.11 SIBLING-CHECKLIST AUDIT — ROUTED HERE, BEFORE THE FIRST TASK BELOW READS IT.** The audit is a
**discharged plan deliverable** (`plan.md` §3.11, 24 rows). `tasks.md` **consumes** it, and **no code-block
browser test is written before the row it discharges is read from it** (M6 retro finding 4, plan §6's one hard
sequencing constraint). Routing:
- rows 2, 3, 4 (INVERTS) → **4.1** · row 5 (toolbar clearance, both `GEOMETRY_WIDTHS`), 8, 11, 14 → **4.3** ·
  rows 15, 16, 17, 18, 19 (copy's `.ok` transition), 20, 24 (toolbar half) → **4.3** · row 22 → **4.4** ·
  row 12, 15 (collapse's `aria-expanded` half), 19 (collapse's transition half), 24 (collapse half) → **6.1** ·
  rows 1, 6, 7, 9, 10, 13, 21, 23 → **out**, with the reason stated inline at first use — **1** and **23**
  because §3.8 collapses this milestone to one surface (the content-script absence is row 2/3's own assertion,
  not a second describe.each arm) · **6** because a code block inherits `--reader-measure` like every other
  block-level element, no `max-width` of its own to assert · **7, 9, 10** because the toolbar is IN-FLOW inside
  the reading column, not a fixed-position chrome or a modal overlay — there is no lightbox and no out-of-flow
  band to compete with here · **13** because D-7 confirms toolbar state does **NOT** survive a re-mount
  (mirrors 008 D-9's identical structural argument) · **21** because §3.6 ships no modal, so 007's focus-trap
  baseline has nothing to extend here.

**Human-run items budgeted UP FRONT (plan §5, not discovered late) — enumerated in 9.1's Verify, not
rediscovered there:** whether the toolbar **reads as part of its block or as clutter above it** (008's
identical question, transplanted) · which code theme reads best (M-4) · the collapse threshold and the
line-numbers/word-wrap defaults (M-4's siblings) · **Firefox everything** · **zero unexpected network with the
Network tab open** · **at least one WIDE viewport recorded like an engine** (finding 2) · **D-1's harness
output itself**, the first app-page first-paint number this codebase has ever produced, read for sanity before
it becomes Ruling 4's standing baseline. **Plus one human decision gate:** 8.5 — M-3's mechanism, M-4's set.

---

## 1 — Foundation (D-3 · D-13 — the dependency ROOT: nothing highlights until the engine exists and is governed)

★ **FLAGGED DIVERGENCE FROM PLAN §6's LITERAL GROUP-1 TOUCHES LIST.** Plan §6 lists `codeImportFence.test.ts`
as a group-1 deliverable alongside `codeEngine.ts`. **Re-derived against the actual precedent in this tree:
it cannot be proven there.** `diagramImportFence.test.ts`'s clause B (`:35-38`, walked directly this session)
asserts the **app-page graph, rooted at `entrypoints/app/main.ts`, reaches `diagramEnhancer.ts`/
`diagramEngine.ts` by a REAL import edge** — the control that proves clause A's content-script absence is a
real absence, not a broken walk. That edge does not exist until an app-page call site actually imports the
enhancer. **007's own tasks.md confirms this was never a group-1 task**: `diagramEngine.ts` was built
**UNREACHABLE from any entrypoint** at task 1.2 (`specs/007-mermaid-diagrams/tasks.md:94-131`, verified this
session — its own Verify line states *"`diagramEngine.ts` is unreachable from any entrypoint at 1.2, so the
ablation needs a **scratch** app-page reference"*), and `diagramImportFence.test.ts` did not land until task
**3.4**, in the SAME task as the enhancer's cooldown constraint, AFTER both app-page call sites existed
(`git log --follow`, confirmed: `522a3fe test(diagrams): 3.4 — the cooldown constraint and the import fence`).
**009 follows the same mechanical shape, not the plan's literal group-1 file list**: `codeEngine.ts` is built
unreachable here, exactly as `diagramEngine.ts` was; `codeImportFence.test.ts`'s full four clauses land at
**4.5**, in the same task as the highlighting enhancer's cooldown constraint and the two call sites that make
clause B real. This is a plan §6-vs-tree decomposition seam the plan's own prose did not foresee (kickoff FLAG
category 3) — named here for gate-3 review, not silently patched.

- [x] **1.1 Install `shiki`, governed exactly as §3.10 specifies (D-13).** `shiki@4.4.3`, MIT, no
      `preinstall`/`postinstall` script, eight direct dependencies (`@shikijs/core`, `@shikijs/langs`,
      `@shikijs/themes`, `@shikijs/types`, `@shikijs/vscode-textmate`, `@shikijs/engine-oniguruma`,
      `@shikijs/engine-javascript`, `@types/hast`) — **both regex-engine sub-packages appear in the SBOM
      regardless of which one 009 imports** (D-13's own named-not-discovered-later point; `@shikijs/engine-
      oniguruma` is a transitive dependency of `shiki` itself, not something this milestone ever imports).
      `dependencies` moves **5 → 6**, the governed event.
      Files: `package.json` · `pnpm-lock.yaml`
      Verify: `Object.keys(pkg.dependencies).length === 6` and the sixth name is `shiki`, asserted not
      eyeballed. `pnpm audit --prod` clean at **0** advisories (blocking, §3.10, unchanged). Licence MIT,
      confirmed against the installed package, not memory. No `preinstall`/`postinstall` script on `shiki` or
      any of its eight direct dependencies. SBOM regenerated. ★ **Nothing imports `shiki` yet — both bundles
      stay `wc -c`-identical to HEAD (329,233 B CS / 399,646 B app), md5-identical, with the FIRING CONTROL
      that the instrument can see a change** (touch one byte in a reachable module, rebuild, md5 moves,
      revert) — a null reading that cannot move is not a measurement. Golden EMPTY · manifest green **2975 B**
      · `permissions: []` both engines. [D-13; §3.10]

- [x] **1.2 `codeEngine.ts` — the ONE importer, the JS-regex-engine choice locked at import time, the
      feature-detect gate, UNREACHABLE from any entrypoint (D-3).** `loadCodeEngine(root)`: `hasCodeFence(root)
      ? … : null` (the `diagramEngine.ts` shape, mirrored) — the dynamic `import('shiki/core')` is the ONE
      edge, evaluated only when a fence exists. `createHighlighterCore({ engine: createJavaScriptRegexEngine(),
      … })` — **never** the `shiki` package's top-level shorthand (`codeToHtml`/`createHighlighter`), which
      pulls the Oniguruma/WASM path by default (D-3). `shiki/package.json` (a version-only JSON leaf) is read
      the same way `mermaid/package.json` is at `diagramEngine.ts:77` — static, eager, no engine code.
      **`codeToTokens`'s exact return shape is confirmed against the INSTALLED 4.4.3 here**, before
      `codeEnhancer.ts` is written against it (plan risk 4) — a smoke unit capturing the real structure
      (line/token arrays, colour/font-style fields), not the version this plan's own research session's docs
      described.
      Files: `src/render/codeEngine.ts` · `src/render/codeEngine.test.ts`
      Verify: (**unit**) the fence predicate matches `pre > code[class^="language-"]` and nothing else; a
      fence-free root ⇒ the loader is **never invoked** — an injectable spy, call count asserted (an un-called
      spy and a missing spy look identical, retro finding 1). ★ **The configured engine is asserted directly as
      `createJavaScriptRegexEngine`, never the default** — a fixture that swaps in the default Oniguruma engine
      must fail this assertion, proving the choice is load-bearing, not incidental. `codeToTokens`'s captured
      shape is pasted into the task report as the ground truth `codeEnhancer.ts` (group 4) is written against.
      ★ **Byte cost, ablated via a SCRATCH reference — the 007 1.2 precedent exactly**, because the module is
      unreachable: `cp appShell.ts` aside FIRST; add a throwaway `import './codeEngine'` reference; build;
      measure the app-chunk delta; remove the scratch reference; rebuild; confirm `appShell.ts` restored
      **md5-identical** to the pre-task copy. **This is a diagnostic data point for group 8's D-11 accounting,
      not the final M-1 number** — stated as such in the report, not asserted as a bound met. Content-script
      bytes untouched (**329,233 B**, md5-identical, firing control as 1.1's). Golden EMPTY · manifest green
      **2975 B** · `permissions: []` both. [D-3; §7-2; plan risk 4]

*Group-1 acceptance (re-scoped from plan §6's literal list per the flagged divergence above): content-script
bytes md5-identical; `codeEngine.ts` built and its engine choice proven, unreachable from any entrypoint;
manifest untouched; deps exactly 6. **The four-clause fence is 4.5's, not this group's.***

## 2 — The harness (D-1 — built and run BEFORE any Shiki code lands, per Ruling 1 and plan §6's hard constraint)

- [x] **2.1 `entrypoints/app/main.ts`'s query-gated seam — `__peekoverHarness`, inert by default, reusing the
      PRODUCTION `folderSourceFromHandle` (D-1).** `new URL(location.href).searchParams.has('__peekoverHarness')`
      — present **only** on a URL the harness itself constructs; `background.ts`'s `action.onClicked` adds no
      query string on the real launch path, so this branch never runs for a real user. When present, installs
      **one** global, `window.__peekoverHarness.openFromHandle(handle)`, which feeds `handle` through
      `folderSourceFromHandle` (`chromiumFolderSource.ts:98`) — **the same production function `openFolder()`
      already runs after `showDirectoryPicker()` resolves**, confirmed this session to need **no signature
      change** (plan §2's own open question, resolved: zero-diff file).
      Files: `entrypoints/app/main.ts` · `tests/browser/appHarnessSeam.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) ★ **the negative half, proven not asserted**: navigate `app.html`
      WITHOUT the param — `window.__peekoverHarness` is `undefined`. ★ **The positive half**: navigate WITH the
      param, hand it an OPFS `FileSystemDirectoryHandle` (no user gesture needed, `navigator.storage
      .getDirectory()`), and confirm the SAME reader state `openFolder()` reaches after a real picker resolves
      — asserted by driving both paths and comparing the resulting reader content, not by re-implementing
      `folderSourceFromHandle`. **Ships no manifest key, no permission, no `web_accessible_resources`** —
      re-proven on both built manifests. `chromiumFolderSource.ts` diff **EMPTY**, asserted as a confined diff.
      Both bundles' byte deltas stated (this task adds real code to the app-page graph for the first time this
      milestone; content-script graph **untouched**, 329,233 B, md5-identical). Golden EMPTY · manifest green
      **2975 B** · `permissions: []` both engines. [D-1; Ruling 1; §4 Trust]

- [x] **2.2 `scripts/perf-app-first-paint.ts` — the driver, mirroring `perf-first-paint.ts`'s shape, producing
      THE FIRST app-page first-paint number this codebase has ever recorded (D-1).** Same
      `chromium.launchPersistentContext` + `--load-extension` pattern, same `ITERATIONS = 7` / median-and-floor
      statistics, same `GATE_MS = 165`. Navigates `app.html?__peekoverHarness=1`, populates an OPFS directory
      from `tests/golden/hugeDoc.ts` (the same fixture `perf-first-paint.ts` uses, so the two numbers are
      comparable), calls `window.__peekoverHarness.openFromHandle(dir)`, times to the paint the content-script
      harness already times to.
      Files: `scripts/perf-app-first-paint.ts`
      Verify: run against the tree as it stands at the CLOSE of group 1 (Shiki installed, `codeEngine.ts`
      unreachable, nothing on the app-page render path yet) — **the PRE-SHIKI floor this milestone's own group-
      8 A-B-A needs**, median + floor reported, against `GATE_MS = 165`. ★ **State the A-vs-A agreement
      explicitly** (finding 7/8's discipline): run it twice back-to-back and confirm the two runs agree within
      noise, because a floor that cannot agree with itself proves nothing downstream. **No prior floor exists
      to compare against** (plan risk 2) — this number IS the baseline, reported to `progress.md` and flagged
      for the human sanity-read at 9.1 before Ruling 4 makes it standing. Golden EMPTY · manifest green
      **2975 B** · `permissions: []` both. [D-1; Ruling 1, Ruling 4; §5 first paint; plan risk 2]

*Group-2 acceptance (plan §6): the seam's inertness proven negative and positive; a real pre-Shiki number
exists.*

## 3 — The fence-meta plumbing (D-8 — standalone and testable before anything highlights)

- [x] **3.1 `parse.ts` gains ONE additive, conditional custom fence renderer — `data-fence-meta`, a no-op for
      every existing fence, proven not assumed (D-8, Ruling 2).** `md.renderer.rules.fence` override: calls
      markdown-it's own default fence rendering and, **only when `info.trim().split(/\s+/).length > 1`**,
      appends `data-fence-meta="{2,4}"` (the raw remainder of the info string, HTML-escaped) to the emitted
      `<code>`. Verified empirically this session against the installed markdown-it 14.3.0 (the exact
      configuration `parse.ts:42` builds): the default renderer discards everything past the language word —
      `{2,4}` reaches neither a class, an attribute, nor anywhere in the DOM today. Still one parser, one
      instance — no second `md` instance, no new parse pass, no widened `ENABLED_RULES`.
      Files: `src/render/parse.ts` · `src/render/parse.test.ts` · a regression assertion pinning `tests/golden/
      output/*` unchanged (no new golden fixture — plan §2's Explicitly-NOT-touched list, relying on the
      unit-level literal-string pin instead)
      Verify: (**unit**) meta present (`{2,4}`) → attribute present, HTML-escaped correctly (a fixture with `<`,
      `>`, `&` in the meta string proves the escaping, not just its presence); meta ABSENT → output
      **byte-identical to the literal committed golden strings** (`tests/golden/output/code.html`'s labelled
      and unlabelled fences), asserted against the actual string, not "unchanged" eyeballed. ★ **Revert-and-
      fail, the golden-negative-case pin**: a build that unconditionally emits `data-fence-meta` (even when
      absent) must fail `git diff tests/golden/output/` — proven by reverting the conditional and confirming
      the diff breaks with the defect's own signature (an added attribute on every fence, including the three
      committed fixtures that carry no meta). Confined diff: `ENABLED_RULES` and the GFM rule set untouched,
      asserted as a diff scoped to the fence rule alone. NUL check on the escaped-meta fixture (both `tr` and
      `python3` forms) — the escaping path is the one place this milestone could emit a stray control byte.
      Golden EMPTY (except this task's own regression assertion, which pins rather than changes existing
      bytes) · manifest green **2975 B** · `permissions: []` · both bundles untouched (`parse.ts` is on
      **both** graphs, so this task re-proves content-script bytes **329,233 B md5-identical** — a conditional
      that never fires for today's corpus moves no bytes). [D-8; Ruling 2; §4 toolbar (line-highlighting's
      dependency); plan §0.2-3]

*Group-3 acceptance (plan §6): every existing golden fixture unchanged; the conditional proven load-bearing by
revert-and-fail.*

## 4 — Highlighting + the toolbar, one enhancer (D-4 · D-5 · D-6 · D-7 — and D-2's fence, deferred here per the
group-1 flag)

★ **§3.11's audit is consumed here, per its routing table above — no task below is written before it is
read.**

- [x] **4.1 The synchronous prologue, D-6's retained/highlighted sibling structure, and the TWO app-page call
      sites (D-5 · D-6).** `enhanceCode(host)`: `fences = shadow.querySelectorAll('pre > code[class^="language-
      "]')`; if none, return (the engine is never touched — §4). For each fence, build `codeView.ts`'s
      `<div class="peekover-code">` wrapper as a **SIBLING** of the source `<pre>`, retained and visible;
      nothing highlighted yet — **the retained `<pre>` IS the state** (D-6), the same `readerMode.ts`-adjacent
      "degradation is the default state, success is the mutation" property 007 D-15 states for its own
      placeholder. Wired at `readerPane.ts` (after the committed `mount`, beside `enhanceDiagrams`/
      `enhanceTables`) and `appShell.ts`'s `renderWithDiagrams` closure — **third in the list, both sites**
      (D-5). **The content-script call sites (`mountReader.ts`, `contentWatch.ts`) are explicitly NOT touched**
      — §3.8 sealed.
      Files: `src/render/codeEnhancer.ts` · `src/render/codeView.ts` · `src/app/readerPane.ts` ·
      `src/app/appShell.ts` · `src/theme/readerCss.ts` · `src/render/codeEnhancer.test.ts` ·
      `tests/browser/codeRender.browser.test.ts`
      Verify: (**unit**) the fence predicate matches the language-classed shape and nothing else; the
      synchronous prologue returns **before** any async work resolves, with the retained `<pre>` already in
      the DOM at that instant (§4's pre-paint criterion). (**tests/browser** — Cr+Fx) ★ **§3.11 row 4, the
      audit's main finding, and it is asserted as `.peekover-reader` INSIDE, not a sibling of it** — four
      sibling suites in this codebase assert the OPPOSITE direction; **verified red by placing it outside, at
      which point the golden diff stays EMPTY**, which is exactly why this structural assertion exists.
      **Rows 2 + 3**: the content-script reader leaves every fence a plain code fence, no affordance, no note;
      **red-first by ungating the call so it reaches the content script**, proving the gate is the module graph
      and not an accident of the surface. ★ **Both call sites, never one**: a document rendered through
      `readerPane.ts` AND one re-rendered through `appShell.ts`'s watch closure each carry the enhancement —
      red against wiring only the first, whose signature is the enhancement **disappearing on the app page's
      own re-render** (007 D-12's exact bug class). `mount()` diff **EMPTY**, asserted as a confined diff — the
      checkable property D-5 states for itself. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-5, D-6; §4 highlighting; rows 2, 3, 4]

- [x] **4.2 D-4's direct-DOM adoption from `codeToTokens` — no HTML string anywhere in the path — and per-fence
      / whole-engine degradation (D-4 · §3.9).** `engine = await loadCodeEngine(shadow)`; for each fence,
      `tokens = engine ? await engine.codeToTokens(fence.textContent, { lang, theme }) : null`; `tokens` ?
      `adoptHighlighted(fence, tokens)` (walks the structured line/token data, `document.createTextNode` +
      `element.style.color = …` + `span.className = …` — the same `tableTools.ts` "never as an HTML string"
      shape, AGENTS.md #3) : `markCodeFailed(fence)`. Per-fence `try`/`catch` so one block's failure never
      reaches another; a rejected `loadCodeEngine` leaves EVERY fence on the page plain.
      Files: `src/render/codeEnhancer.ts` · `src/render/codeView.ts` · `src/render/codeEngine.ts` ·
      `tests/browser/codeRender.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) a fence renders to highlighted spans carrying Shiki's own theme-data
      colours. ★ **No `innerHTML` assignment anywhere in the highlighting path** — a structural assertion over
      the shipped source (`codeEnhancer.ts`/`codeView.ts`/`codeEngine.ts` contain no `.innerHTML =` token),
      never a runtime snapshot alone. ★ **The retained `<pre>`'s `textContent` is byte-identical to the
      fence's original source**, verified against a HOSTILE fixture (unicode, trailing whitespace, mixed line
      endings) that would expose a lossy tokenizer round-trip if D-6's retained-node approach were bypassed —
      the exact risk §3.6 names. **Engine-load failure** (the dynamic import forced to reject, real engine):
      every fence stays plain, page intact; **revert-and-fail**: remove the per-fence `try`/`catch`, and one
      bad block's throw takes the whole enhancement down, naming the count of un-highlighted blocks left
      (007 3.2's exact shape). **Theme-apply failure** (an invalid theme id forced into `codeToTokens`): falls
      back to the reader's default presentation, never an unstyled flash. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-4, §3.9; §4 highlighting]

- [x] **4.3 The toolbar — copy, line-numbers, line-highlighting (D-8's consumer), word-wrap — wired in the SAME
      per-fence pass, per-render state that does NOT survive a watch re-render (D-7).** `parseLineRanges`
      (`{2,4}` → `[2,4]`; `{1-3,7}` → `[1,2,3,7]`; malformed/absent → empty, safe) reads
      `code.dataset.fenceMeta` (D-8's plumbing). Copy reads the **RETAINED** `<pre>`'s `textContent` — never
      the highlighted sibling, never a duplicated string (D-6). Toolbar state does not survive `mount()`'s
      `replaceChildren` — mirrors 008 D-9's identical structural argument (`preserveReading` carries only the
      scroll anchor and view mode, never toolbar state).
      Files: `src/render/codeEnhancer.ts` · `src/render/codeView.ts` · `src/theme/readerCss.ts` ·
      `tests/browser/codeToolbar.browser.test.ts`
      Verify: (**unit**) `parseLineRanges`'s four cases above, plus a fixture proving it never throws on
      adversarial input. (**tests/browser** — Cr+Fx) copy copies the RAW source exactly as authored (the same
      hostile fixture 4.2 uses) and **confirms that it copied** (row 20, a polite live region, out of the a11y
      tree while empty). ★ **D-7's per-render revert-and-fail, mirroring 008 D-9's own test exactly**: toggle
      line numbers ON, drive a watch re-render that CHANGES the source, assert line numbers are back to the
      DEFAULT — red against a build that carries the flag across, with the defect's own signature (the wrong
      toggle state sitting on new content). ★ **Row 11, multi-instance**: a two-block document, block 2's copy
      button copies block 2's text (the `diagramLightbox`/007 defect class). **Row 5, containment**: the
      toolbar does not occlude its own block's text at BOTH `GEOMETRY_WIDTHS` (1280 and 1400, finding 2) and
      clears the TOC rail / mode toggle (row 8) via that same containment. **Row 16**: every control is a real
      `<button>`, keyboard-operable, no `tabindex` of its own. **Row 17**: accessible name carries selection AND
      action, moving with state. **Row 15**: line-highlighting is announced in TEXT (§4: *"shall state which
      lines are emphasized where a screen reader will announce it"*), never colour alone. **Row 18**: the
      language label is hidden from AT when purely decorative. **Row 19, non-vacuous both halves**: the copy
      button's `.ok`-on-success transition is instant under `prefers-reduced-motion` AND DOES animate without
      it. **Row 14**: the toolbar is rebuilt every mount and its handlers reach the CURRENT block, not a
      destroyed one — red against a captured element reference. **Row 24's toolbar half**: line numbers,
      line-highlighting, word-wrap have NO sibling suite anywhere in this codebase — this task establishes that
      baseline, enumerated and asserted, not transcribed. Toolbar-action failure states the failure, block
      stays readable (§3.9). Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-7, D-8; §4 toolbar; rows 5, 8, 11, 14, 15, 16, 17, 18, 19, 20, 24]

- [x] **4.4 The zero-network guard, across engine-load → tokenize → theme-select → copy → collapse, with the
      control fetch shown live in the SAME test (§3.11 row 22).** ★ **D-4 means nothing in this path goes
      through the sanitizer at all** — `codeToTokens` never produces an HTML string, so the standing lesson
      applies with FULL force: the control markup must be adopted from something no sanitizer has touched, not
      merely something this pipeline hasn't sanitized yet.
      Files: `tests/browser/codeNetwork.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **zero requests** across the whole pipeline — engine-load, tokenize,
      theme-select, copy, collapse (D-10's structure, even though 6.1 hasn't landed the UI yet this task's
      fixture pre-builds the collapsed state directly) — using the existing `/^https?:/i` predicate **verbatim**
      and `awaitFetchedUrls`'s shape, **with the control fetch shown LIVE in the SAME test**, under the same
      conditions the negative claim disclaims (finding 1). ★ **jsdom cannot see bytes on the wire — this is a
      real-engine test or it is nothing.** Control markup neutralized in an inert `<template>`, never a
      "detached" div (the standing Firefox `@import` lesson). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` both engines. [row 22; §4 Trust; §5 zero-network; finding 1]

- [x] **4.5 ★ THE COOLDOWN CONSTRAINT AND THE FOUR-CLAUSE IMPORT FENCE — deferred from group 1, landing HERE
      because this is the first task where clause B is REAL (D-2).** `watchController.ts:422` times the whole
      synchronous block for the cost-proportional cooldown — `enhanceCode`'s entry point must return
      synchronously in ~nothing (re-asserted here, not merely inherited from 4.1). `codeImportFence.test.ts`,
      mirroring `diagramImportFence.test.ts`'s four clauses: **A** — the content-script graph (walked from
      `entrypoints/peekover.content.ts`) reaches neither `codeEnhancer.ts` nor `codeEngine.ts`, and imports no
      `shiki` specifier anywhere. **B** — the APP-PAGE graph (walked from `entrypoints/app/main.ts`) MUST reach
      both modules and MUST import `shiki` — the control that proves clause A is a real absence, **now real
      because 4.1 wired both call sites**. **C, the laziness pin — ★ EXPECTS TWO permitted static specifiers,
      NOT ONE**: exactly one dynamic `import('shiki/core')` edge, plus `shiki/package.json` and
      `shiki/engine/javascript` as the two allowed static, non-dynamic specifiers (plan risk 5 — this task must
      not copy `diagramImportFence.test.ts`'s `toHaveLength(1)` clause-C shape unadjusted; a naive copy fails
      the fence on CORRECT code). **D** — both graphs non-trivial with named landmarks, every specifier
      resolves.
      Files: `src/render/codeImportFence.test.ts` · `src/render/codeEnhancer.test.ts`
      Verify: (**unit**) the synchronous return, re-asserted with a fixture spanning both call sites. (**static**)
      the four clauses, clause C's assertion **explicitly `toHaveLength(2)`**, named in the test's own comment
      as the deliberate divergence from the 007 precedent. ★ **`shiki` in the content-script bundle = the fence
      broke, STOP-and-flag.** Content-script bytes **STILL md5-identical to HEAD (329,233 B)** — the whole
      point of the fence, re-proven not assumed. App-page bytes now MOVE for the first time this milestone
      (the engine, enhancer, and the lazy `shiki` chunk are all reachable) — stated against baseline
      **399,646 B**, the RAW delta only, **explicitly NOT decomposed here** (group 8's D-11/M-1 job). Golden
      EMPTY · manifest green **2975 B** · `permissions: []` both. [D-2; §3.2; plan risk 5; deferred from
      group 1 — flagged]

*Group-4 acceptance (plan §6, re-scoped for the flagged fence deferral): §4's highlighting/toolbar criteria;
§3.11's routed toolbar rows; D-4's no-`innerHTML` structural assertion; D-2's four-clause fence, now provable
and green.*

## 5 — Code themes (D-9)

- [x] **5.1 `codeTheme` — a fourth field on the ONE global settings row (D-9).** `Settings` (today `{ theme:
      ThemeSetting; tocOpen: boolean | null; tocWidth: number | null }`) gains `codeTheme: string`. **Same
      shape** `theme`/`tocOpen`/`tocWidth` already are — one more field on one global row, not a new settings
      surface and not the per-document-class axis 008 §3.5 declined (plan §0's own argument, verified against
      the real `settings.ts` shape this session). `SettingsPort`'s `snapshot`/`load`/`save` are unchanged in
      shape (`save` already takes `Partial<Settings>`). ★ **`DEFAULT_SETTINGS.codeTheme` is set to a
      PROVISIONAL placeholder (one of Shiki's bundled theme ids) here, EXPLICITLY NAMED provisional in the doc
      comment** — the 008 standing rule applies (*"a PROPOSED comment left on a chosen value is a lie about the
      decision state"*), so this is not silently treated as final; **group 8's M-4 confirms or replaces it**,
      recorded either way.
      Files: `src/settings/settings.ts` · `src/settings/settings.test.ts` · `docs/trust/PERMISSIONS.md`
      Verify: (**unit**) `Settings`/`DEFAULT_SETTINGS`'s new field, `SettingsPort` methods unchanged in shape —
      asserted as a confined diff. `docs/trust/PERMISSIONS.md`'s settings-row disclosure gains ONE more field
      name (*"theme choice, TOC open-state + width, code-theme choice"*) in its EXISTING row — no new row, no
      new capability, asserted as a confined diff on that one line. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-9; §3.5; §4 themes]

- [x] **5.2 ★ THE THEME SELECTOR — a NEW module, `codeThemeControl.ts`, not named in plan §2's Create list
      (flagged), plus the independence-from-document-theme proof (D-9).** `themeControl.ts`'s existing shape
      is a **3-way CYCLE BUTTON** (`auto → light → dark`) — structurally unable to represent **≥14** discrete
      choices. This task introduces `src/theme/codeThemeControl.ts`, a **listbox-shaped** picker mirroring
      008's `diffChrome.ts` `role="listbox"` pattern rather than the cycle-button one, mounted beside
      `themeControl` in `appShell.ts`. ★ **Named as a decomposition detail the plan's Files-to-touch list did
      not anticipate the shape of — flagged for gate-3 review, kickoff FLAG category 3, not silently invented.**
      Files: `src/theme/codeThemeControl.ts` · `src/theme/codeThemeControl.test.ts` · `src/app/appShell.ts` ·
      `tests/browser/codeThemeControl.browser.test.ts`
      Verify: (**unit**) the listbox offers **≥14** entries, drawn from Shiki's own bundled theme set (not
      hand-curated — §3.5's floor, verbatim). (**tests/browser** — Cr+Fx) ★ **independence, BOTH directions**:
      flip `codeTheme`, assert the DOCUMENT theme (`data-theme`) is unchanged; flip the document theme, assert
      highlighted spans' colours are unchanged — both are the property §4 requires (*"changing one shall never
      change the other"*) and neither direction substitutes for the other. Selecting a theme **persists** via
      `SettingsPort.save`, re-applies to every highlighted block on the page. A real `role="listbox"`, keyboard-
      operable. **Every theme's contrast is checked against ITS OWN background**, not the document's (§4 a11y).
      Golden EMPTY · manifest green **2975 B** · `permissions: []`. [D-9; §4 themes; §4 a11y]

*Group-5 acceptance (plan §6): §4's theme criteria; independence from document theme proven both directions.*

## 6 — Collapsible blocks (D-10)

- [x] **6.1 The collapse/expand structure — `data-code-state`, reusing `readerMode.ts`'s flip-an-attribute,
      build-lazily pattern (D-10).** Each highlighted block over §8's (provisional) threshold gets
      `data-code-state="collapsed"` on its `codeView.ts`-built wrapper, a CSS max-height/overflow clamp keyed
      off that attribute, and a control that flips it to `"expanded"`. **No second parse, no second highlight
      pass, no second copy of the block** — the full content already exists in the DOM (D-4 built it once).
      ★ **The threshold constant is a PROVISIONAL placeholder here, EXPLICITLY NAMED provisional**, same
      discipline as 5.1 — group 8's M-4 confirms or replaces it.
      Files: `src/render/codeView.ts` · `src/theme/readerCss.ts` · `tests/browser/codeCollapse.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) over threshold → collapsed with a preview and an "open raw" control;
      under threshold → **no collapse chrome at all** (row 2's "grows no chrome where absent" shape, applied to
      this axis). Expanding shows the full, ALREADY-highlighted content — asserted by spying on the tokenize
      call count and confirming it stays at **1** across a collapse/expand cycle (no re-highlight). ★ **Row 12**:
      collapsing returns the block's height EXACTLY to the collapsed preview's — a rect-equality assertion, red
      against a collapse that leaves residual height. **Row 15's collapse half**: `aria-expanded` on the
      control, plus text, never state carried by an icon alone. **Row 19's collapse half**: instant under
      `prefers-reduced-motion`, DOES animate without it. **Row 24's collapse half**: no sibling suite for this
      control anywhere in the codebase — established here, enumerated not transcribed. Keyboard-reachable
      expand/collapse (§4). Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-10; §4 collapsible blocks; rows 12, 15, 19, 24]

*Group-6 acceptance (plan §6): §4's collapse criteria; §3.11 rows 12, 19.*

## 7 — Systemic failure and degradation (the failures groups 3–6 could not reach)

- [x] **7.1 Total engine-load failure — the chunk never resolves at all, page-wide (§3.9).** Distinct from
      4.2's per-block-failure proof: here the dynamic `import('shiki/core')` itself is forced to reject before
      ANY fence is processed.
      Files: `src/render/codeEnhancer.ts` · `tests/browser/codeDegrade.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) every fence on the page stays plain, readable code, page intact, no
      blank/broken state (AGENTS.md #5). ★ **Revert-and-fail**: remove the top-level guard around
      `loadCodeEngine`'s await, and the rejection propagates and blanks or breaks the reader — the defect's own
      signature, in its own units (a torn-down reader on a document that had already rendered correctly, 007
      D-15's exact class). Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§3.9; §4 highlighting degradation]

- [x] **7.2 Theme-apply failure at the SELECTION level, not the per-tokenize level (§3.9).** Distinct from
      4.2's per-fence theme-resolution proof: here the PERSISTED `codeTheme` setting itself names an id Shiki
      cannot resolve (a stale/corrupted value).
      Files: `src/render/codeEnhancer.ts` · `tests/browser/codeDegrade.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) falls back to the reader's default presentation across EVERY block on
      the page, never an unstyled flash, never a thrown error visible to the user. ★ **Revert-and-fail**: a
      build that does not catch this specific failure surfaces a raw dump or an uncaught error — the defect's
      own signature. Golden EMPTY · manifest green **2975 B** · `permissions: []`. [§3.9; §4 themes degradation]

## 8 — Measure → decide → implement (the measuring tasks CANNOT choose; the deciding task is a human gate)

*Per spec §8's own correction: M-1/M-2 are pass/fail against an already-fixed gate — produced here, ruled at
8.5 only in the sense of "does the surface give way," never a value choice. M-3/M-4 are the human-picks-a-value
items, in 007/008's sense.*

- [x] **8.1 M-1 — the byte budget, D-11's four-component ablation-proven decomposition. PRODUCES NUMBERS;
      FORBIDDEN FROM CHOOSING VALUES.** Against baselines **CS 329,233 B / app 399,646 B / zip 1,306,513 /
      1,306,571 B**, deps exactly **6**.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: **content-script delta — 0 B, md5-identical**, the structural fence (4.5's clauses A/B) cited as
      the proof, not re-derived. **App-page chunk delta, split into**: (a) the JS-regex-engine module (D-3),
      (b) the bundled language-grammar set, (c) the ≥14-theme data, (d) Peekover's own glue (`codeEngine.ts`,
      `codeEnhancer.ts`, `codeView.ts`, `codeThemeControl.ts`, the toolbar) — **each independently ablated with
      a firing control** (remove, rebuild, md5/byte-count moves by the claimed amount, restore), never by
      identifier grep. `pnpm zip` delta reconciled to the sum of CS+app **exactly** — an unaccounted byte is a
      defect, not a rounding error. Bounds re-stated and checked: **≤5 MiB package base, <2 MB per-engine zip**
      — if either binds, that is §7-7's carried subset-build finding, priced here and NOT chosen. ★ **Check the
      tree-shaking shape while the ablation is standing** (the standing lesson: an unused export whose
      initializer spreads an array is retained; `/*#__PURE__*/ ARR.slice()` is the known-dropping form) —
      the ≥14-theme-id list and any frozen name set are inspected for it. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-11; §5 bytes; finding 1; §7-7]

- [x] **8.2 M-2 — first paint under Shiki, on group 2's harness, A-B-A within this milestone. PRODUCES A
      NUMBER; FORBIDDEN FROM CHOOSING.** Run the harness (2.2) against the tree as it now stands (Shiki fully
      wired), against `GATE_MS = 165`.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: **A-B-A within THIS milestone — 2.2's pre-Shiki floor vs. this post-Shiki run** (no prior history
      exists, plan risk 2), FLOOR reported beside MEDIAN, on a quiesced machine. **Reported BESIDE the
      structural conditionality guard**: a document with NO code fence pays nothing measurable — asserted with
      a spy on `loadCodeEngine`'s call count (never invoked) and a shadow-root node-count equality against a
      bare-`mount()` arm, with a THIRD arm (a code-bearing, `CLAUDE.md`-named-equivalent-weight document) as
      the **positive control that fires** (the 008 3.10 three-arm shape, adapted). Golden EMPTY · manifest
      green **2975 B** · `permissions: []`. [D-1; §5 first paint; Ruling 4; finding 1, 7, 8]

- [x] **8.3 M-3 — auto-detection's THREE mechanisms priced against THREE axes. PRODUCES NUMBERS; FORBIDDEN FROM
      CHOOSING.** Heuristic / local model / defer, each against byte cost (against 8.1's headroom) / accuracy
      (on this repository's own unlabeled-fence corpus plus the golden fixtures) / latency added before a
      fence resolves.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: nine numbers (3 mechanisms × 3 axes), corpus **n** stated with its **bias sentence** (this
      repository is a biased sample for a tool whose real documents are arbitrary agent-authored markdown —
      plan risk 7, the same caveat 008 §7's filter measurement carried). ★ **If the local-model row needs a
      second package to load/run it, that is priced EXPLICITLY here, at the point of pricing** (§5's own line)
      — not assumed, not folded in silently. **No verdict reached; §3.7's mechanism is not chosen by this
      task.** Golden EMPTY · manifest green **2975 B** · `permissions: []`. [D-12; §3.7; §8 M-3; plan risk 7]

- [x] **8.4 M-4 — the default code theme, the collapse threshold, and the line-numbers/word-wrap defaults.
      PRODUCES CANDIDATES; FORBIDDEN FROM CHOOSING FINAL VALUES.** Walk-informed against the demo document and
      the golden fixtures (008 §8-4's shape).
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: theme candidates walked against `readerCss.ts`'s three token blocks — ★ **`--code-bg`'s sepia
      inheritance (the LIGHT value, `#F1F1EB`, since sepia overrides only `--paper`/`--ink`/`--accent`/
      `--accent-soft`) is stated explicitly as a candidate-selection input**, not silently substituted. Collapse
      threshold distribution (line count / byte size / whether line-highlight meta is present) over the SAME
      corpus 8.3 uses, same bias sentence. Line-numbers and word-wrap default candidates stated as **legitimate
      either way** (008 §8-3's principle: *"an always-on answer is legitimate; it must be CHOSEN, not defaulted
      into"*). **No constant set in this task.** Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-9, D-10; §8 M-4; §9-2]

- [x] **8.5 ★ DECISION GATE (human) — M-1's bound-met-or-subset-finding, M-2's pass/fail, M-3's mechanism, M-4's
      set. Recorded in `decisions.md` BEFORE any code that sets a value.**
      **M-1** — does the full 190+/≥14 set fit, or is a subset build gate-3 material (§7-7)? **M-2** — does
      <165 ms hold under Shiki; if not, what gives way (mirrors 008 §8-1's escape-hatch shape — the engine's
      shipped surface, not the gate, per Ruling 3's own condition-not-memory discipline if it traces to the
      engine choice). **M-3** — the mechanism, from 8.3's nine numbers: ★ **the rule is already set, the value
      is not — if none of the paid options fits inside 8.1's headroom, defer is the floor** (spec §8 item 1,
      the 008 §8-1 shape re-applied to a mechanism). **M-4** — the theme, the threshold, the two boolean
      defaults, from 8.4's candidates and the walk.
      Files: `docs/ai/decisions.md`
      Verify (**human gate**): each choice recorded **with the measurement that justifies it**, before 8.6.
      ★ **No code lands on an assumed number.** Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§8 M-1…M-4]

- [x] **8.6 Implement the CHOSEN values — constants and the presentation block ONLY; M-3's mechanism, IF a paid
      one was ruled, lands as its own reviewable unit here.** Sets `DEFAULT_SETTINGS.codeTheme` (5.1's
      placeholder), the collapse threshold (6.1's placeholder), and the line-numbers/word-wrap defaults to
      8.5's values — ★ **a no-op edit if a placeholder already matched, RECORDED either way** (008's "a
      PROPOSED comment left on a chosen value is a lie about the decision state" rule). **If 8.5 ruled a PAID
      auto-detection mechanism**, its implementation (a new `codeDetect.ts` or similarly named module,
      feature-detected the same D-13 shape — a fence-free document never pays for it) lands in this task,
      named explicitly as conditional. **If 8.5 ruled DEFER**, this task states that explicitly and builds
      nothing for auto-detection — §4's auto-detection EARS criteria then read as *"the fence stays plain,
      unhighlighted,"* asserted as the resting state, not a gap.
      Files: `src/settings/settings.ts` · `src/render/codeView.ts` · (conditionally) `src/render/codeDetect.ts`
      + tests
      Verify: (**unit**) the threshold and default-boolean cases pass against the CHOSEN numbers; the
      enhancer's orchestration, the tokenize call, and the toolbar wiring are **byte-identical** — the diff
      **confined to the constants block**, asserted rather than eyeballed. If auto-detection was implemented:
      its own unit tests (accuracy against 8.3's corpus, byte cost re-confirmed by ablation) plus a
      real-engine degradation test (inconclusive detection → plain text, never a guessed language presented as
      confident, §4). Bytes move on the app bundle if a mechanism was added — stated with baseline (post-8.1's
      figure), decomposed. Golden EMPTY · manifest green **2975 B** · `permissions: []`. [§8 M-1…M-4]

## 9 — Human milestone-close gate + retro + the records reconcile

- [x] **9.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** Walk, on real
      Chromium and real Firefox with an extension loaded (no harness reaches these): whether the toolbar
      **reads as part of its block or as clutter above it** (008's identical question, transplanted); which
      code theme reads best (8.4's candidates, against sepia's `--code-bg` inheritance); the collapse threshold
      and the line-numbers/word-wrap defaults' feel; **Firefox everything** (Playwright cannot load an
      extension into Firefox, so this walk is that engine's only evidence); **zero unexpected network with the
      Network tab open** across open → highlight → theme → toolbar → collapse; ★ **D-1's harness output itself
      — a sanity read**, since it is the FIRST app-page first-paint number this codebase has ever produced,
      before Ruling 4 makes it standing.
      Verify (**human gate**): each item walked and its verdict recorded. ★ **The walk RECORDS ITS VIEWPORT(S)
      the way it records its engines, and walks at least one WIDE viewport at BOTH `GEOMETRY_WIDTHS` — 1280 AND
      1400 — because this milestone ships chrome INSIDE the reading column** (finding 2). A *"reads as
      clutter / broken / illegible"* verdict is a real finding → a task added below this line, not a silent
      fix. Golden EMPTY · manifest green **2975 B** · `permissions: []`. [§5 human-gate list; §8 M-4; Ruling 4;
      finding 2]
      **PASSED 2026-08-22 — walked by a human on Chromium + Firefox, both engines, app-page AND file://
      content-script surfaces both exercised, both `GEOMETRY_WIDTHS` (1280 AND 1400) on both engines, Network
      tab open throughout (Preserve Log), Console tab watched throughout. NINE items walked. EIGHT PASS, ONE
      PASS+FINDING, CARRIED (not fixed). 009's CODE WORK IS CLOSED.**
      **§1 — TOOLBAR READS AS PART OF ITS BLOCK OR AS CLUTTER (008's question, transplanted): PASS+FINDING,
      CARRIED.** Walker's verdict, verbatim: *"The toolbar looks good, styled. Only thing is the space between
      the code box and the toolbar is a bit too much."* The chrome itself reads as integrated — not 008's
      table-toolbar defect class — the finding is narrower, a vertical-spacing preference. Walker chose CARRY
      over fix-and-recover; ships as-is. Full record: `decisions.md` 2026-08-22 · M9 9.1, with revisit-when.
      **§2 — CODE THEME (8.4's candidates against sepia's `--code-bg` inheritance): PASS.** All 20 themes
      cycled across all 3 document modes (light/dark/sepia); sepia inherits `--code-bg` and reads as a framed
      panel per 8.4's own structural finding — confirmed live, not just measured. `github-dark` (M-4a, ratified
      8.5) reads correctly mid-table on every mode.
      **§3 — COLLAPSE THRESHOLD + LINE-NUMBERS/WORD-WRAP DEFAULTS' FEEL (M-4b/c/d, ratified 8.5): PASS.** The
      40-line collapse threshold and both OFF-by-default toggles feel right at real corpus sizes; nothing here
      reopens 8.5's ruling.
      **§4 — FIREFOX EVERYTHING: PASS, both surfaces.** Playwright cannot load an extension into Firefox, so
      this walk is that engine's only evidence for 009. App-page (Shiki, themes, toolbar, collapse) PASS on
      Firefox. Content-script `file://` surface confirmed PASS on its own, narrower terms — see §6.
      **§5 — ZERO UNEXPECTED NETWORK, NETWORK TAB OPEN THROUGHOUT: PASS.** Open → highlight → theme → toolbar →
      collapse walked on both engines with the Network tab open; zero external requests observed. Console tab
      clean throughout — no errors, no warnings, on either engine.
      **§6 — CROSS-FEATURE + SURFACE-ASYMMETRY CHECKS (walked alongside the named items, not separately
      itemized): PASS.** Cross-feature rendering order (diagram + table + code in one document) held. The
      `file://` content-script surface's app-page-only asymmetry (§3.8) confirmed: plain fences, no toolbar, no
      theme, exactly as designed — not a gap. Unlabeled/uncurated (rust) fences stay plain per §4's degradation
      contract, console clean, sibling blocks unaffected.
      **§7 — D-1's HARNESS OUTPUT, THE SANITY READ (Ruling 4's standing-baseline candidate): PASS.** Subjective
      feel on real hardware matches 8.2's banked 90.8–96.3 ms median first-paint figure — nothing about the
      live walk contradicts treating that number as standing. Ruling 4's own confirmation is 9.2's, not
      re-litigated here.
      **★ THE RUNNING GATE SCORE.** No new defect found or fixed at this gate — one finding, CARRIED, not a
      defect. Score arithmetic is 9.2's (retro), not restated here.
      **★ POINTER WALK, DONE AS A DISCRETE STEP:** § Now, § Blockers and § Up next grepped for `is next`,
      `at the gate`, `waiting on`, `this commit`, `← NEXT`; nothing stale found needing correction beyond this
      commit's own Now-pointer advance.
      **9.2 (the retro) is NOT written here and `docs/ai/retro.md` is untouched by this commit** — that is the
      next task, deliberately in a fresh session after the gate.

- [ ] **9.2 Retro (M9 close) — in a FRESH SESSION (the M5/M6/M7/M8 precedent).** Run `/retro`: append to
      `docs/ai/retro.md`, newest first — the lessons that change how the next milestone runs, and what the
      gate caught. ★ **State whether Ruling 4's standing-baseline claim holds up** — is the harness's number
      stable enough across the milestone's own runs to actually serve as a floor future work prices against, or
      does it need a second confirming run before that status is trusted. **Content-script floor (26.9/29.9 ms)
      confirmed UNMOVED** — 009 never touches that surface, so no floor-delta statement is owed there, but the
      confirmation itself is stated, not assumed.
      Files: `docs/ai/retro.md` · `docs/ai/progress.md`
      Verify: the entry is banked; `progress.md` shows M9 closed and points at what is next. Docs only — no
      `src/`, test, `scripts/` or spec file touched. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [WORKFLOW.md §7.5]

- [ ] **9.3 The records reconcile that closes M9 — including Ruling 3's revisit-when and the NEXT carried
      trigger for D-1's harness.** `spec-coverage.md`'s F3 row moves from **0%** to its landed figure.
      `docs/ai/decisions.md`'s revisit-when (c) — *"a future milestone needs D-1's harness for a different
      measurement than M-2 and finds its capability-free design too narrow"* — is CONFIRMED as the harness's own
      carried trigger, the same D-11 (iii) shape applied forward (leave a measurement AND a condition, not a
      memory). Ruling 3's engine revisit-when (grammar/perf inadequacy at measurement or walk) is restated as
      standing, not re-litigated.
      Files: `docs/ai/progress.md` · `docs/ai/spec-coverage.md` · `docs/ai/decisions.md` (**only** if a genuine
      decision landed at 8.5/9.1 that is not already banked)
      Verify: § Baselines carries re-run numbers or states plainly it did not, and why. Every D-value's
      `decisions.md` entry present and landed with its implementing commit, not here — audited, any that did
      not is named. ★ **`docs/trust/PERMISSIONS.md`'s one-field addition (5.1) is the ONLY change to that
      file** — confirmed, not assumed. 9.1's pointer walk repeated as a discrete step on the final commit.
      `decisions.md` read and left untouched unless a genuine decision landed. Golden EMPTY · manifest green
      **2975 B** · `permissions: []` · deps exactly **6** · all forbidden paths (`sanitize.ts`, `mount.ts`,
      the content-script graph, `diagramEngine.ts`/`diagramEnhancer.ts`/`diagramView.ts`, `store.ts`,
      `wxt.config.ts`) byte-identical or untouched, confirmed. [Ruling 3; D-11 (iii)'s shape, applied forward]

---

**§4 EARS coverage — every clause has at least one task.** *Highlighting* → 4.1–4.5, 7.1 (content-script clause
→ 4.1) · *Themes* → 5.1–5.2, 8.4/8.5/8.6, 9.1 · *Toolbar* → 4.3 (+ collapse → 6.1) · *Collapsible blocks* → 6.1
· *Auto-detection* → 8.3/8.5/8.6 (shape criteria apply once M-3 rules a mechanism) · *Trust* → 1.1 (deps), 2.1
(manifest/capability), 4.4/4.5 (network/fence) · *Degradation* → 4.2, 7.1, 7.2.

**Group ordering, stated so it can be checked:** **1** is the dependency root for the engine choice, built
UNREACHABLE (flagged divergence from plan §6's literal group-1 touches list — the fence is 4.5's, not 1's, per
the re-derived tree precedent). **2** is D-1's harness, built and run before any Shiki work lands, producing
the pre-Shiki floor group 8's own A-B-A needs. **3** is D-8's `parse.ts` change, standalone, with its own
golden-negative regression landing in the SAME task, never a follow-up. **4** is the enhancer, in five
reviewable, separately revertable units (prologue+structure+call sites · adoption+degradation · toolbar ·
zero-network · the cooldown+fence pair, mirroring 007 group 3's own four-task shape plus one for the toolbar
D-7 folds into the same enhancer). **5** and **6** are independent of each other and of 7, each touching only
their own D-value's files. **7** is built behind groups 3–6 so it can reach failure modes they could not. **8**
measures then decides then implements, never choosing inside a measuring task. **9** closes.

**Count: NINE groups, 24 tasks** — 1 (2) · 2 (2) · 3 (1) · 4 (5) · 5 (2) · 6 (1) · 7 (2) · 8 (6) · 9 (3).

*Gate: this file is a **DRAFT awaiting gate 3**. On approval, implementation may begin at **task 1.1, in a
fresh session**, per WORKFLOW.md §5.3 — one commit per task, the `progress.md` Now-pointer advancing in that
same commit. **No plan D-value is re-opened, no spec §3.x decision is re-decided, and no §6 IS-NOT item is
proposed here.** ★ **Gate 2 is BANKED and its four rulings are APPLIED above, not held. The only places this
file declines to decide are the spec's §8 M-3/M-4 measure-then-choose items — PRODUCED at 8.1–8.4, CHOSEN by
the human at 8.5, executed at 8.6.** ★ **TWO DIVERGENCES FROM THE KICKOFF'S OWN HYPOTHESIS ARE FLAGGED FOR
GATE-3 REVIEW: (1) D-2's four-clause fence is deferred from group 1 to group 4 (task 4.5), because clause B's
app-page-graph reachability cannot be proven before a real call site exists — re-derived against
`diagramImportFence.test.ts`'s own precedent, which landed at 007 task 3.4, not task 1.2. (2) D-9's ≥14-option
theme selector needs a NEW module, `codeThemeControl.ts` (task 5.2), not named in plan §2's Create list,
because the existing `themeControl.ts` is a 3-way cycle button structurally unable to represent 14+ choices.***
