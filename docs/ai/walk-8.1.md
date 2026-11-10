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
`n/a` to confirm. **Since 2026-11-10 (HUMAN RULING, walk prep) the table is ONE verdict per surface**, with a
**Per-cell exceptions** column for any cell that differs; a surface is done when its verdict covers every cell not
listed as an exception and every exception has its own word. Live items (below) get the same three words plus what
you saw.

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

## Human walk notes (from the review chat), 2026-11-09 / 10

*The human's walk results as recorded in the review chat, lightly summarised (not verbatim), banked by the agent at
walk prep on 2026-11-10. Mapped to the items and surfaces below; nothing here is a verdict the notes do not contain.*

**CHROME** (launcher `-Browser chrome`; Load unpacked `.output/chrome-mv3`; `-Keep` for the restart check), light and
dark unless stated:

| # | Note | Outcome | Maps to |
| --- | --- | --- | --- |
| 1 | Setup guide opens on install (shows "Allow access to file URLs is on" — expected for an unpacked install) | OK | I-1, I-2 (the on state); surface 1 |
| 2 | `file:///D:/Dev/peekover/docs/store/assets/sample.md` renders formatted | OK | surface 34 |
| 3 | Contents list (TOC) jumps, and highlights the current section while scrolling | OK | II-10 (tab reader); surfaces 35, 36 |
| 4 | Light / dark themes | OK | surface 34 |
| 5 | Table filter, Copy CSV, Raw toggle | OK | (the tab reader's tools; the app page's table and Raw surfaces 7, 22, 23 not covered) |
| 6 | App page: open folder `D:\Dev\peekover\docs`, the listing, opening a file | OK | I-7 (the picker, Chrome); surfaces 4, 5 |
| 7 | App-page features (diagram drawn, math, coloured code, folder tree, Recent, "No network calls") | OK | surfaces 5, 19, 21, 24 |
| 8 | Pins and Recent after reopening | OK | surface 16 |
| 9 | Export | FIX → **8.1a (landed)**: the exported HTML printed cut off; **8.1d (landed)**: it did not scroll, showed the math source, carried controls; **8.1e (landed)**: Copy as rich text carried them too | I-9 |
| 10 | Edit, save, Watch on a scratch copy (`D:\Dev\walk-scratch\sample.md`); the 9.3a Watch timing fix confirmed in real use | OK | II-1, II-8 (partly); surfaces 13, 29 |
| 11 | Compare (snapshots); the diff view judged fine | OK | II-1, II-6; surfaces 14, 33 |
| 12 | Diagram copy / download / lightbox; code line numbers, wrap, copy; code theme | OK | II-5, II-7 (partly); surfaces 19, 24, 25, 28 |
| 13 | Raw GitHub file | FIX → **8.1b (landed)**: dark-mode link hover unreadable; **8.1c (landed)**: the watch note floated over the text | I-6 |
| 14 | Stored data list and Wipe all data | OK | II-7 (partly); surface 26 |
| 15 | Guide stays closed after a restart (kept profile) | OK | I-1 |

**EDGE** (launcher `-Browser edge`):

| # | Note | Outcome | Maps to |
| --- | --- | --- | --- |
| E1 | Guide shows "Allow access to file URLs is on" | OK | I-1, I-2 (the on state); surface 1 |
| E2 | `file://` renders formatted | OK | surface 34 |
| E3 | App page diagram / math / code | OK | surfaces 19, 21, 24 |
| E4 | Theme switch and print preview | OK | I-9 (print preview, Edge). **Dark link hover on Edge: NOT explicitly checked** |

**FIREFOX:**
- Signed 0.0.9 (the agent's AMO step 11 + the human): the guide opens once and stays closed across restarts; `file://`
  needs "Access local files on your computer" → **9.2b (landed)**. Maps to I-1 (Firefox), I-3.
- Hand check, Firefox 159, signed 0.0.9: picker FRESH (an edit shows when the file is opened again); drag: Watch updated
  after a save. Recorded as final-review step 1(c) / (d); → **9.3c (landed)**. Maps to I-11.
- **The CURRENT build's Firefox walk is NOT yet done:** the 9.2b guide section, the 9.3b drag note, the 9.3a Watch
  timing, and 8.1a / 8.1b / 8.1c.

## The remaining checklist (2026-11-10, after the walk notes) — in walking order

*Everything still open in the walk, shortest path. Build: `.output` as of `224e711` (both engines built there); the
8.1 screenshots (`67ce7b9`) still stand for the app page — nothing since changed an app-page surface except the
Firefox-only folder notes (9.3c) and the setup guide (9.2b). Launcher: `powershell -NoProfile -ExecutionPolicy Bypass
-File scripts\walk-profiles.ps1 -Browser <name>`. Total about **2½–3 h**.*

**A · CHROME — the current build** (`-Browser chrome`, then Load unpacked `.output\chrome-mv3`) · ~35 min
1. **8.1b** — dark theme: hover a link on `file:///D:/Dev/peekover/docs/store/assets/sample.md` and on the app page;
   the text sits on the yellow fill. *2 min*
2. **8.1c + I-6** — a raw GitHub file, light and dark: the "Peekover watches local files…" note sits below the last
   line, never over text; the network indicator and "Network used" read true. *4 min*
3. **8.1a + 8.1d + I-9** — app page → Export the sample → open the file → scroll to the bottom (no buttons, no LaTeX
   source above the formula) → Ctrl+P: every page in the preview; then the Copy as … menus. *5 min*
4. **I-2** — chrome://extensions: the toggle's label; "Open Peekover's details" from the guide; flip off → on with the
   guide open (it should follow on focus). *5 min*
5. **I-7** — "Open a folder" → cancel; deny; a remote image → Load → the status line reads "Network used". *5 min*
6. **III-6** — Tab through the app page: every control's boundary and focus ring visible. *5 min*
7. **I-4 + I-5** — the toolbar icon in Chrome's light and dark themes; the system fonts by eye on the tab reader. *4 min*
8. **I-1 (toggle-flip case)** — after step 4, restart with `-Keep`: the guide does not reopen. *2 min*

**B · EDGE and BRAVE** (`-Browser edge`, `-Browser brave`) · ~10 min
9. **8.1b on Edge** — dark link hover (E4 did not check it). *2 min*
   - *Measured by CC, 2026-11-10, Edge 157.0.4341.42 (build `bdcc418`, rebuilt); human not walked.* Driven over CDP
     (the launcher's Edge flags plus `--remote-debugging-port`); pass bar and arithmetic as
     `linkHoverContrast.browser.test.ts` (WCAG 4.5:1, `helpers/contrast.ts`'s backdrop walk). **Finding:**
     `docs/store/assets/sample.md` has **no link**, so nothing there can be hovered; measured on a scratch copy
     outside the repo, `D:\Dev\walk-scratch\edge-b9\sample-with-link.md` (sample.md plus the test's line "Read the
     [rollout plan](https://example.invalid/plan) before Friday."). Reader set to Dark with its own Theme button.
     (a) **tab reader, `file://`:** hovered `color` rgb(25, 21, 4) on `background-color` rgb(255, 216, 77) — `#191504`
     on `#ffd84d`, **13.2:1** (at rest `#eaebf3` on `#12141c`, 15.47:1). (b) **app page**, folder opened through the
     `__peekoverHarness` seam with an OPFS copy of the same file (no native picker): the same values, **13.2:1** (rest
     15.47:1). Both above the bar. Shots: `D:\Dev\peekover-shots\8.1\edge\b9a-tab-reader-dark-hovered.png`,
     `b9b-app-page-dark-hovered.png`.
10. **I-1 / I-2 / I-4 on Edge** — restart with `-Keep`: no second guide; `edge://extensions` label; the icon. *4 min*
   - *Measured by CC, 2026-11-10, Edge 157.0.4341.42; human not walked.* Shots in `D:\Dev\peekover-shots\8.1\edge\`.
     **(a) Details page** (`edge://extensions/?id=ghadahcfacdjcapbfgmadjoknbkmjedf`): the toggle reads **"Allow access
     to file URLs"**. Edge HAS a site-access section like Chrome 157's: heading **"Site access"**, text "This extension
     can read and change your data on sites you open. Control how this extension can access your data on sites from
     the below settings. Learn more", a switch **"Automatically allow access on the following sites"**, and rows
     `file:///*`, `https://bitbucket.org/*`, `https://gist.githubusercontent.com/*`, `https://gitlab.com/*`,
     `https://raw.githubusercontent.com/*`. While the main switch is on, every row is on and **disabled** (greyed);
     with it off, the rows are off and editable. (`b10a-edge-extensions-details.png`)
     **(b) The guide per state** (each read from the guide tab, plus a `file://` sample.md):
     1. site on + file URLs on → `data-access="on"`, "…'Allow access to file URLs' is on…", steps hidden, web line
        "…shown with no setup."; `file://` **renders**.
     2. site on + file URLs **off** → `off`, "Peekover can't read files on your computer yet: 'Allow access to file
        URLs' is off."; steps 1 / 2 / 3, and step 2 shows BOTH "Turn on 'Allow access to file URLs'." AND "Under site
        access, turn on file:///* (in Chrome: 'Automatically allow access on the following sites')."; web line "no
        setup"; `file://` **plain text**. **Finding:** site access was ON here, yet the guide asks to turn it on —
        with the file-URL toggle off, `permissions.contains(file:///*)` reads false, so this state paints the same as
        "both off" (8.1f's approved "both off" copy).
     3. site **off** + file URLs off → as 2, and the web line becomes "…its site access for at least one of them is
        turned off…"; `file://` **plain text**.
     4. site off + file URLs **on** (on the way back) → `blocked`, "…its site access for file:///* is turned off.",
        step 2 the site step only; `file://` **plain text**.
     5. then only the `file:///*` row turned on (main switch still off), as the guide's step says → `on`; `file://`
        **renders** (web line stays "site access off" — the hosts were still off).
     6. restored: main switch on, file URLs on → `on`, "no setup"; `file://` **renders**. Both restored to ON.
     Flipping "Allow access to file URLs" reloaded Peekover (the open guide and app tabs closed); the extension's pages
     and `file://` worked straight after each flip — **no browser restart needed** on Edge 157. The step-2 label in
     quotes matches Edge's word for word. Shots `b10b-*.png`.
     **(c) "Open Peekover's details"** (clicked in state 2): opens a new tab at
     **`edge://extensions/?id=ghadahcfacdjcapbfgmadjoknbkmjedf`**, Peekover's Details page; the failure note stayed
     hidden (`b10c-open-details-result.png`). Navigating to `chrome://extensions` loads `edge://extensions/` (over CDP,
     not typed into the address bar; `b10c-typed-chrome-extensions.png`).
     **(d) Toolbar icon:** Peekover pinned (written to the profile's `extensions.pinned_extensions`, as Edge's menus
     are out of reach), Edge "Overall appearance" Light, then Dark (put back to System after):
     `b10d-edge-light-toolbar.png` / `-window.png`, `b10d-edge-dark-toolbar.png` / `-window.png`. Not judged.
     **(e) Restart with `-Keep`:** **Finding:** with Developer mode **off** (the launcher's state), the relaunch
     DISABLES Peekover — Details reads "To use this extension, turn on developer mode.", the on/off switch off and
     greyed, `Secure Preferences` `disable_reasons: [16777216]` (1<<24); no guide, and `file://` stays plain text
     (reproduced on a second fresh profile, `b10e-extensions-after-keep-relaunch.png`). So "no second guide" proves
     nothing in that state. With Developer mode **on**, Peekover re-enabled itself (no guide opened); a `-Keep`
     relaunch then kept it enabled, `file://` rendered, and **the guide did not reopen**. Why: not a fresh install —
     across launches `first_install_time` stayed `13438778644822829` while `last_update_time` moved each launch
     (location 8, command line), and the IndexedDB folder survived; Edge re-loads the existing install. The guide's
     IndexedDB mark (6.2a) would also hold it shut; from outside the two cannot be told apart.
     **Also seen:** Edge signed the fresh throwaway profile into the machine's Microsoft account by itself (a
     sync-confirmation page, the account's avatar, the synced favorites bar on new tabs) — the launcher profile is not
     isolated from the account.
     *8.1g (2026-11-10; `decisions.md`, "M13 TASK 8.1g"):* **for the walk: on Edge, turn on Developer mode on
     `edge://extensions` before closing if you will relaunch with `-Keep`** (re-measured on a fresh profile: launch 2
     sets `disable_reasons` 1<<24). Edge's sign-in: no launch flag stops it (5 arms measured, all signed in); the
     launcher says so and does not set the machine-wide `BrowserSignin` policy. The four `b10d-*` shots showed the
     account's avatar: now `b10d-*-cropped.png` (originals in `_originals-with-account\`, to delete). Step 2's
     wording for the toggle-off case is fixed (the guide now says "If site access for file:///* is off, turn it on too").
11. **I-1 / I-2 / I-4 on Brave** — the same three (not walked at all), or accept Chrome + Edge for it by name. *4 min*
   - *8.1g, measured by CC 2026-11-10, Brave 1.99.55 (Chromium 157), headless, fresh profile:* unlike Edge, a `-Keep`
     relaunch with Developer mode off does **not** disable the command-line-loaded Peekover (no disable reason after
     launch 2). Brave needs no Developer-mode step.

**C · FIREFOX — the CURRENT build as a temporary add-on** (`-Browser firefox` → Load Temporary Add-on →
`.output\firefox-mv3\manifest.json`) · ~30 min. *A temporary add-on is removed when Firefox closes, so the
guide-once-across-restarts check stays the signed 0.0.9's (done).*
12. **9.2b guide** — the guide opens on load: with the setting OFF it says so and shows the four steps; then
    about:addons → Peekover → Permissions and data → turn on "Access local files on your computer"; back to the guide:
    it says "is on". *5 min* (Whether about:addons shows that toggle for a TEMPORARY add-on is not measured; if it
    does not, note it and judge the guide's off state only.)
13. **I-3 + surfaces 34–36 on Firefox** — `file://` sample.md with the setting on, light and dark: the reader, the
    contents list, scrolling; **8.1c**: the "Watching isn't available…" note below the last line; **8.1b**: dark link
    hover. *8 min*
   - *The human's C13 finding → HUMAN COPY APPROVAL 2026-11-10 (move the note back under Theme, new words) → 8.1h,
     STOPPED (under Theme it covers text at every width, measured) → HUMAN RULING option A → 8.1h landed: the short
     wording as a quiet footnote after the last line, its text on the paragraphs' left edge (8.1c's had ignored the
     contents rail), no box. Shots `D:\Dev\peekover-shots\8.1\firefox\8.1h-{before,after}-file-bottom-{light,dark}.png`.
     Re-check: the Firefox `file://` tab and a raw GitHub file, scrolled to the end.*
14. **I-11 + 9.3b + 9.3a** — drag a folder onto the app page: read the note ("…Watch isn't offered for a picked folder —
    drag it in instead. Watching still works here…"); open a file, press Watch, save in your editor at once: the
    change shows within ~1 s. Then "Open a folder" (the picker): read both notes (9.3c). *8 min*
   - *The human's C14 finding → 8.1g (landed): the drag note now reads "Firefox shows this folder as it was when you
     dragged it in. To see new or removed files, drag it in again. Watching works here." — verified on Firefox
     159.0.1 with the built extension (a real Gecko drag session; shots `D:\Dev\peekover-shots\8.1\firefox\8.1g-*`).
     Re-check: drag, add / remove a file on disk, drag the same folder in again.*
15. **8.1a on Firefox** — Export → open → print preview: every page. *4 min*
16. **I-4 on Firefox** — the toolbar icon, light and dark browser theme. *2 min*

**D · THE SCREENSHOTS** (`D:\Dev\peekover-shots\8.1\`, the `side-…` pair where it exists) · ~75 min
17. **The 19 surfaces the notes did not cover — Chromium, light and dark** (table rows 2, 3, 6–12, 15, 17, 18, 20,
    22, 23, 27, 30–32): one verdict each, exceptions only where a cell differs. *~2 min each, ~40 min*
18. **The Firefox side of every surface** (36; the setup guide and section 5 were judged live in C): Firefox draws
    the same frames, so most are a quick compare. *~1 min each, ~30 min*
19. **II-2, II-3, II-4, II-9, II-10 (app page TOC), and the open halves of II-1, II-5, II-7, II-8** — one line each;
    several are "accept by name". *~15 min* (II-6 judged fine in the notes.)
   - *17–19: captured by CC 2026-11-10, Chrome 157.0.8103.39 and Firefox 159.0.1 (build `6888a98`, both engines
     rebuilt there); awaiting the human's verdicts.* **Open the contact sheet: `D:\Dev\peekover-shots\8.1\D\index.html`**
     — one row per surface (the table's ruling / exceptions / notes and the items II text that names it), Chromium and
     Firefox × light and dark side by side, click to enlarge. Shots `D:\Dev\peekover-shots\8.1\D\<engine>\<surface>-
     <theme>[-414|-1080].png`: all 36 surfaces on BOTH engines (so item 17's 19 are there, and item 18's 36), at 1280
     and 414, plus 1080 for `reading`, `toc-open` and the two tab-reader states (II-9 / II-10), plus two states for
     item 19: `recent-list` (II-4: three harness opens of one folder, then the page with no folder) and
     `long-code-expanded` (II-5: "Show full code" pressed). 156 captured per engine; 4 n/a per engine (`more-menu`
     and `files-overlay` do not exist at 1280); none failed. Tooling: `scripts/walk-shots.ts --walk-d` (Chrome is the
     installed Chrome, the build loaded unpacked over CDP; Firefox the build as a temporary add-on),
     `scripts/walk-probe.ts`, `scripts/walk-sheet.ts`. Content: `docs/store/assets/sample.md` as is, and a scratch copy
     outside the repo (`…\D\_fixtures\rollout-notes.md`: plus a link, a remote image at `example.invalid`, a 60-line
     code block). Every guide shot's own `data-access` was read back and matches its state (on / off).
   - **Seen while capturing (not verdicts):** (a) Firefox: about:addons DOES show "Access local files on your
     computer" for a temporary add-on (item 12's open question); turning it on made
     `extension.isAllowedFileSchemeAccess()` read true and `file://` render. (b) Chrome 157, unpacked load: flipping
     "Allow access to file URLs" with Developer mode OFF reloads Peekover and leaves it switched **Off** (a relaunch
     keeps it off) — as Edge's B10 (e); with Developer mode on, the guide reads "off" at once, no restart. (c) The
     contents card's open state is a saved setting: a click in one state carries into later ones (at 1280 a click
     CLOSES the rail); the capture opens it only when closed and puts it back after.
   - **CC flags (measured, not judged; each with its shots on the sheet):** (1) the collapsed long code block clips
     its longest line at the right with no sideways scroll (`long-code`, `remote-media`; both engines; expanded it
     scrolls) — II-5; (2) app page at 414, the collapsed "On this page" opener floats over the code toolbar's Wrap /
     Copy, the table's Clear / Copy CSV, or a line of text (`code-blocks`, `math`, `table-tools`, `table-filtered`)
     — II-10; (3) Raw view at 1280 (Chromium), the contents rail card overlaps the raw block's right edge (`raw`);
     (4) tab reader at rest, 414 (Chromium), the "Theme: Auto" pill over the "Phases" heading (`tab-reader`) — II-9;
     (5) tab reader at rest with the contents card open, 1080 and 414, the Watch / Theme pills over the table's
     "Filter" label and header (`tab-reader-contents-open`) — II-9; (6) dark theme, the editor's active-line gutter
     cell paints CodeMirror's default light `#e2f2ff` (nothing in `src/` styles `.cm-activeLineGutter`; the numbers
     on it are E-4) (`editing`, `editing-unsaved`, `editor-search`). Nine more measured groups are listed on the
     sheet as explained by their state or a named acceptance (open menus / panels, the Files overlay, E-4 / R12,
     the 5.6 mid-scroll ruling, Chromium-only controls, Recent-list rows). No sideways page scroll and no text drawn
     through text anywhere.
   - **Not captured (a real OS dialog, the browser's own UI, or the network):** "Open a folder" (the OS picker, its
     Cancel, a denied permission — I-7); Firefox's real folder routes, the file picker and a folder drag (I-11; the
     Firefox folder / watch cells are the harness state); Export's Save dialog, the downloaded file and its print
     preview (I-9 — the Export panel IS captured); print preview of either reader; Copy as … pasted into another
     program; "Network used" after Load (I-7, needs a real request); a raw GitHub / GitLab / Bitbucket page (I-6);
     chrome://extensions and about:addons themselves and the toolbar icon (I-1, I-2, I-4); the guide across a restart
     and a store install's toggle default (I-1, I-2); the render-failure banner (I-8); fonts without the design
     faces or on macOS (I-5).
   - **THE HUMAN'S VERDICTS, 2026-11-10 (walk D, from the contact sheet):** surfaces **5, 6, 7, 17, 25, 29 = fix**;
     every other surface **ok** — recorded per surface in the scoring table below as **matches**, or **differs by
     ruling** where the sheet's row named one (3: 5.5; 14: C130; 36: 5.6; 6's 1280 cell: C061; 8 / 9's n/a cells).
     **CC flags 1–6 → fix** (approved by the same message). All of it is **task 8.1i** (`tasks.md`; `decisions.md`,
     "M13 TASK 8.1i"): (a) the narrow opener / contents sheet (5, 6, 17, flag 2), (b) the Raw view's box (7, flag 3),
     (c) the lightbox at narrow widths (25), (d) the editor at 414 (29), (e) the collapsed code block scrolls (flag 1,
     II-5), (f) the tab reader's pills at rest (flags 4, 5, II-9), (g) the editor's active-line cell (flag 6).
     **Landed:** (b), (c), (e). **Built, held for the human's look and a byte ruling** (local branch
     `local/8.1i-approval`, not pushed): (a) + (d), (f), (g). Before / after shots on the same sheet. The human's
     surface-29 request, "Full page mode for Read / Edit / Raw", is carried POST-RELEASE (`progress.md`). **Items
     II-1 … II-10 (item 19) have no verdict from this message** — they stay open, except where the table notes them.
   - **A walk-D capture gap (found at 8.1i's re-capture):** the **Firefox** `tab-reader-reading` cells of walk D never
     scrolled — the script's smooth `scrollIntoView` did not move Firefox's reader, so they show the page AT REST, not
     mid-scroll (Chromium's were mid-scroll). Surface 36's Firefox cells were therefore judged on an at-rest frame; the
     after-8.1i cells on the sheet are mid-scroll (the script now scrolls the reader's own box and checks it moved).

**E · CONTRAST AND THE LISTS** · ~10 min
20. **III-1 … III-5** — accept by name or fix, judged on the shots you have just walked. *~6 min*
21. **IV-1 / IV-2** — both EMPTY at HEAD (the census and the native-control sweep run green on both engines,
    2026-11-10): confirm. *1 min*
22. **I-8** (the render-failure banner: accept as tested-only) and **I-10** (CI and the dry run: confirm, or re-run the
    Release workflow with dry_run). *2–5 min*

## The 8.1 items (consolidated)

Each item: what to look at → what "good" looks like → record. Items I are live only.

### I · Live checks (no screenshot substitute)

| # | Look at | Good looks like | Verdict | Notes |
| --- | --- | --- | --- | --- |
| I-1 | **Install and the setup guide, per browser** (Chrome by Load unpacked; Edge, Brave from the launcher; Firefox signed): does the guide open once on install, and not again after a browser restart (`-Keep`) or a toggle flip? | Opens exactly once. (Chromium unpacked loads re-install on every launch of `--load-extension` — judge "once" on Chrome's Load unpacked + restart, and on the signed Firefox.) | walked (notes): Chrome OK; Edge, Firefox (signed) partly | Chrome: opens once (1), stays closed after a restart with `-Keep` (15). Edge: opens (E1); restart not noted. Firefox signed 0.0.9: once, and not again across restarts (AMO step 11 + the human). **Not walked:** Brave; the toggle-flip case; the CURRENT build's Firefox guide (9.2b). **Edge — measured by CC, 2026-11-10, Edge 157.0.4341.42; human not walked** (checklist item 10 (e)): the guide opened on a fresh launcher install; after a `-Keep` restart with Developer mode OFF, Edge **disabled** Peekover ("To use this extension, turn on developer mode.") — no guide, no rendering; with Developer mode ON, a `-Keep` restart kept it enabled and the guide did not reopen (Edge re-loads the existing install: `first_install_time` unchanged). Flipping the file-URL toggle reloaded Peekover and opened no guide. Shot `D:\Dev\peekover-shots\8.1\edge\b10e-extensions-after-keep-relaunch.png`. |
| I-2 | **The file-URL toggle in each Chromium browser** (Chrome, Edge, Brave): its label as the browser shows it; typing `chrome://extensions` (or `edge://`, `brave://`); "Open Peekover's details" opening the Details page; flip off → on with the guide open: does the guide update on focus; does Peekover need a restart after? | Each step's words match what the browser shows; the guide's state follows the toggle; record what the flip did. **The default (off on a store install) is not checkable before go-live** (prep finding). | walked (notes): partly | Only the "on" state, Chrome (1) and Edge (E1). **Not walked:** the label in each browser, typing `chrome://extensions` / `edge://`, "Open Peekover's details", flip off → on with the guide open, Brave. **2026-11-10, Chrome (kept profile): FIX → 8.1f (landed):** the human turned access off and the `file://` tab went plain text while the guide still said "on" — the setting off was SITE ACCESS ("Automatically allow access on the following sites"), the file-URL toggle stayed on; the guide now checks both (`decisions.md`, "M13 TASK 8.1f"). Re-check the guide, then the flip off → on. **Edge — measured by CC, 2026-11-10, Edge 157.0.4341.42; human not walked** (checklist item 10 (a)–(c)): the label is "Allow access to file URLs"; Edge has the same site-access switch, "Automatically allow access on the following sites", with per-site rows. The guide followed each state (on / off / blocked / on), and `file://` rendered only when both allowed it; no browser restart needed after a flip. "Open Peekover's details" opened `edge://extensions/?id=ghadahcfacdjcapbfgmadjoknbkmjedf`; `chrome://extensions` loads `edge://extensions/`. **Finding:** with only the file-URL toggle off, step 2 also asks to turn on site access, which is already on. **→ 8.1g (landed):** that line is now conditional, "If site access for file:///* is off, turn it on too (…)". Shots `D:\Dev\peekover-shots\8.1\edge\b10a-*.png`, `b10b-*.png`, `b10c-*.png`. |
| I-3 | **Firefox `file://` (§9-6)** on the SIGNED unlisted install, fresh profile: open a local `.md` by `file://` directly (not the app page). Also look in about:addons → Peekover → Permissions. | It renders with no setup. If Firefox asks for access, or it stays plain text → a discovered task (detection or instructions, no new permission — or STOP if a permission would be needed). This decides ledger rows 26 / 296 / 304 and the Firefox listing's "not yet been checked" line (9.2). | fix — 9.2b (landed) | Signed 0.0.9: `file://` stayed plain text until "Access local files on your computer" was turned on → 9.2b (the guide's Firefox branch, floor 153). **Re-check on the current build:** the guide's Firefox section, then a `file://` .md with the setting on. |
| I-4 | **The toolbar icon** in Chrome, Edge, Brave and Firefox, with the browser's own light and dark themes. | Crisp at toolbar size; legible on both. | | **Edge — shots by CC, 2026-11-10, Edge 157.0.4341.42; human not walked; not judged:** Peekover pinned, Edge appearance Light and Dark — `D:\Dev\peekover-shots\8.1\edge\b10d-edge-light-toolbar.png`, `b10d-edge-dark-toolbar.png` (whole windows: `…-window.png`). |
| I-5 | **System font stacks by eye** on the tab reader (content script) on Windows — and macOS if available (D-3); once on a machine WITHOUT the design faces installed (CI's case: the chrome draws in the system face). Code draws Consolas on Windows (5.10, R1 — the human chose to proceed). | Reads as designed in the system face; nothing falls back to a serif or to Courier. | | |
| I-6 | **The tab reader on a raw GitHub / GitLab / Bitbucket file** (a real network page — your choice of file). | Same reader as on `file://`; the network indicator and "Network used" read true. | fix | The human's walk "item 13", two findings: (1) dark theme, a hovered link's text is unreadable — FIXED as 8.1b (`decisions.md` "M13 TASK 8.1b"; every link, both reader surfaces); (2) on a raw web file the "Peekover watches local files…" note sits over the text at bottom-left — FIXED as 8.1c (`decisions.md` "M13 TASK 8.1c": OPTION A, the note is an aside after the document; see II-9). **Walk notes:** 8.1b and 8.1c landed. **Not noted:** the network indicator and "Network used" on the raw page; dark link hover on Edge (E4). |
| I-7 | **The folder picker and the denied state**: "Open a folder" (the OS dialog), cancel it, deny it. **Network used**: load a remote image with "Load" and read the status line ("Network used", no count — 4.7 ruling). | Each state is the restyled one (5.5); the status line changes from "No network calls" to "Network used". | walked (notes): partly | Chrome: "Open a folder", the listing, a file opened (6). **Not walked:** cancel, deny, "Network used" after Load on a remote image. |
| I-8 | **The render-failure banner** — reachable only by a document that breaks the renderer; none is known. | Accept by name as tested-only (the fallback tests), or name a document that triggers it. | | |
| I-9 | **The reader's own untouched surfaces** in both themes (WORKFLOW §7.4) — anything the screenshots do not reach: print preview (Ctrl+P on the tab reader), the Export download, Copy as … menus. | Nothing unstyled or broken. | fix | The exported HTML "gets cut off at the middle" (the human). → **8.1a, landed 2026-11-10:** the export wrote `@mediaprint` / `@mediascreen …` (no space), so its print rule was dropped and the file printed one page; fixed in `htmlExport.ts` (Copy as HTML shares it; the app page's own PDF never used it). "A light export comes out dark" did not reproduce — a light export paints light paper (tested); two `body{}` token blocks appear only in a dark export, dark last. Re-check: export, open, print. → **8.1d, landed 2026-11-10 (the human's re-check of 8.1a):** the file showed one screen and would not scroll (the body carried the reader's `position:fixed`); the display-math source showed above its formula (the hide rule was in the math sheet, not exported); every control shipped. Fixed in `htmlExport.ts`: a static body, the math sheet with math, the controls stripped (header text and checklist kept). Copy as HTML shares it; Copy as rich text still carried the controls → **8.1e, landed 2026-11-10:** the strip runs where every exit takes its clone; rich text pastes no control labels, headers and every row kept. Re-check: export, open, scroll to the bottom, Ctrl+P. **Walk notes:** print preview OK on Edge (E4); Export → 8.1a. **Not walked:** Copy as … menus; the 8.1a re-check (export + print) on both engines. |
| I-10 | **Release dry run and CI (G-9; Q6)** — already run: Release 42171130695 and 42171186611 on `14c274f` (build green; attest and release skipped; artifacts complete; `sha256sum -c` OK); the first CI on `main` (1.1); CI 42217671355 and Supply chain 42217671570 green on `67ce7b9`. | "as expected" — or a discovered task. | | |
| I-11 | **Firefox's two folder routes on the app page** (the shots cannot show them): (a) "Open a folder" → the file picker → the read-only snapshot, its note, Watch unavailable with its note; (b) drag the folder onto the page → the pane, Watch → the one-time notice → Watching → edit the file on disk → Compare → a snapshot → the diff view. | Each state restyled as in Chromium; the notes read true. | fix | The human, 2026-11-10, Firefox 159, the AMO-signed 0.0.9: (a) "Open a folder" → sample.md edited in Notepad and saved → clicking the file again showed the edit ("picker: fresh"); (b) drag: Watch updated after a save ("works as tested"). The picker-route texts that said "frozen" were re-worded with the human's approval — FIXED as 9.3c (`decisions.md`, "M13 TASK 9.3c"); Watch for a picked folder is carried past 0.1.0. **Walk notes:** signed 0.0.9: picker fresh, drag Watch updated. **Not walked:** the CURRENT build (9.3a timing, 9.3b drag note, 9.3c picker notes). |

### II · Things the screenshots show that need a judgement, not a pixel match

| # | Look at | Good looks like | Verdict | Notes |
| --- | --- | --- | --- | --- |
| II-1 | **3.1 named check** — Editing (Read / Edit / Raw while editing), the Watching pill, the one-time snapshot notice, the Compare picker, the Files overlay — WORKING, both engines, both themes (surfaces `editing`, `watching`, `watch-first-notice`, `compare-picker`, `files-overlay`). | Each matches the approved mock frame or a named ruling. | walked (notes): partly | Chrome: Editing (10), the Watching pill (10), Compare (11). **Not walked:** the one-time snapshot notice, the Files overlay; Firefox. |
| II-2 | The **compact toolbar** (≤ 863 px, "⋯") at 414 (`more-menu`); the **agent file at 1280** two-row toolbar (`agent-file`, C061). | At most two rows; "⋯" holds Theme, Code theme, Stored data, Export, Setup guide. | | |
| II-3 | The **no-folder state** (`no-folder`, `no-folder-pinned`): the mock's ink-primary "Open a folder" in the toolbar vs 5.5's body card ("Mock + uniform" ruling). | The ruling's layout; record matches / differs by ruling / fix. | | |
| II-4 | The **Recent list** repeating the same file (prep finding). | Decide: expected, or a fix. | | |
| II-5 | **Code**: the Peekover theme (constants colour on `const` names; the synthesised italic); "Show full code" (kept its 009 look); the in-flow code toolbar vs the mock's floating copy button (`code-blocks`, `long-code`). | As 5.8 / 5.3 built and the mock's colours. | walked (notes): partly | Chrome: code line numbers, wrap, copy, the code theme (12) OK. **Not walked:** "Show full code" (long-code), the constants colour / italic by eye; Firefox. |
| II-6 | **Diff view** (`diff-view`): added text told from unchanged by fill alone (removed also has line-through) — is a non-colour marker needed (WCAG 1.4.1)? And the plainer document style inside the diff (prep finding). | Decide: accept, or a fix. | walked (notes): judged fine | Chrome 11: "the diff view judged fine". Firefox not walked. |
| II-7 | **Panels and dialogs** (`stored-data-panel`, `export-panel`, `code-theme-panel`, `unsaved-guard`, `diagram-lightbox`): the dark scrims; the lightbox's card; popover radius 12 (mock) vs `.panelbox` 14; the mock's `.go` size vs the primaries' 11.5 px. | Matches, or the difference accepted by name. | walked (notes): partly | Chrome: Stored data (14), the code-theme panel and the diagram lightbox (12). **Not walked:** the Export panel, the unsaved-changes dialog; the scrims / radius / `.go` size questions; Firefox. |
| II-8 | **The editor** (`editing`, `editing-unsaved`, `editor-search`): the save bar sits inside the split's border (the mock draws it above); Save has no hover change and no disabled state — FLAGGED at 5.7, never ruled; the search panel's CodeMirror-default controls (prep finding). | Accept each by name, or a fix. | walked (notes): partly | Chrome 10: edit and save OK. **Not ruled:** the save bar inside the split, Save's hover / disabled state, the search panel's controls. |
| II-9 | **The tab reader's floating pills** at 1080 and 414 (`tab-reader-reading`): the bottom-left stack floats over body text mid-scroll ("no chrome over text" ruled AT REST, 5.6); the contents button sits 17 px lower while the card is open (73 vs 52). | Matches the ruling, or a fix. | | |
| II-10 | **TOC** (`toc-open`, `short-document`): open card, rows, the "here" highlighter; at narrow widths the collapsed opener over the text's top-right (at 414 it spans 252 → 374, text to 358); the short-document card. | As 5.2 / 5.2a built. | walked (notes): partly | Chrome 3: the TAB READER's TOC jumps and highlights the current section. **Not walked:** the app page's TOC (`toc-open`, `short-document`) and the narrow-width opener. |

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

Every surface below has its verdict, and every per-cell exception its own (HUMAN RULING 2026-11-10: one verdict per
surface); engines and viewports recorded; every "fix" a numbered task (8.1a …); Golden EMPTY; `permissions: []`.

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

Shots root: **`D:\Dev\peekover-shots\8.1\`** (captured at `67ce7b9`). **One verdict per surface** (HUMAN RULING
2026-11-10, walk prep): **Verdict** covers every cell of the surface (light / dark × Chromium / Firefox × 1440 /
1280 / 1080 / 414) unless a cell is named in **Per-cell exceptions**, which carries that cell's own verdict or
pre-fill. **Ruling / proposed** keeps the prep's "proposed: …" (yours to confirm or overwrite). "walked: OK (notes)"
is pre-filled ONLY where the human's walk notes clearly cover the surface, and only for the engine they cover
(Chromium: Chrome, and Edge where named); the rest of the surface still needs a look.

| # | Surface (shots folder) | Verdict | Ruling / proposed | Per-cell exceptions | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `1-install/setup-guide` | **matches** (the human, walk D 2026-11-10) — the "proposed: differs by ruling?" here was "not a ruling" (an unpacked install starts ON) · *was: walked: OK (notes) — Chromium* | proposed: differs by ruling? — not a ruling: an unpacked (--load-extension) install starts with "Allow access to file URLs" ON; a store install starts OFF (see the off shot) | Firefox, light and dark, every width: (no pre-fill) | Notes: Chrome 1 ("Allow access to file URLs is on" — expected for an unpacked install), Edge E1. Firefox shots STALE: taken before 9.2b (the old "nothing needs setting up" copy) — judge live on the current build. |
| 2 | `1-install/setup-guide-file-access-off` | **matches** (the human, walk D 2026-11-10) |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: (was "n/a — Firefox has no file-URL toggle"; FALSE since 9.2b — see Notes) | the prep's Firefox "n/a — Firefox has no file-URL toggle" is FALSE since 9.2b (Firefox 153+ has "Access local files on your computer"): judge the Firefox off state live on the current build. |
| 3 | `3-app-chrome/no-folder` | **differs by ruling** — 5.5 "Mock + uniform" (the human, walk D 2026-11-10) | proposed: differs by ruling — 5.5 "Mock + uniform": the ink-primary "Open a folder" sits in the centred setup card, not the toolbar (decisions.md 2026-11-05, M13 TASK 5.5) |  | Not covered: Chrome 6 passed through it to open a folder; the state itself not judged. |
| 4 | `3-app-chrome/folder-granted` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | Notes: Chrome 6. |
| 5 | `3-app-chrome/reading` | **fix** (the human, walk D 2026-11-10) → **8.1i (a)** (the narrow opener / contents sheet) and **(d)** (the editor at 414) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 6, 7. |
| 6 | `3-app-chrome/agent-file` | **fix** (the human, walk D 2026-11-10) → **8.1i (a)**; 1280: **differs by ruling** — C061 |  | Chromium and Firefox, light and dark, 1440 / 1080 / 414: (no pre-fill)<br>Chromium and Firefox, light and dark, 1280: proposed: differs by ruling — C061: an agent file wraps to a second toolbar row between 864 and ~1290 px (decisions.md 2026-11-03, "M13 RULING — C061 at 1280") |  |
| 7 | `3-app-chrome/raw` | **fix** (the human, walk D 2026-11-10) → **8.1i (b)** (the raw block takes the column's box) |  |  | Not covered: Chrome 5 used the TAB READER's Raw toggle, not the app page's Raw view. |
| 8 | `3-app-chrome/more-menu` | **matches** (the human, walk D 2026-11-10); 1440 / 1280 / 1080: **n/a** |  | Chromium and Firefox, light and dark, 414: (no pre-fill)<br>Chromium and Firefox, light and dark, 1440 / 1280 / 1080: proposed: n/a — no "⋯" above 863 px — the app controls are in the toolbar |  |
| 9 | `3-app-chrome/files-overlay` | **matches** (the human, walk D 2026-11-10); 1440 / 1280: **n/a** |  | Chromium and Firefox, light and dark, 1080 / 414: (no pre-fill)<br>Chromium and Firefox, light and dark, 1440 / 1280: proposed: n/a — no Files overlay above 1189 px — the pane stays in the row |  |
| 10 | `3-app-chrome/folder-search` | **matches** (the human, walk D 2026-11-10) |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing |  |
| 11 | `3-app-chrome/folder-empty` | **matches** (the human, walk D 2026-11-10) |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing |  |
| 12 | `3-app-chrome/watch-first-notice` | **matches** (the human, walk D 2026-11-10) |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | Not covered: Chrome 10 pressed Watch; the one-time notice itself not judged. |
| 13 | `3-app-chrome/watching` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | Notes: Chrome 10 (the 9.3a Watch timing confirmed in real use). |
| 14 | `3-app-chrome/compare-picker` | **differs by ruling** — C130 (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* | proposed: differs by ruling — C130: Compare's status sits inside the dropdown while the picker is open (decisions.md 2026-11-03, "M13 RULING — C130") | Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | Notes: Chrome 11. |
| 15 | `3-app-chrome/remote-media` | **matches** (the human, walk D 2026-11-10) |  |  | CC flag 1 (the collapsed code block in the scratch copy) → fix, 8.1i (e). |
| 16 | `3-app-chrome/no-folder-pinned` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: harness route, not a Firefox route (prep finding): judge the folder/watch parts live (item I-11); the rest of the frame is the real Firefox drawing | Notes: Chrome 8 (pins and Recent after reopening). |
| 17 | `4-reader/toc-open` | **fix** (the human, walk D 2026-11-10) → **8.1i (a)** |  |  |  |
| 18 | `4-reader/short-document` | **matches** (the human, walk D 2026-11-10) |  |  |  |
| 19 | `4-reader/code-blocks` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 7, 12 (line numbers, wrap, copy); Edge E3. CC flag 2 (the 414 opener over Wrap / Copy) → fix, 8.1i (a). |
| 20 | `4-reader/long-code` | **matches** (the human, walk D 2026-11-10) |  |  | CC flag 1 (collapsed block clipped its longest line) → fix, 8.1i (e). |
| 21 | `4-reader/math` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 7; Edge E3. CC flag 2 → fix, 8.1i (a). |
| 22 | `4-reader/table-tools` | **matches** (the human, walk D 2026-11-10) |  |  | Not covered: Chrome 5 used the table filter and Copy CSV on the TAB READER, not the app page. CC flag 2 (the 414 opener over Clear / Copy CSV) → fix, 8.1i (a). |
| 23 | `4-reader/table-filtered` | **matches** (the human, walk D 2026-11-10) |  |  | Not covered: Chrome 5 (tab reader, not the app page). CC flag 2 → fix, 8.1i (a). |
| 24 | `4-reader/diagram` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 7, 12; Edge E3. |
| 25 | `4-reader/diagram-lightbox` | **fix** (the human, walk D 2026-11-10) → **8.1i (c)** (the lightbox at ≤ 863 px) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 12 (copy / download / lightbox). |
| 26 | `4-reader/stored-data-panel` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 14 (the list and Wipe all data). |
| 27 | `4-reader/export-panel` | **matches** (the human, walk D 2026-11-10) |  |  | Not covered: Chrome 9 judged the exported FILE (fix → 8.1a, landed), not the panel. |
| 28 | `4-reader/code-theme-panel` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 12 (code theme). |
| 29 | `4-reader/editing` | **fix** (the human, walk D 2026-11-10) → **8.1i (d)**; the human also asked for a "Full page mode for Read / Edit / Raw" — POST-RELEASE (progress.md) · *was: walked: OK (notes) — Chromium* | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here |  | Notes: Chrome 10 (edit, save, on a scratch copy). |
| 30 | `4-reader/editing-unsaved` | **matches** (the human, walk D 2026-11-10) | proposed: differs by ruling? — 5.7 deviations (1) the save bar inside the split (2) no disabled state (3) no hover change were FLAGGED, not ruled (decisions.md 2026-11-05, M13 TASK 5.7): judge them here |  | Not covered: Chrome 10 edited and saved; the unsaved state itself not judged. CC flag 6 (dark active-line gutter cell) → fix, 8.1i (g). The 5.7 deviations (II-8) are not ruled by this verdict. |
| 31 | `4-reader/unsaved-guard` | **matches** (the human, walk D 2026-11-10) |  |  |  |
| 32 | `4-reader/editor-search` | **matches** (the human, walk D 2026-11-10) |  |  | CC flag 6 → fix, 8.1i (g). |
| 33 | `4-reader/diff-view` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 11 ("the diff view judged fine"). |
| 34 | `5-tab-reader/tab-reader` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  | Chromium, light and dark, every width: (no pre-fill)<br>Firefox, light and dark, every width: not judgeable here — the Firefox shot is a TEMPORARY add-on; it showed the raw text (the content script did not run). Judge §9-6 on the signed unlisted install (item I-3) | Notes: Chrome 2, 4 (file://, both themes); Edge E2. Firefox: judge live on the current build with "Access local files on your computer" on (the shot is a temporary add-on showing plain text). CC flag 4 (the Theme pill over "Phases" at rest, 414) → fix, 8.1i (f). |
| 35 | `5-tab-reader/tab-reader-contents-open` | **matches** (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* |  |  | Notes: Chrome 3. Firefox shots show plain text (no file access at capture) — judge live. CC flag 5 (the pills over the table at rest, 1080 / 414) → fix, 8.1i (f). |
| 36 | `5-tab-reader/tab-reader-reading` | **differs by ruling** — 5.6 HUMAN RULING, mid-scroll overlap (the human, walk D 2026-11-10) · *was: walked: OK (notes) — Chromium* | proposed: differs by ruling — "no chrome over text" is read AT REST; mid-scroll floating pills overlap by design (decisions.md 2026-11-05, M13 TASK 5.6, HUMAN RULING) |  | Notes: Chrome 3 (the TOC highlights the current section while scrolling). Firefox shots show plain text (no file access at capture) — judge live. |

### Still to judge, per surface

**Superseded 2026-11-10 by the human's walk-D verdicts** (both engines, from the contact sheet — the scoring table
above holds one verdict per surface). The list below is kept as it stood before them.

Every surface needs **Firefox, light and dark** (the notes cover Chromium only). Judge from the shots unless
marked **LIVE** (the shot is stale or cannot show the state; use the current build). Widths come from the shots.

| # | Surface | Chromium (light + dark) | Firefox (light + dark) |
| --- | --- | --- | --- |
| 1 | `1-install/setup-guide` | walked (notes) | needed — LIVE |
| 2 | `1-install/setup-guide-file-access-off` | needed | needed — LIVE |
| 3 | `3-app-chrome/no-folder` | needed | needed |
| 4 | `3-app-chrome/folder-granted` | walked (notes) | needed |
| 5 | `3-app-chrome/reading` | walked (notes) | needed |
| 6 | `3-app-chrome/agent-file` | needed | needed |
| 7 | `3-app-chrome/raw` | needed | needed |
| 8 | `3-app-chrome/more-menu` | needed | needed |
| 9 | `3-app-chrome/files-overlay` | needed | needed |
| 10 | `3-app-chrome/folder-search` | needed | needed |
| 11 | `3-app-chrome/folder-empty` | needed | needed |
| 12 | `3-app-chrome/watch-first-notice` | needed | needed |
| 13 | `3-app-chrome/watching` | walked (notes) | needed |
| 14 | `3-app-chrome/compare-picker` | walked (notes) | needed |
| 15 | `3-app-chrome/remote-media` | needed | needed |
| 16 | `3-app-chrome/no-folder-pinned` | walked (notes) | needed |
| 17 | `4-reader/toc-open` | needed | needed |
| 18 | `4-reader/short-document` | needed | needed |
| 19 | `4-reader/code-blocks` | walked (notes) | needed |
| 20 | `4-reader/long-code` | needed | needed |
| 21 | `4-reader/math` | walked (notes) | needed |
| 22 | `4-reader/table-tools` | needed | needed |
| 23 | `4-reader/table-filtered` | needed | needed |
| 24 | `4-reader/diagram` | walked (notes) | needed |
| 25 | `4-reader/diagram-lightbox` | walked (notes) | needed |
| 26 | `4-reader/stored-data-panel` | walked (notes) | needed |
| 27 | `4-reader/export-panel` | needed | needed |
| 28 | `4-reader/code-theme-panel` | walked (notes) | needed |
| 29 | `4-reader/editing` | walked (notes) | needed |
| 30 | `4-reader/editing-unsaved` | needed | needed |
| 31 | `4-reader/unsaved-guard` | needed | needed |
| 32 | `4-reader/editor-search` | needed | needed |
| 33 | `4-reader/diff-view` | walked (notes) | needed |
| 34 | `5-tab-reader/tab-reader` | walked (notes) | needed — LIVE |
| 35 | `5-tab-reader/tab-reader-contents-open` | walked (notes) | needed — LIVE |
| 36 | `5-tab-reader/tab-reader-reading` | walked (notes) | needed — LIVE |
