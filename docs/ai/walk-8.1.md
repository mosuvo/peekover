# The 8.1 design walk — guide, items and scoring table

*M13 task 8.1 (`specs/013-first-release/tasks.md`). Prepared 2026-11-07 by an agent session (records only); **the walk is
the human's**. The walk script this file expands is `docs/ai/progress.md`, "THE 8.1 WALK SCRIPT". The human's rulings at
prep (2026-11-07): the table lives here, with a pointer from progress.md; known differences are pre-filled as
**"proposed: …"** for you to confirm or overwrite; a signed **unlisted** Firefox build on AMO is the only store-style
install before release (`decisions.md`, "M13 TASK 8.1 — preparation").*

## The one-page guide

**What you are judging.** The built extension at `67ce7b9` (version 0.1.0; Chrome zip `9ed349c2…`, Firefox zip
`d74715ca…` — the same bytes CI built). For every surface and every cell — light / dark × Chromium / Firefox × 1440 /
1280 / 1080 / 414 — one verdict: **matches**, **differs by ruling** (name the ruling) or **fix** (one line: what, where).
The toolbar is judged against `design/toolbar-mock.html`; the reader's parts against `design/mockup.html` (plan §7-2).

**How long.** About **3–4 hours**, best split into three sittings:
1. **Sitting A, ~60 min — the live checks** (the items list's section I, below): installs, the setup guide, file
   access, the toolbar icon, the Firefox `file://` check, the system fonts. These need a real browser; no screenshot
   stands in for them.
2. **Sitting B, ~90 min — the app page from the screenshots** (sections 3 and 4 of the table). Open each surface's
   `side-…png` (the build beside the mock frame) where it exists, else the shot. Most cells are minutes each once the
   first cell of a surface is judged: the other 15 differ by theme, engine and width only.
3. **Sitting C, ~45 min — the tab reader, contrast and the pending lists** (table section 5; items II–IV), then
   spot-check anything the screenshots made you doubt **in a live browser** (`scripts/walk-profiles.ps1`).

**The order.** Items I (live) → the table, section by section (1 → 3 → 4 → 5) → items II–IV → close.

**Where things are.**
- Screenshots: **`D:\Dev\peekover-shots\8.1\`** (not committed) — `<section>\<surface>\<theme>-<engine>-<width>.png`,
  the mock frame `mock-<theme>-<width>.png` and the pair `side-<theme>-<engine>-<width>.png` in the same folder; a
  `.failed.png` is the last frame of a capture that did not reach its state. Regenerate with
  `pnpm exec tsx scripts/walk-shots.ts` (both engines, ~45 min; `--engine`, `--only <surface>` to narrow).
- Fresh browsers: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\walk-profiles.ps1 -Browser <name>` —
  `chrome` (then Load unpacked, one step), `edge`, `brave`, `firefox` (temporary add-on), `firefox-signed -Xpi <file>`
  (after AMO signs it), `list`. Each run starts from an empty profile under `D:\Dev\peekover-walk-profiles\`; add
  `-Keep` to reopen the same profile (the restart checks). Opera and Vivaldi are not installed here.

**How to record a finding.** In the cell's row: **Verdict** = `matches` / `differs by ruling` / `fix`; **Ruling / fix** =
the ruling's name (a "proposed: …" there is the agent's suggestion — keep it by writing `differs by ruling` in Verdict,
or overwrite it) or one line saying what is wrong and where; **Notes** = anything else (a screenshot of a fix goes beside
the shots as `fix-<surface>-<cell>.png`). A "proposed: n/a" cell is a state that does not exist at that width — write
`n/a` to confirm. Never leave a cell blank and never write one verdict for a group of cells. Live items (below) get the
same three words plus what you saw.

**What happens after.** Every **fix** becomes a numbered discovered task — **8.1a, 8.1b, …** — written into tasks.md and
run before group 9; the walk is ticked only when every cell has its own verdict, every pending-list row is empty or
accepted by name, and the fix tasks are listed. Then group 9 (the truth re-check, store screenshots, the retro), then
go-live (`docs/store/GO-LIVE.md`).

## What the prep found (read before the walk)

- **Chromium: an unpacked install starts with "Allow access to file URLs" ON.** Measured in a `--load-extension` profile
  (Playwright Chromium): the toggle reads on before anyone touches it. A store install starts OFF. So the
  "toggle's default" question (item I-2) cannot be answered by any install this walk has — it waits for the first store
  install at go-live; the guide's OFF state is captured after a flip (`1-install/setup-guide-file-access-off`).
- **Chromium: the flip blocks Peekover until the browser restarts** (re-observed; 6.2's finding): after the toggle,
  the extension's pages fail with `ERR_BLOCKED_BY_CLIENT` until a restart.
- **Firefox: a temporary add-on did NOT render a `file://` `.md`** (Firefox 159, fresh profile, installed over WebDriver
  BiDi; the page stayed the browser's plain-text `<pre>`, in a normal tab, after 4 s). One probe, on a temporary
  install — not the §9-6 verdict. Item I-3 decides it on the signed unlisted install.
- **Firefox app-page shots open the folder through the harness, which is NOT a Firefox route.** The `__peekoverHarness`
  seam hands the page a folder handle (the Chromium route) in both engines. A real Firefox user opens a folder by the
  file picker (a read-only snapshot: "Watching isn't available for folders opened with the file picker…") or by
  dragging it onto the page (watching works). So the Firefox cells of `folder-granted`, `folder-search`,
  `watch-first-notice`, `watching`, `compare-picker` and `diff-view` show a harness-only state; the reading surfaces
  (the document, toolbar, panels) are the real Firefox drawing. In Firefox the harness's watch never saw the on-disk
  edit (the picker reads "No snapshots yet"; `diff-view` could not be reached). Judge both real routes live (item I-11).
- **The Recent list repeats one file.** In the app shots the "Recent" list shows `welcome.md` many times — each scripted
  re-open of the folder adds a row. It may be a real behaviour of reopening the same file; judge it (item II-4).
- **The editor's search panel** (`editor-search`) draws CodeMirror's own controls — lowercase "next / previous /
  all / replace", native checkboxes — not the restyled buttons; judge it (item II-8).
- **Firefox at 414**: a Firefox window cannot be narrower than 500 px, so its 414 cells lay out at 414 CSS px drawn
  at 500 / 414 device pixels (the PNG is 500 px wide, everything about 1.21× larger). Chromium's 414 cells are 414 px.
- **The sample text changes part-way**: the Compare and Diff surfaces edit `welcome.md` on disk while it is watched
  (to make a snapshot exist), so later shots in the same session read "…and this sentence changed while it was
  watched". Not a defect.
- **The diff view draws the document plainer than the reader** (`diff-view`): no blockquote bar, task items as bullets
  with native checkboxes, inline code unstyled, the text greyed. It may be the diff renderer's own style; judge it
  (item II-6).
- **What the mock frames leave out, by design**: `toolbar-mock.html` predates the toolbar's **"Setup guide"** link
  (6.1, D-11) and draws a simplified file list (no grant line, pins, search or recents) and no TOC rail. Compare the
  TOOLBAR against it (plan §7-2); judge the pane and the rail on their own (5.1, 5.2, 5.2a). The mock frames have no
  1280 state of their own — the script draws the mock at 1280 from its own frame code.
- **Footnotes do not render** (`[^1]` stays literal): not a defect — footnotes are not enabled (ledger row 254,
  withdrawn); the sample document has none.
- **Opera and Vivaldi are not installed here**; Chrome 156, Edge 157, Brave 157 and Firefox 159 are.

## The 8.1 items (consolidated)

Each item: what to look at → what "good" looks like → record. Items I are live only.

### I · Live checks (no screenshot substitute)

| # | Look at | Good looks like | Verdict | Notes |
| --- | --- | --- | --- | --- |
| I-1 | **Install and the setup guide, per browser** (Chrome by Load unpacked; Edge, Brave from the launcher; Firefox signed): does the guide open once on install, and not again after a browser restart (`-Keep`) or a toggle flip? | Opens exactly once. (Chromium unpacked loads re-install on every launch of `--load-extension` — judge "once" on Chrome's Load unpacked + restart, and on the signed Firefox.) | | |
| I-2 | **The file-URL toggle in each Chromium browser** (Chrome, Edge, Brave): its label as the browser shows it; typing `chrome://extensions` (or `edge://`, `brave://`); "Open Peekover's details" opening the Details page; flip off → on with the guide open: does the guide update on focus; does Peekover need a restart after? | Each step's words match what the browser shows; the guide's state follows the toggle; record what the flip did. **The default (off on a store install) is not checkable before go-live** (prep finding). | | |
| I-3 | **Firefox `file://` (§9-6)** on the SIGNED unlisted install, fresh profile: open a local `.md` by `file://` directly (not the app page). Also look in about:addons → Peekover → Permissions. | It renders with no setup. If Firefox asks for access, or it stays plain text → a discovered task (detection or instructions, no new permission — or STOP if a permission would be needed). This decides ledger rows 26 / 296 / 304 and the Firefox listing's "not yet been checked" line (9.2). | | |
| I-4 | **The toolbar icon** in Chrome, Edge, Brave and Firefox, with the browser's own light and dark themes. | Crisp at toolbar size; legible on both. | | |
| I-5 | **System font stacks by eye** on the tab reader (content script) on Windows — and macOS if available (D-3); once on a machine WITHOUT the design faces installed (CI's case: the chrome draws in the system face). Code draws Consolas on Windows (5.10, R1 — the human chose to proceed). | Reads as designed in the system face; nothing falls back to a serif or to Courier. | | |
| I-6 | **The tab reader on a raw GitHub / GitLab / Bitbucket file** (a real network page — your choice of file). | Same reader as on `file://`; the network indicator and "Network used" read true. | fix | The human's walk "item 13", two findings: (1) dark theme, a hovered link's text is unreadable — FIXED as 8.1b (`decisions.md` "M13 TASK 8.1b"; every link, both reader surfaces); (2) on a raw web file the "Peekover watches local files…" note sits over the text at bottom-left — FIXED as 8.1c (`decisions.md` "M13 TASK 8.1c": OPTION A, the note is an aside after the document; see II-9). |
| I-7 | **The folder picker and the denied state**: "Open a folder" (the OS dialog), cancel it, deny it. **Network used**: load a remote image with "Load" and read the status line ("Network used", no count — 4.7 ruling). | Each state is the restyled one (5.5); the status line changes from "No network calls" to "Network used". | | |
| I-8 | **The render-failure banner** — reachable only by a document that breaks the renderer; none is known. | Accept by name as tested-only (the fallback tests), or name a document that triggers it. | | |
| I-9 | **The reader's own untouched surfaces** in both themes (WORKFLOW §7.4) — anything the screenshots do not reach: print preview (Ctrl+P on the tab reader), the Export download, Copy as … menus. | Nothing unstyled or broken. | fix | The exported HTML "gets cut off at the middle" (the human). → **8.1a, landed 2026-11-10:** the export wrote `@mediaprint` / `@mediascreen …` (no space), so its print rule was dropped and the file printed one page; fixed in `htmlExport.ts` (Copy as HTML shares it; the app page's own PDF never used it). "A light export comes out dark" did not reproduce — a light export paints light paper (tested); two `body{}` token blocks appear only in a dark export, dark last. Re-check: export, open, print. |
| I-10 | **Release dry run and CI (G-9; Q6)** — already run: Release 42171130695 and 42171186611 on `14c274f` (build green; attest and release skipped; artifacts complete; `sha256sum -c` OK); the first CI on `main` (1.1); CI 42217671355 and Supply chain 42217671570 green on `67ce7b9`. | "as expected" — or a discovered task. | | |
| I-11 | **Firefox's two folder routes on the app page** (the shots cannot show them): (a) "Open a folder" → the file picker → the read-only snapshot, its note, Watch unavailable with its note; (b) drag the folder onto the page → the pane, Watch → the one-time notice → Watching → edit the file on disk → Compare → a snapshot → the diff view. | Each state restyled as in Chromium; the notes read true. | fix | The human, 2026-11-10, Firefox 159, the AMO-signed 0.0.9: (a) "Open a folder" → sample.md edited in Notepad and saved → clicking the file again showed the edit ("picker: fresh"); (b) drag: Watch updated after a save ("works as tested"). The picker-route texts that said "frozen" were re-worded with the human's approval — FIXED as 9.3c (`decisions.md`, "M13 TASK 9.3c"); Watch for a picked folder is carried past 0.1.0. |

### II · Things the screenshots show that need a judgement, not a pixel match

| # | Look at | Good looks like | Verdict | Notes |
| --- | --- | --- | --- | --- |
| II-1 | **3.1 named check** — Editing (Read / Edit / Raw while editing), the Watching pill, the one-time snapshot notice, the Compare picker, the Files overlay — WORKING, both engines, both themes (surfaces `editing`, `watching`, `watch-first-notice`, `compare-picker`, `files-overlay`). | Each matches the approved mock frame or a named ruling. | | |
| II-2 | The **compact toolbar** (≤ 863 px, "⋯") at 414 (`more-menu`); the **agent file at 1280** two-row toolbar (`agent-file`, C061). | At most two rows; "⋯" holds Theme, Code theme, Stored data, Export, Setup guide. | | |
| II-3 | The **no-folder state** (`no-folder`, `no-folder-pinned`): the mock's ink-primary "Open a folder" in the toolbar vs 5.5's body card ("Mock + uniform" ruling). | The ruling's layout; record matches / differs by ruling / fix. | | |
| II-4 | The **Recent list** repeating the same file (prep finding). | Decide: expected, or a fix. | | |
| II-5 | **Code**: the Peekover theme (constants colour on `const` names; the synthesised italic); "Show full code" (kept its 009 look); the in-flow code toolbar vs the mock's floating copy button (`code-blocks`, `long-code`). | As 5.8 / 5.3 built and the mock's colours. | | |
| II-6 | **Diff view** (`diff-view`): added text told from unchanged by fill alone (removed also has line-through) — is a non-colour marker needed (WCAG 1.4.1)? And the plainer document style inside the diff (prep finding). | Decide: accept, or a fix. | | |
| II-7 | **Panels and dialogs** (`stored-data-panel`, `export-panel`, `code-theme-panel`, `unsaved-guard`, `diagram-lightbox`): the dark scrims; the lightbox's card; popover radius 12 (mock) vs `.panelbox` 14; the mock's `.go` size vs the primaries' 11.5 px. | Matches, or the difference accepted by name. | | |
| II-8 | **The editor** (`editing`, `editing-unsaved`, `editor-search`): the save bar sits inside the split's border (the mock draws it above); Save has no hover change and no disabled state — FLAGGED at 5.7, never ruled; the search panel's CodeMirror-default controls (prep finding). | Accept each by name, or a fix. | | |
| II-9 | **The tab reader's floating pills** at 1080 and 414 (`tab-reader-reading`): the bottom-left stack floats over body text mid-scroll ("no chrome over text" ruled AT REST, 5.6); the contents button sits 17 px lower while the card is open (73 vs 52). | Matches the ruling, or a fix. | | |
| II-10 | **TOC** (`toc-open`, `short-document`): open card, rows, the "here" highlighter; at narrow widths the collapsed opener over the text's top-right (at 414 it spans 252 → 374, text to 358); the short-document card. | As 5.2 / 5.2a built. | | |

### III · Non-text contrast (WCAG 1.4.11), both themes — accept by name or fix

Measured below 3:1 and carried by text, weight, `aria-current` or a shadow instead. Judge on the shots of every
surface; record one line each.

| # | Element (ratio light / dark) | Verdict (accept / fix) | Notes |
| --- | --- | --- | --- |
| III-1 | Borders `--line` on `--paper` 1.21 / 1.29 — buttons, fields, cards, panels, the editor bar's rule, the tab reader's pills | | |
| III-2 | Fills 1.03–1.25 — hover `--accent-soft`, the open row, alert fills, the pills' `--panel` | | |
| III-3 | `--faint` 2.60 / 3.70 — scrollbar thumbs, the tree's twisty, hovered borders, a pressed toggle | | |
| III-4 | The TOC "here" bar `--hl` 1.19 in light | | |
| III-5 | The decorative TOC ticks | | |
| III-6 | Control boundaries and focus indicators on every surface (Tab through the app page in a live browser) | | |

### IV · The pending lists (gate-3 Q4)

| # | List | State at prep | Verdict | Notes |
| --- | --- | --- | --- | --- |
| IV-1 | 2.2's contrast census | EMPTY at 5.7 (both engines); no product change since that touches a token | | confirm still empty, or accept each row BY NAME |
| IV-2 | 5.1's native-control sweep | EMPTY at 5.7 (both engines) | | confirm still empty, or accept each row BY NAME |

### Close of the walk

Every cell below has its own verdict; engines and viewports recorded (above and in each cell's name); every "fix" a
numbered task (8.1a …); Golden EMPTY; `permissions: []`.

## Surfaces that cannot be captured automatically (a live look)

- The **toolbar icon** (browser chrome) — I-4.
- **Install-time behaviour**: the guide opening once, restarts, toggle defaults, flip behaviour, the Details deep link,
  chrome://extensions itself — I-1, I-2.
- **The folder picker** (an OS dialog) and **the denied state**; **"Network used"** (needs a real request) — I-7.
- **The render-failure banner** (no document triggers it) — I-8.
- **The tab reader on raw GitHub / GitLab / Bitbucket** (a real network page) — I-6.
- **Firefox's tab reader on `file://`**: the temporary add-on showed plain text; the Firefox cells of section 5 show
  that, not the reader — I-3.
- **System stacks on a machine without the design faces, and on macOS** — I-5.
- Any cell marked "capture failed" below.

## The scoring table

Shots root: **`D:\Dev\peekover-shots\8.1\`**. Columns: **Cell** (theme-engine-width) · **Screenshot** · **Verdict**
(matches / differs by ruling / fix) · **Ruling / fix** (pre-filled "proposed: …" where a recorded ruling explains a known
difference — yours to confirm) · **Notes**. A surface with a mock also has `mock-…` and `side-…` files in its folder.


#### `1-install/setup-guide`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `1-install/setup-guide/light-chromium-1440.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| light-chromium-1280 | `1-install/setup-guide/light-chromium-1280.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| light-chromium-1080 | `1-install/setup-guide/light-chromium-1080.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| light-chromium-414 | `1-install/setup-guide/light-chromium-414.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| dark-chromium-1440 | `1-install/setup-guide/dark-chromium-1440.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| dark-chromium-1280 | `1-install/setup-guide/dark-chromium-1280.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| dark-chromium-1080 | `1-install/setup-guide/dark-chromium-1080.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| dark-chromium-414 | `1-install/setup-guide/dark-chromium-414.png` | | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | |
| light-firefox-1440 | `1-install/setup-guide/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `1-install/setup-guide/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `1-install/setup-guide/light-firefox-1080.png` | |  | |
| light-firefox-414 | `1-install/setup-guide/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `1-install/setup-guide/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `1-install/setup-guide/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `1-install/setup-guide/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `1-install/setup-guide/dark-firefox-414.png` | |  | |

#### `1-install/setup-guide-file-access-off`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `1-install/setup-guide-file-access-off/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `1-install/setup-guide-file-access-off/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `1-install/setup-guide-file-access-off/light-chromium-1080.png` | |  | |
| light-chromium-414 | `1-install/setup-guide-file-access-off/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `1-install/setup-guide-file-access-off/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `1-install/setup-guide-file-access-off/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `1-install/setup-guide-file-access-off/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `1-install/setup-guide-file-access-off/dark-chromium-414.png` | |  | |
| light-firefox-1440 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| light-firefox-1280 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| light-firefox-1080 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| light-firefox-414 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| dark-firefox-1440 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| dark-firefox-1280 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| dark-firefox-1080 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |
| dark-firefox-414 | — (Chromium-only state) | n/a | Firefox has no file-URL toggle | |

#### `3-app-chrome/no-folder`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/no-folder/light-chromium-1440.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-chromium-1280 | `3-app-chrome/no-folder/light-chromium-1280.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-chromium-1080 | `3-app-chrome/no-folder/light-chromium-1080.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-chromium-414 | `3-app-chrome/no-folder/light-chromium-414.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-chromium-1440 | `3-app-chrome/no-folder/dark-chromium-1440.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-chromium-1280 | `3-app-chrome/no-folder/dark-chromium-1280.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-chromium-1080 | `3-app-chrome/no-folder/dark-chromium-1080.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-chromium-414 | `3-app-chrome/no-folder/dark-chromium-414.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-firefox-1440 | `3-app-chrome/no-folder/light-firefox-1440.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-firefox-1280 | `3-app-chrome/no-folder/light-firefox-1280.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-firefox-1080 | `3-app-chrome/no-folder/light-firefox-1080.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| light-firefox-414 | `3-app-chrome/no-folder/light-firefox-414.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-firefox-1440 | `3-app-chrome/no-folder/dark-firefox-1440.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-firefox-1280 | `3-app-chrome/no-folder/dark-firefox-1280.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-firefox-1080 | `3-app-chrome/no-folder/dark-firefox-1080.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |
| dark-firefox-414 | `3-app-chrome/no-folder/dark-firefox-414.png` | | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) | |

#### `3-app-chrome/folder-granted`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/folder-granted/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/folder-granted/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/folder-granted/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/folder-granted/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/folder-granted/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/folder-granted/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/folder-granted/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/folder-granted/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/folder-granted/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/folder-granted/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/folder-granted/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/folder-granted/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/folder-granted/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/folder-granted/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/folder-granted/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/folder-granted/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/reading`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/reading/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/reading/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/reading/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/reading/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/reading/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/reading/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/reading/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/reading/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/reading/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `3-app-chrome/reading/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `3-app-chrome/reading/light-firefox-1080.png` | |  | |
| light-firefox-414 | `3-app-chrome/reading/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `3-app-chrome/reading/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `3-app-chrome/reading/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `3-app-chrome/reading/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `3-app-chrome/reading/dark-firefox-414.png` | |  | |

#### `3-app-chrome/agent-file`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/agent-file/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/agent-file/light-chromium-1280.png` | | proposed: differs by ruling — C061: an agent file wraps to a second toolbar row between 864 and ~1290 px (decisions.md 2026-11-03, "M13 RULING — C061 at 1280") | |
| light-chromium-1080 | `3-app-chrome/agent-file/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/agent-file/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/agent-file/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/agent-file/dark-chromium-1280.png` | | proposed: differs by ruling — C061: an agent file wraps to a second toolbar row between 864 and ~1290 px (decisions.md 2026-11-03, "M13 RULING — C061 at 1280") | |
| dark-chromium-1080 | `3-app-chrome/agent-file/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/agent-file/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/agent-file/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `3-app-chrome/agent-file/light-firefox-1280.png` | | proposed: differs by ruling — C061: an agent file wraps to a second toolbar row between 864 and ~1290 px (decisions.md 2026-11-03, "M13 RULING — C061 at 1280") | |
| light-firefox-1080 | `3-app-chrome/agent-file/light-firefox-1080.png` | |  | |
| light-firefox-414 | `3-app-chrome/agent-file/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `3-app-chrome/agent-file/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `3-app-chrome/agent-file/dark-firefox-1280.png` | | proposed: differs by ruling — C061: an agent file wraps to a second toolbar row between 864 and ~1290 px (decisions.md 2026-11-03, "M13 RULING — C061 at 1280") | |
| dark-firefox-1080 | `3-app-chrome/agent-file/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `3-app-chrome/agent-file/dark-firefox-414.png` | |  | |

#### `3-app-chrome/raw`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/raw/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/raw/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/raw/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/raw/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/raw/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/raw/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/raw/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/raw/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/raw/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `3-app-chrome/raw/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `3-app-chrome/raw/light-firefox-1080.png` | |  | |
| light-firefox-414 | `3-app-chrome/raw/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `3-app-chrome/raw/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `3-app-chrome/raw/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `3-app-chrome/raw/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `3-app-chrome/raw/dark-firefox-414.png` | |  | |

#### `3-app-chrome/more-menu`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-chromium-1280 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-chromium-1080 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-chromium-414 | `3-app-chrome/more-menu/light-chromium-414.png` | |  | |
| dark-chromium-1440 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-chromium-1280 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-chromium-1080 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-chromium-414 | `3-app-chrome/more-menu/dark-chromium-414.png` | |  | |
| light-firefox-1440 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-firefox-1280 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-firefox-1080 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| light-firefox-414 | `3-app-chrome/more-menu/light-firefox-414.png` | |  | |
| dark-firefox-1440 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-firefox-1280 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-firefox-1080 | — | proposed: n/a | no "⋯" above 863 px — the app controls are in the toolbar | |
| dark-firefox-414 | `3-app-chrome/more-menu/dark-firefox-414.png` | |  | |

#### `3-app-chrome/files-overlay`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| light-chromium-1280 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| light-chromium-1080 | `3-app-chrome/files-overlay/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/files-overlay/light-chromium-414.png` | |  | |
| dark-chromium-1440 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| dark-chromium-1280 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| dark-chromium-1080 | `3-app-chrome/files-overlay/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/files-overlay/dark-chromium-414.png` | |  | |
| light-firefox-1440 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| light-firefox-1280 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| light-firefox-1080 | `3-app-chrome/files-overlay/light-firefox-1080.png` | |  | |
| light-firefox-414 | `3-app-chrome/files-overlay/light-firefox-414.png` | |  | |
| dark-firefox-1440 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| dark-firefox-1280 | — | proposed: n/a | no Files overlay above 1189 px — the pane stays in the row | |
| dark-firefox-1080 | `3-app-chrome/files-overlay/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `3-app-chrome/files-overlay/dark-firefox-414.png` | |  | |

#### `3-app-chrome/folder-search`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/folder-search/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/folder-search/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/folder-search/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/folder-search/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/folder-search/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/folder-search/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/folder-search/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/folder-search/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/folder-search/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/folder-search/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/folder-search/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/folder-search/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/folder-search/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/folder-search/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/folder-search/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/folder-search/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/folder-empty`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/folder-empty/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/folder-empty/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/folder-empty/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/folder-empty/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/folder-empty/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/folder-empty/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/folder-empty/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/folder-empty/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/folder-empty/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/folder-empty/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/folder-empty/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/folder-empty/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/folder-empty/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/folder-empty/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/folder-empty/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/folder-empty/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/watch-first-notice`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/watch-first-notice/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/watch-first-notice/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/watch-first-notice/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/watch-first-notice/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/watch-first-notice/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/watch-first-notice/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/watch-first-notice/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/watch-first-notice/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/watch-first-notice/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/watch-first-notice/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/watch-first-notice/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/watch-first-notice/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/watch-first-notice/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/watch-first-notice/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/watch-first-notice/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/watch-first-notice/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/watching`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/watching/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/watching/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/watching/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/watching/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/watching/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/watching/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/watching/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/watching/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/watching/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/watching/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/watching/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/watching/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/watching/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/watching/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/watching/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/watching/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/compare-picker`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/compare-picker/light-chromium-1440.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| light-chromium-1280 | `3-app-chrome/compare-picker/light-chromium-1280.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| light-chromium-1080 | `3-app-chrome/compare-picker/light-chromium-1080.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| light-chromium-414 | `3-app-chrome/compare-picker/light-chromium-414.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| dark-chromium-1440 | `3-app-chrome/compare-picker/dark-chromium-1440.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| dark-chromium-1280 | `3-app-chrome/compare-picker/dark-chromium-1280.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| dark-chromium-1080 | `3-app-chrome/compare-picker/dark-chromium-1080.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| dark-chromium-414 | `3-app-chrome/compare-picker/dark-chromium-414.png` | | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | |
| light-firefox-1440 | `3-app-chrome/compare-picker/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/compare-picker/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/compare-picker/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/compare-picker/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/compare-picker/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/compare-picker/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/compare-picker/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/compare-picker/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `3-app-chrome/remote-media`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/remote-media/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/remote-media/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/remote-media/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/remote-media/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/remote-media/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/remote-media/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/remote-media/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/remote-media/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/remote-media/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `3-app-chrome/remote-media/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `3-app-chrome/remote-media/light-firefox-1080.png` | |  | |
| light-firefox-414 | `3-app-chrome/remote-media/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `3-app-chrome/remote-media/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `3-app-chrome/remote-media/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `3-app-chrome/remote-media/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `3-app-chrome/remote-media/dark-firefox-414.png` | |  | |

#### `3-app-chrome/no-folder-pinned`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `3-app-chrome/no-folder-pinned/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `3-app-chrome/no-folder-pinned/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `3-app-chrome/no-folder-pinned/light-chromium-1080.png` | |  | |
| light-chromium-414 | `3-app-chrome/no-folder-pinned/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `3-app-chrome/no-folder-pinned/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `3-app-chrome/no-folder-pinned/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `3-app-chrome/no-folder-pinned/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `3-app-chrome/no-folder-pinned/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `3-app-chrome/no-folder-pinned/light-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1280 | `3-app-chrome/no-folder-pinned/light-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-1080 | `3-app-chrome/no-folder-pinned/light-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| light-firefox-414 | `3-app-chrome/no-folder-pinned/light-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1440 | `3-app-chrome/no-folder-pinned/dark-firefox-1440.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1280 | `3-app-chrome/no-folder-pinned/dark-firefox-1280.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-1080 | `3-app-chrome/no-folder-pinned/dark-firefox-1080.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |
| dark-firefox-414 | `3-app-chrome/no-folder-pinned/dark-firefox-414.png` | | harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | |

#### `4-reader/toc-open`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/toc-open/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/toc-open/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/toc-open/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/toc-open/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/toc-open/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/toc-open/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/toc-open/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/toc-open/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/toc-open/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/toc-open/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/toc-open/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/toc-open/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/toc-open/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/toc-open/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/toc-open/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/toc-open/dark-firefox-414.png` | |  | |

#### `4-reader/short-document`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/short-document/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/short-document/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/short-document/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/short-document/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/short-document/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/short-document/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/short-document/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/short-document/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/short-document/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/short-document/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/short-document/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/short-document/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/short-document/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/short-document/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/short-document/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/short-document/dark-firefox-414.png` | |  | |

#### `4-reader/code-blocks`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/code-blocks/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/code-blocks/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/code-blocks/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/code-blocks/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/code-blocks/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/code-blocks/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/code-blocks/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/code-blocks/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/code-blocks/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/code-blocks/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/code-blocks/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/code-blocks/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/code-blocks/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/code-blocks/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/code-blocks/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/code-blocks/dark-firefox-414.png` | |  | |

#### `4-reader/long-code`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/long-code/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/long-code/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/long-code/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/long-code/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/long-code/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/long-code/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/long-code/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/long-code/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/long-code/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/long-code/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/long-code/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/long-code/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/long-code/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/long-code/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/long-code/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/long-code/dark-firefox-414.png` | |  | |

#### `4-reader/math`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/math/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/math/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/math/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/math/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/math/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/math/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/math/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/math/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/math/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/math/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/math/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/math/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/math/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/math/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/math/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/math/dark-firefox-414.png` | |  | |

#### `4-reader/table-tools`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/table-tools/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/table-tools/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/table-tools/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/table-tools/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/table-tools/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/table-tools/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/table-tools/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/table-tools/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/table-tools/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/table-tools/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/table-tools/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/table-tools/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/table-tools/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/table-tools/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/table-tools/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/table-tools/dark-firefox-414.png` | |  | |

#### `4-reader/table-filtered`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/table-filtered/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/table-filtered/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/table-filtered/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/table-filtered/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/table-filtered/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/table-filtered/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/table-filtered/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/table-filtered/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/table-filtered/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/table-filtered/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/table-filtered/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/table-filtered/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/table-filtered/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/table-filtered/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/table-filtered/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/table-filtered/dark-firefox-414.png` | |  | |

#### `4-reader/diagram`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/diagram/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/diagram/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/diagram/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/diagram/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/diagram/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/diagram/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/diagram/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/diagram/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/diagram/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/diagram/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/diagram/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/diagram/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/diagram/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/diagram/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/diagram/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/diagram/dark-firefox-414.png` | |  | |

#### `4-reader/diagram-lightbox`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/diagram-lightbox/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/diagram-lightbox/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/diagram-lightbox/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/diagram-lightbox/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/diagram-lightbox/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/diagram-lightbox/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/diagram-lightbox/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/diagram-lightbox/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/diagram-lightbox/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/diagram-lightbox/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/diagram-lightbox/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/diagram-lightbox/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/diagram-lightbox/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/diagram-lightbox/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/diagram-lightbox/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/diagram-lightbox/dark-firefox-414.png` | |  | |

#### `4-reader/stored-data-panel`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/stored-data-panel/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/stored-data-panel/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/stored-data-panel/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/stored-data-panel/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/stored-data-panel/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/stored-data-panel/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/stored-data-panel/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/stored-data-panel/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/stored-data-panel/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/stored-data-panel/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/stored-data-panel/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/stored-data-panel/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/stored-data-panel/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/stored-data-panel/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/stored-data-panel/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/stored-data-panel/dark-firefox-414.png` | |  | |

#### `4-reader/export-panel`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/export-panel/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/export-panel/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/export-panel/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/export-panel/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/export-panel/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/export-panel/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/export-panel/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/export-panel/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/export-panel/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/export-panel/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/export-panel/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/export-panel/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/export-panel/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/export-panel/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/export-panel/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/export-panel/dark-firefox-414.png` | |  | |

#### `4-reader/code-theme-panel`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/code-theme-panel/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/code-theme-panel/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/code-theme-panel/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/code-theme-panel/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/code-theme-panel/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/code-theme-panel/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/code-theme-panel/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/code-theme-panel/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/code-theme-panel/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/code-theme-panel/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/code-theme-panel/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/code-theme-panel/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/code-theme-panel/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/code-theme-panel/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/code-theme-panel/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/code-theme-panel/dark-firefox-414.png` | |  | |

#### `4-reader/editing`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/editing/light-chromium-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-1280 | `4-reader/editing/light-chromium-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-1080 | `4-reader/editing/light-chromium-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-414 | `4-reader/editing/light-chromium-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1440 | `4-reader/editing/dark-chromium-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1280 | `4-reader/editing/dark-chromium-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1080 | `4-reader/editing/dark-chromium-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-414 | `4-reader/editing/dark-chromium-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1440 | `4-reader/editing/light-firefox-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1280 | `4-reader/editing/light-firefox-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1080 | `4-reader/editing/light-firefox-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-414 | `4-reader/editing/light-firefox-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1440 | `4-reader/editing/dark-firefox-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1280 | `4-reader/editing/dark-firefox-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1080 | `4-reader/editing/dark-firefox-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-414 | `4-reader/editing/dark-firefox-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |

#### `4-reader/editing-unsaved`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/editing-unsaved/light-chromium-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-1280 | `4-reader/editing-unsaved/light-chromium-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-1080 | `4-reader/editing-unsaved/light-chromium-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-chromium-414 | `4-reader/editing-unsaved/light-chromium-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1440 | `4-reader/editing-unsaved/dark-chromium-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1280 | `4-reader/editing-unsaved/dark-chromium-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-1080 | `4-reader/editing-unsaved/dark-chromium-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-chromium-414 | `4-reader/editing-unsaved/dark-chromium-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1440 | `4-reader/editing-unsaved/light-firefox-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1280 | `4-reader/editing-unsaved/light-firefox-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-1080 | `4-reader/editing-unsaved/light-firefox-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| light-firefox-414 | `4-reader/editing-unsaved/light-firefox-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1440 | `4-reader/editing-unsaved/dark-firefox-1440.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1280 | `4-reader/editing-unsaved/dark-firefox-1280.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-1080 | `4-reader/editing-unsaved/dark-firefox-1080.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |
| dark-firefox-414 | `4-reader/editing-unsaved/dark-firefox-414.png` | | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here | |

#### `4-reader/unsaved-guard`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/unsaved-guard/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/unsaved-guard/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/unsaved-guard/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/unsaved-guard/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/unsaved-guard/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/unsaved-guard/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/unsaved-guard/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/unsaved-guard/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/unsaved-guard/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/unsaved-guard/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/unsaved-guard/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/unsaved-guard/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/unsaved-guard/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/unsaved-guard/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/unsaved-guard/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/unsaved-guard/dark-firefox-414.png` | |  | |

#### `4-reader/editor-search`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/editor-search/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/editor-search/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/editor-search/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/editor-search/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/editor-search/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/editor-search/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/editor-search/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/editor-search/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/editor-search/light-firefox-1440.png` | |  | |
| light-firefox-1280 | `4-reader/editor-search/light-firefox-1280.png` | |  | |
| light-firefox-1080 | `4-reader/editor-search/light-firefox-1080.png` | |  | |
| light-firefox-414 | `4-reader/editor-search/light-firefox-414.png` | |  | |
| dark-firefox-1440 | `4-reader/editor-search/dark-firefox-1440.png` | |  | |
| dark-firefox-1280 | `4-reader/editor-search/dark-firefox-1280.png` | |  | |
| dark-firefox-1080 | `4-reader/editor-search/dark-firefox-1080.png` | |  | |
| dark-firefox-414 | `4-reader/editor-search/dark-firefox-414.png` | |  | |

#### `4-reader/diff-view`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `4-reader/diff-view/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `4-reader/diff-view/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `4-reader/diff-view/light-chromium-1080.png` | |  | |
| light-chromium-414 | `4-reader/diff-view/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `4-reader/diff-view/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `4-reader/diff-view/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `4-reader/diff-view/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `4-reader/diff-view/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `4-reader/diff-view/light-firefox-1440.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| light-firefox-1280 | `4-reader/diff-view/light-firefox-1280.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| light-firefox-1080 | `4-reader/diff-view/light-firefox-1080.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| light-firefox-414 | `4-reader/diff-view/light-firefox-414.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| dark-firefox-1440 | `4-reader/diff-view/dark-firefox-1440.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| dark-firefox-1280 | `4-reader/diff-view/dark-firefox-1280.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| dark-firefox-1080 | `4-reader/diff-view/dark-firefox-1080.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |
| dark-firefox-414 | `4-reader/diff-view/dark-firefox-414.failed.png` (capture failed) | | | live look — the script: no snapshot row in the picker |

#### `5-tab-reader/tab-reader`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `5-tab-reader/tab-reader/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `5-tab-reader/tab-reader/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `5-tab-reader/tab-reader/light-chromium-1080.png` | |  | |
| light-chromium-414 | `5-tab-reader/tab-reader/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `5-tab-reader/tab-reader/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `5-tab-reader/tab-reader/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `5-tab-reader/tab-reader/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `5-tab-reader/tab-reader/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `5-tab-reader/tab-reader/light-firefox-1440.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| light-firefox-1280 | `5-tab-reader/tab-reader/light-firefox-1280.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| light-firefox-1080 | `5-tab-reader/tab-reader/light-firefox-1080.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| light-firefox-414 | `5-tab-reader/tab-reader/light-firefox-414.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| dark-firefox-1440 | `5-tab-reader/tab-reader/dark-firefox-1440.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| dark-firefox-1280 | `5-tab-reader/tab-reader/dark-firefox-1280.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| dark-firefox-1080 | `5-tab-reader/tab-reader/dark-firefox-1080.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |
| dark-firefox-414 | `5-tab-reader/tab-reader/dark-firefox-414.png` | | not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | |

#### `5-tab-reader/tab-reader-contents-open`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `5-tab-reader/tab-reader-contents-open/light-chromium-1440.png` | |  | |
| light-chromium-1280 | `5-tab-reader/tab-reader-contents-open/light-chromium-1280.png` | |  | |
| light-chromium-1080 | `5-tab-reader/tab-reader-contents-open/light-chromium-1080.png` | |  | |
| light-chromium-414 | `5-tab-reader/tab-reader-contents-open/light-chromium-414.png` | |  | |
| dark-chromium-1440 | `5-tab-reader/tab-reader-contents-open/dark-chromium-1440.png` | |  | |
| dark-chromium-1280 | `5-tab-reader/tab-reader-contents-open/dark-chromium-1280.png` | |  | |
| dark-chromium-1080 | `5-tab-reader/tab-reader-contents-open/dark-chromium-1080.png` | |  | |
| dark-chromium-414 | `5-tab-reader/tab-reader-contents-open/dark-chromium-414.png` | |  | |
| light-firefox-1440 | `5-tab-reader/tab-reader-contents-open/light-firefox-1440.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| light-firefox-1280 | `5-tab-reader/tab-reader-contents-open/light-firefox-1280.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| light-firefox-1080 | `5-tab-reader/tab-reader-contents-open/light-firefox-1080.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| light-firefox-414 | `5-tab-reader/tab-reader-contents-open/light-firefox-414.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| dark-firefox-1440 | `5-tab-reader/tab-reader-contents-open/dark-firefox-1440.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| dark-firefox-1280 | `5-tab-reader/tab-reader-contents-open/dark-firefox-1280.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| dark-firefox-1080 | `5-tab-reader/tab-reader-contents-open/dark-firefox-1080.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |
| dark-firefox-414 | `5-tab-reader/tab-reader-contents-open/dark-firefox-414.failed.png` (capture failed) | | | live look — the script: no contents opener (the reader did not mount?) |

#### `5-tab-reader/tab-reader-reading`

| Cell | Screenshot (under the shots root) | Verdict | Ruling / fix | Notes |
| --- | --- | --- | --- | --- |
| light-chromium-1440 | `5-tab-reader/tab-reader-reading/light-chromium-1440.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-chromium-1280 | `5-tab-reader/tab-reader-reading/light-chromium-1280.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-chromium-1080 | `5-tab-reader/tab-reader-reading/light-chromium-1080.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-chromium-414 | `5-tab-reader/tab-reader-reading/light-chromium-414.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-chromium-1440 | `5-tab-reader/tab-reader-reading/dark-chromium-1440.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-chromium-1280 | `5-tab-reader/tab-reader-reading/dark-chromium-1280.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-chromium-1080 | `5-tab-reader/tab-reader-reading/dark-chromium-1080.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-chromium-414 | `5-tab-reader/tab-reader-reading/dark-chromium-414.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-firefox-1440 | `5-tab-reader/tab-reader-reading/light-firefox-1440.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-firefox-1280 | `5-tab-reader/tab-reader-reading/light-firefox-1280.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-firefox-1080 | `5-tab-reader/tab-reader-reading/light-firefox-1080.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| light-firefox-414 | `5-tab-reader/tab-reader-reading/light-firefox-414.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-firefox-1440 | `5-tab-reader/tab-reader-reading/dark-firefox-1440.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-firefox-1280 | `5-tab-reader/tab-reader-reading/dark-firefox-1280.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-firefox-1080 | `5-tab-reader/tab-reader-reading/dark-firefox-1080.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
| dark-firefox-414 | `5-tab-reader/tab-reader-reading/dark-firefox-414.png` | | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) | |
