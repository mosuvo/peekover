# Spec coverage audit — post-M7, pre-M8

*Audited 2026-07-27 · HEAD `d7f424c` ("Add 006 gate"; the M6 retro is its parent, `664952f`).*
***Re-audited 2026-07-27 · HEAD `d470ab2`** ("ci(security): close the §6-4 / §6-9 release-engineering
gap"). **Targeted re-verification of §6-4 and §6-9 ONLY** — those two items scored PARTIAL for one shared
reason ("ci.yml has no such check"), and `d470ab2` landed the CI that reason named. No other item was
re-verified: nothing between `d7f424c` and `d470ab2` touched `src/`, and the answer only changed for §6.*

***★ RE-AUDITED 2026-08-03 · HEAD `59dcb20`** (M7 / spec 007 closed and reconciled). **Targeted
re-verification of F2 "Math & Diagrams" ONLY**, plus the three figures M7 falsified elsewhere: §7-6's
"re-themed diagrams" sub-surface, the runtime **dependency count (4 → 5)**, and the §10 layer tally.
**No other section was re-scored** — §6 and §7's status columns, and F1/F3–F12's rows, are the
`d470ab2` and `d7f424c` readings unchanged, and any figure derived from them (below) is marked where
it is now stale. **This is a new dated audit, not a revision of the old one:** the 2026-07-27 numbers
were true on 2026-07-27, and § Blockers in `progress.md` still cites them correctly as a dated record.*

***★ RE-AUDITED 2026-08-13 · HEAD `bdcb2ad`** (M8 / spec 008 "persona-#1 QoL" closed at task 6.3, the
records reconcile). **Targeted re-verification of the SIX rows M8's own scope could plausibly move —
three in F5 (table tools), three in F6 (agent-file awareness, compare) — against shipped code and its
tests. No other section was re-scored:** F1–F4, F7–F12 and F5/F6's other rows are the `59dcb20` /
`d470ab2` / `d7f424c` readings, unchanged. **The persona-#1 figure (56%, settled 2026-08-03 as a human
ruling, not a row-derivation) is NOT re-derived here** — it needs its own walk the way its predecessor
did, and this pass changes inputs to that walk (three more sub-items shipped) without re-running it. See
the dated note in § Summary.*

***★ RE-AUDITED 2026-08-22 · HEAD `174b94a`** (M9 / spec 009 "code blocks" closed at task 9.3, the
records reconcile, per tasks.md 9.3's own line — *"`spec-coverage.md`'s F3 row moves from 0% to its
landed figure"*). **Targeted re-verification of F3 (Code Blocks) ONLY**, against shipped code
(`src/render/codeEngine.ts`, `codeEnhancer.ts`, `codeView.ts`, `codeDetect.ts`, `codeThemeControl.ts`,
`src/settings/settings.ts`) and its tests. **No other section was re-scored:** F1, F2, F4–F12 and §6/§7
are the `59dcb20` / `d470ab2` / `d7f424c` / `bdcb2ad` readings, unchanged. **F3 moves 0% → 78%, NOT
100%** — two of the nine items score PARTIAL and one scores NOT, named in full at F3 below; the method's
own tie-break (*"ambiguity resolves toward NOT"*) is applied, not an inflated ✓.*

***★ RE-AUDITED 2026-09-06 · HEAD `b9abd44`** (M10 / spec 010 "local exports" — task 11.3, the records
reconcile, per tasks.md's own line — *"`spec-coverage.md`'s F9/F5 rows move from their pre-milestone
figures to their landed figures"*). **Targeted re-verification of F9 (Export & Publishing) and F5's
print-optimized-mode row ONLY**, against shipped code (`src/export/htmlExport.ts`,
`src/export/copyPlainText.ts`, `src/app/exportControls.ts`, `entrypoints/app/main.ts`,
`src/settings/settings.ts`, `src/theme/readerCss.ts`'s `@media print` block) and its tests. **No other
section was re-scored:** F1–F4, F6–F12 and §6/§7 are the `174b94a` / `59dcb20` / `d470ab2` / `d7f424c` /
`bdcb2ad` readings, unchanged. **F9 moves 0% → 38%** (4 of 13 items ship in full on both engines, 2 score
PARTIAL, 7 do not — DOCX export, ZIP export and the progress indicator were each dropped from M10 by a
human scope-reduction ruling, deferred not abandoned; the four publish paths remain on the pre-existing
M11 routing decision). **F5 moves 36% → 38%** (print-optimized mode ✗→✓). ★ **11.1 (the milestone-close
human walk) and 11.2 (the retro) have NOT yet run as of this audit** — this re-score reflects landed code
only; a milestone-close walk finding, if any, is a matter for a future re-score, not this one.*

***★ RE-AUDITED 2026-09-11 · HEAD `6eff5dc`+8.3-R** (M11 / spec 011 "math rendering" closed at task
8.3-R, the records reconcile, per that task's own line — *"`spec-coverage.md`'s F2 re-scored"*).
**Targeted re-verification of F2's seven math/formula rows ONLY**, against shipped code
(`src/render/mathEngine.ts`, `mathEnhancer.ts`, `mathView.ts`, `parse.ts`'s tex-plugin wiring,
`src/theme/mathFont.ts`, `src/app/exportControls.ts`'s copy-math rows) and its tests. **No other
section was re-scored:** F1, F3–F12 and §6/§7 are the `174b94a` / `59dcb20` / `d470ab2` / `d7f424c` /
`bdcb2ad` / `b9abd44` readings, unchanged. **F2 moves 42% → 68%** (four rows ✗→✓, two ✗→~, one —
MathJax — stays ✗ permanently by ruling, not as a gap). **★ The engine that shipped is Temml/MathML,
not the spec's own literally-named KaTeX** — M11 reopened via a human-reviewed three-gate REVISIT
after KaTeX and MathJax both busted the byte/audit gate at task 1.1 (`decisions.md`'s 2026-09-06 GATE
1/2/3 — REVISIT entries); the KaTeX row is credited for the CAPABILITY (a default math engine, both
browsers) against a ruled fidelity bar, stated as a named substitution, never a silent one.*

*Subject: `docs/product/spec.md` §5 (F1–F12), §6 (Security & Privacy), §7 (UI/UX).*
*Method: source code is the answer, the spec is only the question. No spec item is credited
because a plan, a task list or a pipeline comment anticipates it.*

---

## Summary

**Phase 1 (§5 F1–F12) is ~32% shipped by weighted feature count** — 64.0 credit points across
198 enumerated items. Including §6 and §7 the whole-spec figure is **~36%** (82.0 / 227). The
2026-09-11 re-audit moved **F2 from 42% to 68%** — M11 shipped math rendering (Temml/MathML inline,
block, fence; copy-as-LaTeX/MathML as document-level actions) on top of M7's already-shipped diagram
half. The 2026-09-06 re-audit moved **F9 from 0% to 38%** and **F5 from 36% to 38%** — M10 shipped
HTML export, PDF export, all three copy actions, the export shortcut, and F5's print-optimized mode
(details in F9/F5 below). The 2026-08-22 re-audit moved **F3 from 0% to 78%** — M9 shipped Shiki
highlighting, the code-theme picker (20 themes), the per-block toolbar (copy / line numbers / line
highlighting / word wrap) and collapsible long blocks; two items score PARTIAL (a 6-language curated
catalog, not 190+; a collapse/expand control rather than a per-block raw⇄rendered toggle) and one
scores NOT (auto-detection is built and tested but deliberately unwired to any live document, 8.6's
own AskUserQuestion resolution). **These three rows (F2, F9/F5, F3) are the whole of the §5 and
whole-spec movement since M7's own close**; no other section was re-scored (see the enumeration
correction below for the +1 item, which predates and is unrelated to F3's move).

**F2 is 68%, both halves now ship in substance.** M7 shipped the diagram half; M11 shipped the math
half — **but as Temml/MathML, not the spec's own literally-named KaTeX**, a human-ruled substitution
after both KaTeX and MathJax busted the byte/audit gate. Inline `$…$`, block `$$…$$`, code-fence math,
and copy-as-LaTeX/MathML (via document-level panel actions, not the spec's literal "right-click"
mechanism — `permissions: []` holds, no `contextMenus`) all ship, both engines. **Three rows remain ✗,
none of them a math/formula gap anymore:** additional engines (Graphviz/Vega/PlantUML, a named post-v1
stretch), standalone diagram-file rendering (a sealed 007 scope decision), and dark-mode image
adaptation (routed to a future media/theming pass). The MathJax fallback toggle is ✗ **permanently, by
ruling** (REVISIT-RULING 4 — it independently busted both the byte gate and `pnpm audit --prod`), not
an open gap. Reading 68% as "F2 is done" is still the one misreading this number invites — three named
deferrals remain — but "diagrams shipped, math did not" is no longer the honest sentence; both halves
shipped, on the engine and mechanism a human ruling actually chose.

**★ The persona-#1 figure is NOT re-derived by this pass and the 2026-07-27 reading of ~56% is now an
undercount.** That figure counts 10 of 18 sub-items *"across folder browser, watch mode, diff view,
Mermaid, tables"*, and the Mermaid sub-item(s) it scored ✗ have shipped — but re-deriving it means
re-enumerating persona #1's sub-items across F1/F5/F6 as well, which is outside this pass's F2 fence
and would be a whole-file re-audit done from one row's evidence. **Do not quote ~56% as current; it
needs its own derivation.** The prior audit's accompanying claim — *"what they cannot do is see a
Mermaid diagram"* — is **false at HEAD** on the app-page reader and remains true only on the
content-script `file://` / raw-host reader, which spec 007 §3.2 put out of scope by decision (see
uncertain-items §5). Every other persona in §3 is still under 15% served except the Developer: **F3
moved 0% → 78% at M9's close (2026-08-22)** — Shiki highlighting, ≥14 (20 shipped) independent code
themes, copy/line-numbers/line-highlighting/word-wrap and collapsible blocks all ship; what remains is
a 6-language curated catalog rather than Shiki's 190+, and auto-detection built but not wired to a
live document (F3 below has the full accounting). The Technical writer still has no editor and no
export (F8 4.8% at that reading — **17% since M12's close, 2026-10-30**; F9 0%). The Student's math picture is stale here — **F2 moved to 68% at M11's close
(2026-09-11)**, after this paragraph's own reading (5 of 7 math/formula items ✗) was written; math
now renders, both engines. This paragraph's persona-#1/#5 figures are NOT re-derived by that move —
see the settled 56%/68%-boundary discussion below, which this F2 change is an input to, not a
re-walk of.

**★ SETTLED 2026-08-03 — PERSONA #1 IS 56%, ON THE GAP LENS. A HUMAN RULING, NOT A RE-DERIVATION.**
The paragraph above says the ~56% *"needs its own derivation"*. It has since had one, and the
derivation did **not** return a single number — it returned a **bracket that turned on one question**:
is the app-page-only surface of diagrams (and diff, and snapshot history) a *scoped boundary*, in
which case persona #1 scores **67%**, or a *gap*, in which case it scores **56%**? That is
uncertain-items §5's question, and it is not arithmetic — it is the one a human walk answers. **A
human ran the walk** — a `file://` markdown document carrying a `mermaid` fence, then the same file
through the app page — **and ruled GAP**: persona #1's core job (`docs/product/spec.md` §3, *"Read the
CLAUDE.md/specs/plans their agents generate"*) is done at `file://` URLs, and that is the surface
where the rendering is absent. **56% is therefore the persona-#1 figure of record from 2026-08-03**,
on the gap arm of that bracket.

**Three readings of "56%" now exist and they are NOT the same number — do not merge them.**
(a) The **2026-07-27 ~56%** — a dated record, true on its date, preserved in the paragraph above and
cited correctly by `progress.md` § Blockers; it is an *undercount* because it scored Mermaid ✗ on
every surface. (b) The **67%** boundary arm — what persona #1 would score if app-page-only were read
as scope rather than shortfall; **not chosen**. (c) The **56% gap arm — the figure of record**, which
coincides with (a) numerically **by arithmetic accident, not by agreement**: (a) is low because
Mermaid had not shipped at all, (c) is low because Mermaid shipped on one reader surface of two.

**★ M8 IS STALE INPUT TO (c), NOT A FOURTH READING.** The 56% gap-arm figure counted 10 of 18
persona-#1 sub-items *"across folder browser, watch mode, diff view, Mermaid, tables"* — and M8 shipped
three items in that same enumeration: the agent-file badge, and the table-tools pair (sort/filter and
copy). **Whether that moves 10/18 to 13/18 is not this pass's call** — the 56% figure is a **human
walk**, not row arithmetic (see the settled entry above), and the walk asked a scoping question (is
app-page-only a boundary or a gap?) that M8's rows do not touch. **Do not compute "13/18 = 72%" from
this paragraph** — that number has not been walked and would smuggle a re-derivation into a stale-input
note. What is safe to say: the persona-#1 figure is **more stale after M8 than before it**, and the next
session that needs it should re-walk it rather than trust either 56% or an arithmetic guess.

**What this ruling did NOT do in this file, and what M11's own F2 re-score above still does not
do.** It does not re-score F2's rows on the app-page-only question. Uncertain-items §5 already
records the consequence its own arithmetic names — **updated for M11's own eleven ✓ rows (the
original seven diagram rows plus the four math rows M11 added, all app-page-only by the same §9-2/
RULING-2 precedent): items 4 and 5 moving together would drop F2 from 68% to roughly 39% (eleven ✓ →
~, i.e. 7.5/19 credit)** — and that re-score is **CARRIED, not applied here**: it is a row-level
re-audit and this entry records a persona figure. **F2's 68% and its eleven ✓ marks stand in this
document until that re-audit runs.** The *cost* of closing the gap — what rendering on the
content-script surface would take and which decisions it reopens — is a separate scoping input and is
deliberately **not** asserted here; 007 §3.2, 006 §3.2 and 011 §9-2/RULING 2 are its primary sources.

**Weighting method.** Each spec bullet is decomposed into its sub-items and each sub-item counted
once, unweighted (a bullet listing seven extended-syntax features counts seven). Credit is
`SHIPPED = 1.0`, `PARTIAL = 0.5`, `NOT = 0`, `UNCLEAR = 0`. Ambiguity resolves toward NOT — this
document is an input to milestone scoping (M7's, and now M8's), and an inflated ✓ costs more than a
conservative ✗. **The method is unchanged at the 2026-08-03 re-audit; only marks were re-derived.**

**★ AN ENUMERATION CORRECTION, NOT A METHOD CHANGE (2026-08-03).** F2's row declared **18** items and
its trailing note repeated 18, but the section **has always listed 19 rows** — and 19 is what the
method above yields when `docs/product/spec.md` §F2's eleven bullets are decomposed (2 + 3 + 2 + 2 + 1
+ 1 + 2 + 1 + 2 + 1 + 2 = 19). The ✗ column carried the slip (17 declared against 18 ✗ rows). The
count is corrected to **19** here, which moves §5's item total **197 → 198** and the whole spec's
**226 → 227**. This changes no other section's marks and no rule; it makes F2's denominator larger,
i.e. its coverage figure *lower*, which is the direction this document's own tie-break prefers.

**Status legend.** `✓ SHIPPED` — implementation exists and is either test-covered or demonstrably
reachable from a production entrypoint. `~ PARTIAL` — exists but incomplete, untested, or reaches
only some of the stated surfaces. `✗ NOT` — no implementation (absence evidenced by missing
dependency, zero grep hits, or no entrypoint import). `? UNCLEAR` — evidence ambiguous; listed at
the bottom with the question a human walk would settle.

| Section | Items | ✓ | ~ | ✗ | ? | Credit | Coverage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| F1 Rendering engine | 24 | 6 | 3 | 15 | 0 | 7.5 | **31%** |
| F2 Math & diagrams *(re-audited 2026-09-11)* | 19 | 11 | 4 | 4 | 0 | 13.0 | **68%** |
| F3 Code blocks *(re-audited 2026-08-22)* | 9 | 6 | 2 | 1 | 0 | 7.0 | **78%** |
| F4 File sources | 11 | 2 | 2 | 7 | 0 | 3.0 | **27%** |
| F5 Navigation & reading UX *(re-audited 2026-09-06, print mode)* | 39 | 14 | 2 | 23 | 0 | 15.0 | **38%** |
| F6 Live updating & AI-workflow *(re-audited 2026-08-13)* | 13 | 7 | 2 | 4 | 0 | 8.0 | **62%** |
| F7 Theming & appearance | 17 | 1 | 0 | 16 | 0 | 1.0 | **6%** |
| F8 Editor mode *(re-audited 2026-10-30, M12 close)* | 21 | 1 | 5 | 15 | 0 | 3.5 | **17%** |
| F9 Export & publishing *(re-audited 2026-09-06, M10 close)* | 13 | 4 | 2 | 7 | 0 | 5.0 | **38%** |
| F10 AI features | 16 | 0 | 1 | 15 | 0 | 0.5 | **3%** |
| F11 Setup & onboarding | 9 | 1 | 0 | 8 | 0 | 1.0 | **11%** |
| F12 i18n & accessibility | 7 | 1 | 2 | 4 | 0 | 2.0 | **29%** |
| **§5 total** | **198** | **54** | **25** | **119** | **0** | **66.5** | **34%** |
| §6 Security & privacy | 17 | 7 | 6 | 4 | 0 | 10.0 | **59%** |
| §7 UI/UX | 12 | 6 | 4 | 2 | 0 | 8.0 | **67%** |
| **Whole spec** | **227** | **67** | **35** | **125** | **0** | **84.5** | **37%** |

*Every row except F2, F3, F5 and F6 is the `d470ab2` / `d7f424c` reading, carried forward unverified at
HEAD `174b94a`. §6 and §7's own totals are unmoved — M7 touched §7-6's diagram sub-surface (note updated
below) without moving that item off `~`, since two of its three named sub-surfaces are still absent. F5
and F6 moved at M8 (2026-08-13) — three rows in each, six total, all cited below in their own sections.
F3 moved at M9 (2026-08-22) — six rows ✗→✓, two ✗→~, cited in full at F3 below. **F2 moved again at M11
(2026-09-11)** — four rows ✗→✓, two ✗→~, cited in full at F2 above. **F8 moved at M12 (2026-10-30)** — one row ✗→✓, three ✗→~, cited in full at F8 below.*

The shape is the finding: §6 and §7 — the trust story and the design system — are the best-covered
sections in the document, and they are the two that no competitor can copy in an afternoon.

---

## F1. Rendering Engine

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Full CommonMark | ✅ | ✓ | `src/render/parse.ts:42`; `tests/golden/` (9 fixtures) | markdown-it default preset. |
| GFM tables | ✅ | ✓ | `src/render/parse.ts:40`; `src/render/sanitize.ts:35-36`; `tests/golden/fixtures/gfm-torture.md` | Table tags allow-listed; GFM alignment still dropped (emitted as inline `style`, stripped — `sanitize.ts:52-59`). |
| Task lists / checkboxes | ✅ | ✓ | `src/render/parse.ts:47`; `sanitize.ts:33` | Rendered **disabled** by design; interactivity is an F5 item, still ✗. |
| Strikethrough | ✅ | ✓ | `parse.ts:40`; `sanitize.ts:28` | Both `<s>` and `<del>` allow-listed. |
| Autolinks | ✅ | ✓ | `parse.ts:26,40` | `linkify: true` plus core angle-bracket autolinks. |
| Extended: footnotes | ✅ | ✗ | No `markdown-it-footnote` in `package.json`; 0 grep hits in `src/` | — |
| Extended: abbreviations | ✅ | ✗ | No `markdown-it-abbr`; 0 hits | — |
| Extended: super/subscript | ✅ | ~ | `sanitize.ts:28` allows `sup`/`sub` | Tags survive from *inline HTML* only; no `markdown-it-sup`/`-sub` plugin, so `^x^`/`~x~` syntax does nothing. |
| Extended: definition lists | ✅ | ✗ | No `markdown-it-deflist`; `dl`/`dt`/`dd` absent from `ALLOWED_TAGS` (`sanitize.ts:22-37`) | Double absence — plugin and allow-list. |
| Extended: emoji shortnames | ✅ | ✗ | No `markdown-it-emoji`; 0 hits | — |
| Extended: highlight/insert marks | ✅ | ✗ | `mark`/`ins` absent from `ALLOWED_TAGS` | — |
| Extended: comments/annotations | ✅ | ✗ | 0 hits | — |
| GitHub alerts (`> [!NOTE]`) | ✅ | ✗ | No alerts plugin; 0 hits in `parse.ts` | Renders as a plain blockquote today. |
| YAML frontmatter → metadata card | ✅ | ✗ | No `markdown-it-front-matter`; 0 `frontmatter` hits in `src/` | Frontmatter currently renders as body text. |
| Frontmatter-driven render options | ⭐ | ✗ | Depends on the item above | — |
| MDX-aware rendering (no execution) | ✅ | ~ | `.mdx` in `src/detect/isRenderableContext.ts:23` and `entrypoints/peekover.content.ts:26` | The file *opens*; JSX blocks fall through `html:true` → DOMPurify strips unknown tags. Non-execution holds; "aware" does not. |
| Inline HTML — always sanitized | ✅ | ✓ | `sanitize.ts:107-145`; `tests/browser/sanitize.browser.test.ts`; `tests/golden/fixtures/malicious.md` | Allow-list + `data:` hook (`sanitize.ts:131-135`). AGENTS.md #3's core. |
| Smart typography, toggleable | ✅ | ✗ | `parse.ts:27` — `typographer: false`, no toggle | — |
| One parser with exposed option toggles | ✅ | ~ | `parse.ts:23-42` — one `MarkdownIt` instance | One engine ✓; options are module-private constants, exposed to nothing. |
| Content-Type detection | ✅ | ✗ | `isRenderableContext.ts:67-99` matches on URL/extension only; no header read anywhere | — |
| Configurable URL path-matching per origin | ✅ | ✗ | Host set is hard-coded (`isRenderableContext.ts:37-52`) and mirrored in the manifest (`peekover.content.ts:23-40`); no settings key (`settings.ts:30-39`) | — |
| Character-encoding override per origin | ✅ | ✗ | 0 hits for encoding/charset in `src/` | — |
| Wiki-links `[[…]]` resolve in folder | ⭐ | ✗ | 0 hits; the only `[[` in `src/` is a test spread | — |
| Backlinks panel | ⭐ | ✗ | 0 hits | — |

## F2. Math & Diagrams

***Re-audited 2026-08-03 at HEAD `59dcb20`** (diagrams, against shipped code — see that pass's own note
below) **and 2026-09-11 at HEAD `6eff5dc`+8.3-R** (math, against M11's shipped code, spec 011). The
2026-08-03 pass: 7 rows moved ✗ → ✓ and one ✗ → ~; ten rows did not move, and all seven math/formula
rows were among them. **Surface: all seven diagram ✓ rows are the APP-PAGE reader only** — spec 007
§3.2 decided the content-script `file://` / raw-host reader renders no diagrams, and that fence is
asserted structurally by `src/render/diagramImportFence.test.ts`. They are scored ✓ rather than ~ on
this document's own precedent (F6's `Diff view — inline` and `Watch mode` are ✓ with the same
app-page-only note); **the surface question itself is raised for a human at uncertain-items §5, not
priced into the score.** **The 2026-09-11 pass: four of the seven math/formula rows move ✗ → ✓, two
move ✗ → ~, one (MathJax) stays ✗ PERMANENTLY BY RULING.** Every changed mark carries a module or test
pointer below — a task in `specs/011-math-rendering/tasks.md` was not accepted as evidence that
anything shipped. **★ The engine that shipped is Temml/MathML, NOT KaTeX** — M11's own task 1.1 busted
the byte headroom for both KaTeX and MathJax, and a human-reviewed three-gate REVISIT
(`decisions.md`'s 2026-09-06 GATE 1/2/3 — REVISIT entries) reopened the milestone on the MathML/Temml
direction instead; the "KaTeX (default)" row below is credited for shipping THE CAPABILITY the spec
item names (a default math-rendering engine), stated as a ruled substitution, not a silent one. **Math
rows are ALSO app-page-only** (§9-2/RULING 2, confirmed structurally by
`src/render/mathImportFence.test.ts`), scored ✓ on the identical precedent as the diagram rows above —
not priced into the score, same as the diagram surface question.***

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| KaTeX (default) | ✅ | **✓** *(2026-09-11, ruled substitution)* | `src/theme/mathFont.ts`/`src/render/mathEngine.ts` — `temml@0.13.5` is the shipped engine, NOT KaTeX (`decisions.md`'s 2026-09-06 M11 GATE 1 — REVISIT entry: KaTeX busted `.output` headroom by ~3.8× at task 1.1, MathJax independently failed `pnpm audit --prod`; a human-reviewed three-gate REVISIT reopened M11 on MathML/Temml instead); `tests/browser/mathBlock.browser.test.ts`, `mathEnhancer.browser.test.ts` | **A named substitution, not a silent one.** Credited for shipping the CAPABILITY (default math-rendering engine, both engines) the item names — the spec's own literal "KaTeX" naming is superseded by a ruled fidelity bar (readable-on-both-engines, explicitly not KaTeX-HTML equivalence, REVISIT-RULING 2). |
| MathJax fallback toggle | ✅ | ✗ | `@mathjax/src` installed then REMOVED (task 1.1-R, `decisions.md`'s 2026-09-06 REVISIT-RULING 4); 0 hits in shipped `src/` | **Unmoved, but now PERMANENTLY struck by ruling, not merely absent.** MathJax busted `.output` headroom alone (1,339,852 B) AND independently failed `pnpm audit --prod` (two HIGH advisories via `mj-context-menu`'s `brace-expansion` sub-tree) — REVISIT-RULING 4 vacates the contingency (D-10/D-11) permanently, not contingently. |
| Inline `$…$` | ✅ | **✓** *(2026-09-11)* | `src/render/parse.ts` (`@mdit/plugin-tex`'s `math_inline_dollar` rule → `<code class="peekover-math-inline">`); `src/render/mathEnhancer.ts:246` `enhanceMath`; `tests/browser/mathInline.browser.test.ts` | Mutate-in-place (D-7-R) — the `<code>` element is never removed/wrapped, its children replaced with the rendered `<math>` tree on success. |
| Block `$$…$$` | ✅ | **✓** *(2026-09-11)* | `src/render/parse.ts` (`math_block_dollar` rule); `src/render/mathEnhancer.ts` block path; `src/render/mathView.ts` (control group: copy-as-LaTeX button, copy-as-MathML); `tests/browser/mathBlock.browser.test.ts` | Sibling-figure reuse of 007's own D-8 machinery (D-8-R), a per-figure copy-as-LaTeX button. |
| Code-fence math | ✅ | **✓** *(2026-09-11)* | `src/render/parse.ts`'s `fence` renderer override (`info === 'math'` routed through the same marker logic as `math_block`, a real drafting-time defect 3.1-R's own audit caught and 3.2-R fixed); ` ```math ` fence support confirmed by test | Shares D-8-R's block machinery, confirmed at the DOM/enhancer level, not merely the tokenizer level. |
| Right-click → copy as LaTeX | ⭐ | **~** *(2026-09-11)* | `src/render/mathView.ts:494` `serializedMathSourceDocument`; `src/app/exportControls.ts` `onCopyMathLatex`/`'copy-math-latex'` row; a `data-math-source` attribute recovers inline sources (the §8-1(b) fix, `decisions.md` 2026-09-10); `tests/browser/mathActions.browser.test.ts` | **Mechanism ships; NOT via right-click.** Block math gets a per-figure copy-as-LaTeX button; inline copies via ordinary text-selection of the retained source PLUS a document-level "Copy formulas as LaTeX" panel action. `permissions: []` holds — no `contextMenus`, same zero-permission posture 007's copy/download affordances already set. |
| Right-click → copy as MathML | ⭐ | **~** *(2026-09-11)* | `src/app/exportControls.ts` `onCopyMathMathml`/`'copy-math-mathml'` row (task 6.2-R); clones the rendered `<math>` tree, one document-level action covering every formula; `tests/browser/mathActions.browser.test.ts` | **Mechanism ships; NOT via right-click.** Same panel/menu-row placement as the LaTeX action above (gate-3-ruled, `decisions.md` GATE 3 FINDING 2) — a document-level action, never per-formula inline chrome (row 11 stays negative), never a toolbar button or shortcut. |
| Mermaid rendering (8 diagram kinds) | ✅ | **✓** | `src/render/diagramEngine.ts:425` (`loadMermaid`, the one `import('mermaid')` in the tree), `:440` `hasDiagramFence`, `:453` `loadDiagramEngine`; `src/render/diagramEnhancer.ts:678` `enhanceDiagrams`; wired at `src/app/appShell.ts:139` and `src/app/readerPane.ts:185`; `tests/browser/diagramRender.browser.test.ts`, `diagramDegrade.browser.test.ts`; fixtures `tests/golden/fixtures/diagrams-10.md`, `diagrams-50.md` | **Was "the largest single hole in persona #1's column"; M7 closed it on the app page.** The path is diagram-kind-agnostic (source text → engine → `sanitize.ts:380` `SANITIZE_SVG_CONFIG` → adopt), so it is not gated on a kind allow-list. Of the spec's eight named kinds, **seven are fixtured** (flowchart, sequence, class, state, ER, gantt, pie); **`gitGraph` appears nowhere in the repo** — rendered by construction, unproven by test. |
| Mermaid theme auto-sync with light/dark | ✅ | **✓** | `diagramEngine.ts:417` `diagramEngineConfigFor(theme)`; `diagramEnhancer.ts:169` `DIAGRAM_THEME_ATTR`; `tests/browser/diagramTheme.browser.test.ts` | Theme is a component of the cache key (`src/app/diagramCache.ts:171`), so a flip re-renders through the cache rather than retinting the SVG (007 §3.7); the previous rendering stays on screen until its replacement is ready. |
| Additional engines (Graphviz/Vega/PlantUML) | ✅ | ✗ | No dependencies; 0 hits | **Unmoved.** The spec's own post-v1 stretch clause, restated as out of scope at 007 §6. |
| Diagram → PNG/SVG copy & download | ✅ | **✓** | `src/render/diagramView.ts:194` (`image/png`), `:298` `canvas.toBlob`, `:314` `ClipboardItem` write, `:325-333` `downloadDiagramAsSvg` with `anchor.download`; `tests/browser/diagramActions.browser.test.ts` | Both halves of the item ship: **copy as PNG**, **download as SVG**, per diagram. Revealed on hover **and** keyboard focus; no manifest permission was needed (007 §3.11's stop-and-flag never fired). |
| Smart diagram cache (hash-keyed) | ✅ | **✓** | `src/app/diagramCache.ts:171` `diagramCacheKey` (hash of source **+ theme + engine version**), `:399` `readDiagram`, `:427` `storeDiagram`, `:234` `planDiagramWrite`; IndexedDB `peekover` DB v4; `tests/browser/diagramCache.browser.test.ts` | Persistent, not session-memory — which is what makes the spec's *"<1 s reopen"* and *"only re-render changed diagrams"* reachable. A watched document re-mounting serves unchanged diagrams from cache. |
| User-visible cache controls (cap, clear) | ✅ | **~** | **Clear ✓:** `src/app/storageControls.ts:271-305` — a dedicated `Clear diagram cache` control with its own confirm step, erasing cached diagrams alone; also erased by "Wipe all data". **Disclosure ✓:** `src/app/store.ts:527` — `Diagrams cached: N rendered (~size)`. **Cap ✗ as a user-visible control:** the bounds are module constants (`diagramCache.ts:92` count 150, `:103` 8 MB, `:116` 30 days) | **PARTIAL, scored down deliberately.** The bounds *exist and bind* (oldest-first eviction), and they are disclosed qualitatively in `docs/trust/PERMISSIONS.md:48` — but the panel states neither the values nor a retention line, and 007 §6 defers **user-adjustable cache bounds** by name. The item says *"size cap, one-click clear"*; one of the two is a control the user can see. |
| Standalone diagram-file rendering | ✅ | ✗ | `MARKDOWN_EXTENSIONS` (`isRenderableContext.ts:20-31`) still lists no `.mermaid`/`.dot` | **Unmoved, and deliberately so:** 007 §3.4 decided it OUT and priced the overturn (a distinct non-markdown code path, a new manifest `matches` pattern, a `PERMISSIONS.md` row); gate 1 upheld it. |
| No artificial file-size limit | ✅ | ~ | `src/render/mount.ts:112` renders whatever it is given; `tests/golden/hugeDoc.ts`, `src/render/pipeline.perf.test.ts` | **Unmoved at ~.** No document size cap exists ✓; `walkPolicy.ts:114` still caps the *folder walk*, not documents. M7 added no document-level cap — mermaid's own `maxTextSize` is in the frozen `secure` list (`diagramEngine.ts:223`) and bounds a **diagram source**, not a file. |
| Progressive loading (text first, diagrams after) | ✅ | **✓** | 007 §3.3 makes enhancement **post-mount**: `enhanceDiagrams` is called *after* `mount()` commits, at `appShell.ts:139` and `readerPane.ts:185`, never from inside `mount()`; placeholder at `diagramView.ts:94`; the `<165 ms` first-paint gate is held on diagram-bearing documents (§ Baselines, `progress.md`) | The M1 deferral (*"`mount.ts` is a single synchronous `replaceChildren` commit"*) still describes `mount()` — which is the point. The text paints in one commit and diagrams fill in afterwards, so the heaviest block never gates first paint. |
| Diagram zoom/pan lightbox | ✅ | **✓** | `diagramView.ts:53-64` (`peekover-diagram-open`, `…-lightbox`, panel/view/close classes), `:631` activation; `tests/browser/diagramLightbox.browser.test.ts` | Opens by pointer **or** keyboard, closes on Escape, traps and restores focus, adds no new global bare key (007 §3.11). **F5's image lightbox is still ✗** — this one was built not to preclude it, but it was not generalised. |
| Auto dark-mode: diagrams re-themed | ⭐ | **✓** | Same mechanism as the theme-sync row above: `diagramEngineConfigFor` + the theme-keyed cache; `tests/browser/diagramTheme.browser.test.ts` | **The two rows are one mechanism** (the product spec states theme-sync in the Mermaid bullet and again in the dark-mode bullet). Both are credited because the method counts sub-items as enumerated — noted so the double credit is visible rather than silent. |
| Auto dark-mode: images dimmed/inverted | ⭐ | ✗ | `src/render/mediaPolicy.ts` classifies and blocks remote media; it does not adapt appearance | **Unmoved.** Named out of scope at 007 §6 (*"the other half of the dark-mode row"*), routed to a media/theming pass. |

*(**19 items** — see the enumeration correction in § Summary; the "additional engines" row covers one
item, and the KaTeX/MathJax and inline/block/fence rows are counted separately as listed. Credit at
M7 close (diagrams only): 7 × 1.0 + 2 × 0.5 = 8.0 / 19 = 42%. **Credit at M11 close (2026-09-11, math
added): 11 × 1.0 + 4 × 0.5 = 13.0 / 19 = 68%** — the four diagram/math rows that moved ✗→✓ at M11
(KaTeX-row-as-Temml, inline, block, fence) plus the seven M7 diagram ✓ rows = 11 full credits; the two
M7 diagram ~ rows (cache controls, no file-size limit) plus the two new M11 math ~ rows (copy-as-LaTeX,
copy-as-MathML — mechanism ships, not via right-click) = 4 half credits.)*

**What the 68% is made of, stated so it cannot be rounded up.** M7 shipped the diagram half: rendering,
the hash-keyed persistent cache, theme sync, copy/download, the lightbox, post-mount progressive
enhancement, the degradation paths, and a second SVG-shaped sanitizer profile (`sanitize.ts:200-380`).
**M11 shipped the math half — but as Temml/MathML, not the spec's own literally-named KaTeX** (a
human-ruled substitution after KaTeX and MathJax both busted the byte/audit gate), plus a THIRD
sanitizer profile (a single MathML-only allow-list, `sanitizeMath`) and a bundled subsetted math font
(D-13, STIX Two Math). **Three rows are still ✗: additional engines (Graphviz/Vega/PlantUML, a named
post-v1 stretch), standalone diagram-file rendering (a sealed 007 scope decision), and images
dimmed/inverted (routed to a future media/theming pass) — none is a math/formula gap anymore.** The
MathJax row stays ✗ **permanently, by ruling** (REVISIT-RULING 4), not as an open gap. F2 is no longer
the section where "what's left" is a wholesale different feature from "what landed" — both halves of
the spec's own two-part framing (diagrams, math) now ship in substance, with three named, ruled
deferrals remaining.

## F3. Code Blocks

***Re-audited 2026-08-22 at HEAD `174b94a`, against shipped code (spec 009, M9, closed at task 9.3).**
Six rows moved ✗ → ✓, two ✗ → ~, one stays ✗ — no row was credited because a plan or task list
anticipated it; every mark below cites the module, the test, or the absence directly. **This is a new
dated audit, not a re-litigation of 007/008's own rows.***

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Syntax highlighting, 190+ languages (Shiki) | ✅ | **~** | `src/render/codeEngine.ts:122-129` `LANGUAGE_LOADERS` — a hand-written, explicitly-`PROVISIONAL` six-language map (`javascript`, `python`, `json`, `css`, `html`, `bash`); the module's own header (`:16-46`) names the ~700-language barrel import as tried and reverted (13.6 MB `.output`, a real regression caught by measurement); `decisions.md` 2026-08-19 · M9 8.5 (M-1): "human confirmed full set (6 languages, 20 themes) fits, ship as-is" | **Shiki itself ships and highlights correctly; the catalog is 6 languages, not 190+.** An unlisted language degrades to plain text via the same per-fence failure path 7.1 tests (§3.9) — no crash, no special case, just no color. Catalog breadth is named a genuine open product question, explicitly deferred past M9. |
| ≥14 code themes, independent of doc theme | ✅ | **✓** | `src/render/codeEngine.ts:134-160` `THEME_LOADERS`/`CODE_THEME_IDS` (20 themes, mechanically selected — smallest-by-byte-size then WCAG-AA-filtered, not hand-curated, per D-9); `src/theme/codeThemeControl.ts` (`role="listbox"` picker); `tests/browser/codeThemeControl.browser.test.ts` (independence proven **both directions**: flipping `codeTheme` leaves `data-theme` unchanged and vice versa) | 20 ≥ the spec's 14-item floor. Every theme's contrast checked against its OWN background (`codeThemeControl.test.ts`), not the document's. |
| One-click copy button | ✅ | **✓** | `src/render/codeView.ts` (toolbar copy control, reads the RETAINED `<pre>`'s `textContent`, never the highlighted sibling — D-6); `tests/browser/codeToolbar.browser.test.ts` (copies the exact-as-authored source on a hostile unicode/whitespace fixture, multi-instance row proven — block 2's button copies block 2's text) | — |
| Line numbers (toggle) | ✅ | **✓** | `src/render/codeView.ts:264` `CODE_LINE_NUMBERS_DEFAULT = false` (D-9); `tests/browser/codeToolbar.browser.test.ts` | Default OFF (`decisions.md` 2026-08-19 · M9 8.5, M-4c) — a real toggle, off by default, not absent. |
| Line highlighting | ✅ | **✓** | `src/render/parse.ts` (D-8's additive `data-fence-meta` fence-renderer override, byte-identical for every existing fence); `src/render/codeEnhancer.ts` (`parseLineRanges`); `tests/browser/codeToolbar.browser.test.ts`; announced in TEXT for a screen reader, not colour alone (§4 row 15) | — |
| Word wrap toggle | ✅ | **✓** | `src/render/codeView.ts:281` `CODE_WRAP_DEFAULT = false`; `tests/browser/codeToolbar.browser.test.ts` | Default OFF (`decisions.md` 2026-08-19 · M9 8.5, M-4d) — same shape as line numbers above. |
| Language auto-detection for unlabeled fences | ✅ | ✗ | `src/render/codeDetect.ts` — built, unit- and real-engine-tested (`codeDetect.test.ts`, `tests/browser/codeDetect.browser.test.ts`, 100% on a 23-fence corpus), but **NOT imported by `codeEngine.ts` or `codeEnhancer.ts`** (confirmed structurally — 009 `codeImportFence.test.ts` 9/9); `progress.md` M9 task 8.6: "wiring an unlabeled fence's guess into the live highlight path is a future task" | **Mechanism built, feature inert — the same "mechanism adjacent, feature absent" shape F5's scroll-position-memory row already uses.** An unlabeled fence in a live document today renders exactly as it did before M9: plain, unhighlighted. `decisions.md`'s M-3 ruling (heuristic mechanism, `codeDetect.ts` IS the chosen mechanism) is not in question — only whether it is reachable, and it is not. |
| Collapsible long code blocks with preview | ⭐ | **✓** | `src/render/codeView.ts:373-445` (`CODE_COLLAPSE_ATTR`, `applyCollapseIfNeeded`, threshold `CODE_COLLAPSE_LINE_THRESHOLD = 40`, D-9/M-4b ruling); `tests/browser/codeCollapse.browser.test.ts` (expand shows the ALREADY-highlighted content, tokenize call count stays at 1 across a collapse/expand cycle — no re-highlight; collapsed height returns exactly to the preview's) | — |
| Per-block "open raw" view | ⭐ | **~** | `src/render/codeView.ts:394-403` `setCollapseState` — button text `"Show full code"` / `"Collapse code"`, `aria-expanded` carried | **Ships a per-block expand/collapse of the ALREADY-HIGHLIGHTED content, not a per-block raw⇄rendered toggle mirroring `readerMode.ts`'s document-level Raw view** (which swaps to unrendered markdown SOURCE). The item's "open raw" framing — set against the old row's own note, "document-level raw view ships; per-block does not" — doesn't fully transfer: what shipped answers the *long-block* half of §3.6 (a preview + a way to see the rest) but not a per-block source⇄rendered axis, which still does not exist at any granularity finer than the whole document. |

**F3 moved from a flat 0% to 78% at M9's close (2026-08-22)** — six of nine items ship in full, two are
partial (a 6-language curated catalog rather than Shiki's 190+; a collapse/expand control rather than a
per-block raw⇄rendered toggle), one is a real, named gap (auto-detection built and tested but
deliberately unwired). ~~**F9 (Export & Publishing) is now the only section at a flat 0%.**~~ **F9 moved
from a flat 0% to 38% at M10's close (2026-09-06)** — four items ship in full (both engines), two are
partial (HTML export ships without Base64 image embedding; PDF export's page-number fidelity is
Chromium/app-page-only), and seven do not ship: DOCX/ZIP export and the progress indicator were each
dropped from M10 by a human scope-reduction ruling (deferred, not abandoned), and the four publish paths
remain on their pre-existing M11 routing decision. F10/F11 are the sections never touched by any
milestone now (F3's own re-audit above already moved it off this list at M9's close).

## F4. File Sources & Handling

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Local `file://` rendering | ✅ | ✓ | `entrypoints/peekover.content.ts:25-33` (9 patterns); `src/detect/isRenderableContext.ts:67`; `src/detect/isRenderableContext.test.ts` | Needs the user's "Allow access to file URLs" toggle — which F11's detector, still ✗, was meant to explain. |
| Remote `http(s)://` markdown URLs | ✅ | ~ | `peekover.content.ts:35-39`; `isRenderableContext.ts:37-52` | Only four allow-listed raw hosts. An arbitrary `https://…/README.md` renders nothing. |
| Granular per-origin permissions (allowlist, wildcards) | ✅ | ✗ | `wxt.config.ts:18` — `permissions: []`; matches are static manifest literals; no origin UI in `src/app/` | Deliberate posture, but the spec item is a *user-configurable* allowlist. |
| GitHub/GitLab/Bitbucket raw rendering | ✅ | ✓ | `isRenderableContext.ts:37-52` (exact hosts + path-scoped `/-/raw/`, `/raw/`); verified against live URL shapes 2026-07-14 | — |
| "Open on GitHub" links | ✅ | ✗ | 0 hits | — |
| Drag-and-drop a file onto any tab → render | ✅ | ~ | `src/app/folderSource.ts:187-243`; `src/app/appShell.ts:474-484,1071-1087`; `tests/browser/folderDrop.browser.test.ts` | **Folders only, app page only.** A dropped single file hits `folderSource.ts:200-206` and returns "Drop a folder to open it." See uncertain-items §1. |
| Paste-and-render scratchpad | ✅ | ✗ | 0 `paste` hits in `src/`, `entrypoints/` | No popup surface exists (`wxt.config.ts:25` — action with no `default_popup`). |
| Render selected text on any page (context menu) | ✅ | ✗ | 0 hits; no `contextMenus` permission | — |
| "Local-only mode" master switch | ✅ | ✗ | 0 `local-only`/`localOnly` hits; `settings.ts:30-39` has three keys (`theme`, `tocOpen`, `tocWidth`) | — |
| Web page → Markdown clipper | ⭐ | ✗ | No `turndown`/`readability` dependency (the one `readability` hit is prose in `observerDetector.ts`) | — |
| Copy for AI | ⭐ | ✗ | 0 hits | Cheap to build on the existing raw-source registry (`readerMode.ts:40-48`) — a plausible M7 quick win. |

## F5. Navigation & Reading UX

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Auto-generated TOC sidebar | ✅ | ✓ | `src/render/tocModel.ts:65`; `src/render/tocView.ts:536`; wired at `src/render/mount.ts:29-30` | Both surfaces. |
| Scroll-spy | ✅ | ✓ | `tocView.ts`; `tests/browser/tocScroll.browser.test.ts` (both surfaces) | — |
| Smooth scroll | ✅ | ✓ | `tocView.ts:170-171` — `scrollIntoView` with no `behavior`, governed by `:host{scroll-behavior}` | `auto` under reduced-motion, by construction. |
| Collapsible levels | ✅ | ✗ | `tocView.ts` collapses the **rail as a whole** (`initialTocOpen:80`, `TOC_TOGGLE_KEY:882`); the nested `<ol>` has no per-branch collapse | Nested levels *render*; they do not collapse individually. |
| Resizable | ✅ | ✓ | `tocView.ts:271-286` (`TOC_MIN_WIDTH` 180 / `TOC_MAX_WIDTH` 480, `clampTocWidth`); `tests/browser/tocPersist.browser.test.ts` | Drag persists on end only. |
| Keyboard toggle | ✅ | ✓ | `tocView.ts:882,910` — backtick + `installTocShortcut` | — |
| Folder browser: open a folder (FS Access) | ✅ | ✓ | `src/app/folderSource.ts:101,122`; `src/app/chromiumFolderSource.ts`; `src/app/firefoxFolderSource.ts`; `tests/browser/folderGrant.browser.test.ts` | Both engines, two routes (picker + drop). |
| Folder browser: tree view | ✅ | ✓ | `src/app/tree.ts:57`; `src/app/treeView.ts`; `src/app/tree.test.ts` | Keyboard-operable (roving tabindex). |
| Folder browser: name search & filter | ✅ | ✓ | `src/app/tree.ts:93` (`filterTree`); `treeView.ts:75-79,205` | Live re-filter; designed no-match state. |
| Project mode: relative links resolve/navigate | ⭐ | ✗ | 0 hits; `sanitize.ts` keeps relative `href`s but nothing intercepts a click | The *sanitizer* preserves relative URLs (`sanitize.ts:74-77`) — half the substrate is there. |
| Breadcrumbs | ⭐ | ✗ | 0 hits | — |
| Back/forward history | ⭐ | ✗ | 0 hits | — |
| Cross-file full-text search | ⭐ | ✗ | No `minisearch` dependency; 0 hits | — |
| In-document search with heading context | ⭐ | ✗ | 0 hits | `tocModel.ts:65` already computes heading structure — the context half exists. |
| Broken-link checker | ⭐ | ✗ | 0 hits | — |
| Recent documents | ✅ | ✓ | `src/app/recents.ts:70-81,141`; `src/app/recentsView.ts:165`; `recents.test.ts` | Cap 20 (`recents.ts:36`). |
| Pinned files/folders | ✅ | ✓ | `recents.ts:91-107,156`; `recentsView.ts` | Add/remove/reorder. |
| Scroll-position memory per file | ✅ | ✗ | `src/render/readingAnchor.ts` restores position across a **watch re-mount**, not across sessions; `reopen.ts` restores the *file*, not the offset | Mechanism adjacent, feature absent. |
| Reading progress bar | ✅ | ✗ | 0 hits in `readerCss.ts`/`mount.ts` | — |
| Word count | ✅ | ✗ | 0 hits | — |
| Reading time | ✅ | ✗ | 0 hits | — |
| External-link preview cards (opt-in) | ✅ | ✗ | 0 hits | Would be the first non-media network path. |
| Image lightbox | ✅ | ✗ | 0 hits | Images render inline (`readerCss.ts:112`). |
| Page zoom 50–400% | ✅ | ✗ | 0 hits | — |
| 3 content widths (narrow/normal/full) | ✅ | ✗ | `readerCss.ts:82-85` — one `--reader-measure`, no width control | — |
| Heading permalinks | ⭐ | ✗ | `sanitize.ts:52-56` explicitly **disallows `id`** in M1; no anchor generator | Re-allowing `id` is a sanitizer change, i.e. a §6-weight edit. |
| Deep links / text-fragment highlighting | ⭐ | ✗ | 0 hits | — |
| Footnote & wiki-link hover preview cards | ⭐ | ✗ | Depends on F1 footnotes/wiki-links (both ✗) | — |
| Interactive task checkboxes (write-back) | ⭐ | ✗ | `parse.ts:44-47` — checkboxes deliberately rendered **disabled**; no write path | An explicit M1 decision, not an oversight. |
| Table tools: click-to-sort | ⭐ | **✓** *(2026-08-13)* | `src/render/tableTools.ts:211` `installTableSort`; `aria-sort` + text per D-12 divergence 2; `tests/browser/tableTools.browser.test.ts` | Stable sort, ascending/descending/document-order cycle, always from document order (never re-sorts the already-sorted rows). |
| Table tools: quick filter | ⭐ | **✓** *(2026-08-13)* | `src/render/tableTools.ts:398-412` (`FILTER_FIELD_CLASS` etc.); per-table, live re-filter, designed empty state (§4); `tests/browser/tableFilter.browser.test.ts` | Per-table scope by D-8/§3.6 decision, not per-document — see §8-2's walk (`progress.md`, M8 task 6.1: per-table AFFIRMED). |
| Table tools: copy as CSV/JSON/Markdown | ⭐ | **~** *(2026-08-13)* | `src/render/tableTools.ts:693,696,820` — `COPY_CSV_CLASS`, `COPY_MARKDOWN_CLASS`, the format table (`key: 'csv'` + a markdown entry); `tests/browser/tableCopy.browser.test.ts` | **Two of three formats.** CSV and Markdown ship as two native buttons (Q2, gate 2: "two buttons, minimum chrome, no menu"); **no JSON option exists anywhere in `tableTools.ts`.** Copies rows CURRENTLY SHOWN in the order shown (composes with sort and filter by construction). |
| Presentation mode | ✅ | ✗ | 0 `presentation`/`slide` hits | — |
| Presentation export as standalone HTML | ⭐ | ✗ | 0 hits | — |
| Read-aloud (TTS, Web Speech API) | ⭐ | ✗ | 0 `speechSynthesis` hits | Zero-cost and zero-network by construction — a cheap ⭐ for M7. |
| Raw ↔ rendered toggle (shortcut) | ✅ | ✓ | `src/render/readerMode.ts:26,80-96,129`; `tests/browser/readerSource.browser.test.ts` | `\` toggles; both surfaces. |
| Print-optimized mode | ✅ | **✓** *(M10, 2026-09-03)* | `src/theme/readerCss.ts` `@media print` block (task 6.1); `tests/browser/printMode.browser.test.ts`, Cr+Fx | Chrome hidden, page breaks respected, on both engines. The `@page` margin-box content (header/footer/page numbers) is a SEPARATE, PDF-export-specific fidelity question — see F9's PDF-export row; it does not gate this row's own criterion. |
| Focus/reading mode (typographic column) | ⭐ | ~ | `readerCss.ts:82-85,207`; `src/theme/fonts.ts:39-53` (bundled Literata) | The typographic column ships as the **default**; there is no focus-mode toggle that hides chrome. |
| Document mini-map | ⭐ | ✗ | 0 hits | — |

## F6. Live Updating & AI-Workflow Mode ⭐

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Auto-reload on file change | ✅ | ✓ | `src/watch/changeDetector.ts:89`; `src/watch/watchController.ts`; `src/watch/detectorForFile.ts`; `tests/browser/watchObserverWiring.browser.test.ts` | 2×2 detection: Chromium app page uses `FileSystemObserver`, everything else polls on content. |
| Configurable interval | ✅ | ✗ | `WATCH_INTERVAL_MS` is a constant (`contentWatch.ts:92`); `intervalMs` is injected **only for tests** (`contentWatch.ts:75-77`); no settings key | — |
| Watch mode: follow a file as an agent writes | ⭐ | ✓ | `src/watch/contentWatch.ts:92-112`; `src/app/appShell.ts:100-102`; `entrypoints/peekover.content.ts:126-130`; `tests/browser/watchContentWiring.browser.test.ts` | **Firefox content-script is degraded by platform** (`watchAvailability.ts:97-120`) and explains itself; app page watches on both engines. |
| Auto-scroll to newest content | ⭐ | ✓ | `watchController.ts`; `tests/browser/watchControl.browser.test.ts` ("AT THE BOTTOM appended content is FOLLOWED" / "SCROLLED AWAY leaves the reader UNMOVED") | Anchor-based, not `scrollTop`-based (D-3). |
| Subtle "updated" pulse | ⭐ | ✓ | `src/watch/watchControl.ts:194`; `tests/browser/watchControl.browser.test.ts` (flash on the control, never the document) | Neutralised under reduced-motion. |
| Snapshot history (IndexedDB) | ⭐ | ✓ | `src/app/snapshots.ts:63-113,300,346`; `src/app/idbCore.ts` (DB v3); `tests/browser/snapshotCapture.browser.test.ts`, `idbVersionchange.browser.test.ts` | Bounds: 15/doc, 20 MB, 30 days. Capture is a user-toggleable flag (`captureFlag.ts`). |
| Diff view — inline | ⭐ | ✓ | `src/render/diffEngine.ts:75`; `src/render/diffView.ts:137`; `src/render/diffChrome.ts:170`; `tests/browser/diffView.browser.test.ts` | **App page only** — `diffRegistry.ts` is registered by `appShell.installWatchForFile` and by nothing on the content-script graph (pinned by `diffRegistry.browser.test.ts`). |
| Diff view — side-by-side | ⭐ | ✗ | `diffView.ts:67-137` emits one sanitized block per hunk kind; no two-column mode | — |
| Compare any two files in the folder | ⭐ | **~** *(2026-08-13)* | `src/render/diffChrome.ts:387` `compareWith`; picker at `:308+` lists BOTH snapshots and files as two ARIA groups (D-3/D-4, `role="listbox"` at `:341`); `tests/browser/diffChrome.browser.test.ts` | **Current-vs-picked, not any-two.** `diffChrome.ts:165-166`'s own comment: *"`after` is always `getCurrentSource()`. Two picked files are never compared against each other."* This is a **sealed scope boundary, not an oversight** — spec 008 gate 1 ruled §9-5 "current-vs-picked", and its IS-NOT list names "any-vs-any and cross-folder comparison" explicitly. Up from ✗ (current-vs-**snapshot**-only) because a picked **file** is now a valid `before`, not because "any two" shipped. |
| Agent-file awareness: badge | ⭐ | **✓** *(2026-08-13)* | `src/render/agentFile.ts:77,95` (`AGENT_FILE_NAMES`, `isAgentFile`); `src/render/agentBadge.ts:111` `buildAgentBadge`; registered at `src/app/appShell.ts:888` and `src/render/runReader.ts:149` (`registerDocIdentity`); `tests/browser/agentBadge.browser.test.ts`, `agentBadgeNetwork.browser.test.ts` (zero bytes on wire, both surfaces) | Basename match against a frozen 5-name set (`CLAUDE.md`, `AGENTS.md`, `spec.md`, `plan.md`, `tasks.md`), case-sensitive, no content sniffing. |
| Agent-file awareness: tuned render defaults | ⭐ | **~** *(2026-08-13)* | `specs/008-persona-1-qol/spec.md:89` narrows "tuned" to presentation-only, nothing persisted, parser untouched (gate-1 §9-2, upheld); `progress.md` M8 task 6.1: *"§8-4 — the set is right"* (badge + table tools, walked together as the one presentation set a recognized file gets) | **Not a distinct feature — absorbed into the badge + table-tools rows above.** The literal reading (a per-document-class settings axis or parser reconfiguration) is explicitly IS-NOT (`tasks.md`: "parser reconfiguration of any kind"). Scored `~` rather than ✓ because no tuning exists beyond what the other two rows already credit — crediting it ✓ too would double-count the same shipped work a third time. |
| Session-transcript rendering (chat bubbles) | ⭐ | ✗ | 0 hits | — |
| Local MCP bridge | ⭐ | ✗ | 0 hits | Spec marks this post-v1 exploration. |

## F7. Theming & Appearance

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Light / dark / auto (system) | ✅ | ✓ | `src/settings/settings.ts:18-22,50`; `src/theme/reader.ts:87,134`; `src/theme/themeRegistry.ts:42-67`; `tests/browser/themeRuntime.browser.test.ts` | OS flips re-theme every registered host; manual beats media rule both directions. |
| GitHub-identical light & dark themes | ✅ | ✗ | Three themes exist (`settings.ts:18` — `light\|dark\|sepia`); no GitHub palette | — |
| ≥30 built-in document themes | ✅ | ✗ | Three (`settings.ts:18`) | 10% of the stated parity bar. |
| Themes contrast-checked | ✅ | ✗ | No contrast tooling, fixture, or test in the repo | The tokens were designed with contrast in mind (`readerCss.ts:24`) but nothing verifies it. |
| Custom CSS — global | ✅ | ✗ | 0 hits; no settings key | — |
| Custom CSS — per-origin | ✅ | ✗ | 0 hits | — |
| Custom CSS — per-document | ✅ | ✗ | 0 hits | — |
| 9+ font choices | ✅ | ✗ | `src/theme/fonts.ts:39-53` — **one** family (Literata), four faces | — |
| Custom font stack | ✅ | ✗ | 0 hits | — |
| Font size control | ✅ | ✗ | 0 hits | — |
| Line height control | ✅ | ✗ | 0 hits | — |
| Paragraph spacing control | ✅ | ✗ | 0 hits | — |
| Dyslexia-friendly font option | ✅ | ✗ | 0 hits | — |
| Per-file theme override | ✅ | ✗ | 0 hits | — |
| Per-folder theme override | ✅ | ✗ | 0 hits | — |
| Settings export/import (JSON) | ✅ | ✗ | `src/app/storageControls.ts:159` exposes describe/wipe/erase, not export/import | — |
| `storage.sync` across devices | ✅ | ✗ | Settings live in **IndexedDB** (`src/app/store.ts`, `settings/settingsPort.ts`); 0 `storage.sync` hits | Also makes §6-17's own wording inaccurate — see §6 below. |

## F8. Editor Mode

**★ RE-AUDITED AT M12's CLOSE (2026-10-30) — 5% → 17%.** M12 shipped F8's focused core: edit → live preview →
save-back (`decisions.md`, "M12 CLOSED"). Of 21 rows: 1 ✅ (the Read ↔ Edit toggle), 5 ~ (the two snapshot rows M6 already
had, plus the split pane, list continuation and find & replace), 15 ✗. Scored 1 for ✅ and 0.5 for ~ as everywhere here:
(1 + 2.5) / 21 = 16.7%. **Two ~ are CodeMirror's own defaults, not Peekover-built features** — `basicSetup` and
`markdown()` ship unmodified by ruling (`decisions.md`, "M12 TASK 1.1" and "M12 TASK 1.1 EXTENDED"); the spec's §6 keeps
Peekover's own versions deferred. Everything else below is ✗ unless noted. Save-back (File System Access write on
Chromium, a download elsewhere) is not an F8 row; it is the milestone's loop and is scored nowhere here.

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Read ↔ Edit toggle | ✅ | **✅** *(M12, 2026-10-30)* | `src/render/readerMode.ts` (`'edit'`), `src/render/editorEnhancer.ts` (the Edit / Stop editing control), `src/render/editorView.ts`; `tests/browser/editorNestedHost.browser.test.ts`, `editorWalkPolish.browser.test.ts`, both engines | A dedicated control, not the `\` key (plan D-1). The M6 gate's first-time-user expectation is met. |
| Split pane with scroll sync | ✅ | **~** *(M12, 2026-10-30)* | `src/render/editorView.ts`, `EDITOR_CSS` in `src/theme/readerCss.ts`; the 7.1 walk (A, B ok) | The split (source beside a live preview) ships; **scroll sync does not** — deferred by spec §6. |
| Visual table editor | ✅ | ✗ | — | — |
| CSV paste/import → markdown table | ✅ | ✗ | 0 `csv` hits | — |
| Formatting toolbar | ✅ | ✗ | — | — |
| Full keyboard shortcuts | ✅ | ✗ | Two shortcuts exist repo-wide (`\`, `` ` ``) | — |
| Smart lists / continuation | ✅ | **~** *(M12, 2026-10-30)* | `src/render/editorEngine.ts` (`markdown()` defaults: Enter → `insertNewlineContinueMarkup`) | CodeMirror's own continuation ships unmodified (ruled); no Peekover-built smart lists. |
| Find & replace with regex | ✅ | **~** *(M12, 2026-10-30)* | `src/render/editorEngine.ts` (`basicSetup`'s search panel, restyled from tokens at 3.5) | CodeMirror's own Ctrl-F panel (regex, replace) ships unmodified (ruled); no Peekover-built find & replace. |
| Markdown linting | ✅ | ✗ | No `markdownlint` dependency | — |
| Auto-format | ✅ | ✗ | — | — |
| Text transforms | ✅ | ✗ | — | — |
| Image paste → Base64 / save alongside | ✅ | ✗ | 0 `paste` hits | — |
| Snippets | ✅ | ✗ | — | — |
| Emoji picker | ✅ | ✗ | — | — |
| Import `.html → md` | ✅ | ✗ | No Turndown | — |
| Import `.ipynb → md` | ✅ | ✗ | — | — |
| Import plain text | ✅ | ✗ | — | — |
| Local drafts with autosave | ✅ | ✗ | No draft store; `idbCore.ts` stores folders/recents/pins/settings/snapshots | — |
| Version snapshots (IndexedDB) | ✅ | ~ | `src/app/snapshots.ts:300,346`; `tests/browser/snapshotCapture.browser.test.ts` | Snapshots ship — but keyed to **watched documents**, not editor drafts. |
| Restore or diff any snapshot | ✅ | ~ | Diff: `src/render/diffChrome.ts:242`. Restore: no code path | Half the item ships; restore does not exist. |
| Document metrics panel | ✅ | ✗ | 0 hits | — |

## F9. Export & Publishing

**★ RE-AUDITED AT M10's 11.3 (2026-09-06) — 0% → 38%.** M10 shipped the LOCAL half of F9 (HTML export,
PDF export, all three copy actions, the export shortcut) plus F5's print mode as its prerequisite; DOCX
export, ZIP export and the progress indicator were each dropped from M10 by a human scope-reduction ruling
(`decisions.md` M10 §3.10, §3.1(cont.), §8.3/§10.4 respectively — deferred to a future milestone, not
abandoned); the four publish paths remain out of scope on the pre-existing M11 routing decision.

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| HTML export (standalone, CSS inlined, images Base64) | ✅ | **~** *(M10, 2026-08-29)* | `src/export/htmlExport.ts`; `tests/browser/htmlExport.browser.test.ts`, Cr+Fx | Standalone file, CSS inlined — ships. Base64 image embedding does NOT ship (dropped, `decisions.md` M10 §3.1 — a local image reference is left unrewritten, the same as the app-page reader today). |
| DOCX export | ✅ | ✗ | No `docx` dependency (installed then removed, `decisions.md` M10 §3.10) | Dropped from M10 — busted the milestone's byte headroom in combination with a ZIP writer. Revisit-when: paired with F2 math shipping first. |
| PDF export (print pipeline) | ✅ | **~** *(M10, 2026-09-03)* | `src/app/exportControls.ts`'s `exportPdf`/`window.print()` (task 7.1); `tests/browser/pdfExport.browser.test.ts` | Ships via `window.print()` on the print-mode pipeline (F5, below). Chromium/app-page renders full fidelity (margin-box page numbers); Firefox and the content-script surface do NOT — a named, flagged residual (`decisions.md` 2026-09-03), not a silent gap. |
| Copy as rich text | ✅ | **✓** *(M10, 2026-09-03)* | `src/export/htmlExport.ts`'s `copyAsRichText` (task 4.1); `tests/browser/copyAsRichText.browser.test.ts`, Cr+Fx | Semantic markup only, no reader stylesheet — pastes with the target's own styling. |
| Copy as HTML | ✅ | **✓** *(M10, 2026-08-29)* | `src/export/htmlExport.ts`'s `copyAsHtml` (task 3.3); `tests/browser/copyAsHtml.browser.test.ts`, Cr+Fx | Same standalone-HTML artifact as the file export, to the clipboard. |
| Copy as plain text | ✅ | **✓** *(M10, 2026-09-03)* | `src/export/copyPlainText.ts` (task 3.4); `tests/browser/copyAsPlainText.browser.test.ts`, Cr+Fx | Raw source, byte-identical, reused from 008 D-10's mechanism. |
| Publish → GitHub Gist | ✅ | ✗ | 0 hits; no token storage | Deferred to M11 on a routing decision (spec 010 §3.1/§6) — the product's first deliberate, credential-bearing outbound network path. |
| Publish → GitHub repo | ✅ | ✗ | 0 hits | Deferred to M11, same routing decision. |
| Publish → Medium | ✅ | ✗ | 0 hits | Deferred to M11, same routing decision. |
| Publish → Dev.to | ✅ | ✗ | 0 hits | Deferred to M11, same routing decision. |
| ZIP export | ✅ | ✗ | No ZIP-writer dependency (`client-zip` installed then removed, `decisions.md` M10 §3.1(cont.)) | Dropped from M10 — shorn of local-image copying (§3.1), it was near-redundant with Copy-as-plain-text. Revisit-when: paired with the local-image/seam-extension work. |
| Export shortcut (Ctrl/Cmd+S) | ✅ | **✓** *(M10, 2026-09-03)* | `entrypoints/app/main.ts` (task 8.1); `src/settings/settings.ts`'s `lastExportFormat` (task 8.2); `tests/browser/exportShortcut.browser.test.ts`, Cr+Fx | App-page-only (D-5), the same scoping precedent F6's app-page-only rows already use. Defaults to HTML export (Ruling M-1) before any export has ever run. |
| Progress indicator for heavy documents | ✅ | ✗ | 0 hits | Dropped from M10 (`decisions.md` M10 §8.3/§10.4, Ruling 8.3) — task 10.2 measured no surviving M10 export as heavy enough to need one (0.30–26.95 ms across the corpus); a MEASURED non-build, not an unbuilt gap. |

## F10. AI Features

**No AI layer of any kind exists.** No provider SDK, no key storage, no on-device API
feature-detection, no WebCrypto usage (0 `webcrypto` hits).

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| On-device AI (Chrome built-in task APIs) | — | ✗ | 0 hits for Summarizer/Translator/Proofreader/Writer | — |
| BYOK (key stored locally, WebCrypto-encrypted) | — | ✗ | 0 `webcrypto` hits; no key store in `idbCore.ts` | — |
| Summarize document / section | ⭐ | ✗ | 0 hits | — |
| Explain selection | ⭐ | ✗ | 0 hits | — |
| Chat with the document | ⭐ | ✗ | 0 hits | — |
| Rewrite with inline diff preview (accept/reject) | ⭐ | ✗ | 0 hits | The diff engine (`diffEngine.ts:75`) would serve this directly. |
| Translate document/selection | ⭐ | ✗ | 0 hits | — |
| Generate: outline | ⭐ | ✗ | 0 hits | — |
| Generate: table from description | ⭐ | ✗ | 0 hits | — |
| Generate: Mermaid from description | ⭐ | ✗ | Doubly blocked (no AI, no Mermaid) | — |
| Generate: alt-text for images | ⭐ | ✗ | 0 hits | — |
| Proofread (on-device Proofreader API) | ⭐ | ✗ | 0 hits | — |
| AI-assisted web-clip | ⭐ | ✗ | 0 hits | — |
| Guardrail: one-time opt-in explainer | — | ✗ | 0 hits | — |
| Guardrail: per-action network indicator | — | ~ | `src/render/remoteMediaUi.ts:21-34,60`; `tests/browser/remoteMedia.browser.test.ts` | **The indicator mechanism ships** and is bytes-on-wire proven — for remote media. Reusable verbatim for AI calls. |
| Guardrail: no implicit AI call | — | ✗ | Vacuously true (no AI) | Not credited — nothing enforces it. |

## F11. Setup, Onboarding & Help

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| Auto-opening interactive setup guide on install | ✅ | ✗ | No `runtime.onInstalled` listener in `entrypoints/background.ts:35-58` (three listeners: action, settings, watch relay) | — |
| Detects "Allow access to file URLs" grant | ✅ | ✗ | 0 hits; `isAllowedFileSchemeAccess` never called | **The category's #1 friction, and the spec's own best-in-class claim.** See uncertain-items §2. |
| Deep-links to the exact toggle | ✅ | ✗ | As above | — |
| Zero-config: remote `.md` works before any permission | ✅ | ✓ | `wxt.config.ts:18` (`permissions: []`, CI-pinned by `tests/manifest.test.ts`); `peekover.content.ts:35-39` | Structurally true — the four raw hosts render with no grant at all. |
| Demo document showcasing every feature | ✅ | ✗ | `tests/fixtures/hello.md` and `tests/golden/fixtures/*` are test inputs, not a demo doc; no bundled `.md` asset | Spec calls this the visual QA page **and** the marketing screenshot (§7 process req 3). |
| Command palette (Ctrl/Cmd+K) | ✅ | ✗ | 0 hits | §7-5 names it "the spine" of the keyboard story. |
| Full keyboard shortcut map (customizable) | ✅ | ✗ | Two hardcoded shortcuts (`readerMode.ts:26`, `tocView.ts:882`); no map, no customization | — |
| Cheat-sheet overlay (`?`) | ✅ | ✗ | 0 hits | — |
| Extension-conflict detection | ✅ | ✗ | 0 hits | — |

## F12. Internationalization & Accessibility

| Item | ✅/⭐ | Status | Evidence | Notes |
| --- | :---: | :---: | --- | --- |
| UI localization (EN+ZH+JA+ES+DE+FR+PT+KO) | ✅ | ✗ | No `_locales/`, no `i18n` hits; every string is an inline English literal (e.g. `capability.ts:36`, `recentsView.ts:96`, `watchAvailability.ts:97-120`, `storageControls.ts:34`) | Strings are scattered across ~15 modules — extraction is real M7 work, not a wrapper. |
| Community translations via repo | ✅ | ✗ | Depends on the above | — |
| RTL document support | ✅ | ✗ | 0 `dir=`/`rtl` hits in `readerCss.ts` or `mount.ts` | — |
| WCAG: full keyboard operability | ⭐ | ~ | `treeView.ts` (roving tabindex, arrow/Enter/Space), `tocView.ts` (ARIA-APG pattern), `readerMode.ts:129`, `themeControl.ts` | Every shipped control is keyboard-operable; no audit, no automated a11y assertion, and no palette (F11) as the promised spine. |
| WCAG: screen-reader landmarks | ⭐ | ~ | `nav` landmark (`tocView.ts:14`); `aria-label` across 19 modules; `role="status"` (`remoteMediaUi.ts:31`) | Landmarks used consistently; never audited end-to-end. |
| WCAG: contrast-checked themes | ⭐ | ✗ | No contrast tooling or fixture in the repo | — |
| WCAG: reduced-motion support | ⭐ | ✓ | `src/theme/readerCss.ts:76` (global `@media (prefers-reduced-motion:reduce)` with `animation-duration:.001ms!important`), honoured by design in `tocView.ts:172`, `readingAnchor.ts:134`, `watchControl.ts:194`, `watchController.ts:586` | Motion is neutralised by **one global rule** rather than per-feature opt-in — the strongest a11y property shipped. |

---

## §6. Security & Privacy Specification

| # | Item | Status | Evidence | Notes |
| ---: | --- | :---: | --- | --- |
| 1 | No server | ✓ | No backend anywhere in the repo; `package.json` has no server dependency; `docs/ai/architecture.md` | Structural, not a claim. |
| 2 | Zero network by default + visible network indicator on every outbound call | ✓ | `src/render/mediaPolicy.ts:59,138` (remote media neutralised pre-DOM); `src/render/remoteMediaUi.ts:21-34`; bytes-on-wire tests: `tests/browser/remoteMedia.browser.test.ts`, `watchNetwork.browser.test.ts`, `tocNetwork.browser.test.ts`, `folderMode.network.browser.test.ts` | Four independent real-engine network guards. The strongest-evidenced item in the spec. |
| 3 | No telemetry/analytics/error beacons; local "copy debug report" button | ~ | No telemetry ✓ (proven by the four network suites above). **No debug-report button** — 0 hits | The negative claim holds; the positive affordance does not exist. |
| 4 | No remote code; dynamic imports banned, **verified in CI** | ✓ | MV3 on both engines (`wxt.config.ts:11`); fonts inlined as data-URIs (`fonts.ts:32`); no CDN reference; **`scripts/check-dynamic-imports.ts` + `.github/workflows/supply-chain.yml`** (`remote-code` job, on PR + push-to-main + weekly cron + dispatch) | **Re-audited at `d470ab2`; was PARTIAL for "ci.yml has no such check", which is now false.** Verified locally at HEAD: the self-test exits 0 with **15/15 (7 firing + 8 silent)** and the real scan exits 0 over **54 shipped files** across `src`, `entrypoints`. The self-test is the load-bearing half — zero dynamic imports exist today, so the real scan passes trivially and would pass identically if the scanner broke (retro 2026-07-27 finding 1(a)'s class); CI runs it **first**. Scope of the ban is specifier-staticness, not `import()` — `decisions.md` 2026-07-27 (b). |
| 5 | MV3, service-worker based, no persistent background page | ✓ | `wxt.config.ts:11` (MV3 forced on Firefox too, not just Chrome); `entrypoints/background.ts:35-58` holds **no state** — three listeners, no timer, no registry | The watch loop lives in the page precisely so an MV3 eviction loses nothing. |
| 6 | Minimal permissions; per-origin host access requested at moment of use; `PERMISSIONS.md` | ~ | `wxt.config.ts:18` — `permissions: []`, **byte-pinned by `tests/manifest.test.ts` (2975 B, unmodified since M2)**; `docs/trust/PERMISSIONS.md` exists | Permission surface is smaller than the spec asks for ✓. But host access is **static manifest `matches`**, not optional and not requested at use — the "per-origin, at moment of use" half is unbuilt. |
| 7 | Permission-diff policy (never silently add; changelog + in-product notice) | ~ | AGENTS.md #4 + the manifest byte-pin enforce the *process*; every milestone re-proved `permissions: []` | **No `CHANGELOG.md` in the repo and no in-product notice mechanism.** The discipline is real; the two user-facing artifacts are not. |
| 8 | Sanitization: DOMPurify strict allowlist, SVG sanitized, strict CSP, sandboxed embeds, block remote images | ~ | Allow-list `sanitize.ts:22-65`; `data:` hook `:131-135`; SVG/iframe/object **excluded entirely** from `ALLOWED_TAGS`; remote-image blocking `mediaPolicy.ts:138` with opt-in bar `remoteMediaUi.ts:60`; `tests/browser/sanitize.browser.test.ts` | Four of five sub-claims hold, some by denial rather than sanitization (stronger). **No `content_security_policy` key is declared** in `wxt.config.ts` — the property rides on MV3's platform default rather than an explicit, auditable line. |
| 9 | Locked minimal deps; `npm audit` + OSV in CI; no install scripts; Dependabot; SBOM per release | ~ | `pnpm-lock.yaml` present; **5 runtime dependencies** *(4 at the `d470ab2` audit; `mermaid ^11.16.0` added at M7 as the fifth, a governed act — spec 007 §3.12)* — still minimal; `.github/workflows/supply-chain.yml` (`audit`, `osv`, `sbom` jobs); `.github/dependabot.yml`; `scripts/generate-sbom.ts` | **Re-audited at `d470ab2` — a STRONG partial now, not the weak one above: 4 of 5 sub-clauses SHIPPED.** Locked/minimal ✓ · `pnpm audit --prod --audit-level low` **blocking** ✓ (full tree advisory by a recorded call, `decisions.md` 2026-07-27 (a)) · OSV ✓ by CI wiring (`google/osv-scanner-action@v2.2.4` + SARIF upload; not locally verifiable — it runs on GitHub, and workflow wiring is "demonstrably wired into a production entrypoint" under this document's own legend) · no install scripts ✓ (**0 `requiresBuild: true` in `pnpm-lock.yaml`**; the only `postinstall` is Peekover's own `wxt prepare`) · **SBOM published per release ✗ — the item still fails, and the reason changed.** See the §6-9 note below. |
| 10 | Reproducible builds; release hashes; signed tags; attestations | ✗ | No release workflow; `ci.yml` runs on `pull_request` only; no attestation config | No release has happened yet, but nothing is in place for one. |
| 11 | Publisher account security (passkeys/2FA + recovery plan) | ✗ | No such document in `docs/trust/` (contains `PERMISSIONS.md`, `SECURITY.md` only) | Named by the spec as where extension hijacks usually start. |
| 12 | Open source (MIT/Apache-2.0), full source incl. build scripts | ✓ | `LICENSE` (MIT, 2026 Mo Suvo); `wxt.config.ts`, `scripts/`, `.github/workflows/` all tracked | — |
| 13 | Threat model document published in the repo | ✗ | Zero occurrences of "threat model" outside `spec.md` itself | — |
| 14 | `SECURITY.md` — disclosure channel, response-time commitment, hall of fame | ✓ | `docs/trust/SECURITY.md` — `hello@peekover.dev`, 48 h ack target, hall-of-fame section | All three sub-clauses present. |
| 15 | Community audit invitation + third-party scanner reports | ✗ | 0 hits in `README.md`, `site/index.html`, `docs/trust/` | Launch-time item. |
| 16 | Ownership pledge in README **and** site | ✓ | `README.md:9` ("never sold — an ownership change voids the listing"); `site/index.html` carries the same pledge language | Both surfaces. |
| 17 | Data locality: settings in `storage.sync`, drafts/snapshots in IndexedDB, AI keys WebCrypto, one-click wipe-all | ~ | Snapshots in IndexedDB ✓ (`snapshots.ts:300`, DB v3); wipe-all ✓ (`storageControls.ts:159`, `tests/browser/wipe.browser.test.ts`, `eraseSnapshots.browser.test.ts`) | **Settings are in IndexedDB, not `storage.sync`** (`store.ts`, `settingsPort.ts`) — the spec sentence is factually wrong about the shipped product. No drafts, no AI keys. |

**§6 is the healthiest section in the spec at 59%** (was 56% before the `d470ab2` re-audit) — and its
gaps still cluster in *release engineering* (items 9–11, 13, 15), not in *architecture*. Everything that
removes a class of risk is built; **most** of what publishes proof of it now is too. The residue is the
part that needs a release to exist: items 10, 11, 13 and 15 are untouched, and §6-9's last sub-clause is
the same shape.

**★ THE §6-9 SBOM SUB-CLAUSE — WHY IT STAYS ✗, AND A DISCREPANCY THIS RE-AUDIT FOUND.** "Published per
release" has never fired, and cannot yet: **`git tag -l` is empty — no tag has ever been cut in this
repo.** That alone is the §6-10 pattern (mechanism plausible, never verified) and would hold the
sub-clause at ✗ on its own. But the mechanism is also **not reachable from a tag push as written**:
`supply-chain.yml`'s `on.push` is filtered to `branches: [main]` with **no `tags:` key**, so pushing
`v0.1.0` triggers no run at all, and the `sbom` job's `if: startsWith(github.ref, 'refs/tags/')`
release-attach step can only be reached by a manual `workflow_dispatch` against a tag ref.
`decisions.md` 2026-07-27 states the step *"is written and will fire on the first tag"* — **the first
half is true, the second is not supported by the trigger block.** Recorded here rather than fixed: the
archive pass that found it is docs-only by scope fence, and `.github/` is outside it. **The fix is one
line** (`tags: ['v*']` under `on.push`) and belongs with whoever cuts the first release, alongside
§6-10's hashes and attestations.

## §7. UI/UX Specification

| # | Item | Status | Evidence | Notes |
| ---: | --- | :---: | --- | --- |
| 1 | Real visual identity, typography-first, not a template | ✓ | `design/tokens.css`, `design/brand.html`; bundled Literata (`src/theme/fonts.ts:39-53`, four faces, data-URI); `src/theme/readerCss.ts` (761 lines, tokens only) | Paper/ink/one-highlighter; no framework CSS anywhere. |
| 2 | Document is the hero; chrome quiet, collapsible, auto-hiding on scroll | ~ | Chrome is a **sibling** of the reading column by construction, pinned per-surface (`tests/browser/themeControl.browser.test.ts`, `watchControl.browser.test.ts`, `diffChrome.browser.test.ts`); TOC collapsible (`tocView.ts:80`) | Quiet ✓ and collapsible ✓; **no auto-hide on scroll**. |
| 3 | Motion with meaning, 150–250 ms, `prefers-reduced-motion` respected | ✓ | `readerCss.ts` — every transition is `.15s` (lines 118, 235, 257, 293, 386, 415, 464, 531, 587, 599); global reduced-motion override at `:76` | In band, consistently, and neutralised globally. |
| 4 | Instant feel: first paint of real content < 150 ms | ~ | Perf harness `scripts/perf-first-paint.ts`; gate **re-baselined `<150` → `<165` ms** at `8255380` (`decisions.md` 2026-07-26) | The mechanism and the measurement discipline ship; **the spec's stated number is not currently met** and the working-day floor question is routed to M7. |
| 5 | Keyboard-first, command palette as the spine | ✗ | No palette; two shortcuts repo-wide | The "spine" is missing; individual controls are keyboard-operable (see F12). |
| 6 | Dark mode as a first-class art piece (tuned syntax palettes, re-themed diagrams, adapted images) | ~ | Dark is a designed token set, not an inversion (`readerCss.ts`, `themeRegistry.ts:42-67`); `tests/browser/themeRuntime.browser.test.ts` proves OS-flip re-theming. **Re-verified 2026-08-03:** the **diagrams** sub-surface now ships — `diagramEngine.ts:417` `diagramEngineConfigFor(theme)` + the theme-keyed cache, `tests/browser/diagramTheme.browser.test.ts` | The theme itself ✓, and **one of the three named sub-surfaces is now real** (diagrams, app page). **Still `~`:** tuned syntax palettes depend on F3 (0%) and image adaptation on F2's remaining ⭐ row — two of three absent, so the item does not move off PARTIAL. |
| 7 | Empty states and errors are designed moments | ✓ | Never-blank fallback with banner (`src/render/mount.fallback.test.ts`, `runReader.fallback.test.ts`); designed idle/denied/unsupported states (`appShell.ts:1018-1032`, `capability.ts:36-49`); empty recents (`recentsView.ts:165`); designed watch-degraded explanations (`watchAvailability.ts:97-120`) | The most consistently applied principle in the codebase. |
| 8 | Details users feel: scrollbars, selection color, focus rings, favicon per state, texture, typeset print | ~ | `::selection` (`readerCss.ts:75`), `:focus-visible` ring (`:74`), icon assets (`assets/icons`, `design/icons.html`) | **No custom scrollbars, no per-state favicon, and no print CSS at all.** Three of six sub-details absent. |
| 9 | Design tokens defined before build | ✓ | `design/tokens.css` predates the render pipeline; `readerCss.ts` references tokens exclusively, never literals (AGENTS.md style rule) | — |
| 10 | Every feature ships with its designed state, not "functional now, pretty later" | ✓ | Six milestone-close human gates, all recorded; M6's caught three layout defects fixed **before** close (`e231941`, `8255380`) | Process evidence rather than file evidence, and it is the right evidence for this item. |
| 11 | The demo document doubles as the visual QA page | ✗ | No demo document exists (see F11) | Visual QA currently runs on test fixtures and 80+ Playwright screenshots instead. |
| 12 | Website and extension share the same design language | ✓ | `site/index.html` (52 KB) uses the same custom properties as the extension — `--ink` ×28, `--paper` ×16, `--accent` ×8 — and references Literata | Same token vocabulary, not merely a similar look. |

---

## Dependencies audit

`package.json` declares **5 runtime dependencies** *(4 until M7; `mermaid ^11.16.0` is the fifth)*.
§10 of the spec names **14 stack layers**, of which **9** require a runtime library that is not
installed. A missing dependency is load-bearing absence evidence: the feature cannot be shipped and
no amount of pipeline design substitutes.

| §10 layer | Declared choice | Installed? | Gap |
| --- | --- | :---: | --- |
| Extension framework | WXT + TypeScript | ✓ dev (`wxt ^0.20.27`) | — |
| UI (reader view) | None — vanilla TS + CSS vars | ✓ by construction | Zero UI framework in the tree, as specified. |
| Markdown | markdown-it **+ plugin ecosystem** (footnote, deflist, abbr, emoji, anchor, front-matter, alerts) | ~ `markdown-it ^14.3.0`, `markdown-it-task-lists ^2.1.1` | **1 of 8 plugins installed.** Directly explains F1's 15 ✗ rows. |
| Sanitization | DOMPurify | ✓ `dompurify ^3.4.12` | — |
| Highlighting | Shiki (lazy) | ✗ | **F3 = 0%.** |
| Math | KaTeX (+ MathJax lazy chunk) | ✗ | **F2's seven math/formula rows all ✗** — unchanged by M7. |
| Diagrams | Mermaid; viz.js later | ✓ `mermaid ^11.16.0` | **Provisioned at M7** — the persona-#1 killer-feature gap, closed on the app-page reader. Emitted as **lazy async chunks behind one `import()`**, never statically inlined, and kept off the content-script graph (`diagramImportFence.test.ts`). viz.js still ✗. |
| Editor | CodeMirror 6 | ✓ `codemirror ^6.0.2`, `@codemirror/lang-markdown ^6.5.2` | **Provisioned at M12 (1.1)**, lazy, app-page-only, behind the one-importer fence (`editorEngine.ts`); zero bytes in the content script. **F8 = 17%.** |
| Diff | `diff` + custom renderer | ✓ `diff ^9.0.0` | Added at M6 — the first `dependencies` addition since M1, taken as a governed act. |
| Search | MiniSearch | ✗ | Blocks F5 cross-file search. |
| Clipper/import | Readability + Turndown | ✗ | Blocks F4 clipper and F8 html→md import. |
| Export | docx, JSZip, print pipeline | ✗ | **F9 = 0%.** Print pipeline needs no dependency at all — just `@media print` rules that do not exist. |
| Tests | Vitest + Playwright | ✓ dev (`vitest 4.1.10`, `playwright ^1.61.1`) | 38 browser suites, 9 golden fixtures. |

**Read this way: 5 of the 14 layers are provisioned** *(4 until M7)*. The un-provisioned nine still
map closely onto the spec sections scoring lowest. Peekover's coverage is not limited by architecture
— it is limited by which libraries have been let in, which has been deliberate. **M7 is the first
milestone to test that sentence in the other direction:** one governed addition moved one section
from 3% to 42%.

**Re-audit note (`d470ab2`): the dependency SET is unchanged — still 4 runtime, still 11 dev — but it is
now GOVERNED, which the first audit could not say.** `.github/dependabot.yml` raises grouped weekly PRs
for minor+patch on both ecosystems and **ignores majors deliberately**, because a major on any of the four
runtime deps is the same weight of decision as an addition (dompurify 3→4 is AGENTS.md #3 territory;
markdown-it majors re-bake every golden file). `pnpm audit --prod` is a blocking CI gate and the tree is
clean at 0; the 7 advisories in the full tree are all transitive devDependencies of `wxt`/`eslint`/
`@vitest/browser-playwright` and are reported, not suppressed. **No new dependency was taken to do any of
this** — the SBOM generator is hand-rolled precisely because installing `@cyclonedx/cyclonedx-npm` to
satisfy a *minimal-dependencies* claim would be self-defeating (`decisions.md` 2026-07-27 (d)).

**Re-audit note (`59dcb20`, 2026-08-03): the SET moved for the first time since M6 — 4 → 5 runtime**,
`mermaid ^11.16.0`, taken on the M6 process and priced at spec 007 §3.12 (transitive tree enumerated,
licences permissive, in the SBOM, `pnpm audit --prod` still 0 blocking). The paragraph above remains
correct as the `d470ab2` reading; the governance it describes is what the fifth addition went through.

## Cross-milestone touch map

| Milestone | Spec sections its work landed in |
| --- | --- |
| **M1** · `001-core-rendering` | **F1** (CommonMark, GFM tables, task lists, strikethrough, autolinks, inline-HTML sanitization, one-parser rule) · **F4** (`file://` + raw-host rendering) · **F5** (raw↔rendered toggle) · **§6** (2, 4, 5, 8 — the sanitizer, MV3, zero-network) · **§7** (1, 3, 7, 9 — identity, motion, never-blank, tokens) |
| **M2** · `002-active-source-foundation` | **F4** (folder drag-and-drop) · **F5** (folder browser, tree view, name search/filter, recents, pins) · **§6** (6 — `permissions: []` byte-pinned; 17 — data locality + wipe-all) · **§7** (7 — designed grant/denied/empty states) |
| **M3** · `003-toc-navigation` | **F5** (TOC sidebar, scroll-spy, smooth scroll, resizable, keyboard toggle) · **F12** (screen-reader landmarks, keyboard operability) · **§7** (2, 8) |
| **M4** · `004-themes-settings` | **F7** (light/dark/auto — the section's only ✓) · **F5** (TOC state persistence) · **§6** (17 — settings storage) · **§7** (4 — first-paint measurement discipline) |
| **M5** · `005-watch-diff` | **F6** (auto-reload, watch mode, follow-newest, update pulse) · **§6** (2 — the watch-relay network guard; 6 — `permissions: []` survived a whole capability) |
| **M6** · `006-snapshots-diff` | **F6** (snapshot history, diff view) · **F8** (version snapshots, partial) · **§6** (17 — snapshot storage, disclosure, erase; the PERMISSIONS.md trust-claim correction) · **§7** (7, 8 — storage-panel and Compare-pill design defects caught at the gate) |
| **§6 side-quest** · `d470ab2` (post-M6, not a milestone) | **§6** (4 — the dynamic-import scanner + its self-test, wired in CI: PARTIAL → SHIPPED · 9 — `pnpm audit`, OSV+SARIF, Dependabot, SBOM generator: 4 of 5 sub-clauses now shipped) · **§6-17** (the `storage.sync` → IndexedDB correction of record, tailed into §9 and F7 at the archive pass). **The first entry in this table that shipped no `src/` code** — it is release engineering, and it exists because this audit named the gap. |

| **M7** · `007-mermaid-diagrams` | **F2** (Mermaid rendering, theme sync, hash-keyed cache, cache clear + disclosure, PNG/SVG copy & download, zoom/pan lightbox, progressive post-mount enhancement — 3% → 42%) · **§6** (2 — a fifth network guard, `diagramNetwork.browser.test.ts`; 6 — `permissions: []` survived a fifth dependency and a lazy chunk, with no `web_accessible_resources`; 8 — a second, SVG-shaped sanitizer profile with the document profile untouched; 9 — the first dependency addition since M6, through the governed process; 17 — the diagram cache disclosed, bounded and erasable) · **§7** (6 — the "re-themed diagrams" sub-surface; 3, 7 — placeholder motion and the degrade-to-source-fence states) |
| **M8** · `008-persona-1-qol` | **F5** (table tools: sort ✗→✓, quick filter ✗→✓, copy CSV/Markdown ✗→~ — no JSON) · **F6** (agent-file badge ✗→✓; tuned render defaults ✗→~, absorbed into the badge/table-tools set, not a distinct feature; compare any two files ✗→~, current-vs-picked, sealed narrower than "any two" by gate-1 §9-5) · **§6** (6, 8 — `permissions: []` and the sanitizer allow-list both survived a +10,486 B content-script / +10,503 B app-page reach, zero dependency added) · **§7** (unmoved — no new theming, motion or token work) |
| **M9** · `009-code-blocks` | **F3** (Shiki syntax highlighting, per-block toolbar, collapsible long blocks, code themes — 0% → 78%) · **§6** (a sixth dependency, `shiki`, through the governed process; `permissions: []` and the sanitizer allow-list both survived) · **§7** (unmoved) |
| **M10** · `010-local-exports` | **F9** (HTML export ~, PDF export ~, copy as rich text/HTML/plain text ✓, export shortcut ✓ — 0% → 38%; DOCX export, ZIP export and the progress indicator each dropped by a human scope-reduction ruling, not shipped) · **F5** (print-optimized mode ✗→✓) · **§6** (net **zero** new dependencies — `docx` and a ZIP writer were installed at task 1.1 and both later removed; `permissions: []` and no `web_accessible_resources` survived) · **§7** (unmoved) |
| **M11** · `011-math-rendering` | **F2** (inline `$…$` ✗→✓, block `$$…$$` ✗→✓, code-fence math ✗→✓, the default engine row ✗→✓ (Temml/MathML, a ruled substitution for the spec's own named KaTeX), copy-as-LaTeX ✗→~, copy-as-MathML ✗→~ (document-level actions, not right-click) — 42% → 68%; MathJax fallback toggle stays ✗ permanently by ruling, not shipped) · **§6** (net **+2** dependencies at close — `-katex`, `-@mathjax/src`, `+@mdit/plugin-tex`, `+temml`; `permissions: []` and no `web_accessible_resources` survived a bundled font asset) · **§7** (unmoved — no new theming, motion or token work) |

~~**F3, F9, F10, F11 have never been touched by any milestone.**~~ **F10 and F11 have never been touched
by any milestone** — F3 left this list at M9 (0% → 78%), F9 left it at M10 (0% → 38%). F7 was touched once
and moved 6%.
**F2 left the "one-milestone-only" club at M11** — it moved a SECOND time (42% → 68%, 2026-09-11), after
M7's own 3% → 42% — and it is no longer the section whose remaining ✗ rows are a materially different
feature from the ones that landed: M11 shipped the math half M7 left untouched, so what remains (additional
engines, standalone diagram-file rendering, dark-mode image adaptation, and MathJax permanently struck) is
three named scope deferrals plus one ruled-permanent absence, not a whole missing feature. F10 and F11
remain the only untouched ground going into the next milestone.

## What's genuinely uncertain and needs an eye-check

No item was scored `? UNCLEAR` — every row resolved on file evidence. **Five** items resolved on
evidence but carry a question a human walk would answer better than a grep (§5 added 2026-08-03):

1. **The single-file-drop open question (`progress.md` §Blockers, lines 490–503) is now half
   answered, and the answer changes it.** Check (1): **yes — `docs/product/spec.md` F4 names
   "Drag-and-drop a file onto any tab → render" explicitly.** So folder-only is a *gap*, not a
   design boundary, and the "folder-only by design" inference in that bullet is wrong at the spec
   level. Check (2): the handler does **not** bail silently — `folderSource.ts:200-206` returns
   `{ ok: false, reason: 'cancelled', message: 'Drop a folder to open it.' }`, which
   `appShell.ts:1022-1029` paints via `paintIdle`. **The eye-check question:** the human observed
   "does nothing". If the message *is* painted, the report was a visibility problem
   (`paintIdle` may replace an already-granted view rather than notifying beside it). Drop a
   single `.md` on the app page with a folder already open and watch what the shell does.
2. **Does the `file://` permission story actually work for a first-time user?** F11's detector and
   deep-link are ✗, and F4's `file://` rendering is ✓ — meaning the feature works only for a user
   who already found Chrome's "Allow access to file URLs" toggle unaided. Every automated test
   runs past this. **The question:** install the unpacked build in a clean profile, open a local
   `.md`, and record what a user with no prior knowledge sees. This is the category's #1 friction
   and the spec's own best-in-class claim.
3. **Whether the three shipped themes actually meet contrast targets.** §7-1 and F12 both assert
   contrast-checked themes; the tokens were designed for it (`readerCss.ts:24`) but nothing in the
   repo measures it. **The question:** run the three themes through a contrast checker at body,
   muted, and faint token levels — cheap, and it converts two ✗ rows to ✓.
4. **Whether the diff view being app-page-only is a decision or a gap.** `diffRegistry.ts`
   registers on the app page and provably nowhere else, and that absence is *designed* (D-14) and
   *tested* (`diffRegistry.browser.test.ts`). The spec's F6 diff bullet names no surface.
   **The question for scoping:** does an AI-tool developer reading `CLAUDE.md` at a `file://`
   URL — the persona's most common path — expect Compare there? If yes, this ✓ is really a ~.
5. **★ NEW 2026-08-03 — whether F2's seven ✓ rows should be ~, because diagrams are app-page-only.**
   `enhanceDiagrams` is reached from `appShell.ts:139` and `readerPane.ts:185` and provably from
   nowhere on the content-script graph (`diagramImportFence.test.ts`, a source-graph assertion, not a
   byte reading). That absence is **decided** (007 §3.2: the content script has no storage of its own,
   and a lazy chunk there would need `web_accessible_resources`, a forbidden manifest key) and **gate 1
   upheld it**, including the call to ship no explanatory note on that surface. So this is item 4's
   question one milestone on, and sharper: unlike Compare, **the same document renders differently on
   the two surfaces** — a `mermaid` fence is a diagram on the app page and a code fence at a `file://`
   URL. This audit scored ✓ on the F6 precedent (`Diff view — inline` is ✓ with an app-page-only note)
   so F2 is not held to a stricter rule than F6; **if a human decides app-page-only is a gap rather
   than a boundary, items 4 and 5 move together and F2 drops from 42% to roughly 24%** (seven ✓ → ~).
   **The question:** open a `file://` markdown document containing a `mermaid` fence, then open the
   same file through the app page, and judge whether the difference reads as a scoped feature or as a
   missing one. *(Recording the arithmetic, not choosing the answer — the score above stands until a
   human moves it.)*
   **★ ANSWERED 2026-08-03 — the human ran this walk and ruled GAP, on the surface as a whole
   (diagrams, and with them diff and snapshot history).** What moved is the **persona figure**:
   persona #1 is **56%** on the gap lens — see § Summary's settled entry, which also records the 67%
   boundary arm that was not chosen. What did **NOT** move is this document's row-level scoring:
   **the F2 42% → ~24% re-score this item's own arithmetic names is CARRIED, not applied**, and item
   4 (diff view) is carried with it. A row-level re-audit is what discharges them; until it runs,
   F2's seven ✓ and the F6 rows stand as written.
