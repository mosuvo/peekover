# Plan 011 — Math rendering: KaTeX (+ contingent MathJax fallback) for inline/block/fence math (M11)

**Status:** draft (Gear-3 gate 2 — REVISIT — awaiting human approval before `tasks.md` revisit)
**Date:** 2026-09-06
**Spec:** `specs/011-math-rendering/spec.md`, approved at gate 1 (`decisions.md`'s 2026-09-06 M11 GATE 1
entry, four rulings — see below). This plan is the HOW; it resolves the spec's nine §7 risks against the
**actual code**, not against the spec document. No §3.x decision is re-opened, and nothing on the §6
IS-NOT list is proposed.
**Gate-1 rulings inherited, not re-argued:** **RULING 1** (§9-1, the dependency set: KaTeX+MathJax vs.
KaTeX-only) — MEASURED, not chosen, at task 1.1; this plan states the axes and the contingency structure,
not the answer. **RULING 2** (§9-2) — CONFIRMED app-page-only. **RULING 3** (§9-3) — CONFIRMED, a second
math-shaped sanitizer profile, document profile untouched. **RULING 4** (§9-4, toggle semantics) —
DEFERRED, moot unless RULING 1 includes MathJax at all. These are treated as GIVEN throughout; none is
re-opened below.
**Evidence base:** a codebase recon at `60a98d6`, plus verification of KaTeX's external contracts (its
`trust` option, its default output mode, its font self-hosting requirement, its own security posture)
against current official documentation and community-maintained-plugin status (AGENTS.md's standing rule
— training knowledge of a fast-moving library is a hypothesis until re-checked). Every `file:line` below
was re-derived against the tree in this session; nothing is inherited from the spec or from the kickoff
brief. **No `katex` or MathJax package has been installed** — this plan names the architecture the byte
measurement (task 1.1, group 1) must still run against real, installed code, the same discipline 007's
plan observed for `mermaid` and 010's for `docx`.
**★ THE ARCHITECTURAL PRECEDENT IS `specs/007-mermaid-diagrams/plan.md` IN FULL, read and cited throughout
by D-value, group, and file:line — not paraphrased.** Math is the same shape as diagrams one milestone
later (a client-side render library, lazy-loaded on content-present, app-page-only, its own sanitizer
profile, post-mount enhancement, degrade-to-source, byte-gated) with four genuine points of divergence
this plan does new architectural thinking on, named up front so they are not lost in the reuse: **(1)** a
NEW markdown-it parse-time rule is required (007 needed none — a mermaid fence is markdown-it's existing
fence renderer); **(2)** KaTeX's default output is TWO markup vocabularies at once (an HTML+class visual
tree and an embedded MathML accessibility tree), not one SVG tree, which reshapes the sanitizer profile
and *gives* copy-as-MathML its mechanism for free; **(3)** inline math cannot use 007's sibling-`<figure>`
shape at all — inline math sits inside a sentence, not beside a block — so its degradation model
INVERTS 007's D-15 (mutate-in-place, not sibling-insert); **(4)** the CONTINGENT second engine (MathJax)
must be structured as a clean, purely-additive drop point, not a dependency graph the KaTeX groups quietly
run through. Everywhere else — the single-importer specifier discipline (D-13), the two-call-site
enhancement wiring (D-12), the byte-measurement-first sequencing (007 group 1) — this plan inherits 007's
shape and cites it rather than re-deriving it.

---

## PLAN REVISIT — 2026-09-06 (post gate-1-revisit approval, branch (C)'s MathML/Temml reopen)

**★ THIS PLAN'S ARCHITECTURE IS REOPENED. The sections below this block (§0 onward) are the ORIGINAL
gate-2 draft, preserved for provenance — read them as history, D-value by D-value, not as current
architecture. This block is the current architecture. Where a clause below states it SUPERSEDES,
SIMPLIFIES, CARRIES, or VACATES an original D-N, the D-N-R text here governs; the original D-N text is not
edited in place, the same convention `spec.md`'s own REVISIT block established for this milestone
(`e13284f`) and gate-1-revisit approved (`decisions.md`'s "M11 GATE 1 — REVISIT" entry, `2b70d94`).** This
re-enters the gate cycle at gate 2 — a draft, not an approval; the approval, if given, lands as a future
`decisions.md` "M11 GATE 2 — REVISIT" entry, per the same bank-not-artifact precedent this plan's own
status line follows (it stays "draft… awaiting human approval," never edited to say "approved," the
M7–M10/gate-1-revisit precedent). `tasks.md`/`decisions.md`/`spec.md` are untouched by this block.

### R-0 · Re-verification before leaning on inherited facts

The original D-3 rode two call sites at `readerPane.ts:187` and `appShell.ts:170`. Re-grepped fresh at
this session's HEAD (`2b70d94`), not carried from the original plan's own now-stale citation: both anchors
are **UNCHANGED** — `src/app/readerPane.ts:187` still reads `enhanceDiagrams(host);` inside the paint path
after `mount()` returns, and `src/app/appShell.ts:170` still reads `enhanceDiagrams(target);` inside the
`render` closure passed to `createWatchController`, with `enhanceDiagrams` imported at `appShell.ts:117`
and `readerPane.ts:20` exactly as the original plan described. **No drift** — the two-call-site wiring
D-3 named is re-confirmed as fact, not re-derived as a new claim, and D-3-R below inherits it unmodified.

### The revised D-value set

*Each D-N-R names which original D-N it supersedes, simplifies, carries, or vacates. Original numbering is
the reference spine — nothing is silently renumbered. One genuinely new D-value (the bundled math font,
(d) below) gets the next unused number, D-13, since D-1…D-12 are all spoken for by the original ledger.*

**D-1-R · Tokenizer — SUPERSEDES D-1 IN CANDIDATE, CONFIRMS D-1 IN KIND.** The KIND of mechanism D-1
chose — a tokenizer-only markdown-it rule that recognizes `$…$`/`$$…$$`/a ` ```math ` fence and emits a
passthrough marker, never a rule that renders — is **UNCHANGED and RE-AFFIRMED**: nothing about switching
the render engine from KaTeX to Temml changes the argument against `@mdit/plugin-katex`-shaped
synchronous-render coupling (D-1's own §3.3 citation holds regardless of which engine sits behind the
passthrough marker). What is NOT re-affirmed is the CANDIDATE: D-1 named `@mdit/plugin-tex` as chosen,
verified maintained and tokenize-only. That verification does not lapse (task 1.1's own original
measurement already installed and probed it, per `progress.md`'s 1.1 RESULT), but it is no longer the ONLY
live candidate — **`@mdit/plugin-tex` (already installed, per `package.json`'s current `dependencies`,
unreverted since 1.1) and a Temml-native tokenizer equivalent are named side by side as the two candidates
the reopened task 1.1 must resolve between, NOT pinned here.** Temml's own documentation may recommend a
specific markdown-it integration this plan has not installed or read — that is exactly the "verify against
the actual package, not memory" obligation AGENTS.md states, and this plan does not guess at a package name
it has not seen. **D-1's own revisit-when clause (a hand-rolled rule, if the chosen tokenizer proves
unusable standalone) CARRIES VERBATIM** — unaffected by which engine sits downstream of the marker.

**Carried plan-input (1) lands here, priced, not assumed away:** the tokenizer — whichever candidate wins —
sits on `parse.ts`'s SHARED markdown-it instance, which is on BOTH the app-page and content-script module
graphs. Task 1.1's own original measurement priced this at **+3,957 B on EACH graph**
(`progress.md`'s 1.1 RESULT), and `progress.md`'s revisit-record amendment already named the consequence
plainly: this **FALSIFIES `tasks.md`'s own standing invariant** that math never enters the content-script
module graph. **This reopened plan states the amendment explicitly rather than leaving it as a carried
note**: the content-script-byte invariant `tasks.md` states (once a revisited `tasks.md` is drafted) must
read "content-script bytes move by exactly the tokenizer's own always-loaded floor (+3,957 B or whatever
the reopened task 1.1 re-measures for the actually-chosen candidate), and by nothing else, for the whole
milestone" — not "byte-identical." The SECOND, behavioral cousin `progress.md` also named — a `$x$` span on
the content-script `file://` reader rendering as inert monospace `<code>` at rest, never enhanced (§9-2
holds; `enhanceMath` still never runs there) — is a real, visible departure from spec §3.2's "no math
affordance and no explanatory note" framing that the reopened implementation must price as a cost, not wave
through as unremarkable, when the revisited golden-fixture audit (group 3-R) runs.

**Carried plan-input (2) lands here, unresolved, named as the reopened task 1.1's own job:** IF
`@mdit/plugin-tex` remains the chosen candidate, its declared peer dependency on `markdown-it@^15.0.0`
against this repo's installed `14.3.0` stays a **latent tokenizer-correctness risk** (`$5`-style false
positives, code-span exclusion, escaping) that the original 1.1 probe never tested (registration-only). The
reopened task 1.1 must exercise those specific edge cases before this risk is treated as closed, on
`progress.md`'s own "not merely a version-string warning" framing — and if a Temml-native tokenizer is
chosen instead, this specific risk is moot for a different reason (a different plugin, a different peer
graph) that the reopened task 1.1 states explicitly rather than silently inheriting the concern past its
own applicability.

**D-2-R · Engine module — SUPERSEDES D-2, COLLAPSING ITS "TWO MODULES" STRUCTURE TO ONE.** D-2's own
stated reason for two parallel engine modules (`mathEngine.ts` for KaTeX, a second file for MathJax) was
"dropping MathJax must be a file-deletion, not a refactor" — a rationale that only has force while a SECOND
engine is a live possibility. MathJax is struck permanently (REVISIT-RULING 4, `decisions.md`), and no
third engine is on the table, so **there is exactly one engine module, `src/render/mathEngine.ts`,
importing Temml via the same static-literal-specifier discipline D-2 established (`import('temml')` or
whatever the reopened task 1.1 verifies the actual package specifier to be) — the single-importer fence 007
D-13/D-2 established, unchanged.** Temml is **NAMED AS THE CANDIDATE TO VERIFY** in the exact 1.1-shaped
sense D-2's own KaTeX naming was: size, licence, ESM shape, install scripts, and LaTeX-macro coverage all
re-measured against the real package at the reopened task 1.1, **NOT pinned and NOT installed by this
plan.** `mathEngine.ts` keeps D-2's own division of labor — feature-detect (`hasMathMarker`/
`loadMathEngine`), engine configuration (D-4-R below), nothing that renders on its own.

**D-3-R · Render surface & call sites — CARRIES D-3 UNCHANGED, RE-VERIFIED (R-0 above).** App-page-only
(§9-2 still holds, per `decisions.md`'s reconciliation), the same two call sites
(`readerPane.ts:187`/`appShell.ts:170`), `enhanceMath` added immediately after `enhanceDiagrams` at each,
`mount.ts` untouched. Nothing about the engine swap changes the manifest/byte-margin/import-fence reasoning
D-3 gave — this D-value's substance did not change, only its evidence was re-confirmed rather than
inherited stale.

**D-4-R · Engine config lockdown — SUPERSEDES D-4, RE-DERIVED RATHER THAN PORTED.** D-4's SUBSTANCE
(pin failure semantics explicitly so a formula's own failure reaches OUR degrade path, not the engine's own
error UI; pin a security-relevant default explicitly rather than trust an unstated one) is **RE-AFFIRMED as
a pattern**, but its VALUES do not transfer, and **carried plan-input (3) is exactly why**: Temml's own
throw-vs-error-node-vs-rendered-error-element failure semantics, and its option defaults generally, are
**NOT ASSUMED to match KaTeX's `trust`/`throwOnError` shape** — the reopened task that lands this D-value
concretely (group 4-R) reads Temml's OWN current documentation and installed source, the same
never-from-memory discipline AGENTS.md states, before choosing the equivalent lockdown config. **D-4's
`output: 'htmlAndMathml'` pin is VACATED, not contradicted** — that pin existed to keep KaTeX's dual
HTML-visual/MathML-accessibility output BOTH present in one string; Temml has no such duality to preserve
because **MathML is the only output a MathML-output-strategy engine produces by its own nature** (spec
REVISIT (b)). There is no output-mode CONFIGURATION question for Temml the way there was for KaTeX — this
is a simplification the reopen earns, not a decision this plan makes, and it is named as VACATED rather than
silently dropped so a future reader does not go looking for Temml's own `output` option and wonder why D-4-R
is silent on it.

**D-5-R · Sanitizer profile — SIMPLIFIES D-5 TO A SINGLE MathML-ONLY ALLOW-LIST.** §9-3 (`decisions.md`'s
reconciliation) confirms a third named sanitizer profile still exists, now stated as **simplified**: D-5's
own "two vocabularies, one profile" structure (KaTeX's HTML visual tree ADMITTED ALONGSIDE its MathML tree)
collapses to ONE vocabulary, because there is no parallel HTML visual tree to admit — every tag Temml emits
is a MathML tag. `MATH_ALLOWED_TAGS`/`MATH_ALLOWED_ATTR`/`SANITIZE_MATH_CONFIG`/`sanitizeMath` CARRY as
named exports and as `sanitize.ts`'s third-profile pattern (additive, document and SVG profiles
byte-untouched — non-negotiable, unchanged). The exact tag enumeration is **RE-DERIVED against Temml's real
installed output, not D-5's own KaTeX-output-derived starting list** — a MathML-output library may or may
not emit the same breadth of tags (`menclose`, `mpadded`, `mstyle`…) KaTeX's `htmlAndMathml` mode did, and
this plan does not carry D-5's own hypothesis forward as if it were already verified for a different
engine. **`ALLOW_ARIA_ATTR: true` CARRIES** — spec §5's accessible-representation requirement is
engine-agnostic. **No `href`/`src` in the allow-list CARRIES**, by the same trust-boundary reasoning D-5
gave, restated for whatever Temml's own trust/sanitization-relevant config (D-4-R) turns out to be.
**`cleanMathStyle` (D-5's own procedural `style`-value filter) is an OPEN QUESTION, not carried
automatically:** D-5 needed it because KaTeX's HTML visual tree is fundamentally `style`-attribute-driven
(its `.vlist` positioning mechanism). Native MathML elements do not generally carry the same class of
numeric inline-style positioning — whether Temml's own output uses `style` attributes at all, and for what,
is **the reopened group 2-R task's own first finding to make against real installed output**, not this
plan's to assume either way. If Temml's output carries no `style` attribute at all, `cleanMathStyle` and
`style` itself are simply absent from `MATH_ALLOWED_ATTR` — a smaller profile than D-5's, not a gap.

**D-6-R · Copy mechanism — SIMPLIFIES D-6 AND §8-1'S RULING, NEITHER REOPENED IN SUBSTANCE.**
Copy-as-LaTeX **CARRIES UNCHANGED**: it reads the retained source text, never the rendered artifact,
regardless of which engine rendered it — D-6's own reasoning (the author's bytes, not an engine's
round-trip echo) is engine-agnostic by construction. Copy-as-MathML **SIMPLIFIES**: D-6's own text already
anticipated exactly this shape — "clone the rendered `<math>` tree... now the only rendered tree, simpler
than the original D-6's dual-output clone, since there is no parallel KaTeX HTML layout to choose between"
(spec REVISIT (b), quoted). There is no longer a question of WHICH tree to clone (KaTeX's embedded
`<math>` inside an HTML wrapper vs. the visual tree) — the live-DOM artifact IS the `<math>` tree, cloned
and serialized with `XMLSerializer` exactly as D-6 already described. **§8-1's gate-2 ruling (option (b):
text-selection for inline copy-as-LaTeX, a document-level "copy all formulas as MathML" action for
copy-as-MathML, no per-formula inline control group) SURVIVES AND SIMPLIFIES for the identical reason** —
the document-level action now clones the ONE tree every formula renders to, not one of two output modes.
Block math's own hover/focus control group (D-8-R below) is unchanged in mechanism.

**D-7-R · Inline math shape — CARRIES D-7'S MECHANISM UNCHANGED; ONLY THE SWAPPED-IN CONTENT CHANGES.**
D-7's own reasoning for the mutate-in-place inversion was never about KaTeX's specific output shape — it
was that (1) the document `ALLOWED_TAGS` array admits no generic inline container, so `<code
class="peekover-math-inline">` is reused rather than widening the document profile, and (2) inline content
has no sibling slot to insert a `<figure>` beside. **Both reasons are entirely engine-agnostic** — a native
MathML `<math>` element being inline-capable by its own semantics (it can sit inside running text) does NOT
change where in the DOM it gets inserted; it changes WHAT gets inserted. `<code
class="peekover-math-inline">` still starts as literal `$…$` source text (degradation-is-the-default-state,
unchanged), and on success the enhancer still `replaceChildren`s the SAME element with the sanitized
fragment — now a single `<math>` tree rather than KaTeX's HTML+MathML dual fragment. The in-place
`data-math-failed`/`title` failure annotation (D-7's own mechanism, not a new node) **CARRIES UNCHANGED**.

**D-8-R · Block/fence math shape — CARRIES D-8'S MECHANISM UNCHANGED; THE SAME "SWAPPED CONTENT ONLY"
NOTE APPLIES.** Dollar-block and fence math still resolve to the identical `<pre><code
class="language-math">` shape, still reuse 007's sibling-figure machinery verbatim (a `<figure>` sibling
replaces the hidden `<pre>` on success), still need `mathSourceOf`'s `$$`-peel for dollar-origin content
only. The `data-math` three-state attribute (`pending`/`rendered`/`failed`), kept distinct from
`data-diagram`, **CARRIES UNCHANGED**. What changes is only WHAT the `<figure>` ends up containing — a
native `<math display="block">` tree instead of KaTeX's rendered HTML — which is D-4-R/D-5-R's concern, not
this D-value's.

**D-9-R · Theme inheritance — CARRIES D-9'S POSTURE (a LEAN requiring task-level measurement), NOT ITS
EVIDENCE.** D-9 leaned on KaTeX's documented CSS painting via inherited/`currentColor`-style text colour,
not baked hex — an argument specific to KaTeX's own HTML+CSS rendering pipeline. **Native MathML rendering
is, if anything, a STRONGER version of the same lean, not a weaker one**: a browser's own MathML layout
engine paints text nodes (`<mi>`, `<mo>`, `<mn>`, …) using ordinary CSS `color` inheritance by default,
with no rendering-library-authored CSS class or computed inline colour value in the mix at all — there is
no KaTeX-authored stylesheet for a theme to conflict with. **This remains a LEAN, not a closed decision,
on the identical epistemic-honesty posture D-9 itself modeled**: the reopened group 4-R/task-level
measurement still needs a REAL contrast measurement of a rendered formula at light/dark/sepia, because a
lean that "looks obviously true" is exactly the class of claim the M9 gantt/pie dark-mode defect proved
false in practice for a structurally similar case. **One new thing to verify, not assumed either way: Temml
error rendering.** If Temml's own error/failure path (carried plan-input (3), D-4-R) renders a partial
formula with a hardcoded error colour rather than throwing cleanly to our own degrade path, that specific
element is priced as its own finding at task time — it does not reopen this D-value's MECHANISM claim
(no re-render subscription needed), the identical scoping D-9's own closing paragraph already drew.

**D-10 — VACATED, permanently, not merely "unopened."** D-10 structured the MathJax contingency as a
purely-additive drop point specifically so RULING 1's measured answer would be cheap to act on either way.
**RULING 1 already resolved this question (branch (C)), and REVISIT-RULING 4 struck MathJax permanently**
(`decisions.md`) — there is no longer a contingent second engine for D-10's own drop-point structure to
describe. D-10's own text stays as a historical record of a structuring discipline the M7-precedent project
convention may reuse for a FUTURE contingent-dependency milestone, but it names no live obligation for M11.

**D-11 — VACATED, permanently, for the same reason as D-10.** No MathJax toggle exists to need a settings
field, because MathJax does not ship. D-11's own "shape only, if it ships" framing was already contingent —
the contingency resolved to "does not ship," so D-11 names no live obligation either.

**D-12-R · Cache measurement — CARRIES UNCHANGED IN SUBSTANCE, RE-STATED FOR THE NEW ENGINE.** §3.6's own
lean against a persistent cache is engine-agnostic (it is about per-formula render COST being typically
cheap relative to a diagram's own graph layout, not about which engine does the rendering), and D-9-R's own
point above (MathML painting needs no theme component in a cache key, same as D-9's own point for KaTeX)
carries with equal force. **Group 8-R still measures render-timing across 1/10/50-formula documents before
any cache is designed** — this D-value's own binding text ("no cache is designed speculatively") is
unchanged by the engine swap, and Temml's actual render-cost profile (parse + native browser MathML layout,
vs. KaTeX's own JS-computed HTML layout) is a **NEW, unmeasured variable** the reopened group 8-R must not
assume mirrors KaTeX's — it could be faster (no JS layout computation, the browser's own native MathML
engine does it) or slower (a less-optimized code path in most browsers' MathML implementations); this plan
states the axis, not a guess at its answer.

**D-13 · The bundled math font — NEW, no original analog, the reopen's own defining new asset.** Per spec
REVISIT (c): Firefox self-falls-back to its own bundled OpenType MATH font for MathML rendering, but
**Chromium does not render MathML acceptably without a page-supplied OpenType MATH font** (radical/integral
sizing, stretchy delimiters, and script placement degrade visibly on a system font). This plan therefore
names **one subsetted OpenType MATH font as a REQUIRED bundled asset for Chrome fidelity, not an optional
nicety** — candidates named, none chosen: **Latin Modern Math, Noto Sans Math, STIX Two Math**, family and
subsetting strategy (which glyph ranges a representative formula corpus actually needs — spec REVISIT (d)'s
own dense-corpus framing) TBD at the reopened implementation gate. **Self-hosted, zero-network** —
`?inline`-style build-time resolution (mirroring D-4(007)-shaped or this plan's own original §1.4 mechanism
for KaTeX's fonts) is the presumptive mechanism, RE-VERIFIED against whatever asset-loading shape a
subsetted `@font-face` WOFF2 actually needs in this project's shadow-root CSS-injection pattern — not
assumed to be identical to a stylesheet's own `url()` font reference the way §1.4 handled KaTeX's fonts,
since a font applied via CSS `@font-face` inside a shadow root is itself a `?inline`-adjacent but distinct
build/inject shape this plan has not verified. **Its byte cost is the milestone's new central budget line**
(fit against headroom is a MEASUREMENT — the fidelity-spike-first gate, (h) below); **its rendering quality
on both engines is a VISUAL-WALK gate**, not a byte question at all — a font that fits comfortably but
still looks wrong on Chrome fails RULING 2's own bar regardless of its size.

### (h) The group sequence — SUPERSEDES §6 — FIDELITY-SPIKE-FIRST

**The reopened implementation's Group 1 is no longer "the byte measurement alone" — it is a MERGED
fidelity-AND-byte gate, because REVISIT-RULING 3's own fork triggers on EITHER axis failing.** Concretely,
Group 1-R must, before any other group opens:

1. Install Temml for real (D-2-R's own naming, not a pin) and the reopened task 1.1's chosen tokenizer
   candidate (D-1-R); measure `.output`/`pnpm zip` deltas for the Temml JS + the tokenizer's own
   always-loaded floor, against the current ~352.8/352.7 KiB / ~607.8/607.7 KiB headroom, decomposed to a
   fully accounted residual — the identical D-11(007)-shaped ablation discipline the original Group 1 used.
2. Subset and measure the chosen bundled math font's (D-13) own byte cost against the SAME headroom,
   combined with (1) — the font is not a separate later concern; it is part of the SAME byte gate, because
   REVISIT-RULING 3's fallback triggers on the COMBINED failure to fit, not on Temml's JS cost alone.
3. Run a real-engine Chrome-and-Firefox visual-fidelity walk, extension loaded, of Temml-rendered MathML
   with the chosen bundled font over a dense representative formula corpus, judged against
   REVISIT-RULING 2's own bar: **acceptable, readable math typesetting on BOTH engines** — explicitly NOT
   visual equivalence to KaTeX's own HTML layout, per that ruling's own text.

**PASS: both axes clear → Groups 2-R onward (below) are AUTHORIZED to proceed, each against the D-value set
above. FAIL on EITHER axis (font busts headroom, or Chrome's rendering falls below the readable-on-both bar)
→ REVISIT-RULING 3's own pre-stated fallback fires: CLOSE M11, ship no math rendering — a legitimate, named,
non-defeatist outcome, restated here at the plan level exactly as `decisions.md`'s approval states it.**
This plan does **not** decompose Group 1-R into its own numbered tasks — that is the reopened `tasks.md`'s
own job — but states the ordering constraint and the fork explicitly, so a revisited `tasks.md` cannot
sequence any rendering, sanitizer, or enhancer work ahead of this gate the way the original Group 1 gated
everything after it.

**Groups 2 through 6 and 8–9 CARRY FORWARD IN SHAPE, each re-pointed at the revised D-value set**, opened
only after Group 1-R passes: Group 2-R (the sanitizer profile, D-5-R, enumerated against real installed
Temml output) · Group 3-R (the golden-fixture audit + the parse-stage rule, D-1-R, unchanged in method) ·
Group 4-R (enhancer scaffolding — block math, D-2-R/D-3-R/D-4-R/D-8-R, plus D-9-R's own theme measurement
and D-13's font-loading mechanism) · Group 5-R (enhancer scaffolding — inline math, D-7-R) · Group 6-R
(copy actions, D-6-R, block unchanged, inline per the surviving-and-simplified §8-1 ruling). **Group 7
(MathJax) is STRUCK ENTIRELY, not merely "unopened pending a ruling"** — D-10/D-11 are vacated, not
contingent, so a revisited `tasks.md` removes group 7's own line items rather than carrying them forward as
a dormant fork. Group 8-R (render-timing measurement feeding D-12-R's cache lean) and Group 9-R (human
milestone-close gate + retro, now also the venue for RULING 2's own bar being walked at full-document scale
beyond Group 1-R's own corpus-level spike, and for D-13's font-family/subsetting choice if not already
settled) both carry, renumbered only insofar as group 7's removal collapses the sequence — the reopened
`tasks.md`'s own job, not this plan's, to renumber concretely.

### Supersession map (for the record)

| Original | Disposition | This block |
|---|---|---|
| D-1 (tokenizer mechanism) | SUPERSEDED in candidate, CONFIRMED in kind | D-1-R |
| D-2 (engine module, two-file contingency) | SUPERSEDED, collapsed to one module | D-2-R |
| D-3 (call sites, app-page-only) | CARRIES, re-verified (R-0) | D-3-R |
| D-4 (KaTeX config lockdown, `htmlAndMathml` pin) | SUPERSEDED; the output-mode pin VACATED (no duality to preserve) | D-4-R |
| D-5 (dual-vocabulary sanitizer profile) | SIMPLIFIED to a single MathML vocabulary; `cleanMathStyle` left an open question | D-5-R |
| D-6 (copy mechanism) | SIMPLIFIED (one tree, not a choice of two) | D-6-R |
| D-7 (inline mutate-in-place inversion) | CARRIES mechanism unchanged; content swapped in changes | D-7-R |
| D-8 (block/fence sibling-figure reuse) | CARRIES mechanism unchanged; content swapped in changes | D-8-R |
| D-9 (no theme re-render, leaned) | CARRIES posture, strengthened evidence, still a lean | D-9-R |
| D-10 (MathJax additive drop-point structure) | VACATED permanently | — |
| D-11 (MathJax settings field shape) | VACATED permanently | — |
| D-12 (no speculative cache, measure first) | CARRIES unchanged in substance | D-12-R |
| — (no original analog) | NEW | D-13 (bundled math font) |
| §6 (group sequence) | SUPERSEDED — fidelity-spike-first, group 7 struck | (h) above |

**What this PLAN REVISIT does NOT do:** install Temml, any tokenizer package, or any math font; pin the
bundled font family or subsetting strategy; choose the tokenizer between `@mdit/plugin-tex` and a
Temml-native alternative; write render code; build the extension; edit `spec.md`, `tasks.md`, or
`decisions.md`; or claim gate-2-revisit approval. The reopened `tasks.md` — the ORDER — is the next artifact
and the next gate, generated in a fresh session, once a human approves this block.

---

## 0. Decisions SETTLED at this gate (2026-09-06)

*Every decision below gets a `decisions.md` entry, named here, landing with the commit that implements
it — the D-6…D-12 ledger gap 007 left (`progress.md`'s carried-items entry, filed 2026-08-13) is not
repeated.*

### D-1 · Math syntax recognition is a NEW markdown-it inline+block rule that emits a PASSTHROUGH MARKER — never a rule that renders. DECIDED.

`decisions.md` entry: *"011 D-1 — the parse-time math rule recognizes syntax and marks it; it does not
touch a render engine, the same synchronous-coupling line 007 §3.3 drew for diagrams"*

Spec §3.3 states the real point of difference from 007: *"`$…$` and `$$…$$` are not markdown-it syntax at
all... recognizing it requires a new markdown-it rule... that emits a sanitizer-safe passthrough marker."*
Verified against the current maintained-plugin landscape (AGENTS.md's standing rule — a stale mental model
here produces either a synchronously-rendering rule or a dead dependency):

- The plugin most people reach for by name, `markdown-it-katex`, is **unmaintained**. Its
  actively-maintained modern successor family is the `mdit-plugins` monorepo: **`@mdit/plugin-tex`**
  (recognizes `$…$`/`$$…$$`, emits inline/block tokens carrying the raw math source, renders nothing
  itself) is the **base** plugin, with **`@mdit/plugin-katex`** and **`@mdit/plugin-mathjax`** built on top
  of it to actually call their respective engines synchronously at parse time. `markdown-it-texmath` and
  `markdown-it-dollarmath` are maintained alternatives with the same tokenize-only shape.
- **`@mdit/plugin-katex`/`@mdit/plugin-mathjax` are the WRONG layer for this project, and it is worth
  saying explicitly why a natural-looking choice is rejected**: both call `katex.renderToString` (or
  MathJax's equivalent) synchronously inside the parse stage, which is exactly the coupling spec §3.3
  rejects on 007 §3.3's own precedent ("rendering math during parse/sanitize synchronously... couples a
  heavy render engine to the text pipeline"). Adopting either would put KaTeX on the parse path of every
  document, math or not, defeating §4's "when a document contains no math syntax, the system shall not
  load the math rendering engine" by construction.
- **`@mdit/plugin-tex` (the tokenizer-only base) is the chosen mechanism**, used WITHOUT its
  engine-specific children. It contributes recognition (the `$…$`/`$$…$$`/escaping/code-span-exclusion
  grammar — the exact CommonMark-math-extension conventions spec §7-5 asks be confirmed) and hands this
  project's own render rules — not katex, not mathjax — the raw math source token to do with as it likes.
  **This is task 1.2/2.x's to verify concretely against the installed package's actual token/render-rule
  API** (its README describes the token shape at a level this plan cannot re-derive without installing
  it) — named here as the chosen dependency and mechanism, with the verification obligation stated rather
  than discharged, the same posture 007's plan took toward `mermaid.render()`'s actual signature before
  group 1 confirmed it.
- **Our own render rules, registered on top of `@mdit/plugin-tex`'s tokens, emit the passthrough markers**
  D-7/D-8 below define — never LaTeX-to-HTML conversion, never a `katex` or `mathjax` import in `parse.ts`.
  `parse.ts` gains a math-aware import; it does not gain a math-RENDERING import. `import('katex')` stays
  where D-2 puts it, and nowhere else — the identical single-importer discipline 007 D-13 established for
  `mermaid`.

*Rejected:* `@mdit/plugin-katex`/`@mdit/plugin-mathjax` (couples the parse stage to a heavy engine, above).
A hand-rolled regex-based inline/block rule (spec §7-2's other live option) — rejected on the merits, not
on principle: the escaping (`\$`), code-span-exclusion, and nested-delimiter rules a maintained tokenizer
already has right are exactly the class of defect (`$5`, a shell `$HOME` inside a code span, an escaped
`\$`) spec §7-5's golden-fixture audit exists to catch, and re-deriving them by hand is where that defect
class is *authored*, not merely risked. **Revisit-when:** if `@mdit/plugin-tex`'s actual token shape (task
1.2) turns out to assume its own katex/mathjax sibling plugin is present (i.e., it is not usable
standalone), a hand-rolled rule becomes the fallback and this decision is reopened at that task, not
silently patched around.

### D-2 · `src/render/mathEngine.ts` is the ONE module that imports `katex`, via the literal `import('katex')`. A second, PARALLEL module owns MathJax if D-2's contingent half ships. DECIDED.

`decisions.md` entry: *"011 D-2 — one module per engine, one static-literal specifier each, on 007 D-13's
own fence — and the KaTeX module exists unconditionally while the MathJax module exists only if it ships"*

Mirrors `diagramEngine.ts`'s single-importer fence (007 D-13) exactly, extended to two possible engines
rather than generalized into one: the specifier is the static string literal `'katex'` (and, contingently,
whatever the ruled MathJax package resolves to — task 1.1 names it), the exact shape
`check-dynamic-imports.ts`'s MUST_NOT_FIRE fixture already sanctions. `mathEngine.ts` owns the
feature-detect (§4: "when a document contains no math syntax, the system shall not load the math rendering
engine" — the identical `hasDiagramFence`/`loadDiagramEngine` shape, renamed `hasMathMarker`/
`loadMathEngine`), the KaTeX configuration (D-4), and nothing else — it renders nothing itself, the same
division `diagramEngine.ts` keeps from `diagramEnhancer.ts`.

**Why two engine modules and not one parameterized module:** D-2's contingency structure (below) requires
that dropping MathJax be a file-deletion, not a refactor. A single `mathEngine.ts` handling both engines
behind an `if` would make "KaTeX-only" a code path inside a file that still imports MathJax's specifier —
and a specifier that exists in the source, reachable or not, is a live question for
`check-dynamic-imports.ts` and the SBOM either way. Two modules make "MathJax is not in this milestone" a
fact about which FILES exist, checkable by `ls`, not a fact about which branch is live.

*Rejected:* one `mathEngine.ts` with an engine parameter (couples the drop decision to a diff instead of a
deletion, above). Importing MathJax speculatively behind a feature flag pending gate ruling (spec's own
§3.1 forbids assuming the outcome; a flag is a way of assuming it while looking undecided).

### D-3 · The enhancer is invoked from the SAME TWO call sites D-12 (007) established, immediately after `enhanceDiagrams`, not from a new third site. DECIDED.

`decisions.md` entry: *"011 D-3 — math enhancement rides 007's own two-call-site wiring; no new mount hook
is added for a second post-mount enhancer"*

Re-verified at `60a98d6`, not inherited from 007's now-stale line numbers: the two sites are
`src/app/readerPane.ts:187` (`enhanceDiagrams(host)`, inside the paint path after `mount()` returns) and
`src/app/appShell.ts:170` (`enhanceDiagrams(target)`, inside the `render` closure `appShell.ts` passes to
`createWatchController`). Both are unchanged in shape since 007; only their line numbers moved. `011`
adds `enhanceMath(host)` / `enhanceMath(target)` immediately after each existing call — same two files,
same two functions, one more line each. `mount.ts` stays untouched (006 D-15, reaffirmed by every
milestone since), and the content-script graph (`runReader.ts`, `mountReader.ts`, `contentWatch.ts`) is
reached by neither call, which is §9-2's app-page-only ruling expressed as the same import fence 007
D-12 used, not a new one.

**Ordering between the two enhancers is DECIDED, not incidental: math runs AFTER diagrams, in the same
call.** Neither reads the other's output (diagrams operate on `pre > code.language-mermaid`, math on its
own D-7/D-8 markers), so there is no correctness dependency — but `codeEnhancer.ts`'s own header already
documents that `enhanceCode` runs after `enhanceDiagrams` because it must not re-parent a diagram's already
-moved fence (`codeEnhancer.test.ts:195-199`). Math markers are never diagram fences, so this constraint
does not bind M11 — it is recorded so a future engine does not assume ordering is free to invert.

*Rejected:* a third mount hook / a generic "post-mount enhancer registry" (the same 007 D-12 rejection,
restated: §3.3 forbids branching inside `mount()`, and a registry read from inside it is the shape D-12
declined for diagrams and this milestone has no new reason to choose).

### D-4 · KaTeX is invoked with `trust: false` EXPLICITLY PINNED, and `throwOnError` is LEFT AT ITS DEFAULT (`true`) so failures reach our own degrade path rather than KaTeX's own error markup. DECIDED.

`decisions.md` entry: *"011 D-4 — trust:false is KaTeX's own secure-list analogue to mermaid's `secure`
config, pinned explicitly rather than relied on as an unstated default; throwOnError stays true so 007
D-15's shape — we catch, we degrade, the engine never draws its own error UI — transfers unmodified"*

Verified against KaTeX's current documented security posture, not training-knowledge default-assumption
(AGENTS.md's standing rule): KaTeX's `trust` option defaults to `false`, and at `false` it disables the
family of commands that can read attacker-influenced content into an attribute or fetch a resource from
LaTeX source — `\href`, `\includegraphics`, `\htmlClass`, `\htmlId`, `\htmlStyle`, `\htmlData` — rendering
them in `errorColor` instead of executing them. **This is the KaTeX-specific analogue of 007 D-6's
`secure` list**: a config-level lockdown that closes an injection route AT THE SOURCE, defense-in-depth
alongside the sanitizer profile (D-5) that closes it at the ARTIFACT. `trust: false` is stated explicitly
in `DIAGRAM`-style frozen config (mirroring `DIAGRAM_ENGINE_CONFIG`'s own `Object.freeze`), not left
implicit, on the same "never trust a default silently" discipline that made 007 D-6 enumerate mermaid's
`secure` list in full rather than trust `securityLevel: 'strict'` alone to cover it.

**`throwOnError` stays at its documented default (`true`)**, and this is a DECISION, not an omission:
KaTeX's alternative (`throwOnError: false`) makes a failed formula render its OWN red error span inline,
which is precisely the shape 007 D-6/`diagramEngine.ts` rejected for mermaid via `suppressErrorRendering:
true` — "showing the user their source is more useful than showing them a rendered apology." Leaving
`throwOnError` at `true` means a parse/render failure THROWS, which `mathEnhancer.ts`'s per-formula
try/catch (mirroring `drawDiagram`'s shape) turns into spec §3.9's own degrade-to-source outcome, with
OUR marker text, not KaTeX's own error markup, ever reaching the DOM.

**Output mode is `htmlAndMathml` (KaTeX's own default) — kept, not overridden, and it is load-bearing
rather than a passive inherited default:** verified against KaTeX's current docs, `htmlAndMathml` embeds
BOTH a visual HTML+CSS-class tree AND a MathML tree (inside `<semantics>`, alongside an
`<annotation encoding="application/x-tex">` carrying the original LaTeX) in the SAME output string. D-5's
sanitizer profile and D-6's copy mechanism both depend on this default surviving unchanged — an override
to `output: 'html'` would silently delete the MathML tree copy-as-MathML reads from, and an override to
`output: 'mathml'` would delete the visual paint. This is named explicitly so a future "trim the output for
bytes" instinct is weighed against the two features it would break, not applied silently.

*Rejected:* `trust: true` or `trust` unset-and-assumed-false (the pin exists so the intent survives a
future KaTeX default change, the same forward-looking discipline `URL_ATTRS` already carries `xlink:href`
"forward-looking" per 007 D-1). `throwOnError: false` (re-admits the engine's own error UI, above).

### D-5 · A THIRD named sanitizer profile — `sanitize.ts`'s `SANITIZE_MATH_CONFIG` — admits BOTH KaTeX's HTML+class visual tree and its embedded MathML tree, plus a NEW procedural filter on inline `style` values. DECIDED.

`decisions.md` entry: *"011 D-5 — the math profile is 007 D-1's third instance, widened in kind (two
markup vocabularies, not one) and carrying its own procedural filter for the one attribute the SVG profile
never had to admit: `style`"*

Same construction as `SANITIZE_SVG_CONFIG` (007 D-1) and the same rejection of `USE_PROFILES` (DOMPurify's
built-in MathML profile is the identical category-widening D-1 already declined for SVG: unreviewable as
data, and it admits MathML elements this project has no producer for). New exported
`MATH_ALLOWED_TAGS` / `MATH_ALLOWED_ATTR` / `SANITIZE_MATH_CONFIG` arrays and a new
`sanitizeMath(html: string): string`, with the document and SVG profiles' three consts BYTE-UNTOUCHED —
the same non-negotiable 007 D-1 stated for its own two existing profiles.

**Two vocabularies, one profile, because KaTeX emits both in one string (D-4):**

- **The MathML tag set** — `math`, `semantics`, `annotation`, `mrow`, `mi`, `mn`, `mo`, `mfrac`, `msup`,
  `msub`, `msubsup`, `msqrt`, `mroot`, `mtext`, `mspace`, `mtable`, `mtr`, `mtd`, `mstyle`, `mpadded`,
  `menclose`, and whatever else the installed package's real output actually contains — **enumerated
  against the actual installed package's output, not this list, which is a starting hypothesis to verify
  the same way `SVG_ALLOWED_TAGS`'s own header names "grounded in what the engine actually emits (a survey
  of `mermaid@11.16.0`'s dist), not in what SVG permits."** Group 2's task.
- **KaTeX's HTML visual tree** — plain HTML tags it is already free to use (`span`, `a` is NOT among
  them — no anchor producer with `trust: false`), each needing the SAME governance the document profile
  gives every tag: denied by absence unless a producer is confirmed.
- **`class` is allowed generically, by NAME, not by enumerated VALUE** — the same posture the document and
  SVG profiles already take. DOMPurify's `class` handling does not interpret the string; a class name is
  inert data the extension's OWN bundled stylesheet (not the document) turns into paint. KaTeX's hundreds
  of internal class names (`.katex`, `.katex-html`, `.mord`, `.vlist`, `.strut`, `.reset-size1`…) therefore
  need **zero** enumeration — this is a real byte and maintenance saving over what a first glance at
  KaTeX's own CSS suggests, and it is worth stating explicitly so a future reviewer does not attempt to
  transcribe KaTeX's stylesheet into this file.

**★ `style` IS ADMITTED as an attribute here — the SVG profile's own `style`-ATTRIBUTE denial does NOT
transfer, and that divergence is real, not an oversight.** KaTeX's HTML renderer is fundamentally
`style`-attribute-driven: its `.vlist` vertical-positioning mechanism emits numeric inline styles
(`top`, `margin-left`, `height`, `vertical-align`, …) on nearly every span, the way SVG's own geometry
lives in dedicated attributes (`x`, `y`, `transform`) rather than in `style`. Denying `style` here the way
the SVG profile does would not hide a stylesheet (there is none to admit or deny, the way `<style>` was
007's own fork) — it would strip the layout itself, rendering unreadable glyph soup. So `style` is admitted,
**and it is treated with the SAME "generated artifact deserves a TIGHTER filter, not a looser one" posture
007 D-1 established for `<style>`'s CSS text**: a new procedural pass, `cleanMathStyle`, denies any `style`
attribute value containing a `url(` or `expression(` token — the two lanes through which an inline style
could name a network resource. `trust: false` (D-4) already makes it structurally impossible for LaTeX
SOURCE to influence a `style` value's text (every `style` KaTeX emits is a number it computed from font
metrics, never source-controlled), so this pass is expected to strip nothing from real output — proven,
not assumed, by test — the same "measured, not argued" posture `SVG_ALLOWED_URI_REGEXP`'s own derivation
took. This is defense-in-depth exactly as the SVG profile's tighter-than-needed URI regexp is: not because
a producer exists today, but because a generated artifact earns the STRICTER profile, not the looser one,
by 007 D-1's own stated rule.

**No `href`/`src`/`xlink:href` anywhere in `MATH_ALLOWED_ATTR`.** `trust: false` closes every route a
formula could name one from source; the profile denies the attribute BY ABSENCE anyway, the same
belt-and-suspenders the SVG profile applies to `foreignObject`.

**`ALLOW_ARIA_ATTR: true`, diverging from the document profile exactly as the SVG profile does (007 D-1
DIVERGENCE 1) and for the identical reason** — spec §5 requires every rendered formula to carry a genuine
accessible representation, and KaTeX's MathML tree is the mechanism (below); an `aria-*`-stripping profile
would silently disable it.

**`ADD_URI_SAFE_ATTR` is NOT NEEDED here the way 007 D-1 needed it for SVG.** The SVG profile needed a
narrower-but-present URI regexp confined to reference attributes (`href`, `fill`, …) that also carry
geometry-adjacent values needing protection from an over-broad regexp. Math's profile has no URI-bearing
attribute in its allow-list at all (above), so `ALLOWED_URI_REGEXP` need never fire — DOMPurify's own
default handles the (empty) case correctly, and this profile states so explicitly rather than silently
omitting a config key a future reader would have to infer the absence of.

*Rejected:* `USE_PROFILES: {mathMl: true}` (category widening, unreviewable, above). Denying `style`
outright (destroys KaTeX's own layout mechanism, above). Enumerating every KaTeX CSS class name into the
allow-list (`class`'s value is not a DOMPurify concern; enumerating it would be pure, pointless bulk).

### D-6 · Copy-as-LaTeX reads OUR OWN RETAINED SOURCE TEXT; copy-as-MathML clones and serializes the LIVE, ALREADY-SANITIZED `<math>` SUBTREE. NEITHER NEEDS A THIRD DEPENDENCY. DECIDED — this resolves spec §7-7 concretely.

`decisions.md` entry: *"011 D-6 — copy-as-LaTeX is D-7/D-8's own retained-source read, and copy-as-MathML
is a clone-and-serialize of KaTeX's own embedded MathML tree; spec §7-7's suspected extra dependency does
not exist"*

Spec §7-7 named the open question directly: *"if KaTeX's own output already embeds a MathML annotation,
copy-as-MathML may be 'extract the existing annotation node,' not a new conversion step... confirm this
before assuming a MathML-generation library is needed at all."* **Confirmed, against KaTeX's current
documentation: `htmlAndMathml` (D-4's kept default) embeds a full `<math>…</math>` tree, not merely an
annotation stub.** So:

- **Copy-as-LaTeX never touches the rendered artifact at all.** It reads the SAME retained source text
  every degrade path already depends on (D-7/D-8's "read the marker's original text, always" rule, the
  identical discipline `diagramSourceOf` established: "the source is read as text, always"). This is
  simpler than reading KaTeX's own `<annotation encoding="application/x-tex">` node, and it is *correct*
  where the annotation would not be: the annotation is the string KaTeX's OWN LaTeX-to-MathML converter
  round-tripped, and a converter's round-trip is not guaranteed byte-identical to what the author typed
  (whitespace, macro expansion). "Copy the exact source LaTeX as authored" (§4, verbatim) means the
  author's bytes, not the engine's echo of them.
- **Copy-as-MathML clones the figure's/marker's live `<math>` element** (post-`sanitizeMath`, exactly the
  same "the artifact both actions operate on is the one on screen" posture 007's diagram-actions header
  states for copy-as-image: *"a path back to the raw string would re-admit... what the profile stripped"*)
  and serializes it with `XMLSerializer`, the identical mechanism `diagramSvgText` already uses for
  copy-as-image. No new library, no new parse step — the tree already exists in the DOM because D-5 admits
  it there, expressly for this purpose alongside the accessibility purpose §5 separately requires. **This
  is why D-5's decision to admit the MathML tree (rather than strip it as "redundant with the visual
  tree") is load-bearing for a SECOND reason, not only accessibility** — losing it would cost this
  mechanism too, not merely the a11y story.

**What this settles for §3.8/§5's Dependencies line:** *"if the sanitizer-profile work or the
copy-as-MathML mechanism needs a third package, that is priced explicitly when it is decided"* — it is
decided HERE, at zero additional packages. KaTeX (and, contingently, MathJax) remain the only additions.

*Rejected:* a MathML-generation library keyed off the source LaTeX (unneeded — the tree already exists,
above). Reading copy-as-LaTeX from the `<annotation>` node (not guaranteed byte-identical to the author's
source, above).

### D-7 · Inline math (`$…$`) renders as `<code class="peekover-math-inline">`, and its degradation model INVERTS 007 D-15: it MUTATES ITS OWN CONTENT rather than hiding a sibling source. DECIDED, and it is the plan's single biggest structural divergence from 007.

`decisions.md` entry: *"011 D-7 — inline math cannot use a sibling-figure shape at all, because inline
content has no 'beside' to put a figure in; the marker mutates in place, and that is 011's own
counterpart to 007's `<figure>`-is-a-sibling rule, not a violation of it"*

**Why `<code>`, and why NOT a new tag.** The document `ALLOWED_TAGS` array (`sanitize.ts:22-37`) does not
contain `span`, `div`, or any other generic inline container — the fence-based `pre`/`code` pair is the
only structural surface markdown-it's default output ever needed before this milestone. Widening the
DOCUMENT profile to admit a new tag purely to carry an inline-math marker is exactly the trade 007 D-1
declined for `svg` and this spec's own §3.5 declined again for the math tag vocabulary at the DOCUMENT
layer — a tag reachable from raw markdown, for one enhancer's sake, widens the untrusted-source attack
surface document-wide, not merely for math. **`<code>` is already allowed, already carries a `class`-based
dispatch convention this project uses everywhere (`language-mermaid`, `language-js`, `language-math` for
the fence — D-8 below), and a math-recognizing parse rule (D-1) that emits `<code class="peekover-
math-inline">$…$</code>` needs NO document-profile change at all.** This is a real, load-bearing finding,
not a convenience: the document profile's three arrays stay BYTE-UNTOUCHED, the same non-negotiable 007
D-1 and this plan's own D-5 both hold for their respective new profiles.

**The collision risk this reuse creates is real and is spec §7-5's own risk, not a new one this D-value
invents:** markdown-it's own inline-code (backtick) rule already emits `<code>` for `` `$HOME` ``-style
spans, and it MUST keep doing so unmodified — a math-recognizing rule that fired inside an existing code
span's already-tokenized content would be a defect, not a feature. This is closed by markdown-it's own
inline-rule ordering, not by anything this plan writes: the backtick rule consumes its span's interior
into a single opaque token before any later-registered inline rule (including `@mdit/plugin-tex`'s) sees
those characters, so a well-behaved math rule registered in the normal chain structurally cannot look
inside an already-consumed code span. **Verify this holds for the actual installed `@mdit/plugin-tex`
(task 3.x) — this is exactly the class of "verify against the current package, not the mental model"
AGENTS.md demands, and it is the mechanism spec §7-5's golden-fixture audit exists to catch a regression
in.** The two markers are DISTINGUISHED BY CLASS, never by tag: an ordinary inline code span carries no
`peekover-math-inline` class and the enhancer's selector (mirroring `DIAGRAM_FENCE_SELECTOR`) never
touches it.

**THE INVERSION, stated as plainly as 007 §3.5 row 4 stated its own:** every existing sibling in this
codebase that manages a "source vs. rendered" pair (diagrams' `<figure>` beside a hidden `<pre>`, the
Raw-view toggle in `readerMode.ts`) does so by INSERTING A SIBLING and toggling which of the two is
visible. **Inline math cannot do this: there is no sibling slot inside a sentence.** `<code
class="peekover-math-inline">` renders its raw, literal `$…$` text as its initial content — the same
"degradation is the default state" property 007 D-15 established, achieved by a different mechanism — and
on success the enhancer REPLACES THE ELEMENT'S OWN CHILDREN with the sanitized KaTeX fragment (D-6's
`replaceChildren`-shaped swap, in place, never removing or re-inserting the `<code>` itself). On any of
§3.9's three failures, the element's content is simply never touched — the literal source text the parser
committed is what stays on screen, which is §4's "leave that formula as its raw source text with an
inline marker" for the FAILURE case, satisfied structurally (no separate marker element is inserted for
inline math on failure — see the note below).

**The inline failure marker is an `aria-*`/`title` annotation on the SAME element, not a new sibling
node.** Inserting a visible sibling marker after an inline `<code>` mid-sentence would break the sentence's
reading flow in a way a block-level marker after a `<pre>` (D-8, 007's own shape) does not. §4 requires "an
inline marker naming the failure" — read here as *an in-place annotation*, not *a new inline element*:
`title` (a native browser tooltip) plus a `data-math-failed` attribute (so the enhancer can style it
distinctly and so a screen reader's verbose mode can surface it) satisfy the requirement without breaking
prose flow. **This is a design-translation call (§7-9) that plan.md is making architecturally, not merely
flagging** — the exact visual treatment (a dotted underline, a colour cue backed by the same `title`) is
still gate-3's to walk (§8 below), but the MECHANISM (an attribute on the existing element, never a new
node) is decided here because it follows from the inversion, not from taste.

*Rejected:* wrapping inline math in a new `span`/`div` (widens the document profile, above). A sibling
error marker after the `<code>` (breaks inline flow, above). Removing the `<code>` element on success and
replacing it with a bare rendered fragment (loses the retained-source anchor D-6's copy-as-LaTeX and every
degrade path depend on — the same "never rebuild what you can retain" lesson 007 D-15 states for its own
`<pre>`).

### D-8 · Block (`$$…$$`) math and fence (` ```math `) math BOTH resolve to the identical `<pre><code class="language-math">` shape, and BOTH reuse 007 D-15's sibling-figure pattern verbatim. DECIDED.

`decisions.md` entry: *"011 D-8 — block-dollar math is made to look exactly like fence math at the DOM
level, so one enhancer path serves both, and 007's own sibling-figure machinery needs no new state
machine"*

Spec §3.3 already settles fence math needs NO new parse rule (it is markdown-it's existing fence renderer,
the identical mechanism 007 §3.3 used for `language-mermaid`, producing `<pre><code
class="language-math">` with zero code changes). **This D-value adds the deliberate design choice that
D-1's new block rule for `$$…$$` targets the SAME shape**: it emits `<pre><code
class="language-math">$$…$$</code></pre>` rather than inventing a second, differently-classed block
marker. One consequence, stated rather than left implicit: the `<code>`'s `textContent` for a dollar-block
formula INCLUDES its `$$` delimiters (mirroring how the fence's content never had delimiters to begin
with), so `mathSourceOf` — the direct counterpart of `diagramSourceOf` — must PEEL a leading/trailing `$$`
pair when present before handing the source to the engine or to copy-as-LaTeX, and pass fence content
through unpeeled. This is one small, well-contained branch inside one function, not a second code path
through the enhancer, the cache, or the view module.

**Why unify rather than give dollar-block its own class and its own small state machine:** 007's whole
`diagramEnhancer.ts`/`diagramView.ts` machinery — the D-15 sibling-figure insertion, the three-state
`data-diagram`-style attribute, the per-fence try/catch degrade path, the hover/focus control group
attachment — is proven, tested, and generic over "a `<pre>`-rooted block that becomes a `<figure>`." Giving
block math the SAME selector shape (`pre > code.language-math`, plus the fence's own already-existing
selector, unioned) means this milestone's block-math enhancer is a THIN, mostly-configuration reuse of an
already-hardened pattern rather than a parallel implementation with its own defect surface. The one place
math's block state machine differs from diagrams' is D-4's engine-level choices (KaTeX vs. mermaid) and
D-6's copy actions (vs. diagrams' copy-as-image/download) — everything about HOW a block becomes a hidden
source plus a visible sibling is identical, and is inherited by citation rather than re-specified.

**A single `data-math` state attribute** (mirroring `data-diagram` exactly: `pending` / `rendered` /
`failed`) rather than reusing `data-diagram` itself — a shared attribute would make `diagramEnhancer.ts`'s
own selectors (`figure.${DIAGRAM_FIGURE_CLASS}[${DIAGRAM_STATE_ATTR}="rendered"]`, used by D-7 the mermaid
one, the theme re-render listener) accidentally match math figures too, a cross-engine coupling neither
engine's tests expect and neither module should have to guard against.

*Rejected:* a distinct class/shape for dollar-block math (duplicates a proven state machine for no
behavioural gain, above). Reusing `DIAGRAM_STATE_ATTR`/`DIAGRAM_FIGURE_CLASS` verbatim for math figures
(cross-engine selector collision, above).

### D-9 · Math needs NO theme re-render mechanism — no D-7(007)/re-theme analogue at all. LEANED HERE, VERIFY-AT-TASK-TIME, not assumed past that.

`decisions.md` entry: *"011 D-9 — KaTeX's own CSS inherits text colour from context rather than baking in
a fixed palette, so a theme flip is handled by the existing CSS cascade with zero enhancer-side listener —
verified against the installed package before this is treated as closed, the same posture 007 D-7 could
not afford for mermaid's hex-baked SVG output"*

**Why this is a real, favourable structural difference from 007, not a shortcut being assumed.** 007 D-7
needed a whole re-render-and-swap subscription because mermaid's SVG BAKES computed hex colours into
`fill`/`stroke`/a generated `<style>` block at render time — a theme flip changes what those hex values
SHOULD be, and nothing short of a fresh render produces new ones. KaTeX's default HTML+MathML output is
understood to paint via inherited/`currentColor`-style text colour rather than baked hex values — meaning
the SAME `readerCss.ts` cascade that already re-colours the surrounding prose on a theme flip would
re-colour a rendered formula for free, with no enhancer-side subscription, no re-render, no cache-key
theme component (unlike D-3 (007)'s `hash + SEP + theme + SEP + engineVersion` — a math cache key, if D-11
below ever earns one, would need NO theme component at all).

**This is stated as a LEAN requiring task-level confirmation, not a closed decision, on the same epistemic
honesty spec §3.6 models for its own cache lean:** the claim must be verified against KaTeX's actual
shipped CSS (group 2/4's task) with a real light/dark/sepia contrast measurement, the same discipline the
9.1 gantt/pie dark-mode defect (`progress.md`'s 2026-08-02 finding) proves is necessary — a theme claim
that looks obviously true from documentation was, for mermaid, obviously false in practice, and that
lesson transfers here as a mandatory measurement rather than a documentation citation. **If task-level
verification finds any KaTeX-emitted colour is NOT theme-inherited (a hardcoded `errorColor` red border,
for instance, which KaTeX documents as a literal configurable hex, not a CSS variable) that specific
element is priced and fixed as its own finding — it does not reopen the "no re-render subscription" half
of this decision, which concerns MECHANISM, not every last colour.**

*Rejected:* building 007 D-7's re-theme listener defensively "just in case" (pays a real complexity and
byte cost for a re-render mechanism the architecture does not need if the lean holds, and if it does not
hold the fix is a CSS variable, not a subscription).

### D-10 · The math-render dependency-set fork (§9-1) is structured so MathJax is a PURELY ADDITIVE group: a second engine module (D-2), one dispatch branch in the enhancer, one settings field, one toggle control. Dropping it deletes files; it does not unwind any KaTeX-groups' work. DECIDED — the shape, not the outcome.

`decisions.md` entry: *"011 D-10 — the contingency boundary is drawn so that KaTeX-only and
KaTeX+MathJax are the SAME codebase with one optional layer on top, never two branches of one
implementation"*

This is the direct architectural answer to the kickoff's own demand — RULING 1 is measured at task 1.1,
not assumed, and this D-value is what makes that measurement's answer cheap to act on either way:

- **The KaTeX groups (2 through 6 below) are written, tested, and shipped as if MathJax will never
  exist.** No conditional, no feature flag, no "if MathJax fits" branch anywhere in `mathEngine.ts`,
  `mathEnhancer.ts`, `mathView.ts`, or `sanitize.ts`'s math profile. A reviewer reading those files after
  task 1.1 rules KaTeX-only should see nothing suggesting a second engine was ever contemplated beyond
  this plan document and its `decisions.md` entries.
- **The MathJax group (7, contingent) is additive on top:** a second engine module (D-2's second file), a
  single dispatch point in `mathEnhancer.ts` — "which engine renders THIS formula" — resolved by reading
  the settings field D-11 below adds, and the toggle control itself (§9-4's own trigger-semantics ruling,
  still deferred and NOT resolved by this plan — RULING 4 stays open pending RULING 1). **The dispatch
  point is the ONE place KaTeX-only and KaTeX+MathJax code literally differ**, and it is a single
  conditional inside one function — everything upstream (recognition, the passthrough marker, the
  sanitizer profile shape, copy-as-LaTeX/MathML) is engine-agnostic BY CONSTRUCTION, because none of D-1,
  D-5, D-6, D-7, or D-8 name "KaTeX" anywhere in their own reasoning — they name "the math engine," and
  MathJax's own `htmlAndMathml`-shaped or SVG-shaped output would need its OWN tag/attribute survey inside
  the SAME `SANITIZE_MATH_CONFIG` profile (widened, not replaced), the same way the SVG profile's shape
  did not need to change when Mermaid itself changed diagram TYPES.
- **If RULING 1 excludes MathJax:** group 7 is simply never opened. Nothing in groups 2–6 changes, no
  file is half-built, and `progress.md`'s carried-items convention (the same one 007 8.4/9.1's D-10(b)-
  narrowing precedent established) records MathJax's own future re-entry point — this D-value's own text —
  as the thing a later milestone reads before attempting it.

*Rejected:* building MathJax's engine module speculatively behind a runtime-disabled flag pending the
ruling (spec §3.1 forbids assuming the outcome; a disabled flag is still shipped code, still in the SBOM,
still a thing `pnpm audit` scans — assuming softly is still assuming). A single `mathEngine.ts` handling
both engines (D-2's own rejection, cited).

### D-11 · The MathJax settings field, IF IT SHIPS AT ALL, is one more key on the existing single global `Settings` row — DECIDED IN SHAPE ONLY, contingent on D-10/RULING 1, and its semantics stay RULING 4's open call.

`decisions.md` entry: *"011 D-11 — a MathJax toggle, if it ships, is `codeTheme`/`lastExportFormat`'s own
shape: one more field on one global row, never a new settings surface"*

Per spec §3.11, verified against the current `Settings` shape (`src/settings/settings.ts:36-57`):
`codeTheme: string` (009) and `lastExportFormat: string | null` (010 D-6) are both single fields added to
one interface and one `DEFAULT_SETTINGS` object, with no new persistence surface, no per-document axis.
A MathJax field — its name and type depend on RULING 4's still-open trigger-semantics call (a boolean
"always MathJax" toggle vs. a string enum naming an automatic-fallback mode) — follows the identical
shape. **This is named here, in shape only, so a future session picking up group 7 does not have to
re-derive "where does a new math setting live" from scratch** — it already knows the field is a sibling
of `codeTheme`, not a new port, not a new store.

*Not decided here:* the field's name, type, or default value — all downstream of RULING 4, itself downstream
of RULING 1's own measurement. This D-value states WHERE the answer will live, not what it is.

### D-12 · Cache bound VALUES are not proposed here at all — D-9 removes the theme axis a diagram-style cache key would need, and §3.6's lean against building one stands pending group 8's own timing measurement. DECIDED — the measurement obligation, not the cache's existence.

`decisions.md` entry: *"011 D-12 — no cache is designed speculatively; group 8 measures render cost first,
on the 007 D-8/D-9 precedent, and a cache is only designed if that measurement contradicts the spec's own
lean"*

Spec §3.6 leans against a persistent cache ("per-formula LaTeX parse+layout is typically far cheaper than
a full diagram's graph layout") but explicitly declines to decide without a timing measurement. This plan
does not design a cache schema, a key shape, or eviction bounds — doing so before the measurement exists
would be exactly the "chosen instead of measured" defect the D-8(007) pattern was built to prevent, this
time applied to whether a cache is warranted AT ALL rather than to its bound values. **If group 8's
measurement (below, §7) contradicts the lean — a math-heavy or MathJax-fallback-heavy document misses a
reasonable reopen bar — the cache's own design (mirroring 007 D-2/D-3/D-4, minus D-9's theme component)
is a finding routed to `progress.md`'s § Carried items, the same "a real finding → a task added, not a
silent build" mechanism 007 §9.1 and this project's every milestone since have used**, not a silent
addition to this plan or to `tasks.md` after the fact.

---

## 1. Architecture & data flow

### 1.1 The parse-stage addition (D-1)

`parse.ts` gains, alongside its existing `taskLists`/fence-rule wiring:

```
md.use(tex, { ...@mdit/plugin-tex's own options, verified at task 1.2 })
md.renderer.rules['math_inline'] = (tokens, idx) => passthroughInline(tokens[idx].content)
md.renderer.rules['math_block']  = (tokens, idx) => passthroughBlock(tokens[idx].content)
```

`passthroughInline(src)` → `<code class="peekover-math-inline">$${escape(src)}$</code>` (D-7).
`passthroughBlock(src)` → `<pre><code class="language-math">$$${escape(src)}$$</code></pre>` (D-8),
sharing markdown-it's own `escapeHtml` the default fence rule already relies on — no new escaping
mechanism, the same "the meta value is pushed RAW... `Renderer#renderAttrs` HTML-escapes" discipline
`parse.ts`'s existing fence-rule override already documents for itself.

**The golden-fixture audit (§7-5) runs BEFORE this rule lands, as its own group-3 task**, not as a
byproduct of writing it: every existing golden fixture containing a literal `$` (a price, a shell
variable in a code span, a currency table cell) is read and classified — matches-and-should (none
expected; §5's own framing is "Golden GROWS, it does not merely change") vs. matches-and-should-not (a
false positive the rule's own escaping/code-span-exclusion must prevent) vs. does-not-match (unaffected).
An unintentional diff in that audit is a regression to fix in the rule, never a golden fixture to wave
through because "math changed golden this time" — spec §5's own binding NFR, quoted verbatim.

### 1.2 The enhancer's shape (D-3, D-7, D-8)

Two independent walks per call, mirroring `enhanceDiagrams`'s own synchronous-prologue/async-body split
(007 §1.1), because the two marker shapes need different D-15-vs-inversion handling but share one
feature-detect and one engine load:

```
enhanceMath(host):                              # returns immediately — same D-12(007) cooldown constraint
    inlineMarkers = shadow.querySelectorAll('code.peekover-math-inline')
    blockMarkers  = shadow.querySelectorAll('pre > code.language-math')   # dollar-block ∪ fence, D-8
    if inlineMarkers.length + blockMarkers.length == 0: return            # §4 — engine never imported
    for each blockMarker: insert placeholder <figure>, mark pending       # D-8/D-15, sync, pre-paint
    # inline markers need NO synchronous prologue step — D-7's inversion means their pending state
    # IS their already-committed literal text; there is nothing to insert before paint.
    void (async () => {
        engine = await import('katex')                                   # D-2, one literal specifier
        for each inlineMarker:
            source = mathSourceOf(inlineMarker)                          # D-8's $$-peel, inline has none
            outcome = drawFormula(engine, source, { displayMode: false })
            if outcome.content: inlineMarker.replaceChildren(...outcome.content)   # D-7's mutate-in-place
            else: inlineMarker.dataset.mathFailed = outcome.failure       # D-7's in-place failure marker
        for each blockMarker:
            source = mathSourceOf(blockMarker)                           # peels `$$` iff dollar-origin
            outcome = drawFormula(engine, source, { displayMode: true })
            adopt(blockMarker, outcome)                                  # D-8/D-15's sibling-figure flip
    })()
```

`drawFormula` is D-4's config plus D-5's `sanitizeMath` plus D-6's retained-source discipline, in exactly
the try/caught-per-formula shape `drawDiagram` already establishes: engine failure is document-wide (no
fence got as far as having its own — mirrors `renderDiagrams`'s catch), while parse/render and
sanitize-rejection are per-formula, satisfying §4's "shall render every other formula in the document
normally."

**The fence/marker seam is to be empirically confirmed at task time, not assumed** — the identical
discipline 007 §1.1 applied to `pre > code.language-js` in a committed golden file: once D-1 lands,
`tests/golden/output/` will contain the first committed proof that `<code class="peekover-math-inline">`
and `<pre><code class="language-math">` really are what survives `sanitize(parse(source))`, and later
tasks read THAT file rather than re-deriving the claim.

### 1.3 The sanitizer profile split (D-5)

Read alongside `SANITIZE_CONFIG` (`sanitize.ts:107-127`) and `SANITIZE_SVG_CONFIG` (`sanitize.ts:344-401`)
as the third sibling. `sanitizeMath` follows `sanitizeSvg`'s own two-part shape — an allow-list config plus
one procedural filter — but the filter here (`cleanMathStyle`) is an ATTRIBUTE-value scan, not an
ELEMENT-content scan: cheaper than `cleanSvgCss`'s tokenizer (no comments, no nesting, no at-rules to walk
— a `style` attribute value is one flat declaration list), but the same "deny by TOKEN, not by PROPERTY
name" posture `cleanSvgCss`'s own header argues for, so a future KaTeX version emitting a
previously-unseen positioning property is still caught by the `url(`/`expression(` token scan rather than
by an enumerated property list one release behind.

### 1.4 Zero-network — the KaTeX-specific trap (§3.7)

Spec §3.7 names KaTeX's own font self-hosting as a genuine, specific trap, not a restatement of AGENTS.md
#1. Verified against KaTeX's current distribution and font documentation: `katex.min.css` references its
bundled font files via RELATIVE `url("fonts/KaTeX_….woff2")` paths that must resolve alongside wherever
the CSS itself is served from — the standard integration self-hosts both by keeping the `fonts/` directory
adjacent to the CSS at the same relative path the CSS expects, never rewriting it to point at a CDN.

**The chosen mechanism: import KaTeX's CSS through Vite's own `?inline` CSS-import form** —
`import katexCss from 'katex/dist/katex.min.css?inline'` — rather than a runtime `<link>` tag. This is
architecturally required, not merely convenient, because `readerCss.ts`'s own established pattern injects
CSS into the reader's SHADOW ROOT as a `<style>` element built from a TypeScript string constant (the
project's own "CSS in template literals ships its comments" / "any styling rationale lives in the doc
comment, never inside the CSS literal" discipline, AGENTS.md and `progress.md`'s own retro finding 9) —
there is no `<link>`-tag-to-a-stylesheet-file mechanism anywhere in this codebase's shadow-root injection
path to extend. Vite's `?inline` form is documented to still run its normal asset pipeline over the CSS
(including `url()` resolution to built asset paths) while returning the RESULT as a JS string rather than
emitting a separate stylesheet — the exact shape a shadow-root `<style>` injection needs, and the exact
mechanism that turns KaTeX's `url("fonts/…")` references into build-time-resolved, extension-packaged
asset paths rather than a live relative-path lookup that could resolve wrong (or, worse, resolve against
a CDN if a quick-start snippet were copied verbatim instead).

**This is named a trap-CLOSED-BY-MECHANISM claim requiring empirical proof, not a documentation citation
accepted as sufficient** — the identical posture 007 §7-2/D-6 took toward its own "measurement window":
group 4's zero-network guard (mirroring `diagramSecure.browser.test.ts`'s shape) must show, on the real
built extension, that loading the math chunk and rendering a formula produces **zero requests**,
specifically including a control proving a REMOTE font/CSS reference WOULD be caught if the `?inline`
mechanism were bypassed (e.g., by reverting to a `<link href="https://cdn…">` in a scratch ablation) —
the same "a positive control that fires" discipline (AGENTS.md's standing rule, M6 retro finding 1) 007
§3.5 row 22 applied to Mermaid's own remote-image routes.

---

## 2. Files to create / touch / NOT touch

**Create** — `src/render/mathEngine.ts` (D-2, the KaTeX importer, config, feature-detect) ·
`src/render/mathEnhancer.ts` (D-3's orchestration; imported by `appShell.ts` and `readerPane.ts` only) ·
`src/render/mathView.ts` (D-7's inline mutate-in-place mechanics, D-8's block sibling-figure reuse of
007's shape, D-6's copy-as-LaTeX/MathML control group, the per-formula live status region) · test files
per §5. **Contingent create, group 7 only** — `src/render/mathJaxEngine.ts` (D-2's second engine module,
built only if RULING 1 ships it).

**Touch** — `src/render/parse.ts` (D-1's tokenizer registration + the two passthrough render rules,
additive beside the existing fence-rule override) · `src/render/sanitize.ts` (D-5: additive exports only —
`MATH_ALLOWED_TAGS`/`MATH_ALLOWED_ATTR`/`SANITIZE_MATH_CONFIG`/`sanitizeMath`/`cleanMathStyle`; the three
existing document-profile consts AND the SVG profile's own consts stay byte-untouched) ·
`src/app/readerPane.ts:187` and `src/app/appShell.ts:170` (D-3's two sites, one added line each) ·
`package.json` (`katex`; contingently, MathJax's own package) · `docs/trust/PERMISSIONS.md` (only if group
1 or group 4 finds a permission is actually needed — not expected, named per §5's own "expected and
unremarkable" framing for `web_accessible_resources` if either engine's lazy chunk needs it on the app
page, and a hard stop if it reaches the content-script graph, 007's own §3.2 fence restated).

**Explicitly NOT touched** — `src/render/mount.ts` (§3.3, 006 D-15: stays read-only library; checkable at
zero sites, the same 007 property) · `src/render/runReader.ts` / `mountReader.ts` / `src/watch/
contentWatch.ts` (the content-script graph, §9-2) · `src/render/diagramEngine.ts` / `diagramEnhancer.ts` /
`diagramView.ts` (math is a sibling system, not a modification of the diagram one — the two share NO
runtime state; D-8's own `data-math` attribute is deliberately distinct from `data-diagram`, above) ·
`tests/manifest.test.ts` (2,961 B at `60a98d6` — re-verify this figure at task time, since the SVG-profile
precedent shows it can move byte-for-byte with an additive change if the manifest text itself is untouched,
which is what is expected here) · `tests/golden/output/*` (existing fixtures are AUDITED per §1.1, not
edited wholesale — a diff there is either an accepted, reviewed new fixture or a caught regression, never
a silent bulk update) · `scripts/check-dynamic-imports.ts` and `.github/workflows/supply-chain.yml` (011
satisfies the existing rules; it does not amend them, the identical 007 posture).

---

## 3. Risk resolutions (spec §7 → concrete)

1. **★ THE BYTE MEASUREMENT ITSELF, BEFORE ANYTHING ELSE.** Group 1's task, addressed in full at §7 below
   — install KaTeX (and, separately, MathJax) for real, measure and decompose, settle RULING 1. Named
   first here because D-2/D-10/D-11 (and every group after 1) are structured around its answer rather than
   guessing it.
2. **The markdown-it plugin landscape** → **D-1**, resolved concretely: `@mdit/plugin-tex` as the
   tokenizer, our own passthrough render rules on top, `markdown-it-katex`'s eager-render shape named and
   rejected. Task 1.2/2.x's job to verify the actual token/API shape against the installed package.
3. **KaTeX's actual output shape** → **D-4/D-5/D-6**, resolved concretely: `htmlAndMathml` kept as
   default, both trees admitted by the profile, both trees put to use (paint + accessible name + the
   copy-as-MathML mechanism). Group 2's job to enumerate the exact tag set against real installed output.
4. **The KaTeX self-hosted-fonts trap** → **§1.4**, resolved concretely: the `?inline` CSS-import
   mechanism, with the empirical zero-network proof (including a firing control) owed to group 4.
5. **Existing golden fixtures with a literal `$`** → **§1.1**'s audit, run as its own group-3 task before
   the parse rule's render behaviour is exercised by anything downstream.
6. **Sanitizer-profile enumeration machinery reuse** (spec §7-6) → **RESOLVED: reuse the PATTERN
   (data-as-arrays, a distinct named function, a procedural filter beside the allow-list), not any shared
   CODE.** `sanitizeSvg`'s CSS-token scanner and `sanitizeMath`'s (D-5's `cleanMathStyle`) attribute-value
   scanner solve different problems (nested at-rule/comment-aware CSS-text parsing vs. a flat
   declaration-list token scan) and sharing an implementation between them would either over-generalize
   the simpler one or under-power it — 007 D-4's own "a sibling function, not a generalisation" reasoning,
   applied to a filter instead of an eviction algorithm. The REVIEWABILITY property `sanitize.ts`'s header
   asks for is satisfied by both filters living in the same file, in the same declared-as-data style, not
   by one function serving two shapes.
7. **Copy-as-MathML's actual mechanism** → **D-6**, resolved concretely: clone-and-serialize the existing
   `<math>` tree, zero new dependencies. Spec §7-7's own suspicion confirmed.
8. **The sibling-checklist audit** (§7-8, M6 retro finding 4) → discharged below in §3.5 as a plan
   deliverable, per the 007 §3.5 precedent.
9. **Design translation** (§7-9) → D-7 names the INLINE failure-marker MECHANISM (an attribute annotation,
   not a new node) as an architectural consequence of the mutate-in-place inversion; the exact visual
   treatment (colour, underline style) and the block-figure control-group placement are still gate-3's own
   walk, per §8 below — the identical split 007 §1.4/§8 drew between "carry the design language, verify
   tokens" (plan-level) and "judge legibility/discoverability on a real document" (human-gate-level).

### 3.5 THE SIBLING-CHECKLIST AUDIT (§7-8 · M6 retro finding 4) — the plan's deliverable

*Enumerated against the properties 007 §3.5 already established for diagrams, since diagrams are math's
own closest sibling (a post-mount block enhancement with its own sanitizer profile and its own hover/focus
control group) — not re-derived from the five-suites-back list 007 itself worked from, which remains
diagrams' own citation. `Y` = math inherits the property via 007's own machinery (block math only, via
D-8's reuse) · `D` = a distinct assertion is required · `I` = INVERTS for inline math specifically (D-7) ·
`—` = out of scope, with the reason.*

| # | property (007's own numbering, where it maps) | block/fence math (D-8) | inline math (D-7) |
|---|---|---|---|
| 1 | renders app-page-only, absent + no chrome on content-script | `Y` — same import fence (D-3) | `Y` — same fence; inline markers exist as literal `<code>` text there too, unrendered |
| 4 | rendered content is a SIBLING of the hidden source, never inside it | `Y` — D-8 reuses `<figure>`-sibling-`<pre>` verbatim | `I` — **THERE IS NO SIBLING.** The `<code>` IS the marker AND (post-render) the content holder. This is D-7's own named inversion, not an oversight. |
| 6 | `--reader-measure` == resolved `max-width` | `Y` — a block formula's figure resolves against the same variable, mirroring diagrams' §1.4 | `—` inline content has no independent width to clamp; it flows with its line |
| 11 | the control group anchors to its OWN artifact, not the viewport | `Y` — D-6's copy-as-LaTeX/MathML group, block only | `—` **NO CONTROL GROUP ON INLINE MATH** — hover/hold-to-reveal chrome on a `$x$` mid-sentence would itself be the clutter spec §3.10 declines a context menu to avoid; inline copy is reachable by ordinary text selection, which needs no new affordance. This is a plan-level scoping call, named so a future reviewer does not treat inline math's missing control group as an omission. |
| 14 | control group survives a re-render (closure death) | `Y` — same "resolve from the DOM at activation time" discipline `runDiagramAction` already uses | `—` no control group exists to survive (row 11) |
| 15 | state in TEXT and `aria-*`, not colour alone | `Y` — the block failure marker and the copy buttons | `D` — the inline failure annotation (D-7) must carry `title` text AND `aria-*`, not a bare CSS class, so a colour-blind or non-hover reader still learns which formula failed |
| 16 | a real `<button>`, keyboard-operable | `Y` — the copy actions | `—` nothing is interactive on a rendered inline formula itself; it is inline text, and adding a button there would itself be new inline chrome spec §3.10 does not ask for |
| 17 | accessible name carries selection AND action | `Y` — "Formula N. Activate to copy as LaTeX," mirroring `themeControl`'s shape | `D` — an inline formula's accessible name comes from the MathML tree itself (D-6's own mechanism, §5's requirement), not from a button label, because there is no button |
| 19 | reduced motion: no animation under reduce, DOES animate without it | `—` **NO ANIMATION IS SPECIFIED ANYWHERE IN §4/§5 FOR MATH.** Unlike diagrams' placeholder shimmer (007 D-11, itself only a WALK judgement, not built), math's own D-11(007)-analogue does not exist because §3.6's cache lean means no long-pending state is expected to need a shimmer at all. Named so a future task does not invent motion nothing asked for. | `—` same |
| 20 | polite live region, out of the a11y tree while empty | `Y` — block math's own status region, mirroring `DIAGRAM_STATUS_CLASS`'s shape, for copy-action results | `—` no action exists to report (row 11) |
| 21 | focus trap and restore (007's OWN new baseline, not a sibling's) | `—` **NO LIGHTBOX IS SPECIFIED FOR MATH ANYWHERE IN §4.** Unlike diagrams, a rendered formula is already text-scale and legible at its natural size; §4's acceptance criteria name no "open larger" affordance. Named explicitly so this absence is a scoping decision on the record, not a silently-dropped feature. | `—` same |
| new | copy-as-LaTeX / copy-as-MathML (§4, this milestone's own two ⭐ items, no 007 analogue) | `D` — D-6's mechanism, exercised through the SAME hover/focus control-group shape row 11 gives block math | `D` — **RULED AT GATE 2, 2026-09-06: OPTION (b) — text-selection for copy-as-LaTeX, a document-level "copy all formulas as MathML" action for copy-as-MathML, NO per-formula inline control group.** (Originally flagged here as open: NO PER-FORMULA CONTROL GROUP EXISTS for inline math (row 11), so these two actions needed their OWN reachability mechanism for inline formulas specifically — a keyboard-focusable inline element or a document-level action were the two live options. **★ WAS FLAGGED AS A GATE-2 FINDING (§8-1) — this was the one place spec §4's own acceptance criteria ("when a rendered formula is hovered or focused, the system shall offer copy-as-LaTeX and copy-as-MathML for that formula") read as if it assumed ONE mechanism for both inline and block math; D-7's own inversion meant it could not be one mechanism without new design. See `decisions.md`'s M11 GATE 2 entry for the binding ruling and the §4-copy-criterion amendment.**) |

---

## 4. Risks & unknowns this plan still carries

1. **★ The inline-math copy-affordance mechanism (§3.5 audit, new row) is NOT resolved by this plan and
   is routed to §8-1 as a genuine gate-2 finding**, not a deferred implementation detail — it is a real
   gap between spec §4's literal text and what D-7's own structurally-forced inversion makes buildable
   without new chrome.
2. **`@mdit/plugin-tex`'s actual standalone-usability (D-1) is unverified against the installed package.**
   Its own documentation states it as the base for `@mdit/plugin-katex`/`@mdit/plugin-mathjax`, which
   strongly implies standalone tokenize-only usage is supported and intended, but this plan has not
   installed it to confirm the render-rule registration surface behaves as described. Task 1.2/2.x's to
   confirm; D-1's own revisit-when (a hand-rolled rule) is the named fallback if it does not.
3. **Whether `katex` dedupes or shares a bundled chunk with `mermaid`'s own transitive `katex ^0.16.45`**
   (007's plan §4 risk 2 named this transitive dependency; this plan is the first to need it as a FIRST-
   PARTY dependency). **This is a real measurement axis for group 1, named here so it is not discovered
   as a surprise**: if pnpm resolves both to one physical copy AND Rollup's own chunk-splitting can share
   ONE built chunk between mermaid's internal usage and this milestone's own lazy-loaded math chunk, the
   MARGINAL byte cost of adding `katex` as a direct dependency could be materially smaller than a
   from-scratch estimate — or it could be zero synergy if mermaid's usage is internal-only and not
   chunk-shareable. **Neither outcome is assumed; group 1 measures and reports which.**
4. **D-9's "no theme re-render needed" lean rests on a documentation-level understanding of KaTeX's CSS
   colour model, not yet a contrast measurement on real installed output.** Stated as verify-at-task-time
   in D-9 itself; repeated here because a wrong lean here would be the SAME class of defect 007 §9.1's
   dark-mode finding was — a green test suite proving nothing about actual legibility.
5. **The `?inline` CSS-import mechanism (§1.4) is this plan's own analogue of 007's "no OFF-ORIGIN request
   for guard-passing source" residual measurement window** — closed by mechanism on paper, unverified
   against the real installed package and the real Vite/WXT build pipeline. If `?inline` behaves
   differently than documented for this project's specific WXT/Vite version pairing (a live, re-verify-
   able external contract per AGENTS.md), the fallback is a build-time asset copy step (mirroring how
   `shiki`'s own WASM/font handling is already special-cased in this codebase, per 009's own history) —
   named as the fallback rather than assumed unnecessary.
6. **MathJax's own output shape (if RULING 1 ships it) is completely unresearched by this plan** — D-5's
   sanitizer profile is stated to be "widened, not replaced" for a second engine, but MathJax's SVG or
   CommonHTML output modes have their own tag/attribute vocabulary this plan has not surveyed, on the same
   "verify against the real installed package, not memory" posture that governs every other engine-output
   claim here. This is explicitly group 7's own first task if RULING 1 reaches it, not pre-solved here.
7. **No design mockup for math chrome is known to exist**, the identical gap 007 §7-10 and 010 §7-7 both
   named for their own milestones — confirmed absent at this plan's own evidence base. Group 9 (or
   whichever task owns the design-translation gate-3 item) confirms whether one exists or needs producing.

---

## 5. Test strategy

- **jsdom unit:** `mathSourceOf`'s `$$`-peel logic (dollar-block vs. fence origin) · the math-marker
  detection predicates (`hasMathMarker`, mirroring `hasDiagramFence`) · `sanitizeMath` against a hand-built
  hostile corpus (a `style` value carrying `url(...)`, an attempted `<annotation>` carrying something other
  than plain text, an attempted `mglyph`/`ms`/other MathML element not in the enumerated allow-list, an
  attempted bare `<a>`) · `cleanMathStyle` in isolation, including the fixpoint-vs-single-pass question
  `cleanSvgCss` already answered for its own filter (a much simpler flat scan here, but the same "denied
  by TOKEN" posture) · the parse-rule's escaping and code-span-exclusion behaviour, including every fixture
  the golden audit (§1.1) flags.
- **Real-engine (Chromium + Firefox), red-first and non-vacuous:**
  - **Absent on the content-script reader** (§9-2), red-first by ungating — the identical 007 §3.5 row-2/3
    shape.
  - **D-7's inversion, asserted directly:** a rendered inline formula's `<code class="peekover-math-
    inline">` element PERSISTS (never removed, never wrapped) across a successful render — the property
    that makes copy-as-LaTeX's retained-source read (D-6) valid. Reverted by removing/replacing the element
    on success, which must go red naming the missing anchor.
  - **D-8's shared shape, asserted directly:** a dollar-block formula and a fence formula produce
    IDENTICAL DOM shapes post-render (modulo their respective peeled/unpeeled source), proving the reuse
    claim rather than asserting it.
  - **The zero-network proof, with the KaTeX-font-specific firing control** (§1.4): zero requests across
    import → render → sanitize → adopt → copy, PLUS a scratch ablation (a `<link>`-to-CDN ablation ) shown
    live in the same test to prove the guard would catch the trap spec §3.7 names, not merely a generic
    "no fetch" assertion.
  - **D-9's lean, measured, not merely asserted from CSS text:** a real contrast measurement of a rendered
    formula's ink colour at light/dark/sepia, proving it tracks the theme WITHOUT re-render — the identical
    class of "prove the picture actually differs" lesson 007's own dark-mode retro (`progress.md`'s
    2026-08-02 entry) banked: *"a green re-render suite is not evidence about pixels."* Here the assertion
    runs the OTHER direction — proving NO re-render occurred while the rendered colour still tracks the
    theme via inheritance — and needs its own non-vacuous firing control (a deliberately hardcoded-colour
    ablation that must fail this exact assertion).
  - all three §3.9 failures degrade correctly, including sanitize rejection (D-8's block path, the latest-
    moment case 007 D-15 is shaped for) and the inline path's in-place-annotation shape (D-7).
  - a copy-as-LaTeX action returns byte-identical source to what was authored (including a formula with
    escaped `\$` or interior code-span-adjacent syntax from the golden audit) and a copy-as-MathML action
    returns a `<math>` root the browser's own XML parser accepts round-trip.
- **Pins every task:** `git diff tests/golden/output/` reviewed per §1.1's audit protocol (NOT asserted
  empty this milestone — spec §5's own binding correction, "Golden GROWS") · `tests/manifest.test.ts`
  green at its re-verified byte count · `permissions: []` on both built manifests · the import fence:
  `katex` (and, contingently, MathJax's package) in no content-script module graph, asserted statically AND
  by md5-identical content-script bytes under ablation, the identical 007 §1's proof shape.
- **Revert-and-fail (M6 retro finding 5) is the standard, not an option**, restated per AGENTS.md's own
  standing rule: every regression test this milestone produces is verified red with the defect's own
  signature in the defect's own units.
- **Measurement (not CI):** §7 below.
- **Human gate:** the inline failure-marker's visual treatment (D-7's own open design-translation item) ·
  whether the block-math control group reads as discoverable or as clutter (mirroring 007's own D-11
  judgement axis) · legibility of a dense, multi-line formula at the reading column's own width ·
  Firefox everything (Playwright cannot load an extension into Firefox) · zero unexpected network with the
  Network tab open · at least one WIDE viewport, recorded like an engine (M6 retro finding 2).

---

## 6. Group order

*Sequencing only. `tasks.md` at gate 3 owns decomposition, in a fresh session.* Three hard constraints,
each from the spec or from this plan's own D-values: **the byte measurement (RULING 1) gates every group
after it** — nothing downstream assumes an answer; **the golden-fixture audit (§1.1) precedes the parse
rule landing**, not merely precedes its own test; **the MathJax group (7) is opened only if group 1 rules
it in**, per D-10's own contingency structure.

**1 · The byte measurement (task 1.1).** Install `katex` for real; separately install the MathJax package
task 1.1 itself names concretely (spec does not pre-name one); **ALSO install `@mdit/plugin-tex` (D-1's
chosen tokenizer) and measure it alongside the two engines — GATE-2 FIX, 2026-09-06: `@mdit/plugin-tex`
is an ALWAYS-LOADED parse-graph dependency (`parse.ts` uses it unconditionally, D-1), not a lazy
render-engine chunk, so it is a guaranteed byte floor on every document regardless of RULING 1's outcome
and regardless of whether a document contains math at all — omitting it from Group 1's measurement list
understates the milestone's guaranteed cost, the same "measure every new dependency, including the
always-loaded one" lesson M10's fonts trap named for its own always-present cost.** Measure
`.output`/`pnpm zip` deltas for each of the three (`@mdit/plugin-tex`, `katex`, MathJax), alone and
combined, against the current ~352.8/352.7 KiB / ~607.8/607.7 KiB headroom, decomposed to a fully
accounted residual (the D-11(007) four-component ablation shape). Measure the `katex`/mermaid's-
transitive-`katex` dedup/chunk-sharing question (§4 risk 3). Verify licence, no install scripts,
`pnpm audit --prod` clean, single resolved `dompurify` still holds. Regenerate the SBOM. **THIS GROUP
RULES §9-1 — its output is the fork every later group is written against.** *Touches:* `package.json`
only. *Must NOT touch:* any render or app module. *Acceptance:* RULING 1 is settled with a decomposed,
ablation-proven number in each arm (KaTeX-only, KaTeX+MathJax), PLUS `@mdit/plugin-tex`'s own
always-loaded residual accounted for separately from either engine arm; scanner green with its self-test
firing.

**2 · The math sanitizer profile.** D-5, standalone and testable against a hand-built KaTeX-shaped corpus
before anything produces real output — the actual tag/attribute enumeration against installed KaTeX's real
output happens here, once group 1 has actually installed it. *Touches:* `src/render/sanitize.ts`
(additive only). *Must NOT touch:* the document or SVG profiles' existing consts, `tests/golden/*`.
*Acceptance:* the hostile corpus is neutralised; `cleanMathStyle` proven against real KaTeX output
producing zero strips; the other two profiles' arrays are byte-identical.

**3 · The golden-fixture audit + the parse-stage rule.** §1.1's audit runs FIRST, as its own reviewed step;
D-1's tokenizer + passthrough rules land second, against the audit's findings. *Touches:* `src/render/
parse.ts` (additive). *Must NOT touch:* the existing fence-rule override's own logic, `sanitize.ts`.
*Acceptance:* every flagged fixture's diff is reviewed and classified; the new `<code>`/`<pre>` marker
shapes are pinned in a committed golden fixture the way `code.html:2` already pins the fence shape.

**4 · Enhancer scaffolding — block math.** D-2, D-3, D-4, D-8 — the engine module, the two-call-site
wiring, KaTeX's config lockdown, block/fence math's D-15-reuse sibling-figure adoption, per-formula
degradation, and the zero-network guard with its KaTeX-font-specific firing control (§1.4). No inline math
yet, no copy actions yet. *Touches:* `src/render/mathEngine.ts`, `src/render/mathEnhancer.ts` (block half),
`src/render/mathView.ts` (block half), the two call sites, `readerCss.ts` (block figure styling). *Must NOT
touch:* `mount.ts`, the content-script graph, `diagramEngine.ts`/`diagramEnhancer.ts`/`diagramView.ts`.
*Acceptance:* §4's block/fence rendering and degradation criteria; D-9's theme lean measured and confirmed
or corrected; `mount.ts` diff empty.

**5 · Enhancer scaffolding — inline math.** D-7's mutate-in-place mechanism, built once block math's
engine-load/config/degrade machinery (group 4) is proven, since inline math reuses the SAME engine load
and the same `drawFormula` primitive with a different adoption shape. *Touches:* `mathEnhancer.ts` (inline
half), `mathView.ts` (inline half). *Acceptance:* §4's inline rendering and degradation criteria; the
persistence-of-the-`<code>`-element property (§5's test strategy) proven red-first.

**6 · Copy-as-LaTeX / copy-as-MathML.** D-6's mechanism, for block math through the same hover/focus
control-group shape 007 D-15/§3.11 established (row 11); for inline math, **§8-1 RULED (b) at gate 2,
2026-09-06 — this group's inline half is UNBLOCKED and may be scoped at tasks.md.** *Acceptance:* §4's
four copy-action criteria, per the gate-2 amendment: block math offers per-formula copy-as-LaTeX AND
copy-as-MathML through its control group, unchanged; inline math offers copy-as-LaTeX via ordinary
text-selection of the retained source (zero new code) and copy-as-MathML via a document-level "copy all
formulas as MathML" action, NOT a per-formula inline affordance — `permissions: []` re-proven; no
`contextMenus` anywhere (§3.10).

**7 · MathJax (CONTINGENT on group 1's ruling — opened only if RULING 1 ships it).** D-2's second engine
module, D-10's single dispatch branch, D-11's settings field (once RULING 4 is separately ruled — this
group may itself need to pause for that human call), the toggle control. *If RULING 1 excludes MathJax,
this group is struck at tasks.md and never opened* — D-10's own contingency structure is what makes that
a clean strike rather than an unwind.

**8 · Measure.** The render-timing measurement feeding §3.6's cache lean (D-12) — 1/10/50-formula
documents, median and floor, the 007 D-9 shape. Confirms or contradicts the no-cache lean; **produces
numbers, forbidden from choosing a cache design from them** — a contradicted lean routes to
`progress.md`'s § Carried items per D-12's own text, not to a cache built inside this group.

**9 · Human milestone-close gate + retro.** Including the design-translation walk (the inline
failure-marker's visual treatment, the block control-group placement), the recorded viewports, and the
same M7-precedent floor-delta statement discipline before any re-baseline is discussed.

**§4 EARS coverage:** Rendering (KaTeX, always in scope) → groups 3, 4, 5 (+content-script clause → group
4's import fence) · MathJax fallback (contingent) → group 7 · Copy actions → group 6 · Trust → group 1
(bytes/manifest), group 4 (network, block), group 5 (network, inline — the same guard, exercised on the
inline path) · Degradation → groups 4, 5. Every non-contingent clause has at least one non-contingent
group; the contingent clauses are struck to "N/A" exactly as spec §4 itself already states if RULING 1
excludes MathJax.

---

## 7. Measurement plan (RULING 1 · D-9 · D-12 · §8 of the spec)

*Every task below is **forbidden from choosing a value or a design from its own output**. Protocol for
anything timed: A-B-A against a same-session HEAD control, floor reported beside median (M6 retro finding
7), with the ablation as the firing control (finding 1).*

- **RULING 1 — the dependency-set fork.** Outputs: `katex` alone, `.output`/zip delta, decomposed to a
  fully accounted residual · the ruled MathJax package alone, same decomposition · both combined, same
  decomposition · whether `katex`/mermaid's-transitive-`katex` share a build chunk (§4 risk 3) · whether
  either needs a subset/lazy-split strategy to fit at all (the 007 D-10(b)/(c) precedent, narrowing an
  inline before it is forced).
- **D-9 — the theme-inheritance claim.** Outputs: a real contrast measurement of a rendered formula's ink
  colour at light/dark/sepia, both BEFORE and AFTER a deliberate theme flip with NO re-render triggered —
  proving the CSS-cascade claim empirically rather than from documentation, the identical "was it
  re-rendered vs. does it look different" distinction 007's own dark-mode retro banked as a lesson.
- **D-12 — render-timing, feeding the cache lean.** Outputs: 1/10/50-formula fixtures × {wall-clock to
  all-formulas-resolved, time-to-first-formula, per-formula amortized cost}, median and floor, the 007 D-9
  shape exactly. **No cache is built until this measurement justifies one** (§3.6's own binding text).
- **First paint, no math:** the existing gate against `progress.md`'s own current baseline, A-B-A, floor
  beside median — math enhancement is post-mount (D-3), so a math-free document should show zero delta;
  proving that is this measurement's whole job.
- **First paint, WITH math:** the same gate, because D-3 puts the engine after the commit — a math-bearing
  document that misses the gate means the enhancement is not actually post-paint, a defect, not a budget.

---

## 8. Gate-2 questions

1. **★ THE INLINE COPY-AFFORDANCE MECHANISM (§3.5 audit's new row, §4 risk 1) — a real spec/architecture
   gap surfaced by this plan, not a copy question. ★ RULED AT GATE 2, 2026-09-06 — OPTION (b), below,
   is the human-approved answer; see `decisions.md`'s M11 GATE 2 entry for the binding record and the
   §4-copy-criterion amendment it carries. The two options are kept in full below for the record of what
   was weighed, not as a still-open choice.** Spec §4 reads as if one hover/focus mechanism serves
   both inline and block formulas' copy-as-LaTeX/MathML; D-7's own structurally-forced inversion (inline
   math has no sibling slot to anchor a control group in, and inline hover-chrome would itself be the
   clutter spec §3.10 declines a context menu to avoid) means it cannot, without inventing a NEW kind of
   in-text affordance this plan has not designed. **Two live options, stated without a recommendation
   hidden in them, the same posture spec §9-4 modelled for its own open call: (a)** make the inline
   `<code>` element itself keyboard-focusable (`tabindex="0"`) and reveal a small popover of the two copy
   actions on focus/hover, scoped tightly to that one element, styled to read as a tooltip rather than as
   persistent chrome; **(b)** decline a dedicated inline affordance entirely and rely on ordinary text
   selection + the browser's own copy — the rendered formula's accessible text (via the retained source or
   the MathML annotation) is already selectable, so "copy as LaTeX" may already be satisfied by
   triple-click-and-copy without new code, and only copy-as-MathML (which selection cannot produce)
   would need a fallback (perhaps: block math's control group ALSO reachable for inline formulas via a
   less immediate route, e.g. a document-level "copy all formulas as MathML" action, which is a materially
   smaller feature than a per-formula inline popover). **Nothing is blocked on this being answered before
   `tasks.md` drafts group 6 for BLOCK math — only the INLINE half of group 6 depends on it.**
2. **Whether the inline failure-marker's exact visual treatment (D-7: `title` + a data attribute + a
   colour/underline cue) should be a dotted underline (matching how misspelled-word markers commonly read)
   or a distinct highlighter-adjacent treatment consistent with this project's own paper/ink/one-highlighter
   brand** — a design call `design/brand.html`/`design/tokens.css` should settle, the same "verify every
   token, never substitute a nearby one silently" discipline 007 §1.4 and 010 §7-7 both name for their own
   milestones. No mockup for math chrome is known to exist (§4 risk 7) — confirm whether one exists or
   needs producing before group 9's own design-translation walk.
3. **Whether `@mdit/plugin-tex`'s own licence/maintenance posture, once actually inspected at task 1.2,
   changes D-1's own choice** — this plan names it as the mechanism on documentation-level evidence; if
   installing it surfaces something this plan's evidence base could not see (an abandoned-since-verify
   state, an incompatible licence, a token shape that assumes its own katex/mathjax sibling is present),
   that is task 1.2's own finding to report back through, not a silent substitution of the hand-rolled
   fallback D-1 already names.

---

*Gate: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` — the ORDER — is the next artifact
and the next gate, generated in a **fresh session** (C14). **No implementation code before `tasks.md` is
approved** (WORKFLOW.md §5.3).*

*No spec amendments ride with this plan. The spec was found correct everywhere this plan checked it —
including §3.3's parse-rule requirement, §3.4's byte-risk framing, §3.5's profile-shape requirement, and
§3.7's font-hosting trap. The one place this plan found the spec's own text under-specified rather than
merely unresolved is §4's copy-action criteria assuming one mechanism serves both inline and block math
(§8-1 above) — a genuine gate-2 finding, not a correction to `spec.md`, which stays sealed per the M7–M10
precedent.*
