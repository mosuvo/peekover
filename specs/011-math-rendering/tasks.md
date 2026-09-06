# Tasks 011 — Math rendering: KaTeX (+ contingent MathJax fallback) for inline/block/fence math (M11)
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews these against the plan and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M11 GATE 1** entry (four §9 rulings,*
*2026-09-06). `plan.md` — gate 2, banked in `decisions.md`'s **M11 GATE 2** entry (2026-09-06): the twelve*
*D-values (D-1…D-12) and nine-group sequence APPROVED as sealed architecture; §8-1 RULED (b); Group 1's*
*measurement list FIXED to include `@mdit/plugin-tex`.* One commit per task (`-F` heredoc, `Co-Authored-By:*
*Claude Sonnet 5` trailer); the human reviews the pasted evidence and pushes. Each capability gets its OWN*
*real-engine test (`tests/browser/*`, Cr+Fx, red-first + non-vacuous) — never a trailing "add tests" task.*
*Layout, computed style, an engine rendering into a live container, bytes-on-wire, and clipboard/selection*
*behaviour are jsdom-**BLIND**: proven in the real engine, never in jsdom.*

**★ Standing invariants — bundle-budget snapshot (AGENTS.md kickoff-standing-invariants rule).** Current
`.output` headroom **~352.8/352.7 KiB** against the **≤5 MiB** bound; `pnpm zip` headroom **~607.8/607.7 KiB**
against **<2 MB** (M10's own close figures, unchanged since gate 1 — nothing has been installed yet).
`dependencies` **6** (`diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`, `shiki`) — task
1.1 is the ONLY task in this milestone permitted to move that count, by up to **three**
(`@mdit/plugin-tex`, `katex`, and contingently the ruled MathJax package), pending its own result. Manifest
**654 / 770 B** (Chrome/Firefox), `permissions: []`, no `web_accessible_resources`. Content-script
(`content-scripts/peekover.js`) **334,858 B both engines** (009 8.6 close, unchanged through M10's own D-2
proof) — this is the figure every task's confined-diff/md5 claim is checked against. **Every task's kickoff
re-states this snapshot at the top of its own standing-invariants block, not only at milestone close** (AGENTS.md's
own rule) — task 1.1 is where the dependency count and the two byte headroom figures first move.

**★ THE TWO GATE-2 RULINGS — APPLIED HERE, NEVER RE-ARGUED.** Gate 2 is **banked**: `decisions.md`'s
**M11 GATE 2** entry (2026-09-06) approves `plan.md`'s twelve D-values and nine-group sequence, rules §8-1,
and fixes Group 1's measurement list. Each is applied verbatim below; neither is re-decided here.
- **Ruling · §8-1, the inline-copy-affordance gap — RULED OPTION (b).** Inline math's copy-as-LaTeX is
  ordinary text-selection of the retained source (zero new code); copy-as-MathML is a document-level "copy
  all formulas as MathML" action (one action, covering every formula, block and inline); NO per-formula
  inline control group. Block math's own control group (D-6) is unchanged. → **task 6.2**, with the
  document-level action's own UI placement flagged as underspecified (see § Gate-3 findings below).
- **Ruling · Group 1's measurement list — FIXED.** `@mdit/plugin-tex` (D-1's tokenizer) is an ALWAYS-LOADED
  parse-graph dependency, not a lazy render-engine chunk, and MUST be measured alongside `katex`/MathJax as
  its own guaranteed byte floor, decomposed to its own residual. → **task 1.1**, below, written to this fixed
  scope from the start.
The four **gate-1** rulings stay inherited-closed throughout, unchanged by gate 2: **RULING 1** (§9-1, the
dependency set) is MEASURED, not assumed, at task 1.1 — this file's own hard gate, below. **RULING 2** (§9-2,
app-page-only) and **RULING 3** (§9-3, a distinct sanitizer profile) are CONFIRMED. **RULING 4** (§9-4, toggle
semantics) is DEFERRED, contingent on RULING 1 — see task 7.2's own note.

**Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **spec §3.1–§3.11**, sealed at gate 1, with the four §9 rulings preserved by silence (above).
- **plan D-1 … D-12**, sealed at gate 2. **Every task names the D-value(s) it services**, and cites the exact
  `plan.md` §0 entry text as its `decisions.md` landing text — never re-authored, landing with the commit
  that implements it (plan §0's own rule; M9's "thirteen entries never landed with an implementing commit" gap
  is the standing reason this discipline exists — audited at task 9.3).
- **plan §3.5's sibling-checklist audit (§7-8, M6 retro finding 4)** — a discharged plan deliverable, **routed
  here, not re-derived**: row 1 (app-page-only) → tasks 4.3/5.1's import-fence proofs · row 4 (sibling vs.
  inversion) → **Y** block, task 4.2 (D-8 reuse); **I** inline, task 5.1 (D-7's inversion, red-first) · row 6
  (`--reader-measure` width) → task 4.2, block only, inline out (no independent width) · row 11 (control group
  anchors to its own artifact) → task 6.1, block only, inline out (row 11's own "no control group on inline
  math" scoping call) · row 14 (control group survives re-render) → task 6.1, block only · row 15 (state in
  text+`aria-*`, never colour alone) → task 4.2 (block failure marker, copy buttons), task 5.1 (**D**, the
  inline failure annotation's `title`+`aria-*`) · row 16 (real `<button>`, keyboard-operable) → task 6.1,
  block only · row 17 (accessible name carries selection+action) → task 6.1 (block), task 5.1 (**D**, inline's
  accessible name comes from the MathML tree itself, no button) · row 19 (reduced motion) → **`—`, out**, no
  animation is specified anywhere in §4/§5 for math (plan's own explicit scoping) · row 20 (polite live
  region) → task 6.1, block copy-action status only · row 21 (focus trap/restore, lightbox) → **`—`, out**, no
  lightbox is specified for math · the **new row** (copy-as-LaTeX/MathML mechanism) → task 6.1 (block,
  **D**), task 6.2 (inline, **D**, §8-1 ruled (b)).
- **spec §6's IS-NOT list is a fence**: standalone `.math` files · Graphviz/Vega/PlantUML-adjacent notation ·
  math on the content-script surface (RULING 2) · a math-authoring/editing surface · cross-device sync of
  formulas · generalising the lightbox to math (no lightbox exists for math at all, row 21 above). **No task
  proposes any of them.**

**Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism (M6 retro
finding 9's own conclusion):**
- **★ GOLDEN GROWS — NOT EMPTY, unlike M10's own discipline.** `parse.ts`'s new rule (task 3.2) changes what
  `sanitize(parse(source))` produces for any document containing `$…$`/`$$…$$`/a `math` fence — the ONLY task
  in this file that touches that path. **Every other task's Golden line is `git diff tests/golden/output/`
  EMPTY** (post-mount enhancement, copy actions, and the sanitizer's own additive profile never touch the
  pre-mount snapshot, the identical property 007's own enhancer work held). Task 3.2's own diff is REVIEWED
  and CLASSIFIED per task 3.1's audit, never asserted empty and never bulk-accepted.
- **Manifest pin:** `tests/manifest.test.ts` green, **654 / 770 B** on the two built manifests, byte-unmodified;
  `permissions: []`; `web_accessible_resources` **absent**. A needed manifest edit is an AGENTS.md #4 event and
  a **hard stop** — none is expected (plan §2's own framing).
- **Content-script bytes — byte-identical for the WHOLE MILESTONE, structural, not contingent (D-3/RULING 2).**
  Math never goes through `mount()` and never enters the content-script module graph — proven by a **confined
  diff** on `mount.ts` / `runReader.ts` / `mountReader.ts` / `contentWatch.ts` (byte-untouched) **and** md5
  identity of `content-scripts/peekover.js` against **334,858 B both engines**, every task, checked by md5
  against the pre-task build, never by grep (the standing M6 retraction).
- **A positive control that FIRES (M6 finding 1)**, named in the Verify line and asserted in the same test,
  under the same conditions the negative claim disclaims — every zero-network / renders / degrades /
  no-false-success claim carries one (the KaTeX-font-specific CDN-link ablation per §1.4; the
  persistence-of-the-`<code>`-element red-first per D-7; the revert-and-fail for each of §3.9's three
  degradation paths).
- **The harness-shared-state rule (AGENTS.md, placed 2026-09-06)** — every browser-test assertion about shared
  state (document listeners, the clipboard, module-level caches) is DELTA-based or SPECIFIC-CONTENT-matched,
  never an absolute count or a pristine-state assumption. Applied from task 4.2 on, the milestone's first
  browser-test task.
- **Byte discipline** — task 1.1 is the hard gate; every task from 1.1 on states its own delta against the
  IMMEDIATELY-PRIOR task's own measured figure, never against the milestone-start baseline alone (the same
  drift-by-accumulation discipline M10's own thin headroom forced).
- **Revert-and-fail (M6 finding 5) is the standard, not an option:** every regression test is verified red
  **with the defect's own signature in the defect's own units**. No revert-and-fail, task unfinished.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit**; task 9.3 is its final
  reconciliation. **Stage explicit paths — NEVER `git add -A` / `git add .`**
- **NUL check** on any task that writes a control-character escape (none currently anticipated in 011's own
  strings — stated so a task that DOES introduce one does not skip it): `tr -d -c '\000' < f | wc -c` **and**
  `python3 -c "print(open(F,'rb').read().count(b'\x00'))"` — **both forms, every time**, never a grep.

**Human-run items budgeted UP FRONT (plan §5, not discovered late) — enumerated in 9.1's Verify, not
rediscovered there:** the inline failure-marker's exact visual treatment (plan §8 gate-3 question 2 — dotted
underline vs. a highlighter-adjacent treatment) · whether the block-math control group reads as discoverable
or as clutter (007's own D-11 judgement axis, transplanted) · legibility of a dense, multi-line formula at
the reading column's own width · **Firefox everything** (Playwright cannot load an extension into Firefox) ·
**zero unexpected network with the Network tab open** · **at least one WIDE viewport, recorded like an
engine** (M6 finding 2). **No decision gate analogous to 010's 10.4 exists in this milestone** — RULING 1 is
task 1.1's OWN measurement fork (self-resolving, not routed to a separate human product-feel gate), and
RULING 4 (if it goes live) is task 7.2's own pause point, not a scheduled gate task.

**★ GATE-3 FINDINGS — surfaced by this decomposition, flagged for human review rather than resolved silently:**
1. **The concrete MathJax package name is unresolved.** `plan.md` states task 1.1 itself names it ("spec does
   not pre-name one"). This file names **`mathjax-full`** (MathJax v3's own current npm package; the
   `mathjax` package name itself is the abandoned v2 line) as the working candidate for task 1.1 to verify
   against the current registry — licence, maintenance cadence, ESM/CJS shape, install scripts — before
   installing, on the identical "not a working assumption taken on faith" posture 010's own Ruling 1 applied
   to its ZIP-writer package. If task 1.1's own check finds a better-maintained or lighter alternative, that
   is task 1.1's own finding to report, not a silent substitution.
2. **The document-level "copy all formulas as MathML" action (§8-1 ruled (b)) has no stated UI placement.**
   The ruling names the MECHANISM, not where it lives — a toolbar button, a keyboard shortcut, a row inside
   an existing panel (the export panel's own shape is the nearest sibling, 010 D-2) are all live options
   `plan.md`/`decisions.md`'s M11 GATE 2 entry does not choose between. Routed to task 6.2 to resolve at task
   time, flagged here so it is not treated as a settled design decision it is not.
3. **RULING 4 (toggle semantics) may block task 7.2's own full scoping**, per plan §0 D-11/D-10's own text —
   this is not a new finding (the plan already names it), restated here because it is the one place in this
   file's own group 7 where a task's Files/Verify cannot be fully written until a second human ruling lands,
   contingent on task 1.1 shipping MathJax at all.

---

## 1 — The measurement (RULING 1 — HARD GATE, every later group is written against its result)

- [ ] **1.1 Install `katex`, `@mdit/plugin-tex`, and the candidate MathJax package FOR REAL; measure and
      decompose; SETTLE RULING 1. ★ THE FORK IS EXPLICIT — this task cannot fail silently into task 2.1
      (D-1, D-2, D-10; RULING 1; the Group-1 measurement fix).** Resolve the MathJax package identity first
      (§ Gate-3 finding 1 — `mathjax-full`, verified against the current registry, not taken on faith).
      Install all three for real; build; measure `.output`/`pnpm zip` deltas for **each alone and all
      combined**, decomposed to a fully accounted residual per arm: **(a)** `@mdit/plugin-tex`'s own
      always-loaded floor, priced separately from either engine (the Group-1 fix's own point) · **(b)**
      `katex` alone, lazy-chunk · **(c)** the MathJax package alone, lazy-chunk · **(d)** both engines
      combined · **(e)** any transitive weight either pulls in unexpectedly (009's `katex`-via-`mermaid`
      finding is the standing example this line exists for) · **(f)** whether `katex` dedupes/chunk-shares
      with `mermaid`'s own transitive `katex ^0.16.45` (plan §4 risk 3) — measured, not assumed, either
      outcome reported. Licence, no-install-scripts, and `pnpm audit --prod` clean confirmed for all three,
      independently. `pnpm why --prod dompurify` re-run to confirm a single resolved copy still holds (007
      1.1's own dedupe-gate shape, re-run because a new dependency tree can reintroduce a second copy).
      SBOM regenerated.
      Files: `package.json` · `pnpm-lock.yaml`
      Verify: `Object.keys(pkg.dependencies).length` moves from **6** to **8** (KaTeX-only branch) or **9**
      (KaTeX+MathJax branch), asserted not eyeballed, with the new names confirmed. `pnpm audit --prod`
      **EXIT=0** for the installed set. Licence/install-script result recorded per package. SBOM component
      count + licence roll-up recorded. **Content-script bytes md5-identical to HEAD** (RULING 2 — none of
      the three is a content-script concern by construction; proven with a firing control: reference one from
      a scratch content-script import, rebuild, md5 moves, revert). ★ **ACCEPTANCE IS A THREE-WAY FORK,
      STATED AS SUCH IN THE COMMIT MESSAGE:**
      - **(A) Both engines fit** the decomposed delta inside the ~352.8/352.7 KiB / ~607.8/607.7 KiB
        headroom → RULING 1 ships KaTeX+MathJax; group 7 proceeds at task 7.1.
      - **(B) Only `@mdit/plugin-tex`+`katex` fit** (MathJax's own arm alone or combined busts headroom) →
        RULING 1 is KaTeX-only, per the spec's own pre-stated fallback (§3.1); **group 7 is struck at THIS
        task's own commit** (D-10's clean-drop — nothing in groups 2–6 is touched, no file is half-built),
        and the MathJax package is removed from `package.json` in the same commit (never shipped
        installed-but-unused).
      - **(C) Even KaTeX-only busts headroom** → every remaining task in this file is **SUSPENDED**; the
        commit is the LAST one in this milestone until a human-reviewed spec revisit (a subset/lazy-split
        strategy, or scope reduction, per D-10(007)'s own precedent) reopens it.
      Golden EMPTY · manifest green **654 / 770 B** · `permissions: []` both. [D-1 (the Group-1 fix), D-2,
      D-10; RULING 1]

*Group-1 acceptance (plan §6): RULING 1 is settled with a decomposed, ablation-proven number in each arm
(KaTeX-only, KaTeX+MathJax), PLUS `@mdit/plugin-tex`'s own always-loaded residual accounted for separately
from either engine arm; scanner green with its self-test firing. This is the only valid outcome that
authorizes group 2.*

## 2 — The math sanitizer profile (D-5)

- [ ] **2.1 `SANITIZE_MATH_CONFIG` / `sanitizeMath` / `cleanMathStyle` — the third named profile (D-5).**
      New exported `MATH_ALLOWED_TAGS` / `MATH_ALLOWED_ATTR` / `SANITIZE_MATH_CONFIG` arrays and
      `sanitizeMath(html: string): string`, following `sanitizeSvg`'s allow-list-plus-procedural-filter
      shape. **The MathML tag/attribute enumeration is done against KaTeX's REAL installed output** (task
      1.1's own install), not the plan's own starting hypothesis list — `katex.renderToString` run directly
      in the test file over a representative formula corpus, its output's actual tag/attribute set surveyed
      the same way `SVG_ALLOWED_TAGS`'s own header states its survey was done. `class` admitted generically
      by name, never enumerated by value (D-5's own stated saving). `style` admitted, filtered by
      `cleanMathStyle` (a flat declaration-list token scan denying `url(`/`expression(`, cheaper than
      `cleanSvgCss`'s tokenizer since a `style` attribute value has no comments/nesting/at-rules to walk).
      No `href`/`src`/`xlink:href` anywhere in `MATH_ALLOWED_ATTR`. `ALLOW_ARIA_ATTR: true` (spec §5's
      accessible-name requirement). `ADD_URI_SAFE_ATTR` NOT set (D-5 — no URI-bearing attribute exists in
      this profile's allow-list at all, stated explicitly rather than silently omitted).
      Files: `src/render/sanitize.ts` (additive only) · `src/render/sanitize.test.ts`
      Verify: (**unit**) a hand-built hostile corpus is neutralised — a `style` value carrying `url(...)`, an
      attempted `<annotation>` carrying something other than plain text, an attempted MathML element NOT in
      the enumerated allow-list (e.g. `mglyph`, `ms`), an attempted bare `<a>`. `cleanMathStyle` proven
      against REAL KaTeX output producing a **zero-strip** result (measured, not assumed — D-4's `trust:
      false` makes source-controlled `style` values structurally impossible, but this is proven by test, the
      "measured, not argued" posture `SVG_ALLOWED_URI_REGEXP`'s own derivation took). The document and SVG
      profiles' three consts are **byte-identical**, diffed explicitly. Content-script bytes md5-identical.
      App-page bytes stated against 1.1's own post-install figure, decomposed — this task's own glue weight
      only (KaTeX's runtime weight was already priced at 1.1). Golden EMPTY · manifest green **654 / 770 B**
      · `permissions: []`. [D-5; RULING 3]

*Group-2 acceptance (plan §6): the hostile corpus is neutralised; `cleanMathStyle` proven against real KaTeX
output producing zero strips; the other two profiles' arrays are byte-identical.*

## 3 — The golden-fixture audit + the parse-stage rule (D-1)

- [ ] **3.1 ★ THE GOLDEN-FIXTURE AUDIT — READ-ONLY, RUNS BEFORE THE PARSE RULE LANDS, not as a byproduct of
      writing it (§1.1's own sequencing).** Every existing golden fixture containing a literal `$` (a price,
      a shell variable inside a code span, a currency table cell) is read and classified against what D-1's
      rule WILL produce, before it exists: **matches-and-should** (none expected, per spec §5's own "Golden
      GROWS, it does not merely change" framing) vs. **matches-and-should-not** (a false positive the rule's
      own escaping/code-span-exclusion must prevent) vs. **does-not-match** (unaffected). Its finding is
      recorded in this task's own commit message and consumed directly by task 3.2 — an unintentional diff
      discovered THERE is a regression to fix in the rule, never a golden fixture waved through because "math
      changed golden this time" (spec §5's own binding NFR).
      Files: none (a read-only investigation; its finding is recorded in the task's own commit message)
      Verify: every fixture containing a literal `$` is enumerated by path, with its classification and
      reasoning pasted into the task report. Golden EMPTY (nothing is built yet) · manifest green
      **654 / 770 B** · `permissions: []`. [§1.1; §7-5]

- [ ] **3.2 `parse.ts` gains `@mdit/plugin-tex` + the two passthrough render rules (D-1). ★ GOLDEN GROWS
      HERE — the milestone's own sole exception to the EMPTY pin, reviewed per 3.1's audit, never bulk-
      accepted.** `md.use(tex, {...})` (the tokenizer-only base, verified against the ACTUAL installed
      package's token/render-rule API — this task's own job per D-1's stated verification obligation, not
      re-derived from documentation alone). `md.renderer.rules['math_inline']` / `['math_block']` emit
      `passthroughInline`/`passthroughBlock` — recognition and marker-emission ONLY, never a `katex`/
      `mathjax` import anywhere in this file (the single-importer discipline D-2 protects). `passthroughInline(src)`
      → `<code class="peekover-math-inline">$${escape(src)}$</code>` (D-7); `passthroughBlock(src)` →
      `<pre><code class="language-math">$$${escape(src)}$$</code></pre>` (D-8), sharing markdown-it's own
      `escapeHtml`, no new escaping mechanism. **Verified at this task, per D-1's own revisit-when**: that
      markdown-it's inline-code (backtick) rule consumes its span's interior into an opaque token BEFORE
      `@mdit/plugin-tex`'s rule runs, so a `` `$HOME` ``-style span never fires the math rule (spec §7-5's own
      risk) — proven against the installed package's real rule-registration order, not assumed. If
      `@mdit/plugin-tex` turns out NOT usable standalone (D-1's own named contingency), this task stops and
      flags back to gate review with the finding, rather than silently falling back to a hand-rolled rule.
      Files: `src/render/parse.ts` (additive beside the existing fence-rule override) ·
      `src/render/parse.test.ts` · one NEW committed golden fixture pinning the `<code
      class="peekover-math-inline">` and `<pre><code class="language-math">` marker shapes (the
      `code.html:2`-precedent shape, per §1.2's own "later tasks read THAT file" framing)
      Verify: (**unit**) inline/block/fence recognition over a representative corpus (escaped `\$`, a `$5`
      price, a shell `$HOME` inside a code span, nested delimiters); the code-span-exclusion property proven
      directly (a math-shaped string inside a `` ` `` span produces an ordinary `<code>`, not a math marker).
      3.1's audit re-run against the NOW-REAL rule: every flagged fixture's diff reviewed and classified,
      pasted into the commit. `git diff tests/golden/output/` **reviewed, not empty** — every hunk explained.
      Content-script bytes md5-identical. Manifest green **654 / 770 B** · `permissions: []`. [D-1, D-7, D-8;
      §1.1; §7-5]

*Group-3 acceptance (plan §6): every flagged fixture's diff is reviewed and classified; the new `<code>`/
`<pre>` marker shapes are pinned in a committed golden fixture.*

## 4 — Enhancer scaffolding: block math (D-2, D-3, D-4, D-8, D-9, §1.4)

- [ ] **4.1 `mathEngine.ts` — the ONE `import('katex')`, the feature-detect, KaTeX's config lockdown (D-2,
      D-4).** `import('katex')` as a static string literal — the shape `check-dynamic-imports.ts`'s
      MUST_NOT_FIRE fixture already sanctions, mirroring `diagramEngine.ts`'s own D-13(007) shape exactly.
      `hasMathMarker`/`loadMathEngine`, feature-detecting `code.peekover-math-inline` OR
      `pre > code.language-math` before the import is ever evaluated (spec §4: "when a document contains no
      math syntax, the system shall not load the math rendering engine"). KaTeX config, `Object.freeze`d
      (`DIAGRAM_ENGINE_CONFIG`'s own shape): **`trust: false`** pinned explicitly (D-4's config-level
      lockdown, closing `\href`/`\includegraphics`/`\htmlClass`/`\htmlId`/`\htmlStyle`/`\htmlData` at the
      source) · **`throwOnError`** left at its documented default `true` (D-4 — a failed formula THROWS,
      never renders KaTeX's own error markup) · **`output: 'htmlAndMathml'`** kept, not overridden (D-4/D-6 —
      both the visual paint and the copy-as-MathML mechanism depend on this surviving).
      Files: `src/render/mathEngine.ts` · `src/render/mathEngine.test.ts` · `src/render/mathImportFence.test.ts`
      (mirroring `diagramImportFence.test.ts`'s static module-graph proof)
      Verify: (**unit**) the feature-detect returns `false` on a marker-free document and the loader is NOT
      invoked — assert the injected loader's call count, an uncalled spy and a missing spy look identical
      otherwise (007 1.2's own lesson). `scripts/check-dynamic-imports.ts` **EXIT=0** and its self-test still
      fires (a deliberately-computed specifier in a scratch fixture, outside `src/`, deleted in the same
      task, goes RED). The frozen config's three pinned fields (`trust`, `throwOnError`, `output`) asserted
      directly against the object, not against KaTeX's documented default (a future KaTeX default change must
      not silently alter this project's own posture). Content-script bytes md5-identical (D-2/RULING 2 — not
      imported from `mathImportFence.test.ts`'s own static graph check). App-page bytes stated against 2.1's
      own figure. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-2, D-4]

- [ ] **4.2 Block/fence math enhancer + view — `mathEnhancer.ts`/`mathView.ts` (block half), the two-call-site
      wiring, D-9's theme-inheritance measurement (D-3, D-8, D-9).** `enhanceMath(host)` wired immediately
      after `enhanceDiagrams(host)` at BOTH existing sites — `readerPane.ts:187` and `appShell.ts:170` — one
      added line each, `mount.ts` untouched. Block markers (`pre > code.language-math`, dollar-block ∪ fence
      per D-8) get a synchronous pre-paint prologue (insert placeholder `<figure>`, mark `data-math="pending"`
      — a NEW, DISTINCT attribute from `data-diagram`, never shared, per D-8's own cross-engine-collision
      avoidance) then an async body: `drawFormula(engine, source, {displayMode: true})` per formula,
      `sanitizeMath`'d, adopted via 007 D-15's own sibling-figure flip verbatim. `mathSourceOf` peels a
      leading/trailing `$$` pair for dollar-block origin, passes fence content through unpeeled (D-8's one
      contained branch). **D-9's theme-inheritance claim is MEASURED HERE, not assumed**: a real contrast
      measurement of a rendered formula's ink colour at light/dark/sepia, before AND after a theme flip with
      NO re-render triggered — proving the CSS-cascade claim empirically. If any KaTeX-emitted colour is NOT
      theme-inherited (a hardcoded `errorColor` red, KaTeX's own documented literal hex, is the named
      candidate), that specific element is priced and fixed as its own finding — it does not reopen D-9's
      "no re-render subscription" mechanism claim.
      Files: `src/render/mathEnhancer.ts` (block half) · `src/render/mathView.ts` (block half — `data-math`
      state attribute, `mathSourceOf`, `adopt`) · `src/app/readerPane.ts:187` · `src/app/appShell.ts:170` ·
      `src/theme/readerCss.ts` (block figure styling, tokens verified against all three theme blocks, CSS
      rationale in the doc comment above the literal, no `ch` in any layout-blocking property) ·
      `tests/browser/mathRender.browser.test.ts` · `tests/browser/mathTheme.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) §4's block/fence rendering criteria; **D-8's shared-shape claim,
      asserted directly**: a dollar-block formula and a fence formula produce IDENTICAL DOM shapes
      post-render (modulo peeled/unpeeled source), proving the reuse claim rather than asserting it. **§3.5
      row 6**: a block formula's figure resolves `max-width` against `--reader-measure`, the same variable
      diagrams use. **D-9's contrast measurement**, with its own non-vacuous firing control: a
      deliberately-hardcoded-colour ablation must FAIL this exact assertion. `mount.ts` diff EMPTY. Content-
      script bytes md5-identical. App-page bytes stated against 4.1's own figure, decomposed. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [D-3, D-8, D-9; §3.5 rows 4(block), 6, 15(block),
      17(block); §4 block/fence rendering]

- [ ] **4.3 The zero-network guard, with the KaTeX-font-specific firing control (§1.4); block math's §3.9
      degradation paths (D-4/D-5's engine-failure and sanitize-rejection cases).** KaTeX's CSS imported via
      Vite's `?inline` form (`import katexCss from 'katex/dist/katex.min.css?inline'`), injected into the
      shadow root as a `<style>` element built from a TypeScript string constant — mirroring `readerCss.ts`'s
      own shadow-root-injection pattern, never a runtime `<link>` tag. Per-formula try/catch (`drawFormula`'s
      own shape, mirroring `drawDiagram`): engine-load failure is document-wide (mirrors `renderDiagrams`'s
      own catch); parse/render failure and sanitize-rejection are per-formula, satisfying §4's "shall render
      every other formula in the document normally."
      Files: `src/render/mathEngine.ts` (the `?inline` CSS import, additive to 4.1) ·
      `tests/browser/mathNetwork.browser.test.ts` · `tests/browser/mathDegrade.browser.test.ts` (block half)
      Verify: (**tests/browser** — Cr+Fx) zero requests across import → render → sanitize → adopt, on the
      real built extension, **PLUS a scratch ablation** (a `<link>`-to-CDN swap-in, reverted in the same
      test) shown live to prove the guard would catch the trap — the same "a positive control that fires"
      discipline 007 §3.5 row 22 applied to Mermaid's own remote-image routes. All three of §3.9's failures
      degrade correctly for block math: engine-load failure (document-wide), per-formula render failure
      (the raw `$$…$$`/fence source stays visible, `data-math="failed"`), sanitize-rejection (the
      latest-moment case, D-8's own shape) — each verified RED-FIRST with the defect's own signature.
      Content-script bytes md5-identical. App-page bytes stated against 4.2's own figure. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [D-4, D-5; §1.4; §3.5 row 1; §4 degradation]

*Group-4 acceptance (plan §6): §4's block/fence rendering and degradation criteria; D-9's theme lean measured
and confirmed or corrected; `mount.ts` diff empty.*

## 5 — Enhancer scaffolding: inline math (D-7's inversion)

- [ ] **5.1 Inline math — `mathEnhancer.ts`/`mathView.ts` (inline half): mutate-in-place, no sibling, D-7's
      inversion.** Inline markers need no synchronous prologue — their pending state IS their already-
      committed literal `$…$` text. On success, the enhancer `replaceChildren`s the `<code
      class="peekover-math-inline">` element's OWN children with the sanitized KaTeX fragment, never removing
      or re-inserting the `<code>` itself (the retained-source anchor task 6.2's copy-as-LaTeX depends on).
      On any of §3.9's three failures, the element's content is simply never touched. **The inline failure
      marker is an ANNOTATION ON THE SAME ELEMENT** — `title` (a native tooltip) plus `data-math-failed`, not
      a new sibling node (breaking inline flow is the named reason a sibling marker is rejected).
      Files: `src/render/mathEnhancer.ts` (inline half) · `src/render/mathView.ts` (inline half) ·
      `tests/browser/mathInline.browser.test.ts` · `tests/browser/mathDegrade.browser.test.ts` (inline half,
      additive to 4.3's file)
      Verify: (**tests/browser** — Cr+Fx) §4's inline rendering and degradation criteria. ★ **D-7's inversion,
      asserted directly and RED-FIRST**: a rendered inline formula's `<code class="peekover-math-inline">`
      element PERSISTS (never removed, never wrapped) across a successful render — reverted by
      removing/replacing the element on success, which must go red naming the missing anchor. The in-place
      failure annotation carries BOTH `title` text AND `data-math-failed`/`aria-*` (§3.5 row 15's own **D**
      requirement — a colour-blind or non-hover reader still learns which formula failed). The inline
      formula's accessible name comes from the MathML tree itself post-render (§3.5 row 17's own **D**
      requirement — no button exists to label). No control group, no hover/focus popover, no new inline
      element is added anywhere in this task (§3.5 row 11's own scoping call, re-confirmed as a NEGATIVE
      assertion — the diff contains no new interactive element). Content-script bytes md5-identical. App-page
      bytes stated against 4.3's own figure. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [D-7; §3.5 rows 4(inline), 11(inline), 15(inline), 17(inline); §4 inline
      rendering/degradation]

*Group-5 acceptance (plan §6): §4's inline rendering and degradation criteria; the persistence-of-the-
`<code>`-element property proven red-first.*

## 6 — Copy-as-LaTeX / copy-as-MathML (D-6; §8-1 ruled (b))

- [ ] **6.1 Block math's copy control group — copy-as-LaTeX (retained source) and copy-as-MathML
      (clone-and-serialize) (D-6).** Reuses 007 D-15/§3.11's own hover/focus control-group shape verbatim —
      no new control-group mechanism. Copy-as-LaTeX reads the SAME retained source text every degrade path
      already depends on (`mathSourceOf`, task 4.2), never KaTeX's own `<annotation>` echo (D-6's own
      round-trip-fidelity reasoning). Copy-as-MathML clones the figure's live, post-`sanitizeMath` `<math>`
      element and serializes it with `XMLSerializer` — the identical mechanism `diagramSvgText` already uses
      for copy-as-image, zero new dependencies (D-6). A polite live region reports action completion/failure,
      mirroring `DIAGRAM_STATUS_CLASS`'s own shape (§3.5 row 20).
      Files: `src/render/mathView.ts` (the control group, `runMathAction` mirroring `runDiagramAction`) ·
      `tests/browser/mathActions.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) copy-as-LaTeX returns BYTE-IDENTICAL source to what was authored,
      including a formula with escaped `\$` or interior code-span-adjacent syntax from the golden audit
      (task 3.1). Copy-as-MathML returns a `<math>` root the browser's own XML parser accepts round-trip.
      **§3.5 row 11** (the control group anchors to its OWN artifact, resolved from the DOM at activation
      time, mirroring `runDiagramAction`) · **row 14** (survives a re-render, closure death) · **row 16**
      (real `<button>`, keyboard-operable) · **row 20** (the live region, polite, out of the a11y tree while
      empty). Content-script bytes md5-identical. App-page bytes stated against 5.1's own figure. Golden
      EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-6; §3.5 rows 11, 14, 16, 20, new-row
      (block); §4 copy actions]

- [ ] **6.2 Inline math's copy actions — text-selection for LaTeX (zero new code), a document-level "copy all
      formulas as MathML" action (§8-1 ruled (b)). ★ UI PLACEMENT UNRESOLVED — see § Gate-3 finding 2,
      resolved AT this task, not before it.** Copy-as-LaTeX for inline math is VERIFIED, not built: the
      `<code class="peekover-math-inline">` element's own text content at rest is the literal `$…$` source
      (D-7), so ordinary browser text-selection + copy already satisfies §4's "copy the exact source LaTeX as
      authored" with zero new code — this task's job is to prove that, not to write a handler for it.
      Copy-as-MathML is a NEW document-level action (one action, covering every formula in the document,
      block and inline) that walks every `<math>` element post-render and serializes them, reusing
      `XMLSerializer`, task 6.1's own mechanism, generalised to "all," not "one." Its trigger's placement is
      this task's own decision (a toolbar control, a panel row, or a keyboard shortcut — task-time judgment,
      confined; whichever is chosen is recorded in the commit, not silently assumed from a mockup that does
      not exist for it).
      Files: `src/render/mathView.ts` (the document-level MathML-collection function) · wherever the trigger
      is placed (an existing chrome module — task-time choice, named in the commit) ·
      `tests/browser/mathActions.browser.test.ts` (inline half, additive to 6.1's file)
      Verify: (**tests/browser** — Cr+Fx) selecting an inline formula's rendered text and copying it produces
      the exact `$…$` source, byte-identical, over a fixture including escaped `\$` — proving the
      zero-new-code claim, not merely asserting it. The document-level action produces a payload containing
      every formula's `<math>` root in the document (block AND inline), each accepted by the browser's own
      XML parser round-trip. **§3.5's new row, inline half**: no per-formula inline control group exists
      anywhere in the diff (a negative assertion, re-confirmed). Content-script bytes md5-identical. App-page
      bytes stated against 6.1's own figure. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. No `contextMenus` permission anywhere (§3.10). [D-6; §8-1; §3.5 new-row (inline);
      §4 copy actions]

*Group-6 acceptance (plan §6): §4's four copy-action criteria, per the gate-2 amendment — block math offers
per-formula copy-as-LaTeX AND copy-as-MathML through its control group, unchanged; inline math offers
copy-as-LaTeX via text-selection and copy-as-MathML via the document-level action, not a per-formula inline
affordance. `permissions: []` re-proven; no `contextMenus` anywhere.*

## 7 — MathJax (CONTINGENT — opened only if task 1.1 rules RULING 1 to include MathJax; struck otherwise)

*If task 1.1's fork lands on branch (B) (KaTeX-only), this whole group is struck at task 1.1's own commit and
neither task below is ever opened — D-10's clean-drop, not an unwind. Written below for the case task 1.1
lands on branch (A).*

- [ ] **7.1 CONTINGENT — `mathJaxEngine.ts`, the second engine module (D-2); MathJax's own output-shape
      survey.** A second, PARALLEL module (D-2's own "two modules, not one parameterized module" reasoning —
      dropping MathJax must be a file-deletion, not a refactor). MathJax's own output shape (SVG or
      CommonHTML, whichever mode this task chooses per its own docs) is surveyed against its real installed
      output — plan's own unresearched-risk item (§4 risk 6) — and `SANITIZE_MATH_CONFIG` is WIDENED (never
      replaced) to admit whatever tag/attribute vocabulary that output actually needs, the same way the SVG
      profile's shape did not change when Mermaid changed diagram types.
      Files: `src/render/mathJaxEngine.ts` · `src/render/mathJaxEngine.test.ts` · `src/render/sanitize.ts`
      (widened, additive to task 2.1's own profile)
      Verify: (**unit**) the feature-detect/config shape mirrors 4.1's own `mathEngine.ts` proof exactly. The
      widened sanitizer profile neutralises a hostile corpus built from MathJax's OWN real output shape,
      mirroring 2.1's own hostile-corpus discipline. Content-script bytes md5-identical. App-page bytes
      stated against 6.2's own figure, decomposed to MathJax's own glue weight (its runtime weight was priced
      at 1.1). Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-2, D-10; §4 risk 6]

- [ ] **7.2 CONTINGENT — the ONE dispatch branch in `mathEnhancer.ts`; the settings field (D-11); the toggle
      control. ★ MAY PAUSE FOR RULING 4 (§9-4, toggle semantics) — a human ruling this task cannot make
      itself, per gate 1's own deferral.** D-10's own single dispatch point: "which engine renders THIS
      formula," resolved by reading a new settings field (D-11's shape only — one more key on the existing
      global `Settings` row, sibling to `codeTheme`/`lastExportFormat`). **The field's NAME and TYPE are
      downstream of RULING 4**, which this task cannot resolve on its own (a product-feel call, not a
      measured one, per spec §3.11/§9-4). If RULING 4 has not been ruled by the time this task is reached,
      it STOPS and flags back for that ruling before scoping the field/toggle concretely — it does not guess
      at a boolean-vs-enum shape.
      Files: `src/render/mathEnhancer.ts` (the one dispatch branch) · `src/settings/settings.ts` (D-11's new
      field, once RULING 4 lands) · the toggle control's own UI location (task-time choice) ·
      `docs/trust/PERMISSIONS.md` (the one new field name, mirroring 010's own one-field-addition discipline)
      Verify: (**tests/browser** — Cr+Fx) toggling the setting changes which engine renders a formula,
      verified by output-shape difference (KaTeX's vs. MathJax's own DOM shape), never by a mocked dispatch.
      Everything upstream of the dispatch point (recognition, the passthrough marker, the sanitizer profile
      shape, copy-as-LaTeX/MathML) is unchanged by this task — a reviewer diff confirms zero edits to
      `parse.ts`, `mathView.ts`'s copy mechanisms, or `mathSourceOf`. Content-script bytes md5-identical.
      Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-10, D-11; RULING 4]

*Group-7 acceptance (plan §6): if opened, D-10's dispatch-point property holds (KaTeX-only and
KaTeX+MathJax are the same codebase with one optional layer, never two branches); if struck, nothing in
groups 2–6 is touched and no file is half-built.*

## 8 — Measure (D-12's cache lean; §3.6)

- [ ] **8.1 Render-timing measurement — 1/10/50-formula documents, feeding D-12's cache lean.** The 007 D-9
      shape exactly: median AND floor reported, A-B-A against a same-session HEAD control, quiesced. Outputs:
      wall-clock to all-formulas-resolved, time-to-first-formula, per-formula amortized cost, at each
      document size. **First paint, no math**: a math-free document shows ZERO delta (D-3 puts the
      enhancement post-mount) — proving that is this measurement's whole job, not merely asserting it.
      **First paint, WITH math**: the same gate — a math-bearing document that misses it means the
      enhancement is not actually post-paint, a defect, not a budget. **This task is FORBIDDEN from choosing
      a cache design from its own output** (D-12's own binding text) — if the numbers CONTRADICT §3.6's
      no-cache lean, the finding is routed to `progress.md`'s § Carried items, not built here or added to
      this file after the fact.
      Files: none in `src/` (a measurement task; a scratch perf script under `scripts/` if needed, mirroring
      `scripts/perf-first-paint.ts`'s own shape, committed if reusable or discarded if scratch-only — stated
      either way in the commit)
      Verify: all five outputs above, pasted with median AND floor. The no-cache lean CONFIRMED or
      CONTRADICTED, stated plainly, never assumed. If contradicted, the routing to `progress.md` § Carried
      items is itself the deliverable — no cache code exists in this task's diff either way. Content-script
      bytes md5-identical (unchanged by a measurement task). Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [D-12; §3.6]

*Group-8 acceptance (plan §6): D-12's lean is confirmed or contradicted with real numbers; a contradicted
lean produces a routed finding, never a cache built inside this task.*

## 9 — Human milestone-close gate + retro + records reconcile

- [ ] **9.1 Human milestone-close walk — the design-translation gate (§7-9), the recorded viewports, the
      floor-delta statement discipline.** Per plan §8 gate-3 question 2: the inline failure-marker's exact
      visual treatment (a dotted underline vs. a highlighter-adjacent treatment consistent with
      `design/brand.html`'s paper/ink/one-highlighter language) — confirmed against a real mockup if one
      exists, produced if it does not (plan §4 risk 7's own named gap). Whether the block-math control group
      reads as discoverable or as clutter (007's own D-11 axis). Legibility of a dense, multi-line formula at
      the reading column's own width. **Firefox everything.** Zero unexpected network with the Network tab
      open. At least one WIDE viewport, recorded like an engine. Every prior task's own floor-delta figures
      re-stated before any re-baseline is discussed (the M7-precedent discipline).
      Files: `design/tokens.css` / `design/brand.html` (only if the visual-treatment walk finds a genuinely
      new token is needed — flagged, not assumed) · `src/theme/readerCss.ts` (the inline failure-marker's
      final CSS, if this walk's finding differs from 5.1's own placeholder styling)
      Verify: each walked item's verdict recorded plainly (PASS, or a named finding routed to § Carried
      items). No implicit "looked fine" — every axis above gets its own stated verdict. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [§7-9; §8 gate-3 question 2]

- [ ] **9.2 `/retro` — the milestone retrospective.** Interview per the retro skill's own ritual (WORKFLOW.md
      §7.5); banks findings the same way M6–M10's own retros did, including whether the harness-shared-state
      rule (placed 2026-09-06, applied from task 4.2 on) held up under this milestone's own browser-test
      load, and whether the "Golden GROWS" discipline (this milestone's own shape-difference from M10)
      produced any friction worth naming for the next milestone that touches `parse.ts`.
      Files: `docs/ai/retro.md` (or wherever the retro skill lands its entries — task-time, per the skill's
      own convention)
      Verify: the retro's own entry is banked, dated, and cites this milestone's real task numbers, not
      paraphrased. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [WORKFLOW.md §7.5]

- [ ] **9.3 Records reconcile — `progress.md`, `decisions.md`'s D-value-landed audit, `spec-coverage.md`, the
      final byte ledger.** M10's own group-11 shape: the Now-pointer's full M11 narrative moved to
      `progress-archive.md`; every stale in-progress marker corrected to M11-closed. ★ **Every D-value's
      `decisions.md` entry (D-1…D-12, plus D-10's second module and D-11's field if group 7 opened) is
      audited against whether it actually landed with its own implementing commit** — the specific gap M9's
      own 9.3 named, not repeated here: each landed at its own task per this file's own per-task citation
      discipline, or the gap is named exactly as M9's was, not smoothed over. `spec-coverage.md`'s F2 math
      row moves from its pre-milestone figure to its landed figure. Plan §8 gate-3 question 3 (whether
      `@mdit/plugin-tex`'s own licence/maintenance posture, inspected at task 1.1/3.2, changed D-1's choice)
      is recorded here if it was ever live. The final byte ledger: `.output`/`pnpm zip` deltas decomposed to
      a fully accounted residual across every task from 1.1 on, against the ~352.8/352.7 KiB / ~607.8/607.7
      KiB starting headroom.
      Files: `docs/ai/progress.md` · `docs/ai/progress-archive.md` · `docs/ai/spec-coverage.md` ·
      `docs/ai/decisions.md` (only if a genuine decision landed at 9.1/9.2 not already banked)
      Verify: § Baselines carries the final re-run numbers or states plainly it did not, and why. Every
      D-value's landing commit named. `permissions: []` confirmed intact throughout. Content-script bytes
      md5-identical against **334,858 B both engines** — the milestone's own closing proof that it never
      moved. Golden's own final diff — EMPTY except task 3.2's own reviewed hunk — confirmed one more time
      against the committed fixture. [the D-value audit; M9 9.3's own gap, named]

---

**§4 EARS coverage:** Rendering (KaTeX, always in scope) → tasks 3.2, 4.1, 4.2, 5.1 (+content-script clause →
4.3/5.1's import-fence proofs) · MathJax fallback (contingent) → 7.1, 7.2 · Copy actions → 6.1, 6.2 · Trust →
1.1 (bytes/manifest/licence), 4.3 (network, block), 5.1 (network, inline — the same guard, exercised on the
inline path) · Degradation → 4.3, 5.1. Every non-contingent clause has at least one non-contingent task; the
contingent clauses are struck to N/A exactly as spec §4 states if RULING 1 excludes MathJax at task 1.1.

**Count as sealed at gate 3: NINE groups, 16 tasks (18 if group 7 opens)** — 1 (1) · 2 (1) · 3 (2) · 4 (3) ·
5 (1) · 6 (2) · 7 (2, contingent) · 8 (1) · 9 (3). **If task 1.1 rules KaTeX-only (branch B), group 7's two
tasks are struck at that same commit and the active count is 16 of 18 sealed** — the identical
struck-in-place discipline 010's own task 5.1 (DOCX) and task 3.5 (ZIP) used, not deletion.

*Gate: this file is a **DRAFT awaiting gate 3**. On approval, implementation may begin at **task 1.1, in a
fresh session**, per WORKFLOW.md §5.3 — one commit per task, the `progress.md` Now-pointer advancing in that
same commit. **No plan D-value is re-opened, no spec §3.x decision is re-decided, and no §6 IS-NOT item is
proposed here.** ★ **Gate 2 is BANKED and its two rulings (§8-1 = (b); the Group-1 measurement fix) are
APPLIED above, not held. The only place this file declines to decide is task 1.1's own fork (RULING 1) — a
measurement this file cannot pre-resolve — and, contingently, RULING 4 inside task 7.2, which this file
flags as a possible mid-implementation pause point, not a thing it resolves on its own.***
