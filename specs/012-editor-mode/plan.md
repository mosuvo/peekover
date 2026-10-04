# Plan 012 — Editor Mode (focused core): edit → live preview → save-back, via CodeMirror 6 (M12)

**Status:** draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-10-03 · revised 2026-10-04 (D-7 flipped to content-comparison lead by human ruling; seam-check
fixes to cross-references after the parallel-draft merge — still a draft, nothing here approves it)
**Spec:** `specs/012-editor-mode/spec.md`, approved at gate 1 (`decisions.md`'s 2026-10-03 **M12 GATE 1**
entry, all four §9 rulings). This plan is the HOW; it resolves the spec's seven §7 risks against the
**actual code at HEAD `a08dfff`**, not against the spec document. No §3.x decision is reopened, and nothing
on the §6 IS-NOT list is proposed.

**Gate-1 rulings inherited, not re-argued:** **D-A** (§9-1, in-shell mode) — CONFIRMED; this plan designs
the mechanism (§0 D-1 below). **D-B** (§9-2, save-back) — the spec's own three-way routing, APPROVED: (i)
the **permission mechanism** is a task-level verification, escalating only if it surprises — **resolved
below, §1, and it did NOT surprise**; (ii) the **conflict/overwrite policy** is a gate-3 product-feel
decision — this plan designs only the detection MECHANISM (§0 D-7), not the UX; (iii) the `PERMISSIONS.md`
ledger update is a **mandatory** acceptance criterion, its exact WORDING needing a separate human
one-sentence sign-off — this plan drafts a candidate sentence (§0 D-9) for that sign-off, not a final
answer. **D-C** (§9-3, existing render pipeline, debounced, no new sanitizer) — CONFIRMED; §0 D-4/D-5
below resolve a real architectural question the spec did not surface (the pipeline is reused, but not by
calling `mount()` on the document's existing host). **D-D** (§9-4, dependency gate as confirmation, not a
fork) — CONFIRMED; task 1.1 re-measures CodeMirror 6's real import graph against the ~500–607 KB spike
figure, same discipline, below.

**Evidence base:** every `file:line` the spec cited was re-read against this HEAD (results in §1's
preflight table — all STILL-ACCURATE, none moved, except the two enhancer call sites the spec did not
cite by number, which **have moved since `specs/011-math-rendering/plan.md`'s own citation** — named
explicitly as the re-derivation discipline's own evidence of working, not a drift to fix). Beyond the
spec's own citations, this plan reads `src/render/mount.ts` in full (the single most load-bearing finding
below turns on its exact `replaceChildren` contract), `src/watch/watchController.ts` in full (the existing
diff-deferral mechanism this plan extends rather than duplicates for the watch/edit collision),
`src/app/appShell.ts` and `src/app/readerPane.ts` (where the handle-carrying selection actually lives),
`src/render/diagramEnhancer.ts` (the lazy-load/memoization precedent), `design/mockup.html` and
`design/tokens.css` (a design asset for edit-mode chrome **does exist**, contrary to the 007/010/011
precedent this spec's §7-6 expected to repeat — see §3 risk 6), and `package.json` (confirms nothing
CodeMirror-shaped is installed; `temml`/`@mdit/plugin-tex` are, consistent with 011's shipped revisit).
**Two external contracts were verified against current documentation, not training knowledge** (AGENTS.md's
standing rule, with particular force here per spec §3.4/§3.6): the File System Access API's permission
model in a Manifest V3 extension-page context (MDN, the WICG spec, Chrome developer docs, and a
chromium-extensions mailing-list thread on the API's known per-tab permission quirk), and CodeMirror 6's
current package shape (npm). **Neither CodeMirror 6 nor any File System Access write call has been
installed or exercised for real** — this plan names the mechanism and cites the verified contract; task
1.1 (bytes) and the save-path task (the write itself) are where real code first touches either.

**★ The architectural precedent is `specs/011-math-rendering/plan.md` and `specs/007-mermaid-diagrams/plan.md`,
cited throughout by D-value and file:line — not paraphrased.** Editor mode is the same lazy-loaded,
app-page-only, client-side-library shape one milestone later, but it diverges from both in two respects
load-bearing enough to get their own D-values: **(1)** it is the first milestone to **write**, which this
plan resolves is architecturally cheaper than the spec feared (§1 below); **(2)** it is the first milestone
whose post-mount enhancement needs to **persist independently of `mount()`'s own re-render**, because
`mount()`'s full-shadow-root `replaceChildren` contract (006 D-15, unchanged since M1) would otherwise
destroy the editor's own live DOM on every watch-triggered or mode-entry re-render — this is not a
restatement of 007's/011's own "post-mount enhancer" shape, it is a genuine new architectural constraint
those milestones never had to solve, because neither diagram nor math enhancement holds state a re-render
must not destroy.

---

## 0. Decisions proposed at this gate (2026-10-03)

*Each gets a `decisions.md` entry, landing with the commit that implements it, naming the `decisions.md`
entry text the same way 011 §0 did.*

### D-1 · `ReaderMode` extends to a THIRD literal, `'edit'` — not a sibling flag. PROPOSED.

`decisions.md` entry draft: *"012 D-1 — edit rides `readerMode.ts`'s own carried-mode machinery as a third
`ReaderMode` value, not a parallel boolean, because `mount.ts`'s `preserveReading`/`CarriedReading.mode`
restore path (mount.ts:70-77, 216, 223) and `watchController.ts`'s attribute-gated deferral (below, D-8)
both already key off the ONE `data-mode` attribute; a sibling flag would be a second source of truth for
the same question."*

`readerMode.ts:28`'s `export type ReaderMode = 'reading' | 'raw'` — **re-verified STILL-ACCURATE, unmoved**
— becomes `'reading' | 'raw' | 'edit'`. This is the minimal-diff choice because the carry/restore machinery
mount.ts already built (task 3.3, watch mode) is written generically against `ReaderMode | null`
(`mount.ts:74`) and already restores whatever mode was live across a `preserveReading` re-render
(`mount.ts:223`) — extending the union costs nothing there. *Rejected:* a parallel `isEditing` boolean
alongside the existing mode (would need its own carry/restore wiring duplicating `CarriedReading`, and a
host could then disagree with itself about whether it is editing — two flags, one real state, the
`AGENTS.md`-flavoured anti-pattern this project has not built elsewhere).

**One real divergence from `raw`'s own mechanism, named so a future reader does not assume parity:**
`setReaderMode`'s existing three private pieces (`ensureRawView`, the `data-mode` attribute write,
`labelToggle`) are **entirely synchronous** — `ensureRawView` builds a `<pre>` from already-registered
source text, no I/O, no async boundary. Entering `'edit'` cannot be: it needs CodeMirror loaded first (D-2).
So `readerMode.ts` gains a new, exported **async** `enterEditMode(host): Promise<void>` — mirroring
`diagramEnhancer.ts`'s/`mathEnhancer.ts`'s own "feature-detect/load, THEN commit" shape, not
`setReaderMode`'s all-synchronous one — which performs the engine load (D-2), builds the split-pane layout
once (D-4), and only then flips `data-mode` to `'edit'` and relabels the control. `setReaderMode` itself
stays synchronous and untouched for the `'reading'`/`'raw'` pair; `'edit'` is reached through its own entry
point, not through `toggleReaderMode`'s binary flip.

**The product's own control surface reflects this:** the bare `\` shortcut (`TOGGLE_KEY`, `readerMode.ts:26`)
stays a **binary** reading↔raw cycle, unchanged — editor entry is a **dedicated control** (a new button,
alongside the existing mode-toggle pill), never folded into a three-way key cycle nobody asked for. This
matches the product spec's own F8 text quoted in spec §1 — *"Toggle: Read ↔ Edit"* is its own named control,
not an extension of the existing Raw toggle's semantics — and spec §3.1's own deferral of "any bespoke
keyboard-shortcut map" covers the EDITOR's internal bindings, not this entry-point design choice, which this
plan is making architecturally now because D-1's mechanism depends on it.

### D-2 · `src/render/editorEngine.ts` is the ONE module importing `codemirror` / `@codemirror/lang-markdown`, via static-literal specifiers. PROPOSED.

`decisions.md` entry draft: *"012 D-2 — one engine module, static-literal specifiers, on 007 D-13's /
011 D-2's own single-importer fence, extended to CodeMirror. No feature-detect gate is needed the way
diagrams/math need one — entering edit mode IS the trigger, unconditionally — so the gate is `loaded once
per host`, not `loaded if content present`."*

**Package shape, verified against npm's current listing, not memory** (AGENTS.md's standing rule — spec
§3.6/§7-4 names this exact trap): the `codemirror` package is the meta-package re-exporting `basicSetup`
(bundling `@codemirror/state` + `@codemirror/view` + the default keymap/history/gutter/line-number set) —
installing `codemirror` therefore installs its core dependencies transitively; `@codemirror/lang-markdown`
adds markdown syntax awareness and itself depends on `@lezer/markdown`. The SAME `codemirror` package also
exports `minimalSetup`, a lighter alternative to `basicSetup` (fewer default keymaps/extensions) — **named
here as the real choice task 1.1 (bytes) must make from a measured delta, not assumed**: `basicSetup` if
the byte cost is negligible against the ~2.04 MiB headroom (likely, per §3.6/D-D), `minimalSetup` plus a
hand-picked extension list only if task 1.1 finds a surprising cost. **No bespoke keymap is built regardless
(spec §3.1's own deferral) — whichever setup wins ships its own default bindings unmodified.**

**Load gate: memoized per host, mirroring `diagramEnhancer.ts`'s `enhancedHosts` Map (`diagramEnhancer.ts:509`)**
so toggling `edit → reading → edit` within one mount does not re-fetch the chunk — the module keeps a
`WeakMap<HTMLElement, Promise<EditorEngine>>` (or equivalent) keyed by the EDITOR'S OWN nested host (D-4),
not the outer reader host, since the outer host's own `mount()` cycle has nothing to do with the editor's
load lifecycle once D-4's nesting is in place.

### D-3 · The orchestration split: editor/preview MOUNTING follows the existing two post-mount-enhancer call sites; SAVE-BACK is injected as a capability from `appShell.ts`, never reached-for by the editor module itself. PROPOSED.

`decisions.md` entry draft: *"012 D-3 — `enhanceEditor`-shaped mounting rides the same two call sites
007/011 established, but the handle the save action needs is passed IN from `appShell.ts` as an injected
dependency (the `WatchControllerOptions.render`/`signal`/`now` precedent, `watchController.ts:268-280`),
never imported or reached for by an enhancer module — keeping every render-pipeline module capability-free
exactly as `diagramEnhancer.ts`/`mathEnhancer.ts` already are."*

**Re-derived, not assumed:** `readerPane.ts` is imported **only** by `appShell.ts`
(`grep 'from .\\./readerPane.' src/` — one production hit, `appShell.ts:28`'s `createReaderPane`) — it is
not an independently-reachable surface, it is `appShell.ts`'s own internal rendering factory, split into a
separate file for the same reason `watchController.ts` is its own file. `readerPane.ts`'s exported
`ReaderFile` interface (`readerPane.ts:32-37`) is **deliberately minimal** (`name` + `read()`) — its own
header states the scope: *"DOM/engine glue only... does NOT open folders, walk a directory, or touch
IndexedDB."* The object `appShell.ts` actually holds is the richer `MarkdownFile`, which **structurally
satisfies** `ReaderFile` but also carries an optional `handle` — confirmed live at `appShell.ts:1305`'s own
comment (*"`MarkdownFile.handle` now exists on the routes that genuinely have one"*) and held in
`appShell.ts`'s own `activeFile: MarkdownFile | null` state (`appShell.ts:687`, set via `setActiveFile` at
`appShell.ts:1132`, populated through `selectFolderFile` at `appShell.ts:1182`).

**The consequence:** save-back must not be built by widening `ReaderFile` to expose `handle` generally (that
would hand a write capability to a module whose whole architectural value is holding none), nor by having
the editor/enhancer module import `appShell.ts`'s internal state (there is no exported seam for that, and
building one would invert the dependency direction every other enhancer keeps — app glue depends on render
modules, never the reverse). Instead, **`appShell.ts` constructs a save callback closing over
`activeFile`'s own `handle`** (present or `undefined` — the SAME optionality that already distinguishes the
Chromium-handle route from the Firefox/no-handle route everywhere else in this file) and passes it into
`createReaderPane`'s options (a new injected field, the same shape `WatchControllerOptions.render` already
is) — the editor module calls the injected function, never touches a `FileSystemFileHandle` type itself,
and `readerPane.ts`'s own capability-free property is unbroken. The two existing post-mount call sites
(`readerPane.ts:188,191` and `appShell.ts:176,177` — **MOVED since `specs/011-math-rendering/plan.md`'s own
citation of `:187`/`:170`; re-derived here, not inherited stale, the exact drift the standing re-derivation
rule exists to catch**) gain a third line each, `enhanceEditor(host, { save })` / `enhanceEditor(target, {
save })`, immediately after `enhanceMath`.

### D-4 · ★ THE LIVE PREVIEW IS A `mount()` CALL ON A SEPARATE, NESTED HOST BUILT ONCE PER EDIT SESSION — NOT A SECOND RESPONSIBILITY ON THE DOCUMENT'S EXISTING HOST. PROPOSED, and it is the plan's single biggest architectural finding.

`decisions.md` entry draft: *"012 D-4 — `mount()`'s own `shadow.replaceChildren(...)` contract
(`mount.ts:218`) rebuilds a host's ENTIRE shadow root on every call, chrome included; calling `mount()` on
the document's own host for live-preview purposes would destroy the editor's own DOM (and every other piece
of mount-composed chrome) on every debounced keystroke. The preview pane is therefore `mount()` called on a
FRESH child host, created once when edit mode begins and torn down when it ends — `mount.ts` itself stays
byte-untouched (006 D-15, re-affirmed every milestone since, unbroken here)."*

**Re-read in full, not assumed from the spec's own framing:** `mount.ts:113-229` confirms every single
piece of reader chrome (`buildReaderStyle`, the mode-toggle pill, the theme control, watch chrome, diff
chrome, the agent badge, the TOC rail, and the reading column itself) is committed together via ONE
`shadow.replaceChildren(...children)` call (`mount.ts:218`), and the mode is unconditionally reset to
`'reading'` immediately after (`mount.ts:223`, `carried?.mode ?? 'reading'`) unless `preserveReading` was
set. **This is a hard constraint spec §3.5's own "a second producer of text for the same consumer" framing
glossed over**: there is no way to ask `mount()` to replace only PART of a shadow root, because shadow roots
attach once per host (`mount.ts:92-93`, `attachShadow` throws on a second call) and `mount()`'s entire
contract is "I own this host's shadow root."

**The resolution, which keeps `mount.ts` itself at zero diff (the same non-negotiable 011 D-3/006 D-15
state):** `enterEditMode` (D-1) builds, once, a plain child element inside the OUTER host's existing shadow
root — a sibling of the reading column, the same "chrome lives beside `root`, never inside it" discipline
`mount.ts`'s own comments already state for the theme control/watch chrome/diff chrome (`mount.ts:157-198`)
— and calls `host.attachShadow`/`mount()` **on that nested element**, never on the outer host, for every
subsequent debounced preview update. The CodeMirror editor view itself is a second sibling element, built
directly by `editorEngine.ts` as its own DOM (spec §3.5's own text: *"CodeMirror renders its own editing
chrome as its own DOM construction... not user-controlled HTML reaching `innerHTML`"*) — never through
`mount()` at all. `readerCss.ts` gains the `[data-mode="edit"]` CSS (mirroring how `[data-mode="raw"]`
already toggles the raw `<pre>`'s visibility today) that lays the two siblings out as the split pane, a
shape `design/mockup.html:300-308`'s `.editor{display:grid;grid-template-columns:1fr 1fr}` already shows
verified against tokens (§3 risk 6).

**The preview's own re-render reuses `mount()`'s existing `preserveReading`/anchor-capture machinery**
(`mount.ts:70-77`, `captureReading`/`restoreReadingAnchor`) — the SAME mechanism `watchController.ts`'s
`renderNow` already uses for watch-triggered re-renders (`watchController.ts:449`) — so a debounced preview
update does not snap the preview pane back to its top on every keystroke. This is the concrete shape of
spec §3.5's "second producer, same consumer": the consumer is `mount()`, called with the SAME options shape
an existing caller already uses, on a host nobody but the editor module ever sees.

### D-5 · The editor→preview debounce candidate mechanism — named, not chosen. The interval stays gate-3's (§8-2), per spec.

The spec explicitly forbids this plan from inventing a number (§3.5, §8-2) — but it does not forbid naming
a MECHANISM candidate, and one already exists in this codebase solving the identical shape of problem:
`watchController.ts`'s DECISION 3 cost-proportional cooldown (`COOLDOWN_MULTIPLIER`, `watchController.ts:183-191`)
throttles bursty external updates and coalesces to the newest text, never queuing. CodeMirror's own
`onChange`/update listener is a structurally identical burst source (keystroke-rate, not file-write-rate).
**Named as the leading candidate for the debounce mechanism** (reuse the cost-proportional shape, a NEW
instance scoped to the preview host, not a shared module-level one) — the actual interval/multiplier is
still the gate-3 measurement's to produce (§7 below), and a fixed-vs-adaptive choice is explicitly §8-2's
own axis, not this plan's to resolve.

### D-6 · The save-back mechanism — verified against current docs, and it resolves CLEANER than the spec feared. The permission mechanism did NOT surprise; `permissions: []` holds. RESOLVES §7-1.

`decisions.md` entry draft: *"012 D-6 — `FileSystemFileHandle.requestPermission({mode:'readwrite'})` is a
standard web-platform, per-handle, user-gesture-gated API with no browser-extension manifest counterpart;
verified against the current WICG File System Access spec, MDN, and Chrome's own extension-context
discussion, not training knowledge. §7-1's own central risk did not surprise."*

**The verified facts, each cited:**
- `requestPermission()`/`queryPermission()` resolve `'granted' | 'denied' | 'prompt'`, require a **secure
  context** and **transient user activation** (a real user gesture — the WICG spec's own text, quoted by
  MDN: *"There was no transient user activation... This includes when the handle is in a non-Window
  context... such as a worker"*). An extension's app page (`chrome-extension://`) is a secure, `Window`
  context — exactly the context class this requirement is written FOR, not against — and the save action
  is reached through a real click, so the activation requirement is satisfied by construction, the same way
  `pickDirectory`'s own gesture-gated `showDirectoryPicker` call already is (`chromiumFolderSource.ts:39-41`).
- **No manifest permission is implicated.** The File System Access API (`showDirectoryPicker`/
  `showOpenFilePicker`/`FileSystemHandle.requestPermission`) is the MODERN, cross-context web-platform
  replacement for the legacy, Chrome-Apps-only `chrome.fileSystem` permission (deprecated 2020, ChromeOS
  Enterprise/Education only past 2025) — the two are easily conflated, and verifying the distinction
  explicitly here is the point of AGENTS.md's "verify against current docs" rule for exactly this class of
  trap. `permissions: []` (`tests/manifest.test.ts:38`, `expect(m.permissions).toEqual([])`) is unaffected.
- **Permission is per-HANDLE, not inherited from an ancestor directory's own grant** (verified against the
  WICG spec's permission-state algorithm directly) — a `FileSystemFileHandle` obtained by enumerating a
  directory handle that itself was only ever granted `'read'` (`pickDirectory`'s own `{mode:'read'}`,
  `chromiumFolderSource.ts:39-41`) can still independently resolve `requestPermission({mode:'readwrite'})`
  to `'granted'`. **This directly resolves §7-2 more cleanly than the spec anticipated** — see §3 risk 2.
- **One corroborating, non-blocking caveat, found in a chromium-extensions mailing-list thread discussing
  this exact API in an extension-page context:** permission grants are **per-tab-instance**, not reliably
  shared across duplicated tabs of the same origin even within one browsing session — a known FSA quirk,
  not an extension-specific restriction, and already consistent with this project's own existing
  `PERMISSIONS.md` "access is lost on tab close / reload until re-granted" framing for READ (row 1, `line
  40`). Named as a risk in §4, not a surprise requiring escalation — the re-prompt-on-reopen UX this project
  already ships for read is the same UX write naturally inherits.

**The mechanism, concretely:** on Save, call `activeFile.handle.requestPermission({ mode: 'readwrite' })`
(gated on the Save click's own activation — a prior "enter edit mode" click's activation cannot be assumed
to still be live by the time of a later save, so the request happens at the save gesture itself, not
eagerly on edit-mode entry); on `'granted'`, `handle.createWritable()` → write the buffer → `close()`; on
anything else (`'denied'`, or `activeFile.handle === undefined` — Firefox, or a dropped-without-persistable-
handle route, the SAME optionality `appShell.ts` already branches on for every other handle-dependent
feature), fall back to a client-side download — **reusing `src/export/htmlExport.ts:340`'s existing
`downloadAs(text, filename, mimeType = 'text/html')` rather than building a new Blob/anchor mechanism.**
Re-derived, not assumed: that function is already the project's one download primitive (its own header
cites it as reused verbatim from 007's diagram-download control, including the detached-anchor-timing and
deferred-revocation details a from-scratch implementation would have to re-earn) — editor mode's fallback
calls it with the buffer text and the document's own filename, passing an explicit mime type rather than
relying on its `'text/html'` default. This is the plain web-platform download mechanism, **not** the
`chrome.downloads` extension API (which IS a manifest permission) — keeping `permissions: []` intact on the
fallback path too, exactly as spec §4's Trust criterion requires.

### D-7 · The conflict-DETECTION mechanism (not the policy) — CONTENT COMPARISON is the LEAD and the shipped default; `lastModified`/`size` is a measurement-gated optimization that may only ever fall through to it. RESOLVES §7-3's mechanism half. FLIPPED 2026-10-04 by human ruling (this draft previously led with metadata).

Gate-1 ruled the detection MECHANISM is this plan's to design; the user-facing POLICY stays gate-3's (§8-1)
— unchanged by anything below.

**★ Lead mechanism — content comparison.** The edit session retains `originalText`: the exact string the
file's own `read()` returned and the editor buffer was seeded from, captured when `enterEditMode` begins. At
save time, before `createWritable()`, the file's CURRENT text is re-read through the same primitive every
reader already uses — `fileNodeFromHandle`'s `read`, `(await handle.getFile()).text()`
(`chromiumFolderSource.ts:60`, **re-verified STILL-ACCURATE at HEAD `6726758`**) — and compared to
`originalText` by strict string equality. **A difference is a conflict**; what the user then sees is §8-1's.
Four details, each load-bearing:

- **The re-read needs no new capability and no handle type in a render module.** `fileNodeFromHandle`'s
  `read` is exactly what `ReaderFile.read()` (`readerPane.ts:32-37`) already hands the pane, so the compare
  rides the reader's existing seam; D-3's "the editor module never touches a `FileSystemFileHandle`" boundary
  is unbroken. The compare itself is a pure predicate over two strings.
- **`originalText` is the RAW read result, never re-derived from the editor's document.** CodeMirror's
  document model is line-based and is not assumed to round-trip a file's own line endings byte-for-byte
  (unverified against the installed package — nothing CodeMirror-shaped is installed yet); a snapshot taken
  back out of the editor could report a false conflict on every save. The snapshot therefore never passes
  through the editor at all.
- **After a successful write, `originalText` becomes the text just written** — otherwise the second save of
  one session compares against a baseline the first save already replaced, and conflicts with itself.
- **The no-handle route runs no compare.** Firefox / declined-write saves are a download (D-6) and overwrite
  nothing on disk, so there is nothing to conflict with.

**Cost, stated honestly.** One whole-file read per save. The only measured figure the project holds for this
shape of read is ~0–1 ms for a small file and ~2–8 ms at 1.12 MiB (`changeDetector.ts:23-24`,
`decisions.md` 2026-07-19) — **measured on Firefox's `entry.file().text()` poll, not on Chromium's
`handle.getFile().text()`**, so it is cited as an order of magnitude, not as a measurement of this path.
Either way the read happens once per user-gestured save, strictly cheaper than the once-per-poll-tick use
`changeDetector.ts` already ships.

**One residual this mechanism does not close, named rather than papered over:** the re-read and the write are
not atomic. An external rewrite landing between the compare and `createWritable()` is caught by NO
read-then-write scheme, metadata or content. The compare runs immediately before the write to keep that
window as small as the API allows; it is not zero.

**★ Why content leads (the ruling's reasoning, banked here).** Silent overwrite is spec §3.4-iii's cardinal
sin — on this path, being wrong is silent data loss. The project holds a BANKED, MEASURED precedent that
file metadata silently lied on a shipped path: `decisions.md`'s 2026-07-19 **TRAP 2** (`changeDetector.ts:9-24`)
— on Firefox's drag route `size`/`lastModified` are frozen at drop time and only `.text()` reads fresh bytes,
found by ~45 polls across a real on-disk edit, "measured, not reasoned about", the kind of defect that "would
compile, type-check, pass a naive test, and silently never fire." This draft's earlier lean — that TRAP 2
does not transfer because the modern `FileSystemFileHandle.getFile()` is documented to return current state,
and because save-back's handle is Chromium-only via `fileNodeFromHandle` — may well be true, but it is itself
an UNVERIFIED, reasoned claim about browser behaviour: the exact shape of assumption TRAP 2 exists to forbid.
For a data-loss-critical path the burden of proof sits on the cheaper mechanism, not the safe one. Content
comparison is the identical content-over-metadata discipline `changeDetector.ts` already ships, so it is
correct by default; metadata earns a role only on measurement.

**Metadata (`lastModified`/`size`) — a measurement-gated OPTIMIZATION, never the correctness decision.**
- **Until proven, metadata is not read at all for conflict detection.** Nothing ships that consults it.
- Group 5 (or a later measurement task) MAY promote it to a cheap pre-check **only if** a real on-disk-edit
  measurement — the same rigor that found TRAP 2, on the actual `FileSystemFileHandle.getFile()` path —
  proves the metadata reliably moves (§7's optional probe).
- **Even if promoted, it is a fast path that falls through to the content compare, never a replacement for
  it.** A metadata MATCH does not confirm "no conflict" unless that measurement proved
  metadata-moves-reliably. A metadata MISMATCH may be an early conflict signal — but the content compare is
  what RULES, in both directions.

**What this plan does NOT do:** choose what the user sees when a mismatch is found (silently refuse / offer
`diffChrome.ts`'s existing diff view, confirmed present and reusable at `src/render/diffChrome.ts` — 582
lines, already builds a snapshot/file/text diff affordance — / force-overwrite-with-confirmation) — that
stays §8-1's own gate-3 ruling, from a walk of a real conflicting-edit scenario, per spec.

### D-8 · ★ THE WATCH/EDIT COLLISION — SUPPORTED, DEGRADED: editing a watched document PAUSES its live re-render via the SAME deferral gate `watchController.ts` already built for a displayed diff, with one necessary asymmetry on exit. RESOLVES §7-3's own named sharpest risk.

`decisions.md` entry draft: *"012 D-8 — the watch relay's own DECISION 4 (2026-07-23, `watchController.ts`'s
`data-diff`-gated deferral) is the exact mechanism the edit/watch collision needs, extended by one more
gated condition; the one new wrinkle is that an edit session's exit-flush cannot be silent the way a diff's
is, because unlike a displayed diff (read-only), an edit session holds unsaved local state a silent
`replaceChildren` would destroy."*

**The existing mechanism, re-read in full (`watchController.ts:102-135, 193-204, 319-364, 484-528`):** when
a diff is displayed (`data-diff` present on the host), `onText` **coalesces but never renders** — the
incoming text takes the single pending slot, `pendingSetByDefer` is set, and nothing touches the DOM until a
`MutationObserver` on that SAME attribute (`installDiffObserver`) sees it clear, at which point the deferred
text flushes and the reader is told the document changed while they were comparing (`CHANGED_AGAIN_NOTE`).
This is built, tested, and already proven at this exact collision shape — "a second thing to look at in the
SAME host, which a live re-render would replace with no warning."

**Edit mode is the identical shape, with the identical fix, EXCEPT for one thing that must NOT copy
verbatim:** `diffDisplayed()`'s literal-attribute read (`DIFF_DISPLAYED_ATTR = 'data-diff'`, deliberately
NOT an import, per the 5.1 two-layer import fence Clause C) extends to ALSO treat `host.getAttribute(
'data-mode') === 'edit'` as a deferral condition — `data-mode` is already read exactly this way elsewhere in
this module's own graph (`readerMode.ts`'s `isEditableTarget`/shortcut guard reads the same attribute by
literal), so this costs no new import and no new attribute. **The divergence:** `onDiffExited`'s own
unconditional flush-and-render (`watchController.ts:356-364`) is SAFE for a diff (nothing is lost — the diff
is a read-only comparison) and UNSAFE for edit mode (the deferred external text, if auto-applied via
`replaceChildren`, would silently destroy the CodeMirror instance — D-4's own nested-host preview pane too —
and whatever unsaved content the user was mid-typing). So **exiting edit mode does NOT auto-flush the
deferred render the way exiting a diff does**: instead, the deferred external change is handed to D-7's own
conflict-detection state as an EARLY signal (deferred text that differs from D-7's `originalText` is the SAME
"something changed on disk since I started" fact D-7's save-time content compare independently discovers —
the watch relay's hint never replaces that compare, which still runs on every save and is what RULES; a
document that is not being watched gets no hint and is covered by the compare alone) — if the user exits
edit mode with NO unsaved changes, the deferred render simply flushes (equivalent to never having edited at
all); if they exit with unsaved changes pending, or attempt to save, the conflict surfaces through §8-1's
own gate-3 UX rather than through a silent DOM replacement.

**Ruling, stated as the spec itself asked for:** editing a watched document is **SUPPORTED, DEGRADED** —
not disallowed (the user may still enter edit mode on a watched file) and not fully live (the reader will
not see the watch relay's own re-render WHILE editing — correct, since showing it would require tearing
down the exact DOM the user is typing into). This composes cleanly with the existing architecture because
`data-mode === 'edit'` is false everywhere the diff/watch machinery already runs today except the one app-page
surface edit mode is scoped to (§3.2) — the same "an architectural fact, not a runtime branch" property
006 D-14's own content-script exclusion already relies on for diffs.

### D-9 · The `PERMISSIONS.md` ledger wording — a DRAFT sentence for the human sign-off gate-1's D-B(iii) requires. NOT final.

Gate-1's own human addition: the exact WORDING of the new ledger claim is a trust-story positioning call
returning to the human for a one-sentence sign-off, separate from the mandatory-ness of the edit landing at
all. This plan proposes a CANDIDATE, in the ledger's own established voice (PERMISSIONS.md's table rows +
its closing summary line at `:52`), for that sign-off — not a final answer:

- **Summary line (`PERMISSIONS.md:52`) replacement candidate:** *"It cannot read outside a chosen folder or
  write to it without the user explicitly opening that file for editing and saving, and cannot reach the
  network."* (Replaces *"It cannot read outside a chosen folder, cannot write, and cannot reach the
  network."*)
- **New ledger row candidate** (same five-column shape every existing row uses): **Capability** "Edit
  save-back (M12 / spec 012)" · **Trigger** "User enters edit mode on an already-open document and saves —
  one gesture per save; never on a timer, never silent." · **What it can touch** "Only the ONE file the user
  is editing, write access requested at the moment of save (Chromium `requestPermission({mode:
  'readwrite'})`); Firefox / declined-write saves as a download instead, touching nothing on disk." ·
  **Storage** "No new storage — the write targets the user's own file on their own disk, the identical
  `FileSystemFileHandle` folder-read already held (capability ref only, never file contents, per the
  existing folder-read row)." · **How the user sees & revokes it** "The same granted/revoke chip and
  re-prompt-on-reopen behaviour folder-read already uses, now covering write; declining the write prompt
  degrades to the download fallback rather than failing silently."

The save task that lands D-6 drafts the FINAL sentence and carries it back for the human's one-line
sign-off per gate-1's own ruling — this plan's candidate is evidence that the honest wording is
findable, not a pre-empting of that sign-off.

### D-10 · The content-script exclusion — structurally impossible, confirmed, and checked the same way every prior engine is. CARRIES, no new mechanism.

Spec §3.2's own reasoning (no `FileSystemFileHandle` ever reaches the content-script graph; `editorEngine.ts`'s
specifier would need `web_accessible_resources`, which `tests/manifest.test.ts` forbids outright) is
re-confirmed, not re-argued. **Checked concretely:** `scripts/check-dynamic-imports.ts`'s `MUST_NOT_FIRE`
fixture (the same mechanism that already polices `katex`/`mermaid`/`temml` staying out of the content-script
module graph) gains `codemirror` and `@codemirror/lang-markdown` to its forbidden-specifier list — a
task-1.1-adjacent, mechanical addition, named here so tasks.md does not have to rediscover which file owns
this check.

---

## 1. §7-1 resolved in full — the FSA write-permission mechanism (the milestone's own front-loaded risk)

**Verified against the current WICG File System Access specification, MDN's `FileSystemHandle.
requestPermission()`/`queryPermission()` pages, Chrome's own developer documentation (`developer.chrome.com/
docs/capabilities/web-apis/file-system-access`), and a chromium-extensions mailing-list thread discussing
this exact API from inside an extension page — none of this is training-knowledge recall.**

**The question (spec §7-1, verbatim):** does `handle.requestPermission({mode:'readwrite'})` (or re-picking
with `{mode:'readwrite'}`) grant write on an already-read-granted handle, in an MV3 extension's app-page
context, with NO manifest permission?

**The answer: YES, and it did not surprise.** `requestPermission()` is a standard Web Platform API method on
`FileSystemHandle` (both file and directory subtypes), gated by (a) a secure context — `chrome-extension://`
qualifies, the app page is a plain `Window` document, not a service worker — and (b) transient user
activation — a real click, which the save action already has. It resolves `'granted'`/`'denied'`/`'prompt'`
per-HANDLE; nothing about the extension-page context changes this from a top-level page's own behaviour.
**There is no browser-extension manifest permission in this API's path at all** — it is the modern
replacement for the deprecated, Chrome-Apps-only `chrome.fileSystem` permission, a different, legacy API
this project has never used and need not reason about further. `permissions: []` (`tests/manifest.test.ts:
38`) holds, unconditionally, per §3.4-i's own lean confirmed rather than merely assumed.

**Consequence per §4/§9's own Trust criterion:** since D-6 did not surprise, the manifest-change escalation
branch (§4's own "UNLESS §3.4-i's own verification shows the File System Access write capability genuinely
requires one... itself an escalation back to a human gate") **does not fire**. No human gate is needed for
this risk; the only remaining human-facing item from §9-2 is D-9's ledger-wording sign-off, already named
and scoped narrowly above.

**One caveat, named as a risk (§4), not a surprise:** a chromium-extensions mailing-list thread describes a
known FSA quirk — permission state is not always reliably shared across multiple DUPLICATED tabs of the
same origin, even within one session. This is a general FSA property, not an extension-specific restriction,
and this project's own `PERMISSIONS.md` already documents the read-side analogue (handle access is lost on
tab close/reload until re-granted, row 1, `:40`). The write path inherits the identical re-prompt-on-reopen
UX by construction — named so a future task does not treat a re-prompt in a duplicated tab as a regression.

**§7-2, resolved alongside, and more cleanly than the spec anticipated:** the spec worried that upgrading to
write capability would require `chromiumFolderSource.ts`'s `pickDirectory`/`fileNodeFromHandle` split
(`:33-63`, **re-verified STILL-ACCURATE, unmoved**) to grow "a second, file-scoped permission request path
alongside the existing folder-scoped read one." **It does not.** Permission state is per-handle, not
inherited from an ancestor directory's own grant (verified against the WICG spec's permission-state
algorithm) — a `FileSystemFileHandle` obtained by enumerating a directory handle granted only `{mode:
'read'}` can independently request and receive `{mode: 'readwrite'}` on itself. **`chromiumFolderSource.ts`
needs ZERO changes** — `pickDirectory`'s own `{mode:'read'}` argument (`:40`) stays exactly as documented
(*"Read-only mode: Peekover never writes to the chosen folder"* — true of the FOLDER handle, which this
milestone never asks for write on). The upgrade call lives entirely at the save task, on the ONE file
handle `MarkdownFile.handle` already carries (D-3) — the MOST consent-minimal shape the spec's own §7-2
reasoning was reaching for, achieved with less new code than it expected, not more.

---

## 2. Files to create / touch / NOT touch

**Create** — `src/render/editorEngine.ts` (D-2: the CodeMirror importer, config, per-host load memoization)
· `src/render/editorEnhancer.ts` (D-3's orchestration — `enhanceEditor(host, {save})`, imported by
`appShell.ts` and `readerPane.ts` only) · `src/render/editorView.ts` (D-4's nested-preview-host mechanics,
the split-pane DOM, D-7's `originalText` snapshot and its pure content-compare predicate, the
save/conflict/error status region) · test files per
§5.

**Touch** — `src/render/readerMode.ts` (D-1: `ReaderMode` widened to include `'edit'`; the new async
`enterEditMode` export; `labelToggle`/`setReaderMode` gain the third case) · `src/theme/readerCss.ts` (the
`[data-mode="edit"]` split-pane layout CSS, tokens verified against `design/tokens.css`, design verified
against `design/mockup.html:299-310,673-688` — §3 risk 6) · `src/watch/watchController.ts` (D-8: the
`diffDisplayed`-style gate widens to also read `data-mode === 'edit'`; the exit-flush path gains the
conflict-handoff branch instead of `onDiffExited`'s unconditional render) · `src/app/appShell.ts` (D-3: the
injected `save` capability built from `activeFile.handle`, wired into `createReaderPane`'s options; one new
call-site line for `enhanceEditor`) · `src/app/readerPane.ts` (D-3: `createReaderPane`'s options gain the
injected `save` field; one new call-site line for `enhanceEditor`) · `package.json` (`codemirror`, `@codemirror/lang-markdown`) ·
`scripts/check-dynamic-imports.ts` (D-10: the two new specifiers added to `MUST_NOT_FIRE`) ·
`docs/trust/PERMISSIONS.md` (D-9's ledger update — mandatory per §4, wording pending the human sign-off).

**Reused, ZERO DIFF** — `src/export/htmlExport.ts` (D-6: `downloadAs()` is ALREADY exported, `:340`, and
`appShell.ts` already imports from this module, `:132`; the save fallback is a new CALLER passing an explicit
mime type, so the file itself does not change. Listed so `tasks.md` finds the fallback's one primitive and
builds no second Blob/anchor mechanism — not because it is edited).

**Explicitly NOT touched** — `src/render/mount.ts` (D-4's own central finding: zero diff, checkable at zero
call sites — the SAME property 006 D-15/011 D-3 already hold, now proven to survive a milestone that writes,
not merely reads) · `src/app/chromiumFolderSource.ts` (§1's own finding: no second permission path is needed
— `pickDirectory`/`fileNodeFromHandle` are byte-untouched) · `src/render/diagramEngine.ts` /
`diagramEnhancer.ts` / `diagramView.ts`, `src/render/mathEngine.ts` / `mathEnhancer.ts` / `mathView.ts`
(editor mode is a sibling system — no shared runtime state, the same "distinct `data-*` attribute, never a
shared one" discipline 011 D-8 drew against diagrams) · `src/render/runReader.ts` / `mountReader.ts` /
`src/watch/contentWatch.ts` (the content-script graph — §3.2/D-10, unreached by construction) ·
`tests/manifest.test.ts` (re-verified: it asserts `permissions: []` and the forbidden-key list, `:38-52` —
it pins no byte count to re-verify, a simpler finding than 011's own citation of a since-irrelevant figure)
· `tests/golden/output/*` (the editor introduces no new parse/sanitize output shape — D-C's own "no new
sanitizer profile" reasoning means golden stays untouched, unlike 011's own math-fixture growth).

---

## 3. Risk resolutions (spec §7 → concrete)

1. **★ §7-1, the permission mechanism itself.** RESOLVED in full, §1 above — did not surprise,
   `permissions: []` holds, no human escalation fires.
2. **§7-2, the write-mode-upgrade mechanism.** RESOLVED, §1 above, cleaner than feared — per-handle
   permission means `chromiumFolderSource.ts` needs no change at all; the upgrade is a single
   `requestPermission({mode:'readwrite'})` call on `MarkdownFile.handle` at save time (D-6).
3. **§7-3, the conflict policy and the watch-collision.** The MECHANISM half is RESOLVED: conflict
   detection via content comparison against the `originalText` snapshot (D-7 — `lastModified`/`size` is a
   measurement-gated optimization only, never the correctness decision); the watch/edit collision is SUPPORTED, DEGRADED,
   via extending `watchController.ts`'s existing diff-deferral gate (D-8) rather than inventing a parallel
   mechanism. The POLICY half (what the user sees on a conflict) stays gate-3's own (§8-1), per the spec's
   own routing.
4. **§7-4, CodeMirror 6's real package shape.** Verified against npm's current listing (D-2): `codemirror`
   (meta-package, `basicSetup`/`minimalSetup`) + `@codemirror/lang-markdown`. Task 1.1's own job to measure
   the real delta and choose between the two setups from that measurement, not from this plan's naming of
   them as candidates.
5. **§7-5, the debounce/responsiveness target.** NOT chosen here, per spec's own explicit routing to gate-3
   (§8-2) — a candidate MECHANISM is named (D-5, reusing `watchController.ts`'s cost-proportional cooldown
   shape), the number is not.
6. **§7-6, design translation.** **RESOLVED, and it diverges from the spec's own expectation.** Spec §7-6
   named the 007/010/011 precedent ("no mockup is known to exist") and asked this plan to confirm. **A
   mockup DOES exist**: `design/mockup.html:299-310` (`.editor{display:grid;grid-template-columns:1fr 1fr}`,
   a source/preview two-column shape) and `:673-688` (a dedicated `btnEdit` control distinct from the
   reading toggle, a `.edbar` toolbar, and the `#editor`/`#edPrev` split-pane markup). **Every token it uses
   is already present in `design/tokens.css`** (`--line`, `--code-bg`, `--ink`, `--serif`, `--mono` — spot-
   checked present, per AGENTS.md's "verify every token" rule). **What transfers to M12 and what does
   not, named explicitly so this asset is not over-read:** the TWO-COLUMN SPLIT LAYOUT and the DEDICATED
   edit-entry control (consistent with D-1's own "not a key-cycle" design) are in scope; the `.edbar`
   toolbar's bold/italic/code/task/table/find-replace/snapshots/lint buttons are ALL §6-DEFERRED F8 items —
   this mockup depicts F8's full 21-item end state, not M12's own focused core, and tasks.md must not treat
   its toolbar as something this milestone builds. The mockup's source pane is a plain `<textarea>` (a
   static demo); CodeMirror's own chrome (D-4) is the real implementation, not a transcription of the
   mockup's DOM.
7. **§7-7, the sibling-checklist audit.** Discharged below, §3.5.

### 3.5 THE SIBLING-CHECKLIST AUDIT (§7-7 · M6 retro finding 4) — the plan's deliverable

*Enumerated against the properties 007/011 §3.5 already established, since diagrams/math are editor mode's
closest siblings on the lazy-load/degrade axis, and the folder-read capability (`PERMISSIONS.md`'s own
ledger) is the closest analogue on the permission axis — not re-derived from scratch. `Y` = inherited
unchanged · `D` = a distinct assertion is required · `N` = genuinely NEW, no sibling analogue · `—` = out of
scope, with the reason.*

| # | property | editor mode (M12) |
|---|---|---|
| 1 | renders app-page-only, absent + no chrome on content-script | `Y` — same import fence (D-10), re-checked via `check-dynamic-imports.ts` |
| 4 | post-mount content lives beside, never destructively inside, what it enhances | `N` — **INVERTED FROM EVERY PRIOR ENHANCER**: diagrams/math mutate content `mount()` already committed; the editor's OWN content must SURVIVE a `mount()` re-render it does not control, which is why D-4's nested host exists at all. This is the plan's own defining new property, not a sibling's to inherit. |
| — | consent/revoke/re-prompt shape (folder-read's own ledger row, `PERMISSIONS.md:40,44`) | `D` — D-6/D-9: save-back gets its OWN ledger row, re-prompt-on-reopen inherited from the identical FSA behaviour read already uses, degrade-to-download on decline (not a dead end, matching the ledger's own "never a dead end" framing for re-prompts) |
| — | zero-network proof, with a firing control | `D` — group 5's own task (the first point all three surfaces exist): CodeMirror's chunk load, the preview re-render, and the save path (a local-disk write, proven as a non-network event rather than assumed one, the same discipline `folderMode.network.browser.test.ts` already applies to folder read) |
| 15 | state in TEXT and `aria-*`, never colour alone | `D` — save success/failure/conflict needs its own live-region text, mirroring `DIAGRAM_STATUS_CLASS`'s shape but for a WRITE outcome, which no existing status region covers |
| 16 | a real `<button>`, keyboard-operable | `Y` — the edit-entry control (D-1), the save control; CodeMirror 6's own baseline keyboard operability covers the editing surface itself |
| 19 | reduced motion: no animation under reduce | `—` **no animation is specified anywhere in spec §4/§5 for editor mode** — named so no task invents motion nothing asked for, the identical 011 §3.5 row-19 finding restated here |
| 20 | polite live region, out of the a11y tree while empty | `Y` — the save/conflict status region, mirroring `DIAGRAM_STATUS_CLASS`/math's own status-region shape |
| new | the watch/edit collision (no diagram/math analogue — neither interacts with the watch relay at all) | `N` — D-8's own deferral-gate extension; this property does not exist on either sibling because neither diagrams nor math hold state a watch re-render could destroy |
| new | never-lose-unsaved-work on exit/close/navigate (spec §4's own EARS item) | `N` — no sibling analogue; this is `beforeunload`-class guarding this project has not needed before, named as its own task rather than folded into an existing degrade path |

---

## 4. Risks & unknowns this plan still carries

1. **The exact `basicSetup` vs. `minimalSetup` choice (D-2) is unmeasured** — named as task 1.1's own fork,
   from a real installed-package delta, not assumed here either way.
2. **The FSA per-tab permission-sharing quirk (§1's own caveat)** is corroborated by one mailing-list
   discussion, not by this project's own real-engine test yet — group 5's own zero-network/permission test
   should exercise a duplicated-tab or reload scenario if Playwright's extension-loading harness permits it;
   if it cannot (the same class of limit that already keeps Firefox's own watch numbers human-gate-only),
   this stays a human-gate walk item instead.
3. **D-4's nested-host preview pane is an architectural design, not yet a measured one.** Whether a SECOND
   shadow root (the preview's own) nested inside the first carries any measurable first-paint/memory cost
   beyond the editor's own CodeMirror instance is unverified — named for task-level measurement alongside
   the debounce interval (§7), not assumed negligible.
4. **D-8's conflict-handoff on edit-mode exit is a mechanism, not yet a walked UX.** Whether "the deferred
   external change surfaces as a conflict at save time" READS as coherent to a user who watched nothing
   change while they edited is exactly the kind of design-translation question §8-1's own gate-3 walk must
   judge against a real conflicting-edit scenario, per spec's own routing — this plan states the mechanism
   is SOUND, not that its UX is proven legible.
5. **No design mockup is known to exist for the save/conflict/error messaging specifically** — `design/
   mockup.html`'s own edit-mode markup (§3 risk 6) shows the split pane and a toolbar, but nothing depicting
   a conflict dialog, a save-failed state, or an unsaved-changes-on-exit prompt. Confirmed absent at this
   plan's own evidence base; group 7 (the human milestone-close gate, which owns the design-translation
   walk) confirms whether
   one needs producing before the human walk.
6. **`@codemirror/lang-markdown`'s actual token/extension API (whether it needs configuration to recognize
   this project's own GFM extensions — task lists, footnotes — the same dialect `markdown-it` already
   parses) is unverified against the installed package** — group 3's own finding (where `editorEngine.ts` first
   configures it), named here as a
   plan-level unknown rather than assumed to need zero configuration.
7. **★ D-7's TRAP-2 doubt is RESOLVED by defaulting to the safe mechanism, not by argument.** The earlier
   draft led with `lastModified`/`size` on a LEAN (the modern `getFile()` API should report current state)
   and owed a measurement before shipping; the project has been burned by exactly that class of assumption
   (`decisions.md`'s 2026-07-19 TRAP 2). Content comparison is now the shipped mechanism (D-7), so nothing
   on the data-loss path rests on unmeasured metadata behaviour. **What remains open is strictly an
   optimization question**: whether metadata reliably moves on the real `FileSystemFileHandle.getFile()`
   path, which a measurement MAY later answer to promote it to a fall-through pre-check (§7's optional
   probe) — never a gate on shipping, and never a replacement for the compare. Two residuals D-7 names
   carry here as genuinely open: the non-atomic compare-then-write window (closed by no read-then-write
   scheme), and the per-save read cost on Chromium's own path, for which the project holds only a
   Firefox-path figure.

---

## 5. Test strategy

- **jsdom unit:** `ReaderMode`'s widened type and `enterEditMode`'s async load-then-flip sequencing (mocking
  the engine loader, the same seam `EnhanceOptions.loader` already gives diagrams) · the conflict-detection
  predicate (strict content comparison of the re-read text against `originalText`, D-7) as a pure function,
  including the baseline advancing to the written text after a successful save · the save-capability injection shape
  (a fake `appShell`-constructed `save` callback, asserting `readerPane`/`editorEnhancer` never import a
  handle type directly).
- **Real-engine (Chromium + Firefox), red-first and non-vacuous:**
  - **Absent on the content-script reader** (D-10), red-first by ungating — the identical 007/011 row-1/2
    shape.
  - **D-4's nested-host property, asserted directly:** the outer host's reading-column DOM (and any
    `mount()`-composed chrome) survives byte-identical across a preview re-render — reverted by having the
    preview accidentally call `mount()` on the outer host, which must go red by destroying the editor's own
    DOM, naming the regression in its own units.
  - **D-8's collision, asserted directly:** a watch-triggered external change arriving while `data-mode ===
    'edit'` produces NO DOM mutation to the reading column (coalesced, not rendered) and DOES produce one
    once edit mode exits with no unsaved changes — reverted by removing the `data-mode` branch from the
    deferral gate, which must go red by showing the editor's own DOM replaced mid-test.
  - **D-6's save mechanism, proven on a real OPFS-or-picker-granted handle:** `requestPermission({mode:
    'readwrite'})` resolves and a subsequent `createWritable()`/`close()` round-trip is readable back —
    Chromium only (the picker cannot be driven headlessly, task-0's own standing limit; the human gate
    confirms the live picker + a real local-disk write, same discipline M2's own grant→walk→read split
    already established).
  - **The zero-network proof**, covering CodeMirror's own chunk load, the preview re-render, and the save
    write — with a firing control proving a deliberately-broken guard WOULD be caught, the standing AGENTS.md
    rule.
  - **Every §3.7 failure degrades correctly**: CodeMirror fails to load (toggle unavailable, reader stays in
    its prior mode, never half-mounted) · the preview fails to render (the existing render-failure state
    appears in the preview pane, the editor buffer itself untouched) · save fails (status says so plainly,
    editor content retained unchanged) — each REVERT-AND-FAIL, red in the defect's own units.
  - **★ D-7's content compare is the LEAD, asserted directly, red-first:** a file rewritten out-of-band
    (through the same OPFS handle the test holds) after edit-mode entry, then saved, is caught as a conflict
    and is NOT overwritten — the on-disk text read back afterwards is the out-of-band text, byte-for-byte.
    The rewrite fixture is SAME-LENGTH as the original, so a `size`-based check could not have caught it and
    the assertion cannot pass on metadata by accident. Reverted by ablating the content compare (the save
    proceeding unconditionally), which must go red in the defect's own units — the out-of-band text gone
    from disk. **Firing control, the other direction:** with NO out-of-band rewrite the same save succeeds
    and a second save in the same session also succeeds (the advanced baseline), proving the check is not
    simply refusing every save. Chromium only, by construction (D-7: the no-handle route runs no compare).
  - **D-6's download fallback, asserted directly:** with no handle (the Firefox route) and with a declined
    write, Save reaches `downloadAs` with the buffer text, the document's own filename and an explicit
    markdown mime type — never its `'text/html'` default — and nothing on disk is written. Both engines.
  - **Unsaved-changes-on-exit** (§4's own EARS item, no sibling analogue): navigating away / closing the tab
    with unsaved edits warns; with none, it does not — both directions proven, not just the warning half.
- **Pins every task:** `tests/golden/output/*` asserted EMPTY (unlike 011 — the editor introduces no new
  parse/sanitize shape, D-C) · `tests/manifest.test.ts` green, `permissions: []` unmoved · the import fence:
  `codemirror`/`@codemirror/lang-markdown` in no content-script module graph, asserted statically AND by
  md5-identical content-script bytes under ablation, the 007/011 proof shape.
- **Revert-and-fail is the standard, not an option** (AGENTS.md's standing rule, restated per project
  convention) — every regression test here is verified red with the defect's own signature in its own units.
- **Human gate:** the live picker + a real local-disk write-and-reread (Task 0's own standing limit — the
  automation surface cannot drive `showDirectoryPicker`) · Firefox everything (Playwright cannot load an
  extension into Firefox) · the conflict UX walk (§8-1, once gate-3 rules the policy) · the save/conflict/
  error messaging's design translation (risk 5 above) · zero unexpected network with the Network tab open ·
  at least one WIDE viewport, recorded like an engine (M6 retro finding 2) · the split-pane layout against
  the actual mockup's own visual intent (§3 risk 6), not merely its CSS variable names.

---

## 6. Group order

*Sequencing only; `tasks.md` at gate 3 owns decomposition, in a fresh session.* Three hard constraints: **the
byte measurement (task 1.1) gates every group after it**, per D-D's own confirmation framing — nothing
downstream assumes the `basicSetup`/`minimalSetup` choice; **D-4's nested-host mechanism must land before
ANY live-preview wiring**, since every later group's preview call depends on it existing; **D-8's watch-gate
extension (group 4) must land before group 5's own zero-network/degrade tests**, since those tests need the
collision already handled to avoid a flaky watch-triggered remount mid-test.

**1 · The byte measurement.** Install `codemirror` + `@codemirror/lang-markdown` for real; measure
`.output`/`pnpm zip` deltas against the ~2.04 MiB headroom, decomposed to a residual; choose `basicSetup` vs.
`minimalSetup` from the real number (D-2); verify licence, no install scripts, `pnpm audit --prod` clean;
regenerate the SBOM; add both specifiers to `check-dynamic-imports.ts`'s `MUST_NOT_FIRE` (D-10). *Touches:*
`package.json`, `scripts/check-dynamic-imports.ts` only. *Acceptance:* D-D's confirmation is settled with a
decomposed number; the setup choice is made from measurement, not guessed.

**2 · `ReaderMode` extension + the nested-preview-host mechanism (D-1, D-4).** The riskiest, most
architecturally novel group, landed BEFORE any CodeMirror wiring so the split-pane shell exists and is
proven not to disturb `mount.ts`'s own zero-diff property before the editor itself is built into it.
*Touches:* `readerMode.ts`, `readerCss.ts` (the split-pane CSS, tokens verified against `design/
tokens.css`/`design/mockup.html`). *Must NOT touch:* `mount.ts`. *Acceptance:* entering/exiting `'edit'`
leaves the outer host's chrome byte-identical across repeated toggles; the nested host's own `mount()` calls
never touch the outer shadow root.

**3 · The engine module + enhancer scaffolding (D-2, D-3).** `editorEngine.ts`'s load/memoization, the
injected-`save`-capability wiring into `appShell.ts`/`readerPane.ts`, the two call sites. No save-back yet —
the editor is enterable, typeable, and previews live, but Save is not yet wired to disk. *Touches:*
`editorEngine.ts`, `editorEnhancer.ts`, `editorView.ts` (editor half), `appShell.ts`/`readerPane.ts` (the
injection point + call sites). *Acceptance:* §4's edit/preview EARS criteria; D-4's nested-host property
proven red-first.

**4 · The watch/edit collision (D-8).** `watchController.ts`'s deferral gate extended. Landed before
save-back so the collision is closed before a conflict can ever reach the save path untested. *Touches:*
`watchController.ts` only. *Must NOT touch:* `diffView.ts`/the diff feature's own substance — this group
widens an existing gate, it does not touch what the gate protects. *Acceptance:* D-8's SUPPORTED-DEGRADED
ruling proven both directions (deferred while editing, flushed or conflict-routed on exit).

**5 · Save-back (D-6, D-7, D-9).** The permission upgrade, the write/download fork, conflict detection,
`PERMISSIONS.md`'s ledger update (mandatory, wording pending human sign-off), the save-failure degrade path.
*Touches:* `editorView.ts` (save half), `appShell.ts` (the body of D-3's injected `save` capability — the
permission request, the write, and the `downloadAs` fallback call, group 3 having wired only its injection
point), `docs/trust/PERMISSIONS.md`. *Reuses, zero diff:* `htmlExport.ts`'s `downloadAs` (D-6). *Acceptance:*
§4's save/conflict-detection/failure-degrade EARS criteria; **content comparison is the SHIPPED
conflict-detection mechanism (D-7), proven red-first with its firing control (§5), and no shipped code path
consults `lastModified`/`size` for the conflict decision**; the download fallback proven on the no-handle
and declined-write routes; the zero-network proof across the chunk load, the preview re-render and the save
write (§3.5); `permissions: []` re-proven; the ledger sentence drafted and flagged for sign-off, not silently
finalized. *Optional, NOT acceptance:* the metadata-reliability probe (§7) — if run, it may at most promote
metadata to a fall-through pre-check per D-7's rules, and it is free to be deferred or never run.

**6 · Unsaved-changes guard + measurement (§7-5, §4 risk 3).** The `beforeunload`-class guard, the
debounce-interval measurement (D-5's candidate mechanism, gate-3's own number), the nested-host cost
measurement (§4 risk 3). *Produces numbers, forbidden from choosing a cache or interval design from them*
— the standing "measure, don't assume" discipline.

**7 · Human milestone-close gate + retro.** Including the design-translation walk (save/conflict/error
messaging, risk 5), the conflict-UX walk (§8-1), the live picker + real local-disk write/reread, Firefox
everything, the recorded viewports.

---

## 7. Measurement plan

*Every task below is forbidden from choosing a value or a design from its own output. Protocol for
anything timed: A-B-A against a same-session HEAD control, floor reported beside median, with the ablation
as the firing control.*

- **Byte delta (group 1)** — `codemirror`(+`basicSetup`)/`@codemirror/lang-markdown`, alone and combined,
  against the current ~2,142,607 B / ~2.04 MiB (Cr), 2,142,491 B / ~2.04 MiB (Fx) headroom; `minimalSetup`'s
  own delta measured alongside as the named alternative.
- **Debounce interval (group 6, §8-2)** — re-render wall-clock across a representative document-size corpus
  (mirroring `perf-watch.ts`'s own 50 KB / 1 MB fixture shape), median and floor, feeding the fixed-vs-
  adaptive axis gate-3 chooses from.
- **Nested-host cost (group 6, §4 risk 3)** — first-paint and memory delta of a mounted preview shadow root
  beside the outer reader's own, isolating whether the SECOND `attachShadow` carries a measurable cost
  distinct from CodeMirror's own footprint.
- **Metadata reliability (OPTIONAL optimization probe — group 5 or later, D-7, §4 risk 7; NOT a
  load-bearing gate, nothing ships waiting on it)** — on the real `FileSystemFileHandle.getFile()` path,
  across real on-disk edits at TRAP 2's own rigor (~45 reads spanning the edit, measured not reasoned),
  whether `lastModified` and `size` move on every rewrite, including a same-length rewrite and one landing
  within the timestamp's own granularity. A clean result permits — it does not require — promoting metadata
  to a pre-check that falls through to the content compare; any miss leaves metadata unused. Alongside it,
  the per-save `getFile().text()` read cost on Chromium's own path, which D-7 currently cites only from a
  Firefox-path figure.
- **First paint, edit mode never entered:** the existing gate against the current baseline, A-B-A, floor
  beside median — editor loading is entirely post-mount and gated on a user gesture (D-1/D-2), so a
  document that never enters edit mode should show zero delta; proving that is this measurement's whole job.

---

## 8. Gate-2 questions

1. **D-1's control-not-cycle design** (a dedicated edit-entry button, not a third state on the bare `\` key)
   — stated as a lean with reasoning, not forced on the human; confirm or overturn.
2. **D-9's draft ledger wording** — the candidate sentence/row above is a draft for the sign-off gate-1's own
   D-B(iii) names; this is NOT asking gate-2 to perform that sign-off now (the ruling ties it to "when the
   save task drafts it," i.e., group 5, a later task), but gate-2 may flag early if the candidate's register
   reads wrong against the project's own trust voice, before the save task inherits it.
3. **D-4's architectural weight** — this plan found a genuine new constraint (`mount()`'s full-shadow-root
   contract) the spec did not surface, and resolved it with a nested-host design rather than a `mount.ts`
   change. Confirm this is the right trade (a second shadow root per edit session) versus the alternative
   this plan rejected implicitly — teaching `mount()` itself a "replace only part of me" mode, which would
   break its own byte-untouched invariant for every milestone that depends on it. **No recommendation
   hidden here beyond the lean already stated in D-4** — surfaced explicitly because it is the plan's own
   biggest architectural call, not a mechanical one.
4. **D-8's SUPPORTED-DEGRADED ruling for watch+edit** — confirm this reads as the right product behaviour
   (an editing session goes quiet to the watch relay rather than losing work) rather than DISALLOWED
   (blocking edit mode entirely on a watched document) or a fuller SUPPORTED (attempting to merge external
   changes live, which this plan did not design and considers out of scope for the focused core).

---

*Gate: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` — the ORDER — is the next artifact
and the next gate, generated in a **fresh session**. **No implementation code before `tasks.md` is
approved** (WORKFLOW.md §5.3).*

*No spec amendments ride with this plan. The spec was found correct everywhere this plan checked it,
including §3.2's content-script exclusion and §3.5's pipeline-reuse framing (though D-4 makes concrete what
"reuse" architecturally requires). The two places this plan found the spec's own risk framing more
pessimistic than the actual tree supports — §7-1/§7-2's permission mechanism (§1), and §7-6's "no mockup
exists" assumption (§3 risk 6) — are both named as genuine findings, not corrections to `spec.md`, which
stays sealed per the M7–M11 precedent.*
