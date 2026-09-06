# Spec 011 — Math rendering: KaTeX (+ MathJax fallback, contingent) for inline/block/fence math

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **011 delivers M11 — F2's remaining half.** M7 shipped F2's diagram half (Mermaid, 3% → 42%,
`spec-coverage.md`); the seven rows M7 left untouched are all math/formula rows — KaTeX, the MathJax
fallback toggle, inline `$…$`, block `$$…$$`, code-fence math, and the two ⭐ copy-as-LaTeX/MathML
affordances. M11 is that remainder, human-ruled from the M11-scope menu, 2026-09-06.
**Date:** 2026-09-06
**Milestone:** M11 · builds on 010 (Local exports — CLOSED 2026-09-06)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 010's section shape,
which mirrors 009's/008's/007's — §3 decided calls, §4 EARS, §6 the IS-NOT fence, §7 plan-stage risks,
§8 gate-3 measure-then-choose, §9 gate-1 questions. **007 is the closest architectural precedent, not
just a formatting one**, and is cited throughout §3: a client-side render library, lazy-loaded, no
network, byte-gated, needing its own sanitizer profile — math is the same shape as Mermaid, one
milestone later, with a materially thinner byte margin.
**Evidence base:** no fresh scope-read of `src/` beyond the targeted checks below — `docs/product/spec.md`
§F2 (quoted verbatim, not paraphrased), `docs/ai/spec-coverage.md`'s F2 row (the seven ✗ math rows, their
exact wording and the ⭐/✅ marks), `specs/007-mermaid-diagrams/spec.md` in full (the structural template
and the architectural precedent), `specs/010-local-exports/spec.md` §3.4/§9-1/§6 (the DOCX-math deferral
whose own revisit-when is *"F2 math shipping first"* — read so this spec does not silently re-open DOCX
export, which it must not), AGENTS.md (the byte ceilings, the zero-network/sanitization non-negotiables,
the just-placed harness-shared-state rule), `docs/ai/progress.md`/`progress-archive.md`'s M10-close byte
ledger (task 10.4, quoted in §3.4 below), and one targeted read each of `src/render/sanitize.ts` (the
SVG-profile precedent, §157-405) and `package.json` (six production dependencies today — `diff`,
`dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`, `shiki`). **Every `file:line` cited here
must be re-derived by `plan.md` against the actual tree at its own HEAD** — 007/009/010 all make the same
demand for the same reason, and no KaTeX/MathJax package has been installed or inspected for this draft.

---

## 1. Problem & value

`docs/product/spec.md` §3 names the student/researcher persona's whole reason to exist: *"Read and write
notes with math"* → *"KaTeX/MathJax, print/PDF, presentation mode, read-aloud."* `spec-coverage.md`
states the consequence bluntly: *"the Student still has no math — F2's 42% buys the Student nothing"* —
M7's diagram work moved F2's score from 3% to 42% while leaving every math row exactly where it started.
Today a document containing `$E = mc^2$` or a block `$$\int_0^\infty e^{-x^2}\,dx$$` renders as literal
dollar-sign-delimited text, unrendered, in a product whose entire value proposition is "beautiful
reading" of the raw text agents and researchers write.

**Who it serves:** the student/researcher persona (product spec §3), whose column has had zero
milestones invested in it directly across ten milestones of persona-#1 (AI-tool developer) work.
Secondarily every persona whose agent-written documents contain LaTeX math — a spec, a paper draft, a
research note an agent produced — the same "the product's value story fails on its own content" shape
007 §1 named for diagrams.

**What the product promises** (`docs/product/spec.md` §F2, quoted so scope matches the promise, not a
paraphrase of it — the diagram half already struck through as shipped):

- ✅ ~~Mermaid: flowcharts, sequence, class, state, ER, Gantt, pie, git graphs~~ — **shipped, M7.**
- ✅ **KaTeX (default, fast) with MathJax fallback toggle for full LaTeX coverage**
- ✅ **Inline `$...$` and block `$$...$$` + code-fence math**
- ⭐ **Right-click any formula → copy as LaTeX / copy as MathML**
- ✅ ~~Additional engines (post-v1 stretch): Graphviz DOT, Vega/Vega-Lite, PlantUML~~ — **still out, F2's
  own post-v1 clause, 007 §6 already deferred it, not this milestone either.**
- ⭐ ~~Auto dark-mode media adaptation — diagrams re-themed and images optionally dimmed/inverted~~ —
  **the diagram half shipped (M7); the images half is still ✗ and is not a math item — untouched here.**

That is the entirety of F2's math text. **This spec does not invent scope beyond it** — no equation
numbering, no cross-reference linking, no LaTeX macro packages, no equation editing are named anywhere
in F2, and none is assumed here (§6).

## 2. User stories

- As a researcher reading a spec an agent wrote, I want inline and block LaTeX math **rendered as
  typeset equations**, so I can read the mathematics rather than parse dollar-sign-delimited source.
- As a reader of a math-heavy document, I want the **text to appear immediately** and equations to fill
  in without blocking the page, the same progressive-enhancement shape 007 gave diagrams.
- As someone who needs a formula elsewhere, I want to **copy it as LaTeX or as MathML**, without
  retyping it from the rendered glyphs.
- As a reader whose document uses LaTeX syntax KaTeX cannot render, I want a **fallback to full LaTeX
  coverage**, rather than a formula that silently fails to appear.
- As a screen-reader user, I want a rendered equation to have a **real accessible representation**, not
  a purely visual glyph rendering with nothing for assistive technology to read.
- As a security-conscious user, I want equation rendering to **put nothing on the wire** — no remote
  font, no remote script, no telemetry — and to see that claim proven, not asserted.
- As a user whose formula has a syntax error, I want to **see the error and my source**, not a blank
  space where the equation should be (the same 007 §3.8 degradation shape, applied to math).

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — KaTeX rendering (inline/block/fence math), copy-as-LaTeX/MathML, and — CONTINGENT
ON §3.4's OWN MEASUREMENT — a MathJax fallback. Nothing else.**

IN, at full scope: KaTeX-rendered inline `$…$` and block `$$…$$` math, code-fence math (a ` ```math `
fence, mirroring how a ` ```mermaid ` fence already works), graceful failure to raw source, copy-as-LaTeX
and copy-as-MathML per formula (hover- and keyboard-reachable, **not** a browser context menu — §3.11's
own reasoning below), zero-network proof, and the math-shaped sanitizer profile (§3.5).

**CONTINGENT, per §3.4's byte-budget measurement, with a pre-stated fallback stated here so gate 1 rules
on the byte risk knowingly rather than discovering it at task 1.1 the way M10 discovered DOCX's weight:**
the MathJax fallback toggle. **If task 1.1's own dependency measurement shows KaTeX + a MathJax fallback
chunk both fit the current headroom, the fallback ships at full scope** (§9-1's shape question still
applies to what "toggle" means). **If the measurement shows the fallback chunk busts the ceiling, the
fallback is deferred out of M11 — the same scope-reduction shape M10's §3.10/§8.3/§3.1 gates used three
times over for DOCX, the progress indicator, and local-image embedding — and M11 ships KaTeX-only.**
**Neither outcome is chosen here.** §8 states the axes; §9-1 names the dependency-set ruling as gate 1's
own call to make from the measurement, forbidden from being assumed in this draft.

OUT, each with a home in §6: additional math/diagram engines (F2's own post-v1 stretch, unchanged since
007 §6), the images half of auto dark-mode adaptation (unrelated to math, still ✗, untouched), equation
editing or authoring (F8 territory — Editor Mode does not exist), DOCX math/OMML (010's own deferral,
whose revisit-when this milestone satisfies but does not itself re-open — see §6), and the
content-script `file://` / raw-host reader's math reach (§3.2 below).

**3.2 011 SHIPS TO THE APP-PAGE READER ONLY. The content-script `file://` / raw-host reader renders no
math — DECIDED, on 007 §3.2's own reasoning, applied verbatim to a second heavy render engine.**

- **The shared reason (manifest).** KaTeX (and, contingently, MathJax) are lazy-loaded local chunks —
  §5's byte discipline requires it, the same way 007 §10 required it for Mermaid. A content script
  cannot load a separate packaged chunk without `web_accessible_resources`, a key `tests/manifest.test.ts`
  forbids outright (`manifest.test.ts:31`, per 007's own citation — unchanged since). Folding either
  engine into the content-script bundle puts render-library weight on the gated first-paint path of
  every `file://` document, math or not — the identical fork 007 §3.2 and 010 §3.2 both name for their
  own heavy dependencies.
- **The new-and-decisive reason is thinner headroom, not a new argument.** 007 shipped Mermaid against
  ~1.65 MB of `pnpm zip` headroom (M6's own close figure); M10 closed at **~352.8 KiB (Cr) / ~352.7 KiB
  (Fx)** `.output` headroom and **~607.8 KiB (Cr) / ~607.7 KiB (Fx)** zip headroom (§3.4) — the tightest
  margin any gate-1 in this project's history has opened against. A duplicated-surface math engine is a
  luxury this milestone's own budget cannot entertain even as a question.
- **The persona argument does not force the opposite conclusion.** The student/researcher persona's
  workflow (reading notes, papers, specs with math) is not tied to the `file://`-drag workflow the
  content-script surface serves (nearer persona #2's territory, per 007 §3.2's own framing) — a user who
  wants math rendering can open the same folder on the app page.

**A named deferral, not a silence**, the same shape 007/010 both used: no math affordance and no
explanatory note ship on the content-script reader in M11. **Gate 1 may overturn this (§9-2), priced
here rather than assumed** — the same shape 007 §3.4/§9-1 gave the standalone-`.mermaid`-files question.

*Rejected:* shipping the engine to both surfaces (the manifest/bytes fork above); a content-script-only
KaTeX-without-MathJax subset (KaTeX alone is still a new lazy chunk with the same `web_accessible_resources`
problem — the fork is about the *mechanism*, not the engine's size).

**3.3 Rendering is a POST-MOUNT enhancement for the input `mount()` already commits — but the SYNTAX
RECOGNITION ITSELF is a NEW markdown-it parse-time rule, unlike Mermaid's reuse of the existing fence
renderer. DECIDED, and named because it is a real point of difference from 007's own precedent.**

- **Why post-mount, same as 007 §3.3:** F2's own words for the diagram half — *"text paints instantly,
  [heavy blocks] render in the background"* — apply with equal force to math; any placement upstream of
  `mount()` puts a lazily-loaded engine on the first-paint path, which the <165 ms gate exists to
  prevent. `mount()` stays a read-only library (006 D-15); enhancement runs after it returns.
- **Where 011 genuinely differs from 007: Mermaid needed no new markdown-it rule.** A ` ```mermaid ` fence
  is markdown-it's existing fence renderer, unchanged; 007's enhancer read a fence markdown-it already
  produced. **`$…$` and `$$…$$` are not markdown-it syntax at all** — there is no built-in inline or
  block rule for dollar-delimited math. Recognizing it requires **a new markdown-it rule** (a plugin or
  a hand-written one, verified against current maintenance status before adoption — AGENTS.md's standing
  rule, the same discipline `markdown-it-task-lists` itself was chosen under) that emits a **sanitizer-safe
  passthrough marker** — analogous to the fence's `language-mermaid` class, but for inline and block math
  spans that do not otherwise exist in markdown-it's token stream.
- **Code-fence math (a ` ```math ` fence) needs no new parse rule** — it is the same `pre > code` shape
  a `language-math` class already gets for free from markdown-it's existing fence renderer, the identical
  mechanism 007 §3.3 used for `language-mermaid`.
- **★ This is why Golden is NOT empty this milestone, unlike M10.** M10's every export/copy action ran
  downstream of `sanitize(parse(source))`, so `tests/golden/output/` stayed byte-identical by
  construction (010 §5). **011 is the opposite case: a document containing `$…$`/`$$…$$` syntax produces
  a DIFFERENT `sanitize(parse(source))` string than it does today**, because a new token/marker now
  exists in the parse output where there was none before. Existing golden fixtures containing a literal
  `$` are the ones to audit first (§7) — a fixture with an unintentional inline-math-looking substring
  could change its own golden output the moment the new rule lands, which is a real regression to catch,
  not a false alarm to suppress.

*Rejected:* rendering math during `parse`/`sanitize` synchronously (couples a heavy render engine to the
text pipeline, the same 007 §3.3 rejection); waiting for a hypothetical future markdown-it math-plugin
ecosystem consensus rather than verifying the current landscape now (AGENTS.md's standing rule — verify
against current docs, don't assume staleness or freshness either way).

**3.4 THE BYTE BUDGET IS THE MILESTONE'S CENTRAL, FRONT-LOADED RISK — THE FRAMING IS DECIDED HERE; THE
DEPENDENCY SET IS NOT, and M10 already lived this exact failure mode once.**

M10's own close (`progress.md`/`progress-archive.md`, task 10.4, re-derived at a clean build, not carried
from memory) left: **`.output` 4,881,579 B (Cr) / 4,881,695 B (Fx)** against the **≤5 MiB** (AGENTS.md)
bound — **headroom ~352.8 KiB (Cr) / ~352.7 KiB (Fx)**; **`pnpm zip` 1,474,790 B (Cr) / 1,474,848 B (Fx)**
against the **<2 MB** bound — **headroom ~607.8 KiB (Cr) / ~607.7 KiB (Fx)**; **6** production
dependencies (`diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`, `shiki`). This is
the **thinnest `.output` margin any milestone in this project has opened a gate 1 against** — M10 itself
opened at ~367 KiB and closed ~14.4 KiB thinner after landing nothing that busted it outright.

**M10 IS THE DIRECT, NAMED PRECEDENT FOR WHAT NOT TO DO: assume a dependency fits.** M10's own task 1.1
measured `docx` alone at +373,820 B — almost its ENTIRE ~367 KiB opening headroom by itself — and the
combined `docx` + ZIP-writer delta busted the ceiling by 4,550 B, forcing a human scope-reduction gate.
**M11 states, at spec level, before any package is installed, that the identical fork is expected here
and is not going to be discovered as a surprise at task 1.1:**

- **KaTeX alone is credibly modest** — it is the smaller of the two math engines by design (the product
  spec's own words: *"KaTeX (default, fast)"*) — but *"credibly modest"* is a hypothesis, not a measured
  figure, and this draft does not assert a byte number for a package that has not been installed.
- **A MathJax fallback chunk is NOT small — this is the M11-scope-menu's own flag, carried into this
  spec rather than re-discovered.** MathJax's historical bundle weight is materially larger than KaTeX's
  (a full LaTeX-coverage TeX engine vs. a fast subset renderer) — against a headroom measured in the low
  hundreds of KiB, this is a genuine, plausible bust, not a hypothetical one.
- **Whether KaTeX + MathJax both fit, KaTeX alone fits comfortably, or even KaTeX alone needs a
  subset/lazy-split strategy the way 007 D-10(b) narrowed `mermaid/package.json`'s own reach, is a
  MEASUREMENT — task 1.1's, on the 009/010 precedent (build with the real import, measure, revert if it
  blows the budget) — NOT an assumption this spec is permitted to make.**

**What is decided here:** the byte budget is the milestone's primary gating uncertainty, not a background
constraint to check in passing; every byte is measured and ablation-proven, never grep-proven (007/009/010's
own standing lesson); and the milestone's **in-scope is stated CONTINGENTLY** (§3.1) with a **pre-stated
fallback** (KaTeX-only) named now, so gate 1 approves scope knowing the risk rather than a session
discovering it four scope-reductions deep the way M10 did. **What is not decided here:** the actual
dependency set, priced only by task 1.1's own measurement (§9-1).

**3.5 KaTeX's (and, contingently, MathJax's) rendered output goes through a SECOND, MATH-SHAPED SANITIZER
PROFILE. The document profile is NOT widened — DECIDED, on 007 §3.5's own precedent, applied to a
different markup shape.**

`sanitize.ts` today has no `math`/`mrow`/`mi`/`mn`/`mo`/`msup`/etc. tags in `ALLOWED_TAGS` — a rendered
formula (whether KaTeX's HTML-with-embedded-MathML-annotation output, or a MathJax equivalent) needs tags
the document profile has never admitted, on the same three-way fork 007 §3.5 already resolved for SVG:

- **Widening `ALLOWED_TAGS` in the shared profile — REJECTED**, same reasoning as 007: the document
  profile governs *untrusted markdown source*; a math-shaped tag set has no legitimate reason to be
  reachable from raw markdown, and widening it there for one enhancer's sake is exactly the trade 007
  declined for `svg`.
- **Relying on the shadow root as a boundary — REJECTED**, and named so it is not proposed again, per
  007's own words: *"shadow DOM is a style and query boundary, not a security boundary."*
- **A distinct profile applied only to the enhancer's output — CHOSEN**, the 007 D-1 shape exactly: the
  math engine's output is generated by our own bundled library and sanitized against a **math-shaped
  allow-list expressed as data**, in the same reviewable-in-one-place form `sanitize.ts` already carries
  for `SVG_ALLOWED_TAGS`/`SANITIZE_SVG_CONFIG` (`sanitize.ts:157-405`). The document profile's arrays
  stay untouched.

Requirements on that profile, at spec level (mirroring 007 §3.5's own list, adapted to math's shape):

- **Enumerated as data**, alongside the existing SVG allow-list, reviewable as one artifact.
- **No remote or `data:` references survive** on any URL-bearing attribute the math output could emit.
- **A bounded `aria-*` / `role` set IS permitted**, diverging from the document profile the same way the
  SVG profile does — an equation with no accessible name is an a11y regression (§5), and this is
  generated output from our own bundled engine, not untrusted source.
- **The exact tag/attribute enumeration — MathML's tag vocabulary (`<math>`, `<mrow>`, `<mi>`, `<mn>`,
  `<mo>`, `<mfrac>`, `<msup>`, `<msub>`, and the rest) vs. whatever HTML+class-based structure KaTeX's
  non-MathML output mode emits — is `plan.md`'s to enumerate against the actual installed package's
  actual output, not this draft's to guess** (§7).

**3.6 NO PERSISTENT CACHE IS EXPECTED — LEANED, NOT DECIDED, pending plan.md's own timing measurement.**

007 §3.6 built a hash-keyed persistent IndexedDB cache for diagrams because Mermaid's own layout cost was
measured heavy enough to need one, and 007 §8's own reopen bar (<1s at 50 diagrams) is unreachable without
it. **This draft leans against a math cache** — per-formula LaTeX parse+layout is typically far cheaper
than a full diagram's graph layout, and a watched document re-rendering unchanged formulas at KaTeX's own
speed may simply not need caching to feel instant. **This is a lean, not a decision**: no timing
measurement of KaTeX (or MathJax) render cost on a representative formula corpus exists yet, and §3.6
explicitly declines to assert a mechanism a measurement should justify. If `plan.md`'s own timing
measurement shows math-heavy documents (many formulas, or a MathJax-fallback-heavy document) miss a
reasonable reopen bar, a cache becomes a real candidate — priced against the same byte budget (§3.4) an
IndexedDB schema bump would need. **No IndexedDB schema change is assumed by this draft.**

**3.7 ZERO NETWORK — KaTeX's OWN SELF-HOSTING REQUIREMENT IS A NAMED TRAP, not a generic restatement of
AGENTS.md #1.**

KaTeX's own distribution ships a stylesheet that references its bundled font files by relative path —
the standard, correct integration self-hosts both the JS and the font/CSS assets from the extension's own
packaged files. **The trap 007 §7-3 named for Mermaid (a "detached" measuring container that still
fetches) has a KaTeX-specific analogue**: a naive integration that copies a CDN-style `<link>` tag or a
font `@import` verbatim from a quick-start guide would introduce a remote font fetch on first math
render — a genuine, plausible zero-network violation this specific library is known to invite, not a
hypothetical one. **This is stated here so `plan.md` treats it as a named risk to verify against, not a
generic checklist item** (§7). The zero-network proof (§5) must include a positive control that would
catch a remote font request specifically, not only a remote formula-data request.

**3.8 THE ENGINE(S) ARE A GOVERNED DEPENDENCY ACT — DECIDED, on 007 §3.12's and 010 §3.10's own process.**

- Six production dependencies exist today. KaTeX would be the seventh; MathJax, contingently (§3.1,
  §3.4), the eighth — each individually enumerated, licence-checked as permissive, appearing in the
  generated SBOM.
- **`pnpm audit --prod` stays a BLOCKING gate at 0 advisories** — the standing rule every milestone since
  M6 restates.
- **No install scripts.**
- **Verified against the package itself, not from memory** — AGENTS.md's standing rule, with the same
  force 007 gave it for Mermaid's API surface and 010 gave it for `docx`'s: a fast-moving library's
  current API, output modes, and accessibility options are a hypothesis until read from the current
  package, not training data. **This applies with particular force to KaTeX's own output-mode
  configuration (§3.5, §3.7) and MathJax's own bundle-splitting story, if it ships at all** — both are
  areas where a stale mental model produces a wrong sanitizer profile or a wrong byte estimate.

**3.9 EVERY MATH RENDER DEGRADES TO "SHOW THE RAW SOURCE" — DECIDED, the 007 §3.8 shape applied to math.**

- **Engine fails to load** (chunk unavailable): every `$…$`/`$$…$$`/math-fence stays exactly as authored
  — literal source text, correct and readable, the document's current behavior today.
- **A formula fails to parse or render:** that formula's span/block stays as its raw source, with an
  inline marker naming the failure; every other formula on the page renders normally.
- **Sanitization rejects the output:** same degradation.

**Never a removed span, never a blank gap where a formula should be, never a blank page.**

**3.10 COPY-AS-LATEX / COPY-AS-MATHML ARE IN-READER AFFORDANCES ON HOVER AND KEYBOARD FOCUS — NOT A
BROWSER CONTEXT MENU, despite the product spec's own "right-click" wording — DECIDED, on 007 §3.11's own
precedent, which `spec-coverage.md`'s F2 row already applies to this exact pair of items.**

`spec-coverage.md`'s own note on these two ⭐ rows states the reasoning that already governs them: *"M7's
own copy/download affordances deliberately avoided a context menu for exactly this reason (007 §3.11) —
the permission event was declined, not spent."* `contextMenus` is a manifest permission
(`spec-coverage.md`'s own citation), and `permissions: []` is the product's own brand commitment
(AGENTS.md #4). **This spec inherits that ruling rather than re-litigating it**: copy-as-LaTeX and
copy-as-MathML live on the same per-formula hover-revealed, keyboard-focusable control group shape
diagram actions already use (007 §3.11), not the browser's native right-click menu the product spec's own
prose names literally. If either affordance turns out to need a manifest permission after all
(unexpected clipboard API behavior), that is a hard stop and an AGENTS.md #4 event (§7), the same
stop-and-flag 007 §3.11 and §7-6 both required.

**3.11 THE MATHJAX "FALLBACK TOGGLE" IS, IF IT SHIPS AT ALL, A GLOBAL SETTINGS KEY — DECIDED IN SHAPE ONLY
IF THE ENGINE SHIPS; ITS TRIGGER SEMANTICS ARE GATE 1's CALL (§9-3).**

Contingent on §3.1/§3.4's own fallback surviving the byte measurement: if a MathJax fallback ships, its
persisted state is one new key on the existing single global settings row, the same shape 009 §3.5 used
for `codeTheme` and 010 §3.7 used for `lastExportFormat` — `Settings` gains one more field, not a new
settings surface, not a per-document axis. **What the toggle actually does — render every formula through
MathJax instead of KaTeX while enabled, or invoke MathJax only for the specific formulas KaTeX's own
parser rejects — is a materially different feature with a materially different cost, and this draft does
not choose between them** (§9-3).

## 4. Acceptance criteria (EARS)

**Rendering (KaTeX, always in scope)**

- When a document contains inline `$…$` math, the system shall render it as typeset math inline with the
  surrounding text.
- When a document contains block `$$…$$` math, the system shall render it as typeset math on its own line.
- When a document contains a ` ```math ` fenced code block, the system shall render its contents as
  typeset block math.
- When a document contains no math syntax, the system shall not load the math rendering engine.
- While the math engine is loading, the system shall keep the document's text readable and the reader
  interactive, and shall not displace the reader's current reading position when a formula resolves.
- If a formula fails to parse, render, or sanitize, then the system shall leave that formula as its raw
  source text with an inline marker, and shall render every other formula in the document normally.
- If the math engine cannot be loaded at all, then the system shall render the document with every
  formula left as raw source text, and shall never blank the page.
- When a document is rendered on the content-script reader, the system shall leave math syntax as literal
  text and shall present no math affordance and no explanation there (§3.2).

**MathJax fallback — CONTINGENT on §3.1/§3.4/§9-1's own measured ruling; struck to "N/A" if the
dependency-set ruling excludes it**

- When the MathJax fallback is enabled (§9-3 resolves what "enabled" triggers), the system shall render
  math through MathJax for whichever formulas the gate-1-ruled trigger semantics name, achieving full
  LaTeX coverage KaTeX's own subset does not.
- If MathJax cannot be loaded, then the system shall fall back to KaTeX's own rendering (or raw source, if
  KaTeX itself also cannot render the formula), never a blank formula.

**Copy actions**

- When a rendered formula is hovered or focused, the system shall offer copy-as-LaTeX and copy-as-MathML
  for that formula.
- When the user copies a formula as LaTeX, the system shall copy the exact source LaTeX as authored.
- When the user copies a formula as MathML, the system shall copy a valid MathML representation of the
  rendered formula.
- If a copy action fails, then the system shall say so and shall not report success for a copy that did
  not occur.
- The system shall reach every math action by keyboard, and shall add no new global single-key shortcut,
  and shall never present these actions as a browser right-click context menu (§3.10).

**Trust**

- The system shall make **no network request** while loading the math engine(s), rendering, re-theming
  (if math has theme-dependent styling), or copying a formula — proven at the request level on both
  engines, non-vacuously (§5), including a control that would catch a remote font/asset request
  specifically (§3.7).
- The system shall keep the built manifest at `permissions: []` on both engines, with no
  `web_accessible_resources` and no other forbidden key.
- The system shall render no math content that references a remote resource, whether the reference
  originates in the document source or in the engine's own output (§3.5).

**Degradation**

- If any part of math rendering fails, then the system shall keep the document readable and never blank
  the page (AGENTS.md #5).

## 5. Non-functional requirements

- **First paint, documents WITHOUT math:** shall not regress the current typical-doc gate (`progress.md`'s
  own standing baseline). Math enhancement is post-mount (§3.3), so a document with no math syntax loads
  no math engine and pays nothing.
- **First paint, documents WITH math:** the same gate applies, because §3.3 puts the engine after the
  commit — a math-bearing document that misses the text-paint gate means the enhancement is not actually
  post-paint, a defect, not a budget.
- **Bytes — THE MILESTONE'S BINDING CONSTRAINT (§3.4):** KaTeX's (and, contingently, MathJax's) `.output`
  and `pnpm zip` deltas measured against the current baselines — `.output` **4,881,579 / 4,881,695 B**,
  `pnpm zip` **1,474,790 / 1,474,848 B** (`progress.md`, task 10.4 close) — and decomposed to a fully
  accounted residual, never grep-proven. **This is §3.4's own measurement, repeated here as the binding
  NFR** (010's own correction: a pass/fail budget check belongs in §5/§7, not §8).
- **Dependencies:** one addition certain (KaTeX), one contingent on the byte measurement (MathJax) —
  §3.8, each a governed act. **If the sanitizer-profile work (§3.5) or the copy-as-MathML mechanism (§3.10)
  needs a third package, that is priced explicitly when it is decided, not folded in silently.**
- **Manifest pin:** `permissions: []` re-proven on both built manifests; `tests/manifest.test.ts` green.
  `web_accessible_resources` remains a forbidden key — expected and unremarkable if either math engine
  needs it to lazy-load on the app page the way `mermaid`/`shiki` do (007/009's own precedent); a hard
  stop if it is needed to reach the content-script graph (§3.2).
- **Golden pin: ★ NOT byte-identical this milestone, by construction — a real difference from M10.** §3.3
  states why: a new markdown-it parse-time rule for `$…$`/`$$…$$` changes `sanitize(parse(source))`'s own
  output for any document containing that syntax. **New golden fixtures are expected to be added and to
  differ from today's rendering; existing fixtures containing a literal, non-math `$` character must be
  individually audited** for accidental syntax collision (§7) — an unintentional diff there is a real
  regression, not noise to wave through because "math changed golden this time."
- **CSS discipline:** any math-styling rationale lives in TypeScript doc comments, never inside a CSS
  template literal (the standing M6 retro finding 9 — this would be a further site alongside
  `readerCss.ts`, `appShell.ts`'s `APP_CSS`, and 007's/009's own diagram/code styling sites).
- **a11y — a real F12 intersection, not a checkbox.** Every rendered formula carries a genuine accessible
  representation usable by assistive technology, not a purely visual glyph rendering with nothing for a
  screen reader to read — the specific mechanism (a MathML annotation embedded in KaTeX's own output, an
  `aria-label` carrying the LaTeX source, or something else current KaTeX/MathJax docs recommend) is
  `plan.md`'s to verify against the actual package (§3.8's standing rule), not this draft's to assume.
  Every math action (copy-as-LaTeX/MathML) is keyboard-reachable and focus-visible; no state is conveyed
  by colour alone; all transitions are instant under `prefers-reduced-motion`.
- **Sanitization (AGENTS.md #3):** the document profile is unchanged; the engine's output is sanitized
  through the §3.5 math-shaped profile before it touches the live DOM.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines with a positive control
  that fires under the same conditions the negative claim disclaims (the standing M6 retro finding 1
  lesson) — including, specifically, a control able to catch the KaTeX-font-self-hosting trap named at
  §3.7, not only a generic "no fetch" assertion.

## 6. Out of scope (explicit)

- **Additional math/diagram engines (Graphviz DOT, Vega/Vega-Lite, PlantUML)** — F2's own post-v1 stretch
  clause, unchanged since 007 §6 first deferred it for the diagram half. Home: unchanged, post-v1.
- **Auto dark-mode image adaptation** (F2's other ⭐ item) — unrelated to math, still ✗, untouched by this
  milestone. Home: a media/theming pass (007 §6's own deferral, restated).
- **DOCX math / OMML export.** `specs/010-local-exports/spec.md` deferred DOCX export out of M10 entirely
  (§3.10 gate ruling), with its own revisit-when stated as *"paired with §9-1's own revisit-when — F2
  math shipping first."* **This milestone SATISFIES that precondition by shipping F2 math — it does NOT
  itself re-open DOCX export.** DOCX export's own return (with or without OMML math handling) is a future
  milestone's scope decision, made with M11's shipped math in hand, not a line item here.
- **Equation editing or authoring** (F8) — Editor Mode does not exist; math rendering operates on the
  reader's already-rendered document, never a draft.
- **The content-script `file://` / raw-host reader's math reach** (§3.2) — no math affordance, no
  explanatory note, ships there in M11. Home: a future milestone that reconsiders that surface's
  capability set, the same shape 007/010 both left for their own app-page-only features.
- **A persistent math-render cache** (§3.6) — leaned against, not decided against; revisit if `plan.md`'s
  own timing measurement shows a real need.
- **Equation numbering, cross-reference linking to numbered equations, or LaTeX macro/package support
  beyond what KaTeX's (and, contingently, MathJax's) own default configuration provides** — none of this
  is named anywhere in F2's text, and none is assumed here.
- **A settings surface for math rendering beyond the single contingent "MathJax fallback" key** (§3.11)
  — no per-formula configuration, no per-document math preference.
- **The MathJax fallback in full, if §9-1's measured ruling excludes it** (§3.1, §3.4) — the milestone's
  own pre-stated fallback scope, named so a scope reduction here (if it happens) is recognized as this
  spec's own anticipated outcome, not a fourth surprise the way M10's reductions read in sequence.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **★ THE BYTE MEASUREMENT ITSELF, BEFORE ANYTHING ELSE — the milestone's first move, on the 009/010
   precedent.** Install KaTeX for real (and, separately, MathJax) against the current ~352.8/352.7 KiB
   `.output` and ~607.8/607.7 KiB zip headroom (§3.4); measure and decompose each to a residual, the same
   D-11 four-component ablation shape M10 task 1.1 used for `docx`+`client-zip`. This is task 1.1's own
   job, not this spec's to pre-guess — but it is named first here because §3.1/§3.4/§9-1 all depend on it,
   and it must run **before** any rendering code is written, the same order 007's own Group 1 used for
   Mermaid.
2. **A markdown-it plugin/rule for `$…$`/`$$…$$` recognition — verify the current landscape before
   choosing or writing one.** AGENTS.md's standing rule (verify against current docs, don't assume from
   training knowledge) applies with the same force here it did to `markdown-it-task-lists`'s own
   selection. Confirm a maintained plugin exists and fits the sanitizer-safe-passthrough shape §3.3
   describes, or that a small hand-written rule is the more defensible choice — either way, name the
   choice and its rationale, not assume one from memory.
3. **KaTeX's (and MathJax's, if it ships) actual output shape — MathML annotation, HTML-only, or
   configurable — determines both §3.5's sanitizer-profile enumeration and §5's accessibility mechanism.**
   Verify against the currently-installed package's own docs (not training knowledge, which may describe
   a stale default) before writing either the allow-list or the a11y plan.
4. **The KaTeX self-hosted-fonts trap (§3.7), concretely.** Confirm the actual integration path bundles
   font/CSS assets as local extension resources rather than referencing a CDN, and prove it with a
   network control that would catch exactly this class of remote request — a generic "no XHR for formula
   data" test would not catch a stylesheet's own remote `@font-face` reference.
5. **Existing golden fixtures containing a literal `$` character — audit for accidental math-syntax
   collision before the new parse rule lands (§3.3, §5).** A document with a price (`$5`) or a shell
   variable reference in a code span could newly match an inline-math pattern; confirm the chosen
   delimiter-recognition rule's own escaping/context rules (e.g., not matching inside existing code
   spans/fences, per CommonMark math extension conventions) before accepting any golden diff as expected
   rather than a false-positive match.
6. **Whether the math-shaped sanitizer profile (§3.5) can share any enumeration machinery with the
   existing SVG profile, or needs to be fully independent data.** Not a byte concern at this scale, but a
   reviewability concern — `sanitize.ts`'s own discipline (arrays as data, reviewable in one place) should
   extend cleanly rather than accumulate a third ad hoc shape if a fourth enhancer ever needs one.
7. **Copy-as-MathML's actual mechanism.** If KaTeX's own output already embeds a MathML annotation
   (§3.5/§7-3), copy-as-MathML may be "extract the existing annotation node," not a new conversion step —
   confirm this before assuming a MathML-generation library is needed at all, which would be an
   unbudgeted dependency §3.8 does not anticipate.
8. **The sibling-checklist audit, owed BEFORE the first math-chrome test is written** (M6 retro finding 4,
   restated at every milestone since). 011 adds a new class of rendered content and a new per-formula
   control group; enumerate the property set from every existing sibling suite — `diagramEnhancer`/
   `diagramView` (the closest analogue: a post-mount block enhancement with its own hover/focus control
   group and its own sanitizer profile), `codeEnhancer`, `tableEnhancer` — and record each property
   present/absent/explicitly out-of-scope.
9. **Design translation.** No mockup for math chrome (the per-formula copy-control group, any inline
   error marker styling) is known to exist at this draft's evidence base, the same gap 007 §7-10 and 010
   §7-7 both named for their own milestones. `plan.md` should confirm whether one exists or needs
   producing, verify every token against `readerCss.ts` before use, and never substitute a nearby token
   silently.

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from
measurements a measurement task produced and is **forbidden from choosing** from.*

1. **The dependency-set fork itself (§3.1, §3.4, §9-1).** **Axes:** does KaTeX alone fit the current
   headroom comfortably · does KaTeX + a MathJax fallback chunk both fit · does either need a
   subset/lazy-split strategy to fit at all. **What the plan measures:** installed-package `.output`/zip
   deltas for each dependency, individually and combined, the same D-11 ablation shape M10 task 1.1 used.
   **This is the milestone's own D-1-shaped hard gate, named up front rather than discovered at task
   1.1.**
2. **Whether a math-render cache is warranted (§3.6).** **Axes:** measured KaTeX/MathJax render wall-clock
   across a representative formula corpus (count, complexity) · whether a watched math-heavy document's
   reopen/re-render cost is noticeable without one. **What the plan measures:** timing across 1/10/50-ish
   formula documents, median and floor, the same shape 007 §8-2 used for diagram counts. **No cache is
   built until this measurement justifies one.**
3. **Any inline-error-marker and per-formula control-group visual design**, once §7-9's design-translation
   gap is resolved. **Axes:** what an inline math parse-failure marker actually says and looks like ·
   hover/focus control-group placement relative to inline vs. block formulas. **What the plan measures:**
   a walk against a representative math-bearing document, the same shape 007/010's own "design
   translation" risk used.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled in
as defaults.*

1. **★ THE MATH-RENDER DEPENDENCY SET — full KaTeX + MathJax fallback, or KaTeX-only — ruled from task
   1.1's own measurement (§3.1, §3.4, §8-1), FORBIDDEN FROM BEING ASSUMED HERE.** This draft states the
   full intended scope (both engines) and a pre-stated fallback (KaTeX-only) so gate 1 approves scope
   knowing the byte risk explicitly, rather than a plan-stage session discovering it as an unplanned
   scope-reduction gate the way M10's DOCX/ZIP/progress-indicator reductions each were. **No
   recommendation is given** — the measurement has not run; recommending an outcome ahead of the number
   would be exactly the "chosen instead of measured" defect the D-8 pattern exists to prevent.
2. **The content-script surface disposition (§3.2) — is app-page-only acceptable as the shape of this
   milestone's math delivery?** §3.2's reasons (manifest, and now a materially thinner byte margin than
   007 had) are stronger than 007's own version of this same call, not weaker — but stated as gate 1's to
   confirm or overturn, the same shape 007 §3.4/§9-1 gave the standalone-files question, priced (above)
   rather than assumed. **Recommendation: confirm app-page-only**, on the reasoning in §3.2 — the margin
   argument alone would likely be dispositive even if 007's manifest argument were somehow not reused.
3. **The math-shaped sanitizer profile's disposition (§3.5) — confirm the SVG-profile-precedent shape
   (a second, distinct, math-specific allow-list; document profile untouched) as the approach, before
   `plan.md` spends effort enumerating its exact tag/attribute contents.** **Recommendation: confirm**,
   on 007 §3.5's own settled reasoning, which this spec finds no reason to depart from for a different
   generated-markup shape.
4. **If the MathJax fallback ships at all (per decision 1), what does "the toggle" actually toggle (§3.11)?**
   **Two live options: (a) a binary global preference — while enabled, EVERY formula renders through
   MathJax instead of KaTeX; or (b) an automatic-fallback trigger — MathJax is invoked only for the
   specific formulas KaTeX's own parser rejects, with the toggle instead controlling whether that
   automatic fallback is attempted at all (vs. showing raw source on a KaTeX failure).** These have
   materially different costs: (a) means every math-heavy document pays MathJax's own (likely slower)
   render cost whenever the toggle is on; (b) means MathJax is invoked rarely, only on genuine KaTeX
   syntax gaps, at the cost of a more complex per-formula fallback-detection path. **No recommendation
   given** — this is a product-feel call about what "full LaTeX coverage" is supposed to mean to a user
   who flips the toggle, which this draft has no basis to make alone. **Moot if decision 1 excludes
   MathJax from M11 entirely.**

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next
artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above
against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation
code before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is
verified **revert-and-fail**, red with the defect's own signature in the defect's own units (M6 retro
finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf number
is **A-B-A with the floor beside the median** (finding 7); the close gate **records its viewport(s)** the
way it records its engines, and walks at least one WIDE viewport because this milestone ships new chrome
(finding 2); bundle-affecting tasks measure `pnpm build` + `pnpm zip` + `.output` size as a mandatory
Verify step, not an optional one (009's own 4.3 finding); browser-suite assertions about shared
cross-file state are delta- or specific-content-based, never absolute or pristine-state-assuming
(AGENTS.md's harness-shared-state rule, placed 2026-09-06 at the M10→M11 seam)._
