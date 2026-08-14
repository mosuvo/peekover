# Spec 009 — Code Blocks: Shiki syntax highlighting, code themes, and the per-block toolbar

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **009 delivers M9 — F3 (Code Blocks) in full.** Shiki syntax highlighting on fenced code blocks, ≥14 code themes independent of the document theme, a per-block toolbar (copy / line numbers / line highlighting / word wrap), collapsible long blocks with a per-block "open raw" view — all four **done-whole, unconditional** — and language auto-detection for unlabeled fences, scoped **in** but **cost-measured-then-ruled**. `docs/ai/decisions.md` 2026-07-27 (M7 DIRECTION) named persona-#2 unlock as *"queued for M8 or M9"*; M8 went to persona-#1 QoL instead (spec 008 §6, §9-1, both naming Shiki/F3 explicitly as the deferred M9 item). **009 is that queued unlock**, landing on F3 — the only section at a flat **0%** in `spec-coverage.md` and the Developer persona's own headline row (product spec §3: *"Instant render, GitHub-identical theme, TOC, code highlighting"*). This spec is the WHAT, and it does not re-argue the direction.
**Date:** 2026-08-14
**Milestone:** M9 · builds on 008 (persona-#1 QoL: compare-two-files, agent-file awareness, table tools — **CLOSED 2026-08-13** at task 6.3)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 008's section shape, which itself mirrors 007's — §3 decided calls, §4 EARS, §6 the IS-NOT fence, §7 plan-stage risks, §8 gate-3 measure-then-choose, §9 gate-1 questions. §3's architectural calls below are stated as decided-call prose, with no `D-N` cross-reference labels — matching 007's and 008's own `spec.md` style: **neither assigns its own `D-N` numbers** — every `D-N` either of them cites is a *prior* milestone's banked decision (`006 D-15`, `007 D-7`, `007 D-11`, …), and the actual `D-1`…`D-12` sequence governing a milestone's own architecture is `plan.md`'s convention, confirmed live only where `decisions.md` entries land with an implementing commit (e.g. 008's D-1/D-2 at task 1.4). **The draft this spec was built from carried informal `D-A`…`D-D` placeholders here; gate 1 struck them (2026-08-14 M9 GATE 1, ruling 2) as premature spec-stage numbering** — the constraints they named are unchanged, `plan.md` assigns the real D-numbers.
**Evidence base:** unlike 006/007/008, this draft did **not** run its own scope-read of the tree. Those three specs each opened with a fresh read of the actual code and grounded their §3 calls in specific `file:line` citations found *during* drafting; 009's scope and sizing were **settled before this drafting session**, in a reviewer-and-human pass over the kickoff's own substance. This spec's job is to give that already-settled substance 008's shape, not to re-derive it. Where a citation appears below it is a light confirmatory check made while drafting (`src/render/` module list, `settings.ts`'s current shape, `parse.ts`'s absence of any `shiki` string, `diagramImportFence.test.ts`'s four-clause structure) — **not a scope-read**, and `plan.md` must re-derive every one against the actual tree at its own HEAD, with more force than usual since this draft's citations were spot checks, not a systematic pass. Content source: `docs/product/spec.md` §3 (persona table), §5 F3, §7 principle 4, §8 (NFR table), §10 (tech-stack table), quoted where scope must match promise rather than a paraphrase of it. Numbers source: `docs/ai/spec-coverage.md` (F3 row `122`, detail `222-236`) and `docs/ai/progress.md` § Now / § Baselines (M8's close figures, confirmed at HEAD `6afbe6e`).

---

## 1. Problem & value

Six milestones have now landed almost entirely inside persona #1's column. Persona #2 — the developer reading READMEs and docs, on `file://` and eventually on raw Git URLs — sits at roughly 5% coverage, and the single largest hole in that column is not a hole at all: it is a **flat zero**. `spec-coverage.md` (row 122, detail 222-236) is blunt about it: *"F3 is the only section at a flat 0%"*, and the only string matching `shiki` anywhere in `src/` is a comment in a test file that isn't testing it. Every fenced code block Peekover renders today — including every one an AI agent writes into the specs and plans this product already reads beautifully — comes out as an unstyled, unhighlighted `<pre><code>`.

That is this persona's own headline promise, unmet. Product spec §3 names *"code highlighting"* as one of four killer features for the Developer persona, alongside instant render, GitHub-identical theme, and TOC — three of which already ship. §5 F3 promises Shiki at 190+ languages (*"beats MarkView's 180+"*), ≥14 themes independent of the document theme, a real toolbar, and a ⭐ differentiator no named competitor has: collapsible long blocks with a per-block raw view.

**Who it serves:** the Developer persona (product spec §3) primarily — the first milestone since 007 to move a persona other than #1. Secondarily every persona reading a document with code in it, since a fenced block is not persona-specific once it exists. **What this milestone does *not* serve:** the rest of that persona's row — *"instant render, GitHub-identical theme, TOC"* already ship, and *"raw Git URL"* rendering is F4, explicitly out (§6).

**What the product promises** (`docs/product/spec.md` §5, quoted so scope matches the promise, not a paraphrase of it):

- F3: *"Syntax highlighting, 190+ languages (Shiki) — beats MarkView's 180+"*
- F3: *"Multiple code themes (≥14), independent of document theme"*
- F3: *"One-click copy button, line numbers (toggle), line highlighting, word wrap toggle"*
- F3: *"Language auto-detection for unlabeled fences (local model, as mdedit.ai does)"*
- F3: *"⭐ Collapsible long code blocks with preview + per-block 'open raw' view"*

## 2. User stories

- As a developer reading a README my agent wrote, I want its code fences **highlighted in a real syntax-aware theme**, so a config block doesn't look identical to a shell command.
- As a reader of a long document, I want the **code text to appear immediately**, and highlighting to fill in after — never a document that waits on its heaviest block, the same promise 007 made for diagrams.
- As someone who reads in a specific code theme (say, a high-contrast dark palette) while the document itself is in a light theme, I want the **two to be independent**, so switching one never silently switches the other.
- As a developer who wants to reuse a snippet, I want **one click to copy the raw code**, never the highlighted markup, so the paste is plain text every time.
- As a reader of a long function, I want **line numbers** I can toggle on, so I can reference "line 42" in a comment or a conversation.
- As a reader following an agent's explanation of a diff or a fix, I want the **specific lines it's talking about highlighted**, because the agent already told me which ones in the fence's own syntax.
- As a reader with a narrow viewport or a block with long lines, I want to **toggle word wrap**, instead of the block forcing me to scroll horizontally through code I can't parse a line at a time.
- As someone who opens a document with a 400-line generated file inlined as a fence, I want it to **open collapsed with a preview**, with one click to see the whole thing raw, so the block doesn't swallow the page.
- As a security-conscious user, I want all of this — highlighting, theming, the toolbar, auto-detection — to **put nothing on the wire**, and to see that claim hold without taking it on faith.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — F3 in full, from zero. Four items done-whole; one measured-then-ruled.**

IN, done-whole: Shiki highlighting on fenced code blocks (§3.5); ≥14 code themes, independent of the document theme, persisted (§3.5); the per-block toolbar — copy, line numbers, line highlighting, word wrap (§3.6); collapsible long blocks with a per-block open-raw view (§3.6). IN, but its *value* is not chosen here: language auto-detection for unlabeled fences (§3.7), whose byte cost against the ≤5 MiB package budget is measured early and a human then rules on the mechanism. OUT, each with a home in §6: F4 (remote URLs, per-origin permissions, raw-Git rendering); inline code spans; every other F-area (F8 editor, F9 export, F2 math, F5 navigation beyond what code needs); a new document-theme system; a standalone code-file viewer.

**Unlike 008, this milestone's scope did not need cutting.** 008's §3.1 found one bullet hiding two features of very different size; nothing here plays that trick — the five product-spec bullets map to five spec items at roughly the sizes the direction decision would expect, and §3.8's surface question — **DECIDED at this gate, app-page-only** — never widened into a scope question. **No split is proposed.**

**3.2 SHIKI STAYS OFF THE CONTENT-SCRIPT STATIC IMPORT GRAPH — DECIDED, on an exact precedent.**

This is 007 §3.2's own reasoning, one milestone on, for a heavier engine than Mermaid:

- **The precedent is exact, and it is named as such in the kickoff that produced this substance.** `diagramEngine.ts` is the one module in the tree naming a dynamic `import('mermaid')`, behind a static string-literal specifier `scripts/check-dynamic-imports.ts` enforces; `diagramImportFence.test.ts` proves, across four clauses (A: the content-script graph reaches neither diagram module; B: the app-page graph is the control that reaches both, so clause A is a real absence and not a broken walk; C: the chunk stays lazy — the only `mermaid` module import in the tree is the one dynamic edge; D: the traversal itself is non-vacuous, walking two real graphs), that the engine never reaches the content script by any edge. **009's fence mirrors that shape exactly**: a Shiki-equivalent module (`codeEngine.ts` or similarly named — `plan.md`'s call) is the one place naming a dynamic `import('shiki')`, and an equivalent import-fence test proves the same four clauses for it.
- **Why it must hold, and it is a harder bar than Mermaid's.** Shiki ships 190+ language grammars and ≥14 themes; 007's own account puts Mermaid's lazy chunk at **~3.3 MB** behind one `import()` (`progress.md`, group 3). Shiki's is very likely larger before any trimming — which is exactly why §3.4 and §8's M-1 measure it early rather than assume it fits. A content script cannot load a separate packaged chunk without `web_accessible_resources`, which `tests/manifest.test.ts` forbids outright as a capability escalation (007 §3.2's same finding) — so the fence is not a style preference, it is the only way `permissions: []` and a lazy chunk coexist.
- **The <165 ms gate is what this buys**, together with §3.3: a document with code fences on the content-script `file://` surface does not pay Shiki's weight at all — §3.8 decides that surface renders plain code, unhighlighted, so the question of paying it *before* paint there never arises.

*Rejected:* folding the engine into the content-script bundle (puts 190+ language grammars on the gated first-paint path of every `file://` document, code fences or not — the exact outcome 007 §3.2 called unacceptable for Mermaid, and 009's engine is larger).

**3.3 PROGRESSIVE FIRST PAINT, AND FAILURE DEGRADES TO PLAIN READABLE CODE — DECIDED.**

Product spec §7 principle 4: *"Skeleton-free: first paint of real content <165ms; progressive enhancement for heavy blocks."* 007 §3.3 built this discipline for diagrams; 009 reuses it rather than reinventing it:

- **Code paints instantly, as plain readable text — exactly what ships today.** Highlighting is a **post-mount enhancement**, not a pipeline stage: the fence commits through the existing `sanitize(parse(source))` → `mount()` path unchanged, and Shiki tokenizes the already-committed `pre > code` afterward, the same seam 007 §3.3 used for `pre > code.language-mermaid`. **`mount()` stays read-only library** (006 D-15) — the enhancement runs after `mount()` returns, never inside it.
- **The <165 ms gate holds WITHOUT waiting for Shiki**, on documents with code fences exactly as it does on documents without them, because the engine is never on the paint path (§3.2).
- **Failure degrades to plain code, never blank, never broken (AGENTS.md #5).** Three shapes, the same one 007 §3.8 used for diagrams: the engine fails to load (chunk unavailable) → every fence stays plain readable code, exactly as it renders today; a specific block fails to tokenize or theme → that block stays plain, every other block on the page highlights normally; the theme itself fails to apply → the block falls back to the reader's default presentation rather than an unstyled flash.

*Rejected:* highlighting during `parse` or `sanitize` (couples a 190+-language engine to the text pipeline and blocks first paint on every code-bearing document — 007 §3.3's identical rejection, for the identical reason).

**3.4 THE BYTE BUDGET — THE FRAMING IS DECIDED HERE; THE NUMBER IS NOT.**

The ≤5 MiB package base (product spec §8) is the binding constraint, and this is the biggest single addition since Mermaid — very possibly bigger. **What is decided:** every byte is measured and accounted, ablation-proven rather than grep-proven (the standing lesson: an identifier grep over a minified bundle returns 0 whether or not the code shipped), against **HEAD's current baselines** — content script **329,233 B**, app-page chunk **399,646 B**, `pnpm zip` **1,306,513 / 1,306,571 B** (Chrome/Firefox, `progress.md` § Now, M8's close), both **well inside** the `<2 MB` store bound 007/008 cite and the product spec's `≤5 MiB` base. **What is not decided here:** whether 190+ languages ship as one chunk, whether languages are grouped/split, and what auto-detection (§3.7) costs on top. **That is §8's M-1**, and it is measured *before* any of §3.4's headroom is spent on §3.7's mechanism.

**3.5 SYNTAX HIGHLIGHTING AND CODE THEMES ARE IN, DONE-WHOLE — DECIDED.**

- Shiki highlights every fenced code block whose language is known — either from the fence's own info string (` ```js `) or, once §3.7 is ruled, detected. 190+ languages, matching the product-spec promise literally.
- **≥14 built-in Shiki themes ship as a FLOOR, not a curated-from-scratch design task.** The kickoff is explicit that this is drawn from Shiki's own bundled theme set, not hand-designed — a scope statement worth preserving verbatim, because 008 §7-10 and 007 §7-10's own "design translation" risk exists precisely to stop a milestone quietly becoming a design project mid-implementation.
- **Code theme selection is INDEPENDENT of the document theme (light/dark/sepia, `settings.ts`'s `theme` key) and PERSISTED.** Concretely, this is **one new key added to the existing single global settings row** (`Settings` is `{theme, tocOpen, tocWidth}` today, `src/settings/settings.ts:30-34`) — not a new settings *surface*, not a per-document axis, and not the thing 008 §3.5 declined. 008's deferral was specifically about a *per-document-class* axis (a settings dimension keyed on which file you're reading); a global `codeTheme` key is the same shape `theme` already is. **This is a real, if small, distinction from 008's most-cited precedent, and it is named here so it isn't read as reopening that deferral.**

**3.6 THE PER-BLOCK TOOLBAR AND COLLAPSIBLE BLOCKS ARE IN, DONE-WHOLE — DECIDED.**

- **One-click COPY copies the RAW code text, never the highlighted HTML.** Shiki's output wraps tokens in spans; copying `textContent` naively risks losing exact whitespace fidelity across some tokenizer versions. The raw source is already available at enhancement time (the fence's un-highlighted text, the same text the plain-code fallback of §3.3 renders) — the toolbar's copy control reads from *that*, not by walking the highlighted DOM back to text. **This is a `plan.md`-level implementation detail with a spec-level consequence stated so it isn't discovered late:** the raw text must be retained (in a data attribute, a closure, or equivalent) alongside the highlighted markup, not derived from it after the fact.
- **LINE NUMBERS** toggle per block, off by default (a floor-inspired default pending §8's product read — see §9-2).
- **LINE HIGHLIGHTING is triggered by fence meta**, e.g. ` ```js {2,4} ` — the product-spec bullet's own shape, and precisely the case an AI agent narrating a diff or a fix would emit. The meta string is already present on the markdown-it fence token's `.info` field at parse time; **reading it is not a parser change** (AGENTS.md's one-parser rule, and the exact tension 008 §3.5 named for its own item) as long as the *highlighting behavior* stays a post-mount read of that already-parsed info string rather than a new parse-time feature. `plan.md` confirms this placement (§7-2).
- **WORD-WRAP toggles per block.**
- **Collapsible long code blocks** — the ⭐ differentiator, no named competitor in the product spec's own comparisons has it — show a preview with a per-block **"open raw" view** for the full block. The threshold at which a block collapses by default is a walk-gate judgement (§8-2's M-4 sibling; **held open here rather than asserted from prose**, the same M1 standing rule 008 §9-1 cites for a different number).

**3.7 LANGUAGE AUTO-DETECTION IS IN, BUT ITS MECHANISM IS COST-MEASURED-THEN-RULED — DECIDED (the D-8 measure-then-choose pattern, applied to a mechanism rather than a value).**

The product spec's own example — *"local model, as mdedit.ai does"* — names one option, not a mandate. Three mechanisms are on the table for unlabeled fences: (a) a lightweight heuristic (token/keyword shape matching); (b) a genuine local model, as the product spec's own comparison names; (c) defer — ship §3.5/§3.6 without auto-detection and label-only fences stay plain. **The axis is settled here: whichever mechanism ships, it is measured against the ≤5 MiB budget (§3.4) BEFORE it is chosen, not after.** §8's M-3 is that measurement; the human ruling that follows it is §8's own gate-3 pattern, not a spec-stage default.

**3.8 009 SHIPS TO THE APP-PAGE READER ONLY. THE CONTENT-SCRIPT `file://` READER SHOWS PLAIN CODE FENCES — DECIDED AT GATE 1 (2026-08-14 M9 GATE 1, ruling 1).**

★ **The draft seeded this as an open question routed to `plan.md` (§9-1 as drafted); gate 1 closed it at spec stage instead**, mirroring 007 §3.2's and 008 §3.3/§3.7's own precedent of deciding the analogous surface question here rather than in the plan — the draft's own seam-1 named leaving it open as 009's real departure from that precedent, and the departure is declined.

- **The content-script reader (`file://` documents opened directly) renders every code fence exactly as it does today — plain, readable, unhighlighted, no affordance, no explanatory note.** This is 007 §3.2's shipped Mermaid decision, applied to the same surface for the same reason.
- **The app-page reader gets Shiki, in full.** Highlighting, theming, the toolbar, and collapsible blocks — all of §3.5/§3.6 — mount on the app-page render path exclusively.

**Why this option and not "both surfaces" (008 §3.7's shape for table tools):** table tools ship on both surfaces because their storage/engine-byte reasons don't apply to code that stores nothing and loads nothing (008 §3.7). Shiki is the opposite case — it is an *engine*, the exact thing 008 §3.7 itself named as why table tools' logic doesn't transfer to Mermaid. Reaching the content script would need its own boundary design that still keeps Shiki off the *static* import graph there (§3.2) without becoming a `web_accessible_resources` request — real work with no forcing reason to spend it when app-page-only serves persona #1 completely and leaves persona #2's `file://` path exactly as capable as it is today (a code fence, correct and readable).

**The consequence: this decision puts a heavy highlight pass on the app-page render path — for the first time.** Every prior post-mount enhancement on that path (007's diagram render, 008's table tools and badge) cleared 008's own per-item mechanical-cheapness argument; M8's close recorded that the app page has **never had a first-paint instrument at all** (`progress.md`, D-11 (iii)'s carried hole) and that M8 did not fund one because its own reach stayed mechanically cheap. **Shiki does not clear that bar — it runs an engine on the app-page render path, which is exactly the trigger `decisions.md` 2026-08-03 M8 GATE 2 (Q4) named**: *"the next milestone that puts work on the app-page render path whose cheapness cannot be argued mechanically — anything that parses, sanitizes, reads layout, or runs an engine there — funds the first-paint harness before it ships that work."* **009 inherits that obligation.** It is named here as a decided, early milestone cost — the app-page first-paint harness (the instrument M8 deferred) is built and proven **before or as** §8's M-2 measures first paint under Shiki, mirroring how 008 task 5.1 built its own perf harness before measuring rather than measuring on faith. See §5 and §7-1.

*Rejected:* leaving §3.8 open past this gate (the draft's own proposal) — 007 and 008 both decided their analogous question at spec stage, and 009 has no architectural reason `plan.md` needs that the app-page-only choice withholds; leaving it open would also leave D-11 (iii)'s obligation undetermined, which this gate can settle from the surface choice alone.

**3.9 EVERY ITEM DEGRADES TO PLAIN, READABLE CODE — DECIDED.**

AGENTS.md #5, stated per item, the 007 §3.8 shape:

- **The engine fails to load** (chunk unavailable): every fence renders exactly as it does today — plain, readable, correct.
- **A specific block fails to tokenize, or its theme fails to resolve:** that block stays plain code; every other block on the page highlights normally.
- **The toolbar fails** (a control throws): the block stays exactly as rendered, and the failing control says so rather than silently doing nothing.
- **Auto-detection (once ruled, §3.7) fails or is inconclusive:** the fence stays plain, unhighlighted, exactly as an explicitly unlabeled fence renders today — never a wrong-language guess presented as confident.

**Never a blank page, never a removed block, never a broken toolbar left half-wired.**

**3.10 SHIKI IS THE SIXTH RUNTIME DEPENDENCY, AND IT IS A GOVERNED ACT — DECIDED.**

Five production dependencies exist today (`diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`). `shiki` is the sixth, on the same process 007 §3.12 used for the fifth:

- **Its transitive tree is enumerated, licence-checked as permissive, and appears in the generated SBOM.** `pnpm audit --prod` stays a **blocking** gate at 0 advisories (`decisions.md` 2026-07-27 (a)) — the standing rule 007 §3.12 states outright: *"the production tree is clean at 0, and blocking is what that cleanliness buys."*
- **No install scripts.**
- **Verified against the package itself, not from memory** (AGENTS.md's standing rule) — including, specifically, **whether Shiki's default grammar/regex engine requires WASM**, because historically some versions of Shiki's engine bundled an Oniguruma WASM regex engine and others shipped a pure-JS alternative. If the shipped configuration needs WASM instantiation, that is a question for the manifest's Content-Security-Policy (`wasm-unsafe-eval` or equivalent) — an AGENTS.md #4 event if it requires anything beyond what the manifest states today. **This is not resolved here; it is routed to §7 as a named risk** because 007's own dependency (`mermaid`) never raised it and there is no shipped precedent in this codebase to inherit.

## 4. Acceptance criteria (EARS)

**Highlighting**

- When a document containing a fenced code block with a known language is rendered, the system shall replace that block's plain text with syntax-highlighted output, without altering the underlying source.
- When a document contains no code fence, the system shall not load the highlighting engine.
- While the highlighting engine is loading, the system shall keep the fence's plain text visible and the document interactive.
- If a block fails to tokenize, render, or theme, then the system shall leave that block as plain, readable code, and shall highlight every other block in the document normally.
- If the highlighting engine cannot be loaded at all, then the system shall render the document with every code fence left as plain readable text, and shall never blank the page.

**Themes**

- The system shall offer at least 14 code themes, drawn from Shiki's built-in set.
- When the user selects a code theme, the system shall apply it to every highlighted block and shall persist the choice.
- The system shall keep the code theme choice independent of the document theme: changing one shall never change the other.
- When no code theme has been chosen, the system shall apply a stated default (§8-4).

**Toolbar**

- When a code block is hovered or focused, the system shall offer copy, a line-numbers toggle, and a word-wrap toggle for that block.
- When the user copies a code block, the system shall copy the raw source text, exactly as authored, never the highlighted markup, and shall confirm that it copied.
- When a fence's info string names specific lines (e.g. `{2,4}`), the system shall visually emphasize those lines once highlighted, and shall state which lines are emphasized where a screen reader will announce it.
- When the user toggles line numbers, the system shall show or hide a numbered gutter for that block without altering the copied text.
- When the user toggles word wrap, the system shall reflow or scroll that block's lines accordingly, reversibly.
- The system shall reach every toolbar action by keyboard, and shall add no new global single-key shortcut.
- If a toolbar action fails, then the system shall say so and shall leave the code block readable.

**Collapsible blocks**

- When a code block exceeds the collapse threshold (§8-2), the system shall render it collapsed with a preview and an "open raw" control.
- When the user opens a collapsed block, the system shall show the full block, highlighted, and shall offer a way to collapse it again.
- The system shall reach expand and collapse by keyboard, and shall announce the block's expanded/collapsed state to assistive technology.

**Auto-detection** *(shape depends on §3.7's ruling; these hold regardless of which mechanism ships)*

- When a fence has no language in its info string, the system shall attempt to detect one before falling back to plain text.
- If detection is inconclusive, then the system shall leave the fence as plain, unhighlighted text, never a guessed language presented as confident.
- The system shall never make a network request to perform detection.

**Trust**

- The system shall make **no network request** for any part of loading the engine, highlighting, theming, or any toolbar action — proven at the request level on both engines, **non-vacuously** (§5).
- The system shall keep the built manifest at `permissions: []` on both engines, with no `web_accessible_resources` and no other forbidden key, **unless §3.10's WASM/CSP risk resolves to require one — in which case that is an AGENTS.md #4 event, not a silent widening.**
- The system shall add no capability row to `docs/trust/PERMISSIONS.md` beyond the settings key named in §3.5, which stores nothing new — it extends an existing disclosed row.

**Degradation**

- If any part of code-block support fails, then the system shall keep the document readable and never blank the page (AGENTS.md #5).

## 5. Non-functional requirements

- **First paint, documents WITHOUT code fences:** shall not regress the **<165 ms** typical-doc gate, measured against the current baseline (`progress.md` § Baselines, HEAD `6afbe6e`). **Measured A-B-A against a same-session HEAD control, with the FLOOR reported beside the median** (M6 retro finding 7); a floor-delta statement is owed before any re-baseline is discussed (finding 8).
- **First paint, documents WITH code fences:** the **same <165 ms gate applies**, because §3.3 puts the engine after the commit. A code-bearing document that misses the text gate means the enhancement is not actually post-paint — a defect, not a budget. **This is §8's M-2, and M-2 cannot produce a real measurement until the app-page first-paint harness exists** — §3.8 decides app-page-only, which puts Shiki (an engine) on the previously-uninstrumented app-page render path, firing D-11 (iii)'s trigger (`decisions.md` 2026-08-03 M8 GATE 2, Q4). **Building that harness is an early milestone cost, funded before M-2's measurement, not folded silently into it.**
- **Content-script bundle: byte-identical — decided, not contingent.** §3.8 decides app-page-only, so the content-script surface gains no code, no chunk, and no affordance; the fence in §3.2 is total, exactly as 007's Mermaid fence proved. (008's table-tools exception, §3.7 there, does not recur here — see §3.8's rationale.)
- **Bytes:** app-page chunk and `pnpm zip` deltas stated against the current baselines — content script **329,233 B**, app chunk **399,646 B**, `pnpm zip` **1,306,513 / 1,306,571 B** (`progress.md` § Now, confirmed at HEAD `6afbe6e`). **This is §8's M-1**, measured before any headroom is spent, decomposed to zero residual (engine, theme data, glue).
- **Dependencies:** exactly one addition — `shiki` (§3.10). If auto-detection's mechanism (§3.7, once ruled) needs a second package, that is priced explicitly at the ruling, not folded in silently.
- **Dynamic import:** the engine's lazy import shall use a **static string-literal specifier**, enforced by `scripts/check-dynamic-imports.ts` (the same rule 007 was first to exercise; 009 is the second).
- **Manifest pin:** `permissions: []` re-proven on both built manifests; `tests/manifest.test.ts` green. **`web_accessible_resources` remains a forbidden key.** ★ **The manifest's built size is 654 / 770 B** (`progress.md`, M8 close) — **not** the 2,975 B figure some earlier project material cites, which is `wc -c tests/manifest.test.ts` (the test file), not the built artifact. This distinction is stated explicitly here because a prior kickoff conflated the two (flagged for the record; see §9-5).
- **Golden pin:** `tests/golden/output/` shall stay **byte-identical** — highlighting happens after `mount()` commits, downstream of the `sanitize(parse(source))` string the suite snapshots. **An empty golden diff proves nothing about a toolbar, a theme, or a collapsed block** — structural assertions in a real engine are the guard, the same standing correction 007 and 008 both restate.
- **Sanitization (AGENTS.md #3):** the document profile is unchanged. Shiki's output is HTML generated by the bundled engine from already-sanitized fence text; whether it needs its own output profile (the 007 §3.5 SVG-profile shape) or can be composed as DOM directly (the 008 §3.6 table-tools shape, "never as an HTML string") is a `plan.md` call, named as an open risk (§7).
- **Dependencies (governance):** the sixth production dependency (§3.10) — enumerated, licence-checked, `pnpm audit --prod` blocking at 0.
- **CSS discipline:** any styling rationale lives in **TypeScript doc comments, never inside a CSS template literal** (M6 retro finding 9 — this would be the fourth such site after `readerCss.ts`, `appShell.ts`'s `APP_CSS`, and 007's diagram styling). **No `ch` unit in any layout-blocking property** (`margin`, `padding`, `transform`) in new styling; `max-width` is free (finding 6) — code blocks with monospace text are exactly the surface `ch` looks attractive for, which is precisely why this line is repeated rather than assumed carried.
- **a11y:** every toolbar control is keyboard-reachable and focus-visible; line-highlighting and expanded/collapsed state are exposed to assistive technology, not carried by color or an icon alone; every code theme meets contrast requirements against its own background, not just the document's; all transitions are instant under `prefers-reduced-motion`.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines with a **positive control that fires under the same conditions the negative claim disclaims** (M6 retro finding 1). ★ **The standing lesson applies: jsdom cannot see bytes on the wire**, and a fetch control routed through a sanitizer can read NO-FETCH while the route is wide open — the control must adopt markup no sanitizer has touched.

## 6. Out of scope (explicit)

- **Remote URLs / F4** — `http(s)://` markdown, per-origin permissions, GitHub/GitLab/Bitbucket raw-file rendering. This milestone adds **no network capability and no host permission**; `permissions: []` stays. Home: F4's own milestone.
- **Inline code spans** — `` `code` `` inline is not highlighted, themed, or toolbar'd. Only fenced code blocks are in scope. Home: not planned; the product spec's own F3 bullets are all fence-shaped, and inline highlighting is not a named promise anywhere in §5.
- **Every other F-area** — no editor (F8), no export (F9), no math (F2), no navigation beyond what code needs (F5). Home: each is its own milestone, already named in 007 §6 and 008 §6's own IS-NOT fences.
- **A new document-theme system** — code themes are a separate, code-block-only layer (§3.5). The 004 document theming (`theme`, `light`/`dark`/`sepia`) is untouched. Home: not applicable; this is a permanent boundary, not a deferral.
- **A standalone code-file viewer** — F3 is code blocks *within* markdown documents, not opening a `.js` file as a highlighted document in its own right. **007 had a standalone-files equivalent** (`.mermaid` files, §3.4 there) and decided it out with a priced overturn; **009 has no such promise to price** — no product-spec bullet names a standalone code-file viewer, so there is nothing here to overturn even in principle. Home: the product spec's own Phase 2 *"universal raw-file viewer"* (§11) is the only place this idea appears at all, and it is post-v1.
- **Auto-detection's specific mechanism** — scoped in (§3.1), but the *choice* of heuristic vs. local model vs. defer is §8's M-3, not decided here.
- **The collapse threshold** (line count, byte size, or both) — §8's M-4 sibling; not asserted from prose.
- **The default code theme** — §8's M-4; a human, walk-informed choice.
- **Line numbers on by default vs. off by default** — a candidate for §8 if gate 1 wants it walked rather than assumed (§9-2 names the default this draft assumes).
- **The content-script surface's highlighting reach.** **DECIDED (§3.8): app-page-only.** The content-script `file://` reader shows plain, unhighlighted code fences, exactly as it does today — no affordance, no explanatory note, the same shape 007 §3.2 shipped for diagrams on this surface. A named deferral, not a silence; revisit-when tracks 007's own (a future milestone that reconsiders the content-script reader's capability set).

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Funding the app-page first-paint harness that §3.8's decision now requires (D-11 (iii)).** `plan.md`'s first move on architecture should be scoping this instrument — the same one M8's close deferred (`progress.md`, D-11 (iii)'s carried hole) — because §8's M-2 cannot produce a real measurement without it, and the uninstrumented-app-page caveat 007 and 008 both carried cannot be inherited a third time now that non-mechanically-cheap work is actually landing there. Whether this reuses design work M8 scoped-but-didn't-build, or needs its own, is `plan.md`'s call against the actual tree.
2. **Whether Shiki's shipped configuration needs a WASM regex engine, and what that means for the manifest's CSP** (§3.10). Verify against Shiki's current official docs, not memory — the standing AGENTS.md rule, with more force than usual because no dependency in this tree has raised the question before. If it does need one, that is an AGENTS.md #4 event and routes to a human before implementation, not during.
3. **Where fence-meta (line-highlighting's `{2,4}` syntax) is read from, and whether reading it stays clear of the one-parser rule.** §3.6 states the intent — read the already-parsed `.info` field post-mount, not a new parse-time feature — but the concrete seam (does the enhancer receive the info string, or does it re-derive it from the DOM?) is `plan.md`'s call, on the same discipline 007 §3.3 used for `pre > code.language-mermaid`.
4. **Whether Shiki's HTML output needs its own sanitizer profile** (007 §3.5's SVG-profile shape) or can be composed as DOM directly without ever producing an HTML string (008 §3.6's table-tools shape). Shiki's output is simpler than Mermaid's SVG (spans and classes, not arbitrary markup with external references), which suggests the lighter path, but AGENTS.md #3 requires this be verified, not assumed.
5. **How the raw-copy text is retained alongside the highlighted markup** (§3.6) without duplicating the full source in the DOM for every block, and whether this changes what `mount()`'s enhancement seam needs to carry forward across a watch-mode re-render (the same "does state survive `replaceChildren`" question 008 §7-4 asked for table sort/filter state, now asked for toolbar state — line numbers on, word-wrap on, a block expanded).
6. **Whether the per-code-block toolbar and Shiki's tokenization are one enhancement or two**, and what that means for the call-site duplication question 008 §7-9 settled for its own two chromes (D-6: no shared post-mount enhancement seam, hardened duplication into policy, the fence being worth more than the DRY). **009 very likely inherits that same ruling** rather than re-litigating it — named here so it is confirmed, not silently assumed.
7. **The package-size boundary if M-1's measurement lands close to the ≤5 MiB budget** — the 007 §8-3 precedent: a subset build (fewer bundled languages/themes at the base, more via a further lazy split) becomes gate-3 material if the full 190+/≥14 set doesn't fit. No byte figure is asserted here.
8. **The sibling-checklist audit, owed BEFORE the first code-block-toolbar test is written** (M6 retro finding 4, restated at 007 §7-8 and 008 §7-7 — *"the single most valuable mechanical item M6 produced"*). 009 adds chrome inside the reading column for the first time since 008's table toolbar. Enumerate the property set from every existing sibling suite — `tableEnhancer`, `diagramEnhancer`, `diffChrome`, `themeControl`, `watchControl` — and record each property present/absent/explicitly out-of-scope.
9. **Design translation.** No mockup for code blocks is known to exist yet at this draft's evidence base (unlike 007/008, which both had `design/mockup.html` predating them) — `plan.md` should confirm whether one exists or needs producing, verify every token against `readerCss.ts` before use, and never substitute a nearby token silently (004's sepia-deferral lesson, restated every milestone since).

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from measurements a measurement task produced and is **forbidden from choosing** from.* ★ **A seam worth flagging: the kickoff substance labels four items `§M-1`…`§M-4` as one "measurement plan." Only two of them (M-3, M-4 below) are actually gate-3 measure-then-choose items in 007/008's sense — a human picking a VALUE from measured axes. M-1 and M-2 are pass/fail measurements against an already-fixed gate (the ≤5 MiB budget, the <165 ms first-paint gate), which 007/008 both place in §5 (NFRs) and §7 (risks), not §8. They are cross-referenced here so the mapping is traceable, not hidden.**

- **M-1 (byte cost)** — placed at §5's Bytes NFR and §7-7. Not a §8 item: there is no value to choose, only a bound to meet or, per §7-7, a scope-reduction to price if it doesn't.
- **M-2 (first-paint under Shiki)** — placed at §5's First-paint NFRs. Not a §8 item, for the same reason.

1. **M-3: auto-detection's mechanism (§3.7).** **Axes:** byte cost against the M-1 headroom · detection accuracy on a representative unlabeled-fence corpus · latency added before a fence resolves. **What the plan measures:** the three named options (heuristic / local model / defer) priced against those axes. **The rule is set here and the value is not:** if none of the paid options fits inside M-1's headroom, defer is the floor — the mechanism gives way, not the package budget (the same shape as 008 §8-1's "the surface reach gives way, not the gate").
2. **M-4: the default code theme, and how code-theme-vs-document-theme independence surfaces in the UI.** §3.5 decides the *rule* (independent, persisted, ≥14 themes as a floor). **What the plan measures:** which theme reads best against the demo document and the repo's own golden fixtures, walk-informed, the same shape 008 §8-4 used for its presentation-default set.
3. **The collapse threshold** (§3.6, §6). **Axes:** line count · byte size · whether the block contains line-highlighting meta (a highlighted block arguably should not auto-collapse past its highlighted lines). **What the plan measures:** the distribution of fenced-block sizes across this repository's own documents and the golden fixtures — the same corpus 008 §8-3 used for its own table-threshold question.
4. **Line numbers' default state** (on/off) and **word-wrap's default state** — small, but named here rather than defaulted into, on the same "an always-on answer is legitimate; it must be chosen, not defaulted into" principle 008 §8-3 states.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled in as defaults.*

1. ~~Does §3.8 (D-D) stay open for `plan.md`, or does gate 1 decide it now?~~ **ANSWERED AT GATE 1 (2026-08-14): decided now — APP-PAGE-ONLY, not routed to `plan.md`.** The draft's own recommendation ("let it stay open") was not taken: mirroring 007 (§3.2) and 008 (§3.3/§3.7), both of which decided their analogous surface question at spec stage, gate 1 declined to let 009 be the first of the three to leave it open past this gate. §3.8 now carries the decision and its consequence — the D-11 (iii) app-page first-paint-harness obligation, named as an early milestone cost (§3.8, §5, §7-1).
2. **Do line numbers and word-wrap default ON or OFF?** §4's EARS criteria are written default-agnostic; §8-4 names this as a walk-gate item. If gate 1 has a strong intuition (most competitors default line numbers off, word-wrap off, per the product spec's own competitive framing implicit in F3's bullets), stating it here saves a §8 cycle. **No recommendation given** — this is a product-feel call this draft has no basis to make.
3. ~~Does §3.10's dependency-governance framing (licence check, SBOM, blocking `pnpm audit --prod`, no install scripts) apply in full, exactly as 007 §3.12 stated it for `mermaid`?~~ **ANSWERED AT GATE 1: YES, confirmed IN, unchanged.** §3.10 stands as drafted, mirroring 007 §3.12's treatment of the fifth dependency exactly, for the sixth — product spec §6 item 9 (locked minimal deps, SBOM per release, `pnpm audit`, Dependabot) requires it regardless of what the kickoff named explicitly. `shiki` moves the dependency count **5 → 6** as a governed event when it is installed at implementation; deps stay **5** through this approval.
4. **Is a `codeTheme` settings key genuinely inside 008 §3.5's boundary, or does gate 1 read it differently?** §3.5 above argues it is (a new *global* key, the same shape `theme`/`tocOpen`/`tocWidth` already are, not a per-document-class axis). This is this draft's own reasoning, not something the kickoff substance stated explicitly, so it is surfaced for confirmation rather than assumed settled.
5. **The manifest-size citation correction (§5).** An earlier kickoff for a different milestone conflated the built manifest (654/770 B) with `tests/manifest.test.ts`'s own byte count (2,975 B, i.e. `wc -c` of the test file). This draft states the distinction explicitly in §5 rather than repeating the conflation. **No action needed from gate 1** — recorded so the correction is visible in the artifact of record, not only in a session transcript.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is verified **revert-and-fail**, red with the defect's own signature in the defect's own units (M6 retro finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf number is **A-B-A with the floor beside the median** (finding 7); the close gate **records its viewport(s)** the way it records its engines, and walks at least one WIDE viewport because this milestone ships chrome inside the reading column (finding 2)._
