# Spec 012 — Editor Mode (focused core): edit → live preview → save-back, via CodeMirror 6

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **012 delivers M12 — F8's focused core, not the full ~21-item Editor Mode surface.**
`spec-coverage.md`'s F8 row scores 5% (21 items: 0 shipped, 2 partial, 19 not) — every milestone so far
has built reader-side capability; none has let a user change the document from inside Peekover. This
spec scopes the smallest loop that makes Peekover an editor at all: open a file already on the app
page → edit it (CodeMirror 6) → see it rendered through the existing pipeline → save it back to disk.
Everything else F8 names — visual table editor, toolbar, find/replace, linting, text transforms, image
paste, snippets, import converters, local drafts/autosave, document metrics — is explicitly deferred to
a later F8 pass (§6), named rather than silently dropped, the same shape 007/010/011 each used for their
own out-of-scope items.
**Date:** 2026-10-03
**Milestone:** M12 · builds on 011 (Math rendering — Temml/MathML, copy-as-LaTeX/MathML — CLOSED
2026-09-11) and on the 2026-10-03 package-size ceiling ruling (≤ 5 MiB → ≤ 7 MiB, a human product
decision taken specifically as this milestone's prerequisite).
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 011's/010's section
shape — §3 decided calls, §4 EARS, §6 the IS-NOT fence, §7 plan-stage risks, §8 gate-3 measure-then-choose,
§9 gate-1 questions. **007/011 are the architectural precedent for the dependency shape** (a heavy
client-side library, lazy-loaded, app-page-only, a governed dependency act) — but M12's own central risk
is NOT bytes, unlike every milestone since M8: CodeMirror 6 is already measured-to-fit (§3.6). **The
genuinely new risk this milestone introduces is WRITE** — M1 through M11 only ever read the user's files;
this is the first milestone that writes to them, which is why §3.4 (not §3.6) is this spec's own central,
front-loaded uncertainty.
**Evidence base:** `docs/product/spec.md` §F8 (quoted verbatim below) + §3 (the Technical writer/blogger
persona) + §8 (the <165 ms first-paint gate and the just-revised ≤ 7 MiB package-size row, both quoted) +
§10 (CodeMirror 6, the stack's own named editor choice) + §6 (the permissions/trust story, items 2/6/7 —
read in full because §3.4 turns on it); `docs/ai/spec-coverage.md`'s F8 row (5%, 21 items) and its own
persona-reading line (*"the Technical writer still has no editor and no export"*); `docs/ai/decisions.md`'s
2026-10-03 M12-prerequisite ceiling entry (CodeMirror 6 measured at ~500–607 KB, `.output` headroom
~2,142,607 B / ~2.04 MiB (Cr), 2,142,491 B / ~2.04 MiB (Fx) at HEAD `21b97fa`, unmoved since — no
production code has landed between that measurement and this draft's own HEAD `dbf15d0`, both doc-only
commits); AGENTS.md (the byte ceiling, the zero-network/sanitization non-negotiables, the permission-
change rule #4). **Two targeted reads ground §3.4, the milestone's own central risk, in the actual tree
rather than a guess:** `src/app/chromiumFolderSource.ts:33–41` (`pickDirectory`'s own doc comment —
*"Read-only mode: Peekover never writes to the chosen folder. This is the ONE line that cannot run
headlessly"* — a currently-true, load-bearing claim this milestone exists to change, deliberately, for
the first time) and `docs/trust/PERMISSIONS.md:40,52` (the folder-read capability-ledger row's
`mode: 'read'` framing, and the ledger's own summary line — *"It cannot read outside a chosen folder,
cannot write, and cannot reach the network"* — a factual claim about the current build that save-back
falsifies). One further targeted read of `src/render/readerMode.ts:28` (`type ReaderMode = 'reading' |
'raw'`) grounds §3.3's in-shell-mode lean — the existing mode-toggle shape M12 proposes to extend. **No
fresh full-repo scope-read was run beyond these targeted citations** (the 010 precedent: a milestone
scoped from the product spec + coverage audit directly, not a `src/` sweep) **and no CodeMirror 6 package
has been installed or inspected for this draft** — the ~500–607 KB figure is a prior session's spike
measurement, reported in `decisions.md`, not re-verified here. **Every `file:line` cited here must be
re-derived by `plan.md` against the actual tree at its own HEAD**, the standing demand every milestone
since 006 restates, with particular force for CodeMirror 6's own modular package shape and the File
System Access write-permission API, both areas AGENTS.md's "verify against current docs, not training
knowledge" rule applies to directly (§3.6, §3.4).

---

## 1. Problem & value

`docs/product/spec.md` §3 names the Technical writer/blogger persona's whole reason to exist: *"Draft
and polish markdown content"* → *"Editor mode, visual tables, export, publish, AI rewrite (BYOK)."*
`spec-coverage.md` states the consequence bluntly: *"the Technical writer still has no editor and no
export"* — and while M10 since gave that persona export (F9, re-audited to 38%), **F8 has had zero
milestones invested in it across eleven**. Every milestone so far — render pipeline, folder access,
settings, watch mode, snapshots, diagrams, code blocks, exports, math — made Peekover a better *reader*.
None let a user change what they are reading.

Today, a user who opens a document in Peekover and wants to fix a typo, adjust a heading, or restructure
a paragraph must leave Peekover, open the file in a separate editor, and come back. For a product whose
own architecture doc orders its features *"reader first, editor second, on-device AI third"* (AGENTS.md),
this is the deliberate consequence of that sequencing, not an oversight — editor was always "second," and
M1–M11 is what "second" required building first: a render pipeline to preview into, a sanitizer to trust,
folder access to hold a real file handle, and (per §3.4 below) the write-permission story that only a
real file handle makes possible at all.

**Who it serves:** the Technical writer/blogger persona (product spec §3) primarily — the first milestone
to serve that persona's own defining job ("draft and polish markdown content") rather than a reading
feature that happens to help them too. Secondarily, every persona who is already reading a document in
Peekover and wants to fix something in it without context-switching — the AI-tool developer correcting a
typo in a `CLAUDE.md`, the researcher fixing a formula 011 now renders correctly — the same "every
persona benefits, one persona is defined by it" shape 011 §1 used for math serving the researcher.

**What the product promises** (`docs/product/spec.md` §F8, quoted so scope matches the promise, not a
paraphrase of it):

> ✅ Toggle: Read ↔ Edit (split pane with scroll sync); inline WYSIWYG-ish editing later
> ✅ **Visual table editor**: create/edit tables via UI; CSV paste/import → markdown table
> ✅ Formatting toolbar + full keyboard shortcuts; smart lists/continuation
> ✅ Find & replace with regex
> ✅ Markdown linting & auto-format (markdownlint rules)
> ✅ Text transforms: heading case conversion, list ↔ checklist, quote, code-fence wrap
> ✅ Image paste → embedded Base64 or saved alongside the file (user choice)
> ✅ Snippets + emoji picker
> ✅ Import: `.html → md`, `.ipynb → md` (client-side converters), plain text
> ✅ Local drafts with autosave + **version snapshots** (IndexedDB); restore or diff any snapshot
> ✅ Document metrics panel (words, chars, headings, links, images)
> Note: in-place saving of local files uses FS Access API write permission (Chromium). Firefox: edit +
> "Save As" download fallback.

That is the entirety of F8's text, 21 items by `spec-coverage.md`'s own count. **This spec does not
invent scope beyond it** — M12 takes exactly the first item (the Read↔Edit toggle) and the save
mechanism named in F8's own closing note, and defers the remaining 19 explicitly (§6). No item here is a
new promise the product spec does not already make.

## 2. User stories

- As a technical writer with a folder open in Peekover, I want to switch a document into an edit view
  and see my changes rendered as I type, so I don't have to leave the app to fix what I'm reading.
- As a user, I want my edits **saved back to the real file on disk**, so editing in Peekover is as real
  as editing in any other editor, not a throwaway scratchpad.
- As a Firefox user (or a Chromium user who declines the write prompt), I want my edits saved as a
  download rather than silently lost, so a platform/permission limitation degrades gracefully.
- As a reader who never opens edit mode, I want the reader to stay exactly as instant as it is today, so
  a feature I don't use never costs me anything.
- As a user whose file changed on disk since I opened it for editing, I want to be warned before my save
  overwrites that change, so I never silently clobber work I didn't make.
- As a user, I want a failed save to tell me plainly that it failed and keep my edits in the editor, so
  I never discover data loss after the fact.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — the focused core loop (edit → live preview → save-back) ONLY, of F8's 21 items.
DECIDED, human-ruled this session's kickoff.**

IN: a Read ↔ Edit toggle on the app-page reader (CodeMirror 6 as the edit surface); a live preview pane
driven by the document's current editor content through the **existing** render pipeline (§3.5); saving
the edited content back to the file the user opened, via the File System Access write capability
(Chromium) or a download fallback (Firefox) — F8's own closing note, taken as this milestone's save
mechanism, not invented. Graceful degradation on every failure mode (§3.7, AGENTS.md #5).

DEFERRED, each with a home in §6: split-pane scroll sync as a *polish* refinement of the toggle (the
toggle itself, and a view of both panes, is IN; keeping their scroll positions synchronized is not);
inline WYSIWYG-ish editing (F8's own "later" wording); the visual table editor and CSV import; the
formatting toolbar and any custom keyboard-shortcut map (CodeMirror 6's own default bindings ship
as-is — no bespoke shortcut surface is built); smart lists/continuation; find & replace; markdown
linting/auto-format; text transforms; image paste; snippets/emoji picker; the three import converters;
local drafts with autosave and version snapshots (distinct from save-back — see §6's own note on how
this interacts with M6's existing watched-document snapshots); the document metrics panel; multi-file
editing (only the single currently-open document is editable); and editor-specific settings (keymaps,
editor themes beyond the reader's own). **This milestone's IN set is deliberately the smallest slice
that makes the word "editor" true of Peekover at all** — everything that makes editing *comfortable*
is F8's own remaining 19 items, a later milestone's scope.

**3.2 EDIT MODE SHIPS TO THE APP-PAGE READER ONLY — DECIDED, and more firmly than 007's/011's own version
of this call, because here it is structural, not just a byte/manifest preference.**

- **The shared reason (manifest/bytes), same as 007/011.** CodeMirror 6 is a lazy-loaded local chunk
  (§3.6); the content-script `file://` reader cannot load a separate packaged chunk without
  `web_accessible_resources`, a key `tests/manifest.test.ts` forbids outright — the identical fork
  007 §3.2/011 §3.2 both name for their own heavy dependencies.
- **The new, decisive reason: the content-script surface has no handle to write through, independent of
  bytes.** The content script renders a document reached by direct `file://` navigation — it is never
  granted a `FileSystemFileHandle`; only the app page's folder-open flow produces one
  (`chromiumFolderSource.ts`'s handle-carrying `WalkFileNode`, spec 005 task 4.7). **Save-back has
  nothing to save back THROUGH on that surface, structurally** — this is not a scoping preference that a
  future byte-budget increase could revisit, unlike 007's/011's own manifest arguments.
- **A narrower question survives for gate 1: should a content-script document get a READ-ONLY "preview
  my edits without saving" mode even without a handle?** Recommendation: no — it still needs the same
  forbidden lazy-chunk mechanism as the write path, for a mode that cannot fulfil F8's own closing
  promise (saving back) anyway. Named as a deferral, not a silence, the same shape 007/011 both used
  (§6).

**3.3 EDIT IS A MODE ON THE EXISTING APP-PAGE SHELL, NOT A NEW ENTRYPOINT (D-A) — LEANED, stated as a
gate-1 decision because it shapes everything plan.md designs next.**

`src/render/readerMode.ts:28` already defines `type ReaderMode = 'reading' | 'raw'` — a per-document view
state toggled in place on the same mounted content, with its own keyboard shortcut and toggle control.
**The lean: edit is a third state on this same shape (or a sibling mode flag plan.md designs), not a new
bundled page.** `entrypoints/app/main.ts` already hosts the one app-page shell every surface (folder
browser, reader, settings, storage panel) mounts into; AGENTS.md's own framing — *"editor is a mode, not
a separate app"* (reader-first, editor second) — and F8's own title (*"reader-first, editor one keystroke
away"*) both point the same direction. **Trade:** in-shell keeps the one-app coherence the product spec's
whole structure depends on, but the mode must not load CodeMirror until the user actually enters it —
stated here so the lean is not read as "ship CodeMirror eagerly because it's cheap" (§3.6's own measured
headroom is not a licence to skip the lazy-load discipline every heavy engine since 007 has used).

**3.4 ★ THE SAVE-BACK WRITE SURFACE IS THE MILESTONE'S CENTRAL, FRONT-LOADED RISK (D-B) — FRAMED HERE,
NOT RULED, on the same measure-before-assume discipline M10/M11 both used for their own central risks.**

M1 through M11 only ever **read** a user's files. This is the first milestone in the project's history
that **writes** to one, and the current tree says so in two places this draft read directly rather than
assumed:

- `chromiumFolderSource.ts:33–41`'s own doc comment: *"Open the native directory picker... Read-only
  mode: Peekover never writes to the chosen folder. This is the ONE line that cannot run headlessly."*
  `pickDirectory` calls `showDirectoryPicker({ mode: 'read' })` — the literal line M12 must change (to
  `'readwrite'`, or to a two-step read-then-upgrade via `handle.requestPermission`) is named here so
  `plan.md` does not have to rediscover it.
- `PERMISSIONS.md:52`'s own ledger line: *"It cannot read outside a chosen folder, cannot write, and
  cannot reach the network."* This is a **factual claim about the current build** that save-back makes
  false the moment it ships — AGENTS.md #4 requires the ledger update land in the same PR as the
  capability, the same discipline folder-read itself (M2), the settings channel (M4), the watch relay
  (M5), snapshot capture (M6) and the diagram cache (M7) each already followed in this same file.

**Three concerns, named as gate-1's to weigh, none ruled here:**

**(i) Does save-back need a manifest permission, or is it the same user-gesture web-platform capability
folder-read already is?** `permissions: []` has been load-bearing to the trust story since M1
(AGENTS.md #4, product spec §6 item 6) — if the editor is the first feature to add a manifest
permission, that is a §6 event to reason about deliberately, not discover mid-task. **The lean, stated
by the product spec itself:** F8's own closing note says *"in-place saving of local files uses FS Access
API write permission (Chromium)"* — naming it as a **web-platform permission** (the same `mode:
'readwrite'` / `handle.requestPermission({ mode: 'readwrite' })` shape PERMISSIONS.md's own "Re-prompt on
reopen" row already documents for read), not a browser-extension manifest permission. If `plan.md`'s own
verification against the current File System Access API spec (not training knowledge — AGENTS.md's
standing rule) confirms this, `permissions: []` survives untouched and only `PERMISSIONS.md`'s capability
ledger grows/corrects a row — exactly the shape folder-read itself used at M2, no manifest change at all.
**If verification finds otherwise, that is a hard stop and an AGENTS.md #4 event**, escalated immediately
rather than assumed away, the same stop-and-flag 011 §3.10 required for its own permission question.
**No recommendation is given on the outcome** — only on how to find out (§9-2).

**(ii) Firefox has no File System Access API at all.** This is not a gap M12 must close — the product
spec's own F8 note already states the cross-engine shape: *"Firefox: edit + 'Save As' download
fallback."* `PERMISSIONS.md`'s own ledger already documents an analogous Firefox-specific degradation for
folder-read itself (a read-only, non-persistable snapshot, "a Firefox platform limitation, surfaced
honestly in the UI") — save-back on Firefox is a **download, by design**, not a lesser version of
Chromium's save, and should be built and tested as its own first-class path, not an afterthought.

**(iii) The "never lose the user's work" bar.** Three sub-concerns `plan.md` must design against, stated
as a bar here rather than a mechanism: **conflict handling** if the file changed on disk since the
editor opened it — this is sharper than a generic race, because the SAME file may simultaneously be
**watched** (spec 005's relay already polls it for re-render) while being edited, so a save must not
silently clobber a change the watch relay itself just surfaced; **save-failure degradation** — a failed
write must say so and must never discard the in-editor content (the AGENTS.md #5 "never blank the page"
principle's write-side analogue: never blank the user's edits either); and **unsaved-changes safety** —
leaving edit mode, closing the tab, or navigating away with unsaved changes needs a guard, not a silent
discard. **This is the milestone's highest-care surface, and this spec treats it as such rather than
folding it into a generic "handle errors" line.**

**3.5 LIVE PREVIEW REUSES THE EXISTING RENDER PIPELINE (D-C) — DECIDED, no new renderer.**

The preview pane runs the SAME `mount()`/enhance pipeline every milestone since M1 already built, fed
the editor's current buffer content instead of a file read, debounced rather than synchronous. This
generalizes 006 D-15's own principle (*"`mount()` stays a read-only library"*) and mirrors how watch mode
(005) already feeds fresh disk bytes into the identical pipeline today — the editor module is simply a
second producer of text for the same consumer, not a reason to build a second consumer.

- **Responsiveness, not first-paint.** The preview's re-render cost is **not** the <165 ms first-paint
  gate — that gate governs a document's FIRST paint, before edit mode is even entered (§5). The preview
  re-render happens post-mount, user-initiated, on an already-open document; it must stay *responsive*,
  and the exact debounce interval is `plan.md`'s to measure against a representative document size (the
  same "measure, don't assume" shape 011 §3.6 used for its own cache question), not a number this spec
  invents.
- **No new sanitizer surface.** CodeMirror renders its own editing chrome as its own DOM construction
  (not user-controlled HTML reaching `innerHTML`); the TEXT it produces is fed back into the existing,
  unmodified `sanitize(parse(source))` pipeline. Unlike 007's Mermaid SVG output or 011's Temml/MathML
  output, the editor introduces **no new generated-markup shape DOMPurify has never seen** — AGENTS.md
  #3 is satisfied by the pipeline M12 reuses, not by anything new M12 must build.

*Rejected:* a second, editor-specific preview renderer (doubles the render surface's sanitizer/test
burden for no reader-facing benefit — the same 007 §3.3/011 §3.3 rejection, restated for a different
reason here: there is no new render engine to couple, only a new text source).

**3.6 THE DEPENDENCY — CodeMirror 6, MEASURED-TO-FIT, A CONFIRMATION NOT A FORK (D-D). DECIDED to frame
as a confirmation; the number itself is task 1.1's to re-measure, not this draft's to assert as final.**

Unlike M10's docx discovery (busted its own headroom) or M11's KaTeX/MathJax bust (both engines busted
independently, forcing a full engine swap), CodeMirror 6 is **already measured**: ~500–607 KB
(`decisions.md`, 2026-10-03, this project's own prior-session feasibility spike), against **~2,142,607 B
/ ~2.04 MiB (Cr), 2,142,491 B / ~2.04 MiB (Fx) headroom** at the current ≤ 7 MiB bound — **over 3×
headroom to spare before any lazy-load discipline is even applied.** **This is the first milestone in
three to open gate 1 with a dependency measured to fit comfortably rather than discovered as a bust risk
mid-plan** — named explicitly so `plan.md` does not import M10/M11's own defensive urgency onto a
different risk shape here. Task 1.1 (the standing dependency-gate pattern every milestone since M8
opens with) is therefore a **real measurement that confirms or corrects a reported figure**, not a fork
between scope outcomes — install the actual package, measure the actual delta (CodeMirror 6's own
modular extension system means the real number depends on exactly which packages the editor imports —
a bare minimal setup vs. a markdown-language-aware one — so the ~500–607 KB figure is re-derived against
the real import graph, not assumed), decompose any surprise to a residual, the same D-11-shaped ablation
discipline M10/M11 both used. **Verified against the actual installed package, not training knowledge**
(AGENTS.md's standing rule) — CodeMirror 6's own modular package boundaries are exactly the kind of
fast-moving surface that rule exists for.

**3.7 EVERY EDIT-MODE FAILURE DEGRADES TO THE READER'S EXISTING SAFE STATE — DECIDED, the 007 §3.8/011
§3.9 shape applied to a surface that now writes as well as reads.**

- **CodeMirror fails to load:** the Read ↔ Edit toggle is unavailable (or explicitly errors), and the
  document stays in its current reading/raw view — never a blank page, never a half-mounted editor.
- **The preview fails to render** (a parse/sanitize error on the editor's current buffer): the preview
  pane shows the error state the reader already uses for a render failure (AGENTS.md #5) while the
  EDITOR BUFFER itself stays intact and editable — a broken preview must never cost the user their
  unsaved text.
- **Save fails** (write-permission denied, disk error, handle invalidated): the system says so plainly
  and the editor's content is retained unchanged — never a silent failure, never a discarded edit (§3.4-iii).

## 4. Acceptance criteria (EARS)

**The edit↔preview↔save loop (always in scope)**

- When the user activates the Read ↔ Edit toggle on an app-page document, the system shall present an
  editable view of that document's source using CodeMirror 6.
- When the user edits the document in the editor, the system shall render a live preview of the current
  editor content through the existing render pipeline, without blocking the editor.
- While the live preview is updating, the system shall keep the editor itself responsive to further
  input.
- When the user saves (Chromium, with write permission granted), the system shall write the editor's
  current content back to the file the user opened.
- When the user saves on Firefox, or on Chromium without write permission, the system shall offer the
  current content as a downloadable file instead of failing silently.
- If the on-disk file has changed since the document was opened for editing, then the system shall warn
  the user before a save would overwrite that change.
- If a save fails for any reason, then the system shall tell the user it failed and shall retain the
  editor's unsaved content unchanged.
- When a document with no unsaved changes is navigated away from or the tab is closed, the system shall
  not prompt. If there ARE unsaved changes, then the system shall warn before they would be lost.
- When a document is rendered on the content-script reader, the system shall offer no edit affordance
  there (§3.2).

**Degradation**

- If CodeMirror cannot be loaded, then the system shall leave the document in its current reading/raw
  view, and shall never present a blank or half-mounted editor.
- If the live preview fails to render the current editor content, then the system shall show the
  existing render-failure state in the preview pane while leaving the editor buffer itself intact and
  editable (AGENTS.md #5).

**Trust**

- The system shall make no network request while loading CodeMirror, rendering the live preview, or
  saving — proven at the request level on both engines, non-vacuously (§5).
- The system shall keep the built manifest free of any new permission UNLESS §3.4-i's own verification
  shows the File System Access write capability genuinely requires one, in which case that change is
  disclosed in `PERMISSIONS.md`/the manifest together, per AGENTS.md #4, and is itself an escalation back
  to a human gate rather than an assumed outcome.
- The system shall update `PERMISSIONS.md`'s capability ledger to state, honestly, that Peekover can now
  write to a file the user explicitly opened for editing — replacing the current "cannot write" claim
  rather than leaving it standing alongside a feature that contradicts it.

## 5. Non-functional requirements

- **First paint, edit mode never entered:** unaffected. CodeMirror lazy-loads only on entering edit mode
  (§3.3), so a document that is only ever read pays nothing — the <165 ms gate (`docs/product/spec.md`
  §8) is unchanged and untested by this milestone beyond a regression check.
- **First paint, edit mode entered:** the same gate's reasoning extends — entering edit mode is a
  **post-mount, user-initiated** action, not part of the document's first paint, so the gate does not
  apply to it directly; `plan.md` states its own responsiveness target for how quickly the editor itself
  becomes usable after the toggle, separate from the <165 ms figure.
- **Bytes:** CodeMirror 6 measured at ~500–607 KB (prior-session spike, `decisions.md` 2026-10-03)
  against `.output` headroom of ~2,142,607 B / ~2.04 MiB (Cr), 2,142,491 B / ~2.04 MiB (Fx) at the current
  ≤ 7 MiB (7,340,032 B) bound, baseline measured at HEAD `21b97fa` and unmoved through this draft's own
  HEAD `dbf15d0` (both doc-only commits). Task 1.1 re-measures the real import graph's actual delta
  against this reported figure (§3.6) — never grep-proven, always ablation-decomposed if it surprises.
- **Manifest pin:** `permissions: []` re-proven on both built manifests UNLESS §3.4-i's verification
  forces a change, which is itself an escalation (§4's own Trust criterion), not a default outcome.
  `web_accessible_resources` stays forbidden; CodeMirror lazy-loads the same way `temml`/`mermaid`/`shiki`
  already do on the app page.
- **Sanitization (AGENTS.md #3):** unchanged — no new sanitizer profile, per §3.5's own reasoning.
- **Zero-network (AGENTS.md #1):** proven at the request level on both engines, with a positive control
  that fires (the standing M6 retro lesson) — covering CodeMirror's own load, the preview's re-render, and
  the save path (a local-disk write, not a network call, but proven rather than assumed, the same
  discipline `folderMode.network.browser.test.ts` already applied to folder read).
- **CSS discipline:** any editor-styling rationale lives in TypeScript doc comments, never inside a CSS
  template literal (the standing M6 retro finding 9).
- **a11y:** the editor is keyboard-operable (CodeMirror 6's own baseline), the Read ↔ Edit toggle and any
  save/conflict/error messaging is reachable by keyboard and screen-reader-announced, and no state is
  conveyed by colour alone. The exact mechanism for announcing save success/failure/conflict is
  `plan.md`'s to design against current ARIA live-region practice, not this draft's to assume.
- **Reliability:** every failure mode in §3.7 is tested REVERT-AND-FAIL, with the defect's own signature
  in the defect's own units (M6 retro finding 5) — a save-failure test must prove data retention, not
  merely that an error message appeared.

## 6. Out of scope (explicit)

- **Inline WYSIWYG-ish editing** — F8's own "later" wording; CodeMirror ships as a source-text editor,
  not a rich-text one, this milestone.
- **Split-pane scroll sync** (the polish half of the Read↔Edit item) — the toggle/split view itself is
  IN; keeping both panes' scroll positions aligned is a refinement, not the loop. Home: the same
  future F8 pass as the items below.
- **Visual table editor, CSV paste/import** — unbuilt; home: next F8 pass.
- **Formatting toolbar, custom keyboard-shortcut map** — unbuilt; CodeMirror 6's own default bindings
  ship unmodified. Home: next F8 pass.
- **Smart lists/continuation, find & replace with regex, markdown linting/auto-format, text transforms,
  image paste, snippets/emoji picker, the three import converters (`.html`/`.ipynb`/plain-text)** — none
  built; each is F8's own named item, not invented scope removed. Home: next F8 pass.
- **Local drafts with autosave + version snapshots.** DISTINCT from this milestone's save-back: M6
  already shipped version snapshots, but keyed to **watched** documents on the app page, not editor
  drafts (`spec-coverage.md`'s own F8 note: *"snapshots ship — but keyed to watched documents, not editor
  drafts"*). M12 does not build a parallel draft-autosave mechanism, and does not wire the editor into
  M6's existing snapshot store either — that reconciliation (should an edit-mode session also snapshot
  itself) is a real design question for a future F8 pass, not assumed resolved by silence here.
- **Document metrics panel** — unbuilt; home: next F8 pass.
- **Multi-file editing** — only the single, already-open document is editable; no project-wide edit
  surface.
- **Editor-specific settings** (keymaps, editor themes beyond the reader's own) — the editor inherits the
  reader's existing theme tokens (design/tokens.css); no new settings surface is added.
- **The content-script `file://` / raw-host reader's edit reach** (§3.2) — no edit affordance ships
  there, for a structural reason (no file handle exists on that surface) stronger than 007's/011's own
  byte-margin reasoning for the same call. Home: unchanged unless a future milestone gives the
  content-script surface its own handle-granting mechanism, which nothing today proposes.
- **Any manifest permission addition, assumed in advance.** §3.4-i states the lean (no manifest change
  needed) but does not assume it; if verification forces one, that is an AGENTS.md #4 event handled at
  the point it is found, not pre-authorized here.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **★ THE SAVE-BACK PERMISSION MECHANISM ITSELF, VERIFIED AGAINST THE CURRENT FILE SYSTEM ACCESS API
   SPEC — before any save-path code is written.** Confirm whether `handle.requestPermission({ mode:
   'readwrite' })` (or re-opening the picker with `{ mode: 'readwrite' }`) is sufficient, with no
   manifest permission, exactly as §3.4-i leans — or whether current Chromium/MV3 extension-context
   behaviour differs from a top-level page's. AGENTS.md's standing rule (verify against current docs, not
   training knowledge) applies with particular force here, since this is the project's first write
   capability and the cost of being wrong is a manifest change discovered mid-task rather than planned.
2. **The exact mechanism for changing `pickDirectory`'s `mode: 'read'` to a write-capable mode — does
   every folder-open need `readwrite` up front, or does only the specific file being edited need an
   upgrade at save time?** The latter is more consent-minimal (matches product spec §6 item 6's "at
   moment of use" framing) but means `chromiumFolderSource.ts`'s `pickDirectory`/`fileNodeFromHandle`
   split (lines 33–63) needs a second, file-scoped permission request path alongside the existing
   folder-scoped read one — a real design choice, not a one-line edit.
3. **The conflict/overwrite policy, concretely.** §3.4-iii states the bar ("never silently overwrite a
   changed file") but not the mechanism — compare the on-disk file's last-modified time or content hash
   against what was loaded, before writing? What does the user see and choose when a conflict is
   detected? This interacts directly with the watch relay (spec 005) if the SAME document is being
   watched and edited simultaneously — `plan.md` must state whether that combination is supported,
   degraded, or disallowed, not leave it implicit.
4. **CodeMirror 6's actual package/extension shape**, verified against the installed package: which
   `@codemirror/*` packages are actually needed for a markdown source editor (language support, basic
   keymap, line numbers if any), and whether the ~500–607 KB spike figure holds for that real import
   graph or needs re-measuring with a different package set (§3.6).
5. **The debounce/responsiveness target for live preview**, measured rather than assumed (§3.5) — against
   a representative document size, the same "measure before building" discipline 011 §8-2 used for its
   own timing question.
6. **Design translation** — no mockup for the edit-mode chrome (the toggle's placement, the editor/preview
   split layout, save/conflict/error messaging) is known to exist at this draft's evidence base, the same
   gap 007 §7-10/010 §7-7/011 §7-9 each named for their own milestones. `plan.md` should confirm whether
   one exists or needs producing, and verify every token against `readerCss.ts`/`design/tokens.css`
   before use.
7. **The sibling-checklist audit**, owed before the first edit-mode test is written (M6 retro finding 4,
   restated at every milestone since). M12 adds a genuinely new class of surface (a write path, not just
   a new render engine) — enumerate the property set from every existing sibling (the folder-read
   capability's own consent/revoke/re-prompt shape in `PERMISSIONS.md`'s ledger is the closest analogue
   for the permission side; `diagramEnhancer`/`mathBlock` for the lazy-load/degrade side) and record each
   property present/absent/explicitly out-of-scope for the save-back capability specifically.

## 8. Product decisions routed to gate 3 (measure first, then choose)

*The D-8 pattern: the axes are settled here, the values are chosen by a human at a separate gate, from
measurements a measurement task produced and is forbidden from choosing from.*

1. **The conflict/overwrite UX, once §7-3's mechanism question is answered.** **Axes:** silently refuse
   the save and tell the user to reload · offer a merge/diff view (reusing `diffChrome.ts`'s existing
   diff rendering, built for snapshots) · let the user force-overwrite with an explicit confirmation.
   **What the plan measures/produces:** a walk of each option against a real conflicting-edit scenario
   (watched file changes externally while being edited), the same "design translation" shape 007/010/011
   each used for their own UI-shape gates.
2. **The live-preview debounce interval**, once §7-5's own timing measurement exists. **Axes:** a fixed
   interval vs. an adaptive one keyed to document size · whether a very large document (the existing
   10 MB/50k-line NFR, spec §8) needs a coarser preview cadence than a typical one. **What the plan
   measures:** re-render wall-clock across a representative document-size corpus, median and floor, the
   same shape 007 §8-2/011 §8-2 both used for their own render-cost questions.
3. **Whether edit-mode sessions should integrate with M6's existing snapshot mechanism at all** (§6's own
   named gap). **Axes:** no integration (current lean, stated in §6) · snapshot on save · snapshot on a
   timer while editing. **What the plan measures:** nothing yet — this is named here so a future gate
   that wants to open it has a stated home, not because this milestone measures toward an answer.

## 9. Decisions gate 1 must make

*Things this draft could not settle from the source material, stated as questions rather than smuggled
in as defaults.*

1. **D-A · In-shell mode vs. a separate editor surface (§3.3).** **Recommendation: confirm in-shell** —
   extend the existing app-page shell/`ReaderMode` shape rather than building a new entrypoint, on the
   reasoning in §3.3 (AGENTS.md's own "editor is a mode, not a separate app" framing, the existing shell
   `entrypoints/app/main.ts` already hosts, and the lazy-load discipline that keeps it free). The
   underlying architecture is `plan.md`'s to design; the SHAPE (a mode, not a page) is gate 1's to confirm
   or overturn here.
2. **D-B · The save-back write surface — TWO questions, recommended to be routed differently (§3.4).**
   **(i) The permission mechanism itself** (manifest change or not) is recommended as a **task-level
   measurement**, not a human gate — verify against the current File System Access API spec (§7-1) the
   same way task 1.1 measures bytes every milestone; it only escalates back to a human gate IF it
   surprises by requiring a manifest permission, per AGENTS.md #4. **No recommendation on the outcome
   itself** — the API has not been re-verified for this draft. **(ii) The conflict/overwrite POLICY**
   (§7-3, §8-1) **is recommended as a gate-3-style product-feel decision** once a measurement/walk
   exists, not something this draft or a task should choose alone. **Gate 1's own call: confirm this
   routing** (mechanism = task-level unless it surprises; policy = a later product gate) rather than
   either being decided here.
3. **D-C · Live preview through the existing pipeline, debounced (§3.5).** **Recommendation: confirm** —
   no new renderer, no new sanitizer profile, on the reasoning in §3.5, which this spec finds no reason
   to depart from (CodeMirror introduces no new generated-markup shape the way Mermaid/Temml each did).
   The debounce interval itself is explicitly NOT gate 1's number to pick (§8-2).
4. **D-D · The dependency gate's own framing (§3.6).** **Recommendation: confirm** — task 1.1 proceeds as
   a measured confirmation of a reported-but-unverified figure, not a scope fork the way M10's/M11's own
   task 1.1s were. If gate 1 disagrees and wants CodeMirror's fit treated as still genuinely open (e.g.,
   distrustful of the prior session's spike numbers), task 1.1's own Verify line should say so explicitly
   rather than this spec asserting confidence gate 1 does not share.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next
artifact and the next gate, generated in a **fresh session**, and it resolves the §7 risks above against
the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code
before tasks.md is approved** (WORKFLOW.md §5.3)._

_Standing verification rules this milestone inherits and must not re-derive: every regression test is
verified **revert-and-fail**, red with the defect's own signature in the defect's own units (M6 retro
finding 5); every empirical claim carries a **positive control that fires** (finding 1); every perf
number is **A-B-A with the floor beside the median** (finding 7); the close gate **records its
viewport(s)** the way it records its engines, and walks at least one WIDE viewport because this milestone
ships new chrome (finding 2); bundle-affecting tasks measure `pnpm build` + `pnpm zip` + `.output` size as
a mandatory Verify step (009's own 4.3 finding); browser-suite assertions about shared cross-file state
are delta- or specific-content-based, never absolute or pristine-state-assuming (AGENTS.md's
harness-shared-state rule)._
