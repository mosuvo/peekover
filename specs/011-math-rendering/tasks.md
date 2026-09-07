# Tasks 011 — Math rendering: KaTeX (+ contingent MathJax fallback) for inline/block/fence math (M11)
*Gear 3 tasks stage — **DRAFT awaiting gate 3 — REVISIT.** The human reviews the reopened decomposition*
*below (the "## TASKS REVISIT" block) against `plan.md`'s own "PLAN REVISIT" block and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M11 GATE 1** entry (four §9 rulings,*
*2026-09-06). `plan.md` — gate 2, banked in `decisions.md`'s **M11 GATE 2** entry (2026-09-06): the twelve*
*D-values (D-1…D-12) and nine-group sequence APPROVED as sealed architecture; §8-1 RULED (b); Group 1's*
*measurement list FIXED to include `@mdit/plugin-tex`.* One commit per task (`-F` heredoc, `Co-Authored-By:*
*Claude Sonnet 5` trailer); the human reviews the pasted evidence and pushes. Each capability gets its OWN*
*real-engine test (`tests/browser/*`, Cr+Fx, red-first + non-vacuous) — never a trailing "add tests" task.*
*Layout, computed style, an engine rendering into a live container, bytes-on-wire, and clipboard/selection*
*behaviour are jsdom-**BLIND**: proven in the real engine, never in jsdom.*

---

## TASKS REVISIT — 2026-09-06 (post gate-2-revisit approval, reopened Temml/MathML decomposition)

**★ THIS FILE'S DECOMPOSITION IS REOPENED. The sections below this block (§ Standing invariants onward,
including task 1.1's own `[x]`/RESULT) are the ORIGINAL gate-3 draft, preserved for provenance — read as
history, not as the current task list. This block is the current decomposition.** Task 1.1 is NOT
un-ticked and its RESULT block is NOT overwritten — it HAPPENED (it settled RULING 1 as branch (C), the
measurement that caused this whole reopen) and stays `[x]` as the historical record. Every task below is
NEW, `[ ]`, and belongs to a freshly numbered group/task sequence that supersedes §§1–9 below in full,
except for the historical 1.1 itself. This re-enters the gate cycle at **gate 3, the LAST planning gate
before implementation resumes** — a draft, not an approval; the approval, if given, lands as a future
`decisions.md` "M11 GATE 3 — REVISIT" entry, per the bank-not-artifact precedent this milestone's own
gate-1-revisit and gate-2-revisit both held (`decisions.md`, `2b70d94`/`f767261`). `plan.md`/`spec.md`/
`decisions.md` are untouched by this block.

**Authority order (read before any task below):** (1) `plan.md`'s "PLAN REVISIT — 2026-09-06" block
(`bee9a83`) is the ARCHITECTURE this decomposes — D-1-R…D-13, the (h) group sequence, the supersession
map. (2) `decisions.md`'s "M11 GATE 2 — REVISIT" entry (`f767261`) is the RULINGS, and, critically,
**INPUT A** and **INPUT B** — the two obligations this revisit must DISCHARGE below, not restate. (3)
`spec.md`'s "REVISIT — 2026-09-06" block is the SCOPE (REVISIT-RULINGS 1–4). (4) The original §§1–9 below
are what is SUPERSEDED — where this kickoff's own prose paraphrases that original text, the FILE (as
re-read for this drafting pass) governs; one divergence is flagged in this drafting session's own report,
not smoothed over here.

**Gate-1-revisit rulings, inherited closed, unchanged by this decomposition:** REVISIT-RULING 1 (MathML/
Temml direction, Temml named as candidate to verify) · REVISIT-RULING 2 (the fidelity bar — acceptable,
readable math typesetting on BOTH Chrome and Firefox, explicitly not KaTeX-HTML equivalence) ·
REVISIT-RULING 3 (the pre-stated close-M11 fallback, firing on EITHER the byte axis or the fidelity axis)
· REVISIT-RULING 4 (MathJax struck permanently, reason recorded, D-10/D-11 vacated). §9-2 (app-page-only)
and §9-3 (sanitizer profile, now MathML-only) still hold; §9-4 is vacated with RULING 4.

### Discharging INPUT A and INPUT B (gate-2-revisit's own two obligations — concrete below, not restated)

**INPUT B — the content-script byte invariant, REWRITTEN for the reopened milestone, replacing the
original § Standing invariants' "byte-identical for the WHOLE MILESTONE" claim below (which stays
unedited as history — it described the ORIGINAL KaTeX/MathJax decomposition, not this one):**

> **Content-script bytes move by EXACTLY the chosen tokenizer's own always-loaded floor (Group 1-R
> re-measures the exact figure for whichever candidate task 1.1-R resolves between `@mdit/plugin-tex` and
> a Temml-native alternative) and by NOTHING ELSE, for the rest of the milestone.** The floor lands
> exactly ONCE, at task 3.2-R (the parse-rule task) — never at Group 1-R itself, which only spikes the
> figure in scratch, reverted before commit (mirroring the original 1.1's own scratch-probe discipline).
> **Before 3.2-R lands:** every task asserts content-script bytes md5-identical against **336,123 B both
> engines** — this session's own re-measured, authoritative pre-math baseline (the original 1.1's own
> "base-line divergence, flagged" finding: a fresh `rm -rf .output` rebuild measured 336,123 B, not the
> **334,858 B** this file's own § Standing invariants header below states — that stale figure is a
> citation error in prose, not a build non-determinism, per 1.1's own RESULT block; 336,123 B is carried
> forward here as the live figure, neither this file's header nor AGENTS.md is edited by this task). **From
> 3.2-R onward:** every task asserts content-script bytes md5-identical against **336,123 B + the tokenizer
> floor 1.1-R measured and 3.2-R confirmed against the real landed code** — not against 336,123 B alone,
> and never again against the pre-math baseline. **The firing control flips accordingly**: pre-3.2-R tasks
> use a zero-delta/md5-IDENTITY firing control (reference the candidate from a scratch content-script
> import, rebuild, md5 moves, revert — the original 1.1's own shape). 3.2-R itself uses a DELTA firing
> control — the SAME scratch-reference technique, but proving the floor moved by EXACTLY the expected
> amount, no more, when landed for real (not reverted). Every task after 3.2-R reverts to an md5-IDENTITY
> control, now checked against 3.2-R's OWN post-floor figure. **A task that asserts md5-identity against
> 336,123 B alone after 3.2-R has landed has a WRONG Verify — state this explicitly in every task from
> 3.2-R on, so no task silently carries the stale pre-floor form.** The behavioral cousin — a `$x$` span on
> the content-script `file://` reader rendering as inert monospace `<code>` at rest, `enhanceMath` never
> running there (§9-2 holds) — is priced as a named cost in task 3.1-R's own golden audit, not waved
> through as unremarkable.

**INPUT A — D-13's font-loading firing-control obligation, discharged as a Group 1-R deliverable (task
1.1-R below), not deferred to Group 4-R's own shipping task:** Group 1-R's byte-measurement task must
PROVE, real-engine (Cr+Fx — computed style is jsdom-blind), that the subsetted bundled math font actually
LOADS AND APPLIES inside the app page's shadow root — a rendered formula's computed `font-family` resolves
to the bundled family, not a fallback — not merely that its bytes landed in `.output`. This pairs with
RE-VERIFYING (not assuming from KaTeX's own font precedent) that the font resolves same-origin within the
privileged app page and needs no `web_accessible_resources` key — a bundler shape that forces one is an
AGENTS.md #4 hard stop, checked here before Group 4-R ships the font for real.

### Locked by the gates, reopened — CITED, never re-argued here

- **plan D-1-R … D-13**, sealed at gate 2-revisit (`decisions.md`'s "M11 GATE 2 — REVISIT" entry). Every
  task below names the D-value(s) it services and cites the exact `plan.md`'s own PLAN REVISIT-block text
  as its `decisions.md` landing text — never re-authored — the identical per-task citation discipline the
  original file used for D-1…D-12, now audited at the reopened task 8.3-R.
- **§8-1's ruling SURVIVES AND SIMPLIFIES** (`decisions.md`'s original M11 GATE 2 entry, reaffirmed by the
  gate-2-revisit entry): inline copy-as-LaTeX via text-selection, copy-as-MathML via a document-level
  action cloning the ONE rendered tree — routed to task 6.2-R, UI placement already RULED at the
  ORIGINAL gate 3 (a panel/menu-row, never a toolbar button, never a keyboard shortcut) and not reopened.
- **spec §6's IS-NOT list is a fence, unchanged**: standalone `.math` files · math on the content-script
  surface (RULING 2) · a math-authoring surface · cross-device sync · a math lightbox. No task below
  proposes any of them.
- **§3.5's sibling-checklist audit routing carries forward unchanged in SHAPE** (rows 1, 4, 6, 11, 14–17,
  19–21, and the new copy-mechanism row) — only the D-value each row cites moves from the original D-N to
  its D-N-R (e.g. row 4 → D-8-R, not D-8), stated per-task below, not re-derived from scratch.

### The reopened group structure (decomposes plan (h); supersedes the original §§1–9 in full below)

## 1-R — The merged fidelity-and-byte gate (plan (h) — HARD GATE, first, gating everything after it)

- [ ] **1.1-R Resolve the tokenizer fork (D-1-R); govern the dependency set (revert `katex`/`@mathjax/src`,
      install `temml` + the resolved tokenizer); subset and bundle the math font (D-13); measure and
      decompose; discharge INPUT A and INPUT B's own exact-figure obligation.** Probe `@mdit/plugin-tex`
      (still installed, unreverted since the original 1.1) against Temml's own current documentation for a
      stated markdown-it integration — if Temml's docs name one, that settles D-1-R's candidate fork
      without inventing a rival; if not, `@mdit/plugin-tex` (already verified tokenizer-only, per the
      original 1.1's own probe) is confirmed as the candidate, its markdown-it `^15.0.0` peer-dep-vs-`14.3.0`
      risk (carried plan-input (2)) exercised concretely (a `$5`-price / code-span-adjacent corpus) before
      being treated as closed. **Govern the dependency set in this same commit**: `katex` and `@mathjax/src`
      — left installed by the original 1.1's own explicit "not decided here" disposition, pending exactly
      this human-reviewed reopen — are REMOVED (superseded by REVISIT-RULING 1's MathML direction; struck
      permanently by REVISIT-RULING 4); `temml` is installed for real (D-2-R, candidate to verify: size,
      licence, ESM shape, install scripts, LaTeX-macro coverage — the identical 1.1-shaped measurement
      discipline, not a pin). Subset a representative-formula-corpus-driven WOFF2 from one of Latin Modern
      Math / Noto Sans Math / STIX Two Math (D-13 — family chosen HERE if the corpus makes one candidate's
      glyph coverage clearly superior, otherwise deferred to task 8.1-R per plan (h)'s own "if not already
      settled" framing, stated either way), wired via the shadow-root CSS-injection pattern's own
      `@font-face`, RE-VERIFIED (not assumed identical to `?inline`'s own `url()` shape, D-13's own flagged
      distinct build/inject question) against this project's real bundler output.
      Files: `package.json` · `pnpm-lock.yaml` · the subsetted font asset + its scratch CSS wiring (committed
      only if Group 1-R's own PROCEED branch lands in 1.2-R below; otherwise reverted with the rest per that
      task's own fork text)
      Verify: `Object.keys(pkg.dependencies).length` moves **9 → 8** (`-katex`, `-@mathjax/src`,
      `+temml`, `@mdit/plugin-tex` or its replacement retained), asserted not eyeballed, names confirmed.
      `pnpm audit --prod` EXIT=0. Licence/install-script result recorded for `temml`. `.output`/`pnpm zip`
      deltas decomposed to a fully accounted residual: **(a)** `temml`'s own JS **(b)** the tokenizer's own
      always-loaded floor, priced separately — THE figure INPUT B's rewritten invariant cites **(c)** the
      subsetted font's own bytes **(d)** all combined — against the current ~352.8/352.7 KiB / ~607.8/607.7
      KiB headroom, **unchanged since nothing from the original 1.1's three packages was ever imported into
      a build graph** (re-confirmed by a fresh clean rebuild before this task's own installs, not assumed).
      **INPUT A discharged**: a real-engine (Cr+Fx) test proves a rendered formula's computed `font-family`
      resolves to the bundled family inside the app page's shadow root — with a negative control (a
      deliberately-wrong `@font-face` `src` must FAIL the same assertion) — and confirms no
      `web_accessible_resources` key is needed (same-origin resolution inside the privileged app page,
      re-verified for THIS font, not assumed from KaTeX's own precedent). Content-script bytes
      md5-identical against **336,123 B** (INPUT B's pre-floor form), with a firing control (a scratch
      content-script reference to `temml`, rebuilt, md5 moves; reverted, md5 restored). Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [D-1-R, D-2-R, D-13; RULING 1 (already settled,
      branch C); INPUT A; INPUT B (figure established)]

- [ ] **1.2-R ★ HUMAN-RUN, NO AGENT SUBSTITUTE — real Chrome+Firefox visual-fidelity walk of Temml MathML
      with the bundled font, judged against REVISIT-RULING 2's bar; THE TWO-AXIS FORK, EXPLICIT.**
      Extension loaded, both engines (Playwright cannot load an extension into Firefox — the M6/9.1
      precedent), a dense representative formula corpus (fractions, radicals, integrals, matrices, stretchy
      delimiters, nested sub/superscripts) walked for **acceptable, readable math typesetting on BOTH
      engines** — explicitly NOT visual equivalence to KaTeX's own HTML layout, per REVISIT-RULING 2's own
      text.
      Files: none in `src/` (a walk; scratch fixtures under `tests/fixtures/` or `scripts/`, discarded or
      committed per task-time call, stated either way)
      Verify: each formula class's own verdict recorded plainly (PASS/FAIL against the readable-on-both
      bar) — no implicit "looked fine." ★ **THE FORK, stated as such in the commit message (the two-axis
      mirror of the original 1.1's own three-way fork):**
      - **PROCEED** — 1.1-R's byte measurement fits headroom on BOTH engines AND this walk clears
        REVISIT-RULING 2's bar on BOTH engines → **Groups 2-R onward are AUTHORIZED**; `temml`/the
        tokenizer/the font stay installed exactly as 1.1-R left them.
      - **CLOSE-M11** — EITHER axis fails (the combined byte cost busts headroom, OR Chrome's rendering
        falls below the readable-on-both bar) → REVISIT-RULING 3's pre-stated fallback fires. Every
        remaining task in this reopened decomposition is SUSPENDED, and — resolving the disposition
        question the original 1.1's own branch (C) explicitly left open — **`temml`, the tokenizer, and the
        font asset are REVERTED in THIS SAME COMMIT** (a shippable milestone-close state cannot carry a
        bust or an installed-but-unused engine; this reopen states its own fork's disposition explicitly
        rather than repeating the original's own left-open ambiguity).
      Golden EMPTY (unaffected by a walk) · manifest green **654 / 770 B** · `permissions: []`.
      [REVISIT-RULING 2; REVISIT-RULING 3]

*Group-1-R acceptance (plan (h)): both axes measured/walked against REVISIT-RULING 2/3's own bars; PROCEED
authorizes Group 2-R onward against the actually-installed set; CLOSE-M11 reverts `temml`/tokenizer/font in
the SAME commit and suspends every remaining task — the only two valid outcomes.*

## 2-R — The math sanitizer profile (D-5-R)

- [ ] **2.1-R `SANITIZE_MATH_CONFIG` / `sanitizeMath` — ONE MathML-only vocabulary, enumerated against REAL
      installed Temml output (D-5-R).** `MATH_ALLOWED_TAGS` / `MATH_ALLOWED_ATTR` / `SANITIZE_MATH_CONFIG` /
      `sanitizeMath` survey `temml.renderToMathML` (or whichever entry point 1.1-R's install confirmed)
      directly, over a representative formula corpus — no KaTeX-output-derived starting hypothesis carried
      forward. `cleanMathStyle`'s own open question (D-5-R) is RESOLVED AS FOUND: if Temml's real output
      carries no `style` attribute, `style`/`cleanMathStyle` are simply ABSENT from the profile — a smaller
      profile than the original D-5, stated as a finding, not a gap. `class` admitted generically by name
      (carried). No `href`/`src` anywhere in the allow-list. `ALLOW_ARIA_ATTR: true` (carried, engine-
      agnostic).
      Files: `src/render/sanitize.ts` (additive only) · `src/render/sanitize.test.ts`
      Verify: (**unit**) a hostile corpus built from Temml's own real tag/attribute vocabulary is
      neutralised — an attempted disallowed MathML element (whatever the survey finds absent from Temml's
      real output), an attempted bare `<a>`, and (only if the survey finds `style` present) a `style` value
      carrying `url(...)`. The document and SVG profiles' three consts remain **byte-identical** to the
      original (diffed). Content-script bytes md5-identical against **336,123 B** (pre-3.2-R, per INPUT B's
      rewritten invariant). App-page bytes stated against 1.1-R's own figure, decomposed. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [D-5-R; RULING 3]

*Group-2-R acceptance (plan (h)): the hostile corpus (built from Temml's REAL output, not KaTeX's) is
neutralised; `cleanMathStyle`'s open question resolved as found, one way or the other, stated plainly.*

## 3-R — The golden-fixture audit + the parse-stage rule (D-1-R) — GOLDEN GROWS HERE

- [ ] **3.1-R ★ THE GOLDEN-FIXTURE AUDIT, RE-ENTERED — READ-ONLY, before the parse rule lands.** The
      original 3.1's own classification was run against the ORIGINAL tokenizer assumption before the
      milestone's suspension; **recognition grammar (escaping, code-span exclusion, delimiter handling) is
      a property of the CHOSEN TOKENIZER PACKAGE**, which 1.1-R's own fork reopened — even where the SAME
      package (`@mdit/plugin-tex`) wins, its grammar is re-confirmed fresh here, not inherited past the
      milestone's own suspend/reopen boundary. Every existing golden fixture containing a literal `$` is
      re-read and re-classified (matches-and-should / matches-and-should-not / does-not-match) against what
      the RESOLVED tokenizer's own rule WILL produce. **The behavioral cousin is priced here, as a named
      cost, per the gate-2-revisit ruling**: a math span on the content-script `file://` reader renders as
      inert monospace `<code>` at rest — `enhanceMath` never runs there (§9-2 holds) — a real, visible
      departure from spec §3.2's "no math affordance" framing, stated plainly, not waved through.
      Files: none (read-only; findings recorded in the commit message)
      Verify: every `$`-bearing fixture enumerated by path, classification + reasoning pasted into the
      report. The behavioral-cousin cost stated as its own line, not folded into a fixture classification.
      Golden EMPTY (nothing built yet) · manifest green **654 / 770 B** · `permissions: []`. [D-1-R; §7-5;
      the gate-2-revisit-recorded behavioral cousin]

- [ ] **3.2-R `parse.ts` gains the RESOLVED tokenizer + the two passthrough render rules (D-1-R, D-7-R,
      D-8-R). ★ GOLDEN GROWS HERE — the reopened decomposition's own sole exception to the EMPTY pin. ★
      INPUT B's FLOOR LANDS HERE, EXACTLY ONCE.** The marker WRAPPER shapes carry UNCHANGED from D-7/D-8
      (`<code class="peekover-math-inline">$…$</code>` / `<pre><code class="language-math">$$…$$</code></pre>`,
      escaped, sharing markdown-it's own `escapeHtml`) — engine-agnostic by construction, per D-7-R/D-8-R's
      own "only the swapped-in content changes" text; what is genuinely re-verified here is the RECOGNITION
      grammar behind those markers, per 3.1-R's own re-entered audit. `md.renderer.rules['math_inline']` /
      `['math_block']` emit the markers ONLY — no `temml` import anywhere in this file (D-2-R's
      single-importer discipline). The inline-code-consumes-first ordering property (spec §7-5) is
      re-verified against the resolved tokenizer's real rule-registration order.
      Files: `src/render/parse.ts` (additive) · `src/render/parse.test.ts` · one NEW committed golden
      fixture pinning the (unchanged-shape) markers
      Verify: (**unit**) recognition corpus (escaped `\$`, a `$5` price, a shell `$HOME` in a code span,
      nested delimiters) against the RESOLVED tokenizer; code-span-exclusion proven directly. 3.1-R's audit
      re-run against the NOW-REAL rule, every flagged fixture's diff reviewed and classified, pasted into
      the commit. `git diff tests/golden/output/` **reviewed, not empty** — every hunk explained. **Content-
      script bytes: THE FLOOR LANDS.** Assert bytes move from **336,123 B** to **336,123 B + 1.1-R's own
      measured tokenizer-floor figure**, EXACTLY, via a DELTA firing control (the same scratch-reference
      technique landed for real this time, not reverted) — confirming INPUT B's rewritten invariant is
      discharged, not merely stated. **Every task from here on asserts CS bytes against THIS new figure, not
      against 336,123 B alone** — stated explicitly in this task's own commit so no later task carries the
      stale pre-floor form. Manifest green **654 / 770 B** · `permissions: []`. [D-1-R, D-7-R, D-8-R; §7-5;
      INPUT B discharged]

*Group-3-R acceptance (plan (h)): the re-entered audit's every flagged fixture is reviewed and classified;
the (unchanged-shape) marker fixture is pinned; INPUT B's floor lands exactly once, proven by a delta
firing control, not merely asserted.*

## 4-R — Enhancer scaffolding: block math (D-2-R, D-3-R, D-4-R, D-8-R, D-9-R, D-13)

- [ ] **4.1-R `mathEngine.ts` — the ONE `import('temml')`, the feature-detect, Temml's config lockdown
      RE-DERIVED against the real installed package (D-2-R, D-4-R).** `import('temml')` as a static string
      literal (the single-importer discipline D-2/D-2-R protect); `hasMathMarker`/`loadMathEngine` carried
      from the original shape. **Temml's OWN failure semantics (throw vs. error-node vs. a rendered-error
      element) and option defaults are read from its real installed source/docs — NOT ported from KaTeX's
      `trust`/`throwOnError` shape** (carried plan-input (3), D-4-R). Whatever equivalent lockdown Temml
      actually exposes is pinned explicitly, `Object.freeze`d. **The `output: 'htmlAndMathml'` pin is
      correctly ABSENT here** — Temml has no output-mode duality to preserve (D-4-R's own VACATE, stated so
      a reviewer does not go looking for it).
      Files: `src/render/mathEngine.ts` · `src/render/mathEngine.test.ts` · `src/render/mathImportFence.test.ts`
      Verify: (**unit**) feature-detect false → loader NOT invoked, asserted by call count (an uncalled spy
      and a missing spy look identical otherwise). `scripts/check-dynamic-imports.ts` EXIT=0, self-test
      fires. The re-derived config's fields asserted directly against Temml's real object (a future Temml
      default change must not silently alter this project's posture). Content-script bytes md5-identical
      against **3.2-R's own landed floor figure** (not 336,123 B alone — per INPUT B's post-floor form).
      App-page bytes stated against 2.1-R's own figure. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [D-2-R, D-4-R]

- [ ] **4.2-R Block/fence math enhancer + view (block half); the bundled font SHIPPED FOR REAL (D-13); D-9-R's
      theme-inheritance measurement (D-3-R, D-8-R, D-9-R).** `enhanceMath(host)` wired immediately after
      `enhanceDiagrams(host)` at both call sites, RE-VERIFIED per plan (h)'s own R-0 (`readerPane.ts:187`,
      `appShell.ts:170`, unchanged, no drift). Block markers get the same synchronous-prologue/async-body
      shape D-8 established, `sanitizeMath`'d, adopted via 007 D-15's sibling-figure flip. **The font
      Group 1-R spiked in scratch is wired into `readerCss.ts`'s own shipped shadow-root CSS here, for
      real** — the same asset, the same `@font-face` mechanism 1.1-R proved applies, now part of the built
      extension rather than a reverted probe. **D-9-R's theme-inheritance claim is MEASURED, not assumed**:
      a real contrast measurement of a rendered Temml formula's ink colour at light/dark/sepia, before/after
      a theme flip with no re-render — including Temml's OWN error-rendering path (D-9-R's own named "one
      new thing to verify") checked for a hardcoded error colour.
      Files: `src/render/mathEnhancer.ts` (block half) · `src/render/mathView.ts` (block half) ·
      `src/app/readerPane.ts:187` · `src/app/appShell.ts:170` · `src/theme/readerCss.ts` (block figure
      styling + the font's `@font-face`, tokens verified against all three theme blocks)
      Verify: (**tests/browser** — Cr+Fx) §4's block/fence rendering criteria against Temml's own `<math>`
      output. D-8-R's shared-shape claim: a dollar-block and a fence formula produce IDENTICAL DOM shapes
      post-render. §3.5 row 6 (`--reader-measure`). D-9-R's contrast measurement with its own firing control
      (a hardcoded-colour ablation must FAIL). `mount.ts` diff EMPTY. Content-script bytes md5-identical
      against 3.2-R's floor. App-page bytes stated against 4.1-R's own figure. Golden EMPTY · manifest green
      **654 / 770 B** · `permissions: []`. [D-3-R, D-8-R, D-9-R, D-13; §3.5 rows 4(block), 6, 15(block),
      17(block); §4 block/fence rendering]

- [ ] **4.3-R The zero-network guard for the bundled font; block math's §3.9 degradation paths (D-4-R's
      engine-failure and D-5-R's sanitize-rejection cases).** The font's CSS/asset resolution mirrors
      `readerCss.ts`'s own shadow-root-injection pattern, never a runtime `<link>`. Per-formula try/catch
      (engine-load failure document-wide; parse/render failure and sanitize-rejection per-formula).
      Files: `src/render/mathEngine.ts` (additive to 4.1-R) · `tests/browser/mathNetwork.browser.test.ts` ·
      `tests/browser/mathDegrade.browser.test.ts` (block half)
      Verify: (**tests/browser** — Cr+Fx) zero requests import → render → sanitize → adopt on the real built
      extension, PLUS a scratch ablation (a CDN swap-in, reverted) proving the guard would catch the trap.
      All three of §3.9's failures degrade correctly for block math, each RED-FIRST. Content-script bytes
      md5-identical against 3.2-R's floor. App-page bytes stated against 4.2-R's own figure. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [D-4-R, D-5-R; §3.5 row 1; §4 degradation]

*Group-4-R acceptance (plan (h)): §4's block/fence rendering and degradation criteria against Temml's own
output; D-9-R's lean measured and confirmed or corrected; the bundled font shipped for real and
zero-network-proven; `mount.ts` diff empty.*

## 5-R — Enhancer scaffolding: inline math (D-7-R's inversion, carried unchanged)

- [ ] **5.1-R Inline math — `mathEnhancer.ts`/`mathView.ts` (inline half): mutate-in-place, no sibling
      (D-7-R).** Identical mechanism to the original 5.1 — the `<code class="peekover-math-inline">`
      element's own children are `replaceChildren`d on success, never the element itself; on any §3.9
      failure the element's content is untouched; the in-place failure annotation (`title` + `data-math-
      failed`) is unchanged. **Only the swapped-in content changes** — Temml's `<math>` tree instead of
      KaTeX's dual HTML+MathML fragment.
      Files: `src/render/mathEnhancer.ts` (inline half) · `src/render/mathView.ts` (inline half) ·
      `tests/browser/mathInline.browser.test.ts` · `tests/browser/mathDegrade.browser.test.ts` (inline half)
      Verify: (**tests/browser** — Cr+Fx) §4's inline rendering/degradation criteria. D-7-R's persistence
      property, RED-FIRST (removing/replacing the element on success must go red naming the missing
      anchor). The failure annotation carries BOTH `title` and `data-math-failed`/`aria-*`. The inline
      formula's accessible name comes from the `<math>` tree itself post-render. No new control group, no
      hover/focus popover, no new inline element (a negative assertion). Content-script bytes md5-identical
      against 3.2-R's floor. App-page bytes stated against 4.3-R's own figure. Golden EMPTY · manifest green
      **654 / 770 B** · `permissions: []`. [D-7-R; §3.5 rows 4(inline), 11(inline), 15(inline), 17(inline);
      §4 inline rendering/degradation]

*Group-5-R acceptance (plan (h)): §4's inline rendering/degradation criteria against Temml's own output;
the persistence-of-the-`<code>`-element property proven red-first.*

## 6-R — Copy-as-LaTeX / copy-as-MathML (D-6-R; §8-1 simplified, not reopened)

- [ ] **6.1-R Block math's copy control group — copy-as-LaTeX (retained source, unchanged) and copy-as-
      MathML (clone-and-serialize the ONE rendered `<math>` tree, D-6-R).** Reuses 007 D-15's own hover/
      focus control-group shape verbatim. Copy-as-MathML SIMPLIFIES from the original's dual-output clone
      to cloning the single tree every formula renders to — no output-mode choice left to make.
      Files: `src/render/mathView.ts` (the control group) · `tests/browser/mathActions.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) copy-as-LaTeX returns byte-identical source, including an escaped-
      `\$` fixture from 3.1-R's own audit. Copy-as-MathML returns a `<math>` root the browser's own XML
      parser accepts round-trip. §3.5 rows 11, 14, 16, 20 (unchanged mechanism, re-proven). Content-script
      bytes md5-identical against 3.2-R's floor. App-page bytes stated against 5.1-R's own figure. Golden
      EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-6-R; §3.5 rows 11, 14, 16, 20,
      new-row(block); §4 copy actions]

- [ ] **6.2-R Inline math's copy actions — text-selection for LaTeX (verified, zero new code), the document-
      level "copy all formulas as MathML" action, SIMPLIFIED (D-6-R; §8-1 UI placement carried, RULED at the
      ORIGINAL gate 3, not reopened).** Copy-as-LaTeX for inline math is verified, not built (D-7-R's own
      retained-source text). The document-level action now clones the ONE tree every formula (block and
      inline) already renders to — no dual-output branch. UI placement (a panel/menu-row, never a toolbar
      button, never a keyboard shortcut) is CARRIED from the original gate-3 ruling — this task places the
      exact row/label/menu-location within that already-ruled shape, unchanged.
      Files: `src/render/mathView.ts` (the document-level collection function) · the panel/menu-row's host
      module (task-time choice, named in the commit) · `tests/browser/mathActions.browser.test.ts`
      (additive)
      Verify: (**tests/browser** — Cr+Fx) selecting an inline formula's rendered text and copying it
      produces the exact `$…$` source, byte-identical, over an escaped-`\$` fixture. The document-level
      action's payload contains every formula's `<math>` root (block AND inline), each round-trip-accepted.
      §3.5's new row, inline half: no per-formula inline control group exists anywhere in the diff. Content-
      script bytes md5-identical against 3.2-R's floor. App-page bytes stated against 6.1-R's own figure.
      Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. No `contextMenus` permission. [D-6-R;
      §8-1; §3.5 new-row(inline); §4 copy actions]

*Group-6-R acceptance (plan (h)): the four copy-action criteria per the gate-2/gate-2-revisit amendment,
simplified to one tree; `permissions: []` re-proven; no `contextMenus` anywhere.*

## Group 7 (MathJax) — STRUCK ENTIRELY, PERMANENTLY, not carried as a dormant/contingent fork

D-10/D-11 are VACATED permanently (`plan.md`'s PLAN REVISIT block; `decisions.md`'s "M11 GATE 1 — REVISIT"
REVISIT-RULING 4). No line items exist for this group in the reopened decomposition — the original's own
group 7 (tasks 7.1/7.2) is not renumbered into a later slot; **the group NUMBERING ITSELF COLLAPSES**: the
original group 8 becomes this decomposition's group 7-R, and the original group 9 becomes group 8-R, below.

## 7-R — Measure (D-12-R's cache lean; §3.6) *(was group 8)*

- [ ] **7.1-R Render-timing measurement — 1/10/50-formula documents, feeding D-12-R's cache lean.** Same
      shape as the original 8.1 (median AND floor, A-B-A against a same-session HEAD control, quiesced;
      first-paint-with/without-math gates). **Temml's own render-cost profile (parse + native browser
      MathML layout) is the NEW, unmeasured variable D-12-R names** — it could be faster (no JS-computed
      layout) or slower (a less-optimized native MathML path in most browsers); this task measures it, does
      not assume it mirrors KaTeX's own profile. **Forbidden from choosing a cache design from its own
      output** (D-12-R's own binding text) — a contradicted no-cache lean routes to `progress.md`'s §
      Carried items, never built here.
      Files: none in `src/` (a measurement task; a scratch perf script under `scripts/` if needed, stated
      committed or discarded)
      Verify: all five outputs (wall-clock to all-formulas-resolved, time-to-first-formula, per-formula
      amortized cost, first-paint-no-math ZERO delta, first-paint-with-math the same gate), median AND
      floor. The no-cache lean CONFIRMED or CONTRADICTED, stated plainly. Content-script bytes md5-identical
      against 3.2-R's floor (unchanged by a measurement task). Golden EMPTY · manifest green **654 / 770 B**
      · `permissions: []`. [D-12-R; §3.6]

*Group-7-R acceptance (plan (h)): D-12-R's lean confirmed or contradicted with real numbers against Temml's
own measured render-cost profile; a contradicted lean produces a routed finding, never a cache built here.*

## 8-R — Human milestone-close gate + retro + records reconcile *(was group 9)*

- [ ] **8.1-R Human milestone-close walk — ALSO the venue for REVISIT-RULING 2's bar walked at FULL-DOCUMENT
      scale (beyond 1.2-R's own corpus-level spike), and for D-13's font-family/subsetting choice
      FINALIZED here if 1.1-R left it open.** Same axes as the original 9.1 (inline failure-marker visual
      treatment, block control-group discoverability-vs-clutter, dense-formula legibility at the reading
      column's width, Firefox everything, zero unexpected network, one wide viewport), re-pointed at
      Temml/MathML, PLUS a full-document-scale re-walk of REVISIT-RULING 2's own readable-on-both bar (the
      spike corpus at 1.2-R was necessarily narrower) and D-13's own family/subsetting finalization if not
      already settled.
      Files: `design/tokens.css` / `design/brand.html` (only if the walk finds a genuinely new token needed)
      · `src/theme/readerCss.ts` (final CSS, if this walk's finding differs from 4.2-R's own styling)
      Verify: each walked item's verdict recorded plainly (PASS, or a named finding routed to § Carried
      items) — the full-scale REVISIT-RULING 2 walk gets its own explicit verdict, not folded into the
      other axes. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [§7-9; REVISIT-RULING
      2 (full-scale); D-13 (if not yet settled)]

- [ ] **8.2-R `/retro` — the milestone retrospective, including this milestone's own three-gate reopen.**
      Per the retro skill's own ritual, ALSO asking whether the fidelity-spike-first Group 1-R gate (a
      genuinely new structural shape versus the original single byte gate) held up under real use, and
      whether the spec→plan→tasks reopen sequence itself (three revisit gates, one milestone) surfaced
      anything worth naming as precedent for a future milestone's own reopen.
      Files: `docs/ai/retro.md`
      Verify: the retro's own entry is banked, dated, cites this milestone's real (reopened) task numbers.
      Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [WORKFLOW.md §7.5]

- [ ] **8.3-R Records reconcile — `progress.md`, `decisions.md`'s D-N-R-landed audit, `spec-coverage.md`, the
      final byte ledger, INPUT B's full-lifecycle closing proof.** ★ **A NEW audit against the REOPENED
      ledger (D-1-R…D-13), not the original D-1…D-12 ledger** — each D-N-R's `decisions.md` entry checked
      against whether it actually landed with its own implementing commit, the same discipline M9's own 9.3
      gap named, not repeated. The final byte ledger decomposed across every task from 1.1-R on, against the
      ~352.8/352.7 KiB / ~607.8/607.7 KiB headroom (the TRUE reopened-milestone-start figure — nothing from
      the original 1.1's katex/MathJax/tex probe ever shipped in a build, so this IS the M10-close baseline,
      restated, not re-derived). **Content-script bytes' final proof is against 3.2-R's own landed floor
      figure** (336,123 B + the tokenizer floor) — NOT 334,858 B, NOT 336,123 B alone — the reopened
      milestone's own closing invariant, discharging INPUT B's full lifecycle from rewrite through landing
      through final confirmation.
      Files: `docs/ai/progress.md` · `docs/ai/progress-archive.md` · `docs/ai/spec-coverage.md` ·
      `docs/ai/decisions.md` (only if a genuine decision landed at 8.1-R/8.2-R not already banked)
      Verify: § Baselines carries the final re-run numbers. Every D-N-R's landing commit named. `permissions:
      []` confirmed intact. Content-script bytes md5-identical against 3.2-R's own floor figure — the
      milestone's own closing proof it never moved again after landing once. Golden's own final diff — EMPTY
      except 3.2-R's own reviewed hunk — confirmed once more against the committed fixture. [the D-N-R audit;
      M9 9.3's own gap, named; INPUT B closing proof]

---

**§4 EARS coverage, reopened:** Rendering (Temml, always in scope) → tasks 3.2-R, 4.1-R, 4.2-R, 5.1-R (+
content-script clause → 4.3-R/5.1-R's import-fence proofs) · MathJax fallback → **STRUCK, N/A PERMANENTLY**
(not contingent — REVISIT-RULING 4) · Copy actions → 6.1-R, 6.2-R · Trust → 1.1-R (bytes/manifest/licence/
font-apply), 4.3-R (network, block), 5.1-R (network, inline) · Degradation → 4.3-R, 5.1-R.

**Supersession map (task level, for the record):**

| Original | Disposition | Reopened |
|---|---|---|
| 1.1 (byte gate: KaTeX+MathJax+tex) | DONE, preserved as history — caused this reopen | — (historical, not superseded) |
| 2.1 (sanitizer, KaTeX-derived) | SUPERSEDED — single Temml-derived MathML vocabulary | 2.1-R |
| 3.1/3.2 (audit + parse rule) | RE-ENTERED (tokenizer candidate reopened by D-1-R) | 3.1-R / 3.2-R |
| 4.1/4.2/4.3 (block enhancer, KaTeX) | SUPERSEDED — Temml engine + D-13 font shipped | 4.1-R / 4.2-R / 4.3-R |
| 5.1 (inline enhancer) | CARRIES mechanism unchanged, content swapped | 5.1-R |
| 6.1/6.2 (copy actions) | SIMPLIFIED — one tree, not a choice of two | 6.1-R / 6.2-R |
| 7.1/7.2 (MathJax, contingent) | STRUCK PERMANENTLY, removed | — |
| 8.1 (render timing) | CARRIES; Temml's own render-cost profile is new | 7.1-R |
| 9.1/9.2/9.3 (human close/retro/reconcile) | CARRIES, re-pointed + full-scale walk + D-N-R audit | 8.1-R / 8.2-R / 8.3-R |

**Count sealed at gate-3-revisit: EIGHT groups, FIFTEEN tasks** — 1-R (2) · 2-R (1) · 3-R (2) · 4-R (3) ·
5-R (1) · 6-R (2) · 7-R (1) · 8-R (3). Group 7 (MathJax) removed entirely, not merely unopened — the
original's own 16-of-18-if-group-7-struck count does not apply to this reopened decomposition.

**What this TASKS REVISIT does NOT do:** install `temml`, any tokenizer package, or any math font (task
1.1-R's own job); pin the bundled font family or subsetting strategy beyond what 1.1-R's own corpus makes
obvious; choose finally between `@mdit/plugin-tex` and a Temml-native alternative (1.1-R's own job); write
render code; build the extension; resolve the fidelity-and-byte gate (1.1-R/1.2-R's own fork); edit
`plan.md`, `spec.md`, or `decisions.md`; or claim gate-3-revisit approval. **Revisit-when:** a human reviews
this block against `plan.md`'s PLAN REVISIT block and either approves (a future `decisions.md` "M11 GATE 3
— REVISIT" entry, implementation resuming at task 1.1-R in a fresh session) or returns it with revisions.

---

## The original §§1–9 below (superseded in full above, except task 1.1's own `[x]`/RESULT) — preserved for provenance, read as history

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

- [x] **1.1 Install `katex`, `@mdit/plugin-tex`, and the candidate MathJax package FOR REAL; measure and
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

★ **RESULT — BRANCH (C): EVEN KATEX-ONLY BUSTS HEADROOM. RULING 1 SETTLED AS "NEITHER ENGINE SHIPS AT
CURRENT HEADROOM"; GROUPS 2–9 ARE SUSPENDED, NOT AUTHORIZED.** Measured against the fresh clean-rebuild
baseline (`.output` 4,881,585 B Cr / 4,881,701 B Fx, headroom ~352.8/352.7 KiB; zip 1,474,835/1,474,893 B,
headroom ~607.8/607.7 KiB — this session's own re-measurement, superseding the stale content-script figure
below): **(a)** `@mdit/plugin-tex`'s always-loaded floor (wired into `parse.ts`'s shared instance, scratch,
reverted) costs **+3,957 B on EACH of the content-script and app-page graphs (+7,914 B `.output` total,
both engines)** — a real, unconditional per-document tax, not a lazy cost. **(b)** `katex` ALONE, wired
exactly as task 4.3 plans (dynamic `import('katex')` + `katex/dist/katex.min.css?inline`), decomposes to
**258,852 B JS (new lazy chunk, does NOT dedupe with mermaid's own transitive `katex-B7rAX3Vi.js`, itself
unchanged at 258,879 B — arm (f) measured, dedup does NOT hold) + 29,916 B CSS text inlined into the app
chunk + 1,072,948 B of KaTeX's own font assets (59 files: 20 `.ttf` / 20 `.woff` / 19 `.woff2`, ALL THREE
formats, copied into `.output/assets/` by Vite's CSS asset pipeline once the `?inline` import is resolved)
= 1,361,716 B total**, alone, with no MathJax involved — **~3.8× the entire `.output` headroom**, and pushes
`pnpm zip` to 2,435,235 B, **338,083 B over the <2 MB bound**, alone. A woff2-only restriction (dropping the
`.woff`/`.ttf` fallback formats, both current Chrome and Firefox supporting woff2 natively) would save
816,780 B (cutting fonts to 256,168 B) but STILL leaves `.output` ~183 KB over the 5 MiB bound before the JS
chunk or CSS text are even added — reported as a data point for the human revisit, NOT adopted (subsetting
fonts is a scope decision task 1.1 is forbidden from choosing). **(c)** the verified MathJax package (see
Finding 1 below) ALONE costs **1,339,852 B, entirely JS (no separate font assets — SVG output embeds glyph
data in-module), dominated by the SVG output jax's own 1,123,223 B chunk**, and independently fails
`pnpm audit --prod` (2 HIGH vulnerabilities, below) — a second, independent disqualifier. **(d)** BOTH
combined: **2,701,471 B measured** (vs. 2,701,568 B naive sum of (b)+(c) — a 97 B non-linearity, confirming
no dedup/interaction between the two engines, expected and immaterial). **(e)** no unexpected transitive
JS weight beyond what's named in (b)/(c)/(f); MathJax's transitive dependency tree does carry unexpected
supply-chain surface (see Finding 2). **(f)** `katex`/mermaid's own transitive `katex ^0.16.45` do **NOT**
dedupe — confirmed by ablation, two separate `katex-*.js` chunks ship. Content-script bytes **336,123 B
both engines, md5-identical to HEAD across every arm** (RULING 2 holds structurally) — **a firing control
was run** (a static `import katex from 'katex'` wired into `entrypoints/peekover.content.ts`, scratch,
rebuilt: CS moved 336,123 → 595,331 B; reverted: CS restored byte- and md5-identical). **★ A base-line
divergence, flagged per standing rule #1, not silently followed either way:** this session's clean
`rm -rf .output` rebuild at HEAD `a210c37` measured content-script bytes at **336,123 B both engines**, not
the **334,858 B** this file's own standing-invariants header (and AGENTS.md) states — `.output`/zip totals
match the stated frame exactly, so the discrepancy is isolated to the CS-specific figure quoted in prose;
`pnpm install --frozen-lockfile` confirms `node_modules` matches the committed lockfile exactly (not a
drifted dependency), so the stale figure is a citation error carried in prose, not a build non-determinism
— the same shape 009's own 2.1 baseline-citation divergence took (`progress-archive.md`). This session's own
336,123 B fresh-build figure is authoritative going forward per AGENTS.md's own "your fresh clean build
re-measures and is authoritative" framing; neither this file's header nor AGENTS.md is edited here (out of
this task's Files-list fence) — carried for whoever next touches either.
**FINDING 1 — THE VERIFIED MATHJAX PACKAGE IS `@mathjax/src@4.1.3`, NOT `mathjax-full`, STATED NOT SILENTLY
SUBSTITUTED.** `mathjax-full` (npm registry, checked live) is **DEPRECATED** — `pnpm view mathjax-full
deprecated` returns *"Version 4 replaces this package with the scoped package @mathjax/src"* — latest
version 3.2.2, last published 2022-06-08, over four years stale. `@mathjax/src` is the actively maintained
v4 successor: latest 4.1.3 (published 2026-07-03), Apache-2.0, `"type": "module"` (native ESM, no CJS
interop needed), no install scripts, not deprecated. Installed and measured as the verified candidate per
Finding 1's own instruction ("install and measure it instead if it's the honest candidate, but never
silently substitute without stating it"). Wired via its documented direct-usage API
(`@mathjax/src/js/{mathjax,input/tex,output/svg,adaptors/liteAdaptor,handlers/html}.js`, resolving through
its `./js/*` → `./mjs/*` ESM export map) — SVG output chosen for the probe (no external font-asset
dependency, unlike CHTML output, which would reopen the same font-asset question as (b)).
**FINDING 2 — `pnpm audit --prod` EXIT=1, TWO HIGH-SEVERITY FINDINGS, BOTH VIA `@mathjax/src`.** Both are
`brace-expansion` DoS advisories (GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895), reached via
`@mathjax/src → mj-context-menu → rimraf → glob → minimatch → brace-expansion` — `mj-context-menu` is a
right-click accessibility/context-menu FEATURE of MathJax this milestone would never wire up (spec §6's own
IS-NOT list excludes any authoring/interactive surface for math), but it ships as a hard (non-optional)
dependency of `@mathjax/src`, so its own vulnerable sub-tree comes along regardless. This is a SECOND,
INDEPENDENT disqualifier for the MathJax arm, on top of (c)'s byte cost — not reached in the branch decision
below because (b) alone already settles it, but recorded so a future revisit does not re-discover it.
**GOVERNED INSTALL, ASSERTED:** `Object.keys(pkg.dependencies).length` **6 → 9** (`+@mathjax/src`,
`+@mdit/plugin-tex`, `+katex`), asserted programmatically, not eyeballed. Licences: `katex` MIT,
`@mdit/plugin-tex` MIT, `@mathjax/src` Apache-2.0 — no `preinstall`/`install`/`postinstall` script on any of
the three (their own `scripts` are dev-only build/test/lint entries; `katex`'s `prepare: husky` does not run
for a registry-installed dependency). `pnpm why --prod dompurify`: **one resolved copy** (`dompurify@3.4.13`,
shared by `mermaid` and the root) — the 007 1.1 dedupe-gate shape holds. SBOM regenerated:
**186 runtime components** (`sbom.cdx.json`, gitignored/transient per its own header — NOT staged, correcting
this kickoff's assumption that it is a committed artifact), license roll-up MIT 126 / ISC 35 / BlueOak-1.0.0
7 / BSD-3-Clause 7 / Apache-2.0 6 / MPL-2.0-OR-Apache-2.0 1 / BSD-2-Clause 1 / Python-2.0 1 / Unlicense 1 /
Unknown 1 (one package's licence not resolved — a carried item, not chased here). A structurally distinct
finding while regenerating: 17 packages (mostly `@mathjax/src`'s own tree — `commander` appears **twice**,
i.e. two distinct versions coexist, a duplicate the SBOM surfaced but did not create) report "no integrity
hash" from `generate-sbom.ts`'s lockfile scan — its regex does not match peer-dependency-suffixed
`pnpm-lock.yaml` keys (e.g. `@mdit/plugin-tex@1.1.0(markdown-it@14.3.0)`), a pre-existing limitation newly
exposed by this task's peer-dependency chain, out of this task's Files list (`generate-sbom.ts` is not
touched), carried for whoever next revisits that script. **A NON-BLOCKING API-SHAPE NOTE, informational
only (task 3.2's own job to resolve, not this task's):** `@mdit/plugin-tex`'s installed version (1.1.0)
declares a **mandatory `render` option** (`md.use(tex, {render: fn})` throws without one) — a different
shape than D-1's "tokenizer-only, our own renderer.rules on top" framing assumed. Probed live: after
`md.use(tex, {render: <stub>})`, `md.renderer.rules['math_inline']`/`['math_block']` **are** present and
overridable exactly as D-1/task 3.2 plans — so the mandatory option is satisfiable with a throwaway
no-op function, not a "not usable standalone" blocker; flagged for 3.2 to verify directly rather than
re-derive from scratch. `@mdit/plugin-tex` also declares a peer dependency on `markdown-it@^15.0.0`
(this repo pins `^14.3.0`, installed `14.3.0`) — pnpm warns but does not block, and the plugin functions
against 14.3.0 in the probe above; flagged, not resolved (a `markdown-it` version bump is outside this
task's Files list and its own ripple is unassessed).
**ACCEPTANCE — BRANCH (C).** Per this task's own literal branch text: *"every remaining task in this file
is SUSPENDED; the commit is the LAST one in this milestone until a human-reviewed spec revisit... reopens
it."* **Groups 2–9 are NOT authorized by this commit.** Per this task's own explicit flag, the disposition
of the three installed packages (`katex`, `@mdit/plugin-tex`, `@mathjax/src` — keep installed for the
revisit's convenience, or revert to 6 dependencies) is **NOT decided here** — branch (B)'s text names an
explicit MathJax revert; branch (C) is silent on all three, and no keep-or-revert step is invented. **This
commit ships all three installed (`dependencies` 6 → 9)**, `package.json`/`pnpm-lock.yaml` left exactly as
the governed install produced them, pending the human's own call at the revisit. `git diff
tests/golden/output/` **EMPTY**. Manifest **654 / 770 B**, `permissions: []`, no
`web_accessible_resources` — confirmed unmoved even with KaTeX's fonts wired in the scratch probe (its
`/assets/...` URLs resolve same-origin within the privileged app page; the hard-stop did NOT fire).

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
      formulas as MathML" action (§8-1 ruled (b)). ★ UI PLACEMENT RULED at gate 3 (`decisions.md`'s M11
      GATE 3 entry) — a PANEL/MENU-ROW action, never a toolbar button and never a keyboard shortcut; this
      task places the exact row/label/menu-location within that ruled shape, not the shape itself.** Copy-
      as-LaTeX for inline math is VERIFIED, not built: the `<code class="peekover-math-inline">` element's
      own text content at rest is the literal `$…$` source (D-7), so ordinary browser text-selection + copy
      already satisfies §4's "copy the exact source LaTeX as authored" with zero new code — this task's job
      is to prove that, not to write a handler for it. Copy-as-MathML is a NEW document-level action (one
      action, covering every formula in the document, block and inline) that walks every `<math>` element
      post-render and serializes them, reusing `XMLSerializer`, task 6.1's own mechanism, generalised to
      "all," not "one." Its trigger's placement is RULED (gate 3): a panel/menu-row action wherever the
      app-page's existing action affordances already live (the M10 export-panel precedent, or the
      equivalent menu surface) — never prime toolbar real estate (a rare, document-level, export-shaped
      action, not a frequent one) and never a global keyboard shortcut (§3.10's anti-clutter posture, §4's
      no-new-global-single-key-shortcut constraint). This task's own decision is confined to the exact
      row/label/menu-location within that ruled shape, recorded in the commit.
      Files: `src/render/mathView.ts` (the document-level MathML-collection function) · the panel/menu-row's
      host module (an existing chrome module carrying the app-page's action affordances — task-time choice
      of exact row/label, named in the commit) · `tests/browser/mathActions.browser.test.ts` (inline half,
      additive to 6.1's file)
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
