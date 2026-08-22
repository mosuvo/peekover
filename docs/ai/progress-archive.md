# Progress archive — Peekover
*Closed-milestone narrative, moved out of `docs/ai/progress.md` on 2026-07-19 (M1–M4), 2026-07-21
(M5), 2026-07-27 (M6) and 2026-08-22 (the combined M7/M8/M9 pass), so that file could go back to being
~150–200 lines a session actually reads before starting work.*

**This is a READ-ON-DEMAND file. Nothing here is required to start a session.** `progress.md` carries a
one-paragraph close summary per milestone and links here for the detail. Come here when you need the
step-by-step evidence behind a closed milestone: what was measured, what was red-first proven, what a
task deliberately did NOT do and why.

**The durable facts were PROMOTED OUT BEFORE this text was moved** (commit *"promote durable 004 facts
ahead of the progress.md archive"*, 2026-07-19). If you are looking for something to act on rather than
something to understand, it is in one of these instead — check them first:
- **`docs/ai/decisions.md`** — the settled decisions, the disproved hypotheses / dead ends, the harness
  capability ledger, and the both-engines gate build+load procedure.
- **`docs/ai/retro.md`** — the lessons that change future behaviour, per milestone.
- **`docs/ai/progress.md` § Baselines / pins** — the current measured numbers and standing pins.

**Historical-record caveat, stated once and applying to everything below:** this text is preserved
**VERBATIM as it stood at each milestone's close**. It therefore contains statements that were true when
written and are not true now — most visibly, the M4 **and M5** group headings read *"IMPLEMENTATION IN
PROGRESS"* / *"GROUP N IS IN PROGRESS"* because they were advanced per-task during implementation and
never retitled at close. **M4 closed 2026-07-19; M5 closed 2026-07-21.** Nothing in this file should be
read as a statement about the present; `progress.md` is the only file that makes those.
**One M5 line is actively FALSE and is left verbatim rather than edited, per this same rule:** the
§ Baselines note claiming *"the content script registers 4.1's thin detector adapter and never
re-renders"* was true when written and was **fixed by task 4.8** — the content script now gets a real
`createWatchController`. The corrected statement is in `progress.md`.

---
## M9 · spec 009 — Code blocks: Shiki syntax highlighting · code themes · per-block toolbar · collapsible blocks · CLOSED 2026-08-22

### The task-by-task narrative, verbatim as it stood in `progress.md` § Now at close

**★ 009's SPEC HAS PASSED GATE 1 — `specs/009-code-blocks/spec.md`, approved 2026-08-14 WITH THREE RULINGS.
`plan.md` IS THE NEXT ARTIFACT AND THE NEXT GATE, in a fresh session (C14).** The approval is banked in
`decisions.md` (2026-08-14, M9 GATE 1) and **the spec's status line stays "draft" by the M7/M8 precedent** —
the bank is the approval of record, not the artifact header. **What gate 1 settled:** (1) the surface
question (§3.8) is DECIDED, not routed to `plan.md` — **app-page-only**, mirroring 007's shipped Mermaid
decision; the content-script `file://` reader stays plain, unhighlighted code fences. **This puts Shiki —
an engine — on the app-page render path for the first time since M8 confirmed that path has never had a
first-paint instrument**, firing D-11 (iii)'s carried trigger (`decisions.md` 2026-08-03 M8 GATE 2, Q4:
*"the next milestone that puts work on the app-page render path whose cheapness cannot be argued
mechanically … funds the first-paint harness before it ships that work"*). **009 inherits that obligation**,
named in the spec (§3.8, §5, §7-1) as an early milestone cost — the harness is funded before or as §8's M-2
measures first paint under Shiki, not discharged by this doc-only gate. (2) The informal `D-A`…`D-D` labels
are STRIPPED from the spec — the constraints they named (Shiki off the content-script static import graph,
progressive first paint, the byte-budget framing, the now-decided app-page-only surface) stay as §3
decided-call prose, matching 007/008's label-free style; `plan.md` assigns the real D-numbers. (3) Shiki's
governed-dependency treatment (§3.10, mirroring 007 §3.12) is CONFIRMED IN, unchanged — licence check, SBOM,
blocking `pnpm audit --prod`, no install scripts. **§9-2 (line-numbers/word-wrap defaults) and §9-4 (the
`codeTheme` settings-key boundary) are UNCHANGED**, left for `plan.md`/§8 as drafted.
**Still true of the draft, and the reason the spec is what it is:** this supersedes the *"between milestones,
persona-#2 next to scope"* pointer in the M8-close bullet below — scoping happened, and its first artifact
exists. **009 = F3 (Code Blocks) in full** — Shiki syntax highlighting, ≥14 code themes independent of the
document theme, the per-block toolbar (copy / line numbers / line highlighting / word wrap), collapsible
long blocks with an "open raw" view, all **done-whole, unconditional**; language auto-detection for
unlabeled fences is scoped **in** but **cost-measured-then-ruled** (§8 M-3). `decisions.md` 2026-07-27 (M7
DIRECTION) named persona-#2 unlock as *"queued for M8 or M9"*; M8 went to persona-#1 QoL instead, so 009 is
that queued unlock — F3 is the only `spec-coverage.md` section at a flat **0%**. **The draft did NOT run its
own scope-read** (unlike 006/007/008): its substance was settled before drafting, in a reviewer-and-human
pass, so the spec's job was giving that substance 008's shape rather than re-deriving it from the tree.
**Doc-only: no `src/` change, bundle byte- and md5-IDENTICAL to M8's close (CS 329,233 B / app 399,646 B)**,
golden EMPTY, deps **still 5** (`shiki` is scoped but not yet installed — that lands with implementation,
not this gate).
★ **`specs/009-code-blocks/plan.md` PASSED GATE 2 — APPROVED (2026-08-15); `tasks.md` IS THE NEXT ARTIFACT
AND THE NEXT GATE**, generated in a fresh session (C14). It settles **D-1…D-13**, resolves all nine §7 risks
against the actual tree, and discharges the §3.11 sibling-checklist audit as a 24-row table. **All four
gate-2 questions (plan §8) were RULED, as FOUR RULINGS:** **Ruling 1** the app-page first-paint harness
(D-1) is APPROVED as new production code, capability-free by construction — the only way to honestly price
the sealed app-page-only decision. **Ruling 2** the additive, conditional `parse.ts` fence-meta renderer
(D-8) is APPROVED as the minimum viable fix for the spec's corrected §3.6/§7-3 premise, proven a no-op
against every existing golden fixture. **Ruling 3** the D-3 engine revisit-when is CONFIRMED — grammar/perf
inadequacy discovered at measurement or walk, not before, not never. **Ruling 4** D-1's harness output is
CONFIRMED as a standing baseline future app-page work prices against, the way the content-script harness's
26.9/29.9 ms headroom became 008's own input. **Three of the spec's own supporting citations did NOT hold
and are acknowledged as scope-read findings, not silently patched** (§0.2): the "only one `shiki` string in
`src/`" count was two, not one; `design/mockup.html` DOES have a code-block section (contra §7-9's claim it
did not exist); and §3.6/§7-3's "not a parser change" framing for fence-meta reading does not survive
contact with markdown-it's actual default fence renderer (verified empirically — `{2,4}` never reaches the
DOM), resolved by Ruling 2 above. **The WASM/CSP risk (§3.10, §7-2) stays RESOLVED WITHOUT an AGENTS.md #4
event**: D-3's `shiki/engine/javascript` regex engine, verified against Shiki's current docs to cover every
built-in grammar, so the manifest and `permissions: []` stay untouched. Full record: `decisions.md`
**2026-08-15 · M9 GATE 2**. The plan's status line stays "draft" by the M7/M8 precedent — the `decisions.md`
bank is the approval of record, not the artifact header.
★ **`specs/009-code-blocks/tasks.md` HAS PASSED GATE 3 — APPROVED 2026-08-15 at `c3582b1`, WITH TWO
RULINGS. ALL THREE GEAR-3 GATES ARE BEHIND M9, AND THE NEXT ACT IS IMPLEMENTATION AT TASK 1.1, IN A FRESH
SESSION** (C14, WORKFLOW.md §5.3) — one commit per task, the box ticked and the Now-pointer advanced in that
same commit (008's forward-ticking convention, `decisions.md` 2026-08-03 M8 GATE 3). The approval is banked
in `decisions.md` (**2026-08-15 · M9 GATE 3**) and **the tasks file's status line stays "DRAFT awaiting gate
3"** by the precedent now five gates deep — the bank is the approval of record, not the artifact header.
**24 tasks across nine groups**, following the plan's own §6 group order (Foundation → the harness →
fence-meta plumbing → the enhancer → themes → collapsible blocks → systemic degradation →
measure/decide/implement → the close gate), with the plan's four gate-2 rulings applied verbatim. **Two
divergences were flagged at the gate and BOTH ARE RULED, APPROVED:** **(1)** D-2's four-clause import fence
moves from group 1 to **task 4.5** — clause B needs the app-page graph to actually REACH the enhancer, an
edge that doesn't exist until 4.1 wires a real call site, mirroring `diagramImportFence.test.ts`'s own 007
precedent (built unreachable at task 1.2, the fence landed at task 3.4, commit `522a3fe`) — and captures the
clause-C adjustment (**TWO** permitted static specifiers, not 007's one). **(2)** a new module,
`codeThemeControl.ts`, at **task 5.2** — not named in plan §2's Create list — because `themeControl.ts`'s
3-way cycle-button shape can't represent ≥14 code themes; a listbox-shaped module is needed, mirroring 008's
`diffChrome.ts` `role="listbox"` pattern. **Neither reopens a sealed call:** (1) is not a D-2 reopening (same
four-clause fence, only WHERE it lands changed) and (2) is not a D-9 reopening (`codeTheme` stays a fourth
settings field; this is the UI module the plan's Create list missed). **Nothing else is re-opened:** no
other D-value, no spec §3.x decision, no gate-1/gate-2 ruling, and **M-1…M-4 stay measure-then-choose** —
PRODUCED at 8.1–8.4, **CHOSEN by the human at 8.5**, executed at 8.6. **Doc-only: no `src/` change, bundle
byte- and md5-IDENTICAL to gate 2's close (CS 329,233 B, md5 Cr `b115c9ae81ac…` / Fx `237831d2332a…`; app
399,646 B), golden EMPTY, deps STILL 5** — `shiki` is scoped, not installed; that lands with task 1.1, the
FIRST `src/` code of the milestone. **No box is ticked.**
★ **PREREQUISITE, PRE-1.1: `pnpm audit --prod` was NOT clean at the start of the task-1.1 session — 6
pre-existing advisories (5 mermaid, 1 dompurify), none caused by any 009 commit, all published to the
advisory DB after M7/M8's clean audits — a supply-chain drift, not a code regression.** Fixed by bumping
BOTH within their EXISTING `^` semver ranges (no new dependency, no `package.json` range widened beyond what
`^` already permitted): `mermaid` 11.16.0 → **11.16.1**, `dompurify` 3.4.12 → **3.4.13**. `pnpm audit --prod`
now clean, **0 advisories**. Because `dompurify` sits on BOTH graphs, **this moved the milestone's own
byte baselines BEFORE task 1.1's own firing control runs** — the gate-2/gate-3-close figures above (CS
329,233 B / app 399,646 B) are now HISTORICAL, superseded by this prerequisite commit's own numbers (see
§ Baselines). Task 1.1 prices its firing control and its post-install byte-identity check against the NEW
figures, explicitly stated as a divergence from the kickoff's assumed numbers (standing rule #1) — not
silently carried forward.
★ **TASK 1.1 DONE — `shiki@4.4.3` INSTALLED, THE GOVERNED 6TH DEPENDENCY (D-13). NOW-POINTER ADVANCES TO
1.2 NEXT** (007 1.1's own phrasing convention). Firing control fired on `src/render/mount.ts`'s
`console.warn` diagnostic string (+1 B, both bundles' md5 moved) and restored cleanly to the post-
prerequisite baseline (CS 329,464 B md5 Cr `ec91cff6b6…` / Fx `e36e768df1…`; app 399,902 B md5
`450c0201897…`) before the install — the zero delta below is a measurement, not a null reading. `dependencies`
**5 → 6**, delta asserted programmatically as exactly `+shiki`. `pnpm audit --prod` clean, **0** advisories.
MIT confirmed on disk (`.license` field AND `LICENSE` file, both). No `preinstall`/`postinstall` on `shiki`
or any of its eight named direct deps (enumerated via pnpm's `.pnpm` virtual store, all nine confirmed
empty) — `@shikijs/vscode-textmate` resolved to `10.0.2`, an undeclared ninth transitive
(`@shikijs/primitive@4.4.3`) also appeared in the store, noted not investigated (not one of the eight named
deps, no scripts field concern raised). SBOM regenerated, 165 runtime components, `shiki` and BOTH
`@shikijs/engine-oniguruma` / `@shikijs/engine-javascript` present (D-13's own named-expected shape).
**Both bundles wc -c- and md5-IDENTICAL to the firing-control-restored baseline, both engines** — CS
329,464 B, app 399,902 B, unchanged by the install (nothing imports `shiki` yet). Structural absence
confirmed (`git grep` over `src/`+`entrypoints/` for `shiki`/`codeEngine`/`codeEnhancer`/`codeView` → 0
hits), never an identifier grep on the minified bundle. Golden EMPTY; manifest **2975 B** unmodified; built
manifests **654/770 B**, `permissions: []` both, no `web_accessible_resources`; 944/944 unit (56 files,
incl. 007 `diagramImportFence` 8/8); `pnpm lint` EXIT=0. `git diff --name-only HEAD` at the commit: ONLY
`package.json` + `pnpm-lock.yaml` + this file + `tasks.md`'s box flip. No `src/` file touched — `codeEngine.ts`
is task 1.2's, not this one's.
★ **TASK 1.2 DONE — `codeEngine.ts` BUILT, UNREACHABLE, THE JS-REGEX ENGINE LOCKED (D-3). NOW-POINTER
ADVANCES TO 2.1 NEXT.** Mirrors `diagramEngine.ts`'s shape (fence predicate + null-early-return +
injectable loader + static `package.json` read) with one deliberate divergence from the kickoff's
paraphrase, taken from `codeImportFence.test.ts`'s clause C at task 4.5 (already written into tasks.md
1.2/4.5): `shiki/engine/javascript` is a SECOND static, eager specifier alongside `shiki/package.json` —
`createJavaScriptRegexEngine` is imported at module top level, not behind the one dynamic
`import('shiki/core')` edge. `loadCodeEngine(root, loader?)` creates `createHighlighterCore` with an
EMPTY theme/lang set (`loadLanguage`/`loadTheme` cover per-fence registration in a later task) — narrower
than `diagramEngine.ts`'s pre-baked config, because D-9's theme set and the language set are not this
task's decision to make.
Engine choice, RED-FIRST: `codeEngine.test.ts` mocks `shiki/engine/javascript`'s
`createJavaScriptRegexEngine` (wrapping the real implementation) and asserts `createHighlighterCore`
receives the EXACT object that mock returned. Swapping the import for `shiki/engine/oniguruma`'s
`createOnigurumaEngine` reds the assertion — `AssertionError: expected "vi.fn()" to be called 1 times,
but got 0 times` — captured, then reverted; `pnpm test` green again after revert.
Injected-loader spy: fence-free root ⇒ `loader` AND `createHighlighterCore` both 0 calls; the SAME spies
on a fenced root in the same test show 1 call each (the positive control, retro finding 1).
`codeToTokens` shape captured against installed 4.4.3 (`github-dark` + `javascript`, fixture
`console.log('hi')`): `{ tokens: ThemedToken[][], fg, bg, themeName, grammarState }`, each token carrying
`content`/`offset`/`color`/`fontStyle`; reassembling every line's token contents round-trips the source
byte-for-byte — the ground truth a later task's DOM adoption is written against.
`@shikijs/primitive` question resolved: **transitive**, not direct — it is `@shikijs/core`'s own
dependency (one of the eight tasks.md 1.1 already enumerates), confirmed via
`node_modules/.pnpm/@shikijs+core@4.4.3/…/package.json`'s `dependencies`; its `scripts` field has only
`build`/`dev`/`test` (no install-lifecycle hook). Task 1.1's "eight direct dependencies" enumeration is
NOT off-by-one — no ledger issue.
★ **THE SCRATCH-REFERENCE ABLATION NEEDED A REPAIR MID-TASK — recorded here as a methodology finding for
group 8's D-11 accounting to inherit.** A bare `import '../render/codeEngine';` in `appShell.ts` (the
kickoff's literal phrasing, and tasks.md 1.2's own) measured a **-5 B** delta — FLAG condition 4,
near-zero/broken. Root cause, confirmed by inspection: `codeEngine.ts` has ZERO top-level side-effecting
statements (no `Object.freeze(…)` the way `diagramEngine.ts` has), so with nothing imported BY NAME, the
whole module — including its own static `shiki/engine/javascript` and dynamic `shiki/core` edges — is
fully tree-shaken out; `diagramEngine.ts`'s own bare-import ablation only ever worked because ITS
`Object.freeze` calls forced module retention regardless of usage, an accident of shape 009's leaner
module doesn't share. Repaired by making the scratch reference an actual CALL —
`import { loadCodeEngine } from '../render/codeEngine'; … void loadCodeEngine(document);` — which cannot
be eliminated by any tree-shaker without changing program behaviour. Re-measured: app chunk 399,902 →
457,819 B (**+57,917 B**), plus a NEW lazy chunk `chunks/core-*.js` at **111,981 B** (105 files vs. the
104-file baseline) — **169,898 B total, DIAGNOSTIC ONLY**, content-script untouched (329,464 B,
md5-identical, both engines) both DURING and after the ablation. `appShell.ts` restored
md5-identical (confirmed against the pre-touch snapshot); post-revert rebuild restored both bundles
byte- and md5-identical to the pre-ablation baseline (CS 329,464 B / app 399,902 B, both engines, 104
files). **This is 8.1's own input, not a bound met** — 8.1 must re-derive its own scratch reference (or
a production one, once 4.x wires real call sites) rather than trust this number as final, since the
exact bytes depend on which exports get pulled in.
★ **RULE-#1 DIVERGENCE, NAMED NOT SILENTLY FOLLOWED:** the kickoff and tasks.md 1.2 both cite "the 007 1.2
precedent exactly" for doing this ablation AT task 1.2. Re-derived against the actual 007 history: task
1.2's own commit (`1391118`) shipped `diagramEngine.ts` **with no ablation at all** — its body says
plainly "Bundles md5-identical on both engines (module tree-shaken out)" — and the scratch-reference
ablation was 007's **separate, dedicated task 1.3** (`c7b3004`, "no source commit — measurements into the
task report"), whose own body is what actually contains the "unreachable... needs a scratch app-page
reference" sentence 009's tasks.md quotes. 009's tasks.md folds what 007 split across two tasks into one
— its citation of "the 007 1.2 precedent" is imprecise, though its own task-1.2 Verify contract
independently and explicitly demands the ablation here, so it was performed as this file's own authority
requires, not deferred on the strength of the mis-cited precedent alone.
`diagramEngine.ts:77`'s `mermaid/package.json` read line, cited by tasks.md as ":77" — confirmed UNMOVED
at line 77, no drift.
Standing invariants: `pnpm test` **951/951** (57 files — **+7 tests, +1 file** from `codeEngine.test.ts`,
delta named); `pnpm lint` EXIT=0; `git diff tests/golden/output/` EMPTY; `tests/manifest.test.ts`
unmodified **2975 B**; built manifests **654/770 B**, `permissions: []` both, no
`web_accessible_resources`; 007 `diagramImportFence.test.ts` **8/8**, run explicitly. deps STILL **6**.
Final tree: both bundles byte- and md5-identical to task 1.1's close (CS 329,464 B / app 399,902 B, both
engines) — `codeEngine.ts` costs zero bundle bytes while unreachable. `git diff --name-only HEAD` at the
commit: ONLY `src/render/codeEngine.ts` (new) · `src/render/codeEngine.test.ts` (new) · this file ·
`tasks.md`'s 1.2 box flip. `src/app/appShell.ts` does NOT appear — the scratch reference was reverted
cleanly.

★ **TASK 2.1 IS DONE — THE `__peekoverHarness` QUERY-GATED SEAM IS LIVE IN `entrypoints/app/main.ts`,
CAPABILITY-FREE BY CONSTRUCTION, PROVEN STRUCTURALLY (D-1, RULING 1). NOW-POINTER ADVANCES TO 2.2
NEXT.** `new URL(location.href).searchParams.has('__peekoverHarness')` gates installation of
`window.__peekoverHarness.openFromHandle(handle)`, which validates `handle` by DUCK-TYPE
(`kind==='directory'` + `values()` + `getDirectoryHandle()`, never `instanceof` — the constructor
need not exist on every engine) before feeding it through the PRODUCTION `folderSourceFromHandle`
(`chromiumFolderSource.ts:98`, confirmed unmoved — the kickoff's cited line held) via an injected
`openFolder` override on `mountAppShell`'s existing `AppDeps` seam, so the harness reaches the SAME
`applyOutcome` path the CTA/picker already runs, never a duplicate. `background.ts`'s
`action.onClicked` inspected and confirmed to add no query string
(`tabs.create({ url: browser.runtime.getURL('/app.html') })`) — the real-user path is structurally
unaffected, not merely unaffected by claim.
★ **ONE IN-SCOPE PLUMBING CHANGE, NOTED NOT SILENTLY MADE:** `main.ts`'s own import of `appShell`
moved from the `@/…` WXT-bundler alias to a relative path — `wxt build` resolves both identically
(confirmed: manifests and both bundles unaffected by the change of specifier form alone), but
`tests/browser/appHarnessSeam.browser.test.ts` imports the entrypoint directly under plain Vitest,
which has no `@/…` resolver (`vitest.config.ts` carries none) — this is the first task to import an
entrypoint file from a browser test at all.
★ **THE TEST DRIVES THE REAL ENTRYPOINT — A NEW PATTERN FOR THIS SUITE, FLAGGED NOT SILENTLY
INVENTED.** `entrypoints/app/main.ts` is side-effect-only top-level code (no exported function), so
`appHarnessSeam.browser.test.ts` imports it fresh per case via a cache-busted specifier
(`…/main.ts?peekoverHarnessTest=N`) — deliberately narrower than `vi.resetModules()`: only the
entrypoint re-evaluates each time; `appShell.ts`'s own module-scoped registries (theme hosts, watch
targets) stay the SAME singletons every other browser test in this project already shares. The real
`location.href` is moved with `history.replaceState`, mirroring `agentBadge.browser.test.ts`'s own
`withDocUrl` (restored in a `finally`/`afterEach`, never left behind — this project's browser test
files share ONE browser window per engine, `vitest.config.ts`'s own header comment). 11 cases ×
Cr+Fx = **22 tests, all green**: the negative half (no param → `window.__peekoverHarness`
undefined, `.peekover-app__cta` still renders — normal init unchanged); the positive half (param
present → `openFromHandle` is a function, init still completes, additively); the paranoid predicate
matrix (`?peekoverHarness`, `?__peekoverharness`, `#__peekoverHarness`, `?other=__peekoverHarness`
— all four still undefined, no false-positive); the handle-only surface (a plain object, a string, a
`URL` — all three REJECT, never silently succeed); the positive path (a real OPFS
`FileSystemDirectoryHandle` drives the harness to the SAME granted chip/file-list shape
`folderGrant.browser.test.ts`'s own directly-injected-`openFolder` control reaches on an equivalent
folder — the reader-state equivalence tasks.md 2.1 asks for, proven by comparing output, not by
re-implementing `folderSourceFromHandle`).
★ **CAPABILITY-FREENESS, PROVEN STRUCTURALLY, NOT ASSERTED.** `chromiumFolderSource.ts` diff is
EMPTY (`folderSourceFromHandle` imported, never forked). Built manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources` — byte-identical to HEAD. Content-script
bundle **329,464 B, md5-identical both engines** (Cr `ec91cff6b6…` / Fx `e36e768df1…`), untouched —
this task's only production file is app-page-only. **App-page bundle MOVES for the first time this
milestone**: **399,902 → 400,435 B (+533 B), md5 `487b1b7a4b…` both engines** — stated as
DIAGNOSTIC input for group 8's D-11 accounting, not a bound met. `pnpm zip` (post-2.1): Chrome
**1,307,185 B** / Firefox **1,307,243 B** — not reconciled to a pre-2.1 figure here, that
reconciliation is 8.1's job.
★ **A BASELINE-CITATION DIVERGENCE, RESOLVED AGAINST A CLEAN REBUILD, NOT EITHER DOC.** tasks.md
2.1's own Verify prose (and this file's earlier gate-1 "Now" paragraph, `:85-86`) cite CS
329,233 B / app 399,646 B — STALE, carried from BEFORE task 1.1 installed `shiki`; this file's own
task-1.1/1.2 close records (`:102`, `:180`) already correct this to 329,464/399,902, matching the
kickoff's figures, not tasks.md's. Re-confirmed here directly: this task's changes were stashed, a
`rm -rf .output` clean rebuild of both engines ran at HEAD `2aace83`, and the measured bytes were
**CS 329,464 B / app 399,902 B** — exactly task 1.2's own recorded close. Neither stale citation is
edited here (out of this task's file-touch fence); the divergence is named per standing rule #1, not
silently followed either way.
Standing invariants: `pnpm test` **951/951** (57 files, unchanged); `pnpm lint` EXIT=0;
`git diff tests/golden/output/` EMPTY; `tests/manifest.test.ts` unmodified **2975 B**; 007
`diagramImportFence.test.ts` **8/8**, run explicitly; `git grep` for `shiki` imports across
`entrypoints/`+`src/` (excluding `.test.ts`) returns exactly one file, `src/render/codeEngine.ts`
(unchanged from 1.2) — no new edge. deps STILL **6**. `git diff --name-only HEAD` at the commit:
ONLY `entrypoints/app/main.ts` · `tests/browser/appHarnessSeam.browser.test.ts` (new) · this file ·
`tasks.md`'s 2.1 box flip. `background.ts` and `src/app/chromiumFolderSource.ts` do NOT appear.

★ **TASK 2.2 IS DONE — `scripts/perf-app-first-paint.ts` WRITTEN, AND THE FIRST APP-PAGE FIRST-PAINT
NUMBER THIS CODEBASE HAS EVER RECORDED IS PRODUCED (D-1, RULING 1, RULING 4). NOW-POINTER ADVANCES TO
3.1 NEXT.** Mirrors `perf-first-paint.ts`'s shape — same `chromium.launchPersistentContext` +
`--load-extension` (Chromium only), same `ITERATIONS = 7` (run 1 cold, discarded), same median+floor
statistics, same `GATE_MS = 165` (printed for reference, not ruled on — see below), same sanity-before-
timing discipline (h1 + section-count + zero-console-errors, asserted before any timing is trusted).
Drives `chrome-extension://<id>/app.html?__peekoverHarness=1` through task 2.1's seam
(`window.__peekoverHarness.openFromHandle(handle)`), the handle a real OPFS
`FileSystemDirectoryHandle` (`navigator.storage.getDirectory()`, task 2.1's own construction pattern).
**FIXTURE: the SAME 50.4 KB / 62-section doc the content-script "typical doc" row is built from**
(`buildHugeDoc(sectionsForBytes(50 * 1024))`, `tests/golden/hugeDoc.ts`) — **not** `perf-first-paint.ts`'s
default argument-less 1 MB fixture, which that file's own scope logic treats as "large-doc
(informational)" against a <1.7 s bound rather than `GATE_MS`. tasks.md 2.2 asks for "the same fixture …
so the two numbers are comparable" and a reading "against `GATE_MS = 165`" — only the 50.4 KB fixture is
held to that gate, so it is the one reproduced here (`sectionsForBytes` duplicated locally, the same
pattern `perf-watch.ts`/`perf-snapshot-capture.ts`/`perf-theme-flash.ts` already use independently for
this exact fixture). **Divergence from the kickoff's paraphrase, named per standing rule #1: not a
literal default-argument copy of `perf-first-paint.ts`'s fixture call.**
★ **THE EVENT PAIR — A STRUCTURAL DIFFERENCE FROM THE CONTENT-SCRIPT PAIR, NAMED NOT SMOOTHED OVER.**
Traced this session, not assumed: `appShell.ts`'s `applyOutcome` explicitly leaves the reader in a
NO-SELECTION state after a folder opens (`await selectFile(null)`) — opening a folder alone never
paints anything; a file must additionally be selected, exactly as
`tests/browser/appHarnessSeam.browser.test.ts`'s own positive-path test already shows (it clicks the
file entry after `openFromHandle`). So the **primary** pair measured is **t0 (immediately before
`openFromHandle` is called) → painted** (double-rAF after `.peekover-app__reader__host`'s shadow
`.peekover-reader` gains content — the same paint definition `perf-first-paint.ts` uses, retargeted from
`<peekover-root>` to the app page's host class; `readerPane.ts` mounts through the identical shared
`mount()`), which necessarily brackets a synthetic click on the sole file entry. **Two named biases:**
(i) this number INCLUDES an in-page click dispatch with no content-script analogue; (ii) this number
EXCLUDES the app-shell's own page load (timing starts only once the extension UI and the harness seam
are already ready), unlike the content-script number, which includes the browser's `file://` document
load. The folder-populate and click-to-paint sub-spans are reported alongside the primary number, never
blended into it silently.
★ **THE NUMBER — PRODUCED, PROVISIONAL. Two back-to-back arms, same quiesced conditions, same build:**
**RUN A: median 89.2 ms, floor 84.8 ms** (warm n=6: 103.7/91.2/90.1/84.9/88.3/84.8, cold run 1 discarded
346.8 ms). **RUN B: median 89.3 ms, floor 86.8 ms** (warm n=6: 89.7/93.5/92.5/88.4/88.8/86.8, cold run 1
discarded 138.0 ms). **A-vs-A agreement: 0.1 ms median / 2.0 ms floor** — against `perf-first-paint.ts`'s
own precedent tolerance of **3.8 ms median / 2.5 ms floor** (the 2026-08-03 content-script
re-measurement, § Baselines), both deltas comfortably inside it; no near-tolerance-edge behavior, no
rerun needed, nothing to log as a candidate flake. Sub-spans, both arms: folder-populate (`openFromHandle`
alone) ~4 ms; click→paint dominates the primary number at ~85 ms of ~89 ms. Printed for reference against
`GATE_MS = 165` (mirroring `perf-first-paint.ts`'s own console shape): **89.2/89.3 ms medians sit under
165 ms** — stated as what the script printed, not evaluated here as pass/worrying/fine (this task
PRODUCES the number; it does not rule on it). **NEXT: sanity-read at 9.1, banked as the standing baseline
at 9.3 (Ruling 4); consumed by 8.1's M-2 as the pre-Shiki floor for the within-milestone A-B-A against
post-Shiki app-page first paint in the interim.**
Standing invariants: `pnpm test` **951/951** (57 files, unchanged); `pnpm lint` EXIT=0; `git diff
tests/golden/output/` EMPTY; `tests/manifest.test.ts` unmodified **2975 B**; 007
`diagramImportFence.test.ts` **8/8**, run explicitly. Both bundles **byte- and md5-IDENTICAL** to task
2.1's close — CS **329,464 B** (Cr `ec91cff6b6…` / Fx `e36e768df1…`), app **400,435 B** (`487b1b7a4b…`
both engines) — this task's script is not on either build graph. Built manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources`. `git grep` for `shiki`/`codeEngine` imports across
`entrypoints/`+`src/` (excluding `.test.ts`) still returns exactly one file, `src/render/codeEngine.ts` —
no new edge. deps STILL **6** (the `perf:app` addition is a `scripts` entry, not a `dependencies` one —
confirmed programmatically). `git diff --name-only HEAD` at the commit: ONLY `scripts/perf-app-first-
paint.ts` (new) · `package.json` (one `scripts` line) · this file · `tasks.md`'s 2.2 box flip. No `src/`,
`entrypoints/`, or `tests/` file in the diff.

★ **TASK 3.1 IS DONE — `parse.ts` GAINS THE CONDITIONAL `data-fence-meta` FENCE-RENDERER OVERRIDE (D-8,
RULING 2). GROUP 3 IS COMPLETE. NOW-POINTER ADVANCES TO 4.1 NEXT** (group 4's first task — group 3 has
only 3.1). `md.renderer.rules.fence` is wrapped, not replaced: the ORIGINAL default rule is captured once
at module load (`md.renderer.rules.fence ?? renderToken` fallback, the standard markdown-it plugin idiom)
and called for every fence whose info string is empty, language-only, or trailing-whitespace-only after
the language word — those fences render **byte-identical** to the unmodified pipeline. When the info
string's first-whitespace-run remainder is non-empty, the override pushes `['data-fence-meta', <raw
remainder>]` onto a to-be-restored copy of the token's `attrs`, calls the SAME default rule (whose own
class-injection logic then carries the pushed attribute through), and restores `token.attrs` afterward —
the original token is never left mutated. The value is pushed **raw, never pre-escaped**: `Renderer
#renderAttrs` HTML-escapes every attribute value it renders (`& < > "`), so `data-fence-meta` is escaped
by the exact same code path as `class`, proven with a `<tag>&` fixture in `parse.test.ts`.
★ **EMPIRICAL PARSER PROBE, CONFIRMED THE PLAN'S PREMISE.** Read `node_modules/.../markdown-it/lib/
renderer.mjs`'s `default_rules.fence` directly (not assumed from docs): `info.split(/(\s+)/g)` computes
`langName`/`langAttrs` internally for the `highlight()` callback ONLY — nothing past the language word
ever reaches a class, an attribute, or the DOM when no `highlight` option is configured (parse.ts's
`PARSE_OPTIONS` sets none). Verified live: `md.render('\`\`\`javascript {2,4}\n1;\n\`\`\`')` produces
byte-identical output to `md.render('\`\`\`javascript\n1;\n\`\`\`')` — `{2,4}` is fully discarded pre-
change, confirming §3.6/§7-3's corrected premise, not assumed from it.
★ **TWO DIVERGENCES FROM THE KICKOFF, FOLLOWING tasks.md's OWN Files LIST AS GROUND TRUTH (standing
rule #1 — the file body over the kickoff's paraphrase).** (1) tasks.md 3.1's Files list is explicit: no
new golden fixture — "relying on the unit-level literal-string pin instead." The kickoff's own draft
called for a new `tests/golden/fixtures/*.md` + `tests/golden/output/*.html` pair; that was not built.
Instead, eight new `parse.test.ts` cases pin `parse()`'s raw output directly, including two that assert
byte-for-byte equality against the EXACT strings already committed to `tests/golden/output/code.html`
(the no-op proof, at the unit level). (2) the kickoff's assumed "four committed golden fixtures" count was
wrong — the golden suite (`tests/golden/golden.test.ts`) actually carries **eight** `describe.each`
fixtures (`broken, code, gfm-torture, headings-inline, inline-html, links, malicious, nesting`) plus
`images.html` and a huge-doc SHA-256 pin, ten golden cases total; all eight fixture `.md` files were
read and confirmed meta-free (`code.md`'s two fences are language-only and languageless — no case moves).
★ **A THIRD FINDING, DISCOVERED DURING THE REVERT-AND-FAIL ABLATION, NOT ANTICIPATED BY EITHER
tasks.md OR THE KICKOFF: `sanitize.ts`'s `ALLOW_DATA_ATTR: false` (plus an `ALLOWED_ATTR` allowlist that
does not name `data-fence-meta`) strips this attribute in the REAL pipeline (`sanitize(parse(md))`).**
Made the golden suite's own `git diff tests/golden/output/`-based revert-and-fail instruction (tasks.md's
literal text) a **dead instrument**: an ablated build that unconditionally emits `data-fence-meta` (even
empty) produces **zero** golden-suite diff, because `sanitize()` erases the attribute — present or absent
— before the snapshot comparison ever sees it. Proved by ablation (guard commented out, `node_modules/
.vite` cache cleared to rule out a stale-transform false-negative, `golden.test.ts` re-run: 10/10 still
GREEN, `git diff tests/golden/output/` empty) then RESTORED and re-confirmed green. The WORKING
revert-and-fail mechanism is the unit-level `parse.test.ts` suite (calls `parse()` directly, no sanitize
in the path): the same ablation red-flagged 6 tests with the defect's own signature (`expected ... not to
contain 'data-fence-meta'` / `received '<pre><code data-fence-meta="" class="language-javascript">...'`),
then went green again on restore. **`sanitize.ts` is untouched by this task** (out of scope — task 3.1's
Files list names only `parse.ts`/`parse.test.ts`, and D-8's whole plumbing is framed as "standalone and
testable before anything highlights"), but the allowlist gap is a **carried item**: task 4.3, D-8's own
named consumer (reads `code.dataset.fenceMeta` for line-highlighting), does not list `sanitize.ts` in its
Files either — whichever task first needs `data-fence-meta` to survive to the live DOM must add it to
`ALLOWED_ATTR` there, with its own one-line rationale (matching the file's existing per-attribute comment
convention), or the attribute stays parse-stage-only and 4.3's toolbar never sees it.
★ **THE CS-BYTE-IDENTICAL PREDICTION IN tasks.md's OWN VERIFY TEXT DID NOT HOLD, AND IS CORRECTED HERE
BY MEASUREMENT.** tasks.md 3.1 predicted "a conditional that never fires for today's corpus moves no
bytes" and the standing invariant (line 56-57) frames content-script bytes as "byte-identical THROUGH
THIS ENTIRE MILESTONE... never contingent." Both bundles DID move: `parse.ts` sits on **both** graphs
(confirmed: `git status --short` shows only `parse.ts`/`parse.test.ts` touched, so the whole delta is this
task's own code, not drift), and any live, always-executing code added to that single shared module
(D-8's own "one parser, one instance" lock rules out a second, surface-scoped instance) necessarily grows
both bundles regardless of whether the conditional ever fires at runtime — the "moves no bytes" framing
described the conditional's RUNTIME behavior, not its STATIC code cost, and those are different
quantities. **Content script: 329,464 → 329,803 B (+339 B), md5 Cr `ec91cff6b6…`→`9e0b5c5c42…` /
Fx `e36e768df1…`→`a5d3a65376…`. App-page chunk: 400,435 → 400,774 B (+339 B, the SAME delta — one
shared module, one added code path), md5 `487b1b7a4b…`→`da584e0e32…` both engines.** Firefox rebuilt
FRESH via `npx wxt build -b firefox` (not `pnpm build`, which is Chrome-only) to rule out the standing
stale-Firefox-output pitfall — confirmed live, not carried from a prior session's `.output`.
Standing invariants: `pnpm test` **959/959** (57 files, +8 — this task's own new cases; prior 951/951 at
2.2's close) · `pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY (all ten golden cases unchanged)
· `tests/manifest.test.ts` unmodified **2975 B**, 8/8 · 007 `diagramImportFence.test.ts` **8/8**, run
explicitly · deps STILL **6** · NUL both-forms check (`tr`/`python3`) clean on `parse.ts` and
`parse.test.ts`, positive control (a 3-NUL scratch file) read nonzero in both forms · built manifests
**654/770 B**, `permissions: []` both, no `web_accessible_resources`. `git diff --name-only HEAD` at the
commit: ONLY `src/render/parse.ts` · `src/render/parse.test.ts` · `specs/009-code-blocks/tasks.md` (3.1's
box) · this file. No other `src/`, `entrypoints/`, or `tests/` file in the diff.

★ **TASK 4.1 IS DONE — `codeEnhancer.ts` + `codeView.ts`, D-5's TWO CALL SITES, D-6's RETAINED/WRAPPER
STRUCTURE. NOW-POINTER ADVANCES TO 4.2 NEXT.** Mirrors `diagramEnhancer.ts`'s 007-task-3.1 shape
directly (`git show 1e09164`): a synchronous prologue that finds language-classed fences and puts
structure around each one, then returns — the tokenize/adopt async body (D-4, `codeEngine.ts` wired
for real) is task 4.2's, exactly as 007 split its own 3.1/3.2.
★ **THREE DIVERGENCES FROM THE KICKOFF, tasks.md's OWN TEXT FOLLOWED AS GROUND TRUTH (standing rule
#1).** **(1) SCOPE.** The kickoff's own hypothesis merged 4.1+4.2 — it asked for real `loadCodeEngine`
tokenization, per-fence try/catch and a two-fence-one-bad-language degradation test inside "4.1."
tasks.md tags 4.1 with **D-5, D-6 only**; D-4 (`codeToTokens` adoption, per-fence catch) is tagged
**only on 4.2**, and 4.1's own prose is explicit — "nothing highlighted yet," "the engine is never
touched." Flagged to the operator before writing code (AskUserQuestion); answer: follow tasks.md
narrowly. **(2) FILES LIST.** The kickoff omitted `codeView.ts`, `readerCss.ts` and
`codeEnhancer.test.ts` — all three are in tasks.md 4.1's own Files line and all three were needed:
`codeView.ts` is where D-6's structure actually lives (mirroring `diagramView.ts`), `readerCss.ts`
carries the `rendered`-hides-the-retained-pre rule, `codeEnhancer.test.ts` is the jsdom-level
DOM-shape suite the browser suite's header explicitly says exists "alongside" it. **(3) A STALE NAME
IN tasks.md ITSELF.** 4.1's text says "`appShell.ts`'s `renderWithDiagrams` closure" — that name no
longer exists; 008 renamed it to `renderWithEnhancements` (with its own doc comment explaining why:
"the name was a lie the compiler could not catch"). Wired against the real name, confirmed by reading
`appShell.ts` directly rather than trusting the stale reference.
★ **D-6's STRUCTURE IS A WRAP, NOT A SIBLING — A REAL DIFFERENCE FROM 007's `<figure>` PATTERN, NOT A
COPY-PASTE.** `plan.md`'s D-6 text is explicit the wrapper "wraps BOTH the retained `<pre>` … and the
newly-built highlighted `<pre>`" — unlike `diagramView.ts`'s figure, which sits as a plain sibling the
`<pre>` it never contains. So `insertCodeWrapper` does `pre.after(wrapper); wrapper.append(pre)` — the
wrapper lands at the `<pre>`'s old position, then the `<pre>` moves inside it (re-parenting, not
mutation: same node, same attributes, same textContent). ★ **A second real difference, easy to miss by
copying 007 uncritically: the wrapper is NEVER `aria-hidden` while pending.** `diagramView.ts`'s
placeholder is `aria-hidden` because it starts EMPTY; the code wrapper starts holding the retained
`<pre>`'s real, already-readable text, so hiding it from assistive technology would hide content that
was accessible a moment before this task's own code ran. Both differences are stated in
`codeView.ts`'s own module header, not left implicit.
★ **A REAL REGRESSION, FOUND BY THE FULL BROWSER SUITE, NOT BY THIS TASK'S OWN NARROW TEST FILES —
THE STANDING LESSON THAT A NEW SURFACE MUST BE PROVEN AGAINST THE WHOLE TREE, NOT JUST ITSELF.**
`CODE_FENCE_SELECTOR` (`pre > code[class^="language-"]`, the literal both tasks.md 4.1 and plan.md
§1.3 give verbatim) matches `language-mermaid` too — it starts with `language-`. `enhanceCode` runs
AFTER `enhanceDiagrams` at both call sites (D-5's own ordering), so wiring it for real re-parented an
already-diagram-claimed mermaid `<pre>` into a `.peekover-code` wrapper, breaking
`pre.nextElementSibling === figure` the instant real call sites existed — `pnpm test:browser` reds
`diagramRender.browser.test.ts`'s D-12 parity case with exactly that signature (both engines). Neither
`codeEnhancer.test.ts` nor `codeRender.browser.test.ts` alone would have caught this — both fixture sets
were written before the collision was known, and 4.1's own Files list does not include any diagram
test file. **Fixed by excluding `.language-mermaid` inside `codeEnhancer.ts`'s own `codeFencesIn`**
(a literal class check, not a selector edit — `CODE_FENCE_SELECTOR` itself, and its equality pin
against `codeEngine.ts`, are UNCHANGED) — `plan.md`'s "no interaction between the two engines is
scoped" line forbids importing `diagramView.ts` to check the real attribute, so the exclusion is
self-contained to this module. Two regression tests added (`codeEnhancer.test.ts`): the raw selector
is proven to match both fences (the control), then `codeFencesIn` is proven to return only the real
one; a second test hand-builds the exact shape `enhanceDiagrams` leaves behind (a `<figure>` sibling +
`data-diagram="pending"` on the `<pre>`, built without importing `diagramView.ts`) and proves
`enhanceCode` moves nothing and marks nothing. Re-ran full `pnpm test:browser` after the fix: 122/122
files, 1285 passed, 15 skipped, 0 failed (`diagramRender.browser.test.ts` and every other file green).
★ **CARRIED FINDING FOR 4.2, NAMED NOT FIXED HERE:** `codeEngine.ts` (task 1.2, unchanged this task)
has the SAME unscoped `CODE_FENCE_SELECTOR`/`hasCodeFence`, so a document with only a mermaid fence
and no other code would make 4.2's `loadCodeEngine` decide "yes, load Shiki" for nothing to
highlight. `codeEngine.ts` is not in 4.1's Files list — this is named for 4.2 to resolve, not
silently patched here.
★ **A SECOND, INDEPENDENT COLLISION FROM THE SAME CSS ADDITION, CAUGHT BY A DIFFERENT PRE-EXISTING
CANARY.** `readerCss.ts` is on both graphs; adding CSS to it necessarily moves both bundles (the same
"static code cost, not runtime behavior" property 3.1 already banked for `parse.ts`). The CSS was
first appended at the END of `READER_CSS` (after the diagram/lightbox rules) — which broke
`diagramActions.browser.test.ts`'s **pre-existing** `2,927 B` pin on "the shipped diagram CSS block,"
because that pin slices `READER_CSS` from D-15's marker to the END of the string and my rules landed
inside that slice. Its own failure message names the fix: *"if it is a comment, move it below the
literal"* — except this isn't a comment on the diagram block, it's an unrelated block that needs to
sit BEFORE the diagram marker instead, restoring the pin's meaning ("diagram CSS only") without
touching `diagramActions.browser.test.ts` at all (out of 4.1's Files list). Re-pinned by relocation,
not by editing the assertion. **Retro finding 9's own lesson bites twice in one task, from two
different pre-existing instruments — both discovered by running the FULL suite, neither would have
shown up running only this task's own new test files.**
★ **BYTES, FULLY RECONCILED, ZERO UNACCOUNTED.** Content script: **329,803 → 330,109 B (+306 B)**,
md5 Cr `9e0b5c5c42…`→`cf8c0312…` / Fx `a5d3a65376…`→`c99305e5…` — the ENTIRE delta is the shared
`readerCss.ts` CSS block (`git diff` isolated and byte-counted: 306 B exactly, UTF-8, em-dashes
included per the standing "CSS in template literals ships its comments" lesson). App-page chunk:
**400,774 → 401,566 B (+792 B)** — 306 B of the SAME shared CSS, plus 486 B of new JS glue
(`codeEnhancer.ts`, `codeView.ts`, three added lines across the two call sites); both builds (Chrome
via `pnpm build`, Firefox via `npx wxt build -b firefox`, freshly, `.output` cleared first) agree on
the 486 B JS-glue figure independently, computed twice across the CSS-relocation fix. **No `shiki`
chunk in either engine's `.output`** — `git grep` for `shiki` imports still returns ONLY
`src/render/codeEngine.ts` (unchanged from 1.2); Shiki does not reach the bundle at 4.1, consistent
with 4.5's own text that bundle bytes move for Shiki's sake for the first time at THAT task, not
this one. Diagnostic only, per the standing invariant (8.1 owns the full accounting).
★ **RED-FIRST ABLATIONS, EACH REVERTED AND RE-CONFIRMED CLEAN.** (1) Row 4: `insertCodeWrapper`
temporarily left the wrapper as a `pre`-sibling instead of wrapping it — reds the containment
assertion in both `codeEnhancer.test.ts` (jsdom) and `codeRender.browser.test.ts` (Cr+Fx) with the
defect's own signature (`wrapper.contains(pre)` false). (2) Row 4's INVERT: `enhanceCode` temporarily
appended the wrapper to the shadow root instead of leaving it at the `<pre>`'s position — reds "puts
the wrapper INSIDE `.peekover-reader`" on both engines while `git diff tests/golden/output/` stays
EMPTY, proving the assertion is load-bearing rather than free. (3) Rows 2+3's gate: `mount.ts`
temporarily called `enhanceCode` directly (mirroring 007's own 3.1 ablation) — reds the
content-script assertion on both engines with `expected …(1) to have a length of +0 but got 1`, the
exact accident the gate exists to catch; `mount.ts` restored **md5-identical** (`05436e8e601d…`) to
its pre-ablation baseline, confirmed by hash and by `git diff --stat` showing no change.
Standing invariants: `pnpm test` **972/972** (58 files, +13 — `codeEnhancer.test.ts`'s cases,
including the two mermaid-exclusion regression tests; prior 959/959 at 3.1's close) · `pnpm
test:browser` **122/122 files green, 1285 passed, 15 skipped, 0 failed** (full suite, both engines,
re-run after the mermaid fix and the CSS relocation) · `pnpm lint` EXIT=0 · `git diff
tests/golden/output/` EMPTY · `tests/manifest.test.ts` unmodified **2975 B**, 8/8 · 007
`diagramImportFence.test.ts` **8/8** · `diagramActions.browser.test.ts`'s shipped-CSS-block pin
**2,927 B**, restored · deps STILL **6** · built manifests **654/770 B**, `permissions: []` both, no
`web_accessible_resources` · `pnpm zip` **1,307,773 / 1,307,831 B** both engines, well under the
**<2 MB** per-engine bound. `git diff --name-only HEAD` at the commit: ONLY `src/render/codeEnhancer.ts`
(new) · `src/render/codeEnhancer.test.ts` (new) · `src/render/codeView.ts` (new) ·
`tests/browser/codeRender.browser.test.ts` (new) · `src/app/readerPane.ts` · `src/app/appShell.ts` ·
`src/theme/readerCss.ts` · `specs/009-code-blocks/tasks.md` (4.1's box) · this file. `codeEngine.ts`,
`parse.ts`, `sanitize.ts`, `mount.ts`, every `entrypoints/` file and every manifest config file: all
confirmed byte-identical / untouched. **No other `src/`, `entrypoints/`, or `tests/` file in the diff.**

★ **TASK 4.2 IS DONE — THE ASYNC BODY, D-4'S DIRECT-DOM ADOPTION FROM `codeToTokens`, PER-FENCE
FAILURE ISOLATION. SHIKI REACHES THE APP-PAGE BUNDLE FOR THE FIRST TIME THIS MILESTONE. NOW-POINTER
ADVANCES TO 4.3 NEXT.** tasks.md 4.2's own D-value tag line, cited verbatim: *"[D-4, §3.9; §4
highlighting]"* — D-4 only, not D-5/D-6 (discharged at 4.1) and not D-7 (4.3's toolbar). §3.11's
routing table (tasks.md's group-4 preamble) assigns **zero rows to 4.2** — every row lands at 4.1,
4.3, 4.4 or 6.1, or is routed "out" — a real divergence from the session's own kickoff hypothesis,
confirmed by reading the table directly rather than assumed.
★ **THE ASYNC BODY MIRRORS `diagramEnhancer.ts`'s task-3.1→3.2 split, one real difference:** Shiki's
JS-regex engine touches no DOM to tokenize (mermaid's does, hence its shared measuring container),
so `highlightFences` is a plain sequential loop, no container lifecycle to manage. `enhanceCode`
now builds `CodePair`s (retained pre + wrapper) synchronously exactly as 4.1 left it, then calls
`void highlightFences(...)` — never awaited — preserving 4.1's own sync-return test UNCHANGED (it
still passes, confirmed by re-running the full suite after this task's changes).
★ **D-4'S STRUCTURAL PROOF: ZERO `.innerHTML =` IN THE HIGHLIGHTING PATH.** `git grep -n innerHTML
src/render/codeEnhancer.ts src/render/codeView.ts src/render/codeEngine.ts` returns two hits, both
inside PROSE doc comments ("codeView.ts has no innerHTML at all"), zero actual assignments.
`adoptHighlighted` walks `codeToTokens`'s `TokensResult` and builds the highlighted `<pre>` with
`document.createElement` / `element.style.color` / `Text` nodes only — the same `tableTools.ts`
shape D-4's own `decisions.md` text names. `codeView.ts` gains `markCodeFailed(pre, wrapper)` (the
pair's third state, reserved at 4.1) — visually identical to `pending`, distinguished only so a
later pass can tell "never attempted" from "attempted and declined."
★ **★★ A CATASTROPHIC BUNDLE-BLOAT DEFECT, CAUGHT BY MEASUREMENT BEFORE IT REACHED A COMMIT — SEE
§ CARRIED ITEMS FOR THE FULL RECORD.** D-4's `codeToTokens` needs a REAL loaded language/theme;
`createHighlighterCore` (D-3's fine-grained API) ships with neither. The first approach tried —
importing Shiki's own `shiki/langs`/`shiki/themes` barrel manifests — made Vite discover and chunk
EVERY one of Shiki's ~700 bundled languages as a build output. Built and measured: packed
`.output` **13.6 MB** (AGENTS.md's ≤5 MB budget) and Chrome zip **2.99 MB** (this milestone's own
<2 MB bound) — reverted, never committed. **Fixed** with a small, curated, hand-written loader map
in `codeEngine.ts` — each language/theme its own literal `import('shiki/langs/<name>.mjs')` /
`import('shiki/themes/<name>.mjs')` specifier (`codeEngine.test.ts`'s OWN task-1.2 test already used
this exact per-file shape to capture `codeToTokens`'s return type — now the production pattern
too), so Vite only chunks what is actually listed. **Explicitly PROVISIONAL, named in
`codeEngine.ts`'s own header**: six languages (`javascript`, `python`, `json`, `css`, `html`,
`bash`), one theme (`github-dark`, {@link PROVISIONAL_CODE_THEME} in `codeEnhancer.ts` — task 5.1's
field, task 8.4's ruling). An unlisted language/theme degrades exactly like any other unresolvable
one: `loadLanguage`/`loadTheme` no-op on `undefined`, `codeToTokens` then raises `ShikiError`, the
per-fence `try`/`catch` reads it the same way it reads any other tokenize failure.
★ **PER-FENCE FAILURE ISOLATION, PROVEN RED-FIRST.** Ablation: temporarily removed the per-fence
`try`/`catch` inside `highlightFences`'s loop, re-ran the two-fence (bad-language-then-good)
browser test on both engines. RED, exact defect signature captured: an unhandled `ShikiError:
Language 'notarealanguage' not found, you may need to load it first` thrown from
`highlightFences:222` propagates out of the `for` loop entirely — the GOOD fence after the bad one
in iteration order never gets processed at all (stays `pending` forever), so one bad block took
down every fence after it (both fences in this 2-fence case, 100% loss) — 4 tests failed across
both engines (per-fence-isolation ×2, theme-apply-failure ×2, the same defect class). Restored,
re-ran: 122/122 files green, 1297/1297 passed, 0 failed.
★ **BYTES, FULLY RECONCILED.** Content script: **330,109 B both engines, md5-IDENTICAL** to 4.1's
close (Cr `cf8c0312…`, Fx `c99305e5…`) — §3.8 holds, confirmed by a from-scratch `.output` rebuild
of BOTH engines (`pnpm build` + `npx wxt build -b firefox`), not assumed. App-page chunk
(`chunks/app-BdGQuvdR.js`): **401,566 → 461,419 B (+59,853 B)**, md5-IDENTICAL across both engines
(`9edce63b…`) — the eager glue (async body, `adoptHighlighted`, the curated loader map's own
static code). New LAZY chunks, the actual "Shiki reaches the bundle" event, both engines identical:
`core-AKC2JaC6.js` **111,981 B** (the `import('shiki/core')` chunk — matches the 1.2 diagnostic
ablation's own prediction exactly), `javascript-BzbQS41l.js` **174,814 B**, `python-gzcpVVnB.js`
**69,945 B**, `html-CVO8wu9Q.js` **57,249 B**, `css-LbU1hoFO.js` **49,028 B**,
`shellscript-CLZ0U2zV.js` **41,472 B**, `github-dark-C-LZuMrd.js` **11,402 B**,
`json-qhed-kSA.js` **2,817 B** (≈518.8 KB total lazy weight, fetched only when a fence in that
language/theme is actually encountered). Packed `.output` **4.66 MB** both engines (well under
AGENTS.md's ≤5 MB, though headroom is now real and measured — see § Carried items). Zip **1.42 MB**
both engines (under the <2 MB bound). Structural shiki-import check (`git grep -l "from ['"]shiki"
src/ entrypoints/ | grep -v .test.ts`): still ONLY `src/render/codeEngine.ts` — D-3's "ONE importer"
invariant holds even with the curated loader map, because every new specifier is a literal in that
same file.
★ **§ BASELINES TABLE NOT TOUCHED — FOLLOWING 4.1's OWN PRECEDENT, RE-DERIVED NOT ASSUMED.** Checked
before writing: 4.1's own byte figures (330,109/401,566 B) do NOT appear anywhere in the § Baselines
table below either — that table's own header states it is milestone-close-mutable ("each
milestone's close task overwrites the numbers"), and 3.1/4.1 both recorded their bytes here in
§ Now only. This task follows the same real convention, not the kickoff's assumption that this
task's own Files list includes a § Baselines edit.
Standing invariants: `pnpm test` **980/980** (58 files, +8 — 3 in `codeEngine.test.ts` (mermaid
exclusion + `languageInputFor`/`themeInputFor`), 5 in `codeEnhancer.test.ts` (real-engine success,
per-fence isolation, theme-apply failure, whole-engine failure, sync-preserved control); prior
972/972 at 4.1's close) · `pnpm test:browser` **122/122 files green, 1297 passed, 15 skipped, 0
failed** (full suite, both engines — +12 over 4.1's 1285, the six new `codeRender.browser.test.ts`
cases × two engines) · `pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY · `tests/
manifest.test.ts` unmodified **2975 B**, green · 007 `diagramImportFence.test.ts` green (part of the
full suite) · `diagramActions.browser.test.ts`'s shipped-CSS-block pin **2,927 B**, held (never
touched this task — no `readerCss.ts` edit) · deps STILL **6** · built manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources` · `perf-first-paint.ts --size 50kb` (the real
typical-doc acceptance gate; the default 1 MB fixture is explicitly informational, not the gate):
**149.6 ms median (143.6–158.3 ms range) vs <165 ms — PASS**, confirming the content-script graph is
undisturbed. `git diff --name-only HEAD` at the commit: ONLY `src/render/codeEnhancer.ts` ·
`src/render/codeEnhancer.test.ts` · `src/render/codeView.ts` · `src/render/codeEngine.ts` ·
`src/render/codeEngine.test.ts` · `tests/browser/codeRender.browser.test.ts` ·
`specs/009-code-blocks/tasks.md` (4.2's box) · this file. `readerCss.ts`, `readerPane.ts`,
`appShell.ts`, `parse.ts`, `sanitize.ts`, `mount.ts`, every `entrypoints/` file and every manifest
config file: all confirmed byte-identical / untouched. **No other `src/`, `entrypoints/`, or
`tests/` file in the diff.**
★ **TASK 4.3 IS DONE — THE TOOLBAR (copy-raw, line-numbers, line-highlighting, word-wrap), `sanitize.ts`
ALLOWS `data-fence-meta` (RESOLUTION (a) FROM 3.1's REVIEW), D-7's PER-RENDER STATE. NOW-POINTER
ADVANCES TO 4.4 NEXT.** tasks.md 4.3's own D-value tag line, cited verbatim: *"[D-7, D-8; §4 toolbar;
rows 5, 8, 11, 14, 15, 16, 17, 18, 19, 20, 24]"*. §3.11's routing table assigns these **11 rows** to
4.3 — more than any other single task in the milestone, confirmed by reading plan.md §3.11 directly
rather than assumed from the session's own kickoff.
★ **RULE-#1 DIVERGENCES FROM THE KICKOFF, BOTH FOLLOWED PER THE TASKS.MD BODY, NOT THE PARAPHRASE:**
**(1)** the browser test file is `tests/browser/codeToolbar.browser.test.ts`, a NEW file tasks.md 4.3
names explicitly in its Files list — the kickoff's "extend codeRender.browser.test.ts OR a new file"
guess resolved to the latter, named. **(2)** tasks.md 4.3's Files list (`codeEnhancer.ts` ·
`codeView.ts` · `readerCss.ts` · `tests/browser/codeToolbar.browser.test.ts`) omits any unit-test
file even though its own Verify line requires `parseLineRanges` unit coverage — the same pattern
4.2's own actual diff already showed (`codeEnhancer.test.ts`/`codeEngine.test.ts` rode along
unlisted); `parseLineRanges`'s tests land in `codeEnhancer.test.ts` for the same reason.
★ **RESOLUTION (a) — `sanitize.ts`'s `ALLOWED_ATTR` GAINS `data-fence-meta`, THE ONLY CHANGE TO THAT
FILE.** One array entry plus a rationale comment matching the file's existing per-attribute-group
convention (`sanitize.ts:39-60`'s block above the array). `data-fence-meta` is allowed BY EXACT NAME,
not by `ALLOW_DATA_ATTR` (which stays `false`) — DOMPurify's allow-list check for a named
`ALLOWED_ATTR` entry is independent of that blanket toggle. Golden EMPTY (confirmed: no existing
fixture carries fence-meta syntax, so the conditional attribute never fires against the corpus).
★ **A SECOND, LARGER DIVERGENCE FROM THE KICKOFF'S OWN FENCE LIST, SURFACED DURING WORK AND EXPLICITLY
RULED BEFORE PROCEEDING (human decision, this session):** the kickoff's "★ STRONGEST FENCE" claimed CS
bundle byte-identity as a hard stop for this task. Measured: adding ONE entry to `sanitize.ts`'s
`ALLOWED_ATTR` alone moved the content script **330,109 → 330,127 B (+18 B)**, because `sanitize.ts`'s
document profile is the ONE profile `mount.ts` uses on BOTH surfaces — there is no per-surface
variant, so any change to it is structurally unavoidable to move both bundles. Checked against this
milestone's own history rather than assumed: task 3.4 (parse.ts's D-8 plumbing) already moved CS by
**+339 B**, and task 4.1 by **+306 B** — CS movement from a shared-graph file is an established,
already-priced pattern in 009, not a new phenomenon 4.3 introduced. §3.8's actual claim (the
enhancer/engine stay app-page-only) is untouched — `git diff --name-only HEAD` confirms `parse.ts` and
`codeEngine.ts` are absent from this diff. The kickoff's blanket CS-byte-identity fence was an
over-generalization from 4.2's specific circumstance (4.2 touched no shared-graph file); ruled to
proceed and document rather than treated as a silent violation.
★ **THE TOOLBAR'S STRUCTURAL MODEL — MIRRORS `tableTools.ts`, NOT `diagramView.ts`.** Two shapes exist
in this codebase for a per-block control group: `diagramView.ts`'s `position:absolute`, hover/focus-
revealed corner group, and `tableTools.ts`'s in-flow `table.before(toolbar)` strip. §3.11's routing
table is explicit that code's toolbar is the second shape — rows 7/9/10 route OUT because *"the
toolbar is IN-FLOW inside the reading column, not a fixed-position chrome or a modal overlay"*, row 10
naming the precedent directly: *"same as 008's table toolbar."* So `buildCodeToolbar` (`codeView.ts`)
returns a `<div class="peekover-code-toolbar">` the prologue `prepend`s as the FIRST child of D-6's
wrapper — ahead of both `<pre>`s, in normal document flow, pushing them down rather than floating over
either. NO `position:absolute`/`position:fixed` anywhere in the new CSS; `git grep` over the new
`readerCss.ts` rules for both returns 0 hits. The pre-existing `.peekover-code{position:relative}`
rule (4.1) is untouched and unused by this task's CSS.
★ **PER CONTROL:** copy reads `pre.textContent` — the RETAINED `<pre>` `insertCodeWrapper` passed in,
captured by the toolbar's build-time closure, never the highlighted sibling (D-6) — proven byte-
identical against 4.2's own hostile fixture (unicode, trailing whitespace, mixed line endings), both
before and after highlighting settles. Line-numbers/word-wrap toggle ONE attribute each on the
wrapper (`data-line-numbers`/`data-wrap`, absent = off); CSS keys off them — line numbers via CSS
counters on the highlighted sibling's own `.line` spans, word-wrap via `white-space`/`overflow-wrap`
(NEVER a `ch` unit in a layout-blocking property — retro finding 6; `git grep` over the new CSS for
`[0-9]ch` in margin/padding/transform returns 0 hits). Line-highlighting: `parseLineRanges(meta)` —
`{2,4}` → `[2, 4]`, `{1-3,7}` → `[1, 2, 3, 7]`, malformed/absent → `[]`, never throws — reads
`code.dataset.fenceMeta` (resolution (a)'s own consumer) inside `adoptHighlighted`, applying
`CODE_LINE_HIGHLIGHT_CLASS` (background) AND an `aria-label` stating *"Highlighted line N: …"* on the
matching `.line` span (row 15: state in TEXT and `aria-*`, never colour alone).
★ **A GENUINE INFINITE-LOOP BUG, CAUGHT BY THE ADVERSARIAL UNIT TEST BEFORE IT REACHED A COMMIT.**
`parseLineRanges`'s first draft bounded only the RANGE SPAN (`end - start`), which a bare huge number
(`{999999999999999999}`) sails past — `start === end`, span zero — and at that magnitude floating-
point precision makes `line += 1` a no-op inside the per-line expansion loop, hanging forever (not a
throw — worse, a 240-second timeout with zero output before the cause was isolated). Fixed with a
second guard, `MAX_LINE_NUMBER` (1,000,000) independent of span, plus a `{1,7}` digit cap on the token
regex itself. Both guards are load-bearing and separately tested (`codeEnhancer.test.ts`'s
"preposterously wide range" and "never throws on adversarial input" cases, the latter including the
exact `{999999999999999999}` signature).
★ **D-7'S PER-RENDER STATE: NO MODULE-SCOPE STATE ANYWHERE, PROVEN BY RE-RENDER.** The two toggles read
and write ONE attribute each on the wrapper `insertCodeWrapper` just built; every `enhanceCode` call
builds a fresh wrapper (`mount()`'s `replaceChildren`, §3.3), so a re-render starts every toggle at
its default BY CONSTRUCTION — not a reset this module performs, a state that never had anywhere else
to live. Proven in `tests/browser/codeToolbar.browser.test.ts`: toggle line-numbers ON, toggle word-
wrap ON, drive a re-render that changes the source (`mount(...,{preserveReading:true})` +
`enhanceCode`), assert the FRESH toolbar's two toggles are back to OFF (`aria-pressed="false"`, no
wrapper attribute) — mirrors 008 D-9's identical structural argument.
★ **§3.11's 11 ROWS, EACH WITH A REAL-ENGINE ASSERTION, BOTH ENGINES:** row 5 (toolbar rect strictly
above the visible code rect at both `GEOMETRY_WIDTHS`, 1280/1400) · row 8 (no intersection with
`.peekover-toc`/`.peekover-mode-toggle`, rail forced open — needed a real `mountAppShell` surface, not
the lighter `readerPane`, since TOC/mode-toggle chrome is wired only by the full app shell) · row 11
(two-block document, block 2's copy button copies block 2's text) · row 14 (closure-death: after a
re-render, the FRESH toolbar's copy button copies the NEW content) · row 15 (line-highlight text/
`aria-*`, not colour alone — plus the positive proof `code.dataset.fenceMeta === '{2,4}'`) · row 16
(real `<button type="button">`, no own `tabindex`, real keyboard focus) · row 17 (accessible name
carries the block's ordinal, moves with state) · row 18 (language label `aria-hidden`) · row 19
(reduced motion — see below) · row 20 (polite live region, `hidden` while empty, both success and
failure messages) · row 24 (baseline established: line-numbers actually renders a gutter via a real
`::before` computed-style check, word-wrap actually wraps a 400-char unbroken line — `scrollWidth` vs
`clientWidth` before/after, not merely that the attribute flips).
★ **ROW 19 COULD NOT BE A LIVE DIFFERENTIAL CHECK, AND THAT IS A HARNESS FACT, NOT A SHORTCUT.**
`readerCss.ts`'s own GLOBAL, unconditional `:host *{transition-duration:.001ms!important}` rule (every
browser test in this repo already runs under it, for speed) beats the copy button's non-`!important`
`transition:120ms` in BOTH the reduced and the normal arm — a live `getComputedStyle().transitionDuration`
read cannot tell them apart in this harness. Measured directly (both arms read ~0.001ms) before
concluding this, not assumed. `diagramActions.browser.test.ts`'s own row-19 proof for the diagram
actions hits the identical wall and is ALSO a structural CSS-text check, not a live one — this task's
own row-19 test mirrors that exact shape (asserts the shipped block carries the transition AND the
`prefers-reduced-motion` neutraliser, with a non-vacuous control regex).
★ **RED-FIRST ABLATIONS, BOTH LOCALIZED.** **(i)** Sanitize allowlist: reverted the `ALLOWED_ATTR`
entry, re-ran row 15's positive case — RED, exact signature (`dataset.fenceMeta === undefined`), on
BOTH engines; only that one test failed, nothing else in the file — LOCALIZED. Restored, confirmed
green (both engines, plus `sanitize.test.ts`'s own 90/90). **(ii)** Copy-source: not ablated in-tree
(would require editing `codeView.ts`'s copy handler to read the highlighted sibling, a source change
rather than a fixture change) — the byte-identity test's own control is documented in-file instead
(the highlighted sibling reassembles to the SAME characters, so only exact byte identity — not a
looser "contains the right text" check — could tell a swapped copy source apart).
★ **BYTES, FULLY RECONCILED, BOTH TRACKED SEPARATELY (resolution (a) vs the toolbar itself).**
Content script: **330,109 → 333,161 B both engines (+3,052 B)** — the `sanitize.ts` +18 B plus the new
toolbar/line-numbers/word-wrap/line-highlight CSS text landing in the SAME shared `READER_CSS` string
`mount.ts` injects on both surfaces (via `themeRegistry.ts`) — dead, unmatched selectors on the
content-script surface (which never calls `enhanceCode`), but shipped as bytes regardless, the same
mechanism 3.4/4.1 already priced. App-page chunk: **461,419 → 467,716 B both engines (+6,297 B)** —
the CSS delta plus the toolbar's own JS (`buildCodeToolbar`, `parseLineRanges`, the highlight/ordinal
logic). Both md5-IDENTICAL across engines (length-equal, hash differs between Cr/Fx — the SAME pattern
every prior 009 byte report shows, not a new divergence). Packed `.output` **4.67 MB both engines**
(4,672,638 / 4,672,754 B — under AGENTS.md's ≤5 MB, delta from 4.2's 4.66 MB is the CSS/JS above).
Zip **1.43 MB both engines** (1,425,035 / 1,425,093 B — under the <2 MB bound). Structural shiki-import
check: still ONLY `src/render/codeEngine.ts` (untouched this task, confirmed by `git diff --name-only`
absence). `diagramActions.browser.test.ts`'s shipped-CSS-block pin held at **2,927 B**, re-verified —
the new toolbar CSS lands entirely BEFORE the diagram block's own start marker, so the pinned slice is
byte-untouched by construction, not by luck.
Standing invariants: `pnpm test` **986/986** (58 files, +6 — `parseLineRanges`'s four-case/adversarial/
dedup/inverted-range/brace/hang-guard suite in `codeEnhancer.test.ts`; prior 980/980 at 4.2's close) ·
`pnpm test:browser` **124/124 files green, 1347 passed, 15 skipped, 0 failed** (full suite, both
engines, no `-t` — +2 files/+50 passed over 4.2's 122/1297, the new `codeToolbar.browser.test.ts`'s 25
cases × two engines) · `pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY · `tests/
manifest.test.ts` unmodified **2975 B**, green · 007 `diagramImportFence.test.ts` green (part of the
full suite, re-run standalone to confirm) · deps STILL **6** · built manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources` · `perf-first-paint.ts --size 50kb`: a first
reading at 194.4ms (FAIL) was machine-state from a CONCURRENT full browser-suite run in the same
session (the standing "perf deltas need an interleaved control" lesson) — re-run in isolation:
**162.0ms median (157.5–170.2ms range) vs <165 ms — PASS**. `git diff --name-only HEAD` at the commit:
ONLY `src/render/sanitize.ts` · `src/render/sanitize.test.ts` · `src/render/codeEnhancer.ts` ·
`src/render/codeEnhancer.test.ts` · `src/render/codeView.ts` · `src/theme/readerCss.ts` · `tests/
browser/codeToolbar.browser.test.ts` (new) · `specs/009-code-blocks/tasks.md` (4.3's box) · this file.
`parse.ts`, `codeEngine.ts`, `readerPane.ts`, `appShell.ts`, `mount.ts`, every `entrypoints/` file and
every manifest config file: all confirmed untouched. **No other `src/`, `entrypoints/`, or `tests/`
file in the diff.**
★ **TASK 4.4 IS DONE — THE CODE-BLOCK PIPELINE'S ZERO-NETWORK GUARD, `tests/browser/
codeNetwork.browser.test.ts` (§3.11 row 22), test-only. NOW-POINTER ADVANCES TO 4.5 NEXT.** tasks.md
4.4's own D-value tag line, cited verbatim: *"[row 22; §4 Trust; §5 zero-network; finding 1]"*.
★ **RULE-#1 DIVERGENCE FROM THE KICKOFF, FOLLOWED PER THE TASKS.MD BODY:** the kickoff hypothesized a
STRUCTURAL proof (a unit test inspecting `codeEngine.ts`'s dynamic-import specifiers) as part of this
task's shape. tasks.md 4.4's actual Files list is ONE file, the browser test alone — the structural
four-clause import fence (clause C's specifier-count proof) is task **4.5**'s job, not 4.4's; 4.4
discharges the REQUEST-LEVEL half of §4 Trust only. No production file is touched by this task.
★ **THE HARNESS-ONLY WARM-UP, NAMED IN THE TEST'S OWN HEADER.** In production, `import('shiki/core')`
and the curated language/theme chunks resolve to `chrome-extension://`/`moz-extension://` URLs —
excluded by the `/^https?:/i` predicate's scheme check. In the Vitest dev-server harness the same
chunks serve over `http://localhost`, which the SAME predicate would catch as a false positive — the
identical limit `diagramWindow.ts`'s `warmEngine()` already documents for `import('mermaid')`. This
file's own `warmEngine()` drives one throwaway `enhanceCode` pass (same language, same provisional
theme) in `beforeAll`, before any probe is armed, so the MEASURED engine-load is a module-cache hit —
compensating for a harness artifact honestly, not narrowing the claim.
★ **D-4's OWN FORCE ON THE CONTROL.** `codeToTokens` never produces an HTML string (D-4), so the
standing "a control routed through `sanitize()` can read NO-FETCH while the route is open" lesson
applies with full force: the subresource-lane control is hand-written markup, parsed into an inert
`<template>`, never a "detached" div, touching no sanitizer and no `parse()` — `tableNetwork.browser.
test.ts`'s row-22 shape, reused verbatim in predicate and in instrument shape (`awaitFetchedUrls`).
★ **THE FIVE NAMED STAGES COLLAPSE TO THREE MEASURABLE ONES, STATED HONESTLY RATHER THAN FAKED.**
Production has no separate hook per engine-load/tokenize/theme-select — `codeEnhancer.ts`'s async body
does all three in one pass — so the test measures that pass as ONE window. Task 6.1 (D-10's collapse
UI) has not landed, so the collapse stage is exercised by pre-building the decided state directly:
`codeView.ts`'s own module header names the shape (`data-code-state`, `"collapsed"`/`"expanded"`,
mirroring `readerMode.ts`'s flip-an-attribute pattern) and this file sets that attribute by hand,
under the same armed probe — tasks.md 4.4's own text licenses exactly this ("this task's fixture
pre-builds the collapsed state directly").
★ **TWO DESCRIBE BLOCKS, MIRRORING `tableNetwork.browser.test.ts`'s OWN SHAPE.** One cumulative
sequence (ONE arming, buffer never cleared between stages — row 22's claim as written) and one
per-stage freshly-armed sequence (re-armed immediately before EACH triggering action, including the
document open itself for the engine-load leg — arming AFTER `openDoc` would arm too late, since
`enhanceCode`'s async body starts off-stack the instant the fence is committed, D-5).
★ **RED-FIRST ABLATION, LOCALIZED.** A stray `fetch()` was inserted into `preBuildCollapsedState`
(test-file-only, never committed) and both describe blocks reded on BOTH engines, exact signature
(*"the code pipeline's 'collapse' step put bytes on the wire"*), only the collapse-stage assertion
failing in each test — nothing else in the file. Reverted, confirmed green again both engines. Stray
`__screenshots__/codeNetwork.browser.test.ts/` artifacts (gitignored) removed.
Standing invariants: `pnpm test` **986/986** (58 files, unchanged — no unit test added) ·
`pnpm test:browser` **126/126 files green, 1351 passed, 15 skipped, 0 failed** (full suite, both
engines, no `-t` — +2 files/+4 passed over 4.3's 124/1347, this file's 2 cases × two engines) ·
`pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY · `tests/manifest.test.ts` unmodified
**2975 B**, green · 007 `diagramImportFence.test.ts` **8/8** green · `diagramActions.browser.test.ts`
CSS pin **2,927 B** held, both engines · deps STILL **6** · built manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources` · structural shiki-import: still ONLY
`src/render/codeEngine.ts` (the two `import('shiki` hits inside `codeEnhancer.ts` are doc-comment
prose, not code — confirmed by re-reading the matched lines). Bytes BYTE- AND MD5-IDENTICAL to 4.3's
close, both engines (test-only task, no `src/` change): content script **333,161 B**, app-page chunk
**467,716 B**, `.output` **4.67 MB** (4,672,638 / 4,672,754 B), zip **1.43 MB** (1,425,035 / 1,425,093
B). `perf-app-first-paint.ts` (D-1's own app-page instrument, this milestone's governing gate since
009 is app-page-only): **98.4ms median (92.3–112.2ms range) vs <165ms — PASS**, isolation-run.
`perf-first-paint.ts --size 50kb` (content-script, unaffected by this task but re-checked as a
standing invariant): **144.9ms median vs <165ms — PASS**, isolation-run. `git diff --name-only HEAD`
at the commit: ONLY `tests/browser/codeNetwork.browser.test.ts` (new) · `specs/009-code-blocks/
tasks.md` (4.4's box) · this file. No `src/`, `entrypoints/`, or any other `tests/` file in the diff.
★ **THE KICKOFF'S "TWO NEW § CARRIED ITEMS ENTRIES" WERE STALE, AND ARE NOT DUPLICATED HERE.** Both
pieces of content the kickoff asked this task to bank — the `readerCss.ts` test-speed-rule /
`prefers-reduced-motion` harness fact, and the kickoff-fence-must-cite-ground-truth lesson from 4.3's
CS-byte-identity divergence — are **already recorded**, in 4.3's own § Now entry above (this file,
lines ~660-668 for the harness fact, ~594-606 for the fence lesson), banked by the SAME commit
(`fa3f182`) this task started from. Re-adding them here would be a duplicate write of already-banked
fact. This file also has no dedicated **"§ Carried items"** heading — the phrase is a conceptual
pointer used in prose throughout (e.g. this file's "## Blockers / open questions" section); carried
findings are recorded inline in whichever "## Now" entry produced them, which is exactly where both
of these already live.

★ **TASK 4.5 IS DONE — THE COOLDOWN CONSTRAINT RE-ASSERTION + STRUCTURAL IMPORT-FENCE FOR SHIKI (D-2).
NOW-POINTER ADVANCES TO 5.1 NEXT.** tasks.md 4.5's own D-value tag, cited verbatim: *"[D-2; §3.2; plan risk
5; deferred from group 1 — flagged]"*. Two deliverables per tasks.md 4.5's own text, in ONE task: (1)
`codeEnhancer.test.ts` re-asserts the synchronous-return property against `enhanceCode`'s CURRENT shape
(post-4.2/4.3/4.4), not merely inherited unchanged from 4.1; (2) `codeImportFence.test.ts` (new), mirroring
007's `diagramImportFence.test.ts` four-clause shape (D non-vacuity checked first, then A, B, C).
★ **THE COOLDOWN-CONSTRAINT RE-ASSERTION'S SHAPE, CHOSEN AND DEFENDED.** tasks.md 4.5's own Verify line asks
for the synchronous return "re-asserted with a fixture spanning both call sites" — read here as: the SAME
`mount -> enhanceDiagrams -> enhanceTables -> enhanceCode` order both `readerPane.ts:205` and
`appShell.ts:163` actually run, exercised as a REPEATED, watch-style re-render into an already-mounted host
(not merely one isolated call, which is all 4.1's original assertion — left unchanged, immediately above the
new case — ever exercised). This is the property `watchController.ts:422` actually times on EVERY re-render,
not only first paint: a `enhanceCode` that went async only on a SECOND call would corrupt the cost-
proportional cooldown pricing silently, and 4.1's single-call test could never have caught that. No new
mocking machinery (no spies) — plain re-mount + re-call, named/commented against `watchController.ts:422` by
line number. `codeEnhancer.ts` (production) is untouched — confirmed by `git diff --name-only HEAD` below.
★ **CLAUSE C'S SPECIFIER COUNT, RE-DERIVED AGAINST `codeEngine.ts` AT HEAD, NOT TASKS.MD'S ORIGINAL "1
DYNAMIC / 2 STATIC" PREDICTION.** Grepped fresh this session (not trusted from the kickoff's own restated
figure, which held): **8 dynamic edges** (`shiki/core` [the engine loader, `:147`] + six language loaders +
one theme loader) and **3 static specifiers** (`shiki/package.json`, `shiki/engine/javascript`, and the
type-only `import type {...} from 'shiki/core'` at `:84-89`). tasks.md 4.5's own prose still literally
predicts "TWO" static leaves; `codeEngine.ts`'s own module header (written at 4.2's close) already names
this as stale. **Resolution chosen: reading (a)** — tasks.md's "TWO" was itself a prediction (the same way
007's own `toHaveLength(1)` clause-C shape was explicitly flagged by tasks.md 4.5 as not to be copied
unadjusted), superseded by measurement, not a design rule forcing the type-only import to be excluded. The
type-only edge is counted because 007's OWN walker (unchanged, mirrored here) already counts type-only
imports as edges by deliberate, stated policy ("TYPE-ONLY IMPORTS COUNT AS EDGES, deliberately... still a
module that 'learns the engine exists'") — written for clause A/B's reachability question but applying
unchanged to clause C's specifier-count question, since an edge is an edge regardless of which clause counts
it. Asserted `toHaveLength(3)`, named in the test file's own header comment so a future reader does not
re-derive the reasoning.
★ **A SECOND WRINKLE, NOT ANTICIPATED BY THE KICKOFF, FOUND WRITING THE WALKER: `typeof import(...)` TYPE
QUERIES TEXTUALLY COLLIDE WITH REAL DYNAMIC IMPORTS.** `codeEngine.ts:138` has `(typeof
import('shiki/core'))['createHighlighterCore']` — TypeScript's import-type-query operator, fully type-erased
(zero bundle impact, unlike `import type {...} from` it leaves no specifier in the emitted JS at all) — which
a raw-text walker cannot distinguish from the REAL runtime `import('shiki/core')` at `:147` by shape alone;
both textually match `import(`. A first draft of the fence found TWO "dynamic" `shiki/core` edges and reded
against the fence's own "exactly one" claim — which is also `codeEngine.ts`'s own module header's stated
belief ("THE single `import('shiki/core')` in the repository"), true in TS-semantics terms and false as a
raw match count. Fixed by explicitly detecting a `typeof\s*$` prefix before a dynamic-import match and
reclassifying it non-dynamic — `codeImportFence.test.ts`'s `isTypeQueryPosition` helper, documented inline.
This also meant clause C's "3 static specifiers" count had to be by DISTINCT SPECIFIER TEXT rather than raw
source occurrence, since `shiki/core` now legitimately appears twice in static/type position (the `import
type` at `:84` and the `typeof import` at `:138`) — tasks.md 4.5's own prose supports this reading directly
("the two allowed static, non-dynamic **specifiers**" — a specifier is a string identity, not a line).
★ **RED-FIRST ABLATION, LOCALIZED.** Added `notareallanguage: () => import('shiki/langs/notarealanguage.mjs')`
to `codeEngine.ts`'s `LANGUAGE_LOADERS` (never committed). `codeImportFence.test.ts` reded exactly ONE test —
clause C's loader-specifier-set check — nothing else in the file (D/A/B, and clause C's other two checks,
stayed green). As an independent, orthogonal confirmation the ablation is a genuine defect (not part of the
fence's own job), Vite's real transform of `codeEngine.ts` also failed resolving the nonexistent path when
`codeEnhancer.test.ts`'s real-engine suite (task 4.2) loaded it for real. Reverted; `git diff --stat --
src/render/codeEngine.ts` confirmed empty; both files green again.
Standing invariants: `pnpm test` **996/996** (59 files, +10 — 9 clauses in the new `codeImportFence.test.ts`
+ 1 new case in `codeEnhancer.test.ts`; prior 986/986 at 4.4's close) · `pnpm test:browser` **126/126 files
green, 1351 passed, 15 skipped, 0 failed** (full suite, both engines, no `-t`, unchanged from 4.4's close —
this task adds no browser test file) · `pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY ·
`tests/manifest.test.ts` unmodified, green (8/8) · 007 `diagramImportFence.test.ts` **8/8** green, run
standalone — no shared helper with the new file (the walker code is duplicated, not imported, matching 007's
own file's standalone-ness) · `diagramActions.browser.test.ts` CSS pin **2,927 B** held · deps STILL **6** ·
structural shiki-import: still ONLY `src/render/codeEngine.ts` (this task's own clause A/B now assert this
structurally, not just by grep). Bytes BYTE- AND MD5-IDENTICAL to 4.4's close, both engines (test-only task,
confirmed BEFORE any test code was written and again after): content script **333,161 B**, `.output` **4.67
MB** (4,672,638 / 4,672,754 B), zip **1.43 MB** (1,425,035 / 1,425,093 B), manifests **654/770 B**,
`permissions: []` both, no `web_accessible_resources`. `perf-first-paint.ts --size 50kb`, isolation-run:
**143.5ms median (140.1–150.5ms range) vs <165ms — PASS**. `git diff --name-only HEAD` at the commit: ONLY
`src/render/codeImportFence.test.ts` (new) · `src/render/codeEnhancer.test.ts` · `specs/009-code-blocks/
tasks.md` (4.5's box) · this file. No other `src/`, `entrypoints/`, or `tests/` file in the diff.
★ **NO NEW § CARRIED ITEMS.** Nothing surfaced this task that isn't already recorded inline above (the
clause-C resolution and the `typeof import(...)` wrinkle are both this task's own findings, banked in this
same entry — not a carry-forward from 4.4, which already handed off exactly this task's scope and nothing
more).

★ **TASK 5.1 IS DONE — `codeTheme`, A FOURTH FIELD ON THE ONE GLOBAL SETTINGS ROW (D-9). NOW-POINTER
ADVANCES TO 5.2 NEXT.** tasks.md 5.1's own D-value tag, cited verbatim: *"[D-9; §3.5; §4 themes]"*.
★ **A KICKOFF SCOPE DIVERGENCE WAS CAUGHT AND ROUTED BACK BEFORE ANY PRODUCTION CODE, PER AGENTS.MD'S
STANDING RULE.** The session's kickoff prompt assumed 5.1 also wires `codeEnhancer.ts`'s
`PROVISIONAL_CODE_THEME` to settings and ships a settings UI — neither is in tasks.md 5.1's actual Files
list (`src/settings/settings.ts` · `src/settings/settings.test.ts` · `docs/trust/PERMISSIONS.md` only).
Both belong to **5.2** (`codeThemeControl.ts`'s own Verify line: *"persists via `SettingsPort.save`,
re-applies to every highlighted block on the page"* — the wiring lives there, not here). Flagged to the
human via `AskUserQuestion` before writing anything; answer: narrow scope, tasks.md's own text. **Resolution
(a) framing itself (5.1 = field + default only, 5.2 = the picker) HELD** — only the kickoff's WORK section
had over-reached inside that framing.
`Settings` (`src/settings/settings.ts`) gains `codeTheme: string`, doc-commented as spec 009 D-9's fourth
field, independent of `ThemeSetting` (spec 009 §4: "changing one shall never change the other").
`DEFAULT_SETTINGS.codeTheme` = `'github-dark'` — the SAME value `codeEnhancer.ts`'s (untouched, this task)
`PROVISIONAL_CODE_THEME` already carries, doc-commented EXPLICITLY PROVISIONAL pending task 8.4/8.5's M-4
ruling (008 standing rule: a value asserted final without being final is a lie about the decision state).
`SettingsPort`'s shape is unchanged (`save` already took `Partial<Settings>`). `docs/trust/PERMISSIONS.md`'s
IndexedDB-persistence row gains exactly the one field name tasks.md 5.1 quotes verbatim — *"theme choice, TOC
open-state + width, code-theme choice"* — confined to that one line; the separate "Settings message channel"
row (different phrasing, "TOC open-state, TOC width") is untouched, matching tasks.md's "confined diff on
that one line" (singular).
★ **RIPPLE BEYOND TASKS.MD 5.1'S LITERAL FILES LIST — NECESSARY, NOT SCOPE CREEP, EACH ONE MECHANICAL.**
Widening `Settings` by one required field breaks every existing exact-shape construction/assertion that
predates it — found by attempting `pnpm lint`/`pnpm test`/`pnpm test:browser` clean, not by inspection alone:
- `src/settings/settingsPort.ts`'s `coerceSettings` hand-builds a `Settings` object literal — a **compile
  error** without `codeTheme: v.codeTheme ?? DEFAULT_SETTINGS.codeTheme` (one line added).
- `src/app/store.ts`'s `describeStored()` hand-builds the trust-panel's `settings: Settings | null` from the
  raw stored row — a **second, independent compile error**, fixed the same way
  (`codeTheme: settingsRow.codeTheme ?? DEFAULT_SETTINGS.codeTheme`). This is NOT `getSettings()`'s D-12
  hand-enumeration trap (below) — it is the trust-panel's own disclosure literal, and it had to compile.
- Five existing test files asserted the OLD 3-field shape by exact `toEqual`/`Object.keys().sort()` and would
  have gone RED, not failed to compile: `src/settings/settingsPort.test.ts` (4 sites),
  `tests/browser/settingsPort.browser.test.ts` (6 sites), `tests/browser/settingsStore.browser.test.ts` (7
  sites, incl. the capture-flag suite's own **SHAPE INVARIANT** — its comment already named this exact
  scenario: *"a shared-record implementation (a field on Settings) would redden this"*). All updated to the
  4-field shape (`codeTheme: 'github-dark'` — the trap-fallback value, see below); comments updated
  "three fields" → "four fields" where they asserted the count in prose. `settings.test.ts`'s own
  `DEFAULT_SETTINGS` assertion (tasks.md 5.1's own file) updated the same way.
- Confirmed NOT needing changes, by inspection: `settingsSeam.ts`, `tocView.ts`, `themeControl.ts`/
  `reader.ts`, `themeRegistry.ts`, `diagramEnhancer.ts`, `store.test.ts` (spreads `DEFAULT_SETTINGS` or reads
  a single field, never hand-builds the full shape) — and `idbVersionchange.browser.test.ts`'s v2-shaped
  legacy seed row (`{id,theme,tocOpen,tocWidth}`, no `codeTheme`), which is CORRECT AS-IS: it represents a
  real pre-5.1 stored row and its own assertions read the raw row back byte-for-byte, never through
  `getSettings()`/`DEFAULT_SETTINGS`, so it is untouched by the type change by design, not by oversight.
★ **`getSettings()`'S D-12 HAND-ENUMERATION TRAP (`store.ts:233`, plan §4-1) IS DELIBERATELY LEFT LIVE FOR
`codeTheme` — NOT SILENTLY, NAMED HERE.** `getSettings()` spreads `DEFAULT_SETTINGS` first then overrides
only `theme`/`tocOpen`/`tocWidth` from the row — so a persisted `codeTheme` would compile fine but read back
as the default regardless of what was stored. Per D-12's own comment (*"the trap stays live for whoever adds
the next `Settings` field"*), this task is that "whoever," and the choice is stated rather than drifted into:
tasks.md 5.1's Files list does not include `store.ts`'s persistence functions, its Verify line does not ask
for a roundtrip test, and nothing in production calls `SettingsPort.save({codeTheme})` yet (5.2 is where a
real writer first exists). Extending the row-read now would be untestable dead code. **Whoever first calls
`save({codeTheme: …})` in production — expected to be 5.2 — must extend `getSettings()`'s hand-enumeration or
the write will silently vanish on the next read**, exactly D-12's documented risk. Filed here so it is not
rediscovered as a surprise at 5.2.
Standing invariants: `pnpm test` **996/996** (59 files, unchanged — one existing assertion edited, no new
`it`, matching tasks.md's "confined diff" framing, not a new-test task) · `pnpm test:browser` **126/126
files green, 1351 passed, 15 skipped, 0 failed** (full suite, both engines, no `-t`, unchanged from 4.5's
close — this task adds no browser test file) · `pnpm lint` EXIT=0 · `git diff tests/golden/output/` EMPTY ·
`tests/manifest.test.ts` **8/8** green · built manifests **654/770 B**, `permissions: []` both, no
`web_accessible_resources` · 009 `codeImportFence.test.ts` **9/9** · 007 `diagramImportFence.test.ts` **8/8**
· `diagramActions.browser.test.ts` CSS pin held (54/54 in that file pair) · deps STILL **6** ·
`perf-first-paint.ts --size 50kb`, isolation-run: **140.9ms median (138.5–157.0ms range) vs <165ms — PASS**.
Bytes, both engines identical Cr/Fx: content script **333,161 → 333,221 B (+60 B)**, app chunk **467,716 →
467,776 B (+60 B)**, `.output` **4.7 MB** (well under 5 MB), zip **1,425,102 B (Cr) / 1,425,161 B (Fx)** (well
under 2 MB each). ★ **The +60 B/engine delta is real, expected, and NOT a §3.2/§3.8 violation**: `settings.ts`
and `settingsPort.ts` are shared-graph modules the content script's `messagingPort` genuinely imports (the
M4 settings channel), so a new field + one coercion line is real code on both graphs — the standing
"content-script bytes byte-identical" invariant is specifically about the CODE-BLOCKS/Shiki surface never
reaching the content script, which structurally still holds: `codeImportFence.test.ts` clause A (untouched
this task) re-asserts the content-script graph reaches neither `codeEnhancer.ts` nor `codeEngine.ts` and
imports no `shiki` specifier, still green. `git diff --name-only HEAD` at the commit: `docs/trust/
PERMISSIONS.md` · `src/app/store.ts` · `src/settings/settings.ts` · `src/settings/settings.test.ts` ·
`src/settings/settingsPort.ts` · `src/settings/settingsPort.test.ts` · `tests/browser/
settingsPort.browser.test.ts` · `tests/browser/settingsStore.browser.test.ts` · `specs/009-code-blocks/
tasks.md` (5.1's box) · this file. No `codeEnhancer.ts`/`codeEngine.ts`/`codeView.ts`/UI file in the diff.
★ **NO NEW § CARRIED ITEMS beyond the D-12 trap note above** (which is itself the one finding this task
surfaced, banked in this same entry).

★ **TASK 5.2 IS DONE — THE CODE THEME PICKER, D-12'S TRAP CLOSED (D-9). NOW-POINTER ADVANCES TO 6.1
NEXT.** tasks.md 5.2's own D-value tag, cited verbatim: *"[D-9; §4 themes; §4 a11y]"*.
★ **TWO KICKOFF-VS-GROUND-TRUTH DIVERGENCES CAUGHT BEFORE ANY PRODUCTION CODE, PER AGENTS.MD'S STANDING
RULE.** (1) TYPE (i), MAJOR: the session's kickoff assumed a hand-curated ~14-theme set added to
`codeEngine.ts`'s `THEME_LOADERS`, mirroring `LANGUAGE_LOADERS`'s 6-language curated map. tasks.md 5.2's
own text rules this out explicitly: *"the listbox offers ≥14 entries, drawn from Shiki's own bundled
theme set (**not hand-curated**)"* — directly contradicting `codeEngine.ts`'s own header, which frames
`THEME_LOADERS` as deliberately curated specifically to dodge the bundle-bloat regression task 4.2
measured (13.6 MB `.output` from Shiki's full catalog barrel). Routed to the human via `AskUserQuestion`
before writing anything, with real numbers: Shiki 4.4.3 bundles 65 themes (`@shikijs/themes`,
1,465,107 B total measured this session) against a 4.67 MB `.output` baseline and a 5 MB ceiling — all
65 was measured infeasible, a hand-picked ~14 favorites list was what tasks.md's text rejected. Answer:
a bounded, MECHANICALLY-selected slice — not a favorites list, not the whole catalog. (2) Resolved from
ground truth directly, no human input needed: the kickoff's spine also assumed
`PROVISIONAL_CODE_THEME`'s comment needed force-resolving this task; 5.1's own entry above and
tasks.md 5.2's text both confirm the *value* stays provisional pending 8.4/8.5's M-4 ruling — 5.2 only
had to make the *mechanism* real. See PROVISIONAL resolution below.
★ **DECISION 1 — THE THEME SET, MEASURED.** Rule: **the 20 smallest Shiki-bundled themes by raw `.mjs`
byte size, ascending**, each candidate's own bg/fg contrast-checked against WCAG AA 4.5:1 (spec §4 a11y:
*"every code theme meets contrast requirements against its own background"*) and swapped for the
next-smallest passing theme on a fail. One swap needed: `solarized-light` (7,474 B, measured ratio
4.13:1) failed AA and was replaced by `vitesse-black` (15,243 B, ratio 14.59:1). Final 20: `min-dark`,
`red`, `min-light`, `solarized-dark`, `monokai`, `horizon`, `horizon-bright`, `andromeeda`, `dark-plus`,
`slack-dark`, `plastic`, `slack-ochin`, `light-plus`, `laserwave`, `github-light`, `github-dark`,
`vesper`, `aurora-x`, `vitesse-light`, `vitesse-black` — 217,343 B total, ~204,598 B of which is new
(`github-dark` was already shipped at 5.1). Both criteria (byte size, measured contrast) are objective
and reproducible — a resource constraint and a measured a11y floor — which is what "not hand-curated"
is read to mean, distinct from `LANGUAGE_LOADERS`'s own editorially-curated six. `codeEngine.ts` gains
`CODE_THEME_IDS` (exported, `Object.keys(THEME_LOADERS)`) so `codeThemeControl.ts` never duplicates the
catalog. `codeImportFence.test.ts` clause C's loader-edge count moves 7 → 26 (6 languages + 20 themes);
its module header gets a dated ADDENDUM rather than an edit to the 4.2-close paragraph, matching the
D-10(b)/9.3 precedent for not rewriting a snapshot that was correct when written.
★ **DECISION 2 — `PROVISIONAL_CODE_THEME` REMOVED, NOT RESOLVED-IN-PLACE (008 standing rule).** Once
`enhanceCode`'s fallback reads `currentSettings().codeTheme` (`settingsSeam.ts`, typed to always return
a full `Settings`, never `undefined`), the constant became dead weight — a second literal that could
drift from `DEFAULT_SETTINGS.codeTheme`, which already carries the identical value and the identical
"provisional pending 8.4/8.5" doc comment (written at 5.1). Deleted; `EnhanceOptions.theme`'s doc
comment now names `settings.codeTheme` as what it overrides. Single source of truth for the provisional
default, one place for 8.4/8.5 to eventually change.
★ **THE D-12 TRAP IS CLOSED.** `store.ts`'s `getSettings()` hand-enumeration extended:
`codeTheme: row.codeTheme ?? DEFAULT_SETTINGS.codeTheme` — the `??` matters, not a bare override:
`idbVersionchange.browser.test.ts`'s pre-5.1 legacy row has no `codeTheme` at all, so a bare
`row.codeTheme` would write `undefined` instead of falling back to the default, same guard
`settingsPort.ts`'s `coerceSettings`/`store.ts`'s `describeStored()` already use. New roundtrip test in
`tests/browser/settingsStore.browser.test.ts` (real engine): `putSettings({codeTheme})` →
`getSettings()` returns it, both engines.
★ **THE RE-THEME MECHANISM — `codeEnhancer.ts` GAINS A SECOND, INDEPENDENT HOST REGISTRY.** Mirrors
`themeRegistry.ts`'s `themeHosts`/`pruneThemeHosts`/`isConnected` pattern exactly but is functionally
SEPARATE from it (§4 forbids a code-theme change from ever touching the document theme or vice versa —
sharing the registry would conflate the two axes it exists to keep apart). `enhanceCode` registers any
host with ≥1 code fence; the new exported `reapplyCodeTheme(theme)` prunes dead hosts, re-tokenizes
every ALREADY-RENDERED block (retained-source `<pre>` still holds the original, untouched by D-6) and
**replaces** the current `.shiki` sibling via `replaceWith` — never `markCodeRendered`, which APPENDS
and would duplicate content. Per-fence tokenize/theme-apply failure on reapply leaves that ONE block
showing its PREVIOUS theme rather than the `failed` state initial render uses (AGENTS.md #5 carried one
block more granular: a repaint failing on an already-working block must not regress it to no colour).
★ **`codeThemeControl.ts` — THE NEW MODULE tasks.md 5.2 FLAGGED, NOT SILENTLY INVENTED.** A trigger pill
+ `role="listbox"` popover mirroring `diffChrome.ts`'s own pattern (not `themeControl.ts`'s cycle
button — structurally can't hold ≥14 choices), each row a native `<button role="option">`
(`diffChrome.ts`'s own reasoning: keyboard-operable for free, no hand-rolled keydown handling). Selecting
a row: `saveSettings({codeTheme})` then `reapplyCodeTheme(id)`, in that order, so a repaint failure can
never leave a pick unsaved. Mounted in `appShell.ts`'s header beside `themeControl`, app-page only —
§3.8 holds, code highlighting never reaches the content script, and neither does this control.
★ **A REAL DEFECT FOUND AND FIXED BY THE FULL BROWSER SUITE, NOT BY INSPECTION — EXACTLY THE CLASS OF
THING THIS GATE EXISTS TO CATCH.** First full `pnpm test:browser` run: 22 failures across 8 files,
including completely unrelated ones (`tableNetwork.browser.test.ts`'s sort buttons became unclickable —
*"`<button data-theme-id="dark-plus">…</button> … subtree intercepts pointer events`"*). Root cause:
APP_CSS's `.peekover-code-theme-picker{display:flex}` rule beats the UA `[hidden]{display:none}`
default, so `picker.hidden = true` left the popover visually `flex` and covering part of the header on
every appShell mount, on every subsequent test in the same browser session. `readerCss.ts`'s diffChrome
picker hit this exact defect first and already carries the fix pattern (`.peekover-diff-picker[hidden]
{display:none}`) — mirrored here. None of `codeThemeControl.ts`'s own unit/browser tests could have
caught it: they build the control standalone, with no APP_CSS stylesheet attached at all. Fixed, and a
new regression suite added (`codeThemeControl.browser.test.ts`, "under the REAL appShell stylesheet")
that mounts the genuine shell and asserts `getComputedStyle(picker).display === 'none'` while hidden —
the property the standalone tests structurally cannot see. Re-ran full suite clean after the fix.
★ **RED-FIRST ABLATIONS, ALL THREE CAPTURED AND REVERTED.** (1) D-12 fix reverted → the new roundtrip
test reds LOCALIZED, both engines, exact signature (default `'github-dark'` returned instead of the
written value). (2) Settings wiring reverted (hard-coded `'github-dark'` fallback) → LOCALIZED,
`codeEnhancer.test.ts`'s new precedence test. (3) Precedence inverted (`currentSettings().codeTheme ??
options.theme`) → PROPAGATING: 4.2's own pre-existing "theme-apply failure" test reds in BOTH
`codeEnhancer.test.ts` (jsdom) and `tests/browser/codeRender.browser.test.ts` (both engines), plus the
new precedence test — three sites, one mechanism, exactly the shape 4.2's own test invariant was meant
to guard.
★ **BUNDLE-VERIFY-GATE, FRESH BUILD BOTH ENGINES.** Content script **333,221 B, BYTE-IDENTICAL** to
5.1's close — themes are app-page-only, §3.8 holds, `codeImportFence.test.ts` clause A re-confirms the
content-script graph reaches neither `codeEnhancer.ts` nor `codeEngine.ts`. App chunk
**467,776 → 473,100 B (+5,324 B)** — the new UI module + wiring, not a theme chunk (those are separate
lazy files). `.output` **4.7 → 4.86 MB** (Cr `4,862,625 B`, Fx `4,862,741 B`, both under 5 MB). Zip
**1,425,102/1,425,161 → 1,469,717/1,469,776 B** (Cr/Fx, both under 2 MB). Manifests **654/770 B**,
byte-identical, `permissions: []`, no `web_accessible_resources`, both engines.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, +32 from 996/996 — 27 new in
`codeThemeControl.test.ts`, 5 new in `codeEnhancer.test.ts`). `pnpm test:browser` **128 files green,
1369 passed, 15 skipped, 0 failed** (+2 files/+18 tests from 126/1351 — `codeThemeControl.browser.test.ts`
new at 8 tests × 2 engines, +1 test × 2 engines in `settingsStore.browser.test.ts`). `pnpm lint` EXIT=0.
`git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green · 009 `codeImportFence.test.ts`
**9/9** at the new count · 007 `diagramImportFence.test.ts` **8/8** · `diagramActions.browser.test.ts`
CSS pin held · deps STILL **6**. `perf-first-paint.ts --size 50kb`, isolation-run: **142.6ms median
(140.2–150.9ms range) vs <165ms — PASS**. `git diff --name-only HEAD` at the commit: exactly
`specs/009-code-blocks/tasks.md` (5.2's box) · `src/app/appShell.ts` · `src/app/store.ts` ·
`src/render/codeEngine.ts` · `src/render/codeEnhancer.ts` · `src/render/codeEnhancer.test.ts` ·
`src/render/codeImportFence.test.ts` · `tests/browser/settingsStore.browser.test.ts` ·
`src/theme/codeThemeControl.ts` (new) · `src/theme/codeThemeControl.test.ts` (new) · `tests/browser/
codeThemeControl.browser.test.ts` (new) · this file. No `PERMISSIONS.md`/manifest/other `src/` or
`tests/` file in the diff — 5.2 added no settings row, no capability, no new disclosure.
★ **NO NEW § CARRIED ITEMS.** The only thing that could read as one — the `[hidden]`/cascade defect
class — is fixed in this same commit with its own regression coverage, not filed onward.

★ **TASK 6.1 IS DONE — THE COLLAPSE/EXPAND STRUCTURE, `data-code-state` (D-10). NOW-POINTER ADVANCES
TO 7.1 NEXT.** tasks.md 6.1's own D-value tag, cited verbatim: *"[D-10; §4 collapsible blocks; rows
12, 15, 19, 24]"*. Files touched: exactly `src/render/codeView.ts` · `src/theme/readerCss.ts` ·
`tests/browser/codeCollapse.browser.test.ts` (new) — tasks.md 6.1's own list, verbatim, no ride-along.
★ **TWO KICKOFF-VS-GROUND-TRUTH DIVERGENCES, BOTH CAUGHT BEFORE OR DURING WORK, NEITHER SILENTLY
FOLLOWED.** **(1) TYPE (i), MAJOR, CAUGHT AT STEP 0 BEFORE ANY PRODUCTION CODE.** This session's
kickoff's own resolution (a2) asserted "always default expanded — no auto-collapse threshold" as a
settled fact. tasks.md 6.1's own text and plan.md D-10 both directly contradict it: collapse IS
threshold-driven — *"each highlighted block over §8's (provisional) threshold gets
`data-code-state=\"collapsed\"`"* — with the threshold itself a PROVISIONAL placeholder (5.1's own
discipline) pending group 8's M-4/8.5 human gate. Routed to the human via `AskUserQuestion` before
writing anything; answer: follow tasks.md as ground truth, supersede the kickoff's resolution.
Riding on the same wrong hypothesis: the attribute shape (`data-code-state` / `"collapsed"`
`"expanded"`, not `data-code-collapsed` / `"true"` `"false"`) and the Files list (no `codeEnhancer.ts`
toolbar wiring — the trigger lives inside `codeView.ts`'s own `markCodeRendered`, the ONLY call site,
never a second seam). **(2) Resolved from ground truth directly, no human input needed — 4.3's own
precedent already litigated this exact question.** The kickoff's FORBIDDEN list named CS-byte-
identity as a hard stop ("collapse is app-page-only... any leak is a §3.8 violation"). Measured: the
CS bundle moved **333,221 → 334,858 B (+1,637 B)**, both engines, because `readerCss.ts`'s `READER_CSS`
is the ONE stylesheet string `reader.ts` injects on BOTH surfaces — there is no per-surface CSS
variant, so any CSS addition is structurally unavoidable on both bundles, the identical shape 4.3's
own close entry already found and ruled on for `sanitize.ts` (*"the kickoff's blanket CS-byte-identity
fence was an over-generalization... ruled to proceed and document rather than treated as a silent
violation"*). §3.8's actual claim — the ENGINE/ENHANCER stay app-page-only — is untouched:
`codeEnhancer.ts` and `codeEngine.ts` are both absent from this task's diff, and `codeImportFence.
test.ts` (unchanged, still 9/9) re-confirms the content-script graph reaches neither.
★ **THE DESIGN.** `codeView.ts`'s `applyCollapseIfNeeded` is called from `markCodeRendered` the
INSTANT `content` lands in the wrapper — the only call site, so collapse is decided once, off the
exact node already built, never re-evaluated (a theme repaint replaces the adopted `pre.shiki` and
never calls `markCodeRendered` again, so D-9's theme/collapse independence holds by construction).
Line count is read directly off `content`'s own `.line` spans (`codeEnhancer.ts`'s `adoptHighlighted`,
one per source line) — no second parse, no second highlight pass (tasks.md 6.1's own text, verbatim).
★ **A GENUINE OFF-BY-ONE, CAUGHT BY THE BOUNDARY TEST BEFORE COMMIT.** markdown-it's fence token
content always ends in exactly one `\n` (the last content line's own terminator), which Shiki's line
split turns into one PHANTOM trailing empty `.line` span on EVERY highlighted block, regardless of
source — verified empirically against the installed engine (`node -e` against `shiki/core` directly:
40 generated lines + trailing `\n` → 41 `tokens.tokens` entries; without the trailing `\n` → 40).
Every block since task 4.2 has silently carried this phantom line; 6.1 is the first feature that
COUNTS `.line` spans, so it is the first place the artifact became behaviourally significant (an
off-by-one on the collapse threshold). Fixed with `visibleLineCount`: excludes exactly one trailing
empty `.line` span — a real user-typed trailing blank line still counts, since it becomes the
SECOND-to-last span once the guaranteed terminator's own artifact is the one excluded.
`CODE_COLLAPSE_LINE_THRESHOLD = 40`, PROVISIONAL (5.1/`settings.ts`/`watchController.ts`'s own
discipline, doc-commented as such), pending group 8's M-4. The clamp (`readerCss.ts`, 320px
max-height + overflow:hidden on `pre.shiki`, keyed off `data-code-state`'s VALUE, never a JS-measured
height — row 12's rect-equality requirement holds by construction, nothing cached to drift from) and
the control (`peekover-code-toolbar__collapse`, a real `<button>`, `aria-expanded` + moving text, row
15) mirror 4.3's toolbar-control shape. Transition mirrors the copy button's own convention (its own
explicit `prefers-reduced-motion` neutraliser, not the sheet-wide `:host *` rule alone — that family's
established pattern, not the storage panel's later "dead control" exception, since this control sits
in the SAME toolbar as the copy button). No `display` rule tied to the native `hidden` attribute is
added anywhere (the control is never `.hidden`), so the `[hidden]`/cascade defect class from 5.2 does
not apply here — noted, not silently skipped.
★ **RED-FIRST ABLATIONS, BOTH LOCALIZED.** **(1) Attribute flip**: the click handler's flip logic was
temporarily replaced with an unconditional `'collapsed'` — reds row 15's aria-expanded/text test and
row 12's rect-growth test, LOCALIZED to `codeCollapse.browser.test.ts` alone (the toolbar/theme-picker
suites stayed green in the same run). **(2) CSS binding**: the collapsed-state selector's attribute
name was typo'd (`data-code-stat`) — reds the preview-overflow assertion and row 12's rect-growth
assertion, LOCALIZED the same way. Both reverted before commit.
★ **BUNDLE-VERIFY-GATE, FRESH BUILD BOTH ENGINES.** Content script **333,221 → 334,858 B (+1,637 B)**,
byte-identical Cr/Fx (md5s differ per engine, the established pattern). App chunk **473,100 →
475,579 B (+2,479 B)** — `codeView.ts`'s new JS logic plus its share of the shared CSS string. `.output`
**4.86 → 4.87 MB** (Cr `4,866,741 B`, Fx `4,866,857 B`, both under 5 MB). Zip **1,469,717/1,469,776 →
1,470,730/1,470,788 B** (Cr/Fx, both under 2 MB). Manifests **654/770 B**, byte-identical,
`permissions: []`, no `web_accessible_resources`, both engines. deps STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (unchanged — 6.1's Files list names no
unit test file; `applyCollapseIfNeeded` is covered only by the real-engine browser suite, per tasks.md
6.1's own Files list). `pnpm test:browser` **130 files green** (+2 from 128 — one new file ×2 engines),
**1385 passed, 15 skipped, 0 failed** (+16 from 1369 — `codeCollapse.browser.test.ts`'s 8 tests ×2
engines). `pnpm lint` EXIT=0. `git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green ·
009 `codeImportFence.test.ts` **9/9** unchanged (6.1 touches no import) · 007
`diagramImportFence.test.ts` **8/8** · `diagramActions.browser.test.ts` CSS pin held (part of the full
green browser run). `perf-first-paint.ts --size 50kb`, isolation-run (fresh build): **153.7ms median
(150.0–162.1ms range) vs <165ms — PASS**. `git diff --name-only HEAD` at the commit: exactly
`specs/009-code-blocks/tasks.md` (6.1's box) · `src/render/codeView.ts` · `src/theme/readerCss.ts` ·
`tests/browser/codeCollapse.browser.test.ts` (new) · this file. No `PERMISSIONS.md`/manifest/other
`src/` or `tests/` file in the diff.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 7.1 IS DONE — TOTAL ENGINE-LOAD FAILURE, PAGE-WIDE (§3.9). NOW-POINTER ADVANCES TO 7.2
NEXT.** tasks.md 7.1's own tag, cited verbatim: *"[§3.9; §4 highlighting degradation]"* — no D-value
(7.1 is a systemic-degradation proof, not scoped to a plan D-value). Files list, verbatim:
`src/render/codeEnhancer.ts` · `tests/browser/codeDegrade.browser.test.ts`.
★ **THE PRODUCTION DIFF IS EMPTY — `codeEnhancer.ts` ships byte- and md5-identical to HEAD, a
no-op RECORDED as such, not silently transcribed off the Files list (008's "a PROPOSED comment left
on a chosen value is a lie about the decision state" discipline, applied here to a whole-file
no-op).** Investigated first: `highlightFences`'s outer `try { engine = await loadCodeEngine(...) }
catch { for (const pair of pairs) markCodeFailed(...); return; }` (`codeEnhancer.ts:258-264`)
**already existed, built at task 4.2** — its own doc comment already states *"Engine-load failure is
document-wide (§3.9's first failure): no fence got as far as having its own outcome, so every pair
is marked `failed` together"*, and `codeRender.browser.test.ts`'s own 4.2 test ("engine-load
failure: EVERY fence on the page stays plain, the page stays intact") already exercises the same
rejecting-loader behavior. **What 4.2 did NOT prove is that THIS specific guard is load-bearing**:
4.2's own revert-and-fail removed the PER-FENCE `try`/`catch` inside the loop, which structurally
cannot touch this path — the loop never starts when the outer `await` rejects. 7.1's job, re-derived
against the tree rather than assumed from the Files list, was a DEDICATED test file with its OWN
ablation isolating the outer guard — exactly tasks.md 7.1's Verify line asks for, and exactly why
`codeEnhancer.ts` is named in the Files list despite shipping no diff.
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** No new mechanism — the guard predates
this task; the work is a browser-test addition following `codeRender.browser.test.ts`'s own
established shape (`directHost` + injectable rejecting loader + `settled()` polling), with no design
decision, no threshold, no cross-file wiring. Falls squarely in the framework's "pure extension of
an existing pattern" bucket.
★ **RED-FIRST ABLATION, LOCALIZED.** Outer `try`/`catch` temporarily removed (`engine = await
loadCodeEngine(...)`, unguarded). Result, both engines: the assertion `wrapper.getAttribute
(CODE_STATE_ATTR)).toBe('failed')` timed out — **`Expected: "failed", Received: "pending"`** — every
wrapper stuck at its pre-failure state forever, PLUS a genuine unhandled rejection (`Error: boom`)
surfaced from `highlightFences` — the "propagates" tasks.md 7.1's Verify line names, in its own
units. **LOCALIZED**: exactly 2 of 132 browser test files failed (the new file × 2 engines); the
other 130 stayed green in the same run. Reverted; `git diff --stat src/render/codeEnhancer.ts`
confirmed EMPTY (byte-identical) after revert; the targeted test re-ran GREEN on both engines.
★ **BUNDLE-VERIFY-GATE, FRESH BUILD BOTH ENGINES — EVERY FIGURE BYTE-IDENTICAL TO 6.1's CLOSE**
(expected: no production diff). Content script **334,858 B** both engines. App chunk **475,579 B**
both engines. `.output` **4.87 MB** (Cr `4,866,741 B` / Fx `4,866,857 B`). Zip **1,470,730 /
1,470,788 B** (Cr/Fx). Built manifests **654 / 770 B**, `permissions: []`, no
`web_accessible_resources`, both engines. deps STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files — unit count unchanged; 7.1's
Files list names no unit test file). `pnpm test:browser` **132 files green** (+2 from 130 — one new
file ×2 engines), **1387 passed, 15 skipped, 0 failed** (+2 from 1385). `pnpm lint` EXIT=0. `git diff
tests/golden/output/` EMPTY. 009 `codeImportFence.test.ts` **9/9** unchanged (7.1 touches no
import). 007 `diagramImportFence.test.ts` **8/8**. `diagramActions.browser.test.ts` CSS pin held
(part of the full green browser run). `perf-first-paint.ts --size 50kb`, isolation-run (fresh
build): **144.5ms median (140.0–154.3ms range) vs <165ms — PASS**. `git diff --name-only HEAD` at
the commit: exactly `specs/009-code-blocks/tasks.md` (7.1's box) · `tests/browser/codeDegrade.
browser.test.ts` (new) · this file. No `src/` file in the diff — `codeEnhancer.ts`'s own diff is the
empty one recorded above.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 7.2 IS DONE — THEME-APPLY FAILURE AT THE SELECTION LEVEL, PAGE-WIDE (§3.9). NOW-POINTER
ADVANCES TO 8.1 NEXT.** tasks.md 7.2's own tag, cited verbatim: *"[§3.9; §4 themes degradation]"*.
Files list, verbatim: `src/render/codeEnhancer.ts` · `tests/browser/codeDegrade.browser.test.ts`.
★ **THE KICKOFF'S OWN RECOMMENDED RESOLUTION (RETRY WITH `DEFAULT_SETTINGS.codeTheme`) WAS FOUND
WRONG AT STEP 0 AND ROUTED VIA `AskUserQuestion` BEFORE ANY IMPLEMENTATION — THE USER CONFIRMED THE
EMPTY-DIFF PATH.** Investigated first: `highlightFences`'s per-fence `try`/`catch` around
`tokenizeAndAdopt` (task 4.2, `codeEnhancer.ts:267-274`) already catches an unresolvable theme
exactly like an unresolvable language — `codeEngine.ts`'s own module header states one failure
surface for "unknown key" and "tokenize genuinely failed" alike — and since `enhanceCode` passes the
SAME `theme` string (`options.theme ?? currentSettings().codeTheme`) to every pair, a bad PERSISTED
value already fails every fence identically: page-wide, `markCodeFailed`'s plain retained-`<pre>`
state. **Task 5.2 already proved this exact scenario at the jsdom level**
(`codeEnhancer.test.ts:406-415`, "falls back to settings.codeTheme when no override is passed":
`saveSettings({ codeTheme: 'not-a-real-theme-id' })` → `enhanceCode(host)` with no override → wrapper
ends `'failed'`) — and that test's own comment is explicit the silent-default-fallback shape was
deliberately rejected: *"A hard-coded fallback would have rendered fine; only a genuine settings read
can fail here."* Implementing a retry-to-`DEFAULT_SETTINGS.codeTheme` fallback would have made that
already-shipped 5.2 test start rendering successfully instead of failing — a regression against an
established, deliberately-written invariant, in a file (`codeEnhancer.test.ts`) 7.2's own Files list
does not name. So **`codeEnhancer.ts` ships byte-identical to HEAD, a no-op RECORDED as such**
(mirrors 7.1's own empty-diff precedent) — 7.2's real job, re-derived against the tree rather than the
kickoff's argued preference, is the BROWSER-level (Cr+Fx) proof of the SAME degraded state when
triggered through PERSISTED settings rather than an injected loader/override, exactly what jsdom
cannot answer (`codeEnhancer.test.ts`'s own header: "what jsdom cannot answer … is the browser
suite's job").
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** No new mechanism — the per-fence guard
predates this task (4.2); the work is a browser-test addition following `codeDegrade.browser.test.ts`'s
own 7.1 shape (`directHost` + `settled()` polling), with no design decision, no threshold, no
cross-file wiring. Pure extension of an existing pattern, same bucket as 7.1.
★ **RED-FIRST ABLATION, LOCALIZED.** Per-fence `try`/`catch` inside `highlightFences`'s loop
temporarily removed (`tokenizeAndAdopt` awaited unguarded). Result, both engines: the new 7.2 test's
assertion `wrapper.getAttribute(CODE_STATE_ATTR)).toBe('failed')` timed out — **`Expected: "failed",
Received: "pending"`** — every wrapper stuck at `pending` forever, PLUS a genuine unhandled
`ShikiError: Theme 'not-a-real-theme-id' not found` surfaced from `tokenizeAndAdopt`/`highlightFences`
— the "raw dump or uncaught error" tasks.md 7.2's Verify line names, in its own units. **LOCALIZED**:
exactly 2 of 132 browser test files failed (the 7.2 test × 2 engines); 7.1's own tests in the SAME
file stayed green in the same run, proving the ablation touched only the mechanism 7.2 exercises (the
per-fence catch), never 7.1's outer engine-load catch. Reverted; `git diff --stat
src/render/codeEnhancer.ts` confirmed EMPTY (byte-identical) after revert; the targeted test re-ran
GREEN on both engines.
★ **BUNDLE-VERIFY-GATE, FRESH BUILD BOTH ENGINES — EVERY FIGURE BYTE-IDENTICAL TO 7.1's CLOSE**
(expected: no production diff). Content script **334,858 B** both engines. App chunk **475,579 B**
both engines. `.output` **4.87 MB** (Cr `4,866,741 B` / Fx `4,866,857 B`). Zip **1,470,730 /
1,470,788 B** (Cr/Fx). Built manifests **654 / 770 B**, `permissions: []`, no
`web_accessible_resources`, both engines. deps STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files — unit count unchanged; 7.2's
Files list names no unit test file, and no jsdom test file was touched). `pnpm test:browser` **132
files green** (unchanged file count — 7.2 extends 7.1's existing file rather than adding a new one),
**1389 passed, 15 skipped, 0 failed** (+2 from 1387 — the new 7.2 `it` ×2 engines). `pnpm lint`
EXIT=0. `git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 009
`codeImportFence.test.ts` **9/9** unchanged (7.2 touches no import). 007 `diagramImportFence.test.ts`
**8/8**. `diagramActions.browser.test.ts` CSS pin held (part of the full green browser run).
`perf-first-paint.ts --size 50kb`, isolation-run (fresh build): **146.0ms median (142.1–160.6ms range)
vs <165ms — PASS**. `git diff --name-only HEAD` at the commit: exactly
`specs/009-code-blocks/tasks.md` (7.2's box) · `tests/browser/codeDegrade.browser.test.ts` (extended)
· this file. No `src/` file in the diff — `codeEnhancer.ts`'s own diff is the empty one recorded
above.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 8.1 IS DONE — M-1, THE BYTE BUDGET, D-11's FOUR-COMPONENT ABLATION-PROVEN DECOMPOSITION.
PRODUCED NUMBERS ONLY, CHOSE NOTHING. NOW-POINTER ADVANCES TO 8.2 NEXT.** tasks.md 8.1's own tag,
cited verbatim: *"[D-11; §5 bytes; finding 1; §7-7]"*. Files list, verbatim: `docs/ai/progress.md`
(numbers only) + the task report — **no `scripts/` file, no `package.json` alias**. ★ **The
kickoff's own recommendation (a committed `scripts/byte-budget.ts` + a `package.json` alias) was
found WRONG at Step 0 and routed via `AskUserQuestion` before any implementation** — ruled out
because the Files list names only `docs/ai/progress.md`, and a new committed script is neither
compile- nor Verify-mandatory. The user confirmed: proceed as scoped. Every measurement below is
ad-hoc ablation (temporarily remove/stub a component, rebuild, measure the delta, restore to
byte-/hash-identical), mirroring tasks 1.2 and 4.5's own precedent — nothing new lands in `src/` or
`scripts/`.
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** No new mechanism — the ablation
pattern (remove/rebuild/measure/restore) is already established at 1.2 and 4.5; this task combines
several such ablations but introduces no new design decision, threshold, or cross-file wiring.
★ **BASELINES RE-CONFIRMED FRESH, BOTH ENGINES, BEFORE ANY ABLATION (fresh `rm -rf .output` +
rebuild).** CS **334,858 B** both engines. App chunk **475,579 B** both engines, SAME chunk hash
`app-BlMcDd3E.js` on both — the control that lazy vendor chunks (language/theme/engine data) are
engine-independent, so the component ablations below were run on Chrome alone. `.output`
**4,866,741 B (Cr) / 4,866,857 B (Fx)**. Zip **1,470,730 / 1,470,788 B**. Manifests **654/770 B**,
`permissions: []`, no `web_accessible_resources`. deps **6**. All match the standing invariant set
exactly.
★ **COMPONENT 1 — CONTENT-SCRIPT DELTA: ZERO SHIKI BYTES, PROVEN STRUCTURALLY, CITED NOT
RE-DERIVED.** CS moved **329,233 → 334,858 B (+5,625 B)** since the pre-1.1 baseline, byte-identical
Cr/Fx — but the structural fence (`codeImportFence.test.ts` clauses A/B, 9/9 green, task 4.5)
already proves the content-script graph reaches neither `codeEngine.ts` nor `codeEnhancer.ts` and
imports no `shiki` specifier. The +5,625 B is entirely `readerCss.ts`'s shared toolbar/collapse CSS
(landed at 4.3/6.1, on **both** graphs by construction, already ruled non-Shiki at those tasks' own
close entries) — **not one of D-11's four components**, stated here for completeness and excluded
from the M-1 accounting, exactly as the Verify line's "0 B" framing means (Shiki-attributable bytes,
not the total byte count).
★ **COMPONENT 2 — APP-PAGE DELTA, EACH PIECE INDEPENDENTLY ABLATED WITH A FIRING CONTROL.**
- **(a) The JS-regex-engine module (D-3) — 169,635 B.** Ablated by stubbing `loadShikiCore` (no
  `import('shiki/core')`) and removing the static `createJavaScriptRegexEngine`/`shiki/engine/
  javascript` import + call. The lazy `shiki/core` runtime chunk (111,981 B) vanished entirely from
  `.output`; the app chunk dropped **475,579 → 417,925 B (−57,654 B)**, the regex engine's own
  inlined static code. CS unchanged (334,858 B); language/theme chunks confirmed still present,
  proving the ablation isolated only the engine.
- **(b) The bundled language-grammar set (6 languages) — 395,967 B.** Ablated by emptying
  `LANGUAGE_LOADERS`. `.output` total **4,866,741 → 4,470,774 B**. App chunk **475,579 → 475,062 B
  (−517 B**, the shrunk object literal itself**)**. CS unchanged.
- **(c) The ≥14-theme data (20 themes shipped) — 197,102 B.** Ablated by emptying `THEME_LOADERS`.
  `.output` total **4,866,741 → 4,669,639 B**. App chunk **475,579 → 474,363 B (−1,216 B**, the
  shrunk object literal + `CODE_THEME_IDS`**)**. CS unchanged.
- **(d) Peekover's own glue code (`codeEngine.ts`/`codeEnhancer.ts`/`codeView.ts`/
  `codeThemeControl.ts`/the toolbar) — 8,408 B, a RESIDUAL, cross-checked against an independent
  combined ablation.** (a)+(b)+(c) sum to **762,704 B**. A SEPARATE ablation — disabling BOTH
  `enhanceCode` call sites (`readerPane.ts`, `appShell.ts`) AND `codeThemeControl`'s mounting in
  `appShell.ts` (the only OTHER reachability path into `codeEngine.ts`, since `codeThemeControl.ts`
  imports `CODE_THEME_IDS` independent of whether any fence is ever highlighted) — measured the FULL
  Shiki-attributable delta directly: `.output` **4,866,741 → 4,095,629 B (−771,112 B)**. **771,112 −
  762,704 = 8,408 B, exactly** — zero unaccounted byte. All edits reverted (`git checkout --`) after
  each ablation; the final rebuild confirmed byte- AND chunk-hash-identical to the pre-ablation
  baseline, both engines (`app-BlMcDd3E.js`, 475,579 B, both).
★ **TOTAL APP-PAGE SHIKI DELTA: 771,112 B, CROSS-CHECKED TWO INDEPENDENT WAYS — ZERO DISCREPANCY.**
★ **COMPONENT 3 — `PNPM ZIP` DELTA: MEASURED, AND A GENUINE FINDING, STATED NOT FORCED.** Zip delta
**164,217 B, IDENTICAL both engines** (Cr 1,306,513→1,470,730; Fx 1,306,571→1,470,788). This does
**NOT** equal the raw `.output` sum (CS +5,625 + app-page +771,112 = **776,737 B**) — `pnpm zip`
deflate-compresses, and ~763 KB of the app-page delta is highly repetitive TextMate grammar/theme
JSON that compresses far harder than the codebase's existing content. Read literally, "reconciled to
the sum of CS+app exactly" cannot hold ACROSS a compression boundary by construction — the RAW
`.output` accounting is what reconciles exactly (zero residual, above); the compressed zip figure is
reported alongside it, not forced to match. Both numbers stand for 8.5.
★ **COMPONENT 4 — BOUNDS RE-CHECKED, NEITHER BINDS.** `.output` **4,866,741 B (Cr) / 4,866,857 B
(Fx)**, both under the **5 MiB (5,242,880 B)** package-base bound — headroom **~367 KiB**. Zip
**1,470,730 / 1,470,788 B**, both under the **2 MB (2,097,152 B)** per-engine bound — headroom
**~612 KiB**. §7-7's carried subset-build question does **NOT** fire — stated as a measurement, not
chosen (M-1's own "forbidden from choosing" framing).
★ **TREE-SHAKING CHECK, WHILE THE ABLATION WAS STANDING (the standing lesson).**
`CODE_THEME_IDS = Object.freeze(Object.keys(THEME_LOADERS))`, and `LANGUAGE_LOADERS`/
`THEME_LOADERS` themselves: every export that touches them (`CODE_THEME_IDS`, `languageInputFor`,
`themeInputFor`) is consumed (`codeThemeControl.ts`/`codeEnhancer.ts`) — no unused export carrying a
retained initializer, unlike the `ARR.slice()` lesson's pattern. No defect found.
★ **BUNDLE-VERIFY-GATE — BYTE- AND CHUNK-HASH-IDENTICAL TO 7.2's CLOSE** (expected: 8.1 ships NO
production diff). CS **334,858 B** both engines. App chunk **475,579 B** both engines
(`app-BlMcDd3E.js`, same hash). `.output` **4,866,741 / 4,866,857 B**. Zip **1,470,730 /
1,470,788 B**. Manifests **654/770 B**, `permissions: []`, no `web_accessible_resources`. deps
STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, unchanged — 8.1 touches no
test file). `pnpm test:browser` **132 files green, 1389 passed, 15 skipped, 0 failed** (unchanged).
`pnpm lint` EXIT=0. `git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 009
`codeImportFence.test.ts` **9/9** unchanged. 007 `diagramImportFence.test.ts` **8/8**.
`diagramActions.browser.test.ts` CSS pin held. `perf-first-paint.ts --size 50kb`, isolation-run:
**148.1ms median (142.9–163.9ms range) vs <165ms — PASS**. `git diff --name-only HEAD` at the
commit: exactly `specs/009-code-blocks/tasks.md` (8.1's box) · this file. No `src/`/`scripts/`/
`tests/` file in the diff — every ablation edit was reverted before commit, `git status` confirmed
clean before staging.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 8.2 IS DONE — M-2, FIRST PAINT UNDER SHIKI, ON GROUP 2's HARNESS, A-B-A WITHIN THIS
MILESTONE. PRODUCED A NUMBER ONLY, CHOSE NOTHING. NOW-POINTER ADVANCES TO 8.3 NEXT.** tasks.md 8.2's
own tag, cited verbatim: *"[D-1; §5 first paint; Ruling 4; finding 1, 7, 8]"*. Files list, verbatim:
`docs/ai/progress.md` (numbers only) + the task report — no new `scripts/`/`tests/` file, mirroring
8.1's own precedent.
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** The primary measurement re-runs
`scripts/perf-app-first-paint.ts` (built whole at 2.2) unmodified — a pure extension of an already-
established harness, no new mechanism. The conditionality guard extends 1.2's own already-proven
spy pattern (`codeEngine.test.ts:121-138`) to a browser-level node-count comparison using the SAME
injectable-`loader` seam `codeDegrade.browser.test.ts` (task 7.1) already exercises — no new
infrastructure, no new design decision.
★ **ASKUSERQUESTION ROUTING: NOT INVOKED, stated with defense.** tasks.md 8.2's text fully
determines GATE_MS (165, inherited from 2.2), iteration protocol (7 runs, cold discarded, mirrors
2.2), and the guard's three-arm shape (mount-alone / enhanceCode-no-fence / enhanceCode-code-
bearing). Two implementation-detail interpretations were needed and are recorded as divergences
per standing rule #1, not routed to a human: (i) whether the three-arm guard needed a NEW committed
test file — resolved NO, since the Files list names only `docs/ai/progress.md` and 8.1's own
precedent already establishes "ad-hoc measurement, no new committed script" for this Files-list
shape; the guard was written as a scratch file (`tests/browser/_scratch8_2CostGuard.browser.test.ts`),
run once on both engines, then deleted before commit — never staged. (ii) what "a code-bearing,
`CLAUDE.md`-named-equivalent-weight document" means for THIS pipeline — 008's own 3.10 borrowed
"CLAUDE.md" because that milestone's feature (agent-file badge) is filename-triggered; this
milestone's fence detection is structural (`pre > code[class^="language-"]`, `codeEngine.ts:209`),
never filename-driven, and this repo's actual `CLAUDE.md` is an 11-byte `@AGENTS.md` import with no
fence of its own — so a literal same-named fixture would prove nothing. Read instead as "equivalent-
weight to a real, small, agent-authored document" (this repo's own `AGENTS.md`, 3,777 B, checked
this session via `wc -c`), the real document CLAUDE.md points to. The constructed arm-3 fixture
landed at **10,215 B** (repeated-section filler overshot the 3,777 B target — stated honestly, not
forced to a false "equivalent" claim; the guard's assertions do not depend on the exact byte count,
only on the loader firing and the node count exceeding arm 2's).
★ **THE PRIMARY NUMBER — FRESH BUILD, BOTH ENGINES, BEFORE MEASURING (`rm -rf .output` +
`pnpm build` + `npx wxt build -b firefox`).** CS **334,858 B** both engines. App chunk **475,579 B**
both engines, same chunk hash `app-BlMcDd3E.js`. Manifests **654/770 B**, `permissions: []`. All
match the standing invariant set and 8.1's close exactly — confirming "the tree as it now stands"
(Shiki fully wired) is what group 2's harness ran against.
★ **`perf-app-first-paint.ts`, THREE BACK-TO-BACK RUNS (A-vs-A, then a third for confidence, all
isolation-run, same quiesced build):** RUN A **median 96.3ms, floor 87.9ms**. RUN B **median 90.8ms,
floor 86.2ms**. RUN C **median 95.8ms, floor 88.1ms**. **A-vs-A agreement, stated honestly rather
than forced: floor spread 1.9ms** (86.2–88.1ms, comfortably inside 2.2's own 2.0ms floor precedent
and `perf-first-paint.ts`'s 2.5ms floor precedent); **median spread 5.5ms** (90.8–96.3ms) — wider
than 2.2's own 0.1ms same-session precedent and somewhat wider than `perf-first-paint.ts`'s 3.8ms
precedent, but the SAME order of magnitude, and Runs A/C (96.3/95.8ms) agree within 0.5ms with Run B
as the lower outlier; not near-tolerance-edge relative to the ~69–79ms of headroom every arm carries
against the gate, so no further rerun was taken. All three PASS: `GATE_MS = 165` (printed by the
script for reference; this task produces the number, it does not rule pass/fail/worrying/fine).
★ **THE A-B-A COMPARISON, THIS MILESTONE'S OWN — 2.2's PRE-SHIKI FLOOR vs. THIS POST-SHIKI RUN.**
2.2's pre-Shiki reading (banked at that task's own close): RUN A median 89.2ms/floor 84.8ms, RUN B
median 89.3ms/floor 86.8ms. This task's post-Shiki reading (above): median 90.8–96.3ms, floor
86.2–88.1ms. **The delta reads as FLAT, within the same noise band the pre-Shiki A-vs-A itself
carried** — median moved +1.5 to +7.0ms, floor moved +1.4 to +3.3ms, both well inside the ~2–5.5ms
same-session noise this task's own three runs already showed. **No verdict rendered — 8.5's job —
but the number itself does not read as Shiki costing anything distinguishable from measurement
noise on THIS fixture** (50.4 KB / 62-section typical doc), stated as an observation for 8.5, not a
ruling.
★ **THE STRUCTURAL CONDITIONALITY GUARD — THREE ARMS, BOTH ENGINES, AD-HOC (scratch file, deleted
before commit, per the Files-list divergence above).** The spy-call-count half (fence-free root ⇒
`loadCodeEngine` never invoked, with the firing control) is **cited, not re-derived** — already
proven at unit level, `codeEngine.test.ts:121-138` (task 1.2). NEW this task: the shadow-root
node-count equality against a bare `mount()` arm, and the third code-bearing positive-control arm.
**Arm 1 (bare `mount()`, no-fence doc):** 23 shadow-root nodes. **Arm 2 (`mount()` +
`enhanceCode()`, SAME no-fence doc):** 23 nodes — **EQUAL to arm 1** — loader spy **0 calls**, no
`.peekover-code` wrapper anywhere in the shadow root. **Arm 3 (`mount()` + `enhanceCode()`, the
code-bearing 10,215 B fixture, real engine via a call-through spy):** 188 nodes — **greater than
arm 2** — loader spy **1 call** (the positive control that fires), the fence reached the `rendered`
terminal state. **PASS on both engines, identical readings Chromium and Firefox** (vitest browser
project, both projects green — Cr and Fx run the same scratch file, same numbers on both).
★ **BUNDLE-VERIFY-GATE — BASELINE CONFIRMATION (8.2 is measurement-only, no production diff
expected).** Byte- and chunk-hash-identical to 8.1's close, confirmed above before measuring: CS
**334,858 B**, app **475,579 B** (`app-BlMcDd3E.js`), both engines. Manifests **654/770 B**,
`permissions: []`. deps STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, unchanged — 8.2 touches no
production or test file). `pnpm test:browser` **132 files green, 1389 passed, 15 skipped, 0 failed**
(unchanged — run AFTER the scratch guard file was deleted). `pnpm lint` EXIT=0. `git diff
tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 007 `diagramImportFence.test.ts`
**8/8**. 009 `codeImportFence.test.ts` **9/9**. `diagramActions.browser.test.ts` CSS pin held, both
engines (54/54 passed). `perf-first-paint.ts --size 50kb`, isolation-run (content-script, unaffected
by this task but re-checked as a standing invariant): **147.2ms median (144.0–151.4ms range) vs
<165ms — PASS**. `git diff --name-only HEAD` at the commit: exactly `specs/009-code-blocks/tasks.md`
(8.2's box) · this file. No `src/`/`scripts/`/`tests/` file in the diff — the scratch guard file was
deleted, never staged, `git status` confirmed clean before staging.
★ **NUMBERS PRESERVED FOR 8.5 (M-2's pass/fail decision):** post-Shiki app-page first paint,
50.4 KB typical doc — **median 90.8–96.3ms, floor 86.2–88.1ms, against `GATE_MS = 165`** (headroom
~69–79ms median, ~77–79ms floor) — **PASS as measured, no verdict rendered here**. Pre-Shiki floor
this compares against (2.2): median 89.2/89.3ms, floor 84.8/86.8ms. Delta reads as flat, within
noise. Structural conditionality guard: fence-free costs 0 nodes/0 loader calls vs. a bare mount,
code-bearing fires and adds nodes, both engines.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 8.3 IS DONE — M-3, AUTO-DETECTION'S THREE MECHANISMS PRICED AGAINST THREE AXES. PRODUCED NINE
NUMBERS, CHOSE NOTHING. NOW-POINTER ADVANCES TO 8.4 NEXT.** tasks.md 8.3's own tag, cited verbatim:
*"[D-12; §3.7; §8 M-3; plan risk 7]"*. Files list, verbatim: `docs/ai/progress.md` (numbers only) + the
task report — no new `scripts/`/`tests/` file, mirroring 8.1/8.2's own precedent.
★ **D-12 AMBIGUITY RESOLVED, RECORDED AS A DIVERGENCE (fact J).** The kickoff flagged D-12 as possibly
meaning either "the `store.ts:233` `getSettings()` hand-enumeration trap" or "auto-detection pricing."
`plan.md:164-172` is unambiguous — D-12 is auto-detection pricing, three named mechanisms against three
named axes; no plan.md text anywhere connects D-12 to a `store.ts` hand-enumeration trap. Resolved
directly from the text, not routed.
★ **PLAN-MODE JUDGMENT: WARRANTED, stated with defense — and used.** Unlike 8.1/8.2 (pure extensions of
an existing ablation/harness pattern), 8.3 required genuinely new measurement infrastructure: a
hand-written heuristic (no prior implementation to extend), a ground-truthed corpus assembled from
scratch, and sourcing/pricing a real "genuine local model" package with no existing candidate in the
codebase. Plan mode entered; plan approved before implementation.
★ **ASKUSERQUESTION ROUTING: INVOKED, stated with defense.** One genuine design fork surfaced: how
rigorously to price mechanism (b)'s accuracy/latency axes — actually run a real local-model package in
an isolated scratch sandbox for directly-measured numbers, vs. cite the package's own published
documentation. Both are defensible under precedent (8.1/8.2 favor lighter ad-hoc measurement; fact I's
self-validation bar favors directly-measured evidence) — genuine ambiguity, not an implementation
detail. Routed via AskUserQuestion. **User chose: actually run it in a scratch sandbox.**
★ **CORPUS (n=23), BIAS STATED.** Repo-wide scan (64 `.md` files, excluding `node_modules`/`.git`/
`.output`/`.wxt`) for fenced blocks with no language info string found **23 unlabeled fences** — this
count already includes `tests/golden/fixtures/code.md:13`'s deliberately-unlabeled prose fence, so D-12's
"this repo's own unlabeled fences ... plus the golden fixtures" corpus definition is satisfied without
double-counting. **Bias sentence (per D-12/plan.md:315's own caveat):** this repository's own docs are
biased toward directory trees, shell/JS snippets, and a house "annotated pseudocode" convention (`#`
Python-style trailing comments over JS-shaped call sequences, used throughout `specs/*/plan.md`) — not
representative of arbitrary agent-authored markdown a real user would open; reported with its sample, not
as a population estimate. Ground truth assigned by inspection: **7 items** are genuine TypeScript
(`interface`/`type` declarations); **16 items** are non-code (the house pseudocode convention, directory
trees, a bare file list, and one deliberate prose fixture).
★ **MECHANISM (a) — HEURISTIC. Byte cost, accuracy, latency, all directly measured.** Scratch file
(`codeDetectHeuristic.ts`, deleted before commit — 8.2's fact F precedent), token/keyword shape matching
over the fence's first 10 lines, with explicit structural non-code detectors (directory-tree box-drawing
chars, arrow/diagram glyphs, bare file lists) checked before language signatures, and a required
score-margin over the runner-up before claiming a match (a mixed-signal fence must decline, not guess).
**Byte cost: 1,856 B**, esbuild-bundled + minified standalone (esbuild 0.27.7, already a project devDep).
**Accuracy: 22/23 = 95.7%** (15/16 non-code items correctly declined, 7/7 language items correctly
identified — one false positive: `specs/008-persona-1-qol/plan.md:220`'s `<one line>`/`<what is missing>`
placeholder angle brackets tripped the HTML-tag signature, a genuine, honestly-reported limitation).
**Latency: 3.149 microseconds/fence** (1000-iteration tight loop over the corpus, synchronous, no chunk
to load — matches D-12's "expected near-zero" framing, now with a real number).
★ **MECHANISM (b) — LOCAL MODEL. Real scratch-sandbox measurement, per the user's routing choice.**
Candidate: **`@vscode/vscode-languagedetection`** — VS Code's actual shipped production local ML model
for this exact task (guesslang-derived, its own bundled TF.js runtime) — chosen over `linguist-js`
(statistical/CLI, Node-fs-oriented, not a genuine "model") and `guesslang` itself (unpublished, 404 on the
npm registry). **No second package needed** — confirmed explicitly per D-12's own requirement: `npm
install` in an isolated scratch sandbox (own `package.json`, own `node_modules`, never touching
peekover's `package.json`/`pnpm-lock.yaml` — deps confirmed STILL 6) added exactly 1 package, and the
installed package's own `package.json` lists zero runtime dependencies. **Byte cost: 1,811,325 B**
registry/installed unpacked size; the actually-shippable subset (model.json + weights + its two JS
bundles, excluding README/LICENSE/etc.) is **1,786,746 B** — both stated, honestly reconciled (fact D),
neither re-bundled through Peekover's own minification pipeline (out of scope for a measurement task).
Against 8.1's ~367 KiB (~375,808 B) package headroom: **exceeds it by ~4.8×** — a factual comparison, no
verdict rendered (fact H). **Accuracy: 11/23 = 47.8%** at a 0.5 confidence threshold (the package ships no
reject class; 0.5 is this measurement's own stated methodology choice, not a vendor default) — **11/16
non-code items correctly declined** (via low confidence, since the package always returns SOME guess),
**0/7 language items correctly identified** — the true-positive TypeScript items' own top confidences
ran 0.08–0.33, well under threshold, an honest finding that this model's calibration (trained on
full-size real source files) does not transfer cleanly to short, doc-embedded snippets (71–1,306 chars in
this corpus) — characterized, not verdicted. **Latency: model load 62.09ms** (one-time, corrected after a
self-validation catch — an initial 0.09ms reading was a measurement artifact: the package's documented
`minContentSize` floor, default 20 characters, silently returns `[]` below it, and the first diagnostic
warmup string was 18 characters; every real corpus item is 71+ characters, so the corpus accuracy numbers
above are unaffected, only the load-time instrument needed correcting) **+ per-fence warm inference:
median 8.65ms, mean 9.40ms, min 5.62ms, max 22.83ms**.
★ **MECHANISM (c) — DEFER.** 0 B / not-applicable (no detection attempted) / 0 ms, by construction, per
`plan.md:171` — stated, not measured.
★ **SELF-VALIDATION (fact I).** Both mechanisms (a) and (b) scored against the identical 23-item corpus
and identical ground-truth labels — no corpus drift between rows. The 0.09ms load-time anomaly was
caught, diagnosed (not accepted at face value), and traced to a real, reportable package behavior
(the `minContentSize` floor) rather than silently reported as "near-zero local-model load" — the
diagnostic re-run confirms every actual corpus item clears that floor, so the accuracy/latency numbers
above stand on verified ground, not an artifact.
★ **BUNDLE-VERIFY-GATE — BASELINE CONFIRMATION (8.3 is measurement-only, no production diff).** CS
**334,858 B**, app **475,579 B** (`app-BlMcDd3E.js`), both engines, byte- and chunk-hash-identical to
8.2's close. Manifests **654/770 B**, `permissions: []`. deps STILL **6** (the scratch sandbox's `npm
install` never touched peekover's own `package.json`/`pnpm-lock.yaml`, confirmed, then the entire scratch
sandbox directory was deleted).
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, unchanged). `pnpm test:browser`
**132 files green, 1389 passed, 15 skipped, 0 failed** (unchanged). `pnpm lint` EXIT=0. `git diff
tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 007 `diagramImportFence.test.ts` **8/8**. 009
`codeImportFence.test.ts` **9/9**. `diagramActions.browser.test.ts` CSS pin held. `perf-first-paint.ts
--size 50kb`, isolation-run (unaffected by this task, re-checked as a standing invariant). `git diff
--name-only HEAD` at the commit: exactly `specs/009-code-blocks/tasks.md` (8.3's box) · this file. No
`src/`/`scripts/`/`tests/` file in the diff — every scratch artifact (the heuristic file, the corpus/
ground-truth JSON, the local-model scratch npm sandbox) lived entirely under the session scratchpad
directory outside this repo, never staged, `git status` confirmed clean before staging.
★ **NUMBERS PRESERVED FOR 8.5 (M-3's mechanism decision):** heuristic — 1,856 B / 95.7% (22/23) /
3.149 µs. Local model (`@vscode/vscode-languagedetection`) — 1,811,325 B (1,786,746 B shippable-subset) /
47.8% (11/23) at a 0.5 confidence threshold / 62.09ms load + 8.65ms median warm per-fence. Defer — 0 B /
n/a / 0ms. Corpus n=23, bias sentence above. **Per D-12/8.5's own framing: if neither paid option fits
inside 8.1's headroom, defer is the floor** — heuristic's byte cost comfortably fits; local model's byte
cost does not (~4.8× over). No verdict rendered here.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 8.4 IS DONE — M-4, THEME CANDIDATES / COLLAPSE-THRESHOLD DISTRIBUTION / LINE-NUMBERS-WORD-WRAP
CANDIDATES, WALK-INFORMED. PRODUCED CANDIDATES, CHOSE NOTHING. NOW-POINTER ADVANCES TO 8.5 (HUMAN DECISION
GATE) NEXT.** tasks.md 8.4's own tag, cited verbatim: *"[D-9, D-10; §8 M-4; §9-2]"*. Files list, verbatim:
`docs/ai/progress.md` (numbers only) + the task report — no new `src/`/`scripts/`/`tests/` file, mirroring
8.1-8.3's own precedent.
★ **PLAN-MODE JUDGMENT: WARRANTED, stated with defense — and used.** Unlike 8.1/8.2 (pure extensions of an
existing ablation/harness pattern), 8.4 needed a genuinely new methodology (a color-contrast walk across 20
theme candidates × 3 page-modes) and surfaced two real repo-state ambiguities that had to be resolved before
any methodology could run. Plan mode entered; plan approved before implementation.
★ **DIVERGENCE 1 — "THE DEMO DOCUMENT" DOES NOT EXIST IN THIS REPO, RESOLVED DIRECTLY (fact J), RECORDED
PER STANDING RULE #1.** `docs/ai/spec-coverage.md` item 11: *"No demo document exists (see F11)... Visual QA
currently runs on test fixtures and 80+ Playwright screenshots instead."* Confirmed independently: a
repo-wide `find` for any "demo"-named file returns nothing, and neither `plan.md:370` nor `spec.md:220` (both
of which name "the demo document" as 8.4's input) point at an actual file. Resolved without routing — one
clearly-supported direction, not a genuine fork: substitute the golden fixtures (already co-named in 8.4's
own text) plus 8.3's real repo-wide corpus (the established "walk-informed" evidence source this milestone
already built, same bias sentence) as the best-available stand-in, matching this repo's own documented
practice for when the aspirational demo document is absent.
★ **DIVERGENCE 2 — "THE SAME CORPUS 8.3 USES," ROUTED VIA ASKUSERQUESTION (genuine two-way ambiguity).**
8.3's corpus was deliberately filtered to unlabeled fences only, for auto-detection accuracy — a filter
criterion orthogonal to collapse behavior, which fires on every code block regardless of language. Reading
"the SAME corpus" literally (the exact 23-item unlabeled-only set) imports a sampling bias never intended for
this question; reading it as "the same document set, unfiltered" better matches what collapse actually needs.
**User chose:** re-scan the same 64 `.md` files 8.3 scanned for **all** fenced blocks, report the literal
23-item subset as a supplementary cross-check, not primary.
★ **CORPUS RE-SCAN (n=103 total fences, 64 files) — ZERO DRIFT FROM 8.3's BANKED COUNT.** Same repo-wide
scan methodology 8.3 used (all `.md` files, excluding `node_modules`/`.git`/`.output`/`.wxt`): **64 files
scanned, 103 total fenced blocks, 23 unlabeled** — the unlabeled count matches 8.3's banked `n=23` exactly,
confirming no repo drift between sessions. Scratch script (`corpusScan.mjs`, deleted before commit — 8.2's
fact F precedent), ported `parseLineRanges`'s exact token grammar (`codeEnhancer.ts:145-188`) and `parse.ts`'s
exact info-string split (`parse.ts:81-96`, lang/meta divided on the first whitespace run) so "has line-
highlight meta" matches production semantics precisely, not an approximation.
★ **SUB-QUESTION 2 — COLLAPSE THRESHOLD DISTRIBUTION, over the 103-fence corpus (bias sentence: this
repository's own docs, biased toward directory trees, shell/JS snippets, and the house pseudocode convention
— not representative of an arbitrary agent-authored document a real user would open, per 8.3's own caveat).**
Line count: **min 1 / median 6 / p75 8 / p90 10 / max 34.** Byte size: **min 69 B / median 156 B / p75 180 B
/ p90 560 B / max 1,311 B.** Line-highlight meta present: **0 / 103 (0.0%)** — no fence anywhere in this repo
carries `{...}` meta, an honest limitation stated plainly: this corpus cannot inform whether threshold and
meta-presence correlate, because meta presence never occurs in it. **Against the current PROVISIONAL
`CODE_COLLAPSE_LINE_THRESHOLD = 40` (`codeView.ts:357`): 0 / 103 (0.0%) of this corpus's fences exceed it** —
characterized, not verdicted (fact H): every real fence in this repository sits comfortably under 40 lines,
so this corpus can confirm 40 does not clip anything IT contains, but says nothing about where the right cut
line falls for longer real-world code (the same representativeness caveat the bias sentence already carries).
**Supplementary — the literal 23-item unlabeled-only subset** (per Divergence 2, reported not-primary): line
count min 2 / median 7 / p75 11 / p90 12 / max 19; byte size min 71 B / median 478 B / p75 768 B / p90 923 B
/ max 1,311 B; meta 0/23.
★ **SUB-QUESTION 3 — LINE-NUMBERS / WORD-WRAP DEFAULT CANDIDATES, BOTH STATED LEGITIMATE EITHER WAY (008
§8-3's principle), NO PICK.** Max single-line length across the 103-fence corpus: **min 25 / median 40 / p75
83 / p90 102 / max 175 characters** — against the reader's own ~76ch column (`readerCss.ts:13`), roughly the
top 10% of fences in this corpus carry at least one line wider than the reading column, a factual input for
the word-wrap candidate, not a verdict on which default is correct. Line-numbers candidate inputs: the
corpus's own line-count distribution (above) — most fences are short (median 6 lines), so numbering's payoff
in THIS corpus's typical case is limited, though the bias sentence caveats this against real-world usage;
existing infra for both booleans is already built and gated behind `data-line-numbers`/`data-wrap`
(`readerCss.ts:673-685`, `codeView.ts`'s toolbar toggles) — no chrome grows unless a reader opts in, mirroring
D-10's own "grows no chrome where it costs nothing" framing. Both an ON-by-default (orientation in longer/
reference blocks; wrap avoids horizontal scroll for the ~10% of over-column lines) and an OFF-by-default
(visually clean, reader-first per AGENTS.md's brand non-negotiables; consistent with collapse's own
minimal-chrome-until-needed default) reading are stated as legitimate, per the task's own explicit framing —
**no constant set, no lean stated.**
★ **SUB-QUESTION 1 — THEME CANDIDATES, walked against `readerCss.ts`'s three token blocks.** ★ **THE
SEPIA `--code-bg` FINDING, STATED EXPLICITLY AS A CANDIDATE-SELECTION INPUT (the task's own ★ requirement),
NOT SILENTLY SUBSTITUTED:** `readerCss.ts`'s sepia block (`:50-52`, `:host([data-theme="sepia"])`) overrides
only `--paper`/`--ink`/`--accent`/`--accent-soft` — `--code-bg` is NOT redeclared there, so sepia inherits
`:host`'s LIGHT value, `#F1F1EB`, verbatim. **A second structural fact, traced this session (`codeEnhancer.ts:
213`, `if (tokens.bg) pre.style.backgroundColor = tokens.bg;`): the highlighted `<pre>`'s own background is
ENTIRELY theme-owned** — `--code-bg` governs only the inline-`code` span and the per-fence toolbar chrome
around the block (`readerCss.ts:160,164,191,665`), never the highlighted block itself. So the walk's real
question is how a candidate theme's own background sits beside `--code-bg`'s toolbar/inline-code chrome, not
whether the theme "matches the page" directly.
For all 20 `CODE_THEME_IDS` (`codeEngine.ts:134-155,157-160`): resolved each theme's real background via
`colors['editor.background']` (the project's own already-installed `shiki@4.4.3`; the raw top-level `bg`
field is `undefined` on every one of the 20 at this Shiki version — `editor.background` is the value
`codeToTokens` actually resolves `tokens.bg` from, confirmed by direct import), then computed a WCAG contrast
ratio against each of the 3 page-mode `--code-bg` values (light `#F1F1EB` / dark `#1C2030` / sepia — the
same `#F1F1EB` as light, per the finding above). Full 20-row table, no filtering, no pick:

| id | Shiki type | editor.background | vs light `--code-bg` | vs dark `--code-bg` | vs sepia `--code-bg` |
|---|---|---|---|---|---|
| min-dark | dark | #1f1f1f | 14.54 | 1.02 | 14.54 |
| red | dark | #390000 | 15.78 | 1.11 | 15.78 |
| min-light | light | #ffffff | 1.13 | 16.17 | 1.13 |
| solarized-dark | dark | #002B36 | 13.24 | 1.08 | 13.24 |
| monokai | dark | #272822 | 13.11 | 1.09 | 13.11 |
| horizon | dark | #1C1E26 | 14.66 | 1.03 | 14.66 |
| horizon-bright | light | #FDF0ED | 1.02 | 14.53 | 1.02 |
| andromeeda | dark | #23262E | 13.34 | 1.07 | 13.34 |
| dark-plus | dark | #1E1E1E | 14.70 | 1.03 | 14.70 |
| slack-dark | dark | #222222 | 14.03 | 1.02 | 14.03 |
| plastic | dark | #21252B | 13.58 | 1.05 | 13.58 |
| slack-ochin | light | #FFF | 1.13 | 16.17 | 1.13 |
| light-plus | light | #FFFFFF | 1.13 | 16.17 | 1.13 |
| laserwave | dark | #27212e | 13.79 | 1.03 | 13.79 |
| github-light | light | #fff | 1.13 | 16.17 | 1.13 |
| github-dark | dark | #24292e | 12.94 | 1.10 | 12.94 |
| vesper | dark | #101010 | 16.78 | 1.18 | 16.78 |
| aurora-x | dark | #07090F | 17.56 | 1.23 | 17.56 |
| vitesse-light | light | #ffffff | 1.13 | 16.17 | 1.13 |
| vitesse-black | dark | #000 | 18.52 | 1.30 | 18.52 |

**Observed structural pattern, characterized not verdicted (fact H):** every `dark`-typed theme reads as a
strongly-contrasted "framed box" against the light/sepia page (~13-18.5:1) and nearly blends with the dark
page's toolbar chrome (~1.0-1.3:1); every `light`-typed theme does the inverse (~1.0-1.1:1 against light/
sepia, ~14.5-16.2:1 against dark). Since `codeTheme` is ONE global default applying regardless of which page
mode is active (D-9), no single default theme reads as "blended" in all three page modes simultaneously — a
factual input for 8.5, not a rule this task invents. **`github-dark`, the current PROVISIONAL
`DEFAULT_SETTINGS.codeTheme` (`settings.ts:49`), sits mid-table on every axis** (12.94 / 1.10 / 12.94) — cited
as an existing candidate already in the codebase, not favored. Byte cost is explicitly NOT a candidate-
selection axis here: all 20 themes already ship in the package regardless of which is default (8.1's
component (c), 197,102 B, ablated as one block; each `THEME_LOADERS` entry is its own lazy chunk, a
package-total line item, not a runtime-load cost tied to the default choice).
★ **SELF-VALIDATION (fact I), both scripts.** Corpus scan: known ground truth from `tests/golden/fixtures/
code.md` (read directly this session — a 2-line labeled `js` fence at line 8, a 2-line unlabeled fence at
line 13) reproduced EXACTLY by the script (2 lines / 70 B / no meta; 2 lines / 71 B / no meta) — the
fence-boundary parser is correct on known input, not merely plausible on unknown input. The unlabeled count
(23) reproduced exactly against 8.3's independently-banked figure — a same-repo, same-methodology, zero-
residual cross-check. Theme script: `github-dark`'s resolved `editor.background` (`#24292e`) matches GitHub's
own well-known legacy dark editor background — a spot-check against an externally-verifiable fact, not an
internal-only consistency check. `contrastVsLight === contrastVsSepia` held for all 20 rows, exactly as the
sepia-inheritance finding structurally predicts (not a coincidence needing further investigation, fact K).
★ **BUNDLE-VERIFY-GATE — BASELINE CONFIRMATION (8.4 is measurement-only, no production diff).** CS
**334,858 B**, app **475,579 B** (`app-BlMcDd3E.js`), both engines, byte- and chunk-hash-identical to 8.3's
close. Manifests **654/770 B**, `permissions: []`. deps STILL **6** (both scratch scripts read the project's
own already-installed `shiki@4.4.3` and Node built-ins only — no `npm install`, no sandbox needed, unlike
8.3's local-model pricing).
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, unchanged). `pnpm test:browser`
**132 files green, 1389 passed, 15 skipped, 0 failed** (unchanged). `pnpm lint` EXIT=0. `git diff
tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 007 `diagramImportFence.test.ts` **8/8**. 009
`codeImportFence.test.ts` **9/9**. `diagramActions.browser.test.ts` CSS pin held. `perf-first-paint.ts
--size 50kb`, isolation-run (unaffected by this task, re-checked as a standing invariant). `git diff
--name-only HEAD` at the commit: exactly `specs/009-code-blocks/tasks.md` (8.4's box) · this file. No
`src/`/`scripts/`/`tests/` file in the diff — both scratch scripts (`corpusScan.mjs`, `themeContrast.mjs`)
lived entirely under the session scratchpad directory outside this repo, never staged, `git status` confirmed
clean before staging.
★ **NUMBERS PRESERVED FOR 8.5 (M-4's theme / threshold / boolean-default decisions):** theme candidates —
full 20-row contrast table above, `github-dark` (current provisional) at 12.94/1.10/12.94. Collapse
threshold — 103-fence corpus: line count max 34 (0/103 over the current 40-line threshold), byte size max
1,311 B, meta 0/103; supplementary 23-item literal subset: line count max 19, byte size max 1,311 B, meta
0/23. Line-numbers/word-wrap — max-line-length p90 102 chars (vs ~76ch column), line-count median 6.
No verdict rendered on any of the three sub-questions; no constant set.
★ **NO NEW § CARRIED ITEMS.**

★ **TASK 8.5 IS DONE — THE HUMAN DECISION GATE. ALL SEVEN M-1…M-4 VALUES RULED BY THE HUMAN AND RECORDED
IN `decisions.md` (2026-08-19 · M9 8.5). NOW-POINTER ADVANCES TO 8.6 NEXT.** tasks.md 8.5's own tag, cited
verbatim: *"[§8 M-1…M-4]"*. Files list, verbatim: `docs/ai/decisions.md` — documentation-only, no `src/`
change, unlike 8.6 which lands the constants.
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** Files list names only `docs/ai/decisions.md`
(no production file, so the "Files list names production files" plan-mode trigger does not fire); tasks.md
8.5's own paragraph directly enumerates all seven decisions and what each one needs (a value or a
pass/fail). The one real presentation-design question — how to fit a 20-theme candidate choice into
AskUserQuestion's 2-4-option constraint — was resolved directly per fact J (full 20-row table shown as
evidence text; the question offered "keep current provisional" vs. "specify a different one," the tool's
free-text escape hatch covering all 20 ids), not routed as a fork.
★ **STEP 0.4 — EVIDENCE-STILL-HOLDS SPOT-CHECK.** HEAD `b102f85`, `git status` clean, deps exactly **6**
(`node -e` count against `package.json`), `settings.ts:49` `codeTheme: 'github-dark'` and `codeView.ts:357`
`CODE_COLLAPSE_LINE_THRESHOLD = 40` both still match 8.4's banked figures exactly. No drift since 8.4's
close (only `docs/ai/progress.md` and `specs/009-code-blocks/tasks.md` changed at that commit) — no fact-K
signal. Full rebuild not run: unnecessary, since 8.5 lands no code and nothing under `src/`/`scripts/`
changed since 8.4.
★ **PRESENTATION SEQUENCE (Step 0.6): M-1, M-2 first (structural pass/fail — a "give way"/subset-build
answer could have changed what M-4's theme/language candidates had available), then M-3 (independent), then
M-4's four parts in 8.4's own sub-question order** (theme → threshold → line-numbers/word-wrap as a pair,
per fact L presented as two separate questions since each is independently legitimate either way, even
though 8.4 measured them together).
★ **SEVEN DECISIONS, EACH ROUTED VIA `AskUserQuestion` PER FACT M (question / evidence bundle /
consequences / no CC recommendation), ANSWERED, AND RECORDED PER FACT N — full text in `decisions.md`
2026-08-19 · M9 8.5, not duplicated here:**
- **M-1 — full set ships, no subset build.** Evidence: 8.1's `.output`/zip headroom (~367 KiB / ~612 KiB),
  neither bound binds. **Human: full set.**
- **M-2 — gate holds, nothing gives way.** Evidence: 8.2's median 90.8-96.3ms/floor 86.2-88.1ms vs.
  `GATE_MS=165`, pre-Shiki delta flat within noise. **Human: gate holds as measured.**
- **M-3 — heuristic.** Evidence: 8.3's nine numbers; heuristic (1,856 B/95.7%/3.149µs) fits headroom, local
  model (1,811,325 B/47.8%/62.09ms+8.65ms) exceeds headroom ~4.8× and would breach the 5 MiB bound outright,
  defer (0 B/n/a/0ms) not forced since heuristic fits. **Human: heuristic.**
- **M-4a — `github-dark` (kept).** Evidence: 8.4's 20-row WCAG contrast table, `github-dark` mid-table on
  every axis (12.94/1.10/12.94), sepia-inheritance and theme-owned-`<pre>`-background findings stated as
  candidate-selection inputs. **Human: keep github-dark.**
- **M-4b — `40` (kept).** Evidence: 8.4's 103-fence corpus, line count max 34, 0/103 fences exceed 40.
  **Human: keep 40.**
- **M-4c — line-numbers OFF by default (kept).** Evidence: 8.4's corpus line-count median 6, existing
  per-block opt-in infra unaffected by default. **Human: OFF.**
- **M-4d — word-wrap OFF by default (kept).** Evidence: 8.4's corpus max-line-length p90 102 chars vs.
  ~76ch column, existing per-block opt-in infra unaffected by default. **Human: OFF.**
★ **NO CLARIFYING-QUESTION INTERACTIONS (fact O not exercised) — every answer was a direct selection from
the presented options, no follow-up numeric/evidence request from the human.**
★ **ALL SEVEN VALUES MATCH WHAT WAS ALREADY PROVISIONALLY SHIPPED — 8.6 IS A CONFIRM-AND-DE-PROVISIONALIZE
TASK, NOT A VALUE CHANGE.** `settings.ts:49`'s `codeTheme: 'github-dark'` and `codeView.ts:357`'s
`CODE_COLLAPSE_LINE_THRESHOLD = 40` already carry the chosen values; the two boolean toolbar defaults
(`codeView.ts:264,281`, both `aria-pressed="false"`) already match OFF. This is a legitimate outcome, not a
non-event — 8.6 still has real work: strip the PROVISIONAL doc-comments (008's own rule that a PROPOSED
comment left on a chosen value is a lie about the decision state) and, if M-3's heuristic mechanism needs
its own module (`codeDetect.ts`, per tasks.md 8.6's text), build that as its own reviewable unit.
★ **BUNDLE-VERIFY-GATE — BASELINE CONFIRMATION (8.5 is documentation-only, no production diff).** CS
**334,858 B**, app **475,579 B** (`app-BlMcDd3E.js`), both engines, byte- and chunk-hash-identical to 8.4's
close. Manifests **654/770 B**, `permissions: []`. deps STILL **6**.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1028/1028** (60 files, unchanged — 8.5 touches no test
file). `pnpm test:browser` **132 files green, 1389 passed, 15 skipped, 0 failed** (unchanged). `pnpm lint`
EXIT=0. `git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green. 007
`diagramImportFence.test.ts` **8/8**. 009 `codeImportFence.test.ts` **9/9**.
`diagramActions.browser.test.ts` CSS pin held. `perf-first-paint.ts --size 50kb`, isolation-run (unaffected
by this task, re-checked as a standing invariant). `git diff --name-only HEAD` at the commit: exactly
`docs/ai/decisions.md` · `specs/009-code-blocks/tasks.md` (8.5's box) · this file. No `src/`/`scripts/`/
`tests/` file in the diff.
★ **NO NEW § CARRIED ITEMS. PRESENTATION-DISCIPLINE FACTS L/M/N/O — FIRST APPLICATION, HELD CLEANLY:** fact
L (separate presentation per decision, no unwarranted batching) kept each M-value's evidence bundle
distinct even when two AskUserQuestion calls carried multiple questions; fact M (no CC recommendation) held
without a near-miss — the one place recommendation-pressure existed (M-3's mechanism, where local model was
factually disqualified by a hard bound) was resolved by stating the disqualification as evidence/consequence,
not as "CC would pick heuristic"; fact N (verbatim + evidence bundle recorded) is satisfied by `decisions.md`
2026-08-19 · M9 8.5's full entry; fact O (clarifying-question handling) was not exercised this task — no
open finding on it either way. **One genuine kickoff underspecification, worth banking:** AskUserQuestion's
hard 2-4-option-per-question schema constraint is not addressed anywhere in the presentation-discipline
facts (L/M/N/O assume free framing); a decision with double-digit candidates (M-4a's 20 themes) needs a
resolvable-directly-per-fact-J narrowing strategy stated up front (full table as evidence text + a
binary "keep provisional / specify other" question, relying on the tool's own free-text escape hatch for
the actual value) — worth adding as a permanent methodology fact for the next decision-gate task with a
large candidate set.

★ **TASK 8.6 IS DONE — THE FOUR M-4 VALUES DE-PROVISIONALIZED, M-3's HEURISTIC MECHANISM BUILT AS ITS OWN
STANDALONE, REVIEWABLE, UNREACHABLE MODULE. NOW-POINTER ADVANCES TO 9.1 (MILESTONE-CLOSE HUMAN GATE)
NEXT.** tasks.md 8.6's own tag, cited verbatim: *"[§8 M-1…M-4]"*. Files list, verbatim: `src/settings/
settings.ts` · `src/render/codeView.ts` · (conditionally) `src/render/codeDetect.ts` + tests.
★ **STEP 0 — "## 8" SECTION UNCHANGED SINCE 8.5's SNAPSHOT**, confirmed by direct re-read. HEAD `94fde3f`,
`git status` clean, 53 commits ahead of `origin/main`, confirmed. `settings.ts:49` `codeTheme:
'github-dark'` and `codeView.ts:357` `CODE_COLLAPSE_LINE_THRESHOLD = 40` still match `decisions.md`
2026-08-19 · M9 8.5 exactly — no drift, no fact-K signal.
★ **ASKUSERQUESTION ROUTING: INVOKED, per the kickoff's own named example.** tasks.md 8.6's Files list
names neither `codeEngine.ts` nor `codeEnhancer.ts`, and its Verify line separately requires "the
enhancer's orchestration, the tokenize call, and the toolbar wiring are byte-identical — the diff confined
to the constants block" alongside "a real-engine degradation test" for the heuristic — two clauses that
pull toward different scopes (wire live now, vs. build standalone and defer wiring). The kickoff itself
names "heuristic wiring is a separate later task" as a worked example of a RESOLUTION-LEVEL divergence
requiring AskUserQuestion, not silent resolution. Routed with both readings stated, no recommendation.
**Human chose: standalone, unreachable module** — `codeDetect.ts` built and tested (unit + real-engine)
but not imported by `codeEngine.ts`/`codeEnhancer.ts`; wiring an unlabeled fence's guess into the live
highlight path is a future task. §4's auto-detection EARS criteria stay unmet by a live document until
that task lands — stated explicitly, not silently gapped.
★ **PLAN-MODE JUDGMENT: NOT WARRANTED, stated with defense.** The de-provisionalize half is a pure
extension of already-shipped values (no design surface). The build-new-module half, once AskUserQuestion
settled it to "standalone, unreachable" (mirroring `codeEngine.ts`'s own task-1.2 precedent exactly — same
byte-cost-via-scratch-reference-ablation shape), is a close port of 8.3's banked methodology (structural
non-code detectors checked before language signatures, required score-margin) to this codebase's
conventions — no module-boundary or integration-seam design left open once the routing question above
resolved it. No plan-mode entered.
★ **DE-PROVISIONALIZE, FOUR VALUES, CITED TO `decisions.md` 2026-08-19 · M9 8.5:**
- **M-4a — `settings.ts:45-50`.** `DEFAULT_SETTINGS.codeTheme = 'github-dark'`, value unchanged. Doc
  comment rewritten: "PROVISIONAL placeholder... not a design opinion" → "M-4a's CHOSEN default
  (`decisions.md` 2026-08-19 · M9 8.5: sits mid-table on WCAG contrast...), not a placeholder."
- **M-4b — `codeView.ts:347-357`.** `CODE_COLLAPSE_LINE_THRESHOLD = 40`, value unchanged. Doc comment
  rewritten: "PROVISIONAL, and deliberately NOT an asserted acceptance threshold..." → "`40` — M-4b's
  CHOSEN value (`decisions.md` 2026-08-19 · M9 8.5: ...), not a placeholder."
- **M-4c/M-4d — `codeView.ts`'s toolbar toggles.** Neither boolean default carried an explicit PROVISIONAL
  comment to strip (8.5's ledger flagged this: "pending 8.6's PROVISIONAL-comment cleanup and (if needed)
  an explicit named default constant") — the two `aria-pressed="false"` literals were bare, uncited. Added
  two new named, doc-commented, exported constants (`CODE_LINE_NUMBERS_DEFAULT = false`,
  `CODE_WRAP_DEFAULT = false`, each citing `decisions.md` 2026-08-19 · M9 8.5) and referenced them at the
  two call sites (`String(CODE_LINE_NUMBERS_DEFAULT)` / `String(CODE_WRAP_DEFAULT)`, runtime-equivalent to
  the literal `'false'` they replace). Real code diff, zero functional change — the shipped default stays
  OFF/OFF, now honestly named rather than a bare literal.
★ **`codeDetect.ts` BUILT — THE HEURISTIC (D-12/M-3), PORTED FROM 8.3's SCRATCH REFERENCE.** Structural
non-code detectors (bare file list; directory-tree box-drawing characters; arrow/ellipsis pseudocode
glyphs; this repo's own "# annotated pseudocode" convention — 2+ `word # comment` trailing annotations)
checked BEFORE any language signature, each an outright decline. Past that gate, per-language signatures
(typescript/javascript/python/json/css/html/bash) score over the fence's first 10 lines; the top scorer
must clear a required margin (2 points) over the runner-up or the fence declines — a mixed-signal fence is
never guessed. One deliberate exclusion, load-bearing: a generic type parameter (`Promise<Settings>`) is
excluded from the HTML signature (the `<` sits directly against an identifier, which a real opening tag's
never does) — without it, `interface`-heavy TypeScript carrying `Promise<X>`/`Partial<X>` return types
ties against its own HTML miscount and declines incorrectly.
★ **ACCURACY REPRODUCTION — 8.3's CORPUS RE-SCANNED LIVE (n=23, ZERO DRIFT), GROUND TRUTH INDEPENDENTLY
RE-ASSIGNED, DIVERGENCE INVESTIGATED (fact K) AND CHARACTERIZED (fact H), NOT FORCED TO MATCH (fact D).**
8.3's own scratch corpus/ground-truth files were deleted before commit (the standing scratch-file-then-
delete convention) — only the aggregate 7/16 code/non-code split and ONE named false positive
(`specs/008-persona-1-qol/plan.md:220`'s placeholder angle brackets tripping the HTML signature) survived
to the ledger; no per-item labels did. This task's own re-scan (same methodology: all `.md` files,
excluding `node_modules`/`.git`/`.output`/`.wxt`, fences with an empty info string) reproduces **n=23 with
zero drift** — matching 8.3 (HEAD `8b62a2c`) and 8.4's own independent re-scan (HEAD `b102f85`) exactly.
Ground truth was then RE-ASSIGNED independently, by inspection, against 8.3's own stated criteria (genuine
TypeScript interface/type declarations vs. this repo's pseudocode/tree/list/prose conventions) — the
re-assignment converged on the SAME 7/16 split 8.3 banked, without consulting any deleted per-item record
(`codeDetect.test.ts`'s own corpus-accuracy suite pins the resulting table). Measured against this
re-assignment: **23/23 = 100%** — HIGHER than 8.3's banked 95.7% (22/23). Investigated (fact K): the
divergence is NOT a methodology regression. The production heuristic's "# annotated pseudocode" structural
detector (a repeated `word # comment` convention, added during this task's own tuning against the live
corpus) declines `plan.md:220`'s exact fence BEFORE its HTML signature is ever scored — 8.3's scratch
reference apparently lacked an equivalent structural check for that specific pseudocode shape, so the
placeholder-angle-bracket false positive survived their run but does not survive this one. Characterized,
not verdicted (fact H): this is a genuine improvement on THIS corpus, not proof the heuristic generalizes
better — the added detector is deliberately aggressive (2+ `#`-annotated lines declines outright), which
could just as easily suppress a genuinely `#`-commented Python/bash fence this corpus happens not to
contain (the standing bias-sentence caveat, restated for this specific detector). `decisions.md`'s own
revisit-when (c) already names the false positive "a known, accepted limitation, not a bug to chase" — its
disappearance here doesn't reopen M-3, it is simply reported.
★ **BYTE COST — SCRATCH-REFERENCE ABLATION, TASK 1.2's OWN PRECEDENT EXACTLY (`codeDetect.ts` is
UNREACHABLE from any entrypoint, same as `codeEngine.ts` was at 1.2).** `cp appShell.ts` aside FIRST; added
a throwaway `import { detectLanguage as __scratchDetectLanguage } from '../render/codeDetect'` plus one
call site (`console.log(__scratchDetectLanguage('scratch'))` — codeDetect.ts, unlike codeEngine.ts at 1.2,
has no top-level side-effecting statement of its own, so a bare unused import would tree-shake to nothing;
the call site is this task's own adaptation, not a copy of 1.2's exact bare-import shape); built both
engines; app chunk moved **475,579 B → 477,536 B, delta +1,957 B**, CS **UNCHANGED at 334,858 B** on BOTH
engines (structural proof `codeDetect.ts` never reaches the content-script graph even when imported from
an app-page-only call site); removed the scratch reference; rebuilt; `appShell.ts` confirmed **md5-
identical** to the pre-task copy (`33eeae943d42654cfc8ca8c7611cb916`, both before and after). **Reconciled
to 8.3's scratch measurement (fact D, not forced to match):** 1,957 B production (via this ablation,
including the scratch call site's own small overhead) vs. 1,856 B standalone esbuild-bundled-minified
(8.3) — **+101 B / +5.4%**, well inside a reasonable band for Vite/Rollup's own minifier vs. esbuild
standalone plus the scratch harness's own call-site bytes; not investigated further (fact D's line — small,
explicable, cross-pipeline deltas are reported, not chased).
★ **BUNDLE-VERIFY-GATE — FRESH BUILD, BOTH ENGINES, `codeDetect.ts` GENUINELY UNREACHABLE IN THE FINAL
TREE (tree-shaken to zero, confirmed by measurement not assumption).** CS **334,858 B**, app **475,579 B**
(`app-BlMcDd3E.js`), manifests **654/770 B**, `.output` **4,866,741 / 4,866,857 B** — ALL byte- and
chunk-hash-identical to 8.5's close baseline, both engines. Zip **1,470,730 / 1,470,788 B** (Cr/Fx) —
byte-identical to 8.1's banked baseline. `permissions: []` both. deps STILL **6**. The de-provisionalize
edits (two doc-comment rewrites, two new named constants referenced via `String(...)`) cost **zero bytes**
— the minifier constant-folds them identically to the literals they replace.
★ **FULL SUITE, BOTH RUNS CLEAN.** `pnpm test` **1042/1042** (61 files — 1028 baseline + 14 new
`codeDetect.test.ts` tests: 6 structural-detector cases, 3 signature-positive cases, 2 margin-gate cases,
1 corpus-size pin, 1 corpus-split pin, 1 full corpus-accuracy pin). One `diagramEnhancer.test.ts` timeout
on first run (the SAME standing flake named at 8.3/8.5's own sessions — unrelated to this task's files,
confirmed clean on an isolated re-run, 58/58). `pnpm test:browser` **134 files green, 1395 passed, 15
skipped, 0 failed** (132/1389/15 baseline + 2 files / 6 tests: `codeDetect.browser.test.ts` on Cr+Fx, 3
tests each — the real-engine degradation proof: an ambiguous fence declines, the corpus's own mixed-signal
shape declines, an unambiguous fence still gets a real guess as the positive control). `pnpm lint`
EXIT=0. `git diff tests/golden/output/` EMPTY. `tests/manifest.test.ts` green (8/8). 007
`diagramImportFence.test.ts` **8/8**. 009 `codeImportFence.test.ts` **9/9** (`codeDetect.ts` imports no
`shiki` specifier, confirmed structurally — the fence never had reason to move). `diagramActions.browser
.test.ts` CSS pin held (54/54). `perf-first-paint.ts --size 50kb`, isolation-run: **149.4ms median
(145.5-154.6ms range) vs <165ms — PASS** (content-script untouched by this task, re-confirmed as a standing
invariant rather than assumed). `git diff --name-only HEAD` at the commit: exactly `src/render/codeView.ts`
· `src/settings/settings.ts` · `specs/009-code-blocks/tasks.md` (8.6's box) · this file, plus the three new
files (`src/render/codeDetect.ts`, `src/render/codeDetect.test.ts`, `tests/browser/codeDetect.browser
.test.ts`). No scratch artifact in the diff — `appShell.ts`'s scratch edit was reverted and md5-confirmed
before staging.
★ **NO NEW § CARRIED ITEMS.** One permanent methodology fact surfaced, worth banking for a future task that
re-derives a heuristic/corpus from a prior task's deleted scratch reference: **aggregate corpus statistics
(n, the code/non-code split, one or two NAMED examples) survive to the ledger; per-item ground-truth labels
do not, unless a future task explicitly banks the full table.** A re-assignment that independently converges
on the same aggregate split is strong (not certain) evidence of a stable, well-specified corpus — but an
exact per-item reproduction cannot be verified, and a resulting accuracy delta (here, better) must be
investigated and characterized, never silently accepted as the new number nor forced to match the old one.
★ **TASK 9.1 IS DONE — THE MILESTONE-CLOSE HUMAN GATE, WALKED AND PASSED (ONE CARRIED FINDING). NOW-POINTER
ADVANCES TO 9.2 (M9 RETRO) NEXT.** Walked on real Chromium AND real Firefox with the extension loaded, both
engines, app-page AND `file://` content-script surfaces both exercised, both `GEOMETRY_WIDTHS` (1280 AND
1400) on both engines, all 20 code themes cycled across all 3 document modes (light/dark/sepia). Network and
Console tabs open throughout, both CLEAN across every item. Nine items walked: **8 PASS, 1 PASS+FINDING.**
The one finding — Item 1 (toolbar-reads-as-part-of-block-or-clutter, 008's identical question,
transplanted): walker's verdict, verbatim, *"The toolbar looks good, styled. Only thing is the space between
the code box and the toolbar is a bit too much."* CARRIED, not fixed — `decisions.md` **2026-08-22 · M9
9.1**, ship as-is, revisit when `readerCss.ts`'s `.peekover-code-toolbar` rule or the wrapper's
margin/padding is next touched (by M11 close at the latest). D-1's harness output (the sanity read, Ruling
4's standing-baseline candidate): subjective feel matches 8.2's banked 90.8–96.3 ms median first-paint
figure. No production diff — 9.1's own doc-only-by-construction discipline (tasks.md 9.1 names no Files:
line) held: `decisions.md` + `tasks.md` (box + landing block) + this file, nothing else. Bundle bytes
byte-identical to 8.6's close (CS **334,858 B**, app **475,579 B**, `.output` **4,866,741 / 4,866,857 B**,
zip **1,470,730 / 1,470,788 B**, deps **6**, `permissions: []` both) — no re-build needed, nothing changed.
Standing rule #2 (AGENTS.md) discharged for M9: this walk is the only Firefox evidence M9 will ever have —
Playwright cannot load an extension into Firefox. **9.2 (the retro) is NOT written here** — deliberately, in
a fresh session after the gate.

★ **TASK 9.2 IS DONE — THE M9 RETRO LANDED IN `docs/ai/retro.md` (newest-first, 2026-08-22 · M9 close), RUN
AS THE `/retro` INTERVIEW RITUAL tasks.md 9.2's own line names, NOT a solo synthesis write-up.** A kickoff
drafted for this session proposed exactly the wrong shape — a fully autonomous milestone-wide synthesis —
where tasks.md 9.2 says *"Run `/retro`"*; caught at Step 0 per AGENTS.md's kickoff-is-a-hypothesis rule,
and the mismatch is itself the retro entry's headline finding (finding 1), since M8's own retro (2026-08-13)
had already named this exact failure shape once. Seven substantive findings banked with provenance: the
recurring kickoff scope-hypothesis miss and its recursion at 9.2 itself (1), a missing PROVISIONAL-constant
resolution rule (2), a missing bidirectional necessary-ripple rule (3), the byte-budget headroom running
tighter than modeled all milestone (4), two ceremony-waste items — pattern-mirroring ablations and
full-suite Verify on empty-diff tasks (5) — bounded by the [hidden]/cascade recurrence at 5.2 that proves
the full-suite gate is load-bearing (6), and Ruling 4's standing-baseline claim assessed as HOLDS with one
honest gap named (two numeric readings, one subjective confirmation, not three numeric ones) (7). Five
AGENTS.md/WORKFLOW.md lines drafted for the human's own review/edit/commit per constant C2 — none adopted
by this session. Carried item (9.1's toolbar/block spacing) referenced, not touched. No production diff —
9.2's doc-only synthesis discipline held: `docs/ai/retro.md` + `docs/ai/progress.md`, nothing else. Standing
invariants unchanged from 9.1's close (HEAD unchanged pre-commit, deps 6, `permissions: []` both, bundle
bytes byte-identical). NOW-POINTER ADVANCES TO 9.3 (the records reconcile that closes M9) NEXT.

★ **TASK 9.3 IS DONE — THE RECORDS RECONCILE, AND M9 IS CLOSED.** tasks.md 9.3's own line, verbatim:
*"The records reconcile that closes M9 — including Ruling 3's revisit-when and the NEXT carried trigger
for D-1's harness. `spec-coverage.md`'s F3 row moves from 0% to its landed figure. `decisions.md`'s
revisit-when (c) … is CONFIRMED as the harness's own carried trigger … Ruling 3's engine revisit-when …
is restated as standing, not re-litigated."* No drift from the version banked at 9.2's close. Doc-only:
`docs/ai/progress.md` · `docs/ai/spec-coverage.md`; **`docs/ai/decisions.md` is READ AND LEFT
UNTOUCHED** — Ruling 3 and the D-1 harness trigger are both already fully banked (M9 GATE 2, 2026-08-15)
and this task RESTATES/CONFIRMS them, per the line's own wording, not a genuine new decision.
★ **SPEC-COVERAGE.MD's F3 ROW — 0% → 78%, RE-DERIVED FROM SHIPPED CODE, NOT ASSERTED FROM THE BOX
LIST.** Following the document's own convention (F2/F5/F6's targeted re-audits): six of F3's nine items
✗→✓ (themes, copy, line numbers, line highlighting, word wrap, collapse), two ✗→~ (Shiki ships but the
language catalog is a hand-curated 6, not 190+ — `codeEngine.ts`'s own `LANGUAGE_LOADERS`, explicitly
`PROVISIONAL`; the per-block control is an expand/collapse of already-highlighted content, not a
raw⇄rendered toggle mirroring `readerMode.ts`'s document-level Raw view), one stays ✗ (auto-detection —
`codeDetect.ts` is built and real-engine-tested but deliberately unwired to any live document, 8.6's own
AskUserQuestion resolution). Credit 0.0 → 7.0/9. Cascades: §5 total 46.0→53.0/198 (23%→27%), whole spec
64.0→71.0/227 (28%→31%) — the method's own tie-break (*"ambiguity resolves toward NOT"*) applied, not an
inflated ✓; full row-by-row evidence in `spec-coverage.md` F3.
★ **RULING 3's REVISIT-WHEN — RESTATED AS STANDING, PER TASKS.MD 9.3's OWN WORDING ("restated…not
re-litigated").** `decisions.md` 2026-08-15 · M9 GATE 2: *"grammar/perf inadequacy discovered at
measurement or walk"* is the trigger to reconsider the `shiki/engine/javascript` choice over
Oniguruma/WASM — not before, not never. **Did not fire this milestone**: M-1 (8.1) and M-2 (8.2) both
measured clean against their bounds/gate, and 9.1's walk found no grammar-fidelity or perf complaint on
any of the 20 real code fences it cycled. Stands unchanged for whichever milestone next touches
`codeEngine.ts`'s engine choice.
★ **THE D-1 HARNESS's NEXT CARRIED TRIGGER — `DECISIONS.MD`'S REVISIT-WHEN (c) CONFIRMED, THE D-11
(iii) SHAPE APPLIED FORWARD: A MEASUREMENT AND A CONDITION, NOT A MEMORY.** **The measurement**: Ruling
4's standing-baseline claim is BANKED as of this commit — two independent numeric A-B-A readings within
M9 (2.2 pre-Shiki: 89.2/89.3 ms median, 84.8/86.8 ms floor; 8.2 post-Shiki, HEAD `a44e17f`: 90.8-96.3 ms
median, 86.2-88.1 ms floor — delta flat, inside the same noise band both readings independently carry)
plus 9.1's subjective walk-time confirmation (feel matches the banked figure). **The honest gap, named
not smoothed** (9.2 retro finding 7): the 9.1 confirmation is qualitative, not a third numeric run — the
claim HOLDS on two numeric readings + one subjective one, not three numeric ones; a future milestone that
touches this surface anyway should take a third numeric run rather than assume the gap is closed.
**The condition**: `decisions.md` 2026-08-15 · M9 GATE 2's own revisit-when (c) — *"a future milestone
needs D-1's harness for a different measurement than M-2 and finds its capability-free design too
narrow"* — is CONFIRMED as the harness's carried trigger, standing unchanged, not fired this milestone
(009 needed no measurement beyond M-2).
★ **THE D-VALUE AUDIT — EVERY M9 `decisions.md` ENTRY CHECKED AGAINST PLAN §0's OWN CONVENTION** (*"every
decision below gets a `decisions.md` entry, named here, landing with the commit that implements it —
never after"*, `plan.md` §0, verbatim text pre-written per D-value, D-1 through D-13). **NONE OF THE
THIRTEEN EVER LANDED AS AN INDIVIDUAL ENTRY — A LARGER GAP THAN M8's OWN D-6…D-12 ONE, NAMED HERE FOR THE
FIRST TIME.** Searched `decisions.md` for every pre-written entry-text fragment (`"drives the real built
extension"`, `"lazy-chunk fence for Shiki"`, `"ships two regex engines"`, `"never produces markup to
sanitize"`, `"two-call-site shape unchanged"`, `"plain fence stays in the tree"`, `"one enhancer because
they are one feature"`, `"full info string never reaches"`, `"fourth field on the one global"`, `"same
kind of state readerMode"`, `"measured as four accounted"`, `"mechanism is priced on byte cost"`,
`"sixth production dependency clears"`) — **zero hits, all thirteen.** The only place any of D-1…D-13
appears is the pre-implementation **2026-08-15 M9 GATE 2** entry (one shared clause plus Rulings 1-4),
which predates every implementing commit by weeks and cannot by construction be "landing with the commit
that implements it." **Not backfilled here** — `decisions.md` is read and left untouched per this task's
own Files-list condition (only if a genuine decision landed), and no new decision is landing; gate 2
already decided all thirteen. **One drafting-error side-note, not a records defect**: `plan.md` §0 labels
BOTH D-6 and D-7's `decisions.md` entry text `"009 D-6"` (`plan.md:91,102`) — a plan-authoring typo, not
this task's to fix (plan.md is sealed at gate 2, no D-value re-opened); named so whoever eventually lands
D-7's entry knows to write `"009 D-7"`, not copy the plan's own label literally.
★ **`docs/trust/PERMISSIONS.md` — CONFIRMED, NOT ASSUMED: task 5.1 IS THE ONLY M9 CHANGE.** `git log
--oneline -- docs/trust/PERMISSIONS.md`: `4d15306` (5.1, the `codeTheme` field disclosure) is the most
recent commit touching the file; nothing since. No new row, one field name added to the existing
settings-row disclosure, exactly as 5.1's own Verify line required.
★ **§ BASELINES — NOT RE-RUN AT 9.3, STATED PLAINLY WHY (per 9.3's own Verify line).** No fresh
`.output` rebuild: 8.6 is the last commit touching `src/`, its own bundle-verify-gate already confirmed
every artifact figure fresh (a clean measurement, not carried), and 9.1/9.2 are both doc-only and
confirmed byte-identical at each one's own close — a rebuild here would re-measure bytes no commit has
had the chance to move, exactly the "just to be sure" full-suite re-run this task's own scope declines.
The already-measured 8.6-close figures are transcribed into the pins table below (not re-derived): CS
**334,858 B**, app chunk **475,579 B** (`app-BlMcDd3E.js`, both engines same hash), `.output` **4,866,741
/ 4,866,857 B** (Cr/Fx), zip **1,470,730 / 1,470,788 B**, manifests **654/770 B**, `permissions: []` both,
`web_accessible_resources` absent, deps **6**. Suites at 8.6 close: unit **1042/1042** (61 files),
browser **134 files, 1395 passed, 15 skipped, 0 failed**. See § Baselines table below for the row-level
update, including the post-Shiki app-page first-paint row this task banks per Ruling 4.
★ **POINTER WALK, DONE AS A DISCRETE STEP, PER 9.1's OWN CONVENTION.** § Now, § Blockers and § Up next
grepped for `is next`, `at the gate`, `waiting on`, `this commit`, `← NEXT`. **One stale pointer found and
fixed**: the Roadmap line (§ Up next) still ended at 008, not listing 009/M9 as closed — corrected below.
**Two Blockers items tagged "HOME: M9's own retro (task 9.2)"** (the `codeEngine.ts`/`hasCodeFence` O(N²)
coupling pattern; the bundle-affecting-tasks-need-a-build-gate discipline) — both reached their stated
home: 9.2's retro (`docs/ai/retro.md` 2026-08-22) banked findings 2/3 (a PROVISIONAL-constant rule, a
bidirectional necessary-ripple rule) and findings 5/6 (the ceremony-waste items, bounded by the
[hidden]/cascade recurrence proving the full-suite gate load-bearing) — the pointers were accurate (their
home was reached), so left as historical record, not rewritten; nothing stale about a correct pointer to
a destination now arrived at.
★ **NO ARCHIVE PASS — A DIVERGENCE FROM THE KICKOFF'S OWN SKETCH, NAMED PER STANDING RULE #1.** The
kickoff sketch assumed 9.3 moves M9's § Now content to `progress-archive.md`. **tasks.md 9.3's own line
names no such step**, and the real precedent contradicts it: **§ Closed milestones' own M7 and M8 entries
both still read "until the next archive pass moves them to `progress-archive.md`, the way M6's were"** —
M7 closed 2026-08-02, M8 closed 2026-08-13, and neither has been archived as of this commit. Only M6 (and
M1-M5) have ever been archived, in a dedicated pass distinct from any milestone's own close task. **9.3
follows the real, repeated precedent — no content moves to `progress-archive.md`; M9's narrative stays in
§ Now**, per the file's own note (line 3, § Closed milestones entries below) until a future archive pass
covers M7/M8/M9 together.
★ **M9 IS CLOSED.** 24 tasks across nine groups, thirteen D-values (D-1…D-13) settled at gate 2, all
seven §8 M-1…M-4 measure-then-choose values ruled at 8.5, one milestone-close finding CARRIED (not a
defect — 9.1's subjective toolbar-spacing preference, `decisions.md` 2026-08-22 · M9 9.1). **Running
human-gate score: 12/12, UNMOVED** — M9's one 9.1 finding is explicitly not a defect (no correctness or
a11y regression, no Verify-contract break), the same "zero defects found" class as M8's own clean gate,
not a thirteenth. `spec-coverage.md` F3: 0% → 78%. Golden **EMPTY**; **007 import fence 8/8**; **009
import fence 9/9**; `permissions: []` both engines; manifest test **2975 B** (test file, unmoved from
9.1); deps **6**. See § Closed milestones for the close record. **NEXT: nothing within M9** — the next
act is the next milestone's scoping, per AGENTS.md's own "between milestones" pointer and the Roadmap
below.

---

## M8 · spec 008 — Persona-#1 QoL: compare two files · agent-file awareness · table tools · CLOSED 2026-08-13

### The task-by-task narrative, verbatim as it stood in `progress.md` § Now at close

**★ M8's SPEC HAS PASSED GATE 1 — `specs/008-persona-1-qol/spec.md`, approved 2026-08-03 WITH ONE REDLINE.
`plan.md` IS THE NEXT ARTIFACT AND THE NEXT GATE, in a fresh session (C14).** The approval is banked in
`decisions.md` (2026-08-03, M8 GATE 1) and **the spec's status line stays "draft" by the M7 precedent** — the
bank is the approval of record, not the artifact header. **What gate 1 settled:** the three items fit ONE
milestone (§9-1, no split) · §3.5's presentation-only narrowing of "tuned rendering defaults" HOLDS (§9-2) ·
`.cursorrules` is OUT (§9-3) · §3.7 HOLDS — table tools on BOTH surfaces, with §8-1 as the escape hatch
(§9-4) · compare is current-vs-picked (§9-5) · the product-spec <150/<165 ms inconsistency is **DISCHARGED,
not routed onward** — it was already closed at `e09520f` (2026-07-27, 007's gate-1 commit, both lines now
`< 165 ms` with dated notes); the spec's premise was stale (§9-6, corrected 2026-08-03 by the second gate-1
redline — `docs/product/spec.md` is NOT edited, it is already correct). **The one redline: the binding
first-paint headroom is OWED, not
1.8 ms** — 8.1's figure describes a render path `662b90e` superseded (this file's own § Baselines marks those
rows "NOT re-run at 9.3" and calls the re-measurement owed), so **`plan.md` re-establishes the headroom on the
current path FIRST and prices §3.7 against that number**; and the app-chunk baseline the spec cites is
**389,143 B**, not 387,837 B. Both are applied to the spec.
★ **THE REDLINE RAN, AND THE MEASUREMENT FALSIFIED ITS PREMISE — PART-DISCHARGED, PREMISE CORRECTED
(2026-08-03; the wording above is left VERBATIM because it is banked history and it is what produced the
number). Full record: § Baselines *THE 2026-08-03 FIRST-PAINT RE-MEASUREMENT*.** **(1) THE NUMBER EXISTS
FOR THE CONTENT SCRIPT: worst-arm headroom 26.9 ms** (median; **29.9 ms** on the floor), arms
138.1 / 134.3 / 137.0 ms, **A-vs-A 3.8 / 2.5 ms**, quiesced, at HEAD `757f953` — **so §3.7's
content-script half is UNBLOCKED and priceable, and revisit-when (a) (*"headroom at or below zero"*) did
NOT fire.** **(2) THE STATED REASON WAS WRONG:** `662b90e` moved **app-chunk bytes only** (content script
0 B, both md5s unchanged, 007 §3.4's import fence proving the content graph reaches neither diagram
module), so it never touched the path 8.1 measured — **1.8 ms was MACHINE-STATE on a slower machine, not
a superseded path**, with byte-identity as the control. **(3) THE OWED NUMBER WAS REALLY TWO:** the path
`662b90e` DID change — **the app page** — has **never had a first-paint instrument at all**, and building
one is **ROUTED to a human at the plan gate**, not decided here. **That routing was ANSWERED at the plan
gate: the app-page items ship on a stated per-item cheapness argument with a structural conditionality
guard, the coverage hole is CARRIED, and M8 does NOT fund an app-page first-paint harness** (human ruling,
2026-08-03; plan D-11 names the trigger that funds it later).
★ **`specs/008-persona-1-qol/plan.md` PASSED GATE 2 — APPROVED (2026-08-03); `tasks.md` IS THE NEXT
ARTIFACT AND THE NEXT GATE**, generated in a fresh session (C14). It settles **D-1…D-12**, resolves all ten
§7 risks against the actual code, and discharges the §7-7 sibling-checklist audit as a 24-row table over two
chromes with opposite geometry. **Both of its architectural calls were CONFIRMED at the gate:** **D-1**
(document identity arrives through a data-only registry and `mount()` spends **one** line — because a name in
`MountOptions` would not survive a watch re-render on either surface; the human accepted that one line to get
the badge on **both** surfaces) and **D-6** (**no** shared post-mount enhancement seam — a shared composition
point would put `diagramEnhancer` on the content-script graph and red the 8/8 import fence, and an enhancer
registry would keep the fence green while opening the graph; the human accepted hardening the duplication
into policy, **the fence being worth more than the DRY**). **Plan §8's four gate-2 questions were ruled:**
**Q1 snapshot diffs stay uncaptioned** (the spec floor), **Q2 copy-out is TWO BUTTONS, not a menu** (so
§3.11's overlay/focus-trap rows 9 and 21 stay inactive), **Q3** the badge lane stays produce-not-choose and
**Q4** the D-11 (iii) trigger stands. **Two scope instructions ride to the tasks stage:** split the heaviest
table-tools task, and re-scope the group-5 give-way task so its content-script rollback path (**removal +
re-measurement**, not an edit) is explicit. Full record: `decisions.md` **2026-08-03 · M8 GATE 2**.
★ **`specs/008-persona-1-qol/tasks.md` IS NOW DRAFTED AND IS AT GATE 3 — 35 tasks across six groups**, with
both gate-2 scope instructions applied: the heaviest table-tools task is **split four ways** (3.2 module ·
3.3 CSS + token verification · 3.4 the two app-page call sites · 3.5 containment) and the give-way is its
own task (**5.7** — removal of D-6 sites 3–4 plus a re-measurement to a restored 318,747 B, never an edit to
a constant). Q1 and Q2 are applied as ruled.
★ **`specs/008-persona-1-qol/tasks.md` HAS PASSED GATE 3 — APPROVED 2026-08-03 at `87532ad`. ALL THREE
GEAR-3 GATES ARE BEHIND M8, AND THE NEXT ACT IS IMPLEMENTATION AT TASK 1.1, IN A FRESH SESSION** (C14,
WORKFLOW.md §5.3) — one commit per task, the box ticked and the Now-pointer advanced in that same commit.
The approval is banked in `decisions.md` (**2026-08-03 · M8 GATE 3**) and **the tasks file's status line
stays "DRAFT awaiting gate 3"** by the precedent now four gates deep — the bank is the approval of record,
not the artifact header. **Two consequences were flagged at the gate and BOTH ACCEPTED:** **(i)** the first
**non-zero content-script byte delta in five milestones** lands at **3.3**, because the toolbar's CSS lives
in `readerCss.ts` which is on **both** graphs — deliberate, so that with the CSS the only contributor in
flight its **ablation is exact**, and the presentation stays revertable without touching the logic;
**(ii)** **3.4 stays as-is** — the two app-page call sites plus the toolbar's structural rows — **not split
further**, because per **D-6** the two sites are load-bearing *together* and wiring only the first ships a
toolbar that disappears on the app page's own re-render (007 D-12's bug class). **Nothing is re-opened:** no
D-value, no spec §3.x decision, no gate-1/gate-2 ruling, and §8-1 … §8-4 stay measure-then-choose —
PRODUCED at 4.3 and 5.1–5.4, **CHOSEN by the human at 5.5**, executed at 5.6/5.7. ★ **And the carried
CHECKBOX CONVENTION is SETTLED as a standing invariant: (c) — per-task ticking, each box in its own commit,
forward from 008; 002 and 007 PREDATE it and are NOT retroactively ticked, their done-ness signal being this
pointer and § Closed milestones.** See § Carried items (discharged) and the gate-3 entry.
★ **M8 IS IN IMPLEMENTATION. TASK 1.4 IS DONE — THE TWO REGISTRATION SITES ARE WIRED AND THE BADGE IS
LIVE: it appears on screen, from a real document's name, on both surfaces (D-1 · D-2, whose `decisions.md`
entries land with this commit because 1.4 is where they became true in the shipped product).** App page:
`registerDocIdentity(file.name)` FIRST in `appShell.installWatchForFile` — before the select that mounts, on
the ordering 005 task 4.7 paid for, so the **first file of a session carries its badge**. Content script:
`registerDocIdentity(basenameOf(location.href))` in `runReader`, after the renderable gate that already
parses the URL, before any mount attempt. ★ **Registration is gated on NOTHING** — not on `docId != null`,
and **not on `installWatchForFile`'s `!decision.watchable` early return either**, which is the *reachable*
silent drop the plan's site table would have walked into: a Firefox picker-route folder is
`{watchable:false}`, so a register placed beside `registerDiffContext` leaves every agent file opened that
way un-badged. Both gates asserted red-first. ★ **TASK 1.5 IS ALSO DONE — THE LANE IS MEASURED, AND
DELIBERATELY NOT CHOSEN: the rect probe ran at BOTH geometry widths on both surfaces and both engines, it
PRODUCED the lane number, and it left THREE FINDINGS for the human at 6.1** (the 1280 collision recorded
rather than fixed; the `position:fixed` contained finding; rows 5/8 recorded as measurement). Full record
below: *THE 1.5 LANE MEASUREMENT*.
★ **TASK 1.6 IS DONE AND GROUP 1 — THE IDENTITY SEAM — IS COMPLETE. THE BADGE PUTS NOTHING ON THE WIRE,
AND THAT ZERO IS MEASURED AGAINST AN ARMED PROBE** (`tests/browser/agentBadgeNetwork.browser.test.ts`, 3
tests per engine, Cr+Fx, both surfaces). The whole lifecycle — REGISTER (the production sites) → RECOGNIZE
(`isAgentFile`) → RENDER (`mount()` composing the pill) → RE-RENDER (bare `mount()` on the content script,
a document switch on the app page) — reads **`[]`** on the engine's own Resource Timing buffer through
`remoteMedia`/`tocNetwork`'s **verbatim `/^https?:/i`** predicate, cumulatively and per step, plus an
isolated `registerDocIdentity → buildAgentBadge → commit` sweep over all five names of the frozen set.
★ **TWO CONTROL LANES ARE ARMED IN EACH TEST'S OWN BODY, BEFORE AND AFTER THE MEASUREMENT** — a bare
`fetch()`, and (row 22's ★) a SUBRESOURCE control on **markup no sanitizer has touched**, since a control
routed through `DOMPurify.sanitize()` measures the sanitizer's internal `DOMParser` pass and reads NO-FETCH
while the route is open (decisions.md 2026-07-29). Probe markup is parsed into an inert **`<template>`**,
never a "detached" div. ★ **AND THE GUARD IS PROVEN RED-FIRST, TWICE.** (i) With an `<img>` appended inside
`buildAgentBadge` (cp-aside ablation, restored), **all 6 tests went red on the badge-attributable step** in
both engines — *the badge's "register → recognize → render" step put bytes on the wire: expected [ Array(1) ]
to deeply equal []*. (ii) With the control's markup left inside the template, the control itself goes red —
so the arming is load-bearing, not decorative.
★ **A SUB-FINDING, MEASURED RATHER THAN ASSUMED: THE FETCH FIRES AT `document.importNode`, NOT AT
`appendChild`.** Ablating only the insertion left the subresource control GREEN in both engines; the
imported fragment is **detached but `document`-OWNED**, and that is what dispatches. Only removing the
import as well turns it red. So *"detached"* is not the property that keeps a node quiet — *"no browsing
context"* is, which is the M1 leak's distinction re-measured on new code and the reason the neutralization
is a `<template>`. Recorded in the suite's own comment.
**A TEST FILE SHIPS NOTHING:** all three bundles byte- and md5-IDENTICAL to 1.5's, rebuilt from a cleared
`.output` — content script **319,709 B** (Cr `a36bd676…` / Fx `fd8407ee…`), app chunk **389,957 B**
(`72058cff…`). `readerCss.ts` UNCHANGED — **the lane is still un-chosen and 1.5's three findings still
stand for 6.1**; no 1.1–1.5 module touched; no dependency (5). **GROUP 1 IS COMPLETE.**
★ **TASK 2.1 IS DONE — GROUP 2 HAS ITS ROOT: `DiffContext` CARRIES A SECOND, OPTIONAL CAPABILITY PAIR
(`fetchFiles?` / `fetchFileText?`, D-3), AND THE SNAPSHOT PAIR IS BYTE-UNTOUCHED — PROVEN BY DIGEST, NOT BY
EYE.** The pair is current-vs-picked material only: a list of `{path, name}` (a new registry-local
`DiffFileEntry`, a structural subset of `MarkdownFile` so a filtered `activeSource.files` is assignable with
no adapter, and so `read()` stays out of the affordance's reach), plus one text-by-path closure whose
`undefined` is the SAME designed shape a reclaimed snapshot already uses. **The discriminant is NOT in the
context** — it lands on the picker row at 2.3, as D-3 ruled; the context carries two independent
capabilities, never a tagged union. **`computeDiff(before, after)` was not touched and needed no change: it
diffs two STRINGS, so compare-two-files is a PICKER, not an engine** — the scoping premise HOLDS.
★ **THE ADDITIVE PROPERTY IS THE CLAIM, AND IT IS MECHANICAL FOUR WAYS:** (i) the four existing capability
members — declarations AND doc comments — are pinned by **SHA-256 `ab9753bb…` over 1194 UTF-8 bytes**,
taken from `git show 21526ac:` BEFORE the edit, with a control in the same test proving the digest rejects a
one-word case change (`meta ONLY` → `meta only` reds it); (ii) `git diff --numstat` reads **49/0 and 160/0 —
ZERO deletions in either file**; (iii) `diffChrome.test.ts`, `diffChrome.browser.test.ts` and every other
existing fake are an **EMPTY diff** and pass unedited (**browser 104 files / 1015 passed / 0 failed, Cr+Fx**);
(iv) making the two members REQUIRED reds `tsc` at **seven existing sites** (`appShell.ts:951`,
`diffChrome.test.ts:43`, `watchControl.test.ts:47`, `agentBadge.browser.test.ts:870`,
`diffChrome.browser.test.ts:283`, +2), which is what "optional, not required" has to mean. Two further
red-first mutations: a factory that DROPS the pair reds the carries-the-pair test; a factory that re-wraps
`fetchText` when the pair is present reds the identity clause of the additive test.
★ **ZERO BYTES MOVED — AND THE ZERO IS MEASURED, NOT ASSUMED.** All three artifacts are md5-IDENTICAL to a
HEAD-source build on **both** engines (content script **319,709 B** Cr `a36bd676…` / Fx `fd8407ee…`; app
chunk **389,957 B** `72058cff…`), because the whole change is TypeScript type declarations (erased) and doc
comments (stripped) — residual **ZERO**, nothing left to account for. **The instrument FIRES:** a runtime
statement injected into `diffRegistry.ts` moves the app chunk **+76 B**, and one placed in a symbol the
content-script graph actually RETAINS (`isDiffContextRegistered`, reached via `diffChrome`/`watchControl`)
moves the content script **+88 B on both engines** (Cr `23e8402c…`, Fx `b494ff4c…`) — restored, both return
byte-for-byte. ★ **A SESSION FINDING WORTH CARRYING: `pnpm build` IS CHROME-ONLY** (`wxt build`); the
Firefox bundle only rebuilds under `wxt build -b firefox`, so a Firefox md5 read out of a stale `.output`
proves nothing. Both engines were rebuilt explicitly here, and the ablation showed `registerDiffContext`
is **tree-shaken out of the content-script bundle** — the first control fired on the app chunk ONLY, which
is why a second was needed. `permissions: []` on both built manifests (654 / 770 B), `web_accessible_resources`
absent, manifest test **2975 B**; golden EMPTY; 007 import fence **8/8**; `diffChrome.ts` unedited so it
gains no import and no fence clause changed; deps **5**.
**TASK 2.2 IS DONE — THE TWO CLOSURES ARE PROVISIONED** (`appShell.ts`, inside the `docId != null` block
beside 6.2's `showDiff`/`hideDiff`). `fetchFiles` and `fetchFileText` both read ONE list expression — a
private `otherFilesInFolder(openPath)` over `activeSource?.files`, filtered by `f.path !== openPath` — so
the exclusion cannot drift between them and a path `fetchFileText` will resolve is exactly a path
`fetchFiles` offered. The list is read at CALL time, never captured. `fetchFileText` calls **that entry's
`read()`**; an unreadable file (`read` may reject) and an unknown path both yield `undefined`, the same
fallback a missing snapshot takes. ★ **BOTH PROPERTIES ARE RED-FIRST PROVEN, each by an ablation whose
signature is the shipped defect.** (a) *Excludes the open document* — dropping the filter reds four tests,
the naming one showing `+ "CLAUDE.md"` in the offered list (the open file offered as its own comparison
target) and `fetchFileText('CLAUDE.md')` returning `'# CLAUDE.md'` instead of `undefined`. (b) *Reads
fresh* — a provisioning that reads every other file ONCE at install and serves the cache reds with the
STALE text named (`- # v2 / second` expected, `+ # v1 / first` received). ★ **The freshness ablation reds
ONE test and passes the other six**, which is exactly why the mutate-between-provision-and-call control is
load-bearing: routing, the empty list and the fallbacks are all satisfied by a cached build.
★ **THE APP CHUNK MOVED +197 B AND THE ACCOUNT CLOSES TO A ZERO RESIDUAL, TWICE OVER.** App chunk
**389,957 → 390,154 B** (`72058cff…`→`57e93f45…`). Four arms, each a real rebuild: **S0** neither closure
nor the helper · **S1** `fetchFiles` + helper · **S2** `fetchFileText` + helper · **S3** shipped.
S1−S0 = **+90**, S2−S0 = **+166**, S3−S0 = **+197**. Four measurements, three unknowns — over-determined,
so the zero is a consistency check and not a tautology: **helper 59 + `fetchFiles` 31 + `fetchFileText` 107
= 197**, residual **ZERO**. The marginals confirm it independently — S3−S2 = **31** and S3−S1 = **107**,
and 90−31 = 166−107 = **59** by two separate routes. ★ **The instrument FIRES and returns exactly:** S0
rebuilds to **389,957 B / `72058cff…`**, byte-for-byte AND md5-for-md5 the pre-2.2 baseline.
★ **THE CONTENT SCRIPT DID NOT MOVE — 319,709 B, md5-IDENTICAL on BOTH engines** (Cr `a36bd676…` / Fx
`fd8407ee…`), which is the app-page-only property as bytes: the closures live in a graph `mount.ts` never
reaches. ★ **And that zero is read off a LIVE instrument, per 2.1's tree-shaking finding** — a probe in
`registerDiffContext` moves nothing there, so the control was placed in a symbol the content-script graph
RETAINS (`isDiffContextRegistered`, reached via `diffChrome`/`watchControl`): **+85 B on both engines**
(Cr `8b45c436…`, Fx `20ca5ea2…`), restored byte-for-byte. Both engines rebuilt explicitly throughout —
`pnpm build` is Chrome-only. **`permissions: []` on both built manifests (654 / 770 B)** and NO permission
was added: reading a sibling file uses the File System Access handle the user already granted for the open
folder, so the zero-permission story holds. `web_accessible_resources` absent; manifest test **2975 B**;
golden EMPTY; **007 import fence 8/8**; `diffEngine.test.ts`'s fence clauses green **with clause B shown
FIRING** (an engine import added to `diffChrome.ts` reds it naming `src/render/diffChrome.ts:326`, then
restored); deps **5**; full suite **1814 passed / 15 skipped**. `diffRegistry.ts` UNEDITED — 2.1's types
were filled, not changed. ★ **A residual worth recording: `fetchMeta`/`fetchText` cannot be CALLED in
jsdom** — they close over `./snapshots`, which is real IndexedDB, not the injected `AppStore`; the 2.2
block asserts their SHAPE only and leaves their behaviour where an engine can run it.
★ **TASK 2.3 IS DONE — THE PICKER CARRIES TWO KINDS: `item.dataset.targetKind` ON THE ROW (D-3), AND TWO
LABELLED `role="group"`s INSIDE THE ONE `role="listbox"` (D-4).** The discriminant sits beside today's
`dataset.snapshotId` because that is **the only place that needs it** — ONE branch reads it, at 2.5; a
tagged union in the context would push a `kind` through two closures to reach that same branch. A file row
is the same `<button role="option">` as a snapshot row (`:264-283`'s reason kept), carries `dataset.filePath`,
and **names the file and says it is a file, in text** (a `__name` span and a `__kind` span reading *File*),
so the kind is readable on the row and never inferred from position or colour (§5). The listbox's own
`aria-label` **widens** to *"Snapshots and other files to compare against"* — a label that still said
*snapshots* would misname the list for exactly the AT users who cannot see the groups. Snapshot rows are
**unchanged**, absolute stamp and size included (mockup divergence 2 stands). ★ **The file rows carry NO
click handler, deliberately** — the gesture is 2.5's single `targetKind` branch, and routing a file pick
through today's snapshot-only `compareWith` would answer it with *"that snapshot is no longer stored"*.
Empty-state copy for the two half-empty states is **2.4's**; the both-empty branch is today's shipped
`closePicker()` + `say(…)`, preserved.
★ **THE SINGLE-KIND PICKER IS STRUCTURALLY WHAT 006 SHIPS, AND THAT NON-REGRESSION IS PROVEN RED-FIRST.**
With one kind the groups are **not rendered at all** — flat `role="option"` rows in the one listbox, no lone
group, no empty group. Asserted as a **DOM-shape equality**: `shapeOf()` prints tag + ARIA role + depth (no
text, no classes, no data attributes) and the snapshot-only tree is written out literally, so the existing
browser assertions cannot pass by transcription drift. It is a printed **tree** rather than a count because
of how it must FAIL — rendering the groups unconditionally reds it **naming `div[role=group]` on the line it
appeared**, where a `querySelectorAll('[role=group]').length` check would only have said *expected 1 to be 0*.
★ **THE CONTENT SCRIPT MOVES — +887 B, IDENTICAL ON BOTH ENGINES — AND THAT IS PLAN-SANCTIONED, NOT A
LEAK.** `mount.ts:28` imports `buildDiffChrome`, so `diffChrome.ts` is on **BOTH** graphs: the picker is
app-page-only at **RUNTIME** (D-14 — no context is registered on the content script, so it builds nothing),
**never in the BUNDLE**. Plan **§4 risk 2** is where that was decided: M8 is the milestone in which the
content-script bundle **stops being byte-identical**, and the price of that decision is that **every byte is
assigned** — an unaccounted byte is a defect, and an identifier grep over a minified bundle **cannot** be the
instrument (M6 retro finding 1). Group 2 held a zero through 2.1 and 2.2; **2.3 is where group 2's bytes
land.** Content script **319,709 → 320,596 B** (Cr `7f2dba47…` / Fx `f777eebc…`), app chunk
**390,154 → 391,041 B** (`6fc92524…`) — **the same +887 on both artifacts**, both engines rebuilt explicitly
(`pnpm build` is Chrome-only). **Decomposed by ablation to a ZERO residual:** the `ARIA_PICKER` const and the
named `snapshotRows` local **+6 B** · the row discriminant and the widened listbox label **+48 B** · the file
row — `buildFileItem`, its two spans, its label — **+585 B** · the grouping — `buildGroup` and the
both-non-empty ternary — **+248 B**. **6 + 48 + 585 + 248 = 887, residual ZERO**, and the control FIRES:
stripping all four reproduces HEAD's bundles **to the md5**. ★ **Record this as the live number: 5.1 measures
§8-1 headroom against 320,596 B, not against 319,709.**
`permissions: []` on both built manifests (654 / 770 B) and no permission added — a sibling file is read
through the File System Access handle the user already granted. `web_accessible_resources` absent; manifest
test **2975 B**; golden **EMPTY**; **007 import fence 8/8**; `diffRegistry.ts` **UNEDITED** (2.1's
`DiffFileEntry` was imported, not changed); no 1.1–2.2 module touched; deps **5**; unit **808/808**, browser
**1023 passed / 15 skipped** (104 files, Cr+Fx).
**TASK 2.4 IS DONE — AND IT WAS WIDENED AT IMPLEMENTATION (Option 1, human ruling 2026-08-04): the empty
states, in a MEASURED LANE.** The two half-empty states land in the existing `role="status"` line and
nowhere else — **no fake row, no disabled row, no placeholder, no empty `role="group"`**. Snapshots but no
folder siblings → the list is offered and the line says *"No other markdown file in this folder to compare
against."*; files but no snapshots → the list is offered and the line says *"No snapshots yet…"*. ★ **The
file sentence is gated on the CAPABILITY, not on the result** — `typeof context.fetchFiles === 'function'`,
because `files.length === 0` cannot tell *"the folder holds no other markdown"* from *"this surface was
never provisioned to look"*, and only the first is a state the user is in. The 006-shaped surface therefore
stays **silent** on that half (red-first by gating on `files.length` alone).
★ **THE AMENDMENT, AND WHY 2.4 TOUCHED FOUR SOURCE FILES INSTEAD OF TWO.** D-4 needs the picker OPEN and the
status SPEAKING at once — but `readerCss.ts:429-430` (base) / `:996-997` (CONTAINED) park
`.peekover-diff-picker` and `.peekover-diff-status` in **ONE slot**, and the CSS says so at `:421-428`
(*"safe because the two are mutually exclusive by construction in diffChrome.ts"*). Measured on the real
surface before deciding, both engines, **by hit-test rather than by rects**: the status painted **OVER** the
list — `elementFromPoint` at a row returned `peekover-diff-status`. **Worse than the empty list §4 forbids.**
So the Files list was widened from `{diffChrome.ts, diffChrome.browser.test.ts}` to add
`{readerCss.ts, diffChrome.test.ts}`, recorded in `decisions.md` **before** the code as a plan-level
amendment. ★ **THE LANE IS DERIVED, NOT TUNED:** `.peekover-diff-picker:not([hidden]) ~
.peekover-diff-status{ top:calc(50px + min(46vh,320px) + 6px) }` — picker top (`:997`) **+ the picker's own
`max-height` cap** (`:403`) **+ the 6px gap** this chrome already uses under the pill
(`diffChrome.ts:107`). The cap term is load-bearing: the picker is 44px with one row and up to the token
with a full window, CSS cannot read a sibling's height, and an offset derived from any particular height
would overlap at every taller one. **CONTAINED_CSS only** — `diffChrome.ts:104`'s standing precedent
(*"no full-page rule moves"*); **`READER_CSS` is byte-untouched.** Sibling combinator is legal because
`diffChrome.ts` pushes `pill, picker, status` in that order.
★ **PROVEN NO-OVERLAP BY HIT-TEST AT 1280 AND 1400 ON BOTH ENGINES, RED-FIRST AGAINST THE SHARED-SLOT
DEFECT.** The hit-test runs **first** in the helper on purpose, so it is the instrument seen to fail:
ablating the lane reds **8 cases** (2 states × 2 widths × 2 engines) with *"hit-test at a row's centre
returned `p.peekover-diff-status`"*. Three more controls fire: making the lane **unconditional** reds the
both-empty case (`expected '376px' to be '50px'`); implementing it by moving the **picker** instead reds the
placement control (`expected '-276px' to be '50px'`); the rect check and a **cap** assertion
(`status.top >= picker.top + max-height`) back it up, so what is pinned is the derivation, not this
fixture's row count. **The both-empty branch is UNCHANGED** — `closePicker()` sets `[hidden]`, the rule
cannot match, and the status resolves to its original **50px**, asserted as the resolved value rather than
as an absence.
★ **THE `:463` INVARIANT WAS RE-SCOPED, NOT DELETED — AND THE OLD GREEN WAS VACUOUS.** It read *"mutually
exclusive on every path"*; it now reads *"…except the half-empty states, which are non-overlapping by
measured lane"*. **The old test would have stayed green over the overlap**: `recordingContext()`'s default
has **no `fetchFiles` member at all**, so no path it could drive ever reached a half-empty state. Every
re-scoped case provisions `fetchFiles` explicitly. jsdom has no cascade and no rects, so the split is
honest: the unit suite pins that the status **matches the lane's selector** in exactly the states that need
it and **does not** on the closed paths (plus that the shipped `CONTAINED_CSS` really carries it and
`READER_CSS` really does not); the **geometry** is the browser suite's hit-test.
★ **ONE CONSEQUENCE 2.4 CREATED AND CLOSED: the sentence must not outlive the list it describes.** With a
half-empty picker open, picking a row closed the picker but left *"No other markdown file…"* standing in the
original slot until the awaited `fetchText` resolved — caught by two existing fallback browser cases going
red. `compareWith` now calls `say(null)` beside its `closePicker()`. **A no-op on every pre-2.4 path** (the
status was always empty while the picker was open), so today's behaviour is preserved; pinned by a unit case
that asserts the state **synchronously** after the pick.
★ **THE CONTENT SCRIPT MOVES +352 B, AND THE DELTA DECOMPOSES TO A ZERO RESIDUAL.** Content script
**320,596 → 320,948 B** (Cr `7f2dba47…`→`108951dc…`, Fx `f777eebc…`→`7d9fc306…`), app chunk
**391,041 → 391,395 B, +354** (`6fc92524…`→`dee77eb5…`). **Not the same +N on both artifacts this time**
— the copy's portion mangles 2 B wider in the app chunk, the same per-chunk effect 1.4 recorded. **FOUR-ARM
ablation, both engines rebuilt explicitly** (`pnpm build` is Chrome-only), with the **control FIRING**: the
strip-both arm reproduces HEAD's bundles **to the md5** (`7f2dba47` / `f777eebc` / `6fc92524`). **CS: the
CSS lane +205 · the `diffChrome.ts` copy +147 · 205 + 147 = 352, residual ZERO.** **APP: +205 · +149 = 354,
residual ZERO.** ★ **The +205 is EXACTLY the two lines inside the template literal** (measured: 205 bytes of
UTF-8), so the **47-line `.ts` rationale block above the export cost 0 B** — finding 9's discipline working,
and the reason the rationale is not written beside the rule it explains. ★ **Note against plan §6/gate 3,
which named 3.3 as where `readerCss.ts` first moves content-script bytes: this amendment moves that forward
to 2.4.** 3.3's stated reason — *"with the CSS the only contributor in flight its ablation is exact"* — is
honoured by assigning the two contributors separately above. **Record this as the live number: 5.1 measures
§8-1 headroom against 320,948 B.**
`permissions: []` on both built manifests (654 / 770 B); `web_accessible_resources` absent; manifest test
**2975 B** (byte-unmodified); golden **EMPTY**; **007 import fence 8/8**; 007's **28 tasks / nine groups**
record intact; `diffRegistry.ts` **UNEDITED**; no 1.1–2.3 module touched beyond `diffChrome.ts` and
`readerCss.ts`; no badge-lane change (6.1's, untouched); deps **5**; unit **813/813**, browser **1041 passed
/ 15 skipped** (104 files, Cr+Fx).
★ **TASK 2.5 IS DONE — COMPARE-TWO-FILES IS A WORKING FEATURE, AND GROUP 2 IS COMPLETE.** The file row got
the gesture 2.4 left off (`item.addEventListener('click', () => void compareWith(item))`), and it calls the
**SAME `compareWith` a snapshot row calls** — which now takes the picked **ROW** and branches **ONCE** on
`row.dataset.targetKind`: file → `fetchFileText(path)`, snapshot → today's `fetchText(id)`. Everything below
the branch is shared and unchanged: `after = getCurrentSource()` (**§9-5 current-vs-picked, never
picked-vs-picked**), `showDiff(host, before, after)` over the plan §1.4 fence, and the same fallback ladder.
★ **THE DISCRIMINANT IS READ WHERE D-3 PUT IT** — off the row, once, at the gesture; **no tagged union
entered the context or either closure**, which is what 2.1 kept the pair independent *for*. ★ **The engine is
UNTOUCHED** (the substrate gift holds): a file-vs-file diff is the same `computeDiff` fed a different
`before`. **D-5's CAPTION** lands in the status line that already exists — *"Comparing doc.md with
sibling-one.md — removed lines are sibling-one.md's, added lines are doc.md's."* — naming **both sides AND
the direction in text**, so neither is inferred from position or colour (§4, §5); the document's own name
comes from **`getDocIdentity()` (D-1's registry)**, the one seam that already holds it. `showCompare()`'s
existing `say(null)` clears it on exit — no new element, no new lifecycle. ★ **GATE-2 RULING Q1 HELD
VERBATIM: a SNAPSHOT diff still says NOTHING on success** — the caption sits on the file side of the one
branch, and both directions are red-first proven. **§3.8 branches with it:** an unreadable other file gets
its **own** sentence naming the file (*"Comparison unavailable — sibling-one.md could not be read."*), never
the snapshot copy that would name a thing the user did not pick.
**RED-FIRST, SIX ABLATIONS, EVERY ONE FIRING ON BOTH ENGINES** (cp-aside + restore, never `git checkout`;
the restore verified md5-identical): **(1)** route the file pick through `fetchText` → **the exact defect
2.3's boundary pin predicted** — *"Comparison unavailable — that snapshot is no longer stored"* (6 browser
cases + 2 unit); **(2)** a one-side caption → reds naming the dropped side; **(3)** caption BOTH kinds →
reds the Q1 pin **and** 006's inherited *"success says nothing"* assertion (over-determined); **(4)** ablate
`mount.ts:224`'s D-15 clear → the new document renders inside a **stale diff**; **(5)** enter-then-fail on an
unreadable file → `data-diff` set and the **column blanked behind an error**, `showDiff` called with
`before: ''`; **(6)** drop the exit's `say(null)` → the caption **outlives the diff**, and the two-arm
equality names the field. ★ **`diffChrome.test.ts:349`'s 2.3-era boundary pin was RE-SCOPED, NOT DELETED**
(the 2.4 precedent) — it asserted the file row had *no* handler, which is exactly what 2.5 lands, so it now
asserts the thing it was guarding the shape of: which capability the discriminant routes a file pick to.
**That widens 2.5's Files list by one file beyond its body** (`src/render/diffChrome.test.ts`); flagged in
the task report rather than taken silently.
★ **THE CONTENT SCRIPT MOVES +416 B, DECOMPOSED TO A ZERO RESIDUAL.** Content script **320,948 → 321,364 B**
(Cr `108951dc…`→`da80bfbc…`, Fx `7d9fc306…`→`b50e4baa…`), app chunk **391,395 → 391,809 B, +414**
(`dee77eb5…`→`7e635aa2…`). **FIVE arms, both engines rebuilt explicitly** (`pnpm build` is Chrome-only):
**gesture +68/+68 · branch +115/+113 · caption +140/+138 · SHARED plumbing +93/+95** (the destructured row
dataset, the `isFile` read, the `HTMLElement` parameter) **= 416 / 414, residual ZERO.** ★ **THE SHARED LINE
IS WHY THERE IS A FOURTH ARM, and it is this session's carried lesson made concrete:** ablating the branch
and the caption one at a time leaves the plumbing both read standing in BOTH arms, so the three margins sum
to **323 of 416** and 93 B land nowhere. The all-three-off arm reproduces HEAD's bundles **to the md5 on both
engines** (`108951dc` / `7d9fc306` / `dee77eb5`) — **the control FIRES**, and the same arm re-proves
`diffChrome.ts:43`'s own claim that a `.ts` comment ships nothing: it carries every new comment block and is
still byte-identical to a HEAD that has none of them.
`permissions: []` on both built manifests (654 / 770 B); manifest test **2975 B** (byte-unmodified); golden
**EMPTY**; **007 import fence 8/8**; `diffEngine.test.ts` **15/15** (the `diff`-off-the-content-script
clauses); 007's **28 tasks / nine groups** record intact; `diffRegistry.ts` **UNEDITED** (2.5 calls the pair,
it does not change it); `readerCss.ts` **UNTOUCHED** — the caption reuses the status line's existing styling,
so no CSS was needed; no badge-lane change (6.1's, untouched); NUL **0 in both forms** across all three edited
files with the control reading nonzero; deps **5**; unit **816/816**, browser **1055 passed / 15 skipped**
(104 files, Cr+Fx).
**GROUP 2 IS COMPLETE — and 2.5 performed NO group-close act, because its body scopes none:** the Files list
is the feature and its tests, and no reconcile, summary or gate is named. ★ **The one thing 2.5 left
outstanding IS NOW DISCHARGED (2026-08-05, doc-only reconcile):** the `decisions.md` entries for **D-3, D-4
and D-5** have **LANDED**. None of 2.1–2.5's Files lists included `decisions.md`, though the
tasks header (`:55-57`) says each D-value's entry lands with the commit that implements it — D-1 and D-2's
did, at 1.4 — so 2.5 reported the gap rather than inventing a close, and the human routed it here. **Each
entry describes its decision AS IT SHIPPED**, referencing the implementing commits: **D-3** the second
optional capability pair with the **discriminant on the ROW** (53638ff · 1dde750 · b0773c9 · a07f94d),
**D-4** the two ARIA groups, the both-non-empty rule and every empty state in the existing status line
(b0773c9 · 6a6b868), **D-5** the one branch at the gesture and the both-sides caption with **gate-2 Q1 held
verbatim** (a07f94d). ★ **D-4's entry REFERENCES the 2026-08-04 *2.4 WIDENED* amendment rather than
repeating it**, and each entry **records plainly that it landed at a reconcile, not with its commit**, so
**6.3's audit** (*"any that did not is named"*) reads the fact off the entry. **No decision was re-opened,
no spec/plan/tasks artifact changed, no box ticked** (no numbered task owns a reconcile), **and both bundles
came back md5-identical to 2.5's** — `decisions.md` is a `docs/` file, imported by no graph, so it ships
nothing by construction; the rebuild confirms it rather than assuming it.
★ **TASK 3.1 IS DONE — THE FILTER'S PROPERTY SET IS ENUMERATED, AND IT IS ENUMERATED BEFORE ANY
TABLE-TOOLS TEST EXISTS (finding 4, the milestone's one hard sequencing constraint).** §3.11's toolbar
column was read and its routing **confirmed against the tree**: every one of the ten landing tasks exists by
number below 3.1, and each one's own citation footer carries the rows routed to it (3.4 rows 1,2,3,4,23 ·
3.5 rows 5,6,8 · 3.6 rows 11,15,16,17,18,19 · 3.7 rows 12,15,16,20,24 · 3.8 row 16 · 3.9 rows 13,14 ·
3.10/4.2 row 2 · 3.11 row 22 · 4.1/4.2 rows 1,23 on the content script; rows 7,10 OUT; rows 9,21 INACTIVE
per gate-2 Q2). ★ **Row 24 is the audit's own signal and it holds: the filter's sibling-source column reads
NONE**, and D-12 found the same hole from the other side — the mockup has a sort affordance, a copy
affordance and **no filter at all**. **26 properties (F1–F26)** are written into
`tests/browser/tableFilter.browser.test.ts`'s header block, **each one checkable and each one carrying
either its sibling source or an explicit "NO BASELINE — enumerated here"** with the requirement it derives
from: **13 inherit a sibling** (rows 2, 4-INVERTED, 12, 13-INVERSE, 14, 15, 16, 17, 19, 20, 22, read for the
filter) and **13 are enumerated fresh** off §4's EARS, §3.6, §3.8 and §5 Trust. Each entry also names its landing
task, so 3.7's report can check the set off property by property. ★ **THE ENUMERATION ALREADY EARNED
ITSELF, ONCE:** **F23 — sort and filter COMPOSE** (filtering a sorted table keeps the sort's order among the
rows still shown; sorting a filtered table un-hides nothing) — has **no sibling, no mockup and no Verify
clause in any task in the file**. It is precisely the property nothing would have noticed missing, and it is
now on the record with "lands: NOWHERE YET — 3.7 either asserts it or names it as unasserted."
**NO ASSERTION, NO `src/` CODE, NO TEST WAS WRITTEN** — the file is a comment block and nothing else, which
is what makes the set a spec the implementation must satisfy rather than a description of an implementation
that does not exist yet. **Both bundles came back md5-identical to 2.5's** — content script **321,364 B**
(Cr `da80bfbc…`, Fx `b50e4baa…`), app chunk **391,809 B** (`7e635aa2…`) — and the reasoning is the
`decisions.md` reconcile's, not an ablation: **a `tests/` file is imported by no graph and ships nothing by
construction**; the rebuild (both engines explicitly, `pnpm build` being Chrome-only) confirms it rather
than assuming it. `permissions: []` on both built manifests (654 / 770 B); `web_accessible_resources`
absent; manifest test **2975 B** (byte-unmodified); golden **EMPTY**; **007 import fence 8/8**; deps **5**;
`pnpm lint` **EXIT=0**; unit **816/816**.
★ **ONE FINDING, BANKED AT DISCOVERY RATHER THAN LEFT FOR 3.4 TO TRIP OVER: A HEADER-ONLY FILE UNDER
`tests/browser/` MAKES `pnpm test:browser` RED.** 3.1's Files list puts the enumeration in
`tests/browser/tableFilter.browser.test.ts` ("its header block IS the enumerated set"), and the browser
project's include glob is `tests/browser/**/*.test.ts` — so Vitest collects it and fails it: **`Error: No
test suite found in file …tableFilter.browser.test.ts`, two failed suites (Chromium AND Firefox), measured,
not predicted.** `pnpm test` is unaffected (the unit project **excludes** `tests/browser/**`) and `pnpm
lint` is clean, so **no pin of 3.1's own Verify contract is touched** — but tasks **3.4, 3.5 and 3.6 run
browser suites before 3.7 writes the first assertion in this file**, and until then a red `pnpm test:browser`
means one thing that is not a defect. **The options, so the next session does not re-derive them:** (a) let
it stand and read past it — the red is a collection error naming exactly one file; (b) 3.7 arrives sooner;
(c) a `describe.todo` placeholder, which collects and asserts nothing — **not taken here, because 3.1's
body says "before its first assertion exists" and the fence for this task was no test code at all.** ★ **AND
A SECOND, SMALLER ONE: 3.1's body pins the bundles to "md5-identical to 1.6's" (318,747 B CS / 389,143 B
app) — those numbers are PRE-GROUP-2 and 2.5 moved both by design (+416 / +414 B, decomposed to a zero
residual).** The body's *property* is what was checked and what holds: **3.1 moves no byte**; the baseline it
moves nothing from is HEAD's, which is 2.5's. Same staleness sits in **3.2's** text ("both bundles
md5-identical to 3.1's (318,747 B CS / 389,143 B app)") — flagged here so 3.2 checks against **321,364 /
391,809** rather than against a number written before group 2 existed.
★ **TASK 3.2 IS DONE — `src/render/tableEnhancer.ts` EXISTS, AND NOTHING IMPORTS IT.** `enhanceTables(host)`
queries `.peekover-reader` and puts an EMPTY toolbar host (`div.peekover-table-tools`) in front of every
enhanceable `<table>`. **The module imports nothing** — it is on both graphs (plan §2), so an import it does
not need is one the content script pays for. **The four properties are RED-FIRST BY ABLATION, each arm run
and its signature recorded, never asserted blind** (six arms, `cp`-aside + restore, 19 tests green at HEAD):
**HEADER-GATED** — drop `if (!hasHeaderRow(table)) continue;` → **4 of 19 red**, the headerless case reading
*"expected `<div class="peekover-table-tools"></div>` to have a length of +0 but got 1"*, §3.11 row 3's
ungate arm at unit level; **IDEMPOTENT** — drop the `TABLE_STATE_ATTR` guard → **2 red**, *"expected …(4) to
have a length of 2 but got 4"*, one toolbar per table per pass; **SCOPED (D-8)** — walk `host.shadowRoot`
instead of the column → **2 red**, the sibling diff view's real table grows the chrome D-8 exists to stop;
**TOTAL (D-7), BOTH HALVES SEPARATELY** — drop the outer boundary → **1 red**, *"expected [Function] to not
throw an error but 'Error: shadowRoot is poisoned' was thrown"*, which on the content script is the throw
that reaches `mountReader`'s catch and **removes a reader that had already rendered correctly**; drop the
PER-TABLE try (one outer try only) → **1 red**, *"expected [ true, false, false ] to deeply equal [ true,
false, true ]"* — **two** tables un-enhanced instead of one, ★ **and the other 18 assertions stay GREEN in
that arm, which is exactly why both halves are tested rather than one**. The failures are injected as an
own-property poison on ONE DOM method of ONE node, so the SHIPPED path is exercised and no test-only seam
was added. ★ **THE PRECEDING-SIBLING PLACEMENT IS ASSERTED ON NODE IDENTITY, NOT SHAPE** (D-12; the mockup's
`.tablewrap` does not exist in our DOM — markdown-it emits a bare `<table>` and `readerCss.ts:169-179`
styles the table itself): a sixth arm builds `attachToolbar` as a **wrap-and-restore**, and the
preceding-sibling test **still PASSES** there while the identity test goes red — *"expected `<div
class="peekover-table-wrap">…(2)</div>` to be `<div class="peekover-reader">…(4)</div>`"*. The table's
`parentElement`, `nextElementSibling` and node identity are unchanged and no wrapper exists in the tree.
**The toolbar is EMPTY** — no `role`, no label, no control (asserted: 0 child nodes, 1 attribute), because
`role="toolbar"` on an element with no widget describes a group that does not exist; sort/filter/copy fill
it at 3.6–3.8 and its presentation lands at 3.3.
★ **THE FIXTURES ARE REAL `mount()` OUTPUT, WHICH IS WHAT MAKES THE GATE A REAL CONDITION:** `parse.ts`'s
`html: true` plus `sanitize.ts:36`'s `table/thead/tbody/tr/th/td` mean a hand-written headerless `<table>`
genuinely reaches the reading column from source (plan §0.2) — hand-building the fixture with
`createElement` would have tested the walk against a DOM no document produces. ★ **AND ONE MEASURED
FINDING WORTH CARRYING: `:scope > thead > tr > th` RETURNS `null` INSIDE A SHADOW ROOT UNDER JSDOM
(nwsapi).** The gate is asked through `tHead` / `rows` / `cells` — the table's OWN structure, which nothing
nested can be reached through and on which both environments agree — rather than through a selector:
`thead th` is wrong on its face (a table nested in another table's header answers for its parent) and the
`:scope`-anchored fix for it **reads correct, IS correct in a browser, and closes the gate in the unit
environment**. Re-measured directly against jsdom at 3.2: the identical selector on identical markup finds
the `<th>` in a light-DOM `<div>` and **`null`** once the column is in the shadow tree, while the DOM API
answers `true` in both. **A gate that closes in one environment and opens in the other is worse than
either.**
★ **BOTH BUNDLES ARE md5-IDENTICAL TO HEAD'S, AND THE INSTRUMENT WAS PROVEN TO SEE THIS MODULE FIRST.** An
unimported module is in no graph, so "byte-identical" would otherwise be a tautology rather than a
measurement. **The firing control:** a TEMPORARY `import { enhanceTables } from './tableEnhancer'` plus a
call in `mount.ts` (reachable on BOTH graphs) → content script **321,364 → 322,116 B, +752, identical on
both engines** (Cr `da80bfbc…`→`b3a24128…`, Fx `b50e4baa…`→`b83922f4…`), app chunk **391,809 → 392,587 B,
+778** (`7e635aa2…`→`45669ab7…`, the chunk's content hash changing with it). **Import removed
(`cp`-aside + restore, never `git checkout`), `.output` deleted, both engines rebuilt from clean: Cr
`da80bfbc362b47693012ac96a02c2d09` / Fx `b50e4baadf15c8b3e72f837cc61b16d5` at 321,364 B and app
`7e635aa27091324a0c0e82dd4f759d8d` at 391,809 B — HEAD's numbers, byte for byte and md5 for md5.**
★ **The baseline is HEAD's, NOT the body's:** 3.2's text pins "md5-identical to 3.1's (318,747 B CS /
389,143 B app)", which is PRE-GROUP-2 — 2.5 moved both by design. The body's *property* (3.2 moves no byte)
is what was checked, against **321,364 / 391,809**, exactly as 3.1's finding flagged.
★ **NO CALL SITE LANDED, BY DESIGN AND BY MEASUREMENT:** `git diff --name-only` is the module, its test,
this file and `tasks.md` — nothing else. The four sites are D-6's: **1–2 (app page) at 3.4**, **3–4 (content
script) at 4.1**. ★ **D-7's TEARDOWN signature is NOT claimed here** — a reader torn down on a document that
had already rendered correctly is reachable only where the call site sits inside `mountReader`'s catch,
which is the content-script site, and it is **4.1's**. **D-8's real-engine half** (a live diff round trip)
is **3.9's**; **rows 5, 6** (containment and the resolved `max-width`) are **3.5's**, jsdom being blind to
both.
★ **THE `describe.todo` QUESTION IS ANSWERED BY THE FILES LIST: IT IS OUT OF 3.2's SCOPE.** 3.2's Files list
(`:416`) is `src/render/tableEnhancer.ts` · `src/render/tableEnhancer.test.ts` — `tableFilter.browser.test.ts`
belongs to **3.1** (which wrote it) and **3.7** (which writes its first assertion). It was **NOT touched**,
no `describe.todo` was added and none was measured, so **3.1's option (a) stands unchanged: `pnpm
test:browser` stays red with the same collection error naming exactly one file** (*"No test suite found in
file …tableFilter.browser.test.ts"*, both engines), and it is read past until 3.7. **Re-measured at 3.2, not
assumed: 2 failed suites / 104 passed files, tests 1055 passed | 15 skipped — the same pass counts 2.5
recorded**, so the red is 3.1's collection error and nothing this task did. **3.4, 3.5 and 3.6 run browser
suites before 3.7 and will meet the same red.**
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; no 1.1–2.5 module
edited; `pnpm lint` **EXIT=0**; unit **835/835** (816 + this file's 19); NUL **0 in both forms** across both
new files with **both** controls reading nonzero (the literal-byte reader AND the escape-form matcher — the
first attempt's escape control read 0 and was re-run from a script file rather than trusted).
★ **TASK 3.3 IS DONE — THE TOOLBAR HOST IS STYLED, IN `READER_CSS` SO BOTH SURFACES CARRY IT, AND THE
FIRST TABLE-TOOLS CONTENT-SCRIPT BYTES HAVE MOVED.** Two rules beside the table styling they belong to
(`readerCss.ts:179-185`, rationale `:758-843`): `.peekover-reader .peekover-table-tools` — `display:flex` with `gap:8px`,
`margin:22px 0 8px`, `--sans`/`12px`/`--muted` — plus `.peekover-reader .peekover-table-tools + table
{margin-top:0}`. **The host stays EMPTY**: this styles the CONTAINER, not its contents — no control, no
`role`, no label, no content (sort 3.6, filter 3.7, copy 3.8), and `tableEnhancer.ts` was not touched.
★ **THE SHEET IS THE LOAD-BEARING CHOICE, AND IT IS THE OPPOSITE OF 2.4's.** `READER_CSS`, not
`CONTAINED_CSS`: the picker's lane is app-page-only chrome (D-14), but the toolbar is a sibling of a
`<table>` **inside `.peekover-reader`**, and D-6 gives `enhanceTables` four call sites — 1–2 app page
(3.4), 3–4 content script (4.1). A CONTAINED-only rule would leave the content-script reader's toolbar
unstyled from 4.1 on, **invisible on one surface in a way no app-page test could see**. Asserted both
ways: the selector is in `READER_CSS` and the class appears **nowhere** in `CONTAINED_CSS`.
★ **D-12's TOKEN CHECK RUN PER TOKEN, AND THE LIST IS SHORT BECAUSE OF WHAT THE SEPIA READING SAID.**
Only two tokens are used, each named with its resolution in all three blocks (`:host` light `:31-40`,
dark `:43-48`, sepia `:51`): **`--sans`** light `"Bricolage Grotesque",system-ui,sans-serif` · dark SAME ·
sepia SAME; **`--muted`** light `#5D6070` · dark `#A0A4B8` · **sepia `#5D6070` (inherited light) on paper
`#F6EEDF`**. The obvious chrome surface — the pills' `--panel`+`--line` pair — was **NOT taken**: sepia
overrides only `--paper`/`--ink`/`--accent`/`--accent-soft`, so `--panel` (#F4F4EF) would sit on sepia
paper (#F6EEDF) at a 2/2/16 per-channel delta, 1.3's recorded reading for all six pills. **The toolbar
declares NO `background` and NO `border` in any theme** — it is a strip in the flow of the column, not a
floating pill, so it needs no surface. ★ **A finding APPLIED, not a token swapped:** `--accent-soft`
(which sepia *does* override) was not substituted, because one piece of chrome that looked different on
one theme would be a divergence, not a fix. The whole-band sepia question stays where 1.3 left it.
★ **SIX RED-FIRST ARMS, EACH RUN AND ITS SIGNATURE RECORDED** (`cp`-aside + restore, 17 tests green at
HEAD): a **hard-coded `#5D6070`** instead of the token → **2 red**, *"expected [ '--sans' ] to deeply
equal [ '--sans', '--muted' ]"* and the literal-colour matcher firing on the rule; a **token no block
defines** (`--tool-ink`) → **1 red**, naming it in the used-token list; **the WRONG SHEET** (the rules
moved to `CONTAINED_CSS`, 2.4's answer) → **4 red**, including *"no such rule in the shipped sheet"* —
the arm that proves the sheet choice is asserted and not narrated; **rationale written INSIDE the
literal** → **1 red**, the byte check naming the leaked sentence; **`margin:2ch`** (finding 6) → **2
red**, *"expected '2ch 0 8px' not to match /\d(?:\.\d+)?ch\b/"*; **the adjacency rule dropped** → **1
red**. ★ **Two controls fire inside the tests themselves:** the literal-colour matcher and the `ch`
matcher both **match elsewhere in the same sheet** (the trap-guard hexes; `max-width:34ch`), so each green
is an absence the instrument could have seen. ★ **And a red-first arm that was WRONG THE FIRST TIME,
recorded because it nearly passed as evidence:** the rationale-in-the-literal arm at first injected text
containing **backticks**, which terminate the template literal — the build failed and the suite reported
582 passed with a transform error rather than a test red. A build error is not a red. Re-run backtick-free,
it reds the byte check by name.
★ **THE CONTENT SCRIPT MOVED +349 B ON BOTH ENGINES AND THE ACCOUNT CLOSES TO A ZERO RESIDUAL — the
first TABLE-TOOLS byte statement, though NOT `readerCss.ts`'s first move this milestone (2.4 moved it
+205 B for the picker's status lane, earlier than plan §6 expected).** Content script **321,364 →
321,713 B** (Cr `da80bfbc…`→`c68e437c…`, Fx `b50e4baa…`→`e1287b5c…`); app chunk **391,809 → 392,158 B,
+349 B** (`7e635aa2…`→`998ebfd7…`). **Four arms, each a real rebuild of BOTH engines from a cleared
`.output`** (`pnpm build` is Chrome-only): **S0** HEAD · **S1** the pointer comment alone **321,470
(+106)** · **S2** the two rules alone **321,607 (+243)** · **S3** shipped **321,713 (+349)**.
**106 + 243 = 349 — residual ZERO**, and the marginals confirm it by a second route: S3−S1 = **243**,
S3−S2 = **106**. The numbers are the source text to the byte: the pointer comment is **106 UTF-8 bytes**
and the two rules **243**. ★ **THE `.ts` RATIONALE COSTS EXACTLY ZERO, MEASURED:** arm **S4** — shipped
CSS with the whole 86-line rationale block deleted — rebuilds to **321,713 B / `c68e437c…` / `e1287b5c…`
and app `998ebfd7…`, md5-for-md5 IDENTICAL to S3**. The instrument that read that zero is the same one
that read S1's +106 and S2's +243 in the same loop, so the null is a measurement. ★ **Never a grep.**
★ **1.3's CRLF sub-finding held and was needed:** the block is **356 B on disk** (the file is uniformly
CRLF — 1139 CRLF, 0 bare LF, and the added lines match it) but **349 B shipped**, the seven newlines each
shedding one byte to the spec's template-literal normalization. A source `wc -c` would have over-stated
the delta by exactly the line count.
★ **THE RATIONALE IS OUT OF THE LITERAL, AND THAT IS A BYTE CHECK RATHER THAN A REMINDER** (finding 9).
The argument lives in a `.ts` comment beside 1.3's badge block, **below `READER_CSS`'s closing backtick**
— the placement 1.3 established for a `READER_CSS` rule and the same 0-shipped-byte property the body's
"above the template literal" asks for. The test reads `readerCss.ts` **from disk**, slices the block,
asserts it is **>1500 B of real prose** (the control — there is something that could have leaked) and
that **no line of it appears in the exported string**; what ships is **one 104-char pointer**, pinned at
≤110. `.peekover-reader table` is **unedited** — asserted, and `git diff --numstat` reads **94/0 and
137/0: ZERO deletions in either file**.
★ **WHAT 3.3 DECLARES AND DOES NOT ASSERT:** the toolbar carries **no `max-width` of its own** — it is a
child of the column, so `--reader-measure` (**748px**, `:83`) already governs it. §3.11 **row 6 is
DECLARED here and ASSERTED at 3.5** as a computed style in a real engine, because a resolved value is
jsdom-blind; **row 5's containment** is 3.5's rect probe at both geometry widths; and **whether the strip
reads as part of its table or as clutter above it is 6.1's WALK judgement**, not a CSS one.
Golden **EMPTY**; **007 import fence 8/8** with clause B firing; `permissions: []` on both built manifests
(654 / 770 B); `web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**;
`pnpm lint` **EXIT=0**; unit **842/842** — 3.2's **835** plus this task's **7** new tests in
`reader.test.ts` (17 in that file now); no 1.1–3.2 module edited, no call site, no
`tableEnhancer.ts` change; NUL **0 in both forms** in both edited files, with a control file reading **2**.
★ **THE BROWSER SUITE'S RED SET IS 3.1's, RE-MEASURED — plus one FLAKE, isolated rather than waved past.**
`pnpm test:browser`: **2 failed suites** are 3.1's collection error naming exactly one file
(`tableFilter.browser.test.ts`, both engines), read past until 3.7. A **third** appeared on the first run
— `watchAnchor.browser.test.ts` on **Firefox only**, *"expected 13.949996948242188 to be less than 8"*, a
scroll-offset tolerance — and it was **isolated rather than waved past**: re-run alone it passes **14/14
on both engines**, and a **second full-suite run reproduces 3.2's numbers exactly — 2 failed suites / 104
passed, 1055 passed | 15 skipped**. Structurally it could not have been this task's either: **nothing
calls `enhanceTables` yet** (the call sites are 3.4 and 4.1), so `.peekover-table-tools` matches **no
element in any rendered document** and neither rule can move a pixel until 3.4 wires the first site. ★ **A
CSS task whose rules match nothing today is exactly the shape that can ship a defect invisibly** — which
is why 3.5's rect probe and 6.1's walk are where its appearance is judged, not here.
★ **TASK 3.4 IS DONE — THE TOOLBAR NOW RENDERS. BOTH APP-PAGE CALL SITES ARE WIRED, TOGETHER (D-6), AND
3.3's CSS FINALLY MATCHES AN ELEMENT.** Site 1 `readerPane.ts:200` (after the committed `mount`, beside
`enhanceDiagrams(host)`) and site 2 `appShell.ts:153-157`'s render fn, whose `render:` provisioning at `:939`
is the one line that puts it on the watch controller. **Sites 3-4 are the content script's and are 4.1's
— untouched**, and that difference IS the import fence.
★ **THE D-6 RENAME: `renderWithDiagrams` → `renderWithEnhancements`, and it is PURE.** The name described
the whole body when the body was one enhancer; it now runs two, so the name was a lie the compiler could
not catch. `git diff src/app/appShell.ts` is **18/4 across four hunks and nothing else** — the import, the
doc comment the rename falsified, the const's name, the `enhanceTables(target)` line, the `render:`
reference. No branch moved, no argument changed. **No code reference to the old name survives** (`tsc`
is the instrument, not a grep); **seven PROSE mentions remain in five files' comments**
(`docIdentity.ts:15`, `diagramEnhancer.test.ts:695`, `agentBadge`/`diagramCache`/`diagramDegrade`/
`diagramRender` browser tests) — documentation debt, **named rather than fixed**, because 3.4's Files list
does not include those files and the confined-diff clause is what it is.
★ **BOTH SITES OR NEITHER, PROVED BY ABLATING EACH ONE ALONE** (`cp`-aside + restore). **Site 1 removed:**
the initial-select arm goes **3 red × 2 engines** (*"expected [] to have a length of 1"*, *"INSIDE the
column — this row inverts: expected false to be true"*) while the **watch-re-render arm stays fully
green**. **Site 2 removed:** exactly the mirror — the re-render arm reds, the initial-select arm stays
green. ★ **That second arm IS the shipped defect D-6 names**: a toolbar on the first render and none after
an agent rewrites the file, and only the site-2 column can see it. Two more arms: the **header gate
ungated** → row 3 reds with *"expected [div, div] to have a length of 1 but got 2"* (the ungated
signature is **2**, the unwired one is **0**, and only "the gate is the header row" reads **1**); the
**toolbar placed OUTSIDE the column** (row 4 transcribed unexamined) → row 4 reds on both sites and both
engines **and the golden diff stays EMPTY**, which is exactly why that structural assertion exists.
★ **THE APP CHUNK MOVES +771 B AND THE CONTENT SCRIPT DOES NOT MOVE AT ALL.** App **392,158 → 392,929 B**
(`998ebfd7…`→`0c40f5e4…`); content script **321,713 B byte-identical on BOTH engines**, md5-for-md5
(`c68e437c…` / `e1287b5c…`) — the enhancer entered the **app graph only**; the content-script graph entry
is 4.1's. **Seven arms, each a real rebuild of BOTH engines from a cleared `.output`.** ★ **The module is a
SHARED contributor and a naive two-arm account would have double-counted it:** S1 (site 1 alone) **+765**
and S2 (site 2 alone) **+765** each carry the whole module, and S3 (both) is **+771**, not +1530. So
**M = S1+S2−S3 = 759 B** (the module entering the graph, once, however many sites call it) · **C1 = S3−S2
= 6 B** · **C2 = S3−S1 = 6 B**. **759 + 6 + 6 = 771 — residual ZERO.** ★ **Two arms make that account
non-circular** (the three-unknown solve is exactly determined and is NOT itself evidence): **S5** adds one
DUPLICATE `enhanceTables(host);` to the shipped build and costs **+6 B**, measuring a bare call statement
by an independent route and agreeing with C1 and C2 to the byte; and **S4** — shipped code with the rename
reverted — rebuilds to **392,929 B / `0c40f5e4…`, md5-IDENTICAL to S3**, so ★ **the rename costs exactly
ZERO, measured** (the minifier mangles a module-level const). ★ **The instrument FIRES:** **S6**, both
sites removed again, returns to **392,158 B / `998ebfd7…`** byte-for-byte and md5-for-md5. **Never a
grep.**
★ **WHAT 3.4 DOES NOT DO.** The host stays **EMPTY** — no control, no `role`, no label, no content (sort
3.6, filter 3.7, copy 3.8), asserted as `children.length === 0`. **No rect and no computed style is read
anywhere in this task**: row 6's resolved `max-width` against `--reader-measure` and row 5's containment
at **both** `GEOMETRY_WIDTHS` are 3.5's probe, and asserting them here at one incidental viewport would
ratify a geometry nobody measured (finding 2). **Row 2's "and no listener" half is INERT and is NAMED, not
asserted vacuously** — the enhancer binds nothing in this build, so the property is true of every document
and discriminates nothing; it becomes real at 3.6-3.8. `tableEnhancer.ts` is **unmodified** (3.2's module
is done); no 1.1-3.3 module was edited beyond the two render paths.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**; unit **847/847** — 3.3's **842** plus this task's **5** new `appShell.test.ts` cases; browser
**1075 passed | 15 skipped**, 3.3's **1055** plus this task's **20** (10 × 2 engines), **106 passed
suites** against 3.3's 104, with the **same 2 failed suites** — 3.1's collection error naming
`tableFilter.browser.test.ts` on both engines, read past until 3.7. The Firefox `watchAnchor` flake 3.3
isolated did **not** recur. NUL **0 in both forms** in all four edited files, with a scratch control file
reading **non-zero** in both.
★ **TASK 3.5 IS DONE — THE TOOLBAR'S CONTAINMENT IS MEASURED, AND THE MEASUREMENT CORRECTED THE ROW IT
WAS SENT TO ASSERT.** `tests/browser/tablePlacement.browser.test.ts` is a new real-engine rect probe (Cr+Fx,
app page, **17 cases × 2 engines = 34**) for rows **5 (INVERTS)**, **6** and **8**. **MEASURE-ONLY: no
`src/` file is touched and BOTH bundles are byte- and md5-IDENTICAL to 3.4's** — CS **321,713 B** (Cr
`c68e437c…` / Fx `e1287b5c…`), app **392,929 B** (`0c40f5e4…`), built from a wiped `.output` with
`pnpm build` **and** `pnpm exec wxt build -b firefox` so neither engine's reading is a stale artifact.
★ **ROW 6 IS NOT WHAT tasks.md SAYS IT IS, AND THE ENGINE IS WHAT SAID SO.** The task carries it as *"the
toolbar's RESOLVED `max-width` equals `--reader-measure` (748px)"*. Measured, **both engines report
`getComputedStyle(toolbar).maxWidth === 'none'`** — `max-width` **is not a CSS-inherited property** and
`.peekover-table-tools` declares none, so "inherits the measure" in `readerCss.ts` and plan §3.11 is the
LOOSE sense (the toolbar takes its bound from the column), not the cascade sense. **The GEOMETRY IS
CORRECT; the mechanism the shorthand names does not exist**, so this is a wording finding and **not** a
defect — no fix was needed and none was made (the FLAG-2 route was not taken because nothing is broken).
★ **AND THE COLUMN IS NOT ALWAYS AT THE MEASURE — the finding that changed the assertion.**
`:host([data-toc="open"]) .peekover-reader` (`readerCss.ts:584-588`) is `width:auto` + `margin-right:
var(--toc-w)`, and its own comment says *"on a narrow scrollport it takes what remains"*. Measured, rail
**OPEN**: **1280 → column 662px, content box 598px, toolbar 598px**; 1400 → 748/684/684. Rail collapsed:
748/684/684 at both widths. **So `684` is the answer THREE of the four states hand you** — and an
assertion written as that constant was **verified RED at `1280 · rail open` ONLY** (2 of 34, one case ×
two engines), green everywhere else. That is **finding 2's defect class one axis over**, which is why the
**rail state is the probe's SECOND axis** alongside both `GEOMETRY_WIDTHS`. Row 6 therefore ships as the
RELATION §3.11's own row-6 cell states (*"a toolbar WIDER THAN THE MEASURE breaks the centring"*), in four
clauses: no `max-width` of its own · the **column's** cap **is** `--reader-measure` · the toolbar's
resolved width **is** the column's content box · never wider than the measure.
★ **ROW 5 (INVERTS) HOLDS AT ALL FOUR STATES, BOTH ENGINES.** Containment on every edge, plus a rect
equality on the column's first content block **with and without** the toolbar — and ★ **the ablation
carries its own FIRING CONTROL**: the `<table>`'s top edge **must** move (exactly **8px**, the released
`margin-bottom`) or the test fails, because "the h1 did not move" proves nothing if the removal reflowed
nothing. ★ **THE TWO ROW-5 HALVES HAVE DIFFERENT SIGNATURES AND ONE RED DOES NOT COVER BOTH.** tasks.md
compresses them to *"red-first by letting it overflow, whose signature is a first block that has moved"*.
**Measured, an overflow does NOT move the first block** — a later sibling overflowing its container
reflows nothing above it, and under the overflow ablation the first-block equality **stayed green** while
24 other assertions went red. The overflow's signature is the **containment**; a moved first block is a
DIFFERENT defect and got its own ablation.
★ **ROW 8 IS INSTRUMENTED AROUND A REAL VACUITY.** The EMPTY host is **zero-height** in both engines
(width 598/684, **height 0.0**), so a whole-rect overlap check would clear every chrome for free. Row 8
(*"Y via row 5's containment"*) is asserted on the toolbar's **HORIZONTAL band** — real, and fixed by the
column rather than the contents, so it is the half that survives 3.6-3.8 filling the host: two disjoint
x-bands cannot overlap at **any** height. ★ **RECORDED, NOT PAPERED OVER:** with `data-toc="collapsed"`
the rail stops reserving column width and its handle floats **OVER** the column's top-right (1280:
`.peekover-toc__toggle` [1120.9,129.2,1240,159.2] vs column [426,77.2,1174,696.2] vs `<h1>`
[458,133.2,1142,182.5]) — a **pre-existing 2.2-era condition of EVERY block in the column**, not something
the toolbar introduces and not 3.5's to fix. Row 8 is therefore asserted rail-OPEN, the state
`diffChrome.browser.test.ts:374-384` forces for the same reason; the **mode toggle clears in BOTH** rail
states and is asserted in both.
★ **RED-FIRST, ALL FOUR BY cp-aside + restore (never `git checkout`), both `src/` files restored to their
committed md5s afterwards** (`readerCss.ts` `173151ca…`, `tableEnhancer.ts` `996ef6bd…`): **(1)**
`max-width:900px` on the toolbar → **8 red**, `'900px'` where `'none'` is required · **(2)**
`min-width:calc(100% + 120px)` → 804px against a 748px measure, **24 red** across containment, both width
clauses and the row-8 x-band · **(3)** `tableEnhancer.ts`'s `table.before(toolbar)` → prepended to the
column, **8 red** with *"top moved … difference is 30"* · **(4)** the constant-`684` test-side ablation
above. ★ **ONE INSTRUMENT WAS MASKED AND FIXED.** Ablation 3 first fired on the test's own **non-vacuity
guard** (*"the first content block has no height"*) because `firstElementChild` had become the prepended
zero-height strip — the cheap guard swallowed the red the equality clause should have shown. The target is
now `:scope > *:not(.peekover-table-tools)`, and the clause that finds the defect is the clause seen to
fail; the reasoning is recorded at the helper.
**WHAT 3.5 DOES NOT DO:** no control geometry (**3.6-3.8** — the host is empty here), no reads-as-clutter
walk judgement (**6.1** — this task measures and does not judge), no content-script call site (**4.1**),
no logic, no host content, **no style-STRING re-assertion** (that is 3.3's; 3.5 asserts the RESOLVED
value, which is why it is a separate real-engine task).
Golden **EMPTY**; **007 import fence 8/8** (clause B still the firing control); `permissions: []` on both
built manifests (654 / 770 B); manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**; unit **847/847** (unchanged — this task adds no unit case); browser **1109 passed | 15
skipped**, 3.4's **1075** plus this task's **34**, **108 passed suites** against 3.4's 106, with the
**same 2 failed suites** — 3.1's collection error naming `tableFilter.browser.test.ts` on both engines,
**read past until 3.7**. NUL **0 in both forms** in the one added file, with a control reading **non-zero**
in both. One unit run showed a 2-test `diagramView` flake under concurrent `pnpm lint`; it did not
reproduce across two clean re-runs.
★ **TASK 3.6 IS DONE — THE TOOLBAR'S FIRST CONTROL SHIPS, AND IT LANDED IN THE `<th>` RATHER THAN IN
THE STRIP.** The sort is `src/render/tableTools.ts` (new; plan §1.3's second table module), wired by one
call in `tableEnhancer.attachToolbar`. ★ **FINDING 1 APPLIES AND THE TASKS FILE WON: 3.6's Files list is
`tableTools.ts` · `tableTools.test.ts` · `tableTools.browser.test.ts` — NOT `tableEnhancer.ts`, which the
session kickoff named, and NOT `readerCss.ts`.** The enhancer was still edited, minimally and by necessity:
the body's own Verify contract is a REAL-ENGINE contract (*"a real `<button>` inside the `<th>`,
keyboard-operable"*, row 11's two-table document), and a control that no production path installs cannot
be asserted in a real engine. The Files list is INCOMPLETE relative to its own Verify contract; the edit is
an import, a call, a `let` and one line in the existing catch (**+41 B**, measured below). Recorded as a
finding, not as a quiet re-scope.
★ **THE MECHANISM — THE ROWS ARE MOVED, NEVER REBUILT, PROVEN ON NODE IDENTITY.** A sort is `appendChild`
over the EXISTING `<tr>` nodes; `appendChild` on an attached node relocates it. **RED-FIRST (measured,
ablation A — a `cloneNode(true)` rebuild):** **8 unit red**, the identity clause reading `a rebuilt row
carries nothing that was hung on the original: expected [ undefined, undefined, undefined ] to deeply equal
[ 2, 1, +0 ]` — and the ORDER assertion in the same test stayed GREEN, which is the whole point: a rebuild
reads correct on text and holds no node in common. **Every sort runs from the CAPTURED document order, never
from the current DOM**, so descending is the reverse of ascending on equal keys rather than a re-sort of a
sorted list.
★ **AND THE `<tbody>` IS NOT ONLY ROWS — MEASURED, NOT ASSUMED.** markdown-it separates its `<tr>`s with
`\n` text nodes, so a first draft that reordered the ROWS alone restored markup that RENDERS identically and
is not what `mount()` committed. Caught by the undo's `innerHTML` equality. The whole child list is captured
and *"off"* replays it; while a sort is applied the separators lead.
★ **D-12's TWO DIVERGENCES, BOTH RED-FIRST AGAINST THE MOCKUP'S OWN SHAPE.**
**(1) A REAL `<button>` INSIDE THE `<th>`** (`mockup.html:565-580` is `<th onclick=…>`). **RED-FIRST
(ablation E — the control built as a `<span>` instead):** **1 unit red** (`expected 'SPAN' to be 'BUTTON'`)
and **6 BROWSER red, 3 per engine, Chromium AND Firefox** — `expected null to be <span>` (it takes no
focus), *"tab did not reach the next sort control"*, and `expected 'none' to be 'ascending'` (Enter does
nothing). ★ **38 browser assertions stayed GREEN in that arm** — the mouse-driven sort works perfectly and
the control is simply unreachable by keyboard, which is the defect's exact signature and the reason §4
names keyboard reach first.
★ **THE SELECTOR WAS THE INSTRUMENT AND IT HAD TO BE FIXED FIRST.** Both suites originally found the
control with `button.peekover-table-sort`. That makes row 16's claim UNFALSIFIABLE: a non-button control
returns nothing, every test dies on an undefined dereference, and the focus assertion written to catch it
never runs. Found **by class alone**, the ablation's control is located and the keyboard clause is the
clause seen to fail — 3.5's masked-instrument lesson, one suite over.
**(2) `aria-sort` ON THE `<th>` PLUS TEXT** (§5 forbids state carried by an icon alone). **RED-FIRST
(ablation D — drop the text, keep the `U+25B2` glyph):** **exactly 1 unit red**, `expected '' to be
'ascending'`, with the `aria-sort` half GREEN — the two halves are asserted separately, so an icon-only
build fails on the half it breaks. ★ **AND THE BROWSER SUITE ASSERTS THE TEXT IS PAINTED** — a non-zero
rect plus `visibility`/`display`, because §5's claim is about what is on the SCREEN and a `width:0` span
satisfies every `textContent` assertion jsdom can make. Row 17: the accessible name carries selection AND
action (*"Sorted by dept, ascending. Activate to sort descending."*) and moves with the state. Row 18: the
glyph is `aria-hidden`, and asserted DRAWN so hiding it is a decision about a real thing.
★ **STABILITY: THE FIXTURE IS THE INSTRUMENT, AND ONE RED DOES NOT COVER BOTH DIRECTIONS.** An unstable
sort on distinct keys is indistinguishable from a stable one, so the fixtures put TWO rows equal on the
sorted column, adjacent, in an order no tie-break reproduces (`zoe` before `adam`). **RED-FIRST (ablation
B — a comparator that tie-breaks on the next column):** **exactly 1 unit red**, `expected [ 'adam', 'zoe',
'bo' ] to deeply equal [ 'zoe', 'adam', 'bo' ]`. ★ **The DESCENDING stability test stayed GREEN in that
arm** (negating a tie-break flips it consistently on this fixture) — recorded, because it means the
ascending clause is the one carrying that red and the descending clause is aimed at a different defect
(*"sort ascending, then reverse"*). Numeric-awareness uses 10 / 9 / 2, whose text and numeric orders share
no position; the comparator is code-unit on lower-cased text and **NOT `localeCompare`**, whose ordering
depends on engine ICU data and would mean different things in the two engines this milestone asserts in.
★ **ROW 11 — RED-FIRST (ablation C, a document-time `querySelector` for the `<tbody>`):** **exactly 2 unit
red**, `the clicked table must be the one that sorted: expected [] to deeply equal [ 'c', 'd' ]` and
`expected [ 'a', 'b', 'c', 'd' ] to deeply equal [ 'a', 'b' ]` — both tables' contents moving in opposite
directions, the `diagramLightbox:354,429` multi-instance class. Every single-table test stayed green.
★ **THE SORT IS A NEW FAILURE SOURCE INSIDE D-7's PER-TABLE TRY, AND WRITING THAT TEST FOUND A REAL
DEFECT.** 3.2's D-7 cases poison `table.before`, which fires BEFORE any control is built, so they are GREEN
against the bug: with a failure injected at `cell.append(button)`, the header's own nodes had ALREADY been
moved into a button that never landed and no restore existed for a column not yet pushed — measured as
`expected '<table>…<th></th>…' to be '<table>…<th>dept</th>…'`, i.e. `tableEnhancer`'s *"left exactly as
rendered"* broken by the very control this task adds. **FIXED by registering each cell's restore BEFORE
that cell is touched**; the case is now a permanent test with its measured red quoted at the assertion.
★ **THE APP CHUNK MOVES +2,229 B AND THE CONTENT SCRIPT DOES NOT MOVE AT ALL.** App **392,929 → 395,158 B**
(`0c40f5e4…`→`7e89141b…`, identical on both engines); content script **321,713 B BYTE- AND md5-IDENTICAL
on BOTH engines** (Cr `c68e437c…` / Fx `e1287b5c…`) — `tableTools.ts` is not on the content-script graph
because its call site is `tableEnhancer`'s and the content-script call sites are **4.1's**. Built from a
wiped `.output` with `pnpm build` **and** `pnpm exec wxt build -b firefox`, so neither engine's reading is
a stale artifact. **DECOMPOSED BY ABLATION TO A ZERO RESIDUAL, never by an identifier grep:** **ARM 1** —
`tableTools.ts` on disk, NOT imported → **392,929 B, md5 `0c40f5e4…`, IDENTICAL to 3.5's**, so an
unimported module costs **+0** (3.2's precedent, re-measured) · **ARM 2** — the enhancer's wiring plus a
STUB module → **392,970 B, +41 B**, which is the import, the call, the `let` and the catch line · **SHIPPED
− ARM 2 = +2,188 B**, the sort module's own logic. **0 + 41 + 2,188 = 2,229. Residual ZERO**, and the
firing control for the two small readings is the same instrument moving by the full amount in the same
session.
★ **3.5's CONTAINMENT SURVIVED THE TASK — AND IT SURVIVED IT FOR A REASON THAT WAS NOT THE PREDICTED ONE.**
The kickoff expected the strip to gain height and row 8's x-band to carry the load. Measured, **the strip
is STILL EMPTY**: D-12 divergence 1 puts the control inside its own `<th>`, so the sort never enters the
toolbar at all — the filter (3.7) and the two copy buttons (3.8) are what will fill it. `tablePlacement`'s
34 cases are green unchanged, and a new assertion pins the fact directly (a sortable table has three
controls and **none** of them is in the strip).
**WHAT 3.6 DOES NOT DO:** no filter (**3.7**), no copy-out (**3.8**), no content-script call site
(**4.1**), no walk judgement (**6.1**), and ★ **NO STYLING** — `readerCss.ts` is not in 3.6's Files list,
so the button ships with the engine's own default chrome and **§3.11 row 19 (reduced motion) is INACTIVE**,
its condition being *"only if a transition ships"* and none does. ★ **STATED AS A FINDING: no task in
`tasks.md` scopes control styling** — 3.3 styled the container and says so, 5.6 touches `readerCss.ts` only
for §8-4's presentation block (agent files, unrelated). A native `<button>` in a `<th>` is legible and
correct but is not the reading language; **6.1's walk is where that judgement belongs**, and it now has a
real control to judge. ★ **NO THRESHOLD WAS INVENTED** (§8-3 is measured at 5.1-5.4 and CHOSEN at 5.5): the
one size check — a `<tbody>` with no rows gets no control — is a definition, not a threshold, and is
labelled as one in the module.
Golden **EMPTY**; **007 import fence 8/8** (clause B still the firing control); `permissions: []` on both
built manifests (654 / 770 B); manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**; unit **877/877**, 3.5's **847** plus this task's **30**; browser **1133 passed | 15 skipped**,
3.5's **1109** plus this task's **24** (12 tests × 2 engines), **108 passed suites**, with the **same 2
failed suites** — 3.1's collection error naming `tableFilter.browser.test.ts` on both engines, **read past
until 3.7**. NUL **0 in both forms** (node byte scan and `tr -cd`) in all four edited files, with a control
file reading **2** in both. Ablations by cp-aside + restore, never `git checkout`; both `src/` files
restored to their shipped md5s afterwards (`tableEnhancer.ts` `86469afd…`; `tableTools.ts` shipped at
`27cd78ed…`). ★ **A LOAD FLAKE, RECORDED:** two unit runs taken while the browser suite was finishing
showed `pipeline.perf` (`expected 116.9 to be less than 100` — an explicitly machine-sensitive budget) and
`golden`’s 5-6 s byte-stable case failing; **three consecutive clean runs are 877/877** and `golden` passes
alone in 3.8 s. Machine state, not a regression — the M6 lesson that a red on a busy machine looks like a
defect.
★ **TASK 3.7 IS DONE — THE FILTER SHIPS, THE TOOLBAR STRIP HAS ITS FIRST CONTENT, AND ROW 24's ENUMERATED
SET IS DISCHARGED PROPERTY BY PROPERTY.** `installTableFilter(table, toolbar)` puts a `<label>`-wrapped
field, a clear `<button>` and a `role="status"` count into 3.4's host, and a second `<tbody>` carrying the
empty state into the table. `tableEnhancer.attachToolbar` gains one call, a `let` and one line in its
catch.
★ **THE MECHANISM — THE ROWS ARE HIDDEN, NEVER REMOVED, PROVEN ON NODE IDENTITY (F6).** Filtering sets
`hidden` on the `<tr>`s that do not match and detaches nothing, so clearing is exact rather than a
re-render. **RED-FIRST (ablation A — a `replaceChildren` rebuild from a captured snapshot):** **6 unit red
and 6 browser red (3 per engine, Chromium AND Firefox)**, reading `expected [ …(2) ] to have a length of 3
but got 2` on the identity clause — while the TEXT and COUNT assertions in the very same file stayed
GREEN (*"only matching rows are shown, and the count says how many of how many"* passes against the
rebuild). That is F6's own sentence measured: *"a rebuild-and-restore passes a text assertion and fails
this one."*
★ **A MASKED INSTRUMENT, CAUGHT IN-SESSION AND FIXED — the fifth of this class.** The first shape of the F6
case read `bodyRowsOf(table)[2].hidden` as a cheap guard BEFORE the identity clause. Under ablation A the
suite died on `TypeError: Cannot read properties of undefined (reading 'hidden')` at that guard and said
**nothing whatever about identity**. Both suites now assert the count and the identity FIRST and read
`hidden` last; the ablation was re-run and the clause that finds the defect is the clause seen to fail. The
measured red is quoted at the assertion in both files.
★ **THE EMPTY STATE IS A SECOND `<tbody>`, AND THAT IS WHAT KEEPS IT OUT OF EVERYTHING ELSE'S WAY (F11,
F12).** One `<tr>` with a `<td colspan>`, inserted after the data body: `tBodies[0]` — what the count's
denominator, the sort's captured order and the row scan all read — cannot contain it, so no "which rows are
real" filter has to exist and be kept correct. **RED-FIRST (ablation I — the empty row never shown):** 1
unit red and 2 browser red, `expected false to be true` on *"an explanation that is painted"*. The header
is asserted PAINTED and ABOVE it, so §4's *"never an empty table with no explanation"* is read in a table
that still names its columns.
★ **§5's STATE-IN-TEXT IS ASSERTED WHERE IT IS REAL. RED-FIRST (ablation C — `font-size:0` on the count,
text intact):** the ENTIRE unit suite stayed **60/60 green** and exactly **2 browser tests red, one per
engine**: `the count has no box — it is not on screen: expected false to be true`. A `textContent`
assertion cannot see this at all, which is the whole reason the paint clause exists. **RED-FIRST (ablation
J — a live region that never leaves the a11y tree):** 4 unit + 6 browser red on row 20's property.
★ **ROW 16 / F15 — RED-FIRST (ablation D — the clear control built as a `<span>`, the mockup's own shape):**
**1 unit red** (`expected 'SPAN' to be 'BUTTON'`) and **4 browser red across BOTH engines** — *"tab did not
reach the clear control"* and *"Enter did not clear the filter"*. ★ **22 browser assertions stayed GREEN in
that arm**: the span still clears on a mouse click, and is simply unreachable by keyboard. The controls are
found **BY CLASS ALONE**, never `button.peekover-table-filter__clear`, so the ablation's control is LOCATED
and the keyboard clause is the clause seen to fail (3.5's and 3.6's lesson, carried).
★ **F16 — RED-FIRST (ablation B — no `aria-label` on the field, a static name on the clear):** exactly **3
unit red**, `expected null to be 'Filter the dept, who, n table'` and `expected 'Clear' to be 'Clear the
filter on the dept, who, n table…'`. The field names the TABLE by its column headers; position is reached
only by a header row that names nothing, and even then it is *"this table"* rather than an index. ★ **NO
`<caption>` BRANCH, and that is measured rather than an oversight:** `sanitize.ts:36` does not allow the
element, so a caption from source never reaches the reading column and a branch no document can reach is a
branch no test can honestly cover.
★ **F5 — RED-FIRST (ablation G — the predicate over `innerHTML`):** 3 unit red. The fixture is the
instrument: a row whose only occurrence of `secret` is inside an `href`, asserted to BE in the markup and
NOT in the displayed text before the predicate is asked. **F26 — RED-FIRST (ablation H — the recovery
removed):** exactly 1 unit red, the injected `the row text accessor is poisoned` escaping. The shipped path
shows every row again and says so in the same polite region (*"Filter unavailable. Showing every row."*),
because a loop that gave up halfway would leave rows hidden with no message and no way back.
★ **F10 / ROW 12 — THE RECT EQUALITY, WITH ITS FIRING CONTROL FIRST. RED-FIRST (ablation E — a clear that
leaves ONE row hidden):** **8 browser red across both engines**, the row-12 clause reporting the defect in
its own units — `bottom moved: table [276.0,302.7,479.8,490.6] -> [276.0,302.7,479.8,443.0]: expected
442.97 to be close to 490.61` (Chromium) and `493.70 -> 446.05` (Firefox), **47.6 px — exactly one row**.
The control fires BEFORE the assertion it guards: the filter must be seen to shrink the table and lift the
prose below it, or *"the rect came back"* is equally true of a filter that never did anything.
★ ★ **F23 — SORT ∘ FILTER COMPOSE IS ASSERTED, NOT NAMED. 3.1 routed it NOWHERE ("no sibling, no mockup,
no Verify clause — the one nothing would have noticed missing"), and 3.7 is the first task where BOTH
controls exist.** Both orders, in the unit AND in both engines: filtering a sorted table leaves the sort's
order among the rows still shown; sorting a filtered table un-hides no hidden row and loses none, and the
sort's third state replays a captured list of the SAME live nodes so each row's `hidden` rides back with
it. **RED-FIRST (ablation F — a `reorder` that clears `hidden`):** 2 unit red and 2 browser red with the
defect's exact signature — `expected [ 'bo', 'adam', 'zoe' ] to deeply equal [ 'adam', 'zoe' ]`, the
filtered-out row back on screen. The composition works by construction: the sort MOVES row nodes and the
filter writes an ATTRIBUTE on row nodes, so neither operation can undo the other.
★ **ROW 24's SET, CHECKED OFF — 26 ENUMERATED, 26 ACCOUNTED FOR.** **ASSERTED AT 3.7 (19):** F1, F2 (+ unit
header-gate) · F4 (unit + browser) · F5 · F6 (unit + the not-rendered half in both engines) · F7 · F8 (the
header is never in the denominator) · F9 · F10 (unit node set + browser rect) · F11 · F12 · F13 · F14 (unit
text + browser paint) · F15 (unit shape + browser focus/Tab/Enter/Space) · F16 · F17 (no `document`/`window`
listener, and typing `e`,`n`,`g`,`f`,`/` outside the field filters nothing while the field itself does) ·
**F23** · F25 (an `Element.prototype.innerHTML` setter spy across build, filter, empty-state, clear and
undo — **with a control that fires in the same test**) · F26. **CONDITIONAL AND INACTIVE (1):** **F18** —
its condition is *"only if a transition ships"* and none does; `readerCss.ts` is not in 3.7's file list, so
the three controls ship with the engine's own default chrome, exactly as 3.6's button does. **NAMED, NOT
DROPPED — asserted by another task (6):** **F3** → 3.10 / 4.2 (D-11 (ii)'s arm 2) · **F19**, **F20** → 3.9
(D-9's revert-and-fail and row 14's closure death) · **F21** → 3.2's unit half, already shipped, and 3.9's
real-engine half · **F22** → 3.8 (copy reads the rows currently shown) · **F24** → 3.11 (request-level
zero-network across sort → filter → copy). **No entry is unaccounted for.**
★ **THE test:browser RED CARRIED SINCE 3.1 IS CLEARED.** `pnpm test:browser` was **2 failed | 108 passed
(110)** at HEAD — 3.1's *"No test suite found in file …tableFilter.browser.test.ts"* on both engines, read
past for six tasks. It is now **110 passed (110), 0 failed**, **1159 passed | 15 skipped** — 3.6's 1133 plus
this task's **26** (13 tests × 2 engines). Unit **907/907**, 3.6's 877 plus this task's **30**.
★ **3.5's CONTAINMENT AND 3.6's SORT BOTH HOLD, AND THE STRIP IS NO LONGER EMPTY.** `tablePlacement`'s 34
geometry cases are green **unchanged** with a real input, a button and a count in the strip — 3.5 chose the
x-band assertion precisely because *"disjoint x-bands cannot overlap at ANY height"*, and 3.7 is where that
choice is tested against a host with content rather than a zero-height one. The sort's own suites are green
unchanged, and a unit case pins the sort still cycling, still stable, still restoring document order with
the filter installed beside it. 3.2's properties hold: TOTAL (no body rows / a ragged body / a headerless
table), IDEMPOTENT (one field, one clear, one count, one empty state after a second pass, `innerHTML`
byte-identical), SCOPED, HEADER-GATED. ★ **The filter is a NEW failure source inside D-7's per-table try
and gets its own case** — poisoning `tBodies[0].after` leaves table 1 EXACTLY as rendered (`outerHTML`
equality against a re-parse of the pre-enhancement markup, the toolbar host gone with it) and table 2
enhanced normally.
★ **THE APP CHUNK MOVES +2,179 B AND THE CONTENT SCRIPT DOES NOT MOVE AT ALL.** App **395,158 → 397,337 B**
(`7e89141b…`→`4ee49a89…`, identical on both engines); content script **321,713 B BYTE- AND md5-IDENTICAL on
BOTH engines** (Cr `c68e437c…` / Fx `e1287b5c…`) — `tableTools`/`tableEnhancer` are not on the
content-script graph until **4.1**. Built from a wiped `.output` with `pnpm build` **and** `pnpm exec wxt
build -b firefox`, so neither engine's reading is a stale artifact. **DECOMPOSED BY ABLATION TO A ZERO
RESIDUAL, never by an identifier grep:** **ARM 1** — the filter's code on disk, `tableEnhancer` NOT wired →
**395,158 B, md5 `7e89141b…`, IDENTICAL to 3.6's on both engines**, so an unimported export and every
helper reachable only through it cost **+0** (rollup drops the lot; 3.2's and 3.6's precedent, re-measured)
· **ARM 2** — the enhancer's wiring plus a STUB `installTableFilter` that references no filter helper or
constant → **395,175 B, +17 B**, which is the import, the call, the `let` and the catch line · **SHIPPED −
ARM 2 = +2,162 B**, the filter's own logic. **0 + 17 + 2,162 = 2,179. Residual ZERO**, and the restored tree
rebuilds to `4ee49a89…` byte-for-byte and md5-for-md5.
★ **THE STRIP CARRIES NO `role="toolbar"`, AND AT 3.7 THAT BECOMES A DECISION RATHER THAN A WAIT.** 3.4's
host declared none because *"`role="toolbar"` over no widget describes a group that does not exist"*; now
there are widgets and it still declares none. An ARIA toolbar is a COMPOSITE widget — it promises arrow-key
navigation and a single roving tab stop — and declaring it without implementing it tells a screen-reader
user to press arrows that do nothing. Three native controls in document order are each reachable by Tab
with no script at all, which is what §4 asks for. Recorded in `tableTools.ts` beside the control it governs
and asserted (`toolbar.attributes` is still length 1).
★ **FINDINGS, STATED NOT QUIETLY RE-SCOPED.** (a) **3.7's Files list omits `src/render/tableEnhancer.ts`** —
the same omission 3.6 recorded, and the same conclusion: the filter lives in the strip the enhancer builds,
so its install call has nowhere else to go. (b) **It also omits the two suites that PINNED THE EMPTY
STRIP** — `src/render/tableEnhancer.test.ts` (`toolbar?.childNodes` of length 0) and
`tests/browser/tableTools.browser.test.ts` (two `children` length-0 assertions). Both were necessarily
false after this task and are updated **to the specific claim they always meant** — the host has three
children and no `role`; no SORT control is in the strip — rather than deleted. (c) **§8-2 is NOT decided
here:** the filter ships PER-TABLE because §3.6 decided it, and the per-table-vs-per-document question is
measured at 5.2 and chosen at 5.5. (d) **No threshold was invented** (§8-3 is 5.5's): the one size check —
a `<tbody>` with no rows gets no filter — is a definition, not a threshold.
**WHAT 3.7 DOES NOT DO:** no copy-out (**3.8**), no content-script call site (**4.1**), no D-8/D-9
degradation suite (**3.9**), no cost guard (**3.10**), no zero-network proof (**3.11**), no walk judgement
(**6.1**), and no styling.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint` **EXIT=0**. NUL **0 in both forms**
(node byte scan and `tr -cd`) in all six edited files, with a control file reading **2** in both. Ablations
by cp-aside + restore, never `git checkout`; both `src/` files restored to their shipped md5s afterwards
(`tableTools.ts` `c2a1be04…`; `tableEnhancer.ts` `3c80f863…`).
★ **TASK 3.9 IS DONE — D-8's EXCLUSIONS AND D-9's PER-RENDER DEGRADATION ARE ASSERTED, AND THE WHOLE TASK
COST ZERO PRODUCTION BYTES.** `tests/browser/tableScope.browser.test.ts` (**6 cases × 2 engines = 12**) is
the entire change: `src/` is **UNTOUCHED**, and both bundles rebuild **byte-for-byte and md5-for-md5
identical** to 3.8's on both engines — **CS 321,713 B** (`c68e437c…` / `e1287b5c…`), **app 399,646 B**
(`7275a378…`). This is the **measure-existing** shape the task's Files list called for, not the new-logic
one: D-8 and D-9 are properties `enhanceTables`'s SHAPE already makes true, and 3.9 is the assertions.
Unit **944/944** (unchanged — no unit test added); browser **1195 passed | 15 skipped, 114 files, 0 failed**
(1183 + this task's 12); `pnpm lint` **EXIT=0**.
★ **D-8 — THE SCOPE *IS* THE EXCLUSION, AND THE DIFF LEG IS THE ONE THAT CARRIES THE RED.** `enhanceTables`
queries `.peekover-reader` (`tableEnhancer.ts:181`) and walks THAT; the diff view and the raw view are
SIBLINGS of the column in the same shadow root, so both are excluded **by construction** with no
entry-condition branch to rot. **The two exclusions are NOT symmetrical and the suite says so rather than
reporting green twice.** The DIFF contains **REAL `<table>` elements** — `renderHunk` runs the full
`sanitize(parse(...))` — asserted non-vacuously as *a table with a 3-cell header row*, so neither emptiness
nor the header gate is doing the excluding. The RAW view contains **none**: `ensureRawView` sets
`textContent`, so the markdown is TEXT. Its exclusion is **over-determined** (the address AND the absence),
the widening ablation does **not** red it, and this is stated in the file instead of papered over — what the
raw leg asserts instead is the pair that makes it mean something: the table's **source** really is on screen
(`| eng | zoe | 10 |`) and the `<table>` element count is **zero**.
★ **D-9 — `replaceChildren` LEAVES NO STALE ROW, DRIVEN THROUGH THE PRODUCTION WATCH SEAM.** The re-render
arrives through the real pill → the real `installWatchForFile` controller → `render: renderWithEnhancements`
(`appShell.ts:939`, `:153`); nothing is re-implemented. The detector's **first poll is the baseline and
fires nothing**, so the fixture counts production's own `read()` calls rather than guessing at the 1 s
interval. **The wait is on the `<h1>`, never the table** — waiting on the table would time out in the
carried-state arm and the instrument written to catch that defect would never run.
★ **FOUR ABLATIONS, EACH cp-aside + RESTORE ON `tableEnhancer.ts`, EACH SEEN TO FIRE ON BOTH ENGINES.**
**A1** the walk widened to the shadow root → *"the diff's 1 real table(s) were enhanced"*, footprint
`{toolbars:1, sortButtons:3, markedTables:1}` where zero belongs — **that red IS D-8's argument that the
scoping is required rather than defensive**. **A2** the walk narrowed to a selector matching nothing →
*"the reading column's own table must be enhanced — the exclusion is not allowed to be broad"*, which is the
**precision** direction (an exclusion too broad silently drops a feature). **A3** the previous render's rows
carried across and re-applied → the instrument reds **in the defect's own units**: `bo / adam / zoe` — the
OLD source's rows in the OLD SORTED order — sitting where `quinn / rae / sol` belongs. **A4** the installers
handed a CAPTURED `<table>` → `{sortButtons: 0, matrix: <unmoved>}`, row 14's *"a click that mutates
nothing"*. `tableEnhancer.ts` restored to `63916d73…` after every arm.
★ **THE MASKED-INSTRUMENT REFLEX PAID AGAIN, AT A4.** A captured reference removes the buttons, so a
`buttons.length === 3` precondition in front of the matrix check would have swallowed the red and the clause
written to find the defect would never have been seen to fail. The two were **folded into ONE `expect`** —
`{sortButtons, matrix}` — which now reds showing **both halves in one diff**. Every property in the file is
one instrument (a matrix, or an object of counts), never a ladder; the click is guarded so an absent button
is a **reported result** rather than an undefined dereference that kills the case early. Selectors are **by
class alone**, never tag-qualified.
★ **D-8's POSITIVE CONSEQUENCE, ASSERTED AS A POSITIVE.** A diff round trip leaves the column's own table
still sorted with its filter still applied — and it is **NODE IDENTITY** that separates *"restored"* from
*"untouched"*: same `<table>` node, same toolbar node, `data-table-tools` still `enhanced`, the field still
reading `eng`, the same two painted rows. 006 D-15's attribute flip, tested rather than trusted. Also
asserted: three walks over the same diff leave it excluded (**the exclusion is STABLE across renders**), and
the second walk over the column neither double-enhances nor un-enhances it (**IDEMPOTENT**).
★ **ONE MEASUREMENT WORTH CARRYING: `aria-sort` READS THE LITERAL `none`, NOT ABSENT.** The first written
form of the fresh-table clause expected `null` and reds on both engines — `installTableSort` writes the
state on **every** header at install, so the attribute is a declared *"sortable, currently unsorted"* rather
than an omission. Corrected to `none`, which still discriminates: the clicked column would read `ascending`.
★ **A HONEST LIMIT, STATED SO NOBODY READS MORE INTO THE GREEN.** In production **today** the walk is never
run while a diff is open — a change arriving during a displayed comparison is DEFERRED to the exit (D-11,
6.3) and `exitDiff` removes the view before anything re-renders. That is a TIMING accident of one surface at
one moment, and it is **exactly why D-8 is asserted structurally**: the day a fifth call site or an eager
re-render changes that timing, the scoping is what still holds. The diff is entered through
`enterDiff(host, computeDiff(before, after))` — `appShell.ts:983`'s `showDiff` closure verbatim; the
picker → snapshot → IndexedDB route in front of it is `diffChrome.browser.test.ts`'s subject.
**WHAT 3.9 DOES NOT DO:** no cost guard (**3.10**), no zero-network proof (**3.11**), no content-script call
site (**4.1**), no `tableTools` change (**the WALK owns scope — a control-side exclusion would be the design
smell**), no `src/` edit of any kind, and no new exclusion predicate — D-8 asked for none, and plan D-8 says
adding one *"would be the thing that could rot."*
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**. NUL **0 in both forms** (node byte scan and `tr -cd`) in the one added file, with a control file
reading **2** in both. Ablations by cp-aside + restore, never `git checkout`.
★ **TASK 3.10 IS DONE — THE APP PAGE'S ONLY COST EVIDENCE STANDS, AND IT IS NOT A BUDGET.**
`tests/browser/tableCost.browser.test.ts` (**5 cases × 2 engines = 10**) is the entire change: `src/` is
**UNTOUCHED**, and both bundles rebuild **byte-for-byte and md5-for-md5 identical** to 3.9's on both
engines — **CS 321,713 B** (`c68e437c…` / `e1287b5c…`), **app 399,646 B** (`7275a378…`). Unit **944/944**
(unchanged — no unit test added); browser **1205 passed | 15 skipped, 116 files, 0 failed** (1195 + this
task's 10); `pnpm lint` **EXIT=0**.
★ **THE HONEST FRAMING, FIRST, BECAUSE IT IS THE POINT: THIS STANDS IN FOR A NUMBER AND IS NEVER
"WITHIN BUDGET."** **No millisecond figure is reported here and none can be** — the app page has **NO
first-paint instrument at all** (D-11 (iii)), so there is no budget on this surface to be within. What 3.10
proves is **STRUCTURAL**: the enhancement step is **CONDITIONAL**. It is strictly weaker than a
measurement, and the test file says so in its own header so that nobody reading the green infers otherwise.
★ **THE THREE ARMS, IN ONE RUN, THROUGH ONE PARAMETERISED RUNNER.** (1) `mount()` alone on a document with
**no table and the unrecognized name `notes.md`**; (2) the same document, `mount()` **+ `enhanceDiagrams`
+ `enhanceTables`** (`appShell.ts:153-157`'s body verbatim); (3) `mount()` + the same enhancements on a
document **with a table, named `CLAUDE.md`**. Arms 1 and 2 differ in **EXACTLY ONE THING** — whether the
enhancer calls run — because both go through one runner with a flag; any other construction would put the
harness inside the delta. **COUNTED:** total shadow-root node count (**a `SHOW_ALL` TreeWalker** — text
nodes too, because the badge's whole cost on a hit is a `<p>` and its text) and **`addEventListener` calls
on the PROTOTYPE** for the duration of each arm (so a listener bound to `document` or to an uninserted node
counts). **MEASURED: (1) == (2) = `{nodes: 24, listeners: 2}`.**
★ **THE EQUALITY IS THE PROPERTY; THE INEQUALITY IS THE POSITIVE CONTROL — AND THE CONTROL AS D-11 WROTE IT
IS CONFOUNDED ON THE NODE COUNTER. THIS RUN MEASURED THAT, IT DID NOT ARGUE IT.** `(1) == (2)` is vacuous
alone: a counter that never moves reads equal whether or not the code ran. Arm 3 is what makes the tape
measure move. **But `(3) > (2)` compares two DIFFERENT DOCUMENTS**, and arm 3's markdown contains a table,
so its shadow root is larger **before any enhancer runs**. So this file adds a reading D-11 does not name —
**arm 3's FLOOR** (the same document, mounted **without** enhancement) — and `arm3 − arm3floor` is the
enhancer's own delta. **Ablation A3 proved the addition load-bearing:** with `enhanceTables` made a
complete no-op, `movedVsArm2.nodes` **stayed `true`** — D-11's literal control would have read green over a
dead enhancer — while `movedVsFloor` went `false` on both counters. The listener counter is **not**
confounded (plain table markup binds nothing) and is asserted both ways.
★ **D-11 (i)'s NEGATIVE HALF — AND EACH SPY WAS SEEN TO FIRE.** The enhancer calls **neither `parse` nor
`sanitize` nor `sanitizeSvg`**, and touches **no `getBoundingClientRect` / `getClientRects` /
`getComputedStyle` / `offsetWidth` / `offsetHeight`** — asserted on **BOTH** documents, not only the bail
case, because D-11 (i) prices the **table-bearing** render as re-parsing nothing too. The parse/sanitize
control is free and is the strongest available: **`mount()` reaches `sanitize(parse(source))`
(`mount.ts:118`) THROUGH THE SAME MOCK**, moments before the measured window, so the spy is seen recording
`{parse: 1, sanitize: 1}` and then recording nothing. The five layout spies' control is a **probe inside
the same window** — one direct call each, every one recorded. Each negative clause is paired **in the same
`expect`** with the enhancement footprint, so a run in which the enhancer did **nothing at all** cannot pass
as a run in which it did nothing **expensive**.
★ **SEVEN ABLATIONS, EACH cp-aside + RESTORE, EACH SEEN TO FIRE ON BOTH ENGINES.** **A1** a node appended
unconditionally in the prologue → `{nodes: 25}` vs 24, **and the M8-class footprint stayed green** — which
is exactly why the counter is broader than the class list. **A2** a listener bound unconditionally →
`{listeners: 3}` vs 2, nodes unchanged (the two counters are separately live). **A3** the enhancer made a
no-op → the confound above, plus the M8 footprint and both anti-vacuity clauses red. **A4** a
`sanitize(parse(…))` in the prologue → `{parse: 1, sanitize: 1}` where zero belongs, on both documents.
**A5** a `getBoundingClientRect()` in the prologue → `{getBoundingClientRect: 1}`, both documents. **A6**
the parse/sanitize mock left **uncounting** → `controlOnMount` reads `{parse: 0, sanitize: 0}` — **the
spy's control is load-bearing and was seen to fail**. **A7** the five layout patches left unwired →
`controlOnProbe` reads **all five zeros**. `tableEnhancer.ts` restored to `63916d73…` after every arm.
★ **ONE MACHINE-STATE RED, RESOLVED BY A-B-A RATHER THAN BY ARGUMENT.** `src/render/pipeline.perf.test.ts`
(a **pre-existing** 100 ms parse+sanitize budget) red at 103–113 ms under full-suite load. Sequence: red
**with** the new file → red **without** it (worse, 112.96 ms) → green without it → **green with it,
944/944**. The variable that flips it is machine load, and by construction the `unit` project **excludes
`tests/browser/**`**, so this file is never loaded by that run at all.
**WHAT 3.10 DOES NOT DO:** no zero-network proof (**3.11**), no content-script call site (**4.1**), no
content-script conditionality arm (**4.2**), no walk judgement (**6.1**), **no `src/` edit of any kind**
(the enhancer was **already** conditional — 3.10 asserts it, it does not make it so), and **no millisecond
number and no "within budget" claim** anywhere.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**. NUL **0 in both forms** (node byte scan and `tr -cd`) in all three edited files, with a control
file reading **2** in both. Ablations by cp-aside + restore, never `git checkout`.
★ **TASK 3.11 IS DONE AND GROUP 3 — THE TABLE TOOLS — IS COMPLETE. SORT, FILTER AND COPY PUT NOTHING ON
THE WIRE, AND THAT ZERO IS MEASURED AGAINST AN ARMED PROBE** (`tests/browser/tableNetwork.browser.test.ts`,
2 cases × 2 engines = 4). `src/` is **UNTOUCHED** and both bundles rebuild **byte- and md5-IDENTICAL** to
3.10's from a cleared `.output` — **CS 321,713 B** (`c68e437c…` / `e1287b5c…`), **app 399,646 B**
(`7275a378…`). Unit **944/944** (unchanged — no unit test added); browser **1209 passed | 15 skipped, 118
files, 0 failed** (1205 + this task's 4); `pnpm lint` **EXIT=0**.
★ **THE ABSENCE IS VACUOUS WITHOUT THE FIRING CONTROL, AND THE FILE SAYS SO IN ITS OWN HEADER.** "No
request" has two readings — the controls are quiet, or the probe is blind — and only a control that FIRES
tells them apart (finding 1; 3.10's confounded-control lesson one task earlier). So **both control lanes
are armed inside each test's own body, and re-armed after the measurement**: a bare `fetch()`, and a
SUBRESOURCE control on **markup no sanitizer has touched**. The reading is the engine's own Resource
Timing buffer through `remoteMedia`/`tocNetwork`/1.6's **verbatim `/^https?:/i`** predicate applied to the
WHOLE buffer (not a token filter), with `awaitProbeUrls` = `awaitFetchedUrls`'s shape (`remoteMedia:120`)
for the control and `flush()`-then-assert-empty (`:140`) for the zero — **1.6's instrument reused, not
reinvented.**
★ **★ THE CONTROL IS VALID, WHICH IS THE HALF 3.10 TAUGHT TO CHECK.** A control routed through
`sanitize()` measures DOMPurify's internal `DOMParser` pass and **reads NO-FETCH while the route is wide
open** (in Firefox that parse CONSUMES an eagerly-loaded URL) — a false negative with the same shape as
3.10's confounded arm 3. So the probe markup is **hand-written, parsed once, adopted once**, touching
neither `sanitize()` nor `parse()`; it is neutralized in an inert **`<template>`** (never a "detached" div,
which is `document`-owned and DOES dispatch); and the **parse-time confound is avoided by the element
choice**, since only `@import` is eager enough for an inert parse to consume — so one URL carries both
halves and means two different things (template parse fires nothing, adoption of the SAME bytes fires).
★ **WHAT IS MEASURED, THROUGH PRODUCTION.** The app page's own gesture chain — open folder, click file,
`renderWithEnhancements` mounts and enhances (the toolbar's nodes are created **inside** the window) —
then **SORT** (a real click), **FILTER** (a real focus and real key presses) and **COPY** (a real trusted
click). Nothing calls `enhanceTables` by hand; nothing dispatches a synthetic `click()`. Readings are
**cumulative by design** — the buffer is never re-cleared between steps, so a late-recorded entry cannot
be thrown away before the next step reads. Case 2 narrows it further: **six legs, each against a probe
re-armed immediately before it** — the sort's whole three-state cycle, a matching filter, a filter matching
NOTHING (the empty-state `<tr>` unhidden into the live table), the clear control, and **both** copy formats.
★ **THE COPY IS MADE TO SUCCEED, AND THAT IS A MEASUREMENT DECISION.** A refused write is a SHORTER path,
so a zero over a refusal would be a zero over less than the copy. Firefox writes on the gesture alone;
Chromium's `clipboardReadWrite` **browser consent** (not a manifest permission — 3.8's D-10 finding) is
granted over CDP on this file's own context and reset by id in `afterEach`, with the cleanup pinned.
★ **FIVE ABLATIONS, EACH cp-aside + RESTORE, EACH SEEN TO FIRE.** **A1** an `<img>` appended in the sort's
`reorder` → *the table's "sort" step put bytes on the wire* (1 entry in the sequence, 3 in the cycle leg),
both engines. **A2** a `fetch()` in the copy click handler → the **copy** step reds and sort/filter stay
green — attribution is exact. **A3** an `<img>` appended in the filter's `apply` → the **filter** step
reds. **A4** the control's `importNode` + append removed (markup left inside the template) → **the
subresource CONTROL itself reds** — *"adopted markup must fetch — else this probe cannot see a leak"* — so
the arming is load-bearing, not decorative. **A5** the Chromium consent NOT granted → **Chromium reds on
the copy's non-vacuity clause** (*"Copy unavailable"* where *"Copied 2 rows as CSV."* belongs) while
**Firefox stays green**, which is D-10's engine asymmetry re-measured. `tableTools.ts` restored to
`c730e043…` after every arm.
★ **ONE MACHINE-STATE RED AND ONE HARNESS NOTE, BOTH RESOLVED WITHOUT AN ARGUMENT.** (i) The unit run
immediately after the 158 s browser suite red **2 of 944** in `src/render/diagramEnhancer.test.ts`
(environment 422 s — a loaded machine); re-run **944/944** in 11 s, and that file alone **58/58**. By
construction the `unit` project **excludes `tests/browser/**`**, so this task's file is never loaded by
that run. (ii) Vitest browser mode's default port **63315** now falls inside a Windows dynamic TCP
exclusion range on this machine (`63242-63341`, both stacks) and `listen EACCES`'d before any test ran; the
suite was run with the browser API port moved to 5199 and **`vitest.config.ts` was restored byte-identical
(`98d3c37f…`) before the commit** — the port is machine state, not a project change.
**WHAT 3.11 DOES NOT DO:** no content-script call site (**4.1**), no `file://` clipboard residual
(**4.2**), no walk judgement (**6.1**), **no `src/` edit of any kind** (the three controls were **already**
zero-network — they read, reorder, hide and serialize DOM nodes; 3.11 asserts it, it does not make it so),
and **no divergence from 1.6's instrument**. The §4 Trust clause's other two thirds are elsewhere:
agent-file recognition is **1.6's**, already banked; file comparison is group **2's** and **6.1's** walk.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**. NUL **0 in both forms** (node byte scan and `tr -cd`) in all three edited files, with a control
file reading **2** in both. Ablations by cp-aside + restore, never `git checkout`. **GROUP 3 IS COMPLETE.**
★ **TASK 4.1 IS DONE — THE TABLE TOOLS REACH THE CONTENT SCRIPT. SITES 3 AND 4 LANDED TOGETHER (D-6), AND
THE CONTENT-SCRIPT BUNDLE MOVED FOR THE FIRST TIME SINCE 3.3.** `mountReader.ts` gains
`enhanceTables(host)` immediately after the committed `mount` (site 3), and `contentWatch.ts`'s controller
gains `render: renderWithTables` — a closure that calls `mount` then `enhanceTables` — where it passed **no
`render` at all** through three milestones (site 4). Browser **+18 cases** (9 × 2 engines) in
`tests/browser/tableTools.browser.test.ts`; unit **944/944** (unchanged — no unit test added); browser
**1237 passed | 15 skipped, 118 files, 0 failed** (1219 + this task's 18); `pnpm lint` **EXIT=0**.
★ **THE BYTES, DECOMPOSED — FOUR REAL REBUILD ARMS OF BOTH ENGINES, AND THE CROSS-CHECK CLOSES.** **CS
321,713 → 329,233 B, +7,520 B, IDENTICAL on both engines** (Cr `b115c9ae…` / Fx `237831d2…`). The **app
chunk did NOT move**: 399,646 B, `7275a378…`, the same name and the same md5 — `tableEnhancer` and
`tableTools` were already in it, and entering a second bundle costs the first one nothing. Arms: **A**
neither site **321,713** · **B** site 3 only **329,193** · **C** site 4 only **329,227** · **D** both
**329,233**. So **site 3's glue = D−C = 6 B**, **site 4's glue = D−B = 40 B**, and the **shared enhancer
payload, counted ONCE = 7,474 B** — the two sites import the same module, which is why four arms were
needed and not two (the *shared-helper-hides-from-marginal-arms* shape). Cross-check both ways:
B−A = 7,480 = 7,474 + 6 ✓; C−A = 7,514 = 7,474 + 40 ✓. ★ A **fifth arm** splits the payload: with
`tableTools`' three installers stubbed the CS reads **324,793**, so the **three controls are ≥ 4,440 B**
(D−E) and the **enhancer's own orchestration ≤ 3,034 B** — a bracket, not an exact split, because arm E
still pays for its stubs, and **4.3 owns the decomposition to a zero residual**.
★ **THE IMPORT FENCE IS STILL 8/8 AND IT STILL MEANS SOMETHING — BOTH HALVES MEASURED.** (i) **The
traversal now really enters the new modules:** a probe on the fence's own walker reports the content-script
graph containing `src/render/tableEnhancer.ts` and `src/render/tableTools.ts`, where the same probe at
`522ae35` returned **`[]`** — so clause A's *"reaches NEITHER `diagramEnhancer` NOR `diagramEngine`"* is
now an assertion **about them**, not merely near them. (ii) **The fence still fires:** a direct
`import { enhanceDiagrams } from '../render/diagramEnhancer'` added to `contentWatch.ts` took it to **2 of
8 red**, both clause-A halves, naming `diagramEngine.ts:425 — import 'mermaid'`. ★ **The trap was avoided
by construction:** each site names `enhanceTables` in a **direct, static, named import**, so the property
the fence walks is the property that ships. A shared `enhance(host)` would have gone red; an enhancer
**registry** would have stayed **green while the graph opened**, because a runtime `register()` is
invisible to a source traversal. Neither exists. `readerPane.ts:184`'s *"identical body by construction"*
is now true only **within** the app page, and that asymmetry is the fence written in imports.
★ **D-7's TEARDOWN FIRED — AND IT IS REACHABLE AT NO OTHER CALL SITE.** Site 3 sits inside `mountReader`'s
try, whose catch **removes the host**. Revert-and-fail: outer boundary removed from `enhanceTables`, a
throw inserted inside it → `[peekover] reader mount failed; leaving original page` and the host gone from a
document that had **already rendered correctly**, on both engines. ★ **THE INSTRUMENT WAS MASKED ONCE, AND
UNMASKING IT IS THE FINDING.** Routed through the shared harness, the arm died on
`TypeError: Cannot read properties of null (reading 'shadowRoot')` — the fixture's non-null host assertion,
thrown **before** the teardown clause could run, so the check that finds the defect was not the check seen
to fail. The arm now drives `runReader` itself and reads the host with **no dereference**, and reds on its
own words: *"the host must still be in the document — D-7: expected null not to be null"*, Chromium AND
Firefox.
★ **D-6's BOTH-OR-NEITHER, PROVEN IN BOTH DIRECTIONS.** **Site 4 ablated ALONE → 8 red (4 per engine), every
one of them a site-4 arm**, while site 4's own **harness-sanity control stayed GREEN** (*"the poll really
replaces the document"*) — so the re-render demonstrably HAPPENED and produced no toolbar, which is the
vanishes-on-re-render defect in its own units rather than a re-render that never ran. Failure text:
*"expected [] to have a length of 1"* and *"INSIDE the column — this row inverts: expected false to be
true"*. **Site 3 ablated alone → 12 red, every one a site-3 arm, and the whole site-4 column stayed
green** — the two sites are independently observable, which is what the both-or-neither claim needs.
★ **WHAT THE CONTENT SCRIPT ACTUALLY GETS, THROUGH PRODUCTION ONLY.** Nothing in the suite calls
`enhanceTables`, and nothing hands a `render` to a controller it built itself: site 3 is driven through
`runReader` (the entrypoint's own orchestration, `isRenderable` overridden because the runner's page is not
markdown) and site 4 through `installContentWatch` with only the messenger faked. On both sites, on both
engines: the toolbar renders with its **six** children and no `role`, **inside** `.peekover-reader` and
immediately before its `<table>` (row 4's inversion holds on this surface too), the header-row gate still
declines the headerless table in the same document (row 3), and a table-free document grows **no** chrome
anywhere in the shadow root (row 2). With the app-page `describe.each` above it, **row 23 is now discharged
over both surfaces**.
★ **THE HARDENING IS INHERITED, THE CONTROLS ARE RE-PROVEN.** 3.9's exclusions, 3.10's conditionality and
3.11's zero network are properties of `enhanceTables`, which **4.1 imports and does not change** (restored
byte-identical after every ablation), so they are not re-argued. What a new call site can break is whether
the controls still **work**, and they do: the sort reorders (`['2','9','10']`, `aria-sort=ascending`) and
the filter hides-not-removes with its count (`Showing 1 of 3 rows`, three `<tr>`s still in the body), on
first mount and after a watch re-render. ★ **COPY IS DELIBERATELY NOT ASSERTED HERE** — its content-script
question is clipboard availability on `file://`, which MDN itself hedges, and asserting it on the runner's
`http://` origin would ratify the wrong secure context. That is **4.2's** empirical residual.
★ **ONE MACHINE-STATE NOTE, THE SAME ONE 3.11 RECORDED.** Vitest browser mode's default port **63315** is
still inside a Windows dynamic TCP exclusion range on this machine (`63242-63341`) and `listen EACCES`'d
before any test ran; the suite was run with the browser API port moved to **5199** and `vitest.config.ts`
was **restored byte-identical before the commit**. The port is machine state, not a project change.
**WHAT 4.1 DOES NOT DO:** no `file://` clipboard residual and no content-script conditionality guard
(**4.2**), no full byte accounting to a zero residual (**4.3** — 4.1 **states** its own delta), no walk
judgement (**6.1**), **no shared enhancement seam and no enhancer registry** (D-6), **no `tableEnhancer` /
`tableTools` change** (they were built at 3.2–3.8; 4.1 only imports them), no dependency and no manifest
permission. ★ **One stale comment is left standing deliberately, because it is outside this task's file
list:** `runReader.ts:140`'s parenthetical still describes `contentWatch`'s controller as *"passes no
`render` and gets bare `mount`"*. Its argument (the badge re-reads the registry on every render) is
unaffected; the parenthetical is not, and it belongs to whichever task next touches that file.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint`
**EXIT=0**. NUL **0 in both forms** (raw byte count and decoded-codepoint scan) in all three edited files,
with a control file reading **2** in both. Ablations by cp-aside + restore, never `git checkout`.
★ **TASK 4.2 IS DONE — THE CONTENT-SCRIPT CONDITIONALITY GUARD STANDS, AND D-10's `file://` RESIDUAL IS
RETIRED BY MEASUREMENT: MDN's HEDGE RESOLVES TO *YES* ON BOTH ENGINES.** Test-only — no `src/` change —
so **both bundles are byte-identical to 4.1's after a from-scratch rebuild of BOTH engines: CS 329,233 B**
(Cr `b115c9ae…` / Fx `237831d2…`), **app 399,646 B** (`7275a378…`). Unit **944/944**; browser **1251
passed | 15 skipped, 118 files, 0 failed**; the two touched files re-run with `.output/` present read
**48/48, zero skips** (so the `permissions: []` re-proof on both built manifests really ran); `pnpm lint`
**EXIT=0**.
★ **THE CS GUARD — 3.10's SHAPE, AND 3.10's CONFOUND MEASURED RATHER THAN INHERITED ON TRUST.** Four arms
through **production only** (`runReader` → `mountReader`, D-6 site 3; nothing calls `enhanceTables` and
nothing reconstructs `mountReader`'s body): bare-floor, bare-enhanced, table-floor, table-enhanced.
**(1) == (2)** holds on node AND listener counts, and **the firing control is FLOOR-CORRECTED** —
`arm3 − arm3floor`, the same document with the enhancer's body removed. ★ **The floor is not ceremony,
and this run has the number: with the enhancer made completely DEAD, `movedVsArm2.nodes` STILL READ
`true` on both engines** — arm 3's larger markup produces the naive `(3) > (2)` on its own — **while
`movedVsFloor.nodes` read `false`.** A nodes-only naive control would have passed over dead code.
(`movedVsArm2.listeners` went `false`, so the listener counter is un-confounded exactly as 3.10 said;
both forms are asserted.)
★ **THE ABLATION SEAM IS THE MODULE BOUNDARY, AND IT CARRIES ITS OWN WIRED-NESS CONTROL.** The CS has no
`enhance` flag to pass, so `enhanceTables` is module-mocked to a wrapper that is **always called and
always counted** and whose `enabled` decides only whether the real body runs. `enhancerCalls` rides in the
SAME `expect` as the equality — and that mattered: **with site 3 unwired, all three CS cases went red and
`enhancerCalls` dropped 1 → 0**, where the equality ALONE would have stayed **green** (both arms become
identical). A second masked-instrument catch, banked. Third ablation: an enhancer that grows chrome
unconditionally → **the equality reds on both engines** while the firing control stays green, which is the
discriminating structure doing its job.
★ **D-10's RESIDUAL — MEASURED IN A REAL `file://` DOCUMENT, NOT SIMULATED.** There is **no in-page route**:
both engines refuse to navigate web content to `file://` (the finding this repo already carried at
`watchContentWiring.browser.test.ts:24`), and a simulated secure context would prove nothing about the
surface in question. So `vitest.config.ts` gains **one cross-engine browser command**, `probeFileUrlClipboard`
— the same server-side Playwright seam `emulateColorScheme` already uses, and the only one that is not
Chromium-only. It writes a real **raw `.md`** file (the actual CS document class), opens it in a **freshly
created browser context** (so no consent can leak into this file's own `prompt` pin), and fires a **real
mouse click** for transient activation. **THE ANSWER, both engines: `isSecureContext: true`,
`navigator.clipboard.writeText` present and a function** — and the raw `.md` really renders as the single
`<pre>` `readPageSource()` reads. ★ **The ORIGIN is not the discriminator, the GATE is:** Gecko writes on
the gesture alone (`clipboard-write` is not a Gecko `PermissionName` — the grant itself reports
`unsupported`), Blink refuses at consent `prompt` with **`NotAllowedError`** and resolves once the browser
consent is granted — the *identical* A-B this file already pins at the runner's origin. `file://` introduces
**no new behaviour and no new failure mode**. ★ *(`location.origin` does differ — `"file://"` in Chromium,
`"null"` in Firefox — and `isSecureContext` is `true` in both, which is the property that matters.)*
★ **THE MEASUREMENT'S OWN CONTROLS FIRE.** The harness control (`preCount: 1`, `sourceStart: '# Report'`,
the URL ending in our file) reds correctly when the probe is pointed at `about:blank` — **and that same
ablation read `isSecureContext: false`**, which is what proves the `true` on `file://` is a discriminating
reading rather than a value that is true everywhere.
★ **THE COPY DEGRADES GRACEFULLY WHATEVER `file://` ANSWERS (§3.8 F26, D-7) — AND 4.1's DEFERRAL IS NOW
DISCHARGED HONESTLY.** The measurement is what unblocked it: `file://` and the runner's origin are now
**known** to be the same secure-context class with the same gate and the same `NotAllowedError`, so driving
the real content-script copy at this origin no longer ratifies the wrong secure context. One case, both
branches: the click **resolves** (no throw escapes), the status **says** what happened — the confirmation on
Gecko, §3.8's *"Copy unavailable. The table is unchanged."* on Blink, with the Blink branch **pinned** so a
silently-succeeding run cannot stop exercising the degradation — the button is still a painted, enabled
`<button>`, and the table is still readable (`['zoe','adam','bo']` on screen, host connected). Red-first:
**with F26's `fail` handler removed the case reds on Chromium**. ★ **No `src/` change was needed** —
`tableTools.ts:834-846` already handles both an absent clipboard and an async rejection.
★ **ONE MEASURED HARNESS FINDING, RECORDED BECAUSE IT COST A 100-SECOND TIMEOUT.** The probe's first shape
appended a `<button>` to the `file://` page and clicked it by id; on the browser's **plain-text** `.md`
document that click never resolved (Firefox, 30 s locator timeout). The engines' text-resource document is
not an authored one — a listener on `document` plus a real `mouse.click` needs nothing to find first, and
the constant is inlined rather than passed across the evaluate boundary. Suite time went 101 s → 10.7 s.
★ **ONE MACHINE-STATE NOTE, THE SAME ONE 3.11 AND 4.1 RECORDED.** Port **63315** is still inside this
machine's Windows dynamic TCP exclusion range; the suite ran with the browser API port moved to **51999**
and `vitest.config.ts` was **stripped of it before the commit** (verified by grep in the committed tree).
Separately, `pipeline.perf.test.ts` read **100.48 ms against a 100 ms budget** on the first full unit run —
immediately after a full browser suite and two builds. `src/` is byte-identical, so 4.2 cannot have moved
it; **3/3 green in isolation and 944/944 green on the re-run**. Machine state, per the *perf-deltas-need-an-
interleaved-control* finding — not a regression, and not silently swallowed either.
**WHAT 4.2 DOES NOT DO:** **no full byte accounting to a zero residual (4.3)** — 4.2 only re-confirms
byte-identity; no walk judgement (**6.1**); no `src/` change of any kind; no dependency; no manifest
permission. ★ **One scope note the human owns and approved in-session:** 4.2's Files list named the two test
files only, and reaching a real `file://` document required the `vitest.config.ts` seam — routed as a
decision (spec-005 records that file as *"OUT OF FENCE — human decision"*) and **approved before any code
landed**, so the commit is four files plus the two records rather than two.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` absent; manifest test **2975 B**; deps **5**. NUL **0 in both forms** (raw byte
count and escape-sequence scan) in all edited files, with a control reading **1**. Ablations by cp-aside +
restore, never `git checkout`.
★ **TASK 5.2 IS DONE — §8-2 IS MEASURED. ACROSS THIS REPOSITORY'S 61 TRACKED MARKDOWN DOCUMENTS
(THE GOLDEN FIXTURES INCLUDED), `45` HAVE NO ENHANCE-ABLE TABLE, `2` HAVE EXACTLY ONE AND `14` HAVE
SEVERAL — 73.8% / 3.3% / 23.0% AT `n=61` — AND ★ THIS REPOSITORY IS A BIASED SAMPLE FOR A TOOL WHOSE
USERS ARE AI AGENTS WRITING ARBITRARY MARKDOWN, SO THAT DISTRIBUTION BOUNDS NOTHING ABOUT THE
POPULATION PEEKOVER ACTUALLY SERVES.** Measurement only: **no `src/` change, no harness committed and
no dependency** (the body's Files list is `progress.md` + the report), and both bundles are **byte- and
md5-IDENTICAL to 5.1's** after a from-scratch rebuild of BOTH engines from a wiped `.output` — **CS
329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **app 399,646 B** (`7275a378…`). Unit **944/944**;
`pnpm lint` **EXIT=0**. ★ **NO VERDICT IS REACHED HERE.** Whether a filter per table *reads as noise*
at several small tables is 006's **reads-as-noise** shape and is a **WALK (6.1)**; **§3.6's per-table
decision is not altered by this task**, and the per-table-vs-per-document choice is **5.5's**. This
task produces the input, nothing more.

★ **THE CORPUS — `n=61`, every tracked `*.md` at HEAD `72a0109`** (`git ls-files '*.md'`), which is
this repository's own markdown **and** the golden fixtures: the 11 files under
`tests/golden/fixtures/` are tracked, so they are *inside* that 61 rather than beside it, and both
halves are broken out below so neither hides in the other.

★ **THE COUNT — ENHANCE-ABLE TABLES, THROUGH THE REAL PIPELINE, NOT A PIPE-CHARACTER GREP.** Each
document was run through `sanitize(parse(source))` — the shipped `src/render/parse.ts` +
`src/render/sanitize.ts`, not a re-implementation — into a jsdom `.peekover-reader` column, walked with
`column.querySelectorAll('table')` exactly as `enhanceTables` walks it, and each table put through
`hasHeaderRow()` transcribed verbatim from `tableEnhancer.ts` (`table.tHead`, then any `TH` among its
head rows). **So the unit counted is a table the enhancer would actually grow tools on**, per §3.6's
gate — which is the only count §8-2's question is about.

★ **THE DISTRIBUTION — the full tail, nothing bucketed away** (documents at each enhance-able-table
count): **0 → 45 · 1 → 2 · 2 → 5 · 3 → 1 · 4 → 3 · 5 → 3 · 10 → 1 · 17 → 1.** Total enhance-able
tables in the corpus: **69**. Rolled into the body's three cells: **none 45 (73.8%) · one 2 (3.3%) ·
several 14 (23.0%)**, `n=61`.
- **Among the 16 documents that carry any table at all, 14 carry several** — the per-document vector is
  `1, 1, 2, 2, 2, 2, 2, 3, 4, 4, 4, 5, 5, 5, 10, 17`, **median 3.5, max 17**
  (`docs/ai/spec-coverage.md`), next `10` (`docs/ai/progress-archive.md`). ★ **Stated because it is the
  inconvenient half of the same measurement:** the modal document has no table, and the document that
  has one usually has several.
- **The golden fixtures alone (`n=11`): none 10 · one 1 (`gfm-torture.md`) · several 0**, one table
  total. **Everything else tracked (`n=50`): none 35 · one 1 (`tests/fixtures/hello.md`) · several 14**,
  68 tables. The two halves of the body's corpus phrase do not agree with each other, and averaging them
  into one cell would have hidden that.
- ★ **A BY-PRODUCT, RECORDED BECAUSE IT IS A REAL RESULT AND NOT A NULL: the gated count equals the
  ungated count in all 61 documents.** Every table in this corpus passes §3.6's header gate; there is
  not one headerless table in it. **So the corpus does not exercise the gate's discrimination at all**,
  and any confidence in that gate has to come from 3.2's unit cases, not from here.

★ **THE COUNT IS VALIDATED, NOT ASSERTED — three hand-counts and three discrimination checks.**
- **Hand-count agreement**, on documents small enough to count by eye: `gfm-torture.md` → counter
  **1**, one pipe block (lines 7–10); `docs/trust/PERMISSIONS.md` → counter **2**, two blocks
  (38–48, 102–116); `specs/008-persona-1-qol/plan.md` → counter **5**, five blocks (opening at lines
  31, 88, 136, 184, 285). Three for three.
- **Discrimination, measured rather than argued:** a pipe table **inside a fence** counts **0**; the
  same three lines **unfenced** count **1 / gated 1**; a headerless raw-HTML `<table>` counts **1
  ungated / 0 gated**. ★ **The third check is what makes the `all == gated` by-product above meaningful
  — the instrument CAN exclude a headerless table, it just never had to here.**
- **And the fenced-code confound is excluded twice over:** the instrument is markdown-it itself rather
  than a regex, and separately **no document in the corpus has a pipe-table line inside a fence** (all
  61 scanned; zero).

★ **THE BIAS, STATED WITH THE NUMBER RATHER THAN UNDER IT (plan §4-7).** *73.8% of THIS REPOSITORY's
markdown has no table and 23.0% has several, at `n=61`* — **and this repository is a specs-and-docs
corpus written by and for this project, which is a biased sample for a tool whose users are AI agents
writing arbitrary markdown.** The tables here are spec-coverage matrices, permission tables and plan
risk grids; they are not the tables an agent emits into a report on someone else's machine. **The
distribution above therefore bounds nothing about the population Peekover serves** — it is a convenient
sample, it is the only sample this milestone funds, and it is reported as such. ★ **And `n=61` is small
where it matters most: the "several" cell rests on 14 documents and the whole non-zero half on 16.** A
reader who wants to lean on the several-table shape is leaning on 14 documents from one repository.
★ **MEASURE-NOT-CHOOSE.** The bucketing is the body's own (none / one / several) and the full tail is
printed beside it precisely so the rolled-up cells cannot be the only reading; nothing was rounded
toward a convenient shape, no document was excluded, and the two halves are reported disagreeing.
**Reproducible without a committed script:** the method above run again over `git ls-files '*.md'`
returns these numbers, and **this entry deliberately adds no markdown table to `progress.md`**, so
recording the measurement does not perturb the corpus it measured.

**WHAT 5.2 DOES NOT DO:** **no reads-as-noise verdict — that is 6.1's walk**; **no alteration of §3.6's
per-table decision**; **no per-table-vs-per-document choice — that is 5.5's**, the human gate, from this
distribution plus 6.1; no §8-3 threshold (**5.3**) and **no constant set anywhere**; no app-page bytes
(**5.4**); no `src/` change, no committed harness, no test added, no dependency, no manifest permission.
Red-first does not apply — 5.2 asserts no behaviour; the rigor is in the count's validation above.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` **absent**; manifest test **2975 B** (byte-unmodified); deps **5**. NUL **0
in both forms** — raw `0x00` byte and decoded `U+0000` — across all **294 tracked text sources** (298
tracked, the four `.woff2` fonts binary and excluded by extension), with a control file carrying one
reading **1 in both forms**.
★ **TASK 5.3 IS DONE — §8-3's SHAPE DISTRIBUTION IS MEASURED. ACROSS THE SAME `n=61` CORPUS'S `69`
ENHANCE-ABLE TABLES, THE MEDIAN TABLE IS `6` BODY ROWS BY `4` SORT-CONTROLLED COLUMNS; `10` TABLES
(14.5%) HAVE TWO ROWS OR FEWER, `20` (29.0%) HAVE THREE OR FEWER, AND BETWEEN `11` AND `13` (15.9%–
18.8%, DEPENDING ON HOW A CELL PREDICATE IS AGGREGATED TO A COLUMN) CARRY ANY NUMERIC COLUMN AT ALL —
AND ★ THIS REPOSITORY IS A BIASED SAMPLE FOR A TOOL WHOSE USERS ARE AI AGENTS WRITING ARBITRARY
MARKDOWN, SO THESE SHAPES BOUND NOTHING ABOUT THE POPULATION PEEKOVER ACTUALLY SERVES.** Measurement
only: **no `src/` change, no harness committed and no dependency** (the body's Files list is
`progress.md` + the report), and both bundles are **byte- and md5-IDENTICAL to 5.2's** after a
from-scratch rebuild of BOTH engines from a wiped `.output` — **CS 329,233 B** (Cr `b115c9ae…` / Fx
`237831d2…`), **app 399,646 B** (`7275a378…`), background **3,548 B**. Unit **944/944**; `pnpm lint`
**EXIT=0**. ★ ★ **NO THRESHOLD IS ASSERTED HERE AND NO CONSTANT IS SET ANYWHERE.** Whether a table
below some size grows no tools — **and the always-on answer, which is equally legitimate** — is
**5.5's** choice, from these numbers; **an always-on outcome must be CHOSEN there, not defaulted into
by 5.3 measuring and quietly setting nothing.** This task produces the input, nothing more.

★ **THE CORPUS AND THE UNIT ARE 5.2's, UNCHANGED — AND THAT RECONCILIATION IS ITSELF A CHECK.** `n=61`,
every tracked `*.md` at HEAD `f0bc04e` (`git ls-files '*.md'`, the 11 golden fixtures inside that 61),
run through the shipped `sanitize(parse(source))` into a jsdom `.peekover-reader` column, walked with
`column.querySelectorAll('table')` as `enhanceTables` walks it, each table gated by `hasHeaderRow()`
transcribed verbatim from `tableEnhancer.ts:104`. **That walk found `69` enhance-able tables — the same
69 5.2 arrived at independently**, so the two measurements agree on their population before either
reports a shape. **All 69 are also SORTABLE** in the shipped sense (`installTableSort` returns an undo
for every one: `<thead>`, `<tbody>`, ≥1 body row, ≥1 `<th>` — not one of the 69 is refused).

★ **WHAT "ROW" AND "COLUMN" MEAN HERE — TAKEN FROM THE SHIPPED CODE, NOT INVENTED.** A **row** is a
`tBodies[0].rows` entry — exactly the `documentOrder` array `installTableSort` reorders
(`tableTools.ts:220`), so the header row is not counted as data. A **column** is a `<th>` in the LAST
header row — exactly the cells that get a sort control (`tableTools.ts:238,257`, which skips a `<td>`
in a head row). **So "column count" is literally the number of sort controls the table would grow**,
which is the quantity §8-3's motivating sentence is about.

★ **THE ROW DISTRIBUTION — the full tail, nothing bucketed away** (tables at each body-row count):
**2→10 · 3→10 · 4→8 · 5→5 · 6→2 · 7→5 · 8→3 · 9→4 · 10→1 · 11→2 · 12→1 · 13→5 · 16→4 · 17→3 · 19→1 ·
21→1 · 23→1 · 24→2 · 39→1.** **Median 6 · min 2 · max 39 · mean 8.52**, `n=69` tables. Cumulative:
**≤2 rows → 10 (14.5%) · ≤3 → 20 (29.0%) · ≤4 → 28 (40.6%) · ≤5 → 33 (47.8%)**. ★ **No table in the
corpus has fewer than two body rows** — the degenerate one-row case §8-3 might have worried about does
not occur here at all, which is a fact about this corpus and not about tables.

★ **THE COLUMN DISTRIBUTION** (sort controls the table would grow): **2→8 · 3→19 · 4→17 · 5→23 · 7→1 ·
8→1.** **Median 4 · min 2 · max 8 · mean 3.93**, `n=69`. Cumulative: **≤2 → 8 (11.6%) · ≤3 → 27 (39.1%)
· ≤4 → 44 (63.8%) · ≤5 → 67 (97.1%)**. **The distribution is tight and high**: 97.1% of these tables
would grow between two and five sort controls, and the two outliers (7 and 8) are the only tables where
the control count reaches the width of a small spreadsheet.

★ **THE NUMERIC AXIS — AND THE ONE PLACE THE SHIPPED CODE DOES NOT ANSWER THE QUESTION, RECORDED AS A
FINDING RATHER THAN RESOLVED BY PICKING.** The sort **does** have its own numeric detection —
`numericValue()` (`tableTools.ts:107`), deliberately strict: an optional sign, digits, one optional
decimal point, so `1e5`, `0x10`, `Infinity` and an empty cell are all **not** numbers. It was
transcribed **verbatim** rather than re-implemented. ★ **But it is a per-CELL predicate applied
per-PAIR**: `compareCellText` (`tableTools.ts:129-136`) compares numerically only when **both** cells of
a comparison parse, and **there is no per-COLUMN numeric classification anywhere in the shipped code.**
So §8-3's *"whether any column is numeric"* has **no shipped analogue at column granularity**, and the
aggregation from cell to column is **undetermined by the code**. ★ **Rather than choose one aggregation
— which would be choosing a value — all four defensible ones are reported**, over tables carrying at
least one such column, `n=69`: **every body cell numeric → 11 (15.9%) · every NON-EMPTY body cell
numeric → 12 (17.4%) · a majority of body cells numeric → 12 (17.4%) · any single body cell numeric →
13 (18.8%).** ★ **The definition therefore moves the answer by exactly two tables out of 69, and only
`3` of the 69 tables disagree across the four definitions at all** (`progress-archive.md` twice,
`progress.md` once) — so the numeric axis is **robust to the aggregation choice at this corpus size**,
and 5.5 does not have to settle the definition before it can read the number. Numeric-column COUNT per
table (strictest definition): **0→58 · 1→9 · 2→1 · 6→1** — one table carries six numeric columns, and
58 of 69 carry none.

★ **THE JOINT SHAPE — because §8-3's sentence is a JOINT claim ("a two-row table with a sort control on
every column"), and three marginal histograms cannot answer it.** Tables with **≤2 rows AND no
all-numeric column: 9 of 69 (13.0%)**; with **≤3 rows AND no all-numeric column: 18 of 69 (26.1%)**;
with **≤2 rows AND ≥4 sort controls: 4 of 69**. Rows-bucket × any-all-numeric-column, `n=69`:
**≤2 → 9 without / 1 with · 3 → 9 / 1 · 4–5 → 10 / 3 · 6–10 → 14 / 1 · >10 → 16 / 5.** ★ **Stated
because it is the inconvenient half of the same measurement:** the numeric columns are **not**
concentrated in the big tables — the smallest bucket has one and the largest has five, and the shape
§8-3 names as chrome-outweighing-content (small, no numeric column) is a real but **minority** shape in
this corpus.

★ **THE COUNT IS VALIDATED, NOT ASSERTED — three hand-counts, twelve discrimination arms, and a
population reconciliation.**
- **Hand-count agreement on shape** (not merely on table count), three for three:
  `tests/golden/fixtures/gfm-torture.md` → counter **r=2 c=3, one all-numeric column**; by eye the
  header is `Left | Center | Right`, the body is two rows, and `Right` holds `1` and `22`.
  `docs/trust/PERMISSIONS.md` table 1 (lines 38–48) → counter **r=9 c=5**, by eye five header cells and
  nine body rows. Table 2 (lines 102–116) → counter **r=13 c=3**, by eye three header cells and
  thirteen body rows.
- **Discrimination, measured rather than argued — twelve synthetic arms, and the numeric detector is
  shown firing in BOTH directions on the SAME r/c shape**, which is the control that matters: a 2×3
  table with a numeric third column reads `numAll=1`; **the identical table with that column's cells
  replaced by words reads `numAll=0`**. One numeric cell of two → `all=0 maj=0 any=1`; two of three →
  `all=0 maj=1 any=1` — **so the three aggregations are shown diverging rather than assumed to**. ★
  **The mirror is the SORT's numeric and not a bare `Number()`:** `1e5`, `0x10` and `Infinity` read
  `numAll=0`, while `  12  ` reads numeric (it trims) and `-3.5` / `.5` read numeric. An empty cell
  reads non-numeric. A **ragged short row** contributes `''` and is non-numeric (`cellTextAt`'s own
  `?? ''`). Column count comes from the **header** and row count from the **tbody** — a 1×4 table reads
  `r=1 c=4`. And the gate still discriminates: a pipe table **inside a fence** yields **no table**; a
  headerless raw-HTML `<table>` is **gated out**.
- **Population reconciliation:** the walk independently returned **69** enhance-able tables, matching
  5.2's 69 exactly — two separately written harnesses agreeing on the denominator.

★ **THE BIAS, STATED WITH THE NUMBERS RATHER THAN UNDER THEM (plan §4-7).** *THIS REPOSITORY's tables
are median 6 rows by 4 columns, 14.5% of them two rows or fewer, and 15.9%–18.8% of them carry a numeric
column, at `n=69` tables from `n=61` documents* — **and this repository is a specs-and-docs corpus
written by and for this project, which is a biased sample for a tool whose users are AI agents writing
arbitrary markdown.** These are spec-coverage matrices, permission tables and plan risk grids: **prose
grids, which is exactly why 58 of 69 carry no numeric column at all** — and an agent emitting a
benchmark table or a cost breakdown on someone else's machine is writing the *opposite* shape. ★ **The
numeric axis is the one §8-3 leans on hardest to decide whether a sort is worth its chrome, and it is
also the axis this corpus is most obviously unrepresentative on.** **The distribution above therefore
bounds nothing about the population Peekover serves** — it is a convenient sample, it is the only sample
this milestone funds, and it is reported as such. ★ **And the small cells are very small:** the whole
numeric half rests on **11–13 tables**, the six-numeric-column outlier is **one table**, and the
aggregation-sensitivity finding rests on **3**. A reader leaning on the numeric shape is leaning on
about a dozen tables from one repository.
★ **MEASURE-NOT-CHOOSE.** The full tails are printed beside every cumulative figure precisely so the
rolled-up readings cannot be the only ones; **the cumulative cut-points (≤2, ≤3, ≤4, ≤5) are reported
for every value, not for a preferred one**, and reporting them **is not proposing any of them**.
Nothing was rounded toward a convenient shape, no table was excluded, the four numeric definitions are
reported **disagreeing** rather than averaged, and the joint view is printed because the marginals
alone would have flattered the small-table case. **Reproducible without a committed script:** the
method above, re-run over `git ls-files '*.md'`, returns these numbers — and **this entry deliberately
adds no markdown table to `progress.md`**, so recording the measurement does not perturb the corpus it
measured (**re-run on the edited tree: `61` documents, `69` tables, identical histograms**).

**WHAT 5.3 DOES NOT DO:** ★ **no threshold asserted and NO CONSTANT SET ANYWHERE** — not a `MIN_ROWS`,
not a `shouldEnhance` predicate, no `src/` change of any kind; **the choice, INCLUDING the legitimate
always-on choice, is 5.5's** and its implementation is **5.6's**. **No axis reopened** — row count,
column count and numeric presence are the settled three, and nothing was added to them. No
reads-as-noise verdict (**6.1's walk**); no alteration of §3.6's per-table decision; no per-table-vs-
per-document choice (**5.5's**, from 5.2); no app-page bytes (**5.4**); no committed harness, no test
added, no dependency, no manifest permission. Red-first does not apply — 5.3 asserts no behaviour; the
rigor is in the count's validation above. Golden **EMPTY**; **007 import fence 8/8**; `permissions: []`
on both built manifests (654 / 770 B); `web_accessible_resources` **absent**; manifest test **2975 B**
(byte-unmodified); deps **5**. NUL **0 in both forms** — raw `0x00` byte and decoded `U+0000` — in both
edited files, with a control file carrying one reading **1 in both forms**.

★ **TASK 5.4 IS DONE — THE APP-PAGE BYTE DELTA IS DECOMPOSED TO A ZERO RESIDUAL AND THE PACKAGE IS
MEASURED UNDER BOTH BOUNDS. GROUP 5's INPUT SIDE IS COMPLETE.** Measurement only: **no `src/` change,
no committed script and no test added** (the body's Files list is `progress.md` + the report), and all
four artifacts are **byte- and md5-IDENTICAL to 5.3's** after a from-scratch rebuild of BOTH engines —
**app 399,646 B** (`7275a378…`), **CS 329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **background
3,548 B** (`5f53c0f5…`, both engines). Unit **944/944**; `pnpm lint` **EXIT=0**. **Nineteen arms**, each
a real rebuild of BOTH engines from a wiped `.output` (`pnpm build` is Chrome-only; Firefox needs
`-b firefox`). **The app chunk is byte- AND md5-identical across engines in every arm** — the engine
split lives in the CS and the manifest, never here.
★ **THE OBSERVED DELTA, AND THE MASTER CONTROL THAT MAKES IT MEAN SOMETHING.** App chunk **389,143 →
399,646 B = +10,503 B** (9.3 baseline `65486f78afa2fec0e9d00f7f0e9c0d27` at `94f7da5`). ★ **4.3's
strongest control re-fires on the app side:** with **all fourteen M8-touched `src/` files put back to
`94f7da5`** (nine reverted, five removed) the build returns to the 9.3 baseline **byte-for-byte AND
md5-for-md5 on all four artifacts** — app **389,143** / `65486f78…`, CS **318,747** / `c7b33b36…` /
`67717921…`, background **3,548**. So nothing outside M8 drifted and the whole +10,503 is M8's own code.
★ **THE ACCOUNT — EIGHT COMPONENTS, EACH ABLATION-MEASURED IN THIS RUN, SUMMING EXACTLY.**

| # | Component | B | Arm (app chunk with it OFF) |
|---|---|---|---|
| 1 | CSS — `readerCss.ts`, all M8 rules | **967** | 391,191 (`62b88b7e…`) |
| 2 | Badge — `agentBadge` + `agentFile`, incremental | **334** | 390,857 (`0c377697…`) |
| 3 | Compare/picker — `diffChrome` + D-3 pair, incremental | **1,707** | 389,150 (`be8b5eb5…`) |
| 4 | Identity seam — `docIdentity` + `appShell`'s register | **7** | 389,143 (`65486f78…`) |
| 5 | Enhancer's own orchestration | **759** | — (392,929 controls-off, less the glue) |
| 6 | The three controls | **6,717** | 392,929 (`0c40f5e4…`) |
| 7 | Glue, site 1 (`appShell`) | **6** | 399,640 (`96385913…`) |
| 8 | Glue, site 2 (`readerPane`) | **6** | 399,640 (`ee6447b4…`) |
| | **Σ** | **10,503** | **RESIDUAL ZERO** |

**967 + 334 + 1,707 + 7 + 759 + 6,717 + 6 + 6 = 10,503**, against an observed **10,503**.
★ **AND THE RESIDUAL IS NOT AN ARITHMETIC CLAIM — IT IS A BUILD STATE.** Rows 1–4 were taken as an
**incremental chain** from the sites-off arm (**392,158** / `998ebfd7…`), each cut stacked on the last;
its terminal arm — every component cut **individually** — emits `app-jgQlsln1.js` at **389,143** /
`65486f78…`, **md5-for-md5 and even chunk-hash-for-chunk-hash identical to the wholesale fourteen-file
master control**. Two independent routes to the same bytes is a closure no sum can fake. ★ **It also
settles a question by measurement rather than assumption:** the three content-script files
(`runReader`, `mountReader`, `contentWatch`) stood **at HEAD** throughout that chain and the app chunk
still landed on the baseline — so they contribute **0 B** to the app chunk, demonstrated, not argued.
★ **THE ENHANCER HALF, CROSS-CHECKED.** HEAD − sites-off = **7,488 B** (rows 5–8), and the controls-off
arm minus the sites-off arm is **771 B** = orchestration **759** + glue **6 + 6**. **The orchestration
is 759 B against the content script's 760** — the same D-7/D-8 walk, one byte apart across two chunks,
which is the name-pool grain and not a difference in what shipped.
★ **THE CONTROLS BLOCK DECOMPOSED FURTHER, AND THE BYTES THAT DO NOT ADD UP ARE NAMED RATHER THAN
ROUNDED.** Marginal from HEAD: sort **2,231** (397,415) · filter **2,003** (397,643) · copy **2,309**
(397,337) · filter+copy jointly **4,488** (395,158), so the `tableName` helper **shared by filter and
copy is 176 B** (4,488 − 2,003 − 2,309). **2,231 + 2,003 + 2,309 + 176 = 6,719 against a measured
6,717: −2 B**, deterministic, on both engines — the **minifier's name-pool non-linearity**, the M6
finding-1 caveat at 2-byte scale (4.3 met the same thing at **−1 B** on the CS). **It does not touch the
zero residual above**, because row 6 enters the account as the single ablation-measured **6,717**, never
as a sum of sub-marginals.
★ **THE SHARING IS DIFFERENT ON THIS SURFACE, AND MARGINAL ARMS WERE RUN TO SEE IT.** Rows 2–4 are
**incremental** figures, so jointly-held bytes fall to whichever component is cut **last**. Measured
**marginally** from the same enhancer-free arm (391,191): badge alone **334**, compare alone **1,647**
(389,544 / `34c6307c…`), **both together 2,041** — so **60 B leave only when BOTH go**, invisible to
either arm on its own. ★ **This is the *shared-helper-hides-from-marginal-arms* shape inverted:** on the
CS the joint drop was *less* than the marginals summed (a shared helper counted twice); here it is
**more** (2,041 > 334 + 1,647), because `getDocIdentity` is retained while *either* holder stands. Same
lesson, opposite sign. ★ **The identity seam says it plainly:** cut alone with badge and compare still
standing it costs **31 B** (391,160 / `5bee453d…`) — *exactly* 4.3's shared `docIdentity` figure — but
cut **last**, after both holders are gone, only **7 B** remain. Neither number is wrong and neither
alone is the whole story; the chain is what sums, the marginal is what finds the sharing.
★ **FOUR ARMS LANDED ON HISTORICALLY RECORDED md5s — CORROBORATION ACROSS SESSIONS, NOT WITHIN ONE.**
Beyond the master control's return to 9.3's four artifacts (twice, by two routes): the controls-off arm
reproduces **392,929** / `0c40f5e4…`, md5-for-md5 **task 3.4's**; copy-off reproduces **3.7's**
`4ee49a89…` (397,337); filter+copy-off reproduces **3.6's** `7e89141b…` (395,158). **An ablation that
lands on a build state the repo recorded months of tasks ago is a clean removal, demonstrated rather
than asserted.**
★ **NEVER A GREP (M6 finding 1).** No number above came from counting identifiers or source characters.
Every one is a **drop between two real builds of both engines from a wiped `.output`**, and every arm
carries a control that fires: the cut is asserted to have matched (a cut that changes nothing exits
nonzero — one did, mid-run, corrupting a neighbouring declaration; the guard caught it and the arm was
re-cut line-wise rather than reported), the build **succeeds** (19/19 arms, exit 0 on both engines), and
the removal reproduces either a recorded md5 or a complementary arm.
★ **(b) THE ZIP — UNDER THE BOUND ON BOTH ENGINES, AND THE BASELINE WAS RE-MEASURED RATHER THAN
TRUSTED.** `pnpm zip` / `pnpm zip -b firefox`: **Chrome 1,306,513 B** (baseline **1,300,383**, **+6,130**)
· **Firefox 1,306,571 B** (baseline **1,300,442**, **+6,129**). Against the **< 2,000,000 B per engine**
bound: **65.3 % used**, headroom **693,487 / 693,429 B** (down from the recorded 699,558). ★ **The
baselines are not quoted — they are reproduced:** zipping the **master-control tree** returns
**1,300,383 / 1,300,442** byte-for-byte, so every delta here is measured from a baseline this run
rebuilt. And the zip is **deterministic**: two identical HEAD runs returned identical byte counts, so
the +6,130 is signal and not archive jitter.
★ **(c) THE UNZIPPED PACKAGE — UNDER `≤5 MB`, AND ITS DELTA RECONCILES TO ZERO.** **Chrome 4,080,882 B**
(baseline **4,059,893**, **+20,989**) · **Firefox 4,080,998 B** (baseline **4,060,009**, **+20,989**),
104 files each; the master-control tree reproduces both baselines byte-for-byte. Against AGENTS.md's
**≤5 MB**: **81.6 % used**, headroom **919,118 / 919,002 B**. ★ **The whole package delta is the two
chunks and nothing else: 10,503 (app) + 10,486 (CS) = 20,989, exactly** — so no asset, no manifest and
no chunk outside those two moved a byte.
★ **(d) THE BACKGROUND SCRIPT — 3,548 B, DELTA `0`** against its **3,548 B** baseline, md5 `5f53c0f5…`,
identical on both engines. M8 never touched it and the number says so.
★ **`dependencies` IS EXACTLY FIVE, ASSERTED BY PARSING NOT BY EYE** — `Object.keys(pkg.dependencies)`
returns `["diff","dompurify","markdown-it","markdown-it-task-lists","mermaid"]`, **length 5** (§3.9, §5:
zero additions). **So every byte above is our own code**, which is what licenses decomposing the delta
as Peekover's rather than a library's.
★ **THE FIREFOX `-sources.zip` IS EXCLUDED FROM THE BOUND, AND THIS IS WHY IT IS NAMED HERE.** The
Firefox zip run also emits `peekover-0.0.0-sources.zip` at **4,633,623 B** — the **AMO review archive**
Mozilla's reviewers build from, **not the shippable package** (007 8.1's finding). It is **2.3× the
2 MB bound** and reporting it against that bound would be a **FALSE BREACH**. The shippable Firefox
package is the **1,306,571 B** figure above.
**WHAT 5.4 DOES NOT DO:** ★ **it MEASURES the package against the bounds; it does not RULE.** Both
bounds hold with 693 KB and 919 KB of headroom — **and "it fits" is a number, not a decision**. Whether
the content-script reach ships (§8-1), the filter's scope (§8-2), the threshold (§8-3) and the
presentation set (§8-4) are **5.5's**, taken by a human on 5.1–5.4's numbers and the walk. **No value
was chosen, nothing rounded toward a bound, no favourable arm preferred** — the four package figures are
whatever the tree built, and the two that grew are reported with the baseline they grew from. No `src/`
change, no committed harness, no test added, no dependency, no manifest permission.
★ **ONE SELF-INFLICTED CAVEAT, MEASURED RATHER THAN LEFT FOR 5.5 TO TRIP OVER.** 5.3 deliberately added
**no** markdown table to `progress.md` so that recording a measurement would not perturb the corpus it
measured; **this entry adds one** — the eight-component account above. A before/after count over the
same **61 tracked `.md` files** confirms the perturbation is exactly that and nothing more: **+1 table**
on the edited tree. (The absolute count from that check is **95 → 96**, not 5.2's 69, because the check
is a bare header+delimiter detector without 5.2's fence and header gating — **the delta is the
load-bearing figure here, not the absolute**.) So **5.2's `n=69` and 5.3's histograms were true at their
own commits and are now off by this one table**, in the direction of one more medium-sized
all-prose table. It changes no cut-point 5.5 would read, and it is stated rather than left implicit.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` **absent**; manifest test **2975 B** (byte-unmodified); deps **5**. Ablations
by **cp-aside + restore, never `git checkout`**, with all fourteen files md5-verified back to HEAD after
every arm. NUL **0 in both forms** — raw `0x00` byte and decoded `U+0000` — in both edited files, with a
control file carrying one reading **1 in both forms**.

★ **TASK 5.5 IS DONE — THE DECISION GATE. THE FOUR §8 RULINGS ARE RECORDED IN `decisions.md`, EACH WITH
THE MEASUREMENT THAT JUSTIFIES IT, BEFORE ANY VALUE-SETTING CODE.** A record only: no `src/` change, no
constant set, no removal executed — full text: `decisions.md` (2026-08-13 · M8 TASK 5.5). **§8-1
SHIPS** — the gate holds on every measured axis (5.1's **+8.9 / +11.1 ms** inside the **26.9 / 29.9 ms**
headroom; 4.3's **+10,486 B** zero-residual; 5.4's **693 KB / 919 KB** package headroom; 4.2's `file://`
copy) — **recorded in 5.7's terms as a RE-CONFIRMATION: the reach stays, nothing removed**; the
app-page-first-paint-uninstrumented caveat (D-11 (iii)) carried so the ruling does not over-claim.
**§8-2 DEFERS to 6.1** — 5.2's distribution (none 45 / one 2 / several 14, n=61, a stated-biased sample)
informs but does not settle the per-table-vs-per-document question; §3.6's per-table decision stands
provisionally. **§8-3 IS ALWAYS-ON, CHOSEN** — no threshold, no constant, so **5.6 sets nothing** for
this axis: the chrome-outweighing shape is a **13% minority** (9 of 69, task 5.3), the tooling cost is
low, and a threshold would rest on the corpus's least-representative axis (11–13 of 69 numeric). **§8-4
DEFERS to 6.1** — the presentation set is the walk's, no measurement bears on it. **No re-scope**: ship,
defer, always-on, defer — the reach ships intact. Bundles byte- and md5-IDENTICAL to 5.4's, unchanged
because no `src/` file was touched — **CS 329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **app
399,646 B** (`7275a378…`), **background 3,548 B**. Golden **EMPTY**; **007 import fence 8/8**;
`permissions: []` both engines; manifest test **2975 B**; deps **5**. NUL **0 in both forms** in all
three edited files (`decisions.md`, `tasks.md`, `progress.md`), with a control file reading **1 in both
forms**.

★ **TASK 5.6 IS DONE — THE CHOSEN VALUES ARE A RECORDED NO-OP.** From 5.5: **§8-3 is ALWAYS-ON**, which
is the CURRENT shipped behaviour — there is no threshold constant to set, so 5.6's §8-3 half lands **no
`src/` change**, recorded here as a deliberate no-op rather than left silent (the reason: always-on was
already the shipped code, 5.5 only made it a CHOSEN state rather than an unjustified default). **§8-2 and
§8-4 are DEFERRED to 6.1** — 5.5 recorded that deferral as a finding, so those two axes have no value for
5.6 to set until the walk returns one; 5.6 waits rather than inventing one. **The stale-marker grep came
back clean**: `tableTools.ts:58-61` and `:393-395` already read *"MEASURED at 5.1-5.4 and CHOSEN by a
human at 5.5"* — true today, not a "PROPOSED" or "TBD" left behind from before the gate — so no comment
needed converting; `readerCss.ts:1033`'s "NO DISCRETE THRESHOLD" is the TOC-width surplus calc, unrelated
to §8-3, and was left alone. **The ALGORITHM does not move**: no behaviour change, no `src/` file touched,
bundles stay byte- and md5-IDENTICAL to 5.5's — **CS 329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **app
399,646 B** (`7275a378…`), **background 3,548 B**, trivially so since nothing in `src/` was edited.
★ **§8-1's give-way is NOT 5.6's — it is 5.7's**, and since 5.5 ruled the reach IN, 5.7 lands nothing but
a recorded no-op with 5.5's number. Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` both
engines; manifest test **2975 B**; deps **5**. NUL **0 in both forms** in both edited files (`progress.md`,
`tasks.md`), with a control file reading **1 in both forms**.

★ **TASK 5.7 IS DONE — THE §8-1 GIVE-WAY, CONDITIONAL, TAKEN AS A RECORDED NO-OP.** 5.5 ruled the
content-script reach **IN**, so per the task's own conditional (*"if 5.5 ruled it IN, this task lands
nothing and is RECORDED as a no-op with 5.5's number — a skipped task with a stated reason, never a
silently absent one"*), 5.7 executes nothing on the reach: **D-6's sites 3 and 4 stay** exactly as 4.1
built them (`mountReader.ts`'s `enhanceTables(host)`, `contentWatch.ts`'s `render` closure) — no `src/`
change. The give-way's removal-plus-re-measurement branch (a)–(e) is the branch **NOT taken**, named here
for completeness: it is what 5.7 would have executed had 5.5 ruled the reach OUT. Bundles are
byte- and md5-IDENTICAL to 5.6's, trivially so since nothing in `src/` was touched — **CS 329,233 B**
(Cr `b115c9ae…` / Fx `237831d2…`), **app 399,646 B** (`7275a378…`), **background 3,548 B**. Golden
**EMPTY**; **007 import fence 8/8**; `permissions: []` both engines; manifest test **2975 B**; deps **5**.
★ **GROUP 5 (measure → decide → implement → execute) IS COMPLETE.**

★ **TASK 6.1 IS DONE — THE MILESTONE-CLOSE HUMAN GATE. THE HUMAN WALKED REAL CHROMIUM AND REAL FIREFOX
WITH THE EXTENSION LOADED, ON `plan.md` (A FIVE-TABLE DOCUMENT), AND THE WALK PASSED CLEAN — TWO
COSMETIC FINDINGS FLAGGED FORWARD, NOTHING STOP-THE-MILESTONE.** A DOC-ONLY record: no `src/` change
(the human ruled record-not-fix), no test added. Full text of the two resolved deferrals:
`decisions.md` (2026-08-13 · M8 TASK 6.1).
**THE MECHANICAL HALF, VERIFIED:** the flow — badge, table, sort/filter/copy controls — RENDERS on both
engines, Chromium and Firefox showing the SAME render, side-by-side. **FIREFOX PARITY: PASS** —
identical to Chromium, and this is the ONLY Firefox evidence this milestone has (no Firefox automation
exists); the human's eyes are the instrument. **ZERO UNEXPECTED NETWORK / LOCAL-ONLY: CONFIRMED** — the
app page's "Zero network by default" line holds, and the Stored-data panel shows every on-device item
(remembered folders, recent files, pins, watch snapshots, diagram cache) staying on-device, never
uploaded. **A KNOWN FIREFOX LIMITATION, CONFIRMED-KNOWN, NOT A NEW DEFECT:** watching is unavailable for
files opened from the file manager in Firefox — already-documented behaviour
(`watchContentWiring.browser.test.ts`'s "cannot serve file://" note); the walk saw it, and it is a
platform limitation, not a Peekover defect. **COMPARE/DIFF: NOT RE-VERIFIED THIS WALK** — the human
could not locate the trigger this session and recalls it working in a prior session; recorded HONESTLY
as a gap, neither "works" nor "broken." (2.x's compare tests plus `diffChrome.browser.test.ts` /
`diffRegistry.browser.test.ts` stand as its other, standing evidence, supplementing this walk's gap.)
**THE JUDGEMENT HALF, RESOLVING 5.5's TWO DEFERRALS** (full text: `decisions.md` 2026-08-13 · M8 TASK
6.1): **§8-2 — PER-TABLE STANDS, AFFIRMED.** Walked at plan.md's five tables (five filter boxes): the
repetition did not read as noise, the table "looks good" — the walk's concern was the controls'
STYLING, not their per-table SCOPE. §3.6's decision is CONFIRMED, not altered. **§8-4 — THE SET IS
RIGHT; TWO PRESENTATION FINDINGS FILED, NOT FIXED** (the human ruled record-not-fix): **(1) the badge
lane** — works, positioned okay, but reads better GROUPED with the other pills than alone at
`top:56;left:16`; **(2) the toolbar controls ship UNSTYLED** — Filter, Clear, Copy CSV, Copy Markdown
render as default browser form elements, never integrated with the reader's design language (the
styling debt 3.3 carried by name, confirmed by 3.6/3.7/3.8's Files lists never touching
`readerCss.ts`). Both FILED in § Carried items below, traceable to this walk, flagged forward for a
future styling pass — no `src/` change here.
★ **THE POINTER WALK RAN AS ITS OWN STEP, BEFORE THIS COMMIT (finding 3's mechanism):** § Now, § Up next
and § Blockers greped for `is next`, `at the gate`, `waiting on`, `this commit`, `← NEXT` and the
running gate score — the only stale assertion found was this section's own "TASK 6.1 IS NEXT" line,
corrected by this edit; § Up next and § Blockers carry no live M8 pointer (M8's narrative lives entirely
in § Now).
Bundles are byte- and md5-IDENTICAL to 5.7's, trivially so since nothing in `src/` was touched — **CS
329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **app 399,646 B** (`7275a378…`), **background 3,548 B**.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` both engines; manifest test **2975 B**;
deps **5**.
★ **TASK 6.2 IS DONE — THE RETRO, RUN IN A FRESH SESSION VIA `/retro`, INTERVIEWED RATHER THAN WRITTEN
SOLO.** ★ **THE KICKOFF FOR THIS TASK SAID "SOLO WRITE-UP"; THE BODY SAID "RUN `/retro`" — AN INTERVIEW —
AND THE BODY WON**, the third time this milestone a kickoff over-specified against the tasks-file body (3.9,
5.7, now 6.2), each caught and each flagged in the entry itself. Full text: `docs/ai/retro.md` (2026-08-13 ·
M8 close), five numbered findings plus a Metrics line, appended newest-first, matching M7's form. **THE
FLOOR-DELTA STATEMENT, REQUIRED BEFORE ANY RE-BASELINE DISCUSSION (finding 8):** M8's shipped first-paint
floor reads **145.7 / 143.4 / 145.2 ms** against the standing **135.1 / 132.6 / 134.7 ms** (2026-08-03,
`757f953`) — a delta of **roughly +10.5 to +10.8 ms**, which is 5.1's own measured reach price
(+8.9 ms median / +11.1 ms floor against the 26.9 / 29.9 ms headroom) landing where it was priced. **No
re-baseline is proposed** — the moved floor still fits the budget 5.5 shipped against. **THE BYTE-DISCIPLINE
QUESTION THE BODY ALSO POSED:** decomposition-to-zero-residual held under M8's first deliberately non-zero
delta — CS +10,486 B (4.3) and app +10,503 B (5.4), each independently decomposed to a measured zero
residual and reconciling a third way through the package total (20,989 B = 10,503 + 10,486 exactly) — with
the one honest wrinkle (5.4's −2 B minifier name-pool non-linearity) named, not smoothed. Two concrete
`AGENTS.md` lines were drafted for human review (not committed by this task, per the retro ritual's own
rule that the human rewrites and commits language changes themselves): naming "kickoff is a hypothesis, the
tasks-file body is authority" as a standing rule rather than per-kickoff text, and naming that a human-gate
item requiring a loaded browser extension has no agent substitute. Docs-only: no `src/`, test, `scripts/` or
spec file touched. Bundles byte- and md5-IDENTICAL to 6.1's, trivially so — **CS 329,233 B** (Cr
`b115c9ae…` / Fx `237831d2…`), **app 399,646 B** (`7275a378…`), **background 3,548 B**. Golden **EMPTY**;
**007 import fence 8/8**; `permissions: []` both engines; manifest test **2975 B**; deps **5**.
★ **TASK 6.3 IS DONE — THE RECORDS RECONCILE, AND M8 IS CLOSED.** Doc-only: `docs/ai/progress.md` ·
`docs/ai/spec-coverage.md`; **`docs/ai/decisions.md` is READ AND LEFT UNTOUCHED** — no genuine new
decision lands here (D-11 (iii)'s trigger is *confirmed*, not decided; it was already decided at gate
2). `git diff --name-only` for this commit: `docs/ai/progress.md` · `docs/ai/spec-coverage.md` ·
`specs/008-persona-1-qol/tasks.md` (the checkbox only) — nothing else.

**★ THE D-VALUE AUDIT — EVERY M8 `decisions.md` ENTRY CHECKED AGAINST ITS OWN CONVENTION** (`tasks.md`
line 55-57: *"landing with the commit that implements it, never after"*, plan §0's own rule, verbatim
text pre-written per D-value). **D-1, D-2 — COMPLIANT.** Both entries (`decisions.md` 2026-08-04) land
in `868a6d8` (task 1.4), the same commit that wires the two registration sites — text and code in one
commit, exactly as the convention asks. **D-3, D-4, D-5 — PRESENT BUT LATE, AND ALREADY SELF-DISCLOSED.**
Their entries (`decisions.md` 2026-08-05) land in `174dcd6`, one commit **after** group 2 closed — the
entry's own text says so (*"LANDED AT A RECONCILE... NOT WITH ITS IMPLEMENTING COMMIT"*). Nothing new to
record; the gap was named where it happened. **D-6 THROUGH D-12 — NO INDIVIDUAL ENTRY EVER LANDED, AND
THIS IS A REAL GAP, NAMED HERE FOR THE FIRST TIME.** `plan.md` §0 pre-writes verbatim `decisions.md`
entry text for every one of D-6 through D-12 (each a `` `decisions.md` entry: "008 D-N — ..."` `` line,
the same shape D-1/D-2/D-3/D-4/D-5 used), meant to land with its implementing commit. **None of the
seven ever did.** The only place any of them appears in `decisions.md` is the **pre-implementation**
2026-08-03 M8 GATE 2 entry (`2c29821`) — D-1 and D-6 get individual "CONFIRMED" write-ups there (the two
architectural calls), D-2/3/4/5/7/8/9/10/11/12 get one shared clause, *"THE OTHER D-VALUES — APPROVED AS
DRAFTED"* — and that entry **predates every group-3/4/5 implementing commit by weeks**, so it cannot by
construction be "landing with the commit that implements it." **This audit does NOT backfill the seven
missing entries** — `decisions.md` is read and left untouched per this task's own Files-list condition
(*"only if a genuine decision landed"*), and no new decision is landing; gate 2 already decided all
twelve. Filing the missing text would be closing the gap the way `174dcd6` closed D-3/4/5's, and that
is a **decision about ledger hygiene**, not a records reconcile — it is named here so whoever next
touches `decisions.md` can land D-6…D-12's pre-written text with a real commit, the way the convention
asks.

**★ D-11 (iii)'s TRIGGER — CONFIRMED, NOT REPLACED (plan §8 Q4).** The trigger stands exactly as gate 2
already ruled it (`decisions.md` 2026-08-03 M8 GATE 2, Q4): *the next milestone that puts work on the
app-page render path whose cheapness cannot be argued mechanically — anything that parses, sanitizes,
reads layout, or runs an engine there — funds the app-page first-paint harness before it ships that
work.* **The carried hole itself is `specs/007-mermaid-diagrams/plan.md` §4-5 (the "nothing else will
notice" claim), now TWO milestones old (007, 008), and it is recorded as still open.** No code depends
on it; M8 did not fund it (per-item mechanical cheapness + the three-arm conditionality guard stood in,
D-11 (i)/(ii)); the next planner who puts non-mechanically-cheap work on the app page inherits a
CONDITION, not a memory.

**★ `docs/trust/PERMISSIONS.md` WAS NOT EDITED BY M8.** Last touched `a3005db` (2026-07-30, M7 task
4.3) — no commit since has touched it; no capability row added, nothing new stored, no permission
spent. Confirmed by `git log --oneline -- docs/trust/PERMISSIONS.md`.

**★ THE PLACEMENT-TENSION — SETTLED, FOLLOWING THE 9.1→9.3 PRECEDENT EXACTLY.** § Carried items named
the call at 6.1: whether the badge-lane and unstyled-toolbar findings get their own `tasks.md`
checkbox, or stay carried-items-only. **The call: carried-items-only, no new checkbox.** `tasks.md`
PASSED gate 3 and is gate-sealed by the same D-10 (b) precedent 9.1's findings were filed under; 9.1's
own "a task added below this line" wording was never once used by M7 (both its findings landed in §
Carried items, fixed in their own sessions) — the governing convention, three instances deep now
(D-10 (b), 9.1's two findings, and this one), is that a gate finding is filed in `progress.md` § Carried
items. See § Carried items' new discharge entry below.

**★ TWO CARRIED-BUT-NEVER-FILED ITEMS, FOUND BY RE-READING M8's OWN NARRATIVE RATHER THAN TAKEN FROM A
ROUTED LIST** (the 9.3 method — re-derive rather than only fix what was named). Task 4.1 named a stale
comment "outside this task's file list... belongs to whichever task next touches that file"
(`runReader.ts:140`) and task 3.8 named a cross-file consent leak "outside 3.8's fence" — **neither ever
reached § Carried items.** Both are filed there now, verbatim to what their originating task recorded.

**★ § BASELINES — RE-DERIVED FROM A CLEAN BUILD, BOTH ENGINES, THE 9.3 METHOD.** `.output` cleared,
rebuilt from scratch, zipped, both suites re-run at HEAD `bdcb2ad`. **Every artifact row matches what
6.1/6.2 already carried, confirming nothing drifted across two doc-only commits:** content script
**329,233 B** both engines (md5 Cr `b115c9ae81acf3a834b2834354b4c23a` / Fx
`237831d2332acc1efb2305a238c4264b`), app chunk **399,646 B** both (md5 `7275a378653d9b5e5021235f045bd902`),
background **3,548 B** both (md5 `5f53c0f53c729e0a82fb1a4ce1361e22`), built manifests **654 / 770 B**,
`permissions: []` and no `web_accessible_resources` on both. **New this reconcile:** `pnpm zip` **1,306,513
/ 1,306,571 B** (Cr/Fx), packed unzipped **4,080,882 / 4,080,998 B**. Unit **944/944** (56 files); browser
**1,251 passed | 15 skipped, 118 files, 0 failed**. **First-paint rows: NOT re-run at 6.3, stated plainly
why** — 5.1's quiesced A-B-A protocol already measured the current, byte-identical build within this same
implementation window (no `src/` commit lands between 5.1 and 6.3), and a second un-quiesced run risks
printing noise over a number that is already trustworthy; 5.1's reading (149.7/146.3 ms median, 145.7/143.4
ms floor, worst-arm headroom 26.9/29.9 ms against the standing budget) stands as the current pin. **The
diagram-bearing (51.7 KB) and 1 MB/TOC rows are STILL not re-run — now three milestones' distance from
their last measurement (007 8.1, `4c580c4`, 2026-07-31) — named rather than left to imply currency.** Full
table: § Baselines below.

**★ M8 IS CLOSED.** All 35 tasks across six groups, six D-values' architectural calls confirmed at gate
2, four §8-N measure-then-choose items resolved (§8-1 shipped, §8-2 per-table affirmed, §8-3 always-on
chosen, §8-4's set confirmed with two presentation findings carried), zero stop-the-milestone defects at
the 6.1 gate. **NEXT: nothing within M8 — the next act is the next milestone's scoping**, per the
roadmap below. Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` both engines; manifest test
**2975 B**; deps **5**. See § Closed milestones for the close record.

★ **TASK 5.1 IS DONE — §8-1 (b) + (c) ARE MEASURED. THE CONTENT-SCRIPT REACH COSTS `+8.9 ms` ON THE
MEDIAN AND `+11.1 ms` ON THE FLOOR AT FIRST PAINT, AGAINST A `26.9 / 29.9 ms` BUDGET — SO IT FITS, AND
THAT IS A PRICE, NOT A RULING.** Measurement only: **no `src/` change and no harness committed** (the
body's Files list is `progress.md` + the report), and both bundles are **byte- and md5-IDENTICAL to
4.3's** after a from-scratch rebuild of BOTH engines — **CS 329,233 B** (Cr `b115c9ae…` / Fx
`237831d2…`), **app 399,646 B** (`7275a378…`). Unit **944/944**; `pnpm lint` **EXIT=0**. Quiesced: CPU
**2%** at the start of the block, no build, no suite and no other heavy process running during any arm —
**every arm loaded a PRE-BUILT extension directory**, so not one build ran inside the measurement window
(the flake family here is MACHINE, and a build between arms is the contention that produces it).
★ **WHETHER THE REACH SHIPS IS 5.5's, AND NOTHING BELOW DECIDES IT.** 5.1 produces numbers. The rule is
already set and the value is not: *if the gate cannot hold, the surface REACH gives way, not the gate*
(§8-1's escape hatch, gate-1 §9-4) — and 5.7 executes that only if 5.5 rules it out.

★ **THE INSTRUMENT — A-B-A ON ONE DOCUMENT AT A TIME, WITH THE REACH ABLATED IN THE MIDDLE ARM.** `A` =
HEAD's build; `B` = the same tree with **D-6's sites 3 and 4 and their two imports removed** (cp-aside +
restore, never `git checkout`), rebuilt to **321,747 B**; `A` again. Six arms, run back to back in one
contiguous block, **seven iterations each with run 1 (cold) discarded** — 8.1's own protocol, the same
in-page double-rAF instrumentation `scripts/perf-first-paint.ts` carries, on the same
`buildHugeDoc`-derived fixture (the generator file was **md5-copied**, `418aeb77…`, not retyped).
- ★ **THE RUNTIME FIRING CONTROL — THE TWO ARMS ARE OBSERVABLY DIFFERENT, IN THE PAGE, ON EVERY RUN.**
  On the gated document every HEAD run reports **62 tables / 62 toolbars** in the shadow root and every
  ablated run reports **62 tables / 0 toolbars**. A timing delta between two arms nothing could tell
  apart measures nothing; this one is separated by the very thing being priced, read out of the live DOM
  rather than inferred from the bundle.
- ★ **AND THE ABLATION IS CONSERVATIVE, WHICH IS STATED RATHER THAN LEFT TO LOOK EXACT.** 321,747 B sits
  **34 B ABOVE 4.3's fuller sites-off arm (321,713 B)**: this ablation cuts the two call sites and their
  imports and **leaves `contentWatch`'s now-vestigial `renderWithTables` wrapper standing**. So arm `B`
  retains 34 B of glue and, if anything, **under**-states the price. 4.3's account is not reopened —
  separate marginal ablations are known not to sum to a joint one, and this is that, named.

★ **(b) THE GATED 50.4 KB FIXTURE — `51,564 B`, 62 sections, 62 GFM tables** (`huge.md`, sha256
`0b4719b7e9361ddb`; identical bytes in all three arms, which is why the arms are comparable at all).

| arm | build | median | floor | max |
|---|---|---|---|---|
| **A1** | HEAD (reach IN) | **149.7 ms** | **145.7 ms** | 163.6 |
| **B** | reach ABLATED | **139.1 ms** | **133.5 ms** | 144.7 |
| **A2** | HEAD (reach IN) | **146.3 ms** | **143.4 ms** | 156.3 |

- ★ **A AGREES WITH A: `3.4 ms` on the median, `2.3 ms` on the floor** — against 8.1's **13.4 ms** floor
  disagreement, whose verdict was *negative* precisely because it was larger than any delta it was asked
  to adjudicate. Here the delta is **2.6× the median disagreement and 4.8× the floor disagreement**, so
  the machine did not move more than the thing measured and the reading stands.
- **THE PRICE: `+8.9 ms` median, `+11.1 ms` floor** (A-mean − B). ★ **It survives either A taken alone:**
  against A2 it is **+7.2 / +9.9 ms**, against A1 **+10.6 / +12.2 ms** — a spread of 3.4 / 2.3 ms that is
  the disagreement itself, and the **lowest** bound in that range is still above it. The sign and the
  magnitude do not depend on which control arm is picked.
- **AGAINST THE BUDGET — the STANDING worst-arm headroom `26.9 ms` median / `29.9 ms` floor, an INPUT,
  NOT re-measured** (2026-08-03 at `757f953`; § Baselines): the price consumes **33.1% of the median
  headroom and 37.1% of the floor headroom**; on the worst-arm reading, **39.4% / 40.8%**. **It fits, on
  every one of the four readings, with the widest consumption 40.8%.**
- **THE ABSOLUTE NUMBER, for whoever wants it beside the delta:** HEAD's gated first paint is **149.7 /
  146.3 ms median** and **145.7 / 143.4 ms floor** against the **<165 ms typical-doc gate** — PASS, with
  **15.3 ms** left on the worst median arm and **19.3 ms** on the worst floor arm.

★ **THE MEDIAN DRIFTED INSIDE THIS SESSION AND THE FLOOR DID NOT — FINDING 7's PREMISE, DEMONSTRATED
LIVE, AND IT IS REPORTED BECAUSE IT CUTS AGAINST THE COMFORTABLE READING.** A seventh reading was taken
after the block with the **shipped** harness at HEAD (`pnpm perf -- --size 50kb`, same 50.4 KB / 62
sections): **median 155.4 ms, floor 145.2 ms** — PASS. Its **floor sits 0.5 ms from A1's 145.7**; its
**median sits 5.7 ms above the worst interleaved A median**. ★ **Read honestly, that is a warning about
the median, not a fourth A arm:** it was not interleaved and cannot void the A-B-A, but had it been an A
arm the median disagreement would have been **9.1 ms — larger than the 8.9 ms median price**, and the
median half of this measurement would have been void. **The floor half would have survived unchanged
(0.5 ms).** So the load-bearing statistic here is the **FLOOR**, and the median is reported beside it
rather than instead of it.

★ **(c) THE FREE CASE — NO TABLE AND NO RECOGNIZED NAME — AND THE HONEST ANSWER IS THAT THIS INSTRUMENT
CANNOT RESOLVE ITS COST.** Same generator with **every table line removed** and the section count raised
so the byte length matches: **51,670 B**, 76 sections, **0 tables / 0 toolbars in every run of every
arm**, written as `plain.md` — **not in `AGENT_FILE_NAMES`** (`CLAUDE.md` · `AGENTS.md` · `spec.md` ·
`plan.md` · `tasks.md`), so neither the enhancer nor the badge has anything to do.

| arm | build | median | floor |
|---|---|---|---|
| **A1** | HEAD (reach IN) | 127.3 ms | 124.3 ms |
| **B** | reach ABLATED | 125.6 ms | 122.5 ms |
| **A2** | HEAD (reach IN) | 130.5 ms | 127.2 ms |

- **A-vs-A: `3.2 ms` median, `2.9 ms` floor. The delta: `+3.3 ms` median, `+3.3 ms` floor — `1.0×` and
  `1.1×` the disagreement.** Against A1 alone the delta is **+1.7 ms**; against A2 alone, **+4.9 ms**.
- ★ **SO THE STATEMENT IS "NOT MEASURABLE HERE", NOT "ZERO".** The free-case delta is the same size as
  the instrument's own drift, and which side of the noise it lands on **depends on which control arm you
  pick** — the disqualifying property. What this arm establishes is a **BOUND: the free case costs at
  most ~3.3 ms at first paint, and this harness cannot distinguish it from machine state.** It is not
  rounded to zero to make the sentence tidier. The gated document's delta, measured by the same six-arm
  block on the same afternoon, resolves at 2.6–4.8× its disagreement; this one does not resolve at all,
  and the contrast is the evidence that the harness has real resolution and simply ran out of it here.
- ★ **REPORTED BESIDE 3.10 / 4.2's STRUCTURAL RESULT — TWO INSTRUMENTS ON ONE CLAIM, NEITHER
  SUBSTITUTING FOR THE OTHER.** `tableCost.browser.test.ts`'s content-script arms prove **arm 1 == arm 2
  to the NODE and to the LISTENER** on a document with nothing to enhance, with arm 3 moving the same
  instrument as the positive control. That is a **structural** zero and it is exact. This is a **timed**
  bound and it is not. A build can add no node and still spend time — a walk that finds nothing still
  walks — so the structural equality does not imply the timed one, and a ~3.3 ms noise-floor bound does
  not weaken a node-exact equality. **Together they say: nothing is built, and nothing measurable is
  spent. Neither says it alone.**

★ **MEASURE-NOT-CHOOSE.** Every number above is what the machine printed. Nothing was re-run to get a
friendlier arm, nothing rounded toward the budget, no measurement selected over another — the seventh
reading is reported **precisely because** it is the inconvenient one, and the free case is reported as
unresolved rather than as the zero the structural guard would have licensed rhetorically.
★ **CARRIED UNFIXED AND RESTATED SO IT IS NOT READ AS A BREACH:** `scripts/perf-first-paint.ts` prints a
**false `FAIL`** on the 1 MB fixture. The mechanism, so the next reader can see it is a printing artifact
rather than a budget failure: `:381` already labels that fixture **`large-doc (informational vs
typical-doc gate)`**, but `:376`'s `pass = median(aVals) < GATE_MS` is computed **unconditionally**, so
the verdict line judges the 1 MB doc against the **typical-doc** 165 ms bar it has just said does not
apply to it. **Not fixed here** — 5.1's Files list is `progress.md`, and a `scripts/` edit is outside it.
**WHAT 5.1 DOES NOT DO:** **no ship/no-ship ruling on the reach — that is 5.5's**, the human gate;
**no removal of D-6's sites 3 and 4 — that is 5.7's**, and only if 5.5 rules the reach OUT; no §8-2
distribution (**5.2**), no §8-3 threshold (**5.3**), no app-page bytes (**5.4**); no walk judgement
(**6.1**); **no `src/` change, no committed harness, no test added** (the ablation was cp-aside +
restore, and **the restoration is proven, not assumed**: the tree is clean and the rebuilt bundles return
to `b115c9ae…` / `237831d2…` / `7275a378…`); no dependency; no manifest permission. ★ **The app-page
half of §8-1 remains uninstrumented and is NOT silently covered by these numbers** — D-11 (iii)'s carried
hole and its named trigger stand exactly as they did.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
`web_accessible_resources` **absent**; manifest test **2975 B** (byte-unmodified); deps **5**. NUL **0 in
both forms** — raw `0x00` byte and decoded `U+0000` — across all **285 tracked text sources**, with a
control file carrying one reading **1 in both forms** (the four `.woff2` fonts are binary and excluded by
extension, which is why the scan is reported with its scope).
**TASK 5.2 WAS NEXT AND IS NOW DONE** — its record is above; the live pointer is 5.3.

★ **TASK 4.3 IS DONE — THE M8 CONTENT-SCRIPT BYTE DELTA IS DECOMPOSED TO A ZERO RESIDUAL, EVERY BYTE
NAMED, AND GROUP 4 IS COMPLETE.** Measurement only: **no `src/` change and no test added** (the body's Files
list is `progress.md` + the report), and both bundles are **byte- and md5-IDENTICAL to 4.2's** after a
from-scratch rebuild of BOTH engines — **CS 329,233 B** (Cr `b115c9ae…` / Fx `237831d2…`), **app 399,646 B**
(`7275a378…`). Unit **944/944**; `pnpm lint` **EXIT=0**. **Sixteen arms**, each a real rebuild of BOTH
engines from a wiped `.output` (`pnpm build` is Chrome-only; Firefox needs `-b firefox`). **The CS is
byte-identical across engines in every arm**, as it has been all milestone.
★ **THE OBSERVED DELTA, AND THE MASTER CONTROL THAT MAKES IT MEAN SOMETHING.** Content script
**318,747 → 329,233 B = +10,486 B**; app chunk **389,143 → 399,646 B = +10,503 B**. ★ **The strongest
control this milestone has run FIRES:** with **all fourteen M8-touched `src/` files put back to `94f7da5`**
(nine reverted, five removed) the build returns to the 9.3 baseline **byte-for-byte AND md5-for-md5 on all
four artifacts** — CS **318,747** / `c7b33b36…` / `67717921…`, app **389,143** / `65486f78…`. So the
toolchain still reproduces the baseline exactly, **nothing outside M8 drifted**, and the whole +10,486 is
M8's own code rather than a number with an unexamined floor under it.
★ **THE ACCOUNT — EIGHT COMPONENTS, EACH ABLATION-MEASURED IN THIS RUN, SUMMING EXACTLY.**

| # | Component | B | Ablation (CS bytes with it OFF) |
|---|---|---|---|
| 1 | CSS — `readerCss.ts`, all M8 rules | **967** | 328,266 |
| 2 | Badge code, exclusive | **518** | 328,715 |
| 3 | Compare/picker code, exclusive | **1,450** | 327,783 |
| 4 | `docIdentity` — **SHARED** badge ∩ compare | **31** | 327,234 (both off) |
| 5 | Enhancer's own orchestration | **760** | — (322,519 controls-off, less the glue) |
| 6 | The three controls | **6,714** | 322,519 |
| 7 | Glue, site 3 (`mountReader`) | **6** | 329,227 |
| 8 | Glue, site 4 (`contentWatch`) | **40** | 329,193 |
| | **Σ** | **10,486** | **RESIDUAL ZERO** |

**967 + 518 + 1,450 + 31 + 760 + 6,714 + 6 + 40 = 10,486**, against an observed **10,486**. The banked
per-task sub-arms reconcile inside each row: CSS **967 = 413** (1.3's badge block) **+ 205** (2.4's status
lane) **+ 243** (3.3's two rules) **+ 106** (3.3's pointer comment); compare **1,450 = 887** (2.3) **+ 147**
(2.4) **+ 416** (2.5); and rows 1–4 sum to **2,966**, which is exactly the pre-4.1 accumulated delta
(321,713 − 318,747) — the account closes at the milestone's own intermediate waypoint as well as at its end.
★ **4.1's BRACKET IS RESOLVED TO AN EXACT SPLIT.** The **7,474 B** shared payload is **760 B of enhancer
orchestration + 6,714 B of controls**. 4.1 could only bracket it (controls **≥ 4,440**, orchestration
**≤ 3,034**) because its fifth arm **stubbed** the installers and the stubs still shipped; this run removes
them **cleanly** — the import, the three calls, the three `undo*` declarations and their three unwind calls
— so `tableTools.ts` leaves the graph and nothing stands in for it. Both bracket bounds hold
(6,714 ≥ 4,440 ✓, 760 ≤ 3,034 ✓). ★ **The orchestration is 760 B and that is the whole D-7/D-8 walk** — the
column query, the header gate, the toolbar host, the per-table try and the total outer boundary — **10.2 %**
of the payload it carries.
★ **THE CONTROLS BLOCK DECOMPOSED FURTHER, AND THE ONE BYTE THAT DOES NOT ADD UP IS NAMED RATHER THAN
ROUNDED.** All seven non-empty subsets measured: sort **2,229** · filter **2,001** · copy **2,307** · the
`tableName` helper **shared by filter + copy, 178 B**. ★ **The two sort-bearing pairs are EXACTLY additive**
(sort+filter off = **4,230** = 2,229 + 2,001; sort+copy off = **4,536** = 2,229 + 2,307), so the sharing is
real and localized rather than a smear. But **2,229 + 2,001 + 2,307 + 178 = 6,715 against a measured 6,714**:
**−1 B**, deterministic, on **both** engines, and appearing **only** in the arm where `tableTools.ts` leaves
the graph entirely. It is the **minifier's name-pool non-linearity** — one fewer top-level name shifts the
mangler's allocation — and it is *the* M6-finding-1 caveat (*minification breaks the source-char ↔
shipped-byte relationship*) showing up at 1-byte scale. **It does not touch the zero residual above**,
because row 6 enters the account as the single ablation-measured **6,714**, never as a sum of sub-marginals.
★ **THE 31 B NOBODY HAD MEASURED — `docIdentity` IS JOINTLY HELD, AND A MARGINAL ARM CANNOT SEE IT.** The
badge-off arm reads **518**, not the **549** banked at 1.3 + 1.4, and the 31 B gap is not an error in either:
`diffChrome.ts:226` imports `getDocIdentity`, so group 2's compare code — which **did not exist** when 1.3
and 1.4 measured — now holds `docIdentity` on the graph after the badge lets go. Inclusion–exclusion closes
it: badge-exclusive **518** + compare-exclusive **1,450** + shared **31** = **1,999**, the measured
both-off drop, and **518 + 31 = 549** recovers the banked figure to the byte. ★ **This is the
*shared-helper-hides-from-marginal-arms* shape a third time, and the lesson sharpens: a component's
INCREMENTAL cost (measured when it landed) and its MARGINAL cost (measured today) differ by exactly what a
later feature has since come to share.** The incremental chain is the one that sums to the delta; the
marginal arm is the one that finds the sharing. Both were needed and neither alone would have closed.
★ **FIVE ARMS LANDED ON HISTORICALLY RECORDED md5s — CORROBORATION NO SUM CAN GIVE.** Beyond the master
control's return to 9.3's four artifacts: the sites-off arm reproduces **321,713** / `c68e437c…` /
`e1287b5c…` (3.3–3.11); the clean controls-off arm's **app** chunk is **392,929** / `0c40f5e4…`,
md5-for-md5 **task 3.4's** (enhancer present, toolbar empty, no controls); filter+copy off reproduces
**3.6's** app `7e89141b…`; copy off reproduces **3.7's** app `4ee49a89…`; and the two single-site arms
reproduce **4.1's** arms B (**329,193**) and C (**329,227**) exactly. ★ **An ablation that lands on a
build state the repo recorded months of tasks ago is a clean removal, demonstrated rather than asserted.**
★ **THE TREE-SHAKING SHAPE, INSPECTED WHILE THE ABLATION STOOD — AND THERE ARE NO RETAINED-BUT-UNUSED BYTES
TO NAME.** The known-retaining form (a **spread inside a module-level initializer of an unused export**,
which cost **+896 B** onto a 0-delta fence once) appears **nowhere** in the five M8 modules: every spread in
`tableTools.ts` is function-local, `AGENT_FILE_NAMES` uses the known-**dropping**
`/*#__PURE__*/ new Set([…])`, and the two constant tables (`COPY_FORMATS`, `GLYPH`) are **non-exported and
internally reached**. `tableTools.ts`'s twenty-odd test-only exports cost nothing extra for the same
reason — a transitive-reachability walk over the module finds **no declaration reached by no installer**.
★ **And that is a MEASUREMENT, not an inspection:** the sites-off arm returns the CS to 321,713
**md5-for-md5**, which it could not do if any part of `tableEnhancer`/`tableTools` were retained while
unreachable.
★ **NEVER A GREP (M6 finding 1).** No number above came from counting identifiers or source characters.
Every one is a **drop between two real builds of both engines from a wiped `.output`**, and every arm
carries a control that fires: the code is demonstrably gone from the source it was cut from, the build
**succeeds** (16/16 arms, exit 0 on both engines), and the removal reproduces either a recorded md5 or a
complementary arm. The one place a source count appears at all is the reconciliation of banked sub-arms,
and those were themselves ablation-measured at their own tasks.
**WHAT 4.3 DOES NOT DO:** **no §8-1 headroom-vs-budget ruling — that is 5.1's** (4.3 accounts the M8
**delta**; 5.1 prices the **total** against the budget, and the ship/no-ship ruling is **5.5's**); no walk
judgement (**6.1**); **no `src/` change and no pinning test** (the bundle is accounted, not moved); no
dependency; no manifest permission. ★ **One measurement note carried for whoever next ablates this repo:**
`tableEnhancer.ts` is **LF** on disk while `readerCss.ts` is **CRLF** — the repo is mixed, and an ablation
script that assumes either one silently fails to match.
Golden **EMPTY**; **007 import fence 8/8**; **`diff` off the content-script graph 6/6** — clauses A
(package), B (engine), C (view) plus their three non-vacuity controls, all green; `permissions: []` on both
built manifests (654 / 770 B); `web_accessible_resources` **absent**; manifest test **2975 B**
(byte-unmodified); deps **5**. NUL **0 in both forms** (raw byte count and escape-sequence scan) in both
edited files, with a control reading nonzero. Ablations by **cp-aside + restore, never `git checkout`**; all
fourteen `src/` files md5-verified byte-identical after every arm. **GROUP 4 IS COMPLETE.**
★ **TASK 3.8 IS DONE — THE COPY-OUT SHIPS, GROUP 3's THREE CONTROLS ARE COMPLETE, AND `permissions: []`
SURVIVED THE FIRST FEATURE THAT TOUCHES THE CLIPBOARD.** Two native `<button>`s in the toolbar strip —
`Copy CSV` and `Copy Markdown` (`peekover-table-copy--csv` / `--markdown`) — plus their own polite status
region, serializing the rows **CURRENTLY SHOWN, IN THE ORDER CURRENTLY SHOWN** (**F22**, §4) through
`navigator.clipboard.writeText`. `installTableCopy` is `tableTools.ts`'s third install and `tableEnhancer`
calls it LAST, after the sort and the filter; the strip now carries **six** children. Unit **944/944** (907
+ this task's **37**); browser **1183 passed | 15 skipped, 112 files, 0 failed** (1159 + this task's **24**,
12 cases × 2 engines); `pnpm lint` **EXIT=0**.
★ **F22 IS ONE LINE, AND THAT IS THE DESIGN.** The handler reads `shownRowsIn(body)` — `[...body.rows]`
minus the ones the filter set `hidden` on — at CLICK time, off the live `<tbody>`. Both halves come for
free and neither is tracked separately: the SORT **moves** its `<tr>` nodes, so DOM order already IS screen
order, and the FILTER **hides** rather than removes, so a hidden row is skippable rather than something to
remember. There is no second copy of either control's state to disagree with the first.
★ **F22 — RED-FIRST, IN BOTH HALVES SEPARATELY, unit AND real engine.** **ABLATION A1** (`shownRowsIn(body)`
→ `[...body.rows]`, the filter-blind copy): **3 unit red**, the hidden `ops` row visible in the output
(`'dept,who,n\r\nops,bo,2\r\neng,adam,9…'`), and **4 browser red across BOTH engines** reading the same
defect **back out of the real clipboard**. **ABLATION A2** (a `documentOrder` captured at install, filtered
at click — the right SET, the wrong ORDER): **2 unit red**, `'…eng,zoe,10\r\neng,adam,9'` where
`'…eng,adam,9\r\neng,zoe,10'` belongs. ★ **The fixture is the instrument:** sorted by `n` ascending and
filtered to `eng`, document order (zoe / adam / bo) and screen order (adam / zoe) share **no position and
no row set**, so a source-reading copy cannot look right.
★ **THE ASSERTION ORDER WAS WRONG ON THE FIRST FIRING, AND THE ABLATION IS WHAT SAID SO.** In A1's first
browser run the failure was `expected 'Copied 3 rows as CSV.' to be 'Copied 2 rows as CSV.'` — the
CONFIRMATION's count reds before the clipboard readback runs, so the clause that actually inspects the
copied bytes never fired. The two clauses were reordered — **bytes first, confirmation second** — and the
re-run reds on the readback itself, on both engines. The check that finds the defect has to be the one seen
to fail (the assertion-order lesson, one suite over).
★ **THE SERIALIZER IS A PURE UNIT, AND THE ESCAPING IS ASSERTED BY ROUND-TRIPPING RATHER THAN BY STRING
COMPARISON.** `csvField` / `toCsv` (RFC 4180: a field containing a quote, a comma or a line break is
quoted, and an embedded quote is DOUBLED; records joined with CRLF, no trailing terminator) and
`markdownField` / `toMarkdownTable` (a pipe escaped `\|`, a newline collapsed to a space because a GFM row
IS one line). The body's named fixture is a **document**, not a hand-built string: a cell whose displayed
text is `a, "b" | c` — comma, quote AND pipe at once — with a firing control asserting all three really are
on the screen before anything is serialized. ★ **RED-FIRST: ABLATION B1** (`csvField` returns its input):
2 unit red, the round trip decoding to `[ 'a', ' b | c', '1' ]` — *"the record must decode back to exactly
two fields: … got 3"*. **ABLATION B2** (the pipe escape removed): 1 unit red, `[ 'a, "b"', 'c', '1' ]` —
three cells against a two-column delimiter. A string comparison would only ever restate whatever the
serializer emitted; the decode is what can fail.
★ **THE BACKSLASH IS ESCAPED BEFORE THE PIPE, AND THE ORDER IS THE WHOLE CORRECTNESS — RED-FIRST
(ABLATION C, the two `.replace`s swapped):** 1 unit red, `expected 'a\\|b' to be 'a\\\|b'`. A cell reading
`a\|b` escaped for the pipe alone emits `a\\|b`, which markdown reads as an escaped BACKSLASH followed by a
BARE pipe — the table breaks on exactly the character the escape was for.
★ **THE HEADER'S LABELS ARE CAPTURED AT INSTALL, AND A MEASUREMENT IS WHY — RED-FIRST (ABLATION D, the
header read at CLICK time):** 1 unit red, `expected 'dept ascending▲,who,n' to be 'dept,who,n'`. By copy
time each `<th>` also holds the sort's state text and its `aria-hidden` glyph, so a `textContent` read at
click time copies **the control** into the header row of the copied table. The labels are therefore read
ONCE, at install, when the cells hold exactly their own text — `installTableSort` paints `none` as the
empty string, which is what makes the timing safe, and it is the same timing and the same reason as 3.7's
`tableName`. The case carries its own firing control: the `<th>` is asserted to really read *"ascending"*
before the copy is asked.
★ **D-10 RE-PROVEN, NOT INHERITED — AND `permissions: []` HELD ON BOTH BUILT MANIFESTS (654 / 770 B) AFTER
A REAL CLIPBOARD WRITE.** The copy is the first feature on this milestone's graphs that touches the
clipboard, so this is where a `clipboardWrite` permission would have become necessary if the plan's
documentation finding were wrong. It was not. **The two engines gate the write differently and NEITHER gate
is a manifest key** — measured here, and identical to what `diagramActions.browser.test.ts:840-849` measured
for `clipboard.write`: **FIREFOX writes on the gesture alone** (`clipboard-write` is not a `PermissionName`
in Gecko — there is nothing to ask for or to grant, so a real trusted click, the engine's real clipboard and
nothing granted to anybody is D-10 in its strongest form), while **CHROMIUM consults the Permissions API**
and a Playwright browser context leaves that at `prompt`. So the Chromium case is an **A-B ablation whose
OFF arm is PINNED** (`expect(consent).toBe('prompt')` — an ablation whose off arm can quietly not run is no
ablation at all): consent `prompt` → the stated failure, `grantClipboardConsent()` over CDP → `Copied 2 rows
as CSV.`, **same build, same button, same bytes, nothing rebuilt between the arms**. ★ **The conjunction is
the proof and either half alone is not:** `permissions: []` read on its own has been true since 007 and
would be true of a build in which the copy did not exist, so the manifest case **exercises the copy FIRST**
and only then reads `.output/`'s real emitted JSON — an absence DESPITE exercise. Its checker runs against
a deliberately malformed fixture in the same file, unconditionally, so it is non-vacuous even where
`.output/` is absent and the artifact case skips by name.
★ **WHAT D-10 STILL DOES NOT PROVE, STATED SO NOBODY READS MORE INTO A GREEN:** that a focused, headful
Chrome auto-grants the consent to a gesture-driven write. A Playwright context cannot exhibit that, and it
stays a documentation finding. **The `file://` residual is 4.2's** — it needs the content-script surface,
which is not here.
★ **§3.8's DEGRADATION IS PROVEN AGAINST A REAL `NotAllowedError`, NOT AN INJECTED ONE.** Chromium's OFF
arm IS the degradation: the rejection is caught, *"Copy unavailable. The table is unchanged."* is announced
in the copy's own polite region, the rows are still **painted**, the filter's *"Showing 2 of 3 rows"* is
untouched, and the button is still on screen — §3.8's *"a stated failure beside a still-readable table,
never a broken button"*, in its own words. Three more failure shapes are covered in the unit: **no
`navigator.clipboard` at all** (jsdom's own state, asserted as the firing control for the condition), a
**rejected** write, a write that **throws synchronously**, and a **serialization** failure (a poisoned cell
`textContent` accessor — the shipped path, not a test-only branch — which announces and writes nothing).
★ **THE REJECTION IS CAUGHT ON THE PROMISE, AND D-7 IS WHY — RED-FIRST (ABLATION E, the rejection handler
dropped from `.then`):** 1 unit red **plus a reported Unhandled Rejection**. A synchronous `try` around
`writeText` catches nothing a refused write does; a rejection escaping a click handler is D-7's totality
broken on the one path that is not synchronous. `writeToClipboard` also converts an ABSENT `navigator
.clipboard` and a synchronous throw into rejections, so the caller has exactly one failure shape and the
handler has none.
★ **GATE-2 RULING Q2 IS APPLIED AND CHECKABLE, NOT MERELY RECORDED — TWO BUTTONS, NO MENU.** §3.11 rows 9
and 21 stay `—`: no popup, no menu, no focus trap, no overlay work entered group 3. Asserted as an absence
of `[aria-haspopup]`, `[role="menu"|"menuitem"|"dialog"]` and `<dialog>` anywhere in the reading column —
**in a real engine, AFTER a click, which is exactly when a menu would appear** — plus focus still on the
button the reader clicked (the property row 21 would otherwise be asserting the presence of). ★ **RED-FIRST
(ABLATION G, `aria-haspopup="menu"` on both buttons):** 1 unit red, `expected …(2) to have a length of +0`.
★ **ROW 16 / F15's SHAPE — RED-FIRST (ABLATION F, the copy control built as a `<span>`):** 1 unit red,
`expected 'SPAN' to be 'BUTTON'`. ★ **The controls are found BY CLASS ALONE**, never
`button.peekover-table-copy--csv`, so the ablated `<span>` is LOCATED and the shape clause is the clause
seen to fail rather than an undefined dereference (the masked-instrument lesson, now caught six times).
Real-engine: **TAB walks field → clear → CSV → Markdown** in the engine's own order, and **Enter AND Space**
both activate — three native controls plus two more in document order, no roving `tabindex`, no
`role="toolbar"`, no key handling of ours.
★ **THE COPY'S STATUS IS ITS OWN REGION, AND THAT IS A DECISION.** `role="status"`, `hidden` rather than
merely empty so it is OUT of the accessibility tree while silent (row 20 / F13's property, re-asserted one
control over), and **painted** once it speaks (§5's *"state in text"* is a claim about what a sighted reader
can see, and a `width:0` span passes every `textContent` assertion ever written). It is deliberately NOT the
filter's count region: writing *"Copied 2 rows"* into the region carrying *"Showing 2 of 3 rows"* would
destroy §4's *"how many are shown out of how many"* as a side effect of an unrelated action, and the copy
must work on a table whose filter never installed. Asserted directly — after a copy, the filter's count is
byte-identical. The confirmation carries the COUNT (*"Copied 2 rows as CSV."*) because a bare *"Copied"*
would read identically whether or not the filter was respected.
★ **3.2 / 3.6 / 3.7's PROPERTIES ALL HOLD, AND 3.5's CONTAINMENT DOES TOO.** TOTAL (no body rows → no copy
control; a ragged body → a RECTANGULAR matrix, padded to the widest thing on screen, so a short row cannot
emit fewer CSV fields than its header and an over-wide row's extra cell is not silently dropped),
IDEMPOTENT (two buttons and one status after a second pass, `innerHTML` byte-identical), SCOPED (row 11 /
F4: table 2's buttons copy table 2, **with table 1's own button as the firing control**), HEADER-GATED. The
sort still cycles, is still stable and still restores document order; the filter still hides, counts and
clears; **F23 still holds**. `tablePlacement.browser.test.ts`'s 34 geometry cases are green **unchanged**
with five controls in the strip, and this task adds its own narrower rect claim — each copy button's box
inside the strip's box, at the live viewport. ★ **The copy is a NEW failure source inside D-7's per-table
try and gets its own case:** poisoning the copy's attach leaves table 1 EXACTLY as rendered (`outerHTML`
equality against a re-parse of the pre-enhancement markup — the sort's buttons, the filter's controls, its
second `<tbody>` and the toolbar host all gone) while table 2 is enhanced normally, with a counter asserting
the poison fired exactly once. **F25's shape re-asserted:** an `Element.prototype.innerHTML` setter spy
across build, copy and undo records nothing, **with a control that fires in the same test**.
★ **THE APP CHUNK MOVES +2,309 B AND THE CONTENT SCRIPT DOES NOT MOVE AT ALL.** App **397,337 → 399,646 B**
(`4ee49a89…`→`7275a378…`, identical on both engines); content script **321,713 B BYTE- AND md5-IDENTICAL on
BOTH engines** (Cr `c68e437c…` / Fx `e1287b5c…`) — `tableTools`/`tableEnhancer` are not on the
content-script graph until **4.1**. Every arm built from a wiped `.output` with `pnpm build` **and**
`pnpm exec wxt build -b firefox`, so no engine's reading is a stale artifact. **DECOMPOSED BY ABLATION TO A
ZERO RESIDUAL, never by an identifier grep:** **ARM 1** — the copy's code on disk, `tableEnhancer` NOT wired
→ **397,337 B, md5 `4ee49a89…`, IDENTICAL to 3.7's on both engines**, so an unimported export and every
helper reachable only through it cost **+0** (3.2 / 3.6 / 3.7's precedent, re-measured, and the control that
proves the instrument sees the change) · **ARM 2** — the enhancer's wiring plus a STUB `installTableCopy`
that references no copy helper or constant → **397,380 B, +43 B**, the import, the call, the `let`, the
catch line and the stub's own body · **ARM 3** — everything shipped except the four serializers (both
formats' `serialize` replaced by `() => ''`) → **399,257 B**, so **ARM 3 − ARM 2 = +1,877 B** is the control
itself (the two buttons, the status region, the matrix, the labels, `writeToClipboard`, the failure path and
the strings) and **SHIPPED − ARM 3 = +389 B** is `csvField` / `toCsv` / `markdownField` / `toMarkdownTable`.
**0 + 43 + 1,877 + 389 = 2,309. Residual ZERO**, and the restored tree rebuilds to `7275a378…`
byte-for-byte and md5-for-md5 on both engines.
★ **FINDINGS, STATED NOT QUIETLY RE-SCOPED.** (a) **3.8's Files list omits `src/render/tableEnhancer.ts`** —
the third time (3.6, 3.7, now); same conclusion, the copy lives in the strip the enhancer builds, so its
install call has nowhere else to go. (b) **It also omits the two suites that PINNED THE STRIP AT THREE
CHILDREN** — `src/render/tableEnhancer.test.ts` and `tests/browser/tableTools.browser.test.ts`. Both were
necessarily false after this task and are updated where they stood. ★ **3.7 FORECAST FIVE AND THE ANSWER IS
SIX**, because the copy was given a status region of its own rather than made to share the filter's count;
the forecast is corrected in both comments rather than silently overwritten. (c) ★ **THE WINDOWS CLIPBOARD
NORMALIZES LINE ENDINGS, AND ONLY BLINK APPLIES IT** — a markdown table written with `\n` reads back from
`readText()` with `\r\n` in Chromium and unchanged in Gecko (`CF_UNICODETEXT` is CRLF-terminated). That is
the CLIPBOARD's transformation, not the serializer's, so the markdown readback normalizes before comparing
and says why; the serializer's exact bytes are pinned in the unit, which is where they belong. (d) ★ **A
CROSS-FILE CONSENT LEAK, FOUND BY THIS TASK'S OWN PIN AND NOT FIXED HERE.**
`diagramActions.browser.test.ts` grants the Chromium clipboard consent WITH a `browserContextId` and resets
it WITHOUT one; `Browser.resetPermissions` with no id clears the DEFAULT context, so that grant outlives its
file and arrives in the shared window as `granted`. It surfaced as this file's OFF arm reading
`expected 'granted' to be 'prompt'` — the pin doing exactly its job. That sibling is outside 3.8's fence, so
`tableCopy.browser.test.ts` **establishes its own floor** (a per-case reset on its own context) and cleans
up BY ID with an `afterEach` assertion that the consent did not survive. **Carried:** the sibling's cleanup
is still id-less, and any future file that pins `prompt` after it will meet the same leak.
**WHAT 3.8 DOES NOT DO:** no content-script call site (**4.1**), no D-8/D-9 degradation suite (**3.9**), no
cost guard (**3.10**), no zero-network proof (**3.11**), no `file://` clipboard residual (**4.2**), no walk
judgement (**6.1**), and no styling — the copy ships with the engine's own default chrome, exactly as the
sort and the filter do.
Golden **EMPTY**; **007 import fence 8/8**; `permissions: []` on both built manifests (654 / 770 B);
manifest test **2975 B** (byte-unmodified); deps **5**; `pnpm lint` **EXIT=0**. NUL **0 in both forms**
(node byte scan and `tr -cd`) in all six edited files, with a control file reading **2** in both. Ablations
by cp-aside + restore, never `git checkout`; both `src/` files restored to their shipped md5s after every
arm (`tableTools.ts` `c730e043…`; `tableEnhancer.ts` `63916d73…`).
★ **CONTENT-SCRIPT BYTES MOVED FOR THE FIRST TIME IN FIVE MILESTONES, AND THE DELTA DECOMPOSES TO A ZERO
RESIDUAL.** Content script **318,747 → 319,527 B, +780 B, IDENTICAL on both engines** (Cr
`c7b33b36…`→`b4107b34…`, Fx `67717921…`→`4c7819ba…`); app chunk **389,143 → 389,926 B, +783 B**
(`65486f78…`→`564915e8…`). Decomposed by **four-arm ablation with a firing control**, never by an
identifier grep: **CSS block +413 B** (both) · **`mount.ts`'s line + import + module shell +39 B CS / +42 B
app** · **the three modules' code +274 B** (both) · **the frozen set's five member strings +54 B** (both).
**780 = 413+39+274+54 and 783 = 413+42+274+54 — residual ZERO on both.** ★ **The control FIRES:** with both
contributors ablated the build returns to the baseline **byte-for-byte and md5-for-md5** on all three
artifacts (`c7b33b36…` / `67717921…` / `65486f78…`), so the instrument demonstrably sees the change.
★ **Two sub-findings worth carrying.** (a) The CSS block is **423 B of source but 413 B shipped** — the
file is CRLF and the ECMAScript spec normalizes template-literal line terminators to LF, so its 10 newlines
each shed one byte. Any future CSS byte account on this repo is off by one per line if it reads the source
with `wc -c`. (b) **The `/*#__PURE__*/ new Set([…])` shape behaved in BOTH directions:** dropped while
unused (1.1/1.2's 0-delta), retained now that `mount()` reaches it, and its cost is **exactly the 54 B of
member strings** — 40 characters + 10 quotes + 4 commas, to the byte.
★ **1.4's OWN BYTE DELTA, DECOMPOSED TO A ZERO RESIDUAL — and the two edits are each other's firing
control.** Content script **319,527 → 319,709 B, +182 B, identical size on both engines** (Cr
`b4107b34…`→`a36bd676…`, Fx `4c7819ba…`→`fd8407ee…`); app chunk **389,926 → 389,957 B, +31 B**
(`564915e8…`→`72058cff…`). Five arms, each rebuilt for BOTH engines (`wxt build` is Chrome-only — a
Firefox reading taken without `-b firefox` is a STALE ARTIFACT, which is how this session's first
measurement briefly reported a +182/+0 engine split that did not exist). **CS +182 = 144 + 38**, sub-ablated:
**`basenameOf` +144 B** — previously tree-shaken, since `agentBadge` imports only `isAgentFile`, and
retained the moment `runReader` imports it — plus **`registerDocIdentity`'s retained body and its call
+38 B** (measured by an arm registering `location.href` directly: 319,565). **APP +31 B** is the same
retained setter and its call, without `basenameOf`, which never joins the app graph. ★ **The controls
FIRE in both directions:** the runReader-only arm leaves the app chunk **md5-identical** to baseline
(`564915e8…`), and the appShell-only arm leaves BOTH content scripts **byte- and md5-identical**
(`b4107b34…` / `4c7819ba…`) — so neither edit leaks onto the other's graph, and the final arm reproduces
each single-site arm md5-for-md5. **182 = 144+38, 31 = 31 — residual ZERO on both.**
★ **THE BADGE NOW APPEARS — the 1.3 note that it "ships but does not yet appear" is DISCHARGED, not
merely stale.** `getDocIdentity()` returns a real name at every production render on both surfaces, and
`tests/browser/agentBadge.browser.test.ts` (34 assertions, Cr+Fx) proves it end to end. **Its red-first
evidence is the part worth carrying:** against the registration-unwired build — literally 1.3's state —
**30 of 34 go red on both engines**, every one on `expected undefined to be '<name>'`, while the **4
harness-sanity tests stay GREEN**, which is what makes an all-red run evidence rather than a broken
harness. And against a **capture-once** `buildAgentBadge` (the shape threading the name through
`MountOptions` amounts to), the document-switch case reads **`expected 'Agent file · CLAUDE.md' not to be
'Agent file · CLAUDE.md'` on `intro.md` while the registry correctly says `intro.md`** — the previous
document's badge stranded on the new one, 007 D-12's class, which is the single property D-1's whole
registry-over-`MountOptions` design exists to buy. **`mount.ts` gained 8 lines, 0 deleted — exactly ONE of them
executable** (`children.push(...buildAgentBadge())`), the other seven being one mandatory `import` and a
six-line comment matching the density of the four sibling pushes. **`mount()` stays read-only library**
(006 D-15): it reads a data holder at build time, writes nothing, owns nothing, branches on nothing.
★ **THE BADGE'S LANE IS PROVISIONAL BY INSTRUCTION, not by omission** — gate-2 Q3 ruled *"produce, do not
choose"*: 1.5 measures, the human chooses at 6.1. It ships at `top:56px;left:16px` with the collision
inventory recorded in `readerCss.ts`'s `.ts` block: **full page that slot is empty** (`.peekover-diff-
affordance` declares the same offset but D-14 never renders it there — a two-rule coincidence held apart by
a build-time gate, which 1.5 must assert); **on the CONTAINED pane it overlaps the diff picker's and
status's `top:50` slot**, both `hidden` until opened — **the first thing 1.5 should probe.** Bottom-left is
already ruled out and not re-derived (`diffChrome.ts:55-60`). ★ **AND THE 1.3 NOTE THAT "the lane is never
live-and-unmeasured, because the badge cannot appear at all before 1.4" NO LONGER HOLDS — 1.4 is what
retired it.** The badge is on screen at a lane no rect probe has checked, and that is a KNOWN, BOUNDED
state, not an oversight: gate-2 Q3 ruled *"produce, do not choose"*, so 1.5 measures it next and 6.1
chooses. 1.4 deliberately asserts **no geometry whatsoever** — presence, structure and text only — so
nothing in the shipped suite can quietly ratify a lane the human has not picked.

### THE 1.5 LANE MEASUREMENT (spec 008 task 1.5, measured 2026-08-04 at HEAD `868a6d8` — **PRODUCED, NOT CHOSEN**)

★ **THIS IS THE RECORD TASK 6.1 RULES ON. It contains no lane choice, and that is the point** — gate-2 Q3
ruled *"produce, do not choose"*, so `readerCss.ts` is **UNTOUCHED** by 1.5 and the badge still ships at the
provisional `top:56px;left:16px`. The probe measures; **6.1 chooses, on these numbers.** Instrument:
`tests/browser/agentBadge.browser.test.ts`, **41 tests per engine (82 across Cr+Fx)** — the file 1.4 left at
34 per engine, grown by 1.5's rect section. Every rect goes through `realRect()`, which asserts non-zero
width AND height before returning, so **an "overlap: NONE" reading means *measured, nothing there* and never
*measured nothing*** — the vacuity that a `getBoundingClientRect()` on a `display:none` node (all zeros,
overlapping everything and nothing) would otherwise hide. **A test file ships nothing: all three bundles are
byte- and md5-identical to 1.4's** (CS 319,709 B, Cr `a36bd676…` / Fx `fd8407ee…`; app chunk 389,957 B,
`72058cff…`), rebuilt from a cleared `.output`.

★ **THE LANE NUMBER — the deterministic-width input plan §8 Q3 prices the lane on.** All FIVE labels, read
from the shipped frozen set rather than a re-typed list, **identical at 1280 and 1400, on both surfaces, on
both engines** (the badge is `position:fixed`, so its own rect does not move with the viewport):

| label | width | rect |
|---|---|---|
| `Agent file · AGENTS.md` | **171.0 px** — the WIDEST | `[16,56,187,93]` |
| `Agent file · CLAUDE.md` | 170.9 px | `[16,56,187,93]` |
| `Agent file · tasks.md` | 152.4 px | `[16,56,168,93]` |
| `Agent file · spec.md` | 149.3 px (Cr) / 149.2 px (Fx) | `[16,56,165,93]` |
| `Agent file · plan.md` | **148.4 px** — the NARROWEST | `[16,56,164,93]` |

**Height 37.3 px at every label and every width.** The spread across the five is **22.6 px**, and the only
cross-engine disagreement in the whole set is `spec.md`'s **0.1 px** — so the width really is deterministic,
which is the property `diffChrome.ts:118-129` used to give the diff pill the left lane. **THE DERIVED LANE:
`left:16 + widest 171 + a 24 px gutter = 211 px`.** That is the number, **not a recommendation** — whether
the band takes a third lane at all is 6.1's call, and bottom-left is already ruled out upstream
(`diffChrome.ts:55-60`).

★ **FINDING 1 — THE 1280 COLLISION IS REAL, AND IT IS RECORDED RATHER THAN FIXED.** At **1280, full-page
content-script reader**, the provisional lane lands **on the reading column's h1**: badge `[16,56,187,93]`
vs h1 `[173,56,857,105]` — **~14 px of horizontal overlap, top edges flush at 56**, identical in Chromium
and Firefox, and identical with the TOC rail forced open and left at its width-derived default. **At 1400 it
clears with a 46 px gap** (h1 left edge moves to 233; the badge does not move). ★ **THIS IS FINDING 2's
DEFECT CLASS EXACTLY — a single wide width would have hidden it**, which is why `GEOMETRY_WIDTHS` carries
both and was copied rather than re-picked. **NOT FIXED: fixing it is choosing the lane**, and gate-2 Q3
forbids 1.5 from doing that. **Routed to 6.1.**

★ **FINDING 2 — THE `position:fixed` CONTAINED FINDING, which FALSIFIED THE PREDICTION 1.3 ROUTED HERE.**
`.peekover-agent-badge` is **ABSENT from `CONTAINED_CSS`'s fixed→absolute list** (`src/theme/readerCss.ts:
983-993`, re-derived against the tree this session — the list names the mode toggle, theme pill, watch pill,
watch note, capture disclosure, diff affordance, diff picker, diff status, remote-load, net indicator and
TOC, and **not the badge**). So on the app page **every sibling re-anchors to the pane and the badge stays
pinned to the VIEWPORT** — measured: host `[344,77,1256,559]` at 1280, badge `[16,56,187,93]`, i.e. **the
badge sits entirely OUTSIDE the pane it names**, over the app shell's chrome. ★ **THIS FALSIFIES 1.3's
PREDICTED CONTAINED OVERLAP.** The picker's and status's `top:50` slot measures `[360,127,600,139]` and
`[360,127,390,147]` (un-hidden for the probe; worst case with the picker's computed `max-height`,
`[360,127,600,447]`), and **`overlap=false` against the badge in all four readings** — but *"no overlap"*
here is **true for the wrong reason**: the two are in **different coordinate systems**, not clearing each
other. **A PLACEMENT FINDING 6.1 MUST WEIGH — should the badge re-anchor on the contained pane?**
**RECORDED, NOT RESOLVED.**

★ **FINDING 3 — ROWS 5 AND 8 ARE EXECUTED AS MEASUREMENT, NOT AS CLEARANCE. This is a revisit-when (a)
UNEXECUTABLE-CLAUSE finding, banked at discovery** — the **third in group 1**, after 1.3's added-line count
and 1.4's unreachable `name === undefined` arm. The Verify contract words rows 5 and 8 as **clearances**
(*"does not occlude the reading column's text"*, *"clears the TOC rail and the mode toggle"*, i.e.
`expect(...).toBe(false)`), and written that way they were **RED on the first run, in both engines** — because
the provisional lane genuinely does not clear at 1280. **There are exactly two ways to make a clearance
assertion green from there and gate-2 Q3 forbids BOTH: move the badge (choosing the lane), or pin the
geometry that happens to clear (ratifying the lane, and reddening the moment 6.1 moves it).** So the probe
records every rect and **pins the MEASUREMENT instead — the overlap set is asserted to be exactly
`{1280 cs open, 1280 cs default}`**, four of the sixteen (width × surface × rail) readings coming back
occupied and twelve `NONE`. ★ **If 6.1 moves the badge this table REDS carrying both rects — and that is
CORRECT**: it is a pin on the geometry, not on a required lane, and **6.1 is free to invalidate the whole
table by choosing. That is what choosing means.**

★ **THE TWO SUPPORTING READINGS, recorded so 6.1 sees them as numbers rather than discovering them at the
walk.** (a) **THE FULL-PAGE COINCIDENCE IS A COLLISION, PROVEN BY ABLATION.** `.peekover-agent-badge` and
`.peekover-diff-affordance` declare the **same** `top:56px;left:16px` on the full page, and the only thing
holding them apart is **D-14** — `buildDiffChrome`'s gate is `isDiffContextRegistered()`, which no
content-script graph ever satisfies. The probe **feeds the gate its input rather than editing it** (registers
a diff context on the content-script surface; no `src/` module touched), and the affordance then really
renders and the two rects really **do** overlap. **The coincidence is held by a BUILD-TIME CONDITION, not by
geometry** — if D-14 ever changes, the badge is the one that gets covered. (b) **THE 414 READING, reported
and deliberately not asserted** (`diffChrome.ts:77-82`'s pre-existing contained-pane condition): at 414 the
content script collides with the h1 `[32,56,132,105]`; on the **app page the h1 measures ZERO WIDTH — it is
not laid out at all**, so its "no collision" is the pre-existing 3.1-era condition and not a clearance.
Asserting either would pin a condition that predates the badge onto the badge.

★ **D-12 discipline, per token, run this session:** `--sans` / `--shadow` light-block-only so identical in
all three; `--muted` #5D6070 / #A0A4B8 / **#5D6070 inherited on sepia**; `--panel` #F4F4EF / #181B26 /
**#F4F4EF inherited**; `--line` #E6E6DF / #262A38 / **#E6E6DF inherited**. ★ **The sepia reading is stated,
not silently substituted:** `--panel` on sepia paper `--paper` #F6EEDF is a 2/2/16 per-channel delta, so the
pill's surface is near-invisible and `--line` carries its shape — **inherited deliberately**, because all
five sibling pills ship the same triple and today read the same way; swapping in `--accent-soft` (which
sepia *does* override) would fix one pill and make it the only chrome that looks different on one theme.
The whole-band sepia question belongs to a task that takes all six pills at once. **No `ch` in `margin` /
`padding` / `transform`**; **rationale in the `.ts` comment above the literal**, byte-checked on the shipped
block (423 B source / 413 B shipped, accounted above).
★ **THE COPY, and what it declines to claim.** `Agent file · <name>` — the mockup's phrase carried
(`mockup.html:634`), its `· tuned rendering on` **dropped** because §8-4 has chosen no tuning yet, and its
`◈` glyph and `var(--ok)` **dropped** because §5 requires text, not colour. **Exactly FIVE enumerable label
widths** (one per frozen-set member), which is the deterministic-width input plan §8 Q3 prices the lane on.
★ **A FINDING FROM ABLATION C, recorded because a reader would otherwise assume the toolchain holds it:**
`buildAgentBadge`'s `name === undefined` arm is **unreachable at runtime** (`isAgentFile(undefined)` is
already `false`), so **no test can turn it red** — and with the arm removed **neither `tsc --noEmit` nor
this repo's eslint flags** interpolating a `string | undefined` into the label. It would silently ship
`Agent file · undefined` the moment 1.2's predicate is widened. The guard is a deliberate belt against an
**un-caught** failure mode, and it is documented as such rather than asserted by a test that would have to
fake its own precondition.
★ **ROUTED TO THE HUMAN — `decisions.md` carries NO 008 D-value entry yet, and 1.3 did not add one.**
Plan §0 and the tasks header say each D-value's pre-written entry lands *"with the commit that implements
it"*, but **1.3's Files list does not include `docs/ai/decisions.md`** — and neither did 1.1's or 1.2's, so
no entry has landed for D-1 or D-2. **The Files list was followed.** The coherent reading is that **D-1 and
D-2 both complete at 1.4**, where registration makes the seam actually carry a name to screen; landing them
there keeps one pattern instead of introducing a third. **Flagged for the reviewer to rule on, not decided
by this session.**
**Task 1.2 remains as landed** — `src/render/agentFile.ts`, the pure recognition predicate (D-2), and
`agentFile.test.ts` (34 tests). 1.2 is an **exact, CASE-SENSITIVE** `Set.has` over one frozen set —
`CLAUDE.md`, `AGENTS.md`, `spec.md`, `plan.md`, `tasks.md`; **`.cursorrules` is NOT in it**, per gate-1
§9-3, because it is *unreachable* behind `MARKDOWN_EXTENSIONS`, not merely un-badged. Case-sensitivity is
the whole argument: a `claude.md` badged wrongly is a **false claim on screen**, where a `claude.md` left
un-badged is just the resting state (`[]`), and those two errors are not equal. Recognition is from the
**filename only** — the suite runs with **no DOM in scope at all** and asserts that absence directly.
★ **THE D-2 DECODE-PREMISE FINDING, recorded not resolved (tasks 1.2's Verify asks for exactly this).**
D-2 justifies `decodeURIComponent` with *"a raw `split('/').pop()` comparison would miss any path
containing an encoded character"*, worked on `file:///c:/dev/My%20Docs/AGENTS.md`. **That example does not
demonstrate the failure** — the encoded character is in a **parent** segment, which `.pop()` discards, so
the undecoded comparison already yields `AGENTS.md`. And **no frozen-set name is reachable only through
the decode by any path a browser can produce**: all five names are ASCII letters and a dot, so
`encodeURIComponent(name) === name` for every one of them (asserted). **The decode is kept exactly as
DECIDED — D-2 is sealed** — and it is CORRECT and harmless; it is *insurance for a future set member with
a space or a non-ASCII character*, not a live false negative it fixes today. **Two implementation
properties of the decode are NOT free choices, though, and both are red-first proven:** it **splits before
it decodes** (decoding first turns `%2F` into a separator, so `weird%2FCLAUDE.md` — one file *not* named
`CLAUDE.md` — would be badged: a **false positive**), and the decode is **caught** (`decodeURIComponent`
throws `URIError` on `50%.md`, and `new URL()` does not normalize a lone `%` away; `basenameOf` runs at
`runReader.ts:118` **before** `mountReader()`, so an uncaught throw there is not a missing badge but **no
render at all** — the blank page AGENTS.md #5 forbids). ★ **AS OF `6553790` (1.2) both bundles were
md5-IDENTICAL to `bd93ffd`** — 318,747 B content script (Cr `c7b33b36…` / Fx `67717921…`) and 389,143 B app
chunk (`65486f78…`) — **because the module was imported by nothing yet**; *(superseded at 1.3, which wired
it: see the +780 B / +783 B decomposition above — those are now the BASELINE figures, not the current
ones)*. The instrument was re-proven able to move in the same
session (one CSS byte on both graphs → 318,778 B, all three md5s changed, app chunk under a **new
content-hashed filename**, then reverted to the exact baseline: A-B-A). `dependencies` still **5**;
`permissions: []` both; golden EMPTY; 007's import fence **8/8**. **1.1 remains as landed** —
`docIdentity.ts`, the third register-once instance, `string | undefined` with no presence predicate and an
**empty import list asserted structurally**; **1.2 does NOT import it**, deliberately: the registry holds
the name, the predicate judges it, and **they meet at 1.3**.
**Still true of the draft, and the reason the spec is what it is:** it supersedes the *"the next act is M8
scoping"* pointer in the M7-close bullet below — scoping happened, and its first artifact exists. **008 = the three persona-#1 items deferred at M7's direction** — compare any two
files (F6), agent-file awareness (F6), table tools in the reading view (F5). The draft is grounded in a
**scope-read of the tree at `81986d8`**, reported in the spec itself: item 1 is a picker widening over an
already file-agnostic `computeDiff`; item 3 is a post-mount enhancement with `enhanceDiagrams`' exact
precedent; **item 2 is two features in one bullet** — a small badge plus a "tuned defaults" reading that is
milestone-sized against `settings.ts`'s single global row and `parse.ts`'s single parser instance, cut to size
at spec §3.5. **No dependency, no storage, no manifest event** — so D-10 (b)'s *"any further dependency
lands"* trigger does not fire and the 0.70 MB zip headroom is undrawn. The **content-script surface milestone
is deferred with the spike's measurement attached** (`81986d8`, +238.8 ms, 2.3× the gate). **All three
artifacts exist and all three gates are behind them — `spec.md` past gate 1, `plan.md` past gate 2,
`tasks.md` past gate 3 — which is what released implementation** (WORKFLOW.md §5.3). *(This paragraph
described the pre-gate-3 draft; the ★ pointer above supersedes its status clause, which is left corrected
rather than verbatim because the Now section is the live one.)*

**★ M7 (spec 007 — Mermaid diagrams + diagram cache, M7a) IS CLOSED — 2026-08-02, at task 9.3.** All **28 tasks** across **nine groups** landed, plus five commits of shipped code outside the box list (three out-of-plan implementations — the two D-1/D-6 addenda and §4's source guard — and the two post-gate fixes); the 9.1 human gate is discharged 8/8 and **no gate remains**. `permissions: []` held on both engines for the whole milestone, the content script grew **+3,076 B** (decomposed to a **0 B** residual) with the ~3.3 MB engine kept off its graph entirely — asserted structurally by 3.4's import fence, not by a byte reading — and `dependencies` went **4 → 5**. **The close summary is in § Closed milestones; the reconcile that sealed it is § Baselines' *THE 9.3 RECONCILE RECORD*. The narrative below is M7's working set and is now HISTORY — it is the next archive pass's material, not a live pointer.** ★ **NOTHING IS IN IMPLEMENTATION. THE NEXT ACT IS M8 SCOPING**, which should start from `spec-coverage.md` — noting that its F2 row is stale by construction until the re-audit 9.3 routed (§ Carried items) has run.

**M6 (spec 006 — snapshots + diff) closed 2026-07-27. M7's implementation narrative, kept below as the archive pass's material: all three Gear-3 gates are behind it — `spec.md` PASSED gate 1 (`e09520f`, three revisions, §3.4/§9-2/§9-3 dispositions recorded there), `plan.md` PASSED gate 2 (`c44406a`, approved at `cab93c7` with four sub-decisions — the D-5 ledger copy, version-bump-uses-eviction, the `architecture.md` correction routed to group 9, and the §7-9 flip-cost re-routed to gate 3), and `specs/007-mermaid-diagrams/tasks.md` (28 tasks, nine groups) PASSED gate 3 (banked in `decisions.md`'s M7 GATE 3 entry — `66634fa`; the tasks file's "DRAFT awaiting gate 3" status line stays, by the gate-1/gate-2 precedent). TASK 1.1 IS DONE (`2159e5c`): `mermaid@11.16.0` added as the FIFTH production dependency, with its four supply-chain gates discharged. TASK 1.2 IS DONE (`1391118`): `src/render/diagramEngine.ts` — the ONE module naming `import('mermaid')` (a static string literal the scanner permits), the feature-detect that keeps a fence-free document from ever evaluating it, D-6 step 3's configuration, and `engineVersion()` sourced from a STATIC `mermaid/package.json` import per the D-3/D-13 amendment (`bddd5af`) — mermaid exposes no runtime version. Imported by NOTHING, so both bundles are md5-identical to 1.1's. TASK 1.3 IS DONE (`c7b3004`) — THE ABLATION, and GROUP 1 IS COMPLETE. The content-script bundle is md5-IDENTICAL both engines with `diagramEngine` made reachable by a scratch `appShell.ts` reference — mermaid never enters the gated path — and that null counts for something only because the negative control FIRED in the same run: the app page gained +3,349,685 B. mermaid emits as a SEPARATE LAZY ASYNC CHUNK (`chunks/mermaid.core-D7K4dyvy.js`, 34,946 B) behind a real `import()`, never statically inlined; the app chunk itself moved only +2,379 B (dynamic-import glue 1,971 · `diagramEngine`'s own code 375 · scratch artifact 29 · statement realign 4), decomposed to the byte with no unnamed residual. Both of 1.2's handoff items are discharged: the static `mermaid/package.json` import does inline the WHOLE package.json — 3,847 B, isolated by a second ablation — and the emitted output carries NO bare specifier and NO orphan chunk. These figures are ABLATION / SCRATCH-WIRED and are NOT the production figure (8.1 owned that; **DELIVERED at 8.1** — see § Baselines): `appShell.ts` is restored md5-identical, `diagramEngine` is again imported by nothing, and the committed baselines are UNCHANGED. Full note in § Baselines. TASK 2.1 IS DONE (`4d3df61`) — GROUP 2 IS OPEN. `sanitizeSvg()` is a SECOND NAMED sanitizer (D-1), not a configurable one: `SVG_ALLOWED_TAGS` / `SVG_ALLOWED_ATTR` / `SANITIZE_SVG_CONFIG` + `sanitizeSvg()`, sharing the DOMPurify singleton so the global `uponSanitizeAttribute` hook is INHERITED. Its `ALLOWED_URI_REGEXP` is **design C per the D-1/§2.1 AMENDMENT (`ff8f323`)** — a scheme-free regexp confined by `ADD_URI_SAFE_ATTR` to the reference attributes; §2.1's original literal `/^#/` is unimplementable against DOMPurify's global attribute gating (it would delete every coordinate in the diagram), and design C preserves both of §2.1's security properties exactly. `foreignObject` and `<style>` are denied BY ABSENCE, not by a FORBID list; `ALLOW_ARIA_ATTR: true` is the one deliberate config divergence (a11y, spec §5). Evidence, re-run from clean this session: the hostile corpus is red-first **9 of 9** under an identity passthrough, each red NAMING the surviving node (`<foreignObject width="100" height="100">`, `<use href="http://evil.example/payload.svg#x">`, `<style>@import url("http://evil.example/x.css")…`) — none is jsdom-neutralized-regardless; revert-and-fail (add `foreignObject` to `SVG_ALLOWED_TAGS`) reds **exactly 3** — that corpus case plus the two drift-guards designed to catch it — and no other corpus case. The DOCUMENT profile is BYTE-UNTOUCHED (the whole diff is one additive hunk from `:146`, zero `-` lines), pinned by a source-text assertion PROVEN TO FIRE: a scratch entry in the document `ALLOWED_TAGS` reds it naming the const. So markdown source still cannot produce an `<svg>`. The profile tree-shakes to zero on the content script — 315,671 B md5-identical BOTH engines — and that holds only because of the `/*#__PURE__*/ …slice()` form, ABLATED and re-measured this session: spreads take it to 316,567 B (+896 B). TASK 2.2 IS DONE (`a6d2226`) — ★ GROUP 2 IS COMPLETE. `tests/browser/diagramSanitize.browser.test.ts` proves, in REAL Chromium AND Firefox (5 tests × 2 engines, 10/10), what the §2.2 AMENDMENT (`b19c068`) reframed the task around: the SVG profile's `data:` denial is ALLOW-LIST-DRIVEN and hook-INDEPENDENT. A fresh NO-HOOK DOMPurify instance (`DOMPurify(window)`, asserted a distinct object and asserted hook-free — `removeHook` returns `undefined` on an empty stack) is EQUALLY clean on `SANITIZE_SVG_CONFIG`; `data:` on `xlink:href` does not survive `sanitizeSvg`; the `#dot` fragment on that same attribute DOES survive, so neither result is passing on an empty tree; and the sweep itself is proven to FIRE on the raw payload (2 data: URIs reported). The inherited hook IS registered on the singleton `sanitizeSvg` calls — pinned behaviourally by a temporary observer hook that fires and sees `xlink:href` (plan §4-3's second half, true regardless of how `dompurify` resolved at 1.1) — but it is labelled in the test as an INHERITANCE-BY-CONSTRUCTION pin, NOT a security discriminator: ★ THERE IS NO "remove the hook → `data:` reds" REVERT-AND-FAIL FOR THIS PROFILE, BECAUSE THE HOOK IS A PROVEN NO-OP HERE (`b19c068`: all five `_isValidAttribute` acceptance branches closed). That absence is THE FINDING, not a missing check. The revert-and-fail is the WIDENING BOUNDARY and it has teeth in both engines: adding the single `DATA_URI_TAGS` member `image` to `SVG_ALLOWED_TAGS` reds the no-hook guard naming the survivor — `expected [ '<image href="data:text/html,y">' ] to deeply equal []` — in Chromium AND Firefox, while the HOOKED `sanitizeSvg` still strips it (b19c068's GATE B asymmetry, reproduced live). Under the same widening the unit suite reds **exactly 5**: that mirror guard plus 2.1's two drift-guards (the exact-set and denied-by-absence tests), the `<image href>` corpus case, and the new `image`-denied-by-absence pin — the (c) guard is among them, and `sanitize.ts` was restored FROM THE `cp` COPY, md5-identical. A jsdom mirror lands in `sanitize.test.ts` with the honest in-file note that the BROWSER test is authoritative (jsdom is blind to the real-engine reparse/mXSS cases — decisions.md 2026-07-14). One stale `sanitize.ts` comment that `b19c068` falsified (it claimed the inheritance "is exactly the property a future `removeHook` breaks silently") is re-anchored to the truth; the edit is COMMENT-ONLY and proven BYTE-NEUTRAL — both engines' content script (315,671 B) and app chunk (`app-CEHD9mSZ.js`, 361,500 B) are md5-IDENTICAL before and after. **THE D-6 `secure` HARDENING IS DONE (`3d7c8ed`)** — the config change the D-6 ADDENDUM (`16c7790`) licensed but deliberately did not make; it is the addendum's implementation, NOT a numbered tasks.md task, and it does not move the group-3 pointer. `DIAGRAM_ENGINE_CONFIG` now carries `secure` = mermaid's own six defaults PLUS `themeCSS`, `fontFamily`, `altFontFamily`, `themeVariables`, so a `%%{init}%%` directive can no longer inject fetching CSS into the engine's generated `<style>` before `sanitizeSvg` runs. `securityLevel`/`htmlLabels`/`startOnLoad` are byte-identical — the diff is one added key plus its rationale. Proven RED-FIRST in `tests/browser/diagramSecure.browser.test.ts` (9 tests × 2 engines, 18/18) over BOTH routes the addendum names, each with its own loopback URL and each red against the un-hardened config in the SAME run: **ROUTE 1 `themeCSS`** (an ORDINARY `background-image:url(…)`, NOT `@import` — `@import` is dropped by mermaid's own constructed-stylesheet parse and would have passed VACUOUSLY) and **ROUTE 2 `fontFamily`** (the brace-balanced `:root{--mermaid-font-family}` interpolation `sanitizeCss` does not catch). Pre-change, against the committed config, all three payloads landed in `<style>` AND reached the wire in Chromium AND Firefox — `…/d6-1/evil1.png`, `…/d6-3/evil2.png`, `…/d6-5/evil3.png`; post-change every hardened arm observes ZERO requests. The instrument is proven live by a benign `%%{init:{"theme":"dark"}}%%` control that visibly re-themes in the same run (`#ECECFF` gone), so "no fetch" is a RESULT, not a dead probe. The list GUARDS ITSELF (a `%%{init:{"secure":[]}}%%` re-widening directive does not fetch — `sanitize()` iterates `['secure', ...siteConfig.secure]`), our own `initialize()`-set `themeCSS` STILL APPLIES (the DIRECTIVE route is closed, not the feature), and the ABLATION holds: a config passing mermaid's DEFAULT six explicitly STILL fetches ROUTE 1 (`…/d6-6/evil4.png`), so the four ADDED keys are causal rather than the act of passing an array. `themeVariables` carries the one accepted cost the addendum priced (author-directive themeVariables stop applying; the effective theme is OURS — §3.7/D-7). ★ **BYTE DELTA: ZERO, on BOTH bundles and BOTH engines** — app chunk `app-CEHD9mSZ.js` 361,500 B and content script 315,671 B are md5-IDENTICAL before and after (Chromium `172e88b6…`/`c8251651…`, Firefox `172e88b6…`/`b597b1b4…`). ★ **This is NOT the "app chunk moves" the task anticipated, and the reason matters: `diagramEngine.ts` is still imported by NOTHING, so it is on NEITHER bundle graph and the `secure` array cannot cost bytes yet.** Confirmed with a FIRING CONTROL rather than a bare grep (an identifier grep over a minified bundle reads 0 everywhere): `peekover-remote` hits 8× and `DOMPurify` 1× in the same file where `language-mermaid`, `hasDiagramFence`, `mermaid` and `startOnLoad` all read 0. The real cost lands when 3.1/3.2 wire the enhancer — 8.1 owned the production figure and **has now measured it** (§ Baselines). ★ **STILL OWED — this closes a ROUTE, not the WINDOW: task 3.3's real-engine zero-network guard on D-6's measurement window is UNCHANGED and still outstanding.** A config that provably closes one directive route is not a proof that the render window is clean, which is the entire point of D-6's "not by construction". **THE D-1/D-6 OPTION-B IMPLEMENTATION IS DONE (`367d051`) — ★ `ff8f323`'s FIRST DOWNSTREAM FINDING IS DISCHARGED IN CODE, AND GROUP 3'S `<style>` BLOCKER IS CLOSED.** Like the D-6 hardening it is the ADDENDUM's implementation (`0de27f3`), NOT a numbered tasks.md task, so it does not move the group-3 pointer. `SVG_ALLOWED_TAGS` now admits `style` — reversing 2.1's denial for that element ONLY — and `cleanSvgCss` is the first procedural filter beside the allow-list: it strips any `url(` TOKEN whose target is not a `#`-fragment and any at-rule but `@keyframes`, preserving internal `url(#…)` and the `edge-animation-frame`/`dash` keyframes mermaid emits unconditionally. **Coverage is TOKEN-scoped, not property-scoped** — the reproduced property set already runs to 19 open-ended spellings, so a property allow-list is one CSS release behind by construction. **MECHANISM: an in-repo default-deny scan over a DECODED, comment-free view, NOT the platform `CSSStyleSheet`+`replaceSync`** — the platform parser is browser-only (jsdom has none, so the pass would silently no-op there) and a CSSOM rule-walk must re-serialize, dropping every declaration the host engine does not understand. ★ **The decoded text is NEVER emitted**: cuts are found in view coordinates and excised from the ORIGINAL, because `content:"\3c /style\3e…"` decodes to a literal `</style>` and an HTML-namespaced `<style>` serializes RAW. Escapes that decode to a STRUCTURAL character become a sentinel, so `\28` cannot fabricate a function-open the CSS parser never saw. The pass runs to a FIXPOINT and fails CLOSED. **NO NEW DEPENDENCY** — the addendum's lean held. Proven RED-FIRST in `tests/browser/diagramStyleCss.browser.test.ts` (18 tests × 2 engines, 36/36) with the pass NEUTERED and restored FROM THE `cp` COPY: **every GREEN arm reds in BOTH engines (18/18 failures, exactly the green arms)** while every RED/control arm still passes. Each lane ADOPTS the artifact into the LIVE document and watches the wire — string-stripping is necessary, not sufficient. All four obfuscation lanes reproduce and are closed: ★ the CSS escape `u\72 l(` **(red evidence: `.p-css-2{background-image:u\72 l(http://…/escape.png)}` surviving with a fetch — the lane a naive `/url\(/` MISSES and the one that decides the mechanism)**, case `URL(`, interior whitespace, both quote forms, plus protocol-relative, `data:`, `@import`, and a bare-string `image-set("…")` (BEYOND the reproduction's surface — a fetch with no `url(` token in it at all, denied whole). ★ **THE LIVE CONTROL IS IN EVERY LANE'S OWN STYLESHEET**: a benign `url(#gradA)` and `@keyframes` survive the same `<style>` the payload was in, so "zero requests" is a RESULT and not an over-strip — without it option B would have bought nothing. A REAL mermaid render passes through **byte-identical** (`cleanSvgCss` is the identity on a clean sheet) with both keyframes intact. ★ **A HARNESS FINDING WORTH MORE THAN THE LANE IT CAME FROM: in FIREFOX, parsing `@import url(X)` into ANY inert document — a bare `new DOMParser().parseFromString` is enough — CONSUMES the load for X; no request reaches the wire and a later adoption of that same X is NEVER RETRIED.** Since sanitizing a payload IS such a parse, routing the `@import` positive control through the no-pass sanitizer made it read NO-FETCH in Firefox while the route was wide open — a control that reads empty when the defect is live. Measured with byte-identical strings from two origins (hand-written FETCHES, `DOMPurify.sanitize`-produced does NOT, Firefox only; Chromium fetches both). The `@import` live-route arm therefore adopts markup no sanitizer has touched. ★ **BYTE DELTA: ZERO — content script 315,671 B md5-IDENTICAL both engines** (`c8251651…` / `b597b1b4…`), app chunk `app-CEHD9mSZ.js` 361,500 B, and that null is NOT vacuous: the fence is held by registering the hook INSIDE `sanitizeSvg` and removing it in `finally` rather than at module scope, ABLATED in the same session — a module-scope `addHook` is a side effect the bundler must retain and takes the content script to 318,470 B (**+2,799 B**, with `image-set(` appearing in the bundle). 2.1's four tests are updated: the exact-set gains `style`, the denied-by-absence loop drops it, the `@import` case is RE-AIMED (the ELEMENT now stays, so the RULE must go — it used to pass because the element was dropped, exercising no CSS handling at all), and the corpus sweep gains a SECOND predicate over `<style>` TEXT, because the attribute sweep structurally cannot see CSS and that row would otherwise have passed while the artifact carried a live `@import`. The DOCUMENT profile is untouched and its source-text pin is green. **TASK 3.1 IS DONE (`1e09164`) — ★ GROUP 3 IS OPEN, AND THIS IS THE FIRST CODE IN THE TREE THAT PUTS DIAGRAM STRUCTURE IN THE LIVE DOM.** ★ **SCOPE, DECIDED FROM tasks.md AND STATED BECAUSE THE BYTE ACCOUNTING TURNS ON IT: 3.1 DOES NOT WIRE THE ENGINE.** `diagramEngine.ts` is absent from §3.1's Files list and present in §3.2's; §3.1's verify names no SVG, no adoption and no `sanitizeSvg`; its byte check names ONLY the `READER_CSS` delta, and a ~3.3 MB lazy chunk entering would be the headline byte event of the milestone. Decisive confirmation from the tree rather than from reading: `diagramEngine` is imported by NO production module, so a single import from the enhancer — even for the selector constant alone — would make it reachable from the app-page graph and MATERIALISE mermaid's chunk. It is therefore deliberately NOT imported: `DIAGRAM_FENCE_SELECTOR` is re-declared in `diagramEnhancer.ts` and the duplication is PINNED by a unit test that imports both constants and asserts equality (a test import costs no bundle bytes). `src/render/diagramView.ts` owns D-15's structure and its three states (`pending` / `rendered` / `failed`) and `src/render/diagramEnhancer.ts` owns the SYNCHRONOUS prologue; `markDiagramRendered` takes a NODE, never a string, so 3.2 hands it `mount.ts:131-133`'s adopted `<template>.content` and no innerHTML exists anywhere in either module to reach around the D-1 profile. Wired at BOTH D-12 sites from ONE shared function: `readerPane.ts:179` after its committed `mount`, and — the seam that had no consumer until now — the `render` closure `appShell.ts` passes into `createWatchController` (`watchController.ts:449`), which every caller had taken the `mount` default for. **`contentWatch.ts` still passes no `render` and is byte-untouched — that omission IS the §3.2 fence.** ★ **THE CONTENT-SCRIPT DELTA IS +303 B AND IT IS EXACTLY THE CSS, WITH ZERO CODE** — 315,671 → **315,974 B**, identical on BOTH engines, and 303 B is precisely the byte length of the `READER_CSS` block added (`git diff` of the added lines, counted). The decomposition is proven by a FIRING CONTROL rather than a bare identifier grep: with the enhancer UNGATED into `mount()` — the one function both surfaces share, which is the accident rows 2+3 guard against — the same build reads **316,554 B (+883 B)** and `peekover-diagram` appears **3×**; gated, it appears **2×**, both of them the CSS selectors, and `language-mermaid` reads 0. **No mermaid chunk exists in either output** — `chunks/` holds one file. App chunk `app-CEHD9mSZ.js` 361,500 → `app-BDQ8clk9.js` **362,293 B (+793 B)** = the same 303 B of shared CSS + **490 B** of enhancer, view and two-call-site wiring. Both §3.1 red-firsts were run and both fired: ★ **ROW 4 INVERTS AND THE ABLATION PROVES IT** — placing the `<figure>` OUTSIDE `.peekover-reader` (the direction four sibling suites assert for reader chrome) reds the containment assertion in Chromium AND Firefox, 4 failures, **while the golden diff stays EMPTY and the golden suite stays green (10/10)**, which is exactly why the assertion is written rather than transcribed; **ROWS 2+3** red-first by the ungate above reds the content-surface assertions in both engines while the app-page arm stays green. `diagramView.ts` and `mount.ts` were both restored FROM THE `cp` COPY, md5-identical, and **`mount.ts`'s diff is EMPTY** — 007 still touches it at zero sites. Coverage: 14 unit tests (`src/render/diagramEnhancer.test.ts`, real `mount()` output, not a hand-mocked tree) + 8 browser tests × 2 engines (`tests/browser/diagramRender.browser.test.ts`), including the two assertions jsdom structurally cannot make — the source `<pre>` computes `display:none` after the flip **while staying connected and still holding its source text** (both halves, with a visible-before control), and row 5's no-occlusion check against real paragraph rects at a wide viewport. Row 18's placeholder is `aria-hidden`. The untrusted-source rule is asserted with a payload that WOULD inject if assigned as markup (`<img src=x onerror=…>` plus a `</pre><script>` break-out): it round-trips through `textContent` byte-for-byte and materialises no `img` and no `script`, with a control proving the same string DOES produce an `<img>` when parsed into an inert `<template>`. One seam fact pinned rather than trimmed: markdown-it's fence text carries a TRAILING NEWLINE, so `diagramSourceOf` returns `source + '\n'` — 3.2 hands that to the engine as-is rather than this module silently editing the source it only reads. ★ **STILL OWED, UNCHANGED AND NOT ADDRESSED HERE: task 3.3's real-engine zero-network guard on D-6's measurement WINDOW.** 3.3 inherits this arc's harness lessons and should not re-derive them: the FIREFOX INERT-PARSE GOTCHA (`367d051` — parsing `@import url(X)` into any inert document CONSUMES the load for X and a later adoption is never retried, so a fetch control routed through a sanitizer reads NO-FETCH while the route is wide open; adopt markup no sanitizer has touched) and ADOPT-AND-WATCH-THE-WIRE (string-stripping is necessary, not sufficient — every lane must adopt into the LIVE document and observe requests, with a benign live control in the same stylesheet so "zero requests" is a result and not a dead probe). **TASK 3.2 IS DONE (`763f94d`) — ★ THE MERMAID LAZY CHUNK EXISTS FOR THE FIRST TIME, AND THE CONTENT SCRIPT DID NOT MOVE ONE BYTE.** The enhancer's ASYNC body: the engine is loaded THROUGH `diagramEngine.loadDiagramEngine` (D-13's single `import('mermaid')`, no second one added), each fence is rendered into OUR OWN offscreen container (D-6 step 1 — removed on our own `finally`), the returned STRING goes through `sanitizeSvg` → a `<template>`'s innerHTML → adopt `tpl.content` (`mount.ts:131-133` verbatim), and `markDiagramRendered` flips D-15. **The container is LIVE, in-document AND IN THE LIGHT DOM by necessity** — measurement needs a browsing context, and the engine locates its own temp elements with document-scoped selectors that do not pierce a shadow root. Renders are SEQUENTIAL because the container is shared and mermaid empties it at the top of every call (`svgContainingElement.innerHTML = ''`, `mermaid.core.mjs:1263`). `bindFunctions` is never called. 3.1's duplicated `DIAGRAM_FENCE_SELECTOR` is COLLAPSED — the enhancer now re-exports diagramEngine's, so the drift the equality pin guarded is unrepresentable. Two supporting changes tasks.md §3.2 requires: `suppressErrorRendering: true` joins `DIAGRAM_ENGINE_CONFIG` (§3.8's "mermaid's own injected error graphic is suppressed" as CONFIGURATION — without it a parse failure draws the bomb into the container before throwing, `mermaid.core.mjs:1289,1308`; the key is already in the hardened `secure` list, so a `%%{init}%%` directive cannot turn it back on), and `markDiagramFailed` now REQUIRES a reason and inserts §4's inline marker (`p.peekover-diagram-error`, `textContent`) into the slot the removed placeholder vacated. ★ **THE HEADLINE BYTES.** The content script is **315,974 B and md5-IDENTICAL to 3.1's on BOTH engines** (Chromium `033879be…`, Firefox `1f15a58d…`) — the engine never reached the content-script graph and 3.1's `contentWatch.ts` fence (no `render` passed) held. `chunks/` went from **ONE file to ONE HUNDRED**: mermaid's lazy graph is **99 chunks / 3,347,306 B** behind exactly **one** `import(\`./mermaid.core-DLWca8Az.js\`)` (34,946 B entry), never statically inlined, and the app chunk carries NO static import of any sibling chunk. The app chunk itself moved **362,293 → 370,387 B (+8,094)**, decomposed to the byte by FOUR one-variable ablations with no unnamed residual: **4,096** the SVG sanitizer profile now reachable for the first time (`sanitizeSvg`→identity: 366,291) · **2,049** dynamic-import glue + the 99 chunk descriptors (`import('mermaid')`→rejecting stub: 368,338, and `chunks/` falls back to ONE file — the causal control) · **1,304** the enhancer's async body + statement realign · **373** §3.8's marker (`markDiagramFailed` reverted to its 2-arg form: 370,014) · **272** `diagramEngine`'s own payload, the D-6 config object with its hardened `secure` list and the fence gate (stubbed: 370,115). Sum = 8,094 exactly. **A ladder build confirms the direction: with 3.1's enhancer restored the app chunk is 362,293 B and the same chunk HASH — every one of these bytes is 3.2's.** Confirmed with a FIRING CONTROL rather than a bare grep: `securityLevel` and `suppressErrorRendering` read 2× each, `peekover-diagram-measure` 1×, `htmlLabels` 1× in the app chunk and **0× on the content script**, and mermaid's own `Syntax error in text` lives in `chunks/mermaid.core-…` and reads 0 on the content script — while `data-diagram` reads **1** there (3.1's CSS rule), which is what proves the content-script grep FIRES and the zeros are results. ★ **These are this task's ordinary `pnpm build` figures, NOT the production milestone figure — 8.1 owned the § Baselines re-measure and **has now run it**; that table was UNCHANGED here.** ★ **THE FIRST REAL-ENGINE PROOF OF OPTION B, AND IT PASSES:** driven through the PRODUCTION path with nothing injected (`createReaderPane` → `select()` → `mount()` → `enhanceDiagrams` → the real `import('mermaid')`), the adopted `<style>` arrives **INERT AND STILL STYLING** — `@keyframes edge-animation-frame` and `dash` intact, `style.sheet.cssRules.length > 0`, every surviving `url(` a `#`-fragment, no `@import`, no `@font-face`, no `https?:`. `cleanSvgCss` had until now only met payloads we wrote for it. The adopted subtree carries no `foreignObject` and the source `<pre>` computes `display:none` while still holding its text. **§3.8's failure paths, each with a success control that HIDES the source on the SAME harness:** parse/render (a genuinely unparseable fence — the OTHER diagram in the document renders normally, the marker names it, and no empty figure is left: §4's "every other diagram… normally"), **sanitize rejection — the latest-moment case D-15 is shaped for** (the engine SUCCEEDED, asserted on its raw output, and the artifact then fails the profile: nothing survives, so there is nothing to adopt and the retained `<pre>` is simply still there), and engine-load (loader rejects; both fences visible, nothing stranded). ★ **SCOPE BOUNDARY, TAKEN FROM tasks.md RATHER THAN ASSUMED: §3.2's Verify names parse/render and sanitize rejection; ENGINE-LOAD is group 6's — its heading is "the two failures groups 3–5 cannot reach" and 6.1 owns the full proof** (no stranded placeholder, reader interactive, its own revert-and-fail). 3.2 ships the code path and a modest arm; it does not absorb 6.1. **REVERT-AND-FAIL, and it names the count in the defect's own units:** removing the per-fence catch reds 4 (2 tests × 2 engines) with *"enhancement never completed: 2 unrendered figure(s) and 2 fence(s) left pending, of 2 enhanced fences"* — one bad fence takes the whole document's enhancement down, which is exactly the claim the catch exists to make false; `diagramEnhancer.ts` restored FROM THE `cp` COPY, md5-identical (`508ead9a…`). The container's lifetime is asserted BOTH ways — observed PRESENT mid-render from the DOCUMENT (not from the argument we were handed) and absent afterwards, absent too when the render throws, with no engine temp element orphaned — because an empty tail is not an empty instrument. `bindFunctions` records 0 calls with a control proving the spy would have recorded one. Adoption-not-innerHTML is proven on REAL engine output with a `<script>`+`<img>` payload appended to it: neither materialises and `window.__peekoverAdoptLeak` stays undefined, while the same string in an inert `<template>` DOES produce both. D-12 parity holds on the RENDER path from both call sites. Coverage: **unit 631 → 643**, **browser 709 → 729 passed / 15 skipped** (10 new browser cases × 2 engines). One harness lesson banked for 3.3: the browser suite's `afterEach` now DRAINS in-flight renders, because the measuring container lives in `document.body` by necessity and a previous test's stray one reads as the next test's. `mount.ts` diff EMPTY (007 still touches it at zero sites), `sanitize.ts` and `contentWatch.ts` byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups. ★ **3.3's real-engine guard on D-6's measurement WINDOW — OWED AT THIS POINT, DISCHARGED AT THE END OF THIS ENTRY.** 3.2 opened that window for real — the container is live during every render — and closed none of it by construction; it inherits BOTH harness lessons above (the Firefox inert-parse gotcha and adopt-and-watch-the-wire) plus this task's: the window it must measure is the one `renderDiagrams` now owns, and the enhancer's injectable `loader` is the seam that lets a test wrap it. ★ **§4's SOURCE GUARD IS LANDED — `eae7b08` implements `4061398`'s Option 1, and it is NOT a numbered task: the group-3 pointer STAYED AT 3.3, which has since shipped and brought its own file with it.** `diagramEnhancer.ts` gains a pre-scan between `diagramSourceOf(pair.pre)` and `engine.render`: a fence whose SOURCE carries a remote reference never reaches the engine and degrades via `markDiagramFailed` — §3.8's existing path, a new reason string (*"its source references a remote resource"*), no new state and no `diagramView.ts` change. The source is READ once and handed to the engine unchanged, so D-15's read-only-source invariant holds. ★ **THE RED WAS TAKEN ON THE WIRE, NOT ON A STRING**, because a DOM-shape assertion here reads green by construction (the profile denies `image`, so the adopted artifact is clean whether or not the fetch fired — which is exactly how this stayed symptomless). Against the immediately-preceding code, in D-6's live window, **both engines identically**: ROUTE 1 (flowchart `A@{ img: … }`) put `http://localhost:PORT/__peekover_probe__/…/img-route.png` on the wire and then degraded anyway (`decode()` rejects) — a weak guard could pass it by accident; ★ ROUTE 2 (sequence `properties A: {"icon": …}`) put `…/icon-route.png` on the wire **AND RENDERED — one adopted `<svg>`, state `rendered`** — the silent success, and the only arm that distinguishes a guard that works from one that does not. With the guard both read `[]` window-scoped and whole-run, both fences degrade naming the cause, and the mixed document still renders its clean fence (§4's per-fence isolation, on a real engine). **The instrument is proven non-vacuous by a control that FIRES in the same file** — an `<image href>` built `createElementNS`-node-by-node into the LIVE measuring container, immune to the Firefox inert-parse gotcha by construction and to any engine version that removes a source route. Ablating the pre-scan reds 6 (3 arms × 2 engines) **while the control stays green**, which is the signature that says the guard and not the harness is what moved; `diagramEnhancer.ts` restored FROM the `cp` copy. ★ **THE PREDICATE'S BOUNDARY, ENUMERATED RATHER THAN ASSERTED — and it moved once during the build.** `\bhttps?:` + non-space, and `//` at a value position + a host character. Degrades: both fetch routes, `http:h.example/x` (no slashes — the URL parser resolves it), uppercase, and the **ACCEPTED COST** banked in `4061398` — `click A href`, sequence `link`, a URL in a node label, a URL in a `%%` comment. Does NOT degrade: `authtoken`, `A["Use HTTP: the fast one"]` (colon then space), `TCP//IP` / `and//or` / `50//50`, `./local.png`, `data:` URIs (**C4 `$sprite` travels that way and must keep working**), and — the case that made the trailing host-character class non-optional — **mermaid's OWN `--//`, `//--`, `-//`, `//-` sequence arrows**, whose slashes are followed by `-` or whitespace. **The one correction:** `xhttp://h.example/x` was drafted as clean on the reasoning that no browser fetches an unknown scheme; it degrades, because `:` is in the delimiter set — and that is KEPT, not loosened, since dropping `:` would reopen `img://h.example/x.png`, the unspaced spelling of route 1. So the line is: any `scheme://host` degrades (URL-shaped, conservative, version-independent); a non-URL substring must not, and none does. `sanitize.ts:187` corrected in the same commit as `4061398` required — *"`image` — no producer"* was FACTUALLY WRONG (two producers: `imageSquare`'s `append("image")`, `drawImage`'s `<image xlink:href>`); the denial stays and its reason is now "producers exist and are refused", **comment-only, and byte-proven so: an ablation build with `diagramEnhancer.ts` at HEAD and this comment in place returns the app chunk to 370,387 B exactly.** **Content script 315,974 B and md5-IDENTICAL both engines** (the guard is app-page only, as designed); app chunk **370,387 → 370,579 B (+192)**, all of it the guard, no unnamed residual. Coverage: **unit 643 → 673**, **browser 729 → 737 passed / 15 skipped** (the new `tests/browser/diagramSourceGuard.browser.test.ts`, 4 arms × 2 engines). `mount.ts`, `contentWatch.ts` and D-6's config byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` and no `web_accessible_resources` both engines, no new dependency. ★ **CARRY-FORWARD, AND IT CORRECTS `4061398`'s OWN CLOSING LINE.** That entry hands 3.3 the sequence `properties.icon` route as CONTROL A's successor. It cannot be — **the guard closes BOTH source routes, so neither fires through the production path any more.** 3.3's control must come from a seam the source pre-scan does not sit on: the live-container injection `eae7b08` already uses, or the engine driven directly past `enhanceDiagrams`. (Superseded again: `7a6dc63` then found a strictly better one — see below.) 3.3's file was untracked and UNTOUCHED by `eae7b08` (md5 `b37dfa2c…` before and after); its two CONTROL-A arms fail against the new code **by design**, which is precisely the succession 3.3 has to resolve. The committed tree is green with that file set aside: **86 files / 737 passed / 15 skipped.** **`7a6dc63` BANKED THE D-6 WINDOW FINDING (docs-only; `src/render/*` byte-untouched).** Before 3.3 shipped, a probe through the production path found that a RELATIVE reference — `img: "./x.png"`, `img: "/x.png"`, sequence `properties A: {"icon": "./x.png"}` — PASSES `eae7b08`'s guard BY DESIGN (the predicate is scoped to §4-*remote* references, and a relative reference is not remote), reaches `engine.render`, and **fetches inside D-6's live window**; `properties.icon` even RENDERS while fetching. So the plan's standing claim, *"the window issues no network for guard-passing source"*, was **FALSE as written**. The guard is CORRECT and deliberately NOT widened — in production such a reference resolves inside `chrome-extension://<id>`, package-local and excluded from `/^https?:/i` by scheme — and what changed is the CLAIM: *no OFF-ORIGIN request for guard-passing source*. `plan.md`'s D-6 residual-hole clause and row 22 took their third amendment there. ★ **TASK 3.3 IS DONE (`ace4543`) — THE OFF-ORIGIN GUARD ON D-6's MEASUREMENT WINDOW, and it DISCHARGES the note that clause has owed group 3 since `16c7790`.** `tests/browser/diagramNetwork.browser.test.ts` (untracked since the original 3.3 session) is REWORKED to the sharpened claim and shipped: 6 arms × 2 engines, test-only, no `src/*` change. ★ **THE INSTRUMENT HAS TWO TIERS, and that is the whole construction** — every prior red-first in this arc fired its control on the thing the claim DISCLAIMS, but here the live control fires INSIDE what the claim PERMITS. **TIER 1** (the live control): a real production render of a relative `properties.icon` passes the guard — asserted via `hasRemoteReference(doc) === false`, not asserted in a comment — reaches the engine, and the ENGINE puts `http://localhost:PORT/__peekover_probe__/d33-tier1/icon-rel.png` on the wire INSIDE the bracketed window **while the diagram RENDERS** (state `rendered`, one adopted `<svg>`), from author source no sanitizer has touched — D-6's named residual hole exactly. That is what makes the claim a MEASUREMENT rather than an absence: something really fetched, the observer really saw it, and what it saw was same-origin. **THE CLAIM**: five guard-passing sources — `benign`, `icon-rel`, `img-rel`, `img-dot-rel`, `tab-obfuscated` — each read `[]` off-origin window-scoped AND whole-run, both engines, with four of the five putting real traffic in the window (so the zero is a reading of live traffic, not of silence). **TIER 2** (the floor): an off-origin request injected `createElementNS`-node-by-node into the LIVE measuring container mid-window — `http://127.0.0.1:PORT/__peekover_probe__/d33-tier2/off-origin.png` — is seen on the wire AND in the claim's OWN `offOriginInWindow` list, both engines, while the benign fence still renders. **Without TIER 2 the claim would be unfalsifiable**: an observer blind to off-origin traffic reports the same zero over a wide-open window. An off-origin URL cannot come from author source (the guard degrades it before the window opens), so the floor must come from a seam the guard does not sit on, and that is CONTROL B's seam. ★ **LOOPBACK ONLY, INCLUDING THE OFF-ORIGIN FLOOR.** `127.0.0.1:PORT` against a `localhost:PORT` page is cross-origin by the same-origin rule and answered by the same local process: a REAL off-origin request that physically cannot leave the machine. No non-loopback host is named anywhere. ★ **THE CONTROL SUCCESSION, third replacement, recorded in the file itself.** CONTROL A (D-6's own, and §3.3's written Verify text) → a live §4 defect, closed by `eae7b08` → **SUCCEEDED BY TIER 1**, which keeps the property that mattered (the engine fetches, from untouched author source, in the window) via the relative reference the guard permits. CONTROL B → **TIER 2**, same seam and construction, off-origin href. §3.3's Verify language ("a diagram whose source references a remote image", "zero requests") is **STALE and superseded** — both were written before the guard and before `7a6dc63` — and the supersession is noted in the file; the INTENT (*the control fires under the same conditions the negative claim disclaims, or the negative result is worth nothing*) is met by TIER 1 and TIER 2 together, with nothing relaxed. ★ **THE SEVERITY BOUND IS NOW MEASURED, NOT DERIVED — `7a6dc63` recorded it as a derivation precisely so it would be re-derived.** An author naming a foreign host through a spelling the guard permits (a tab inside the scheme, written `\u0009` per AGENTS.md, never a literal byte) does not reach it: the WHATWG parser strips the tab, `http:host.example/…` matches the base scheme with no authority, and the request lands as `http://localhost:PORT/host.example/__peekover_probe__/d33-bound/tab.png` — **`host.example` demoted to a PATH SEGMENT on our own origin**, observed on the wire, in the window, both engines. ★ **A MEASURED HARNESS REFINEMENT, and it is why the claim MUST be off-origin-scoped rather than "zero".** `warmEngine` warms mermaid's core and the definition of the diagram type it renders ONLY — definitions register LAZILY, so a later `sequenceDiagram` still pulls `deps/sequenceDiagram-*.js`, same-origin harness module traffic, INSIDE the measurement window (observed both engines). A whole-buffer `toEqual([])` would therefore be measuring which diagram type the warm-up happened to use, not whether anything left our origin. **WINDOW vs ARTIFACT vs SOURCE-SCAN**, stated in the file's own words: this file owns the WINDOW (bracketed by the measuring container's lifetime, a deliberate SUPERSET of the true window); `diagramStyleCss` owns the ADOPTED ARTIFACT and is structurally blind here, because a window-phase request precedes any artifact — and one arm proves it by fetching while the render throws and NOTHING is ever adopted; `diagramSourceGuard` owns the PRE-ENGINE SOURCE SCAN. **THE HARNESS FOLD**, which `diagramSourceGuard` itself scheduled for this task (*"folding the two onto a shared helper belongs with 3.3, which is also when the second copy first exists"*): `tests/browser/helpers/diagramWindow.ts` — not a test file, the browser project's include is `**/*.test.ts` — now holds the wire predicate, the window bracket, the production driver and the injected-control construction. **PLUMBING ONLY: no control and no assertion in either file changed**, and `diagramSourceGuard` shrank 383 → 236 lines with its four arms intact. The helper's doc comment guards the one thing that must never be "simplified" — route the injected `<image href>` through a string and Firefox's inert-parse consumption (`367d051`) disarms BOTH files' floors at once. Coverage: **unit 673 unchanged** (test-only, browser-project file); **browser 737 → 749 passed / 15 skipped, 86 → 88 files**. **Content script 315,974 B and md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`), app chunk **370,579 B byte-identical** (same content-hash name `app-D3_Qug7S.js`) — 3.3 is test-only and the bundles prove it. `mount.ts`, `contentWatch.ts` and D-6's config byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. ★ **THE POINTER ADVANCES: group 3's LAST task is 3.4** — the cooldown constraint and the import fence (the enhancer must schedule and return synchronously in ~nothing, and `mermaid`/`diagramEngine`/`diagramEnhancer` must appear in NO content-script module graph, with the app-page graph as the control). Neither is a wire reading, so 3.3 leaves it untouched; 6.1 (engine-load FAILURE degradation) is likewise a different instrument from 3.3's COLD LOAD arm, which reads the load's TRAFFIC. **TASK 3.4 IS DONE (`522a3fe`) — THE COOLDOWN CONSTRAINT AND THE IMPORT FENCE, AND IT CLOSES GROUP 3.** Test-only: no `src/*` change, and both bundles prove it. ★ **THE IMPORT FENCE IS THE HALF THAT WAS NEVER ASSERTED.** All milestone long "mermaid never reaches the content script" has rested on a BYTE reading — 315,974 B unchanged, `grep -c mermaid` = 0 — which is a COINCIDENCE-DETECTOR: it catches a leak only when the leak moves bytes. **MEASURED at 3.4, and it does not:** a scratch `import { enhanceDiagrams } from './diagramEnhancer'` added to `mountReader.ts` (squarely on the content-script graph) builds to a content script that is **BYTE-IDENTICAL — 315,974 B, md5 `033879be…`, `grep -c mermaid` still 0**. The unused named export tree-shakes and the byte fence calls the architectural violation green. So `src/render/diagramImportFence.test.ts` (NEW, 8 assertions, `diffEngine.test.ts`'s source-text shape) asserts REACHABILITY over the source graph, walking every edge — static, dynamic and type-only — out of each entrypoint. **Clause A**: the content-script graph reaches neither `diagramEnhancer.ts` nor `diagramEngine.ts` and imports no `mermaid` specifier. **Clause B is the CONTROL and the reason A is readable**: the app-page graph, same walker same run, MUST reach both and MUST import `mermaid` — a broken traversal cannot satisfy both verdicts at once. **Clause C — the LAZINESS pin**: exactly one `mermaid` module import in the tree, in `diagramEngine.ts`, and it must be DYNAMIC; `mermaid/package.json` is the one permitted static specifier, named. **Clause D**: both graphs non-trivial with named landmarks, and every local specifier RESOLVED (an unresolved edge is a hole the fence cannot see through, so it fails loudly). ★ **BOTH RED-FIRSTS FIRED, and both left the byte fence green.** (i) the `mountReader.ts` import → clause A red naming `src/render/diagramEnhancer.ts` + `src/render/diagramEngine.ts`, content script 315,974 B unchanged. (ii) `export * as scratchMermaid from 'mermaid'` in `diagramEngine.ts` → clause C red on the STATIC form; content script again 315,974 B unchanged, while the app chunk went 370,579 → 453,816 B (+83,237) and the 34,946 B lazy `mermaid.core` chunk was INLINED — the eager-chunk failure the pin exists for, invisible to every byte fence this milestone actually enforces. Both restored from `cp` copies; pin green. **It is NOT `scripts/check-dynamic-imports.ts` again** — that script enforces SPECIFIER STATICNESS file-by-file with no notion of who reaches whom, and `import('mermaid')` passes it by design; this enforces GRAPH REACHABILITY. Neither subsumes the other and neither was extended. ★ **THE COOLDOWN HALF was already satisfied by 3.1's construction — 3.4 PROVES it, and does not manufacture a change.** `watchController.renderNow` (`:422`) times its whole synchronous block and multiplies the result into the next cooldown, and on the app page that block contains `appShell.ts:132`'s `renderWithDiagrams` = `mount` + `enhanceDiagrams`. Two unit assertions on ONE clock with a fake engine that BURNS a real blocking 40 ms: at the instant the enhancer returns the placeholder is committed, the engine's `render` is un-called, no measuring container exists, and the block cost **0.22 ms**; the same engine driven INLINE — the shape an awaiting enhancer would leave `renderNow` holding — cost **40.43 ms** against the shipped **0.83 ms**. **The control fires**: the inline number reads the burn, so the fast number is a result and not an engine that costs nothing. ★ **THE BROWSER HALF: a watch re-render RE-ENHANCES, driven through `installWatchForFile` and NEVER a hand-built controller** — four sibling watch suites construct `createWatchController` directly and take the DEFAULT bare-`mount` render, so only the shipped app page can prove this. mountAppShell → open folder → click the file → click the pill → change the bytes `read()` returns → wait out a real 1 s poll. **Verified RED by ablating `render: renderWithDiagrams` at `appShell.ts:820`**: both engines time out — the document re-renders with the new text and grows NO figure. Restored from a copy. The control inside the test is `replaceChildren` itself: the pre-change figure's `isConnected` is asserted FALSE, so the figure found afterwards is a new element something had to build. **A HARNESS FINDING worth the note:** `pollingDetector` treats its first read after `start()` as the BASELINE and delivers nothing (`changeDetector.ts:106-108`), so bytes changed between the pill click and that poll are never a CHANGE — the first cut of this test timed out with 11 polls and no re-render, and the fixture now counts reads and waits for the baseline to land. Coverage: **unit 673 → 683** (+8 fence, +2 cooldown), **browser 749 → 751 / 15 skipped**. **Content script 315,974 B, md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`); **app chunk 370,579 B byte-identical** (same content-hash name `app-D3_Qug7S.js`); the **mermaid chunk is still SEPARATE and LAZY** — 34,946 B, reached only by ``import(`./mermaid.core-CgC7yF9q.js`)``, the fence's own precondition re-verified rather than assumed. `mount.ts` and `contentWatch.ts` byte-identical, golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. ★ **THE POINTER ADVANCES: GROUP 3 IS COMPLETE** (3.1 `1e09164` · 3.2 `763f94d` · 3.3 `ace4543` · 3.4 `522a3fe`), and with it the whole §4 remote-reference sub-arc (`4061398` · `eae7b08` · `7a6dc63`). **NEXT: GROUP 4 — the cache, END-TO-END (D-2 · D-3 · D-4 · D-14)**, explicitly outside 3.4's boundary and the first group whose subject is persistence rather than rendering. **TASK 4.1 IS DONE (`443bdee`) — `src/app/diagramCache.ts`, THE PURE LAYER, AND IT STORES NOTHING.** D-3's key derivation and D-4's eviction PLANNING, WIRED TO NOTHING: no IndexedDB, no `store.ts` change (4.2), no enhancer wiring (4.3). ★ **GROUP 4 IS A DIFFERENT KIND OF TERRAIN AND THE RED-FIRSTS SHIFTED WITH IT — CORRECTNESS, NOT TRUST.** Groups 2–3 proved *nothing leaks*, so their controls FETCHED when they shouldn't; this module has no I/O at all and cannot leak. What it can do is return the WRONG ANSWER, so both controls fail on IDENTITY — a named key, a named row — never on a count, because a count is exactly what a wrong-axis implementation still gets right. **THE KEY (D-3):** `hash + SEP + theme + SEP + engineVersion` as the keyPath VALUE — SHA-256 of the fence text via `crypto.subtle.digest`, hex (greenfield; pinned to the published empty-string and `abc` vectors so "64 hex characters" cannot pass for any hash-shaped string), the **EFFECTIVE** theme (`EffectiveTheme` in the signature, so passing `'auto'` is a COMPILE error rather than a runtime collision between two renderings sharing one row), and the engine version passed in from 1.2's resolved-package read. `SEP` IMPORTED from `recents.ts:52`, never re-declared (grep: it is still the only declaration in `src/`). **★ RED-FIRST 1 — KEY COLLISION:** ablating the key to `hash` alone reds SIX cases, and the load-bearing one reds AT THE ROW LEVEL — *expected […] to have a length of 2 but got 1*: the dark render REPLACES the light one, which is the §3.7 bug the compound-in-keyPath shape exists to prevent (after the first flip, every subsequent flip in either direction must be a HIT, and that needs both renderings to coexist as rows). Restored from a copy. **★ RED-FIRST 2 — EVICTION IDENTITY (D-4's discriminator):** a fixture built so `lastUsed`-ordering and creation-ordering DISAGREE about which row goes — `read-now-old-row` is oldest by creation but most-recently-used, `stale-new-row` the reverse — with only the count bound binding, so exactly ONE row is evicted either way. Ablating the ordering axis to `createdAt` reds naming the WRONG ROWS: *expected ['read-now-old-row'] to deeply equal ['stale-new-row']*, plus *to not include 'read-now-old-row'* and the touch case. **The count is identical in both runs — only the NAME moves**, which is the whole point: `toHaveLength(1)` would have passed against the bug. Restored from a copy, green. `read-now-old-row` is D-4's actual scenario — the light rendering of the diagram being read RIGHT NOW, thrown away because it was first rendered before lunch. Also asserted: all three GLOBAL sweeps (age, count, bytes) each in isolation; MULTI-BOUND SIMULTANEITY (a store violating all three at once is within ALL THREE afterwards **and still contains the incoming row** — a plan that satisfies the bounds by discarding what it was asked to store would pass the three checks and be useless); SINGLE-OVERSIZED refused whole with NO eviction, against a store that WOULD have been swept on all three axes so the claim is not vacuous; keys round-trip through `split(SEP)`; re-writing an existing key REPLACES its row rather than appending (the key is deterministic and the keyPath is `key`, so an append-shaped projection would double-count bytes and evict for no reason). **★ THE BOUND VALUES ARE PROPOSED, NOT CHOSEN, AND NOTHING HERE MAY BE CITED AS A DECISION** — `PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS`, each carrying the reasoning for the STARTING POINT (what measurement should push against) rather than a justification of the value; 8.1–8.3 measure, **8.4 is the human gate that chooses**, and 8.5 SET them and removed the PROPOSED framing. Per D-8 **no unit case pins a bound value as an expected number** — every fixture passes small explicit bounds, and the one constants case is STRUCTURAL (`PROPOSED_BOUNDS` is composed of the three named constants), so all of it stays green across 8.5's swap. **BOUNDARIES HELD:** `planDiagramWrite` is a SIBLING of `planSnapshotWrite`, never a generalisation — the header says why in the terms that make the tidy-up read as the behaviour change it is (this cache has no document for a count to be per-), and `snapshots.ts` is byte-identical; `bytesOf` is IMPORTED and re-exported from `snapshots.ts:126-128`, asserted with `expect(bytesOf).toBe(snapshotBytesOf)` so a future re-implementation reds rather than diverging quietly (grep: still the only definition in `src/`). ★ **THE 4.1 FENCE — THE MODULE IS IMPORTED BY NOTHING, AND THE BUNDLES PROVE IT:** content script **315,974 B and md5-IDENTICAL both engines** (`033879be…` / `1f15a58d…`), app chunk byte-identical (same content-hash name `app-D3_Qug7S.js`, `005c6664…`) — a new module that moved either bundle would have reached a graph it has no business on at 4.1. `mount.ts`, `contentWatch.ts` and `store.ts` byte-identical (4.1 touches none of them). Coverage: **unit 683 → 706** (+23), browser untouched (this module has no browser projection — it is arithmetic and hashing). ★ **A NUL FINDING, AND THE TWO-FORM CHECK IS WHY IT WAS CAUGHT:** the test file was authored with a LITERAL U+0000 byte inside `not.toContain(…)` — the assertion still passed, and `grep` reported only *Binary file matches*. `tr -d -c '\000' | wc -c` and the python byte count both read **1**, located it at offset 7390, and it was rewritten to the `\u0000` ESCAPE per AGENTS.md. Both forms now read **ZERO** on both files; the `grep -c` form is vacuous in Git Bash (an empty pattern matches every line) and was not used. Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency. **GROUP 4 IS OPEN, 4.1 DONE.** **TASK 4.2 IS DONE (`01339fd`) — THE SCHEMA BUMP, AND IT STORES NOTHING.** `DB_VERSION` 3 → 4 with `diagramMeta` (keyPath `key`, `{key, bytes, lastUsed}`) and `diagrams` (keyPath `key`, `{key, svg}`) APPENDED to `SCHEMA` — **two stores, not one (D-2)**: `getAll` documents itself for “small bounded stores — no cursor needed” (`idbCore.ts:116-119`) and `describeStored()` materialises whole stores, so an inline SVG would deserialise every cached diagram on every trust-panel open. Additive-by-name, **no migration code**; `idbCore.ts` **byte-identical** (`47f32731…` before and after) and its `:5-9` STOP signal **NOT tripped** — no index, no compound key, no cursor, no new `idbCore` function (D-3's key is a single composite STRING, so one `keyPath` suffices). ★ **THE RED-FIRST IS MIGRATION-SURVIVAL, AND IT REDS ON THE EXISTING ROWS, NOT THE NEW STORES** — 006 §3-4's gap re-closed for this bump, on REAL engines both (versionchange is jsdom-blind): a v3 DB seeded with a row in ALL SIX existing stores, opened at v4 through the production `SCHEMA`, every row surviving byte-identical. Dropping `snapshots` from `SCHEMA` reds *preserves the seeded snapshots row byte-identical across the v3→v4 bump* with `expected null to deeply equal [ { id: 'seed-snap', … } ]` — it NAMES the lost store and the lost row, not “expected true” — while *creates the two 4.2 diagram stores, present and EMPTY* stays GREEN under the same ablation, which is the whole point: the discriminator sits on the DANGEROUS half. The seed's store list is derived FROM `SCHEMA`, so a drop or rename propagates into it. **006's arm was PINNED, not left to drift:** `SCHEMA` is now v4, so the existing v2→v3 case would have silently become a v2→**v4** jump; a derived `schemaAtV3` (store.ts's stores minus the two 4.2 adds, pinned to version 3) keeps 006's SINGLE additive step exactly as 006 specified it, still live-coupled to `SCHEMA`. ★ **A FENCE PREMISE WAS WRONG, AND THE CORRECTION IS THE FINDING:** the task fence read *content script MUST NOT MOVE — store.ts's schema is app-page*, and the content script MOVED **315,974 → 316,087 (+113)** both engines. `store.ts` has been on the CONTENT-SCRIPT graph since **006**, via the capture wiring — `peekover.content.ts:6` → `contentWatch.ts` → `watchController.ts:140` (`storeSnapshot`) → `snapshots.ts:23` `import { connection, STORES } from './store'`, where `connection` drags the memoized `db()` that references `SCHEMA`. Nothing 4.2 did pulled it there: the pre-4.2 bundle ALREADY carried `folders`/`recents`/`pins`/`snapshotMeta`/`snapshots` (the grep FIRED 4/3/3/6/8 — a live control, not a silent zero). The +113 is accounted to the byte by ablation: `DB_VERSION` 3→4 ALONE rebuilds at exactly **315,974** content-script and **370,579** app chunk (md5 shifts only because the literal `3` became `4`, same length), and the two descriptors alone carry the delta — `diagramMeta:"diagramMeta",diagrams:"diagrams",` **46 B** + `{name:e.diagramMeta,keyPath:"key"},{name:e.diagrams,keyPath:"key"},` **67 B** = **113 B, ZERO residual**; app chunk 370,579 → 370,692 (+113), same decomposition. **The fence is CORRECTED for the rest of group 4: “content script must not move” → “content script moves by the ACCOUNTED schema delta.”** Coverage: **unit 706 → 709** (+4 cases for the v4 schema shape, −1 for the now-false “declares version 3”), **browser 751 → 769** (+18 = 9 new cases × Cr+Fx). Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, tasks.md still 28 tasks / 9 groups, no new dependency; `mount.ts`, `contentWatch.ts`, `diagramEnhancer.ts` and `diagramCache.ts` byte-identical. ★ **4.2's carried seam question is ANSWERED, and the answer is ZERO:** the cache reached the enhancer with the content script **byte- AND md5-identical on both engines (316,087 B, `15c96c50…` / `73427eca…`)** — not a permitted delta, none at all. The edge runs ONE WAY by construction: `diagramCache.ts` imports `store.ts`, `store.ts` never imports `diagramCache.ts` (`describeStored` spells the `diagramMeta` row shape INLINE rather than importing it), and the cache's only importer is `diagramEnhancer.ts`, which the content-script entry cannot reach. **3.4's structural import fence is GREEN (8/8) both before and after the wiring** — the gate that matters, since a type-only or tree-shaken edge moves no bytes for the byte fence to see. **TASK 4.3 IS DONE** — ★ THE CACHING COMMIT, and it did NOT split: all six parts in one commit (D-14 / §3.9). (1) `cacheGet`/`storeDiagram` reach the enhancer, `planDiagramWrite` on write, `lastUsed` touched on hit; (2) `StoredSummary.diagrams` REQUIRED; (3) the `buildStoredLines` line through the reused `humanBytes`, `describeStored` reading `diagramMeta` ONLY (D-2), `wipeAll` gaining two `clear()`s, a new narrow `clearDiagramCache()`; (4) `storageControls.ts`'s THIRD control in the erase pair's disabled-at-zero + inline-confirm shape; (5) the panel line and (6) the `PERMISSIONS.md` ledger row, both applied **VERBATIM** from `cab93c7` (a). ★ **THE VERBATIM DIFF IS THE MECHANISM, NOT A PROMISE:** a script re-extracts the five ledger columns + the panel line from `decisions.md` and `difflib`-diffs them against the shipped text (the panel line reassembled from `store.ts`'s template + `storageControls.ts`'s button label, with `N`/`size` substituted back) — **all six diffs EMPTY**. `PERMISSIONS.md:42`'s two stale derived facts are true again (**eight** stores at `DB_VERSION` **4**; “clears **all eight**”), and the heading + parenthetical now enumerate M7's capability. ★ **THE INTENDED BUILD BREAK FIRED, AND IT CAUGHT SIX SITES, NOT ONE.** Making `diagrams` REQUIRED broke `tsc` at `appShell.ts:584`'s duplicated `EMPTY_SUMMARY` exactly as tasks.md predicted — **plus five more forgotten literals** (`appShell.test.ts` ×3, `store.test.ts`'s `lines()` helper, `captureToggle.browser.test.ts`). All fixed; the field was NEVER made optional. The forcing function works, and its reach is wider than the one site the task named. ★ **A REAL DEFECT WAS FOUND BY A SIBLING SUITE — CACHE POISONING.** The write was first placed on the engine's return, BEFORE `sanitizeSvg`. `diagramRender.browser.test.ts`'s sanitize-rejection case went red (`expected 'failed' to be 'rendered'`): a rejected artifact was being CACHED and re-served forever, turning §3.8's transient failure into a permanent, cached, invisible one. The write now lands **after the sanitize check passes and before `markDiagramRendered`** — which also makes “the document settled” mean “and its diagrams are cached” (one observable, no write/re-render race). It still stores the ENGINE's string, never the sanitized one, so every hit re-runs the CURRENT profile. Its own guard is in `diagramCache.browser.test.ts`, verified red against the pre-sanitize write. ★ **RED-FIRSTS, all three restored from a `cp`:** (a) ablating the cache lookup reds the hit assertions in the defect's own units (`expected 1 to be +0` — the extra engine invocation); (b) a `clearDiagramCache` that also clears the settings store reds **exactly ONE** survivor (`the reader settings row must survive: expected 'auto' to be 'dark'`); (c) the poisoning write reds only its own guard. The cache-hit case is non-vacuous **in the same test** — the FIRST render invokes the engine (1), the second does not (0), off one counter — and D-3's three components each get a case: source and theme end-to-end, engine version SEEDED (a row under a bogus version is unreachable; the same seed under the real version hits, same test). ★ **NUL CHECK CAUGHT A LIVE ONE.** `wipe.browser.test.ts` carried **3 literal NUL bytes** written by my own heredoc (0 at HEAD) — and the suite was GREEN with them, which is the whole trap. Replaced with the IMPORTED `SEP`; both forms (`tr -d -c`, python `count(b'\x00')`) now read **0** across all eleven touched files. App chunk **370,692 → 377,847 (+7,155)**, accounted by ablation with **zero residual** at the time of measurement (377,819): **+5,574** = 4.1's pure module becoming REACHABLE for the first time (it was tree-shaken out entirely) plus the enhancer wiring, **+1,055** = the third control, **+498** = `store.ts` + `appShell.ts`'s trust surface. Coverage: **unit 709 → 720** (+11), **browser 769 → 787** (+18 = 9 cases × Cr+Fx), browser ALL GREEN. Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, `idbCore.ts` / `mount.ts` / `contentWatch.ts` byte-identical, no multi-store transaction helper, no `folderIds[]` index, no purge-on-bump logic, no new dependency. ★ **THE POINTER ADVANCED AT 4.3 AND ADVANCES AGAIN HERE.** ★ **TASK 4.4 IS DONE (`f133913`) — THE CACHE UNDER WATCH, THE CASE IT EXISTS FOR, AND GROUP 4 IS COMPLETE.** A TEST-ONLY task: no production file moved, and every bundle fence is byte-identical — content script **316,087 B both engines with both md5s unchanged**, app chunk `app-DATW43gA.js` **377,847 B** with the CONTENT HASH ITSELF unchanged (which is byte-identity stated by the bundler rather than by me). ★ **THE HIT IS PROVEN THROUGH THE PRODUCTION WATCH PATH, NEVER A HAND-BUILT CONTROLLER** — 3.4's harness reused whole (`mountAppShell` → open folder → click the file, whose synchronous head runs `installWatchForFile` → click the shipped pill → mutate the bytes `read()` returns → wait out a real 1 s poll, with the reads-counter that waits for the detector’s BASELINE before editing). `render: renderWithDiagrams` is provisioned at exactly ONE site (`appShell.ts:845`) and a hand-built `createWatchController` takes the DEFAULT bare `mount` — so a hit measured on one would be a hit on a path production does not run (3.4's banked trap, inherited whole). **THE DISCRIMINATOR:** the prose changes and the fence stays byte-identical → the diagram serves FROM CACHE with the engine **NOT invoked (0)**, while the re-render demonstrably HAPPENED — the new prose is in the reader AND the pre-change figure's `isConnected` is FALSE, so `replaceChildren` destroyed it and something had to BUILD the figure found afterwards. **NON-VACUOUS ON BOTH SIDES, same test, same counter:** the FIRST render invokes the engine (**1**, cold cache), and a second edit changing the FENCE ONLY — prose byte-identical — invokes it again (**1**), so the zero is a HIT rather than a re-render that never reached the diagram. Counting through a seam with NO injected loader is done by spying `mermaid.render` (the very object `loadDiagramEngine` returns) with call-through and `mockRestore` — **production grew no test seam**, which was the alternative and would have been the test dictating the shape of the thing it measures. ★ **REVERT-AND-FAIL:** bypassing the cache lookup in `diagramEnhancer.ts` reds the hit assertion on **BOTH** engines in the defect’s own units — `expected 1 to be +0`, the extra engine invocation, named by the assertion message — and reds it **AT** the hit assertion, so the re-render and the rebuild still happened and only the engine count moved. Restored from a `cp`; green both engines. ★ **THE SINGLE-OVERSIZED QUIET PATH — PRESENCE *AND* ABSENCE BOTH ASSERTED**, because an absent error and an absent diagram look identical and a test checking only “no marker” would read green over a fence that never drew. A REAL engine artifact padded past the whole byte bound (padding is `<text>`, which the SVG profile KEEPS, so what is refused is an oversized DIAGRAM and not a sanitize casualty) **renders normally** (figure present with its `<svg>`, state `rendered` — non-vacuous against a control diagram that really drew through the same helper), **surfaces NO marker and no `failed` fence**, is **NOT stored** (asserted against its OWN key, which reads `undefined`), and **EVICTS NOTHING** — the pre-existing row survives by count AND by bytes, and still SERVES (a later render of it hits, so “evicts nothing” is behaviour and not merely a count). The PURE half sharpens the same claim in `diagramCache.test.ts`: **ONE BYTE decides it** against the same populated store (at the bound → stored, evicting `kept`; one over → refused, `kept` surviving — so no make-room-then-fail path can cost a user cached diagrams), the refusal holds against an EMPTY store (it is about SIZE, never headroom), and an oversized write does not displace **the row already at its own key** — the short-circuit runs BEFORE the projection, so a diagram whose SVG outgrew the bound leaves its smaller, valid, still-serving entry untouched. Coverage: **unit 720 → 723** (+3), **browser 787 → 791** (+4 = 2 cases × Cr+Fx), all green — the single unit red is the PRE-EXISTING `pipeline.perf.test.ts` machine-load budget, green in isolation and unrelated. NUL check **0** both forms across both touched files, **with a firing control** (a real-NUL fixture reads 1 on both forms — and the first attempt did NOT fire: bash `$’\x00’` collapses to an EMPTY pattern and `grep -c` returned the LINE COUNT, 661/436, which reads exactly like a huge NUL count; `grep -acP ’\x00’` plus a byte scan is the pair that actually answers). Golden EMPTY, manifest 2,975 B, `permissions: []` both engines, 3.4’s import fence green, `idbCore.ts` / `diagramCache.ts` / `mount.ts` / `contentWatch.ts` byte-identical, no new dependency. ★ **THE POINTER ADVANCES: 4.4 DONE — GROUP 4 (THE CACHE, END-TO-END: D-2 · D-3 · D-4 · D-14) IS COMPLETE. NEXT: 5.1 — GROUP 5, THEME SYNC (D-7)**: the re-theme trigger is a NEW notification at `applyTheme()`, **NOT** `onThemeSettingChange()` — the obvious seam is wrong for the reason its own doc comment gives (`reader.ts:108-112`: an OS flip under `auto` changes what paints but NOT the setting), and the red-first is the defect the decision exists to prevent. One thing group 4 hands it: the cache already partitions on the EFFECTIVE theme (D-3) and `diagramCache.browser.test.ts` proves both renderings COEXIST as rows, so §3.7’s every-subsequent-flip-is-a-hit is a property group 5 INHERITS rather than one it must build. **Task 5.1 (`85d5cbc`) is DONE — GROUP 5 (THEME SYNC, D-7) IS OPEN.** ★ **THE HEADLINE IS THE WRONG-CHANNEL RED-FIRST**, and it is what makes D-7 a decision rather than a preference: a build subscribed to `onThemeSettingChange` leaves EVERY rendered diagram at the old theme on an OS flip under `auto` **while the page around it repaints** — fired on BOTH engines, in the DEFAULT configuration (`DEFAULT_SETTINGS.theme` IS `'auto'`, `settings.ts:39`), and reading as `expected 'light' to be 'dark'` on **`data-diagram-theme`**, the new per-figure attribute that NAMES the stale rendering rather than reporting a bare boolean. The test asserts the host repaint FIRST (`data-theme` → `dark`) so the red cannot be misread as “the flip never happened”, and re-asserts that the SETTING never moved — nothing on the channel D-7 rejected could have carried the change. The fix subscribes at `applyTheme()` (`themeRegistry.ts`’s new `onEffectiveThemeChange`), the ONE broadcast both paths go through: the setting writer (`reader.ts:89`) AND the OS-flip listener (`reader.ts:157`). **ADDITIVE, and the control for it is the four PRE-EXISTING `themeRegistry.test.ts` cases** — unchanged, green at HEAD (`f133913`) before the listener existed and still green with it: the attribute writes are untouched and the notification is strictly AFTER them, so a listener that reads the DOM sees the theme already applied, never the one being replaced. **NEVER BLANK is D-15’s doing, and it is asserted TWO ways.** The mechanism is re-render-and-swap, not mutate-in-place (a themed mermaid SVG differs in fills, strokes, marker defs and its generated `<style>` — there is no set of attributes to patch that is equivalent to what the engine emits at the other theme); the old rendering stays on screen for the WHOLE async re-key/look-up/render, and the swap is one synchronous `replaceChildren` with the replacement ALREADY built. The frame sampler is the weaker half (>5 samples, min = max = 1 — never blank, never two diagrams at once); the **MutationObserver replay is the half that matters**, because it sees the 1 → 0 → 1 an empty-then-fill implementation passes through BETWEEN two mutations in the same task — a blank NO frame can observe. Both halves are non-vacuous: the replay proves a real swap (≥2 mutations) and the original `<svg>` is proven GONE from the figure. **The SECOND flip is a HIT, inherited whole from group 4** — §3.7’s round trip lands on the two coexisting rows 4.3 already proved (engine invocations 0), so group 5 built nothing for it. A failure at the new theme **KEEPS THE PREVIOUS RENDERING** rather than calling `markDiagramFailed`: a correct picture at the old theme beats an error marker, and the staleness it reports is the lesser outcome. ★ **THE CONCURRENCY FIX, itself red-first — and the first attempt at it was WRONG.** `applyTheme` broadcasts on EVERY theme write, so duplicate broadcasts are ordinary rather than pathological (a settings load landing on the theme the OS already resolved to; two surfaces writing the same theme) — in the harness, by the third test in a file ONE flip arrived THREE times and ran the engine three times per diagram. In-flight COALESCING declines a broadcast for a theme a host is already rendering to, and pass SUPERSESSION stops an older pass committing after a newer one (two quick flips would otherwise put the OLDER theme back on screen PERMANENTLY — a stale diagram produced by the very mechanism that exists to prevent one). **3 renders per flip → 1.** The first fix counted supersession PER BROADCAST and had exactly the bug it was meant to fix: every flip cancelled ITSELF and nothing ever re-themed. Only a pass that ACTUALLY STARTS may claim the slot, so a coalesced duplicate cannot supersede the pass it deferred to. **`drawDiagram` is EXTRACTED, not duplicated** — the first render and the re-theme share ONE implementation, because a second copy is where the cache write’s three ordering constraints would drift apart; the theme is a PARAMETER rather than a `currentEffectiveTheme()` read inside, so the key cannot disagree with what the hosts now carry. ★ **THE FENCE IS RE-BASELINED, AND THE OLD WORDING WAS MIS-SPECIFIED.** `themeRegistry.ts` IS on the content-script graph at HEAD (`reader.ts:44` imports it), so `applyTheme` ships in the content script and D-7’s notify loop moves it BY NECESSITY: **316,122 B both engines**, **+35 B**, ablation-accounted to zero residual. “The content script must not move” was never the real constraint; the real one is **“it moves ONLY by the D-7 notify loop, and the ENHANCER stays off the content-script graph”** — banked here so the next theme-touching task does not re-trip it (4.2’s fence-correction precedent). The enhancer’s absence is proved TWICE: 3.4’s **STRUCTURAL** import fence green **8/8** (the reachability walk, not a byte reading — 5.1 is the first task wiring the enhancer to a module that IS on that graph, so this is the check that matters), and `enhanceDiagrams` / `mermaid` / `diagramCacheKey` / `data-diagram-theme` all grep **0** in both bundles **with a firing control taken from the CHANGED FILE ITSELF** — `data-theme` (`themeRegistry.ts`’s own `THEME_ATTR`) reads **7**, so the grep is demonstrably sensitive in exactly the region D-7 touched and `data-diagram-theme`’s 0 is a real absence, not a dead needle. The two engine bundles are NOT md5-equal and never were: they differ by exactly ONE byte at offset 312,846, the pre-existing `backgroundCanReadFileUrls:!0/!1` capability flag, unrelated to 5.1. Coverage: **unit 723 → 728** (+5), **browser 791 → 799 passed / 15 skipped** (+8 = 4 cases × Cr+Fx), ALL GREEN — and 4.4’s PRE-EXISTING `pipeline.perf.test.ts` machine-load red is green in this run too, so the suite is clean end to end. `eslint` + `tsc --noEmit` clean. NUL check **0** both forms. Golden EMPTY, `permissions: []` both engines, `idbCore.ts` / `diagramCache.ts` (pure layer) / `mount.ts` / `contentWatch.ts` byte-identical, no new dependency. ⚠ **MEASURED manifest 654 B (Chrome) / 770 B (Firefox)** — the “manifest 2,975 B” figure repeated by entries 3.1–4.4 matches NO artifact in the tree (no 2,975-byte file exists anywhere in `.output/` or the repo); it is carried, not measured. NOT edited retroactively here — flagged for 8.1, which owns the baseline re-measure. ⚠ **§ Baselines is STALE and is deliberately NOT touched by 5.1 (`85d5cbc`), nor by 5.2**: its table still records the content script at **315,671 B** (row `Content script (content-scripts/peekover.js)`, measured 2026-07-27 at `d470ab2`), against **316,122 B** today. Reconciliation belongs to 8.1 / 9.3 (the staleness routing already recorded there), not to a group-5 task — the figure is flagged, not edited. **TWO FLAGS, both raised, both APPROVED, both recorded**: the fence re-baseline above, and `diagramCache.browser.test.ts`’s new `detachMountedHosts()` — a MECHANISM-FORCED test-premise update, NOT a regression silenced. 4.3’s D-3-component-2 case assumed “a flip only affects the measured pass”; D-7 makes that assumption FALSE BY DESIGN, because every open reader now follows the effective theme, so a host still connected from an earlier pass legitimately re-renders onto that file’s SHARED spy. The re-theme skips detached hosts by its own `isConnected` prune. ★ **THE POINTER ADVANCES: 5.1 DONE — GROUP 5 (THEME SYNC, D-7) IS OPEN. NEXT: 5.2** — the flip-cost measurement, which **PRODUCES NUMBERS AND CHOOSES NOTHING**: gate 2 re-routed §7-9’s flip cost to **gate 3**, so no budget, threshold or optimisation may be decided from it inside group 5. **TASK 5.2 IS DONE — GROUP 5 (THEME SYNC, D-7) IS COMPLETE. IT MEASURES, AND IT CHOOSES NOTHING.** §5.2's Files list is *"measurement notes into the task report + `docs/ai/progress.md` (numbers only, nothing chosen)"* — a **DOC measurement, NOT a committed test**, so **no test file entered the suite and no time-bound assertion exists anywhere**: a committed *"flip cost < N ms"* would both FLAKE on machine load and SMUGGLE IN the threshold 8.4 owns. The harness was a scratch `tests/browser/diagramFlipCost.scratch.browser.test.ts`, run once per engine and **DELETED** — no production file touched, both bundles unchanged. ★ **THE WORST CASE — 50 diagrams, the FIRST flip to a never-rendered theme (a FULL MISS on every one), wall-clock from the `applyTheme` broadcast to the last figure re-themed, 7 repetitions: Chromium floor 522.3 ms / median 538.9 ms · Firefox floor 900.0 ms / median 910.0 ms.** The SECOND flip back is a **FULL HIT — Chromium floor 107.5 / median 114.6 · Firefox floor 202.0 / median 213.0**, roughly a **fifth** of the miss, which is §3.7's round trip on group 4's two rows paying for itself. Per-diagram amortized on the miss flip: **10.8 ms Chromium / 18.2 ms Firefox** (median; floors 10.4 / 18.0). ★ **A-B-A, AND THE BRACKETS AGREE**: the control is a same-session 50-diagram COLD INITIAL RENDER interleaved before and after every flip — **Chromium A-early median 516.0 vs A-late 503.8 (drift −2.4%)**, **Firefox 691.0 vs 688.0 (−0.4%)**. The environment held still, so the middle numbers stand rather than being a guess about a busy machine. (Firefox's B series carries one 1,382 ms outlier against a 900–995 ms body — precisely why the **FLOOR is reported beside the median**: the floor is the run nothing else interfered with.) ★ **NON-VACUITY, ASSERTED NOT ASSUMED**: the miss flip invoked the engine **exactly 50 times in all 7 reps on BOTH engines**, the hit flip **exactly 0**, and the store held **100 rows** (50 sources × 2 themes) — a measurement of the wrong number of renders measures nothing. **DECOMPOSITION — CACHE WRITE-THROUGH DOES NOT DOMINATE; THE ENGINE DOES**: `engine.render` is **77.2%** of the miss flip on Chromium (median 416.2 of 538.9) and **76.4%** on Firefox (695.0 of 910.0); the remaining 22.8% / 23.6% is almost entirely the per-figure path the HIT flip also pays (114.6 / 213.0), leaving IDB write-through at a **directional 8.1 ms (1.5%) Chromium / 2.0 ms (0.2%) Firefox**. **NO FLICKER AT 50 DIAGRAMS**: across the full-miss flip the frame sampler (43 frames Chromium / 85 Firefox) and the MutationObserver replay (52 records both) each read a **constant 50 `<svg>`** — **zero** frames and **zero** replay points below 50, so §4's keep-previous-visible holds at scale exactly as 5.1 proved it at one. ⚠ **A FINDING ROUTED TO 8.4, NOT A DECISION TAKEN HERE: the 50-diagram fixture SATURATES `PROPOSED_DIAGRAM_COUNT` (100) EXACTLY** — 50 sources × 2 themes = 100 rows, and `planDiagramWrite`'s count sweep evicts only on `excess > 0`, so the flip-back is a full hit **by one row**. At 51 diagrams it would not be, and the second flip would stop being free. Reported; **the bound value is 8.4's to choose, not 5.2's.** ★ **NOTHING WAS CHOSEN AND NOTHING WAS BUILT**: no threshold, no bound, no budget, no target; plan §1.3's **progressive visible-first re-render was NOT implemented** (a gate-3 revisit-when, not a re-scope); and **no production change was made to reduce the cost** — that is the optimisation gate-2 **(d)** routes away from 5.2. The measurement seam is entirely TEST-SIDE (a timing wrapper around the injected engine loader, the `counting()` shape 4.3 and 5.1 already use), so no production behaviour moved. Methodology, stated because it bounds the claim: the flip is driven through `setThemeSetting` (`reader.ts:89` → `applyTheme`), the same broadcast 5.1 proved BOTH channels funnel into, so the measured window excludes Playwright's OS-emulation transport — that transport is test scaffolding, not product cost. Coverage **UNCHANGED BY DESIGN — unit 728, browser 799 passed / 15 skipped**, both green, because 5.2 adds no test. `eslint` + `tsc --noEmit` clean. NUL check **0** both forms. Content script **316,122 B both engines**, per-engine md5 stable (`a55ef1e0…` Chrome / `0eb751eb…` Firefox — the one pre-existing capability byte apart, 5.1's correction); app chunk `app-Ca7QdFgV.js` **379,044 B, md5-identical across engines**; 3.4's import fence green (58 shipped files); golden EMPTY; `permissions: []` both. ⚠ The **"manifest 2,975 B"** fence repeated by entries 3.1–5.1 is again confirmed to name NO built artifact — measured **654 B (Chrome) / 770 B (Firefox)**; the 2,975 figure is exactly `wc -c tests/manifest.test.ts`, i.e. a copy-carried number pointing at the wrong file. Still flagged for 8.1 / 9.3, not edited retroactively. ★ **5.2 DONE — GROUP 5 (THEME SYNC, D-7) IS COMPLETE.** **TASK 6.1 IS DONE — GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS NOW OPEN**, and its subject is the failure groups 3–5 cannot reach: the whole ~3.3 MB lazy chunk never arrives, so NO fence in the document ever gets an SVG. **TEST-ONLY** — `tests/browser/diagramDegrade.browser.test.ts` is the only file added. `diagramEnhancer.ts` appears in §6.1's Files as the SUBJECT OF THE REVERT ("remove the load-failure catch"), not as a change: the catch has existed since 3.2 and §6.1 says D-15 "makes this the default state rather than a recovery path; **this task proves it**". The file is byte-identical at HEAD, and both bundles are unmoved — content script **316,122 B both engines** with per-engine md5 stable, app chunk `app-Ca7QdFgV.js` **379,044 B, md5-identical across engines**. ★ **THE DEGRADATION §6.1 SPECIFIES IS PLAIN VISIBLE SOURCE PLUS §3.8's PER-FENCE MARKER — NOT A SYSTEMIC BANNER, AND NOT MARKER SUPPRESSION.** §6.1 names a visible source `<pre>`, readable text, an interactive reader and no stranded placeholder, and it names no banner; §3.8's three failures all end at the same `markDiagramFailed`. So what makes an engine-load failure SYSTEMIC is not a different presentation — it is the COUNT and the UNIFORMITY: one failure, **all N fences in the identical state**, never the partial document a per-fence failure produces (3.2's mixed doc: one fence source, the next rendered). No banner was invented. **THE CLAIMS, over a FOUR-diagram document driven through `appShell.ts:134-135`'s shipped body (`mount(...)` then `enhanceDiagrams(...)`) with the injectable `loader` — the seam that has existed since 3.2 for exactly this — forced to REJECT** (§6.1 names the reject case; **no new production seam was grown**): every fence lands `failed` with computed `display` ≠ `none`, non-`hidden` visibility and a laid-out height > 0; each `<pre>` holds **its own** diagram source VERBATIM (four DISTINCT sources, so "readable" is per fence rather than per document); **zero placeholders left** — none pending AND none left over at all, §6.1's "resolved or removed" read both ways; four markers, one per fence, each naming *"the diagram engine could not be loaded"* and each sitting beside its own fence; the prose at both ends survives and the non-mermaid `ts` fence is untouched (no state attribute, no placeholder, no marker) — the enhancer degraded the FENCES, not the document. **THE READER STAYS INTERACTIVE**, proved through the shipped Raw/Reading control `mount()` commits into every reader: focusable (`shadow.activeElement`), really clicked, `data-mode` flips reading→raw, the LAZILY BUILT raw view holds all four diagram sources, clicked back, and the degraded state survives the round trip. ★ **NON-VACUITY ON TWO AXES, because each claim passes trivially on a dead harness.** (1) "the source stays visible" is TRUE of a fence never enhanced — so the SAME harness and SAME fixture with the loader OMITTED (the production `import('mermaid')`) renders four figures with real `<svg>`, hides all four `<pre>`s at `display:none`, and produces ZERO markers; a fourth arm drives `createReaderPane` end to end with nothing injected at all and agrees. (2) "no placeholder is left stranded" is TRUE of a document that grew none — so each failure arm reads the placeholder count **synchronously**, before the async body can have run, and requires FOUR, then requires zero after. Resolved, not absent. ★ **REVERT-AND-FAIL, TWICE, BOTH ENGINES, RESTORED FROM A `cp`.** (a) Remove the engine-load catch and the rejection escapes a `void`-ed promise — red on Chromium AND Firefox in the defect's own units: *"the engine-load degradation never happened: **4 placeholder figure(s) LEFT STRANDED** and 4 fence(s) still pending, of 4 enhanced fences"*, i.e. the user is left with four EMPTY BOXES rather than four code fences. (b) The sharper one — a catch that clears `pending` but does NOT resolve the placeholder — red as *"figures left over: expected … to have a length of +0 but got 4"* on both engines, which proves the leftover-figure assertion is load-bearing INDEPENDENTLY of the settle barrier (a) trips. ⚠ **STATED HONESTLY: the interactivity clause has no revert of its own.** `enhanceDiagrams` returns synchronously and its async body touches only the fence pairs, so no engine-load defect can wedge the reader's controls; the interactivity arm reds under (a) only because it waits at the same settle barrier, and passes under (b). Its instrument is effect-based (a broken control WOULD red it) and the clause is asserted as §6.1 names it, but it is **not sensitive to this defect** — recorded rather than dressed up. Coverage: **unit 728 unchanged** (the unit project excludes `tests/browser/**` by config, so 6.1 cannot reach it); **browser 799 → 807 passed / 15 skipped**, 92 → 94 files (+8 = 4 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** on every touched file. 3.4's import fence green **8/8** and the scanner green (58 shipped files); golden EMPTY; `permissions: []` both; `mount.ts` / `contentWatch.ts` / `idbCore.ts` / `diagramCache.ts` / `diagramView.ts` byte-identical; no new dependency. ⚠ **One AMBIENT unit red seen once in five runs** (2 of 728) on a run that took **49 s against a 10 s norm** — machine load, not 6.1, which the unit project cannot see. Not reproduced in the four runs around it; the failing file was not captured, so it is recorded UNATTRIBUTED rather than guessed at. ⚠ The **"manifest 2,975 B"** fence §6.1 repeats is the same copy-carried number 5.1 and 5.2 already flagged — it is `wc -c tests/manifest.test.ts`, not a built artifact (measured **654 B Chrome / 770 B Firefox**). Still for **8.1 / 9.3**, not edited retroactively. ★ **THE POINTER ADVANCES: 6.1 DONE — GROUP 6 IS OPEN. 6.1 HANDED OFF TO 6.2 — STORAGE UNAVAILABLE / UPGRADE FAILURE** (discharged at `a222af5`), and it is **NOT** 4.4's oversized-diagram case: 4.4 was the cache quietly REFUSING ONE ROW; 6.2 is IndexedDB itself gone — a schema that cannot be opened or upgraded must **say** caching is unavailable in words, while a rejecting WRITE stays quiet and surfaces nothing blocking. **TASK 6.2 IS DONE — GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS COMPLETE.** 6.1 was the ENGINE gone; 6.2 is STORAGE gone — a different layer and a different degradation, because the engine needs no IndexedDB. Every diagram still DRAWS; it simply never persists, so every render is a cold one and no hit ever lands. ★ **§4 HAS TWO STORAGE CLAUSES AND THEY ARE NOT THE SAME RULE TWICE — that distinction IS the task.** *Cannot be read or written* → render normally, no blocking error: **SWALLOWED**. *Schema cannot be opened or upgraded* → keep rendering and **SAY** caching is unavailable: **SURFACED**. **NOT TEST-ONLY** — §6.2's Files names `src/app/diagramCache.ts` · `src/app/appShell.ts` · `tests/browser/diagramDegrade.browser.test.ts`, and the swallowing half already shipped at 4.3 while the SAYING half did not exist. `diagramCache.ts` gains ONE BIT: `cacheConnection()` wraps `connection()` and records `schemaUnavailable`, set **only** where the connection fails, so a rejected `put` against a healthy store — 4.4's oversized refusal included — never lights it; it has **no test seam** and self-clears on the next connection that succeeds, because a stale `true` would go on claiming caching is off after storage came back. `appShell.ts` gains the words, on the surface §3.9 already made the cache's disclosure surface. ★ **THE BUG THIS REPLACED WAS A LIE, NOT AN OMISSION.** A `describeStored()` that THREW landed on `EMPTY_SUMMARY`, whose line reads *“Nothing stored — Peekover is holding no folders, recents, or pins on this device.”* — a claim about a store we had just failed to open. The absent-reader path (a minimal fake store, legitimately empty) is untouched; only the THROW path changed. ★ **THE SEAM IS A BROWSER GLOBAL, NOT A PRODUCTION HOOK.** `indexedDB.open` is patched to refuse the `peekover` database **by name** (what a corrupt profile, a denied quota or an already-newer version does), and `IDBObjectStore.prototype.put` to reject **only** the two diagram stores (so settings, folders, recents, pins and snapshots still write). Both restored in `afterEach`. **`idbCore.ts` is byte-identical and its `:5-9` STOP signal is untripped** — no index, no compound key, no cursor, no migration, no new function; `store.ts`, `diagramEnhancer.ts`, `storageControls.ts`, `mount.ts`, `contentWatch.ts` and `entrypoints/` are byte-identical too. **FOUR ARMS, Cr+Fx.** (1) **open rejects, real store**, driven through the shipped gesture (`mountAppShell` → grant → click the file → `renderWithDiagrams`): the diagram renders, fence `rendered` and `display:none`, real `<svg>` adopted, ZERO markers, ZERO stranded placeholders, prose at both ends intact, **engine invoked exactly once** (cold — nothing to hit), and the panel line **says** *“Diagram caching is unavailable …”* while no longer claiming *“Nothing stored”*. (2) **open rejects, healthy injected reader** — `describeStored` succeeds and returns an ordinary summary, so the line can only have come from `isDiagramCacheUnavailable()`; the injected reader's own line survives beside it (added to, not replaced). (3) **a WRITE rejects in an OPEN store** — **presence AND absence together**: figure present and `rendered`, engine invoked once, then `readDiagram(key)` `undefined` and `describeStored().diagrams.count` **0** (the write really did reject), no `alert`/`confirm`, no `dialog[open]`, no `[role=alertdialog]`, no marker — **and the panel does NOT say caching is unavailable**. That disagreement with arm 1, same product and same panel, is the surfaced-vs-swallowed proof. (4) **NON-VACUOUS CONTROL, WORKING STORE, SAME HARNESS** — pass 1 invokes the engine **1** and the row really writes (`readDiagram` truthy, `diagrams.count` **1**); pass 2 invokes it **0** with the figure still on screen (a HIT, not a hole); and a healthy store says nothing. ★ **NOT 4.4, AND THE FIXTURE PROVES IT:** 4.4 refused ONE OVERSIZED ROW against a HEALTHY store — a SIZE decision. Nothing here is about size; there is no oversized fixture in the block, the diagrams are ordinary small flowcharts, and the failures are the STORE itself. ★ **REVERT-AND-FAIL × THREE, EACH REDDENING A DIFFERENT CASE, BOTH ENGINES, RESTORED FROM `cp` (md5-verified).** (a) **The load-bearing one** — remove `storeDiagram`'s catch and the rejection escapes into `drawDiagram`'s sanitize try, where `storeDiagram`'s call site sits: arms **1, 2 AND 3** red as *“a diagram that RENDERED was lost to a storage failure — **0 figure(s) survive of 1**, and the marker(s) under the fence read [“Diagram not shown — the drawn diagram was rejected by the sanitizer.”] … expected ['failed'] to deeply equal ['rendered']”* — a storage write failure misreported as a SANITIZER rejection over a diagram mermaid drew perfectly, with arm 4 (working store) staying GREEN so the red is attributable to storage and not to the harness. (b) Revert the `appShell` surfacing — arms **1 and 2** red, and the red PRINTS the lie: *“Its lines were: [“Nothing stored — Peekover is holding no folders…”]”*. (c) Revert the cache's availability bit alone — **arm 2 ONLY**, arm 1 still green, which is what proves the `diagramCache.ts` half load-bearing independently of the `appShell.ts` half. ★ **THE CONTROL CAUGHT A REAL DEFECT IN THE TEST.** Arm 3's `toBeUndefined()` first passed for the WRONG REASON — the key was re-spelled by hand and missed the fence's trailing newline, so `readDiagram` missed a row that was never written anyway. Arm 4 refused to find the row it had just written, and the key is now derived through `diagramSourceOf(…)` off the rendered fence, which is the function the enhancer itself keys on. **BUNDLES:** content script **UNMOVED on both engines** — 316,122 B and per-engine md5 IDENTICAL (`a55ef1e0…` Cr / `0eb751eb…` Fx), which is the fence an app-page-only change must not move. App chunk **379,044 → 379,445 B, +401 B, ACCOUNTED BY ABLATION**: `diagramCache.ts` alone **+60 B** (the bit, the getter, the wrapper), `appShell.ts` **+341 B**, of which **174 B is the user-facing sentence itself** and 167 B the helper, the new `readSummary` body and the import binding; md5-identical across engines. The sentence is proved PRESENT in the shipped chunk against a control string proved ABSENT, and the rationale comments are proved STRIPPED (they are `//` comments, not template-literal CSS). **COVERAGE:** unit **728 unchanged** (the unit project excludes `tests/browser/**`); browser **807 → 815 passed / 15 skipped**, 94 files (+8 = 4 arms × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** (`tr -d -c` AND python) on all three touched files, with a firing control reading **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` both; 28 tasks / 9 groups intact; no new dependency. ⚠ **THE AMBIENT UNIT FLAKE IS NAMED THIS TIME**, which 6.1 could only record unattributed: `src/render/diagramEnhancer.test.ts`, **2 of 728**, two 5000 ms timeouts on a **60.9 s** run against a **10.1 s** norm — green in the immediately following run and in every run since. Machine contention, not 6.2, which cannot reach the unit project. ⚠ The **“manifest 2,975 B”** fence §6.2 repeats is the same copy-carried number: re-measured this session, **2,975 B is exactly `wc -c tests/manifest.test.ts`**, while the built artifacts are **654 B Chrome / 770 B Firefox** — confirming 6.1's finding rather than contradicting it. Still for **8.1 / 9.3**, not edited retroactively. **6.2 DONE — GROUP 6 COMPLETE.** **TASK 7.1 IS DONE and GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS OPEN** (§3.11, rows 5, 7, 11, 14–17, 20). §7.1's control group is two real `<button>`s built into the figure by `diagramView.ts` and styled in `readerCss.ts`: **copy-as-image** (a PNG on the clipboard) and **download-as-SVG** (a `blob:` anchor named `diagram-N.svg`), revealed on hover AND on `:focus-within`, with a per-figure `role="status"` live region. ★ **EVERY ASSERTION IS ON THE PRODUCT, NEVER ON PRESENCE** — the affordance-mode vacuous pass this task was warned about. The captured `ClipboardItem` is ONE `image/png` whose first eight bytes are the PNG signature and whose **decoded bitmap** matches the on-screen `<svg>`'s box; the captured download Blob is `image/svg+xml`, opens with the XML prolog and carries that diagram's own labels and not the other's. SUCCESS-vs-NOTHING on both: the recorders are empty before the click. ★ **THE PRODUCT IS THE SANITIZED ADOPTED ARTIFACT — PROVEN, NOT ASSERTED.** A marker planted INTO the live `<svg>` *after* adoption comes back in the saved bytes; a re-render, a re-derivation from the source fence, or a copy stashed at build time all miss it. Neither action can reach the engine's raw pre-sanitize string — `diagramView.ts` has no engine and no cache, so the only SVG in scope is the one on screen. **ROW 14 IS THE DESIGN, NOT A HOPE:** the group is **re-inserted** across a theme swap (same button objects, new `<svg>`) and rebuilt by the next mount, and every handler resolves figure → `<svg>` → ordinal at ACTIVATION time. ★ **EIGHT REVERTS, EVERY ONE FIRING, BOTH ENGINES, RESTORED FROM `cp`:** (1) the load-bearing one — capture the artifact when the group is built → after a theme flip the saved bytes carry `ARTIFACT-BEFORE-THE-FLIP`; (2) resolve the FIRST `<svg>` in the tree → diagram 2's copy is a **487 px** raster of diagram 1 instead of **55 px**, named in pixels; (3) drop the selection from the accessible name → row 17 reds naming actual vs expected; (4) state by colour only → `'Copy image'` where `'Copied'` was due; (5) live region not `hidden` while empty → row 20 reds; (6) re-derive a fresh `<svg>` instead of reading the adopted node → the probe marker is absent (the security-shaped revert); (7) CSS `position:fixed` → row 11 reds AND the group fails to track its figure by **120 px** of scroll; (8) CSS without `:focus-within` → the keyboard reveal never happens. ⚠ **THE FIRST RED-FIRST ATTEMPT WAS INERT AND IS RECORDED AS SUCH:** the capture used `instanceof Element`, but the adopted content is a `DocumentFragment`, so it captured `null`, fell through to the live path and left all 44 green. A revert that does not fire is not evidence — it was fixed and re-run before being counted. ⚠ **A REAL REGRESSION, CAUGHT BY A SIBLING SUITE'S OWN CONTROL:** the live region shipped as a `<p>` and was therefore a paragraph OF THE DOCUMENT to every `.peekover-reader p` rule and selector — it reds `diagramRender.browser.test.ts`'s row-5 control, which requires each column paragraph to have a real box (this one is `hidden`). Corrected to a `<div role="status">`: chrome that lives inside the column is not text the document contains. **BYTES, DECOMPOSED BY ABLATION WITH NO UNNAMED RESIDUAL.** Content script **316,122 → 317,337 B (+1,215)** on both engines — **exactly** the byte length of the CSS block added to `READER_CSS`, and a third build with the `diagramView.ts` code reverted and the CSS kept reads the **same 317,337**, so the delta is CSS and nothing else. This is 3.1's precedent (`1e09164`: 315,671 → 315,974, +303 = its own CSS block), not a fence breach: §7.1 names `readerCss.ts` in its Files, `diagramView.ts` is **absent from the content-script graph** (only `diagramEnhancer.ts` imports it), and the rules are `.peekover-reader .peekover-diagram*`-scoped, so they are **inert on the content-script surface — 1,215 B of CSS that surface cannot use** (stated for 8.1/9.x, not hidden). App chunk **379,445 → 384,710 B (+5,265)** both engines = **1,215 CSS + 4,050 code**, of which **721 B is user-facing copy and class names shipped verbatim** (27 strings, each proved present in the chunk). **COVERAGE:** unit **728 unchanged** (the unit project excludes `tests/browser/**`); browser **815 → 859 passed / 15 skipped**, 96 files (+44 = 22 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL check **0 both forms** (`tr -d -c` AND python) on all three touched files, with a firing control reading **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` and no `web_accessible_resources` on **both** built manifests; `tests/manifest.test.ts` green at **2,975 B** (re-measured — 6.2's reading confirmed: 2,975 IS `wc -c` on the source file, the 654/770 figures are the built artifacts); `mount.ts` · `contentWatch.ts` · `diagramEnhancer.ts` · `store.ts` · `idbCore.ts` · `diagramCache.ts` byte-identical; 28 tasks / 9 groups intact; no new dependency; no new production seam — the clipboard and the anchor are browser globals, stubbed from outside. ★ **7.1 DONE.** **TASK 7.2 IS DONE — GROUP 7 IS STILL OPEN** (§3.11, §5 a11y, rows 4b, 8–12, 16, 19, 21). ★ **ROW 21'S BASELINE NOW EXISTS.** The audit recorded that NO element in this codebase traps focus, so there was nothing to transcribe and nothing would have been noticed missing; `tests/browser/diagramLightbox.browser.test.ts` (21 cases × Cr+Fx) is that baseline. ★ **HAND-ROLLED, NOT `<dialog>.showModal()` — AND THAT IS WHY EVERY CLAIM IS LOAD-BEARING.** `showModal()` would have donated the trap, the top layer and Escape, at which point four of these tests would be assertions about the browser and their reverts would introduce no defect. It was rejected on three specific grounds recorded in `diagramView.ts`: the top layer is per-DOCUMENT and would promote the panel out of the shadow root's stylesheet scope; `::backdrop` covers the ENTIRE viewport including the TOC rail, which rows 8+9 forbid; and `<dialog>`'s Escape is a document-level cancel that cannot be scoped, while §3.11 forbids a new global bare key. The listener is on the lightbox ROOT and only ever sees a key because focus is trapped inside it — modal-scoped by construction. ★ **THE KEYBOARD IS REAL, NOT DISPATCHED.** A synthetic `KeyboardEvent` does not move focus (the advance is a default action reserved to trusted events), so a dispatched Tab would make the NO-TRAP build look identical to the trapped one and the revert would leave the suite green. Tab/Shift-Tab/Escape/Enter go through `userEvent` (Playwright's keyboard). Focus is read as `shadow.activeElement`, never `document.activeElement`, which reports the HOST for anything in a shadow tree and cannot tell the close button from the reader behind it. **No production seam was grown for either.** ★ **SEVEN REVERTS, EVERY ONE VERIFIED TO ACTUALLY RED, BOTH ENGINES, RESTORED FROM `cp`:** (1) THE ANCHOR — drop the focus restore → **10 red**, naming `document.activeElement=BODY` instead of the opener; (2) drop the Tab-wrap → **4 red**, Tab landing on `BODY` and Shift-Tab on `button.peekover-diagram-action` — literally §7.2's “focus escapes to the document behind, naming the element it landed on”; (3) drop Escape → **6 red** (it stays open); (4) drop the initial focus → **12 red**, focus stranded on `button.peekover-diagram-open` outside the modal; (5a) read the FIRST figure's `<svg>` → diagram 2's lightbox shows `AlphaBravo`; (5b) show a copy stashed at commit time → the marker planted into the LIVE `<svg>` after adoption is absent; (6) mount INSIDE `.peekover-reader` → row 4b reds. ⚠ **AND ONE REVERT THAT LEFT THE SUITE GREEN — A DEAD CONTROL, FOUND AND REMOVED.** 7.2 first shipped `@media (prefers-reduced-motion:reduce){…__panel{animation-duration:.01ms}}`; deleting it changed no observable, because `READER_CSS`'s sheet-wide `:host *{animation-duration:.001ms!important}` already matches the panel. Per 7.1's finding a revert that reds nothing is a broken control, not a passing one — so the redundant rule was **deleted as dead bytes** rather than counted, and the CSS pin re-measured. Row 19's other half IS ours and DOES red: removing `animation:peekover-diagram-zoom 180ms` reds naming `'none'` vs `'peekover-diagram-zoom'`. The suite still asserts both halves — the behaviour is required whoever provides it — but 7.2 does not claim to be what provides the reduce half. ★ **A REAL DEFECT THE GEOMETRY TESTS CAUGHT.** The lightbox was first added to `CONTAINED_CSS`'s fixed→absolute list with the other chrome. The app page's reader pane is the scroll container (`appShell.ts` `__reader{overflow:auto}`) and the shadow host grows to full document height, so `absolute` anchored the panel 64 px from the top of the DOCUMENT: on any scrollable document the modal opened off-screen and taking focus into it yanked the reader to the top (row 12 red, reader `top` moving 0 → −205). The lightbox is now the ONE piece of contained chrome that stays `position:fixed` — a pill pinned to the window is misplaced, a MODAL pinned to the window is correct by definition. **CONTENT IS THE ADOPTED, PROFILE-PASSED ARTIFACT**, cloned from the figure's live `<svg>` at ACTIVATION time (row 14's property again) — no re-render, no cached string, no path back to the engine's raw pre-sanitize output that would re-admit the `<style>`/`<foreignObject>` §3.5 strips. A CLONE, not a move, so the reader's own figure is never emptied. **NON-VACUITY** throughout: a no-modal/opener-focused → modal/focus-inside → modal-gone/opener-focused control; the panel proved to have a real box before any “clears” or “does not move” assertion; and Escape shown to be a no-op with nothing open **and** to close when open, so the “no global bare key” claim is not a key the harness merely failed to deliver. **BYTES, DECOMPOSED BY ABLATION WITH NO UNNAMED RESIDUAL.** Content script **317,337 → 318,747 B (+1,410)** both engines — **exactly** the CSS block's own growth (1,517 → 2,927 B), and a build with the CSS reverted and the `diagramView.ts` code KEPT reads **317,337, the baseline to the byte**, so the content-script delta is CSS and nothing else and the lightbox CODE is absent from that graph. 7.1's and 3.1's precedent, and those **1,410 B are inert on the content-script surface** (the content-script reader grows no diagram chrome — row 2), stated rather than hidden. Per-engine md5 stable, cross-engine differing in **exactly ONE byte**, at offset **315,470** (5.1's capability byte, moved forward by the CSS insertion). App chunk **384,710 → 387,837 B (+3,127)** = **1,410 CSS + 1,717 code**, the split measured by the same ablation. **COVERAGE:** unit **728 unchanged**; browser **859 → 901 passed / 15 skipped**, 98 files (+42 = 21 cases × Cr+Fx). `eslint` + `tsc --noEmit` clean. NUL **0 both forms** (`tr -d -c` AND python) on all four touched files, control firing at **1** in both. Import fence green **8/8**; golden EMPTY; `permissions: []` and no `web_accessible_resources` on **both** built manifests; `mount.ts` · `contentWatch.ts` · `appShell.ts` · `diagramEnhancer.ts` · `store.ts` · `idbCore.ts` · `diagramCache.ts` byte-identical — `diagramView.ts` imports NOTHING, so the modal cannot reach appShell's overlay machinery; 28 tasks / 9 groups intact; no new dependency. `diagramActions.browser.test.ts` was touched for ONE reason: its shipped-CSS byte pin, re-pinned **1,517 → 2,927 B** exactly as that pin's own failure message instructs on a rule change. ★ **7.2 DONE.** **TASK 7.3 IS DONE — GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS COMPLETE** (§3-6, §3.11, §5 manifest pin, AGENTS.md #4). ★ **THE DOC READ IS NOW A BUILD.** 7.1 stubbed `navigator.clipboard.write` and cancelled the anchor because it was testing WHICH BYTES the controls produced; 7.3 is the other half and lands in the same file, as §7.3's Files names — a nested `beforeEach` takes both recorders OFF, and the clicks are Playwright's REAL mouse (a dispatched `click()` carries no user activation, which is exactly the gate under test). Harness sanity first: `navigator.clipboard` carries **no own property** and `write` is **`[native code]`**, with a control showing those same checks DO fire on a recorder — without it every assertion below could have been passing against 7.1's stub and the section would prove the opposite of its name. ★ **THE MEASURED FINDING — THE TWO ENGINES GATE THE CLIPBOARD DIFFERENTLY, AND NEITHER GATE IS A MANIFEST KEY.** **Firefox writes the PNG on the gesture alone**: `clipboard-write` is not even a valid `PermissionName` in Gecko (the query throws `TypeError`), so there is nothing to ask for and nothing to grant — §3-6's claim in its strongest form. **Blink DOES consult the Permissions API**, and a Playwright browser context leaves that consent at `prompt`, so the identical real click reds **`NotAllowedError: Write permission denied`**. Measured `prompt` in the **TOP frame too**, so the locus is the browser CONTEXT, not the test iframe. ★ **SO THE CHROMIUM LEG IS AN A-B ABLATION, AND ITS OFF ARM IS PINNED RATHER THAN CONDITIONAL** (an ablation whose off-arm can quietly not run is no ablation): consent `prompt` → the button settles **`failed`**; grant `clipboardSanitizedWrite` over CDP **at the browser-context level** (`Browser.grantPermissions` needs the `browserContextId` — without it the grant lands elsewhere and the state stays `prompt`, measured) → consent reads `granted` → the same button settles **`done`**. Same build, same button, same bytes, **nothing rebuilt between the arms**. The variable that moves the outcome is a **browser consent**, not a manifest key — which is precisely what §3-6 claims about the write path. ⚠ **WHAT THIS DOES NOT PROVE, STATED SO NOBODY READS MORE INTO A GREEN:** that a focused, headful Chrome auto-grants that consent to a gesture-driven write. A Playwright context cannot exhibit that behaviour, so **that one leg of §3-6 stays a documentation finding rather than a build** — carried to the 9.x human gate, where a real browser is in the loop. It is written into the test's own header, not only here. **THE DOWNLOAD NEEDED NO CONSENT ON EITHER ENGINE.** `<a download>` over a `blob:` URL consults no Permissions API and no manifest key; the observer here is **PASSIVE** (it records and returns — the opposite of 7.1's capturing `preventDefault`), so the engine performs the download for real, and the case reads `diagram-1.svg`, a `blob:` href, **`defaultPrevented === false`** and a `done` settle: the default action really stood. **THE MANIFESTS ARE THE EMITTED ARTIFACTS, NOT THE SOURCE.** Read from `.output/` through a Vite glob — not `wxt.config.ts`, not a fixture: **Chrome 654 B / Firefox 770 B, both `permissions: []`, no `web_accessible_resources`, `manifest_version: 3`**. That absence is only a proof because it is an absence **DESPITE EXERCISE**: both actions reached `done` in the same browser session that then read them. ★ **NON-VACUITY AT TWO LEVELS.** §7.3's named control — deliberately malformed fixtures (`['clipboardWrite']`, `['downloads','tabs']`, a `web_accessible_resources` block, a `host_permissions` block, a missing `permissions` key) through the **SAME** `capabilityViolations()` the real artifacts go through — runs everywhere, including the CI leg. And the stronger one: the **REAL** `.output/chrome-mv3/manifest.json` was ablated to `permissions: ['clipboardWrite']` with a `web_accessible_resources` block, and the case **RED on both engines** naming the path and the injected permission (`expected [ 'clipboardWrite' ] to deeply equal []`), then restored from the `cp`. The reader reads the real file and would catch a real capability. ⚠ **A STATED SKIP, not a silent one.** `ci.yml` runs `pnpm test:browser` **before** `pnpm build` and never builds Firefox at all, so `.output/` is absent there and the built-manifest case skips **by name, in the reporter's skip count**. `tests/manifest.test.ts` (source-derived, **2,975 B**, untouched) is the CI guard and its header already writes that division of labour; the two are complementary — source-drift there, build-drift here. **TEST-ONLY, and the fences say so:** content script **318,747 B** both engines, md5 `c7b33b36…` (Cr) / `67717921…` (Fx) — unmoved; app chunk **`app-BT5Gfp9t.js`, 387,837 B**, md5 `9c161857…` both — unmoved. No production file touched (`git diff` over `src/` empty), `mount.ts` · `contentWatch.ts` at zero sites. **COVERAGE:** unit **728** (see the flake note below); browser **901 → 911 passed / 15 skipped** unchanged, 98 files (**+10 = 5 cases × Cr+Fx**) — the skip count not moving is itself the evidence the built-manifest case RAN rather than skipped. `eslint` + `tsc --noEmit` clean. NUL **0 both forms** (`tr -d -c` AND python), control firing at **1**. Import fence green **8/8**; golden EMPTY; 28 tasks / 9 groups intact; no new dependency. ⚠ **THE UNIT SUITE'S 2/728 IS PRE-EXISTING AND LOAD-DEPENDENT, PROVEN BY CONTROL.** `src/render/pipeline.perf.test.ts` (budget: 103.8 ms vs 100) and `tests/golden/golden.test.ts`'s 1 MB document (5 s timeout) red on a contended full run, are **GREEN when run alone**, and — the control that settles it — **BOTH RED AT HEAD with 7.3 reverted**, on a tree identical but for one browser-project file the unit project explicitly EXCLUDES. Not 7.3's. A different pair of members from the family named at 7.2, same shape. ✓ **THE LABEL CARRIED TO 8.1 IS NOW CLOSED (in this file).** §7.1/§7.2 wrote "manifest green **2975 B**" beside `permissions: []`, which reads as a built-manifest byte count. It is not — it is `wc -c tests/manifest.test.ts`, a **correct measurement with a wrong name**. The **built** manifests are **654 B (Cr) / 770 B (Fx)**, re-confirmed at 8.1. §7.3's own wording ("`tests/manifest.test.ts` green and 2975 B") was already the correct form. **8.1 relabelled it here and re-measured nothing**; the mislabel's source text in `specs/007-mermaid-diagrams/tasks.md` is outside 8.1's Files list and is routed to **9.3**. TASK 8.1 IS DONE (D-10) — **GROUP 8 IS OPEN**. It measured and **chose nothing**. Every § Baselines figure is re-run against the BUILT artifact at `4c580c4`: content script **318,747 B** both engines, app chunk `app-BT5Gfp9t.js` **387,837 B**, background **3,548 B**, built manifests **654 / 770 B**, zips **1,299,871 / 1,299,930 B** (**<2 MB PASS**, but 58% of M6's headroom consumed), packed **4.06 MB** against ≤5 MB. The **+3,076 B** content-script delta §8.1 calls a "0-delta fence" is a **STALE BASELINE, not a breach**: it decomposes across five named commits to a **residual of 0 B**, proven by building at all 21 M7 commits in a detached worktree — and the fence §8.1 actually asserts holds exactly, **the content script byte- and md5-identical on both engines with mermaid ablated away**, while the negative control fired **−3,349,366 B** in the same run. Three ledger corrections: 6.2 moved the app chunk only, and 3.1 (+303) and 4.2 (+113) were unrecorded content-script movers. **The first-paint half returned a NEGATIVE verdict and it is stated as one:** the A-B-A control disagreed with itself by **10.9 ms median / 13.4 ms floor**, more than the entire effect, so **no diagram-bearing first-paint cost is claimed**; the gate passes on all four arms (152.3–163.2 ms, worst-arm headroom 1.8 ms) and the 1 MB discriminator (+9.8%) says the machine, not the code, moved. A non-vacuity probe caught that the diagram-bearing arm renders **zero** diagrams on the content-script surface (`enhanceDiagrams` is app-page-only), so that PASS is **not** evidence the enhancement is post-paint — app-page first paint still has **zero automated coverage**, carried unfixed. The **2,975 B label is corrected here (test file, not manifest — the measurement was always right)**, and the content-script fence wording is corrected to **byte-length-identical + per-engine-md5-stable**, never cross-engine md5 equality: the engines differ by **exactly one byte at 0-based offset 315,470** (`backgroundCanReadFileUrls:!0/!1`), re-confirmed this session. **No production file moved; no bound was chosen.** **TASK 8.2 IS DONE (`80a86b1`) — D-8 + D-9, MEASURED, NOTHING CHOSEN.** Full numbers in § Baselines *THE D-8 / D-9 BOUNDS MEASUREMENT*; the two facts that outlive them: **D-9 is NOT a cap** (it is the typical-case time-to-rendered target — "D-8 and D-9 are the two numeric caps" is the natural and wrong reading), and **the eviction cliff is TOTAL, not graded** — one row over the count bound costs the entire cache's value for that document (51 re-renders at N=51, where the arithmetic predicted 2). Scratch harness deleted, both bundles byte-identical. **TASK 8.3 IS DONE (`fc9efb2`) — D-11 walk material, and it COMMITS NO TEST.** The pending placeholder is **static** — an empty, zero-height `<figure>`, `animationName: none` on both engines — and **no task in 007 builds motion**, so §8.3's *"placeholders DO animate without `prefers-reduced-motion`"* clause and its revert-and-fail are **STRUCK as premised on an artifact never specified into existence**. Every writable form of the test decides D-11: asserting "animates" is impossible, asserting `animationName === 'none'` pins **static**, and building the shimmer pre-empts the gate — so 8.3 records instead. ★ **The hinge, for the third time (7.2's finding): `readerCss.ts:76-79`'s sheet-wide `:host *{animation-duration:.001ms!important}` owns any placeholder suppression**, proven with an injected stand-in shimmer (1.2 s free → 1e-06 s under `reduce`), so a D-11-specific reduced-motion rule would be a **dead control**. New material: `tests/golden/fixtures/diagrams-10.md` and `diagrams-50.md` (no existing fixture served — none carried a mermaid fence, and 5.2/8.1/8.2's 50-diagram fixture died with their scratch harnesses). ★ **And the walk's question is reframed by CELL 4: at document-open the reader shows a full column of prose and VISIBLE source fences, not a field of placeholders** — the figures are zero-height siblings until each SVG lands. ⚠ **§ Now was itself the pointer-lag case this file warns about: 8.2 advanced § Up next and left this line reading *"NEXT: 8.2"*, so the two sites disagreed until 8.3's sweep caught it.** **8.3 does not feed 8.4 — it feeds 9.1**, whose walk now has its documents. **TASK 8.4 IS DONE (`2bc131f`) — THE HUMAN GATE CHOSE, AND THE SIX VALUES ARE BANKED IN `decisions.md`, ONE ENTRY EACH, EACH NAMING THE § Baselines MEASUREMENT THAT JUSTIFIES IT.** **`count` = 150** (raised from 100 — CELL 3's cliff is TOTAL, so the choice is *where the discontinuity sits*; 150 puts it at N=75, clearing the heavy shape and §8's 50-case, and stays below ~200 where CELL 4d swaps the binding axis onto bytes); **`totalBytes` = 8 MiB, unchanged** (8.2's Reading B taken: a SAFETY VALVE, not a capacity limit — at count 150 the crossover is 55,924 B/row, above CELL 1's all-kinds mean of 42,350, so it binds only on a large-diagram-heavy cache; **never-binding in normal use is the design intent, so D-8's revisit-when is NOT tripped**); **`maxAgeMs` = 30 days, unchanged and recorded AS A POLICY JUDGMENT** — 8.2 proved the axis fires/doesn't-fire and measured **nothing** about the value, and the missing input (a re-read-interval distribution) needs telemetry **AGENTS.md #2 forbids forever**, so it will **not** become measured later; **D-9 = 165 ms median, cold, per-diagram-amortized, Chromium floor as the check** — set on CELL 6's axis (~15–17 ms/diagram; the 50-case first-opens at 840/1099 ms under §8's 5 s), and carrying **three caveats**: it **EXCLUDES the one-off `import('mermaid')`** so it is per-diagram cost and **NOT** user-facing first-open time (which is measured nowhere), it is a **COMMITMENT not a gate** (8.5 carries no timing assertion, so nothing enforces it), and it is recorded as **aspirational** with both statuses explicit; **D-10 = (b) narrow the `mermaid/package.json` inline** (~3,818 B, 8.1's second ablation) because zip headroom is thinning (0.70 MB, **58% of M6's margin consumed**), with **(d) WITHDRAWN as INERT** — a lazy boundary moves bytes *loaded*, which 8.1 already measured at **0** on the content script, so (d) collapses into (c) — and **(c) the subset build DEFERRED** until headroom forces it; and **the flip cost ACCEPTED with §1.3's progressive re-render QUEUED, NOT BUILT** (gate-2 (d) discharged) — at count 150 the flip-back is a full hit up to 75 diagrams, so users see 5.2's **~110 ms** hit-flip, not the ~540/910 ms miss, **★ CONTINGENT: if `count` ever drops below 2×(typical heavy N) the acceptance is VOID and §1.3 is revisited**. ★ **8.4 CHANGED NO PRODUCTION FILE, NO TEST AND NO CONSTANT** — both bundles byte-identical (content script 318,747 B both, per-engine md5 stable; app chunk 387,837 B, md5 identical), the three `PROPOSED_` constants untouched at `diagramCache.ts:95/106/117`, 3.4's import fence green 8/8. **8.5 SET them — see its entry below.** ★ **NEW CARRIED WORK, placed rather than assumed: D-10 (b)'s narrowing is NOT §8.5's** — §8.5's Files are `diagramCache.ts` + its test and "the ALGORITHM does not move — only constants" — so it is banked in **§ Carried items**, not added to `tasks.md` (8.4's Files list is `decisions.md` alone; §9.1 is the milestone's mechanism for adding a task). ★ **TASK 8.5 IS DONE (`c75a81d`) — THE SIX BANKED DECISIONS ARE NOW IMPLEMENTED, AND GROUP 8 IS COMPLETE (8.1 · 8.2 · 8.3 · 8.4 · 8.5).** The three constants were transcribed from `decisions.md`'s 2026-08-01 entries and from nowhere else: **`count` 100 → 150** (the ONE real value change), **`totalBytes` 8 MiB** and **`maxAgeMs` 30 days** unchanged in value but recorded either way — and the `PROPOSED_` framing came off all four names (`PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS` / `PROPOSED_BOUNDS` → `DIAGRAM_COUNT` / `DIAGRAM_TOTAL_BYTES` / `DIAGRAM_MAX_AGE_MS` / `DIAGRAM_BOUNDS`), reference-preserving with `tsc` as the completeness check. ⚠ **§8.5's Files list is one file short of the rename's reach**: `tests/browser/diagramCache.browser.test.ts` also imports `DIAGRAM_TOTAL_BYTES`, so leaving it would have been a half-done rename and a broken build; it was followed (an identifier-only edit, no expected number touched) and the widening is recorded here rather than done silently. **D-9's 165 ms target, D-10's disposition and the flip acceptance MAP TO NO CONSTANT, and none was created.** ★ **4.1's STRUCTURAL PIN HELD, and that green IS the proof**: the swap needed NO expected number edited anywhere — every fixture still passes small explicit bounds and the one constants case still asserts COMPOSITION — so the diff across both test files is identifier-only. §8.5 asks for no chosen-value pin, so none was added. ★ **THE ALGORITHM DID NOT MOVE, asserted rather than eyeballed**: the `// ── D-4: EVICTION PLANNING` region is md5-IDENTICAL old-vs-new (`c5aec5ac4d61`, 5,511 B), as are the D-3 key block (3,135 B) and the IDB layer (6,710 B); `storeDiagram` differs by exactly the one identifier. ★ **THE BUNDLE FENCE, AND THE FIRING CONTROL THAT MADE THE NULL MEAN SOMETHING.** The content script is **byte-IDENTICAL** on both engines (318,747 B, md5 `c7b33b36…` Cr / `67717921…` Fx) — `diagramCache` is app-page-only — and the whole `.output` tree moved **0 bytes** (4,058,587 → 4,058,587; 104 files; not one file with a size delta), because `100`→`150` is a same-length literal and the identifier names are minified away. A zero-byte delta on a real value change is precisely the case that needs a control, so the tree was decomposed byte-by-byte against an **ABLATED (HEAD-source) build**: 82 files changed content, and in **81 of them every differing byte lies inside an 8-char Vite chunk-name hash token** — a pure hash cascade off the app chunk's own hash — leaving **ONE residual byte in the entire tree**, at app-chunk offset 323,975: `var ru={count:100,…}` → `var ru={count:150,…}`. That single byte IS the proof the swap landed, and `8*1024*1024` / `720*60*60*1e3` sit beside it unchanged, confirming the two no-op-value renames really are no-ops. ★ **§8.5's ACCUMULATION RE-RUN, PREDICTION STATED BEFORE THE HARNESS RAN**, and the harness VALIDATED first against CELL 5 at the old bounds — it reproduces `document 39` (typical) / `document 10` (heavy) / rows pegged 100/100 / COUNT binding / 0 refusals **exactly**, so it is a re-run rather than a model. At the chosen bounds: **`count` STILL BINDS in both shapes**, first eviction moves **doc 39 → 57** (typical) and **doc 10 → 15** (heavy), rows peg **150/150**, and bytes rise to **6.26–6.47 MB = 74.7–77.2% of the 8 MiB cap** — so **`totalBytes` STILL NEVER BINDS**, as predicted and as the 8.4 entry designs it; `maxAgeMs` still fires at `now = cap+1` and does not at `now = 1`. **All five predictions confirmed.** *(The one honest gap: the reconstruction's steady-state byte BAND reads 4.16–4.30 MB where CELL 5 recorded ~4.18–4.45 MB — the four discrete readings reproduce exactly, the continuous band is directional.)* Golden EMPTY (10/10 byte-stable), 3.4's import fence green 8/8, `permissions: []` both, manifests 654 / 770 B, `idbCore.ts` / `snapshots.ts` / `contentWatch.ts` byte-identical, `tasks.md` still 28 tasks / 9 groups, no new dependency. **The named flake family fired, and was PINNED TO THE MACHINE rather than to the change**: `pipeline.perf` (126.1 then 141.8 ms against a 100 ms budget) and `golden-1MB` went red in the full unit run and went **equally red on an ablated HEAD-source tree in the same session**, both green alone; browser **911 passed / 15 skipped**. ★ **THE POINTER ADVANCES: GROUP 8 IS COMPLETE. NEXT: GROUP 9 — 9.1, the milestone-close HUMAN WALK** on real Chromium and real Firefox, with 8.3's 10- and 50-placeholder fixtures and its CELL 4 reframing as material; then 9.2's retro in a fresh session and 9.3's `architecture.md` correction, the "2975" mislabel and the memory reconcile. ★ **9.1 HAS NOW BEEN WALKED — ON REAL CHROMIUM AND REAL FIREFOX, EXTENSION LOADED, WIDE VIEWPORT — AND ITS VERDICTS ARE RECORDED** (§ Baselines, THE 9.1 MILESTONE-CLOSE WALK RECORD). **★ IT IS NOW COMPLETE — ALL EIGHT ITEMS CARRY A VERDICT (item 7 walked last, see ③).** **Three things come out of it.** ① **D-11 IS CONFIRMED STATIC**: the placeholder→diagram swap reads as a document **SETTLING, not noise**, at 10 fences and at 50 — so the static placeholder is the **DECISION** now, not just the implementation, **NO SHIMMER IS BUILT**, and 8.3's routed question is CLOSED. Items 2 (control-group discoverability), 3 (lightbox legibility), 5 (**Firefox everything** — that engine's only evidence), 6 (**zero unexpected network** across import → render → cache → re-theme → export, the only evidence for the real loaded extension) and 8 (content-script surface still a plain fence) all **PASS**; item 4 (§3.11 touch) is **N/A — NOT TESTED**, no device available, recorded as not-tested rather than as a pass. **Item 7 (app-page responsiveness) also PASSES — see ③, and it is the verdict that completed the set.** ② **ONE FINDING, FILED NOT FIXED** per §9.1's own mechanism: **DARK-MODE DIAGRAM TEXT RENDERS BLACK** — mermaid's own canvas-drawn labels (pie title/legend, gantt date axis) are unreadable on dark, readable on light, a **D-7 theme-legibility gap**, with the gantt date-axis **overprint** as an open sub-question. It is in **§ Carried items** with its light-must-not-regress constraint; the fix is **its own task in its own session**, and is **NOT** part of 9.1. ③ **9.1 IS NOW COMPLETE — ITS LAST ITEM HAS ITS VERDICT.** §9.1's body lists **EIGHT** items; **item 7 — app-page responsiveness after M7 — has now been WALKED and PASSED** (a NORMAL, non-fixture page on real Chromium AND real Firefox: no slowdown, no jank versus before M7, so plan §4-5's *"nothing else will notice"* holds). With that, **all eight items carry a verdict and §9.1's Verify ("each item walked and its verdict recorded") is MET** — **M7's last human gate is discharged**. ★ **Closing the gate does NOT fix its finding:** the dark-mode defect stays **filed in § Carried items**, unfixed, as its own task in its own session. **This commit is DOC-ONLY**: nothing under `src/`, `tests/`, `entrypoints/` or `specs/` moved, both bundles are byte-identical, and `tasks.md` was **not** edited — §9.1's *"a task added below this line"* landed in § Carried items by 8.4's D-10 (b) precedent, with the tension over that wording recorded and routed to **9.3**. **D-10 (b)'s inline narrowing STAYS CARRIED** — its trigger (zip headroom below ~0.5 MB) is still unmet, and 8.5 did not touch it. ⚠ **Routed onward, NOT fixed at 8.1:** the `tasks.md` "manifest green 2975 B" mislabel at §7.1/§7.2 and in every §8.x fence line (8.1's Files list does not scope `tasks.md`) → **9.3**; the `architecture.md` `enhance`-stage correction → **9.3** per gate-2 (c); the sources-zip 4.29 → 1.92 MB gap (hypothesis tested and refuted, see § Baselines) → stated, ungated. ★ **BOTH 9.1 FINDINGS ARE NOW FIXED, EACH IN ITS OWN SESSION AND ITS OWN COMMIT** — the dark-mode diagram-text defect (`662b90e`) and the gantt date-axis overprint (`fc3a142`), full resolutions appended in § Carried items. **M7's human-gate defect count is TWO and the running score is 12/12.** ⚠ Neither fix commit ran the pointer walk over § Now / § Up next / § Blockers, which is why those three sites went on describing the dark-mode defect as unfixed carried work until 9.2's sweep — **banked as retro.md 2026-08-02 finding 7: the pointer walk's trigger is ANY commit that changes state a pointer site asserts, not "a gate-closing task".** ★ **TASK 9.2 IS DONE — THE M7 RETRO IS BANKED** (`docs/ai/retro.md`, 2026-08-02, newest first: nine findings extending the numbered per-milestone register). Its headline is **a kickoff premise is a HYPOTHESIS — the first move of a fix is to measure the premise, not execute it** (both end-of-milestone fixes had theirs falsified before a line was written), and its corollary is **a green suite can be VACUOUS on the property that matters — a test proves what it ASSERTS, not what it is NAMED** (D-7 was green all milestone while the two theme renderings were byte-identical). **§9.2's owed floor-delta statement is present with its number: M7's first-paint floor is 145.3 ms against M6's 132.1 ms — +13.2 ms — and NO re-baseline is proposed**, because the same session's A-vs-A floor disagreement was 13.4 ms and the 1 MB machine discriminator moved +9.8%, which accounts for the delta almost exactly. 9.2 is **DOC-ONLY**: nothing under `src/`, `tests/`, `entrypoints/` or `specs/` moved, both bundles are byte-identical at HEAD (content script **318,747 B** both engines, md5 `c7b33b36…` Cr / `67717921…` Fx; app chunk **389,143 B**, md5-identical both engines), `permissions: []` both, golden EMPTY, import fence 8/8, 28 tasks / 9 groups intact, no new dependency. ★ **TASK 9.3 IS DONE — AND WITH IT GROUP 9 IS COMPLETE AND *** M7 IS CLOSED *** (2026-08-02).** 9.3 was group 9's last task and the milestone's last task: **28 of 28 landed, nine of nine groups complete, and NO gate remains** — 9.1 was M7's last human gate and it is discharged (8/8 items, both findings fixed). 9.3 delivered gate-2 (c)'s `architecture.md` correction and the memory reconcile, **doc-only**: the whole diff is `docs/ai/architecture.md` + `docs/ai/progress.md`. ★ **THE RECONCILE'S OWN METHOD IS ITS MAIN OUTPUT AND IT IS RECORDED IN FULL IN § Baselines — *THE 9.3 RECONCILE RECORD*: "stale" is THREE different problems with three different right answers**, and every routed item was KIND-SORTED before anything was edited. **KIND A (live figures that must track HEAD)** — § Baselines re-derived from a clean build at `94f7da5`, **every row, including the two nobody routed**: app chunk **387,837 → 389,143 B**, suites **911/15/98 → 927/15/100**, and the previously-unnoticed stale zip (**1,300,383 / 1,300,442 B**) and packed-tree (**4,059,893 / 4,060,009 B**) rows. **KIND B (dated records that must NOT be "corrected")** — `decisions.md`'s `PROPOSED_*` line-refs were written before 8.5's rename and are correct-by-construction as dated snapshots, so **`decisions.md` is not in this commit at all**; the current locations are recorded in the reconcile record instead, because §9.3's Verify says decisions.md is *"read and left untouched unless a genuine decision landed"* and a rename pointer is not a decision. **KIND C (sealed-file errors)** — `tasks.md` is **NOT edited**: the **"2975 B"** mislabel (24 fence occurrences; 2,975 B is `wc -c tests/manifest.test.ts`, the BUILT manifests are **654 / 770 B**), §9.1's preamble-vs-body count and §8.3's struck Verify clause are all **recorded here rather than fixed in place**, by 8.4's D-10 (b) precedent that a task's Files list is the fence. ★ **AND TWO THINGS 9.3 DELIBERATELY DID NOT DO, SAID OUT LOUD RATHER THAN LEFT TO INFERENCE: it did NOT tick the 28 checkboxes** (outside its Files list, and the repo's convention is per-task-in-its-own-commit, which cannot be done retroactively — **the convention question is a HUMAN call and is filed in § Carried items**), and **it did NOT re-run the first-paint rows** (8.1's protocol needs a quiesced machine and an A-B-A; the rows now carry per-row provenance and the reason, which §9.3's Verify explicitly licenses). **`spec-coverage.md`'s F2 score is stale by construction now that diagrams shipped, and is routed to a re-audit before M8's scoping** rather than guessed at here.

**★ BOTH FLAGS RAISED BY TASK 1.1 ARE NOW CLOSED — gate 3's approval banked (below), the SBOM defect
fixed at `1a202fd`. Neither ever blocked 1.2.**
- **CLOSED — Gate 3's approval IS NOW BANKED**, in `decisions.md` (the M7 GATE 3 entry, `66634fa`).
  M6 used a different shape: it landed `0e24f15 docs(tasks): M6 gate 3 — tasks 006 (snapshots + diff)
  approved and landed` **before** its task 1.1 (`a72f27f`), tasks and approval together. M7's tasks had
  already landed separately at `bfa131e` as an explicit draft, so only the written approval was
  outstanding and the bank entry is it. **`specs/007-mermaid-diagrams/tasks.md` still self-labels
  *"DRAFT awaiting gate 3"* at its header and footer, and that is CORRECT, not stale** — the gate-1/gate-2
  precedent puts approval in `decisions.md`, not the artifact's status line (spec 007 still reads "draft"
  post-`e09520f`; plan 007 still reads "draft — awaiting gate 2" post-`cab93c7`). **The decisions entry is
  the approval of record — do not "fix" the status line.**
- **CLOSED — `scripts/generate-sbom.ts` UNDER-REPORTED the production tree** (a latent defect that
  mermaid's depth was the first tree to expose), fixed at `1a202fd`: 90 → 120 components, dedup decoupled
  from descent. See § Blockers for the root cause and the proof.

M6 shipped snapshot capture on the app page, bounded retention (count 15 / 20 MiB / 30 days), a global
erase control, a persistent capture disclosure and an inline line-diff against any stored snapshot —
with **`permissions: []` intact** and the first `dependencies` addition since M1 (`diff@^9.0.0`). The
9.1 human gate PASSED and found three layout defects plus a disclosure gap, all fixed before close.
**The close record, the group summaries, the five recovery sessions, the two formal retractions and the
frozen M6-close pins are in [`progress-archive.md` § M6](progress-archive.md#m6--spec-006--snapshots--diff--closed-2026-07-27);
task-by-task detail is `specs/006-snapshots-diff/tasks.md`. Neither is restated here.**

**Two M6 facts that outlive the milestone — do not re-derive them from its narrative:**
- **The running human-gate score is 10/10 THROUGH M6**, corrected from the 8/8 written at M6's 9.1 (the
  score counts DEFECTS: 7 before M6, M6 contributes 3). **It now reads 12/12 and the condition that
  moved it is DISCHARGED** — M7's 9.1 found the dark-mode diagram-text defect, and the **gantt date-axis
  overprint**, filed as an open sub-question and deliberately UNCOUNTED at the time, **was separated by
  measurement and confirmed as a REAL product defect** (the sparse `diagrams-10` gantt overprints exactly
  as badly as the dense one, both themes, both engines). **M7 contributes TWO; 10 + 2 = 12.** 9.1 is
  COMPLETE and both defects are fixed, so **the figure is settled for this milestone**. See § Closed
  milestones.
- **"None escaping" is FALSE for the first time.** Finding A shipped since M3 and was missed at three
  close gates, so nine of ten defects were caught at their own gate and **one escaped three**. The
  mechanical cause is that **no gate record on any milestone states the walk's VIEWPORT** — a gate
  walk now records its viewport the way it records its engines (`retro.md` 2026-07-27, finding 2).

**M7's direction and scope are SETTLED and live in § Up next** — the direction decision was banked at
`87cd026` and all three Gear-3 gates are behind it. No flag is outstanding there.

**The Now-pointer advances PER TASK** (the M1 rule — it once lagged four tasks and the next session
acted on stale state). The rule has four recorded failures and one mechanical remedy: **a pointer walk
as a discrete step in every gate-closing task** (`retro.md` 2026-07-27, finding 3) — grep `is next`,
`at the gate`, `waiting on`, `this commit`, `← NEXT` and the running score before committing. **This
archive pass ran that walk on itself.**



---

## M7 · spec 007 — Mermaid diagrams + diagram cache (M7a) · CLOSED 2026-08-02

### The M7-close § Baselines, verbatim as it stood in `progress.md`

### THE D-8 / D-9 BOUNDS MEASUREMENT (spec 007 task 8.2, measured 2026-07-31 at HEAD `df256d6`)

*★ **PRODUCES NUMBERS. CHOOSES NOTHING.** Every figure below is input to **8.4**, the human gate that
picks the values; **8.5** implements them. Nothing here is a recommendation, and where the shape of a
curve makes one value look obvious that is **still not the answer until 8.4 says so**. No threshold was
committed — a `bound < N` test would flake AND smuggle in the number 8.4 owns (5.2's rule).*
*Method: 5.2's, unchanged — a **scratch `tests/browser` file, run once per engine and DELETED**;
production untouched; both bundles byte-identical at the commit.*

**WHAT D-8 AND D-9 ACTUALLY BOUND** *(resolved from plan §0 D-8/D-9 + spec §8-1/§8-2 BEFORE measuring —
the premise was checked rather than assumed, and one half of it was wrong)*:

| decision | what it bounds | units | placeholder (`src/app/diagramCache.ts`) |
|---|---|---|---|
| **D-8** `count` | global rows in `diagramMeta`; a row is one (diagram × effective theme) | rows | `PROPOSED_DIAGRAM_COUNT` = **100** |
| **D-8** `totalBytes` | global bytes over stored SVG | bytes | `PROPOSED_DIAGRAM_TOTAL_BYTES` = **8 MiB** (8,388,608) |
| **D-8** `maxAgeMs` | global age on `lastUsed` — the ABANDONMENT valve, not a capacity bound | ms | `PROPOSED_DIAGRAM_MAX_AGE_MS` = **30 days** (2,592,000,000) |
| **D-9** | **NOT A CAP.** The typical-case (1–3 diagram) **time-to-rendered TARGET** 8.4 sets | ms | *none — no constant exists yet* |

**★ D-8 is three caps; D-9 is a performance target.** Recorded explicitly because "D-8 and D-9 are the
two numeric caps" is the natural and WRONG reading, and it aims the measurement at a quantity that does
not exist.

**CELL 1 — D-8a: rendered-SVG bytes, 7 kinds × 2 sizes, read back through the production key**
(`diagramCacheKey` → `readDiagram` → `bytesOf`, theme `light`; control: engine invoked exactly 14/14):

| kind | small (Cr) | large (Cr) | small (Fx) | large (Fx) |
|---|---|---|---|---|
| flowchart | 14,772 | 109,768 | 15,141 | 112,223 |
| sequence | 23,782 | 42,178 | 23,790 | 42,182 |
| class | 18,233 | 75,932 | 18,884 | 80,106 |
| state | 28,030 | 84,590 | 28,221 | 88,533 |
| ER | 10,439 | 135,513 | 10,675 | 129,640 |
| gantt | 11,209 | 24,347 | 11,218 | 24,395 |
| pie | 4,317 | 9,785 | 4,331 | 9,770 |

All 14, Chromium: **min 4,317 · median 24,064 · max 135,513 · mean 42,350** (Fx: 4,331 / 24,092 /
129,640 / 42,794). SMALL median **14,772**; LARGE median **75,932**. **A rendered SVG is far larger than
a "small picture" intuition suggests** — the smallest measured is 4.2 KB and the largest 132 KB, a **31×
span across kinds**, which is why the byte axis cannot be reasoned about from the count axis.

**CELL 2 — D-8b: the 50-diagram fixture's footprint** (the fixture 5.2 and 8.1 used; controls: 50 engine
invocations on each theme pass):

| | rows | bytes | mean/row | vs count 100 | vs bytes 8 MiB |
|---|---|---|---|---|---|
| one theme (Cr) | 50 | 690,908 | 13,818 | 50% | 8.2% |
| **two themes (Cr)** | **100** | **1,382,746** | 13,827 | **100%** | **16.5%** |
| two themes (Fx) | 100 | 1,413,896 | 14,139 | 100% | 16.9% |

**CELL 3 — ★ THE EVICTION CLIFF, MEASURED ACROSS THE PLACEHOLDER, ON THE REAL IDB STORE.** N diagrams
rendered in `light`, flipped to `dark`, flipped BACK; the cell is the engine invocations on the flip
back. **Identical on both engines.**

| N (diagrams) | rows wanted (2N) | pass A | pass B | **flip-back re-renders** | rows after B |
|---|---|---|---|---|---|
| 25 | 50 | 25 | 25 | **0** — full hit | 50 |
| 45 | 90 | 45 | 45 | **0** — full hit | 90 |
| 49 | 98 | 49 | 49 | **0** — full hit | 98 |
| **50** | **100** | 50 | 50 | **0** — full hit, **by one row** | 100 |
| **51** | **102** | 51 | 51 | **51 — FULL MISS** | 100 |
| 55 | 110 | 55 | 55 | **55 — FULL MISS** | 100 |
| 60 | 120 | 60 | 60 | **60 — FULL MISS** | 100 |

**★ THE CLIFF IS TOTAL, NOT GRADED — and this is the single most decision-relevant number here.** The
arithmetic prediction was **2** re-renders at N=51 (102 rows − a 100 cap). The measurement is **51**.
Cause, read off the algorithm: on the flip back the A-theme rows are globally oldest, so the first
miss's write pushes past the cap and evicts **the next A row the same pass is about to ask for**. Every
subsequent read misses for the same reason — a **self-defeating cascade**. One row over the bound does
not cost one re-render; **it costs the entire cache's value for that document.** Stated, not acted on:
choosing where that discontinuity sits is 8.4's.

**CELL 4 — the bound SWEEP, over the production planner.** `planDiagramWrite` is the shipped eviction
algorithm, pure and bounds-parameterised, so replaying a session through it at candidate bounds measures
**the shipped algorithm under other numbers** without touching production. **VALIDATED FIRST** against
CELL 3's real IDB store — same sequence, production bounds — and it reproduces every point **exactly**
(0/0/0/0/51/55/60 at N = 25/45/49/50/51/55/60). An unvalidated projection is a model, not a measurement.

*4b — COUNT bound (down) × N diagrams (across); cell = flip-back re-renders, `0` = full hit:*

| count \ N | 1 | 3 | 10 | 25 | 50 | 75 | 100 | 150 | 200 |
|---|---|---|---|---|---|---|---|---|---|
| 25 | 0 | 0 | 0 | 25 | 50 | 75 | 100 | 150 | 200 |
| 50 | 0 | 0 | 0 | 0 | 50 | 75 | 100 | 150 | 200 |
| 75 | 0 | 0 | 0 | 0 | 50 | 75 | 100 | 150 | 200 |
| **100** *(placeholder)* | 0 | 0 | 0 | 0 | **0** | 75 | 100 | 150 | 200 |
| 125 | 0 | 0 | 0 | 0 | 0 | 75 | 100 | 150 | 200 |
| 150 | 0 | 0 | 0 | 0 | 0 | 0 | 100 | 150 | 200 |
| 200 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 150 | 200 |
| 300 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 200 |
| 400 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Every cell is either 0 or N.** The observed rule across the whole grid: **a two-theme flip-back is a
full hit iff `count ≥ 2N`, and otherwise a full miss** — there is no partial-credit region anywhere in
the sweep. Note the count bound buys nothing between 100 and 125, or between 150 and 200: **the curve is
a staircase whose steps are at `2N`, not a smooth trade.**

*4c — BYTES bound (across) × per-row bytes (down), after 50 diagrams × 2 themes; cell = surviving rows /
which axis bound:*

| bytes/row \ cap | 1 MB | 2 MB | 4 MB | 8 MB *(placeholder)* | 16 MB | 32 MB |
|---|---|---|---|---|---|---|
| 4,317 *(pie, small)* | 100 / count | 100 / count | 100 / count | **100 / count** | 100 / count | 100 / count |
| 13,827 *(the 50-fixture)* | 75 / bytes | 100 / count | 100 / count | **100 / count** | 100 / count | 100 / count |
| 24,064 *(all-kinds median)* | 43 / bytes | 87 / bytes | 100 / count | **100 / count** | 100 / count | 100 / count |
| 42,350 *(all-kinds mean)* | 24 / bytes | 49 / bytes | 99 / bytes | **100 / count** | 100 / count | 100 / count |
| 80,106 *(class large, Fx)* | 13 / bytes | 26 / bytes | 52 / bytes | **100 / count** | 100 / count | 100 / count |
| 135,513 *(ER large, Cr — the largest measured)* | 7 / bytes | 15 / bytes | 30 / bytes | **61 / bytes** | 100 / count | 100 / count |

*4d — the crossover is exact arithmetic, so it is stated as a formula rather than a table:* **bytes binds
before count iff mean row bytes > `totalBytes / count`.** At the placeholders that is **83,886 B/row** —
above every measured *small* diagram (4.3–28.0 KB) and above the all-kinds mean (42.4 KB), but **below
three of the seven measured LARGE diagrams** (Chromium: ER 135,513 · flowchart 109,768 · state 84,590;
class 75,932 falls just under, and sequence / gantt / pie are far under). So the byte axis is reachable
only by a cache filled predominantly with the large end of the distribution.

**CELL 5 — D-8's binding-axis question, over a realistic reading session.** Documents opened in
sequence, byte sizes drawn from CELL 1's **measured** distribution (all 7 kinds at both sizes, cycled —
not a single mean, because the byte axis's whole reason for existing is the document carrying a few very
large diagrams); every third document also re-read in a second theme. Identical on both engines.

| session shape | first eviction | binding axis | steady state |
|---|---|---|---|
| typical — 2 diagrams/doc | **document 39** | **COUNT** | rows pegged 100/100; bytes ~4.18–4.45 MB = **~50–53% of the 8 MiB cap** |
| heavy — 8 diagrams/doc | **document 10** | **COUNT** | rows pegged 100/100; bytes ~4.24–4.42 MB = **~51–53%** |

Single-oversized refusals: **0** in both shapes — no measured diagram approaches the 8 MiB whole-write
refusal. **PER-AXIS ANSWER, which is what §8.2 asks for** *(the D-8 revisit-when: an axis that never
binds is chosen wrong)*:
- **`count` — BINDS, always, in every shape measured.** It is the only axis that ever fires here.
- **`totalBytes` — NEVER BINDS at the placeholders.** It saturates at ~51% and stops, because `count`
  caps the row population first. It is reachable only at ~84 KB/row, i.e. a cache filled entirely with
  the *large* end of the measured distribution. **Whether that makes 8 MiB wrong, or correctly a safety
  valve that should rarely fire, is 8.4's call — it is not decided here.**
- **`maxAgeMs` — CANNOT bind inside a session; it is a calendar property.** The axis is shown FIRING and
  NOT FIRING rather than asserted: a row at `lastUsed = 0` planned against `now = cap+1` evicts
  `["old"]`; the same row against `now = 1` evicts `[]`.

**CELL 6 — D-9: the typical-case timing curve.** 7 reps, engine pre-warmed (the one-off
`import('mermaid')` is discarded, or it would land entirely in the N=1 arm). **A-B-A**: a 10-diagram
cold render interleaved before and after every B block. **Origin is `enhanceDiagrams`** unless the row
says *document-open*, which starts before `mount`.

*A-vs-A (the machine-state control):* Cr **A-early median 148.8 / A-late 153.2 → drift +3.0%**; Fx
**164 / 163 → −0.6%**. **The effects below are 4–6×. The bracket holds, so the run is RESOLVED** — not
8.1's not-resolvable case.

| N | engine | cold: time-to-first | cold: all-resolved (floor / median) | cold: ms/diagram | warm: all-resolved (floor / median) | warm: ms/diagram | **cold/warm** |
|---|---|---|---|---|---|---|---|
| 1 | Cr | 14.1 | 14.0 / **14.1** | 14.1 | 2.4 / **3.0** | 3.0 | **4.7×** |
| 1 | Fx | 16 | 14 / **16** | 16.0 | 3 / **4** | 4.0 | **4.0×** |
| 3 | Cr | 15.0 | 39.9 / **47.5** | 15.8 | 5.6 / **8.4** | 2.8 | **5.7×** |
| 3 | Fx | 15 | 40 / **46** | 15.3 | 9 / **10** | 3.3 | **4.6×** |
| 10 | Cr | 16.0 | 141.1 / **156.8** | 15.7 | 22.6 / **29.5** | 3.0 | **5.3×** |
| 10 | Fx | 15 | 146 / **171** | 17.1 | 34 / **39** | 3.9 | **4.4×** |
| 50 | Cr | 16.7 | 824.6 / **839.6** | 16.8 | 122.4 / **130.7** | 2.6 | **6.4×** |
| 50 | Fx | 18 | 997 / **1098** | 22.0 | 210 / **271** | 5.4 | **4.1×** |

Spreads (min–max), cold all-resolved: Cr 14.0–18.3 / 39.9–51.9 / 141.1–193.0 / 824.6–1067.3; Fx
14–18 / 40–52 / 146–224 / 997–1221. Markdown mount (text paint) is **0.2–1.4 ms** at every N on both
engines — the diagram cost is entirely post-paint, as §3.3 requires.

**THE SHAPE BETWEEN THE POINTS, OBSERVED RATHER THAN ASSUMED LINEAR** (plan §7's words):
- **Cold is near-linear** in N. Amortized cost drifts **14.1 → 15.8 → 15.7 → 16.8 ms/diagram** on
  Chromium (+19% across a 50× range) and **16 → 15.3 → 17.1 → 22 ms** on Firefox (+38%, all of it in
  the last leg). **Firefox is ~1.3× Chromium at N=50** — consistent in direction with 5.2's ~1.7× on the
  flip, smaller in size.
- **★ Time-to-first-diagram is FLAT — ~14–18 ms cold and ~2.4–7 ms warm, at N=1 and at N=50 alike.**
  The enhancer is sequential, so the first diagram costs the same whatever follows it. **D-9 has three
  named axes and they do not move together**: the amortized and all-resolved axes scale with N,
  time-to-first-diagram does not.
- **Warm is ~2.6–5.4 ms/diagram**, i.e. the cache is worth **4–6×** on the whole-document axis at every N
  measured.

**§8's 50-diagram OUTER BOUNDS, verified at that size — stated, not asserted as a test:**

| | Chromium (floor / median / max) | Firefox (floor / median / max) | inherited bound |
|---|---|---|---|
| first open, document-open → all 50 resolved | 825.5 / **840.5** / 1068.2 ms | 998 / **1099** / 1223 ms | **≤ 5 s** — met, ~4.5× headroom |
| cached reopen, same | 123.3 / **131.6** / 229.2 ms | 213 / **273** / 313 ms | **< 1 s** — met, ~3.7× headroom |

**★ INSTRUMENT NON-VACUITY, and the defect it caught.** The instrument must be shown to MOVE with the
thing it measures, or a flat reading means nothing. Three ways, all shown: (1) CELL 3's flip-back counter
moves **0 → 51** across the count bound, identically on both engines; (2) CELL 4b's sweep moves the cliff
**with the bound** (`count ≥ 2N`), so the cliff is a property of the bound and not of the harness;
(3) CELL 6's cold/warm ratio reads **4.0–6.4×**, in line with 5.2's ~5×.
**MEASURED HARNESS DEFECT, found by that check and fixed before anything was recorded:** the first
timing run used the existing 25 ms polling settle, which **floors every arm at ≥25 ms** — the N=1 cold
arm and the N=1/N=3 warm arms all came back at ~25.5 ms and **the cold/warm ratio at N=1 read 1.0×**,
which is the poll, not the cache. D-9 is *specifically* the 1–3-diagram case, so the floor sat directly
on the quantity being measured. Replacing it with a `MutationObserver` on the `pending` attribute moved
N=1 from 25.5 → **14.1 ms cold / 3.0 ms warm (1.0× → 4.7×)**. **Every D-9 number above is from the
observer-driven settle.** A polled settle must not be used to time anything at this scale again.

**WHAT 8.2 DID NOT DO:** no bound value chosen, no target chosen, no constant edited, no threshold test
committed, no production file touched. `PROPOSED_DIAGRAM_COUNT` / `_TOTAL_BYTES` / `_MAX_AGE_MS` remain
the placeholders 4.1 set. **8.4 reads this alongside 5.2's flip cost and 8.1's package/first-paint
numbers, and chooses; 8.5 implements.**

### THE D-11 PLACEHOLDER RECORD (spec 007 task 8.3, measured 2026-08-01 at HEAD `80a86b1`)

*★ **PRODUCES MATERIAL. CHOOSES NOTHING, AND — UNUSUALLY — COMMITS NO TEST.** Everything below is input
to the **9.1 gate-3 walk**, which judges D-11. Nothing here is a verdict on whether the placeholder
should shimmer or stay static.*

**★ WHY 8.3 COMMITTED NO TEST, WHICH IS THE OPPOSITE OF WHAT ITS OWN Verify ASKS FOR.** `tasks.md` §8.3
asks for a `tests/browser` case proving placeholders are *"instant with no animation under
`prefers-reduced-motion`"* **and** *"DO animate without it"*, plus a **revert-and-fail** dropping "the
reduced-motion branch". **Those three clauses are STRUCK.** They are premised on a placeholder shimmer
that **does not exist and that no task in 007 builds** — §8.3's own Files list names `tests/browser` +
fixtures, never `readerCss.ts` or `diagramView.ts`, and the only three tasks that touch `readerCss.ts`
(**3.1** tokens + the visibility rule · **7.1** the control group · **7.2** the lightbox) all landed
without motion. So:

- a test asserting *"the placeholder animates"* is **unwritable** — nothing animates;
- a test asserting `animationName === 'none'` **pins "STATIC"**, which is the *other* answer §8-4
  reserves for the walk (*"whether the placeholder shimmers **or is static**"*);
- **building** the shimmer to make the first test writable **pre-empts the gate D-11 created.**

Every available form of the test decides D-11. So 8.3 records and hands over. **★ `tasks.md` is
gate-sealed and was NOT edited — its §8.3 Verify text still describes the struck clauses. A session
reading `tasks.md` alone will find §8.3 checked off against a test that was never written; this
paragraph is the reconciliation, and whether §8.3 earns an in-file note is a HUMAN call carried to
9.1/9.3.**

**CELL 1 — THE PLACEHOLDER IS STATIC, MEASURED.** A real `pending` figure held pending by a
never-resolving loader, through `mount` + `enhanceDiagrams`, computed style read in-engine.
**Identical on Chromium and Firefox:**

| property, `figure.peekover-diagram[data-diagram="pending"]` | no-preference | `prefers-reduced-motion: reduce` |
|---|---|---|
| `animationName` | **`none`** | **`none`** |
| `animationDuration` | `0s` | `1e-06s` (Cr) / `0.000001s` (Fx) |
| `transitionProperty` / `transitionDuration` | `all` / `0s` | `all` / `1e-06s` |
| `opacity` | `1` | — |
| **`height`** | **`0px`** | — |
| **descendant elements** | **0** | — |

The shipped placeholder is an **empty, zero-height `<figure>`** — `margin:28px 0;padding:0;
overflow-x:auto;text-align:center` (`readerCss.ts:626-629`) and nothing else. No animation, no
transition, no min-height, no children to carry motion. **There is no `[data-diagram="pending"]`
selector anywhere in the sheet.**

**CELL 2 — ★ THE HINGE: WHY NO REDUCED-MOTION TEST IS WRITABLE EVEN IF THE SHIMMER EXISTED.** Asked
*before* writing a control rather than after — this is the **third** occurrence of 7.2's dead-control
finding. A stand-in shimmer was injected into the shadow tree **with no reduced-motion rule of its own**:

| injected `.peekover-diagram[data-diagram="pending"]{animation:… 1200ms}` | Cr | Fx |
|---|---|---|
| no-preference: `animationName` / `animationDuration` / `height` | `scratch83-shimmer` / **`1.2s`** / `120px` | same |
| `reduce`: `animationName` | `scratch83-shimmer` — **survives** | same |
| `reduce`: `animationDuration` | **`1e-06s`** | `0.000001s` |

**READER_CSS's sheet-wide `@media (prefers-reduced-motion:reduce){ :host *{animation-duration:.001ms
!important;transition-duration:.001ms!important} }` (`readerCss.ts:76-79`) already owns any placeholder
suppression.** The placeholder is inside the shadow tree and matched by `:host *` like everything else;
there is no escape route (no JS-driven animation, no property outside the two the rule pins, no element
the selector misses). **A D-11-specific reduced-motion rule would therefore be a DEAD control — bytes
that change no observable — exactly as 7.2 found for the lightbox panel (`readerCss.ts:759-766`).** The
property is required whoever provides it; what 8.3 does not do is pretend D-11 provides it.

**INSTRUMENT NON-VACUITY:** the `1.2s` free reading and the `120px` height are the same probe, in the
same run, seeing motion it was given. **"Static" in CELL 1 is a measurement, not a blind read.**

**CELL 3 — THE 10- AND 50-PLACEHOLDER FIXTURES (the walk material).** **No existing fixture served.**
`tests/golden/fixtures/` held nine documents, **none containing a mermaid fence**; the "50-diagram
fixture" 5.2/8.1/8.2 measured lived inside those tasks' **scratch harnesses and was deleted with them**,
so it exists today only as numbers in this file. §8.3's *"only if no existing fixture serves"* condition
is met, and two documents are added:

| file | fences | bytes | kinds |
|---|---|---|---|
| `tests/golden/fixtures/diagrams-10.md` | 10 | 6,305 | flowchart · sequence · class · state · ER · gantt · pie, cycled |
| `tests/golden/fixtures/diagrams-50.md` | 50 | 28,920 | same cycle |

**Every fence is textually UNIQUE** (verified 10/10 and 50/50 distinct) — load-bearing, because the
diagram cache keys on fence source, so a repeated fence would resolve from cache after the first and the
walk would see a document far faster than any real one. Prose sits either side of every fence so the
figure lands in flow between two text blocks.

**These are MATERIAL, not test inputs. Nothing asserts against them** — `golden.test.ts`'s `FIXTURES`
array is hardcoded and does not glob the directory, so **nothing under `tests/golden/output/` is added or
altered** and the golden diff stays EMPTY. Validated once, in a scratch run that was deleted: **both
documents render every fence on both engines — 10/10 and 50/50 reach `rendered`, `failed: 0`,
`pending: 0`, one `<svg>` per figure.** A fixture that silently degraded would have handed 9.1 a walk
over error markers.

**CELL 4 — WHAT THE READER ACTUALLY SHOWS AT DOCUMENT-OPEN** (the frame the walk starts from), measured
on both fixtures, both engines, at the instant the synchronous prologue returns:

| | `diagrams-10` | `diagrams-50` |
|---|---|---|
| placeholder figures present | 10 | 50 |
| **distinct placeholder heights** | **`0px`** (all) | **`0px`** (all) |
| source `<pre>` fences **visible** (`display` ≠ `none`, height > 0) | **10 / 10** | **50 / 50** |

**★ THERE IS NO "FIELD OF PLACEHOLDERS" TO JUDGE.** The reader opens on a full column of prose and
**visible source fences**; the zero-height figures are invisible siblings. Each fence is replaced
individually as its SVG lands. This is §3.3's post-paint enhancement working as designed, and it
**reframes D-11's question**: the walk is not judging shimmer-vs-static over a grid of grey boxes, it is
judging what should happen in the gap between *"a code fence is on screen"* and *"a diagram is on
screen"*.

**CELL 5 — THE DECISION INPUTS 9.1 NEEDS, derived from 8.2's measured timings (no new timing run).**
The enhancer is sequential, so placeholder *k* stays pending for roughly *k* × the amortized per-diagram
cost. Using 8.2's CELL 6 medians:

| | first fence | last fence, `diagrams-10` | last fence, `diagrams-50` |
|---|---|---|---|
| **cold** (Cr) | **~14–17 ms** | **~157 ms** | **~840 ms** |
| **cold** (Fx) | **~15–18 ms** | **~171 ms** | **~1,099 ms** |
| **warm / cached reopen** (Cr) | ~2.4–3 ms | ~30 ms | ~131 ms |
| **warm / cached reopen** (Fx) | ~3–4 ms | ~39 ms | ~271 ms |

- **Time-to-first-diagram is FLAT (~14–18 ms cold) at every N** — 8.2's finding. The *top* of any
  document resolves in well under a perceptual threshold whatever follows it.
- **The wait is a RAMP, not a uniform delay.** It runs from ~15 ms at the top to **~0.84 s (Cr) / ~1.1 s
  (Fx)** at the bottom of a 50-fence document. **Any motion treatment is therefore sub-perceptual where
  the reader is looking first, and clearly perceptible only far below the fold** — which is the crux of
  "progress or noise" and is stated here as arithmetic, not as an opinion about the answer.
- **Text paint is untouched:** markdown mount is **0.2–1.4 ms** at every N on both engines (8.2), so the
  entire diagram cost is post-paint and the reading experience begins before any of it.
- **50 fences is the HEAVY agent-output case, not the typical one.** 8.2's session model puts the
  typical document at **2 diagrams** and the heavy one at **8**. `diagrams-50.md` is deliberately the
  tail, and a verdict read off it alone would be read off the worst case.

**WHAT 8.3 DID NOT DO:** no static-vs-shimmer verdict, no motion test, no reduced-motion test, no
production file touched (`readerCss.ts` / `diagramView.ts` byte-identical), no constant, no threshold,
no `tasks.md` edit. **§ Baselines' pins were NOT re-run** (finding 3's rule — state it rather than let
the table imply it): 8.3 touched no production file, so the byte pins were re-verified rather than
re-measured — content script **318,747 B** both engines at the recorded md5s, app chunk **387,837 B**,
`permissions: []` — and **first paint was not re-measured**, so those rows still carry 8.1's numbers.
**9.1 judges D-11 from CELLs 1, 4 and 5, walking
`diagrams-10.md` and `diagrams-50.md` on real Chromium and real Firefox; a "reads as noise" or "reads as
broken" verdict there is a finding and becomes a task, not a silent fix.**

**★ ANSWERED — 9.1 HAS NOW WALKED IT, 2026-08-02: D-11 IS CONFIRMED STATIC.** The question 8.3 routed
here is CLOSED, by human verdict on both engines. **The placeholder stays static by DECISION now, not
merely by current implementation, and NO SHIMMER IS BUILT.** Full verdict and its reasoning in the
9.1 walk record immediately below; nothing under `src/` moved to reach it.

### THE 9.1 MILESTONE-CLOSE WALK RECORD (spec 007 task 9.1, walked 2026-08-02 — **COMPLETE, 8/8 items**)
*Walked in two sittings: **items 1–6 and 8 at HEAD `c75a81d`** (recorded at `b18fd9a`), **item 7 at HEAD
`b18fd9a`** (recorded here). Same engines, same conditions; the split is recorded because the record
spent one commit honestly saying seven-of-eight.*

*★ **RECORDS VERDICTS. FIXES NOTHING.** §9.1 names no `Files:` line — its deliverable IS "each item
walked and its verdict recorded" — so the verdicts land here, beside the D-11 record that fed them, by
the § Baselines record precedent (8.2, 8.3). **The one finding that needs code is FILED, not fixed**,
per §9.1's own mechanism (*"a real finding → a task added below this line, not a silent fix"*): it is in
**§ Carried items**, and the fix is its own task in its own session.*

**CONDITIONS — recorded the way the engines are** (finding 2's remedy, the mechanical cause of the one
defect that escaped three gates):

| | as walked |
|---|---|
| **engines** | **real Chromium AND real Firefox**, **extension loaded** — not a harness. Playwright cannot load an extension into Firefox, so this walk is **that engine's only evidence**. |
| **viewport** | **WIDE.** §9.1's ★ clause is satisfied *in kind*. ⚠ **No pixel dimensions were supplied**, so this row records "wide" qualitatively where finding 2 asks for a figure recorded like an engine. **Stated as a gap rather than dressed up as a number** — a later gate should record the digits. |
| **material** | 8.3's `tests/golden/fixtures/diagrams-10.md` and `diagrams-50.md`, and its CELL 4 reframing (the reader opens on visible source fences, not a field of grey boxes). |

**★ §9.1's BODY ENUMERATES EIGHT ITEMS. ALL EIGHT NOW CARRY A VERDICT — §9.1's Verify IS MET.** Seven
were recorded at `b18fd9a`; **item 7 was walked afterwards and is recorded below (2026-08-02)**, which is
what closes the gate. The seven-of-eight state was recorded as found rather than papered over, because
§9.1's Verify is *"each item walked and its verdict recorded"* and a silent seven-of-eight would read as
eight; that gap is now filled rather than re-worded:

| # | §9.1 item | verdict |
|---|---|---|
| 1 | **D-11 — placeholder motion at 10 and 50 diagrams** (progress or noise, in 006's "reads as noise" shape) | **STATIC IS FINE → D-11 CONFIRMED STATIC.** See below. |
| 2 | **Per-diagram control group** — discoverable or clutter | **PASS** — the copy/download buttons are noticeable. Not clutter. |
| 3 | **Legibility of a dense diagram in the lightbox** | **PASS** — readable when enlarged. |
| 4 | **§3.11 touch-input consideration, *if a device is available*** | **N/A — NOT TESTED.** No touch device was available. **Recorded as not-tested, NOT as a pass** — §9.1 conditions the item on a device existing, and none did. |
| 5 | **Firefox everything** (that engine's only evidence) | **PASS** — matches Chromium: rendering, controls, lightbox, theme. |
| 6 | **Zero unexpected network**, Network tab open across import → render → cache → re-theme → export | **PASS** — nothing phoned out. ★ **This is the ONLY evidence for the real loaded extension; no test in the suite proves it** (3.4's import fence is a module-graph assertion, not a wire reading). |
| 7 | **App-page responsiveness after M7** (plan §4-5: *"nothing else will notice"*) | **PASS** *(walked 2026-08-02, after the other seven — the verdict that closes 9.1)*. The human walked the ordinary **reader / watch / snapshot** experience on a **NORMAL page — deliberately NOT the diagram fixtures** — on **real Chromium AND real Firefox**: **no slowdown, no jank versus before M7. Plan §4-5's *"nothing else will notice"* HOLDS** — the diagram machinery did not degrade the non-diagram experience. ★ Note the material is the *complement* of items 1–3's: those walked the fixtures, this one walked a page with **no diagrams in it at all**, which is the only shape that can answer this question. |
| 8 | **Content-script surface** — a mermaid fence still a plain code fence, no affordance, no note (§3.2's gate-1 disposition, walked rather than assumed) | **PASS** — plain code fence on an ordinary page; no affordance, no note. |

**D-11 — CONFIRMED STATIC (the verdict 8.3 routed here).** The human walked both fixtures on both
engines and read the placeholder→diagram swap as **a document SETTLING, not as noise**; at 50 fences the
reflow likewise **read as settling, not as running away**. So:

- **The static placeholder is now the DECISION, not just the current implementation.** 8.3 measured it
  static (CELL 1) and was careful to call that a measurement rather than a choice; 9.1 makes it a choice.
- **NO SHIMMER IS BUILT, and none is owed.** Nothing under `src/` was touched to reach this verdict —
  which is the point: 8.3 showed every writable form of the motion test *decides* D-11, so building the
  shimmer to make one writable would have pre-empted this gate. The gate ran instead.
- CELL 5's arithmetic held up in the walk: time-to-first-diagram is flat (~14–18 ms cold) and the wait is
  a **ramp** down the document, so the motion question was always sub-perceptual where the reader looks
  first. The verdict is consistent with the material rather than in tension with it.
- **8.3's struck-test paragraph stands as written.** `tasks.md` §8.3's Verify still describes a
  reduced-motion test premised on a shimmer that does not exist and now never will; whether §8.3 earns an
  in-file note remains the HUMAN call 8.3 carried to **9.3**.

**★ ONE FINDING — DARK-MODE DIAGRAM TEXT RENDERS BLACK (dark theme ONLY).** Text that **mermaid itself
draws as text on the canvas** — the pie's title and legend, the gantt's axis DATE labels — renders
near-black on the dark background and is **unreadable**. The **same** labels are readable on the LIGHT
theme (dark-on-light), and text on **coloured fills** (the gantt's "parse / sanitize / adopt" task bars)
stays readable in **both**. Diagnosis, stated as a diagnosis and not as a fix: **the diagram DOES
re-render on the theme flip — D-7 works — but some of mermaid's own label colours are not being driven
by the effective theme and fall back to mermaid's dark defaults.** This is a **D-7 THEME-LEGIBILITY gap**
— not D-11, and not a render failure (nothing is blank, nothing errors). **It is FILED, not fixed:** the
task is in **§ Carried items**, and it carries the gantt date-axis sub-item as an open question.

**WHAT 9.1 DID NOT DO.** No shimmer. **No `src/`, `tests/`, `entrypoints/` or `specs/` file touched** —
the walk's whole output is prose, and a recording task that moved production would have invalidated the
thing it was recording. **No `tasks.md` edit** (see the note below). **§ Baselines' pins were NOT re-run**
(finding 3's rule — state it rather than let the table imply it): 9.1 touched no production file, so the
byte pins were **re-verified against the standing build, not re-measured** — content script **318,747 B**
both engines at the recorded md5s (Cr `c7b33b36…`, Fx `67717921…`), app chunk **387,837 B**,
`permissions: []` both, manifests **654 / 770 B** — and **first paint was not re-measured**, so those
rows still carry 8.1's numbers.

**⚠ WHERE §9.1 SAYS A FINDING GOES, AND WHY IT WENT SOMEWHERE ELSE — the tension is recorded, not
resolved silently.** §9.1's words are *"a task added **below this line**"*, and "this line" sits in
`specs/007-mermaid-diagrams/tasks.md`. **That file is gate-sealed and has not been edited since its
draft** — its 28 boxes are all still `[ ]`, no task in 007 has ticked one, and 8.3 recorded the seal
explicitly. **The precedent for exactly this phrase is already banked:** 8.4's D-10 (b) carried work
cited *"§9.1 is this milestone's stated mechanism for adding a task"* and landed in **§ Carried items**
rather than in `tasks.md`. This finding follows it. **The tension is real and belongs to a human:**
if the intent was a literal `tasks.md` insertion, that is a **9.3** call — the same reconcile that owns
the "2975 B" mislabel and the §8.3 struck-test note.

**★ 9.1 IS COMPLETE.** All eight items have verdicts — **six PASS** (2, 3, 5, 6, 7, 8), **one decision**
(1: D-11 CONFIRMED STATIC), **one N/A — not tested** (4: §3.11 touch, no device). §9.1's Verify, *"each
item walked and its verdict recorded"*, is **MET**, and with it **M7's last human gate is discharged**.
**The gate is closed; the defect it surfaced is still owed.** The dark-mode fix is **NOT part of 9.1** —
§9.1's Verify is "each item walked and its verdict recorded", and its own mechanism (*"a real finding →
a task added below this line, not a silent fix"*) makes a finding a *separate* task rather than work
folded back into the gate. **Filing 9.1 complete does not close that finding**; it is in § Carried items
and remains its own task in its own session.

### THE 9.3 RECONCILE RECORD (spec 007 task 9.3, reconciled 2026-08-02 at HEAD `94f7da5` — **the last task of M7**)
*The milestone's LAST act: make M7's records TRUE before M7 is sealed. **Doc-only** — `git diff --name-only`
is `docs/ai/architecture.md` + `docs/ai/progress.md` and nothing else. 9.2's retro routed a set of items
here; this record is where they are answered.*

**★ THE METHOD, AND IT IS THE REASON THIS RECORD EXISTS RATHER THAN A FIND-AND-REPLACE. "STALE" IS THREE
DIFFERENT PROBLEMS WITH THREE DIFFERENT RIGHT ANSWERS**, and treating the routed list as uniform would
have produced a worse file than leaving it alone. Every routed item was sorted BEFORE anything was edited:

| # | routed item | kind | handling |
|---|---|---|---|
| 1 | **§ Baselines app-chunk row** (387,837 B) | **A — live figure** | **Re-derived from a clean build at HEAD: 389,143 B**, md5 `65486f78…`, both engines. Row updated; per-row provenance added. |
| 2 | **§ Baselines suites rows** (911/15/98) | **A — live figure** | **Re-run: browser 927 passed / 15 skipped / 100 file-instances; unit 728 / 51 files** (unit was already correct). Row updated. |
| 3 | **§ Baselines other artifact rows + md5s** | **A — live figure** | Re-derived: content script **318,747 B** both engines (md5s **unchanged** from 8.1 — Cr `c7b33b36…` / Fx `67717921…`), background **3,548 B**, zips **1,300,383 / 1,300,442 B**, packed **4,059,893 / 4,060,009 B**, built manifests **654 / 770 B**. Zip and packed rows were ALSO stale and were not on the routed list — found by re-deriving every row rather than only the two named. |
| 4 | **§ Baselines first-paint provenance** | **A — but the honest answer is NOT a new number** | **NOT re-run**, and the table now says so per row, with the reason stated under it (§9.3's Verify licenses exactly this branch: *"either carries re-run numbers or states plainly that it did not re-run them, and why"*). |
| 5 | **`architecture.md`'s `enhance` stage** | **A-like — ordinary doc, make it true** | **Corrected**, content taken VERBATIM from gate-2 (c) (`decisions.md` **2026-07-27 · M7 GATE 2**, sub-decision (c)) rather than invented. See the § below. |
| 6 | **"2975 B" mislabel's SOURCE TEXT in `tasks.md`** | **C — sealed file** | **`tasks.md` NOT edited.** Correction recorded here and in 8.1's own § Baselines bullet. Resolved by cited precedent, not by judgment — see § below. |
| 7 | **`decisions.md`'s `PROPOSED_` line-refs** (`:95`/`:106`/`:117`) | **B — dated historical record** | **LEFT EXACTLY AS WRITTEN. `decisions.md` is not in this commit at all.** Current locations recorded here instead. See § below. |
| 8 | **The checkbox convention** (28 boxes still `[ ]`) | **DECISION** | 9.3's own scope resolved by precedent (it does NOT tick); the convention question itself **ROUTED TO A HUMAN** and filed in § Carried items. See § below. |
| 9 | **§9.1's preamble-vs-body count + its "a task added below this line" wording** | **C / DECISION** | Divergence recorded here; `tasks.md` not edited; the filing wording resolved by **8.4's D-10 (b) precedent**, which is explicit. See § below. |
| 10 | **§8.3's struck Verify clause — does it earn an in-file note** | **C / DECISION** | An in-file note IS an edit to sealed `tasks.md`, so the same precedent answers it: **no in-file note; the record lives here.** |
| 11 | **§ Blockers' inversion-prone bullet + the five-site pointer sweep** | **A — pointer state** | Swept and advanced to **M7 CLOSED**; the inversion bullet takes its **SEVENTH** correction. |
| 12 | **`spec-coverage.md`'s F2 score** | **B + routed** | **NOT re-audited, NOT edited.** See § below. |

**★ WHY KIND B IS THE DEFAULT WHEN THE SORT IS UNCERTAIN.** A wrongly-frozen live figure is small and
catchable — the next build re-derives it. A silently-rewritten historical record is a **permanent lie in
the ledger**: a dated entry made to assert facts that were not true on its date, with nothing left to
reveal the edit. The two failure modes are not symmetric, so the tie-break is not symmetric either.

**★ KIND B — WHAT WAS PRESERVED, AND THE POINTER THAT REPLACES A REWRITE.** `decisions.md`'s three
2026-08-01 D-8 entries cite `PROPOSED_DIAGRAM_COUNT` (`diagramCache.ts:95`), `PROPOSED_DIAGRAM_TOTAL_BYTES`
(`:106`), `PROPOSED_DIAGRAM_MAX_AGE_MS` (`:117`) and `PROPOSED_BOUNDS` (`:120`). **8.5 (`c75a81d`) then
renamed all four and moved them**, so at HEAD they are `DIAGRAM_COUNT` **:92** · `DIAGRAM_TOTAL_BYTES`
**:103** · `DIAGRAM_MAX_AGE_MS` **:116** · `DIAGRAM_BOUNDS` **:119** (fields at `:120-122`). **Those
entries are CORRECT-BY-CONSTRUCTION as dated snapshots** — on 2026-08-01 the names and lines they cite
were the names and lines in the tree, and 8.5 had not run. Editing them to today's numbers would make a
dated entry lie about when its facts held, and would erase the evidence that the rename happened at all.
**So they are untouched, and this is the forward-note** — deliberately placed HERE rather than appended to
`decisions.md`, because **§9.3's own Verify says `decisions.md` is *"read and left untouched unless a
genuine decision landed"*, and a rename pointer is not a decision.** A reader chasing `PROPOSED_*` should
land here.

**★ KIND C — THE SEAL, AND WHY 9.3 DOES NOT BREAK IT EVEN TO FIX A TRUE ERROR.**
`specs/007-mermaid-diagrams/tasks.md` is **gate-sealed**: 28 boxes, `[ ]` on every one, and its last five
commits are all **pre-implementation** (`bfa131e` draft, two clause corrections, two gate amendments) —
**no commit since task 1.1 has touched it.** Three routed items would each need an in-file edit, and none
gets one:
- **The "2975 B" mislabel.** The string `2975` appears **29 times** in `tasks.md` — **24** of them the
  exact fence phrase *"manifest green **2975 B**"*, the other five split across a line wrap or written in
  the preamble's *"`tests/manifest.test.ts` green and **2975 B, byte-unmodified since `3b6c575`**"* form
  (`:33`, `:389`, `:482`, `:507`, `:612`). **★ The preamble form at `:33` and §7.3's at `:482` are the two
  that are actually CORRECT** — they name `tests/manifest.test.ts` explicitly. **It is the bare fence
  phrase that misleads**, by attaching a test-file size to the word "manifest" in a line otherwise made of
  shipped-artifact checks. **The measurement was always right and the NAME was always wrong:**
  **2,975 B is `wc -c tests/manifest.test.ts`** — a TEST FILE, byte-unmodified since `3b6c575` — while the
  **BUILT manifests are 654 B (Chrome) / 770 B (Firefox)**, `permissions: []` and no
  `web_accessible_resources` on both (re-derived at 9.3). The shipped artifact the phrase appears to name
  is **4.5× smaller** than the number beside it. **The correct written form is "test-file 2,975 B / built
  manifests 654 + 770 B."**
- **§9.1's preamble-vs-body count** (retro finding 6): the front matter *"enumerates"* **six** human-run
  items; §9.1's body lists **eight**, omitting *app-page responsiveness after M7* and *the content-script
  surface*. **The one item that needed a second sitting is one of the two the preamble omits.**
- **§8.3's struck Verify clause**: it still describes a reduced-motion test premised on a shimmer that
  does not exist and, after 9.1's *D-11 CONFIRMED STATIC*, never will.

**THE PRECEDENT THAT DECIDES ALL THREE, AND IT IS EXPLICIT RATHER THAN INFERRED — 8.4's D-10 (b)
(`decisions.md` 2026-08-01).** Faced with real work that belonged in no task's Files list, that entry
ruled: *"It is deliberately **not** added to `specs/007-mermaid-diagrams/tasks.md`: 8.4's Files list is
`docs/ai/decisions.md` alone."* **A task's Files list is the fence, and a true correction does not
override it.** **§9.3's Files list is `docs/ai/architecture.md` · `docs/ai/progress.md` ·
`docs/ai/spec-coverage.md` — `tasks.md` is not in it.** So the corrections land here, which is also where
both 9.1 findings landed and where D-10 (b)'s own carried work landed. **★ Stated plainly rather than
buried, because it is the one thing a later reader could reasonably call a miss: the SOURCE TEXT of all
three errors is still in `tasks.md` and a reader who never opens this file will still read "manifest green
2975 B" 24 times. That is the accepted cost of the seal, not an oversight.** Whoever edits `tasks.md` next
— under a gate, or in an M8 planning pass that re-opens it — should carry all three.

**★ THE CHECKBOX CONVENTION — 9.3's OWN SCOPE IS SETTLED; THE CONVENTION IS A HUMAN CALL AND IS NOT TAKEN
HERE.** The facts, counted rather than recalled: **001 15/15 · 003 15/15 · 004 19/19 · 005 25/25 ·
006 20/20 ticked; 002 0/15; 007 0/28.** 006 ticked **per task, in each task's own commit** (22 commits
touch its `tasks.md`). 007's own title line says *"check off in order"* and **28 tasks landed without one
box moving**, with **no landing notes in the file at all** — so a future planner reading only the boxes
sees **0/28**, and the two out-of-plan fixes are invisible in them (M6 finding 3 recurring, and worse).
**Two questions, and only one of them is 9.3's.** **(i) Does 9.3 tick them? NO — settled by the D-10 (b)
precedent above: `tasks.md` is outside 9.3's Files list.** And ticking 27 boxes in one close commit is not
the repo convention anyway; the convention is *per task, in that task's commit*, which cannot be done
retroactively. **(ii) Should they ever be ticked, and does the convention hold for M8? THAT IS A HUMAN
DECISION and it is NOT taken here** — it is how this repo tracks done-ness, not a typo. **Filed as an open
item in § Carried items.** The options, stated without a recommendation being smuggled in: **(a)** tick all
28 in a separate, explicitly-scoped human-approved commit and note the retroactive framing; **(b)** leave
007 unticked and record in M8's tasks file that the pointer — not the boxes — is this repo's done-ness
signal; **(c)** keep per-task ticking as the convention and add it to M8's standing invariants so the
divergence does not recur.

**★ §9.1's "A TASK ADDED BELOW THIS LINE" — RESOLVED BY WHAT M7 ACTUALLY DID, WITH THE CITATION.** §9.1's
mechanism says a *"reads as broken / clutter / illegible"* verdict becomes *"a task added below this line,
not a silent fix"* — i.e. a new numbered task inside the sealed `tasks.md`. **M7 never once did that.**
Both 9.1 findings were filed in **§ Carried items** and fixed in their own sessions and commits; and
D-10 (b) — new work found at a human gate, the exact shape §9.1 describes — was **explicitly** banked in
§ Carried items with its reasoning stated, *citing §9.1's own mechanism while declining to use it.* **So
the governing convention, three instances deep and written down once, is: a gate finding is filed in
`progress.md` § Carried items; §9.1's "below this line" wording describes a mechanism this milestone did
not use.** Recorded, not edited — the wording lives in the sealed file.

**★ `spec-coverage.md` — NOT RE-AUDITED, AND THE OMISSION IS DELIBERATE AND STATED.** It is dated
**2026-07-27 at HEAD `d470ab2`** — entirely pre-M7 — and scores **F2 Math & diagrams at 3% (18 items:
0 shipped, 1 partial)**. **M7 shipped diagrams, so F2's score is stale by construction**, along with §6-6's
*"re-themed diagrams"* row and the dependency count (**4 → 5**). It is not corrected here for two reasons,
both citable: §9.3's own Files line makes it **conditional** (*"F2's score, **if** the coverage file is in
the reconcile's scope at that time"*), and a coverage score is a **weighted re-audit of 18 rows against
shipped code** — an audit task with its own evidence standard, not a figure a reconcile can re-derive from
a build. **Routed: F2 is re-audited before M8's scoping, since M8 selection reads this file.** Filed in
§ Carried items.

**★ WHAT 9.3 MEASURED, SO THE FIGURES ABOVE ARE READINGS AND NOT CARRIES.** Clean build both engines,
`pnpm zip` both engines, full unit and browser suites, all at HEAD `94f7da5`. **Nothing built changed** —
9.3 is doc-only, and the content script's per-engine md5s are **identical to 8.1's**, which is the control
that says the build was reproduced rather than merely re-run. Every § Baselines artifact row was
re-derived, **including the rows nobody routed here** — which is how the stale zip and packed-tree rows
were found.


### The task-by-task narrative, verbatim as it stood in `progress.md` § Up next at close

### M7 (spec 007) — persona #1 completion via M7a (Mermaid + diagram cache) · **CLOSED 2026-08-02 at task 9.3**

> **★ THIS SECTION IS NO LONGER "UP NEXT" — IT IS M7's FINISHED IMPLEMENTATION NARRATIVE, kept in place
> until the archive pass moves it to [`progress-archive.md`](progress-archive.md) the way M6's was.**
> **28/28 tasks · 9/9 groups · no gate outstanding.** Read it as history. **There is NO next task in
> 007** — the next act is **M8 scoping**, and nothing below this line is a live pointer.

**Scope is SETTLED and all three gates are behind it** (see § Now). M7a is **Mermaid + a diagram
cache**; the rest of persona-#1 quality-of-life (compare-any-two-files, agent-file awareness, table
tools) is on spec §6's IS-NOT fence and is **not** in this milestone. The argument that selected it:
six milestones landed almost entirely inside persona #1's column,
[`spec-coverage.md`](spec-coverage.md) puts that column at **~56%**, and the largest remaining hole in
it is the one item that needs a dependency Peekover has never installed.

**Implementation runs task-by-task from `specs/007-mermaid-diagrams/tasks.md`, one commit per task,
this pointer advancing in that same commit.** ★ **NEXT: NOTHING — 9.3 (`architecture.md`'s gate-2 (c) correction + the memory reconcile) IS DONE, GROUP 9 IS COMPLETE, AND M7 IS CLOSED (2026-08-02). 28/28 tasks, 9/9 groups, no gate outstanding.** This line has asserted a pending next-task since 1.1; it now asserts none, and the next thing this file points at is **M8 scoping**. **9.3's own record — the KIND-sort, the re-derived § Baselines figures, the sealed-file corrections it recorded rather than made, and the two decisions it routed to a human (the checkbox convention; `spec-coverage.md`'s F2 re-audit) — is § Baselines' *THE 9.3 RECONCILE RECORD*.** ★ **9.2 IS DONE — the M7 retro is banked in `docs/ai/retro.md` (2026-08-02, nine findings), with §9.2's owed floor-delta statement present and numbered (145.3 ms against M6's 132.1 ms, +13.2 ms, no re-baseline proposed).** ★ **BOTH 9.1 FINDINGS ARE FIXED** — dark-mode diagram text (`662b90e`) and the gantt date-axis overprint (`fc3a142`), each in its own session and its own commit; **M7's human-gate defect count is TWO and the score is 12/12.** ★ **9.1 IS COMPLETE — M7 OWES NO FURTHER HUMAN GATE.** The gate ran on real Chromium and real Firefox (extension loaded, wide viewport) and **all eight** items in its verdict table (§ Baselines) now carry a verdict: **D-11 CONFIRMED STATIC** (no shimmer built), **six PASSes** — including **item 7, app-page responsiveness after M7, walked last on a NORMAL non-fixture page on both engines: no slowdown, no jank, so plan §4-5's *"nothing else will notice"* holds** — and §3.11 touch **N/A — not tested** (no device). Its **one finding — dark-mode diagram text renders black (a D-7 theme-legibility gap, with the gantt date-axis overprint as an open sub-question)** — is **FILED in § Carried items, NOT fixed**: closing the gate did not close the defect, and the fix is **its own task in its own session**, not a numbered 9.x and not a blocker for 9.2/9.3. — *(★ **GROUP 8 IS
COMPLETE**: 8.1 · 8.2 · 8.3 · **8.4** · **8.5**. 8.4's human gate CHOSE, and the six
values are banked in `decisions.md` (2026-08-01, one entry each, each naming its § Baselines
measurement): **count 150 · totalBytes 8 MiB · maxAgeMs 30 days · D-9 165 ms · D-10 (b) · flip cost
accepted** — and **8.5 has now IMPLEMENTED the three that map to constants**: `DIAGRAM_COUNT` 100 → 150,
`DIAGRAM_TOTAL_BYTES` and `DIAGRAM_MAX_AGE_MS` unchanged in value but recorded, the `PROPOSED_` framing
off all four names, 4.1's structural pin green with no expected number edited, and the eviction
ALGORITHM byte-untouched. **D-9 / D-10 / the flip map to no constant, and none was created.**
**9.1 WAS BOTH the next numbered task and the next human gate, and the gate HAS NOW RUN** (2026-08-02)
on 8.3's 10- and 50-placeholder fixtures as its material — **verdicts recorded, D-11 confirmed static,
one finding filed, item 7 outstanding**. **8.3 fed 9.1, not 8.4** — it produced D-11
walk material and chose nothing. This line was corrected by 8.2 after reading `Next: 6.2` at `df256d6`,
four numbered tasks behind § Now; **FIVE pointer sites were re-checked at 8.5** (§ Now, this line,
§ Carried items, § Blockers — and a FIFTH the sweep turned up inside § Baselines' 8.2 record, which
was still asserting *"GROUP 8 REMAINS OPEN: 8.5"*) and all five agree at 9.1 / group 9. **The same five
were swept again at 9.1** — § Now, this line, § Carried items, § Blockers and § Baselines' records —
agreeing at the time on the post-walk state (*9.1 walked, item 7 unwalked so 9.1 stays OPEN, one finding
filed*), **again at 9.2** (which also caught three sites the two post-gate fix commits had left describing
the dark-mode defect as unfixed — retro finding 7's own evidence), **and a FOURTH and FINAL time at 9.3.**
★ **THE 9.3 SWEEP IS THE MILESTONE'S LAST, AND ALL FIVE NOW AGREE ON ONE STATE: M7 CLOSED — 28/28 tasks,
9/9 groups, no gate outstanding, no next task in 007.** The state each site had been asserting since 1.1
— *a pending next task* — is false for the first time, which is precisely the condition that has broken
this line five times before; it is written as an explicit **NONE** rather than left to be inferred from
silence.)* Groups 1 (1.1 ·
1.2 · 1.3) and 2 (2.1 ·
2.2) are complete, and the two D-1/D-6 ADDENDUM implementations that sit between them and group 3 —
the `secure` hardening (`3d7c8ed`) and the `<style>` CSS pass (`367d051`) — are both landed. Neither
is a numbered task, so neither advanced this pointer; `ff8f323`'s `<style>` blocker is CLOSED.
**GROUP 3 IS COMPLETE: tasks 3.1 (`1e09164`), 3.2 (`763f94d`), 3.3 (`ace4543`) and 3.4 (`522a3fe`) are DONE** — D-15's structure and
the synchronous prologue, then the async render body that loads the engine, sanitizes and adopts.
★ **The ~3.3 MB lazy chunk now EXISTS** (99 chunks / 3,347,306 B behind one `import()`), and the
content script is md5-IDENTICAL through it — the engine is on the app-page graph only, which 3.4 now
asserts STRUCTURALLY rather than leaving to the byte reading. **GROUP 3 IS COMPLETE.** The §4
remote-reference sub-arc is closed with it (`4061398` · `eae7b08` · `7a6dc63`). **GROUP 4 — THE
CACHE, END-TO-END (D-2 · D-3 · D-4 · D-14) — IS NOW OPEN**, and it is the first group whose
subject is persistence rather than rendering; nothing in group 3 pre-decided any of it (3.4's
Verify draws the boundary explicitly: the cache is NOT 3.4). **Task 4.1 (`443bdee`) is DONE** —
the pure layer, wired to nothing. **Task 4.2 (`01339fd`) is DONE** — the schema bump: `DB_VERSION`
3 → 4 with `diagramMeta` + `diagrams` appended to `SCHEMA` (**two stores, not one** — D-2),
additive-by-name with no migration code, `idbCore.ts` byte-identical and its `:5-9` STOP signal not
tripped, and all SIX existing stores' rows proven to SURVIVE the bump on real engines — like 4.1 it
**STORES NOTHING**. It also CORRECTED a fence premise: `store.ts` is content-script-reachable via 006's
capture wiring, so the content script moves by the ACCOUNTED schema delta (+113 B, decomposed with zero
residual) rather than not at all. **Task 4.3 (`a3005db`) is DONE** — THE CACHING COMMIT, and it did
not split: cache→enhancer, the REQUIRED `StoredSummary.diagrams`, the panel line, the third storage
control, `wipeAll` + `clearDiagramCache`, and the whole `PERMISSIONS.md` correction, all in one commit
(D-14). The seam question 4.2 carried is **answered with a ZERO**: content script byte- and
md5-identical both engines, and 3.4's import fence green 8/8 — the cache never touched that graph.
**Task 4.4 (`f133913`) is DONE — and GROUP 4 IS COMPLETE.** The cache under WATCH, proved through
the PRODUCTION path (`installWatchForFile` → `watchController`'s render seam → `renderWithDiagrams`),
never a hand-built controller: prose changes / fence byte-identical → the diagram serves from cache
with the engine NOT invoked, non-vacuous in the same test on both sides (the cold first render
invokes it; a fence-only edit invokes it again). Plus the quiet single-oversized path, asserting
PRESENCE and ABSENCE together — the figure really renders, no marker appears, nothing is stored, and
nothing is evicted. TEST-ONLY: both bundles byte-identical, no production file touched.
**Task 5.1 (`85d5cbc`) is DONE** (see § Now). The re-theme subscribes at
`applyTheme()` via `themeRegistry.ts`’s new `onEffectiveThemeChange`, NOT at `onThemeSettingChange()` —
and that choice is pinned by the defect it avoids, not by a doc comment: the red-first reverts to the
setting channel and an OS flip under `auto` leaves every diagram stale on both engines while the page
repaints. Re-render-and-swap keeps the previous rendering visible throughout (never blank, asserted by
frame sampler AND MutationObserver replay), the second flip is a cache HIT on group 4’s two rows, and
in-flight coalescing + pass supersession cut 3 renders per flip to 1. ★ The fence is RE-BASELINED:
`themeRegistry.ts` is on the content-script graph, so the content script moves by the D-7 notify loop
and only that (**316,122 B both engines, +35 B**, ablation-accounted); the ENHANCER stays OFF that graph,
proved structurally by 3.4’s import fence (8/8) and by greps with a firing control.
**Task 5.2 (`270dc82`) is DONE — and GROUP 5 (THEME SYNC, D-7) IS COMPLETE.** The flip-cost measurement, which
PRODUCED NUMBERS AND CHOSE NOTHING: at 50 diagrams the worst case — the first flip to a
never-rendered theme, a full miss on every one — is **Chromium floor 522.3 ms / median 538.9 ms** and
**Firefox floor 900.0 ms / median 910.0 ms**, A-B-A bracketed against a same-session cold-render
control whose two halves agree to −2.4% / −0.4%. The flip back is a full hit at roughly a fifth of
that. The cost is the ENGINE (≈77% of the window), not the cache write-through (≈1.5% / 0.2%), and
there is **no flicker** at 50. It is a **doc measurement, not a committed test** — §5.2's Files list
names only this file plus the task report, and a committed time bound would both flake and smuggle
in the threshold 8.4 owns. **Nothing chosen, no bound picked, and plan §1.3's progressive
visible-first fallback NOT built** — gate 2 re-routed §7-9's flip cost to **gate 3**, which reads
these numbers at **8.4**. See § Now for the full figures and the `PROPOSED_DIAGRAM_COUNT` saturation
finding.
**Task 6.1 is DONE — and GROUP 6 (SYSTEMIC FAILURE AND DEGRADATION) IS NOW OPEN.** The whole lazy
chunk fails to load, so no fence ever gets an SVG — and the fallback state **IS** the pre-enhancement
state, because D-15 only hides the source on SUCCESS. Four distinct diagrams, driven through
`appShell.ts`’s shipped `mount` → `enhanceDiagrams` body with the injectable loader (present since 3.2)
forced to REJECT: all four fences visible and readable with their OWN source verbatim, zero
placeholders left, four §3.8 markers naming the engine load, prose intact at both ends, the non-mermaid
fence untouched, and the reader still interactive through the shipped Raw/Reading control. **The shape is
plain visible source plus the per-fence marker — no banner was invented**; what makes it SYSTEMIC is the
uniform count, not a different presentation. Two reverts, both engines, restored from a `cp`: removing
the catch reds naming **4 stranded placeholders**, and a catch that clears `pending` without removing
the box reds on **4 figures left over**. The interactivity clause has **no revert of its own** and is
recorded as such. **TEST-ONLY** — both bundles byte-identical, no production file touched.
**Task 6.2 is DONE (`a222af5`) and GROUP 6 IS COMPLETE** — an unopenable/un-upgradable schema SAYS
caching is unavailable, while a merely rejecting write stays quiet (4.3’s case, unchanged).

**GROUP 7 (COPY · DOWNLOAD · LIGHTBOX) IS OPEN; tasks 7.1 AND 7.2 are DONE** — the per-diagram
control group (copy-as-image, download-as-SVG) and the lightbox, all three operating on the artifact on
screen. See § Now for the full record. **Row 21 is discharged: the focus-trap-and-restore baseline now
EXISTS**, hand-rolled rather than borrowed from `<dialog>` precisely so that trap, restore, Escape and
initial focus each have a defect available to them — every one verified to actually red on both engines.
**TASK 7.3 IS DONE and GROUP 7 IS COMPLETE** — the empirical re-proof on
both engines that neither action needs a MANIFEST permission, built rather than read: real trusted clicks
through the engine's own clipboard and the anchor's own default action, then both **built** manifests
re-read from `.output/` (654 B Cr / 770 B Fx, `permissions: []`, no `web_accessible_resources`). The
finding is that the two engines gate the clipboard differently and **neither gate is a manifest key** —
Firefox has no such permission at all, Blink wants a browser CONSENT, proven by an A-B ablation with
nothing rebuilt between the arms. **8.1 IS NOW DONE** (D-10 re-baseline, group 8 open).
**TASK 8.2 IS NOW DONE — D-8 + D-9 MEASURED, AND NOTHING CHOSEN.** *(8.3 has since landed too — D-11
walk material, no test, nothing chosen; and **8.4's human gate has since CHOSEN from these numbers** —
the six values are banked in `decisions.md` 2026-08-01, and the paragraph below records what each one
was, and **8.5 has since SET them — GROUP 8 IS COMPLETE**.)*
What D-8 and D-9 actually bound, resolved from `decisions.md` / plan §0 / spec §8 BEFORE measuring,
because a measurement aimed at the wrong quantity produces confident useless numbers: **D-8 is the
three-axis CACHE BOUND** — `count` (rows, placeholder **100**), `totalBytes` (bytes over stored SVG,
placeholder **8 MiB**), `maxAgeMs` (ms on `lastUsed`, placeholder **30 days**), all global,
oldest-first, whichever binds first (D-4 settled the axes; the values are open). **D-9 is NOT a cap at
all** — it is the **typical-case (1–3 diagram) time-to-rendered TARGET**, in milliseconds, that 8.4
sets from measurement. Both curves are in § Baselines → *THE D-8 / D-9 BOUNDS MEASUREMENT*. Headlines,
none of which is a recommendation: **the count axis binds in every session shape measured and the byte
axis never does** (it settles at ~51% of the 8 MiB cap while `count` sits pegged at 100/100); the
eviction cliff at the placeholder is **TOTAL, not graded** — 50 diagrams × 2 themes = 100 rows is a
FULL flip-back hit, 51 diagrams = 102 rows is a **full flip-back MISS of all 51**, because each
re-render's write evicts the next row the same pass is about to need; and D-9's cold cost is
**~15–17 ms/diagram (Cr) / ~15–22 ms (Fx)**, near-linear, with **time-to-first-diagram flat at
~14–18 ms regardless of N**. A-B-A resolved (drift +3.0% Cr / −0.6% Fx against 4–6× effects).
**Scratch harness deleted; both bundles byte-identical; no value chosen, no threshold committed.**
**8.4 HAS SINCE CHOSEN FROM THESE NUMBERS:** `count` **150** (from 100), `totalBytes` **8 MiB**,
`maxAgeMs` **30 days**, D-9 **165 ms** median cold per-diagram-amortized, D-10 **(b)**, flip cost
**accepted** — banked as six dated entries in `decisions.md`, each naming the cell above that justifies
it, and each carrying its caveats (D-9 excludes the engine import, is un-enforced, and leaves
user-facing first-open unmeasured; D-10's (d) is inert and collapses into (c); the flip acceptance is
void if `count` drops below 2×(typical heavy N); `maxAgeMs` is a policy judgment that will never become
measured; `totalBytes` is a valve by design). **9.1 — the milestone-close walk — HAS RUN; its verdicts are in § Baselines and it stays OPEN on item 7.** *(8.5 set the constants; ★ GROUP 8 IS COMPLETE.)* *(8.3 landed in between
and was NOT an input here: it produced D-11 walk material for 9.1, committed no test and chose nothing —
its own record is § Baselines → *THE D-11 PLACEHOLDER RECORD*. The half of §8.3 this line used to call
"the reduced-motion half that IS a test" was **struck**: the placeholder is static, nothing in 007
builds motion, and the sheet-wide `:host *` rule already owns any suppression.)*

- **DISCHARGED, recorded so it is not re-raised: the persona-#1 completion decision IS NOW BANKED** in
  `decisions.md` (`87cd026`, the M7 DIRECTION entry). The archive pass's flag is closed.
- **M7 owes a FLOOR-DELTA STATEMENT before any further first-paint re-baseline discussion**
  (`retro.md` 2026-07-27, finding 8), plus the optimisation question `decisions.md` 2026-07-26 routed
  to it — 006's +15.7 KB content-script growth is legitimate but, per the human note at 9.1, not
  sacred.
- **Before the first task of any group, re-read the standing rules that keep costing time when
  skipped:** `docs/ai/decisions.md` (the harness ledger, the dead ends, the both-engines gate
  procedure) and `docs/ai/retro.md` (newest entry first).

---

## M6 · spec 006 — snapshots + diff · CLOSED 2026-07-27

*Nine groups, **twenty planned tasks, ZERO discovered tasks** — plus **five unplanned recovery sessions
the box list cannot see**. Code-complete, human-gated (**9.1 PASSED 2026-07-26**, both engines, both
surfaces, Network tab open — **three layout defects found plus a disclosure gap**, all fixed before
close), retro at 9.2. Moved here 2026-07-27 by the post-M6 condense/archive pass, after the durable
facts were promoted.*

**What was promoted out of the text below, so you do not have to mine it:**
- **`decisions.md` 2026-07-22/23** — D-1…D-16, the gate-1 spec approval, the gate-2 plan approval and
  the two gate-3 product calls (D-11's "changed again" copy; snapshot survival is architectural).
- **`decisions.md` 2026-07-26** — D-8's three chosen bound VALUES and the mental model they encode
  (count binds active usage · bytes is the safety cap · age is the abandonment valve); the
  first-paint gate's re-baseline `<150` → `<165` ms; the two carried 9.1 items.
- **`decisions.md` 2026-07-27** — the §6 side-quest's four sub-decisions and the §6-17 correction of
  record (this one lands *after* the milestone, but it is what M6's audit produced).
- **`retro.md` 2026-07-27** — the nine M6 findings, including the two retractions as one defect class,
  the gate-score correction, the broken "none escaping" invariant, and the pointer-walk rule.
- **`progress.md` § Baselines / pins** — the current measured numbers, which stay there rather than
  being archived. The M6-close values are frozen in the table below instead.
- **`specs/006-snapshots-diff/tasks.md`** — **the task-by-task detail, box by box, including 9.1's
  full gate landing block.** That file is the record; nothing below replaces it.

### The close record

**WHAT SHIPPED.** Snapshot capture on the app page, bounded retention (**count 15 / 20 MiB / 30 days**,
D-8), a global erase control, a **persistent** capture disclosure, and an inline line-diff against any
stored snapshot — with **`permissions: []` still intact**, the **FIRST `dependencies` addition since
M1** (`diff@^9.0.0`, a governed act), `DB_VERSION` 2 → 3, and PERMISSIONS.md's *"file contents are never
stored"* claim corrected **in the same commit as the first stored byte** (task 1.4, AGENTS.md #4).

**★ THE RUNNING HUMAN-GATE SCORE IS 10/10 — CORRECTED FROM THE 8/8 SHIPPED AT 9.1.** The score has
always counted **defects**, not milestones: M1:2 + M2:3 + M3:1 + M4:0 + M5:1 = **7/7**, and 9.1's own
landing block says *"M6 contributes THREE"* and then writes 8/8, contradicting its own sentence.
**7 + 3 = 10.** (On the stricter denominator that also counts the Firefox app-page disclosure gap the
walk closed it is 11/11; prior milestones did not count copy gaps, so 10/10 is the like-for-like
figure — stating the denominator's definition is the point.) Full argument: `retro.md` 2026-07-27,
finding 2.

**★ AND THE "NONE ESCAPING" INVARIANT IS BROKEN — FOR THE FIRST TIME IN THE PROJECT'S HISTORY. This is
the durable milestone-level fact, not merely a retro finding.** For five milestones this file and
`progress.md` cited *"every shipping defect caught by the gate of the milestone that shipped it, none
escaping"*. **Finding A — the reader right-aligning against the TOC rail on wide viewports — ships on
BOTH surfaces and, per the walk's own attribution, has done SINCE M3.** It was present and missed at
**M3's, M4's and M5's close gates**. So: **nine of ten defects were caught at their own gate; one
escaped three.** → **M4's clean gate therefore has a known miss.** M4's retro concluded its zero-defect
gate was *discipline-dominant*, and that still stands **for what M4 built** — but the gate was not
clean about the shipped product. *A clean gate is evidence about the BUILD, not about the GATE* was
M4's own caveat; M6 is where it cashed out. → **WHY it escaped is mechanical and fixable: the gate has
an UNRECORDED ENVIRONMENT VARIABLE — the walker's VIEWPORT.** Playwright's default viewport never
reproduced it, and **no gate record on any milestone states what window size the walk used.** Engine
and surface are recorded every time; the dimension that actually decides whether a layout defect is
visible is not. **The standing rule from this:** a gate walk records its viewport(s) the way it records
its engines, and a milestone that ships positioned chrome walks at least one WIDE viewport deliberately.

**★ TWO FORMAL RETRACTIONS — A METRIC CLASS M6 INTRODUCED (M4 had zero, M5 had zero).** Both retracted
claims were **unfalsifiable under the conditions they were measured in**, which makes them one defect
class rather than two incidents:
- **(a) The import fence was never verified by bytes.** Every entry since 5.1 cited *"content-script
  grep for `diffLines|jsdiff|computeDiff|enterDiff|…` = 0, both engines"* as fence-by-measurement.
  Those are **identifiers**, the bundle is **minified**, and the negative control 5.1–7.1 never ran is
  the proof: grep the **app-page chunk**, which indisputably *does* contain the engine, and it **also
  returns 0**. The fence was carried the whole time, unnoticed, by the source-text allowlist in
  `diffEngine.test.ts` alone. Re-established at 8.1 by **controlled ablation**: content script **0 B,
  md5-identical**; app chunk **−9,481 B**.
- **(b) The coalescer never dropped anything.** 7.1's *"9 of 12 edits rendered at 1 MB"* came from a
  `renders` probe **sampled once**, before a 1 MB render re-stashes its source. It could not be
  falsified at 7.1 either, because the *proposed* 5 MiB byte bound clamped the count at 4 — the
  discriminator had no room to disagree with itself. 7.3 lifted the ceiling; 8.1 polled instead of
  sampling: **12 of 12 at both fixtures.**

**GROUPS 1–9, AS THEY LANDED** (names verbatim from `tasks.md`; the boxes are the record):
1. **Storage, capture, and the trust correction** (honest storage end-to-end) — incl. 1.4's
   PERMISSIONS.md correction and 1.6's global erase control.
2. **The diff registry SEAM**, pulled early because D-3, D-2 and D-14 all read it.
3. **The capture disclosure channel** (D-3) — persistent, not a toast.
4. **D-2's shared seam-pin helper**, landed *before* the pin was copied with its hole.
5. **The diff engine** — the only module that imports `diff`; the 5.1 import fence established here.
6. **The diff view, affordance, import fence, and D-11's deferral** — 6.1 view, 6.2 affordance (the
   fence forced provisioning through `showDiff`/`hideDiff` closures rather than a direct import),
   6.3 the watch loop refusing to render under an open diff plus the "changed again" line.
7. **Measure → decide bounds → implement** — 7.1 measures and chooses nothing, 7.2 is D-8's human
   decision gate, 7.3 implements. The separation is the design.
8. **Perf / bytes / pins / docs** — 8.1 the measurement close (and both retractions above), 8.2 the
   docs+memory reconcile.
9. **Human milestone-close gate + retro** — the acceptance an agent cannot self-certify, budgeted here.

**THE FIVE RECOVERY SESSIONS, WHICH THE 20/20 BOX LIST MAKES INVISIBLE** — recorded here because
anyone estimating *"how much rework does a close gate cause"* reads **zero** from the boxes:
- **A** — first triage of the 9.1 findings.
- **B1**, then **B1 v2** (`e231941`) — reader centring + Compare-pill placement. B1 v2 decomposed its
  own byte delta and matched it exactly (READER_CSS +289 + CONTAINED_CSS +238 = **+527**).
- **B2** (`8255380`) — storage-panel overlay, the Firefox app-page disclosure gap, and the
  first-paint gate re-baseline. Found **~1.5 KB of its +1,873 B was CSS-comment prose** riding inside
  a template literal where the minifier cannot reach it.
- **C** — the pointer-fix session: 9.1's *closing* commit still said *"006 IS NOW WAITING ON A HUMAN"*
  and *"at its close gate"*, both false on the commit that closed it.
- **9.2** — the retro, written in a fresh session per the convention M4's archive pass established.

**BYTE PINS AND SUITE COUNTS AT M6 CLOSE — FROZEN.** These are the historical M6-close values, not
current truth (`progress.md` § Baselines is the only file that makes present-tense claims). They are
**not** the numbers 8.1 recorded: 8.1 measured before B1 v2 and B2 shipped production code, and
neither recovery commit re-ran the pins — the +527 / +1,077 / +24-case deltas below are that gap
closed (`retro.md` 2026-07-27, finding 3).

| pin at M6 close | value | 8.1 had recorded | delta |
|---|---|---|---|
| Content script, both engines | **315,671 B** | 315,144 B | +527 (B1 v2) |
| App-page chunk, both engines | **361,500 B** (`app-CEHD9mSZ.js`) | 360,423 B (`app-Bn1Oo_pw.js`) | +1,077 |
| Background, both engines | **3,435 B** | 3,435 B | — |
| `pnpm zip` Chrome / Firefox | **349,744 / 349,803 B** | 349,165 / 349,223 B | +579 / +580 |
| Unit suite | **549 passed, 46 files** | 549 | — |
| Browser suite | **629 passed / 15 skipped, 76 file-instances**, both engines | 605 / 15 / 74 | +24 cases, +2 files |
| First paint, typical (50.4 KB) | **137.9 ms** (8.1, quiesced) | — | vs a bar that MOVED this milestone |
| `tests/manifest.test.ts` | **2975 B**, byte-unmodified since M2; `permissions: []` | — | — |

*The archive pass re-measured these at HEAD `d470ab2` and got the same artifact bytes, which is the
expected result and worth one line: nothing between M6 close and `d470ab2` touched `src/`,
`entrypoints/`, `wxt.config.ts`, `package.json` or `pnpm-lock.yaml` — the §6 side-quest added two
standalone `scripts/` tools that are not in the build graph. The M6-close artifacts and the current
artifacts are the same bytes.*

### The M6-close § Baselines, verbatim as it stood in `progress.md`

*Moved here by the archive pass 2026-07-27. `progress.md` § Baselines now carries FRESH
measurements only; this is the M6-close record, including the superseded M6-post-7.1 table it
already kept as an audit trail, the quiesce protocol behind the 137.9 ms reading, and the full
ablation tables that re-established the import fence. Nothing here is a present-tense claim.*
*The only edit to the moved text is this heading, demoted `##` → `####` so it nests under M6 instead of
becoming a sibling of it. Words unchanged.*

#### Baselines / pins
*Current measured truth, as of the M6 close (task 8.1, 2026-07-26). This section is MUTABLE — each
milestone's close task overwrites the numbers and moves the previous ones into the "vs" column. It lives
here, not in decisions.md, because decisions.md is dated append-only and a current-numbers table cannot be
corrected there without either lying or duplicating.*

| pin | at M6 close (006) | vs M5 close | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **137.9 ms** (passes 2/3 **140.2 / 137.7 ms**) | 138.6 ms (**−0.7 ms**) | ~~<150 ms **GATE**~~ → **<165 ms GATE** (re-baselined at 9.1 — see below) | **PASS** |
| First paint, 1 MB / ~1400-entry TOC | **1185.2 ms** | 1183.8 ms (**+1.4 ms**) | <1.7 s (informational) | PASS |
| Content script (`content-scripts/peekover.js`) | **315,144 B** both engines | 299,411 B (**+15,733 B, +5.25%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-Bn1Oo_pw.js`) | **360,423 B** both engines | 332,895 B (**+27,528 B, +8.27%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,435 B** both engines | 3,315 B (**+120 B, +3.62%**) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **349,165 / 349,223 B** (349.17 / 349.22 kB) | 335.89 / 335.95 kB (**+13.28 / +13.27 kB**) | <2 MB | **PASS** |
| Suites | 549 unit (46 files) · 605 passed / 15 skipped browser, 74 file-instances (both engines) | 456 · 499/15/54 | — | green |

**★ THE FIRST-PAINT GATE WAS DECIDED ON A QUIESCED MACHINE, AFTER IT FAILED ON A WORKING-DAY ONE. Both
readings are recorded here; neither is cherry-picked.** The first 8.1 attempt measured medians **154.0 /
157.6 ms — BREACHING the <150 ms gate** — and correctly stopped rather than re-rolling. Attribution pointed at
machine state, not code: the build was byte-identical to the one that measured 144.3/145.1 ms at 7.1 (the
single-byte `SNAPSHOT_TOTAL_BYTES` minification delta is not on the render path), and the 1 MB fixture moved
**proportionally** (+10.7% vs 7.1) — a code regression on the render path would not scale both fixtures alike.
The machine was then quiesced under a recorded protocol (**Brave 28 → 0 and Chrome 21 → 0 processes closed
gracefully; 78 s settle; CPU mean 5.6% across 5 samples; memory 32.2% → 21% used**) and the harness re-run
**three times in immediate succession, a bounded protocol fixed in advance — not "until it passes"**:

| pass (50.4 KB) | median | min | max | verdict |
|---|---|---|---|---|
| 1 | **137.9 ms** | 135.9 | 166.6 | **PASS** |
| 2 | **140.2 ms** | 133.0 | 143.1 | **PASS** |
| 3 | **137.7 ms** | 134.8 | 147.2 | **PASS** |
| 1 MB reference | **1185.2 ms** | 1163.2 | 1226.8 | PASS vs its own <1.7 s bound |

**The 1 MB reference is the discriminator and it confirmed the hypothesis:** 1185.2 ms against 7.1's 1270.4 ms
and the failed attempt's 1406.6 ms — the machine really did quiet down, so the 50 KB improvement is not a
lucky draw on one fixture. **Floor across all three passes: 133.0 ms** — against M6-post-7.1's 138.9 ms
(**−5.9 ms**) and M5-close's 132.0 ms (**+1.0 ms**). On the standing protocol that signal-vs-noise is decided
on the floor, **the floor is back at M5's, so 7.1's +6.9 ms floor movement was machine state, not 006's code.**
- **★ THE WARNING IS NOW STRONGER THAN "NO HEADROOM": ASSUME ZERO HEADROOM ON A WORKING-DAY MACHINE — the
  gate sits AT the machine-state noise floor.** A green result here required closing 49 browser processes.
  The same tree measured **157.6 ms** with a normal desktop running. Any future session that touches the
  render path must quiesce before believing a number, and must treat a passing median on a busy machine as
  luck rather than evidence. **This is a standing risk, not a solved problem** — it is the human's call at
  9.1 whether a gate that depends on machine state should be re-phrased (spread-aware) or re-sited; the M1
  gate was set when the codebase was ~30% of its current byte weight, and 8.1 does not touch it.
- **★ 9.1 RESOLUTION — THE GATE WAS RE-BASELINED TO <165 ms (recovery B2, 2026-07-26).** The human call
  8.1 deferred above is now made: option B, **re-site the bar**, not re-phrase it. **NO MEASUREMENT ON
  THIS PAGE CHANGED** — 137.9 / 140.2 / 137.7 ms and the 133.0 ms floor are what they were; only the
  threshold they are judged against moved, and the struck-through **<150 ms** stays in the table beside
  it so the M1 bar is not quietly erased. The reasoning, in one line: a gate that needs 49 browser
  processes closed to go green is measuring the machine, not the code — the working-day readings
  (**154.0 / 157.6 ms** at 8.1's stopped attempt, **~145–150 ms** at B1 v2 even after a quiesce) breach a
  bar the quiesced ones clear, and the codebase has grown ~40% since M1 set it. **165 ms restores the
  gate's actual job** — any regression that pushes typical past it is real signal — while leaving ~15 ms
  of honest headroom. `GATE_MS` in `scripts/perf-first-paint.ts` is the single site; full rationale and
  the revisit triggers are in decisions.md 2026-07-26. **This is the FIRST re-baseline of the M1 gate**,
  and the standing "assume zero headroom" warning above is NOT repealed by it — it is deferred: M7
  kickoff is where optimization work gets considered (006's +15.7 KB content-script growth is
  legitimate but, per the human note at 9.1, not sacred).
- **The measured build IS the committed tree, proven not assumed:** a fresh `wxt build` after the passes
  reproduced all three artifacts **md5-identical** to the ones the passes ran against.

**★★ THE IMPORT FENCE, PROVEN BY CONTROLLED ABLATION — AND 7.1's GREP RETRACTED AS VACUOUS.**

**The finding first, because it invalidates a reading this file has carried since 5.1.** Every recorded
"content-script grep for `diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|
structuredPatch` = **0**, both engines" was **proving nothing**. Those are all *identifiers*, and the
production bundle is minified — they are renamed to one- and two-letter locals, so the pattern cannot match
diff code **anywhere**. The proof is the negative control that 5.1–7.1 never ran: grep the **app-page chunk**,
which indisputably *does* contain the engine and the view, and it also returns **0**. A test that returns the
same answer whether or not the thing is present has **zero discriminating power**. **The fence was never
actually verified by bytes; it was carried, unnoticed, entirely by layer 1 — the source-text allowlist in
`diffEngine.test.ts` (Clauses A/B/C), which is green and which is the real architectural proof.** Do not
propagate the old grep. *(Retro item — named in the 8.1 commit body.)*

**Replacement heuristic for future measure-tasks, controls stated so they can be re-checked.** Use literals
that survive minification, and always run the negative control:

| marker set | app chunk (CONTROL — must be >0) | content script (FENCE — must be 0) |
|---|---|---|
| `diff` pkg option props — `newlineIsToken\|stripTrailingCr\|ignoreWhitespace\|oneChangePerToken\|maxEditLength` | **12** ✓ fires | **0** ✓ |
| `diffView` strings — `diff could not be rendered\|no reader shadow root to show a diff in` | **2** ✓ fires | **0** ✓ |

Identical on **both engines**. **This is a heuristic, not a proof** — it depends on the minifier preserving
those particular literals, and a bundler upgrade could silently blunt it exactly as it blunted 7.1's. **The
source-text allowlist test remains the architectural proof; the grep is a cross-check, and it is only worth
anything while its control fires.** Note also that `peekover-diff*` class names DO appear in the content
script (**36 hits**) and this is **correct, not a breach**: `mount.ts` imports `diffChrome.ts` by design, and
that module is engine-blind (it reaches the engine only through the `showDiff`/`hideDiff` closures the app
page provisions). A fence grep must target the **engine and the view**, never the string "diff".

**THE CONTROLLED ABLATION (the 6.2 precedent, run at milestone close — the only fence check that cannot be
fooled by minification).** `src/app/appShell.ts` copied aside, its two gated imports commented out and
`showDiff`/`hideDiff` stubbed to no-ops, both engines rebuilt:

| artifact | shipped | diff ablated | delta |
|---|---|---|---|
| Content script (chrome) | 315,144 B `md5 0ffdb45b…` | 315,144 B `md5 0ffdb45b…` | **0 B — BYTE-IDENTICAL** |
| Content script (firefox) | 315,144 B `md5 73da1158…` | 315,144 B `md5 73da1158…` | **0 B — BYTE-IDENTICAL** |
| App-page chunk (both) | 360,423 B | 350,942 B | **−9,481 B (−2.63%)** |

**Read it precisely: removing the entire diff engine and view changes the content script by ZERO BYTES, to the
md5, on both engines — so the diff feature's contribution to the GATED path is not "small", it is nil.** The
ablation is **non-vacuous**: both marker sets drop to 0 in the app chunk when ablated, so the mutation really
did remove what it claimed to. **9,481 B is therefore the measured app-page byte cost of the diff feature** —
a stated-not-gated line item, and the honest answer to "what did 006's engine cost in bytes."
**Round-trip verified:** restored from the pristine copy (`md5 78edfe9e…` matches, `git diff` empty), both
engines rebuilt, and **all six artifacts returned md5-identical to pre-mutation** — including the app chunk's
content hash `app-Bn1Oo_pw.js`. `pnpm lint` green after restore.

**★ Neither this nor 7.1's growth attribution licenses "006 is free on the content script."** The
content-script `+15,733 B` vs M5 is **real** and is 006's shared chrome/CSS (the affordance, the picker, the
watch/diff UI surface `mount.ts` legitimately pulls in) — the ablation isolates the *engine*, not all of 006.

**★ THE TWO 006 HARNESSES RE-RUN AGAINST THE M6-CLOSE TREE (post-7.3 constants), `--no-build`.** This is the
milestone-close verification the harnesses were converted into at 7.3 — they choose nothing.

**`perf:snapshot-capture` — 7.3's CHOSEN bounds behave as reasoned.** Accumulation over 12 sequential edits,
through the production controller: **50 KB → 13 snapshots, 659.5 KB** (`2,3,…,13`); **1 MB → 13 snapshots,
14.57 MB** (`2,3,…,13`). **Neither bound bites** — 13 < 15 and 14.57 MB < 20 MiB — reproducing 7.3's
re-measurement **exactly**, and 7.1's plateau-at-4 stays gone (it was the *proposed* 5 MiB bound). **STILL NOT
OBSERVED, and still out of reach of this harness: whether the count actually stops growth at 15** —
`EDIT_SEQUENCE` is 12, so decisions.md's "~17 snapshots of 1 MB fit in 20 MiB" remains **reasoning, not
measurement**. Capture cost is unchanged in magnitude and **still unresolvable** at both sizes (the harness
says so itself): 50 KB sync delta **+1.7 ms** against an 8.7 ms within-arm spread; 1 MB **+49.8 ms** against a
425.9 ms spread — and across the two passes run this session the 1 MB delta moved 23.8 → 49.8 ms, which is the
point. Isolated D-5 guard **0.0 µs / 47.5 µs**; awaited write **0.6 ms / 7.1 ms**; mean snapshot 50.7 KB /
1.12 MB. **No threshold asserted.**
- **★ PIECE 1's DISCRIMINATOR FIX IS CONFIRMED BY MEASUREMENT, and it settles 7.3's open contradiction.** The
  harness now reports **`12 of 12 edits rendered` at BOTH fixtures**, against 7.1/7.3's `9 of 12`. 7.3 had
  already argued the two numbers could not both be true (a coalesced edit captures nothing, so 13 snapshots
  off a 1-snapshot seed requires all 12 to have rendered) and blamed the sampled `renders` probe. **Polling it
  instead of sampling once makes the count and the render tally agree.** So **7.1's "the coalescer dropped 2–3
  edits at 1 MB" is formally RETRACTED — it was a harness artefact, not behaviour.** `scripts/` was fenced at
  7.3, which is why the fix landed here.

**`perf:diff` — no movement against 7.1.** (a) engine **587.5 ms** (7.1: 585.0) · (b) parse+sanitize **441.5 ms**
(433.6) · (c) DOM **137.8 ms** *derived* (122.0) · (d) **TOTAL enter 1202.2 ms** (1157.4) · first scroll frame
**388.3 ms**, settling to ~55 ms by frame 4. Fixture determinism holds to the hunk: **5882 hunks
(1961+/1961−/1960=) → 5882 blocks on all 7 runs**, both sessions. Memory stays **DIRECTIONAL ONLY** and the
caveats are load-bearing — median +35.44 MB on enter with a per-run range of **−9.52 to +76.44 MB**, i.e. GC
timing dominates; the net before→after-exit median is −67.9 KB across a ±42 MB range, which is **not** evidence
of a clean teardown. **No threshold asserted; `perf:diff` emits no gate.**

**⚠ TOOLING TRAP, recorded so the next session does not lose time to it: `pnpm zip -- -b firefox` SILENTLY
BUILDS CHROME.** There is no `zip:firefox` script; pnpm forwards the bare `--` as a literal argument and wxt's
CLI ignores what follows, so the command exits 0 having rebuilt and rezipped **chrome-mv3** — a green run that
produced the wrong artifact. **The correct invocation is `pnpm exec wxt zip -b firefox`** (likewise
`pnpm exec wxt build -b firefox`). The `pnpm perf -- --size 50kb` form is unaffected — `tsx` ignores the bare
`--`, which is why the perf harnesses never exposed this.

**M6-post-7.1 (2026-07-26) — SUPERSEDED by the M6-close table above (task 8.1 re-measured officially).**
Kept for the audit trail, not as current truth. Two of its readings are **corrected** there and the
corrections are the point: its first-paint numbers (144.3 / 145.1 ms, floor 138.9 ms) carried **machine-state
noise it could not see**, and its import-fence grep had **no discriminating power** (see the retraction above).
Measured on the 006 tree at `a873b8d` + 7.1. Format is `M6-post-7.1 vs M5-close ; delta`.

| pin | M6-post-7.1 | vs M5 close | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **144.3 ms** (2nd pass **145.1 ms**) | 138.6 ms (**+5.7 ms**) | <150 ms **GATE** | **PASS** |
| First paint, 1 MB | **1270.4 ms** | 1183.8 ms (**+86.6 ms**) | <1.7 s (informational) | PASS |
| Content script (`.output/*/content-scripts/peekover.js`) | **315,143 B** both engines | 299,411 B (**+15,732 B, +5.25%**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-cheLPYz6.js`) | **360,422 B** both engines | 332,895 B (**+27,527 B, +8.27%**) | none — **stated, not gated** | — |
| Background (`background.js`) | **3,435 B** both engines | 3,315 B (**+120 B, +3.62%**) | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **349.17 / 349.23 kB** | 335.89 / 335.95 kB (**+13.28 / +13.28 kB**) | <2 MB | **PASS** |
| Suites | 549 unit · 605 passed / 15 skipped browser, 74 file-instances (both engines) | 456 · 499/15/54 | — | green |

- **THE <150 ms GATE HELD ACROSS TWO INDEPENDENT 7-ITERATION PASSES** — medians 144.3 / 145.1 ms, no warm iteration
  over the bar in either (maxima 149.2 / 150.0 ms; the 150.0 is a max, not the gated median). **HEADROOM IS NOW
  ~5 ms AND THE FLOOR MOVED:** floor across both passes is **138.9 ms**, against M5's recorded floor of 132.0 ms —
  **+6.9 ms on the FLOOR**, and the standing protocol says signal-vs-noise is decided on the floor, not the middle.
  Recorded as a fact, **not** interpreted here: 7.1 asserts the gate result and nothing beyond it. **The next
  perf-touching session should assume NO headroom.** (006 is app-page-only, so the diff feature never enters this
  gated content-script path — the growth above is 006's shared chrome/CSS, officially attributed at 8.1.)
  **★ 8.1 CORRECTION:** the +6.9 ms floor movement was **machine state, not code** — on a quiesced machine the
  floor returned to **133.0 ms**, M5's. The standing warning is now stronger, not weaker: **assume ZERO headroom
  on a working-day machine.** And "the diff feature never enters the gated path" is now **proven by ablation**
  (0 B, md5-identical) rather than argued from the module graph.
- **The 1 MB line still prints `-> FAIL`** for the known reason (it compares the 1 MB fixture against the
  *typical-doc* bar and self-labels the comparison informational — decisions.md 2026-07-14). Against its OWN
  <1.7 s bound the verdict is **PASS**. Not a breach, not a regression.
- ~~**THE IMPORT FENCE HOLDS BY MEASURED BYTES, BOTH ENGINES:** content-script grep for
  `diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|structuredPatch` = **0** in
  `.output/chrome-mv3/` AND `.output/firefox-mv3/`.~~ **★ RETRACTED AT 8.1 — THIS GREP PROVED NOTHING.** Those
  are identifiers, and the bundle is minified; the app chunk, which *does* contain the engine, greps **0** too.
  The claim was true but unsupported by this evidence. **The fence does hold** — re-established at 8.1 by
  controlled ablation (**0 B, md5-identical content script**) and by markers with a firing control. See the
  M6-close section above. `permissions: []` on both built manifests **stands** (independently checked at 8.1).
- **`pnpm zip` still emits the third, non-bound artifact:** the Firefox run also writes
  `peekover-0.0.0-sources.zip` (**3.93 MB**, was 3.39 MB) — the source archive AMO requires for review, not a
  shipped package. The <2 MB bound is on the extension zips (349.17 / 349.23 kB).
- **No port override was needed this session.** `pnpm test:browser` ran clean on the default port; the recorded
  `EACCES ::1:63315` collision (decisions.md 2026-07-21) did not reproduce, and `vitest.config.ts` is
  **byte-unmodified**. Both new perf harnesses host nothing (they drive `file://` and `chrome-extension://`), so
  the collision cannot arise there by construction.
- **`perf:toc` re-run (jsdom, informational, no gate):** rail build 3.796 ms at 1401 headings / 5.740 ms at 2000;
  scroll-spy recompute 4.394 ms and 7.094 ms per frame. Run because 006 adds chrome to the same `mount()`
  composition path and `diffChrome`'s placement was measured against the TOC handle. `perf:folder` and
  `perf:flash` were **not** run — no 006 code reaches the folder-tree or theme-flash paths, and saying which
  harnesses were skipped and why beats an unexplained gap.
- **7.1's own new measurements** (capture cost, the isolated D-5 guard, snapshot sizes/accumulation, the diff at
  1 MB, memory) are in the **Now** section above, with their caveats attached. They are **inputs to 7.2's human
  decision**, and **no bound is chosen or recommended anywhere in them**.

- **THE FIRST-PAINT GATE HELD ACROSS TWO INDEPENDENT 7-ITERATION PASSES, with no warm iteration over the
  bar in either** (max 144.5 ms) — where the M4 close's own second pass had one at **150.9 ms**. Called
  **NOISE, not regression, on the FLOOR**: the floor across both passes is **132.0 ms**, at/below M4's
  recorded min of 132.6 ms. *(Full pass-by-pass evidence: archive § M5, and `tasks.md` 6.1.)*
- **HEADROOM IS STILL THIN and the next perf-touching session should assume none.** The budget sits
  **~11–14 ms from its ceiling** on this hardware (i7-13700, Windows, headless Chromium). That is not
  better than M4's ~7–12 ms by any real amount; it is the same reading with a different noise draw.
- **The M4 app-chunk baseline DID NOT EXIST and was MEASURED, not estimated** — a throwaway `git worktree`
  build of `70bb8ef` (M4 close). **The method validates itself:** that build reproduced the recorded
  content-script baseline **exactly, 288,654 B to the byte**, so the "vs M4" column for the app chunk comes
  off a build proven to be the one the recorded numbers came from.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **The 1 MB harness line prints `-> FAIL`** because it compares the 1 MB fixture against the *typical-doc*
  bar and self-labels the comparison informational. That is the known ~8× reading (decisions.md
  2026-07-14), **not** a breach. Do not read it as a regression. **Re-confirmed verbatim at 6.1:**
  `gate [1.12 MB, large-doc (informational vs typical-doc gate)]: (a) median 1183.8ms vs <150ms -> FAIL`.
  The verdict against the number's OWN bound (<1.7 s) is **PASS**.
- **Standing pins, all green at the M5 close (task 6.1, 2026-07-21):** `git diff tests/golden/output/`
  **EMPTY** · `tests/manifest.test.ts` **8/8 and byte-unmodified since M2** — last touched at `3b6c575`
  (M2 / the app-page commit), so `permissions: []` is re-proven by a test no watch task could have bent ·
  huge-doc `sha256=8bc5094c…e61bbd` intact · `pnpm lint` clean · `pnpm test` **456** ·
  `pnpm test:browser` **499 passed / 15 skipped, 54 file-instances, both engines** (task 4.8 contributed
  +4 unit pins, +9 browser tests × two engines, +1 new browser file × two engines).
- **`pnpm zip` produces a THIRD artifact that is NOT the bound, stated so it is not misread:** the Firefox
  run also emits `peekover-0.0.0-sources.zip` (**3.39 MB**) — the source archive AMO requires for review,
  not a shipped package. The <2 MB bound is on the extension zips (335.89 / 335.95 kB).
- **One environment note, unchanged and still local-only:** `pnpm test:browser` hit the recorded
  `EACCES ::1:63315` Windows reserved-port collision (decisions.md 2026-07-21). The documented
  **local-only** `browser.api.port` override was applied for the run and **stripped before commit** —
  `vitest.config.ts` is unmodified apart from 4.5's `fileParallelism: false`.
- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run 1
  discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from a
  measurement task** (standing M1 retro rule). **Signal-vs-noise is decided on the FLOOR, not the middle**
  — real added cost raises the floor; noise moves only the middle (the M4 precedent, applied again at 6.1).
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is untouched"
  is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and stayed empty
  through the 5.1 chrome addition. Before citing a pin as evidence, break the property and check it goes
  red (retro 2026-07-19, finding 3).

### The task-by-task narrative, verbatim as it stood in `progress.md` at close

*Quote markers (`> `) stripped — that was the Now section's blockquote formatting, not the text.
Words, emphasis and structure are unchanged. Newest fold first, as it stood in `progress.md`; the
nesting is the task chain, innermost = earliest.*

<details><summary>Task 8.2 — DOCS + MEMORY RECONCILE (landed previously; CLOSED group 8)</summary>

**Task 8.2 — DOCS + MEMORY RECONCILE — has landed, and GROUP 8 CLOSES**
(a previous commit, `5ea9723`). It is a **COHERENCE PASS, not new writing**: the retro (9.2) is where M6's findings, the two retractions and
the discipline lessons get written. 8.2 read the memory files against the shipped tree with a critical eye and reports:
- **`decisions.md` — EVERY ENTRY STILL HOLDS. Nothing edited, nothing appended.** Checked newest-to-oldest against what 8.1
  measured. D-8's bound values behave as reasoned (7.3's re-run reproduced exactly at 8.1: 13 snapshots at both fixtures,
  neither bound biting) and its revisit-when triggers all still stand unfired. The `diff@^9.0.0` entry's *"revisit-when …
  the bundle-fence re-measurement at 8.1 shows `diff` bytes reaching the content script"* **fired and came back clean** —
  0 B, md5-identical, by ablation. Gate-3's two product decisions stand (D-11's line shipped at 6.3 and its legibility is a
  9.1 item by design; snapshot survival is architectural). D-1…D-16 stand — 8.1's ablation *reinforces* D-14 empirically,
  and D-1's WeakMap read is production-verified. **No new entry was added on purpose:** 8.1's two retractions are
  measurement findings, not decisions — they live below in § Baselines and belong in `retro.md` at 9.2. Putting them in
  `decisions.md` would blur what that file is for.
- **`PERMISSIONS.md` — COHERENT AND UNTOUCHED.** 1.4's trust correction is intact: the blanket *"file contents are never
  stored"* survives in exactly one place, inside the paragraph that explicitly retires it, and the snapshot-capture row
  states what IS stored. **006 crossed no permission boundary** — snapshot storage, the capture disclosure, global erase
  and the diff are all already-disclosed or capability-free (the diff adds no store, no channel and no network; it reads
  what the snapshot row already discloses), and `permissions: []` is the shipped manifest reality on both engines,
  independently re-checked at 8.1.
- **`progress.md` — four stale pointers found and fixed**, listed next.

**★ THE ONE REAL GAP, NAMED RATHER THAN QUIETLY PATCHED: 8.1 LANDED WITHOUT ADVANCING THE NOW-POINTER.** 8.1 wrote its
whole record into **Baselines** — which is right, and it is excellent — but left this section reading *"groups 1–7 CLOSED;
group 8 is next (8.1)"* with a next-action block describing 8.1 as still to be done. **This file's own M1 rule sits at the
bottom of this very section** (*"the Now-pointer advances PER TASK — it once lagged four tasks and the next session acted
on stale state"*), so the rule was broken by the task that most needed it. A fresh session reading top-to-bottom would have
re-run a measurement task that had already landed. **The other three:** the Blockers section still named *"006's spec gate 1"*
as the next human gate (four gates ago — 9.1 is next); the roadmap line still pointed at 006 as **← NEXT** while 006 is a
commit away from closing; and the header date read 2026-07-25. All four are pointer corrections — **no measurement, no
finding and no decision was reworded, and § Baselines was not touched at all.**
</details>

<details><summary>Task 8.1 — MEASUREMENT CLOSE (landed previously; ITS FULL RECORD IS THE BASELINES SECTION BELOW, deliberately not duplicated here)</summary>

**Task 8.1 — the official milestone-close re-measurement — landed** (a previous commit, `ba91c6e`). **Its evidence lives in
§ Baselines / pins, which 8.2 does not touch**; this fold exists so the Now section's task chain is unbroken, not to restate
numbers a second time where they could drift apart. The headlines, each with its full treatment in § Baselines below:
- **The M6-close pin table** replaced M6-post-7.1's, which is kept below it as a superseded audit trail with its two
  corrections attached.
- **The first-paint gate is GREEN but only on a quiesced machine**, and both readings are recorded — a first attempt read
  **154.0 / 157.6 ms, BREACHING the gate**, and stopped instead of re-rolling. **The standing warning is now ZERO headroom
  on a working-day machine.** Whether a machine-state-dependent gate should be re-phrased is a **9.1 human call**.
- **7.1's import-fence grep is RETRACTED as vacuous** (identifiers, minified bundle; the app-chunk negative control greps 0
  too) and the fence is **re-established by controlled ablation** — content script **0 B, md5-identical**, app chunk
  **−9,481 B**. The struck-through original and its replacement sit together in § Baselines.
- **7.1's "the coalescer dropped 2–3 edits at 1 MB" is RETRACTED** — a sampled probe, not behaviour; polling it reports
  12 of 12 at both fixtures. This is the same instrument class `decisions.md` 2026-07-21 finding (3) already named.
- **Both items 7.3 handed forward are DISCHARGED**: the `renders` undercount is fixed in the harness, and its stale
  *"NO BOUND IS CHOSEN OR RECOMMENDED — 7.2 is the human decision gate"* trailing prose now records that the gate has run.
- **A tooling trap is recorded: `pnpm zip -- -b firefox` SILENTLY BUILDS CHROME.** Use `pnpm exec wxt zip -b firefox`.
</details>

<details><summary>Task 7.3 — IMPLEMENT the chosen bounds (landed previously; CLOSED group 7)</summary>

**Task 7.3 — IMPLEMENT THE CHOSEN BOUNDS — landed** (a previous commit), and **GROUP 7 CLOSED** with it.
**Two constants moved, one was reviewed and deliberately left alone**, in `src/app/snapshots.ts` and nowhere
else. **The eviction ALGORITHM did not move** — `planSnapshotWrite`, `bytesOf`, `DEFAULT_BOUNDS`'s body and the whole IDB
layer are byte-identical; the single diff hunk is confined to the constants block, and its only two non-comment lines are
the two values. Every consumer picks the new numbers up through `DEFAULT_BOUNDS`, which references all three BY NAME, so
choosing a value stayed a one-line edit:
- **`SNAPSHOT_COUNT_PER_DOC` 20 → 15**
- **`SNAPSHOT_TOTAL_BYTES` 5 MiB → 20 MiB** (`20 * 1024 * 1024`)
- **`SNAPSHOT_MAX_AGE_MS` UNCHANGED at 30 days** — 7.2 weighed 7 and 90 and kept 30, so this is a value REVIEWED AND
  CHOSEN, not a value skipped. Recorded either way, per tasks.md 7.3's own body.

**The four jsdoc blocks that called these values "PROPOSED — NOT chosen (D-8)" now record them as CHOSEN** (7.2,
`decisions.md` 2026-07-26), each carrying the reasoning that picked it and the mental model it belongs to. That edit is
not cosmetic: a "proposed" comment sitting on a chosen value is a lie about the decision state, and the next session
would have read it as an open question.

**★ THE RE-MEASUREMENT CONFIRMED THE PREDICTION, WHICH WAS STATED BEFORE THE HARNESS RAN** (retro discipline — a number
read first and rationalised after is not a verification). `pnpm perf:snapshot-capture -- --no-build`, accumulation cell,
12 sequential edits through the production controller:
- **50 KB: `2,3,4,…,13` → 13 snapshots, 659.5 KB.** IDENTICAL to 7.1, to the byte. Neither bound bites (13 < 15;
  659.5 KB ≪ 20 MiB) — this fixture never reached a cap under the old numbers either, so unchanged is the correct result.
- **1 MB: `2,3,4,5,6,7,8,9,10,11,12,13` → 13 snapshots, 14.57 MB.** **7.1's plateau at 4 IS GONE.** That plateau was the
  proposed 5 MiB byte bound biting at the fourth 1.12 MB snapshot, and it is now silent: 13 × 1.12 MB = 14.57 MB sits
  under 20 MiB, and 13 sits under the count bound of 15. **This is the designed reordering** — bytes stepped back, count
  became the bound that would bind first.
- **NOT OBSERVED, and out of 7.3's scope: whether count actually stops growth at 15.** That needs >14 rendered edits;
  `EDIT_SEQUENCE` is 12 and the harness was not modified. The arithmetic is stated in `decisions.md` (~17 snapshots of
  1 MB fit in 20 MiB, above 15, so count binds first) — **stated, not measured.** 8.1 does not close this either.

**★ A FINDING THE RELAXED BOUND EXPOSED — 7.1's "the coalescer dropped 2–3 edits at 1 MB" IS NOT SUPPORTED, and the
`renders` discriminator UNDERCOUNTS at 1 MB.** This run printed `edits rendered: 9 of 12` while the per-edit count
incremented on **every one of the 12 edits** (2→13, twelve increments off a 1-snapshot seed). A coalesced edit captures
nothing, so 13 snapshots is only reachable if all 12 edits rendered and captured — the count and the `renders` number
contradict each other, and the count is the one backed by IndexedDB. The discriminator
(`P.readerSourceFor(host) === text`, checked right after `__pwSettle`) evidently samples before a 1 MB render has
re-stashed its source, and the 1600 ms cooldown sleep then lets the render land before `__pwCount()` reads it.
**Why 7.1 could not have caught this:** the byte bound clamped the 1 MB count at 4, so the count could not be used to
falsify `renders` — the undercount was unfalsifiable at 5 MiB and became visible the moment the ceiling lifted.
**Consequence for the record:** the 7.1 note below reading *"only 9–10 of 12 edits rendered, and a render that never
happens captures nothing — measured via the reader-source WeakMap, not assumed"* is left as written (it is what 7.1
observed) but **must not be carried forward as a coalescer fact.** `scripts/` is fenced at 7.3 and the harness was NOT
touched; **8.1 owns the fix or the caveat**, and its accumulation numbers should not quote `renders` at 1 MB until then.

**Spot-check, other cells vs 7.1 — same magnitude throughout, as expected (the constants touch eviction only, never
capture cost):** guard/check 5.0 → **0.0 µs** at 50 KB (both at or under `performance.now()`'s 5 µs granularity floor —
7.1 already reported its own figure as an upper bound, so this is the same non-number) and 47.5 → **45.0 µs** at 1 MB;
awaited `storeSnapshot` 0.6 → **0.6 ms** / 10.8 → **7.5 ms**; mean snapshot 50.4 KB → **50.7 KB** / **1.12 MB**
unchanged; sync medians 33.5–33.8 ms at 50 KB and 715.8–721.2 ms at 1 MB. **The OFF-vs-ON delta remains unresolvable and
still flips sign** (−0.4 / −5.4 ms sync, −0.0 / −32.0 ms →2ndRAF) — 7.1's headline finding reproduces, and no delta here
may be quoted as a cost in either direction.

**No stale-build trap, checked rather than assumed:** `--no-build` reuses `.output/chrome-mv3`, but the harness bundles
`src/app/snapshots.ts` and `src/watch/watchController.ts` **fresh from source via esbuild at run time**
(`scripts/perf-snapshot-capture.ts:275-282`) and drives `P.createWatchController`, so the measured
`renderNow → storeSnapshot → DEFAULT_BOUNDS` path carried the NEW constants. The shipped build supplies only the
extension shell. Had that not been true, the 1 MB case would have re-printed the plateau at 4 and looked like a
contradiction.

**`src/app/snapshots.test.ts` NEEDED NO CHANGE, and that is 1.2's design paying off:** every eviction case passes its own
small explicit bounds (`{ countPerDoc: 2, totalBytes: 100, … }`), and the one `DEFAULT_BOUNDS` test asserts SHAPE and
positivity only — no test ever pinned a proposed number as an expected value (1.2's rule G). Unit **549**, unchanged, no
test file touched anywhere in the repo.

<details><summary>Task 7.2 — D-8's HUMAN DECISION GATE, the bound VALUES (landed previously; the input to 7.3)</summary>

**Task 7.2 — D-8's HUMAN DECISION GATE — landed** (a previous commit).
It is the gate where **the human chose the three snapshot retention bound VALUES** from 7.1's measurements, and it is a
DOCS-ONLY task by design: **no code landed.** `src/app/snapshots.ts` is byte-identical; 7.3 sets the constants. The
decision is recorded in `docs/ai/decisions.md` (2026-07-26 entry, appended at the top) **before** the code that carries
it — the same order the `diff@^9.0.0` approval used at 5.1. **The AXES were never reopened** (D-16, 2026-07-23: count
per-document, bytes and age global); 7.2 decided only the numbers.

**THE CHOSEN VALUES — for `snapshots.ts:61/77/93`:**
- **`SNAPSHOT_COUNT_PER_DOC` = 15** (was the proposed 20)
- **`SNAPSHOT_TOTAL_BYTES` = 20971520 B — 20 MiB** (was the proposed 5 MiB)
- **`SNAPSHOT_MAX_AGE_MS` = 2592000000 ms — 30 days** (the proposed value, kept deliberately)

**THE MENTAL MODEL THE THREE BOUNDS ENCODE — recorded because it is what makes them readable later, and because
a future session tuning one of them in isolation would otherwise be tuning it against the wrong purpose:**
**count binds active usage** (moderate per-document history depth — what a user actually reasons about when they think
"the last N states of this document"); **bytes is the SAFETY CAP**, not the everyday constraint (20 MiB exists for the
pathological "many large documents" case; at 20 MiB a 1 MB document fits ~17 snapshots, which is *above* the count bound,
so count binds first as designed — that reordering relative to 7.1's observed 4-deep-at-5-MiB behaviour is the point of
the change); **age is the SAFETY VALVE for abandonment** (it exists to reclaim documents watched briefly and forgotten,
not to constrain working memory). The full reasoning, the alternatives weighed, and the revisit-when triggers are in
`decisions.md`, not restated here (C5). One semantic is logged there and worth knowing before touching eviction: **age
is measured from snapshot timestamp, not from last access** — an actively-worked document still loses its 30-day-old
snapshots.

<details><summary>Task 7.1 — MEASURE capture cost + diff render/memory (landed previously; the input to 7.2)</summary>

**Task 7.1 — MEASURE capture cost + diff render/memory — landed** (a previous
commit). It is the MEASURING task, and it **chose nothing**: no bound, no threshold, no recommendation. Two new harnesses
(`scripts/perf-snapshot-capture.ts`, `scripts/perf-diff.ts`), two new `perf:*` script entries, numbers below. **No `src/`
file, no test file and no spec file was touched.** The only gates asserted are the two SHIPPED M1 ones (<150 ms typical
first paint, <2 MB packaged) — both PASS.

**★ THE HEADLINE IS A MEASUREMENT-RESOLUTION FINDING, NOT A COST.** The like-for-like control (capture OFF vs ON, same
document, same host, same iteration, differing only in D-12's capture flag) shows the in-situ delta is **BELOW THE NOISE
FLOOR AT BOTH SIZES** — and that was established, not assumed: **two independent 6-run passes at 1 MB produced deltas of
OPPOSITE SIGN** (pass 1 −1.7 ms sync / −62.7 ms →2ndRAF; pass 2 +23.8 / +20.3; final pass −3.4 / −15.5). A single 1 MB
re-render varies 40–90 ms run-to-run, which swamps anything capture adds. **No delta from this cell may be quoted as "the
capture cost", in either direction.** So the harness gained a cell that measures the component where it IS resolvable: the
whole synchronous capture guard (`getCaptureFlag()` + two whole-document `normalise()` + compare —
`watchController.ts:472-480` verbatim) costs **5.0 µs at 50 KB and 47.5 µs at 1 MB**. That is ~4 orders of magnitude below
the re-render it sits inside, which is *why* the in-situ delta cannot resolve. The 50 KB figure sits at
`performance.now()`'s own 5 µs granularity floor, so it is an **upper bound**, not a reading. Per retro finding 2 (004's
isolated probe under-predicted the real path ~13×) the isolated number is reported as a **FLOOR on added work, never as a
prediction** — both numbers stand, neither replaces the other.
**The non-vacuity control held on every run:** capture ON stored 2 snapshots per iteration (12 over 6 runs, both sizes);
capture OFF stored **0**. A cell that failed either check threw rather than reporting.

**CAPTURE'S OTHER TWO COSTS, measured and kept separate from the delta on purpose.** `renderNow` fires
`void storeSnapshot(...)`, so the IDB write is **off the synchronous path by construction**: awaited directly it is
**0.6 ms at 50 KB, 10.8 ms at 1 MB**. And a snapshot weighs what the document weighs — capture stores the source, not a
diff: **50.4 KB and 1.12 MB** respectively.

**★ EVICTION IS ALREADY BINDING AT 1 MB UNDER THE PROPOSED DEFAULTS — recorded as an observation, NOT as a reason to
change them.** Driving 12 sequential edits through the production controller: at 50 KB the store grew monotonically
`2,3,4,…,13` (13 snapshots, 659.5 KB, count cap 20 never reached). At 1 MB it grew `2,3,4` and then **stopped at 4 for the
remaining 9 edits** (4.48 MB) — four 1.12 MB snapshots is 4.48 MB against the proposed 5 MiB global byte bound, so the
fifth evicts the first. **Whether 4-deep history at 1 MB is the right product answer is exactly 7.2's decision**, and 7.1
states the observation without a view on it. (The 1 MB run also shows the coalescer working as designed: only 9–10 of 12
edits rendered, and a render that never happens captures nothing — measured via the reader-source WeakMap, not assumed.)

**THE DIFF AT 1 MB — §1.6's named ceiling, measured through the REAL 6.2 gesture path** (click the real pill → real picker
over real `snapshotMeta` → click a real item → `fetchText` out of real IndexedDB → `showDiff`; nothing hand-called, the M5
"wired to nothing" rule applied to a harness). Fixture: every 20th line rewritten — **1961 of 39202 lines (5.0%)**,
deterministic, producing an identical **5882 hunks (1961 added / 1961 removed / 1960 unchanged) → 5882 blocks on all 7
runs**. **(a) computeDiff 585.0 ms** (576.2/592.6) · **(b) parse+sanitize over all hunks 433.6 ms** (418.7/515.6) ·
**(c) DOM construction 122.0 ms — DERIVED** (`enterDiff` with precomputed hunks, 559.7 ms, minus (b); reported as derived
because 7.1 may not add a mark inside `enterDiff`) · **(d) TOTAL enter, the user-visible number, 1157.4 ms**
(1129.6/1230.9). (a)+(b)+(c) deliberately do **not** reconcile to (d): (d) also carries two IDB round-trips, event
dispatch and the browser's own layout of the appended subtree, and that gap is left visible.
**(e) INTERACTIVE FRAMES — the first scroll after entering a diff costs 442.5 ms** (359.2/528.7), then settles to
**71.7 / 56.4 / 59.9 / 54.6 ms**. The first frame is where the browser pays deferred layout for the 5882-block subtree.
Stated, not gated — no threshold exists for it and 7.1 invents none.
**MEMORY is DIRECTIONAL ONLY** and the caveats are load-bearing: Chromium-only `performance.memory`, **V8 heap only — DOM
nodes are NOT counted**, GC-timing dependent, and taken with a non-default `--enable-precise-memory-info` flag. Heap at
rest **14.42 MB**; before→after enter **+35.95 MB median but +8.92/+77.11 MB across runs**; net before→after exit
**−861.1 KB median (−27.75/+29.17 MB)**. The spread is printed beside every median precisely because a single confident
median here would be a fiction. A small heap delta is **not** evidence the diff is cheap in memory.

<details><summary>Task 6.3 — D-11, the diff-defer + the "changed again" line (landed previously; CLOSED group 6)</summary>

**THE WATCH LOOP NOW KNOWS A DIFF IS ON SCREEN, AND REFUSES TO RENDER UNDER IT.** `onText` gains one condition —
the host carries D-15's `data-diff`, so the text takes the coalescer's single pending slot and **no timer is
armed**. On exit the withheld text renders and the reader is told the document moved: **"This document changed
again while the comparison was open — the newer version is shown above."** Both halves are the decision; the plan
says so in as many words (*"a document that changed with no indication is the same dishonesty one layer over"*),
and the line is gate-3-approved copy (decisions.md 2026-07-23) whose legibility is still a **9.1 human-gate item**.
**THREE DIVERGENCES FROM THE 6.2 POINTER'S SKETCH, each argued in tasks.md 6.3 and none silent:**
**(a) THE LINE IS A WATCH NOTE, ON EXIT — not a sentence inside the diff view.** The sketch's placement needs
`diffView.ts`, which 6.1 sealed and this task's own fences require byte-identical; and a line rendered *inside* the
comparison would be telling the reader about a document they cannot see yet. `setWatchNote` already carries exactly
this semantic (4.3's dead read, 4.4's unavailable surface), renders WITHOUT a re-render, and needed no new chrome —
**D-3's toast rejection stands.** Order is load-bearing: render first, line second, because the line points at the
document ("shown above").
**(b) EXIT IS A `MutationObserver` ON `data-diff`, not a call into `flushPending`.** There is more than one way out
of a diff — the 6.2 pill, `mount.ts`'s two D-15 clears, whatever a later task adds — and an explicit signal threaded
through each of them would strand the deferred text on the one that got missed. The observer holds no policy: it
reads the attribute and flushes. **`watchController.ts` imports none of `./diffView`, `./diffEngine`, `diff`** —
the attribute IS the seam (5.1 fence Clause C), so the name is a literal here and an export there, and a **drift
check** unit-asserts the two still agree. That check is the whole price of not importing, and it is paid in a test
file, which the fence exempts.
**(c) A HOLE THE SKETCH MISSED, FOUND AND CLOSED — `flushPending` needed the guard too.** A cooldown timer armed
moments *before* the diff opened is still in flight when it does, and it never passes through `onText`; it would
have replaced the comparison a beat later. It now CONVERTS to a deferred text instead of rendering. Unit-cased.
**RED-FIRST, BOTH HALVES, BOTH ENGINES (the plan demanded a different case each).** Deleting `onText`'s condition
reds *"the diff was torn down: expected null to be 'active'"* — the re-render replaced the comparison and `mount`'s
D-15 clear took the attribute with it (2 browser + 6 unit cases). Neutering the exit flush reds *"the withheld
change never reached the reader"*, and with that assertion lifted, *"the deferred render did not capture the state
that was on screen"*. The capture half is non-vacuous: the exit render stored the state the reader LEFT (V2),
leaving 2 snapshots where the seeded 1 stood — §3.5's per-render invariant intact, nothing lost.
**BYTES:** content-script 314688 → **315143 B both engines (+455)**; app chunk 359969 → **360422 B (+453)** — an
observer install/teardown, one condition in each of two functions, one string constant. Content-script grep for
`diffLines|jsdiff|computeDiff|enterDiff|exitDiff|renderHunk|diffWords|diffChars|structuredPatch`: **0**. The 5.1
fence pin is **15/15 green with allowlists UNCHANGED** — 6.3 added a consumer of the diff feature that imports
nothing from it.
**`permissions: []` stands. `diffEngine.ts`, `diffView.ts`, `diffRegistry.ts`, `diffChrome.ts`, `mount.ts`,
`appShell.ts`, `watchControl.ts`, `watchRegistry.ts`, `contentWatch.ts`, `diffEngine.test.ts` ALL BYTE-IDENTICAL**
— the whole task landed inside `watchController.ts`. `Settings`/`getSettings`/`putSettings` byte-identical (thirteen
tasks now). Unit 540 → **549**; browser 601/15/72 → **605/15/74**. Golden EMPTY. M1–M5 remain fully closed.

<details><summary>Task 6.2 — the diff AFFORDANCE (landed previously)</summary>
`buildDiffChrome(host)` returns the affordance where a diff context is registered and **`[]` — with NO note branch — where
none is** (D-14). `mount.ts` gains one import and one `children.push(...)` beside `buildWatchChrome`. The click flow:
`fetchMeta` → an inline `role="listbox"` picker → `fetchText` + `getCurrentSource` → the diff → `data-diff="active"`.
Exit is the SAME pill (its label and aria-label move with the state, so the change is never colour-only).
**★ THE ENGINE ENTERED PRODUCTION — and the fence forced a DIFFERENT provisioning path than the 6.1 pointer predicted.**
The 6.1 note said the affordance would "call `enterDiff`", i.e. import the VIEW directly. It does **not**, and it must not:
plan §1.4 fences **three** modules off the content-script graph — `diff`, `diffEngine.ts` **and `diffView.ts`** ("Imported by
`appShell.ts`, never by `mount.ts` — `mount.ts` importing it would drag the view into the content-script graph and put the
hole back in the fence"), and tasks.md 6.2's Verify says it outright: *"`mount.ts`'s graph excludes `diff`/`diffEngine`/
`diffView`"*. Since `mount.ts` imports the affordance, the affordance may import **none** of the three. So the DiffContext
gained **two coarse closures** — `showDiff(host, before, after)` / `hideDiff(host)` — that `appShell.installWatchForFile`
provisions; `appShell` is the one production file importing **both** `computeDiff` and `enterDiff`/`exitDiff`. The closures
are coarse on purpose: a `computeDiff` + `enterDiff` pair would have to carry `DiffHunk` across the fence for no benefit,
since the affordance only hands hunks straight on. **The hunks never cross.** `DiffOutcome` is a local structural mirror of
`DiffEnterResult` for the reason 6.1 recorded (the fence is a source-text scanner, so even `import type` reads as an import).
**FENCE PIN: `ALLOWED_ENGINE_IMPORTERS` `[]` → `['src/app/appShell.ts']`, and a NEW `ALLOWED_VIEW_IMPORTERS` clause C +
a "diffChrome.ts imports none of the three" clause + two non-vacuity checks (12 → 15 checks).** Clause C is load-bearing,
not decoration: red-first proven — adding `import { enterDiff } from './diffView'` to `diffChrome.ts` reddens exactly 2,
and under the pre-6.2 pin that violation would have passed silently.
**PLACEMENT — top-left, `top:56px;left:16px` (picker at `:94`), measured on the CONTAINED pane.** A first probe measured the
FULL-PAGE reader (what every other pill in readerCss.ts was measured against), "cleared" top-left, and was **wrong**: D-14
ships this chrome to the **app page only**, and under CONTAINED_CSS the pills are `position:absolute` inside a
`:host{position:relative}` box that is the whole DOCUMENT's height. Re-measured there (rail forced open — its width rule
stomps an early `data-toc` a frame later; 8- and 30-heading docs; both engines): bottom-left `:216`/`:256` land inside the
3.1 capture disclosure **and no step fixes it** (its height is text-wrap dependent — 110px at 1280, 182px at 414); top-right
`:56` hits the TOC handle; top-left `:16` is the remote-load slot; bottom-right sits on the opaque rail and its picker
expands into the aside stack. Probe **deleted** (the 4.1 rule). Geometry asserted at WIDE, deliberately **not** at 414×896,
where the app pane leaves the host 146px — narrower than one pill — and the existing stack **already self-overlaps**
(a pre-existing 3.1-era condition, recorded rather than papered over).
**BYTES:** content-script 307892 → **314688 B both engines (+6796)**; app chunk 343632 → **359969 B (+16337)**.
**Fence proven by controlled experiment, not just grep:** rebuilding with `appShell`'s engine+view imports removed drops the
app chunk to 350470 B (**−9499** = the engine + view + `diff`'s tree-shaken `diffLines`) and leaves the content-script bundle
**byte-identical at 314688**. Positive discrimination too: diffView's literals (`no reader shadow root to show a diff in`)
appear in the app chunk (1) and **not** in the content script (0). The shared +6796 is `diffChrome`'s code plus the CSS —
and note **readerCss.ts comments ship verbatim** (they sit inside a template literal), which cost ~8 KB in a first draft
until the placement rationale was moved into `diffChrome.ts` where the minifier strips it. Officially re-measured at 8.1.
**`permissions: []` still stands; `diffEngine.ts` and `diffView.ts` BYTE-IDENTICAL (5.1 and 6.1 sealed — 6.2 only USES
them); `watchController.ts`, `watchControl.ts`, `watchAvailability.ts` byte-identical; `mount.ts` gains exactly two code
lines; `appShell.ts` gains two imports and two object fields; `Settings`/`getSettings`/`putSettings` byte-identical;
`DB_VERSION` is 3.** Unit 519 → **540**; browser 577/15/70 → **601/15/72**. M1–M5 remain fully closed.
</details>
</details>
</details>
</details>
</details>

---

## M5 · spec 005 — watch mode · CLOSED 2026-07-21


*Groups 1–7 plus five discovered tasks (4.5, 4.6, 4.7, 4.8, 5.1a). Code-complete, human-gated (7.1
PASSED, both engines, both surfaces — **one defect found, task 4.8**), retro at 7.2. **Verbatim narrative
as it stood at close**, moved here 2026-07-21 after the durable facts were promoted (commit*
*"promote durable 005 facts ahead of the progress.md archive").*

**Read the same caveat as everywhere else in this file: the group headings below say "GROUP N IS IN
PROGRESS" because they were advanced per-task during implementation and never retitled at close. M5
closed 2026-07-21.** The two `[SUPERSEDED]` flake bullets are kept deliberately — they are the
root-cause trail behind task 4.5's fix, and the milestone's own lesson is that the SHAPE of a flake
matters more than its rate.

**What was promoted out of the text below, so you do not have to mine it:**
- **`decisions.md` 2026-07-21** — the three instrument rules (geometry precondition · like-for-like A/B
  control · await-don't-sample), and the `fileParallelism: false` decision with its measured comparison.
- **`decisions.md` 2026-07-19/20/21** — Firefox watch is app-page-only · `file://` is invisible to
  Resource Timing · the WXT-entrypoint rule · the cost-proportional cooldown · the 5.1a confirmation ·
  the watch pill's discoverability decision.
- **`retro.md` 2026-07-21** — the nine M5 findings, including the *built-tested-and-wired-to-nothing*
  defect class and the `mount()`-boundary answer.
- **`progress.md` § Baselines / pins** — every measured number, which stays current rather than archived.

**M4 is CLOSED. M5 (spec 005) has PASSED ITS HUMAN GATE and its code work is closed: all three Gear-3
artifacts are APPROVED — spec.md
(gate 1), plan.md (gate 2), `specs/005-watch-diff/tasks.md` (gate 3). Group 1 (detection core) is
COMPLETE: **1.1 DONE** (`pollingDetector` — the seam + the polled implementation, content-compare) and
**1.2 DONE** (`observerDetector` + the dead-observation ladder, real-engine via OPFS). **Group 2 is
COMPLETE: 2.1 DONE** (the `WATCH_READ` contract + `createWatchListener` + URL validation), **2.2 DONE**
(the relay wired — background's THIRD listener, content-script `relayRead` → `pollingDetector`,
zero-network guard) and **2.3 DONE** (the human-run both-engines check; answers recorded, spec narrowed).
**GROUP 3 — re-render continuity, THE RISKIEST GROUP — is IN PROGRESS: 3.1 DONE**
(`resolveScrollContainer` extracted to `src/render/scrollContainer.ts` as a pure move; `tocScroll`
green unchanged) and **3.2 DONE** (`readingAnchor` — capture + the text → index → `scrollTop`
restore ladder, D-3) and **3.3 DONE — SHIPPED AS SPECIFIED, the sanctioned fallback was NOT needed**
(`MountOptions.preserveReading`, additive and defaulted-off; `mount.ts:151` now
`setReaderMode(host, carried?.mode ?? 'reading')`). **`mount()` is no longer read-only library** — the
boundary four milestones respected has been crossed, deliberately and with both directions proven red
first. **3.4 DONE — the TOC re-decide interaction is VERIFIED COVERED** (by two independent guards, not
one). **GROUP 3 IS COMPLETE. GROUP 4 — watch UX — IS IN PROGRESS: 4.1 DONE** (the watch pill, its
register-once registry seam, and `data-watch` on the host). The pill sits **bottom-left at 96px**,
third in the stack above the theme pill, chosen by a measured probe rather than taste — top-right
collides with the TOC handle, bottom-right sits inside the rail's live entry list. **The registry
SUBSUMED 2.2's holder** (`watchRelay`'s `registerWatchDetector`/`getWatchDetector` became delegates
into `src/watch/watchRegistry.ts`, the D-E delegate precedent), so there is ONE piece of watch state,
not two. **Those two delegates were DELETED at 4.8** — the adapter they wrapped is the defect below. **4.2 DONE** (the controller — start/stop, the update signal, follow-at-bottom-only). **The spec
beat the mockup on follow**: the mockup scrolls unconditionally, spec §4 forbids moving a reader who
scrolled away, and reinstating the mockup's behaviour yanks the reader **~25,500 px** down the
document on both engines. **The update signal flashes the CONTROL, not the document** — 005 cannot
know which element changed without 006's diff, and a whole-column wash on every keystroke would be
the most intrusive option available. **The toast is SKIPPED and noted for 006** (no toast primitive
exists; the pill flash carries the same information). **4.3 DONE** (lifecycle — a gesture starts it, switching documents stops it, a dead read surfaces a
designed state) and **4.4 DONE** (the Firefox degraded state, on BOTH closed routes). **GROUP 4 IS
COMPLETE.** Two discovered tasks then closed: **4.5 DONE** — the browser-suite flake is fixed
(`fileParallelism: false`, measured over global-vs-narrower serial, 12/12 green; see the flake bullet
below), and **4.6 INVESTIGATED then RESCOPED + SHIPPED**: the original premise is FALSIFIED (Chrome's single "Allow
access to file URLs" toggle gates BOTH content-script injection on `file://` AND the background read, so a
running content script always has access — `isAllowedFileSchemeAccess` was NOT wired, an unreachable
branch), and the reachable analogue it surfaced is the **real defect and now ships**: the content script
offered a live-looking watch control on the REMOTE `http(s)` raw surfaces (raw.githubusercontent / gist /
gitlab-raw / bitbucket-raw), where the relay refuses every read — a dead control on a surface where spec §6
puts watch out of scope. `watchCapability` now gates the content-script decision on
`isWatchableFileUrl(location.href)` (the relay's own predicate, passed as a boolean to keep the pure
decision engine-free); a remote page gets a plain SCOPE note and **no detector at all**. `file://`
behaviour is byte-identical (Chromium control kept, Firefox note unchanged); the three notes are red-first
proven non-interchangeable (`decisions.md` 2026-07-21). **4.7 DONE — `observerDetector` was BUILT, TESTED,
MEASURED and WIRED INTO NOTHING, so spec §4's *"on Chromium, on the app page, detect changes WITHOUT
POLLING"* was FALSE in shipped code; it is now TRUE.** Discovered while preparing 5.2. The cause was
architectural rather than careless — `observe()` needs a `FileSystemHandle`, M2's seam hands out `read()` —
and the fix is that the Chromium walk **already held a handle and discarded the reference**: it is now
carried, optional and pass-through, `WalkFileNode → FoundFile → MarkdownFile`, and the new
`src/watch/detectorForFile.ts` branches on the **CAPABILITY** (`handle && observer`), never the engine, so
**Firefox reaches the polled fallback by ABSENCE and not one Firefox module changed**. The content script
still polls, correctly (URL only, no URL→handle API) — the 2×2 is made real, not collapsed. Verified by the
MECHANISM: the seam's `read()` count stays flat across a full poll interval while changes still arrive, with
the handle-withheld same-file case as its non-vacuity control; 1.2's dead-observation ladder and spec §7-7's
atomic-save fallback are now asserted **through the real wiring**. **A SECOND DEFECT was found by that
verification and fixed with it: the watch pill did not exist on the FIRST file opened in a session** (the
target was registered after the mount that decides whether to build a control) — invisible on both engines
until a second file was selected. **GROUP 5 IS IN PROGRESS: 5.1 DONE — both numbers are
MEASURED** (`scripts/perf-watch.ts`, `pnpm perf:watch`, not in CI; numbers in the § Baselines / pins block
below). **NO threshold asserted and NO debounce window chosen — 5.2 is untouched and is the human's.**
**5.2 DONE 2026-07-21 — THE HUMAN DECIDED: a COST-PROPORTIONAL COOLDOWN, not a fixed window.** After each
render, refuse the next until roughly as long as that render TOOK has elapsed **since it FINISHED**
(multiplier 1.0); changes inside the cooldown are **COALESCED, not queued** — one pending render, **newest
text wins**; the FIRST render after a start is immediate. ~50 ms at 50 KB (invisible), ~800 ms at 1 MB
(the main thread roughly half free instead of not at all). **Recorded in `docs/ai/decisions.md` BEFORE 5.3
wrote a line**, per 004's D-2 pattern. **5.3 DONE 2026-07-21 — SHIPPED, CONTROLLER-ONLY** (`mount()`, the
detectors and `WATCH_INTERVAL_MS` untouched). `renderNow()` times the synchronous block and sets
`readyAt = end + cost`; `onText` coalesces into ONE pending slot the newest change overwrites, on a timer
aimed at `readyAt` that is deliberately **not re-armed per change** (re-arming is a trailing debounce, which
starves). **The cost-scaling test is the one that proves what shipped** — a fixed 250 ms impostor fails it
`expected 250 to be less than 30`. **The switch-discards property has TWO independent guards** (stop AND
start both cancel), found the same way 3.4 and 4.1 found theirs: the single break stayed green, and only
breaking both exposed `"A: pending -> HOST B"` — 4.3's cross-feed bug one level up. **A flake in the new
browser test was fixed at its cause, not asserted around** (a macrotask-spaced stream measures the
harness's scheduler latency, not the coalescer — 4.5's shape); 3/3 full browser runs green after.
**GROUP 6 IS IN PROGRESS: 6.1 DONE 2026-07-21 — RE-MEASURED AT THE MILESTONE CLOSE, AND THE FIRST-PAINT
GATE HELD.** The milestone's standing perf risk (watch adding chrome to a path with ~7–12 ms of margin)
**did not materialise**: two independent 7-iteration passes read **138.6 ms** and **135.8 ms** against the
**<150 ms** budget, with **no warm iteration over the bar** — where the M4 close's own second pass had one
at 150.9 ms. **Called NOISE on the floor, per the M4 precedent:** the floor across both passes is
**132.0 ms**, at/below M4's recorded min of 132.6 ms, and real added cost raises the floor. Bytes grew and
are **STATED, not gated** (spec §5): content script **+10,757 B**, app chunk **+12,809 B**, background
**+878 B** (the third listener). **The app-chunk baseline did not exist and was measured rather than
guessed** — a throwaway worktree build of `70bb8ef` that reproduced the recorded content-script baseline
**to the byte**. `pnpm zip` **335.89 / 335.95 kB**, far under 2 MB. `perf:watch` re-run twice and did
**not** move — and the reason is recorded: that harness does not drive `watchController`, so it cannot see
5.3's cooldown at all. Full numbers + deltas in § Baselines / pins. **6.2 DONE 2026-07-21 —
`docs/trust/PERMISSIONS.md` now discloses the background's THIRD listener and carries a watch-relay row
in the capability ledger**, in the ledger's own honest framing: **no new manifest permission** (a content
script messaging its own background needs none; `permissions: []` re-proven on both built manifests by an
**unmodified** `manifest.test.ts`), but a real capability worth disclosing — what it can touch (**only**
`file://` markdown URLs matching the content script's own `matches`, refused **before** any read by
`isWatchableFileUrl`), when it fires (only while the user has switched watch on), and that it is
user-visible and stoppable in one click. **§3.6-A is now stated explicitly AND as MEASURED rather than
asserted:** a `file://` read leaves the Resource-Timing buffer **empty on both engines** (task 2.3), so
the http(s)-scoped zero-network guards are **correct, not conveniently scoped**. **The claim *"File
contents are never stored"* was left EXACTLY as it is — that is DELIBERATE, not an oversight:** it is
**true for all of 005** (D-1 — nothing here persists file contents; `DB_VERSION` is untouched at 2), and
its correction belongs to **006**, in the same PR as the first code that stores a snapshot. Correcting
it now would make the document wrong in the other direction. **GROUP 6 IS COMPLETE.**
**4.8 DONE 2026-07-21 — FOUND BY A HUMAN AT THE 7.1 GATE, with 005 believed code-complete and pushed:
watch on the content-script `file://` surface detected changes and rendered NOTHING.** The registered
target was 4.1's placeholder, whose `start(host)` ignored the host and called `detector.start(() => {})`
— an EMPTY callback. 4.1 wrote that it would be replaced at 4.2; **4.2 replaced it in `appShell.ts`
only**, and 4.6 later restated the same mechanism as evidence for a different argument without anyone
connecting it to *"so watch does nothing there"*. The human measured the relay working perfectly around
it: **200, 28623 bytes, 88 background fetches in ~90 s, zero re-renders. THIS IS THE THIRD INSTANCE OF
ONE CLASS IN 005** (`observerDetector` wired to nothing, the pill missing on the first file, this) and
they share one cause: **every watch test registers its own target before mounting**, so nothing ever
asked which target *production* registers — and `peekover.content.ts` cannot be loaded by any test at
all, because a WXT entrypoint imports the virtual `#imports` module. **So the fix is a RELOCATION:**
`src/watch/contentWatch.ts` (`installContentWatch`) now owns the whole decision-and-construction, the
entrypoint keeps only `location.href` / `browser.runtime.sendMessage` / `!import.meta.env.FIREFOX`, and
a real `createWatchController` goes into the slot — which also wires `onError`, so a file deleted while
watched here **stops and explains** instead of failing silently forever. The placeholder was **deleted**,
not kept as a delegate: dead code that looks live is what caused this. **The pin that generalises it**
(`contentWatch.test.ts`, verified red against the pre-4.8 tree): *every production
`registerWatchTarget(...)` call site builds its target with `createWatchController`.* One discovered task was
added below 5.1:
**5.1a**, the local-disk observer latency the harness provably cannot take, folded into 7.1 and explicitly
**non-blocking** for 5.2/5.3. Group 3 is where `mount()` stops
being the read-only library four milestones have treated it as. The content script builds a stopped
detector at `document_start`; nothing starts it, because watching is a user gesture on group 4's
control.**
**7.1 PASSED 2026-07-21 — BOTH ENGINES, BOTH SURFACES, FRESH PRODUCTION BUILDS, NETWORK TAB OPEN. ONE
FINDING, and it is a product judgement rather than a defect (the pill's discoverability — see the carried
items).** The relay round trip, **the single largest gap in the milestone**, now works on the `file://`
surface and was re-walked after 4.8's fix. The anchor (D-3) passed all three cases: **inserted-above**
lands on the same sentence; a **wholesale heading rewrite** (`sed -i 's/^## Section/## Chapter/'`) lands
in the same place via **the index fallback — the ladder's second rung, exercised on real disk for the
first time**; and that same command is an **atomic save**, which **the watch survived** — answering spec
§7-7's fragility concern on real disk rather than on OPFS. **Raw mode holds**, so 3.3's deliberate
`scrollTop`-only asymmetry is now eyeballed rather than assumed. **5.1a is TICKED — the OPFS inference is
CONFIRMED** (see § Baselines). The 5.3 cooldown passed a 20-append burst on the 1 MB file (**no freeze,
landed on `burst 20` — newest wins**) with its limit stated: the burst finished in under a second, so it
proved coalescing, not sustained pressure. **Firefox app-page watch works including 1 MB with no hitch —
the ONLY performance evidence Firefox's watch will ever have**, since both perf harnesses are
Chromium-only by construction. **The "Allow access to file URLs" OFF check confirms 4.6's reasoning by
observation:** the content script does not inject at all — no control, no note, no misdirection. Zero
network while watching; no console errors; a file deleted mid-watch **explains and keeps the last good
render**. **5.1a and all seven carried items are DISCHARGED.**

- **THE 5.1 NUMBERS, AND THE ONE THAT INVERTS THE OBVIOUS READING (2026-07-21).** Full table in
  § Baselines / pins. The headline for whoever walks into 5.2: **`preserveReading` roughly DOUBLES the
  synchronous block (16.8→34.9 ms at 50 KB; 360→717 ms at 1 MB) but adds ≈0 ms to the whole unresponsive
  window (start → 2nd rAF).** The anchor's `getBoundingClientRect` FORCES layout inside `mount()` that a
  plain mount pays one frame later anyway — so that delta is layout **MOVED, not ADDED**, and on this
  evidence **the anchor is not the lever; the render itself is.** Quoting "preserve − plain" as the anchor's
  cost would have been the wrong conclusion from a correct measurement, which is why the like-for-like
  to-2nd-rAF control exists.
- **THE 5127 ms IS RETIRED.** It was human reaction time (decisions.md said so at the time). Clean
  programmatic observer latency: **18.7 ms @ 50 KB · 109.5 ms @ 1 MB** — measured **on OPFS**, because no
  local-disk handle is obtainable without a native dialog Playwright cannot drive, so none was faked.
  **THE INFERENCE IS NOW CONFIRMED (task 5.1a, at the 7.1 gate): on local disk a small file updates
  instantly and 1 MB in a few milliseconds — the OPFS probe did NOT under-predict**, making this the
  counter-example to retro finding 2's ~13× precedent rather than another instance of it. Full detail and
  the stated limit of the confirmation are in § Baselines.
- **INHERIT THIS BEFORE WRITING ANY A/B PERF CONTROL — 5.1's control was VACUOUS TWICE before it measured
  anything, and both failures were silent.** (i) The first draft applied the same-size change to both the
  control and the measured mount, so the two documents had IDENTICAL geometry and the anchor had nothing to
  correct: **0 px drift on every cell**, a control that could never have gone positive (the same shape 3.3's
  red-first pass caught). Fix: both mounts render an identical byte/paragraph/heading count with the block
  merely **MOVED** — below for the control, above for the measured path. (ii) Drift read at the 2nd rAF
  reported **2738 px contained but 2 px full-page**, because `:host` is `scroll-behavior:smooth` and the
  write was still animating while the contained pane (`auto`) had landed. **A plausible wrong answer on
  exactly one surface, never an error** — this milestone's recurring failure class. Read geometry after a
  SETTLE, never on the timing frame.

- **THE FLAKE IS FIXED (task 4.5, 2026-07-21): `fileParallelism: false` on the `browser` project, and
  `pnpm test:browser` is deterministic again — 12/12 consecutive green, both engines.** The choice was
  measured, not guessed: global serial **62s** vs a narrower Firefox-instance-only serial **57s** (Vitest
  honours per-instance `fileParallelism`) — the ~5s saving did not justify the asymmetric config while the
  whole suite runs under a minute; parallel was 26s but ~40% flaky. NO assertion was weakened. The +36s is
  dev/CI wall-clock only (test runtime is not a shipped metric). **One env caveat:** Vitest's default
  browser API port (63315) can collide with a Windows reserved range (`EACCES`) — the fix is a local-only
  `browser.api.port` override, deliberately NOT committed (orthogonal to parallelism). Root-cause record
  retained below for provenance.
- **[SUPERSEDED by 4.5 above — kept for the root-cause trail] THE FLAKE IS IDENTIFIED, ROOT-CAUSED, AND
  GROUP 4 MADE IT WORSE (2026-07-20, task 4.4).** What was an unidentified 1-in-11 failure with no
  captured name is now understood. **Signature:** ALWAYS Firefox, ALWAYS the FULL-PAGE surface
  (`:host{position:fixed;inset:0}` — the scroll box is sized to the viewport), ALWAYS a scroll/geometry
  assertion, and ALWAYS a *plausible wrong position or no movement*, never an error
  (`expected 0 to be greater than 0`, `expected 8092.6 to be greater than 8092.6`,
  `expected 2816.4 to be less than 12`). Names captured: `tocScroll` "activating an entry scrolls its
  heading into view"; `watchAnchor` "resolves the EXACT element that scrolls" and "restores the SAME
  heading at the SAME offset"; `watchRemount` "keeps its PLACE when content is inserted ABOVE";
  `watchControl` "AT THE BOTTOM, appended content is FOLLOWED".
  **MECHANISM (measured): cross-file CONCURRENCY.** `--no-file-parallelism` → **3/3 green**; with
  parallelism → **~40% of runs fail**. Files share ONE browser window, so a viewport resize or plain
  contention lands under another file measuring viewport-sized scroll geometry.
  **GROUP 4 AGGRAVATED IT — stated plainly.** A git worktree at `5cf9be4` (pre-group-4, `wxt prepare`
  run) measured **5/5 green, 367 passed**; at group-4 HEAD ~40% fail. The suite grew 372 → 458 tests
  and 47 → 50 files. A partial mitigation inside the file fence (moving `watchControl`'s viewport
  resizing out of a global `beforeEach`, ~30 → ~6 resizes) helped only marginally — which is itself
  evidence that concurrency, not resizing alone, is the cause.
  **The fix is OUT OF group 4's file fence and is flagged as discovered task 4.5, not applied:** set
  `fileParallelism: false` on the browser project in `vitest.config.ts`, or isolate the full-page
  geometry suites. **Do NOT weaken any of those assertions** — each is a real, red-first-proven guard
  and the failure is the harness, not the code. **Until it is fixed, run `pnpm test:browser
  --no-file-parallelism` for a trustworthy result.**
- **SUPERSEDED — the original form of the watch item, kept for provenance:** During 3.3's verification a `pnpm test:browser` run reported `1 failed | 366 passed` and the
  failing test's NAME was not captured before the next run. **10 consecutive full runs since were green**
  (367 passed / 5 skipped, both engines), as were targeted re-runs of every group-3 suite. **Recorded as an
  open unknown rather than dismissed**, because this milestone's standing lesson is that the SHAPE of a
  flake matters more than its rate: the `remoteMedia` positive control flaked at a similar rate for two
  milestones before anyone established it was the instrument proving a non-vacuous zero-network assertion.
  **Do NOT assume it was benign, and do not assume it was in a group-3 file** — it is unidentified. If a
  full-suite failure recurs, CAPTURE THE TEST NAME FIRST (`| grep -E "^ FAIL"`) before re-running; a
  re-run that goes green destroys the only evidence.
- **INHERIT THIS BEFORE WRITING ANY GEOMETRY TEST — "the box overflows" is NOT the precondition;
  "the box has STOPPED REFLOWING" is** (measured at 3.2, 2026-07-20, both engines). The long-standing
  `waitForScrollable` helper returns as soon as `scrollHeight > clientHeight`, which is true while the
  reader is still restyling: on the full-page surface `scrollHeight` read **81798 px at first overflow
  and 26069 px once settled — a 3× reflow.** Any heading offset measured in that window is stale by
  tens of thousands of pixels, and the `scrollTop` write that follows **CLAMPS to the new maximum**,
  silently parking the test at the document bottom. It is not a flake — it made 3.2's anchor capture
  pick the LAST heading deterministically, on Chromium and Firefox. `watchAnchor.browser.test.ts` polls
  `scrollHeight` for stability instead; copy that, not the older helper. **Note the failure SHAPE: a
  clamped scroll produces a plausible wrong answer, never an error** — the same silent-wrong-answer
  class as 003's mis-resolved scroll root.
- **INHERIT THIS BEFORE PLANNING GROUP 4 — FIREFOX WATCH IS APP-PAGE-ONLY, measured at 2.3**
  (decisions.md 2026-07-19). A background `fetch("file:///…")` on **Firefox 152 THROWS**: a
  `moz-extension:` document *"may not load or link to `file:`"* — **Gecko's URI security policy, not a
  missing toggle**, and **no permission grants it**. Combined with task-0's finding that the content script
  cannot re-read its own file either, **both halves of the content-script route are closed on Firefox.**
  **Chromium is unaffected** (status 200, fresh bytes) and keeps its two-surface promise. Spec §3.5 was
  narrowed in the same commit (C12); §7-1 and §7-4 are marked RESOLVED; §4 Degradation now covers this
  surface. **Consequence for group 4: 4.4's precondition is SATISFIED and it took the negative branch — it
  ships the designed explanation for the Firefox content-script surface too**, not only the non-drag app
  page, and **not a dead control**.
- **§7-4 is also answered, and it validates the guards rather than changing them:** a `file://` read
  produces **`[]`** in `performance.getEntriesByType('resource')` on **both** engines. The existing
  `/^https?:/i` zero-network scoping is **correct, not merely convenient** — nothing to filter out.
  **Stated plainly so it is not over-read:** those guards prove watch put nothing on the wire and can
  **never** prove the local read happened. Detection tests own that, not the guards.

- **The `remoteMedia` positive-control flake is FIXED** (it had recurred — 1 failure in 10 captured runs,
  Firefox). It now AWAITS the Resource-Timing entries to a 5 s budget instead of sampling the buffer at one
  instant, and returns the buffer so a genuine failure still fails on the caller's own `toContain` with the
  real diff. **Evidence: 22/22 consecutive runs green, both engines**; a deliberate break (await a URL that
  is never fetched) goes red on both with the real message. The zero-check is untouched and stays a genuine
  zero-check — you cannot await something that should never arrive. **The other six guard files do NOT
  share the risk and were deliberately not touched:** their controls are `await fetch(probe)`, so the test
  awaits the fetch promise itself, whereas `remoteMedia`'s requests are engine-initiated `<img>` loads the
  test never awaited. That structural difference is why only that file ever flaked. If one of the six ever
  does flake, promote the awaited helper to a shared test util rather than patching in place.

- **One question the tasks draft ANSWERED by measurement rather than deferring it** (throwaway probe, run
  and deleted 2026-07-19): **the Chromium `FileSystemObserver` path IS real-engine testable in
  `tests/browser`, via OPFS.** `navigator.storage.getDirectory()` yields a real `FileSystemDirectoryHandle`
  with **no user gesture** and no loaded extension, and on **HeadlessChrome/149** `observe()` on an
  OPFS file handle is accepted and a write fires a genuine `["modified"]` record. **Firefox 151 has no
  `FileSystemObserver` at all** (OPFS itself works), so that suite feature-gates off on Firefox — honest,
  not a hole, since Firefox never takes the observer path in production either. **Residual limit, stated in
  task 1.2:** OPFS is not local disk, so this proves the *wiring* and the dead-record branches, not that
  Chromium's observer fires for a local-disk file rewritten by an external agent (task-0 established that;
  the human gate re-walks it).

- **M1 (001), M2 (002), M3 (003), M4 (004) are all fully closed** — code-complete, human-gated, retro'd.
  **Nothing on any of them is outstanding**, and no work of any kind on 001–004 remains to be started.
- **M5 — spec 005, watch mode** (the Phase-1 differentiator; roadmap in `docs/product/spec.md`
  §Phase-1). Done so far: the **task-0 feasibility probe** was built, run on both engines and both
  surfaces, and **torn down** (findings in `decisions.md` 2026-07-19, spec-005 task-0 probe);
  **`specs/005-watch-diff/spec.md` is APPROVED at gate 1**; and **`specs/005-watch-diff/plan.md` is
  APPROVED at gate 2** (both 2026-07-19).
- **THE MILESTONE WAS SPLIT AT THE PLAN GATE — inherit this, it changes what 005 is.**
  **005 = watch mode**, seven task groups (detection core · relay + Firefox verification · re-render
  continuity · watch UX · measure→tune · perf/pins/docs · human gate). **006 = snapshots + diff**, which
  gets its **own Gear-3 cycle** (spec-level WHAT already exists in 005's §3.3/§3.4 and its criteria
  marked *deferred to 006*). Two consequences worth knowing before planning anything: **005 adds NO
  dependency** (`dependencies` stays at three) and **005 stores NO file contents** — so
  PERMISSIONS.md's "file contents are never stored" claim **stays TRUE for all of 005**, and its
  correction lands in 006 alongside the code that forces it.
- **All three Gear-3 gates are PASSED** (spec → plan → tasks). Implementation is under way, task by task,
  each with its own commit, its own red-first evidence and its own pointer move. **The gates that remain
  are the ones budgeted INSIDE tasks.md and they are human work:** **2.3** (does a background
  `fetch("file://…")` work on Firefox at all — no harness can answer it, and it **blocks 4.4**), **5.2**
  (the debounce window, chosen from 5.1's numbers) and **7.1** (the milestone-close gate).
- **Three decisions were SETTLED at the plan gate (`plan.md` §0) — inherit them, do not re-litigate:**
  - **D-1 · SPLIT taken** — 005 ships watch (7 groups, 004's proven size); snapshots + diff become 006.
  - **D-2 · the `diff` dependency is APPROVED but DEFERRED to 006** — it would be the first
    `dependencies` addition since M1, so it is a governed act, and it is not this milestone's.
  - **D-3 · scroll continuity is ANCHOR-based, not `scrollTop`-based** — restoring pixels is right only
    when content is *appended*, and an agent rewriting a file inserts *above* the reading position
    constantly. Heading-anchor restore, `scrollTop` fallback; whether it *feels* right is human-gate-only.
- **Four scope decisions are SETTLED at gate 1 — inherit them, do not re-litigate:**
  1. **Scope is three of F6's six items** — auto-reload on change, watch mode, and diff vs. an earlier
     snapshot. The other three plus the MCP bridge are out, each with a recorded home (spec §6).
     **Since D-1, the first two are 005 and the third is 006** — the feature area is unchanged, the
     milestone boundary moved.
  2. **The engine split is MEASURED, not assumed:** Chromium detects **event-driven**
     (`FileSystemObserver`, no polling); Firefox detects by **polling** and **only via the drag route**,
     comparing **content** — `size`/`lastModified` are frozen at drop time.
  3. **Snapshots store FILE CONTENTS.** So `docs/trust/PERMISSIONS.md`'s "File contents are never
     stored" claim (three places) becomes false and **must be corrected in the same PR as the first code
     that stores a snapshot** — same weight as an AGENTS.md #4 event, though no manifest change.
     **That PR is now in 006, not 005** (D-1). Do not correct the claim early: in 005 it is still true.
  4. **§3.6 — a local-file read is NOT a network call (option A).** Watching does not light the network
     indicator; the zero-network guards stay **http(s)-scoped**. **Verify, do not assume** — spec §7-4.
- **The spec's eight §7 risks are RESOLVED to concrete positions in `plan.md` §3** — read that, not the
  spec's list. **The seven risks the plan still CARRIES into implementation are `plan.md` §4**; they are
  stated there and deliberately not restated here. The two worth knowing before opening any file: the
  plan **crosses the `mount()` boundary** four milestones have treated as read-only library, and the
  **relay is untestable end-to-end** in `tests/browser`, so its round trip is a budgeted human-gate item.
- **Before the first task of any group, re-read the standing rules that keep costing time when skipped:**
  `docs/ai/decisions.md` (the harness ledger, the dead ends, the gate procedure — all three promoted
  2026-07-19) and `docs/ai/retro.md` (newest entry first).
- **THE FIRST-PAINT GATE HELD, and the margin did NOT shrink — this was the milestone's real perf risk and
  it did not materialise.** Watch added chrome to that path all milestone (4.1's pill, 4.3/4.4's note
  element, 4.7's wiring), and the entry warning was ~7–12 ms of headroom. **Two independent 7-iteration
  passes:** median **138.6 ms** (min 136.4, max 144.5) and median **135.8 ms** (min 132.0, max 137.6). The
  second pass reads **BELOW the M4 baseline**. **No warm iteration exceeded the bar in either pass** — max
  144.5 ms, against the M4 close's own second pass which had one warm iteration at **150.9 ms**.
- **VERDICT: NOISE, not regression — and the FLOOR is why, applying the M4 precedent rather than
  re-deriving it.** Real added cost raises the floor; noise moves only the middle. The floor across both
  passes is **132.0 ms**, at/below M4's recorded min of **132.6 ms**. The cross-pass median spread
  (**2.8 ms**) is the same magnitude as the +0.9 ms pass-1 delta and larger than it. **A +10.8 KB content
  script did not cost measurable first paint** — the bytes are parsed once at `document_start` while the
  gate's cost is dominated by parse+sanitize+layout of the document itself.
- **The 1 MB number IMPROVED by 64.8 ms and that is not claimed as an optimisation** — 005 did nothing to
  the first-paint path that would explain it, so it is read as the same run-to-run variation the typical-doc
  spread shows, drawn favourably. **A milestone that adds bytes does not get to book an unexplained speedup.**
- **THE BYTE DELTAS ARE STATED, NOT GATED** (spec §5 — no threshold was invented). +10,757 B on the content
  script and +12,809 B on the app chunk buy: the watch control + its registry, the `role="status"` note
  element, the change detectors, the controller with 5.3's cooldown, `detectorForFile`, `watchAvailability`
  and the relay client. The background's +878 B is the third listener (the watch relay) and nothing else.
- **THE APP-CHUNK BASELINE DID NOT EXIST AND WAS MEASURED, NOT ESTIMATED.** No prior milestone recorded the
  app-page chunk, so "+12,809 B" would have been unsupportable. It was obtained by rebuilding the M4-close
  commit (`70bb8ef`, 004 task 7.1) in a throwaway `git worktree` and reading the artifact. **The method
  validates itself:** that build reproduced the recorded content-script baseline **exactly — 288,654 B, to
  the byte** — so the app-chunk number comes off the same trusted build. The worktree was removed. *(This is
  where 4.7's `observerDetector`, `detectorForFile` and `watchController` first reach a shipped path, so the
  app chunk is the one that should have grown most, and it did.)*
- **RE-RUN AT 6.1 (twice), AFTER 5.3's COOLDOWN SHIPPED — THE NUMBERS DID NOT MOVE, and the reason matters
  more than the numbers.** `perf-watch.ts` **does not drive `watchController` at all** — it calls `mount()`
  and `observerDetector` directly (`watchController` appears in that file only inside a comment). **So this
  harness cannot see 5.3's cooldown, and a moved number here would have needed a different explanation than
  "the cooldown".** Two re-run passes against 5.1's table: shipped-sync 50 KB full-page **32.8 / 33.7** (5.1:
  34.9), 1 MB full-page **702.1 / 695.8** (5.1: 717.3), 1 MB contained **681.3 / 684.6** (5.1: 713.9);
  parse+sanitize **11.7 / 12.4** (5.1: 12.5). Every cell is at or slightly below 5.1's, with no systematic
  direction — **re-measurement noise on an unchanged code path**, which is exactly what it should be.
  **The `preserveReading` finding REPRODUCED**, which is the part worth re-confirming: continuity still
  roughly doubles the synchronous block while the whole start→2nd-rAF window moves **+24.1 ms full-page and
  −24.8 ms contained** — opposite signs, i.e. noise around zero. **Layout MOVED, not ADDED, twice measured.**
  Non-vacuity held per cell (2738 px vs 0 px).
- **The ONE cell that looked like it moved, and the spread that settles it: 1 MB observer latency.** 5.1 read
  **109.5 ms**; the 6.1 passes read **130.4** and **126.4 ms**, which invites a "+19%" story. It is **noise**:
  the second pass's own intra-run spread is **min 100.5 – max 132.7 ms**, a 32 ms band that *contains* 5.1's
  109.5. A 7-sample median over a 32 ms band is not stable to 20 ms. **50 KB latency is stable across all
  three passes — 18.7 / 19.3 / 18.3 ms** (spread 17.8–19.1), which is the control that makes the 1 MB
  band read as fixture-size variance rather than instrument drift. **Still OPFS-measured — but no longer
  an unconfirmed inference: 5.1a walked local disk at the 7.1 gate and the magnitude class held** (small
  file instant, 1 MB a few milliseconds; see the observer-latency bullets below).
- **The contained surface is the one the decision governs:** `watchController` (the only caller that ever
  sets `preserveReading`) is wired ONLY by `appShell.ts`. The content script registers 4.1's thin detector
  adapter and never re-renders (decisions.md 2026-07-21, 4.6 finding (2)).
**Immediate: the progress.md CONDENSE / ARCHIVE pass — 005 is closed and nothing on it is outstanding.**
Move 005's task-by-task narrative into `progress-archive.md` behind an M5 close summary (M1–M4 set the
format), leaving this file the working set it is meant to be. **Then 006's Gear-3 kickoff, in a fresh
session** (C14).

**7.2 IS DONE — the M5 retro is banked** (`docs/ai/retro.md`, newest-first): **nine findings, one
candidate cut on purpose**, and all three of `tasks.md` §7.2's questions answered from evidence.
**The headline is a NEW named defect class — BUILT, TESTED, AND WIRED TO NOTHING**, which hit **three
times** in 005 (4.7's unimported `observerDetector` · the pill absent on the first file opened · 4.8's
empty render callback) with **one cause: every watch test registers its own target before mounting, so no
test ever asked which target PRODUCTION registers.** Its rule and the WXT-entrypoint standing rule
(`#imports` means no Vitest project can load an entrypoint — logic there is untestable by construction)
are the parts 006 must carry. The other findings worth knowing before planning: **red-first is a COUNT and
a REASON, not a colour**; **"it's the harness" must be argued from an isolating variable, never asserted**;
**layout MOVED, not ADDED** (the like-for-like control that stopped 5.2 deciding from a wrong premise);
and **M4 retro finding 2 now has a known exception** (5.1a — the OPFS probe held).

**7.1 IS DONE AND ALL SEVEN CARRIED ITEMS ARE DISCHARGED** (the consolidated list that used to live here
— relay round trip · 5.1a · the anchor's *feel* under heading rewrites incl. 3.3's Raw asymmetry ·
Firefox first paint · Firefox's re-render cost · the degraded-state copy on all three surfaces · 4.6's
five-second toggle-off check). **Every one was walked; the results are in `tasks.md` §7.1**, and the two
that produced durable numbers or decisions are also in § Baselines (5.1a) and the carried items (the
pill's discoverability). **Nothing deferred into the gate is outstanding.**

**After 005 closes: spec 006 — snapshots + diff**, starting a fresh Gear-3 cycle at spec level. Its
inputs already exist: 005's §3.3/§3.4 and the criteria marked *deferred to 006*, plus `plan.md` §1.7
(the two-store IndexedDB split that dodges `idbCore`'s STOP signal), §1.8 (diff) and §3-5.
- **Watch item (not a blocker): the `remoteMedia.browser.test.ts` positive control flaked once on Firefox**
  during 7.1 — *"DOES fire the requests after opt-in"* read `[]`. Green in isolation (4/4, both engines)
  and on full re-run (38/38 · 314/314), and 004 touches nothing in `mediaPolicy.ts`, so: a flake, not a
  regression. **The reason it is watched rather than shrugged off is the SHAPE:** the flaky half is the
  **positive control**, the thing whose job is to prove the zero-leak assertion is non-vacuous — had it
  flaked the other way, the non-negotiable zero-network count would have been certified by an empty
  buffer. **If it recurs, the fix is to AWAIT the request, not sample for it.** (retro 2026-07-19,
  finding 1.)
  - **IT HAS RECURRED — measured at 005 task 1.2, 2026-07-19, and it is the SAME half on the SAME engine.**
    **1 failure in 10 consecutive full `pnpm test:browser` runs** (Firefox; Chromium never failed):
    `AssertionError: expected [ Array(1) ] to include 'http://localhost:PORT/__peekover_pro…'` at
    `remoteMedia.browser.test.ts:115` — the opt-in positive control, the half asserting the request IS on
    the wire. Nothing in 005 touches `mediaPolicy.ts` or that suite, and group 1 wires nothing into the
    render path, so this is the pre-existing flake reproducing, **not** a regression. **The prescribed fix
    is now DUE and is no longer hypothetical:** `fetchedUrls(token)` SAMPLES the Resource-Timing buffer at
    one instant; it must AWAIT the request instead (poll to a deadline, as `waitFor` does elsewhere).
    Left unfixed here deliberately — it is outside group 1's file fence — and flagged for scheduling as its
    own task. **Why it outranks a normal flake: this is the instrument that proves the non-negotiable
    zero-network assertion is non-vacuous.** A sampling control that can read empty when the request DID
    fire can also read empty when it did NOT.

---


## M4 · spec 004 — themes + settings · CLOSED 2026-07-19
*Groups 1–8. Code-complete and human-gated (8.1 PASSED, both engines, both surfaces, no defects found);
retro at 8.2. Verbatim narrative as it stood at close.*

**Spec 004 (themes + settings) IMPLEMENTATION IN PROGRESS — group 1 (store foundation).** Spec/plan/tasks all
APPROVED (gate 1 + Gear-3 gate 2 + gate-3 tasks, 2026-07-17). Sepia DEFERRED (D-1 = A). Group-1 tracker (advance
PER TASK — M1 lesson):
- **1.1 DONE** — `DB_VERSION` 1→2 + additive `settings` store + `getSettings`/`putSettings` in `src/app/store.ts`
  (note: the store layer lives at `src/app/`, not the `src/store/` the tasks/plan text names — benign doc path
  drift, flagged). Real-engine proof `tests/browser/settingsStore.browser.test.ts` (Cr+Fx): round-trip+merge, and
  the v1→v2 additive upgrade PRESERVES folders/recents/pins + adds a working settings store (red-first verified —
  broke onupgradeneeded to drop+recreate → `expected [] to include 'seed-folder'` on BOTH engines → reverted →
  green). Golden EMPTY, `manifest.test.ts` green (`permissions: []`).
- **1.2 DONE** — idbCore `db.onversionchange` close-and-drop by construction (`src/app/idbCore.ts`). On open
  success every connection registers `db.onversionchange = () => { db.close(); onVersionChange?.(); }`; the memo-drop
  lives in `store.ts`'s `db()` (idbCore owns the close, the owner owns its memoization — same seam as
  `__resetConnectionForTest`, rationale in-code). Real-engine proof `tests/browser/idbVersionchange.browser.test.ts`
  (Cr+Fx): a held v1 connection steps aside so a competing v2 open PROCEEDS; a NEGATIVE CONTROL raw (non-stepping)
  v1 BLOCKS the same open (the difference the handler removes). Red-first verified — removed `db.close()` → the
  positive test threw `IndexedDB open blocked …v2` on BOTH engines → reverted → green. Golden EMPTY, 350 unit +
  `manifest.test.ts` green.
- **1.3 DONE** — `wipeAll` clears `settings`; `describeStored` reads the settings row, adds a plain-language line
  ("Theme / display settings — stored on-device, no file contents."), and counts it. Extracted the pure
  `buildStoredLines` helper so the string logic is jsdom-unit-testable (`src/app/store.test.ts`, +4 unit). Real-engine
  proof in `settingsStore.browser.test.ts` (Cr+Fx): describeStored surfaces the settings line, and after `wipeAll`
  `getSettings` falls back to the Auto DEFAULT + describeStored reads cleared. Red-first verified — removed the
  settings `clear` from `wipeAll` → `{theme:'dark'…}` survived vs the Auto default on BOTH engines → reverted →
  green. **Scope note:** `StoredSummary.settings` made OPTIONAL (not required) so the shell's designed
  `EMPTY_SUMMARY` literal in `appShell.ts` stays valid WITHOUT a cross-file edit (scope fence held — group 1 touched
  only `src/app/store.ts` + `src/app/idbCore.ts` + the two new tests + the new unit test).
- **GROUP 1 COMPLETE (1.1/1.2/1.3), NOT pushed** — awaiting human review of the evidence. Suites at group close:
  `pnpm test` **354 unit** · `pnpm test:browser` **176** both engines · golden diff **EMPTY** · `manifest.test.ts`
  green (`permissions: []`). NEXT after review → group 2 (SettingsPort + messaging seam). Do NOT start it yet.
  *Two review follow-ups banked in tasks.md: (a) `src/store/`→`src/app/` Files-path correction
  in tasks.md (tasks 1.1–1.3) and plan.md; (b) group-5 to-do to restore `StoredSummary.settings`
  to required + add `settings: null` to appShell's `EMPTY_SUMMARY`.*

**Group 2 (SettingsPort + messaging seam) IN PROGRESS — advance PER TASK.**
- **2.1 DONE** — new canonical `src/settings/settings.ts` owns the settings VOCABULARY: `Settings`
  + `ThemeSetting`/`EffectiveTheme`, `DEFAULT_SETTINGS`, the pure `resolveTheme(setting, osDark)`
  (auto→OS; manual ignores OS — incl. deferred `sepia`), and the `SettingsPort` interface.
  Dependency-free (no DOM/engine/store/`#imports`). `src/app/store.ts` now IMPORTS + RE-EXPORTS
  `Settings`/`DEFAULT_SETTINGS` (keeps only the persistence-shaped `SettingsRecord`/`SETTINGS_ID`),
  so existing callers importing from the store are unchanged. jsdom-unit proof
  `src/settings/settings.test.ts` (+4): the full setting×OS matrix + the default shape. `pnpm lint`
  clean, `pnpm test` **358 unit**; golden diff **EMPTY**, `manifest.test.ts` green (`permissions: []`).
- **2.2 DONE** — `src/settings/settingsPort.ts` is the surface-agnostic messaging SEAM: the wire
  contract (`GET_SETTINGS`/`SET_SETTINGS` named once), both client ports (`directPort(store)` for
  extension-origin, `messagingPort(send)` for content scripts), AND the background handler builder
  (`createSettingsListener` / pure `handleSettingsMessage`) — all deps INJECTED, no `#imports`/DOM/
  store import. Every port: sync cached `snapshot()` (starts at DEFAULT, never throws) · `load()`
  bounded by `LOAD_TIMEOUT_MS` (**1500 ms** provisional — 4.1 re-tunes from measurement, NOT an
  asserted threshold; chosen < runReader's 3 s never-blank floor, > a cold MV3 SW spin-up + one IDB
  read) resolving to DEFAULT on timeout/failure · `save(patch)` updates cache immediately then
  best-effort persists. jsdom-unit proof `settingsPort.test.ts` (+9) with fake store/messenger:
  round-trip both ports, snapshot-default-before-load, coerce garbled response, save best-effort.
  **RED-FIRST verified** — neutered `withTimeout` to `return promise`: the two THROWING tests
  rejected ("promise rejected … instead of resolving") and the two HANGING tests timed out
  ("Test timed out in 2500ms") → reverted → 9/9 green. `pnpm lint` clean, `pnpm test` **367 unit**;
  golden diff **EMPTY**, `manifest.test.ts` green.
- **2.3 DONE** — `entrypoints/background.ts` gains the SECOND listener:
  `browser.runtime.onMessage.addListener(createSettingsListener({ getSettings, putSettings }))`,
  answering `getSettings`/`setSettings` against store.ts (the background's OWN memoized idbCore
  connection — first non-page consumer, correct across an update via 1.2's versionchange handler),
  action listener intact. **Async-response contract:** WXT's `browser` is the NATIVE
  `chrome.*`/`browser.*` namespace (verified — `@wxt-dev/browser`: `globalThis.browser?.runtime?.id
  ? browser : chrome`), NOT the webextension-polyfill. Native Chrome IGNORES a Promise returned
  from an onMessage listener, so the handler uses **`return true` + async `sendResponse`** (the
  common denominator — Chrome requires it, Firefox honors it); a non-settings message returns
  `false` (declines, no dangling channel). `entrypoints/peekover.content.ts` builds the
  `messagingPort(msg => browser.runtime.sendMessage(msg))` and warms it via `void load()` at
  document_start — **WIRING ONLY**, deliberately NOT threaded into runReader/mount (consuming
  `snapshot()` for first-paint theming + reveal-gating is 4.1/4.2; that touches `src/render/`, a
  fenced later group). Real-engine proof `tests/browser/settingsPort.browser.test.ts` (Cr+Fx, +5
  tests → +10): DIRECT port persists + reads back through the real IndexedDB; MESSAGING port
  round-trips through the SAME `createSettingsListener` + real store (SET read back by BOTH ports —
  one DB behind both); zero-network (Resource-Timing) across save+load both ports + wipe,
  **non-vacuous** (a control fetch registers); RED-FIRST misrouted type → handler declines →
  DEFAULT (asserted ≠ the saved value). RED also proven at source: breaking `GET_SETTINGS` routing
  failed all messaging round-trips on BOTH engines ("expected {theme:'auto'…} to deeply equal
  {theme:'light'…}") → reverted → 10/10 green.
  - **HARNESS LIMITATION (flagged for human gate 8.1):** the Vitest browser-playwright project
    loads NO unpacked extension — no background SW, no content-script injection, `browser.runtime`
    has no receiving end. So the TRUE content→background `runtime.sendMessage` transport is NOT
    exercised; the loopback proves handler + listener response-contract + both ports + the real
    engine's IndexedDB compose, but NOT the message bus itself. The end-to-end path (content-script
    reader → pick theme → reload → persists, Network tab open) is the named 8.1 human-gate item.
  - **PERMISSIONS.md now STALE** ("background = exactly one listener / no other logic"): the update
    is task 7.2 (same-session-as-code discipline lands at group close), NOT edited now. Built
    manifest re-proven `permissions: []` (content→own-background messaging needs no permission).
    Content-script **285,507 B** vs the 284,744 B baseline = **+763 B (+0.27%)** from the
    messagingPort import (formal re-measure is task 7.1).
- **GROUP 2 COMPLETE (2.1/2.2/2.3), NOT pushed** — 3 commits ahead, awaiting human review. Suites at
  group close: `pnpm test` **367 unit** · `pnpm test:browser` **186** both engines · golden diff
  **EMPTY** · `manifest.test.ts` green (`permissions: []`). Group 2 reviewed + **PUSHED**.

**Group 3 (theme runtime + host registry) IN PROGRESS — advance PER TASK.**
- **3.1 DONE** — new `src/theme/themeRegistry.ts`: a module-level `Set<HTMLElement>` of themed hosts +
  `registerThemeHost`/`unregisterThemeHost` + `applyTheme(effective)` broadcast, with an
  `isConnected` **PRUNE before every broadcast** (verbatim mirror of tocView's `tocHosts` — the
  by-construction liveness guard, retro 5×-recurrence rule; deleting during Set iteration is safe).
  Takes an `EffectiveTheme` (never a setting) — `auto` is resolved by the caller, so nothing
  downstream knows about the OS. **OWN module, not inside reader.ts** (tasks.md 3.1 names that path;
  it also lets `appShell.ts` import the registry WITHOUT dragging `READER_CSS` + the font loader
  into the shell bundle). jsdom-unit proof `src/theme/themeRegistry.test.ts` (+4): broadcast reaches
  a `peekover-root` AND a plain div (the tag-name query would have missed the shell root — the §3.4
  bug), register-twice is idempotent, unregister stops writes, and the prune. **RED-FIRST verified** —
  disabled the prune → the DETACHED node received the next write (`expected 'light' to be 'dark'`)
  → restored → 4/4 green. `pnpm lint` clean, `pnpm test` **371 unit**; golden diff **EMPTY**,
  `manifest.test.ts` green. Doc drift fixed in the same commit: tasks.md 3.3/5.2 + plan.md §2 said
  `src/ui/appShell.ts`; the real file is `src/app/appShell.ts` (same class as the group-1
  `src/store/`→`src/app/` fix — paths only, no checkbox/text change).
- **3.2 DONE** — `src/theme/reader.ts` rewritten: the OS-flip listener's
  `querySelectorAll('peekover-root')` broadcast is replaced by the 3.1 registry, and the theme is now
  the SETTING resolved against the OS (`resolveTheme`) rather than the OS alone. Module-level
  `currentSetting` (default `auto`) + the single writer `setThemeSetting()`, which re-resolves and
  broadcasts; the OS listener re-resolves **only under `auto`** (manual pins the theme), reading the
  setting at EVENT time. **No port/store import** — groups 4/5 call the setter (plan-gate decision).
  `initReaderRuntime(host)` **call-compatible (signature unchanged)** → `src/render/mount.ts`
  UNTOUCHED. M1 degradation kept (absent `matchMedia` → no-op, defaults light, never throws).
  +4 jsdom unit in `reader.test.ts` (375 total).
  - **OS-SCHEME EMULATION: AVAILABLE.** Added an `emulateColorScheme` browser command to
    `vitest.config.ts` (Playwright `page.emulateMedia({colorScheme})`) — the exact seam 003 already
    used for `emulateReducedMotion`. **Verified working in BOTH Chromium and Firefox:** `matches`
    flips, a real `change` event fires, and CSS media rules re-evaluate. So the §3.4 staleness
    property is proven against a GENUINE emulated OS flip, not a signal injected at the seam.
  - Real-engine proof `tests/browser/themeRuntime.browser.test.ts` (Cr+Fx, +6 →198 browser): a
    harness-sanity test (flip is genuinely observed — the non-vacuous guard), CONTAINED app-page
    reader re-themes under Auto, full-page reader re-themes (no M1 regression), two hosts from one
    flip, manual ignores the flip, and auto resumes. **TWO RED-FIRSTS, both engines, both clean:**
    (a) restoring the M1 `querySelectorAll` broadcast → the two CONTAINED-host tests fail
    (`expected 'light' to be 'dark'`) — the stale-host bug, isolated; (b) removing the auto-only
    guard → both manual tests fail (`expected 'dark' to be 'light'`) — the gate proven non-vacuous
    (it had passed vacuously under red (a), since M1 never reached a `<div>` at all).
  - **HARNESS QUIRKS DIAGNOSED (not papered over).** Two real flakes were found and root-caused with
    instrumentation rather than sleeps: (i) `matches` and the `change` event are NOT simultaneous
    (Chromium dispatches `change` later), and the control listener lives on a DIFFERENT
    MediaQueryList than the runtime's, whose notification order is unspecified → positive
    assertions now poll the OBSERVABLE OUTCOME (`waitForTheme`), negative ones wait for proven event
    delivery; (ii) a listener installed in one test stops receiving emulated flips in LATER tests →
    new test-only seam `resetThemeWatchForTest()` re-installs per test (same family as
    `__resetConnectionForTest`).
  - **QUIRK (ii) RE-EXAMINED AND RE-SCOPED (follow-up, 2026-07-18).** The original note read as
    "an MQL goes silent after its first flip", which would have implied a REAL product defect: since
    `watchColorScheme()` guards on `let watching = false`, production installs ONE listener per page
    and a user toggling their OS theme twice would see the reader update once then go stale. That
    reading is **WRONG**, and the seam is **TEST ISOLATION, not a workaround for a product
    limitation**. New standing guard `theme runtime — ONE listener, MANY flips` flips the emulated OS
    **twice within a single test against a single install** (no mid-test reset) and requires BOTH to
    land: **GREEN on Chromium AND Firefox**. **Non-vacuous** — mutating the handler to remove itself
    after one fire turns it RED on both engines (`expected 'dark' to be 'light'`, i.e. flip 1 landed
    and flip 2 did not: exactly the defect signature). So one listener handling every flip for the
    page's lifetime is now PROVEN, not assumed.
    The quirk itself is real but **scoped to the TEST BOUNDARY**: measured with the seam disabled,
    earlier-installed listeners fail LATER tests on their FIRST flip (`expected 'light' to be
    'dark'`). Its mechanism is internal to Playwright's `emulateMedia` override lifecycle and is
    **NOT pinned**; two hypotheses probed, **both disproved** — MQL garbage collection (a strong
    reference did not fix it) and the `emulateMedia(null)` teardown in `afterEach` (removing it did
    not fix it). Recorded so neither is re-guessed. Nothing production does resembles it: a real page
    has one media state that changes, never an override swapped out beneath it.
  - **WHAT THIS STILL DOES NOT PROVE:** emulated `prefers-color-scheme` is the BROWSER's media
    state, not a real OS-level theme switch; the OS→browser binding stays an **8.1 human-gate** item.
  `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **198** both engines; golden diff
  **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **3.3 DONE** — `src/app/appShell.ts` shell token cascade restructured into three layers:
  `.peekover-app` light base · `@media (prefers-color-scheme:dark)` = the **PRE-JS default** (the app
  page is themed by CSS alone, never unthemed for a frame) · `.peekover-app[data-theme="light"|"dark"]`
  explicit overrides. Layer 3 beats layer 2 by **SPECIFICITY** — attribute-on-class (0,2,0) vs the
  media rule's (0,1,0), `@media` adding none — so **MANUAL WINS OVER OS in BOTH directions**. The
  light/dark token sets are extracted to `LIGHT_TOKENS`/`DARK_TOKENS` consts so each value is written
  ONCE across all three layers (and they match `readerCss.ts` token-for-token — that identity IS the
  coherence property). The shell root now `registerThemeHost(shell)` + `applyColorScheme(shell)`, so
  ONE `applyTheme` writes shell + reader together. Per spec §6 **no `scroll-behavior` added** to
  `.peekover-app__reader` (reduced-motion trap); `readerCss.ts` untouched; **no sepia** (D-1=A).
  - Real-engine proof appended to `themeRuntime.browser.test.ts` (Cr+Fx, +5 →208 browser), driving the
    REAL `mountAppShell` → openFolder → select-file path and reading **computed tokens**
    (`getComputedStyle(...).getPropertyValue('--paper')` — jsdom cannot cascade): shell/reader compute
    the SAME `--paper`/`--ink` under manual dark AND manual light; manual-dark-on-OS-light and
    manual-light-on-OS-dark both resolve correctly; and with NO attribute set the media rule still
    themes a bare shell (pre-JS default intact). **RED-FIRST** — removed the two attribute-override
    blocks → coherence + both direction tests failed on BOTH engines (`expected '#FBFBF8' to be
    '#12141C'` and the converse) → restored → 22/22 green.
  - **LOOK IS HUMAN-GATE-ONLY.** Computed tokens and geometry prove the values agree; they cannot see
    contrast, opacity, z-order or occlusion. M3's gate caught a fully TRANSPARENT rail that every
    geometry test measured perfectly (defect #6, "visual occlusion is gate-only"). Whether the themed
    app page actually LOOKS right stays **8.1**.
  `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **208** both engines; golden diff
  **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **GROUP 3 COMPLETE (3.1/3.2/3.3 + the review follow-up), NOT pushed** — 4 commits ahead, awaiting
  human review. The 4th is the review follow-up above: the one-listener-many-flips guard (+1 test,
  comment/doc corrections only — **no `src/` behavior change**, the runtime was already correct).
  Suites at group close: `pnpm test` **375 unit** · `pnpm test:browser` **210** both engines · golden diff
  **EMPTY** · `manifest.test.ts` green (`permissions: []`). **NOTE: group 3's four commits were still
  UNPUSHED as of the 4.1 session** (`git status` read `ahead 4`) — groups 1–2 are pushed, group 3 is not.
  `src/render/` (incl. `mount.ts`),
  `src/settings/`, `entrypoints/`, sanitize/parse and the manifest were **all untouched** — the only
  non-group-3 file is `vitest.config.ts`, which gained the test-only `emulateColorScheme` browser
  command (the 003 `emulateReducedMotion` precedent). NEXT after review → group 4 (flash MEASUREMENT,
  then the D-2 mitigation). Do NOT start it yet.

**Group 4 (flash: MEASURE → mitigate) IN PROGRESS — advance PER TASK.**
- **4.1 DONE — flash MEASUREMENT harness + numbers. NO threshold asserted (M1 retro rule).** New
  `scripts/perf-theme-flash.ts` (`pnpm perf:flash [-- --sw warm|cold|both] [--no-build]`), modelled on
  `perf-first-paint.ts`. Minimal instrumentation only: the content entrypoint now fires `port.load()` at
  document_start (parallel with `injectHideStyle()`, plan §1.5) and timestamps the resolve;
  `runReader.ts` timestamps the mount commit. **`src/render/mount.ts`, `src/theme/`, `src/settings/`,
  `src/app/` and the manifest were NOT touched** — group 3's `setThemeSetting()` broadcast through the
  theme registry means a setting applied BEFORE mount themes the first paint and one applied AFTER is
  fixed by the broadcast, so group 4 needs no `MountOptions` change (verified by reading `reader.ts`,
  not assumed). Nothing CONSUMES the settings yet; the reveal is not gated. That is 4.2.
  - **HARNESS SCOPE — CHROMIUM ONLY, and this is now a HARD limit, not a gap to close.** Playwright
    cannot load an unpacked extension into Firefox: `--load-extension` is a Chromium flag, and the
    tracking issue (microsoft/playwright#7297) was **CLOSED 2024-12-03 as out-of-scope**, with every
    later request folded into it. `playwright-core@1.61.1` contains no `installAddon`/
    `installTemporaryAddon` (grepped). So there is no roadmap item to wait for. The **Firefox no-flash
    property is routed to the 8.1 human gate**; no Firefox number was faked. (Third-party escapes exist
    — `playwright-webextext`, Selenium/geckodriver `installAddon`, `web-ext` — none adopted here.)
  - **"COLD" IS DEFINED AND ASSERTED, not slept for.** The MV3 worker is terminated via CDP
    `Target.closeTarget` immediately before each cold navigation. **Two mechanisms probed, one works:**
    `ServiceWorker.stopAllWorkers` was accepted without error but the target SURVIVED; `Target.closeTarget`
    returns `{success:true}` and the target disappears from a follow-up `Target.getTargets`. **A trap
    cost a debugging cycle and is recorded so it is not re-hit:** Playwright's `ctx.serviceWorkers()`
    STILL lists a terminated worker (client-side cache, never pruned), so the first liveness check made
    every cold run look like a failure — `Target.getTargets` is the browser's own answer and is now the
    authority. "Cold" therefore means *no running worker process*, not a fresh profile (that would
    cold-start the browser and disk cache too, conflating three variables). That the worker genuinely
    respawns is proven, not assumed: each run asserts the reply carried the seeded `dark`.
  - **The two observable moments:** `resolved` = `port.load()` resolving in the content script;
    `painted` = 2nd rAF after `<peekover-root>` first has populated open-shadow content — the **same
    metric and detector as `pnpm perf`**, so it is directly comparable to the 003 baseline. Marks cross
    the **isolated-world boundary** as `<html>` data-attributes (a content script's `window` is not the
    page's, so a global is invisible to `page.evaluate`; the DOM is shared). Each mark carries
    `Date.now()` beside `performance.now()` so the harness **CHECKS** both worlds share a timeOrigin
    rather than assuming it — measured skew **≤0.9 ms** every run, well inside the 2 ms tolerance.
  - **NUMBERS** (i7-13700, Windows, headless chromium/Playwright; 7 runs per cell, run 1 discarded,
    **median of warm 6**, min/max as spread; persisted theme seeded to a NON-default `dark` and asserted
    to have reached the reader every run — a run resolving to the `auto` default would measure nothing):

    | fixture | SW   | resolved | painted | committed | DELTA (painted−resolved) | theme before paint |
    |---|---|---|---|---|---|---|
    | 50 KB | warm | 21.4 ms (20.6–22.5) | 133.0 ms (131.9–144.1) | 60.4 ms | **+111.8 ms** | 6/6 |
    | 50 KB | cold | 138.9 ms (137.1–142.9) | 139.1 ms (137.3–143.1) | 62.6 ms | **+0.2 ms** | 6/6 |
    | 1 MB | warm | 22.7 ms (21.3–24.1) | 1162.7 ms (1155.6–1180.7) | 457.9 ms | **+1140.4 ms** | 6/6 |
    | 1 MB | cold | 962.3 ms (954.4–983.9) | 1159.8 ms (1150.0–1194.6) | 462.3 ms | **+199.5 ms** | 6/6 |

  - **THE COLD FIGURES ARE CONTAMINATED — quantified, not hand-waved.** Cold `resolved` read 138.9 ms on
    the 50 KB doc but 962.3 ms on the 1 MB doc, for what is the *same* worker wake. A separate isolation
    probe (extension page, no render work) measures the settings round-trip at **0.4 ms warm (0.4–0.6)
    and 5.0 ms cold (4.4–7.5)**. So the background is nearly free; the in-page cold numbers are almost
    entirely a **DELIVERY WAIT** — a content script shares the page main thread, so a reply arriving
    while the reader is parsing/mounting is not dispatched until that thread yields. `resolved` is
    therefore honestly "when the reader could ACT on the settings", **not** the service-worker cost.
  - **The +0.2 ms 50 KB/cold delta is a PHOTO FINISH, not comfort.** It is pinned at +0.1…+0.2 ms across
    all 6 runs while the absolute values move 6 ms — the signature of both stamps being flushed in the
    SAME main-thread turn. Their order *within* that turn is not resolvable by this instrumentation and
    is not guaranteed by anything currently in `src/`. Mechanism: the ~5 ms worker wake pushes the reply
    just past the moment the main thread saturates with parse+mount, so it then waits ~115 ms for the
    next yield. **It is a cliff, not a gradient** — which is exactly why 4.2 must not read "6/6 before
    paint" as "no flash by default".
  - **INSTRUMENTATION COST ~NIL:** 50 KB warm painted **133.0 ms** vs the recorded 003 baseline
    **133.5 ms** (budget <150 ms) = **−0.5 ms**, inside run-to-run noise. The measurement did not move
    the number it measures. Content script 285.96 kB (formal byte re-measure is task 7.1).
  - **THE TWO DEADLINES — DIFFERENT NUMBERS, DIFFERENT JOBS (the plan conflates these; it must not).**
    - **NEVER-BLANK ceiling ≈ <3000 ms.** runReader's `SAFETY_UNHIDE_MS = 3000` floor reveals raw text if
      nothing has mounted; a gate must resolve well inside that or the user sees the raw flash the whole
      design exists to prevent. `LOAD_TIMEOUT_MS = 1500` (group 2, provisional) sits at 50% of the floor —
      **safe, and NOT re-tuned by this measurement**, but it is ~200× the measured worst-case round trip
      (7.5 ms). It is a dead-background backstop, nothing more.
    - **PAINT-GATING deadline ≈ 77 ms from navigation start (~17 ms of slack).** Derived: paint lands
      ~72.6 ms after mount commit (60.4 → 133.0 ms, 50 KB warm); the <150 ms budget therefore allows a
      commit no later than ~77 ms; the natural commit is 60.4 ms, so a gate may delay the mount by at
      most **~17 ms**. Measured true availability is 21.4 ms warm and ~26 ms cold (21.4 + the 5 ms wake),
      leaving ~51 ms of headroom.
    - **These differ by ~20×. 1500 ms must NOT be inherited as the paint gate** — a gate that waits
      `LOAD_TIMEOUT_MS` would blow the typical-doc budget by an order of magnitude.
  - **D-2 RECOMMENDATION (for the human to accept or reject — NOT a decision taken): BLOCK, with a short
    paint-gate deadline of its own (~75 ms), falling through to auto + the transition path.** Rationale:
    the background's real cost is 0.4 ms warm / 5.0 ms cold, and `load()` is fired at document_start
    while mount does not commit until ~60 ms — so gating the mount on it costs **~0 ms in every measured
    cell**, and the 138.9 ms cold `resolved` is an artifact of the mount work itself blocking delivery,
    which gating *before* the mount removes. **The inference to flag:** that "gating before mount makes
    cold ≈26 ms" follows from the isolation probe, it was NOT measured in the gated configuration —
    **4.2 must re-measure post-gating and fall back to transition if it does not hold.** The fallthrough
    is not optional: the paint budget allows only ~17 ms of stall, so the gate needs its own short
    deadline and a transition path behind it. A pure transition design is the safe-but-worse option — it
    accepts a visible light→dark flip on every cold start, which is the exact defect 004 exists to fix.
  - `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **210** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).
- **4.1a DONE (human decision gate) — D-2 SETTLED: BLOCK, with its own short paint-gate deadline,
  falling through to Auto + an INSTANT re-theme.** Recorded in `docs/ai/decisions.md` 2026-07-18 (the
  driving numbers are LINKED to the 4.1 table above, not restated). Two deliberate sub-decisions:
  **(a) no cross-fade** — the late-arrival path swaps instantly, because an instant swap is
  `prefers-reduced-motion`-safe by construction and adds no code, while a cross-fade is a *visual*
  property no test we can write certifies (M3 defect #6, "occlusion/appearance is human-gate-only");
  the plan's "softened by a cross-fade" wording is **superseded**. **(b) block-with-fallthrough
  SUBSUMES transition** — gate resolves in time → no flash; gate expires → mount Auto and re-theme on
  arrival, which IS the transition behaviour. There is no separate transition design to build.
- **4.2 DONE — but NOT as D-2 specified: the gate was built, measured, and REMOVED. The shipped
  mitigation is D-2's own recorded fallback (mount Auto + INSTANT re-theme).** The one src/ change
  that matters is that the persisted theme now actually REACHES the runtime: the content entrypoint
  does `settings.load().then(r => setThemeSetting(r.theme))`, whose registry broadcast (group 3)
  themes the reader. `runReader.ts` ends the task with **no behavioural change at all** — only the
  4.1 instrumentation deleted.
  - **THE GATE WAS IMPLEMENTED AND IT FAILED ITS BUDGET.** Built as specified: a `themeReady` seam on
    `RunReaderOptions`, a `THEME_GATE_MS` deadline of its own (75 ms, derived exactly as 4.1 said),
    deferral-with-remembered-finality so the settings wait composed with the Gecko source-not-ready
    retry, and openGate on settle-or-deadline-or-rejection. It was green: 7 jsdom orchestration tests
    (red-first in two independent mutations) + 4 real-engine never-blank tests on both engines. Then
    it was measured, and the numbers killed it.
  - **THE 4.1 INFERENCE DID NOT HOLD — this is the headline.** 4.1 predicted that gating before the
    mount would make cold settings availability **≈26 ms** (extrapolated from the isolation probe,
    never measured in the gated configuration — 4.1 flagged it as the thing 4.2 must check). Measured
    behind the gate: **~72 ms**. The isolation probe still reproduces (**0.4 ms warm / 5.6 ms cold**),
    so the background really is nearly free; the probe simply **under-predicts the content-script path
    by ~13×** — it measures an idle, already-loaded extension page, while a content script at
    `document_start` competes with an active navigation. **Standing correction: do not infer in-page
    availability from that probe again** (noted in-code at `measureSwWake`).
  - **MEASURED, THREE CONFIGURATIONS, SAME BUILD AND SESSION (50 KB cell, the one carrying the
    <150 ms budget; medians of 6 warm runs, run 1 discarded):**

    | config | 50 KB warm painted | 50 KB cold painted | verdict |
    |---|---|---|---|
    | gate 75 ms | 129.9 ms | **172.7 ms** | cold BREACHES <150 ms |
    | gate 40 ms | 134.1 ms | **172.9 ms** | cold BREACHES — *not* the deadline's fault |
    | **no gate (shipped)** | 135.4 ms | **148.2 ms / 137.7 ms** | inside budget |

    The two gated rows are the decisive pair: **halving the deadline changed cold by 0.2 ms**, so the
    ~25–35 ms cold cost is **not the length of the wait**. The most likely MECHANISM is that deferring
    the mount at all takes it off the DOMContentLoaded turn it otherwise rides — but that was **NOT
    instrumented; it is a hypothesis, not a measurement**. (Marked as such deliberately: 4.2 exists
    because 4.1's un-remeasured inference (~26 ms) did not survive contact, so an un-instrumented
    causal claim in this same record gets labelled rather than inherited.) No deadline both gates warm
    (settings land at
    ~21.5 ms, before the ~60 ms natural commit) and stays free on cold. And the gate bought nothing
    measurable: **warm was already no-flash without it**, because the settings beat the mount anyway.
  - **FINAL SHIPPED NUMBERS (`pnpm perf:flash`, mark-free harness, Chromium):**

    | fixture | SW   | painted | NO FLASH |
    |---|---|---|---|
    | 50 KB | warm | 139.5 ms (133.1–145.6) | **6/6** |
    | 50 KB | cold | 137.7 ms (132.1–148.6) | **6/6** |
    | 1 MB | warm | 1172.5 ms | **6/6** |
    | 1 MB | cold | 1366.7 ms | **6/6** |

    **VERDICT: the shipped design holds the <150 ms budget on both 50 KB cells** (139.5 / 137.7 ms),
    and 1 MB stays under the 003 part-(b) 1.7 s bound. 50 KB warm reads 139.5 ms vs the 003 baseline
    133.5 ms and 4.1's 133.0 ms — **+6 ms, inside the run-to-run band** (this session's ungated control
    measured 135.4 ms and the min was 133.1 ms; the machine is noisier today than at 4.1). No
    regression, but not a clean improvement either — stated as measured.
  - **THE NO-FLASH MEASUREMENT IS NOW DIRECT, not inferred.** 4.1 could only compare two timestamps;
    the harness now reads **`data-theme` on `<peekover-root>` inside the same rAF that stamps the
    paint** — production's own attribute, at the paint moment. **24/24 runs painted the persisted
    `dark` as the FIRST painted state.** A run where the theme never arrives is an ERROR (vacuous),
    not a "flash".
  - **RESIDUAL RISK, STATED PLAINLY (the thing the gate would have removed):** cold start is a race we
    win, not a race we cannot lose. The ungated cold runs show `resolved` and `painted` landing in the
    **same main-thread turn** (deltas of +0.1 ms in half the runs — 4.1's "photo finish" cliff, still
    there). 24/24 is the measurement, not a guarantee, and no engine here can see an actual flash.
    Whether a human EYE ever catches a flip on a cold start is **8.1**.
  - **4.1 INSTRUMENTATION GONE, AND `perf:flash` SURVIVED MARK-FREE.** `SETTINGS_RESOLVED_ATTR` /
    `MOUNT_COMMITTED_ATTR` / `mark()` / `markSettingsResolved` are deleted (grep across `src/`,
    `entrypoints/`, `tests/`: zero hits) — nothing measurement-only writes to the host page's `<html>`
    any more. The harness did NOT become one-shot: `data-theme` is set by production code, so it
    observes the same property better and with no isolated-world boundary (and therefore no
    cross-world timebase check to maintain). **Byte delta, control-built in the same session:**
    4.1 build (marks, no wiring) **285,955 B** → 4.2 build (no marks, wired) **285,737 B** =
    **−218 B**; the removal more than paid for the theme wiring. vs the 003 baseline 284,744 B:
    **+993 B (+0.35%)** (formal re-measure is task 7.1).
  - **TESTS — THE HONEST SPLIT.** Real-engine `tests/browser/themeFlash.browser.test.ts` (Cr+Fx, +3
    →**216 browser**): the late-arriving theme re-themes the ALREADY-MOUNTED reader **synchronously,
    no re-mount** (the shipped fallback mechanism — **RED-FIRST verified on BOTH engines**: disabling
    the registry broadcast in `applyTheme` fails exactly this test, `src/theme/` then restored, diff
    empty); the reader mounts + reveals themed-Auto with the settings never arriving; and the 3 s
    safety floor still reveals raw when nothing can mount. **Unit count is UNCHANGED at 375** and that
    is not an oversight: the gate's 7 orchestration tests were deleted with the gate, and what shipped
    adds no jsdom-testable logic — `runReader` is behaviourally untouched and the entrypoint binds
    `#imports`. **Test 2 above is a REGRESSION PIN, not a proof:** with no coupling between the render
    path and the settings promise, there is nothing to mutate to make it fail. Said so in the file
    rather than dressing a tautology as a red-first.
  - `pnpm lint` clean; `pnpm test` **375 unit**; `pnpm test:browser` **216** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`). Fence held: `src/render/mount.ts`,
    `src/theme/`, `src/settings/`, `src/app/`, `entrypoints/background.ts` and the manifest untouched.
  - **FOR THE HUMAN:** 4.2 ships the arm of D-2 the human did NOT pick first, under the escape clause
    D-2 itself recorded ("if the re-measure contradicts the inference and the 50 KB cells breach the
    budget, fall back"). The tradeoff now on the table is a **rare cold-start flip** vs a **~25 ms
    budget breach on every cold typical-doc open**; the evidence above is what it rests on.

**Group 5 (settings UI — auto/light/dark, sepia deferred) IN PROGRESS — advance PER TASK.**
- **5.1 DONE — the in-reader theme control, shipped to BOTH surfaces through the one `mount()` seam.**
  New `src/theme/themeControl.ts`: the pure `nextThemeSetting` cycle (auto→light→dark), the
  `buildThemeControl()` builder, and the **register-once save seam** `registerThemeSaveSink`.
  `mount()` pushes the control into `children[]` as a SIBLING of `.peekover-reader`; the content
  entrypoint registers `messagingPort(...).save`.
  - **D-A — the port reaches the control by MODULE SEAM, not by threading (a corrected tasks.md
    line).** tasks.md 5.1 said "threaded through `MountOptions`"; that threading never existed.
    Group 3 deliberately kept the port in the entrypoint (`reader.ts`'s header says why) and group 4
    kept it there again. Threading would reshape FOUR signatures across TWO call chains
    (`runReader`→`mountReader`→`mount`, `mountAppShell`→`createReaderPane`→`mount`) to deliver one
    callback. The seam mirrors group 3's `setThemeSetting` precedent exactly and keeps the property
    the wording protected: **`mount()` and the control import neither the port nor `store`** — the
    context injects its own sink. tasks.md 5.1 corrected in-place (same class as the earlier
    `src/store/`→`src/app/` path drift).
  - **D-B — the control asks the RUNTIME for the setting; it cannot read `data-theme`.** That
    attribute is the EFFECTIVE theme, so `auto` on a light OS is indistinguishable from a manual
    `light`. Group 3's seam gained the minimum needed (`src/theme/reader.ts`): `currentThemeSetting()`
    promoted from test-only, plus `onThemeSettingChange()`. `setThemeSetting` now notifies after
    broadcasting — so ONE subscription keeps every control in sync whether the change came from the
    async cold-start `load()`, an OS flip, or the other surface's control. Liveness is by
    construction: a module-level Set of controls pruned by `isConnected` before each sync (the
    themeRegistry/tocView pattern), so mount()'s per-render rebuild cannot leak a listener.
  - **CORRECTION OF RECORD — THE GOLDEN PIN CANNOT SEE THIS TASK, AND THAT WAS MEASURED.** The
    standing "golden diff EMPTY ⇒ the column is untouched" reading is **false for chrome**: with the
    control deliberately appended INSIDE `.peekover-reader`, `git diff tests/golden/output/` stayed
    **EMPTY** and `golden.test.ts` still passed **10/10**. `tests/golden/golden.test.ts` snapshots the
    pure `sanitize(parse(source))` string — a stage upstream of `mount()` that never observes chrome.
    So the **DOM sibling assertion is the only guard**, not a belt-and-braces duplicate. Noted in
    mount.ts and in the test so the empty diff is never over-read again.
  - **PLACEMENT WAS MEASURED, NOT CHOSEN.** The obvious spot — stacked under the mode-toggle at the
    top-right — **collides with the TOC rail's handle at BOTH viewports** (narrow 414px: control
    [291,56,398,86] vs handle [280,56,392,102]; wide 1400px: [1277,56,1384,86] vs [1173,56,1292,86]).
    The rail owns the entire right side; top-right is the mode toggle, top-left the remote-load pill.
    The control therefore sits **bottom-left, 56px up** — one pill-height above the network indicator,
    the one corner nothing claims at rest. `CONTAINED_CSS` flips it fixed→absolute with the other
    pills, so the app-page pane positions it correctly (the recurring two-surface gotcha).
  - **TESTS — THE HONEST SPLIT.** jsdom unit (+5 →**380**) covers ONLY `nextThemeSetting` + the label
    map; everything else is DOM/cascade/geometry and is proven in the real engine.
    `tests/browser/themeControl.browser.test.ts` (Cr+Fx, 19 tests → **+38 → 254 browser**): renders on
    both surfaces · sibling-of-column on both · a pick applies instantly (attribute AND computed
    `--paper` `#12141C`) · reaches EVERY registered host · works with no sink registered · the save
    path is called once per pick with the right patch · re-labels on a late-arriving setting · a
    second control stays in sync · auto-vs-manual-light is distinguished · button/no-tabindex/
    accessible-name · geometry vs mode-toggle + TOC handle + TOC list at narrow AND wide on BOTH
    surfaces · clears the column at wide · clears the network indicator + remote-load pill.
    **FOUR RED-FIRSTS, all clean on both engines:** append to `root` → 2 sibling tests fail; drop the
    save call → the save test fails; drop the notification → 3 sync tests fail; move to top-right →
    4 geometry tests fail on the TOC handle.
  - **HARNESS LIMIT, STATED:** the browser project loads no unpacked extension, so the control's REAL
    sink (`messagingPort.save` → background) cannot run. A **fake sink is injected through the
    production `registerThemeSaveSink` seam** and asserted; that proves the control's half of the
    contract, NOT that the message reaches the background. End-to-end pick→reload→persists is **8.1**.
  - **LOOK IS HUMAN-GATE-ONLY (8.1).** Geometry and computed tokens proved a fully TRANSPARENT rail in
    M3 (defect #6). Whether the pill reads as Peekover chrome, holds contrast in both themes, or
    occludes something a human minds is not decidable here.
  - `pnpm lint` clean; `pnpm test` **380 unit**; `pnpm test:browser` **254** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).

- **5.2 DONE — app-page shell header control + the group-1 carry-over closed.** The header gains the
  **SAME `buildThemeControl()`** the reader chrome uses, restyled as a header pill beside the storage
  toggle (it carries the `margin-left:auto`, so it heads the right-hand control group). One builder,
  two surfaces — behaviour, labelling and a11y cannot drift; only the CSS differs, and the two
  stylesheets cannot leak into each other (readerCss lives in the shadow root, APP_CSS is
  `.peekover-app`-scoped).
  - **The app page wires `directPort`, not `messagingPort`** — it is extension-origin, so it reads
    and writes the settings store directly with no background round-trip. Two wirings mirroring the
    content entrypoint: `registerThemeSaveSink(patch => port.save(patch))` and
    `load().then(r => setThemeSetting(r.theme))`. `AppStore` gained OPTIONAL
    `getSettings`/`putSettings` (the group-5 reader convention), so a minimal fake store still mounts
    and the control still applies — it just cannot persist.
  - **CARRY-OVER LANDED (recorded at the group-1 review).** `StoredSummary.settings` is now REQUIRED.
    The tightening immediately caught **three** literals — appShell's `EMPTY_SUMMARY` plus two test
    fixtures in `appShell.test.ts` — each of which had been silently reporting "no settings stored".
    That is exactly the compile-time signal the optional field was suppressing; all three fixed,
    `settings: null` added to `EMPTY_SUMMARY`. Full suites re-run green after the type tightened.
  - **TESTS.** New `tests/browser/themeShell.browser.test.ts` (Cr+Fx, 9 tests → **+18 → 272 browser**;
    unit unchanged at **380** — 5.2 adds no pure logic, it is wiring, and saying so beats inventing a
    jsdom test). Present-and-in-the-header · cycles auto/light/dark with **no sepia** · a header pick
    themes shell AND the contained reader pane coherently on **COMPUTED `--paper`/`--ink`** (the
    group-3 precedent — an attribute-only assertion would have passed on the pre-3.3 shell) ·
    dark and light · the header control and the in-reader pill show the SAME selection in both
    directions · a pick reaches the real IndexedDB · it comes back on RE-MOUNT · empty store falls
    back to Auto · a store with no settings methods still applies the pick.
    **TWO RED-FIRSTS, clean on both engines:** dropping `registerThemeSaveSink` fails the 2
    persistence tests; dropping the mount-time `load()` fails the re-mount test with
    `expected 'Theme: Auto' to be 'Theme: Dark'`.
  - **WHAT "PERSISTS" HONESTLY MEANS HERE.** The harness loads no extension and NEVER NAVIGATES, so a
    re-mount is not a reload: the page, module graph and module-level theme state all survive it. The
    test therefore resets the runtime to `auto` and drops the memoized DB connection BEFORE
    re-mounting, so the value read back demonstrably came off disk — and the red-first above confirms
    it (without the load, the re-mount reads `auto`). The genuine reload is **8.1**.
  - `pnpm lint` clean; `pnpm test` **380 unit**; `pnpm test:browser` **272** both engines; golden diff
    **EMPTY**; `manifest.test.ts` green (`permissions: []`).
  - **FOR THE HUMAN — A UX QUESTION, NOT A DEFECT.** The app page now shows **TWO** theme controls:
    this header one, and 5.1's in-reader pill, which reaches the contained pane through the one
    `mount()` seam. tasks.md 5.1+5.2 specify exactly that, so both shipped and they are proven to stay
    in sync — but whether the in-reader pill is redundant on the app page is a judgement call, left
    to the gate rather than taken unilaterally.

  **GROUP 5 COMPLETE (5.1/5.2), NOT pushed** — 2 commits ahead, awaiting human review. Suites at group
  close: `pnpm test` **380 unit** · `pnpm test:browser` **272** both engines · golden diff **EMPTY** ·
  `manifest.test.ts` green (`permissions: []`). Fence held: `tocView.ts`/`tocModel.ts`, `sanitize.ts`,
  `parse.ts`, the manifest and `wxt.config` all **untouched**. **Group 5 reviewed + PUSHED.**
  NEXT → group 6 (TOC carry-over), below.

**Group 6 (TOC carry-over) IN PROGRESS — advance PER TASK.**
- **6.1 DONE — the 003 rail's open-state and width are now a remembered global preference.** Applied on
  build, restored on late arrival, persisted on change; 003's behaviour is bit-for-bit unchanged when
  nothing is stored.
  - **D-E = (b) — the group-5 save seam was GENERALIZED, not duplicated.** New
    `src/settings/settingsSeam.ts` owns `currentSettings()` / `onSettingsChange()` / `saveSettings()` /
    `registerSettingsSink()`. Justified from the code, not by taste: the group-5 sink's type was ALREADY
    `(patch: Partial<Settings>) => void` — nothing about it was theme-specific, it was only NAMED for its
    first consumer; a second seam would have had both entrypoints register the SAME `port.save` twice into
    two module globals; and the TOC additionally needs a READ half, which is literally a `Settings` value
    and belongs with the settings vocabulary rather than bolted onto a theme module. **PURE MOVE, as
    required:** `themeControl.ts` still exports `registerThemeSaveSink` / `resetThemeSaveSinkForTest` as
    delegates, so **every group-5 test file is byte-unchanged** and the two theme browser suites
    (`themeControl` 19 + `themeShell` 9) stayed green untouched. Entrypoints/appShell moved to the
    canonical `registerSettingsSink` + gained `publishSettings(resolved)` beside their existing
    `setThemeSetting(resolved.theme)`.
    - **WHAT WAS DELIBERATELY *NOT* UNIFIED, and why:** the theme's READ half stays in `reader.ts`
      (`currentThemeSetting` / `onThemeSettingChange`). Those report the theme runtime's **APPLIED** state,
      not the persistence cache, and the two legitimately diverge — an OS flip under `auto` changes what
      paints while the stored setting is untouched. Collapsing them would destroy exactly the distinction
      decision D-B was written to preserve. So: the seam owns STORED settings; reader.ts owns APPLIED theme.
  - **D-F — THE rAF STOMP, AND THE VACUOUS TEST IT NEARLY SHIPPED (the headline of this task).**
    `applyInitialTocState` schedules an rAF that re-runs the width rule post-layout and calls `setTocOpen`,
    so a restored value applied at build is **overwritten one frame later**. Handling: **a persisted
    `tocOpen` wins outright AND the rAF is not scheduled at all** (nothing pending ⇒ nothing to race), plus
    a second guard inside `decide()` that re-reads the seam at DECISION time and stands down if a stored
    value has appeared since — closing the narrow window where a rail built with nothing stored has the
    settings publish before its already-scheduled frame runs. Rationale: the width rule is a GUESS made in
    the absence of knowledge; spec §4 makes the stored value a single GLOBAL preference, so re-deriving it
    per viewport is precisely what "remembered" must not mean.
    - **THE NEAR-MISS, RECORDED BECAUSE IT IS THE REUSABLE LESSON.** The first version of the D-F test
      assumed the harness viewport was WIDE and asserted that a stored `tocOpen:false` survived. **The
      harness viewport is 414×896 — NARROW** — so the width rule already decides `collapsed`, meaning the
      stomp would have written *the same value the test asserted*: it would have passed with the entire D-F
      handling deleted. The harness surfaced this only incidentally (a different hardcoded `'open'`
      expectation failed). Fix: the suite now MEASURES the width-derived default by mounting a probe with
      nothing stored and reading production's own answer, then seeds the **opposite** — adversarial by
      construction on any viewport, plus an explicit `not.toBe(widthDefault)` assertion. **The general
      lesson: a persistence test that hardcodes what the fallback would have decided is vacuous whenever
      the two agree, and nothing about the green run says so.**
  - **D-G — restoring must not write back.** `setTocOpen` remains the single, SAVE-FREE writer of
    `data-toc`/`aria-expanded`, now serving three callers (opener, backtick, restore). Persistence lives in
    a separate `setTocOpenByUser` wrapper that both USER paths call. At the seam the same split is
    structural: `publishSettings` (store → us) notifies, `saveSettings` (us → store) does NOT — so a
    consumer that saves on change and restores on notification cannot loop its own write back one turn
    later, or race a `load()` still in flight. Asserted: after a restore, and after a LATE restore, the
    captured-patch array is `[]`.
  - **D-H — CONFIRMED, the drag persists on `end` only.** `pointermove` rewrites `--toc-w` per pointer
    sample and saves nothing; the shared `pointerup`/`pointercancel` handler saves once, and its existing
    `if (!dragging) return` guard makes that exactly once per gesture (a stray or duplicate release stores
    nothing). The stored width is clamped again on the way out.
  - **LATE ARRIVAL — APPLIED, NOT DEFERRED, and this is the PRIMARY path.** On a cold start the settings
    land after the mount commits (group 4's measurement), so the rail is normally built against
    `DEFAULT_SETTINGS` (both fields `null` → 003's behaviour) and corrected when `publishSettings` fires.
    Deferring to "the next render" was rejected because the content-script surface renders once per
    navigation — the next render may never come, so a collapsed rail would reopen on every single open
    forever, indistinguishable from the feature not working. Cost accepted deliberately: a visible
    correction a frame or two after paint, the same instant-swap trade D-2 settled for the theme, moving
    chrome rather than the column's text — and gating the mount is exactly what 4.2 measured, failed
    against the <150 ms budget, and removed. ONE module-level subscription (never per rail — mount()
    rebuilds chrome every render), reaching hosts through the existing `tocHosts` registry with the same
    `isConnected` prune + rail-less skip the backtick resolver uses.
  - **CLAMP ON RESTORE.** A stored width is untrusted in a way a live drag is not (corrupt row, hand-edited
    DB, or a future build with different bounds), so `clampTocWidth` is applied on the way IN; a non-finite
    stored value is rejected outright rather than clamped, because `clampTocWidth(NaN)` is NaN and would
    write the literal `"NaNpx"`, silently killing the whole custom property.
  - **TESTS — THE HONEST SPLIT.** jsdom unit **+4 → 384**: ONLY `clampTocWidth` (in/below/above range +
    idempotence). That is genuinely all the pure logic 6.1 adds — everything else is rAF, layout, computed
    custom properties and pointer geometry, all jsdom-blind; said so rather than inventing a unit test.
    New `tests/browser/tocPersist.browser.test.ts` (Cr+Fx, 21 tests → **+42 → 314 browser**), every
    open-state assertion made **after 3 frames** so it outlives the stomp, and the whole persistence block
    run on **BOTH surfaces** via `describe.each` (the recurring two-surface gotcha, closed structurally).
    **FIVE RED-FIRSTS, all genuinely red on BOTH engines, all reverted from a `cp` backup:**
    (1) D-F handling removed → the opposing-`tocOpen` test fails `expected 'collapsed' to be 'open'` and
    its mirror, 12 failures; (2) clamp dropped from restore → `expected 5000 to be 480` (a rail that would
    have eaten the reading column); (3) `saveSettings` dropped from the user path → both opener and
    backtick tests fail `expected [] to deeply equal [{tocOpen:false}]`; (4) the save moved into
    `pointermove` → `expected [ {tocWidth:251}, …(39) ] to deeply equal []` — 40 writes for one gesture,
    the exact D-H defect; (5) the late-arrival subscription removed → the cold-start test fails on both
    surfaces.
  - **A REAL INTERACTION THE CONTAINED SURFACE FORCED OUT (not scaffolding).** `mountAppShell` runs its own
    production wiring — it registers ITS port's sink (last registration wins, by design) and publishes
    whatever its store returns. On the app page the shell genuinely owns the port and the rail is a second
    consumer of the same seam, so the test re-registers after the shell's turn and gives the fake store a
    `getSettings` that answers with the seeded value. Worth knowing: **on the app page the shell's `load()`
    is authoritative and will overwrite anything published before it.**
  - **HARNESS LIMIT, STATED:** the browser project loads no unpacked extension, so the REAL save path
    (`messagingPort` → background → IndexedDB) cannot run. The fake sink is injected through the
    PRODUCTION `registerSettingsSink` seam and the persisted value fed in through the PRODUCTION
    `publishSettings` — the exact two functions the entrypoints call. That proves tocView's half of the
    contract; it does NOT prove the message reaches the background or that a real reopen remembers.
    End-to-end collapse→drag→**reload** is now an explicit **8.1** item.
  - **THE 5.1 CARRIED QUESTION — ANSWERED BY MEASUREMENT: (a), the established pattern. Nothing
    restyled.** At **414×896** the reading column spans the FULL width `[0,0,414,5957]` while the theme pill
    is fixed at `[16,810,123,840]` — so it **does** sit over body text at a narrow viewport. That is not an
    unintended overlap: the mode toggle `[341,16,398,46]`, the remote-load pill and the network indicator
    are the same family of fixed corner chrome and overlay the column identically at this viewport. The
    relationship is now asserted, so a future change that breaks the pattern goes red. What no test can
    decide — whether the text UNDER the pill stays legible — is the M3 defect-#6 occlusion class and is
    added as an **8.1** eyeball item.
  - `pnpm lint` clean; `pnpm test` **384 unit**; `pnpm test:browser` **314** both engines; golden diff
    **EMPTY**; `tests/manifest.test.ts` green **8/8** (`permissions: []`). Fence held: `sanitize.ts`,
    `parse.ts`, `readerMode.ts`, the manifest and `wxt.config` all **untouched**.

- **7.1 DONE — re-measured at milestone close. Every gate PASSES; nothing in `src/` was touched to make
  a number.** Measurement only, per the task fence.
  - **Content-script bytes: 288,654 B** (`.output/chrome-mv3/content-scripts/peekover.js`, fresh
    `pnpm build`). vs the **003 baseline 284,744 B → +3,910 B (+1.37%)**. vs the **task-4.2 reading
    285,737 B → +2,917 B**, which is the honest attribution: 4.2 was measured BEFORE group 5
    (themeControl + readerCss rules + entrypoint sink) and group 6 (settingsSeam + tocView carry-over),
    so essentially all of the growth since is those two groups. **Per spec §5 this delta is STATED, NOT
    GATED — there is no byte threshold and none was invented.**
  - **First paint (a) typical doc ≤50 KB — the SPEC-001 GATE, PASSES.** Fixture 50.4 KB / 62 sections,
    7 iterations (run 1 cold, discarded). Harness verdict verbatim:
    `gate [50.4 KB, typical-doc gate]: (a) median 137.7ms vs <150ms -> PASS`
    median **137.7 ms** · min 132.6 · max 146.0. vs baseline **133.5 ms → +4.2 ms**.
    - **CALLED AS NOISE, NOT REGRESSION — with the spread behind the call.** Two things say so.
      (1) The **floor did not move**: our min **132.6 ms** is BELOW the 4.2-session recorded min
      (133.1 ms). A real added cost raises the floor; noise only raises the middle.
      (2) A **second independent 7-iteration pass** read median **140.3 ms** (min 136.1, max 150.9) —
      also `-> PASS`. The run-to-run median spread (137.7 vs 140.3 = **2.6 ms**) is the same magnitude
      as the 4.2 ms delta being attributed to 004, so the delta is not separable from machine noise.
      Same conclusion the 4.2 session reached about this machine.
    - **HEADROOM IS THIN AND WORTH SAYING:** the second pass had a single warm iteration at **150.9 ms**,
      over the 150 ms bar. The gate is on the MEDIAN and both medians pass, but the typical-doc budget
      now sits ~7–12 ms from its ceiling on this hardware. Not a breach; a thing the next perf-touching
      session should know before it spends the margin.
  - **First paint (b) 1 MB / ~1400-entry TOC — informational, PASSES its own bound.** Default fixture
    1.12 MB / 1400 sections, 7 iterations. median **1248.6 ms** · min 1198.5 · max 1273.1. vs baseline
    **1196.3 ms → +52.3 ms**; budget **<1.7 s → PASS** with ~450 ms headroom. Same noise reading as (a)
    (the ±37 ms within-run spread swallows most of the delta). **The harness prints
    `gate [1.12 MB, large-doc (informational vs typical-doc gate)]: (a) median 1248.6ms vs <150ms -> FAIL`
    — that FAIL is the harness comparing the 1 MB fixture against the TYPICAL-doc bar and self-labelling
    the comparison informational. It is the known, recorded ~8x-over reading (decisions.md 2026-07-14),
    NOT a 004 breach.** Recorded verbatim so a future session does not read it as a regression.
  - **SCOPE CAVEAT, RESTATED (do not read this as both engines).** `scripts/perf-first-paint.ts` drives
    **CHROMIUM ONLY by construction** — `chromium.launchPersistentContext` with
    `--load-extension`; Playwright cannot load an extension in Firefox at all. **The Firefox
    first-paint half is UNMEASURED and is human-gate 8.1.** Every first-paint number above is Chromium.
  - **`pnpm zip` — the one real bound, PASSES both engines with vast headroom.** Chrome
    **327.61 kB**, Firefox **327.66 kB**, both **< 2 MB**. vs the 003 close (323.63 / 323.69 kB) →
    **+3.98 kB / +3.97 kB**, tracking the content-script growth. (The Firefox run also emits
    `peekover-0.0.0-sources.zip` at 1.6 MB — that is the AMO source bundle, not the shipped extension;
    noted so it is not mistaken for the artifact under the 2 MB bound.)
  - **The standing pins, all green.** `git diff tests/golden/output/` **EMPTY** (and `git status
    --porcelain` on it empty). `tests/manifest.test.ts` **8/8 green and byte-UNCHANGED** — last touched
    by 3b6c575 back in M2 task 1.1, so `permissions: []` on both built manifests is re-proven by the
    same unmodified test. `pnpm lint` clean (eslint + `tsc --noEmit`). `pnpm test` **384/384, 34 files**.
    `pnpm test:browser` **314/314, 38 files**, both engines.
  - **ONE FLAKE, RECORDED HONESTLY RATHER THAN RE-RUN AWAY.** The FIRST `pnpm test:browser` run failed
    1/314: `remoteMedia.browser.test.ts` on **Firefox** — *"DOES fire the requests after opt-in"*,
    `expected [] to include 'http://localhost:63315/…'`. Established as a flake, not a 004 regression:
    it passed in isolation on both engines (4/4) and the FULL suite then went 38/38 · 314/314 on re-run,
    and 004 touches nothing in `mediaPolicy.ts`. **The important part: the flaky half is the POSITIVE
    CONTROL (the opt-in fetch DOES appear), not the zero-leak assertion — the non-negotiable was never
    the thing that wobbled.** Most likely the opt-in request had not landed in the Resource Timing
    buffer inside the assertion window on a loaded machine. **But note the shape:** a control that
    intermittently reads empty is exactly the failure mode that would make the zero-count VACUOUS if it
    ever flaked in the other direction and nobody looked. Watch item — if it recurs, the fix is to await
    the request rather than sample for it. Not fixed here (7.1 is measurement-only; no `src/`, no tests).

**Group 8 (the human milestone-close gate — the acceptance an agent CANNOT self-certify).**
- **8.1 PASSED — 2026-07-19, both engines (Chrome + Firefox), both surfaces, NO DEFECTS FOUND.** A human
  walked the full 8.1 checklist on **fresh production builds**, with the **Network tab open throughout**, on
  the content-script reader over a `file://` doc **and** a file in the app-page reader pane.
  - **Walked in the gate's risk order:**
    1. **Cold-start theme flash on the content-script surface** — extension freshly loaded / MV3 worker
       asleep, a persisted NON-default theme, watching the FIRST paint, repeated on both engines. This is
       the item `perf:flash`'s 24/24 provably **cannot** see: it stamps `data-theme` two frames after first
       painted content, exactly the window the accepted 4.2 residual risk lives in. **No flip seen.**
    2. **Firefox first paint** — which has **NO automated coverage at all** (`perf-first-paint.ts` and
       `perf-theme-flash.ts` are Chromium-only by construction; Playwright cannot load an extension into
       Firefox — microsoft/playwright#7297, closed out-of-scope). This gate is the ONLY evidence Firefox
       first paint has ever had. **Clean.**
    3. **Shell/reader coherence + the theme-pill occlusion eyeball at ~414 px** — no half-themed screen, and
       the text under the fixed pill stays legible (the M3 defect-#6 "visual occlusion is gate-only" class).
    4. **TOC carry-over end-to-end** — collapse the rail, drag a width, **RELOAD**, both come back, and the
       remembered state is GLOBAL across the two surfaces. This exercises the real
       `messagingPort → background → IndexedDB` path, which **no test has ever run** (the browser project
       loads no unpacked extension; every suite injects a fake sink through the production seam).
    5. **Theme cycle + persistence + the no-flip property** — Auto/Light/Dark apply live, survive a real
       reload, and an OS flip re-themes **only under Auto**.
    6. **The trust surface** — "Stored data" shows the settings row; **wipe** clears it and the reader falls
       back to **Auto**.
    7. **Zero unexpected network throughout; clean console; the document stayed the hero.**
  - **THE GATE STATISTIC, STATED PRECISELY SO IT IS NOT MISREAD.** The running **6/6** figure means **SIX
    milestone-shipping defects, ALL of them caught by this gate**, across **M1 + M2 + M3**. **M4 contributes
    ZERO defects and ZERO misses**, so the ratio still reads **6/6** — the denominator did not move because
    nothing shipped past the gate to move it. **M4 is therefore the FIRST milestone whose gate found
    nothing.** *That is a question FOR THE RETRO, deliberately NOT answered here: did the red-first /
    mutation-proof discipline this milestone genuinely catch these classes earlier, or was M4 a quieter
    surface and this one lucky? The retro decides. Do not read a clean gate as evidence the gate has stopped
    being load-bearing.*
  - **THE THREE ITEMS DEFERRED INTO 8.1 BY GROUPS 6–7 ARE NOW DISCHARGED** — a future session should not
    treat any of them as open: (1) **Firefox first paint** (7.1's Chromium-only scope caveat); (2) the
    **end-to-end TOC carry-over** through the real messaging→background→IndexedDB path (6.1's harness
    limit); (3) the **narrow-viewport theme-pill occlusion eyeball** (6.1's carried 5.1 question). All three
    were walked and all three passed.

Full close details in Done (2026-07-17); the settled TOC architecture + sizes/perf in decisions.md 2026-07-17.

**M2 (spec 002 — active-source foundation) remains fully closed** (code + the named human gate, both engines;
task 6.3 PASSED 2026-07-15 — see Done). Nothing on 002 outstanding.

---

## Task / session log · newest first · M1 → M3 close + the 004 planning gates
*The `## Done` list as it stood at the M4 close, verbatim. Covers M1 (spec 001 — core render pipeline,
closed 2026-07-14), M2 (spec 002 — active-source foundation, closed 2026-07-15), M3 (spec 003 — TOC /
navigation, closed 2026-07-17), and the spec-004 gate-1/gate-2 approvals.*

- 2026-07-17 — **Spec 004 plan APPROVED (Gear-3 gate 2) + tasks DRAFTED (gate-3 artifact).** `plan.md` landed
  (the HOW — the `settings` store schema + `DB_VERSION` 1→2, the `SettingsPort` message seam, the theme-runtime
  + host-registry rewrite with the `isConnected` liveness guard, the MEASURE-then-mitigate flash approach, the
  test strategy); `tasks.md` drafted — **8 dependency-ordered groups**, each task with its own real-engine /
  red-first or measured Verify line + the standing golden-EMPTY / `manifest.test.ts`-green pins, awaiting a
  separate human gate before any implementation code. **D-1 = A: sepia DEFERRED from 004** — `design/tokens.css`
  defines only 4 of ~15 sepia tokens, so completing the palette is a brand/design decision, not an
  implementation fill; 004 ships **auto/light/dark** + persistence + TOC carry-over. Spec §3.5/§4/§6 amended
  (f4e11f5); full detail in decisions.md 2026-07-17 + `specs/004-themes-settings/plan.md` §0 D-1.
- 2026-07-17 — **Spec 004 (themes + settings) gate-1 approved & landed.** Gear-3 gate 1 passed 2026-07-17;
  `specs/004-themes-settings/spec.md` written (the WHAT — no tech). Next → plan.md (the HOW), Gear-3 gate 2, for
  a separate human gate before any implementation code. Persistence-path direction recorded in decisions.md
  2026-07-17 (settings persist WITHOUT a new manifest permission — `permissions:[]` kept; sync deferred).
- 2026-07-17 — **Tasks 6.2 + 6.3: M3 CLOSED (spec 003 — TOC / navigation) — code-complete AND human-gated.**
  The **6.2 milestone-close human gate PASSED, both engines, both surfaces.** A human walked the full spec-003
  checklist in **Chrome + Firefox on the current build, Network tab open**, on the content-script full-page
  `file://` doc AND the app-page reader pane: multi-heading doc → **TOC appears** (≥2 headings) → click an
  entry **scrolls to the section** → scroll → **active entry tracks** (scroll-spy) → **collapse/expand** →
  **resize** the sidebar → **backtick toggle** → **smooth** scroll normally, **instant** under an OS
  reduced-motion setting → a **no-heading** doc and a **pathological-heading** doc each show a designed state,
  **never blank** → the (b) **no-raw-flash on the 1 MB doc** ground truth from 5.2 confirmed. **Zero unexpected
  network throughout, no console errors, the document stayed the hero.** The single 003 acceptance an agent
  cannot self-certify — now met. It caught **1 real defect** the green stack missed: the TOC rail rendered
  TRANSPARENT (text bled through) and the reading column reserved no room for it (underlap) — a **NEW
  "visual occlusion is gate-only" defect class** (geometry/behavior tests measure a transparent element
  perfectly; opacity/z-order is human-eye-only). Fixed pre-close (348eb67: opaque rail + column reservation +
  a real-engine occlusion test that now covers the part an engine CAN read); the root lesson is captured in the
  retro (2026-07-17). Running human-gate score: **6/6** milestone-shipping defects caught across M1+M2+M3.
  **What shipped (one implementation, both surfaces, via the single `mount()` seam):** an in-reader right-side
  TOC rail. Pure `buildTocModel(root)` (h1–h6 refs in doc order, nearest-strictly-shallower-ancestor nesting —
  no synthetic nodes, designed fallback labels, verbatim duplicates) + `buildTocView(host, model, {contained})`
  (`nav` landmark + nested `<ol>`, disclosure-`aria-expanded` collapse, `≥2`-heading threshold-omit,
  `textContent`-only labels, each button carrying its exact `entry.headingRef` via a module-level `WeakMap`).
  Click/Enter scrolls by element ref (`scrollIntoView`, no `behavior` arg → CSS governs); a host-rooted
  scroll-spy (observer + rAF-coalesced scroll, LIVE `getBoundingClientRect`, per-surface root) marks the
  section in view (`aria-current="location"` + `.is-active`); backtick (`` ` ``) toggle via a module host
  registry (distinct from readerMode's `\`, prunes dead nodes, requires a live rail); pointer-drag resize of
  `--toc-w` (per-view). `permissions:[]` intact; zero network on every TOC action. **Measured (group 5):**
  content script **284,744 B** (+13,865 B / +5.12% vs the deliberately-spent M2 270,879 B baseline),
  byte-identical Chromium/Firefox; `pnpm zip` **323.63 kB Chrome / 323.69 kB Firefox, both < 2 MB**. First-paint
  re-run (5.2): **(a) ≤50 KB nav→paint 133.5 ms < 150 ms; (b) 1 MB = the ~1400-entry pathological TOC
  1196.3 ms < 1.7 s** — no regression. `perf:toc` (5.1): rail build ~45 ms @1401 headings, scroll-spy
  ~4.4 ms/frame @1401 — recorded, no threshold asserted (M1 retro rule). **Suites at close:** `pnpm test`
  **350 unit** · `pnpm test:browser` **166** both engines · golden diff **EMPTY** · huge-doc
  `sha256=8bc5094c…e61bbd` intact · `permissions:[]` pinned · lint clean. Carried gaps each have a recorded
  home in decisions.md (contained-surface reduced-motion 2026-07-16 · `\`-app-page inert 2026-07-17 · TOC-tree
  virtualization lever 2026-07-17 — CARRIED, not forced). **M3 (spec 003) is fully closed; next → spec 004
  (themes + settings).**
- 2026-07-15 — **Task 6.3: human milestone-close gate PASSED, both engines — M2 FULLY CLOSED.** A human
  walked the full spec-002 checklist in **Chrome + Firefox on the current build, Network tab open**:
  toolbar action opens the app page (no console errors) · Chromium folder open (picker **and** drag)
  renders a tree contained in the folder pane and **drag-drop opens rather than navigating** · Firefox
  pick/drop renders the read-only snapshot + honest platform-limitation note · browse tree · search
  narrows by name · open files (unchanged reader) · pin · **reload → recents/pins persist → one-gesture
  reopen → exactly one disk re-prompt after reload → folder re-renders** · the **"Stored data"** panel
  shows remembered folders (name-only)/recents/pins + "contents never stored", and **wipe-all** clears
  hub + panel to "Nothing stored". Confirmed: **zero unexpected network throughout, no console errors,
  every degraded/empty state renders.** This is the single spec-002 acceptance an agent cannot
  self-certify — now met. It caught 3 real M2 defects the green stack missed across the milestone
  (containment · drag-navigation · storage-UI gap), so it stays load-bearing (retro 2026-07-15).
  **M2 (spec 002) is fully closed (code + human gate); next → spec 003 (TOC / navigation).**
- 2026-07-15 — **Task 6.2: folder-tree perf MEASURED (no threshold asserted — retro rule).**
  `scripts/perf-folder-tree.ts` (`pnpm perf:folder [--scale N]`) times the REAL production
  folder-mode hot path — the bounded markdown walk (`walkMarkdown`) + pure tree build
  (`buildTree`) + name filter (`filterTree`) — over a **realistic nested repo** (deep docs/
  guides tree + a mostly-non-markdown src/ tree + node_modules/.git skip-dirs), not a flat list.
  Machine: i7-13700, Windows, tsx/node; 7 iterations, cold run discarded, median of warm 6.
  - **scale 1 (mid-size project — 786 md files, 482 dirs, depth 10; 1773 total files, node_modules
    markdown correctly excluded):** walk **median 2.18 ms** (1.87–2.69), build **median 4.53 ms**
    (3.85–5.79), filter **median 0.12 ms**. truncated=false.
  - **scale 3 (monorepo — 304,122 markdown files EXIST everywhere; walk stops at the 5000-file
    cap, truncated=true, 2063 dirs):** walk **median ~8.5 ms**, build **median ~30 ms**, filter
    ~0.5 ms. The hard cap holds and stays fast even against a pathological tree.
  - **Finding:** the pure walk+build+filter — the "open my project" cost BEFORE any DOM — is
    CHEAP (~7 ms typical, ~40 ms at the hard cap). As the plan flagged, the suspect for the
    **carried-M1 chunked/virtualized-render lever** is `treeView` laying out one DOM node per
    file+dir (~1268 nodes at scale 1, ~7000 at the cap), NOT the pure build — compare M1's
    real-browser evidence (~750 ms to lay out ~1400 reader nodes). **NOT measured here** (Task-0
    automatability limit, no stub-as-proof): the real-browser treeView render/layout to first
    interactive tree + the disk reopen round-trip — the production app page has no
    headless-drivable folder-open seam (native picker). Those are confirmed qualitatively at the
    human gate (6.3); the chunked-render decision is **deferred to a real-browser render
    measurement** (a separate seam from the eager walk), now informed by the measured cheap half.
    **No acceptance threshold asserted** (M1 retro: no un-measured gate).
- 2026-07-15 — **Group-4 follow-up: wired the drag-and-drop folder target.** Investigation found
  the app page had NO drop wiring — `folderSourceFromDataTransfer`/`webkitGetAsEntry` existed and
  was unit-tested but unreachable from any UI path, so a dropped folder fell through to the
  browser's default navigate-to-folder action (the Firefox manual-gate screenshot). Fix: a drop
  target on the shell root (`dragenter`/`dragover`/`drop` all `preventDefault` — dragover so a drop
  fires, drop FIRST so the browser doesn't navigate). New seam `openFolderFromDrop` branches per
  capability: Chromium (`getAsFileSystemHandle` + picker supported) → LIVE handle (`persistable`,
  NOT downgraded to snapshot); Firefox → read-only Entries snapshot. Injected `dropToOutcome` dep;
  drop funnels through the SAME `applyOutcome` as the CTA (chip/tree/snapshot-note/never-blank —
  no duplication). Synchronous-extraction invariant preserved + commented (items only live during
  the drop event). Tests: +9 unit (routing in `folderSource.test.ts`, DOM wiring in
  `appShell.test.ts`), +5 real-engine (`tests/browser/folderDrop.browser.test.ts`, ×2 engines).
  **RED→GREEN (real Chromium + Firefox):** with the drop listeners disabled, the two wiring tests
  (dragover/drop `defaultPrevented`; full read→render) FAILED `expected false to be true` on BOTH
  engines (4 failed / 6 passed — the direct `openFolderFromDrop` routing tests still passed); with
  the listeners restored, 10/10 passed. NOTE: a synthetic `dispatchEvent` never triggers a real
  browser's default navigation in ANY engine, so "the browser really did not navigate" stays a
  human-gate item (manual note); the real engine proves the handler owns the real DragEvent + the
  real Entries/File.text()/mount path. Render path byte-identical (content script 270,879 B),
  `permissions:[]` pin green, lint + 285 unit + 122 browser green.
- 2026-07-14 — **M1 CLOSED (spec 001 — core render pipeline).** Extension skeleton + reader
  pipeline (detect → hide-raw → mount → parse → markdown-it/GFM → DOMPurify → shadow-DOM themed
  reading → Raw toggle → block-remote-media → never-blank fallback) shipping on Chrome + Firefox,
  `permissions:[]`, ~270 KB packed. All 7 acceptance criteria verified green with per-item evidence
  (manual GUI gate both engines + tests + measured perf + zip < 2 MB + PERMISSIONS.md complete);
  lint · 160 unit · 66 browser green. Retro captured (docs/ai/retro.md). Carried to M2: chunked/
  virtualized render (large-doc first-paint lever) + GFM table-alignment restore. Now → M2.
- 2026-07-14 — Fixed a pre-opt-in remote-image FETCH LEAK in the remote-resource policy
  (shipped in the commit below, caught at the human Network-tab gate, NOT by any test). Root
  cause: `mount()` built the reader root with `document.createElement('div')` + `root.innerHTML =
  html` — that div is owned by the live (browsing-context) document, so both Blink and Gecko
  dispatched the remote `<img>` fetches AT the innerHTML line, upstream of `applyMediaPolicy`, and
  synchronous removal can't cancel an in-flight request. The "detached node doesn't fetch"
  assumption was false; the safe property is an INERT document with no browsing context. Fix:
  parse the sanitized HTML into a `<template>` (`.content` is inert), run `applyMediaPolicy` on
  that fragment, then `root.append(tpl.content)` and commit as before — no fetch-capable node ever
  materializes in a fetching document pre-opt-in. **This class of bug (bytes-on-wire) is invisible
  to jsdom** (loads no subresources): the existing NO-LEAK + ORDERING tests stayed green through
  the whole leak because it fires upstream of the DOM-shape checkpoints they inspect. New guard in
  the browser project — `tests/browser/remoteMedia.browser.test.ts` asserts on the Resource Timing
  buffer in real Chromium + Firefox: zero image requests before opt-in, requests DO fire after Load
  (didn't over-correct). Proven RED-first (3 leaked requests both engines) → GREEN post-fix. jsdom
  guards kept but commented down to DOM-shape-only; load-bearing comments in mount.ts + mediaPolicy.ts
  corrected (inert document, not detached subtree). golden `images.html` byte-identical; 160 unit +
  66 browser green, lint clean; content 270.51 → 270.58 kB, zip 152.96 → 152.99 kB; image-free 1 MB
  perf flat (median ~1388 ms, within the noisy ~1187–1449 ms band). Standing rule recorded: remote-
  media/zero-network guards live in the browser project henceforth. See decisions.md 2026-07-14
  (correction of record). Manual re-check still owed by the human (Chrome + Firefox, Network tab).
- 2026-07-14 — Remote-resource policy (last M1 feature). Filled the `applyMediaPolicy` seam with
  the block-by-default policy (AGENTS.md #1 made visible + demoable). New modules:
  `src/render/mediaPolicy.ts` (classify/neutralize/restore) + `src/render/remoteMediaUi.ts` (opt-in
  pill + network indicator); styles in `readerCss.ts` (tokens only). Per `<img>`, classified by the
  scheme it RESOLVES to vs `document.baseURI`: http/https (incl. protocol-relative) → BLOCKED (URL →
  `data-peekover-src`, `<img>` → inert themed placeholder), `file:` on a file page → allowed +
  `loading="lazy"`, `data:`/`blob:` → inert. **The gotcha handled:** neutralization runs on the
  DETACHED reader root (no browsing context → no fetch) BEFORE `replaceChildren()` commits it live —
  a no-leak test commits the real pipeline to a live jsdom DOM and asserts zero fetchable src/srcset;
  proven non-vacuous RED-first (no-op the policy → 3 remote `IMG[src]` leak) then GREEN on restore.
  Opt-in is per PAGE-VIEW (`permissions:[]` = no storage → reload re-blocks): the "N remote images
  blocked · Load" pill restores real `<img loading="lazy">` and lights a persistent
  `data-network="active"` indicator that never shows otherwise. Raw view untouched. images.md golden
  regenerated through the full reader path (src → data-peekover-src + placeholder markup); huge-doc
  digest byte-identical (no images — verified). `pnpm perf` (default 1 MB) flat: (a) median 1242.5 ms,
  within the prior ~1187–1310 ms band (the image-free fixture is unaffected). 159 unit + 62 browser
  green, lint clean; content script 266.85 → 270.51 kB, zip 151.45 → 152.96 kB (well under budget).
  Manual Chrome+Firefox verification (devtools Network tab) is on the human checklist. See
  decisions.md 2026-07-14 (mechanics). tasks.md remote-resource task ticked.
- 2026-07-14 — Rescoped the first-paint gate from a size-sweep (measurement + docs only; ZERO
  `src/`+`entrypoints/` changes). The `<150 ms on the 1 MB fixture` line was written pre-measurement
  and is unreachable in the settled design (browser parse floor on a 1 MB `file://` doc + the
  complete-source-before-mount requirement + ~750 ms to lay out the reader's own ~1400-section DOM —
  see decisions.md 2026-07-14). Parameterized `pnpm perf` with `--size` (`pnpm perf -- --size 50kb`;
  default = the 1400-section 1 MB fixture, byte-identical to the golden digest — proven: golden suite
  green, `sha256=8bc5094c…e61bbd` unchanged). Swept sizes, same protocol (7 runs, cold discarded,
  median of warm 6, two invocations each; 1 MB re-confirmed twice). Machine: i7-13700, Windows,
  headless chromium via Playwright. **(a) navigationStart → reader painted:**

  | fixture (target → actual) | sections | inv 1 median | inv 2 median | <150 ms |
  |---|---|---|---|---|
  | 10 KB → 10.5 KB   | 13   | 81.6 ms   | 78.2 ms   | **PASS** |
  | 50 KB → 50.4 KB   | 62   | 117.8 ms  | 121.8 ms  | **PASS** |
  | 200 KB → 199.9 KB | 245  | 347.4 ms  | 344.8 ms  | FAIL |
  | 1 MB → 1.12 MB    | 1400 | 1310.3 ms | 1187.0 ms | FAIL (~8×) |

  ((b) responseEnd → paint tracked ~1–3 ms under (a) throughout; browser FCP is n/a for file:// text.)
  Gate rewritten (spec 001) as two-part and BOTH parts tick: (i) typical doc (≤50 KB) nav→paint median
  <150 ms — PASS; (ii) 1 MB: no raw-text flash (manual-verified both engines) + reader painted within an
  honest bound <1.7 s (~25–30% headroom over the ~1187–1310 ms median) — PASS. 200 KB (~345 ms) marks
  where a single-shot synchronous render starts to degrade, confirming ≤50 KB as the honest "typical"
  boundary. No threshold was softened to force a pass. Chunked/virtualized render deferred to M2 as the
  large-doc lever. No Now-pointer move — remote-resource policy is still next.
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
