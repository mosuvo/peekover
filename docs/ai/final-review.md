# M13 — the end-of-round review pack

*Written 2026-11-07, after tasks 9.3–9.5 (`decisions.md`: "M13 TASK 9.3 — captures", "M13 TASK 9.5"; `retro.md`: "M13
retro"). Every step left in M13 that needs you, in the order to do them, in one document. By your ruling of 2026-11-07
("I will walk at the very end, after group 9.") the walk comes after group 9, so steps 2–4 can change each other. The
order below keeps re-work to a minimum.*

**Total time: about 4¾–6 hours of your time**, best split into four or five sittings, plus up to a day of waiting for
Mozilla to sign the test build:

| Step | What | Your time | Blocks |
| --- | --- | --- | --- |
| 1 | The Firefox signed install | ~20 min to submit (+ AMO's wait, up to 24 h) + ~5 min to read the result | the release BLOCKER; step 2's item I-3 |
| 2 | The 8.1 design walk | ~3–4 h (three sittings) | go-live; may re-open 3 and 4 |
| 3 | The 9.2 truth sign-off | ~60–75 min | go-live |
| 4 | The 9.3 screenshot pick | ~15 min | go-live (Chrome needs ≥ 1 screenshot) |
| 5 | Two proposals from the retro | ~5 min | nothing; next milestone |

**How any decision is recorded.** Reply to the agent in your own words. The agent banks each one verbatim in
`docs/ai/decisions.md` as a HUMAN RULING, in the commit that acts on it. Nothing below is decided until you write it.

---

## 1 · The Firefox signed install (do this FIRST: it is the release blocker, and it waits on Mozilla)

**Status now: the signed `.xpi` is NOT saved yet** (`D:\Dev\peekover-amo-test\` holds the zips and `AMO-STEPS.md`, no
`.xpi`). **This is the blocker.** Until a signed build is tested, the setup guide's "In Firefox, nothing needs setting
up." (ledger rows 296, 304) may be false, and rows 26, 335 and 500 plus the Firefox half of 2, 8, 112, 185, 209 and 312
stay PENDING SIGNED INSTALL.

**The exact step to finish it:** open `D:\Dev\peekover-amo-test\AMO-STEPS.md` and do steps 1–10, click by click (sign
in with 2FA → Submit a New Add-on → **On your own** → upload `peekover-0.0.9-firefox.zip` → source code **Yes** →
`peekover-0.0.9-sources.zip` → Continue → wait for the "signed" email → download the `.xpi` into that folder). If the
validator shows errors or warnings, **paste every message to the agent and change nothing**.

**Then say "the signed .xpi is saved".** The agent runs the kit's step 11 before anything else: a fresh Firefox profile
with the signed install, then (a) does a local `file://` `.md` open in Peekover's reader, (b) does the setup guide open
on install and not again after a restart, (c) do the folder picker and drag routes work, with one more check found at
9.3 (d): **on a dragged folder, does the pane's note say "Watch mode … unavailable" while Watch is offered?** (Read in
the code at 9.3, never seen in an engine; `decisions.md` "M13 TASK 9.3 — captures".)

**What the result decides:**
- **Firefox renders `file://`:** rows 26 / 296 / 304 / 335 / 500 are re-worded to say it works (the agent proposes the
  words, you approve them in step 3) and the BLOCKER closes.
- **It does not:** onboarding gains a Firefox branch as a discovered task (tasks.md 8.1, §9-6: detection or
  instructions, **no new permission**, or a STOP if one would be needed), and those rows say what is true.

**Record:** say "the signed .xpi is saved" (the agent reports a / b / c / d and banks them). If AMO rejects the build,
paste the message.

---

## 2 · The 8.1 design walk (~3–4 h)

**Start here: `docs/ai/walk-8.1.md`.** Its one-page guide, the live items (I × 11, II × 10, III × 6, IV × 2) and the
table (36 surfaces × 16 cells, 169 pre-filled "proposed: …"). Three sittings: **A** the live checks (~60 min), **B** the
app page from the screenshots (~90 min), **C** the tab reader, contrast and the pending lists (~45 min).

**What changed since walk-8.1.md was written (2026-11-07, at `67ce7b9`):**
- **The build is the same bytes.** HEAD's Chrome and Firefox zips hash to the ones the walk was prepared on
  (`9ed349c2…` / `d74715ca…`); every commit since is records only. The screenshots in `D:\Dev\peekover-shots\8.1\`
  still stand.
- **The guide's "What happens after" is out of date.** Fixes now run AFTER group 9, not before (your ruling), and each
  one re-runs the 9.x work it touches (section 5 below).
- **Item I-3 (the Firefox `file://` check) is step 1's result.** If step 1 is done, confirm it. If not, do it here
  with `scripts\walk-profiles.ps1 -Browser firefox-signed -Xpi <file>`.
- **Item I-11(b) (Firefox drag route): look for the note in 1(d).**
- The named checks still stand: Editing, the Watching pill, the snapshot notice, the Compare picker, the ≤ 1189 px
  Files overlay (their mock approval used the agent's self-check, not your eye); the two-row toolbar for an agent file
  at 1280; the reader's untouched surfaces in both themes; both pending lists (2.2's contrast census, 5.1's
  native-control sweep: both EMPTY, nothing to accept by name unless you add a row).
- **The release dry run (G-9):** already run and green at 7.4 / 7.4a (`decisions.md` "M13 TASK 7.4a": two runs, build
  green, attest skipped while private, `sha256sum -c` OK). Confirm it, or run it again from Actions → Release →
  **Run workflow** with **dry_run** ticked.

**Record:** in `docs/ai/walk-8.1.md`, every cell gets its own verdict: **matches**, **differs by ruling** (name the
ruling) or **fix** (one line: what, where). Never one verdict for a group of cells. Then tell the agent "the walk is
done".

---

## 3 · The 9.2 truth sign-off (~60–75 min)

**What you are signing:** every published sentence matches `docs/store/claims.md` (the ledger, 579 rows). At 9.2 the
agent re-verified every row's evidence at HEAD (0 problems; its control found 3 / 3 planted faults). Your part is
reading, as a person would. **Do it after the walk:** a walk fix can change a sentence, and after the walk you read
each text once.

For each text, **read it top to bottom once**, then give a second look to the sentences below.

| Text | Read | The sentences worth a second look |
| --- | --- | --- |
| `README.md` | ~10 min | Row 3 "It asks for no browser permissions and makes no network requests unless you ask it to." · Row 25 "In Firefox, on the app page, watching works for a folder dragged in but not for one chosen with the folder picker." (compare 1(d)) · Row 26 "Opening a markdown file directly from disk in Firefox has not yet been checked on a real install." (step 1 rewrites it) · Row 17's list of 13 languages |
| `site/index.html` (+ `site/privacy/`) | ~15 min | Row 112 / 185 / 209 (files "opened from disk": the Firefox half is step 1's) · Row 434 "For the first public release: listings … a privacy policy at https://peekover.dev/privacy/ and this website at https://peekover.dev, neither online yet." (true until go-live; GO-LIVE 3.6 turns all 31 "live at release" rows) · the footer line (approved at 9.1) |
| `docs/trust/SECURITY.md` | ~5 min | "Report security problems through GitHub private vulnerability reporting on this repository." (it opens when the repository is public: GO-LIVE turns it on) · "CI fails on a known advisory … except one recorded exception in a dependency of the diagram library." (the ignored low advisory, GHSA-238p-pmpm-9mq7) · no response-time promise is made, by design |
| `docs/trust/PRIVACY.md` | ~10 min | Row 354 "Folders you open: their names, and in Chrome and Edge the browser's access to the folder, so you can reopen it in one click." · "except the mark…" (the snapshot notice's dismissal) |
| `docs/trust/THREAT-MODEL.md` | ~10 min | Row 381 "A website you visit, which might try to reach Peekover." (`externally_connectable` now pinned absent) · the "gaps" section, which says what is NOT defended |
| `CHANGELOG.md` | ~5 min | Row 324 "…a Stored data panel lists what Peekover keeps on your device, except the mark for the note about snapshots…" (re-worded at 9.2) · Row 335 (the Firefox line; step 1) |
| `docs/store/chrome.md` | ~5 min | The data-usage answer "Website content only" (your 7.5 ruling) · the summary = the manifest description |
| `docs/store/firefox.md` | ~5 min | Row 477 (what it renders: note "files opened from disk" is absent on purpose until step 1) · Row 500 (the Firefox line; step 1) |
| `docs/store/edge.md` | ~5 min | Same text as Chrome's; the 6-screenshot limit (Microsoft's page, re-checked 2026-11-07) |
| The setup guide (`src/app/onboarding.ts`) | ~3 min | Rows 296 / 304, "In Firefox, nothing needs setting up." (**the blocker**; step 1) |

**Record:** "9.2 signed off" or a list (e.g. "cut row 434", "reword row 25 to: …"). The agent applies the cuts in one
commit, re-runs `truthPins.test.ts`, and ticks 9.2 when no PENDING row is left.

---

## 4 · The 9.3 screenshot pick (~15 min)

**Open `D:\Dev\peekover-shots\9.3\contact-sheet.png`** (or `contact-sheet.html` in a browser for the full-size files).
22 captures at 1280×800 from HEAD's build, the sample `docs/store/assets/sample.md` (a neutral "Search index rollout"
plan, with no sentence about Peekover). **01–12 are candidates** (Chromium). **13–22 are Firefox drawing references,
not for a store:** the capture harness opens a live folder handle, which only Chromium has, so they leave out the
read-only-snapshot note every Firefox user sees.

**The stores' limits** (each store's own page, re-checked 2026-11-07): Chrome Web Store **1–5** (1280×800 or 640×400) ·
Edge Add-ons **0–6** (1280×800 or 640×480) · AMO **no practical limit**, 1280×800 / 1.6:1.

**The agent's suggestion (yours to change):**
- **Chrome (5):** **01** reading (light; first impressions) · **08** table + diagram (dark) · **03** math + code (light) ·
  **06** a file opened from disk in a tab (light) · **10** the agent file (dark).
- **Edge (6):** the same five + **05** the editor (light).
- **Firefox (AMO): none of these.** After step 1, the agent re-captures Firefox the way a Firefox user sees it: the tab
  reader if `file://` renders, and the picker route's folder pane, by hand during the walk if the script cannot drive
  it. You pick again from those. AMO can take the listing without screenshots until then (Extension Workshop gives no
  minimum).

**Record:** "Chrome: 01, 08, 03, 06, 10; Edge: …; AMO: wait" (any numbers). The agent copies the picks into
`docs/store/assets/` (store-named), records them, and adds the unit size check over them. A walk fix that changes a
picked surface re-captures it, and you confirm the new file.

---

## 5 · After all four: what the agent does next

1. **Bank your words.** Step 1's result, the walk's verdicts, the 9.2 sign-off, the 9.3 pick: each a HUMAN RULING in
   `decisions.md`.
2. **Fix tasks.** Each walk "fix" becomes **8.1a, 8.1b, …** in `tasks.md`, run one by one with the full Verify
   (lint, unit, both engines' browser suites, bytes against 9.5's ledger, `permissions: []`, golden EMPTY). A Firefox
   `file://` failure in step 1 adds the onboarding Firefox branch (or a STOP if it needs a permission).
3. **Re-check what the fixes touched** (the accepted cost in `progress.md` "Up next"):
   - **9.1 / 9.2:** every ledger row whose surface a fix changed (above all the Firefox `file://` rows); you re-sign
     those rows only.
   - **9.3:** re-capture with `pnpm exec tsx scripts/capture-screenshots.ts` every picked shot a fix touched, or ALL
     of them for a token, font or toolbar-wide fix. You confirm or pick again.
   - **9.4:** the retro's "ADDENDUM AFTER THE 8.1 WALK" is written.
   - **9.5:** the byte ledger and the close figures are re-run (a fix adds bytes), the task count, golden's milestone
     diff, `spec-coverage.md` rows a fix moves, `AGENTS.md`'s milestone line; then the M13 close summary.
4. **Tick 8.1, 9.2, 9.3, 9.5; close M13** (`decisions.md` "M13 CLOSED").
5. **Go live: `docs/store/GO-LIVE.md`**, 37 steps in order (0 gates → 1 accounts → 2 the repository goes public →
   3 the website → 4 the email address → 5 the release v0.1.0 → 6 the dashboards read against the files → 7 the
   stores → 8 after approval → 9 rollback). Section 0's gates are this document's steps.

---

## Optional · Two proposals from the retro (~5 min; they change the next milestone, not this one)

`retro.md` "M13 retro" proposes two rules it did not place, because they are yours to make:
- **(a) Engine-only human checks happen in the group that needs them** (a signed install, a walk of a new surface), and
  only the final look is left for the end. (M13 batched them; the cost is in 9.3's Firefox captures and the 9.x
  re-runs above.)
- **(b) A claim-bearing in-app string gets a test pinning it to the state it is shown in.** (It reverses part of your
  9.2 ruling "Checked, not ledgered"; step 1(d) is the case that prompts it.)

**Record:** "(a) yes / no", "(b) yes / no". A yes is placed in `WORKFLOW.md` or `AGENTS.md` at the start of the next
milestone.
