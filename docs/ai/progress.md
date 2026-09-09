# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-09-06 (REVISIT-RECORD AMENDMENT, doc-only, same session-day as 1.1 — folds four findings
from 1.1's own measurement into this file's revisit framing so a future spec-revisit session inherits them
rather than rediscovers them: a fourth, architecturally-distinct revisit path (KaTeX `output: 'mathml'`,
§ Up next), a lean toward reverting the three installed-but-unused dependencies (§ Up next), a FALSIFIED
milestone invariant — `@mdit/plugin-tex` puts math on the content-script module graph, which `tasks.md`'s
own standing invariants say never happens (§ Carried items) — and the `@mdit/plugin-tex`/`markdown-it`
peer-dependency mismatch restated as a latent correctness risk, not just a version warning (§ Carried
items). No sealed artifact (`spec.md`/`plan.md`/`tasks.md` body) is edited; this is NOT task 2.1 and not a
new milestone task — M11 stays SUSPENDED. All figures cited from `tasks.md`'s own committed 1.1 RESULT
block; nothing is re-measured. Prior entry, kept for context:
M11 task 1.1 IS DONE, this session — RULING 1 SETTLED as BRANCH (C): even KaTeX-only
busts the current byte headroom (1,361,716 B measured vs. ~352.8/352.7 KiB headroom, ~3.8×over), MathJax
independently busts headroom AND fails `pnpm audit --prod` (2 HIGH, via `@mathjax/src`'s `mj-context-menu`
sub-tree). M11 GROUPS 2–9 ARE SUSPENDED — this is the milestone's LAST commit until a human-reviewed spec
revisit. See `specs/011-math-rendering/tasks.md`'s 1.1 own RESULT block for the full decomposition. Prior
entry, kept for context:
M11 `tasks.md` APPROVED at GATE 3, same day — `decisions.md`'s M11 GATE 3 entry —
`specs/011-math-rendering/tasks.md`, 9 groups / 16 tasks (18 if group 7 opens), three gate-3 findings ruled
(the MathJax package name approved-as-candidate, the copy-as-MathML action's UI placement ruled
panel/menu-row with task 6.2's text corrected, RULING 4's task-7.2 pause confirmed no-action-needed). ALL
THREE M11 PLANNING GATES ARE NOW PASSED. IMPLEMENTATION IS AUTHORIZED — task 1.1 is next, in a FRESH
SESSION (C14); nothing is implemented yet. Prior entry, kept for context:
`plan.md` APPROVED at GATE 2, same day — `decisions.md`'s M11 GATE 2 entry.
Twelve D-values (D-1…D-12) are now SEALED as the architecture: D-1 a new markdown-it passthrough-marker
rule (`@mdit/plugin-tex` as the tokenizer, our own render rules on top — never a rule that renders math
itself); D-2 one single-importer engine module per engine (`mathEngine.ts`, contingently
`mathJaxEngine.ts`); D-3 the enhancer rides 007's own two-call-site wiring (`readerPane.ts:187`,
`appShell.ts:170`); D-4 KaTeX's `trust:false`/kept-default-`throwOnError` config lockdown; D-5 a third
named sanitizer profile (`sanitizeMath`) admitting KaTeX's HTML+MathML dual output plus a new `style`-value
procedural filter; D-6 copy-as-LaTeX/MathML at ZERO new dependencies (retained source text; clone-and-
serialize the already-embedded MathML tree); D-7 inline math INVERTS 007 D-15 — mutate-in-place, no
sibling, because inline content has no "beside"; D-8 block/fence math reuse 007's sibling-figure machinery
verbatim; D-9 a leaned-and-verify claim that math needs NO theme-re-render mechanism (KaTeX's CSS
inherits colour; unlike mermaid's baked-hex SVG); D-10 the MathJax contingency is a purely additive drop
point (dropping it deletes files, never unwinds KaTeX-groups' work); D-11 a MathJax settings field, if it
ships, is one more key on the existing global `Settings` row; D-12 no cache is designed speculatively —
group 8 measures render timing first. RULING 1 (§9-1, the dependency-set fork) stays MEASURED, not
assumed — task 1.1 is `tasks.md`'s own first, hard-gating task, unchanged from gate 1, now ALSO measuring
`@mdit/plugin-tex` alongside `katex`/MathJax (Group 1's gate-2 measurement fix — `@mdit/plugin-tex` is an
always-loaded parse-graph dependency, a guaranteed byte floor, unlike the two lazy render engines). **The
genuine gate-2-surfaced gap is RULED, not left open:** §8-1 (inline math's copy-as-LaTeX/MathML
reachability, since D-7's forced inversion means block math's hover/focus control-group mechanism cannot
serve inline math unmodified) is ruled OPTION (b) — inline copy-as-LaTeX via ordinary text-selection of
the retained source (zero new code), copy-as-MathML via a document-level "copy all formulas as MathML"
action, no per-formula inline chrome; block math's control group is unchanged. This amends spec §4's copy
criterion, recorded in `decisions.md`'s gate-2 entry (spec.md stays sealed, per the M7–M10 precedent). The
four gate-1 rulings remain INHERITED CLOSED throughout `plan.md` — none is re-opened by gate 2. `tasks.md`
is AUTHORIZED but does not exist yet — its own drafting is a fresh session (C14); no implementation code
has been written. Byte budget stays the milestone's central, front-loaded risk (§3.4): M10's own close
left `.output` headroom ~352.8/352.7 KiB, zip headroom ~607.8/607.7 KiB, the thinnest margin any gate has
opened against, unchanged since gate 1 because nothing has been installed yet.
Prior entry, kept for the record: task 11.3 landed — the records
reconcile that closes M10: the pointer walk repeated as a discrete step on this closing commit, the
retro's four browser-suite shared-cross-file-state facets confirmed consolidated into one drafted standing
rule (PLACED in `AGENTS.md`, 2026-09-06), and the pre-existing carried items reconfirmed untouched by M10.
M10 CLOSED, 2026-09-06. § Now's and § Up next's full M10 narrative moved verbatim to `progress-archive.md`
in this same commit, following the M6/M7/M8/M9 archive-pass precedent.)*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.
> **Order is deliberate: what to do (Now · Up next · Blockers) comes before what to know (Closed
> milestones · Baselines).**

## Now (start here)

**★ M11 TEMML-BUNDLING DEFECT SPIKE RUN, 2026-09-09 — OUT-OF-SEQUENCE, NOT TASK 6.2-R. ROUTED
CLOSE-M11-LEANING / FORK-LEVEL: NO CHEAP BUNDLER-CONFIG FIX SURVIVES FOR THE SHIPPED `.output`. NEXT:
the human/reviewer's call on whether 6.2-R resumes now (still under the open 1.2-R fork, defect
routed) or 1.2-R's fork is pulled forward. See `decisions.md`'s 2026-09-09 entry for the full record.**
6.1-R's own header (below) surfaced the corrupted-Temml-regex defect; the reviewer paused 6.2-R to spike
this BEFORE 1.2-R's own walk. Five cheap fixes were tried against the REAL fast repro (a Node `import()`
of the actually-built chunk, rendering `\alpha`/`\frac`/`\text`) — `esbuild.charset` both directions plus
`optimizeDeps.esbuildOptions.charset` (byte-identical rebuilt chunk both times: WXT's own Vite builder
unconditionally overwrites `config.esbuild.charset = "ascii"` after user config runs, so this knob never
reached whatever actually corrupts the chunk), `optimizeDeps.exclude: ['temml']` (FIXED the Vitest
browser-mode test path outright — confirmed both Chromium and Firefox — but zero effect on `pnpm build`'s
`.output`, since production `vite build` never consults `optimizeDeps`; NOT landed, since adopting it
would make the test suite stop exercising the actually-shipped bundled path, undoing the exact coverage
gap 6.1-R just closed), `build.minify: false` (content-script roughly doubled unminified, proving the
config was read — chunk still corrupted, so minification isn't the cause), `build.target: 'esnext'`
(byte-identical, no effect), and `build.rollupOptions.external: ['temml']` (removes the chunk instead of
fixing it — a bare `import('temml')` cannot resolve at runtime in an MV3 content script; not viable). All
five were fully reverted; `wxt.config.ts`/`vitest.config.ts` are back to their pre-spike committed
content, `.output` and the Vitest dep cache were cleared. A real fix (patching how Temml's own regex
embeds lone UTF-16 surrogates, or a dedicated Vite plugin) is bigger than "cheap config" and is explicitly
1.2-R's own fork territory — this spike does not attempt it. No `tasks.md` box ticked; no feature code; no
engine swap; no D-value touched.

**★ M11 TASK 6.1-R LANDED, 2026-09-09 — BLOCK MATH'S COPY CONTROL GROUP (D-6-R, §8-1),
`diagramView.ts`'s OWN §3.11 MECHANISM REUSED VERBATIM, UNDER THE OPEN 1.2-R FORK. ★ A LIKELY
MILESTONE-CRITICAL, PREVIOUSLY-UNDISCOVERED ESBUILD/TEMML BUNDLING DEFECT WAS SURFACED WHILE DRAFTING
THIS TASK'S OWN TESTS — SEE ITS OWN BLOCK BELOW, FLAGGED FOR 1.2-R's OWN FORK, NOT FIXED HERE. NEXT:
TASK 6.2-R (inline's copy actions; the document-level copy-all-as-MathML action).**
**★★ THE BUNDLING DEFECT, READ THIS BEFORE 1.2-R's OWN WALK.** `markMathRendered`'s own control-group
tests needed a macro-based LaTeX fixture (`\alpha`, `\text{...}`) to prove copy-as-LaTeX reads the
RETAINED SOURCE rather than the rendered tree. Every such fixture threw `Unsupported function name:
\a`/`\t` — not a fixture-drafting mistake (confirmed three independent ways: Vitest's own dependency
pre-bundle of `temml`, reproduced even after `rm -rf node_modules/.vite`; the IDENTICAL corrupted byte
pattern grepped directly out of the ACTUAL SHIPPED `.output/chrome-mv3/chunks/temml-*.js`; and a plain
Node `import()` of that exact pre-bundled file, outside any browser). Root cause: esbuild's dependency
bundling (used by both Vitest's optimizer and this project's own WXT/Vite/Rollup production build)
corrupts `temml`'s `Lexer.js`-derived astral-surrogate-pair regex alternative
(`[\uD800-\uDBFF][\uDC00-\uDFFF]`) — the lone-surrogate escapes cannot survive as standalone Unicode
scalars and get replaced with literal U+FFFD characters, turning a narrow "one astral character" match
into an enormous `0x30`-`0xFFFD` range that now intercepts the backslash and the FIRST letter of every
LaTeX control word before the real control-word alternative gets a chance — so Temml throws on `\alpha`,
`\text`, `\frac`, essentially any named macro. Every EXISTING real-browser math test only ever used bare
arithmetic (`x^2`, `y^2`, `z^2`) or a deliberately-malformed fixture, so this was invisible until now.
**`tasks.md`'s own 1.2-R (the human fidelity walk judging REVISIT-RULING 2's bar) is still `[ ]`
UNCHECKED, and its own "dense representative formula corpus" explicitly includes fractions/radicals/
Greek letters — i.e. macros — so that walk is very likely to hit this defect in the ACTUAL SHIPPED
BUILD once it reaches any macro-based formula.** Not investigated further or fixed here (diagnosing/
patching esbuild's own dependency bundling of `temml` is well outside 6.1-R's own Files line) — the full
technical trace lives in `tests/browser/mathActions.browser.test.ts`'s own header comment. This is
handed to whoever runs 1.2-R's own fork next as the first thing to know before starting the walk.
**THE CONTROL GROUP ITSELF.** `mathView.ts`'s `markMathRendered` now builds (or re-attaches, on a
second call to the SAME figure) a `mathControlsOf(figure) ?? buildMathControls(figure)` control group —
byte-for-byte the same reuse shape `diagramView.ts`'s own `markDiagramRendered` uses for diagrams. Two
real `<button>`s (`role="group"` container, `role="status"` live region, `hidden` while silent):
copy-as-LaTeX resolves the figure's sibling `<pre>` at ACTIVATION TIME (row 14) and copies its retained
source text byte-identical (a small peel-function duplicate of `mathEnhancer.ts`'s own `mathSourceOf`,
kept local to avoid a `mathView`<->`mathEnhancer` import cycle); copy-as-MathML clones and serializes
the figure's OWN live `<math>` root via `XMLSerializer` — D-6-R's own SIMPLIFICATION from the original
two-output design, since Temml produces exactly one tree. Zero new dependencies. No CSS was added
(`mathCss.ts` is outside this task's Files line and none of rows 11/14/16/20 mandate a specific visual
treatment) — the two buttons ship visible-by-default rather than hover-revealed; a deliberate, stated
scope decision, not an oversight.
**THE BLOCK/INLINE ANNOTATION RECONCILIATION — DECIDED HERE.** 4.3-R/5.1-R flagged that block's own
failure marker (`markMathFailed`) carried only visible text, while inline's own (`markMathInlineFailed`)
also carries `title` + a machine-readable attribute, satisfying §3.5 row 15 more literally. Since this
task already owns `mathView.ts`, and the fix is small/mechanical/visually inert, it was DECIDED HERE
rather than routed a third time: `markMathFailed` now sets the SAME `title` + `MATH_INLINE_FAILED_ATTR`
pair on the still-visible `<pre>`. The constant keeps its "INLINE"-named identifier (renaming would
ripple into `mathDegrade.browser.test.ts`, outside this task's Files line) — only its shared VALUE
matters for row 15, now satisfied identically by both engines' failure UI.
**BYTES — CS UNMOVED (EXACT MATCH, md5-IDENTICAL), APP-PAGE +2,971 B BOTH ENGINES, HEADROOM STILL
POSITIVE.** A-B rebuild (stash/rebuild/measure, pop/rebuild/measure — both engines): content-script
**340,492 B**, md5 `bcdcf231…` Cr / `49e218a1…` Fx — UNMOVED, exact match to 3.2-R's own floor;
`grep -c temml` on both built content scripts: **0**. `.output` **5,195,178 B Cr / 5,195,294 B Fx** —
**+2,971 B both engines** over 5.1-R's own figure (5,192,207 / 5,192,323), the control-group glue
landing on the already-loaded app-page graph (no new lazy chunk). Headroom: 5,242,880 − 5,195,178 =
**47,702 B (46.6 KiB) Cr**; 5,242,880 − 5,195,294 = **47,586 B (46.5 KiB) Fx** — positive, down ~2.9 KB
from 5.1-R's own ~49.5/49.4 KiB. Manifest **654 / 770 B**, `permissions: []`, no `contextMenus`, no
`web_accessible_resources` — unmoved, re-proven by a real-clipboard-exercised browser test reading the
BUILT manifests directly.
**STANDING INVARIANTS.** `pnpm lint` EXIT=0; `tsc --noEmit` clean. Full `pnpm test` (unit): **1145/1145
passed, ALL GREEN, byte-for-byte the same 66 files/1145 tests as 5.1-R's own close** (this task added
zero unit tests — all new coverage is `tests/browser/mathActions.browser.test.ts`, per its sealed Files
line). Full `pnpm test:browser` (Cr+Fx), against the freshly rebuilt `.output`: **164 files, 1625
passed, 15 pre-existing skips (unchanged), ALL GREEN** (162 at 5.1-R's close + this task's one new file
× 2 engines; 13 new tests × 2). `git diff tests/golden/output/` EMPTY; `mount.ts` untouched;
`codeDetect`/007/009/M11 import fences: 42/42 standalone, unaffected. See
`specs/011-math-rendering/tasks.md` task 6.1-R's own RESULT block for the full writeup. Prior entry,
kept for context:

**★ M11 TASK 5.1-R LANDED, 2026-09-09 — INLINE MATH'S D-7-R MUTATE-IN-PLACE INVERSION, THE
PERSISTENCE PROPERTY PROVEN RED-FIRST BOTH ENGINES, ALL THREE §3.9 PATHS DEGRADED WITH INLINE'S OWN
TEXT+ARIA ANNOTATION SHAPE, UNDER THE OPEN 1.2-R FORK. GROUP 5-R IS NOW FULLY DISCHARGED. NEXT: GROUP
6-R (copy-as-LaTeX/MathML, tasks 6.1-R/6.2-R).**
**THE MECHANISM.** `mathEnhancer.ts`'s private render body was generalized to handle BOTH block/fence
pairs and inline markers from ONE `loadMathEngine` call per `enhanceMath` invocation (D-3-R's single
call site, never two engine loads). Inline markers get NO synchronous structure (no figure, no
wrapper) — only `MATH_STATE_ATTR='pending'` set directly on the `<code class="peekover-math-inline">`
element itself, which is what makes a second, concurrent `enhanceMath` call idempotent (proven both
engines). On success, `markMathInlineRendered` `replaceChildren`s the SAME element with the sanitized
`<math>` tree; on any §3.9 failure, `markMathInlineFailed` leaves the literal `$…$` content
completely untouched and adds an in-place `title` + `data-math-failed` annotation — never a sibling.
**★ THE PERSISTENCE PROPERTY, RED-FIRST, BOTH ENGINES.** A genuine ablation (`markMathInlineRendered`
rewritten to build a NEW element and `replaceWith` it) was run and reverted: the persistence test went
RED on both engines, naming the exact missing anchor (`Object.is` reference-identity failure, plus an
expando `Symbol` that did not survive) — the concrete, non-vacuous discharge of D-7-R's own named
control.
**THE THREE §3.9 PATHS, INLINE, REAL TEMML, BOTH ENGINES.** `mathDegrade.browser.test.ts` gained three
new arms (D/E/F, additive to 4.3-R's own A/B/C for block/fence): engine-load failure (document-wide,
both inline formulas fail identically, content untouched, no sibling); per-marker render failure
(isolated, the well-formed sibling still renders); sanitize rejection (the latest-moment failure,
`instrumentedMath` corrupting one real render while the sibling's real output stays untouched). Per
AGENTS.md's citation rule, the state-machine-level claims cite arms A/B/C as already-earned; what is
genuinely new and gets its own fresh proof is the CONTENT-UNTOUCHED + IN-PLACE-ANNOTATION shape itself
— block's own degrade path (drop the placeholder, add a sibling paragraph) is the opposite shape.
**★ ROW 15's D REQUIREMENT — SATISFIED FOR INLINE, RE-CONFIRMING AND ROUTING 4.3-R's OWN FLAG.**
`markMathInlineFailed` carries BOTH `title` (native tooltip) AND `data-math-failed` (machine-readable)
— this genuinely satisfies §3.5 row 15's own "text+aria, never colour alone" language more literally
than block's own `markMathFailed`, which 4.3-R's own RESULT found carries NEITHER. **This is a real,
now twice-confirmed inconsistency between the two engines' own failure UI**, not resolved here (out of
this task's Files scope) — restated as a CARRIED ITEM for 6.1-R or 8.1-R's milestone-close walk to
reconcile, whichever lands first.
**ROW 11 — A DRAFTING-TIME FINDING, FIXED.** A first draft of the "no control group" negative
assertion used an absolute zero-buttons-in-the-shadow count and went red — not a defect in
`enhanceMath`, but a wrong assumption: the app-page reader pane's own pre-existing chrome (the
diff-compare pill, export controls) already carries buttons unrelated to math. Fixed to a DELTA-based
assertion (counts captured before enhancement, asserted unchanged after) plus a scoped check (no
button inside the marker or its immediate parent).
**BYTES — CS UNMOVED (EXACT MATCH), APP-PAGE +621 B BOTH ENGINES, HEADROOM STILL COMFORTABLE.** Fresh
`rm -rf .output` rebuilds both engines, before AND after this task's diff: content-script **340,492
B**, md5 `bcdcf231…` Cr / `49e218a1…` Fx — unmoved, exact match to 3.2-R's own floor (inline reuses
the same app-page-only call site; no new content-script reach). `.output` **5,192,207 B Cr / 5,192,323
B Fx** — **+621 B both engines** over 4.3-R's own figure (5,191,586 / 5,191,702), eager glue only — no
new lazy chunk, since inline reuses `mathEngine.ts`/`mathCss.ts`/`mathFont.ts` verbatim. Headroom
**50,673 B (49.5 KiB) Cr / 50,557 B (49.4 KiB) Fx — positive**, down only ~620 B from 4.3-R's own
~50.1/50.0 KiB. Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources` — unmoved.
**STANDING INVARIANTS.** `pnpm lint` EXIT=0; `tsc --noEmit` clean. Full `pnpm test` (unit):
**1145/1145 passed, ALL GREEN, byte-for-byte the same 66 files/1145 tests as 4.3-R's own close** (this
task added zero unit tests — all new coverage is `tests/browser/*`, per its own sealed Files line).
Full `pnpm test:browser` (Cr+Fx): **1597/1612 passed, 15 pre-existing skips, ALL GREEN, NO FLAKES this
run** (162 files — 160 at 4.3-R's close + `mathInline.browser.test.ts` × 2 engines; 26 new tests —
7×2 + the 3 new degrade arms' 6×2). `git diff tests/golden/output/` EMPTY. `codeDetect`/007/009/M11
import fences: 42/42 standalone. See `specs/011-math-rendering/tasks.md` task 5.1-R's own RESULT block
for the full writeup. Prior entry, kept for context:

**★ M11 TASK 4.3-R LANDED, 2026-09-07 — ZERO OFF-ORIGIN NETWORK PROVEN OVER THE REAL BLOCK/FENCE MATH
PATH WITH A FONT-SPECIFIC FIRING CONTROL (§3.7'S NAMED TRAP), ALL THREE §3.9 DEGRADATION PATHS PROVEN
REAL-ENGINE BOTH BROWSERS, UNDER THE OPEN 1.2-R FORK. GROUP 4-R IS NOW FULLY DISCHARGED. NEXT: TASK 5.1-R
(inline math's own enhancer/view half, D-7-R's mutate-in-place inversion).**
**★ A DIVERGENCE FROM THE KICKOFF, FLAGGED RATHER THAN SILENTLY FOLLOWED**: reading the already-landed
4.2-R source found all three §3.9 degradation paths already implemented as code in `mathEnhancer.ts`
(D-8-R's own "reuse 007's sibling-figure machinery verbatim" — a byte-for-byte structural port of
`diagramEnhancer.ts`'s own try/catch shape, already exercised end-to-end with a fake engine by
`mathEnhancer.test.ts`, 4.2-R). This task's real job — and the sealed `tasks.md` Files line's own
literal text, which names only `mathEngine.ts`, `mathNetwork.browser.test.ts`, and `mathDegrade.browser
.test.ts` — was the BROWSER-LEVEL, REAL-TEMML proof those paths hold, which jsdom+fake-engine structurally
cannot reach. `mathEngine.ts` gained a doc-comment addition only (additive, zero behavioural change,
confirmed by a byte-identical rebuild before/after).
**RED-FIRST, DISCHARGED BY CITATION FOR THE SHARED MECHANISM, EARNED FRESH FOR WHAT IS GENUINELY NEW** —
AGENTS.md's own ablation rule: a test extension mirroring an already-established pattern's shape cites
that pattern's own original ablation as standing precedent rather than re-earning a fresh one.
`diagramDegrade.browser.test.ts`'s "6.1" block and `diagramRender.browser.test.ts`'s render-failure/
sanitize-rejection arms are cited for the STATE-MACHINE-LEVEL claims (document-wide uniformity, per-fence
isolation, latest-moment sanitize rejection); what got its OWN fresh, non-vacuous proof: a genuinely
malformed, unterminated `\frac{a}{` thrown by the real installed `temml` (arm B), and `instrumentedMath()`
(porting `diagramRender.browser.test.ts`'s own `instrumented({ svg })` technique to Temml) wrapping the
REAL `loadMathEngine()`/`renderToString` and corrupting only the returned string for one formula while its
sibling's real output stays untouched (arm C) — the engine's genuine success captured in a `raw[]` array
before the corruption made the string unrecognisable to `sanitizeMath`. Every arm's own RED-FIRST CONTROL
is a FIXTURE-LEVEL ablation (the rejecting loader omitted; the identity-transform wrapper), each actually
run in this commit, not merely asserted.
**THE ZERO-NETWORK GUARD + THE FONT-SPECIFIC FIRING CONTROL §3.7 NAMES.** `mathNetwork.browser.test.ts`,
Cr+Fx: a fresh render through the real production path reads zero OFF-ORIGIN resource-timing entries, with
three non-vacuity axes (a real `<math>` root adopted; real same-origin traffic crossed the wire; the STIX
Two Math subset itself was fetched, by its committed asset name, and resolved same-origin). The firing
control constructs a live `FontFace` with an OFF-ORIGIN `url()` source (the loopback-cross-origin technique
`diagramNetwork.browser.test.ts`'s own TIER 2 established) and `document.fonts.add()`s it — the EXACT
mechanism `mathFont.ts`'s `registerMathFont()` uses, no production module touched — proving the same
off-origin predicate genuinely catches the request §3.7 names. A genuine source-level ablation (swapping
`mathFont.ts`'s bundled-asset import for a hardcoded remote URL, rebuilding) was also run by hand while
drafting this file: it turned the real-path arm red; reverted before commit, narrated rather than shipped,
since nothing in the suite can rebuild the extension mid-run. **A drafting-time finding, fixed before
commit**: `registerMathFont()`'s idempotent flag meant only the file's FIRST math render ever puts the font
on the wire — Firefox served a second `FontFace` construction from its in-process font cache without a
second Resource Timing entry even after `resetMathFontForTest()` — fixed by reading the font's own URL out
of the guaranteed-cold first render instead.
**ONE DIVERGENCE IN THE DEGRADATION SHAPE, FLAGGED**: the kickoff's §3.5 row 15 framing expected an
`aria`/`title` failure annotation; the LANDED `markMathFailed` (D-8-R's "carries unchanged" from
`markDiagramFailed`) carries neither — only a visible TEXT marker paragraph, the same mechanism
`diagramView.ts`'s own precedent uses. This task's tests assert what actually landed.
**BYTES — UNMOVED, EXACT MATCH, BOTH ENGINES.** Fresh `rm -rf .output` rebuilds before AND after this
task's one doc-comment addition: content-script **340,492 B**, md5 `bcdcf231…` Cr / `49e218a1…` Fx —
unmoved, exact match to 3.2-R's own floor. `.output` **5,191,586 B Cr / 5,191,702 B Fx** — unmoved, exact
match to 4.2-R's own figure. Headroom **51,294 B (50.1 KiB) Cr / 51,178 B (50.0 KiB) Fx**, unchanged.
Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources` — unmoved. `pnpm lint` EXIT=0;
full `pnpm test` **1145/1145 passed, ALL GREEN, byte-for-byte the same 66 files/1145 tests as 4.2-R's own
close** (this task added no unit tests). Full `pnpm test:browser` **1571/1586 passed, 15 pre-existing
skips, ALL GREEN, NO FLAKES this run** (160 files — 156 at 4.2-R's close + this task's two new files × 2
engines; 18 new tests — `mathNetwork.browser.test.ts`'s 3 × 2 + `mathDegrade.browser.test.ts`'s 6 × 2).
`git diff tests/golden/output/` EMPTY; `codeDetect`/007/009/M11 import fences confirmed unaffected inside
the same full `pnpm test` pass (this task touches no parse/render path and no import graph). See
`specs/011-math-rendering/tasks.md` task 4.3-R's own RESULT block for the full writeup. Prior entry, kept
for context:

**★ M11 TASK 4.2-R LANDED, 2026-09-07 — BLOCK/FENCE MATH ENHANCER + VIEW, THE STIX TWO MATH FONT SHIPPED
FOR REAL, UNDER THE OPEN 1.2-R FORK. ★ A REAL CONTENT-SCRIPT BYTE LEAK WAS INTRODUCED BY THIS TASK'S OWN
FIRST ATTEMPT AND CAUGHT/FIXED BEFORE LANDING — CS BYTES ARE EXACT-MATCH UNMOVED (340,492 B, md5-identical
to 3.2-R's floor). D-9-R'S THEME-INHERITANCE LEAN CONFIRMED WITH A FIRING CONTROL; INPUT A DISCHARGED FOR
REAL WITH A CORRECTED (NON-VACUOUS) NEGATIVE CONTROL. NEXT: TASK 4.3-R (the zero-network guard for the
bundled font; block math's §3.9 degradation paths).**
`enhanceMath(host)` wired immediately after `enhanceDiagrams(host)` at both call sites — `readerPane.ts:187`
/`appShell.ts:170`, RE-VERIFIED, no drift from plan (h)'s own R-0. `src/render/mathEnhancer.ts` (block half)
+ `src/render/mathView.ts` (block half) reuse 007 D-15's sibling-figure state machine, stripped of what
D-12-R/D-9-R say this milestone does not need yet (no cache, no theme-re-render subscription, no per-render
engine config — Temml is stateless). `mathSourceOf` peels `$$…$$` for dollar-block origin only, confirmed
against the exact golden-fixture shape (a trailing `\n` survives inside the delimiters).
**★ THE FONT MECHANISM — D-13'S SEALED `readerCss.ts`/`@font-face` TEXT WAS STALE (1.1-R's own flagged
correction, now applied for real): `document.fonts.add(new FontFace(...))` via a NEW module,
`src/theme/mathFont.ts`, and Temml's OWN shipped `Temml-STIX2.css`, machine-adapted (license/rule comments
stripped, selectors scoped under `.peekover-reader`, `font-family` retargeted, the equation-numbering
counter re-scoped from `body` to `.peekover-reader` — a third adaptation beyond the 1.2-R harness's own two,
since this shadow tree has no `<body>`). Font asset URL-loaded (not `?inline`), taking the byte-forecast
spike's own ~28.8 KiB lever; WAR re-verified absent on the real shipping wiring.
**★ THE TASK'S OWN CENTRAL FINDING: A REAL CS-BYTE LEAK, CAUGHT AND FIXED IN THIS SAME COMMIT.** A first,
literal attempt followed D-13's own sealed Files line and appended the adapted stylesheet into the SHARED
`readerCss.ts`/`READER_CSS` — a fresh rebuild immediately showed content-script bytes moving 340,492 →
348,778 B (+8,286 B), because `READER_CSS` is injected unconditionally by `mount.ts` on BOTH the
content-script and app-page graphs; a CSS string baked into an always-loaded module cannot be tree-shaken
the way `enhanceMath`'s dynamic `import('temml')` can. Fixed structurally: the adapted stylesheet + figure
shell moved into a new, separate module (`src/theme/mathCss.ts`), injected as a SECOND `<style>` element by
`mathEnhancer.ts` itself (app-page-only reachable) via `ensureMathStyle()` — never folded into the shared
sheet. Rebuilt clean: content-script restored to **340,492 B, md5 `bcdcf231…` Cr / `49e218a1…` Fx — EXACT
match to 3.2-R's own floor**, `grep -c temml` on both bundles returns 0. This is a live instance of 4.1-R's
own §2-named hazard, caught by the very re-verification that section demanded.
**INPUT A — DISCHARGED FOR REAL, WITH A METHODOLOGICAL CORRECTION.** Drafting the real-engine proof found,
empirically on BOTH engines, that `document.fonts.check()` reads `true` even for a family name NOTHING ever
registered (the API reports "nothing pending," not "this family exists") — a vacuous negative control,
caught before it shipped. Replaced with a `canvas.measureText()` glyph-advance DIFFERENTIAL for U+2211 (∑)
between our registered family and a nonexistent one: if the font were silently unapplied both would read the
same fallback metric; they read genuinely different, both engines.
**D-9-R — THE LEAN CONFIRMED, WITH A FIRING CONTROL.** A single rendered formula's computed `color`,
measured at light/dark/sepia via three `setThemeSetting` calls with NO re-render, resolves to each theme's
own `--ink` token and all three are pairwise distinct — native MathML really does paint via ordinary CSS
`color` inheritance. Firing control: a hardcoded-colour `<style>` ablation makes the same flip read identical
colours both times, proving the un-ablated assertion is a genuine instrument. Temml's own error UI (a
hardcoded `errorColor`-styled node) is confirmed unreachable — a malformed formula produces only our own
`.peekover-math-error` marker, zero `.temml-error` nodes anywhere.
**D-8-R's shared-shape claim proven twice** (fake-engine `mathEnhancer.test.ts`, real-engine
`mathBlock.browser.test.ts`): `$$…$$` and a ` ```math ` fence render to structurally identical figures, real
`<math>` trees diffed byte-for-byte in the browser suite. `mathImportFence.test.ts` gained the graph-shaped
clause-A/B/D reachability fence its own 4.1-R header named this task to add (6→11 tests): the content-script
graph reaches neither math module and imports no `temml`; the app-page graph (the control) reaches both and
does.
**Bytes: CS unmoved (exact match); app-page +301,262 B both engines** over 4.1-R's own figure — decomposed
as the `temml` chunk (204,010 B, unchanged), the URL-loaded font asset (86,224 B), and ≈11,028 B of
enhancer/view/font-registration glue plus the adapted stylesheet (a real cost the milestone's own
byte-forecast spike did not model, stated as a genuine gap). `.output` **5,191,586 B Cr / 5,191,702 B Fx** —
headroom **51,294 B (50.1 KiB) Cr / 51,178 B (50.0 KiB) Fx, POSITIVE, comfortable** against the 5 MiB
ceiling. Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources` — unmoved. `pnpm lint`
EXIT=0; full `pnpm test` **1145/1145 passed, ALL GREEN** (67 files — 21 new in `mathEnhancer.test.ts`, 3 new
in `mathFont.test.ts`, 5 new in `mathImportFence.test.ts`); full `pnpm test:browser` **1553/1568 passed, 15
pre-existing skips, ALL GREEN** (156 files, incl. the new `mathBlock.browser.test.ts`'s 7 cases × 2 engines).
Two isolated, non-reproducing timing flakes (`tocScroll.browser.test.ts`, `diagramActions.browser.test.ts`,
both Firefox) surfaced across repeated full-suite runs while verifying this task and were confirmed
harness-shared-state per AGENTS.md's own standing rule, not a regression — neither touches math, neither
persisted on an isolated re-run, and `tocScroll.browser.test.ts` passed clean on an unmodified HEAD via
`git stash` in this same session. `git diff tests/golden/output/` EMPTY; `codeDetect` 14/14 standalone;
007/009/M11 import fences 28/28 standalone. See `specs/011-math-rendering/tasks.md` task 4.2-R's own RESULT
block for the full byte decomposition and every finding. Prior entry, kept for context:

**★ M11 TASK 4.1-R LANDED, 2026-09-07 — `mathEngine.ts`, THE ONE `import('temml')`, UNDER THE OPEN 1.2-R
FORK. THE D-4-R CONFIG LOCKDOWN RE-DERIVED FIELD-BY-FIELD AGAINST REAL INSTALLED TEMML SOURCE (`trust`/
`throwOnError`/`annotate`, `output` correctly VACATED). ★ CONTENT-SCRIPT AND APP-PAGE BYTES BOTH UNMOVED —
`mathEngine.ts` HAS NO CALL SITE ON EITHER GRAPH YET (4.2-R/5.1-R). NEXT: TASK 4.2-R (block/fence math
enhancer + view; the bundled STIX Two Math font shipped for real).**
No render path or golden fixture changes — this task is scaffolding only. `hasMathMarker`/`loadMathEngine`
mirror `diagramEngine.ts`'s `hasDiagramFence`/`loadDiagramEngine` exactly, gated on 3.2-R's own landed marker
selectors (`code.peekover-math-inline`, `pre > code.language-math`). The lockdown: `throwOnError: true` is
the load-bearing field — `temml.js`'s own `renderError` re-throws unconditionally under it, so a formula's
failure can never reach Temml's own `<span class="temml-error">` UI; `trust: false` (Settings.js's own
default, pinned explicitly) is proven load-bearing with a genuine ABLATION (`\class{…}{…}` throws under the
pin, succeeds when `trust` is flipped `true` in the test only); `annotate: false` is a field ADDED beyond the
KaTeX-era D-4's three-field shape, cited to 2.1-R's own `sanitize.test.ts:967-969` forward-pointer rather
than invented, guarding D-5-R's own "no `<semantics>`/`<annotation>`" sanitizer assumption from a future
Temml default flip. `output` is correctly ABSENT (D-4-R's own VACATE — Temml has no such option).
**`mathImportFence.test.ts` genuinely diverges from `diagramImportFence.test.ts`/`codeImportFence.test.ts`'s
own entry-graph-walk shape**: both precedents landed AFTER their engine had a real call site; `mathEngine.ts`
has none yet, so a graph walk from either entry point reaches it by no edge and a reachability-shaped control
would prove nothing. Built instead as a whole-shipped-tree specifier scan (`check-dynamic-imports.ts`'s own
`collectFiles` discipline), which while being ported off `diagramImportFence.test.ts`'s own `blankComments`
surfaced a real gap in that shared helper (it does not track string-literal spans, so import-shaped TEXT
inside a string false-positives) — fixed by porting `check-dynamic-imports.ts`'s own `maskComments`/
`insideString` span-tracking instead of weakening the test. **Bytes: both graphs UNMOVED, each firing control
surfacing a real finding.** Content-script: 340,492 B both engines unmoved (3.2-R's own floor); the firing
control (a scratch static import into the content script, reverted) found the ~204 KB temml chunk gets
INLINED directly into the content-script bundle rather than staying a separate lazy file — content scripts
build as one file, no code-splitting. App-page: `.output` 4,890,324 B Cr / 4,890,440 B Fx unmoved — **the
task's own sealed Verify text ("against 2.1-R's own figure") is stale**, since 3.2-R already moved app-page
bytes (shared `parse.ts`); the correct baseline is 3.2-R's own landed figure, which this measures against. A
naive first firing-control attempt (`void <unused reference>`) moved only +54 B noise — the minifier
eliminates a bare unused reference before the bundler's own import-usage analysis runs, dead-coding the whole
subgraph; corrected with a runtime-window-flag-guarded CALL (2.1-R's own scratch-probe discipline), which
moved +204,352 B both engines, decomposed as 204,010 B (the lazy `temml-*.js` chunk — an exact independent
reproduction of 1.1-R's own isolated-chunk figure) + 342 B eager glue. Both scratch edits reverted; a final
fresh rebuild confirmed byte- and md5-identical restoration on both graphs. Manifest 654/770 B,
`permissions: []` unmoved. `pnpm lint` EXIT=0; full `pnpm test` **1116/1116 passed, ALL GREEN** (64 files —
17 new: 11 in `mathEngine.test.ts`, 6 in `mathImportFence.test.ts`). `codeDetect` (14/14 standalone) and the
007/009 import fences (17/17 standalone) confirmed unaffected. See `specs/011-math-rendering/tasks.md` task
4.1-R's own RESULT block for the full field-by-field config justification and both firing-control writeups.
Prior entry, kept for context:

**★ M11 TASK 3.2-R LANDED, 2026-09-07 — `parse.ts` GAINS THE RESOLVED TOKENIZER + PASSTHROUGH MARKERS
(D-1-R, D-7-R, D-8-R), UNDER THE OPEN 1.2-R FORK. GOLDEN GREW BY EXACTLY ONE FIXTURE. INPUT B'S FLOOR
LANDED — WITH A MEASURED, EXPLAINED GAP FROM THE SEALED "EXACTLY THE FLOOR" TEXT. ★ NEW CONTENT-SCRIPT
BASELINE FOR EVERY TASK FROM 4.1-R ON: 340,492 B BOTH ENGINES (md5 `bcdcf231…` Cr / `49e218a1…` Fx) —
NEVER 336,123 B ALONE AGAIN.**
The §2 drafting-time defect 3.1-R surfaced (a ` ```math ` fence is routed by markdown-it's OWN `fence`
token, not `math_block`) is fixed via candidate (a): an explicit `renderer.rules['fence']` wrap, installed
AFTER the existing 009 `data-fence-meta` override and captured as its fallback — a math-info fence gets the
SAME `<pre><code class="language-math">` shape `$$…$$` block math gets, content UNPEELED (no `$$` added);
every other fence delegates to the SAME 009 function reference, unchanged. Candidate (b) — the plugin's
own `render` option as a uniform marker surface for all three token kinds — was ruled OUT, not merely
unchosen: its `(content, displayMode, env)` signature cannot distinguish a fence-origin call from a
dollar-block-origin call, and D-8-R's own sealed text requires the `$$`-peel for dollar-origin ONLY, an
asymmetry (b) has no way to honor. Direct regression-guard tests (not just Golden's own silence) confirm a
` ```js ` and a ` ```mermaid ` fence render BYTE-IDENTICAL to their pre-task pinned strings. The new golden
fixture (`tests/golden/fixtures/math.md`) pins all three marker shapes — inline, `$$`-block, and the
math-fence's UNPEELED form — plus the negative controls (a code-span `$HOME`, a bare `$5` price, both
staying literal); `git diff tests/golden/output/` shows exactly the one new file, every pre-existing
snapshot byte-identical (3.1-R's own oracle, discharged). **CS bytes — the floor landed for real** (isolated
scratch re-probe: 336,123 → 340,099 B, **+3,976 B**, a further +17 B drift past 1.1-R's own +3,959 B
figure) **but the REAL landed delta is +4,369 B, not +3,976 B alone** — decomposed as the +3,976 B floor
plus **+393 B** of this task's own necessary marker-emission/fence-wrap render logic, confirmed NOT a leak
(zero `temml` occurrences grepped directly from the built content-script bundle; no other file beyond
`parse.ts`/`parse.test.ts`/the new fixture pair changed). This is flagged as a genuine, measured gap from
the sealed Verify text's literal "EXACTLY... by NOTHING ELSE" wording — the kickoff itself anticipated
this ("flag if it differs from +3,959"). App-page `.output` total **+8,739 B** both engines, decomposing to
the same +4,369 B tax landing independently on both graphs (parse.ts is shared), +4,370 B app-page-only.
Manifest **654/770 B**, `permissions: []` — unmoved. `codeDetect`'s corpus (n=28, 8/20 split) is UNAFFECTED
— its scanner is confirmed in-scope for `tests/golden/fixtures/**` but only counts EMPTY-info fences, and
the new fixture's fence has info `"math"`, non-empty, so it never enters the corpus. `pnpm lint` EXIT=0;
full `pnpm test` **1099/1099 passed, ALL GREEN** (62 files). See
`specs/011-math-rendering/tasks.md` task 3.2-R's own RESULT block for the full byte decomposition, the
fence-fix justification, and every classified golden hunk. Prior entry, kept for context:

**★ M11 TASK 3.1-R LANDED, 2026-09-07 — THE GOLDEN-FIXTURE AUDIT, RE-ENTERED, READ-ONLY, UNDER THE OPEN
1.2-R FORK. NEXT: TASK 3.2-R (`parse.ts` gains the resolved tokenizer + passthrough render rules) — WITH
A CONCRETE DRAFTING-TIME CORRECTION IT MUST APPLY, NOT JUST ITS OWN STATED PLAN.** Every file under
`tests/golden/**` was grepped for a literal `$`: **zero matches, all eleven fixtures plus the generated
~1 MB huge-doc** (its `${i}` occurrences are `hugeDoc.ts`'s own JS template-literal syntax, confirmed by
reading the generator — its emitted MARKDOWN TEXT carries no literal `$` byte). The existing golden corpus
therefore carries **zero false-positive/false-negative risk** from the new tokenizer — a real, verified null
result, not a skipped audit. The recognition grammar was instead verified empirically, fresh, against the
REAL installed `@mdit/plugin-tex@1.1.0` + `markdown-it@14.3.0` (a scratch `.mjs` script at the repo root,
reverted before commit): §7-5's own named risk (code-span exclusion) CONFIRMED both directions by rendered
output (`` `echo $HOME` ``/`` `code $notmath` `` never match; genuine math immediately adjacent to a code
span on either side still resolves correctly) — the `backticks` rule consumes its span's interior as one
token before the math rule can ever see a `$` inside it, a structural non-issue regardless of the two rules'
relative ruler position (`math_inline_dollar` registers between `escape` and `backticks`, `math_block_dollar`
after `blockquote`/`fence`, printed directly from `md.inline.ruler.__rules__`/`md.block.ruler.__rules__`).
`$5`/`$10` prices (incl. a two-dollar-sign same-line case), escaped `\$5`, a `$5` table cell, and an
unbalanced lone `$` all confirmed literal, zero misclassifications — matching 1.1-R's own 51-formula-corpus
result, now independently re-confirmed rather than inherited across the suspend/reopen boundary. **★ A
concrete, verified drafting-time defect surfaced, not merely a caution**: `md.parse()`'s own token stream
shows a ` ```math ` fence produces a `fence` token (`info: 'math'`), NOT a `math_block` token — the plugin
owns THREE renderer keys (`fence`, `math_inline`, `math_block`); overriding only `math_inline`/`math_block`
(3.2-R's own literal stated plan) leaves the fence path routed through the plugin's own untouched `fence`
override, which still calls whatever throwaway `render` stub 4.1-R-style wiring supplies — a scratch
reproduction proved the ` ```math ` fence renders as the literal stub string under exactly 3.2-R's own
stated approach. 3.2-R must either wrap `renderer.rules['fence']` (route `info==='math'` through the same
marker logic as `math_block`, else delegate to default fence rendering) or make the plugin's own `render`
OPTION the single marker-emitting surface for all three token kinds — named as the two candidate fixes, not
resolved here (read-only task). **The behavioral cousin priced, as its own line, per the gate-2-revisit
ruling (INPUT B)**: once 3.2-R lands, a math span on a `file://` document renders as inert monospace `<code>`
on the content-script reader (`enhanceMath` never runs there, D-3-R/§9-2 re-confirmed by reading `mount.ts`'s
own call sites) — a real, visible departure from spec §3.2's "no math affordance" framing, not fixable
without new cross-surface coupling `parse.ts`'s current single-instance/app-page-only discipline lacks;
flagged for 8.1-R's milestone-close walk, not resolved here. Zero `src/` file touched; `pnpm lint` EXIT=0;
full `pnpm test` **1085/1085 passed, ALL GREEN** (`codeDetect.test.ts`'s guardrail already re-pinned at HEAD
`45d4e76`, n=28/8-20/28-28, unaffected by this task's own zero-diff-to-scanned-files scope). Bytes stated,
not re-measured (no build ran): content-script **336,123 B** both engines, `.output` **4,881,585 B Cr /
4,881,701 B Fx**, manifest **654 / 770 B**, `permissions: []` — 2.1-R's own last-confirmed figures, unmoved.
Golden `git diff tests/golden/output/` EMPTY. See `specs/011-math-rendering/tasks.md` task 3.1-R's own
RESULT block for the full enumeration and the empirical probe's complete case list. Prior entry, kept for
context:

**★ M11 TASK 2.1-R LANDED, 2026-09-07 — THE MathML-ONLY SANITIZER PROFILE (D-5-R), UNDER THE OPEN
1.2-R FORK. NEXT: TASK 3.1-R (the golden-fixture audit).** `SANITIZE_MATH_CONFIG`/`sanitizeMath`/
`MATH_ALLOWED_TAGS`/`MATH_ALLOWED_ATTR`/`hasDeniedMathStyleToken` landed in `src/render/sanitize.ts`
(additive only), enumerated against 97 real `temml@0.13.5` renders — 24 tags, 25 attrs — not carried
forward from D-5's KaTeX-derived hypothesis. `cleanMathStyle`'s open question resolved: `style` IS
present (the byte-forecast spike's own 10-formula probe had already found this; this task confirmed it
at full-corpus scale), so a filter was built (`hasDeniedMathStyleToken`, an ident-boundary-aware
`url(`/`expression(` scan, scoped as a hook around `sanitizeMath` the way `cssPassHook` scopes around
`sanitizeSvg`). Two genuine divergences from the sealed plan text, both measured not carried forward:
(1) D-5-R's own "every tag Temml emits is a MathML tag" holds ALMOST, not entirely — `\begin{align}`'s
equation-numbering hook emits one real HTML `<span class="tml-eqn">` nested inside the MathML tree,
admitted as the one named exception; (2) D-5-R's inherited "structurally impossible" framing for
source-controlled `style` values does NOT fully hold — `\color`/`\textcolor`/`\colorbox`/`\fcolorbox`
are NOT `trust`-gated and DO let LaTeX source reach a `style` value's text, though `validateColor`'s own
regex bars every character a `url(`/`expression(` token would need, so no real producer can trip the new
filter — `hasDeniedMathStyleToken` is real defense-in-depth for that gap, not decoration. Hostile corpus
neutralised (disallowed element, hostile `<annotation>`, bare `<a>`, attempted `href`/`src`, `style`
carrying `url(`/`expression(`, a false-positive boundary check, a no-hook control proving the style
filter is genuinely hook-load-bearing — unlike the SVG profile's own allow-list-driven `data:` denial).
Zero-strip proven on all 97 real renders (byte-identical, modulo a `&nbsp;`-entity serialization
non-issue). Document + SVG profiles' consts pinned byte-identical (the SVG pin didn't exist until this
task added it). Bytes: content-script **336,123 B** and `.output` **4,881,585 B Cr / 4,881,701 B Fx** —
UNMOVED, both axes, both engines (this task's own code tree-shakes to zero until group 4-R wires it in;
a scratch firing control proved the tree-shaking is real, not an unbuilt no-op: +1,188 B when force-
referenced, reverted before commit). Manifest **654 / 770 B**, `permissions: []`. Full `pnpm test`:
1082/1085 — the SAME 3 pre-existing `codeDetect` failures as HEAD `21e8488` (confirmed via `git stash`
before/after this task's diff; NOT caused by this task, but the actual numbers have drifted since
`tasks.md`'s own header text and this task's kickoff — both still read the stale "exactly 3, not 4+"
framing without the real corpus-size/split numbers, flagged for whoever next re-pins that header).
Golden EMPTY. See `specs/011-math-rendering/tasks.md` task 2.1-R's own RESULT block for the full survey
findings. Prior entry, kept for context:

**★ M11 1.2-R'S FIDELITY HARNESS STAGED, 2026-09-07 — HUMAN PROCEED/CLOSE-M11 JUDGMENT STAYS
DEFERRED TO MILESTONE-CLOSE; GROUPS 2-R–8-R PROCEED CONDITIONALLY, UNDER THE OPEN 1.2-R FORK.** Corrects
this file's own stale prior pointer (which read "NEXT: TASK 1.2-R, HUMAN-RUN,
NO AGENT SUBSTITUTE" as if that task were next up standalone) to reflect `decisions.md`'s
2026-09-07 "M11 1.2-R SEQUENCING DEVIATION" entry: 1.1-R's byte axis is discharged (fits, ~33 KiB
`.output` headroom both engines), the byte-forecast spike below rules groups 2-R–8-R COMFORTABLE
(~26–27 KiB projected end-of-milestone headroom, plus a real-measured ~29 KiB URL-font reserve) —
but 1.2-R's OTHER axis, the human real-Chrome+Firefox visual-fidelity walk against REVISIT-RULING
2's readable-on-both bar, is HUMAN-RUN, NO AGENT SUBSTITUTE, and the human is batching all hands-on
testing to the milestone-close walk (task 8.1-R) by preference. **Task 1.2-R's box stays `[ ]`; the
PROCEED/CLOSE-M11 fork stays FORMALLY OPEN.** This session built 1.2-R's own AGENT-PREPARABLE half:
a durable, both-engine-loadable fidelity harness at `harness/math-fidelity/index.html` — a
self-contained `file://` page (no build step; open directly in Chrome and in Firefox) that renders
a 48-formula dense corpus (matching 1.1-R's own class list: fractions, radicals, single/double/
triple/contour integrals, big-operators, all five matrix delimiter styles, nested stretchy
delimiters, nested sub/superscripts, full Greek, relations, set ops, `\nabla`/`\lim`/accents/
over-under-braces, all eight math-alphabet styles, named functions, arrows, digits — inline AND
block/display samples) through the REAL installed `temml`, into a `{mode:'open'}` shadow root
(mirroring D-3-R's own app-page context), with the committed STIX Two Math subset registered via
`document.fonts.add()` — task 1.1-R's own proven mechanism, not a shadow-root `@font-face`. The
harness reuses Temml's OWN shipped `Temml-STIX2.css` verbatim (adapted only to drop its broken
relative `@font-face` and retarget its `font-family` rule at the harness's own registered family) —
the real stylesheet Temml recommends, not an ad hoc replacement, so this evidence doesn't
under-represent what groups 4-R/8-R will actually need to ship. Every DOM insertion is routed
through DOMPurify (AGENTS.md #3, unconditional even for this harness's own author-controlled
corpus). Chromium AND Firefox screenshots (`harness/math-fidelity/screenshots/{chromium,firefox}.png`,
captured via `harness/math-fidelity/capture.ts`, real headless engines — matching this project's own
`vitest.config.ts` browser-project convention of treating headless Chromium/Firefox as "real
engine") are committed as staged evidence: **0 temml-error spans, 0 console errors, both engines** —
a fact, not a fidelity verdict; no PASS/readable-on-both judgment is rendered by this session, that
judgment is reserved for the human walk. **Groups 2-R onward are AUTHORIZED to proceed
CONDITIONALLY** per the banked deviation's own three conditions (every 2-R-onward commit states it
proceeds under the open fork; a CLOSE-M11 ruling at 8.1-R reverts all of it plus the temml/tokenizer/
font install in the same commit; the byte axis is not reopened by this deviation). **NEXT: task
2.1-R** (`SANITIZE_MATH_CONFIG`/`sanitizeMath`, D-5-R), the sanitizer profile enumerated against
REAL installed Temml output. Prior entry, kept for context:

**★ M11 BYTE-FORECAST SPIKE, 2026-09-07 (measurement-only, NOT task 1.2-R, NOT a fork decision) —
GROUPS 2-R THROUGH 8-R FORECAST AT ~7 KiB NET-NEW `.output`, BOTH ENGINES: COMFORTABLE.** Requested
between 1.1-R and 1.2-R to forecast the app-page byte cost of the remaining reopened groups before
1.2-R's own PROCEED/CLOSE-M11 fork spends the ~33 KiB `.output` headroom 1.1-R left. Fresh `rm -rf
.output` rebuild at HEAD `a70a556` re-confirmed 1.1-R's own baseline unchanged: `.output` 4,881,585 B
Cr / 4,881,701 B Fx, content-script 336,123 B both engines. A REALISTIC (not toy) scratch stand-in
was built for real, for every group with app-page code — `_scratchMathSanitize.ts` (2.1-R: a
MathML-only allow-list SIZED AGAINST REAL TEMML OUTPUT, probed this session on a 10-formula corpus —
20 tags / 14 attrs, extrapolated toward 1.1-R's own 51-formula scale to ~38 tags / 23 attrs; **a real
finding, not assumed: Temml's real output DOES carry a `style` attribute** — `display:block math;`,
padding/`math-depth` layout metrics, never `url(` — so `cleanMathStyle`'s open question resolves
"present, needs a value filter", the OPPOSITE of the scratch-optimistic "absent" branch this same
spike's own kickoff named as a possibility), `_scratchMathEngine.ts` (4.1-R single-importer +
config lockdown, 4.3-R's network-guard shape), `_scratchMathEnhancer.ts`+`_scratchMathView.ts`
(4.2-R's block half — D-8-R's sibling-figure state machine, modeled on `diagramEnhancer.ts`/
`diagramView.ts`'s own SHAPE but deliberately EXCLUDING their cache integration (D-12-R: no
speculative cache, group 7-R measures first) and their theme-re-render subscriber (D-9-R's lean:
math's CSS inherits colour, no re-render mechanism needed) — both real, cited exclusions, not
oversights), `_scratchMathInline.ts` (5.1-R's mutate-in-place half), `_scratchMathActions.ts` (6.1-R
block copy-as-LaTeX/MathML control group + 6.2-R's document-level "copy all as MathML" collector,
modeled on `diagramView.ts`'s control-group shape but excluding its PNG-raster/lightbox machinery,
which has no math equivalent). Wired into `appShell.ts`'s render path behind a never-true
`window.__PEEKOVER_SCRATCH_MATH_FORECAST__` flag (1.1-R's own scratch-probe technique) so the
bundler cannot prove the dynamic imports dead; Vite split each into its OWN chunk, which let the
decomposition read directly off real chunk sizes rather than a further ablation pass.
**MEASURED, ABLATED, BOTH ENGINES**: combined `.output` delta **+211,107 B**, identical Cr/Fx (Cr
5,092,692 B, Fx 5,092,808 B — the 116 B gap is the pre-existing Cr/Fx baseline gap, unchanged);
content-script **unmoved at 336,123 B both engines** (confirms groups 2-R/4-R/5-R/6-R stay
app-page-only, as D-3-R requires). A firing-control ablation (temml-alone via this session's own
call-site shape, group code disconnected) isolated the ALREADY-COUNTED temml floor at **+204,149 B**
(32 B off 1.1-R's own +204,117 B — an immaterial call-site-shape difference, not a new
non-linearity) — subtracting it gives the **NET-NEW groups-2-R–8-R cost: 6,958 B**, both engines (Fx
temml-alone ablation assumed identical to Cr's, per 1.1-R's own confirmed engine-parity pattern for
this exact chunk — not independently re-measured). Per-group decomposition, read directly off each
scratch module's own emitted chunk: **2-R** (sanitizeMath) 1,243 B; **4-R** (mathEngine, shared
between block+inline, 671 B + block enhancer/view combined 1,899 B) 2,570 B; **5-R** (inline half)
1,030 B; **6-R** (both copy actions) 1,579 B — sum 6,422 B, plus 536 B of chunk-manifest/wiring
overhead (five new dynamic-import boundaries), immaterial and in the same category 1.1-R's own 67–107
B non-linearities named. **7-R/8-R: ~0 src bytes** (measurement + docs), stated not fabricated — no
scratch module was needed or built for either. **PROJECTED END-OF-MILESTONE HEADROOM: 33,971 − 6,958
= 27,013 B (26.4 KiB) Cr; 33,855 − 6,958 = 26,897 B (26.3 KiB) Fx — POSITIVE, both engines.** Against
this spike's own COMFORTABLE/TIGHT/AT-RISK routing (>~15 KiB COMFORTABLE, <~15 KiB TIGHT, ~0/negative
AT RISK): **COMFORTABLE** by the stated threshold, ~11–12 KiB above it — but flagged with a caveat,
not smoothed over: this forecast's own sizing basis (a 10-formula sanitizer-corpus probe, not
1.1-R's full 51-formula one; a document-level menu-row host module not modeled, since its real UI
cost depends on wherever 6.2-R lands the row) could plausibly run 2–3× over this estimate without
crossing back into TIGHT territory (a tripled ~21 KiB net-new cost still leaves ~13 KiB Cr / ~13 KiB
Fx positive) — COMFORTABLE, but not by a margin so wide the fidelity walk should ignore bytes
entirely, per the original kickoff's own framing. **THE URL-FONT LEVER — REAL-MEASURED, NOT
ESTIMATED, AND ITS NAMED RISK IS CONTRADICTED.** A scratch non-`?inline` import of the SAME
committed `assets/fonts/stix-two-math-subset.woff2` (Vite then emits it as its own file with a
resolvable extension URL, `assets/stix-two-math-subset-*.woff2`) measured **+86,516 B `.output`**
total (86,224 B raw asset + 292 B glue), against the base64-inline form's already-measured +115,356
B — a **28,840 B (28.2 KiB) recovery**, matching this spike's own ~29 KB estimate almost exactly, now
measured rather than guessed. **The kickoff's own named WAR risk did NOT materialize**: the built
manifest after this scratch import shows `web_accessible_resources: null`, `permissions: []`
unmoved — an app-page-only reference to a same-origin (`chrome-extension://…`) bundled asset needs
no WAR key, the same same-origin reasoning 1.1-R's own INPUT A finding already established for the
`?inline` form, now confirmed for the URL-loaded form too (caveat: probed from an app-page-only call
site, matching D-3-R's own architecture — not tested from a content-script context, which would be a
different question). **ROUTED RECOMMENDATION FOR 1.2-R: COMFORTABLE** — walk 1.2-R's fidelity gate
without the byte axis forcing a scope decision; the URL-font lever stays banked as a low-cost,
real-measured ~28 KiB cushion (no dependency change, no WAR cost) worth taking at 4.2-R regardless of
how tight the walk leaves things, since it is strictly better than the current base64 form on every
measured axis. **GUARDRAILS HELD**: every scratch module (six `src/render/_scratchMath*.ts` +
`src/theme/_scratchMathFontUrl.ts`) and every `appShell.ts` wiring edit reverted before this commit —
`git status` after revert showed only this file; a clean rebuild post-revert re-confirmed the exact
4,881,585 B baseline, byte-for-byte. No dependency change. `tasks.md` untouched — this spike is not
in its task sequence and does not tick any box. `codeDetect.test.ts` confirmed still exactly 3
pre-existing failures after this edit, not 4. This is NOT task 1.2-R and does NOT decide
PROCEED/CLOSE-M11 — a decision input routed here for that fork, next. Prior entry, kept for context:

**★ M11 TASK 1.1-R LANDED, 2026-09-07 — TOKENIZER RETAINED, DEPS 9→8, FONT CHOSEN, BOTH BYTE-AXIS AND
INPUT A DISCHARGED; FITS ON A KNIFE EDGE (~33 KiB `.output` HEADROOM BOTH ENGINES). NEXT: TASK 1.2-R,
★ HUMAN-RUN, NO AGENT SUBSTITUTE.** `@mdit/plugin-tex` is CONFIRMED the resolved tokenizer (D-1-R) — both
real Temml-native markdown-it plugins found on npm couple `temml.renderToString()` synchronously into
`renderer.rules`, the exact parse-time-render pattern D-1 rejected; neither was adopted. `katex`/
`@mathjax/src` removed, `temml@0.13.5` installed for real; `dependencies` **9 → 8**. `pnpm audit --prod`
EXIT=0. **D-13's font family is CHOSEN, not deferred: STIX Two Math** — a 51-formula representative corpus
rendered through real `temml` needs 313 codepoints; STIX Two Math (sourced full-glyph-set from
`google/fonts`, NOT the fontsource npm package's own pre-subsetted "latin" file, which lacks nearly every
math codepoint) misses only a zero-width variation selector, while Noto Sans Math misses three real accent
glyphs (`\dot`/`\ddot`/`\bar`) — a clearly-superior-coverage finding. Subsetted to **86,224 B** WOFF2
(`fonttools pyftsubset`, MATH table + stretchy-variant closure verified intact), committed at
`assets/fonts/stix-two-math-subset.woff2`. **★ A real divergence from D-13's own sealed text, flagged, not
silently followed**: D-13 assumed a shadow-root `@font-face` wiring mechanism; this project's OWN existing
`fonts.ts` already documents a prior real finding that Chromium does not reliably apply `@font-face` inside
a shadow tree, and uses `document.fonts.add()` instead — THIS task adopted that already-proven mechanism
for the math font too (INPUT A's real-engine Chromium+Firefox test, with a negative control, proves it
resolves via `document.fonts.add()`); whoever lands D-13 for real at 4.2-R should carry that forward, not
the sealed `@font-face` framing. Byte decomposition (a) `temml` JS alone +204,117 B `.output` both engines,
CS unmoved; (b) the tokenizer's own always-loaded floor **+3,959 B** on EACH graph (this session's own
figure — 2 B off the original 1.1's +3,957 B, an incidental patch-version drift, THIS is the figure 3.2-R
must land against) — CS moves 336,123→340,082 B when landed; (c) the font's own bytes +115,356 B `.output`
both engines (base64-inline expansion), CS unmoved; (d) all combined **+327,324 B `.output` both engines**
(a 67 B non-linearity off the naive sum, immaterial), CS +3,959 B only (confirms (a)/(c) stay app-page-only
in combination). **FIT VERDICT: fits both engines, but only ~33.2/33.1 KiB `.output` headroom remains**
(down from ~352.8/352.7 KiB — ~90% spent), flagged plainly for 1.2-R's own fork to weigh alongside the
fidelity walk. `pnpm zip` headroom stays comfortable (~461.8/461.7 KiB). The font ASSET is committed here
per this task's own §7 disposition call; its CSS/registration wiring and INPUT A's own test are scratch,
reverted before commit (mirroring the original 1.1's `_scratchMathProbe` discipline) — built for real, using
`document.fonts.add()`, at 4.2-R. Golden EMPTY, manifest **654 / 770 B** `permissions: []` unmoved, lint
EXIT=0, full `pnpm test` 1053/1056 (the 3 pre-existing `codeDetect` corpus failures unchanged, not this
task's diff), 007/009 import fences 8/8+9/9 green, real-engine `pnpm test:browser` 4/4 for INPUT A. This
task does NOT decide PROCEED/CLOSE-M11 — 1.2-R's own two-axis fork, next, is what does. Full evidence:
`specs/011-math-rendering/tasks.md` task 1.1-R's own RESULT block. Prior entry, kept for context:

**★ M11 TASKS REVISIT DRAFTED, 2026-09-06 (reopened Temml/MathML decomposition, fidelity-spike-first
Group 1-R gate, group 7 struck), GATE-3-REVISIT APPROVED — THE LAST PLANNING GATE PASSED.**
`specs/011-math-rendering/tasks.md` gained a dated "## TASKS REVISIT — 2026-09-06" block, inserted after the
header and before the original §§1–9 (preserved below it, unedited, including task 1.1's own `[x]`/RESULT —
history, not overwritten). The block decomposes the gate-2-revisit-approved architecture
(`decisions.md`'s "M11 GATE 2 — REVISIT" entry, `f767261`) into EIGHT groups / FIFTEEN tasks (down from the
original nine groups/16-of-18 — group 7's MathJax tasks are removed entirely, not struck-in-place, and
group numbering collapses accordingly: the original group 8 becomes 7-R, group 9 becomes 8-R). **Group 1-R
is now TWO tasks, not one**: 1.1-R (CC byte-measurement — resolves the D-1-R tokenizer fork, reverts the
original 1.1's leftover `katex`/`@mathjax/src` installs, installs `temml` + the font, discharges INPUT A's
font-applies-in-shadow-root proof and INPUT B's exact tokenizer-floor figure) and 1.2-R (human-run,
no-agent-substitute real Chrome+Firefox fidelity walk, judged against REVISIT-RULING 2's bar) — together the
two-axis fork: PROCEED authorizes Group 2-R onward; CLOSE-M11 (either axis fails) reverts `temml`/tokenizer/
font in the SAME commit and suspends everything else, resolving the disposition question the original 1.1's
own branch (C) left open. **INPUT B's content-script invariant is rewritten as a delta assertion**: bytes
move by exactly the tokenizer's own always-loaded floor, landing once at task 3.2-R (not at Group 1-R's own
scratch spike) — every task before 3.2-R asserts md5-identity against **336,123 B** (this milestone's own
authoritative pre-math baseline, per the original 1.1's base-line-divergence finding, not the stale
334,858 B header figure), every task from 3.2-R on asserts against 3.2-R's own post-floor figure, never
against the pre-math baseline again. The golden-fixture audit (3.1-R) re-enters because the tokenizer
candidate itself was reopened by D-1-R, and prices the `$x$`-content-script behavioral cousin as a named
cost. D-13 (the bundled math font) ships for real at 4.2-R, its shadow-root `@font-face` application
already proven at 1.1-R. **No package installed, no render code, no build — a doc-only decomposition.**
`plan.md`/`spec.md`/`decisions.md` are untouched; a human reviewing this block against `plan.md`'s own PLAN
REVISIT block, and approving it, is the next event — implementation then resumes at task 1.1-R, in a fresh
session. Prior entry, kept for context:

**★ M11 PLAN REVISIT DRAFTED, 2026-09-06 (Temml/MathML D-value set, fidelity-spike-first group ordering),
GATE-2-REVISIT APPROVED (`decisions.md`'s "M11 GATE 2 — REVISIT" entry, `f767261`).** `specs/011-math-rendering/plan.md` gained a dated "## PLAN REVISIT —
2026-09-06" block, inserted right after the header and before the original §0 D-values (preserved below it,
unedited, per the spec's own reopen convention extended here). The block rebuilds the architecture around
the gate-1-revisit-approved MathML/Temml scope (`decisions.md`'s "M11 GATE 1 — REVISIT" entry, `2b70d94`):
**D-1-R** (tokenizer — `@mdit/plugin-tex` and a Temml-native equivalent named side by side, not pinned;
both carried plan-inputs — the falsified content-script-invariant cost and the markdown-it peer-dep risk —
priced explicitly on this D-value); **D-2-R** (one engine module, not two — MathJax's permanent strike
collapses D-2's own two-file contingency structure); **D-3-R** (app-page-only, the two call sites
RE-VERIFIED at this session's HEAD — `readerPane.ts:187`/`appShell.ts:170`, unchanged, no drift); **D-4-R**
(KaTeX's `trust`/`throwOnError` config re-derived, not ported, against real installed Temml — carried
plan-input (3); the `htmlAndMathml` output-mode pin explicitly VACATED, not contradicted, since MathML is
Temml's only output); **D-5-R** (sanitizer profile simplified to a single MathML-only vocabulary;
`cleanMathStyle`'s own need left an open question pending real Temml output); **D-6-R** (copy-as-MathML
simplified to cloning the one rendered tree, no dual-output choice); **D-7-R/D-8-R** (inline
mutate-in-place and block sibling-figure mechanisms CARRY UNCHANGED — only the swapped-in content changes
from KaTeX's dual tree to a single `<math>` tree); **D-9-R** (theme-inheritance lean carries, arguably
strengthened for native MathML, still verify-at-task-time); **D-10/D-11 VACATED permanently** (no
contingent second engine exists to need either); **D-12-R** (no speculative cache, measure first, carries
unchanged); **D-13, NEW** (one subsetted bundled OpenType MATH font as a required Chrome-fidelity asset —
Latin Modern Math / Noto Sans Math / STIX Two Math named, none chosen — the milestone's new central budget
line). **The group sequence supersedes §6**: Group 1 is now a MERGED fidelity-and-byte gate (Temml + font
byte measurement AND a real-engine Chrome+Firefox visual-fidelity walk over a dense corpus, judged against
REVISIT-RULING 2's readable-on-both bar) that must PASS on both axes before Groups 2-R onward are
authorized; failing either axis fires REVISIT-RULING 3's pre-stated CLOSE-M11 fallback. Group 7 (MathJax)
is STRUCK ENTIRELY, not merely left unopened. **No package installed, no render code, no build — a doc-only
architecture re-draft.** `tasks.md`/`decisions.md`/`spec.md` are untouched; the reopened `tasks.md` (the
ORDER) is the next artifact and the next gate, once a human approves this plan-revisit block. Prior entry,
kept for context:
M11 REOPENED — SPEC REVISIT DRAFTED, 2026-09-06 (MathML/Temml, fidelity-first contingent scope, a
close-M11 pre-stated fallback), GATE-1-REVISIT APPROVED (`decisions.md`'s "M11 GATE 1 — REVISIT" entry,
`2b70d94`). `specs/011-math-rendering/spec.md`
gained a dated "## REVISIT — 2026-09-06 (post task 1.1, branch (C))" block, the first structural post-gate
reopen of any spec.md in this project's history (`git log` over every prior `specs/*/spec.md` commit shows
only pre-gate-1 draft/harden/amend passes) — the original §1–§9 text is preserved below it, unedited, per
the M7–M10 sealed-section precedent extended to a reopen. The REVISIT reopens scope on browser-native
MathML output (Temml named as the candidate to verify, not installed), corrects the prior revisit-record
amendment's font framing (Firefox self-falls-back to a MathML font; **Chrome needs one bundled** — the
byte problem shifts from KaTeX's 1,072,948 B of fonts to one subsetted math font, fit and quality both
TBD), states the new central risk as a Chrome-MathML-fidelity-and-byte gate with a pre-stated
close-M11 fallback symmetric to the original KaTeX-only one, and strikes MathJax entirely (busts headroom
independently AND fails `pnpm audit --prod`, 2 HIGH). §9-1 is settled (superseded by the reopen); §9-2/§9-3
still hold (§9-3 simplifies to a MathML-only allow-list); §9-4 is vacated. The spec's status line reads
"draft (Gear-3 gate 1 — REVISIT — awaiting human approval before `plan.md` revisit)". **No package
installed, no render code, no build — a scope/doc edit only.** `plan.md`/`tasks.md`/`decisions.md` are
untouched; the reopened D-value rework (Temml, a MathML-only sanitizer profile, one bundled math font,
fidelity-spike-first task ordering) is the next gate's work. Prior entry, kept for context:
M11 TASK 1.1 IS DONE, 2026-09-06 — RULING 1 SETTLED AS BRANCH (C): NEITHER ENGINE SHIPS AT CURRENT
HEADROOM. M11 GROUPS 2–9 ARE SUSPENDED — THIS IS THE MILESTONE'S LAST COMMIT UNTIL A HUMAN-REVIEWED SPEC
REVISIT. `katex` ALONE, wired exactly as task 4.3 plans (`import('katex')` + `katex/dist/katex.min.css
?inline`), decomposes to 258,852 B JS (a new lazy chunk — does NOT dedupe with mermaid's own transitive
`katex ^0.16.45`, measured not assumed) + 29,916 B CSS text in the app chunk + **1,072,948 B of KaTeX's own
font assets** (59 files, all three formats — Vite's CSS pipeline copies every `url()` KaTeX's stylesheet
references once `?inline` resolves it) = **1,361,716 B total, ~3.8× the entire ~352.8/352.7 KiB `.output`
headroom, alone**, and pushes `pnpm zip` 338,083 B over the <2 MB bound, alone. The verified MathJax
package (`@mathjax/src@4.1.3` — see below, NOT `mathjax-full`) costs 1,339,852 B independently (no font
assets, all JS, dominated by its SVG-output module) and separately fails `pnpm audit --prod` (2 HIGH, via
its `mj-context-menu → rimraf → glob → minimatch → brace-expansion` sub-tree). Combined: 2,701,471 B.
`@mdit/plugin-tex`'s own always-loaded floor (D-1's tokenizer, unconditional on both content-script and
app-page graphs) is +3,957 B EACH (+7,914 B `.output` total) — real, but immaterial next to the engine
costs. **Finding 1 resolved by live registry check, not taken on faith: `mathjax-full` is
npm-DEPRECATED** ("Version 4 replaces this package with the scoped package @mathjax/src"), latest 3.2.2
from 2022-06-08, four+ years stale — `@mathjax/src@4.1.3` (Apache-2.0, native ESM, actively maintained,
last published 2026-07-03) is the verified, installed candidate instead, stated here per Finding 1's own
"never silently substitute without stating it" instruction. `dependencies` moved **6 → 9**
(`+@mathjax/src`, `+@mdit/plugin-tex`, `+katex`) — all three left installed, pending the human revisit's own
call on whether to keep or revert them (branch (C) is silent on this, unlike branch (B)'s explicit MathJax
revert; no keep-or-revert step was invented). Content-script bytes stayed md5-identical to HEAD throughout
every arm (RULING 2 holds structurally), confirmed with a firing control (a scratch static `import katex`
in the content-script moved CS bytes 336,123→595,331 B; reverted, restored exactly). **A citation
divergence, flagged not silently followed:** this session's fresh clean rebuild measured content-script
bytes at 336,123 B both engines, not the 334,858 B this repo's own standing-invariants text (`tasks.md`,
AGENTS.md) states — `.output`/zip totals match the stated frame exactly, so only the CS-specific prose
figure is stale (confirmed via `pnpm install --frozen-lockfile`: `node_modules` matches the committed
lockfile, ruling out drift); this session's 336,123 B is authoritative going forward, per AGENTS.md's own
"fresh clean build re-measures and is authoritative" framing. Full decomposition (all six ablation arms,
governed-install assertions, SBOM/audit/licence results, the two carried API-shape/peer-dependency notes
for task 3.2) is in `specs/011-math-rendering/tasks.md`'s own 1.1 RESULT block — read there, not
re-derived. **No further M11 task may proceed** until a human reviews this measurement and either revisits
`spec.md`'s scope (a subset/lazy-split font strategy, or scope reduction) or closes the milestone.
Prior entry, kept for context:
M11 `tasks.md` APPROVED at GATE 3, 2026-09-06 — `decisions.md`'s M11 GATE 3 entry —
`specs/011-math-rendering/tasks.md`, 9 groups / 16 tasks (18 if group 7's contingent MathJax group opens).
★ ALL THREE M11 PLANNING GATES ARE NOW PASSED (gate 1 spec, gate 2 plan, gate 3 tasks). IMPLEMENTATION IS
AUTHORIZED — task 1.1 onward, in a FRESH SESSION (C14).** `plan.md`'s own gate-2 approval (`decisions.md`'s
M11 GATE 2 entry, 2026-09-06) is unchanged — `tasks.md` decomposed it, reopening no D-value, and gate 3
approved that decomposition as M11's implementation plan. Task 1.1 (the byte-measurement hard gate settling
RULING 1) is `tasks.md`'s own first task, structured as an explicit three-way fork (KaTeX+MathJax ships /
KaTeX-only / suspended pending a spec revisit), unchanged in shape from gate 1's own framing, now also
measuring `@mdit/plugin-tex` per gate 2's own measurement fix. **The three gate-3 findings are RULED, not
left open:** (1) the concrete MathJax package name (`mathjax-full`) is APPROVED AS TASK 1.1'S CANDIDATE TO
VERIFY against the current registry, not pinned as a settled choice — task 1.1's own measurement may find a
lighter alternative fits better; (2) the document-level "copy all formulas as MathML" action's UI placement
(§8-1 ruled (b) names the mechanism, not where it lives) is RULED a PANEL/MENU-ROW action, never a toolbar
button (rare, export-shaped, not frequent) and never a keyboard shortcut (§3.10's anti-clutter posture, §4's
no-new-global-single-key-shortcut constraint) — `tasks.md`'s task 6.2 text is corrected in place to state
this ruled placement, leaving only the exact row/label/menu-location as 6.2's own task-time detail; (3)
RULING 4's possible mid-task-7.2 pause (if group 7 opens) needs NO ACTION — a correct restatement of an
already-deferred contingency, task 7.2's own noted pause-point stands as written. Gate 1's four §9 rulings
(`decisions.md`'s M11 GATE 1 entry) stay inherited closed throughout: §9-1 (dependency set) still
MEASURED-not-assumed, at task 1.1; §9-2 (content-script surface) CONFIRMED app-page-only; §9-3 (sanitizer
profile) CONFIRMED; §9-4 (toggle semantics) DEFERRED, contingent on §9-1. `plan.md`'s twelve D-values
(D-1…D-12) — see this file's own header comment above for the full list — are SEALED as M11's
architecture, mirroring 007's (Mermaid) architecture throughout (app-page-only, post-mount enhancement, a
third named sanitizer profile alongside the document and SVG ones) while naming four real points of
divergence: a NEW markdown-it parse rule (007 needed none), KaTeX's dual HTML+MathML output reshaping the
sanitizer profile and *giving* copy-as-MathML its mechanism for free, inline math's forced INVERSION of
007's sibling-figure shape (mutate-in-place, since inline content has no "beside"), and the MathJax
contingency structured as a purely additive drop point. **The one genuine spec-level gap surfaced at gate
2 is RULED, not left open:** §8-1 (inline math's copy-as-LaTeX/MathML reachability) is ruled OPTION (b) —
text-selection for copy-as-LaTeX, a document-level "copy all formulas as MathML" action for copy-as-MathML,
no per-formula inline control group; block math's own control group is unchanged. This amends spec §4's
copy criterion, recorded in `decisions.md`'s gate-2 entry (`spec.md` stays sealed, per the M7–M10
precedent). **Gate 2 also fixed Group 1's measurement list**: task 1.1 must measure `@mdit/plugin-tex`
(D-1's tokenizer, an always-loaded parse-graph dependency) alongside `katex`/MathJax, not only the two
lazy render engines. All corrections are made in the relevant file's own text (`plan.md`'s status line
stays "draft awaiting gate 2," `tasks.md`'s stays "DRAFT awaiting gate 3," per the M7–M10 precedent — the
approvals live in `decisions.md`, not the status lines). **No implementation code exists yet; gate 3's
approval is doc-only, recorded here and in `decisions.md`/`AGENTS.md`.** § Now's own next act is task 1.1
itself, in a fresh session (C14). M10 closed 2026-09-06; its own narrative (19 active tasks ticked + 3
struck-in-place = 22 sealed, human milestone-close walk ALL PASS, `/retro` banked, `spec-coverage.md` F9
0%→38% / F5 36%→38%) moved to [`progress-archive.md`](progress-archive.md) in the close-and-archive pass
immediately prior to the gate-1 draft. See § Closed milestones below for the one-paragraph close summary
and the link to the archived detail.

## Up next

**Nothing in M11 proceeds. Task 1.1 settled RULING 1 as BRANCH (C) — every remaining M11 task (groups
2–9) is SUSPENDED**, per that task's own literal branch text: *"the commit is the LAST one in this
milestone until a human-reviewed spec revisit... reopens it."* KaTeX alone (1,361,716 B, dominated by
1,072,948 B of its own font assets) and MathJax alone (1,339,852 B, and a separate `pnpm audit --prod`
failure) each independently bust the ~352.8/352.7 KiB `.output` / ~607.8/607.7 KiB zip headroom — see
§ Now above and `specs/011-math-rendering/tasks.md`'s own 1.1 RESULT block for the full measurement.
**The next act is human, not agentic:** review the measurement and either (a) revisit `spec.md`'s scope
(a font-subset/lazy-split strategy — even a woff2-only restriction still leaves `.output` ~183 KB over
bound, so a real fix needs more than format-trimming — or a scope reduction), or (b) close M11 without
shipping math rendering. Until that revisit, no session should attempt tasks 2.1 onward. **Also left for
that revisit:** whether to revert `katex`/`@mdit/plugin-tex`/`@mathjax/src` from `package.json` (all three
are currently installed, `dependencies` 6 → 9) or keep them installed for the revisit's own convenience —
task 1.1's own branch (C) text is silent on this, unlike branch (B)'s explicit MathJax-revert instruction,
and no keep-or-revert step was invented in their place.

**(d) A fourth revisit path, architecturally distinct from the three above (font-subset/lazy-split,
scope-reduction, close-M11) — KaTeX's `output: 'mathml'` mode.** *(Pointer: this path's font framing —
"fits comfortably," no bundled font — is CORRECTED at the reopened spec's REVISIT block §(c): MathML
self-falls-back to a font on Firefox but needs one bundled for Chrome fidelity. Read the REVISIT block,
not this paragraph, for the current font-cost framing.)* KaTeX can emit browser-native MathML with
NO parallel HTML layout tree and NO bundled font assets, dropping BOTH the 1,072,948 B of KaTeX's own font
assets AND the 29,916 B of inlined CSS text 1.1's arm (b) measured, at a stroke — leaving only the
~258,852 B lazy JS chunk plus `@mdit/plugin-tex`'s own +3,957 B/+3,957 B always-loaded floor, a total that
fits the ~352.8/352.7 KiB `.output` headroom comfortably. **This REOPENS D-4, it is not a config flip
beneath it**: D-4 pins `output: 'htmlAndMathml'` as load-bearing for BOTH D-5 (the sanitizer profile admits
KaTeX's HTML+MathML dual output) and D-6 (copy-as-MathML clones the `<math>` tree that dual output embeds)
— switching to `output: 'mathml'` would simplify D-5 to a MathML-only allow-list (no parallel HTML
vocabulary to admit) and change D-6's copy-as-MathML basis to cloning the only rendered tree, rather than
one of two. **The open question this path trades in is rendering FIDELITY, not availability**: trading
KaTeX's own pixel-tuned HTML/CSS layout for the browser engine's own native MathML typesetting is a
quality/consistency call to settle with a real visual walk AT REVISIT — this note banks NEITHER current
browser MathML support NOR fidelity as verified; whoever reopens M11 confirms both directly, the same
measured-not-recalled posture every other figure in this record keeps.

**A lean on the installed-dependency disposition 1.1 itself left open (task 1.1's own branch (C) text is
silent on keep-vs-revert; this is a LEAN for the human to confirm at revisit, not a decision made here):**
reverting `dependencies` 9 → 6 (`-@mathjax/src`, `-@mdit/plugin-tex`, `-katex`) is COSTLESS. 1.1's own
content-script measurement is direct evidence for this: all three packages shipped installed in the
committed state with no production import anywhere outside 1.1's own scratch-and-reverted probes, and
`content-scripts/peekover.js` stayed md5-identical to HEAD across every arm — an unimported dependency
moves zero bytes on the graph that carries it — and the `.output`/zip totals 1.1 measured against matched
the pre-install headroom figures exactly. Reverting keeps `package.json` honest against the "never shipped
installed-but-unused" spirit branch (B)'s own text states explicitly for the MathJax-only case.

### Carried items
*Banked deliberately, each with a recorded home. Do NOT guess at any of them; every one is either
measurement-driven or explicitly deferred.*

- **★ NEW AT THE 2026-09-07 BYTE-FORECAST SPIKE — THE URL-LOADED FONT LEVER, REAL-MEASURED (~28.2
  KiB recovery, no WAR cost, no dependency change).** See § Now above for the full measurement. **HOME:**
  whoever lands D-13's font wiring for real at task 4.2-R — take the lever there (a normal asset
  import instead of `?inline`) rather than shipping the base64 form and revisiting later, since the
  URL form is strictly better on every measured axis and the milestone's own headroom stays thin.

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
- **NEW AT THIS REVISIT-RECORD AMENDMENT, 2026-09-06 — A FALSIFIED MILESTONE INVARIANT: `@mdit/plugin-tex`
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
- **NEW AT THIS REVISIT-RECORD AMENDMENT, 2026-09-06 — THE `@mdit/plugin-tex` / `markdown-it`
  PEER-DEPENDENCY MISMATCH IS A LATENT CORRECTNESS RISK, NOT JUST A VERSION WARNING.** 1.1 flagged,
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
| Content script (`content-scripts/peekover.js`) *(009 8.6 close, transcribed at 9.3, not re-rebuilt)* | **334,858 B** both engines | 329,464 B (**+5,394 — `readerCss.ts`'s shared toolbar/collapse CSS, non-Shiki-attributable, on both graphs by construction; 009's own D-2 structural fence (`codeImportFence.test.ts` 9/9) proves zero Shiki bytes reach this graph**) | none — **stated, not gated** | — |
| App-page chunk (`chunks/app-BlMcDd3E.js`) *(009 8.6 close, transcribed at 9.3)* | **475,579 B** both engines, same chunk hash on both | 399,902 B (**+75,677 on this ONE eager chunk — not the full Shiki delta.** Task 8.1's own D-11 decomposition measures the TOTAL `.output` Shiki-attributable delta at **771,112 B** across engine (169,635 B) / languages (395,967 B) / themes (197,102 B) / glue (8,408 B), most of it landing in LAZY chunks this row does not include — see task 8.1 for the full, cross-checked-two-ways reconciliation) | none — **stated, not gated** | — |
| Background (`background.js`) *(009 8.6 close)* | **3,548 B** both engines | 3,548 B (**+0, unchanged**) | none — **stated, not gated** | — |
| Built manifests, Chrome / Firefox *(009 8.6 close)* | **654 / 770 B**, `permissions: []` and no `web_accessible_resources` on both | 654 / 770 B (**unchanged**) | — | — |
| `pnpm zip` Chrome / Firefox *(009 8.1's M-1 measurement, unchanged through 8.6's close)* | **1,470,730 / 1,470,788 B** | 1,306,928 / 1,306,986 B (**+163,802 / +163,802 — Shiki's zip-compressed delta; deflate compresses the repetitive grammar/theme JSON far harder than the raw `.output` sum, per 8.1's own finding**) | **<2 MB** | **PASS — headroom ~612 KiB** |
| Packed unzipped (`.output/<engine>`) *(009 8.1's M-1 measurement, unchanged through 8.6's close)* | **4,866,741 / 4,866,857 B** | 4,082,294 / 4,082,410 B (**+784,447 / +784,447**) | **≤5 MB** (AGENTS.md) | **PASS — headroom ~367 KiB (~7% free) — the tightest this milestone's own kickoff mental model ran, per 9.2 retro finding 4** |
| Suites *(009 8.6 close, transcribed at 9.3)* | **1042 unit** (61 files) · **134 browser files, 1395 passed, 15 skipped, 0 failed** | 944 unit / 56 files; browser not tracked at the pre-1.1 reading | — | green |

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
