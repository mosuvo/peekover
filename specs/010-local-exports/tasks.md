# Tasks 010 — Local exports: HTML/DOCX/PDF export, copy as rich text/HTML/plain text, ZIP export, export shortcut, progress indicator, F5 print mode (M10) — check off in order; add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews these against the plan and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M10 GATE 1** entry (`49feea6`). `plan.md`*
*— gate 2, drafted at `a502ad8`, approved with four rulings and one interpretation note in `decisions.md`'s*
***M10 GATE 2** entry (`33eff72`).* One commit per task (`-F` heredoc, `Co-Authored-By: Claude` trailer); the
*human reviews the pasted evidence and pushes. Each capability gets its OWN real-engine test (`tests/browser/*`,*
*Cr+Fx, red-first + non-vacuous) — never a trailing "add tests" task. Layout, rAF, computed style, pointer*
*geometry, bytes-on-wire, clipboard availability, and cross-context messaging are jsdom-**BLIND**: proven in the*
*real engine, never in jsdom. **★ 010 adds ONE MORE jsdom-blind class no prior milestone had: a document*
*rendered STANDALONE, outside any shadow root, outside the extension origin entirely** (the exported HTML file*
*opened bare, or pasted into a foreign application) — jsdom cannot open a downloaded file or a foreign paste*
*target, so D-3's "renders visually equivalent" claim and D-4's "pastes as formatted content" claim are both*
*real-engine-or-nothing, exactly like the rest of this list.*

**★ Standing invariants — bundle-budget snapshot (AGENTS.md kickoff-standing-invariants rule).** Current
`.output` **4,866,741 / 4,866,857 B** against the **≤5 MiB** bound — **~367 KiB / ~7% headroom**, the thinnest
this project has carried into any gate-1 close (plan §0 D-1). `pnpm zip` **1,470,730 / 1,470,788 B** against
**<2 MB** — **~612 KiB headroom**. `dependencies` **6** (`diff`, `dompurify`, `markdown-it`,
`markdown-it-task-lists`, `mermaid`, `shiki`) — task 1.1 is the ONLY task in this milestone permitted to move
that count, and it moves it by **two** (`docx` + the chosen ZIP writer), pending its own result. Manifest
**654 / 770 B** (Chrome/Firefox), `permissions: []`, no `web_accessible_resources`. **Every task's kickoff
re-states this snapshot at the top of its own standing-invariants block — not only at milestone close — so a
ceiling-breach surfaces before it lands, not at measurement time** (AGENTS.md's own rule, cited so `tasks.md`
does not merely describe it but actually seeds it here for task 1.1 to inherit).

**★ THE FOUR GATE-2 RULINGS — APPLIED HERE, NEVER RE-ARGUED.** Gate 2 is **banked**: `decisions.md`'s
**M10 GATE 2** entry (2026-08-22, `33eff72`) approves `plan.md` as it stands at `a502ad8`, confirms **D-1 …
D-10**, rules plan §8's four questions, and records one interpretation note on D-3. Each is applied **verbatim**
below; none is a plan D-value and none is re-decided here.
- **Ruling 1 · Q1, the ZIP-writer package choice — CONFIRMED.** Task 1 is the right place for the package
  identity decision; no package name is chosen here either. → **task 1.1.**
- **Ruling 2 · Q2, the export panel focus trap (§3.11 row 11) — MATCH THE MOCKUP'S `aria-modal="true"`
  CONTRACT, REUSE `diagramLightbox`'s TRAP/RESTORE BASELINE.** The WCAG 2.1 modal-dialog contract applies; 007
  already built the reusable baseline. → **group 3** (the panel first exists) and **group 8** (the shortcut
  wires into it), asserted wherever the panel itself is built and tested.
- **Ruling 3 · Q3, the `:host()` selector translation for standalone HTML export (risk §4-1) — PRE-SCOPE NOW,
  do not wait for group 2 to discover.** `readerCss.ts` uses `:host` extensively; §4-1's risk is very likely to
  materialize. **Instruction to `tasks.md`, applied:** a first-move verification task inside group 2 checks
  `readerCss.ts`'s actual selector shape **before** the serializer's stylesheet-bundling piece is built. →
  **task 2.1** (new, concretizing the ruling; plan §6's own group-2 text did not yet carry this as a discrete
  task, since the ruling postdates the plan draft).
- **Ruling 4 · Q4, the M9 9.1 toolbar-spacing carry non-reopen (risk 6, §4) — CONFIRMED, SPACING NOT FIXED
  OPPORTUNISTICALLY.** A `display:none` under `@media print` touches `.peekover-code-toolbar`'s selector
  **name**, never its shipped spacing rule **body**. The carry ships as-is. → **task 6.1**, whose Verify
  contract states this as an explicit, checkable, additive-only diff constraint (see task 6.1 below — no task
  in this file touches the spacing declarations).
**One interpretation note — D-3, "CSS inlined" — applied, not re-argued.** "CSS inlined" (spec §1) is read as
"the stylesheet is embedded in the export" (a bundled `<style>` block), never per-node inline `style`
attributes. → **group 2**, `wrapInStandaloneDocument`'s own construction.

**Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **spec §3.1–§3.10**, sealed at gate 1, with the three §9 rulings preserved by silence: **Ruling 1 · §9-1** —
  DOCX math ships as plain source text (F2 math is 0%, no renderer exists even for the conceded image
  fallback) · **Ruling 2 · §9-2** — Ctrl/Cmd+S is app-page-only, permanent · **Ruling 3 · §9-3** — ZIP/HTML
  export embeds only locally-resolvable images; a remote image stays a remote reference, unrewritten. **The
  gate-1 provisional condition** — approval is conditional on task 1.1 clearing headroom before any dependency
  is treated as usable — is a **hard sequencing constraint**, restated at task 1.1 and nowhere re-argued.
  ★ **SUPERSEDED IN PART, 2026-08-29 (M10 §3.1 gate, `decisions.md`) — Ruling 3's own text above is kept
  verbatim as the sealed gate-1 record, but its "embeds only locally-resolvable images" half no longer
  describes what M10 ships: local-image embedding was ALSO dropped, so M10 now embeds NO images (local or
  remote) in HTML export — only Ruling 3's remote-stays-unrewritten half remains active, and only for HTML
  export, since ZIP export itself is struck (M10 §3.1(cont.), below). See task 3.1, amended below.**
- **plan D-1 … D-10**, sealed at gate 2. **Every task names the D-values it services.** ★ **Each D-value's
  `decisions.md` entry text is ALREADY WRITTEN in `plan.md` §0 and is applied VERBATIM — never re-authored —
  landing with the commit that implements it, never after** (plan §0's own rule). ★ **This is the discipline
  M9 itself named as its own gap at close: none of D-1…D-13's thirteen pre-written entries ever landed with an
  implementing commit** (`decisions.md` 2026-08-15 M9 GATE 2 entry's own audit, confirmed at M9 9.3). Every
  task below states its D-value(s) in a trailing bracket **and** names which `decisions.md` entry text lands
  with that task's own commit — the layer this milestone adds so the gap is not repeated a second time.
- **spec §6's IS-NOT list is a fence:** the four publish paths (Gist, GitHub repo, Medium, Dev.to — deferred to
  M11 on a routing decision) · every other F5/F9 item · every other F-area · a content-script export surface ·
  per-document export preferences · version history as an export source. **No task proposes any of them.**

**Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism (M6 retro
finding 9's own conclusion):**
- **Golden pin:** `git diff tests/golden/output/` **EMPTY, every task, no exception.** Unlike every prior
  milestone, 010 has **no task that could plausibly need a new golden fixture** — every export/copy/print
  action runs off the already-committed, already-rendered DOM (spec §5's own NFR), never the
  `sanitize(parse(source))` path the suite snapshots. An empty golden diff proves nothing about export
  correctness (the same standing correction 006–009 all state) — placement/content is guarded by each task's
  own structural and real-engine assertions.
- **Manifest pin:** `tests/manifest.test.ts` green, **654 / 770 B** on the two built manifests, byte-unmodified;
  `permissions: []`; `web_accessible_resources` **absent**. A needed manifest edit is an AGENTS.md #4 event and
  a **hard stop** — plan risk 5 names exactly the condition that would force one (either export library's
  bundler output needing that key to lazy-load into the content-script graph), and no task in this file may
  resolve that condition by adding the key silently.
- **Content-script bytes — byte-identical for the WHOLE MILESTONE, and it is a STRUCTURAL property, not a
  contingent one (D-2).** Export chrome never goes through `mount()` and never enters the content-script
  module graph at all — there is no "the wrong surface" case to prove absent (plan §3.11 row 1's own note),
  only a **confined-diff proof that `mount.ts`, `mountReader.ts`, `runReader.ts`, and `contentWatch.ts` are
  byte-untouched, every task, checked by md5 against the pre-task build**, never by grep (the standing M6
  retraction: an identifier grep over a minified bundle proves nothing about whether code shipped).
- **App-page bytes move starting at task 1.1** (the two dependencies land) **and every task from 1.1 on states
  its own delta against the immediately-prior task's own measured figure** — never against a milestone-start
  baseline alone, since D-1's thin headroom makes drift-by-accumulation the real risk this milestone carries
  that no prior one did. Full ablation-proven decomposition to a named residual is **group 10's job**; earlier
  tasks state raw deltas only.
- **Revert-and-fail (M6 finding 5) is the standard, not an option:** every regression test is verified red
  **with the defect's own signature in the defect's own units**. No revert-and-fail, task unfinished.
- **A positive control that FIRES (M6 finding 1)**, named in the Verify line and asserted **in the same test**,
  under the same conditions the negative claim disclaims. **D-8's already-wired remote-image restore mechanism
  (`remoteMediaUi.ts:77`) is this milestone's own ready-made positive control for the zero-network guard** —
  reused as the firing control, not constructed fresh, provided the control's own invocation never routes
  through 010's own export/copy code (it must not — see task 9.1).
- **Perf: A-B-A against a same-session control, FLOOR reported beside MEDIAN** (M6 finding 7), quiesced, where
  timing is asserted at all. ★ **010 does not touch the app-page or content-script FIRST-PAINT render path at
  all** — every export/copy/print action runs off explicit user action, never on render (spec §5's own NFR,
  plan risk 8) — so the standing first-paint baselines (content-script 26.9/29.9 ms headroom; app-page 90.8–
  96.3 ms median / 86.2–88.1 ms floor, Ruling 4 of M9's own gate 2) are **carried, not re-measured, and no task
  in this file re-runs either harness.**
- **CSS rationale lives in the TypeScript doc comment ABOVE the template literal, never inside the string** (M6
  finding 9 — the minifier cannot strip what is inside the backticks; `readerCss.ts` is on **both** graphs).
  **Every token is verified against all three theme blocks before use** — the standing discipline unbroken
  since 006, re-run here because 010 is the first milestone to add a genuinely new CSS surface (`@media print`)
  since 009. **No `ch` unit in any layout-blocking property** (M6 finding 6).
- **`docs/trust/PERMISSIONS.md` gains exactly ONE field name in the EXISTING settings row** (D-6, task 8.2) —
  no new row, nothing new stored, no new capability (D-8/Ruling 3 mean no new network path exists to disclose).
  If a task needs more than that, it is a **stop-and-flag**.
- **NUL check on any task that writes a control character** (none is currently anticipated in 010's own
  strings, unlike 009's fence-meta escaping — stated so a task that DOES introduce one does not skip the
  check by assuming the milestone is exempt): `tr -d -c '\000' < f | wc -c` **and**
  `python3 -c "print(open(F,'rb').read().count(b'\x00'))"` — **both forms, every time**, never a grep.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit**; group 11's 11.3 is its final
  reconciliation. **Stage explicit paths — NEVER `git add -A` / `git add .`**

**★ THE §3.11 SIBLING-CHECKLIST AUDIT — ROUTED HERE, BEFORE THE FIRST TASK BELOW READS IT.** The audit is a
**discharged plan deliverable** (`plan.md` §3.11, 14 rows, `storagePanelOverlay` as the primary sibling per
D-2's own shape match — export chrome is an overlay panel, not an inline pill). `tasks.md` **consumes** it, and
**no export-chrome browser test is written before the row it discharges is read from it** (M6 retro finding 4,
plan §6's own hard sequencing constraint). Routing:
- rows 3, 4, 5 (overlay mechanics, `storagePanelOverlay`'s own shape, inherited **Y**) → **task 3.2** (the panel
  itself first exists there) · rows 6, 7, 8 (button/name/decorative) → **task 3.2** and re-checked at **4.1**,
  ~~**5.1**~~ (struck, §3.10 — no DOCX row to re-check), **8.1** for each control those tasks add to the same
  panel · row 9 (polite live region) →
  **task 8.3** (the progress indicator) and **task 9.1** (completion/failure state for every action) · row 10
  (reduced motion) → **task 8.3** if the progress indicator animates, **task 9.1** for any copy-confirmation
  transition · row 11 (focus trap and restore, Ruling 2) → **task 3.2**, the panel's own open/close · row 12
  (zero-network with a firing control) → **task 9.2**, across every export/copy/print path in one test · row 13
  (`describe.each` both surfaces) → **`—`, out**, stated at first use: export chrome never reaches the
  content-script graph (D-2), so there is no second-surface arm to assert, unlike every prior milestone's own
  row 1/23 · **rows 1 and 2 → `—`, out**, for the reasons plan §3.11 itself states (no `mount()` seam to prove
  absent from; no per-document capability gate to prove chrome grows from) · row 14 (progress indicator, the
  shortcut's own confirmation, and Copy-as-HTML/plain-text having no sibling suite) → **tasks 3.1, 3.3, 8.1,
  8.3**, each establishing its own baseline, enumerated not transcribed.

**Human-run items budgeted UP FRONT (plan §5, not discovered late) — enumerated in 11.1's Verify, not
rediscovered there:** whether the export panel reads as discoverable or as clutter (008/009's identical
question, transplanted a third time) · print/PDF output legibility against a real long document · which
default export format feels right for a first-ever Ctrl+S (§8 M-1) · the heavy-document progress threshold
(§8 M-2) · print header/footer content and layout (§8 M-3) · **Firefox everything** · **zero unexpected network
with the Network tab open** · **at least one WIDE viewport recorded like an engine** (M6 finding 2). **Plus one
human decision gate:** 10.4 — M-1's format, M-2's threshold, M-3's header/footer content, and group 6's `@page`
fidelity go/no-go if group 7's fallback question is live.

---

## 1 — The measurement (D-1 — HARD GATE, approval-conditional per gate 1's provisional condition)

- [x] **1.1 Install `docx` + the chosen ZIP writer FOR REAL, decompose the delta, verify governance for both.
      THE FORK IS EXPLICIT: this task cannot fail silently into task 2.1 (D-1; Ruling 1).** Resolve the
      ZIP-writer package identity first (Ruling 1: task 1's own decision, current registry landscape — size,
      maintenance, licence — not `spec-coverage.md`'s `jszip` working assumption, taken on faith). Install both
      for real; build; measure the app-page chunk and `.output`/`pnpm zip` deltas; decompose to named
      components per D-1's own mechanism text: (a) `docx`'s own weight, (b) the ZIP writer's own weight, (c)
      any transitive weight either pulls in unexpectedly (009's `katex`-via-`mermaid` finding is the standing
      example this line exists for), (d) Peekover's own glue code — **none exists yet at this task**, so (d)
      should read zero; a non-zero (d) here is itself a finding. Each ablated with a firing control, never
      grepped.
      Files: `package.json` · `pnpm-lock.yaml`
      Verify: `Object.keys(pkg.dependencies).length === 8` and the two new names are `docx` and the chosen
      writer, asserted not eyeballed. `pnpm audit --prod` clean at **0** advisories (blocking) for **both**.
      Licence and install-script absence confirmed against the installed packages, not memory, for both. SBOM
      regenerated. **Content-script bytes md5-identical to HEAD** (D-2 — neither library is a content-script
      concern by construction; proven, not assumed, with the firing control: touch one reachable byte, rebuild,
      md5 moves, revert). App-page and `.output`/`pnpm zip` deltas stated against the snapshot above
      (**4,866,741 / 4,866,857 B**; **1,470,730 / 1,470,788 B**), decomposed to (a)–(d). ★ **ACCEPTANCE IS A
      FORK, STATED AS SUCH IN THE COMMIT MESSAGE, NOT IMPLIED:** **EITHER** the decomposed delta fits inside the
      ~367 KiB / ~612 KiB headroom against the ≤5 MiB / <2 MB bounds, and task 2.1 may proceed, **OR** it does
      not, and every remaining task in this file is **SUSPENDED** — the commit states the fork's outcome
      explicitly, and if the second branch is taken, the commit is the LAST one in this milestone until a
      human-reviewed spec revisit (subset/lazy-split per spec §3.10, or scope reduction) reopens it. Golden
      EMPTY · manifest green **654 / 770 B** · `permissions: []` both. [D-1; Ruling 1; §3.10; the provisional
      condition]

*Group-1 acceptance (plan §6, gate-1's own condition): the delta fits and is decomposed to named components,
or the fork is taken and stated as a hard stop — either is a valid close, only the first authorizes group 2.*

## 2 — The shared serializer (D-3 — and Ruling 3's pre-scoped `:host()` verification)

- [x] **2.1 ★ FIRST-MOVE VERIFICATION, PER RULING 3 — `readerCss.ts`'s actual selector shape, checked BEFORE
      the exporter is built, not discovered by it.** `grep -n ":host" src/theme/readerCss.ts`, enumerated: every
      `:host(...)`-scoped rule is a rule that will NOT resolve inside a standalone exported document (no shadow
      root, no custom element), per plan risk §4-1. Produces one of two findings, stated plainly, neither chosen
      by assumption: **(a)** the shipped stylesheet's presentation-relevant rules are NOT meaningfully
      `:host`-scoped (e.g. the scoping is only on the outermost rule and inner selectors are plain), and direct
      reuse of the exported stylesheet text holds D-3's "no new anything" framing; **or (b)** they are, and a
      **translated** copy (a plain top-level selector set, generated or hand-derived) is real, reviewable new
      code that 2.2 must build, changing D-3's framing — flagged back to gate 3 review at THIS task's own
      commit if so, not built silently.
      Files: none (a read-only investigation; its finding is recorded in the task's own commit message and
      referenced by 2.2)
      Verify: the grep's full output pasted into the task report; the finding stated as (a) or (b) with the
      reasoning. If (b), the commit message names the translation as new scope for 2.2, not a silent addition.
      Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [Ruling 3; plan risk §4-1]

- [x] **2.2 `serializeReaderDocument` + `wrapInStandaloneDocument` — clone, resolve local images, bundle the
      stylesheet (translated per 2.1's finding, or verbatim) (D-3).** `column = host.shadowRoot.querySelector(
      '.peekover-reader')`; `clone = column.cloneNode(true)` — already-sanitized nodes, never re-parsed, never a
      new HTML string until serialized AFTER cloning (AGENTS.md #3 satisfied by construction, no new sanitizer
      surface). `collectLocalImages(clone)` walks `<img>`, resolves through the open folder's existing read path
      (`folderSourceFromHandle`/`FolderSource.read()`, the 009 D-1 harness's own citation of this mechanism —
      no new file-read capability). `wrapInStandaloneDocument(clone, READER_STYLESHEET_TEXT)` embeds the
      stylesheet per D-3's interpretation note — a bundled `<style>` block, never per-node inline styles.
      Files: `src/export/htmlExport.ts` · `src/export/htmlExport.test.ts`
      Verify: (**unit**) the clone mutates nothing on the live tree (a reference-identity check against the
      original `.peekover-reader` subtree, pre/post); every collected image resolves to the correct local path,
      over a fixture with nested/relative paths; the stylesheet embedding is byte-for-byte against
      `readerCss.ts`'s exported text (or its translated form, if 2.1 found (b) — asserted against THAT form,
      not the raw text). (**tests/browser** — Cr+Fx) ★ **D-3's structural claim, real-engine or nothing**: the
      exported document, opened standalone (no extension loaded, a bare `file://` or `data:` document), renders
      **visually equivalent** to the reader — the qualitative check that 2.1's finding was handled correctly,
      not merely produced. App-page bytes stated against 1.1's own post-install figure, decomposed to this
      task's own glue weight. Content-script bytes md5-identical (D-2). Golden EMPTY · manifest green
      **654 / 770 B** · `permissions: []`. [D-3; §7-1; plan risk §4-1]

*Group-2 acceptance (plan §6): the `:host`-selector risk resolved one way or the other, not left open; a
standalone-render check passes.*

## 3 — HTML export, Copy-as-HTML, Copy-as-plain-text, ~~ZIP export~~ (D-3 consumed, D-4's HTML/plain-text
halves) — **ZIP export (3.5) STRUCK, 2026-08-29, M10 §3.1(cont.) — see below**

- [x] **3.1 HTML export — the file-download exit. ★ REDUCED, 2026-08-29 (M10 §3.1 gate, `decisions.md`):
      local-image Base64 embedding is DROPPED from this task, by human ruling via scope reduction — not
      built, not deferred-silently.** `exportHtml(host, basename)`: 2.2's `{clone, theme}` — the `images`
      field / `collectLocalImages` the pseudocode above still named is not merely unconsumed here, it is
      REMOVED at this task's own implementation, per `decisions.md`'s own orphan-removal recommendation (see
      LANDED note below); `downloadAs(wrapInStandaloneDocument(clone, theme), '${basename}.html')`. Every
      `<img>` — local or remote — ships in the export exactly as `serializeReaderDocument`'s clone carried
      it: untouched, no rewrite, no embed. A local `![](./x.png)` is broken in the export the SAME way it is
      already broken in the app-page reader today (the ruling's own D1 finding) — not a new regression.
      Rendered DIAGRAMS are unaffected (D2): they are live `<svg>` in the cloned DOM already, never an
      `<img>` needing embedding.
      **No sibling suite for a download-triggering control exists in this codebase** (plan §3.11 row 14) —
      established here.
      **★ LANDED, 2026-08-29.** `basename` is a plain string parameter (the caller's job to supply — the
      currently-open document's own name; 3.2's own wiring, not yet built) rather than derived from a
      `documentPath`, since image-path resolution (the only reason `serializeReaderDocument` took a path
      before) is gone. `downloadAs` did not exist; built following `diagramView.ts`'s `downloadDiagramAsSvg`
      shape verbatim (`Blob` + `URL.createObjectURL` + a synthetic, document-appended `<a download>` click +
      deferred `revokeObjectURL`) — the same real-engine-tested pattern, cited as standing precedent rather
      than re-earning its own jsdom ablation. The `collectLocalImages` removal cascade (FOLD, per the
      ruling's own recommendation) landed in this same commit: `LocalImageRef`, `collectLocalImages`,
      `resolveRelativePath`, `isAbsoluteUrl`, the `images` field, and `serializeReaderDocument`'s
      `documentPath` parameter are all gone; `htmlExport.test.ts`'s 5 `collectLocalImages` tests were
      dropped (unit count 1060→1055, both known `codeDetect` corpus-drift failures unchanged); task 3.3's
      stale `{clone, images}` reference and `plan.md:172-174`'s stale "remains as shipped" claim were
      corrected as necessary ripple. App-page chunk **475,579 B — confirmed UNCHANGED** (byte-identical
      build output, same chunk hash) — nothing in `src/app`/`entrypoints` imports `htmlExport.ts` yet (3.2
      is the first consumer); content-script md5 byte-identical both engines; `.output` **4,866,741 /
      4,866,857 B**, `pnpm zip` **1,470,730 B** — all unchanged; `dependencies` still **6**.
      Files: `src/export/htmlExport.ts` · `tests/browser/htmlExport.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) the downloaded file, opened standalone, renders visually equivalent
      to the reader for its TEXT/CSS/diagram content (2.2's own claim, re-proven at the file-download exit
      specifically, since a clipboard write and a file write are different browser codepaths) — ~~every local
      `<img>` becomes a `data:` URI, byte-verified against the source file's own bytes (no lossy re-encode)~~
      **struck, §3.1 gate: no Base64 embedding to verify.** A local-image fixture's `<img src>` is asserted
      UNCHANGED (broken-reference passthrough), not embedded — the reduced scope's own positive assertion,
      not merely an absence. ★ **§3.11 rows 3–5** (out-of-flow, the trigger itself, zero residual footprint
      after the action completes) asserted against whatever control triggers the download — if that control
      is the export panel, deferred to 3.2's own panel test rather than duplicated; if not, asserted here.
      Content-script bytes md5-identical. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`.
      [D-3; §4 HTML export; row 14; §3.1 gate ruling]

- [x] **3.2 The export panel — `exportControls.ts`'s overlay, `storageControls.ts`'s wiring shape, Ruling 2's
      focus trap (D-2, Ruling 2). ★ LANDED, 2026-08-29 — Q1 RESOLVED (a): this task wires HTML export's row
      live (3.1's `exportHtml`, the first `htmlExport.ts` import into the app graph, app-page chunk
      475,579 -> 483,331 B, +7,752 B both engines); the other 4 rows render as real, accessibly-named
      `<button>`s that are `disabled`, pending 3.3/3.4/4.1/6.1-7.1's own wiring. Q2 RESOLVED: `exportToggle`
      is DISABLED (not hidden) while `activeFile == null`, mirroring `__cta`/`__pin`'s own disabled-not-
      hidden language. Full reasoning, the byte decomposition, and D-2/D-10(panel half)/Ruling 2's own
      implementing entries are in `decisions.md`'s 2026-08-29 M10 D-2/D-10/Ruling-2 (task 3.2) entry.**
      `createExportView(...)`, wired in `appShell.ts` beside the existing
      `createStorageView(...)` call, the same builder shape reused verbatim: a pure `(doc, opts) → {element}`
      function rebuilt on every open, mounted through `appShell.ts`'s existing slot pattern
      (`storagePanel.replaceChildren(view.element)` to open, `storagePanel.replaceChildren()` to close) —
      `appShell.ts` owns the open/close state and the trap lifecycle, `createExportView` itself is stateless,
      exactly mirroring `createStorageView`'s own shape.
      The mockup's `#exportsOverlay` (`design/mockup.html:861-874`) is the design language to carry, corrected
      for what M10 actually ships. Of its **7 rows, 4 are dropped**: Word/DOCX (struck in full at task 5.1,
      §3.10 gate ruling, 2026-08-24) and ZIP bundle (struck in full at task 3.5, §3.1(cont.) gate ruling,
      2026-08-29), plus the two out-of-scope publish rows (Gist, Medium/Dev.to). D-10 itself only instructs
      dropping the 2 publish rows — DOCX and ZIP were still in scope when D-10 sealed at gate 2 (2026-08-22);
      their strikes landed later, so this task drops 4 rows total, not 2, joining the 2 publish rows already
      named. The **5 surviving actions** the panel actually offers: HTML file (task 3.1), Copy-as-HTML (task
      3.3), Copy-as-plain-text (task 3.4), Copy-as-rich-text (task 4.1), PDF (tasks 6.1/7.1).
      **The mockup is also incomplete against that surviving set** — D-10's own plan-time finding (`plan.md`
      §0/D-10) already notes it draws no row for Copy-as-HTML or Copy-as-plain-text, only Copy-as-rich-text.
      Those 2 rows are NET-NEW at this task, designed in the mockup's visual language (icon glyph + subtext)
      rather than transcribed from it, alongside the 3 rows (HTML, PDF, rich-text) the mockup does draw.
      "Carry the mockup" means carry its visual language for the 5 surviving actions, not transcribe its list.
      `role="dialog" aria-modal="true"`. Ruling 2's focus trap is discharged by COPYING the inline shape
      `diagramView.ts`'s `openDiagramLightbox` already uses (its own `keydown` closure, its own
      `lightboxStops()` tab-stop scan, restore via `trigger.focus()` guarded by `trigger.isConnected`) — no
      shared trap helper exists anywhere in the tree, and extracting one is OUT OF SCOPE here (rule-of-three:
      `diagramLightbox` plus this panel is two call sites, not three; flag a future extract only if a third
      trap appears).
      Files: `src/app/exportControls.ts` · `src/app/appShell.ts` (panel-chrome tokens land in `appShell.ts`'s
      own `LIGHT_TOKENS`/`DARK_TOKENS` blocks — **2 blocks, no sepia arm** — applied to `.${SHELL_CLASS}` in
      app-page DOM. NOT `readerCss.ts`: every one of its tokens is `:host`-scoped inside the reader's shadow
      root and, by its own header comment, never reaches the host page. The export panel is app-page DOM
      outside any shadow root (D-2), same as `storageControls.ts`'s existing panel, which already falls back
      through this exact app-page cascade — `var(--panel,#F4F4EF)` — the precedent this panel's chrome CSS
      matches. `readerCss.ts` is dropped from this task's Files list; it was listed only
      for panel tokens, and touching it would ship chrome tokens nothing in app-page DOM can read — silent
      fallback to CSS literals, sepia untheming, both invisible short of a real-engine check.) ·
      `tests/browser/exportPanel.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) ★ **§3.11 rows 3, 4, 5** (`storagePanelOverlay`'s own shape, inherited
      **Y**): out of flow, the page under it does not move; anchored at its own trigger; closing returns the
      slot to zero footprint. ★ **Row 11, Ruling 2's own ruling, real-engine or nothing**: opening the panel
      traps focus inside it (Tab/Shift+Tab cycle within, never escape to the document behind); closing restores
      focus to the triggering control — asserted against `diagramLightbox`'s own existing test shape, reused not
      re-derived. **Row 6** (every row a real `<button>`, keyboard-operable, no `tabindex` of its own) and
      **row 7** (accessible name carrying selection AND action — *"Export as HTML,"* never a bare icon glyph,
      since the mockup's own icon-glyph rows `:866-870` are a visual reference only) for whatever controls this
      task's own shell contains (the export ROWS themselves land at **3.1, 3.3, 3.4, 4.1, 6.1/7.1** — the 5
      surviving actions above; DOCX/ZIP have no row left to re-check, both struck in full — this task tests the
      PANEL, re-checked per-row at each of those). Content-script bytes md5-identical (D-2 — the panel is
      app-page DOM outside any shadow root, by construction, `mount.ts` diff **EMPTY**, asserted as a confined
      diff). Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-2, D-10; Ruling 2; §3.10;
      §3.1(cont.); §4 Trust; rows 3, 4, 5, 11]

- [x] **3.3 Copy-as-HTML — the clipboard exit, SAME artifact as 3.1, different sink (D-3, D-4's HTML half).
      ★ LANDED, 2026-08-29 — the copy-html row goes live (2nd row wired, after 3.2's HTML row); the
      same-artifact/cross-sink check compares REAL sink outputs (a captured `ClipboardItem` Blob vs the real
      downloaded file) rather than the real OS clipboard, per a measured finding: the native `text/html`
      clipboard format is lossy on BOTH engines (Chromium discards structure into computed-style-inlined
      fragments; Firefox reformats whitespace and drops `<meta charset>`) — reading it back would prove a
      different, irrelevant claim. Full reasoning in `decisions.md`'s 2026-08-29 M10 D-4 (task 3.3) entry.**
      `copyAsHtml(host)`: 2.2's `{clone}` (SAME call as 3.1 — no second serialization path; the `images`
      field named here previously was removed at task 3.1, §3.1 gate ruling — no image resolution left to
      share); `doc = wrapInStandaloneDocument(...)` (SAME bundled stylesheet as the file export —
      spec §4's own line: *"the system shall write the SAME standalone HTML §4's HTML-export criteria
      describe, to the clipboard rather than to a file"*); `await navigator.clipboard.write([new ClipboardItem({
      'text/html': ..., 'text/plain': plainTextOf(clone) })])` (D-4).
      Files: `src/export/htmlExport.ts` · `src/app/exportControls.ts` · `tests/browser/copyAsHtml.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) the clipboard `text/html` payload is byte-identical to 3.1's own
      exported file's `outerHTML` (asserting they are the SAME artifact, not two independently-built ones); the
      `text/plain` fallback carries readable plain text. **Permission-free, re-confirmed**: `navigator.clipboard
      .write()` needs no `clipboardWrite` permission because every copy here is triggered by an explicit click
      (transient activation present by construction) — cited to the same MDN finding 007/008 already verified,
      re-applied per D-4's own text, not re-fetched a third time. Golden EMPTY · manifest green **654 / 770 B**
      · `permissions: []`. [D-3, D-4; §4 HTML export, copy actions]

- [x] **3.4 Copy-as-plain-text — `navigator.clipboard.writeText()`, the already-permission-free path (D-4).**
      Reuses 008 D-10's shipped mechanism verbatim, payload is the document's raw markdown source (§4: *"copy
      the raw source text exactly as authored"* — the retained-source-of-truth pattern 007 D-15/009 D-6 both
      establish, read directly, never re-derived from rendered DOM).
      Files: `src/export/htmlExport.ts` (or a small sibling if the raw-source read does not belong in the HTML
      exporter — task-time judgment, confined either way) · `src/app/exportControls.ts` ·
      `tests/browser/copyAsPlainText.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) the clipboard's plain-text payload is byte-identical to the document's
      original source, over a fixture with unicode, trailing whitespace, and mixed line endings (the same
      hostile-fixture discipline 009 4.2 used for its own retained-source claim). Golden EMPTY · manifest green
      **654 / 770 B** · `permissions: []`. [D-4; §4 copy actions]

**★ TASK 3.5 IS STRUCK, 2026-08-29 (M10 §3.1(cont.) human ruling, `decisions.md`) — ZIP export is DROPPED FROM
M10 ENTIRELY, downstream of the §3.1 local-image ruling immediately above. Shorn of local images, ZIP export
was near-redundant with 3.4's Copy-as-plain-text (same raw markdown source, a different exit) and not worth
its own task. Full reasoning banked in `decisions.md`'s 2026-08-29 M10 §3.1(cont.) entry — cited here, not
re-argued. Kept struck-in-place, not deleted, mirroring task 5.1's own whole-task strike (§3.10) — the
milestone's 22-task / 11-group audit trail stays intact.** Group 3 is now **4 active tasks** (3.1–3.4), not
5; active count for M10 moves **21 → 20** (see the count restated at the group ordering / count block below).

- [ ] ~~**3.5 ZIP export — raw markdown source, NEVER the rendered/sanitized HTML. ★ REDUCED, 2026-08-29 (M10
      §3.1 gate, `decisions.md`): local-image file-copying is DROPPED from this task, by human ruling via
      scope reduction — not built, not deferred-silently. ★ FLAGGED, NOT SILENTLY COLLAPSED: the remaining
      scope is genuinely thin — see `decisions.md`'s 2026-08-29 M10 §3.1 entry's own flag, and confirm at
      task time whether this still stands as its own task or folds elsewhere before implementing.** Shorn of
      image copying, `zipExport(host)` packages the byte-identical markdown source into a `.zip` archive.
      ~~reuses `collectLocalImages`'s resolution logic only (2.2) — ships the markdown source plus resolved
      local image files, paths rewritten to the archive's layout~~ **struck, §3.1 gate: no local image files
      to resolve or copy — `collectLocalImages` is not consumed here (see the orphan note in `decisions.md`'s
      2026-08-29 M10 §3.1 entry).** **Both local and remote image references stay exactly as authored,
      unrewritten, per §3.1's ruling (local) and per the still-standing half of Ruling 3 (remote)** — not
      fetched, not embedded, not silently dropped, just untouched.
      Files: `src/export/zipExport.ts` · `src/app/exportControls.ts` · `tests/browser/zipExport.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) the produced archive contains the exact markdown source (byte-
      identical), extracted and re-opened correctly. ~~and every locally-resolvable image, at rewritten paths
      that resolve correctly when the archive is extracted and the markdown is re-opened~~ **struck, §3.1
      gate: no image files ship.** ★ **Ruling 3's remote half, re-checked not re-argued**: a remote-image
      fixture produces an unrewritten remote reference in the ZIP'd markdown, never a fetch attempt — the
      zero-network guard's own positive control for this task (see 9.2 for the milestone-wide version; this is
      the per-task instance). A local-image fixture likewise produces an unrewritten local reference (§3.1's
      own new assertion, mirroring 3.1's). App-page bytes stated against 3.4's own figure, decomposed.
      Content-script bytes md5-identical. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`.
      [D-3; §4 ZIP export; Ruling 3; §3.1 gate ruling]~~ **STRUCK — see the note above and `decisions.md`
      M10 §3.1(cont.).**

*Group-3 acceptance (plan §6): §4's HTML/copy criteria; §3.11 rows 3–7, 11, 14 for these controls and the
panel that hosts them. ~~ZIP~~ **struck, M10 §3.1(cont.) — no ZIP-export criteria to accept.**

## 4 — Copy-as-rich-text (D-4's ClipboardItem construction, confirmed against current docs at task time)

- [x] **4.1 Copy-as-rich-text — a DIFFERENT payload from 3.3's Copy-as-HTML, and the difference is load-bearing
      (D-4).** Spec §3.2's own persona line is explicit: pastes cleanly into Google Docs/Word *"without carrying
      the reader's own styling along with it"* — unlike 3.3, which deliberately DOES carry the full bundled
      stylesheet (spec §4: *"the SAME standalone HTML §4's HTML-export criteria describe"*). So this task's
      `ClipboardItem`'s `text/html` payload is the cloned column's **semantic markup alone** (headings, lists,
      emphasis, tables — no `<style>` block, no reader theme colors), so the paste target's OWN default styling
      applies, not the reader's dark/sepia/paper theme. **The exact `ClipboardItem` multi-entry construction
      (`{'text/html': blob, 'text/plain': blob}` in one object) is re-confirmed against current Clipboard API
      docs at this task, per AGENTS.md's standing rule** — D-4's own text states the plan gives the shape, not
      the verbatim call.
      Files: `src/export/htmlExport.ts` (a second, lighter serialization path — or a clearly-named sibling
      module if sharing `serializeReaderDocument`'s clone-and-collect with 2.2 but skipping the stylesheet-wrap
      step reads better as its own function; task-time judgment, confined) · `src/app/exportControls.ts` ·
      `tests/browser/copyAsRichText.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) the clipboard `text/html` payload carries NO `<style>` element and no
      reader-theme-derived inline colors — asserted as a structural check on the payload string, not eyeballed;
      pastes as formatted content into a real rich-text target (or the closest real-engine equivalent this
      suite's existing clipboard tests already drive), on both engines — the standard-word-processor criterion,
      real-engine or nothing. `text/plain` fallback present. ★ **The `file://`-secure-context residual 008
      D-10 named for its own clipboard work is RE-CHECKED for this payload shape specifically**, not assumed
      transferable — `navigator.clipboard` requires a secure context and MDN's own `file://` wording is hedged.
      Content-script bytes md5-identical (D-2 — this copy action is app-page-only). Golden EMPTY · manifest
      green **654 / 770 B** · `permissions: []`. [D-4; §4 copy actions; §7-2]

*Group-4 acceptance (plan §6): pastes as formatted content on both engines; the `file://` secure-context
residual re-checked for this specific payload shape.*

## 5 — DOCX export (Ruling 1's plain-source-text math handling) — ★ STRUCK, §3.10 human ruling, 2026-08-24

**★ GROUP 5 / TASK 5.1 IS STRUCK — DOCX export is DROPPED FROM M10 by human ruling at the §3.10 gate,
resolving D-1's BUSTS fork via SCOPE REDUCTION. Full reasoning, arithmetic, and the fork's resolution are
banked in `decisions.md`'s M10 §3.10 entry (2026-08-24) — cited here, not re-argued. Ruling 1 (§9-1, DOCX
math as plain source text) is correspondingly DEFERRED-WITH-DOCX, not resolved. Kept struck-in-place, not
deleted, so the milestone's 22-task / 11-group audit trail stays intact — this is the first post-seal,
mid-implementation strike this repo has made, and no precedent existed for deleting one.** Active task count
for M10: **21** (22 − struck 5.1); active group count: **10** (11 − group 5, whose only task was struck).
Group 2 and every group below it are RE-AUTHORIZED to proceed under normal per-task byte discipline — no
special gate — per the same §3.10 entry.

- [ ] ~~**5.1 `docxExport.ts` — heading/list/table/emphasis mapping, diagram embed via `diagramView.ts:298`'s
      existing capture, math as plain source text per Ruling 1.** Walks the cloned column (2.2's clone
      mechanism, reused for structure though `docx`'s own document-builder API is the output target, not HTML
      serialization) into the installed `docx` library's node types. Diagrams: reuse `diagramView.ts`'s existing
      `canvas.toBlob` capture (`:298`, already shipped for 007's copy-as-image) — no new rendering path. Math:
      **per Ruling 1 (banked, not re-argued), ships as plain source text, explicitly labeled** — never silently
      dropped (spec §4: *"shall never silently drop content without indicating that it was omitted"*).
      Files: `src/export/docxExport.ts` · `src/export/docxExport.test.ts` · `tests/browser/docxExport.browser.test.ts`
      Verify: (**unit**) heading levels, ordered/unordered lists, tables, bold/italic/code-span emphasis each
      map correctly over a representative fixture set — asserted against the `docx` library's own installed
      shape (confirmed at 1.1, not assumed from documentation alone, mirroring 009 1.2's "confirm the real
      return shape before writing code against it" discipline). (**tests/browser** — Cr+Fx) a diagram-bearing
      fixture embeds the diagram as a raster image in the produced `.docx`, opened and visually confirmed. A
      math-bearing fixture (`$...$` or a fenced math block, whichever this corpus uses) produces plain source
      text in the output, **never silent omission** — asserted by opening the produced file and confirming the
      math source string is present as text. App-page bytes stated against 4.1's own figure, decomposed —
      `docx`'s own runtime weight was already priced at 1.1; this task's delta is glue only. Content-script
      bytes md5-identical. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [Ruling 1; D-1;
      §4 DOCX export]~~ **STRUCK — see the group header above and `decisions.md` M10 §3.10.**

*Group-5 acceptance — N/A, struck. DOCX export's §4 criteria no longer apply to M10; the never-silently-
drop-content clause struck with it (DOCX was the only control that clause's math-source-text handling served).*

## 6 — Print mode + the `@page` fidelity probe (D-7)

- [x] **6.1 F5 print mode — `@media print` rules in `readerCss.ts`, chrome-hiding only; the `@page` margin-box
      fidelity probe feeding group 7's go/no-go; Ruling 4's non-reopen respected as an explicit, checkable
      constraint (D-7).** `readerCss.ts` carries **no** `@media print`/`@page` rule today (re-confirmed at task
      time, matching plan D-7's own recon) — genuinely greenfield. New rules hide non-document chrome (toolbar,
      side panel, TOC, status, progress affordance — the mockup's own print block, `design/mockup.html:430-435`,
      is the design language to carry, not `readerCss.ts`'s own rules yet to be written), set the document to
      print-appropriate width/typography, and add page-break rules. ★ **The `@page` margin-box probe**: whether
      Chromium's and Firefox's print pipelines render `@top-center`/`@bottom-right`-style content at production
      quality — empirical, not assumed, because §3.3 makes PDF export (group 7) depend on this as a genuine
      prerequisite, not a soft one.
      Files: `src/theme/readerCss.ts` · `tests/browser/printMode.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx, print-media emulation) reader chrome hidden under print media, document
      content full-width, page-break rules sane on a long fixture. ★ **THE `@page` PROBE'S RESULT STATED
      PLAINLY** (adequate, or inadequate — feeding group 7's fork) — never assumed working. ★ **RULING 4,
      CHECKED AS AN EXPLICIT DIFF CONSTRAINT, NOT A REMINDER:** `git diff src/theme/readerCss.ts` for this task
      is **additive-only** — a NEW `@media print` block naming `.peekover-code-toolbar` (among other chrome
      selectors) in a `display:none` rule; the EXISTING `.peekover-code-toolbar` rule's spacing declarations
      (outside any `@media print` block) are **byte-unchanged**, asserted by diffing that rule's own body
      specifically, not the file as a whole. **If this task's natural shape required touching that rule's
      body, this task does not proceed — it is a stop-and-flag back to gate review**, per the ruling's own
      terms. Every token verified against all three theme blocks before use. No `ch` in any layout-blocking
      property. CSS rationale in the doc comment above the block. Content-script bytes md5-identical (`readerCss
      .ts` is on both graphs, but a new `@media print` block with no runtime branch on it costs nothing there —
      stated, not assumed: measured). Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-7;
      §4 print mode; §7-4; Ruling 4]

*Group-6 acceptance (plan §6): §4's print criteria; the probe's result stated plainly.*

## 7 — PDF export (`window.print()` driving group 6's pipeline; the fallback only if group 6's probe requires it)

- [x] **7.1 `exportPdf(): window.print()` — the SAME pipeline the browser's own print command drives, no
      second rendering path (§3.6, sealed).** LANDED, 2026-09-03. **The kickoff's own binary fork
      ("adequate → wire window.print(); inadequate → price a fallback library") was reshaped by 6.1's
      own finding before this task started: Chromium's ENGINE supports `@page` margin boxes; the
      SHADOW-SCOPED stylesheet D-7 sealed is what's inert — a third option (relocate to a
      document-level stylesheet, re-measure) was cheaper than pricing a dependency and was tried
      first, per this task's own extended investigation (flagged in decisions.md/progress.md, not a
      silent substitution). RESULT: relocation renders on Chromium/app-page — **NO fallback
      dependency needed, `dependencies` (production) stays 6.** A real residual (Firefox's own
      parse-time gap; the content-script surface's lack of any document-level stylesheet) is
      STOP-AND-FLAGGED to a human ruling in decisions.md, not silently accepted or silently built
      around — see that entry for the options and the evidence.
      Files: `src/app/exportControls.ts` (the `exportPdf`/`onExportPdf` wiring, the panel's 5th row
      going live) · `src/app/appShell.ts` (necessary ripple: `APP_CSS` gains a document-level COPY of
      readerCss.ts's own `@page` block — the relocation target; flagged, not a silent Files-list
      substitution) · `src/theme/readerCss.ts` (comment only, cross-referencing the copy — no CSS
      byte change) · `tests/browser/pdfExport.browser.test.ts` (new) ·
      `tests/browser/printMode.browser.test.ts` (extended: a new document-level CSSOM-parse test, the
      render-signal test's final assertions flipped true with updated findings) ·
      `tests/browser/copyAsHtml.browser.test.ts` / `copyAsPlainText.browser.test.ts` /
      `copyAsRichText.browser.test.ts` / `exportPanel.browser.test.ts` (ripple: the "pdf stays
      disabled" assertions each carried, now stale, fixed in place — same pattern 4.1's own Q5
      ripple used). No `package.json` change, no new `src/export/pdfExport.ts` — the fallback branch
      was never reached.
      Verify: (**tests/browser** — Cr+Fx) triggering PDF export invokes `window.print()` against the
      print-mode CSS group 6 built, producing output with reader chrome hidden — GREEN. Fidelity:
      Chromium/app-page renders margin-box page numbers (measured, `printToPdfAndExtractText`
      firing-control proven); Firefox and the content-script surface do not (measured, stated,
      stop-and-flagged, not silently patched over). No fallback branch taken, so no library cost to
      decompose. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. Full suite:
      unit 1055/1055, browser 148 files/1493 passed/19 skipped/0 failed, lint clean. [D-7; §3.6; §4
      PDF export; plan risk 4]

*Group-7 acceptance (plan §6): §4's PDF criteria — MET on Chromium/app-page; Firefox and the
content-script surface carry a named, flagged residual (decisions.md), not a silent gap. RULED,
2026-09-03: option (i) — ship as-is, both gaps deferred, not built around.*

## 8 — Export shortcut, last-used format, progress indicator (D-5, D-6)

- [x] **8.1 The Ctrl/Cmd+S binding — `entrypoints/app/main.ts`, additive beside 009's existing
      `__peekoverHarness` block, NEVER `readerMode.ts`'s app-page-blind pattern (D-5).** LANDED, 2026-09-03.
      `event.preventDefault()` suppresses the native "Save Page As" dialog unconditionally; the handler reads
      `currentSettings().lastExportFormat` (settingsSeam.ts, 8.2) and invokes the SAME export entry point the
      panel's own click handlers call — never a second invocation path. Before any export has ever run,
      `lastExportFormat` is `null`; `triggerLastExport()`'s dispatch has no default-picking branch, so this is
      a graceful no-op (§8's own M-1 walk-gate item governs what a first-ever Ctrl+S does, not this task).
      **★ THE SPINE: the five export handlers were SEALED inside `renderExport`'s closure (8.2's own body),
      unreachable from `main.ts`. Lifted verbatim** (same bodies, same behavior, only relocated and named) into
      five functions (`runExportHtml`/`runCopyHtml`/`runCopyPlainText`/`runCopyRichText`/`runExportPdf`) in
      `mountAppShell`'s own closure; `renderExport()`'s five callbacks reference these functions directly, and
      a new `AppController.triggerLastExport()` dispatches to the SAME five — grepped to confirm no second
      `saveSettings({...}); <export>()` pair exists anywhere. The click path is behavior-preserving BY
      CONSTRUCTION: `exportPanel.browser.test.ts` (8.2's own write-proof block included) passed UNCHANGED.
      **★ Q3, PROVEN AT THE BYTE LEVEL, NOT JUST BY CODE REVIEW:** content-script bundle stayed
      BYTE-IDENTICAL to 8.2's landed state on both engines (md5 unchanged), firing-control-confirmed via
      `git stash`/rebuild both engines — the listener never leaked into the shared graph `readerMode.ts`/
      `mount.ts` both surfaces import.
      Files: `entrypoints/app/main.ts` · `tests/browser/exportShortcut.browser.test.ts` · NECESSARY RIPPLE
      (flagged, structurally required by this task's own "one invocation path, not two" clause —
      `decisions.md`'s D-5 entry gives the per-file justification): `src/app/appShell.ts` (the lift +
      `triggerLastExport()` — main.ts cannot reach the sealed handlers without it).
      Verify: (**tests/browser** — Cr+Fx, cross-engine `preventDefault` behavior empirical, not assumed per
      §7-3's own text) Ctrl+S on the app page suppresses the native save dialog and triggers the last-used
      export. ★ **RED-FIRST, THE NEGATIVE HALF, PROVING THE SCOPE IS REAL**: the SAME keystroke on a
      content-script surface does nothing new — asserted by driving both surfaces in one test and confirming
      only the app page reacts (the exact inversion `readerMode.ts:124`'s existing app-page-blind listener would
      produce if this task mistakenly reused that pattern, per D-5's own rejected-alternative text) — made
      ROBUST to this suite's own shared-`document`-across-files harness property (a first draft's absolute
      reaction-count assumption broke in a real run; fixed with a spy cleared before every measured dispatch,
      per `decisions.md`'s own account). Content-script bytes md5-identical, both engines, firing-control-
      confirmed. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. App-page chunk
      **487,133 → 487,735 B (+602 B)**, both engines. `.output` **4,879,636 → 4,880,238 B (+602 B)**,
      ~354.14 KiB (Cr) headroom remaining. `dependencies` (production) unchanged at 6. Unit 1056/1056; full
      browser suite 150 files/1517 passed/15 skipped/0 failed (a `diagramActions.browser.test.ts`/
      `tocScroll.browser.test.ts` intermittent Firefox flake surfaced in two intermediate runs, confirmed
      pre-existing and unrelated by isolated re-run), lint + typecheck clean. [D-5; §4 export shortcut; §7-3]

- [x] **8.2 `lastExportFormat` — a FIFTH field on the one global `Settings` row, `codeTheme`'s own shape
      (D-6).** LANDED, 2026-09-03. `Settings` gains `lastExportFormat: string | null`;
      `DEFAULT_SETTINGS.lastExportFormat = null`. `SettingsPort`'s three methods unchanged in shape.
      **★ THE ENUMERATION TRAP: CHECKED, AND `plan.md`'s OWN "no trap" CLAIM WAS WRONG FOR THE READ PATH.**
      `plan.md:256-260` claimed the trap was confirmed absent — true only of `settings.ts` (structural), false
      of the actual read path: THREE sibling sites hand-enumerate `Settings` field-by-field and would silently
      drop `lastExportFormat` on read (`store.ts`'s `getSettings()` — which already carried a comment from
      D-12/task 1.5 predicting exactly this — and `describeStored()`, plus `settingsPort.ts`'s
      `coerceSettings()`, the messaging-port read path). Corrected here by measurement, not inherited from the
      plan; all three extended with `codeTheme`'s own established `?? DEFAULT_SETTINGS.field` pattern, and each
      extension is proven with a round-trip test capable of failing (a unit test driving the real
      `coerceSettings`, a real-engine `putSettings`/`getSettings` round trip mirroring `codeTheme`'s own D-12
      trap test). **★ THE WRITE SITE, UNSTATED IN THE SEALED BODY, PINNED:** wired into `appShell.ts`'s five
      export-panel handlers via `saveSettings` (`settingsSeam.ts` — the SAME generalized seam theme/TOC/
      code-theme already use), each persisting its own `exportControls.ts` `RowSpec.key` the instant its export
      actually fires (never on the defensive no-op branch) — ONE write path task 8.1's Ctrl+S will reuse, so it
      can never diverge or double-write. Proven live (`exportPanel.browser.test.ts`, real engine): each of the
      5 rows sets `lastExportFormat` to its own key.
      Files: `src/settings/settings.ts` · `src/settings/settings.test.ts` · `docs/trust/PERMISSIONS.md` ·
      NECESSARY RIPPLE (flagged, structurally required by this task's own Verify clause — decisions.md's D-6
      entry gives the per-file justification): `src/settings/settingsPort.ts` + `settingsPort.test.ts` ·
      `src/app/store.ts` · `tests/browser/settingsStore.browser.test.ts` ·
      `tests/browser/settingsPort.browser.test.ts` · `src/app/appShell.ts` ·
      `tests/browser/exportPanel.browser.test.ts`.
      Verify: (**unit**) `Settings`/`DEFAULT_SETTINGS`'s new field, `SettingsPort` methods unchanged in shape.
      `docs/trust/PERMISSIONS.md`'s settings-row disclosure gains ONE field name in its existing row, confined
      one-line diff, the ONLY `PERMISSIONS.md` touch this milestone makes. ★ Enumeration trap checked (above) —
      not a silent workaround, extended + flagged per `codeTheme`'s own precedent. Content-script bytes MOVE,
      expected and disclosed (not D-2-breaking — `settings.ts`/`settingsPort.ts` are on the CS graph via
      `messagingPort`): CS **336,042 → 336,121 B (+79 B)**, same delta both engines (Cr md5 `09c2ac89…` →
      `f424a3b6…`; Fx md5 `6aa82bc8…` → `ebbf183a…`), firing-control-confirmed via `git stash`/rebuild both
      engines. App-page chunk **486,813 → 487,133 B (+320 B)**, same firing control. `.output`
      **4,879,159 → 4,879,636 B (+477 B)**, ~354.73 KiB (Cr) headroom remaining, robustly under the 5 MiB
      ceiling. Manifests **654 / 770 B** unchanged, `permissions: []`. `dependencies` (production) unchanged at
      6. Golden EMPTY. Full suite: unit 1056/1056 (+1, the coerceSettings round-trip test), browser 148
      files/1503 passed/15 skipped/0 failed, lint + typecheck clean. [D-6; §3.7; §4 export shortcut]

- [ ] **8.3 The progress indicator for heavy exports — a NEW affordance with NO sibling suite and NO mockup
      baseline (§3.8; plan §3.11 row 14). ★ BUILD-OR-DROP DEFERRED TO TASK 10.4's DECISION GATE, HUMAN-RULED
      2026-09-04 (`decisions.md` M10 §8.3/§10.4) — NOT struck (its fate is deferred, distinct from a
      §3.10/§3.1(cont.)-style strike); still an active task, count unchanged, gated on 10.4.** The
      "provisional placeholder here, group-10's own measurement confirms or replaces it" framing below is
      SUPERSEDED by that ruling: 10.4 rules not just the threshold value but whether 8.3 builds at all, on
      10.2's measured export wall-clock — this task does not build until 10.4 has ruled.
      Shown when a heavy-document export (per 10.2's M-2 threshold — a
      provisional placeholder here, EXPLICITLY NAMED provisional in the doc comment, group-10's own measurement
      confirms or replaces it, the same discipline 009 5.1/6.1 used) crosses that threshold; a polite live
      region announces progress state (row 9); if it animates, instant under `prefers-reduced-motion`, DOES
      animate without it (row 10, non-vacuous both halves).
      Files: `src/app/exportControls.ts` · `src/theme/readerCss.ts` · `tests/browser/exportProgress.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) a heavy-fixture export shows the indicator; a light-fixture export
      shows NO indicator chrome at all (row 2's shape, applied to this axis — no threshold-gated affordance
      pays anything below its own gate). ★ **Row 9**: polite live region, out of the a11y tree while empty.
      ★ **Row 10, both halves**: instant under reduced motion, animates without it. Content-script bytes
      md5-identical. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [D-1 (headroom-adjacent,
      no new dependency); §3.8; §4 progress indicator; §8 M-2; row 9, 10, 14]

*Group-8 acceptance (plan §6): §4's shortcut/progress criteria; D-5's red-first negative-surface proof.*

## 9 — Systemic failure and degradation (the §3.9 failures groups 2–8 could not reach)

- [x] **9.1 Per-action failure states — library-load failure, a serialization throw, an unreadable local image,
      a failed copy — each states the failure and leaves the rendered document exactly as it was (§3.9).**
      Distinct from any per-task happy-path proof: here each failure mode is forced directly (a corrupted local
      image reference, a serialization exception, a rejected clipboard write) and the reader's own committed
      DOM must be provably untouched afterward (AGENTS.md #5, never blank).
      Files: `src/export/htmlExport.ts` · ~~`src/export/docxExport.ts`~~ (struck, §3.10 — no DOCX exporter
      to force-fail) · ~~`src/export/zipExport.ts`~~ (struck, §3.1(cont.) — no ZIP exporter to force-fail) ·
      `src/app/exportControls.ts` · `tests/browser/exportDegrade.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) each forced failure states itself distinctly (spec §4: *"shall indicate
      completion… shall indicate the failure distinctly from success"*, *"shall say so and shall not report
      success for a copy that did not occur"*) and the reader stays exactly as rendered — a reference-identity
      check on `.peekover-reader`'s own subtree, pre/post the forced failure. ★ **Revert-and-fail**: remove the
      per-action failure handling and the forced failure instead throws uncaught or silently reports success —
      the defect's own signature, in its own units. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [§3.9; §4 Degradation]

- [x] **9.2 The zero-network guard, across EVERY export/copy/print action, with D-8's own live mechanism as the
      firing control, shown live in the SAME test (§3.11 row 12).** ★ Every export/copy path in this milestone
      is a single test run, not one test per action — the standing lesson applies with full force here because
      D-1's headroom pressure makes a missed request in any one path the kind of finding that changes group 10's
      own numbers.
      Files: `tests/browser/exportNetwork.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **zero requests** across HTML export, Copy-as-HTML, Copy-as-rich-text,
      Copy-as-plain-text, print/PDF export (DOCX export struck, §3.10 — no path to test; ZIP export struck,
      §3.1(cont.) — no path to test) — using the existing `/^https?:/i` predicate
      **verbatim** and `awaitFetchedUrls`'s shape, **with `remoteMediaUi`'s existing restore-button mechanism
      (`mediaPolicy.ts:166` ← `remoteMediaUi.ts:77`) shown firing LIVE IN THE SAME TEST** as the positive
      control — invoked directly, never through any of 010's own export code (D-8's own text: the control
      proves the export/copy paths are silent, using a mechanism export never calls). ~~A remote-image fixture
      exported to ZIP produces an unrewritten remote reference (Ruling 3, re-checked here at the milestone-wide
      level, per-task instance already covered at 3.5).~~ **struck, §3.1(cont.) — no ZIP export exists to
      produce an unrewritten reference from; Ruling 3's HTML-export half is asserted at 3.1 instead.** ★
      **jsdom cannot see bytes on the wire — real-engine or nothing.** Control markup neutralized in an inert
      `<template>`, never a "detached" div (the standing Firefox `@import` lesson). Golden EMPTY · manifest
      green **654 / 770 B** · `permissions: []` both engines.
      [§3.11 row 12; §5 zero-network; D-8; Ruling 3; M6 finding 1]

*Group-9 acceptance (plan §6): §4's Degradation clause in full.*

## 10 — Measure (spec §8 M-1 · M-2 · M-3 — PRODUCE NUMBERS; FORBIDDEN FROM CHOOSING VALUES)

- [x] **10.1 M-1 — the default export format before any format has ever been used (§3.7, §8). PRODUCES A
      WALK-GATE JUDGEMENT; FORBIDDEN FROM CHOOSING.** Axes: which format a first-time user is likeliest to want
      · which format has the fewest failure modes to demonstrate on a first try. Nothing quantitative — the
      009 8.4-style product-feel judgement shape.
      **DONE 2026-09-04 — four candidates produced (keep-no-op · HTML export · a copy action, as a class ·
      PDF), each read against both axes; verdict-input leans HTML export, no default chosen. Full candidate
      analysis + the 8.1/8.2 null-case reconciliation: `docs/ai/progress.md`'s 2026-09-04 task-10.1 entry.
      Doc-only, nothing built.**
      Files: `docs/ai/progress.md` (findings only) + the task report
      Verify: candidates stated with their reasoning, no default chosen here. Golden EMPTY · manifest green
      **654 / 770 B** · `permissions: []`. [§8 M-1; §3.7]

- [ ] **10.2 M-2 — the "heavy document" threshold that triggers 8.3's progress indicator (§3.8, §8). PRODUCES
      NUMBERS; FORBIDDEN FROM CHOOSING.** Axes: document size · image count/bytes to embed · measured wall-
      clock per export type at representative sizes, drawn from this repository's own documents and the golden
      fixtures — the same corpus discipline 008/009 both used, **bias stated**: this repository's own markdown
      is not a representative sample of arbitrary agent-authored documents (the identical caveat carried
      forward, not re-derived).
      Files: `docs/ai/progress.md` (numbers only) + the task report
      Verify: wall-clock distribution across the corpus, per export type, reported with the corpus size and its
      bias sentence. No threshold chosen here. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [§8 M-2; §3.8; plan risk (bias, carried)]

- [ ] **10.3 M-3 — print CSS's specific page-number/header/footer content and layout (§3.6/§7-4, §8), gated on
      group 6's fidelity probe having confirmed the mechanism can express them at all. PRODUCES A WALK; FORBIDDEN
      FROM CHOOSING.** Axes: what the header/footer actually shows (document title? page X of Y? both?) ·
      margin sizing. Walked against the demo document and a long golden fixture.
      Files: `docs/ai/progress.md` (findings only) + the task report
      Verify: candidates walked and recorded with the reasoning; no final layout chosen here. **If group 6's
      probe found the `@page` mechanism inadequate, this task states that plainly and produces no candidates**
      — group 7's fallback (if adopted) is what this task's successor measures instead. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [§8 M-3; §7-4; §3.6]

- [ ] **10.4 ★ DECISION GATE (human) — M-1's format, M-2's threshold, M-3's header/footer content, AND 8.3's
      BUILD-OR-DROP (deferred here 2026-09-04, `decisions.md` M10 §8.3/§10.4 — ruled on THIS task's own M-2
      number, not decided in advance). Recorded in `decisions.md` BEFORE any code sets a value.** Also the
      **byte ledger's final reconciliation**: `.output`
      and `pnpm zip` against the milestone-start baselines (**4,866,741 / 4,866,857 B**; **1,470,730 /
      1,470,788 B**), the full accumulated delta across every task's own stated figures, decomposed to a named
      residual — the binding record, not a separate measurement.
      Files: `docs/ai/decisions.md`
      Verify (**human gate**): each choice recorded with the measurement that justifies it, before 10.5. ★ **No
      code lands on an assumed number.** The byte ledger's residual is stated explicitly, unaccounted bytes
      named as a defect if any remain. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`.
      [§8 M-1…M-3; D-1]

- [ ] **10.5 Implement the CHOSEN values — constants only, no new mechanism.** Sets `lastExportFormat`'s
      first-run default logic (8.1/8.2's own placeholder, if any was left), 8.3's threshold, and 10.3's
      header/footer template to 10.4's ruled values — a no-op edit if a placeholder already matched, recorded
      either way (008/009's "a PROPOSED comment left on a chosen value is a lie about the decision state" rule).
      Files: `src/app/exportControls.ts` · `src/settings/settings.ts` (if the default-format logic needs it) +
      tests
      Verify: the threshold and header/footer cases pass against the CHOSEN values; every other task's own
      orchestration is byte-identical — the diff confined to the constants/template block, asserted not
      eyeballed. Golden EMPTY · manifest green **654 / 770 B** · `permissions: []`. [§8 M-1…M-3]

*Group-10 acceptance (plan §6/§7): three findings produced, never chosen inside a measuring task; the byte
ledger reconciled to a named residual.*

## 11 — Human milestone-close gate + retro + the records reconcile

- [ ] **11.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** Walk, on real
      Chromium and real Firefox with an extension loaded (no harness reaches these): whether the export panel
      reads as discoverable or as clutter (008/009's identical question, transplanted a third time); print/PDF
      output legibility against a real long document; the 10.1–10.3 candidates' actual feel, confirming or
      overriding the walk-gate judgements 10.4 banked; **Firefox everything** (Playwright cannot load an
      extension into Firefox, so this walk is that engine's only evidence); **zero unexpected network with the
      Network tab open** across every export/copy/print path, a second confirmation alongside 9.2's automated
      one.
      Verify (**human gate**): each item walked and its verdict recorded. ★ **The walk RECORDS ITS VIEWPORT(S)
      the way it records its engines, and walks at least one WIDE viewport** (M6 finding 2). A *"reads as
      clutter / broken / illegible"* verdict is a real finding → a task added below this line, not a silent
      fix. ★ **POINTER WALK, DONE AS A DISCRETE STEP**: § Now, § Blockers and § Up next grepped for `is next`,
      `at the gate`, `waiting on`, `this commit`, `← NEXT`; every stale assertion corrected. Golden EMPTY ·
      manifest green **654 / 770 B** · `permissions: []`. [§5 human-gate list; §8 M-1…M-3; M6 finding 2]

- [ ] **11.2 Retro (M10 close) — in a FRESH SESSION (the M5/M6/M7/M8/M9 precedent). Run `/retro`: the interview
      ritual per WORKFLOW.md §7.5 — NOT a solo synthesis write-up.** ★ **This is stated explicitly because M9's
      own 9.2 caught exactly this failure shape once already** (a kickoff drafted for that session proposed a
      fully autonomous milestone-wide synthesis instead of the interview; M8's retro had already named the same
      failure once before that) — this task's own line names the ritual by its command so a future kickoff
      cannot substitute a description for it. Append to `docs/ai/retro.md`, newest first — the lessons that
      change how the next milestone runs, and what the gate caught. ★ **State whether D-1's headroom pressure
      (~367 KiB / ~612 KiB, the thinnest of any gate-1 close) actually bound anywhere across the milestone, or
      whether the fork's failure branch never fired** — the honest record either way, not assumed from group
      1's own close alone.
      Files: `docs/ai/retro.md` · `docs/ai/progress.md`
      Verify: the entry is banked; `progress.md` shows M10 closed and points at what is next. Docs only — no
      `src/`, test, `scripts/` or spec file touched. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []`. [WORKFLOW.md §7.5]

- [ ] **11.3 The records reconcile that closes M10 — the per-task D-value audit, closing the gap M9 named at
      its own close.** `spec-coverage.md`'s F9/F5 rows move from their pre-milestone figures to their landed
      figures. ★ **Every D-value's `decisions.md` entry is present and audited against whether it actually
      landed with its own implementing commit, not backfilled here** — the specific gap M9's own 9.3 named
      (*"none of D-1…D-13's thirteen pre-written entries ever landed with an implementing commit"*) is either
      NOT repeated (each entry landed at its own task, per this file's own per-task D-value-mapping discipline)
      or the gap is named exactly as M9's was, not smoothed over.
      Files: `docs/ai/progress.md` · `docs/ai/spec-coverage.md` · `docs/ai/decisions.md` (**only** if a genuine
      decision landed at 10.4/11.1 that is not already banked)
      Verify: § Baselines carries re-run numbers or states plainly it did not, and why. ★ **`docs/trust/
      PERMISSIONS.md`'s one-field addition (8.2) is the ONLY change to that file** — confirmed, not assumed.
      11.1's pointer walk repeated as a discrete step on the final commit. `decisions.md` read and left
      untouched unless a genuine decision landed. Golden EMPTY · manifest green **654 / 770 B** ·
      `permissions: []` · deps exactly **7** (assumes the §3.10 docx-removal follow-up act has landed by
      this task; if not, deps **8** with `docx` installed-but-unused, named as a defect if still true here) ·
      all forbidden paths (`sanitize.ts`, `mount.ts`, the
      content-script graph, `mediaPolicy.ts`/`remoteMediaUi.ts`, `diagramEngine.ts`/`codeEngine.ts`,
      `wxt.config.ts`) byte-identical or untouched, confirmed. [the D-value audit; M9 9.3's own gap, named]

---

**§4 EARS coverage — every clause has at least one task, DOCX export excepted (struck, §3.10 — its EARS
clause no longer applies to M10; ZIP export's clause struck the same way, §3.1(cont.) — moved to spec.md §6).**
*HTML export* → 2.2, 3.1 · ~~*DOCX export* → 5.1~~ (struck) ·
*PDF export* → 6.1, 7.1 · *Copy actions* → 3.3, 3.4, 4.1, 9.1 · ~~*ZIP export* → 3.5~~ (struck) · *Export
shortcut & progress* → 8.1–8.3 · *Print mode* → 6.1 · *Trust* → 1.1 (deps/bytes/manifest), 9.2 (network) ·
*Degradation* → 9.1, 9.2.

**Group ordering, stated so it can be checked:** **1** is the hard gate the whole milestone's approval is
conditional on — nothing else may proceed until its fork resolves. **2** is the shared serializer, with Ruling
3's verification landing as its own first task rather than folded silently into the serializer's build. **3**
is the largest group (three controls sharing one serializer, after 3.5's own strike — M10 §3.1(cont.), below)
and was kept as five tasks — the panel itself
(3.2) split from each of the three actions it hosts plus HTML export's own file-exit (3.1) — following the
008-precedent discipline of splitting a group too large to review or revert as one unit, applied here before
the fact rather than after a gate-2 split instruction, since D-1's own headroom pressure makes small,
independently-revertable units more valuable this milestone than any prior one; it is now **four active tasks**
(3.5 struck). **4** stands alone because its
payload shape genuinely differs from 3.3's (D-4's two halves). ~~**5**~~ **is struck in full (§3.10 — DOCX
export dropped from M10; see the group-5 header above and `decisions.md`'s M10 §3.10 entry).** **6**, **7**,
**8** are each independent of the others except 6→7's stated dependency (§3.3) — struck 5 was independent of
both and its removal changes neither. **9** is built behind groups 2–8 (5 struck, its own failure modes moot)
so it can reach failure modes they could not. **10** measures then decides then implements, never choosing
inside a measuring task, and folds the byte ledger's final reconciliation into its own decision gate (10.4)
rather than a separate task, since D-1's headroom makes the ledger and the three product decisions genuinely
one gate, not two. **11** closes.

**Count as sealed at gate 3: ELEVEN groups, 22 tasks** — 1 (1) · 2 (2) · 3 (5) · 4 (1) · 5 (1) · 6 (1) · 7 (1)
· 8 (3) · 9 (2) · 10 (5) · 11 (3).
**★ Count ACTIVE after the §3.10 human ruling (2026-08-24, `decisions.md` M10 §3.10) — TEN groups, 21
tasks** — group 5's sole task (5.1) is struck, DOCX export dropped from M10. 1 (1) · 2 (2) · 3 (5) · 4 (1) ·
~~5 (1)~~ struck · 6 (1) · 7 (1) · 8 (3) · 9 (2) · 10 (5) · 11 (3) = **21 active + 1 struck = 22 sealed.**
**★ Count ACTIVE after the M10 §3.1(cont.) human ruling (2026-08-29, `decisions.md`) — TEN groups, 20
tasks** — task 3.5 (ZIP export) is struck, downstream of the §3.1 local-image ruling; group 3 drops from 5 to
4 active tasks, no group disappears (group 5 was already struck). 1 (1) · 2 (2) · 3 (4) · 4 (1) · ~~5 (1)~~
struck · 6 (1) · 7 (1) · 8 (3) · 9 (2) · 10 (5) · 11 (3) = **20 active + 2 struck = 22 sealed.**
**Count unchanged by the 2026-09-04 M10 §8.3/§10.4 ruling** — task 8.3's build-or-drop is deferred to 10.4,
not struck, so it stays one of group 8's three active tasks; the count above stands until 10.4 rules and,
if 8.3 is dropped there, restates it.

*Gate: this file is a **DRAFT awaiting gate 3**. On approval, implementation may begin at **task 1.1, in a
fresh session**, per WORKFLOW.md §5.3 — one commit per task, the `progress.md` Now-pointer advancing in that
same commit. **No plan D-value is re-opened, no spec §3.x decision is re-decided, and no §6 IS-NOT item is
proposed here.** ★ **Gate 2 is BANKED and its four rulings and one interpretation note are APPLIED above, not
held. The only places this file declines to decide are the spec's §8 M-1/M-2/M-3 measure-then-choose items —
PRODUCED at 10.1–10.3, CHOSEN by the human at 10.4, executed at 10.5 — and task 1.1's own fork, which is a
gate this file cannot pre-resolve.*** ★ **The fork's resolution is now banked: `decisions.md`'s M10 §3.10
entry (2026-08-24) resolves task 1.1's fork by SCOPE REDUCTION (DOCX export struck, task 5.1) — group 2 and
every task below it, except struck 5.1, are RE-AUTHORIZED. This is the one place gate 3's own seal has been
touched post-approval, and it is touched by a human ruling recorded in `decisions.md`, not by this file
re-deciding anything on its own.***
