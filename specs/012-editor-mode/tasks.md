# Tasks 012 — Editor Mode (focused core): edit → live preview → save-back, via CodeMirror 6 (M12)
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews this decomposition against `plan.md`*
*and either approves it or returns it with redlines. **No implementation code before this file is approved***
*(WORKFLOW.md §5.3). This file is a PROPOSAL: it installs nothing, writes no feature code, and edits neither*
*the sealed spec body nor the sealed plan body.*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M12 GATE 1** entry (2026-10-03, the four*
*§9 rulings D-A…D-D). `plan.md` — gate 2, banked in `decisions.md`'s **M12 GATE 2** entry (2026-10-04, the*
*four §8 rulings on D-1 / D-9 / D-4 / D-8; D-7's content-comparison lead confirmed).* One commit per task
*(`-F` message file, `Co-Authored-By:` trailer naming the model that did the work); the human reviews the*
*pasted evidence and pushes — an agent NEVER pushes. Each capability gets its OWN real-engine test*
*(`tests/browser/*`, Cr+Fx, red-first + non-vacuous) — never a trailing "add tests" task. Layout, computed*
*style, an engine rendering into a live container, bytes-on-wire, a real file write and focus/keyboard*
*behaviour are jsdom-**BLIND**: proven in the real engine, never in jsdom.*
*Drafted 2026-10-04 at HEAD `3efc426` (tree clean, no stray process).*
*★ **REDLINED 2026-10-04 at HEAD `87ee130`, to `decisions.md`'s **M12 D-4 RE-RULED** entry, then approved at*
*gate 3 (`decisions.md`'s **M12 GATE 3** entry — the approval of record; this status line stays "DRAFT" per*
*the M7–M11 precedent).** The draft's F-3 disposition and task 2.2 were written to a premise the chrome*
*investigation found false ("the preview is a plain `mount()` call, `mount.ts` byte-untouched"). The human*
*re-ruled D-4's MECHANISM to Option B — an additive, default-`true` `chrome?: boolean` option on `mount()`.*
*Corrected here: the Gate-2 locked line · F-3 · 2.1's `mount.ts` clause · 2.2 · group 2's acceptance · 3.3's*
*scroll clause · 7.1's walk item · the content-script and zero-diff standing invariants. Nothing else moved.*
*★ **REDLINED 2026-10-04 at HEAD `e001f9e`, to `decisions.md`'s **M12 TASK 1.1** entry (post-landing).** Task*
*1.1 landed with its audit clause unmet and a §6 collision flagged; the human ruled both. Added here: the*
*post-landing note at 1.1 · the DISCOVERED task **1.2** (the audit bump, before 2.1) · a pointer on the §6*
*fence line · group 1's acceptance, sequencing constraint (1) and the count reconciled to 1.2. Nothing else moved.*

---

**★ Standing invariants — bundle-budget snapshot (AGENTS.md kickoff-standing-invariants rule).** `.output`
**5,197,425 B (Cr) / 5,197,541 B (Fx)** against the **≤ 7 MiB (7,340,032 B)** bound — headroom
**2,142,607 B / 2,142,491 B (~2.04 MiB)**. Content-script (`content-scripts/peekover.js`) **340,492 B both
engines**. `dependencies` **8** (`@mdit/plugin-tex`, `diff`, `dompurify`, `markdown-it`,
`markdown-it-task-lists`, `mermaid`, `shiki`, `temml` — counted from `package.json` at this HEAD). Manifest
**654 / 770 B** (Chrome/Firefox), `permissions: []`, no `web_accessible_resources`, no `contextMenus`.
**These byte figures are CITED** (`decisions.md` 2026-10-03, HEAD `21b97fa`; `progress.md`'s M11 close) —
this doc-only session ran no build. Only doc commits have landed since, so they should hold; **task 1.1's
own clean rebuild re-measures them and is authoritative** (the 011 1.1 baseline-citation divergence is the
standing reason this is said out loud). Task 1.1 is the ONLY task permitted to move the dependency count,
**8 → 10** (`codemirror`, `@codemirror/lang-markdown`). **Every task's kickoff re-states this snapshot, moved
forward to the immediately-prior task's own measured figure.**

**★ Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **Gate 1 (spec §9):** D-A in-shell mode, lazy-loaded never eager · D-B save-back's three-way routing
  (permission mechanism = task-level verification, **resolved by plan §1, did not surprise**; conflict
  POLICY = a product-feel ruling from a walk; ledger update = mandatory + a human one-sentence wording
  sign-off) · D-C the existing pipeline, debounced, no new sanitizer profile · D-D the dependency gate is a
  confirmation, not a fork.
- **Gate 2 (plan §8):** D-1 a dedicated edit-entry control, the bare `\` key stays a binary reading↔raw
  cycle · D-4 the nested preview host, built at group 2 and its cost measured at group 6 — **its mechanism
  RE-RULED 2026-10-04 (`decisions.md`, M12 D-4 RE-RULED): the preview is `mount()` called with the new
  additive `chrome: false` option; `mount.ts` gains that ONE default-safe option at task 2.2 and is
  otherwise untouched. The shadow-root boundary — D-4's core — is unchanged** · D-8 watch+edit SUPPORTED, DEGRADED, edit exit does not auto-flush · D-9's candidate wording on
  track, sign-off still owed at group 5 · D-7 content comparison is the conflict-detection LEAD; metadata
  decides nothing.
- **Plan D-1 … D-10.** Every task names the D-value(s) it implements; each D-value's `decisions.md` entry is
  the plan §0 draft text, landing with the commit that implements it (audited at 7.3 — M9 9.3's gap).
- **Spec §6's IS-NOT list is a fence:** scroll sync · WYSIWYG · table editor/CSV · toolbar or any bespoke
  keymap · find/replace · lint · transforms · image paste · snippets · import converters · drafts/autosave/
  editor snapshots · metrics · multi-file editing · editor settings · any content-script edit affordance.
  `design/mockup.html`'s `.edbar` toolbar depicts F8's end state and is NOT built (plan §3 risk 6). **No
  task proposes any of them.** ★ *Reconciled 2026-10-04 (`decisions.md`, M12 TASK 1.1): the fence is on
  what Peekover BUILDS. `basicSetup` ships as-is, so CodeMirror's own Ctrl-F search and autocompletion are
  present and are NOT suppressed (`lintKeymap` is bindings only — no lint source, no linting runs). No task
  builds a Peekover find/replace or lint, and no task strips the defaults.* ★ *RULED 2026-10-04
  (`decisions.md`, M12 TASK 1.1 EXTENDED): the same reading covers `markdown()`'s default keymap ("smart
  lists") — it ships as-is, `addKeymap` left `true`; nothing is owed before 3.1 on this.*
- **Plan §3.5's sibling-checklist audit — routed, not re-derived:** row 1 (app-page-only) → 1.1, 3.1 · row 4
  (the editor's DOM survives a re-render it does not control — the INVERTED property) → 2.2, 3.3 · consent/
  revoke/re-prompt → 5.1, 5.3 · zero-network with a firing control → 5.7 · row 15 (state in text and
  `aria-*`) and row 20 (polite live region, out of the a11y tree while empty) → 5.3, 5.6 · row 16 (real
  `<button>`, keyboard-operable) → 3.2 (edit control), 5.3 (save control) · row 19 (motion) → **out**, none
  specified, none invented · the watch/edit collision → 4.1, 4.2 · never-lose-unsaved-work → 6.1.

---

## Preflight — every `file:line` the plan cited, re-derived against HEAD `3efc426`

| Plan citation | At this HEAD |
|---|---|
| `readerMode.ts:26` `TOGGLE_KEY`, `:28` `ReaderMode = 'reading' \| 'raw'` | STILL-ACCURATE |
| `mount.ts:70-77` `CarriedReading`, `:92-93` `attachShadow`, `:113` `mount`, `:216` capture, `:218` `shadow.replaceChildren(...children)`, `:223` `setReaderMode(host, carried?.mode ?? 'reading')` | STILL-ACCURATE, all six. (A second `replaceChildren` sits on the failure path at `:321` — same whole-root contract.) |
| `watchController.ts:191` `COOLDOWN_MULTIPLIER`, `:204` `DIFF_DISPLAYED_ATTR`, `:254-280` options (`render`/`signal`/`now`), `:319` `pendingSetByDefer`, `:324` `diffDisplayed`, `:336` `installDiffObserver`, `:356-364` `onDiffExited`, `:449` `preserveReading: true`, `:484-528` `flushPending`/`onText` | STILL-ACCURATE. Note the deferral gate is read at **two** sites (`:494` in `flushPending`, `:524` in `onText`) and the observer's `attributeFilter` (`:341`) names only `data-diff` — 4.1 touches all three. |
| `chromiumFolderSource.ts:39-41` `pickDirectory` `{mode:'read'}`, `:60` `(await handle.getFile()).text()` | STILL-ACCURATE |
| `readerPane.ts:32-37` `ReaderFile`, `:188,191` enhancer call site | STILL-ACCURATE. **But** `createReaderPane(doc: Document)` (`:152`) takes NO options object today — see finding F-5. |
| `appShell.ts:28`, `:132` (htmlExport import), `:176,177` call site, `:687` `activeFile`, `:1132` `setActiveFile`, `:1182` `selectFolderFile`, `:1305` | STILL-ACCURATE. `:132` imports `exportHtml, copyAsHtml, copyAsRichText` — NOT `downloadAs`; the fallback adds a name to that import, an `appShell.ts` edit, `htmlExport.ts` still zero-diff. |
| `htmlExport.ts:340` `downloadAs(text, filename, mimeType = 'text/html')` | STILL-ACCURATE |
| `diagramEnhancer.ts:509` `enhancedHosts` | STILL-ACCURATE |
| `tests/manifest.test.ts:38` `permissions` `toEqual([])` | STILL-ACCURATE |
| `PERMISSIONS.md:40`, `:44`, `:52` ("cannot write") | STILL-ACCURATE |
| `changeDetector.ts:9-24` (TRAP 2, the read-cost figures) | STILL-ACCURATE |
| `diffChrome.ts` — 582 lines | STILL-ACCURATE |
| `design/mockup.html:300-308` `.editor{display:grid;…}`, `:673-688` `btnEdit` + `.edbar` + `#editor`/`#edPrev` | **MISDESCRIBED / MOVED.** `:300` is `.editor{display:none;grid-template-columns:1fr 1fr;…}`; the grid is switched on by `.doc.editmode .editor{display:grid}` at `:301`. `btnEdit` is at `:459`, not in `:673-688`. `.edbar` markup `:674`, `#editor` `:685`, `#edPrev` `:687`. The split-pane markup EXISTS as §7-6 found; only the line numbers and the one-line CSS quote drifted. All five tokens (`--line`, `--code-bg`, `--ink`, `--serif`, `--mono`) present in `design/tokens.css`. |
| `scripts/check-dynamic-imports.ts` `MUST_NOT_FIRE` "forbidden-specifier list" (D-10) | **MISCHARACTERIZED — see finding F-1.** `MUST_NOT_FIRE` (`:301`) is the scanner self-test's must-STAY-SILENT fixtures. |

## Gate-3 findings and questions — surfaced by this decomposition, not resolved silently

**Findings (the tree disagrees with, or goes past, the plan's text; each is routed to a task):**

- **F-1 · D-10 names the wrong mechanism.** `check-dynamic-imports.ts` enforces SPECIFIER STATICNESS (spec
  §6-4, no remote code): `MUST_FIRE` trips on computed/remote specifiers, `MUST_NOT_FIRE` lists shapes the
  scanner must NOT flag (`import('shiki')`, `import('./heavy/mermaid')`). It has no forbidden-specifier list
  and does not police the content-script graph. What polices `mermaid`/`temml`/`shiki` staying out of that
  graph is the graph-walking fence tests — `src/render/diagramImportFence.test.ts` (clauses A–D),
  `mathImportFence.test.ts`, `codeImportFence.test.ts`. → **Question Q1.**
- **F-2 · The bare `\` shortcut is expected to fire INSIDE the editor.** `installToggleShortcut`
  (`readerMode.ts:129-141`) listens on `document` and guards with `isEditableTarget(e.target)`. An event
  from inside a shadow root is retargeted to the host at the document, so that guard is expected to see the
  host, not CodeMirror's editable element; `toggleReaderMode` (`:87-88`) then flips any non-`raw` mode —
  `'edit'` included — to `'raw'`. Read from the code, NOT yet observed: typing a backslash in the editor
  would be swallowed and would throw the user out of edit mode. D-1 rules the key stays binary; it does not
  cover this. `readerCss.ts:207-208`'s shipped comment (*"a third data-mode value would change that shipped
  semantic"*) names the same hazard, and `:199-200` hide nothing for a third value. **D-1 is ruled and is
  not reopened** — → task 2.1 proves the hazard red-first in the real engine and makes the shortcut inert
  while `data-mode === 'edit'`.
- **F-3 · A nested `mount()` composes the FULL reader chrome and touches module-level registries.** D-4's
  nested host is a real `mount()` call, so the preview pane receives its own mode-toggle pill
  (`mount.ts:157`), theme control (`:169`) and TOC rail (`:209-210`), plus the registry-gated chrome —
  watch (`:183`), diff (`:191`), agent badge (`:198`). **RESOLVED BY THE D-4 RE-RULING (2026-10-04,
  `decisions.md`).** The watch target, diff context and document identity are MODULE-LEVEL SINGLETONS
  (`watchRegistry.ts:74`, `diffRegistry.ts:178`, `docIdentity.ts:59`; registered by the app page at
  `appShell.ts:1287/1340/1364`), so on the app page a nested `mount()` composes them LIVE — three hazards,
  not cosmetic duplicates: a preview watch pill that starts watching INTO the preview, a diff affordance
  acting on the preview rather than the document, and a preview TOC rail the backtick can resolve to
  instead of the document's. **CSS-hiding is REJECTED** — it cannot undo registry wiring; a hidden control
  is still wired. **The fix is the additive `mount()` option `chrome?: boolean` (default `true`), and a
  `mount.ts` edit for it is NOT a stop: it is the AUTHORIZED, additive, default-safe edit**, proven
  byte-identical for every existing caller. → task 2.2 adds the option and builds the preview on it. Any
  `mount.ts` edit BEYOND that one option is still a stop-and-flag.
- **F-4 · D-8 needs two signals across an import fence the plan's "Touches: `watchController.ts` only"
  does not account for.** `watchController.ts` is on the content-script graph and may import no editor
  module. It needs IN: "does this edit session hold unsaved changes"; and OUT: "an external change was
  deferred while you edited" (D-7's early hint). Both must travel as literal host attributes / events, the
  `data-diff`/`data-mode` precedent. → the dirty attribute is written by the editor at 3.2 (necessary
  ripple, enumerated there); 4.2 reads it by literal and raises the hint; 5.3 consumes the hint.
- **F-5 · D-3's injection point has two shape problems the plan did not see.** `createReaderPane(doc)` has
  no options parameter to "gain a field"; and `appShell.ts:174`'s `renderWithEnhancements` is a MODULE-level
  const while `activeFile` (`:687`) lives inside the shell's closure — the second call site cannot close
  over the handle as written. → task 3.2 resolves the plumbing at task time under D-3's fixed constraint
  (no render module names a `FileSystemFileHandle`; `readerPane.ts` stays capability-free).
- **F-6 · The ledger must not be false between commits.** Spec §3.4 / AGENTS.md #4: the `PERMISSIONS.md`
  correction lands WITH the capability. So the human wording sign-off has to precede the first write
  commit, not follow it. → 5.1 (human gate) is sequenced before 5.3 (the write), and 5.3's commit carries
  the ledger edit.

**Questions for gate 3 (genuinely two-sided, or a number/venue only the human can set):**

1. **Q1 · How D-10's fence is implemented (F-1).** *Proposed:* 1.1 adds two stay-silent fixtures
   (`import('codemirror')`, `import('@codemirror/lang-markdown')`) to `MUST_NOT_FIRE` — honouring the
   plan's letter, harmless, documenting the lazy pattern — AND 3.1 creates
   `src/render/editorImportFence.test.ts` on `diagramImportFence.test.ts`'s four-clause shape, which is
   what actually proves the exclusion. *Alternative:* skip the scanner fixtures as meaningless. The fence
   test is required by spec §4's content-script clause either way; it is a file plan §2 does not list.
2. **Q2 · Group 3 as three tasks or two.** *Proposed:* 3.1 engine · 3.2 enhancer + control + editor pane ·
   3.3 debounced live preview — the preview is where D-4's property is first exercised under real typing
   and deserves its own red. *Alternative:* fold 3.3 into 3.2 (one larger commit; "editor without preview"
   never exists as a shipped state).
3. **Q3 · Where the §8-1 conflict-POLICY ruling happens.** The ruling needs a walk of a real conflict,
   which needs detection built. *Proposed:* 5.3 ships a SAFE FLOOR common to all three §8-1 options (the
   save does not write, the status says the file changed on disk, the buffer is retained); 5.5 is a
   human decision task (010's 10.4 shape) walking refuse / diff-view / force-overwrite; 5.6 builds what is
   ruled. *Alternative:* rule the policy now, at gate 3, without a walk — then 5.5 is struck.
4. **Q4 · What the preview debounce is between group 3 and the §8-2 ruling.** Something must ship at 3.3
   before 6.2 measures. *Proposed:* D-5's cost-proportional cooldown with multiplier 1 (the
   `COOLDOWN_MULTIPLIER` precedent — no invented fixed interval), marked PROVISIONAL; 6.2 measures, the
   human rules, 6.4 applies the ruling and REMOVES the provisional marker (AGENTS.md's provisional-constant
   rule). *Alternative:* the human names a provisional value now.
5. **Q5 · What "material" means for D-4's nested-host cost.** Gate 2 ruled a material cost is surfaced,
   not filed, without a threshold. *Proposed:* 6.3 sets no threshold — it reports every delta that clears
   its own A-B-A noise floor to the human, with the number, and the human judges. *Alternative:* a
   threshold stated now.
6. **Q6 · The content-script byte invariant cannot be "340,492 B unmoved" as literally stated.** The
   kickoff's invariant treats ANY content-script move as a hard stop. But `readerMode.ts` and
   `readerCss.ts` (via `mount.ts:17,23`) and `watchController.ts` (via `contentWatch.ts:55`) are on the
   content-script graph, and plan §2 puts all three on the Touch list — the `[data-mode="edit"]` CSS and
   the widened deferral condition ship to the content script as inert bytes. *Proposed:* the invariant is
   "zero `codemirror` bytes, and every move is the named task's own decomposed glue" (the footer's
   wording); tasks 2.1 / 2.2 / 4.1 / 4.2 state their delta. *Alternative:* hold 340,492 B literally, which
   means the edit-mode CSS and the gate's edit condition must live in app-page-only modules — a different
   file split than plan §2's, i.e. a plan redline rather than a tasks choice.

---

## 1 — The byte measurement + governed install (D-D's CONFIRMATION — HARD GATE, gates every later group)

- [x] **1.1 Install `codemirror` + `@codemirror/lang-markdown` FOR REAL; measure, decompose, CHOOSE the
      setup from the number; govern the install (D-2, D-10; D-D).** Verify both packages against the
      current registry first (name, licence, maintenance, ESM shape, install scripts — never from
      training knowledge). Clean rebuild at HEAD to re-establish the baseline. Then, via a scratch
      app-page dynamic import that is REVERTED before commit, measure `.output` and `pnpm zip` deltas on
      BOTH engines (`pnpm build` is Chrome-only — build Firefox explicitly; a stale `firefox-mv3` reads as
      a false zero) for four arms: **(a)** `codemirror` with `basicSetup` · **(b)** `codemirror` with
      `minimalSetup` · **(c)** `@codemirror/lang-markdown` alone · **(d)** the shipping combination — four
      arms so a shared transitive (`@codemirror/state`/`view`, `@lezer/*`) cannot hide in two marginal ones;
      decomposed to a fully accounted residual. **Choose `basicSetup` vs `minimalSetup` from the measured
      delta and state the rule used** (plan D-2: `basicSetup` unless its cost surprises); nothing
      downstream assumes the answer. Add the stay-silent fixtures per Q1.
      Files: `package.json` · `pnpm-lock.yaml` · `scripts/check-dynamic-imports.ts`
      Verify: `Object.keys(pkg.dependencies).length` **8 → 10**, asserted, names confirmed. `pnpm audit
      --prod` EXIT=0. Licence + no-install-script result per package. `pnpm why --prod dompurify` still
      one copy. SBOM regenerated, component count + licence roll-up recorded (the SBOM is transient, not
      staged). Scanner self-test green with the new cases counted. **Content-script bytes md5-identical to
      the rebuilt baseline, with a FIRING control** — a scratch static `codemirror` import from
      `entrypoints/peekover.content.ts`, rebuilt, the md5 MOVES, reverted, restored byte-identical. The
      four-arm table pasted for both engines against the 2,142,607 / 2,142,491 B headroom and the reported
      ~500–607 KB spike, CONFIRMED or CORRECTED in plain words. No `src/` or `entrypoints/` diff in the
      commit. ★ **Acceptance is a confirmation, with one named stop:** the shipping arm fits → group 2 is
      authorized; the shipping arm does NOT fit inside headroom (not expected) → every later task is
      SUSPENDED and the finding goes to the human. Golden EMPTY · manifest **654 / 770 B** ·
      `permissions: []`. [D-2, D-10; D-D]
      ★ **POST-LANDING NOTE, 2026-10-04 (landed `e001f9e`; `decisions.md`, M12 TASK 1.1).** Ticked with ONE
      Verify clause NOT met: **`pnpm audit --prod` exits 1** at this commit, on two PRE-EXISTING advisories
      the CodeMirror install did not touch — `markdown-it` 14.3.0 (moderate, GHSA-253c-mchw-3w2r, fixed
      14.3.1) and `dompurify` 3.4.13 (low, GHSA-p98j-92pf-mc4p, fixed 3.4.16). Human-ruled: commit 1.1
      flagged; **the clause is OWNED and CLOSED by task 1.2 below, which runs BEFORE 2.1.** Every other
      clause was met as written. The setup chosen is `basicSetup`; its §6 consequence is ruled ship-as-is
      (same entry; see the §6 fence line above).

- [x] **1.2 The audit bump — `markdown-it` 14.3.0 → 14.3.1, `dompurify` 3.4.13 → 3.4.16; restores `pnpm
      audit --prod` EXIT=0 and CLOSES 1.1's unmet audit clause. DISCOVERED task, human-scheduled
      2026-10-04; runs BEFORE 2.1.** Not a version-number edit: `markdown-it` is the parser and `dompurify`
      the sanitizer, so both sit on the render path of BOTH surfaces (content script and app page) and the
      bump is a real regression check. Verify both target versions and their advisories against the
      current registry first (never from training knowledge, and not only from this line). Bump exactly
      those two; no other dependency moves, and no `src/` edit is expected — a test that goes red is a
      finding to surface, not a fixture to update.
      Files: `package.json` · `pnpm-lock.yaml` · `docs/ai/progress.md` (the Now-pointer)
      Verify: **`pnpm audit --prod` EXIT=0**, output pasted. FULL suite green — unit and browser, both
      engines (production dependencies change, so the full-suite rule applies) — with the sanitizer tests
      and the golden suite named explicitly in the report. **Golden EMPTY** (`git diff tests/golden/output/`)
      — a parser bump is the one thing this milestone that could move it; a non-empty diff is a
      STOP-and-flag with the diff shown, never a regenerate. `pnpm why --prod dompurify` still one copy.
      `dependencies` stays **10**, names unchanged. SBOM regenerated (transient, not staged), component
      count + licence roll-up recorded against 1.1's 191. **Bytes re-measured on BOTH engines** by clean
      rebuild — `.output`, `pnpm zip`, and `content-scripts/peekover.js` — against 1.1's baseline
      (5,197,425 / 5,197,541 B; content script 340,492 B): a parser/sanitizer bump may move them,
      INCLUDING the content script, and each delta is stated and decomposed per file as the bump's own;
      zero `codemirror` bytes in the content script still holds (CodeMirror is unreferenced until 3.1).
      Lint EXIT=0 · manifest **654 / 770 B** · `permissions: []`. The measured figures become 2.1's
      kickoff snapshot. [closes 1.1's audit clause; no D-value]
      ★ **POST-LANDING NOTE, 2026-10-04 (`decisions.md`, M12 TASK 1.2).** Landed with ONE human-ruled
      deviation from the line above: **`markdown-it` went to 14.3.2, not 14.3.1** (floor `^14.3.2`), to
      also close GHSA-r7fv-28h4-cvq7 (smartquotes; `typographer` is off here, so hygiene, not exposure).
      `dompurify` landed at 3.4.16 as written. Every Verify clause was met: audit EXIT=0, full suite green
      on both engines, Golden EMPTY. Measured: `.output` 5,200,689 / 5,200,805 B (+3,264 B each), content
      script 342,161 B (+1,669 B) — these are 2.1's kickoff snapshot.

- [x] **1.3 The katex advisory (GHSA-238p-pmpm-9mq7, via mermaid) — a reviewed, documented exception
      (R13 route (i)). DISCOVERED 2026-10-08; runs AFTER 5.1 and BEFORE 5.2.** Human-ruled and
      human-scheduled (`decisions.md`, "M12 TASK 5.1", (v)): no mermaid release carries a patched
      katex, so a bump cannot close R13; an override and a red audit are both rejected.
      Files: `package.json` (pnpm's audit-ignore configuration — verify the exact key against the
      INSTALLED pnpm's documentation; if pnpm cannot ignore a single advisory, STOP) ·
      `docs/ai/decisions.md` · `docs/ai/progress.md` · `tasks.md`
      Verify: the advisory read at source. A reachability analysis against this repo's mermaid
      configuration (`htmlLabels: false`, `securityLevel: 'strict'`, the secure-list hardening,
      `sanitizeSvg`'s post-processing) — does any shipped path reach the vulnerable katex code?
      **If REACHABLE → STOP and escalate, no ignore.** If not → an ignore naming exactly that one
      GHSA, with its revisit-when (an upstream mermaid that accepts katex ≥ 0.18.2). `pnpm audit
      --prod` and `--audit-level low` EXIT=0 WITH the ignore and EXIT=1 WITHOUT it (the firing
      control). No dependency moves; no production byte moves (build both engines, md5-identical).
      CI's supply-chain workflow honours the same config — state how. [R13; no D-value]
      ★ **REDLINE, 2026-10-08 — to `decisions.md`'s "R15" entry (the analysis above STOPPED: katex IS
      reachable from author `$$`, and no mermaid config closes it).** Scope widened by R15, in this one
      commit: a mermaid fence whose source contains `$$` degrades to the existing source fallback
      before `engine.render`, and the ignore lands on that proof. Files ADD
      `src/render/diagramEnhancer.ts` (the guard), `src/render/diagramEnhancer.test.ts` (the superset +
      drift pin + degrade cases — R15 drops the separate `diagramEngine.test.ts` pin) and
      `tests/browser/diagramKatexGate.browser.test.ts` (new, real engine, Cr+Fx). A NAMED EXCEPTION to
      M12's zero-diff rule for the diagram modules: `diagramEnhancer.ts` and its tests ONLY
      (`diagramEngine.ts`, `sanitize.ts`, the view stay zero-diff). "No production byte moves" becomes:
      content script md5-identical both engines; the app-chunk delta decomposed as the guard, residual
      0; the katex chunk still ships. Production code changed, so the FULL suite is owed.
      ★ **POST-LANDING NOTE, 2026-10-08 (`decisions.md`, M12 TASK 1.3).** Every clause met as
      redlined. Verdict NOT REACHABLE BY CONSTRUCTION; the ignore is `pnpm.auditConfig.ignoreGhsas:
      ["GHSA-238p-pmpm-9mq7"]` in `package.json` (read there by every pnpm 10.x CI can resolve); audit
      EXIT=0 with, EXIT=1 without, both forms. App chunk +132 B (the guard, residual 0); content script
      md5-identical; lockfile zero-diff. **Accepted cost (R15): math inside a mermaid diagram renders as
      source** — a 7.1 verdict item.

*Group-1 acceptance (plan §6): D-D's confirmation is settled with a decomposed, ablation-proven number on
both engines; the setup choice is made from measurement and recorded; the governed install is clean. This
is the only outcome that authorizes group 2.* ★ *As landed: D-D's confirmation and the setup choice are
settled at 1.1; "the governed install is clean" is completed by 1.2's audit EXIT=0. Group 2 starts after
1.2.*

## 2 — `ReaderMode` extension + the nested-host mechanism (D-1, D-4) — BEFORE any CodeMirror wiring

*Nothing in this group imports `codemirror`. The engine is an injected loader (a stub in tests); production
has no caller until 3.2 wires the control, so both tasks ship as tested-but-unreached code.*

- [x] **2.1 `ReaderMode` gains `'edit'`; async `enterEditMode` / its exit; the `\` shortcut made inert in
      edit mode (D-1; F-2).** TEST FIRST. `ReaderMode = 'reading' | 'raw' | 'edit'`. New exported async
      `enterEditMode(host, { loader })`: load, THEN build, THEN flip `data-mode` and relabel — never a
      half-state; a rejected loader leaves `data-mode` and the DOM exactly as they were. An exit path back
      to the mode the user came from. `setReaderMode` stays synchronous for `'reading'`/`'raw'`;
      `toggleReaderMode` stays binary. `readerCss.ts` gains the `[data-mode="edit"]` visibility rules
      (the reading column and raw `<pre>` hidden — today's two rules hide nothing for a third value), and
      `:207-208`'s now-false comment is corrected. Rationale lives in TS doc comments, never inside the
      CSS template literal.
      Files: `src/render/readerMode.ts` · `src/render/readerMode.test.ts` · `src/theme/readerCss.ts` ·
      `tests/browser/editMode.browser.test.ts` (new)
      Verify: (**unit**) load-then-flip ordering with a deferred fake loader — `data-mode` is NOT `'edit'`
      while the load is pending; a rejecting loader leaves the prior mode, attribute and children
      untouched (red-first: flip before the await → the pending-state assertion fails). (**real engine,
      Cr+Fx**) with focus inside an editable element in the host's shadow root and `data-mode="edit"`,
      a `\` keypress is NOT default-prevented and `data-mode` stays `'edit'`; red-first by removing the
      new guard — the mode flips to `'raw'`, in those units. The assertion that found the defect is the
      one seen to fail (no cheaper check ahead of it). Positive control in the same file: in `'reading'`,
      `\` still flips to `'raw'` and back. Shortcut-listener assertions are delta-based (shared
      `document`). `mount.ts` zero-diff IN THIS TASK (its one authorized edit is 2.2's). Content-script
      bytes: stated against 1.1's figure — `readerMode.ts`
      and `readerCss.ts` ARE on the content-script graph, so this task is expected to MOVE that number by
      its own glue; the delta is decomposed and justified, and any `codemirror` byte in it is a hard stop.
      Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [D-1]
      ★ *Post-landing, 2026-10-04 — two human rulings taken at this task, both recorded in
      `decisions.md`'s 012 D-1 entry and `progress.md`'s 2.1 record. (i) F-2's hazard does not fire on
      the app-page host (a `<div>`, which the shortcut's `querySelector('peekover-root')` never
      resolves), so the guard ships as DEFENSE-IN-DEPTH and its real-engine red-first + positive control
      run on the `peekover-root` shape; the app-page-shape case is a pin, not a proof. (ii) The edit
      visibility CSS is folded into the two existing `data-mode` rules as extra selectors, not a new
      rule, so `htmlExport.test.ts`'s 26-`:host`-site pin is unmoved and no file beyond this line's
      list changed. `enterEditMode` also takes an optional injected `build` step — the seam 2.2 plugs
      its shell into. Measured: content script 342,339 B both engines (+178 B) — 2.2's snapshot.*

- [x] **2.2 `mount()`'s additive `chrome: false` option + the split-pane shell + the nested preview host
      built on it (D-4 as RE-RULED 2026-10-04; F-3).** TEST FIRST, in two halves, the option first.
      **(a) The option.** `MountOptions` gains ONE field, `chrome?: boolean`, default `true`. When `false`,
      `mount()` skips the chrome composition — the mode pill, theme control, watch chrome, diff chrome,
      agent badge and the remote-load bar + network indicator (`mount.ts:157-201`) and the TOC rail
      (`:209-210`) — and commits the reader stylesheet(s) and the reading column only. The
      `sanitize(parse())` → inert `<template>` → `applyMediaPolicy` → adopt sequence (`:118-143`) is NOT
      touched and NOT duplicated: the single trusted render path is the reason this option exists. Every
      existing caller omits the field and is byte-identical to today. **(b) The shell.** `editorView.ts`
      (shell half): on edit entry build, once, two sibling elements inside the outer host's shadow root
      beside the reading column — a source-pane slot and a preview element that gets its OWN shadow root;
      preview updates are `mount(text, nestedHost, { contained: true, preserveReading: true, chrome:
      false })`, never a call on the outer host; teardown on exit. `readerCss.ts` gains the two-column
      layout per `design/mockup.html:300-304` (tokens verified against `design/tokens.css` before use; a
      narrow-viewport stack). No CodeMirror — the source slot holds a placeholder the test drives.
      **★ Scroll — designed for here, not discovered at 3.3.** `preserveReading` resolves its scroller
      through `resolveScrollContainer(host, true)` (`scrollContainer.ts:41`), which walks
      `host.parentElement` — `null` for a direct child of a shadow root — and then falls back to the host
      itself, which does not scroll under `CONTAINED_CSS`. An anchor captured against a non-scrolling
      element restores nothing, silently. So the shell makes a REAL scroller resolvable: the nested host
      sits inside a wrapper element in the outer shadow root that is the preview pane's scroll box (or the
      nested host is itself made the scrolling element). Which, is this task's to choose and state.
      **★ Named so they are reported, not assumed:** (i) `mount()`'s post-commit wiring (`:219-233` —
      `registerReaderSource`, `setReaderMode`, the two shortcut installers, the TOC un-register,
      `initReaderRuntime`) sits OUTSIDE the ruled guard range and still runs on the nested host; the task
      reports what each does on a chrome-less host. If any of it must be guarded too, that is a
      STOP-and-flag — the ruling names `:157-201` + `:209-210`, and widening it is the human's call.
      (ii) The remote-load bar and network indicator are inside the ruled range, so a preview holding
      remote media shows it blocked with no in-preview opt-in. `applyMediaPolicy` (`:134`) still runs, so
      nothing leaves the machine; stated in the report for the human to see.
      Files: `src/render/mount.ts` (the ONE authorized edit — the option field + its guard) ·
      `src/render/mount.test.ts` · `src/render/editorView.ts` (new) · `src/render/editorView.test.ts`
      (new) · `src/theme/readerCss.ts` · `tests/browser/editorNestedHost.browser.test.ts` (new)
      Verify: **Existing callers byte-identical:** `mount.test.ts`, `mount.fallback.test.ts` and the whole
      browser suite green with NO existing assertion edited; a new case pins that an omitted `chrome` and
      `chrome: true` commit the same serialised shadow root as each other; `git diff src/render/mount.ts`
      is the option field, its doc comment and the guard, nothing else. **Content-script bytes** (`mount.ts`
      and `readerCss.ts` are both on that graph): the delta stated against 2.1's figure and decomposed into
      the guard glue and the layout CSS as SEPARATE arms plus the both-ablated arm (a shared helper hides
      from marginal arms), md5 under ablation, residual accounted. (**real engine, Cr+Fx**) the outer
      shadow root's `mount()`-composed chrome is the SAME node set, serialising byte-identical, across (i)
      ten enter/exit toggles and (ii) twenty nested preview re-renders; the outer reading column node is
      identical by reference before and after. **Red-first, in the defect's own units:** point the
      preview's `mount()` at the outer host → the source-pane node is gone from the outer root (the editor
      destroyed). ★ **The three hazards proven ABSENT, red-first, with the registries LIVE** — a watch
      target and a diff context registered, an agent-file identity set, a preview document of ≥ 2 headings,
      so every arm of the chrome WOULD compose: the nested shadow root holds no watch control, no diff
      affordance, no TOC rail, no mode pill, no theme control and no agent badge (each selected by class
      alone); the nested host is not a registered TOC host, and a backtick toggles the OUTER document's
      rail (delta-asserted). **Ablation:** drop `chrome: false` from the preview's call → the preview
      watch control, the preview diff affordance and the preview rail all appear and the backtick resolves
      to the preview — each asserted in those units, the hazard assertion being the one seen to fail.
      **Positive control, same file:** the outer host, mounted without the option under the same registry
      state, DOES carry all of that chrome. The preview's reading column is present and non-empty, so
      "no chrome" is not "nothing rendered". The outer host's own registry entries (reader source, TOC
      host) are unchanged by a nested mount — delta-asserted. **Scroll:** the element
      `resolveScrollContainer` returns for the nested host is asserted by IDENTITY to be the preview's
      real scroll box (not the nested host by fallback, not the outer pane). Layout proven by hit-test at
      one NARROW and one WIDE viewport, both recorded. Full suite (production code changed). Golden EMPTY
      · manifest **654 / 770 B** · `permissions: []`. [D-4]
      ★ *Post-landing, 2026-10-04 — no human ruling was needed; the choices this line left to the
      task, recorded in `decisions.md`'s 012 D-4 entry and `progress.md`'s 2.2 record. (i) Scroll: the
      nested host sits inside a wrapper pane that is the preview's scroll box. (ii) The layout CSS is a
      new `EDITOR_CSS` export in `readerCss.ts`, injected by the shell — not `READER_CSS`, so the
      26-`:host`-site pin is unmoved, and 0 B reach any built file until 3.2 wires a caller. (iii) The
      two panes are children of ONE grid container that is the reading column's sibling, where this
      line says "two sibling elements" — the mockup's `.editor` shape. (iv) The shell's height is a
      definite `60vh` where the mockup has `min-height` (a real scroll box needs one) — a 7.1 walk
      item. (v) The post-commit wiring is harmless on the nested host and nothing beyond the ruled
      range was guarded. (vi) After a mode-pill bypass the shell stays in the DOM, hidden, and is
      reused on re-entry — a carry for 3.2. Measured: content script 342,384 B both engines (+45 B,
      the guard alone) — 3.1's snapshot.*

*Group-2 acceptance (plan §6, D-4's mechanism as re-ruled): entering/exiting `'edit'` leaves the outer
host's chrome byte-identical across repeated toggles; the nested host's `mount()` calls never touch the
outer shadow root; the preview carries the reading column with NO chrome and NO registry wiring;
`mount.ts`'s diff is the one additive `chrome` option and every existing caller is byte-identical; the `\`
key cannot eject an editing user.*

## 3 — Engine module + enhancer scaffolding + live preview (D-2, D-3, D-5's mechanism)

**★ THE GROUP-3 RESIDUAL — RESOLVED HERE (gate 2's carried item). Every browser test in group 3 runs on an
UNWATCHED document.** Group 3's preview lands before group 4 closes the watch/edit collision, so a watch
firing mid-test would remount the outer host under the editor. Each group-3 fixture therefore opens its
document with watch OFF and **asserts that precondition in the test itself** (the host carries no active
`data-watch` state and no watch target is registered for it) — a fixture that silently became watched
fails loudly instead of flaking. No group-3 test switches watch on. The watched-document path is group 4's
OWN test, written there. The same rule binds 3.2's and 3.3's degrade tests.

- [x] **3.1 `editorEngine.ts` — the ONE CodeMirror importer; the content-script fence (D-2, D-10; Q1).**
      TEST FIRST (the fence test is written before the module and is red until it exists and is lazy).
      Static-literal dynamic imports of `codemirror` and `@codemirror/lang-markdown`, the setup 1.1 chose,
      its default bindings unmodified (no bespoke keymap). Load memoized per nested host
      (`WeakMap<HTMLElement, Promise<…>>`), so edit → reading → edit does not re-fetch. Plan §4 risk 6
      verified against the INSTALLED package: whether the markdown language needs configuration for task
      lists / footnotes — reported, not assumed. D-7's open note verified here: whether the editor's
      document round-trips CRLF and a missing trailing newline byte-for-byte — REPORTED for 5.2/5.3 (the
      baseline never passes through the editor regardless).
      Files: `src/render/editorEngine.ts` (new) · `src/render/editorEngine.test.ts` (new) ·
      `src/render/editorImportFence.test.ts` (new — **necessary ripple**, absent from plan §2; required by
      spec §4's content-script clause and plan §5's "asserted statically")
      Verify: the fence's four clauses on the `diagramImportFence.test.ts` shape — **A** the content-script
      graph reaches no editor module and no `codemirror`/`@codemirror/*` specifier · **B** the app-page
      graph is the firing control (it DOES, once 3.2 wires it; until then clause B asserts the engine
      module's own edge) · **C** the only `codemirror` import in the tree is the one dynamic edge in
      `editorEngine.ts` · **D** the walk is non-vacuous. The pattern's ablation is standing precedent
      (007's fence) — cited, not re-earned. Memoization: two loads for one host resolve the same promise.
      App-page bytes stated against 2.2's figure, the lazy chunk's size matching 1.1's shipping arm within
      a stated residual. Content-script bytes md5-identical to 2.2's. Golden EMPTY · manifest
      **654 / 770 B** · `permissions: []`. [D-2, D-10]
      ★ *Post-landing, 2026-10-05 — no human ruling was taken; what this line left open or got wrong,
      recorded in `decisions.md`'s 012 D-2 and 012 D-10 entries and `progress.md`'s 3.1 record. (i) Clause
      C's permitted set is TWO dynamic edges (`codemirror`, `@codemirror/lang-markdown`), not "the one";
      no static or type-only specifier — the engine's types are inferred. It scans the shipped tree, not
      the union of the entry graphs, which would be empty of the engine until 3.2. (ii) Clause B is the
      engine's own edge; **3.2 owes its app-page half — an edit to `editorImportFence.test.ts`, a
      necessary ripple 3.2's Files list does not name.** (iii) "App-page bytes … the lazy chunk's size"
      does not apply at this task: with no caller the bundler emits NO CodeMirror chunk and every shipped
      file is md5-identical to 2.2's. The chunk was measured through a reverted scratch caller (+607,325
      B, three chunks; +1,882 B over 1.1's arm); **it lands at 3.2.** (iv) The memo key: the engine keys
      on the element it is handed. "The nested host" does not exist when `enterEditMode`'s loader runs
      and is discarded by teardown — which element 3.2 passes is OPEN, for 3.2's kickoff. (v) Risk 6:
      `markdown()`'s defaults are strict CommonMark — no GFM task-list / table / strikethrough
      highlighting, and no footnotes under any base. Reported, not configured. (vi) D-7's note: CRLF and
      lone CR are normalized to LF by the editor's document; a trailing newline, present or absent, is
      preserved. 3.2's dirty comparison and 5.2 / 5.3 are written against that.*

- [x] **3.2 `editorEnhancer.ts` + the edit-entry control + the editor pane + the save-capability
      injection point (D-1, D-3; F-4, F-5).** TEST FIRST. `enhanceEditor(host, { save })` appended at the
      two app-page call sites (`readerPane.ts:191`, `appShell.ts:177`) immediately after `enhanceMath` —
      LISTED, never composed into a shared seam. It installs a dedicated edit-entry `<button>` beside the
      mode pill (re-installed after every outer `mount()`, since `mount()` rebuilds chrome) which calls
      `enterEditMode`; the engine's view is built into 2.2's source slot, seeded from the document's
      registered source. The session captures `originalText` (the RAW read result, D-7) at seed time and
      writes a literal dirty attribute on the outer host when the buffer diverges from it (F-4 — 4.2 and
      6.1 read it). `save` is an injected function threaded from `appShell.ts`; at this task it is a
      plumbing-only capability whose body reports "not yet available" — no write, no permission request,
      nothing on disk. F-5's plumbing is resolved here under D-3's constraint.
      Files: `src/render/editorEnhancer.ts` (new) · `src/render/editorEnhancer.test.ts` (new) ·
      `src/render/editorView.ts` (editor half) · `src/app/readerPane.ts` · `src/app/appShell.ts` ·
      `src/theme/readerCss.ts` (the control) · `tests/browser/editorRender.browser.test.ts` (new) ·
      `tests/browser/editorDegrade.browser.test.ts` (new)
      Verify: (**real engine, Cr; Fx via the harness page**) on an UNWATCHED document: activating the
      control presents a CodeMirror view whose content equals the document source; typed text appears in
      it; the control is a real `<button>` selected by class alone, keyboard-operable, its accessible name
      carrying state in text. **Degrade (§3.7), red-first:** a rejecting loader leaves the document in its
      prior mode, no editor node present, the control reporting unavailability in text — reverted (swallow
      the rejection after the flip) → a half-mounted editor, asserted as such. **Absent on the
      content-script reader**, red-first by un-gating. (**unit**) the injection shape: neither
      `readerPane.ts` nor any `src/render/editor*.ts` names a `FileSystemFileHandle`. Dirty attribute:
      absent on entry, present after an edit, absent again after undoing to `originalText`.
      ★ **THE INFORMAL EYEBALL IS OWED AT THIS TASK** (WORKFLOW §7.2): the editor first renders here, so
      the task report asks the human for a cheap glance at the real thing — not deferred to 7.1. Content-
      script bytes md5-identical to 3.1's, proven by ablation. App-page delta decomposed. Golden EMPTY ·
      manifest **654 / 770 B** · `permissions: []`. [D-1, D-3]
      ★ *Post-landing, 2026-10-05 — three human rulings were taken in this task's kickoff (R1–R3),
      recorded in `decisions.md`'s M12 TASK 3.2, 012 D-3 and 012 D-1 (control half) entries and
      `progress.md`'s 3.2 record. (i) **R1** — `createView` builds `markdown({ base:
      markdownLanguage })`: GFM task lists / tables / strikethrough are syntax to the editor; footnotes
      still are not. +65 B. (ii) **R2** — the engine load is keyed on the OUTER host; edit → reading →
      edit is one load. (iii) **R3** — the mode pill is hidden in edit and the edit control is the exit
      (`exitEditMode` + `teardownEditorShell`); 2.2's pill bypass is closed. (iv) **Necessary ripples
      beyond this line's Files list, each authorized in the kickoff:** `editorImportFence.test.ts`
      (clause B's app-page half — 3.1's note ii — added beside the engine's own edge, no 3.1 assertion
      edited) · `editorEngine.ts` + `editorEngine.test.ts` (R1 only; the recording fake's `markdown`
      argument pin is the ONE existing assertion changed). (v) **The content-script resolution:** this
      line's Verify ("md5-identical to 3.1's") and the standing-invariants note ("a CSS touch in 3.2 …
      expected to move that figure") disagreed. Resolved to the Verify line: the control's CSS is a new
      `EDIT_CONTROL_CSS` export injected by the enhancer, and R3's hide rule is in `EDITOR_CSS` — neither
      reaches the content script. **Measured md5-identical on both engines in every arm, and seen to
      MOVE (342,384 → 956,490 B) when the content-script mount was un-gated** — the instrument fires.
      (vi) **F-5 as resolved:** `createReaderPane(doc, { save }?)` gains an optional options parameter;
      `renderWithEnhancements` becomes a function of `save` returning the render, instantiated once
      inside `mountAppShell`. No file beyond the two app files and the editor modules. (vii) **The
      dirty comparison** is against `originalText` put through the editor's own line-break rule
      (`normaliseLineBreaks`, in `editorView.ts`) — 006 D-5's `normalise` was NOT reused: it rewrites
      CRLF only, and the editor also breaks on a lone CR. `originalText` stays raw. The attribute is
      `data-edit-dirty="true"` on the outer host, removed (not "false") when clean — the literal 4.2
      and 6.1 read. (viii) **"Fx via the harness page"** is not defined anywhere in this file or the
      plan. Read as the vitest browser harness page: both engines run `editorRender` and
      `editorDegrade` there in full (10 + 7 tests each), through `readerPane.ts`'s real call site. A
      LOADED extension on Firefox cannot be driven (plan §5) — that is the informal eyeball here and
      7.1. (ix) **The save control:** this line threads the capability into the session and builds no
      save UI — the control is 5.3's. (x) Two 3.1 unknowns, observed in the harness on both engines: a
      second `import()` of the engine's specifiers fetches nothing (first 2 requests, repeat 0); **a
      repeated `import()` of a URL whose fetch FAILED makes no second request and rejects again** — so
      after a failed chunk fetch the control's "try again" cannot succeed without a page reload, even
      though the engine's own memo forgets the failure. Measured: `.output` 5,813,470 / 5,813,586 B
      (+612,335), content script 342,384 B both engines, md5 unchanged — 3.3's snapshot.*
      ★ *2026-10-05 — THE INFORMAL EYEBALL ABOVE IS DEFERRED TO 7.1 BY HUMAN RULING
      (`decisions.md`, "M12 TASK 3.2 — informal eyeball DEFERRED to 7.1"), a stated departure from
      this line's own clause and from WORKFLOW §7.2. In its place:
      `tests/browser/editorEyeballProxy.browser.test.ts` (test-only, both engines) measures what a
      real engine can — contrast of CodeMirror's surfaces on light and dark, collisions at the
      top-right, GFM / R1 as drawn, Ctrl/Cmd+S in the editor. Its findings are in that entry and in
      `progress.md` § Carried items; the eyeball itself is 7.1's added walk item.*

- [x] **3.3 The debounced live preview into the nested host; the preview-failure degrade (D-4, D-5's
      mechanism; Q4).** TEST FIRST. The editor's update listener feeds the buffer to 2.2's nested
      `mount()` through a NEW coalescing cooldown instance scoped to the preview (D-5's cost-proportional
      shape — newest text wins, never a queue), using the PROVISIONAL value Q4 settles, marked as such in
      one place. The preview keeps its scroll position across updates (`preserveReading`, against the
      scroll box 2.2 made resolvable — proven here under real typing: scroll the preview to a marker, type,
      the marker is still in view; red-first by resolving to the non-scrolling fallback). A preview
      render failure shows the reader's existing render-failure state IN THE PREVIEW PANE while the buffer
      stays intact and editable.
      Files: `src/render/editorView.ts` · `src/render/editorView.test.ts` ·
      `tests/browser/editorPreview.browser.test.ts` (new) · `tests/browser/editorDegrade.browser.test.ts`
      Verify: (**real engine**) on an UNWATCHED document: typing a specific marker string makes that
      string appear in the nested host's rendered output and nowhere in the outer reading column; the
      editor accepts further input while a preview render is pending (spec §4's responsiveness clause — a
      keystroke lands in the buffer before the pending render commits); a burst coalesces (render count
      strictly below keystroke count, delta-based). **D-4's property under real typing, red-first:**
      preview routed to the outer host → the editor's DOM is destroyed mid-typing. **Preview-failure
      degrade, red-first:** a forced render throw → the failure state is in the preview pane, the buffer
      text is byte-identical to what was typed; reverted (let the throw propagate) → the editor or the
      buffer is lost, asserted in those units. The preview's own enhancers (diagrams/math/code) —
      whether they run in the nested host is REPORTED, with the reason. Content-script bytes md5-identical.
      App-page delta decomposed. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [D-4, D-5]
      ★ *Post-landing, 2026-10-05 — one human ruling was taken in this task (the degrade's red-first,
      iii below), recorded in `decisions.md`'s 012 D-5 entry and `progress.md`'s 3.3 record. (i) **The
      cooldown** is `createPreviewCooldown` in `editorView.ts`, one instance per edit session, mirroring
      the watch's shape (first render immediate · wait = the last render's cost, from its END · one
      pending slot, newest wins · the timer never re-armed per change · an injected `now`).
      `watchController.ts` is neither imported nor edited; it holds no extractable helper. The render at
      BUILD is not timed and does not count as "the first" — the first keystroke renders at once. The
      multiplier is `PREVIEW_COOLDOWN_MULTIPLIER = 1`, the ONE place marked provisional; 6.4 removes it.
      (ii) **The feed joins 3.2's listener** — one listener, one `docChanged` check, dirty tracking
      unchanged; `editorEngine.ts` untouched. It hands the cooldown the editor's document, read only
      when it is rendered. (iii) **★ This line's revert clause is FALSE IN MECHANISM, and is left as
      written.** "Reverted (let the throw propagate) → the editor or the buffer is lost" was not
      reproducible: with the feed's guard removed and a throw forced out of `mount()`, the editor node,
      the buffer and further typing all survive on both engines — CodeMirror runs every update listener
      inside its own `try/catch`, and `mount()` degrades its own failures inside the NESTED host. What
      that revert costs is that the throw reaches the page as an error. **Human ruling: record both
      reds** — the literal revert in its true units, and the revert that does lose the editor (a failed
      feed render handled the way the BUILD render is: tear down, rethrow). (iv) **A pending render and
      its session:** three layers, not two — `renderPreview`'s live-shell check (2.2), the session's
      cancel, and the feed's fire-time session check. The last two hide each other, so each is seen red
      alone in the unit suite; in the browser only both-removed reds. (v) **D-4's red-first** is the
      FEED's render routed at the outer host — routing `renderPreview` itself there kills the shell at
      build, before any typing. (vi) **The scroll red-first** is `EDITOR_CSS`'s preview pane made
      `overflow:hidden` (an ablation in `readerCss.ts`, reverted): resolution falls back to the nested
      host and nothing is restored. One inserted paragraph only moves the marker by its own height, so
      the test types more above the marker than the pane is tall. (vii) **The preview's enhancers do
      NOT run in the nested host** — a FINDING for the human (`progress.md` § Carried items, P-1; home:
      a human ruling before 7.1). (viii) **Human-authorized addition (2026-10-05):** preview-appearance
      proxies in `editorPreview.browser.test.ts`; every pair matched. (ix) **No production seam was
      added to force a failure** — the tests override `replaceChildren` on the nested shadow root.
      Measured: `.output` 5,814,005 / 5,814,121 B (+535, all in the app chunk), content script
      342,384 B both engines, md5 unchanged — 4.1's snapshot.*

- [x] **3.4 Editor legibility + preview fidelity (R7, R8; E-1, E-2, E-3, P-1).** ★ **DISCOVERED
      2026-10-06; runs AFTER 4.2 and BEFORE 5.1** — human-ruled and human-scheduled (`decisions.md`,
      "M12 RULINGS after task 4.1": R7, R8). Numbered in group 3 because it finishes group 3's
      surfaces; it does not run in group 3's position. TEST FIRST. Four things, one commit: **(P-1 /
      R7)** after each preview render, the reader's enhancers — diagrams, math, code, in the reader's
      order — run on the NESTED host; **(E-3 / R8)** the editor's syntax-highlight colours come from
      design tokens, through a highlight style built on a third dynamic specifier,
      `@codemirror/language`; **(E-2)** dark-theme selected text, the current search match and
      autocomplete options reach AA, from tokens; **(E-1)** the collapsed TOC handle no longer covers
      the split pane's top-right corner.
      Files: `src/render/editorView.ts` (the enhancers on the nested host) · `src/theme/readerCss.ts`
      (`EDITOR_CSS`: E-1's handle clearance, E-2's dark selection / search-match / tooltip colours from
      tokens) · `src/render/editorEngine.ts` + `src/render/editorEngine.test.ts` (the token-driven
      highlight style via `@codemirror/language`) · `src/render/editorImportFence.test.ts` (the
      permitted set 2 → 3, still dynamic-only) · `tests/browser/editorEyeballProxy.browser.test.ts`
      (delete the `KNOWN_PANE_UNDER_HANDLE` pin; E-1 / E-2 / E-3 become passing assertions) ·
      `tests/browser/editorPreview.browser.test.ts` (P-1's REPORTED test becomes assertions)
      Verify: (**real engine, both**) every E-2 and E-3 pair ≥ WCAG AA on dark, with light
      un-regressed (light is the control arm, as in the proxy); E-1's overlap gone at both viewports
      (414×896 and 1400×900) with the pin DELETED, not loosened; mermaid, math and code render in the
      nested host — **red-first:** without the enhancer calls the preview holds the raw fence, the
      literal formula and the un-highlighted block (P-1's measured state). (**unit**) the fence permits
      EXACTLY three dynamic specifiers — `codemirror`, `@codemirror/lang-markdown`,
      `@codemirror/language` — no static or type-only one, clause A unchanged. Content script
      **md5-identical to 4.2's** (`EDITOR_CSS` does not reach it — 3.2's note v is the precedent, and
      its un-gating control is the instrument). App-page bytes decomposed into two arms — the
      highlight style, and the enhancer calls. Group 3's unwatched-document rule applies to every
      fixture. Full suite · Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [R7, R8]
      ★ *Open for this task's kickoff, checked at `2466f2e` and NOT decided here:* `@codemirror/language`
      is not a direct dependency (`package.json` names `codemirror` and `@codemirror/lang-markdown`;
      `node_modules/@codemirror/` holds `lang-markdown` only), so the specifier does not resolve as the
      tree stands. If 3.4 installs it, `package.json`, the lockfile and whatever the 1.1 governed
      install touched are necessary ripples this Files list does not name — enumerate them there, per
      file, or route them to the human. The reader's call sites also run `enhanceTables` between math
      and code; R7 names diagrams, math and code — whether tables run in the preview is the same
      kickoff's question.
      ★ *Post-landing, 2026-10-06 — six human rulings were taken for or in this task (R9–R14),
      recorded in `decisions.md`'s two "M12 TASK 3.4" entries and `progress.md`'s 3.4 record.
      (i) **Both open items above are RULED.** **R9** — `@codemirror/language` is installed as a
      direct dependency at the version CodeMirror already resolves (6.12.4, `^6.12.4`;
      `dependencies` 10 → 11); `package.json` and `pnpm-lock.yaml` are the authorized ripples, and
      the install alone moves no shipped byte. **R10** — the preview runs ALL FOUR enhancers,
      tables included, in the reader's order. (ii) **★ ONE VERIFY-ADJACENT CLAUSE IS NOT MET, AND
      IS CARRIED (R13):** R9's `pnpm audit --prod` EXIT=0. It exits 1 on a LOW `katex` advisory
      (via `mermaid`) that is red at this task's parent commit too. Its home is a dedicated bump
      task, human-scheduled, before 7.1 — the 1.1 → 1.2 precedent. (iii) **The palette is TWO-TONE
      (R11).** "The editor's syntax-highlight colours come from design tokens" could not mean a
      colour per role: on `--code-bg` only `--ink` and `--muted` clear AA for text in both themes.
      Markup, comments and link / task furniture draw in `--muted`, `invalid` in `--del`, every
      other role in `--ink`. (iv) **The style is built from `@codemirror/language`'s OWN default
      style** — its specs mapped, its tag objects reused — so `@lezer/highlight` is never
      imported; the fence gained an assertion for exactly that edge, which its scope-based matcher
      could not see. (v) **★ The style is built ONCE PER PAGE, not per engine.** Built per host it
      drew nothing on Firefox from the second host on (rules present in CodeMirror's shared
      constructed sheet, not applied) — found by this task's own proxy, fixed here. (vi) **E-2 is
      in `EDITOR_CSS`,** as this line's Files list says, not an `EditorView.theme()` (the kickoff
      offered both). Its cost, stated: the dark selection's fill against the pane fell 11.22 →
      1.29:1 (non-text, never asserted) — no token satisfies both that and the text. (vii)
      **Reported, not fixed (R12):** a `--muted` mark on the dark active-line band reads 2.97:1.
      (viii) **"Light un-regressed" is read as "still clears AA":** the markup marks are 5.49:1 on
      light where the default palette gave 8.44. (ix) **Two existing pins in
      `editorEngine.test.ts` were edited by authorization (R14)** — the exact extension list gains
      the highlight between the ruled pair and the caller. (x) **This line's "two arms" are FOUR**
      (the kickoff's decomposition): the highlight style 1,844 B, E-2 376, E-1 82, the enhancer
      calls 131 — residual 0. (xi) **The third edge's import SHAPE is worth 10,883 B:** named in a
      `.then` on the import itself the bundler drops the package's unused exports; destructured
      out of `Promise.all` like the two existing edges it keeps them all. The existing two were
      not changed — flagged for the human. (xii) **A failed enhancement is guarded per enhancer:**
      unguarded, a throw at build costs the edit view. (xiii) **For 6.2:** the cooldown times the
      mount and the enhancers' placeholders, not the lazy engines' work.
      Measured: `.output` 5,816,970 / 5,817,086 B (+2,433), content script 342,652 B both engines,
      md5 unchanged and seen to move under un-gating — 5.1's snapshot.*

*Group-3 acceptance (plan §6): spec §4's edit and preview EARS clauses hold on an unwatched document; D-4's
nested-host property is proven red-first under real typing; the engine has exactly one importer and is
absent from the content-script graph; Save is plumbed and NOT wired to disk.*

## 4 — The watch/edit collision (D-8) — BEFORE group 5's network and degrade tests

*This is where the WATCHED document is first tested. `diffView.ts` and the diff feature's substance are not
touched; this group widens a gate, not what it protects.*

- [x] **4.1 The deferral gate widens to `data-mode === 'edit'`; a clean exit flushes (D-8, direction 1 +
      the clean half of direction 2).** TEST FIRST. `diffDisplayed`'s condition gains the literal
      `data-mode` read (no import — the 5.1 fence's Clause C) at BOTH sites (`flushPending`, `onText`), and
      the observer's `attributeFilter` gains `data-mode`. Exiting edit mode with NO dirty attribute flushes
      the deferred text exactly as a diff exit does.
      Files: `src/watch/watchController.ts` · `src/watch/watchController.test.ts` ·
      `tests/browser/editorWatch.browser.test.ts` (new)
      Verify: (**unit**, the injected `render`/`now` seam) text arriving while `data-mode="edit"` → zero
      render calls, the text held; a cooldown timer armed BEFORE edit entry and firing during it → still
      zero renders (the `flushPending` site, the path `onText` does not cover). (**real engine**) on a
      WATCHED document in edit mode, an external change produces NO mutation of the outer shadow root and
      the editor node survives by reference; exit clean → the reading column shows the new text.
      **Red-first, in the defect's own units:** remove the `data-mode` branch → the editor's DOM is
      replaced mid-test. Positive control: the same external change with edit mode OFF re-renders (the
      watch is really firing). The existing `data-diff` deferral tests stay green, untouched. Content-
      script bytes: `watchController.ts` IS on that graph — the delta is stated, decomposed, and is this
      task's own glue only. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [D-8]
      ★ *Post-landing, 2026-10-05 — no human ruling was taken; two judgment calls are flagged in
      `decisions.md`'s 012 D-8 entry for one. (i) **★ THE EXIT-ORDER FINDING, an input to 4.2.**
      `editorEnhancer.ts:124-125` leaves edit as `exitEditMode` then `teardownEditorShell`, both
      synchronous, and the teardown removes the dirty attribute (`editorView.ts:276`). The observer's
      callback is a microtask and runs after both, so an attribute READ in `watchController.ts` cannot
      tell a dirty exit from a clean one — 4.2's "with the dirty attribute present, leaving edit does
      NOT call `renderNow`" cannot be built as written. Open to 4.2: the observer's own RECORDS (the
      dirty attribute's removal, with its old value, arrives in the same batch — reasoned, not
      measured), or a change outside 4.2's file list (the exit order, or a literal the editor leaves
      behind). (ii) **★ THE INTERIM STATE.** At 4.1 every exit flushes. Leaving edit with unsaved
      text discards the buffer (3.2; the guard is 6.1) and then shows the on-disk text. 4.1 claims
      no dirty-exit property and no test asserts one; "with NO dirty attribute" in this line's own
      text is therefore true of every exit the controller sees. (iii) **What was built:**
      `deferring()` = a displayed diff OR `data-mode === 'edit'`, read at both sites; the observer
      filters `data-diff` and `data-mode` and flushes when NOTHING defers any longer. It does not
      read `oldValue` — the flush acts only on text labelled deferred, so a reading <-> raw flip
      releases nothing. `onDiffExited` and `installDiffObserver` keep their names. (iv) **The
      "changed again" line is not said on an edit-only flush** — it names the comparison; it is said
      when a diff was displayed while the text was held (a new flag). Plan §0 D-8: a clean exit
      "simply flushes (equivalent to never having edited at all)". Flagged for a ruling. (v) **The
      real-engine red-first** shows the editor's DOM replaced AND the typed text lost, in one
      assertion; the positive control is inside the same tests, after the exit. The watch is
      hand-driven through the detector seam (the `watchDiffDefer` precedent), into a controller
      built with the default render — so the flush here does not re-install the edit control;
      production's `renderWithEnhancements` does. Measured: `.output` 5,814,275 / 5,814,391 B
      (+270), content script 342,520 B both engines (+136, md5
      `e051533e430646c410dfa7c5a200da2d` / `a791ceae1241502dede01f25738b3d33`), the app chunk
      518,038 B (+134) — 4.2's snapshot.*

- [x] **4.2 The "changed on disk while you were editing" HINT (D-8; D-7's early hint only; F-4).**
      ★ **RE-SCOPED 2026-10-06 by human ruling R6 (`decisions.md`, "M12 RULINGS after task 4.1"). This
      block is the task; the original body is kept beneath it, SUPERSEDED.** *Why:* 3.2's exit tears
      down — removing `data-edit-dirty` — before the watch's observer runs, so `watchController.ts`
      cannot see a dirty exit (4.1's note i); and once 6.1's guard lands a dirty exit never completes
      with the buffer alive ("stay" keeps edit mode and the deferral; "discard" clears dirty and the
      flush proceeds as a clean exit), so no dirty-exit detection is needed anywhere. The asymmetry
      moves into 6.1's Verify. Until 6.1, the interim state 4.1 recorded stands: an exit discards the
      buffer, then shows the on-disk text.
      TEST FIRST. `watchController.ts` sets a LITERAL host attribute while it holds an external change
      deferred during edit, and clears it when that deferral ends. The literal is chosen here and
      recorded in this task's post-landing note; no import (the 5.1 fence's Clause C). **No UI at this
      task** — 5.3 consumes the attribute (the status text and the safe floor). The hint NEVER replaces
      D-7's save-time content compare. The flush itself is unchanged and stays silent (R4).
      Files: `src/watch/watchController.ts` · `src/watch/watchController.test.ts` ·
      `tests/browser/editorWatch.browser.test.ts`
      Verify: (**unit** and **real engine**, WATCHED document) the attribute is SET while an external
      change is held during edit, and ABSENT otherwise — in edit with nothing held, outside edit, and
      on a diff-only deferral (text held under a displayed diff, edit never entered). It CLEARS when
      the deferral ends, by each path: the flush, a document switch, `stop()`. **Red-first, both
      directions:** never set → the held-during-edit case fails; never cleared → each of the three
      clearing cases fails, in its own units. ZERO renders while held (4.1's property, re-asserted with
      the attribute present). The editor intact: the same connected node, the buffer byte-identical.
      Content-script bytes stated against 4.1's 342,520 B and decomposed — `watchController.ts` IS on
      that graph, and the delta is this task's own glue only. Golden EMPTY · manifest **654 / 770 B**
      · `permissions: []`. [D-8, D-7 (the hint only); R6]
      ★ *Post-landing, 2026-10-06 — no human ruling was taken; three judgment calls are flagged in
      `decisions.md`'s "012 D-8 — 4.2 landed" entry for one.* (i) **THE LITERAL:
      `data-watch-changed-in-edit`**, on the outer host, presence-only (its value is the empty string,
      never `"false"`), exported from `watchController.ts` as `CHANGED_IN_EDIT_ATTR`. 5.3 reads it by
      literal and pins it to that export in a test. (ii) **What was built:** one function,
      `syncEditHint`, writes "a change is held AND `data-mode` is `edit`" at every point either half
      can move — `markDeferred` (both deferral sites), the observer's still-deferring branch, the exit
      flush, and `cancelPending` (`stop()`, the dead-read stop, a document switch). `stopSelf` calls
      `cancelPending` before dropping `host`. No import added. (iii) **★ "During edit" is a state,
      not "set at arrival":** with edit and a diff both deferring, leaving edit keeps the text held
      and REMOVES the hint (this line's "ABSENT … outside edit"); text held under a diff, then edit
      entered, SETS it. Neither is in this line's Verify; both are tested. (iv) **★ No content
      compare** — the controller could make one (`readerSourceFor`, already imported), and does not:
      a file that changes and changes back still carries the hint. **An input to 5.3:** its "on
      conflict — or on 4.2's hint" refuses, read literally, a save D-7's compare would allow. (v) The
      hint clears when the watch STOPS, though the disk did change — early notice only. (vi) **A
      fourth clearing path** beside this line's three: the dead-read stop (the same teardown as
      `stop()`), tested. (vii) "A document switch" is `stop()` then `start()`; a bare
      `start(otherHost)` on a running controller is 005's idempotent no-op and is pinned as one.
      Measured: `.output` 5,814,537 / 5,814,653 B (+262), content script 342,652 B both engines
      (+132, md5 `97b1b8690f195acb499a464fee532b34` / `c0115d89b10be306ffa0c77d2234a63e`), the app
      chunk 518,168 B (+130) — 3.4's snapshot.
      ★ *SUPERSEDED by R6, 2026-10-06 — the original 4.2, struck in place and kept for provenance (the
      M10 precedent). Nothing below is built at this task:*
      ~~**4.2 The exit asymmetry: a DIRTY exit does not auto-flush; the deferred change is raised as D-7's
      early hint (D-8, the unsafe half of direction 2; F-4).** TEST FIRST. With the dirty attribute
      present, leaving edit mode does NOT call `renderNow` with the deferred text; the deferred text stays
      in the single pending slot and a literal attribute/event on the host signals "changed on disk while
      you edited" for 5.3 to consume. Once the session is no longer dirty (saved, or discarded through
      6.1's guard) the flush proceeds. The hint never replaces the save-time compare.
      Files: `src/watch/watchController.ts` · `src/watch/watchController.test.ts` ·
      `tests/browser/editorWatch.browser.test.ts`
      Verify: (**real engine**, WATCHED document) edit, make the buffer dirty, external change arrives,
      exit attempt → the outer root is NOT re-rendered with the external text and the hint is present;
      **red-first:** route the dirty exit through `onDiffExited`'s unconditional flush → the unsaved
      buffer's DOM is destroyed, asserted as lost text. Firing control, the other direction: the same
      sequence with a CLEAN buffer flushes (4.1's case) — so the gate is not simply refusing every flush.
      A document switch during the deferral drops the pending text (the existing `cancelPending`
      contract), no cross-feed. Content-script bytes stated and decomposed. Golden EMPTY · manifest
      **654 / 770 B** · `permissions: []`. [D-8, D-7 (the hint only)]~~

- [ ] **4.3 ★ DISCOVERED — Save-path hardening: a save's own write is not an external change; edit
      entry binds the file the reader RENDERED; one stale comment (D-6, D-8; R17).**
      ★ *Added 2026-10-09 by human ruling R17 (`decisions.md`, "M12 RULINGS R16–R18"). It runs AFTER
      5.4 and BEFORE 5.5 — group 4's by subject (the watch and the edit session), not by position.*
      TEST FIRST.
      **(i) A save's own write is NOT an external change.** On a WATCHED document, Peekover's
      successful write must neither raise `CHANGED_IN_EDIT_ATTR` nor sit deferred as an external
      change. **OBSERVE FIRST**, red-first, on a watched document — 5.3 reasoned it and did not see
      it (its watched fixtures are hand-driven).
      **(ii) Edit entry binds the file whose text the reader actually RENDERED**, not whatever
      `activeFile` is at that instant. A mismatch binds NOTHING — Save then takes the no-handle
      route, which since 5.4 is the download. Red-first with two files of IDENTICAL text, in the
      switch window (`selectFolderFile` sets `activeFile` before the file's read resolves).
      **(iii)** `editorEnhancer.ts:28-30`'s stale "Nothing calls `save`" comment, corrected.
      Files: `src/watch/watchController.ts` (+ its test; or the detector seam it uses — 4.3's
      kickoff decides) · `src/app/appShell.ts` · `src/render/editorEnhancer.ts` (comment) ·
      `tests/browser/editorWatch.browser.test.ts` · `tests/browser/editorSave.browser.test.ts`
      Verify: (i) and (ii) each red-first as stated above, in the real engine. Content-script bytes
      STATED and decomposed — `watchController.ts` IS on that graph. Golden EMPTY · manifest
      **654 / 770 B** · `permissions: []`. *(R17 gives the three items, the Files and these
      invariants; the per-clause Verify wording is its kickoff's to write. Suggested there, the
      agent's note: a firing control for (i) — a genuinely external change after a save still
      raises the hint, so the fix is not "never hint".)* [D-6, D-8; R17]

*Group-4 acceptance (plan §6): SUPPORTED-DEGRADED is proven in BOTH directions, red-first — deferred while
editing; flushed on a clean exit, conflict-routed (never auto-flushed) on a dirty one.*

## 5 — Save-back (D-6, D-7, D-9)

*Ordered so no commit ever holds a write without the compare in front of it, and no commit ever holds a
write beside a ledger that says "cannot write".*

- [x] **5.1 ★ HUMAN GATE — the `PERMISSIONS.md` ledger wording sign-off (D-9; gate-1 D-B(iii); F-6).**
      ★ **SIGNED 2026-10-08** — `decisions.md`, "M12 TASK 5.1 — the `PERMISSIONS.md` ledger wording
      SIGNED by the human": the summary sentence, the final row and the interim row are banked there
      verbatim, with save-time rulings A–C and routes 1–7. Nothing was written to `PERMISSIONS.md`.
      The agent drafts the FINAL wording — the `:52` summary-sentence replacement and the new five-column
      "Edit save-back" row — starting from plan D-9's candidate and corrected against what groups 3–4
      actually built, then **routes it to the human and STOPS.** The sentence is a trust-story positioning
      call: mandatory to land, **not the agent's to word unilaterally and not an agent-finalized edit.**
      Nothing is written to `PERMISSIONS.md` in this task.
      Files: none (the draft is presented in the task report; a `decisions.md` entry records the signed
      wording once the human gives it)
      Verify: the human's one-sentence sign-off, quoted verbatim, banked in `decisions.md`. Until it
      exists, 5.3 does not start. [D-9; D-B(iii)]

- [x] **5.2 The conflict-detection predicate and the baseline's lifecycle — pure, no write (D-7).** TEST
      FIRST. A pure predicate over two strings (strict equality of the re-read text against
      `originalText`); the baseline rule: set from the raw read at seed, advanced to the written text
      after a successful write, never derived from the editor's document.
      Files: `src/render/editorView.ts` · `src/render/editorView.test.ts`
      Verify: (**unit**) equal → no conflict; any difference → conflict, including a SAME-LENGTH
      difference, a line-ending-only difference, and a trailing-newline-only difference (3.1's round-trip
      finding is what makes these cases mandatory). After a simulated successful write the baseline is
      the written text and an immediate second compare reports no conflict. **Asserted by reading the
      module's own source: no `lastModified` and no `size` is read anywhere on this path.** Content-script
      bytes md5-identical. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [D-7]
      ★ *Post-landing, 2026-10-08 (`decisions.md`, "012 D-7"):* the predicate is `hasConflict(baseline,
      reread)`. `session.originalText` IS the baseline — no frozen seed copy — moved only by
      `session.advanceBaseline(written)`, which 5.3 calls with exactly the string it wrote. The dirty
      attribute reads the same baseline, normalised (the ONE-BASELINE rule, so the compare and the
      attribute cannot disagree after a write). Neither has a caller yet; clearing dirty at the save
      stays 5.3's. The lifecycle runs the LF and CRLF write cases (ruling A). The source-read check
      matches whole words, comments included. App chunk +50 B; content script md5-identical.

- [x] **5.3 The write path — permission at the save gesture, compare BEFORE write, the safe floor, the
      save-failure degrade, the status region; the signed ledger lands in THIS commit (D-6, D-7, D-9).**
      ★ **REDLINE, 2026-10-08 — to `decisions.md`'s "M12 TASK 5.1 — the `PERMISSIONS.md` ledger wording
      SIGNED by the human" entry. It ADDS to this task's scope and Verify; where it and the body below
      disagree, it rules.**
      - **The ledger.** `PERMISSIONS.md` receives SIGNED (a) and SIGNED (b′) — the INTERIM row —
        EXACTLY; a ledger-text test pins both. Plus route 4's consistency edits: the ledger heading's
        enumeration of capabilities (`:31`), "the last four rows" (`:33-36`), and a cross-reference
        from the folder-read row's "read-only" to the new row (`:40-41`).
      - **Route 5.** `src/app/chromiumFolderSource.ts`'s "Read-only mode: Peekover never writes to the
        chosen folder" comment gets a COMMENT-ONLY correction — a named exception to that file's
        zero-diff rule (this body's own clause and the standing invariant), proven by md5-identical
        bundles on BOTH engines.
      - **Route 2, two red-first clauses.** (i) The file handle is bound to the edit session AT EDIT
        ENTRY, never read from the current file at click time. (ii) Revoke, closing the folder and
        switching folders END any open edit session, its bound handle with it — a save after either
        writes nothing. Selecting another file while editing stays 6.1's guard.
      - **Ruling A — CRLF.** A file whose raw read (`originalText`) was uniformly CRLF round-trips as
        CRLF; mixed endings / a lone CR → the editor's LF, and the status says the line endings were
        normalised; the baseline advances to the text actually WRITTEN.
      - **Ruling B — Ctrl/Cmd+S.** With `data-mode="edit"` it runs the same Save as the button;
        outside edit it exports, unchanged. Red-first, both directions. *Ripples:*
        `entrypoints/app/main.ts` · `tests/browser/exportShortcut.browser.test.ts`.
      - **Ruling C — the hint WARNS, the compare DECIDES.** Hint present + content unchanged → the
        save proceeds and the status warns; hint present + content changed → the safe floor.
        Red-first. ★ *The sentence below, "On conflict — or on 4.2's hint — the SAFE FLOOR", is
        SUPERSEDED for the hint half only; the conflict half stands. Kept, not deleted.*
      TEST FIRST. The injected `save` capability's body in `appShell.ts`: at the Save click,
      `handle.requestPermission({ mode: 'readwrite' })`; on `'granted'`, re-read through the existing
      `read()` seam, run 5.2's predicate, and only on no-conflict `createWritable()` → write → `close()`,
      then advance the baseline and clear dirty. On conflict — or on 4.2's hint — the SAFE FLOOR (Q3):
      nothing is written, the status says in text that the file changed on disk, the buffer is retained.
      Any thrown write error: status says the save failed, buffer retained unchanged. The save control is a
      real `<button>`; outcomes go to a polite live region that is out of the a11y tree while empty. The
      no-handle / denied routes report "cannot save here yet" until 5.4. `chromiumFolderSource.ts` and
      `htmlExport.ts` zero-diff. `PERMISSIONS.md` receives EXACTLY the wording 5.1 signed.
      Files: `src/app/appShell.ts` · `src/render/editorView.ts` (save half + status region) ·
      `src/theme/readerCss.ts` · `docs/trust/PERMISSIONS.md` · `tests/browser/editorSave.browser.test.ts`
      (new) · a ledger-text test (new, location per the existing trust-doc test convention, found at task
      time)
      Verify: (**real engine, Chromium only** — an OPFS handle; the live picker is 7.1's) a save writes
      the buffer and the file read back equals it byte-for-byte; a second save in the same session also
      succeeds (the advanced baseline — the firing control that the check is not refusing everything).
      ★ **D-7 red-first, SAME-LENGTH:** the file is rewritten out-of-band through the test's own handle
      with text of IDENTICAL length after edit entry, then Save → no write; the text read back is the
      out-of-band text byte-for-byte. Ablate the compare → the out-of-band text is GONE from disk, in
      those units. A `size`-based check could not pass this by accident. **Save-failure degrade,
      red-first:** a writable that throws → failure stated in text, buffer byte-identical to what was
      typed, dirty still set; reverted → the edit is lost or the failure silent. Ledger test: the "cannot
      write" claim is absent and the signed sentence present. `tests/manifest.test.ts` green,
      `permissions: []` on BOTH built manifests. Content-script bytes md5-identical. App-page delta
      decomposed. Golden EMPTY · manifest **654 / 770 B**. [D-6, D-7, D-9]
      ★ *Post-landing, 2026-10-09 (`decisions.md`, "012 D-6 — LANDED at task 5.3"):* the injected
      `EditorSave` is a BINDER, called once at edit entry; the session's bound save takes
      `{ text, baseline }` and answers `saved` (with the string written) / `conflict` /
      `unavailable`, a rejection being `failed`. The write is `writeBack` in `appShell.ts`; ruling
      A's `textForDisk` and the status copy are in `editorView.ts`; Ctrl/Cmd+S goes through
      `AppController.saveEdit()`. The no-handle and declined routes say "not available here" (the
      redline and the signed row), not this body's "cannot save here yet". `chromiumFolderSource.ts`
      is NOT zero-diff: its comment was corrected (route 5, md5-proven). **Ripples beyond this
      line's Files, each forced by the signature change:** `src/render/editorView.test.ts`,
      `src/render/editorEnhancer.test.ts` (three assertions re-spelled, listed in the entry).
      `readerPane.ts` and `editorEnhancer.ts` are zero-diff. App chunk +3,437 B; content script
      md5-identical. **One question is with the human** — whether 6.1's guard should also cover
      Revoke, a folder switch and a closed folder, which now end an edit session and discard a
      dirty buffer unasked — and one finding for 5.5: on a watched document a save's own write
      raises 4.2's hint.

- [x] **5.4 The download fallback — the no-handle and declined-write routes (D-6).** TEST FIRST. With
      `activeFile.handle` undefined (Firefox; a dropped file) or permission not granted, Save calls the
      existing `downloadAs` with the buffer text, the document's own filename and an EXPLICIT markdown
      mime type; no compare runs (nothing on disk is overwritten); the status says the edit was saved as
      a download. A first-class path, not an error branch.
      Files: `src/app/appShell.ts` · `tests/browser/editorSave.browser.test.ts`
      Verify: (**real engine, Cr+Fx**) on both routes the download is observed with the buffer's exact
      text, the document's filename and a markdown mime type — **never** `text/html` (red-first: omit the
      argument → the default is observed); nothing on disk changes on the declined route (read back,
      unchanged). `git diff --stat src/export/htmlExport.ts` EMPTY. `permissions: []` (this is the plain
      web download, not `chrome.downloads`). Content-script bytes md5-identical. Golden EMPTY · manifest
      **654 / 770 B**. [D-6]
      ★ *Added 2026-10-08 (`decisions.md`, "M12 TASK 5.1", route 1):* **`docs/trust/PERMISSIONS.md`
      joins this task's Files.** It replaces the interim row (b′) with SIGNED (b) EXACTLY, pinned by
      the ledger-text test.
      ★ *Post-landing, 2026-10-09 (`decisions.md`, "012 D-6 — the DOWNLOAD FALLBACK LANDED at task
      5.4"):* `writeBack` downloads where it cannot write — no handle that can ask for write access
      (every Firefox route), write access not granted, or a session bound to no file — and answers a
      new outcome, `downloaded`, on which the session moves NOTHING: the baseline is not advanced
      and dirty is not cleared, so 6.1's guard still fires after a download. `unavailable` is kept
      for a binding the shell dropped: nothing downloads after Revoke. **What is downloaded is
      ruling A's `textForDisk`, not this body's "the buffer text"** — they differ only for a
      uniformly CRLF file (flagged in the entry). The name is the bound file's; `document.md` when
      there is none. `htmlExport.ts` is zero-diff. The ledger row is SIGNED (b), byte for byte.
      **Beyond this line's Files:** `src/render/editorView.ts` + its test (the outcome kind, the
      copy), `tests/permissionsLedger.test.ts`, and two ripples the full suite forced —
      `src/render/editorEnhancer.test.ts`, `tests/browser/exportShortcut.browser.test.ts` (four
      assertions re-spelled, listed in the entry). The MIME red-first ran as written here: the
      argument omitted → `text/html` observed. App chunk +542 B, residual 0; content script
      md5-identical. The download's status copy is drafted, for review (R18).

- [ ] **5.5 ★ HUMAN DECISION GATE — the conflict/overwrite POLICY, from a walk (spec §8-1; D-B(ii); Q3).**
      The human walks a real conflicting edit (a watched file changed externally while being edited)
      against the three axes — refuse and tell · offer `diffChrome.ts`'s diff view · force-overwrite
      behind an explicit confirmation — on 5.3's safe floor, and RULES. The agent prepares the scenario
      and records the ruling; it chooses nothing. Requires a loaded extension: human-only.
      Files: `docs/ai/decisions.md`
      Verify: the ruling banked verbatim. 5.6 does not start without it. *(Struck if gate 3 rules the
      policy directly — Q3.)* [§8-1]

- [ ] **5.6 The conflict UX, as ruled at 5.5.** TEST FIRST. Builds exactly the ruled option on top of the
      safe floor. ★ **Its Files and Verify cannot be fully written before 5.5** — "refuse" may need no
      code beyond 5.3's floor; "diff view" reuses `diffChrome.ts`; "force-overwrite" adds a confirmation
      that must itself be un-skippable. The kickoff for this task is drafted from the ruling's text.
      Files: per the ruling (expected within `src/render/editorView.ts`, `src/theme/readerCss.ts`,
      `tests/browser/editorSave.browser.test.ts`; anything beyond is routed by AskUserQuestion)
      Verify: whatever is built, the SAME-LENGTH test of 5.3 stays green and no path overwrites a changed
      file without the ruled, explicit user action — red-first on that path. State in text and `aria-*`,
      never colour alone. Content-script bytes md5-identical. Golden EMPTY · manifest **654 / 770 B** ·
      `permissions: []`. [§8-1; D-7]
      ★ *Added 2026-10-08 (`decisions.md`, "M12 TASK 5.1", route 3):* **if 5.5 rules force-overwrite,
      the ledger row is RE-SIGNED by the human before 5.6 lands.**

- [ ] **5.7 The zero-network proof across load, preview and save, with a firing control; `permissions: []`
      re-proven (spec §4 Trust).** TEST FIRST. Lands after group 4 by constraint — the collision is
      closed, so no watch-triggered remount can race the request log. Request-level, real engine, never a
      DOM-shape assertion.
      Files: `tests/browser/editorNetwork.browser.test.ts` (new)
      Verify: (**Cr+Fx**) zero requests leave the origin across (i) the engine chunk load, (ii) a burst of
      preview re-renders, (iii) a save and a download-fallback save — DELTA-based against the shared
      Resource Timing buffer / request log, never an absolute count. **Firing control in the same file,
      same conditions:** a deliberately leaking variant (a remote reference adopted without passing
      through a sanitizer) IS observed, proving the instrument sees what it disclaims. Plan §4 risk 2: a
      reload / duplicated-tab permission probe if the harness can drive it — if it cannot, that is said
      plainly and the item moves to 7.1, not faked. `permissions: []` on both built manifests. Empty
      production diff → targeted-suite Verify plus an adjacent-surface spot-check. Golden EMPTY ·
      manifest **654 / 770 B**. [spec §4 Trust]
      ★ *Added 2026-10-08 (`decisions.md`, "M12 TASK 5.1", route 4):* **`docs/trust/PERMISSIONS.md`
      joins this task's Files** for the zero-network section's save-path sentence — factual, drafted
      at 5.7 after the proof, routed to the reviewer.

*Not a task — the OPTIONAL metadata-reliability probe (plan §7).* Nothing ships waiting on it; it is not
scheduled here. If a later session runs it, it may at most promote metadata to a pre-check that falls
through to 5.2's compare.

*Group-5 acceptance (plan §6): spec §4's save / conflict-detection / failure-degrade clauses hold; content
comparison is the SHIPPED mechanism, proven red-first with its firing control, and no shipped path consults
`lastModified`/`size`; the download fallback is proven on both no-write routes; zero network across all
three surfaces; `permissions: []` re-proven; the ledger carries the human-signed sentence.*

## 6 — Unsaved-changes guard + measurements (§4's guard clause; D-5's interval; D-4's cost)

- [ ] **6.1 The unsaved-changes guard — tab close, in-app navigation, leaving edit mode; BOTH directions
      (spec §4; plan §3.5 "new").** TEST FIRST. With the dirty attribute set: a `beforeunload`-class guard
      on close/reload; a guard on selecting another file in the folder tree (`selectFolderFile`); a guard
      on leaving edit mode. With it clear: none of the three prompts. A confirmed discard clears dirty
      (which releases 4.2's deferred flush).
      Files: `src/render/editorView.ts` · `src/app/appShell.ts` ·
      `tests/browser/editorUnsaved.browser.test.ts` (new)
      Verify: (**real engine**) for each of the three exits, dirty → the guard fires and the buffer
      survives a "stay"; clean → NO guard (the silent direction is asserted, not assumed — red-first by
      making the guard unconditional, which fails the clean cases). Listener assertions delta-based; the
      guard is removed on exit (no listener left behind on the shared `window`). What headless cannot
      prove about the browser's own unload dialog is NAMED and moved to 7.1. Content-script bytes
      md5-identical. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [spec §4]
      ★ *Added 2026-10-06 by human ruling R6 (`decisions.md`, "M12 RULINGS after task 4.1") — THE
      DIRTY-EXIT ASYMMETRY IS THIS TASK'S, moved here from 4.2.* (**real engine**, WATCHED document)
      with an external change deferred during edit and the buffer dirty: **(i)** an exit attempt →
      "stay" → still in edit, NO flush, the deferral and 4.2's hint both persist, the buffer intact;
      **(ii)** "discard" → dirty clears → the exit completes → the flush shows the on-disk text and the
      hint clears. **Red-first:** the exit tearing down before the guard decides → the buffer is lost
      with no prompt, asserted as lost text. *What releases the flush is leaving edit, as at 4.1 — so
      "(which releases 4.2's deferred flush)" in this line's opening text is superseded in mechanism:
      4.2 withholds nothing.*
      ★ *REDLINE, 2026-10-09 by human ruling R16 (`decisions.md`, "M12 RULINGS R16–R18") — THE GUARD
      ALSO COVERS EVERY PATH THAT ENDS AN EDIT SESSION. It ADDS to this task's scope and Verify.*
      Since 5.3 three shell paths end an open edit session (`endEditSession`), and each discards a
      dirty buffer unasked. With the dirty attribute set, each now offers stay / discard exactly as
      leaving edit does; with it clear, none prompts:
      **(a) Revoke** (`revokeAccess`).
      **(b) a folder switch** (`applyOutcome`'s success branch).
      **(c) a closed folder** (`paintIdle`) — which ALSO fires on a cancelled or failed re-pick
      from the reopen hub and on a non-folder drop.
      **Red-first PER PATH:** with the guard absent on that path, the buffer is lost with no
      prompt, asserted as lost text — three reds, each in its own units.
      *Not ruled, for this task's kickoff (the agent's notes, 5.4):* what "stay" leaves standing on
      each path — on (b) and (c) the outcome that triggered it (a newly granted folder; a cancelled
      re-pick) has already happened by the time the guard can ask. And: after a DOWNLOAD (5.4) the
      buffer is still dirty — the folder's file is unchanged — so the guard fires on every exit
      after one. That is intended (5.4's landing entry) and belongs in this Verify.

- [ ] **6.2 The debounce-interval measurement (spec §8-2; D-5). FORBIDDEN from choosing.** Preview
      re-render wall-clock across a document-size corpus mirroring `perf-watch.ts`'s 50 KB / 1 MB shape
      plus a typical small document; median AND floor; A-B-A against a same-session control, interleaved,
      quiesced.
      Files: a perf script under `scripts/` (committed if reusable, stated either way) · `package.json`
      only if a `perf:*` script entry is added
      Verify: the table pasted, median beside floor, per size, per engine where the harness reaches. The
      fixed-vs-adaptive axis and the large-document cadence are laid out for the human; **no value is
      picked, no production constant changes in this diff.** The numbers go to the human for the §8-2
      ruling. Content-script bytes md5-identical. Golden EMPTY · manifest **654 / 770 B** ·
      `permissions: []`. [D-5; §8-2]

- [ ] **6.3 ★ The nested-host cost measurement, and first paint with edit mode never entered (D-4; plan §4
      risk 3). FORBIDDEN from choosing.** First-paint and memory delta of the nested preview shadow root
      beside the outer one, isolated from CodeMirror's own footprint (arms: editor only · editor + nested
      preview · an ablated single-root control); and the existing first-paint gate on a document that
      never enters edit mode. A-B-A, floor beside median.
      Files: a perf script under `scripts/` (same disposition rule as 6.2)
      Verify: both tables pasted. First paint, never-entered: ZERO delta against the pre-M12 baseline, or
      the delta is a defect (the editor is not actually post-mount). ★ **THE GATE-2 CARRIED CONSEQUENCE,
      as this task's own acceptance: if the nesting cost lands material (Q5), that is a FINDING SURFACED
      TO THE HUMAN — the task STOPS and reports it — NOT a number filed in `progress.md`.** Groups 2–5
      stand on the nested host, so the report states plainly that overturning it is a rework. A
      non-material result is stated with its number and its noise floor. Content-script bytes
      md5-identical. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`. [D-4]

- [ ] **6.4 Apply the human's §8-2 ruling; remove the PROVISIONAL marker (D-5; Q4).** TEST FIRST. The
      ruled interval/multiplier (and adaptive rule, if ruled) replaces 3.3's provisional value; the
      provisional constant is REMOVED, not re-commented.
      Files: `src/render/editorView.ts` · `src/render/editorView.test.ts` · `docs/ai/decisions.md`
      Verify: the ruling quoted; a unit test pins the ruled behaviour (red on the provisional value if the
      two differ); 3.3's coalescing test still green. No "PROVISIONAL" string remains on this path.
      Content-script bytes md5-identical. Golden EMPTY · manifest **654 / 770 B** · `permissions: []`.
      *(If the human rules the provisional value AS the answer, this task is the marker removal alone.)*
      [D-5; §8-2]

*Group-6 acceptance (plan §6): the guard warns with unsaved changes and is silent without, on every exit;
the measurements produce numbers and choose nothing; a material nested-host cost is in front of the human.*

## 7 — Human milestone-close gate + retro + records reconcile

*Per WORKFLOW §7.4's close-adjacent rule: short check-in sessions here, tree and background processes
confirmed clean before each task. Every item in 7.1 needs a loaded extension and has NO agent substitute.*

- [ ] **7.1 ★ HUMAN-ONLY milestone-close walk.** Budgeted up front: **the live picker + a real local-disk
      write and re-read** (headless cannot drive `showDirectoryPicker`; OPFS is not the user's disk) ·
      **Firefox everything** — edit, preview, the download save (Playwright cannot load the extension
      there) · the **conflict UX** as ruled at 5.5, against a real external edit of a watched file · the
      **save / conflict / error messaging's design translation** (no mockup exists for it — plan §4 risk
      5; one is produced first if the human wants one) · the **split pane against the mockup's visual
      intent**, not its variable names · the browser's own **unload dialog** and anything 6.1 named ·
      the **reload / duplicated-tab re-prompt** if 5.7 could not drive it · **zero unexpected network
      with the Network tab open** across load, preview, save · **at least one WIDE viewport, recorded
      like an engine** (new chrome ships this milestone) plus the viewports 2.2 recorded · the nested
      preview pane judged by eye as a chrome-less reading column (F-3 / D-4 re-ruled: no pill, no theme
      control, no rail, no watch or diff affordance in it), including a document with remote media, which
      shows blocked with no in-preview opt-in · ★ *added 2026-10-04 (`decisions.md`, M12 TASK 1.1
      EXTENDED):* the **editing feel of CodeMirror's shipped defaults**, each with its own verdict —
      Ctrl-F search · autocompletion · Enter list continuation · Backspace delete-markup-backward.
      *The informal fidelity eyeball is NOT this task's — it was owed at
      3.2, when the editor first rendered.* ★ *added 2026-10-05, SUPERSEDING the sentence before
      this one (`decisions.md`, "M12 TASK 3.2 — informal eyeball DEFERRED to 7.1"):* **the deferred
      3.2 informal eyeball** — human-only: the editor's overall look on light and dark; whether the
      type, spacing and split read comfortably; whether CodeMirror's light search panel, tooltip and
      selection are acceptable on the dark pane; the feel of typing, selecting and the caret; all of
      it in the LOADED extension, Firefox included. Plus a verdict on every proxy finding
      (`progress.md` § Carried items, E-1…E-8): E-1 the collapsed TOC handle over the split pane's
      corner (103×26 px, pinned in the test) · E-2 dark-only unreadable text — selected text 1.16:1,
      the current search match 1.52:1, autocomplete options 1.09:1 · E-3 dark-only highlight colours
      — markup marks 1.69:1, task marker 1.24:1, emoji 2.15:1 · E-4 gutter line numbers 2.38 / 3.26:1
      on both themes · E-5 the non-text pairs under 3:1 · E-6 the 100 px split pane at 414 px with
      the rail open · E-7 Ctrl/Cmd+S in the editor exports the on-disk document · E-8 R1's
      sub/superscript and emoji highlighting as drawn. ★ *added 2026-10-08 (`decisions.md`, "M12
      TASK 5.1"):* **E-9, a PRIORITY item** — in dark the selection's fill reads 1.29:1 against the
      pane (was 11.22): selected text is readable (5.03) but the region is barely visible; a design
      decision, likely a dedicated selection token · the **pre-picker consent line**
      (`capability.ts`, unchanged by route 6) — a verdict on whether it still reads true beside
      save-back · **real-disk permission behaviour** — the write prompt, per-handle independence
      from the folder grant, the per-tab / reload re-prompt, and what the browser does with a grant
      after Revoke.
      Files: `docs/ai/progress.md` (verdicts) · `src/theme/readerCss.ts` only if a walked item returns a
      named styling finding
      Verify: every axis above gets its own stated verdict — PASS, or a named finding routed to § Carried
      items. No implicit "looked fine". Engines and viewports recorded. Golden EMPTY · manifest
      **654 / 770 B** · `permissions: []`.

- [ ] **7.2 `/retro` — the milestone retrospective (WORKFLOW §7.5).** Read `docs/ai/retro.md`'s own prior
      entries first. Includes: whether the re-derivation discipline's catches at this gate (F-1…F-6) cost
      or saved; whether the unwatched-document rule held; whether build-then-measure on D-4 was the right
      trade.
      Files: `docs/ai/retro.md` (+ `AGENTS.md` / `WORKFLOW.md` only for a rule the retro actually places)
      Verify: the entry is banked, dated, cites real task numbers; every answer ends in an action or an
      explicit "none".

- [ ] **7.3 Records reconcile.** `progress.md`'s M12 narrative moved to `progress-archive.md`; every
      D-value (D-1…D-10) audited against the commit that landed its `decisions.md` entry, gaps named;
      `spec-coverage.md`'s F8 row re-scored; the final byte ledger decomposed across every task from 1.1
      against the 2,142,607 / 2,142,491 B starting headroom; `AGENTS.md`'s current-milestone line.
      Files: `docs/ai/progress.md` · `docs/ai/progress-archive.md` · `docs/ai/spec-coverage.md` ·
      `docs/ai/decisions.md` · `AGENTS.md`
      Verify: every D-value's landing commit named; the closing content-script figure stated with each
      task's own justified delta summing to it and zero `codemirror` bytes in it; `.output` ≤ 7,340,032 B
      on both engines; `permissions: []` intact throughout; golden's milestone diff EMPTY.

---

## Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism

- **Revert-and-fail is the standard, not an option** (M6 finding 5): every regression test is verified red
  with the defect's own signature in the defect's own units. No revert-and-fail, task unfinished. The check
  that found the defect is the one seen to fail — no cheaper assertion ahead of it. A test that mirrors an
  established pattern's shape cites that pattern's ablation instead of re-earning it.
- **A positive control that FIRES** (finding 1), in the same test, under the same conditions the negative
  claim disclaims. A verification grep over a bundle proves nothing without one.
- **Perf is A-B-A**, interleaved against a same-session control, floor beside median (finding 7).
- **Viewports are recorded like engines; at least one WIDE** (finding 2) — this milestone ships new chrome.
- **Bundle-size Verify on every bundle-affecting task:** `pnpm build` + the Firefox build + `pnpm zip` +
  `.output`, each delta stated against the IMMEDIATELY-PRIOR task's measured figure and decomposed.
- **Harness-shared-state (AGENTS.md):** browser files run serially on one shared `document`/`window`,
  clipboard, Resource Timing buffer and module caches. Edit mode adds document listeners, a `beforeunload`
  guard and host attributes to exactly that shared state — every such assertion is DELTA-based or
  SPECIFIC-CONTENT-matched, never absolute, non-empty or pristine.
- **Content-script bytes — 340,492 B both engines.** The editor is app-page-only: **no `codemirror` byte
  ever enters `content-scripts/peekover.js`; one that does is a hard stop and an import-fence failure.**
  ★ Stated honestly rather than as a blanket "unmoved" (Q6 — RULED at gate 3, as proposed): `readerMode.ts`,
  `readerCss.ts`, `watchController.ts` — and `mount.ts`, for 2.2's `chrome` option guard — are shared with
  the content-script graph, so tasks 2.1, 2.2, 4.1, 4.2 (and any CSS
  touch in 3.2 / 5.3) are expected to move that figure by their own small glue. Each such task states the
  delta, decomposes it, and proves by md5 under ablation that it is that glue and nothing else. Every OTHER
  task proves md5 identity against the prior task's build — by md5, never by grep.
- **`.output` ≤ 7 MiB (7,340,032 B)**, ~2.04 MiB headroom at the start.
- **`permissions: []` holds**; `tests/manifest.test.ts` green; manifest **654 / 770 B**; no
  `web_accessible_resources`, no `contextMenus`. A needed manifest edit is an AGENTS.md #4 event and a
  hard stop — none is expected (plan §1).
- **Golden EMPTY, every task** — `git diff tests/golden/output/` empty for the whole milestone (D-C: no new
  parse/sanitize shape; unlike 011, nothing grows).
- **`chromiumFolderSource.ts`, `htmlExport.ts` zero-diff for the whole milestone**, checked by
  `git diff --stat` per task; so are the diagram/math modules and `runReader.ts` / `mountReader.ts` /
  `contentWatch.ts`. **`mount.ts` has exactly ONE authorized diff — task 2.2's additive `chrome` option
  (D-4 re-ruled 2026-10-04) — and is zero-diff in every other task**, checked the same way; a second
  `mount.ts` edit anywhere is a stop-and-flag.
- **Full-suite Verify whenever production code changes**; test-only tasks (5.7) may use the targeted suite
  plus an adjacent-surface spot-check.
- **Zero network by default** — nothing in this milestone is a user-triggered network call; there is no
  network indicator to light because there is no request. **Every HTML string reaching the DOM goes through
  the existing sanitizer**; CodeMirror's chrome is its own DOM construction. **Never a blank page** — every
  §3.7 failure degrades, tested.
- **No CSS rationale inside a template literal** (it ships). **Control characters as `\uXXXX` escapes**,
  with the NUL check in both forms on any task that writes one.
- **The two 2026-09-11 WORKFLOW rules:** the informal eyeball happens when the surface FIRST renders (3.2),
  not at close; near the human-gated close (group 7, and the 5.1 / 5.5 pauses) sessions are short and
  tree/process hygiene is confirmed first.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit.** Stage explicit paths —
  never `git add -A`. Never `--no-verify`. **Never push.**

**§4 EARS coverage:** edit view presented → 3.2 · live preview through the existing pipeline → 3.3 (on 2.2)
· editor responsive while previewing → 3.3 · save writes back (Chromium, granted) → 5.3 · download when
Firefox / not granted → 5.4 · warn before overwriting a changed file → 5.2, 5.3 (floor), 5.6 (ruled UX),
4.2 (hint) · failed save tells and retains → 5.3 · unsaved-changes prompt, both directions → 6.1 · no edit
affordance on the content-script reader → 3.1, 3.2 · CodeMirror cannot load → 2.1, 3.2 · preview fails →
3.3 · no network → 5.7 · no new manifest permission → 1.1, 5.3, 5.7 · ledger states the write honestly →
5.1, 5.3. Every clause has at least one task.

**The three hard sequencing constraints, as enforced:** (1) 1.1 is the sole member of group 1 and the
stated authorization for group 2; no later task assumes the setup choice (★ post-landing: the discovered
1.2 joins group 1 as a dependency-hygiene bump — it measures no CodeMirror arm and changes no setup; 1.1
is still the byte gate). (2) D-4's nested host is 2.2;
the first preview wiring is 3.3; nothing in 3.1–3.2 calls a preview. (3) D-8 is 4.1–4.2; group 5's network
and degrade tests (5.3, 5.4, 5.7) follow them. Group 3's own tests precede group 4 and are fenced by the
unwatched-document rule stated at the head of group 3. ★ *2026-10-06 (`decisions.md`, "M12 RULINGS after
task 4.1"): the discovered **3.4** runs BETWEEN 4.2 and 5.1 — after D-8's two tasks, before the first
save task. It reorders none of the three constraints; its fixtures keep group 3's unwatched rule.*
★ *2026-10-08 (`decisions.md`, "M12 TASK 5.1"): the discovered **1.3** (the katex audit exception) runs
BETWEEN 5.1 and 5.2 — after the sign-off, before the first save task's code. It is group 1's by subject
(dependency hygiene), not by position; it reorders none of the three constraints.*
★ *2026-10-09 (`decisions.md`, "M12 RULINGS R16–R18"): the discovered **4.3** (save-path hardening)
runs BETWEEN 5.4 and 5.5 — after the download exists (its mismatch route IS the download), before the
conflict walk (which should not be walked over a false hint). It is group 4's by subject, not by
position; it reorders none of the three constraints.*

**Count proposed for gate 3: SEVEN groups, 22 tasks** — 1 (1) · 2 (2) · 3 (3) · 4 (2) · 5 (7) · 6 (4) ·
7 (3). Three are human gates (5.1, 5.5, 7.1); two are contingent on a ruling's content (5.6, 6.4); 5.5 is
struck if gate 3 answers Q3 directly. ★ *Post-landing, 2026-10-04: **23 tasks** — group 1 is (2) with the
discovered 1.2 (the audit bump). Gate 3 approved 22; 1.2 is human-scheduled, `decisions.md` M12 TASK 1.1.*
★ *2026-10-06: **24 tasks** — group 3 is (4) with the discovered 3.4 (editor legibility + preview fidelity),
human-ruled and human-scheduled between 4.2 and 5.1, `decisions.md` "M12 RULINGS after task 4.1". 4.2 is
re-scoped by the same entry (R6), not added or struck — the count moves by 3.4 alone.*
★ *2026-10-08: **25 tasks** — group 1 is (3) with the discovered 1.3 (the katex advisory exception, R13
route (i)), human-ruled and human-scheduled between 5.1 and 5.2, `decisions.md` "M12 TASK 5.1". R15
widens 1.3's scope, not the count.*
★ *2026-10-09: **26 tasks** — group 4 is (3) with the discovered 4.3 (save-path hardening, R17),
human-ruled and human-scheduled between 5.4 and 5.5, `decisions.md` "M12 RULINGS R16–R18". R16 widens
6.1's scope, not the count.*

*Gate: this file is a **DRAFT awaiting gate 3** — review material, not a sealed list. Gate 3 approves it,
redlines it, and answers Q1–Q6. **What approval authorizes:** implementation, beginning at **task 1.1, in a
fresh session**, task by task in this order, test-first, one commit per task, the `progress.md` Now-pointer
advancing in that same commit — and nothing before it. **No plan D-value is re-opened, no spec §3.x decision
is re-decided, and no §6 IS-NOT item is proposed here.** The places this file declines to decide are named:
1.1's setup choice (a measurement), the conflict policy (5.5), the debounce interval (6.2 → the human →
6.4), the ledger wording (5.1), and what counts as a material nested-host cost (Q5).*
