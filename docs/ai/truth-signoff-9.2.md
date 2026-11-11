# 9.2 truth sign-off — the reading pack

*Prepared 2026-11-11 at `fc02f4d` (M13 task 9.2, agent prep only). **No verdict is recorded here.** Your words go in
`docs/ai/decisions.md` as a HUMAN RULING, in the commit that acts on them. Sentences are quoted verbatim from
`docs/store/claims.md` (the ledger), except P1–P5 and the Firefox note, which are quoted from their files.*

## Totals

- **Rows needing your look: 93 entries**, covering **137 ledger rows** plus 6 passages outside the ledger
  (PERMISSIONS.md P1–P5 and one unpublished Firefox note). Where several rows make the same claim they share an entry,
  e.g. "138 (+ 71, 136, 137, 154)", and one verdict covers them all.
- **Auto-pinned: 364 rows**, counted per surface below and not listed: backed by a test, a code path or a record, and unchanged since you
  last saw them. 66 of these are headings or labels that make no claim.
- **Flagged: 56 entries** (the CC flag column is not "—").
- **Not in this pack:** 58 withdrawn rows on these surfaces (not published); REPRODUCING (22 rows) and
  SOURCE_CODE_REVIEW (11 rows), which are outside 9.2's read list and were checked sentence by sentence by the
  agent at the 9.2 prep; in-app notes (the drag and picker notes), which are "checked, not ledgered" by your 9.2 ruling and
  belong to the walk.
- **Your time: about 60–75 minutes**, best as two sittings: batches 1–5b (the store and install path, ~40 min), then 6–11
  (~30 min). A plain row takes ~20 s; a flagged one ~1–2 min. That replaces the "second look" column of
  `final-review.md` §3. The top-to-bottom read of each text that 9.2 asks for is extra, ~5 min per text if you do it.

| Surface | Published rows | Need a look | Auto-pinned (of which labels) | Withdrawn |
|---|---:|---:|---:|---:|
| Chrome listing | 41 | 13 | 28 (0) | 0 |
| Firefox listing | 36 | 12 | 24 (0) | 0 |
| Edge listing | 41 | 12 | 29 (0) | 0 |
| PRIVACY.md (+ site privacy page) | 35 | 6 | 29 (0) | 0 |
| Setup guide | 38 | 21 | 17 (3) | 1 |
| Website | 185 | 38 | 147 (63) | 37 |
| README | 47 | 15 | 32 (0) | 14 |
| CHANGELOG | 29 | 7 | 22 (0) | 0 |
| SECURITY.md | 16 | 5 | 11 (0) | 6 |
| THREAT-MODEL.md | 33 | 8 | 25 (0) | 0 |
| **Total** | **501** | **137** | **364 (66)** | **58** |
| PERMISSIONS.md (not ledgered) | — | 5 passages | pinned by `permissionsLedger.test.ts` | — |

**"Changed since the last human review"** means changed after the 9.2 prep commit `5ac0112` (2026-11-07): by walk fixes
8.1a–8.1j, 9.2b or 9.3c. Of those, only 8.1f, 8.1g, 9.2b and 9.3c touched a published sentence or its evidence. 8.1a–8.1e,
8.1h and 8.1i changed app behaviour, not ledger text. 8.1j changed a colour token on the site, not a sentence. You approved
some new wording as drafts in rulings; it is listed anyway, because you have not yet read it in place.

**Batch order** follows the order a user meets the texts: a store listing → its privacy link → install → the setup guide →
the website → the repository (README, CHANGELOG, then the trust documents).

**Scope mismatch, flagged (AGENTS.md: the task body is ground truth).** This prep was asked for listings, README,
PERMISSIONS, PRIVACY, SECURITY, site, CHANGELOG and the setup guide. 9.2's own line names README, site, SECURITY, PRIVACY,
**THREAT-MODEL**, CHANGELOG and the three listings. The pack covers both lists: THREAT-MODEL is batch 11, and PERMISSIONS.md
and the setup guide are batches 9 and 5a/5b.

## The flags at a glance

1. **The site never tells a Firefox user about the local-files setting** (183, 82). Since 9.2b every other surface
   does. The site is the one gap.
2. **PRIVACY.md names only Chrome's file setting** (372). Now incomplete for Firefox. A change moves the site's privacy page
   and AMO's pasted copy (510) with it.
3. **Firefox listing row 482 under-claims and carries stale evidence** ("unchecked"). Its own summary says more.
4. **Seven rows still say "PENDING SIGNED INSTALL"** in their evidence (2, 8, 112, 185, 209, 312, plus 482's "unchecked").
   9.2b closed that. The sentences hold; the agent rewrites the evidence notes once you sign.
5. **Evidence that claims a walk that hasn't happened, or can't happen**: 42 (Firefox temporary add-on: not yet walked);
   303, 325, P5 ("a store install walked at 8.1": no store install exists before go-live).
6. **Counts and numbers that moved**: 295 says "one browser setting" where 8.1f can make it two; 110 "under 7 MB" still
   holds but its figure is stale and the headroom is ~0.34 MB; P4's manifest bytes are 864 / 978, not 833 / 949.
7. **Wording choices**: "watching does not work … folder picker" (25 / 334 / 498) describes a choice, not a limit;
   "except the mark for the note about snapshots" (324 / 363) reads oddly; "the one place … contents of your files" (359)
   is arguable once diagram drawings are counted.
8. **Checks deferred to submission**: Edge row 549 is backed by Chrome's FAQ; Edge category 515; 587 / 582 / 583 labels
   were read on Chrome 157 and Firefox 159 only, while the floors are 121 and 153. AMO summary 477 is 247 / 250 characters.
9. **Absolutes** ("Zero", "nothing", "none", "no backend", "Price $0") are marked ABSOLUTE in their rows. All are backed,
   by tests or by your own rules; they are flagged so the wording is a conscious choice.

**How to answer:** per batch, "batch N: OK", or a list such as "482: add the clause", "183: add Firefox", "42: walk first".
A bare "9.2 signed off" means every row stands as written, every flag included.

## Batch 1 — Chrome Web Store listing (`docs/store/chrome.md`)

The first text a Chrome user reads. Auto-pinned rows on this surface are the feature list, which is the README's, word for word.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 436 | Render raw markdown into beautiful, private reading. | Summary (= the manifest description) | A judgement: "beautiful" has no measure; "private" rests on PRIVACY.md. | unchanged (kept by you at 7.5) | The listing's one unmeasured adjective. Kept by your 7.5 ruling; confirm it stays. |
| 437 | Zero network by default. | Summary, 2nd sentence (manifest) | The zero-network browser tests, one per feature. | unchanged | ABSOLUTE ("Zero"). Loading remote images is the opt-in exception, disclosed lower down (row 462). Fair as "by default"? |
| 438 | Workflow & Planning | Category | A choice: Chrome's best-practices page puts document editors here. | unchanged | — |
| 457 (+ 440) | Files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Description, known limits (440: description, 2nd sentence) | PERMISSIONS.md's file:// note; the setup guide reads the toggle. | unchanged | Walk fix 8.1f found that Chrome's site access for file:///* can block local files even with this toggle on. The guide now says so (rows 586–587), but this sentence names one setting. True for a default install: keep it, or add a clause? |
| 472 | Website content: Peekover reads the text of the markdown pages and files you open in order to show them, and keeps snapshots of watched documents and drawings of diagrams on your device; none of it leaves your device. | Data usage | Your 7.5 ruling ("Website content only"); PRIVACY.md; the zero-network tests. | unchanged | ABSOLUTE ("none of it leaves your device"). The network tests back it. |
| 473 | No other kind of user data is handled. | Data usage | A judgement against Chrome's data categories: the stored items (folder names, paths, settings, snapshots, diagram drawings, two marks) fit none of the others. | unchanged | ABSOLUTE. Recent file paths are stored on the device; they are local paths, not web browsing history. Your call. |
| 474 | All three certifications are ticked: Peekover does not sell or transfer user data, does not use it for anything outside its single purpose, and does not use it to decide creditworthiness or for lending. | Data usage | Nothing is sent (PRIVACY.md, the zero-network tests). | unchanged | — |
| 463 (+ 464, 465, 466, 475) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / https://peekover.dev/privacy/ | Privacy policy URL, description footer, website, support | Live at release: peekover.dev, the repository and its issues page are not online until go-live. | live at release / planned — unchanged | None of these URLs works today. chrome.md's own notes say to submit only after go-live. Just confirm. |

## Batch 2 — Firefox Add-ons (AMO) listing (`docs/store/firefox.md`)

The listing 9.2 was waiting on. Its Firefox lines were re-worded at 9.2b with your approval and are now evidenced by the signed install.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 477 | Turns raw markdown into formatted, readable pages: raw files on GitHub, GitLab and Bitbucket, folders on its app page, and files from disk once "Access local files on your computer" is on. | Summary | Measured on the AMO-signed 0.0.9 on Firefox 159: setting off → plain text, on → the reader renders. The 153 floor is pinned by a test. | Re-worded at 9.2b (your approval, 2026-11-10) | TIGHT: 247 of 250 characters, so any edit has to remove words. |
| 479 (+ 480) | Web Development | Categories (Web Development; Other) | A choice (AMO's categories API, read 2026-11-06). | unchanged | — |
| 482 | It works on raw markdown files from GitHub, GitLab and Bitbucket, and on folders of markdown files that you open on its app page. | Description, 2nd sentence | Content-script matches + the app page. The ledger evidence still says "opening a file from disk in Firefox is unchecked, row 26". | unchanged | STALE + UNDER-CLAIMS. 9.2b checked it, so the evidence note is out of date. The sentence also leaves out files from disk, while the summary (477) and the known limits (500) say they work once the setting is on. Add "and on files from disk once “Access local files on your computer” is on", or keep it as is? |
| 491 | On the app page, can watch a document from a folder you dragged in and update the view when it changes on disk. | Description, features | Drag route: the firefoxDragWatch browser test, plus your hand check on 2026-11-10 ("drag: works as tested"). | Sentence unchanged; evidence now includes your hand check | — |
| 498 | Watching does not work for raw files from GitHub, GitLab or Bitbucket, or for a folder chosen with the folder picker. | Known limits | watchAvailability: the picker route is not offered Watch. Your hand check found the picker route reads files fresh ("picker: fresh"). | Evidence changed at 9.3c | WORDING: a picked folder reads fresh. Watch is held back by a choice for 0.1.0, not by a browser limit. "does not work" sounds like a limit. Fair, or "isn't offered"? (Same as README 25 / CHANGELOG 334.) |
| 500 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Known limits | Same as 477. | Re-worded at 9.2b (replaced "has not yet been checked on a real install") | — |
| 506 (+ 507, 508, 509, 510) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / The full text of PRIVACY.md, the same as https://peekover.dev/privacy/, is pasted into this field. | Privacy policy, licence line, homepage, support, privacy text field | Live at release. | live at release / planned — unchanged | 510 pastes PRIVACY.md in full. If batch 4 changes PRIVACY.md, paste it again. |
| note | "…has not yet been checked" stays until the AMO-signed 0.0.9 test… | Submission notes (not published), line 79 | An unpublished submission note. | Stale since 9.2b: the check ran and the line it guarded is gone. | STALE. An unpublished note, so no ruling is needed: say "tidy" and the agent removes it. |

## Batch 3 — Microsoft Edge Add-ons listing (`docs/store/edge.md`)

The same text as Chrome's except the category and the form wording. A ruling on batch 1 carries over unless you say otherwise.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 513 (+ 514) | Render raw markdown into beautiful, private reading. | Short description (= the manifest description) | As 436 and 437. | unchanged | As 436 / 437. |
| 515 | Productivity | Category (Productivity) | "Confirmed in Partner Center at submission." | unchanged | UNCONFIRMED until submission (GO-LIVE section 7). |
| 534 | Files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Known limits | As 457. | unchanged | As 457 (site access, 8.1f). |
| 549 | Website content: Peekover reads the text of the markdown pages and files you open in order to show them, and keeps snapshots of watched documents and drawings of diagrams on your device; none of it leaves your device. | Data usage | The evidence cites the Chrome Web Store user-data FAQ. | unchanged | EVIDENCE MISMATCH: an Edge row backed by Chrome's FAQ. edge.md's notes say Partner Center's checkbox names are read at submission. Re-read this line against the real Edge form at GO-LIVE. |
| 550 (+ 551) | No other kind of user data is handled. | Data usage | As 473 / 474. | unchanged | ABSOLUTE, as 473. |
| 540 (+ 541, 542, 543, 552) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / https://peekover.dev/privacy/ | Privacy URL, licence line, website, support | Live at release. | live at release / planned — unchanged | Edge requires the privacy URL to work before submission (edge.md notes). |

## Batch 4 — Privacy policy (`docs/trust/PRIVACY.md` = `site/privacy/index.html`)

Linked from every listing. The site page is pinned to PRIVACY.md line for line, so a change here moves both, plus the AMO paste (510).

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 343 | Peekover has no accounts, no analytics, no telemetry and no error reporting. | "What Peekover collects" | AGENTS.md rule 2; the only `fetch` in shipped code reads a watched file:// file; no code is loaded from outside the package. | unchanged | ABSOLUTE ("no error reporting"). Backed by reading the code and by the network tests. |
| 359 | Snapshots are the one place Peekover stores the contents of your files. | "What Peekover stores on your device" | PERMISSIONS.md. The ledger says diagram drawings are "rendered SVG, not file text". | unchanged | ARGUABLE ABSOLUTE ("the one place"). A cached diagram drawing contains the diagram's labels, and those labels are text from your file. Reword, or accept? |
| 362 | Two marks: that the setup guide was shown, and that you closed the note about snapshots. | "What Peekover stores on your device" | store.ts has exactly two such rows (guide, notices). Re-checked today: no walk fix added a stored row. | unchanged | — |
| 363 | The "Stored data" panel on the app page lists what Peekover holds, except the mark for the note about snapshots. | "Seeing and deleting it" | buildStoredLines has no line for the notices row (your 6.2a choice). | unchanged | READS ODDLY: a reader meets an exception about a "mark" without being told why. True. This is the case behind the retro's proposal (b). Same wording in CHANGELOG 324. |
| 372 | In Chrome and Edge, reading files from your computer needs the "Allow access to file URLs" setting, which you turn on yourself. | "Permissions" | PERMISSIONS.md's file:// note; onboarding.ts. | unchanged | NOW INCOMPLETE. Since 9.2b, Firefox needs its own setting ("Access local files on your computer") and PRIVACY names only Chrome's. Since 8.1f, Chromium site access matters too. Not false, but add a Firefox sentence? |
| 373 | For a question about privacy, open an issue on Peekover's GitHub repository once it is public. | "Contact" | Live at release (GitHub issues). | live at release / planned — unchanged | — |

## Batch 5a — The setup guide, Chromium build (`src/app/onboarding.ts`, `entrypoints/onboarding/main.ts`)

Opens on install, so this is the first Peekover page a Chrome or Edge user sees. Rows 586–592 were added by walk fixes 8.1f and 8.1g. You approved them as drafts on 2026-11-10 but have not yet read them on the built page.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 295 | Files on your computer need one browser setting. | Section "Files on your computer", lead | Chromium branch; PERMISSIONS.md's file:// note. | unchanged | COUNT MOVED: since 8.1f the guide can also ask for site access to file:///* (586 / 587 / 592), and then it is two settings, not "one". |
| 297 | Peekover can read files on your computer: “Allow access to file URLs” is on. | "On" state | Shown only when the file-URL answer is true and (since 8.1f) site access holds the file:// matches. | Evidence changed at 8.1f | — |
| 586 | Peekover can’t read files on your computer yet: its site access for file:///* is turned off. | "Blocked" state (new) | Chromium: the file-URL answer is true but permissions.contains is false. Measured on Chrome 157. | Added 8.1f | — |
| 587 | Under site access, turn on file:///* (in Chrome and Edge: “Automatically allow access on the following sites”). | "Blocked" state, step 2 (new) | The labels on Peekover's Details page, Chrome 157. | Added 8.1f | Label read on Chrome 157 only; the floor is 121. |
| 592 | If site access for file:///* is off, turn it on too (in Chrome and Edge: “Automatically allow access on the following sites”). | "Off" / "unknown" state, step 2 (new) | With the file-URL toggle off the browser reports file sites as not allowed, so the line is conditional. | Added 8.1f, made conditional at 8.1g | — |
| 305 | Raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket are shown with no setup. | Section "Raw files on the web" | Content-script matches. Replaced by 588 when site access for a raw host is off. | Evidence changed at 8.1f | — |
| 588 | Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its site access for at least one of them is turned off. | Section "Raw files on the web", off state (new) | permissions.contains over the four raw-host matches is false. Measured on Chrome 157. | Added 8.1f | — |
| 589 | Turn them on under site access in Peekover’s details on your browser’s extensions page. | Same, the step (new) | The per-site rows on Peekover's Details page, Chrome 157. | Added 8.1f | — |
| 306 | To read files on your computer in Chrome or Edge, turn on “Allow access to file URLs” for Peekover on your browser’s extensions page. | Page-failed fallback | entrypoints/onboarding/main.ts; its Firefox half is now row 585. | Evidence changed at 9.2b | — |
| 302 | Turn on “Allow access to file URLs”. | Steps, "Turn on …" | The toggle label, read on Chromium 149 at 6.1. "Other Chromium browsers walked at 8.1." | unchanged | Was the label checked on Edge in walk notes E1–E4? If not, the "walked at 8.1" evidence is still owed. |
| 303 | Your browser may restart Peekover and close this page. | Steps, the restart warning | Flipping the toggle closed the page on Chromium 149 (a command-line install). The evidence also says "a store install walked at 8.1". | unchanged | EVIDENCE OVERSTATED: no store install exists before go-live, so the walk can only see a Load-unpacked install. The sentence is hedged ("may") and true. |

## Batch 5b — The setup guide, Firefox build

The Firefox branch was added at 9.2b (your approval "exactly as drafted", 2026-11-10). It has been measured on the signed install but you have not read it on the built page.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 296 | Files on your computer need one Firefox setting. | Section "Files on your computer", lead | Firefox 153+: local-file access is a separate setting, off by default. Pinned by the onboarding unit and browser tests. | Re-worded at 9.2b (was "nothing needs setting up") | — |
| 304 | Peekover can read files on your computer: “Access local files on your computer” is on. | "On" state | Shown when isAllowedFileSchemeAccess() answers true. | Re-worded at 9.2b | — |
| 580 | Peekover can’t read files on your computer yet: “Access local files on your computer” is off. | "Off" state (new) | Shown when the answer is false. | Added 9.2b | — |
| 581 | Open about:addons (type it in the address bar) and choose Peekover. | Step 1 (new) | An extension cannot open about:addons, so the step names it (no button). | Added 9.2b | — |
| 582 | Open the Permissions and data tab. | Step 2 (new) | The tab's name on Firefox 159 (screenshot in the AMO kit's step-11 evidence). | Added 9.2b | Label read on 159 only; the floor is 153. Was the tab called "Permissions and data" in 153? |
| 583 | Turn on “Access local files on your computer”. | Step 3, off (new) | The toggle's label on Firefox 159 (string id webext-perms-host-description-file-urls). | Added 9.2b | Same 153-vs-159 question as 582. |
| 584 | Check that “Access local files on your computer” is on. | Step 3, check failed (new) | HUMAN RULING 2026-11-10, approved as drafted. | Added 9.2b | — |
| 585 | In Firefox, turn on “Access local files on your computer” under Peekover’s Permissions and data in about:addons. | Page-failed fallback, Firefox half (new) | As 26. | Added 9.2b | — |
| 590 | Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its permission for at least one of them is turned off. | Section "Raw files on the web", off state (new) | Measured on Firefox 159 (one host revoked through permissions.remove). | Added 8.1f | — |
| 591 | Turn them on under Peekover’s Permissions and data in about:addons. | Same, the step (new) | The raw-site entries listed on that tab, Firefox 159. | Added 8.1f | — |

## Batch 6 — The website (`site/index.html`)

No sentence on the site has changed since you approved it at 9.1. Its only change since then is one colour token (8.1j, `--faint`). The rows below are here for their evidence or their flags.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 183 | For files on your disk in Chromium-based browsers, turn on “Allow access to file URLs” for Peekover in the extension settings. | Setup, "Flip one switch" | PERMISSIONS.md's file:// note. | unchanged | GAP SINCE 9.2b: the site's setup step names only Chromium's switch. A Firefox user reading the site is never told about "Access local files on your computer". Add a Firefox clause? |
| 82 | Firefox has some limits; the README lists them. | Watch mode card | watchAvailability (the Firefox cases); the README's "Limits". | unchanged | Points Firefox users to the README for limits. Enough, now that Firefox needs a setting for files from disk (see 183)? |
| 112 | Markdown files opened from disk, and raw files on GitHub, GitLab and Bitbucket. | Sources card | Content-script matches. Evidence still reads "the Firefox half PENDING SIGNED INSTALL (9.2)". | unchanged | STALE EVIDENCE: closed at 9.2b (it works with the setting on). The agent updates the note; the sentence holds. |
| 185 | Open a markdown file from disk or a raw link, or open the app page from the toolbar button and pick a folder. | Setup, "Peek" | As 112. | unchanged | STALE EVIDENCE, as 112. |
| 209 | Markdown files opened from disk | Feature list, Rendering | As 112. | unchanged | STALE EVIDENCE, as 112. |
| 110 | The whole extension is under 7 MB. | "Never a blank page" card | The ledger figure is `.output` 5,831,081 B, measured 2026-11-01 (task 1.4). | unchanged | NUMBER MOVED: the local `.output/chrome-mv3` from 2026-11-10 reads 6,659,448 B (not a measurement of record). Still under 7 MB, but the headroom is down from ~1.17 MB to ~0.34 MB. 9.5 re-measures; the ledger figure is stale. |
| 77 | Coding agents write CLAUDE.md files, specs, plans and changelogs faster than anyone can read them raw. | "For agent output" section | The problem the product addresses, not a product claim (product spec §3). | unchanged | Rhetoric ("faster than anyone can read them raw"). Fine as framing? |
| 138 (+ 71, 136, 137, 154) | There is no backend, no database and no account. | Security section; hero strip; receipt | "No backend exists in the repository", an absence checked by reading, not by a test. | unchanged | ABSOLUTE ("no backend, no database and no account"). |
| 172 (+ 145, 153, 158, 160, 173, 176, 188) | No price, no tiers No “Pro” version, no locked features, no trials. | "Free means free" section; receipt | AGENTS.md rule 6, a project rule rather than a test. | unchanged | ABSOLUTE ("no locked features", "Price $0"). True by your own rule. |
| 161 (+ 179, 180, 181) | Not in stores yet — build from source | Hero, receipt footer, Setup "Build" | "Not in stores yet": no listing exists. Each carries UPDATE AT GO-LIVE. | unchanged | True today, false the day a listing goes live. GO-LIVE section 3 must swap them. |
| 434 (+ 63, 64, 70, 187, 196, 197, 198, 199, 200, 554) | For the first public release: listings in the Chrome, Firefox and Edge stores; attestations on release files; a privacy policy at https://peekover.dev/privacy/ and this website at https://peekover.dev, neither online yet. / GitHub (https://github.com/mosuvo/peekover) Not in stores yet — build from source / Agent output Reading Editor Security Planned GitHub (https://github.com/mosuvo/peekover) / Not in stores yet — build from source Build it from the repository (https://github.com/mosuvo/peekover#build-from-source) See everything ↓ / Not in stores yet — build from source GitHub (https://github.com/mosuvo/peekover) / github.com/mosuvo/peekover (https://github.com/mosuvo/peekover) / SECURITY.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/SECURITY.md) / PERMISSIONS.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/PERMISSIONS.md) / Releases (https://github.com/mosuvo/peekover/releases) / Report a bug (https://github.com/mosuvo/peekover/issues) / The same text is in the repository as docs/trust/PRIVACY.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/PRIVACY.md). | Planned section, nav, footer links, privacy page | Live at release: the repository and peekover.dev are not public yet. | live at release / planned — unchanged | The repo links 404 for visitors today (private repo). |
| 129 (+ 130, 132) | PLANNED / Not built yet. / Later, not yet scheduled: on-device and bring-your-own-key AI features, DOCX and ZIP export, publishing, presentation mode, read-aloud, and other raw file types such as JSON, YAML, TOML and CSV. | Planned section | Planned (tasks 7.4 / 7.5; spec §6 out of scope). | live at release / planned — unchanged | — |

## Batch 7 — README (`README.md`)

Seen once the repository is public. Its only edit since the 9.2 prep is row 26.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 26 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Limits | Measured on the AMO-signed 0.0.9, Firefox 159. The 153 floor is pinned by a test. | Re-worded at 9.2b (replaced "has not yet been checked on a real install") | — |
| 25 | In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker. | Limits | watchAvailability + the drag browser test + your hand checks ("drag: works as tested", "picker: fresh"). | Evidence changed at 9.3c | WORDING, as 498: the picker route is withheld by choice, not by a browser limit. |
| 2 | It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket. | Intro, 2nd sentence | Content-script matches. Evidence still says "the Firefox half PENDING SIGNED INSTALL (9.2)". | unchanged | STALE EVIDENCE: closed at 9.2b. The Firefox caveat is row 26. |
| 8 | Renders markdown files opened from disk (.md and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | Features | As 2. | unchanged | STALE EVIDENCE, as 2. |
| 22 | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Limits | PERMISSIONS.md's file:// note. | unchanged | As 457: site access (8.1f) can also block local files. |
| 41 | To load it in Chrome or Edge, turn on Developer mode on the extensions page and choose "Load unpacked" with .output/chrome-mv3. | Build from source | The browser's own Load-unpacked flow. "Walked by the human at 8.1": the Chrome walk notes (1–15) were loaded this way. | unchanged | — |
| 42 | To load it in Firefox, open about:debugging, choose "This Firefox", then "Load Temporary Add-on", and pick .output/firefox-mv3/manifest.json. | Build from source | The browser's own temporary add-on flow. "Walked by the human at 8.1". | unchanged | EVIDENCE NOT YET TRUE: tasks.md 8.1 says "Firefox's current build not yet walked". Walk section C (Load Temporary Add-on) is what makes it true. |
| 45 | It is free: there is no price, no paid tier and no ads. | Licence | AGENTS.md rule 6. | unchanged | ABSOLUTE, as the site's free rows. |
| 4 (+ 32, 33, 36, 37, 38, 432) | Peekover is not in any browser store yet. | "Not in any store yet"; Planned list | True until go-live; planned items named by tasks / spec §6. | live at release / planned — unchanged | 4 flips at go-live (GO-LIVE section 3). |

## Batch 8 — CHANGELOG (`CHANGELOG.md`, "0.1.0 - Unreleased")

It mirrors the README. Edits since the 9.2 prep: rows 328 and 335.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 328 | Needs Chrome 121 or later, or Firefox 153 or later. | Added | wxt.config.ts (Chrome 121, Firefox 153.0); browserFloor.test.ts (MDN data: isAllowedFileSchemeAccess is the binding feature). | Floor raised from 127 to 153 at 9.2b | — |
| 335 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Known limits | As README 26. | Re-worded at 9.2b | — |
| 334 | In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker. | Known limits | As README 25. | Evidence changed at 9.3c | WORDING, as 498. |
| 312 | Renders markdown files opened from disk (`.md` and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | Added | As README 8. | unchanged | STALE EVIDENCE, as 2. |
| 331 | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Known limits | As README 22. | unchanged | As 457 (site access). |
| 324 | On the app page, a Stored data panel lists what Peekover keeps on your device, except the mark for the note about snapshots, and "Wipe all data" erases all of it. | Added | store.ts: no panel line for the notices row (your 6.2a choice; wording approved at 9.2). | unchanged | READS ODDLY, as 363. |
| 325 | A setup guide opens once, when Peekover is first installed, and the app page links to it. | Added | background.ts (install only, at most once) + tests. "A store install is walked at 8.1". | unchanged | EVIDENCE OVERSTATED, as 303: no store install before go-live. The AMO-signed install did confirm it on Firefox ("opens once, not again": TRUE). |

## Batch 9 — PERMISSIONS.md (`docs/trust/PERMISSIONS.md`)

Not a ledger surface: `tests/permissionsLedger.test.ts` pins it instead, so its passages have P-ids, not row numbers. Every passage below was edited by 9.2b or 8.1f, or carries a moved number.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| P1 | "`extension.isAllowedFileSchemeAccess()` (both builds) — reads whether the user has turned on "Allow access to file URLs" (Chromium) or "Access local files on your computer" (Firefox 153+) for Peekover, so the page can say whether local files will open." | Setup guide section, line 149 | Firefox 153+ exposes the same read; both bundles are checked by onboarding.test.ts. | Rewritten at 9.2b (was "Chromium build only"; your approval "APPROVED as proposed") | — |
| P2 | "`permissions.contains({ origins })` and `runtime.getManifest()` (both builds; added M13 / walk fix 8.1f) — read whether Peekover still holds the sites its content script runs on, so the page does not say "on" while the browser withholds them." | Setup guide section, line 156 | Measured with `permissions: []` on Chrome 157, Chromium 149 and Firefox 159 (decisions.md, "M13 TASK 8.1f"). | Added at 8.1f | The bullet reads two APIs and asks for no permission. Confirm the plain-English reason reads clearly. |
| P3 | "In Firefox (153+) the matching setting is "Access local files on your computer", on Peekover's Permissions and data tab in about:addons." | "file:// access note", line 253 | As README 26. | Added at 9.2b (your approval) | — |
| P4 | "both built manifests are byte-identical before and after it (833 / 949 B, `permissions: []`, …)" (and the same figures in the install section) | Lines 147 and 182 | A point-in-time count from task 6.1. | unchanged | NUMBER MOVED: the built manifests now read 864 / 978 B (local `.output`, 2026-11-10). The "before and after" claim was true when it was made, but the numbers read as current. Re-word as "at 6.1", or update them? |
| P5 | "Measured on a command-line-loaded Chromium 149 (`--load-extension`): every browser start reports `"install"` for such an install; a store install is expected to report it once — the 8.1 walk checks it." | Install section, line 185 | "A store install is expected to report it once — the 8.1 walk checks it." | unchanged | EVIDENCE OVERSTATED, as 303 (no store install before go-live). The signed Firefox install showed it once. |

## Batch 10 — SECURITY.md (`docs/trust/SECURITY.md`)

No edit since the 9.2 prep.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 46 (+ 47, 48) | Report security problems through GitHub private vulnerability reporting on this repository. / That channel opens when the repository becomes public at the first release; until then the repository is private. / For anything that is not a security problem, open a GitHub issue once the repository is public. | Reporting | Private vulnerability reporting and issues open when the repository goes public (GO-LIVE turns them on). | live at release / planned — unchanged | No response-time promise is made, by design. |
| 55 | CI fails on a known advisory in the production dependencies, except one recorded exception in a dependency of the diagram library. | What CI checks | supply-chain.yml (`pnpm audit --prod --audit-level low`); package.json has exactly one ignoreGhsas entry, GHSA-238p-pmpm-9mq7 (checked today). | unchanged | "one recorded exception" is still one. Whether it is still needed is the next preflight's `pnpm audit --prod`; this prep did not run it. |
| 59 | Build attestations on release files. | Planned | release.yml: the attest job runs only for a public repository. | live at release / planned — unchanged | — |

## Batch 11 — THREAT-MODEL.md (`docs/trust/THREAT-MODEL.md`)

No edit since the 9.2 prep. The rows here are statements of scope (judgements) rather than test-backed claims.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag |
|---|---|---|---|---|---|
| 378 | What you read: nobody should learn through Peekover what you read, or that you read it. | Assets | An asset statement, resting on the zero-network default (SECURITY 51). | unchanged | ABSOLUTE ("nobody should learn"), but framed as a goal ("should"). |
| 381 | A website you visit, which might try to reach Peekover. | Adversaries | No `externally_connectable`; pinned at 9.2 in both engines' manifests (red-first). | Pin added at the 9.2 prep (after your last read) | — |
| 402 | A browser, operating system or device that is already compromised. | Not defended | Out of scope by statement. | unchanged | — |
| 403 | Other extensions you install. | Not defended | Out of scope by statement. | unchanged | — |
| 404 | The sites that host images, once you choose to load them. | Not defended | After the opt-in, the browser fetches. | unchanged | — |
| 405 | Someone who can use your device or read your browser profile: Peekover's storage is not encrypted. | Not defended | store.ts: plain IndexedDB rows, no encryption. | unchanged | — |
| 406 | A change to a file in the instant between Save's check and its write. | Not defended | PERMISSIONS.md: "the check and the write are two steps". | unchanged | — |
| 407 | Build attestations on release files, from the first public release, so that a download can be checked against the source. | Planned | release.yml attest job, public repository only. | live at release / planned — unchanged | — |

---

*Built from the ledger at `fc02f4d`. The generator asserts that every listed row exists, is published (not withdrawn),
belongs to an in-scope surface and appears once, so the auto-pinned counts are the ledger minus this list.*
