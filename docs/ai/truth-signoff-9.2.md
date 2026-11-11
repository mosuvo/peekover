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
- **Not in this pack:** 60 withdrawn rows on these surfaces (not published); REPRODUCING (22 rows) and
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
| README | 46 | 14 | 32 (0) | 15 |
| CHANGELOG | 29 | 7 | 22 (0) | 0 |
| SECURITY.md | 15 | 4 | 11 (0) | 7 |
| THREAT-MODEL.md | 33 | 8 | 25 (0) | 0 |
| **Total** | **499** | **135** | **364 (66)** | **60** |
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

## Recorded so far (2026-11-11)

Your words: "batch 1 and flags: as you suggest", then "as you suggest" on the copy drafts and batch 2. Banked in
`docs/ai/decisions.md` ("M13 TASK 9.2 — batch 1 and the flags", "M13 TASK 9.2 — the copy", "M13 TASK 9.2 — batch 2", "M13 TASK 9.2 — batch 3", "M13 TASK 9.2 — batch 4", "M13 TASK 9.2 — go-live tense and batch 5", "M13 TASK 9.2 — batch 6", "M13 TASK 9.2 — batches 7 and 8").
The **Status** column of each table says what was recorded. A row with no status is still open.

- **Batch 1:** every row is OK (your verdicts are in the table, and in the ledger's evidence column).
- **Evidence-only fixes, done** (no published sentence changed except where your ruling approved it, P4 and P5):
  flag 4 (seven rows now cite the signed install), flag 5 (row 42 cites your walk; rows 303 and 325 and P5 point to
  the new GO-LIVE 8.3 store-install check), flag 6 (row 110 re-measured; P4's bytes), flag 8 (GO-LIVE 6.2–6.4; the
  labels on floor versions recorded as an accepted risk), flag 9 (every ABSOLUTE row marked OK, with its backing).
- **Batch 2:** every row is OK; 482 and 498 changed through C-3 and C-7a; the unpublished Firefox note is removed.
- **Copy, landed 2026-11-11:** C-1, C-2, C-3, C-6, C-7a, C-7b (your variant) and C-7c. No change for C-1b and C-6b.
  The next section lists each draft with its outcome.
- **Batch 3:** every row is OK; the Edge category and data-usage line are checked at submission (GO-LIVE 6.3, 6.2).
- **Batch 4:** every row is OK; 373 re-worded by your copy approval (no "once it is public"; linked).
- **Batches 5a / 5b:** every row is OK, with the walk or measurement named in each Status cell.
- **Go-live tense (copy, 2026-11-11):** SECURITY 47 cut, 48 / 339 re-worded; README 36 withdrawn; site 434 re-worded.
- **Batch 6:** every row is OK; row 110 now has a size guard (tests/extensionSize.test.ts, GO-LIVE 0.5).
- **Batches 7 and 8:** every row is OK (22 / 331 as 457).
- **Still open:** batches 9–11 as reading batches. The rows above that carry a status are already settled.

## The copy drafts and what landed

Each draft is the shortest true sentence I found. "Moves with" lists every other place that has to change in the same
commit when it lands. All were decided on 2026-11-11; the Outcome column says what landed.

| C-id | Row(s) · surface | Sentence before 9.2 | Proposed sentence | Limit | Moves with | Outcome |
|---|---|---|---|---|---|---|
| C-1 | 183 · site (Setup, "Flip one switch") | For files on your disk in Chromium-based browsers, turn on “Allow access to file URLs” for Peekover in the extension settings. | For files on your disk, turn on “Allow access to file URLs” for Peekover in Chromium-based browsers, or “Access local files on your computer” in Firefox (about:addons → Peekover → Permissions and data). | 202 chars; no limit (a site card; re-check it at phone width) | `site/index.html` (the Setup card); ledger row 183 withdrawn plus a new row | LANDED as drafted (HUMAN COPY APPROVAL 2026-11-11). 414 px: the card fits, no sideways scroll. |
| C-1b | 82 · site (Watch mode card) | Firefox has some limits; the README lists them. | RECOMMENDED: no change. The card is about watching, and C-1 puts the setting where a user sets up. Option, if you want it here too: Firefox has some limits, and needs a setting for files on your disk; the README lists them. | 91 chars; no limit | only if the option is chosen: `site/index.html`; ledger row 82 | No change (human: row 82 OK as is). |
| C-2 | 372 · PRIVACY ("Permissions") | In Chrome and Edge, reading files from your computer needs the "Allow access to file URLs" setting, which you turn on yourself. | Reading files from your computer needs a setting that you turn on yourself: "Allow access to file URLs" in Chrome and Edge, "Access local files on your computer" in Firefox. | 173 chars; no limit | `docs/trust/PRIVACY.md`; `site/privacy/index.html` (pinned to PRIVACY.md line for line by `tests/privacyPage.test.ts`); the AMO privacy field, which is PRIVACY.md pasted at GO-LIVE 7.2 (row 510; no file to edit); ledger row 372 | LANDED as drafted, in PRIVACY.md and the site privacy page. |
| C-3 | 482 · firefox (Description, 2nd sentence) | It works on raw markdown files from GitHub, GitLab and Bitbucket, and on folders of markdown files that you open on its app page. | It works on raw markdown files from GitHub, GitLab and Bitbucket, on folders of markdown files that you open on its app page, and on files from disk once "Access local files on your computer" is on. | 198 chars; AMO description: no documented limit | `docs/store/firefox.md`; ledger row 482. It now matches the summary (477) and the known limit (500) | LANDED as drafted. |
| C-6 | 295 · onboarding, Chromium lead | Files on your computer need one browser setting. | Files on your computer need a browser setting. | 46 chars; no limit | `src/app/onboarding.ts` (`introChromium`). A PRODUCTION string, so landing it needs the full Verify (lint, unit, both engines' browser suites, bytes, `permissions: []`). Ledger row 295 | LANDED as drafted; red-first pin in src/app/onboarding.test.ts; full suites, both engines. |
| C-6b | 296 · onboarding, Firefox lead | Files on your computer need one Firefox setting. | RECOMMENDED: no change, because it is accurate as is: for files on your computer Firefox needs exactly one setting, and the raw-site permissions are another section of the guide. Option, for parallel wording with C-6: "Files on your computer need a Firefox setting." | — | only if the option is chosen: `src/app/onboarding.ts` (`introFirefox`), full Verify; ledger row 296 | No change (human: row 296 OK as is; pinned by the same test). |
| C-7a | 25 · README, 334 · CHANGELOG (Limits) | In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker. | In Firefox, on the app page, watching works for a folder dragged in and isn't offered for one chosen with the folder picker. | 124 chars; no limit | `README.md`, `CHANGELOG.md`; ledger rows 25 and 334. Matches `FIREFOX_PICKER_NOTE` ("Watching isn't offered for folders opened with the file picker in Firefox."), which does not change | LANDED as drafted. |
| C-7a | 498 · firefox (Known limits) | Watching does not work for raw files from GitHub, GitLab or Bitbucket, or for a folder chosen with the folder picker. | Watching does not work for raw files from GitHub, GitLab or Bitbucket, and isn't offered for a folder chosen with the folder picker. | 132 chars; AMO description: no documented limit | `docs/store/firefox.md`; ledger row 498 | LANDED as drafted. |
| C-7b | 363 · PRIVACY ("Seeing and deleting it") | The "Stored data" panel on the app page lists what Peekover holds, except the mark for the note about snapshots. | Option A (shortest): The "Stored data" panel on the app page lists what Peekover holds, except that you closed the note about snapshots. Option B (points to the list above): The "Stored data" panel on the app page lists what Peekover holds, except one of the two marks above: that you closed the note about snapshots. | A 115 / B 143 chars; no limit | `docs/trust/PRIVACY.md`; `site/privacy/index.html` (pinned to PRIVACY.md line for line by `tests/privacyPage.test.ts`); the AMO privacy field, which is PRIVACY.md pasted at GO-LIVE 7.2 (row 510; no file to edit); ledger row 363 | LANDED, the reviewer's variant (not A or B). 363: The "Stored data" panel on the app page lists everything Peekover holds except one small mark: that you closed the note about snapshots. 324: On the app page, a Stored data panel lists what Peekover keeps on your device, except one small mark (that you closed the note about snapshots), and "Wipe all data" erases all of it. |
| C-7b | 324 · CHANGELOG (Added) | On the app page, a Stored data panel lists what Peekover keeps on your device, except the mark for the note about snapshots, and "Wipe all data" erases all of it. | Option A: On the app page, a Stored data panel lists what Peekover keeps on your device, except that you closed the note about snapshots, and "Wipe all data" erases all of it. Option B: On the app page, a Stored data panel lists what Peekover keeps on your device (all but one small mark: that you closed the note about snapshots), and "Wipe all data" erases all of it. | A 165 / B 183 chars; no limit | `CHANGELOG.md`; ledger row 324. A third way out: make the panel list the mark (a code change, so a discovered task); then the exception drops from both surfaces | LANDED, the reviewer's variant (not A or B). 363: The "Stored data" panel on the app page lists everything Peekover holds except one small mark: that you closed the note about snapshots. 324: On the app page, a Stored data panel lists what Peekover keeps on your device, except one small mark (that you closed the note about snapshots), and "Wipe all data" erases all of it. |
| C-7c | 359 · PRIVACY ("What Peekover stores") | Snapshots are the one place Peekover stores the contents of your files. | Only snapshots and diagram drawings keep content from your files. | 65 chars; no limit | `docs/trust/PRIVACY.md`; `site/privacy/index.html` (pinned to PRIVACY.md line for line by `tests/privacyPage.test.ts`); the AMO privacy field, which is PRIVACY.md pasted at GO-LIVE 7.2 (row 510; no file to edit); ledger row 359 (evidence: `src/app/store.ts` snapshot text, `src/app/diagramCache.ts` drawings). Consistent with the Chrome / Edge data-usage answers (472, 549) | LANDED as drafted, in PRIVACY.md and the site privacy page. |

## Batch 1 — Chrome Web Store listing (`docs/store/chrome.md`)

The first text a Chrome user reads. Auto-pinned rows on this surface are the feature list, which is the README's, word for word.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 436 | Render raw markdown into beautiful, private reading. | Summary (= the manifest description) | A judgement: "beautiful" has no measure; "private" rests on PRIVACY.md. | unchanged (kept by you at 7.5) | The listing's one unmeasured adjective. Kept by your 7.5 ruling; confirm it stays. | HUMAN 2026-11-11: OK (7.5 ruling kept) |
| 437 | Zero network by default. | Summary, 2nd sentence (manifest) | The zero-network browser tests, one per feature. | unchanged | ABSOLUTE ("Zero"). Loading remote images is the opt-in exception, disclosed lower down (row 462). Fair as "by default"? | HUMAN 2026-11-11: OK ("by default" exact; remote images the disclosed opt-in). ABSOLUTE OK (HUMAN 2026-11-11, flag 9) |
| 438 | Workflow & Planning | Category | A choice: Chrome's best-practices page puts document editors here. | unchanged | — | HUMAN 2026-11-11: OK |
| 457 (+ 440) | Files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Description, known limits (440: description, 2nd sentence) | PERMISSIONS.md's file:// note; the setup guide reads the toggle. | unchanged | Walk fix 8.1f found that Chrome's site access for file:///* can block local files even with this toggle on. The guide now says so (rows 586–587), but this sentence names one setting. True for a default install: keep it, or add a clause? | HUMAN 2026-11-11: OK as is (true for a default install; restricted site access is handled by the guide) |
| 472 | Website content: Peekover reads the text of the markdown pages and files you open in order to show them, and keeps snapshots of watched documents and drawings of diagrams on your device; none of it leaves your device. | Data usage | Your 7.5 ruling ("Website content only"); PRIVACY.md; the zero-network tests. | unchanged | ABSOLUTE ("none of it leaves your device"). The network tests back it. | HUMAN 2026-11-11: OK (remote image loads send nothing from the user's files). ABSOLUTE OK (HUMAN 2026-11-11, flag 9) |
| 473 | No other kind of user data is handled. | Data usage | A judgement against Chrome's data categories: the stored items (folder names, paths, settings, snapshots, diagram drawings, two marks) fit none of the others. | unchanged | ABSOLUTE. Recent file paths are stored on the device; they are local paths, not web browsing history. Your call. | HUMAN 2026-11-11: OK (recent paths stay on device, never sent). ABSOLUTE OK (HUMAN 2026-11-11, flag 9) |
| 474 | All three certifications are ticked: Peekover does not sell or transfer user data, does not use it for anything outside its single purpose, and does not use it to decide creditworthiness or for lending. | Data usage | Nothing is sent (PRIVACY.md, the zero-network tests). | unchanged | — | HUMAN 2026-11-11: OK |
| 463 (+ 464, 465, 466, 475) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / https://peekover.dev/privacy/ | Privacy policy URL, description footer, website, support | Live at release: peekover.dev, the repository and its issues page are not online until go-live. | live at release / planned — unchanged | None of these URLs works today. chrome.md's own notes say to submit only after go-live. Just confirm. | HUMAN 2026-11-11: OK, live at release (submit only after go-live) |

## Batch 2 — Firefox Add-ons (AMO) listing (`docs/store/firefox.md`)

The listing 9.2 was waiting on. Its Firefox lines were re-worded at 9.2b with your approval and are now evidenced by the signed install.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 477 | Turns raw markdown into formatted, readable pages: raw files on GitHub, GitLab and Bitbucket, folders on its app page, and files from disk once "Access local files on your computer" is on. | Summary | Measured on the AMO-signed 0.0.9 on Firefox 159: setting off → plain text, on → the reader renders. The 153 floor is pinned by a test. | Re-worded at 9.2b (your approval, 2026-11-10) | TIGHT: 247 of 250 characters, so any edit has to remove words. | HUMAN 2026-11-11: OK (unchanged; 247 / 250). GO-LIVE 6.4 re-counts after any edit. |
| 479 (+ 480) | Web Development | Categories (Web Development; Other) | A choice (AMO's categories API, read 2026-11-06). | unchanged | — | HUMAN 2026-11-11: OK |
| 482 | It works on raw markdown files from GitHub, GitLab and Bitbucket, on folders of markdown files that you open on its app page, and on files from disk once "Access local files on your computer" is on. | Description, 2nd sentence | Content-script matches + the app page. The ledger evidence still says "opening a file from disk in Firefox is unchecked, row 26". | Re-worded 2026-11-11 (C-3) | Resolved by C-3: matches 477 and 500. | HUMAN 2026-11-11: via C-3 (LANDED). Evidence fixed earlier (flag 4). |
| 491 | On the app page, can watch a document from a folder you dragged in and update the view when it changes on disk. | Description, features | Drag route: the firefoxDragWatch browser test, plus your hand check on 2026-11-10 ("drag: works as tested"). | Sentence unchanged; evidence now includes your hand check | — | HUMAN 2026-11-11: OK (the human's drag check) |
| 498 | Watching does not work for raw files from GitHub, GitLab or Bitbucket, and isn't offered for a folder chosen with the folder picker. | Known limits | watchAvailability: the picker route is not offered Watch. Your hand check found the picker route reads files fresh ("picker: fresh"). | Re-worded 2026-11-11 (C-7a) | Resolved by C-7a: isn't offered. | HUMAN 2026-11-11: via C-7a (LANDED). |
| 500 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Known limits | Same as 477. | Re-worded at 9.2b (replaced "has not yet been checked on a real install") | — | HUMAN 2026-11-11: OK |
| 506 (+ 507, 508, 509, 510) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / The full text of PRIVACY.md, the same as https://peekover.dev/privacy/, is pasted into this field. | Privacy policy, licence line, homepage, support, privacy text field | Live at release. | live at release / planned — unchanged | 510 pastes PRIVACY.md in full. If batch 4 changes PRIVACY.md, paste it again. | HUMAN 2026-11-11: OK, live at release. GO-LIVE's AMO step pastes the UPDATED PRIVACY.md text (rows 359, 363, 372 changed at 9.2). |
| note | "…has not yet been checked" stays until the AMO-signed 0.0.9 test… | Submission notes (not published), line 79 | An unpublished submission note. | Stale since 9.2b: the check ran and the line it guarded is gone. | STALE. An unpublished note, so no ruling is needed: say "tidy" and the agent removes it. | HUMAN 2026-11-11: tidy: removed from firefox.md. |

## Batch 3 — Microsoft Edge Add-ons listing (`docs/store/edge.md`)

The same text as Chrome's except the category and the form wording. A ruling on batch 1 carries over unless you say otherwise.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 513 (+ 514) | Render raw markdown into beautiful, private reading. | Short description (= the manifest description) | As 436 and 437. | unchanged | As 436 / 437. | HUMAN 2026-11-11: OK, carries batch 1 (436 / 437). |
| 515 | Productivity | Category (Productivity) | "Confirmed in Partner Center at submission." | unchanged | UNCONFIRMED until submission (GO-LIVE section 7). | HUMAN 2026-11-11: OK, confirmed at submission (GO-LIVE 6.3). |
| 534 | Files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Known limits | As 457. | unchanged | As 457 (site access, 8.1f). | HUMAN 2026-11-11: OK, carries batch 1 (457). |
| 549 | Website content: Peekover reads the text of the markdown pages and files you open in order to show them, and keeps snapshots of watched documents and drawings of diagrams on your device; none of it leaves your device. | Data usage | The evidence cites the Chrome Web Store user-data FAQ. | unchanged | EVIDENCE MISMATCH: an Edge row backed by Chrome's FAQ. edge.md's notes say Partner Center's checkbox names are read at submission. Re-read this line against the real Edge form at GO-LIVE. | HUMAN 2026-11-11: OK, checked against Edge's own form at submission (GO-LIVE 6.2). |
| 550 (+ 551) | No other kind of user data is handled. | Data usage | As 473 / 474. | unchanged | ABSOLUTE, as 473. | HUMAN 2026-11-11: OK (absolute, flag 9). |
| 540 (+ 541, 542, 543, 552) | Privacy policy: https://peekover.dev/privacy/ / Peekover is released under the MIT licence, and its source code is at https://github.com/mosuvo/peekover. / https://peekover.dev / https://github.com/mosuvo/peekover/issues / https://peekover.dev/privacy/ | Privacy URL, licence line, website, support | Live at release. | live at release / planned — unchanged | Edge requires the privacy URL to work before submission (edge.md notes). | HUMAN 2026-11-11: OK, live at release. GO-LIVE puts the privacy page live (3.6) before the Edge submission (7.3); checked, no change needed. |

## Batch 4 — Privacy policy (`docs/trust/PRIVACY.md` = `site/privacy/index.html`)

Linked from every listing. The site page is pinned to PRIVACY.md line for line, so a change here moves both, plus the AMO paste (510).

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 343 | Peekover has no accounts, no analytics, no telemetry and no error reporting. | "What Peekover collects" | AGENTS.md rule 2; the only `fetch` in shipped code reads a watched file:// file; no code is loaded from outside the package. | unchanged | ABSOLUTE ("no error reporting"). Backed by reading the code and by the network tests. | HUMAN 2026-11-11: OK (flag 9). |
| 359 | Only snapshots and diagram drawings keep content from your files. | "What Peekover stores on your device" | PERMISSIONS.md. The ledger says diagram drawings are "rendered SVG, not file text". | Re-worded 2026-11-11 (C-7c; was "Snapshots are the one place Peekover stores the contents of your files.") | Resolved by C-7c: names both stores that keep file content. | HUMAN 2026-11-11: OK in place (C-7c landed today, reads well). |
| 362 | Two marks: that the setup guide was shown, and that you closed the note about snapshots. | "What Peekover stores on your device" | store.ts has exactly two such rows (guide, notices). Re-checked today: no walk fix added a stored row. | unchanged | — | HUMAN 2026-11-11: OK |
| 363 | The "Stored data" panel on the app page lists everything Peekover holds except one small mark: that you closed the note about snapshots. | "Seeing and deleting it" | buildStoredLines has no line for the notices row (your 6.2a choice). | Re-worded 2026-11-11 (C-7b, your variant; was "…except the mark for the note about snapshots.") | Resolved by C-7b: says what the mark is. | HUMAN 2026-11-11: OK in place (C-7b landed today, reads well). |
| 372 | Reading files from your computer needs a setting that you turn on yourself: "Allow access to file URLs" in Chrome and Edge, "Access local files on your computer" in Firefox. | "Permissions" | PERMISSIONS.md's file:// note; onboarding.ts. | Re-worded 2026-11-11 (C-2; was "In Chrome and Edge, …") | Resolved by C-2: names both browsers' settings. | HUMAN 2026-11-11: OK in place (C-2 landed today, reads well). |
| 373 | For a question about privacy, open an issue on Peekover's GitHub repository (https://github.com/mosuvo/peekover/issues). | "Contact" | Live at release (GitHub issues). | Re-worded 2026-11-11 (HUMAN COPY APPROVAL; was "… GitHub repository once it is public.") | Resolved: no "once it is public"; links the issues page. | HUMAN 2026-11-11: COPY APPROVAL: "once it is public" dropped and linked to the issues page; LANDED in PRIVACY.md and the site privacy page (the AMO paste follows at GO-LIVE 7.2). |

## Batch 5a — The setup guide, Chromium build (`src/app/onboarding.ts`, `entrypoints/onboarding/main.ts`)

Opens on install, so this is the first Peekover page a Chrome or Edge user sees. Rows 586–592 were added by walk fixes 8.1f and 8.1g. You approved them as drafts on 2026-11-10 but have not yet read them on the built page.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 295 | Files on your computer need a browser setting. | Section "Files on your computer", lead | Chromium branch; PERMISSIONS.md's file:// note. | Re-worded 2026-11-11 (C-6) | Resolved by C-6: "a browser setting". | HUMAN 2026-11-11: OK (C-6 landed). |
| 297 | Peekover can read files on your computer: “Allow access to file URLs” is on. | "On" state | Shown only when the file-URL answer is true and (since 8.1f) site access holds the file:// matches. | Evidence changed at 8.1f | — | HUMAN 2026-11-11: OK |
| 586 | Peekover can’t read files on your computer yet: its site access for file:///* is turned off. | "Blocked" state (new) | Chromium: the file-URL answer is true but permissions.contains is false. Measured on Chrome 157. | Added 8.1f | — | HUMAN 2026-11-11: OK; read on the built page (walk A4 screenshot, Chrome 157, 2026-11-10). |
| 587 | Under site access, turn on file:///* (in Chrome and Edge: “Automatically allow access on the following sites”). | "Blocked" state, step 2 (new) | The labels on Peekover's Details page, Chrome 157. | Added 8.1f | Label read on Chrome 157 only; the floor is 121. | HUMAN 2026-11-11: OK; walk A4 (Chrome 157); wording widened to "in Chrome and Edge" (8.1g); Edge label measured by CC, B10 (a), Edge 157. Floor 121 stays an accepted risk. |
| 592 | If site access for file:///* is off, turn it on too (in Chrome and Edge: “Automatically allow access on the following sites”). | "Off" / "unknown" state, step 2 (new) | With the file-URL toggle off the browser reports file sites as not allowed, so the line is conditional. | Added 8.1f, made conditional at 8.1g | — | HUMAN 2026-11-11: OK; the human's 8.1g re-check (Chrome). |
| 305 | Raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket are shown with no setup. | Section "Raw files on the web" | Content-script matches. Replaced by 588 when site access for a raw host is off. | Evidence changed at 8.1f | — | HUMAN 2026-11-11: OK |
| 588 | Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its site access for at least one of them is turned off. | Section "Raw files on the web", off state (new) | permissions.contains over the four raw-host matches is false. Measured on Chrome 157. | Added 8.1f | — | HUMAN 2026-11-11: OK; read on the built page (walk A4, Chrome 157). |
| 589 | Turn them on under site access in Peekover’s details on your browser’s extensions page. | Same, the step (new) | The per-site rows on Peekover's Details page, Chrome 157. | Added 8.1f | — | HUMAN 2026-11-11: OK; read on the built page (walk A4, Chrome 157). |
| 306 | To read files on your computer in Chrome or Edge, turn on “Allow access to file URLs” for Peekover on your browser’s extensions page. | Page-failed fallback | entrypoints/onboarding/main.ts; its Firefox half is now row 585. | Evidence changed at 9.2b | — | HUMAN 2026-11-11: OK |
| 302 | Turn on “Allow access to file URLs”. | Steps, "Turn on …" | The toggle label, read on Chromium 149 at 6.1. "Other Chromium browsers walked at 8.1." | unchanged | Was the label checked on Edge in walk notes E1–E4? If not, the "walked at 8.1" evidence is still owed. | HUMAN 2026-11-11: OK; the label on Chrome (walk A4) and on Edge 157 (CC, B10 (a)); walk I-2 notes the Edge item covered. |
| 303 | Your browser may restart Peekover and close this page. | Steps, the restart warning | Flipping the toggle closed the page on Chromium 149 (a command-line install). The evidence also says "a store install walked at 8.1". | unchanged | EVIDENCE OVERSTATED: no store install exists before go-live, so the walk can only see a Load-unpacked install. The sentence is hedged ("may") and true. | HUMAN 2026-11-11: OK; store install checked at GO-LIVE 8.3. |

## Batch 5b — The setup guide, Firefox build

The Firefox branch was added at 9.2b (your approval "exactly as drafted", 2026-11-10). It has been measured on the signed install but you have not read it on the built page.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 296 | Files on your computer need one Firefox setting. | Section "Files on your computer", lead | Firefox 153+: local-file access is a separate setting, off by default. Pinned by the onboarding unit and browser tests. | Re-worded at 9.2b (was "nothing needs setting up") | — | HUMAN 2026-11-11: OK (C-6b, no change). |
| 304 | Peekover can read files on your computer: “Access local files on your computer” is on. | "On" state | Shown when isAllowedFileSchemeAccess() answers true. | Re-worded at 9.2b | — | HUMAN 2026-11-11: OK |
| 580 | Peekover can’t read files on your computer yet: “Access local files on your computer” is off. | "Off" state (new) | Shown when the answer is false. | Added 9.2b | — | HUMAN 2026-11-11: OK; walk C12 screenshots of the built Firefox guide (Firefox 159, temporary add-on, 2026-11-10). |
| 581 | Open about:addons (type it in the address bar) and choose Peekover. | Step 1 (new) | An extension cannot open about:addons, so the step names it (no button). | Added 9.2b | — | HUMAN 2026-11-11: OK; walk C12 (Firefox 159). |
| 582 | Open the Permissions and data tab. | Step 2 (new) | The tab's name on Firefox 159 (screenshot in the AMO kit's step-11 evidence). | Added 9.2b | Label read on 159 only; the floor is 153. Was the tab called "Permissions and data" in 153? | HUMAN 2026-11-11: OK; walk C12 (Firefox 159). Floor 153 stays an accepted risk. |
| 583 | Turn on “Access local files on your computer”. | Step 3, off (new) | The toggle's label on Firefox 159 (string id webext-perms-host-description-file-urls). | Added 9.2b | Same 153-vs-159 question as 582. | HUMAN 2026-11-11: OK; walk C12 (Firefox 159). Floor 153 stays an accepted risk. |
| 584 | Check that “Access local files on your computer” is on. | Step 3, check failed (new) | HUMAN RULING 2026-11-10, approved as drafted. | Added 9.2b | — | HUMAN 2026-11-11: OK; walk C12 (Firefox 159). |
| 585 | In Firefox, turn on “Access local files on your computer” under Peekover’s Permissions and data in about:addons. | Page-failed fallback, Firefox half (new) | As 26. | Added 9.2b | — | HUMAN 2026-11-11: OK |
| 590 | Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its permission for at least one of them is turned off. | Section "Raw files on the web", off state (new) | Measured on Firefox 159 (one host revoked through permissions.remove). | Added 8.1f | — | HUMAN 2026-11-11: OK; CC's Firefox 159 measurement (8.1f). |
| 591 | Turn them on under Peekover’s Permissions and data in about:addons. | Same, the step (new) | The raw-site entries listed on that tab, Firefox 159. | Added 8.1f | — | HUMAN 2026-11-11: OK; CC's Firefox 159 measurement (8.1f). |

## Batch 6 — The website (`site/index.html`)

Before 9.2, no sentence on the site had changed since you approved it at 9.1 (only a colour token, 8.1j `--faint`). On 2026-11-11 your copy approvals changed two: 183 (C-1) and 434 (the go-live tense). Both were checked at 414 px. The other rows are here for their evidence or their flags.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 183 | For files on your disk, turn on “Allow access to file URLs” for Peekover in Chromium-based browsers, or “Access local files on your computer” in Firefox (about:addons → Peekover → Permissions and data). | Setup, "Flip one switch" | PERMISSIONS.md's file:// note. | Re-worded 2026-11-11 (C-1) | Resolved by C-1: names Firefox's setting. | HUMAN 2026-11-11: OK (C-1, 414 passed). |
| 82 | Firefox has some limits; the README lists them. | Watch mode card | watchAvailability (the Firefox cases); the README's "Limits". | unchanged | Points Firefox users to the README for limits. Enough, now that Firefox needs a setting for files from disk (see 183)? | HUMAN 2026-11-11: OK (C-1b, no change). |
| 112 | Markdown files opened from disk, and raw files on GitHub, GitLab and Bitbucket. | Sources card | Content-script matches. Evidence still reads "the Firefox half PENDING SIGNED INSTALL (9.2)". | unchanged | STALE EVIDENCE: closed at 9.2b (it works with the setting on). The agent updates the note; the sentence holds. | HUMAN 2026-11-11: OK |
| 185 | Open a markdown file from disk or a raw link, or open the app page from the toolbar button and pick a folder. | Setup, "Peek" | As 112. | unchanged | STALE EVIDENCE, as 112. | HUMAN 2026-11-11: OK |
| 209 | Markdown files opened from disk | Feature list, Rendering | As 112. | unchanged | STALE EVIDENCE, as 112. | HUMAN 2026-11-11: OK |
| 110 | The whole extension is under 7 MB. | "Never a blank page" card | The ledger figure is `.output` 5,831,081 B, measured 2026-11-01 (task 1.4). | unchanged | NUMBER MOVED: the local `.output/chrome-mv3` from 2026-11-10 reads 6,659,448 B (not a measurement of record). Still under 7 MB, but the headroom is down from ~1.17 MB to ~0.34 MB. 9.5 re-measures; the ledger figure is stale. | HUMAN 2026-11-11: OK (6,659,446 B under 7,000,000). New guard: tests/extensionSize.test.ts fails above 6,900,000 B; GO-LIVE 0.5 runs it on the release commit. |
| 77 | Coding agents write CLAUDE.md files, specs, plans and changelogs faster than anyone can read them raw. | "For agent output" section | The problem the product addresses, not a product claim (product spec §3). | unchanged | Rhetoric ("faster than anyone can read them raw"). Fine as framing? | HUMAN 2026-11-11: OK (framing, not a product claim). |
| 138 (+ 71, 136, 137, 154) | There is no backend, no database and no account. | Security section; hero strip; receipt | "No backend exists in the repository", an absence checked by reading, not by a test. | unchanged | ABSOLUTE ("no backend, no database and no account"). | HUMAN 2026-11-11: OK (flag 9). |
| 172 (+ 145, 153, 158, 160, 173, 176, 188) | No price, no tiers No “Pro” version, no locked features, no trials. | "Free means free" section; receipt | AGENTS.md rule 6, a project rule rather than a test. | unchanged | ABSOLUTE ("no locked features", "Price $0"). True by your own rule. | HUMAN 2026-11-11: OK (flag 9). |
| 161 (+ 179, 180, 181) | Not in stores yet — build from source | Hero, receipt footer, Setup "Build" | "Not in stores yet": no listing exists. Each carries UPDATE AT GO-LIVE. | unchanged | True today, false the day a listing goes live. GO-LIVE 8.2 swaps them for the store links. | HUMAN 2026-11-11: OK (GO-LIVE 8.2 swaps them). |
| 434 (+ 63, 64, 70, 187, 196, 197, 198, 199, 200, 554) | For the first public release: listings in the Chrome, Firefox and Edge stores, and attestations on release files. / GitHub (https://github.com/mosuvo/peekover) Not in stores yet — build from source / Agent output Reading Editor Security Planned GitHub (https://github.com/mosuvo/peekover) / Not in stores yet — build from source Build it from the repository (https://github.com/mosuvo/peekover#build-from-source) See everything ↓ / Not in stores yet — build from source GitHub (https://github.com/mosuvo/peekover) / github.com/mosuvo/peekover (https://github.com/mosuvo/peekover) / SECURITY.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/SECURITY.md) / PERMISSIONS.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/PERMISSIONS.md) / Releases (https://github.com/mosuvo/peekover/releases) / Report a bug (https://github.com/mosuvo/peekover/issues) / The same text is in the repository as docs/trust/PRIVACY.md (https://github.com/mosuvo/peekover/blob/main/docs/trust/PRIVACY.md). | Planned section, nav, footer links, privacy page | Live at release: the repository and peekover.dev are not public yet. | live at release / planned — unchanged | The repo links 404 for visitors today (private repo). | HUMAN 2026-11-11: OK (434 re-worded by copy approval); the link group OK, live at release. |
| 129 (+ 130, 132) | PLANNED / Not built yet. / Later, not yet scheduled: on-device and bring-your-own-key AI features, DOCX and ZIP export, publishing, presentation mode, read-aloud, and other raw file types such as JSON, YAML, TOML and CSV. | Planned section | Planned (tasks 7.4 / 7.5; spec §6 out of scope). | live at release / planned — unchanged | — | HUMAN 2026-11-11: OK |

## Batch 7 — README (`README.md`)

Seen once the repository is public. Edits since the 9.2 prep: row 26 (9.2b), and on 2026-11-11 row 25 (C-7a) and row 36 (withdrawn: the go-live tense).

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 26 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Limits | Measured on the AMO-signed 0.0.9, Firefox 159. The 153 floor is pinned by a test. | Re-worded at 9.2b (replaced "has not yet been checked on a real install") | — | HUMAN 2026-11-11: OK |
| 25 | In Firefox, on the app page, watching works for a folder dragged in and isn't offered for one chosen with the folder picker. | Limits | watchAvailability + the drag browser test + your hand checks ("drag: works as tested", "picker: fresh"). | Re-worded 2026-11-11 (C-7a) | Resolved by C-7a: isn't offered. | HUMAN 2026-11-11: OK (C-7a landed). |
| 2 | It works on markdown files opened from your own disk and on raw files from GitHub, GitLab and Bitbucket. | Intro, 2nd sentence | Content-script matches. Evidence still says "the Firefox half PENDING SIGNED INSTALL (9.2)". | unchanged | STALE EVIDENCE: closed at 9.2b. The Firefox caveat is row 26. | HUMAN 2026-11-11: OK |
| 8 | Renders markdown files opened from disk (.md and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | Features | As 2. | unchanged | STALE EVIDENCE, as 2. | HUMAN 2026-11-11: OK |
| 22 | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Limits | PERMISSIONS.md's file:// note. | unchanged | As 457: site access (8.1f) can also block local files. | HUMAN 2026-11-11: OK (as 457). |
| 41 | To load it in Chrome or Edge, turn on Developer mode on the extensions page and choose "Load unpacked" with .output/chrome-mv3. | Build from source | The browser's own Load-unpacked flow. "Walked by the human at 8.1": the Chrome walk notes (1–15) were loaded this way. | unchanged | — | HUMAN 2026-11-11: OK |
| 42 | To load it in Firefox, open about:debugging, choose "This Firefox", then "Load Temporary Add-on", and pick .output/firefox-mv3/manifest.json. | Build from source | The browser's own temporary add-on flow. "Walked by the human at 8.1". | unchanged | EVIDENCE NOT YET TRUE: tasks.md 8.1 says "Firefox's current build not yet walked". Walk section C (Load Temporary Add-on) is what makes it true. | HUMAN 2026-11-11: OK (walk C12–C16). |
| 45 | It is free: there is no price, no paid tier and no ads. | Licence | AGENTS.md rule 6. | unchanged | ABSOLUTE, as the site's free rows. | HUMAN 2026-11-11: OK (flag 9). |
| 4 (+ 32, 33, 36, 37, 38, 432) | Peekover is not in any browser store yet. | "Not in any store yet"; Planned list | True until go-live; planned items named by tasks / spec §6. | live at release / planned — unchanged | 4 flips at go-live: GO-LIVE 8.2 swaps the README store lines for the store links. | HUMAN 2026-11-11: OK (row 36 withdrawn earlier today by copy approval). |

## Batch 8 — CHANGELOG (`CHANGELOG.md`, "0.1.0 - Unreleased")

It mirrors the README. Edits since the 9.2 prep: rows 328 and 335 (9.2b), and on 2026-11-11 rows 334 (C-7a) and 324 (C-7b).

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 328 | Needs Chrome 121 or later, or Firefox 153 or later. | Added | wxt.config.ts (Chrome 121, Firefox 153.0); browserFloor.test.ts (MDN data: isAllowedFileSchemeAccess is the binding feature). | Floor raised from 127 to 153 at 9.2b | — | HUMAN 2026-11-11: OK |
| 335 | In Firefox, files opened from disk need one setting: "Access local files on your computer", under Peekover's Permissions and data in about:addons. | Known limits | As README 26. | Re-worded at 9.2b | — | HUMAN 2026-11-11: OK |
| 334 | In Firefox, on the app page, watching works for a folder dragged in and isn't offered for one chosen with the folder picker. | Known limits | As README 25. | Re-worded 2026-11-11 (C-7a) | Resolved by C-7a. | HUMAN 2026-11-11: OK (C-7a landed). |
| 312 | Renders markdown files opened from disk (`.md` and similar extensions) and raw files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket. | Added | As README 8. | unchanged | STALE EVIDENCE, as 2. | HUMAN 2026-11-11: OK |
| 331 | In Chromium-based browsers such as Chrome and Edge, files opened from disk need the extension's "Allow access to file URLs" setting turned on. | Known limits | As README 22. | unchanged | As 457 (site access). | HUMAN 2026-11-11: OK (as 457). |
| 324 | On the app page, a Stored data panel lists what Peekover keeps on your device, except one small mark (that you closed the note about snapshots), and "Wipe all data" erases all of it. | Added | store.ts: no panel line for the notices row (your 6.2a choice; wording approved at 9.2). | Re-worded 2026-11-11 (C-7b, your variant) | Resolved by C-7b. | HUMAN 2026-11-11: OK (C-7b landed). |
| 325 | A setup guide opens once, when Peekover is first installed, and the app page links to it. | Added | background.ts (install only, at most once) + tests. "A store install is walked at 8.1". | unchanged | EVIDENCE OVERSTATED, as 303: no store install before go-live. The AMO-signed install did confirm it on Firefox ("opens once, not again": TRUE). | HUMAN 2026-11-11: OK; store install checked at GO-LIVE 8.3. |

## Batch 9 — PERMISSIONS.md (`docs/trust/PERMISSIONS.md`)

Not a ledger surface: `tests/permissionsLedger.test.ts` pins it instead, so its passages have P-ids, not row numbers. Every passage below was edited by 9.2b or 8.1f, or carries a moved number.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| P1 | "`extension.isAllowedFileSchemeAccess()` (both builds) — reads whether the user has turned on "Allow access to file URLs" (Chromium) or "Access local files on your computer" (Firefox 153+) for Peekover, so the page can say whether local files will open." | Setup guide section, line 149 | Firefox 153+ exposes the same read; both bundles are checked by onboarding.test.ts. | Rewritten at 9.2b (was "Chromium build only"; your approval "APPROVED as proposed") | — |  |
| P2 | "`permissions.contains({ origins })` and `runtime.getManifest()` (both builds; added M13 / walk fix 8.1f) — read whether Peekover still holds the sites its content script runs on, so the page does not say "on" while the browser withholds them." | Setup guide section, line 156 | Measured with `permissions: []` on Chrome 157, Chromium 149 and Firefox 159 (decisions.md, "M13 TASK 8.1f"). | Added at 8.1f | The bullet reads two APIs and asks for no permission. Confirm the plain-English reason reads clearly. |  |
| P3 | "In Firefox (153+) the matching setting is "Access local files on your computer", on Peekover's Permissions and data tab in about:addons." | "file:// access note", line 253 | As README 26. | Added at 9.2b (your approval) | — |  |
| P4 | "both built manifests are byte-identical before and after it (833 / 949 B, `permissions: []`, …)" (and the same figures in the install section) | Lines 147 and 182 | A point-in-time count from task 6.1. | unchanged | NUMBER MOVED: the built manifests now read 864 / 978 B (local `.output`, 2026-11-10). The "before and after" claim was true when it was made, but the numbers read as current. Re-word as "at 6.1", or update them? | Done 2026-11-11 (evidence only, not a verdict on copy): now 864 / 978 B in both places (the number change approved by your ruling). |
| P5 | "Measured on a command-line-loaded Chromium 149 (`--load-extension`): every browser start reports `"install"` for such an install; a store install is expected to report it once — the 8.1 walk checks it." | Install section, line 185 | "A store install is expected to report it once — the 8.1 walk checks it." | unchanged | EVIDENCE OVERSTATED, as 303 (no store install before go-live). The signed Firefox install showed it once. | Done 2026-11-11 (evidence only, not a verdict on copy): now "unpacked install walked (8.1); store install checked at go-live (`docs/store/GO-LIVE.md`, step 8.3)", per your ruling. |

## Batch 10 — SECURITY.md (`docs/trust/SECURITY.md`)

Edits on 2026-11-11 (copy approval, the go-live tense): row 47 cut, row 48 linked to the issues page, row 339 ("The privacy policy, published at https://peekover.dev/privacy/.") re-worded. Row 339 is not listed below: before today it was test-pinned and counted auto.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 46 (+ 47, 48) | Report security problems through GitHub private vulnerability reporting on this repository. / That channel opens when the repository becomes public at the first release; until then the repository is private. / For anything that is not a security problem, open a GitHub issue (https://github.com/mosuvo/peekover/issues). | Reporting | Private vulnerability reporting and issues open when the repository goes public (GO-LIVE turns them on). | live at release / planned — unchanged | No response-time promise is made, by design. | Row 47 CUT and row 48 re-worded (linked to the issues page) 2026-11-11, copy approval. The rest: your batch 10 read. |
| 55 | CI fails on a known advisory in the production dependencies, except one recorded exception in a dependency of the diagram library. | What CI checks | supply-chain.yml (`pnpm audit --prod --audit-level low`); package.json has exactly one ignoreGhsas entry, GHSA-238p-pmpm-9mq7 (checked today). | unchanged | "one recorded exception" is still one, and still needed: `pnpm audit --prod` on 2026-11-11 found 1 low advisory, 1 ignored (exit 0). |  |
| 59 | Build attestations on release files. | Planned | release.yml: the attest job runs only for a public repository. | live at release / planned — unchanged | — |  |

## Batch 11 — THREAT-MODEL.md (`docs/trust/THREAT-MODEL.md`)

No edit since the 9.2 prep. The rows here are statements of scope (judgements) rather than test-backed claims.

| Row | Published sentence | Where | Evidence | Changed since review | CC flag | Status |
|---|---|---|---|---|---|---|
| 378 | What you read: nobody should learn through Peekover what you read, or that you read it. | Assets | An asset statement, resting on the zero-network default (SECURITY 51). | unchanged | ABSOLUTE ("nobody should learn"), but framed as a goal ("should"). | ABSOLUTE OK (HUMAN 2026-11-11, flag 9) |
| 381 | A website you visit, which might try to reach Peekover. | Adversaries | No `externally_connectable`; pinned at 9.2 in both engines' manifests (red-first). | Pin added at the 9.2 prep (after your last read) | — |  |
| 402 | A browser, operating system or device that is already compromised. | Not defended | Out of scope by statement. | unchanged | — |  |
| 403 | Other extensions you install. | Not defended | Out of scope by statement. | unchanged | — |  |
| 404 | The sites that host images, once you choose to load them. | Not defended | After the opt-in, the browser fetches. | unchanged | — |  |
| 405 | Someone who can use your device or read your browser profile: Peekover's storage is not encrypted. | Not defended | store.ts: plain IndexedDB rows, no encryption. | unchanged | — |  |
| 406 | A change to a file in the instant between Save's check and its write. | Not defended | PERMISSIONS.md: "the check and the write are two steps". | unchanged | — |  |
| 407 | Build attestations on release files, from the first public release, so that a download can be checked against the source. | Planned | release.yml attest job, public repository only. | live at release / planned — unchanged | — |  |

---

*Built from the ledger at `fc02f4d`. The generator asserts that every listed row exists, is published (not withdrawn),
belongs to an in-scope surface and appears once, so the auto-pinned counts are the ledger minus this list.*
