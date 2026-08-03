# Spec 008 — Persona-#1 QoL: compare any two files, agent-file awareness, table tools

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **008 delivers M8** — the three persona-#1 items deferred at M7's direction: compare any two files (F6), agent-file awareness (F6), table tools in the reading view (F5). Direction and its deferrals are `docs/ai/decisions.md` 2026-07-27 (M7 DIRECTION); **this spec is the WHAT, and it does not re-argue the direction.** What it *does* do is report what each item costs against the actual tree, because two of the three are a different size than the direction decision could have known.
**Date:** 2026-08-03
**Milestone:** M8 · builds on 007 (Mermaid + diagram cache, CLOSED 2026-08-02 at task 9.3)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 007's section shape exactly — §3 decided calls, §4 EARS, §6 the IS-NOT fence, §7 plan-stage risks, §8 gate-3 measure-then-choose, §9 gate-1 questions — so nothing here is a new artifact shape.
**Evidence base:** a **scope-read of the current tree at HEAD `81986d8`**, done before this draft and reported with it. It rests on the M7 direction decision, `docs/ai/spec-coverage.md` 2026-08-03 (persona #1 at **56%**, gap lens; F5 at 29%, F6 at 46%), `docs/product/spec.md` §3 and §5 (F5/F6), the § Baselines table in `docs/ai/progress.md`, the content-script feasibility spike (`81986d8`), and `docs/trust/PERMISSIONS.md` as it stands. **Every `file:line` cited here must be re-derived by `plan.md` against the actual tree, not inherited** — 006 and 007 make the same demand for the same reason.

---

## 1. Problem & value

M7 closed persona #1's largest hole — the diagrams agents draw now render. What is left in that persona's column is not one hole but three small ones, and they share a shape: **each is a thing the user can already almost do, stopped by a missing seam rather than by a missing capability.**

- The diff engine already compares any two strings. The picker only offers snapshots of the file you are reading.
- The reader already renders `CLAUDE.md` beautifully. It does not know that it *is* `CLAUDE.md`.
- The reader already renders GFM tables into live DOM. Nothing lets you sort one.

`spec-coverage.md` (2026-08-03) puts persona #1 at **56%** on the gap lens the human ruled at M7's close, with F5 at 29% and F6 at 46%. These three items are that persona's cheapest remaining ground: **none of them needs a dependency, none needs storage, none needs a manifest permission** (§5 states the cost; the scope-read is what establishes it).

**Who it serves:** the AI-tool developer (product spec §3), at the same task the last four milestones served — reading and reviewing what an agent generated. The table-tools item also serves the developer and the technical writer, because a sortable table is not persona-specific.

**What the product promises** (`docs/product/spec.md` §5, quoted so scope matches the promise, not a paraphrase of it):

- F6: *"**Compare any two files** in the folder (spec v1 vs v2)"*
- F6: *"**Agent-file awareness**: recognized filenames (CLAUDE.md, AGENTS.md, .cursorrules, spec/plan conventions) get a badge + tuned rendering defaults"*
- F5: *"**Table tools in reading view**: click-to-sort columns, quick filter, copy table as CSV/JSON/Markdown"*

## 2. User stories

- As a developer with two versions of a spec in the same folder, I want to **compare them directly**, so I do not have to open one, wait for a snapshot, and diff against history that does not exist.
- As a developer comparing two files, I want the diff to **say which file is which side**, so I am never reading a diff whose direction I have to infer.
- As someone whose folder is full of agent instruction files, I want the reader to **tell me at a glance that this is an agent file**, so a `CLAUDE.md` does not look like every other document in the tree.
- As a reader of a document with a data table, I want to **sort it by a column** without leaving the reader or pasting it into a spreadsheet.
- As a reader of a long table, I want to **filter it down to the rows that match what I typed**, and to see plainly that a filter is on.
- As someone who found the numbers they needed, I want to **copy the table out** in a form a spreadsheet or another markdown document will accept.
- As a keyboard user, I want every one of the above **reachable and reversible by keyboard**, and to be told by a screen reader what a sorted column is sorted by.
- As a security-conscious user, I want all three of these to **put nothing on the wire and store nothing new**, and to see that claim hold without taking it on faith.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — the three deferred persona-#1 items. Nothing else, and the boundaries of two of them are narrowed here on evidence.**

IN: a file-vs-file comparison reached from the existing Compare affordance (§3.2); recognition of agent files by name, a badge, and presentation-level tuning (§3.4, narrowed by §3.5); click-to-sort, quick filter and copy-out for rendered tables (§3.6). OUT, each with a home in §6: everything M7 put out and did not ship, the content-script surface milestone (§3.3, measured infeasible), `.cursorrules` (§3.5 — it is not reachable by the reader at all today, and making it reachable is a different feature), and any new settings axis (§3.5).

**★ All three items were scope-read against the tree before this draft, and the sizes are not what "three QoL items" implies.** Item 1 is a seam widening over an engine that is already file-agnostic. Item 3 is a post-mount enhancement with an exact shipped precedent. Item 2 is **two different features wearing one bullet** — one small and one that is a milestone of its own — and §3.5 is where that is cut. **No split of M8 is recommended**; what is recommended is that the cut in §3.5 be made explicitly at gate 1 rather than discovered at plan stage.

**3.2 COMPARE-ANY-TWO-FILES is a PICKER WIDENING over the existing diff, not a new comparison surface — DECIDED. The comparison is ALWAYS current-document vs. picked-file.**

The scope-read confirms the direction decision's premise and sharpens it:

- **The engine is already file-agnostic.** `computeDiff(before, after)` (`src/render/diffEngine.ts:75`) is a pure, total function of two strings; the view `enterDiff(host, hunks)` (`src/render/diffView.ts`) consumes hunks and knows nothing of their origin. **Neither changes.**
- **What is snapshot-shaped is the CONTEXT and the PICKER.** `DiffContext` (`src/render/diffRegistry.ts:80-103`) exposes `fetchMeta(): Promise<SnapshotMetaEntry[]>` and `fetchText(snapshotId)`; `openPicker()` builds items from snapshot meta and `compareWith(id)` (`src/render/diffChrome.ts:242`) resolves that id through `fetchText`. The picker's own `aria-label` is *"Snapshots to compare against"* (`diffChrome.ts:206`) and each row reads *"Compare with the snapshot from …"* (`:279`). **The whole scoping is in the vocabulary, not in the machinery.**
- **The other file's text is already in memory, on the app page, with identity.** `FolderSource.files` is a `MarkdownFile[]` (`src/app/folderSource.ts:31-63,67-77`) and each carries `path`, `name` and `read()`. The provisioning site (`src/app/appShell.ts:911-935`) already builds the context's closures from exactly this material, under the same `docId != null` guard.

**The comparison is current-vs-picked, not any-vs-any — and that is a decision, not a limitation inherited by accident.** A diff is *entered on the host that is showing a document* (006 D-15: entering a diff is an attribute flip on `host`, not a re-render). An any-vs-any comparison has no document on screen to flip, so it would need a surface of its own — which is a different feature and a much larger one. Current-vs-picked delivers the product's own example (*"spec v1 vs v2"*) with the reader still anchored in a real document.

**The document-identity objection 006 §3.2 raised does NOT block this, and the reason is worth stating so it is not re-raised.** That rejection was *"shipping diff on the content script against snapshots captured elsewhere — a document identity mismatch"*: a **surface** objection about a reader that has no folder identity at all. The app page has full identity (`folderId + SEP + path`, `appShell.ts:883`), and both sides of a file-vs-file comparison come from the same opened folder. **What survives of the objection is a labelling obligation, not a block:** a file-vs-file diff must name both sides, because unlike a snapshot diff the "before" is not an earlier version of what you are reading. §4 requires it.

*Rejected:* an any-vs-any comparison surface (above — a different, larger feature); a separate "Compare files" control beside the existing Compare pill (two controls for one verb, and 006's one-control-two-states discipline exists precisely to avoid that); reaching the other file's text through storage (it is already in memory, and a read is fresher than a snapshot).

**3.3 008 SHIPS TO THE APP-PAGE READER, and the content-script surface is deferred WITH A MEASUREMENT — DECIDED. §3.7 is the one deliberate exception.**

M7's close ruled the content-script surface a **gap**, not a boundary (`spec-coverage.md` uncertain-items §5, answered 2026-08-03), and that ruling is what put persona #1 at 56% rather than 67%. So the surface question is live, and 008 must answer it rather than inherit 007 §3.2 silently.

**It is answered by measurement, not by precedent.** The content-script inline-engine spike (`81986d8`, recorded in `progress.md` § Baselines) priced the diagram half of that gap and found **two independent blockers, the first total**: Chrome refuses to load the whole extension when mermaid's inlined graph is flattened into the content script (a Unicode non-character at offset 542,008 trips `base::IsStringUTF8()`), and with that instrumented away first paint on a **fence-free** 50.4 KB `file://` document goes **146.5 ms → 385.3 ms, +238.8 ms** — **2.3× the <165 ms gate**, against roughly 20 ms of headroom, A-B-A bracketed with A-vs-A disagreement of 2.4 ms.

**So "make the content-script reader whole" is not an M8-sized act, and 008 does not attempt it.** That is why M8 is app-page QoL and not surface work — a measured reason, not an arbitrary one. **The deferral is named in §6 with the measurement attached.**

**The exception, and it is deliberate: §3.7 puts table tools on BOTH surfaces.** The reasons that fence diagrams, snapshots and diff to the app page are *storage* and *engine bytes* (006 §3.2, 007 §3.2). **Table tools need neither.** Applying a surface fence to them would be inheriting a conclusion past its own premise — which is the failure mode this project's decision log exists to catch. See §3.7.

**3.4 AGENT-FILE AWARENESS means RECOGNITION + A BADGE + PRESENTATION-LEVEL TUNING — DECIDED, and the recognition seam is a real (small) architectural addition.**

The scope-read found the honest obstacle, and it is not where the direction decision would have expected it:

- **The renderer never learns the filename.** `mount(source, host, options)` (`src/render/mount.ts:112`) takes a source string and a host; `MountOptions` (`:39-66`) carries `contained` and `preserveReading` and nothing else. On the app page, `readerPane.paint()` has the name in its outcome and **drops it** at the `mount()` call (`src/app/readerPane.ts:176-186`). On the content script, `mountReader()` reads the page's `<pre>` (`src/render/mountReader.ts:72-90`) and never consults `location` — though the URL is right there and is already parsed by `isRenderableContext`.
- **So recognition needs document identity threaded into the render path**, for both surfaces, through a seam that does not turn `mount()` into a branching consumer of app state. `mount()` has been read-only library for four milestones (006 D-15) and that property is not traded away for a badge. **How the identity arrives is `plan.md`'s call** (§7-2); the spec requires only that it arrive at one seam both surfaces reach, in the shape the existing chrome already uses.
- **The badge itself is the cheapest part.** `mount()` composes chrome as SIBLINGS of `.peekover-reader` through one `children[]` list (`mount.ts:143-198`), where the theme control, the watch chrome, the diff chrome and the TOC rail all live, each returning `[]` on a surface with nothing to offer. A badge is one more entry in that list, absent by default.
- **Recognition is by NAME, exactly, case-sensitively where the convention is** — `CLAUDE.md`, `AGENTS.md`, and the spec/plan/tasks convention this repository itself uses. It is **never** content sniffing: reading a document's body to guess what kind of document it is would make the badge a claim about contents rather than about identity, and it would be wrong on the first file that quotes another.

**3.5 "TUNED RENDERING DEFAULTS" MEANS PRESENTATION DEFAULTS ONLY. It does NOT open a settings axis, and it does NOT reconfigure the parser — DECIDED. This is the narrowing that keeps M8 a milestone rather than two.**

★ **This is the item the direction decision could not size, and the scope-read is why it is cut here.** Read literally against the existing machinery, "tuned defaults" points at two places, and **both are milestone-sized on their own**:

- **`settings.ts` holds ONE GLOBAL ROW.** `Settings` is `{theme, tocOpen, tocWidth}` (`src/settings/settings.ts:30-34`) with a single `DEFAULT_SETTINGS` (`:39`), reached through one `SettingsPort` (`:62-73`) by both surfaces. **There is no per-document or per-document-class axis anywhere in it.** Adding one means a vocabulary change in `settings.ts`, a schema change in `store.ts`, a port change, a background-handler change, and a settings UI to express it — and it collides head-on with a standing deferral that 006 §6 set and 007 §6 restated: *disclosed defaults, not user settings, until the numbers have been observed.*
- **`parse.ts` holds ONE markdown-it INSTANCE.** `const md = new MarkdownIt(PARSE_OPTIONS).enable([...ENABLED_RULES])` (`src/render/parse.ts:42`) is module-level, and `parse(markdown)` (`:58`) takes no options. AGENTS.md's stack rule is *"one parser, options-driven"*. Per-document parser tuning means either a second instance — which breaks that rule in shipped code — or threading options through `parse()` and `mount()` on both surfaces, which is a pipeline change made to serve a badge.

**Neither is done here. Tuned = what the reader can decide about presentation for THIS document without persisting anything and without re-configuring the pipeline.** The concrete set is small, deliberately, and gate 1 may shrink or grow it (§9-2): a recognized agent file may present differently in ways the reader already decides per document. **What it may not do is write a setting, add a settings key, or change how the source is parsed.**

*Rejected:* a per-file-class settings row (a settings-surface milestone wearing a QoL bullet, and it re-opens a deferral twice-stated); a second parser instance (breaks the one-parser rule); "tuned" as user-configurable (that is the same deferral again, from the other side).

**★ `.cursorrules` IS OUT, and the reason is a hard finding, not a preference.** `MARKDOWN_EXTENSIONS` (`src/detect/isRenderableContext.ts:20-30`) contains nine markdown extensions and no extensionless or dotfile entry, and it is the **single authoritative gate used by BOTH surfaces**: the content script's `isRenderableContext` (`:57`) and the folder walk's own filter (`src/app/walkPolicy.ts:183`, whose comment says in terms that folder mode and file mode must never disagree). **A `.cursorrules` file therefore does not appear in the folder tree and does not render at a `file://` URL. It is not un-badged; it is unreachable.**

Making it reachable is precisely the change **007 §3.4 priced and rejected** for `.mermaid`: a widening of a shared gate that changes behaviour on both surfaces at once, plus — for the `file://` half — a new content-script `matches` pattern, which is a manifest change, an AGENTS.md #4 event and a `PERMISSIONS.md` row. **A non-markdown-file reader path is a feature; it is not a badge.** Routed to §9-3 so gate 1 sees the price rather than the omission.

**3.6 TABLE TOOLS ARE A POST-MOUNT ENHANCEMENT OF THE LIVE TABLE — no re-parse, no re-sanitize, no engine — DECIDED.**

The scope-read confirms the substrate is already there and already live:

- **The tables are real DOM.** `parse.ts:40` enables GFM `table` explicitly; markdown-it emits `<table>/<thead>/<tbody>/<tr>/<th>/<td>`; those survive sanitization and are styled today (`src/theme/readerCss.ts:169-180`). `mount()` commits them into the shadow root. **Sorting is reordering `<tr>` nodes, filtering is hiding them, copying is reading `textContent`** — all node operations on already-sanitized nodes.
- **The precedent is exact and one milestone old.** `enhanceDiagrams(host)` (`src/render/diagramEnhancer.ts:678`), invoked after the commit from `readerPane.ts:185` and `appShell.ts:139`, is a post-mount enhancement that mutates *inside* the reading column. Table tools are that shape **minus the engine, minus the cache, minus the dependency**.
- **Nothing re-enters the sanitizer, and nothing may.** Moving an existing node is not creating markup. Any *new* node the enhancement creates (a header button, a filter field, a status line) is **built as DOM, never as an HTML string** — the discipline every existing chrome module already follows.

**Sort is by displayed cell text, with a numeric-aware comparison, and it is stable** — three-state per column (ascending, descending, off) so the document's own order is always recoverable. **Filter matches displayed row text and HIDES non-matching rows; it never removes them**, so clearing the filter is exact rather than a re-render. **Copy-out produces CSV and Markdown** from the *current view* — the rows and order on screen — because a copy that silently disagrees with what is visible is a wrong answer that looks right. (JSON is named by the product bullet and is deferred, §6.)

*Rejected:* re-rendering the table from source on each sort (re-parse and re-sanitize for a node move, and it would lose every other enhancement on the page); a table-tools mode that replaces the reading view (this is an in-place affordance, not a surface); copying the source markdown rather than the current view (see above).

**3.7 TABLE TOOLS SHIP ON BOTH READER SURFACES — DECIDED, and it is the one place 008 narrows the surface gap.**

- **The two reasons that fence prior features to the app page do not apply.** 006 §3.2's reason is *storage* (the background is a stateless fetch proxy and must stay one); 007 §3.2's decisive reason is *engine bytes and `web_accessible_resources`*. **Table tools store nothing and load nothing** — no dependency, no chunk, no IndexedDB, no message to the background.
- **The persona argument points the same way.** The human's 2026-08-03 ruling was that the content-script surface is a **gap**; persona #1's most common path is a `CLAUDE.md` at a `file://` URL. A table tool that works there is the cheapest square inch of that gap anyone will get.
- **The cost is a content-script byte delta, and it is not zero.** Every prior milestone's content-script fence was *byte-identical*; this one is not, by design. **The delta must be stated and decomposed** (§5), and if it moves first paint against the worst-arm headroom then the surface half is the thing that gives way — not the gate. ★ **That headroom's VALUE is OWED, not 1.8 ms** (§5): 8.1's figure describes a render path `662b90e` superseded, so **`plan.md` re-establishes the headroom on the current path FIRST and prices this surface reach against that number** — the rule below is unchanged, the number it is measured against is not yet in hand.
- **The enhancement must not run where there is no table.** A document with no `<table>` grows no chrome, adds no listener, and pays nothing beyond one query — the same "a surface with nothing to offer returns `[]`" discipline every chrome module already holds.

**Agent-file awareness follows the same test, and gets the same answer where it is free.** The badge is DOM and a name comparison; the name is available on the content script from `location`. It ships on both surfaces **if and only if** it clears the same byte-and-first-paint bar (§5, §9-4). **Compare-any-two-files does NOT** — it needs the folder's file list and its identity, which the content-script surface does not have and cannot get without the change 006 §3.2 declined.

**3.8 EVERY ONE OF THE THREE DEGRADES TO THE DOCUMENT — DECIDED.**

AGENTS.md #5, stated per item so no one has to infer it:

- **A file-vs-file comparison that cannot be produced** — the other file is gone, unreadable, or the diff fails — surfaces its reason in the diff chrome's existing status line and leaves the rendered document exactly where it was. `data-diff` is never set. This is 006's shipped fallback (`diffChrome.ts:162-166,244-254`) and it is reused, not reinvented.
- **An unrecognized filename, or no filename at all,** produces no badge and no explanation. Absence is the resting state, not a degraded one.
- **A table that cannot be enhanced** — malformed, headerless, or an enhancement that throws — stays exactly the table it is today, readable and styled, and every other table on the page is enhanced normally.

**Never a removed table, never a lost document, never a blank page.**

**3.9 NO NEW DEPENDENCY, NO NEW STORAGE, NO MANIFEST CHANGE — DECIDED, and this is a finding, not an aspiration.**

The scope-read looked for a dependency in each item and found none available *and* none needed:

- Compare-two-files reuses `diff` through `computeDiff`, already the tree's only importer (`diffEngine.ts:41`), already on the app-page side of the M6 import fence. **No new package, and the fence does not move.**
- Agent-file awareness is a string comparison and a DOM node.
- Table tools are DOM operations and `navigator.clipboard.writeText`.

**So D-10(b)'s revisit trigger — *"any further dependency lands ⇒ (c) is forced and (b) is no longer sufficient"* (`decisions.md` 2026-08-01) — DOES NOT FIRE for M8**, and the **0.70 MB** zip headroom is not drawn down by a dependency. The carried `mermaid/package.json` narrowing stays exactly as banked: carried, unforced, and outside this milestone. **If plan stage discovers an item does need a package, that is a stop-and-flag** (§7-6), not a fifth-dependency-style governed act folded into a QoL milestone.

**No new IndexedDB store, no `DB_VERSION` bump, no new `PERMISSIONS.md` capability row.** Nothing in the three items stores anything on device. `permissions: []` is untouched on both engines.

## 4. Acceptance criteria (EARS)

**Compare any two files**

- When a document is open from a folder containing at least one other markdown file, the system shall offer comparison against another file in that folder, alongside comparison against this document's snapshots.
- When the user chooses another file to compare against, the system shall show the differences between that file and the document on screen, in the same inline diff the snapshot comparison uses.
- The system shall name **both sides** of a file-vs-file comparison, in text, so the direction of the diff is never inferred from position or colour alone.
- When the opened folder contains no other markdown file, the system shall say so rather than offering an empty list.
- If the chosen file cannot be read, then the system shall say so beside the untouched document and shall not enter the diff.
- When the user leaves a file-vs-file comparison, the system shall restore the document and the reading place, exactly as leaving a snapshot comparison does.
- When the reader switches to a different document, the system shall not carry a comparison across the switch.
- The system shall present no file comparison on the content-script reader (§3.7).

**Agent-file awareness**

- When a document whose filename is a recognized agent-file convention is rendered, the system shall mark it as such, in text, in the reader's chrome.
- When a document's filename is not recognized, or is unavailable, the system shall present no mark and no explanation.
- The system shall determine recognition from the **filename only**, and shall never inspect the document's contents to decide it.
- The system shall persist nothing as a result of recognition, and shall add no settings key.
- When a recognized document is rendered, the system shall parse its source exactly as it parses any other document.

**Table tools**

- When a rendered document contains a table with a header row, the system shall offer per-column sorting, a filter over that table's rows, and copy-out of that table.
- When the user sorts by a column, the system shall reorder that table's rows and shall state the active sort where a screen reader will announce it.
- When the user sorts by an already-sorted column, the system shall reverse it; and the system shall provide a way back to the document's own row order.
- When rows are equal on the sorted column, the system shall preserve their document order.
- When the user filters a table, the system shall show only matching rows, shall say how many are shown out of how many, and shall restore every row when the filter is cleared.
- When a filter matches no row, the system shall show a designed empty state within the table, and shall never present an empty table with no explanation.
- When the user copies a table, the system shall copy the rows **currently shown, in the order currently shown**, and shall confirm that it copied.
- When a table has no header row, the system shall leave it exactly as rendered and shall offer no sort affordance for it.
- The system shall reach every table action by keyboard and shall add no new global single-key shortcut.
- When a document contains no table, the system shall add no table chrome and no listener.
- If a table action fails, then the system shall say so and shall leave the table readable.

**Trust**

- The system shall make **no network request** for any part of file comparison, agent-file recognition, or any table action — proven at the request level on both engines, **non-vacuously** (§5).
- The system shall keep the built manifest at `permissions: []` on both engines, with no `web_accessible_resources` and no other forbidden key.
- The system shall store nothing new on device, and shall add no store, no schema version and no `PERMISSIONS.md` capability row.
- The system shall add no production dependency.

**Degradation**

- If any part of the three features fails, then the system shall keep the document readable and never blank the page (AGENTS.md #5).

## 5. Non-functional requirements

- **First paint:** shall not regress the **<165 ms** typical-doc gate. ★ **The margin is the binding constraint of this milestone, and its VALUE IS OWED — it is not 1.8 ms** (gate-1 redline, 2026-08-03). 8.1's arms (152.3 / 157.9 / 163.2 ms, worst-arm headroom **1.8 ms**) are the last measurement taken, and `progress.md` § Baselines marks those three first-paint rows **"NOT re-run at 9.3"** and states plainly why they are not merely old: **`662b90e` added a per-render `initialize()` call inside the cache-miss branch, so the render path genuinely changed after those numbers were taken — "the re-measurement is OWED"**. The inline-engine spike (`81986d8`) reads them the same way. **So 1.8 ms is history, not the operative headroom: `plan.md` re-establishes the worst-arm headroom on the current post-`662b90e` path, under 8.1's own protocol on a quiesced machine, BEFORE any item of this milestone is priced against it (§3.7, §7-1, §9-4).** The constraint itself is untouched — first paint is the binding limit of M8 and the margin is thin — only the number is owed. Two of the three items add per-document work to the render path. **Measured A-B-A against a same-session HEAD control, with the FLOOR reported beside the median** (M6 retro finding 7), and **a floor-delta statement is owed before any re-baseline is discussed** (finding 8) — a moved floor is code, and the answer is optimisation, not a bigger number.
- **A document with no table and no recognized name shall pay nothing measurable.** This is the specific form the gate takes here: the enhancement's cost must be conditional on the document, not on the build.
- **Content-script bundle:** ★ **NOT byte-identical this milestone, and that is a decision (§3.7), not a slip.** The delta shall be **stated and decomposed to a zero residual** (M6 retro finding 1's third instrument) — table-tools code, badge code, glue — and **proven by ablation with a control that fires**, because an identifier grep over a minified bundle returns 0 whether or not the code shipped. Growth that is not accounted for is a defect. **The `diff` import fence stays absolute**: `diff`, `diffEngine.ts` and `diffView.ts` remain off the content-script graph, asserted structurally (`diffEngine.test.ts`, `diffImportFence`-shaped), and 007's static-import fence stays **8/8**.
- **Bytes:** app-page chunk and `pnpm zip` deltas stated against the current baselines (app chunk **389,143 B** — gate-1 redline: the carried **387,837 B** is 8.1's figure and it moved at M7's two post-gate fixes, `662b90e` +1,251 B and `fc3a142` +55 B, with 9.3's clean build at `94f7da5` reading 389,143 B, residual 0; zip **1,300,383 / 1,300,442 B** — second gate-1 redline, 2026-08-03: the carried **1,299,871 / 1,299,930 B** is likewise 8.1's figure and it moved **+512 B each** at the same two post-gate fixes, with 9.3's clean build at `94f7da5` reading 1,300,383 / 1,300,442 B (`progress.md` § Baselines, re-derived there rather than carried); **0.70 MB** of headroom under the 2 MB store bound, **re-confirmed against the corrected figure** — 2,000,000 − 1,300,442 = 699,558 B, and the superseded number gave 700,070 B, so the +512 B does not move the stated headroom). **No dependency lands** (§3.9), so D-10(b)'s trigger does not fire; any delta is our own code and is decomposed as such.
- **Dependencies:** **exactly zero additions.** If any item appears to need one, that is a **stop-and-flag** (§7-6), not a governed act to perform inline.
- **Manifest pin:** `permissions: []` re-proven on both built manifests; `tests/manifest.test.ts` green. **`web_accessible_resources` remains a forbidden key.** If any item appears to need a permission or a `matches` widening, that is an AGENTS.md #4 event and a **hard stop** (this is the live case for `.cursorrules`, §3.5).
- **Golden pin:** `tests/golden/output/` shall stay **byte-identical** — all three items act after `mount()` commits, downstream of the `sanitize(parse(source))` string the suite snapshots. **And an empty golden diff proves nothing about chrome, placement, or a reordered row** (the standing correction of record) — structural assertions in a real engine are the only guard that can see any of this.
- **Sanitization (AGENTS.md #3):** the document profile is unchanged and 007's SVG profile is untouched. **No item introduces a new HTML string.** Sorting and filtering move and hide already-sanitized nodes; every node the enhancements create is built as DOM.
- **Storage:** unchanged. No new store, no `DB_VERSION` change, no row written by any of the three.
- **CSS discipline:** any styling rationale lives in **TypeScript doc comments, never inside a CSS template literal** (M6 retro finding 9 — the memory of record says the minifier cannot strip what is inside the backticks). And **no `ch` unit in any layout-blocking property** (`margin`, `padding`, `transform`) in new styling; `max-width` is free (finding 6).
- **a11y:** the sort state of every table column is exposed to assistive technology, not carried by an icon alone; the filter's result count is announced politely; the file-comparison picker keeps the existing listbox semantics and its rows name both sides; the badge is text, not colour; every affordance is keyboard-reachable and focus-visible; all transitions are instant under `prefers-reduced-motion`.
- **Reading-column clearance:** any new chrome is checked against the reading column and the TOC rail at a **wide viewport**, per M6 retro finding 2 — the specific assertion M6 lost in transcription, and table chrome sits inside the column rather than beside it.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines with a **positive control that fires under the same conditions the negative claim disclaims** (finding 1). The existing `/^https?:/i` scoping is used verbatim. ★ **The standing lesson applies with force here: jsdom cannot see bytes on the wire**, and a fetch control routed through a sanitizer can read NO-FETCH while the route is wide open — the control must adopt markup no sanitizer has touched.

## 6. Out of scope (explicit)

- **★ The content-script SURFACE MILESTONE — making the `file://` / raw-host reader whole. MEASURED INFEASIBLE, deferred WITH EVIDENCE.** The inline-engine spike (`81986d8`) measured **+238.8 ms** first paint on a **fence-free** document (146.5 → 385.3 ms median, floor 360.3, A-B-A with 2.4 ms A-vs-A disagreement) — **2.3× the <165 ms gate** against ~20 ms of headroom — and found a **prior, total blocker**: Chrome refuses to load the entire extension when the engine is flattened in. **This is why M8 is app-page QoL rather than surface work.** Home: a milestone that reconsiders the background's role or the surface's architecture deliberately, with the spike as its starting price. *(§3.7's table-tools exception is the narrow, storage-free, engine-free part of that gap that IS affordable now, and it is not a re-opening of this deferral.)*
- **`.cursorrules` and every other non-markdown agent file** (§3.5) — unreachable behind `MARKDOWN_EXTENSIONS`, a **shared** gate whose widening changes both surfaces and, for `file://`, the manifest. Home: a milestone that opens a non-markdown reader path — the same home 007 §3.4 gave standalone `.mermaid` files. Routed to §9-3.
- **Any per-document or per-file-class SETTINGS axis** (§3.5) — home: the milestone that legitimately opens a settings surface, once defaults have been observed. The 006 §6 / 007 §6 deferral stands and is not re-opened by a badge.
- **Parser reconfiguration of any kind** (§3.5) — one parser, options-driven, one instance. Home: a milestone that changes the pipeline on purpose.
- **Any-vs-any file comparison, and comparing files across two different folders** (§3.2) — home: a comparison surface of its own, if one is ever wanted.
- **Side-by-side diff** — 006 §6's deferral stands unchanged; widening the picker does not widen the view.
- **Sub-line (word/character) diff highlighting** — 006 §6 stands.
- **Copy table as JSON** — the product bullet names CSV/JSON/Markdown; **CSV and Markdown ship** (§3.6). JSON is deferred because it demands a typing decision per cell (is `01` a number?) that CSV and Markdown do not, and getting it wrong silently corrupts data. Home: revisit once the copy path is in use.
- **Table editing of any kind** — F8's visual table editor is Editor Mode's, and this milestone has no write path at all.
- **Sorting or filtering state that survives a re-render** (§7-4) — decided per-render for now; home: revisit if watch-mode use shows it matters.
- **Column resizing, column hiding, frozen headers, pagination** — none is in the product bullet; a table is not a data grid.
- **Session-transcript rendering** (F6) — deferred at 005, still deferred, and not implied by agent-file awareness.
- **Local MCP bridge** (F6) — post-v1 in the product spec.
- **Shiki syntax highlighting** (F3) and **persona-#2 unlock generally** — queued for M9 or later; the direction decision named it and M8 is not it.
- **Editor Mode** (F8) — the next-large-milestone candidate; not a comparison this milestone makes.
- **The carried `mermaid/package.json` narrowing (D-10 (b))** — carried, unforced (§3.9), and outside this milestone's fence.
- **The carried F2/F6 row-level re-audit of `spec-coverage.md`** — a records act, routed at M7's close; 008 consumes the audit and does not amend it.
- **The carried M7 gantt/dark-mode diagram legibility finding** — 007's, still owed, not M8's.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **The first-paint headroom is the milestone's real constraint, two items spend it, and its VALUE MUST BE RE-ESTABLISHED BEFORE IT CAN BE SPENT.** ★ The plan's first move here is to **re-measure the worst-arm headroom on the current post-`662b90e` render path** — 8.1's 1.8 ms describes a superseded path and § Baselines marks the re-measurement owed (§5, gate-1 redline). Nothing in §3.7 or §8-1 can be priced until that number exists. Then determine, by measurement rather than by argument, what a per-document name check and a table query actually cost on the gated fixture — **and on a document that has neither**, which is the case §5 requires to be free. The memory of record is blunt about this: a perf delta needs an interleaved control, and a `ch` unit in a margin once cost 28 ms. If the honest answer is that the gate cannot hold with all of §3.7's surface reach, **the surface reach gives way, not the gate** — and that is a finding for gate 2, not a quiet re-scope.
2. **Where document identity enters the render path, for both surfaces, without making `mount()` stateful.** §3.4 requires the name to arrive; 006 D-15 requires `mount()` to stay read-only library. The existing seams are `MountOptions`, the registry pattern (`watchRegistry` / `diffRegistry` / `tocHost`), and the post-mount enhancement call site. **Choose deliberately and state why**; a fourth mechanism invented for a badge is the wrong answer even if it is the shortest.
3. **What `DiffContext` becomes when it carries two kinds of comparison target.** Today it is snapshot-shaped (`fetchMeta`/`fetchText` over `SnapshotMetaEntry`). The file list is a different shape with a different identity. Resolve whether the context grows a second capability pair or a discriminated target type — **and keep the M6 import fence intact either way**: `diffChrome.ts` is on `mount()`'s graph and may import neither the engine nor the view, so anything new arrives as a closure the app page provisions (`appShell.ts:911-935`).
4. **What happens to sort and filter state on the re-renders watch mode causes.** `replaceChildren` destroys everything in the shadow root on every mount, **including the mounts a watching agent causes** — this is exactly the property that made 007's diagram cache load-bearing rather than an optimisation. §6 decides per-render for now; the plan must confirm that a table being sorted while an agent rewrites the file around it degrades to "unsorted", not to "wrong rows in the right order".
5. **Whether the picker's single listbox can carry two target kinds without becoming a menu.** 006's picker is one `role="listbox"` of snapshots with an established empty state and one aria-label. Two kinds of row in one list is an a11y and a copy problem before it is a code problem. **Resolve it as a design question with the existing pattern in hand**, not by adding a second control (§3.2 rejected that).
6. **Clipboard write on both engines, without a permission — verify, do not assume.** 007 §7-6 asked this for copy-as-image and it resolved without a manifest permission; text is strictly easier, and that is a reason to expect the answer, not to skip the check. **Verify against current official docs on both engines** (AGENTS.md's standing rule). If either needs a permission, §3.9 says **stop and flag**.
7. **The sibling-checklist audit is owed BEFORE the first table-tools test is written** (M6 retro finding 4 — *"the single most valuable mechanical item M6 produced"*). 008 adds chrome **inside the reading column** for the first time since diagrams. Enumerate the property set from every existing sibling suite — `diffChrome`, `remoteMediaUi`, `themeControl`, `watchControl`, `diagramLightbox` — and record each property as **present / absent / explicitly out-of-scope**. Reader-column clearance at a wide viewport is the assertion M6 lost in transcription and finding 2 requires walked.
8. **Whether a table inside a diff, or inside the raw view, must be left alone.** The diff view renders source lines and the raw view renders text; neither should grow sort affordances. Confirm the enhancement's entry conditions exclude both, and that leaving and re-entering a diff does not double-enhance a table.
9. **Whether `enhanceDiagrams`' call sites are the right home for a second enhancement, or whether a shared post-mount enhancement seam should exist.** Two call sites already duplicate one line (`readerPane.ts:185`, `appShell.ts:139`, whose own comment says *"identical body by construction"*). A third and fourth copy is the moment to decide, and §3.7 makes the content script a fifth. **Decide it once; do not let it be decided by the order the tasks land.**
10. **Design translation.** `design/mockup.html` predates all three items. Carry the design *language*; **re-measure placement with a real rect probe** (005's precedent); verify every token against `readerCss.ts` before use and **never substitute a nearby token silently**. Where mockup and spec disagree, **the spec wins**, and the divergence is recorded in-code.

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from measurements a measurement task produced and is **forbidden from choosing** from.*

1. **Whether table tools and the badge actually ship to the content-script surface (§3.7).** **Axes:** the content-script byte delta, decomposed · first-paint delta on the gated fixture, floor beside median · the delta on a document with no table. **The rule is set here and the value is not:** if the gate cannot hold, the surface reach is what gives way. A human reads the numbers and rules.
2. **Whether the filter is per-table or per-document.** §3.6 decides per-table. **What the plan measures:** how a real agent-written document actually uses tables — one big table or several small ones — because the answer changes which reads as noise. This is the shape of 006's "reads as noise" verdict, and it is a walk-gate judgement.
3. **The threshold, if any, below which a table grows no tools.** A two-row table with a sort control on every column is chrome outweighing content. **Axes:** row count · column count · whether any column is numeric. **What the plan measures:** the distribution across the repository's own documents and the golden fixtures. An always-on answer is legitimate; it must be *chosen*, not defaulted into.
4. **Exactly which presentation defaults an agent file gets (§3.5's small set).** Axes are settled — presentation only, nothing persisted, parser untouched. **The set itself is a walk-gate judgement**, because a tuning nobody notices is not worth its code and a tuning everybody notices is a theme change in disguise.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled in as defaults.*

1. **Do the three items fit ONE milestone — and is a persona a coherent enough theme?** The direction decision's own words are that *"four features in one milestone is the M1 skeleton-shape not the M5/M6 focused-theme shape"*, and M8 is three features across two product sections with three unrelated surfaces. **The scope-read's answer is that they fit**: no dependency, no storage, no manifest event, one shared post-mount discipline, and item 2 cut to size by §3.5. **But the coherence is the persona, not the surface**, and that is the thing this spec cannot decide for a human. If gate 1 wants a narrower M8, the natural cut is **items 1 and 3 now, item 2 after** — item 2 is the one whose boundary had to be drawn rather than found.
2. **Does §3.5's narrowing of "tuned rendering defaults" hold?** The product bullet promises *"a badge + tuned rendering defaults"*. §3.5 reads "tuned" as presentation-only and prices the literal reading — a per-document-class settings axis, or per-document parser options — as milestone-sized and deferral-breaking. **This is the single most consequential call at this gate**: the narrow reading makes M8 a QoL milestone; the literal reading makes item 2 its own milestone and M8 a two-item one. **Recommendation: hold the narrowing.**
3. **Does `.cursorrules` stay OUT (§3.5)?** It is named in the product bullet and it is **unreachable behind a shared gate** — the exact shape 007 §3.4 rejected for `.mermaid`, with a manifest change on the `file://` half. §6 prices the overturn. **Recommendation: out**, revisited by a non-markdown reader-path milestone. Gate 1's call.
4. **Does §3.7 hold — table tools (and possibly the badge) on BOTH surfaces?** This breaks a four-milestone streak of byte-identical content scripts, deliberately, because the storage and engine-byte reasons behind that streak do not apply here and because M7's close ruled that surface a **gap**. The risk is the first-paint headroom — **whose current value is OWED, not 1.8 ms**: 8.1's figure describes a superseded render path, so §3.7's reach is priced against a re-measurement `plan.md` takes FIRST (§5, §7-1, gate-1 redline). **Recommendation: hold it, with §8-1 as the escape hatch** — the surface reach gives way before the gate does. Gate 1 may prefer app-page-only for one more milestone; if so, say it here rather than letting a measurement decide it silently.
5. **Is current-vs-picked the right shape for "compare any two files" (§3.2)?** The product bullet says *"compare any two files in the folder"*; §3.2 delivers *this file vs. any other file*, because a diff is entered on the host showing a document. A literal any-vs-any is a comparison surface of its own. **Recommendation: current-vs-picked.** Gate 1's call.
6. **A documentation inconsistency — RAISED ON A STALE PREMISE; IT WAS ALREADY CLOSED, AND THIS ITEM IS DISCHARGED.** ★ *(Corrected 2026-08-03, second gate-1 redline.)* This draft recorded `docs/product/spec.md` §8 and §7's principle 4 as both still stating **<150 ms** first paint against the operative **<165 ms** gate, and stated that 007 §9-4 routed the item to its gate 1 and *"it was not corrected"*. **It was corrected, in that very commit.** `e09520f` (2026-07-27 — 007's own gate-1 approval commit) fixed both lines: §8's first-render row now reads **`< 165 ms`** with a dated correction note below the table citing `decisions.md` 2026-07-26 and carrying a revisit-when, and §7 principle 4 now reads **`<165ms`** with a dated note referencing §8's corrected row. **Verified at HEAD: no first-paint `<150 ms` claim remains in the product spec** — its only surviving "150" is the unrelated `150–250ms` motion-timing range in principle 3. **So nothing is routed onward from this item and there is no inconsistency for a later milestone to carry**; `docs/product/spec.md` is not edited by M8 because it is already correct.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is verified **revert-and-fail**, red with the defect's own signature in the defect's own units (M6 retro finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf number is **A-B-A with the floor beside the median** (finding 7); the close gate **records its viewport(s)** the way it records its engines, and walks at least one WIDE viewport because this milestone ships chrome inside the reading column (finding 2)._
