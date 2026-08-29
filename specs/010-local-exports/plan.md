# Plan 010 — Local exports: HTML/DOCX/PDF/copy/ZIP export + print mode (M10)

**Status:** draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-08-22
**Spec:** `specs/010-local-exports/spec.md`, approved at gate 1 (`decisions.md` 2026-08-22 M10 GATE 1, landed at
`49feea6`) **with three rulings and a provisional-approval condition**. This plan is the HOW; it resolves the
spec's seven §7 risks against the **actual code**, not against the spec document. No §3.x decision is
re-opened, and nothing on the §6 IS-NOT list is proposed.
**Gate-1 dispositions inherited, not re-argued:** **RULING 1 · §9-1** — DOCX math ships as plain source text
(F2 math is 0%, no renderer exists to produce even the conceded image fallback); revisit-when F2 ships. **★
DEFERRED-WITH-DOCX, 2026-08-24** — DOCX export itself was struck from M10 at the §3.10 gate (`decisions.md`
M10 §3.10), resolving D-1's own fork by scope reduction; Ruling 1 has nothing left to apply to until DOCX
export returns in a future milestone, at which point its own revisit-when (F2 shipping) still governs.
**RULING 2 · §9-2** — the Ctrl/Cmd+S shortcut is **app-page-only**, permanent, no revisit-when. **RULING 3 ·
§9-3** — ZIP/HTML export embeds **only locally-resolvable images**; a remote image stays a remote reference,
unrewritten; revisit-when M11 spec-writing time. **The provisional-approval condition** — gate-1 approval is
conditional on this plan's first task clearing the `.output` headroom before any dependency is treated as
usable — is inherited as a **hard sequencing constraint** on task order (§6 below), not re-argued as a D-value.
These four were settled by the reviewer at the cited entry and are **preserved by silence** below rather than
re-listed as D-values — a plan that re-decides a gate-1 ruling is a scope-reopen even when it agrees.
**Evidence base:** a codebase recon at `49feea6`. Every `file:line` below was re-derived against the tree in
this session; nothing is inherited from the spec or from the kickoff brief. Where a citation could not be
verified against the real tree (chiefly `docx`/the zip-writer's own package facts, since neither is installed),
that is stated as unverified-until-task-1 rather than guessed — the spec's own Evidence base line makes the
same admission for the same reason, and 009 D-13's registry-verification discipline is inherited but cannot be
discharged until a real install exists to inspect.
**Libraries:** **zero additions land with this plan.** Two are anticipated — `docx` and a ZIP writer (the
spec's own working assumption, unconfirmed as to package name) — against **6** shipped today (`diff`,
`dompurify`, `markdown-it`, `markdown-it-task-lists`, `mermaid`, `shiki`, verified `package.json`). Neither is
installed by this document; the ablated-cost measurement that decides whether either fits is `tasks.md`'s
first task (§6), per the provisional condition.
**Spec status:** §3.1–§3.10 are closed. This plan found none of them unbuildable, and proposes **one
correction to a spec-stage supporting claim** (§0.2) — no §3.x decision is amended, and `spec.md` stays sealed.

---

## 0. Decisions SETTLED at this gate (2026-08-22)

*Every decision below gets a `decisions.md` entry, named here, landing with the commit that implements it —
never after, the standing discipline 006 through 009 all state and 008/009's own retro findings show is easy
to let slip (`progress.md` § Carried items, the D-6…D-12 ledger gap) — named here so 010 does not repeat it.*

**D-1 · The `docx` + zip-writer ablated-cost measurement is the FIRST task in `tasks.md`, and every other
task in this plan is sequenced behind its result. DECIDED — the provisional condition made this a gate-1
ruling in substance; this D-value states its mechanism.**
`decisions.md` entry: *"010 D-1 — the export dependencies are measured before they are trusted, because the
current ~367 KiB `.output` headroom is the thinnest this project has carried into any gate-1 close"*

009's own task 4.2 is the precedent, restated because it is the exact shape this task repeats: a naive barrel
import blew the budget to 13.6 MB before measurement caught it and it was reverted. **The current headroom is
materially thinner than 007's or 008's own gate-1 close** — `progress.md`'s 9.3-transcribed baseline puts
`.output` at **4,866,741 / 4,866,857 B** against the ≤5 MiB (AGENTS.md) bound, ~367 KiB / ~7% free, and `pnpm
zip` at **1,470,730 / 1,470,788 B** against <2 MB, ~612 KiB free. Two new dependencies at once, into a budget
this tight, is the single highest-variance move this plan makes — so it is measured first, not scheduled
convenient-first.

**Mechanism:** install both candidates for real (`docx`, and a ZIP writer — package name confirmed at this
same task, not committed here, per spec §3.10), build, and decompose the delta into named components the way
009 D-11 decomposed Shiki's: (a) `docx`'s own weight, (b) the ZIP writer's own weight, (c) any transitive
weight either pulls in unexpectedly (009's own `katex`-via-`mermaid` finding is the standing example of why
this line exists), (d) Peekover's own glue code. Each ablated, never grepped — an identifier grep over a
minified bundle proves nothing about which of these moved (the standing lesson, restated with the same force
007/008/009 each gave it, because this is exactly the class of measurement the provisional condition is
gating on).

**If the ablated cost fits inside headroom:** the install stands, and every later task in this plan proceeds
as drafted. **If it does not:** the provisional condition's own text is explicit — *"the spec revisits (a
subset/lazy-split strategy per §3.10, or scope reduction) before `plan.md`'s remaining tasks"* — which means
this plan's own later tasks are **not authorized to proceed past task 1** until that revisit happens. This
plan does not pre-guess which of the two outcomes occurs; it states both branches so `tasks.md` inherits the
fork rather than discovering it.

*Rejected:* measuring one library at a time, in whichever group happens to need it first — this would let a
DOCX-heavy group 3 install `docx` alone, pass its own group's budget check, and then have group 5's ZIP writer
addition be the one that blows the combined total, discovered two groups later than the provisional condition
intends. The condition names *both libraries together* as the gate; splitting the measurement would satisfy
the letter and miss the point.

**★ FORK OUTCOME, 2026-08-24 (post-plan, recorded here so this D-value's own text does not read as an open
question once the milestone resolved it) — THE ABLATED COST BUSTED.** Task 1.1 measured `docx` alone at
+373,820 B and the combined `docx` + `client-zip` delta at +380,358 B against ~367 KiB `.output` headroom —
BUSTS by 4,550 B (`decisions.md` M10 D-1). The human resolved the fork by **scope reduction**: DOCX export
(group 5) is struck from `tasks.md`; group 2 and every task below it are re-authorized (`decisions.md` M10
§3.10). Neither subset nor lazy-split was adopted — both were priced (the M10 MEASUREMENT NOTE) and named as
real but thinner-margin alternatives, not chosen. This plan's own two-branch framing above (fits / does not
fit) is preserved verbatim as the record of what this plan anticipated; the actual resolution is one level
more specific than either branch stated, which is why it is appended here rather than folded into the branch
text.

**D-2 · Export chrome lives in a NEW, app-page-only module — `src/app/exportControls.ts` — following
`storageControls.ts`'s own precedent. `mount()` is touched at ZERO sites. DECIDED.**
`decisions.md` entry: *"010 D-2 — export controls are app-page chrome, not reader chrome, so they follow
storageControls.ts's wiring rather than mount()'s children[] pattern"*

§3.2 (sealed) confines every export control to the app page. The precedent question is *which* app-page
pattern to follow, and the tree already has two: `mount()`'s `children[]` composition (`buildAgentBadge`,
`buildDiffChrome`, `buildWatchChrome`, `buildRemoteLoadBar`/`buildNetworkIndicator` — `mount.ts:156-211`,
verified this session) for chrome that renders **inside the shared reader shadow root reachable from both
surfaces**, and `storageControls.ts`'s pattern — a standalone module `createStorageView` imported and wired
directly into `appShell.ts` (`appShell.ts:123`, verified) — for chrome that is **app-page-only by
construction**, never candidate for the content-script graph at all.

Export chrome is the second kind, and for the same reason 009 D-5 gives for the code-highlighting harness
seam: `mount()` is a read-only library shared by both surfaces (006 D-15, unchanged), and threading an
app-page-only concern through it would either gate every call with a capability check the content script must
also carry (a runtime branch, the exact shape 008 D-6 rejected for table tools' own enhancer composition) or
require `mount()` to know something about the surface calling it, which it does not today and should not
start doing for this feature. `storageControls.ts`'s shape — its own module, its own overlay, wired once from
`appShell.ts` and never imported by `mount.ts`, `mountReader.ts`, or the content-script graph — is the
existing precedent for exactly this shape of feature, and 010 reuses it rather than inventing a third pattern.

**The overlay shape itself is `storagePanelOverlay`'s, not `diffChrome`'s inline-pill shape** — grounded in
the design mockup (§0.2 below), which renders the export list as a `role="dialog" aria-modal="true"` panel
(`design/mockup.html:862-874`), the same shape `storagePanelOverlay` already ships and 007/008/009 all cite as
*"the only baseline"* for out-of-flow overlay properties (anchored, closes to zero footprint, page under it
does not move). This is a real precedent match, not a coincidence to paper over: an export list and a storage
panel are both "a small modal list of actions triggered from app-page chrome," and reusing the shape means
010 inherits an already-tested a11y contract instead of re-deriving one.

*Rejected:* threading export state through `mount()`'s `children[]` (wrong graph, per above). A second,
independent overlay pattern invented from scratch (the mockup and the shipped `storagePanelOverlay` both
argue for reuse; inventing a third shape when two precedents already agree is the thing AGENTS.md's structure
discipline exists to prevent).

**D-3 · HTML export and Copy-as-HTML serialize the ALREADY-SANITIZED shadow-root DOM by cloning it; NO
markdown source is re-parsed, and NO new sanitizer profile is anticipated. Styling is carried as a bundled
`<style>` block from `readerCss.ts`'s own stylesheet text, not per-node inline styles. DECIDED — resolves
§7-1, the composed-vs-re-sanitized question.**
`decisions.md` entry: *"010 D-3 — the export serializer clones trusted nodes and bundles the existing
stylesheet text; it never re-enters the parse/sanitize path and never inlines per-node computed styles"*

§7-1 poses the choice as "compose trusted nodes" vs. "a new re-sanitization pass." The code answers it: the
committed reader output is already `sanitize(parse(source))`'s result, sitting in the shadow root as real DOM
(`mount.ts:113`, the `mount()` entry point; the commit is `shadow.replaceChildren(...children)` at `:218`).
**Cloning that subtree (`.peekover-reader`'s children, `Node.cloneNode(true)` over the already-sanitized tree)
produces a document with the identical trust properties DOMPurify already gave it** — no string is
re-stringified and re-parsed, so AGENTS.md #3's "every HTML string that touches the DOM goes through
DOMPurify" is satisfied by construction: there is no new HTML string being written to any DOM, only a clone of
nodes DOMPurify already approved, serialized to a string **after** cloning, for the file/clipboard sink.

**"CSS inlined" (the product spec's own words, §1) is read as "the stylesheet is embedded in the export,"
not "every element carries an inline `style` attribute."** Per-node computed-style inlining (`getComputedStyle`
walked over every cloned node) is fragile — it captures cascade values as of the render moment, misses
pseudo-elements and media-query-gated rules, and is real, reviewable work with its own failure modes (007 D-1's
own SVG `<style>`-cleaning pass is the standing example of how much work "make a style string safe and
correct" actually is). Bundling `readerCss.ts`'s own exported stylesheet text into a `<style>` element inside
the exported `<head>` is simpler, exactly reproduces what the reader shows (the same stylesheet, not a lossy
approximation of it), and needs no new sanitizer surface — the stylesheet text is Peekover's own authored CSS,
not untrusted input, so it is embedded as-is, not sanitized. **This must still be measured against the
"standalone" requirement** (a recipient with no extension installed must see the document correctly) — a
task-1-adjacent check, not asserted here, since it depends on whether `readerCss.ts`'s selectors assume the
custom-element shadow-root context they ship in today (`:host(...)` selectors do not resolve outside a shadow
root, and if the shipped stylesheet uses them, the export path needs a **translated** copy, not a direct
string reuse — flagged in §4 as a real risk, not silently assumed away).

~~Local image embedding (Base64) walks the cloned tree's `<img>` elements and reads already-resolved local file
bytes through the same folder-source read path `folderSourceFromHandle`/`FolderSource.read()` already uses
(the 009 D-1 harness's own citation of this mechanism) — no new file-read capability, reusing what `openFolder`
already grants for the currently-open folder.~~

**★ STRUCK, 2026-08-29 (M10 §3.1 gate, `decisions.md`) — THIS CLAIM DOES NOT HOLD AND MUST NOT SURVIVE AS
BANKED-BUT-FALSE.** Task 3.1's own kickoff Step 0 re-read this paragraph against the actual tree
(`walkPolicy.ts`, `chromiumFolderSource.ts`, `firefoxFolderSource.ts`) and found no `folderSourceFromHandle`/
`FolderSource.read()` capability reaches image bytes on either engine — the walk is filtered to markdown
files only, so no `MarkdownFile`/`FoundFile`/`.read()` is ever constructed for a non-markdown file. Firefox
has no recovery path at all; Chromium is theoretically recoverable only via new, unshipped glue. Full
reasoning: `decisions.md`'s 2026-08-29 M10 §3.1 STOP-FLAG entry. **The human resolved the resulting fork by
scope reduction** (`decisions.md`'s 2026-08-29 M10 §3.1 RULING entry): local-image embedding is DROPPED from
M10 (HTML export and ZIP export both), not built via seam extension. D-3's "no new anything" framing —
already flagged as at-risk by plan risk §4-1 for the `:host` question — turns out to be wrong on THIS axis
for a different reason: not "new reviewable code," but "no code, because the capability itself doesn't
exist and extending it is out of scope." Group 2's own local-image resolution (`collectLocalImages`,
task 2.2, pure path math, no I/O) was kept installed at the gate-ruling commit per `decisions.md`'s own
orphan note, then REMOVED at task 3.1's own implementation (the recommended removal, now landed):
`collectLocalImages`, `LocalImageRef`, `resolveRelativePath`, `isAbsoluteUrl`, and the `documentPath`
parameter are gone; `serializeReaderDocument(host)` now returns `{ clone, theme }` only.

*Rejected:* re-parsing the raw markdown source through a second, export-specific pipeline (violates "one
parser, one instance," AGENTS.md's standing rule, restated at every milestone since 006 for exactly this
temptation). Per-node computed-style inlining (real, reviewable extra work for a lossier result than bundling
the stylesheet verbatim).

**D-4 · Copy-as-rich-text and Copy-as-HTML use a `ClipboardItem` carrying BOTH `text/html` and a `text/plain`
fallback, the multi-format pattern the standard clipboard API sanctions; RESOLVED — no permission needed, no
AGENTS.md #4 event. DECIDED — resolves §7-2.**
`decisions.md` entry: *"010 D-4 — export's HTML copy reuses the ClipboardItem shape 007 already shipped for
diagram images; a second MIME type is not a second permission question"*

007 D-6/§3-6 and 008 D-10 already settled the underlying question for this exact API, twice, for two different
MIME types: `navigator.clipboard.write()` with a `ClipboardItem` does **not** require the `clipboardWrite`
permission, because the permission only removes the *transient-activation* requirement and every copy in this
codebase is triggered by an explicit click (activation present by construction) — cited to MDN's *Interact
with the clipboard* in both prior findings, and the harder case (`image/png` via `ClipboardItem`) already ships
at `permissions: []` (`diagramView.ts:312-314`, verified this session: `const clipboard = navigator.clipboard;
… await clipboard.write([new ClipboardItem({ [DIAGRAM_PNG_MIME]: png })])`). A `text/html` payload alongside a
`text/plain` fallback is the same API, the same permission math, a different MIME string — **AGENTS.md's
standing rule to verify against current docs, not memory, is satisfied by re-applying an already-current-session
verification to a materially identical call shape, not by re-fetching the same page a third time**; the task
that implements this should still re-confirm the exact `ClipboardItem` multi-entry construction (`{'text/html':
blob, 'text/plain': blob}` in one object, per the documented pattern) against Shiki/007/008's own citations
before writing code, since this plan states the shape, not the verbatim call.

**Copy-as-plain-text is `navigator.clipboard.writeText()`** — the existing, already-permission-free path 008
D-10 shipped for table CSV/Markdown copy, reused verbatim with the document's raw source as the payload (§4's
own criterion: *"copy the raw source text exactly as authored"* — the retained-source-of-truth pattern 007
D-15/009 D-6 both establish, read directly rather than re-derived from rendered DOM).

*Rejected:* a single-format `writeText` carrying an HTML string (defeats the point — a plain-text clipboard
write cannot carry a second representation, and pasting into Word/Docs would show raw markup instead of
formatted content).

**D-5 · The Ctrl/Cmd+S binding is installed in `entrypoints/app/main.ts`, on the OUTER app-page document —
never inside `mount()`'s shared shadow-root graph, and never as a second instance of `readerMode.ts`'s
document-level pattern. DECIDED — resolves the mechanism half of §7-3; Ruling 2 already settled the scope.**
`decisions.md` entry: *"010 D-5 — the export shortcut binds where the browser's native save dialog actually
fires, which is the app page's own document, not the shared reader graph two other surfaces also load"*

Ruling 2 (banked, not re-argued) fixes the *scope* — app-page-only. This D-value fixes the *mechanism*, and it
is forced by an existing, already-documented failure mode rather than chosen freely: `readerMode.ts:124`'s
existing keydown listener (`'\\'` for the Raw toggle) is **app-page-blind by construction** — it resolves via
`document.querySelector('peekover-root')` (`readerMode.ts:128`, the exact citation 006 D-7 already made and
this plan re-verifies rather than trusts), which finds nothing on `app.html`, whose reader host is a `div`
(`readerPane.ts`'s own host, cited by 008 D-1), not a `<peekover-root>` custom element. **Reusing that pattern
for Ctrl+S would silently fail on the one surface Ruling 2 requires it to work on** — the exact inversion of
the bug class this plan must not introduce.

So the binding is `entrypoints/app/main.ts`'s own `window`/`document` keydown listener — the same file 009 D-1
already extended once (the `__peekoverHarness` query-gated seam), confirming this file is where app-page-only,
whole-document behavior is meant to live. `event.preventDefault()` suppresses the native "Save Page As"
dialog; the handler reads the last-used format (D-6) and invokes the same export entry point the menu's own
click handler calls, so there is one export invocation path, not two.

**Cross-engine `preventDefault` behavior is empirical, not assumed** (§7-3's own text) — verified on both
engines at task time, not claimed here. **Before any export has ever run, there is no last-used format**, and
§8's own routing (the default-format walk-gate item) governs what a first-ever Ctrl+S does.

*Rejected:* extending `readerMode.ts`'s existing listener with a third bare key (wrong file, app-page-blind by
the same mechanism 006 D-7 already found for a different shortcut, and `readerMode.ts` is on **both** graphs —
adding app-page-only behavior to a file the content script also loads is a fence hazard for no reason, when
`main.ts` already exists as the app-page-only home).

**D-6 · The "last-used format" is a FIFTH field on the existing single global `Settings` row —
`lastExportFormat: string | null` — the exact shape `codeTheme` already is. DECIDED. (spec §3.7)**
`decisions.md` entry: *"010 D-6 — the export shortcut's memory is one more field on the settings row 009
already widened for the same reason, not a new settings surface"*

Re-verified this session: `Settings` (`settings.ts:32-36`) is `{ theme, tocOpen, tocWidth, codeTheme }`, one
global row, no per-document keying anywhere — 009 D-9's own argument (*"a fourth field on the one global
settings row, the same shape theme/tocOpen/tocWidth already are"*) transfers to a fifth field with the
identical reasoning, not re-derived from scratch: a last-used export format is a global user preference, not a
per-document property, exactly as a code theme is. `DEFAULT_SETTINGS` (`settings.ts:44-48`) gains
`lastExportFormat: null` — `null` because, per D-5's own text, there genuinely is no default until §8's
walk-gate item picks the first-ever-Ctrl+S format; a non-null default here would silently pre-empt that gate.
`SettingsPort`'s three methods are unchanged in shape (`save` already takes `Partial<Settings>`, per 009 D-9's
own citation of the same property). `docs/trust/PERMISSIONS.md`'s settings-row disclosure gains one more field
name in its existing row, not a new row — the same **required field, compile-time-forced** discipline
`store.ts` uses for `StoredSummary` (cited throughout 006–009) does not directly apply here since `Settings`
itself has no such enumeration trap that `store.ts:185`-style hand-enumeration created for 006 — confirmed at
task time, not assumed, since 010 is the first plan to add a `Settings` field since 009 and the trap's
continued absence should be re-checked rather than inherited as folklore.

**D-7 · Print CSS (F5) lands in `readerCss.ts` as new `@media print` rules, engaged both by the browser's own
print command and by PDF export driving the same pipeline (§3.6, sealed) — never a second stylesheet. `@page`
margin-box fidelity for page numbers/headers/footers is an EMPIRICAL PROBE, sequenced before PDF export's own
implementation task, not assumed to work. DECIDED — resolves the mechanism half of §7-4; the fidelity finding
itself is not decided here.**
`decisions.md` entry: *"010 D-7 — print mode is one more `@media print` block in the file that already owns
every other theme's rules, and PDF export is print mode driven through `window.print()`, not a second engine"*

§3.6 (sealed) already decided PDF export is `window.print()` against tuned print CSS, at zero new dependencies
if fidelity holds. This D-value places the mechanism: `readerCss.ts` is confirmed, this session, to carry
**no** `@media print` or `@page` rule today (`grep -n "@media print|@page" src/theme/readerCss.ts` — no
matches) — F5 is genuinely greenfield in this file, not an extension of something partial. New rules land
beside the existing three theme blocks, following the same "one file owns reader presentation" discipline
006–009 all cite (*"the fifth such site"* language 009 D-10 already uses for print-adjacent styling
discipline) — CSS rationale in the TypeScript doc comment above the block, never inside the template literal
(M6 retro finding 9, restated every milestone since, and this would be the file's own fifth documented
instance of the rule being followed).

**The design mockup already carries a print block** (`design/mockup.html:430-435`, verified this session):
hides toolbar/side/toc/status/progress/hintpill/figtools/hint/edbar chrome, sets the document to full width and
12pt body text under `@media print`. This is real design language to carry (§0.2 below) — but it is the
mockup's own demo-page rules, not `readerCss.ts`'s, and it shows **no** `@page` margin-box content at all, so
it answers "what chrome hides" and says nothing about "what page numbers/headers/footers look like," which is
the actual open question §7-4 names and §8 (gate 3) routes to a walk.

**Sequencing, stated because it is load-bearing for group order (§6):** the `@page` margin-box fidelity probe
— whether Chromium's and Firefox's print pipelines render `@top-center`/`@bottom-right`-style rules at
production quality — runs **before** PDF export's own task, because §3.3 makes PDF export depend on print
mode as a genuine prerequisite, not a soft one (the spec's own words, quoted). If fidelity is inadequate, the
fallback (a PDF-generation library) is priced against §3.4's already-thin headroom **before** it is adopted,
per §3.6's own rejection of defaulting to a library — which means the fallback decision, if it triggers, is
itself gated behind D-1's own measurement discipline, not a parallel, unpriced escape hatch.

*Rejected:* a print-specific stylesheet module separate from `readerCss.ts` (splits reader presentation across
two files for no reason `readerCss.ts`'s existing three-theme-block structure doesn't already accommodate).
Assuming `@page` margin-box fidelity is adequate and building PDF export against that assumption (§3.6/§7-4
both require this be verified, not assumed, and the mockup's own print block gives no evidence either way).

**D-8 · §7-5 IS RESOLVED, NOT CARRIED AS AN OPEN INVESTIGATION: `mediaPolicy.ts`'s user-triggered remote-fetch
mechanism EXISTS, is WIRED to shipped UI on both surfaces today, and 010 does NOT reuse it — Ruling 3 already
settled that export embeds only locally-resolvable images. DECIDED.**
`decisions.md` entry: *"010 D-8 — the opt-in remote-image restore mechanism is real and live, which closes
§7-5's investigation; Ruling 3 is what keeps 010 from calling it, not any gap in the mechanism itself"*

§7-5 asked whether `mediaPolicy.ts`'s remote-fetch mechanism is *"reachable from any shipped UI today, or is
plumbing with no control wired to it"* — the M5 "built and tested and wired to nothing" defect class, named
three times in that milestone's own history. **Verified this session, and it is the good case, not the bad
one:** `restoreBlockedImages` (`mediaPolicy.ts:166`) is called from `remoteMediaUi.ts:77`, and
`remoteMediaUi.ts`'s own affordances (`buildRemoteLoadBar`, `buildNetworkIndicator`) are imported directly into
`mount.ts:25` and pushed into `children[]` at `mount.ts:200` — i.e. **on the shared reader graph both surfaces
load, not gated to one.** A user who has a blocked-remote-image document open, on either surface, already has
a real, tested, shipped control that opts into fetching those images (the "one click… restores the stored
URLs" behavior `mediaPolicy.ts`'s own header documents at `:35`).

**This closes the investigation; it does not change what 010 builds.** Ruling 3 (banked, not re-argued) already
decided ZIP/HTML export embeds only locally-resolvable images and leaves a remote reference as a remote link,
unrewritten — a decision made *knowing* §7-5 might find a live mechanism, and the ruling's own revisit-when
(*"M11 spec-writing time"*) is unaffected by finding one, because the ruling's reasoning was about
concentrating outbound-network security-review weight at M11, not about whether a fetch mechanism happens to
exist elsewhere in the tree. So: **`mediaPolicy.ts` and `remoteMediaUi.ts` are on this plan's Explicitly-NOT-
touched list (§2)**, named with the reason rather than left off silently — a future reader must not assume
010 missed a reuse opportunity; it declined one on purpose, per an already-banked ruling.

**D-9 · The sibling-checklist audit is discharged below (§3.11), using `storagePanelOverlay` as the primary
sibling (D-2's own shape match) rather than `diffChrome`/`watchControl`'s inline-pill shape. DECIDED. (§7-6)**
`decisions.md` entry: *"010 D-9 — export chrome's audit baseline is the overlay suite, because D-2 gave it the
overlay's shape, not the pill-band shape every prior milestone's chrome used"*

Discharged in full at §3.11 — the mechanical item every milestone since M6 has required be produced before the
first browser test for new chrome, restated with the same force (*"the single most valuable mechanical item M6
produced,"* `spec-coverage.md`'s own words, cited in every plan since).

**D-10 · Design translation: a mockup for export chrome DOES exist and covers five of the nine local
controls plus a print block — CORRECTING §7-7's premise that none was known to exist. Token verification and
the two uncovered controls' baselines are routed to task level. DECIDED. (§7-7)**
`decisions.md` entry: *"010 D-10 — the export panel and the print @media block both predate this spec in the
mockup, which corrects §7-7's own 'no mockup known to exist' framing the same way 009 corrected an identical
claim about code blocks"*

**§7-7 states no mockup is known to exist for export chrome, "the same gap 009 §7-9 named for code blocks."**
Verified this session, and the parallel is exact — 009's own §0.2-2 found the opposite of its inherited claim,
and so does this plan: `design/mockup.html:861-874` has a full `#exportsOverlay` panel — `role="dialog"
aria-modal="true"`, header *"⇩ Export & publish — all client-side,"* a list of icon-glyph rows for HTML, Word/
DOCX, PDF, ZIP bundle, and Copy as rich text, each with a short subtext (*"CSS inlined, images embedded,"*
*"native equations, diagrams as images,"* *"typeset print pipeline,"* *"markdown + local copies of remote
images,"* *"paste straight into Google Docs or Word"*) — plus the print block already cited in D-7.

**What it does NOT cover is load-bearing, the same 008 D-12/009 §0.2-2 finding-4 shape:**

- **No Copy-as-HTML or Copy-as-plain-text row** — only Copy-as-rich-text is shown. Two of the three copy
  controls §4 requires have **no mockup baseline**, the *"if no sibling suite exists, THAT IS THE SIGNAL"*
  case (008 D-12, restated by 009 §0.2-2 for its own uncovered controls) — they get an explicitly enumerated
  property set at task time, not a transcribed one.
- **No progress-indicator affordance, no export-shortcut visual, no last-used-format UI** shown anywhere in
  the mockup — three of §3.1's ten items have no design precedent at all.
- **The mockup's own list MIXES IN the two out-of-scope publish rows** (Gist, Medium/Dev.to, `:871-872`) —
  carrying the panel's *shape* is correct; carrying its *content* verbatim would ship two rows §3.1/§6 both
  explicitly exclude from M10. The task that builds this panel must drop those two rows, not copy the list.

**Token verification against `readerCss.ts`'s three theme blocks is NOT run in this plan** — no export-chrome
CSS exists yet to check tokens against (§7's own text: this is a `plan.md`-stage confirmation of mockup
*existence*, not a token audit, which every prior milestone runs once real styling is being written). Routed
to whichever task first writes `exportControls.ts`'s or `readerCss.ts`'s print-mode styling, per the standing
discipline (006 §1.7, 007 §1.4, 008 D-12, 009 §1.4, unbroken since 006).

### 0.1 Decisions this plan needs that the SPEC DOES NOT COVER — flagged, not guessed

Routed to gate 2 as §8 below. One is the ZIP-writer package identity (spec §3.10 explicitly declines to lock
it); the rest are the gate-3 measure-then-choose items spec §8 already named.

### 0.2 One spec-stage supporting claim, RE-DERIVED against the tree, and it did not hold

Recorded per the standing discipline (006 §0.1/revision-1 through 009 §0.2) rather than silently patched —
none of the below reopens a §3.x decision.

| # | spec claims | re-derived at `49feea6` |
|---|---|---|
| 1 | (§7-7) *"No mockup for export chrome is known to exist yet at this draft's evidence base (the same gap 009 §7-9 named for code blocks)"* | **FALSE — `design/mockup.html` HAS an export panel** (`:861-874`) covering five of the nine local controls, plus the print `@media` block (`:430-435`) already cited by D-7. This is the exact 009 §0.2-2 shape (that spec also claimed no mockup existed for code blocks, and one did) recurring for a second consecutive milestone — worth naming as a pattern, not just a one-off correction: **the "no mockup known to exist" claim has now been wrong twice in a row**, and a future spec draft should grep `design/mockup.html` before asserting its absence rather than stating it from the kickoff's own framing. |

---

## 1. Architecture & data flow

### 1.1 The shared serializer (D-3)

```
serializeReaderDocument(host):                     # pure-ish: reads the shadow root, returns a structure
    column = host.shadowRoot.querySelector('.peekover-reader')
    clone  = column.cloneNode(true)                 # already-sanitized nodes, never re-parsed
    images = collectLocalImages(clone)               # walk <img>, resolve through the open folder's read()
    return { clone, images }                         # HTML export / Copy-as-HTML both consume this

exportHtml(host):
    { clone } = serializeReaderDocument(host)   # ★ the `images` field is still computed by 2.2's own code
                                                 #   but is NOT consumed here — see below
    # for img in images: inline as Base64 (data: URI), rewrite src   ★ STRUCK, §3.1 gate — DROPPED, not built
    doc = wrapInStandaloneDocument(clone, READER_STYLESHEET_TEXT)   # D-3's bundled <style>, not inline styles
    downloadAs(doc.outerHTML, `${basename}.html`)

copyAsHtml(host):
    { clone } = serializeReaderDocument(host)   # same call
    doc = wrapInStandaloneDocument(clone, READER_STYLESHEET_TEXT)
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([doc.outerHTML], {type:'text/html'}),
      'text/plain': new Blob([plainTextOf(clone)], {type:'text/plain'}),   # D-4's fallback
    })])
```

**★ STRUCK IN FULL, 2026-08-29 (M10 §3.1(cont.) gate, `decisions.md`) — supersedes the prior partial
"STRUCK/AMENDED" note below, kept unstruck as the record of what that interim reduction said.** ~~`zipExport`
reuses `collectLocalImages`'s resolution half only (§3.3, spec-decided) — it ships the raw markdown source
plus the resolved local image files, paths rewritten to the archive's layout, never the rendered/sanitized
HTML at all.~~ ~~`zipExport` ships the raw markdown source only, byte-identical, never the rendered/sanitized
HTML at all — local-image file-copying is DROPPED by the same ruling as HTML export's Base64 embedding above;
`collectLocalImages`'s resolution is not consumed here either.~~ **ZIP export is DROPPED FROM M10 IN FULL —
`zipExport` is not built. See `decisions.md`'s 2026-08-29 M10 §3.1(cont.) entry: shorn of images, ZIP export
was near-redundant with Copy-as-plain-text's already-shipped raw-source payload, and not worth its own
control.**

### 1.2 Where each control lives (D-2)

```
appShell.ts:                          # the existing storageControls.ts wiring shape, reused verbatim
    createStorageView(...)             # existing
    createExportView(...)              # NEW — the exportsOverlay panel, wired the same way

entrypoints/app/main.ts:               # D-5
    window.addEventListener('keydown', e => {
      if (isExportShortcut(e)) { e.preventDefault(); runExport(lastUsedFormat()); }
    })
```

`mount.ts` gains no line. The export panel, the shortcut, and the progress affordance are all app-page DOM
outside the reader's shadow root — never candidates for the content-script graph, by construction (D-2).

### 1.3 Print mode and PDF (D-7, §3.6)

```
readerCss.ts:
    @media print { /* hide non-document chrome; page-break rules; @page margin boxes if D-7's probe holds */ }

exportControls.ts:
    exportPdf(host): window.print()      # the SAME pipeline the browser's own print command drives
```

No second rendering path for PDF — the mechanism is decided (§3.6, sealed); the fidelity of the `@page`
margin-box content is the open probe (§7-4, D-7), sequenced before this task closes (§6).

## 2. Files to create / touch / NOT touch

**Create** — `src/export/htmlExport.ts` (D-3: `serializeReaderDocument`, `wrapInStandaloneDocument` ·
~~the Base64-embedding walk~~ **STRUCK 2026-08-29 — local-image embedding dropped, M10 §3.1 gate,
`decisions.md`, mirroring the DOCX strike immediately below**) · ~~`src/export/docxExport.ts` (Ruling 1's plain-source-text math handling, diagram
embed reusing `diagramView.ts`'s existing `canvas.toBlob` capture, `:298`)~~ **STRUCK 2026-08-24 — DOCX
export dropped from M10 by human ruling at the §3.10 gate (`decisions.md` M10 §3.10), resolving D-1's own
BUSTS fork by scope reduction; kept struck rather than deleted so this Files-to-create list stays legible as
the record of what gate 2 approved** · ~~`src/export/zipExport.ts` (D-3's
image-resolution half, reused; no CSS inlining)~~ **STRUCK 2026-08-29 — ZIP export dropped from M10 in full
by human ruling at the §3.1(cont.) gate (`decisions.md` M10 §3.1(cont.)), a downstream consequence of the
local-image ruling immediately above; kept struck rather than deleted for the same legibility reason** ·
`src/app/exportControls.ts` (D-2: the overlay/panel, D-5's
shortcut wiring entry point, the progress affordance, D-6's settings read/write) · test files per §5.

**Touch** — `src/settings/settings.ts` (D-6: `lastExportFormat` field, `DEFAULT_SETTINGS`) ·
`src/theme/readerCss.ts` (D-7: new `@media print`/`@page` rules; NOT the existing three theme blocks) ·
`src/app/appShell.ts` (D-2's wiring, the `storageControls.ts` shape) · `entrypoints/app/main.ts` (D-5's
keydown listener, additive beside 009's existing `__peekoverHarness` block) · `docs/trust/PERMISSIONS.md`
(D-6's settings-row field addition; **no new capability row otherwise**, since D-8/Ruling 3 means no new
network path exists to disclose) · `package.json` (`docx` + the chosen ZIP writer, landing at task 1, per
D-1's hard sequencing — not landed by this document).

**Explicitly NOT touched** — `src/render/mount.ts` (D-2: zero sites, the same checkable property 007/009 both
state for themselves) · `src/render/mountReader.ts` / `runReader.ts` / `src/watch/contentWatch.ts` (the
content-script graph, §3.2 sealed) · `src/render/mediaPolicy.ts` / `remoteMediaUi.ts` (D-8: the mechanism is
real and live; 010 declines to call it, per Ruling 3 — named so the omission reads as deliberate, not missed)
· `src/render/sanitize.ts` (D-3: no new profile anticipated — cloning already-sanitized nodes needs no new
allow-list; **if task-level work finds this insufficient, that is a group-1/group-2 finding routed back, not
a silent addition**) · `src/render/diagramEngine.ts` / `codeEngine.ts` (no interaction scoped, mirroring 009's
own "must never import them" line for its own unrelated engine) · `wxt.config.ts` (no `web_accessible_resources`
or `content_security_policy` change anticipated; **a genuine open risk if either export library needs one**, §4)
· `tests/manifest.test.ts` (**654 / 770 B, unmodified since 8.6's close** per the 9.3-transcribed baseline) ·
`tests/golden/output/*` (every export/copy action runs off the already-rendered, already-committed DOM — never
inside the `sanitize(parse(source))` path the suite snapshots, §5's own NFR).

## 3. Risk resolutions (spec §7 → concrete)

1. **HTML export's sanitization path** → **D-3**: clone already-sanitized nodes, serialize after cloning,
   bundle the stylesheet text rather than inline per-node styles. No new sanitizer profile anticipated; the
   shadow-DOM-selector translation question (`:host(...)` rules not resolving outside a shadow root) is named
   as a real risk (§4), not silently assumed solved.
2. **The clipboard mechanism for copy-as-rich-text** → **D-4**: a `ClipboardItem` carrying `text/html` +
   `text/plain`, the same permission-free shape 007/008 already verified for a different MIME pair, re-applied
   rather than re-derived from nothing. The exact call construction is confirmed at task time.
3. **Ctrl+S cross-engine `preventDefault`** → **D-5** decides *where* the listener lives (`main.ts`, never
   `readerMode.ts`'s app-page-blind pattern); *whether* it suppresses the native dialog on both engines is
   empirical, verified at task time, not claimed here.
4. **Print-CSS fidelity for page numbers/headers/footers** → **D-7**: the mechanism (one more `@media print`
   block in `readerCss.ts`, PDF export riding `window.print()`) is decided; the `@page` margin-box fidelity
   probe is sequenced **before** PDF export's own task, and the library fallback — if triggered — is priced
   against §3.4's headroom through D-1's own measurement discipline, not adopted reflexively.
5. **`mediaPolicy.ts`'s reachability** → **D-8: RESOLVED, not carried.** The mechanism exists, is wired to
   shipped UI on both surfaces (`remoteMediaUi.ts:77` ← `mount.ts:25,200`), and 010 does not call it — Ruling
   3 already decided that, independent of whether a live mechanism existed to reuse.
6. **The sibling-checklist audit** → **D-9**, discharged in §3.11 below, using `storagePanelOverlay` as the
   primary sibling per D-2's own shape match.
7. **Design translation** → **D-10**: the mockup exists and covers five of nine controls plus print — a
   correction to §7-7's premise, not a confirmation of it. Two copy controls and the progress/shortcut UI have
   no baseline and get enumerated property sets at task time. Token verification is routed to whichever task
   first writes the real CSS.

### 3.11 THE SIBLING-CHECKLIST AUDIT (§7-6 · retro finding 4) — the plan's deliverable

*Enumerated at `49feea6`, primary sibling `storagePanelOverlay` (D-2's shape match — a `role="dialog"
aria-modal="true"` panel, not an inline pill), secondary siblings `diffChrome`/`watchControl`/`tableEnhancer`/
`diagramEnhancer`/`codeEnhancer` for properties `storagePanelOverlay` does not itself carry. `Y` = inherited,
same shape tested · `D` = a distinct assertion required · `—` = explicitly out of scope, with the reason.
**`tasks.md` consumes this table; no export-chrome browser test is written before it is read.***

| # | property | sibling source | 010 |
|---|---|---|---|
| 1 | renders on BOTH surfaces via the one `mount()` seam | `themeControl:115,122`; `watchControl:190` | **—** §3.2 (sealed): app-page only, and export chrome does not go through `mount()` at all (D-2) — there is no "the wrong surface" case to prove absent the way 007/009 did, because there is no shared graph carrying it toward the content script in the first place. Named so this row is not mistaken for an oversight. |
| 2 | grows NO chrome where the capability is absent | `watchControl:198`; `diffChrome:242` | **—** does not apply: export chrome is `appShell.ts`-wired, app-page-only unconditionally, not gated on a per-document capability the way a diagram/table/badge is |
| 3 | out of flow; the page under it does not move | `storagePanelOverlay:121,135,145` | **Y** the export panel — same overlay mechanism |
| 4 | anchored where it claims to be | `storagePanelOverlay:154` | **Y** the panel opens from its own trigger, not floating |
| 5 | closing returns the slot to zero footprint | `storagePanelOverlay:169` | **Y** the panel |
| 6 | a real `<button>`, keyboard-operable, no `tabindex` of its own | `watchControl:339`; `themeControl:260` | **D** every export/copy row, the progress control if it carries any interactive element (a cancel affordance, if one ships — not asserted by spec §3.8, checked at task time) |
| 7 | accessible name carrying selection AND action | `themeControl:250` | **D** *"Export as HTML"* / *"Copy as rich text"*, not bare icon glyphs (the mockup's own glyph-only rows, `:866-870`, need real accessible names — the mockup is a visual reference, not an a11y reference, the standing caveat every milestone's design-translation section states) |
| 8 | decorative parts hidden from AT | `watchControl:348` | **D** the mockup's icon glyphs (◧ ▤ ⎙ ▣ ✂) if kept as decoration alongside a real accessible name |
| 9 | polite live region, out of the a11y tree while empty | `diffChrome:651` | **D** export completion/failure state (§4: *"shall indicate completion… shall indicate the failure distinctly from success"*) and the progress indicator's own state, per §5's a11y NFR (*"announced to assistive technology, not conveyed by animation alone"*) |
| 10 | reduced motion: no animation under reduce, DOES animate without it (non-vacuous) | `watchControl:358,694,709`; `diagramView`'s `.ok`-on-success transition (007/009 precedent) | **D** if the progress indicator or a copy-confirmation state animates, the standing `prefers-reduced-motion` invariant applies, both halves |
| 11 | focus trap and restore | `diagramLightbox:244-373` (007's baseline, cited again by 009 as unused-but-available) | **D** — the export panel is a `role="dialog" aria-modal="true"` overlay per the mockup (D-2), and §5 requires every control keyboard-reachable; a modal panel needs the trap/restore contract 007 already established a baseline for, reused rather than re-derived from nothing |
| 12 | zero-network with a control that FIRES | `remoteMedia:120,140` | **D** the same `/^https?:/i` predicate and `awaitFetchedUrls` shape, across every export/copy path — **with the control fetch case being D-8's own live mechanism**, since it is the one already-wired remote-fetch path in this codebase and is the natural positive control to borrow rather than construct fresh, provided invoking it does not require reusing 010's own code (it must not — the control proves the export/copy paths are silent, using a mechanism export never calls) |
| 13 | `describe.each` over both surfaces | `watchControl:189` | **—** collapses to one surface by §3.2 (sealed); no second-surface case to assert, unlike 007/008/009's own row 1/23 pattern, because export chrome never reaches the second surface's graph at all (row 1's own note) |
| **14** | **the progress indicator, the export shortcut's own confirmation, and two of the three copy controls (HTML, plain text) have NO sibling suite and NO mockup baseline** | **NONE** | **★ D — finding 4's shape, a fourth consecutive milestone.** No existing control shows work-in-progress the way §3.8 requires, confirms a keyboard shortcut's action the way §4 requires, or has ever copied HTML/plain-text specifically (only CSV/Markdown via 008, and a different clipboard mechanism at that). Per finding 4: *"If no sibling suite exists, THAT IS THE SIGNAL."* 010 establishes these baselines; rows 6, 7, 9, 10 are where they land. |

## 4. Risks & unknowns this plan still carries

1. **★ `readerCss.ts`'s selectors may assume a shadow-root (`:host(...)`) context that does not resolve in a
   standalone exported HTML document.** D-3 bundles the stylesheet text verbatim; if the shipped rules are
   `:host`-scoped, the export needs a **translated** copy (a plain top-level selector set), not a direct string
   reuse. This is a real, unresolved risk this plan does not close — the task that implements `htmlExport.ts`
   must check `readerCss.ts`'s actual selector shape before assuming reuse works, and if translation is
   needed, that is new, reviewable code (a second, derived stylesheet), which changes D-3's "no new anything"
   framing and must be flagged back rather than built silently.
2. **§3.4's headroom is thinner than any prior gate-1 close, and D-1's measurement is the whole plan's load-
   bearing first move.** If the ablated cost blows the headroom, every task after D-1 in this plan is
   provisional on a spec revisit this document cannot pre-empt (D-1's own text). This is stated as a risk
   because it is one: this plan is written as if the fit succeeds, because the alternative (subset/lazy-split
   strategy, or scope reduction) cannot be designed without knowing which library, if either, is the problem.
3. **The ZIP writer's package identity is unconfirmed.** `spec-coverage.md`'s `jszip` mention is a working
   assumption, not a decision (§3.10, sealed) — task 1 verifies the current landscape (size, maintenance,
   licence) before committing, the same discipline every dependency choice in this project gets, and this
   plan does not pre-select it.
4. **PDF export's fidelity fallback, if triggered, is a THIRD dependency this milestone did not budget two
   for.** §3.4/§5 anticipate up to two additions; a PDF-generation library, if D-7's probe fails, is a third,
   priced explicitly at the point of pricing (spec's own words) — not folded into D-1's measurement, which
   covers only the two anticipated libraries.
5. **`web_accessible_resources` is a hard-stop key if either export library needs to reach the content-script
   graph to lazy-load** — it does not, by design (§3.2), but if `docx` or the ZIP writer's own bundler output
   shape forces a chunk only reachable that way, that is the `content_security_policy`/`web_accessible_
   resources` contradiction §5's own NFR names as a hard stop, not a negotiable one.
6. **Cross-milestone carry — the M9 9.1 toolbar/block-spacing finding does NOT reopen from this milestone's
   own print-CSS work, and the reasoning is stated rather than assumed.** `decisions.md` 2026-08-22 M9 9.1
   records a shipped, non-blocking spacing preference on `.peekover-code-toolbar`. F5 print mode must **hide**
   that toolbar under `@media print` (chrome not part of document content, §4's own print criterion) — a
   `display:none` rule keyed off the same selector, which touches the selector's **name** but not its shipped
   spacing **property**. So the revisit trigger 9.1 named (a future session editing that rule for another
   reason) is not fired by this plan's own print work; if a later 010 task finds itself editing the toolbar's
   spacing rule for an unrelated reason, that is the trigger, named here so it is not missed.
7. **Cross-milestone carry, named for completeness — the fence-selector overlap question (`decisions.md` M9
   4.1) is untouched.** 010 adds no fence handler and touches no fence-detection selector; the carried
   architectural question stays exactly where 009 left it.
8. **Cross-milestone carry, named for completeness — the app-page first-paint standing-baseline gap
   (`decisions.md`/`progress.md` M9 9.2 retro finding 7, Ruling 4) is neither deepened nor resolved by 010.**
   Every export/copy/print action in this milestone runs off explicit user action, never on the render path
   (§5's own NFR states this plainly) — so 010 adds no first-paint-path work of the kind that would make the
   gap more load-bearing, and it adds none of the kind that would close it either. The gap remains exactly two
   numeric readings deep plus one subjective walk confirmation, carried, not touched.
9. **No shared browser-test helper module**, still — `flush()`/`afterFrames()`/`waitFor()` duplicated across
   6+ files since at least 007; §3.11's own checklist is a fourth consecutive milestone's argument for building
   it, and 010 still does not build it.

## 5. Test strategy

- **jsdom unit:** `serializeReaderDocument`'s clone-and-collect (no mutation of the live tree; every collected
  image resolves to the correct local path) · `wrapInStandaloneDocument`'s stylesheet embedding (byte-for-byte
  against `readerCss.ts`'s exported text, or its translated form per risk 1) · the `docx` serializer's
  heading/list/table/emphasis mapping, over a representative fixture set, once the library is installed ·
  `parseLineRanges`-style pure functions for any print-CSS page-content templating · `lastExportFormat`'s
  `Settings`/`DEFAULT_SETTINGS` shape.
- **Real-engine (Chromium + Firefox), red-first and non-vacuous:**
  - **D-3's structural claim:** the exported HTML, opened standalone (no extension), renders visually
    equivalent to the reader — a real, if qualitative, check that the `:host` translation risk (§4-1) either
    did not materialize or was handled.
  - **D-4:** a `ClipboardItem` copy pastes as formatted content into a real rich-text target (or the closest
    real-engine equivalent this suite's existing clipboard tests already drive), on both engines.
  - **D-5, red-first:** Ctrl+S on the app page suppresses the native save dialog and triggers the last-used
    export; the SAME keystroke on a content-script surface does nothing new (the negative half, proving the
    scope is real, not merely undocumented).
  - **D-1's ablation:** content-script bytes md5-identical after both libraries land (neither is a content-
    script concern, per §3.2) — the same structural proof 007/009 both required for their own engines.
  - **§3.11 row 12:** zero network across every export/copy/print action, both engines, with D-8's own live
    mechanism (`remoteMediaUi`'s restore button) as the control that fires, shown live in the same test.
  - Every §3.9 degradation: a library-load failure, a serialization throw, an unreadable local image, a
    failed copy — each states the failure and leaves the rendered document exactly as it was.
  - §3.11 rows 3–11, at the widths the sibling suites use, including at least one WIDE viewport (the standing
    finding-2 discipline, restated because 010 ships new chrome).
- **Pins every task:** `git diff tests/golden/output/` **EMPTY** — every export/copy/print action runs off the
  already-committed DOM, never the `sanitize(parse(source))` path the suite snapshots · `tests/manifest.test.ts`
  green and **654 / 770 B** · `permissions: []` on both built manifests, **no `web_accessible_resources`** ·
  bundle-affecting tasks measure `pnpm build` + `pnpm zip` + `.output` size as a **mandatory** Verify step
  (009's own 4.3 finding, restated because D-1's own headroom makes this the tightest-margin milestone yet).
- **Revert-and-fail (finding 5) is the standard, not an option**, for every regression test 010 produces.
- **Measurement (not CI):** §7 below.
- **Human gate:** whether the export panel reads as discoverable or as clutter (008/009's identical question,
  transplanted a third time) · print/PDF output legibility against a real long document · which default export
  format feels right for a first-ever Ctrl+S (§7 M-1) · the heavy-document progress threshold (§7 M-2) · print
  header/footer content and layout (§7 M-3) · Firefox everything · zero unexpected network with the Network
  tab open · at least one WIDE viewport, recorded like an engine.

## 6. Group order

*Sequencing only. `tasks.md` at gate 3 owns decomposition, in a fresh session.*

**The provisional condition makes this milestone's ordering non-negotiable at its first step**, unlike prior
milestones' "risk-heaviest first by convenience" framing (007's own words for its own group 1): **group 1 is
not optional to reorder**, because gate-1 approval is *itself* conditional on its result. Three further hard
constraints, all from the spec or from gate 1 rather than convenience: **D-7's print-CSS fidelity probe
precedes PDF export's own implementation task** (§3.3's dependency, stated as fact); **D-3's shared serializer
lands before HTML export, Copy-as-HTML, and ZIP export's image-resolution half**, since three controls consume
one module and building it three times would be exactly the kind of duplication 007 D-4/008 D-6 both named and
declined for their own shared-vs-split questions; and **§3.11's audit precedes the first export-chrome browser
test**, discharged above.

**1 · The measurement (D-1). HARD GATE — approval-conditional.** Install `docx` + the chosen ZIP writer for
real; build; decompose the delta to a named residual; verify licence/install-scripts/`pnpm audit --prod` clean
for both. *Touches:* `package.json` only. *Must NOT touch:* any export/render/app module. *Acceptance:* the
delta fits inside headroom, **or** the fork stated in D-1 is taken and this plan's remaining groups are
suspended pending a spec revisit — either outcome is a valid close for this group, and only one authorizes
group 2.

**2 · The shared serializer (D-3).** `serializeReaderDocument`, `wrapInStandaloneDocument`, local-image
resolution. *Touches:* `htmlExport.ts`. *Must NOT touch:* `mount.ts`, `sanitize.ts`. *Acceptance:* the
`:host`-selector risk (§4-1) resolved one way or the other, not left open; a standalone-render check passes.

**3 · HTML export, Copy-as-HTML, Copy-as-plain-text, ~~ZIP export~~ (struck 2026-08-29, M10 §3.1(cont.) —
dropped from M10 in full, downstream of the local-image ruling; see `decisions.md`).** D-3 (consumed), D-4
(HTML/plain-text halves). *Touches:* `htmlExport.ts` (export entry points), ~~`zipExport.ts`~~ (struck),
`exportControls.ts` (the three controls' wiring). *Acceptance:* §4's HTML/copy criteria; §3.11 rows 6, 7 for
these three controls.

**4 · Copy-as-rich-text.** D-4's `ClipboardItem` multi-format construction, verified against current docs at
this task per AGENTS.md's standing rule. *Acceptance:* pastes as formatted content on both engines; the
`file://`-secure-context residual 008 D-10 named for its own clipboard work re-checked for this payload shape.

**5 · DOCX export. ★ STRUCK 2026-08-24 — DOCX export DROPPED FROM M10, human ruling at the §3.10 gate
(`decisions.md` M10 §3.10), resolving D-1's own BUSTS fork by scope reduction, not subset or lazy-split.
Ruling 1 (§9-1) is correspondingly DEFERRED-WITH-DOCX, not resolved.** ~~Ruling 1's plain-source-text math
handling; diagram embed reusing `diagramView.ts:298`'s existing capture. *Touches:* `docxExport.ts`.
*Acceptance:* §4's DOCX criteria; the "never silently drop content without indicating it was omitted" clause
for math, proven against a math-bearing fixture.~~

**6 · Print mode + the `@page` fidelity probe.** F5's chrome-hiding rules; the empirical page-number/header/
footer probe this group's own result feeds into group 7's go/no-go. *Touches:* `readerCss.ts`. *Acceptance:*
§4's print criteria; the probe's result stated plainly (adequate, or the fallback is priced).

**7 · PDF export.** `window.print()` driving group 6's pipeline; the fallback path only if group 6's probe
requires it, priced against D-1's headroom before being adopted. *Acceptance:* §4's PDF criteria.

**8 · Export shortcut, last-used format, progress indicator.** D-5, D-6. *Touches:* `entrypoints/app/main.ts`,
`settings.ts`, `exportControls.ts`'s progress affordance. *Acceptance:* §4's shortcut/progress criteria; D-5's
red-first negative-surface proof.

**9 · Systemic failure and degradation.** The §3.9 failures groups 2–8 could not reach in the course of their
own acceptance criteria. *Acceptance:* §4's Degradation clause in full.

**10 · Measure.** §7's three gate-3 tasks. **Produces numbers; forbidden from choosing values.**

**11 · Human milestone-close gate + retro.** Including the §5 human-gate list, the recorded viewports, and
the byte-ledger statement this milestone's own thin headroom makes worth stating plainly either way.

**§4 EARS coverage:** HTML export → 2, 3 · DOCX export → 5 (struck) · PDF export → 6, 7 · Copy actions → 3, 4
· ~~ZIP export → 3~~ (struck, M10 §3.1(cont.)) · Export shortcut & progress → 8 · Print mode → 6 · Trust → 1
(bytes/manifest), 9 (network) · Degradation → 9. Every remaining clause has at least one group.

## 7. Measurement plan (spec §8 M-1 · M-2 · M-3)

*Every task below is **forbidden from choosing a value**. Protocol for anything timed: **A-B-A against a
same-session baseline, floor reported beside median**, with ablation as the firing control where applicable,
on a quiesced machine — the standing discipline restated with full force because §3.4's headroom makes this
milestone's own numbers unusually load-bearing.*

- **M-1 — the default export format before any format has ever been used (§3.7, §8).** Axes: which format a
  first-time user is likeliest to want · which format has the fewest failure modes to demonstrate on a first
  try. **Nothing quantitative** — a walk-gate product-feel judgement, the same shape 009 §8-4 used for its own
  default-theme pick.
- **M-2 — the "heavy document" threshold that triggers the progress indicator (§3.8, §8).** Axes: document
  size · image count/bytes to embed · measured wall-clock per export type at representative sizes. Outputs:
  export duration across a size distribution drawn from this repository's own documents and the golden
  fixtures, the same corpus discipline 008's table-threshold and 009's collapse-threshold measurements both
  used, bias stated (this repository's own markdown is not a representative sample of arbitrary agent-authored
  documents, the identical caveat 008/009 both carried for their own corpus-sourced measurements).
- **M-3 — print CSS's specific page-number/header/footer content and layout (§3.6/§7-4, §8), once group 6's
  fidelity probe confirms the mechanism can express them at all.** Axes: what the header/footer actually shows
  (document title? page X of Y? both?) · margin sizing. Outputs: a walk against the demo document and a long
  golden fixture, the same shape 007/008's own "design translation" risk used for their own walk-gate items.
- **Byte ledger:** `.output` and `pnpm zip` against the current baselines (**4,866,741 / 4,866,857 B** and
  **1,470,730 / 1,470,788 B**), decomposed to the residual D-1's own measurement produces — restated here as
  the binding record, not a separate measurement.

## 8. Gate-2 questions

1. **The ZIP-writer package choice.** Spec §3.10 names `jszip` only as a working assumption. Task 1 verifies
   the current landscape before committing — **confirm that task 1 is the right place for this choice** (as
   opposed to naming a preferred package now, which this plan declines to do without a fresh registry read it
   has not performed).
2. **§3.11 row 11 — does the export panel need a genuine focus trap, or is a lighter dismiss-on-outside-click
   contract (which `storagePanelOverlay` may already provide without a full trap — unconfirmed by this plan)
   sufficient?** The mockup's `role="dialog" aria-modal="true"` framing argues for the fuller contract; my
   lean is to match it, since 007 already built a reusable baseline (`diagramLightbox`) and reusing a trap
   costs less than deciding case-by-case which modals get one. **Worth a decision rather than a default.**
3. **Risk §4-1 — if `readerCss.ts`'s selectors need translation for the standalone export document, is a
   generated/derived stylesheet acceptable, or should `plan.md` be revised to scope that work explicitly
   rather than let group 2 discover and absorb it?** This plan flagged the risk but declined to pre-design the
   translation, since it does not yet know whether the risk materializes. If it is likely to, per your own
   read of `readerCss.ts`'s selector shapes, naming that now would let group 2 be scoped more precisely.
4. **Confirming the M9 9.1 non-reopen reasoning (risk 6, §4).** This plan argues the print-mode `display:none`
   rule touches the toolbar selector's name but not its shipped spacing property, so the carried spacing
   finding does not reopen. **Confirm that reasoning, or require the spacing be fixed opportunistically while
   the selector is touched anyway** — a smaller ask than a dedicated task, but a real scope addition if taken.

---

*Gate: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` — the ORDER — is the next artifact
and the next gate, generated in a **fresh session** (C14). **No implementation code before `tasks.md` is
approved** (WORKFLOW.md §5.3).*

*No spec amendments ride with this plan. The spec was found correct everywhere this plan checked it —
including §3.2's app-page-only reasoning, §3.3's shared-serialization-path scoping, §3.6's zero-new-dependency
PDF framing, and all three gate-1 rulings' own texts. The one correction in §0.2 is to a supporting claim
(§7-7's mockup-existence premise), not to a §3.x decision, and `spec.md` stays sealed.*
