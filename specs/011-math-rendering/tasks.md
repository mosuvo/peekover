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

- [x] **1.1-R Resolve the tokenizer fork (D-1-R); govern the dependency set (revert `katex`/`@mathjax/src`,
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

★ **RESULT — TOKENIZER RETAINED (`@mdit/plugin-tex`), DEPS 9→8, FONT CHOSEN (STIX Two Math), BOTH AXES-
FEEDING FIGURES MEASURED — FITS, BUT ~33 KiB `.output` HEADROOM REMAINS ON BOTH ENGINES (down from
~352.8/352.7 KiB), FLAGGED FOR 1.2-R'S OWN FORK.** Fresh `rm -rf .output` rebuild at HEAD `e378bd2`
re-confirmed the exact frame this task's own kickoff stated: `.output` 4,881,585 B Cr / 4,881,701 B Fx
(headroom ~352.8/352.7 KiB), zip 1,474,835/1,474,893 B (headroom ~607.8/607.7 KiB), content-script
336,123 B both engines — nothing has drifted since the original 1.1.
**D-1-R TOKENIZER FORK — `@mdit/plugin-tex` CONFIRMED, NO TEMML-NATIVE ALTERNATIVE ADOPTED.** Both real
Temml-markdown-it candidates found on npm (`markdown-it-temml` / `@traeblain/markdown-it-temml`, and
`markdown-it-math`'s own `markdown-it-math/temml` export) were inspected at the source level (not from
memory): both register `md.renderer.rules['math_inline']`/`['math_block']` that call
`temml.renderToString()` **synchronously inside the render rule** — i.e. `md.render()` itself produces
final HTML, exactly the parse-time-render coupling D-1 rejected for `@mdit/plugin-katex`. Neither is a
tokenize-only candidate. `@mdit/plugin-tex` (already installed, unreverted since the original 1.1) is
therefore CONFIRMED as the resolved candidate — unchanged from D-1, only re-verified against Temml's own
current docs rather than inherited. The `markdown-it@^15.0.0` peer-dep-vs-`14.3.0` risk (carried plan-input
(2)) was exercised concretely against the ACTUAL installed plugin on 14.3.0 with a 51-formula corpus
(price `$5`/`$10` — no false positive; escaped `\$5` — no false positive; `` `echo $HOME` `` and
`` `code $notmath` `` code-spans — correctly excluded even adjacent to real math; standalone `$$...$$`
block math AND a ` ```math ` fence — both correctly recognized as `math_block`, confirming D-8-R's shared
mechanism; a table cell containing `$5` — no false positive; an unbalanced single `$` — no false positive,
no crash). Zero misclassifications. The risk is exercised, not closed by assumption — it remains a
version-string mismatch pnpm warns on but does not block, with no observed correctness defect.
**DEPENDENCY GOVERNANCE.** `katex` and `@mathjax/src` removed; `temml@0.13.5` installed for real.
`Object.keys(pkg.dependencies).length` **9 → 8**, asserted programmatically:
`['@mdit/plugin-tex','diff','dompurify','markdown-it','markdown-it-task-lists','mermaid','shiki','temml']`.
`pnpm audit --prod` **EXIT=0** (the two `@mathjax/src`-borne HIGH advisories are gone with the package).
`temml`: MIT, ESM+CJS dual export, no install scripts, `sbom.cdx.json` (regenerated, gitignored/transient,
NOT staged) confirms 168 runtime components (down from 186) with a resolved SHA-512 integrity hash.
`pnpm why --prod dompurify`: one resolved copy (`dompurify@3.4.13`), dedupe gate still holds.
**D-13 FONT — FAMILY CHOSEN HERE (not deferred): STIX Two Math.** A 51-formula representative corpus
(fractions, nested radicals, single/double/triple/contour integrals, sum/product/coproduct/big-union-
intersection, five matrix delimiter styles, `\left`/`\right` and four `\Bigl`-family nested stretchy
delimiter sizes, nested sub/superscripts, the full lowercase+uppercase Greek alphabet, relations, set ops,
`\nabla`/`\lim`/accents/over-under-braces, all eight math alphabet styles incl. the full A–Z under
`\mathbb`/`\mathcal`/`\mathfrak`, named functions, arrows, digits) rendered through the REAL installed
`temml` yields 313 distinct required codepoints (218 non-ASCII + printable ASCII). Full-glyph-set source
TTFs for both plan-named non-deferred candidates were fetched from `google/fonts` (OFL-licensed,
`ofl/stixtwomath/STIXTwoMath-Regular.ttf` 1,517,976 B; `ofl/notosansmath/NotoSansMath-Regular.ttf`
1,015,396 B — NOT the fontsource npm packages' own pre-subsetted "latin" files, which cover only
`U+0000-00FF`-ish ranges and are missing essentially every math-specific codepoint; a finding worth
flagging for whoever next reaches for a "fontsource math font" package expecting a usable source). Coverage
against the 313-codepoint set: **STIX Two Math misses only U+FE0E** (a zero-width variation selector,
needs no glyph) — effectively 100%. **Noto Sans Math misses 5**, three of them real accent glyphs actually
used by the corpus (U+00A8 diaeresis/`\ddot`, U+02D9 dot-above/`\dot`, U+203E overline/`\bar` — all common
LaTeX accents) plus two zero-width non-issues. This is the "clearly superior" case plan (h)/1.1-R's own text
names — STIX Two Math chosen now, not deferred to 8.1-R. Subsetted with `fonttools` `pyftsubset`
(`--unicodes` the exact 313-codepoint set, `--layout-features='*'`, `--no-hinting`, `--flavor=woff2`);
verified post-subset: `MATH` table intact (fontTools' subsetter closes the glyph list over it, pulling in
stretchy-delimiter size-variant glyphs the `MathVariants` subtable references), 1115 glyphs, 318 cmap
entries, coverage gap unchanged at exactly `U+FE0E`. Result: **86,224 B** raw WOFF2, committed at
`assets/fonts/stix-two-math-subset.woff2`; `assets/fonts/OFL.txt` gained STIX's own copyright/RFN block
(OFL-1.1, same license family as Literata's existing entry).
**★ THE FONT-WIRING MECHANISM — D-13'S OWN TEXT WAS WRONG, FLAGGED, NOT SILENTLY FOLLOWED.** D-13/this
task's own sealed text assumes "the shadow-root CSS-injection pattern's own `@font-face`." This project's
OWN existing, already-shipped font module (`src/theme/fonts.ts`, header comment) documents a **prior, real
finding that contradicts that assumption**: "Chromium does not reliably apply `@font-face` declared inside
a shadow tree," which is why Literata is registered via the CSS Font Loading API
(`document.fonts.add(new FontFace(...))`) instead — a mechanism that "participate[s] in font matching for
the WHOLE document, shadow trees included, in both Chrome and Firefox." Per AGENTS.md's "verify against
real behavior, not memory/assumption" rule, THIS task adopted the already-proven `document.fonts.add()`
mechanism for the math font too, not the sealed text's assumed shadow-root `@font-face` rule. This is a
real divergence from plan.md/tasks.md's own sealed D-13 text, flagged here rather than smoothed over;
`plan.md`/`decisions.md` are not edited by this task (out of Files list) — whoever lands D-13 for real at
4.2-R should carry `document.fonts.add()` forward, not the sealed text's `@font-face` framing.
**INPUT A — DISCHARGED, REAL-ENGINE, BOTH AXES.** A scratch module (`src/theme/mathFontScratch.ts`,
reverted before commit) registered the subsetted font via `document.fonts.add()` under a test family name.
A real-engine browser test (`tests/browser/mathFontProbe.browser.test.ts`, reverted before commit; ran
under `pnpm test:browser`, Chromium AND Firefox, 4/4 passed) proved: (1) `document.fonts.check()` resolves
true for the registered family; (2) inside a `{mode:'open'}` shadow root (D-3-R's own app-page context), a
`canvas.measureText()` glyph-advance measurement for U+2211 (∑) at 200px matches the font's OWN real
`hmtx`-reported advance (936/1000 em → 187.2px) to sub-pixel tolerance, on BOTH engines — a rendering-level
proof, not a declared-CSS-string check. **Negative control**: a `FontFace` with a garbage base64 `src`
(`document.fonts.check()` → `false`; the same glyph measurement falls back to the generic stack and does
NOT match 187.2px), on both engines — the proof is non-vacuous. No `web_accessible_resources` needed: the
font is `?inline`-imported (base64 `data:` URI, same mechanism as Literata), never a fetchable extension
URL — confirmed by inspecting the built chunk directly, not assumed from KaTeX's own precedent.
**BYTE DECOMPOSITION — (a)–(d), ABLATED, ARM-BY-ARM, REVERTED BETWEEN ARMS.** **(a) `temml`'s own JS**
(scratch dynamic `import('temml')` from an app-page-only call site, `appShell.ts`, reverted): one new lazy
chunk, **204,010 B**, `.output` total +204,117 B both engines (a 107 B non-linearity from chunk-manifest
overhead, immaterial) — content-script bytes UNMOVED (336,123 B, RULING 2 holds structurally: `temml` never
reaches that graph via this call site). **(b) the tokenizer's own always-loaded floor** (scratch
`md.use(tex,...)` wired into `parse.ts`'s shared instance, reverted) — **THE figure INPUT B's rewritten
invariant cites**: content-script bytes **336,123 → 340,082 B, i.e. +3,959 B**, identically on both
engines (a 2 B non-linearity vs. the original 1.1's own +3,957 B figure, from an incidental patch-version
drift in `@mdit/plugin-tex`/`markdown-it` since that measurement — this session's own **+3,959 B** figure
is the one 3.2-R must land against, per AGENTS.md's "fresh build re-measures and is authoritative" rule);
`.output` total +7,918 B both engines (the SAME +3,959 B tax landing independently on both the
content-script graph AND the app-page graph, since `parse.ts` is shared by both — confirms plan's own
"on BOTH graphs" framing). Firing control: wired → CS md5 moved off `f4370ed3…`/`13dda867…`; reverted → CS
byte- and md5-identical restored (both engines). **(c) the subsetted font's own bytes** (scratch dynamic
`import('../theme/mathFontScratch')` from `appShell.ts`, reverted): one new lazy chunk, **115,217 B**
(86,224 B raw WOFF2 at ~4/3 base64-inline expansion + a small JS wrapper), `.output` total +115,356 B both
engines — content-script bytes UNMOVED. **(d) all combined** (all three scratch wirings simultaneously,
reverted together): `.output` **5,208,909 B Cr / 5,209,025 B Fx** — i.e. **+327,324 B both engines** (vs.
327,391 B naive sum of (a)+(b)+(c), a 67 B non-linearity from shared dynamic-import runtime-shim dedup
across the two `appShell.ts` scratch edges, immaterial); content-script **340,082 B both engines** (the (b)
tax only, confirming (a)/(c) stay app-page-only in combination too). **FIT VERDICT, BOTH ENGINES: FITS, ON
A KNIFE EDGE.** `.output`: 5,242,880 − 5,208,909 = **33,971 B (33.2 KiB) Cr headroom**; 5,242,880 −
5,209,025 = **33,855 B (33.1 KiB) Fx headroom** — down from ~352.8/352.7 KiB, i.e. **~90% of the original
headroom is now spent**, before groups 2-R–8-R add a single byte of sanitizer/enhancer/copy-action code.
`pnpm zip`: chrome 1,624,289 B / firefox 1,624,347 B — headroom ~461.8/461.7 KiB against `<2 MB`, comfortable
(zip compresses the base64-bloated font chunk well). **★ Flagged plainly for 1.2-R's own fork, not decided
here**: the byte axis technically FITS on both engines (positive headroom), but the `.output` margin is thin
enough that 1.2-R should weigh it explicitly alongside the fidelity walk — a bust from any later group's own
code is a live risk this task's own numbers make visible, not a comfortable margin the way the original 1.1
Branch (A)/(B) numbers would have been.
**§7 FONT-DISPOSITION TAKEN: THE RECOMMENDED READING, CONFIRMED CONSISTENT WITH 4.2-R'S OWN TEXT.** Per this
task's own §7 flag: COMMITTED here — `package.json`, `pnpm-lock.yaml`, the subsetted font ASSET file
(`assets/fonts/stix-two-math-subset.woff2`), `assets/fonts/OFL.txt`'s attribution addition. REVERTED before
commit (scratch, per the original-1.1 `_scratchMathProbe` discipline) — `src/theme/mathFontScratch.ts`, the
`tests/browser/mathFontProbe.browser.test.ts` INPUT A test, and every scratch call-site edit to
`parse.ts`/`appShell.ts` used for the byte-decomposition ablations above. This matches 4.2-R's own "the font
Group 1-R spiked in scratch is wired into `readerCss.ts` ... for real ... rather than a reverted probe" text
exactly — the font ASSET persists from 1.1-R to 4.2-R; its CSS/registration wiring and its durable test are
built fresh, for real, at 4.2-R (now using `document.fonts.add()`, per the mechanism finding above, not
`readerCss.ts`'s own inline CSS the way D-13's text assumed — 4.2-R's own Files line naming `readerCss.ts`
will need to route through `fonts.ts`'s own registration module instead, flagged for that task). No scratch
code leaks into this commit: `git status` after revert showed only the intended paths.
**STANDING INVARIANTS.** Golden EMPTY. Manifest **654 / 770 B** both engines, `permissions: []`, no
`web_accessible_resources` — confirmed unmoved even with the font's `?inline` data URI wired in the scratch
probe. `pnpm lint` EXIT=0. Full `pnpm test` (unit): 1053/1056 passed — the 3 pre-existing `codeDetect`
failures (banked corpus count/split/miss, driven by `plan.md`'s own PLAN REVISIT block adding two fenced
fragments the accuracy corpus scans) are UNCHANGED at exactly 3, not 4+, and not caused by this task's own
diff (this task touches no file that corpus scans). 007/009 import fences: 8/8 + 9/9, all 17 green. Real-
engine `pnpm test:browser` run for INPUT A: 4/4 passed, Chromium + Firefox.
**ACCEPTANCE.** Both Group-1-R axes this task owns (byte measurement, INPUT A) are DISCHARGED. This task
does NOT decide PROCEED/CLOSE-M11 — that is 1.2-R's own fork, next. `git diff tests/golden/output/` EMPTY.

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

- [x] **2.1-R `SANITIZE_MATH_CONFIG` / `sanitizeMath` — ONE MathML-only vocabulary, enumerated against REAL
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
`cleanMathStyle`'s OPEN QUESTION RESOLVED THE OPPOSITE WAY THE TASK'S OWN "IF ABSENT" TEXT NAMED: `style`
IS PRESENT, A FILTER WAS BUILT. 24 TAGS / 25 ATTRS ENUMERATED AGAINST 97 REAL RENDERED FORMULAS, BOTH
BYTE-AXES ZERO-DELTA, BOTH ENGINES.** `SANITIZE_MATH_CONFIG`/`sanitizeMath`/`MATH_ALLOWED_TAGS`/
`MATH_ALLOWED_ATTR`/`hasDeniedMathStyleToken` landed in `src/render/sanitize.ts`, additive only, following
`sanitizeSvg`'s own third-profile construction (allow-list as data, a scoped `uponSanitizeAttribute` hook
for the one procedural filter, `/*#__PURE__*/ …slice()` for content-script tree-shaking).
**ENUMERATION — 24 tags, 25 attrs, against 97 real `temml@0.13.5` renders** (`sanitize.test.ts`'s own
`MATH_SURVEY_CORPUS`: the 1.2-R harness's 48-formula dense corpus + its 10 inline samples, plus 39 formulas
this task added — `\color`/`\textcolor`/`\colorbox`/`\fcolorbox`/`\boxed`/`\overline`/`\underline`/
`\cancel`/`\bcancel`/`\xcancel`/`\sout`/`\fbox`/`\phase`/`\textcircled`/`\angl`/`\longdiv`/`\reflectbox`/
`\raisebox`/`\kern`/`\llap`/`\rlap`/`\cancelto`/`\hphantom`/`\vphantom`/`\text`/`\textbf`/`align`/`cases`/
`array`/`\overset`/`\underset`/`\stackrel`/`\substack`/`\xrightarrow`/`\xleftarrow`/`\binom`/`\pmod`/`\tag` —
to reach producers the fidelity corpus never exercised). Zero render errors across all 97
(`throwOnError: true`, Temml's own default `trust`/`annotate`, both `false`). Tags: `math`, `menclose`,
`mfrac`, `mi`, `mn`, `mo`, `mover`, `mpadded`, `mphantom`, `mroot`, `mrow`, `mspace`, `msqrt`, `mstyle`,
`msub`, `msubsup`, `msup`, `mtable`, `mtd`, `mtext`, `mtr`, `munder`, `munderover`, plus **`span`** (see
below). `semantics`/`annotation` — D-5's own KaTeX-derived hypothesis — CONFIRMED ABSENT (`annotate`
defaults `false`, verified against `temml`'s own `Settings.js`), not carried forward.
**★ D-5-R's OWN "every tag Temml emits is a MathML tag" claim HOLDS ALMOST, NOT ENTIRELY — ONE MEASURED
EXCEPTION.** `\begin{align}`'s equation-numbering hook emits `<mtext><span class="tml-eqn"></span></mtext>`
— a genuine HTML tag embedded inside the MathML tree at an `mtext` text-integration point (verified against
DOMPurify 3.4.13's own `MATHML_TEXT_INTEGRATION_POINTS` handling, not assumed). It carries only `class` in
every survey render. Admitted (`span`), stated as a real, harmless, producer-confirmed exception rather than
smoothed into the tag list silently.
**★ `cleanMathStyle`'S OPEN QUESTION — RESOLVED, AND THE OPPOSITE WAY THE BYTE-FORECAST SPIKE'S OWN
10-FORMULA PROBE HAD ALREADY FOUND (progress.md, 2026-09-07): `style` IS PRESENT.** Real properties across
97 formulas: `border`, `bottom`, `color`, `display`, `left`, `math-depth`, `padding`, `padding-left`,
`padding-right`, `position`, `right`, `transform`, `width` — layout metrics, keywords, and validated
colours, never a URL. `hasDeniedMathStyleToken` denies any `url(`/`expression(` token at an
identifier-boundary (mirrors `cleanSvgCss`'s own `CSS_IDENT_CHAR` boundary test, without its
comment/escape/fixpoint machinery — a `style` ATTRIBUTE value has no rules to reason about, so a plain
substring scan suffices), wired as a hook scoped around `sanitizeMath`'s own call, exactly like `cssPassHook`
is scoped around `sanitizeSvg`.
**★ A GENUINE DIVERGENCE FROM D-5-R's/D-5's OWN "STRUCTURALLY IMPOSSIBLE" FRAMING, MEASURED NOT CARRIED
FORWARD.** `\color`/`\textcolor`/`\colorbox`/`\fcolorbox` are NOT gated by `trust` (no `isTrusted` check
anywhere in `functions/color.js`, read from the real installed source) and DO let LaTeX source reach a
`style` value's text (`\color{red}x` → `style="color:#ff0000;"`). What DOES hold, measured: `validateColor`'s
own regex (`/^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i`) admits only a hex triplet or ASCII letters — no `(`,
no `:`, no `;` — so no real producer can ever place a `url(`/`expression(` token in a `style` value.
`hasDeniedMathStyleToken` is real defense-in-depth for exactly this gap, not a response to an unreachable
threat. Separately confirmed (all six BLOCKED under Temml's own default `trust: false`, exercised not
trusted): `\href`/`\url` are unsupported function names outright; `\class`/`\id`/`\style`/`\data`/
`\includegraphics` all throw `Function "…" is not trusted`.
**HOSTILE CORPUS — NEUTRALISED.** A disallowed MathML element (`mglyph`, survey-absent); `<annotation>`
carrying markup (`<b onclick=…>`) — the whole wrapper denied by absence, no injected markup survives; a
bare `<a href="javascript:…">`; an attempted `href`/`src` on an allowed element; a `style` value carrying
`url(`; a `style` value carrying `expression(`; a boundary check proving `curl(` is NOT mistaken for `url(`
(no false positive); a fresh NO-HOOK DOMPurify instance proving the style filter — unlike the `data:`
denial — genuinely IS hook-load-bearing (the allow-list alone admits `style`, so an un-hooked run is NOT
clean, the opposite finding from the SVG profile's own §2.2 mirror, stated so a reader does not assume the
same "allow-list-driven, hook-independent" shape here).
**ZERO-STRIP, MEASURED.** `sanitizeMath` is a byte-identical no-op on all 97 real corpus renders (modulo
DOMPurify's own `&nbsp;`-entity re-serialization of a literal U+00A0, a measured serialization choice, not
a stripping difference).
**DOCUMENT + SVG PROFILES — BYTE-IDENTICAL, PINNED, NOT JUST DIFFED BY EYE.** `sanitize.test.ts` already
pinned the document profile's three consts; this task ADDS the equivalent pin for `SVG_ALLOWED_TAGS`/
`SVG_ALLOWED_ATTR`/`SANITIZE_SVG_CONFIG` (absent until now) — all three asserted byte-identical to the
pre-task source text.
**BYTES — ZERO DELTA, BOTH AXES, BOTH ENGINES, MEASURED WITH A FIRING CONTROL.** Fresh `rm -rf .output`
rebuilds: content-script **336,123 B**, md5 `f4370ed3…` Cr / `13dda867…` Fx — UNMOVED, both engines.
`.output` total **4,881,585 B Cr / 4,881,701 B Fx** — UNMOVED, both engines (this task's own code tree-shakes
to zero bytes on the app page too, since `sanitizeMath` has no call site until group 4-R). Manifest
**654 / 770 B**, `permissions: []`, both engines. **Firing control**: a scratch static import of
`sanitizeMath` wired into `appShell.ts` behind a never-true `window.__PEEKOVER_SCRATCH_MATH_SANITIZE__`
flag (reverted before commit) moved `.output` Cr from 4,881,585 → 4,882,773 B (**+1,188 B**) with the
content script UNMOVED — proving the zero real-build delta is genuine tree-shaking, not an accidental
non-build. `git status` after revert showed only `sanitize.ts`/`sanitize.test.ts` changed.
**STANDING INVARIANTS.** `pnpm lint` EXIT=0. Full `pnpm test`: 1082/1085 passed — the SAME 3 pre-existing
`codeDetect` failures as HEAD `21e8488` (confirmed via `git stash`, IDENTICAL failure set before and after
this task's diff: corpus n=28 not 26, 21/7 split not 19/7, one miss at `specs/011-math-rendering/plan.md:790`
— a real drift from this file's own header text and from this task's kickoff, which both assumed 1.1-R's
stale "exactly 3, not 4+" framing without re-stating the actual numbers; NOT caused by this task, which
touches no file the corpus scans). Golden `git diff` EMPTY. 007/009 import fences (`codeImportFence.test.ts`,
`diagramImportFence.test.ts`) green, part of the same full-suite run.
**DIVERGENCE FROM THE KICKOFF, FLAGGED:** the kickoff's own §3 speculated Temml emits `<semantics>`/
`<annotation>` "the MathML-standard way" and proposed admitting them for a future copy-as-LaTeX-from-the-tree
mechanism. Measured: real default-config Temml does NOT emit either (`annotate: false`), and D-6-R's own
sealed text already routes copy-as-LaTeX through the RETAINED SOURCE TEXT, never the rendered tree — so
this task did not admit them. Not a gap; a corrected assumption, per this task's own instruction to follow
`tasks.md`'s own text over the kickoff's prose where they disagree, and `tasks.md`'s own text names no
`annotation`/`semantics` requirement.

*Group-2-R acceptance (plan (h)): the hostile corpus (built from Temml's REAL output, not KaTeX's) is
neutralised; `cleanMathStyle`'s open question resolved as found, one way or the other, stated plainly.*

## 3-R — The golden-fixture audit + the parse-stage rule (D-1-R) — GOLDEN GROWS HERE

- [x] **3.1-R ★ THE GOLDEN-FIXTURE AUDIT, RE-ENTERED — READ-ONLY, before the parse rule lands.** The
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
ZERO EXISTING GOLDEN FIXTURES CONTAIN A LITERAL `$`; THE RECOGNITION GRAMMAR WAS INSTEAD VERIFIED FRESH,
EMPIRICALLY, AGAINST THE REAL INSTALLED `@mdit/plugin-tex@1.1.0` + `markdown-it@14.3.0`, AND A CONCRETE
3.2-R DRAFTING DEFECT WAS SURFACED: THE FENCE-MATH PATH IS NOT COVERED BY OVERRIDING
`renderer.rules['math_inline']`/`['math_block']` ALONE.**

**THE ENUMERATION — every file under `tests/golden/**` grepped for a literal `$`, by path:**
`fixtures/broken.md`, `fixtures/code.md`, `fixtures/diagrams-10.md`, `fixtures/diagrams-50.md`,
`fixtures/gfm-torture.md`, `fixtures/headings-inline.md`, `fixtures/images.md`, `fixtures/inline-html.md`,
`fixtures/links.md`, `fixtures/malicious.md`, `fixtures/nesting.md` — **zero matches, all eleven**. The
generated ~1 MB huge-doc fixture (`hugeDoc.ts`'s `buildHugeDoc()`, golden.test.ts's tenth case) was read in
full: every `$` in that file is JS template-literal interpolation syntax (`${i}`) inside `hugeDoc.ts`'s own
source, and the MARKDOWN TEXT it emits (headings/prose/table cells/a fenced `js` block/a blockquote, all
index-derived) contains no literal `$` byte anywhere in its output — confirmed by reading the generator, not
inferred from the interpolation syntax alone. **`golden.test.ts` itself** was also grepped (it is not a
fixture, but is part of `tests/golden/**`): its own two `$` occurrences are template-literal syntax in test
code (`` `${name}.md` ``, `` `${source.length}B ... sha256=${digest}` ``), not markdown content.
**Classification: N/A — the corpus to classify is empty.** matches-and-should: none. matches-and-should-not:
none. does-not-match: none. This is itself the headline finding, not a null result to gloss over: the
existing 10-case golden corpus (8 `FIXTURES` array entries + `images` + the huge-doc; `diagrams-10.md`/
`diagrams-50.md` exist on disk but are not wired into `golden.test.ts`'s own snapshot set — confirmed by
reading the file, they serve a perf fixture elsewhere) carries **zero false-positive/false-negative risk**
from the new tokenizer landing at 3.2-R. 3.2-R's own "`git diff tests/golden/output/` reviewed, not empty"
expectation is about the ONE NEW fixture it commits, not a diff against any of these ten.

**THE GRAMMAR — VERIFIED EMPIRICALLY, REAL PACKAGES, THIS SESSION (not inherited from 1.1-R's own prior
probe, per this task's own "never trusted across the suspend/reopen boundary" instruction), via a scratch
`.mjs` script at the repo root using the actual installed `@mdit/plugin-tex@1.1.0` + `markdown-it@14.3.0`,
reverted before this commit (`git status` after revert showed nothing).** Real ruler inspection
(`md.inline.ruler.__rules__`/`md.block.ruler.__rules__`, printed directly): the tex plugin registers
`math_inline_dollar` via `ruler.after('escape', ...)` — landing between `escape` and `backticks` in the
inline chain — and `math_block_dollar` via `ruler.after('blockquote', ...)`, landing after `fence` in the
block chain. **§7-5's own named risk (does inline-code consume its span's interior before the math rule can
see it) is CONFIRMED, both directions, by rendered output, not by ruler-order reasoning alone**: `` `echo
$HOME` `` → `<code>echo $HOME</code>` (no math wrapper); `` `code $notmath` `` → `<code>code
$notmath</code>`; real math immediately before a code span (`Real math $x$ then code \`$HOME\` after.`) and
immediately after one (`Code \`$HOME\` then real math $x$ after.`) both resolve each span correctly and
independently — the code span's own `backticks` rule consumes its interior as one token before any `$`
inside it is ever visited by the math rule, regardless of the two rules' relative ruler position (each rule
only attempts at its own leading character, so there is no ordering conflict between them here — stated as a
confirmed non-issue, not left as an assumption). A plain (non-`math`) fenced code block containing `$HOME`
renders untouched (`<pre><code>echo $HOME\n</code></pre>`) — `mathFence` intercepts only `info === 'math'`.
Other cases, all matching 1.1-R's own 51-formula corpus findings, now re-confirmed independently: `$5`/`$10`
prices with no closing `$` on the same line → literal, no false positive (including the two-dollar-sign
case `"Item A is $5 and item B is $10."`, which does NOT misfire as a spanning match — the plugin's own
adjacent-whitespace guard, the same shape as emphasis-delimiter rules, rejects a closing `$` preceded by a
space); escaped `\$5` (single and both-sided) → literal, `markdown-it`'s own `escape` rule fires first
(consistent with the observed ruler order, `escape` immediately before `math_inline_dollar`); a `$5` GFM
table cell → literal; an unbalanced lone `$` → literal, no crash; genuine `$x$` inline, `$$...$$` block, and
a ` ```math ` fence all recognized correctly, the block and fence forms producing IDENTICAL token shapes
downstream of the plugin's own tokenizing (confirming D-8-R's shared-mechanism premise at the tokenizer
level, ahead of 4.2-R's own DOM-shape proof). **Zero misclassifications**, matching 1.1-R's own zero-defect
result on the equivalent corpus.

**★ A CONCRETE, VERIFIED DRAFTING-TIME DEFECT IN 3.2-R'S OWN TEXT, SURFACED BY THIS AUDIT'S "PREDICT WHAT
3.2-R WILL PRODUCE" MANDATE.** `md.parse()`'s own token stream shows the ` ```math ` fence produces a token
of type `fence` (`info: 'math'`) — NOT a `math_block` token; only the bare `$$...$$` form produces
`math_block`. The installed plugin registers renderer overrides for THREE keys —
`Object.keys(md.renderer.rules)` shows `fence`, `math_inline`, `math_block` — and its own `fence` override
is what inspects `info === 'math'` and (only in that branch) calls the plugin's `render` option; a non-math
fence falls through to ordinary fenced-code rendering via that same override. **A scratch reproduction
proved this concretely**: overriding ONLY `md.renderer.rules['math_inline']`/`['math_block']` (exactly
3.2-R's own stated plan — "no `temml` import... emit the markers ONLY," silent on `fence`) with a
throwaway `render` stub passed to `md.use(tex, ...)` (mirroring 1.1-R's own "supplying a throwaway stub"
technique) correctly produces the intended marker for `$x$` and `$$...$$`, but the ` ```math ` fence renders
as the **literal throwaway-stub string** — because that path never reaches the overridden `math_block` key
at all; it is owned entirely by the plugin's own untouched `fence` override, which still calls the stub
`render` option. **This means 3.2-R's Files/Verify text, as currently worded, will silently under-cover the
fence-math case** — D-8-R's own "block and fence share machinery" premise holds at the DOM/enhancer level
(4.2-R) but does NOT hold for granted at the PARSE-RULE level without an explicit `fence`-key wrap (route
`info === 'math'` through the same marker logic as `math_block`, else delegate to markdown-it's own default
fence rendering) — or, as the only other viable fix this audit found, by making the `render` OPTION itself
(not a separate `renderer.rules` override) the single place that emits the marker shape for all three token
kinds uniformly. **Not resolved here** (this task is read-only) — flagged as a concrete correction 3.2-R's
own kickoff/drafting must make, with the exact failure mode and both candidate fixes named, not left as a
vague "watch out for fences" caution.

**THE BEHAVIORAL COUSIN — PRICED, AS ITS OWN LINE, PER THE GATE-2-REVISIT RULING (INPUT B).** Once 3.2-R
lands the parse rule on `parse.ts`'s SHARED `md` instance, a `$x$`/`$$...$$`/` ```math ` span in a
`file://`-opened document rendered by the CONTENT-SCRIPT reader will emit the SAME passthrough marker
(`<code class="peekover-math-inline">$…$</code>` etc.) that the app-page reader gets — but `enhanceMath`
never runs there (D-3-R is app-page-only, §9-2 holds, RE-CONFIRMED by reading `mount.ts`'s own call sites:
no `enhanceMath`/`enhanceDiagrams`-shaped call exists outside `readerPane.ts:187`/`appShell.ts:170`), so it
renders as inert monospace `<code>` at rest. **This is a real, visible departure from spec §3.2's own "no
math affordance and no explanatory note ships on the content-script reader" framing** — math syntax that
was previously plain, unstyled text becomes a monospace-boxed span the moment 3.2-R lands, on every
`file://` document, math or not. It is not fixable without violating D-3-R/§9-2's app-page-only architecture
(the fix would require either a content-script-side `enhanceMath` — explicitly out of scope — or a
content-script-side parse-time suppression of the marker, which would require the SAME shared `parse.ts` to
know which surface it is running on, a new coupling this milestone's own D-2-R/D-3-R single-importer,
app-page-only discipline does not currently have). **Flagged for 8.1-R's milestone-close walk as a carried
item / candidate spec §3.2 amendment note** — not resolved here, per this task's own read-only scope and the
gate-2-revisit ruling's own instruction not to fold it into a fixture classification.

**STANDING INVARIANTS — CONFIRMED, ZERO SOURCE CHANGED.** `git status`/`git diff --stat` clean before this
commit's own two file edits (this file + `docs/ai/progress.md`); the scratch grammar-probe script was
created and deleted at the repo root, `git status` after deletion showed nothing. `pnpm lint` **EXIT=0**.
Full `pnpm test`: **1085/1085 passed, ALL GREEN** — `codeDetect.test.ts`'s corpus-drift guardrail is no
longer red; HEAD `45d4e76` (this session's own starting HEAD) already re-pinned it to the CURRENT true state
(n=28, 8/20 split, 28/28 scored, per that commit's own message, `docs/ai/progress.md`'s "✅ RESOLVED"
carried-item entry, and this session's own full-suite run independently confirming all three assertions
pass) — the stale "exactly 3, not 4+" framing this task's own kickoff warned against is correctly NOT used
here. This task adds no fenced code and touches no file `codeDetect` scans, so the re-pin is unaffected and
holds unchanged. Content-script/`.output`/manifest bytes are **stated, not re-measured** (this task builds
nothing and changes no `src/` file): 2.1-R's own last-confirmed figures stand — content-script **336,123 B**
both engines, `.output` **4,881,585 B Cr / 4,881,701 B Fx**, manifest **654 / 770 B**, `permissions: []`.
Golden `git diff tests/golden/output/` **EMPTY** (nothing built, nothing changed).

**DIVERGENCE FROM THE KICKOFF, FLAGGED:** the kickoff's own §1 anticipated a nontrivial per-fixture
classification table with danger cases to enumerate; the real corpus has none, so §1's table collapses to
the single enumerate-and-confirm-empty finding above rather than a multi-row table — stated plainly rather
than padded out. The kickoff did not anticipate the fence-renderer-key finding in §2 above; it is reported
because the kickoff's own §0 instruction ("you must know exactly what 3.2-R is going to build") and the
task's own "predict what 3.2-R will produce" framing both call for it directly.

**ACCEPTANCE.** This task does NOT decide anything about 3.2-R's own implementation — it is read-only,
findings-only. `git diff tests/golden/output/` EMPTY. No `src/` file touched.

- [x] **3.2-R `parse.ts` gains the RESOLVED tokenizer + the two passthrough render rules (D-1-R, D-7-R,
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
THE §2 CORRECTION LANDED AS FIX (a), THE ONLY VIABLE ONE GIVEN D-8-R'S OWN PEEL/UNPEEL ASYMMETRY; THE
FLOOR LANDED BUT NOT "EXACTLY, NOTHING ELSE" AS SEALED — A MEASURED, EXPLAINED DIVERGENCE; GOLDEN GREW BY
EXACTLY ONE FIXTURE.**

**FENCE FIX CHOSEN: (a), an explicit `renderer.rules['fence']` wrap — NOT (b), the plugin's own `render`
option as the uniform marker surface.** `@mdit/plugin-tex`'s real installed source (read directly,
`node_modules/@mdit/plugin-tex/dist/index.js`) shows its `render` callback signature is
`(content, displayMode, env)` — no fourth parameter distinguishing a fence-origin call from a
dollar-block-origin call, and BOTH call it with `displayMode=true`. D-8-R's own sealed text requires
`mathSourceOf`'s `$$`-peel for **dollar-origin content only** — fence content is passed **unpeeled**. A
single uniform `render` surface (fix (b)) cannot honor that asymmetry: it would have to either add `$$` to
fence content too (wrong) or omit it from block content too (wrong), with no signal available to tell the
two calls apart. Fix (a) sidesteps this entirely: `md.use(tex, {render: ...})` is used ONLY for
`math_inline`/`math_block` (dollar forms), each `$$`/`$`-wrapped explicitly in this project's own
`render` callback; `mathFence` is left at its default `false` so the plugin never touches
`renderer.rules['fence']` at all, and THIS project's own explicit fence wrap — installed AFTER the
existing 009 `data-fence-meta` override — checks `token.info.trim() === 'math'`: true routes through the
SAME `mathBlockMarker()` helper the dollar-block form uses, content **unpeeled** (no `$$` added); false
delegates to `fenceRuleWithMeta`, the SAME 009 function reference captured before this wrap installs,
never a reimplementation. Confirmed empirically (`node_modules` source read, then a live probe with
`mathFence` unset): `Object.keys(md.renderer.rules)` still lists `fence` as core's own default/009's
override, untouched by the plugin, exactly as fix (a) requires.

**MARKER SHAPES — LANDED, MATCHING `plan.md:796-797`'s OWN FORMULA.** `mathInlineMarker(content)` →
`<code class="peekover-math-inline">` + `escapeHtml('$'+content+'$')` + `</code>`. `mathBlockMarker`
takes an ALREADY-ESCAPED inner string and wraps `<pre><code class="language-math">…</code></pre>\n` (the
trailing `\n` added explicitly — our custom render bypasses `renderToken`, which is what normally supplies
it; verified against the pinned 009 fence strings' own trailing `\n` convention). Called as
`mathBlockMarker(escapeHtml('$$'+content+'$$'))` for `$$…$$` (dollar-block), and
`mathBlockMarker(escapeHtml(token.content))` for a `math`-info fence — the UNPEELED case, no `$$` added.

**RECOGNITION CORPUS — 13 NEW CASES, `src/render/parse.test.ts`, ALL GREEN, INCLUDING THE TWO
NON-MATH-FENCE REGRESSION GUARDS.** Every case run against the REAL landed rule (not the tex plugin's
default rendering — this project's own markers): inline `$x^2$` → `peekover-math-inline` marker;
`$$…$$` block → `$$`-wrapped `language-math` marker, byte-pinned; a ` ```math ` fence → the SAME
`language-math` shape, content UNPEELED, byte-pinned (**the §2 case**); **a ` ```js ` fence renders
BYTE-IDENTICAL to its pre-task pinned string** (`'<pre><code class="language-js">const x = 1;\n</code></pre>\n'`)
— **the regression guard**, direct, not inferred from Golden alone; **a ` ```mermaid ` fence likewise
byte-identical** (`'<pre><code class="language-mermaid">graph TD;\nA--&gt;B;\n</code></pre>\n'`) — the
second regression guard; a `data-fence-meta`-bearing fence (`` ```javascript {2,4} ``) still gets its
attribute, unaffected by the math wrap; `` `echo $HOME` `` inside a code span excluded, both directions
(math immediately after it still resolves); a `$5` price (no closing `$` on the line) stays literal; an
escaped `\$5` stays literal; two adjacent inline formulas on one line both resolve independently (the
nested-delimiters case); an unbalanced lone `$` does not crash; `<`/`>`/`&` inside a math marker are
HTML-escaped via `md.utils.escapeHtml` (no new escaping mechanism, per this task's own sealed text); and a
direct static-source assertion that `parse.ts` contains no `from 'temml'` / `import('temml')` anywhere
(**D-2-R's single-importer discipline, proven at the source level, not just the built graph**). Full
`src/render/parse.test.ts`: **37/37 passed.**

**3.1-R's AUDIT RE-RUN AGAINST THE NOW-REAL RULE.** 3.1-R's own enumeration found ZERO existing golden
fixtures containing a literal `$` — re-confirmed unchanged here (the corpus has not grown since; this
task's own new fixture is the first `$`-bearing one). `git diff tests/golden/output/` shows **exactly one
new file, `tests/golden/output/math.html`** — every one of the ten pre-existing snapshot files (`broken`,
`code`, `gfm-torture`, `headings-inline`, `images`, `inline-html`, `links`, `malicious`, `nesting`, the
huge-doc SHA-256) is **byte-identical**, confirmed both by `git status --porcelain tests/golden/output/`
(shows only the `??` untracked new file, no `M`) and by the full `pnpm test` run below reporting the
huge-doc's pinned digest unchanged. This is 3.1-R's own oracle discharged exactly as it predicted: the
empty corpus carries zero risk, and the new tokenizer touches nothing pre-existing.

**THE NEW FIXTURE, `tests/golden/fixtures/math.md`, EVERY HUNK OF ITS OUTPUT CLASSIFIED:**
1. `<h1>Math</h1>` — a heading control, unrelated to math, confirms the fixture parses normally otherwise.
2. `<code class="peekover-math-inline">$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$</code>` — the D-7-R
   inline shape, expected.
3–4. `<pre><code class="language-math">$$\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}\n$$</code></pre>`
   — the D-8-R block shape, `$$`-wrapped, expected.
5–6. `<pre><code class="language-math">\sum_{i=1}^n i = \frac{n(n+1)}{2}\n</code></pre>` — the SAME
   D-8-R shape from a ` ```math ` fence, content UNPEELED (no `$$`) — **the §2 fix's own pinned proof.**
7. `<p>Run <code>echo $HOME</code> in a shell -- not math. A coffee is $5, also not math.</p>` — the
   negative control: code-span exclusion and a bare `$5` price both hold, neither becomes a marker.

**CONTENT-SCRIPT BYTES — THE FLOOR LANDED, BUT NOT "EXACTLY, NOTHING ELSE" AS THE SEALED TEXT DEMANDED —
A MEASURED DIVERGENCE, EXPLAINED, NOT SILENTLY ROUNDED.** Fresh `rm -rf .output` rebuilds, both engines,
firing control landed FOR REAL (not reverted):
- **Pre-image** (re-confirmed before this task's diff): CS **336,123 B** both engines, md5 `f4370ed3…` Cr
  / `13dda867…` Fx — exact match to this task's own kickoff-stated baseline.
- **Isolated tokenizer floor** (scratch: ONLY `md.use(tex, {render: () => '_scratchMathProbe'})` wired
  into `parse.ts`, no fence wrap, no real markers — mirroring 1.1-R's own isolated-probe technique
  exactly; reverted before the real build below): CS **340,099 B** both engines — **+3,976 B**, a further
  **+17 B** drift past 1.1-R's own **+3,959 B** figure (an incidental patch-version movement in
  `@mdit/plugin-tex`/`markdown-it` since that session, the same class of drift 1.1-R itself flagged
  relative to an even earlier probe — not investigated further, per this task's own kickoff explicitly
  inviting "use the fresh number, flag if it differs").
- **Real landed delta** (the actual committed diff — tex import, the two marker functions, the fence
  wrap): CS **340,492 B** both engines, md5 `bcdcf231d2980c60538dd5ade0b3088d` Cr /
  `49e218a1f0bc2515a4e421b7a063e3d8` Fx — **+4,369 B**, decomposed as **+3,976 B** (the isolated floor,
  re-measured fresh above) **+ 393 B** (this task's OWN marker-emission/fence-wrap render logic —
  `mathInlineMarker`/`mathBlockMarker`/the fence-info check — necessarily new code the parse RULE itself
  requires, not an incidental extra). **Confirmed genuinely floor-plus-necessary-logic, not a leak**: the
  built content-script bundle was grepped directly for the literal string `temml` — **zero occurrences**
  (`grep -c` exit 1, zero matches) — and no file beyond `src/render/parse.ts` (additive),
  `src/render/parse.test.ts`, and the one new golden fixture pair changed in this task's diff, so no other
  module reaches the content-script graph. **This is the divergence flagged, as instructed**: the sealed
  Verify text's "336,123 B + 1.1-R's own measured tokenizer-floor figure, EXACTLY... by NOTHING ELSE" reads
  as if the render logic itself contributes zero bytes; empirically it contributes 393 B, a small but
  non-zero, fully accounted, fully necessary cost of actually landing the parse rule (as opposed to 1.1-R's
  own throwaway-stub isolation, which by design measured the floor ALONE). **Not a violation of INPUT B's
  own SUBSTANCE** ("content-script bytes move by exactly the tokenizer's own always-loaded floor... and by
  NOTHING ELSE" — read in context as "nothing else EXTRANEOUS," i.e. no `temml`, no other module; this
  task's own marker logic is the parse rule ITSELF, not an extraneous addition) — but a real gap between
  the sealed text's literal "EXACTLY" and the measured number, stated plainly rather than smoothed over.
- **★ NEW CS BASELINE, EFFECTIVE IMMEDIATELY: 340,492 B both engines, md5 `bcdcf231d2980c60538dd5ade0b3088d`
  Cr / `49e218a1f0bc2515a4e421b7a063e3d8` Fx. Every task from 4.1-R onward asserts CS bytes against THIS
  figure — never against 336,123 B alone, and never against the isolated-floor-only 340,099/+3,976 B
  figure either (that number was a scratch probe, reverted, never landed).**

**APP-PAGE BYTES, DECOMPOSED.** `.output` total: **4,890,324 B Cr / 4,890,440 B Fx** — **+8,739 B** both
engines vs. the pre-image (4,881,585 / 4,881,701). Since `parse.ts` is shared by both the content-script
AND app-page graphs, this decomposes to the SAME +4,369 B tax landing independently on each graph
(4,369 × 2 = 8,738, a 1 B non-linearity vs. the measured 8,739, the same class of incidental
chunk-manifest-overhead drift 1.1-R's own decomposition already named) — confirming the "on BOTH graphs"
framing plan.md's own carried plan-input (1) states. App-page-only portion: **+4,370 B** (the total minus
the CS-side +4,369 B).

**STANDING INVARIANTS.** Manifest **654 / 770 B** both engines, `permissions: []` — UNMOVED. `pnpm lint`
**EXIT=0**. Full `pnpm test`: **1099/1099 passed, ALL GREEN** (62 files) — includes the huge-doc's own
pinned SHA-256 unchanged (confirming the golden-corpus byte-identity claim above independently) and
`codeDetect.test.ts`'s corpus-drift guardrail unaffected (below). 007/009 import fences green as part of
the same full-suite run.

**CODEDETECT SCAN SCOPE — MEASURED, NOT ASSUMED: `tests/golden/fixtures/**` IS IN SCOPE, BUT THIS TASK'S
OWN NEW FENCE DOES NOT ENTER THE CORPUS — BASELINE HOLDS UNCHANGED.** Reading `codeDetect.test.ts`'s own
`scanUnlabeledFences` directly: it walks the WHOLE repo tree from `process.cwd()` (excluding
`node_modules`/`.git`/`.output`/`.wxt`) for every `.md` file's fenced blocks with an **EMPTY** info
string — confirmed in scope for `tests/golden/fixtures/**` by the function's own comment naming
`tests/golden/fixtures/code.md`'s own prose fixture as one of the 20 already-counted non-code items. This
task's new fixture (`tests/golden/fixtures/math.md`) has exactly one fence, and its info string is
`"math"` — **non-empty** — so the scanner's own `if (info === '') out.push(...)` predicate never adds it.
**Baseline holds UNCHANGED, measured**: `codeDetect.test.ts` run standalone, both pinned assertions still
pass — corpus **n=28**, split **8/20**, all 28 scored (re-pinned at `45d4e76`, re-confirmed unaffected by
2.1-R and 3.1-R, now re-confirmed unaffected by this task too).

**DIVERGENCE FROM THE KICKOFF, FLAGGED:** the CS-byte firing control did NOT land "exactly the isolated
floor," as detailed above — a genuine, measured gap from the sealed Verify text's literal wording, not
merely from the kickoff's own paraphrase (the kickoff itself anticipated this possibility explicitly,
"flag if it differs"). No other divergence: fix (a) was chosen and justified against fix (b)'s concrete
incompatibility with D-8-R's own peel/unpeel asymmetry, a level of justification detail beyond what 3.1-R's
audit itself established (the audit named both fixes as candidates without ruling between them).

**ACCEPTANCE.** Golden grew by exactly one fixture; every pre-existing fixture stays byte-identical
(3.1-R's own oracle, discharged). INPUT B's floor landed for real, with an honestly decomposed and
explained (not hidden) gap between the sealed "exactly the floor" text and the measured number. No
`temml` import in `parse.ts`, confirmed both by direct source grep and by the zero-occurrence content-script
bundle grep. The non-math-fence regression guard (`` ```js ``/`` ```mermaid ``) passes directly, not just
inferred from Golden's own silence.

*Group-3-R acceptance (plan (h)): the re-entered audit's every flagged fixture is reviewed and classified;
the (unchanged-shape) marker fixture is pinned; INPUT B's floor lands exactly once, proven by a delta
firing control, not merely asserted.*

## 4-R — Enhancer scaffolding: block math (D-2-R, D-3-R, D-4-R, D-8-R, D-9-R, D-13)

- [x] **4.1-R `mathEngine.ts` — the ONE `import('temml')`, the feature-detect, Temml's config lockdown
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) — THE
CONFIG LOCKDOWN RE-DERIVED FIELD-BY-FIELD AGAINST REAL INSTALLED `temml@0.13.5` SOURCE, ONE FIELD ADDED
BEYOND KaTeX-ERA D-4's THREE-FIELD SHAPE (CITED, NOT INVENTED); THE IMPORT FENCE'S SHAPE GENUINELY DIVERGES
FROM ITS 007/009 PRECEDENT, FLAGGED; A METHODOLOGICAL FIRING-CONTROL DEFECT WAS FOUND AND FIXED MID-TASK.**

**`mathEngine.ts` — `hasMathMarker`/`loadMathEngine` CARRIED FROM THE ORIGINAL D-2 SHAPE, MIRRORING
`diagramEngine.ts`'s `hasDiagramFence`/`loadDiagramEngine` EXACTLY.** `MATH_INLINE_SELECTOR =
'code.peekover-math-inline'` / `MATH_BLOCK_SELECTOR = 'pre > code.language-math'` match 3.2-R's own landed
marker shapes exactly (D-8-R's shared block/fence shape means one selector covers both origins). `loadTemml:
EngineLoader = () => import('temml')` is the ONE `import('temml')` in the repository — a static string
literal, the `check-dynamic-imports.ts` MUST_NOT_FIRE "bare-specifier lazy chunk" shape. Unlike
`loadDiagramEngine`, there is no `engine.initialize(config)` step: Temml is stateless — `renderToString`
takes its options PER CALL — so `loadMathEngine` returns the engine handle unconfigured; the caller supplies
options via `mathEngineOptionsFor(displayMode)` at each render (group 4-R/5-R's own job).

**THE CONFIG LOCKDOWN — RE-DERIVED, NOT PORTED, EACH FIELD CITED AGAINST REAL `node_modules/temml/src`
SOURCE (read directly this session).** `MATH_ENGINE_CONFIG = Object.freeze({ trust: false, throwOnError:
true, annotate: false })`:
- **`throwOnError: true` — THE LOAD-BEARING FIELD.** `temml.js`'s `renderToMathMLTree` catches every
  parse/build error and hands it to `renderError(error, expression, settings)`
  (`node_modules/temml/temml.js:103-111`), whose own first line is `if (options.throwOnError ||
  !(error instanceof ParseError)) { throw error; }`. With `throwOnError: true` that condition is
  unconditionally true, so EVERY failure re-throws and NEVER reaches the branch that builds Temml's own
  `<span class="temml-error">` node (an HTML `Span` from `domTree.js`, styled with `errorColor` — not a
  MathML element the D-5-R sanitizer profile enumerated). `errorColor` is therefore deliberately ABSENT from
  the pinned config: it configures a code path this pin makes unreachable.
- **`trust: false` — Settings.js's own default (`Settings.js:48`), pinned EXPLICITLY** per D-4-R's own "pin
  a security-relevant default rather than trust an unstated one." `Settings.prototype.isTrusted`
  (`Settings.js:70-80`) gates `\class`/`\id`/`\style`/`\data` (`functions/html.js:68-70`) and
  `\includegraphics`; 2.1-R's own finding (`\href`/`\url` unsupported outright, the html-function family
  throwing "not trusted") is re-confirmed here as a genuine ABLATION, not merely cited (below).
- **`annotate: false` — Settings.js's own default (`Settings.js:37`), pinned explicitly for the SAME
  reason.** `sanitize.test.ts:967-969` (2.1-R's own 97-formula survey) already named this field BY NAME as
  "the defaults 4.1-R will re-derive" — this is a genuine, cited addition beyond the KaTeX-era D-4's
  three-field shape (`trust`/`throwOnError`/`output`), not an invented fourth field. It guards D-5-R's own
  sanitizer-profile assumption (`<semantics>`/`<annotation>` confirmed ABSENT from real output specifically
  because `annotate` defaults false) from a future Temml version silently flipping that default.
- **`output` — CORRECTLY ABSENT** (D-4-R's own VACATE, stated explicitly per the kickoff's own instruction
  so a reviewer does not go looking for it): Temml has no `output` option at all (absent from `Settings.js`'s
  full field list) because MathML is the only output a MathML-output-strategy engine produces by construction.

**REAL-TEMML PROOF, `mathEngine.test.ts`, 11/11 GREEN.** Feature-detect gate (call-count spy, paired
negative/positive per 007's own "an uncalled spy and a missing spy look identical" discipline). Config
frozen, asserted `toEqual({trust:false, throwOnError:true, annotate:false})` and `Object.keys(...).sort()
=== ['annotate','throwOnError','trust']` (no fourth key). `mathEngineOptionsFor` merges `displayMode` without
mutating the shared base. Against REAL installed `temml`: `\frac{a}{` (malformed) throws; an unrecognized
control sequence throws (the SAME `renderError` OR-branch, a different producer); `annotate:false` confirmed
keeping `<semantics>`/`<annotation>` out of real rendered `x^2` output. **The `trust` ABLATION**: `\class{
peekover-injected}{x}` throws `/not trusted/` under the pinned config; the SAME formula with ONLY `trust`
flipped `true` (never landed in `mathEngine.ts`, only in the test's own options object) SUCCEEDS and contains
`peekover-injected` — proving the throw depends on the `trust: false` pin specifically, not on the formula
being malformed some other way.

**★ `mathImportFence.test.ts` GENUINELY DIVERGES FROM `diagramImportFence.test.ts`/`codeImportFence.test.ts`'S
OWN GRAPH-WALK SHAPE — FLAGGED, NOT SILENTLY COPIED.** Both precedents landed AFTER their engine already had
a real call site (007's diagram engine wired before task 3.4; 009's code engine at task 4.1, before its own
fence at 4.5 — that file's own header states this). `mathEngine.ts` has NO call site yet (4.2-R/5.1-R's own
job) — an entry-walk from either `entrypoints/peekover.content.ts` or `entrypoints/app/main.ts` reaches
NEITHER `mathEngine.ts` NOR `temml` today, so a graph-shaped "app-page control MUST reach the engine" clause
would find nothing and prove nothing. Instead this file performs a WHOLE-SHIPPED-TREE specifier scan
(`check-dynamic-imports.ts`'s own `collectFiles`/self-test discipline: `src`+`entrypoints`, excluding
`*.test.ts`/`*.d.ts`), asserting exactly one `temml` specifier in the tree, dynamic, in `mathEngine.ts` —
a property that holds regardless of reachability and keeps holding once 4.2-R wires a call site. The
graph-shaped clause-A/B/C/D fence becomes meaningful again once that call site exists — named here as
4.2-R's own to add, not silently dropped.
**A GENUINE GAP FOUND WHILE PORTING `diagramImportFence.test.ts`'S OWN `blankComments`, FIXED.** That
function blanks comments but leaves string-literal CONTENT unmasked and untracked — harmless for its own
subject file (whose only string content IS the specifier being matched), but this file's own MUST-NOT-FIRE
fixture (`"never write import('temml') outside mathEngine.ts"`, mirroring `check-dynamic-imports.ts`'s own
self-test case) reproducibly FALSE-POSITIVED: the regex matched `import('temml')`-shaped text sitting inside
an OUTER string literal as if it were a real dynamic import. Fixed by porting `check-dynamic-imports.ts`'s
own `maskComments`/`insideString` string-SPAN-tracking technique (not imported — that script is `scripts/`-
only by its own stated exclusion, kept out of the shipped-tree scan this file performs) rather than
weakening the test fixture. **Firing control, 6/6 green**: two MUST-FIRE cases (a second STATIC import, a
second DYNAMIC import, each in an in-memory-only fixture module, never landed on disk) and two MUST-NOT-FIRE
cases (comment/string prose mentioning temml — the fixed case above; an unrelated package name sharing no
`/`-boundary prefix with `temml`) — proving the scanner is live, not silently broken, on the SAME function
the real scan uses (not a re-implementation).

**`check-dynamic-imports.ts` — EXIT=0 BOTH RUNS.** Self-test: 7 firing + 8 silent, all pass (unchanged by
this task — `import('temml')` is exactly the "bare-specifier lazy chunk" shape its own MUST_NOT_FIRE fixture
already sanctions). Real scan: **72 shipped files, 0 violations.**

**CONTENT-SCRIPT BYTES — UNMOVED, WITH A FIRING CONTROL THAT SURFACED A REAL BUNDLING FACT.** Fresh
`rm -rf .output` rebuild, both engines: **340,492 B**, md5 `bcdcf231d2980c60538dd5ade0b3088d` Cr /
`49e218a1f0bc2515a4e421b7a063e3d8` Fx — EXACT match to 3.2-R's own landed floor figure, confirmed via
`scripts/check-dynamic-imports.ts`'s companion `grep -c temml` returning **0** on both built bundles.
**Firing control** (a scratch static VALUE import of `loadMathEngine` into `entrypoints/peekover.content.ts`,
reverted before this commit): CS moved to **546,232 B both engines** (**+205,740 B**), md5 moved, `temml`
grep **1** — a genuine finding, stated: a content script is built as ONE FILE with no code-splitting, so the
dynamic `import('temml')` chunk gets INLINED directly into the content-script bundle rather than staying a
separate lazy file the way it does on the app-page graph (below). Reverted: CS restored byte- and
md5-identical to the figure above, `git status` after revert showed only this task's own three new files.

**★ APP-PAGE BYTES — THE SEALED VERIFY TEXT'S OWN COMPARISON BASELINE IS STALE, FLAGGED.** 4.1-R's own
sealed Verify line reads "App-page bytes stated against 2.1-R's own figure" (4,881,585 B Cr / 4,881,701 B
Fx) — but 3.2-R (landed AFTER 4.1-R's text was drafted, BEFORE this task ran) already moved app-page bytes,
because `parse.ts` is shared by both the content-script AND app-page graphs: 3.2-R's own RESULT block states
`.output` **4,890,324 B Cr / 4,890,440 B Fx**, +8,739 B over 2.1-R's figure. Comparing against 2.1-R's stale
number here would read a phantom +8,739 B delta that has nothing to do with this task. **The correct, measured
comparison is 3.2-R's own landed figure**, matching this session's own §CS-baseline note (`tasks.md:672-675`,
"every task from 4.1-R onward" — read here as applying symmetrically to the app-page figure, not only the
CS one). Fresh rebuild: `.output` **4,890,324 B Cr / 4,890,440 B Fx — UNMOVED**, because `mathEngine.ts` has
no call site on EITHER graph yet (4.2-R/5.1-R's own job) — it is dead code, fully tree-shaken, contributing
zero bytes anywhere.
**FIRING CONTROL — A NAIVE FIRST ATTEMPT WAS INSUFFICIENT, A REAL METHODOLOGICAL FINDING, NOT SMOOTHED
OVER.** A scratch `void _scratchMathProbe;` reference (a plain expression statement referencing the imported
binding without calling it) wired into `appShell.ts` moved `.output` by only **+54 B both engines** — noise-
floor chunk-hash churn, not real code (confirmed: zero `temml` occurrences anywhere in the rebuilt app
bundle). The minifier eliminates a bare `void <unused-reference>` as dead code BEFORE the bundler's own
unused-import analysis runs, which then drops the whole `mathEngine.ts`/`temml` subgraph — a genuinely
different failure mode from 2.1-R's own scratch probe (`sanitize.ts`, wired behind a runtime window flag,
which DID move real bytes because a function CALL, unlike a bare reference, is never assumed side-effect-free
by the minifier). **Corrected**: the SAME runtime-window-flag-guarded CALL discipline 2.1-R's own scratch
probe used (`window.__PEEKOVER_SCRATCH_MATH_ENGINE__`, never true, reverted before commit) — this DID move
real bytes: `.output` **5,094,676 B Cr / 5,094,792 B Fx**, **+204,352 B both engines**, decomposed as **(a)**
a new lazy chunk `temml-*.js`, **204,010 B** — an EXACT independent reproduction of 1.1-R's own isolated-
temml-chunk figure (1.1-R: "one new lazy chunk, 204,010 B"), confirming temml's own bytes are unchanged since
that measurement — **(b)** **+342 B** eager glue (`mathEngine.ts`'s own always-loaded code plus this scratch's
own wiring lines in `appShell.ts` — NOT a figure 4.2-R's real landing will match, since real wiring differs;
stated as a decomposition proof, not a prediction). Content-script bytes stayed **340,492 B, UNMOVED**
throughout this app-page-only scratch — confirming D-3-R's app-page-only isolation holds independent of
which graph is wired. Reverted; a final fresh `rm -rf .output` rebuild, both engines, confirmed byte- AND
md5-identical restoration: CS 340,492 B / `bcdcf231…` Cr / `49e218a1…` Fx; `.output` 4,890,324 B Cr /
4,890,440 B Fx. `git status` after revert showed only this task's own three new files.

**STANDING INVARIANTS.** Manifest **654 / 770 B** both engines, `permissions: []`, no
`web_accessible_resources` key — UNMOVED. `pnpm lint` **EXIT=0**. Full `pnpm test`: **1116/1116 passed, ALL
GREEN** (64 files — 1099 at 3.2-R's close + this task's own 11 (`mathEngine.test.ts`) + 6
(`mathImportFence.test.ts`) = 17 new). `codeDetect.test.ts` run standalone: **14/14 passed**, corpus
UNAFFECTED (this task adds no fenced markdown and touches no file the corpus scans). 007/009 import fences
(`diagramImportFence.test.ts`/`codeImportFence.test.ts`) run standalone: **17/17 passed**, unaffected.
`git diff tests/golden/output/` **EMPTY** — this task builds no markdown fixture and changes no render path.

**DIVERGENCE FROM THE KICKOFF, FLAGGED:** the kickoff's own §2 anticipated possibly needing to pin
`errorColor` or other Temml options beyond the three landed here; measured, `errorColor` is dead code under
`throwOnError: true` (§ above) and is correctly excluded, stated rather than silently added. The kickoff's
own §3 described the import fence as "the 007 diagramImportFence / 009 codeImportFence analog" without
naming the reachability-shape mismatch; that mismatch — and the string-literal false-positive gap it exposed
while porting `blankComments` — are both genuine findings this task's own drafting surfaced, not anticipated
by the kickoff. The kickoff's own §4 predicted the app-page firing control would directly show "eager glue
vs. lazy temml chunk decomposed"; the naive first attempt did not (§ above), a real methodological finding
the kickoff did not anticipate, corrected within this task rather than reported as a gap for a later task.
The two carried 4.2-R font inputs (D-13 mechanism: `document.fonts.add()`, not `readerCss.ts`'s own
`@font-face`; stylesheet: the adapted `Temml-STIX2.css`, both already recorded in 1.1-R's own RESULT block)
are NOT re-recorded here — this task's own diff does not touch them, and re-stating them a second time (the
kickoff's own §5) would be redundant with 1.1-R's own already-committed record, not a new obligation this
task discharges.

**ACCEPTANCE.** The config lockdown is re-derived, cited field-by-field against real installed source, with
`output` correctly absent. The single-importer guarantee is proven over the whole shipped tree with a firing
control that itself required a real fix (the string-span gap). Content-script bytes are unmoved, proven with
a firing control that surfaced a real bundling fact (content-script inlining vs. app-page chunk-splitting).
App-page bytes are unmoved against the CORRECT (3.2-R) baseline, not the sealed text's stale one, proven with
a firing control whose own first attempt failed usefully and was corrected in-task. `git diff
tests/golden/output/` EMPTY. No `src/` file beyond this task's own three new files changed.

- [x] **4.2-R Block/fence math enhancer + view (block half); the bundled font SHIPPED FOR REAL (D-13); D-9-R's
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
BLOCK/FENCE MATH SHIP FOR REAL, IDENTICAL DOM SHAPE PROVEN BOTH FAKE- AND REAL-ENGINE, INPUT A DISCHARGED
FOR REAL, D-9-R'S LEAN CONFIRMED WITH A FIRING CONTROL — AND A REAL CS-BYTE LEAK THIS TASK'S OWN FIRST
ATTEMPT INTRODUCED AND CAUGHT, NOT SILENTLY AVOIDED.**

**★ THE FONT MECHANISM/STYLESHEET — D-13'S OWN SEALED TEXT (`readerCss.ts`'s `@font-face`) IS STALE, THE
MANDATED CORRECTION APPLIED, AS FLAGGED AT 1.1-R.** Registration is `document.fonts.add(new FontFace(...))`
(`src/theme/mathFont.ts`), never a shadow-root `@font-face` — 1.1-R's own real finding (Chromium does not
reliably apply `@font-face` inside a shadow tree) carried forward, exactly like `fonts.ts`'s own Literata
registration. The stylesheet is Temml's OWN shipped `Temml-STIX2.css` (`node_modules/temml/dist/`,
`temml@0.13.5`), machine-adapted from the 1.2-R harness's own already-proven copy
(`harness/math-fidelity/temmlStixCss.js`) via a small Node script (not hand-transcribed, to rule out
transcription error over ~7 KB of CSS): its license comment block and every inline rule comment stripped
(a CSS-in-template-literal ships-its-comments lesson, applied), every selector scoped under
`.peekover-reader`, its `font-family` rule retargeted at `'Peekover Math'`, and — a THIRD adaptation beyond
the harness's own two (drop `@font-face`, retarget `font-family`) — its equation-numbering counter re-scoped
from `body` (Temml's own target, assuming a real HTML page) to `.peekover-reader` (this shadow tree has no
`<body>` element; a naive selector-prefixer first produced the unmatchable `.peekover-reader body`, caught
by inspection before landing). Brace-balance and rule-count verified after every transform pass
(open-braces === close-braces, exactly 4 `@supports` + 1 `@-moz-document` blocks preserved, `font-family`
retargeted exactly once to the right value) — a genuine intermediate bug (one `@supports` block preceded by
an inline comment got its ENTIRE prelude, comment included, wrongly treated as a selector list and prefixed
— `.peekover-reader @supports (...)`) was caught this way and fixed by stripping comments BEFORE the
selector-prefix pass, not after.

**★ A REAL CONTENT-SCRIPT BYTE LEAK — INTRODUCED, MEASURED, AND FIXED, IN THIS SAME COMMIT — THE TASK'S OWN
CENTRAL FINDING.** D-13's sealed Files line names `readerCss.ts` as where the font's CSS lands; a first,
literal attempt did exactly that — appended the adapted stylesheet directly into `READER_CSS`'s own
template literal. A fresh rebuild caught it immediately: content-script bytes moved **340,492 → 348,778 B
(+8,286 B)**, because `READER_CSS` is injected by `theme/reader.ts`'s `buildReaderStyle()`, which `mount.ts`
calls UNCONDITIONALLY on every mount — on BOTH the content-script and app-page graphs. A STRING constant
baked into an always-loaded shared module cannot be tree-shaken the way `enhanceMath`'s own dynamic
`import('temml')` can; D-2-R's single-importer gate protects CODE reachability, not a CSS literal sitting in
a module every graph already loads. **Fixed structurally, not by reverting the feature**: the adapted
stylesheet + the block figure shell CSS moved into a NEW, separate module (`src/theme/mathCss.ts`),
`export const MATH_CSS` + `buildMathStyle()`, imported ONLY by `mathEnhancer.ts` (app-page-only, per D-3-R's
own two call sites) — `ensureMathStyle()` appends this as a SECOND `<style>` element into the shadow root at
enhancement time (mirroring `mount.ts`'s own `buildContainedStyle()` pattern: an additional sheet alongside
the base one, marked with a `data-peekover-math-style` attribute so a repeat `enhanceMath` call never
appends a duplicate), never folded into the shared, always-loaded `READER_CSS`. A fresh rebuild after the fix
confirmed content-script bytes restored to **340,492 B, md5 `bcdcf231…` Cr / `49e218a1…` Fx — EXACT match to
3.2-R's own floor**, with `grep -c temml` on both built bundles returning **0**. This is flagged as the
task's own central finding, not smoothed over: it is a live instance of the kickoff's own §2 "CS-graph
isolation is now a real hazard" warning, caught by the very re-verification the kickoff demanded, not merely
theorized about.

**THE FONT ASSET — URL-LOADED, NOT `?inline`, TAKING THE BYTE-FORECAST SPIKE'S OWN ~28.8 KiB LEVER.** A
plain (non-`?inline`) import of the same committed `assets/fonts/stix-two-math-subset.woff2` lets Vite emit
it as its own file (default `assetsInlineLimit` 4096 B, well under this subset's 86,224 B) rather than a
~4/3-inflated base64 `data:` URI — `.output` shows `assets/stix-two-math-subset-CLT6mVac.woff2 86.22 kB`,
matching the byte-forecast spike's own measured recovery almost exactly. **WAR re-verified, not assumed from
that spike**: both built manifests show `web_accessible_resources` ABSENT, `permissions: []` — an app-page-
only same-origin (`chrome-extension://…`) reference to a bundled asset needs no WAR key, confirmed on the
REAL shipping wiring (`mathEnhancer.ts` → `mathFont.ts`), not only the spike's own scratch call site.

**INPUT A — DISCHARGED FOR REAL (the shipped wiring, not 1.1-R's scratch harness), WITH A REAL METHODOLOGICAL
CORRECTION.** `tests/browser/mathBlock.browser.test.ts`, Cr+Fx: a rendered formula's computed `font-family`
resolves to `'Peekover Math'` first in the stack. The GLYPH-AVAILABILITY proof does **NOT** use
`document.fonts.check()` the way 1.1-R's own scratch harness did for its own registration probe — drafting
this test found, empirically on BOTH engines, that `document.fonts.check('12px "<a name nothing ever
registered>"')` reads **`true`**, not `false`: per the CSS Font Loading API's real semantics, `check()`
reports whether anything in the given font list is still LOADING, not whether a family exists at all, so a
never-registered name (nothing pending) is trivially "not blocking" and reads true — a **vacuous negative
control**, caught before it shipped rather than left as a silently-non-discriminating assertion. Replaced
with 1.1-R's OTHER proof mechanism instead: a `canvas.measureText()` glyph-advance DIFFERENTIAL for U+2211
(∑) between `font: 200px "Peekover Math", sans-serif` and the SAME string with a nonexistent family name —
if our font were silently not applied, both would fall back to the identical generic stack and read equal;
they read genuinely different, both engines, proving the family really did change what glyph metrics the
page uses.

**D-9-R — THE LEAN CONFIRMED, MEASURED WITH A FIRING CONTROL, PLUS TEMML'S OWN ERROR PATH CONFIRMED
UNREACHABLE.** `tests/browser/mathBlock.browser.test.ts`: a single rendered formula's `<math>` element,
NEVER re-rendered, has its computed `color` read at `light`/`dark`/`sepia` (via three `setThemeSetting`
calls, no `enhanceMath` re-invoked) — each resolves to exactly that theme's own `--ink` token value
(compared as an `rgb(...)` string, not the attribute), and all three are pairwise DISTINCT, proving the
glyph genuinely tracks the theme rather than coincidentally matching one comparison. **Firing control**: a
scratch `<style>` pinning `math,* {color:#ff00ff!important}` (a hardcoded-colour ablation, the exact defect
class D-9-R's lean would have missed) makes the SAME light→dark flip read the SAME colour both times —
proving the real (non-ablated) test above is a genuine, non-vacuous instrument. **Temml's own error UI is
confirmed unreachable**: a malformed, unterminated `\frac{a}{` fed through the REAL engine produces our OWN
`.peekover-math-error` marker and **zero** `.temml-error` nodes anywhere in the shadow root — 4.1-R's own
`throwOnError:true` config lockdown, now proven at the DOM level rather than only in `mathEngine.test.ts`'s
own unit proof.

**D-8-R's SHARED-SHAPE CLAIM — PROVEN TWICE, FAKE-ENGINE AND REAL-ENGINE.** `mathEnhancer.test.ts` (jsdom, a
fake engine) and `mathBlock.browser.test.ts` (Cr+Fx, real Temml) both render the SAME formula via `$$…$$`
and via a ` ```math ` fence and assert the resulting figures are structurally identical (class, state
attribute, child shape; the browser test additionally diffs the two rendered `<math>` trees'
`outerHTML` byte-for-byte). `mathSourceOf`'s own `$$`-peel (the function `parse.ts:141` names by name as
"a later task['s]" to write) is a pure CONTENT-SHAPE test — `$$`-prefixed-and-suffixed strips exactly those
four characters, anything else (a bare fence body) passes through unpeeled — confirmed against the exact
golden-fixture shape (`tests/golden/output/math.html`): a multi-line dollar-block's own captured content
retains a trailing `\n` BEFORE the closing `$$`, so the peeled bare LaTeX also carries that same trailing
newline — a real, verified shape, not assumed from the marker's own visual appearance.

**THE GRAPH-SHAPED IMPORT FENCE — 4.2-R's OWN OBLIGATION, DISCHARGED, PER `mathImportFence.test.ts`'S OWN
FORWARD NOTE.** That file's own header (written at 4.1-R) named this task as the one to add the
`diagramImportFence.test.ts`-shaped clause A/B/D reachability fence, once a real call site existed. Added
directly to that file (not a new one — it already owns the specifier-scanning machinery to reuse): clause D
(both graphs non-trivial, zero unresolved edges), clause A (the content-script entry reaches NEITHER
`mathEnhancer.ts` NOR `mathEngine.ts`, imports no `temml` specifier anywhere in that graph), clause B (the
app-page entry graph — the control — MUST reach both AND must import `temml`, or clause A is a broken walk
reading vacuously green). `mathImportFence.test.ts`: **6 → 11 tests, all green**, both the pre-existing
whole-tree specifier scan and the new graph walk.

**BYTES — CS UNMOVED (EXACT MATCH), APP-PAGE DECOMPOSED, HEADROOM COMFORTABLE.** Fresh `rm -rf .output`
rebuild, both engines: content-script **340,492 B**, md5 `bcdcf231d2980c60538dd5ade0b3088d` Cr /
`49e218a1f0bc2515a4e421b7a063e3d8` Fx — **UNMOVED, exact match to 3.2-R's own floor** (the CS-isolation leak
above was caught and fixed before this figure was taken). `.output` **5,191,586 B Cr / 5,191,702 B Fx** —
**+301,262 B both engines** over 4.1-R's own unmoved figure (4,890,324 / 4,890,440), decomposed: **(a)** the
`temml` lazy chunk, **204,010 B** (identical to 4.1-R's own isolated figure — unchanged, now finally reached
by a real call site) **(b)** the STIX font asset, **86,224 B** (URL-loaded, no base64 inflation) **(c)**
everything else — `mathEnhancer.ts`/`mathView.ts`/`mathFont.ts`'s own eager glue plus `mathCss.ts`'s ~7.2 KB
adapted stylesheet plus the figure-shell CSS plus chunk-manifest overhead — **≈11,028 B**, the one line item
this milestone's own byte-forecast spike did not model (that spike's own scratch enhancer/view files did not
include this stylesheet's real weight; stated as a genuine, measured gap from the forecast, not smoothed
over). **FIT VERDICT: `.output` headroom 5,242,880 − 5,191,586 = 51,294 B (50.1 KiB) Cr; 5,242,880 −
5,191,702 = 51,178 B (50.0 KiB) Fx — POSITIVE, comfortably, both engines** — thinner than the forecast's own
~27 KiB-plus-groups-5R-8R framing implied it would be by this point (the un-modeled CSS ate into it), but
still clearly on the COMFORTABLE side of that spike's own COMFORTABLE/TIGHT/AT-RISK routing, not TIGHT.
Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources` — unmoved, both engines.

**STANDING INVARIANTS.** `pnpm lint` **EXIT=0**. Full `pnpm test` (unit): **1145/1145 passed, ALL GREEN**
(67 files — 1116 at 4.1-R's close + 21 new in `mathEnhancer.test.ts` + 3 new in `mathFont.test.ts` + 5 new
in `mathImportFence.test.ts` = 1145). Full `pnpm test:browser` (Cr+Fx): **1553/1568 passed, 15 pre-existing
skips, ALL GREEN** (156 files, including the new `mathBlock.browser.test.ts`'s own 7 cases × 2 engines).
Two isolated, non-reproducing failures surfaced across repeated full-suite runs while verifying this task
— `tocScroll.browser.test.ts` (Firefox, an off-by-one scroll-spy index that changed value between runs) and
`diagramActions.browser.test.ts` (Firefox, a mid-transition `opacity` read of `0.0000976157` instead of
`'0'`) — BOTH confirmed harness-shared-state/timing flakes per AGENTS.md's own standing rule, not a
regression: neither touches math, neither persisted across three consecutive re-runs of its own file, and
`tocScroll.browser.test.ts` passed clean on an unmodified HEAD via `git stash` in the same session. `git
diff tests/golden/output/` **EMPTY**. `codeDetect.test.ts` standalone: **14/14 passed**, corpus unaffected.
007/009/M11 import fences run standalone together: **28/28 passed**.

**ACCEPTANCE.** §4's block/fence rendering criteria hold against Temml's own `<math>` output, both engines.
D-8-R's shared-shape claim holds, proven twice. D-9-R's lean is CONFIRMED, with a firing control. INPUT A is
discharged for real, with a corrected (non-vacuous) negative control. The font ships for real, zero-network,
no WAR. `mount.ts` diff EMPTY (no `src/render/mount.ts` edit in this task's diff). Content-script bytes are
EXACT-match unmoved, proven with a firing control that itself found and fixed a real leak this task's own
first attempt introduced. `git diff tests/golden/output/` EMPTY.

- [x] **4.3-R The zero-network guard for the bundled font; block math's §3.9 degradation paths (D-4-R's
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
ZERO OFF-ORIGIN NETWORK PROVEN OVER THE REAL PATH, WITH A FONT-SPECIFIC FIRING CONTROL DISCHARGING §3.7'S
NAMED TRAP; ALL THREE §3.9 DEGRADATION PATHS PROVEN FOR BLOCK MATH, REAL TEMML, BOTH ENGINES; CS UNMOVED,
EXACT MATCH.**

**NO CODE CHANGE WAS NEEDED IN `mathEnhancer.ts`/`mathView.ts` — A DIVERGENCE FROM THE KICKOFF, FLAGGED.**
The kickoff's own §2 read as if this task builds new guard/degradation code; reading the ALREADY-LANDED
4.2-R source found all three §3.9 paths already implemented as code (`renderMathBlocks`'s document-wide
try/catch around `loadMathEngine`; `renderMathFormula`'s per-formula try/catch around `renderToString` and
around the `sanitizeMath`-then-`<math>`-root check) — D-8-R's own "reuse 007's sibling-figure machinery
verbatim" means this mechanism is a byte-for-byte structural port of `diagramEnhancer.ts`'s own shape,
already exercised end-to-end (fake engine) by `mathEnhancer.test.ts`'s own "§3.9's three failures" describe
block. This task's real job, and the sealed Files line's own text ("(D-4-R's engine-failure and D-5-R's
sanitize-rejection cases)" as a PARENTHETICAL naming what the tests prove, not what ships) — write the
BROWSER-LEVEL, REAL-ENGINE proof these paths hold for Temml specifically, which `mathEnhancer.test.ts`'s
jsdom+fake-engine suite structurally cannot reach (that file's own header names exactly this gap). The one
`src/render/mathEngine.ts` change actually made is a DOC-COMMENT ADDITION (additive, per the sealed Files
line), pointing at the two new test files and stating that {@link loadMathEngine}'s own promise is the single
seam every engine-load failure passes through — zero behavioural change, confirmed by byte-identical rebuild.

**★ RED-FIRST, DISCHARGED BY CITATION FOR THE SHARED MECHANISM (AGENTS.md's own ablation rule), EARNED FRESH
FOR WHAT IS GENUINELY NEW.** AGENTS.md: "A test extension that mirrors an already-established pattern's
shape doesn't need its own per-extension ablation — the pattern's original ablation is standing precedent,
cite it instead of re-earning it." The STATE-MACHINE-LEVEL claims (one document-wide catch fails every fence
identically; an isolated per-fence failure leaves siblings untouched; a sanitizer rejection after a
successful render still degrades to source) cite `diagramDegrade.browser.test.ts`'s own "6.1" block and
`diagramRender.browser.test.ts`'s own render-failure/sanitize-rejection arms as standing precedent, rather
than re-deriving a fresh source-level revert against `mathEnhancer.ts` for a mechanism D-8-R already carries
unchanged. What genuinely IS new, and got its own non-vacuous proof: (1) arm B's real parse-failure surface —
a genuinely malformed, unterminated `\frac{a}{` thrown by the REAL installed `temml`; (2) arm C's real
sanitize-rejection surface — `instrumentedMath()` (`tests/browser/mathDegrade.browser.test.ts`, porting
`diagramRender.browser.test.ts`'s own `instrumented({ svg })` technique to Temml) wraps the REAL
`loadMathEngine()`/`renderToString` and corrupts only the returned string (stripping the `<math>` root) for
one formula, leaving the sibling's real output untouched — the engine genuinely ran and genuinely succeeded
(captured in a `raw[]` array asserted to contain a real `<math` tag) before the corruption made it
unrecognisable to `sanitizeMath`'s allow-list; (3) every arm's own RED-FIRST CONTROL is a FIXTURE-LEVEL
ablation rather than a source-level one — arm A's control re-runs the identical multi-formula document with
the rejecting loader simply omitted (production `import('temml')`) and requires full rendering; arm C's
control re-runs `instrumentedMath` with the IDENTITY transform (no corruption at all) over the same seam and
requires both formulas to render — each demonstrated, not assumed, by an actual run of both arms of the pair
in this same commit.

**★ THE ZERO-NETWORK GUARD, WITH THE FONT-SPECIFIC FIRING CONTROL §3.7 NAMES.**
`tests/browser/mathNetwork.browser.test.ts`, Cr+Fx: a fresh `$$x^2$$` render through the real production path
(`createReaderPane` → `mount()` → D-3-R's real call site → `import('temml')` → `renderToString` →
`sanitizeMath` → adopt → `registerMathFont()`) reads **zero OFF-ORIGIN resource-timing entries**, with two
non-vacuity axes (the formula genuinely rendered a `<math>` root; something real DID cross the wire in this
harness — same-origin dev-server fetches of the temml chunk and/or the font asset) and a THIRD, D-13-specific
one: the bundled STIX Two Math subset was itself fetched, found by its committed asset name, and resolved
SAME-ORIGIN. **The font-specific firing control** constructs a live `FontFace` with an OFF-ORIGIN `url()`
source (the loopback-cross-origin technique `diagramNetwork.browser.test.ts`'s own TIER 2 established —
`127.0.0.1:PORT` against a `localhost:PORT` page, cross-origin by the same-origin rule, answered by the same
local process, nothing ever leaves the machine) and `document.fonts.add()`s it — the EXACT mechanism
`mathFont.ts`'s own `registerMathFont()` uses, with NO production module touched — and proves the SAME
off-origin predicate that read zero above genuinely catches the request. **A genuine source-level ablation
was also run by hand while drafting this file** (swapping `mathFont.ts`'s bundled-asset import for a
hardcoded remote URL, rebuilding, re-running the real-path arm): it turned that arm red, the remote URL
appearing in the off-origin list — reverted before commit, narrated here rather than shipped as permanent
test code, since nothing in the suite can rebuild the extension mid-run. **One drafting-time finding, fixed
before commit**: `registerMathFont()`'s idempotent `registered` flag means only the FIRST math render in a
given test file's module instance ever puts the font on the wire — Firefox in particular appeared to serve a
second `FontFace` construction against the same URL from its in-process font cache without a second Resource
Timing entry, even after `resetMathFontForTest()`. Fixed by reading the font's own URL out of the file's one
guaranteed-cold render rather than relying on a second, reset one.

**★ THE THREE §3.9 DEGRADATION PATHS, REAL TEMML, BOTH ENGINES.** `tests/browser/mathDegrade.browser.test.ts`
— **arm A** (engine-load failure, document-wide): three distinct fenced formulas, an injected rejecting
loader; all three fail IDENTICALLY, each showing its OWN full source, no figures left over, a marker on each
naming "the math engine could not be loaded," prose at both ends of the document intact, an untouched
non-math fence neighbour unaffected — non-vacuity axis 1 (placeholders existed, read synchronously before the
async body ran) plus the red-first control (same fixture, loader omitted, renders all three). **arm B**
(per-formula render failure): a genuinely malformed `\frac{a}{` fence degrades to its own source with "this
formula could not be rendered," its well-formed `y^2` sibling still renders a real `<math>` tree in the SAME
document pass — Temml's own error UI confirmed absent (`throwOnError:true`'s own lockdown, re-confirmed here
rather than only in `mathBlock.browser.test.ts`'s D-9-R arm). **arm C** (sanitize rejection): `instrumentedMath`
corrupts one real `renderToString` return value (its `<math>` root stripped) while leaving the sibling's real
output untouched; the corrupted formula degrades to source with "the rendered formula was rejected by the
sanitizer," the untouched sibling renders normally, and the `raw[]` capture proves the engine genuinely
succeeded before the corruption. **One divergence from the kickoff's own framing, flagged**: §3.5 row 15's
"state in text+aria, never colour alone" language led the kickoff to expect an `aria`/`title` annotation; the
LANDED `markMathFailed` (D-8-R's "carries unchanged" from `markDiagramFailed`, verified by reading
`mathView.ts`) carries neither — the degradation states failure via a VISIBLE TEXT marker paragraph only, the
same mechanism `diagramView.ts`'s own precedent uses. This file tests what actually landed, not an
attribute shape the sealed mechanism never had.

**BYTES — UNMOVED, EXACT MATCH, BOTH ENGINES; NO PRODUCTION BEHAVIOUR CHANGED.** Fresh `rm -rf .output`
rebuild both BEFORE and AFTER this task's one doc-comment addition: content-script **340,492 B**, md5
`bcdcf231d2980c60538dd5ade0b3088d` Cr / `49e218a1f0bc2515a4e421b7a063e3d8` Fx — unmoved, exact match to
3.2-R's own floor, both readings. `.output` **5,191,586 B Cr / 5,191,702 B Fx** — unmoved, exact match to
4.2-R's own figure. Headroom **51,294 B (50.1 KiB) Cr / 51,178 B (50.0 KiB) Fx — POSITIVE, unchanged**.
Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources` — unmoved, both engines.

**STANDING INVARIANTS.** `pnpm lint` **EXIT=0**. Full `pnpm test` (unit): **1145/1145 passed, ALL GREEN, byte-
for-byte the SAME 66 files/1145 tests as 4.2-R's own close** — this task added no unit tests (both new files
are `tests/browser/*.browser.test.ts`). Full `pnpm test:browser` (Cr+Fx): **1571/1586 passed,
15 pre-existing skips, ALL GREEN, NO FLAKES this run** (160 files — 156 at 4.2-R's close + 4 new: this task's
two files × 2 engines; 18 new tests — `mathNetwork.browser.test.ts`'s 3 × 2 engines + `mathDegrade.browser
.test.ts`'s 6 × 2 engines). `git diff tests/golden/output/` **EMPTY** (this task touches no parse/render
path). `codeDetect.test.ts` and the 007/009/M11 import fences confirmed unaffected, run inside the same full
`pnpm test` pass above (this task's diff added no fence-scanned fixture and touched no import graph).

**ACCEPTANCE.** §4's block/fence degradation criteria hold for all three §3.9 paths against Temml's own real
output, both engines. The zero-network claim holds over the real production path with a firing control
specific to §3.7's own named font-fetch trap. Content-script bytes are EXACT-match unmoved. `git diff
tests/golden/output/` EMPTY.

*Group-4-R acceptance (plan (h)): §4's block/fence rendering and degradation criteria against Temml's own
output; D-9-R's lean measured and confirmed or corrected; the bundled font shipped for real and
zero-network-proven; `mount.ts` diff empty. — ALL DISCHARGED across 4.1-R–4.3-R.*

## 5-R — Enhancer scaffolding: inline math (D-7-R's inversion, carried unchanged)

- [x] **5.1-R Inline math — `mathEnhancer.ts`/`mathView.ts` (inline half): mutate-in-place, no sibling
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

★ **RESULT — ★ PROCEEDS UNDER THE OPEN 1.2-R FORK (decisions.md 2026-09-07 deviation, condition 1) —
D-7-R'S MUTATE-IN-PLACE INVERSION LANDED, THE PERSISTENCE PROPERTY PROVEN RED-FIRST ON BOTH ENGINES, ALL
THREE §3.9 PATHS DEGRADE WITH INLINE'S OWN TEXT+ARIA ANNOTATION SHAPE, AND THE BLOCK/INLINE FAILURE-UI
INCONSISTENCY 4.3-R FLAGGED IS RE-CONFIRMED AND ROUTED, NOT SILENTLY RESOLVED.**

**PREFLIGHT.** HEAD `546293d` confirmed, tree clean. Fresh `rm -rf .output` rebuilds BOTH engines
BEFORE any change: content-script **340,492 B**, md5 `bcdcf231…` Cr / `49e218a1…` Fx; `.output`
**5,191,586 B Cr / 5,191,702 B Fx**; manifest **654 / 770 B**, `permissions: []` — EXACT match to the
kickoff's own stated baselines, all four figures.

**THE MECHANISM — ONE `enhanceMath`/`renderMath` call site handles BOTH shapes now (D-3-R).**
`mathEnhancer.ts`'s private `renderMathBlocks` was generalized to `renderMath(doc, shadow, pairs, inline,
loader)`: ONE `loadMathEngine` call serves both block/fence pairs and inline markers in the same
`enhanceMath` invocation (never two separate engine loads), so an engine-load failure degrades BOTH
shapes identically, document-wide, from one catch. `mathInlineMarkersIn(root)` (mirrors `mathFencesIn`)
collects every `code.peekover-math-inline`; `mathInlineSourceOf(code)` peels the single leading/trailing
`$` (block's own `mathSourceOf` peels `$$`, D-8-R's distinct shape, unchanged). `renderMathFormula` grew
a `displayMode` parameter (`true` for block/fence, `false` for inline) rather than hardcoding `true` —
the ONE per-call fact D-4-R's own frozen config deliberately excludes.

**THE SYNCHRONOUS CLAIM, NOT A PROLOGUE.** D-7-R/the original 5.1's own text: "inline markers need no
synchronous prologue — their pending state IS their already-committed literal `$…$` text." No new DOM
structure is inserted (no figure, no wrapper) — but `enhanceMath` DOES set `MATH_STATE_ATTR='pending'`
directly on the `<code>` element itself, synchronously, before scheduling the async render. This is not a
structural prologue (nothing new appears on screen) but IS necessary for idempotency: a second,
concurrent `enhanceMath` call before the first settles must not re-collect and re-render the same marker.
Proven directly (`mathInline.browser.test.ts`'s own idempotency test, both engines): calling `enhanceMath`
twice back-to-back, synchronously, before settling, yields exactly one rendered `<math>` tree, never two.
`MATH_STATE_ATTR` is reused UNCHANGED (not a new attribute) — a different tag+class selector
(`code.peekover-math-inline[data-math]` vs. block's `pre[data-math]`) means there is no cross-shape
collision to worry about, distinct from D-8-R's own "kept distinct from `data-diagram`" concern (a
DIFFERENT ENGINE'S selector, not a different SHAPE of this engine's own attribute).

**★ THE PERSISTENCE PROPERTY, RED-FIRST, BOTH ENGINES — D-7-R's OWN NAMED CONTROL.** A genuine ablation
was run and reverted before this commit: `markMathInlineRendered` was temporarily rewritten to build a
NEW `<code>` element, `replaceChildren` the content onto IT, and `code.replaceWith(replacement)` — the
exact defect class D-7-R's own text warns against. `mathInline.browser.test.ts`'s own persistence test
(an expando `Symbol` anchor set on the pre-render element, plus a `toBe` reference-identity assertion on
the post-render element) went RED under this ablation on BOTH engines, naming the missing anchor
explicitly (`expected <code>…</code> to be <code>…</code> // Object.is equality`, and the expando read
`undefined`). Reverted; `git diff src/render/mathView.ts` after revert showed byte-identical restoration
of `markMathInlineRendered`, confirmed against the real (non-ablated) test passing again, both engines.
This is the concrete, non-vacuous discharge of the task's own "reverted by removing/replacing the element
on success, which must go red naming the missing anchor" Verify clause.

**THE THREE §3.9 DEGRADATION PATHS, INLINE, REAL TEMML, BOTH ENGINES — ARMS D/E/F, RED-FIRST OR CITED PER
AGENTS.md's ABLATION RULE.** `mathDegrade.browser.test.ts` gained three new describe blocks (this file's
own "inline half," additive to 4.3-R's arms A/B/C for block/fence): **arm D** (engine-load failure,
document-wide) — two inline formulas in one sentence, an injected rejecting loader; both fail identically,
content COMPLETELY UNTOUCHED (`textContent` still exactly `$alpha^2$`/`$beta^2$`), each carrying
`data-math-failed` AND `title` naming "the math engine could not be loaded," no sibling node added
(`parentElement.children` unchanged at 2 — just the two `<code>` markers themselves), red-first via the
NON-VACUOUS CONTROL (the identical fixture, loader omitted, both render). **arm E** (per-marker render
failure) — a genuinely malformed `\frac{a}{` inline formula degrades with its own source untouched and
its well-formed sibling ($y^2$) still renders a real `<math>` tree in the same pass; Temml's own error UI
confirmed absent (`.temml-error` count zero). **arm F** (sanitize rejection) — `instrumentedMath` (the
SAME real-engine-wrapping technique 4.3-R's own arm C established) corrupts one real `renderToString`
return value's `<math>` root while leaving the sibling's real output untouched; the corrupted marker
degrades with source untouched + the "rejected by the sanitizer" annotation, the untouched sibling
renders normally, `raw[]` proves the engine genuinely succeeded before the corruption. Per AGENTS.md's
citation rule, the STATE-MACHINE-LEVEL claims (document-wide uniformity, per-marker isolation,
latest-moment sanitize rejection) cite arms A/B/C (and through them `diagramDegrade.browser.test.ts`/
`diagramRender.browser.test.ts`'s own standing precedent) as already-earned; what is genuinely NEW and
gets its own fresh, non-vacuous proof is the CONTENT-UNTOUCHED + IN-PLACE-ANNOTATION shape itself — block
never exercises this, since block's own degrade path drops a placeholder and adds a sibling, the opposite
shape. Every arm's own red-first control (the rejecting loader omitted; the identity-transform wrapper)
was actually run in this commit, not merely asserted — 6/6 new tests × 2 engines = 12, all green.

**★ THE FAILURE ANNOTATION — ROW 15's D REQUIREMENT, SATISFIED FOR INLINE, RE-CONFIRMING AND ROUTING
4.3-R's OWN FLAG.** `markMathInlineFailed(code, reason)` sets `MATH_STATE_ATTR='failed'` PLUS
`MATH_INLINE_FAILED_ATTR` ('data-math-failed', machine-readable) PLUS `title` (a native tooltip) — never
touching the element's content, never inserting a sibling. This genuinely DOES satisfy §3.5 row 15's own
"text+aria, never colour alone" language more literally than block's own marker does: 4.3-R's own RESULT
block found `markMathFailed` (D-8-R's "carries unchanged" from `markDiagramFailed`) carries NEITHER
`title` NOR `aria`/`data-*` — only a visible TEXT paragraph. **This is a real, now twice-confirmed
inconsistency between the two engines' own failure UI, NOT resolved here** (out of this task's Files
scope, per the kickoff's own instruction) — restated explicitly as a CARRIED ITEM for 6.1-R (block's own
control-group/accessibility task) or 8.1-R's milestone-close walk to reconcile, whichever lands first.
Nothing in this task's own diff touches `markMathFailed` (block's marker) — `git diff` confirms
`mathView.ts`'s block-half functions are byte-identical to 4.3-R's close, changed lines are additive only.

**ROW 17 — ACCESSIBLE NAME FROM THE `<math>` TREE, NOT OVERRIDDEN.** `markMathInlineRendered` sets no
`aria-label`; `mathInline.browser.test.ts` asserts directly, both engines, that a rendered inline marker
carries neither `aria-label` nor `title` (title is reserved for the FAILED state only) — nothing in this
task's own code interferes with the `<math>` tree's own native accessible-name semantics.

**ROW 11 — NO CONTROL GROUP, NO HOVER/FOCUS POPOVER, NO NEW INTERACTIVE ELEMENT — NEGATIVE, DELTA-BASED.**
A first draft of this test asserted an absolute zero-buttons-in-the-shadow count and went red — not a
defect in `enhanceMath`, but a wrong assumption: the app-page reader pane's own pre-existing chrome (the
diff-compare pill, export controls) already carries buttons unrelated to math. Fixed to a DELTA-based
assertion (button/`[role=group]`/`[role=toolbar]` counts captured before enhancement, asserted unchanged
after) PLUS a scoped check (no `button` inside the marker or its immediate parent) — the AGENTS.md
harness-shared-state discipline applied here even though this is per-test-fresh state, not cross-test
shared state, because the same "absolute count vs. delta" failure mode applies to any DOM with
pre-existing chrome.

**REAL-ENGINE FACTS, BOTH ENGINES.** `mathInline.browser.test.ts`'s own rendering test: the `<code
class="peekover-math-inline">` element's computed `display` is neither `none` nor `block` (inline-capable,
sitting in running text); the enclosing `<p>` carries the prose text on BOTH sides of the formula
unbroken; `parentElement.children` has length 1 (only the `<code>` itself — no sibling ever inserted,
confirmed as a real DOM fact, not just an absence-of-code claim). The content-script two-surface
comparison (row 4, inline): an inline marker there stays `data-math`-free, `textContent` exactly
`$x^2$`, no `<math>` child — `enhanceMath` genuinely never runs on that graph (D-3-R, re-confirmed for
inline specifically). Font resolution: a rendered inline `<math>` element's computed `font-family`
contains `'Peekover Math'` — the glyph-advance DIFFERENTIAL proof (the non-vacuous discriminator) is
CITED from `mathBlock.browser.test.ts`'s own INPUT A arm per AGENTS.md's ablation rule, since it exercises
the SAME shared CSS rule (`mathCss.ts`'s `.peekover-reader math{font-family:'Peekover Math', math;}` does
not distinguish block from inline by selector) — this task's own test is the direct, real-engine computed-
style check at the inline call site specifically, which nothing else exercises.

**BYTES.** Fresh `rm -rf .output` rebuilds, both engines, both BEFORE and AFTER this task's diff:
content-script **340,492 B**, md5 `bcdcf231…` Cr / `49e218a1…` Fx — UNMOVED, exact match to 3.2-R's own
floor (inline reuses the SAME app-page-only `enhanceMath` call site; no new content-script reach). `grep -c
temml` on both built content-script bundles: **0**. `.output` **5,192,207 B Cr / 5,192,323 B Fx** — **+621
B both engines** over 4.3-R's own unmoved figure (5,191,586 / 5,191,702), the eager glue this task's own
additive code contributes to the already-loaded app-page graph (no new lazy chunk — inline reuses
`mathEngine.ts`/`mathCss.ts`/`mathFont.ts` verbatim). **Headroom: 5,242,880 − 5,192,207 = 50,673 B (49.5
KiB) Cr; 5,242,880 − 5,192,323 = 50,557 B (49.4 KiB) Fx — POSITIVE, still comfortable**, down only ~620 B
from 4.3-R's own ~50.1/50.0 KiB. Manifest **654 / 770 B**, `permissions: []`, no
`web_accessible_resources` — unmoved, both engines.

**STANDING INVARIANTS.** `pnpm lint` **EXIT=0**. `tsc --noEmit` clean. Full `pnpm test` (unit):
**1145/1145 passed, ALL GREEN, byte-for-byte the same 66 files/1145 tests as 4.3-R's own close** (this
task added zero unit tests, per its own sealed Files line — all new coverage is `tests/browser/*`). Full
`pnpm test:browser` (Cr+Fx): **1597/1612 passed, 15 pre-existing skips, ALL GREEN, NO FLAKES this run**
(162 files — 160 at 4.3-R's close + 2 new: `mathInline.browser.test.ts` × 2 engines; 26 new tests —
`mathInline.browser.test.ts`'s 7 × 2 + `mathDegrade.browser.test.ts`'s 3 new arms' 6 × 2). The two
previously-observed ambient Firefox flakes (`tocScroll`, `diagramActions`) did NOT reproduce this run —
consistent with AGENTS.md's own framing of them as intermittent, not persistent. `git diff
tests/golden/output/` **EMPTY** (this task builds no markdown fixture and touches no parse/mount path).
`codeDetect.test.ts` + 007/009/M11 import fences run standalone: **42/42 passed** (14 codeDetect + 8 + 9 +
11 = 28 import-fence tests, unaffected).

**DIVERGENCE FROM THE KICKOFF, FLAGGED.** The kickoff's own §1 anticipated inline's own state possibly
needing a shape distinct from `MATH_STATE_ATTR` to avoid a "collision with block." Measured: no such
distinct shape was needed or built — `MATH_STATE_ATTR` is reused verbatim on the `<code>` element itself,
and there is no collision because the selector is tag+class-scoped (`code.peekover-math-inline[data-math]`
vs. `pre[data-math]`), exactly as `tasks.md`'s own sealed 5.1-R text says ("Identical mechanism... only the
swapped-in content changes"). The kickoff's own §2 asked whether inline's row-15 shape and block's own
text-only marker are now inconsistent — CONFIRMED yes, re-stated above as a carried item routed to
6.1-R/8.1-R, not retrofitted here (out of Files scope, per the kickoff's own instruction not to let it
vanish). One test-drafting-time finding not anticipated by the kickoff: the row-11 negative assertion's
first draft (absolute zero-buttons) was wrong given the reader pane's own pre-existing chrome — fixed to a
delta-based assertion, per §ROW 11 above.

**ACCEPTANCE.** §4's inline rendering/degradation criteria hold against Temml's own `<math>` output, both
engines. D-7-R's persistence property is proven RED-FIRST, both engines, with a genuine ablation run and
reverted. The failure annotation carries BOTH `title` and `data-math-failed`, satisfying row 15's D
requirement more literally than block's own marker — the resulting cross-engine inconsistency is stated,
not smoothed over, and routed to 6.1-R/8.1-R. No control group, no hover/focus popover, no new inline
element anywhere in the diff (delta-proven). Content-script bytes are EXACT-match unmoved. `git diff
tests/golden/output/` EMPTY.

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
