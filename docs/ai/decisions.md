# Decisions — Peekover
*Append-only. Newest first. Format: date · decision · why · revisit-when.*

- **2026-11-01 · M13 TASK 1.4 — CI green on Linux (DISCOVERED; landed on `claude/loving-turing-bpgzi0`).** Implements the
  ruling below, red-first on both engines in the Linux cloud session.
  - **(1) diffChrome lane, PRODUCT.** `CONTAINED_CSS`: `.peekover-diff-affordance{…anchor-name:--peekover-diff}` and
    `.peekover-remote-load{left:calc(anchor(--peekover-diff right,-8px) + 24px)}` — CSS anchor positioning, no JS. It
    needs the pill before the opt-in in tree order (`mount()` pushes diff chrome first) — probed on both engines first.
    With no laid-out pill the fallback puts the opt-in at 16px, its READER_CSS slot. New test: the pill widened
    font-independently (min-width 320px) must keep a 24px gap and not overlap; red at HEAD (gap 14.77), green after at
    1280 and 1400, the rule ablated → red. CI's exact rects reproduced at HEAD with DejaVu Sans forced; green after.
    **One test edit beyond "the test is unchanged", ruled by the human mid-task:** the existing lane test stored the
    opt-in's rect in the "Compare" state and reused it after the label widened; the anchored opt-in moves (473 → 529), so
    the rect went stale. It now re-reads the rect. Property unchanged.
  - **(2) header, PRODUCT, minimal.** `flex-wrap:wrap` on `.peekover-app__header` (APP_CSS, app page only); rationale in
    the doc comment above APP_CSS, naming group 4's toolbar as its successor. New
    `tests/browser/appHeaderNarrow.browser.test.ts` (414 × 896 and a 1280 control): red at HEAD (Export [390,41,454,71]
    past 414, both engines), green after; editorUnsaved's inert case green; ablated → both red.
  - **(3) copyAsHtml, TEST.** The wait matches "Body of alpha.md.". CI's order pinned with a scratch sequencer: HEAD went
    red 1 in 9 bare (a race), 2 of 3 with copyAsRichText's leftover seeded before the click; the fix: 3 of 3 green with the
    seed. Removed from `progress.md`'s known-flakes list.
  - **(4) golden ~1 MB, TEST.** `{ timeout: 30_000 }` on that case: 6.0–6.5 s measured on the 4-CPU cloud host, under 5 s
    on Windows and CI; 30 s is about 4.6× the slowest run, so a hang still fails. Red at HEAD (6.47 / 6.01 s), green
    after; the SHA-256 pin unchanged.
  - **(5) perf budget** unchanged; timings recorded in `progress.md` (§ Carried items 4).
  - **Bytes** (clean two-engine build against a same-session HEAD rebuild, which reproduced `b0ff62df` / `3413dae0`):
    content script 344,195 → **344,266 B (+71 = `anchor-name` 29 + `left` 42)**, md5 `2ef5a824…` / `47017c73…`; app chunk
    532,048 → **532,135 B (+87 = the same 71, since `readerCss.ts` is on both graphs, + `flex-wrap:wrap; ` 16)**. No other
    file changed size or content beyond chunk-name hashes. `.output` 5,831,017 / 5,831,133 B; zips 1,842,849 / 1,842,907 B;
    manifests 654 / 770 B; `permissions: []`. Far under G-7's +2 KB; the 26-site `:host` pin untouched.
  - **Verify:** lint 0 · unit 1421 / 1422 (the perf flake, red on both runs in the full suite, green alone) · full browser
    suite alone 1967 passed / 2 failed / 51 skipped (344 s). **Both reds are outside the known flakes:** diagramActions "is
    REVEALED by keyboard focus" (Cr+Fx), the group's starting opacity 0.16 / 0.156. PRE-EXISTING: with HEAD's production
    files restored, the same pinned Firefox order went red 2 of 5 (with 1.4, 1 of 4); 54 / 54 alone. The human chose to
    commit and list it as a flake, UNRULED. Golden EMPTY · `pnpm audit --prod` EXIT 0, 2026-11-01.
  - **Flagged:** the ruling named "AGENTS.md's known-flakes list" — there is none in AGENTS.md; the list is
    `progress.md` § Carried items 4, updated there; AGENTS.md unchanged.
  Revisit-when: group 4's toolbar replaces the header (drop the wrap rule with it); task 2.4 lands Bricolage (re-measure the
  lane — it is now font-independent by construction); the human rules on the diagramActions flake.

- **2026-11-01 · M13 RULING — the Linux reds (HUMAN).** On the cloud environment check's findings: (1) diffChrome
  remote-load lane — PRODUCT: position the notice from the comparison pill's laid-out edge, not a fixed 176px; prefer CSS
  (one lane, the 24px gap) over JS measurement; the test is unchanged. (2) editorUnsaved, header at 414px — PRODUCT,
  minimal: the app header wraps (or otherwise keeps every control inside the viewport) at narrow widths; CSS only, app
  page; group 4's toolbar supersedes it. (3) copyAsHtml — TEST: wait for this fixture's own "Body of alpha.md."; remove it
  from the known flakes. (4) golden ~1 MB — TEST: a per-test timeout long enough for slower runners; the SHA-256
  unchanged. (5) the pipeline.perf budget (100 ms) — UNCHANGED, a known flake, re-run on a red. All of it runs now as a
  DISCOVERED task 1.4 "CI green on Linux", before 1.2, on this branch; count 40 → 41. Why: CI on `main` is red, and every
  red was a Linux-only condition the Windows runs could not show. Revisit-when: group 4 (the header) and 2.4 (fonts).

- **2026-11-01 · M13 CLOUD ENVIRONMENT CHECK — the first Linux cloud session, before any M13 task. Records only; no
  production, test or config byte changed. Three browser reds reported with proposed fixes; nothing fixed — the human
  rules.** Checkout `main` `ea856df`, tree clean. Ubuntu 24.04.5, Node v22.23.4 (`.nvmrc` 22), pnpm 10.33.0
  (`packageManager`), Playwright 1.61.1 with Chrome for Testing 149.0.7827.55 and Firefox 151.0. The first browser
  download was refused (`cdn.playwright.dev`, not allowlisted); the check stopped and was resumed after the human
  allowed `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`. Exits: frozen install 0 (lockfile
  unchanged) · `pnpm audit --prod` 0 (2026-11-01) · lint 0 · unit 1 (1420 / 1422: the golden ~1 MB case at 6.1–6.5 s
  against 5 s, output SHA-256 still matching the pin, and the parse+sanitize perf budget, 93–136 ms against 100 — the
  host's speed; CI's unit step was green) · `sanitize.browser.test.ts` 0 on both engines · full browser suite 1 (3 failed /
  1950 passed / 59 skipped, 351 s).
  - **The kickoff's context was partly wrong, and the job log is the authority:** CI #18's 7 reds are copyAsHtml
    (Chromium) · diffChrome remote-load lanes at 1280 and 1400 (Chromium AND Firefox, 4) · editorUnsaved inert (Chromium
    AND Firefox, 2) — not all Firefox, and one is not layout.
  - **diffChrome (4; green here).** Font metrics: in DejaVu Sans (CI's fallback) the "Close comparison" pill is 160.10 px,
    so its right edge is 520.10 against the opt-in's 520.00 (CI's exact rects); in Inter (here) 145.23, a 14.77 px gap; on
    Windows (Segoe) 136. A 0.10 px overlap, so the strict test is right. The 176 px lane offset was derived from one OS's
    metrics. Proposed PRODUCT: place the opt-in off the pill's laid-out edge. Task 2.4 makes the face OS-independent on the
    app page; the offset must still be re-derived from Bricolage.
  - **editorUnsaved (2; reproduced).** The header does not wrap: at 414 px it is 454 (Cr) / 470 (Fx) px wide in Inter,
    so the Export control's centre is off-screen and `elementFromPoint` returns `null`. A user on Linux at that width
    sees Export clipped. Proposed PRODUCT: wrap or collapse the header at narrow widths. Task 2.4 fixes it only if
    Bricolage is 40–56 px shorter there (unmeasured).
  - **copyAsHtml (1; reproduced).** Harness-shared-state: the wait accepts any clipboard text containing `alpha.md`, and
    `copyAsRichText`'s fixture (run just before it on Linux) contains it. Green alone and paired. Proposed TEST: wait on
    `Body of alpha.md.`.
  - **Skips 59 vs 51:** 8 build-gated tests (`mathActions` ×2, `tableCopy` ×1, `diagramActions` ×1, per engine) skip
    with no `.output`; with it they ran (144 / 144).
  - **Linux build:** the clean two-engine build and zips are identical to the Windows snapshot on every recorded figure
    (`.output`, file count, zips, content-script md5 `b0ff62df…` / `3413dae0…`, app chunk, manifests). Recorded beside
    the Windows baseline in `progress.md`; neither is chosen. Bears on 7.3: no OS difference was found.
  Why recorded: CI on `main` is red, and the first cloud host differs from the Windows baseline in fonts and speed.
  Revisit-when: the human rules on the three reds, or task 2.4 lands (re-measure both layout cases in Bricolage).

- **2026-10-31 · HUMAN RULING — cloud sessions may push the agent's own branch; `main` stays the human's.** In the
  human's words: "From M13 onward, development may run in a cloud session. There the agent MAY push its OWN working
  branch (never main) so the human can review and merge it through a pull request (which runs ci.yml). Merging to main
  stays the human's. Locally, the never-push rule is unchanged." Why: a cloud session's commits exist only in that
  session until pushed, and a pull request is where the human reviews and where `ci.yml` (push-to-`main` +
  `pull_request` since M13 task 1.1) runs. The agent still never pushes `main`, never merges, never force-pushes.
  AGENTS.md's Workflow section carries the rule (it had no push rule of its own before; the never-push wording lived
  in each milestone's tasks.md header, e.g. `specs/013-first-release/tasks.md` line 9, and in M13 GATE 3's Q6).
  Same commit: the local-memory sweep — the lessons not already in AGENTS.md or a decisions entry moved into
  AGENTS.md's new "Verification traps" section; the Windows-only ones into its "Windows/Git-Bash local environment"
  note. Revisit-when: the human changes where development runs, or a branch-protection rule replaces this.

- **2026-10-31 · M13 TASK 1.1 — CI runs on push to `main`; pnpm comes from `packageManager`; Node 22 from one pin
  (`.nvmrc`); the Dependabot count is gone. Implements D-13, G-13 (F-4). No shipped byte changed.**
  - **Triggers.** `ci.yml` before: `pull_request` only. After: `push: branches: [main]` + `pull_request`. No double
    run — push is `main`-only, so a PR branch fires `pull_request` alone and a merge fires `push` once. The whole job
    runs on push, browser suite included (tasks.md asks for nothing lighter). `supply-chain.yml` already ran on push to
    `main` (unchanged); `ai-hygiene.yml` stays PR-only and has no pnpm step (F-4).
  - **pnpm: `"packageManager": "pnpm@10.33.0"`** — the local `pnpm --version` (10.33.0) that wrote the lockfile
    (`lockfileVersion: '9.0'`); `pnpm install --frozen-lockfile` EXIT 0 with it set, lockfile untouched. All four
    `pnpm/action-setup@v4` steps (`ci.yml` ×1, `supply-chain.yml` ×3) drop `with: version: 10`. The action's README
    (checked 2026-10-31) says `version` is optional when `packageManager` is set — *"Omit `version` input to use the
    version in the `packageManager` … field"*; it no longer documents the both-set-and-different error the plan cites,
    which is moot now that `version` is gone. Its README examples are at `@v6`; the pin stays `@v4` (a major bump is
    Dependabot's/a deliberate act, not this task's).
  - **Node: one shared pin.** `.nvmrc` = `22`; every `actions/setup-node` step reads `node-version-file: .nvmrc`
    instead of a literal `node-version: 22`, so CI and AMO's stated version have one source. `engines.node` is
    **`>=22`, not the tasks.md draft's `>=22 <23`** ("range confirmed at the task"): probed 2026-10-31, pnpm without
    engine-strict only WARNS on a root-engines mismatch (exit 0), so `<23` would print a warning on every local
    install — local development (and all of M12) runs on Node 24.11.1, so declaring 24 unsupported would be false.
    No `engine-strict`; the exact pin is CI's, and REPRODUCING.md (7.3) states it.
  - **Dependabot.** "FOUR runtime dependencies" → "a small set of runtime dependencies, each a governed addition"
    (plan wording); also "The four libraries that reach a user's browser" → "The libraries …" (a second copy of the
    same stale count, not named in tasks.md, caught on read-through; the test pins both spellings).
  - **Test: `tests/ciConfig.test.ts`** (5 cases, plain-text checks — no YAML parser is a direct dependency). Red at
    HEAD on all five, each on its own clause; green after. Ablation: removing the push trigger reds only that case.
  - **Next push:** CI (lint, unit, browser suite on both engines, build) and Supply chain run on `main` for the first
    time over the whole M12 tree. The human records the run at 8.1.
  - Why: D-13 — "every change is checked" is only true if `main` is checked; one version source per tool is the floor
    for 7.3's reproducibility claim. Revisit-when: Node 22 nears end of life (G-13), or the action pin moves to v5+.

- **2026-10-31 · M13 GATE 3 APPROVED — tasks 013 (`specs/013-first-release/tasks.md`) approved by the human, with the
  answers below to its Q1–Q6. 40 tasks, nine groups. Changes are dated gate-3 notes in tasks.md; the body is not
  rewritten.**
  - **Q1 YES** — the app page drops the pills in **4.5, with D-8**, and the band (D-7) is reclaimed in **4.6**. **No
    commit may lose a function or the capture disclosure.**
  - **Q2 YES** — `tests/ciConfig.test.ts`, `tests/truthPins.test.ts` and `specs/013-first-release/census.md` are
    authorized beyond plan §2's list.
  - **Q3 YES** — the splits; **40 tasks**.
  - **Q4 YES, WITH A CONDITION** — each pending list (2.2's contrast census, 5.1's native-control sweep) may only
    shrink, **AND by the design walk (8.1) it is either EMPTY or every remaining row is accepted by the human BY NAME in
    8.1's record. Nothing is carried out of M13 silently.** Added to 8.1's Verify as a gate-3 note.
  - **Q5 YES** — 2.2 stops and brings every contrast failure outside G-4/G-5 to the human as **ONE batched question**,
    before 2.3.
  - **Q6 YES** — when 7.4 lands, **the human pushes** (a `workflow_dispatch` workflow must be on the default branch to be
    run) and triggers the dry run; 8.1 records the result. The agent still never pushes.
  **Why:** the human's rulings at gate 3, all on the recommendations, Q4 with its condition. **Next:** task 1.1 in a fresh
  session. **Revisit-when:** a pending row cannot be fixed and the human declines to accept it at 8.1; the dry run fails.

- **2026-10-31 · M13 GATE 2 APPROVED — plan 013 (`specs/013-first-release/plan.md`) approved by the human, with the
  answers below to its §8 questions. Changes to the draft are dated gate-2 notes in the plan's §9; the body is not
  rewritten.**
  - **G-1 / Q15 — RESOLVED (domain).** peekover.dev **is registered** (human, 2026-10-31); the 2026-07-11 record
    stands (a dated note is added to the GATE 1 entry's Q15). For the first release: the site is **peekover.dev,
    served from GitHub Pages with the custom domain**; the privacy policy lives at a peekover.dev URL (the plan
    proposes `https://peekover.dev/privacy/`). Pointing DNS at Pages and turning the site on are **go-live steps,
    outside M13**; M13 prepares the Pages configuration and writes the URLs. **Until go-live no surface presents
    peekover.dev as already live:** the claims ledger marks each peekover.dev URL "live at release", and group 9's
    truth re-check plus a go-live checklist item verify each resolves before anything is published. **Email still
    unconfirmed:** `hello@peekover.dev` appears nowhere as a working channel until the human confirms a test message
    arrived (forwarding at the registrar — the human's step, a go-live checklist item); if confirmed later it becomes
    a second security channel and the contact address. **Security reports:** GitHub private vulnerability reporting
    (live when the repo goes public at release). **General contact:** GitHub issues. `gecko.id` unchanged.
  - **G-2** the app-built toolbar + one `mount()` option. **G-3** the indicator + Resource Timing. **G-4** the watch
    pill's text in ink; green on the dot and border. **G-5** information-bearing `--faint` text → `--muted`.
  - **G-6 YES, with conditions:** the fonts' OFL licence files ship in the package and are credited (README and a
    NOTICE file); the subset ranges are stated — at least Latin + Latin Extended — and the bytes measured in 2.4.
  - **G-7** report-only: stop and report above +2 KB on the content script per task. **G-8** "file-identical",
    worded exactly so everywhere. **G-10** install only. **G-11** scripted captures; the human picks. **G-12**
    decorative ticks only. **G-13** Node 22, stated in REPRODUCING.md (and the AMO sources README) for AMO's rebuild.
    **G-14** the additive `manifest.test.ts` edit is authorized. **G-15** the dismissal lives in its own
    app-page-only row.
  - **G-9 YES, one manual dry run — conditioned on attestations.** Verified 2026-10-31 against GitHub's docs: *"If you
    are on a GitHub Free, GitHub Pro, or GitHub Team plan, artifact attestations are only available for public
    repositories. To use artifact attestations in private or internal repositories, you must be on a GitHub
    Enterprise Cloud plan"* (docs.github.com/en/code-security/getting-started/github-security-features). The repo is
    private until release on a personal account, so **the attestation step is conditional** (runs only when the
    repository is public), is skipped in the dry run, and is proven at the real release; the plan and the release
    checklist say so.
  - **ADDED — a Firefox file:// check in the design walk (group 8):** open a local `.md` via `file://` directly (not
    the app page) on a fresh profile with the built extension. D-11's "Firefox needs no toggle" rests on a July
    record (`decisions.md` 2026-07-14) unverified for MV3; if access must be granted on Firefox, onboarding gains a
    Firefox branch as a discovered task.
  - **ADDED — a GO-LIVE CHECKLIST** collecting every human step after M13: DNS → GitHub Pages, the email test
    message, making the repo public, enabling private vulnerability reporting, the real release tag (and its
    attestation check), the store submissions. M13 writes it; the human runs it.
  **Why:** the human's rulings at gate 2. **Next:** `tasks.md` (gate 3) in a fresh session. **Revisit-when:** the
  email is confirmed; the plan changes to Enterprise Cloud (attestations on a private repo); the Firefox walk check
  finds a toggle.

- **2026-10-30 · M13 GATE 1 APPROVED — spec 013 ("a truthful, on-design first release",
  `specs/013-first-release/spec.md`) approved by the human, with the answers below to its §9 questions.**
  Where an answer changes the draft, the change is recorded in the spec as a dated gate-1 note (§10), not
  rewritten into the requirements.
  - **Q1** version **0.1.0**.
  - **Q2** `tokens.css` wins where the design files disagree (brand.html's `--accent-soft`, `--del`, night
    paper); **adopt the mockup's dark `--shadow`** (rgba(0,0,0,.5)) into `tokens.css`.
  - **Q3 + Q10 (fonts) — NO content-script byte ceiling is set now.** Default position for the §8-1 measurement:
    the **app page** loads all design fonts from the extension package (no `web_accessible_resources`, no
    network); the **file:// content-script reader** keeps its reading serif (Literata) and uses close-matching
    **system fallback stacks** for UI and code text, adding **no font bytes**. The measurement may argue
    otherwise only by bringing the numbers (bytes; first paint against the 165 ms gate and its ~15 ms headroom)
    to the human; a ceiling is set then, if at all.
  - **Q4** pin each code copy of the tokens to `tokens.css` with a test.
  - **Q5** keep R11 (two-tone editor palette). **Q6** sepia stays dormant. **Q7** keep the 748 px measure.
  - **Q8 — YES, merge the app page's chrome into the mockup's single toolbar, WITH A GUARD:** a static mock of the
    toolbar (both themes; 1440 / 1080 / 414) is approved by the human BEFORE any implementation (§8-2).
    **Authorization:** test re-spellings that follow from moved chrome are authorized per surface, each named
    with the property it protected kept (the R29(c) precedent).
  - **Q9 — YES, a quiet app-page status line, but every statement on it must be backed by a test;** anything that
    cannot be proven is left off.
  - **Q11** keep the TOC's behaviour, adopt the mockup's look. **Q12** at ≤ 1080 px the folder pane becomes an
    overlay behind a "Files" control.
  - **Q13 — one-time and dismissible, AND the same disclosure stays permanently reachable in the Stored data
    panel** (it is a trust disclosure).
  - **Q14** as recommended (code blocks keep Line numbers / Wrap / Copy, restyled; display math loses the code
    toolbar and keeps Copy LaTeX / MathML; table buttons styled from tokens).
  - **Q15** (a) **`hello@peekover.dev` — NOT CONFIRMED.** The human: *"I am not sure about this one yet as I am
    not gonna buy a domain for this at least now."* Under the spec's truth rule the address is treated as
    **not live**: no surface may present it as a working channel. The replacement channel is OPEN (GitHub private
    vulnerability reporting is the draft's fallback, usable once the repo is public); `plan.md` proposes, the
    human confirms. **★ FLAGGED, NOT RESOLVED:** this conflicts with the 2026-07-11 entry ("domain peekover.dev
    owned+verified"). The README's "Site: https://peekover.dev", the site's own URL and the privacy policy's
    home all depend on which is true — the truth pass must not assume either. (`gecko.id`
    `peekover@peekover.dev` is an identifier, not a mailbox, and needs no domain.) (b) **Repository public: YES,
    at release** — docs may link the repo; nothing in M13 may depend on it being readable before then.
    (c) The site **self-hosts its fonts: YES**.
    *Note added 2026-10-31 (gate 2), resolving the flag above without rewording either entry:* the human confirms
    **peekover.dev IS REGISTERED** — the 2026-07-11 "owned+verified" record stands. The email remains unconfirmed.
    See "M13 GATE 2 APPROVED", G-1.
  - **Q16** as recommended: a minimal reproducible-build check (double build, compared checksums,
    `REPRODUCING.md`), a one-page threat model, artifact attestations in the release workflow; **withdraw signed
    tags**. **Q17** the release workflow owns the SBOM. **Q18** auto-open onboarding on install only.
    **Q19** `docs/trust/PRIVACY.md`, linked from the store listings. **Q20** Edge: listing text and assets only,
    the Chrome zip.
  **Why:** the human's rulings at gate 1, taken on the draft's recommendations except where stated (Q3/Q10's
  default, Q8's mock-first guard, Q9's test-backed rule, Q13's permanent disclosure, Q15). **Next:** `plan.md`
  (gate 2) in a fresh session. **Revisit-when:** §8-1's measurement brings numbers back (fonts); Q15(a) is
  answered (contact channel and the domain).

- **2026-10-30 · M12 CLOSED — Editor Mode's focused core shipped (edit → live preview → save-back via
  CodeMirror 6, lazy-loaded, nested-host preview, watch/edit collision, the unsaved-changes guard; both
  engines), task 7.3's records reconcile. 31 rulings, 29 tasks, 40 commits.**
  **WHAT SHIPPED.** A dedicated Edit control on the app-page reader enters a third mode, `edit`
  (`readerMode.ts`; D-1): a CodeMirror 6 source pane beside a live preview that is the reader's own
  `mount()` on a nested shadow host with `chrome: false` (D-4 as RE-RULED), running the reader's four
  enhancers (R7). The editor is app-page-only and lazy: `editorEngine.ts` is the one importer (D-2) and
  `editorImportFence.test.ts` proves it never reaches the content script (D-10). Save writes on Chromium
  after a permission request at the click, with a compare-before-write conflict predicate and one baseline
  (D-6, D-7) — refuse and tell (R21); where Save cannot write (Firefox, no handle, a declined prompt) it
  downloads. Watching a document and editing it is supported, degraded (D-8): the watch defers while a
  document is edited, leaving edit flushes, and a hint tells the user the file changed (R6). Every exit from
  a dirty edit asks first, in an in-page dialog (R23). Syntax colours come from design tokens (R8, R11); the
  7.1 walk's polish landed at 3.5 (R28 line wrapping; R29 search panel, full-height split, themed
  scrollbars, the rail hidden at ≤ 1400 px, the snapshot notice off the text at wide). `permissions: []`,
  the ledger's edit sentences signed (D-9 / 5.1) and the zero-network claim proven across load, preview and
  save with a firing control in every window (5.7, 5.8).
  **THE 7.1 WALK — verdicts as the human reported them (2026-10-30), Chromium unless marked, wide desktop
  plus narrow.**
  | Axis | Verdict |
  | --- | --- |
  | A (1–8) the look | ok, except the R29 items — fixed at 3.5, re-checked ok on the 1.4 build (E-9, E-4, E-8 and R12 accepted as walked) |
  | B (9–11) the preview | ok — R15's diagram note accepted |
  | C (12–18) saving | ok |
  | D (19–22) conflict | ok — refuse-and-tell is enough; R21 stands |
  | E (23–27) the guard | ok — the consent line still reads true |
  | F (28) a 1 MB document | **NOT WALKED** — R26's stated limitation stands, carried |
  | G (29–30) Firefox | ok |
  | The 1.4 reading-view glance | ok |
  **7.1 IS TICKED** although F was not walked: 7.1's Verify asks for "its own stated verdict" per axis, and
  F's is "not walked, R26's limitation stands" — a stated verdict, with the item carried (below). It does
  not block the close: R26 shipped it as a known limitation on measured numbers (about 330 ms per render of
  1 MB prose; seconds per key for enhancer-heavy 1 MB on Firefox), and only an unacceptable verdict could
  re-open it. **Named, not smoothed over:** no one has typed in a 1 MB document in the loaded extension.
  The walk was Chromium for the walked axes except G; the engines and viewports are the human's report and
  are not instrumented here.
  **THE D-VALUE AUDIT (D-1…D-10), each against the commit that added its `decisions.md` entry** (found with
  `git log -S` on the entry heading, then read):
  | D | Landing entry (heading) | Commit |
  | --- | --- | --- |
  | D-1 | "012 D-1 — `ReaderMode` extends…" (2.1); "the CONTROL half" (3.2) | `f9e6439`; `02caba9` |
  | D-2 | "012 D-2 — `editorEngine.ts` is the ONE module…" (3.1) | `3affcae` |
  | D-3 | "012 D-3 — LANDED at task 3.2" | `02caba9` |
  | D-4 | "M12 D-4 RE-RULED" (the mechanism); "012 D-4 — LANDED at task 2.2" | `0541886`; `d505890` |
  | D-5 | "012 D-5 — LANDED at task 3.3" (provisional); R26 and 6.4 (final) | `07a7d08`; `55dfbad` |
  | D-6 | "012 D-6 — LANDED at task 5.3" (write); "the DOWNLOAD FALLBACK" (5.4) | `c5fffbb`; `4242955` |
  | D-7 | "012 D-7 — the conflict-DETECTION predicate…" (5.2) | `5960976` |
  | D-8 | "012 D-8 — the deferral half" (4.1); "4.2 landed" (the hint) | `2466f2e`; `3465e15` |
  | D-9 | "M12 TASK 5.1" (the signed text); interim at 5.3, final in 5.4's D-6 entry | `e5d5c10`; `c5fffbb`; `4242955` |
  | D-10 | "012 D-10 — LANDED at task 3.1" | `3affcae` |
  **GAPS, NAMED.** Every D-value lands with a named commit and a `decisions.md` entry. **Two divergences:**
  D-9 has no standalone "012 D-9" bullet — its text is the 5.1 sign-off entry and the 5.3 / 5.4 landings (the
  substance is complete; the heading is missing); D-5 landed twice, provisionally at 3.3 and finally at 6.4
  through R26, so its one-line landing is a pair. Neither is a missing artifact.
  **THE TASK COUNT, RECONCILED.** `tasks.md` holds **29 tasks** — gate 3 approved 22, of which 5.6 was struck
  (R21), leaving 21 planned; **eight were discovered** (1.2, 1.3, 1.4, 3.4, 3.5, 4.3, 4.4, 5.8) — and one
  struck line, 5.6, so 30 numbered lines. 21 + 8 = 29. By group: 1 (4) · 2 (2) · 3 (5) · 4 (4) · 5 (7) ·
  6 (4) · 7 (3). **`tasks.md`'s count lines were right all along** (22 → 23 → 24 → 25 → 26 → 25 → 26 → 27 →
  28 → 29). **The off-by-one was `progress.md`'s:** its 6.4 and 6.1 lines said 27 (correct), and the 6.3
  commit `acd2c26` wrote "28 tasks" in § Up next with no task added. 3.5's commit then wrote "tasks.md's
  groups sum to 27… the earlier 28 was an off-by-one", and the 1.4 line made it 29 — now true in both files.
  **THE BYTE LEDGER, CLOSED.** Fresh builds, both engines identical, HEAD `3ad539a` (docs-only since).
  `.output` **5,830,859 B (Cr) / 5,830,975 B (Fx)** against 7,340,032 B: headroom **1,509,173 / 1,509,057 B**
  — **633,434 B** of the starting 2,142,607 / 2,142,491 B (about 29.6%) spent, **identical on both engines**
  (5,197,425 / 5,197,541 → 5,830,859 / 5,830,975). Zips 1,842,763 / 1,842,822 B. Manifests **654 / 770 B**,
  `permissions: []`, `wxt.config.ts` unchanged across the milestone, no `web_accessible_resources`. Golden:
  `tests/golden/` has **no diff across the milestone** (`git diff 38c2c50^ HEAD -- tests/golden/` empty).
  **The content script, decomposed across every task from 1.1** — 340,492 B at the start, **344,195 B** at
  the close, **+3,703 B**, each step the named task's own glue, and ZERO `codemirror` bytes in it (the fence,
  3.1, and a grep of the built file):
  | Task | Δ content script | Why | After |
  | --- | ---: | --- | ---: |
  | start (M11 close) | | | 340,492 |
  | 1.1 | 0 | the editor is app-page-only | 340,492 |
  | 1.2 | +1,669 | `markdown-it` 14.3.2 + `dompurify` 3.4.16 (both on the graph) | 342,161 |
  | 2.1 | +178 | `readerMode.ts` / `readerCss.ts` glue: the `edit` mode, the `\` defence-in-depth guard, the edit-visibility selectors | 342,339 |
  | 2.2 | +45 | the guard alone (`decisions.md`, "012 D-4 — LANDED at task 2.2") | 342,384 |
  | 3.1–3.3 | 0 | md5-identical on both engines | 342,384 |
  | 4.1 | +136 | `watchController.ts`'s deferral widening | 342,520 |
  | 4.2 | +132 | the hint's signal (`watchController.ts`) | 342,652 |
  | 3.4 | 0 | md5 unchanged (seen to move under un-gating) | 342,652 |
  | 4.3 | +154 | `ownWrite` (114) and the token (40) | 342,806 |
  | 4.4 … 3.5 | 0 | md5-identical (3.5's four arms all on `chunks/app.js`) | 342,806 |
  | 1.4 | +1,389 | `dompurify` 3.4.17 (+989) and `markdown-it` 14.3.3 (+397), 3 B interaction | 344,195 |
  | **sum** | **+3,703** | 1,669 + 178 + 45 + 136 + 132 + 154 + 1,389 | **344,195** |
  *Method:* the 4.1–4.3 and 2.x figures are the tasks' own recorded measurements; 7.3 re-measured the
  commits that touch the content script (`8cbac42`, `f9e6439`, `d505890`, `3affcae`, `02caba9`, `07a7d08`,
  `2466f2e`, `3465e15`, `a88e957`, `644b63b`) in a scratch tree built with the CURRENT dependencies; every
  one read exactly 1,389 B above its recorded figure (the 1.4 bump), except 4.2's, which read 4 B more —
  a minifier-naming interaction. Equal md5s (`ae6ff9eb` for 2.2–3.3; `eaf0385c` for 4.2 and 3.4) corroborate
  the zero rows. The 4 B is stated, not hidden.
  **The editor's measured cost.** Package: `basicSetup` +97,226 B over `minimalSetup` (1.1, 4.5% of the
  headroom then). The editor chunks load only on Edit — no editor chunk is requested before it (R27) and
  first paint with edit never entered is inside the noise on both gates (6.3). The nested preview root:
  7–9 KB of Blink heap on Chromium; Firefox +57–59 ms of about 330 on the first entry into edit at 1 MB
  (R27, unattributed). Typing: about 330 ms per preview render of 1 MB prose, enhancer-heavy 1 MB on
  Firefox seconds per key (R26). The 3.5 polish added +2,358 B and 1.4 +1,399 B, all in `chunks/app.js`.
  **Suites at the close.** `pnpm lint` EXIT=0 · unit 1417 · browser 1961 passed / 51 skipped (188 files) ·
  golden empty · scanner and `--self-test` EXIT=0 · `pnpm audit --prod` EXIT=0 (one ignore, GHSA-238p-pmpm-9mq7,
  2026-10-30 14:49) · 7.3 is doc-only: a clean two-engine build is md5-identical to `3ad539a`'s on every
  shipped file.
  **THE RETRO** is banked in `retro.md` ("M12 retro", 2026-10-30): the three questions `tasks.md` 7.2 asks
  (F-1…F-6 saved; the unwatched rule held; build-then-measure on D-4 was right) and ten seed lessons; five
  rules placed, KEPT by the human (R31, below).
  **SPEC-COVERAGE: F8 RE-SCORED 5% → 17%** (`spec-coverage.md`): 1 shipped, 5 partial, 15 not, of 21 — the
  Read ↔ Edit toggle ✗ → ✓; the split pane, smart lists / continuation and find & replace with regex ✗ → ~
  (the split ships, scroll sync is deferred; list continuation and search ship as CodeMirror's own defaults,
  not as Peekover-built features: `decisions.md`'s "M12 TASK 1.1" entries). §5 total 32% → 34%, whole spec
  36% → 37%. The sealed `spec.md` / `plan.md` / `tasks.md` status lines stay "draft" per the M7–M11
  precedent (spec 011 reads "draft" after its close).
  **CARRIED, AND WHERE.** One consolidated list, `progress.md` § Carried items ("POST-M12 CONSOLIDATED
  LIST"): reader polish (the unstyled native buttons, the code toolbar on display math, the snapshot notice
  in the flow / dismissible and its narrow case, the 130 px band, the left sidebar on narrow screens) ·
  the editor at 1 MB (R26) and Firefox's first-entry cost (R27) · `readerPane.select`'s ordering guard ·
  "Wipe all data" not closing an open folder · the failed-chunk "try again" copy · the unguarded exits ·
  test infrastructure (the helper split, the +~150 s, the clipboard flake) · supply chain (the `packageManager`
  pin, the katex ignore's revisit-when) · the ~10.8 KB import-shape saving. Accepted, not to be
  re-litigated: E-4, E-5, E-8, R12 as walked, and R15. The M12 narrative moved to `progress-archive.md`.
  **AGENTS.md** — the stale Current-milestone paragraph now says M12 closed; the browser-suite sentence that
  said the files share "module-level caches" is corrected (5.8 measured IndexedDB, the font and HTTP caches
  and the OS clipboard; modules and `document.fonts` do not carry).
  **Revisit-when:** F is walked and returns an unacceptable verdict (re-opens R26); an upstream mermaid
  releases on katex ≥ 0.18.2 (drop the ignore); the reader-polish task opens.

- **2026-10-30 · M12 RULING R31 — HUMAN RULING: the five rules the 7.2 retro placed are KEPT.** Given by
  the human on 2026-10-30, in task 7.3's kickoff, on the wording the 7.2 commit `f54602d` landed. The agent
  chose nothing; this entry records it. **`AGENTS.md`:** (1) every task's preflight runs `pnpm audit --prod`
  and the kickoff's invariants block states its exit and date; (2) a guard that reads a zero is fired by a
  control that includes a SLOW case and is read only after something later has settled; (3) scripts and
  multi-line files are authored with the file tool, not a shell heredoc, and orphaned node / Playwright
  processes are checked after a stopped browser run. **`WORKFLOW.md`:** (4) the informal first-render glance
  survives a deferral, and automated proxies are a supplement; (5) a milestone-close walk covers the
  reader's own untouched surfaces in both themes. *Why:* each is a measured M12 failure with a concrete
  practice change (`retro.md`, "M12 retro", lessons c, d, e, f, i). *Revisit-when:* the next milestone's
  retro finds one waste or wrong.

- **2026-10-30 · M12 TASK 1.4 — LANDED: `dompurify` 3.4.16 → 3.4.17 and `markdown-it` 14.3.2 → 14.3.3,
  the lowest versions that patch all five advisories `pnpm audit --prod` reported (R30). `pnpm audit
  --prod` EXIT=0 again. No override, no new ignore, no `src/` change, no golden change. The content
  script MOVES +1,389 B (expected: both packages are on its graph).**
  **R30 — HUMAN RULING (2026-10-30).** A DISCOVERED task 1.4, "the dompurify / markdown-it
  advisories", runs AFTER the 7.1-walk polish (3.5) and BEFORE 7.2: a governed bump of both packages to
  the lowest versions that patch every advisory `pnpm audit --prod` reports for them. No overrides; the
  1.3 katex ignore stays the only ignore. STOP and report if either package has no patched release, the
  bump changes any golden output, or a sanitizer hook relies on an internal the new version changed.
  None of the three occurred.
  **STEP 0 — THE ADVISORIES, AT SOURCE** (`pnpm audit --prod --json` at 2ceef0d: 6 findings, 5
  advisories + the 1.3 katex ignore; REACHABILITY is recorded, not used to skip — R30 bumps regardless).
  - **GHSA-cg2g-xh64-v4q7 · dompurify · CRITICAL** · affected `>=3.4.4 <=3.4.16`, patched `>=3.4.17` ·
    `SAFE_FOR_TEMPLATES` bypass: split template expressions survive in attached shadow-root content on
    DOM output modes. *Reachability: NO.* `SAFE_FOR_TEMPLATES` is set by none of the three profiles
    (`sanitize.ts` `SANITIZE_CONFIG` :117, `SANITIZE_SVG_CONFIG` :390, the math config), and every call
    returns a STRING (`RETURN_DOM: false`, :125 / :399; calls at :154, :790, :984).
  - **GHSA-mrv2-3pqr-j5jr · dompurify · HIGH** · `<=3.4.16` → `>=3.4.17` · `IN_PLACE`: a hook that removes
    a parent or sibling leaves the detached subtree's event handlers armed (incomplete fix of
    GHSA-p98j-92pf-mc4p). *Reachability: NO.* `IN_PLACE` is set nowhere in `src/` or `entrypoints/`;
    the hooks (:141 `uponSanitizeAttribute`, :788 `afterSanitizeElements`) never run in place.
  - **GHSA-c6gr-qvv4-5v3f · dompurify · LOW** · `<=3.4.16` → `>=3.4.17` · the SMIL `attributeName=href`
    guard is skipped when `PARSER_MEDIA_TYPE` is `application/xhtml+xml`. *Reachability: NO.*
    `PARSER_MEDIA_TYPE` is set nowhere; the default `text/html` lowercases names.
  - **GHSA-gfr2-rv44-r23c · markdown-it · HIGH** · `>=14.1.0 <14.3.3` → `>=14.3.3` · quadratic-time
    rendering of one multi-line link reference definition with DEFAULT options (a 14.0 regression).
    *Reachability: YES* — `parse.ts:43` builds the one `MarkdownIt` instance; the rule is on by default.
    A denial of service of the reader tab, not a data exposure.
  - **GHSA-vfgh-jcmw-g37q · markdown-it · LOW** · `<14.3.3` → `>=14.3.3` · quadratic-time inline HTML
    parsing WITH `html` enabled. *Reachability: YES* — `html: true`, `parse.ts:25`.
  - *Unchanged:* GHSA-238p-pmpm-9mq7 (katex via mermaid), the 1.3 / R15 ignore, `package.json`
    `pnpm.auditConfig.ignoreGhsas` — the only suppression.
  **STEP 1 — VERSIONS.** Registry: `dompurify` 3.4.17 (published 2026-10-12, the newest 3.4.x and the
  lowest patched); `markdown-it` 14.3.3 (dist-tag `v14-legacy`; `latest` is 15.0.3, NOT taken — the 15
  line re-opens the math-grammar peer-range item, `progress.md` § Carried items). `mermaid@11.16.1`
  declares `dompurify ^3.3.3`, so 3.4.17 satisfies it and ONE copy resolves: `pnpm why --prod
  dompurify` → "Found 1 version" (3.4.17, via mermaid and the root); `markdown-it` → "Found 1 version"
  (14.3.3, via `@mdit/plugin-tex`, `@mdit/helper` and the root).
  **STEP 2 — THE BUMP.** `pnpm add dompurify@^3.4.17 markdown-it@^14.3.3` (caret, as the repo pins).
  `package.json`: two lines. `pnpm-lock.yaml`: 34 lines, EVERY resolved-version change — `dompurify`
  3.4.16 → 3.4.17 (importer, snapshot, package entry, mermaid's pointer); `markdown-it` 14.3.2 →
  14.3.3 (importer, snapshot, package entry); `@mdit/helper` and `@mdit/plugin-tex` peer-suffix keys
  `(markdown-it@14.3.2)` → `(…14.3.3)`. No other package moved. `pnpm install --frozen-lockfile` EXIT=0.
  `dependencies` stays 11.
  **STEP 3 — THE SANITIZER RE-CONFIRMATION (the 1.2 precedent).** Published tarballs, 3.4.16 vs 3.4.17,
  `src/purify.ts` read side by side. *`_isValidAttribute` (127 lines): BYTE-IDENTICAL* — the same
  acceptance branches in the same order. *The hook contract:* `uponSanitizeAttribute` still runs
  immediately after the attribute is read and before the named-props step, the value checks and
  `forceKeepAttr` / `keepAttr`; `afterSanitizeElements` still runs after `_sanitizeElements`. Our
  `uponSanitizeAttribute` hook (`sanitize.ts:141`) reads `data.attrName` / `data.attrValue` and sets
  `data.keepAttr`; the math hook (:982) and the CSS pass (:788) use the same two events — none depends
  on a changed internal. *What did change:* the two value checks (comment / raw-text closers; the
  animated-`href` guard) were lifted into `_isUnsafeAttributeValue` and run at the SAME position; the
  `attributeName` comparison is now case-insensitive (GHSA-c6gr — stricter, never looser); a
  `_markVisited` call for `IN_PLACE` (unused here); a text-content markup probe for literal-text
  elements (`ELEMENT_MARKUP_PROBE`). All stricter or off-path. Same ⇒ no STOP.
  *`markdown-it` 14.3.2 → 14.3.3:* three source files, all rewrites for the two quadratic cases —
  `rules_block/reference.mjs` (a direct scan of `state.src`; labels over 999 code points are now
  rejected, CommonMark's own limit), `rules_inline/html_inline.mjs` (+ `state_inline.mjs`'s
  `skipHtmlSpecial` flag; an unterminated comment / PI / declaration / CDATA stays text), and the
  regenerated `dist/` bundles. Our ESM import resolves to `lib/`. (The tarball ships no CHANGELOG; the
  diff is the changelog.) Output differs only for a label over 999 code points or an unterminated HTML
  special — neither is in any golden, confirmed by the golden run.
  **STEP 4 — VERIFY.**
  - `pnpm audit --prod` EXIT=0 (`1 low (1 ignored)` = the katex ignore); `--audit-level low` EXIT=0; the
    JSON lists 0 advisories and `package.json` carries the one `ignoreGhsas` entry — no other
    suppression, no overrides.
  - SBOM regenerated, transient, NOT staged: 191 components (was 191); dompurify 3.4.17, markdown-it
    14.3.3.
  - **BYTES** (clean two-engine rebuild, both engines identical; every file that changed size):
    `chunks/app.js` +1,399 B · `content-scripts/peekover.js` +1,389 B · nothing else. `.output`
    5,830,859 B (Cr) / 5,830,975 B (Fx), +2,788 (vs 5,828,071 / 5,828,187); headroom 1,509,173 /
    1,509,057 B against 7 MiB. Zips 1,842,763 / 1,842,822 B (+1,298 / +1,299). Content script 344,195 B,
    md5 `b0ff62df…` (Cr) / `3413dae0…` (Fx) — MOVED, as expected. Manifests 654 / 770 B,
    `permissions: []`. **Content script by package** (single-package arms, over-determined): dompurify
    alone +989, markdown-it alone +397, both +1,389 — a 3 B interaction (minifier names). The app chunk:
    +1,002 / +389 / +1,399 (residual 8). One arm artifact to know about: the markdown-it-only arm showed
    a +29 KB mermaid chunk — `pnpm add` of the older dompurify re-resolved something in that scratch
    arm; the REAL tree's diff shows only the two files above, and the restored lockfile is md5-identical
    to the verified one.
  - **SUITES.** `pnpm lint` EXIT=0 · unit 1417 / 1417 (the named: `parse` 37 · `sanitize` 119 ·
    `golden` 11) · browser, run ALONE, `--reporter=verbose`: 188 files, 1961 passed / 51 skipped, zero
    reds (the named: `sanitize.browser` 62 · `diagramSanitize` 10 · `mathNetwork` 6 ·
    `editorPreview` 24 · `editorSave` 36 pass / 30 skip (Chromium-only OPFS) · every `*Network` 56
    pass / 4 skip · every `*Secure` 18) · scanner and `--self-test` EXIT=0 · `git diff --exit-code
    tests/golden/output/` EMPTY (never regenerated). No known flake fired.
  **Revisit-when:** a new advisory against either package (re-run this task's shape); or a
  `markdown-it` 15 bump (the math-grammar peer-range item); or DOMPurify changing `_isValidAttribute`'s
  branches again.

- **2026-10-30 · M12 TASK 3.5 — LANDED: the 7.1-walk polish (rulings R28, R29; two decisions; one
  authorization). Search panel from tokens, a split that fills the pane, themed scrollbars, the rail
  hidden while editing at ≤ 1400 px, the snapshot notice off the text (wide), long lines wrap. The
  content script is byte-identical.**
  **RULINGS (human, banked here).**
  - **R28 — the editor wraps long lines.** `EditorView.lineWrapping` from the `codemirror`
    re-export, placed after the ruled pair and the highlight style and before the caller's
    extension. The two exact-list pins in `editorEngine.test.ts` are updated (the one authorized
    assertion change of the kickoff; the list gains `LINE_WRAPPING` at index 3).
  - **R29 — FIX NOW (a)–(e).** (a) the Ctrl-F search panel restyled from tokens, legible in both
    themes · (b) the split fills the available height, with themed scrollbars · (c) below a
    breakpoint the TOC rail is hidden while editing · (d) the M6 snapshot notice never sits on
    text · (e) R28. **CHECK FIRST (f)/(g)**, fixed only if M12 introduced them. **CARRY:** the left
    sidebar on narrow screens. **ACCEPT:** sub/sup/emoji render literally (E-8).
  - **Decision 1 — (d) is option A:** an app-only rule in `EDIT_CONTROL_CSS` (moves the watch
    disclosure to `bottom:16px;left:176px`), the content script untouched. (d) is asserted at WIDE
    only. The NARROW case of (d), and option C (the notice in the flow / dismissible), are CARRIED
    to the post-M12 reader-polish task with the left sidebar.
  - **Decision 2 — reclaim the 130 px bottom band if it can be done safely with app-only sheets,
    else keep it at tolerance 162 px, say which way it went and carry it. IT WENT THE
    KEEP-THE-BAND WAY.** Geometry (host-relative, measured at 1300 / 1400 / 1401 / 1500): Compare
    (16,12)–(101,44) · the Edit control y 16–46, its right edge hostW−116 · the collapsed handle
    y 52–82 · the open rail from hostW−250. The pills (130 and 109 px wide) would fit the top row,
    but the notice (220×110, wrap-dependent) cannot be placed there without a magic-number top
    margin. The test tolerance is `24 + 130 + 8 = 162`. CARRIED: "reclaim the band", with the pill
    stack.
  - **AUTHORIZATION (human, 2026-10-30) — option 1 for the 10 reds.** The 1400 px breakpoint stands
    (chosen from measurement: the rail-open panes drop under 360 px up to a 1403 px viewport).
    Re-spelling the 10 existing assertions is authorized as part of R29(c), each kept to the
    property it protected wherever that still applies:
    1. `editorNestedHost` 2.2 "WIDE 1400x900 … rail open" (2 cases, both engines) — MOVED to
       1500×900, where the rail is shown in edit, so "the preview's right edge stops at the rail's
       left edge" is still asserted (a firing control, `rail.width > 0`, was added). BESIDE it, a
       new 1400×900 case: the rail is not laid out in edit and both panes are ≥ 360 px.
    2. `editorEyeballProxy` proxy 2, "nothing collides at the top-right" (8 cases: NARROW/WIDE ×
       open/collapsed × 2 engines) — the READING arm is unchanged (rail and handle present and
       hit-testable). The EDIT arm now asserts the rail and its handle are not laid out (both
       viewports, 414 and 1400, are ≤ 1400), the control's centre hits the control, and the control
       does not overlap the split. Reason each changed: the rail is `display:none` in edit at
       ≤ 1400, which R29(c) rules.
    **The re-spelled 2.2 case, ablated:** the rail rule's breakpoint set to `0px` → the new 1400
    case and all 8 proxy-2 cases go red on both engines (10 reds); file restored byte-identical
    (md5 `9d8cb397…`).
  **STEP 0 — before any code (both engines; computed styles read from the real app page).**
  - *(a)* CodeMirror's `&light` rules (gradient button, white field, black text) applied under
    every theme — the panel was light-on-dark in dark.
  - *(b)* the split was a fixed `60vh`: 227 px above the bottom at WIDE, 137 px past the viewport
    at NARROW; the scrollbars were the UA's.
  - *(c)* the rail-open panes drop under 360 px up to a 1403 px viewport → the breakpoint is 1400.
  - *(d)* the notice is `position:absolute` against the document-height host; at WIDE it measures
    x 360–580, y 590–700, and the pills sit at x 360–490, y 750–820.
  - *(f)* **PRE-EXISTING, not M12's.** In dark, on both engines, every computed-style key of the
    filter-clear / sort / math-action buttons is identical at HEAD and at 0541886 (pre-M12): native
    buttons (2px outset, light grey, Arial / MS Shell Dlg); no CSS rule for those classes at either
    commit. **CARRIED.**
  - *(g)* **PRE-EXISTING, not M12's.** Same comparison: the display-math block carries the code
    toolbar "math · Line numbers · Wrap · Copy" at both commits. **CARRIED.**
  **THE FIXES (RED → green, both engines, `tests/browser/editorWalkPolish.browser.test.ts`, 26
  tests, real `mountAppShell`, theme supplied through the store).**
  - *R28 / (e)* — `editorEngine.ts` + the two pins; red: the long-line-wraps tests.
  - *(a)* — 11 search-panel rules in `EDITOR_CSS`, tokens only; text pairs ≥ 4.5 and token-colour
    assertions, both themes.
  - *(b)* — `followPaneHeight` in `editorView.ts` (a ResizeObserver-measured `--peekover-edit-avail`,
    released on teardown) + `EDITOR_CSS` height / margins / `color-scheme` / `scrollbar-color`;
    bottom gap ≤ 162, no horizontal scroll, thumb = `--faint` in both themes and both scrollers.
  - *(c)* — a `@media (max-width:1400px)` block; rail hidden at 1300 / 1400 / 414-stacked, visible at
    1500, panes ≥ 359, reading unchanged, the rail back after leaving edit.
  - *(d)* — the option-A rule; WIDE reading and edit: no text line box under the notice, no overlap
    with the split or with the Watch / Theme pills.
  **ABLATIONS — each red on both engines, files restored byte-identical:** R28 → the wrap tests ·
  A → search panel light / dark · B-css → bottom-edge and scrollbar tests · B-js → bottom-edge tests
  · C → the rail at 1300 / 1400 / 414 · D → the WIDE notice test.
  **BYTES (both engines identical, all on `chunks/app.js`; arms over-determined, residual 0).**
  R28 +15 · the `editorView.ts` helper +410 · `EDITOR_CSS` +1,882 (A search panel 1,395; B height /
  scrollbars 237; C rail 250) · option A +51 → **+2,358 B**. The B arm is derived from the independent
  only-B arm (237) and the text delta (1,882 = 1,395 + 237 + 250); the leave-one-out noB variant was
  flawed (136 B off) and discarded. Option B in `CONTAINED_CSS` would have cost +55 B in the content
  script — not taken. **Snapshot after:** `.output` 5,828,071 B (Cr) / 5,828,187 B (Fx) vs ≤ 7 MiB —
  headroom 1,511,961 / 1,511,845 · zips 1,841,465 / 1,841,523 (+383 each) · content script 342,806 B
  both engines, md5 `c4f59f1a…` (Cr) / `ecc31688…` (Fx) UNCHANGED · manifest 654 / 770 B,
  `permissions: []` · app chunk 530,649 B · the scratch baseline reproduced 6.3's figures exactly.
  **SUITES.** lint EXIT 0 · unit 1417 / 1417 · browser 1961 passed / 51 skipped (188 files; run
  alone, zero reds) — 1933 + the 26 new + the new 1400 case (2) · scanner and `--self-test` EXIT 0 ·
  golden empty. The first browser run had 10 reds, all R29(c)'s consequence in the two files above
  (a finding, surfaced, then authorized — not flakes). **`pnpm audit --prod` EXIT 1: 6
  vulnerabilities (dompurify critical + high, markdown-it high + low, dompurify low), IDENTICAL at
  HEAD with this change stashed.** 6.3 recorded EXIT 0 with one ignore; the advisories are newer. No
  dependency file moved. Not this task's; it is the pending `markdown-it` / `dompurify` bump (task
  1.2's subject) — flagged for the human.
  **CARRIED (home: the post-M12 reader-polish task, `progress.md` § Carried items).** (f) native
  filter-clear / sort / math-action buttons · (g) the display-math block's code toolbar · the left
  sidebar on narrow screens · (d)'s NARROW case · option C · reclaiming the 130 px band (with the
  pill stack).
  **Revisit-when:** 7.1's walk returns a verdict on any R29 item; or the reader-polish task opens.

- **2026-10-09 · M12 TASK 6.3 — LANDED: the nested preview host's cost MEASURED against an
  ablated single-root control, both engines; first paint with edit never entered MEASURED against
  a pre-M12 build. FORBIDDEN FROM CHOOSING: this entry recommends nothing. Two nesting deltas
  cleared the noise floor and went to the human, who ruled them NOT MATERIAL (R27, below). No
  production byte moved.**
  **WHAT 6.3 ASKS (re-derived from `tasks.md` before anything ran).** (1) First-paint and memory
  delta of the nested preview shadow root beside the outer one, isolated from CodeMirror — arms
  editor only · editor + nested preview · an ablated single-root control; A-B-A, floor beside
  median. (2) The existing first-paint gate on a document that never enters edit, against the
  pre-M12 baseline: zero delta, or the delta is a defect. Both tables pasted. No threshold (gate
  3, Q5): every delta above the A-B-A noise floor goes to the human, and a material one STOPS the
  task instead of being filed.
  **THE HARNESS — committed, re-runnable; not in any suite, not in CI.**
  - *Part 1:* a new `--part nested` on `scripts/perf-edit-preview.ts`, its arms in
    `perf-edit-preview.page.ts`. Production SOURCE bundled by esbuild and served on loopback, as
    at 6.2. *Re-run:* `pnpm perf:edit-preview -- --part nested` (both engines, about 35 minutes;
    `--engine`, `--docs profile:size,…`, `--nested-reps` cut it up), then `-- --report --out <dir>`.
  - *Part 2:* new `scripts/perf-edit-never-entered.ts`. It runs the two EXISTING gates
    (`perf-first-paint.ts --size 50kb`, `perf-app-first-paint.ts`), unchanged, with the working
    directory pointed at each build in turn, and prints them side by side. *Re-run:* build HEAD;
    `git archive <commit> | tar -x -C <dir>`, install and build there; then `pnpm exec tsx
    scripts/perf-edit-never-entered.ts --baseline <label>=<dir> [--baseline …] --rounds 5`.
  - **Every table of this run is committed as `scripts/perf-edit-preview.nested.results.md`.** The
    tables below are a selection from it.
  **PART 1 — THE ARMS.** One document, a FRESH BROWSER for every sample, then edit entered.
  *R* reading only (the base for memory) · *E* editor only: the shell and CodeMirror's view, the
  preview pane empty · *S* THE ABLATED CONTROL: the preview's content as a second reading column
  inside the OUTER shadow root — no nested host, no second `attachShadow`, no second copy of the
  reader's stylesheets (the alternative plan D-4 rejected, built in the harness so it can be
  priced) · *N* the harness's copy of what ships: a nested host and production's own
  `mount(text, previewHost, { contained, preserveReading, chrome: false })` · *P* production's
  `buildEditor`, as the Edit control calls it · *E again*, last in every repetition — the same arm
  twice in one session, the control every difference is read against. E is first and last, the
  three between rotate. **N − S is the nested root itself.**
  - *Why E, S and N are harness constructions:* production's `buildEditorShell` always renders the
    preview as it builds, and nothing in `src/` renders a preview without a nested host. They
    build the shell from `buildEditorShell`'s own lines and differ only in the preview pane.
  - *S is like for like with `mount()` where it can be:* the same `sanitize(parse())`, the inert
    `<template>`, the media policy, and the reading-anchor capture and restore `preserveReading`
    runs. What it leaves out is what the nested host adds: two `<style>` elements rebuilt on
    every render (43,901 characters), the commit into a second root, the post-commit wiring.
  - *The enhancers run in P only.* They find the reading column as the FIRST `.peekover-reader`
    in a host's root, which in S is the hidden reading view. So on prose P ≈ N (the copy's
    fidelity, shown); on the enhancer-heavy document P − N is the enhancers, not the nesting.
  - *A bias found in the smoke run and removed:* the outer sheet insets every `.peekover-reader`
    by the open TOC rail's width, so S's column was half as wide and twice as tall as N's
    (109,692 px against 56,674) and S paid for layout N did not. S now resets it; the tables
    print both arms' preview height and element count, equal in every row.
  **WHAT IS MEASURED.** *Entering edit:* before `enterEditMode` → the 2nd animation frame after it
  resolved (*paint*), and the build step alone (*build*) — on a page's FIRST entry (CodeMirror's
  chunks fetched and compiled inside it) and on re-entries. *One preview re-render:* the call, and
  out to the 2nd frame. *Memory, after forced collections on the first entry:* V8's heap and
  Blink's own heap (Chromium, DevTools protocol), and the private bytes of every browser process
  from the OS (both engines). Corpus: 6.2's prose document at 2,245 B / 50,503 B / 1,000,489 B and
  its enhancer-heavy 50,377 B. Five browsers per arm (three at 1 MB); 6 re-entries and 10
  re-renders each (3 and 5 at 1 MB).
  **THE NESTED ROOT ITSELF, N − S (median; ms unless marked).** The last column is *E again − E*.

  | | Chromium | Firefox | the same arm twice |
  |---|--:|--:|--:|
  | build, first entry · prose small | +0.1 (13.6 vs 13.5) | +1 (15 vs 14) | Cr +0.2 · Fx +1 |
  | build, first entry · prose 50 KB | −0.3 (22.9 vs 23.2) | **+4** (37 vs 33) | Cr 0.0 · Fx +2 |
  | build, first entry · heavy 50 KB | −0.4 (28.3 vs 28.7) | **+7** (50 vs 43); repeat +8 | Cr −0.1 · Fx −1 |
  | build, first entry · prose 1 MB | +2.3 (174.2 vs 171.9) | **+59** (330 vs 271); repeat **+57** | Cr −0.8 · Fx +1 |
  | paint, first entry · prose 1 MB | −4.3 (468 vs 473) | +58 (758 vs 700); repeat +208 (763 vs 555) | Cr −1.3 · Fx −2 |
  | build, re-entry · every document | −0.4 … +1.2 | 0 … +3 | Cr ±0.6 · Fx ±1 |
  | re-render, the call · prose 1 MB | −0.5 (344.7 vs 345.2) | +4 (292 vs 288); repeat +3 | — |
  | re-render, to the 2nd frame · prose 1 MB | +2.1 (390 vs 388) | +1; repeat +7 (of 435) | — |
  | Blink heap | **+7 … +9 KB**, at every size | not readable | 0 … 4 KB (16 KB, small) |
  | JS heap | −2 … −5 KB | not readable | 0 … 3 KB |
  | whole browser, private bytes | −1.4 … +0.5 MB | −10 … +9 MB | Cr 0.3 … 5.6 MB · Fx 2 … 17 MB |

  **FOR SCALE — what the other differences are (Chromium; Firefox agrees in shape).**

  | median | prose small | prose 50 KB | heavy 50 KB | prose 1 MB |
  |---|--:|--:|--:|--:|
  | S − E, first paint, ms (the preview's content) | +3.9 | +22.8 | +33.4 | +388.7 |
  | S − E, Blink heap, KB | +189 | +4,099 | +6,037 | +80,069 |
  | E − R, JS heap, KB (CodeMirror and the shell) | +2,445 | +3,293 | +2,938 | +4,481 |
  | P − N, first paint, ms (production vs the copy) | +0.4 | −0.4 | +36.5 (the enhancers) | +5.6 |
  | P − N, Blink heap, KB | +1 | +1 | +14,048 (the enhancers) | +2 |

  **WHAT THE TABLES SHOW — described, not ranked.**
  - *Chromium.* No timing difference between the nested and the single-root preview clears the
    control, at any size, on entry, re-entry or re-render. The second root costs about 9 KB of
    Blink heap and six DOM nodes, the same at 2 KB and at 1 MB.
  - *Firefox.* The FIRST time edit is entered on a page, the build step is slower with the nested
    root, growing with the document: +1, +4, +7–8, +57–59 ms. At 1 MB that is about 18 % of the
    build. The time to paint on that first entry moved with it but not steadily (+58 and +208 ms
    in two runs; the single-root arm's own first paint read 700 and 555). It is NOT there on
    re-entry (0 … +3 ms) nor on a re-render (+1 … +7 ms of 435). P shows the same step as N, so
    it is the shipped path's, not the copy's. **Not attributed:** nothing here says which part of
    the first nested mount on Firefox scales with the document.
  - *What dominates either way.* The preview is a second rendered copy of the document: at 1 MB
    +78 MB of Blink heap and about +390 ms to the first paint on Chromium, with one root or two.
    Entering edit also DROPS the reading view's layout (`display:none`): Blink heap in E is below
    R by 2.9 MB at 50 KB and 65 MB at 1 MB.
  **PART 2 — FIRST PAINT, EDIT NEVER ENTERED (Chromium; pooled warm runs, ms).** Three builds:
  HEAD; `0541886`, the last commit before task 1.1 — its content script reproduces the recorded
  pre-M12 pin exactly (340,492 B, md5 `bcdcf231…`), the firing control that the baseline is the
  right tree; and `8cbac42`, after tasks 1.1–1.2 (CodeMirror installed, `markdown-it` /
  `dompurify` bumped) and before any editor code. HEAD first in each of five rounds, and last.

  | Gate | Build | warm runs | median | floor | per-invocation medians |
  |---|---|--:|--:|--:|--:|
  | content script, 50.4 KB | HEAD | 36 | 141.3 | 135.8 | 139.6 – 144.3 |
  | | pre-M12 `0541886` | 30 | 140.3 | 136.8 | 138.9 – 141.8 |
  | | deps bump `8cbac42` | 30 | 140.6 | 134.6 | 139.4 – 141.6 |
  | app page, 50.4 KB | HEAD | 36 | 90.9 | 85.6 | 89.4 – 92.8 |
  | | pre-M12 `0541886` | 30 | 88.5 | 86.0 | 87.8 – 89.0 |
  | | deps bump `8cbac42` | 30 | 91.7 | 85.8 | 91.0 – 93.4 |

  - *HEAD − pre-M12:* content script median **+1.0**, floor **−1.0**; app page median **+2.4**,
    floor **−0.4**. *HEAD against itself* across its six invocations: medians span 4.8 ms
    (content script) and 3.3 ms (app page), floors 3.7 and 2.5 ms. Both differences are inside
    that, and the floors agree to within 1 ms. Both gates read well under `GATE_MS = 165`.
  - *Where the app page's median moved:* the build with the bumped dependencies and NO editor
    code reads 91.7 — above HEAD. Whatever moved the median was there before the editor was.
  - *The structural half — the claim the timing cannot make.* On HEAD's build, on the app page,
    from load to 1.5 s after first paint with edit never entered: 4 requests. Activating Edit
    then requests 4 more (`chunks/dist-*.js` — the firing control: the instrument sees chunk
    requests). **Of those four, requested before edit was entered: 0.** The editor is post-mount
    and waits for the gesture.
  - *Against `tasks.md`'s "ZERO delta … or the delta is a defect":* the difference is zero within
    the noise this protocol has, not a literal zero, and is stated as that.
  **THE NOISE, AND THE LIMITS.**
  - One machine (13th-gen Core i7-13700, 24 threads, 64 GB, Windows 11, node 24.11.1), headless
    browsers, each run alone. A stray command during a run moved one app-page reading by 8 ms
    (the first, discarded pass) — the re-run was left untouched.
  - *paint* has a two-frame floor (about 32 ms on Chromium; Firefox's headless figures cluster
    near 60 ms), so on documents up to 50 KB it hides differences the *build* column shows.
    Firefox's clock resolves 1 ms.
  - 1 MB rows are three browsers per arm. The Firefox first-entry build figure repeated to 2 ms
    across two runs; its first-PAINT figure did not, and is an order of magnitude.
  - **Firefox memory is not measured in any useful sense.** No heap figure reaches a harness;
    whole-browser private bytes differ by 2–17 MB between two runs of the same arm.
  - Production source, not the production build; an http origin; a bare page with no app shell.
    S is a construction of the rejected alternative, not a design anyone built — it has no
    theming of its own, no TOC handling, no enhancers.
  - Part 2 is Chromium only: Playwright cannot load an extension into Firefox. Firefox's
    never-entered first paint is unmeasured here, as every first-paint number in this project is.
  - Memory is read once, on the first entry. Growth over many renders or sessions was not
    looked at.
  **VERIFY.** `git diff` over `src/`, `entrypoints/`, `wxt.config.ts`, `package.json` and the
  lockfile: empty. Two clean two-engine builds — the working tree, and pristine HEAD (`55dfbad`,
  the changes stashed) — all 139 shipped files md5-identical on Chromium and on Firefox, and
  identical to the build the measurements ran against. `.output` 5,825,713 / 5,825,829 B;
  content script 342,806 B (`c4f59f1a…` / `ecc31688…`); the app chunk 528,291 B; manifests
  654 / 770 B, `permissions: []`. `pnpm lint` EXIT=0 (it covers the three scripts). The suites
  were NOT re-run: nothing they run changed, and neither project lists a file under `scripts/`.
  **CLOSES.** "012 D-4 — LANDED at task 2.2" — "D-4's cost is measured at 6.3", and its
  revisit-when — with the N − S rows above. "M12 GATE 3 APPROVED", Q5 and its carried consequence
  ("surfaces a material cost to the human and STOPS"): surfaced, and ruled (R27). "M12 TASK 6.2 —
  LANDED" and "M12 TASK 6.4 — LANDED", revisit-when "6.3". Plan §4 risk 3 and plan §7's two
  group-6 bullets are measured.
  **KICKOFF VS FILE, FLAGGED.**
  1. The kickoff asked for one commit with records; `tasks.md` says a material cost stops the
     task and is not filed. The deltas were put to the human before any record was written; the
     records follow the ruling.
  2. *Files.* `tasks.md` names "a perf script under `scripts/`". Four files: the driver and its
     in-page half (both existing, extended), `perf-edit-never-entered.ts` (new — Part 2 has to
     run two gates across builds, which the edit-view harness cannot), and the results file.
     `package.json` is untouched.
  3. *The harness's stale labels are fixed, as the kickoff asked:* its first candidate is now "C1
     shipped (R26 …)" and the header no longer says "stays 1 and PROVISIONAL". The `C1` prefix is
     kept, so `--candidates C1,C2` selects what it did. 6.2's committed results file is a record
     of that day and is unchanged.
  4. "A-B-A … an ablated single-root control": the control arm is E twice; S is the ablation.
     Arms are interleaved per repetition, every sample in its own browser.
  5. "Against the pre-M12 baseline": measured against a BUILD of the pre-M12 tree in the same
     session, not against the figures `progress.md` § Baselines carries from August — those are
     another session's and another machine state's.
  6. A third build (`8cbac42`) is beyond the task line; it is what says the app page's median
     moved before the editor existed.
  7. The first full run stopped once on a fresh browser that never loaded the page. The nested
     part now retakes such a sample whole and logs it; the committed run had none.
  *Revisit-when:* the 7.1 walk on Firefox with a large document (the first entry into edit) ·
  real use showing documents near 1 MB edited on Firefox · any wish to attribute the Firefox
  first-entry cost — the harness has the two arms that isolate it.

- **2026-10-09 · M12 RULING R27 — HUMAN RULING: the nested preview host's cost is NOT MATERIAL.
  012 D-4 stands as built.** Given during task 6.3, on the measurements in the entry above, in
  answer to the question gate 3's Q5 reserved for the human. The agent chose nothing: it laid out
  the two deltas that cleared the noise floor and three options — *not material, file it* ·
  *material, stop here* (6.3 left unticked, no figure in `progress.md`, D-4 awaiting a ruling) ·
  *attribute the Firefox cost first* — and waited.
  **THE RULING, quoted:** "Not material — file it".
  **WHAT WAS IN FRONT OF THE HUMAN.** (1) Chromium: the second shadow root costs 7–9 KB of Blink
  heap at every document size; no timing difference clears the control. (2) Firefox: on the first
  entry into edit on a page, the build step is slower with the nested root — +4 ms at 50 KB,
  +7–8 ms on the enhancer-heavy 50 KB, +57–59 ms at 1 MB (of about 330); the first paint at 1 MB
  +58 and +208 ms in two runs; nothing on re-entry or re-render; not attributed. (3) That groups
  2–5 stand on the nested host, so overturning it would be a rework. (4) First paint with edit
  never entered: inside the noise on both gates, and no editor chunk requested before Edit.
  *Outcome:* 6.3 is ticked and filed; the D-4 deferral is closed.
  *Revisit-when:* the 7.1 walk (Firefox, a large document, the first entry into edit).

- **2026-10-09 · M12 TASK 6.4 — LANDED: the preview's first render leaves the keystroke (R26;
  spec §8-2). The PROVISIONAL constant is removed. Run BEFORE 6.3, by the order check below.**
  **THE ORDER CHECK.** `tasks.md` lists 6.3 before 6.4. 6.3 measures the nested preview host's
  first-paint and memory cost and the never-entered first paint; nothing in its text depends on
  the debounce, and nothing in it says it must precede 6.4. What it measures runs THROUGH the
  preview, so measuring it on the scheduler that ships is the better order — the case R26's
  kickoff authorized. 6.4 was applied first; `tasks.md` carries a dated sequencing note.
  **STEP 0 — WHERE THE IMMEDIATE RENDER WAS, AND WHAT PINNED IT (listed before any change).**
  One site: `createPreviewCooldown`'s `push`, which called `renderNow` in place when the
  cooldown had elapsed and no timer was armed; the feed (`buildEditor`'s update listener) only
  calls `push`. What pinned it, found by applying the change to a scratch tree and reading the
  reds: ELEVEN cases in `editorView.test.ts` — seven in the cooldown block ("renders the FIRST
  text immediately"; WAIT SCALES; COALESCES; NOT re-armed; QUIET GAP; cancel(); holds the text
  unread) and four in the feed block ("a change renders … at once"; a burst coalesces; GUARD A;
  a render that throws) — and ONE case in `editorPreview.browser.test.ts`, on both engines ("a
  keystroke lands in the buffer while a preview render is pending"). No other test in the
  repository pinned it: the full suites confirm that. (A twelfth unit red in the scratch run,
  in the baseline block, was a timer leaked by the un-re-spelled feed cases; it needed no edit.)
  **THE CHANGE** — `createPreviewCooldown`, `src/render/editorView.ts`. `push` no longer
  renders: it takes the pending slot and, when no timer is armed, arms one for whatever is left
  of the cooldown — 0 ms when nothing is. `flush`, `renderNow`, `cancel` and the feed's
  fire-time guard are untouched. `PREVIEW_COOLDOWN_MULTIPLIER` is REMOVED (not kept as a named
  constant): R26 rules multiplier 1, tasks.md 6.4 and AGENTS.md's provisional-constant rule both
  say remove rather than re-comment, and a constant whose only value is 1 would be a second
  place to read what the arithmetic already says — `readyAt += readyAt - started`. THE FEED's
  module comment states R26; no "PROVISIONAL" remains on the path.
  **TESTS FIRST, RED AT HEAD.** Unit, 9 red of 87 before the implementation: the four new R26
  cooldown cases (never synchronous; keys before the task coalesce into it; after a quiet gap
  too; `cancel()` clears the 0 ms task), the new guard case (teardown clears the 0 ms timer, by
  its handle), the marker-is-gone case, and three re-spelled cases whose step now needs the
  task. Real engine: the re-spelled case red on both engines — `R26: the first key rendered
  nothing inside its own dispatch: expected 1 to be +0`. After: unit 1417 (+5), all green.
  **THE STRUCTURAL PROPERTIES, EACH RE-ASSERTED** with the numbers it had: the wait is measured
  from a render's END (a 10 ms render waits 10 ms, a 400 ms one 400 ms); one pending slot,
  newest wins (ten changes → one render of `v10`); the timer is not re-armed per change (one
  `setTimeout` for three changes; the render lands 40 ms after the first FINISHED); no
  starvation under a stream that never goes quiet; the injected `now`; guard A on a cooldown
  timer AND on the 0 ms task; guard B on a cooldown-pending text AND on a 0 ms-pending one.
  **RE-SPELLINGS — named; nothing loosened beyond what R26 changes.**
  - *Replaced:* "renders the FIRST text immediately" → the R26 cases. "the multiplier is 1, and
    is marked PROVISIONAL in exactly one place" → "nothing on this path is PROVISIONAL any more,
    and the provisional constant is gone".
  - *A `task()` added after the push that used to render in place, every number kept:* WAIT
    SCALES (and `N * PREVIEW_COOLDOWN_MULTIPLIER` → `N`, twice) · COALESCES · NOT re-armed (the
    timer spy now starts after the first render, so it still counts the changes' timers) ·
    QUIET GAP · `cancel()` · holds the text unread (plus: unread until its task) · GUARD A ·
    GUARD B (so its stale text is cooldown-pending, as the case means) · a render that throws
    (the task runs inside the same "does not throw").
  - *Expected values changed, because the behaviour did:* "a change renders the BUFFER …" — was
    "at once"; now zero renders inside the dispatch, then the same render a task later. "a
    burst coalesces" — six keys in one task were `[a]` then `[a, abcdef]`; now `[]` then
    `[abcdef]`: one render.
  - *Browser:* `expect(log[0].after - log[0].before, 'the first key rendered immediately')
    .toBe(1)` → `.toBe(0)`, and for EVERY key no render inside its own dispatch. Its record
    line re-worded. Measured there after: 8 of 8 keys landed while a render was pending.
  **CONFIRMED AGAINST THE MEASUREMENT** — 6.2's harness, unchanged, re-run on the slice R26
  cites (enhancer-heavy 50 KB, 150 ms between keys, two runs, ms). Its "C1" row imports the
  shipped scheduler, so it now measures R26; "C1-copy" is still the old behaviour.

  | | key p50 | key p95 | busy p95 | keys busy ≥ 50 ms | renders | stale: text |
  |---|--:|--:|--:|--:|--:|--:|
  | Chromium · the SHIPPED scheduler | 5.4 | 29 | 42 | 1/48 | 24 | 43 |
  | Chromium · C2 (harness) | 4.1 | 35 | 48 | 1/48 | 24 | 63 |
  | Chromium · the old behaviour (C1-copy) | 3.2 | 8 | 78 | 48/48 | 24 | 35 |
  | Firefox · the SHIPPED scheduler | 71 | 151 | 189 | 39/48 | 20 | 64 |
  | Firefox · C2 (harness) | 96 | 300 | 476 | 44/48 | 17 | 92 |
  | Firefox · the old behaviour (C1-copy) | 306 | 542 | 2,231 | 48/48 | 24 | 612 |

  The shipped row tracks C2 on both engines, inside the ~2x noise 6.2 stated, and the old
  behaviour sits where C1 sat. No mismatch. (On Chromium the shipped row's key p95 is 29 ms
  against the old behaviour's 8: with the render in a task of its own, a key can land behind
  it — the same shape C2 showed at 6.2, p95 18. The main thread's busy time per key fell from
  78 to 42 ms.)
  **BYTES.** `.output` 5,825,713 (Cr) / 5,825,829 (Fx), **−31** each; headroom 1,514,319 /
  1,514,203 B under 7 MiB. zip 1,841,082 / 1,841,140 (−62). Manifests 654 / 770 B,
  `permissions: []`. One file changed size per engine: the app chunk, 528,322 → 528,291.
  *The content script: md5-IDENTICAL* (342,806 B; `c4f59f1a…` / `ecc31688…`), in every arm.
  *The app chunk, by Chrome removal arms in sequence, landing on the baseline:* R26's `push`
  −27 · the constant's removal −4 = **−31, residual 0**.
  **FULL SUITE.** lint 0 · unit 1417 · browser, run alone, 186 files, 1933 passed / 51 skipped,
  ZERO reds (393 s) · scanner clean over 80 files, self-test 7 + 10 · `pnpm audit --prod`
  EXIT=0 · golden empty. Named: unit `editorView` 87 · `editorPreview` 24 · `editorRender`
  20 · `editorDegrade` 18 · `editorSave` 36 (+30 skipped) · `editorUnsaved` 82 (+2) ·
  `editorWatch` 12. No flake fired.
  **012 D-5's REVISIT-WHEN IS CLOSED.** D-5 named the cooldown as a candidate and left its
  interval to §8-2. R26 is that ruling; nothing about the debounce is provisional any more.
  **KICKOFF VS FILE, FLAGGED.** (1) 6.4 ran before 6.3 (above). (2) `scripts/` is zero-diff as
  fenced, which leaves the harness's label "C1 today (x1, first render in the key)" and its
  header's "stays 1 and PROVISIONAL" describing 6.2's day, not today's: the row now measures
  the shipped R26 scheduler. A wording fix for whoever next touches the harness. (3) The
  harness flags are its real ones: `--part typing --sizes 50k --profiles heavy --rates 150
  --candidates C1,C2 --reps 2`, with `--out` pointed away from 6.2's results. (4) No ripple:
  the three Files and the three records.
  *Revisit-when:* the 7.1 walk (typing feel; documents around 1 MB) · real use showing large
  documents being edited · 6.3.

- **2026-10-09 · M12 RULING R26 — HUMAN RULING, the spec §8-2 decision of record: the live
  preview's scheduler is C2 from task 6.2.** Given in task 6.4's kickoff, dated 2026-10-09,
  marked there "approved by the human running this prompt". The agent chose nothing — 6.2 was
  forbidden from choosing and recommended nothing; this entry records the ruling.
  **THE RULING.** Today's cost-proportional cooldown with multiplier 1, except that a render
  which would run immediately runs instead in a 0 ms task — never synchronously inside the
  keystroke that triggered it. Keys arriving before that task runs coalesce into it: one
  pending slot, newest text wins. Every other structural property of 012 D-5 stands: the wait
  is measured from a render's END; one pending slot; the timer is never re-armed per change;
  the injected `now`; both cancellation guards.
  **WHY (6.2's numbers).** On the heavy 50 KB document in Firefox, C1 rendered inside nearly
  every keystroke — key p50 ~370 ms, preview ~740 ms behind — against C2's ~96 ms and ~90 ms:
  better on both axes and well outside the ~2x noise. Chromium is unchanged within noise, with
  busy time per key down from ~75 ms to ~27 ms. Nothing regresses on small or prose documents.
  **REJECTED.**
  - *A trailing debounce (C4)* — it stops updating the preview while you type.
  - *Larger multipliers (C3)* — they help only when a render outlasts the key gap, and sat
    inside the noise.
  - *A large-document fallback* — it adds a second mechanism and an unmeasured threshold (6.2's
    1 MB rows are one run each).
  **STATED LIMITATION.** Documents around 1 MB stay slow to type in — 1 MB prose: ~330 ms per
  render, keys queue behind it; enhancer-heavy 1 MB on Firefox: seconds per key under every
  candidate. Recorded as a known limitation and a 7.1 verdict item; revisit if real use shows
  large documents being edited.
  *Outcome:* applied at 6.4 (the entry above).
  *Revisit-when:* the 7.1 verdict on large documents.

- **2026-10-09 · M12 TASK 6.2 — LANDED: the live-preview debounce MEASURED — sizes, two content
  profiles, seven candidates, both engines. FORBIDDEN FROM CHOOSING: this entry recommends
  nothing. The numbers go to the human for the spec §8-2 ruling. No production byte moved.**
  **THE HARNESS — committed, re-runnable.** `scripts/perf-edit-preview.ts` (the driver) and
  `scripts/perf-edit-preview.page.ts` (the in-page half); `pnpm perf:edit-preview` (one new
  `package.json` script entry). Not in any test suite and not in CI — `perf-watch.ts`'s
  disposition. The page runs production SOURCE — `mount`, `enterEditMode`, `loadEditorEngine`,
  `buildEditorShell`, `renderPreview` and the lazy engines behind them — bundled and minified
  by esbuild (reached through `tsx`, as `perf-watch.ts` does), code-split, served from a
  loopback server the script starts. ONE thing in the page is the harness's own: the scheduler
  between the editor and the preview. *Re-run:* `pnpm perf:edit-preview` (everything, about an
  hour), or in pieces with `--engine`, `--part render|typing`, `--sizes`, `--profiles`,
  `--rates`, `--reps`, `--candidates`; `-- --report` prints the tables from the results on
  disk. **The complete output of this run is committed as
  `scripts/perf-edit-preview.results.md`** (28 typing tables and 2 render tables); the tables
  below are a selection from it.
  **THE CORPUS.** Sizes mirror `perf-watch.ts`'s 50 KB / 1 MB shape plus a small document.
  - *prose* — headings, paragraphs with inline marks, lists, a quotation: 2,245 B (5 sections) ·
    50,503 B (118) · 1,000,489 B (2,318).
  - *enhancer-heavy* — every section a code fence, a table, one block and two inline formulas;
    every fourth a mermaid diagram, each distinct: 2,481 B (1 mermaid, 4 fences, 4 + 8 math, 4
    tables) · 50,377 B (21 mermaid, 81 fences, 81 + 162 math, 81 tables) · 1,000,416 B (395
    mermaid, 1,578 fences, 1,578 + 3,156 math, 1,578 tables). The density is the agent's
    choice, not a measured norm: about one diagram per 2.5 KB is dense.
  **THE CANDIDATES — in the harness only, never in `src/`.** C1 today: production's
  `createPreviewCooldown`, imported as it ships — the first render inside the keystroke, then a
  cooldown equal to the render's cost. C1-copy: the harness's own copy of that cooldown, the
  control for the candidates built from it. C2: the same, the first render moved into a 0 ms
  task (`setTimeout(…, 0)`). C3: multiplier 2, and 3. C4: a fixed trailing debounce, 150 ms and
  300 ms.
  **HOW TYPING IS DRIVEN.** Real key events through the browser's input path, 24 keys a run,
  sent at fixed wall-clock times by timers in the DRIVER process and never awaited one after
  another — so a key that arrives during a render waits behind it, as a person's does (P-3: a
  driven burst is not typing). Page times and send times are epochs on two clocks; the offset
  is calibrated per run and subtracted. Rates: 250 ms between keys (~48 wpm), 150 ms (~80 wpm),
  80 ms (~150 wpm, a burst). Each run opens the document fresh, lets the first preview settle
  and pauses 600 ms, so its first key is a first key after a pause (P-2). Candidates are
  interleaved inside each (run, rate). Two runs per candidate at small and 50 KB; ONE run, at
  150 ms only, at 1 MB.
  **RENDER WALL-CLOCK — tasks.md 6.2's own table; median beside floor (ms).** *sync* is one
  `renderPreview` (`mount()` + the enhancers' synchronous half) — what the cooldown times
  today. *quiet* is until the preview's DOM has been still for 400 ms — the enhancers'
  asynchronous half, which nothing times (R7). The reference document (small prose) is measured
  before and after every other one: A-B-A, in one session.

  **Render wall-clock — chromium**

  | Document | n | sync median | sync floor | quiet median | quiet floor |
  |---|--:|--:|--:|--:|--:|
  | REFERENCE before (prose, small) | 10 | 3.5 | 1.8 | 4 | 2 |
  | prose small | 12 | 3.7 | 1.6 | 4 | 2 |
  | REFERENCE after prose small (prose, small) | 10 | 2.1 | 1.5 | 2 | 2 |
  | prose 50k | 12 | 21.7 | 18.4 | 22 | 18 |
  | REFERENCE after prose 50k (prose, small) | 10 | 4.3 | 1.4 | 4 | 2 |
  | prose 1m | 5 | 334.1 | 330.8 | 334 | 331 |
  | REFERENCE after prose 1m (prose, small) | 10 | 4.3 | 1.4 | 4 | 2 |
  | heavy small | 12 | 5.9 | 2.7 | 13 | 7 |
  | REFERENCE after heavy small (prose, small) | 10 | 3.9 | 1.6 | 4 | 2 |
  | heavy 50k | 12 | 38.3 | 33.6 | 191 | 182 |
  | REFERENCE after heavy 50k (prose, small) | 10 | 4.9 | 1.5 | 5 | 2 |
  | heavy 1m | 5 | 1696.0 | 1616.9 | 1703 | 1624 |
  | REFERENCE after heavy 1m (prose, small) | 10 | 1.5 | 1.3 | 2 | 1 |

  **Render wall-clock — firefox**

  | Document | n | sync median | sync floor | quiet median | quiet floor |
  |---|--:|--:|--:|--:|--:|
  | REFERENCE before (prose, small) | 10 | 3.0 | 2.0 | 3 | 2 |
  | prose small | 12 | 4.0 | 1.0 | 4 | 2 |
  | REFERENCE after prose small (prose, small) | 10 | 5.0 | 2.0 | 5 | 2 |
  | prose 50k | 12 | 20.0 | 15.0 | 20 | 15 |
  | REFERENCE after prose 50k (prose, small) | 10 | 4.0 | 1.0 | 4 | 1 |
  | prose 1m | 5 | 309.0 | 301.0 | 309 | 301 |
  | REFERENCE after prose 1m (prose, small) | 10 | 4.0 | 2.0 | 5 | 2 |
  | heavy small | 12 | 8.0 | 4.0 | 20 | 15 |
  | REFERENCE after heavy small (prose, small) | 10 | 5.0 | 3.0 | 5 | 3 |
  | heavy 50k | 12 | 54.0 | 47.0 | 333 | 295 |
  | REFERENCE after heavy 50k (prose, small) | 10 | 6.0 | 2.0 | 6 | 2 |
  | heavy 1m | 5 | 3680.0 | 3490.0 | 23094 | 10514 |
  | REFERENCE after heavy 1m (prose, small) | 10 | 2.0 | 1.0 | 2 | 1 |

  **TYPING — a selection (ms; column notes are in the results file).** *key* = sent → in the
  buffer; *busy* = sent → main thread free (floor ≈ 19 ms Chromium, 11–13 ms Firefox).

  **Typing — chromium · heavy · 50k · 150 ms between keys (24 keys, 2 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 3 | 3.8 | 7 | 8 | 73 | 75 | 48/48 | 4 | 24 | 23 | 36.2 | 39 | 876 |
  | C1-copy | 2 | 3.6 | 10 | 34 | 78 | 192 | 46/48 | 2 | 23 | 22 | 35.7 | 39 | 672 |
  | C2 deferred | 2 | 3.7 | 18 | 74 | 27 | 79 | 1/48 | 3 | 24 | 23 | 35.9 | 42 | 806 |
  | C3 x2 | 2 | 3.5 | 7 | 8 | 76 | 84 | 47/48 | 3 | 24 | 23 | 36.4 | 38 | 702 |
  | C3 x3 | 2 | 3.9 | 12 | 19 | 74 | 79 | 21/48 | 3 | 24 | 23 | 36.0 | 43 | 850 |
  | C4 trailing 150 ms | 2 | 5.2 | 66 | 70 | 75 | 80 | 13/48 | 0 | 7 | 6 | 40.7 | 242 | 411 |
  | C4 trailing 300 ms | 2 | 2.7 | 6 | 7 | 20 | 20 | 0/48 | 0 | 1 | 0 | 41.5 | 351 | 505 |

  **Typing — firefox · heavy · 50k · 150 ms between keys (24 keys, 2 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 2 | 366.8 | 815 | 888 | 2756 | 2994 | 48/48 | n/a | 24 | 19 | 48.0 | 737 | 2652 |
  | C1-copy | 30 | 432.5 | 1014 | 1060 | 3236 | 3515 | 48/48 | n/a | 18 | 16 | 47.0 | 219 | 1854 |
  | C2 deferred | 31 | 96.2 | 203 | 510 | 392 | 519 | 46/48 | n/a | 17 | 16 | 48.0 | 90 | 1682 |
  | C3 x2 | 14 | 572.0 | 1003 | 1058 | 3221 | 3508 | 48/48 | n/a | 21 | 17 | 47.0 | 672 | 2500 |
  | C3 x3 | 17 | 129.4 | 1267 | 1552 | 1725 | 1827 | 45/48 | n/a | 10 | 8 | 47.0 | 253 | 1640 |
  | C4 trailing 150 ms | 13 | 28.1 | 111 | 132 | 225 | 238 | 15/48 | n/a | 4 | 3 | 55.0 | 208 | 557 |
  | C4 trailing 300 ms | 2 | 4.4 | 12 | 24 | 15 | 25 | 0/48 | n/a | 1 | 0 | 49.0 | 361 | 887 |

  **Typing — chromium · prose · 1m · 150 ms between keys (24 keys, 1 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 7 | 38.9 | 311 | 322 | 379 | 412 | 14/24 | 6 | 6 | 5 | 346.2 | 419 | 419 |
  | C1-copy | 7 | 15.6 | 298 | 372 | 441 | 580 | 14/24 | 8 | 6 | 5 | 337.3 | 602 | 602 |
  | C2 deferred | 7 | 31.0 | 321 | 332 | 390 | 408 | 12/24 | 9 | 6 | 5 | 349.5 | 595 | 595 |
  | C3 x2 | 6 | 10.7 | 275 | 279 | 335 | 434 | 9/24 | 6 | 5 | 4 | 350.2 | 1162 | 1162 |
  | C3 x3 | 6 | 10.7 | 283 | 333 | 395 | 507 | 9/24 | 6 | 4 | 3 | 354.0 | 1467 | 1467 |
  | C4 trailing 150 ms | 6 | 10.8 | 228 | 362 | 284 | 424 | 3/24 | 3 | 2 | 1 | 340.0 | 510 | 510 |
  | C4 trailing 300 ms | 6 | 6.9 | 13 | 14 | 19 | 20 | 0/24 | 1 | 1 | 0 | 348.3 | 657 | 657 |

  **Typing — firefox · prose · 1m · 150 ms between keys (24 keys, 1 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 11 | 235.4 | 465 | 596 | 1032 | 1134 | 21/24 | n/a | 6 | 5 | 314.0 | 402 | 402 |
  | C1-copy | 12 | 201.5 | 401 | 541 | 471 | 595 | 19/24 | n/a | 7 | 6 | 310.0 | 1280 | 1280 |
  | C2 deferred | 23 | 281.0 | 690 | 819 | 883 | 963 | 21/24 | n/a | 6 | 5 | 315.0 | 1052 | 1052 |
  | C3 x2 | 10 | 86.3 | 380 | 464 | 467 | 526 | 14/24 | n/a | 5 | 4 | 317.0 | 722 | 722 |
  | C3 x3 | 45 | 77.4 | 369 | 390 | 498 | 523 | 14/24 | n/a | 4 | 3 | 297.0 | 717 | 717 |
  | C4 trailing 150 ms | 9 | 16.5 | 23 | 26 | 26 | 26 | 0/24 | n/a | 1 | 0 | 312.0 | 474 | 474 |
  | C4 trailing 300 ms | 11 | 18.4 | 22 | 25 | 26 | 28 | 0/24 | n/a | 1 | 0 | 311.0 | 624 | 624 |

  **Typing — chromium · heavy · 1m · 150 ms between keys (24 keys, 1 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 4 | 1560.9 | 3009 | 3146 | 5269 | 5424 | 24/24 | 8 | 2 | 1 | 1708.4 | 4162 | 6721 |
  | C1-copy | 7 | 1429.6 | 2320 | 2474 | 2505 | 2655 | 24/24 | 526 | 2 | 1 | 1609.8 | 3680 | 89121 |
  | C2 deferred | 32 | 1424.1 | 2755 | 2892 | 5139 | 5274 | 24/24 | 9 | 2 | 1 | 1626.0 | 3862 | 6520 |
  | C3 x2 | 4 | 1584.8 | 3169 | 3321 | 3338 | 3491 | 24/24 | 8 | 2 | 1 | 1596.5 | 4782 | 7240 |
  | C3 x3 | 5 | 1526.9 | 2658 | 2810 | 2912 | 2992 | 24/24 | 17 | 2 | 1 | 1603.8 | 5871 | 8377 |
  | C4 trailing 150 ms | 4 | 7.7 | 1957 | 2109 | 4611 | 4766 | 6/24 | 7 | 2 | 1 | 1660.6 | 5827 | 8500 |
  | C4 trailing 300 ms | 7 | 19.6 | 52 | 66 | 124 | 125 | 10/24 | 26 | 1 | 0 | 1715.0 | 2067 | 4711 |

  **Typing — firefox · heavy · 1m · 150 ms between keys (24 keys, 1 run(s) per candidate)**

  | Candidate | first key | key p50 | key p95 | key max | busy p95 | busy max | keys busy ≥ 50 ms | long tasks | renders | while typing | render median | stale: text | stale: settled |
  |---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
  | C1 today | 420 | 3302.7 | 4737 | 4857 | 25176 | 25309 | 24/24 | n/a | 2 | 1 | 3897.0 | 13644 | 23899 |
  | C1-copy | 10 | 3181.0 | 4538 | 4686 | 24994 | 25097 | 24/24 | n/a | 2 | 1 | 3914.0 | 13721 | 22471 |
  | C2 deferred | 29 | 2708.9 | 4040 | 4159 | 24021 | 24120 | 23/24 | n/a | 2 | 1 | 3553.0 | 12694 | 21556 |
  | C3 x2 | 30 | 4182.4 | 5473 | 5605 | 32982 | 33114 | 24/24 | n/a | 2 | 1 | 4166.0 | 20282 | 30630 |
  | C3 x3 | 26 | 3027.9 | 4403 | 4532 | 12253 | 12386 | 24/24 | n/a | 2 | 1 | 3878.0 | 16634 | 33483 |
  | C4 trailing 150 ms | 614 | 3439.7 | 4845 | 4917 | 25717 | 25806 | 22/24 | n/a | 2 | 1 | 3903.0 | 14408 | 25104 |
  | C4 trailing 300 ms | 424 | 3467.5 | 4861 | 4996 | 25041 | 25169 | 22/24 | n/a | 2 | 1 | 3929.0 | 14356 | 23281 |

  **WHAT THE TABLES SHOW — described, not ranked.**
  - *Small documents, and prose up to 50 KB (both engines, all three rates).* A render costs
    2–20 ms. Every candidate keeps keys at the floor (p50 2–7 ms). The cooldown candidates
    render on essentially every key (24 renders for 24 keys) and the preview is current within
    ~5–25 ms of the last key. The trailing debounce shows the final text its own interval later
    (≈ 160–190 ms, ≈ 310–350 ms) and — the starvation the spec names — renders NOTHING while
    typing whenever the gap between keys is shorter than the interval: C4-300 at every rate
    measured, C4-150 at 80 ms.
  - *The first key after a pause (P-2).* Its own latency is at the floor everywhere it could be
    measured cleanly: the character is in the buffer BEFORE the render it triggers. What C1
    costs shows in *busy*: on the heavy 50 KB document the main thread stays busy ~75 ms per key
    on Chromium with the render inside the key (47–48 of 48 keys ≥ 50 ms) against ~20–27 ms
    with the first render deferred (C2: 1 of 48). On prose 50 KB the same split is ~30 ms
    against ~19 ms. The next key is what pays, if it arrives inside that window.
  - *Enhancer-heavy 50 KB — where the engines part.* Chromium: sync 38 ms, quiet 190 ms; at
    250 and 150 ms between keys every cooldown candidate keeps key p50 at 2–4 ms, and at 80 ms
    it rises to 17–29 ms with fewer renders (11–16). Firefox: sync 54 ms, quiet 333 ms, and at
    150 ms between keys the cooldown candidates hold keys for hundreds of milliseconds — C1 p50
    367, max 888; C1-copy 433; C3 x2 572 — with *busy* in the seconds, while C2 (96) and C3 x3
    (129) sit lower and C4-300 stays at the floor (4 ms) with one render. At 250 ms Firefox is
    back near 16–30 ms p50 with long tails (max 316–1,203). The cooldown times the 54 ms
    synchronous half; the work that holds the keys is the asynchronous half it does not see.
  - *1 MB prose.* One render is ~310–340 ms on both engines. Cooldown candidates render 4–6
    times in a 24-key run; keys queue behind them (p95 ≈ 275–320 ms Chromium, 370–690 ms
    Firefox; median 11–39 ms Chromium, 77–281 ms Firefox). A higher multiplier means fewer
    renders (6 → 5 → 4) and, on Chromium, a staler preview after the last key (419 → 1,162 →
    1,467 ms). C4-300 keeps keys at 7–18 ms with one render, 620–660 ms after the last key.
  - *1 MB enhancer-heavy.* One render is 1.7 s (Chromium) / 3.7 s (Firefox) synchronous, and on
    Firefox the preview is not quiet for 10–23 s. No candidate keeps typing responsive: key p50
    is 1.4–1.6 s on Chromium for every cooldown candidate and 2.7–4.2 s on Firefox for EVERY
    candidate, the trailing debounce included — there the first key alone waits 420–610 ms in
    three of seven rows, before any render of the run has begun. Only C4-300 on Chromium stays
    low (p50 20 ms, one render).
  - *Renders per run.* Wherever a render costs less than the gap between keys, the multiplier
    changes nothing: a cooldown of 1x, 2x or 3x a 4–38 ms render has expired before the next
    key. It bites only once render cost × (1 + multiplier) exceeds the key gap.
  **THE NOISE — read every difference against it.** One machine (13th-gen Core i7-13700, 24
  threads, 64 GB, Windows 11), headless browsers, the two engines run one after the other with
  nothing else started. *The control inside the run is C1 against C1-copy — the same mechanism
  twice.* On small and prose documents the two agree to within a couple of milliseconds. On the
  heavy 50 KB document on Firefox they do NOT: key p50 367 vs 433 at 150 ms, 266 vs 521 at
  80 ms, key max 50 vs 1,203 at 250 ms. So on the rows where the candidates differ most, two
  runs cannot separate two cooldown variants that differ by less than about 2x; the trailing
  debounce's distance from all of them is far outside that. The 1 MB rows are ONE run each and
  are an order of magnitude, not a figure. Render tables: the reference document's median moved
  between 1.5 and 4.9 ms across the Chromium session (floor 1.3–1.8) and 2–6 ms on Firefox —
  drift of a few milliseconds, small beside every 50 KB and 1 MB figure and comparable to the
  small-document figures themselves. Firefox's clock resolves 1 ms.
  **LIMITS, NAMED.**
  - Production source, not the production build; an http origin, not the extension's; a bare
    page with no app shell around the reader. Row-to-row comparison on this machine, not a
    statement about a user's.
  - *quiet* and *stale: settled* mean "no DOM mutation for 400 ms", capped at 120 s. Work that
    pauses longer than that and resumes is undercounted — and the heavy 1 MB preview held 207
    drawn diagrams of 395 when Chromium called it quiet, so that row's *quiet* (≈ its *sync*)
    is certainly too low. Whether the rest are deferred by design was not looked into.
  - The heavy 1 MB typing rows start 600 ms after a warm-up render that the same undercount
    may have cut short: enhancer work left over from BEFORE the run is the likeliest reason
    every candidate there, the trailing debounce included, is slow from the first key. That is
    the enhancers' cost (R7), seen but not isolated.
  - Typing appends at the END of the document; the diagram cache is warm after the first
    render; no measurement was taken with a watch running, a diff displayed, or at spec §8's
    10 MB / 50k-line ceiling.
  - *busy* has a floor of its own and Firefox has no Long Tasks API: "keys busy ≥ 50 ms" is the
    one long-task measure both engines share.
  **THE TWO AXES §8-2 ASKS TO HAVE LAID OUT — laid out, not resolved.**
  - *Fixed vs adaptive.* A fixed trailing interval protects keystrokes on every document
    measured except the heavy 1 MB one on Firefox, and pays for it on every document — the
    small ones included — with a preview that waits its interval after the last key and does
    not move at all while typing is faster than it. The cost-proportional cooldown is current
    within a render's time on anything up to prose 50 KB, and protects keystrokes only as far
    as the cost it times is the cost that blocks.
  - *The large-document cadence.* At 1 MB a single render outlasts several keys on both
    engines. What that cadence should be, and whether the untimed asynchronous half belongs in
    whatever times it, is the ruling's.
  **VERIFY.** `git diff --stat` over `src/` and `entrypoints/` empty. A clean two-engine
  build: all 139 shipped files md5-identical to 4.4's build on Chromium and on Firefox —
  `.output` 5,825,744 / 5,825,860 B, content script 342,806 B (`c4f59f1a…` / `ecc31688…`),
  manifests 654 / 770 B, `permissions: []`. lint 0 (it covers both new scripts) · unit 1412 in
  11.70 s (11.73 s before) · the browser project still lists 186 files and neither project
  lists the harness · scanner clean over 80 files · `pnpm audit --prod` EXIT=0 · golden empty.
  The full browser suite was NOT re-run: nothing it runs changed.
  **KICKOFF VS FILE, FLAGGED.** (1) `tasks.md` 6.2 asks for render wall-clock across the size
  corpus, median and floor, A-B-A, with the two axes laid out. The kickoff asked for much more
  — candidates, keystroke latency, long tasks, staleness, renders per run, two profiles. Both
  were done; the candidate tables are how the axes are laid out, and everything beyond the
  render table exceeds the task line and is marked as such here. (2) "A-B-A … interleaved": the
  reference document brackets every measured one; the measured documents themselves run as
  blocks, not interleaved sample by sample. Candidates ARE interleaved. (3) Files: tasks.md
  names "a perf script under `scripts/`" and `package.json`. Three files are under
  `scripts/` — the driver, its in-page half, and the results file. (4) An idle callback was
  offered for C2; a 0 ms task was used. (5) p95 over 46 keys (two runs) is close to the
  maximum; it is printed beside the max for that reason.
  *Revisit-when:* the human's §8-2 ruling (6.4 applies it and removes the PROVISIONAL marker) ·
  6.3 (the nested host's cost) · any wish to isolate the enhancers' asynchronous half — the
  harness times it only by DOM silence.

- **2026-10-09 · M12 TASK 4.4 — LANDED: leaving edit shows the NEWEST text, in one render; the
  reversed observer order measured; the route-2(i) case REBUILT, not retired. One defect and one
  double render were seen and fixed in `appShell.ts`; `watchController.ts` is untouched.**
  **WHAT WAS OBSERVED FIRST (step 0), at `67f2ac5`, Chromium, on the app page's OWN watch** —
  its controller and detector, switched on with the reader's watch control; nothing hand-driven.
  After leaving edit and letting the watch settle:

  | | Reading view | Disk | Re-mounts | Hint | The guard asked |
  |---|---|---|---|---|---|
  | S1 · watched, Edit, type, Save, external write (held), Stop editing | **the SAVE** | external | **2** | gone | no — the buffer was clean |
  | S2 · as S1, a second Save (refused), Stop editing → Discard | **the SAVE** | external | **2** | gone | yes |
  | S3 · REVERSED: Edit, Watch on, type, Save, Stop editing | the save | the save | **2** | gone | no |
  | S4 · Edit, type, Save, Watch on, Stop editing | the save | the save | 1 | gone | no |
  | S5 · the 4.3 control | the save | the save | 1 | gone | no |

  **S1 and S2 were WRONG:** the reading view showed Peekover's own earlier save while the file
  held somebody else's newer text — stale against the disk, with the hint already cleared and the
  watch still running (it would not correct itself: the detector had already reported that
  text). The watch flushed the external text as edit was left, and `showSaved` then rendered the
  save over it. This is the sequence 6.1 flagged unmeasured; it does not need the guard (S1 never
  asks). **S3 showed the right text, rendered twice:** the session's exit observer was created
  before the watch's, so the shell rendered the save and the watch then flushed the same text.
  S4 and S5 were right, in one render.
  **THE RULE, AS BUILT — "exit converges on the newest known text", decided in `showSaved`
  (`appShell.ts`).** Two changes, and no second render anywhere:
  - *The decision waits for every observer.* The exit observer now runs `showSaved` in a
    microtask. Observer callbacks for one mutation are delivered together, in creation order;
    a microtask queued from one of them runs after all of them. So whichever was created first,
    a running watch has flushed what it held before the shell decides.
  - *A re-mounted document is left alone.* The binding keeps a node of the document as mounted at
    edit entry (`EditBinding.mounted`, the shadow root's first child — `mount()` replaces them
    all). If it is no longer connected when `showSaved` runs, something rendered the document
    since — only the watch can — and what it rendered is the newest text: its own held external
    change, or the save it was told of. Identity, not text, on purpose: an external change BACK
    to the text as opened still counts as newer. After the shell's own render the node is taken
    again, so a later save of the same session is judged from there.
  The existing "the source already IS the written text" check stays. *Under the rule:* S1 / S2 —
  the watch flushes the external text, the shell sees a re-mount and stands down: the external
  text, one render. S3 — the watch flushes the save first (the microtask), the shell finds the
  source equal: one render. S4 — a watch started after the save holds nothing (`ownWrite` on a
  stopped controller is a no-op), nothing re-mounts, the shell renders: one render. S5 — as 4.3.
  **A SIXTH SEQUENCE, ADDED — S6, unwatched, R25's accepted path:** Save; type; a second Save
  left waiting on its write prompt; Stop editing → Discard; then the prompt is granted. The view
  shows the first save on exit and the second when it lands — two renders, one each. It is the
  case the "node taken again" line exists for, and it reddens without it.
  **TESTS, RED-FIRST** — `editorSave.browser.test.ts`, a new block "012 task 4.4", S1–S6,
  Chromium. At HEAD (S1–S5): 3 red, 2 green — S1 and S2 on the claim (`the reading view is the
  NEWEST text — what is on disk`), S3 on `in one re-render: expected 2 to be 1`. With the fix:
  all six green. Ablations, each restored byte-identical (md5 checked):
  - the re-mounted check removed → S1 and S2 red, the save over the external text, 2 re-mounts;
  - the microtask removed → S3 red, 2 re-mounts;
  - the node not taken again → S6 red, the view STALE after the late save.
  **R24(iii) — THE ROUTE-2(i) CASE IS REBUILT, NOT RETIRED. A departure from the ruling's first
  clause, under its second.** R24(iii) ruled the case retired "since … its state is unreachable
  by design", and added: "If a meaningful form of it still exists, say so and rebuild it
  instead." One does. The guard is silent for a CLEAN buffer, so B can still be selected with
  A's session and binding alive, and a save function taken at edit entry can still be called —
  the shape of a save that lands late. The case now enters edit on A, types nothing, builds the
  request by hand, selects B (asserting no question), calls the kept save, and asserts B
  byte-identical, the outcome `saved`, and A written. **It can fail again:** with the binding
  moved to the active file at the call, B is overwritten — red on "B is byte-identical". The old
  case's text is replaced by a named comment at its place; its step re-spelled at 6.1 goes with
  it. 4.3's switch-window cases still pin the entry half. *If the human still wants it retired,
  that is a deletion.*
  **BYTES.** `.output` 5,825,744 (Cr) / 5,825,860 (Fx), **+121** each; headroom 1,514,288 /
  1,514,172 B under 7 MiB. zip 1,841,144 / 1,841,202 (+189). Manifests 654 / 770 B,
  `permissions: []`. One file changed size on each engine: the app chunk, 528,201 → 528,322.
  *The content script: md5-IDENTICAL* (342,806 B; `c4f59f1a…` / `ecc31688…`) —
  `watchController.ts` was not touched, and it held in every arm. *The app chunk, by Chrome
  removal arms in sequence, landing on the baseline:* the microtask 20 · the node taken again
  37 · the re-mounted check and the node taken at entry 64 = **121, residual 0**.
  **FULL SUITE.** lint 0 · unit 1412 · browser, run alone, 186 files, 1933 passed / 51 skipped,
  ZERO reds (397 s) · scanner clean over 80 files, self-test 7 + 10 · `pnpm audit --prod`
  EXIT=0 · golden empty. `editorSave` 36 (+30 skipped) · `editorUnsaved` 82 (+2) ·
  `editorWatch` 12 · `exportShortcut` 18 · unit `watchController` 64. No flake fired.
  **NOT COVERED, NAMED.** All six sequences are Chromium: the app page's own watch on a writable
  handle exists only there. A watch turned on mid-edit is driven by a programmatic click on the
  watch control; whether a user can reach that control while editing was not looked at. S6's
  held prompt is a stub on the handle. A real external editor racing a real save is 7.1's.
  **KICKOFF VS FILE, FLAGGED.** (1) R24(iii): rebuilt, not retired (above). (2) S6 is beyond the
  kickoff's five. (3) The kickoff offered "showSaved defers to an active watch that holds a
  newer text"; no query was added to the controller — the re-mount is the evidence, so
  `watchController.ts`, its test and the content script are zero-diff. (4) Files changed:
  `appShell.ts`, `editorSave.browser.test.ts`, the three records — no ripple.
  *Revisit-when:* the human's word on the rebuilt case · 7.1 (a real disk and a real editor) ·
  any later change to which module renders at an edit exit.

- **2026-10-09 · M12 RULINGS R24–R25 — two HUMAN RULINGS taken in task 4.4's kickoff: a
  discovered task 4.4 between 6.1 and 6.2; 6.1's dialog copy and its deviation 2 approved.**
  Stated in the kickoff as approved by the human running it, dated 2026-10-09. The agent chose
  nothing; this entry records them.
  **★ R24 — DISCOVERED task 4.4, "exit shows the NEWEST text", runs AFTER 6.1 and BEFORE 6.2.
  Count 26 → 27.** (i) Observe first; after leaving edit the reading view must show the NEWEST
  text the file is known to hold — an external change held by the watch beats Peekover's own
  earlier write. Fix only what is seen to be wrong. (ii) Measure the REVERSED observer order
  (Watch turned on AFTER entering edit) and Watch turned on after a save, before the exit — and
  remove "the reversed observer order" from 7.1's walk list once measured. (iii) RETIRE
  `editorSave`'s "moving the open file to B after entering edit on A…" case, with a named note
  pointing to 4.3's switch-window cases; "If a meaningful form of it still exists, say so and
  rebuild it instead." *Outcome:* (i) two sequences wrong, fixed; (ii) measured, one double
  render fixed, the 7.1 item removed; (iii) a meaningful form exists — REBUILT (the entry above).
  **★ R25 — 6.1's dialog copy is APPROVED as drafted, and deviation 2 is accepted** — discard on
  the edit control leaves edit as the control does, so a save already in flight may complete.
  *Outcome:* nothing to change; S6 (4.4) now pins what the reading view does when that save lands.
  *Revisit-when:* the 7.1 walk.

- **2026-10-09 · M12 TASK 6.1 — LANDED: the unsaved-changes guard at every exit, asked at the
  TRIGGER; an in-page dialog (R23); `beforeunload` for tab close and reload. The dialog's copy is
  DRAFTED, for review. Four existing test steps re-spelled, named below; one of them weakened a
  test, flagged.**
  **THE EXITS, each with its trigger and what "Keep editing" leaves.** All in `appShell.ts` except
  the last. The question is put where the user's intent is first known and nothing has happened:
  1. *The edit control ("Stop editing").* A CAPTURE-phase click listener on the reader pane hears
     the click before the control inside the reader's shadow root does; with unsaved changes it
     stops there. Stay: the click never arrives.
  2. *A file in the tree.* `onSelect`, before `selectFolderFile` starts the read (4.3's finding).
     Stay: the other file is never read; the open file and the pin bar are unchanged.
  3. *Revoke.* The chip's callback. Stay: the grant and the stored folder are untouched.
  4. *Opening a folder.* The CTA and `AppController.openFolder`. Stay: no picker.
  5. *A reopen-hub entry* — a live handle (the re-grant) or a re-pick (the picker). Stay: neither
     is asked for.
  6. *A drop* — a folder, or something that is not one. Stay: nothing of it is applied.
  7. *`AppController.selectFile`* (the store-free seam). Stay: nothing is read.
  8. *Tab close / reload.* `beforeunload`, in `editorView.ts`. The browser's own dialog.
  `paintIdle`, `applyOutcome` and `revokeAccess` keep their `endEditSession`: by then the session
  is clean or already discarded. While a question is up a further trigger is ignored.
  **IT ASKS ONLY WHEN** the host is in edit AND carries `data-edit-dirty` (`hasUnsavedEdit`). A
  clean session is left without a word on every path. After a DOWNLOAD the attribute is still
  there, so every exit asks — intended (5.4).
  **THE DEFERRAL MECHANICS.**
  - *Activation.* "Discard edits" calls the action SYNCHRONOUSLY from inside its own click, after
    the dialog is closed and the session ended. So the picker, and a handle's permission request,
    start in a click's own task. Holds on both engines by construction — asserted with a stood-in
    picker that records it was called before the click returned. The NATIVE picker after the
    dialog is 7.1's.
  - *A drop.* `dropToOutcome` is called DURING the drop event, before anything is asked — a
    `DataTransfer`'s items exist only then. Its promise is held; "Discard edits" applies it;
    "Keep editing" abandons it. So on a stay the dropped folder WAS walked and read, and nothing
    of it was applied: `activeRoute`, the folder, the tree and the session are as they were.
  - *A re-pick that is cancelled.* The question comes before the picker. After "Discard edits"
    the edit is gone; cancelling the picker then closes the folder as it always did. There is no
    way to ask after the picker — its outcome has already happened.
  **"DISCARD", AND ONE DEPARTURE FROM THE KICKOFF.** On the shell's paths discard is
  `endEditSession` as 5.3 built it — the binding dropped first, so nothing is written or
  downloaded afterwards — then the action. On the EDIT CONTROL it is the control's own exit and
  the binding is KEPT: `showSaved` refuses a dropped binding, so dropping it would leave an
  unwatched reading view stale after Save → more typing → discard (R19). The kickoff said discard
  always ends the session "as 5.3 built it"; `tasks.md` says each path offers the choice "exactly
  as leaving edit does" — the file was followed. *Consequence, stated:* on that one path a Save
  the user had already started when they answered may still complete, writing what they asked to
  save at that click. The discard itself writes nothing.
  **R6'S ASYMMETRY, AS BUILT** — on the app page's own watch, an external change held, the buffer
  dirty (Chromium, 4.3's rig). *Stay:* nothing runs, so nothing changes — still in edit, zero
  re-mounts, the hint present, the watch running, the document behind still the text as opened;
  measured on the edit control and on a file selection. *Discard:* the control's exit tears down,
  dirty clears, the watch's observer sees edit left and flushes what it held — the on-disk text,
  exactly ONE re-mount, the hint gone, the file on disk untouched. No code was added for it.
  *Interplay with 4.3.* `ownWrite`: untouched — a discard announces nothing, because it writes
  nothing. `showSaved`: on the control path it still runs, with the kept binding. ★ NOT MEASURED,
  flagged: Save, THEN an external change is held, THEN more typing and a discard. The watch
  flushes the external text first and `showSaved` then finds the source different from what it
  wrote; reading its code, it would render the SAVED text over the newer on-disk text. That
  sequence does not need 6.1 (a clean exit after Save and an external change takes the same
  road), so it is 4.3's, unprobed here. For the human to schedule.
  **`beforeunload`.** `markDirty` in `editorView.ts` is now the one place the dirty attribute is
  set or removed, and it adds or removes that host's listener in the same call: one listener per
  dirty host, however much is typed; gone when the buffer matches the file again, when a save
  writes, when the session ends or is dropped as stale. `preventDefault()` plus `returnValue`.
  Measured on both engines with a cancelable synthetic event: claimed while dirty and after
  "Keep editing"; not claimed before, in a clean session, or after "Discard edits"; listeners
  added minus removed = 0.
  **THE DIALOG (R23)** — `src/app/unsavedGuard.ts`, app-only, its own `<style>`. Hand-rolled
  `role="dialog"` + `aria-modal`, like the export panel and the lightbox — not `showModal()`:
  jsdom has neither that nor `inert`'s behaviour, and a hand-rolled one can be asserted in both.
  A child of the shell (it inherits the theme tokens) covering it; every OTHER child of the shell
  is `inert` while it is open. Named by its title, described by its body. Tab wraps between the
  two buttons; Escape is "Keep editing"; focus returns to where it was, followed into the
  reader's shadow root.
  **THE COPY — DRAFTED BY THE AGENT, FOR REVIEW (R23).**
  - Title: "Discard unsaved edits?"
  - Body: "“notes.md” has edits that are not saved to the file in its folder. If you discard
    them, they are gone." — with no file name: "This document has edits …".
  - Buttons: "Keep editing" (first, focused) · "Discard edits".
  - No status line after a discard: the action itself is what the user then sees.
  The name is the file the session was opened on (`EditBinding.name`), set as text.
  **TESTS, RED-FIRST.** New `tests/browser/editorUnsaved.browser.test.ts` — 84 cases, 82 pass + 2
  skipped (R6 is Chromium-only): 42 Chromium + 40 Firefox. At HEAD, before any implementation:
  60 red (31 + 29), 22 green — the clean direction. EVERY one of the ten in-page paths was red on
  BOTH engines on its first assertion, the typed text: `expected '<no live edit session — the
  buffer is gone>' to be '# Guard doc…'` — lost text, in that path's own units, with no prompt.
  With the guard: stay, discard and clean hold on all ten, both engines. Ablations, each restored
  byte-identical: the guard made unconditional → the 20 clean cases and 4 more red, 24 in all
  (`tasks.md`'s named red); `inert` not set → "the page behind is inert" red on both, on focus.
  Unit +40 (1372 → 1412): `unsavedGuard.test.ts` 17 (new), `appShell.test.ts` +17 (every
  trigger, dirty and clean, with a real edit session in jsdom; the action inside the click; the
  drop taken during its event), `editorView.test.ts` +6 (the listener). 13 of them red at HEAD,
  plus the unresolved module.
  **EXISTING TESTS — FOUR STEPS RE-SPELLED, NO ASSERTION EDITED.** Each made a dirty exit by the
  code path and now meets the question; each answers "Discard edits" and goes on:
  `editorSave` "leaving edit WITHOUT a save", "a DOWNLOAD is not a save", "moving the open file
  to B…", and `exportShortcut`'s ruling-B case (where its save was a download). ★ FLAGGED: the
  third is WEAKENED. Discard ends the session, so its kept save now always answers
  `unavailable`; the test still passes on the "or nothing is" arm it already had, but its 5.3
  ablation (the binding read at the click → B overwritten) can no longer redden it. 4.3's
  switch-window cases still pin the binding. Whether to rebuild that case on a clean buffer is
  the human's call.
  **BYTES.** `.output` 5,825,623 (Cr) / 5,825,739 (Fx), **+3,594** each; headroom 1,514,409 /
  1,514,293 B under 7 MiB. zip 1,840,955 / 1,841,013 (+1,204). Manifests 654 / 770 B,
  `permissions: []`. One file changed size on each engine, the app chunk: 524,607 → 528,201
  (the other chunks are renamed by its hash, sizes identical).
  *The content script: md5-IDENTICAL* — 342,806 B, `c4f59f1a…` (Cr) / `ecc31688…` (Fx), in the
  final build and in every arm. *The control that moves it:* `unsavedGuard` imported from
  `mount.ts` → 542,575 B on both engines, new md5s; removed, identical again.
  *The app chunk, by Chrome removal arms in sequence (they land on the baseline exactly):*

  | Piece | Bytes |
  |---|---|
  | `beforeunload` (`editorView.ts` as at HEAD) | 234 |
  | the dialog's CSS | 940 |
  | the dialog — DOM, copy, trap, `inert`, focus | 1,731 |
  | trigger: the `selectFile` seam | 8 |
  | trigger: a drop (capture, early return, the abandoned result) | 47 |
  | trigger: the reopen hub | 16 |
  | trigger: opening a folder | 10 |
  | trigger: Revoke | 2 |
  | trigger: the tree — the last `guarded` caller, so `guarded` goes with it | 104 |
  | trigger: the edit control — the listener, and `hasUnsavedEdit` with it | 460 |
  | the two flags, `exitByControl`, `askToDiscard` and the import, once nothing calls them | 42 |
  | **sum** | **3,594** — measured +3,594, **residual 0** |

  **FULL SUITE.** lint 0 · unit 1412 · browser, run alone, 186 files, 1927 passed / 45 skipped,
  ZERO reds (392 s) · scanner clean over 80 files, self-test 7 + 10 · `pnpm audit --prod` EXIT=0
  · golden empty. Named: `editorUnsaved` 82 (+2 skipped) · `editorSave` 30 (+24) ·
  `editorWatch` 12 · `editorRender` 20 · `exportShortcut` 18 · `folderGrant` 12 ·
  `folderDrop` 10 · `handlePersist` 14 · `firefoxFallback` 14 · unit `editorEnhancer` 32 ·
  `editorView` 82 · `appShell` 79 · `unsavedGuard` 17 · `permissionsLedger` 9 · `htmlExport`
  13 (the 26-site pin green). An earlier full run, before the four re-spellings, had those four
  red and one more: `copyAsHtml` on Chromium (another test's clipboard text) — 14/14 alone and
  clean in the final run; the known shared-clipboard flake.
  **MOVED TO 7.1, NOT FAKED.** The browser's OWN unload dialog on close and reload, both engines
  (a synthetic event raises none; a browser may also skip it for a page never interacted with).
  The native picker opening from the "Discard edits" click, both engines. A real drag from the
  desktop over a dirty edit. The dialog seen in both themes and at a wide viewport, and heard in
  a screen reader.
  **STILL NOT ASKED ABOUT, NAMED.** An extension reload or update, a crash, a discarded tab —
  nothing can ask. A Save already in flight when "Discard edits" is answered on the edit control
  (above).
  **KICKOFF VS FILE, FLAGGED.** (1) The test file is `editorUnsaved…` (`tasks.md`), not
  `editorGuard…`. (2) Discard on the edit control keeps the binding (above). (3) "The tree
  highlight" does not exist; the pin bar is the open-file indicator and is what is asserted.
  (4) With a folder open there is no "Open a folder" button — the picker is reached from a hub
  re-pick; the CTA is guarded for a seam-fed file edited with no folder. (5) Ripples beyond the
  Files list: `src/app/unsavedGuard.ts` + its test (R23) · `appShell.test.ts` and
  `editorView.test.ts` (the unit clauses) · `editorEnhancer.ts`, comment only · `editorSave`
  and `exportShortcut` browser tests (the re-spelled steps). `readerPane.ts`,
  `watchController.ts`, `mount.ts`, `readerMode.ts`, `editorEngine.ts`, `htmlExport.ts`,
  `readerCss.ts`, `PERMISSIONS.md` and the goldens are zero-diff.
  *Revisit-when:* the copy's review · 7.1 (the list above) · the human's call on the weakened
  route-2(i) case and on the unmeasured save-then-external-change exit.

- **2026-10-09 · M12 RULING R23 — HUMAN RULING: the unsaved-changes guard is an IN-PAGE DIALOG,
  not `window.confirm()`.** Given in task 6.1's kickoff, dated 2026-10-09, marked there "approved
  by the human running this prompt". The agent chose nothing; this entry records it.
  - Two real `<button>`s — "Keep editing" (DEFAULT focus; Escape = keep) and "Discard edits".
  - It names the file.
  - It is modal for the app: focus contained, the page behind inert.
  - It is announced to assistive tech; its state is in text, never colour alone.
  - Tab close / reload uses the browser's own `beforeunload` dialog — the only one a page may
    raise there.
  - The copy is drafted by the agent and reviewed on landing (the R18 / R20 practice).
  *Outcome:* built at 6.1 (the entry above); the copy awaits review.
  *Revisit-when:* the copy's review; the 7.1 walk.

- **2026-10-09 · M12 TASK 5.8 — LANDED: every network guard reads its zero only after a later
  request has landed; `PERMISSIONS.md`'s zero-network section says four surfaces; the
  `diagramSourceGuard` and `mathNetwork` shared-state reds are closed, each by its cause. Test and
  records only — no production byte moved. One assertion re-spelled, named below.**
  **(i) THE INSTRUMENT. SCOPE FOUND AT PREFLIGHT: NINETEEN FILES, not five.** Besides
  `editorNetwork` (fixed at 5.7), nineteen browser files read a network zero off Resource Timing:
  `agentBadgeNetwork`, `codeNetwork`, `diagramKatexGate`, `diagramNetwork`, `diagramSecure`,
  `diagramSourceGuard`, `diagramStyleCss`, `exportNetwork`, `firefoxFallback`,
  `folderMode.network`, `handlePersist`, `mathNetwork`, `remoteMedia`, `settingsPort`,
  `snapshotCapture`, `tableNetwork`, `tocNetwork`, `watchNetwork`, `wipe`. Three of them assert
  off-origin; the rest assert zero http(s), whole-buffer or scoped to their own probe token. All
  share the blind spot, so all were done.
  **THE SHARED-HELPER CHANGE** (`tests/browser/helpers/diagramWindow.ts`):
  - `wireSettled()` — flush, issue ONE request to the off-origin loopback (the sentinel), wait
    until it is in the Resource Timing buffer, then flush once more. It THROWS if the sentinel
    never reaches the buffer (a full buffer or a blind observer would otherwise read as a zero).
  - `isSentinel()` — the sentinel is itself an http(s) entry; whole-buffer readers filter it.
  - `renderAndBracket` ends in `wireSettled()` instead of `flush()`, so `diagramNetwork`,
    `diagramSourceGuard` and `diagramKatexGate` inherit the fix with ZERO diff of their own.
  - The other sixteen files import the two functions. In each, the settle replaces the flush in
    front of the LAST zero read of each buffer epoch (or is inserted before it); a whole-buffer
    reader gains the sentinel filter. Per-step reads inside an epoch keep their quick flush —
    the buffer is cumulative, so the settled closing read covers every step before it. No
    assertion's expected value, matcher or message changed in fifteen of the sixteen; the
    sixteenth is `mathNetwork`, whose one re-spelled assertion is (iv) below.
  **WHAT IT PROVES, AND WHAT IT DOES NOT.** A request issued to that destination BEFORE the
  sentinel has had at least as long to end. A request to a host slower than the sentinel's own
  failure (a black-holed address) can still outlast it: a calibrated wait, not an unbounded one.
  **RED-FIRST, PER FILE.** A script plants one slow off-origin leak (a `fetch` to
  `127.0.0.1:PORT`, named so the file's own reader would match it — the probe token where the
  reader is token-scoped, a `katex-…js` name for the katex gate) inside the measured window, above
  the settle. Each file run ALONE, both engines:

  | File | Before the fix | After the fix |
  |---|---|---|
  | all 19, Chromium | GREEN (the blind spot) | RED, the leak named |
  | all 19, Firefox | GREEN (the blind spot) | RED, the leak named |

  Per file, after: one red test per engine, except `diagramStyleCss` (6 per engine — the leak
  sits in a per-lane loop) and `folderMode.network` (2 per engine — two claims, two leaks).
  `diagramKatexGate` reds on its request COUNT, which names no URL. Every file restored
  byte-identical afterwards (md5 over `tests/browser`).
  **TWO FINDINGS THE RED-FIRST RUN PRODUCED.**
  - *Chromium, the "slow" leak is not always slow.* Run together in one browser, three files
    went red BEFORE the fix: the leak failed in about 30 ms (measured: a sentinel with duration
    32 ms, against 2,037 ms cold) because it rode an attempt on the same refused destination
    that an earlier file had just made. So the blind spot is real but intermittent in a shared
    run, and the before-proof was taken per file, alone.
  - *Firefox, later-one-first.* Without the trailing flush, `diagramNetwork` and
    `diagramKatexGate` stayed GREEN on Firefox after the fix in one run and went red in the
    next. Measured: the leak (issued 200 ms before the sentinel) and the sentinel are recorded
    with the same end, and the sentinel's entry can be written first. With the flush: red on
    both engines, 3 runs of 3, each file. `editorNetwork`'s own second read gained the same
    flush.
  **COST, WALL-CLOCK.** Test time per file, Chromium / Firefox, seconds, before → after:
  `agentBadgeNetwork` 2.8 → 9.7 / 2.7 → 9.7 · `codeNetwork` 2.8 → 12.5 / 2.7 → 12.4 ·
  `diagramKatexGate` 0.7 → 7.4 / 0.7 → 9.5 · `diagramNetwork` 4.5 → 22.9 / 4.4 → 22.9 ·
  `diagramSecure` 0.8 → 7.5 / 0.8 → 7.5 · `diagramSourceGuard` 1.2 → 10.0 / 1.1 → 10.0 ·
  `diagramStyleCss` 3.1 → 23.2 / 3.0 → 23.2 · `exportNetwork` 1.6 → 3.8 / 1.6 → 3.9 ·
  `firefoxFallback` 0.4 → 2.7 / 0.4 → 2.6 · `folderMode.network` 0.8 → 5.3 / 1.0 → 5.5 ·
  `handlePersist` 0.3 → 2.7 / 1.3 → 3.5 · `mathNetwork` 1.8 → 5.2 / 2.7 → 7.2 · `remoteMedia`
  0.6 → 5.1 / 0.6 → 5.0 · `settingsPort` 0.3 → 2.6 / 0.5 → 2.7 · `snapshotCapture` 0.9 → 3.1 /
  1.0 → 3.3 · `tableNetwork` 4.6 → 21.6 / 4.5 → 21.5 · `tocNetwork` 8.3 → 12.8 / 6.6 → 13.2 ·
  `watchNetwork` 1.3 → 8.0 / 1.2 → 8.0 · `wipe` 0.4 → 2.1 / 0.5 → 2.8. **Sum: 74.5 → 342.7 s**
  across both engines. Each settle costs about 2.3 s, the time a refused loopback connection
  takes to fail here. **The full browser suite: 227 s → 371 / 379 s wall** (two runs).
  **(ii) THE SENTENCE AND THE SECTION.** 5.7's drafted paragraph is replaced by the reviewed
  sentence (R22), as a FOURTH BULLET in the section's own form, wrapped as its bullets are:

  > - **The edit save-back path** — opening the editor, the live preview, and Save, including its download fallback — makes **no network request** either. `tests/browser/editorNetwork.browser.test.ts` checks this in real Chromium and Firefox (the write itself on Chromium, the only engine that can write a file), and shows the check can see a request by placing a deliberate remote reference in the same view.

  "on three surfaces" → "on four surfaces"; the closing line now reads "the reader, folder
  mode, watch mode and edit save-back are all **tested to make none**." SIGNED (a) and (b)
  untouched: `tests/permissionsLedger.test.ts` is unedited and green, 9 of 9. No pin (R22).
  **(iii) `diagramSourceGuard` PER-FENCE — CAUSE AND RESOLUTION.**
  - *Whose requests.* The twelve are mermaid's own lazy FLOWCHART definition
    (`flowDiagram-…js` and its chunks), same-origin, loaded by the test's own clean
    `graph TD` fence.
  - *Why only after `diagramNetwork`.* `warmEngine` rendered `BENIGN_DOC`, a `graph TD`, to
    warm exactly that definition. But the reader caches rendered diagrams in IndexedDB by a hash
    of the source, and IndexedDB SURVIVES from one test file to the next in a run (the module
    graph does not: the second file re-fetches mermaid's core). `diagramNetwork` renders the
    same `BENIGN_DOC`. So in the second file the warm-up was a cache HIT, which skips
    `engine.render` (`diagramEnhancer.ts`) and with it the lazy definition. Measured in that
    order, both engines: warm-up traffic 32 requests WITH the flowchart definition in the first
    file, 20 WITHOUT it in the second.
  - *Decided by what the test claims.* Its zero is NOT "nothing leaves the origin": every probe
    in the file is SAME-ORIGIN by design (its header says so), so an off-origin re-spelling would
    have let the very reference under test through. It intends the strict property — nothing on
    the wire in the window — so the strictness is KEPT and the shared state is fixed.
  - *The fix.* `warmEngine` renders `BENIGN_DOC` with a label unique to the call: a cache miss
    every time, so the warm-up warms. No assertion edited; `diagramSourceGuard` is zero-diff.
  - *Red → green, same order* (`diagramNetwork` → `diagramSourceGuard`, forced by clearing
    vitest's duration cache): 2 red (both engines) before; 20 of 20 after.
  - Not a product behaviour to report: the cache did what it is for.
  **(iv) `mathNetwork` ON FIREFOX — CAUSE AND RESOLUTION.**
  - *Reproduced in two files:* `editorNetwork` → `mathNetwork`, Firefox, every time.
  - *The carried hypothesis is FALSE.* It was `registerMathFont()`'s idempotent flag surviving an
    earlier math file. Measured at this file's first render in the failing order: `document.fonts`
    held NO Peekover Math face beforehand. Nothing of the registration survives.
  - *The cause.* After that render the face was `loaded` — with NO Resource Timing entry for the
    font. Firefox had kept the font from the earlier file's fetch of the same URL and served it
    without a request. Chromium records an entry either way (transferSize 300 revalidated,
    86,908 cold), which is why this was Firefox-only.
  - *THE ONE RE-SPELLED ASSERTION.* `mathNetwork.browser.test.ts`, "NON-VACUITY, axis 3":
    `expect(fontRequests.length).toBeGreaterThan(0)` — "the STIX Two Math subset was never
    fetched in this window". **It measured the wrong property:** whether the browser's font
    cache was cold, not whether the font is same-origin. Re-spelled in two observable parts:
    (a) NEW, both engines — the face this render registered is LOADED; (b) a font request in the
    window is still REQUIRED on Chromium, exactly as before, and on Firefox its absence is
    allowed; any that is seen must be same-origin, unchanged. The reason is written above the
    assertion. **The off-origin claim is untouched.**
  - *Not weaker where it matters:* with registration ablated (a temporary production edit,
    restored, md5-checked) the new (a) is RED on both engines — "no Peekover Math face was
    registered". The old assertion could not tell a font that 404s from one that loads.
  - *Red → green, same order:* 1 red (Firefox) before; 16 passed / 4 skipped after.
  - No production code was needed.
  **VERIFY.** lint 0. Both known failing orders green — the seven-file spot-check (98 passed / 28
  skipped; it ran `editorSave`, `editorPreview`, `editorNetwork`, `diagramNetwork`,
  `mathNetwork`, `diagramSourceGuard`, `diagramKatexGate` on both engines, which holds both
  triggers in their triggering order, though not 5.7's exact sequence) and the pair (20 of 20).
  The full browser suite, alone, TWICE: run 1 — 184 files, 1844 passed / 43 skipped, ONE RED, in
  an untouched file: `copyAsHtml` on Chromium read another test's text off the OS clipboard
  (14 of 14 alone — harness-shared-state, the clipboard is shared by the two engines' runs);
  run 2 — 1845 / 43, zero reds. Unit 1372. `permissionsLedger` + `manifest` 17. `pnpm audit
  --prod` EXIT=0. Golden empty.
  **BYTES — NOTHING MOVED.** A clean two-engine build: all 278 shipped files md5-identical to
  `3a4bcd2`'s. `.output` 5,822,029 / 5,822,145 B; zip 1,839,751 / 1,839,809 B; content script
  342,806 B, `c4f59f1a…` / `ecc31688…`; manifests 654 / 770 B, `permissions: []`. Production
  diff EMPTY.
  **JUDGMENT CALLS AND MISMATCHES, FLAGGED.**
  1. *Nineteen files, not the kickoff's "at least" five* — every one that reads a network zero.
  2. *Settled at the closing read of each buffer epoch, not at every per-step read.* Settling
     all of them would cost roughly twice as much again; the cumulative read covers them.
  3. *Not settled:* the controls' own inert-parse contrasts ("the inert `<template>` parse
     dispatched a request", in four files). They are about a same-origin probe that answers in
     milliseconds, and are part of the control, not a claim about the product.
  4. *Sixteen files now import `helpers/diagramWindow.ts`,* which also pulls in the reader pane
     and the diagram modules. A separate small helper would be cleaner; a new file was outside
     the fence. The human's call.
  5. *Two local `flush` helpers removed* (`diagramSecure`, `watchNetwork`) — unused once the
     settle replaced them; lint required it.
  6. *Comments left as they were.* Several files still say a flush is "a sound zero-requests
     proof". Each now carries a one-line pointer to the helper, where the correction is written
     once; the old sentences were not rewritten file by file.
  7. *The Firefox branch in (iv)* is the one place a check differs by engine.
  8. *AGENTS.md's wording.* It says the browser files share one `document`/`window` and
     "module-level caches". Measured here: a later file starts with an empty `document.fonts`
     and re-fetches mermaid's core, so neither the document's fonts nor module state carried
     over. What did carry over: IndexedDB, the browser's font and HTTP caches, the Resource
     Timing destination state, and the OS clipboard. Not edited — outside this task's files.
  *Revisit-when:* the suite's wall-clock becomes a problem (a cheaper sentinel, or item 2
  revisited); a guard file is added (it must settle before its zero); the helper is split.

- **2026-10-09 · M12 RULING R22 — HUMAN RULING: a DISCOVERED test-hardening task, 5.8, after 5.7
  and before 6.1; 25 → 26 tasks. `PERMISSIONS.md`'s zero-network sentence is REVIEWED.**
  Given by the human in task 5.8's kickoff, dated 2026-10-09, marked there "approved by the
  human running this prompt". The agent chose nothing; this entry records it.
  **THE TASK.** Four items: (i) apply 5.7's instrument fix to every zero-reading network guard,
  red-first per file; (ii) the reviewed sentence, and the section's count and closing line made
  true; (iii) find and resolve `diagramSourceGuard`'s PER-FENCE red; (iv) find and resolve
  `mathNetwork`'s Firefox shared-state red, test-side only. A fix that needs production code is
  a STOP and a report.
  **THE SENTENCE.** Reviewer-tightened from 5.7's draft and approved by the human. It is NOT
  signed positioning text, so it gets no ledger pin; SIGNED (a) and (b) are untouched:

  > **The edit save-back path** — opening the editor, the live preview, and Save, including its download fallback — makes **no network request** either. `tests/browser/editorNetwork.browser.test.ts` checks this in real Chromium and Firefox (the write itself on Chromium, the only engine that can write a file), and shows the check can see a request by placing a deliberate remote reference in the same view.

  This closes the review 5.7's landing entry left owed.
  *Revisit-when:* the 7.1 walk.

- **2026-10-09 · M12 TASK 5.7 — LANDED: the zero-network proof across edit, preview and save, with
  a firing control in every window; `permissions: []` re-proven; `PERMISSIONS.md`'s zero-network
  sentence DRAFTED and flagged for review. Test and records only — no production byte moved. One
  finding about the instrument, and one about an existing guard file, are flagged at the end.**
  **STEP 0 (a) — WHAT "NETWORK" MEANS IN THE EXISTING INSTRUMENTS.** Resource Timing entry names
  matching `/^https?:/i` ("on the wire"), then `isOffOrigin` — not under `location.origin` ("left
  our origin"). `blob:`, `data:` and the extension schemes are excluded by scheme. Harness-origin
  traffic is NOT excluded and is why the claims are off-origin: the dev server serves our own lazy
  chunks over `http://localhost`, where the product serves them from the package. The window in
  `helpers/diagramWindow.ts` is the mermaid measuring container's lifetime, applied to each
  entry's `startTime`. The firing control is a node-built SVG `<image href>` — never a parsed
  string, because a Firefox inert parse consumes the load — pointed at `127.0.0.1:PORT`, a
  different origin on the same loopback.
  **STEP 0 (b) — THE THREE WINDOWS**, each a time bracket: `performance.now()` at the opening,
  every reading by request START at or after it.
  - *LOAD* — the click on the edit control to a live CodeMirror view, on an unwatched file.
  - *PREVIEW* — a document with a mermaid fence, a mermaid fence carrying `$$` (R15), block and
    inline math, a `javascript` fence and a table; from edit entry, through the build render,
    real keys, a typed REMOTE image reference (`127.0.0.1`, its own URL) and the re-render, until
    the four enhancers have finished on the re-rendered column. The reader's own first render is
    let finish BEFORE the window, so the window is the preview's. Asserted inside it: one diagram
    SVG, two or more `<math>`, one highlighted fence, one table toolbar; the `$$` fence degraded
    with "contains math", no katex artifact in the live document and no katex chunk request
    (`diagramKatexGate`'s two instruments); the typed image present as a blocked placeholder,
    never a live `<img>`, and never requested.
  - *SAVE* — five windows. Both engines: the download with no handle, by the Save button and by
    `saveEdit()` (what Ctrl/Cmd+S calls). Chromium: a granted write, `saveEdit()` and then
    leaving edit (R19's re-render), unwatched; a refused conflict, unwatched; a declined prompt
    → the download; and, on a document the app page is itself watching, a write, the wait for
    its echo, an external change and the refused save (4.3's revisit-when).
  **STEP 0 (c) — ENGINES.** LOAD, PREVIEW and the no-handle download run on both. The write, the
  conflict, the declined prompt and the watched save are Chromium-only: they need a
  `FileSystemFileHandle`, and Firefox's folder routes produce none.
  **THE INSTRUMENT.** Two, united in one reading. *The wire:* Resource Timing by the shared
  predicate, read from the buffer AND from a `PerformanceObserver` opened with the window, so a
  full buffer cannot become a quiet zero. *The calls:* `fetch`, `XMLHttpRequest.open`,
  `sendBeacon`, `WebSocket` and `EventSource`, wrapped for the window and passed through — a
  WebSocket never enters Resource Timing and AGENTS.md #1 names it. The kickoff asked for
  "Resource Timing plus whatever the existing instruments also use"; the call log is beyond what
  they use, and is flagged as an addition.
  **THE FIRING CONTROL — IN EVERY WINDOW.** After the claim is read and before the window closes,
  a leak is put into the surface that was measured: `tasks.md` 5.7's "remote reference adopted
  without passing through a sanitizer" (`injectLiveImageHref` into the edit shell, the preview
  column or the reading column), a bare `fetch` and a `WebSocket`. The same reading must then
  name all three. All on the loopback. Caught in all ten runs: image, fetch on the wire, fetch
  in the call log, WebSocket in the call log.
  **RESULT — requests leaving the origin: ZERO, every window, every engine it runs on.**

  | Window | Chromium | Firefox |
  |---|---|---|
  | LOAD | 0 off-origin (5 same-origin module requests, a cold editor load); control caught | 0 (5 same-origin); control caught |
  | PREVIEW | 0 (0 same-origin — the engines were warm from the reader's render); control caught | 0 (0); control caught |
  | SAVE download, no handle (+ `saveEdit()`) | 0; control caught | 0; control caught |
  | SAVE write + `saveEdit()` + exit, unwatched | 0; control caught | Chromium-only |
  | SAVE conflict, unwatched | 0; control caught | Chromium-only |
  | SAVE download, declined prompt | 0; control caught | Chromium-only |
  | SAVE write + echo + external change + refusal, watched | 0; control caught | Chromium-only |

  **RED-FIRST, AND WHAT IT FOUND.** The ablation adopts a leak into the surface BEFORE the claim is
  read. Its first run was GREEN on both engines — the claim did not see a leak adopted 1.5 s
  earlier. Cause: Resource Timing records a request when it ENDS, and a refused loopback
  connection takes about two seconds to fail on this machine, so the request was in neither the
  buffer nor the observer yet. The helper now reads the claim TWICE: after a flush, and again
  once the control's own off-origin request has landed, with the control's probes taken out —
  any earlier off-origin request has had longer. Re-run: RED in all ten cases (7 Chromium, 3
  Firefox), each on the claim's own assertion, each naming the ablation's URL. Restored
  byte-identical (md5).
  **`permissions: []`.** `tests/manifest.test.ts` green (it reads the config-derived manifest, as
  its header says), and both BUILT manifests read directly after the rebuild: `permissions: []`,
  654 / 770 B, md5-identical to the build at `644b63b`.
  **THE SENTENCE, AS LANDED — DRAFTED BY THE AGENT, NOT SIGNED; FOR REVIEW.** One sentence, its own
  paragraph at the end of `PERMISSIONS.md`'s "Zero-network evidence" section (wrapped there; one
  line here):

  > **The edit save-back path** — entering edit, the live preview, and Save, including its download fallback — makes **no network request**: `tests/browser/editorNetwork.browser.test.ts` asserts, on the Resource Timing buffer and on the page's own network calls in real Chromium and Firefox (the write to the file on Chromium, the only engine with a file handle to write through), that nothing leaves the page's origin while the editor loads, while a document with diagrams, math, code and a table is typed into and re-previewed, or while a save writes, is refused or becomes a download — and, non-vacuously, that a remote reference deliberately placed in the same view **does** register in the same test.

  *Two things left alone, for the reviewer:* the section still says "on three surfaces" above
  its bullets and "the reader, folder mode and watch mode are all tested to make none" below
  them. The fence was "the save-path sentence ONLY", so neither was edited and the sentence was
  placed after them rather than as a fourth bullet. And "no network request" is the product
  claim; what the test measures is "nothing leaves the page's origin", which the sentence says.
  **No pin was added to `tests/permissionsLedger.test.ts`** (zero-diff): the sentence is unsigned
  and under review, and a pin would turn the reviewer's edit into a red test. That file still
  proves SIGNED (a) and (b) byte-exact — green, 9 of 9.
  **MOVED TO 7.1, NOT FAKED.** Plan §4 risk 2's reload / duplicated-tab permission probe: an OPFS
  handle is granted without a prompt, and a test cannot reload the page it runs in. The
  browser's own write prompt. A real download (the anchor click is swallowed here, as in
  `editorSave`). The Ctrl/Cmd+S KEY: its listener is `entrypoints/app/main.ts`'s, which the
  harness does not load. And the loaded extension itself, where the chunks are extension-scheme
  URLs — on Firefox too. `tasks.md` 7.1 lists each.
  **BYTES — NOTHING MOVED.** Clean rebuild of both engines before the change (stashed, at
  `644b63b`) and after: all 278 shipped files (139 per engine) md5-identical. `.output`
  5,822,029 / 5,822,145 B; zip 1,839,751 / 1,839,809 B; content script 342,806 B, md5
  `c4f59f1a…` (Cr) / `ecc31688…` (Fx); app chunk 524,607 B; `dependencies` 11. `git diff --stat`
  over `src/`, `entrypoints/`, `package.json`, the lockfile and the configs: EMPTY.
  **VERIFY (an empty production diff — AGENTS.md's targeted rule).** lint 0. The new file: 14
  (7 Chromium + 3 Firefox passed, 4 skipped on Firefox). Spot-check, one run of seven browser
  files: `diagramNetwork` 12 · `diagramKatexGate` 8 · `editorSave` 30 (+24 skipped) ·
  `editorPreview` 24 · `editorNetwork` 10 (+4) green; THREE REDS, none in the new file, each
  cleared by an isolated rerun — `mathNetwork` on Firefox (the known font case; 6/6 alone) and
  `diagramSourceGuard`'s PER-FENCE on both engines (8/8 alone; see the finding below). Unit:
  `permissionsLedger` + `manifest` 17 of 17. `pnpm audit --prod` EXIT=0. Golden empty. Beyond
  the targeted rule, because a new browser file is where shared state bites: the FULL browser
  suite, run alone — 184 files, 1845 passed / 43 skipped (+10 / +4, all this file), ZERO reds;
  and the full unit suite, 1372 of 1372.
  **FINDING 1, FLAGGED — the same blind spot is in the existing guard files.** Every zero-network
  file here reads the buffer after `flush()` (about 180 ms). Resource Timing cannot show a
  request still in flight then. Their firing controls await their own request, so the controls
  are sound; it is the ZERO readings that are short-sighted for a slow request. Not touched —
  outside this task's fence. Home: the human's call (§ Carried items).
  **FINDING 2, FLAGGED — `diagramSourceGuard`'s PER-FENCE red is order-dependent and predates
  this task.** It reproduces with `diagramNetwork` + `diagramSourceGuard` run together and
  nothing else — the new file absent — on both engines: twelve SAME-ORIGIN flowchart chunk
  requests land inside its window, against a bare `toEqual([])`. Green alone and green in the
  full suite's order. Cause not established (a guess, unchecked: the warm-up's diagram comes
  from the on-device diagram cache an earlier file filled, so the flowchart definition is not
  loaded until the test's own render). Not a network finding — nothing left the origin. Not
  touched. Home: the next session with a test-harness slot (§ Carried items).
  **KICKOFF vs FILE, FLAGGED.** (i) `tasks.md` 5.7 says "zero requests leave the origin" — met as
  written — but its group text and the kickoff's "zero network" are both served by the
  off-origin claim, stated above. (ii) The kickoff's SAVE window names four cases; a declined
  prompt and a watched save were added (the second is 4.3's revisit-when). (iii) The kickoff
  named a typed remote image nowhere; it was added to PREVIEW as the likeliest real leak on this
  path. (iv) R21 arrived inside this kickoff, not as a separate session — banked below as the
  human's ruling, with that provenance.
  *Revisit-when:* the 7.1 walk (the windows moved there; the sentence's review); any change to
  how the editor's chunks are loaded; a decision on finding 1.

- **2026-10-09 · M12 RULING R21 — HUMAN RULING: the conflict / overwrite POLICY is REFUSE AND TELL
  (spec §8-1; `tasks.md` 5.5). The walk is deferred to 7.1; 5.6 is struck; 26 → 25 tasks.**
  Given by the human in task 5.7's kickoff, dated 2026-10-09, marked there "approved by the human
  running this prompt". The agent chose nothing; this entry records it.
  **THE POLICY.** The safe floor 5.3 built IS the shipped policy: on a conflict nothing is
  written, the status says so in words, and the edit stays on screen. No diff view and no
  force-overwrite in M12.
  **THE LEDGER.** The signed row already says exactly this ("it **writes nothing**, says so in
  words, and keeps the edit on screen"), so nothing is re-signed; 5.6's route-3 note does not
  trigger.
  **THE WALK IS DEFERRED TO 7.1 — a stated departure.** `tasks.md` 5.5 says the policy is ruled
  "from a walk". It was ruled from the description instead, by the human's choice to do the
  manual checking in one sitting — the same shape as the 3.2 eyeball deferral. `tasks.md` 7.1
  now lists the walk. **If the 7.1 walk changes the human's mind, R21 is re-opened.**
  **5.6 IS STRUCK.** It was contingent on a policy that needed building; this one does not. Struck
  in place in `tasks.md`, kept, with a dated note.
  **REJECTED, with the reasons:**
  - *The diff view* — new UI and a merge story. Backlog, after M12.
  - *Force-overwrite* — contradicts the signed row, and is the one path that can destroy another
    writer's change.
  *Revisit-when:* the 7.1 walk; any later proposal to add a diff view or an overwrite (the row
  is re-signed first).

- **2026-10-09 · M12 TASK 4.3 — LANDED: a save's own write is not an external change (R17(i)); edit
  entry binds the file the reader RENDERED (R17(ii)); after a save, leaving edit shows the saved
  text (R19); one stale comment. No human ruling was taken during the task; three judgment calls
  and one finding are flagged at the end.**
  **WHAT WAS OBSERVED FIRST (step 0), on Chromium, before any change.** Through the app page's OWN
  watch — its controller, its detector (a real `FileSystemObserver` on an origin-private-file-system
  handle), switched on with the reader's watch control; nothing hand-driven:
  - *R17(i).* After the first Save the hint `data-watch-changed-in-edit` WAS on the host — already
    there when the status line appeared — and stayed. The second Save said "Saved. The file changed
    on disk while you were editing, but its content was the same when checked." The self-write was
    held as a deferred change. So 5.3's reasoning was right, and it happens on every save.
  - *R19, watched.* After Save and Stop editing the reading column showed the saved text (the held
    self-write flushed on exit — the right result by the wrong road).
  - *R19, UNWATCHED.* The reading column was STALE: it, and the host's registered source, still held
    the text from open, 2.5 s later too. Nothing was going to fix it.
  - *R17(ii)* was then seen as a test red at HEAD, not just reasoned: with file B selected and its
    read held pending, Edit on the still-displayed A, type, Save → "Saved.", and **B was overwritten
    on disk** with A's edit. Two files of identical text, so D-7's compare had nothing to refuse.
  **MECHANISM (i) — `ownWrite`, in `watchController.ts` (DECISION 7 there).** "Last known text"
  lives in the DETECTOR (`pollingDetector`'s `lastText`; the observer's own read), which cannot know
  who wrote. So the writer tells the controller: `createWatchController` now returns a
  `WatchController` — the registry's `WatchTarget` plus `ownWrite(text)`. The shell calls it after
  each successful write, on the controller it built for the bound file. Two effects:
  - the text is remembered (`ownText`); while it is, the detector reporting that same text is an
    echo and is dropped — no hint, nothing held as external. Any OTHER text clears the token and is
    an external change exactly as before. That covers "ours then theirs" coalesced into one
    detection: only theirs is reported, and it differs.
  - the text takes the single pending slot WITHOUT the hint (`syncEditHint` exempts a held text
    that is the token) and renders when edit is left — an ordinary watch render, so the snapshot of
    the text it replaces is still captured. Announced outside edit, it renders at once. This half
    is R19's clarification: dropping the echo alone would leave the reading view stale.
  `stop()` and a document switch clear the token (`cancelPending`). No import was added to
  `watchController.ts`; the 5.1 fence's Clause C stands, and `contentWatch.ts` is zero-diff.
  **ACCEPTED AS INDISTINGUISHABLE.** An external write of EXACTLY the text Peekover wrote, while the
  token lives: nothing differs on disk, so nothing is lost. **One residual, stated:** a detector
  read already in flight when a SECOND save lands can report the first save's text after the second
  was announced; it differs from the token, so it reads as external until the next report. It
  needs two saves inside one detection and costs a hint, never a write — D-7's compare still rules.
  **MECHANISM (ii) — `renderedFile`, in `appShell.ts`.** "The file the reader rendered" is set as
  each `selectFolderFile`'s render commits (after its `selectFile` resolves — last painted wins),
  and cleared when no file is active and when the store-free `AppController.selectFile` seam shows
  a file. The binder takes a file only when `renderedFile === activeFile`; otherwise it binds
  `{ file: null }` — NOT `ended` — and Save is 5.4's download. **The download carries the rendered
  file's name:** the binding gained a `name` (a name only, never a handle) — it cost one field, so
  R17's silence was resolved the cheap way. With no rendered file it is still `document.md`.
  **MECHANISM R19 — `showSaved`, in `appShell.ts`.** The binding remembers the text it last WROTE.
  A `MutationObserver` on the host's `data-mode`, made at edit entry, runs it as edit is left; the
  bound save runs it too, for a save that finishes after the exit. It re-renders the host with
  that text through `renderEnhanced` — the watch's own render closure — only if the host's source
  is not already that text. **Order, and why there is one render, not two:** on a watched document
  the controller's observer on the same host was created when the watch started, before this
  session's, so it runs first and flushes the held text; `showSaved` then finds the source already
  equal and does nothing. Measured in the real engine: exactly ONE re-mount on a watched exit, and
  the pre-save text in the document's snapshot history; exactly one on an unwatched exit. Not after
  a download (nothing was written), not for a session the shell ended, not once another file has
  been selected. **No ripple was needed:** `editorView.ts`, `editorEnhancer.ts` (beyond its comment)
  and `readerPane.ts` are untouched — the kickoff allowed for one and it did not arise.
  **THE COMMENT.** `editorEnhancer.ts:28-30` no longer says nothing calls `save` or that a watch
  re-render drops the editor. Comment-only: its bytes are in no arm.
  **TESTS, RED-FIRST.** Unit, `watchController.test.ts` 51 → 64 (+13): the echo raises no hint and
  renders nothing; without the announcement the same sequence IS the hint (the firing control);
  the exit renders the saved text once and a late echo renders nothing; a different text is
  external; ours-then-theirs coalesced; a second save; a held external change superseded; outside
  edit; stop and a document switch clear the token; a no-op when not running; the cooldown from
  the end, coalesced, after an own render. Real engine, Chromium, `editorSave.browser.test.ts`
  +8 (30 there): (i) on the app page's own watch — hint absent, the second Save exactly "Saved.",
  then an out-of-band write raises the hint and the next Save is the safe floor; R19 watched (one
  re-mount, the snapshot, the watch still live) and unwatched (one re-mount; a new session seeded
  from the saved text); two controls — no save, no re-render; a download is not a save; (ii) in
  the switch window — neither file changes on disk, one download under A's name; and two controls
  — no switch writes A; a committed switch writes B. `editorWatch.browser.test.ts` is zero-diff:
  its rig hand-drives a controller of its own, and (i) needed the shell's.
  Before the implementation: unit 12 of the 13 red (the method did not exist; the firing control
  green, as it must be); real engine 3 red on the
  three claims — the hint present, the unwatched column stale, B overwritten. Ablations, each red
  in its own units and restored byte-identical:
  - the shell's `ownWrite` call removed → (i): the hint after save 1, and the false sentence on save 2.
  - the binding put back to `activeFile` → (ii): "Saved.", B overwritten, read back off disk.
  - `showSaved`'s render removed → R19 unwatched: the column stale (watched stays green, as observed).
  - the hint exemption removed (unit) → 4 red; the echo drop removed (unit) → 5 red.
  **BYTES.** `.output` 5,822,029 / 5,822,145 B (+898 each; headroom 1,518,003 / 1,517,887 B under
  7 MiB); zip 1,839,751 / 1,839,809 B (+191 each). Two files changed size, the same on both
  engines; manifests byte-identical, `permissions: []`.
  *The content script — EXPECTED to move, `watchController.ts` being on its graph:* 342,652 →
  342,806 B (**+154**), md5 `c4f59f1a9397c22b93a013c1522a55d5` (Cr) /
  `ecc31688b4f49167502a39edca7b9e51` (Fx). Decomposed: the `ownWrite` method 114 · the token (the
  variable, the echo drop, the hint exemption, the teardown clear) 40 = 154, **residual 0**. With
  both removed the content script is md5-IDENTICAL to baseline on BOTH engines (`97b1b869…` /
  `c0115d89…`). It carries the method and never calls it: no content-script path writes a file.
  *The app chunk:* 523,863 → 524,607 B (**+744**), by Chrome removal arms taken in sequence:

  | Piece | Bytes | Alone |
  |---|---|---|
  | R19 — the exit observer, `written`, `showSaved` | 405 | 405 |
  | the announcement — the call, the binding's watch, `activeWatch` | 72 | 70 |
  | (ii) — `renderedFile`, its writes, the binding's name | 75 | 82 |
  | the controller — method 114 + token 36 (it is in this chunk too) | 151 | 150 |
  | the bound save's wrapper (async, the `saved` branch, the host lookup) — shared by R19 and the announcement | 41 | — |
  | **sum** | **744** | measured +744 — **residual 0** |

  The "alone" figures differ from the sequential ones by at most 7 B (minifier interaction between
  pieces that share a local); the sequence is what sums.
  **FULL SUITE.** lint 0 · unit 1372 (+13, all `watchController`) · browser, run alone, 1835
  passed / 39 skipped (+8 passed on Chromium, +8 skipped on Firefox: all `editorSave`), 182 files,
  zero reds — no known flake fired, `mathNetwork` included (6/6) · scanner clean over 79 files,
  self-test 7 + 10 · `pnpm audit --prod` EXIT=0 · golden empty. `watchController` 64 ·
  `editorSave` 30 (27 Chromium + 3 Firefox; 24 skipped) · `editorWatch` 12 · `watchDiffDefer` 4 ·
  `watchControl` 72 · `watchRemount` 24 · `exportShortcut` 18 · `editorView` 76 ·
  `editorEnhancer` 32. A second clean rebuild reproduced every byte figure.
  **JUDGMENT CALLS, FLAGGED.** (1) The watch renders Peekover's own save as an ordinary watch
  render, so the pre-save text is still captured as a snapshot and the watch control flashes —
  kept because that is what happened before this task; "drop the echo and let the shell render"
  would have silently stopped capturing it. (2) A mismatch at edit entry binds nothing even though
  the file on screen is known (R17's text); binding the rendered file instead would save it, and
  is the human's call. (3) The download in a mismatch is named after the rendered file.
  **FINDING, FLAGGED — for 6.1.** In the switch window the edit session is destroyed when the
  pending file's read resolves: `readerPane` re-mounts the shared host, and the buffer is gone
  with no prompt. That is "selecting another file", which 6.1 names — but it shows the guard has
  to act at the SELECTION, not when the session ends. `readerPane.select` also has no ordering
  guard: two reads resolving out of order paint in resolution order. `renderedFile` follows the
  paint, so the binding stays right; the stale paint itself is not this task's.
  *Revisit-when:* 5.5 (the walk — now over a hint that means what it says) · 6.1 (the finding
  above; R16) · 5.7 (zero network across a save on a watched document) · 7.1 (a real disk, a real
  external editor racing a save).

- **2026-10-09 · M12 RULINGS R19–R20 — two HUMAN RULINGS taken in task 4.3's kickoff: after a save,
  leaving edit shows the saved text; 5.4's download copy and its two judgment calls are approved.**
  Stated in the kickoff as approved by the human running it, dated 2026-10-09.
  **★ R19 — after a successful Save and then leaving edit, the READING view shows the SAVED text**
  — on a watched AND an unwatched document. Observe first: if it already holds on both, record the
  evidence and change nothing for it; if not, fix it in 4.3, red-first, as a necessary ripple.
  It CLARIFIES R17(i): Peekover's own write must not raise the hint or be treated as an EXTERNAL
  change — but the reading view must still end up showing it. "Drop the self-write" is not an
  acceptable fix if it leaves the reading view stale. *Outcome:* it held watched and did NOT hold
  unwatched; fixed at 4.3 (the entry above).
  **★ R20 — 5.4's download status copy (three lines) is APPROVED as drafted, and its two judgment
  calls are accepted:** `unavailable` is kept for a dropped binding; the download's hint sentence
  claims no compare. Closes the review R18 left open for the lines drafted at 5.4.
  *Revisit-when:* 7.1 (the copy, read on a real page).

- **2026-10-09 · 012 D-6 — the DOWNLOAD FALLBACK LANDED at task 5.4: where Save cannot write, it hands
  the text to the browser as a download and changes nothing in the folder; `PERMISSIONS.md` carries
  the FINAL signed row (D-9). No human ruling was taken during this task; the download's status
  copy is DRAFTED and flagged for review (R18), and two judgment calls are flagged below.**
  **THE ROUTES.** `writeBack` (`appShell.ts`) downloads on exactly these, and on nothing else:
  - the bound file has no handle, or a handle that cannot ask for write access — every Firefox
    route (its folder routes give no handle; its origin-private-file-system handles have no
    `requestPermission`);
  - `requestPermission({ mode: 'readwrite' })` answers anything but `'granted'`, or throws;
  - the session is bound to no file at all (`activeFile` was null at edit entry — today only the
    store-free `AppController.selectFile` seam; R17(ii) will add a mismatch).
  The permission is still asked FIRST where it can be; nothing is re-read and nothing is compared
  on a download route — nothing on disk is being overwritten.
  **`unavailable` IS KEPT, and is no longer reachable on those routes.** It is now only what a
  binding the shell DROPPED answers — Revoke, a closed folder, a folder switch, a newer session —
  including one dropped while the write prompt was up. Nothing is read, written or downloaded.
  `EditBinding` gained `ended`, set by `dropBinding`, because "dropped" and "never had a file" were
  both `file: null` and must now part ways. The status line for `unavailable` is unchanged and
  has no live view left to show it. *Judgment call 1, flagged:* the kind could have been removed
  and the dropped binding made a rejection ("failed"); it was kept because 5.3's route 2(ii) test
  pins `unavailable` after an ending and no existing assertion had to move.
  **WHAT IS DOWNLOADED.** `textForDisk(buffer, baseline)` — ruling A applies, so the bytes are the
  ones a disk write would have been: a uniformly CRLF file downloads as CRLF, anything else as LF.
  Through the existing `downloadAs(text, filename, 'text/markdown')`: `htmlExport.ts` is ZERO-DIFF
  (its third parameter already goes straight to the `Blob`). The filename is the bound
  `MarkdownFile.name` on every route that has a file; `document.md` when the session is bound to
  none. No `chrome.downloads`, no permission, no network.
  **WHAT A DOWNLOAD MOVES — NOTHING.** The new outcome `{ kind: 'downloaded', written, filename }`
  does not advance the baseline, does not recompute or clear dirty, and leaves the buffer alone
  (`editorView.ts`, `run`). The file in the folder is unchanged, so the edit is still unsaved
  there: 6.1's guard will still fire on exit after a download, and that is intended. A throw from
  the download rejects and is "failed", through the view's one catch.
  **THE CONFLICT ROUTE IS UNCHANGED:** the safe floor, and no download is offered (a control in
  the real-engine suite pins zero downloads there, and on a granted write).
  **THE LEDGER SWAP.** `PERMISSIONS.md`'s edit save-back row is now SIGNED (b) of the "M12 TASK
  5.1" entry (below) — cut out of that entry by a script and written over the interim row, then
  compared: 2,062 bytes, byte for byte equal. One line of the ledger changed. The signed text is
  not restated here. `tests/permissionsLedger.test.ts` 7 → 9: (b) present exactly and as a whole
  table line; each of (b)'s three download texts present once; (b′)'s three texts absent; (a)
  still present; the old summary still absent; and its literals still cross-checked against the
  5.1 entry. Red-first: with the ledger unedited, 3 of the 9 red.
  **THE STATUS COPY — DRAFTED, FOR REVIEW (R18; the agent's wording, not signed text):**
  - downloaded — "Saved as a download: `<name>`. The file in the folder was not changed."
  - downloaded, ruling A — … + " Line endings were normalised to LF."
  - downloaded, with 4.2's hint present — … + " That file changed on disk while you were
    editing." *Judgment call 2, flagged:* ruling C's sentence for `saved` ("…but its content was
    the same when checked") would be false here — no compare runs — so the download says only
    what the hint knows.
  **TESTS, RED-FIRST.** Unit 1347 → 1359 (+12). `editorView.test.ts` 70 → 76: the copy (3), a
  download moves nothing, ruling A and the hint as qualifiers. `editorEnhancer.test.ts` 28 → 32:
  the route decision through the real shell in jsdom — no handle, CRLF bytes in the blob, write
  access not granted, the no-file fallback name, and an ENDED session still `unavailable` with
  nothing downloaded. Before the implementation 10 were red across the two files (the
  ended-session case green, as it must be: it is the control). Real engine,
  `editorSave.browser.test.ts`, through `watchDownloads()` — the anchor click swallowed, the blob
  read through the clicked anchor's own `href`: Save and then `saveEdit()` (Ctrl/Cmd+S's path) on
  a no-handle file, BOTH engines — type `text/markdown`, the file's name, the exact buffer, dirty
  and the baseline kept; ruling A's CRLF and mixed fixtures, both engines; a download that throws
  → "failed", both engines; Chromium: a declined prompt → a download with the file on disk
  byte-identical; controls — a granted write and a conflict download nothing. Before the
  implementation: 4 red on Chromium, 4 on Firefox, both controls green. Ablations, each restored
  byte-identical:
  - the download put back to `unavailable` → unit 4 red; real engine 4 + 4 red — no download, the
    status "Not saved: saving is not available here…"; the "ended session" unit case stays green.
  - the markdown type omitted (`tasks.md` 5.4's own red-first) → `text/html` is observed: unit 2
    red, real engine 3 Chromium + 2 Firefox red, each on the type assertion itself.
  **Existing assertions re-spelled (four; each pinned the interim "not available here" on a route
  that now downloads):** `editorSave.browser.test.ts` — "★ NOT AVAILABLE: a declined write prompt
  writes nothing and keeps the edit" (now "★ DECLINED…"; its disk, buffer and dirty claims
  unchanged) and the no-handle describe's one case, which also asserted zero anchor clicks ("no
  download: that is task 5.4"); `editorEnhancer.test.ts` — "appShell injects a save that, for a
  file with no handle, answers 'unavailable'"; `exportShortcut.browser.test.ts` — the Firefox
  alternative of ruling B's in-edit status. In that last file the INSTRUMENT also changed, not an
  assertion: an anchor click named `notes.md` is the save's download and is no longer counted as
  an export. **Ripples beyond the kickoff's Files list, each forced by the full-suite clause:**
  `src/render/editorEnhancer.test.ts`, `tests/browser/exportShortcut.browser.test.ts`.
  **BYTES.** Content script md5-IDENTICAL, both engines (`97b1b869…` / `c0115d89…`, 342,652 B).
  Manifests 654 / 770 B, byte-identical, `permissions: []`. The app chunk is the only file whose
  size changed: 523,321 → 523,863 B (**+542**), both engines. `.output` 5,821,131 / 5,821,247 B
  (+542 each; headroom 1,518,901 / 1,518,785 B under 7 MiB); zip 1,839,560 / 1,839,618 B (+200
  each). Decomposed by Chrome arms — each side alone, then one piece out of each:

  | Piece | Bytes | Arm |
  |---|---|---|
  | the view: the `downloaded` branch in `run`, the result type's case, the shared "normalised" constant | 183 | `appShell.ts` at HEAD (+342) less the copy |
  | the copy: the download's two sentences | 159 | the full build with both emptied |
  | the routing: `ended`, `dropBinding`, `writeBack` restructured around the grant | 100 | `editorView.ts` at HEAD, the download call out |
  | the download call: `textForDisk`, the name and its fallback, `downloadAs`, the type | 100 | the full build with the call out |
  | **sum** | **542** | measured +542 — **residual 0** |

  The two sides are independent: view alone +342, routing alone +200. A second clean rebuild
  reproduced every figure.
  **FULL SUITE.** lint 0 · unit 1359 · browser, run alone, 1827 passed / 31 skipped, 182 files,
  zero reds (no known flake fired) · scanner clean, self-test 7 + 10 · `pnpm audit --prod` EXIT=0
  · golden empty. `editorSave` 22 (19 Chromium + 3 Firefox; 16 skipped) · `exportShortcut` 18.
  **KICKOFF vs FILE, flagged.** (i) `tasks.md` 5.4 says "the buffer text"; the kickoff says
  `textForDisk`. The body predates ruling A, whose signed text is "the save writes CRLF", and the
  signed row calls the download a Save — so ruling A was followed. The two differ only for a
  uniformly CRLF file. (ii) The body's Files are `appShell.ts`, the browser test and (by its ★)
  `PERMISSIONS.md`; `editorView.ts` and its test carry the outcome kind and the copy the body's
  own "the status says" needs. (iii) The kickoff's MIME red-first was "a wrong type"; the body's
  "omit the argument → the default is observed" was run.
  **NOT PROVEN HERE → 7.1.** A real browser download landing in the user's downloads folder (the
  click is swallowed in every test); Firefox with the extension loaded; and a download issued
  AFTER a real write prompt is declined — the click's activation may be spent by then, and
  headless cannot say whether the browser still lets the download through.
  *Revisit-when:* 4.3 (R17 — the binding, and a save's own write) · 5.5 (the walk) · 6.1 (the
  guard must fire after a download; R16's three paths) · 5.7 (zero network across a
  download-fallback save) · 7.1 (above; the copy).

- **2026-10-09 · M12 RULINGS R16–R18 — three HUMAN RULINGS taken in task 5.4's kickoff: 6.1's guard
  covers every path that ends an edit session; a discovered task 4.3 (save-path hardening) runs
  between 5.4 and 5.5; 5.3's status copy is approved.** Stated in the kickoff as approved by the
  human running it, dated 2026-10-09. They answer the question and two of the findings at the end
  of the "012 D-6 — LANDED at task 5.3" entry (below).
  **★ R16 — the unsaved-changes guard also covers every path that ENDS an edit session.** 6.1's
  guard covers, beside its own three exits: Revoke; a folder switch (`applyOutcome`'s success
  branch); a closed folder (`paintIdle` — which also fires on a cancelled or failed re-pick from
  the reopen hub and on a non-folder drop). With a dirty buffer, each offers stay / discard like
  leaving edit; red-first per path. `tasks.md` 6.1 is redlined. *Answers 5.3's question.*
  **★ R17 — DISCOVERED task 4.3, "Save-path hardening", runs AFTER 5.4 and BEFORE 5.5.**
  (i) A save's own write is NOT an external change: on a watched document, Peekover's successful
  write must neither raise `CHANGED_IN_EDIT_ATTR` nor sit deferred as an external change. Observe
  first, red-first, on a watched document — 5.3 reasoned it and did not see it. (ii) Edit entry
  binds the file whose text the reader actually RENDERED, not whatever `activeFile` is at that
  instant; a mismatch binds nothing, and Save then takes the no-handle route — the download.
  Red-first with two files of IDENTICAL text, in the switch window. (iii)
  `editorEnhancer.ts:28-30`'s stale "Nothing calls `save`" comment. Files and Verify are in
  `tasks.md` 4.3. Count 25 → 26. *Answers 5.3's first two findings and routes its third.*
  **★ R18 — 5.3's status copy is APPROVED as drafted** (the six lines in the 5.3 entry). Lines
  drafted at 5.4 are reviewed on landing — the three in the entry above.
  *Revisit-when:* 4.3's kickoff (it decides `watchController.ts` or the detector seam for (i)) ·
  6.1's kickoff (R16's three paths join its Verify).

- **2026-10-09 · 012 D-6 — LANDED at task 5.3: Save WRITES on Chromium — write access asked at the
  click, the file re-read and compared BEFORE the write, the safe floor on a conflict — with the
  interim `PERMISSIONS.md` row in the same commit. The download fallback is NOT built (5.4). No
  human ruling was taken during this task; ONE QUESTION is put to the human at the end of this
  entry, and three findings are flagged.**
  **The plan's text.** Plan §0 D-6's draft entry, quoted because `tasks.md` lands each D-value's
  draft with its implementing commit: *"012 D-6 — `FileSystemFileHandle.requestPermission({mode:'readwrite'})`
  is a standard web-platform, per-handle, user-gesture-gated API with no browser-extension manifest
  counterpart; verified against the current WICG File System Access spec, MDN, and Chrome's own
  extension-context discussion, not training knowledge. §7-1's own central risk did not surprise."*
  That sentence is about the permission mechanism only, and 5.3 built on it as written:
  `permissions: []` is unmoved on both manifests. The plan's D-6 BODY also describes the fallback
  ("on anything else … fall back to a client-side download — reusing … `downloadAs`") — **that part
  lands at 5.4, not here**: at 5.3 a save with no handle, or with write access not granted, says
  "not available here" and writes nothing (the signed interim row).
  **THE SAVE SIGNATURE (D-3's revisit-when, taken).** `editorView.ts`:
  - `EditorSave = () => EditorSessionSave` — the injected capability is now a BINDER. Its name is
    kept, so `readerPane.ts` and both `enhanceEditor(…, { save })` call sites are zero-diff.
  - `EditorSessionSave = ({ text, baseline }) => Promise<EditorSaveOutcome>` — `text` is the buffer
    (LF), `baseline` is `session.originalText`.
  - `EditorSaveOutcome = { kind: 'saved'; written } | { kind: 'conflict' } | { kind: 'unavailable' }`;
    a REJECTION is the fourth outcome, `failed`. One-to-one with the signed interim row's list —
    "saved, not saved because the file changed on disk, not available here, or failed". Ruling A's
    "line endings normalised" and ruling C's "changed on disk while you were editing" are QUALIFIERS
    on `saved`, added by the view (`EditorSaveResult`), not outcomes of their own.
  No render module names `FileSystemFileHandle` (the 3.2 source pin is unedited and green).
  **THE BINDING (route 2(i)).** `buildEditor` calls the binder ONCE, at edit entry. Its body in
  `appShell.ts` reads `activeFile` there, into a per-session binding object, and never again; the
  bound save takes the handle AND `read()` from that object. A later `setActiveFile` moves the
  variable, not the binding. One binding is live at a time: beginning a session drops the one
  before it.
  **THE ENDINGS (route 2(ii)).** `endEditSession()` runs at three places — the first statement of
  `revokeAccess` (before its store awaits), `paintIdle` (the one painter of "no folder is open"),
  and the success branch of `applyOutcome` (a folder switch). It nulls the binding's file FIRST, so
  a save function taken earlier answers `unavailable`, then leaves edit by clicking the edit
  control — R3's exit, which also puts the control's label back — with the two direct calls behind
  it. `editorEnhancer.ts` is zero-diff.
  **THE ORDER OF A SAVE.** `writeBack` (module-level in `appShell.ts`): `requestPermission({ mode:
  'readwrite' })` on the bound file's own handle → on `'granted'`, the re-read through the bound
  `read()` → `hasConflict(baseline, reread)` → `textForDisk` → `createWritable()` → `write` →
  `close()` → `{ kind: 'saved', written }`. The view then calls `session.advanceBaseline(written)`
  and RECOMPUTES the dirty attribute against the new baseline — not a bare removal, so text typed
  while the save was in flight stays dirty. A throw from the re-read or the write is not caught in
  the shell: the half-open writable is aborted and the rejection reaches the view's one catch,
  which says "failed". A throw from `requestPermission` itself is read as not granted.
  **RULING A, AS BUILT.** `isUniformCrlf(text)`: contains `\r\n`, and no `\n` without a `\r` before
  it, and no `\r` without a `\n` after it. Uniform → the buffer with `\n` → `\r\n`; anything else
  (LF, mixed, a lone CR, no break at all, empty) → the buffer's LF. The status adds "Line endings
  were normalised to LF." exactly when the baseline held a `\r` and the written text holds none.
  **RULING B, AS BUILT.** `AppController.saveEdit(): boolean` — true iff the reader host is
  `data-mode="edit"`, in which case it has started that session's save (`saveEditorSession`, the
  function the button's click runs). `main.ts`: `preventDefault()`, then `if (app.saveEdit())
  return;`, then the export as before. `main.ts` imports no editor module.
  **RULING C, AS BUILT.** The hint is read by literal (`EDITOR_CHANGED_HINT_ATTR`, drift-pinned in
  `editorView.test.ts` to `watchController`'s export) at the activation, before the first await. It
  reaches nothing but the status line.
  **THE CONTROLS.** A bar at the top of the edit shell, built with the SESSION (so
  `buildEditorShell` alone still builds two panes): a `<button>` reading "Save" ("Saving…" and
  `aria-busy` while one runs; a second activation meanwhile does nothing) and a `role="status"`
  line, `hidden` while empty. No outcome has a colour. CSS is in `EDITOR_CSS` only.
  **THE INTERIM LEDGER LANDED.** `PERMISSIONS.md` carries SIGNED (a) and the interim row (b′) of the
  "M12 TASK 5.1" entry (below) — copied out of that entry by a script, not retyped — plus route 4's
  three consistency edits. `tests/permissionsLedger.test.ts` (new; beside `manifest.test.ts`, there
  being no earlier test of this file's text) pins both exactly, the old summary sentence absent,
  (b)'s three download sentences absent, and that its own literals are the 5.1 entry's text.
  **ROUTE 5.** `chromiumFolderSource.ts`'s comment now says the FOLDER handle is read-only and that
  a file opened for editing may be written at Save through its own handle. COMMENT ONLY: a build with
  ONLY that file put back to HEAD is md5-identical to the full build in all 278 shipped files (139
  per engine).
  **TESTS, RED-FIRST.** Unit, `editorView.test.ts` 44 → 70 (+26; 27 red before the
  implementation, the re-spelled case among them): the outcome → status mapping, `isUniformCrlf` /
  `textForDisk` over LF, uniform-CRLF, mixed, lone-CR and empty, bound-once, advance and dirty
  moving ONLY on `saved`, typed-during-save staying dirty, the hint as a qualifier, the drift pin.
  `tests/permissionsLedger.test.ts` 7 (3 red against the unedited ledger; one word dropped from
  (a) → red). Real engine, `tests/browser/editorSave.browser.test.ts` (new) — 15 on Chromium on
  origin-private-file-system handles, 1 on both engines (the no-handle route; on Firefox the other
  14 are skipped by design): save + second save · SAME-LENGTH · ruling A on disk, both shapes ·
  the failing writable · the declined prompt · permission before re-read · the control ·
  ruling C (i) and (ii) on a WATCHED document · route 2(i) · route 2(ii) ×3. Each fixture asserts
  its watch state. The failure and the declined prompt are stubs on the TEST'S OWN handle
  (`createWritable`, `requestPermission`) — the object the shell holds; no seam was added to
  production code. Ablations, each red in its own units and restored:
  - the compare removed → SAME-LENGTH: status "Saved.", the out-of-band text GONE from disk; and
    ruling C (ii) saves.
  - the view's catch removed → the failing writable leaves the status EMPTY (the failure silent).
  - the binding read at the click → route 2(i): file B overwritten, A not written.
  - `endEditSession` made a no-op → all three endings: the captured save answers `saved` and the
    file is written.
  - `exportShortcut.browser.test.ts` 16 → 18 (one case added, both engines; nothing existing
    edited): the `saveEdit()` line removed from `main.ts` → in edit the page exports (1, want 0);
    the export made unreachable → outside edit it does not (0, want 1). On Firefox the in-edit save
    answers "not available here" — its handles cannot ask for write access.
  **BYTES.** Content script md5-IDENTICAL, both engines (`97b1b869…` / `c0115d89…`,
  342,652 B); the instrument fires — one rule added to `CONTAINED_CSS` moves both md5s and the
  bytes to 342,658. Manifests 654 / 770 B, `permissions: []`. The app chunk is the ONLY file whose
  bytes changed: 519,884 → 523,321 B (**+3,437**), both engines; 83 other files per engine
  changed md5 by the app chunk's new hash alone (same-length names, every one the same number of bytes).
  `.output` 5,820,589 / 5,820,705 B (+3,437 each; headroom 1,519,443 / 1,519,327 B under 7 MiB);
  zip 1,839,360 / 1,839,418 B (+880 each). Decomposed by removal arms (each a Chrome build with
  one piece taken out; pairs where a marginal could hide a shared piece):

  | Piece | Alone | Notes |
  |---|---|---|
  | the controls — bar, `run`, the status copy, `saveEditorSession`, the binder call | 1,429 | what is left with every arm below removed |
  | the CSS (`EDITOR_CSS`) | 658 | |
  | the save body (`writeBack`) | 365 | plus the two shared rows below |
  | endings (`endEditSession`, three call sites) | 205 | |
  | ruling B (`saveEdit`, the `main.ts` line) | 186 | |
  | ruling C (the hint read, its sentence) | 174 | |
  | ruling A (the qualifier, its sentence) | 98 | plus the shared row below |
  | the binding (the object, its drop, two re-checks) | 36 | plus the shared row below |
  | shared: `textForDisk` + `isUniformCrlf`, reachable only through the body | 146 | body ∩ ruling A |
  | shared: the two `binding.file` re-checks inside the body | 53 | body ∩ binding |
  | shared: `readerHost()`, kept by either of its two callers | 65 | ruling B + endings |
  | shared: the `editBinding` variable | 24 | binding + endings |
  | **sum** | **3,439** | measured +3,437 — **residual −2 B, not attributed** |
  **THE STATUS COPY — DRAFTED, FOR REVIEW (not signed text; the agent's wording):**
  - saved — "Saved."
  - saved, ruling A — "Saved. Line endings were normalised to LF."
  - saved, ruling C — "Saved. The file changed on disk while you were editing, but its content was
    the same when checked."
  - conflict — "Not saved: the file changed on disk. Nothing was written, and your edit is still
    here."
  - not available — "Not saved: saving is not available here. Nothing was written, and your edit
    is still here."
  - failed — "The save failed. Your edit is still here." (It does not claim nothing was written: a
    failure at `close()` cannot promise that.)
  - while running — the button reads "Saving…".
  `tasks.md` 5.3's body says these routes "report 'cannot save here yet'"; the REDLINE and the
  signed row say "not available here", and the redline rules.
  **★ THE QUESTION FOR THE HUMAN (step 0(c)).** Revoke, a folder switch and a closed folder now END
  an open edit session — and so DISCARD a dirty buffer, without asking. 6.1's guard names closing
  or reloading the tab, selecting another file, and leaving edit; it does not name these three.
  *Should 6.1's guard also cover Revoke, a folder switch and a closed folder — or is discarding
  there accepted?* One of them is easy to reach by accident: `paintIdle` also runs when a re-pick
  from the reopen hub is CANCELLED or fails, and when something that is not a folder is dropped on
  the page — those already closed the open folder before this task; they now also end the edit.
  **FINDINGS, FLAGGED.**
  - **On a WATCHED document, a save's own write raises the hint.** The watch sees the file change
    (it did — Peekover wrote it), holds it behind the edit, and sets `data-watch-changed-in-edit`.
    Every LATER save in that session is then "Saved. The file changed on disk while you were
    editing…", which is true of the disk and misleading about its cause. `watchController.ts` is
    zero-diff at this task, so it is not fixed here. Reasoned from 4.2's rule (the attribute is set
    whenever a change is held during edit), NOT observed: this task's watched fixtures are
    hand-driven. Home: 5.5's walk, or a ruling before it.
  - **The binding snapshots `activeFile`, which is not always the file on screen.** `selectFolderFile`
    sets `activeFile` before the file's read resolves, and `AppController.selectFile` (the
    store-free seam; in production only the DEV console handle) does not set it at all. In those
    windows a session could bind a file other than the one in its buffer. The compare is what
    protects it — the baseline is the buffer's file, the re-read is the bound file's — so a write
    needs the two files to hold identical text. Not built around; stated.
  - **`editorEnhancer.ts:28-30` is now stale** ("Nothing calls `save` (the save control is 5.3)").
    The file is outside 5.3's list and nothing in the Verify line requires it, so it was left.
  **Existing assertions re-spelled (three; the behaviour each pinned is what 5.3 replaces — the R1
  precedent):** `editorEnhancer.test.ts` — "readerPane threads an injected save … by identity" (the
  identity is now of what the binder returned; "nothing invokes it" became "bound once, and the
  bound save not called") and "appShell injects a save whose body reports 'not yet available'"
  (now: for a file with no handle it answers `unavailable` and re-reads nothing);
  `editorView.test.ts` — "a refused or failed save does not move it" (the two fakes and the call
  take the new shape; what is asserted is unchanged). Both files are ripples the type change
  forces under the lint and unit clauses.
  *Revisit-when:* 5.4 (the download; the row (b′) → (b) swap is a change to the ledger test) · 5.5
  (the walk, on this floor) · 6.1 (the question above) · 7.1 (the live picker, a real prompt, a real
  disk; the status copy; Ctrl/Cmd+S pressed for real in the editor).

- **2026-10-08 · 012 D-7 — the conflict-DETECTION predicate and the ONE baseline LANDED at task 5.2.
  Content comparison, strict equality; no metadata; no write, no caller yet.**
  **The plan's text.** Plan §0 D-7 carries NO "`decisions.md` entry draft" sentence (D-1 to D-6 and
  D-8 each do), so its heading and lead stand in for one, verbatim:
  *"D-7 · The conflict-DETECTION mechanism (not the policy) — CONTENT COMPARISON is the LEAD and the
  shipped default; `lastModified`/`size` is a measurement-gated optimization that may only ever fall
  through to it. RESOLVES §7-3's mechanism half. FLIPPED 2026-10-04 by human ruling (this draft
  previously led with metadata)."* — and — *"The edit session retains `originalText`: the exact
  string the file's own `read()` returned and the editor buffer was seeded from … compared to
  `originalText` by strict string equality. **A difference is a conflict** … After a successful
  write, `originalText` becomes the text just written."* The quoted text carries the flipped lead
  only; no superseded metadata lead appears in it. The flip itself has no entry of its own here: it
  is recorded in the plan's revision line (2026-10-04) and confirmed in the M12 GATE 2 entry ("D-7's
  content-comparison conflict-detection lead … stands").
  **What 5.2 built** (`src/render/editorView.ts`, its test):
  - **The predicate.** `hasConflict(baseline, reread)` — `reread !== baseline`, exported, pure: no
    I/O, no DOM, no metadata. Not normalised (a line-ending-only change on disk is a change), not a
    length check (a same-length rewrite is a change). Order-safe.
  - **The ONE-BASELINE rule.** `session.originalText` is THE baseline: the raw read at seed, never
    derived from the editor's document. The dirty attribute compares the buffer against the same
    value, normalised — both copies are set only together. *Why:* the compare (raw) and the dirty
    attribute (normalised) both answer "what was the file last?"; held separately, after a write one
    could say the buffer matches the file and the other that it does not. *Why the name stays
    `originalText` and no frozen seed is kept:* the plan and `tasks.md` both name `originalText` as
    the value that becomes the written text, and a second, stale copy is what 5.3 could compare
    against by mistake.
  - **The advance seam.** `session.advanceBaseline(written)` sets the baseline to EXACTLY the string
    written. 5.3 calls it after a successful write; nothing calls it yet. It does not touch the dirty
    attribute.
  - **Ruling A in the lifecycle.** After an LF write and after a CRLF write, the baseline is exactly
    that string and an immediate re-read of it is no conflict. A CRLF file's seed baseline is CRLF,
    not the editor's LF buffer. A refused or throwing save does not move it.
  - **No metadata, asserted.** A test reads `editorView.ts` and finds neither `lastModified` nor
    `size` as whole words, comments included. Firing control: an added `lastModified` read, then a
    `size` read, each reds it.
  - **Red-first:** a normalised compare, a length compare, a baseline taken from the editor's
    document, and a dirty side that does not advance — each red in its own units.
  **Bytes.** App chunk +50 B (the getter, the advance method, one `let`); `hasConflict` tree-shakes
  until 5.3 calls it. Content script md5-identical both engines.
  **What stays 5.3's:** the re-read through `read()`, the permission at the click, the write, clearing
  dirty at the save, and ruling A's choice of text to write (CRLF or LF) and its status line.
  **No human ruling was taken during this task.**
  *Revisit-when:* 5.3 wires the seam (the first caller); §7's optional metadata probe, if ever run —
  it may only add a pre-check that falls through to `hasConflict`.

- **2026-10-08 · M12 TASK 1.3 — GHSA-238p-pmpm-9mq7 (katex via mermaid): a reviewed, documented audit
  exception, standing on R15's math gate (below). Verdict: NOT REACHABLE BY CONSTRUCTION — mermaid's
  only katex entry requires `$$`, which degrades before `engine.render` (R15).** The escalation that
  preceded it, and its ruling, are R15's entry below. Closes R13.
  **(i) THE ADVISORY, AT SOURCE** (GitHub advisory API, read 2026-10-08). GHSA-238p-pmpm-9mq7 /
  CVE-2026-103923, *"KaTeX: Existing prototype pollution can bypass trust restrictions"*, LOW (CVSS 4.0
  2.1, `AV:N/AC:L/AT:P/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N`), CWE-807, published 2026-10-05.
  `katex >= 0.11.0, < 0.18.2`; patched 0.18.2. Class: a READ-SIDE prototype-pollution gadget — where
  `Object.prototype` is ALREADY polluted (katex does not pollute it), katex reads inherited `trust`,
  setting metadata (`default`, `processor`) and namespace entries as if set; an inherited `trust: true`
  lets an author's math emit links (user-interaction XSS) or load attacker-chosen resources. The
  trigger is any `katex.render*` call in a polluted realm; the input is author math.
  **(ii) THE REGISTRY, RE-CHECKED** (`npm view`, 2026-10-08) — no mermaid release accepts a patched katex:

  | mermaid | published | `dependencies.katex` |
  |---|---|---|
  | 11.16.1 (installed) | 2026-08-04 | `^0.16.45` |
  | 11.17.0 | 2026-08-19 | `^0.16.47` |
  | 11.17.1 | 2026-08-24 | `^0.16.47` |
  | 11.17.2 | 2026-08-25 | `^0.16.47` |
  | 12.0.0 | 2026-09-10 | `^0.16.47` |
  | 12.1.0 (latest) | 2026-10-02 | `^0.16.47` |

  No peer or optional katex in any. katex's own `latest` is 0.19.0.
  **(iii) WHERE KATEX SHIPS.** It still ships — the ignore is about reachability, not presence:
  `chunks/katex-B7rAX3Vi.js`, 258,879 B, both engines, md5 `06883a1e…` (unchanged by this task),
  katex 0.16.47. LAZY: its only importer is mermaid's common chunk
  (`chunks/chunk-I66GZJ75-*.js`, `import('./katex-B7rAX3Vi.js')`). Zero katex in the content script;
  the app chunk's only `katex` text is mermaid's inlined `package.json` (`engineVersion`, D-3).
  **(iv) WHY THE FIRST VERDICT WAS A STOP (the R15 escalation).** The kickoff's premise — that
  `htmlLabels: false` / D-6's config gate mermaid's math — is FALSE: `chunk-QR6OTTB3.mjs:4754` sets
  `useHtmlLabels = true` whenever a label has `$$`, and sequence diagrams call katex with no
  `htmlLabels` test at all. No config key closes it: `:5211`'s gate is `isMathMLSupported()`
  (`window.MathMLElement`, true in both engines) `|| legacyMathML || forceLegacyMathML`, and the two
  keys only WIDEN it. `calculateMathMLDimensions` (`:5194-5206`) inserts katex output into the LIVE
  `document.body` mid-render, before `sanitizeSvg`. So the only argument left was "no prototype-pollution
  primitive exists in the shipped realm" — not provable. Escalated; ruled R15.
  **(v) COMPLETENESS — EVERY ROUTE INTO KATEX REQUIRES `$$`** (installed `mermaid@11.16.1`,
  `dist/chunks/mermaid.core/`; the package's `import`/`module` entry is `dist/mermaid.core.mjs`, which
  references katex nowhere):

  | Route | Site | Gated by |
  |---|---|---|
  | THE ONE katex import + call | `chunk-I66GZJ75.mjs:5215` `import("katex")`, `:5221` `katex.renderToString`, inside `renderKatexUnsanitized` (`:5207`) | its FIRST statement, `:5208` `if (!hasKatex(text)) return text`; `hasKatex` (`:5193`) tests `katexRegex = /\$\$(.*?)\$\$/g` (`:5192`); then `:5211` |
  | `renderKatexSanitized` | `:5233-5235` | wraps the above |
  | `calculateMathMLDimensions` | `:5194-5206` | calls `renderKatexSanitized` → the same gate |
  | shared labels (flowchart, state, class…) | `chunk-WRU74C26.mjs:217` `addHtmlSpan`, `:378` | `hasKatex(node.label)`; reached when `useHtmlLabels`, which `chunk-QR6OTTB3.mjs:4754` forces on `hasKatex(textContent)` |
  | sequence | `sequenceDiagram-SI44F4Z6.mjs:1978` (unconditional call → the inner gate), `:2200 :2287 :2390 :2458 :2518 :2608 :2674 :2746` (actor drawers, `hasKatex(actor.description)`), `:2883 :2898` (notes), `:3011 :3015` (`byKatex`), `:3324`, `:3414-3415` (messages), `:3467`, `:4203 :4277 :4329` (layout) | `hasKatex(...)`, or the inner gate |

  A whole-dist sweep (`import("katex")`, `from "katex"`, `require("katex")`) finds ONE site. Mermaid
  tests a LABEL, which is a substring of the source, so the remaining question was whether a parser
  TRANSFORM can manufacture `$$` from a source that has none: `sanitizeText` (`:5090-5101`) always
  runs DOMPurify, which decodes character references, and `encodeEntities`' `#\w+;` misses
  `&dollar;`. **Measured, real engine, both engines, `katex.renderToString` call-counted (instrument
  control: 3 calls):** literal `$$` → sequence message 3, note 3, actor 1, state 4, class 1;
  flowchart (4 shapes) 0, block 0 under our config. Entity forms → **0 in every case**: `&dollar;`
  (flowchart, edge, state, class, block), `&#36` / `&#36;` / `&#x24;`, mermaid's `#36;` and
  `#dollar;`, `$<br>$` splits (flowchart and sequence). (The scratch probe was not kept.)
  **(vi) THE GUARD (R15).** `src/render/diagramEnhancer.ts`: `hasDiagramMath(source)` =
  `source.includes('$$')`, checked at `drawDiagram`'s step zero right after `hasRemoteReference` —
  before the cache read and before `engine.render`, which has one call site (`drawDiagram`), reached
  from both the first render and the re-theme. A carrying fence takes §3.8's existing degrade path
  with its own reason, *"its source contains math ($$), which diagrams do not render"*. Broader than
  mermaid's test on purpose (unbalanced, across lines, in a directive): a superset, and a false
  positive costs one diagram shown as source.
  **(vii) THE TESTS — the premises pin.** `src/render/diagramEnhancer.test.ts`, 58 → 82 (+24, cases
  added only): the SUPERSET over a 15-source corpus against mermaid's REAL `hasKatex`, imported in the
  test from the installed chunk (whole source and every line); the corpus is non-vacuous; no single-`$`
  over-degrade; the DRIFT PIN (the regex text, exactly one `import("katex")` in the core graph and in
  that chunk, reached only past `if (!hasKatex(text)) return text`), every message naming this GHSA;
  the degrade, per-fence and Temml-beside cases. `tests/browser/diagramKatexGate.browser.test.ts`
  (NEW — §4's `diagramSourceGuard` file measures the wire, this measures our own chunk loading and
  running; mixing them blurs both files' zeros), Cr+Fx, the production app-page path: a flowchart
  and a sequence `$$x^2$$` each degrade to visible source, with ZERO katex artifacts in the live light
  DOM (MutationObserver: `#katex-temp`, `.katex`, `math`) and ZERO katex-chunk requests (delta
  Resource Timing); a plain diagram beside one renders; a FIRING CONTROL (last, so katex is cold
  until then) drives the same source straight into the engine and sees both.
  **RED-FIRST, all observed:** browser, guard line removed — sequence arm: chunk requested 1, katex
  ran (`katex-temp` ×2 + output) both engines; flowchart arm: rendered instead of degrading (katex
  not called — (v)). Unit: guard absent → 14 red. Drift, mermaid's chunk ABLATED in `node_modules`
  and restored md5-identical (`4e1d70b4…`): the gate made `if (!text)` → the gate pin reds with the
  GHSA message; the regex made `/\$(.*?)\$/g` → the drift pin AND the superset (live `hasKatex`,
  `$x$ and $y$`) red. Predicate narrowed to `/\$\$[A-Za-z]/` → the superset reds on `$$$$`.
  **(viii) THE IGNORE.** Key `auditConfig.ignoreGhsas`, in the root `package.json`'s `pnpm` field —
  `"pnpm": { "auditConfig": { "ignoreGhsas": ["GHSA-238p-pmpm-9mq7"] } }`. Exactly one id; no
  threshold, wildcard or CVE list. Verified in the INSTALLED pnpm's code, not its help (the help lists
  only `--ignore <CVE>`): 10.33.0 reads `auditConfig` from `manifest.pnpm` (`getOptionsFromRootManifest`,
  `pnpm.cjs:17907-17916`) and drops an advisory iff `ignoreGhsas.includes(github_advisory_id)`
  (`:137484-137492`). `pnpm-workspace.yaml` untouched.
  **(ix) FIRING CONTROL.** WITH: `pnpm audit --prod` EXIT=0, `--audit-level low` EXIT=0 (both "1 low
  (1 ignored)"). WITHOUT (reverted to HEAD's `package.json`): both EXIT=1, naming GHSA-238p-pmpm-9mq7.
  Restored. JSON: without → `[GHSA-238p-pmpm-9mq7]`, with → `[]`; suppressed = exactly that id.
  **(x) CI.** `supply-chain.yml`'s audit job runs `pnpm audit --prod --audit-level low` from the repo
  root after `pnpm install --frozen-lockfile` — the same command, reading the same root
  `package.json`. Its `pnpm/action-setup@v4` `version: 10` resolves the newest 10.x (10.34.6 today),
  whose code is the same as 10.33.0's (`ignoreGhsas` filter, `auditConfig` picked from
  `manifest.pnpm`); the 10.x floor, 10.0.0, reads `rootProjectManifest.pnpm.auditConfig.ignoreGhsas`
  — also `package.json`. So every pnpm CI can resolve honours it; no workflow edit. (A
  `pnpm-workspace.yaml` key would NOT be read at 10.0.0 — the reason it lives in `package.json`, as
  `tasks.md` 1.3 named.) The full-tree advisory step and OSV are unchanged and still report katex.
  **(xi) NOTHING ELSE MOVED.** `pnpm-lock.yaml` zero-diff; `pnpm install --frozen-lockfile` EXIT=0.
  Clean rebuild, both engines, against a HEAD build: content script, manifest and katex chunk
  md5-IDENTICAL; 138 of 139 files per engine byte-identical after content-hash normalisation; the one
  real change is the app chunk, 519,702 → 519,834 B (+132), decomposed exactly as the guard's three
  minified pieces — the reason string 65 B, `hasDiagramMath` 39 B, the step-zero check 28 B —
  residual 0. Every other md5 moved by the app chunk's NEW HASH alone (same-length names).
  `.output` 5,817,102 / 5,817,218 B (+132 each); zip 1,838,265 / 1,838,323 B (−63 each, compression).
  **Suites (full — production code changed):** lint EXIT=0 · unit 1297 (+24, all `diagramEnhancer`;
  70 files) · browser, run alone, 1803 passed / 15 skipped (+8, the new file; 180 files) — named:
  diagramKatexGate 8, diagramRender 38, diagramSecure 18, diagramSanitize 10, diagramNetwork 12,
  diagramStyleCss 36, diagramSourceGuard 8, editorPreview 24, htmlExport 8 (browser) + 13 (unit,
  the 26-site pin) · scanner EXIT=0, `--self-test` EXIT=0 · golden EMPTY. No known flake fired.
  **Revisit-when:** an upstream mermaid accepts katex ≥ 0.18.2 → remove the ignore AND the guard, bump,
  re-verify (the drift pin and the browser control show whether math comes back); a mermaid bump reds
  the drift pin → re-assess before editing it; any wish to render math inside diagrams → a RULING, not a
  task; the advisory is re-scored.

- **2026-10-08 · R15 — HUMAN RULING on task 1.3's escalation: katex is made unreachable BY CONSTRUCTION,
  folded into 1.3, one commit.** 1.3's reachability analysis STOPPED: katex IS reachable from author
  input (any `$$` in a sequence, state or class diagram; flowchart labels force HTML labels on `$$`), no
  mermaid config key closes it, and "no prototype-pollution primitive exists" could not be shown with
  evidence. Options put: (1) close the math path in our code, then land the ignore; (2) an exception on
  the narrower argument; (3) the advisory's `Object.prototype` workaround in our code; (4) the rejected
  override / red audit. **Ruled (1):** any mermaid fence whose source contains `$$` goes to the EXISTING
  source-fallback path in `diagramEnhancer.ts` before `engine.render`, the same shape and placement as
  M7's `hasRemoteReference` guard; then the ignore lands on that proof. **Named exception to M12's
  zero-diff rule for the diagram modules:** `src/render/diagramEnhancer.ts` and its tests ONLY —
  `diagramEngine.ts`, `sanitize.ts` and the view stay zero-diff. The planned `diagramEngine.test.ts`
  premises pin is DROPPED: the guard's tests are the premises pin. **Accepted cost:** math inside a
  mermaid diagram shows as source; Peekover's own Temml math is unaffected. **Interpretation, flagged:**
  "reusing its degrade path and copy" is read as the same path and the same marker FORM with a reason
  naming this cause — the remote-reference sentence would be false for a math fence.
  *Revisit-when:* as 1.3's entry above.

- **2026-10-08 · M12 TASK 5.1 — the `PERMISSIONS.md` ledger wording SIGNED by the human (D-9; gate-1
  D-B(iii)), and the save-time rulings. Doc-only — nothing is written to `PERMISSIONS.md` and no code
  moves in this commit; the signed text lands at 5.3 (interim) and 5.4 (final), per F-6.**
  The human's sign-off, 2026-10-08, verbatim: **"sign as proposed, all leans"**. It covers the wording
  below, rulings A–C, routes 1–7, the R13 re-route, E-9's home and the import-shape deferral.
  **(i) THE SIGNED TEXT, VERBATIM.** Copied from the sign-off; emphasis and backticks are part of the
  text. Each signed item is one unwrapped line, so no line break falls inside it.
  **SIGNED (a) — the summary sentence.** It replaces *"It cannot read outside a chosen folder, cannot
  write, and cannot reach the network."*:

  > It cannot read outside a chosen folder, cannot reach the network, and cannot change any file on disk except the one file the user has opened for editing — and that only when they click Save, never on its own.

  **SIGNED (b) — the new ledger row, final form (lands at 5.4):**

  > | **Edit save-back (M12 / spec 012)** | User opens a document for editing on the app page and clicks **Save**; one click per save. **Nothing saves on a timer and there is no autosave.** On Chromium that click asks the browser for write access to that one file (`handle.requestPermission({ mode: 'readwrite' })`); the browser shows its own prompt whenever it does not already hold that grant. | Only the **one file being edited** — never another file, and never the folder: the folder handle stays read-only (`mode: 'read'`), and write access is asked for on that file's own handle, at the click, not before. Immediately before writing, Peekover re-reads the file and compares it with what it last read or wrote; if the file changed on disk in between, it **writes nothing**, says so in words, and keeps the edit on screen. (The check and the write are two steps: a change landing in the instant between them is not caught.) On Firefox, on any route with no live file handle, and when the write prompt is declined, Save hands the text to the browser as an ordinary **download** instead and changes nothing in the folder. **Never touches the network.** | **No new storage.** The write goes to the user's own file on their own disk. The per-file handle lives in memory for the open tab only and is never written to IndexedDB — the stored handle in the folder-read row is the *folder's*, and stays read-only. | The **Save** button and the status line beside it, which says in words what happened: saved, saved as a download, not saved because the file changed on disk, or failed. Declining the browser's write prompt is always safe — the edit becomes a download. **Revoke** on the folder chip closes the folder and drops the file handle with it, so nothing can be saved until the folder is opened again. The chip shows that a folder is open; it does **not** show whether the browser holds a write grant for a file, and Revoke does not ask the browser to withdraw one — that grant is the browser's, visible and removable in its own site-permission controls. |

  **SIGNED (b′) — the INTERIM row, landed at 5.3 and replaced by (b) at 5.4.** It is (b) with exactly
  these three substitutions:
  - in "What it can touch", the sentence beginning "On Firefox, on any route with no live file handle"
    becomes:

    > On Firefox, on any route with no live file handle, and when the write prompt is declined, Save does not save: it says so in words, keeps the edit on screen, and changes nothing on disk.

  - in "How the user sees & revokes it", the outcome list becomes:

    > saved, not saved because the file changed on disk, not available here, or failed

  - and the sentence "Declining the browser's write prompt is always safe — the edit becomes a
    download." becomes:

    > Declining the browser's write prompt is always safe — nothing is written and the edit stays on screen.

  **(ii) Why the summary sentence says "change any file on disk", not "write".** M10's exports and this
  milestone's download fallback create files through the browser's download, which is not Peekover
  changing a file. "Cannot write anything" would have been false on the day it landed.
  **(iii) RULINGS A–C.**
  **★ A — CRLF on save.** If the file's raw read (`originalText`) was uniformly CRLF, the save writes
  CRLF; otherwise it writes the editor's LF, and the status says the line endings were normalised.
  D-7's baseline advances to the text actually WRITTEN.
  **★ B — Ctrl/Cmd+S while `data-mode="edit"` runs the same Save as the button.** It lands at 5.3.
  Outside edit the export shortcut is unchanged. *Why:* an existing app shortcut changing meaning by
  mode, not the bespoke keymap §6 defers. *Ripples named for 5.3:* `entrypoints/app/main.ts`,
  `tests/browser/exportShortcut.browser.test.ts`. Answers E-7.
  **★ C — 4.2's hint WARNS; D-7's content compare DECIDES.** The status says the file changed on disk
  while the user was editing; the save proceeds iff the compare finds the on-disk text equal to the
  baseline. Supersedes `tasks.md` 5.3's "On conflict — or on 4.2's hint — the SAFE FLOOR" for the hint
  half. R6 stated in practice; it answers the open product call the 012 D-8 / 4.2 entry's judgment
  call 2 left for 5.3's kickoff.
  **(iv) ROUTES 1–7.**
  - **1 · the 5.3 → 5.4 gap** → the two-stage text above; `PERMISSIONS.md` joins 5.4's Files for the
    swap.
  - **2 · the wrong-file window AND the Revoke tension** → 5.3 binds the file handle to the edit
    session at edit entry (never read from the current file at click time), AND Revoke, closing the
    folder and switching folders end any open edit session (its bound handle with it). Both are 5.3
    Verify clauses, red-first. Selecting another file while editing stays 6.1's guard.
  - **3 ·** if 5.5 rules force-overwrite, the row is re-signed at 5.6.
  - **4 ·** 5.3 makes the consistency edits that are not the positioning sentence: the ledger
    heading's enumeration of capabilities (`PERMISSIONS.md:31`), "the last four rows" (`:33-36`), and
    a cross-reference from the folder-read row's "read-only" to the new row (`:40-41`). The
    zero-network section gains the save path at 5.7, after the proof; `PERMISSIONS.md` joins 5.7's
    Files.
  - **5 ·** `src/app/chromiumFolderSource.ts`'s "Read-only mode: Peekover never writes to the chosen
    folder" comment gets a COMMENT-ONLY correction at 5.3 — a named exception to that file's milestone
    zero-diff rule, proven by md5-identical bundles on both engines.
  - **6 ·** `capability.ts`'s pre-picker consent line → unchanged; a verdict item on the 7.1 walk.
  - **7 ·** "Wipe all data" does not close an open folder (the folder-read row's "revokes" is loose
    today) → carried, outside M12.
  **(v) R13 RE-ROUTED.** No mermaid release carries a patched katex (every version through 12.1.0 pins
  katex ^0.16.x; patched is ≥ 0.18.2), so a bump cannot close it. **Ruled route (i): a reviewed,
  documented exception — the discovered task 1.3** (`tasks.md`), which runs after 5.1 and before 5.2.
  *Rejected:* an override (a breaking 0.x jump forced onto a dependency that did not ask for it);
  leaving the audit red. *The registry claim is recorded as ruled; this doc-only session did not
  re-check it — 1.3 reads the advisory at source.*
  **(vi) E-9 (filed here).** In dark, the selection's fill reads 1.29:1 against the pane, down from
  11.22 — selected text is now readable (5.03) but the region is barely visible (the M12 TASK 3.4
  landing entry's "THE COST, STATED", below). It is a design decision (likely a dedicated selection
  token) → a PRIORITY item on the 7.1 walk.
  **(vii) The 3.4 import-shape optimisation** (~10.8 KB per original CodeMirror edge) → deferred to
  post-M12, carried.
  *Revisit-when:* 5.5 rules force-overwrite (re-sign at 5.6); 1.3's reachability analysis finds the
  advisory reachable (escalate); 7.1's walk.

- **2026-10-06 · M12 TASK 3.4 — LANDED: the editor's highlight colours come from design tokens (R8,
  E-3); dark-theme selection, current search match and autocomplete reach AA from tokens (E-2); the
  collapsed TOC handle no longer covers the split pane (E-1); the preview runs the reader's four
  enhancers (R7, R10 — P-1). Six human rulings were taken for or in this task — R9–R14, the entry
  below. One defect was found and fixed on the way (a highlight style built per host draws nothing
  on Firefox from the second host on), and one audit clause is NOT met (R13).**
  **THE SPECIFIER ROUTE — three dynamic edges, no fourth.** `editorEngine.ts` gains
  `import('@codemirror/language')` beside the two it had, and names `HighlightStyle`,
  `defaultHighlightStyle` and `syntaxHighlighting` from it. The style is BUILT FROM the default one:
  `defaultHighlightStyle.specs` (the property exists in the installed 6.12.4) is mapped spec for spec,
  the `tag` objects reused as they are and only `color` replaced — so no tag is named and
  `@lezer/highlight`, where the tags live, is never written. A tag is recognised by its name, read
  with `String()`. It is registered NON-fallback after the ruled pair, which displaces the fallback
  default `basicSetup` registers; the ruled pair is unchanged and still first.
  The fence (`editorImportFence.test.ts`) permits exactly three, all dynamic, all in the engine, and
  gains one assertion: no `@lezer/*` or `style-mod` specifier anywhere in the shipped tree — the
  fence's own matcher is scoped to `codemirror` / `@codemirror/*` and would not have seen that edge.
  Seen red: a fourth `@codemirror/state` edge (4 tests), an `@lezer/highlight` edge (1), a type-only
  static import of the third package (3).
  **THE PALETTE → TOKEN MAP (R11: two-tone).** On `--code-bg` only `--ink` (15.74 light / 13.61 dark)
  and `--muted` (5.49 / 6.54) clear AA for text in both themes; `--del` is 4.35 / 5.98, `--warn`
  3.21 / 7.58, `--ok` 3.08 / 7.30, `--faint` 2.38 / 3.26. So the default style's fourteen coloured
  roles map onto two tokens and one exception:

  | Default style's role (its own grouping) | Token |
  |---|---|
  | `meta` (markdown's own marks) | `--muted` |
  | `atom` · `bool` · `url` · `contentSeparator` · `labelName` | `--muted` |
  | `comment` | `--muted` |
  | `invalid` | `--del` |
  | `keyword` | `--ink` |
  | `literal` · `inserted` | `--ink` |
  | `string` · `deleted` | `--ink` |
  | `regexp` · `escape` · `special(string)` | `--ink` |
  | `definition(variableName)` | `--ink` |
  | `local(variableName)` | `--ink` |
  | `typeName` · `namespace` | `--ink` |
  | `className` | `--ink` |
  | `special(variableName)` · `macroName` | `--ink` |
  | `definition(propertyName)` | `--ink` |

  The five specs that carry no colour (link, heading, emphasis, strong, strikethrough — weight,
  slant and decoration) pass through as the same objects and are now what carries structure. A coloured
  spec a later version adds falls to `--ink`. `invalid` in `--del` is below AA on light (4.35) — it
  was 3.53 in the default red, and nothing in a markdown document is tagged `invalid`; stated, not
  asserted.
  **E-3 as measured, both engines identical** (`editorEyeballProxy`, proxy 3 — 23 spans per theme):
  markup marks (`#`, `-`, `|`, `~~`, `~`, `^`) 8.44 → 5.49 light, **1.69 → 6.54 dark**; the task
  marker 11.52 → 5.49, **1.24 → 6.54**; the emoji shortcode 6.62 → 15.74, **2.15 → 13.61**. Every
  span is now asserted ≥ 4.5:1 on both themes, and asserted to draw in exactly `--muted` or `--ink`
  as the host's theme resolves them. *Light is lower than it was for the marks and still clears AA —
  "un-regressed" is read as "still passes", flagged.*
  **★ FOUND AND FIXED — A HIGHLIGHT STYLE PER HOST DRAWS NOTHING ON FIREFOX.** The engine is loaded
  per host (R2), and the first build made the style per engine. CodeMirror keeps every view's rules
  in ONE constructed stylesheet per document, adopted by each shadow root; a style per host inserted
  a fresh set of rules into that shared sheet for every host. On Firefox, from the second host on,
  the rules were PRESENT in the sheet and the sheet was adopted, and they did not apply — the editor
  drew with no highlight styling at all, weight and decoration included. Chromium applied them.
  Measured over 14 hosts on each engine. The style is now built once per page (a `WeakMap` keyed on
  the default style object) and shared by every engine, as the default style always was. Seen red:
  the unit test (`define` called 2 times) and, on Firefox only, proxy 3 (`the task marker draws in
  --muted: expected [ '#16171f' ]`). *The Firefox mechanism itself was not isolated further.*
  **E-2's MECHANISM — `EDITOR_CSS`, not `EditorView.theme()`.** `tasks.md` 3.4's Files line places it
  in `EDITOR_CSS`; the kickoff offered either, so the file was followed. The engine has no dark theme
  here, so its LIGHT rules apply under every theme. Three rules, each a token:
  - the selection is `--hl-soft`, focused or not — the reader's own `::selection`. The engine's
    focused rule is five classes deep, so the selector carries SIX and wins whichever sheet loads last;
  - the current search match is `--hl-soft` with an inset `--ink` rule under it. `--hl` is not used as
    a fill: text on it needs a literal dark colour (`readerCss.ts`'s own note), which this sheet does
    not write;
  - the tooltip is `--panel` with `--ink` text and a `--line` border.

  | E-2 pair (text, bar 4.5:1) | Light | Dark |
  |---|---|---|
  | selected text on the selection, focused | 12.95 → 15.8 | **1.16 → 5.03** |
  | selected text on the selection, unfocused | 13.15 → 15.8 | **1.14 → 5.03** |
  | the current search match's text | 9.86 → 16.31 | **1.52 → 10.52** |
  | an unselected autocomplete option | 16.37 → 16.18 | **1.09 → 14.45** |

  Identical on both engines; all four are now asserted on both themes, with four neighbouring pairs
  that passed at 3.2 asserted not to have been traded away (body text 15.74 / 13.61, text on the
  active band 15.43 / 6.18, a plain match 15.75 / 4.85, the selected completion 4.63 — all unmoved).
  **★ THE COST, STATED:** the selection's fill against the pane (non-text, never asserted) went
  1.27 → 1.04 on light and **11.22 → 1.29 on dark**; the tooltip against the pane 14.83 → 1.06 on
  dark. No existing token gives selected text ≥ 4.5:1 AND a fill ≥ 3:1 against the pane in either
  theme: the fill's relative luminance would have to fall in 0.1448–0.1464 on dark and
  0.2147–0.2587 on light, and no token does. Text legibility was chosen — it is what E-2 names.
  A 7.1 walk item.
  **★ REPORTED, NOT FIXED (R12):** a `--muted` mark on CodeMirror's active-line band reads 5.38:1 on
  light and **2.97:1 on dark**, both engines. The band is the engine's default and stays so.
  **E-1's MECHANISM — a top offset while the rail is collapsed.** One rule:
  `:host([data-mode="edit"][data-toc="collapsed"]) .peekover-editor{margin-top:90px}`. The collapsed
  handle ends at 82 px; the pane now starts at 90 px. A right reservation was rejected: it would take
  about 135 px from a pane that is 350 px wide at 414 px, and depend on the handle label's width.

  | Viewport, rail | Pane before | Pane after | Pane × handle |
  |---|---|---|---|
  | 414×896, collapsed | 32,56 → 382,862 | 32,90 → 382,896 | 103.1×26 px → none (8 px clear) |
  | 1400×900, collapsed | 32,56 → 1368,596 | 32,90 → 1368,630 | 103.1×26 px → none (8 px clear) |
  | 414×896, open | 32,56 → 132,862 | unchanged | none; 124.7 px left of the rail |
  | 1400×900, open | 32,56 → 1118,596 | unchanged | none; 32 px left of the rail |

  `KNOWN_PANE_UNDER_HANDLE` and its "still present" assertion are DELETED; the relation is asserted
  like every other, in every state. *At 414 px collapsed the pane's bottom edge is now at the
  viewport's (896); the page scrolls, as before.* *Firefox drew the handle 28 px high in one run and
  30 px in another (web-font timing); the clearance is 8–10 px either way.*
  **THE ENHANCERS ON THE NESTED HOST (R7, R10).** `renderPreview` calls `mount()` and then
  `enhanceDiagrams`, `enhanceMath`, `enhanceTables`, `enhanceCode` on the nested host — the order of
  the two app-page call sites (`readerPane.ts:203-235`, `appShell.ts:187-191`), without
  `enhanceEditor`, which sits between math and tables there and has no meaning in a preview.
  - *Safe on a host re-rendered under them:* it is what the watch already does to the OUTER host
    (`appShell.ts`'s render closure runs the same four after each watch `mount()`); every render
    arrives through `replaceChildren`, so each enhancer meets unmarked nodes.
  - *Each call is guarded on its own.* Unguarded, a throw at build leaves `buildEditorShell` through
    its catch and edit mode is never entered (seen red: `an enhancer failure at build cost the edit
    view: expected 'reading' to be 'edit'`); under one guard for all four, the enhancers after the
    one that threw are skipped (seen red: `the table enhancer ran after the three that threw:
    expected +0 to be 1`). Both engines. No production seam: the test makes `querySelectorAll` throw
    on a preview host's shadow root.
  - *As measured, both engines:* at build and again after a keystroke the preview's census equals
    the outer document's — one figure with an SVG, one `<math>`, two wrapped code fences of which
    the `javascript` one is highlighted (`js` is `failed` in the reader too), one table toolbar.
    Before: 0 / 0 / 0 / 0 / 0, the literal `$x^2$` and the raw fence.
  - *Chrome the preview gains:* the code block's toolbar (line numbers, wrap, copy, collapse); the
    table's toolbar (sort, filter, copy) — its state resets on every re-render, as R10 accepts; the
    diagram's actions and its lightbox, which opens inside the nested host; the math copy actions.
    None of it was walked by a human — 7.1.
  - *A theme flip re-themes the preview's diagram*, each way, and a diagram drawn by the next render
    is born in the theme in force (asserted). The nested host registers with the diagram
    enhancer's own host registry on its first diagram; a discarded one is pruned by `isConnected`.
  - **★ FOR 6.2:** the cooldown times `renderPreview`, and the enhancers are synchronous to CALL and
    asynchronous to FINISH — it times the mount and the placeholders, NOT the engines' work. Each
    preview render re-runs every lazy engine on fresh nodes, untimed.
  - `editorView.ts` imports the four enhancers directly. It is app-page-only and the fence's clause A
    is unchanged and green: the content-script graph reaches no editor module.
  **BYTES, both engines identical in every delta.** `.output` 5,816,970 B (Cr) / 5,817,086 B (Fx),
  **+2,433**; headroom 1,523,062 / 1,522,946 B. Zips 1,838,328 / 1,838,386 B (+1,810).

  | Arm (full minus ablated) | Bytes | Where |
  |---|---|---|
  | the highlight style, incl. the third edge | 1,844 | app chunk 945 · CodeMirror lazy chunks 899 |
  | E-2's three rules | 376 | app chunk |
  | E-1's rule | 82 | app chunk |
  | the enhancer calls | 131 | app chunk |
  | residual | 0 | |

  The app chunk is 518,168 → 519,702 B (+1,534). The CodeMirror lazy chunks go from three
  (54,680 + 209,493 + 342,426) to four (35,035 + 54,846 + 209,748 + 307,869), +899 B. No other file
  changed size. With all four arms ablated every one of the 276 shipped files is name-, size- and
  md5-identical to the post-install baseline, which is itself identical to HEAD's — the install
  alone moves no byte.
  **★ THE IMPORT'S SHAPE IS WORTH 10,883 B.** Written like the other two edges — destructured out of
  the `Promise.all` result — the third edge cost **+13,316 B**: the bundler kept every export of
  `@codemirror/language`. Naming the three exports in a `.then` on the import itself is a shape it
  can read, and the same build is +2,433 B. **Not done, flagged for the human:** the two existing
  edges are destructured the first way, so the same change there may recover bytes too. It is
  outside this task, and is not measured.
  **Content script: 342,652 B, md5 `97b1b8690f195acb499a464fee532b34` (Cr) /
  `c0115d89b10be306ffa0c77d2234a63e` (Fx) — identical to 4.2's in every arm**, and seen to MOVE
  (344,389 B, +1,737, both md5s changed) when the content-script entry was made to reference
  `EDITOR_CSS`. Manifest 654 / 770 B, `permissions: []`, `dependencies` 11.
  **GOVERNANCE (R9).** Installed 6.12.4 — the version the `codemirror` meta-package already resolves,
  registry integrity equal to the lockfile's · `pnpm why`: one version (also one each of
  `@codemirror/state`, `@codemirror/view`, `@lezer/highlight`, `dompurify`, `markdown-it`) · lockfile
  diff: three added lines, the importer entry; no resolved version moved · MIT; scripts are `test`
  and `prepare`, no install hook · SBOM regenerated, 191 components (unchanged — the package was
  already transitive), not staged · **`pnpm audit --prod` EXIT=1 — NOT MET, see R13.**
  *Flagged:* `pnpm add` wrote an exact pin; the range is `^6.12.4`. An exact pin would leave a second
  copy behind the next time CodeMirror's own range resolves higher — the identity hazard R9 names.
  **THE HARNESS, ONCE:** the first browser run after the install reloaded mid-file ("optimized
  dependencies changed. reloading") — Vite's dev pre-bundler meeting the new specifier. It cleared on
  the next run and does not touch the shipped bundle; a cold checkout will see it once.
  **Verify.** lint 0 · unit **1273** (70 files; `editorEngine` 25 — 21 + 4,
  two pins edited by R14 — `editorImportFence` 11 — 10 + 1, its three count pins moved 2 → 3 —
  `editorView` 27 and `editorEnhancer` 28, both unedited; `htmlExport` 13, its `:host` pin still 26) ·
  browser **1795 pass / 15 skip** (178 files, 89 per engine, run alone; per engine `editorPreview`
  12 — 10, the REPORTED test replaced by three — `editorEyeballProxy` 11, `editorRender` 10,
  `editorDegrade` 9, `editorNestedHost` 12, `editorWatch` 6; the enhancers' own files per engine:
  diagram 138 over 12 files, math 62 over 5, table 98 over 7, code 60 over 7) · scanner and
  `--self-test` EXIT 0 (79 shipped files; 7 firing + 10 silent) · golden diff EMPTY · the zero-diff
  list empty (`mount.ts`, `readerMode.ts`, `editorEnhancer.ts`, `watchController.ts`, the four
  enhancer modules, `readerPane.ts`, `appShell.ts`, `htmlExport.ts` and its test,
  `chromiumFolderSource.ts`, `runReader.ts`, `mountReader.ts`, `contentWatch.ts`). **No red in the
  final runs, and none of the carried flakes fired.** Two reds on the way, both classified: the
  one-time harness reload after the install (cleared on rerun), and the Firefox-only highlight
  defect (real — persisted on rerun, reproduced in isolation over 14 hosts, fixed).
  *Revisit-when:* the 7.1 walk (the two-tone palette, the dark selection's visibility, a muted mark
  on the active band, the preview's new chrome); 6.2 (the enhancers' untimed cost per render); the
  katex bump (R13); a CodeMirror upgrade — re-run `pnpm why @codemirror/language` and the palette
  test, whose fourteen rows pin the default style's own grouping.

- **2026-10-06 · M12 TASK 3.4 — six HUMAN RULINGS: R9 and R10 in the task's kickoff; R11–R14 taken
  in the task, each on a stop the kickoff itself set. Banked here; each landed in 3.4's commit.** The
  numbering continues R1–R8; *R11–R14 are numbered by the agent, for reference — the human gave the
  answers, not the numbers.*
  **★ R9 — INSTALL `@codemirror/language` as a direct dependency (`dependencies` 10 → 11), governed
  like 1.1 / 1.2.** It answers the install question R8 and `tasks.md` 3.4 left open. Conditions, each
  a stop if unmet: the installed version is exactly the one CodeMirror already resolves (a second
  copy would silently break the highlight style — CodeMirror matches extensions by object identity)
  · `pnpm why` shows one copy · the lockfile diff adds the direct entry and moves no resolved version
  · licence and no-install-scripts checked against the registry · `pnpm audit --prod` EXIT=0 · the
  SBOM regenerated (transient, not staged), count recorded against 191 · `dompurify` and
  `markdown-it` still one copy each. *Authorized ripples:* `package.json`, `pnpm-lock.yaml`. Results
  are in the landing entry above; the audit condition was NOT met and went back to the human (R13).
  **★ R10 — the preview runs ALL FOUR of the reader's enhancers — diagrams, math, tables, code — in
  the reader's call-site order, on the nested host after each preview render.** This widens R7,
  which named three. Tables included: their toolbar is accepted in the preview, and its state
  resets on each re-render.
  **★ R11 — THE PALETTE IS TWO-TONE.** The kickoff's stop at step 0(b) fired: the default highlight
  style has fourteen coloured roles, and only `--ink` and `--muted` clear AA for text on `--code-bg`
  in both themes. Options put: two-tone ink / muted, with `invalid` in `--del` · the semantic tokens
  (`--del` / `--ok` / `--warn`), colourful on dark and 3.08–4.35:1 on light, which regresses the
  light control arm · new syntax tokens, a brand decision touching `design/tokens.css`. **Ruled: the
  first.** *Why (the human's choice of the recommended option):* AA on both themes, no new token,
  on-brand — paper, ink, one highlighter.
  **★ R12 — a `--muted` mark on the active-line band is REPORTED, not fixed.** Under R11 a muted
  mark on CodeMirror's dark active-line band falls below AA (estimated 3.7:1 when asked; measured
  2.97:1). Options put: report it and carry it to 7.1 · make the band token-driven now, a fourth
  surface beyond the three `tasks.md` names for E-2. **Ruled: report only.**
  **★ R13 — THE AUDIT CLAUSE IS CARRIED, NOT MET.** `pnpm audit --prod` exits 1 on one LOW advisory,
  GHSA-238p-pmpm-9mq7 (*"KaTeX: Existing prototype pollution can bypass trust restrictions"*,
  `katex >= 0.11.0 < 0.18.2`, path `mermaid > katex`). It is NOT caused by this install: with the
  change stashed and HEAD's lockfile reinstalled the audit exits 1 the same way — the advisory was
  ingested after 1.2 restored exit 0. Installed `katex` is 0.16.47, the newest inside mermaid's
  `^0.16.45`; the patched range is outside it, so closing it needs a `pnpm.overrides` entry (the 1.2
  ruling was "still no overrides") or a mermaid release. It ships, as mermaid's lazy `katex` chunk;
  whether Peekover's diagram path can reach the affected trust setting was NOT assessed. Options
  put: proceed and carry it to a dedicated bump task · fix it inside 3.4 with an override · revert
  the install and stop. **Ruled: proceed and carry** — the 1.1 → 1.2 precedent; 3.4 moves no
  resolved version. *Home:* a dedicated bump task, human-scheduled, before 7.1 (`progress.md`
  § Carried items).
  **★ R14 — TWO EXISTING PINS IN `editorEngine.test.ts` ARE EDITED.** The kickoff asked for the
  highlight style "appended after the ruled pair" in `createView` AND that no existing assertion
  beyond its two authorized ones be edited; the file pins the view's extension list exactly, twice.
  Both could not hold. Options put: authorize the two pin edits · keep the pins and have the caller
  pass the style in. **Ruled: authorize.** Each `toEqual` gained the one element
  (`'TOKEN_HIGHLIGHT'`), the first test's title was updated, and a new test asserts the ruled pair
  is still first and unmodified. The R1 precedent (3.2), same file, same pin.
  **Also authorized by `tasks.md` 3.4 itself, stated so they are not mistaken for drift:** the fence's
  three count pins (2 → 3) and its permitted list; `KNOWN_PANE_UNDER_HANDLE` and its assertion,
  deleted; the 3.3 REPORTED test, turned into assertions.
  *Revisit-when:* the 7.1 walk's verdict on the two-tone palette (R11) and the active band (R12);
  the katex bump task (R13).

- **2026-10-06 · 012 D-8 — 4.2 landed (the hint, per R6): while the watch holds an external change
  behind an edit session, the outer host carries `data-watch-changed-in-edit`. No UI; task 5.3 consumes
  it. No human ruling was taken; three judgment calls are flagged below.**
  **The attribute.** `data-watch-changed-in-edit`, presence-only (written with `toggleAttribute`, so its
  value is the empty string — never `"false"`), on the OUTER host, beside `data-diff` / `data-mode` /
  `data-edit-dirty`. Exported from `src/watch/watchController.ts` as `CHANGED_IN_EDIT_ATTR`; that module
  is its only writer. 5.3 reads it by literal and pins the literal to the export in a test (the
  `data-diff` / `data-mode` precedent). No import was added (the 5.1 fence's Clause C).
  **Where it sets and clears — one function, `syncEditHint`, which writes what is true NOW:** present
  iff a change is held behind a deferral AND `data-mode === 'edit'`. It is called at every point either
  half can move (the file's DECISION 6 comment is the in-code record):
  - *where text becomes held* — `markDeferred`, which both deferral sites share: `onText`, and
    `flushPending` when a cooldown timer armed before edit entry fires during it;
  - *where the mode or the diff flag moves while text stays held* — the existing observer, in the
    branch that used to do nothing ("something still defers");
  - *where the hold ends* — the exit flush (`onDiffExited`, before its render) and `cancelPending`,
    which is `stop()`, the dead-read stop, and both halves of a document switch (`stop()` then
    `start()`). `stopSelf` now calls `cancelPending` before it drops `host`, so the clear has a host
    to act on — a reorder of two statements, byte-neutral.
  A diff-only deferral never writes it (asserted as zero writes of the attribute, not just absence).
  **★ JUDGMENT CALL 1 — "held during edit" is read as a STATE, not as "set at arrival, cleared at the
  end of the deferral".** `tasks.md` says the attribute is "ABSENT otherwise — … outside edit". With
  edit AND a diff both deferring, leaving edit does not end the deferral (the diff still holds the
  text, 4.1), so a set-then-clear-at-the-end build would leave the hint on a host that is no longer
  being edited. As built it goes when edit ends and the text stays held. The mirror case follows from
  the same rule and is also built: text held under a diff, THEN edit entered → the hint appears with
  the edit (the disk is ahead of the buffer the editor just opened). Neither case is in the kickoff's
  list; both are tested and both red when the observer's re-read is removed.
  **★ JUDGMENT CALL 2 — step 0(d): NO content comparison.** The controller keeps no copy of the last
  rendered text, but it can already read it: `readerSourceFor(host)`, imported since 006 and read in
  `renderNow` for the snapshot capture. So "the file returned to exactly what is on screen" IS
  detectable without new state, in one line. It was not added: (i) R6 — the hint never replaces D-7's
  save-time compare, and a hint that is itself a content compare is a second, weaker copy of it
  (against the rendered text, not the buffer's baseline; not at save time); (ii) the flush re-renders
  that text regardless, as at 4.1, so "a change is held" stays the single fact the attribute and the
  flush both follow. **Consequence, stated for 5.3:** a file that changes and changes back while being
  edited still carries the hint. `tasks.md` 5.3 routes "on conflict — or on 4.2's hint" to the safe
  floor; read literally, that refuses a save D-7's compare would allow, until edit is left.
  **★ JUDGMENT CALL 3 — the hint clears when the WATCH stops, even though the disk did change.**
  `stop()` (the user turning watch off mid-edit, or a dead read) drops the held text, and the hint goes
  with it: the controller no longer holds anything to be true about. This is the kickoff's own
  `stop()` case; it is recorded because it is the plainest instance of why the hint is early notice
  only — an unwatched document never has it at all.
  **Unchanged:** the flush (an ordinary watch render, silent — R4), the cooldown, the "changed again"
  line, the interim state (every exit flushes; a dirty exit discards the buffer — 6.1's guard).
  **Kickoff vs repo, flagged.** (a) "`start(otherHost)` while held → removed from the first host":
  `start()` on a RUNNING controller is the idempotent no-op it has been since 005, so it removes
  nothing — and should not, the change is still held for the first host. A document switch is
  `stop()` then `start()`; that is what is tested, with the bare `start()` pinned as a no-op beside it.
  (b) "no import of any editor or readerMode module": `watchController.ts` has imported
  `readerSourceFor` from `readerMode` since 006. No import was added or removed. (c) "set vs clear vs
  the constant": the decomposition is a shared helper plus four call sites (progress.md's 4.2 record).
  *Revisit-when:* 5.3's kickoff — what the hint does to a save (judgment call 2's consequence: refuse,
  or prompt D-7's compare to rule) is a product call for the human, not 5.3's to assume; 6.1 — "stay"
  must leave the hint in place and "discard" must clear it (it will, through the flush); any task
  that wants the hint to survive a stopped watch.

- **2026-10-06 · M12 RULINGS after task 4.1 — five human rulings (R4–R8): an edit-exit flush is silent;
  4.1's state-based flush is accepted; task 4.2 is RE-SCOPED to the "changed on disk while you were
  editing" hint; the live preview runs the reader's enhancers; the editor import fence widens to a third
  dynamic specifier. Doc-only — no code moved in this commit; each ruling lands at the task it names.**
  All five were ruled as the reviewer leaned. The numbering continues 3.2's R1–R3 (the M12 TASK 3.2
  entry, below). R4 and R5 answer the two judgment calls the 012 D-8 / 4.1 entry flagged; R6 answers its
  exit-order finding; R7 answers P-1 (the 012 D-5 / 3.3 entry); R8 answers E-3 (the "informal eyeball
  DEFERRED" entry) and the stop-and-ask the 012 D-10 entry's revisit-when set on a third specifier.
  **★ R4 — an edit-exit flush is SILENT beyond the normal watch flash.** Leaving edit with a held
  external change renders it as an ordinary watch update: the control flashes and nothing is said.
  *Why:* the existing "changed again" note names the comparison view ("…while the comparison was
  open"), and on an edit exit no comparison was open — the sentence would be false. The useful moment to
  tell the user is DURING edit, and that is R6's hint. Plan §0 D-8's "equivalent to never having edited
  at all" holds. This is what 4.1 built (`pendingHeldUnderDiff`: the line is said only when a diff was
  displayed while the text was held); it stands as built, with no code change owed.
  *Revisit-when:* the 7.1 walk finds a silent flush after editing surprising in real use; or new copy
  for the edit case is wanted — a product-copy decision, not a task's.
  **★ R5 — 4.1's state-based flush is ACCEPTED in place of an `oldValue` check.** The built condition
  is "the text was deferred, and nothing defers any more"; 4.1's kickoff had asked for "flush only when
  `oldValue` is `'edit'`".
  *Why:* it is the same tested behaviour without a second source of truth — the flush acts only on text
  labelled deferred, so a reading ↔ raw flip, or `mount()`'s own `data-mode` write, releases nothing
  (asserted, and red when the label check is removed). The deviation the 012 D-8 entry flagged is closed.
  *Revisit-when:* a later task needs the observer to tell WHICH mode was left — none is planned.
  **★ R6 — task 4.2 is RE-SCOPED to the "changed on disk while you were editing" HINT. The dirty-exit
  asymmetry is not built at 4.2 and not built in `watchController.ts` at all.**
  *Why, from 4.1's step-0(c):*
  - 3.2's exit tears down — removing `data-edit-dirty` — before the watch's observer runs, so
    `watchController.ts` cannot see a dirty exit;
  - once 6.1's guard lands, a dirty exit never completes with the buffer alive: "stay" keeps edit mode
    (the deferral simply continues), and "discard" clears dirty (the flush proceeds, as a clean exit).
    So no dirty-exit detection is needed anywhere.
  *What 4.2 now is:* `watchController.ts` sets a literal host attribute while it holds an external
  change deferred during edit, and clears it when that deferral ends. No UI at 4.2; task 5.3 consumes it
  (the status text and the safe floor). **The hint NEVER replaces D-7's save-time content compare.**
  *Where the asymmetry went:* into 6.1's Verify (a dirty exit attempt with a change deferred — "stay"
  and "discard", both directions, red-first).
  *Until 6.1:* the interim state 4.1 recorded stands — an exit discards the buffer, then shows the
  on-disk text.
  *Rejected:* building the exit guard at 4.2 — it reorders 6.1 into group 4.
  *Not ruled here:* the attribute's name. 4.2 chooses the literal and records it; 5.3 reads that literal.
  `tasks.md` 4.2 carries a dated RE-SCOPED block; its original body is kept below it, marked
  superseded, not deleted.
  *Revisit-when:* 4.2's kickoff (the literal; the three clearing paths — flush, a document switch,
  stop); 5.3 (what the status says when the hint is present); 6.1 (the asymmetry's two directions). If
  6.1's guard is ever descoped, the interim state becomes permanent and this ruling is re-opened.
  **★ R7 — P-1: the live preview runs the reader's enhancers — diagrams, math, code, in the reader's
  order — on the nested host after each preview render.**
  *Why:* gate 1's D-C ruled the preview is "the existing pipeline"; a live preview that diverges from
  the reader on M7 / M9 / M11's content defeats its purpose.
  *Cost:* measured at 6.2, not assumed (the lazy engines now re-run per preview render; P-2 and P-3 are
  inputs to the same measurement).
  *Lands at:* the discovered task 3.4.
  *Revisit-when:* 6.2's numbers show the enhancers dominate the preview's render cost — that is a
  finding for the §8-2 ruling, not a reason to drop them silently.
  **★ R8 — E-3: the editor import fence is WIDENED to a third DYNAMIC specifier,
  `@codemirror/language`, so the syntax-highlight colours can come from design tokens.** Still
  dynamic-only, still exactly enumerated, still app-page only; clause A is unchanged. **This AMENDS the
  two-specifier permitted set of the 012 D-2 and 012 D-10 entries (below)** — their text is not edited;
  from task 3.4 the permitted set is exactly THREE dynamic edges: `codemirror`,
  `@codemirror/lang-markdown`, `@codemirror/language`. It is the human's answer to 012 D-10's
  stop-and-ask, for this one specifier; a fourth is a new stop-and-ask, not a count to bump.
  *Why:* CodeMirror's default highlight palette is a light-page one and reads 1.24–2.15:1 on the dark
  pane (E-3); AGENTS.md forbids hardcoded colours, and a token-driven highlight style is defined
  through that package.
  *Lands at:* 3.4, together with **E-1** (the collapsed TOC handle over the split pane's corner) and
  **E-2** (dark-theme selected text, the current search match and autocomplete options below AA).
  *Stated so it is not assumed (checked at `2466f2e`, not ruled):* `@codemirror/language` is not a
  direct dependency — `package.json` names `codemirror` and `@codemirror/lang-markdown` only, and
  `node_modules/@codemirror/` holds `lang-markdown` alone — so the specifier does not resolve today.
  Whether 3.4 installs it (`dependencies` 10 → 11, a governed install with files beyond 3.4's list) is
  for 3.4's kickoff; the package's bytes are already in the shared lazy chunk either way.
  *Revisit-when:* 3.4's kickoff (the install question above); any later task that wants a fourth
  CodeMirror specifier; the 7.1 walk's verdict on the token-driven colours.
  **Also stated, unchanged by these rulings:** E-4, E-5, E-6 and E-8 remain 7.1 walk items. E-7
  (Ctrl/Cmd+S in edit) remains owed before the first write, in the save-time batch at 5.1 — with the
  ledger wording and CRLF-on-save. P-2 and P-3 remain 6.2 inputs.

- **2026-10-05 · 012 D-8 — the deferral half LANDED at task 4.1: while a document is being edited the
  watch renders nothing, and leaving edit flushes what was held. The exit ASYMMETRY (a dirty exit must
  not auto-flush) is NOT built — it is task 4.2's, and 4.1 found why it cannot be built in
  `watchController.ts` by an attribute read. No human ruling was taken in this task; two judgment
  calls are flagged below for one.**
  Plan §0 D-8's entry draft, quoted verbatim because `tasks.md` lands each D-value's draft with its
  implementing commit:
  "012 D-8 — the watch relay's own DECISION 4 (2026-07-23, `watchController.ts`'s `data-diff`-gated
  deferral) is the exact mechanism the edit/watch collision needs, extended by one more gated
  condition; the one new wrinkle is that an edit session's exit-flush cannot be silent the way a
  diff's is, because unlike a displayed diff (read-only), an edit session holds unsaved local state a
  silent `replaceChildren` would destroy."
  [Task 4.1 implements the first clause — the deferral widening — and the CLEAN-exit flush. Task 4.2
  implements the second clause: the dirty-exit asymmetry and the "changed on disk while you edited"
  hint. Until 4.2 lands, the second clause describes nothing in the code.]
  [The draft's "silent the way a diff's is" is not what a diff's exit does: since 006 D-11 that flush
  sets the "changed again" line (`CHANGED_AGAIN_NOTE`). Read it as "unconditional".]
  **What 4.1 built, in `src/watch/watchController.ts` and nowhere else in production** (its
  DECISION 5 comment is the in-code record):
  - **One more gated condition, at both sites.** `deferring(target)` is `diffDisplayed(target) ||
    target.getAttribute('data-mode') === 'edit'`, read in `onText` and in `flushPending` (the path a
    cooldown timer armed BEFORE edit entry takes). `data-mode` and `edit` are literals — the 5.1
    fence's Clause C; no import was added. The unit suite drives the real `enterEditMode` /
    `exitEditMode` against the controller, so a respelling in `readerMode.ts` goes red.
  - **The same observer, one more attribute.** `attributeFilter` is `[data-diff, data-mode]`. The
    callback asks whether ANYTHING still defers and, if nothing does, runs the one exit flush
    (`onDiffExited`, name kept). So: leaving edit under an open diff releases nothing; closing a diff
    while editing releases nothing; whichever goes last releases the newest held text, once.
  - **★ SUPERSEDED IN MECHANISM — the kickoff's "flush only when `oldValue` is `'edit'`".** The
    observer does not read `oldValue`. It now also hears every reading ↔ raw flip and the `data-mode`
    write `mount()` makes on each render; none of them can release anything, because the flush acts
    only on text labelled DEFERRED (`pendingSetByDefer`), and that label is set only while something
    defers and cleared by the flush. The behaviour the kickoff asked for holds and is asserted (a flip
    with nothing pending renders nothing; a flip does not release a cooldown-pending render early —
    red when the label check is removed). **Flagged as a deviation.**
  - **The flush is an ordinary watch render** — `renderNow`: `preserveReading`, the update signal, the
    snapshot capture (006 D-11's "captures normally" — asserted in the real engine: the flush stored
    the document it replaced).
  - **★ JUDGMENT CALL, FLAGGED FOR A RULING — the "changed again" line is not said on an edit-only
    flush.** `tasks.md` 4.1 says the exit flushes "exactly as a diff exit does", and a diff exit sets
    `CHANGED_AGAIN_NOTE`: "This document changed again while the comparison was open — the newer
    version is shown above." On an edit exit no comparison was open, so that sentence would be false.
    Plan §0 D-8 says a clean exit "simply flushes (equivalent to never having edited at all)" — an
    ordinary watch update, which flashes the control and says nothing. That is what was built: a new
    flag (`pendingHeldUnderDiff`) records whether a diff was displayed at any point while the text
    was held, and the line is said only then. The diff-only path is unchanged and its seven existing
    tests are unedited. The alternatives, for the human: say the existing line anyway (false copy) ·
    write new copy for the edit case (a product-copy decision, and 4.2's hint is the natural place
    for it).
  **★ THE EXIT-ORDER FINDING — an input to 4.2, reported and not worked around.**
  `editorEnhancer.ts:124-125` leaves edit as `exitEditMode(host)` then `teardownEditorShell(host)`,
  both synchronous, inside one click handler. `exitEditMode` (`readerMode.ts:144`) writes `data-mode`;
  `teardownEditorShell` (`editorView.ts:393`) calls `endEditorSession`, which removes
  `data-edit-dirty` (`editorView.ts:276`). A MutationObserver callback is a microtask: it runs after
  both. So when `watchController.ts` learns that the host left edit, the dirty attribute is already
  gone — **an attribute READ at that point cannot tell a dirty exit from a clean one**, and 4.2's "with
  the dirty attribute present, leaving edit does NOT call `renderNow`" cannot be built as written.
  What that leaves 4.2, none of it chosen here:
  - *inside `watchController.ts`:* the observer's RECORDS still carry it — `data-edit-dirty` added to
    the filter with `attributeOldValue` would deliver the removal (old value `"true"`) in the same
    batch as the mode change. Reasoned from the DOM standard, not measured;
  - *outside 4.2's file list:* the exit order changed, or the editor leaving a literal behind before
    its teardown clears the attribute. Either touches `editorEnhancer.ts` / `editorView.ts`.
  And under any of them: at 4.2, as at 4.1, the exit has ALREADY discarded the buffer (3.2; the guard
  is 6.1). Withholding the flush on a dirty exit protects no text until 6.1 — it only keeps the
  on-disk text from replacing a reading column the user was not editing.
  **THE INTERIM STATE, stated so it is not assumed.** At 4.1 every exit reaches the controller looking
  clean. Leaving edit with unsaved text discards the buffer (3.2) and then shows the on-disk text,
  including a change that arrived while editing. 4.1 claims no dirty-exit property, and no test
  asserts one.
  **The cooldown's three structural properties (the 2026-07-21 spec-005 5.3 entry) — each whole.**
  (1) *The timer is not re-armed per change:* the widened condition returns before any timer is armed
  in `onText`, and in `flushPending` it returns before the early-fire re-arm, exactly where the diff
  condition already did; no `setTimeout` was added. (2) *The injected `now`:* untouched, and the new
  tests run on it. (3) *Two independent guards on a document switch:* `stop()` and `start()` both
  still call `cancelPending`, which now also clears the new flag.
  **Red-first.** Unit, before the change: 5 of the 10 new tests red (`expected [ 'v0', 'v1' ] to
  deeply equal [ 'v0' ]`); four of the other five are negative or exit-side claims seen red under
  their own ablation (the `data-mode` filter entry removed · the line said unconditionally · the
  callback asking about edit only · the DEFERRED-label check removed), and one — a flip with nothing
  pending renders nothing — has no ablation that reddens it alone. Real engine, both engines, the
  `data-mode` read removed: `outerRootMutations: 1`, `editorNodeConnected: false`, `mode: "reading"`,
  no live session, the typed text on screen nowhere. The positive control is in the same tests: with
  edit off, the same change through the same seam mutates the outer root.
  **Bytes.** Content script 342,384 → 342,520 B (+136) on both engines; the app chunk 517,904 →
  518,038 B (+134); no other file changed size. `progress.md`'s 4.1 record has the decomposition.
  *Revisit-when:* 4.2 (the asymmetry, the hint, and whether the edit-exit flush should say anything);
  6.1 (the unsaved-changes guard — until it lands a dirty exit loses the buffer whatever the watch
  does).

- **2026-10-05 · 012 D-5 — LANDED at task 3.3: the editor→preview debounce is the cost-proportional
  cooldown, a new instance per edit session; multiplier 1, provisional. ONE HUMAN RULING was taken in
  this task — how the preview-failure degrade's red-first is recorded.**
  Plan §0 D-5's text, quoted verbatim because `tasks.md` lands each D-value's draft with its
  implementing commit. It names a mechanism candidate and chooses no number, and it still describes
  what was built:
  "The spec explicitly forbids this plan from inventing a number (§3.5, §8-2) — but it does not forbid
  naming a MECHANISM candidate, and one already exists in this codebase solving the identical shape of
  problem: `watchController.ts`'s DECISION 3 cost-proportional cooldown (`COOLDOWN_MULTIPLIER`,
  `watchController.ts:183-191`) throttles bursty external updates and coalesces to the newest text,
  never queuing. CodeMirror's own `onChange`/update listener is a structurally identical burst source
  (keystroke-rate, not file-write-rate). **Named as the leading candidate for the debounce mechanism**
  (reuse the cost-proportional shape, a NEW instance scoped to the preview host, not a shared
  module-level one) — the actual interval/multiplier is still the gate-3 measurement's to produce (§7
  below), and a fixed-vs-adaptive choice is explicitly §8-2's own axis, not this plan's to resolve."
  [The multiplier is 1 and PROVISIONAL (gate 3's Q4): `PREVIEW_COOLDOWN_MULTIPLIER` in
  `editorView.ts`, the one place it is marked. 6.2 measures; the human rules the interval (§8-2); 6.4
  applies that ruling and REMOVES the constant.]
  ["The gate-3 measurement" is task 6.2's; gate 3 ruled only that something provisional ships until
  then. The cited `watchController.ts` range is `:182-191` at this HEAD (the constant at `:191`).]
  ["Scoped to the preview host": one instance per edit SESSION, held beside the session and cancelled
  with it — the same lifetime, since a session builds its preview host once.]
  **What 3.3 built — `createPreviewCooldown(render, now)` in `src/render/editorView.ts`.** It mirrors
  the watch's mechanism (the 2026-07-21 spec-005 5.2 and 5.3 entries) and keeps all three structural
  properties the 5.3 entry names:
  - **The timer is not re-armed per change.** `push` arms one timer aimed at `readyAt` and leaves it;
    later changes only replace the single pending slot. `flush` re-checks the clock and re-arms for a
    remainder only. Ablated to a re-arming timer, three unit tests red — among them a stream that never
    goes quiet rendering once where it must render at least five times.
  - **The `now` clock is injected**, so "a 10 ms render waits 10 ms, a 400 ms render waits 400 ms" is
    exact, measured from when the render FINISHED.
  - **Discarding a pending render has two independent guards**, and each hides the other: ending a
    session cancels its cooldown, timer and all; and at fire time the feed renders only while its own
    session is still the host's live one. Each is asserted on its own in the unit suite — the first by
    the pending timer's own handle being cleared, the second by an outer re-mount (which runs no
    teardown) followed by a fresh shell. With both removed, the text an exit discarded appears in the
    NEXT session's preview, on both engines. (`renderPreview`'s own live-shell check, from 2.2, is a
    third layer: it is why a render into a torn-down shell cannot be produced at all.)
  **Stated so they are not assumed:** the first render is immediate, and the render at BUILD is neither
  timed nor "the first" — the first keystroke renders at once, synchronously, inside that keystroke.
  `watchController.ts` is not imported, not edited, and has no helper to extract (its cooldown is
  closure state interleaved with the diff deferral, snapshot capture and the update signal — group 4
  owns that file). The feed is the last line of 3.2's one update listener; `editorEngine.ts` is
  untouched. The cooldown is handed the editor's document, which is read only when it is rendered.
  **★ HUMAN RULING, 2026-10-05 — the degrade's red-first: RECORD BOTH REDS.** `tasks.md` 3.3's Verify
  line says "reverted (let the throw propagate) → the editor or the buffer is lost". That is false in
  mechanism, and was measured, not argued. `mount()` degrades every failure in its own pipeline to its
  banner and raw source — in the host it was handed, the NESTED one — so the reader's failure state
  appears in the preview pane with no code in `editorView.ts` involved. With a throw forced OUT of
  `mount()` and the feed's `try/catch` removed, on both engines: the editor is the same connected node,
  the buffer is byte-identical, typing continues, the preview recovers. CodeMirror runs every update
  listener inside its own `try/catch` (`@codemirror/view` 6.43.13, `dist/index.js:8074`), and a
  timer's throw unwinds nothing. The options put to the human: record both reds · the literal revert
  only · drop the feed's guard · stop for a `tasks.md` redline. Ruled: the first. So:
  - *the literal revert* (the guard removed) reds in its TRUE units — `a preview failure reached the
    page as an error: expected [ …(24) ] to deeply equal []`, both engines; nothing is lost;
  - *the revert that does lose the editor* — a failed feed render handled the way the BUILD render is
    (`teardownEditorShell`, rethrow) — reds `the editor node was lost: expected false to be true`,
    both engines.
  `tasks.md`'s Verify text is left as written; its post-landing note carries the correction. The feed
  keeps its guard: a throw that leaves `mount()` is logged (`[peekover] preview render failed`) and
  the feed carries on — unlike the render at build, it never tears the shell down.
  **Forcing a failure needed no production seam.** The tests override `replaceChildren` on the nested
  shadow root: throwing for the rendered column only is a failure `mount()` handles itself; throwing
  for the fallback too is one that leaves it.
  **Three findings reported with this task, none ruled, none fixed** (`progress.md` § Carried items):
  - **P-1 · the reader's enhancers do not run in the preview.** A mermaid fence is the raw
    `<pre><code class="language-mermaid">`, `$x^2$` is the literal text in its un-enhanced
    `code.peekover-math-inline`, and a code fence is unwrapped and un-highlighted — at build and after
    typing, both engines — where the outer document has the figure with its SVG, the `<math>` element
    and the highlighted fence. The reason: the enhancers are called at the two app-page call sites with
    the OUTER host only; `renderPreview` calls `mount()` and nothing else; and a query on the outer
    root does not cross into the nested shadow root. Preview fidelity against the reader is the
    human's to rule, before 7.1.
  - **P-2 · the first key after a pause pays one whole render inside its own keystroke.** "The first
    render is immediate" means synchronous: on a 212,682-byte document that key's dispatch took 217.7
    ms (Chromium) / 205.0 ms (Firefox) in the harness; the keys behind it landed in 2.3 / 4.0 ms. On a
    small document every key renders (13 keys, 13 renders) because the cooldown is shorter than the
    gap between keys. This is the watch's shape, as ruled for Q4; whether it suits typing is §8-2's.
  - **P-3 · under a driven burst the engines differ by ~50×:** 512 keys cost 4 feed renders on
    Chromium and 193 on Firefox (Chromium runs queued input ahead of the timer). Human typing speed
    was not measured. For 6.2.
  **Bytes, ablated, both engines identical:** +535 B, all of it in the app chunk (517,369 → 517,904).
  The feed without the cooldown (the listener calling the guarded render directly) is +114 B; putting
  the cooldown between them is the other +421 B. Residual 0 — a path decomposition, exact by
  construction; the second path (the cooldown built and cancelled but never fed, +525 B; the `push`
  call, +10 B) is where a shared piece would have shown. The content script is md5-identical in every
  arm, and MOVED (+388 B) when the content-script entry was made to call the cooldown — the
  instrument fires.
  **Revisit-when:** 6.2's numbers and the §8-2 ruling (6.4 then removes the constant); the human's
  ruling on P-1; group 4, which makes the WATCHED document reach this code for the first time.

- **2026-10-05 · M12 TASK 3.2 — informal eyeball DEFERRED to 7.1 (human ruling).**
  **★ The ruling.** The informal fidelity eyeball owed at task 3.2 — the first cheap human glance at
  the editor's real output — is DEFERRED by the human to the M12 milestone-close walk (task 7.1), to be
  done once, at the end. Meanwhile as many of its checks as a real engine can answer are automated.
  **★ This DEPARTS from two written rules, stated plainly.** WORKFLOW §7.2: "the first cheap human
  glance at a new rendering surface's real output happens as soon as that surface first renders, not at
  the fork's own close". `tasks.md` 3.2: "THE INFORMAL EYEBALL IS OWED AT THIS TASK … not deferred to
  7.1". Both say the opposite of what was ruled. Neither text is edited: the rule stands for the next
  surface, and this entry is the exception of record for this one.
  **★ The risk taken.** The rule exists because of M11 (`retro.md` 2026-09-11): three defects were
  caught only by eye, none by a suite that was green throughout. Deferring means anything only an eye
  catches is found after groups 3.3–6 have built on the editor — the live preview, the watch/edit
  collision, save-back, the unsaved guard — so a late find costs rework on more code than it would
  today. The proxies below shrink that exposure; they do not remove it.
  **★ The compensating proxies** — `tests/browser/editorEyeballProxy.browser.test.ts`, test-only, zero
  production diff, Chromium AND Firefox in the vitest harness page, every fixture asserting it is
  unwatched. Bar stated before measuring: WCAG 2.1 AA, text 4.5:1, non-text UI 3:1; light is the
  control arm. Method: 007's contrast sweep (`diagramTheme.browser.test.ts` — computed colour, WCAG
  relative luminance, the background found by walking the ancestors across the shadow boundary),
  extended to composite translucent layers source-over in sRGB down to the first opaque ancestor, with
  CodeMirror's selection layer (a sibling of the text, not an ancestor) inserted by hand and a
  gradient measured at its worst stop. Results — identical on both engines in every row:
  1. *Contrast of CodeMirror's own surfaces* — 27 pairs per theme. **Clear on both themes:** body text
     15.74 light / 13.61 dark; text on the active-line band 15.43 / 6.18; the drawn caret 15.43 / 6.18;
     search-panel label, field text, button and close 14.94–21 (the panel stays a light slab on dark);
     plain search-match text 15.75 / 4.85; the selected completion 4.63. **Below the bar on DARK only
     (light passes — the dark theme's own defects):** selected text on the selection **1.16:1**
     focused / **1.14:1** unfocused (light ink on CodeMirror's light selection); the current search
     match's text **1.52:1**; an unselected autocomplete option **1.09:1** (light ink inherited onto
     the tooltip's `#f5f5f5`). **Below the bar on BOTH (not theme defects):** gutter line numbers 2.38
     light / 3.26 dark — `--faint`, 3.2's own rule; the active line number 2.36 / 4.34. **Non-text
     pairs under 3:1:** the active-line band against the pane 1.02 / 2.2; the gutter rule 1.11 / 1.13;
     the search field's border 1.67 and fill 1.09 against its panel (both themes); and, on light only,
     the selection 1.27 / 1.24, the search panel 1.04 and the tooltip 1.04 (border 1.69) against the
     pane. Every surface opened in the harness, including Ctrl-F by a real keypress and the tooltip by
     typing `<`.
  2. *Collisions at the top-right* — 414×896 and 1400×900, rail open and collapsed, reading then edit.
     The edit control, the mode pill and the TOC handle are pairwise disjoint and each is hit at its
     own centre, in every case; the control never reaches the rail's list; with the rail OPEN the
     split pane ends 32 px (wide) / 124.7 px (narrow) left of the rail. **ONE OVERLAP FOUND — the
     proxy's stop condition:** in edit with the rail COLLAPSED the TOC handle covers the split pane's
     top-right corner by **103×26 px**, at both viewports, on both engines (handle at 52–82 px; the
     pane starts at 56 px and reserves the rail's width only while it is open).
     **★ Second human ruling, same day, on that stop:** PIN it as a known finding. The test keeps
     every other relation asserted, keeps this one relation in this one state out of its violations,
     and asserts it is still present — so the fixing commit must delete the pin. Not fixed here.
     *Read differently from the kickoff, flagged:* "the control against the rail" is asserted against
     the rail's handle and list, not its box — the rail's top padding exists so pills sit over it, and
     the mode pill has always been inside that box (56.5×30 px, the precedent; the control 35–104×30).
     *Reported, not asserted:* at 414 px with the rail open the split pane is 100 px wide.
  3. *GFM and R1's dialect, as drawn.* Task marker `[ ]` / `[x]` coloured `#221199`; table header
     cells bold + underlined, every `|` and the delimiter row `#404740`; `~~struck~~` line-through on
     text and marks. **R1's cost, measured not judged:** `H~2~O` and `x^2^` style ONLY the two marks
     (`#404740`) — the enclosed character gets no span; `:smile:` is coloured `#aa1111`. A heading
     fires the instrument, a plain line is silent. **Found on the way (outside the kickoff's list of
     surfaces):** those highlight colours are CodeMirror's light-page defaults and on the dark pane
     read **1.69:1** (every markup mark), **1.24:1** (the task marker), **2.15:1** (the emoji) — on
     light 8.44 / 11.52 / 6.62.
  4. *The Ctrl/Cmd+S hazard — CONFIRMED as 3.2 read it, on both engines.* With `main.ts`'s listener
     installed and focus inside CodeMirror's content, a real Ctrl+S is `preventDefault`ed once (the
     guard does not engage: the key reaches `document` retargeted to the host; a light-DOM input, the
     control arm, is guarded). With `lastExportFormat` `'html'` it downloads an HTML export of the
     ON-DISK document — the unsaved buffer text is not in it, nor any editor markup — and the editor
     stays open with its buffer intact. With `null` nothing is exported and nothing else happens: the
     native dialog is suppressed and the key does nothing. (`null` is not a state a fresh install or
     the store produces — M-1's default is `'html'` — it was set through the seam because the kickoff
     asked.) Nothing is asserted about what it should do: that is 5.x's ruling.
  **★ What cannot be proxied.** The overall aesthetic; whether the type and spacing read comfortably;
  whether a light search panel or tooltip on a dark pane is acceptable when its contrast number
  passes; the feel of typing, selecting and the caret; and the loaded extension itself — the harness
  page is not `app.html` under the extension's CSP, and Firefox cannot load the extension under
  automation at all.
  **Revisit-when:** any proxy finding is routed for a fix (the pin goes with the overlap's fix); or
  7.1, where the deferred eyeball is walked and every finding above gets a verdict.

- **2026-10-05 · M12 TASK 3.2 — three HUMAN RULINGS taken in this task's kickoff: R1 (GFM highlighting),
  R2 (the engine memo key), R3 (the mode pill during edit). Banked here; each landed in 3.2's commit.**
  **★ R1 — `createView` builds `markdown({ base: markdownLanguage })`.** This AMENDS "called with its
  defaults" in the M12 TASK 1.1 EXTENDED entry (below) for `base` ALONE: `addKeymap`, `completeHTMLTags`
  and `pasteURLAsLink` are not named in the config object and stay at the package's defaults. It answers
  the question 3.1 left with the human (012 D-2's first finding). `markdownLanguage` comes from
  `@codemirror/lang-markdown` — the same permitted specifier, destructured at the same `import()`; the
  fence's clause C is unmoved at exactly two dynamic edges.
  *Authorized ripple:* `src/render/editorEngine.ts` and `editorEngine.test.ts`. The ONE existing
  assertion this task changed is the recording fake's pin on `markdown`'s arguments — `toEqual([])` became
  `toEqual([{ base: 'MARKDOWN_LANGUAGE' }])` — because the ruling changes the behaviour it pins.
  *Evidence, now a committed test (3.1's risk-6 measurement re-run):* on one GFM document through each
  language's own parser, `markdownLanguage`'s tree has `Task`, `TaskMarker`, `Table`, `TableHeader`,
  `TableRow` and `Strikethrough`; `commonmarkLanguage`'s — the replaced default — has none of them, and
  both have `Document` / `BulletList` / `ListItem` / `Paragraph` (so the walk saw the document). A third
  test reads the syntax tree out of the VIEW the engine builds (through the language's own state field —
  no further CodeMirror package is imported even in the test) and finds the GFM nodes there, and not in
  a control view built on bare `markdown()`. **Footnotes are still syntax under NEITHER base** —
  asserted, stated, not fixed (`@lezer/markdown` ships no footnote extension).
  *Byte arm, ablated, both engines:* **+65 B**, all of it in the app chunk (517,304 → 517,369 B). The
  three lazy chunks are byte-for-byte the same size under either base — `lang-markdown`'s chunk already
  carries `markdownLanguage`, which `markdown()` references internally.
  **★ R2 — the engine load is keyed on the OUTER reader host.** `enhanceEditor` hands
  `loadEditorEngine` the document host it was called with, so edit → reading → edit reuses one load.
  This closes the question 012 D-2 left open ("which element 3.2 passes"). Proven with a spy on the
  module loader: one call across two edit sessions on one host, a second call for a second host (the
  control) — unit, and on both engines with the real engine.
  **★ R3 — the mode pill is HIDDEN while `data-mode="edit"`, and the edit control is the exit.** Its
  label and accessible name change to say so ("Edit" / "Edit this document" at rest; "Stop editing" /
  "Stop editing and return to the document" while editing), and activating it runs `exitEditMode` +
  `teardownEditorShell`. This closes the pill bypass carried from 2.1 / 2.2 (the pill left edit through
  `toggleReaderMode` with no teardown, leaving the shell in the DOM, hidden). The hide rule is one line
  in `EDITOR_CSS` — the sheet that exists only while an edit view does — so `READER_CSS` gains no
  `:host` site and `htmlExport.test.ts`'s 26-site pin is unmoved. 2.2's own bypass test still passes
  unedited: it drives the pill with `.click()`, which a hidden button still honours, and it never goes
  through the enhancer.
  **Revisit-when:** the 7.1 walk finds GFM highlighting or the exit wording wrong in real use; a later
  task wants a footnote grammar (a new dependency — a stop-and-ask).

- **2026-10-05 · 012 D-3 — LANDED at task 3.2: save-back is an INJECTED capability from `appShell.ts`;
  editor mounting rides the two app-page post-mount call sites. No human ruling was needed for the
  mechanism — F-5 left it to the task under D-3's fixed constraint.**
  Plan §0 D-3's draft entry text, quoted because `tasks.md` lands each D-value's draft with its
  implementing commit — **SUPERSEDED IN MECHANISM, not current:**
  "012 D-3 — `enhanceEditor`-shaped mounting rides the same two call sites
  007/011 established, but the handle the save action needs is passed IN from `appShell.ts` as an injected
  dependency (the `WatchControllerOptions.render`/`signal`/`now` precedent, `watchController.ts:268-280`),
  never imported or reached for by an enhancer module — keeping every render-pipeline module capability-free
  exactly as `diagramEnhancer.ts`/`mathEnhancer.ts` already are."
  Its two-call-sites clause and its conclusion stand. What is superseded is "the handle … is passed IN":
  **no handle crosses the boundary — a FUNCTION does.** (The plan's own body already says "a save
  callback closing over `activeFile`'s own `handle`"; the one-line draft compressed that into the wrong
  noun.) The cited precedent is at `watchController.ts:254-280` at this HEAD (`render` `:269`, `signal`
  `:271`, `now` `:279`).
  **What 3.2 built (F-5's resolution — two app files plus the editor modules, nothing else):**
  - **The type.** `EditorSave = (text: string) => Promise<EditorSaveOutcome>`, `EditorSaveOutcome =
    { ok: true } | { ok: false; reason: string }` — declared in `editorView.ts`, re-exported from
    `editorEnhancer.ts`. A function type; it names no handle.
  - **The capability is built in `mountAppShell`** (`appShell.ts:676`, `saveActiveDocument`), inside the
    closure where `activeFile` lives (`:715`) — so 5.3 writes its body there and nothing below it changes.
    **At 3.2 the body is PLUMBING ONLY:** it resolves `{ ok: false, reason: 'Saving is not yet
    available.' }` and does nothing else — no write, no `requestPermission`, nothing on disk, no download.
  - **F-5's first shape problem** (`createReaderPane(doc)` had no options): it gains an optional second
    parameter, `ReaderPaneOptions { save?: EditorSave }`, default `{}`. Every existing caller — every test
    that builds a bare pane — is unchanged. `readerPane.ts` passes the function to `enhanceEditor` and
    neither calls it nor looks inside it.
  - **F-5's second shape problem** (`renderWithEnhancements` is module-level; `activeFile` is closure
    state): the module-level const becomes a function OF `save` that returns the render —
    `renderWithEnhancements(save): RenderFn` — and `mountAppShell` makes the one instance it hands the
    watch controller (`renderEnhanced`, `:677`, used at `:1366`). The body is the same list in the same
    order, with `enhanceEditor(target, { save })` LISTED immediately after `enhanceMath`, as at
    `readerPane.ts:213`. Never composed into a shared seam.
  - **Where it ends up:** `enhanceEditor(host, { save })` → `buildEditor(engine, host, { save })` → the
    edit session (`EditorSession.save`). **Nothing calls it at this task** — the save control is 5.3's.
  **Pinned:** read from source, neither `readerPane.ts` nor any `src/render/editor*.ts` contains the
  handle type's name (a firing control finds it in `folderSource.ts`); `enhanceEditor` sits between
  `enhanceMath` and `enhanceTables` at both sites; a pane created with a `save` threads it into the
  session by identity; the real `mountAppShell`'s injected save resolves "not yet available".
  **Bytes, ablated:** the shell-side plumbing alone (both `enhanceEditor` lines removed) is +104 B on the
  app chunk; the content script is md5-identical in every arm.
  **Revisit-when:** 5.3 (the body, behind 5.1's ledger sign-off) — if the write needs more than the
  buffer text (the conflict compare needs `originalText`), `EditorSave`'s signature widens there.

- **2026-10-05 · 012 D-1 — the CONTROL half LANDED at task 3.2** (the `ReaderMode` half landed at 2.1,
  entry below, whose quoted draft text covers both). A short note on what was built on it:
  `src/render/editorEnhancer.ts`'s `enhanceEditor` installs one real `<button>`
  (`.peekover-edit-toggle`) in the app-page host's shadow root, directly after the mode pill, and
  re-installs it after every outer `mount()` (both call sites run it post-mount; it is idempotent). It
  calls 2.1's `enterEditMode(host, { loader, build })` — load, THEN build, THEN flip — with
  `loader = () => loadEditorEngine(host)` (R2) and `build` = `editorView.ts`'s new `buildEditor`, which
  builds 2.2's shell and the engine's view in its source slot, seeded from the host's registered source.
  The bare `\` key and the pill stay binary reading ↔ raw, as ruled; the pill is hidden in edit (R3,
  above). Nothing is installed on a render-failure fallback (no `data-mode`) or on the content-script
  reader, which never imports this module (`editorImportFence.test.ts`, clause A).
  **Its stylesheet home** — the choice this task's kickoff asked to be re-derived: a new
  `EDIT_CONTROL_CSS` export in `readerCss.ts`, injected by the enhancer as its own `<style>` beside the
  control (the `mathCss` / `ensureMathStyle` precedent). Not `EDITOR_CSS` (present only during edit; the
  control is at rest in reading), not `READER_CSS` or `CONTAINED_CSS` (both ship to the content script).
  It has no `:host` selector. **Measured: the content script is md5-identical to 3.1's on both engines**
  — `tasks.md`'s Verify line holds, and its standing-invariants allowance for "a CSS touch in 3.2" was
  not needed.
  **Choices made here that no ruling covers — for the human's eye at this task's informal glance:**
  (i) the wording — "Edit", "Stop editing", "Editor unavailable"; (ii) the placement — on the pill's
  row, to its left (`right:116px`), not moving in edit; (iii) five token-only rules in `EDITOR_CSS` that
  make CodeMirror's view fill its pane, inherit the pane's mono face, and put its gutter, caret and
  cursor on the reader's tokens (its defaults are a light-grey gutter and a black caret — invisible on
  the dark theme's pane). The active-line band, the selection, the search panel and the completion
  tooltip are LEFT at CodeMirror's light-page defaults — a 7.1 design-walk item, not decided here.
  **Revisit-when:** the eyeball / 7.1 walk; the carried "unify the two keyboard shortcuts on one host
  registry" item (the `\` guard's proof moves to the app-page shape then).

- **2026-10-05 · 012 D-10 — LANDED at task 3.1: the content-script exclusion is proven by
  `src/render/editorImportFence.test.ts`. The decision of record is "M12 GATE 3" Q1 (below); this entry
  records what was built on it.**
  Plan §0 D-10's draft text, quoted because `tasks.md` lands each D-value's draft with its implementing
  commit — **SUPERSEDED IN MECHANISM, not current:**
  "Spec §3.2's own reasoning (no `FileSystemFileHandle` ever reaches the content-script graph;
  `editorEngine.ts`'s specifier would need `web_accessible_resources`, which `tests/manifest.test.ts`
  forbids outright) is re-confirmed, not re-argued. **Checked concretely:**
  `scripts/check-dynamic-imports.ts`'s `MUST_NOT_FIRE` fixture (the same mechanism that already polices
  `katex`/`mermaid`/`temml` staying out of the content-script module graph) gains `codemirror` and
  `@codemirror/lang-markdown` to its forbidden-specifier list — a task-1.1-adjacent, mechanical addition,
  named here so tasks.md does not have to rediscover which file owns this check."
  Its first sentence stands. Its "checked concretely" sentence is false in mechanism (`tasks.md` F-1):
  `MUST_NOT_FIRE` is the scanner's stay-SILENT self-test, there is no forbidden-specifier list, and that
  script polices specifier STATICNESS, not the content-script graph.
  **What is built, per M12 GATE 3 Q1:**
  - **The two stay-silent fixtures** landed at task 1.1 (`e001f9e`) — they document the editor's lazy
    shape and prove nothing about exclusion. Self-test today: 7 firing + 10 silent, EXIT=0.
  - **The fence, this task.** Four clauses on `diagramImportFence.test.ts`'s shape, 8 assertions.
    **A** — the content-script graph reaches no `src/render/editor*.ts` module (matched by name, so a
    later editor module is covered without an edit) and imports no `codemirror` / `@codemirror/*`
    specifier. **B** — the control: the same walker started at `editorEngine.ts` finds both specifiers.
    **C** — over every shipped `.ts` file under `src/` and `entrypoints/` (tests and `.d.ts` excluded),
    the only CodeMirror imports are two DYNAMIC edges in `editorEngine.ts`; no static specifier, type-only
    included. **D** — non-vacuity: landmarks present, every local specifier resolved, the tree scan saw
    the editor modules.
  - **Seen red** before the module existed (4 of 8 failing: B, both C assertions, and D's tree-scan
    landmark). The pattern's own ablation is 007 task 3.4's and 009 task 4.5's standing precedent.
  **Two things stated so they are not assumed:** (i) clause B is the engine's OWN edge, not the app-page
  graph — nothing imports the engine until 3.2. **3.2 owes the app-page half** (the app graph reaching
  `editorEngine.ts`), which means an edit to this test file that 3.2's Files list does not name: a
  necessary ripple to enumerate in 3.2's kickoff. (ii) Clause C scans the shipped tree, not the union of
  the two entry graphs as 007 does — with no caller, a union scan would pass on nothing.
  **The byte side, measured:** with the engine added and unreached, every shipped file is md5-identical
  to 2.2's build on both engines; under a scratch app-page caller the content script's md5 is unchanged.
  **No human ruling was taken during this task.**
  **Revisit-when:** 3.2 wires the caller (clause B's app-page half); any later task that wants a third
  CodeMirror specifier — clause C reds, and that is a stop-and-ask, not a count to bump.

- **2026-10-05 · 012 D-2 — `src/render/editorEngine.ts` is the ONE module importing CodeMirror. Landed
  with task 3.1 (plan §0 D-2's draft entry text, verbatim):**
  "012 D-2 — one engine module, static-literal specifiers, on 007 D-13's /
  011 D-2's own single-importer fence, extended to CodeMirror. No feature-detect gate is needed the way
  diagrams/math need one — entering edit mode IS the trigger, unconditionally — so the gate is `loaded once
  per host`, not `loaded if content present`."
  [The permitted set is exactly TWO dynamic specifiers, `codemirror` and `@codemirror/lang-markdown`, both
  inside `loadCodeMirror` — where 007's fence pins one. There is no third specifier and no static one:
  `EditorView` comes through the `codemirror` meta-package's own re-export (`dist/index.d.ts:2`), and
  every type the module names is INFERRED from the two dynamic edges (`Awaited<ReturnType<typeof
  loadCodeMirror>>`), so there is no `import type` and no `typeof import(…)` either. 009 met a type-only
  import in its engine and permitted it by name; this engine needed none, so the fence permits none.]
  [The setup is `basicSetup` + `markdown()` with NO argument — the two rulings below (M12 TASK 1.1, M12
  TASK 1.1 EXTENDED), unmodified. The engine adds no extension of its own.]
  [The surface, all of it: `loadCodeMirror` (the default module loader — the two imports) ·
  `loadEditorEngine(host, loader = loadCodeMirror): Promise<EditorEngine>` (the memoized gate; a caller
  hands 2.1's seam `{ loader: () => loadEditorEngine(el) }`) · `EditorEngine` = `{ EditorView,
  createView(parent, doc, extra?) }` · the types `EditorModules`, `EditorModuleLoader`,
  `EditorViewHandle`, `EditorExtension`. `createView`'s optional `extra` is the caller's own wiring (3.2's
  dirty tracking and 3.3's preview both need an update listener, which CodeMirror takes only as an
  extension); it is appended after the ruled pair and cannot replace it. `EditorView` is exposed so a
  caller reaches `EditorView.updateListener` without importing anything.]
  [★ THE MEMO KEY — moved from the plan's text, and OPEN for 3.2. The plan keys the memo on "the
  editor's own nested host". The engine keys on whatever `HTMLElement` it is handed and does not choose.
  Two facts from the tree make "the nested host" unavailable as written: `enterEditMode` loads, THEN
  builds (2.1), so the nested host — created by `build` — does not exist when the loader runs; and
  `teardownEditorShell` discards it on exit (2.2), so it would not be the same element on re-entry
  anyway. Keyed on the OUTER host the memo spans edit → reading → edit as `tasks.md` intends; keyed on a
  per-session element it holds only within a session. Which element 3.2 passes is a question for its
  kickoff, not settled here. Unverified and not claimed: that a second host's fresh `import()` costs no
  re-fetch (the browser's module map should answer it; jsdom cannot show it — a 3.2 real-engine item).]
  [Rejection: a rejected load is evicted as it settles. Every caller already waiting on that promise
  sees the rejection; the next call starts a new load and runs the loader again. A loader that throws
  synchronously is a rejection too. So 3.2's degrade path may simply ask again — nothing remembers the
  failure. Not verified: whether the BROWSER retries a failed chunk fetch on a repeated `import()` of the
  same specifier; that is engine behaviour, 3.2's to observe.]
  **Two findings reported with this task, neither ruled, neither configured around:**
  - **Plan §4 risk 6 — `markdown()`'s defaults are strict CommonMark; GFM is NOT recognised.**
    `@codemirror/lang-markdown` 6.5.2 `dist/index.js:407` defaults `base` to `commonmarkLanguage`;
    `markdownLanguage` (`:63-74`) is the one configured with `[GFM, Subscript, Superscript, Emoji]`, and
    `@lezer/markdown` 1.7.2's `GFM` is `[Table, TaskList, Strikethrough, Autolink]`. Measured on one
    document through both: the default tree has none of `Task`, `TaskMarker`, `Table*`, `Strikethrough`,
    `URL`; `{ base: markdownLanguage }` has all of them. **Footnotes are recognised by NEITHER** —
    `@lezer/markdown` ships no footnote extension. The effect is the editor's syntax highlighting (and
    table folding) only: the preview renders through markdown-it regardless, and the ruled Enter /
    Backspace keymap is live under the default base (its `isActiveAt` checks share one language-data
    facet across both languages; Enter on `- [ ] todo` continues `- [ ] ` in both arms, measured). The
    one-option remedy, `markdown({ base: markdownLanguage })`, MODIFIES a ruled default — the human's to
    rule, not this task's.
  - **Plan D-7's open note — line endings do NOT survive the editor; the trailing newline does.**
    Seeded into a view and read back (`state.doc.toString()` and `state.sliceDoc()` agree; the state's
    line break is `\n`): `a\nb\n` → identical · `a\nb` → identical · `a\r\nb\r\n` → `a\nb\n` ·
    `a\r\nb` → `a\nb` · `a\r\nb\nc\rd\r\n` → `a\nb\nc\nd\n` · `a\rb` → `a\nb` · empty → empty. Text
    inserted later is normalized the same way. So a CRLF file's buffer differs from its on-disk text in
    every line ending before the user types anything — which is why `originalText` never passes through
    the editor, and what 3.2's dirty comparison and 5.2 / 5.3's compare-and-write must be written against
    (a naive buffer ≠ `originalText` test marks every CRLF file dirty on entry; a naive write converts it
    to LF). Pinned in `editorEngine.test.ts`.
  **No human ruling was taken during this task.**
  **Revisit-when:** 3.2's kickoff (the memo key; the dirty comparison on a CRLF file); 5.2 / 5.3 (what a
  save writes for a CRLF file); the human's answer on GFM highlighting.

- **2026-10-04 · 012 D-4 — LANDED at task 2.2: the live preview is `mount()` on a nested host, called
  with the additive `chrome: false` option. The decision of record is the "M12 D-4 RE-RULED" entry below;
  this entry records what was built on it.**
  Plan §0 D-4's draft entry text, quoted because `tasks.md` lands each D-value's draft with its
  implementing commit — **SUPERSEDED IN MECHANISM, not current:**
  "012 D-4 — `mount()`'s own `shadow.replaceChildren(...)` contract (`mount.ts:218`) rebuilds a host's
  ENTIRE shadow root on every call, chrome included; calling `mount()` on the document's own host for
  live-preview purposes would destroy the editor's own DOM (and every other piece of mount-composed
  chrome) on every debounced keystroke. The preview pane is therefore `mount()` called on a FRESH child
  host, created once when edit mode begins and torn down when it ends — `mount.ts` itself stays
  byte-untouched (006 D-15, re-affirmed every milestone since, unbroken here)."
  Its first sentence and the nested-host conclusion stand. Its last clause — "`mount.ts` itself stays
  byte-untouched" — was falsified by the chrome investigation and re-ruled; `mount.ts` gained one
  additive option here, exactly as M12 D-4 RE-RULED authorizes.
  **What 2.2 built:**
  - **The option.** `MountOptions.chrome?: boolean`, default `true`. `git diff src/render/mount.ts` is
    the field, its doc comment and the guard: one `const chrome = options.chrome !== false`, an
    `if (chrome)` on each of the five chrome pushes, `chrome &&` on the remote-load condition, and the
    rail built as `chrome ? buildTocView(…) : null`. The ruled range was unmoved (`:157-201`,
    `:209-210` at `f9e6439`). `sanitize(parse())` → inert `<template>` → `applyMediaPolicy` → adopt is
    untouched and not duplicated. An omitted field and `true` commit the same serialised root.
  - **The shell.** `src/render/editorView.ts` — `buildEditorShell` / `renderPreview` /
    `teardownEditorShell` / `editorShellFor`. Build appends, once, a `<style>` and one grid container
    holding a source slot and a preview pane; the preview pane holds the nested host. It plugs into
    2.1's `enterEditMode` as `build`; teardown is called beside `exitEditMode` and removes exactly what
    build added. `renderPreview` is the one place the preview `mount()` call is written.
  - **The scroll choice: a wrapper, not the nested host.** The nested host sits inside the preview pane
    (`.peekover-editor__preview`, `overflow:auto`, definite height), so `resolveScrollContainer(nested,
    true)` finds it by its computed overflow. Making the nested host itself scroll was rejected: it
    would be reached only through `resolveScrollContainer`'s fallback, which is the same answer a
    failed resolution gives.
  - **Where the CSS lives: a new `EDITOR_CSS` export in `readerCss.ts`,** injected by the shell as its
    own `<style>` and removed with it. Not in `READER_CSS` (its `:host([data-mode="edit"])` gates would
    move `htmlExport.test.ts`'s 26-site pin — 2.1's finding) and not in `CONTAINED_CSS` (which ships to
    the content script). Measured: it contributes 0 B to every built file today, the shell having no
    production caller until 3.2.
  - **Post-commit wiring (`mount.ts:238-252` after the edit; `:219-233` as ruled), on the nested host —
    all harmless, none guarded:** `registerReaderSource` stores the preview text under the nested
    host's own key; `setReaderMode` writes `data-mode="reading"` to the nested host and finds no pill to
    relabel; `removeAttribute('data-diff')` is a no-op; both shortcut installers are once-guarded and
    already installed; with no rail composed, `unregisterTocHost(nested)` runs — which is what keeps
    the preview out of the TOC registry; `initReaderRuntime` registers the nested host as a themed host
    and writes `data-theme`, which is NEEDED (the nested root carries its own token block, so without it
    the preview would stay light under a dark theme). No outer-host registry entry is touched: a nested
    render makes zero attribute writes to the outer host.
  **Two things the human should see, neither ruled:** (i) the shell's height is a definite `60vh` where
  the mockup has `min-height:60vh` — a minimum-height pane never scrolls, and the scroll box has to be
  real; its margin is the reading column's own padding so it clears the corner chrome and the open TOC
  rail. Both are 7.1 design-walk items. (ii) After a pill bypass (the mode pill leaves edit through
  `toggleReaderMode`, with no teardown) the shell stays in the DOM, hidden by `EDITOR_CSS`, and a
  re-entry reuses it — a carry for 3.2, which owns the pill's behaviour in edit.
  **No human ruling was taken during this task.** D-4's cost is measured at 6.3.
  **Revisit-when:** 6.3's measurement; 3.2, for the pill bypass.

- **2026-10-04 · 012 D-1 — `ReaderMode` extends to a third literal, `'edit'`, not a sibling flag. Landed
  with task 2.1 (plan §0 D-1's draft entry text, verbatim):**
  "012 D-1 — edit rides `readerMode.ts`'s own carried-mode machinery as a third
  `ReaderMode` value, not a parallel boolean, because `mount.ts`'s `preserveReading`/`CarriedReading.mode`
  restore path (mount.ts:70-77, 216, 223) and `watchController.ts`'s attribute-gated deferral (below, D-8)
  both already key off the ONE `data-mode` attribute; a sibling flag would be a second source of truth for
  the same question."
  [Task 2.1 implements D-1's `ReaderMode` half — the type, the async `enterEditMode` (which takes its
  engine as an injected `{ loader }` and an optional `build` step, where the plan's draft signature was
  `enterEditMode(host)`), and `exitEditMode`. D-1's other half, the dedicated edit-entry control, lands at
  task 3.2. Citations re-derived at `c173d4e`: `mount.ts:70-77`, `:216` and `:223` are unmoved. One thing
  the quoted text does not say, stated so it is not assumed: `mount()`'s restore path does type-check
  against the widened union with `mount.ts` byte-untouched, but `'edit'` is not RESTORED across a
  `preserveReading` re-render — `replaceChildren` has dropped the editor by then, so
  `setReaderMode(host, 'edit')` lands in `'reading'` rather than leaving both views hidden with nothing
  in their place. D-8 (group 4) is what stops that re-render happening during an edit session.]
  [★ HUMAN RULING, task 2.1, 2026-10-04 — the `\` guard is DEFENSE-IN-DEPTH. Re-deriving F-2 found the
  hazard cannot fire today on the surface edit mode runs on: `installToggleShortcut` resolves its host
  with `document.querySelector('peekover-root')` (`readerMode.ts`), and the app-page reader host is a
  plain `<div>` (`readerPane.ts:167-168`), so `\` is already inert there (the 2026-07-17 CARRIED
  HARDENING entry). The guard ships anyway, and its real-engine red-first and positive control run on
  the `peekover-root` shape, where the listener is live; the app-page-shape case in
  `editMode.browser.test.ts` is a pin that passes with or without the guard. Rejected: unifying the
  shortcuts on a host registry now (a shipped-behaviour change beyond 2.1), and shipping no guard
  (departs from 2.1's Verify line and group 2's acceptance). **Revisit-when:** the carried "unify the two
  keyboard shortcuts on ONE host registry" item is taken up — the guard becomes load-bearing then, and
  its proof should move to the app-page shape.]
  [★ HUMAN RULING, task 2.1, 2026-10-04 — the edit visibility CSS adds NO new `:host` rule site. A
  separate `:host([data-mode="edit"])` rule moved `htmlExport.test.ts`'s pin of READER_CSS's `:host`
  rule sites from 26 to 27 (the rule was correctly DROPPED by the export translation; export output
  was unchanged). Ruled: fold `'edit'` into the two existing `data-mode` rules as a second selector on
  each — the count stays 26, no existing assertion is edited, no file outside 2.1's list changes.
  Rejected: moving the pin to 27.]

- **2026-10-04 · M12 TASK 1.1 EXTENDED — `markdown()`'s default keymap ships AS-IS; §6's deferred
  "smart lists/continuation" is a PEEKOVER-BUILT deferral, the same reading as find/replace and lint.
  Human-ruled, extending Option A.** Doc-only: this entry closes the item the M12 TASK 1.1 entry (two
  below) surfaced as "SAME CLASS, NOT COVERED BY THIS RULING" and left owed before task 3.1. That entry is
  not reworded; this one sits beside it.
  **★ THE RULING:** `markdown()` from `@codemirror/lang-markdown` is called with its defaults. `addKeymap`
  stays `true`; Enter's list/markup continuation and Backspace's delete-markup-backward ship unmodified.
  **★ THE READING OF §6:** "smart lists/continuation" is deferred as something Peekover BUILDS — its own
  list behaviour — not as a mandate to suppress the engine's defaults. This is the reading the
  `basicSetup` entry applied to find/replace and lint, extended to a third item by the same reasoning: a
  markdown editor whose Enter does not continue a list is the thinner editor Option A already declined.
  Plan D-2's "default bindings unmodified" holds literally, for the language package as for the setup.
  **★ REJECTED — `markdown({ addKeymap: false })`.** It honours §6's text literally at roughly zero byte
  cost (not measured — a config flag, no dependency change), but it MODIFIES an engine default, which is the posture
  Option A rejected when it declined to strip `basicSetup`'s keymaps. Satisfying §6 literally here while
  reading it by intent two items earlier would be two readings of one fence.
  **★ THE INSTALLED-PACKAGE EVIDENCE** (`@codemirror/lang-markdown` 6.5.2, read at HEAD `8cbac42`, not
  from memory): `node_modules/@codemirror/lang-markdown/dist/index.js:407` destructures the config with
  `addKeymap = true`; `:398-401` defines `markdownKeymap` as exactly two bindings — `:399` `Enter` →
  `insertNewlineContinueMarkup`, `:400` `Backspace` → `deleteMarkupBackward`; `:423-424` installs it, when
  `addKeymap` is truthy, as `Prec.high(keymap.of(markdownKeymap))`. `dist/index.d.ts:82-85` documents the
  option: *"Set this to false to disable installation of the Markdown keymap."*
  **Stated precisely, so the record does not under-claim:** "called with its defaults" also covers the two
  other behavioural defaults on that same line `:407` — `completeHTMLTags = true` (HTML tag completion)
  and `pasteURLAsLink = true` (pasting a URL over a selection wraps it as a link). The human's ruling
  named the keymap; its terms (defaults, unmodified) reach these too, and they are named here rather than
  left to be discovered at 3.1.
  **★ THE HONEST COST, RECORDED:** §6's IS-NOT text now reads loosened on a THIRD item — find/replace,
  lint (bindings only), and list continuation are all present as CodeMirror's, none as Peekover's. §6's
  sealed text and plan D-2's stay as-is; this entry, beside the `basicSetup` entry, is the reconciliation
  of record. `tasks.md`'s locked-gates line points here.
  **Revisit-when:** the 7.1 close walk finds continuation or delete-markup-backward jarring in real
  editing — then a task-level reconsideration, not a silent re-ruling; or a future F8 pass builds
  Peekover's own smart-list behaviour.

- **2026-10-04 · M12 TASK 1.2 — the `markdown-it` target moves 14.3.1 → 14.3.2, to also close
  GHSA-r7fv-28h4-cvq7. Human-ruled, a FLAGGED deviation from `tasks.md`'s named 14.3.1. `dompurify`'s
  target is unchanged at 3.4.16.**
  **★ WHAT WAS FOUND:** task 1.2's Step-1 registry check found `markdown-it` 14.3.2 (published 2026-09-12,
  dist-tag `v14-legacy`; `latest` is 15.0.2). It fixes a SECOND advisory the task line did not know about:
  GHSA-r7fv-28h4-cvq7, high, *"Quadratic complexity in smartquotes with unmatched closing quotes"*, read
  from markdown-it's own repository advisory — affected `>= 15.0.0, < 15.0.2` and `< 14.3.2`, patched
  15.0.2 / 14.3.2. It is NOT yet in the global advisory database (`api.github.com/advisories/…` → 404; the
  npm bulk-advisory endpoint returns `{}` for 14.3.1), so `pnpm audit` passes on 14.3.1 TODAY and would
  have gone red again on ingestion — re-opening the exact clause 1.2 exists to close. And a plain install
  under the task's own `^14.3.1` floor resolves to 14.3.2 anyway, so landing 14.3.1 "exactly" would have
  needed a deliberate lockfile pin below a known fix.
  **★ THE RULING:** land 14.3.2, floor `^14.3.2`; still no `overrides` / `resolutions`.
  **★ THE EVIDENCE, as required before the bump:**
  (a) *The smartquotes path is off.* The advisory's own text: only `typographer: true` is affected.
  `src/render/parse.ts:27` sets `typographer: false`; `parse.ts:43` is the ONLY `MarkdownIt` construction
  in non-test source, and nothing shipped calls `.set()` / `.configure()` or names `smartquotes`; neither
  `@mdit/plugin-tex` nor `markdown-it-task-lists` touches the option. So GHSA-r7fv is closed as hygiene,
  not as a live exposure — unlike GHSA-253c-mchw-3w2r, which IS live here (`linkify: true`, `parse.ts:26`).
  (b) *The full 14.3.1 → 14.3.2 diff.* Upstream compare: 2 commits ("Backported 15.0.2 fixes", "14.3.2
  released"), 4 files — `lib/rules_core/smartquotes.mjs` (+48 / −27), `CHANGELOG.md`, `package.json` (the
  version line), `test/markdown-it/pathological.test.mjs` (+5, not published). Published tarballs, 63
  files each: `lib/rules_core/smartquotes.mjs`, `package.json` (version line only), and the six `dist/`
  bundles + maps regenerated from that one source change — every hunk in `dist/markdown-it.js` and
  `dist/index.cjs.js` sits inside the smartquotes rule (plus the version banner). Our ESM import resolves
  to `index.mjs` → `lib/`, not `dist/`. No other source logic moved.
  (c) *`dompurify`.* 3.4.16 is the registry `latest` and the newest 3.4.x; no advisory, global or
  repo-level, lists it as affected. It also closes a repo-level sibling, GHSA-6688-9rhm-gjv2 (low,
  `<= 3.4.15`, another `IN_PLACE` path — not one this repo uses).
  **★ RE-CONFIRMED, because this bump trips a standing revisit-when:** the 2026-07-28 M7 §2.2 AMENDMENT
  asks for a re-confirmation if DOMPurify changes `_isValidAttribute`'s branch structure. 3.4.16's dist is
  rebuilt by a different bundler and the function is re-expressed as early returns with a
  `_matchesNameCheck` helper. Read side by side against 3.4.13: the same acceptance branches in the same
  order with the same conditions — `URI_SAFE_ATTRIBUTES` · `IS_ALLOWED_URI` over the
  `ATTR_WHITESPACE`-stripped value · `data:` on `{src, xlink:href, href}` for a `DATA_URI_TAGS` member,
  never `script` · `ALLOW_UNKNOWN_PROTOCOLS` · empty value. A re-expression, not a semantic change; the
  closure argument stands, and `sanitize.test.ts`'s no-hook guard and the real-engine
  `diagramSanitize` / `diagramSecure` / `sanitize` browser files are green on 3.4.16, both engines.
  **Unchanged:** `@mdit/plugin-tex`'s `^15.0.0` peer range is still unmet (now "found 14.3.2"); the carried
  peer-dependency item stands as written.
  **Revisit-when:** an advisory against `markdown-it` 14.3.2; or a `markdown-it` 15 bump, which re-runs the
  math grammar corpus per the carried peer-dependency item (`progress.md` § Carried items).

- **2026-10-04 · M12 TASK 1.1 — `basicSetup` ships AS-IS; §6's deferred find/replace + lint are
  PEEKOVER-BUILT deferrals, not a mandate to suppress CodeMirror's standard defaults. Human-ruled
  (Option A).** Doc-only: this entry rules the §6 consequence of task 1.1's setup choice (`e001f9e`); the
  choice itself was 1.1's to make from the number (gate 3, the entry below) and is not reopened.
  **★ THE COLLISION:** task 1.1 chose `basicSetup` by plan D-2's rule (*"`basicSetup` unless its cost
  surprises"*): +97,226 B over `minimalSetup` in the shipping combination, 4.5% of headroom — not a
  surprising cost. `basicSetup` bundles `searchKeymap` (the Ctrl-F find/replace panel), `lintKeymap` and
  `autocompletion()` (read from `node_modules/codemirror/dist/index.js` at this HEAD, not from memory).
  Spec §6's IS-NOT fence lists find & replace and markdown linting as DEFERRED. Plan D-2 says the chosen
  setup *"ships its own default bindings unmodified"*. So D-2 ("defaults unmodified") and §6
  ("find/replace + lint out") collide: `basicSetup`'s defaults INCLUDE those features.
  **★ THE RULING (Option A):** ship `basicSetup` AS-IS, defaults unmodified — D-2 held literally. §6's
  "find & replace and markdown linting are deferred" is read as what it MEANT — Peekover does not BUILD
  its own find/replace UI or lint engine this milestone — NOT as a mandate to strip CodeMirror's standard
  behaviour. CodeMirror's built-in Ctrl-F search and its autocomplete are PRESENT, for free, and that is
  acceptable: a markdown editor whose Ctrl-F does nothing would be the "technically-an-editor" result the
  quality bar rejects elsewhere (the reason the feasibility spike rejected CodeJar as too thin, in
  miniature). The user gets a MORE capable focused-core editor, not a crippled one. §6 itself supports the
  reading: its own formatting-toolbar bullet says *"CodeMirror 6's own default bindings ship unmodified"*.
  **★ WHY NOT (b) strip-the-keymaps or (c) `minimalSetup`:** (b) would bend D-2 — modifying `basicSetup`'s
  defaults — to satisfy §6 literally, satisfying neither principle cleanly. (c) `minimalSetup` honours
  both literally but ships a thinner editor (no find, no autocomplete) for a SMALLER byte cost — rejected
  because editor capability outweighs the ~97 KB, and §6's intent is met by (a) anyway.
  **★ THE HONEST COST, RECORDED:** §6's IS-NOT text now reads slightly loosened — find/replace is PRESENT
  (CodeMirror's), just not Peekover-built. This entry is the reconciliation of record; §6's sealed text
  and plan D-2's stay as-is (the M7–M11 precedent — the ruling lives here). `tasks.md`'s locked-gates
  line carries a pointer to this entry. A future F8 pass that builds Peekover's OWN find/replace or lint
  (richer than CodeMirror's defaults) is unaffected — this rules only that M12 does not SUPPRESS the
  defaults, not that it builds more.
  **Stated precisely, so the record does not over-claim:** what `basicSetup` ships for lint is
  `lintKeymap` ONLY — the key bindings. No `linter()` source is configured by `basicSetup` and none is
  added, so NO markdown linting runs and no diagnostics appear; "lint is present" means inert bindings,
  not a lint feature. Find/replace and autocompletion are the two defaults a user can actually reach.
  **★ SAME CLASS, NOT COVERED BY THIS RULING — surfaced, not silently folded in:** `markdown()` from
  `@codemirror/lang-markdown` defaults to `addKeymap: true`, which binds Enter to
  `insertNewlineContinueMarkup` (and Backspace to `deleteMarkupBackward`) — i.e. list continuation, and
  §6 lists "smart lists/continuation" as deferred. The human's ruling named find/replace and lint; its
  reasoning (do not suppress the engine's defaults) reads onto this too, but that extension is the
  human's to confirm, not this entry's to assume. Owed before task 3.1 first calls `markdown()`.
  **Revisit-when:** a future F8 pass that wants Peekover-authored find/replace or lint beyond
  CodeMirror's defaults; or if the close walk (7.1) finds the default search/autocomplete UI jarring
  against the reader's own aesthetic — then a task-level styling reconciliation, not a re-ruling.
  **ALSO BANKED HERE — the audit carry:** `pnpm audit --prod` exits 1 at `e001f9e` on two PRE-EXISTING
  advisories the CodeMirror install did not touch (`markdown-it` 14.3.0, moderate, GHSA-253c-mchw-3w2r,
  fixed 14.3.1; `dompurify` 3.4.13, low, GHSA-p98j-92pf-mc4p, fixed 3.4.16), so task 1.1's "audit EXIT=0"
  Verify clause is NOT met at its commit. Human-ruled: it is closed by a dedicated bump task, **1.2,
  BEFORE 2.1** (`tasks.md`) — an explicit owner, not a silently carried unmet clause.

- **2026-10-04 · M12 GATE 3 APPROVED — `tasks.md` (the WHAT-in-what-order) approved; implementation is
  authorized, beginning at task 1.1, fresh session. The FINAL gate.**
  `specs/012-editor-mode/tasks.md` was reviewed and approved **as redlined to the D-4 re-ruling in the
  entry directly below** — gate 3 approves the CORRECTED task list, not the draft at `87ee130`. The file's
  status line stays "DRAFT awaiting gate 3" and **THIS ENTRY IS THE APPROVAL OF RECORD** (the M7–M11
  precedent; 011's `tasks.md` still reads "DRAFT" post-gate-3).
  **THE SIX GATE-3 QUESTIONS, RULED — all approved as proposed:**
  - **Q1 · D-10's import fence (F-1): APPROVED.** Task 1.1 adds the two stay-silent scanner fixtures to
    `check-dynamic-imports.ts`'s `MUST_NOT_FIRE`; task 3.1 creates `src/render/editorImportFence.test.ts`
    on `diagramImportFence.test.ts`'s four-clause shape — the test is what actually proves the exclusion.
  - **Q2 · Group 3 is THREE tasks: APPROVED.** 3.1 engine · 3.2 enhancer + control + editor pane · 3.3
    debounced live preview, which gets its own red.
  - **Q3 · The conflict policy is ruled MID-IMPLEMENTATION, at 5.5, on a safe floor: APPROVED.** 5.3 ships
    the floor common to all three §8-1 options (no write, the status says the file changed on disk, the
    buffer is retained); 5.5 is the human's walk and ruling; 5.6 builds what is ruled. Gate 3 did NOT rule
    the policy directly, so 5.5 is not struck.
  - **Q4 · The provisional debounce: APPROVED.** D-5's cost-proportional cooldown at multiplier 1, marked
    PROVISIONAL in one place, until the §8-2 ruling; 6.4 applies the ruling and REMOVES the marker.
  - **Q5 · No material-cost threshold: APPROVED.** 6.3 reports every delta that clears its own A-B-A noise
    floor, with the number; the human judges.
  - **Q6 · The content-script byte invariant: APPROVED as "zero `codemirror` bytes, and every
    content-script move is the named task's own decomposed glue."** The gate-3 kickoff's literal
    "340,492 B unmoved" was WRONG — `readerMode.ts`, `readerCss.ts`, `watchController.ts` (and, after the
    re-ruling below, `mount.ts`) are on the content-script graph and on plan §2's Touch list. The plan's
    Touch list is right; the invariant is reconciled to it.
  **THE D-4 RE-RULING IS INCORPORATED:** `tasks.md`'s F-3 and task 2.2 are corrected to Option B (the
  additive `mount()` `chrome: false` option), with the Gate-2 locked line, group 2's acceptance, 3.3's
  scroll clause, 7.1's walk item and the two affected standing invariants reconciled to match.
  **THE GATE-2 CARRIES, CONFIRMED LANDED IN `tasks.md`:** group 3's tests run on an UNWATCHED document, the
  precondition asserted in each test (the residual resolved in group 3's own text); the D-9 ledger sign-off
  is task 5.1, a human gate sequenced BEFORE the first write (5.3); D-4's nested-host cost measurement
  (6.3) surfaces a material cost to the human and STOPS — it does not file it.
  **WHAT THIS AUTHORIZES:** implementation, task 1.1 first, FRESH SESSION, test-first, one commit per task,
  `progress.md`'s Now-pointer advancing in that same commit — nothing before it. The human-gate items land
  where `tasks.md` placed them: the live picker + a real local-disk write (5.x / 7.1), Firefox everything
  (7.1), the conflict-UX walk (5.5), the design-translation walk (7.1), the ledger sign-off (5.1), the
  WIDE-viewport recording (2.2 / 7.1), and the informal eyeball when the editor FIRST renders (3.2, per the
  placed WORKFLOW rule).
  **WHAT STAYS AS-IS:** `spec.md` + `plan.md` bodies and status lines (sealed). The < 165 ms first-paint
  gate, the ≤ 7 MiB ceiling and `permissions: []` all hold. Gate-1 and gate-2 rulings are inherited
  unchanged — D-4's MECHANISM corrected per the entry below, its shadow-root-boundary core intact.
  **Revisit-when:** never for the ruling — gate 3 is the last gate. The next human touchpoints are the
  task-level human gates `tasks.md` names: 5.1 (ledger), 5.5 (conflict UX), 7.1 (close walk).

- **2026-10-04 · M12 D-4 RE-RULED — the live-preview mechanism, corrected after the chrome investigation.
  Gate 2's "the preview is a `mount()` call, `mount.ts` byte-untouched" premise was FALSE; the human ruled
  an additive `mount()` chrome option (Option B). Gate 3 is banked in the entry above, on this corrected
  design.** Doc-only: this entry RULES that the `mount.ts` edit is authorized; the edit itself is task
  2.2's, in implementation.
  **★ WHAT WAS WRONG:** gate 2 approved D-4 (the nested-host preview) on the premise that the preview is
  a plain `mount()` call and `mount.ts` stays byte-untouched. The chrome investigation (read-only, HEAD
  `87ee130`; its citations re-read against the tree when this entry was written) found `mount()`
  UNCONDITIONALLY composes chrome — the mode pill (`mount.ts:157`), the theme control (`:169`) and the
  reading column (`:211`) — plus registry-gated chrome: watch (`:183`), diff (`:191`), the agent badge
  (`:198`) and the TOC rail (`:209-210`). And — the worse finding, which `tasks.md`'s F-3 missed — the
  watch target, the diff context and the document identity are MODULE-LEVEL SINGLETONS
  (`watchRegistry.ts:74`, `diffRegistry.ts:178`, `docIdentity.ts:59`; the app page registers them at
  `appShell.ts:1287/1340/1364`), so a nested `mount()` gets THREE LIVE HAZARDS, not cosmetic duplicates:
  a preview watch pill that starts watching INTO the preview, a diff pill acting on the preview rather
  than the document, and a TOC backtick that can toggle the preview's rail. CSS-hiding (`tasks.md`'s F-3
  disposition) CANNOT fix this — CSS cannot undo registry wiring.
  **★ WHAT IS RULED (Option B):** `mount()` gains ONE additive option, `chrome?: boolean` (default
  `true`), guarding the chrome composition (`:157-201`, `:209-210`), so the preview calls
  `mount(text, nestedHost, { contained: true, preserveReading: true, chrome: false })` and gets the
  reading column WITHOUT chrome or registry wiring. Additive and safe: every existing caller omits it and
  is BYTE-IDENTICAL to today — proven at task time (the existing `mount()` tests stay green; the
  content-script and app-page bytes move only by the option's own guard glue, decomposed).
  **★ WHY OPTION B OVER OPTION A:** Option A — `editorView.ts` composes the pipeline primitives itself,
  `mount.ts` LITERALLY untouched — was REJECTED. It creates a THIRD independent copy of the
  security-critical sanitize → inert-`<template>` → adopt sequence (the investigation's own words: *"its
  own never-blank fallback, its own scroll preservation"*), and a second or third copy of the SANITIZER
  path is a trust-surface risk — DOMPurify config drift is an XSS hole — worse than a byte-touch to
  `mount.ts`. **"`mount.ts` byte-untouched" was a PROXY for the real invariant: ONE trusted
  render + sanitize path.** Option B serves the real invariant; Option A sacrifices it to preserve the
  proxy. Gate 2's own reason for rejecting partial-replace ("don't fork the render path") ARGUES FOR
  Option B — Option A is the one that forks it. The scroll-preservation edge the investigation found
  (`resolveScrollContainer` walks `parentElement`, which is `null` for a direct shadow-root child, so a
  nested host falls back to itself and does not scroll) is likewise solved ONCE under Option B, not
  re-solved a third time inside `editorView.ts` under Option A.
  **Stated, not hidden:** this ends `mount.ts`'s zero-diff streak (006 D-15, 011 D-3, the plan's D-4
  text) and adds a `MountOptions` field — the thing gate 2 called "a permanent widening of `mount()`'s
  contract". The difference the ruling rests on: partial-replace would have added a second CONTRACT
  beside "I own this host's entire shadow root"; `chrome: false` leaves that contract whole and only
  omits chrome from what is committed.
  **★ WHAT THIS CORRECTS, NOT REOPENS:** the nested-host SHADOW-ROOT boundary — D-4's core, the editor's
  DOM protected from the preview's re-render — still HOLDS. Only the "it is a plain `mount()` call /
  `mount.ts` untouched" mechanism claim is corrected, to "it is a `mount()` call WITH the new
  `chrome: false` option; `mount.ts` gains one additive, default-safe option." The gate-2 approval stands
  with this corrected mechanism; the human re-ruled on the true premise. `plan.md`'s body (D-4, §2's
  "Explicitly NOT touched") stays sealed and uncorrected in place — this entry is the correction of
  record, and `tasks.md` is redlined to it.
  **Revisit-when:** never for the ruling; the additive option's byte-safety is proven at task 2.2
  (implementation). Two consequences of the ruled guard range are named in 2.2 for the human to see
  there: `mount()`'s post-commit wiring (`:219-233`) is outside the range and still runs on the nested
  host — needing to guard any of it is a stop-and-flag, not a judgment call; and the remote-load bar +
  network indicator (`:199-201`) are inside it, so a preview shows remote media blocked with no
  in-preview opt-in (the media policy still runs; nothing leaves the machine).

- **2026-10-04 · M12 GATE 2 APPROVED — plan 012 (Editor Mode, the HOW) §8 questions ruled. `tasks.md` is
  the next artifact and the FINAL gate before implementation, fresh session.**
  `specs/012-editor-mode/plan.md` was reviewed and approved. **The plan's status line stays "draft (Gear-3
  gate 2 — awaiting human approval before `tasks.md`)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the
  M7–M11 precedent: gate approvals live in the bank, not in the artifact's status line.
  **THE RULINGS, plan §8:**
  - **§8-1 · D-1 (edit-entry control): APPROVED.** A dedicated edit-entry control, NOT a third state on
    the bare `\` toggle key — an accidental key press must not load a ~500 KB engine and change what
    typing does; matches the product spec's own "Toggle: Read ↔ Edit" as a named control.
  - **§8-2 · D-9 (draft ledger wording): ON TRACK, no sign-off taken now.** The candidate ledger sentence
    reads right in the project's trust voice; the ACTUAL one-sentence sign-off remains gate-1's own
    D-B(iii) obligation, deferred to the save task (group 5) when it drafts the final wording — unchanged
    by this gate.
  - **§8-3 · D-4 (nested-host live preview): APPROVED — nested host, cost measured at group 6 as
    proposed.** `mount()`'s full-shadow-root `replaceChildren` contract (`mount.ts:218`) means a live
    preview cannot render into the document's own host without destroying the editor; the nested-host
    design keeps `mount.ts` byte-untouched (the invariant every milestone relies on) at the cost of a
    second shadow root the plan expects to be small. The rejected alternative — teaching `mount()` a
    partial-replace mode — was weighed with its real appeal (one shadow root, no nesting cost) and
    declined: a permanent widening of `mount()`'s contract for one feature, paid by every caller. ★ **THE
    SEQUENCING IS RULED ACCEPTED AS PROPOSED:** the nested host is BUILT at group 2 and its cost MEASURED
    at group 6 — the architecture is ruled on before its cost is known, deliberately (the measurement
    needs the real thing mounted beside a real CodeMirror instance to be worth anything). The human did
    NOT pull the cost-probe forward before group 2. ★ **CARRIED CONSEQUENCE:** if group 6 finds the
    nesting cost material, that is a finding to surface to the human, NOT a number to file — and since
    groups 2–5 will stand on the nested host by then, overturning it would be a rework. This consequence
    is accepted, on the record, as part of the ruling.
  - **§8-4 · D-8 (watch+edit collision): APPROVED — SUPPORTED, DEGRADED.** Editing a watched document
    pauses its live re-render (via extending `watchController.ts`'s existing diff-deferral gate, not a
    parallel mechanism), surfacing external changes through D-7's save-time content-compare rather than a
    live watch notification. Not DISALLOWED (too restrictive) and not fuller-SUPPORTED-with-live-merge
    (out of the focused core's scope, undesigned). The one asymmetry — edit-mode exit does NOT auto-flush
    the deferred render the way a diff's exit does, because that would destroy unsaved work — is part of
    the approval.
  **INHERITED FROM GATE-1, unchanged:** the four §9 rulings (in-shell, save-back three-way routing + the
  ledger-wording sign-off obligation, existing-pipeline preview, dependency-as-confirmation). **D-7's
  content-comparison conflict-detection lead** (flipped by human ruling 2026-10-04, metadata a
  measurement-gated optimization) stands as the plan's own resolution, confirmed by this approval.
  **WHAT THIS AUTHORIZES:** `tasks.md` (the WHAT-in-what-order), next, FRESH SESSION, the FINAL gate
  before implementation — decomposing the plan's seven groups into tasks, re-deriving every `file:line`
  against its own HEAD, and resolving the one residual this gate carries to `tasks.md`: group 3's
  nested-host tests run on an UNWATCHED document, so no watch can fire mid-test before group 4 closes the
  collision. (Named at this gate, not in the sealed plan body — plan §6 states the hazard only for group
  5's tests, by ordering group 4 ahead of them; group 3's live preview lands before group 4 and has the
  same exposure.) No implementation code before `tasks.md` is approved (WORKFLOW.md §5.3).
  **WHAT STAYS AS-IS:** `plan.md`'s body + status line (sealed, M7–M11 precedent). The < 165 ms
  first-paint gate, the ≤ 7 MiB ceiling, and `permissions: []` all hold.
  **Revisit-when:** never for the ruling; gate 3 (`tasks.md`'s own review) is the next human gate.

- **2026-10-03 · M12 GATE 1 — spec 012 (Editor Mode, focused core: edit → live preview → save-back, via
  CodeMirror 6) APPROVED, ALL FOUR §9 DECISIONS RULED. `plan.md` is the next artifact and the next gate,
  fresh session.** `specs/012-editor-mode/spec.md` was reviewed and approved. **The spec's status line
  stays "draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)" and THIS ENTRY IS THE APPROVAL
  OF RECORD** — the standing precedent from M7–M11: 007 still reads "draft" post-gate-1 (`e09520f`); 008
  still reads "draft" post-gate-1 (`aaf990e`, 2026-08-03 M8 GATE 1); 009 still reads "draft" post-gate-1
  (2026-08-14 M9 GATE 1); 010 still reads "draft" post-gate-1 (2026-08-22 M10 GATE 1); 011 still reads
  "draft" post-gate-1 (2026-09-06 M11 GATE 1) — gate approvals live in the bank, not in the artifact's
  status line.
  **THE RULINGS, spec §9 (verbatim from the human's review):**
  - **D-A · §9-1, in-shell mode vs. a separate editor surface: APPROVED.** Edit is a third state on the
    existing app-page shell / `readerMode.ts`'s `ReaderMode` shape (currently `'reading' | 'raw'`), NOT a
    new entrypoint — the spec's own recommendation, confirmed as stated (§3.3). CodeMirror is lazy-loaded,
    never eager; the §3.3 lazy-load discipline is part of the approval, not a separate, optional concern —
    the ~2.04 MiB headroom §3.6 reports is not licence to skip it.
  - **D-B · §9-2, the save-back write surface — TWO questions, APPROVED AS THE SPEC'S OWN THREE-WAY
    ROUTING (§3.4), WITH ONE HUMAN ADDITION.** (i) **The permission mechanism** (does the File System
    Access write capability need a manifest permission, or is it the same user-gesture web-platform
    capability folder-read already is?) is a **TASK-LEVEL verification**, not a human gate — verified
    against the current File System Access API spec (§7-1), the same way task 1.1 measures bytes every
    milestone — and escalates back to a human gate ONLY IF it surprises by requiring a manifest permission
    (AGENTS.md #4). No recommendation is given or taken on the outcome itself; only on how to find out.
    (ii) **The conflict/overwrite policy** (§7-3/§8-1) is a **GATE-3 product-feel decision**, from a
    measured walk of the conflict scenario, not chosen by a task or assumed here. (iii) **The
    `PERMISSIONS.md` trust-ledger update** — replacing the current "cannot write" claim — is a
    **MANDATORY, non-negotiable, tested acceptance criterion** (§4), not contingent on (i)'s outcome: the
    ledger must state honestly that Peekover can now write to a file the user explicitly opened for
    editing. ★ **THE HUMAN ADDITION:** the exact WORDING of that new ledger claim is a trust-story
    POSITIONING call — the same class as the 2026-10-03 ceiling reword from "under half" to "under
    two-thirds" — and comes back to the human for a one-sentence sign-off when `plan.md`/the save task
    drafts it, separate from the mandatory-ness of making the edit at all. **Revisit-when:** §7-1's own
    task-level verification, before any save-path code is written; the ledger-wording sign-off, when the
    save task drafts the sentence.
  - **D-C · §9-3, live preview through the existing render pipeline, debounced, no new sanitizer profile:
    APPROVED.** CodeMirror is a second text-producer for the same `sanitize(parse(source))` consumer every
    milestone since M1 already built; it introduces no new generated-markup shape DOMPurify has never
    seen, unlike 007's Mermaid SVG or 011's Temml/MathML output — AGENTS.md #3 is satisfied by reuse
    (§3.5), nothing new to build. The debounce interval itself is explicitly NOT ruled here — it stays a
    gate-3 number (§8-2), measured against a representative document size.
  - **D-D · §9-4, the dependency gate framed as a CONFIRMATION, not a bust-risk fork: APPROVED.** Task 1.1
    re-measures CodeMirror 6's real import graph's actual delta against the reported ~500–607 KB figure /
    ~2.04 MiB headroom (§3.6) as a confirmation of an already-measured-to-fit dependency, not a scope fork
    the way M10's docx bust or M11's KaTeX/MathJax bust each were. The human did not ask for CodeMirror's
    fit to be treated as still genuinely open — the §9-4 distrust escape (treat the prior spike numbers as
    unproven) was offered in the spec and explicitly declined.
  **WHAT THIS APPROVAL AUTHORIZES:** `plan.md` (the HOW), next, in a FRESH SESSION, resolving spec §7's
  seven open risks against the ACTUAL tree at its own HEAD (every `file:line` citation re-derived), with
  particular front-loaded force on §7-1 (the FSA write-permission mechanism, the milestone's own central,
  front-loaded risk per §3.4) and §7-3 (the conflict policy, including the watch-relay-while-editing
  collision §3.4-iii names).
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install CodeMirror 6 or move any dependency; it does not
  resolve §7's remaining risks (the exact write-mode-upgrade mechanism, CodeMirror's real package shape,
  the debounce target, design translation, the sibling-checklist audit) or §8's three gate-3
  measure-then-choose items (conflict UX, debounce interval, snapshot integration) — all remain
  `plan.md`'s/`tasks.md`'s to resolve against the actual code; it reopens no §3.x decision; it writes no
  `plan.md` or `tasks.md`; it edits no manifest and no `PERMISSIONS.md` row (the ledger update is §4's
  mandatory acceptance criterion for the SAVE task to land, not this gate's to pre-empt).
  **WHAT STAYS AS-IS:** spec.md's body and status line, sealed per the M7–M11 precedent — this entry is
  the approval, not an edit to the sealed spec. The < 165 ms first-paint gate and the ≤ 7 MiB ceiling
  (2026-10-03, above) are inherited unchanged. `permissions: []` holds unless D-B-i's own verification
  surprises.
  **Not a blocker for:** gate 2 (`plan.md`) or any subsequent gate — nothing above is unresolved, each
  ruling is stated so `plan.md` inherits it closed (or, for D-B-i/D-B-ii, closed pending their own
  dependent task-level verification or gate-3 measurement).
  **Revisit-when:** never for the ruling itself; gate 2 (`plan.md`'s own review) is the next human gate.

- **2026-10-03 · M12 PREREQUISITE — package-size ceiling revised 5 MiB → 7 MiB (7,340,032 B), a human
  product ruling, doc-only.**
  **WHAT:** the self-imposed `.output` package ceiling moves from ≤ 5 MiB to ≤ 7 MiB, effective now.
  Edited where stated: `AGENTS.md`'s stack-rule line, `docs/product/spec.md` §8's Package size row (+ a
  dated revision footnote, same pattern as the 2026-07-27 first-render-row correction), `docs/ai/brief.md`'s
  "Success (v1)" line, and `site/index.html`'s public "whole extension: ≤X MB" marketing line — the last two
  weren't named in this task's kickoff but were found live-stating the old number and confirmed in-session
  as in-scope (AskUserQuestion), since a stale copy left standing is exactly the future-contradiction risk
  this same ruling's own audit step warns against. No enforcement test/script constant exists anywhere in
  the repo (grepped for `5,242,880` / `5242880` / `5 * 1024 * 1024` across `.ts`/`.js`/`.json` — zero hits);
  the ceiling has only ever been measured by hand at milestone close, never pinned in code.
  **WHY IT EXISTED:** the only stated reason (spec §8) was a store-listing trust signal against md-reader's
  11.4 MiB — a competitive-positioning choice, not a platform limit (Chrome's real ceiling is ~2 GB,
  Firefox's ~200 MB, per this session's editor-feasibility spike).
  **WHY 7:** unblocks F8 Editor Mode (CodeMirror 6, ~500–607 KB measured, lazy-loaded) with real working
  room, so M12 doesn't re-sweat the ceiling every task the way M11's ~44 KiB headroom forced. Measured
  just now (fresh build, HEAD `21b97fa`, both engines): `.output` **5,197,425 B (Cr) / 5,197,541 B (Fx)**
  — unmoved since M11's 8.3-R close, no production code has landed since. Against the new 7 MiB
  (7,340,032 B) bound that's **2,142,607 B / ~2.04 MiB (Cr), 2,142,491 B / ~2.04 MiB (Fx) headroom** — note
  this is measured, not the kickoff's own rough "~1.3 MiB" estimate, which undercounted; CodeMirror's
  ~500–607 KB fits with over 3× room to spare even before any lazy-load discipline. And 7 MiB is still
  ~61% of md-reader's 11.4 MiB — "under two-thirds", so the trust-signal positioning holds; it would not
  hold as "under half" (the old framing), which is why spec.md §8's prose was re-worded, not just its number.
  **WHAT DOES NOT CHANGE:** the < 165 ms first-paint gate (spec §8's own row above Package size) is
  UNTOUCHED. The ceiling is package SIZE; speed is a separate gate. The editor lazy-loads (dynamic import,
  app-page, same shape as temml/mermaid/shiki), so first-paint stays instant — raising the size ceiling
  spends none of the speed discipline. Do not read "5→7" as "we relaxed being fast/light"; only the
  store-listing size number moved, deliberately, for the editor.
  **WHAT THIS UNBLOCKS:** M12 = F8 Editor Mode, CodeMirror 6 lazy-loaded, scoped against the 7 MiB ceiling.
  Its own task-1.1 dependency gate becomes a confirmation of a measured-to-fit cost, not a bust risk.
  **WHAT STAYS AS-IS (historical, not rewritten):** every closed-milestone byte ledger in `progress.md`,
  `progress-archive.md`, `decisions.md`'s own prior entries, `retro.md`, and the M3/M4/M9/M10 `spec.md`/
  `tasks.md`/`plan.md` files that measured "against the 5 MiB bound" at their own time — those are dated
  facts about what was true then, not the live rule, and are left untouched. `docs/ai/architecture.md`'s
  M1-era "Shiki bundle size vs 5MB budget" open question is the same class (a dated, already-resolved
  unknown) and is likewise left as-is.
  **REVISIT-WHEN:** the size positioning is re-examined, or a future milestone approaches 7 MiB the way
  M11 approached 5 — the same raise-or-trim ruling recurs, with this entry as precedent.

- **2026-09-11 · M11 CLOSED — math rendering shipped (Temml/MathML inline `$…$`/block `$$…$$`/fence,
  copy-as-LaTeX/MathML, both engines), task 8.3-R's records reconcile.**
  **THE D-N-R-LANDED AUDIT (M9's own named gap, checked again, not repeated).** Every reopened D-value
  lands with a named implementing commit: D-1-R (tokenizer, `a70a556` resolved → `abdbbf3` landed on
  `parse.ts` for real) · D-2-R (engine module, `442a76f`) · D-3-R (call sites, `3afec7c`) · D-4-R
  (config lockdown, `442a76f`, extended `546293d`) · D-5-R (sanitizer profile, `defb797`) · D-6-R (copy
  mechanism, `2b920b1` block + `9ba3494` inline) · D-7-R (inline inversion, `abdbbf3` markers →
  `6aa6964` full inversion → `63aedb4` fix-before-close) · D-8-R (block/fence reuse, `abdbbf3` +
  `3afec7c`) · D-9-R (no-theme-re-render lean, measured `3afec7c`, confirmed by eye at the 8.1-R walk) ·
  D-12-R (cache measurement, `13795f2`, no-cache lean CONFIRMED) · D-13 (font, chosen/subsetted
  `a70a556`, wired for real `3afec7c`, corrected `b8f4a20`). D-10/D-11 confirmed VACATED with
  **correctly zero** implementing commits (REVISIT-RULING 4 struck MathJax permanently). **Unlike M9's
  gap, no D-value went undocumented** — every one is documented in full in its own task's commit
  message AND `tasks.md`'s own detailed RESULT block. **One real divergence, named not smoothed over:**
  no D-value received its OWN standalone `decisions.md` bullet the way the original M8-era per-D-value
  convention intended (`plan.md` §0's pre-written-citation-text shape) — this file's own M11 entries are
  gate-, fix-spike-, and human-walk-shaped, not per-D-value. The landing text lives in `tasks.md` and
  git history instead. This is a lesser-degree recurrence of the M9 class of gap (a missing artifact in
  THIS file), mitigated by the fact that the substance is fully recorded elsewhere, unlike M9's total
  absence.
  **★ 8.1-R'S OWN `tasks.md` CHECKBOX/RESULT BLOCK WAS NEVER COMPLETED, NAMED HERE.** The task's work
  landed — the human fidelity walk ran, `harness/math-fidelity/walk-corpus.md` was committed
  (`482f2af`), and the PROCEED ruling was banked (`decisions.md`'s 2026-09-10 "M11 8.1-R / 1.2-R"
  entry, merging 8.1-R's own full-document-scale walk with 1.2-R's fork resolution) — but task 8.1-R's
  own `[ ]`/RESULT slot in `tasks.md` was left exactly as drafted. 8.3-R's own Files-list fence does not
  include `specs/011-math-rendering/tasks.md` beyond ticking 8.3-R's own box, so this is named here
  rather than silently fixed by this task; a future session ticking it retroactively (or leaving it,
  per the 007-checkbox-convention precedent that the pointer, not the box, is the done-ness signal) is
  a call for whoever next touches that file.
  **F2 RE-SCORED: 42% → 68%** (`spec-coverage.md`). Four rows ✗→✓ (the default-engine row, now Temml/
  MathML not KaTeX — a ruled substitution; inline; block; fence), two ✗→~ (copy-as-LaTeX/MathML ship as
  document-level panel actions, not right-click), MathJax stays ✗ **permanently by ruling**. Whole-spec
  figure moves 34% → 36%.
  **THE BYTE LEDGER, CLOSED — fresh build, both engines, HEAD `6eff5dc`.** Content-script **340,492 B**,
  md5-identical to 3.2-R's own landed floor (`bcdcf231…` Cr / `49e218a1…` Fx) — the milestone's own
  closing invariant, proven never to have moved again after landing once at 3.2-R. `.output`
  **5,197,425 B Cr / 5,197,541 B Fx**, headroom **~44.4 KiB Cr / ~44.3 KiB Fx** against the 5 MiB bound.
  `pnpm zip` **1.63 MB**, headroom comfortable. Manifest **654 / 770 B**, `permissions: []`, no
  `web_accessible_resources`, no `contextMenus`. **The ~28.2 KiB URL-loaded-font lever (byte-forecast
  spike, 2026-09-07) was TAKEN at 4.2-R, not left as a separate reserve** — `src/theme/mathFont.ts`
  imports the subsetted WOFF2 without `?inline`, a real asset file, confirmed in `.output/*/assets/`;
  the current headroom already reflects that recovery, so it is spent margin, not available-if-needed.
  **CARRIED ITEMS, DISPOSITIONED HONESTLY (`progress.md` § Carried items, each updated in place):**
  §8-1(b) inline source-recovery — ✅ RESOLVED (`63aedb4`). The 6.2-R harness-shared-state flake — ✅
  RESOLVED. `runCopyMathMathml`/`runCopyMathLatex` not wired to `lastExportFormat` — STANDING, a
  doubly-confirmed deliberate scope decision. The `@mdit/plugin-tex` content-script invariant
  falsification — ✅ RESOLVED (priced by INPUT B's rewritten invariant, landed at 3.2-R, confirmed
  unmoved since). The `@mdit/plugin-tex`/`markdown-it` peer-dependency mismatch — MITIGATED, not
  eliminated (two independent zero-misclassification grammar audits, 1.1-R and 3.1-R; the version
  itself was never bumped). Two post-M11 follow-ups (upstream the temml patch; the SBOM
  patched-dependency blind spot) — STANDING, deferred-post-M11. **★ THE TWO UNIT-SUITE WALL-CLOCK
  FLAKES (`pipeline.perf.test.ts`, `golden.test.ts`) ARE STILL STANDING, RE-CONFIRMED AT THIS CLOSE**
  (full `pnpm test` at HEAD `6eff5dc`, no diff: same two tests red, both green in isolation in <3s) —
  **the milestone's "suite green" claim carries this caveat explicitly; the BROWSER suite goes green in
  ONE pass repeatably (rule-9 hardening), the UNIT suite does not, and this is not rounded into "all
  green."** Two of the retro's three drafted process actions (the informal-eyeball timing rule; the
  shorter-check-ins-plus-tree-hygiene-near-close rule) are DRAFTED, not placed — the human's own call
  per C2. The font-subset MATH-table rule (the retro's third action) IS placed, `AGENTS.md` Style &
  structure, 2026-09-11.
  **THE REOPEN-FROM-A-BUSTED-GATE ARC IS VALIDATED, per the human's own 8.2-R retro answer:** a
  suspended milestone, reopened via three fresh REVISIT gates (spec/plan/tasks) rather than closed
  outright, shipped the feature the busted gate almost cost — "the next busted-gate milestone has
  precedent to follow rather than improvise" (`retro.md` 2026-09-11).
  **WHAT THIS ENTRY DOES:** closes M11. Moves § Now's/§ Up next's full M11 narrative to
  `progress-archive.md`, verbatim. Does not edit `spec.md`/`plan.md`/`tasks.md`'s sealed bodies (beyond
  8.3-R's own checkbox) and does not re-open any D-value or ruling.
  **Revisit-when:** never for the closed facts above; the two drafted-not-placed retro actions and the
  two post-M11 follow-ups each get their own future session per their own HOME notes in `progress.md`.

- **2026-09-10 · M11 §8-1(b) FIX — INLINE SOURCE-RECOVERY via a `data-*` attribute, not a hidden DOM
  node (fix spike, NOT a numbered tasks.md task — discharges the 8.1-R "fix-before-close" ruling
  immediately above). §8-1(b) is now FULLY DISCHARGED — 8.2-R (`/retro`)/8.3-R (records reconcile) can
  proceed.**
  **TWO MECHANISMS DIAGNOSED, BOTH MEASURED AGAINST REAL BROWSER BEHAVIOUR BEFORE PICKING ONE.**
  Mechanism 1 — a `data-math-source` attribute set directly via `Element.setAttribute` on the already-
  mounted `<code class="peekover-math-inline">` element, inside `markMathInlineRendered`, BEFORE it
  replaces the element's children. Diagnosed: `sanitizeMath`'s `ALLOW_DATA_ATTR: false` (`sanitize.ts`)
  is IRRELEVANT — that config gates the RENDERED FORMULA STRING Temml produces (what becomes the
  `<math>` fragment replacing the element's children), never the container's own attributes, which are
  set the identical way `markMathInlineFailed` already sets `title`/`data-math-failed` on the same
  element (existing, already-shipped precedent). No sanitizer profile is touched or widened —
  `sanitize.ts` has a ZERO-LINE diff in this fix. Measured directly (real Chromium + Firefox): a value
  carrying a literal newline AND a backslash round-trips `setAttribute`/`getAttribute` byte-identical,
  and survives an `outerHTML`-serialize-then-reparse round trip identically too.
  Mechanism 2 — a visually-hidden source node beside the `<math>` tree, preserving §8-1(b)'s ORIGINAL
  "ordinary text-selection" mechanism. Diagnosed with a real `Range`/`Selection`/Ctrl+C round trip, both
  engines: selecting a whole SENTENCE around an inline formula pollutes the copied prose with the hidden
  source mid-word (`"Before text \r\nx\r\n$x+y$ after text."` Chromium / `"Before text x$x+y$ after
  text."` Firefox) — a regression to the single most common text-copy action, for any document
  containing inline math. Adding `user-select:none` to the hidden node closes that hole (both engines
  correctly exclude it from a whole-sentence copy) but ALSO removes it from a copy that selects ONLY the
  `<code>` element itself — the one selection §8-1(b)'s own mechanism depends on, measured the same
  session. There is no CSS-only middle ground: browser text selection is RANGE-based, not node-scoped,
  so "selectable in isolation, excluded from a wider selection" is not an available state.
  **PICKED: mechanism 1**, on the measured trade-off above. It costs nothing in the sanitizer, adds no
  visible/selectable DOM (no prose-copy pollution, no accessibility double-announce risk), and needs no
  new per-formula inline chrome (row 11 — still negative, re-confirmed). What it needs is a way to READ
  the attribute, since inline has no per-formula control group of its own (D-7-R) and row 11 forbids
  adding one — routed through a NEW document-level "Copy formulas as LaTeX" action
  (`copyAllMathAsLatex`/`serializedMathSourceDocument`/`allMathSourcesIn`, `mathView.ts`), parallel to
  6.2-R's own "Copy formulas as MathML" action, the SAME gate-3-ruled panel/menu-row placement
  (`decisions.md`'s M11 GATE 3 FINDING 2) — a SEVENTH export-panel row, wired live from day one, never a
  toolbar button or keyboard shortcut, never wired into `lastExportFormat` (identical scope decision to
  `copy-math-mathml`'s own, for the identical reason).
  **WHAT DID NOT CHANGE.** Block math's existing per-figure copy-as-LaTeX button is untouched
  (`copyMathAsLatex`/`retainedMathSource` unmodified) — the new document-level action reuses it for
  block formulas and adds only the inline half. D-7-R's mutate-in-place persistence property (the
  `<code>` element itself is never removed/wrapped/replaced) is unchanged — the new attribute is set on
  the SAME element, before the same `replaceChildren` call. Row 11's "no per-formula inline control
  group" negative is unchanged — no button, no chrome, appears next to any inline formula. Text-
  selection of a SETTLED inline formula still copies the rendered glyph, never the source — this is now
  the PERMANENT, BY-DESIGN shape (the source is recovered a different way), not a residual defect;
  `mathActions.browser.test.ts`'s own pre-existing tests for that shape are reworded to state this,
  assertions unchanged.
  **RED-FIRST.** A real ablation (commenting out the one `setAttribute` line in
  `markMathInlineRendered`) was run and reverted: the new recovery-guard tests in
  `mathActions.browser.test.ts` went RED on both engines, `expected '' to be 'x + \$5'` — the exact
  "no mechanism, no recovery" signature the 6.2-R gap named. Reverted before this commit.
  **VERIFY.** Full unit (1145/1145, two pre-existing concurrency-sensitive wall-clock flakes —
  `pipeline.perf.test.ts`/`golden.test.ts` — confirmed via isolated rerun, the same standing carried
  item, unrelated to this diff's files) and full browser (164 files, 1663/1663 passed + 15 skipped, up
  from 1651 — the 6 new tests × 2 engines, GREEN IN ONE PASS, repeated twice) suites green; `pnpm lint`
  EXIT=0. `git diff tests/golden/output/` EMPTY; `mount.ts` untouched; `sanitize.ts` untouched (ZERO-line
  diff, confirms mechanism 1's own "no sanitizer widening" claim). Fresh both-engine rebuild:
  content-script **340,492 B UNMOVED, md5-identical** to the standing floor (`bcdcf231…` Cr /
  `49e218a1…` Fx); `.output` **5,197,425 B Cr / 5,197,541 B Fx**, **+1,021 B both engines** over the
  post-radical-fix figure (5,196,404 / 5,196,520) — the new panel row + attribute-retention glue landing
  on the already-loaded app-page graph, no new lazy chunk; headroom vs the 5 MiB ceiling **~44.4/44.3
  KiB** (was ~45.4/45.3 KiB). Manifest **654 / 770 B**, `permissions: []` — unmoved.
  **REVISIT WHEN:** never, absent a NEW inline-source-recovery requirement (e.g. a per-formula inline
  affordance row 11 would then have to un-forbid) — mechanism 1's own trade-off (document-level
  aggregate, not per-formula) is the settled shape for as long as row 11's own ruling stands.

- **2026-09-10 · M11 8.1-R / 1.2-R — THE HUMAN FIDELITY WALK RESOLVES THE DEFERRED FORK: **PROCEED**. M11
  SHIPS MATH RENDERING. The 2026-09-07 conditional-proceed deviation is CLEARED; every group 2-R–8-R commit
  that proceeded "under the open 1.2-R fork" is now retroactively on the PROCEED path.** The sealed 1.2-R
  fidelity gate (RULING 2's readable-on-both-engines bar) was walked by the human against the real PACKED
  EXTENSION — Chrome (`.output/chrome-mv3`, loaded unpacked) and Firefox (`.output/firefox-mv3`, temporary
  add-on) — over the full `harness/math-fidelity/walk-corpus.md` corpus (the eight fidelity classes + the
  §9-2 content-script cousin). **This entry is the approval of record; 1.2-R's box is ticked in `tasks.md`
  (the gate ran), but its body text and `spec.md` stay as-is (bank-not-artifact for the ruling itself).**
  **THE WALK — WHAT WAS SEEN, BOTH ENGINES:** all eight classes render acceptably-and-readably on both
  engines — stretchy delimiters (extenders grow to content height, Chrome's own weak spot, clean), radicals
  (√ with a vinculum over the whole radicand at every nesting level), big operators at display size
  (∫/∑/∏/∮, size-variant glyphs), matrices (five delimiter styles, grid-aligned), nested scripts/fractions,
  accent glyphs (x̂ ȳ ż ẅ v⃗ ũ, no tofu), inline-vs-block flow, Greek + a dense formula. Theme flip
  (light/dark/sepia) re-colours formulas on both engines (D-9-R confirmed by eye, not just the 4.2-R
  measurement). The §9-2 content-script cousin (a `$x$` in a `file://` doc rendering as inert monospace
  `<code>`) reads acceptably, not jarring — no §3.2 amendment needed.
  **★ THE WALK WAS NOT A RUBBER STAMP — IT CAUGHT A MILESTONE-CRITICAL DEFECT AND SENT IT BACK.** The FIRST
  walk (same day) found the radicals class BROKEN on Chrome: `\sqrt{x^2+y^2}` rendered as `x²+y²`,
  `\sqrt[3]{8}` as `8`, the nested radical as `1+1+1+x` — the radical SIGN drawn as nothing, the radicand
  surviving. Root-caused (a diagnosis spike, `b8f4a20`): NOT the sanitizer (msqrt/mroot were allowed) and
  NOT Temml (it emitted correct `<mroot>`), but the BUNDLED FONT — task 1.1-R subset
  `stix-two-math-subset.woff2` by scanning Temml's rendered TEXT for codepoints, a method structurally blind
  to U+221A (the radical sign is drawn by the browser from the font's OpenType MATH table, never emitted as
  a text character). Firefox masked it via OS font-fallback; Chrome, with no system math font, reserved 0px.
  Fixed by re-subsetting from the same google/fonts source with U+221A added (+384 B, 318 codepoints diffed
  glyph-for-glyph zero-regression), with an engine-aware, geometry-based regression guard (red-first on
  Chrome; Firefox already masked). The walk above is the RE-walk, post-fix, both engines clean. **This is
  the third instance this milestone of the same failure class — a correct-looking method, green tests, blind
  to a specific untested case (the bundling lone-surrogate defect; the §8-1(b) copy-source gap; this
  font-subset MATH-table blind spot) — each surfaced ONLY by a human looking at real rendered output. The
  8.1-R walk existing as a human gate, not an agent check, is why M11 does not ship broken radicals.**
  **FIRST-PAINT:** measured 0.05s on the packed extension — comfortably under the <165ms floor (converting
  7.1-R's reasoned claim to a measured one, as that task's own divergence flagged). Content-script math stays
  literal (§9-2), app-page math renders after first paint.
  **THE §8-1(b) INLINE SOURCE-RECOVERY GAP — RULED FIX-BEFORE-CLOSE, not ship-with-a-gap.** 6.2-R proved a
  successfully-rendered inline formula has no way to recover its LaTeX source (an in-scope §4 capability that
  silently fails for the common case). The human ruled: FIX IT before M11 closes (a D-7-R inline-retention
  change), not ship it as a carried gap. This is now a REQUIRED task before 8.2-R/8.3-R — the milestone does
  not close with a known-broken in-scope copy capability.
  **WHAT THIS RULING DOES:** resolves the 1.2-R fork as PROCEED; ticks 1.2-R; clears the 2026-09-07
  conditional-proceed deviation (groups 2-R–8-R's conditional work is now unconditional-PROCEED); records the
  radical defect + fix as the walk's own finding; rules §8-1(b) fix-before-close.
  **WHAT IT DOES NOT DO:** it does not close M11 (8.2-R retro + 8.3-R records reconcile remain, plus the
  §8-1(b) fix); it does not edit spec.md or 1.2-R's body; it installs/builds nothing. **Revisit-when:** the
  §8-1(b) fix lands, then 8.2-R (retro) and 8.3-R (records reconcile) close the milestone.

- **2026-09-10 · M11 RADICAL-RENDER DEFECT — FIXED at the font asset (fix spike, NOT a tasks.md task).
  The 8.1-R walk found `\sqrt`/`\sqrt[n]{}` rendering with the radicand intact but no radical sign or
  root index bracket, both engines. 8.1-R's own radical blocker is CLEARED (the PROCEED/CLOSE-M11
  fork itself is still open — only a human re-walk resolves it).**
  **DIAGNOSIS.** The kickoff's own prior — a D-5-R sanitizer allow-list gap — is CONFIRMED FALSE:
  `msqrt`/`mroot` were already in `MATH_ALLOWED_TAGS`, 2.1-R's own `MATH_SURVEY_CORPUS` already
  carried radical fixtures, and a real-Temml-through-real-`sanitizeMath()` trace showed the structure
  surviving byte-for-byte. The actual mechanism: Temml's `<msqrt>`/`<mroot>` output carries no
  character for the radical sign at all — the browser draws it purely from the font's OpenType
  `MATH` table (`MathVariants`, keyed off U+221A). Task 1.1-R's font subset
  (`assets/fonts/stix-two-math-subset.woff2`) derived its `--unicodes` set by scanning Temml's
  RENDERED TEXT for codepoints used — a method structurally blind to a codepoint the renderer needs
  but the DOM text never carries. U+221A was absent from both the subset's `cmap` and its
  `MathVariants` coverage (confirmed directly with `fontTools`), despite 1.1-R's own RESULT block
  correctly reporting "no gap beyond U+FE0E" against the text-derived set it actually measured — the
  set itself just never contained U+221A. Confirmed via geometry, real engine, before any fix:
  Chromium's `msqrt`/`mroot` stayed correctly `display: block math` throughout but reserved exactly
  0px of extra width for the radical sign.
  **THE FIX.** Re-subsetted from the same source 1.1-R used (`google/fonts`
  `ofl/stixtwomath/STIXTwoMath-Regular.ttf`, re-fetched, byte-identical to 1.1-R's own recorded
  1,517,976 B), same `pyftsubset` flags, original 318-codepoint set (read back off the shipped
  subset's own `cmap`, diffed glyph-for-glyph — zero regression) plus U+221A. 86,224 B → 86,608 B
  (+384 B). `MathVariants.VertGlyphCoverage` now covers the radical glyph; `numGlyphs` 1115→1125 (the
  size-variant assembly parts 1.1-R's own glyph-closure mechanism pulls in automatically, just never
  given U+221A as a seed before).
  **REGRESSION GUARD.** `tests/browser/mathBlock.browser.test.ts`, geometry-based (extra width beyond
  the bare radicand — DOM-shape alone can't see this class of defect), all three 8.1-R walk fixtures,
  red-first proven on Chromium (Firefox's pre-fix reading was not zero — it was already falling back
  to a system math font per-glyph for the one missing character, via the `font-family: 'Peekover
  Math', math;` stack's own generic fallback; the fix removes that inconsistency on both engines).
  **VERIFY.** Full unit (1145/1145) and full browser (1651/1651, 15 skipped) suites green in one pass;
  lint EXIT=0; golden unchanged; fresh both-engine rebuild — content-script 340,492 B UNMOVED,
  manifest/permissions unchanged, `.output` headroom ~45.4/45.3 KiB (was ~45.8/45.6 KiB — the entire
  movement is the +384 B font delta). Full trace: `docs/ai/progress.md`'s 2026-09-10 entry.
  **REVISIT WHEN:** the font is ever re-subsetted for any other reason — the codepoint-discovery
  method (scan rendered text) is still structurally blind to any FUTURE non-textual MathML-native
  construct Temml might add that needs its own font glyph with no DOM-text representation; re-seed
  from the shipped `cmap` (as this fix did), never re-derive the set from a text scan alone.

- **2026-09-09 · M11 TEMML-BUNDLING DEFECT — FIXED via `pnpm patch` (fork-level spike, human-authorized,
  NOT a tasks.md task). The shipped `.output` now renders LaTeX macros through the real bundled chunk,
  both engines. 1.2-R's fidelity-walk blocker is UNBLOCKED.**
  This is the real fix the same-day TEMML-BUNDLING DEFECT entry below (its own "CHEAP FIXES TRIED" list)
  routed as fork-level: `pnpm patch temml` (`patches/temml.patch`, tracked in `pnpm-workspace.yaml`'s
  `patchedDependencies` and in `pnpm-lock.yaml`'s `temml@0.13.5(patch_hash=ba3cf1c4e69c92884339e800d3a
  03eea07a2734bd97f4f0c8e62839df1d74134)` snapshot).
  **THE PATCH.** Temml's `Lexer.js`-derived `tokenRegexString` built two regex fragments —
  `controlSymbolRegexString` (`"\\\\[^\uD800-\uDFFF]"`) and the astral-surrogate-pair alternative
  (`"[\uD800-\uDBFF][\uDC00-\uDFFF]"`) — from SOURCE-LEVEL lone-surrogate escapes. The patch rebuilds
  both from four `String.fromCharCode(0xD800/0xDBFF/0xDC00/0xDFFF)` calls at RUNTIME and string-concatenates
  the results into the same pattern text, producing an IDENTICAL compiled regex (same code units, same
  matching behavior) while leaving no `\uD8xx`–`\uDFxx` escape in the module's static source for the
  Vite/Rollup/esbuild pipeline to mangle. Applied identically to all three files a `pnpm patch` of this
  package can reach: `dist/temml.mjs` (the "import"-condition file Vite/WXT's ESM resolution — and hence
  `import('temml')`, `mathEngine.ts`'s single call site, D-2-R — actually consumes and bundles),
  `dist/temml.cjs` (the "require"-condition file, for consistency), and `src/Lexer.js` (source parity /
  upstream-patch readability; not itself consumed by the build). Precedent for the mechanism already
  existed unmangled inside temml's OWN codebase: `dist/temml.mjs`'s wide-character-alphabet code
  (`String.fromCharCode(0xd835, 0xdc00 + i)`, math bold/italic/etc.) uses the identical
  numeric-literal-not-source-escape shape and was never corrupted — confirming the construction survives
  this bundler pipeline.
  **ACCEPTANCE, MEASURED AGAINST THE SHIPPED `.output`, NOT THE TEST PATH.** Fresh `rm -rf .output` builds,
  both engines (`pnpm build`, `wxt build -b firefox`): the rebuilt `temml-CsuG5rjZ.js` chunk is
  BYTE-IDENTICAL across engines (md5 `093903c70ee57e4f1047aedcafa327e8`), contains ZERO U+FFFD in either
  chunk, and its minified `fromCharCode(55296/56319/56320/57343)` calls (decimal for
  0xD800/0xDBFF/0xDC00/0xDFFF) confirm the runtime-construction survived minification. A Node script
  importing the REAL built chunk directly (`file://…/chunks/temml-*.js`, not `node_modules/temml` in
  isolation) rendered `\alpha`, `\frac{a}{b}`, and `\text{hi}` to `<math>…` successfully, both engines —
  the actual production path, not the Vitest dep-optimizer shortcut the prior spike's route (b) fixed
  without touching this. The SAME script's degradation check confirmed a genuinely malformed
  `\frac{a}{` still throws (temml's error path, our `throwOnError:true` lockdown, untouched).
  **THE PERMANENT REGRESSION GUARD.** `tests/browser/mathBlock.browser.test.ts` gained a
  "regression guard — Temml bundling defect" describe block: renders `$$\frac{a}{b} + \alpha$$` through
  the REAL app-page path (`appPageReader` → `mount()`/`enhanceMath` → `loadTemml`'s own
  `import('temml')`, D-3-R's real call site — the same Vite dependency-pre-bundle route that
  first surfaced the defect), and asserts `data-math="rendered"` with a real `<math>` child and zero
  `.peekover-math-error` elements. A future temml version bump that reintroduces the corruption, or
  changes the regex construction enough to break this patch's string match, trips this test.
  **FULL SUITE.** `pnpm test` (unit): 66 files / 1145 tests, all passed. `pnpm test:browser` (both
  engines): 1625 passed / 15 skipped; TWO failures (`copyAsHtml.browser.test.ts`'s real-clipboard
  content match, `mathNetwork.browser.test.ts`'s "font fetched in this window" claim) reproduced
  identically across two full-suite runs but BOTH PASSED CLEANLY when their files were run in isolation —
  AGENTS.md's own documented harness-shared-state signature (serially-run files sharing one
  window/clipboard/module-level caches; a red that clears in isolation, not one that persists or spreads
  to another file). Neither touches macro content or the lexer path this patch changes; `mathBlock.browser.
  test.ts` already rendered several `$$x^2$$` formulas (D-8-R/INPUT A/D-9-R blocks) before this patch,
  so any registerMathFont()-idempotency cross-file leak into `mathNetwork.browser.test.ts` (alphabetically
  later) predates this change. Not investigated further — out of this spike's scope. `pnpm lint`
  (eslint + tsc --noEmit): clean.
  **BYTES.** Both engines: content-script **340,492 B**, unchanged (temml is app-page-only — confirms it
  never touched the CS graph). Manifest 654 B (chrome) / 770 B (firefox), unchanged. `temml-CsuG5rjZ.js`
  chunk 204,126 B, byte-identical both engines. `.output` totals 5,195,294 B (chrome) / 5,195,410 B
  (firefox) — headroom vs the 5 MiB (5,242,880 B) ceiling is **~46.5 KiB (chrome) / ~46.4 KiB (firefox)**,
  essentially unchanged from 6.1-R's own ~46.6/46.5 KiB citation (the runtime-construction patch added a
  small handful of bytes to the chunk, as expected — nowhere near the ceiling). No `web_accessible_
  resources` key in either manifest (font asset still same-origin URL-loaded, D-13, untouched).
  **GOVERNANCE.** `pnpm audit --prod`: no known vulnerabilities. SBOM (`pnpm sbom`) regenerated:
  BYTE-IDENTICAL — the hand-rolled generator (`scripts/generate-sbom.ts`) sources component metadata from
  `pnpm list --prod --json` / `pnpm licenses list --prod --json` / `pnpm-lock.yaml`'s base
  `resolution.integrity`, none of which vary for a locally patched package (a pnpm-patched dependency still
  resolves to the same upstream registry tarball reference); the actual patch record lives only in
  `pnpm-lock.yaml`'s `temml@0.13.5(patch_hash=…)` snapshot key and in `patches/temml.patch` itself, which
  the generator does not currently read. Noted as a pre-existing generator limitation (it has no
  patched-dependency representation at all, not something this one patch broke) — NOT fixed here, out of
  this spike's scope. Licence: temml is MIT; a local patch of an MIT dependency carries no additional
  licence obligation, distributed alongside it under `patches/`. `single-dompurify` and codeDetect
  invariants: unaffected (covered by the full unit-suite pass above; this patch touches only `temml`).
  Golden fixtures: empty diff (no golden-file change).
  **WHAT THIS DOES NOT CHANGE.** No D-value; no tasks.md box ticked (this is a fix spike, not a milestone
  task); no engine swap; no Vite plugin; no render/feature code touched (`mount.ts`, the sanitizer
  profiles, `mathEnhancer.ts`/`mathView.ts` — all untouched). This does NOT resolve the 1.2-R fork by
  itself — it re-arms it: the milestone-close human fidelity walk (task 8.1-R) still owns the
  PROCEED/CLOSE-M11 judgment on fidelity grounds now that macro rendering is UNBLOCKED (it can test
  actual MathML fidelity, RULING 2's real axis, instead of failing on the very first macro).
  **Revisit-when:** the milestone-close human fidelity walk (task 8.1-R) makes its PROCEED/CLOSE-M11
  call — this fix is now one of its inputs, having cleared the blocker without pre-deciding the walk. The
  sequence resumes at task 6.2-R.

- **2026-09-09 · M11 SEQUENCING + TEMML-BUNDLING DEFECT — OUT-OF-SEQUENCE INVESTIGATION SPIKE RUN BEFORE
  6.2-R, ROUTED CLOSE-M11-LEANING: no cheap bundler-config fix survives contact with the shipped `.output`.**
  6.1-R's own header surfaced a shipped-build defect (real Temml macros — `\alpha`, `\frac`, any multi-letter
  control word — throw `Unsupported function name` through the actually-bundled chunk, arithmetic-only
  fixtures never having exercised it). The reviewer/human paused the task sequence (6.2-R deferred) to run
  this spike BEFORE 1.2-R's own deferred fidelity walk, since that walk and every remaining task rest on a
  render path that cannot render the "dense representative formula corpus" 1.2-R's own bar requires. This is
  a decision on the record, the same class as the 1.2-R sequencing deviation above.
  **ROOT CAUSE, CONFIRMED:** Temml's `Lexer.js` builds its token regex from a string containing the LONE
  (unpaired) UTF-16 surrogate escapes `\uD800`/`\uDBFF`/`\uDC00`/`\uDFFF` (the astral-surrogate-pair
  alternative, sitting BEFORE the control-word alternative in the source's own alternation order). Somewhere
  in the actual Vite/Rollup/esbuild chunking pipeline WXT drives for a dynamically-imported chunk, those lone
  surrogates get evaluated to real (invalid) UTF-16 code units and then re-serialized as literal UTF-8 text —
  which cannot represent an unpaired surrogate, so each one silently becomes U+FFFD. The corrupted character
  class (`[� d800-� dbff][� dc00-￿ dfff]`) balloons into an enormous range that happens to
  include `\` and every following letter, and because regex alternation is first-match-wins, it now
  intercepts every `\<word>` before the control-word alternative ever runs — hence `\a`/`\f`/`\t` as the
  "unsupported function name". Confirmed byte-for-byte identical in the shipped `.output/chrome-mv3/chunks/
  temml-*.js` and in Vitest's browser-mode dep-optimizer cache; confirmed CLEAN in `node_modules/temml/dist/
  temml.mjs` read directly and in bare `esbuild.transform`/`esbuild.build` calls against that same file
  (any charset, minified or not) — the corruption is specific to Vite/WXT's own pipeline, not to esbuild in
  isolation, and not reproducible with esbuild alone.
  **CHEAP FIXES TRIED, IN ORDER, EACH MEASURED, EACH REVERTED — NONE SURVIVES FOR THE SHIPPED BUILD:**
  (a) `esbuild.charset` forced both directions (`'utf8'` and `'ascii'`) plus `optimizeDeps.esbuildOptions.
  charset` alongside it, in `wxt.config.ts`'s `vite()` hook — BYTE-IDENTICAL rebuilt chunk both times. Root
  cause: WXT's own Vite builder (`core/builders/vite/index.mjs`) unconditionally overwrites
  `config.esbuild.charset = "ascii"` AFTER reading user config, so this knob was never actually reaching
  whatever step corrupts the chunk, in either direction.
  (b) `optimizeDeps.exclude: ['temml']` — FIXED the Vitest browser-mode test path outright (confirmed: a
  scratch macro test rendering `\alpha` through the real dynamic import passed in BOTH Chromium and Firefox
  once the dep-optimizer stopped touching temml) but had ZERO effect on `pnpm build`'s `.output` (production
  `vite build` does not consult `optimizeDeps` at all — byte-identical chunk). This partial fix was NOT
  landed: keeping it would make the test suite stop exercising the actually-shipped bundled path, which is
  the exact coverage gap 6.1-R just closed — adopting it would re-open that gap by construction, hiding the
  defect rather than fixing it.
  (c) `build.minify: false` — content-script size roughly doubled (340 KB → 682 KB unminified), proving the
  config WAS being read, but the temml chunk still carried the identical corrupted regex. Minification is not
  the corrupting step.
  (d) `build.target: 'esnext'` — byte-identical chunk, no effect.
  (e) `build.rollupOptions.external: ['temml']` — removes the chunk from the bundle graph entirely, which
  "fixes" the byte corruption only by deleting the feature: a bare `import('temml')` cannot resolve at
  runtime in an MV3 content script (no `node_modules`, no bare-specifier resolution in the browser). Not
  viable; not adopted.
  All five were reverted in full — `wxt.config.ts` and `vitest.config.ts` are back to their pre-spike
  committed content, `.output` and the Vitest dep-optimizer cache were cleared, no scratch files remain.
  **OUTCOME: CLOSE-M11-LEANING / FORK-LEVEL INPUT, not fixed.** "Temml cannot render macros through this
  toolchain via any cheap bundler-config change" is a genuine input to the deferred 1.2-R PROCEED/CLOSE-M11
  fork. A real fix (patching Temml's own regex construction to avoid embedding lone surrogates — e.g.
  building the surrogate-pair alternative from `String.fromCharCode` at runtime instead of a source-level
  escape, or a Vite plugin that transforms/vendors only this one string) is more than "cheap config" and is
  explicitly OUT OF THIS SPIKE'S SCOPE — it is 1.2-R's own fork territory, for the human to authorize.
  **WHAT THIS DOES NOT CHANGE:** no D-value; no tasks.md box ticked; no engine swap; no feature code; the
  1.2-R fork stays exactly as open as the 2026-09-07 entry above left it, now carrying this finding as input.
  **Revisit-when:** the milestone-close human fidelity walk / PROCEED-CLOSE-M11 fork (task 8.1-R) makes its
  call — this finding is one of its inputs. If PROCEED, the render-path fix becomes a hard prerequisite
  (whatever form it takes) before any macro-bearing fixture can be trusted; if CLOSE-M11, this finding is
  moot along with the rest of REVISIT-RULING 3's fallback.

- **2026-09-07 · M11 1.2-R SEQUENCING DEVIATION — the fidelity walk's human PROCEED/CLOSE-M11 JUDGMENT is
  DEFERRED to milestone-close; groups 2-R–8-R proceed CONDITIONALLY. A human-authorized build-at-risk
  choice, banked so it is a decision on the record, not a silent corner-cut.** The reopened `tasks.md`
  sequences Group 1-R (the merged fidelity-and-byte gate) FIRST, gating everything after it, so no
  rendering/sanitizer/enhancer work begins until the PROCEED/CLOSE-M11 fork resolves (plan (h);
  `decisions.md` M11 GATE 3 — REVISIT). Task 1.1-R (`a70a556`) discharged the BYTE axis and INPUT A; a
  subsequent byte-forecast spike ruled the remaining groups COMFORTABLE (~26–27 KiB projected
  end-of-milestone `.output` headroom both engines, plus a measured ~29 KiB URL-font reserve that does NOT
  trigger `web_accessible_resources`). Task 1.2-R's other axis — the human Chrome+Firefox visual-fidelity
  walk judged against REVISIT-RULING 2's readable-on-both bar — is HUMAN-RUN, NO AGENT SUBSTITUTE, and the
  human is batching all hands-on testing to milestone-close by preference.
  **THE DEVIATION:** 1.2-R is split into (i) its AGENT-PREPARABLE half — a durable, both-engine-loadable
  fidelity harness (real Temml + the STIX Two Math subset via `document.fonts.add()`, rendering the dense
  representative corpus) plus committed Chromium+Firefox screenshots, built now — and (ii) its
  HUMAN-JUDGMENT half — the actual readable-on-both ruling — DEFERRED to the milestone-close walk (task
  8.1-R's own human gate is the natural venue). **Task 1.2-R's box stays `[ ]`; the PROCEED/CLOSE-M11 fork
  stays FORMALLY OPEN.** Groups 2-R–8-R proceed CONDITIONALLY on the explicit understanding that the
  deferred human walk is where the fork actually resolves.
  **THE CONDITIONS (binding on every task from 2-R on):** (1) each task from 2-R onward states, in its own
  commit, that it proceeds UNDER THE OPEN 1.2-R FORK — built conditionally, not on a passed fidelity gate.
  (2) If the milestone-close human walk rules CLOSE-M11 (Chrome rendering below REVISIT-RULING 2's bar),
  REVISIT-RULING 3's fallback fires: the built groups-2-R–8-R work AND the temml/font/tokenizer install are
  REVERTED (the same disposition 1.2-R's own CLOSE branch already specifies), and M11 closes shipping no
  math. (3) The byte axis is NOT re-opened by this deviation — the forecast settled it; a late `.output`
  bust from any group remains that group's own close trigger, independently.
  **THE RISK, NAMED (this is a build-at-risk authorization, eyes open):** deferring the fidelity judgment
  means groups 2-R–8-R are built ON TOP OF an unverified fidelity axis. If the close-walk rules CLOSE-M11,
  that built work is discarded (a clean revert, not a rework — bounded, but real). The sealed plan put the
  walk FIRST precisely to avoid this; this deviation accepts the exposure in exchange for batching hands-on
  testing to close. The forecast having retired the BYTE axis means the deferred unknown is fidelity ALONE,
  not fidelity-and-bytes — which bounds the risk but does not remove it.
  **WHAT THIS DOES NOT CHANGE:** no D-value; no scope; REVISIT-RULING 2's readable-on-both bar (unchanged,
  just judged later); REVISIT-RULING 3's fallback (unchanged, its trigger moved to the close-walk);
  INPUT A/B (discharged/established at 1.1-R, unaffected); the requirement that the walk be real-engine,
  both engines, extension-or-harness loaded, no agent substitute for the human judgment. It does not tick
  1.2-R, approve any gate, or edit any status line.
  **Revisit-when:** the milestone-close human fidelity walk (task 8.1-R) rules PROCEED (1.2-R ticks, M11
  ships math) or CLOSE-M11 (RULING 3 fires, built work + install revert). Every conditional commit from
  2-R on carries the open-fork caveat until then.

- **2026-09-06 · M11 GATE 3 — REVISIT — the reopened `tasks.md` decomposition (spec 011, math rendering)
  APPROVED. IMPLEMENTATION IS RE-AUTHORIZED — task 1.1-R onward, a FRESH SESSION. ALL THREE REOPEN GATES
  (spec revisit, plan revisit, tasks revisit) ARE NOW PASSED.** `specs/011-math-rendering/tasks.md`'s dated
  "TASKS REVISIT — 2026-09-06" block (draft `9f34e65`) was reviewed and approved at gate 3. **`tasks.md`'s
  own status line stays "DRAFT awaiting gate 3 — REVISIT" and THIS ENTRY IS THE APPROVAL OF RECORD** — the
  bank-not-artifact precedent held since M7 and through this milestone's own gate-1-revisit and
  gate-2-revisit; the reopen changes the task BODY (a genuine re-decomposition caused by the plan reopen),
  not its status line. The original `tasks.md` §§1–9 (including the original task 1.1's `[x]` and its
  committed RESULT block — the branch-(C) measurement that caused this whole reopen) are PRESERVED as
  history and were not un-ticked or overwritten.
  **THE APPROVAL:** the reopened decomposition — **EIGHT groups, FIFTEEN tasks** (1-R:2 · 2-R:1 · 3-R:2 ·
  4-R:3 · 5-R:1 · 6-R:2 · 7-R:1 · 8-R:3), group 7 (MathJax) REMOVED ENTIRELY (not struck-in-place; group
  numbering collapses, original 8→7-R, 9→8-R) — is APPROVED as M11's reopened implementation plan. It
  decomposes against `plan.md`'s PLAN REVISIT block (D-1-R…D-13, the (h) fidelity-spike-first sequence); no
  D-N-R and no prior revisit ruling is reopened. The gate-1-revisit and gate-2-revisit rulings stay
  inherited-closed: MathML/Temml direction (Temml candidate-to-verify, not pinned); the readable-on-both-
  engines fidelity bar; the close-M11 pre-stated fallback firing on EITHER axis; MathJax struck; §9-2/§9-3
  hold (§9-3 MathML-only), §9-4 vacated; §8-1 survives-and-simplifies with its original-gate-3 panel/menu-row
  placement carried, not reopened.
  **INPUT A — DISCHARGED, CONFIRMED.** The reopened Group 1-R (task 1.1-R) carries the font-loading
  firing-control obligation as a real-engine (Chrome+Firefox) computed-`font-family` proof inside the app
  page's shadow root — a rendered formula resolves to the bundled family, not a fallback — WITH a negative
  control (a deliberately-wrong `@font-face` source must FAIL the same assertion), plus re-verification that
  Temml's font needs no `web_accessible_resources` key. This is the obligation discharged concretely, not
  restated.
  **INPUT B — DISCHARGED, CONFIRMED.** The reopened decomposition rewrites the content-script byte invariant
  as a DELTA assertion: bytes move by exactly the chosen tokenizer's own always-loaded floor, landing ONCE
  at task 3.2-R (never at Group 1-R's scratch spike); pre-3.2-R tasks assert md5-identity against the
  corrected **336,123 B** baseline, 3.2-R itself uses a DELTA firing control (floor moved by exactly the
  expected amount, no more), and every task after 3.2-R asserts against 3.2-R's own post-floor figure, never
  the pre-math baseline again — with the stale-form failure named explicitly so no later task carries it.
  The `$x$`-renders-as-inert-`<code>`-on-`file://` behavioral cousin is priced as a named cost in task
  3.1-R's golden audit.
  **RULING R-a — the struck-package revert folded into task 1.1-R: RATIFIED.** The reopened 1.1-R reverts
  `katex` and `@mathjax/src` (left installed by the original 1.1's deliberately-open branch-(C) disposition,
  pending exactly this human-reviewed reopen; struck by REVISIT-RULINGS 1/4) IN THE SAME COMMIT as it
  installs `temml` and resolves the tokenizer fork. This was a drafting-pass judgment call beyond the
  tasks-revisit kickoff's literal text, flagged as such. **APPROVED as correct:** a byte gate cannot
  honestly measure headroom against a dependency set still carrying two struck packages, so the revert
  belongs inside 1.1-R, not deferred — the dep-count Verify (`9 → 8`) is coherent only because the revert
  lands there. This resolves the disposition question the original branch (C) left open for the PROCEED
  path; 1.2-R's CLOSE-M11 branch separately reverts `temml`/tokenizer/font in its own commit.
  **RULING R-b — the 336,123 B content-script baseline is AUTHORITATIVE; the stale 334,858 B is
  knowingly-superseded, not an error to chase now.** The original 1.1 measured content-script bytes at
  336,123 B both engines on a fresh clean rebuild (its own base-line-divergence finding, `--frozen-lockfile`
  confirming no dependency drift), where the original `tasks.md` standing-invariants header and AGENTS.md
  both still state 334,858 B. The reopened TASKS REVISIT block carries 336,123 B correctly and explains the
  divergence. **This gate confirms 336,123 B as the live figure for the reopened milestone**; the two stale
  citations (the original header, AGENTS.md) are KNOWINGLY LEFT — each is outside every revisit's Files fence
  and is superseded by the reopened block — carried for whoever next edits either, not corrected here (the
  same don't-chase-outside-the-fence discipline the reopen has held throughout).
  **RULING R-c — D-13's font-family finalization split across 1.1-R and 8.1-R: APPROVED AS A DELIBERATE
  DEFERRAL.** Task 1.1-R chooses the bundled math-font family (Latin Modern Math / Noto Sans Math / STIX Two
  Math) IF its representative-corpus glyph-coverage measurement makes one candidate clearly superior,
  otherwise defers the final choice to task 8.1-R's full-document-scale walk (plan (h)'s own "if not already
  settled" framing). **This is a sanctioned deferral, not an oversight** — whoever runs 1.1-R deferring the
  family choice is following the approved plan, not leaving a gap; 8.1-R owns finalizing it if 1.1-R's
  corpus did not.
  **WHAT THIS AUTHORIZES:** implementation resumes at **task 1.1-R, in a fresh session**, per WORKFLOW.md
  §5.3, now re-satisfied for the reopened decomposition. 1.1-R + 1.2-R together are the merged
  fidelity-and-byte gate whose two-axis fork (PROCEED → Group 2-R onward; CLOSE-M11 → revert + suspend on
  either axis failing) settles whether M11 ships math or closes — the structural mirror of how the original
  task 1.1's fork gated the milestone.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install `temml`, any tokenizer package, or any math font
  (1.1-R's job); pin the font family/subset strategy beyond what 1.1-R's corpus makes obvious (R-c); choose
  finally between `@mdit/plugin-tex` and a Temml-native tokenizer (1.1-R's job); write render code; build the
  extension; resolve the fidelity-and-byte fork (1.1-R/1.2-R's own outcome); correct the stale 334,858 B
  citations (R-b); or edit any status line. It reopens no D-N-R and no prior ruling.
  **Revisit-when:** task 1.1-R's tokenizer-fork resolution + byte measurement and task 1.2-R's fidelity walk
  settle the PROCEED/CLOSE-M11 fork; RULING R-c's font-family choice finalizes at 1.1-R or 8.1-R; the D-N-R
  landed-with-its-commit audit runs at task 8.3-R.

- **2026-09-06 · M11 GATE 2 — REVISIT — the reopened `plan.md` architecture (spec 011, math rendering)
  APPROVED AS THE SEALED-REOPENED ARCHITECTURE, WITH TWO TASKS-REVISIT INPUTS RECORDED. The `tasks.md`
  REVISIT is AUTHORIZED as the next artifact and the last planning gate.** `specs/011-math-rendering/plan.md`'s
  dated "PLAN REVISIT — 2026-09-06" block (draft `bee9a83`) was reviewed and approved at gate 2. **The
  plan's status line stays "draft (Gear-3 gate 2 — REVISIT — awaiting human approval before `tasks.md`
  revisit)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the bank-not-artifact precedent held since M7 and
  through this milestone's own gate-1-revisit; the reopen changes the plan BODY (a genuine architecture
  re-draft caused by the spec reopen), not its status line.
  **THE APPROVAL:** the revised D-value set (D-1-R … D-9-R, D-12-R, the new D-13, D-10/D-11 vacated) and the
  reopened group sequence (fidelity-spike-first, group 7 struck) are APPROVED as M11's reopened architecture
  — the reopened `tasks.md` decomposes against this, no D-N-R is reopened. The R-0 call-site re-verification
  (`readerPane.ts:187`/`appShell.ts:170` unchanged at HEAD, no drift) is accepted as fact. The gate-1-revisit
  rulings (`decisions.md`'s "M11 GATE 1 — REVISIT", 2b70d94) stay inherited-closed: MathML/Temml direction;
  the readable-on-both-engines fidelity bar; the close-M11 pre-stated fallback; MathJax struck.
  **THE REVISED ARCHITECTURE, CONFIRMED:**
  - **The single engine module (D-2-R)** — one `mathEngine.ts` importing Temml (candidate to verify, not
    pinned, not installed); MathJax's permanent strike collapses D-2's two-file contingency to one.
  - **The re-derived config lockdown (D-4-R)** — Temml's failure semantics and option defaults verified
    against the real installed package, NOT ported from KaTeX's `trust`/`throwOnError`; the `htmlAndMathml`
    output-mode pin VACATED (no duality to preserve), and named as vacated, not silently dropped.
  - **The simplified sanitizer profile (D-5-R)** — one MathML-only allow-list, enumerated against real
    installed Temml output; `cleanMathStyle`'s own need left an OPEN QUESTION for the group-2-R task (does
    Temml emit `style` at all), correctly not assumed either way.
  - **The simplified copy path (D-6-R / §8-1)** — copy-as-LaTeX reads retained source (unchanged);
    copy-all-as-MathML clones the single rendered `<math>` tree; §8-1 option (b) survives and simplifies.
  - **The carried-mechanism D-values (D-3-R, D-7-R, D-8-R, D-9-R, D-12-R)** — surface/call-sites, inline
    mutate-in-place, block sibling-figure, the theme-inheritance LEAN (strengthened for native MathML but
    still a task-time measurement), and no-speculative-cache — all carry mechanism unchanged, re-pointed at
    the revised set.
  - **The new central budget line (D-13)** — one subsetted OpenType MATH font as a REQUIRED Chrome-fidelity
    asset (Latin Modern Math / Noto Sans Math / STIX Two Math named, none chosen; family + subset strategy
    the impl gate's call).
  - **The group sequence (supersedes §6)** — Group 1-R is a MERGED fidelity-AND-byte gate (Temml JS +
    tokenizer floor + subsetted font bytes measured together, AND a real-engine Chrome+Firefox visual walk
    against the readable-on-both bar), passing-on-BOTH-axes-or-fire-the-close-M11-fallback (RULING 3);
    nothing renders, sanitizes, or enhances ahead of it. Group 7 (MathJax) STRUCK ENTIRELY, not dormant.
  **TWO INPUTS RECORDED FOR THE `tasks.md` REVISIT (flagged at gate-2-revisit review; the reopened `tasks.md`
  must discharge them, not restate-and-move-on):**
  - **INPUT A · D-13's font-loading needs a FIRING-CONTROL-shaped obligation, not a byte check alone.** The
    plan (D-13) correctly flags the `@font-face` WOFF2 inside the shadow-root CSS-injection pattern as a
    build/inject shape distinct from the original §1.4 KaTeX `url()` font handling, to be re-verified not
    assumed. The reopened Group 1-R font task must PROVE the subsetted font actually loads AND applies inside
    the shadow root (a rendered formula computes to the bundled family, not a fallback), not merely that the
    bytes landed in `.output` — a font that ships but does not apply passes a naive byte check and fails the
    visual walk for a plumbing reason masquerading as a fidelity one.
  - **INPUT B · The content-script byte invariant must be REWRITTEN in the reopened `tasks.md`, with the
    delta as the assertion, not zero.** D-1-R states the tokenizer lands on `parse.ts`'s shared markdown-it
    instance — on BOTH graphs, +3,957 B each (task 1.1) — FALSIFYING `tasks.md`'s standing "content-script
    bytes byte-identical for the whole milestone" invariant. The reopened `tasks.md`'s standing-invariants
    block must read "content-script bytes move by EXACTLY the chosen tokenizer's own always-loaded floor
    (the reopened Group 1-R re-measures the exact figure for the actually-chosen candidate) and by nothing
    else" — and the CS-byte firing control becomes a DELTA assertion (the floor moved by exactly the
    expected amount, no more), never a byte-identity/zero-delta assertion. The behavioral cousin (a `$x$`
    span rendering as inert `<code>` on the `file://` reader, `enhanceMath` never running there) is priced
    by the reopened group-3-R golden audit as a named cost, not waved through.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install Temml, any tokenizer package, or any math font;
  pin the font family or subset strategy; choose the tokenizer between `@mdit/plugin-tex` and a Temml-native
  alternative; write `tasks.md` or any render code; build the extension; resolve the fidelity-and-byte gate
  (Group 1-R's own first task); or edit `plan.md`/`spec.md` status lines. It reopens no D-N-R.
  **Revisit-when:** the `tasks.md` REVISIT (the next artifact, the last planning gate) decomposes the
  reopened architecture into ordered tasks, discharging INPUT A and INPUT B above; the fidelity-and-byte
  gate (Group 1-R) then settles the proceed-or-close fork the same way task 1.1 settled the dependency fork.

- **2026-09-06 · M11 GATE 1 — REVISIT — the reopened `spec.md` scope (spec 011, math rendering) APPROVED,
  ON THE MathML/Temml PATH, WITH A RULED FIDELITY BAR AND A PRE-STATED CLOSE-M11 FALLBACK. The `plan.md`
  REVISIT is AUTHORIZED as the next artifact and the next gate.** `specs/011-math-rendering/spec.md`'s
  dated "REVISIT — 2026-09-06 (post task 1.1, branch (C))" block (draft `e13284f`) was reviewed and
  approved. **The spec's status line stays "draft (Gear-3 gate 1 — REVISIT — awaiting human approval
  before `plan.md` revisit)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the same bank-not-artifact
  precedent held since M7 (007–010 and the original M11 GATE 1/2/3 all read "draft" post-gate); the reopen
  changes the spec BODY (a genuine scope re-draft caused by task 1.1's branch (C)), but not its status line.
  **THE REOPEN CAUSE (inherited-closed, not re-litigated):** task 1.1 (`ae83fa1`) settled RULING 1 (§9-1)
  as branch (C) — client-side HTML-rendered math does not fit the ~352.8/352.7 KiB `.output` /
  ~607.8/607.7 KiB zip headroom (KaTeX busts ~3.8×, 1,072,948 B of it self-hosted fonts; MathJax busts
  independently AND fails `pnpm audit --prod`). M11 reopens on the one path that evidence leaves live.
  **THE APPROVAL — the reopened scope (spec REVISIT (a)–(g)) is the current milestone scope; `plan.md`
  decomposes against it, no clause below is reopened:**
  - **REVISIT-RULING 1 · Direction — APPROVED: reopen on browser-native MathML output.** Leading engine
    candidate **Temml** (a lightweight KaTeX-derived LaTeX→MathML converter, coverage ≥ KaTeX), NAMED AS
    THE CANDIDATE TO VERIFY 1.1-style (size/licence/ESM shape/install-scripts/coverage against the real
    package) at the reopened implementation gate — NOT pinned, NOT installed by this approval. App-page-only,
    zero-network, lazy-loaded, degrade-to-source all carry from the original.
  - **REVISIT-RULING 2 · The fidelity bar — RULED (a product-feel call, ruled fresh by the human, the same
    posture the original §9-4 reserved for product-feel decisions): ACCEPTABLE, READABLE MATH TYPESETTING
    ON BOTH CHROME AND FIREFOX, WITHIN HEADROOM.** Explicitly NOT "visually equivalent to KaTeX's HTML
    layout on both engines" — the stricter bar would pre-select close-M11 (MathML cannot promise KaTeX-HTML
    fidelity on Chrome), so the reopen is ruled at the readable-on-both bar. Chrome's known MathML layout
    limitations (radical/integral/stretchy-delimiter sizing on system fonts) are the reason spec REVISIT (c)
    treats a bundled OpenType MATH font as required; whether the bar is met with the chosen font is the
    gate's own measurement, not this approval's assumption.
  - **REVISIT-RULING 3 · The pre-stated fallback — APPROVED: CLOSE M11 (ship no math rendering) if the
    reopened implementation's first task — a real-engine Chrome+Firefox visual-fidelity walk of Temml
    MathML with the chosen bundled math font, PLUS the byte measurement of Temml JS + font + CSS against
    headroom — fails on EITHER axis (font busts headroom, or Chrome rendering falls below RULING 2's bar).**
    The symmetric analogue of the original KaTeX-only fallback; a legitimate, named outcome, not a failure
    to plan around.
  - **REVISIT-RULING 4 · MathJax — STRUCK, permanently, reason recorded.** Task 1.1 measured it busting
    headroom (1,339,852 B) AND failing `pnpm audit --prod` (2 HIGH, via `mj-context-menu → … →
    brace-expansion`); its SVG-output "browser-independent fidelity rescue" angle was considered and ruled
    out on those same two grounds. Not to be re-proposed without re-measuring both figures fresh. §3.11/§9-4
    (the MathJax toggle) are VACATED accordingly.
  **THE ORIGINAL §9 RULINGS, RECONCILED (as stated in spec REVISIT (g), confirmed here):** §9-1 (dependency
  set) SETTLED by task 1.1, superseded by REVISIT-RULING 1. §9-2 (app-page-only) STILL HOLDS, unchanged.
  §9-3 (a distinct math-shaped sanitizer profile) STILL HOLDS, now SIMPLIFIED to a MathML-only allow-list
  (no parallel KaTeX HTML vocabulary). §9-4 VACATED (RULING 4). Gate-2's §8-1 (inline copy: text-selection
  for LaTeX, a document-level copy-all-as-MathML action) SURVIVES and SIMPLIFIES — the copy-all action now
  clones the single MathML tree every formula already renders to. The original §3.7 zero-network requirement
  HOLDS, its firing control re-aimed at a remote MATH-FONT fetch specifically.
  **CARRIED INTO THE `plan.md` REVISIT as engine-agnostic inputs (not resolved here):** (1) the math
  tokenizer lands on `parse.ts`'s shared markdown-it instance, on BOTH the app-page and content-script
  graphs (+3,957 B each, task 1.1), FALSIFYING `tasks.md`'s "math never enters the content-script graph"
  invariant the moment a parse rule lands — the reopened plan prices this, does not assume it away; (2) the
  `@mdit/plugin-tex` ↔ `markdown-it@^15`-vs-`14.3.0` peer-dep tokenizer-correctness risk; (3) Temml's own
  failure semantics (throw vs. error-node vs. a rendered error element) and option defaults are NOT assumed
  to match KaTeX's — the plan re-derives the D-4-analog config lockdown against the real installed Temml,
  not by porting KaTeX's `throwOnError`/`trust` shape by reflex.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install Temml or any math font, pin either, choose the
  bundled math-font family (Latin Modern Math / Noto Sans Math / STIX Two Math — the plan/impl gate's call),
  choose the tokenizer, write `plan.md` or `tasks.md`, resolve the fidelity-and-byte gate (RULING 3's own
  first reopened task), or edit `spec.md`'s status line. It reopens no clause of the REVISIT block it approves.
  **Revisit-when:** the `plan.md` REVISIT (the next artifact, next gate) decomposes the reopened scope into
  a revised D-value set with a fidelity-spike-first task ordering; the fidelity-and-byte gate (RULING 3)
  then settles the proceed-or-close fork the same way task 1.1 settled the dependency fork.

- **2026-09-06 · M11 GATE 3 — `tasks.md` (spec 011, math rendering) APPROVED, WITH THREE FINDINGS RULED
  (ONE RULED-AS-FRAMED, ONE RULED CONCRETELY, ONE NO-ACTION-DEFERRED). IMPLEMENTATION IS AUTHORIZED — task
  1.1 onward, a FRESH SESSION (C14), not here.** `specs/011-math-rendering/tasks.md` was reviewed and
  approved at gate 3. **`tasks.md`'s own status line stays "DRAFT awaiting gate 3" and THIS ENTRY IS THE
  APPROVAL OF RECORD** — the same bank-not-artifact precedent this project has held since M7:
  007/008/009/010 all still read "draft" post-their-own-gates; `tasks.md`'s one substantive gate-3
  correction (below) is made in the file's own task text, but its status line is not one of them.
  **THE APPROVAL:** the nine-group / 16-task breakdown (18 if group 7 opens) is APPROVED as M11's
  implementation plan. Task 1.1 — the byte-measurement hard gate, structured as the explicit three-way fork
  (KaTeX+MathJax ships / KaTeX-only with group 7 struck / suspended pending a spec revisit) — settles
  RULING 1 (§9-1), unchanged in shape from gate 1's own framing, now also measuring `@mdit/plugin-tex`
  (D-1's tokenizer, an always-loaded parse-graph dependency) alongside `katex`/MathJax per gate 2's own
  measurement fix. The sealed architecture (D-1…D-12, `plan.md` §0) and every prior gate ruling (gate-1's
  four §9 rulings, gate-2's §8-1 = option (b) and the Group-1 `@mdit/plugin-tex` measurement fix) stay
  inherited-closed throughout — no D-value and no prior ruling is reopened by this approval.
  **FINDING 1 — THE CONCRETE MATHJAX PACKAGE NAME: APPROVED AS-FRAMED, NOT PINNED.** `tasks.md`'s preamble
  named `mathjax-full` as task 1.1's working candidate to verify against the current registry (licence,
  maintenance cadence, ESM/CJS shape, install scripts) before installing, on the identical
  "measure, don't assume" posture 010's own Ruling 1 applied to its ZIP-writer package. **This gate does
  NOT pin `mathjax-full` as the shipped package** — task 1.1 measures it and MAY find a lighter build (a
  component build, a lazy-loadable distribution) fits the headroom better where the full build does not.
  The candidate name is approved as the starting point for that measurement, not as a settled choice.
  **FINDING 2 — THE DOCUMENT-LEVEL "COPY ALL FORMULAS AS MATHML" ACTION'S UI PLACEMENT: RULED.** `tasks.md`'s
  preamble flagged this action (§8-1's ruled mechanism, gate-2 option (b)) as having no stated UI home — a
  toolbar button, a keyboard shortcut, and a panel/menu row were named as live, undecided options, routed
  to task 6.2 to resolve at task time. **RULED: a PANEL/MENU-ROW action — NEVER a toolbar button and NEVER
  a keyboard shortcut.** Reasoning: this is a rare, document-level, export-shaped action, not a frequent
  one, so it does not earn prime toolbar real estate; spec §3.10's anti-clutter posture and spec §4's
  no-new-global-single-key-shortcut constraint both push against a shortcut. It lives as a menu/panel row
  wherever the app-page's existing action affordances already live — the M10 export-panel precedent, or the
  equivalent menu surface — with task 6.2 placing the exact row/label/menu-location concretely within that
  ruled shape. **★ THIS RESOLVES THE FINDING `tasks.md` ROUTED TO TASK 6.2 AS OPEN**: 6.2 now builds a
  panel/menu-row action, not an open-placement question. `tasks.md`'s own task 6.2 text is corrected in
  place (2026-09-06) to state this ruled placement, per the one-substantive-correction rule this entry's
  gate-2 counterpart used for `plan.md`'s own Group 1 fix.
  **FINDING 3 — RULING 4 MAY PAUSE TASK 7.2: NO ACTION, CORRECTLY DEFERRED.** `tasks.md`'s preamble restated
  (not newly raised) that RULING 4 (toggle semantics, gate-1 §9-4) stays moot until task 1.1 ships MathJax,
  and that task 7.2 itself already notes it must stop and flag back for that ruling before scoping the
  settings field/toggle concretely if group 7 opens before RULING 4 lands. **This finding needs no gate-3
  action** — it is a correct restatement of an already-deferred contingency, not a new open question; task
  7.2's own noted pause-point stands as written.
  **WHAT THIS APPROVAL DOES:** approves the nine-group/16-task breakdown as M11's implementation plan;
  approves-as-framed Finding 1 (the candidate package, not a pinned one); RULES Finding 2 (panel/menu-row
  placement) and corrects `tasks.md`'s task 6.2 text to state it; confirms Finding 3 needs no action;
  AUTHORIZES IMPLEMENTATION — task 1.1 onward — in a fresh session (C14), per WORKFLOW.md §5.3's "no
  implementation code before `tasks.md` is approved," now satisfied. **All three of M11's planning gates
  (gate 1 spec, gate 2 plan, gate 3 tasks) are now PASSED.**
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install any dependency, run task 1.1's own measurement
  (RULING 1 stays open pending that task), pin the MathJax package name, or reopen any D-value, any prior
  gate ruling, or any plan §3.5 audit row. It does not edit `spec.md` or `plan.md`. **Revisit-when:** task
  1.1's own measurement (RULING 1, unchanged in shape by this gate); RULING 4 (toggle semantics), if and
  only if RULING 1 ships MathJax and group 7 opens.

- **2026-09-06 · M11 GATE 2 — `plan.md` (spec 011, math rendering) APPROVED AS THE SEALED ARCHITECTURE,
  WITH ONE RULING (§8-1) AND ONE MEASUREMENT FIX (GROUP 1). `tasks.md` is AUTHORIZED — a fresh session
  (C14), not written here.** `specs/011-math-rendering/plan.md` was reviewed and approved at gate 2.
  **`plan.md`'s own status line stays "draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)"
  and THIS ENTRY IS THE APPROVAL OF RECORD** — the same bank-not-artifact precedent this project has held
  since M7: 007/008/009/010 all still read "draft" post-their-own-gates; `plan.md`'s two substantive
  gate-2 corrections (below) are made in the plan text itself, but its status line is not one of them.
  **THE APPROVAL:** the twelve D-values (D-1…D-12, `plan.md` §0) and the nine-group sequence (`plan.md`
  §6) are APPROVED as M11's sealed architecture — `tasks.md` decomposes against this architecture; no
  D-value is reopened. The four gate-1 rulings (`decisions.md`'s 2026-09-06 M11 GATE 1 entry) stay
  inherited-closed, unchanged by this approval: RULING 1 (§9-1, the dependency set) remains MEASURED-not-
  assumed at task 1.1; RULING 2 (app-page-only) and RULING 3 (the sanitizer profile) stay CONFIRMED;
  RULING 4 (toggle semantics) stays DEFERRED, contingent on RULING 1.
  **RULING §8-1 — THE INLINE-COPY AFFORDANCE GAP: OPTION (b) RULED.** `plan.md` §8-1 named two live
  options for how inline math's copy-as-LaTeX/copy-as-MathML actions are reached, since D-7's inversion
  (inline math has no sibling slot to anchor a per-formula hover/focus control group in) means block
  math's own mechanism (D-6, the control group) cannot serve inline math unmodified. **RULED: inline math
  relies on ORDINARY TEXT-SELECTION plus the browser's own copy — no dedicated per-formula inline chrome.**
  A hover/focus popover on a `$x$` mid-sentence would itself be the clutter spec §3.10 declines a context
  menu to avoid; option (a) (a keyboard-focusable `<code>` with its own popover) is REJECTED on that
  ground. Concretely: copy-as-LaTeX for inline math is satisfied by select-and-copy of the retained source
  text already on screen — zero new code, since the literal `$…$` source is what the `<code
  class="peekover-math-inline">` element's own text content is at rest (D-7). Copy-as-MathML for inline
  math — which text-selection cannot produce, since the rendered MathML tree is not what a text selection
  serializes — is served by a DOCUMENT-LEVEL "copy all formulas as MathML" action (one action covering
  every formula, block and inline, in the document), materially smaller in scope than a per-formula inline
  popover would have been. **Block math's own control group (D-6/007 D-15's shape) is UNCHANGED by this
  ruling** — it keeps per-formula copy-as-LaTeX and copy-as-MathML exactly as `plan.md` §0/D-6 already
  states.
  **★ THIS AMENDS SPEC §4's COPY CRITERION, recorded here rather than by editing `spec.md`, per the
  gate-rulings-live-in-the-bank precedent this project has held since M7 (`spec.md` stays sealed;
  `decisions.md`'s gate entry is where a ruling that revises a spec assumption lives).** §4, as written,
  reads as if one hover/focus mechanism serves both inline and block math's per-formula copy actions. Post-
  ruling, §4's copy criterion is: **block math offers per-formula copy-as-LaTeX AND copy-as-MathML through
  its hover/focus control group, unchanged; inline math offers copy-as-LaTeX via ordinary text-selection of
  its retained source, and copy-as-MathML via a document-level "copy all formulas as MathML" action, NOT a
  per-formula inline affordance.** This is a genuine, honest gate-2 correction of a spec assumption `plan.md`
  proved could not hold as literally written (D-7's forced inversion), not a silent scope change — the gap
  was surfaced at gate 2 (`plan.md` §8-1, §3.5 audit's "new" row) and is ruled here, not patched around.
  **THE GROUP-1 MEASUREMENT FIX.** `plan.md`'s Group 1 (task 1.1's byte measurement) named measuring
  `katex` and the ruled MathJax package, but omitted `@mdit/plugin-tex` (D-1's chosen tokenizer) from that
  measurement list. **This is corrected: Group 1 MUST also measure `@mdit/plugin-tex`**, because unlike
  the two render engines (lazy-loaded only when a document contains math, D-2/§4), `@mdit/plugin-tex` is an
  ALWAYS-LOADED parse-graph dependency (`parse.ts` uses it unconditionally per D-1) — a guaranteed byte
  floor on every document, math or not, and omitting it from Group 1's measurement understated the
  milestone's guaranteed cost. This is the M10-fonts-trap analogue: measure every new dependency, including
  the one that is always loaded, not only the ones that are conditionally loaded. `plan.md`'s own Group 1
  text is corrected in place (2026-09-06) to name `@mdit/plugin-tex` alongside `katex`/MathJax, measured
  and decomposed to its own residual the same as the two engines.
  **WHAT THIS APPROVAL DOES:** seals `plan.md`'s architecture (D-1…D-12, the nine groups); rules §8-1
  (option (b)) and its §4 amendment (above); fixes Group 1's measurement list to include
  `@mdit/plugin-tex`; AUTHORIZES `tasks.md` as the next artifact, in a fresh session (C14), per WORKFLOW.md
  §5.3's "no implementation code before `tasks.md` is approved."
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install any dependency, write `tasks.md`, or run task
  1.1's own measurement (RULING 1 stays open pending that task); it does not reopen any D-value, any
  gate-1 ruling, or `plan.md` §3.5's audit rows beyond the one (§8-1) ruled above; it does not edit
  `spec.md`. **Revisit-when:** task 1.1's own measurement (RULING 1, unchanged in shape by this gate);
  RULING 4 (toggle semantics), if and only if RULING 1 ships MathJax.

- **2026-09-06 · M11 GATE 1 — spec 011 (math rendering: KaTeX, contingent MathJax fallback, inline/block/
  fence math, copy-as-LaTeX/MathML) APPROVED, WITH FOUR RULINGS (TWO SETTLED, ONE DEFERRAL-APPROVED, ONE
  CONTINGENT-PENDING). `plan.md` is the next artifact and the next gate.** `specs/011-math-rendering/spec.md`
  was reviewed and approved. **The spec's status line stays "draft (Gear-3 gate 1 — awaiting human approval
  before `plan.md`)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the standing precedent from M7/M8/M9/M10:
  007 still reads "draft" post-gate-1 (`e09520f`); 008 still reads "draft" post-gate-1 (`aaf990e`,
  2026-08-03 M8 GATE 1); 009 still reads "draft" post-gate-1 (2026-08-14 M9 GATE 1); 010 still reads
  "draft" post-gate-1 (2026-08-22 M10 GATE 1, below) — gate approvals live in the bank, not in the
  artifact's status line.
  **THE APPROVAL:** M11 delivers F2's remaining half — KaTeX-rendered inline `$…$` and block `$$…$$` math,
  code-fence math (a ` ```math ` fence), copy-as-LaTeX and copy-as-MathML per formula, zero-network proof,
  and a math-shaped sanitizer profile, at full scope. A MathJax fallback toggle ships CONTINGENTLY, per
  RULING 1 below — the milestone's own dependency-set fork, measured, not assumed, at task 1.1.
  **THE FOUR RULINGS, spec §9 (verbatim from the human's review):**
  - **RULING 1 · §9-1, the math-render dependency set (KaTeX+MathJax vs. KaTeX-only): APPROVED THE
    DEFERRAL — ruled from task 1.1's own byte measurement (§3.4/§8-1), forbidden from being assumed.**
    Gate 1 approves that the dependency set is MEASURED-then-ruled, not chosen now — the M10 task-1.1
    hard-gate pattern (`docx`'s own bust, below), applied deliberately because math's byte weight is the
    milestone's own named central, front-loaded risk (§3.4: `.output` headroom ~352.8/352.7 KiB, zip
    headroom ~607.8/607.7 KiB, the thinnest margin any gate-1 in this project's history has opened
    against). The pre-stated fallback (KaTeX-only, if MathJax busts headroom) stands as §3.1 states it.
    No recommendation was given or taken — the measurement has not run. **Revisit-when:** task 1.1's own
    measurement, `plan.md`'s first move, before any rendering code is written.
  - **RULING 2 · §9-2, the content-script surface disposition: CONFIRMED APP-PAGE-ONLY.** The manifest
    argument (007's Mermaid precedent — a content script cannot load a separate packaged chunk without
    `web_accessible_resources`) plus the materially thinner byte margin than 007 had; math on the
    content-script surface is not built in M11 — math syntax stays literal text there, no affordance
    (§3.2/§4). No revisit-when named in the spec beyond a future milestone reconsidering that surface's
    capability set generally (§6) — this is a permanent scope decision for M11.
  - **RULING 3 · §9-3, the math-shaped sanitizer profile's disposition: CONFIRMED.** A second, distinct,
    math-specific sanitizer allow-list (007's SVG-profile precedent, D-1 shape); the document profile
    stays untouched. Architectural soundness ruled now so `plan.md` enumerates the profile's exact
    tag/attribute contents against a settled approach, not an open question (§3.5/§7-6).
  - **RULING 4 · §9-4, what "the toggle" toggles if MathJax ships at all (global-always-MathJax vs.
    automatic-fallback-on-KaTeX-gap): DEFERRED, explicitly moot until RULING 1's measurement shows
    MathJax ships at all.** If task 1.1's measurement includes MathJax in the ruled dependency set, this
    decision becomes live and is ruled then — a product-feel call, not a measured one, per §3.11/§9-4's
    own framing. If RULING 1 excludes MathJax, this decision is vacated outright. **No lean is recorded as
    binding** — whoever picks this up if MathJax ships rules it fresh as the product-feel call it is.
    **Revisit-when:** immediately after RULING 1's own measurement resolves, only if MathJax is in scope.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install KaTeX or MathJax, or move dependencies off the
  current 6; it does not resolve §3.6's math-cache lean, §7's nine open risks, or §8's three gate-3
  measure-then-choose items — all remain `plan.md`'s/`tasks.md`'s to resolve against the actual code; it
  reopens no other §3.x decision; it writes no `plan.md` or `tasks.md`.
  **Not a blocker for:** gate 2 (`plan.md`) or any subsequent gate — nothing above is unresolved, each
  ruling is stated so `plan.md` inherits it closed (or, for RULING 1/4, closed pending their own dependent
  measurement).

- **2026-09-06 · M10 §11.1 — RULING M-3's REVISIT-WHEN FIRES CLEAN: MARGINS/HEADER/FOOTER CONFIRMED-FINAL,
  NOT JUST PROVISIONAL.** Ruling M-3 (2026-09-04 M10 GATE, below) kept the shipped `@page` values
  provisional specifically pending "11.1's already-budgeted human walk," to "adjust there only if the eye
  finds a problem, not here on prose alone." 11.1's walk ran (real Chromium, extension loaded) and found no
  problem — margins **2cm/1.5cm/2.2cm**, header *"Peekover"*, footer *"Page X of Y"* all read correctly by
  eye. No adjustment made, per the ruling's own revisit-when. **M-3's status moves from "kept provisional
  pending visual walk" to CONFIRMED-FINAL** — nothing in the shipped `@page` block changes; this is a status
  update on the ruling, not a new decision. Rests on: `tasks.md` §11.1's DONE record; `progress.md`'s
  2026-09-06 § Now entry (task 11.1). No further revisit-when — the one condition M-3 named has now fired.

- **2026-09-04 · M10 GATE — TASK 10.4: THE HUMAN DECISION GATE (M-1/M-2/M-3 + 8.3's build-or-drop, RULED)
  AND THE BYTE-LEDGER'S FINAL RECONCILIATION. Four rulings recorded verbatim below, each tied to the
  finding it rests on — NOT re-adjudicated here; CC records what the human ruled.**

  **RULING M-1 — the first-ever-Ctrl+S default export format: HTML EXPORT.** Rationale (human): Ctrl+S
  means "save a file"; the native Save-Page-As dialog task 8.1 suppresses IS a save-to-file, so HTML
  export (the one surviving path that produces a downloaded file) is the honest analog. Synchronous,
  browser-native, no clipboard-consent surface to fail on a first try, and its sole failure mode
  (`serializeReaderDocument`'s throw) is already reported by 9.1's `reportExportFailure`. Beats the
  no-op (dead-on-first-press, the worst possible first experience), a copy default (clipboard consent is
  itself a first-try failure surface), and PDF (an unprompted `window.print()` dialog is surprising on a
  keystroke the user did not associate with printing). Rests on: task 10.1's four-candidate finding
  (`progress.md`'s 2026-09-04 task-10.1 entry) — its own verdict-input already leaned HTML export; this
  ruling adopts that lean as the chosen value.

  **RULING M-2 — the "heavy document" progress-indicator threshold: NO THRESHOLD; NO SURVIVING EXPORT
  IS "HEAVY."** Rationale (human): task 10.2 measured HTML-export/copy-as-HTML's shared serialize span
  at **0.30 ms → 26.95 ms** across a 1 KB → ~1.12 MB corpus (`scripts/perf-export.ts`, median of warm 6,
  Chromium) — an order of magnitude under any plausible "heavy enough to need a progress indicator" bar.
  The element-density knee 10.2 found is real (not bytes-linear) but does not change this conclusion:
  even the corpus's own worst case is imperceptibly fast. Spec §3.8's own named heavy-export examples —
  *"DOCX/ZIP serialization, HTML Base64-embedding of large images"* (`spec.md:104`) — are all features
  M10 has since dropped (DOCX at §3.10; ZIP export at §3.1(cont.); local-image embedding at §3.1). M-2's
  finding: the surviving exports are uniformly fast; the "heavy document" 8.3 was scoped to indicate
  progress on does not exist in M10's shipped surface. Rests on: task 10.2's own numbers
  (`progress.md`'s 2026-09-04 task-10.2 entry).

  **RULING 8.3 — the progress indicator's build-or-drop (deferred to this gate by the 2026-09-04 M10
  §8.3/§10.4 entry immediately below this one): DROPPED — a MEASURED NON-BUILD, the milestone's FOURTH
  scope reduction** (after DOCX export, §3.10; local-image embedding, §3.1; ZIP export, §3.1(cont.)).
  Rationale (human): follows directly from Ruling M-2 (no export is heavy enough to need indicating) plus
  a structural fact independent of any threshold — HTML export (Ruling M-1's chosen default) and PDF
  export are both `exportHtml`/`exportPdf`'s own `: void` signatures: synchronous, no `await`, no repaint
  window a progress indicator could render into. The three copy paths are async but fast (a clipboard
  write, not a serialization pass) — nothing to show there either. 10.2's 26.95 ms figure IS the
  justification, not a rounded stand-in for one. Struck in-place, mirroring task 5.1's (§3.10) and task
  3.5's (§3.1(cont.)) whole-task-strike shape — the milestone's task-count audit trail stays intact, not
  deleted. See `tasks.md` §8.3 for the struck body and the restated group-8/active-count lines.

  **RULING M-3 — print header/footer content and margins: ALL THREE KEEP THEIR SHIPPED PROVISIONAL
  VALUES.** Footer *"Page X of Y"* (proven-rendering on 7.1's shipped cell, most informative of 10.3's
  candidates, no new mechanism). Header *"Peekover"* (safe, no-new-mechanism; the document-title
  candidate is DEFERRED as a future enhancement — it reopens 10.5's "constants only, no new mechanism"
  scope via an untested `string-set`/`string()` CSS mechanism, which this milestone's tail will not
  spend on; 10.3's own feasibility caveat on that candidate is its recorded prerequisite for whoever picks
  it up later). Margins **2cm / 1.5cm / 2.2cm** (kept as shipped; 10.3 correctly scoped margin fit as a
  VISUAL question, not a numeric one — 11.1's already-budgeted human walk confirms it by eye; adjust there
  only if the eye finds a problem, not here on prose alone). Rests on: task 10.3's candidate walk
  (`progress.md`'s 2026-09-04 task-10.3 entry) and 7.1's own shipped-cell ruling (`decisions.md`'s
  2026-09-03 entry). ★ **Net effect: 10.5's own M-3 implementation is a CONFIRMED NO-OP** — the shipped
  `@page` block (`readerCss.ts:836-838`'s COPY in `appShell.ts`'s `APP_CSS`, per 7.1) already carries
  exactly these three values — recorded here as a confirmed no-op, not a silent non-change, per the
  standing "a PROPOSED comment left on a chosen value is a lie about the decision state" rule (008/009).

  ---

  **THE BYTE LEDGER'S FINAL RECONCILIATION (§10.4's own second half — the binding record, not a separate
  measurement; every figure below is freshly measured at HEAD `0dfac7a`, both engines rebuilt from a
  clean `.output/`, not carried from memory).**

  **Milestone-start baselines (plan §0 D-1 / `tasks.md`'s own standing-invariants snapshot):** `.output`
  **4,866,741 B (Cr) / 4,866,857 B (Fx)**; `pnpm zip` **1,470,730 B (Cr) / 1,470,788 B (Fx)**;
  `dependencies` (production) **6**.

  **The accumulated `.output` delta, task by task, confirmed against each task's own recorded commit
  figure (not the prior-turn kickoff's own draft list, which mis-stated 3.2's figure — corrected below):**
  1.1 net **0** (installed docx+client-zip for +380,358 B, both fully removed downstream of the §3.10/
  §3.1(cont.) rulings — confirmed by the actual dependency list, not assumed) · 2.1 **0** (read-only) ·
  2.2 **0** · 3.1 **0** (no consumer yet) · 3.2 **+7,752 B** (the first mover — **NOT** +2,052 B as a
  prior-turn draft list had it; the actual landed figure, `475,579 → 483,331 B`, is confirmed directly
  against `progress.md`'s own task-3.2 entry) · 3.3 **+358 B** · 3.4 **+350 B** · 3.5 struck, **0** ·
  4.1 **+318 B** · 5.1 struck, **0** · 6.1 **+3,236 B** · 7.1 **+404 B** · 8.2 **+477 B** (landed BEFORE
  8.1 in commit order, confirmed against `git log`) · 8.1 **+602 B** · 9.1 **+1,341 B** · 9.2 **0**
  (test-only) · 10.1/10.2/10.3 **0** (doc-only, no `src/`/build touched, each self-confirms this in its
  own entry). **Sum: 14,838 B.**

  **Expected final = baseline + sum:** 4,866,741 + 14,838 = **4,881,579 B (Cr)**; 4,866,857 + 14,838 =
  **4,881,695 B (Fx)**.

  **Actual final, measured (`.output/chrome-mv3` and `.output/firefox-mv3`, fresh `pnpm build` /
  `pnpm exec wxt build -b firefox`, byte-summed over every file in each tree):** **4,881,579 B (Cr)** /
  **4,881,695 B (Fx)**.

  **Residual: 0 B, both engines, exact.** Every task's own stated delta accounts for the entire
  accumulated movement — nothing unexplained. Headroom against the ≤5 MiB (5,242,880 B) ceiling:
  **361,301 B / ~352.8 KiB (Cr)**, **361,185 B / ~352.7 KiB (Fx)** — down from gate-1's ~367 KiB opening
  headroom by exactly the 14,838 B this milestone spent, confirming D-1's fork was never triggered (the
  accumulated delta fit inside the opening headroom the entire way through, with no single task coming
  close to busting it).

  **`pnpm zip`, measured the same way (`.output/peekover-0.0.0-chrome.zip` / `-firefox.zip`, freshly
  rezipped, `pnpm zip` for Chrome and `pnpm exec wxt zip -b firefox` for Firefox — the standing
  `-- -b firefox` trap avoided, per the tooling note already on file):** **1,474,790 B (Cr)** /
  **1,474,848 B (Fx)** — delta from baseline **+4,060 B, both engines, identical**. Headroom against the
  <2 MB (2,097,152 B) ceiling: **622,362 B / ~607.8 KiB (Cr)**, **622,304 B / ~607.7 KiB (Fx)**. ★
  **Named, not smoothed over: zip was measured only at two intermediate checkpoints this milestone (task
  3.2: +2,161 B; task 6.1: +3,292 B both engines), not at every task the way `.output` was** — the
  standing-invariants text requires per-task delta tracking for app-page/`.output` bytes specifically,
  never states the same for the compressed zip artifact, so this is a measurement-granularity gap in
  the milestone's own record, not a residual defect: the +768 B between 6.1's own recorded zip delta
  (+3,292 B) and the actual final zip delta (+4,060 B) corresponds to tasks 7.1–9.2's combined
  `.output` growth of 2,824 B (4,881,579 − 4,878,755) compressing to 768 B, a ~27% compression ratio
  consistent with source-code deltas elsewhere this milestone (unlike M9's Shiki JSON, which compressed
  far harder). Both zip ceilings clear with wide margin regardless.

  **THE DEPENDENCY LEDGER — THE CAPSTONE.** Production `dependencies`: **6** at milestone start (pre-1.1)
  → **8** at task 1.1 (docx + the chosen ZIP writer, `client-zip`, installed for real per D-1's hard
  gate) → **6** again, both removed downstream of the §3.10 (DOCX, 2026-08-24) and §3.1(cont.) (ZIP
  export, 2026-08-29) human rulings. Confirmed directly against the installed tree at HEAD
  (`Object.keys(require('./package.json').dependencies)` → `diff, dompurify, markdown-it,
  markdown-it-task-lists, mermaid, shiki` — **exactly 6, exactly the milestone-start set, in the same
  order**). **NET: ZERO new production dependencies landed in M10.** The milestone that opened with a
  dependency-measurement hard gate (D-1, task 1.1's own fork) closes having added none — every dependency
  task 1.1 installed was later removed by a human scope-reduction ruling, and no other task in this
  milestone added one. Stated as the binding record.

  **★ ONE MISMATCH FLAGGED, NOT SMOOTHED OVER (Q4/11.3 cross-check):** `tasks.md`'s own task 11.3 Verify
  line (written at gate-3 seal, 2026-08-22, before either the DOCX or the ZIP-export strike existed)
  states *"deps exactly 7 (assumes the §3.10 docx-removal follow-up act has landed by this task; if not,
  deps 8 with `docx` installed-but-unused, named as a defect if still true here)"* — a figure that
  presumed ZIP export would still ship (6 base + 1 surviving ZIP-writer = 7) and never anticipated
  §3.1(cont.)'s later strike of ZIP export itself. That presumption is now stale: the actual, confirmed
  count is **6**, not 7 or 8, because the ZIP writer was ALSO removed (§3.1(cont.)'s own follow-up act).
  Flagged here for 11.3 to correct against ground truth rather than its own stale pre-written figure —
  not corrected in `tasks.md` by this task, since 10.4's own Work scope is decisions.md + the §8.3 strike
  + progress.md, not a second pass over 11.3's body.

  **8.3's strike, applied to `tasks.md` in this same commit (mirroring §3.10/§3.1(cont.)'s own
  whole-task-strike shape — struck in-place, never deleted):** active task count **20 → 19**; group 8
  **3 active → 2 active** (8.1, 8.2 remain; 8.3 struck); §4 EARS coverage's *"Export shortcut &
  progress"* row restated to name 8.3 as struck, measured-out-of-scope, citing 10.2's 26.95 ms figure
  as the justification, the same citation shape the DOCX/ZIP EARS-row strikes already use.

  **10.5's scope, reduced by this gate to ONE constant:** Ruling M-1 wires HTML as `lastExportFormat`'s
  first-run default (the only value 10.5 actually sets). Ruling M-2/8.3 leave 10.5 nothing to build (8.3
  struck — there is no threshold constant left to set). Ruling M-3 is a CONFIRMED NO-OP for 10.5 (the
  shipped `@page` values already match the ruled ones) — 10.5 records this as a no-op rather than hunting
  for M-3 constants to edit. `tasks.md` §10.5 is annotated accordingly in this same commit.

  **Attribution.** All four rulings are the human's, recorded verbatim above; the byte ledger is CC's own
  measurement, run fresh at this gate, not inherited from any prior task's own figures without
  independent confirmation.
  **Revisit-when:** task 10.5 lands HTML as the default (the only code this gate authorizes); 11.3
  corrects its own stale dependency-count Verify line against the **6** confirmed here.

- **2026-09-04 · M10 §8.3/§10.4 — HUMAN RULING: TASK 8.3 (the progress indicator)'s BUILD-OR-DROP IS
  DEFERRED TO TASK 10.4's DECISION GATE, RULED THERE ON 10.2's MEASURED EXPORT WALL-CLOCK — NOT DECIDED
  IN ADVANCE. REVERSES a prior-turn lean toward building 8.3 now with its provisional placeholder
  threshold; the reversal follows the reconciliation below, not a change of mind alone.**
  **The reconciliation (the evidence input, checked against spec.md/tasks.md/the current code before
  recording, not asserted from prose).**
  - Spec §3.8's own named heavy-export examples — *"DOCX/ZIP serialization, HTML Base64-embedding of
    large images"* (`spec.md:104`) — are THE THREE FEATURES this milestone has since dropped: DOCX
    (§3.10, 2026-08-24 ruling, below), ZIP export in full (§3.1(cont.), 2026-08-29 ruling, below), and
    local-image Base64/file embedding (§3.1, 2026-08-29 ruling, below). Every example the spec itself
    gave for "what makes an export heavy" no longer exists in M10's surviving scope.
  - The five surviving export paths split cleanly, read-confirmed against `appShell.ts`'s
    `runExportHtml`/`runCopyHtml`/`runCopyPlainText`/`runCopyRichText`/`runExportPdf` (:919-1005) and
    their callees: HTML export (`exportHtml`, `htmlExport.ts:367`) and PDF export (`exportPdf`,
    `exportControls.ts:177`) are both declared `: void` — synchronous, no `await`, nothing returned to
    await — so a progress indicator has no repaint window to render into around either. The three copy
    paths (`copyAsHtml`/`copyAsPlainText`/`copyAsRichText`, driven via `.then(onCopied, onFailed)`) are
    async internally but fast — a clipboard write, not a serialization pass. None of the five surviving
    paths structurally resembles the multi-second operation §3.8 was written to cover.
  - Spec §3.8 itself states the requirement CONDITIONALLY, not asserted: *"it must degrade to something
    visible rather than a frozen-looking tab on a large document... the concrete threshold for 'heavy'
    is §8's to measure, not this spec's to assert."* If 10.2's measurement finds no export ever crosses
    a perceptible threshold, the requirement is vacuously satisfied by no indicator ever firing — the
    same conditional shape §4's zero-network and print-degradation clauses already carry elsewhere in
    this spec.
  - Task 8.3's own sealed body already carries a threshold *"provisional placeholder here, EXPLICITLY
    NAMED provisional... group-10's own measurement confirms or replaces it"* — the body already
    anticipates 10.2 owning the real number. This ruling extends that: 10.4 (the gate that already rules
    M-1's format, M-2's threshold, and M-3's header/footer, per `tasks.md` §10.4) also rules WHETHER 8.3
    builds at all — "no export crosses any perceptible threshold" and "8.3 has nothing to indicate" are
    the same finding stated two ways.
  **The ruling.** 8.3 is NOT struck — it is not dropped, its FATE is deferred, distinct from a
  §3.10/§3.1(cont.)-style strike — and stays an active task (group 8 still 3 tasks, `tasks.md`'s own
  count line restated, not silently left stale), gated on 10.4. This routes the build-or-drop decision
  to the gate that already exists to rule on group-10's measured numbers, rather than building an
  affordance now that the sync/async reality above suggests will probably never fire, only to maybe drop
  it later at that same gate.
  **The reversal, named.** A prior-turn lean favored building 8.3 now with its provisional placeholder
  threshold, treating the placeholder as sufficient to ship ahead of measurement. That lean predated this
  reconciliation (the sync/async split, and the spec's-own-heavy-examples-all-dropped finding); recorded
  here as a reversal on new evidence, not silently superseded.
  **Attribution.** The ruling is the human's; the reconciliation above is the evidence input that
  produced it.
  **Revisit-when:** task 10.2 lands its wall-clock numbers — 10.4 then rules 8.3 build-or-drop on that
  number, per this entry. `tasks.md` §8.3/§10.4 carry a pointer back here.

- **2026-09-04 · M10 task 9.2 — the zero-network guard lands across every export/copy/print action in ONE
  test, real engine (Chromium + Firefox), against a control the observer is shown to actually see
  (`tests/browser/exportNetwork.browser.test.ts`, test-only). Closes group 9.**
  **Q1 — ONE CONTROL LANE, NOT TWO (a kickoff-vs-ground-truth mismatch, resolved against the file body).**
  A kickoff drafted ahead of this task leaned toward arming both a bare-`fetch()` lane and a subresource
  lane, citing `agentBadgeNetwork.browser.test.ts`'s own two-lane precedent for "observer completeness."
  Checked against `plan.md`'s own §3.11 row 12 entry BEFORE drafting (AGENTS.md's "the file body is
  ground truth" rule): that row already named its control, singular — *"the control fetch case being
  D-8's own live mechanism ... the natural positive control to borrow rather than construct fresh."*
  `tasks.md`'s own §9.2 body repeats "the positive control" the same way, never a second lane. Ruled: ONE
  lane only, `restoreBlockedImages` (`mediaPolicy.ts:166`), because — unlike `agentBadgeNetwork`'s generic
  render modules — grep confirms none of the five actions under test (`htmlExport.ts`, `copyPlainText.ts`,
  `exportControls.ts`, `appShell.ts`'s five export-dispatch functions) ever calls `fetch`/
  `XMLHttpRequest`; a bare-fetch control would prove the observer sees a request class this code has no
  path to emit. The one lane these actions could plausibly open is the subresource lane (adopting the
  reader's own clone into a document with a browsing context), which is exactly what
  `restoreBlockedImages` exercises. The kickoff's lean is named here as the mismatch it was, not silently
  followed.
  **Q2 — the buffer dance.** `armTheProbe()`: `clearResourceTimings()` → fire the control (proving the
  observer sees it) → remove the control's own adopted node → `clearResourceTimings()` again, handing the
  five actions a clean buffer. Each action gets its own labeled `assertNoNetwork(label)` immediately after
  it runs (never batched ahead of the instrument — the "check that found the defect must be the one seen
  to fail" lesson), the buffer is never re-cleared between actions, one cumulative check reads the whole
  run, and the control fires again at the end to prove the observer stayed live throughout — 
  `agentBadgeNetwork`'s own arm→measure→re-arm shape, reused verbatim.
  **Q3 — PDF/print.** `window.print()` is stubbed via `vi.spyOn` (`pdfExport.browser.test.ts`'s own
  shape) — a real call opens a modal dialog that would hang the runner. The assertion is stated precisely
  as *"Peekover's own path TO `window.print()` (the panel row → `exportPdf()` → the call) fires zero
  requests,"* never a claim about the browser's own print-pipeline internals, which do not run here (the
  call is stubbed) and which the page's own Resource Timing buffer could not observe regardless.
  **Q4 — the drive, and non-vacuity.** All five actions run through the REAL export panel
  (`exportDegrade.browser.test.ts`'s own `mountWithFile`/`openPanel`/`rowIn` shape, copied not imported).
  HTML export: `armExportDownload`/`collectExportDownload` (task 3.1's own command pair) prove a real
  download landed, carrying the fixture's own heading — non-vacuous. The three copy rows: real clipboard
  consent granted via CDP (`exportDegrade.browser.test.ts`'s own shape), driven with `userEvent.click()`
  for real transient activation, and `EXPORT_ROW_STATE_ATTR === 'done'` is reachable only via the real
  `.then(onCopied, ...)` resolving — i.e. the real write succeeded. PDF: the `vi.spyOn` proves
  `exportPdf()` → `window.print()` was actually reached. By-contrast proof (D-8's own text: the control
  proves the export/copy paths are silent, using a mechanism export never calls): grep-confirmed the four
  export-owning files never call `restoreBlockedImages` or `fetch`/`XMLHttpRequest`.
  **Test-only.** No `src/` change; app-page bytes, both content-script md5s, `.output`, deps (6),
  manifests (654/770 B), `permissions: []` and the Golden fixtures all unchanged — a test file ships
  nothing. Group 9 CLOSES with this task.
  **Revisit-when:** a sixth export/copy/print action is added to the panel (this test's action list would
  then be incomplete by omission, not by a wrong assertion) — the next task adding a row should extend
  this file's own action list rather than open a new one, per the "one test, not one per action" rule
  this task's own body states.

- **2026-09-04 · M10 task 9.1 — failure states land, AND (human ruling, this entry) the copy-completion
  affordance five prior tasks named but did not build lands in the SAME commit, because they are one
  code change: every copy handler's `void copyFn(...)` becomes `copyFn(...).then(onCopied, onFailed)`,
  and the success branch of that `.then` IS the completion affordance.**
  **THE RULING (human-confirmed).** §9.1's own sealed body owns FAILURE-STATES only (force a failure,
  prove never-blank, prove no-false-success) — it never names a positive completion affordance. But
  `tasks.md`'s own §3.11 sibling-checklist routing table (lines 135-138, read BEFORE this task, per
  AGENTS.md's rule that the routing table is a discharged plan deliverable, not a hypothesis) already
  routes row 9 (the polite live region) and row 10 (reduced motion) to "task 9.1 (completion/failure
  state for every action)" and "task 9.1, for any copy-confirmation transition" — a textual basis in
  `tasks.md` itself, not merely a prior task's own aside. Ruled:
  - 9.1 builds BOTH halves as one code change (see above) — not scope creep, because every copy
    handler's rejection was ALREADY surfaced only as a genuine unhandled-rejection error (AGENTS.md
    #5's "never a false success" was already satisfied that way); 9.1's own failure-states obligation
    requires replacing that with an explicit, user-visible failure state, and the SAME `.then`'s
    success branch is the completion affordance — building one half without the other would mean
    writing the `.then` twice, once now and once when a later task "discovers" the other branch.
  - Completion UI is for the THREE COPY actions ONLY (Copy-as-HTML, Copy-as-plain-text, Copy-as-rich-
    text). HTML export and PDF get NO Peekover completion affordance on SUCCESS: each already has its
    own native browser signal (the download shelf; the print dialog), so a Peekover "Exported!" would
    be redundant with it — the same "still justified / not redundant" discipline that dropped ZIP
    export earlier this milestone (`decisions.md`'s §3.1(cont.) ruling). HTML export DOES still get a
    FAILURE report (below) — a thrown serialization error has no native signal at all, unlike a
    completed download — but PDF gets neither report on either outcome: `window.print()` has no
    promise/throw surface for `appShell.ts`'s guard to catch, so there is nothing to force.
  - The affordance REPRODUCES `codeView.ts`'s own copy-button shape (`buildCodeToolbar`'s row
    15/20: per-button text swap + `aria-label` rewrite + a `data-state` attribute, using the SAME
    values `'done'`/`'failed'` `CODE_COPY_STATE_ATTR` already uses, plus a `role="status"`
    hidden-until-populated live region) rather than importing it — `buildCodeToolbar`'s own
    `announce` closure is module-private, in the content-script render graph, unreachable from this
    app-page panel. Two independent call sites (codeView's toolbar, this panel), the same
    rule-of-three precedent `exportControls.ts`'s own module doc comment already states for its focus
    trap — reproduced again here, not extracted into a shared helper.
  **THE RECONCILIATION'S OWN FINDING, CORRECTING THE KICKOFF THAT PRECEDED THIS TASK — the kickoff
  claimed "only 3.3/3.4 (not 3.1/4.1/7.1) actually deferred" completion UI to 9.1; checked against
  `decisions.md`'s own landed entries before drafting, and that claim is WRONG about 4.1.** Task 4.1's
  own 2026-09-03 entry (above, "Copy-as-rich-text lands") states verbatim: *"Task 9.1 still owns the
  completion/failure UI every copy row in this panel has named but not built (same standing note as
  3.3/3.4's own entries) — now covering all 4 live copy/export rows plus this one."* So all THREE copy
  tasks (3.3, 3.4, 4.1) explicitly deferred, not two — which actually STRENGTHENS the ruling's coverage
  (every copy row deferred it, none skipped) rather than narrowing it. Task 3.2 (HTML export's own
  panel-wiring task) and task 7.1 (PDF) never deferred anything to 9.1 — consistent with the ruling's
  native-signal exclusion, checked by reading both entries in full and confirming neither mentions a
  9.1 deferral. Flagged here per AGENTS.md's "a kickoff is a hypothesis, not authority" rule, since a
  kickoff's own factual claim about prior tasks turned out to be wrong at the file level, not just the
  ambiguous-scope level a reconciliation normally catches.
  **Q1 — THE void→then SEAM.** `appShell.ts`'s three copy handlers change `void copyFn(...)` to
  `copyFn(...).then(onCopied, onFailed)`. The `.then` callbacks live in `mountAppShell`'s own closure
  (where the handlers already are), not in `exportControls.ts` — so they reach the RIGHT row + the
  panel's own live region through a new closure variable, `exportView: ExportViewController | null`,
  set in `renderExport()` (the instant a fresh panel is built — `createExportView` is stateless and
  rebuilt on every open, per that module's own doc comment) and cleared to `null` in `toggleExport`'s
  close branch. A promise settling after the panel has closed is therefore a graceful no-op
  (`exportView?.reportCopyOutcome(...)`), never an error. `ExportViewController` gained two methods:
  `reportCopyOutcome(key: CopyRowKey, copied: boolean)` (the 3 copy rows) and
  `reportExportFailure(key: 'html')` (the one-sided HTML failure report) — both implemented inside
  `createExportView` using the row's own existing `data-export` attribute as the lookup seam (already
  set on every row for a different reason: the focus trap's own stop list), so no new per-row state
  needed threading through `RowSpec`.
  **Q2 — THE LIVE REGION, REPRODUCED, NOT IMPORTED.** A `role="status"`, `hidden`-while-empty `<div>`
  (`EXPORT_STATUS_CLASS`, exported for test selection, matching `CODE_STATUS_CLASS`'s own precedent)
  is appended to the panel after its rows, with a module-local `announce(text)` closure exactly
  matching `buildCodeToolbar`'s own shape — confirmed NOT an import (grepped `codeView.ts`'s exports;
  `announce` is not one of them) and confirmed no dedicated CSS rule was needed either (grepped
  `readerCss.ts` for `__status` before writing any — zero matches, so `codeView.ts`'s own toolbar
  status div ships unstyled too; reproducing that choice, not inventing a new one).
  **Q3 — HTML/PDF EXCLUDED, AND WHICH ONE HAS A FAILURE PATH.** `exportHtml` is synchronous and CAN
  throw before any download begins: `serializeReaderDocument` throws when `.peekover-reader` is absent
  from the host's shadow root — this is §3.9's own named "a serialization throw" mode, reachable in
  THIS milestone's actual code (unlike "a library fails to load" or "an image cannot be read," which
  have no forceable path left after the §3.1 gate ruling dropped local-image embedding and D-7 shipped
  PDF with zero new library — noted so the sealed body's other two named modes are not silently
  skipped without explanation). `runExportHtml` wraps the call in `try { exportHtml(...) } catch {
  exportView?.reportExportFailure('html') }` — the ONE failure this row must still state itself,
  since a thrown error has no native signal at all, unlike a completed download. `runExportPdf` gets
  NEITHER a completion NOR a failure report, on either count: `window.print()` returns nothing and has
  no promise to reject, so there is no throw surface for `appShell.ts`'s guard to catch, and the
  ruling excludes its success half as native-signal-redundant regardless.
  **Q4 — THE FORCED-FAILURE MECHANISM, PER MODE, AND WHY EACH ONE DOES NOT DESTROY WHAT IT PROVES
  UNTOUCHED.** Copy rows: `navigator.clipboard` is replaced wholesale with a stub whose `write`/
  `writeText` reject (`copyAsHtml.browser.test.ts`'s own rejection shape, reused for the panel click
  path) — this touches nothing in the live DOM, so the reader subtree's reference-identity check is a
  clean claim. HTML export: `serializeReaderDocument` calls `column.cloneNode(true)` on the LIVE
  `.peekover-reader` element — patching `cloneNode` to throw as an OWN-PROPERTY override on that one
  element instance (never removing or mutating the element itself) forces the exact real throw without
  disturbing the rendered document at all, so the SAME node, SAME markup, survives the forced failure —
  removing the element instead (the more obvious "make it throw" move) would have been self-defeating,
  since the destruction performed TO force the failure would be indistinguishable from the defect this
  test exists to catch.
  **THE REVERT-AND-FAIL, ACTUALLY PERFORMED, NOT MERELY DESCRIBED (M6 finding 5).** `appShell.ts`'s
  three `.then(onCopied, onFailed)` calls were reverted to the pre-9.1 `void copyFn(...)` shape and
  `runExportHtml`'s `try/catch` was reverted to a bare call, then `exportDegrade.browser.test.ts` +
  the three copy-row browser test files were re-run on both engines. Signature, exactly as predicted:
  every forced-failure/forced-success arm's `until(() => row.getAttribute('data-state') === ...)`
  timed out (a discarded promise settles into nothing a row can react to — the row is left exactly as
  it started, "Copy as HTML"/etc, forever); Chromium AND Firefox both additionally surfaced the
  original rejection/throw as a genuine unhandled error at the exact reverted call site
  (`runCopyHtml`/`runCopyPlainText`/`runCopyRichText`/`runExportHtml`, confirmed via the test runner's
  own unhandled-error attribution) — 20 of 60 assertions across 8 files went red. The wiring was then
  restored verbatim (`git diff` re-checked against the pre-ablation state, byte-for-byte identical)
  and the full set re-ran clean, 60/60. This is the defect's own signature: silent no-op OR an uncaught
  error, never a stated failure — exactly what §9.1 exists to close.
  **Necessary ripple, flagged per AGENTS.md's workflow rule (not a silent substitution).** §9.1's own
  sealed Files list is `htmlExport.ts` · `exportControls.ts` · `exportDegrade.browser.test.ts` —
  `appShell.ts` is NOT on it, but the `.then(onCopied, onFailed)` wiring can only live where the copy
  handlers already are (`mountAppShell`'s own closure), which is `appShell.ts`, not
  `exportControls.ts` — structurally required by this task's own Verify clause ("each forced failure
  states itself distinctly"), which is unreachable without touching the handler that calls the failing
  function. `htmlExport.ts` itself was NOT touched — `serializeReaderDocument`'s existing throw already
  does everything Q3 needed; no source change to that file, only to its two consumers-through-the-
  panel (`appShell.ts`) and the panel itself (`exportControls.ts`). The three copy-row browser test
  files (`copyAsHtml`/`copyAsPlainText`/`copyAsRichText.browser.test.ts`) each gained one small
  ripple: a real successful click now also proves the completion affordance on the SAME real-click
  path those files already drive, and `copyAsHtml.browser.test.ts`'s own stale "no completion UI
  exists yet (task 9.1's own scope)" comment was removed as no longer true.
  **Byte discipline — measured on BOTH engines, firing-control confirmed (`git stash`/rebuild both
  engines).** App-page chunk **487,735 → 489,076 B (+1,341 B)**, identical delta both engines. `.output`
  **4,880,238 → 4,881,579 B (Cr, +1,341 B) / → 4,881,695 B (Fx)** — the delta decomposes exactly to the
  app-page chunk's own move, residual 0. Content-script: **UNCHANGED, 336,121 B, BOTH engines, md5
  IDENTICAL to 8.2's landed state** (Cr `f424a3b6…`, Fx `ebbf183a…`) — firing-control-confirmed via
  `git stash`, full rebuild both engines: reverting the diff returns the app chunk to exactly
  487,735 B and `.output` to exactly 4,880,238 B (Cr), byte-for-byte the pre-task baseline. This task
  is app-page-only, as expected — the export panel is app-page DOM (D-2); no content-script path was
  touched. Manifests **654 / 770 B** unchanged, `permissions: []`, no `web_accessible_resources`.
  `dependencies` (production) unchanged at **6** — a live region and a row-state swap are DOM, no
  new dependency. Golden EMPTY (no render-pipeline file touched).
  **Suite.** Unit: **1056/1056** (a first run hit `diagramEnhancer.test.ts`'s standing carried
  "enhancer-timing" flake — 2 failures — confirmed pre-existing by an isolated re-run, 58/58 clean;
  this task touches no diagram file). Full browser suite: **152 files / 1535 passed / 15 skipped, 0
  failed** (150/1517/15 baseline at 8.1 + this task's new 9-test file × 2 engines = +18 passed, +2
  files — reconciles exactly). Lint + typecheck clean (`eslint . && tsc --noEmit`, zero errors) — one
  real lint catch fixed in-flight: an unused `label` destructure in the forced-failure
  `describe.each`-shaped loop, removed.
  **Revisit-when:** none specific to this task — the ruling settles the completion-UI scope question
  the reconciliation surfaced, and both halves (failure states, completion affordance) are now built
  and proven together.

- **2026-09-03 · M10 D-5 (task 8.1) — the Ctrl/Cmd+S export shortcut binds in `entrypoints/app/main.ts`,
  app-page-only; the five export handlers are LIFTED to one dispatch path (click + shortcut), never
  duplicated; a real byte-level proof (content-script md5 unchanged, both engines) backs the scoping
  claim, not just a code-review assertion.**
  `plan.md` §0 D-5, applied VERBATIM: *"010 D-5 — the Ctrl+S listener lives in
  `entrypoints/app/main.ts`, app-page-only, not `readerMode.ts`'s app-page-blind pattern."*
  **Q1 — THE DISPATCHER SHAPE: five named functions, one call site each, zero duplication.**
  `appShell.ts`'s `renderExport()` used to build its five `createExportView` callbacks as inline
  closures, each its own `saveSettings({...}); <export>()` pair. Lifted verbatim (no behavior
  change) into five named functions in `mountAppShell`'s own closure (`runExportHtml`,
  `runCopyHtml`, `runCopyPlainText`, `runCopyRichText`, `runExportPdf`); `renderExport()`'s five
  callbacks now reference these functions directly, and a new `triggerLastExport()` — exposed on
  `AppController`, the ONLY new public surface this task adds — reads `currentSettings()
  .lastExportFormat` (settingsSeam.ts) and switches to the SAME five functions. There is no second
  `saveSettings({...}); <export>()` pair anywhere, in `main.ts` or elsewhere — grepped to confirm.
  The click path is BEHAVIOR-PRESERVING BY CONSTRUCTION (same functions, same bodies, only
  relocated and named): `exportPanel.browser.test.ts` (8.2's own write-proof block included) passed
  UNCHANGED, no edits needed to that file.
  **Q2 — THE NULL CASE: a graceful no-op, no default picked, deferring to task 10.1.**
  `lastExportFormat` is `null` before any export has ever run (8.2's own `DEFAULT_SETTINGS`).
  `triggerLastExport()`'s `switch` has no `default` case that picks a format — `null` (and any
  unrecognized value) falls through to an explicit no-op `break`. `main.ts`'s own keydown handler
  calls `event.preventDefault()` UNCONDITIONALLY, before reading the format, so the native dialog is
  suppressed even on this first-ever-Ctrl+S case — but no export runs and no default is written.
  Proven in `exportShortcut.browser.test.ts`: `preventDefault` still fires, `lastExportFormat` stays
  `null` after the dispatch.
  **Q3 — THE BINDING LOCATION, PROVEN AT THE BYTE LEVEL, NOT JUST BY CODE REVIEW.** The listener is
  added inside `main.ts`'s own `if (root)` block (app-page entrypoint only), never in a shared
  module `mount.ts`/`readerMode.ts` both surfaces import — the deliberate INVERSION of
  `readerMode.ts`'s `installToggleShortcut`, which scopes itself by DOM shape (`data-mode` present)
  rather than by which script installed it. `isEditableTarget` is a small, deliberate DUPLICATE of
  `readerMode.ts`'s own helper (four lines, two call sites — this codebase's own rule-of-three
  precedent, `exportControls.ts`'s module doc comment), not an import: importing from
  `readerMode.ts` would pull a content-script-oriented module into the app-page graph for no
  functional reason. The byte-level proof: content-script bundle **336,121 B, BYTE-IDENTICAL to
  8.2's landed state on both engines** (Cr md5 `f424a3b60e9d52bf5ac6a35a8afd2551`, Fx md5
  `ebbf183adfd1e217ad01683043496ccc` — unchanged), firing-control-confirmed (`git stash -u` the
  whole diff, rebuild both engines, app chunk reverts to exactly 487,133 B and the CS md5 was
  already unchanged; `git stash pop` restored the tree). If the listener had leaked into the shared
  graph, the CS md5 would have moved — it did not.
  **Q4 — THE `preventDefault` TEST-HONESTY LIMIT, STATED, NOT OVERCLAIMED.** A dispatched
  (non-trusted) `KeyboardEvent` lets a test read `event.defaultPrevented`/spy on
  `KeyboardEvent.prototype.preventDefault` (both JS-visible on synthetic events), so
  `exportShortcut.browser.test.ts` proves the handler CALLS `preventDefault()` on a Ctrl/Cmd+S
  keydown. It does NOT and CANNOT observe the browser's native "Save Page As" dialog actually being
  absent — a trusted-event-only default no automated harness can watch (the same limit
  `tocNetwork.browser.test.ts`'s own backtick-shortcut test already accepts for its own
  document-level handler). The test file's own header comment states this explicitly.
  **THE D-5 RED-FIRST NEGATIVE — designed, broken by real test-harness state, then fixed to be
  ROBUST rather than assume a pristine `document`.** `vitest.config.ts`'s own header comment records
  that this suite's browser files run SERIALLY and share ONE real `document`/`window` per engine
  (task 4.5's own viewport-leak fix). `appHarnessSeam.browser.test.ts` (task 2.1) re-imports this
  same `entrypoints/app/main.ts` many times across its own tests; after this task, EVERY one of
  those imports installs a real, never-torn-down `document`-level keydown listener — and this
  task's OWN test file does the same across its own `it` blocks. A first draft asserted an ABSOLUTE
  "Ctrl+S does nothing yet" before the first `loadMain()` call and a fixed "+1" after each
  subsequent one; both assumptions broke in a real run (`expected 3 to be 2` — accumulated listeners
  from earlier tests in the same file, each contributing their own `preventDefault()` call, summed
  into a stale cumulative spy count). Fixed by never asserting an absolute count: a
  `KeyboardEvent.prototype.preventDefault` spy is CLEARED before each measured dispatch
  (`reactionsTo()`), so every assertion reflects exactly one dispatch's reaction count, immune to
  how many listeners already exist. The surviving test: a content-script-shaped host (`mount()`,
  real `data-mode`, the EXACT shape `readerMode.ts`'s own shortcut scopes itself by) adds ZERO
  reactions; loading `main.ts` immediately after adds EXACTLY ONE — proving the reaction tracks
  which script ran, never DOM shape. This can genuinely fail: reusing `readerMode.ts`'s pattern
  would have made the content-script-shaped host react before `main.ts` ever imported.
  **THE ONE-PATH PROOF — a real click and a real `triggerLastExport()` call produce the identical
  artifact, not a mocked equivalence.** For HTML: clicking the panel row downloads a real file
  (`alpha.html`, via the same `armExportDownload`/`collectExportDownload` commands 3.2/8.2 already
  use); calling `triggerLastExport()` immediately after — no click at all — downloads a
  byte-equivalent artifact (same filename, same rendered `h1`). For PDF: the row click calls
  `window.print()` once; `triggerLastExport()` calls it a second time, through the identical guard.
  **A second real race caught during this proof, root-caused, not worked around.** The HTML
  one-path test's first draft read `currentSettings().lastExportFormat` AFTER `await
  commands.collectExportDownload()` — a real async gap during which a still-pending
  `settingsPort.load()` from the SAME fresh mount can resolve and clobber the in-memory snapshot
  with a stale persisted value (measured: reproduced once, Firefox only). This is the SAME race
  `exportPanel.browser.test.ts`'s own 8.2 write-proof avoids by reading `currentSettings()`
  SYNCHRONOUSLY right after `.click()`, before any `await` reopens the window — fixed here the same
  way (a synchronous read immediately after the click, plus an explicit `saveSettings()` re-pin of
  the precondition before the second, `triggerLastExport()`-driven download, since ITS OWN
  `collectExportDownload()` await reopens the same window a second time). Neither the PDF nor the
  null-case one-path tests needed this fix — both stay fully synchronous between the write and the
  read/replay.
  **Byte discipline — measured on BOTH engines, firing-control confirmed.** App-page chunk
  **487,133 → 487,735 B (+602 B)**, identical delta and identical content hash (`app-du5HRQ0J.js`)
  on both engines. Content-script: **UNCHANGED, 336,121 B, BOTH engines, md5 IDENTICAL to 8.2's
  landed state** (see Q3 above) — the D-5 byte proof. `.output` **4,879,636 → 4,880,238 B (+602 B)**,
  same delta both engines, **~354.14 KiB (Cr) headroom** remaining (was ~354.73 KiB at 8.2 — the
  −0.59 KiB matches the app-chunk delta exactly), robustly under the 5 MiB ceiling. Manifests
  **654 / 770 B** unchanged, `permissions: []`, no `web_accessible_resources` — a keydown listener +
  `preventDefault()` needs no manifest capability. `dependencies` (production) unchanged at **6** —
  this task adds none. `docs/trust/PERMISSIONS.md` untouched (no new capability to disclose).
  Golden EMPTY.
  **Suite.** Unit: **1056/1056**, unchanged (this task is browser-only; no unit test touches
  `main.ts`/`appShell.ts`'s export dispatch). Full browser suite: **150 files / 1517 passed / 15
  skipped, 0 failed** (148/1503/15 baseline at 8.2 + this task's new 7-test file × 2 engines = +14
  passed, +2 files). Two intermediate runs surfaced ONE failure each in `diagramActions.browser
  .test.ts` (Firefox) and `tocScroll.browser.test.ts` (Firefox) respectively — neither file touched
  by this task, and re-running each in isolation (and the full suite twice more) showed the failure
  moves between them and eventually disappears entirely — a pre-existing, timing-sensitive carried
  flake (the same class of finding `diagramEnhancer.test.ts`'s own carried flake already names in
  this milestone's baselines), not a regression this task introduced. Lint + typecheck clean.
  **Revisit-when:** task 10.1 lands and decides what a first-ever Ctrl+S (`lastExportFormat` still
  `null`) should do — this task deliberately left that case a no-op rather than picking any default.
  Also revisit if `appHarnessSeam.browser.test.ts`'s own repeated `loadMain()` calls ever need to
  assert something about accumulated document-level listeners directly (not needed by this task —
  worked around entirely inside `exportShortcut.browser.test.ts`'s own delta-based instrument).

- **2026-09-03 · M10 D-6 (task 8.2) — `lastExportFormat` lands as the fifth `Settings` field,
  `codeTheme`'s own shape; PLAN.MD'S OWN "no enumeration trap" CLAIM WAS WRONG FOR THE READ PATH,
  corrected here by measurement; the WRITE is wired into `appShell.ts`'s panel handlers, closing
  the persistence unit for task 8.1 to read.**
  `plan.md` §0 D-6, applied VERBATIM: *"010 D-6 — the export shortcut's memory is one more field on
  the settings row 009 already widened for the same reason, not a new settings surface."*
  `Settings`/`DEFAULT_SETTINGS` gain `lastExportFormat: string | null`, default `null` (D-6's own
  text: a non-null default would silently pre-empt task 10.1's walk-gate pick of the
  first-ever-Ctrl+S format). `SettingsPort`'s three methods are unchanged in shape.
  **Q1 — THE ENUMERATION TRAP, CHECKED, AND `plan.md`'s OWN CLAIM CORRECTED, NOT INHERITED.**
  `plan.md:256-260` asserted *"`Settings` itself has no such enumeration trap... confirmed at task
  time, not assumed"* — true only of `settings.ts`, the interface/default file, which is purely
  structural. It is FALSE of the actual READ PATH: THREE sibling sites hand-enumerate `Settings`'s
  fields field-by-field and would silently drop an unlisted one on read (no type error, no test
  failure) — `store.ts`'s `getSettings()` (already carrying a comment predicting exactly this: *"the
  trap stays live for whoever adds the next `Settings` field"*, written at D-12/task 1.5), `store.ts`'s
  `describeStored()`, and `settingsPort.ts`'s `coerceSettings()` (the messaging-port read path). This
  is the SAME class of defect `store.ts:185` filed at 006 D-12 and the SAME trap `codeTheme` (M9
  8.5) already walked into and extended — precedent this task follows rather than treats as a fresh
  stop-and-flag: extending the hand-enumeration, explicitly and commented (not silently), is the
  established resolution D-12's own comment anticipated, not a workaround to route around a second
  time. All three sites extended with the same `field ?? DEFAULT_SETTINGS.field` guard `codeTheme`
  already uses. Proven, non-vacuously, with round-trip tests capable of failing: a unit test
  (`settingsPort.test.ts`) drives `messagingPort`'s REAL `coerceSettings` (not a fake) end to end;
  a real-engine test (`tests/browser/settingsStore.browser.test.ts`) mirrors `codeTheme`'s own D-12
  trap test verbatim in shape — `putSettings({lastExportFormat: 'pdf'})` then `getSettings()` — the
  same red-first signature (delete the guard, the assertion reads back `null` instead of `'pdf'`).
  Every existing shape-invariant assertion this ripple touches (`settingsStore.browser.test.ts`'s
  `Object.keys().sort()` pins, `settingsPort.browser.test.ts`'s full-`Settings` `toEqual`s) is fixed
  in place to the current five-field shape, the same "ripple fixed in place" pattern task 4.1's own
  Q5 used.
  **Q2 — THE WRITE SITE, UNSTATED IN §8.2'S SEALED BODY, PINNED HERE.** A field with a reader but no
  writer is half a feature — task 8.1 (Ctrl+S) has nothing to read without it — so 8.2, which owns
  the field, also owns making it a COMPLETE persistence unit. Wired into `appShell.ts`'s five export-
  panel handlers (`onExportHtml`/`onCopyHtml`/`onCopyPlainText`/`onCopyRichText`/`onExportPdf`),
  each calling `saveSettings({lastExportFormat: <its own row key>})` from `settingsSeam.ts` — the
  SAME generalized seam the theme/TOC/code-theme controls already persist through (task 6.1's own
  D-E generalization), not a second bespoke sink. ONE write path: a panel click today; task 8.1's
  Ctrl+S re-invokes through these SAME handlers (per its own task text, "the SAME export entry point
  the panel's own click handlers call"), so it can never diverge or double-write. The write fires
  only inside each handler's own "did the export actually run" guard (never on the defensive
  host-absent/activeFile-absent no-op branch) — a no-op is not a "last used" format. The vocabulary
  is `exportControls.ts`'s own `RowSpec.key` values verbatim — `'html' | 'copy-html' |
  'copy-plain-text' | 'copy-rich-text' | 'pdf'` — the exact strings task 8.1 will switch on.
  **Necessary ripple beyond §8.2's sealed Files list (`settings.ts` / `settings.test.ts` /
  `PERMISSIONS.md` only), flagged per AGENTS.md's workflow rule rather than silently substituted:**
  `settingsPort.ts` + `settingsPort.test.ts` (Q1's coerceSettings extension + its round-trip test),
  `store.ts` + `tests/browser/settingsStore.browser.test.ts` + `tests/browser/settingsPort.browser
  .test.ts` (Q1's other two hand-enumeration sites + their round-trip/shape-ripple proof),
  `appShell.ts` + `tests/browser/exportPanel.browser.test.ts` (Q2's write wiring + its proof). Each
  is structurally required by §8.2's own Verify clause (the enumeration-trap check demands proving
  the read path; the field is not a complete persistence unit without its writer) — not scope creep.
  **Revisit-when:** task 8.1 lands and reads `lastExportFormat()` — confirm it switches on exactly
  these five strings and reuses these same five handlers, never a parallel export invocation.

- **2026-09-03 · M10 task 7.1's stop-and-flag, RULED: option (i) — ship Chromium/app-page margin
  boxes now, Firefox and the content-script surface stay deferred, KNOWN gaps.** Human-confirmed,
  same session as the entry below. Neither gap is built around silently: Firefox's own CSSOM
  drops the nested `@top-center`/`@bottom-center` at-rules at parse time regardless of placement
  (a parser property, not something (ii) or (iii) below it changes except (iii)); the
  content-script surface gets no new document-level `<style>` injection (option (ii), scoped but
  not built) and no PDF-generation dependency is added (option (iii), priced-in-principle but not
  pursued). `dependencies` (production) closes M10 at 6, unchanged from before this task.
  **Revisit-when:** a future task wants content-script print parity (build (ii) then, scoped in the
  entry below) or full cross-engine PDF parity is judged worth a genuine third dependency (price
  (iii) then, through D-1's own discipline) — neither is this milestone's own scope now.

- **2026-09-03 · M10 D-7 (PDF half, task 7.1) — PDF export ships as `window.print()`, NO new
  dependency: relocating `@page` to a document-level stylesheet (not pricing a PDF-generation
  library) resolved 6.1's own finding on Chromium/app-page. A residual asymmetry (Firefox, the
  content-script surface) is STOP-AND-FLAGGED here for a human ruling, not silently accepted or
  silently built around.**
  **WHY THE KICKOFF'S OWN FORK WAS INCOMPLETE, CAUGHT AT STEP 0.** §7.1's sealed task text poses a
  binary: 6.1's probe adequate → wire `window.print()` and stop; inadequate → price the named
  PDF-generation-library fallback against D-1's headroom. 6.1's ACTUAL finding satisfies neither
  pole — Chromium's ENGINE supports `@page` margin boxes (6.1's own plain-top-level-document control
  proved that); the SHADOW-SCOPED stylesheet D-7 sealed is what's inert, a placement defect, not an
  engine-support gap. That opens a third, cheaper option the kickoff's own text never names:
  relocate the rule to a document-level stylesheet and re-measure BEFORE pricing any dependency.
  Flagged explicitly rather than silently substituted — this task's own investigation extended past
  the kickoff's literal binary because the kickoff itself, re-checked against 6.1's landed finding,
  turned out not to have named the cheapest branch.
  **A SECOND LOAD-BEARING FACT THE KICKOFF DIDN'T CARRY FORWARD, FOUND BEFORE ANY FILE MOVED:**
  `htmlExport.ts`'s `extractPageBlocks()` (added at 6.1, as a necessary ripple of putting `@page`
  into `READER_CSS` at all) already depends on `@page` staying inside `readerCss.ts`'s
  `READER_CSS` — it pulls that exact block, verbatim, into every standalone HTML export /
  Copy-as-HTML document (tasks 3.1/3.3's own already-shipped feature). An exported/copied HTML file
  is a plain top-level document (no shadow root) once serialized, so that copy is ALSO
  document-level and, per 6.1's own finding, SHOULD ALSO render correctly — an entirely separate,
  independent consumer of the identical block, on a surface neither 6.1 nor the 7.1 kickoff's own
  Q1-Q4 ever mention. **The kickoff's own Q2 guidance — "prefer MOVE `@page` to `appShell.ts`,
  unless the READER_CSS copy earns its place; it doesn't render anywhere, flag as removable if
  MOVE" — was built on a premise that is FALSE for this second consumer.** MOVE-ing `@page` out of
  `READER_CSS` would have silently regressed HTML export/copy's own print fidelity, as an
  unintended side effect of fixing an unrelated surface — exactly the kind of necessary-ripple
  defect AGENTS.md's workflow rules exist to catch before drafting, not after. Surfaced to the user
  directly (via a clarifying question, not a silent judgment call) before any code changed.
  **THE RULING (user-confirmed): COPY, not MOVE.** `appShell.ts`'s `APP_CSS` gains its own COPY of
  the identical `@page` block — a real document-level, light-DOM stylesheet, the one place in the
  app-page bundle `exportPdf()`'s `window.print()` can actually reach a page box from.
  `readerCss.ts`'s own copy is left untouched — it keeps feeding `extractPageBlocks()` for the
  export/copy pipeline. Two copies, two independent, cross-referenced consumers (each file's own
  comment points at the other) — a second literal, not a shared exported constant, matching this
  codebase's own established convention for cross-module CSS values (`appShell.ts`'s
  `LIGHT_TOKENS`/`DARK_TOKENS` are likewise a local re-authored copy, never imported from
  `readerCss.ts`, despite carrying the same design-token values).
  **THE RELOCATION PROBE, MEASURED (real engine, both Chromium and Firefox, extending 6.1's own
  `printMode.browser.test.ts` — its `emulatePrintMedia`/`printToPdfAndExtractText` commands and its
  `findPageRules` helper, generalized from `ShadowRoot` to `ParentNode` so the SAME function reads
  either copy without change):**
  - CSSOM-parse, the NEW document-level copy: Chromium retains both nested `@top-center`/
    `@bottom-center` at-rules verbatim, same as the shadow-scoped copy. Firefox's CSSOM STILL drops
    them at parse time, UNCHANGED by placement — confirming relocation does not touch a parser-level
    property, only Chromium's render-level shadow-scoping defect.
  - Render signal, Chromium, on the REAL `exportPdf()`-driven app-page surface (6.1's own test,
    re-run with its final assertions flipped `false`→`true` once the copy landed, and its comments
    updated to state both the still-true 6.1 finding and the new 7.1 finding together):
    `printToPdfAndExtractText` now finds "Peekover" and "Page X of Y" on EVERY page of a genuinely
    multi-page fixture. **Chromium/app-page: FIXED, zero new dependency.**
  **★ STOP-AND-FLAGGED, PER THE KICKOFF'S OWN EXPLICIT INSTRUCTION NOT TO SILENTLY RULE THE
  ASYMMETRY — options for a human ruling, not decided here:**
  - **(i) Ship Chromium/app-page margin boxes now; state Firefox and the content-script surface as
    known, deferred gaps; net-zero dependency.** Cheapest. Consistent with export already being
    app-page-only by design (§3.2) — the content-script surface never had an "Export as PDF"
    affordance to begin with, only its OWN native Ctrl+P story is at stake there, unaffected by
    today's change either way.
  - **(ii) Additionally build a document-level `<style>` injection on the content-script surface**
    (the entrypoint currently has none — confirmed: it mounts `<peekover-root>` directly onto the
    raw page, every reader style shadow-scoped, only the transient `HIDE_CSS` is light-DOM) so
    native Ctrl+P on THAT surface also gets margin boxes on Chromium. More machinery, more bytes, on
    a surface D-2 has kept byte-frozen all milestone — net-new scope this task did NOT build, scoped
    only. Firefox stays gapped regardless.
  - **(iii) Price a PDF-generation dependency (§7.1's own originally-named fallback) for full
    cross-engine, cross-surface parity.** The only option that closes Firefox's gap. A genuine
    THIRD dependency this milestone did not budget two for (plan risk 4) — would need D-1's own
    measurement/ablation discipline applied at the commit that adds it, exactly as §7.1's sealed
    text describes, if ever chosen.
  **Verdict input, not a ruling: evidence favors (i).** Cheapest; consistent with export's existing
  app-page confinement; Firefox's own gap is a parser property none of the three options change, so
  it is not really "(ii) vs (iii)" trading Firefox parity — only (iii) buys that, at a real
  dependency cost, for a printed-page-numbers nicety.
  **BYTES, MEASURED BOTH ENGINES, WITH A REAL MISTAKE CAUGHT BEFORE IT SHIPPED:** first attempt
  wrote the relocation's full rationale as a CSS comment INSIDE `appShell.ts`'s `APP_CSS` template
  literal — the exact trap that file's own doc comment already names from a prior task (+1.5 KB,
  previously paid and fixed) — measured at app chunk +1,333 B. Caught before commit, fixed by
  moving the long-form rationale into the `.ts`-level doc comment already sitting above `APP_CSS`
  and shrinking the in-CSS comment to a short pointer; re-measured at the REAL cost, **app chunk
  486,409 → 486,813 B (+404 B)**. Content-script: **UNCHANGED, 336,042 B, both engines, md5
  IDENTICAL to 6.1's landed state** — confirms COPY, not MOVE: `readerCss.ts` carries only a
  `.ts`-level comment after `READER_CSS`'s closing backtick, outside the string, shipping nothing.
  `.output` **4,879,159 B (Cr)**, **~355.20 KiB headroom** (was ~355.59 KiB at 6.1). Manifests
  **654 / 770 B** unchanged, `permissions: []`. `dependencies` (production) **unchanged at 6** —
  the milestone closes this task having added ZERO new production dependencies.
  **Revisit-when:** the human ruling on (i)/(ii)/(iii) above; or if a future Firefox release starts
  retaining the nested at-rules (both CSSOM-parse tests are deliberately engine-sniffed so that
  changes turn them red, not stale-green).

- **2026-09-03 · M10 D-7 / D-10 (print-half) / Ruling 4 (task 6.1) — F5 print mode lands, and the
  @page margin-box fidelity PROBE's result is INADEQUATE on both engines, for a sharper reason than
  "no browser support": the mechanism D-7 sealed (a shadow-scoped stylesheet) cannot deliver
  margin-box content at all, independent of engine.** This is a MEASUREMENT task, not a "wire a
  mechanism" one — it produces the probe's finding for task 7.1's fork; it does not rule the fork.
  **D-7, applied VERBATIM** (`plan.md` §0's own text): *"010 D-7 — print mode is one more `@media
  print` block in the file that already owns every other theme's rules, and PDF export is print
  mode driven through `window.print()`, not a second engine."* **D-10, print-`@media`-block half,
  now real** (task 3.2's own text, applied again — plan §0's D-10 text covers BOTH halves): *"010
  D-10 — the export panel and the print @media block both predate this spec in the mockup, which
  corrects §7-7's own 'no mockup known to exist' framing the same way 009 corrected an identical
  claim about code blocks."*
  **THE PASS/FAIL BAR, stated before measuring (spec §3.6/§7-4's own bar):** can Chromium AND
  Firefox render `@page` margin-box running content (page numbers via `counter(page)`/
  `counter(pages)`, header/footer via `@top-center`/`@bottom-center`) at production quality, per
  engine, in their REAL print pipelines.
  **Chrome-hiding + page-breaks: PASS, both surfaces, both engines.** A new `@media print` block in
  `readerCss.ts`'s `READER_CSS` hides every reader chrome pill (mode/theme toggle, watch + note/
  disclosure, diff affordance/picker/status, agent-file badge, remote-load, net indicator, TOC,
  diagram lightbox) plus the three in-flow per-block toolbars (code/table/diagram-actions) —
  translated from the mockup's own 5 generic demo-page classes (`design/mockup.html:430-435`) to
  this file's REAL class names, a strictly more complete translation than a literal copy would give
  (the mockup shows no `@page` content at all — the probe was built from spec text, not the mockup).
  Heading/code/table/blockquote page-break rules resolve `avoid` under print media, both engines.
  **★ THE @page PROBE — TWO INDEPENDENT SIGNALS, MEASURED, NOT ASSUMED.**
  *(1) CSSOM-parse (both engines, plain DOM reads):* Chromium's parser RETAINS the `@top-center`/
  `@bottom-center` nested at-rules verbatim inside the shipped `@page{}` rule. Firefox's parser
  DROPS them silently at parse time — the identical rule comes back with an EMPTY body
  (`@page { }`).
  *(2) Render (Chromium only — Firefox's `page.pdf()` throws `"PDF generation is only supported for
  Headless Chromium"`, a Playwright/automation limitation, not a Firefox-print-engine finding;
  signal (1) is what carries Firefox's verdict):* an ISOLATED, PLAIN, TOP-LEVEL-DOCUMENT `@page`
  rule (no shadow root) DOES render margin-box content correctly in Chromium (verified this
  session, outside the committed test suite, as the control that proves the engine itself is
  capable) — but the SHIPPED rule, living inside `readerCss.ts`'s `READER_CSS` and injected into
  the reader's SHADOW ROOT, is INERT for margin-box rendering: confirmed TWICE independently (the
  real appShell-mounted fixture via a fresh, non-iframed page's `page.pdf()`, AND a minimal
  imperative-`attachShadow` scratch replica) — the shadow tree's own content still paginates
  correctly (30 real pages from a 440-paragraph fixture), but no margin-box text renders anywhere,
  on the ONLY surface 7.1's `exportPdf(host)` ever drives (the app-page reader pane, §3.2).
  **VERDICT: INADEQUATE on both engines — and for a STRONGER reason than "engine lacks support."**
  Chromium's print engine supports the feature; the FILE D-7 sealed cannot deliver it through
  either engine, a structural consequence of `@page` (a document-global concept) living inside a
  shadow-scoped stylesheet, not a support gap a future browser release could close. Relocating the
  rule to a document-level stylesheet (e.g. `appShell.ts`'s `APP_CSS`) is UNTESTED by this task —
  7.1's own call, not performed here.
  **★ Ruling 4 — CONFIRMED, checked as an explicit diff constraint, not a reminder.** `git diff
  src/theme/readerCss.ts` is purely additive (94 insertions, 0 deletions); the shipped
  `.peekover-reader .peekover-code-toolbar{...}` rule (M9 9.1's spacing) is byte-for-byte unchanged
  — asserted structurally in `printMode.browser.test.ts` (the existing rule's exact body text is
  `.toContain`ed; the new print block is asserted NOT to contain its declarations). No stop-and-flag
  — the task's natural shape never touched the existing rule's body.
  **★ Content-script bytes MOVED, +1,184 B — EXPECTED, not a D-2 break.** `readerCss.ts`'s addition
  ships to BOTH graphs by construction (`READER_CSS` is shared) and this is DESIRABLE: printing a
  raw `file://` document via the content-script reader should also get chrome-hiding/page-breaks.
  Same shape 009's own toolbar-CSS addition took (+5,394 B to CS, accepted). D-2's byte-identity
  guarantee is specifically about NEW EXPORT/COPY CHROME never reaching the content-script graph —
  it was never a claim that `readerCss.ts`'s shared reader-presentation CSS stays static forever.
  Task 6.1's own tasks.md text ("costs nothing there") was WRONG on this specific point — corrected
  here by measurement, per AGENTS.md's own rule that a task body is a hypothesis to verify, not
  authority, when it conflicts with an established same-file precedent (009's).
  **Byte discipline, decomposed to a residual of 0 B.** Content-script: 334,858 → 336,042 B
  (+1,184 B), both engines. App-page chunk: 484,357 → 486,409 B (+2,052 B) = +1,184 B (`READER_CSS`,
  shared) + **868 B (`appShell.ts`'s own new print block — a NECESSARY RIPPLE, flagged: task 6.1's
  Files list named only `readerCss.ts`, but "reader chrome hidden under print media" is unreachable
  in full without it — `.peekover-app__header`/`.peekover-app__folders` are light-DOM siblings of
  the shadow host, unreachable from a shadow-scoped stylesheet by construction).** `appShell.ts`'s
  print block ALSO fixes a second real defect this task's own investigation surfaced:
  `.peekover-app{position:fixed;inset:0}` + `.peekover-app__reader{overflow:auto}` silently
  under-prints an app-shell layout (only the current scroll viewport paginates) — measured directly
  (a 43,557px-tall fixture returned `pageCount: 1` before the fix, confirmed via computed-style
  diagnostics, fixed, re-measured). `.output` 4,878,755 B (Cr) / 4,878,871 B (Fx) (+3,236 B both,
  matching the decomposition exactly), ~355.59 KiB (Cr) headroom remaining. `pnpm zip` 1,474,022 B
  (Cr) / 1,474,080 B (Fx). Manifests 654 / 770 B unchanged, `permissions: []`, no
  `web_accessible_resources`. Production `dependencies` unchanged at 6.
  **A second necessary ripple — a real regression the full suite caught, fixed, not scope creep:
  `htmlExport.ts`'s `translateReaderStylesheet`.** This module parses `READER_CSS` LIVE on an
  explicit "flat-plus-one-@media/@keyframes-level" shape assumption; the new top-level `@page{...}`
  rule (one level of nested braces, its own margin-box at-rules) broke that assumption (`unparsed
  text at the top level of READER_CSS`, 9 failures) — fixed with `extractPageBlocks`, the same
  pass-through-verbatim treatment `@keyframes` already gets (neither ever carries `:host`). A
  standalone HTML export SHOULD carry the print/page rule. The drift-guard `:host`-site pin moved
  25 → 26 (the new `@media print{ :host{...} }` de-clip rule is a real, intended 26th site) and the
  diagram-CSS byte-pin moved 2,927 → 4,111 B (the print/page block lands after the diagram block,
  legitimately growing its slice-to-end-of-string pin) — both re-pinned with rationale, per each
  test's own "re-pin it here" instruction.
  **Suite.** Unit 1055/1055 (after the two fixes above — 9 real failures surfaced, root-caused,
  fixed, never worked around). Full browser suite: 146 files / 1491 passed / 15 skipped, 0 failed
  (144/1475/15 baseline + this task's new 8-test file × 2 engines = +16). Lint/typecheck clean.
  Golden diff empty. `pdfjs-dist` added as a devDependency ONLY (PDF text extraction for the render
  signal — never touches the shipped bundle/manifest/`permissions: []`, not one of §3.4's governed
  "up to two additions", which counts production dependencies only).
  **Revisit-when:** 7.1's fork reads this finding as its input, not as a ruling. If 7.1 (or a later
  task) relocates the `@page` rule to a document-level stylesheet and it then renders correctly,
  that is new information this entry's own "untested by this task" line anticipates.

- **2026-09-03 · M10 D-4 (task 4.1) — Copy-as-rich-text lands: `copyAsRichText` in `htmlExport.ts`
  (`clone.outerHTML`, never `wrapInStandaloneDocument`), the panel's 4th and LAST copy row wired
  live, only PDF (6.1/7.1) still disabled — D-4's third and final consumer.**
  §4.1's own tasks.md text (verbatim, not the kickoff's paraphrase — both agreed): the `text/html`
  payload is the clone's SEMANTIC MARKUP ALONE, carrying NO `<style>` element and no reader-theme-
  derived inline colors, so a paste target's OWN default styling applies (Google Docs/Word) instead
  of the reader's light/dark/sepia theme — spec §3.2's persona line: pastes "without carrying the
  reader's own styling along with it."
  **★ Q1 — THE 4.1-vs-3.3 BYTE-LEVEL DIFFERENCE.** `copyAsHtml` (3.3) calls
  `wrapInStandaloneDocument(clone, theme)`: doctype + `<head><style>…</style></head>` + `<body>` —
  a full standalone document baking the reader's OWN theme colors onto `<body>`. `copyAsRichText`
  (4.1) is `clone.outerHTML` directly — no wrap call at all, so no doctype, no `<head>`, no `<style>`,
  no baked theme. Deliberately never calls `wrapInStandaloneDocument` — doing so would make the two
  payloads byte-identical, collapsing 4.1 into 3.3 (the module doc comment says this explicitly, as a
  guard for the next person editing this file). Proven in `copyAsRichText.browser.test.ts`'s own
  first test: `copyAsHtml`'s payload is asserted to CONTAIN `<!doctype html>` and `<style>` (the
  firing control — proves the "absent" checks below are capable of failing), `copyAsRichText`'s
  payload is asserted to NOT contain `<!doctype`, `<style`, or `<head`, and the two payloads (same
  host, same call) are asserted `not.toBe` each other.
  **★ Q1(b) — "NO READER-THEME-DERIVED INLINE COLORS," CHECKED AGAINST THE REAL RENDER PIPELINE, NOT
  ASSUMED.** Grepped `src/` for `.style.color`/`.style.backgroundColor` before writing the payload
  logic: the only inline color-setting code anywhere in the render pipeline is `codeEnhancer.ts`'s
  `adoptHighlighted` (Shiki syntax-highlight token colors). `codeThemeControl.ts`'s own module doc
  comment confirms `codeTheme` is a SEPARATE, independent setting from the reader's `data-theme`
  ("two controls, two settings fields, two independent registries") — so Shiki's inline colors are
  code-content-derived, not reader-theme-derived, and are correctly PRESERVED in the rich-text
  payload (syntax highlighting is a feature a Docs/Word paste should keep). Because no reader-theme
  color is ever inline on the clone in the first place (theme colors are `:host([data-theme=…])` CSS
  RULES, applied only when a `<style>` block ships them — which 4.1's payload never does), simply
  omitting the wrap trivially satisfies the "no reader-theme-derived inline colors" clause; no
  stripping logic was needed. Proven structurally: the SAME fixture copied under `light`/`dark`/
  `sepia` produces BYTE-IDENTICAL `text/html` (a theme leak into the payload would show up as a
  content difference across the three).
  **★ Q2 — ENGINE PARITY: SELF-PRODUCED, NOT OS-TRANSFORM-RELIANT.** 3.3's own probe (this file's
  2026-08-29 entry) measured that the REAL OS clipboard's native `text/html` format is lossy and
  reformats DIFFERENTLY per engine on PASTE — Chromium re-serializes into a `getComputedStyle`-
  inlined fragment, Firefox reformats whitespace differently. That transform is outside any code
  this task owns; `copyAsRichText` itself writes the IDENTICAL fragment string on both engines
  (verified: `copyAsRichText.browser.test.ts` runs on Cr+Fx, and the theme-invariance test above
  would also catch either engine's build baking anything engine-specific into the payload). Whatever
  a specific paste TARGET later does with that fragment is inherently target-dependent, the same as
  any external paste — a conscious, non-issue, not a silent Peekover cross-engine asymmetry.
  **Q3/Q4 — `ClipboardItem`, `plainTextOf` REUSED verbatim, `htmlExport.ts` (not a new module).**
  `navigator.clipboard.write([new ClipboardItem({'text/html': …, 'text/plain': plainTextOf(clone)})])`
  — the same multi-format construction `copyAsHtml` already uses, re-confirmed against current
  Clipboard API docs at this task per AGENTS.md's standing rule (unchanged shape). `plainTextOf`
  (module-private, `copyAsHtml`'s own fallback derivation) is called directly, not exported — SAME
  clone, SAME rendered-text fallback shape 3.3 already uses; only the `text/html` payload differs.
  `copyAsRichText` lives in `htmlExport.ts` alongside `copyAsHtml` (works off the CLONE, like 3.3,
  unlike 3.4's `activeFile.read()`) — no new module needed, `plainTextOf` reused with zero new lines.
  **The `file://` secure-context residual (008 D-10), re-checked for this payload shape.** Every
  export control, `copyAsRichText` included, is reachable ONLY from the app page (§3.2's own
  confinement); the app page's origin (`chrome-extension:`/`moz-extension:`) is always a secure
  context — the SAME origin 3.3's/3.4's clipboard writes already succeed from, permission-free.
  Nothing about a fragment-vs-standalone-document payload shape changes which origin the call runs
  from, so 008 D-10's `file://`-specific hedge does not transfer here — re-checked and confirmed N/A,
  not assumed; no dedicated test added, the same choice 3.3/3.4 made for the same reason (the
  confinement itself is the answer). Documented inline in the new test file's own module doc comment.
  **Q5 — the disabled-row ripple FORK, decided (a): ripple in place, not consolidated.** Three
  sibling files carried a hardcoded "these rows stay disabled" assertion naming `copy-rich-text`
  among the still-inert rows: `copyAsHtml.browser.test.ts` (3.3's own ripple target once already, at
  3.4), `copyAsPlainText.browser.test.ts` (3.4's own), `exportPanel.browser.test.ts` (3.2's own,
  rippled at 3.3). All three fixed in place — `for (const key of ['copy-rich-text', 'pdf'])` →
  `for (const key of ['pdf'])`, prose updated to match — plus `exportPanel.browser.test.ts`'s own Tab-
  wrap trap-order tests (the LAST enabled stop moves from `copy-plain-text` to `copy-rich-text`;
  `copyPlainTextRowIn` renamed `copyRichTextRowIn`). Chose (a) over consolidating into one shared
  "live vs disabled" assertion because the churn nearly ends here: after 4.1 only PDF (6.1/7.1)
  remains to flip, so a consolidation helper would pay for itself over exactly one more ripple —
  marginal, and not worth the churn of introducing a new shared assertion pattern this late. Grepped
  the whole tree for `copy-rich-text`/`copyPlainTextRowIn`/"the other 2 rows"/"the 2 rows with no
  task landed yet" after editing — no stale reference remained (3.4's own third-file catch, repeated
  here as a matter of course rather than as a surprise).
  **Byte discipline — the delta, measured, decomposed, firing control fired.** App-page chunk moves
  **484,039 → 484,357 B (+318 B), identical on both engines** (`app-CuX2Qhtj.js`, byte-identical hash
  Cr+Fx — like 3.3, unlike 3.4, this is new EXPORTS from an already-imported module, not a new module
  landing: `copyAsRichText` + `ExportViewOptions.onCopyRichText` + one `RowSpec.onClick` +
  `appShell.ts`'s handler, the only new code). **Firing control**: `git stash -u` the entire diff and
  rebuild Chrome — the app chunk returns to exactly **484,039 B** (`app-G-PkoaEJ.js`, the SAME hash
  3.4's own entry recorded, confirming a clean revert to that exact baseline), content-script md5
  unchanged at `41e7607a…`; `git stash pop` restored the tree exactly, confirmed via `git status`.
  `.output` **4,875,519 B (Cr) / 4,875,635 B (Fx)**, same +318 B delta both engines, **~358.75 KiB
  (Cr) headroom** remaining, robustly under the 5 MiB ceiling. Content-script md5 **`41e7607a…` (Cr) /
  `69338e67…` (Fx) — byte-identical to baseline**, confirmed by a full rebuild of BOTH engines
  (Firefox rebuilt explicitly via `wxt build -b firefox`). Manifests **654 / 770 B**, `permissions:
  []` — `ClipboardItem` write needs no `clipboardWrite` manifest permission (transient activation,
  re-confirmed against the real panel click). `dependencies` unchanged at **6**.
  **Suite.** Unit: **1055/1055** on the clean run reported here; a first run hit the standing
  `diagramEnhancer.test.ts` 2-test timing-flakiness carried item (both `Error: Test timed out in
  5000ms`), confirmed pre-existing by an isolated re-run (58/58 green alone) — this task touches
  neither that file nor anything it imports. Full browser suite: **144 files / 1475 passed / 15
  skipped, 0 failed** (142/1459/15 baseline (3.4's own count, = 71 unique `.browser.test.ts` files ×
  2 engines) + this task's new file, 8 tests × 2 engines = +2 files / +16 passed — 72 unique files ×
  2 engines = 144, 1459 + 16 = 1475, both reconciling exactly against the tree's own file count). Lint/
  typecheck clean (`eslint . && tsc --noEmit`, zero errors). Golden diff empty.
  **A real-clipboard collision, caught before it could flake in CI — matches 3.3's own "measured
  race" pattern, same root cause.** The panel-level real-clipboard test's first draft polled
  `readTextBounded()` for a bare `text.includes('alpha.md')` — every sibling fixture in this suite
  ALSO names its test file `alpha.md` (`copyAsHtml.browser.test.ts`'s own default `mdFile` text is
  `# alpha.md\n\nBody of alpha.md.`), so this test's poll could resolve on a PRIOR file's leftover
  clipboard content that also matched `alpha.md`, before this task's own click had actually written
  anything — reproduced once, exactly as 3.3's own comment predicted this class of race. Fixed by
  giving `PANEL_SOURCE` a DISTINCTIVE marker ("exported richly") no sibling fixture carries, and
  gating the poll on that marker instead of the generic filename/word substrings.
  **Revisit-when:** none specific to this task — Q2's engine-parity resolution and Q1(b)'s Shiki-vs-
  reader-theme distinction are both closed calls, not deferred. Task 9.1 still owns the completion/
  failure UI every copy row in this panel has named but not built (same standing note as 3.3/3.4's
  own entries) — now covering all 4 live copy/export rows plus this one.

- **2026-09-03 · M10 D-4 (task 3.4) — Copy-as-plain-text lands: `copyAsPlainText`/`writeTextToClipboard`
  in a NEW sibling module (`src/export/copyPlainText.ts`, not `htmlExport.ts`), the panel's 3rd row
  wired live, and a read-fresh-from-source policy is recorded as deliberate, not a consistency bug.**
  D-4's plain-text half is this task's own first implementing commit (§3.4's own text: *"reuses 008
  D-10's shipped mechanism verbatim"*; the HTML half landed at task 3.3). **`plan.md` §0's own D-4
  text is NOT applied verbatim here** — that text is specific to the `ClipboardItem` `text/html` +
  `text/plain` construction 3.3's `copyAsHtml` already used; 3.4's mechanism is a bare
  `navigator.clipboard.writeText(text)`, a different call shape entirely, so this entry is written
  fresh rather than forcing a mismatched citation.
  **★ Q1 — THE SOURCE-VS-SCREEN CONSISTENCY QUESTION, RESOLVED READ-FRESH, RECORDED AS DELIBERATE.**
  Confirmed against the real code first: `readerPane.ts`'s own `select()` awaits `file.read()` into a
  local variable used once to build that call's `paint(...)` and drops it — no field on the pane, on
  `appShell.ts`'s `activeFile`, or anywhere else retains the raw source after render. So
  `copyAsPlainText` calls `source.read()` again, itself, at copy time. That reopens a question this
  milestone's watch feature (spec 005) makes real: a file can change on disk while open, so a fresh
  read at copy-time COULD return bytes newer than whatever the screen currently shows. This is NOT
  the "file A's text under file B's name" cross-feed class `readerPane.ts`'s own `stopWatch()`
  comment guards against (that mixes two DIFFERENT documents; this only ever returns one document's
  own latest bytes). §4's own line settles which bytes are correct: *"copy the raw source text
  exactly as authored ... read directly, never re-derived from rendered DOM."* The file is the
  source of truth, not the screen — copying the freshest authored bytes honors "exactly as authored"
  more faithfully than reproducing an earlier render, and reconstructing source from the clone is the
  thing §4 forbids outright. §3.4's own body does not say otherwise; no mismatch to flag here.
  **Q2 — the async handler shape, resolved WITHOUT widening `RowSpec.onClick`'s type.**
  `copyAsPlainText(source): Promise<void>` is async internally (await the read, then the write); the
  `ExportViewOptions.onCopyPlainText(): void` and `appShell.ts`'s own handler stay SYNC, matching
  `onCopyHtml`'s exact shape — `if (activeFile) void copyAsPlainText(activeFile);` discards the
  returned promise the same way `onCopyHtml` already discards `copyAsHtml`'s. A rejected READ never
  reaches the write (the `await` inside `copyAsPlainText` short-circuits on throw); a rejected WRITE
  is rethrown from that same function. Neither is swallowed — both surface as a genuine
  unhandled-rejection error from the `void`-discarded call, never a false "copied" (AGENTS.md #5),
  covering the READ failure as well as the WRITE for the first time in this panel (every earlier row
  only had a WRITE that could fail). No `RowSpec.onClick` type change was needed.
  **Q3 — 008 D-10's `tableTools.ts` `writeToClipboard` shape REPRODUCED, not imported.** That helper
  is module-local to `tableTools.ts` and this is an independent call site (still under the
  rule-of-three `exportControls.ts`'s own doc comment already applies to its focus trap — no shared
  helper extracted). `writeTextToClipboard(text)` in the new module: try/catch around the
  `navigator.clipboard` property read (undefined outside a secure context → reject) and the
  `writeText` call itself (may throw before returning a promise → reject), both collapsing into one
  rejection shape. `navigator.clipboard.writeText` needs no `clipboardWrite` manifest permission
  (transient activation from the click; 007/008's already-verified finding, re-confirmed against the
  real panel click below) — `writeText`, not `ClipboardItem`: plain text, one format.
  **Q4 — a NEW SIBLING MODULE (`src/export/copyPlainText.ts`), not `htmlExport.ts`.** `htmlExport.ts`'s
  whole framing is D-3's shared clone-based serializer — every export it carries takes a reader
  `host` and works off the ALREADY-SANITIZED clone. `copyAsPlainText` reads a different thing
  entirely (`MarkdownFile.read()`'s raw source, never the clone, never the DOM), so stretching
  `htmlExport.ts`'s contract to cover a second, unrelated input shape was rejected in favor of a
  small, separate module. The one exported type (`ReadableSource = { read(): Promise<string> }`) is
  a LOCAL structural narrowing of `folderSource.ts`'s `MarkdownFile`, not an import of it — `src/app`
  already depends on `src/export`, so importing `MarkdownFile` the other way would reverse that
  layering; `activeFile` satisfies `ReadableSource` structurally with no adapter.
  **Q5 — both carried items applied.** The panel-level real-clipboard test matches THIS fixture's own
  expected content (never mere non-emptiness) in its poll, avoiding the shared-real-OS-clipboard race
  3.3 hit. `tests/browser/exportPanel.browser.test.ts`'s trap-order assertions (Tab-from-last-stop /
  Shift-Tab-from-first-stop, now `close, html, copy-html, copy-plain-text`) and its disabled-rows
  list were updated in place, 3.2's own test intent unchanged.
  **★ AN UNANTICIPATED THIRD RIPPLE, FOUND DURING VERIFY, NOT NAMED IN THE KICKOFF.**
  `copyAsHtml.browser.test.ts`'s OWN "other 3 rows stay disabled" assertion (written at task 3.3)
  named `copy-plain-text` among the still-inert rows — flipping that row live at 3.4 would have left
  this assertion asserting a now-false thing (`row.disabled` toBe `true`) had it not been caught.
  Fixed in place (now "the other 2 rows"), the same necessary-ripple shape as `exportPanel.browser
  .test.ts`'s own ripple, tied to this task's own row-liveness change — confirmed via a targeted grep
  for every remaining `copy-plain-text` reference in the tree before considering Verify complete.
  **★ RAW-SOURCE-NOT-RENDERED PROOF, the mirror of 3.3's own Q2 proof.** A fixture whose source
  visibly differs from its render (`**bold**` → "bold") is copied via a captured `writeText` stub:
  the captured payload equals the fixture's SOURCE exactly, contains `**bold**`, and is asserted
  `not.toBe` the mounted clone's own `textContent` — proving `copyAsPlainText` reads `source.read()`,
  never the clone, the exact opposite of `copyAsHtml`'s `plainTextOf(clone)`.
  **★ BYTE-IDENTICAL TO SOURCE, hostile fixture (unicode, trailing whitespace, mixed CRLF/LF),
  proven via the captured-write direct-call test** — this is the code-level claim, and it is exact:
  the string handed to `clipboard.writeText` is asserted `toBe` the fixture, character-for-character,
  length-for-length.
  **★ MEASURED, DURING VERIFY: THE REAL OS CLIPBOARD ON WINDOWS/CHROMIUM NORMALIZES `\n` TO `\r\n`
  FOR PLAIN TEXT — an OS/engine artifact, not a Peekover defect, the same KIND of finding 3.3's own
  probe made for `text/html`.** The panel-level real-clipboard test first asserted the round-tripped
  `readText()` result `toBe` the LF-only fixture verbatim and reproducibly failed on Chromium (passed
  on Firefox) with `\r\n` where `\n` was written — CF_UNICODETEXT's own Windows convention, applied
  by the OS clipboard itself between `writeText` and `readText`, outside any code this task owns.
  Confirmed NOT a `copyAsPlainText` defect: the captured-write tests (which observe the string BEFORE
  the OS clipboard normalizes it) show the exact, unmodified fixture reaching `writeText`. Fixed by
  normalizing CRLF→LF on the READ-BACK side of the real-clipboard comparison only — the
  byte-identical-to-source claim itself stays proven by the captured-write test, untouched by this
  fix; the real-clipboard test's own job (row is live, permission-free, writes THIS fixture's
  content) is unaffected by the normalization.
  **Byte discipline — the delta, measured, decomposed, firing control fired.** App-page chunk moves
  **483,689 → 484,039 B (+350 B), identical on both engines** (`app-G-PkoaEJ.js`, byte-identical hash
  on both builds). Unlike 3.3 (new exports from an ALREADY-imported module), this is a genuinely NEW
  module landing in the graph (`copyPlainText.ts`) — attributed entirely to this task's own new logic
  (`ReadableSource` is type-only, erased; `writeTextToClipboard` + `copyAsPlainText`'s real bodies)
  plus the one-row wiring (`ExportViewOptions.onCopyPlainText`, one `RowSpec.onClick`, `appShell.ts`'s
  handler). **Firing control**: `git stash` the entire diff and rebuild Chrome — the app chunk
  returns to exactly **483,689 B** (`app-D2wfVcUY.js`, a different content hash, confirming real
  content moved) and the content-script md5/size are unchanged at baseline; `git stash pop` restores
  the working tree exactly, confirmed via `git status`. `.output` **4,875,201 B (Cr) / 4,875,317 B
  (Fx)**, same +350 B delta both engines, ~367.3 KiB (Cr) headroom remaining, robustly under the 5
  MiB ceiling. Content-script md5 **`41e7607a…` (Cr) / `69338e67…` (Fx) — byte-identical to
  baseline**, confirmed by a full rebuild of BOTH engines (not a stale directory — Firefox rebuilt
  explicitly via `wxt build -b firefox`, the standing memory-of-record pitfall). Manifests **654 /
  770 B**, `permissions: []` — `writeText` needs no `clipboardWrite` permission (transient
  activation, re-confirmed against the real panel click). `dependencies` unchanged at 6.
  **Suite.** Unit: **1053/1055** — the 2 failures are the standing `diagramEnhancer.test.ts`
  timing-flakiness carried item, confirmed pre-existing by an isolated re-run (58/58 green alone),
  not caused by this task (which touches neither file). Full browser suite: **142 files / 1459
  passed / 15 skipped, 0 failed** (140/1447/15 baseline + this task's new file, 6 tests × 2 engines =
  +12; the 2 ripple files' own test counts unchanged, only assertions/row-sets updated in place).
  Lint/typecheck clean. Golden diff empty.
  **Revisit-when:** the Windows/Chromium CRLF-normalization finding above is worth re-checking if a
  future task needs an EXACT (not newline-normalized) real-clipboard round trip on this platform —
  none does today. Task 9.1 owns the completion/failure UI this task named but did not build (same
  standing note as 3.3's own entry).

- **2026-08-29 · M10 D-4 (task 3.3) — Copy-as-HTML lands: `copyAsHtml`/`plainTextOf` in `htmlExport.ts`, the
  panel's 2nd row wired live, and the same-artifact cross-sink check uses a captured `ClipboardItem` rather
  than a real OS clipboard round trip — a MEASURED finding, not a design preference.** D-4's HTML half is
  this task's own first implementing commit (gate-1's D-4 approval, §7-2: *"`ClipboardItem` with `text/html`
  + `text/plain`, reusing 007/008's already-verified permission-free clipboard finding"* — the plain-text
  half remains task 3.4's).
  **`copyAsHtml(host)`, VERBATIM to §3.3's own body**: `serializeReaderDocument(host)` +
  `wrapInStandaloneDocument(clone, theme)` — the SAME two calls `exportHtml` makes (task 3.1), no second
  serialization path, no image walk. `navigator.clipboard.write([new ClipboardItem({ 'text/html': ...,
  'text/plain': plainTextOf(clone) })])`, awaited; a rejection is rethrown, never swallowed (AGENTS.md #5 —
  no false success). `appShell.ts`'s own `onCopyHtml` handler does not catch-and-discard either: `tryStore`'s
  best-effort swallow (used for storage ops elsewhere in that file) does not apply to a deliberate user copy
  action, so a rejection surfaces as a genuine unhandled-rejection error. Per-action completion/failure UI (a
  "Copied"/"Copy failed" state, `codeView.ts`'s own copy-button precedent) is task 9.1's own milestone-wide
  scope, named but not built here.
  **`plainTextOf(clone) = clone.textContent`, confirmed as the RENDERED text, not the raw source (this
  task's own Q2).** §4's own line ("copy the raw source text exactly as authored") is task 3.4's distinct
  payload; if 3.3's fallback read the source instead it would be byte-identical to 3.4's whole payload — the
  two-paths-same-bytes redundancy the §3.1(cont.) ZIP ruling already removed once. Proven with a fixture
  where the two diverge visibly: `**bold**` renders as "bold"; the captured fallback reads "bold", never
  "**bold**" and never the raw source string.
  **★ THE SAME-ARTIFACT / CROSS-SINK INSTRUMENT (this task's own Q3) — MEASURED, THEN CHOSEN, NOT ASSUMED.**
  A throwaway probe against this harness (real Chromium AND Firefox, run before the real test file was
  written) found the native `text/html` OS clipboard format is LOSSY on both engines: Chromium discards the
  whole document — `<style>`, `<head>`, the doctype — and re-serializes the content as a fragment with every
  rule turned into a per-element `getComputedStyle`-derived inline `style` attribute (this IS the transform
  task 4.1's Copy-as-rich-text will actually want); Firefox preserves more structure but reformats whitespace
  and silently drops the `<meta charset>` tag. Neither loss is a Peekover defect. It means a REAL clipboard
  round trip would answer a different, irrelevant question — "did the OS's own rich-paste transform survive"
  (it provably does not, byte-for-byte, on either engine) — instead of this task's own question: "did
  `copyAsHtml` hand the Clipboard API the SAME bytes `exportHtml` downloaded." So the same-artifact assertion
  CAPTURES the `ClipboardItem` instead, reusing `diagramActions.browser.test.ts`'s own stubbed-
  `navigator.clipboard.write` shape (a SECOND call site for that shape, still under rule-of-three — no shared
  helper extracted) and reads the Blob directly via `getType()`; `copyAsHtml` itself, `serializeReaderDocument`,
  and `wrapInStandaloneDocument` all run unmodified — only the native `write()` call is intercepted. **No new
  `vitest.config.ts` command was added** — this is reused/extended existing test infra, not new infra, unlike
  what the task kickoff anticipated. The separate PERMISSION-FREE / real-write claim is proven through the
  REAL clipboard, because `text/plain` (unlike `text/html`) round-trips UNMANGLED on both engines (same
  probe) — `tableCopy.browser.test.ts`'s own consent-and-gesture shape (a Chromium-only CDP
  `clipboardReadWrite`/`clipboardSanitizedWrite` grant, a real `userEvent.click`, `readText()` in-page,
  Firefox needing no grant at all since it has no `clipboard-write` `PermissionName`) is reused verbatim,
  driven through the real panel row so it also proves the row is live.
  **The firing control.** The byte-identity comparison is exercised against two REAL documents (different
  content AND a different theme, through the SAME pair of sinks) and asserted to come out UNEQUAL, each
  containing only its own document's own text — proving the comparison discriminates two different artifacts
  rather than trivially matching a pure function called twice.
  **Q1-verify — CONFIRMED (a).** `exportControls.ts` gained one field (`ExportViewOptions.onCopyHtml`) and
  set exactly one `RowSpec.onClick` (`copy-html`); no other row's shape changed. `htmlExport.ts` gained two
  new exports (`copyAsHtml`, and the internal `plainTextOf`); no existing export's signature moved.
  **Q4 — NOT RE-DECIDED HERE; the task kickoff's own framing was checked against reality and found wrong,
  flagged rather than followed (WORKFLOW.md's "a kickoff is a hypothesis, not authority" rule).** The
  kickoff assumed task 3.3 was "the first task flipping a row live" and treated that as the natural place to
  record the disabled-rows/day-one-shape decision. That premise is false: task 3.2 flipped the FIRST row
  live (HTML export) and ALREADY recorded this exact decision (this file's own 2026-08-29 M10 D-2/D-10/
  Ruling-2 entry, immediately below: *"The other 4 rows render as real, accessibly-named `<button>`s that
  are simply `disabled` — present so the panel reads as the whole feature on day one... inert until their
  own task supplies a handler"*). Task 3.3 is the SECOND row to flip, not the first; `exportControls.ts`'s
  own doc comment was updated to cite 3.2's decision rather than re-argue it, and no duplicate entry is
  written here for the same call.
  **A genuine cross-file race, caught and fixed before landing.** The panel-level real-clipboard test first
  polled `navigator.clipboard.readText()` for ANY non-empty value as its completion signal (no completion UI
  exists yet — task 9.1's own scope). That flaked intermittently under the FULL suite (green in isolation,
  red under `pnpm test:browser`'s full 140-file run): the real OS clipboard is a resource shared across every
  serially-run file in this suite (`fileParallelism:false`), and the poll's first non-empty read was
  sometimes stale content an earlier file's own clipboard write left behind, read before THIS test's own
  write had landed. Fixed by matching on this fixture's own expected content rather than mere non-emptiness.
  Two consecutive full `pnpm test:browser` runs came back green after the fix.
  **Necessary ripple — `tests/browser/exportPanel.browser.test.ts` (task 3.2's own file), not scope creep.**
  Flipping copy-html live moved the panel's enabled tab-stop set from 2 (close, HTML) to 3 (close, HTML,
  copy-HTML) — 3.2's own focus-trap test had hard-coded `html` as the LAST stop (Tab-from-last-stop wraps to
  first; Shift-Tab-from-first wraps to last), which is no longer true now that copy-HTML is enabled and sits
  after it in DOM order. Its "other 4 rows disabled" assertion also named `copy-html`, no longer accurate.
  All three fixed in place to reference the CURRENT stop/row set; 3.2's own test intent (the trap wraps
  correctly; not-yet-wired rows stay inert) is unchanged — this is the Files-list-adjacent ripple AGENTS.md's
  workflow section names as necessary, not scope creep, tied to this task's own Verify clause (the same-row
  disabled-state assertion) rather than an unrelated cleanup.
  **Byte discipline.** App-page chunk **483,331 → 483,689 B (+358 B), identical on both engines** —
  `copyAsHtml`/`plainTextOf` are new exports from an ALREADY-imported module (`htmlExport.ts` landed at 3.2),
  so the delta is exactly this task's own new logic plus the one-row wiring, not a module landing. `.output`
  **4,874,851 B (Cr) / 4,874,967 B (Fx)**, same +358 B delta both engines, ~367.6 KiB (Cr) headroom
  remaining. Content-script md5 **`41e7607a…` (Cr) / `69338e67…` (Fx) — byte-identical to baseline**,
  confirmed by a full rebuild of both engines (not a stale directory). Manifests **654 / 770 B**,
  `permissions: []` — re-confirmed against the REAL panel click, not merely cited. `dependencies` unchanged
  at 6.
  **Suite.** Unit: **1055/1055**, no flakes fired this run. Full browser suite: **140 files / 1447 passed /
  15 skipped, 0 failed**, reproduced clean across two consecutive full runs after the race fix above.
  Lint/typecheck clean. Golden diff empty.
  **Revisit-when:** task 4.1 (Copy-as-rich-text) is the natural home for the Chromium fragment-with-inlined-
  styles transform this task's own probe surfaced — it is likely close to (or exactly) what that task needs,
  cited here so 4.1 does not re-derive it from scratch. Task 9.1 owns the completion/failure UI this task
  named but did not build.

- **2026-08-29 · M10 D-2 / D-10 (panel half) / Ruling 2 (task 3.2) — the export panel lands: `exportControls.ts`
  follows `storageControls.ts`'s own wiring, the mockup's shape (minus the 4 struck/out-of-scope rows) is
  carried for the 5 surviving rows, and Ruling 2's focus trap is discharged.** Three gate-2 approvals get
  their first implementing commit here — none had landed one before this task, since no earlier M10 task
  touched `exportControls.ts` or built any trap.
  **D-2, applied VERBATIM** (`plan.md` §0's own text): *"010 D-2 — export controls are app-page chrome, not
  reader chrome, so they follow storageControls.ts's wiring rather than mount()'s children[] pattern."*
  `createExportView(doc, opts) -> {element}` mirrors `createStorageView`'s stateless-builder-plus-slot shape
  exactly; `appShell.ts` owns open/close state and inserts via `exportPanel.replaceChildren(...)`, the same
  pattern as `storagePanel`. `mount.ts` is touched at zero sites — confirmed by diff, not assumed.
  **D-10, panel half only, applied VERBATIM** (`plan.md` §0's own text, which covers BOTH halves of D-10):
  *"010 D-10 — the export panel and the print @media block both predate this spec in the mockup, which
  corrects §7-7's own 'no mockup known to exist' framing the same way 009 corrected an identical claim about
  code blocks."* Only the PANEL half is real as of this commit — the mockup's `#exportsOverlay`
  (`design/mockup.html:861-874`) supplied the icon-glyph-plus-subtext visual language for the panel's 5
  surviving rows (HTML/PDF/rich-text carried from the mockup's own 3 matching rows; Copy-as-HTML and
  Copy-as-plain-text designed in the same language, since D-10's own plan-time finding already noted the
  mockup draws no row for either). The print-`@media`-block half of this same D-value remains pending task
  6.1, which is where its own implementing entry lands.
  **Ruling 2 (gate 2, plan §8 Q2) — MATCH THE MOCKUP'S `aria-modal="true"` CONTRACT, REUSE
  `diagramLightbox`'S TRAP/RESTORE BASELINE — discharged, not re-argued.** `exportControls.ts` copies
  `diagramView.ts`'s `openDiagramLightbox` shape inline (its own keydown closure: Tab wrap computed from a
  live tab-stop scan over enabled buttons, Escape asks the caller to close) — no shared trap helper exists
  anywhere in this codebase (rule-of-three: `diagramLightbox` plus this panel is two call sites, not three,
  so extracting one is a future call, not this task's). The RESTORE half (focus back to `exportToggle`,
  guarded by `isConnected`) is `appShell.ts`'s own job, mirroring the open/close split
  `toggleStorage`/`renderStorage` already use. `tests/browser/exportPanel.browser.test.ts`'s row-11 suite
  proves the trap real-engine (Tab/Shift-Tab wrap, Escape closes + restores, AND the negative — a control
  behind the panel is unreachable by Tab while it is open, red-first-ablated to confirm the assertion can
  fail: breaking the wrap sends focus to real controls behind the panel, `peekover-app__chip-revoke` /
  `peekover-app__export-toggle`, on both engines).
  **Q1 (this task's own central unknown, not a plan D-value) — RESOLVED (a): 3.2 wires HTML export's row
  live.** tasks.md's §3.2 body lists 5 surviving rows and says each row's own task (3.1, 3.3, 3.4, 4.1,
  6.1/7.1) is where its wiring "lands" — but 3.1 (HTML export's function) already landed with no panel to
  wire it into, and no later task's Files list revisits `exportControls.ts` for HTML specifically (3.3/3.4/
  4.1/7.1 each touch it once, for their OWN row). So 3.2 is the only place HTML's row can go live, and it
  does: `exportControls.ts`'s `html` row calls `opts.onExportHtml`, which `appShell.ts` wires to the real
  `exportHtml(host, basenameForExport())` — `htmlExport.ts`'s FIRST import into the app graph. The other 4
  rows render as real, accessibly-named `<button>`s that are simply `disabled` — present so the panel reads
  as the whole feature on day one, inert until their own task supplies a handler.
  **Byte discipline — the delta, MEASURED, not the confirmation 3.1 gave.** App-page chunk moves off
  475,579 B for the first time in M10: **483,331 B (+7,752 B), both engines identical.** Confirmed by string
  search in the built chunk (`peekover-export`, `Export as HTML`, `translateReaderStylesheet` all present) —
  the delta is real wiring, not dead code the bundler happened to retain. The delta is small because
  `READER_CSS`'s own text — the bulk of what `translateReaderStylesheet` reads — was ALREADY in the app-page
  chunk via `readerPane.ts`'s own pre-existing `mount()` import; only `htmlExport.ts`'s own new logic
  (`translateReaderStylesheet`'s parser, `wrapInStandaloneDocument`, `downloadAs`, `exportHtml`) plus
  `exportControls.ts`'s own DOM-building code are genuinely new bytes. `.output` **4,874,493 B (Cr) /
  4,874,609 B (Fx)** — same +7,752 B delta both engines, ~368,387 B (Cr) headroom remaining, robustly under
  the 5 MiB ceiling. `pnpm zip` **1,472,891 B (+2,161 B)**, ~610 KiB headroom remaining. Content-script
  md5 **`41e7607a…` (Cr) / `69338e67…` (Fx) — byte-identical to baseline**, confirmed by a full rebuild of
  both engines (not a stale directory). Manifests **654 / 770 B**, `permissions: []`, no
  `web_accessible_resources` — unchanged. `dependencies` unchanged at 6.
  **Q2 (this task's own scope, not a plan D-value) — RESOLVED: DISABLED, not hidden.** `exportToggle` is a
  document-scoped affordance (every row targets the CURRENTLY OPEN document); unlike `storageToggle`
  (global), it renders `disabled` whenever `activeFile == null` and enables the instant a file is selected
  — matching the disabled-not-hidden visual language `__cta`/`__pin` already establish elsewhere in this
  shell (present so the control is discoverable before any document is open, inert until it has something
  to act on). `setActiveFile` (new, `appShell.ts`) is the one place `activeFile` is now assigned, so the
  toggle's disabled state can never drift from the value it gates on.
  **Suite.** Full unit suite unaffected by this task (no file it touches has a test file of its own beyond
  the new browser suite — `appShell.test.ts`'s existing 62 tests all still pass unmodified). Full browser
  suite: **138 files / 1433 passed / 15 skipped, 0 failed** (136/1403/15 baseline + this task's one new
  file, 15 tests × 2 engines = +30). Lint/typecheck clean. Golden diff empty (a panel is chrome, not
  content — no parse/sanitize/render path touched).
  **Revisit-when:** D-10's print-`@media`-block half — task 6.1's own implementing entry. Ruling 2's
  rule-of-three non-extraction — if a third focus trap appears anywhere in this codebase, that is the
  trigger to extract a shared helper, not before.

- **2026-08-29 · M10 §3.1(cont.) — HUMAN RULING: ZIP EXPORT (task 3.5) DROPPED FROM M10 ENTIRELY, A DOWNSTREAM
  CONSEQUENCE OF THE §3.1 LOCAL-IMAGE RULING (immediately below), NOT A RE-LITIGATION OF IT. Unlike DOCX
  (§3.10) and local-image embedding (§3.1), this is a WHOLE-TASK STRIKE — task 3.5 has no surviving half worth
  keeping, the same shape §3.10's DOCX task 5.1 took, not a reduction.**
  Ruled by the human, immediately after ruling the §3.1 local-image drop. The §3.1 RESOLUTION entry (below)
  is the **evidence input** this entry cites, not re-derives — its own text already flagged task 3.5's
  remaining scope as "genuinely thin" and routed the call here; that flag is the reviewer's analysis, not the
  decider. This entry banks the decision the human made from it.
  **Rationale.** The §3.1 local-image drop removed the ONLY thing that made ZIP export more than
  Copy-as-plain-text (task 3.4). Shorn of images, task 3.5 is "package the byte-identical markdown source into
  a `.zip`" — the SAME raw markdown source task 3.4 already delivers to the clipboard (spec §4: *"the system
  shall copy the raw source text exactly as authored"*), by a different exit. A source-only ZIP is an
  elaborate way to produce a file the user already has (copy-paste-save, or the editor/browser's own native
  save) — not worth its own task.
  **Dependency consequence.** ZIP export was the SOLE consumer of `client-zip` (installed at task 1.1, measured
  +6,538 B). Dropping 3.5 ORPHANS `client-zip` — deps target **6** (7 → 6, the pre-1.1 count). **Confirmed,
  not assumed:** `grep -rn "client-zip|from 'client-zip'|clientZip|downloadZip|makeZip" src/ entrypoints/
  scripts/` returns **zero hits** — ZIP export was never implemented (3.5 never ran; 2.2's serializer and
  3.1/3.2 don't zip), so `client-zip` is imported by nothing today. `package.json`'s own `dependencies` block
  confirms 7 entries with `client-zip` present. **Kept installed THIS commit** — doc-only, no
  production/dependency diff, so a full-suite Verify is not triggered — **removed in an immediate follow-up
  dependency act** (`pnpm remove client-zip`, lock update, `pnpm audit --prod` re-run, deps 7→6, its own
  full-suite Verify), the same two-commit rhythm the §3.10 ruling → `docx` removal used. Until that follow-up
  lands: dep count is **7**, current state is `client-zip` installed-but-unused.
  **Consequences, landing in this same commit:** `specs/010-local-exports/tasks.md` task 3.5 is struck-in-place
  (mirroring DOCX task 5.1's whole-task strike, never deleted) — group 3 is now 4 active tasks (3.1–3.4), not
  5; active count for M10 moves **21 → 20**; the §4 EARS-coverage line's ZIP-export mapping is struck; task
  9.1's Files list and task 9.2's Verify text (the only other tasks referencing `zipExport.ts`/ZIP export)
  are corrected to stop treating it as a built path. `spec.md` moves the ZIP-export §4 clause to §6 IS-NOT
  (mirroring the DOCX and local-image IS-NOT entries) and restates §3.1's scope-item count (eight items, not
  nine — seven F9 local items + F5 print mode). `plan.md` strikes `zipExport.ts` from its Files-to-create list
  (mirroring `docxExport.ts`'s own strike) and strikes the zipExport pseudocode/description whole, rather than
  the prior partial "STRUCK/AMENDED" annotation. `progress.md`'s Now-pointer advances: ZIP export dropped,
  3.5 struck, `client-zip` orphaned-pending-removal, active count 21→20, next actionable task still 3.1
  (reduced). `spec-coverage.md` carries **no** M10/010 reference of any kind (grepped, zero hits, the same
  finding the §3.10 ruling made) — no ripple there.
  **Revisit-when:** ZIP export (or any bundle export) returns to a future milestone — paired with the
  local-image/seam-extension revisit-when immediately below, since a ZIP that bundles source+assets is the
  version worth having, and it needs that seam work anyway (one trigger, not two).

- **2026-08-29 · M10 §3.1 — HUMAN RULING: LOCAL-IMAGE BASE64/FILE EMBEDDING DROPPED FROM M10 (HTML export §4
  + ZIP export §3.5). THE §3.1 STOP-FLAG (below) IS RESOLVED BY SCOPE REDUCTION — not seam extension
  (option a), not Chromium-only asymmetry (option b). Tasks 3.1 and 3.5 are REDUCED, not struck whole — they
  survive shorn of their image half, unlike §3.10's DOCX task 5.1, struck in full.**
  Ruled by the human at the §3.1 gate. The §3.1 STOP-FLAG entry (below) and the MEASUREMENT NOTE
  (immediately below that, `472f7e0`) are **evidence inputs this entry cites, not re-derives** — they did
  not decide anything; the human did, from what the note priced.
  **What survives, narrowly (D2's own finding).** HTML export still ships: the clone, the translated
  `:host`→`body` stylesheet (D-3, task 2.2, unaffected), and every rendered DIAGRAM — `diagramView.ts:232`
  pulls Mermaid's rendered `<svg>` straight out of the live DOM and rasterizes it in-memory
  (`diagramSvgText`/`diagramPng`, `:267-304`), never touching `folderSource.read()` — so diagram embedding is
  untouched by this ruling. ZIP export still ships the markdown source, byte-identical, with path rewriting
  for whatever remains shippable. Remote images stay unrewritten references, exactly as Ruling 3 (§9-3,
  unchanged) already stated. **Only local RASTER image embedding — the Base64 walk in HTML export, the
  local-file-copy half of ZIP export — is dropped.** A local `![](./x.png)` becomes a broken/omitted
  reference in the export, the SAME state D1 (below) found the reader itself already shows today — not a
  regression from current behavior.
  **What's deferred.** Seam extension (option a) — walking `FolderSource.handle`'s directory handle
  (Chromium) or restoring the discarded `File`/`DataTransferItem` entries (Firefox, structurally absent
  today) to reach image bytes — has value independent of M10 (recents/pins/watch/tree already depend on the
  seam) but belongs in a future milestone with its OWN gate, not smuggled into M10 as ripple on a boundary
  gate 2 never anticipated moving. **Revisit-when:** local-image embedding returns to a future milestone,
  paired with the seam-extension work a real local-image capability requires on BOTH engines (one trigger,
  not two).
  **What's rejected.** Chromium-only image embedding with a stated Firefox asymmetry (option b) — breaks the
  Cr+Fx-parity discipline held since M1; not adopted.
  **Evidence inputs, cited not re-derived:**
  - **§3.1 STOP-FLAG** (below) — the folder-source seam retains no byte-readable local-image reference on
    either engine; `walkPolicy.ts`'s `isMarkdownFile` gate filters the walk to markdown files only, so no
    `MarkdownFile`/`FoundFile`/`.read()` is ever constructed for an image. Firefox has no recovery path at
    all (`firefoxFolderSource.ts`'s `snapshotSource` discards every non-markdown entry synchronously during
    the same walk); Chromium is theoretically recoverable but only via new, unshipped glue.
  - **MEASUREMENT NOTE D1** (below) — **the pivotal finding.** Local relative-path images do NOT resolve in
    the app-page reader TODAY: a relative `![](./img.png)` resolves against the app page's own
    `chrome-extension:`/`moz-extension:` `baseURI`, which `mediaPolicy.ts`'s `classifyMediaUrl` buckets as
    `inert` (neither `http(s):` nor `file:`) and leaves untouched — a 404/broken-image icon in ordinary use.
    So option (c)'s cost on this axis specifically is low: dropping local-image embedding concedes no
    capability the reader currently delivers. **Confidence: high, code-derived, not byte-measured** — the
    human ruled on the code trace (baseURI wiring + classification logic + the read path, three
    corroborating lines) and judged a real-engine confirmation of D1 optional before ruling, the note's own
    honest caveat.
  - **MEASUREMENT NOTE D2** — diagram export is independent of the seam, confirmed: the SVG capture path
    never calls `folderSource.read()`. This is what makes option (c) narrow — "drop local raster image
    embedding only," not "drop all images."
  - **MEASUREMENT NOTE D3** — zero organic local relative-path raster images exist anywhere in this repo's
    own specs/docs/design corpus (grepped, control-fired); local raster images read as long-tail for this
    milestone's actual documents (F5 persona-1: agent-authored markdown), not core or common. One repo, not
    the universe of user documents — a real data point, not authoritative.
  **Consequences, landing in this same commit:** `specs/010-local-exports/tasks.md` tasks 3.1 and 3.5 are
  AMENDED — the local-image-embedding clause dropped from each; both survive as reduced tasks (3.1: HTML
  export ships text + translated CSS + diagram images; 3.5: ZIP export ships the markdown source, remote
  references unrewritten, local raster embedding no longer any part of its scope) — flagged, not silently
  collapsed, since 3.5's remaining scope is now thin (see below). `spec.md` §4's HTML-export clause loses its
  "every locally-resolvable image embedded as Base64" promise, moved to a new §6 IS-NOT entry (mirroring
  §3.10's DOCX move); §4's ZIP-export clause loses its "every locally-resolvable referenced image" inclusion
  the same way. `plan.md` strikes the FALSE seam-read claim at plan.md:156-159/374 (D-3's own text, which
  assumed `folderSourceFromHandle`/`FolderSource.read()` reaches image bytes — the claim the §3.1 STOP-FLAG
  falsified) and annotates D-3's image-embedding half as dropped-per-this-ruling. `progress.md`'s Now-pointer
  advances: §3.1 gate RULED, local-image embedding dropped by scope reduction, 3.1/3.5 reduced + UNBLOCKED,
  next actionable task 3.1 (reduced).
  **The `collectLocalImages` orphan.** `collectLocalImages` (shipped at task 2.2, `htmlExport.ts` — pure path
  math, no I/O) is still CALLED by `serializeReaderDocument` (2.2's own code invokes it unconditionally to
  build its return value) but its output — the local/remote image partition — is now consumed by NOTHING:
  3.1's reduced HTML export no longer needs to distinguish a local `<img>` from a remote one (both are left
  exactly as sanitize/`mediaPolicy` produced them, identical passthrough), and 3.5's reduced ZIP export no
  longer copies image files at all. Not unreachable, but its result is now dead weight. **Kept installed
  this commit** — removing it is a production-code act (full-suite Verify), not a doc-only gate commit — and
  is recommended for removal **at task 3.1's own implementation**, since 3.1's Files list already touches
  `htmlExport.ts` and is the natural place to also simplify `serializeReaderDocument`'s return shape
  (dropping `images`/`LocalImageRef`). Named so the omission reads as deliberate, not missed — the same
  interim language §3.10's own orphaned-`docx` entry used.
  **★ Task 3.5's remaining scope is genuinely thin, flagged rather than silently accepted.** Shorn of local
  image copying, ZIP export becomes "package the already-byte-identical markdown source into a `.zip`
  archive, remote image references left exactly as authored." Whether that is still worth its own task (vs.
  folding into 3.1/3.4's existing file/clipboard exits, or revisiting §3.1's scope further) is **not decided
  here** — this entry states the concern per the gate-act kickoff's own instruction to flag rather than
  collapse, and routes the call to whoever next picks up task 3.5's own implementation.
  **Revisit-when:** local-image embedding returns to a future milestone (merged with the seam-extension
  revisit-when above — one trigger, not two).

- **2026-08-29 · M10 MEASUREMENT NOTE — pricing §3.1's scope-reduction option (c) before the human
  §3.1 gate rules on it. Not a decision (rules nothing), not a task, not a tasks.md box.** §3.1 is
  STOP-AND-FLAGGED at the entry directly below (the folder-source seam has no byte-readable local-image
  reference on either engine); the human's three options are (a) extend the seam, (b) Chromium-only +
  Firefox asymmetry, (c) scope-reduce local-image embedding out of M10. This diagnostic prices whether
  (c) is a real regression from the reader's OWN behavior or close to free — read-only, chooses nothing.
  **STEP 0 — authority pinned:**
  (1) Spec §4: *"every locally-resolvable image embedded as Base64"* (line 127); §9-3 (spec.md:231)
  already ruled the sibling *remote*-image question — HTML/ZIP export embeds only already-locally-
  resolvable images and leaves remote references unrewritten (no new fetch). §3.1's gap is about the
  *local* half of that same promise: whether a local image is even reachable to Base64-embed at all.
  (2) `docs/ai/decisions.md` 2026-08-29 M10 §3.1 (below): confirms the three options and that this
  blocks 3.1/3.5 only, not the whole milestone.
  (3) The reader's own image-resolution path, traced code-first: `mount.ts:131` sets
  `baseUrl = host.ownerDocument?.baseURI`; `mediaPolicy.ts:59` (`classifyMediaUrl`) resolves a raw
  `<img src>` against that `baseUrl` and classifies `http:/https:` → remote (blocked), `file:` → local
  (allowed), anything else → inert (left untouched, native browser resolution). For the **app-page**
  reader — the only surface task 3.1/export touches (§3.2 confines exports there; content-script
  `file://` is out of scope per spec §6) — `host` comes from `createReaderPane(doc)` (`appShell.ts:550`),
  `doc` being the app page's own document. Its `baseURI` is the extension's app-page URL
  (`chrome-extension://…`/`moz-extension://…`), never rewritten to the opened folder's path — no `<base>`
  tag manipulation exists anywhere in `src/` (grepped). `readerPane.ts:238` confirms what actually feeds
  `mount()`: `file.read()` — the markdown TEXT only, via the same `MarkdownFile` the walk constructs — no
  image src rewriting, no blob-URL substitution, anywhere in that path.
  **D1 — THE PIVOTAL FINDING: local images do NOT resolve in the app-page reader today.** A relative
  `![](./img.png)` in a folder-opened document resolves against the app-page's own `chrome-extension:`/
  `moz-extension:` base URL — a scheme `classifyMediaUrl` buckets as `inert` (neither `http(s):` nor
  `file:`), so `mediaPolicy` leaves the `<img>` untouched and the browser attempts to load
  `chrome-extension://<id>/img.png` against the extension's own origin, which does not serve arbitrary
  user-folder paths — a 404/broken-image icon in ordinary use. This is the SAME practical outcome as
  case (ii) named in the kickoff (broken image), reached via the `inert`-bucket code path rather than the
  `remote`-block path. **Confidence: high, code-derived** (baseURI wiring + classification logic + the
  read path are all directly read, not inferred) but **not proven at the byte level** — a real-engine
  check (open a folder containing a genuine relative-path image, look at the rendered `<img src>` and
  Network/Elements panel) would convert this from "high-confidence code trace" to "measured," the same
  gap `docs/ai/decisions.md`'s own 2026-08-2x entry left open for the *unrelated* `file://` content-script
  surface (line ~2573 below — that question is about a different surface, still genuinely unverified, and
  this note does not close it). **Net: export's inability to embed a local image is NOT a regression from
  the app-page reader's own current behavior — the reader already shows it broken.** Option (c) costs
  little on this axis specifically.
  **D2 — diagram export is independent of the seam, CONFIRMED.** `diagramView.ts:232`
  (`figure.querySelector('svg')`) pulls the mermaid-rendered SVG straight out of the live DOM;
  `diagramSvgText`/`diagramPng` (lines 267-304) clone/serialize/rasterize it via a `blob:` URL → `Image`
  → `canvas.toBlob`, entirely in-memory, no `folderSource.read()`, no file handle, anywhere in the path.
  Under option (c), diagram embedding in HTML/ZIP export is untouched — (c) is "drop local **raster**
  image embedding only," not "drop all images."
  **D3 — corpus commonality, judgement input, grepped not measured.** `grep -rEo '!\[[^]]*\]\([^)]+\)'`
  over every `*.md` in the repo (control-fired: pattern matched fixture data before trusting the zero)
  found 5 image references total: 3 are `tests/golden/fixtures/images.md` (a synthetic fixture built
  specifically to exercise image handling — 1 local, 2 remote), and 2 are literal-text examples inside
  `docs/ai/decisions.md`/`specs/005-watch-diff/tasks.md` prose (`` ![](./some.png) ``, quoted as a
  discussion example, not an authored image). **Zero organic local relative-path raster images exist
  anywhere in this repo's own specs/docs/design corpus.** Consistent with F5 persona-1 (agent-authored
  markdown: CLAUDE.md, specs, plans, AGENTS.md — text, code, mermaid) — local raster images read as
  long-tail for this milestone's actual documents, not core or common. Not authoritative (one repo, not
  the universe of user documents) but a real data point, not an impression.
  **VERDICT INPUT (not a ruling):** D1 collapses the decision meaningfully toward (c) being cheap — the
  reader shows local images broken today regardless of what export does, so (c)'s "drop local raster
  image embedding" concedes a capability the reader doesn't currently have either, not a working feature
  users would notice regress. D2 confirms (c) is narrowly scoped (diagrams keep working). D3 suggests the
  concrete cost, even if (c) is chosen, is low-frequency against this milestone's actual target documents.
  None of this rules out (a) or (b) — extending the seam has value independent of M10 (recents/pins/watch/
  tree already depend on it, and a future milestone may want local-image byte access for other reasons) —
  but the human should weigh D1 specifically: is closing a gap the reader itself doesn't yet close worth
  reopening the sealed seam boundary now, versus deferring it. **Revisit-when:** the human rules at the
  §3.1 gate; if a real-engine check of D1 is wanted before ruling, that is a small, cheap follow-up this
  note recommends but does not perform (stays inside "read-only, no code" scope).

- **2026-08-29 · M10 §3.1 — STOP-AND-FLAG, NO CODE WRITTEN. The local-image-byte-read capability
  plan.md's D-3 rationale and pseudocode assume ("reads already-resolved local file bytes through
  the same folder-source read path `folderSourceFromHandle`/`FolderSource.read()` already uses…
  no new file-read capability," plan.md:156-159, restated in the `exportHtml(host)` pseudocode at
  plan.md:374) DOES NOT EXIST in the code as it actually landed.** Read `walkPolicy.ts`,
  `chromiumFolderSource.ts`, `firefoxFolderSource.ts` directly (task 3.1 kickoff's Step 0
  reconciliation, before any implementation): `walkMarkdown` (`walkPolicy.ts:245`,
  `isMarkdownFile` gate) filters the walk to markdown files only — a `MarkdownFile`/`FoundFile`
  entry, and therefore any `.read()` capability, is never constructed for a non-markdown file. No
  image byte, `File` reference, or handle survives folder-open on either engine.
  **Chromium** is theoretically recoverable: `FolderSource.handle` (`FileSystemDirectoryHandle`)
  survives, so NEW glue (not an existing path — nothing in this codebase does this today) could
  walk path segments via `getDirectoryHandle`/`getFileHandle` to reach an image's bytes. No new
  permission grant, but genuinely new mechanism, and `exportHtml(host)`'s literal single-argument
  signature can't reach it — the directory handle has to be plumbed in somehow, an expansion
  task 2.2 already set precedent for (`serializeReaderDocument(host, documentPath?)` exceeded the
  plan's own bare `serializeReaderDocument(host)` pseudocode without objection).
  **Firefox has no recovery path at all.** `firefoxFolderSource.ts`'s `snapshotSource` converts
  the walk's markdown-only `FoundFile[]` into `MarkdownFile[]`; the original `FileList`/
  `DataTransferItem` entries for every non-markdown file (images included) are discarded
  synchronously inside the same walk, on both the `<input webkitdirectory>` route and the drop
  route. There is no byte-readable reference to a local image left anywhere once folder-open
  completes — not a coding-effort gap, a structural one.
  **Why this blocks 3.1 (and 3.5, which needs the same capability for ZIP export's image
  files) rather than being absorbed as necessary ripple:** closing the Firefox gap requires
  extending `folderSource.ts`/`chromiumFolderSource.ts`/`firefoxFolderSource.ts` — the shared
  folder-source seam every other feature (recents, pins, watch, tree view) depends on, guarded by
  its own "the seam stays honest," engine-agnostic-above-the-seam invariants. None of those three
  files appear in plan.md §2's Create or Touch lists; gate 2 never anticipated this seam moving
  for M10 at all. That is a plan-level scope question (the same shape as task 2.1's finding (b),
  but with blast radius across the whole app rather than confined to `htmlExport.ts`), so it is
  flagged back rather than built silently or absorbed as task-level ripple — consistent with
  AGENTS.md's kickoff-reconciliation discipline and with how finding (b) was routed.
  **State:** no file touched, no task box ticked, no byte movement. 3.1 is NOT suspended for the
  whole milestone the way D-1's fork would have been — this is narrower, scoped to local-image
  embedding specifically. Options put to the human (not decided here): (a) extend the seam as an
  explicit, enumerated scope addition to M10 (real multi-file change, sealed-gate-2 boundary
  reopened); (b) ship Chromium-only image embedding for 3.1/3.5 with the Firefox asymmetry stated
  honestly against Verify rather than silently degraded; (c) a spec-level scope reduction
  (mirroring §3.10's DOCX resolution) if local-image embedding turns out not worth the seam
  change. **Revisit-when:** the human rules on one of the above; until then 3.1/3.5 do not
  proceed.

- **2026-08-29 · M10 D-3 (task 2.2) — `serializeReaderDocument`/`wrapInStandaloneDocument` land, WITH
  FINDING (b)'s AMENDMENT APPLIED, NOT PLAN's ORIGINAL VERBATIM TEXT.** `plan.md` §0's pre-written entry
  for D-3 reads: *"010 D-3 — the export serializer clones trusted nodes and bundles the existing
  stylesheet text; it never re-enters the parse/sanitize path and never inlines per-node computed
  styles."* The clone/no-re-parse/no-new-sanitizer half is applied VERBATIM and is exactly what shipped —
  `serializeReaderDocument` clones `.peekover-reader` with `cloneNode(true)` over already-sanitized nodes,
  serializes only AFTER cloning, adds no sanitizer profile. **The "bundles the existing stylesheet text"
  half is NOT applied verbatim, and plan.md §4 risk 1 already pre-authorized exactly this deviation**:
  *"if the shipped rules are `:host`-scoped, the export needs a translated copy… which changes D-3's
  'no new anything' framing and must be flagged back rather than built silently."* Task 2.1 (`b2ac25d`)
  ran that check and found (b): 26 `:host` rule sites, presentation-relevant, not shadow-boundary
  housekeeping. So 2.2 ships a **mechanically-derived translation** (`translateReaderStylesheet` in
  `src/export/htmlExport.ts`), not a string reuse: one general rule (no per-site table) — a bare `:host`
  rule carries onto `body`; a `:host([data-theme="…"])` rule resolves against the export's own theme,
  baked once; every other `:host([data-ATTR="…"])` rule (mode/diff/watch/network/toc — none of whose
  subject elements ride into `serializeReaderDocument`'s clone, which is `.peekover-reader` alone) drops.
  **DERIVED LIVE, not a committed second copy** — the function reads `READER_CSS`'s own text at call
  time, so there is one copy of the stylesheet's source in this codebase, not two that could desync; the
  mandatory drift guard (`htmlExport.test.ts`) instead pins the live `:host` rule count and proves, by a
  red-first ablation, that the count tracks a `readerCss.ts` edit rather than a hardcoded number. `25` of
  2.1's 26 counted sites live in `READER_CSS`; the 26th (`readerCss.ts:1191`, `CONTAINED_CSS`'s own
  `:host{ position:relative; inset:auto; }`, the app-page shell-region variant) is out of scope BY
  CONSTRUCTION — it is never fed into the transform, resolved by scope rather than by classification (and
  is unrelated to print, despite this task's own kickoff hypothesizing that reading — corrected on
  inspection: it is `mount({contained:true})`'s pane-vs-full-page variant, `readerCss.ts`'s own "CONTAINED
  variant" section, nothing to do with `@media print`, which `readerCss.ts` does not carry at all yet —
  task 6.1's own greenfield).
  **Consequences, landing in this same commit:** `src/export/htmlExport.ts` +
  `src/export/htmlExport.test.ts` (18 unit tests, jsdom) + `tests/browser/htmlExport.browser.test.ts` (4
  tests, real Chromium+Firefox — a necessary-ripple addition beyond 2.2's own Files list, justified by
  its own Verify clause: *"the exported document, opened standalone… renders visually equivalent to the
  reader"* is real-engine-or-nothing and 2.2's Files list named no such file). `vitest.config.ts` gains one
  server-side custom command (`renderStandaloneDocument`), the same "write a temp file, navigate a FRESH
  isolated context" pattern `probeFileUrlClipboard` already established, for the same reason: a browser
  test runs at the runner's own `http://localhost` origin and neither engine will navigate that page to
  `file://`. App-page/content-script bytes byte-identical to 2.1's own baseline (nothing yet imports the
  new module — 3.1/3.2 wire it in); dependencies unchanged at 7. Golden empty. Full suite green except the
  2 known pre-existing `codeDetect.test.ts` corpus-drift failures (confirmed same signatures as the
  2026-08-28 baseline). **Revisit-when:** never, for the clone/sanitizer half (D-3's original claim holds
  exactly as written); the translation's own "derive live" design means a future `readerCss.ts` edit needs
  no revisit here at all — the drift guard is the mechanism, not a trigger.

- **2026-08-24 · M10 §3.10 — HUMAN RULING: DOCX EXPORT (scope item 2 / task 5.1) DROPPED FROM M10. D-1's
  BUSTS FORK IS RESOLVED BY SCOPE REDUCTION — not subset, not lazy-split. Group 2 and every task below it
  except struck 5.1 are RE-AUTHORIZED to proceed under normal per-task byte discipline; no special gate.**
  Ruled by the human at the §3.10 gate. The 1.1 report (`e9120ae`) and the MEASUREMENT NOTE (`9788e3a`,
  immediately below) are **evidence inputs this entry cites, not re-derives** — they did not decide
  anything; the human did, from what they priced.
  **Precision on authority, checked before writing this entry:** spec §3.10 itself governs only the
  `docx`/ZIP-writer *dependency-act* discipline (licence, install-scripts, `pnpm audit --prod`) — it does
  not itself enumerate fork-resolution options. The subset/lazy-split/scope-reduction three-way menu is
  task 1.1's own acceptance-fork text (`tasks.md`), mirrored in D-1 below. "Lazy-split" borrows §3.2/§3.8's
  content-script-vs-app-page shape (hence "per §3.10" in D-1's own phrasing); "scope reduction" is not tied
  to a specific §3.10 clause — it is the fork's own third branch, a plain product-scope call the human is
  always free to make. Stated so this entry does not misattribute the option's authority to the spec.
  **THE FITS ARITHMETIC THAT AUTHORIZES RE-AUTHORIZATION.** Dropping DOCX frees `docx`'s full measured
  weight, **+373,820 B** (1.1's own ablated figure, `e9120ae`). The remaining scope's only anticipated
  dependency cost is `client-zip`'s **+6,538 B** (also 1.1's own figure). Against 9.3's own `.output`
  baseline (**4,866,741 / 4,866,857 B**) under the ≤5 MiB (AGENTS.md) bound, headroom is **376,139 B (Cr) /
  376,023 B (Fx)**; net of `client-zip` alone that is **369,601 B (Cr) / 369,485 B (Fx) remaining before any
  task's own glue is priced** — the exact figures the MEASUREMENT NOTE's own FLIP THRESHOLD already computed
  (there, framed as "how small must a docx-subset be to flip"; here, "how much room is left with no docx at
  all"). **Robust, not marginal** — this is the full headroom minus one already-measured, low-cost
  dependency, not the MEASUREMENT NOTE's own 4,508–9,085 B (Cr) subset margin.
  **WHY SCOPE REDUCTION OVER SUBSET.** The subset lever (drop `Table` OR `ImageRun` from `docx`'s own node
  surface) is real and viable — the MEASUREMENT NOTE priced it and it flips to FITS. But every one of its
  passing numbers "carries D-1's own unmeasured-glue caveat…a 4.5–9 KiB pass margin is a 'flips only if glue
  is near-zero' result, not a safe clearance" (the MEASUREMENT NOTE's own words, unaltered). The human chose
  the cushion a full scope-drop buys — most of a 367 KiB headroom, against nine remaining tasks' worth of
  unpriced glue — over gambling the rest of the milestone against a margin that thin. Lazy-split was already
  killed by the MEASUREMENT NOTE's own Step 0.1 finding (a dynamically-split chunk still ships inside
  `.output`, proven against `mermaid`'s own chunks) and is not reconsidered here.
  **RULING 1 (§9-1, DOCX math ships as plain source text) is now DEFERRED-WITH-DOCX, not resolved.** It was
  a ruling about DOCX export's own math handling; DOCX export no longer ships in M10, so the ruling has
  nothing left to apply to. **Revisit-when: DOCX export returns to a future milestone — paired with the
  revisit-when Ruling 1 already carried (F2 math shipping first), one trigger, not two.**
  **Consequences, landing in this same commit:** `specs/010-local-exports/tasks.md` task 5.1 (the whole of
  group 5) is struck-in-place with a pointer to this entry — **the first post-seal, mid-implementation
  strike this repo has made; no precedent exists in `decisions.md` or any prior milestone's `tasks.md`, so
  the form is set conservatively: struck, never deleted, so the 22→21 / 11→10 audit trail is preserved.**
  `spec.md` moves DOCX from scope-IN (§3.1) to a named deferral, with §9-1 marked DEFERRED-WITH-DOCX.
  `plan.md` strikes `docxExport.ts` from its Files-to-create list and annotates group 5 / D-1's fork
  resolution. `progress.md`'s Now-pointer advances: fork RESOLVED via scope reduction, group 2
  re-authorized, 5.1 struck, next actionable task 2.1. (`spec-coverage.md` carries **no** existing M10/010
  reference of any kind — checked by grep, zero hits — so there is no F9-projection text there for this
  ruling to ripple into; none added.)
  **The orphaned `docx` dependency.** Dropping the feature orphans the installed `docx` package (6→8 at
  1.1, imported by nothing once 5.1 is struck). Kept installed in THIS commit — doc-only, no
  production/dependency diff, so a full-suite Verify is not triggered — removed in an **immediate
  follow-up dependency act** (`pnpm remove docx`, lock update, `pnpm audit --prod` re-run, deps 8→7, its own
  full-suite Verify). Until that follow-up lands: dep target is **7**; current state is **8, with `docx`
  installed-but-unused**. `client-zip` stays — ZIP export (scope item 7) remains in scope.
  **Revisit-when:** DOCX export returns to a future milestone (Ruling 1's own merged revisit-when, above).

  **ARITHMETIC RECONCILIATION — an APPENDED correction to the 9788e3a MEASUREMENT NOTE below, not an
  in-place edit.** This file is append-only; the 2026-08-03 correction elsewhere in this file is the
  precedent this follows — *"the clause above is kept VERBATIM and is not struck through — it is banked
  history… a correction belongs in the record, not in a deletion."* The MEASUREMENT NOTE's own text and
  every delta it reports stand unchanged below; these two lines only clarify how to read it.
  (i) **The 163 B / 358 B seam.** The MEASUREMENT NOTE quotes both figures as gaps "vs 1.1's reported
  373,820 B" without naming that they measure two different surfaces. Read cleanly: **1.1's exact named
  surface, re-measured = 373,983 B; delta to 1.1's own report = +163 B, harness-literal noise (fake image
  bytes/strings), not a surface difference.** **The list-inclusive ceiling (5.1's true minimal surface, per
  its own Verify line) = 374,178 B — a SEPARATE comparison, not the same gap restated** — its own +358 B
  over 1.1's report is larger because it additionally includes list/numbering (+195 B) that 1.1's named
  imports omitted. Do not read 163 B and 358 B as two measurements of one thing; they are one measurement
  each of two different things, against the same 373,820 B baseline.
  (ii) **The 8 B cumulative gap.** The MEASUREMENT NOTE's own step figures — 351,029 + 199 + 195 + 9,093 +
  13,670 — sum to **374,186 B**, 8 B above its own stated ceiling of 374,178 B. Named and quarantined, per
  the byte-accounting rule (never left silent): **8 B attributed to minifier name-pool jitter across the
  four successive incremental builds each step required** (FLOOR, +HeadingLevel, +list, +Table, +ImageRun
  were five separate builds, not one) — not a transcription error in any single line, and too small to move
  the FLIP THRESHOLD, the subset verdict, or any delta either this entry or the MEASUREMENT NOTE states.
  Neither (i) nor (ii) changes a conclusion — the subset verdict (viable at a 4.5–9 KiB margin, not chosen)
  and every delta the MEASUREMENT NOTE reports stand exactly as written below.

- **2026-08-24 · M10 MEASUREMENT NOTE — pricing §3.10's "subset" option before the human spec revisit rules
  on it. Not a decision (rules nothing), not a task, not a tasks.md box.** M10 is SUSPENDED at D-1's own fork
  (BUSTS by 4,550 B `.output`); the provisional condition's fallback names three options — subset `docx`'s API
  surface, a lazy-split strategy (spec §3.10), or a scope reduction — and this prices the first so the human
  ruling reads evidence, not a guess. **Does not choose; states what the evidence supports/kills.**
  **STEP 0 — authority pinned before measuring:**
  (1) Spec §3.10 itself governs the ZIP-writer choice and dependency-act discipline; it does not define
  "lazy-split." That phrase is decisions.md/progress.md's own paraphrase of §3.2/§3.8's established
  content-script-vs-app-page shape (`plan.md`:54, spec §5 NFR:171) — `docx`/the ZIP writer may lazy-load on
  the **app page** the way `mermaid`/`shiki` already do (dynamic `import()`, no `web_accessible_resources`,
  since the app page isn't the content-script graph). **CONFIRMED EMPIRICALLY, not just by reading:** both
  `mermaid.core-*.js` and `mermaid-parser.core-*.js` exist as physical files inside `.output/chrome-mv3/
  chunks/` today, despite being lazy-loaded via `diagramEngine.ts`'s single `import('mermaid')` — proving a
  dynamically-split chunk still ships unpacked inside `.output` and is still counted against the ≤5 MiB
  ceiling. **Lazy-split changes the first-paint budget (§3.4), not the `.output` byte-budget (§5 NFR) — it
  cannot by itself un-bust D-1's fork.** This removes "lazy-split alone" from the menu the human is choosing
  between; it is a first-paint mitigation, orthogonal to the ceiling that actually busted.
  (2) Task 5.1's own stated minimal surface: `Document`+`Packer`+`Paragraph`+`TextRun` (irreducible core) +
  `HeadingLevel` + list/numbering (`Numbering`/`LevelFormat` — 5.1's Verify line names "ordered/unordered
  lists" explicitly) + `Table`/`TableRow`/`TableCell` + `ImageRun` (diagram embed, `diagramView.ts:298`). Math
  ships as plain source text (Ruling 1) — no math API surface at all.
  (3) What 1.1 actually measured (373,820 B): `Document`/`Paragraph`/`TextRun`/`HeadingLevel`/`Table`/
  `TableRow`/`TableCell`/`ImageRun`, each actually constructed. **1.1's own ceiling omitted list/numbering** —
  a real, if small, gap against 5.1's true minimal surface (below).
  **FLOOR vs CEILING (temporary harness, imported from `entrypoints/app/main.ts`, actually constructed per
  1.1's own tree-shaking-proof discipline; REVERTED before this note — see below):**
  - FLOOR (`Document`+`Packer`+`Paragraph`+`TextRun` only): **+351,029 B**, both engines identical delta.
  - +`HeadingLevel`: **+199 B** (cumulative 351,228).
  - +list/numbering (`Numbering`/`LevelFormat`): **+195 B** (cumulative 351,423).
  - +`Table`/`TableRow`/`TableCell`: **+9,093 B** (cumulative 360,516).
  - +`ImageRun` (CEILING, 5.1's full surface incl. list): **+13,670 B** (cumulative **374,178 B**).
  - Reconciliation surface matching 1.1's exact named imports (no list/numbering): **373,983 B** — within
  163 B (0.04%) of 1.1's reported 373,820 B, both engines, consistent direction — confirms 1.1's number as
  essentially THE minimal-surface price for the table+image surface as named; the residual 163 B is harness
  literal noise (fake image bytes/strings), not a surface difference. **1.1's ceiling was already close to
  minimal — this is not a kitchen-sink-vs-minimal spread, and the true 5.1 minimal (incl. list, which its own
  Verify line requires) is ~358 B higher than 1.1 reported: 374,178 B, not 373,820 B.**
  **SPREAD = ceiling − floor ≈ 23,149 B.** The floor alone is **93.9% of the full ceiling** — `docx`'s weight
  is overwhelmingly baked into `Packer`'s zip/xml serialization machinery (jszip/xml/xml-js transitives),
  not into which node types get imported. This is NOT a flat curve, though: within the 23 KiB spread, two
  features carry real, unequal weight — `Table` (+9,093 B) and `ImageRun` (+13,670 B) — while `HeadingLevel`
  and list/numbering are each under 200 B (functionally free).
  **FLIP THRESHOLD** (docx-subset must be `< 369,601 B` (Cr) / `< 369,485 B` (Fx) to flip to FITS while
  keeping `client-zip`'s +6,538 B): FLOOR alone fits with ~18.5 KiB to spare; FLOOR+heading+list+Table (drop
  `ImageRun`/diagram embed) fits at **360,516 B, ~9,085 B (Cr) headroom**; FLOOR+heading+list+`ImageRun` (drop
  `Table`) fits at **365,093 B, ~4,508 B (Cr) headroom** — tighter, marginal; the full 5.1 surface (374,178 B)
  BUSTS by **4,577 B (Cr) / 4,693 B (Fx)**, consistent with D-1's own 4,550 B bust. **Dropping either `Table`
  OR `ImageRun` alone is sufficient to flip; dropping both is not needed.** Every one of these passing numbers
  carries D-1's own unmeasured-glue caveat (2.2/3.x/5.1 wiring code is not priced here) — a 4.5–9 KiB pass
  margin is a "flips only if glue is near-zero" result, not a safe clearance.
  **VERDICT ON SUBSET ONLY (not a ruling on §3.10):** subsetting is a **real, actionable, non-flat lever** —
  the evidence supports it as viable IF the human is willing to drop table support or diagram-embed from DOCX
  export (dropping `ImageRun`/diagram-embed is the tighter of the two, ~4.5 KiB margin; dropping `Table` is
  the safer of the two, ~9 KiB margin), but KILLS "subset without dropping a named 5.1 feature" — the full
  minimal surface, correctly priced including list support, busts by more than 1.1 reported, not less.
  Lazy-split (Step 0.1) is evidenced to NOT relieve the `.output` ceiling on its own — it is a first-paint
  lever, not a byte-budget one, and does not appear on the menu as a standalone fix for this specific bust.
  **HARNESS REVERTED, byte-identical to the e9120ae baseline, reconfirmed post-revert:** `.output` 4,866,741 B
  (Cr) / 4,866,857 B (Fx); content-script md5 `41e7607a...` (Cr) / `69338e67...` (Fx) unchanged throughout
  every ablation step (D-2's firing control cited from 1.1, not re-earned — md5 read at floor, at ceiling, and
  post-revert, identical every time since the harness only ever touched `entrypoints/app/main.ts`, never the
  content-script graph). No dependency, manifest, or product/export code change — `package.json`/
  `pnpm-lock.yaml` untouched by this note (docx + client-zip already stood installed from 1.1).
  **Revisit when:** the human §3.10 gate rules on subset vs. lazy-split vs. scope reduction — this note is the
  evidence input to that gate, not a pre-emption of it.

- **2026-08-24 · M10 D-1 — the export dependencies are measured before they are trusted, because the current
  ~367 KiB `.output` headroom is the thinnest this project has carried into any gate-1 close. MEASURED: THE
  FORK IS TAKEN — BUSTS. Every remaining M10 task past 1.1 is SUSPENDED pending a spec revisit.**
  `plan.md` §0's own pre-written text, landed verbatim with the implementing commit per the per-task D-value-
  mapping discipline (closing the M9-9.3-named gap): *"010 D-1 — the export dependencies are measured before
  they are trusted, because the current ~367 KiB `.output` headroom is the thinnest this project has carried
  into any gate-1 close."*
  **ZIP-WRITER CHOICE (Ruling 1 / Q1, discharged here, not on faith):** `client-zip@2.5.0` (MIT, zero
  dependencies, write-only `downloadZip(files)` API matching task 3.5's exact need — package the raw markdown
  source plus locally-resolvable images, no streaming-from-network, no read-back). **The naive dedup
  hypothesis — that `jszip` would cost ≈0 marginal because `docx@9.7.1` already declares `jszip: "^3.10.1"`
  as its own dependency — was MEASURED AND FALSIFIED, not assumed either way.** Real ablation, both engines:
  `docx` alone costs **+373,820 B** on the app-page chunk (475,579 → 849,399 B); importing `jszip` ourselves
  on top costs a further **+96,056 B** (849,399 → 945,455 B) despite pnpm resolving both import sites to the
  identical on-disk package (confirmed via `pnpm add jszip` reporting `reused`, zero new downloads) — Rollup
  does not collapse the two call sites to zero marginal cost in practice. `client-zip` on top of `docx` alone
  costs only **+6,538 B** (849,399 → 855,937 B), because it delegates DEFLATE to the browser's native
  `CompressionStream` API rather than bundling a codec at all, so there is no second-codec tax the way `jszip`
  or `fflate` both carry. `client-zip` wins on marginal cost by a wide margin (6,538 B vs 96,056 B), on
  maintenance (mature, MIT, zero deps, API-adequate), and licence. `fflate` (0.8.3, actively maintained, MIT)
  was reasoned out of a full build: no dedup benefit over `docx`'s own bundled `jszip`, and a second full
  deflate codec bundled alongside it — dominated by `client-zip` on standalone size and by nothing on marginal
  cost, no scenario where it would win. `@zip.js/zip.js` (2.8.57, BSD-3-Clause, very actively maintained) was
  reasoned out on registry evidence alone: ~7.17 MB unpacked (vs `client-zip`'s ~41.8 KB), and its
  Web-Worker-based codec path is a `web_accessible_resources` risk this milestone cannot afford to open.
  **ABLATION, DECOMPOSED (both engines — Chrome/Firefox app-page chunk and `.output` moved identically, same
  content-hash both engines, consistent with every prior milestone's own pattern):**
  (a) `docx` alone: **+373,820 B** (the overwhelming majority of the budget — `Document`/`Paragraph`/
  `TextRun`/`HeadingLevel`/`Table`/`TableRow`/`TableCell`/`ImageRun`, task 5.1's own stated surface, each
  actually constructed in the harness so tree-shaking could not silently zero the reading).
  (b) `client-zip` on top: **+6,538 B**.
  (c) transitive: **0 unexpected** — no new content-script-graph chunk, no `web_accessible_resources` key at
  any ablation step; `docx`'s own transitives (`jszip`, `hash.js`, `nanoid`, `xml`, `xml-js`, `@types/node`
  [type-only, zero runtime bytes]) are already fully accounted inside (a); `client-zip` carries zero
  dependencies of its own.
  (d) Peekover's own glue: **0**, confirmed structurally — the harness was reverted before commit, and the
  final rebuild (docx + client-zip installed, unimported) is BYTE-IDENTICAL to the pre-task baseline on every
  measured figure (`.output` 4,866,741 / 4,866,857 B, app-page chunk 475,579 B, `pnpm zip` 1,470,730 /
  1,470,788 B, content-script md5 unchanged both engines) — nothing is wired in yet, exactly as task 1.1's own
  Files list (package.json + pnpm-lock.yaml only) requires.
  **TOTAL MEASURED DELTA (a+b, both engines identical): +380,358 B.** Against the **~367 KiB (375,808 B)**
  `.output` headroom: **BUSTS by 4,550 B (~1.2% over)**. Against the **~612 KiB (626,688 B)** `pnpm zip`
  headroom: the zip-compressed delta is **+105,875 B**, **PASSES with 520,813 B headroom remaining** — `pnpm
  zip` is not the binding ceiling; `.output` (unpacked) is.
  **GOVERNANCE, ALL CLEAR:** `pnpm audit --prod` → 0 advisories. Licence: every one of the 22 new
  production-tree packages (`client-zip`, `docx`, `@types/node`, `hash.js`, `inherits`, `minimalistic-assert`,
  `jszip`, `lie`, `immediate`, `pako`, `readable-stream`, `core-util-is`, `isarray`, `process-nextick-args`,
  `safe-buffer`, `string_decoder`, `util-deprecate`, `setimmediate`, `nanoid`, `xml`, `xml-js`, `sax`,
  `undici-types`) read from its installed `node_modules` `package.json` — MIT/ISC/BSD-class permissive
  throughout (`jszip` dual MIT-or-GPL, MIT terms taken; `pako` MIT-and-Zlib; `sax` BlueOak-1.0.0, permissive).
  Zero declare `preinstall`/`install`/`postinstall`. The `esbuild`/`spawn-sync` ignored-build-scripts warning
  is dev-tree only (confirmed absent from `pnpm list --prod`), matching 007 task 1.1's own precedent exactly.
  SBOM regenerated locally (`pnpm run sbom`, 188 runtime components) — gitignored/transient by design, not
  part of this commit's diff, same as 007's own 1.1.
  **CONTENT-SCRIPT BYTE-IDENTITY (D-2), firing control proven before trusting the zero:** baseline md5
  `41e7607a...` (Chrome) / `69338e67...` (Firefox); a real, reachable edit to `src/watch/contentWatch.ts`
  (a side-effecting `globalThis` write — a bare trailing comment was tried first and was silently stripped by
  the minifier, proving comment-only edits are the WRONG instrument) moved the Chrome md5 to `7a2b5584...`
  (334,858 → 334,925 B); reverting returned it to the exact baseline. The final post-install, harness-reverted
  build reconfirms both engines' md5s unchanged from baseline.
  **WAR (plan risk 5) OBSERVATION:** no `web_accessible_resources` key appeared in either built manifest at
  any ablation step (both stayed 654 / 770 B, `permissions: []`), and no new chunk landed in the
  content-script's own import graph — expected, since nothing is wired in at this task. Not a hard-stop.
  **Consequences:** group 2 is **NOT authorized**. Every task below 1.1 in `specs/010-local-exports/tasks.md`
  is **SUSPENDED** until a human-reviewed spec revisit — per the provisional condition's own text, a
  subset/lazy-split strategy (spec §3.10) or a scope reduction — reopens it. The install itself (docx +
  client-zip in `package.json`/`pnpm-lock.yaml`) stands as committed; nothing imports either library yet, so
  the shipped extension is byte-identical to pre-task HEAD in every dimension. **Revisit when:** the spec
  revisit lands and re-authorizes group 2, or scopes the export surface down enough to fit the remaining
  ~1,988 B `.output` headroom `docx` alone leaves (i.e., `docx`'s own weight is very likely the thing that
  must shrink or split — task 3.5's zip-writer choice above is not the lever this milestone's headroom needed).

- **2026-08-22 · M10 GATE 3 — tasks 010 (local exports: HTML/DOCX/PDF export, copy as rich-text/HTML/plain
  text, ZIP export, export shortcut, progress indicator, F5 print-optimized mode) APPROVED. Implementation
  may begin at task 1.1, in a fresh session.**
  `specs/010-local-exports/tasks.md`, drafted at `a551803` (**22 tasks across 11 groups**, following plan
  §6's group order — 1 the measurement (1) · 2 the shared serializer (2) · 3 HTML/copy-HTML/copy-plain-text/
  ZIP (5) · 4 copy-as-rich-text (1) · 5 DOCX export (1) · 6 print mode + `@page` probe (1) · 7 PDF export (1)
  · 8 shortcut/last-format/progress (3) · 9 systemic failure/degradation (2) · 10 measure (3) · 11
  human-close/retro/reconcile (3)), was reviewed against plan 010 and approved to begin implementation.
  **The tasks.md status line stays "DRAFT awaiting gate 3" and THIS ENTRY IS THE APPROVAL OF RECORD** — the
  standing precedent (spec 010 still reads "draft" post-gate-1 `1921f72`; plan 010 still reads "draft"
  post-gate-2 `a502ad8`; 009's tasks the same, approved post-gate-3 while reading "DRAFT awaiting gate 3"
  `c3582b1`; 008's likewise, `87532ad`). A context-loss session verifies M10's gate 3 **here**, not in the
  artifact header.
  **WHAT THIS APPROVES:** the tasks as drafted — the sealed plan (**D-1…D-10**) ordered into the 11 groups,
  each task naming the D-values it services and applying plan §0's already-written `decisions.md` entry text
  **verbatim** with the commit that implements it; the **four gate-2 rulings applied, never re-argued**
  (Ruling 1 the ZIP-writer package identity, confirmed as task 1's own call → task 1.1 · Ruling 2 the export
  panel's `aria-modal="true"` focus trap, `diagramLightbox`'s baseline reused → task 3.2 (panel) and group 8
  (the shortcut wiring into it) · Ruling 3 the `:host()` selector pre-scoping → task 2.1's first-move
  verification, ahead of the serializer proper · Ruling 4 the M9 9.1 toolbar-spacing carry non-reopen →
  task 6.1's explicit, checkable additive-only diff constraint) and the **D-3 interpretation note** (CSS
  inlined = a bundled stylesheet, not per-node inline styles) applied at task 2.2. Task 1.1 is **D-1's
  hard-sequenced measurement**, the fork stated as an explicit commit-message-level acceptance criterion per
  gate-1's provisional-approval condition, exactly as required. **Per-task D-value mapping is present in
  every task's trailing bracket** — the M9-9.3-named gap (none of M9's own D-1…D-13 pre-written entries ever
  landed with an implementing commit) is structurally addressed here, closure itself verified at task 11.3.
  Group 3 (the largest) is **pre-split into 5 tasks** (3.1 HTML file-download · 3.2 the panel · 3.3
  copy-as-HTML · 3.4 copy-as-plain-text · 3.5 ZIP export) — not drafted as one oversized task awaiting a
  gate-3 split instruction — justified by D-1's own thin headroom favoring small, revertible units this
  milestone over any prior one. Task 11.2 explicitly names `/retro`, the interview ritual per WORKFLOW.md
  §7.5 by command, not by description — the same failure shape M8's and M9's retros both caught once already.
  Gate 2 issued no scope instruction beyond the four rulings above — no analogous discharge to record here.
  **NO OPEN QUESTIONS SURFACED FROM REVIEW** — unlike gate 1 (three §9 rulings) and gate 2 (four §8 rulings
  plus the D-3 interpretation note), gate 3 has no equivalent open-question set: `tasks.md` is the
  operational layer downstream of spec and plan, where the design surface is already resolved.
  **TWO TASK-TIME REFINEMENTS WERE NOTED DURING REVIEW — NEITHER IS A `tasks.md` REDLINE; both are recorded
  here as task-kickoff guidance for the task's own future session, not applied to this file:**
  - **(i) Task 1.1's Verify could explicitly test for the `web_accessible_resources` hard-stop condition**
    (plan risk §4-5: either export library's bundler output forcing WAR to lazy-load into the content-script
    graph). Currently implicit-in-1.1 (the measurement itself would surface the condition). Task 1.1's own
    kickoff may choose to make this explicit or leave it implicit — a task-time call, not a redline against
    the drafted Verify contract.
  - **(ii) Task 3.1's HTML file-download exit correctly names "no sibling suite for a download-triggering
    control exists in this codebase," but the Verify contract does not specify HOW the download-triggering
    control itself is tested** — Playwright can drive `<a download>` clicks, but whether that actually saves
    a file versus triggers a download dialog varies by engine. Task 3.1's own kickoff resolves this at
    task time.
  **PRESERVED BY SILENCE:** all of gate 2's **D-1…D-10**, all three of gate-1's §9 rulings, all four of
  gate-2's §8 rulings, and the D-3 interpretation note are inherited-closed by `tasks.md` and preserved by
  silence in this entry — none is reopened, none re-argued.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not write `src/` code; it does not install `docx` or the
  chosen ZIP writer (deps stay **6** — that is task 1.1's own act, at implementation); it reopens **no** plan
  D-value and **no** spec §3.x decision; it edits **no** sealed artifact — `tasks.md`'s status line is
  **not** flipped. It writes no implementation code: task 1.1 begins in a **fresh session** (C14,
  WORKFLOW.md §5.3), the FIRST `src/` code of the milestone.
  **Doc-only: no `src/` change, no plan.md or spec.md edit** — this entry and `progress.md`'s § Now update
  are the whole diff. `docx`/the ZIP writer remain **uninstalled**, `dependencies` stays **6**.
  **Revisit-when:** (a) implementation surfaces a task whose Verify contract cannot be executed as
  written — banked at the point of discovery, never propagated forward (the M7/M8/M9 gate-3 precedent); (b)
  task 1.1's own kickoff decides whether to make the WAR hard-stop condition explicit — refinement note (i),
  a task-time call, not a reopen of this gate; (c) task 3.1's own kickoff resolves the download-triggering-
  control test mechanism — refinement note (ii), the same; (d) 11.3's D-value audit finds an entry that did
  NOT land with its own implementing commit — the gap named exactly as M9's own 9.3 named it, not smoothed
  over.

- **2026-08-22 · M10 GATE 2 — plan 010 (local exports: HTML/DOCX/PDF export, copy as rich-text/HTML/plain
  text, ZIP export, export shortcut, progress indicator, F5 print-optimized mode) APPROVED, WITH FOUR
  RULINGS AND ONE INTERPRETATION NOTE. `tasks.md` is the next artifact and the next gate.**
  `specs/010-local-exports/plan.md`, drafted at `a502ad8` against a codebase recon at `49feea6`, was
  reviewed and approved. It settles **D-1…D-10**, resolves the spec's seven §7 risks against the **actual
  code**, discharges the §7-6 sibling-checklist audit (D-9), proposes **no spec amendment** and adds **no
  dependency**. §7-5 and §7-7 are resolved **outright** rather than carried (D-8, D-10). **The plan file's
  status line stays "draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)" and THIS ENTRY IS
  THE APPROVAL OF RECORD** — the standing precedent (spec 007 still reads "draft" post-gate-1 `e09520f`;
  plan 008 still reads "draft" post-gate-2 `2c29821`; plan 009 still reads "draft" post-gate-2 `40b4ed1`;
  010's own spec still reads "draft" post-gate-1 `1921f72`). A context-loss session verifies M10's gate 2
  **here**, not in the artifact header. **No plan or spec section is edited by this entry; no D-value
  moves — D-1 through D-10 are APPROVED AS DRAFTED and `tasks.md` cites them as-is.**
  **THE FOUR RULINGS — plan §8's Q1–Q4, RULED HERE so `tasks.md` inherits them settled:**
  - **RULING 1 · Q1, THE ZIP-WRITER PACKAGE CHOICE — CONFIRMED.** Task 1 is the right place for the package
    identity decision, per standard dependency-verification discipline — spec §3.10 explicitly declined to
    lock it, so no re-litigation at plan level. No package name is chosen here.
  - **RULING 2 · Q2, THE EXPORT PANEL FOCUS TRAP (§3.11 row 11) — MATCH THE MOCKUP'S `aria-modal="true"`
    CONTRACT, REUSE `diagramLightbox`'S TRAP/RESTORE BASELINE.** The WCAG 2.1 modal-dialog contract applies,
    007 already built the reusable baseline exactly for cases like this, and deciding case-by-case which
    modals get one is where drift starts. The lighter dismiss-on-outside-click contract the plan floated is
    declined.
  - **RULING 3 · Q3, THE `:host()` SELECTOR TRANSLATION FOR STANDALONE HTML EXPORT (risk §4-1) —
    PRE-SCOPE NOW, do not wait for group 2 to discover.** `readerCss.ts` uses `:host` selectors extensively
    (the reader mounts in a shadow root by design since M1), so §4-1's risk is very likely to materialize.
    **Instruction to `tasks.md`:** group 2's acceptance criteria must explicitly include the
    translated-stylesheet derivation, or a first-move task within group 2 must verify `readerCss.ts`'s
    actual selector shape before the exporter proper is built. This is a **plan-level scope adjustment, not
    a re-open** — §4-1 already flagged the risk; this ruling elevates it from "carried risk" to "scoped
    work."
  - **RULING 4 · Q4, THE M9 9.1 TOOLBAR-SPACING CARRY NON-REOPEN (risk 6, §4) — CONFIRMED, SPACING NOT
    FIXED OPPORTUNISTICALLY.** The plan's mechanistic reading — a `display:none` under `@media print`
    touches the toolbar selector's **name**, not its shipped spacing rule **body** — is correct. The
    carry's revisit-when ("whenever `readerCss.ts`'s `.peekover-code-toolbar` rule is next touched") is
    best interpreted as "when the rule's body is next edited," not "when any selector referencing the same
    class is added elsewhere." The opportunistic fix is declined; the carry ships as-is. A future milestone
    whose scope touches the spacing rule body directly is the natural revisit moment.
  **ONE INTERPRETATION NOTE — D-3, "CSS INLINED" — APPROVED AS REASONED.** The plan reads spec §1's "CSS
  inlined" as "the stylesheet is embedded in the export" (a bundled `<style>` block), not "every element
  carries an inline `style` attribute" (a per-node `getComputedStyle` walk). Per-node inlining is fragile —
  it misses pseudo-elements and media-query-gated rules — and is real, reviewable work with its own failure
  modes (007 D-1's SVG `<style>`-cleaning pass is the standing example of how much work that class of
  problem actually costs). **Recorded here so the interpretation is documented and can be revisited if a
  future export-audit reads "CSS inlined" the other way.**
  **THE OTHER D-VALUES — APPROVED AS DRAFTED.** D-1 (the `docx` + zip-writer ablated-cost measurement is
  the hard-sequenced first task, per gate-1's provisional condition) · D-2 (export chrome lives in a new
  app-page-only `exportControls.ts`, `storageControls.ts`'s precedent, `mount.ts` touched at zero sites) ·
  D-4 (§7-2: `ClipboardItem` with `text/html` + `text/plain`, reusing 007/008's already-verified
  permission-free clipboard finding) · D-5 (§7-3: the Ctrl+S listener lives in `entrypoints/app/main.ts`,
  app-page-only, not `readerMode.ts`'s app-page-blind pattern) · D-6 (`lastExportFormat` is a fifth field
  on the one global `Settings` row) · D-7 (§7-4: print CSS lives in `readerCss.ts`, PDF export rides
  `window.print()`, `@page` margin-box fidelity probed before PDF's own task) · D-8 (§7-5 resolved
  outright: `mediaPolicy.ts`'s remote-image restore mechanism is real and already wired to shipped UI on
  both surfaces; M10 declines to reuse it per gate-1 Ruling 3, not because it doesn't exist) · D-9 (§7-6's
  sibling-checklist audit discharged) · D-10 (§7-7's premise corrected: a mockup for export chrome does
  exist, `design/mockup.html`, the same class of correction 009 made for code blocks). None is reopened by
  this gate and `tasks.md` cites them as-is.
  **WHAT THIS APPROVAL DOES NOT DO:** it reopens no spec §3.x decision, alters no plan D-value, changes no
  plan section (the plan is approved as it stands at `a502ad8`), chooses **no** ZIP-writer package name and
  **no** §8 gate-3 measurement value (default export format, heavy-document threshold, print CSS
  header/footer content all stay measure-then-choose at gate 3) — and it **writes no `tasks.md`**. The
  gate-1 dispositions (Ruling 1 · §9-1 DOCX math as plain source text · Ruling 2 · §9-2 Ctrl/Cmd+S
  app-page-only · Ruling 3 · §9-3 ZIP/HTML export embeds only locally-resolvable images · the
  provisional-approval condition on `.output` headroom) are **preserved by silence**, per the plan's own
  rule that re-deciding a settled answer is a scope-reopen even when it agrees.
  **Doc-only: no `src/` change, no plan.md or spec.md edit** — this entry and `progress.md`'s § Now update
  are the whole diff. `docx`/the ZIP writer remain **uninstalled**, `dependencies` stays **6**.
  **Revisit-when:** (a) `tasks.md` cannot decompose D-1's measurement task or ruling 3's group-2 scoping
  without reopening a D-value — that is a gate-2 event and returns here, never a quiet amendment; (b) the
  ablated-cost measurement (D-1) finds either dependency blows the `.output` headroom — the provisional
  condition's own named fallback (subset/lazy-split per spec §3.10, or scope reduction) fires, routed to a
  human, not decided now; (c) a future export-audit reads spec §1's "CSS inlined" as per-node inline styles
  rather than a bundled stylesheet — the D-3 interpretation note is re-argued, not silently overridden; (d)
  ruling 3's `:host()` translation is found unnecessary once group 2 verifies `readerCss.ts`'s actual
  selector shape — the scoped work is then a smaller confirmation task, not a redesign.

- **2026-08-22 · M10 GATE 1 — spec 010 (local exports: HTML/DOCX/PDF export, copy as rich-text/HTML/plain
  text, ZIP export, export shortcut, progress indicator + F5 print-optimized mode) APPROVED, WITH THREE
  RULINGS AND A PROVISIONAL CONDITION. `plan.md` is the next artifact and the next gate.**
  `specs/010-local-exports/spec.md`, drafted at `1921f72`, was reviewed and approved. **The spec's status
  line stays "draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)" and THIS ENTRY IS THE
  APPROVAL OF RECORD** — the standing precedent from M7/M8/M9: 007 still reads "draft" post-gate-1
  (`e09520f`); 008 still reads "draft" post-gate-1 (`aaf990e`, 2026-08-03 M8 GATE 1); 009 still reads
  "draft" post-gate-1 (2026-08-14 M9 GATE 1) — gate approvals live in the bank, not in the artifact's
  status line.
  **THE APPROVAL:** ten items are in scope — nine F9 items (HTML export, DOCX export, PDF export, copy as
  rich text/HTML/plain text, ZIP export, the export shortcut, a progress indicator for heavy documents) plus
  F5's print-optimized mode, the one item PDF export's own §3.6 names as its prerequisite. F9's four publish
  paths (GitHub Gist, GitHub repo, Medium, Dev.to) are **deferred to M11 on the routing decision spec §3.1
  and §3.2 state** — the product's first deliberate, user-token-bearing outbound network path, per
  `docs/product/spec.md` §6 principle 2 — inherited from this session's pre-drafting scoping, not
  re-argued at this gate.
  **THE THREE RULINGS, spec §9 (verbatim from the human's review):**
  - **RULING 1 · §9-1, DOCX export's math and diagram scope: OPTION (a), sub-choice "rendered as plain
    source text."** The current reader does not render math (F2 is ✗), so math displays as raw source;
    DOCX preserving raw source text is consistent with reader behavior. No special math-handling code in
    M10. **Revisit-when:** F2 math ships in a future milestone, at which point DOCX math handling becomes a
    natural extension task in that milestone, not an M10 retrofit.
  - **RULING 2 · §9-2, the Ctrl/Cmd+S shortcut's scope: APP-PAGE ONLY.** Global binding would suppress the
    browser's native "Save Page As" dialog on `file://` and raw-host content-script surfaces where Peekover
    offers no export in its place; app-page-only is consistent with §3.2's own decision to confine exports
    to that surface. No revisit-when — this is a permanent scope decision.
  - **RULING 3 · §9-3, ZIP/HTML export's remote-image handling: OPTION (a), locally-resolvable images
    only.** Preserves the M10/M11 architectural boundary; concentrates security-review weight on M11 where
    the first deliberate outbound network path belongs; the accepted limitation (a remote image stays a
    remote reference in ZIP/HTML output rather than a local copy) is a narrower, more honest promise than a
    half-built fetch. **Revisit-when:** M11 spec-writing time — the F9 product-spec wording ("local copies
    of remote images") should be revisited then, since it invites this exact confusion again if read later
    without M10 context.
  **THE PROVISIONAL-APPROVAL CONDITION:** gate-1 approval is provisional on `plan.md`'s first task — the
  `docx` + zip-writer ablated-cost measurement, per §3.4 — clearing the current ~367 KiB `.output` headroom
  against the 5 MiB bound. If either library's ablated cost blows the headroom, the spec revisits (a
  subset/lazy-split strategy per §3.10, or scope reduction) before `plan.md`'s remaining tasks. This is not
  a new decision — it extends §3.4's own measurement discipline (`plan.md`'s first measurement, before
  either dependency is installed for real, 009's own naive-import-then-revert-if-needed precedent) into
  gate-2 sequencing.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not install `docx` or a ZIP writer, or move dependencies off
  the current 6; it does not resolve §3.6's print-CSS fidelity question (§7-4, routed to `plan.md`); it
  reopens no other §3.x decision and routes nothing new to §8's gate-3 measure-then-choose list; it writes
  no `plan.md` or `tasks.md`.
  **Not a blocker for:** gate 2 (`plan.md`) or any subsequent gate — nothing above is unresolved, each
  ruling and the provisional condition are stated so `plan.md` inherits them closed (or, for the provisional
  condition, closed pending its own first task).

- **2026-08-22 · M9 9.1 — Code-block toolbar/block vertical spacing carried, ships as-is (9.1 gate
  observation).** During the 9.1 walk (HEAD `9386568`, real Chromium + real Firefox, extension loaded),
  Item 1 (toolbar-reads-as-part-of-block-or-clutter, 008's identical question transplanted) came back
  PASS+FINDING. Walker's verdict, verbatim: *"The toolbar looks good, styled. Only thing is the space
  between the code box and the toolbar is a bit too much."* The toolbar chrome itself reads as
  intentionally integrated with the block — not 008's table-toolbar defect class (ships unstyled, never
  integrated with the reader's design language) — the finding is narrower: the vertical gap between the
  toolbar and the code box below it. **Why ship-as-is:** a subjective spacing preference on an
  otherwise-integrated, shipped feature; it does not block M9 close, affects no Verify contract, and
  surfaces no correctness or a11y regression. Carried rather than fixed at 9.1 to keep the milestone-close
  commit doc-only and let a second pass weigh in before a spacing tweak lands — matches M6's watch-pill and
  15-row-picker precedent (`decisions.md` 2026-07-26): ship, record, revisit when the surface is next
  touched. The fix, when it comes, is CSS-only — a 4-8px reduction on `.peekover-code-toolbar`'s
  (`readerCss.ts:651`) `margin-bottom` or the wrapper's `padding-top` — cheap to prototype and A/B against
  the current spacing. **Revisit-when:** (a) a future milestone next touches `readerCss.ts`'s
  `.peekover-code-toolbar` rule or the wrapper's margin/padding — the natural moment to eyeball spacing
  alongside whatever else is landing; (b) if no such milestone lands by M11 close, revisit standalone as a
  small M11-closeout task. Not a blocker for 9.2 (retro), 9.3 (records reconcile), M9 close, or M10
  kickoff.

- **2026-08-19 · M9 8.5 — DECISION GATE (human): M-1…M-4's values, all seven items ruled, recorded here
  BEFORE any code lands (8.6).** Each choice below is recorded with the measurement that justifies it, per
  tasks.md 8.5's own Verify line. No code lands on an assumed number — `settings.ts`/`codeView.ts` stay
  untouched by this entry; 8.6 executes these values.
  - **M-1 — full set ships (no subset build).** Evidence (8.1, HEAD `e785fb1`, cross-checked to zero
    residual): `.output` 4,866,741 B (Cr) / 4,866,857 B (Fx) vs. the 5 MiB (5,242,880 B) bound — headroom
    ~367 KiB. Zip 1,470,730 / 1,470,788 B vs. the 2 MB (2,097,152 B) bound — headroom ~612 KiB. Neither
    bound binds. §7-7's carried subset-build question does not fire. Human confirmed: full set (6
    languages, 20 themes) fits, ship as-is.
  - **M-2 — the <165ms gate holds under Shiki, nothing gives way.** Evidence (8.2, HEAD `a44e17f`):
    post-Shiki app-page first paint median 90.8-96.3ms, floor 86.2-88.1ms, against `GATE_MS = 165`
    (headroom ~69-79ms median, ~77-79ms floor). Pre-Shiki floor (2.2): median 89.2/89.3ms, floor
    84.8/86.8ms — delta reads flat, within the same 2-5.5ms same-session noise band the pre-Shiki A-vs-A
    itself carried. Human confirmed: gate holds as measured, nothing gives way.
  - **M-3 — auto-detection mechanism: HEURISTIC.** Evidence (8.3, HEAD `8b62a2c`, corpus n=23 unlabeled
    fences, bias sentence: this repo's docs are biased toward directory trees, shell/JS snippets, and a
    house pseudocode convention, not representative of arbitrary agent-authored markdown): heuristic —
    1,856 B / 95.7% accuracy (22/23, one honest false positive on `008/plan.md:220`'s placeholder angle
    brackets) / 3.149µs per fence, fits inside 8.1's headroom. Local model
    (`@vscode/vscode-languagedetection`) — 1,811,325 B / 47.8% accuracy (11/23, 0/7 language items
    correctly identified) / 62.09ms load + 8.65ms median warm per-fence, exceeds 8.1's headroom ~4.8× and
    would breach the 5 MiB package-base bound outright — not shippable regardless of preference, per §8's
    own rule (*"if none of the paid options fits inside 8.1's headroom, defer is the floor"*) plus the hard
    bound. Defer — 0 B / n/a / 0ms. Human chose heuristic (the one paid option that fits); defer was not
    forced since heuristic fits.
  - **M-4a — default code theme: `github-dark` (kept).** Evidence (8.4, HEAD `b102f85`, full 20-theme WCAG
    contrast table against `readerCss.ts`'s three `--code-bg` values; sepia inherits light's `#F1F1EB`
    verbatim, only `--paper`/`--ink`/`--accent`/`--accent-soft` overridden in the sepia block; the
    highlighted `<pre>`'s own background is entirely theme-owned per `codeEnhancer.ts:213`, `--code-bg`
    governs only the inline-code span and toolbar chrome): `github-dark` (`#24292e`, dark-typed) — 12.94
    vs. light `--code-bg`, 1.10 vs. dark, 12.94 vs. sepia — sits mid-table on every axis among the 20
    candidates. Since `codeTheme` is one global default across all three page modes (D-9), no single theme
    reads as blended in all three simultaneously; every dark-typed theme reads as a framed box on
    light/sepia and near-blends on dark, every light-typed theme the inverse. Human confirmed: keep
    `github-dark` as shipped.
  - **M-4b — collapse line threshold: `40` (kept).** Evidence (8.4, 103-fence corpus, 64 files, zero drift
    from 8.3's banked unlabeled count): line count min 1 / median 6 / p75 8 / p90 10 / max 34. Byte size
    min 69 B / median 156 B / p75 180 B / p90 560 B / max 1,311 B. Line-highlight meta present: 0/103 (this
    corpus cannot inform threshold-vs-meta correlation — it never occurs in it). Against `40`: 0/103 corpus
    fences exceed it (max observed 34) — confirms 40 clips nothing in this corpus, says nothing about
    longer real-world code (bias-sentence caveat). Human confirmed: keep `40`.
  - **M-4c — line-numbers default: OFF (kept, current toolbar state).** Evidence (8.4, same 103-fence
    corpus): line-count median 6 — numbering's payoff on a typical block in this corpus is limited (bias
    caveat applies against real-world usage). Existing infra already built and gated behind
    `data-line-numbers` (`readerCss.ts:673-685`) — reader opts in per-block via the toolbar regardless of
    default. Human confirmed: OFF by default.
  - **M-4d — word-wrap default: OFF (kept, current toolbar state, horizontal scroll).** Evidence (8.4, same
    corpus): max single-line length min 25 / median 40 / p75 83 / p90 102 / max 175 chars, against the
    reader's own ~76ch column (`readerCss.ts:13`) — roughly the top 10% of fences carry a line wider than
    the column. Existing infra already built and gated behind `data-wrap` (`readerCss.ts:673-685`) — reader
    opts in per-block regardless of default. Human confirmed: OFF by default.
  **All seven values now settled; none reopens a sealed D-value or spec §3.x decision** — D-9/D-10/D-12's
  own text named these as measure-then-choose, produced at 8.1-8.4, chosen here. **Doc-only: no `src/`
  change** — `settings.ts:49`'s `codeTheme: 'github-dark'` and `codeView.ts:357`'s
  `CODE_COLLAPSE_LINE_THRESHOLD = 40` both already match the chosen values (a no-op edit at 8.6, recorded
  as chosen not left as a stale "PROVISIONAL" doc-comment lie about decision state per 008's own rule); the
  two boolean defaults (line-numbers, word-wrap) also already match the CHOSEN values in the current
  toolbar code (`codeView.ts:264,281`, both `aria-pressed="false"`), pending 8.6's PROVISIONAL-comment
  cleanup and (if needed) an explicit named default constant.
  **Revisit-when:** (a) a subset-build pressure re-opens M-1 (a future language/theme addition that pushes
  `.output` or zip near the bound again — headroom is ~367 KiB / ~612 KiB today, not infinite); (b) a
  future first-paint regression re-opens M-2 (this milestone's own harness, per Ruling 4, is now the
  standing baseline future work prices against); (c) accuracy complaints or a smaller/cheaper local-model
  package re-opens M-3 (heuristic's one honest false positive — HTML-signature confusion on placeholder
  angle brackets — is a known, accepted limitation, not a bug to chase); (d) the walk at 9.1 (real
  Chromium/Firefox, both wide viewports) surfaces a "reads as clutter/illegible" verdict on any of the four
  M-4 values — that is a real finding routed to a new task, not a silent re-open of this entry.

- **2026-08-15 · M9 GATE 3 — tasks 009 (code blocks: Shiki syntax highlighting, code themes, per-block
  toolbar) APPROVED, WITH TWO RULINGS. Implementation may begin at task 1.1, in a fresh session.**
  `specs/009-code-blocks/tasks.md`, drafted at `c3582b1` (**24 tasks across nine groups**, following plan
  §6's group order — 1 Foundation (2) · 2 the harness (2) · 3 fence-meta plumbing (1) · 4 the enhancer (5) ·
  5 code themes (2) · 6 collapsible blocks (1) · 7 systemic degradation (2) · 8 measure→decide→implement (6)
  · 9 the close gate (3)), was reviewed against plan 009 and approved to begin implementation. **The
  tasks.md status line stays "DRAFT awaiting gate 3" and THIS ENTRY IS THE APPROVAL OF RECORD** — the
  standing precedent (spec 009 still reads "draft" post-gate-1 `1ab8db5`; plan 009 still reads "draft"
  post-gate-2 `beeb224`; 008's tasks the same, approved post-gate-3 while reading "DRAFT awaiting gate 3"
  `7e9788b`; 007's tasks likewise, `66634fa`). A context-loss session verifies M9's gate 3 **here**, not in
  the artifact header.
  **WHAT THIS APPROVES:** the tasks as drafted — the sealed plan (**D-1…D-13**) ordered into the nine
  groups, each task naming the D-values it services and applying plan §0's already-written `decisions.md`
  entry text **verbatim** with the commit that implements it; the **four gate-2 rulings applied, never
  re-argued** (Ruling 1 the app-page harness (D-1) → group 2 · Ruling 2 the `parse.ts` fence-meta change
  (D-8) → group 3 · Ruling 3 the D-3 engine revisit-when → carried as a standing condition, re-stated at 9.3
  · Ruling 4 the harness output as a standing baseline → produced at 2.2, sanity-read at 9.1, banked at
  9.3). Gate 2 issued **no** scope instruction to the tasks stage (unlike M8's gate 2, which split one task
  and re-scoped another) — so there is no analogous discharge to record here.
  **TWO DIVERGENCES WERE FLAGGED AT THE GATE AND BOTH ARE RULED — the tasks stage's own tree-vs-plan
  decomposition seams, re-derived against the actual tree, FLAGGED rather than silently patched:**
  - **RULING 1 · THE IMPORT FENCE MOVES FROM GROUP 1 TO TASK 4.5 — APPROVED.** Plan §6 named
    `codeImportFence.test.ts` in group 1; the draft moves it to task 4.5. **Rationale:** clause B requires
    the app-page graph to actually REACH the enhancer — an import edge that does not exist until a call
    site is wired (task 4.1) — verified against 007's own precedent exactly: `diagramEngine.ts` was built
    unreachable at 007 task 1.2, and `diagramImportFence.test.ts` landed at 007 task 3.4 (commit `522a3fe`),
    AFTER both call sites existed. 009 follows the same mechanical shape — group 1 builds `codeEngine.ts`
    unreachable, the fence lands once 4.1 wires a real call site. This ruling also captures the clause-C
    adjustment plan §0.2 already named (finding (a)): the fence expects **TWO** permitted static specifiers
    (`shiki/package.json`, `shiki/engine/javascript`), not 007's one — a naive `toHaveLength(1)` copy would
    fail the fence on CORRECT code. **Noted in the ruling: this does NOT reopen D-2** — the same four-clause
    fence, the same substance; only WHERE it lands changed, forced by clause B's own logic.
  - **RULING 2 · A NEW MODULE, `codeThemeControl.ts`, AT TASK 5.2 — APPROVED.** Not named in plan §2's
    Create list. **Rationale:** `themeControl.ts`'s existing shape is a 3-way cycle button (auto → light →
    dark), structurally unable to represent ≥14 code-theme choices; the ≥14-option selector needs a
    listbox-shaped module, mirroring 008's `diffChrome.ts` `role="listbox"` pattern. **Noted in the ruling:
    this does NOT reopen D-9** — `codeTheme` is still a fourth field on the one global settings row; this is
    the UI module plan §2's Create list missed, not an architecture change.
  Both divergences are plan-§6/§2-vs-tree decomposition seams the plan's prose did not foresee, re-derived
  against the actual tree and 007's own precedent — the tasks stage doing its job, per AGENTS.md's standing
  rule that a mismatch between a kickoff/plan's assumption and the artifact's actual body is flagged, never
  silently resolved either way. **Neither reopens a sealed D-value or a spec §3.x call.**
  **WHAT THIS APPROVAL DOES NOT DO:** it does not write `src/` code; it does not install `shiki` (deps stay
  **5** — that is task 1.1, at implementation); it reopens **no** plan D-value and **no** spec §3.x decision;
  it does not resolve **M-1…M-4's VALUES** (those stay §8 measure-then-choose at implementation, PRODUCED at
  8.1–8.4, CHOSEN by the human at 8.5, EXECUTED at 8.6); it edits **no** sealed artifact — `tasks.md`'s
  status line is **not** flipped, and **no box is ticked** (per-task ticking is the standing convention
  since 008's gate-3, `7e9788b`; forward-ticking begins with task 1.1's own commit). It writes no
  implementation code: task 1.1 begins in a **fresh session** (C14, WORKFLOW.md §5.3) — the FIRST `src/`
  code of the milestone.
  **Doc-only: no `src/` change, bundle byte- and md5-IDENTICAL to gate 2's close** (CS **329,233 B**, md5 Cr
  `b115c9ae81acf3a834b2834354b4c23a` / Fx `237831d2332acc1efb2305a238c4264b`; app **399,646 B**), **golden
  EMPTY** (`git diff tests/golden/output/` empty), **007's import fence 8/8** with clause B firing as the
  control, manifest `permissions: []` on **both** built manifests (Cr 654 B / Fx 770 B),
  `web_accessible_resources` absent, **deps STILL 5** (`shiki` scoped, not installed), `pnpm test` 944/944,
  `pnpm lint` EXIT=0. NUL check on `tasks.md`: 0 by both the `python3` and `tr` forms; a control file with
  one literal NUL byte reads 1 (python) / strips to 6 of 7 bytes (tr), proving both forms actually fire.
  **Revisit-when:** (a) implementation surfaces a task whose Verify contract cannot be executed as
  written — banked at the point of discovery, never propagated forward (the M7/M8 gate-3 precedent); (b)
  8.5's human decision gate rules an M-1…M-4 value in a way that reopens a task's shape — a finding
  reported with its number, not a quiet re-scope; (c) a future milestone's tasks stage hits the same
  plan-§6/§2-vs-tree seam and wants a standing rule instead of a per-milestone ruling — that is a new human
  call, not inferred from these two.

- **2026-08-15 · M9 GATE 2 — plan 009 (code blocks: Shiki syntax highlighting, code themes, per-block
  toolbar) APPROVED, WITH FOUR RULINGS. `tasks.md` is the next artifact and the next gate.**
  `specs/009-code-blocks/plan.md`, drafted at `40b4ed1` against a codebase recon at `1ab8db5`, was reviewed
  and approved. It settles **D-1…D-13**, resolves the spec's nine §7 risks against the **actual code**,
  discharges the §3.11 sibling-checklist audit as a 24-row table, proposes no spec amendment and adds no
  dependency. **The plan file's status line stays "draft (Gear-3 gate 2 — awaiting human approval before
  `tasks.md`)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the standing precedent (spec 007 still reads
  "draft" post-gate-1 `e09520f`; plan 007 still reads "draft — awaiting gate 2" post-gate-2 `cab93c7`; M8's
  plan still reads "draft" post-gate-2 `2c29821`; 009's own spec still reads "draft" post-gate-1 `1ab8db5`).
  A context-loss session verifies M9's gate 2 **here**, not in the artifact header. **No plan or spec
  section is edited by this entry; no D-value moves — D-1 through D-13 are APPROVED AS DRAFTED and
  `tasks.md` cites them as-is.**
  **THE FOUR RULINGS — plan §8's Q1–Q4, RULED HERE so `tasks.md` inherits them settled:**
  - **RULING 1 · Q1, THE HARNESS (D-1) — APPROVED.** The capability-free, query-gated production seam
    (`entrypoints/app/main.ts`'s `__peekoverHarness` search-param check + `window.__peekoverHarness
    .openFromHandle` reusing the production `folderSourceFromHandle`) plus the Playwright driver mirroring
    `perf-first-paint.ts`, EXPLICITLY BLESSED as new production code for an automation need — permitted
    BECAUSE it is capability-free by construction: it accepts only a `FileSystemDirectoryHandle` the caller
    already constructed (OPFS, in-origin); it ships no manifest key, no permission, no
    `web_accessible_resources`; it is query-param-inert on every real user visit (the real launch path never
    adds the param); and it is reachable only by a script already running in the extension's own origin (a
    Playwright driver that loaded the extension). **Rationale:** it is the only way to honestly PRICE the
    sealed app-page-only decision — §8's M-2 is a quantitative <165 ms gate, a human eyeball cannot produce
    that number, and D-11 (iii)'s carried trigger exists precisely to stop unmeasured app-page engine work
    from shipping. **Noted in the ruling: permitted as capability-free; this does NOT set a precedent for
    other automation seams** — each such seam is its own decision, scrutinised the same way.
  - **RULING 2 · Q2, THE `parse.ts` CHANGE (D-8) — APPROVED.** The additive, conditional fence-renderer
    override — appends `data-fence-meta` to the emitted `<code>` ONLY when the info string carries meta
    beyond the language word; byte-identical output for every existing fence; proven a no-op against all
    four golden fence fixtures; stays one-parser-one-instance; the same category of change GFM tables and
    task-lists already are in `parse.ts`. **Rationale:** markdown-it's default fence renderer discards
    everything past the language word (verified empirically against markdown-it 14.3.0) — so the spec's
    §3.6/§7-3 "not a parser change" premise does NOT hold; this is the MINIMUM VIABLE fix, preserving the
    spec's INTENT (highlighting behavior stays a post-mount read) while correcting the framing, not the
    goal. **Noted in the ruling:** it touches `parse.ts` (a file 007/008 left untouched) but honors WHY they
    did — it is a serialization tweak on an already-parsed token, not a parse-complexity addition; it
    widens no rule set.
  - **RULING 3 · Q3, THE D-3 ENGINE REVISIT-WHEN — CONFIRMED.** "Grammar/perf inadequacy discovered at
    measurement or walk" is the right revisit-condition for the `shiki/engine/javascript` choice — a
    condition that fires on a real finding (M-1 / M-2 / the walk), not on vague memory. The same
    condition-not-memory discipline M8's gate 2 confirmed for its own D-11 (iii) trigger. If a grammar
    isn't covered or perf fails at measurement or walk, THAT is the trigger to reconsider the WASM/Oniguruma
    path — not before, not never.
  - **RULING 4 · Q4, THE HARNESS OUTPUT AS A STANDING BASELINE — CONFIRMED YES.** D-1's harness first-paint
    number becomes a STANDING BASELINE that future app-page work prices against — the way the
    content-script harness's 26.9/29.9 ms headroom became 008's own input. **Rationale:** naming it
    explicitly means the next planner who touches the app-page render path inherits a NUMBER, not a
    rediscovery — the D-11 (iii) lesson applied forward (leave a measurement, not a condition).
  **THE OTHER D-VALUES — APPROVED AS DRAFTED.** D-2 (the lazy-chunk fence, `codeEngine.ts`/
  `codeImportFence.test.ts`, mirroring `diagramImportFence.test.ts`'s four clauses, expecting TWO permitted
  static specifiers not one) · D-4 (Shiki's structured token API, never an HTML string; `sanitize.ts`
  untouched) · D-5 (the enhancer runs from the same two app-page call sites 007 D-12 established, `mount()`
  touched at zero sites) · D-6 (the retained `<pre>` is the copy source of truth, zero duplication) · D-7
  (tokenization and the toolbar are one enhancer, `codeEnhancer.ts`, structurally forced by 009 having no
  cross-surface asymmetry to protect) · D-9 (`codeTheme` is a fourth field on the one global settings row) ·
  D-10 (collapsible blocks reuse `readerMode.ts`'s flip-an-attribute pattern) · D-11 (the byte budget
  decomposes to four ablation-proven components) · D-12 (auto-detection priced on three axes, three
  mechanisms, forbidden from choosing) · D-13 (the sixth dependency governed exactly as §3.10 specifies).
  None is reopened by this gate.
  **THREE SCOPE-READ FINDINGS ACKNOWLEDGED — the spec's own honest "didn't verify" spots, verified by the
  plan (§0.2):**
  - **(a) TWO `shiki` strings exist in `src/`, not one.** The spec's §1 claim of exactly one is corrected —
    `parse.test.ts:91`'s test comment AND `diagramEngine.ts:12`'s own doc comment (quoting
    `check-dynamic-imports.ts`'s fixture label, *"Shiki pattern"*) both match. Neither is Shiki code, so the
    spec's underlying F3-at-0% point holds, but the count is corrected — and it is D-11's own live
    demonstration that a `grep shiki` proves nothing about whether Shiki shipped, not a hypothetical.
    D-2's fence now expects TWO permitted static specifiers (`shiki/package.json`, `shiki/engine/javascript`),
    not 007's one, named explicitly so `tasks.md` does not copy `diagramImportFence.test.ts`'s
    `toHaveLength(1)` shape unadjusted.
  - **(b) `design/mockup.html` HAS a `.codeblock` section**, contra the spec's §7-9 claim that no mockup
    exists. Copy button, language label and three token-colour classes carry a real design precedent to
    honor (`--code-bg`, already a real token); line numbers, word-wrap, line-highlighting and collapse have
    **no** mockup baseline — the 008 D-12 finding-4 "no sibling suite = the signal" shape, applied to a
    mockup instead of a test suite, and carried into plan §3.11 row 24.
  - **(c) The parser-assumption correction** — D-8/Ruling 2 above: §3.6/§7-3's "reading it is not a parser
    change" claim does not hold empirically; the underlying intent is preserved, the framing is corrected.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not write `tasks.md`; it does not install `shiki` (deps stay
  **5**); it does not build the harness or any `src/` change; it reopens no sealed §3.x spec call; it does
  not resolve M-3/M-4's VALUES (those stay §8 measure-then-choose at implementation, produced then chosen
  by a human, never by the measuring task itself); it changes no plan section — the plan is approved as it
  stands at `40b4ed1`. The gate-1 dispositions (app-page-only surface, sealed · the `D-A`…`D-D` labels
  stripped · Shiki's dependency-governance treatment confirmed in) are **preserved by silence**, per the
  standing rule that re-deciding a settled answer is a scope-reopen even when it agrees.
  **Doc-only: no `src/` change, bundle byte- and md5-IDENTICAL to gate 1's close (CS 329,233 B / app
  399,646 B), golden EMPTY, deps STILL 5** (`Object.keys(pkg.dependencies).length === 5`, re-confirmed this
  session) — `shiki` is scoped, not installed; that lands with implementation, not this gate.
  **Revisit-when:** (a) `tasks.md` cannot decompose D-1's harness or D-8's `parse.ts` change without
  reopening a D-value — that is a gate-2 event and returns here, never a quiet amendment; (b) implementation
  measurement (M-1/M-2) or a later walk finds the `shiki/engine/javascript` engine's performance or a
  specific grammar's fidelity inadequate — ruling 3's trigger firing, routed to a human then, not decided
  now, and not a reason to pre-emptively default to the heavier Oniguruma/WASM path; (c) a future milestone
  needs D-1's harness for a different measurement than M-2 and finds its capability-free design too narrow —
  a re-argument of ruling 1's construction, not an extension assumed here.

- **2026-08-14 · M9 GATE 1 — spec 009 (code blocks: Shiki syntax highlighting, code themes, per-block
  toolbar) APPROVED, WITH THREE RULINGS. `plan.md` is the next artifact and the next gate.**
  `specs/009-code-blocks/spec.md`, drafted at `4d640b3` from a reviewer-and-human pass over the kickoff's
  own substance (**not** a fresh scope-read of the tree, disclosed in the spec's own header), was reviewed
  and approved. **The spec's status line stays "draft (Gear-3 gate 1 — awaiting human approval before
  `plan.md`)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the standing precedent from M7/M8: 007 still
  reads "draft" post-gate-1 (`e09520f`); 008 still reads "draft" post-gate-1 (`aaf990e`, 2026-08-03 M8
  GATE 1) — gate approvals live in the bank, not in the artifact's status line.
  **THE THREE RULINGS:**
  - **RULING 1 · The surface question (draft §3.8) is DECIDED NOW, not routed to `plan.md`:
    APP-PAGE-ONLY.** The draft seeded this open, explicit that resolving it was `plan.md`'s job (§9-1 as
    drafted); gate 1 closes it here instead, mirroring 007 §3.2's and 008 §3.3/§3.7's own precedent of
    deciding the analogous surface question at spec stage — the draft's own seam-1 named leaving it open
    as 009's real departure from that precedent, and the departure is declined. The content-script
    `file://` reader shows plain, unhighlighted code fences, exactly as it does today, no affordance, no
    explanatory note — 007's shipped Mermaid decision, applied to the same surface for the same reason.
    The app-page reader gets Shiki, themes, the toolbar, and collapsible blocks in full. **Consequence,
    named so it lands as a decided cost and not a surprise: this puts a heavy Shiki highlight pass on the
    app-page render path, for the first time since M8 confirmed that path has never had a first-paint
    instrument** (`decisions.md` 2026-08-03 M8 GATE 2, Q4; `progress.md` D-11 (iii)'s carried hole). D-11
    (iii)'s trigger — *"the next milestone that puts work on the app-page render path whose cheapness
    cannot be argued mechanically — anything that parses, sanitizes, reads layout or runs an engine
    there — funds the first-paint harness before it ships that work"* — reads unambiguously against
    Shiki: it is an engine, running on the app-page path. **009 INHERITS the obligation.** It is **not
    discharged by this gate** — no harness is built here, this is a doc-only approval — it is **named in
    the spec** (§3.8, §5, §7-1, §9-1) as an early milestone cost, funded before or as §8's M-2 measures
    first paint under Shiki, mirroring how 008 task 5.1 built its own perf harness before measuring.
    Applied at spec §3.1, §3.2, §3.4, §3.8, §5 (two bullets), §6, §7-1, §9-1.
  - **RULING 2 · The informal `D-A`…`D-D` labels are STRIPPED from the spec.** The draft's own seam-2
    flagged that this numbering is `plan.md`'s convention, not spec-stage vocabulary — neither 007's nor
    008's `spec.md` assigns its own `D-N` numbers. **The architectural constraints the labels named are
    UNCHANGED** — Shiki off the content-script static import graph, progressive first paint with
    degrade-to-plain-code, the byte-budget framing, and the now-decided app-page-only surface — restated
    as §3 decided-call prose, matching 007/008's label-free style. `plan.md` assigns the real `D-1`…`D-N`
    numbers when its own `decisions.md` entries land with implementing commits, the way 008's D-1/D-2 did
    at task 1.4. **No dedicated §9 gate question named the labels directly** — the draft's header pointed
    its own "See §9-1" cross-reference at the surface question rather than a separate item, a mismatch
    between the kickoff's assumption and the draft's actual body, flagged rather than silently resolved
    either way (AGENTS.md's standing rule) — so this ruling is recorded here and applied directly at the
    label sites (spec header "Structure" line, §3.1, §3.2, §3.4, §3.8) rather than resolving a numbered
    §9 item that does not exist in the draft as written. §9-2 (line-numbers/word-wrap defaults) and §9-4
    (the `codeTheme` settings-key boundary) are **UNCHANGED**, left as drafted.
  - **RULING 3 · Shiki gets the governed-dependency treatment, CONFIRMED IN.** §9-3 asked whether §3.10's
    dependency-governance framing (licence check, SBOM, blocking `pnpm audit --prod`, no install scripts,
    verified against the package itself) applies in full, unchanged from 007 §3.12's treatment of the
    fifth dependency. **YES, confirmed, unchanged** — the standing rule (`decisions.md` 2026-07-27 (a))
    names no milestone-by-milestone opt-out, and product spec §6 item 9 (locked minimal deps, SBOM per
    release, `pnpm audit`, Dependabot) requires it regardless. The dependency count moves **5 → 6** as a
    governed event when `shiki` is **installed at implementation**, not at this gate — `shiki` is scoped,
    not installed, deps stay **5** through this approval.
  **WHAT THIS APPROVAL DOES NOT DO:** it does not build the D-11 (iii) harness (ruling 1's consequence is
  *named*, not discharged); it does not install `shiki` or move deps off 5; it does not resolve §9-2
  (line-numbers/word-wrap defaults) or §9-4 (the `codeTheme` boundary question), both left for
  `plan.md`/§8 as drafted; it reopens no other §3.x decision and routes nothing new to §8's gate-3
  measure-then-choose list; it writes no `plan.md` or `tasks.md`.
  **Revisit-when:** (a) `plan.md` finds the app-page first-paint harness cannot be built at the cost this
  gate assumed — a finding for gate 2, not a quiet re-scope; (b) `plan.md` finds ruling 1's app-page-only
  choice cannot hold against a requirement this spec didn't anticipate — reopens a decided §3.x call and
  needs a human, not a plan-stage drift; (c) `shiki`'s licence or transitive tree, verified at
  implementation against the current package rather than this gate's spot check, turns up something
  §3.10 didn't anticipate — a `pnpm audit --prod` finding is a blocker, not a threshold to relax.

- **2026-08-13 · M8 TASK 6.1 — THE MILESTONE-CLOSE WALK: §8-2 RESOLVED (PER-TABLE AFFIRMED), §8-4
  RESOLVED (THE SET IS RIGHT, TWO PRESENTATION FINDINGS FILED).** The human walked real Chromium AND
  real Firefox with the extension loaded, per §5's human-gate list and plan §8 Q3 (`progress.md` § Now,
  TASK 6.1). This closes both deferrals 5.5 recorded below — the walk 5.5 named as the thing that would
  settle them.
  - **§8-2 — PER-TABLE STANDS, AFFIRMED, NOT NOISE.** Walked against a five-table document (five filter
    boxes): the repetition did **not** read as noise, the table "looks good." §3.6's per-table filter
    decision is therefore CONFIRMED, not altered — the concern the walk surfaced was the controls'
    STYLING (see §8-4 below), never their per-table SCOPE. 5.2's distribution (none 45 / one 2 /
    several 14, n=61, a stated-biased sample) is now walk-confirmed rather than merely informing. →
    `tasks.md` 6.1; spec §8 item 2; plan §7 §8-2.
  - **§8-4 — THE PRESENTATION SET IS RIGHT; TWO FINDINGS FILED AS FOLLOW-UPS, NOT FIXED HERE.** Sort,
    filter, copy CSV, copy Markdown — the tool set itself is confirmed correct. Two presentation
    findings surfaced, both **RECORDED, not fixed** (the human ruled record-not-fix; a `src/` fix at
    this task would exceed that ruling): **(1) the badge lane (plan §8 Q3)** — the `Agent file` badge
    WORKS and its position is functional, but reads better GROUPED with the other pills (Watch this
    file, Theme, the pins) than alone at `top:56px;left:16px`, separated from the bottom-left pill
    stack (`readerCss.ts:448-449` vs `:259,294,352,371`). **(2) the toolbar controls ship UNSTYLED** —
    the Filter input, Clear, Copy CSV and Copy Markdown controls render as default browser form
    elements, never integrated with the reader's design language; this is the styling debt 3.3 carried
    forward by name (`readerCss.ts:838-843`: *"no sort control (3.6), no filter (3.7), no copy buttons
    (3.8)"*), and 3.6/3.7/3.8 confirm by omission — none of their Files lists touch `readerCss.ts`. Both
    findings are filed in `progress.md` § Carried items, traceable to this walk, flagged forward for a
    future styling pass — not this milestone's `src/`. → `tasks.md` 6.1; spec §8 item 4; plan §7 §8-4;
    `docs/ai/progress.md` § Carried items.
  **The mechanical half of the walk** (flow verified on both engines, Firefox parity PASS — the only
  Firefox evidence this milestone has — zero unexpected network / local-only CONFIRMED, the known
  Firefox `file://` watch limitation confirmed-known, compare/diff not re-verified this walk) is
  recorded in full in `progress.md` § Now, TASK 6.1.
  **Revisit-when:** the styling pass named above lands (badge regrouped, toolbar controls styled) — its
  own task, its own session, not a silent edit riding another commit.

- **2026-08-13 · M8 TASK 5.5 — THE DECISION GATE: §8-1 SHIP, §8-2 DEFER TO 6.1, §8-3 ALWAYS-ON CHOSEN,
  §8-4 DEFER TO 6.1.** Per spec §8's own framing (*"the axes are settled here, the values are chosen by a
  human at a separate gate, from measurements a measurement task produced and is forbidden from choosing
  from"* — the D-8 pattern, spec.md:242), 5.1–5.4 produced the input (`progress.md` § Now, tasks 5.1–5.4)
  and this is the human reading it and ruling. Recorded here **before any value-setting code** — 5.6
  implements §8-2/§8-3/§8-4's chosen values, 5.7 executes §8-1's give-way only if it had been ruled OUT.
  ★ **No re-scope: SHIP, DEFER, ALWAYS-ON, DEFER — the content-script reach ships intact**; neither
  deferral narrows anything already built, both simply await 6.1's verdict on top of it.
  - **§8-1 — SHIP the content-script reach.** The gate holds on every measured axis: first-paint price
    **+8.9 ms median / +11.1 ms floor**, against the standing **26.9 ms median / 29.9 ms floor** worst-arm
    headroom — **40.8% of the floor headroom at the widest reading** (task 5.1); content-script bytes
    **+10,486 B**, decomposed to a **zero residual** (task 4.3); package headroom **693 KB** under the
    2 MB zip bound and **919 KB** under AGENTS.md's 5 MB unzipped bound (task 5.4); the copy control
    works on `file://` and degrades gracefully whichever way `file://`'s secure-context answer lands
    (task 4.2). **Recorded in 5.7's terms: this is a RE-CONFIRMATION.** The reach STAYS; the baseline is
    UNCHANGED (CS **329,233 B** / app **399,646 B**); D-6's sites 3 and 4 are NOT removed; 5.7 lands
    nothing but this record of a no-op with this number. ★ **Caveat, carried so the ruling does not
    over-claim: this is a CONTENT-SCRIPT finding only.** The APP-PAGE first paint remains UNINSTRUMENTED
    (D-11 (iii)'s carried hole, spec §5) — "it fits" is precise for the content script and does not
    silently cover the app page. → tasks.md 5.7 (no-op, recorded); spec §8 item 1; plan §7 §8-1, §9-4's
    escape hatch.
  - **§8-2 — DEFERRED to 6.1's walk.** §3.6's per-table filter decision STANDS provisionally; it is not
    altered here. 5.2's distribution (n=61 tracked documents: none 45 / one 2 / several 14 —
    73.8% / 3.3% / 23.0%, task 5.2) INFORMS but does not SETTLE whether a filter per table reads as noise
    at several small tables — that judgement is 006's *reads-as-noise* shape and belongs to 6.1's walk.
    5.2 itself names this repository as a biased sample for a tool whose users are AI agents writing
    arbitrary markdown, which is exactly why the number cannot settle the question alone. **This is a
    FINDING, not a silent non-decision: per-table stands until 6.1 rules otherwise.** → tasks.md 6.1;
    spec §8 item 2; plan §7 §8-2.
  - **§8-3 — ALWAYS-ON, CHOSEN — no threshold, no constant.** A deliberate choice, not a default. The
    chrome-outweighing shape §8-3 names (a table small enough and with no numeric column to justify a
    sort on every column) is a **13% minority** in the corpus — **9 of 69** enhance-able tables have
    ≤2 rows AND no all-numeric column (task 5.3). The tooling cost is LOW and already priced inside the
    §8-1 envelope above (5.1's +8.9 ms, 4.3's bytes). And a threshold VALUE would have to rest on the
    corpus's numeric axis, which 5.3 itself names as **the axis this corpus is least representative on**
    — 11 to 13 of 69 tables carry a numeric column depending on aggregation, a dozen-table foundation for
    a cut-point. **So 5.6 sets NO constant: always-on is the CURRENT shipped behaviour, and this entry is
    what makes that a CHOSEN state rather than a silent default it was never justified to be.** →
    tasks.md 5.6 (no constant); spec §8 item 3; plan §7 §8-3.
  - **§8-4 — DEFERRED to 6.1's walk.** No measurement from 5.1–5.4 bears on the presentation set — the
    axes are settled (presentation only, nothing persisted, parser untouched) but the SET itself, carried
    from §3.3/§3.5/§3.6, is a walk judgement: whether the controls read as clutter is not answerable from
    a byte count or a timing arm. **This is a FINDING pointing to 6.1, not a verdict reached here.** →
    tasks.md 6.1; spec §8 item 4; plan §7 §8-4.
  **Revisit-when:** 6.1's walk returns a reads-as-noise or reads-as-clutter verdict on either deferred
  axis (§8-2, §8-4) — a task added below 6.1, never a silent fix; or a future milestone's corpus (less
  biased on the numeric axis 5.3 flags) makes a threshold-worthy case §8-3 has no basis for here; or the
  app-page first-paint harness named in D-11 (iii)'s trigger lands and narrows §8-1's carried caveat.

- **2026-08-05 · 008 D-3 — the diff context grows additively, the way 6.2 already grew it; the snapshot
  pair is byte-untouched.** *(Plan 008 §0's pre-written entry text, applied verbatim. IMPLEMENTED across
  group 2: typed at 2.1 (`53638ff`), provisioned on the app page at 2.2 (`1dde750`), read by the picker at
  2.3 (`b0773c9`), read by the one branch at 2.5 (`a07f94d`).* ★ **LANDED AT A RECONCILE, ONE COMMIT AFTER
  GROUP 2 CLOSED — NOT WITH ITS IMPLEMENTING COMMIT, WHICH IS WHAT THE CONVENTION ASKS FOR.** *The tasks
  header (`specs/008-persona-1-qol/tasks.md:55-57`) requires each D-value's entry to land with the commit
  that implements it — D-1 and D-2's did, at 1.4 — but **none of 2.1–2.5's Files lists included
  `docs/ai/decisions.md`**, so the entry could not land inside the fences those tasks set. 2.5 reported the
  gap rather than inventing a close (`progress.md` § Now: "one thing IS outstanding and is the human's to
  route"), and this entry is that routing discharged. It describes the decision **AS IT SHIPPED**; the
  decision itself is sealed at gate 2 and nothing here re-opens it. Recorded plainly so 6.3's audit — which
  asks that every D-value's entry be present and **names any that did not land with its commit** — reads
  the fact off the entry rather than having to reconstruct it.)*
  `DiffContext` grew a **SECOND, OPTIONAL capability pair** — `fetchFiles?(): Promise<DiffFileEntry[]>` and
  `fetchFileText?(path)` (`diffRegistry.ts:142`, `:147`), mirrored on `createDiffContext`'s config
  (`:169-170`) — beside the existing four. **The precedent is the file's own header:** task 6.2 added
  `showDiff`/`hideDiff` to a context that started as `fetchMeta`/`fetchText` alone, and that amendment is
  cited in-code (`:62`) rather than re-argued. A discriminated target type was **REJECTED and not
  re-derived** — 007 D-4 already ruled on parameterising shipped, tested code to serve a second caller.
  **THE SNAPSHOT PAIR IS BYTE-UNTOUCHED, AND 2.1 PROVED IT RATHER THAN ASSERTING IT — four ways:** the four
  existing declarations and their doc comments pinned by **SHA-256 `ab9753bb…` over 1,194 UTF-8 bytes**
  taken from `21526ac` before the edit, with a same-test control proving the digest rejects a one-word case
  change; `git diff --numstat` **49/0 and 160/0 — zero deletions**; an **EMPTY diff** on `diffChrome.test.ts`
  and `diffChrome.browser.test.ts` with **every existing fake passing unedited** (that IS the additive
  property); and **making the pair required reds `tsc` at seven existing sites** — which is also what makes
  *"snapshots but no folder list"* a legal, designed state rather than a hole.
  ★ **THE DISCRIMINANT IS ON THE ROW, NOT IN THE CONTEXT.** `item.dataset.targetKind`
  (`diffChrome.ts:483`), beside today's `dataset.snapshotId`. The two capabilities stay **INDEPENDENT** —
  never a tagged union, which would push a `kind` through both closures to reach one branch — **and that is
  precisely what let 2.5's `compareWith` branch ONCE, reading the row** (`:387`): the branch reads the
  discriminant at the gesture, and no `kind` crosses the fence or enters either closure.
  **`DiffFileEntry` is registry-local and narrow** — `{path, name}` (`:99`), a structural subset of
  `MarkdownFile` so a filtered `activeSource.files` is assignable with **no adapter**, while `read()` stays
  out of the affordance's reach: text arrives **only** through the provisioned closure. 2.2 provisions both
  on the **app-page side of the fence** (`appShell.ts:987`, `:994`) over `activeSource.files`, **excluding
  the open document** (*"another file"*, never one offering an always-empty diff against itself), and
  `fetchFileText` is a **FRESH `read()`, never a stored copy** (§3.2's stated reason for not reaching
  through storage). `diffChrome.ts` gained **no import**, no fence clause changed, and 007's import fence
  stayed **8/8** through every task in the group.
  ★ **`computeDiff` WAS NEVER TOUCHED — the substrate gift, and it held.** It diffs two strings, so
  compare-two-files is a **PICKER, not an engine**: 2.5's file-vs-file diff is the same provisioned
  capability fed a different `before`. **§9-5 holds by construction** — `after` is always
  `getCurrentSource()`, so current-vs-picked is not a rule the code obeys, it is the only thing it can
  express.
  **BYTES: 2.1 MOVED NOTHING**, and the instrument fired — type declarations erase and doc comments strip,
  so all three artifacts came back md5-identical, while a runtime statement in `diffRegistry.ts` moved the
  app chunk **+76 B** and one in a symbol the content-script graph retains moved the content script **+88 B**
  on both engines, restored byte-for-byte. The picker's own bytes are **2.3's (+887 B) and 2.4's (+352 B)**,
  assigned in those tasks and in D-4's entry below, never to D-3.
  **Revisit-when:** (a) a **fourth consumer** needs document comparison and wants more than `{path, name}` —
  `DiffFileEntry` then grows a field and its narrowness (and the `read()`-stays-out property that rests on
  it) is **re-argued, not assumed**; (b) **picked-vs-picked is reconsidered**, which is a gate-1 **§9-5**
  event and not an implementation call — it would take the row-borne discriminant with it, because a second
  *picked* side has no "current" for `getCurrentSource()` to supply and the one branch stops being
  sufficient.

- **2026-08-05 · 008 D-4 — the picker carries two kinds as ARIA groups inside the one listbox; a
  single-kind picker is byte-identical to what 006 shipped.** *(Plan 008 §0's pre-written entry text,
  applied verbatim. IMPLEMENTED at 2.3 (`b0773c9` — the discriminant and the two groups) and 2.4
  (`6a6b868` — every empty state, plus the amendment recorded in its own entry below). **Landed at the same
  reconcile as D-3 above and for the same reason** — see that entry's note; the decision is sealed and
  nothing here re-opens it.)*
  **ONE `role="listbox"`, TWO labelled `role="group"`s** — *Snapshots of this document* / *Other files in
  this folder* (`diffChrome.ts:245-246`), built by `buildGroup` (`:500`), with the picker's own label
  widened to `ARIA_PICKER` (`:242`, set at `:342`) so it covers both kinds. **No dialog, no menu, no second
  pill** — §3.2 rejected a second control, and grouping is the standard ARIA answer to *"one list, two
  kinds"*. Rows stay `<button role="option">` for the keyboard operability that buys for free; **a file row
  NAMES the file and SAYS it is a file, in text** (`:477`), so the kind is never inferred from which group
  it sits in or from where it falls in the list (§5); **snapshot rows are unchanged**, absolute stamp and
  size included (divergence 2 stands).
  ★ **THE GROUPS RENDER ONLY WHEN BOTH KINDS HAVE ENTRIES** — one ternary in `openPicker` (`:509`) — and
  otherwise the picker is **structurally what 006 ships**: flat option rows, no lone group, no empty group,
  no scaffolding around a list with one kind in it. **This is not tidiness:** it keeps the snapshot-only
  path — the one every existing browser assertion drives — identical, so those assertions cannot pass by
  transcription drift. **2.3 proved the non-regression red-first as a printed tag+role+depth TREE, not as a
  count:** rendering the groups unconditionally reds it **naming `div[role=group]` on the line it appeared**,
  where a count check would only have said *"expected 1 to be 0"*.
  **EVERY EMPTY STATE LANDS IN THE EXISTING `role="status"` LINE** — never a fake row, never a disabled row,
  never a placeholder, never a `role="group"` with nothing in it (§4's *say so*, §5's named-in-text).
  Snapshots but no siblings → the files sentence (`:254`); files but no snapshots → the snapshots sentence;
  **both empty → `closePicker()` and say it, which is 006's shipped branch preserved unchanged** for the
  surface that has no folder list. ★ **The file sentence is gated on the CAPABILITY, not on the count** —
  `typeof context.fetchFiles === 'function'` (`:523`), red-first by gating on `files.length` alone: that
  test cannot tell *"the folder holds no other markdown"* from *"this surface was never provisioned to
  look"*, and only the first is a state worth a sentence. Saying it on the other would **name a state the
  user is not in**.
  ★ **THE 2.4 AMENDMENT IS NOT REPEATED HERE — IT HAS ITS OWN ENTRY** (2026-08-04, *008 task 2.4 WIDENED*,
  immediately below), which records in full why the half-empty states needed a **measured CSS lane**
  (`readerCss.ts:1043`), why that lane is **DERIVED** from the picker's own `max-height` token rather than
  tuned, why it lands in `CONTAINED_CSS` only, and how `diffChrome.test.ts`'s *"mutually exclusive on every
  path"* invariant was **RE-SCOPED rather than deleted** (`:569-572`). **D-4 as sealed is unchanged by it:**
  the amendment widened 2.4's Files list so D-4's half-empty requirement could actually be delivered
  without the status painting over the list it describes — it did not alter what D-4 decided.
  **BYTES, assigned:** 2.3 moved the content script **+887 B** (ARIA const + named local 6 · row
  discriminant + widened label 48 · the file row 585 · the grouping 248, **residual ZERO**); 2.4 moved it
  **+352 B** and the app chunk **+354 B** (CSS lane 205 · copy 147 / 149, **residual ZERO** — not the same
  +N on both artifacts, because the copy mangles 2 B wider in the app chunk). Both decomposed by ablation
  with a control that fires.
  **Revisit-when:** (a) a **THIRD kind of comparison target** appears — the both-non-empty ternary is a
  two-kind rule and generalises to N groups only by being rewritten, and the *"one kind is 006's flat
  picker"* non-regression has to be restated as *"one of three"* before it means anything; (b) the
  **picker/status shared slot is restructured** (the two get independent placements, or the status moves
  into the picker), which is the 2.4 amendment's own revisit-when and takes the lane and the re-scoped
  invariant with it.

- **2026-08-05 · 008 D-5 — a file-vs-file diff says which file is which side, in text, in the line that
  already exists for saying things.** *(Plan 008 §0's pre-written entry text, applied verbatim. IMPLEMENTED
  at 2.5 (`a07f94d`), the task that made compare-two-files a working feature. **Landed at the same
  reconcile as D-3 and D-4 above**, for the reason D-3's note gives; sealed at gate 2 and not re-opened
  here.)*
  **`compareWith` BRANCHES ONCE, AT THE GESTURE, OFF THE ROW.** It takes the picked **row**
  (`diffChrome.ts:387`) rather than a `{kind, key}` pair, because the discriminant already lives there and
  nowhere else (D-3), and reads `dataset.targetKind` **once**: file → `fetchFileText(path)`, snapshot →
  today's `fetchText(id)`. **Everything downstream is SHARED and unchanged** — `getCurrentSource()`,
  `showDiff(host, before, after)` over the plan §1.4 fence, and the same fallback ladder. The row carries
  `fileName` as well as `filePath` (`:485`) so the branch's copy can name the file without re-reading the
  row's spans. **One handler on both kinds, not two paths that happen to agree.**
  **THE CAPTION NAMES BOTH SIDES *AND* THE DIRECTION, IN TEXT** — `fileCaption` (`:279`): *"Comparing
  doc.md with sibling-one.md — removed lines are sibling-one.md's, added lines are doc.md's."* The two names
  alone would leave the **direction** to be inferred from which colour a block is, which is exactly the
  inference §5 forbids and §3.2's surviving obligation is about; **the clause after the dash is the
  load-bearing half, and the order of the names is not**. The document's own name comes from
  `getDocIdentity()` — **D-1's registry, the one seam that already holds it** — with `TEXT_THIS_DOCUMENT`
  (`:261`) as the AGENTS.md #5 totality fallback rather than a designed state: it is **unreachable on the
  production path**, since `registerDocIdentity` runs before `registerDiffContext` and a picker exists only
  where a context is registered.
  **IT LANDS IN THE STATUS LINE THAT ALREADY EXISTS** — already polite, already under the pill, already the
  surface every diff failure speaks through, and already out of the a11y tree while empty. So a successful
  file comparison replaces today's `say(null)` (`:428`), and `showCompare()`'s existing `say(null)` clears
  it on exit: **no new element, no new lifecycle**, one element fewer than a caption of its own.
  ★ **GATE-2 RULING Q1 HELD VERBATIM — SNAPSHOT DIFFS ARE LEFT AS THEY WERE.** §4 asks for the naming on
  **file-vs-file only**, and a snapshot's *"before"* is an earlier version of what is already on screen, so
  the direction is not in doubt. The caption therefore sits on the **file side of the one branch**
  (`say(isFile ? fileCaption(…) : null)`), and a snapshot pick still **says NOTHING on success** — the diff
  is the answer. Both directions are red-first proven, **over-determined**: captioning both kinds reds the
  Q1 pin *and* 006's inherited *"success says nothing"* assertion.
  **§3.8 BRANCHES WITH IT.** `TEXT_UNAVAILABLE` names a **snapshot** (*"that snapshot is no longer
  stored"*), which is the wrong sentence for a file that could not be read — it names a thing the user did
  not pick, on the one path where they picked something else. So the file case gets its own sentence,
  `unreadableFile(name)` (`:266`, routed at `:419`): *"Comparison unavailable — sibling-one.md could not be
  read."*, said **beside the untouched document**, never entering the diff.
  **SIX ABLATIONS, EVERY ONE FIRING ON BOTH ENGINES**, including the one 2.3's boundary pin predicted:
  routing a file pick through `fetchText` answers it with *"that snapshot is no longer stored"*. That pin
  (`diffChrome.test.ts`, 2.3-era) was **RE-SCOPED, not deleted** — the 2.4 precedent — from *"the file row
  has no handler"*, which is exactly what 2.5 lands, to *which capability the discriminant routes a file
  pick to*.
  **BYTES: +416 B content script / +414 B app chunk, five arms, residual ZERO** — and ★ **the FOURTH arm
  exists because the other three cannot see the plumbing they share:** ablating the branch and the caption
  one at a time leaves the destructured row dataset, the `isFile` read and the `HTMLElement` parameter
  standing in **both** arms, so the three margins sum to **323 of 416** and 93 B land nowhere. The
  all-three-off arm reproduces the pre-2.5 bundles to the md5 on both engines, which is what makes the 93 B
  a measured remainder rather than an unexplained one. `readerCss.ts` was **untouched**: the caption reuses
  the status line's existing styling.
  **Revisit-when:** (a) a **snapshot diff is asked to gain a caption** — that is a **re-ruling of gate-2
  Q1**, not an implementation detail, and it moves the `say` out from under the `isFile` branch, at which
  point *"a snapshot's direction is not in doubt"* is the claim being overturned and needs to be stated as
  such; (b) a **third comparison kind** needs its own caption form, which re-opens the one-`if` shape
  itself — `fileCaption`'s two-name sentence stops being the whole vocabulary, and the row-borne
  discriminant would be carrying three values into one branch.

- **2026-08-04 · 008 task 2.4 WIDENED (Option 1) — the half-empty empty-states need a measured lane,
  because the status line and the picker share a slot.** *(A PLAN-LEVEL AMENDMENT to `tasks.md`'s 2.4, and
  it is recorded here rather than only in the commit so the next reader knows why 2.4 touches FOUR source
  files instead of two and why a tested invariant changed.)* **D-4 requires the half-empty states to LIST
  the kind that has entries AND SPEAK the empty state in the status line simultaneously** — that is the
  whole difference between them and the both-empty branch, which closes the picker. **But
  `readerCss.ts:429-430` (base) and `:996-997` (`CONTAINED_CSS`) put `.peekover-diff-picker` and
  `.peekover-diff-status` in ONE slot** (`top:50;left:16;z-index:2`, `absolute` under containment),
  **safe until now only because `diffChrome.ts` closed one before showing the other** — the invariant
  pinned at `diffChrome.test.ts:463` and the rationale written into the CSS at `readerCss.ts:421-428`
  (*"It occupies the picker's slot, which is safe because the two are mutually exclusive by construction
  in diffChrome.ts"*). **The half-empty states break that mutual exclusion BY DESIGN.** **MEASURED before
  deciding, on the real surface, both engines, by HIT-TEST rather than by rects** (PROBE-2.4/A+B): the
  status message does not merely intersect the list, it paints and hit-tests **OVER** it —
  `elementFromPoint` over the first list row returned `peekover-diff-status`, and 2 of 2 rows were
  covered. **That is worse than the empty list §4 forbids**: the user is told "no snapshots yet" by a box
  sitting on top of the files they were offered. **So 2.4's Files list is WIDENED** from
  `{diffChrome.ts, diffChrome.browser.test.ts}` to also include `{readerCss.ts, diffChrome.test.ts}`:
  **`readerCss.ts` gets a CSS-only lane for the status WHEN the picker is open**, and **the `:463`
  invariant is RE-SCOPED, not deleted**, to *"mutually exclusive except the half-empty states, which are
  non-overlapping by measured lane"*. ★ **The lane is DERIVED, not tuned** — `picker-top +
  max-height:min(46vh,320px)` (`readerCss.ts:403`, the picker's own token) `+ 6px`, the gap
  `diffChrome.ts:107` already records between pill and picker. A fixed offset would have been wrong at
  some height, because the picker's height varies from one 44px row to the token's cap. ★ **The lane
  lands in `CONTAINED_CSS` ONLY** — `diffChrome.ts:104`'s standing precedent (*"the pill exists on the
  app page alone (D-14), so no full-page rule moves"*), which recovery B1 already followed; a full-page
  lane would be a rule for chrome that D-14 guarantees never renders there. **`READER_CSS` is
  byte-untouched.** ★ **Note against plan §6/gate 3, which named 3.3 as the task where `readerCss.ts`
  first moves content-script bytes:** this amendment moves that forward to 2.4. The reason 3.3 was chosen
  — *"with the CSS the only contributor in flight its ablation is exact"* — is honoured here by
  decomposing 2.4's delta into its `readerCss.ts` and `diffChrome.ts` portions separately, with a firing
  control. **Revisit-when:** a future picker/status restructure removes the shared slot (the two get
  independent placements, or the status moves into the picker), **at which point the lane and the
  re-scoped `:463` invariant are re-derived rather than carried** — the lane exists only because the slot
  is shared, and it should not outlive that fact.

- **2026-08-04 · 008 D-1 — the document's name arrives at the render path the way the watch target and
  the diff context do, because it is the only seam that survives a re-render.** *(Plan 008 §0's
  pre-written entry text, applied verbatim. IMPLEMENTED AND TRUE IN THE SHIPPED PRODUCT at task 1.4,
  `docs/ai/progress.md` § Now — which is why the entry lands here rather than at 1.1: the module existed
  from 1.1 and the badge read it from 1.3, but until the two registration sites were wired
  `getDocIdentity()` returned `undefined` at every production render and the seam carried nothing.)*
  Document identity reaches `mount()` through a NEW module-level registry, `src/render/docIdentity.ts` —
  the THIRD instance of the register-once pattern after `watchRegistry.ts` (005 D-A) and `diffRegistry.ts`
  (006 §1.4). **NOT `MountOptions`, NOT the post-mount call site**, the three candidate seams §7-2 named
  and closed. **The decisive argument is the re-render, not the shape.** `MountOptions`' own header calls
  it *"Optional render modes for a mount"* and both members are booleans about HOW to render, which is a
  taste argument that decides nothing; what decides it is that **a name threaded through `MountOptions`
  would not survive a watch re-render on EITHER surface.** The app page re-renders through
  `renderWithDiagrams`, a module-level `const` with no file in scope, so it would have to close over app
  state — module-level state by a longer road; the content script's `contentWatch.ts` passes **no
  `render` at all** and gets bare `mount`, so the name would be **dropped outright** — and dropped the
  first time an agent edits the file, which is precisely the moment the badge is meant to be on screen.
  That is 007 D-12's bug class, and avoiding it is the whole of this decision. **The registry is
  therefore re-read at BUILD time, never captured:** `buildAgentBadge` calls `getDocIdentity()` inside
  itself, per render, so render N+1 reads what render N+1's registry holds. **WHAT IT COST, stated
  exactly:** one new module (data only — it holds a string and imports NOTHING, not even a type, so it
  adds no edge any fence must reason about and is safe on both graphs) and **exactly one line in
  `mount.ts`** — `children.push(...buildAgentBadge())`, the fifth instance of a pattern
  `buildThemeControl` / `buildWatchChrome` / `buildDiffChrome` / `buildTocView` already establish; 007
  touched `mount.ts` at zero sites and 008 touches it at one, which is a checkable property and was
  checked. **THE TWO REGISTRATION SITES (task 1.4), both re-derived against the tree:** the app page at
  `appShell.installWatchForFile`, registering `file.name`; the content script in `runReader`, after the
  renderable gate that already holds and parses `location.href`, registering
  `basenameOf(location.href)`. ★ **Registration is gated on NOTHING.** Not on `docId != null` — the diff
  context is, because a snapshot needs a folder identity, whereas a badge needs only a basename, which
  `MarkdownFile.name` always carries — and **not on `installWatchForFile`'s `!decision.watchable` early
  return either**, which is the same silent drop one gate earlier and the *reachable* one: a Firefox
  picker-route folder is `{watchable:false}`, so a registration placed beside `registerDiffContext`
  would leave every agent file opened that way un-badged, on the surface least able to explain itself.
  The call is therefore FIRST in that function, and both directions are asserted red-first. **Rejected:**
  `MountOptions` (on the re-render property above); a fourth mechanism (§7-2 forbids one and nothing
  needs one); passing the name into `createWatchController`'s config on both surfaces (the `MountOptions`
  road with two extra config fields and the same module-level endpoint). **Revisit-when:** a fourth
  consumer needs document identity and wants more than a basename (the holder grows a field and the
  data-only property is re-argued, not assumed); **or** a surface appears whose re-render does NOT pass
  through `mount()`, at which point "re-read at build time" stops being sufficient on its own and the
  registry needs a change notification the way `watchRegistry` has one.

- **2026-08-04 · 008 D-2 — the badge is a name comparison and a text node; absence is the resting state
  and costs one Set lookup.** *(Plan 008 §0's pre-written entry text, applied verbatim. Implemented at
  tasks 1.2 (the predicate) and 1.3 (the badge); TRUE IN THE SHIPPED PRODUCT at 1.4, when registration
  first fed the predicate a real name — before that it judged `undefined` at every production render.)*
  Recognition is a PURE PREDICATE over the BASENAME in `src/render/agentFile.ts`, and the badge is
  `buildAgentBadge()` returning `[]` by default. **Exact, case-sensitive match against one frozen set of
  five** — `CLAUDE.md`, `AGENTS.md`, and this repository's own `spec.md` / `plan.md` / `tasks.md`
  convention. Case-sensitive **because the convention is the point**: a `claude.md` is not the file the
  convention names, and a case-insensitive match would badge it wrongly rather than not at all.
  **Never content sniffing** (spec §3.4, §4) — the name is the whole input. **The content-script basename
  needs `decodeURIComponent`:** `new URL('file:///c:/dev/My%20Docs/AGENTS.md').pathname` yields a
  percent-encoded segment, so a raw `split('/').pop()` would silently produce a false negative on any
  path containing an encoded character; decided here rather than discovered, and asserted against a real
  `location` at 1.4. **`basenameOf` never throws** — it catches both `new URL` and `decodeURIComponent`
  and returns `''`, which the predicate simply declines — which is what lets task 1.4 put it on a path
  that runs before the reader mounts without putting AGENTS.md #5 at risk. **`buildAgentBadge()` returns
  `[]` when nothing is registered OR the name is unrecognized** — the `buildDiffChrome` shape verbatim
  (*"THE GATE. Read at BUILD time … it is the only condition"*) — **with NO explanatory note in either
  case**, for D-14's reason: the user was never offered anything, so there is nothing to be told they are
  missing. One empty state, not two, because `isAgentFile(undefined)` collapses them by construction.
  **The badge is a SIBLING of `.peekover-reader`**, pushed into `children[]`, never inside the reading
  column — so the column stays byte-identical and the golden pin is untouched **by construction**; that
  also means an EMPTY golden diff is NOT evidence for it, and 1.4 asserts the sibling relationship
  structurally in a real engine instead. **The copy carries the mockup's `Agent file` and appends the
  name** (`Agent file · CLAUDE.md`), dropping the mockup's `· tuned rendering on` (that outcome is spec
  §8-4's, un-chosen until 6.1) and its `◈` glyph plus `var(--ok)` colour (spec §5 requires state in TEXT,
  §3.11 row 15). **Which presentation defaults a recognized file gets is NOT decided here** — this builds
  the seam and the badge, it does not pick the tuning; and **the badge's LANE is not chosen here either**
  (gate-2 Q3: 1.5 produces the rect measurement, the human chooses at 6.1, and the shipped CSS is
  PROVISIONAL until then). **Revisit-when:** the recognized set needs to grow — that is a SPEC decision,
  not an implementation one, and `.cursorrules` and every non-markdown agent file are already OUT by
  gate-1 disposition §9-3 and unreachable through the shared extension gate anyway; **or** §8-4 chooses a
  presentation set, at which point the badge's copy is re-opened against what was actually chosen.

- **2026-08-03 · M8 GATE 3 — tasks 008 (persona-#1 QoL: compare-two-files · agent-file awareness · table
  tools) APPROVED. Implementation may begin at task 1.1, in a fresh session. AND — carried since 9.3 —
  THE CHECKBOX CONVENTION IS SETTLED, as a STANDING INVARIANT.**
  `specs/008-persona-1-qol/tasks.md`, finalized at `87532ad` (**35 tasks across six groups** — 1 (6) ·
  2 (5) · 3 (11) · 4 (3) · 5 (7) · 6 (3)), was reviewed against plan 008 and approved to begin
  implementation. **The tasks.md status line stays "DRAFT awaiting gate 3" and THIS ENTRY IS THE
  APPROVAL OF RECORD** — the standing precedent, now four gates deep (spec 007 still reads "draft"
  post-gate-1 `e09520f`; plan 007 still reads "draft — awaiting gate 2" post-gate-2 `cab93c7`; tasks 007
  still reads "DRAFT awaiting gate 3" post-gate-3 `66634fa`; M8's spec and plan likewise, `aaf990e` /
  `2c29821`). A context-loss session verifies M8's gate 3 **here**, not in the artifact header.
  **WHAT THIS APPROVES:** the tasks as finalized — the sealed plan ordered into groups, **each task
  naming the D-values it services** and applying plan §0's already-written `decisions.md` entry text
  verbatim with the commit that implements it; the **four gate-2 rulings applied, never re-argued**
  (Q1 snapshot diffs stay verbatim → 2.5 captions file-vs-file only · Q2 two buttons, no menu → 3.8,
  with §3.11 rows 9 and 21 left `—` and no overlay or focus-trap work in group 3 · Q3 the badge lane is
  produced at 1.5 and chosen by the human at 6.1 · Q4 the D-11 (iii) trigger stands, confirmed at 6.3);
  **both gate-2 scope instructions discharged** — the heaviest table-tools task **split four ways**
  (3.2 module · 3.3 CSS + token verification · 3.4 the two app-page call sites · 3.5 containment) and
  the give-way **its own task at 5.7**, stated as *removal of D-6 sites 3–4 + a re-measurement to a
  restored 318,747 B and the two original md5s*, never an edit to a constant. ★ **The milestone's one
  hard sequencing constraint HOLDS AFTER THE SPLIT, re-checked by number: the §3.11 sibling audit is
  consumed at 3.1, which precedes every table-tools test task — the first table-tools assertion is at
  3.2/3.4, and the split's three added tasks all landed BELOW 3.1.** Spec §6's IS-NOT fence is intact
  and the gate-1 dispositions (§9-1 one milestone · §9-2 presentation-only · §9-3 `.cursorrules` OUT ·
  §9-4 both surfaces with §8-1 as the escape hatch · §9-5 current-vs-picked · §9-6 discharged) are
  **preserved by silence**.
  **TWO CONSEQUENCES WERE FLAGGED AT THE GATE AND BOTH ARE ACCEPTED — banked because they are the
  human's calls, not the drafting session's:**
  - **(i) The first NON-ZERO content-script byte delta in five milestones lands at 3.3 — ACCEPTED.**
    The toolbar's CSS lives in `readerCss.ts`, which is on **BOTH** graphs, so presentation moves
    content-script bytes **before any call site exists**. That is deliberate, not a slip: with the CSS
    as the **only contributor in flight**, its **ablation is exact** — remove the block, rebuild, `wc -c`
    and md5 move by the amount claimed — and the presentation stays revertable without touching the
    logic. Every delta is still stated with its baseline (**318,747 B**, md5 Cr
    `c7b33b36b1a727fdacb77eefe64083e1` / Fx `67717921bdf646c7366176392d0c37d7`) and decomposed to a
    **zero residual**, never proven by an identifier grep. *(The badge's own first delta is 1.3's, on
    the same terms.)*
  - **(ii) Task 3.4 stays AS-IS — two app-page call sites plus the toolbar's structural §3.11 rows
    (1, 2, 3, **4 INVERTS**, 23) — NOT split further. ACCEPTED.** The two sites are
    **load-bearing-together per D-6**: `readerPane.ts:185` and `appShell.ts`'s renamed
    `renderWithDiagrams` must land in one unit, because wiring only the first ships a toolbar that
    **disappears on the app page's own re-render** — 007 D-12's bug class, one surface over, and the
    same reason 4.1's two content-script sites land together and 5.7 removes them together. Splitting
    3.4 would buy review granularity by making a defect landable.
  **★ THE CHECKBOX CONVENTION — the 9.3 carried decision, RULED (c) WITH A PREDECESSOR NOTE, and
  recorded as a STANDING INVARIANT rather than a milestone note.** 9.3 routed this with three options and
  no recommendation (`progress.md` § Carried items; full context in § Baselines' *THE 9.3 RECONCILE
  RECORD*), counted at HEAD: **001 15/15 · 003 15/15 · 004 19/19 · 005 25/25 · 006 20/20 ticked; 002
  0/15; 007 0/28.** The ruling:
  - **FORWARD, from 008 onward: PER-TASK TICKING.** Each task's box is ticked **in ITS OWN commit** —
    the same commit that lands that task's code and advances `progress.md`'s Now-pointer. `tasks.md`
    ships with **unticked** boxes and they tick as tasks land. This is 006's shipped shape (22 commits
    touch its `tasks.md`) promoted from habit to invariant, so the divergence cannot recur; it composes
    with the existing M1 rule that the Now-pointer advances per task in that task's own commit.
  - **PREDECESSORS ARE NOT RETROACTIVELY TICKED. 002 (0/15) and 007 (0/28) PREDATE this convention.**
    Their done-ness signal is the **`progress.md` pointer and their § Closed-milestones record**, NOT
    their boxes. ★ **Recorded explicitly so a future reader does not read "007 is 0/28" as "007 is
    unstarted": the boxes are a FORWARD convention, not a historical one** — M7 shipped all 28 tasks
    plus five further code commits, and § Closed milestones is where that is verified. Option (a)
    (a retroactive 28-box commit) is **declined**: ticking 27 boxes in one close commit is precisely the
    per-task-in-its-own-commit convention this entry is banking, performed backwards, and `tasks.md` sat
    outside 9.3's Files list for the reason 8.4's D-10 (b) precedent gives.
  - **This DISCHARGES the 9.3 § Carried items checkbox decision**, marked discharged there in the same
    commit as this entry. Nothing was blocked on it; it is settled **before** implementation begins, as
    9.3 asked.
  **WHAT THIS APPROVAL DOES NOT DO:** it reopens **no** plan D-value, **no** spec §3.x decision and
  **no** gate-1 or gate-2 ruling; it edits **no** sealed artifact (spec, plan and tasks are untouched by
  this commit, and the tasks status line is **not** flipped); it chooses **no** §8-1 ship/no-ship, **no**
  §8-2 filter granularity, **no** §8-3 threshold and **no** §8-4 presentation set — all four stay
  measure-then-choose, **PRODUCED** at 4.3 and 5.1–5.4, **CHOSEN by the human at 5.5**, executed at 5.6
  and 5.7 — and it does **not** pick the badge's lane (1.5 produces, 6.1 chooses). **It writes no
  implementation code:** task 1.1 begins in a **fresh session** (C14, WORKFLOW.md §5.3).
  **Revisit-when:** (a) implementation surfaces a task whose Verify contract cannot be executed as
  written — banked at the point of discovery, as its own act, never propagated forward (the M7 gate-3
  precedent, whose one outstanding §1.1 correction is the worked example); (b) 5.5 rules §8-1's surface
  reach OUT, which fires 5.7's give-way — a **finding reported with its number**, not a quiet re-scope;
  (c) a copy-out affordance later needs a menu, re-activating §3.11 rows 9 and 21 — a re-ruling of
  gate-2 Q2, not an implementation detail; (d) a future milestone wants a done-ness signal from the
  boxes of 002 or 007 — the answer is the pointer and § Closed milestones, and changing that is a new
  human call, not a tidy-up.

- **2026-08-03 · M8 GATE 2 — plan 008 (persona-#1 QoL) APPROVED. Its two architectural calls CONFIRMED,
  two of plan §8's four questions RULED, and two SCOPE INSTRUCTIONS issued to the tasks stage.
  `tasks.md` is the next artifact and the next gate.**
  `specs/008-persona-1-qol/plan.md`, drafted at `fa27333` against a codebase recon at `f46f558`, was
  reviewed and approved. It settles **D-1…D-12**, resolves the spec's ten §7 risks against the **actual
  code**, discharges the §7-7 sibling-checklist audit as a 24-row table over two chromes with **opposite
  geometry**, proposes **no spec amendment** and adds **no dependency**. **The plan file's status line
  stays "draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)" and THIS ENTRY IS THE
  APPROVAL OF RECORD** — the standing precedent (spec 007 still reads "draft" post-gate-1 `e09520f`;
  plan 007 still reads "draft — awaiting gate 2" post-gate-2 `cab93c7`; M8's spec still reads "draft"
  post-gate-1 `aaf990e`). A context-loss session verifies M8's gate 2 **here**, not in the artifact
  header.
  **THE TWO ARCHITECTURAL CALLS — CONFIRMED, with the reason each was confirmed ON:**
  - **★ D-1 (the identity seam) — CONFIRMED. `mount()` spends ONE line.** Document identity arrives
    through the new **data-only** registry `src/render/docIdentity.ts`, read at **build** time, and
    `mount()` gains exactly `children.push(...buildAgentBadge())` — the **fifth** instance of the pattern
    `buildThemeControl` / `buildWatchChrome` / `buildDiffChrome` / `buildTocView` already establish.
    `mount()` stays **read-only library** in the sense 006 D-15 gives that property: it reads a data
    holder, writes nothing, owns nothing, branches on nothing about the app. **`MountOptions` is rejected
    on the RE-RENDER property, not on taste** — a name threaded through it would be reconstructed away by
    `watchController`'s own options object on the app page and **dropped outright** on the content script
    (`contentWatch.ts:121` passes no `render`), i.e. **the badge would vanish the first time an agent
    edited the file**, which is 007 D-12's bug class exactly. **The human ACCEPTED spending the one line
    in `mount.ts` in order to get the badge on BOTH surfaces** — the cost is one checkable line, and the
    alternative pays module-level state by a longer road on one surface while losing the feature on the
    other.
  - **★ D-6 (no shared enhancement seam) — CONFIRMED. Five explicit call sites stay, and the DIFFERENCE
    between them IS the import fence.** A shared `enhance(host)` composition point called from the
    content script would put `diagramEnhancer` — and mermaid's dynamic edge behind it — **on the
    content-script graph**, taking 007's static import fence from **8/8 to red**. **And an enhancer
    REGISTRY would be worse:** it would keep the fence green by converting a static property the
    traversal can see into a **runtime registration it cannot** — the fence would pass while the graph
    was open, which is M6 retro finding 1's zero-discriminating-power shape verbatim. **The human
    ACCEPTED hardening the duplication into policy: the fence is worth more than the DRY.** The
    `readerPane.ts:184` *"identical body by construction"* comment becomes **deliberately false across
    surfaces**, and that asymmetry is §3.2/§3.7's fence expressed in imports. **D-6's site 4
    (`contentWatch.ts:121`, which must gain a `render` closure) lands with site 3** — a content script
    that enhances on first mount and not on re-render is a shipped defect, not a partial feature.
  **THE OTHER D-VALUES — APPROVED AS DRAFTED.** D-2 (pure predicate over the basename, case-sensitive,
  `buildAgentBadge()` returns `[]` by default, no explanatory note) · D-3 (a second **optional**
  capability pair on `DiffContext`; the snapshot pair byte-untouched; the discriminant on the picker row)
  · D-4 (one `role="listbox"`, two `role="group"`s, rendered only when both kinds are non-empty; empty
  states in the existing status line) · D-5 (a file-vs-file diff names both sides in the existing status
  line) · D-7 (the table enhancer is TOTAL) · D-8 (scoped to `.peekover-reader`, and the scoping is
  REQUIRED because `renderHunk` runs the full parser) · D-9 (per-render state; the degradation is
  structural, `replaceChildren` leaves nothing stale) · D-10 (clipboard needs transient activation, which
  a click supplies; `permissions: []` holds; the `file://` secure-context residual proven empirically) ·
  D-11 (per-item mechanical cheapness + the three-arm conditionality guard + the carried app-page hole) ·
  D-12 (the mockup's table language carried, its interaction model not, the filter with no baseline to
  transcribe from). None is reopened by this gate and `tasks.md` cites them as-is.
  **PLAN §8's FOUR GATE-2 QUESTIONS — RULED HERE so `tasks.md` inherits them settled.** *(These are plan
  §8's questions **Q1–Q4**, which are NOT the spec's `§8-1…§8-4` measure-then-choose items cited
  elsewhere in this entry — the two numberings collide and are kept apart deliberately.)*
  - **Q1 · Should a SNAPSHOT diff also name both sides? NO — leave snapshot diffs VERBATIM.** The spec
    requires the caption for **file-vs-file only** (§4), and that is the floor this milestone builds to.
    A snapshot's "before" is an earlier version of what is already on screen, so the direction is not in
    doubt; captioning it is scope the spec did not ask for. D-5 is unchanged: `compareWith` sets the
    caption on the **file** branch only, and today's snapshot behaviour is preserved byte-for-byte.
  - **Q2 · Does copy-out need a MENU, or two controls? TWO BUTTONS — minimum chrome, no menu.** CSV and
    Markdown are offered as two small controls. **This activates NO overlay row:** §3.11 rows 9 (the open
    overlay clears the chrome) and 21 (focus trap and restore) stay **`—`, not `D`**, and no popup, no
    focus trap and no §3.11 overlay/focus-trap work enters group 3. The "a table is not a data grid"
    principle (§6) is what this is decided on.
  - **Q3 · The badge's LANE (§3.11 row 7): UNCHANGED — produce, do not choose.** The rect
    is **measured at a task** in group 1 (a real rect probe, never assumed), and the lane is **chosen by
    the human later**, on the measurement. The measuring task remains **forbidden from choosing a value**
    (plan §7's standing rule).
  - **Q4 · The D-11 (iii) carried-hole TRIGGER: UNCHANGED — it stands as the plan names it, and it is a
    RECORDS act.** The next milestone that puts work on the app-page render path whose cheapness
    **cannot be argued mechanically** — anything that parses, sanitizes, reads layout or runs an engine
    there — **funds the first-paint harness before it ships that work.** M8 does not fund it (the
    2026-08-03 human ruling, already banked); this gate confirms the trigger so a future planner inherits
    a **condition** rather than a memory.
  **TWO SCOPE INSTRUCTIONS TO THE TASKS STAGE — banked here because they are the human's calls, not the
  drafting session's:**
  1. **The heaviest table-tools task MUST BE SPLIT.** The task that would carry the enhancer **plus**
     both app-page call sites **plus** §3.11's two **inverted** rows (4 and 5 — the toolbar is asserted
     INSIDE `.peekover-reader`, and "clearance" inverts to "containment") **plus** D-12's token
     verification against all three theme blocks **plus** D-12's four divergences is too large to review
     or to revert as one unit. `tasks.md` splits it. *(In the premature draft on disk this is task 3.2;
     the instruction attaches to the WORK, not to that number, which `tasks.md` is free to renumber.)*
  2. **The group-5 GIVE-WAY task MUST BE RE-SCOPED so its rollback path is EXPLICIT.** §8-1's escape
     hatch is *"the surface reach gives way, not the gate"* — and giving way is a **REMOVAL of the
     content-script reach followed by a RE-MEASUREMENT**, not an edit to a constant. `tasks.md` states
     that path in those terms rather than hiding it inside "set the constants", so a session that has to
     take it knows what it is taking. *(The premature draft's task 5.6.)*
  **WHAT THIS APPROVAL DOES NOT DO:** it reopens no spec §3.x decision, alters no plan D-value, changes
  no plan section (the plan is approved as it stands at `fa27333`), chooses **no** §8-1 value, no §8-2
  filter granularity, no §8-3 threshold and no §8-4 tuning — all four remain measure-then-choose at gate
  3 — and it **writes no `tasks.md`**. The gate-1 dispositions (§9-1 one milestone · §9-2
  presentation-only · §9-3 `.cursorrules` OUT · §9-4 both surfaces with §8-1 as the escape hatch · §9-5
  current-vs-picked · §9-6 discharged) are **preserved by silence**, per the plan's own rule that
  re-deciding a settled answer is a scope-reopen even when it agrees.
  **Revisit-when:** (a) `tasks.md` cannot decompose a group without reopening a D-value — that is a
  gate-2 event and returns here, never a quiet amendment; (b) §8-1's measurement cannot hold the gate and
  the surface reach gives way — the give-way is a **finding** reported with its number, and instruction 2
  above is what makes the path takeable; (c) a copy-out affordance later needs a menu after all, which
  re-activates §3.11 rows 9 and 21 and is a re-ruling of §8-2, not an implementation detail; (d) the
  D-11 (iii) trigger fires in a later milestone, which funds the app-page first-paint harness before that
  milestone's work ships.

- **2026-08-03 · M8 GATE 1 — spec 008 (persona-#1 QoL: compare-two-files · agent-file awareness · table
  tools) APPROVED, with ONE REDLINE. `plan.md` is the next artifact and the next gate.**
  `specs/008-persona-1-qol/spec.md`, drafted at `465a58a` against a scope-read of the tree at `81986d8`,
  was reviewed and approved. **The spec's status line stays "draft (Gear-3 gate 1 — awaiting human
  approval before `plan.md`)" and THIS ENTRY IS THE APPROVAL OF RECORD** — the in-milestone precedent
  from M7, stated in the 2026-07-28 M7 GATE 3 entry: gate approvals live in the bank, not in the
  artifact's status line (spec 007 still reads "draft" post-gate-1 `e09520f`; plan 007 still reads
  "draft — awaiting gate 2" post-gate-2 `cab93c7`). Nothing about this approval is inferable from the
  spec file alone, and that is by design — a context-loss session verifies M8's gate 1 here.
  **WHAT GATE 1 SETTLED — the six §9 questions, answered so `plan.md` inherits them closed:**
  - **§9-1 · The three items fit ONE milestone. NO SPLIT.** The narrower cut the draft offered (items 1
    and 3 now, item 2 after) is declined. The coherence is the **persona**, not the surface, and the
    scope-read's case holds: no dependency, no storage, no manifest event, one shared post-mount
    discipline, and item 2 already cut to size by §3.5.
  - **§9-2 · The §3.5 narrowing of "tuned rendering defaults" HOLDS — presentation-only.** The draft
    called this the single most consequential call at the gate; the narrow reading is taken. The literal
    reading (a per-document-class settings axis, or per-document parser options) stays priced as
    milestone-sized and deferral-breaking, and stays out. M8 is a QoL milestone, three items.
  - **§9-3 · `.cursorrules` is OUT.** It is named in the product bullet and is **unreachable behind a
    shared gate** — the exact shape 007 §3.4 rejected for `.mermaid`, with a manifest change on the
    `file://` half. It belongs to a milestone that reconsiders the non-markdown reader path, not to this
    one. §6's overturn price stands as written.
  - **§9-4 · §3.7 HOLDS — table tools (and the badge where it is free) ship on BOTH reader surfaces**,
    breaking the four-milestone byte-identical content-script streak deliberately, because the storage
    reason (006 §3.2) and the engine-byte reason (007 §3.2) do not apply to code that stores nothing and
    loads nothing, and because M7's close ruled that surface a **gap**. **BUT it is priced against the
    RE-MEASURED headroom, not the carried one — see the redline below** — with **§8-1 as the escape
    hatch, unchanged: the surface reach gives way before the gate does.** Gate 1 declined the
    app-page-only alternative rather than letting a measurement decide it silently. *(2026-08-03, after
    the measurement: it ran, and §3.7's surface reach — which is content-script reach — is now priced
    against **26.9 ms**, not against an owed number. The app-page half of that measurement has no
    instrument and is routed. See the redline's correction below.)*
  - **§9-5 · Compare is CURRENT-vs-PICKED (§3.2), not any-vs-any.** A diff is entered on the host showing
    a document; a literal any-vs-any is a comparison surface of its own and is not this milestone.
  - **§9-6 · The `docs/product/spec.md` <150 / <165 ms inconsistency was ALREADY CLOSED at `e09520f` —
    the spec's premise was stale, and the item is DISCHARGED, not routed onward.** *(Corrected
    2026-08-03, second gate-1 redline. This clause first read: "stays NOTED and is ROUTED ONWARD — not
    fixed by this gate and not by M8's plan. Raised twice now; it is a records act with its own home,
    and folding it into a QoL milestone is how it gets done badly a third time." That routing rested on
    the spec's claim that 007 §9-4's item "was not corrected".)* **It was corrected in that very
    commit:** `e09520f` (2026-07-27, 007's gate-1 approval) fixed both product-spec lines in the same
    commit as the approval — §8's first-render row to **`< 165 ms`** with a dated note below the table
    citing `decisions.md` 2026-07-26 and a revisit-when, and §7 principle 4 to **`<165ms`** with a dated
    note referencing §8's corrected row. Verified at HEAD: **no first-paint `<150 ms` claim remains** in
    `docs/product/spec.md`. Nothing is routed onward, and `docs/product/spec.md` is NOT edited by M8 —
    it is already correct.
  **THE ONE REDLINE — THE BINDING FIRST-PAINT HEADROOM IS *OWED*, NOT 1.8 ms; AND THE APP-CHUNK BASELINE
  IS 389,143 B, NOT 387,837 B.** The draft cited both as operative, binding figures and both are stale:
  - **1.8 ms → OWED, to be re-measured by `plan.md` on the current render path.** 8.1's worst-arm
    headroom describes a path the repo has TWICE marked superseded: `progress.md` § Baselines marks the
    three first-paint rows **"NOT re-run at 9.3"** and says why in its own words — **`662b90e` added a
    per-render `initialize()` inside the cache-miss branch after those numbers were taken**, so *"the
    re-measurement is OWED"* — and the inline-engine spike (`81986d8`) reads them the same way. The
    **CONSTRAINT is untouched and is not what the redline moves**: first paint remains M8's binding
    limit and §3.7's surface reach still gives way before the gate does (§8-1). What moves is the
    ORDER — **`plan.md` re-establishes the headroom on the current post-`662b90e` path, under 8.1's own
    protocol on a quiesced machine, BEFORE §3.7 is priced against it.** Pricing a both-surfaces decision
    against a number the repo has twice marked owed is the failure this redline exists to prevent.
    Applied at spec §3.7, §5, §7-1, §9-4, §9-6.
  - **★ CORRECTION, 2026-08-03 (same day, AFTER the measurement this redline ordered) — THE REDLINE'S
    INSTRUCTION WAS RIGHT AND IS NOW HALF-DISCHARGED; ITS *PREMISE* IS FALSIFIED. The clause above is
    kept VERBATIM and is not struck through** — it is banked history, it was acted on, and it is what
    produced the number below. A premise that turns out to be a hypothesis a measurement killed belongs
    in the record, not in a deletion.
    **What was right — re-measure before pricing.** It ran at HEAD `757f953`, quiesced, under 8.1's own
    protocol, and returned **worst-arm headroom 26.9 ms on the median (29.9 ms on the floor)**: arms
    **138.1 / 134.3 / 137.0 ms**, floors 135.1 / 132.6 / 134.7, **A-vs-A 3.8 ms / 2.5 ms** — an
    instrument that resolves, against 8.1's 10.9 / 13.4 ms which did not. **§3.7's CONTENT-SCRIPT half is
    unblocked and priceable at 26.9 ms**, and **revisit-when (a) did NOT fire.** Full record:
    `progress.md` § Baselines, *THE 2026-08-03 FIRST-PAINT RE-MEASUREMENT*.
    **What was wrong — the REASON.** The clause says 8.1's figure *"describes a path the repo has TWICE
    marked superseded"* because `662b90e` added a per-render `initialize()`. **`662b90e` moved app-chunk
    bytes ONLY** — content script **0 B**, both engines' md5s unchanged (`progress.md` § Baselines, the
    M7 ledger continuation) — and 007 §3.4's import fence asserts *structurally* that the content-script
    graph reaches neither `diagramEngine` nor `diagramEnhancer`. `perf-first-paint.ts` can drive **only**
    the content script. **So `662b90e` changed a path the 1.8 ms number never described, and 1.8 ms
    described a path `662b90e` never changed: 1.8 ms was MACHINE-STATE on a slower machine.** The control
    is **byte-identity** — same artifact, same md5s, floor 145.3 → 132.6 ms — corroborated by the 1 MB
    discriminator moving **−5.4%** the same direction. This is M6 retro finding 8's *"a moved floor is
    code"* met with its exception stated rather than assumed.
    **And the owed number was TWO, not one — the second is not takeable today.** The path `662b90e` DID
    change, the **app page**, has **no first-paint instrument in the repo**: all seven `perf-*` harnesses
    either drive the content script (`perf-first-paint.ts`), measure a different axis on `app.html`
    (`perf-diff` / `perf-snapshot-capture` / `perf-theme-flash` / `perf-watch`), or run in jsdom with no
    paint (`perf-toc` / `perf-folder-tree`); and the one programmatic seam — `__peekover.selectFile`,
    `entrypoints/app/main.ts:20` — is `import.meta.env.DEV`-guarded and **stripped from the production
    build a harness would have to measure**. **Whether M8 builds that harness or re-scopes §8-1's claim
    to what the content script can prove is a HUMAN call at the plan gate — ROUTED, not decided here.**
    **This correction reopens no §3.x decision and changes nothing M8 builds:** it corrects a reason and
    records a number. Applied at spec §3.7, §5, §7-1, §9-4 and at `progress.md`'s § Now pointer and
    § Baselines.
  - **387,837 B → 389,143 B (app-page chunk).** 387,837 is 8.1's figure at `4c580c4`; it moved at M7's
    two post-gate fixes (`662b90e` +1,251 B dark-mode diagram theming, `fc3a142` +55 B gantt date-axis),
    and 9.3's clean build at `94f7da5` reads **389,143 B** with the ledger continuation closing to a
    **0 B residual**. Re-derived from § Baselines at HEAD, not carried. Applied at spec §5.
  **WHAT THIS APPROVAL DOES NOT DO:** it reopens no §3.x decision, resolves no §7 plan-risk (those are
  the plan's, against actual code, in a fresh session per C14), routes nothing new to §8's gate-3
  measure-then-choose list, and writes no `plan.md` or `tasks.md`. §6's IS-NOT fence stands as drafted,
  including the content-script SURFACE milestone's evidence-backed deferral.
  **Revisit-when:** (a) the re-measured headroom comes back at or below zero — the gate cannot hold even
  before M8 spends it, and that is a §8-1 event AND a finding that outranks the milestone; (b) the plan
  finds an item needs a dependency or a manifest permission (§7-6 / §3.9 stop-and-flag), which would
  reopen §9-1's one-milestone answer; (c) a later measurement shows §3.5's presentation-only narrowing
  cannot deliver a tuning anyone notices, which would send §9-2 back to a human rather than let the
  literal reading arrive by drift.

- **2026-08-01 · M7 D-8 DIAGRAM-CACHE `count` CHOSEN = 150 ROWS (spec 007 task 8.4, the HUMAN decision
  gate).** Raised from the **100** placeholder 4.1 proposed. Sets `PROPOSED_DIAGRAM_COUNT`
  (`src/app/diagramCache.ts:95`, and through it `PROPOSED_BOUNDS.count` at `:120`). **8.4 records; 8.5
  edits the constant. No constant is touched by this entry.**
  **The measurement that justifies it — `progress.md` § Baselines *THE D-8 / D-9 BOUNDS MEASUREMENT*
  (task 8.2), CELL 3 and CELL 4b.** CELL 3 measured, on the real IDB store and **identically on both
  engines**, that the eviction cliff is **TOTAL, not graded**: at N=50 diagrams (100 rows — the cap
  exactly) a theme flip-back is a **full HIT**; at N=51 (102 rows) it is a **full MISS of all 51**,
  because on the flip back the A-theme rows are globally oldest, so the first miss's write-back evicts
  the next row the same pass is about to ask for — a self-defeating cascade. The arithmetic predicted
  **2** re-renders; the measurement is **51**. One row over the bound therefore does not cost one
  re-render — **it costs the entire cache's value for that document**, and it costs it on exactly the
  diagram-heavy document the cache exists for. That discontinuity, not a smooth cost curve, is what this
  value is choosing the position of.
  **Why 150, and not another step.** CELL 4b's sweep over the shipped planner gives the rule **full hit
  iff `count ≥ 2N`, full miss otherwise — every cell in the grid is either 0 or N, with no
  partial-credit region anywhere**. So the bound's only real content is *where the cliff sits*. At 150
  the cliff moves to **N = 75**, which clears CELL 5's **heavy** session shape (8 diagrams/document) and
  §8's own **50-diagram** target case with headroom. It stays **below ~200**, where CELL 4d's crossover
  would begin moving the binding axis onto bytes: at count 200 the crossover is `8,388,608 / 200` =
  **41,943 B/row**, which is *below* CELL 1's measured all-kinds mean of **42,350 B**, so a
  representative cache would start binding on bytes instead. And the curve is a **staircase whose steps
  are at 2N, not a smooth trade** (CELL 4b's own words), so **125 and 150 buy the same hit coverage over
  the cases that matter** — every N ≤ 50 is a full hit at both — while **150 clears the 2×50 = 100 cliff
  decisively**. *(Exact grid reading, recorded so nobody re-derives it wrong: among CELL 4b's sampled N,
  the count-125 and count-150 rows differ only at **N = 75**, which 150 covers and 125 does not.)*
  **`count` remains the SOLE BINDING AXIS** — CELL 5's per-axis answer (`count` binds in every session
  shape measured; `totalBytes` never does; `maxAgeMs` cannot bind inside a session) is unchanged by
  raising it to 150, and the next two entries depend on that.
  **Revisit-when:** (a) a **third effective theme** lands (sepia is deferred, `decisions.md`
  2026-07-17/D-1) — a document would then occupy **3** rows per diagram and the cliff would fall back to
  **N = 50**, which is the §8 target case itself, so this value must be re-chosen in the same change;
  (b) real documents routinely exceed **75** diagrams and a flip-back reads as a stall; (c) `count`
  stops being the binding axis in a re-run of CELL 5 (D-8's standing revisit-when: an axis that never
  binds is chosen wrong); (d) the eviction algorithm stops being oldest-first-global (D-4), which is
  what makes the cliff total.

- **2026-08-01 · M7 D-8 DIAGRAM-CACHE `totalBytes` CHOSEN = 8 MiB — UNCHANGED from the placeholder, and
  recorded anyway (spec 007 task 8.4, the HUMAN decision gate).** Sets
  `PROPOSED_DIAGRAM_TOTAL_BYTES` (`src/app/diagramCache.ts:106`, `8 * 1024 * 1024` = 8,388,608 B; and
  `PROPOSED_BOUNDS.totalBytes` at `:120`). A no-op edit for 8.5 — **recorded either way, because a
  "PROPOSED" comment left on a chosen value is a lie about the decision state** (§8.5's own words).
  **The measurement that justifies it — 8.2's CELL 4c, CELL 4d and CELL 5.** CELL 5's per-axis answer is
  that `totalBytes` **NEVER BINDS at the placeholders**: it saturates at **~51% of the cap** (~4.18–4.45
  MB across both the typical 2-diagram and heavy 8-diagram session shapes) and stops, because `count`
  caps the row population first. CELL 4d states the crossover as exact arithmetic — **bytes binds before
  count iff mean row bytes > `totalBytes / count`** — and at the **chosen** count of 150 that threshold
  is `8,388,608 / 150` = **55,924 B/row**. CELL 1's measured distribution puts that **above the
  all-kinds mean (42,350 B)** and above every measured *small* diagram (4,317–28,030 B), but **below
  three of the seven measured LARGE diagrams** (Cr: ER 135,513 · flowchart 109,768 · state 84,590). So
  after decision 1 the byte axis is reachable **only by a cache filled predominantly with the large end
  of the distribution** — which is precisely the case it exists for.
  **★ THE PURPOSE, recorded explicitly because 8.2 left two readings open and this entry picks one.**
  8.2 asked whether never-binding makes 8 MiB *wrong*, or *correctly a safety valve that should rarely
  fire*, and refused to decide. **This entry chooses READING B: `totalBytes` is a SAFETY VALVE, not a
  capacity limit.** `count` is the capacity limit (decision 1). The valve fires only for a cache
  dominated by large diagrams — the one shape `count` alone cannot bound, because CELL 1 measured a
  **31× span** in rendered-SVG size across kinds, so the byte cost of 150 rows is not predictable from
  the row count at all.
  **★ CAVEAT — "never binds in normal use" is the DESIGN INTENT here, not a defect, and D-8's
  revisit-when is therefore NOT tripped by it.** D-8 carries the standing rule *an axis that never binds
  is chosen wrong*; that rule aims at a **capacity** axis, and this axis is deliberately not one. A
  valve that fires in normal use would be the defect. CELL 5 also measured **0 single-oversized
  refusals** in both shapes — no measured diagram approaches the 8 MiB whole-write refusal — so the cap
  is not silently degrading anything today.
  **Revisit-when:** (a) the valve fires in a **typical** session (it is then a capacity bound in
  disguise, and both it and `count` need re-choosing together); (b) a single rendered diagram approaches
  8 MiB, making the whole-write refusal reachable — CELL 1's largest measured is 135,513 B, a ~62×
  margin; (c) `count` is raised past ~200, where CELL 4d says the axes swap and this stops being a valve
  by arithmetic rather than by choice; (d) the stored payload stops being sanitized SVG text.

- **2026-08-01 · M7 D-8 DIAGRAM-CACHE `maxAgeMs` CHOSEN = 30 DAYS — a RETENTION JUDGMENT, recorded AS a
  judgment and NOT as a measured value (spec 007 task 8.4, the HUMAN decision gate).** Unchanged from
  the placeholder. Sets `PROPOSED_DIAGRAM_MAX_AGE_MS` (`src/app/diagramCache.ts:117`,
  `30*24*60*60*1000` = 2,592,000,000 ms; and `PROPOSED_BOUNDS.maxAgeMs` at `:120`).
  **★ WHAT THE MEASUREMENT DOES AND DOES NOT SUPPORT — the honest half of this entry.** 8.2's CELL 5
  proved the axis **FIRES and DOES NOT FIRE** rather than asserting it: a row at `lastUsed = 0` planned
  against `now = cap+1` evicts `["old"]`; the same row against `now = 1` evicts `[]`. That is the whole
  of the evidence. CELL 5 also recorded **why no value can come out of it** — `maxAgeMs` **cannot bind
  inside a session; it is a calendar property**. So 8.2 measured that the axis works, and measured
  **nothing whatsoever about what the number should be**. This entry does not pretend otherwise.
  **★ AND IT WILL NOT BECOME MEASURED LATER.** The missing input is a **distribution of real re-read
  intervals** — how long a user actually goes between opening the same document. Collecting that means
  telemetry, which **AGENTS.md non-negotiable #2 forbids outright, forever** ("No telemetry, no
  analytics, no remote code, ever. Not even error reporting."). So this is not a placeholder awaiting a
  future measurement; it is a **policy judgment that is permanently a judgment**, and a later session
  should not go looking for the number.
  **The judgment.** 30 days reclaims rows for diagrams unviewed for a month. Its two properties are what
  it was chosen for: an **actively-read document never loses its cache** (the axis is on `lastUsed`, not
  on write time — note this differs from M6's snapshot `SNAPSHOT_MAX_AGE_MS`, which is measured from the
  snapshot timestamp, per `decisions.md` 2026-07-26), and an **abandoned document does not accumulate**.
  30 days covers the common project cadences (weekly / biweekly / monthly) the M6 D-8 entry weighed 7
  and 90 days against, and this reuses that reasoning rather than re-deriving it. It is also the axis
  that lets a `mermaid` version bump's stranded rows expire **without a purge-on-upgrade write** (plan
  §7's open question, and `diagramCache.ts:111-115`'s own note).
  **Revisit-when:** (a) a user reports losing diagram cache on a document they still consider active
  (the `lastUsed` semantics are then wrong, not the number); (b) the valve is observed **never**
  reclaiming anything over a full milestone's real use; (c) a non-telemetry source of re-read cadence
  becomes available — a user volunteering their own local observation is the only shape AGENTS.md #2
  permits; (d) `mermaid` version churn makes stranded-row expiry the axis's dominant job, which would
  make the engine's release cadence the right input instead of the reading cadence.

- **2026-08-01 · M7 D-9 TYPICAL-CASE TARGET CHOSEN = 165 ms MEDIAN, COLD, PER-DIAGRAM-AMORTIZED, with
  the CHROMIUM FLOOR as the check arm — ASPIRATIONAL, and NOTHING ENFORCES IT (spec 007 task 8.4, the
  HUMAN decision gate).** **★ MAPS TO NO CONSTANT.** D-9 is **not a cap** — it is the typical-case (1–3
  diagram) time-to-rendered **target** (8.2's table row for D-9 reads *"none — no constant exists yet"*),
  and 8.5 creates none: §8.5's Files are `src/app/diagramCache.ts` + `src/app/diagramCache.test.ts` and
  its body is explicit that **only constants move**. This entry IS the record of the target.
  **The measurement that justifies it — 8.2's CELL 6 and its 50-diagram outer-bounds table.** The target
  is set on the axis CELL 6 actually measured: **cold, per-diagram-amortized cost of ~15–17 ms/diagram**
  (Chromium 14.1 → 15.8 → 15.7 → 16.8 across N = 1/3/10/50; Firefox 16 → 15.3 → 17.1 → 22.0), with the
  typical case itself at **N=3 cold all-resolved median 47.5 ms (Cr) / 46 ms (Fx)** and N=1 at **14.1 /
  16 ms**. The 50-diagram case — far outside the typical case — first-opens at **840.5 ms (Cr) / 1099 ms
  (Fx)** median against §8's inherited **≤ 5 s** bound, ~4.5× headroom. **165 ms therefore carries
  generous headroom** over everything measured on this axis, which is deliberate: the target is a
  discipline signal, not a tight fit. The **Chromium floor** is named as the check arm because CELL 6's
  floors are the least machine-contaminated reading, and 8.2's A-B-A control resolved the run (drift
  **+3.0% Cr / −0.6% Fx** against 4–6× effects). *(Not to be confused with M6's separate **165 ms
  first-paint** gate, `decisions.md` 2026-07-26 — same number, different surface and different axis.
  The coincidence is not a relationship.)*
  **★ CAVEAT 1 — IT EXCLUDES THE ONE-OFF `import('mermaid')`, so it is NOT user-facing first-open
  time.** CELL 6 **pre-warmed the engine and discarded that cost on purpose** ("or it would land
  entirely in the N=1 arm"). What 165 ms bounds is therefore **per-diagram render cost once the engine
  is loaded**. The number a user actually experiences on a cold first open — engine import *plus*
  render — is **measured NOWHERE in this milestone**, and this target does not speak to it.
  **★ CAVEAT 2 — IT IS A COMMITMENT, NOT A GATE. NOTHING ENFORCES IT.** 8.5's Files carry **no timing
  assertion**, by design: 5.2's rule is that a committed time bound would both flake and smuggle in the
  threshold 8.4 owns. So no test reds if this target is missed, and no future session should read the
  number as if one would.
  **★ CAVEAT 3 — recorded as ASPIRATIONAL, with both of the above explicit** rather than as a
  satisfied-looking figure. A later reader must be able to see, from this entry alone, that the target
  is un-enforced and that the user-facing first-open quantity is unmeasured.
  **Revisit-when:** (a) an instrument exists that can time **document-open → first diagram rendered
  including the engine import** — the target should then be restated on that axis, because that is the
  quantity that matters to a user; (b) the target becomes a **gate** (it then needs an enforcement
  mechanism and a flake analysis, neither of which exists today); (c) CELL 6's amortized cost moves
  materially on either engine — Firefox's **+38% drift across N**, all of it in the last leg, is the arm
  to watch; (d) the enhancer stops being sequential, which is what makes time-to-first-diagram flat
  (~14–18 ms cold at every N) and independent of this target.

- **2026-08-01 · M7 D-10 PACKAGE-SIZE DISPOSITION = (b) NARROW THE `mermaid/package.json` INLINE
  (~3,818 B recoverable). (c) DEFERRED, (d) WITHDRAWN AS INERT (spec 007 task 8.4, the HUMAN decision
  gate).** **★ MAPS TO NO CONSTANT, and IS NOT IMPLEMENTED HERE** — see the placement note below.
  **The measurement that justifies it — `progress.md` § Baselines, task 8.1's re-baseline.** Against the
  `< 2 MB` store bound the zips are **1,299,871 B (Cr) / 1,299,930 B (Fx) — PASS**, but with **0.70 MB
  of headroom where M6 had 1.65 MB: 58% of M6's margin consumed by this one milestone**. That is the
  whole case for acting now rather than at close: the bound is not breached, the *trend* is. 8.1's
  second ablation gives (b) its number — stubbing the static `import pkg from 'mermaid/package.json'`
  moves the app chunk **387,837 → 384,019 B, −3,818 B**. **(b) is the cheap, contained win**: a Vite
  `define` narrowing the inline to the one field `engineVersion()` needs, with no complexity cost and no
  effect on mermaid's lazy graph.
  **★ THE CORRECTION THIS ENTRY RECORDS — option (d) IS INERT AGAINST THE BOUND IT WAS PROPOSED FOR.**
  (d) was "a stricter lazy-load boundary". A stricter boundary reduces bytes **LOADED**, not bytes
  **SHIPPED**, and the `< 2 MB` bound is on the **packaged zip**. 8.1 already measured the loaded-bytes
  quantity at **0 on the content script** — byte- and md5-identical on both engines with mermaid ablated
  away, and 3.4's static import fence green **8/8** confirming `mermaid` / `diagramEngine` /
  `diagramEnhancer` are on the app-page graph only. There is nothing left for (d) to move. **So (d)
  collapses into (c)** — the only way to ship fewer bytes is to *package* fewer bytes — and is withdrawn
  as a distinct option rather than left on the list looking available.
  **(c) — a mermaid SUBSET BUILD — is DEFERRED, not rejected.** It recovers materially more than (b)
  (mermaid emits **99 chunks / 3,347,306 B** behind one `import()`), but it costs real complexity and
  **risks mermaid's lazy chunk graph**, which §3.2's whole content-script fence depends on. Deferred
  **until headroom forces it**, which is a condition, not a hope — see revisit-when.
  **★ PLACEMENT — (b) IS A DISPOSITION TAKEN HERE, NOT WORK DONE HERE, AND §8.5 DOES NOT OWN IT.**
  §8.5's Files are `src/app/diagramCache.ts` · `src/app/diagramCache.test.ts` and its body says **"The
  ALGORITHM does not move — only constants"**; narrowing the inline touches neither file and is not a
  constant. So the narrowing is **NEW CARRIED WORK**, banked in `progress.md` § Carried items with this
  entry as its reasoning. It is deliberately **not** added to `specs/007-mermaid-diagrams/tasks.md`:
  8.4's Files list is `docs/ai/decisions.md` alone, and §9.1 is this milestone's stated mechanism for
  adding a task ("a real finding → a task added below this line, not a silent fix").
  **Revisit-when:** (a) zip headroom falls below ~0.5 MB, or any further dependency lands — **(c) is
  then forced and (b) is no longer sufficient**; (b) the `< 2 MB` figure changes (it is a store limit, not
  ours); (c) `engineVersion()` stops sourcing from the static `mermaid/package.json` import (the D-3/D-13
  amendment, 2026-07-28) — the (b) line item disappears with it; (d) mermaid's own packaging changes
  shape, which would re-open (c)'s risk assessment from scratch.

- **2026-08-01 · M7 THEME-FLIP COST ACCEPTED — NO PROGRESSIVE RE-RENDER BUILT; plan §1.3 STAYS QUEUED.
  ★ THE ACCEPTANCE IS CONTINGENT ON `count ≥ 150` (spec 007 task 8.4; this DISCHARGES gate-2 (d)'s
  routing).** **★ MAPS TO NO CONSTANT** — it is a routing decision about work *not* done.
  **The measurement that justifies it — task 5.2's flip-cost record (`progress.md` § Up next / § Now)
  read together with 8.2's CELL 3/4b and decision 1 above.** 5.2 measured, at 50 diagrams, the **worst
  case** — the first flip to a never-rendered theme, a full miss on every diagram — at **Chromium floor
  522.3 / median 538.9 ms** and **Firefox floor 900.0 / median 910.0 ms**, A-B-A bracketed against a
  same-session cold-render control agreeing to −2.4% / −0.4%. The **flip back is a full hit at roughly a
  fifth of that (~110 ms)**, the cost is **the ENGINE (~77% of the window)** and not the cache
  write-through (~1.5% / 0.2%), and there is **no flicker at 50**.
  **Why that is acceptable — and the acceptance is entirely a consequence of decision 1.** At
  `count = 150`, CELL 4b's `count ≥ 2N` rule makes the flip-back a **full HIT for any document up to 75
  diagrams**. So in every realistic case the user experiences the **~110 ms hit-flip**, not the ~540 /
  ~910 ms miss. The miss is a **one-time, per-theme, per-document first flip** — paid once when a
  document is first read in a theme it has never been read in, and never again while the rows live.
  Building plan §1.3's **progressive visible-first re-render** to smooth a one-time first flip that is
  already flicker-free would be new chrome added at a gate, which is the exact shape this project's gate
  discipline exists to prevent. **§1.3 stays a gate-3 revisit-when — QUEUED, NOT BUILT.**
  **★ THE CONTINGENCY, named because the acceptance is not free-standing: if `count` is ever lowered
  below 2×(typical heavy N), THIS ACCEPTANCE IS VOID and plan §1.3 must be revisited in the same
  change.** Decision 1's own revisit-when (a) is the live instance of this: a third effective theme
  makes a document occupy 3 rows/diagram and drops the full-hit boundary to N=50 without `count` moving
  at all. The acceptance is a statement about the **hit boundary**, not about the flip.
  **Revisit-when:** (a) `count` drops below 2×(typical heavy N) by any route, including a third theme —
  **void, re-decide**; (b) 9.1's walk reads the first flip as broken at 10 or 50 diagrams (a real
  finding → a task, not a silent fix); (c) the engine's share of the window (~77%) falls enough that the
  cache write-through starts to matter, which would change what §1.3 would even be optimising; (d)
  Firefox's ~1.7× flip factor widens materially.

- **2026-07-30 · M7 D-6 WINDOW FINDING — a RELATIVE (same-origin) reference PASSES the §4 source guard, reaches
  the engine, and FETCHES in D-6's measurement window. In production that resolves to `chrome-extension://<id>/…`,
  which is PACKAGE-LOCAL and not §4-remote, so the behaviour is ACCEPTED and the guard is deliberately NOT
  widened. What changes is the CLAIM: the window issues no OFF-ORIGIN request for guard-passing source. DECIDED.**
  **The finding.** A diagram source carrying a relative reference — `A@{ img: "./x.png" }`, `A@{ img: "/x.png" }`,
  sequence `properties A: {"icon": "./x.png"}` — makes `hasRemoteReference` return **false** and therefore reaches
  `engine.render`, which fetches it inside D-6's live measurement window. Reproduced through the PRODUCTION path
  (`createReaderPane` → `select()` → `mount()` → `enhanceDiagrams` → the real `import('mermaid')`, nothing
  injected) on **both engines**: all three sources pass the guard AND put the resolved URL on the wire inside the
  bracketed window. The two `img:` variants then degrade (`decode()` rejects — ROUTE 1's signature), while
  **`properties.icon` RENDERS SUCCESSFULLY while fetching** — one adopted `<svg>`, state `rendered` — which is
  `eae7b08`'s ROUTE 2 signature exactly, reached with a URL the guard is not scoped to catch. So the plan's
  standing claim, *"the window issues no network for guard-passing source"*, is **FALSE as written**.
  **This is the deliberate COMPLEMENT of `4061398`'s scoping, not a contradiction of it.** That closure scoped the
  predicate to §4-**REMOTE** references (`\bhttps?:` plus a `//`-at-value-position arm) precisely because §4
  forbids referencing a *remote resource* (`spec.md:197`). A relative reference is not remote. The guard is
  **CORRECT and UNCHANGED**; `src/render/*` is byte-untouched by this bank.
  **★ THE SEVERITY BOUND — A DERIVATION, NOT A MEASUREMENT, and it is recorded as one on purpose.** A relative
  reference can only reach an ARBITRARY host via `//` or a contiguous `https?:` — and the guard catches **both**.
  Measured predicate boundary (both engines): TRUE for `//host`, `http://host`, `https://host`, and the
  tab/CR-obfuscated forms that still carry slashes (`h\tttp://host` — the `//` arm fires); FALSE for the
  tab/LF-obfuscated forms WITHOUT slashes and for the relative forms. The tab-no-slash case is the interesting
  one and it was resolved, not assumed: the WHATWG parser strips the tab, leaving `http:host.example/x`, which —
  matching the base scheme with no authority — resolves as a **same-origin PATH**, observed as
  `http://<base>/host.example/x` on both engines (`host.example` becomes a path segment, not a host). Same result
  from `new URL(ref, document.baseURI)` and from a real `img.src` assignment. **So guard-passing ⇒ same-origin.**
  In PRODUCTION the page origin is `chrome-extension://<id>/app.html`, so a guard-passing reference resolves to
  `chrome-extension://<id>/…` — package-local, excluded by the `/^https?:/i` wire predicate **by scheme**, exactly
  as our own lazy module chunk is. **NOTHING LEAVES THE MACHINE.** ★ But the production half of that is
  **REASONED FROM THE EXTENSION ORIGIN, NOT OBSERVED**: the probe's base is `http://localhost:PORT`, so what the
  probe actually sees is a `localhost` request. Stated as a derivation so that if the base origin ever changes
  — packaging, a different host document, an iframed surface — someone re-derives it instead of inheriting a
  conclusion. **This is NOT an AGENTS.md #1 breach; it is a live finding about the window's true property.**
  **★ THE ACCEPTED BEHAVIOUR, named as behaviour rather than as an absence.** Relative/same-origin references
  **DO reach the engine** and **DO cause a PACKAGE-LOCAL request** inside D-6's window. That is accepted. They
  are not §4-remote, and degrading them would deny a legitimate local-authoring pattern — a relative image in a
  local markdown file — at **no §4 benefit whatsoever**. The guard is therefore deliberately not widened to
  relative references. (Contrast the rejected widening to "any URL-ish reference": it would over-degrade a
  package-local feature AND reintroduce the spelling-completeness problem that scoping to §4-remote is what
  escaped. The same shape as `4061398`'s own accepted cost — `click … href` degrading without fetching — banked
  as a cost with a reason, not discovered later as a surprise.)
  **THE SHARPENED CLAIM 3.3 will ship:** *the window issues NO OFF-ORIGIN request for guard-passing source.*
  It is provable, it is §4-aligned ("remote" = off-origin here), and it is **STRONGER than the benign-fixture
  claim** it replaces, because it holds over adversarial source rather than over a hand-picked clean diagram.
  **★ And the engine-emitted same-origin request IS 3.3's control.** The `properties.icon` relative case
  (`icon-rel`) is a better positive control than the injected `createElementNS` seam that was to succeed
  CONTROL A: the **ENGINE** puts it on the wire, inside the window, from AUTHOR SOURCE that no sanitizer has
  touched — which is D-6's named residual hole *exactly*. The injected seam only ever proved the instrument's
  floor; this proves the instrument sees the real mechanism. It is also immune to the Firefox inert-parse gotcha
  by the same construction as CONTROL A (the URL exists only in fence TEXT read via `textContent`).
  **★ THE PATTERN, banked for the M7 retro — this is the FOURTH time.** The plan's stated control/claim for this
  one measurement was wrong at every single step: (1) D-6 named the remote-image reference as the control → recon
  found it a **live defect**; (2) `4061398` named `properties.icon` as 3.3's successor control → the source guard
  **closed it**; (3) the injected `createElementNS` seam was named the successor → this probe found a **real
  engine-emitted control** that is strictly better; (4) *"the window is request-free"* → **false**, the true
  claim is *"no OFF-ORIGIN request"*. Same species each time: **the plan named a property, and BUILDING + RUNNING
  the measurement revealed the property was scoped wrong.** The control-fires discipline did not merely prevent
  vacuous green — it **rewrote the claim toward truth four times**. Group 9's retro names this.
  **Cited by:** 3.3's zero-network guard (ships the sharpened claim and the engine-emitted same-origin control).
  **Revisit-when:** the extension base origin changes (the severity bound needs re-derivation, and it is a
  derivation precisely so this trigger is actionable); OR a future mermaid adds a fetch reachable from
  guard-passing source that resolves OFF-origin — which would make the predicate holed rather than scoped, a
  different and much worse finding.

- **2026-07-30 · M7 §4 REMOTE-REFERENCE CLOSURE — the enhancer PRE-SCANS the fence source for any remote
  reference and does not render a fence that carries one. A SPELLING-INDEPENDENT whole-source predicate
  (option 1), chosen over an enumerated per-keyword fix, because enumeration under-scoped this surface
  TWICE this milestone. DECIDED; implementation lands as its own commit.**
  **The defect.** §4 requires that the system *"render no diagram content that references a remote resource,
  whether the reference originates in the diagram source or in the engine's output"* (`spec.md:197`). Two
  AUTHOR-REACHABLE routes put `http(s)` on the wire from the diagram SOURCE, during D-6's live measurement
  window — before `sanitizeSvg` ever runs — and both fire on both engines:
  (1) flowchart `A@{ img: "URL" }` (four spellings: double-quoted, single-quoted, unquoted, multiline) fetches
  via `imageSquare` and then THROWS (`decode()` rejects), so the fence degrades — the failure LOOKS like a
  bad diagram, not a leak. `imageSquare` carries **TWO independent fetch mechanisms** — a bare
  `new Image()` (`chunk-ZGVPDNZ5.mjs:2500`) AND a live `append("image")` with the URL as `href` (`:2539`) —
  so even a targeted "remove the `new Image()`" would not have closed this single route.
  (2) sequenceDiagram `properties A: {"icon": "URL"}` fetches via `drawImage`'s live `<image xlink:href>` and
  **RENDERS SUCCESSFULLY**, URL and all, into the returned SVG. This is the nastier of the two: a
  normal-looking diagram paints while the request has already gone out.
  **Why it was symptomless.** The SVG profile denies `image` by absence, so the ADOPTED ARTIFACT is clean in
  both cases — the artifact half of §4 held, and held silently. The WIRE half did not. A DOM-shape assertion
  over the adopted tree reads green here by construction; only a request-level guard on a real engine sees it.
  **Confirmed CLEAN by grammar or by absence** (recorded so a future reader does not re-hunt them, and so it
  is clear these are NOT what this closure fixes): `classDef`/`style` with `background-image:url()` (parse
  error), `icons`/icon shorthand (no packs registered, `diagramEngine.ts:34-36`), `@{ img: }` outside
  flowchart (parse error), C4 `$sprite` (hardcoded `data:` constant), and `click … href` / sequence `link`
  (the URL reaches the SVG but an `<a>` does not LOAD, and the profile strips `a` anyway).
  **Found by 3.3's guard, and that is the point.** The control-fires discipline caught the plan's OWN
  designated control — the remote-image reference D-6's residual-hole clause said *"stays as written"*
  (`plan.md:86`, row 22 at `:270`) — as a LIVE DEFECT rather than a passing negative. **Same species as
  `16c7790`:** the risk class was named correctly and the control was then scoped too narrowly to the one
  spelling the author had in mind. The recon then found the SURFACE IS LARGER than the instance 3.3 surfaced
  (two routes, four spellings, three fetch mechanisms) — the second under-scoping of the same class in one
  milestone, which is the whole reason the closure below is deliberately not a list.
  **No engine knob closes it, and post-render is too late.** `securityLevel: 'strict'` does NOT stop either
  route: `img:` and `properties` are diagram SOURCE, not `%%{init}%%` directive keys, so `config.sanitize()`'s
  `secure` list — which D-6 hardened in `16c7790` — never sees them. Both fetches happen INSIDE `render()`, so
  any post-render inspection observes an already-issued request. **The only available point is UPSTREAM of the
  engine:** `diagramEnhancer.ts`, between `diagramSourceOf(pair.pre)` and `engine.render`.
  **The closure (option 1).** Pre-scan the fence SOURCE for any remote reference — `http(s):` and the
  protocol-relative `//` — and do not render a fence that carries one: it degrades to its visible source
  fence per §3.8, the path 3.2 already built. The source is READ, never rewritten, so **D-15's
  read-only-source invariant holds**. The predicate is over the source TEXT, not over a keyword list, and
  that is the load-bearing property: **it is surface-complete by construction** — it does not care which
  keyword or diagram type carries the URL, so a future mermaid shape cannot silently fall out of scope.
  Option 2 (enumerate `img:` + `properties.icon`) was rejected as the `16c7790` species repeating a third
  time; option 3 (strip the URL in-source) was rejected because it breaks the read-only-source invariant.
  **Footprint: the enhancer's source-read only.** It does NOT touch D-6's config, the profile, or the
  adoption path.
  **★ ACCEPTED COST, banked deliberately and not incidentally.** Fences carrying a NON-FETCHING remote
  reference — `click A href "https://…"`, sequence `link` — ALSO degrade under this predicate. This is
  accepted as **§4-LITERAL alignment**: §4 forbids diagram content that *references* a remote resource in the
  diagram source, independent of whether that reference happens to fetch in this engine version. Making the
  predicate depend on current fetch behaviour would re-create exactly the version-coupled narrowness this
  decision exists to remove. The supported path for an external link is a normal markdown link OUTSIDE the
  fence, which travels the reader's own governed link path. A future reader who wants clickable diagram links
  is looking at §3.11 (interactivity, declined) as well as this line, not at this line alone.
  **Both halves of §4 are now closed:** the ARTIFACT half by the profile's `image` denial, the WIRE half by
  this pre-scan. **Note for the implementation commit:** `sanitize.ts:187`'s justification for that denial —
  *"`image` — no producer"* — is now FACTUALLY WRONG; two producers exist (`imageSquare`'s `append("image")`,
  `drawImage`'s `<image xlink:href>`). The denial is CORRECT and stays; its stated reason must change from
  "no producer" to "producers exist and are refused". **That correction lands in the implementation commit,
  not here** — `src/render/*` is byte-untouched by this bank.
  **Cited by:** the source-guard implementation commit (which cites this entry); 3.3's zero-network guard,
  whose §4 claim becomes TRUE for adversarial source once the guard lands. **3.3's control succession:** this
  closure stops CONTROL A (the `img:` remote-image reference) from firing by design, so 3.3's control becomes
  the sequence `properties.icon` route — the sharper instrument anyway, because it RENDERS rather than throws
  and therefore proves the wire claim without a degradation confound. **Revisit-when:** a future mermaid adds
  a URL-bearing shape or a new fetch site — re-run the recon's surface hunt against the new version WITH 3.3's
  guard in place, since the guard is now the instrument that finds them.

- **2026-07-28 · M7 D-1/D-6 ADDENDUM — the SVG profile ADMITS `<style>` (option B), with a CSS-sanitization
  pass guaranteeing the adopted artifact carries no external reference. Discharges ff8f323's first downstream
  finding.** 2.1 denied `<style>` by absence; the group-3 investigation proved that STRIPS legibility
  (flowchart/state/gantt render as black silhouettes — 100% of their paint is CSS) AND makes §4's theme-sync
  unobservable (light-vs-dark byte-identical), §3.6's theme cache-key inert, §3.7's re-render pointless.
  Option B admits `<style>` for FIDELITY and preserves §3.6/§3.7/§4/D-7 unchanged (the theme rides in the
  `<style>`, so a flip re-renders and the cache key is meaningful — B needs NO §3.x amendment, unlike A).
  **The security cost, scoped by REPRODUCTION (this session — real dompurify 3.4.12, `style` appended to a
  SCRATCH copy of `SANITIZE_SVG_CONFIG`; `sanitize.ts` byte-untouched):** DOMPurify has no CSS parser, so with
  `<style>` admitted the ENTIRE stylesheet survives VERBATIM — **21/21** `url()`-bearing declarations passed
  through, both `@import` forms (`@import url(…)` and the bare-string `@import "…"`), `@font-face`'s `src`,
  and `url()` nested inside `@media`/`@supports`. The unmodified profile is the control that fires: it drops
  the element AND its text entirely (`<style>` present: false, `@import` present: false).
  **The CSS pass must STRIP: any `url(` token whose target is not a `#`-fragment, WHEREVER it appears — the
  coverage is TOKEN-scoped, not property-scoped, and that is the reproduction's main correction to the
  recon's prose.** The enumerated property set is the evidence that a property list is the WRONG shape,
  because the set is open-ended: `background-image`, `background`, `border-image-source`, `border-image`,
  `list-style-image`, `content`, `cursor`, `shape-outside`, `-webkit-mask-image`, `mask-image`, `mask`,
  `mask-border-source`, `fill`, `stroke`, `filter`, `clip-path`, `marker-end` (with its `marker-start` /
  `marker-mid` siblings), `offset-path`, and `src` inside `@font-face` — **19 property spellings tested, all
  19 passed verbatim** — plus the `url()`-WRAPPING functional forms `image-set(url(…))` and
  `cross-fade(url(…))`. A pass that allow-lists properties is one CSS release behind by construction.
  **Four obfuscation lanes also survived and are therefore in scope:** the CSS escape `u\72 l(` — **which a
  naive `/url\(/` regex MISSES, the single most load-bearing detail here** — case (`URL(`), interior
  whitespace (`url(  …  )`), and quoting (`url("…")` / `url('…')`); `url(data:…)` and the protocol-relative
  `url(//host/…)` likewise survive and are likewise external. Plus `@import`, both forms.
  **It must PRESERVE:** internal `url(#fragment)` references, unquoted and quoted with either quote character
  (mirroring `SVG_ALLOWED_URI_REGEXP`'s `#`-only principle — all four internal forms survived the probe
  intact, as did the `fill="url(#gradA)"` attribute the profile already gates); **and `@keyframes`, which
  GATE B settles empirically: mermaid DOES emit them.** A real render (mermaid 11.16.0, real headless
  Chromium, D-6's config verbatim, loopback-served, 6 diagram types) finds `@keyframes edge-animation-frame`
  and `@keyframes dash` in EVERY type's `<style>`, unconditionally — they sit in `getStyles`' own template
  (`chunk-WYO6CB5R.mjs:5271`), and `compileCSS`'s at-rule allow-list (`mermaid.core.mjs:1146-1184`) retains
  `KEYFRAMES` with the comment *"needed for Mermaid's animation feature"* while turning every other at-rule
  into a COMMENT. **So "strip all at-rules" is UNSAFE** — it would silently kill the animated-edge feature.
  The same render supplies the safe simplification: `@keyframes` is the ONLY at-rule the engine emits, so the
  at-rule policy is an allow-list of exactly one.
  **Framing, stated so the implementation is not mis-scoped:** post-`3d7c8ed` the directive-injection route is
  CLOSED and the `<style>` content is ENGINE-AUTHORED — the same render measured **zero `url()` in the emitted
  CSS and zero non-`#` `url()` anywhere in the SVG, across all 6 types** — so this CSS pass is
  DEFENSE-IN-DEPTH on the adopted/cached artifact: it guarantees a cached diagram cannot fetch on re-adopt
  even if a future engine version emits a `url()`. It is NOT the primary injection defense (D-6's `secure`
  hardening is). **`@import` is NOT the live route** — mermaid drops it twice over (`createUserStyles`'
  constructed-stylesheet `replaceSync` parse ignores it, `mermaid.core.mjs:1136-1140`; and `compileCSS`
  comments out any at-rule outside its allow-list) — external `url()` in ordinary properties is; the pass
  covers `@import` as defense-in-depth, but a pass scoped to `@import` alone would be VACUOUS.
  **Sealed footprint:** `SVG_ALLOWED_TAGS` gains `style` (reversing 2.1's denial for that element only);
  `SANITIZE_SVG_CONFIG` gains the CSS pass (a hook or pre/post step — the first procedural filter beside the
  allow-list, which spec §3.5/§3.10 anticipated by naming `@import` in embedded `<style>` as a thing to
  STRIP). It does NOT touch the §2.2 no-hook guard — **`style` ∉ DOMPurify's `DATA_URI_TAGS`
  (`{audio,video,img,source,image,track}`, `purify.es.mjs:678`), confirmed this session** — so the guard's
  teeth (which bite only on a `DATA_URI_TAGS` member) are unaffected and the hook stays a proven no-op here;
  nor the DOCUMENT profile (SVG-profile-only); nor the content-script fence (the CSS pass must tree-shake off
  the content script with the rest of `sanitizeSvg`, on the `/*#__PURE__*/` pattern — the implementation
  verifies by md5-identical content-script bytes).
  **Mechanism (implementation's call, constraint recorded):** a new CSS-parser dependency is a supply-chain
  event (1.1's pattern), and **the lean is that NONE IS NEEDED** — two in-repo mechanisms cover the surface.
  (a) A narrow default-deny scan — reject every `url(` token whose target is not `#…`, and every at-rule that
  is not `@keyframes` — reviewable as data on this file's own pattern, PROVIDED it decodes CSS escapes and
  normalizes case/whitespace/quoting FIRST, since the `u\72 l(` lane is exactly what a naive regex fails.
  (b) The PLATFORM's own CSS parser (`CSSStyleSheet` + `replaceSync` + a rule walk), which normalizes all
  four obfuscation lanes for free and is what mermaid itself uses — at the cost of being browser-only
  (`createCssStyles` branches on `typeof replaceSync === 'function'`; jsdom has none), so its proof must be
  real-engine. (a) is the smaller review surface; (b) is the smaller correctness risk. Either beats a
  dependency.
  **Implementation MUST:** admit `<style>`; add the CSS pass with a red-first proving external
  `url()`/`@import` are stripped and `@keyframes` / internal `url(#…)` preserved, real-engine (the fetch is
  browser-only — jsdom loads no subresources); update 2.1's exact-set (`sanitize.test.ts:239`) and
  denied-by-absence (`:249`, whose loop names `style`) tests, and RE-AIM `:350` (*"drops `@import` in
  `<style>` — the element goes, so the rule goes with it"*) at the new mechanism, since the element now STAYS
  and the rule must go — which is also what turns the `:397` corpus's `@import` row from a vacuous pass into
  a real one; hold the content-script fence; the byte-untouched DOCUMENT-profile pin (`:601-666`) stays green.
  **Cited by:** the B implementation task; group 3's enhancer (which adopts the `<style>`-bearing SVG).
  **Discharges:** ff8f323's first downstream finding. **Revisit-when:** a future mermaid emits CSS constructs
  beyond `url()`/`@import`/`@keyframes` that can fetch or script — a new at-rule is the live possibility,
  since `compileCSS`'s allow-list ALREADY admits `@media`/`@supports`/`@layer`/`@scope`/`@container`/
  `@starting-style` for user CSS and only the engine's current templates keep them out of the output — or
  DOMPurify gains a CSS parser that changes what survives; then the pass's coverage is re-derived against the
  new version with the same loopback-fetch probe.

- **2026-07-28 · M7 D-6 ADDENDUM — D-6's config HARDENS mermaid's `secure` list, closing a live pre-sanitize
  CSS-injection/fetch route the plan's residual-hole control does not name.** At `securityLevel: 'strict'` with
  D-6's config, an untrusted markdown author can inject arbitrary CSS into mermaid's generated `<style>` via a
  `%%{init:{"themeCSS":…}}%%` directive; verified live this session (real mermaid 11.16.0, real headless
  Chromium, D-6's config verbatim, every "remote" URL pointed at the probe's OWN loopback server), the injected
  `url(…)` **FETCHES during the render** — inside D-6's measurement window, BEFORE `sanitizeSvg` runs — so
  denying `<style>` (2.1) does NOT close it, and `securityLevel: 'strict'` alone does not either (`'loose'`
  behaves identically, same 10 requests). Of 13 URL-bearing payload rules, **11 survived into the generated
  `<style>` and 10 reached the wire**: `-webkit-mask-image`, `background-image`, `border-image-source`,
  `content`, `list-style-image`, `shape-outside`, `cursor`, and the `fill`/`filter`/`clip-path` external
  references. **`@import` is NOT the live route** — it is dropped by `createUserStyles`' constructed-stylesheet
  parse (`replaceSync` ignores `@import`) and `@font-face` by `compileCSS`'s at-rule allow-list; **ordinary
  properties are the route**, which matters because §3.10's stated `<style>` control names `@import`. The
  instrument is proven live by a benign `%%{init:{"theme":"dark"}}%%` control taking visible effect in the same
  run (`.node rect` fill `#ECECFF` → `#1f2020`). The render is the only window: the probe never inserts the
  returned string, and the container is removed in its own `finally`, so an observed request can only have been
  issued while the measurement container was live. This is plan §7-3/§3.5's named residual hole firing from a
  route the plan scoped to a remote IMAGE reference, not a directive.
  **The mitigation, measured:** mermaid's `secure` config list (default `['secure','securityLevel',
  'startOnLoad','maxTextSize','suppressErrorRendering','maxEdges']`, `mermaid/dist/chunks/mermaid.core/
  chunk-WYO6CB5R.mjs:4441-4448`) is the set of keys `config.sanitize()` deletes from every `%%{init}%%`
  directive before it merges (`:4890-4913`); `themeCSS` is NOT in it. D-6's config adds
  `'themeCSS','fontFamily','altFontFamily','themeVariables'` to `secure`, after which the same payload produces
  NO evil CSS and NO fetch; a benign `theme` directive is still honoured; a directive attempting to re-widen
  `secure` (`%%{init:{"secure":[],"themeCSS":…}}%%`) fails, because `sanitize()` iterates
  `['secure', ...siteConfig.secure ?? []]` — **the list guards itself**; and a `themeCSS` WE set through
  `initialize()` still applies, so the hardening blocks the DIRECTIVE route, not the feature. **Ablated:**
  passing mermaid's own default `secure` list explicitly still fetches all 10 — **the four ADDED keys are what
  closes it**, not the act of passing an array to `initialize()`.
  **Two measured facts beyond the recon, banked so the implementation does not narrow to `themeCSS` alone:**
  (a) **`fontFamily` is an INDEPENDENTLY PROVEN route, not defense-in-depth** —
  `%%{init:{"fontFamily":"serif; background-image: url(…)"}}%%` fetches, because it is interpolated into a
  `:root{--mermaid-font-family: …}` rule and mermaid's `sanitizeCss` only checks brace balance; `altFontFamily`
  is the same interpolation. (A brace-escaping `fontFamily` payload IS caught by `sanitizeCss` — the balanced
  one is not.) (b) **`themeVariables` is defense-in-depth only:** its values are already pattern-guarded to
  `/^[\d "#%(),.;A-Za-z]+$/`, which admits no `:` and no `/`, so a scheme URL is blanked before it renders
  (measured — the render throws `Unsupported color format: ""`). **Its one measured COST:** an author-supplied
  `%%{init:{"theme":"base","themeVariables":{"primaryColor":"#ff0000"}}}%%` stops taking effect (fill
  `#ff0000` → `#fff4dd`). **Accepted deliberately, not overlooked** — neither spec nor plan promises
  `%%{init}%%` directives at all (zero occurrences of "directive" or "themeVariables" in either), D-6 sets no
  `themeVariables`, and §3.7/D-7 make the effective theme OURS to choose rather than the markdown author's.
  **What this does NOT change:** D-6's `securityLevel: 'strict'` / `htmlLabels: false` / `startOnLoad: false`
  all stand — this ADDS the `secure` hardening. No other D-value, no gate-1/gate-2/gate-3 disposition, no spec
  §3.x. It is an instance of §3.10's FIRST bullet (*"the engine is configured so it cannot emit remote
  references"*), which is why it is a config decision and not a sanitizer one. **This entry is the decision; the
  config change to `src/render/diagramEngine.ts` (`DiagramEngineConfig` + `DIAGRAM_ENGINE_CONFIG`) lands as its
  own implementation commit citing this entry — NOT here**; that file is byte-untouched by this bank.
  `plan.md`'s D-6 residual-hole clause is edited minimally to record that this route is closed by the `secure`
  hardening; the remaining §7-3 control (remote image references, §3.5 row 22) stays exactly as written, and
  **group 3's real-engine zero-network guard still owes the measurement** — a config that closes one route is
  not a proof that the window is clean, which is the whole point of D-6's "not by construction". **Cited by:**
  the D-6 hardening implementation task (a group-3 / D-6 task); and the `<style>` decision left open as
  ff8f323's first downstream finding — this hardening makes the generated `<style>`'s content provably
  ENGINE-AUTHORED, a precondition for any option that ADOPTS that CSS rather than stripping it.
  **Revisit-when:** a future mermaid changes the `secure` mechanism (e.g. `sanitize()` stops iterating
  `['secure', ...siteConfig.secure]`, or directives stop flowing through it), or adds new directive-reachable
  config that can carry a URL or raw CSS; then the hardened set is re-derived against the new version with the
  same loopback-fetch probe and a firing control.

- **2026-07-28 · M7 §2.2 AMENDMENT — the inherited hook is PROVABLY redundant for `sanitizeSvg`, so 2.2
  proves defense-in-depth + a widening guard, not hook-protection. Discharges ff8f323's second downstream
  finding.** Tasks §2.2 specifies proving the global `uponSanitizeAttribute` hook protects the SVG profile —
  "a `data:` on `xlink:href` does not survive `sanitizeSvg`; remove the hook → the assertion reds." **That is
  unsatisfiable, and provably so:** verified against dompurify 3.4.12 source (this session), the hook's only
  effect is `keepAttr=false` for `{href, src, xlink:href}` with a `data:`-resolving value, and for that to be
  OBSERVABLE `_isValidAttribute` must otherwise accept the attribute — all five acceptance branches are closed
  under `SANITIZE_SVG_CONFIG`: `URI_SAFE_ATTRIBUTES` excludes the ref attrs (they're gated) and `src` isn't
  allow-listed; `IS_ALLOWED_URI` is anchored/scheme-free and tested against the `ATTR_WHITESPACE`-stripped
  value (a superset of `isDataUri`'s strip, closing the obfuscation lane); `DATA_URI_TAGS`
  (`{audio,video,img,source,image,track}`) has empty intersection with `SVG_ALLOWED_TAGS` and non-allow-listed
  elements are removed before attributes are checked; `ALLOW_UNKNOWN_PROTOCOLS` is false. A sweep of every
  allow-listed tag × ref attr × `data:`/`javascript:`/obfuscation payload, plus a real-engine
  mXSS/integration-point corpus, produced **zero hook-vs-no-hook diffs in Chromium, Firefox and jsdom
  (686/686/726 cases)** — with a firing control (the DOCUMENT profile's `<img src="data:">` DOES diverge,
  proving the instrument live). The hook remains fully load-bearing for `sanitize()`; it is redundant for
  `sanitizeSvg` ONLY because 2.1's allow-list already denies the tags that make it necessary. **The reframe:**
  §2.2 proves (a) the hook is registered on the shared singleton `sanitizeSvg` calls (inherited by
  construction, real-engine both engines) AND (c) the SVG profile's `data:` denial is allow-list-driven and
  hook-INDEPENDENT — pinned by a test asserting a NO-HOOK DOMPurify instance is also clean on the profile,
  which **reds the moment `SVG_ALLOWED_TAGS` is widened to include a `DATA_URI_TAGS` member** (verified this
  session: with `image` allow-listed, the no-hook instance leaks `data:` while the hooked one strips it — the
  guard has teeth). This is a STRONGER, TRUE security statement than §2.2's original: it pins both the
  property (the profile is safe) and the exact boundary change that would make the hook necessary again.
  **Option (b)** (an observer-hook that proves *a* hook fires, not *the* hook) is rejected — a red-first on the
  framework's hook mechanism, not on our security posture. **What this does NOT change:** D-1's core (a second
  named sanitizer; document profile byte-untouched; allow-list as data; denial by absence; the hook
  inherited-not-re-registered) all stand — the hook IS inherited; what's corrected is the CLAIM that its
  inheritance is what protects the SVG profile. No other D-value, no gate disposition, no spec §3.x.
  `plan.md` D-1's hook bullet and `tasks.md` §2.2 are edited minimally to point here; this bank is the
  amendment of record. **Cited by:** task 2.2. **Discharges:** ff8f323's second downstream finding (2.2's
  discriminator). **Noted for the M7 retro (a pattern, not a complaint):** this is the THIRD group-2 sealed
  decision whose library-behaviour assumption did not survive contact with the real library —
  `engineVersion`'s non-existent runtime export (bddd5af), `/^#/`'s global attribute gating (ff8f323), and now
  the hook's redundancy under the allow-list. All three were caught by a gate before code shipped; the
  signature is spec written against a mental model of DOMPurify/mermaid rather than the libraries themselves.
  **Revisit-when:** `SVG_ALLOWED_TAGS` is ever widened to a `DATA_URI_TAGS` member (the (c) guard reds, and the
  hook becomes load-bearing — re-verify it fires); or a future DOMPurify changes `_isValidAttribute`'s branch
  structure (the 5-branch closure is re-confirmed).

- **2026-07-28 · M7 D-1 / §2.1 AMENDMENT — the SVG profile's `ALLOWED_URI_REGEXP` is NOT `/^#/`, because
  DOMPurify applies that regexp to every non-URI-safe attribute, which `/^#/` would strip the whole diagram
  through. Sealed intent preserved; the mechanism corrected.** Plan D-1 and tasks §2.1 specify the SVG
  profile's `ALLOWED_URI_REGEXP` as literally `/^#/` (fragments-only references). **That value is not
  implementable:** verified against dompurify 3.4.12 (source + probe, this session), DOMPurify does **not**
  apply `ALLOWED_URI_REGEXP` to URI attributes only — it tests it against the value of every attribute NOT in
  its `URI_SAFE_ATTRIBUTES` set. So `/^#/` deletes `viewBox`, `d`, `transform`, coordinates, `fill="none"`,
  `stroke`, and every `url(#…)` paint/marker/clip reference — arrowheads, gradients and clip paths die with
  it; only `#hex` values survive, by accident of starting with `#`. **The correction — design C — preserves
  §2.1's TWO stated security properties exactly** (references are same-document only; no external, `data:` or
  `javascript:` value survives), and changes only the mechanism so the regexp also admits the non-reference
  values a paint attribute legitimately carries:
  - `SVG_ALLOWED_URI_REGEXP` = `/^(?:#[^\s()]*|url\(#[^\s()]*\)|(?:rgb|rgba|hsl|hsla)\([\d\s,.%/+-]+\)|[a-zA-Z-]+)$/i`
    — four alternatives, NONE able to express a scheme or path (`url(` must be followed by `#`; the colour
    alternative admits only digits/separators; the bare keyword alternative admits no `:`).
  - `ADD_URI_SAFE_ATTR`, set to the complement of `SVG_REFERENCE_ATTR` = `['href', 'xlink:href', 'fill',
    'stroke', 'clip-path', 'marker-start', 'marker-mid', 'marker-end']`, confines the regexp to the attributes
    that can carry a reference (`href`, `xlink:href`, `fill`, `stroke`, `clip-path`, `marker-start/mid/end`)
    instead of letting it delete every coordinate. This is a THIRD config key the document profile does not
    set — not a widening, but the confinement that makes the strict regexp usable.
  **What this does NOT change:** D-1's core (a second NAMED sanitizer, not a configurable one; the document
  profile byte-untouched; the allow-list as DATA with no FORBID list; `foreignObject`/`style` denied by
  absence; the inherited global hook not re-registered) all stand. No other D-value, no gate-1/gate-2/gate-3
  disposition, no spec §3.x decision. `plan.md` D-1 and `tasks.md` §2.1 have their `/^#/` clause edited to
  point at this design; this bank is the amendment of record, per the gate-3-banking / §1.1 / §1.2 / bddd5af
  precedent. **Cited by:** task 2.1 (the profile it builds) and task 2.2 (the real-engine sanitize proof).
  **TWO DOWNSTREAM FINDINGS banked here so they are not lost:**
  - **`<style>`/`@import` is a group-3 conjunction (FLAG #3's shape, confirmed real).** 2.1 denies `<style>`
    by absence (clean; `@import` dies with the element). But mermaid inserts its generated theme as a
    `<style>` first-child of the SVG (`createUserStyles` → `svg.insertBefore`) and DOMPurify 3.4.12 has no CSS
    parser, so IF group 3 must allow `<style>` to render themed diagrams, `@import url("http://…")` survives
    verbatim — machinery beyond D-1's allow-list. **Revisit-when:** group 3 decides themed-diagram rendering —
    strip `<style>` and lose engine theming, or add CSS sanitization (a D-1/D-6 addendum, its own decision).
  - **The SVG profile's `data:` denial does NOT depend on the inherited hook.** A fresh DOMPurify with no hook
    strips `data:` on `xlink:href` via the URI regexp alone (verified). So task 2.2's planned discriminator
    (remove the hook → the `data:` xlink case reds) will NOT red. **Revisit-when:** 2.2 is drafted — it needs a
    discriminator the hook catches that the allow-list does not, or the real-engine proof is reframed around
    what the hook uniquely contributes.
  **Revisit-when (whole entry):** a future DOMPurify changes how `ALLOWED_URI_REGEXP` interacts with
  `URI_SAFE_ATTRIBUTES` (the mechanism this correction depends on); then design C's regexp/`ADD_URI_SAFE_ATTR`
  split is re-verified.

- **2026-07-28 · M7 D-3 / D-13 AMENDMENT — `engineVersion` is sourced from the resolved
  `mermaid/package.json`, because mermaid 11.16.0 exposes no runtime version. Two sealed D-values narrowed
  in MECHANISM, not intent.** Plan 007's D-3 specifies the cache key's third component as *"read from the
  engine's own exported version at runtime, never a hardcoded constant"*, and the plan's render pseudocode
  composes the key with `... + SEP + engine.version`. **That mechanism does not exist:** verified against the
  installed package, mermaid 11.16.0's dist entry exports only `{ mermaid_default as default }`, whose members
  carry no `version`; the number appears only build-inlined inside the renderer and in a lazy `infoDiagram`
  plugin chunk's un-re-exported `getVersion()`. There is no `engine.version` to read. **The resolution:**
  `engineVersion` is sourced from the resolved `mermaid/package.json` `version` field — a static-literal
  subpath import inside `diagramEngine.ts`, inlined by the bundler at build time from the *resolved* package
  (confirmed to build under WXT/Vite and to yield `11.16.0`). **This is not the "hardcoded constant" D-3
  forbids:** no human writes the number, and it re-derives from the resolved dependency on every build, so a
  Dependabot bump that moves the resolved version moves the key. D-3's stated reason for putting the version
  in the key at all — *"a constant goes stale silently on the Dependabot bump"* (§3.6) — is honoured; only the
  literal "read the engine's exported version at runtime" mechanism, which mermaid does not provide, is
  replaced. The entry is honest that this is a build-time inline, not a runtime property read, because no
  runtime read exists. **Amendment to D-13** (*"`mermaid` is imported by EXACTLY ONE module ... via the
  literal `import('mermaid')`"*): the single-**engine**-importer fence stands unchanged — mermaid the engine
  is still imported in exactly one place, `diagramEngine.ts`, and the version read pulls no engine code and no
  lazy engine chunk. D-13 is extended to permit, in that same module and nowhere else, **one additional
  static-literal specifier — `mermaid/package.json` — for version metadata only.** Being a static string
  literal, the dynamic-import scanner permits it on the same specifier-staticness rule that permits
  `import('mermaid')` (decisions.md 2026-07-27 §6 side-quest (b)); task 1.2 verifies the scanner stays green
  on both. **Preserves gate-2 sub-decision (b)** (2026-07-27, M7 GATE 2): letting eviction reclaim stranded
  rows on a version bump depends on the key changing on that bump, which the resolved-package read delivers
  exactly. **Cited by:** task 1.2 (the version accessor reads this source) and task 4.1 (the key composition
  reads `engineVersion` from here, not the non-existent `engine.version`). **What this does NOT change:** no
  other D-value, no gate-1/gate-2 disposition, no spec §3.x decision; `plan.md` stays sealed and untouched —
  this bank is the amendment of record, per the gate-3-banking and §1.1-dompurify-correction precedent.
  **Revisit-when:** a future mermaid major exposes a genuine runtime version export (the subpath read can then
  be simplified toward D-3's original mechanism and D-13's second-specifier extension retired); or a future
  build toolchain stops resolving the `mermaid/package.json` subpath import (the resolved version then moves
  to a build-time `define`, which touches D-16's `wxt.config.ts` seal instead and is re-banked).

- **2026-07-28 · M7 GATE 3 — tasks 007 (Mermaid + diagram cache, M7a) APPROVED; implementation has begun at
  task 1.1.** `specs/007-mermaid-diagrams/tasks.md`, drafted at `bfa131e` (28 tasks across the plan's nine
  groups, each with its own Verify contract and — bar 9.1's human close-gate walk, which names no files — its
  own Files line), was reviewed against plan 007 and approved to begin implementation. **The tasks.md status
  line stays "DRAFT awaiting gate 3" and THIS entry is the approval of record** — matching the in-milestone
  precedent that gate approvals live in the bank, not the artifact's status line (spec 007 still reads "draft"
  post-gate-1 `e09520f`; plan 007 still reads "draft — awaiting gate 2" post-gate-2 `cab93c7`, approval banked
  in that commit). **Why a decisions.md entry and not M6's shape** (`0e24f15 docs(tasks): M6 gate 3 — tasks 006
  (snapshots + diff) approved and landed`, which landed tasks and approval in one commit before M6's task 1.1):
  M7's tasks already landed separately at `bfa131e` as an explicit draft, so "approved and landed" cannot be
  replicated — the tasks were in the tree and only the written approval was outstanding. Task 1.1 (`mermaid`
  added, `2159e5c`) proceeded on the in-session approval; this entry closes the written gap so a future
  context-loss session verifies gate 3 against the repo, not a chat. **What this approves:** the tasks as
  drafted, with plan's sixteen D-values and the four gate-2 sub-decisions cited-not-re-argued, spec §6's IS-NOT
  fence intact, and the gate-1 dispositions (§3.4 OUT · §3.2 no content-script note · §3.2 app-page-only IS
  persona-#1 completion) preserved by silence — the "Locked by the gates" contract in tasks.md's own preamble.
  **What this does NOT reopen:** no D-value, no sub-decision, no spec §3.x decision; a task that re-argues any
  is a scope-reopen. **One correction is outstanding from 1.1's review, tracked separately and NOT applied
  here:** tasks.md §1.1's `pnpm list --prod dompurify` dedupe control is a depth-0 query that cannot surface a
  transitive duplicate (1.1 discharged the gate with `pnpm why --prod dompurify` plus a positive probe on
  esbuild instead); the §1.1 Verify line is to be corrected before a later task re-cites the depth-0 form, as
  its own act. **Revisit-when:** implementation surfaces another task whose contract cannot be executed as
  written (banked at the point of discovery, not propagated forward); or the §7-9 flip-cost finding routed here
  per gate-2 (d) reaches its gate-3 disposition at 5.2 / 8.4.

- **2026-07-27 · M7 GATE 2 — plan 007 (Mermaid + diagram cache) APPROVED, four settled answers to plan
  §8's routed questions.** Plan 007 (`specs/007-mermaid-diagrams/plan.md`, drafted at `c44406a`) resolved
  the spec's ten §7 risks against actual code and settled sixteen D-values, with four questions routed to
  gate 2 in its §8: revoke-exemption copy (D-5), version-bump disposition, `architecture.md` correction
  placement, and the spec §7-9 routing inconsistency. All four are settled here. The plan file's status
  line stays "draft — awaiting gate 2" matching gate-1's precedent (spec 007's status line still reads
  "draft" post-`e09520f`); gate-2 approval lives in this commit and the plan's citations in tasks.md
  derive from this entry. Four sub-decisions:
  - **(a) The D-5 revoke-exemption copy — settled.** The mechanism was decided at plan D-5 (content-hash
    key carries no folder identity; exemption paid for by disclosure and by an alternative one-click
    gesture). The wording is:
    - **`docs/trust/PERMISSIONS.md` ledger row** (the file's five-column header order at
      `PERMISSIONS.md:37`, following the snapshot row's precedent at `:46`):
      **Capability:** "Diagram cache (M7 / spec 007)".
      **Trigger (never silent):** "User opens a document containing Mermaid diagrams on the app page →
      the reader renders each diagram once, then reuses the stored SVG until the diagram source,
      effective theme or Mermaid engine version changes."
      **What it can touch:** "Bounded on count, total bytes and age, whichever binds first, evicting
      oldest-first on `lastUsed`."
      **Storage (on-device only):** "Cached SVGs stored in the extension's own IndexedDB (`peekover`,
      DB version 4), keyed by hash of the diagram source."
      **How the user sees & revokes it:** '**A content-hash key carries no folder identity, so revoking
      a folder does not clear cached diagrams that folder's documents may reference — the same Mermaid
      source in two folders is one cached rendering.** Erased by "Clear diagram cache" in the Stored
      data panel, or by "Wipe all data".'
    - **Stored-data panel line** (matching the snapshot pair's shape at `storageControls.ts:241-280`):
      `Diagrams cached: N rendered (~size) — Clear diagram cache`
      Added as one line beneath the panel's existing snapshot disclosure.
    Both surfaces land in the SAME commit as the first code that caches an SVG (plan D-14, group 4,
    §3.9's "never a follow-up" rule).
  - **(b) `mermaid` version bump: LET EVICTION reclaim stranded rows. No purge-on-upgrade.** Plan D-3
    makes rows with old `engineVersion` unreachable via lookup; plan §4-7 flags they occupy bytes until
    age or byte eviction reclaims them. Reasoning at plan §4-7 (Dependabot bumps are rare on a mature
    library; age eviction covers the reclaim window; purge is a write on what should be a read path; the
    stored-data panel line disclosed in sub-decision (a) is the user's one-click reclamation gesture; the
    downgrade case makes any purge-on-mismatch counterproductive). No copy addition needed for the
    version-bump case; sub-decision (a)'s general disclosure covers it. **Revisit-when:** measurement at
    gate 3 shows stranded-row accumulation crosses a bound value's threshold at typical reading-session
    scale.
  - **(c) `docs/ai/architecture.md` correction lands in group 9 (retro/close), NOT in group 3 or 4.**
    Plan §0.2-3 documented the drift: `architecture.md` self-labels as *"pre-code; describes intended M1
    shape"* and its pipeline line names an `enhance` stage between sanitize and mount that does not exist
    (`mount()` commits in one synchronous `replaceChildren` at `mount.ts:210`). Correcting it in group 3
    (enhancer scaffolding) or group 4 (cache) would scope-creep those groups; correcting it in group 9
    matches the M6 archive-pass discipline of "measure-then-correct the memory files as facts land." The
    correction should note: **"007 group 3 landed the actual post-mount enhancement pattern; the
    architecture.md 'enhance stage' description was pre-code and never matched code shape."** Same commit
    as the retro entry or one adjacent commit, per the drafting session's judgment. **Revisit-when:** any
    future milestone touches the render pipeline in a way that produces new architecture drift; the
    correction discipline stands.
  - **(d) Spec §7-9 routing to gate 2: RE-ROUTED to gate 3 with a named fallback.** Plan §1.3 identified
    the timing inconsistency: spec §7-9 says the theme-flip cost at 50 diagrams, if bad, *"is a finding
    for gate 2"* — but the measurement cannot exist until group 5's code does, which is well past gate 2.
    Holding gate 2 open for a spike would mean either (i) writing group 5's code before gate 2 approves
    the plan (breaks the Gear-3 cycle) or (ii) writing a throwaway spike that measures nothing the actual
    code produces. The rational shape is: measurement happens in group 5; result is either acceptable (no
    action, moves to §7 measurement output) or unacceptable (triggers gate-3 revisit-when with the plan's
    named fallback of progressive visible-first re-render per plan §1.3). This preserves the spec's
    intent (a bad flip-cost finding is a real product problem) while fixing the timing inconsistency.
    **Revisit-when:** if group 5's measurement lands unacceptably, plan §1.3's fallback is queued as
    gate-3 material; if acceptable, no action beyond §7's standard measurement output.
  **What this entry does NOT reopen.** Sixteen D-values in plan 007 are settled and cited as-is by
  tasks.md. The gate-1 dispositions (§3.4 OUT, §3.2 no content-script note, §3.2 app-page-only IS
  persona-#1 completion) are preserved by silence per the plan's own precedent. No spec §3.x decision is
  re-argued. **Revisit-when (whole entry):** M7a lands and the M6 retro's gate-record-viewport rule is
  applied at the milestone-close gate; if any of the four sub-decisions above surfaces a gap at gate-3 or
  the close walk, the revisit-whens above fire.

- **2026-07-27 · M7 DIRECTION — persona #1 (AI-tool developer) completion via M7a: Mermaid + diagram
  cache; the persona-#1 QoL items deferred to M8.** The spec-coverage audit (`docs/ai/spec-coverage.md`
  2026-07-27) put persona #1's killer features at **~56% (10/18)** and every other persona under 15%; the
  single largest hole in persona #1 is **F2 (Math & Diagrams) at 0%** — no `mermaid` dependency has ever
  been installed, and AI agents materially produce Mermaid diagrams in the specs/plans this product
  renders. So the gap is not "polish for existing users" but **a hole in this product's specific value** —
  not rendering the diagrams the agents write is exactly the wrong shape of gap for the "watch your AI
  produce specs" story. **M7a SCOPE:** `mermaid` runtime dependency (a governed act, AGENTS.md #3,
  matching M6's `diff` addition), lazy-loaded per §10's rule, wired into the existing enhance step;
  **plus** F2's hash-keyed diagram cache (size cap, one-click clear, docu.md parity) — **BOTH from the
  start, not sequentially**, because §8's diagram-heavy target (50 diagrams: first open ≤5s, **cached
  reopen <1s**) implicitly requires the cache and shipping Mermaid without it breaches the target on
  measurement. **DEFERRED TO M8** with revisit-whens: compare-any-two-files (F6), agent-file awareness
  (F6 — `CLAUDE.md`/`AGENTS.md`/`.cursorrules` recognition + tuned defaults), table tools in reading view
  (F5 — sort/filter/copy-as-CSV). **Why the deferral is deliberate, not scope-timidity:** four features in
  one milestone is the M1 skeleton-shape not the M5/M6 focused-theme shape, and M6's retro finding 4
  (sibling-checklist audit) is easier to apply cleanly to one coherent surface than to four; Mermaid+cache
  is one coherent theme with one acceptance criterion (the §8 target), and the deferred items are
  persona-#1 polish rather than core-workflow gaps. **Why persona #2 (Developer, ~5%) is NOT M7's
  direction despite higher marginal work-per-percentage-point (Shiki + remote URLs would move persona #2
  from ~5% to ~30-40%):** persona #2's needs are competitor-parity catch-up; persona #1's Mermaid gap is
  *this product's specific value story failing*, and a bootstrapping product wins by making its own users'
  primary workflow whole before chasing a wider audience. Persona #2 unlock is queued for M8 or M9
  depending on M7's outcome. **Why Editor Mode (§F8, walk-finding at M6 9.1) is not M7's direction despite
  the strongest single first-user expectation:** Editor Mode is a full milestone of CodeMirror 6 + F8's
  ~21 sub-items; even at M8 it is unlikely to fit alongside anything else. Named as the
  next-large-milestone candidate after persona #1 completion, not deferred by comparison to M7a.
  **REVISIT-WHEN:** (a) M7a lands and M8 planning weighs persona-#1 QoL vs persona-#2 unlock vs Editor
  Mode against updated audit numbers; or (b) Mermaid's byte cost (~400 KB gzipped, likely ~doubles the
  current ~349 KB zip) breaches §8's ≤5 MiB package budget when measured, at which point the lazy-load
  boundary or a subset-build strategy becomes gate-3 material; or (c) first-paint regression on the reader
  path from the Mermaid pipeline shows up in the gated typical fixture, at which point §10's lazy-load
  rule needs a stricter definition than "loads as a local async chunk."

- **2026-07-27 · §6 RELEASE-ENGINEERING GAP CLOSED IN CI, and §6-17's `storage.sync` claim CORRECTED to
  match what has shipped since 004.** The spec-coverage audit (`docs/ai/spec-coverage.md`) scored §6-4 and
  §6-9 PARTIAL for one shared reason: **both name CI as their evidence and `ci.yml` ran lint/test/browser-test/
  build only** — the "verified in CI" and "npm audit + OSV + Dependabot + SBOM" clauses were claims with
  nothing behind them. Added, in a new `.github/workflows/supply-chain.yml` (separate from `ci.yml` because a
  supply chain rots with no commit of ours — it runs on PR, on push to main, AND weekly):
  `scripts/check-dynamic-imports.ts`, `pnpm audit`, the OSV scanner with SARIF upload,
  `scripts/generate-sbom.ts`, and `.github/dependabot.yml`. **Four sub-decisions, each a real call rather
  than a default:**
  - **(a) The audit gate is `--prod` BLOCKING, full-tree ADVISORY.** Measured, not assumed: the whole tree
    reports **7 advisories (1 critical, 5 high)** and **every one is a transitive devDependency of `wxt`,
    `eslint` or `@vitest/browser-playwright`** (shell-quote ×2, tmp, adm-zip, brace-expansion, uuid,
    esbuild); the production tree is **clean at 0**. Blocking on the dev half would make CI red from its
    first run for CVEs that are upstream of `wxt` and unfixable here — and a red CI everyone learns to
    ignore is worse than none. The dev advisories are printed to the job summary on every run, not
    suppressed. **Revisit-when:** a dev advisory becomes reachable at BUILD time in a way that could affect
    the artifact (a compromised bundler, not a compromised test runner), or `wxt` ships the fixes and the
    full tree can be promoted to blocking.
  - **(b) The dynamic-import ban is a SPECIFIER-STATICNESS rule, not a ban on `import()`.** §6-4 bans
    dynamic imports "of anything **not in the signed package**" — and §10 *requires* lazy dynamic imports
    for Shiki, KaTeX/MathJax and Mermaid ("loads as a local async chunk"). A rule banning every `import()`
    would have to be suspended the moment M7 adds highlighting, and **a rule that gets suspended is not a
    rule**. So: a static string-literal specifier is ALLOWED (the bundler resolves it into the package at
    build time); a computed specifier or a URL specifier is BANNED. `eval`/`new Function` are deliberately
    NOT checked — MV3's CSP blocks both and no build of ours can re-enable them, so a grep would be theatre.
    **Revisit-when:** a `content_security_policy` key appears in `wxt.config.ts` (then add them).
  - **(c) The scanner ships with a SELF-TEST that CI runs FIRST, and it is not optional.** There are
    currently **zero** dynamic imports in `src/`/`entrypoints/`, so the repository scan passes trivially —
    **indistinguishable from a scanner that has silently stopped working**. This is retro finding 1(a)'s
    class exactly (the import-fence grep that returned 0 whether or not the code was present), so the
    firing control is built in: 7 fixtures that MUST trip it, 8 that MUST NOT, driven through the same
    `scanSource()` the real scan uses. **It earned itself immediately** — the first run FAILED on the
    template-interpolation case, a real false-negative where the masker recorded a `${…}` hole as string
    rather than code. A scanner without it would have shipped with that hole and reported success.
  - **(d) The SBOM generator is hand-rolled — no `@cyclonedx/cyclonedx-npm`.** Adding a dependency to
    satisfy a *minimal-dependencies* claim is close to self-defeating, and everything needed is already in
    `pnpm list --prod`, `pnpm licenses list --prod` and `pnpm-lock.yaml`'s integrity hashes. Output is
    CycloneDX 1.6, **production-runtime-only** (devDeps are not in the signed package; including them would
    bury 11 real components under ~700), and **byte-deterministic** — serial number derived from a digest of
    the component list rather than a random UUID, timestamp honouring `SOURCE_DATE_EPOCH` — so a release
    SBOM can be re-derived and compared, which is §6-10's reproducibility property applied to itself.
    **Revisit-when:** the format outgrows this (VEX documents, full provenance attestations).
  **THE SPEC CORRECTION (§6-17).** The audit found the item asserting *"settings in `storage.sync`
  (browser-encrypted)"* — **false since 004 and never true**. Authorised by an existing record, not invented
  here: `decisions.md` 2026-07-17 (004 gate-1) chose the local `peekover` IndexedDB to preserve
  `permissions: []`, and **names §6.17 itself** as carrying the deferral. §6-17 now states what ships and
  points at that entry rather than restating it (retro finding 3's pointer discipline). **Revisit-when:**
  cross-device sync is wanted — then `storage` + PERMISSIONS.md + the manifest pin move together as a #4
  event, and §6-17/§9/F7 are corrected back in the same PR.
  **NOT DONE, deliberately, and named so it is not mistaken for done:** §6-10 (reproducible builds, release
  hashes, signed tags, attestations), §6-11 (publisher account security), §6-13 (threat model) and §6-15
  (community audit) remain ✗ — they need a release process that does not exist yet. The SBOM's
  release-attach step is written and will fire on the first tag, but **has never run**.

- **2026-07-26 · First-time-user edit expectation carried as Editor Mode input (M6 9.1 gate observation).**
  During the 9.1 walk a first-time user reasonably expected to be able to EDIT the markdown file inside the
  Peekover reader. This is not in M6 scope — Editor Mode is spec §F8, a named future milestone — but the
  observation is worth carrying rather than losing to a gate note. **Why record it:** the same expectation
  almost certainly recurs for every first-time user until Editor Mode lands, and §F8's design work will
  benefit from the specific framing 9.1 surfaced (the reader surface is where editing feels natural, not a
  mode toggle or a separate app). This matches M5's watch-pill-discoverability precedent (`decisions.md`
  2026-07-21) — ship-as-is, record, revisit when the surface lands. **Revisit-when:** §F8 (Editor Mode)
  enters spec drafting for its own milestone, OR a first-run onboarding surface lands that could hang an
  expectation-setting hint on the reader.

- **2026-07-26 · Snapshot picker legibility at count-bound (15 rows) UNMEASURED at 9.1, carried.** The 9.1
  walk exercised the picker at 3-7 snapshots which passed cleanly (screenshots in the walk record). 15+
  snapshots would have required 16 external edits with coalescer cooldown gaps between them, which the walk
  did not seed. The picker's internal scrolling is designed against `readerCss.ts:401`'s
  `max-height:min(46vh,320px)`, and CC's arithmetic during D-8 selection said it scrolls cleanly at 15 rows
  — but the behavioural verification is UNMEASURED. **Why ship-as-is:** the layout is theoretically sound (a
  design assumption CC named with numbers, not a guess), 006's watch-then-many-edits workflow means a user
  naturally accumulates snapshots over time (the case will surface itself in real use), and holding M6 for a
  16-edit seed script that only exercises this one scroll case is disproportionate to the risk.
  **Revisit-when:** (a) a real user or Session's Playwright fixture accumulates 15+ snapshots on a single
  document and picker behaviour is directly observable, OR (b) a small seed-snapshots CLI helper is added to
  `scripts/` that could exercise the count-bound case reproducibly (worth ~15 min of M7 scaffolding), OR (c)
  a defect report from the field names picker legibility at count-bound as an issue.

- **2026-07-26 · First-paint gate re-baselined to <165 ms typical (M6 9.1 human decision).** The M1 gate at
  <150 ms breached on working-day machines by ~5-8 ms while passing on quiesced machines — the codebase grew
  ~40% since M1 and the gate now sits at the machine-state noise floor. Re-baselining to 165 ms preserves the
  gate as codebase discipline (any future regression that pushes typical past 165 ms is a real signal) while
  making the promise honest about the range users actually experience. This is the FIRST re-baseline of the
  M1 gate. **Why:** shipping M6 with a gate that requires quiescing 49 browser processes to pass means the
  gate is measuring machine state, not code — and future sessions would either game the quiesce protocol or
  silently re-baseline again. 165 ms leaves ~15 ms real headroom for future growth before the next
  re-baseline is due. **Revisit-when:** (a) M7 kickoff considers optimization work (per human note at 9.1 —
  006's +15.7 KB content-script growth is legitimate but not sacred), (b) working-day median exceeds 165 ms
  on the reference hardware, or (c) a future milestone adds enough bytes that the gate's discipline signal
  degrades further.

- **2026-07-26 · D-8 SNAPSHOT RETENTION BOUND VALUES CHOSEN (task 7.2 human decision gate).** Per plan §0 D-8
  and §1.2, the axes are settled (D-16, 2026-07-23) — count per-document, bytes global, age global — and this
  entry logs the VALUES chosen for `snapshots.ts:61/77/93` before 7.3 sets the constants. Chosen from 7.1's
  measurements (`progress.md` M6-post-7.1 Now section) by human decision, not inference. Values, and the
  reasoning:
  - `SNAPSHOT_COUNT_PER_DOC` = **15**. Enough undo-depth for realistic "revise a document over an afternoon"
    sessions without accumulating stale early history — an agent editing every couple of minutes for an hour
    hits 15 and starts evicting the earliest. 15 is moderate history depth chosen deliberately over both
    deeper (20+, keeps stale early state) and shallower (10, tight for active sessions). The picker (6.2)
    scrolls internally at this depth and that is by design, not a cost — `readerCss.ts:401` caps it at
    `min(46vh,320px)` with `overflow:auto`, and its own comment records the intent: *"scrolling internally so
    a full retention window stays one calm list."*
  - `SNAPSHOT_TOTAL_BYTES` = **20971520** B (**20 MiB**). Five MiB was the plan's defensive proposal
    ("invisible on any disk") but bit at 4 snapshots for 1 MB documents in 7.1's accumulation — thin for the
    case where deep history is MOST valuable (large documents evolve more meaningfully than small ones). At
    20 MiB: ~17 snapshots fit for 1 MB docs (above the count bound at 15, so count binds first as designed);
    ~420 for 50 KB docs; still 0.02% of a 100 GB drive, still under any user's "notice this" threshold. Bytes
    is the safety cap for pathological "many large docs" cases, not the everyday constraint — count is what
    binds normal usage.
  - `SNAPSHOT_MAX_AGE_MS` = **2592000000** ms (**30 days**). The plan's proposal, kept deliberately after
    weighing 7 and 90 as alternatives. Framing: age is a SAFETY VALVE, not an active constraint on working
    memory. Count and bytes bound active usage; age exists to clean up abandoned documents, because at 20 MiB
    bytes rarely bind in typical use and age becomes the effective garbage collector for the "watched briefly
    then forgot" case. 30 days covers common project cadences (weekly / biweekly / monthly reviews) while
    cleaning abandoned experiments within a month. 7 days would change what snapshots ARE (making them
    "recent working state" not "history of this document"). 90 days would leave stale state occupying the
    pool for a full quarter after abandonment. **Semantic note recorded for future sessions:** age is measured
    from snapshot timestamp, not from last access — an actively-worked document loses 30-day-old snapshots
    even if opened yesterday. Acceptable because by then newer, more relevant snapshots exist; flagged as a
    semantic worth revisiting if the "last access" model becomes the design need.
  **Revisit-when:** the user-visible storage number reaches a level users comment on (bytes); users report
  losing history they wanted at 15 or 30 days (count or age); an eviction bound never binds in practice over a
  full milestone's use (any axis is chosen wrong); or 8.1's re-measurement shows the accumulation shape 7.1
  measured has shifted materially.

- **2026-07-25 · `diff` DEPENDENCY PINNED AT `^9.0.0` (task 5.1) · the first dependency added since M1, and
  the concrete resolution of D-2's approval** (the `diff` package was approved and deferred to 006 at 005's
  plan gate). Package `diff` (kpdecker/jsdiff): BSD-3-Clause, ZERO runtime deps (`pnpm ls diff --depth 0`
  confirms no transitive additions), bundled types (so NO `@types/diff` — carrying it would double the types
  surface), no install scripts, canonical maintainer, 131M+ weekly downloads, tree-shakeable ESM. Pinned
  `^9.0.0`; resolved 9.0.0. Only `diffLines` is used (narrow named import), against `normalise`-d text (D-5).
  **Why `^` and this range:** matches the file's existing three deps' pattern; the API was re-verified against
  `diff@9`'s bundled `.d.ts` before pinning (AGENTS.md — training knowledge of the API is stale). **Why this
  is safe to add now:** the import fence (plan §1.4) keeps the package's bytes off the content-script graph —
  proven at 5.1 by a byte-identical content-script bundle on both engines and zero `diff`-strings in it.
  **Revisit-when:** `diff` ships a major with a breaking `diffLines` signature (re-verify against its docs
  before bumping); or the bundle-fence re-measurement at 8.1 shows `diff` bytes reaching the content script
  (a STOP-and-flag — the fence broke).

- **2026-07-23 · SPEC 006 GATE-3 PRODUCT DECISIONS (gate 3) · the TWO open questions plan §0.1 left to the
  human are now settled — logged BEFORE the code that implements them** (the 004 D-2 pattern; 005's
  plan-gate decisions had to be backfilled a day late — `decisions.md` 2026-07-22 — and this is the first
  occasion since to not repeat that). Both are already encoded in `specs/006-snapshots-diff/tasks.md`'s
  header block (the "Two gate-3 product decisions" bullet) and gate the tasks that carry them; detail lives
  there and in plan §0.1 (C5), not restated at length here.
  - **The D-11 "this document changed again since you opened this diff" line SHIPS.** D-11 already requires
    deferring the re-render while a diff is displayed; the line itself is product copy the spec does not
    require. **Why:** a document that changed with no indication is the same dishonesty one layer over.
    **How it is held to account:** its legibility (useful vs noise) is a task 9.1 human-gate item — a "reads
    as noise" verdict is a finding, not a silent removal. → tasks.md 6.3; plan §0.1-1, §0 D-11.
  - **A document's snapshots SURVIVE its recents row being auto-evicted** (`appShell.ts:622-628` caps recents
    by count). **Why:** the storage panel discloses the bytes either way, and tying stored contents to a cap
    the user never sees would delete history by surprise. **Consequence, stated so it is not discovered
    later:** a document can hold snapshots with no visible recents entry pointing at it until the file is
    reopened. → tasks.md group 1 header + §9; plan §0.1-2.
  **Revisit-when:** 9.1 returns a "nagging / noise / surprise" verdict on either (recorded as a task below
  9.1, not silently reversed); or §3.7's per-document snapshot picker lands, giving the orphaned-snapshots
  case a visible home.

- **2026-07-23 · SPEC 006 PLAN-GATE DECISIONS (gate 2) · D-1…D-16 RECORDED HERE; DETAIL AND REJECTED
  ALTERNATIVES LIVE IN `specs/006-snapshots-diff/plan.md` §0 (C5).** Sixteen decisions were taken and
  human-approved at 006's plan gate (2026-07-23). Per C5 the log carries the entry and the plan carries the
  detail — the sub-items below are each decision's own title **verbatim** (grep them), each pointing at its
  §0 block for the reasoning and the rejected paths. **Logged AT the gate this time, not backfilled** — the
  fix the 2026-07-22 entry's revisit-when asked for, applied on the first occasion after it.
  - **006 D-1 — the outgoing snapshot source is read from the reader-source WeakMap, not retained a second time.** → plan §0 D-1.
  - **006 D-2 — seam pins match the registration expression, not the file; one helper, two registries.** → plan §0 D-2.
  - **006 D-3 — capture disclosure is an additive channel, not a seventh writer of the single note slot.** → plan §0 D-3.
  - **006 D-4 — snapshot metadata is split from snapshot content to stay inside idbCore.** → plan §0 D-4.
  - **006 D-5 — CRLF is normalised for comparison and diffing; 005's content-compare detection is left exactly as shipped.** → plan §0 D-5.
  - **006 D-6 — the anchor's visible correction stays carried; diff does not become a re-render optimisation here.** → plan §0 D-6.
  - **006 D-7 — the diff view is keyboard-reachable without a third global bare key.** → plan §0 D-7.
  - **006 D-8 — snapshot bound defaults are proposed, measured, and chosen at a separate human gate.** → plan §0 D-8.
  - **006 D-9 — on-device snapshot storage is not data collection; `data_collection_permissions: {required:['none']}` stands.** → plan §0 D-9.
  - **006 D-10 — revoke erases the revoked folder's snapshots; contents outlive access to nothing.** → plan §0 D-10.
  - **006 D-11 — a displayed diff defers the re-render; the deferred render captures normally, so no state is lost.** → plan §0 D-11.
  - **006 D-12 — the capture flag is a second settings row, so the content script never fetches a setting it cannot act on.** → plan §0 D-12.
  - **006 D-13 — one global erase-snapshots control; per-document erase is deferred, not rejected.** → plan §0 D-13.
  - **006 D-14 — a surface that registered no diff target grows no diff chrome at all.** → plan §0 D-14.
  - **006 D-15 — entering a diff is an attribute flip, not a re-render; mount() stays read-only library.** → plan §0 D-15.
  - **006 D-16 — snapshot count is bounded per document, bytes and age across the store.** → plan §0 D-16.
  **Why grouped, not sixteen top-level entries:** C16 — sixteen entries each repeating "why: see plan §0 /
  revisit: see plan §0" would out-cost the work and bury the log. 004 set the OPPOSITE precedent — its plan-gate D-1 and its
  decision-gate D-2 each got their own top-level entry, linking out to the plan for detail. Grouping is
  right HERE not because this is a plan gate, but because at sixteen decisions C16 inverts the answer it
  gave at two. Findability is
  preserved because each sub-item carries the
  decision's exact title, so a grep for `D-14` or "no diff target" still lands on the right line.
  **Revisit-when:** any D-*n*'s premise changes against the code (each §0 block states its own revisit
  trigger); or `tasks.md`/implementation contradicts a decision — at which point it is re-opened at its §0
  home, not silently diverged from.

- **2026-07-22 · RECORD BACKFILL · SPEC 005's THREE PLAN-GATE DECISIONS WERE NEVER LOGGED HERE.** D-1 (the
  005/006 split), D-2 (the `diff` dependency approved, and deferred to 006) and D-3 (anchor-based scroll
  continuity) were taken and human-approved at the 005 plan gate on **2026-07-19**, but recorded **only** in
  `specs/005-watch-diff/plan.md` §0. **Full text of all three lives there and is deliberately not restated
  here (C5)** — this entry records *that* they exist and *where*, not what they say.
  - **Why this is being fixed now, rather than left as a closed milestone's untidiness:** 004's D-1 and D-2
    both have entries in this log, and 004's D-1 links out to its plan for the detail — **the log carries
    the entry, the plan carries the detail** was already the pattern, and 005 did not follow it. **006 acts
    on D-2 directly** (it adds the dependency), and WORKFLOW §8.2 states that *"dependency changes always
    require explicit human approval"*. A session reading this log for standing rules would not have found
    that approval at the moment it needed it — which is the one moment it matters.
  - **Dated today rather than 2026-07-19** so that append-only and newest-first date order both stay intact.
    The decisions themselves are not re-opened by this entry; only their findability changes.
  **Revisit-when:** a second milestone's plan-gate decisions go unlogged. At that point the gap is in the
  **workflow, not the milestone** — fix WORKFLOW §5.3 so the plan gate emits its own log entry, rather than
  backfilling a third time.

- **2026-07-21 · HARNESS LEDGER ADDENDUM (spec 005 tasks 3.2, 5.1, and the `remoteMedia` fix; promoted out
  of progress.md at the M5 archive pass) · THREE WAYS AN INSTRUMENT LIED THIS MILESTONE — each silently,
  each producing a plausible wrong answer rather than an error.** These are **authoring rules for the next
  test or harness**, not a record of three incidents; the incidents are in the archive. They share one
  shape and it is this milestone's recurring failure class: **the instrument was wrong while the product
  was right, and nothing went red to say so.**
  - **(1) "THE BOX OVERFLOWS" IS NOT THE PRECONDITION FOR A GEOMETRY TEST — "THE BOX HAS STOPPED
    REFLOWING" IS** (measured at 3.2, both engines). The long-standing `waitForScrollable` helper returns
    as soon as `scrollHeight > clientHeight`, which is true **while the reader is still restyling**: on the
    full-page surface `scrollHeight` read **81 798 px at first overflow and 26 069 px once settled — a 3×
    reflow.** A heading offset measured in that window is stale by tens of thousands of pixels, and the
    `scrollTop` write that follows **CLAMPS to the new maximum**, silently parking the test at the document
    bottom. **It is not a flake** — it made 3.2's anchor capture pick the LAST heading *deterministically*,
    on Chromium and Firefox. → **Poll `scrollHeight` for STABILITY, not for overflow.**
    `tests/browser/watchAnchor.browser.test.ts` does; copy that, not the older helper.
  - **(2) AN A/B PERF CONTROL MUST BE LIKE-FOR-LIKE IN THE DIMENSION YOU WILL QUOTE** (5.1's control was
    **vacuous twice** before it measured anything, and both failures were silent). *(i)* The first draft
    applied the same-size change to control and measured path, so both documents had **identical geometry**
    and the anchor had nothing to correct — **0 px drift on every cell**, a control that could never have
    gone positive. **Fix: render an identical byte/paragraph/heading count and merely MOVE the block**
    (below for the control, above for the measured path), so render cost stays comparable while the
    geometry genuinely shifts. *(ii)* Drift read at the 2nd rAF reported **2738 px contained but 2 px
    full-page** — because `:host` is `scroll-behavior:smooth` and the write was **still animating**, while
    the contained pane (`auto`) had already landed. **A plausible wrong answer on exactly one surface.**
    → **Read geometry after a SETTLE, never on the timing frame** — and note the trap is *per-surface*, so
    a control that looks sound on one surface can be silently vacuous on the other.
  - **(3) A POSITIVE CONTROL THAT *SAMPLES* CAN READ EMPTY WHEN THE EVENT DID HAPPEN — AWAIT IT.** The
    prescription retro 2026-07-19 (finding 1) carried as a watch item **has now been executed**, and this
    records that it is DONE so nobody re-opens it: `remoteMedia.browser.test.ts`'s opt-in control now
    **AWAITS** the Resource-Timing entries to a 5 s budget instead of sampling the buffer at one instant,
    and returns the buffer so a genuine failure still fails on the caller's own `toContain` with a real
    diff. **Evidence: 22/22 consecutive runs green, both engines**; a deliberate break (await a URL that is
    never fetched) goes red on both. **The zero-check is untouched and stays a genuine zero-check** — you
    cannot await something that should never arrive. → **The structural reason only that file ever flaked,
    which is the transferable part: the other six zero-network guards' controls are `await fetch(probe)`,
    so the test awaits the fetch promise ITSELF, whereas `remoteMedia`'s requests are engine-initiated
    `<img>` loads the test never awaited.** If one of the six ever does flake, **promote the awaited helper
    to a shared test util** rather than patching in place.
  **Revisit-when:** a shared browser-test helper module is created (plan §4-7 already names the duplicated
  `flush()`/`afterFrames()`/`waitFor()` as load-bearing) — these three belong in it, and (1) should
  *replace* `waitForScrollable` at that point rather than sit beside it.

- **2026-07-21 · DECISION (spec 005 task 4.5; the root cause and the measurements live in
  `vitest.config.ts`'s own comment at the point of use — this entry exists so the DECISION is findable
  from the memory files, and deliberately does not duplicate it) · THE BROWSER PROJECT RUNS SERIAL
  (`fileParallelism: false`), GLOBALLY, NOT FIREFOX-ONLY.** In-browser test files share ONE browser window
  per engine and its **viewport is a window-global property**, so one file's `page.viewport()` resize lands
  under another file's scroll-geometry measurement — **a plausible wrong position, never an error**, at
  ~40% of runs.
  - **Why global rather than the narrower per-instance option, from the numbers:** global serial **62 s**,
    Firefox-instance-only serial **57 s**, parallel **26 s but ~40% flaky**. Vitest genuinely accepts
    per-instance `fileParallelism` (`BrowserInstanceOption`), so the narrow option was real, not
    hypothetical — it was **rejected because ~5 s does not buy an asymmetric, harder-to-explain config**
    ("why is only Firefox serial?") while the whole suite runs in under a minute. The +36 s is **dev/CI
    wall-clock only; `pnpm test:browser` time is not a shipped metric.**
  - **NO assertion was weakened, and that is the load-bearing half.** Every one of those geometry checks is
    a red-first-proven guard. **The harness-vs-product argument was ARGUED, not asserted:**
    `--no-file-parallelism` fixes it **while the same test still resizes the same viewport**, so the only
    variable that flips pass→fail is cross-file concurrency. *(Generalised in retro.md 2026-07-21,
    finding 3 — "it's the harness" needs an isolating variable, because it is otherwise the most convenient
    explanation available for a real defect.)*
  **Revisit-when:** the browser suite's serial runtime reaches **minutes rather than seconds** — then the
  per-instance option (or isolating just the full-page geometry suites) earns its complexity, and the
  numbers to beat are recorded above. **Do not revisit by re-enabling parallelism and re-running until it
  passes**; the failure is ~40%, so a green run proves nothing.

- **2026-07-21 · PRODUCT DECISION, TAKEN BY THE HUMAN AT THE 005 7.1 GATE · THE WATCH PILL IS NOT
  DISCOVERABLE, AND IT SHIPS AS-IS — because the fix is ONBOARDING, and inventing chrome at a gate is how
  you get unwalked UI.** Asked whether they would have found the watch control unaided, the human said
  **no**. It sits bottom-left, **third in a stack** (network → theme → watch), unlabelled until looked at.
  This is the gate's only finding and it is **recorded as a carried item, not filed as a defect.**
  - **THE PLACEMENT IS NOT THE PROBLEM, AND THAT IS ESTABLISHED BY MEASUREMENT RATHER THAN DEFENCE.**
    4.1 chose bottom-left with a throwaway probe on both engines: **top-right** is the mode toggle, and the
    row beneath it lands **inside the TOC handle**; **bottom-right** is inside the TOC rail's box *and its
    live entry list, which runs past the viewport bottom*; **top-left** is the remote-load pill's corner.
    Bottom-left was **the only corner clearing everything**. There is no better rect to move it to.
  - **"IN A CORNER THE USER CAN SEE" AND "DISCOVERABLE" ARE DIFFERENT PROPERTIES.** The probe answered
    occlusion and collision — the M3 defect-#6 class — and answered them correctly. It could not answer
    *"would someone know this feature exists?"*, and nobody claimed it did. **A measured placement is not
    a discoverability argument**, and conflating the two would have let a correct measurement certify a
    property it never observed. That is the same shape as the golden-pin correction of record (5.1) and the
    vacuous-control class (retro 2026-07-19, finding 1): **a pin certifies exactly the stage it observes.**
  - **WHY SHIP RATHER THAN FIX IT NOW.** Discoverability is an **onboarding** problem (product spec **F11**),
    and **005 has no onboarding surface** — no first-run state, no hint primitive, no coach-mark. Every
    available fix means **inventing new chrome at the gate**: a new corner, a new dismissal contract, a new
    stacking context, and a new set of geometry assertions against the five pieces of chrome already in the
    corners — **the same reasoning that made 4.2 skip the toast**, for the same reason. And chrome invented
    at a gate is chrome nobody walks: the gate is the last scheduled human pass, so anything added after the
    walk ships unwalked. **The honest move is to name the gap and carry it**, not to close it with UI that
    would itself be unverified.
  - **WHAT IS NOT CLAIMED.** This is not a finding that the pill is *wrong*, and not evidence that watch is
    unusable — a user told the feature exists finds and operates it fine (the rest of §10 passed). It is a
    finding that **the product does not TEACH the feature**, which is a different and later problem.
  **Revisit-when:** an onboarding surface lands (spec F11) — that is the natural home and the pill should be
  on its list; **or** a first-run hint becomes cheap on an existing surface, in which case it is a small,
  walkable addition rather than a new subsystem. **Do NOT revisit by moving the pill** — 4.1's rects are the
  answer to that question and they have not changed.

- **2026-07-21 · MEASUREMENT (spec 005 task 5.1a, taken at the 7.1 human gate) · THE OPFS OBSERVER-LATENCY
  INFERENCE IS CONFIRMED ON LOCAL DISK — and this entry exists because "it matched" is the outcome nobody
  writes down.** With a production build loaded and a real picker-opened folder rewritten from outside the
  browser: **a small file updates INSTANTLY; the 1 MB file updates in A FEW MILLISECONDS.** 5.1's harness
  numbers (**18.7 ms @ 50 KB · 109.5 ms @ 1 MB**, measured on OPFS) **did not under-predict local disk.**
  - **IT CLOSES A NAMED INFERENCE, WHICH IS THE WHOLE POINT.** 5.1 measured on **OPFS** — the only handle
    obtainable without a user gesture, since `showDirectoryPicker` opens a native dialog Playwright cannot
    drive (recorded M2 limit) — and **refused to quote it as a disk number**, giving it a named home
    (5.1a) instead of a footnote. **A confirmed inference is evidence; an unrecorded one stays a guess**,
    and the gap between those two is invisible unless someone goes and looks.
  - **IT IS THE COUNTER-EXAMPLE TO RETRO FINDING 2, and that is why it is worth an entry.** That finding's
    precedent — 004's isolated probe under-predicting the real path by **~13×** — is precisely why OPFS was
    distrusted here. **This time the isolated probe held.** The precedent is not overturned by one
    counter-example; it becomes **a rule with a known exception**, which is more useful than either alone.
    The distinguishing feature worth carrying: 004's probe under-predicted because it omitted work the real
    path did, whereas OPFS's suspected error was in the opposite direction (no filesystem watcher, no atomic
    rename, no OS notification queue — all reasons disk could have been **slower**, and it was not).
  - **THE LIMIT OF THE CONFIRMATION, STATED SO IT IS NOT OVER-READ: the gate instrument is COARSER than the
    harness instrument.** A human watching a reader update cannot resolve 18.7 ms from 109.5 ms and did not
    try. What is confirmed is the **magnitude class** — sub-perceptual at both sizes, no OS-level penalty
    large enough to see. **It does not produce rival disk figures and the table keeps its OPFS provenance.**
  - **CONSEQUENCE, RECORDED BECAUSE 5.2 NAMED IT AS A TRIGGER:** disk latency does **not** dwarf the OPFS
    inference, so the cost-proportional cooldown's headroom is unchanged and **no 5.2 revisit is owed on
    that ground**. (The other 5.2 trigger — "laggy at normal sizes" — also did not fire: §6 of the gate.)
  **Revisit-when:** a real observer-latency *number* on disk is ever needed (this gives a class, not a
  figure), or a harness appears that can drive a local-disk handle — per the harness ledger there is still
  no roadmap to one.

- **2026-07-21 · STANDING RULE + FINDING (spec 005 task 4.8, found by a HUMAN at the 7.1 gate) · LOGIC
  DOES NOT LIVE IN A WXT ENTRYPOINT, BECAUSE NO TEST CAN LOAD ONE — and the third instance of one defect
  class in this milestone is what established it.** Watch on the content-script `file://` surface detected
  every change and rendered NONE of them: the registered `WatchTarget` was 4.1's placeholder, whose
  `start(host)` ignored the host and called **`detector.start(() => {})`**. Measured with the extension
  loaded: background `fetch("file:///…/small.md")` → **200, 28623 bytes**; a patched `self.fetch` logged
  **88 calls over ~90 s** during a live watch; **zero re-renders**. The same file through the app page
  updated correctly — same detector, same `mount()`, same cooldown, different registered target.
  - **IT WAS RECORDED TWICE AND ACTED ON ZERO TIMES.** 4.1's note said the adapter delivers no re-render
    and that 4.2 would replace it in the same slot; **4.2 replaced it in `appShell.ts` only**. The
    2026-07-21 4.6 entry below then restates the mechanism verbatim — *"the content script uses the thin
    `registerWatchDetector` adapter (no re-render callback, no `onError`)"* — as evidence for a DIFFERENT
    argument (why a file-access note was unreachable), and neither the agent nor the reviewer connected it
    to *"so watch does nothing there."* **A correct observation filed under the wrong conclusion is not
    caught by re-reading the notes; it is caught by a test or by a human using the product.**
  - **THE CLASS: `observerDetector` wired to nothing (4.7), the pill absent on the first file opened
    (4.7), and this (4.8) — three in one milestone, one cause.** Every watch test calls
    `registerWatchTarget(createWatchController({…}))` **itself** before mounting. That is a good way to
    test the controller, the pill and the registry, and it is exactly why all of them passed: **no test
    ever asks which target PRODUCTION registers.** `peekover.content.ts` is the worst case of it — a WXT
    entrypoint imports the virtual `#imports` module, so **neither Vitest project can load that file at
    all**. Anything decided there is verified by code review and nothing else.
  - **THE RULE, going forward: an entrypoint wires; it does not decide or construct.** Everything the
    content script decided moved into `src/watch/contentWatch.ts` (`installContentWatch`), leaving three
    values that are genuinely WXT/engine-bound — `location.href`, `browser.runtime.sendMessage`,
    `!import.meta.env.FIREFOX`. `runReader.ts` set this precedent for the render path and `detectorForFile.ts`
    for 4.7; 4.8 makes it the standing rule rather than a per-task instinct. **Not in `watchRelay.ts`,**
    which the BACKGROUND imports: a real controller pulls `watchController → mount →` the render pipeline
    into the service-worker graph and into a node-environment unit test.
  - **THE PLACEHOLDER WAS DELETED, NOT KEPT AS A DELEGATE — and 4.1's own D-E precedent does not apply.**
    `registerWatchDetector` had one caller (now gone); `getWatchDetector` and `resetWatchDetectorForTest`
    had **none anywhere**, including tests. D-E keeps a name as a delegate when the name still has call
    sites and a compat obligation. This one had neither, and the thing it would delegate cannot be built
    correctly at all — a bare `ChangeDetector` has nowhere to render TO, which IS the defect. **Dead code
    that looks live is what caused this**, so a smaller copy of it left loaded for the next surface is the
    same mistake at a discount.
  - **THE PIN THAT GENERALISES IT** (`src/watch/contentWatch.test.ts`, verified RED against the pre-4.8
    tree, naming `src/watch/watchRelay.ts`): **every production `registerWatchTarget(...)` call site must
    build its target with `createWatchController`** — the only thing in the codebase that holds a host,
    calls `mount` and wires `onError`, i.e. the only target any suite has proven can render. Plus three
    source-text pins on the entrypoint, using the `WATCHABLE_EXTENSIONS` precedent (reading it as TEXT is
    the only access a test has to a WXT entrypoint).
  - **A SECOND USER-FACING FIX CAME FREE:** the placeholder passed no `onError`, and `DEAD_AFTER_FAILURES`
    is controller-owned — so a file deleted while watched on this surface failed **silently and forever**,
    pill still reading "Watching". It now stops and explains, asserted rather than assumed.
  **Revisit-when:** a `WatchTarget` is ever legitimately hand-built (then the class pin is the thing to
  argue with, on purpose), or a harness appears that can load an extension and run a content script —
  which is the only thing that would have caught this automatically, and per the harness ledger there is
  still no roadmap to one.

- **2026-07-21 · CLOSED — AND THE FIRST CONCLUSION WAS WRONG, FALSIFIED BY THE HUMAN AT THE GATE (spec 005
  task 4.8) · The `"Unsafe attempt to load URL file:///…/small.md from frame with URL
  file:///…/small.md"` console line is CHROME'S OWN BEHAVIOUR ON `file://` DOCUMENTS. It is NOT Peekover —
  not watch, not the relay, not the render path, not `applyMediaPolicy`.** Seen by the human at 7.1 while a
  watch was running, alongside 88 demonstrably successful background reads. 4.8's investigation concluded it
  was render-time media in the document; **two measurements at the gate killed that**, and this entry
  records the settled answer, not the first one.
  - **MEASUREMENT 1 — THE LINE APPEARS WITH THE EXTENSION DISABLED**, on that same document. None of our
    code is running, so nothing of ours can be emitting it or causing it to be emitted. That alone settles
    it: this is the engine's behaviour on a `file://` document, independent of Peekover.
  - **MEASUREMENT 2 — THE FIXTURE CONTAINS NO IMAGES AT ALL.** `grep -n '!\[' small.md` → **nothing**.
    `small.md` is `## Section N` headings and lorem ipsum prose, generated by an `awk` one-liner. The
    media explanation required media the document does not contain.
  - **WHAT THE FIRST INVESTIGATION GOT RIGHT — kept, but as supporting detail, not as the finding.** The
    product makes **exactly one `fetch` anywhere**, `entrypoints/background.ts:46` (grep over every loader
    in `src/` and `entrypoints/`). Nothing in the page frame loads any URL: `isRenderableContext` is a pure
    string predicate and `relayRead` is `sendMessage` only, asserted as a property in
    `watchNetwork.browser.test.ts`. **No zero-network implication either way:** everything resolving to
    `http(s)` is replaced by an inert placeholder inside the `<template>` *before* commit, and 2.3 measured
    that a `file:` read never enters Resource Timing at all. All of that remains true — it just was not the
    answer to this question.
  - **WHAT IT GOT WRONG, AND THE FAILURE MODE WORTH REMEMBERING.** A throwaway probe showed that
    `![alt]()` renders `<img src="">`, resolves to the document's own URL, and **can** produce exactly this
    error shape. That was then treated as evidence that it **did**. It does not follow. The investigation
    was thorough, correctly scoped, and correctly flagged-not-fixed — and still landed wrong, because
    **it never checked whether the document contained what its own explanation required.** The human closed
    it in two minutes with a grep and an extension toggle.
  - **SEPARATELY — AND NOT CONNECTED TO THIS ERROR — AN UNVERIFIED QUESTION FLAGGED FOR 006.** *Does Chrome
    refuse `file:`→`file:` subresources without `--allow-file-access-from-files`, so that **local images in
    a `file://` markdown document never display**?* This was originally inferred from the media chain above
    and inherits none of its credibility now that the chain is falsified; the error line has nothing to do
    with media. **It is a real question and worth asking anyway** — it would be a product gap rather than
    console noise, and it is invisible to every existing test (they run on `http://localhost`, where the
    same references are correctly blocked as remote instead). **It is UNVERIFIED, and nothing here has
    tested it.** What would actually answer it: a `file://` markdown document containing a genuine local
    `![](./some.png)`, opened with the extension on, checking whether the image paints. `small.md` had no
    images, which is precisely why the original reasoning could not have been checked against it.
  **Revisit-when:** the error line itself is settled — do not reopen it. The 006 question above is open and
  needs the one measurement named there before anyone treats it as a finding.

- **2026-07-21 · IMPLEMENTATION SHAPE (spec 005 task 5.3) · HOW THE COST-PROPORTIONAL COOLDOWN IS BUILT —
  three structural properties a reasonable future edit would break silently.** The *decision* and its
  rationale are the 5.2 entry immediately below; this entry does not restate them. It records only what
  the shipped mechanism's correctness rests on, because none of it is self-evident from reading
  `watchController.ts` and each failure mode is quiet rather than loud.
  - **THE TIMER IS DELIBERATELY NOT RE-ARMED PER CHANGE, and re-arming it is the obvious "fix" that
    reintroduces the failure 5.2 rejected.** `onText` sets one `setTimeout` aimed at `readyAt` and leaves
    it alone; later changes inside the cooldown only overwrite the single `pendingText` slot. **Pushing
    the deadline out on every change IS a trailing debounce**, which **starves** against an agent that
    never stops writing — the reader would simply stop updating. The code looks like a debounce and must
    not be completed into one. `flushPending` re-checks the clock and re-arms only for the *remainder* if
    it fired early, so **the cooldown is defined by the clock, not by whenever the timer happened to
    run** — which is also what makes an early-firing timer harmless rather than a lost cooldown.
  - **THE `now` CLOCK IS INJECTED BECAUSE THE DISTINGUISHING PROPERTY IS OTHERWISE UNTESTABLE.** What
    separates this from any fixed window is *proportionality to a render's measured cost*, and a jsdom
    render costs nothing measurable — on the real wall clock a fixed-250 ms impostor and the shipped
    mechanism are indistinguishable at small sizes. With an injected `now` the property is exact: a 10 ms
    render waits 10 ms, a 400 ms render waits 400 ms, and the impostor fails with `expected 250 to be
    less than 30`. **If a future refactor drops the injected clock for `performance.now()`, the
    cost-scaling test stops proving what shipped** even while staying green.
  - **THE "A DOCUMENT SWITCH DISCARDS THE PENDING RENDER" PROPERTY HAS TWO INDEPENDENT GUARDS — `stop()`
    cancels AND `start()` cancels — so breaking either one alone leaves the whole suite GREEN.** It is
    asserted directly (stop → `start(hostB)` → no render, and no render ever carrying `hostB`), never
    inferred from the stop test, precisely because the stop test cannot see a half-broken state.
    Breaking both exposes what is actually at stake: `"A: pending -> HOST B"` — **file A's text rendered
    into file B's host**, 4.3's cross-feed bug one level up. **A future edit that removes one guard as
    redundant removes a layer with nothing going red.**
  - **The update signal fires per RENDER, not per change** — so a coalesced burst is ONE flash, not
    twelve. That follows from where the call sits (inside `renderNow`), and moving it to `onText` would
    restore per-keystroke flashing while every coalescing test stayed green.
  - **The polled paths are untouched by construction:** at 1 Hz a ~50 ms cooldown never binds, and
    `mount()`, the detectors and `WATCH_INTERVAL_MS` were not modified. The mechanism is controller-only.
  **Revisit-when:** 5.2's revisit conditions (7.1 reports lag at normal sizes; 5.1a's disk latency dwarfs
  the OPFS inference) — the *shape* above is what any such change has to preserve, and the multiplier is
  the knob, not the structure. Also revisit if a second caller ever sets `preserveReading`: the cooldown
  currently assumes one controller owning one host at a time, which is what makes a single pending slot
  sufficient.

- **2026-07-21 · HUMAN DECISION GATE (spec 005 task 5.2) · THE WATCH DEBOUNCE IS A COST-PROPORTIONAL
  COOLDOWN, NOT A FIXED MILLISECOND WINDOW.** Recorded BEFORE 5.3 writes a line — that ordering is 5.2's
  own verify criterion and it is 004's D-2 pattern, the split that stopped a budget-breaching gate from
  shipping when 4.1's inference did not survive 4.2's measurement.
  - **THE MECHANISM.** After each render, refuse the next until roughly as long as that render TOOK has
    elapsed **since it FINISHED** (multiplier **1.0** — the reader gets as much idle as it just spent
    rendering; any other multiplier would be an unmeasured threshold). Changes arriving inside the
    cooldown are **COALESCED, NOT QUEUED**: at most ONE pending render, and **the newest text wins**.
    This is a viewer, not a log — nobody needs to see the intermediate states of a file being written.
    The **first** render after a watch starts has no prior cost, so it renders **immediately**: be
    responsive by default, throttle only on evidence.
  - **WHY, FROM 5.1's MEASURED NUMBERS** (progress.md § Baselines / pins → *Watch-mode numbers*):
    - **50 KB renders in ~35 ms synchronous / ~50 ms to the 2nd rAF ⇒ a ~50 ms cooldown**, far below the
      1 s poll interval. **Effectively invisible at realistic sizes** — at the sizes agents actually
      write, this mechanism does nothing at all, which is the point.
    - **1 MB blocks ~717 ms synchronous / ~806 ms to the 2nd rAF ⇒ a ~800 ms cooldown**, so under a
      continuous rewrite the main thread is roughly **half free instead of not at all**.
  - **WHY IT BECAME A LIVE PROBLEM AT 4.7, having not been one before.** The observer now fires within
    **~19 ms** of a write on Chromium's app page (5.1(a)), and `mount()` is **synchronous** — callbacks
    cannot interleave, they **QUEUE**. Ten changes arriving during an 800 ms render is ~8 s of solid
    blocking. Before 4.7 every shipped path polled at 1 Hz and a burst was **unreachable**; wiring the
    observer is what made it reachable.
  - **ALTERNATIVES REJECTED — recorded so they are not re-litigated:**
    - **A fixed window below 1000 ms is a NO-OP on every polled path.** Renders there are already capped
      at one per second, so it would coalesce nothing and add lag. A fixed window ABOVE 1000 ms would
      throttle the polled paths for no measured reason.
    - **A pure trailing debounce STARVES.** It waits for N ms of *quiet*; an agent writing continuously
      never provides quiet, so the reader would stop updating **entirely** — failing at the exact
      workload watch exists for.
    - **Ship nothing** was defensible while the observer was unwired, and was the standing
      recommendation until the 4.7 grep. 4.7 made bursts reachable, so it no longer is.
  - **THE UNCERTAINTY, RECORDED RATHER THAN HIDDEN:** it is **not established that 1 MB is a realistic
    watched-file size.** Agent-written specs and CLAUDE.md files are typically 5–50 KB, where this
    mechanism never binds. It ships anyway because it **self-calibrates**: if large files never occur,
    the cooldown never fires, and the cost of being wrong is ~50 ms of lag nobody perceives.
  **Revisit-when:** 7.1 reports the reader feels laggy at NORMAL sizes (loosen the multiplier, or remove
  the mechanism); or **5.1a**'s local-disk observer latency turns out far larger than the OPFS inference
  — which would change the **headroom**, not the shape (a later-noticed change has more idle before it,
  not less).

- **2026-07-21 · HARNESS LEDGER ADDENDUM (spec 005 task 5.1) · THREE limits found while building
  `scripts/perf-watch.ts`. Two are new; the third is the one that decides what the observer number means.**
  - **`page.evaluate(functionString, arg)` SILENTLY RETURNS `undefined`.** Playwright evaluates a STRING as
    an expression, so `(async (a) => {…})` yields a function object, the arg is never applied, and the
    result serializes to `undefined` — **no throw, no warning.** This is the harness equivalent of this
    milestone's recurring failure class: a plausible wrong answer, never an error. It cost one full
    measurement run before the `undefined` was traced. **The fix, and the rule for any future harness in
    this repo: pass parameters by INLINING them into the evaluated source** (`JSON.stringify` them into a
    template), never through Playwright's `arg` when the code is a string. `perf-theme-flash.ts` and
    `perf-first-paint.ts` never hit this because every one of their snippets is an immediately-INVOKED
    expression taking no argument.
  - **The extension origin's CSP blocks `page.addScriptTag`, but `page.evaluate` goes through CDP and is
    NOT subject to it.** So injecting a measurement bundle into a `chrome-extension://` page (needed here:
    OPFS requires a secure, non-opaque origin, which a `file://` page is not) must go through `evaluate`.
  - **THERE IS NO AUTOMATED ROUTE TO A LOCAL-DISK `FileSystemHandle`, and this bounds what any harness can
    ever say about observer latency.** `FileSystemObserver.observe()` needs a handle; the only handle
    obtainable without a user gesture is **OPFS** (`navigator.storage.getDirectory()` — task 1.2 measured it
    fires real `["modified"]` records in Chromium). `showDirectoryPicker` needs a gesture AND opens a native
    dialog Playwright cannot drive (recorded M2 limit). **Consequence: every automated observer-latency
    number this project can produce is an INFERENCE about local disk** — OPFS has no filesystem watcher, no
    atomic rename, no OS notification queue. 5.1 measured it (18.7 ms @ 50 KB, 109.5 ms @ 1 MB) and labelled
    it as an inference in the script output, in progress.md and in its own task record. **Retro finding 2 is
    the standing precedent for why that labelling is not pedantry:** 004's isolated probe under-predicted
    the real path by ~13×. The real number is a human-gate item (tasks.md 5.1a → 7.1).
  - **Also recorded so it is not re-derived: `mount()` is not reachable from the main world** (the content
    script's isolated world exports nothing), so a real-engine measurement of it must bundle the source and
    inject it. `perf-watch.ts` does that with esbuild reached through `tsx`'s own dependency — **no
    devDependency was added, and `dependencies` stays at three.** The alternative — a test-only export in
    shipped code — is forbidden: no measurement-only code ships (established when 004's task 4.2 removed
    4.1's marks).
  **Revisit-when:** Playwright grows a way to drive the file picker or install an extension into Firefox
  (either would collapse a recorded gap); or Firefox ships `FileSystemObserver`.

- **2026-07-21 · HARNESS LEDGER ADDENDUM (extends the 2026-07-19 "WHAT THE TEST + MEASUREMENT HARNESSES
  CAN AND CANNOT DO" entry) · Vitest's browser API port is HARDCODED and can collide with a Windows
  reserved range — `pnpm test:browser` then runs ZERO tests with an `EACCES`, not a test failure.**
  Measured at 4.5 on this machine (i7-13700, Windows 11).
  - **Symptom:** `pnpm test:browser` exits with `Error: listen EACCES: permission denied ::1:63315`,
    `Test Files no tests`, `Duration ~45ms`. It reads like the harness is broken; it is not — the browser
    provider cannot bind its server port.
  - **Cause:** Vitest's `defaultBrowserPort = 63315` (`vitest/dist/chunks/constants.*.js`), and on this
    machine `netsh interface ipv4 show excludedportrange protocol=tcp` lists **63230–63329** as a
    Windows/Hyper-V/WinNAT dynamic reservation — 63315 falls inside it, so `listen` gets `EACCES`. These
    reservations are assigned at boot and vary between machines and reboots, which is why 4.1–4.4 never hit
    it and this session did.
  - **The CLI flag does NOT fix it:** `--browser.api.port=51234` was ignored — the run still tried 63315.
    The working override is `browser.api.port` set in `vitest.config.ts` (the browser project's `browser`
    block).
  - **The override is LOCAL-ONLY and deliberately NOT committed** — it is orthogonal to anything the
    project tests (it only chooses which port the server binds), and hardcoding a port would be worse for
    everyone whose reserved range differs. All of 4.5's measurement + 12/12 verification and 4.6's browser
    runs used a temporary `api: { port: 51234 }` that was stripped before each commit.
  **Revisit-when:** Vitest makes the default port configurable via CLI/env, or moves off a
  commonly-reserved port. Until then: a future session seeing `EACCES` on `::1:63315` with zero tests run
  should add `browser.api.port` locally (a free port outside `netsh ... show excludedportrange`) and NOT
  commit it.

- **2026-07-21 · FINDING (spec 005 task 4.6, INVESTIGATED — premise FALSIFIED, no code shipped) · The
  Chrome content-script "Allow access to file URLs" concern is UNREACHABLE, so `isAllowedFileSchemeAccess`
  was NOT wired.** 4.6 assumed a fresh-install Chromium user (file access OFF by default) would get a
  running content-script watch whose background reads fail → 3 failures → 4.3's dead-read note ("moved,
  renamed, or deleted"), a misdirection. **Two independent facts falsify the premise:**
  - **(1) One toggle gates BOTH injection and the read.** Chrome exposes exactly ONE per-extension "Allow
    access to file URLs" setting (verified: `chrome.extension.isAllowedFileSchemeAccess()` docs — "the
    user-controlled per-extension 'Allow access to File URLs' setting"; return type `Promise<boolean>`,
    Chrome 99+ MV3, present in WXT's `browser.extension` namespace). That same toggle gates whether a
    `file:///*.md` **content script is injected at all** (match-patterns docs: `file:///` "requires the
    user to manually grant access") AND the **background's `file://` read** (this repo's own 2.3 record got
    `status 200` only because the 7.1 procedure enables it). There is no separate toggle. **Therefore a
    content script that is *running* on a `file://` page necessarily has access granted → the background
    read works.** On a fresh install (toggle OFF) the content script is never injected, so it shows no
    control and no note — the misdirection cannot occur. `isAllowedFileSchemeAccess()` would return `true`
    on every file:// surface where the script runs, making a file-access-denied note an UNREACHABLE branch
    (this codebase forbids unreachable branches — `watchAvailability.ts`: "Every branch is reachable").
    **So the current hardcoded `backgroundCanReadFileUrls: !import.meta.env.FIREFOX` is CORRECT for the
    file:// content-script surface.**
  - **(2) The content script has no dead-read policy anyway.** It wires the thin 4.1
    `registerWatchDetector` adapter (`start(){ detector.start(()=>{}) }` — no re-render callback, no
    `onError`), NOT `createWatchController` (which owns `DEAD_AFTER_FAILURES`). `createWatchController` is
    used ONLY by `appShell.ts` (the app page). So 4.6's "3 failures → dead-read note fires on the content
    script" cannot happen — that note is app-page-only.
  - **THE REACHABLE ANALOGUE, proposed for the human, NOT implemented:** the content script offers a watch
    control on the REMOTE `http(s)` raw surfaces too (raw.githubusercontent / gist / gitlab-raw /
    bitbucket-raw), where `isWatchableFileUrl` refuses every relay read (non-`file://`) and watching remote
    is explicitly out of 005's scope. Today, given (2), clicking it silently does nothing. The clean,
    SYNCHRONOUS fix (no async query, no mount-ordering problem) is to gate the content-script watch on
    `isWatchableFileUrl(location.href)`, so remote surfaces get an explanation (or no control) instead of a
    control that cannot work — the same honesty posture 4.4 took for Firefox. Left for a human scoping
    decision; it changes 4.6's copy and verify criteria, so it is not smuggled in.
  - **Verified how far it could be:** the API's existence + contract (docs + WXT types) and the single-
    toggle behaviour (docs + repo 2.3/7.1) are conclusive. The one step needing a loaded extension —
    observing that the content script does NOT inject with the toggle off — is a 5-second 7.1 check, not a
    guess this milestone should build on.
  **Revisit-when:** Chrome ever decouples file-URL content-script injection from file-URL read access
  (would make `isAllowedFileSchemeAccess` load-bearing here), or the human scopes remote-surface watch.

- **2026-07-19 · FINDING (spec 005 task 2.3, HUMAN-RUN with a loaded extension) · Can a background
  `fetch("file://…")` read a local file, and does that read enter the Resource-Timing buffer? MEASURED on
  both engines.** This closes spec §7-1 and §7-4, the two questions no automated harness could answer (the
  browser test page runs on an `http://localhost` origin and the harness loads no extension).
  - **Q1 — does a background `fetch("file:///…")` resolve with the file's bytes?**
    - **CHROMIUM (background service worker, "Allow access to file URLs" ON):** `{ status: 200, bytes: 845 }`
      — **resolves, fresh bytes.** Confirms and re-measures the task-0 result.
    - **FIREFOX 152 (background page, `moz-extension://…/_generated_background_page.html`): THREW.**
      Console, verbatim:
      `Security Error: Content at moz-extension://<id>/_generated_background_page.html may not load or link to file:///D:/Dev/peekover/README.md.`
      then `TypeError | NetworkError when attempting to fetch resource.`
      **This is Gecko's URI security policy, not a missing toggle or manifest key** — a `moz-extension:`
      document may not load `file:`. **No permission fixes it**; Firefox has no "Allow access to file URLs"
      equivalent to grant. Do not "fix" this by requesting permissions or editing the manifest.
  - **Q2 — does the read appear in `performance.getEntriesByType('resource')` from the background context?**
    **`[]` on BOTH engines.** Chromium's successful `file://` read leaves no Resource-Timing entry; Firefox's
    refused one leaves none either.
  - **CONSEQUENCE 1 — FIREFOX WATCH IS APP-PAGE-ONLY.** The content-script surface **cannot** watch on
    Firefox: the content script cannot re-read its own file (task-0: `fetch` → `TypeError`, XHR → `status 0`,
    **even with file-URL access**) **AND** the background cannot read `file://` either. **Both halves of the
    only available route are closed** — there is no third path. **Chromium is unaffected**: its background
    reads `file://` fine, so its content-script relay stands as designed. Spec §3.5 narrowed in the same
    commit as this entry (C12); 4.4 ships the designed explanation for this surface too, not a dead control.
  - **CONSEQUENCE 2 — SPEC §7-4 ANSWERED, BOTH ENGINES: a `file://` read never enters the Resource-Timing
    buffer.** So the existing `/^https?:/i` zero-network guards are **CORRECT, not merely conveniently
    scoped** — there is nothing for them to filter out. **§3.6-A's premise now holds on the measurement, not
    just on the prose.** State the flip side plainly rather than letting a later reader over-read the result:
    the guards can prove watch put **nothing on the wire**, and can **never prove the local read happened**.
    A watch loop that silently stopped reading would pass every zero-network assertion we have.
  - **CONSEQUENCE 3 — one dead branch removed** (`entrypoints/background.ts`, same commit). The read fn
    carried `if (!response.ok && response.status !== 0)` with a comment claiming a `file://` fetch reports
    `status: 0` on a **successful** read in some engines. **That was an unverified assumption and this
    measurement falsifies it:** Chromium returns **200**; Firefox never resolves at all, so the branch cannot
    run there either. The escape hatch was dead code justified by a false comment. Simplified to a plain
    `!response.ok`.
  **Revisit-when:** Firefox changes its extension-page URI security policy, or ships a file-access grant
  (either would reopen the content-script surface on Firefox and un-narrow §3.5).

- **2026-07-19 · FINDING (spec 005 task-0 probe) · Watch-mode feasibility, MEASURED on both engines and
  both surfaces.** The probe was throwaway and is deleted; this entry is the only surviving record.
  - **CHROMIUM 150 — app page.** Feature detect: `showDirectoryPicker` ✓ · `FileSystemObserver` ✓ ·
    `showOpenFilePicker` ✓ · `FileSystemFileHandle`/`DirectoryHandle` ✓ · `DataTransferItem.webkitGetAsEntry` ✓.
    **`FileSystemObserver` WORKS.** `observe(fileHandle)` accepted; callbacks fire with `type:"modified"`,
    `changedHandle {kind:"file", name:"small.md"}`, `relativePathComponents []`, `relativePathMovedFrom null`,
    `root` = the same file handle. Fired for **both** agent-style appends (`echo >>`) **and** editor saves.
    **NO atomic-rename problem observed** — no `disappeared`+`appeared` pair, so the predicted worst case did
    not materialise on this machine. **File-level observation is viable; directory observation was not needed.**
    Survived **10+ minutes idle** and kept firing — no silent death, no service-worker interference (the probe
    page is a full tab). **Watch mode here is EVENT-DRIVEN: no polling loop, no interval tuning, no size-aware
    backoff.**
  - **LATENCY IS UNMEASURED — do not quote a number.** The one sample recorded (5127 ms) is dominated by
    HUMAN time: the MARK button was clicked, then the human alt-tabbed and typed the command. A clean run
    (`mark`, then `sleep 5 && echo >>`) was never performed. Treat observer latency as an open measurement,
    not as "5 seconds".
  - **FIREFOX 152 — app page.** Feature detect: `showDirectoryPicker` ✗ · `showOpenFilePicker` ✗ ·
    `FileSystemObserver` ✗ · `FileSystemFileHandle` ✓ · `FileSystemDirectoryHandle` ✓ · `webkitGetAsEntry` ✓.
  - **TRAP 1 — the handle types EXIST as constructors but there is NO WAY TO OBTAIN ONE** (no picker). That is
    the OPFS half of the API without the local-disk half. **Feature-detect on `showDirectoryPicker`, NEVER on
    the handle constructors** — the obvious detect gives a FALSE POSITIVE on Firefox.
  - **Firefox PICKER path (`<input webkitdirectory>` → cached `File`): PERMANENTLY STALE.** Polled ~45 ticks
    across a real on-disk edit; `lastModified` and `size` never moved and `.text()` never returned new content.
    Not viable.
  - **Firefox DRAG path (`webkitGetAsEntry` → `FileSystemFileEntry`, `entry.file()` called FRESH each tick):
    WORKS.** 3 appends → 3 `TEXT CHANGED (FRESH BYTES)` detections, confirmed against `wc -c` (128 → 161 bytes).
  - **TRAP 2, and the expensive one: on the drag path `size` and `lastModified` are FROZEN AT DROP TIME and
    never update — only `.text()` reads fresh from disk.** Change detection **MUST compare CONTENT**. The
    obvious implementation (poll `lastModified`, re-read when it changes) would compile, pass a naive test,
    and **SILENTLY NEVER FIRE**.
  - **Firefox polling cost, measured:** small file ~0–1 ms read · 1.12 MiB file **~2–8 ms per tick** (open ≈0 ms
    because `entry.file()` is cheap; the cost is `.text()`). A 1 s interval is affordable even at 1.12 MiB —
    but note this reads the **whole file every tick** to detect change.
  - **BOTH ENGINES — content-script surface (`file://` page).** Measured on **Chromium**, with **"Allow access
    to file URLs" GRANTED**. The content script **CANNOT re-read its own file**: `fetch` → `TypeError "Failed
    to fetch"`; XHR → `status 0`. Both plain **and** cache-busted. **The `file://` origin restriction applies to
    the content script regardless of the file-URLs toggle** — it is not a permissions problem, so do not "fix"
    it by requesting more permissions. The **BACKGROUND CAN**: `fetch("file:///D:/…")` returned `status=200`
    with FRESH content (len=161, matching the on-disk byte count at that moment). **XHR is unavailable in the
    MV3 service worker (`ReferenceError`) — fetch only.**
  - **UNCONFIRMED on Firefox, and do NOT assume it transfers:** Firefox has no "Allow access to file URLs"
    toggle and its background may not fetch `file://` at all. If it cannot, **the content-script surface has NO
    watch path on Firefox.**
  - **CONSEQUENCE 1 — SPLIT DESIGN, both halves evidenced:** Chromium event-driven (observer); Firefox polled
    and **DRAG-ONLY**, comparing **content, not metadata**.
  - **CONSEQUENCE 2 — two surfaces, two routes:** the app page uses handles directly; the content script must
    **RELAY through the background** (the same pattern 004 established for settings).
  - **CONSEQUENCE 3 — OPEN QUESTION THE SPEC MUST ANSWER (raised at teardown):** a background
    `fetch("file://…")` is a **real fetch through the same API the zero-network guards watch** (AGENTS.md #1,
    and the Resource-Timing assertions in `tests/browser`). Reading a local file is not a network call in
    spirit, but it **is one mechanically**. Spec 005 needs a deliberate classification — does it light the
    network indicator, is it excluded from the zero-network assertions, and how do the existing guards
    distinguish it — **or the first honest guard we write trips on our own watch loop**.
  - **CONSEQUENCE 4 — Firefox content-script watch: UNKNOWN.** Needs a probe if the spec wants to promise it.
  **Revisit-when:** Firefox ships `showDirectoryPicker` or `FileSystemObserver` (either would collapse the
  split); or Chromium's observer changes behaviour on atomic saves (this machine's editor did not trigger the
  rename path — another might, and the file-level design depends on it not doing so).

- **2026-07-19 · FINDING (promoted at the M4 progress.md archive) · DISPROVED HYPOTHESES AND DEAD ENDS —
  the things we tried that did NOT work. Recorded so no future session re-spends the debugging cycle.**
  These cost real time to establish and none of them is a "decision", which is exactly why they would
  otherwise have been archived with the milestone narrative that produced them.
  - **`ServiceWorker.stopAllWorkers` (CDP) does NOT terminate an extension's MV3 service worker.** It is
    accepted without error and the target SURVIVES. **`Target.closeTarget` DOES** — it returns
    `{success:true}` and the target disappears. This is how `scripts/perf-theme-flash.ts` defines a "cold"
    run (task 4.1). "Cold" therefore means *no running worker process*, deliberately NOT a fresh profile —
    a fresh profile would cold-start the browser and its disk cache too, conflating three variables.
  - **Playwright's `ctx.serviceWorkers()` STILL LISTS A TERMINATED WORKER.** It is a client-side cache that
    is never pruned, so a liveness check written against it reports every successful termination as a
    failure — it cost a full debugging cycle at 4.1. **`Target.getTargets` is the browser's own answer and
    is the authority.** Do not re-check worker liveness through the Playwright object.
  - **The silent-MediaQueryList quirk is NOT garbage collection, and NOT the `emulateMedia(null)` afterEach
    teardown.** Symptom (task 3.2): a listener installed in one browser test stops receiving emulated OS
    flips in LATER tests. **Both hypotheses were probed and BOTH are disproved** — holding a strong
    reference to the MQL did not fix it, and removing the `emulateMedia(null)` teardown did not fix it.
    The mechanism is internal to Playwright's `emulateMedia` override lifecycle and remains **UNPINNED**.
    **It is scoped to the TEST BOUNDARY and is not a product defect:** the standing guard *"theme runtime —
    ONE listener, MANY flips"* flips the emulated OS twice against a single install inside one test and is
    green on both engines (and goes red if the handler removes itself after one fire), so one listener
    serving the page's whole lifetime is proven. `resetThemeWatchForTest()` exists for **test isolation**,
    not as a workaround for a runtime limitation. Nothing production does resembles the quirk: a real page
    has one media state that changes, never an override swapped out beneath it.
  - *(Already recorded elsewhere, listed here only so the category is complete: **"a detached node doesn't
    fetch" is FALSE** in Blink and Gecko — 2026-07-14 below; **the settings isolation probe under-predicts
    the content-script path ~13×** — 2026-07-18 below.)*
  **Revisit-when:** the MQL quirk is worth re-probing only if it starts affecting a test that cannot be
  isolated with `resetThemeWatchForTest()`; the two CDP facts revisit if Playwright/CDP changes under us
  (a `pnpm perf:flash` cold run reporting no worker to kill is the signal).

- **2026-07-19 · FINDING (promoted at the M4 progress.md archive) · WHAT THE TEST + MEASUREMENT HARNESSES
  CAN AND CANNOT DO. Standing capability ledger — check it before planning coverage for a property.**
  - **The vitest `browser` project loads NO unpacked extension.** There is no background service worker, no
    content-script injection, and `browser.runtime` has no receiving end. Consequence, stated once for all
    of `tests/browser/`: the **real content→background `runtime.sendMessage` transport has never been
    exercised by any test**, on any milestone. Suites prove both halves independently by injecting a fake
    through the **production seam** (`registerSettingsSink` / `publishSettings`), which proves our half of
    the contract and nothing about the bus. It also never navigates, so a "re-mount" is not a reload.
  - **`scripts/perf-first-paint.ts` and `scripts/perf-theme-flash.ts` are CHROMIUM-ONLY BY CONSTRUCTION.**
    They use `chromium.launchPersistentContext` + `--load-extension`, a Chromium flag. Playwright cannot
    load an extension into Firefox: **microsoft/playwright#7297 is CLOSED as out-of-scope (2024-12-03)**,
    with later requests folded into it, and `playwright-core@1.61.1` contains no `installAddon` /
    `installTemporaryAddon` (grepped). **This is a HARD limit with no roadmap item to wait for — not a
    pending upstream fix.** Every first-paint and flash number in this repo is Chromium. **Firefox first
    paint has no automated coverage at all** and is evidenced solely by the milestone-close human gate.
    (Unadopted third-party escapes exist: `playwright-webextext`, Selenium/geckodriver `installAddon`,
    `web-ext`.)
  - **THE LEVER THAT MOVES THE GATE-ONLY BOUNDARY: server-side Playwright browser commands.** `vitest.config.ts`
    exposes `emulateReducedMotion` (added 003) and `emulateColorScheme` (added 004, `page.emulateMedia`).
    Both are **verified on Chromium AND Firefox**: `matches` flips, a **real `change` event** fires, and CSS
    media rules re-evaluate. Playwright drives the browser from outside the page, so it can move platform
    state no in-page API can fake. **When a property looks human-gate-only, ask whether a server-side
    command can reach it before accepting it as human-only** (retro 2026-07-19, finding 5).
  - **What stays gate-only regardless:** how the chrome LOOKS — contrast, legibility, opacity, occlusion,
    z-order, "is the document still the hero". Geometry and computed tokens measured a fully TRANSPARENT
    rail perfectly (M3 defect #6). Computed style is the strongest thing an engine can assert; it is not
    an eye.
  - **jsdom cannot see:** bytes on wire (loads no subresources), cascade/computed custom properties, rAF +
    layout ordering, pointer geometry. Zero-network and remote-media guards live in the browser project by
    standing rule (2026-07-14).
  **Revisit-when:** playwright#7297 is reopened or a maintained Firefox-extension driver is adopted (that
  would retire the Firefox-first-paint gate item); or the browser project gains a real extension load, which
  would let the message bus be tested and retire the largest named human-gate item.

- **2026-07-19 · PROCEDURE (promoted at the M4 progress.md archive) · THE MILESTONE-CLOSE HUMAN GATE:
  BUILD AND LOAD, BOTH ENGINES. Every milestone ends with this; it should never be re-derived.**
  Generalizes and supersedes-by-extension the Firefox-only note of 2026-07-16 (which stands, unedited).
  - **Build FRESH PRODUCTION output for each engine — never gate a dev build.**
    `pnpm build` → `.output/chrome-mv3/` · `pnpm exec wxt build -b firefox` → `.output/firefox-mv3/`
    (**mv3**, not mv2 — we target MV3 on Firefox). `pnpm zip` produces the store packages; the Firefox run
    also emits `peekover-<v>-sources.zip` (the AMO source bundle, ~1.6 MB) — that is **not** the shipped
    artifact and must not be measured against the 2 MB bound.
  - **Chrome:** `chrome://extensions` → Developer mode → **Load unpacked** → `.output/chrome-mv3/`. Then
    open the extension's details and enable **"Allow access to file URLs"** — without it the content script
    never injects on `file://` pages and the reader appears simply not to work (see
    `docs/trust/PERMISSIONS.md`).
  - **Firefox:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** →
    `.output/firefox-mv3/manifest.json`. **Temporary add-ons do not survive a browser restart** — reload
    after every rebuild and after every restart.
  - **THE PROCEDURE TRAP, RESTATED BECAUSE IT READS EXACTLY LIKE A CODE DEFECT:** a **stale or dev** load
    shows a `localhost` CSP warning in the console and a **dead reader**. That is a load/procedure error.
    **Rebuild and reload the production output before diagnosing anything.** (Cost a scare at the 003 gate;
    2026-07-16.)
  - **Gate conditions, every time:** both engines · **both surfaces** (content-script full-page `file://`
    doc AND the app-page reader pane) · **Network tab open throughout** · console watched. Walk the spec's
    checklist **in risk order**, hardest-to-automate first. Standing acceptance regardless of milestone:
    **zero unexpected network · no console errors · every degraded/empty state renders (never blank) · the
    document stays the hero.**
  **Revisit-when:** a store/browser changes how unpacked or temporary extensions load, or the browser
  project gains a real extension load (which would move items OFF this checklist — but per retro
  2026-07-19 finding 5, only when something else can *observe* the property, never because the gate has
  been quiet).

- **2026-07-19 · Spec 004 (groups 5–6) · STORED settings and APPLIED theme live in TWO modules, on
  purpose. `src/settings/settingsSeam.ts` owns the stored side; `src/theme/reader.ts` keeps the applied
  side. They are deliberately NOT unified.** The split: the seam exports `currentSettings()` /
  `onSettingsChange()` / `saveSettings()` / `registerSettingsSink()` / `publishSettings()` — the
  persistence vocabulary, the last-written `Settings` value. `reader.ts` keeps `currentThemeSetting()` /
  `onThemeSettingChange()` — the theme runtime's **applied** state, what is actually painting right now.
  **WHY NOT ONE MODULE (the whole point):** those two answers legitimately DIVERGE. Under `theme: 'auto'`
  an OS light/dark flip changes what paints while the stored setting is never touched — the user chose
  "auto" and still has "auto". Collapsing the two would force one value to answer both questions and
  destroy exactly the distinction D-2 was written to preserve; a consumer asking "what is on screen"
  would get "what is in the database" and be wrong every time the OS moves.
  **WHY A SEAM EXISTS AT ALL:** the settings port is never threaded into the render path. Doing so would
  have meant four-to-five signature changes across two call chains (both entrypoints → shell/mount →
  render → tocView) to deliver one value to a leaf, on a path where the content-script surface renders
  once per navigation. A module-level seam that the entrypoints register into, and leaves subscribe to,
  keeps the render functions' signatures unchanged and the side effects in the entrypoints where
  AGENTS.md puts them.
  **WHY IT DID NOT CHURN GROUP 5:** the generalization was a PURE MOVE. `themeControl.ts` still exports
  `registerThemeSaveSink` / `resetThemeSaveSinkForTest` as **delegates** to the seam, so every group-5
  call site and test file stayed byte-unchanged and both theme browser suites stayed green untouched.
  The delegates are kept deliberately, not left behind as debris.
  **REVISIT WHEN:** a second setting develops its own applied-vs-stored divergence (a TOC width the
  layout overrides, say). Then the pattern is a general `applied` layer beside the seam — NOT merging
  the two into one value. Merge only if `auto` ever stops existing, which spec 004 §4 makes unlikely.
  Full narrative: progress.md group-5 and group-6 (6.1 D-E) entries — not restated here.

- **2026-07-18 · Spec 004 D-2 CORRECTION OF RECORD (task 4.2): the paint gate was BUILT, MEASURED and
  REMOVED. The shipped mitigation is D-2's own fallback — mount Auto + an INSTANT re-theme.** This is
  the D-2 entry below firing its OWN revisit-when, not a reversal of the human's call. **WHY:** D-2
  made the block arm conditional on 4.2 re-measuring 4.1's untested inference that gating before the
  mount would make cold settings availability ≈26 ms. Measured in the gated configuration: **~72 ms**.
  The isolation probe still reproduces (0.4 ms warm / 5.6 ms cold), so the background is genuinely
  nearly free — the probe simply **under-predicts the content-script path by ~13×**, because it
  measures an idle, already-loaded extension page while a content script at `document_start` competes
  with an active navigation. **Standing correction: never infer in-page availability from that probe
  again** (recorded in-code at `measureSwWake`). **THE BUDGET DATA (50 KB cell, same build + session):
  gate 75 ms → cold 172.7 ms; gate 40 ms → cold 172.9 ms; NO gate → cold 137.7–148.2 ms**, against the
  <150 ms first-paint budget. Halving the deadline moved cold by **0.2 ms**, which is the decisive
  fact: **the ~25–35 ms cost is not the length of the wait.** The most likely MECHANISM is that
  deferring the mount at all takes it off the DOMContentLoaded turn it otherwise rides — but that was
  **NOT instrumented; it is a hypothesis, not a measurement**, and only the deadline-insensitivity is
  measured. (Labelled deliberately: 4.2 exists precisely because 4.1's un-remeasured inference
  (~26 ms) did not survive contact, so an un-instrumented causal claim in the same record must be
  marked rather than inherited as fact.) So no deadline both gates the warm case
  (settings land ~21.5 ms, before the ~60 ms natural commit) and stays free on the cold one — and the
  gate bought nothing measurable, since warm was already flash-free without it. **CONSEQUENCE:** the
  content entrypoint applies the persisted theme via `setThemeSetting` on `load()` and nothing in the
  render path awaits it, so never-blank is **structural** on this path rather than a tuned timeout;
  `runReader.ts` is behaviourally unchanged by 004. Shipped: 50 KB warm 139.5 ms / cold 137.7 ms, both
  inside budget, **no-flash 24/24** measured directly off production's `data-theme` at the paint rAF.
  **THE RESIDUAL, STATED PLAINLY:** cold start is a race we win, not one we cannot lose — ungated cold
  runs land the theme and the paint in the SAME main-thread turn (+0.1 ms deltas), 4.1's "photo finish"
  cliff. The tradeoff accepted is **a rare cold-start flip** over **a ~25 ms budget breach on every
  cold typical-doc open**. **Revisit-when:** the human gate (8.1) actually SEES a flip on a cold start,
  or the first-paint budget gains enough headroom to afford the ~25 ms deferral cost — at which point
  the gate must be **REBUILT, not restored**. It exists in **NO commit**: the implementation and its
  7 jsdom orchestration tests were discarded mid-task by a `git checkout src/render/runReader.ts
  src/render/runReader.test.ts` BEFORE they were ever committed, and its browser tests were
  overwritten when `themeFlash.browser.test.ts` was rewritten — also never committed. There is
  nothing to `git revert`. Rebuilding is straightforward because the DESIGN is fully described in
  this entry: a `themeReady` seam on `RunReaderOptions`; a `THEME_GATE_MS` deadline of its own;
  deferral with remembered finality, so the settings wait composes with the Gecko
  source-not-ready retry; and `openGate` on settle-or-deadline-or-rejection.
- **2026-07-18 · Spec 004 D-2 (decision gate 4.1a): the theme-flash mitigation is BLOCK-UNTIL-READ,
  with its OWN short paint-gate deadline, falling through to Auto + an INSTANT re-theme.** The
  content-script reader defers its first mount attempt until the persisted theme is in hand, bounded
  by a gate deadline of its own; if the gate expires first, the reader mounts themed-Auto and the
  late-arriving setting re-themes it immediately. **WHY (the numbers, task 4.1 — full table + caveats
  in `docs/ai/progress.md`, group 4; not restated here):** the background's real cost is **0.4 ms warm
  / 5.0 ms cold** (the isolation probe, which is the honest measure — the in-page cold `resolved`
  figures are a main-thread DELIVERY wait, not service-worker cost), `port.load()` fires at
  `document_start`, and the mount does not commit until **~60 ms**. So in every measured cell the
  settings are available BEFORE the natural mount, and gating costs **~0 ms in the common case**. The
  138.9 ms cold `resolved` figure is an artifact of the mount itself blocking delivery — gating
  *before* the mount is exactly what removes it. **THE TWO DEADLINES ARE DIFFERENT NUMBERS DOING
  DIFFERENT JOBS and must not be conflated:** the paint gate is **~75 ms from nav start** (paint lands
  ~72.6 ms after commit; the <150 ms budget therefore allows a commit by ~77 ms; the natural commit is
  60.4 ms → **~17 ms of slack**), while `LOAD_TIMEOUT_MS` (**1500 ms**) is the dead-background backstop
  living under runReader's 3 s never-blank floor. They differ **~20×**; inheriting 1500 ms as the paint
  gate would blow the typical-doc budget by an order of magnitude.
  **SUB-DECISION (a) — NO CROSS-FADE. The late-arrival path does an INSTANT theme swap.** The plan's
  "softened by a `prefers-reduced-motion`-respecting cross-fade" wording is **superseded**. An instant
  swap is trivially reduced-motion-safe and adds no code; a cross-fade is a *visual* property that no
  test we can write is able to certify — M3 defect #6 established that occlusion/appearance is
  **human-gate-only** (a fully transparent rail measured perfectly in every geometry test). We do not
  ship a visual affordance whose only correctness check is a human's eye on a path that, by this
  decision, should almost never run.
  **SUB-DECISION (b) — BLOCK-WITH-FALLTHROUGH SUBSUMES "TRANSITION". There is no separate transition
  design to build.** If the gate resolves in time → no flash. If it expires → mount Auto and re-theme
  on arrival, which *is* the transition behaviour. The plan's block-vs-transition framing described
  one mechanism with two arms, not two mechanisms.
  **CONSEQUENCE:** 4.2 implements one gate in `runReader` + the entrypoint; the instant re-theme needs
  **no new code** — group 3's `setThemeSetting()` already broadcasts through the theme registry to
  every registered host. **Revisit-when:** (i) 4.2's post-gating `pnpm perf:flash` re-measure
  contradicts the inference that gating before the mount makes cold availability ≈26 ms — the ~26 ms
  figure follows from the isolation probe and was **never measured in the gated configuration**; if the
  50 KB cells breach <150 ms, fall back to mount-Auto + instant re-theme (i.e. open the gate at 0 ms);
  or (ii) the first-paint budget itself changes, since the gate's ~17 ms of slack is derived from it.

- **2026-07-17 · Spec 004 D-1: sepia DEFERRED from the themes milestone (plan gate 2).** 004 ships
  **auto/light/dark** + persistence + TOC carry-over; sepia does not activate this milestone. **WHY:**
  `design/tokens.css` — the stated source of truth — defines only **4 of ~15** sepia tokens
  (`--paper`/`--ink`/`--accent`/`--accent-soft`); the rest fall through to light, so a sepia reader would paint
  **light chrome (code/tables/rail/pills) on sepia paper**. Completing the palette is a **brand/design
  decision, not an implementation fill** — the spec §3.5 verify-first escalation firing exactly as written,
  surfaced at the plan gate rather than filled silently. The 004 runtime is built **surface-neutral** to sepia
  (one extra `data-theme` value everywhere), so activation later is additive. **CONSEQUENCE:** spec §3.5
  rewritten to a deferral, the §4 "sepia completeness" acceptance dropped from 004's set, and a §6
  out-of-scope line added (f4e11f5). Full detail: `specs/004-themes-settings/plan.md` §0 D-1; spec §3.5
  (amended). **Revisit-when:** a designed, contrast-checked sepia palette exists in `design/tokens.css` — then
  activate sepia as its own small task (the completed token block + one `data-theme` option + a human-gate LOOK
  check for contrast / the on-highlighter literal-hex trap).
- **2026-07-17 · Spec 004 gate-1 direction: settings persist WITHOUT a new manifest permission
  (`permissions:[]` kept).** Settings live in the existing `peekover` IndexedDB (new `settings` store); the
  content-script reader reaches it via a message to the extension background (its own origin can't see the
  extension DB); the app page reaches it directly. **WHY:** preserves the M2 "`permissions:[]` survived" trust
  headline (spec §6 / PERMISSIONS.md) rather than spending `storage` on a settings feature. **CONSEQUENCE:** no
  cross-device sync this milestone — the product spec's `storage.sync` path (§9 / §6.17 / F7) is deferred as a
  later, deliberate #4 event, scoped on its own when sync value justifies the permission. Full detail:
  `specs/004-themes-settings/spec.md` §3.1. **Revisit-when:** cross-device sync is wanted (then scope the
  `storage` permission + PERMISSIONS.md + manifest-pin change as a #4 event).
- **2026-07-17 · M3 CLOSE (spec 003 — in-reader TOC / navigation): implementation complete, awaiting
  the 6.2 human gate.** The reader gained an auto-generated table-of-contents rail that serves BOTH reader
  surfaces (content-script full-page + app-page contained pane) from ONE implementation. Recorded so a later
  spec builds on it, not around it:
  - **ONE-seam compose.** `buildTocModel(root)` + `buildTocView(host, model, {contained})` are pushed into
    the SAME `children[]` array `mount()` commits with its single `shadow.replaceChildren(...)` — the M2
    "one seam, every branch funnels through it" win reused verbatim, so both surfaces get the TOC with zero
    per-surface branching. The raw-fallback path stays TOC-free (banner + raw `<pre>` — never-blank #5).
  - **Navigation is by element REFERENCE, never a URL hash.** Each entry button carries its exact heading
    node (`entry.headingRef`) in a module-level `WeakMap`; click/Enter calls `scrollIntoView({block:'start'})`
    on that carried ref (the same node 2.1's identity test guards and 3.1 scrolls — one ref, not two
    derivations). **No heading `id` is added → the M1 sanitize `id`-closure (DOM-clobbering surface, dropped
    2026-07-14) stays SHUT**, and the shadow-DOM fragment gap (spec §9) is sidestepped. URL/history untouched.
  - **Scroll-spy roots on the shadow-host scroll box, resolved PER SURFACE** (not assumed `:host`): full-page
    → `:host`; contained → the nearest ancestor pane that actually scrolls (`.peekover-app__reader`), resolved
    by COMPUTED overflow. Active section is read from LIVE `getBoundingClientRect` per recompute (observer +
    rAF-coalesced scroll listener as triggers), NOT from stale `isIntersecting` snapshots; the trailing-short-
    section edge is handled by promoting the final entry at scroll-bottom. Observer disconnected on teardown.
  - **Right-side rail, present at ≥2 headings** (0/1 → omitted — a single-entry TOC has no nav value); initial
    open/collapsed decided from the reader's own `:host` scrollport width (`initialTocOpen`), reflected as
    `data-toc` on the host. Right (not left) keeps the app page's left folder-pane and the section-nav rail
    visually distinct. While open, the reading column reserves exactly the rail's `--toc-w` (opaque
    `background:var(--paper)` + column `margin-right`) so the rail never overlaps or underlaps the text.
  - **Keyboard toggle = backtick `` ` ``** (plan-gate override of the plan's `t`), via a module-level host
    `Set<HTMLElement>` that `mount()` fills/empties; the resolver prunes any `!isConnected` host AND requires
    a live rail before toggling. Guarded EXACTLY like readerMode's `\` (bare key, no Ctrl/Cmd/Alt, ignored in
    input/textarea/select/contenteditable) and distinct from it — the two never collide.
  - **Sizes / perf / first-paint (measured, group 5; the byte-identity M2 invariant is deliberately spent per
    spec §Surface-scope).** Content script **284,744 B** (+13,865 B / +5.12% vs M2 270,879 B — the whole TOC
    feature), byte-identical both engines; `pnpm zip` **323.63 kB Chrome / 323.69 kB Firefox, < 2 MB**.
    First-paint re-run PASSES both parts: **(a) ≤50 KB nav→paint 133.5 ms < 150 ms; (b) 1 MB = the ~1400-entry
    pathological TOC 1196.3 ms < 1.7 s** — no regression (the rail's ~45 ms JS build rides inside the mount
    path, lost in the ~750 ms browser layout of the 1400-section reader). `perf:toc`: rail build ~45 ms @1401
    headings (jsdom upper bound), scroll-spy ~4.4 ms/frame @1401 — **no threshold asserted** (M1 retro rule).
    **The chunked/virtualized TOC-tree render is a measurement-informed LEVER, not a forced change:** the
    ~45 ms/1401 build scales ~linearly and is fine for typical docs; the one-node-per-heading cost at
    pathological counts is the same suspect as the folder tree. **Revisit-when:** a real document reaches
    N-thousand headings (then virtualize the TOC-tree render); OR heading permalinks / deep-links land (they
    need heading `id`/slugs → a security-reviewed re-opening of the sanitize `id`-closure, out of 003); OR the
    frontmatter render-options feature lands (the intended home for a document-declared initial TOC state); OR
    spec 004 settings persists TOC open-state / width (003 is per-view only). The contained-surface reduced-
    motion gap is separately recorded (2026-07-16, plan §3-#2 false for the app-page box); the `\`-app-page
    inert-shortcut gap is recorded immediately below.

- **2026-07-17 · CARRIED HARDENING: the `\` (Raw/Reading) shortcut is inert on the app page — 003 did NOT
  retrofit it.** `installToggleShortcut()` resolves its target via `document.querySelector('peekover-root')`
  (`readerMode.ts`), which is the content-script host but returns `null` for the app-page reader host
  (`<div class="peekover-app__reader__host">`) — so `\` is already inert on the app page (a latent 002 gap,
  not surfaced by 002's gate). 003's TOC backtick toggle works on BOTH surfaces because `tocView.ts` registers
  each mounted host in its own registry; 003 deliberately did **not** retrofit `\` onto that registry, because
  it touches `readerMode` + its tests for no 003 benefit. Recorded here (not only in plan §6-#1 / §9-#4) so the
  inconsistency (TOC toggle works app-page; `\` still doesn't) is visibly deliberate. **Revisit-when:** a
  settings/hardening pass, or the next time `readerMode`'s shortcut host-resolution is touched — unify both
  shortcuts on one host registry.

- **2026-07-16 · FINDING (task 3.3): the app-page (contained) reader is reduced-motion-safe by
  ACCIDENT, not by design — plan §3-#2 is FALSE for the contained surface.** The contained reader
  scrolls `.peekover-app__reader` — a **light-DOM** element whose CSS lives in the app shell
  (`appShell.ts`, `overflow:auto`, **no `scroll-behavior`**), NOT the shadow `:host`. `scrollIntoView`
  reads `scroll-behavior` from that scroll box, so contained is **INSTANT in both modes** (measured,
  both engines, 3.3). **Why it matters:** plan §3-#2's "CSS `:host{scroll-behavior}` governs on BOTH
  surfaces" does not hold here — `readerCss.ts`'s `:host` reduced-motion override (the smooth default
  + `@media(prefers-reduced-motion:reduce)` reset) never reaches that light-DOM box, so the contained
  surface's reduced-motion safety is **incidental (instant-always)**, not enforced. Latent hazard: if
  anyone later adds `scroll-behavior:smooth` to `.peekover-app__reader` for parity, it would be smooth
  in **both** modes and silently violate `prefers-reduced-motion` on the app page, because the override
  isn't co-located with that box. **Revisit-when:** smooth-scroll parity on the app page is wanted, OR
  before any app-shell scroll-CSS change — add a reduced-motion-aware `scroll-behavior` to
  `.peekover-app__reader` (or take the §3-#2 JS `behavior` fallback in the 3.1 handler). Carried to
  6.1 for the plan §3-#2 revisit.

- **2026-07-16 · Firefox manual-gate loads MUST come from a FRESH production build (testing
  procedure, not a code decision).** `wxt build -b firefox` → load `.output/firefox-mv3/manifest.json`
  (note: **mv3**, not mv2 — we target MV3 on Firefox). A stale or dev Firefox load shows a `localhost`
  CSP warning and a dead reader; that is a load/procedure error, not a code defect — rebuild and reload
  the mv3 output before diagnosing. (Lesson from the task-2.2 human gate.)

- **2026-07-15 · M2 CLOSE (spec 002 — active-source foundation): the trust model was
  COMPLETED, not compromised.** M2 gave Peekover its second surface — a dedicated app page
  that reads a chosen folder of markdown from disk — and did it **without spending a single
  manifest permission**. The settled architecture, recorded so 003 builds on it, not around it:
  - **`permissions: []` survived M2 (the headline).** Folder access is reached entirely through
    **user-gesture web APIs** (File System Access `showDirectoryPicker` on Chromium; `<input
    webkitdirectory>` + drag `webkitGetAsEntry` on Firefox/picker-disabled). These add no
    manifest permission and no install-time warning — so consent lives in the **at-use, visible,
    revocable, re-prompted** flow, not an install dialog. The only manifest add is the toolbar
    `action` key (no popup → background `action.onClicked` → `tabs.create` of the extension's own
    `app.html`), which needs no `tabs`/WAR. CI-pinned by `tests/manifest.test.ts` (both engines).
  - **Second surface = a dedicated full-tab extension page** (not a popup, not a new-tab
    override). Task-0-verified: `showDirectoryPicker()`/`requestPermission()` work on a full-tab
    `chrome-extension://` page but the SW can't run them and the popup `AbortError`s. The M1
    render pipeline is reused **unchanged as a library** (`mount(text, host)`); the app page is a
    new caller, `src/render/*` untouched all milestone.
  - **The `FolderSource → MarkdownFile[]` seam** is the one engine boundary: everything above it
    (pure `tree`/`filterTree`, `treeView`, `readerPane`, recents/pins, storage panel) is
    engine-agnostic, and Firefox's read-only-snapshot limits ride as **capability meta**
    (`persistable:false`), never an engine sniff downstream. Designing the seam up front paid off:
    the group-4 drag-and-drop drop-in and the group-5 reopen wiring both funnelled through the
    SAME `applyOutcome`/`paintGranted` with zero duplication.
  - **Storage = a raw-IndexedDB local wrapper (`idbCore`), no `idb` dependency** — three stores
    (`folders`/`recents`/`pins`), the handle persisted as a **structured-cloneable capability ref,
    never file contents**. It shipped WITH its trust controls (`describeStored`/`wipeAll`), and
    group 6 gave those a **visible surface** (the "Stored data" panel + inline-confirm wipe) — the
    gap the group-5 manual gate surfaced. `getAll` is key-order (unordered); display order is the
    pure `recents` module's job.
  - **Eager, bounded, interruptible walk** (`walkPolicy`): markdown-filter + skip-list
    (node_modules/dotdirs) + hard file/depth cap + cancel token. Eager because name-search needs
    the full set; the cap is what makes a pathological tree surface "folder too large" instead of
    hanging (perf-measured: the cap holds at 5000 files against a 304k-file tree, ~40 ms).
  - **The test-honesty split (decision 4, held verbatim):** the automated real-engine test proves
    our **query→request→gate mechanism** via an OPFS/controllable-permission handle; the disk
    `prompt`-after-reload / `NotAllowedError` re-prompt ground truth is **NOT automatable** (OPFS
    always reports `granted`) and is confirmed at the **human gate + platform docs**. No stub
    masqueraded as platform proof — the same discipline gated the 6.2 perf harness (render/layout
    + disk reopen deferred to real-browser/human, not faked in jsdom/node).
  Revisit-when: 003+ adds a capability that needs a real manifest permission (re-open the ledger,
  AGENTS.md #4); the chunked/virtualized-render lever lands (decided from a real-browser tree
  render measurement, the deferred half of 6.2); or multi-folder *project* semantics arrive.

- **2026-07-14 · CORRECTION OF RECORD: "a detached node doesn't fetch" was FALSE in
  Blink AND Gecko; the remote-resource commit shipped a real pre-opt-in fetch leak.** The
  mechanics entry below claimed `mount()` was safe because it built the reader root
  DETACHED (`document.createElement('div')` + `innerHTML`) before neutralizing. That
  premise is wrong: a `createElement('div')` is owned by THIS document, which HAS a
  browsing context, so assigning `root.innerHTML = html` dispatches the remote `<img>`
  fetches AT THAT LINE — upstream of `applyMediaPolicy`, and synchronous removal
  afterward does not cancel the in-flight request. So every remote image in a rendered
  doc leaked one request on first paint, before any opt-in. **The property that actually
  prevents the fetch is an INERT document with no browsing context** — a `<template>`'s
  `.content` or `DOMParser` output, NOT "detached-ness". Probe evidence (throwaway
  real-engine tests, both engines): a same-origin `<img>` mounted via the old path
  produced Resource Timing entries for all three probe URLs in Chromium AND Firefox
  (`http://localhost:PORT/__peekover_probe__/…`); parsing the same HTML into a
  `<template>` produced zero. **Fix:** `mount()` now parses the sanitized HTML into a
  `<template>`, runs `applyMediaPolicy()` on that inert fragment, then adopts the
  already-neutralized nodes into the reader root (`root.append(tpl.content)`) and commits
  as before — a remote `src` never materializes in a fetching document. `applyMediaPolicy`
  already takes any `ParentNode`, so it accepts the `DocumentFragment` unchanged.
  **Why it hid for a whole commit:** the class of bug is BYTES-ON-WIRE, and jsdom loads
  no subresources — the `mount.test.ts` NO-LEAK (final-DOM-shape) and ORDERING
  (neutralize-before-`replaceChildren`) tests both stayed GREEN through the entire leak,
  because the leak fires at `innerHTML`, upstream of the DOM checkpoints they inspect.
  It was caught only at the human Network-tab manual gate. **Standing rule going forward:
  remote-media / zero-network guards MUST live in the browser project** (real Chromium +
  Firefox, asserting on Resource Timing = bytes on wire), not jsdom —
  `tests/browser/remoteMedia.browser.test.ts` is that guard (RED-first proven: 3 leaked
  requests both engines pre-fix; GREEN post-fix; and it also asserts opt-in DOES fetch so
  we did not over-correct). The jsdom NO-LEAK/ORDERING tests are kept but downgraded in
  trust to DOM-shape guards (comments added). golden `images.html` unchanged (identical
  neutralized output); sizes flat (content 270.58 kB, zip 152.99 kB); image-free 1 MB
  perf flat (median ~1388 ms). Revisit-when: any new remote-media surface (audio/video,
  SVG `<use>`, CSS `url()`), or the sanitize/mount seam changes how HTML reaches the DOM.
- **2026-07-14 · Remote-resource policy — implementation mechanics.** (Implements the
  earlier default decision below. NOTE: the "detached subtree has no browsing context"
  claim in this entry is CORRECTED by the entry above — the safe property is an inert
  document, and the original implementation leaked; kept for history.) Filled the
  `applyMediaPolicy` seam
  (`src/render/mediaPolicy.ts`). **Neutralization happens in an INERT context, before
  commit** — the load-bearing rule: inserting an `<img src="http…">` into the LIVE DOM
  fires the fetch immediately, so stripping `src` *after* commit has already leaked the
  request. `mount()` already builds the reader root DETACHED (`createElement` + `innerHTML`
  — a detached subtree has no browsing context and fetches nothing), so we run the policy
  on that root and only then `replaceChildren()` it into the live shadow tree. A `mount()`
  no-leak test commits the real pipeline to a live jsdom DOM and asserts zero fetchable
  `src`/`srcset` anywhere; non-vacuity was proven RED-first by no-oping the policy (3 remote
  `IMG[src]` leaked) then GREEN on restore. **Classification is by the scheme a URL RESOLVES
  to against the page URL** (`document.baseURI`), not string inspection: the SAME `./pic.png`
  is *local* on a `file://` page (→ `loading="lazy"`, no network) but *remote* on a raw-git
  `https://` page (→ blocked). http/https (incl. protocol-relative) → blocked; `file:` on a
  file page → allowed+lazy; `data:`/`blob:`/unresolvable → inert (and `data:` is already
  stripped from `<img src>` by sanitize's own hook). A blocked image's `<img>` is REMOVED and
  replaced by an inert themed placeholder (`<span>`, valid inline; label + alt text); the URL
  rides on `data-peekover-src` (+ `data-peekover-srcset` defensively — `srcset` is not in
  sanitize's ALLOWED_ATTR today, so it does not survive, but the policy stays correct if that
  changes). **Opt-in is per PAGE-VIEW, a direct consequence of `permissions:[]`** — there is no
  storage, so preference cannot be persisted; the "N remote images blocked · Load" pill restores
  the stored URLs as real `<img loading="lazy">` for this view only, and a reload re-blocks (the
  pill's tooltip says so). **Network-indicator semantics:** a `data-network="active"` attribute on
  the host (like `data-theme`/`data-mode`) that CSS keys a persistent corner light off; it is set
  the moment the user opts in and stays for the rest of the view, and is NEVER shown otherwise
  (chrome is added only when >0 images were blocked). Uses `--del` (the one warm accent) as an
  honest "you have left the zero-network default" signal. **UX precedent:** the email-client
  pattern ("images not shown · load images") — familiar, trust-building, and the exact shape users
  already understand; our differentiator is that competing markdown viewers load remote media
  by default. Raw view is untouched (policy applies to the rendered reader only). Revisit-when:
  the load mechanism evolves (e.g. a settings-persisted allow, which needs storage → a permission),
  or non-`<img>` remote media (audio/video/SVG-use) enters the allow-list.
- **2026-07-14 · First-paint gate rescoped from a size-sweep: <150 ms protects the TYPICAL doc, the
  1 MB case gets its own honest bound.** The single `<150 ms on the 1 MB fixture` acceptance line was
  written PRE-measurement; measurement (5.2/5.2b) put it ~8× over and showed why the number is
  unreachable on a 1 MB `file://` doc within the settled design, for two structural reasons: (1) a
  **browser parse floor** — DOMContentLoaded on a 1 MB doc is hundreds of ms of the browser's own
  parse we cannot precede, and we must WAIT for a readable, COMPLETE source before mounting (reading a
  partially-streamed `<pre>` would silently truncate a large doc; the Gecko fix reinforced that source
  readiness is engine-dependent); and (2) the reader's **own layout** — building the ~1400-section
  rendered DOM adds ~750 ms, the cost that now dominates first-paint after the document_start pass
  removed the raw-`<pre>` flash. A size sweep (`scripts/perf-first-paint.ts --size`, same protocol: 7
  runs, cold discarded, median of warm 6, two invocations; i7-13700, Windows, headless chromium)
  measured nav→paint medians: **10 KB → ~78–82 ms, 50 KB → ~118–122 ms (both PASS <150 ms); 200 KB →
  ~345–347 ms; 1 MB → ~1187–1310 ms (FAIL, ~8×).** Decision (human-approved): the gate is now two-part
  — (i) typical doc (≤50 KB): nav→paint median <150 ms [PASS]; (ii) 1 MB: no raw-text flash
  (manual-verified in both engines) + reader painted within an honest bound **<1.7 s** (~25–30%
  headroom over the measured median) [PASS]. This is NOT softening a threshold to force a pass: the
  ≤50 KB tier genuinely meets 150 ms on its own; 200 KB (~345 ms) marks where a single-shot synchronous
  render starts to degrade and informs the ≤50 KB "typical" boundary. **Chunked/virtualized/deferred
  reader render is explicitly DEFERRED to M2 as the lever for large-doc first-paint** — do not build the
  whole section DOM synchronously. Measurement/docs-only change: zero `src/`+`entrypoints/` edits, and the
  golden 1 MB digest is unchanged (the default `pnpm perf` still uses `buildHugeDoc()`'s 1400-section
  fixture byte-for-byte). Revisit-when: M2 chunked render lands, or the fixture/pipeline output changes.
- **2026-07-14 · Mount triggers must be commit-aware; source readability at DOMContentLoaded is
  engine-dependent (the Gecko gotcha).** The `document_start` reader can be asked to mount before the
  raw `<pre>` is readable: on Firefox the `file://` `<pre>` can still be EMPTY at DOMContentLoaded and
  only becomes readable by `load`; Chromium has it by DCL. So a mount attempt that finds no source is
  NOT a failure — it must leave the hide + backstops armed and retry at `load`, never assume-and-tear-
  down. `mountReader` now returns a commit boolean (`true` = a reader host is committed, incl. the
  degraded raw-fallback and the idempotent already-mounted re-entry; `false` = the no-source no-op),
  and `runReader` only reveals-and-disarms on a real commit, an unforeseen throw, or the FINAL attempt
  (which also logs one `console.warn` breadcrumb — the silent give-up is what cost this bug an
  investigation). The safety timer is now a pure never-blank FLOOR: it reveals raw WITHOUT disarming
  the attempts, so a late mount still takes over (accepted returned-flash tradeoff). **Correction of the
  record:** Firefox `file://` content scripts DO work; the prior session's "Firefox platform gap" was a
  MISDIAGNOSIS of this self-inflicted regression — remote (`raw.githubusercontent`) and local `.md` both
  failed by the SAME mechanism (the old `finally { reveal() }` firing on a not-ready-yet DCL no-op),
  and the localhost-workaround research it prompted was unnecessary. The original bug was introduced
  with the document_start + hidden-raw pass (below). Revisit-when: we change the mount trigger timing,
  or move off the DOMContentLoaded/`load` pair.
- **2026-07-14 · Reader mounts at `document_start` behind a hidden raw view.** The content script
  now runs `runAt:'document_start'` (both browsers). Flow (`src/render/runReader.ts`): detect FIRST
  (URL gate; a miss leaves the page completely untouched), then SYNCHRONOUSLY inject a `<style>` that
  sets `body > :not(peekover-root){display:none !important}` — `display:none` (not visibility:hidden,
  which still lays out) so the raw `<pre>` is kept out of layout and never paints. At document_start
  `<head>`/`<body>` may not exist, so the `<style>` is parented to `documentElement` (`<html>`);
  verified in Chromium that a `<style>` there IS honored (probe: raw `<pre>` computes `display:none`
  at 27 ms, before mount). Then WAIT for DOMContentLoaded (a partially-streamed `<pre>` read would
  silently truncate a large doc) and mount. **Never-blank mechanics (AGENTS.md #5, outranks the perf
  target):** detect-before-hide; a safety unhide = a 3 s timer PLUS the window `load` event (whichever
  first) that drops the hide `<style>` if the reader never mounts; and a `finally` that drops the hide
  `<style>` on EVERY mount outcome — success (originals already inline-hidden by mountReader, reader
  up → hand visibility to mount/toggle), failure (originals restored → raw visible), or an unforeseen
  throw. reveal() is idempotent + once-only so the paths never fight the toggle. **Programmatic
  injection (scripting + host_permissions, à la simov/markdown-viewer) was REJECTED** — `permissions:[]`
  is settled ground truth. **Perf-gate metric (as measured by `scripts/perf-first-paint.ts`):** reader
  first-paint = `performance.now()` at the 2nd rAF after `<peekover-root>` first has populated
  open-shadow content, timeOrigin-relative; gate = (a) navigationStart→painted median < 150 ms on the
  1.12 MB fixture. This change eliminates the raw-text FLASH for all sizes but did NOT move that number
  (~1245 ms → ~1261–1341 ms, still FAIL): first-paint is now dominated by laying out the reader's own
  ~1400-section rendered DOM, not the raw-`<pre>` layout we removed. Revisit-when: chunked/virtualized/
  deferred reader render (the only remaining lever), or if the toggle ever needs to reveal the original
  light-DOM nodes (it currently builds Raw inside the shadow root, so the hide/unhide never touches it).
- **2026-07-14 · Raw/Reading toggle: bare `\` shortcut; failure-raw and user-raw are
  distinct; the Raw view is built lazily.** Task 4.2. The reader flips between the rendered
  document ("Reading", default) and the original markdown as escaped text in the themed
  `pre.peekover-raw` ("Raw"), invokable two ways: a focusable pill in the shadow root and a
  keyboard shortcut. **Shortcut = a BARE backslash `\`** (`src/render/readerMode.ts`
  `TOGGLE_KEY`): not a Ctrl/Cmd combo (the browser owns those), and not `/` or `'` (Firefox
  quick-find) or a bare letter (collides with host-site shortcuts); `\` has no default
  browser/OS action. Scoping (must never swallow keys on pages we didn't render): a single
  document `keydown` listener installed once, only on the success path; it no-ops — and does
  NOT preventDefault — unless a mounted host carries `data-mode`, ignores the event when focus
  is in input/textarea/select/contenteditable, and rejects modifier chords. The listener is
  only ever *added* inside our content script, which runs only in matched markdown contexts,
  so it is absent on other pages entirely. **State** = a `data-mode` attribute on the shadow
  host (`reading`|`raw`); CSS in `readerCss.ts` keys view visibility off it, so a toggle is a
  pure attribute flip — parse/sanitize NEVER re-run (reader element identity holds across
  toggles). **Lazy raw view:** the raw `<pre>` is built on first toggle (source as
  `textContent`, no parse) and reused, so a never-toggled doc keeps its untrusted source out
  of the shadow tree (this is also why the existing sanitize test — "no `alert(` in
  innerHTML" — stays green). **Failure-raw vs user-raw are DISTINGUISHABLE:** the render-
  failure fallback shows a quiet left-accent banner ("Couldn't render this document — showing
  raw source.", `role="status"`, mockup `.alert.warn` styling) AND sets NO `data-mode` (there
  is no reading view to toggle to, so the shortcut stays inert); a user-chosen Raw view is a
  `data-mode` with NO banner. No persistence in M1 (mode resets per mount — persisted reading
  prefs are spec 004). No manifest change (all in-content-script UI). Revisit-when: spec 004
  settings UI (persist last mode), or a real toolbar milestone replaces the single pill.
- **2026-07-14 · Fonts: Literata bundled INLINE as base64 `data:` URIs, registered via the
  FontFace API.** The reader ships four Latin-subset Literata woff2 faces (400/700 × normal/italic,
  ~86KB raw, OFL — `assets/fonts/`, license `assets/fonts/OFL.txt`). They are imported with Vite's
  `?inline` suffix (relative paths, so the specifier resolves under both WXT and the vitest runner,
  which has no `@/` alias) → embedded as base64 in the content-script bundle, and registered on
  `document.fonts` via `new FontFace(...)` (`src/theme/fonts.ts`). Why inline over an extension URL:
  zero-network becomes literal (no request at all, not even a chrome-extension:// fetch) AND it needs
  no `web_accessible_resources`, so this styling task adds nothing to the manifest (AGENTS.md #4).
  Why the FontFace API over an `@font-face` rule in the shadow root: Chromium does not reliably apply
  `@font-face` declared inside a shadow tree, but faces on `document.fonts` participate in font
  matching for the whole document incl. shadow trees, in both Chrome and Firefox; adding a face does
  not restyle any host-page element, so it doesn't leak styling into the page. Cost: base64 inflates
  the bundle ~33% over raw (packed zip ≈150KB total — far under the ≤5MB / <2MB-zip budgets).
  Revisit-when: budget pressure, or a full-range (non-Latin) font need — then reconsider an
  extension-URL + WAR delivery.
- **2026-07-14 · Reader theme: light/dark ACTIVE via OS; sepia + manual switching DORMANT.** All
  three themes are DEFINED in the shadow stylesheet (`src/theme/readerCss.ts`) with the exact
  `design/tokens.css` values, keyed off a `data-theme` attribute on the shadow host. In M1 the runtime
  (`src/theme/reader.ts`) only ever sets light or dark, driven by `prefers-color-scheme` (a single
  matchMedia listener re-themes open readers when the OS flips). Sepia and manual/persisted selection
  are intentionally left un-wired until the settings milestone (spec 004). Why define-but-dormant:
  ships the correct token contract now so 004 only adds a selector, not new CSS. The full-bleed reader
  paints via `:host{position:fixed;inset:0}` + `all:initial` (isolates the reader from host-page style
  inheritance without touching the page). Revisit-when: spec 004 wires the theme/settings UI.
- **2026-07-14 · The reader HIDES the page's original nodes (`display:none`), not detach.**
  `mountReader` (src/render/mountReader.ts) sets inline `display:none` on the body's original
  children rather than removing them, so task 4.2's Raw toggle can reveal them again without a
  reload. This MUTATES the host page's DOM (inline display on body children). To keep the
  never-blank invariant (AGENTS.md #5) on the real injection path, mountReader renders into its
  shadow host and confirms non-empty content FIRST, and only THEN hides the originals; on any
  throw — or an empty render — it removes the host and leaves the browser's own rendering exactly
  as it was, so the user is never left with the page hidden AND nothing valid shown. (mount()'s
  own throw→raw fallback can't see this hide step, hence the guard lives in mountReader; the core
  was extracted from the entrypoint so it's unit-testable in jsdom.) Revisit-when: task 4.2 Raw
  toggle implementation, which reads/reverses this `display:none`.
- **2026-07-14 · Remote resources are BLOCKED by default.** Peekover does not load remote
  images or any remote resource a document's HTML would fetch until the user opts in with one
  click, which loads them AND lights the network indicator; permitted/local media is lazy-loaded
  (native `loading="lazy"`, offscreen deferral). Why: makes the "zero network by default" promise
  literally visible and demoable — core positioning, not a preference (AGENTS.md #1). The sanitize
  allow-list is unchanged (it still permits http/https `src`); blocking is a RENDER-LAYER policy
  (mount/shell decides what actually loads), not a sanitize strip. Revisit-when: never for the
  default; the load mechanism may evolve.
- **2026-07-14 · Dropped `id` and `align` from the sanitize allow-list.** The strict
  DOMPurify profile (`src/render/sanitize.ts`) no longer permits `id` or `align`. Why:
  `id` is a DOM-clobbering surface (attacker-controlled ids can shadow named
  `document`/form properties) with **no M1 producer** — markdown-it emits no heading ids;
  `align` is inert — markdown-it emits table alignment as inline `style` (which we strip),
  never as an `align` attribute, so allowing it did nothing. Revisit-when: M2 heading
  anchors, where we generate ids ourselves and re-allow `id` deliberately; and the M2 task
  to restore GFM table alignment by mapping to a class (never inline style).
- **2026-07-14 · Security tests run in jsdom; add an in-browser sanitize check at the
  golden/e2e milestone.** The sanitize suite uses jsdom, whose HTML parser differs from real
  browser engines — notably for mXSS, where namespace/reparsing quirks (SVG/MathML foreign
  content, template/noscript) can diverge, so a payload inert under jsdom is not proof it is
  inert in Chrome/Firefox. Scheduling note (not a code change now): during the golden-fixture
  / e2e milestone (tasks 5.x), run the malicious fixtures through DOMPurify in an actual
  Chrome and Firefox context and assert no script executes. Revisit-when: task 5.1/5.2 lands.

- **2026-07-14 · Target MV3 on Firefox (over WXT's MV2 default).** Set `manifestVersion: 3`
  in wxt.config.ts so the Firefox build is MV3, not WXT's default MV2; chose gecko.id
  `peekover@peekover.dev` (stable, on-brand, we own the domain — required before an MV3 AMO
  submission). Why: consistency with our MV3 / no-persistent-background security claim (spec §6),
  and MV2 is legacy for new extensions. Firefox MV3 uses a non-persistent **event page**
  (`background.scripts`), not a Chrome service worker — WXT emits the right shape from our
  `defineBackground` automatically, so no background code changed. gecko keys are gated on
  `browser === 'firefox'` so they never leak into the Chrome manifest. Revisit-when: AMO changes
  ID rules, or we adopt a real background listener.
- **2026-07-14 · Lowercase-only file:// match patterns.** `isRenderableContext()` is
  case-insensitive, but the manifest `file:///*.<ext>` patterns are lowercase, so a local file with
  an UPPERCASE extension (e.g. `README.MD`) won't trigger browser injection. Why: doubling every
  file:// pattern to cover uppercase is a poor tradeoff for a rare case; raw hosts are host-matched
  and unaffected, and most local files use lowercase extensions. Revisit-when: we next touch match
  patterns (Firefox/manifest task 2.3 or folder-mode), or if a user actually reports it.
- **2026-07-11 · Name: Peekover** (DocPeek withdrawn — live App Store collision). Eight-surface
  verification passed; domain peekover.dev owned+verified. Full record: names.md in design archive.
- **2026-07-11 · Umbrella ship model:** repo under github.com/mosuvo/peekover (personal), org
  `peekover` dormant insurance, one publisher account for all future free tools, hello@peekover.dev
  public contact, no product X handle. Revisit: if a tool needs contributors/governance.
- **2026-07-10 · Brand: monochrome + one highlighter.** No chromatic accent (indigo/orange/red all
  rejected — clashed with yellow). Interactive = ink + highlighter underline. Logo internals fixed-ink.
- **2026-07-09 · Stack: WXT + markdown-it + DOMPurify + Shiki + KaTeX + Mermaid + CM6.** One
  battle-tested parser over hand-rolled; WXT over Plasmo (maintenance, MV3+Firefox story).
  Revisit: only if 5MB budget breaks.
- **2026-07-09 · Zero-network default is architecture, not policy** — no code path may fetch
  without explicit user trigger + indicator. Revisit: never.
- **2026-07-08 · Strategy: markdown wedge → universal raw viewer (Phase 2).** Free forever,
  credibility play, $0 infra.
