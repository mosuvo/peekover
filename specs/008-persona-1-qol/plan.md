# Plan 008 — Persona-#1 QoL: compare any two files, agent-file awareness, table tools (M8)

**Status:** draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-08-03
**Spec:** `specs/008-persona-1-qol/spec.md`, approved at gate 1 (`aaf990e`), corrected at `757f953` and `f46f558`. This plan is the HOW; it resolves the spec's ten §7 risks against the **actual code**, not against the spec document. No §3.x decision is re-opened, and nothing on the §6 IS-NOT list is proposed.
**Gate-1 dispositions inherited, not re-argued:** three items, ONE milestone (§9-1) · "tuned" = presentation-only (§9-2) · `.cursorrules` OUT (§9-3) · table tools on BOTH surfaces with §8-1 as the escape hatch (§9-4) · compare = current-vs-picked (§9-5) · §9-6 discharged. These were settled by the reviewer and are **preserved by silence** below rather than re-listed as D-values — a plan that re-decides a gate-1 answer is a scope-reopen even when it agrees.
**Settled inputs this plan SERVES and does not re-open:** the content-script first-paint headroom is **26.9 ms worst-arm median / 29.9 ms floor**, re-measured at `757f953` (`progress.md` § Baselines, *THE 2026-08-03 FIRST-PAINT RE-MEASUREMENT*) — this plan **prices against it and does not re-measure it**; the app-page half **ships on a stated per-item cheapness argument with a structural conditionality guard and a carried coverage hole** (human ruling, 2026-08-03), and **M8 does not fund an app-page first-paint harness**.
**Evidence base:** a codebase recon at `f46f558`. **Every `file:line` below was re-derived against the tree in this session; nothing is inherited from the spec or from the kickoff brief** — the spec demands this in terms (§ Evidence base). Eight inherited citations drifted and are corrected in place (§0.2). Plus verification of the one external contract §7-6 turns on, against **current official documentation** (AGENTS.md's standing rule).
**Libraries:** **zero additions.** §3.9's finding is confirmed against the tree: compare-two-files reuses `computeDiff` (already the only `diff` importer), recognition is a `Set.has`, table tools are DOM operations plus `navigator.clipboard.writeText`. `dependencies` stays at five. D-10(b)'s revisit trigger does not fire.
**Spec status:** §3.1–§3.9 are closed. This plan found none of them unbuildable, and proposes **no spec amendment**.

---

## 0. Decisions SETTLED at this gate (2026-08-03)

*Every decision below gets a `decisions.md` entry, named here, landing with the commit that implements it — never after.*

**D-1 · Document identity arrives through a NEW module-level registry, `src/render/docIdentity.ts` — the THIRD instance of the register-once pattern. NOT `MountOptions`, NOT the post-mount call site. DECIDED.**
`decisions.md` entry: *"008 D-1 — the document's name arrives at the render path the way the watch target and the diff context do, because it is the only seam that survives a re-render"*

§7-2 names three candidate seams and forbids inventing a fourth. All three were read; the choice is forced by one property rather than preferred on taste.

- **`MountOptions` is the wrong shape, and that is the weaker half of the argument.** Its own header calls it *"Optional render modes for a mount"* (`mount.ts:38`), and both members — `contained` (`:47`) and `preserveReading` (`:65`) — are booleans about HOW to render. A filename is data ABOUT the document. That is a taste argument and it does not decide anything on its own.
- **★ The DECISIVE half: a name threaded through `MountOptions` would not survive a watch re-render, on EITHER surface.** `watchController` re-renders through `render(text, target, { contained, preserveReading: true })` (`watchController.ts:449`) and **constructs that options object itself** from its own config — a name in `MountOptions` reaches it only if `createWatchController`'s config carries one. On the app page the re-render goes through `renderWithDiagrams` (`appShell.ts:137-140`), a **module-level `const` with no file in scope**, so it would have to close over app state — i.e. become module-level state anyway. On the content script `contentWatch.ts:121` passes **no `render` at all** and gets bare `mount`, so the name would be lost outright there. **So the seam that avoids a registry arrives at module-level state by a longer road on one surface and simply drops the badge on the other** — and it drops it *the first time an agent edits the file*, which is the exact bug class 007 D-12 was written to catch.
- **The post-mount call site cannot carry it either, and the reason is D-6's.** The enhancement seam does not reach the content script today, and D-6 decides it must not be made to reach it as a shared composition point. A badge built post-mount would also be appended AFTER `replaceChildren`, out of `children[]` order, which is a second divergence from every sibling chrome for no gain.
- **What the registry costs, stated:** one new module and one new line in `mount.ts`. `mount()` stays read-only library (006 D-15) in the sense that property actually has: it **reads** a data holder at build time, writes nothing, owns nothing, and branches on nothing about the app. The new line is `children.push(...buildAgentBadge())` — the **fifth** instance of a pattern `buildThemeControl` (`mount.ts:168`), `buildWatchChrome` (`:182`), `buildDiffChrome` (`:190`) and `buildTocView` (`:201`) already establish. 007 touched `mount.ts` at zero sites; **008 touches it at exactly one line, and that is a checkable property, not an aspiration.**
- **The module is DATA ONLY** — it holds a string and imports nothing, exactly as `diffRegistry.ts`'s header argues for itself (`diffRegistry.ts:32-38`: *"holds the DATA … and imports only a TYPE … so it is safe to import from BOTH surfaces"*). It is therefore safe on both graphs and cannot become a fence hazard.

**Registration sites, both re-derived, and the app-page ordering is INHERITED PROVEN rather than newly argued:**

| surface | site | what it registers |
|---|---|---|
| app page | `appShell.installWatchForFile` (`appShell.ts:838`), beside `registerDiffContext` (`:914`) | `file.name` / `file.path` from the `MarkdownFile` it already receives |
| content script | `runReader.ts:118`, which already holds and parses `location.href` for its own gate, before `mountReader()` runs | the basename decoded from `new URL(location.href).pathname` |

★ **The app-page ordering is already correct and already load-bearing.** `installWatchForFile(file)` runs at `appShell.ts:798`, **before** `await selectFile(file)` at `:799` — and `:783-793` records why in terms: registering after the select meant *"the first file opened in a session showed no watch control at all"*, a defect 005 task 4.7 found and fixed. The badge inherits that fixed ordering instead of re-discovering it.

★ **Registration is NOT gated on `docId != null`.** The diff context is (`appShell.ts:912`) because a snapshot needs a folder identity; a badge needs only a basename, which `MarkdownFile.name` (`folderSource.ts:34`) always carries. Gating identity on the folder id would silently drop the badge on any app-page open where `activeFolderId` is unset.

*Rejected:* `MountOptions` (above, on the re-render property). A fourth mechanism (§7-2 forbids it, and nothing here needs one). Passing the name into `createWatchController`'s config on both surfaces (that is the `MountOptions` road with two extra config fields and the same module-level endpoint).

**D-2 · Recognition is a PURE PREDICATE over the BASENAME, in a new `src/render/agentFile.ts`; the badge is `buildAgentBadge()` returning `[]` by default. DECIDED.**
`decisions.md` entry: *"008 D-2 — the badge is a name comparison and a text node; absence is the resting state and costs one Set lookup"*

- **Exact, case-sensitive basename match against one frozen set** — `CLAUDE.md`, `AGENTS.md`, and this repository's own spec/plan/tasks convention (`spec.md`, `plan.md`, `tasks.md`). Case-sensitive because the convention is: a `claude.md` is not the file the convention names, and a case-insensitive match would badge it wrongly rather than not at all. **Never content sniffing** (§3.4, §4).
- **The content-script basename needs `decodeURIComponent`.** `new URL('file:///c:/dev/My%20Docs/AGENTS.md').pathname` yields a percent-encoded segment; a raw `split('/').pop()` comparison would miss any path containing an encoded character. This is a one-line detail that silently produces a false negative, so it is decided here rather than discovered.
- **`buildAgentBadge()` returns `[]` when nothing is registered or the name is not recognized** — the `buildDiffChrome` shape verbatim (`diffChrome.ts:175`: *"THE GATE. Read at BUILD time … it is the only condition"*), and with **no explanatory note**, for D-14's reason: the user was never offered anything, so there is nothing to be told they are missing.
- **The badge is a SIBLING of `.peekover-reader`**, pushed into `children[]` — never inside the reading column, so the column stays byte-identical and the golden pin is untouched by construction.
- **Which presentation defaults a recognized file gets is §8-4's**, chosen by a human at gate 3 from the walk. This plan builds the seam and the badge; it does not pick the tuning.

**D-3 · `DiffContext` grows a SECOND, OPTIONAL CAPABILITY PAIR — `fetchFiles` / `fetchFileText`. The discriminant lives in the picker ROW, not in the context. DECIDED.**
`decisions.md` entry: *"008 D-3 — the diff context grows additively, the way 6.2 already grew it; the snapshot pair is byte-untouched"*

§7-3 offers "a second capability pair" or "a discriminated target type". The code answers it twice.

- **There is a precedent for growing `DiffContext` additively, and it is in the file's own header.** Task 6.2 added `showDiff`/`hideDiff` to a context that had started as `fetchMeta`/`fetchText` alone — `diffRegistry.ts:40-54` records the amendment and its reasoning. A second additive pair is the same move a second time, not a new idea.
- **A discriminated target type means re-shaping shipped, tested code to serve an addition.** `fetchMeta(): Promise<SnapshotMetaEntry[]>` (`:90`) and `fetchText(id)` (`:94`) are consumed by `openPicker` (`diffChrome.ts:286-304`), `buildItem` (`:264-283`) and `compareWith` (`:242-260`), and pinned by `diffRegistry.test.ts`, `diffChrome.test.ts` and `diffChrome.browser.test.ts`. **007 D-4 already ruled on this exact trade** — *"Parameterising a shipped, tested pure function to serve a second caller … changes 006's code from inside 007 for no gain."* The same argument holds here and is applied rather than re-derived.
- **Optional, not required** (`fetchFiles?`, `fetchFileText?`), so every existing `createDiffContext` call site and every existing test fake stays valid, and a context with snapshots but no folder list is a legal, designed state. This mirrors `AppStore`'s optional-reader discipline (`appShell.ts:150-158`).
- **The discriminant is on the ROW**, because that is the only place that needs it: `item.dataset.targetKind` beside today's `item.dataset.snapshotId` (`diffChrome.ts:270`), and `compareWith` branches once on it. A discriminated union in the context would push a `kind` field through two closures to reach the same single branch.

**★ THE IMPORT FENCE IS PRESERVED, AND THE MECHANISM IS UNCHANGED.** `diffChrome.ts` is on `mount()`'s graph and may import neither `diff`, nor `diffEngine.ts`, nor `diffView.ts` (`diffChrome.ts:3-17`; the three clauses are pinned by `diffEngine.test.ts:223-311`). Both new closures are provisioned in the object literal at `appShell.ts:914-934`, over `activeSource.files` (`folderSource.ts:70`) — material the app page already holds, in a graph `mount.ts` never reaches. **No new module crosses the fence, and no fence clause changes.**

**D-4 · ONE `role="listbox"`, TWO `role="group"`s — and the groups appear ONLY when both kinds are non-empty. DECIDED.**
`decisions.md` entry: *"008 D-4 — the picker carries two kinds as ARIA groups inside the one listbox; a single-kind picker is byte-identical to what 006 shipped"*

§7-5 requires this be resolved as a design question with the existing pattern, not by adding a second control (§3.2 rejected that).

- **`role="group"` is a legal owned child of `role="listbox"`**, and grouping is the standard ARIA answer to "one list, two kinds" — no dialog, no menu, no second pill. Each group carries its own `aria-label` (*snapshots of this document* / *other files in this folder*); the picker's own label (`diffChrome.ts:204`, today *"Snapshots to compare against"*) widens to cover both.
- **Rows stay `<button role="option">`** — `:264-283`'s deliberate choice, kept for its stated reason (*"keyboard-operable (Enter/Space) for free … it lands in the tab order natively"*). A file row names the file and says it is a file, in text; a snapshot row is **unchanged**, including its absolute stamp and size (mockup divergence 2 at `:184-190` stands).
- **★ When only ONE kind has entries, the groups are not rendered at all** and the picker is structurally what 006 ships today. This is not tidiness: it keeps the snapshot-only path — the one every existing browser assertion drives — identical, so those assertions cannot pass by transcription drift, and it avoids a redundant single-group nesting that adds an AT announcement for nothing.
- **Empty states land in the EXISTING status line, never as a fake option row.** `.peekover-diff-status` (`:193-198`) is already a `role="status"` polite region rendered beside the untouched reader. So: no other markdown file in the folder → the picker lists snapshots and the status line says so (§4 requires the system *say so*); no snapshots → the picker lists files and the status line says so; **both empty → close the picker and say it, which is exactly today's shipped behaviour** (`:292-298`), preserved unchanged for the surface that has no folder list.

**D-5 · Both sides are NAMED in the existing status line, which becomes the comparison's caption for a file-vs-file diff. DECIDED.**
`decisions.md` entry: *"008 D-5 — a file-vs-file diff says which file is which side, in text, in the line that already exists for saying things"*

§3.2's surviving obligation and §4's *"shall name both sides … in text"*. The status line already exists, is already polite, already sits under the pill, and is already the surface every diff failure speaks through. Reusing it costs one element fewer than a caption of its own and inherits `diffChrome.browser.test.ts:651`'s "out of the a11y tree while empty" property. On a successful file-vs-file diff, `compareWith` sets the caption instead of today's `say(null)` (`:258`); on exit, `showCompare()`'s path clears it (`:313-316`). **Snapshot diffs keep today's behaviour** — see §8-1 for the question of whether they should not.

**D-6 · NO shared post-mount enhancement seam. The call sites stay explicit, and the DIFFERENCE between them IS the fence. DECIDED — and this is the plan's second architectural finding.**
`decisions.md` entry: *"008 D-6 — a shared enhancer composition point would convert a static import-graph fence into a runtime registration the fence test cannot see"*

§7-9 says to decide this once and not let the task order decide it. The code decides it.

- **The 007 fence is a STATIC IMPORT-GRAPH TRAVERSAL from the two entrypoints.** `diagramImportFence.test.ts` walks `entrypoints/peekover.content.ts` (`:63`) and `entrypoints/app/main.ts` (`:65`); clause A asserts the content-script graph reaches **neither** `diagramEnhancer` nor `diagramEngine` by any edge (`:275-297`), and clause B uses the app-page graph as the **control that fires** (`:299-316`). It is 8/8 and it is the guard that keeps ~3.3 MB of mermaid off the gated path.
- **★ A shared `enhance(host)` that composes both enhancers, called from the content script, would put `diagramEnhancer` — and mermaid's dynamic edge behind it — ON the content-script graph, and take that fence from 8/8 to red.** The tidiest-looking seam is the one that dissolves the milestone's most valuable structural guard.
- **★ And a REGISTRY of enhancers would be worse, not better.** It would keep the fence green by making the composition a *runtime registration* — converting a static property the traversal can see into a dynamic one it cannot. The fence would pass while the graph was open. That is precisely the shape of M6's first formal retraction (retro finding 1: *"a test that returns the same answer whether or not the thing is present has zero discriminating power"*).
- **So: five explicit call sites, each importing exactly what its surface may have.** The `readerPane.ts:184` comment *"identical body by construction"* stays true of the app page's two sites and becomes **deliberately false across surfaces** — the content script's sites call `enhanceTables` and nothing else, and that asymmetry is §3.2/§3.7's fence expressed in imports.

| # | site | today | M8 |
|---|---|---|---|
| 1 | `readerPane.ts:185` — app page, initial select | `enhanceDiagrams(host)` | `+ enhanceTables(host)` |
| 2 | `appShell.ts:137-140` `renderWithDiagrams` — app page, watch re-render | `mount` + `enhanceDiagrams` | `+ enhanceTables`; the const's name stops being true and is renamed with it |
| 3 | `mountReader.ts:90` — content script, initial mount | bare `mount` | `+ enhanceTables(host)` |
| 4 | `contentWatch.ts:121` — content script, watch re-render | `createWatchController({…})` with **no `render`** → bare `mount` | **must gain a `render` closure** |

★ **Site 4 is the one that would be missed, and missing it is a shipped defect, not a gap.** `contentWatch.ts:121` passes no `render` today, so without this change table tools would vanish on the content-script surface the first time a watching agent rewrote the file — the identical failure 007 D-12 caught on the app page. It is named here so `tasks.md` cannot land site 3 without site 4.

**D-7 · `enhanceTables` is TOTAL — it never throws — and that is load-bearing on the content script, where `enhanceDiagrams`'s shape would not be safe. DECIDED.**
`decisions.md` entry: *"008 D-7 — the table enhancer swallows its own failures because the only place to call it from on the content script is inside a try that tears the reader down"*

`mountReader`'s `catch` (`mountReader.ts:106-114`) responds to a throw by **removing the host**, which fully restores the browser's raw rendering. That is exactly right for a failed mount and exactly wrong for a failed table toolbar: a throw out of an enhancement would tear down a reader that had already rendered the document correctly. `enhanceDiagrams` (`diagramEnhancer.ts:678-700`) has no top-level try — it does not need one, because neither of its call sites is inside a teardown path. **So the table enhancer takes the guarantee into itself**: per-table try/catch (§4's *"every other table on the page is enhanced normally"*) plus a total outer boundary. §4's *"If a table action fails, then the system shall say so and shall leave the table readable"* is the same discipline one level down.

**D-8 · The table enhancement is SCOPED TO `.peekover-reader`, and that scoping is REQUIRED — not defensive. DECIDED.**
`decisions.md` entry: *"008 D-8 — the enhancer queries the reading column, because the diff view renders real tables and a shadow-wide query would enhance them"*

§7-8 asks whether a table inside a diff or the raw view must be left alone. **It must, and a naive query would not leave it alone:**

- **The diff view runs the FULL parser.** `renderHunk` (`diffView.ts:119-128`) does `sanitize(parse(hunk.lines.join('\n')))`. A hunk that contains a complete markdown table therefore produces a **real `<table>`** inside `.peekover-diff` — which is precisely what a spec-v1-vs-spec-v2 comparison, the product's own example, will contain. `shadow.querySelectorAll('table')` would have sorted it.
- **Both alternate views are SIBLINGS of the reading column, not descendants.** `enterDiff` appends `.peekover-diff` to the shadow root and hides the column by attribute (`diffView.ts:148-159`; `readerCss.ts`'s `:host([data-diff="active"]) .peekover-reader{display:none}`), and `ensureRawView` appends `.peekover-raw` to the shadow root (`readerMode.ts:66-74`, hidden by `:host([data-mode="raw"]) .peekover-reader{display:none}`). **So scoping the query to `.peekover-reader` excludes both by construction**, with no entry-condition branch to get wrong.
- **Double-enhancement is prevented by a state attribute on the `<table>`** — the `DIAGRAM_STATE_ATTR` precedent (`diagramView.ts:30`, consumed at `diagramEnhancer.ts:684`).
- **★ A positive consequence, stated because it is testable:** entering and leaving a diff **never re-mounts** — it is an attribute flip over an untouched column (006 D-15) — so a sorted table is still sorted, with its filter still applied, when the diff closes. Nothing has to be restored because nothing was destroyed.

**D-9 · Sort and filter state is PER-RENDER, and the degradation on a watch re-render is STRUCTURAL rather than implemented. DECIDED — confirming §7-4.**
`decisions.md` entry: *"008 D-9 — there is no stale table state to be wrong, because replaceChildren leaves none"*

`mount()` builds a fresh `root` (`mount.ts:140-142`) and commits it with `shadow.replaceChildren(...children)` (`:210`). The whole reading column — every `<table>`, every `<tr>` — is **new DOM parsed from the new source**. So the failure mode §7-4 asks about, *"wrong rows in the right order"*, **cannot occur**: there is no surviving row to be stale and no surviving order to be applied. The re-render lands in document order and the enhancer re-attaches tools with sort off and filter cleared, which is §6's decided *"unsorted"*. `preserveReading` carries only the scroll anchor and the view mode (`mount.ts:208,215,228`), never table state.

This is confirmed, not assumed, and it is verified **revert-and-fail**: the red arm is a build that carries sort state across the re-render and re-applies it, which must produce the wrong-rows state in the defect's own units (a row whose text is from the old source sitting in the new table).

**D-10 · Clipboard: RESOLVED, no permission needed, no AGENTS.md #4 event — with one residual to prove empirically rather than argue. DECIDED.** (spec §7-6)
`decisions.md` entry: *"008 D-10 — clipboard text needs transient activation, which a click supplies by construction; permissions: [] holds on both engines"*

Verified against **current official documentation**, both engines named in one source:

> *"The methods are available from a secure context but only function after the extension's user performs transient activation. However, with the `"clipboardWrite"` permission, transient activation isn't required."* … *"In Firefox and Chrome, the `"clipboardWrite"` permission enables writing to the clipboard from all extension contexts and content scripts."*
> — MDN, [*Interact with the clipboard*](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard)

So the permission **removes** a requirement we already satisfy: every copy is triggered by an explicit click, so transient activation is present by construction. This is the same finding 007 §3-6 made for `clipboard.write()` — and the tree already ships that harder case (`diagramView.ts:306-315` calls `navigator.clipboard.write` with a `ClipboardItem`, at `permissions: []`). `writeText` is strictly easier.

★ **The one residual, named rather than assumed: the CONTENT-SCRIPT surface runs in the PAGE's context, and one of its two document classes is `file://`.** `navigator.clipboard` requires a **secure context**, and MDN's own wording on `file://` is hedged — *"The same is generally true for `file://` URLs"* ([*Secure Contexts*](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)). "Generally" is not a contract. The `https://` raw hosts are unambiguous. **So the copy affordance's availability on `file://` is proven empirically on both engines, in a real-engine test, and — per §3.8 — a clipboard that is unavailable degrades to a stated failure beside a still-readable table, never to a broken button.** A doc read is not a build.

**D-11 · The app-page items ship on a PER-ITEM MECHANICAL CHEAPNESS ARGUMENT plus a STRUCTURAL CONDITIONALITY GUARD; the app-page first-paint hole is CARRIED with its trigger named. DECIDED.** (the human ruling, 2026-08-03)
`decisions.md` entry: *"008 D-11 — the app page's cost is argued mechanically and guarded structurally, because the milliseconds cannot be timed and the conditionality can"*

**(i) The cheapness argument, per item, as a specific falsifiable mechanical claim — not a vibe.**

| item | the claim | why it is falsifiable |
|---|---|---|
| **Compare any two files** | **Nothing executes on any render.** The two new closures are provisioned once per file open, inside the object literal at `appShell.ts:914`, on a path that runs at `:798` — once per open, not per render. Every row, every read and every diff is behind a click (`diffChrome.ts:306-320`). | Assert that no M8 diff code appears on any path `mount()` reaches — the same static claim the existing fence clauses make, extended to the two new closures' bodies. |
| **Agent-file badge** | **One `Set.has(basename)` per render, and on a miss ZERO nodes and ZERO listeners.** `buildAgentBadge()` returns `[]`, which `children.push(...)` spreads to nothing — the shape `buildDiffChrome` already takes on every content-script render today (`diffChrome.ts:175`). It reads no committed DOM and no layout. | Node-count and listener-count equality on an unrecognized document (guard (ii)). |
| **Table tools** | **On a table-free document: one `querySelector('.peekover-reader')` plus one `querySelectorAll('table')`, then an early return before any allocation** — structurally the shape `enhanceDiagrams` already ships and already pays (`diagramEnhancer.ts:683-687`, whose own comment says the fence-free document *"is not retained, which keeps the no-diagram case exactly as cheap as it was"*). On a table-bearing document: node creation that is **O(columns) + O(rows moved)**, performed **after `replaceChildren` has committed**, with **no `parse()`, no `sanitize()`, and no layout read**. | The negative half is directly assertable: the enhancer's synchronous prologue calls neither `parse` nor `sanitize` and touches no `getBoundingClientRect` / `offsetWidth` / `getComputedStyle`. That is what "cheap" *means* here, and it is a test rather than a claim. |

★ **The honest caveat, stated rather than smuggled:** *after the commit* is not *free*. Post-mount work still lands before the frame the user perceives as settled. The claim above is deliberately not "it costs nothing" — it is "it re-parses nothing, re-sanitizes nothing, and reads no layout", which is the mechanism behind cheapness and is the part that can be checked without an instrument the repo does not have.

**(ii) The CONDITIONALITY GUARD — the structural form of §5's *"a document with no table and no recognized name shall pay nothing measurable"*.**

A real-engine test, on **both surfaces**, with **three arms in one run**:

1. `mount()` alone, no enhancement — the floor;
2. `mount()` + M8's enhancements, on a document with **no table and an unrecognized name**;
3. `mount()` + M8's enhancements, on a document with **a table and the name `CLAUDE.md`**.

Assert **(1) == (2)** on two counters — total shadow-root node count, and `addEventListener` calls recorded by instrumenting `EventTarget.prototype.addEventListener` for the duration of each arm — and **(3) > (2)** on both.
★ **The equality is the property; the inequality is the POSITIVE CONTROL THAT FIRES** (M6 retro finding 1). Without arm 3 the equality proves nothing, because a counter that never moves reads equal whether or not the code ran. Also assert that **no element carrying any M8 class exists anywhere in arm 2's shadow root**.

**(iii) The CARRIED HOLE, recorded with its trigger.**
The app page has **no first-paint instrument at all** — all seven `perf-*` harnesses checked at HEAD, none drives it; `perf-first-paint.ts` can drive only the content script, and the one programmatic seam, `__peekover.selectFile`, is `import.meta.env.DEV`-guarded (`entrypoints/app/main.ts:20-22`) and therefore stripped from the production build a harness would have to measure (`progress.md` § Baselines, *FINDING — THE APP-PAGE RENDER PATH HAS NO FIRST-PAINT INSTRUMENT AT ALL*). It is 007 §4-5 carried, now one milestone older.
**M8 does not fund the harness** (human ruling). **The trigger that does:** the next milestone that puts work on the app-page render path whose cheapness **cannot be argued mechanically** — anything that parses, sanitizes, reads layout, or runs an engine there — **funds the harness before it ships that work.** §8-1 remains the backstop, and it remains a backstop for the **content-script** half only, because that is the half the repo can measure.

**D-12 · Design translation: the mockup HAS a table-tools design, it diverges from the spec in four places, and it has NO filter at all. DECIDED.** (spec §7-10)
`decisions.md` entry: *"008 D-12 — the mockup's table language is carried, its interaction model is not, and the filter has no baseline to transcribe from"*

`design/mockup.html` (97,471 B) has §s2 *"Tables that behave"* at `:565-580`: `<th onclick="sortTbl(0,this)">` with `<span class="arr">▲</span>` (`:570`), styled `th .arr{color:var(--accent);font-size:10px;margin-left:4px}` (`:147`), inside `.tablewrap{margin:22px 0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden}` (`:143`). Carry the *language*; the spec wins on all four divergences, each recorded in-code:

1. **`onclick` on a bare `<th>` → a real `<button>` inside the `<th>`.** §4 requires keyboard reach; `watchControl.browser.test.ts:339` and `themeControl.browser.test.ts:250` pin the shipped shape (a real button, no `tabindex` of its own, accessible name carrying selection AND action).
2. **A `▲` glyph alone → `aria-sort` on the `<th>` PLUS text.** §5 forbids state carried by an icon alone.
3. **"CSV, JSON, or Markdown" (`:566`) → CSV and Markdown only.** §6 defers JSON.
4. **★ The mockup has NO filter.** §4 requires one, so the filter has **no design precedent and no sibling suite to transcribe from** — which is retro finding 4's *other* half in terms (*"If no sibling suite exists, THAT IS THE SIGNAL"*). It gets an explicitly enumerated property set rather than an inherited one (§3.11).

★ **A structural finding the mockup hides: markdown-it emits a BARE `<table>` with no wrapper.** `.tablewrap` does not exist in our DOM; `readerCss.ts:170-173` puts the border, radius and `overflow:hidden` on the `<table>` itself. So the toolbar has no container to live in. **Decision: the toolbar is inserted as a PRECEDING SIBLING of the `<table>`, inside `.peekover-reader` — no wrapper element, no move of the table.** Fewer mutations than wrapping, and the committed column shape stays closer to what the golden string describes. Whether that reads as attached to the table is a walk judgement (§7).

★ **Token verification, run this session and to be re-run per token before use.** `readerCss.ts`'s three theme blocks are `:host` light (`:31-40`), `:host([data-theme="dark"])` (`:43-48`) and `:host([data-theme="sepia"])` (`:51`). **Sepia overrides ONLY `--paper`, `--ink`, `--accent`, `--accent-soft`** — so `--panel`, `--line`, `--muted` and `--faint` are **inherited from the light block** on sepia. Any toolbar surface using `--panel` will be light-panel on sepia paper. This is the identical check 006 §1.7 and 007 §1.4 ran, and it must be run again for whatever tokens the table chrome uses; **never substitute a nearby token silently.**
★ **`--reader-measure` is `748px` (`readerCss.ts:83`), consumed at `:85` and `:570`.** The toolbar sits INSIDE the column and therefore inherits the measure — it needs no `max-width` of its own, and §3.11 row 6 applies to it.
★ **No `ch` unit in any layout-blocking property** (`margin`, `padding`, `transform`) in new styling (retro finding 6 — the memory of record prices it at ~28 ms); `max-width` is free.
★ **Finding 9, pre-empted:** styling rationale lives in the **TypeScript doc comment above** the block, never inside the CSS template literal. `readerCss.ts` is on **both** graphs, so its comments ship to the content script too — the failure `diffChrome.ts:40-44` records as having cost ~8 KB once. Placement is re-measured with a **real rect probe** (005's precedent, `diffChrome.ts:38-129`'s worked elimination), never chosen.

### 0.1 Decisions this plan needs that the SPEC DOES NOT COVER — flagged, not guessed

Routed to gate 2 as §8. Two are copy, one is a scope-edge the spec is silent on.

### 0.2 Eight inherited citations RE-DERIVED, and where they drifted

Recorded rather than silently corrected — the spec demands re-derivation in terms, so what the re-derivation found belongs on the record. **None changes a spec decision; all eight are line drift, and one is a genuine sharpening.**

| # | spec cites | re-derived at `f46f558` |
|---|---|---|
| 1 | `readerPane.ts:176-186` — where the name is dropped | The `mount()` call is `:180`, `enhanceDiagrams` `:185`. **★ And the name is not dropped at the mount call — it is dropped one level earlier, by `classifyReaderOutcome` (`:62-67`), whose `render` arm is `{ kind:'render'; text }` (`:52`) and carries no name at all. `paint()` never has it.** That is the same fact, stated where it can be acted on. |
| 2 | `appShell.ts:911-935` — the provisioning closure | The `docId != null` guard is `:912`, `registerDiffContext(createDiffContext({` is `:914`, the block closes `:935`. |
| 3 | `diffChrome.ts:206` — the picker's `aria-label` | `:204`. (`:206` is `picker.hidden = true`.) `compareWith` at `:242` ✓; the row's `aria-label` at `:280`, inside `:279-281` ✓. |
| 4 | `readerCss.ts:169-180` — table styling | `:169-179`. (`:180` is blank.) |
| 5 | `parse.ts:58` — `parse()` | `:57`. `ENABLED_RULES` (with `'table'`) at `:40` ✓; the module-level `md` instance at `:42` ✓. |
| 6 | `folderSource.ts:31-63,67-77` | `MarkdownFile` `:31-58`; `FolderSource` `:67-78`. |
| 7 | `isRenderableContext.ts:57` — the shared gate | `:57` is the `.some(ext)` line inside `hasMarkdownExtension` (`:55-58`); `isRenderableContext` itself is `:67`. `MARKDOWN_EXTENSIONS` `:20-30` ✓ — nine extensions, no dotfile, no extensionless entry. `walkPolicy.ts:183` ✓ is the mirroring line in `isMarkdownFile` (`:181-184`). **§3.5's finding holds exactly as stated: `.cursorrules` is unreachable, not un-badged.** |
| 8 | `mount.ts:39-66` `MountOptions`, `:143-198` the `children[]` list | ✓ both. `children` is declared `:154` and `root` is pushed last at `:203`; the commit is `:210`. `diffRegistry.ts:80-103` ✓; `diffChrome.ts:242` ✓; `diagramEnhancer.ts:678` ✓; `settings.ts:30-34,39` ✓; `sanitize.ts:36` carries `table/thead/tbody/tr/th/td`. |

★ **One consequence of row 8's last item, which the spec did not need but the plan does:** because `sanitize` allows table tags, a **hand-written HTML `<table>` with no `<thead>`** can reach the reading column from source. So §4's *"When a table has no header row, the system shall leave it exactly as rendered"* is a **real** entry condition, not a formality — markdown-it's GFM table always emits a `<thead>`, but the sanitizer's allow-list means that is not the only way a `<table>` gets there.

---

## 1. Architecture & data flow

### 1.1 Identity → badge (D-1, D-2)

```
app page:        installWatchForFile(file)          # appShell.ts:838, runs BEFORE the mount (:798→:799)
                   registerDocIdentity(file.name)   # beside registerDiffContext (:914), NOT under the docId guard

content script:  runReader()                        # runReader.ts:113
                   if (!isRenderable(location.href)) return          # :118 — the URL is already in hand
                   registerDocIdentity(basenameOf(location.href))    # decodeURIComponent'd
                   … mountReader() → mount(source, host)             # mountReader.ts:90

both, per render:  mount() → children.push(...buildAgentBadge())     # one line, the 5th instance of the pattern
                     buildAgentBadge(): getDocIdentity() → isAgentFile(name) ? [badge] : []
```

Read at **build time**, never captured — the property `diffRegistry.ts:5-10` states for its own siblings (*"the affordance … must ask THIS module at render time rather than capture a reference that the next re-render would strand"*). Last-write-wins, no unregister: a stale name is overwritten by the next open, and the app page's `select(null)` path never mounts at all.

### 1.2 The picker with two kinds (D-3, D-4, D-5)

```
openPicker():                                      # diffChrome.ts:286
    snapshots = await context.fetchMeta()          # unchanged
    files     = await context.fetchFiles?.() ?? [] # NEW, optional
    if both empty: closePicker(); say(<one line>)  # today's shipped path, unchanged
    rows = groups(snapshots, files) if both non-empty else flat(the non-empty one)
    say(<what is missing>) if exactly one is empty

compareWith(target):                               # branches ONCE on target.kind
    before = target.kind === 'snapshot' ? await fetchText(id) : await fetchFileText(path)
    after  = context.getCurrentSource()
    … unchanged: showDiff(host, before, after) over the fence
    say(<caption naming both sides>) if target.kind === 'file'    # D-5
```

`fetchFiles` is provisioned at `appShell.ts:914` from `activeSource.files` (`folderSource.ts:70`), **excluding the current `file.path`** — "another file", not "any file including this one", which would offer an always-empty diff. `fetchFileText(path)` closes over the same list and calls that entry's `read()` (`folderSource.ts:36`) — **a fresh read, not a stored copy**, which is §3.2's stated reason for not reaching through storage.

### 1.3 The table enhancement (D-6, D-7, D-8, D-9)

```
enhanceTables(host):                        # total (D-7); returns immediately
    column = host.shadowRoot?.querySelector('.peekover-reader')     # D-8 — the scope IS the exclusion
    if (!column) return
    for (table of column.querySelectorAll('table')):
        if (table.hasAttribute(TABLE_STATE_ATTR)) continue          # idempotence, diagram precedent
        if (no <thead> with <th>) continue                          # §4, and a real condition (§0.2)
        try { attach(table) } catch { leave the table exactly as rendered }   # per-table, §4
```

- **Sort** reorders `<tr>` nodes in `<tbody>` — stable, three-state per column (asc / desc / off), numeric-aware on displayed cell text (§3.6). Off restores document order, which is available because the rows were **moved, never rebuilt**.
- **Filter** sets `hidden` on non-matching `<tr>`s — never removes them, so clearing is exact rather than a re-render (§3.6), and the count is announced politely (§5).
- **Copy** reads `textContent` from the rows **currently shown, in the order currently shown** (§4), and emits CSV or Markdown. Nothing re-enters the sanitizer; **every new node is built as DOM, never as an HTML string** (§5, AGENTS.md #3).

### 1.4 Where the cost lands

Two of the three items add per-document work to the render path; the third adds none (D-11). On the content script that work is priced against **26.9 ms worst-arm median / 29.9 ms floor** (`progress.md` § Baselines) — §8-1's measurement, §7's protocol. On the app page it is argued mechanically and guarded structurally (D-11 (i), (ii)), with the coverage hole carried (D-11 (iii)).

## 2. Files to create / touch / NOT touch

**Create** — `src/render/docIdentity.ts` (D-1, data only, no imports) · `src/render/agentFile.ts` (D-2, the pure predicate + the frozen name set) · `src/render/agentBadge.ts` (D-2, `buildAgentBadge`) · `src/render/tableEnhancer.ts` (D-6/D-7/D-8, the orchestration; on **both** graphs, and it must import nothing that is not) · `src/render/tableTools.ts` (the toolbar, sort/filter/copy view) · test files per §5.

**Touch** — `src/render/mount.ts` (**one line**: `children.push(...buildAgentBadge())`, D-1) · `src/render/diffRegistry.ts` (D-3: two optional members on `DiffContext` and on `createDiffContext`'s config; the existing four **byte-untouched**) · `src/render/diffChrome.ts` (D-4/D-5: `openPicker` `:286`, `buildItem` `:264`, `compareWith` `:242`, the picker's `aria-label` `:204`, the copy constants `:141-146`) · `src/app/appShell.ts` (`:914`'s literal gains two closures; `:137-140`'s enhancer const gains a call and a truthful name) · `src/app/readerPane.ts:185` · `src/render/mountReader.ts:90` · `src/watch/contentWatch.ts:121` (D-6 site 4) · `src/render/runReader.ts:118-119` (D-1's content-script registration) · `src/theme/readerCss.ts` (table-chrome tokens + the badge's sibling rule; **`CONTAINED_CSS` only where the chrome is app-page-only**).

**Explicitly NOT touched** — `src/render/parse.ts` (§3.5: one parser, one instance; the GFM `table` rule already emits what is needed) · `src/render/sanitize.ts` (no new HTML string, no profile change; 007's SVG profile untouched) · `src/settings/settings.ts` and `src/app/store.ts` (§3.5, §3.9: no settings key, no store, no `DB_VERSION`) · `src/detect/isRenderableContext.ts` and `src/app/walkPolicy.ts` (§3.5: `.cursorrules` stays out; the shared gate does not move) · `src/render/diffEngine.ts` / `diffView.ts` (§3.2: the engine and the view are unchanged — only the picker widens) · `src/render/diagramEnhancer.ts` / `diagramEngine.ts` (D-6: the table enhancer must never import them) · `wxt.config.ts` · `docs/trust/PERMISSIONS.md` (**no new capability row — nothing is stored and no permission is added**; if that stops being true it is a stop-and-flag, not an edit) · `tests/manifest.test.ts` (**2975 B, byte-unmodified since `3b6c575`**) · `tests/golden/output/*` · `package.json`.

## 3. Risk resolutions (spec §7 → concrete)

1. **First-paint headroom, known on one surface and uninstrumented on the other** → **the content-script half is PRICED, not re-measured**: §8-1's A-B-A against **26.9 ms median / 29.9 ms floor**, on the gated fixture **and on a document with neither a table nor a recognized name**, floor beside median (finding 7), with the byte delta decomposed to a zero residual and proven by ablation with a control that fires (finding 1). **The app-page half is D-11**: per-item mechanical claims, the three-arm conditionality guard, the hole carried with its trigger named. If the gate cannot hold with all of §3.7's reach, **the surface reach gives way, not the gate** — a gate-3 finding, never a quiet re-scope.
2. **Where identity enters, without making `mount()` stateful** → **D-1**: a data-only registry, registered at each surface's existing pre-mount site, read at build time. `mount()` gains **one line** and stays read-only library. The decisive argument is the re-render property, not tidiness.
3. **`DiffContext` with two target kinds** → **D-3**: a second **optional** capability pair; the snapshot pair byte-untouched; the discriminant on the picker row. **The M6 import fence is unchanged** — both closures are provisioned at `appShell.ts:914`, and `diffChrome.ts` still imports only the registry.
4. **Sort/filter state across a watch re-render** → **D-9**: confirmed *"unsorted"*, and confirmed **structurally** — `replaceChildren` leaves no row that could be stale. Verified revert-and-fail against a build that carries the state across.
5. **One listbox, two kinds** → **D-4**: ARIA groups inside the one listbox, rendered only when both kinds exist; empty states in the existing status line; the snapshot-only path structurally unchanged. No second control.
6. **Clipboard on both engines** → **D-10**: **resolved, no permission, no AGENTS.md #4 event**, cited to MDN and corroborated by the harder case already shipping at `permissions: []` (`diagramView.ts:306-315`). The `file://` secure-context residual is named and proven empirically, not argued.
7. **The sibling-checklist audit** → **discharged below in §3.11**, as a plan deliverable rather than a note.
8. **Table in a diff or the raw view** → **D-8**: excluded by SCOPE, and the scoping is required — `renderHunk` (`diffView.ts:119-128`) runs the full parser, so a diff of two table-bearing specs contains real `<table>`s a shadow-wide query would have enhanced. Re-entry is covered by the state attribute, and a diff round trip preserves sort state because it never re-mounts.
9. **A shared post-mount enhancement seam?** → **D-6: NO.** A shared composition point would put `diagramEnhancer` on the content-script graph and red the 8/8 fence; a registry of enhancers would keep it green while opening the graph, which is worse. Five explicit call sites, and **site 4 (`contentWatch.ts:121`) is named as the one that would be missed.**
10. **Design translation** → **D-12**: the mockup's table language carried, four divergences recorded in-code with the spec winning, the filter identified as having **no baseline to transcribe from**, the bare-`<table>` finding stated, tokens verified against all three theme blocks (sepia overrides only four), `--reader-measure` inherited, no `ch` in layout-blocking properties, rationale out of the CSS literal, placement re-measured with a rect probe.

### 3.11 THE SIBLING-CHECKLIST AUDIT (§7-7 · retro finding 4) — the plan's deliverable

*Enumerated at `f46f558` from the five named suites: `diffChrome`, `remoteMedia` (the `remoteMediaUi` surface), `themeControl`, `watchControl`, `diagramLightbox`; plus `storagePanelOverlay`, which 007 §3.5 established as the only baseline for several rows.*
*`Y` = the property is inherited and the same shape is tested · `D` = a distinct assertion is required · `—` = explicitly out of scope, with the reason.*
***M8 adds TWO chromes with OPPOSITE geometry:** the **badge** (a SIBLING of `.peekover-reader`) and the **table toolbar** (INSIDE the reading column). Both columns are filled, because a single verdict would be wrong for one of them.*
***`tasks.md` consumes this table; no table-tools or badge browser test is written before it is read.***

| # | property | sibling source | badge | table toolbar |
|---|---|---|---|---|
| 1 | renders on BOTH surfaces through the one `mount()` seam | `themeControl:115,122`; `watchControl:189` | **D** both surfaces, gated on §8-1 | **D** both surfaces, gated on §8-1 — but the toolbar does **not** come through `mount()`; it comes through four call sites (D-6), so the two-surface case is asserted per call site |
| 2 | grows NO chrome where the capability is absent | `watchControl:198`; `diffChrome:242` | **D** unrecognized name → **no badge and no note** | **D** no `<table>` → no toolbar, no listener (this is also D-11 (ii)'s arm 2) |
| 3 | red-first that the gate is the RIGHT property | `diffChrome:274` | **D** ungate the name check; the badge must appear on an unrecognized document, proving the gate is the name and not an accident of the surface | **D** ungate the header-row condition; a headerless table must grow a sort control, proving the gate is the header |
| 4 | **SIBLING of `.peekover-reader`, never inside it** | `watchControl:205`; `diffChrome:312`; `mount.ts:154-203` | **Y** asserted **outside**, like every pill | **D — AND IT INVERTS**, exactly as 007 §3.5 row 4 did for the `<figure>`: the toolbar belongs to a block in document flow and is asserted **INSIDE** `.peekover-reader`, immediately before its `<table>`. **Transcribing row 4 unexamined would produce a wrong test.** |
| 5 | clears the reading column at a **WIDE viewport** | `watchControl:453`; `themeControl:341`; `diffChrome:431` *(the assertion M6 lost in transcription)* | **D** — and it is run at **both** `GEOMETRY_WIDTHS` (`diffChrome:83-91`: 1280 **and** 1400), because recovery B1's own note says a single wide width let the defect class ship | **D — and "clearance" INVERTS to "containment":** the toolbar is inside the column, so the property is that it stays **within** the column's box and does not push the first content block off-measure, at both widths |
| 6 | `--reader-measure` == resolved `max-width` | `diffChrome:474` | **—** the badge is a pill outside the column | **Y** the toolbar inherits the measure (`readerCss.ts:83,85`); a toolbar wider than the measure breaks the centring the variable exists to preserve |
| 7 | clears the conditional chrome (network indicator + remote-load pill) | `themeControl:352`; `watchControl:471` | **D** the badge takes a slot in a band `diffChrome.ts:110-129` already split into lanes — **the lane assignment must be re-measured, not assumed**, and per that block's own rule the **deterministic-width** element takes the left lane | **—** the toolbar is in the column and shares no band |
| 8 | clears the TOC rail and the mode toggle | `diffChrome:350` | **D** | **Y** via row 5's containment |
| 9 | the OPEN overlay clears that chrome too | `diffChrome:389` | **—** the badge opens nothing | **—** §3.6 ships no menu overlay; if gate 2 wants one for copy-out (§8-2) this row **activates** |
| 10 | out of flow; the page under it does not move | `storagePanelOverlay:121,135,145` | **Y** | **—** the toolbar is deliberately **in** flow; row 5 is its equivalent |
| 11 | anchored where it claims to be | `storagePanelOverlay:154` | **Y** to its lane | **D** the toolbar anchors to **ITS OWN** table — on a multi-table document, table 2's controls must act on table 2 (the `diagramLightbox:354,429` multi-instance shape, which is where 007 found this class of defect) |
| 12 | closing returns the slot to zero footprint | `storagePanelOverlay:169` | **—** nothing closes | **D** clearing the filter restores **every** row and the table's height returns to where it started |
| 13 | host attribute survives a re-mount | `watchControl:236` | **—** the badge is rebuilt from the registry every render; there is no host attribute to survive | **—** **D-9: state deliberately does NOT survive**, and row 3 of §5 asserts the inverse |
| 14 | still works after a re-render (closure death) | `watchControl:251,278` | **D** a badge built by render N+1 must read the CURRENT registry — verified against a document switch, which is the case that would strand a captured name | **D** the toolbar is rebuilt every mount; its handlers must reach the **current** table, not the destroyed one |
| 15 | state in TEXT and `aria-*`, not colour alone | `watchControl:310` | **Y** the badge is text (§5) | **D** `aria-sort` on the `<th>` **plus** text — D-12 divergence 2; the filter's result count is a polite announcement (§4) |
| 16 | a real `<button>`, keyboard-operable, no `tabindex` of its own | `watchControl:339`; `themeControl:260` | **—** the badge is not interactive | **D** every sort header, the copy control and the filter's clear — D-12 divergence 1 |
| 17 | accessible name carrying selection AND action | `themeControl:250` | **—** | **D** *"Sort by \<column\>, ascending"* — the name moves with the state, never position alone |
| 18 | decorative parts hidden from AT | `watchControl:348` | **—** | **D** the sort direction glyph, if one is drawn beside the text |
| 19 | reduced motion: no animation under reduce, **DOES** animate without it (non-vacuous) | `watchControl:358,694,709` | **—** the badge does not animate | **D** *if* any transition ships; §5 requires instant under reduce, and the non-vacuous half is what makes it a test |
| 20 | polite live region, out of the a11y tree while empty | `diffChrome:651` | **—** | **D** the filter's *"n of m shown"* line and any action-failure message |
| 21 | focus trap and restore | `diagramLightbox:244-373` (007's baseline) | **—** | **—** §3.6 ships no modal; **if gate 2 adds a copy menu, this row activates and the baseline now exists** |
| 22 | zero-network with a control that FIRES | `remoteMedia:120,140` | **D** | **D** same `/^https?:/i` predicate and `awaitFetchedUrls` shape (`remoteMedia:83-92`), across **sort → filter → copy**, with the control fetch shown live in the same test. **★ jsdom cannot see bytes on the wire, and a control routed through a sanitizer reads NO-FETCH while the route is open** — the control adopts markup no sanitizer has touched |
| 23 | `describe.each` over both surfaces | `watchControl:189` | **D** both, per §3.7/§8-1 | **D** both, per §3.7/§8-1 |
| **24** | **the FILTER has NO sibling suite at all** | **NONE** | — | **★ D — finding 4's other half.** No existing control filters anything, so there is nothing to transcribe from and **nothing would be noticed missing**. Per finding 4: *"If no sibling suite exists, THAT IS THE SIGNAL."* M8 establishes this baseline, and rows 12, 15, 17, 20 are where it lands. |

## 4. Risks & unknowns this plan still carries

1. **★ The app page's first paint is still uninstrumented, and M8 ships app-page work.** D-11 (iii) — carried by ruling, with the funding trigger named. The mechanical claims and the conditionality guard are what stand in for the number; they are strictly weaker than a measurement and are labelled as such.
2. **★ The content-script bundle stops being byte-identical for the first time in five milestones** (§5, by decision). Every byte must be assigned. An unaccounted byte is a defect, and an identifier grep over a minified bundle **cannot** be the instrument (M6 retro finding 1 — the memory of record is explicit that such a grep returns 0 either way). The instrument is ablation plus byte/md5 comparison.
3. **The `diff` fence must not loosen while the picker widens.** Two new closures in `appShell.ts` are on the correct side; `diffChrome.ts` gains a `?.` call and no import. `diffEngine.test.ts`'s three clauses (`:223-311`) and 007's 8/8 traversal both stay green — and clause B remains the control that proves clause A is a real absence.
4. **`installWatchForFile` now registers three things** (watch target, diff context, document identity) and its name describes one of them. Naming debt, not a defect; recorded so it is not "tidied" into a refactor that changes the pre-mount ordering `appShell.ts:783-793` documents as load-bearing.
5. **`enhanceDiagrams` and `enhanceTables` both mutate inside the reading column and neither knows about the other.** They are ordered per call site today (diagrams first). A table inside a mermaid fence is impossible, so they cannot collide on a node — but the ordering is an implicit contract and is stated here rather than left to the call sites.
6. **No shared browser-test helper module.** `flush()`/`afterFrames()`/`waitFor()` duplicated across 6+ files; 007 carried this and named the geometry checklist as what belongs in it. §3.11 is the third milestone's worth of argument for building it, and M8 still does not build it.
7. **The filter's per-table-vs-per-document question (§8-2) is measured, not chosen** — and the measurement is over the repository's own documents, which is a biased corpus for a tool whose users are AI agents writing arbitrary markdown. Named so the sample is reported with the number.
8. **Carried, unfixed:** `scripts/perf-first-paint.ts` prints a false `FAIL` on the 1 MB fixture; the M7 gantt/dark-mode legibility finding; the `mermaid/package.json` D-10(b) narrowing (carried, unforced, outside this fence).

## 5. Test strategy

- **jsdom unit:** `isAgentFile` (every name in the set, case variants that must NOT match, a percent-encoded path, an empty/absent name) · basename extraction from `file://` and from each raw host · the sort comparator (numeric-aware, stability on equal keys, three-state cycle, document-order restoration) · the filter predicate and its count · CSV and Markdown serialization from a given visible-row set (including a cell containing a comma, a quote, and a pipe) · the header-row entry condition · `docIdentity` register/read/reset.
- **Real-engine (Chromium + Firefox), red-first and non-vacuous:**
  - **§3.11 row 4, both directions:** the badge **outside** `.peekover-reader`, the toolbar **INSIDE** it — each verified red by putting it on the wrong side.
  - **§3.11 rows 5 + 6** at **both** `GEOMETRY_WIDTHS` (1280 and 1400), including the WIDE viewport finding 2 requires walked.
  - **D-8:** a diff whose hunks contain a complete markdown table grows **no** sort affordance; the raw view grows none; a diff round trip leaves the column's own table still sorted.
  - **D-9 revert-and-fail:** sort a table, drive a watch re-render that changes the source, assert document order and new-source row text — red against a build that carries the state across, with the defect's own signature (an old row in a new table).
  - **D-11 (ii)'s three-arm conditionality guard**, on both surfaces: `(1) == (2)` on node and listener counts, `(3) > (2)` as the control that fires.
  - **D-10:** clipboard write on both engines and on **both** content-script document classes (`file://` and an allowlisted raw host), plus the unavailable-clipboard degradation.
  - **§3.11 row 22:** zero network across sort → filter → copy, both engines, with the control fetch live in the same test, using the existing `/^https?:/i` predicate verbatim and markup no sanitizer has touched.
  - **§3.11 row 11:** a two-table document — table 2's controls act on table 2.
  - The picker's two-kind states: both kinds, snapshots only (**structurally identical to today**), files only, neither (**today's close-and-say path**), and the file-vs-file caption naming both sides.
  - Every §3.8 degradation: unreadable other file, malformed table, throwing enhancement, unrecognized name.
- **Pins every task:** `git diff tests/golden/output/` **EMPTY** — *and per the standing correction that proves nothing about chrome, placement, or a reordered row*, so §3.11's structural assertions are the actual guard · `tests/manifest.test.ts` green and **2975 B** · `permissions: []` on both built manifests · **`diff` off the content-script graph** (`diffEngine.test.ts` three clauses) · **007's static import fence 8/8**, and the table enhancer proven NOT to reach `diagramEnhancer`.
- **Revert-and-fail (finding 5) is the standard, not an option:** every regression test M8 produces is verified red **with the defect's own signature in the defect's own units**. A task that cannot produce one has not finished.
- **Measurement (not CI):** §7.
- **Human gate:** whether the toolbar reads as part of its table or as clutter above it · the filter at one big table vs several small ones (§8-2's walk half) · the presentation tuning set (§8-4) · Firefox everything · zero unexpected network with the Network tab open · **at least one WIDE viewport, recorded like an engine** (finding 2).

## 6. Group order

*Sequencing only. `tasks.md` at gate 3 owns decomposition, in a fresh session.*

Three hard constraints, all from the spec or from this plan rather than from convenience: **§3.11's audit precedes the first table-tools or badge browser test** (discharged above); **D-6's site 4 lands with site 3** — a content-script surface that enhances on first mount and not on re-render is a shipped defect, not a partial feature; and **§8-1's measurement cannot precede the code it measures**, so the surface reach is built behind its own gate and the ruling is taken at gate 3.

**1 · The identity seam.** D-1, D-2 — registry, predicate, badge, both registration sites, `mount.ts`'s one line. *Must NOT touch:* anything table- or diff-related. *Acceptance:* §3.11 rows 1–5, 14, 23 for the badge; the app-page ordering re-proven at the production path, not by a hand-registered fixture.

**2 · The picker widens.** D-3, D-4, D-5 — the optional pair, the groups, the row discriminant, the caption, every empty state. *Acceptance:* §4's compare criteria; the snapshot-only path structurally unchanged; **both fences green**.

**3 · Table tools, app page.** D-6 sites 1–2, D-7, D-8, D-9, D-12 — enhancer, toolbar, sort, filter, copy, degradation. *Must NOT touch:* the content-script call sites. *Acceptance:* §4's table criteria; §3.11's toolbar column; D-9 revert-and-fail; D-11 (ii) on the app page.

**4 · The content-script reach, behind its own gate.** D-6 sites 3–4. *Acceptance:* §3.11 rows 1, 23 on the content script; D-11 (ii) there; **the `diff` fence and 007's 8/8 both still green**; the byte delta decomposed to a zero residual.

**5 · Measure.** §7's tasks. **Produces numbers; forbidden from choosing values.**

**6 · Human milestone-close gate + retro.** Including the §5 human-gate list, the recorded viewports, and the floor-delta statement before any re-baseline is discussed (finding 8).

**§4 EARS coverage:** Compare → 2 · Agent-file → 1 · Table tools → 3 (+ the content-script clauses → 4) · Trust → 1–4 (manifest/bytes/network per group), 5 (the byte decomposition) · Degradation → 1, 2, 3. Every clause has at least one group.

## 7. Measurement plan (§8-1 · §8-2 · §8-3 · §8-4)

*Every task below is **forbidden from choosing a value**. Protocol for anything timed: **A-B-A against a same-session HEAD control, floor reported beside median** (finding 7), with the ablation as the firing control (finding 1), on a **quiesced machine**. The headroom is an INPUT, not an output — it is not re-measured.*

- **§8-1 — does the content-script reach ship?** Axes: (a) the content-script byte delta, **decomposed to a zero residual** — table-tools code, badge code, glue — proven by **ablation with a control that fires**, never by an identifier grep; (b) first-paint delta on the gated 50.4 KB fixture, **floor beside median**, against the standing **26.9 ms median / 29.9 ms floor** worst-arm headroom; (c) the delta on a document with **no table and no recognized name** — the case §5 requires to be free, reported beside the conditionality guard's structural result. **The rule is already set and the value is not:** if the gate cannot hold, the surface reach gives way.
- **§8-2 — per-table or per-document filter?** Outputs: the distribution of tables per document across this repository's own markdown **and** the golden fixtures — how many documents have one table, several, none — with the corpus's bias stated (§4-7). The judgement half is 006's *reads-as-noise* shape and is a walk.
- **§8-3 — the threshold below which a table grows no tools.** Axes: row count · column count · whether any column is numeric. Outputs: the distribution across the same corpus. **An always-on answer is legitimate; it must be chosen, not defaulted into.**
- **§8-4 — which presentation defaults a recognized agent file gets.** Axes settled (presentation only, nothing persisted, parser untouched). A walk judgement at gate 3, because a tuning nobody notices is not worth its code and one everybody notices is a theme change in disguise.
- **App-page bytes:** app chunk against **389,143 B** and `pnpm zip` against **1,300,383 / 1,300,442 B**, decomposed. **No dependency lands**, so any delta is our own code.

## 8. Gate-2 questions

1. **Should a SNAPSHOT diff also name both sides (D-5)?** §4 requires it only for file-vs-file, and §3.2's reasoning is that a snapshot's "before" *is* an earlier version of what you are reading, so the direction is not in doubt. My lean is to leave snapshot diffs exactly as they are — changing them is scope the spec did not ask for — but the result is one diff view that captions itself and one that does not, and a user meets both. **Worth a decision rather than a default.**
2. **Does copy-out need a MENU, or two controls?** §3.6 ships CSV and Markdown and does not say how they are offered. Two small buttons need no overlay and activate none of §3.11's overlay rows; a menu needs a popup, which activates rows 9 and 21 (focus trap — for which 007 now provides a baseline) and is more chrome inside the reading column. **My lean is two buttons**, on the "a table is not a data grid" principle §6 already states. This is a copy-and-affordance call, and it changes what group 3 has to test.
3. **The badge's LANE (§3.11 row 7).** `diffChrome.ts:110-129` split the top band into lanes and gave the left one to the diff pill because its width is deterministic. The badge's width is also deterministic (one of ~6 strings), so a third lane is derivable rather than tuned — but the band is now carrying three things at 1280, and `diffChrome.ts:77-82` records that at 414 **every** candidate already collides. **Should the badge take a third lane in that band, or sit somewhere else entirely?** The measurement is group 1's; the design call is yours.
4. **Confirming the carried hole (D-11 (iii)).** The ruling is banked and this plan serves it. The plan adds one thing the ruling did not name: **a trigger** — the next milestone that puts non-mechanically-cheap work on the app-page render path funds the harness first. **Confirm that trigger, or replace it**, so a future planner inherits a condition rather than a memory.

---

*Gate: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` — the ORDER — is the next artifact and the next gate, generated in a **fresh session** (C14). **No implementation code before `tasks.md` is approved** (WORKFLOW.md §5.3).*

*No spec amendments ride with this plan. The spec was found correct everywhere this plan checked it — including §3.2's engine-is-already-file-agnostic finding, §3.4's the-renderer-never-learns-the-filename finding, §3.5's `.cursorrules`-is-unreachable finding, §3.6's post-mount-precedent finding and §5's baseline figures. The eight corrections in §0.2 are line drift in citations the spec itself ordered re-derived, not errors in its reasoning, and `spec.md` stays sealed.*
