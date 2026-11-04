# M13 census — every test the toolbar move touches (task 4.0; D-17; gate-3 Q1, Q2)

*Written 2026-11-02 against `main` at `432cd02` (PR #24), before any toolbar code, against the approved mock
(`design/toolbar-mock.html`; `decisions.md` "M13 GATE — 3.1 TOOLBAR MOCK APPROVED" and its addendum). No production or
test file was edited. Each group-4 task cites the row IDs it changes; a test it edits that has no row here is a
discovered row, added here in that task's commit.*

## How the census was taken

- **Found, not trusted from the plan.** Every `*.test.ts` under `src/`, `tests/` and `entrypoints/` (178 files) was
  scanned for the moved chrome by class string, exported constant, builder function and visible text: the mode, theme,
  watch, Compare and Edit pills (and the watch note, the capture disclosure, the diff status), the agent badge, the
  remote-load bar and network indicator, `CONTAINED_CSS`, the 130 px band and `--edit-bottom`, and the app header's
  brand, tag, theme, code-theme, Stored data and Export controls. 68 files hit; the 3 files plan §5.3 names that did not
  hit were added; the shared helpers in `tests/browser/helpers/` reach no moved chrome. Every one of the 71 files was
  then read in full and classified test by test (an `it.each` / loop is one row; where its content-script and app-page
  arms differ, two rows).
- **Classes (tasks.md 4.0):** **unchanged** · **re-spelled** (the selector or location moves; the property is kept) ·
  **retired** (the property ceases to exist in the approved design) · **replaced** (a new test owns the property in
  its new home). **Surface:** `app` (the app page — `mountAppShell` / `createReaderPane`), `tab` (the content-script
  reader — `runReader`, or `mount()` without `contained`, which KEEPS its floating pills and 130 px band: those rows are
  unchanged), `both`, or `unit-builder` (a builder tested where it is mounted does not matter).
- **Task** is the group-4 task whose change first breaks the row — where it must be re-spelled, retired or replaced
  in that same commit. A second task in the row's note is a later break of the same test.

## Baseline — the full browser suite at HEAD (`432cd02`), both engines, the CI font (DejaVu Sans)

| Engine | Files | Tests | Passed | Skipped | Failed |
|---|---|---|---|---|---|
| Chromium | 99 | 1,034 | 1,033 | 1 | 0 |
| Firefox | 99 | 1,034 | 984 | 50 | 0 |
| **Total** | **198** | **2,068** | **2,017** | **51** | **0** |

Run alone after a clean two-engine build (so the build-gated tests run), 416 s, EXIT 0.

## Summary

**353 rows across 71 files.** By class: re-spelled **209** · unchanged **104** ·
retired **27** · replaced **13**. By surface: app 268 · tab 42 · both 19 ·
unit-builder 24.

| Task | Re-spelled | Retired | Replaced | Total | What breaks there |
|---|---|---|---|---|---|
| 4.1 | 2 | 0 | 0 | 2 | the header becomes the toolbar: the "Zero network by default" tag and the brand text two tests read |
| 4.2 | 0 | 0 | 0 | 0 | — nothing breaks: the pills still render (F-6); the toolbar's watch / Compare / badge get NEW tests |
| 4.3 | 90 | 6 | 3 | 99 | the shadow-root Edit pill and `EDIT_CONTROL_CSS` go: every test entering edit through the pill |
| 4.4 | 46 | 0 | 1 | 47 | Theme, Code theme, Stored data and Export leave the header for the toolbar (and the "⋯" collapse — see Q-C) |
| 4.5 | 71 | 21 | 9 | 101 | the app page passes `pills: false`: every app-page shadow-root pill query, the capture disclosure, the pill lanes |
| 4.6 | 0 | 0 | 0 | 0 | — (first break elsewhere; `editorWalkPolish`'s 162 px gap is re-spelled here as its second step) |
| 4.7 | 0 | 0 | 0 | 0 | — nothing existing breaks (new tests) |
| 4.8 | 0 | 0 | 0 | 0 | — (first break elsewhere; one `readerPaneContained` hit-test needs the Files overlay opened here) |

### Plan §5.3 against what was found

- Plan §5.3 names **47** files (24 + 18 browser, 5 unit). Its own count says 45 and tasks.md (gate-3 Q2) says 48 (43
  browser + 5 unit); neither matches the list itself. All 47 are in this census.
- **Named, but nothing changes (all rows unchanged):** `editorNestedHost`, `tocPersist`, `diagramActions`, `tocNetwork`,
  `codeDegrade`, `diffRegistry`, `snapshotCapture`, `watchContentWiring` (browser); `codeEnhancer`, `mount`,
  `codeThemeControl` (unit). They test the tab surface, a builder, or a property no moved chrome carries.
- **Found, not named (24):** `copyAsRichText`, `copyAsPlainText`, `copyAsHtml`, `exportDegrade`, `pdfExport`,
  `exportNetwork` (open the Export panel from the header → 4.4); `appHeaderNarrow` (the 1.4 header wrap → replaced);
  `watchDiffDefer` (the watch note, the Compare pill → 4.5); `tableCost` (a badge count on a contained mount → 4.5);
  `contrastCensus` (measures the header and the pills → 4.3 / 4.4); `uiFonts` (reads the header brand → 4.1);
  `agentBadgeNetwork` (the app-page badge arm → 4.5); `diffChrome.test.ts` (the `CONTAINED_CSS` lane pins → 4.5); and,
  unchanged, `editMode`, `htmlExport`, `remoteMedia`, `readerMode.test`, `reader.test`, `agentBadge.test`,
  `readerPane.test`, `watchControl.test`, `agentFile.test`, `wipe`, `folderMode.network`.

### Q1 — every user function stays tested in every commit

Rule for group 4: a task that breaks a row re-spells, retires or replaces it **in the same commit**, and no row is
retired while its function has no other test. Function by function:

| Function | Where it is tested today (rows) | The task its tests move in | Gap? |
|---|---|---|---|
| Watch toggling | 49 rows (C020…C345) | 4.5 (app-page pill rows re-spelled to the toolbar's Watch, which 4.2 adds and tests while the pill still renders); tab rows unchanged; the 4.3 rows that also click the watch pill break again at 4.5 | none |
| Compare / picker opening a diff | 25 rows (C026…C327) | 4.5 (re-spelled to the toolbar's Compare, added and tested at 4.2) | none |
| Edit entering / leaving, Save, Ctrl/Cmd+S | 80 rows (C001…C252) | 4.3 — the pill goes and the segment arrives in one commit; every edit-entry helper re-spelled there | none — but see Q-E (R3 retired) |
| The unsaved-changes guard | 25 rows (C001…C252) | 4.3 (re-targeted to the segment; 4.3's own red-first proves it) | none |
| The capture disclosure | 3 rows (C058…C228) | 4.5 — replaced by `snapshotNotice.browser.test.ts` in the same commit that drops the pills (F-6) | none |
| The watch note (watching stopped / not available / changed again) | 4 rows (C020…C330) | 4.5 — re-spelled, but **its new home is not named** (Q-A) | **yes, unless Q-A is ruled before 4.5** |
| Theme switching | 16 rows (C056…C307) | 4.4 (one control; the header-vs-pill sync row retired, the toolbar test owns it); tab pill unchanged | none |
| Code theme switching | 5 rows (C056…C098) | 4.4 | none |
| Stored data opening, wipe, erase snapshots | 17 rows (C008…C274) | 4.4 | none |
| Export (panel, copy, PDF) | 31 rows (C082…C259) | 4.4; printMode's PDF negative control (the header tag) at 4.1 | none |
| Read / Raw switching | 5 rows (C112…C350) | 4.5 for app-page mode-pill rows (the toolbar's Read / Raw added at 4.1) | none |

### Questions for the human (product, not test) — and which task each blocks

- **Q-A · The watch note has no home on the app page after 4.5.** `pills: false` drops all of `buildWatchChrome`
  (`mount.ts`): the control, the plain-language note (`.peekover-watch-note` — "watching stopped", the Firefox picker's
  "watching isn't available", "changed again") and the capture disclosure. 4.2 moves the control and 4.5 re-homes the
  disclosure; neither the plan, tasks.md nor the approved mock names the note's home. *Proposed:* the toolbar renders
  `buildWatchNote()` below the toolbar beside the notice, from 4.2. **Blocks 4.5** (Q1).
- **Q-B · 4.1's Verify cannot be met as written.** It says "the toolbar reflects a backslash-key flip", but on the app
  page `\` is inert (the 2026-07-17 carried decision, pinned by `editMode.browser.test.ts`, "the app-page host shape"),
  and D-5 keeps the keyboard paths unchanged. *Proposed:* read it as "a flip the toolbar did not make" — a click on the
  still-rendered mode pill (pills remain until 4.5) or a programmatic `setReaderMode` — with `\` staying inert.
  **Blocks 4.1's Verify wording.**
- **Q-C · The ≤ 863 px "⋯" collapse has no task.** *Proposed:* **4.4**, when the four app controls join the toolbar.
  Test consequence: the browser harness's default viewport is 414 × 896, so from then every test that opens Export,
  Stored data, Theme or Code theme must open "⋯" first or set a wide viewport.
- **Q-D · The remote-load opt-in is anchored to the Compare pill's edge on the app page** (`CONTAINED_CSS`, M13 1.4).
  When the pill goes at 4.5, the anchor has nothing to hold. *Proposed:* the opt-in returns to its own lane in the
  reading pane (the rule deleted with the pill overrides). **Blocks 4.5.**
- **Q-E · The Edit segment's behaviour** (four points the plan leaves open): whether choosing Read or Raw while
  editing runs the exit, teardown and unsaved-changes guard (proposed: both do); what replaces "leaving edit returns
  to the mode you entered from" (proposed: the segment you click is where you go — the R3 row is retired); what the
  segment shows when the editor fails to load (proposed: the "Editor unavailable" retry state on the Edit segment
  itself); where focus goes after Escape (proposed: the Edit segment). **Blocks 4.3.**
- **Q-F · The header tag "Zero network by default"** is not in the approved mock, so it goes when the header becomes
  the toolbar (4.1); the status line's "No network calls" (4.7) carries the claim afterwards. `printMode`'s PDF probe
  uses the tag as its negative control and is re-spelled at 4.1. Confirm. **4.1.**

### Notes for the implementing tasks (no ruling needed)

- **4.5 — three app-page render paths.** `readerPane.ts:198` mounts directly; the save re-render (`appShell.ts:897`)
  and the watch re-render (`watchController.ts:607`, through the `render` the app injects at `appShell.ts:1726`) go
  through `renderWithEnhancements` (`appShell.ts:197`). `pills: false` must be forced there too, or the first save or
  watch update brings the pills back; `watchController.ts` itself need not change.
- **4.5 — the cited lines have drifted:** tasks.md cites `readerCss.ts:1314–1335` for `CONTAINED_CSS`'s pill
  overrides; at `432cd02` those lines are comments and the literal starts at 1343.
- **4.5 — harness drift.** Several tests mount `{ contained: true }` directly as a stand-in for the app page; they get
  pills by default and will stay GREEN after 4.5 while no longer matching production. Their rows are marked here and
  must be re-spelled on purpose — no red will force it (also `watchLifecycle`'s full-page app-decision tests).
- **4.2** — the Verify should include the toolbar badge refreshing on a document switch (the stale-name case
  `agentBadge`'s app arm exists to catch).
- **4.5** — if the toolbar does not reuse `buildDiffChrome` / `buildDisclosure`, those become dead on the app page;
  their unit rows stay (the tab still uses them) — say so in the task.
- **4.5 / 4.7 / 4.8 — print.** The new notice, status line, "⋯" menu and Files overlay are hidden in print like the
  header; `printMode`'s probe would otherwise pass on "Peekover 0.1.0" in the status line alone.
- **4.5** — the `notices` row survives "Clear diagram cache" and "Erase snapshots" (only "Wipe all data" clears it).

### The human's rulings on these questions (2026-11-02; `decisions.md` "M13 RULINGS — the 4.0 census questions")

- **A — the watch note** goes below the toolbar, in the same notice area as the snapshot notice — in the page flow,
  never over text — from 4.2. Settles the watch-note rows: C020, C326, C327, C328, C331, C334, C343, C344, C345
  (re-spelled at 4.5 to the notice area; the note is built there from 4.2).
- **B — 4.1's Verify** reads "the toolbar reflects a mode flip it did not make" (the mode pill, until 4.5); `\` stays
  inert on the app page. Settles 4.1's own new test (`toolbar.browser.test.ts`); no existing row.
- **C — the "⋯" collapse (≤ 863 px) belongs to 4.4.** Tests not ABOUT the compact toolbar widen their window instead of
  opening "⋯"; the compact toolbar gets its own tests. Settles how every 4.4 row is re-spelled (C008 … C307, the 47
  rows whose first task is 4.4).
- **D — the remote-images "load" bar** joins the notice area below the toolbar on the APP PAGE; the file:// reader keeps it
  where it is. Settles C031, C141, C143 (the bar's lane beside the Compare pill — retired at 4.5) and gives the bar its
  app-page home before 4.5.
- **E — the Edit segment:** Read and Raw leave edit through the unsaved-changes guard; "Editor unavailable" shows on the
  Edit segment; focus returns to Edit after Escape. **RETIRED: C046** ("R3 — the exit returns to the mode edit was
  entered from", named by the ruling) and **C174** (the same property in `editorRender`; re-classed here). Before 4.3.
- **F — the header tag** "Zero network by default" is removed at 4.1; the status line's test-backed "No network calls"
  carries the claim from 4.7. Settles C259.

### Done — rows handled, by task

- **4.1** (2026-11-02): C259 (`printMode`: the negative control now targets the header's "Stored data" text), C311
  (`uiFonts`: probes the toolbar's word), C354 (discovered: `appHeaderNarrow`'s part selector) — each carries a `KEEPS:`
  comment citing its row; and **C244** (`exportPanel`: "anchored under ITS OWN toggle") — moved up from 4.4 by the
  in-task fix that drops the three header panels from the header at ≤ 863 px; re-spelled to the wide viewport (ruling C).
  Not first-breaking at 4.1, unchanged: C287, C229–C231 (4.3).
- **4.2** (2026-11-02): no row first-breaks here (as counted). **C355 / C356** (discovered: 4.1's own order tests in
  `toolbar.test.ts` / `toolbar.browser.test.ts`) re-spelled, each with a `KEEPS:` comment. **C061** (`agentBadge` row 10,
  app arm) went red in the full suite — the toolbar's badge `<p>` kept UA margins; fixed in production (`margin:0`), the
  property kept and the test unchanged; the row still moves at 4.5. C319–C321's replacement tests are written here
  (`toolbar.browser.test.ts`); the rows themselves move at 4.5. Ruling A's note rows (C020 … C345) move at 4.5; the
  note's notice-area home is built and tested here.
- **4.3** (2026-11-02): all **99** rows naming 4.3 handled, each cited in its test — **re-spelled 89 · retired 7 · replaced
  3** (the count above said 90 / 6 / 3; ruling E moved C174 from re-spelled to retired). Retired: C046, C174 (ruling E),
  C047, C050, C051 (the control and EDIT_CONTROL_CSS are gone), C172, and **C165 IN PART — a deviation**: only its pairs
  with the edit control retire; the mode pill × TOC handle pair, the rail hidden in edit and the split's size are kept
  (the census classed the whole test retired). Replaced: C052, C053, C177 (the segment's own tests). Discovered and
  handled: **C357–C360** re-spelled, **C361** retired. Every file these rows name broke at 4.3, as the census predicted (each reached the removed control); no
  unexplained red. C228 (a 4.5 row)
  stays green because the notice's seat rule is kept as `CAPTURE_NOTICE_SEAT_CSS` (see decisions.md "M13 TASK 4.3").
- **4.4** (2026-11-03): all **47** rows naming 4.4 handled — **re-spelled 43 · replaced 1 · unchanged 3**. Re-spelled by
  ruling C (the window widened above 863 px, restored to 414 × 896 after each test), each file citing its rows in one
  `KEEPS:` block: C086, C088, C098, C100–C102, C104, C106, C111, C113–C115, C235–C247, C249, C250, C255–C258, C269–C274,
  C302, C303, C305–C307; C014 re-spelled in jsdom (the toggle is in the toolbar's app group). Replaced: **C082** (at
  ≤ 863 px the four app controls are behind "⋯", which must be inside the window; above it, all four). **Unchanged — a
  finding:** C008, C010, C012 (jsdom; the toggle is still in the header, now inside the toolbar, and a click reaches it at
  any width) — each helper says so. Only 4 tests per engine actually went red (C082, C241 ×2, C272); the rest stayed green
  at 414 px by clicking a toggle hidden behind "⋯" — harness drift ruling C exists to end, so all were widened.
  Discovered: C362–C364 re-spelled. **And C061 (a 4.5 row) moved up:** the full suite went red on its app arm at 1280
  (both engines; h1 168 vs 132) — the toolbar-wrap risk the row names: an agent file's toolbar is a few px too wide for one
  row there. HUMAN RULING (2026-11-03): the second row is approved; the app arm is re-spelled to 1400 (`KEEPS:`); the
  content-script arm keeps 1280 and 1400. No unexplained red.

- **4.5** (2026-11-03): all **100** rows whose task is 4.5 handled, each cited in its test — **re-spelled 70 · retired 21 ·
  replaced 9** — as counted (C061, re-spelled at 4.4 by the human's ruling, unchanged here). Replaced by new tests: C084,
  C140, C228, C300 (`snapshotNotice.browser.test.ts`, the toolbar tests). **Deviation:** C315, C317, C319, C320, C321
  (`watchControl`'s contained surface) re-spelled in place over the toolbar's control — the property kept in the same test —
  rather than replaced. Also handled: the rows whose 4.3 cell named a 4.5 step — C181, C187, C195, C199–C202
  (`editorSave`) and C210 (`editorUnsaved`): the Watch step is the toolbar's; C264 (4.5, 4.8); C165's remaining mode-pill
  clauses and C178's mode-pill clause retired, as the rows said. **Unpredicted: C168** (`editorNestedHost`, counted
  unchanged): its split tests mounted contained WITH pills — a shape the app page no longer produces — and with the seat
  rules deleted those pills covered the preview at 414 px; the split tests now mount `pills: false` (`KEEPS:`), the hazard
  tests keep the full chrome they need. Drift rows re-spelled on purpose: C112, C117, C278, C315–C325. C027–C029 unchanged
  (`LANE_SELECTOR` matches by DOM order, which still holds; C030, the CONTAINED lane rule, retired). Discovered: **C365–C371** re-spelled. The first full suite went red only in
  rows named here (21 tests, 5 files); then green. No unexplained red.

- **4.6** (2026-11-03): **C225** (`editorWalkPolish` R29(b)) — its second step, re-spelled (`KEEPS:`): the tolerance
  162 → 28 (the pane's padding + 4; the band's allowance RETIRED — no pill stack on the app page since 4.5), at
  1440 / 1080 / 414 × light / dark (was 414 / 1400). No row first-breaks at 4.6, as counted; the full suite went green
  on its first run. New 4.6 tests sit beside it in the same file (no census row: written here).

- **4.7** (2026-11-03): no row first-breaks at 4.7, as counted. **C225** re-spelled again, with 4.6's split tests in
  the same file: they measure to the READER PANE's foot (the status line now sits below the pane, at the window's
  foot), and the status line joins 4.6's overlap set (4.6's ★ note). The full suite went green on its first run.

- **4.8** (2026-11-04): the Files overlay at ≤ 1272 px (the measured breakpoint, not 1080 — the human's ruling). The
  first full suite went red in three tests per engine, all the same cause — once a file is open at 414 px the folder
  pane is a closed overlay — each re-spelled to open "Files" first where it is shown (`KEEPS:`): **C264**
  (`readerPaneContained`, the tree on top — as this census predicted for 4.8), **C218** (`editorUnsaved`, the page
  live after Escape — a later break of a 4.3 row) and **C260** (`printMode`, header and pane hidden in print —
  **unpredicted**: counted unchanged; its before-print control now reads the OPEN overlay, which print must hide).
  The census's 4.8 note for print holds: the pane (overlay or not) is `display:none` under print, the scrim is
  `screen`-only. Outside the census's scope (no moved chrome): 4.8's P1 (`statusLine` probes) and P2 (`fontLicences`
  separators), both test-only. The second full suite: one red, Firefox `uiFonts` (local-font class, green alone).

- **5.1** (2026-11-04, after group 4 — the folder pane): the breakpoint moved to ≤ 1189 px (the 228 px pane; the
  human's ruling). Three 4.8 re-spellings carry the number in their comment only, updated: **C218** (`editorUnsaved`),
  **C260** (`printMode`), **C264** (`readerPaneContained`) — their logic follows whether "Files" is shown, unchanged.
  `filesOverlay` (4.8's own file, no census row) follows the constant and gains 5.1's pane tests. **C142**'s note
  corrected in both tables: the open Compare picker is C364's, not 4.5's notice-area sweep's. No row first-breaks at
  5.1. **Gate-1 Q8: the 28 retirements below were acknowledged by the human on 2026-11-04** (5.0's plain-words list).

- **5.2** (2026-11-04 — the TOC look): no row first-breaks; the rail's left edge (what the column reserves) and the
  collapsed handle's place are unchanged. **KEPT, unchanged and green:** C091, C280 (toolbars clear the rail), C117 (the
  lightbox clears it), C226 (rail hidden in stacked edit), C260, C261 (print hides it), C297 (the theme pill clears the
  handle and list), C308 (TOC actions fire no request), C309, C352 (open state and width persist / survive a re-mount).
  **Retired:** none. Outside the census (no moved chrome): `tocScroll` gains 5.2's look tests; `nativeControls` (5.1's
  file) loses its two 5.2 rows and sweeps the content-script reader at 1440 px.

**Group 4 — final state (2026-11-04, after 4.8).** Every 4.x row is handled: 4.1 – 2, 4.3 – 99, 4.4 – 47 (+ C061 moved
up), 4.5 – 100, 4.6 / 4.7 – C225's later steps, 4.8 – C264 plus C218 and C260 (above); discovered rows C354–C371. The
**28 retirements** are the table below, unchanged since 4.5 — shown to the human at group 4's end (gate-1 Q8).

### Checking 4.1–4.8 against this census

tasks.md defines no lint for the comments, and 4.0 may not edit a test. Each group-4 task therefore checks, in its
own Verify: (1) every test file its diff touches has rows here naming that task, or the commit adds the discovered
rows here; (2) every re-spelled or retired assertion carries a `KEEPS: <property> (Cnnn)` or `RETIRED: <property>
(Cnnn)` comment citing its row; (3) the rows naming the task are all handled — a grep of the diff for the cited IDs
against this table, stated in the task's record; (4) the harness-drift rows (above) are handled at 4.5 even though
they stay green.

## Retirements — for the human (shown again at group 4's end)

| ID | File | Test | The property that ceases to exist, and why | Task |
| C174 | `editorRender.browser.test.ts` | entered from raw, the exit returns to raw | leaving edit returns to the mode it was entered from — RETIRED by ruling E (2026-11-02) with C046: in the segment, the one you click is where you go | 4.3 |
|---|---|---|---|---|
| C030 | `diffChrome.test.ts` | THE LANE EXISTS, and it is the CONTAINED sheet that carries it (D-14: app page only) | the diff status's own lane under the open picker inside the reader pane — a CONTAINED_CSS pill override (:1360-1361) | 4.5 |
| C031 | `diffChrome.test.ts` | the remote-load lane — declares left:176px BEFORE the anchored left, in the same CONTAINED_CSS rule | remote-load sits beside the Compare pill in the pane (anchor --peekover-diff); no Compare pill in the shadow root after 4.5 | 4.5 |
| C046 | `editorEnhancer.test.ts` | the edit control › R3 — the exit returns to the mode edit was entered from | 'return to entered-from mode' on one toggle; a Read/Edit/Raw segment names the target mode (see product Q) | 4.3 |
| C047 | `editorEnhancer.test.ts` | the edit control › R3 — the pill-hide rule lives in EDITOR_CSS, READER_CSS gains no rule | EDIT_CONTROL_CSS sheet shape; the constant is deleted (D-6) | 4.3 |
| C050 | `editorEnhancer.test.ts` | the edit control › is idempotent: no second control and no second stylesheet | idempotent install of the shadow-root Edit pill; pill removed | 4.3 |
| C051 | `editorEnhancer.test.ts` | the edit control › is one real <button> placed directly after the mode pill, with its own stylesheet | the shadow-root Edit pill and EDIT_CONTROL_CSS are removed (D-6) | 4.3 |
| C060 | `agentBadge.browser.test.ts` | 1.5 · (b) the contained pane's top:50 slot at %s — badge vs diff picker/status (MEASURED) | Badge-vs-diff-picker lane collision inside the app reader pane; both leave the shadow root | 4.5 |
| C063 | `agentBadge.browser.test.ts` | 1.5 · rows 5 + 8 — the clearance reading at %s [app page, rail open + default] | Floating badge clearance vs text and pills on the app page; no badge or pills in the app shadow root | 4.5 |
| C065 | `agentBadge.browser.test.ts` | 1.5 · the 414x896 reading, RECORDED [app page arm] | Floating badge reading in the app pane at 414; badge leaves the shadow root | 4.5 |
| C067 | `agentBadge.browser.test.ts` | 1.5 · the badge's own rect at %s — row 11 anchored to its lane [app page arm, 1280 + 1400] | Floating-badge lane position on the app page; badge moves to the toolbar | 4.5 |
| C070 | `agentBadge.browser.test.ts` | describe.each SURFACES — row 4 — a SIBLING of `.peekover-reader`, never inside it [app page arm] | Badge as a shadow-root sibling of the column: on the app page the badge lives in the light-DOM toolbar | 4.5 |
| C131 | `diffChrome.browser.test.ts` | half-empty (describe.each) › the OPEN picker itself is still where 6.2 put it | the picker's CONTAINED_CSS placement (top 50px in the reader pane); toolbar picker is placed anew | 4.5 |
| C139 | `diffChrome.browser.test.ts` | placement › clears the aside stack, the mode toggle and the TOC rail at %s (it.each 1280/1400) | floating Compare pill's position among the app-page pills; no pills remain to clear | 4.5 |
| C141 | `diffChrome.browser.test.ts` | placement › clears the remote-load opt-in that shares the top band at %s (it.each) | the shared top-band lane between Compare pill and remote-load opt-in; pill leaves the shadow root | 4.5 |
| C142 | `diffChrome.browser.test.ts` | placement › the OPEN picker clears that chrome too | floating picker's position among app-page pills; the open toolbar Compare picker is covered by **C364** (inside the window, every row reachable) — not by 4.5's no-overlap sweep, which covers the notice area only (corrected at 5.1, 2026-11-04) | 4.5 |
| C143 | `diffChrome.browser.test.ts` | placement › the opt-in's lane starts 24px after the pill's LAID-OUT edge (it.each) | remote-load anchored to the Compare pill's edge (CONTAINED_CSS anchor rule); no pill to anchor to | 4.5 |
| C146 | `diffChrome.browser.test.ts` | the affordance is a SIBLING › pill, picker and status all sit beside .peekover-reader | diff chrome is a shadow-root sibling of the column; with the toolbar in light DOM the relation ceases on the app page | 4.5 |
| C165 | `editorEyeballProxy.browser.test.ts` | proxy 2 — nothing collides at the top-right (it.each NARROW/WIDE x rail open/collapsed) | Edit-pill/mode-pill/handle collisions in the shadow root — no Edit pill (4.3), no mode pill (4.5); rail-in-edit kept by editorWalkPolish R29(c) | 4.3 |
| C172 | `editorRender.browser.test.ts` | %s: the control is hit-testable beside the pill and never under it, with either pill label (it.each NARROW/WIDE) | Edit pill vs mode pill adjacency in the shadow root — no Edit pill (4.3), no mode pill on app page (4.5) | 4.3 |
| C263 | `readerPaneContained.browser.test.ts` | the Raw toggle sits inside the reader pane | floating Raw pill's position on the app page; Read/Raw lives in the header toolbar | 4.5 |
| C279 | `tablePlacement.browser.test.ts` | 3.5 · row 8 — the mode toggle is clear in BOTH rail states — it never shares the column's band | Mode-toggle pill vs column band on the app page; Read/Raw moves to the header toolbar, outside the pane | 4.5 |
| C296 | `themeControl.browser.test.ts` | geometry — contained app-page pane, %s viewport (narrow + wide) | Theme-pill-vs-chrome clearance in the app pane; pill and its CONTAINED_CSS overrides deleted | 4.5 |
| C298 | `themeControl.browser.test.ts` | is a SIBLING of .peekover-reader, never inside the column (%s) [contained arm] | Theme pill placement in the app reader shadow root; no pill there after pills:false | 4.5 |
| C304 | `themeShell.browser.test.ts` | keeps the in-reader pill and the header control showing the SAME selection | Two app-page theme controls agreeing; 4.4 merges to one control (interim toolbar-vs-pill until the pill goes at 4.5) | 4.5 |
| C318 | `watchControl.browser.test.ts` | watch control — contained surface: is a SIBLING of .peekover-reader, never inside the reading column | placement of a shadow-root watch pill on the app page; toolbar lives in light DOM outside the shadow root | 4.5 |
| C322 | `watchControl.browser.test.ts` | watch control — geometry on the contained surface: clears the existing chrome, narrow/wide (it.each) | floating watch pill's position in the app-page reader pane (4.5's no-chrome-over-text sweep covers what remains) | 4.5 |
| C323 | `watchControl.browser.test.ts` | watch control — geometry on the contained surface: clears the reading column at a WIDE viewport | floating watch pill vs column on the app page | 4.5 |

## The table — one row per test (or test group)

### `src/app/appShell.test.ts`

re-spelled 12 · unchanged 8

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C001 | CLEAN — %s asks nothing (it.each over 7 TRIGGERS) | Clean edit: no dialog at or after any trigger; host leaves edit | re-spelled | Clean edit session leaves without asking, for every trigger incl. the Edit segment | 4.3 | app | unsaved-changes guard; Edit leaving |
| C002 | an unrecognized name is registered just the same — the registry names, the predicate judges | Registry holds intro.md; no shadow-root badge; no 'agent file' text in shadow-root chrome | re-spelled | Unrecognized name is registered but not badged; the absence must be read off the toolbar (shadow-root check goes vacuous) | 4.5 | app |  |
| C003 | appShell (008 task 2.2 — the D-3 pair provisioned, app page) — all 8 tests | Diff context fetchFiles/fetchFileText: present, omits open doc, follows selection, reads fresh, undefined fallback, members intact | unchanged |  |  | app |  |
| C004 | appShell (008 task 3.4 — table toolbar reaches the app page) — all 5 tests | Table toolbar inside column before its table, header-gated, absent without tables, one per render | unchanged |  |  | app |  |
| C005 | appShell (group-4 drag-and-drop folder target) — all 4 tests | dragover/drop preventDefault, drop seam funnels to chip + tree, notice on bad drop, snapshot note | unchanged |  |  | app |  |
| C006 | appShell (task 1.1 skeleton) — all 3 tests (renders header/folder/reader; CTA + plain line; idempotent mount) | Header, folder pane, reader pane exist; CTA live with trust line; second mount replaces | unchanged |  |  | app |  |
| C007 | appShell (task 1.2 reader wiring + designed states) — all 4 tests | No-selection state; selectFile renders h1 in host shadow root; empty and unreadable designed states | unchanged |  |  | app |  |
| C008 | appShell (task 1.6 — the "erase snapshots" control) — all 6 tests | Erase-snapshots button disabled/enabled by count, arm/confirm/cancel, confirm copy names erased and kept | re-spelled | Erase-snapshots control inside Stored data; only the `openPanel()` helper (line 931-933) moves | 4.4 | app | Stored data opening/wipe |
| C009 | appShell (task 3.2 folder grant flow) — all 9 tests | Grant chip + tree, recents, too-large/empty/cancelled/unsupported/snapshot states, revoke clears and erases snapshots first | unchanged |  |  | app |  |
| C010 | appShell (task 4.3 — the "Clear diagram cache" control) — all 6 tests | Verbatim 'Clear diagram cache' label, disabled at zero, arm/confirm/cancel, confirm copy | re-spelled | Clear-diagram-cache control inside Stored data; only the `openPanel()` helper (line 1111-1113) moves | 4.4 | app | Stored data opening/wipe |
| C011 | appShell (task 5.2 recents/pins reopen hub) — all 6 tests | Hub surfaces recents/pins; Chromium regrant vs Firefox repick; pin/unpin folder and file; denied reopen notice | unchanged |  |  | app |  |
| C012 | appShell (task 6.0 what's-stored + wipe controls) — the other 5 tests (summary, empty state, wipe confirm, wipe copy, cancel) | Panel opened via header storage toggle: summary lines, Nothing-stored state, inline wipe confirm/cancel, wipe copy | re-spelled | Stored data panel content and inline wipe flow; only the `openPanel()` helper (line 719-721) moves | 4.4 | app | Stored data opening/wipe |
| C013 | switching documents re-registers — the registry holds the CURRENT name, never the previous | getDocIdentity follows CLAUDE.md → intro.md → CLAUDE.md across tree clicks | unchanged |  |  | app |  |
| C014 | the "Stored data" control is discoverable in the header before any folder is opened | `.peekover-app__storage-toggle` exists with text 'Stored data' before a folder; no panel yet | re-spelled | Stored data control is discoverable before any folder is opened (now in the toolbar's app group) | 4.4 | app | Stored data opening |
| C015 | the FIRST file of a session is named BEFORE it mounts — 4.7's defect, re-run on new chrome | Registry holds CLAUDE.md and the shadow-root `.peekover-agent-badge` reads 'Agent file · CLAUDE.md' on the first mount | re-spelled | The first file of a session is badged on its first render (toolbar badge, not shadow-root pill) | 4.5 | app |  |
| C016 | while the question is up, another trigger is ignored | Edit control click raises dialog; a drop and openFolder meanwhile are ignored; one dialog | re-spelled | While the guard is asking, other triggers are ignored; first trigger becomes the Edit segment | 4.3 | app | unsaved-changes guard firing |
| C017 | ★ DIRTY — %s asks, and nothing of the action has begun (it.each over 7 TRIGGERS) | Dirty edit: each trigger raises the unsaved dialog; Keep editing preserves buffer and edit mode; nothing started | re-spelled | Every trigger (incl. the edit control) asks when dirty; `editing()` enters via, and TRIGGERS[0] clicks, the shadow-root `.peekover-edit-toggle` (lines 1741, 1788-1789, 1799) | 4.3 | app | unsaved-changes guard firing; Edit entering/leaving |
| C018 | ★ Discard edits starts the action INSIDE its own click — where the picker gets its activation | Discard calls the picker synchronously inside its click and ends the session first | re-spelled | Discard runs the pending action inside its own user activation (the `editing()` entry route moves) | 4.3 | app | unsaved-changes guard firing |
| C019 | ★ a drop is captured DURING its event, then asked about; Keep editing drops it | Drop outcome taken in-event, dialog shown, Keep editing never applies it | re-spelled | A drop during a dirty edit is captured then discarded on Keep editing (the `editing()` entry route moves) | 4.3 | app | unsaved-changes guard firing |
| C020 | ★ registration survives the NOT-WATCHABLE early return — the reachable silent drop | Firefox-picker source: no `.peekover-watch`, `.peekover-watch-note` present, AGENTS.md badged — all in the shadow root | re-spelled | Registration survives the not-watchable early return; firing control (note, no toggle) and badge both move out of the shadow root | 4.5 | app | watch (degraded-state explanation) |

### `src/app/readerPane.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C021 | (all 11 tests) | classifyReaderOutcome; pane designed states; contained mount (CONTAINED_CSS sheet present); host reuse | unchanged |  |  | app |  |

### `src/export/htmlExport.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C022 | (all 13 tests) | serialize/translate/wrap of a mounted reader; READER_CSS :host site count pinned at 26 | unchanged |  |  | unit-builder |  |

### `src/render/agentBadge.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C023 | (all 12 tests) | buildAgentBadge empty/recognized states, text label, no style/interactivity, fresh per call | unchanged |  |  | unit-builder |  |

### `src/render/agentFile.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C024 | (all tests, ~20 incl. it.each) | isAgentFile name set, case sensitivity, basenameOf, decode step — pure predicates in node env | unchanged |  |  | unit-builder |  |

### `src/render/codeEnhancer.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C025 | (all 30 tests) | fence predicate, sync prologue, text-only source, parseLineRanges, async engine, settings codeTheme wiring, rendered state — over bare mount | unchanged |  |  | unit-builder |  |

### `src/render/diffChrome.test.ts`

re-spelled 3 · retired 2 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C026 | (31 builder tests: D-14 gate x5, picker x4, two kinds x12, fence x2, fallback x4, half-empty sentence, 006-shaped silence, seam x2) | buildDiffChrome's gate, listbox picker, row kinds/groups, fetchText vs fetchFileText routing, captions, fallbacks, registry lookup at click time | unchanged |  |  | unit-builder | Compare/picker opening a diff |
| C027 | BOTH-EMPTY and the non-half-empty paths stay MUTUALLY EXCLUSIVE, in the original slot | both-empty and failure paths: picker closed before status speaks; status does NOT match LANE_SELECTOR | re-spelled | picker and status never both open outside the half-empty states; the 'original slot' clause is a CONTAINED_CSS position | 4.5 | unit-builder | Compare/picker opening a diff |
| C028 | HALF-EMPTY (files, no snapshots) — BOTH open, and the status is IN the lane | fetchMeta->[]: picker open with file rows, status says 'No snapshots yet', status matches LANE_SELECTOR | re-spelled | half-empty: list offered and empty half spoken at once; LANE_SELECTOR clause re-pointed or dropped when the lane rule goes | 4.5 | unit-builder | Compare/picker opening a diff |
| C029 | HALF-EMPTY (snapshots, no other files) — BOTH open, and the status is IN the lane | fetchFiles->[]: picker open with 2 rows, status says 'No other markdown file', status matches LANE_SELECTOR | re-spelled | half-empty: list offered and empty half spoken at once; the LANE_SELECTOR clause loses its CSS rule at 4.5 | 4.5 | unit-builder | Compare/picker opening a diff |
| C030 | THE LANE EXISTS, and it is the CONTAINED sheet that carries it (D-14: app page only) | CONTAINED_CSS holds the picker:not([hidden]) ~ status lane rule at top:calc(50px+min(46vh,320px)+6px); READER_CSS lacks it | retired | the diff status's own lane under the open picker inside the reader pane — a CONTAINED_CSS pill override (:1360-1361) | 4.5 | app |  |
| C031 | the remote-load lane — declares left:176px BEFORE the anchored left, in the same CONTAINED_CSS rule | one CONTAINED_CSS .peekover-remote-load rule; fixed left:176px precedes left:calc(anchor(--peekover-diff right…)+24px) | retired | remote-load sits beside the Compare pill in the pane (anchor --peekover-diff); no Compare pill in the shadow root after 4.5 | 4.5 | app |  |

### `src/render/editorEnhancer.test.ts`

re-spelled 12 · replaced 2 · retired 4 · unchanged 4

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C032 | D-3 › FIRING CONTROL: the same scan finds the type where it really is | folderSource.ts contains FileSystemFileHandle | unchanged |  |  | unit-builder |  |
| C033 | D-3 › a pane created with no options still edits; its session has no save | createReaderPane() with no options; Edit pill → edit; session.save undefined | re-spelled | a pane without a save still edits; session save undefined | 4.3 | app | Edit entering/leaving |
| C034 | D-3 › enhanceEditor is LISTED at both app-page call sites, directly after enhanceMath | source order enhanceMath < enhanceEditor(…, { save < enhanceTables in readerPane.ts and appShell.ts | unchanged |  |  | unit-builder |  |
| C035 | D-3 › neither readerPane.ts nor any src/render/editor*.ts names FileSystemFileHandle | source scan finds no FileSystemFileHandle in readerPane/editor modules | unchanged |  |  | unit-builder |  |
| C036 | D-3 › readerPane threads an injected save into the session, by identity | createReaderPane; Edit pill click → save binder called once, session.save is bound fn, not invoked | re-spelled | injected save bound once at edit entry, by identity; nothing saved on entry | 4.3 | app | Edit entering/leaving |
| C037 | D-3 › ★ a session the shell ENDED still answers 'unavailable' after Revoke | shell, Edit pill → Revoke chip → save returns unavailable, nothing downloaded | re-spelled | an ended session's save answers unavailable and downloads nothing | 4.3 | app | Edit entering/leaving (save) |
| C038 | D-3 › ★ appShell injects a save that, for a file with no handle, DOWNLOADS (+ CRLF ruling A, write access NOT granted, NO file fallback name — 4 tests) | shell, Edit pill → save downloads text/markdown under file/fallback name; CRLF kept; no writable | re-spelled | shell save routes: no handle / denied → download under file name, line endings per ruling A | 4.3 | app | Edit entering/leaving (save) |
| C039 | R2 › ★ the module loader runs once across two edit sessions on one host | edit→reading→edit via pill: loader called once; another host calls again | re-spelled | engine load memoised per outer host across sessions | 4.3 | app | Edit entering/leaving |
| C040 | degrade › a failure is retryable | first load rejects, next activation loads and enters edit | re-spelled | 'Editor unavailable' is retryable from the same control | 4.3 | app | Edit entering/leaving |
| C041 | degrade › ★ leaves the prior mode, builds no editor, and the control says so in text | rejected loader: mode reading, control 'Editor unavailable' + retry aria, no shell, children unchanged | re-spelled | failed engine load leaves prior mode, nothing built, says 'Editor unavailable' in text | 4.3 | app | Edit entering/leaving |
| C042 | edit session › the dirty attribute is written on the OUTER host and nowhere else | enter via pill, edit; attr on host only; literal data-edit-dirty | re-spelled | dirty attribute lives on the outer host only | 4.3 | app | unsaved-changes guard (dirty state) |
| C043 | edit session › ★ %s: dirty attribute absent on entry, present after edit, absent after undo (it.each 3) | enter via pill; originalText raw, doc normalised; data-edit-dirty toggles with buffer | re-spelled | seed from raw source; dirty attribute tracks buffer vs original | 4.3 | app | unsaved-changes guard (dirty state) |
| C044 | edit session › ★ an outer re-mount during an edit ends the session | re-mount clears dirty, session, mode→reading, control 'Edit'; next session seeds new doc | re-spelled | document switch during edit ends the session with no stale dirty state | 4.3 | app | Edit entering/leaving |
| C045 | normaliseLineBreaks (it.each 6) | pure line-break normalisation cases | unchanged |  |  | unit-builder |  |
| C046 | the edit control › R3 — the exit returns to the mode edit was entered from | mode pill → raw; Edit pill twice → back in raw, shell gone | retired | 'return to entered-from mode' on one toggle; a Read/Edit/Raw segment names the target mode (see product Q) | 4.3 | app | Edit entering/leaving |
| C047 | the edit control › R3 — the pill-hide rule lives in EDITOR_CSS, READER_CSS gains no rule | EDITOR_CSS hides mode toggle in edit; EDIT_CONTROL_CSS rule shape, no :host, no comment | retired | EDIT_CONTROL_CSS sheet shape; the constant is deleted (D-6) | 4.3 | unit-builder |  |
| C048 | the edit control › a second click while the engine is still loading starts no second entry | two Edit-pill clicks during pending load → one loader call, one shell | re-spelled | double activation during load starts one entry (toggleEdit via segment) | 4.3 | app | Edit entering/leaving |
| C049 | the edit control › installs nothing on a failed render or on a host with no shadow root | no control on bare host or host without data-mode | re-spelled | Edit is not offered on a failed (raw-fallback) render or an unmounted host | 4.3 | app | Edit entering/leaving |
| C050 | the edit control › is idempotent: no second control and no second stylesheet | second enhanceEditor call adds no control or sheet | retired | idempotent install of the shadow-root Edit pill; pill removed | 4.3 | app |  |
| C051 | the edit control › is one real <button> placed directly after the mode pill, with its own stylesheet | enhanceEditor adds one button after .peekover-mode-toggle plus one EDIT_CONTROL_CSS sheet | retired | the shadow-root Edit pill and EDIT_CONTROL_CSS are removed (D-6) | 4.3 | app |  |
| C052 | the edit control › ★ R3 — label and accessible name say Edit at rest, and the exit while editing | 'Edit'/'Edit this document' → 'Stop editing'/aria; exit tears down shell, session, dirty attr | replaced | edit state announced in text/ARIA; exit teardown — owned by the toolbar segment test (labels 'Stop editing' retire) | 4.3 | app | Edit entering/leaving |
| C053 | the edit control › ★ re-installs after an outer mount() | re-mount drops the pill; enhanceEditor re-adds a new one after the mode pill | replaced | Edit stays available across a re-render — toolbar segment sits outside the shadow root (toolbar.browser.test.ts, 4.3) | 4.3 | app | Edit entering/leaving |

### `src/render/mount.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C054 | (all 12 tests) | Direct mount: shadow render, sanitize, idempotent, remote-media block/opt-in, `chrome` option on/off | unchanged |  |  | tab |  |

### `src/render/readerMode.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C055 | (all 17 tests) | Raw/Reading toggle, backslash shortcut scoping, enterEditMode/exitEditMode ordering on a peekover-root mount() | unchanged |  |  | tab |  |

### `src/theme/codeThemeControl.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C056 | (all 8 tests incl. it.each) | contrastRatio; AA pins per theme; listbox shape/aria; persist-then-repaint via buildCodeThemeControl | unchanged |  |  | unit-builder | code theme switching |

### `src/theme/reader.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C057 | (all 17 tests) | READER_CSS tokens, table-toolbar CSS pins, OS/setting theme resolution and host broadcast | unchanged |  |  | unit-builder |  |

### `src/watch/watchControl.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C058 | (all 8 tests) | buildDisclosure/buildWatchChrome gate (watchAvailable && diff context), control-note-disclosure order, reactive hidden, static copy | unchanged |  |  | unit-builder | capture disclosure shown |

### `tests/browser/agentBadge.browser.test.ts`

re-spelled 5 · retired 5 · unchanged 10

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C059 | 1.5 · (a) the full-page offset coincidence at %s — both tests (gate holds; red-first collision) | No diff affordance on the content script; with a context fed in, badge and affordance collide | unchanged |  |  | tab |  |
| C060 | 1.5 · (b) the contained pane's top:50 slot at %s — badge vs diff picker/status (MEASURED) | Records app-page badge rect against un-hidden diff picker/status slots; no outcome assertion | retired | Badge-vs-diff-picker lane collision inside the app reader pane; both leave the shadow root | 4.5 | app |  |
| C061 | 1.5 · row 10 — the badge is OUT OF FLOW at %s [app page arm] | App-page h1 rect identical with and without the shadow-root badge | re-spelled | The badge appearing (now in the toolbar) does not move the reading column's first block (toolbar wrap risk) | 4.5 | app |  |
| C062 | 1.5 · row 10 — the badge is OUT OF FLOW at %s [content script arm] | h1 rect identical with and without the badge | unchanged |  |  | tab |  |
| C063 | 1.5 · rows 5 + 8 — the clearance reading at %s [app page, rail open + default] | App-page badge clears text and band pills (pinned NONE); requires shadow-root mode toggle present | retired | Floating badge clearance vs text and pills on the app page; no badge or pills in the app shadow root | 4.5 | app |  |
| C064 | 1.5 · rows 5 + 8 — the clearance reading at %s [content script, rail open + default] | Measured badge overlaps vs h1/p/band siblings; pinned OCCUPIED set (1280 cs) | unchanged |  |  | tab |  |
| C065 | 1.5 · the 414x896 reading, RECORDED [app page arm] | Records app-page shadow-root badge rect and collisions at 414 | retired | Floating badge reading in the app pane at 414; badge leaves the shadow root | 4.5 | app |  |
| C066 | 1.5 · the 414x896 reading, RECORDED [content script arm] | Records badge rect and band collisions at 414; only realRect asserted | unchanged |  |  | tab |  |
| C067 | 1.5 · the badge's own rect at %s — row 11 anchored to its lane [app page arm, 1280 + 1400] | App-page shadow-root badge rect equals its declared inset for all five names | retired | Floating-badge lane position on the app page; badge moves to the toolbar | 4.5 | app |  |
| C068 | 1.5 · the badge's own rect at %s — row 11 anchored to its lane [content script arm, 1280 + 1400] | Badge rect equals declared top/left inset for all five agent names | unchanged |  |  | tab |  |
| C069 | content-script name from the REAL url — both tests (percent-encoded path; directory URL) | Decoded basename badges; directory URL names nothing and still mounts | unchanged |  |  | tab |  |
| C070 | describe.each SURFACES — row 4 — a SIBLING of `.peekover-reader`, never inside it [app page arm] | App-page badge parentNode is the reader shadow root, outside the column | retired | Badge as a shadow-root sibling of the column: on the app page the badge lives in the light-DOM toolbar | 4.5 | app |  |
| C071 | describe.each SURFACES — row 4 — a SIBLING of `.peekover-reader`, never inside it [content script arm] | Badge parentNode is the shadow root; column holds no badge | unchanged |  |  | tab |  |
| C072 | describe.each SURFACES — rows 1, 2, 3, 15 [app page arm] | Same four, reading `.peekover-agent-badge` (and theme-pill non-vacuity) in the app reader shadow root | re-spelled | App page badges a recognized name exactly once, not a plain one, gated on the name, text-only — read from the toolbar badge | 4.5 | app |  |
| C073 | describe.each SURFACES — rows 1, 2, 3, 15 [content script arm] | Badge built from production registration; none for plain name; gate is the name; text-only state | unchanged |  |  | tab |  |
| C074 | harness sanity — APP PAGE: the click chain puts a reader on screen, with chrome beside it | App click chain mounts h1 and the shadow-root `.peekover-theme-toggle` | re-spelled | The app click chain mounts a reader with chrome (non-vacuity witness must be a toolbar control or a document-bound piece) | 4.5 | app |  |
| C075 | harness sanity — CONTENT SCRIPT: `runReader` puts a reader on screen, with chrome beside it | runReader mounts h1 and the shadow-root theme pill | unchanged |  |  | tab |  |
| C076 | row 14 — APP PAGE, document switch: the previous document's name is never stranded on the new one | Shadow-root badge follows CLAUDE.md → none on intro.md → AGENTS.md; no stale name | re-spelled | Toolbar badge re-derives on document switch, never showing the previous document's name | 4.5 | app |  |
| C077 | row 14 — APP PAGE, watch re-render: the badge survives the render `renderWithDiagrams` causes | Shadow-root watch pill click; after re-render old badge detached, one new badge with same name | re-spelled | App badge still correct after a watch-driven re-render; watch started from the toolbar (the 'old node detached' clause may not transfer) | 4.5 | app | watch toggling |
| C078 | row 14 — CONTENT SCRIPT, watch re-render: the badge survives the render an agent's edit causes | Watch pill click, disk edit re-renders; new badge node with same name, exactly one | unchanged |  |  | tab | watch toggling |

### `tests/browser/agentBadgeNetwork.browser.test.ts`

re-spelled 1 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C079 | describe.each(SURFACES) register → recognize → render → re-render: ZERO requests — app page arm | Badge read from shadow root (L328) on select and after file switch; new node; zero requests | re-spelled | App-page agent-badge lifecycle is zero-network; badge read from toolbar (the 'rebuilt !== badge' clause assumes re-creation) | 4.5 | app |  |
| C080 | describe.each(SURFACES) register → recognize → render → re-render: ZERO requests — content script arm | runReader badge lifecycle, then bare mount re-render: zero requests against armed probe | unchanged |  |  | tab |  |
| C081 | the seam in isolation — all five names: register → buildAgentBadge → commit fires ZERO requests | buildAgentBadge for each name committed to live DOM: zero requests | unchanged |  |  | unit-builder |  |

### `tests/browser/appHeaderNarrow.browser.test.ts`

replaced 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C082 | at %s, every header control lies inside the viewport (it.each 414x896 / 1280x900) | header export, storage, theme, code-theme toggles present; every header button/brand/tag rect inside viewport | replaced | every app control reachable and unclipped at narrow and wide — toolbar.browser.test.ts (≤863 '⋯', two rows max); brand/tag may change at 4.1 | 4.4 | app | theme switching, code theme switching, Stored data opening, Export |
| C354 | at %s, every header control lies inside the viewport — its header-part selector (DISCOVERED at 4.1) | the selector lists the brand text and the tag, both removed at 4.1 | re-spelled | every header part, text included, lies inside the viewport — the toolbar's brand and file name replace the brand and tag | 4.1 | app |  |

### `src/app/toolbar.test.ts` and `tests/browser/toolbar.browser.test.ts` (written at 4.1 — rows DISCOVERED at 4.2)

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C355 | `toolbar.test.ts` › composes the mark, the file name and Read / Raw, in that order | the toolbar's children are exactly [brand, file, seg] | re-spelled | the toolbar composes the mock's parts in the mock's order — the badge, Watch and Compare slots join between the file name and Read / Raw | 4.2 | app |  |
| C356 | `toolbar.browser.test.ts` › sits first in the header: the mark and word, the file name, Read / Raw — and the tag is gone | the toolbar's parts on screen are [brand, file, seg] | re-spelled | the same, on screen, both engines | 4.2 | app |  |
| C357 | `toolbar.browser.test.ts` › sits first in the header … (its segment line; DISCOVERED at 4.3) | the segment's buttons read [Read, Raw] | re-spelled | the segment's views in the mock's order — Edit joins between Read and Raw (D-6) | 4.3 | app |  |
| C358 | `toolbar.test.ts` › composes the mark, the file name and Read / Raw, in that order (its segment line; DISCOVERED at 4.3) | the segment's buttons read [Read, Raw] | re-spelled | the same, in jsdom | 4.3 | app |  |
| C359 | `toolbar.test.ts` › with no document, Read and Raw are present but disabled and unpressed (DISCOVERED at 4.3) | two buttons, both disabled and unpressed | re-spelled | nothing to act on, nothing offered — Edit joins, disabled too | 4.3 | app |  |
| C360 | `toolbar.test.ts` › reflects a mode flip it did not make (ruling B) (DISCOVERED at 4.3) | two buttons' pressed / disabled after an outside flip | re-spelled | the flip is reflected — Edit joins, disabled on a host never made editable | 4.3 | app |  |
| C361 | `toolbar.test.ts` › while editing, Read and Raw are disabled and unpressed (DISCOVERED at 4.3) | Read / Raw disabled in edit; a Raw click leaves the mode at edit | retired | 4.1's interim, ended by ruling E: Read and Raw leave edit through the guard (the 4.3 toolbar tests) | 4.3 | app | Edit leaving |
| C362 | `toolbar.browser.test.ts` › sits first in the header … (its parts line; DISCOVERED at 4.4) | the toolbar's parts on screen are [brand, file, badge, watch, compare, seg] | re-spelled | the toolbar's parts in the mock's order — the Files slot leads; the row break, the app group, "⋯" and its menu follow | 4.4 | app |  |
| C363 | `toolbar.test.ts` › composes the mark, the file name and Read / Raw, in that order (DISCOVERED at 4.4) | the toolbar's children are [brand, file, badge, watch, compare, seg] | re-spelled | the same, in jsdom | 4.4 | app |  |
| C364 | `toolbar.browser.test.ts` › at %i px, %s: Export, Code theme, Stored data and Compare open fully inside the viewport (DISCOVERED at 4.4) | each panel opened by clicking its toggle | re-spelled | each panel, opened the way a user opens it (its "⋯" item at ≤ 863 px), lies inside the window with every row reachable | 4.4 | app | Export; Stored data; Code theme; Compare |
| C365 | `toolbar.test.ts` › Compare follows the host's data-diff (DISCOVERED at 4.5) | the toolbar's Compare and the shadow pill both follow data-diff | re-spelled | the toolbar's own Compare follows data-diff; the reader is mounted `pills: false` (no pill to follow) | 4.5 | app | Compare/picker opening a diff |
| C366 | `editorEnhancer.test.ts` › adds no edit control, no button and no sheet (DISCOVERED at 4.5) | enhanceEditor adds only the notice-seat sheet | re-spelled | enhanceEditor adds NOTHING to the shadow root — `CAPTURE_NOTICE_SEAT_CSS` is gone | 4.5 | app | Edit entering |
| C367 | `editorEnhancer.test.ts` › R3 — the pill-hide rule lives in EDITOR_CSS (DISCOVERED at 4.5) | EDITOR_CSS hides the pill; the seat sheet seats the notice | re-spelled | the pill-hide rule is EDITOR_CSS's (the content script still has pills); the seat sheet's half retires with it | 4.5 | app |  |
| C368 | `toolbar.browser.test.ts` › Read / Raw switch the reader, and the toolbar reflects a flip it did not make (DISCOVERED at 4.5) | the outside flip made by the shadow mode pill | re-spelled | the outside flip made by `setReaderMode` (ruling B) — no pill on the app page | 4.5 | app | Read / Raw |
| C369 | `toolbar.browser.test.ts` › Watch: the toolbar toggles the registry's watch, and reflects a stop it did not make (DISCOVERED at 4.5) | toolbar ↔ shadow watch pill, both directions | re-spelled | the outside stop made by `stopWatch` — the registry is the one watch | 4.5 | app | Watch toggling |
| C370 | `toolbar.browser.test.ts` › Compare: the picker opens under its own button; a comparison opens and closes from the toolbar (DISCOVERED at 4.5) | opened from the toolbar, closed from the pill and back | re-spelled | the toolbar's Compare round trip on its own | 4.5 | app | Compare/picker opening a diff |
| C371 | `toolbar.browser.test.ts` › says what the watch has to say … — and the reader says none (DISCOVERED at 4.5) | the notice-area note equals the reader's own note | re-spelled | the note equals `watchNote()`; the reader builds none | 4.5 | app | Watch toggling |

### `tests/browser/captureDisclosure.browser.test.ts`

replaced 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C083 | Chromium content-script file:// surface / Firefox-remote surface (2 tests) | content script: watch pill present or absent, no diff context, disclosure absent | unchanged |  |  | tab |  |
| C084 | app page PRODUCTION path renders it | select file → shadow-root disclosure visible, role=status, on-device/never-uploaded/Stored data copy; survives re-mount | replaced | capture disclosure shown on the app page with its truth clauses — snapshotNotice.browser.test.ts; shadow-root persistence retires (one-time + wipe-restores) | 4.5 | app | capture disclosure shown |

### `tests/browser/codeDegrade.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C085 | (all 2 tests) | Engine-load failure and bad persisted codeTheme leave every fence plain, page intact | unchanged |  |  | both |  |

### `tests/browser/codeThemeControl.browser.test.ts`

re-spelled 2 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C086 | opening it flips the computed display away from none | Clicking header code-theme trigger shows picker under real cascade | re-spelled | Code-theme picker opens under the real app stylesheet | 4.4 | app | Code theme switching |
| C087 | selecting a theme persists and repaints; independence from the document theme both directions (4 tests) | Standalone control persists codeTheme once, repaints a direct-mounted block, independent of data-theme | unchanged |  |  | unit-builder |  |
| C088 | the closed popover is display:none under the cascade, and does not intercept clicks elsewhere on the page | Header picker hidden under APP_CSS; header theme toggle (.peekover-theme-toggle in light DOM) still clickable | re-spelled | Closed code-theme popover is display:none under the real app stylesheet and blocks nothing; the click target becomes the merged Theme control | 4.4 | app | Code theme switching; theme switching |
| C089 | the picker renders and is interactive (2 tests, standalone buildCodeThemeControl) | Picker opens/closes, listbox with ≥14 options, keyboard-reachable buttons | unchanged |  |  | unit-builder |  |

### `tests/browser/codeToolbar.browser.test.ts`

re-spelled 1 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C090 | row 5 — the toolbar rect sits entirely ABOVE the pre it belongs to (describe.each 1280/1400) | App page: code toolbar rect above its pre, no overlap | unchanged |  |  | app |  |
| C091 | row 8 — the toolbar never intersects .peekover-toc or .peekover-mode-toggle (describe.each 1280/1400) | App page: code toolbar does not overlap the TOC rail or the shadow-root mode toggle | re-spelled | Code toolbar clears the TOC rail is kept; the mode-toggle clause is retired on the app page (no floating pill). It could move to a tab-surface arm, where the pill stays | 4.5 | app |  |
| C092 | rows 11, 14, 24, D-7, 15, 16, 17, 18, 19, 20, copy-raw, real clipboard (directHost tests) | Per-fence toolbar behaviour on a directly mounted host: copy, line numbers, wrap, highlight, a11y, clipboard | unchanged |  |  | tab |  |

### `tests/browser/contrastCensus.browser.test.ts`

re-spelled 2 · unchanged 4

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C093 | INVENTORY: no failure off the pending list, and no pending row that now passes | 16 surface×theme pairs covered; failures only on PENDING; no stale PENDING rows | unchanged |  |  | both |  |
| C094 | app shell and reader pane — light/dark (loop) | Census of every visible text in the app container ≥ AA (picks up the toolbar automatically) | unchanged |  |  | app |  |
| C095 | content-script reader, file:// fixture — light/dark (loop) | Tab reader with watching and badge pills: all text ≥ AA | unchanged |  |  | tab |  |
| C096 | content-script reader, raw-host fixture — light/dark (loop) | Tab reader text ≥ AA | unchanged |  |  | tab |  |
| C097 | the editor and the unsaved-changes dialog — light/dark (loop) | Shadow Edit pill enters edit; editor text ≥ AA; dirty exit dialog ≥ AA | re-spelled | Editor and unsaved-changes dialog meet AA (enter/leave via toolbar segment) | 4.3 | app | Edit entering/leaving; unsaved-changes guard firing |
| C098 | the three panels — light/dark (loop) | Opens Stored data, Export, code-theme picker via header toggles; each panel's text ≥ AA | re-spelled | Stored data, Export and code-theme panels meet AA (open via toolbar, behind ⋯ at 414 px) | 4.4 | app | Stored data opening; Export; code theme switching |

### `tests/browser/copyAsHtml.browser.test.ts`

re-spelled 3 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C099 | copyAsHtml — same-artifact, firing control, text/plain fallback, rejected write (4 tests, direct mount) | Captured clipboard HTML equals export file; plain fallback is rendered text; rejection rethrown | unchanged |  |  | tab |  |
| C100 | pdf: disabled at this task (3.3), re-confirmed live as of task 7.1 | Via header export toggle: pdf and html rows enabled | re-spelled | PDF and HTML rows live | 4.4 | app | Export |
| C101 | permission-free re-confirmed: BOTH built manifests still read `permissions: []` after the copy has run | After a copy through the panel, built manifests have no permissions | re-spelled | Copy needs no manifest permission (only the open step moves) | 4.4 | app | Export (Copy as HTML) |
| C102 | ★ clicking "Copy as HTML" writes to the REAL clipboard, permission-free (D-4, re-confirmed) | Opens panel via header export toggle; userEvent click on row writes clipboard; row shows Copied | re-spelled | Copy as HTML row writes the real clipboard (userEvent.click needs a visible panel at 414 px) | 4.4 | app | Export (Copy as HTML) |

### `tests/browser/copyAsPlainText.browser.test.ts`

re-spelled 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C103 | copyAsPlainText — all 4 direct-call tests | Raw source not rendered text, byte-identical hostile fixture, rejected read/write never a false success | unchanged |  |  | unit-builder | Export |
| C104 | export panel — both tests (real clipboard raw source + Copied; pdf/html/copy-html live) | Header export toggle opens panel; copy-plain-text row writes raw source to real clipboard | re-spelled | Export panel opens from the toolbar; only `mountWithFile()` (line 202) moves. 414 viewport + userEvent.click: see 863 px note | 4.4 | app | Export |

### `tests/browser/copyAsRichText.browser.test.ts`

re-spelled 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C105 | copyAsRichText — all 5 direct-call tests | Fragment without style/doctype, theme-invariant, semantic tags, rendered-text fallback, rejection rethrown | unchanged |  |  | unit-builder | Export |
| C106 | export panel — all 3 tests (real clipboard write + Copied; all 5 rows live; manifests permissions []) | Header `.peekover-app__export-toggle` opens panel; copy-rich-text row writes real clipboard | re-spelled | Export panel opens from the toolbar and its rows work; only `mountWithFile()` (line 247-249) moves. 414 default viewport: see note on the 863 px collapse | 4.4 | app | Export |

### `tests/browser/diagramActions.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C107 | (all 27 tests) | per-diagram copy/download controls: products, live-figure source, theme swap/re-render, a11y, geometry vs paragraphs/net/remote-load, CSS pin, real clipboard, manifests | unchanged |  |  | app |  |

### `tests/browser/diagramCache.browser.test.ts`

re-spelled 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C108 | serves the diagram FROM CACHE when the prose changes and its SOURCE does not | App-page watch (shadow pill L609, aria-pressed) re-render serves an unchanged diagram from cache | re-spelled | Watch re-render serves an unchanged diagram from cache; watch started via toolbar control, aria-pressed read there | 4.5 | app | Watch toggling |
| C109 | the diagram cache serves — 7 tests on enhancedHost (direct mount + enhanceDiagrams) | Cache hit/miss on source, theme, engine version; sanitizer-reject not cached; meta-first delete; oversize | unchanged |  |  | tab |  |

### `tests/browser/diagramDegrade.browser.test.ts`

re-spelled 5 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C110 | (3 tests: all N fences degrade identically, non-vacuous control renders, pane path agrees) | engine-load failure leaves readable fences; success arm renders; createReaderPane path renders | unchanged |  |  | app |  |
| C111 | arm 2 — the panel says it even when its OWN read succeeds | dead cache connection reported in the Stored data panel via header toggle | re-spelled | the panel reports the cache's dead connection — open from the toolbar | 4.4 | app | Stored data opening |
| C112 | the reader is still INTERACTIVE afterwards — the shipped control, really clicked | after failed load, shadow .peekover-mode-toggle (mount contained) focuses and flips reading/raw; raw holds diagram sources | re-spelled | reader stays interactive after engine failure — drive Raw via the toolbar (harness stays green; pills default true) | 4.5 | app | Read/Raw switching |
| C113 | ★ arm 1 — the schema will not OPEN: renders COLD, and the panel SAYS caching is off | diagram renders; Stored data panel opened via header .peekover-app__storage-toggle says caching is off | re-spelled | storage failure never costs the render; Stored data says so — open Stored data from the toolbar ('⋯' at 414) | 4.4 | app | Stored data opening |
| C114 | ★ arm 3 — a WRITE rejects in an OPEN store: renders, row not kept, NOTHING is said | write rejection: diagram renders, no row persisted, panel (header toggle) says nothing about caching | re-spelled | silent on a write rejection in an open store — open Stored data from the toolbar | 4.4 | app | Stored data opening |
| C115 | ★ arm 4 — NON-VACUOUS CONTROL: a WORKING store caches, hits, and says nothing | working store caches and hits; panel (header toggle) says nothing | re-spelled | working cache is silent in the panel — open Stored data from the toolbar | 4.4 | app | Stored data opening |

### `tests/browser/diagramLightbox.browser.test.ts`

re-spelled 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C116 | all tests except 'rows 8 + 9 — clears all of it at a WIDE viewport' (16 tests: row 21 trap/restore x7, Escape scope, live-artifact x3, rows 10+12 x3, row 4b, row 19, row 16 x4) | Lightbox focus trap/restore, modal-scoped Escape, clones live SVG, out of flow, sibling of column, reduced motion, trigger button | unchanged |  |  | both |  |
| C117 | rows 8 + 9 — the open lightbox panel clears the TOC rail, the mode toggle and the chrome: clears all of it at a WIDE viewport | Contained mount (no shell): lightbox panel rect clears TOC, mode toggle, theme pill, net indicator, remote-load | re-spelled | Open lightbox clears the document-bound chrome (TOC, network indicator, remote-load); pill rows need pills:false or a full-page mount | 4.5 | app |  |

### `tests/browser/diagramRender.browser.test.ts`

re-spelled 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C118 | (18 tests: D-15 structure, hidden-pre, row 5 flow, two-surface comparison, D-12 parity x2, async body x3, measuring container x3, §3.8 failures x3) | mermaid figure structure/render/degrade inside .peekover-reader via createReaderPane, bare mount or hand-called enhancer | unchanged |  |  | both |  |
| C119 | a watch re-render RE-ENHANCES: renders the NEW diagram after the file changes on disk | mountAppShell, clicks shadow-root .peekover-watch, disk change -> new rendered figure, old disconnected | re-spelled | a watched app-page re-render re-enhances diagrams; start the watch from the toolbar's Watch | 4.5 | app | watch toggling |

### `tests/browser/diffChrome.browser.test.ts`

re-spelled 21 · replaced 1 · retired 6 · unchanged 3

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C120 | 2.5 › ★ A SNAPSHOT diff is UNCHANGED — no caption | snapshot diff runs; status hidden, empty, display:none | re-spelled | snapshot diffs carry no caption | 4.5 | app | Compare/picker opening a diff |
| C121 | 2.5 › ★ AN UNREADABLE other file SAYS SO | rejecting sibling read: status names file, no data-diff, column visible, label 'Compare' | re-spelled | unreadable file: revert-and-say, never enter | 4.5 | app | Compare/picker opening a diff |
| C122 | 2.5 › ★ LEAVING a file-vs-file diff restores the document EXACTLY as a snapshot one | two round trips leave identical state: same column/h1 nodes, no diff, status hidden, label 'Compare' | re-spelled | exit is an attribute flip over the untouched column, identical for both kinds; caption cleared | 4.5 | app | Compare/picker opening a diff |
| C123 | 2.5 › ★ NO file comparison on the CONTENT-SCRIPT reader — app page as control | cs: no registry, pill, picker, rows; app page: file row exists, diff enters, caption names file | re-spelled | content script has no file comparison (unchanged half); the app-page control half moves to the toolbar picker | 4.5 | both | Compare/picker opening a diff |
| C124 | 2.5 › ★ SWITCHING DOCUMENTS does not carry a comparison across | file switch during diff: new doc renders, no data-diff, Compare offered, status hidden | re-spelled | a document switch drops the open comparison; the Compare control comes back offering | 4.5 | app | Compare/picker opening a diff |
| C125 | 2.5 › ★ THE CAPTION NAMES BOTH SIDES | status caption names doc.md and sibling-one.md with direction; single status region | re-spelled | file-diff caption names both sides and direction in text, in the one status region | 4.5 | app | Compare/picker opening a diff |
| C126 | 2.5 › ★ picks another FILE and enters the diff | file row → data-diff active; removed blocks are the other file's, added are this doc's | re-spelled | file-vs-file diff direction: picked file is before, document is after | 4.5 | app | Compare/picker opening a diff |
| C127 | D-14 › APP PAGE: the SAME document grows the affordance | app shell: diff context registered; shadow-root Compare pill text 'Compare' and aria-label | re-spelled | the app page offers Compare (label + aria-label) once a diff context is registered | 4.5 | app | Compare/picker opening a diff |
| C128 | D-14 › CONTENT SCRIPT: neither an affordance NOR an explanation | installContentWatch + mount on peekover-root: no diff pill/picker/status, no compare copy; theme pill present | unchanged |  |  | tab |  |
| C129 | D-14 › RED-FIRST: the gate is the REGISTRY | hand-registered context makes a direct mount() grow the pill; reset removes it | unchanged |  |  | tab |  |
| C130 | half-empty (describe.each 1280/1400) › SNAPSHOTS but no other markdown / FILES but no snapshots | status names the empty half; expectLaneClears hit-tests every row, status clears picker cap; no fake rows | re-spelled | half-empty states: list stays clickable (hit-test) while status speaks the other kind, at both widths | 4.5 | app | Compare/picker opening a diff |
| C131 | half-empty (describe.each) › the OPEN picker itself is still where 6.2 put it | open picker computed top === '50px' | retired | the picker's CONTAINED_CSS placement (top 50px in the reader pane); toolbar picker is placed anew | 4.5 | app |  |
| C132 | half-empty (describe.each) › ★ BOTH-EMPTY is UNCHANGED: status keeps its ORIGINAL slot | picker closes, 'No snapshots yet', status computed top === '50px' (CONTAINED_CSS slot) | re-spelled | both-empty closes the picker and speaks 'No snapshots yet'; the 50px CONTAINED_CSS slot pin RETIRES with the pill overrides | 4.5 | app | Compare/picker opening a diff |
| C133 | half-empty › the status line KEEPS its out-of-a11y-tree property | status role=status, hidden and display:none while empty, text once picker opens | re-spelled | diff status hidden/unrendered while empty, speaks when picker opens | 4.5 | app |  |
| C134 | never blank › DANGLING META | picked snapshot text gone: status 'Comparison unavailable', no data-diff, pill still 'Compare' | re-spelled | dangling snapshot answers 'Comparison unavailable', never enters | 4.5 | app | Compare/picker opening a diff |
| C135 | never blank › EMPTY STATE | pill click with no snapshots: status 'No snapshots yet', picker hidden, reader untouched | re-spelled | empty state spoken in the status beside the untouched reader | 4.5 | app | Compare/picker opening a diff |
| C136 | never blank › RENDER FAILURE | forced parse failure: status carries reason, no data-diff, column visible | re-spelled | enterDiff {ok:false} surfaced in the status; document stays | 4.5 | app | Compare/picker opening a diff |
| C137 | never blank › the status line is a polite live region | diff status role=status, hidden while empty, text after pill click | re-spelled | diff status is a polite live region, hidden while empty | 4.5 | app |  |
| C138 | placement › --reader-measure is the SAME length max-width resolves to at %s (it.each) | computed --reader-measure equals .peekover-reader max-width on the app pane | unchanged |  |  | app |  |
| C139 | placement › clears the aside stack, the mode toggle and the TOC rail at %s (it.each 1280/1400) | Compare pill rect overlaps no mode/theme/watch pill, note, disclosure, TOC handle/list | retired | floating Compare pill's position among the app-page pills; no pills remain to clear | 4.5 | app |  |
| C140 | placement › clears the reading column's first content box at %s (it.each) | Compare and 'Close comparison' pill rects do not overlap the reader h1 | replaced | comparison control never covers document text — owned by 4.5's chrome-vs-text-line-box hit-test (toolbar/snapshotNotice browser test) | 4.5 | app | Compare/picker opening a diff |
| C141 | placement › clears the remote-load opt-in that shares the top band at %s (it.each) | Compare pill, picker and exit pill do not overlap .peekover-remote-load | retired | the shared top-band lane between Compare pill and remote-load opt-in; pill leaves the shadow root | 4.5 | app |  |
| C142 | placement › the OPEN picker clears that chrome too | open picker rect overlaps no mode/theme/watch pill or TOC handle/list at 1400 | retired | floating picker's position among app-page pills; the open toolbar Compare picker is covered by **C364** (inside the window, every row reachable) — not by 4.5's no-overlap sweep, which covers the notice area only (corrected at 5.1, 2026-11-04) | 4.5 | app |  |
| C143 | placement › the opt-in's lane starts 24px after the pill's LAID-OUT edge (it.each) | remote-load left is 24px past the (min-width-widened) exit pill's right edge | retired | remote-load anchored to the Compare pill's edge (CONTAINED_CSS anchor rule); no pill to anchor to | 4.5 | app |  |
| C144 | round trip › picks a snapshot and enters the diff | pill→picker (inline listbox, no dialog)→option: data-diff active, column hidden, real hunks, picker/status hidden | re-spelled | picker → real computeDiff/enterDiff round trip; inline listbox, no modal; success silent | 4.5 | app | Compare/picker opening a diff |
| C145 | round trip › the pill becomes EXIT, and exiting restores the document | pill reads 'Close comparison', data-diff-open; click restores column, removes diff, label 'Compare' | re-spelled | the Compare control becomes the exit and restores the untouched document | 4.5 | app | Compare/picker opening a diff |
| C146 | the affordance is a SIBLING › pill, picker and status all sit beside .peekover-reader | pill/picker/status parentNode is the shadow root, not inside the reading column (app page) | retired | diff chrome is a shadow-root sibling of the column; with the toolbar in light DOM the relation ceases on the app page | 4.5 | app |  |
| C147 | two kinds › BOTH kinds → ONE listbox, TWO labelled groups | one listbox, two labelled groups, row kinds/filePaths, file row text+aria, no dialog/menu, one Compare, label widened | re-spelled | one listbox with snapshot/file groups and row discriminants; exactly one Compare control (now in the toolbar) | 4.5 | app | Compare/picker opening a diff |
| C148 | two kinds › FILES ONLY is single-kind too | files-only picker: no groups, two option children, document untouched | re-spelled | files-only picker is flat | 4.5 | app | Compare/picker opening a diff |
| C149 | two kinds › ★ ...the shape probe DISCRIMINATES | both-kinds picker shape differs and contains div[role=group] | re-spelled | shapeOf control fires on the grouped picker | 4.5 | app |  |
| C150 | two kinds › ★ ONE KIND → no groups at all | snapshot-only picker shape equals SNAPSHOT_ONLY_SHAPE; fetchFiles provisioned, returns [] | re-spelled | single-kind picker is structurally 006's (no groups) | 4.5 | app | Compare/picker opening a diff |

### `tests/browser/diffRegistry.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C151 | (all 2 tests) | app gesture chain registers a wired diff context; content-script watch (tab pill click) registers none | unchanged |  |  | both |  |

### `tests/browser/editMode.browser.test.ts`

unchanged 3

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C152 | [data-mode="edit"] hides the reading column and the raw <pre> (it.each full-page/contained) | Computed display:none for column and raw in edit, visible in own modes | unchanged |  |  | both |  |
| C153 | `\` inert in edit [peekover-root shape] (it.each textarea/contenteditable) + POSITIVE CONTROL | In edit a typed backslash stays in the editor; in reading it flips to raw (full-page host) | unchanged |  |  | tab |  |
| C154 | a contained <div> host: `\` writes no data-mode in reading or in edit, and types into the editor | PIN: on the app-page host shape `\` is inert in reading and edit | unchanged |  |  | app |  |

### `tests/browser/editorDegrade.browser.test.ts`

re-spelled 6 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C155 | OBSERVED, not asserted: a second import() of the engine's specifiers fetches nothing | Records engine re-fetch counts; only Array.isArray asserted | unchanged |  |  | app |  |
| C156 | POSITIVE CONTROL: on the same fixture a loader that resolves DOES enter edit | Pill click enters edit, .cm-editor present, pill reads 'Stop editing' | re-spelled | A resolving loader enters edit and the control reflects it (segment state instead of pill text) | 4.3 | app | Edit entering |
| C157 | a failure is not remembered: activating the control again loads again, and enters edit | Second pill click retries the loader and enters edit | re-spelled | Retry after a failed load re-runs the loader and enters edit, from the segment | 4.3 | app | Edit entering |
| C158 | imports one missing URL twice and reports how many requests each attempt made | Both imports of a missing module reject; counts recorded | unchanged |  |  | app |  |
| C159 | preview fails to render — both tests ('commit' throw; throw that LEAVES mount()) | Banner in preview pane only, editor and buffer intact, recovers; entered via the pill in `edit()` | re-spelled | Preview render failure is contained in the preview pane; only the `edit()` entry route (line 405) moves | 4.3 | app | Edit entering |
| C160 | ★ a REAL failed module fetch degrades the same way | Real missing-module import rejects; same degraded state via the pill | re-spelled | A real failed chunk fetch degrades the same way, via the Edit segment | 4.3 | app | Edit entering |
| C161 | ★ a rejecting loader: prior mode kept, no editor node, the document on screen, the control says so | Pill click with rejecting loader: mode kept, no editor, doc on screen, pill reads 'Editor unavailable' + aria-label | re-spelled | A failed engine load keeps the prior mode, no blank page, and the Edit segment states 'Editor unavailable' in text | 4.3 | app | Edit entering |
| C162 | ★ from RAW: the same, and the raw view is what stays on screen | Shadow-root `.peekover-mode-toggle` to raw, then failed edit load keeps raw on screen | re-spelled | Failed load from Raw keeps the raw view; Raw entered via setReaderMode/toolbar, Edit via the segment | 4.3 | app | Edit entering |

### `tests/browser/editorEyeballProxy.browser.test.ts`

re-spelled 3 · retired 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C163 | instrument (2 tests: contrast arithmetic, backdrop compositing) | WCAG ratio and source-over compositing helpers against known values | unchanged |  |  | unit-builder |  |
| C164 | proxy 1 — contrast of CodeMirror's own surfaces (it.each light/dark) | edit via shadow Edit pill; E-2 pairs and neighbours ≥ AA, others recorded | re-spelled | CodeMirror surfaces meet AA in both themes — enter edit via toggleEdit (pane harness has no toolbar) | 4.3 | app | Edit entering |
| C165 | proxy 2 — nothing collides at the top-right (it.each NARROW/WIDE x rail open/collapsed) | Edit pill, mode pill, TOC handle disjoint and hit-testable; in edit the pill clears the split, rail hidden | retired | Edit-pill/mode-pill/handle collisions in the shadow root — no Edit pill (4.3), no mode pill (4.5); rail-in-edit kept by editorWalkPolish R29(c) | 4.3 | app |  |
| C166 | proxy 3 — GFM and R1's dialect, as drawn (it.each light/dark) | edit via Edit pill; highlight spans per dialect line; E-3 colours are tokens at AA | re-spelled | editor highlight styles are design tokens at AA — enter edit via toggleEdit | 4.3 | app | Edit entering |
| C167 | proxy 4 — Ctrl/Cmd+S with focus in the editor, OBSERVED | main.ts loaded; edit via Edit pill; records export-shortcut reactions; asserts editor still open | re-spelled | Ctrl/Cmd+S in the editor observed, editor stays open — enter edit via segment/toggleEdit | 4.3 | app | Export (shortcut); Edit entering |

### `tests/browser/editorNestedHost.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C168 | (all 13 tests) | nested preview host: source pane survives, chrome:false hazards absent, outer chrome stable, scroll box, split hit-test, mode-pill bypass | unchanged |  |  | app |  |

### `tests/browser/editorNetwork.browser.test.ts`

re-spelled 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C169 | (all 7 tests) — LOAD, PREVIEW, SAVE download, and 4 Chromium SAVE (unwatched write, conflict, declined prompt, watched) | Zero off-origin across edit entry, preview, save; `mountAndSelect` waits on and `enterEdit` clicks the shadow-root edit pill | re-spelled | Edit entry/preview/save put nothing off-origin; edit entry/exit (lines 424, 447-448, 460, 720) move to the toolbar segment | 4.3 | app | Edit entering/leaving |
| C170 | ★ WATCHED by the app page — a write, its echo, an external change and the refused save (additional dependency) | `appWatched()` clicks the shadow-root WATCH_CONTROL_CLASS pill (lines 438-440) to start the app-page watch | re-spelled | Watched-save zero-network still starts the watch from the app page's Watch control (toolbar), a second re-spelling | 4.5 | app | watch toggling |

### `tests/browser/editorPreview.browser.test.ts`

re-spelled 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C171 | (all 11 tests) — typed text/D-4, pending/coalescing, WIDE scroll, exit-while-pending x2, enhancers x3, appearance x2 | Live preview on a bare readerPane host; edit entered and left by clicking the shadow-root EDIT_CONTROL_CLASS pill | re-spelled | Each test's preview property is kept; only edit entry/exit moves (`edit()`, `enterEdit()`, `exitWhilePending()`, line 702) — e.g. via 4.3's exported `toggleEdit` | 4.3 | app | Edit entering/leaving |

### `tests/browser/editorRender.browser.test.ts`

re-spelled 5 · replaced 1 · retired 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C172 | %s: the control is hit-testable beside the pill and never under it, with either pill label (it.each NARROW/WIDE) | Edit pill left of mode pill, same top, disjoint, both hit at centre, for labels Raw and Reading | retired | Edit pill vs mode pill adjacency in the shadow root — no Edit pill (4.3), no mode pill on app page (4.5) | 4.3 | app |  |
| C173 | activating the control presents a CodeMirror view (3 tests: LF, CRLF, typed/undo) | shadow Edit pill click -> CodeMirror in source slot holding the source; CRLF clean on entry; typing dirties, undo clears | re-spelled | entering edit shows CodeMirror holding the document; dirty tracks the buffer — enter via toggleEdit/segment (pane harness has no toolbar) | 4.3 | app | Edit entering |
| C174 | entered from raw, the exit returns to raw | mode pill -> raw; Edit pill enter then exit; data-mode raw, raw view shown, no shell | retired (ruling E, 2026-11-02; was re-spelled) | leaving edit returns to the mode it was entered from — RETIRED with C046: in the segment, the one you click is where you go | 4.3 | app | Edit entering/leaving |
| C175 | ★ edit -> reading -> edit runs the module loader ONCE; a second host runs it again | enhanceEditor(host,{loader}); Edit pill clicks; loader called once per host | re-spelled | the editor engine loads once per outer host — drive via exported toggleEdit(host,{loader}) | 4.3 | app | Edit entering |
| C176 | ★ mountReader() — the content script's own mount — installs none; the app page's pane installs one | content-script reader has no edit control or Edit-labelled button; positive control: pane host has the Edit pill | re-spelled | content script never offers Edit (kept as-is); the app-page positive control moves to the toolbar segment | 4.3 | both | Edit entering |
| C177 | ★ selected by class alone it is a <button>; Enter enters, Space exits; the name says which | Edit pill is a real button, tabIndex 0; Enter enters, Space exits; labels Edit / Stop editing | replaced | the Edit control is a real keyboard-operable button with its state in its name — toolbar.browser.test.ts (segment) | 4.3 | app | Edit entering/leaving |
| C178 | ★ the pill is display:none while editing, the control is the way out, and no shell residue remains | mode pill hidden in edit and back after; Edit pill exits; shadow children identical to before; no editor residue | re-spelled | edit exit leaves no residue and the document returns — exit via segment (4.3); the mode-pill-hidden clause retires at 4.5 | 4.3 | app | Edit entering/leaving |

### `tests/browser/editorSave.browser.test.ts`

re-spelled 31

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C179 | CONTROL: leaving edit WITHOUT a save re-renders nothing — the column is the same node, the text as opened | Dirty exit via Discard: no re-render, same column node, original text | re-spelled | Exit without save does not re-render; dirty exit asks first | 4.3 | app | Edit leaving; unsaved-changes guard firing |
| C180 | CONTROL: with no switch in flight, the same gesture on A WRITES A | No pending switch: save writes A, B untouched | re-spelled | Control for the switch-window binding | 4.3 | app | Edit entering; Save |
| C181 | S5, the 4.3 control: watched, Edit, type, Save, Stop editing → the saved text, in one render | Watched baseline: saved text, one render, no hint, nothing asked | re-spelled | Control: watched save then exit shows saved text | 4.3 (Edit); watch-pill step breaks at 4.5 | app | Watch toggling; Edit entering/leaving; Save |
| C182 | a DOWNLOAD is not a save: Stop editing after one leaves the reading view as opened | After download-save then Discard exit, reading view and disk keep original text | re-spelled | A download does not change the reading view; guard asks after download | 4.3 | app | Edit leaving; unsaved-changes guard firing; Save (download) |
| C183 | once B’s render has committed, B is the bound file: Edit, type, Save writes B and not A | After B commits, save writes B not A | re-spelled | Binding follows the committed render | 4.3 | app | Edit entering; Save |
| C184 | the Save control is a <button>, keyboard-operable, and its status region is out of the tree at rest | Save is an on-screen, uncovered <button>; status role=status hidden at rest; Enter saves | re-spelled | Save button is real, uncovered, keyboard-operable; status hidden at rest | 4.3 | app | Edit entering; Save |
| C185 | the permission is asked for BEFORE the re-read, and only at the click | requestPermission precedes re-read; nothing asked before Save click | re-spelled | Permission asked at click, before the re-read | 4.3 | app | Edit entering; Save |
| C186 | ★ %s: the edit view is gone, and the captured save and Ctrl/Cmd+S write nothing (it.each: Revoke / close folder / switch folders) | After each ending, captured save returns unavailable, shortcut false, edit view gone, disk untouched | re-spelled | Revoke/close/switch folder end the edit session; nothing writes after | 4.3 | app | Edit entering/leaving; Save; Ctrl/Cmd+S |
| C187 | ★ (i) Save → the hint is ABSENT; a second Save says "Saved." and nothing more; then an EXTERNAL change raises it | App-page own watch: own write raises no hint; external write does; compare still refuses | re-spelled | A save's own write is not an external change (real app-page watch) | 4.3 (Edit); watch-pill step L918 breaks at 4.5 | app | Watch toggling; Edit entering; Save |
| C188 | ★ (i) changed and changed BACK: the hint is present, the content equals the baseline → the save proceeds, and warns | Hand-driven watch hint plus equal content: save proceeds with warning sentence | re-spelled | Ruling C: the hint warns, the compare decides (proceeds) | 4.3 | app | Edit entering; Save |
| C189 | ★ (ii) changed and NOT back: the hint is present, the content differs → the safe floor | Hint plus differing content: not saved, disk keeps external text | re-spelled | Ruling C: the compare refuses a real conflict | 4.3 | app | Edit entering; Save |
| C190 | ★ CONTROL (5.4): a conflict → the safe floor, and NO download is offered | Conflict refuses save, no download, buffer and dirty kept | re-spelled | Conflict route is the safe floor with no download | 4.3 | app | Edit entering; Save |
| C191 | ★ CONTROL (5.4): write access granted → still a disk write, and NO download | Granted access writes disk, no download, dirty cleared | re-spelled | Granted save writes, never downloads | 4.3 | app | Edit entering; Save |
| C192 | ★ D-7 SAME-LENGTH: a file rewritten out-of-band with text of identical length is NOT overwritten | Same-length out-of-band change refused: disk keeps external text, buffer and dirty kept | re-spelled | Save's content compare refuses an out-of-band change | 4.3 | app | Edit entering; Save |
| C193 | ★ DECLINED: a declined write prompt writes nothing to the file — the edit becomes a download, and stays on screen | Denied permission: disk untouched, one markdown download of buffer, dirty and baseline kept | re-spelled | Declined write access becomes a download, file untouched | 4.3 | app | Edit entering; Save (download) |
| C194 | ★ FAILURE: a writable that throws → "failed" in text, the buffer and dirty kept, the file unchanged | Throwing writable: status 'The save failed.', aborted once, disk unchanged, control usable again | re-spelled | A failed write is said, aborted, and loses nothing | 4.3 | app | Edit entering; Save |
| C195 | ★ R19, WATCHED: Save → Stop editing → the reading view shows the saved text, and the watch is still live | After save and Stop editing: one re-render shows saved text, snapshot captured, watch still live | re-spelled | Leaving edit shows saved text in one render; watch stays live | 4.3 (Edit/Stop editing); watch-pill step breaks at 4.5 | app | Watch toggling; Edit entering/leaving; Save |
| C196 | ★ RULING A applies to the download: a uniformly CRLF file downloads as CRLF; a mixed one as LF, and the status says so | Download bytes keep CRLF; mixed becomes LF with qualifier | re-spelled | Line-ending ruling applies to downloads | 4.3 | app | Edit entering; Save (download) |
| C197 | ★ RULING A: a mixed-ending file is saved as LF and the status says so; the next save is no conflict | Mixed endings normalised to LF with qualifier; second save plain 'Saved.' | re-spelled | Mixed endings normalised to LF, said in status | 4.3 | app | Edit entering; Save |
| C198 | ★ RULING A: a uniformly CRLF file is saved as CRLF, with no qualifier | CRLF file saved as CRLF twice, status 'Saved.' | re-spelled | CRLF line endings preserved on save | 4.3 | app | Edit entering; Save |
| C199 | ★ S1: Save, then an external change is held → leaving edit shows the EXTERNAL text, not the save | Watched, held external change: exit shows external text in one render; no question asked | re-spelled | Leaving edit shows the newest text (external beats own save) | 4.3 (Edit); watch-pill step L1176 breaks at 4.5 | app | Watch toggling; Edit entering/leaving; Save |
| C200 | ★ S2: as S1, then a refused second Save and "Discard edits" → still the EXTERNAL text | Refused second save, guard asks, discard: view is external text, one render | re-spelled | Newest text after refused save and discard | 4.3 (Edit); watch-pill step breaks at 4.5 | app | Watch toggling; Edit leaving; unsaved-changes guard firing; Save |
| C201 | ★ S3, the REVERSED observer order: Edit first, THEN Watch on, type, Save → the saved text, in one render | Edit then Watch: own write no hint; exit shows saved text in one render; watch live | re-spelled | Observer order does not matter: saved text, one render | 4.3 (Edit); watch-pill step breaks at 4.5 | app | Watch toggling; Edit entering/leaving; Save |
| C202 | ★ S4: Edit, type, Save, THEN Watch on → the saved text, in one render | Watch started after save sees no change; exit shows saved text, one render | re-spelled | Watch started after save: saved text, one render | 4.3 (Edit); watch-pill step breaks at 4.5 | app | Watch toggling; Edit entering/leaving; Save |
| C203 | ★ S6, UNWATCHED: a second save still in flight when edit is left (R25) → the view shows the first save, then the second when it lands | In-flight save completes after exit; view shows first then second save; two renders | re-spelled | An in-flight save completes after exit and the view follows (R25) | 4.3 | app | Edit leaving; unsaved-changes guard firing; Save |
| C204 | ★ SAVE: the file read back is the buffer; a SECOND save in the same session also writes | Two saves in one edit session both write the buffer to disk; dirty cleared; baseline advances | re-spelled | Save writes the buffer to the bound file, repeatedly (enter Edit via toolbar segment) | 4.3 | app | Edit entering; Save |
| C205 | ★ Save → Stop editing → the reading view shows the saved text; editing again starts from it | Unwatched: one re-render shows saved text; control text back to 'Edit'; new session seeded from saved | re-spelled | Leaving edit shows saved text; re-entry seeds from it; control returns to rest state (L1031 'Edit' becomes the segment's selected state) | 4.3 | app | Edit entering/leaving; Save |
| C206 | ★ Save, then Ctrl/Cmd+S: each is one download — a markdown type, the file’s own name, the exact buffer — and the edit stays unsaved | No-handle file: Save and saveEdit() each produce one markdown download; dirty and baseline kept | re-spelled | No-handle Save and Ctrl/Cmd+S are downloads (both engines) | 4.3 | app | Edit entering; Save (download); Ctrl/Cmd+S |
| C207 | ★ a download that THROWS is "failed", said in text — the buffer and dirty kept | Throwing createObjectURL: status 'The save failed.', no click, buffer and dirty kept | re-spelled | A failed download is said and loses nothing | 4.3 | app | Edit entering; Save (download) |
| C208 | ★ a save bound to A at edit entry writes A — never B — after B has been selected (clean buffer: the guard is silent) | Save captured at A's edit entry writes A after B is selected; B untouched; no guard on clean | re-spelled | Save binds to the file at edit entry; clean exit asks nothing | 4.3 | app | Edit entering; unsaved-changes guard (silent on clean) |
| C209 | ★ in the switch window — B selected, its read still pending, A on screen — Edit, type, Save: NEITHER file changes; the edit is a download under A’s name | Edit during pending switch binds nothing: neither file written, one download named A | re-spelled | Edit entry binds the rendered file; mismatch downloads | 4.3 | app | Edit entering; Save |

### `tests/browser/editorUnsaved.browser.test.ts`

re-spelled 12

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C210 | R6 asymmetry (Chromium): ★ (i) STAY and ★ (ii) DISCARD (2 tests) | watch started by shadow .peekover-watch, dirty edit + external write; Keep holds hint/no flush; Discard flushes disk text | re-spelled | dirty-exit asymmetry over a held watch change — Edit via segment (4.3), Watch via toolbar (4.5) | 4.3, 4.5 | app | unsaved-changes guard firing; watch toggling |
| C211 | a second trigger while the question is up is ignored — one dialog | Edit-pill exit opens dialog; drop and openFolder meanwhile ignored; one dialog; Keep keeps all | re-spelled | one question at a time; further exits ignored while it is up — first trigger via segment | 4.3 | app | unsaved-changes guard firing |
| C212 | beforeunload (3 tests: absent/present/kept/released; clean exit leaves nothing; shell-ended session releases) | beforeunload claimed only while dirty; one listener; released on discard/clean exit; entry/exit via Edit pill | re-spelled | tab close asks only while an unsaved edit exists, no listener leak — enter/exit via segment | 4.3 | app | unsaved-changes guard firing |
| C213 | describe.each(PATHS) CLEAN (10 exit paths) | clean edit session: no dialog ever appears; the exit happens and data-mode leaves edit | re-spelled | a clean edit is left without a dialog — via the segment | 4.3 | app | Edit entering/leaving |
| C214 | describe.each(PATHS) ★ DISCARD (10 exit paths) | Discard edits starts the action inside the click; session, dirty attr and editor shell gone | re-spelled | Discard runs the exit's action in the same gesture and ends the session — segment replaces the pill | 4.3 | app | unsaved-changes guard firing; Edit leaving |
| C215 | describe.each(PATHS) ★ STAY (10 exit paths) | dirty edit (entered via shadow Edit pill); each exit raises dialog naming file; Keep editing leaves session, buffer, host intact | re-spelled | a dirty edit is never left without asking; Keep editing changes nothing — enter/exit via the Read/Edit/Raw segment | 4.3 | app | unsaved-changes guard firing; Edit entering/leaving |
| C216 | typed and then put back: the buffer equals the file again, and nothing is asked | type then delete; Edit pill exit raises no dialog and leaves edit | re-spelled | dirty means buffer differs from the file, not 'an edit happened' — exit via segment | 4.3 | app | unsaved-changes guard firing |
| C217 | ★ AFTER A DOWNLOAD the edit is still unsaved in the folder — every exit still asks | Save-as-download leaves dirty; Edit-pill exit and tree selection both still raise the guard | re-spelled | a download does not count as saved; exits still ask — Edit-pill trigger becomes the segment | 4.3 | app | unsaved-changes guard firing |
| C218 | ★ Escape is Keep editing: the dialog closes, nothing happened, and focus is back where it was | Escape closes; still edit; buffer intact; focus returns to the Edit pill; page live again | re-spelled | Escape = Keep editing, focus returns to the control used — now the segment button | 4.3 | app | unsaved-changes guard firing |
| C219 | ★ Keep editing has focus as it opens, and Tab / Shift+Tab never leave the dialog | default focus on Keep editing; 4 Tabs and 4 Shift+Tabs stay inside the dialog | re-spelled | focus trap and safe default — raised from the segment | 4.3 | app | unsaved-changes guard firing |
| C220 | ★ is a dialog, labelled and described in text, naming the file, with two real buttons | dialog role/labelledby/describedby names file; Keep editing and Discard edits are real buttons | re-spelled | the guard dialog's a11y shape — raised from the segment rather than the pill | 4.3 | app | unsaved-changes guard firing |
| C221 | ★ the page behind is inert: nothing there takes focus, and nothing there is under the pointer | tree item, Revoke, header Export toggle, shadow Edit pill, editor: unfocusable and not hit-testable behind dialog | re-spelled | everything behind the dialog is inert — list becomes toolbar Export (or '⋯' at 414) and the segment | 4.3, 4.4 | app | unsaved-changes guard firing |

### `tests/browser/editorWalkPolish.browser.test.ts`

re-spelled 6 · replaced 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C222 | R28 %s: a long line wraps — the editor has no horizontal scroll (it.each NARROW/WIDE) | in edit, .cm-scroller scrollWidth ≤ clientWidth; .cm-content pre-wrap | re-spelled | long lines wrap in the editor — enter via segment | 4.3 | app | Edit entering |
| C223 | R29(a) the Ctrl-F search panel is legible and drawn from tokens (it.each light/dark) | edit via shadow Edit pill; CodeMirror search panel text pairs ≥4.5:1, fills/borders are tokens | re-spelled | edit's search panel legible and token-drawn in both themes — enter edit via segment | 4.3 | app | Edit entering |
| C224 | R29(b) %s: both panes' scrollbars take their colours from tokens (it.each light/dark) | source scroller and preview pane scrollbar-color thumb equals --faint | re-spelled | editor scrollbars token-coloured — enter via segment | 4.3 | app | Edit entering |
| C225 | R29(b) %s: the split's bottom edge is within the pane padding of the viewport (it.each NARROW/WIDE) | edit split bottom gap ≤ 24+130+8=162 px and ≥0; both panes >150 px tall | re-spelled | the split fills the pane to its foot — enter via segment (4.3); 162 tolerance re-spelled to the new band (4.6) | 4.3, 4.6 | app | Edit entering |
| C226 | R29(c) stacked (414): the rail is hidden in edit and the panes are full width | at 414, after entering edit via pill, TOC rail not visible | re-spelled | rail hidden in stacked edit — enter via segment (folder overlay at 4.8 does not change the claim) | 4.3 | app | Edit entering |
| C227 | R29(c) viewport %d: in edit the rail is %s (it.each 1300/1400/1500) | rail shown in reading; hidden in edit ≤1400; panes ≥360 px; Edit pill exit restores rail | re-spelled | edit hides the rail at/below 1400 and panes keep width — enter/exit via segment | 4.3 | app | Edit entering/leaving |
| C228 | R29(d) WIDE: reading, then edit — the capture notice never sits on top of the document or the editor | shadow .peekover-watch-disclosure clears text line boxes, watch/theme pills, and the edit split at 1400 | replaced | capture notice never over text or editor — snapshotNotice.browser.test.ts (notice below toolbar; 1440/1280/1080/414 hit-test); enterEdit breaks first at 4.3 | 4.5 | app | capture disclosure shown |

### `tests/browser/editorWatch.browser.test.ts`

re-spelled 6

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C229 | 4.1 › says and does nothing on a clean exit when nothing arrived | pill enter/exit: same column node, no note, no snapshot; control re-render | re-spelled | clean exit with nothing held renders and captures nothing | 4.3 | app | Edit entering/leaving |
| C230 | 4.1 › ★ keeps the typed buffer | Edit pill enter, typing; external change leaves editor node, mode, buffer, on-screen text | re-spelled | typed buffer survives an external change while editing | 4.3 | app | Edit entering/leaving; watch |
| C231 | 4.1 › ★ mutates nothing in the outer root…; a clean exit shows the new text | Edit pill enter; external change → 0 outer mutations, editor intact; pill exit flushes, captures | re-spelled | external change deferred during edit; clean exit flushes, captures, re-renders | 4.3 | app | Edit entering/leaving; watch |
| C232 | 4.2 › never writes the hint when nothing arrives | pill enter/exit with no change: zero hint writes; control re-render | re-spelled | no hint written when nothing is held | 4.3 | app | Edit entering/leaving |
| C233 | 4.2 › ★ keeps the typed buffer byte-identical under the hint; stopping the watch removes it | pill enter, type; hint set; controller.stop clears hint; restart elsewhere carries none | re-spelled | hint beside an intact dirty buffer; watch stop clears it | 4.3 | app | Edit entering/leaving; watch |
| C234 | 4.2 › ★ sets the hint…; the exit removes it and shows the on-disk text | held change sets changed-in-edit attr once; pill exit removes it, flushes V2 | re-spelled | held change marked on the outer host, cleared by the exit flush | 4.3 | app | Edit entering/leaving; watch |

### `tests/browser/eraseSnapshots.browser.test.ts`

re-spelled 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C235 | clicking "Erase snapshots" clears both snapshot stores and leaves everything else intact | Header __storage-toggle opens panel; erase start/confirm empties snapshot stores; other stores survive | re-spelled | Erase snapshots via Stored data clears snapshots only (open via toolbar; no folder open → idle toolbar) | 4.4 | app | Stored data opening; erase snapshots |

### `tests/browser/exportDegrade.browser.test.ts`

re-spelled 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C236 | (all 8 tests) — copy failure x3 (loop), real copy success x3 (loop), HTML throw, HTML success no affordance, PDF no report | Per-row Copy failed / Copied, Export failed, native-signal-only HTML/PDF; panel opened via header export toggle | re-spelled | Export row failure/completion states kept; only `mountWithFile()` (line 115) moves. 414 viewport + userEvent.click (line 273): see 863 px note | 4.4 | app | Export |

### `tests/browser/exportNetwork.browser.test.ts`

re-spelled 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C237 | HTML export, Copy-as-HTML, Copy-as-plain-text, Copy-as-rich-text, PDF export: ZERO requests | Armed control fires; every export/copy/print action puts zero requests on the wire | re-spelled | Every Export action is zero-network against an armed control; only `mountWithFile()` (line 160) moves. userEvent.click at 414: see 863 px note | 4.4 | app | Export |

### `tests/browser/exportPanel.browser.test.ts`

re-spelled 10

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C238 | Q1(a) — HTML row downloads real file; no row renders disabled (2 tests) | Export as HTML downloads alpha.html; all rows enabled | re-spelled | Export as HTML works from the panel; every row live | 4.4 | app | Export |
| C239 | Q2 — a disabled toggle does not open the panel on click | Clicking disabled export toggle opens no panel | re-spelled | Disabled Export trigger opens nothing | 4.4 | app | Export |
| C240 | Q2 — is DISABLED with no document open, and ENABLED once one is selected | Header export toggle disabled without a file, enabled after select | re-spelled | Export trigger is document-scoped (disabled until a file is open) | 4.4 | app | Export |
| C241 | row 11 — focus trap: open moves focus in, close restores to toggle; Tab/Shift-Tab wrap; Escape; nothing behind reachable (5 tests) | Focus enters panel, wraps both ways, Escape closes, focus returns to toggle by identity | re-spelled | Export panel traps focus and restores it to its trigger (which may be inside ⋯ when narrow) | 4.4 | app | Export |
| C242 | row 5 — closing returns the slot to ZERO footprint | After close, export slot height 0 | re-spelled | Closed Export panel leaves zero footprint | 4.4 | app | Export |
| C243 | rows 3,4,5 — is OUT OF FLOW (absolute or fixed), not a band that pushes the page | Export slot is absolute/fixed | re-spelled | Export panel is an out-of-flow overlay | 4.4 | app | Export |
| C244 | rows 3,4,5 — is anchored under ITS OWN toggle, not the storage toggle | Slot top equals __export-control bottom, right edges aligned | re-spelled | Export panel anchors at its own trigger (default 414 px viewport: trigger is behind ⋯) | 4.4 | app | Export |
| C245 | rows 3,4,5 — opening does NOT move or resize the reader pane | Reader pane box identical across panel open at 1400 px | re-spelled | Opening Export does not move the reader pane | 4.4 | app | Export |
| C246 | rows 6+7 — all 7 rows real buttons; accessible names carry selection+action (2 tests) | Seven export rows are buttons with exact aria-labels | re-spelled | Export rows are real named buttons (only the open step moves) | 4.4 | app | Export |
| C247 | task 8.2 — HTML export writes lastExportFormat; each remaining row writes its own key (2 tests) | Each row click persists its key as lastExportFormat (uses trusted userEvent.click on rows) | re-spelled | Each Export row persists lastExportFormat (userEvent.click needs a visible panel when narrow) | 4.4 | app | Export |

### `tests/browser/exportShortcut.browser.test.ts`

re-spelled 3 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C248 | (A) Ctrl/Cmd+S listener is app-page-only (4 tests) | delta preventDefault counts: cs mount adds 0, main.ts adds 1; metaKey; editable guard; default html | unchanged |  |  | both |  |
| C249 | (B) HTML: a click, then triggerLastExport() download the SAME artifact | open header Export panel, HTML row and triggerLastExport produce same filename/h1 | re-spelled | panel row and Ctrl+S dispatcher reach the identical HTML export | 4.4 | app | Export |
| C250 | (B) PDF: triggerLastExport() calls window.print() exactly like the row | header Export panel PDF row → print once; triggerLastExport → print twice | re-spelled | PDF row and dispatcher share one print path | 4.4 | app | Export |
| C251 | (B) fresh default / unrecognized lastExportFormat (2 tests) | triggerLastExport with no click → html download; corrupted value → no-op | unchanged |  |  | app | Export |
| C252 | (C) ★ RED-FIRST: reading → export; editing → save, no export; reading again → export | main.ts shell; shadow-root Edit pill enters/leaves; Ctrl+S saves in edit, exports outside; discard guard | re-spelled | Ctrl/Cmd+S is Save while editing and Export otherwise; leaving a downloaded-save edit asks first | 4.3 | app | Export; Edit entering/leaving; unsaved-changes guard firing |

### `tests/browser/folderMode.network.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C253 | (all 2 tests) | Open/walk/render via direct mount and store put: zero requests; remote images stay blocked | unchanged |  |  | tab |  |

### `tests/browser/mathActions.browser.test.ts`

re-spelled 3 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C254 | (18 tests: block control group rows 11/16/17/20, copy-as-LaTeX x3, copy-as-MathML x2, re-attach, inline negatives x2, settled/failed/content-script selection x4, manifest FIRES check, manifest after per-figure copy) | in-document math buttons, clipboard payloads, live region, content-script absence, manifest permissions:[] — via createReaderPane or bare mount | unchanged |  |  | both |  |
| C255 | 6.2-R document-level MathML action (4 tests: both formulas, different documents, real button + live region, no formula fails) | opens Export via header .peekover-app__export-toggle; copy-math-mathml row copies well-formed <math> roots; status/row state | re-spelled | Export panel's 'Copy formulas as MathML' row collects every rendered formula (open Export from the toolbar; behind '⋯' at 414) | 4.4 | app | Export |
| C256 | §8-1(b) FIX document-level LaTeX action (6 tests: escaped \$, macro, block+inline, real button, no formula, failed excluded) | opens Export via header export toggle; copy-math-latex row recovers byte-identical sources; failure reported, never false 'Copied' | re-spelled | Export panel's 'Copy formulas as LaTeX' row recovers retained sources (open Export from the toolbar) | 4.4 | app | Export |
| C257 | ★ BOTH built manifests still read permissions: [] after the document-level MathML action ran | runs the Export-panel MathML row via header toggle, then both built manifests have no permissions | re-spelled | no manifest permission after the document-level copy (open Export from the toolbar) | 4.4 | app | Export |

### `tests/browser/pdfExport.browser.test.ts`

re-spelled 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C258 | (all 2 tests) | PDF row calls window.print() once with no args; row is a BUTTON named 'Export as PDF' | re-spelled | PDF row drives window.print(); only `mountWithFile()` (line 72) toggle selector moves | 4.4 | app | Export |

### `tests/browser/printMode.browser.test.ts`

re-spelled 1 · unchanged 3

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C259 | Chromium render signal: printToPdfAndExtractText finds the running content on EVERY page | PDF has fixture text, multi-page, no 'Zero network by default', 'Peekover' header and page footer | re-spelled | App chrome text never reaches the PDF. The negative control (L505) targets the header tag; once 4.1 changes the brand/tag it must target surviving toolbar text | 4.1 | app | Export (PDF) |
| C260 | contained pane: reader chrome AND the app shell (header/folders) are display:none under print | App page: injected pill markers, toolbars, TOC, header, folders hidden under print | unchanged |  |  | app |  |
| C261 | full-page host: every reader chrome pill + per-block toolbar is display:none under print | Tab host: pills, mode/theme toggles, TOC, toolbars hidden under print | unchanged |  |  | tab |  |
| C262 | ★ Ruling 4 rule byte-unchanged; de-clip (2 tests); page-break rules; shadow-scoped CSSOM probe; APP_CSS CSSOM probe | Print CSS rule bodies, de-clipping, page breaks, @page at-rule retention | unchanged |  |  | both |  |

### `tests/browser/readerPaneContained.browser.test.ts`

re-spelled 3 · retired 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C263 | the Raw toggle sits inside the reader pane | shadow-root mode pill rect within .peekover-app__reader rect | retired | floating Raw pill's position on the app page; Read/Raw lives in the header toolbar | 4.5 | app |  |
| C264 | the folder tree stays on top at its own centre | elementFromPoint at folder-tree centre is the tree, not reader host (414px harness) | re-spelled | reader host never covers the folder tree; helper wait at 4.5, and at ≤1080 the tree is a closed overlay — open Files or measure wide | 4.5, 4.8 | app |  |
| C265 | the reader host is not pinned to the viewport | host computed position != fixed | re-spelled | contained host is not position:fixed (helper wait only) | 4.5 | app |  |
| C266 | the shell header stays on top at its own centre | elementFromPoint at header centre is header, not reader host (helper waits for shadow-root mode pill) | re-spelled | reader host never paints over the shell header; helper's wait for .peekover-mode-toggle must change | 4.5 | app |  |

### `tests/browser/remoteMedia.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C267 | (all 2 tests) | full-page mount: zero image requests before opt-in; remote-load bar click fires them | unchanged |  |  | tab |  |

### `tests/browser/snapshotCapture.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C268 | (all 5 tests) | controller capture via controller.start (no UI); content-script pill on full-page mount captures nothing; zero network; wipeAll | unchanged |  |  | both |  |

### `tests/browser/storagePanelOverlay.browser.test.ts`

re-spelled 6

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C269 | closing the panel returns the slot to zero footprint | Slot height 0 after close; navigator unmoved | re-spelled | Closed Stored data panel leaves zero footprint | 4.4 | app | Stored data opening |
| C270 | opening the storage panel does NOT move or resize the folder-file navigator | Folders box identical across opening via header __storage-toggle | re-spelled | Stored data opens as an overlay; navigator does not move (4.8 changes the navigator to an overlay at ≤1080 px) | 4.4 | app | Stored data opening |
| C271 | opening the storage panel does NOT move or resize the reader pane | Reader box identical across panel open | re-spelled | Opening Stored data does not move the reader pane | 4.4 | app | Stored data opening |
| C272 | the header's height is the same with the panel closed and open, at every header width | Sweeps header width 280–1100 px; header height identical closed vs open; sweep crosses wraps | re-spelled | Opening Stored data never changes toolbar height. The sweep sets header.style.width, but the ⋯ collapse is viewport-keyed (≤863 px), so the sweep cannot see it | 4.4 | app | Stored data opening |
| C273 | the open panel is anchored under the header, not floating elsewhere | Slot top equals header bottom; slot hangs in right half of header | re-spelled | Stored data panel drops from the toolbar at the right (the anchor may become the toolbar or the ⋯ menu) | 4.4 | app | Stored data opening |
| C274 | the open panel is taken OUT of flow (position is absolute, not static) | __storage-slot absolute/fixed when open | re-spelled | Stored data panel is out of flow | 4.4 | app | Stored data opening |

### `tests/browser/tableCost.browser.test.ts`

re-spelled 1 · unchanged 3

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C275 | CONTENT SCRIPT pays nothing (3 tests) | runReader arms: equal counts, moved counts, footprint (badges 0) | unchanged |  |  | tab |  |
| C276 | D-11 (i) enhancer re-parses/re-sanitizes nothing, reads no layout (2 tests) | parse/sanitize spies and layout-API probe silent during enhancement | unchanged |  |  | app |  |
| C277 | app page › arm 1 == arm 2 / arm 3 > arm 2 (2 tests) | contained mount vs mount+enhancers: equal node/listener counts on a bare doc; counts move on a table doc | unchanged |  |  | app |  |
| C278 | app page › no element carrying any M8 class exists in arm 2 — and arm 3 carries all of them | M8 footprint (table tools + agent badge) zero on bare, full incl. badges:1 on table doc | re-spelled | M8 footprint on the app-page shadow root; harness must mirror readerPane's pills:false, so badges:1 becomes 0 | 4.5 | app |  |

### `tests/browser/tablePlacement.browser.test.ts`

re-spelled 1 · retired 1 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C279 | 3.5 · row 8 — the mode toggle is clear in BOTH rail states — it never shares the column's band | App-page shadow-root `.peekover-mode-toggle` asserted present and x-band-disjoint from table toolbar | retired | Mode-toggle pill vs column band on the app page; Read/Raw moves to the header toolbar, outside the pane | 4.5 | app |  |
| C280 | 3.5 · row 8 — with the rail OPEN, the toolbar's horizontal band clears both, at any height it later grows | Table toolbar x-band clears TOC rail/handle/list and mode toggle; ≥3 compared | re-spelled | Table toolbar x-band clears the TOC rail; the mode-toggle entry silently skips after pills:false — drop it | 4.5 | app |  |
| C281 | harness sanity; row 6 (4 cases); row 5 containment (4 cases); row 5 first block (4 cases) | Table toolbar width bound is the column's; contained in column; first block unmoved | unchanged |  |  | app |  |

### `tests/browser/tableScope.browser.test.ts`

re-spelled 3 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C282 | (3 tests: diff has real tables walked past, exclusion stable, diff round trip keeps sort/filter) | enterDiff/exitDiff called directly; enhancement never reaches .peekover-diff; column table untouched | unchanged |  |  | app |  |
| C283 | 3.9 D-8 — the raw view: holds the table's SOURCE as text, zero <table> elements, and no enhancement | clicks shadow .peekover-mode-toggle (mountAppShell) -> raw sibling holds source, no table, no enhancement | re-spelled | raw view excludes table enhancement, reached by the real Raw gesture — toolbar Raw | 4.5 | app | Read/Raw switching |
| C284 | 3.9 D-9 — the sorted arrangement does not survive, and no old row survives with it | watch started via shadow .peekover-watch; rewrite re-renders table in new document order, toolbar reset | re-spelled | watch re-render lands new rows in document order — start watch via toolbar Watch | 4.5 | app | watch toggling |
| C285 | 3.9 row 14 — a click on the rebuilt sort button reorders the NEW table | pill-started watch re-render; rebuilt sort button reorders current table | re-spelled | rebuilt table toolbar acts on the current table — start watch via toolbar Watch | 4.5 | app | watch toggling |

### `tests/browser/tableTools.browser.test.ts`

re-spelled 4 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C286 | 3.6 sort/keyboard/aria/mechanism/two-table/no-shortcut tests (10 tests, openViaInitialSelect) | Sort button in th, focusable, Enter/Space, aria-sort plus painted text, row nodes moved, stable, per-table | unchanged |  |  | app |  |
| C287 | 4.1 content-script tests: sanity sites 3/4, describe.each(CONTENT_SITES), D-7 teardown, sort/filter, site-4 sort | runReader / content watch: toolbar presence, placement, gate, sort, filter, teardown survival | unchanged |  |  | tab |  |
| C288 | SITE 1 (initial select): the click chain puts a table on screen, with chrome beside it | App-page select renders one table and the shadow-root theme pill exists | re-spelled | Non-vacuous guard that site 1 really mounted the reader (the pill clause L318 must target surviving chrome, e.g. the TOC rail or .peekover-reader) | 4.5 | app |  |
| C289 | SITE 2 (watch re-render): the poll really replaces the document | Clicks shadow-root watch pill (L239), re-render replaces seed doc; theme pill present | re-spelled | Non-vacuous guard that site 2 (the watch re-render) really ran; watch started from the toolbar | 4.5 | app | Watch toggling |
| C290 | SITE 2 (watch re-render): the sort works on the document the re-render produced | After the watch re-render (shadow watch pill), sort reorders the current table | re-spelled | Sort handlers reach the current table after a watch re-render; watch started from toolbar | 4.5 | app | Watch toggling |
| C291 | describe.each(SITES) rows 1/4/3/2 — toolbar present, inside column before table, header gate, none on table-free doc | Table toolbar renders per header table, in place, gated, absent on table-free doc, both app sites | re-spelled | Site-1 arm unchanged; site-2 arm's openViaWatchRerender clicks the shadow watch pill (L239), so it is re-spelled to the toolbar watch | 4.5 | app | Watch toggling (site-2 arm only) |

### `tests/browser/themeControl.browser.test.ts`

replaced 1 · retired 2 · unchanged 7

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C292 | a pick applies IMMEDIATELY and calls the save path — all 4 tests | Dark computes #12141C; save sink patches; broadcasts to every registered host; works with no sink | unchanged |  |  | both | theme switching |
| C293 | accessibility — both tests | Real button, aria-label carries selection and action; focus + activate | unchanged |  |  | tab | theme switching |
| C294 | displays the CURRENT setting, changed from anywhere — all 3 tests | Re-labels on late setting; second control in sync; Auto vs matching manual distinguished | unchanged |  |  | both | theme switching |
| C295 | geometry — clears the reading column at a WIDE viewport; clears net indicator and remote-load | Full-page pill clears column, network indicator and remote-load pill | unchanged |  |  | tab |  |
| C296 | geometry — contained app-page pane, %s viewport (narrow + wide) | Contained-mount theme pill clears mode toggle and TOC handle/list (CONTAINED_CSS pill positions) | retired | Theme-pill-vs-chrome clearance in the app pane; pill and its CONTAINED_CSS overrides deleted | 4.5 | app |  |
| C297 | geometry — full-page reader, %s viewport (narrow + wide) | Theme pill clears mode toggle, TOC handle, TOC list | unchanged |  |  | tab |  |
| C298 | is a SIBLING of .peekover-reader, never inside the column (%s) [contained arm] | Same, on a contained mount | retired | Theme pill placement in the app reader shadow root; no pill there after pills:false | 4.5 | app |  |
| C299 | is a SIBLING of .peekover-reader, never inside the column (%s) [full-page arm] | Pill parentNode is the shadow root, not inside the column | unchanged |  |  | tab |  |
| C300 | renders on the app-page {contained} pane (the recurring two-surface gotcha) | Theme pill exists on a direct `mount(…, {contained:true})` host | replaced | A theme control reaches the app page — owned by toolbar.browser.test.ts's merged theme control (4.4); pill leaves at 4.5 | 4.5 | app | theme switching |
| C301 | renders on the content-script full-page reader | Theme pill is a BUTTON type=button on a full-page mount | unchanged |  |  | tab | theme switching |

### `tests/browser/themeShell.browser.test.ts`

re-spelled 5 · retired 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C302 | a header pick themes BOTH the shell root and the contained reader pane (dark) | Computed --paper/--ink equal on shell and reader host; dark values | re-spelled | One pick themes shell and reader together on computed tokens (4.4's own red-first) | 4.4 | app | theme switching |
| C303 | and under a manual LIGHT pick on an OS-light machine | Shell and reader computed tokens agree, light paper | re-spelled | Same coherence under a manual Light pick | 4.4 | app | theme switching |
| C304 | keeps the in-reader pill and the header control showing the SAME selection | Header pick re-labels shadow-root theme pill; pill pick re-labels header control | retired | Two app-page theme controls agreeing; 4.4 merges to one control (interim toolbar-vs-pill until the pill goes at 4.5) | 4.5 | app | theme switching |
| C305 | offers auto/light/dark and starts on the Auto default | Header control cycles Auto → Light → Dark → Auto | re-spelled | The merged theme control offers auto/light/dark, starting on Auto | 4.4 | app | theme switching |
| C306 | renders in the header beside the storage toggle | `.peekover-app__theme-toggle` is a BUTTON in the header, same parent as the storage toggle | re-spelled | The one theme control sits in the toolbar's app group beside Stored data, in mock order | 4.4 | app | theme switching |
| C307 | the choice persists (real IndexedDB) — all 4 tests (written; re-mount reads disk; no row → Auto; no settings methods) | Header control pick persists via directPort and returns on re-mount; best-effort without store | re-spelled | Theme choice persists across re-mount and degrades gracefully — through the toolbar control (4.4's persistence clause) | 4.4 | app | theme switching |

### `tests/browser/tocNetwork.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C308 | (all 2 tests: full-page host; contained pane) | Every TOC action fires zero requests on both surfaces (the rail stays in the shadow root) | unchanged |  |  | both |  |

### `tests/browser/tocPersist.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C309 | (all 13 tests: describe.each(full-page, contained) carry-over x7, drag persists x4, narrow pill/column x1) | TOC open/width persist and restore on both surfaces; drag saves once; tab pills float over column | unchanged |  |  | both |  |

### `tests/browser/uiFonts.browser.test.ts`

re-spelled 1 · unchanged 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C310 | app page — registers and loads every shipped face | Bricolage 400/600/700 and Sometype 400/500 registered and loaded | unchanged |  |  | app |  |
| C311 | app page — the shell chrome draws Bricolage, code draws Sometype, prose draws Literata | header .peekover-app__brand draws Bricolage; reader code Sometype; prose Literata | re-spelled | app chrome draws Bricolage — probe the toolbar's mark/word instead of the old brand element | 4.1 | app |  |
| C312 | content-script reader — registers no Bricolage / Sometype face, and its chrome and code draw a system face | runReader: no UI faces; .peekover-mode-toggle and code draw system faces; prose draws Literata | unchanged |  |  | tab |  |

### `tests/browser/watchContentWiring.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C313 | (all 9 tests) | content-script installContentWatch re-renders, dead-read note, Firefox/remote notes, registry last-wins — full-page mount and its pill | unchanged |  |  | tab |  |

### `tests/browser/watchControl.browser.test.ts`

re-spelled 3 · replaced 5 · retired 3 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C314 | (all full-page arms + full-page-only blocks: 6 surface tests, a11y x3, pulse reduce, geometry narrow/wide/column, conditional chrome, follow x2, flash, reduce x2, stream x2) | content-script watch pill: renders, toggles, closure-death, a11y, motion, collisions, follow-at-bottom, flash, coalescing | unchanged |  |  | tab | watch toggling |
| C315 | watch control — contained surface: STILL WORKS after a re-render — the closure-death case | rebuilt pill after remount shows aria-pressed=true and stops the same target | replaced | toolbar Watch reflects live state across reader re-renders (toolbar observer on data-watch) and still stops the watch | 4.5 | app | watch toggling |
| C316 | watch control — contained surface: data-watch lives on the HOST and SURVIVES a re-mount | after pill start, a preserveReading contained re-mount keeps data-watch=active on host | re-spelled | data-watch survives a contained re-mount; start via registry/toolbar, re-mount with pills:false | 4.5 | app | watch toggling |
| C317 | watch control — contained surface: grows NO chrome at all in a context that cannot watch | no registered target -> no .peekover-watch in the contained shadow root | replaced | no dead Watch control on the app page when nothing can watch — toolbar.browser.test.ts must own it | 4.5 | app | watch toggling |
| C318 | watch control — contained surface: is a SIBLING of .peekover-reader, never inside the reading column | contained pill's parentNode is the shadow root, not inside .peekover-reader | retired | placement of a shadow-root watch pill on the app page; toolbar lives in light DOM outside the shadow root | 4.5 | app |  |
| C319 | watch control — contained surface: reaches a target REPLACED after the control was built | control built, slot re-registered; click reaches the second target only | replaced | toolbar Watch drives the CURRENT registry occupant (4.2's red-first: bind to a fresh controller -> disagree) | 4.5 | app | watch toggling |
| C320 | watch control — contained surface: renders through the one mount() seam once a target is registered | mount(contained) with a registered target renders a real <button> .peekover-watch in the shadow root | replaced | the app page offers a real Watch button once a target is registered — owned by toolbar.browser.test.ts (written 4.2) | 4.5 | app | watch toggling |
| C321 | watch control — contained surface: toggles the watch on and off, reaching the registered target with THIS host | pill click starts target with this host, sets data-watch=active, text 'Watching'; second click stops | replaced | toolbar Watch starts/stops the registered target for the active host (4.2 verify: same watch, aria-pressed agree) | 4.5 | app | watch toggling |
| C322 | watch control — geometry on the contained surface: clears the existing chrome, narrow/wide (it.each) | contained watch pill disjoint from mode pill, theme pill, TOC handle and TOC list at 414 and 1400 | retired | floating watch pill's position in the app-page reader pane (4.5's no-chrome-over-text sweep covers what remains) | 4.5 | app |  |
| C323 | watch control — geometry on the contained surface: clears the reading column at a WIDE viewport | contained watch pill rect disjoint from .peekover-reader at 1400 | retired | floating watch pill vs column on the app page | 4.5 | app |  |
| C324 | watch follow — contained surface: AT THE BOTTOM followed / SCROLLED AWAY unmoved (2 tests) | real controller started by pill click; contained scroll box follows appended text only when at bottom | re-spelled | follow-at-bottom-only on the app-page scroll box; start gesture moves off the shadow-root pill (harness stays green unless pills:false) | 4.5 | app | watch toggling |
| C325 | watch under a rapid update stream — contained surface: COALESCES / STOPPING mid-stream (2 tests) | pill-started counted watch coalesces 12 changes, lands newest, pill stops it; stop cancels pending render | re-spelled | coalescing and stop-cancels-pending on the app page; start/stop via toolbar Watch, re-render with pills:false | 4.5 | app | watch toggling |

### `tests/browser/watchDiffDefer.browser.test.ts`

re-spelled 2

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C326 | D-11 › holds the comparison on screen, then shows the change AND says so on exit — and captures | shadow-root Compare/picker open diff; change deferred; pill exit flushes, watch note visible, capture | re-spelled | diff defers an external change; exit flushes, says 'changed again' visibly, captures on-screen state | 4.5 | app | Compare/picker opening a diff; watch |
| C327 | D-11 › says NOTHING when nothing changed | open/close comparison via shadow-root pill: same doc, no visible note, no snapshot | re-spelled | no change → silent exit, no capture | 4.5 | app | Compare/picker opening a diff |

### `tests/browser/watchLifecycle.browser.test.ts`

re-spelled 5 · unchanged 5

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C328 | (a) the Firefox file-input app page EXPLAINS, and offers no toggle at all | App-page picker decision rendered into a peekover-root mount: no toggle, FIREFOX_PICKER_NOTE | re-spelled | Firefox picker app page explains watch is unavailable, offers no toggle — must be read where the app page shows it | 4.5 | app | watch (degraded explanation) |
| C329 | (b) the Firefox content-script reader EXPLAINS, and offers no toggle at all | No toggle, FIREFOX_CONTENT_SCRIPT_NOTE shown, document renders | unchanged |  |  | tab | watch (degraded explanation) |
| C330 | (c) a REMOTE http(s) raw document EXPLAINS with the scope note — no toggle, NO detector | Remote content script: no toggle, no detector, REMOTE_DOCUMENT_NOTE | unchanged |  |  | tab | watch (degraded explanation) |
| C331 | CHROMIUM IS UNAFFECTED — the normal control still renders on both surfaces | CS and app-page (picker, persistable) decisions both render toggle, note hidden (peekover-root mounts) | re-spelled | Chromium app page offers the normal Watch control with no note — app arm read from the toolbar; CS arm unchanged | 4.5 | both | watch toggling |
| C332 | dead read — all 3 tests (stops and explains; streak reset; restart clears note) | peekover-root mount: dead read stops watch, note role=status, last render kept; streak resets | unchanged |  |  | tab | watch toggling |
| C333 | stops A's detector on select(B), and A's later change does NOT re-render B | Real readerPane; shadow-root `.peekover-watch` click starts; select(B) stops A, no cross-feed | re-spelled | Switching documents stops the previous watch and A's change never reaches B; started from the toolbar Watch | 4.5 | app | watch toggling |
| C334 | the DRAGGED Firefox folder is NOT degraded — it watches, with no note | App-page drop decision: toggle present, note hidden (peekover-root mount) | re-spelled | Dropped Firefox folder offers Watch with no note — on the app page that is the toolbar | 4.5 | app | watch toggling |
| C335 | the remote scope note and the Firefox limit note are NOT interchangeable (render level) | Two content-script decisions render distinct notes | unchanged |  |  | tab |  |
| C336 | the switch also clears the watching state from the host and the control | After select(B): host has no data-watch; shadow-root watch pill aria-pressed=false | re-spelled | Document switch clears data-watch and the Watch control's pressed state (toolbar control) | 4.5 | app | watch toggling |
| C337 | watching is a user gesture — both tests (plain mount; repeated re-render) | peekover-root mounts start no detector | unchanged |  |  | tab | watch toggling |

### `tests/browser/watchObserverWiring.browser.test.ts`

re-spelled 7 · unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C338 | (6 detector tests: harness gate, observer no-polling x3, no-handle polls, Firefox polls) | detectorForFile picks observer vs polling and delivers changes; no UI | unchanged |  |  | unit-builder |  |
| C339 | 4.7 (discovered) — offers the pill on the first selection, not only from the second file onwards | first file opened in mountAppShell has a shadow .peekover-watch, aria-pressed=false, click starts watching | re-spelled | Watch is offered and live on the first file of a session — query the toolbar's Watch | 4.5 | app | watch toggling |
| C340 | 4.7 through appShell — a file with NO handle still watches correctly here | pill-started watch on handle-less file polls and re-renders | re-spelled | handle-less file is polled through the same wiring — start via toolbar Watch | 4.5 | app | watch toggling |
| C341 | 4.7 through appShell — preserveReading still applies | pill-started watch; setReaderMode raw; write lands in raw view, mode stays raw | re-spelled | Raw survives an event-driven watch update — start via toolbar Watch | 4.5 | app | watch toggling |
| C342 | 4.7 through appShell — re-renders from a real write without ever polling the seam reader | openAndWatch via shadow pill; real write re-renders; seam read count unchanged | re-spelled | app page watches by events, never polling — start via toolbar Watch | 4.5 | app | watch toggling |
| C343 | ladder — a DISAPPEARED record stops the watch, explains, and never blanks | watch stops; shadow .peekover-watch-note shows DEAD_READ_NOTE; reader keeps last text; pill stays aria-pressed=false | re-spelled | dead read stops watch, says so, never blanks, toggle stays — note's app-page home is unnamed (see Q1) | 4.5 | app | watch toggling |
| C344 | ladder — an ERRORED record over a live file RE-OBSERVES, and the reader keeps updating | pill-started watch; synthetic errored record re-observes; later write renders; no note | re-spelled | errored observation recovers onto events — start via toolbar Watch | 4.5 | app | watch toggling |
| C345 | ladder — spec §7-7 atomic save degrades to polling, still watching | pill-started watch; re-observe refused; degraded poll still delivers write | re-spelled | invalidated handle degrades to polling, never silently stops — start via toolbar Watch | 4.5 | app | watch toggling |

### `tests/browser/watchRemount.browser.test.ts`

re-spelled 3 · unchanged 4

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C346 | 3.3(a) both surfaces › READING keeps its PLACE when content is inserted ABOVE | anchor heading returns to same offset after insertion-above re-mount | unchanged |  |  | both |  |
| C347 | 3.3(a) contained › RAW, scrolled mid-document, re-mounts still in Raw at the same place | app shell; shadow-root mode pill → raw; preserveReading re-mount keeps raw and place | re-spelled | preserveReading keeps Raw mode and place on the app pane (enter Raw via toolbar Read/Raw) | 4.5 | app | Read/Raw switch |
| C348 | 3.3(a) full-page › RAW, scrolled mid-document, re-mounts still in Raw at the same place | mode pill → raw, scroll; preserveReading re-mount keeps raw and scrollTop | unchanged |  |  | tab |  |
| C349 | 3.3(b) (both describe.each arms) › readerPane.select() lands a NEW file in Reading | app shell, file A → shadow-root mode pill raw; select B → reading | re-spelled | switching files lands the new document in Reading | 4.5 | app | Read/Raw switch |
| C350 | 3.3(b) contained › the UNCONDITIONAL reset to Reading still happens | app shell; shadow-root mode pill → raw; option-less re-mount lands in reading | re-spelled | an option-less re-mount resets to Reading on the app pane | 4.5 | app | Read/Raw switch |
| C351 | 3.3(b) full-page › the UNCONDITIONAL reset to Reading still happens | mode pill → raw; option-less re-mount lands in reading | unchanged |  |  | tab |  |
| C352 | 3.4 (both surfaces) › collapsed rail stays collapsed; re-mount persists nothing (2 tests) | TOC state/width survive preserveReading re-mount; no settings write | unchanged |  |  | both |  |

### `tests/browser/wipe.browser.test.ts`

unchanged 1

| ID | Test | Checks today | Class | Property kept / retired | Task | Surface | Function (Q1) |
|---|---|---|---|---|---|---|---|
| C353 | (all 6 tests: wipeAll zero, describeStored, OPFS handle row, zero-network, Clear diagram cache survivors, wipeAll erases cache) | Store-level wipe/describe/clear semantics and zero network; no UI | unchanged |  |  | unit-builder |  |
