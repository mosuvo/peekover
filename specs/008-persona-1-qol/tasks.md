# Tasks 008 — Persona-#1 QoL: compare two files · agent-file awareness · table tools (M8) — check off in order; add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews these against the plan and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M8 GATE 1** entry (`aaf990e`), corrected*
*at `757f953` and `f46f558`. `plan.md` — gate 2, banked in `decisions.md`'s **M8 GATE 2** entry (`2c29821`).*
*One commit per task (`-F` heredoc, `Co-Authored-By: Claude` trailer); the human reviews the pasted evidence and*
*pushes. Each capability gets its OWN real-engine test (`tests/browser/*`, Cr+Fx, red-first + non-vacuous) —*
*never a trailing "add tests" task. Layout, rAF, computed style, pointer geometry, bytes-on-wire, clipboard*
*availability, cross-context messaging **and secure-context behaviour on `file://`** are jsdom-**BLIND**:*
*proven in the real engine, never in jsdom.*

**★ THE FOUR GATE-2 RULINGS AND THE TWO SCOPE INSTRUCTIONS — APPLIED HERE, NEVER RE-ARGUED.** Gate 2 is
**banked**: `decisions.md`'s **M8 GATE 2** entry (`2c29821`) approves `plan.md` as it stands at `fa27333`,
CONFIRMS **D-1** (the one-line `mount.ts` seam) and **D-6** (no shared enhancement seam), **rules plan §8's
four questions**, and issues **two scope instructions to this stage**. Each is applied **verbatim** below;
none is a plan D-value and none is re-decided here. *(Plan §8's **Q1–Q4** are NOT the spec's
**§8-1 … §8-4** measure-then-choose items cited throughout this file — the two numberings collide and are
kept apart deliberately, as the gate-2 entry itself insists.)*
- **Q1 · Should a SNAPSHOT diff also name both sides (D-5)? RULED: NO — leave snapshot diffs VERBATIM.** §4
  requires the naming for **file-vs-file only**, and that is the floor this milestone builds to; a snapshot's
  *"before"* is an earlier version of what is already on screen, so the direction is not in doubt, and
  captioning it is scope the spec did not ask for. **2.5 captions file-vs-file and preserves today's
  snapshot behaviour byte-for-byte**, and **no other task captions a snapshot.**
- **Q2 · Does copy-out need a MENU, or two controls? RULED: TWO BUTTONS — minimum chrome, no menu.** CSV and
  Markdown are two small controls (**3.8**). ★ **This activates NO overlay row: §3.11 rows 9 (the open
  overlay clears the chrome) and 21 (focus trap and restore) stay `—`, not `D`** — **no popup, no focus trap
  and no overlay work enters group 3**, which is checkable against every task below. *"A table is not a data
  grid"* (§6) is what this was decided on.
- **Q3 · The badge's LANE (§3.11 row 7). RULED: UNCHANGED — produce, do not choose.** **1.5 PRODUCES the
  rect measurement** at both geometry widths; **the lane CHOICE is the human's**, taken at 6.1 with 1.5's
  numbers in hand. No task picks it.
- **Q4 · D-11 (iii)'s carried hole and its TRIGGER. RULED: UNCHANGED — it stands as the plan names it, and it
  is a RECORDS act.** **6.3 confirms or replaces the trigger** so a future planner inherits a **condition**
  rather than a memory. No code depends on it.
- **★ SCOPE INSTRUCTION 1 — the heaviest table-tools task is SPLIT, and this is where it went.** One task
  carrying the enhancer **plus** both app-page call sites **plus** §3.11's two **INVERTED** rows (4 and 5)
  **plus** D-12's token verification against all three theme blocks is **too large to review or to revert as
  one unit**. It is now **FOUR**: **3.2** the enhancer module (logic only, no call site, bundle-neutral) ·
  **3.3** the toolbar's CSS and D-12's token verification (presentation — where content-script bytes first
  move for table tools) · **3.4** the two app-page call sites and the **structural** rows 1, 2, 3,
  **4 (INVERTS)**, 23 · **3.5** the **containment** measurement, rows **5 (INVERTS)**, 6, 8, at both geometry
  widths. ★ **3.1 still precedes all four** — this milestone's one hard sequencing constraint, re-checked by
  number after the split.
- **★ SCOPE INSTRUCTION 2 — the give-way is its OWN task and its rollback path is stated in its own terms.**
  §8-1's escape hatch is *"the surface reach gives way, not the gate"*, and giving way is a **REMOVAL of the
  content-script reach followed by a RE-MEASUREMENT to a RESTORED 318,747 B and the two original md5s** —
  **not an edit to a constant**. It is therefore **5.7**, split out of 5.6's *"set the chosen values"*, so a
  session that has to take that path knows what it is taking before it starts.

**Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **spec §3.1–§3.9**, sealed at gate 1, with its six §9 dispositions **preserved by silence**: three items, ONE
  milestone (§9-1) · "tuned" = presentation-only (§9-2) · `.cursorrules` **OUT** (§9-3) · table tools on BOTH
  surfaces with §8-1 as the escape hatch (§9-4) · compare = **current-vs-picked** (§9-5) · §9-6 **discharged**,
  `docs/product/spec.md` already correct and **not edited by M8**.
- **plan D-1 … D-12**, sealed at gate 2. **Every task names the D-values it services.** ★ **Each D-value's
  `decisions.md` entry text is ALREADY WRITTEN in `plan.md` §0 and is applied VERBATIM — never re-authored —
  landing with the commit that implements it, never after** (plan §0's own rule; the 007 gate-2 (a) shape).
- **spec §6's IS-NOT list is a fence:** the content-script SURFACE milestone (measured infeasible, +238.8 ms) ·
  `.cursorrules` and every non-markdown agent file · any per-document settings axis · parser reconfiguration
  of any kind · any-vs-any and cross-folder comparison · side-by-side diff · sub-line diff highlighting ·
  **copy table as JSON** · table editing · sort/filter state that survives a re-render · column resizing,
  hiding, frozen headers, pagination · session-transcript rendering · local MCP bridge · Shiki · Editor Mode ·
  the carried `mermaid/package.json` D-10(b) narrowing · the `spec-coverage.md` F2/F6 re-audit · the M7
  gantt/dark-mode legibility finding. **No task proposes any of them.**

**Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism (retro finding
9's own conclusion):**
- **Golden pin:** `git diff tests/golden/output/` **EMPTY**; M8 adds no golden fixture (plan §2 fences that
  directory). **THE STANDING CORRECTION: an empty golden diff proves NOTHING about chrome, placement, or a
  reordered row** — that suite snapshots the pre-mount `sanitize(parse(source))` string, and all three items
  act **after `mount()` commits**, downstream of it, **by construction**. §3.11's structural DOM assertions in
  a real engine are the sole guard, never a duplicate pin.
- **Manifest pin:** `tests/manifest.test.ts` green and **2975 B, byte-unmodified**; `permissions: []` on
  **both built manifests** (654 / 770 B at `94f7add`-era 9.3); `web_accessible_resources` **absent**. A needed
  manifest edit or `matches` widening is an AGENTS.md #4 event and a **hard stop** (the live case is
  `.cursorrules`, §3.5 — which is why it is out).
- **Content-script bytes — ★ NOT byte-identical this milestone, and that is a DECISION (§3.7/§5), not a
  slip.** Baseline **318,747 B** both engines, md5 Cr `c7b33b36b1a727fdacb77eefe64083e1` / Fx
  `67717921bdf646c7366176392d0c37d7` (9.3, `94f7da5`). Every delta is **stated with its baseline and
  DECOMPOSED to a ZERO residual** — table-tools code · badge code · glue · CSS — **proven by ABLATION and md5,
  never by an identifier grep** (the M6 retraction: a grep over a minified bundle returns 0 whether or not the
  code shipped). **An unaccounted byte is a defect, not a cost.**
- **Fences, green in every task:** `diff` / `diffEngine.ts` / `diffView.ts` **off the content-script graph** —
  `diffEngine.test.ts`'s three clauses (`:223-311`), **with clause B still firing as the control that proves
  clause A is a real absence**; **007's static import fence 8/8** (`diagramImportFence.test.ts`, walking
  `entrypoints/peekover.content.ts` `:63` and `entrypoints/app/main.ts` `:65`), and **`tableEnhancer.ts`
  proven not to reach `diagramEnhancer` or `diagramEngine`**.
- **Revert-and-fail (finding 5) is the standard, not an option:** every regression test is verified red **with
  the defect's own signature in the defect's own units**. No revert-and-fail, task unfinished.
- **A positive control that FIRES (finding 1)**, named in the Verify line and asserted **in the same test**,
  under the same conditions the negative claim disclaims.
- **Perf: A-B-A against a same-session HEAD control, FLOOR reported beside MEDIAN** (finding 7), quiesced.
  ★ **The 26.9 ms median / 29.9 ms floor content-script headroom is an INPUT and is NOT re-measured** — it was
  re-measured 2026-08-03 at `757f953` (§ Baselines). A **`ch` unit in a layout-blocking property once cost
  ~28 ms**: none in `margin` / `padding` / `transform`; `max-width` is free (finding 6).
- **`cp` the target file aside BEFORE any red-first mutation; restore from the copy.** NEVER
  `git checkout <path>` while uncommitted task work lives in it (that destroyed group 4's paint gate in M4).
- **Two surfaces via `describe.each` EXCEPT where the spec collapses it to one:** §4 says *"The system shall
  present no file comparison on the content-script reader"*, so **group 2 is app-page-only and asserts that
  absence with the app page as the control that fires**. Groups 1, 3 and 4 are two-surface.
- **CSS rationale lives in the TypeScript doc comment ABOVE the template literal, never inside the string**
  (finding 9 — the minifier cannot strip what is inside the backticks; `readerCss.ts` is on **both** graphs, so
  its comments ship to the content script too). The mechanism is a **byte check on the shipped block** in the
  Verify line, not a reminder. **Every token is verified against all three theme blocks before use**
  (`readerCss.ts:31-40` light, `:43-48` dark, `:51` sepia — ★ **sepia overrides ONLY `--paper`, `--ink`,
  `--accent`, `--accent-soft`, so `--panel` / `--line` / `--muted` / `--faint` resolve to the LIGHT values on
  sepia paper**). **Never substitute a nearby token silently.**
- **★ A spread defeats tree-shaking:** an unused export whose initializer spreads an array is **retained**
  (+896 B onto a 0-delta content-script fence, once); `/*#__PURE__*/ ARR.slice()` drops. The frozen name set's
  initializer shape is part of the byte decomposition, not an afterthought.
- **NUL check on any task that writes a control character:** `grep -c` on a shell-escaped NUL is **VACUOUS**
  in Git Bash. Use `tr -d -c '\000' < f | wc -c` **and** `python3 -c "print(open(F,'rb').read().count(b'\x00'))"`
  — **both forms, every time**, and never a grep. Control characters are written as the six visible characters
  backslash-u-0-0-0-0, never as an embedded byte.
- **No production dependency** (§5): `dependencies` stays at **exactly five**, asserted not eyeballed. If any
  item appears to need one, that is a **stop-and-flag** (§7-6), not a governed act performed inline.
- **`docs/trust/PERMISSIONS.md` is NOT edited** — nothing is stored, no permission is added, no capability row
  is owed. If that stops being true it is a **stop-and-flag, not an edit**.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit** (M1 rule, four recorded
  failures); 6.3 is its final reconciliation. **Stage explicit paths — NEVER `git add -A` / `git add .`**

**★ THE §3.11 SIBLING-CHECKLIST AUDIT — ROUTED HERE, BEFORE THE FIRST TASK BELOW READS IT.** The audit is a
**discharged plan deliverable** (`plan.md` §3.11, 24 rows enumerated at `f46f558` from `diffChrome`,
`remoteMediaUi`, `themeControl`, `watchControl`, `diagramLightbox` + `storagePanelOverlay`). `tasks.md`
**consumes** it, and **no badge or table-tools browser test is written before the row it discharges is read
from it** — M6 retro finding 4, and the one hard sequencing constraint of this milestone. M8 adds **TWO
chromes with OPPOSITE geometry**, so both columns route separately:
- **BADGE (a sibling of `.peekover-reader`)** — rows 2, 3, 4, 14, 15 → **1.4** · rows 1, 23 → **1.4** ·
  rows 5, 7, 8, 10, 11 → **1.5** · row 22 → **1.6** · rows 6, 9, 12, 13, 16–21, 24 → **out per the audit**.
- **TOOLBAR (inside the reading column)** — rows 1, 2, 3, **4 (INVERTS)**, 23 → **3.4** · rows
  **5 (INVERTS to containment)**, 6, 8 → **3.5** · rows 11, 15, 16, 17, 18, 19 → **3.6** · rows 12, 15, 16,
  20 + **row 24's enumerated set** → **3.7** · row 16 → **3.8** · rows 13, 14 → **3.9** · row 2's cost half →
  **3.10 / 4.2** · row 22 → **3.11** · rows 1, 23 on the content script → **4.1 / 4.2** · rows 7, 10 →
  **out** · ★ **rows 9, 21 → INACTIVE, and now settled for M8: gate-2 Q2 ruled TWO BUTTONS, so they stay
  `—`, not `D`, and no task below activates them.**
- ★ **Row 24 is the audit's own signal and gets its OWN task: the FILTER has NO sibling suite at all.** No
  existing control filters anything, so **nothing would be noticed missing** — finding 4's *"If no sibling
  suite exists, THAT IS THE SIGNAL."* **3.1 enumerates its property set BEFORE 3.7 writes an assertion**, and
  ★ **3.1 precedes every table-tools test task in this file — all ten of them, 3.2 through 3.11, re-checked
  by number after the split.**

**Human-run items budgeted UP FRONT (plan §5, not discovered late) — enumerated in 6.1's Verify, not
rediscovered there:** whether the toolbar **reads as part of its table or as clutter above it** · the filter
at **one big table vs several small ones** (§8-2's walk half) · the **§8-4 presentation set** · the **badge's
lane** (plan §8 Q3, read from 1.5) · **Firefox everything** · **zero unexpected network with the Network tab
open** · **at least one WIDE viewport recorded like an engine, at BOTH geometry widths (1280 AND 1400)**,
because this milestone ships chrome **inside** the reading column (finding 2). **Plus one human decision
gate:** 5.5 — §8-1's ship/no-ship, §8-2's scope, §8-3's threshold, §8-4's set.

---

## 1 — The identity seam (D-1 · D-2 — the dependency ROOT: nothing badges until the name arrives, and the seam choice is the plan's first architectural finding)

- [x] **1.1 `docIdentity.ts` — the data-only registry, the THIRD instance of the register-once pattern
      (D-1).** Holds a string, **imports nothing**. Register / read / reset, **last-write-wins, no
      unregister**: a stale name is overwritten by the next open, and the app page's `select(null)` path never
      mounts at all. Read at **build time, never captured** — the property `diffRegistry.ts:5-10` states for
      its own siblings (*"must ask THIS module at render time rather than capture a reference that the next
      re-render would strand"*). **Imported by nothing yet.**
      Files: `src/render/docIdentity.ts` · `src/render/docIdentity.test.ts`
      Verify: (**unit**) read-before-register returns undefined; last-write-wins across two registers; reset
      clears. ★ **The module's import list is EMPTY, asserted structurally** — that is the property that makes
      it safe on **both** graphs (`diffRegistry.ts:32-38`'s own argument for itself: *"holds the DATA … and
      imports only a TYPE"*), and it is what keeps it from becoming a fence hazard. **Both bundles md5-identical
      to HEAD** (318,747 B CS / 389,143 B app) because nothing imports it yet — **with the firing control that
      the instrument can see a change**: touch one byte in a reachable module, rebuild, md5 moves, revert. A
      null reading that cannot move is not a measurement. `pnpm lint` EXIT=0 · Golden EMPTY · manifest green
      **2975 B** · `permissions: []` both engines. [D-1; §4 agent-file; plan §1.1]

- [x] **1.2 `agentFile.ts` — the pure predicate, the frozen name set, and basename extraction (D-2).**
      **Exact, CASE-SENSITIVE basename match** against one frozen set — `CLAUDE.md`, `AGENTS.md`, and this
      repository's own convention `spec.md` / `plan.md` / `tasks.md`. Case-sensitive **because a `claude.md` is
      not the file the convention names**, and a case-insensitive match would badge it **wrongly** rather than
      not at all. ★ **Never content sniffing** (§3.4, §4: recognition is determined from the **filename only**).
      Basename comes from `new URL(href).pathname`, **`decodeURIComponent`'d** (D-2's named one-line detail).
      Files: `src/render/agentFile.ts` · `src/render/agentFile.test.ts`
      Verify: (**unit**) every name in the set matches; **the case variants that must NOT match** (`claude.md`,
      `Agents.MD`, `SPEC.MD`) — these are the cases that would silently badge the wrong file, so they are the
      red-first ones; an empty / absent / extensionless name matches nothing; a `file://` path and each raw
      host resolve to the right basename. ★ **The `decodeURIComponent` step is asserted directly**, with a
      fixture whose **basename itself** carries an encoded character — and **if no frozen-set name turns out to
      be reachable ONLY through the decode, that is RECORDED as a finding about D-2's stated reason, not a
      silent removal of the decode.** The predicate reads **no document content** — asserted by passing a name
      with no source in scope at all. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-2; §4 agent-file; §3.4]

- [x] **1.3 `agentBadge.ts` + `mount.ts`'s ONE line + the badge's CSS (D-1 · D-2 · D-12).**
      `buildAgentBadge()` returns **`[]`** when nothing is registered or the name is not recognized — the
      `buildDiffChrome` shape **verbatim** (`diffChrome.ts:175`'s *"THE GATE. Read at BUILD time … it is the
      only condition"*) — and **with NO explanatory note** (D-14: the user was never offered anything, so there
      is nothing to be told they are missing). The badge is a **SIBLING of `.peekover-reader`**, pushed into
      `children[]` (declared `mount.ts:154`, `root` pushed last `:203`, committed `:210`), so the reading
      column stays byte-identical and the golden pin is untouched **by construction**. `mount.ts` gains
      **exactly one line**: `children.push(...buildAgentBadge())` — the **fifth** instance of the pattern
      `buildThemeControl` / `buildWatchChrome` / `buildDiffChrome` / `buildTocView` already establish.
      Files: `src/render/agentBadge.ts` · `src/render/agentBadge.test.ts` · `src/render/mount.ts` ·
      `src/theme/readerCss.ts`
      Verify: (**unit**) `[]` on nothing-registered **and** on an unrecognized name, **and no note node in
      either case**; exactly one element when recognized; the badge is **text**, not colour (§5). ★ **`git diff
      src/render/mount.ts` is EXACTLY ONE added line — asserted as a diff-line count, not eyeballed.** That is
      D-1's checkable property, and it is the whole cost of not threading the name through `MountOptions`.
      `mount()` still **writes nothing, owns nothing and branches on nothing about the app** (006 D-15).
      **CSS:** each token used is **named with its resolution in all three theme blocks**, sepia included; no
      `ch` in `margin`/`padding`/`transform`; **rationale in the TS doc comment above, byte-checked on the
      shipped `READER_CSS` block**. ★ **Content-script bytes move here for the first time in five milestones**:
      state the delta **with its baseline 318,747 B**, decomposed, with the tree-shaking shape of the frozen
      set's initializer accounted. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-1, D-2, D-12; §4 agent-file; §5 CSS discipline]

- [x] **1.4 The TWO registration sites, proven at the PRODUCTION path — and the badge's property set (§3.11
      rows 1, 2, 3, 4, 14, 15, 23).** App page: `registerDocIdentity(file.name)` inside `installWatchForFile`
      (`appShell.ts:838`), beside `registerDiffContext` (`:914`). Content script:
      `registerDocIdentity(basenameOf(location.href))` at `runReader.ts:118-119` — **after the gate, which
      already holds and parses `location.href` for its own purposes, before `mountReader()` runs
      (`mountReader.ts:90`)**. ★ **Registration is NOT gated on `docId != null`**: the diff context is
      (`appShell.ts:912`) because a snapshot needs a folder identity; a badge needs only a basename, which
      `MarkdownFile.name` (`folderSource.ts:34`) always carries. **Naming debt recorded, not tidied:**
      `installWatchForFile` now registers three things and its name describes one — plan §4-4 says **do not
      refactor it**, because the pre-mount ordering it documents is load-bearing.
      Files: `src/app/appShell.ts` · `src/render/runReader.ts` · `src/app/appShell.test.ts` ·
      `tests/browser/agentBadge.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, `describe.each` **both surfaces**, row 23) **Row 4:** the badge is
      asserted **OUTSIDE `.peekover-reader`**, like every sibling pill — **red-first by putting it inside, at
      which point the golden diff stays EMPTY**, which is exactly why the structural assertion exists.
      **Row 2:** an unrecognized name grows **no badge AND no note**. **Row 3 (red-first that the gate is the
      RIGHT property):** **ungate the name check** — the badge must then appear on an **unrecognized** document,
      proving the gate is **the name** and not an accident of the surface. **Row 14:** switch documents; the
      badge built by render N+1 reads the **CURRENT** registry — red against a captured name, whose signature
      is the **previous** document's badge on the new one. **Row 15:** the badge's state is in text.
      ★ **The app-page registration is proven at the PRODUCTION path, never by a hand-registered fixture:**
      `installWatchForFile(file)` runs at `appShell.ts:798`, **before** `await selectFile(file)` at `:799`, and
      `:783-793` records why in terms — registering after the select meant *"the first file opened in a session
      showed no watch control at all"* (005 task 4.7). **The FIRST file opened in a session must carry its
      badge**, which is that exact defect re-run against new chrome. ★ **Red-first on the guard:** move the
      register **under** `:912`'s `docId != null`, open a folder with `activeFolderId` unset, and the badge
      **vanishes** — the silent drop D-1 named. Golden EMPTY · manifest green **2975 B** · `permissions: []` ·
      `mount.ts` diff still exactly one line. [D-1, D-2; §4 agent-file; rows 1, 2, 3, 4, 14, 15, 23]

- [x] **1.5 The badge's PLACEMENT — a real rect probe over the top band (§3.11 rows 5, 7, 8, 10, 11).
      PRODUCES the lane measurement; FORBIDDEN FROM CHOOSING THE LANE (plan §8 Q3).** D-12: **placement is
      re-measured with a real rect probe (005's precedent, `diffChrome.ts:38-129`'s worked elimination), never
      chosen.** Row 7's own wording is that **the lane assignment must be re-measured, not assumed**.
      Files: `tests/browser/agentBadge.browser.test.ts` · `docs/ai/progress.md` (numbers only)
      Verify: (**tests/browser** — Cr+Fx) at **BOTH `GEOMETRY_WIDTHS` — 1280 AND 1400** (`diffChrome.ts:83-91`),
      because **recovery B1's own note says a single wide width let the defect class ship** (finding 2).
      **Row 5:** the badge does not occlude the reading column's **text** at either width. **Row 8:** it clears
      the TOC rail and the mode toggle. **Row 10:** out of flow — the page under it does not move, asserted as
      a **rect equality on the column's first block with and without the badge**. **Row 11:** anchored to the
      lane it claims. **Row 7 — the measurement:** the top band `diffChrome.ts:110-129` splits into lanes, and
      **that block's own rule gives the left lane to the deterministic-width element**; the badge's width is
      one of **five** enumerable strings (`AGENT_FILE_NAMES` is frozen at five — the "~6" this line carried
      until 1.5 was an estimate from plan §8 Q3's aside, corrected against the shipped set), so probe **all of
      them**, at both widths, **with the network indicator and
      the remote-load pill present** (row 7's sibling source: `themeControl:352`, `watchControl:471`). Report
      the **414** reading beside the wide ones, because `diffChrome.ts:77-82` records that at 414 **every**
      candidate already collides — surfaced here rather than discovered at the walk. ★ **PRODUCES numbers; the
      LANE CHOICE is plan §8 Q3 and is taken by the human at 6.1.** Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-12; rows 5, 7, 8, 10, 11; findings 2, 7; plan §8 Q3]

- [x] **1.6 The badge's zero-network guard (§3.11 row 22).** Recognition is a `Set.has` and the badge is a
      text node; the claim is that **neither reaches the network**, and the claim is only worth what its
      control is worth.
      Files: `tests/browser/agentBadgeNetwork.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **no request** across register → recognize → render, using the
      existing **`/^https?:/i` predicate VERBATIM** and `awaitFetchedUrls`'s shape (`remoteMedia:83-92`,
      `:120`, `:140`), **with the control fetch shown LIVE in the SAME test**, under the same conditions the
      negative claim disclaims (finding 1). ★ **jsdom cannot see bytes on the wire — it loads no subresources —
      so this is a real-engine test or it is nothing.** ★ **And the control adopts markup NO sanitizer has
      touched**: a fetch control routed through a sanitizer reads NO-FETCH while the route is wide open (the
      standing lesson, and the Firefox case where an inert parse consumed an `@import`). Neutralize any probe
      markup in an inert `<template>`, never a "detached" div. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` both engines. [row 22; §4 Trust; §5 zero-network; finding 1]

## 2 — The picker widens (D-3 · D-4 · D-5 — the dependency ROOT for compare-two-files; app-page ONLY per §4, and both fences stay green while it grows)

- [x] **2.1 `diffRegistry.ts` — a SECOND, OPTIONAL capability pair (D-3).** `fetchFiles?` / `fetchFileText?`
      added beside the existing four; **the existing four BYTE-UNTOUCHED**. This is the **same move task 6.2
      already made a first time** — `diffRegistry.ts:40-54` records that amendment and its reasoning, and the
      header is cited in-code as the precedent rather than the argument being re-derived. **Optional, not
      required**, so every existing `createDiffContext` call site and every existing test fake stays valid, and
      **a context with snapshots but no folder list is a legal, designed state** (the `AppStore` optional-reader
      discipline, `appShell.ts:150-158`). ★ **A discriminated target type is REJECTED and not re-argued** —
      007 D-4 already ruled on parameterising shipped, tested code to serve a second caller.
      Files: `src/render/diffRegistry.ts` · `src/render/diffRegistry.test.ts`
      Verify: (**unit**) the two new members are optional and absent-by-default; **the four existing member
      declarations and their doc comments are unchanged — asserted as a confined diff, not eyeballed**;
      ★ **every existing fake in `diffRegistry.test.ts` / `diffChrome.test.ts` / `diffChrome.browser.test.ts`
      passes with NO edit — that IS the additive property, and it is checkable as an empty diff on those
      files.** `diffChrome.ts` gains **no import** and the fence is unchanged. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-3; §4 compare; plan §1.2]

- [x] **2.2 `appShell.ts:914` provisions the two closures — on the app-page side of the fence (D-3).**
      `fetchFiles` over `activeSource.files` (`folderSource.ts:70`), **EXCLUDING the current `file.path`** —
      *"another file"*, not *"any file including this one"*, which would offer an **always-empty diff**.
      `fetchFileText(path)` closes over the same list and calls that entry's `read()` (`folderSource.ts:36`) —
      ★ **a FRESH read, not a stored copy**, which is §3.2's stated reason for not reaching through storage.
      Both live inside the `docId != null` block (`:912-935`), in a graph `mount.ts` **never reaches**.
      Files: `src/app/appShell.ts` · `src/app/appShell.test.ts`
      Verify: (**unit**) `fetchFiles` omits the open document — **red-first by including it, whose signature is
      the open file offered as its own comparison target**; `fetchFileText` calls **that entry's** `read()` —
      asserted by **mutating the source between provisioning and the call and observing the NEW text**, which a
      stored copy cannot produce. ★ **Both fences re-proven in this task, not assumed:** `diffEngine.test.ts`'s
      three clauses (`:223-311`) green **with clause B firing as the control**, and 007's traversal **8/8**.
      **No new module crosses the fence and no fence clause changes** — the closures are provisioned over
      material the app page already holds. Golden EMPTY · manifest green **2975 B** · `permissions: []` ·
      content-script bytes **unchanged by this task**, stated. [D-3; §4 compare; plan §1.2, §3-3]

- [x] **2.3 ONE `role="listbox"`, TWO `role="group"`s — and the single-kind picker is what 006 ships (D-4).**
      Each group carries its own `aria-label` (*snapshots of this document* / *other files in this folder*);
      the picker's own label (`diffChrome.ts:204`, today *"Snapshots to compare against"*) widens to cover
      both. Rows stay `<button role="option">` — `:264-283`'s deliberate choice, kept for its stated reason
      (*"keyboard-operable (Enter/Space) for free … it lands in the tab order natively"*). The discriminant is
      **`item.dataset.targetKind` beside today's `item.dataset.snapshotId`** (`:270`) — **on the ROW, because
      that is the only place that needs it**. A snapshot row is **unchanged**, absolute stamp and size included
      (mockup divergence 2 at `:184-190` stands).
      Files: `src/render/diffChrome.ts` · `src/render/diffChrome.test.ts` ·
      `tests/browser/diffChrome.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, app page) both kinds → one listbox containing **two groups**, each
      labelled; `role="group"` is a **legal owned child of `role="listbox"`** and no dialog, menu or second
      pill appears (§3.2 rejected a second control). ★ **When only ONE kind has entries the groups are NOT
      rendered at all and the picker is STRUCTURALLY what 006 ships today** — asserted as a **DOM-shape
      equality against the snapshot-only path**, so the existing browser assertions cannot pass by
      transcription drift; **red-first by always rendering the groups, at which point the snapshot-only shape
      assertion reds naming the extra group node.** A file row **names the file and says it is a file, in
      text**. Golden EMPTY · manifest green **2975 B** · `permissions: []`. [D-4; §4 compare; §5 a11y]

- [x] **2.4 Every empty state lands in the EXISTING status line — never a fake option row (D-4).**
      `.peekover-diff-status` (`:193-198`) is already a `role="status"` polite region rendered beside the
      untouched reader. **No other markdown file in the folder** → snapshots listed, the status line **says so**
      (§4 requires the system *say so* rather than offer an empty list). **No snapshots** → files listed, status
      says so. **Both empty** → `closePicker()` + `say(…)`, which is **exactly today's shipped behaviour**
      (`:292-298`), **preserved unchanged** for the surface that has no folder list.
      ★ **WIDENED AT IMPLEMENTATION (Option 1, human ruling 2026-08-04) — full record in `decisions.md`.**
      The two half-empty states require the picker and the status to be open AT ONCE, but `readerCss.ts`
      parks them in ONE slot (`:429-430` base, `:996-997` CONTAINED) and says so at `:421-428`. Measured on
      the real surface, both engines, by hit-test: the status painted **OVER** the list
      (`elementFromPoint` at a row returned `peekover-diff-status`). So the Files list below is widened to
      four: `readerCss.ts` gains a **CSS-only lane** for the status **while the picker is open**, derived
      from the picker's own `max-height` token (`:403`) rather than tuned; and `diffChrome.test.ts:463`'s
      *"mutually exclusive on every path"* invariant is **RE-SCOPED, not deleted** — its old fake had no
      `fetchFiles` member, so it could never reach a half-empty path and would have stayed green over the
      overlap. (Body citation `:651` re-derived to `:661` at HEAD `b0773c9`.)
      Files: `src/render/diffChrome.ts` · `src/theme/readerCss.ts` · `src/render/diffChrome.test.ts` ·
      `tests/browser/diffChrome.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) all four states asserted; the both-empty branch's behaviour is
      **unchanged**, asserted against today's shipped path rather than re-implemented. **No state renders a
      disabled or placeholder option row.** The status line keeps `diffChrome.browser.test.ts:651`'s **"out of
      the a11y tree while empty"** property — **re-asserted here, not assumed to survive** (that is the class
      of assertion M6 lost in transcription). ★ **Added by the amendment:** the lane proven **NO-OVERLAP by
      HIT-TEST at 1280 AND 1400 on both engines**, **red-first against the shared-slot version** (remove the
      lane → the hit-test at a row returns `p.peekover-diff-status`); the re-scoped invariant **non-vacuous**
      — its fake **has** `fetchFiles` and reaches the half-empty branch. Content-script bytes **MOVE** (§4
      risk 2), decomposed to a **zero residual**. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-4; §4 compare; §3.8 degradation]

- [x] **2.5 `compareWith` branches ONCE; the caption names both sides (D-5).** `compareWith` (`:242`) branches
      on `target.kind`: snapshot → `fetchText(id)`, file → `fetchFileText(path)`; `after` =
      `getCurrentSource()`; `showDiff(host, before, after)` **over the fence, unchanged**. §4's *"shall name
      both sides … in text"*: on a successful **file-vs-file** diff the status line becomes the **caption**
      instead of today's `say(null)` (`:258`); on exit `showCompare()`'s path clears it (`:313-316`).
      ★ **SNAPSHOT diffs keep today's behaviour VERBATIM — the spec's floor, and gate-2 RULING Q1 ("NO —
      leave snapshot diffs verbatim"): the caption is set on the FILE branch only, byte-for-byte preserved
      on the snapshot branch.**
      Files: `src/render/diffChrome.ts` · `tests/browser/diffChrome.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, app page) the caption **names both sides in text**, so direction is
      never inferred from position or colour (§4, §5). §4's remaining compare criteria, each asserted:
      **leaving a file-vs-file comparison restores the document and the reading place exactly as leaving a
      snapshot one does** — an attribute flip over an **untouched** column (006 D-15), never a re-mount;
      **switching documents does not carry a comparison across** — red-first by leaving the diff active across
      a select, whose signature is the new document rendering inside a stale diff. **§3.8:** an **unreadable**
      other file **says so beside the UNTOUCHED document and does NOT enter the diff** — revert-and-fail
      against a build that enters first and fails inside, whose signature is a blanked column behind an error.
      ★ **§4's content-script clause:** **no file comparison is present on the content-script reader** —
      asserted as an **absence with the app page as the control that fires in the same run**, because an
      absence nothing could have produced discriminates nothing. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-5; §4 compare; §3.8; gate-2 ruling Q1]

## 3 — Table tools, app page (D-6 sites 1–2 · D-7 · D-8 · D-9 · D-12 — and the audit's consumer: 3.1 precedes every test task here)

- [x] **3.1 ★ CONSUME §3.11 AND ENUMERATE THE FILTER'S PROPERTY SET (row 24). NO IMPLEMENTATION, NO
      ASSERTION — and NO TABLE-TOOLS TEST EXISTS BEFORE IT.** The audit's toolbar column is read and its
      routing (above) confirmed against the tree. ★ **Row 24 is the reason this is a task and not a note: the
      FILTER has NO sibling suite at all.** No existing control filters anything, so there is **nothing to
      transcribe from and nothing would be noticed missing** — finding 4's *"If no sibling suite exists, THAT
      IS THE SIGNAL."* Rows 12, 15, 17 and 20 are where it **lands**; everything else it needs is **enumerated
      fresh**. **M8 establishes this baseline.**
      Files: `tests/browser/tableFilter.browser.test.ts` (**its header block IS the enumerated set, written
      before its first assertion exists**) + the task report
      Verify: the routing table is read and **each row's landing task named**; **row 24's property set is
      written down BEFORE any filter assertion exists**, each property carrying either its sibling source or an
      explicit *"no baseline — enumerated here"*. ★ **A table-tools test written before this task is the
      finding-4 failure the plan's one hard sequencing constraint exists to prevent**, and **3.2 through 3.11
      are blocked on it — re-checked by number after the gate-2 split, which added 3.3, 3.4 and 3.5 BELOW
      this task and moved none of them above it.** **This task writes no `src/` code and asserts nothing.** Golden EMPTY · both bundles
      **md5-identical to 1.6's** (a test-file header ships nothing) · manifest green **2975 B** ·
      `permissions: []`. [§3.11 row 24; finding 4; plan §6's hard constraint]

*★ **3.2–3.5 are the gate-2 SPLIT of what the draft carried as one task** (scope instruction 1): the module,
its CSS, its call sites and its containment measurement land as four reviewable — and four separately
revertable — units. **None of them precedes 3.1.***

- [x] **3.2 `tableEnhancer.ts` — the module ALONE: TOTAL, SCOPED, IDEMPOTENT, HEADER-GATED, and the toolbar
      host as a PRECEDING SIBLING. NO CALL SITE LANDS HERE (D-7 · D-8 · D-12).** Query `.peekover-reader` and
      iterate **its** `<table>`s. ★ **The scoping is REQUIRED, not defensive:** `renderHunk`
      (`diffView.ts:119-128`) runs `sanitize(parse(hunk.lines))`, so a spec-v1-vs-spec-v2 comparison — **the
      product's own example** — contains **real `<table>`s** a `shadow.querySelectorAll('table')` would have
      enhanced; both alternate views are **siblings** of the column (`diffView.ts:148-159`,
      `readerMode.ts:66-74`), so the scope **excludes them by construction**, with no entry-condition branch
      to get wrong. **Total (D-7):** `mountReader`'s catch (`mountReader.ts:106-114`) responds to a throw by
      **removing the host**, so a throw out of an enhancement would tear down a reader that had **already
      rendered the document correctly** — per-table try/catch plus a **total outer boundary**. ★ **The
      mockup's `.tablewrap` does not exist in our DOM** — markdown-it emits a **bare `<table>`** and
      `readerCss.ts:169-179` puts the border, radius and `overflow:hidden` on the table itself — so the
      toolbar host is inserted as a **PRECEDING SIBLING**, no wrapper element, no move of the table. **The
      toolbar is empty at this task**; sort, filter and copy fill it at 3.6–3.8.
      Files: `src/render/tableEnhancer.ts` · `src/render/tableEnhancer.test.ts`
      Verify: (**unit**) the entry condition — **no `<thead>` with `<th>` ⇒ untouched** (§4), and ★ **a REAL
      condition, not a formality: `sanitize.ts:36` allows `table/thead/tbody/tr/th/td`, so a hand-written HTML
      `<table>` with no `<thead>` reaches the column from source** (plan §0.2). The state attribute prevents
      double enhancement (the `DIAGRAM_STATE_ATTR` precedent, `diagramView.ts:30` → `diagramEnhancer.ts:684`)
      — asserted by enhancing twice and counting **one** toolbar. ★ **D-7's UNIT half:** a throwing
      enhancement **does not propagate out of `enhanceTables`** — red against removing the outer boundary,
      whose signature at this level is the throw escaping the call. **Per-table:** one malformed table fails
      and **every other table on the page is enhanced normally** (§4) — red against a single outer try,
      naming the count of un-enhanced tables. ★ **D-7's TEARDOWN signature — a reader torn down on a document
      that had ALREADY rendered correctly — is reachable only where the call site sits inside `mountReader`'s
      catch, which is the CONTENT-SCRIPT site: it is proven at 4.1 and is NOT claimed here.** ★ **D-8's unit
      half:** on a DOM carrying a sibling diff host, the walk reaches the column's tables and **not the
      sibling's** — the real-engine half (a live diff round trip, the raw view) is **3.9's**. **The toolbar
      host is a PRECEDING SIBLING:** no wrapper element exists in the tree afterwards and the `<table>`'s
      **node identity and position are unchanged** — asserted on node identity, because a wrap-and-restore
      passes a shape assertion and fails this one. ★ **Both bundles md5-identical to 3.1's** (318,747 B CS /
      389,143 B app) **because nothing imports this module yet** — with the firing control that the instrument
      can see a change: touch one byte in a reachable module, rebuild, md5 moves, revert. A null reading that
      cannot move is not a measurement. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-7, D-8, D-12; §4 table tools; plan §0.2]

- [x] **3.3 The toolbar's CSS, D-12's token verification against ALL THREE theme blocks, and the FIRST
      table-tools content-script byte statement (D-12 · §5).** The styling lands in `readerCss.ts`, which is
      on **BOTH** graphs — **so this task moves content-script bytes before any call site exists**, and that
      separation is the point: the presentation is revertable without touching the logic. Rationale lives in
      the **TypeScript doc comment ABOVE** the template literal (finding 9 — the minifier cannot strip what is
      inside the backticks; the failure `diffChrome.ts:40-44` records cost ~8 KB once).
      Files: `src/theme/readerCss.ts` · `src/theme/reader.test.ts`
      Verify: (**unit**) ★ **every token used is NAMED WITH ITS RESOLUTION IN ALL THREE THEME BLOCKS** —
      `:host` light (`readerCss.ts:31-40`), dark (`:43-48`), sepia (`:51`) — and ★ **sepia overrides ONLY
      `--paper`, `--ink`, `--accent`, `--accent-soft`, so `--panel` / `--line` / `--muted` / `--faint`
      resolve to the LIGHT values on sepia paper**; **never substitute a nearby token silently**, and a token
      whose sepia resolution is wrong for the surface is a **finding stated**, not a swap made. **No `ch` in
      `margin` / `padding` / `transform`** (finding 6 — the memory of record prices one at ~28 ms);
      `max-width` is free. ★ **The rationale is OUT of the literal — asserted as a BYTE CHECK on the shipped
      `READER_CSS` block**, not as a reminder (the mechanism, per finding 9's own conclusion that a preamble
      is not a mechanism). **The toolbar declares NO `max-width` of its own** — it **inherits**
      `--reader-measure` (**748px**, `readerCss.ts:83`, consumed `:85`); that is **declared here and ASSERTED
      as a computed style at 3.5** (row 6), because a resolved value is jsdom-**BLIND**. ★ **Content-script
      bytes move — the first table-tools delta:** state it **with its baseline 318,747 B** and both md5s (Cr
      `c7b33b36b1a727fdacb77eefe64083e1` / Fx `67717921bdf646c7366176392d0c37d7`), **decomposed to CSS alone**
      — this task's is the only contributor in flight, so its **ABLATION is exact**: remove the block,
      rebuild, `wc -c` and md5 move **by the amount claimed**. ★ **Never by an identifier grep** (M6's
      retraction: a grep over a minified bundle returns 0 whether or not the code shipped). The app chunk
      moves too and is stated against **389,143 B**. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-12; §5 CSS discipline; findings 6, 9]

- [x] **3.4 App-page call sites 1 AND 2, the rename D-6 forces, and the toolbar's STRUCTURAL rows
      (rows 1, 2, 3, 4 INVERTS, 23 · D-6 sites 1–2 · D-8).** Site 1: `readerPane.ts:185`, after the committed
      `mount`, beside `enhanceDiagrams(host)`. Site 2: `appShell.ts:137-140`'s `renderWithDiagrams` —
      **whose name stops being true and is renamed with it** (D-6). ★ **Sites 3–4 are the CONTENT SCRIPT's
      and are group 4's — not touched here**, and the difference between the two sets **is** the import fence
      (D-6, confirmed at gate 2).
      Files: `src/app/readerPane.ts` · `src/app/appShell.ts` · `src/app/appShell.test.ts` ·
      `tests/browser/tableTools.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, **both app-page call sites**, rows 1 + 23) ★ **Row 4 INVERTS: the
      toolbar is asserted INSIDE `.peekover-reader`, immediately before its `<table>`** — four sibling suites
      assert the opposite direction and **transcribing row 4 unexamined produces a WRONG test**; **verified
      red by placing it outside, at which point the golden diff stays EMPTY**, which is precisely why this
      structural assertion exists. **Row 3 red-first:** ungate the header-row condition — a **headerless**
      table must then grow a sort control, proving the gate is **the header**. **Row 2:** a table-free
      document grows **no toolbar and no listener**. ★ **BOTH sites asserted, never one:** a document rendered
      through `readerPane.ts:185` **and** one re-rendered through `renderWithDiagrams` each carry the toolbar
      — **red against wiring only the first**, whose signature is a toolbar that **disappears on the app
      page's own re-render** (007 D-12's bug class, one surface over, and the reason 4.1 lands its two sites
      together). **The rename is CONFINED:** `git diff src/app/appShell.ts` shows the call-site edit and the
      rename and **nothing else**, asserted as a confined diff rather than eyeballed. **Content-script bytes
      UNCHANGED by this task** — stated with baseline **318,747 B** and both md5s; the **app chunk** moves and
      is stated against **389,143 B**. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-6 sites 1–2, D-8; §4 table tools; rows 1, 2, 3, 4, 23]

- [x] **3.5 CONTAINMENT — a real rect probe at BOTH geometry widths (rows 5 INVERTS, 6, 8 · D-12).
      Row 5 is the second INVERTED row and it is measured, never chosen.**
      Files: `tests/browser/tablePlacement.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, app page) at **BOTH `GEOMETRY_WIDTHS` — 1280 AND 1400**
      (`diffChrome.ts:83-91`), because **recovery B1's own note is that a single wide width let the defect
      class ship** (finding 2) and this milestone ships chrome **INSIDE** the reading column. ★ **Row 5
      INVERTS to CONTAINMENT:** the toolbar stays **within** the column's box and does **not push the first
      content block off-measure** — asserted as a **rect containment** plus a **rect equality on the column's
      first content block with and without the toolbar**; **red-first by letting it overflow the measure**,
      whose signature is a first block that has moved. **Row 6:** the toolbar's **RESOLVED** `max-width`
      equals `--reader-measure` (**748px**) — a computed style, **jsdom-blind**, which is why it is asserted
      here and only declared at 3.3. **Row 8 via row 5:** the toolbar clears the chrome the column already
      carries at both widths. ★ **D-12: placement is RE-MEASURED with a real rect probe** (005's precedent,
      `diffChrome.ts:38-129`'s worked elimination), **never chosen**. ★ **Whether the toolbar READS as part of
      its table or as clutter above it is a WALK judgement and is 6.1's** — this task measures and does not
      judge. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-12; §4 table tools; rows 5, 6, 8; finding 2]

- [x] **3.6 Sort — three-state, stable, numeric-aware, and its state in `aria-sort` PLUS text (§3.6 · D-12).**
      Reorders `<tr>` nodes **in `<tbody>`**; **off restores document order, which is available because the
      rows were MOVED, never rebuilt**.
      Files: `src/render/tableTools.ts` · `src/render/tableTools.test.ts` ·
      `tests/browser/tableTools.browser.test.ts`
      Verify: (**unit**) the three-state cycle asc → desc → off; **numeric-aware on displayed cell text**;
      ★ **stable on equal keys** — §4 requires rows equal on the sorted column to **preserve document order** —
      **red against a non-stable comparator**, with a fixture whose equal-key rows are adjacent in a
      distinguishable order (an unstable sort on distinct keys looks identical, so the fixture is the
      instrument); **off restores document order exactly**. (**tests/browser** — Cr+Fx) **Row 16:** a **real
      `<button>` inside the `<th>`**, keyboard-operable, **no `tabindex` of its own** — **D-12 divergence 1**:
      the mockup's `<th onclick=…>` (`mockup.html:565-580`) loses keyboard reach, and
      `watchControl.browser.test.ts:339` / `themeControl.browser.test.ts:250` pin the shipped shape. **Row 15:**
      **`aria-sort` on the `<th>` PLUS text** — **D-12 divergence 2**, because §5 forbids state carried by an
      icon alone; **red-first by dropping the text and leaving the `▲` glyph**. **Row 17:** the accessible name
      carries **selection AND action** (*"Sort by \<column\>, ascending"*) and **moves with the state**, never
      position alone. **Row 18:** the direction glyph is hidden from AT. **Row 19 (only if a transition
      ships):** instant under `prefers-reduced-motion` **AND it DOES animate without it** — the second half is
      what makes the first non-vacuous. ★ **Row 11 — a TWO-table document: table 2's controls act on table 2**
      (the `diagramLightbox:354,429` multi-instance shape, **where 007 found this defect class**) — red against
      a `querySelector`-scoped handler that reaches the first table. **§4: no new global single-key shortcut**,
      asserted. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§3.6, D-12; §4 table tools; rows 11, 15, 16, 17, 18, 19]

- [x] **3.7 Filter — `hidden`, never removal; the count announced politely; the clear is exact (row 24's
      set lands here).** Sets `hidden` on non-matching `<tr>`s and **never removes them**, so clearing is
      **exact rather than a re-render** (§3.6).
      Files: `src/render/tableTools.ts` · `src/render/tableTools.test.ts` ·
      `tests/browser/tableFilter.browser.test.ts`
      Verify: (**unit**) the predicate and its count; rows are hidden, **not detached** — asserted on node
      identity, because a rebuild-and-restore passes a text assertion and fails this one. (**tests/browser** —
      Cr+Fx) §4: **only matching rows shown**, and the system **says how many are shown out of how many**.
      **Row 20:** the count is a **polite live region, OUT of the a11y tree while empty**
      (`diffChrome.browser.test.ts:651`'s property, re-asserted). ★ **Row 12:** clearing restores **EVERY** row
      **and the table's height returns to where it started** — asserted as a **rect equality against the
      pre-filter measurement**, red against a clear that leaves one row hidden. §4: a filter matching **no**
      row shows a **designed empty state within the table** and **never an empty table with no explanation**.
      **Rows 15, 16:** the clear control is a real button and its state is text. ★ **Row 24: this suite IS the
      baseline** — 3.1's enumeration is checked off property by property in this task's report, and any
      property enumerated but not asserted is **named**, not dropped. **§8-2's per-table-vs-per-document
      question is NOT decided here**: the filter ships **per-table** (§3.6); the scope question is **measured at
      5.2 and chosen at 5.5**. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§3.6; §4 table tools; rows 12, 15, 16, 20, 24]

- [x] **3.8 Copy-out — CSV and Markdown, from the rows CURRENTLY SHOWN (D-10 · §3.6).** Reads `textContent`
      from the rows **currently shown, in the order currently shown** (§4). ★ **Nothing re-enters the
      sanitizer; every new node is built as DOM, never as an HTML string** (§5, AGENTS.md #3). **Two buttons**
      — ★ **gate-2 RULING Q2: TWO BUTTONS, no menu**, which activates **NO** §3.11 overlay row: **rows 9 and
      21 stay `—`, not `D`**, and this task builds **no popup, no menu and no focus trap**.
      Files: `src/render/tableTools.ts` · `src/render/tableTools.test.ts` ·
      `tests/browser/tableCopy.browser.test.ts`
      Verify: (**unit**) CSV and Markdown serialization from a given visible-row set, ★ **including a cell
      containing a comma, a quote and a pipe** — the three characters that break the two formats, and the
      reason the serializer is a unit rather than a glance. **Rows currently shown, in the order currently
      shown** — **red against a serializer reading the DOM's document order**, whose signature is a **hidden
      row in the output** or a **pre-sort ordering**. (**tests/browser** — Cr+Fx) the copy **confirms that it
      copied** (§4). ★ **D-10: `navigator.clipboard.writeText` at `permissions: []`** — MDN is explicit that
      the permission **REMOVES** a transient-activation requirement **every copy already satisfies by
      construction** (each is triggered by an explicit click), and **the harder case already ships at
      `permissions: []`**: `diagramView.ts:306-315` calls `navigator.clipboard.write` with a `ClipboardItem`.
      **`permissions: []` re-proven on both built manifests in this task, not inherited.** **§3.8:** an
      unavailable clipboard degrades to a **stated failure beside a still-readable table, never a broken
      button** — revert-and-fail against a build whose button silently does nothing. ★ **D-10's `file://`
      residual is NOT proven here — it is 4.2's**, because it needs the content-script surface. Golden EMPTY ·
      manifest green **2975 B** · `permissions: []` both engines.
      [D-10, §3.6; §4 table tools + Trust; §3.8; row 16; gate-2 ruling Q2]

- [x] **3.9 D-8's exclusions and D-9's per-render degradation — the two properties `replaceChildren` makes
      true, asserted rather than assumed (rows 13, 14).**
      Files: `tests/browser/tableScope.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) ★ **D-8:** a **diff whose hunks contain a complete markdown table**
      grows **NO** sort affordance — **red-first by widening the query to the shadow root, at which point the
      diff's tables grow controls**; that red **is** the reason the scoping is required rather than defensive.
      The **raw view** (`.peekover-raw`, `readerMode.ts:66-74`) likewise grows none. ★ **A diff round trip
      leaves the column's own table STILL SORTED with its filter still applied** — entering and leaving a diff
      **never re-mounts** (006 D-15, an attribute flip over an untouched column), so **nothing has to be
      restored because nothing was destroyed**; asserted as a positive, because it is a testable consequence
      rather than a hope. ★ **D-9 revert-and-fail (row 13's inverse — state deliberately does NOT survive):**
      sort a table, drive a **watch re-render that CHANGES the source**, then assert **document order AND
      new-source row text** — **red against a build that carries the sort state across and re-applies it, with
      the defect's own signature in its own units: a row whose text is from the OLD source sitting in the NEW
      table.** `mount()` builds a fresh `root` (`mount.ts:140-142`) and commits with
      `shadow.replaceChildren(...children)` (`:210`), and `preserveReading` carries **only** the scroll anchor
      and the view mode (`:208, :215, :228`) — never table state. **Row 14:** the toolbar is rebuilt every
      mount and its handlers reach the **CURRENT** table, not the destroyed one — red against a captured
      element reference, whose signature is a click that mutates nothing. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-8, D-9; §7-4, §7-8; rows 13, 14]

- [x] **3.10 D-11 (ii) — the THREE-ARM conditionality guard, app page. This is the app page's ONLY cost
      evidence.** §5's *"a document with no table and no recognized name shall pay nothing measurable"*, in the
      structural form the repo can actually check.
      Files: `tests/browser/tableCost.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **three arms in ONE run**: (1) `mount()` alone, no enhancement — the
      floor; (2) `mount()` + M8's enhancements on a document with **no table and an unrecognized name**;
      (3) `mount()` + M8's enhancements on a document with **a table and the name `CLAUDE.md`**. Assert
      **(1) == (2)** on two counters — **total shadow-root node count**, and **`addEventListener` calls recorded
      by instrumenting `EventTarget.prototype.addEventListener` for the duration of each arm** — and
      **(3) > (2)** on both. ★ **The equality is the property; the inequality is the POSITIVE CONTROL THAT
      FIRES** (finding 1) — without arm 3 the equality proves nothing, because **a counter that never moves
      reads equal whether or not the code ran**. Also assert **no element carrying any M8 class exists anywhere
      in arm 2's shadow root**. Plus **D-11 (i)'s negative half, which is directly assertable**: the enhancer's
      synchronous prologue calls **neither `parse` nor `sanitize`** and touches **no `getBoundingClientRect` /
      `offsetWidth` / `getComputedStyle`** — spies, **each with a control proving the spy would have recorded a
      call**. That is what *"cheap"* MEANS here, and it is a test rather than a claim. ★ **Stated as the
      strictly weaker thing it is: the app page has NO first-paint instrument at all** (D-11 (iii)) — this
      guard **stands in for a number and is never reported as "within budget."** Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-11 (i), (ii); §5 conditional cost; finding 1; row 2]

- [x] **3.11 Zero-network across sort → filter → copy (§3.11 row 22).**
      Files: `tests/browser/tableNetwork.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **no request** across **sort → filter → copy**, at the **request
      level**, using the existing **`/^https?:/i` predicate VERBATIM** and `awaitFetchedUrls`'s shape
      (`remoteMedia:83-92`, `:120`, `:140`), **with the control fetch shown LIVE in the SAME test**, under the
      same conditions the negative claim disclaims (finding 1). ★ **jsdom cannot see bytes on the wire — a
      DOM-shape test would report NO-FETCH on a wide-open route** — so this is a real-engine test or it is
      nothing. ★ **The control adopts markup NO sanitizer has touched**, because a control routed through a
      sanitizer reads NO-FETCH while the route is open (and on Firefox an **inert parse consumed an
      `@import`**). Any probe markup is neutralized in an **inert `<template>`**, never a "detached" div.
      §4 Trust: **no network request for any part of file comparison, agent-file recognition, or any table
      action**, proven non-vacuously on **both** engines. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [row 22; §4 Trust; §5 zero-network; finding 1]

## 4 — The content-script reach, behind its own gate (D-6 sites 3–4 — built so §8-1 can rule on it; the ruling is 5.5's, never a quiet re-scope, and if it rules the reach OUT then **5.7** removes this group's two sites and re-measures to a restored baseline)

- [x] **4.1 Sites 3 AND 4 land TOGETHER — a surface that enhances on first mount and not on re-render is a
      SHIPPED DEFECT, not a partial feature (D-6).** Site 3: `mountReader.ts:90` gains `enhanceTables(host)`
      after the committed `mount`. ★ **Site 4 is the one that would be missed:** `contentWatch.ts:121` passes
      **no `render` at all** today — verified at HEAD as
      `registerWatchTarget(createWatchController({ detector, contained: false, docId: null }))` — and **must
      gain a `render` closure**, or table tools **vanish the first time a watching agent rewrites the file**,
      which is **the identical failure 007 D-12 caught on the app page**. ★ **NO shared enhancement seam and NO
      enhancer registry (D-6):** a shared `enhance(host)` would put `diagramEnhancer` — and mermaid's dynamic
      edge behind it — **on the content-script graph and take the 8/8 fence RED**; a **registry** would be
      **worse**, keeping the fence green by converting a static property the traversal can see into a
      **runtime registration it cannot** (M6 finding 1's shape exactly). So the content script's sites call
      `enhanceTables` and **nothing else**, and `readerPane.ts:184`'s *"identical body by construction"* comment
      becomes **deliberately false across surfaces** — that asymmetry **IS** the fence expressed in imports.
      Files: `src/render/mountReader.ts` · `src/watch/contentWatch.ts` ·
      `tests/browser/tableTools.browser.test.ts`
      Verify: **both sites in ONE commit** — asserted as a diff touching both files (plan §6's hard
      constraint). (**tests/browser** — Cr+Fx, `describe.each` **both surfaces**, rows 1 + 23) the toolbar
      appears on the content-script reader **on first mount** AND **survives a watch re-render**;
      ★ **revert-and-fail: drop site 4 and the re-render arm reds naming the missing toolbar on a document that
      still has its table.** ★ **D-7's TEARDOWN revert-and-fail, which ONLY this surface can run** (routed
      here by the gate-2 split — 3.2 proved the boundary's unit property and explicitly did not claim this
      one): site 3 sits inside `mountReader`'s `catch` (`mountReader.ts:106-114`), which responds to a throw
      by **removing the host**, so **remove `enhanceTables`'s outer boundary, throw inside it, and the reader
      is TORN DOWN on a document that had ALREADY rendered correctly** — the defect's own signature, in its
      own units: the host gone and the browser's raw rendering restored. That consequence is what D-7 was
      written for and it is reachable at **no other call site**. ★ **007's static import fence stays 8/8** — clause A asserts the content-script
      graph reaches **neither `diagramEnhancer` nor `diagramEngine`** (`:275-297`) and clause B is the
      **control that fires** (`:299-316`) — **and `tableEnhancer.ts` is proven not to reach either**, in that
      same traversal. **`diff` still off the content-script graph** (`diffEngine.test.ts` `:223-311`). Bytes
      move: state the delta with its baseline, **decomposed** (4.3 owns the full accounting). Golden EMPTY ·
      manifest green **2975 B** · `permissions: []` both engines. [D-6; §3.7; §4 table tools; rows 1, 23]

- [x] **4.2 The content-script cost guard, and D-10's `file://` residual proven EMPIRICALLY (D-11 (ii) ·
      D-10).**
      Files: `tests/browser/tableCost.browser.test.ts` · `tests/browser/tableCopy.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **the three-arm conditionality guard on the CONTENT SCRIPT**, same
      shape as 3.10: **(1) == (2)** on node and listener counts, **(3) > (2)** as the **control that fires**, and
      **no element carrying an M8 class anywhere in arm 2's shadow root**. ★ **D-10's ONE RESIDUAL, named in
      the plan rather than assumed, and proven rather than argued:** the content-script surface runs in **the
      PAGE's context**, and one of its two document classes is **`file://`**, whose secure-context status **MDN
      itself hedges** — *"The same is generally true for `file://` URLs"* — and **"generally" is not a
      contract**. So clipboard availability is measured **on BOTH engines and on BOTH content-script document
      classes: `file://` AND an allowlisted raw host** (the `https://` hosts are unambiguous; the `file://`
      arm is the one that can surprise). **Where it is unavailable, §3.8's degradation holds: a stated failure
      beside a still-readable table, never a broken button** — and **a doc read is not a build**, so a green
      here is a measurement, not a citation. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-10, D-11 (ii); §3.8; §4 Trust; row 2]

- [ ] **4.3 THE CONTENT-SCRIPT BYTE DELTA, DECOMPOSED TO A ZERO RESIDUAL (§5 · §8-1 (a)). PRODUCES NUMBERS;
      FORBIDDEN FROM CHOOSING VALUES.** ★ **The content-script bundle stops being byte-identical for the first
      time in five milestones, by DECISION (§3.7/§5) — so every byte must be assigned.**
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: bundle vs **318,747 B**, both engines, against md5 Cr `c7b33b36b1a727fdacb77eefe64083e1` / Fx
      `67717921bdf646c7366176392d0c37d7` (9.3, `94f7da5`). The delta is **decomposed to a ZERO residual** —
      **table-tools code · badge code · glue · CSS** — and the decomposition **sums to the observed delta
      EXACTLY, with the residual NAMED rather than rounded away**. ★ **Proven by ABLATION with a control that
      FIRES** — remove one contributor, rebuild, md5 and `wc -c` move by the amount claimed for it; a null
      reading with no firing arm discriminates nothing. ★ **NEVER by an identifier grep: the memory of record
      is explicit that a grep over a minified bundle returns 0 whether or not the code shipped** (M6 finding
      1's retraction). ★ **And check the tree-shaking shape while the ablation is standing: an unused export
      whose initializer SPREADS an array is retained** (+896 B onto a 0-delta fence, once) — the frozen name
      set and any table-tools constant table are inspected for it, and `/*#__PURE__*/ ARR.slice()` is the
      known-dropping form. **An unaccounted byte is a DEFECT, not a cost — and it is a STOP-and-flag, not a
      note.** Fences re-proven in the same run: `diff` off the content-script graph (three clauses, clause B
      firing); 007's traversal **8/8**; `permissions: []` on both built manifests; `web_accessible_resources`
      absent; `tests/manifest.test.ts` green and **2975 B**. **PRODUCES numbers; the ship/no-ship ruling is
      5.5's.** Golden EMPTY. [§5 content-script NFR; §8-1 (a); finding 1]

## 5 — Measure → decide → implement (the measuring tasks CANNOT choose; the deciding task is a human gate)

- [ ] **5.1 §8-1 (b) + (c) — the content-script first-paint price. PRODUCES NUMBERS; FORBIDDEN FROM CHOOSING
      VALUES.** First paint on the **gated 50.4 KB fixture**, and **on a document with NO table and NO
      recognized name** — the case §5 requires to be **free**.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: **A-B-A against a same-session HEAD control, FLOOR reported beside MEDIAN** (finding 7), on a
      **quiesced machine**, under 8.1's own protocol. ★ **Priced against the STANDING worst-arm headroom —
      26.9 ms median / 29.9 ms floor — which is an INPUT and is NOT re-measured** (established 2026-08-03 at
      `757f953`; § Baselines, *THE 2026-08-03 FIRST-PAINT RE-MEASUREMENT*). ★ **State the A-vs-A agreement
      explicitly: A disagreeing with A means nothing measured here means anything** — 8.1's own **negative**
      verdict (13.4 ms floor disagreement, larger than any delta it was asked to adjudicate) is the precedent
      that makes this line mandatory rather than decorative. **(c) is reported BESIDE 3.10 / 4.2's structural
      conditionality result** — the timed delta and the structural equality are **two instruments on one
      claim** and neither substitutes for the other. **Carried unfixed, restated so it is not read as a
      breach:** `scripts/perf-first-paint.ts` prints a **false `FAIL`** on the 1 MB fixture. ★ **PRODUCES
      numbers; forbidden from choosing values.** The rule is already set and the value is not: **if the gate
      cannot hold, the surface REACH gives way, not the gate** — and that ruling is **5.5's**. Golden EMPTY ·
      manifest green **2975 B** · `permissions: []`. [§8-1 (b), (c); §5 first paint; findings 7, 8]

- [ ] **5.2 §8-2 — how documents actually USE tables. PRODUCES NUMBERS; FORBIDDEN FROM CHOOSING VALUES.**
      Outputs: the **distribution of tables per document** across **this repository's own markdown AND the
      golden fixtures** — how many documents have one table, how many several, how many none.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: the distribution stated with its **n**, and ★ **the corpus's BIAS stated WITH the number** (plan
      §4-7): this repository is a **biased sample** for a tool whose users are **AI agents writing arbitrary
      markdown**, and a number reported without that sentence overstates what it knows. **The judgement half —
      whether a filter per table reads as noise at several small tables — is 006's *reads-as-noise* shape and
      is a WALK** (6.1). ★ **No verdict is reached here and §3.6's per-table decision is not altered by this
      task.** Red-first does not apply (asserts no behaviour). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [§8-2; plan §4-7]

- [ ] **5.3 §8-3 — the threshold below which a table grows no tools. PRODUCES NUMBERS; FORBIDDEN FROM
      CHOOSING VALUES.** A two-row table with a sort control on every column is **chrome outweighing content**.
      **Axes (settled, not reopened): row count · column count · whether any column is numeric.**
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: the distribution across **the same corpus, with the same bias stated**, per axis. ★ **An
      always-on answer is LEGITIMATE — it must be CHOSEN, not defaulted into.** **No threshold is asserted here
      and no constant is set**; a constant set in this task is a STOP-and-flag. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [§8-3]

- [ ] **5.4 App-page bytes and the package. PRODUCES NUMBERS.** App chunk vs **389,143 B** (md5
      `65486f78afa2fec0e9d00f7f0e9c0d27`, 9.3 at `94f7da5`), decomposed; `pnpm zip` vs **1,300,383 /
      1,300,442 B**, bound **< 2 MB per engine** (headroom **699,558 B** at the corrected figure); packed
      unzipped vs **4,059,893 / 4,060,009 B** against AGENTS.md's **≤5 MB**; background vs **3,548 B**.
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: every delta stated **with its baseline**, decomposed. ★ **`dependencies` is EXACTLY FIVE,
      asserted not eyeballed** (§3.9, §5: **zero additions**) — **so any delta is our own code** and is
      decomposed as such; a dependency appearing here is a **stop-and-flag**, not a governed act. ★ **Standing
      note carried so this task does not report a FALSE BREACH: the Firefox `-sources.zip` is the AMO review
      archive, NOT the bound** (007 8.1's finding). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` both engines. [§5 bytes; §3.9]

- [ ] **5.5 ★ DECISION GATE (human) — §8-1, §8-2, §8-3 and §8-4, chosen from 5.1–5.4 and the walk. Recorded
      in `decisions.md` BEFORE any code that sets a value.**
      **§8-1 — does the content-script REACH ship?** Read 4.3's decomposition and 5.1's floor-beside-median.
      ★ **The rule is already set and the value is not: if the gate cannot hold, the surface REACH gives way,
      not the gate** (§8-1's escape hatch, gate-1 §9-4 — declined the app-page-only alternative rather than
      letting a measurement decide it silently). **§8-2 — per-table or per-document filter**, from 5.2's
      distribution and 6.1's walk. **§8-3 — the threshold, if any**, from 5.3. **§8-4 — which presentation
      defaults a recognized agent file gets**: the axes are settled (**presentation only, nothing persisted,
      parser untouched**); **the SET is a walk judgement**, because *a tuning nobody notices is not worth its
      code and one everybody notices is a theme change in disguise*.
      Files: `docs/ai/decisions.md`
      Verify (**human gate**): each choice recorded **with the measurement that justifies it**, **before 5.6
      and before 5.7** — and §8-1's ruling recorded in the terms 5.7 has to execute (ship the reach, or
      remove it and re-measure).
      ★ **No code lands on an assumed number**, and **a re-scope decided here is a FINDING recorded in terms —
      never a quiet re-scope.** Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§8-1, §8-2, §8-3, §8-4]

- [ ] **5.6 Implement the CHOSEN values — CONSTANTS AND THE PRESENTATION BLOCK ONLY (§8-2 · §8-3 · §8-4).**
      Set the threshold constants, the filter's scope and the §8-4 presentation block to 5.5's values — ★ **a
      no-op edit if they matched, RECORDED either way**: a *"PROPOSED"* comment left on a chosen value **is a
      lie about the decision state**, and the next session reads it as still open. ★ **The ALGORITHM does not
      move — only constants and the presentation block.** ★ **§8-1's give-way is NOT here: it is a REMOVAL and
      a RE-MEASUREMENT, not a constant, and it is 5.7's** (gate-2 scope instruction 2).
      Files: `src/render/tableEnhancer.ts` · `src/render/tableTools.ts` · `src/render/agentBadge.ts` ·
      `src/theme/readerCss.ts` · their tests
      Verify: (**unit**) the threshold and scope cases pass against the **chosen** numbers; the enhancer's
      orchestration, the sort comparator and the serializers are **byte-identical** — the diff **confined to
      the constants block and the presentation block, asserted rather than eyeballed**. **No test pinned a
      proposed number**, so none needed updating — and **if one did, that is a finding about 3.2 / 3.6's test
      design and is stated**, not patched over. Re-run the affected pins **with the prediction stated BEFORE
      the harness runs** (a number read first and rationalised after is not a verification). Bytes move on
      both bundles if the presentation block changed — stated with their baselines (**318,747 B** CS /
      **389,143 B** app), decomposed. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§8-2, §8-3, §8-4]

- [ ] **5.7 ★ THE §8-1 GIVE-WAY — CONDITIONAL, and it is a REMOVAL PLUS A RE-MEASUREMENT, never an edit to a
      constant (gate-2 scope instruction 2).** Executed **only if 5.5 ruled the content-script reach OUT**;
      if 5.5 ruled it **IN**, this task lands **nothing and is RECORDED as a no-op with 5.5's number** — a
      skipped task with a stated reason, never a silently absent one. ★ **§8-1's escape hatch is *"the surface
      REACH gives way, not the gate"*** (gate-1 §9-4 declined the app-page-only alternative outright rather
      than letting a measurement decide it silently), so **giving way means, in these terms**:
      **(a) REMOVE D-6's sites 3 and 4** — `enhanceTables(host)` at `mountReader.ts:90` **and** the `render`
      closure `contentWatch.ts:121` gained at 4.1 — **together, in ONE commit, the same all-or-nothing 4.1
      landed them under** (a surface that stops enhancing on re-render but not on first mount is the same
      shipped defect in reverse). **(b) RE-MEASURE to a RESTORED baseline: the content-script bundle back to
      318,747 B with md5 Cr `c7b33b36b1a727fdacb77eefe64083e1` / Fx `67717921bdf646c7366176392d0c37d7`** —
      4.3's accounting **run backwards to a zero residual**, because an unaccounted byte is a defect in this
      direction too. **(c) COLLAPSE the two-surface arms:** the table-tools browser suites' `describe.each`
      becomes app-page-only and **the content-script ABSENCE is asserted with the app page as the control
      that fires in the same run** — the shape 2.5 already uses for §4's compare clause, because an absence
      nothing could have produced discriminates nothing. **(d) 4.2 goes with the reach** — the content-script
      cost guard and **D-10's `file://` clipboard arm** are removed and their removal is **NAMED**, not
      silent. **(e) RECORD it as a FINDING in `decisions.md`, with §8-1's number beside it**: a narrowing of
      §9-4's *"both surfaces"* taken through the escape hatch the gate itself provided — **never a quiet
      re-scope**, which is exactly what gate-2 revisit-when (b) reserves.
      Files: `src/render/mountReader.ts` · `src/watch/contentWatch.ts` ·
      `tests/browser/tableTools.browser.test.ts` · `tests/browser/tableCost.browser.test.ts` ·
      `tests/browser/tableCopy.browser.test.ts` · `docs/ai/decisions.md` · `docs/ai/progress.md`
      Verify: ★ **the restoration is a MEASUREMENT, not an assumption** — the rebuilt content-script bundle is
      `wc -c` **318,747 B** and **md5-EQUAL to both original digests**, ★ **with the firing control that the
      instrument can see a change** (touch one byte in a reachable module, rebuild, md5 moves, revert),
      because a null reading that cannot move is not a measurement — and that control matters most here,
      where the expected reading IS the null one. **Both sites removed in one diff**, asserted as a diff
      touching both files. **Fences re-proven, never assumed:** 007's traversal **8/8** (clause B firing),
      `diff` off the content-script graph (`diffEngine.test.ts:223-311`, three clauses). ★ **The app-page
      table tools are UNCHANGED and still green** — asserted, because the give-way surrenders **the reach**,
      not the feature. **The prediction is stated BEFORE the harness runs.** Golden EMPTY · manifest green
      **2975 B** · `permissions: []` both engines. [§8-1; §9-4's escape hatch; D-6 sites 3–4; gate-2 scope
      instruction 2 + revisit-when (b)]

## 6 — Human milestone-close gate + retro + the records reconcile

- [ ] **6.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** Walk, on
      **real Chromium and real Firefox with an extension loaded** (no harness reaches these): whether the
      toolbar **reads as part of its table or as clutter above it** (the D-12 question the rect probe cannot
      answer); **the filter at one big table vs several small ones** (§8-2's walk half, against 5.2's
      distribution); **the §8-4 presentation set**; ★ **the BADGE'S LANE — plan §8 Q3's design call, taken here
      with 1.5's measurement in hand** (the band now carries three things at 1280, and `diffChrome.ts:77-82`
      records that at **414 every candidate already collides**); **Firefox everything** (Playwright cannot load
      an extension into Firefox, so this walk is that engine's **only** evidence); **zero unexpected network
      with the Network tab open** across open → badge → compare → sort → filter → copy.
      Verify (**human gate**): each item walked and its verdict recorded. ★ **The walk RECORDS ITS VIEWPORT(S)
      the way it records its engines, and walks at least one WIDE viewport at BOTH geometry widths — 1280 AND
      1400 — because this milestone ships chrome INSIDE the reading column** (finding 2, whose mechanical cause
      was three gates' coverage silently conditioned on the monitor someone happened to be sitting at; recovery
      B1's own note is that a **single** wide width let the defect class ship). A *"reads as clutter / broken /
      illegible"* verdict is a **real finding → a task added below this line, not a silent fix**.
      ★ **POINTER WALK AS A DISCRETE STEP before the commit lands** (finding 3): grep § Now, § Blockers and
      § Up next for `is next`, `at the gate`, `waiting on`, `this commit`, `← NEXT` and the running gate score,
      and correct each stale assertion. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§5 human-gate list; §8-2, §8-4; plan §8 Q3; findings 2, 3]

- [ ] **6.2 Retro (M8 close) — in a FRESH SESSION (the M5/M6/M7 precedent).** Run `/retro`: append to
      `docs/ai/retro.md`, newest first — the lessons that change how the next milestone runs, and **what the
      gate caught** (its most valuable content). ★ **M8 owes a FLOOR-DELTA STATEMENT against the standing
      floors — 135.1 / 132.6 / 134.7 ms (2026-08-03, `757f953`) — BEFORE any first-paint re-baseline is even
      discussed** (finding 8: **a flat floor with a breaching median is ENVIRONMENT; a floor that has MOVED UP
      is CODE, and the answer is optimisation, not a bigger number**). **State the delta whether or not a
      re-baseline is proposed** — that single number separates the two cases, and without it they are
      indistinguishable in prose. M8 is also the first milestone to spend content-script bytes deliberately, so
      the retro says whether the **decomposition-to-zero-residual** discipline actually held under a non-zero
      delta.
      Files: `docs/ai/retro.md` · `docs/ai/progress.md`
      Verify: the entry is banked; `progress.md` shows M8 closed and points at what is next; ★ **the
      floor-delta sentence is present and states a NUMBER.** Docs only — no `src/`, test, `scripts/` or spec
      file touched. Golden EMPTY · manifest green **2975 B** · `permissions: []`. [finding 8; WORKFLOW.md §7.5]

- [ ] **6.3 The records reconcile that closes M8 — including D-11 (iii)'s TRIGGER (plan §8 Q4).**
      Files: `docs/ai/progress.md` · `docs/ai/spec-coverage.md` · `docs/ai/decisions.md` (**only** if a genuine
      decision landed)
      Verify: § Baselines carries **re-run** numbers **or states plainly that it did not re-run them, and why**
      (finding 3 — § Baselines was stale by two commits at M6's close **while calling itself "current measured
      truth"**). ★ **D-11 (iii)'s funding trigger is CONFIRMED or REPLACED (plan §8 Q4), so a future planner
      inherits a CONDITION rather than a memory:** *the next milestone that puts work on the app-page render
      path whose cheapness cannot be argued mechanically — anything that parses, sanitizes, reads layout, or
      runs an engine there — funds the app-page first-paint harness BEFORE it ships that work.* The carried
      hole itself is **007 §4-5, now two milestones old**, and it is recorded as still open. ★ **`docs/trust/
      PERMISSIONS.md` was NOT edited** — no capability row, nothing stored, no permission added; the record
      says so explicitly, and **if that stopped being true at any task it was a stop-and-flag, not an edit**.
      Every M8 D-value's `decisions.md` entry is present and **landed with its implementing commit, not here**
      — audited, and any that did not is named. 6.1's **pointer walk repeated as a discrete step** on the final
      commit. `decisions.md` read and **left untouched unless a genuine decision landed** (a retro banks
      lessons; measurement findings are not decisions). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` · all forbidden paths byte-identical. [D-11 (iii); plan §8 Q4; finding 3]

---

**§4 EARS coverage — every clause has at least one task.** *Compare* → 2.1–2.5 (the content-script-absence
clause at 2.5) · *Agent-file* → 1.1–1.6 (the "parses exactly as any other document" clause at 1.3's golden
pin, and "persists nothing / no settings key" at 1.1's empty import list) · *Table tools* → 3.2–3.11, plus
the both-surfaces clauses at 4.1–4.2 · *Trust* → 1.6, 3.8, 3.11, 4.2, 4.3, 5.4 (manifest / bytes / network /
dependency, per group) · *Degradation* → 2.5, 3.2, 3.8, 4.2.

**Group ordering, stated so it can be checked:** **1** and **2** are dependency ROOTS — no badge exists until
the identity seam does, and no file comparison exists until the capability pair does. ★ **3.1** is the audit's
consumer and **precedes every table-tools test task in this file — 3.2 through 3.11, re-checked by number
after the gate-2 split**; the split's three added tasks (3.3, 3.4, 3.5) all landed **below** it. **4** is
built behind its own gate so **5** can price it and **5.5** can rule; **4.1's two sites land together**
because splitting them ships a defect, and **5.7 removes them together** for the same reason. **6** closes.

**Count after the gate-2 split: SIX groups, 35 tasks** — 1 (6) · 2 (5) · 3 (**11**, was 8) · 4 (3) ·
5 (**7**, was 6) · 6 (3).

*Gate: this file is a **DRAFT awaiting gate 3**. On approval, implementation may begin at **task 1.1, in a
fresh session**, per WORKFLOW.md §5.3 — one commit per task, the `progress.md` Now-pointer advancing in that
same commit. **No plan D-value is re-opened, no spec §3.x decision is re-decided, and no §6 IS-NOT item is
proposed here.** ★ **Gate 2 is BANKED (`2c29821`) and its four rulings and two scope instructions are APPLIED
above, not held. The only places this file declines to decide are the spec's §8-1 … §8-4 measure-then-choose
items — PRODUCED at 4.3 and 5.1–5.4, CHOSEN by the human at 5.5, executed at 5.6 and 5.7.***
