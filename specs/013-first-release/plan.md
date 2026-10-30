# Plan 013 — A truthful, on-design first release (M13)

**Status:** draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-10-30
**Spec:** `specs/013-first-release/spec.md`, approved at gate 1 (`decisions.md`, "M13 GATE 1 APPROVED"). **§10's
gate-1 notes were read first and govern where they differ from the spec body** — in particular: no content-script
font ceiling; the app page loads the design fonts from the package and the file:// reader adds no font bytes; the
toolbar merge waits on a human-approved static mock; the status line carries only test-backed statements; the
snapshot disclosure is one-time on the page AND permanent in Stored data. This plan is the HOW, re-derived against
the **actual code at HEAD `3bb3b93`**.
**Q15 stays OPEN (human, 2026-10-30, this session).** The kickoff for this plan described Q15 as resolved ("GitHub
Pages; no peekover.dev"); `decisions.md` records it as not confirmed, and the human confirmed today that it is still
open. Per AGENTS.md (a kickoff is a hypothesis; the file body is ground truth) the plan follows the record: every
place that depends on the contact channel or the domain is written to work either way, and the choice is gate-2
question G-1 (§8). The flagged conflict with the 2026-07-11 "peekover.dev owned+verified" entry still stands.
**Preflight:** tree clean; HEAD `3bb3b93`, 2 ahead of `origin/main` (the two unpushed M13 doc commits), 0 behind;
`pnpm audit --prod` **EXIT 0 on 2026-10-30**. **Byte snapshot (M12 close, no production byte since):** `.output`
5,830,859 B (Cr) / 5,830,975 B (Fx) against ≤ 7 MiB (7,340,032 B), headroom 1,509,173 / 1,509,057 B; content script
344,195 B both engines (no ceiling, gate 1); manifests 654 / 770 B, `permissions: []`.
**Evidence base:** read for this plan — `src/render/mount.ts:129–262` (the one chrome seam), `readerMode.ts:101–190`,
`editorEnhancer.ts:60–140`, `watchControl.ts:138–373`, `diffChrome.ts:300–330`, `storageControls.ts:1–72`,
`settings.ts:24–70`, `store.ts:336–342`, `fonts.ts`, `mathFont.ts`, `appShell.ts:365–470,612,695–889`,
`readerCss.ts:41–206,249–470,1314–1340,1460–1572`, `diagramEngine.ts:328–337`, the six app sheets' `var()`
fallbacks, `entrypoints/background.ts`, `tests/manifest.test.ts:28–62`, `htmlExport.test.ts:86–100`, the two
existing contrast helpers, `site/index.html`, README, the three workflows; `decisions.md:8908` (Firefox file://
content scripts work). **External contracts verified 2026-10-30 against official docs** (cited where used): Chrome
`extension.isAllowedFileSchemeAccess`, `runtime.OnInstalledReason`, manifest `icons` and `description`, the CWS
images, listing and privacy pages, the AMO source-submission page, WXT's publishing guide, Edge's publish page, MDN's
`isAllowedFileSchemeAccess` and `onInstalled`. **No production code, test, package or workflow is changed by this
plan.**

---

## 0. Decisions proposed at this gate

*Each lands as a `decisions.md` entry with the task that implements it.*

### D-1 · `design/tokens.css` is the single source; every code copy is pinned to it by ONE unit test. PROPOSED. Resolves §7-3, Q2, Q4.

**The copies, found by scanning `src/` for colour literals (not assumed):**
1. `readerCss.ts:43–65` — the reader's `:host`, `:host([data-theme="dark"])`, `:host([data-theme="sepia"])` blocks.
2. `appShell.ts:370–377` — `LIGHT_TOKENS` / `DARK_TOKENS` (9 tokens each), plus `--r` and `--shadow` at `:450`.
3. `diagramEngine.ts:328–337` — the Mermaid palette (paper/panel/ink/line/muted/hl per theme, plus the
   text-on-highlighter inks).
4. Fallback literals inside `var(--x,#hex)` in six app sheets: `exportControls.ts:138–150`,
   `storageControls.ts:77–88`, `treeView.ts:37–51`, `recentsView.ts:65–81`, `readerPane.ts:89–92`, and the
   remainder of `appShell.ts` (19 literals in all).
5. Intended literals that are NOT tokens: the text-on-highlighter inks `#26210a` / `#191504`
   (`readerCss.ts:133–139,741`, the 2026-07-10 trap guard) and the logo's fixed ink/paper.

**The mechanism — `tests/designTokens.test.ts` (unit project, node):** parses `tokens.css` into per-theme maps;
parses the three reader `:host` blocks out of `READER_CSS`; imports `LIGHT_TOKENS` / `DARK_TOKENS` (exported from
`appShell.ts` — the only production edit this test needs); scans the six sheets' `var(--x,#hex)` fallbacks and
asserts each `#hex` equals `tokens.css`'s LIGHT value for `--x`; maps the Mermaid palette keys to their tokens; and
scans every `src/**/*.ts` (tests excluded) for a hex or `rgba(` literal that is neither a tracked copy nor on a named
allow-list (item 5, each with its reason). Red-first: change one value in any copy → red naming the copy and the
token. *Rejected:* generating the copies from `tokens.css` at build time (a Vite plugin in the build path for a
problem a test catches; can follow later).
**The edits the test forces, both by gate-1 ruling:** the shell's token set grows to the full set
(`--code-bg --hl --ok --ok-soft --warn --del --del-soft`, missing today); `tokens.css`'s dark block gains the
mockup's `--shadow:0 10px 30px rgba(0,0,0,.5)` (Q2), and the reader and shell dark blocks follow. `tokens.css`'s
header comment is corrected to say it is the source of truth (it names `brand.html` today), and `brand.html` gets
one annotation line pointing to it. **The `:host` pin (26 sites, `htmlExport.test.ts:99`) does not move**: a
declaration added inside an existing `:host([data-theme="dark"])` block adds no rule site.

### D-2 · The app page loads Bricolage Grotesque and Sometype Mono as packaged assets — the STIX pattern, not `?inline`. PROPOSED. Resolves §7-4, §7-5; implements the gate-1 default.

- **Module:** a new app-only `src/theme/uiFonts.ts`, the twin of `mathFont.ts`: plain asset imports (Vite emits
  each woff2 as its own file, `mathFont.ts`'s header records why — base64 costs +33%), registered with
  `document.fonts.add(new FontFace(...))` (the reason `fonts.ts` gives: `@font-face` in a shadow tree is unreliable
  on Chromium, and faces on `document.fonts` reach shadow trees on both engines), `display:'swap'`, idempotent,
  failure-swallowing (AGENTS.md #5).
- **Reach:** imported only by `appShell.ts` and the onboarding entry (D-11) — never by `mount.ts`, `fonts.ts`, or
  anything on the content-script graph. An import-fence test in the established shape (`codeImportFence.test.ts`,
  `mathImportFence.test.ts`, `editorImportFence.test.ts`) proves the content script cannot reach it; per AGENTS.md
  that pattern's original ablation is cited, not re-earned.
- **No `web_accessible_resources`:** a same-origin `chrome-extension://` / `moz-extension://` asset loaded by an
  extension page needs none — measured for the STIX subset (`mathFont.ts` header; `mathNetwork.browser.test.ts`
  re-proves it on the real build). The new faces get the same proof.
- **Faces and subsets:** Bricolage Grotesque 400 / 600 / 700 and Sometype Mono 400 / 500, Latin, subset by their
  REQUIRED glyph set (AGENTS.md's font rule): Basic Latin + Latin-1 punctuation, plus every non-ASCII glyph the
  chrome and onboarding copy actually spell (enumerated from the source strings, e.g. · — ✓ ← → ▾ ▸) — not by
  scanning rendered text. Sometype also keeps the box-drawing range code commonly uses. Whether Bricolage ships as
  three static instances or one variable file instanced to wght 400–700 is chosen by bytes in task 2.4.
- **Source and tooling:** the OFL sources from `google/fonts` at a pinned commit, subset with fontTools
  (`pyftsubset` / `fontTools.varLib.instancer`) — the STIX subset's precedent, a dev-time tool, not a
  `package.json` dependency. A provenance note (`assets/fonts/README.md`: source URL, commit, command, unicode
  ranges) is committed with the files; `assets/fonts/OFL.txt` gains both families' copyright lines. Downloading the
  sources is a dev-time network act by the agent (gate-2 G-6).
- **Literata** keeps its existing path (`fonts.ts`, inline, registered from `mount.ts` — already on both surfaces).

### D-3 · The fallback stacks live in `tokens.css` itself, so ONE stylesheet string serves both surfaces. PROPOSED. Implements the gate-1 content-script default.

`--sans` and `--mono` lead with the design face and fall through to close-matching system faces:
- `--sans`: "Bricolage Grotesque", ui-sans-serif, system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system,
  "Helvetica Neue", Roboto, Arial, sans-serif
- `--mono`: "Sometype Mono", ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace

On the app page the first family resolves (D-2 registered it on that document); on the content script nothing
registers it, so the browser falls through to the system face — **zero font bytes and zero per-surface CSS**. The
shell's own `--sans:system-ui,…` override (`appShell.ts:450`) is deleted so the shell inherits the same stack.
Content-script cost: the longer stack strings only (tens of bytes, measured in 2.3). The "close-matching" choice is
verified by eye at the design walk on Windows and, if available, macOS; it is not provable by test beyond "the
computed family is a system face and no request was made".

### D-4 · The font measurement: numbers for the human, forbidden from choosing. PROPOSED. Implements §8-1 under the gate-1 default.

Task 2.4 measures, both engines, A-B-A against a same-session HEAD control, floor beside median, firing control
included: **arm (b), the default** — `.output` and zip deltas of the packaged faces; app-page first paint (gate
165 ms; standing app-page median 90.8–96.3 ms, `progress.md` Baselines); content-script delta (stack strings only).
**Arms (a) and (c), for information only** — the content-script delta if the full faces, or a smallest-useful
subset (Bricolage 600 + Sometype 400), were inlined; and content-script first paint for each against **165 ms with
15.3 ms worst-arm median headroom** (`progress.md:1403`). The task records and recommends nothing. **Human gate
only if it arises:** if arm (a) or (c) shows a first-paint delta inside the noise floor, the numbers go to the
human, who may choose it and set a ceiling; otherwise the default stands with no gate.

### D-5 · ★ The toolbar merge: an app-built toolbar in the light DOM, driving the SAME state the pills drive; the pills are suppressed on the app page by one mount option. PROPOSED. The architecture for Q8.

**What the code says.** All reader chrome is composed at one seam, `mount.ts:171–230`, as siblings of the reading
column inside the shadow root, on both surfaces: mode toggle (`readerMode.ts:154`), theme control
(`themeControl.ts:175`), watch chrome (`watchControl.ts:350` — control, note, capture disclosure), diff chrome
(`diffChrome.ts:308` — Compare pill, picker, status), agent badge (`agentBadge.ts:111`), remote-load bar and
network indicator (`remoteMediaUi.ts:34,60`), TOC rail. The Edit control is added after mount by
`enhanceEditor` (`editorEnhancer.ts:115ff`). `replaceChildren` (`mount.ts:237`) rebuilds all of it on every render.
**Each control already reaches its state through a module-level registry or the host's attributes, not through
its DOM position** — watch via `watchRegistry` + `aria-pressed` (`watchControl.ts:96`), the diff via
`diffRegistry`, mode via `setReaderMode(host, …)` and the host's `data-mode`, theme via the theme runtime's setter.
That is what makes relocation cheap.

**The design:**
1. `MountOptions` gains `pills?: false` (name settled in tasks). When false, `mount()` skips the mode toggle,
   theme control, watch chrome, diff pill/picker/status and agent badge; it still builds the document-bound
   chrome (TOC rail, remote-load bar, network indicator, render-failure banner) and every enhancer's in-document
   tools. The app page passes it; the content script does not, so its graph changes by one conditional.
2. A new app-only `src/app/toolbar.ts` builds the mockup's toolbar in the shell header (light DOM,
   `appShell.ts:705–769` today): the mark (the fixed-ink SVG, blink under `prefers-reduced-motion: no-preference`
   only), the file name in the highlighter, the agent badge, the watch pill (reusing `buildWatchControl(host)` —
   its state is `aria-pressed`, so an app-sheet rule styles it with no host attribute), Compare and its picker, the
   Read / Edit / Raw segmented switch, and the app-level controls (theme — ONE control, code theme, Stored data,
   Export), composed as the approved mock says (§8-2).
3. Sync: the toolbar observes the active reader host's `data-mode`, `data-watch`, `data-diff` with one
   `MutationObserver` (the host is app-owned light DOM) and re-binds when `readerPane` swaps documents. Because the
   toolbar sits outside the shadow root, `replaceChildren` never destroys it — a strict improvement on today's
   rebuild-every-render pills.
4. Keyboard paths are unchanged (`\`, backtick, Ctrl/Cmd+S); the toolbar adds no shortcut.
5. Styling: one app-only `TOOLBAR_CSS` in the shell's document-level sheet. The pill rules in `READER_CSS` stay for
   the content script; the app-only overrides in `CONTAINED_CSS` that positioned those pills
   (`readerCss.ts:1314–1335`) are deleted.

*Rejected:* (i) keep the chrome in the shadow root and lay it out as a bar inside the reader pane — a second row
under the app header, not the mockup's single toolbar; (ii) move the builders' output into the light DOM and copy
their CSS out of the shadow — duplicates every pill rule and keeps the rebuild-per-render churn.
**Gate:** no task in this group starts before the static mock is approved (§6, group 3).

### D-6 · The Edit control lives only in the toolbar; the shadow-root edit control and `EDIT_CONTROL_CSS` are removed. PROPOSED.

Edit is app-only (012 D-10), so its shadow-root pill exists only to be moved. The enter/exit body of
`enhanceEditor` (`editorEnhancer.ts:115–140`: `enterEditMode` with the lazy loader, `exitEditMode` +
`teardownEditorShell`, the "Editor unavailable" retry state) is extracted to an exported `toggleEdit(host, options)`
that the toolbar's "Edit" segment calls; the unsaved-changes guard's capture hook on "Stop editing"
(`appShell.ts:871ff`) re-targets to the segment. `EDIT_CONTROL_CSS` (`readerCss.ts:1561–1572`) and its injection
(`editorEnhancer.ts:99–105`) go. App-chunk bytes fall; the content script is untouched (D-10 of 012 holds:
`editorImportFence.test.ts`).

### D-7 · The 130 px band is reclaimed on the app page only. PROPOSED. Carried item.

The band is the reading column's bottom padding (`readerCss.ts:100`, `padding:56px 32px 130px`), sized for the
bottom-left pill stack, mirrored in the editor's `--edit-bottom:130px` (`:1464`). With the pills gone from the app
page (D-5), `CONTAINED_CSS` sets the column's bottom padding to the top value and `--edit-bottom` to the gap the
status line needs. The content script keeps 130 px because its pills remain. `editorWalkPolish`'s bottom-gap
tolerance (`24 + 130 + 8 = 162`, R29 Decision 2) is re-spelled to the new geometry (D-17).

### D-8 · The snapshot notice: one-time on the page, permanent in Stored data, and still D-12-safe. PROPOSED. Q13.

**A conflict in the code, resolved rather than ignored:** `watchControl.ts:255–260` says the disclosure is
persistent because *"a one-shot or dismissible disclosure would silently void D-12"* (006: after "Wipe all data",
a user who watches again must see it, as a new user would). **Resolution:** the dismissal is stored in the settings
object store, which `wipeAll()` clears (`store.ts:336–342`, *"clears the settings store (both rows)"*) — so a wipe
restores the notice exactly as D-12 requires. It is stored as its own app-only row (key `notices`), not as a field
on `Settings` (`settings.ts:36–42`): `Settings` is on the content-script graph via the settings channel, and the
notice is never shown there (its gate, `watchControl.ts:293`, requires a registered diff context, which only the app
page has). Zero content-script bytes.
**On the page:** with D-5 the disclosure is no longer built in the shadow root on the app page; the toolbar module
renders it once, below the toolbar and never over text, with a "Got it" button that writes the row, and a "Stored
data" link that opens the panel. **Permanent:** the Stored data panel already carries a standing snapshot
disclosure (`storageControls.ts:34–37`, `STORAGE_DISCLOSURE_NOTE`); the task aligns its wording so it states every
clause the page notice states (on this device only, never uploaded, where to turn off capture and erase), and a test
asserts that after dismissal the panel still shows it.

### D-9 · The status line: three statements, each backed by a test; nothing else. PROPOSED. Q9.

An app-page-only line at the window's foot (the mockup's `.status`, `mockup.html:713–719`), `role="status"`,
`--faint`-free (D-16). Proposed statements and the test that backs each:

| Statement | Source | Backing test (red-first) |
|---|---|---|
| The open file's name (or nothing when none is open) | `readerPane`'s current selection | Selecting files A then B shows B; switching to "no file" clears it; out-of-order resolution (the carried `readerPane.select` race) is NOT claimed fixed — the line shows what the pane shows |
| "No network calls" / "Network: N requests you made" | the existing network indicator state (`remoteMediaUi.ts`) OR-ed with a `PerformanceObserver` on `resource` entries whose URL is `http:` / `https:` (G-3) | Both engines, after `wireSettled()`: a document with blocked remote media and no user action reads "No network calls" with zero http(s) entries; the positive control (the user loads the media; plus a SLOW served image) flips it — read after settle, never early (AGENTS.md, Resource Timing records at the END) |
| "Peekover 0.1.0" | `runtime.getManifest().version` | equals `package.json`'s `version` in the built manifest |

**Left off, unprovable in general:** "UTF-8", "GFM + math + mermaid", word counts, "last change" — the mockup's other
entries. The status line replaces nothing: the in-document network indicator stays.

### D-10 · ≤ 1080 px: the folder pane becomes an overlay behind a "Files" control. PROPOSED. Q12, carried item.

`appShell.ts:771–888` lays out `__body` as folders + reader pane. Under a `@media (max-width:1080px)` block in the
shell sheet the folders `nav` becomes a fixed overlay (scrim, focus moved in, Escape and outside-click close, focus
returned to the toggle), hidden by default; the toolbar shows a "Files" button there and nowhere else. The 1080 value
is re-measured on the shipped layout first (the narrowest width at which reader text keeps ≥ 60ch beside the
pane), stated in the task, then fixed. The TOC rail's own rules (R29(c)'s ≤ 1400 px edit rule) are untouched (Q11).

### D-11 · Onboarding: an `onboarding.html` page, opened once on install, detecting file access per engine with no permission. PROPOSED. Q18, §7-6, §7-9.

- **Entry:** `entrypoints/onboarding/index.html` + `main.ts` (WXT's page-entry convention, the app page's sibling).
  Its own document-level sheet with the tokens (pinned by D-1's test), D-2's fonts, the reduced-motion rule, the
  theme cascade before JS (`appShell.ts`'s three-layer pattern, `:382–395,453–462`).
- **Opening:** `background.ts` gains `runtime.onInstalled.addListener(({ reason }) => reason === 'install' &&
  tabs.create({ url: runtime.getURL('/onboarding.html') }))`. Chrome's `OnInstalledReason` is "install" | "update" |
  "chrome_update" | "shared_module_update" (developer.chrome.com/docs/extensions/reference/api/runtime) — only
  "install" opens it. `tabs.create` with the extension's own URL needs no `tabs` permission (the existing
  `action.onClicked` path, `PERMISSIONS.md`). The app page links to it ("Setup guide").
- **Detection, Chromium:** `browser.extension.isAllowedFileSchemeAccess()` — "Retrieves the state of the extension's
  access to the 'file://' scheme", Chrome 99+, no permission listed
  (developer.chrome.com/docs/extensions/reference/api/extension). Re-checked on `focus` and `visibilitychange`, so
  flipping the toggle updates the page without a reload. A throw or missing API → an "Unknown — here is how to
  check" state (never blank).
- **Firefox:** the project record (`decisions.md:8908`, human-observed) is that Firefox `file://` content scripts
  work with no toggle; MDN documents the API but not Firefox's value. The Firefox build therefore does NOT call the
  API (`import.meta.env.FIREFOX`, the existing `backgroundCanReadFileUrls` pattern, `contentWatch.test.ts:75`) and
  says local files open directly. The page also states, for both engines, that the four raw hosts work with no
  setup. **Human-verified at the walk** with a loaded Firefox build.
- **Deep link:** Chromium's steps name `chrome://extensions/?id=<runtime.id>`; whether an extension page may open it
  with `tabs.create` is verified at the task. If yes, a button; if no, a copy-the-address button plus the steps.
  Edge uses the same code path with `edge://extensions` wording only if detection by `navigator.userAgentData` is
  reliable; otherwise the steps say "your browser's extensions page".
- **Sibling checklist (§7-9):** CSP (external module, no inline script), theme before JS, reduced motion, zero
  network (both engines, `wireSettled`), never-blank, constructed DOM only (no `innerHTML`), keyboard order, AA.
- **`PERMISSIONS.md`** records the `onInstalled` listener and the page, as M2 recorded the app page.

### D-12 · Truth: a claims ledger, written once and re-checked at the end. PROPOSED. §3.2, Q15, Q19.

- **The first pass (group 1)** rewrites README.md (16 lines) and `site/index.html` (52 KB) to shipped features,
  with one "Planned" section; removes the four install-shaped CTAs (`site/index.html:280,296,475,544`, each an
  `href="#"` "Add to Chrome"); removes or verifies every number; rewrites `docs/trust/SECURITY.md` to promise only
  what exists (withdrawing "reproducible builds … verified in CI" until group 7 delivers it, signed tags, community
  audit).
- **The claims ledger** (`docs/store/claims.md`): every factual sentence in README, site, SECURITY.md, PRIVACY.md
  and the store text, each with its evidence (a test file, a code path, or "planned"). The final re-check (group 9)
  walks it against the finished build. A sentence without evidence is cut.
- **Q15-dependent text** is written so it works either way until G-1 is ruled: no `peekover.dev` URL and no
  `hello@peekover.dev` address is asserted as working; the README's "Site: https://peekover.dev" line is removed
  pending G-1; SECURITY.md's channel is whatever G-1 rules.
- **The site self-hosts its fonts** (gate-1 Q15(c)): `site/fonts/` gets the same subset woff2 files as D-2 plus
  Literata, `@font-face` in the page, and the two Google Fonts `<link>`s (`site/index.html:8–10`) go. The design
  HTML files in `design/` keep theirs (not shipped, not the site).

### D-13 · CI: three exact edits. PROPOSED. §3.4.

`ci.yml`: `on:` gains `push: branches: [main]`. `package.json` gains `"packageManager": "pnpm@10.33.0"` (the local
pnpm that wrote the current lockfile — re-confirmed at the task) and every `pnpm/action-setup@v4` step in `ci.yml`
and `supply-chain.yml` drops `with: version: 10` (the action reads `packageManager` when no version is given; both
present and different is an error, so they are not both kept). `dependabot.yml`'s header drops the count ("FOUR
runtime dependencies" → "a small set of runtime dependencies, each a governed addition"). Node stays 22 in CI and
is pinned by an `engines` field and `.nvmrc` (G-13).

### D-14 · Release: one tag-triggered workflow owns a release's artefacts; reproducibility is proven before it is claimed. PROPOSED. §3.3, §3.8, §7-7, Q16, Q17.

- **`.github/workflows/release.yml`**, on `push: tags: ['v*']` and `workflow_dispatch` (with a `dry_run` input):
  checkout, pnpm via `packageManager`, Node 22, `pnpm install --frozen-lockfile`, lint + unit, `pnpm zip` and
  `pnpm zip -b firefox` (WXT zips both the extension and its sources for Firefox — wxt.dev/guide/essentials/
  publishing), the SBOM with `SOURCE_DATE_EPOCH` = the tag's commit time, `SHA256SUMS` over the three zips and the
  SBOM, `actions/attest-build-provenance` over the same files (version pinned at the task, verified against its
  current docs), and a **draft** GitHub release with all of them (`softprops/action-gh-release` with `draft: true`).
  `permissions: contents: write, id-token: write, attestations: write` on that job only. A dry run uploads artefacts
  to the run and creates no release.
- **`supply-chain.yml`'s "Attach SBOM to release" step is removed** (Q17); its SBOM job keeps running per change and
  weekly.
- **Reproducibility first (task 7.3, a spike before the claim):** build twice from clean checkouts with the same
  `SOURCE_DATE_EPOCH`; compare the zips' SHA-256. If they differ, find the cause (zip entry mtimes, ordering, chunk
  hashes) and fix it in config. If byte-identical zips cannot be reached within the task, the fallback is comparing
  the sorted per-file SHA-256 list of the extracted trees, and the claim wording becomes "file-identical" (G-8). The
  check then runs in CI as a job that builds twice and fails on a mismatch.
- **AMO sources:** the sources zip carries `SOURCE_CODE_REVIEW.md` (WXT's recommended name) with OS, Node 22,
  pnpm 10.33.0, and the exact commands; AMO's default reviewer environment is Ubuntu 24.04 / Node 24.14.0 / npm
  11.9.0 and *"If your environment differs, you must say so"* (extensionworkshop.com/documentation/publish/
  source-code-submission/). The task extracts the sources zip, rebuilds inside it, and compares to the shipped
  Firefox zip — "There must be no differences".
- **Documents:** `docs/trust/REPRODUCING.md` (rebuild and compare against `SHA256SUMS`), `docs/trust/THREAT-MODEL.md`
  (one page: assets, adversaries, out of scope, where each defence is proven), `docs/trust/PRIVACY.md` (no
  collection, no transmission; what is stored locally and how to wipe it; the only network is user-triggered remote
  media), `CHANGELOG.md` (a 0.1.0 entry assembled from the M1–M12 close records), version 0.1.0 in `package.json`.
- **Signed tags are withdrawn** from SECURITY.md (Q16): a human-only act, not promised.

### D-15 · Icons: PNGs rendered from the committed SVGs by the Playwright already in `devDependencies`. PROPOSED. §7-8.

`assets/icons/icon-{16,32,48,128}.svg` match `design/icons.html`'s size-specific drawings (read: same shapes and
strokes). `scripts/render-icons.ts` loads each SVG in Chromium at its exact pixel size with a transparent background
and writes PNGs to `public/icons/` (WXT copies `public/` into the build). No new tool. Outputs:
- manifest `icons` 16 / 32 / 48 / 128 and `action.default_icon` 16 / 32 — PNG, because "WebP and SVG files are not
  supported" (developer.chrome.com/docs/extensions/reference/manifest/icons);
- the Chrome Web Store icon: the 128 drawing's artwork scaled to 96×96 and centred with 16 px transparent padding
  ("96x96 for square icons, with 16 px of transparent padding per side", developer.chrome.com/docs/webstore/images),
  kept under `docs/store/assets/`, not in the package;
- the Edge logo, 300×300 (Edge: 1:1, minimum 128, recommended 300 — learn.microsoft.com/microsoft-edge/extensions/
  publish/publish-extension).

The PNGs are committed (a renderer's output can vary by version; the committed bytes are what ships). A unit test
asserts each declared icon file exists with the declared pixel size. The dark icon variants in `icons.html` are not
used: the manifest has no per-theme action icon key, and the light mark is drawn to survive dark toolbars
(`icons.html`'s grey/dark lineup).

### D-16 · Contrast: one shared helper, one census, and a rule for the design's greys. PROPOSED.

- `tests/browser/helpers/contrast.ts` replaces the two private copies (`editorEyeballProxy.browser.test.ts:300`,
  `diagramTheme.browser.test.ts:505`).
- **Measured today (WCAG, this session):** light `--faint` on paper **2.60:1**, on panel 2.44; dark `--faint` 3.70 /
  3.46; light `--ok` on paper **3.37**, on panel 3.17; light `--warn` 3.51; `--muted` 6.01 light / 7.44 dark;
  `--del` 4.76 / 6.79.
- **Rule:** information-bearing text uses `--ink` or `--muted`; `--faint` only for decoration, disabled states and
  text duplicated elsewhere; `--ok` / `--warn` colour icons, borders and dots (non-text ≥ 3:1 holds in light), not
  text. **A pre-existing, unruled below-AA pair surfaces here:** the active watch pill's text is `--ok`
  (`readerCss.ts:318`) — 3.17:1 on panel in light. It goes to the human (G-4), not onto the accepted list.
- **The census test** (task 2.2): on every surface in both themes, every text node's computed colour against its
  effective background ≥ 4.5 (≥ 3 for large text), except the M12 accepted list (E-4, E-5, R12, E-9, `invalid`) by
  name. It is written before the restyle, so its first run IS the inventory of today's below-AA pairs.

### D-17 · Test re-spellings are census-first and name the property they keep. PROPOSED. §7-1, Q8's authorization.

Before the first toolbar code (task 4.0), a census runs the browser suite against the mock-approved plan and
classifies every test that touches moved chrome: **unchanged**, **re-spelled** (the selector or the location moved;
the property is the same), **retired** (the property no longer exists — e.g. "the Edit pill does not overlap the
TOC handle" once there is no Edit pill), or **replaced** (a new test owns the property in its new home). Each
re-spelled or retired assertion carries a one-line `KEEPS:` or `RETIRED:` comment naming the property, and the
census table is recorded in the task. Re-spellings are authorized per surface by gate 1 (Q8); a retirement is
listed for the human at the end of the group.

---

## 1. Spec §7 resolved

| §7 risk | Resolution |
|---|---|
| 1 · geometry-pinned tests | D-17's census (task 4.0); the candidate set enumerated in §5.3 below |
| 2 · the `:host` pin | D-1 adds no `:host` site; D-5 deletes app-only overrides from `CONTAINED_CSS` (not `READER_CSS`); any `READER_CSS` restyle edits rules in place. Target: the pin stays 26; any move is named in its task |
| 3 · three token copies | D-1 (five kinds of copy, one test) |
| 4 · font registration | D-2 (app page, packaged), D-3 (one stack), D-4 (measurement) |
| 5 · subsetting | D-2 (required-glyph set, provenance file) |
| 6 · file-access API and Firefox | D-11 (cited contract; Firefox per the project record; deep link verified at the task) |
| 7 · reproducibility | D-14 (spike first, byte-identical or file-identical fallback, AMO rebuild) |
| 8 · rendering icons | D-15 (Playwright, committed PNGs, size test) |
| 9 · onboarding sibling checklist | D-11's list |

## 2. Files to create / touch / NOT touch

**Create:** `src/app/toolbar.ts` (+ test), `src/theme/uiFonts.ts`, `entrypoints/onboarding/{index.html,main.ts}`,
`src/app/onboarding.ts` (+ tests), `tests/designTokens.test.ts`, `tests/browser/helpers/contrast.ts`, the contrast
census and font zero-network browser tests, `assets/fonts/{bricolage-*,sometype-*}.woff2` + `assets/fonts/README.md`,
`public/icons/*.png`, `scripts/render-icons.ts`, `design/toolbar-mock.html`, `.github/workflows/release.yml`,
`CHANGELOG.md`, `docs/trust/{PRIVACY,THREAT-MODEL,REPRODUCING}.md`, `docs/store/{chrome,firefox,edge,claims}.md` +
`docs/store/assets/`, `site/fonts/`, `.nvmrc`.
**Touch:** `design/tokens.css`, `design/brand.html` (one line), `src/theme/readerCss.ts`, `src/app/appShell.ts`,
`src/render/mount.ts` (the one option), `src/render/editorEnhancer.ts`, the six app sheets, `src/app/storageControls.ts`
(wording), `src/render/diagramEngine.ts` (only if D-1 finds drift), `entrypoints/background.ts`, `wxt.config.ts`
(icons, version follows `package.json`), `package.json` (version, `packageManager`, `engines`), the three workflows,
`.github/dependabot.yml`, `tests/manifest.test.ts` (additive: icons declared, no forbidden keys, no new permission —
G-14), `docs/trust/{SECURITY,PERMISSIONS}.md`, `README.md`, `site/index.html`, the browser tests per D-17.
**Must NOT touch:** the sanitizer (`sanitize.ts`), the parser, any enhancer's behaviour, `diffView.ts`'s substance,
`watchController.ts`, the settings channel's message shape, `Settings` (D-8 uses its own row), anything the content
script imports beyond `mount.ts`'s option and `READER_CSS`'s stacks and restyles.

## 3. Per-surface conformance work (spec Appendix A.3, sizes re-checked against the code)

| Surface | Work | Size | Was |
|---|---|---|---|
| Fonts + tokens | D-1, D-2, D-3 | M | M |
| Toolbar icon | D-15 | S | S |
| App toolbar (header) | D-5 composition per the approved mock; one theme control; mark + crumb | L | L |
| Reader chrome on the app page | D-5 relocation, D-6, D-7 | L | L |
| Snapshot notice | D-8 | S | S |
| Status line (new presentation) | D-9 | S | — |
| Folder pane | width 228, caps section heads, row/hover/active per `mockup.html:78–87`, search field, pin/revoke as `.iconbtn` style, D-10 overlay | M | M |
| TOC rail | look only (Q11): row, "here" highlighter gradient (`mockup.html:102–104`), card styling; collapsed state gains a decorative, `aria-hidden` tick column beside the existing toggle — no hover card (G-12) | S | M |
| Code blocks | toolbar restyled to the mockup's copy button (`:151–156`); Line numbers / Wrap / Copy kept (Q14) | S | S |
| Display math | code toolbar removed (carried (g)); Copy LaTeX / MathML styled like the copy button (carried (f)) | S | S |
| Table tools | filter-clear and sort buttons from tokens (carried (f)) | S | S |
| Diff view + picker | restyle; stays inline (006 D-15) | S | S–M |
| Lightbox | scrim and card per `mockup.html:226` / `.panelbox` (radius 14) | S | S |
| Network indicator, remote-load bar, failure banner | restyle; the banner takes `.alert`'s shape | S | S |
| Editor | Save as an ink primary button, bar per `.edbar`, faces via D-3; R11 unchanged | S | S |
| Panels: Stored data, Export, Code theme | `.panelbox` card (radius 14, one shadow), header row, list rows with hints (`.exports li em`) | M | M |
| Unsaved-changes dialog | `.overlay` scrim + card + ink primary (`mockup.html:192–195,408–416`) | S | S |
| Empty / denied / unsupported app states | composed from `.alert` and the setup card — no new vocabulary | M | M |
| Content-script reader | pills restyled in place (Q10 default arm), D-3 stacks, network/remote/banner restyle; 130 px band kept | M | M |
| Onboarding | D-11 | M | M |

**The five carried reader-polish items, placed:** native buttons → table tools, display math (task 5.3); the code
toolbar on math → 5.3; the snapshot notice → D-8 (4.5); the 130 px band → D-7 (4.3); the narrow sidebar → D-10 (4.7).

## 4. Invariants and budgets

- **`permissions: []`, no `web_accessible_resources`, no `host_permissions`** — `tests/manifest.test.ts`, every task;
  icons and the onboarding page add none (they are a manifest key and a bundled page).
- **Zero network:** fonts packaged (app page, onboarding, D-2) or absent (content script, D-3); proven per surface on
  both engines with a firing control, a slow case and `wireSettled()` before the read.
- **7 MiB ceiling:** expected additions — two font families as assets (D-4 measures; tens of KB), PNG icons (a few
  KB), the onboarding entry; expected removals — `EDIT_CONTROL_CSS` and the app-only pill overrides. Each task's
  kickoff states bytes used / ceiling / headroom.
- **The content script:** no ceiling (gate 1). Expected movement: the stack strings (D-3), one `mount()` option
  (D-5), restyle edits. Per-task fence as today (length identical across engines; md5 stable when a task should move
  nothing). A report-only tripwire is proposed (G-7).
- **165 ms first paint:** content script re-measured A-B-A after the stacks and the restyle (headroom 15.3 ms); app
  page after the toolbar and fonts (headroom about 70 ms). The mark's blink and the toolbar's `backdrop-filter` are
  in that measurement.
- **The `:host` pin:** stays 26 (§1 row 2).
- **Reduced motion:** the reader's global rule (`readerCss.ts:89–92`) covers the shadow; the shell sheet and the
  onboarding sheet each get their own global rule (the shell has none today), proven non-vacuously (the un-reduced
  path measured in the same run, the watch-pulse test's pattern).
- **AA:** D-16. New below-AA pairs go to the human; the accepted list is not extended by the agent.
- **CSS discipline:** rationale in doc comments; no colour literal outside D-1's allow-list.

## 5. Test strategy

### 5.1 Proven by test (red-first, revert-and-fail, both engines unless stated)
- Tokens: `designTokens.test.ts` (D-1), plus a browser test reading computed custom properties on every surface in
  both themes.
- Fonts: on the app page and onboarding, `document.fonts.check()` true for each face and the computed
  `font-family` resolves to it on chrome, code and prose; on the content script, the computed face is a system
  face; zero font requests on the content script and zero non-extension requests anywhere.
- Contrast: the census (D-16).
- No native-styled control: every `button` / `select` / `input` on every surface in both themes has an author
  `background-color` and `border-style` (not the UA's `buttonface` / `outset`); scrollbars carry `scrollbar-color`.
- No chrome over text: at 1440 / 1280 / 1080 / 414, each chrome rect is hit-tested against every text line box of
  the reading column (the rule from memory: select by class alone; the hit-test, not a cheap rect check, is the
  assertion seen to fail).
- Toolbar state sync: mode, watch, diff, edit reflect the host after clicks, shortcuts and document switches.
- D-8: dismissal persists; wipe restores; panel disclosure present after dismissal.
- D-9: each statement's test (table above).
- D-11: install opens once, update does not (listener unit test with a stubbed `tabs.create`); detection states
  true / false / throw; Firefox build does not call the API.
- Release: the double build compares equal (CI job); manifest icons exist at declared sizes; the built manifests'
  `version` is 0.1.0.

### 5.2 Proven by the human
The design walk (layout, proportion, rhythm, component shape against the mockup), per surface × theme × engine ×
viewport, from a fresh production build of both engines loaded as a real extension — human-only (AGENTS.md). The
onboarding page with the real toggle on Chromium and a real Firefox install. The release workflow's dry run. The
final truth re-check.

### 5.3 The tests the toolbar merge will touch (candidates for task 4.0's census)
**Measure chrome geometry (likely re-spelled or retired):** `agentBadge`, `diffChrome`, `watchControl`,
`exportPanel`, `themeControl`, `storagePanelOverlay`, `editorEyeballProxy`, `editorWalkPolish`, `editorNestedHost`,
`editorRender`, `watchRemount`, `readerPaneContained`, `tocPersist`, `tablePlacement`, `tableTools`,
`diagramLightbox`, `diagramDegrade`, `diagramActions`, `codeToolbar`, `mathActions`, `tableScope`,
`editorDegrade`, `diagramRender`, `tocNetwork` (all `tests/browser/*.browser.test.ts`).
**Query moved chrome on the app page (likely re-spelled selectors only):** `captureDisclosure`, `codeDegrade`,
`codeThemeControl`, `diagramCache`, `diffRegistry`, `editorNetwork`, `editorPreview`, `editorSave`, `editorUnsaved`,
`editorWatch`, `eraseSnapshots`, `exportShortcut`, `printMode`, `snapshotCapture`, `themeShell`,
`watchContentWiring`, `watchLifecycle`, `watchObserverWiring` (browser); `src/app/appShell.test.ts`,
`src/render/codeEnhancer.test.ts`, `src/render/editorEnhancer.test.ts`, `src/render/mount.test.ts`,
`src/theme/codeThemeControl.test.ts` (unit). 45 files in all; many will be unchanged — the census decides, file by
file.

## 6. Proposed task groups (gate 3 writes `tasks.md`)

**1 · CI + truth, first pass.** 1.1 D-13 (CI, `packageManager`, Dependabot, `.nvmrc`). 1.2 README + SECURITY.md
withdrawals (D-12, Q15-neutral). 1.3 site content pass (features to shipped + "Planned", CTAs out, numbers checked) —
fonts follow in 9.1.
**2 · Foundation.** 2.1 D-1 (token test, shell tokens, dark shadow, header comment). 2.2 D-16 (shared helper, census,
inventory of today's pairs → G-4/G-5 rulings applied). 2.3 D-2/D-3 (font sourcing and subsetting with provenance,
`uiFonts.ts`, fence, stacks, zero-network tests). 2.4 D-4 measurement — **HUMAN GATE only if it arises.** 2.5 D-15
icons (moved up: the walk must see them).
**3 · ★ The toolbar mock — HUMAN GATE.** 3.1 `design/toolbar-mock.html`: a standalone static page that links
`tokens.css` and `@font-face`s the D-2 woff2 files by relative path (zero network; no Google Fonts), drawing the
proposed toolbar in light and dark at 1440, 1080 and 414 px as fixed-width frames, in the states reading, editing,
watching, Compare open, the narrow "Files" overlay open, and the one-time snapshot notice; plus the status line.
Produced from the mockup's own CSS vocabulary. The agent also captures PNGs of each frame (Playwright, scratch, not
committed) for the record. **Review:** the human opens the file in Chrome and Firefox, annotates, and approves in
writing; the approval (with any changes) is banked in `decisions.md` before any group-4 task starts.
**4 · Toolbar implementation.** 4.0 D-17 census. 4.1 the `mount()` option + toolbar skeleton (mark, crumb, Read /
Raw). 4.2 watch, Compare, agent badge into the toolbar. 4.3 D-6 Edit segment + D-7 band. 4.4 app controls (one
theme control, code theme, Stored data, Export) per the mock. 4.5 D-8. 4.6 D-9. 4.7 D-10.
**5 · Surfaces.** 5.1 folder pane. 5.2 TOC look. 5.3 code, math, table buttons. 5.4 panels, dialog, lightbox, diff.
5.5 empty / denied / unsupported states. 5.6 content-script reader (pills, network, banner). 5.7 editor details.
**6 · Onboarding.** 6.1 D-11.
**7 · Release hygiene.** 7.1 version + CHANGELOG. 7.2 PRIVACY / THREAT-MODEL / SECURITY final (channel per G-1). 7.3
reproducibility spike + CI double-build + REPRODUCING.md. 7.4 release workflow + AMO sources README; supply-chain
attach step removed. 7.5 store text for three stores (privacy policy linked in each, Q19).
**8 · ★ The design walk — HUMAN GATE.** Every surface × light/dark × Chromium/Firefox × 1440/1280/1080/414, from a
fresh production build of both engines; includes onboarding on a real install and the release workflow's dry run.
Fix tasks as found.
**9 · ★ Truth re-check — HUMAN GATE, then screenshots.** 9.1 site fonts self-hosted; the claims ledger walked
against the walked build. 9.2 store screenshots, 1280×800, light and dark (G-11). 9.3 close + retro.

## 7. Risks and mitigations

1. **The toolbar touches 45 test files at once.** → D-17 census before code; authorized re-spellings per surface;
   retirements listed for the human; group 4 split into seven tasks so each red has one cause.
2. **The mock is approved and implementation drifts from it.** → the mock is committed in `design/`; the walk
   checks the toolbar against it, not against `mockup.html`.
3. **Zip bytes are not reproducible.** → spike first (7.3); file-identical fallback with honest wording (G-8).
4. **AMO's rebuild differs** (their Node 24 vs our 22). → state the environment in `SOURCE_CODE_REVIEW.md`; rebuild
   inside the sources zip in the task; G-13.
5. **System fallbacks look wrong on some OS** (the content script). → walk on Windows (and macOS if available); the
   stack is one string to adjust; D-4's numbers stand ready if the human prefers bundling.
6. **`chrome://extensions` cannot be opened from the page.** → copy-the-address fallback designed in from the start.
7. **Firefox file:// behaviour has changed since the July record.** → verified with a real install at the walk;
   the page's Firefox copy is one string.
8. **The PerformanceObserver statement misses an in-flight request.** → the indicator state is OR-ed in; tests read
   after `wireSettled()` with a slow case.
9. **Font sourcing pulls a different upstream revision later.** → pinned commit and command in
   `assets/fonts/README.md`; the files are committed.
10. **Q15 stays open through the milestone.** → all text is channel- and domain-neutral until G-1 is ruled; the
    ruling is a two-file edit.
11. **Shared-state flakes in the larger browser suite** (clipboard, Resource Timing). → AGENTS.md's delta-based rule;
    the known clipboard flake stays carried.

## 8. Gate-2 questions

1. **G-1 · Q15: contact channel, domain and site host.** (a) Site on GitHub Pages (`mosuvo.github.io/peekover`, from
   the `origin` remote; Pages needs the repo public, which it will be at release) and GitHub private vulnerability
   reporting as the security channel; peekover.dev removed everywhere, and the 2026-07-11 record corrected; (b) keep
   peekover.dev as the intended home, buy it before going live, mail on it; (c) (a) now, (b) later. **Recommendation:
   (c)** — M13's text is domain-neutral either way, so (a)'s artefacts cost nothing to switch later; the record
   correction happens as soon as you say which part of 2026-07-11 was wrong.
2. **G-2 · The toolbar seam (D-5).** (a) app-built toolbar + `mount()` option; (b) chrome stays in the shadow as an
   in-pane bar; (c) builders' output moved to the light DOM with copied CSS. **Recommendation: (a).**
3. **G-3 · The status line's network source (D-9).** (a) the indicator state only; (b) the indicator OR a
   `PerformanceObserver` on http(s) resource entries — the browser's own record. **Recommendation: (b).**
4. **G-4 · The watch pill's green text (3.17:1 in light, pre-existing, never ruled).** (a) text in `--ink`, green
   kept for the dot and border; (b) accept onto the list; (c) a darker green token. **Recommendation: (a).**
5. **G-5 · `--faint` as text.** (a) convert every information-bearing `--faint` text to `--muted` by default, and
   list the decorative ones the census keeps; (b) case by case. **Recommendation: (a).**
6. **G-6 · Font sourcing.** Download Bricolage Grotesque and Sometype Mono from `google/fonts` at a pinned commit and
   subset with fontTools (the STIX precedent). **Recommendation: yes.**
7. **G-7 · A content-script tripwire.** (a) none (gate 1's "no ceiling"); (b) report-only: any task adding more than
   2 KB to the content script stops and reports before continuing. **Recommendation: (b)** — it is not a ceiling,
   only an early question.
8. **G-8 · If zip bytes cannot be made identical.** (a) claim "file-identical", compare extracted trees; (b) hold the
   reproducibility claim out of SECURITY.md until zips match. **Recommendation: (a)** with that exact wording.
9. **G-9 · Verifying the release workflow inside M13.** (a) a `workflow_dispatch` dry run, triggered once by you
   after the branch is pushed; (b) no verification until the first real tag. **Recommendation: (a).**
10. **G-10 · Onboarding auto-open on Edge and Chrome updates.** Confirming D-11: open on `install` only — not on
    `update`, `chrome_update` or `shared_module_update`. **Recommendation: confirm.**
11. **G-11 · Screenshots.** (a) captured by a script through the app-page harness at 1280×800, then you pick;
    (b) taken by hand. **Recommendation: (a)**, your pick final.
12. **G-12 · The TOC's collapsed look.** A decorative tick column beside the existing toggle (no hover card, no
    behaviour change). **Recommendation: yes.**
13. **G-13 · Node.** (a) pin Node 22 (`.nvmrc`, `engines`, CI) and state it to AMO; (b) move to Node 24 to match
    AMO's default (local is already 24.11.1). **Recommendation: (a)** for M13; revisit when 22 nears end of life.
14. **G-14 · `tests/manifest.test.ts`.** It is a trust pin; adding assertions (icons declared as PNG at 16/32/48/128,
    `action.default_icon`, version) without removing any. **Recommendation: authorize the additive edit.**
15. **G-15 · Where the dismissal lives (D-8).** (a) its own app-only row in the settings store; (b) a field on
    `Settings` (touches the content-script graph). **Recommendation: (a).**

---

_Gate status: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` (gate 3) is written in a fresh
session. No implementation before `tasks.md` is approved (WORKFLOW.md §5.3). Group 3's mock, group 8's walk and
group 9's re-check are human gates with no agent substitute; group 2.4 becomes one only if its numbers argue._
