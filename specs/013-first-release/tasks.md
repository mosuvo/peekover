# Tasks 013 — A truthful, on-design first release (M13)
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews this decomposition against `plan.md` and either*
*approves it or returns it with redlines. **No implementation before this file is approved** (WORKFLOW.md §5.3).*
*This file is a PROPOSAL: it installs nothing, writes no code, and edits neither the sealed spec body nor the sealed*
*plan body.*
*Approved upstream: `spec.md` — gate 1, banked in `decisions.md`'s **M13 GATE 1 APPROVED** (2026-10-30; §10's notes*
*govern the spec body). `plan.md` — gate 2, banked in **M13 GATE 2 APPROVED** (2026-10-31; **§9's notes govern the plan*
*body** and were read first for this draft).* One commit per task (`-F` message file, `Co-Authored-By:` trailer naming
*the model that did the work); the human reviews the pasted evidence and pushes — an agent NEVER pushes. Each*
*capability gets its OWN real-engine test where the property is jsdom-blind (layout, computed style, fonts, bytes on*
*the wire, focus) — never a trailing "add tests" task.*
*★ **APPROVED AT GATE 3 (2026-10-31)** — `decisions.md`'s **M13 GATE 3 APPROVED** is the approval of record (Q1–Q6 all*
*on the recommendations, Q4 with a condition); changes are the dated gate-3 notes at the foot of this file and the ★*
*notes at 7.4 and 8.1; the body below is not rewritten. Next: task 1.1 in a fresh session.*
*Drafted 2026-10-31 at HEAD `afc8b1d` (tree clean). No production, test, package or workflow byte has changed since the*
*plan's HEAD `3bb3b93` (`git diff --stat 3bb3b93 HEAD -- src entrypoints tests wxt.config.ts package.json .github` is*
*empty), so the plan's code citations hold; the preflight below re-checks the ones tasks lean on.*

---

**★ Standing invariants — bundle-budget snapshot (AGENTS.md kickoff rule).** `.output` **5,830,859 B (Cr) / 5,830,975 B
(Fx)** against **≤ 7 MiB (7,340,032 B)** — headroom **1,509,173 / 1,509,057 B**. Zip 1,842,763 / 1,842,822 B. Content
script **344,195 B both engines** (md5 `b0ff62df…` Cr / `3413dae0…` Fx) — **no ceiling** (gate 1), a per-task fence,
and a **report-only tripwire: any task adding more than +2 KB to the content script stops and reports before
continuing** (G-7). App chunk 532,048 B. Manifest **654 / 770 B**, `permissions: []`, no `web_accessible_resources`, no
`host_permissions`. `dependencies` 11. **`pnpm audit --prod` EXIT 0 on 2026-10-31** (this session; one low, ignored —
GHSA-238p-pmpm-9mq7). **These byte figures are CITED** from the M12 close (`progress.md` § Up next) — this doc-only
session ran no build; task 1.1's clean rebuild re-measures and is authoritative. **Every task's kickoff re-states this
snapshot moved forward to the immediately-prior task's measured figure, and re-runs `pnpm audit --prod` with its exit
and date** (AGENTS.md, the M12 retro rule).

**★ Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **Gate 1 (spec §9, §10):** Q1 version 0.1.0 · Q2 `tokens.css` wins, dark `--shadow` adopted · Q3+Q10 no content-script
  font ceiling; app page loads the faces from the package; the file:// reader keeps Literata and uses system stacks ·
  Q4 copies pinned by a test · Q5 R11 kept · Q6 sepia dormant · Q7 748 px measure · Q8 the toolbar merge, **mock first**,
  re-spellings authorized per surface with the property named · Q9 status line, test-backed only · Q11 TOC look only ·
  Q12 ≤ 1080 px Files overlay · Q13 one-time notice AND permanent in Stored data · Q14 code keeps its three tools, math
  loses the code toolbar · Q15(b) repo public at release, (c) site self-hosts fonts · Q16 minimal repro check, threat
  model, attestations, signed tags withdrawn · Q17 the release workflow owns the SBOM · Q18 install-only auto-open ·
  Q19 privacy policy linked from all three listings · Q20 Edge = listing text + assets, the Chrome zip.
- **Gate 2 (plan §8, §9):** G-1 peekover.dev on GitHub Pages, every peekover.dev URL "live at release", privacy at
  `https://peekover.dev/privacy/`, Pages prepared not turned on, security via GitHub private vulnerability reporting,
  contact via issues, `hello@peekover.dev` nowhere as working · G-2 app-built toolbar + one `mount()` option · G-3
  indicator OR Resource Timing · G-4 watch-pill text in ink · G-5 information-bearing `--faint` → `--muted` · G-6 fonts
  sourced and subset, OFL texts **in the package**, NOTICE + README credit, ≥ Latin + Latin Extended, bytes measured ·
  G-7 the +2 KB tripwire · G-8 "file-identical", worded exactly · G-9 one manual dry run, attestations conditional on a
  public repo · G-10 install only · G-11 scripted screenshots, the human picks · G-12 decorative ticks only · G-13 Node
  22, stated for AMO · G-14 additive `manifest.test.ts` edit · G-15 the dismissal in its own app-only row · §9-6 the
  Firefox file:// walk check · §9-7 the go-live checklist.
- **Plan D-1 … D-17.** Every task names the D-value(s) it implements; each D-value's `decisions.md` entry lands with the
  commit that implements it (audited at 9.5 — M9 9.3's gap, M12 7.3's audit).
- **Spec §6's IS-NOT list is a fence:** going live (publishing the site, store submission, making the repo public,
  pushing the tag) · every unshipped mockup feature (command palette, AI, presentation, tour, find-in-folder, backlinks,
  type settings, frontmatter chips, TL;DR, drop zone, progress bar, cheat-sheet, read-aloud, link checking, the editor's
  formatting bar) — **no disabled or stub affordance for any of them** (spec §3.1) · sepia · new code themes · the rest
  of F11 · localization · publisher-account docs, community audit · the non-polish carried items. **No task proposes any
  of them.**
- **Plan §2's Must-NOT-touch list:** `sanitize.ts`, the parser, any enhancer's behaviour, `diffView.ts`'s substance,
  `watchController.ts`, the settings channel's message shape, `Settings`. Checked by `git diff --stat` per task.

---

## Preflight — the plan citations tasks lean on, re-derived at HEAD `afc8b1d`

| Plan citation | At this HEAD |
|---|---|
| `readerCss.ts:41` `READER_CSS`, `:1314` `CONTAINED_CSS`, `:1460` `EDITOR_CSS`, `:1561` `EDIT_CONTROL_CSS` | STILL-ACCURATE |
| `readerCss.ts:100` `padding:56px 32px 130px`, `:1464` `--edit-bottom:130px` (D-7) | STILL-ACCURATE — **and a third site the plan did not name: `:227`, `.peekover-diff`'s identical `130px` padding** (F-2) |
| `appShell.ts:370–377` `LIGHT_TOKENS` / `DARK_TOKENS` (not exported), `:451` `--sans:system-ui,…`, `:705` the header | STILL-ACCURATE (the `--sans` override is `:451`, the plan said `:450`) |
| `mount.ts:40` `MountOptions` | STILL-ACCURATE — **it already carries M12's `chrome?: boolean` (`:82`)** (F-1) |
| `editorEnhancer.ts:63,103` `EDIT_CONTROL_CSS` import + injection; `:115–140` the control's enter/exit click body | STILL-ACCURATE (`enterEditMode` itself lives in `readerMode.ts`, as M12 built it) |
| `watchControl.ts:255–260` "a one-shot or dismissible disclosure would silently void D-12" | STILL-ACCURATE at **`src/watch/watchControl.ts`** (the plan gave no directory) |
| `store.ts:336–342` `wipeAll()` clears settings | STILL-ACCURATE at **`src/app/store.ts:336–345`** (`clear(conn, STORES.settings)` at `:341`) |
| `storageControls.ts:34–37` `STORAGE_DISCLOSURE_NOTE` | STILL-ACCURATE |
| `site/index.html:280,296,475,544` — four `href="#"` "Add to Chrome" CTAs | STILL-ACCURATE — **and more dead `href="#"` links than four** (F-3) |
| `site/index.html:8–10` Google Fonts links | STILL-ACCURATE (`:8` preconnect, `:10` stylesheet) |
| `editorEyeballProxy.browser.test.ts:300`, `diagramTheme.browser.test.ts:505` — the two contrast copies | STILL-ACCURATE |
| `contentWatch.test.ts:75` `backgroundCanReadFileUrls: !import.meta.env.FIREFOX` | STILL-ACCURATE |
| D-13's "every `pnpm/action-setup@v4` step in `ci.yml` and `supply-chain.yml`" | STILL-ACCURATE — four steps (`ci.yml:9`; `supply-chain.yml:46,72,130`), each `version: 10`; `ai-hygiene.yml` has none (F-4) |
| D-13 "the local pnpm that wrote the current lockfile" = 10.33.0 | `pnpm --version` **10.33.0**, `lockfileVersion: '9.0'` — consistent; 1.1 re-confirms |
| §5.3's 43 browser test files + 5 unit files (the census candidates) | all 43 present under `tests/browser/` (94 browser test files in all) |
| `public/` (G-6 `public/licenses/`, D-15 `public/icons/`) | **does not exist yet** (F-5) |
| `wxt.config.ts` — no `version` key (version follows `package.json`), no `icons` key | STILL-ACCURATE |

## Gate-3 findings — surfaced by this decomposition, each routed to a task

- **F-1 · `MountOptions` already has a `chrome` option.** M12's `chrome?: boolean` (`mount.ts:82`) skips ALL chrome for
  the nested preview. D-5 needs a narrower switch: skip the pills, keep the document-bound chrome (TOC rail, remote-load
  bar, network indicator, failure banner). **Settled here, as the plan allowed ("name settled in tasks"):** a separate
  field `pills?: boolean`, default `true`; `chrome: false` implies no pills (no change to M12's behaviour). → 4.1.
- **F-2 · The 130 px band has three sites, not two.** `.peekover-diff` (`readerCss.ts:227`) copies the reading column's
  padding, so a diff on the app page would keep the band D-7 removes. → 4.6 reclaims all three on the app page.
- **F-3 · The site has more dead links than the four CTAs.** Every `href="#" onclick="return false"` is dead: Edge and
  Firefox "install" buttons (`:545–546`), "★ GitHub" (`:279`, `:285`, `:547`), and the footer's repo links (`:563` —
  github.com/mosuvo/peekover, SECURITY.md, PERMISSIONS.md, Releases, Report a bug). → 1.3 treats every `href="#"` on the
  page: install-shaped ones become the plain non-link line; repo links point at the real GitHub URLs, recorded in the
  claims ledger as "live at release" (the repo is private until then, gate-1 Q15(b)).
- **F-4 · Two workflows use pnpm, not three.** The spec's §3.4 says "all three workflows"; `ai-hygiene.yml` has no
  `pnpm/action-setup`. D-13's list is right; no spec edit needed (the spec body is sealed; recorded here). → 1.1.
- **F-5 · `public/` does not exist.** It is WXT's public directory by convention; whether WXT copies a root `public/`
  verbatim with `srcDir` unset is verified against WXT's current docs at 2.3 (AGENTS.md: verify, do not recall).
- **F-6 · Suppressing the pills creates two intermediate states the plan's order would ship.** (a) Between the first
  toolbar control and the last, the app page would carry each control twice (toolbar + pill) — tolerable, unreleased.
  (b) If `pills: false` lands before D-8's toolbar notice exists, **the snapshot-capture disclosure vanishes from the app
  page** for one or more commits — a trust disclosure gap D-12 forbids. **Proposed:** the app page passes `pills: false`
  in **4.5, with D-8**, and the band reclaim (D-7) follows in **4.6** (the plan had D-7 in 4.3, before the pills were
  gone, which would put the pill stack over text). → Q1.
- **F-7 · The manifest-bytes invariant moves at 2.6.** Adding `icons` and `action.default_icon` grows both manifests;
  "654 / 770 B" becomes "stated per task from 2.6". 7.1's version bump is length-neutral (`0.0.0` → `0.1.0`).
- **F-8 · Two bundled font families already ship without their licence in the package.** Literata and STIX Two Math
  (`assets/fonts/`) have no OFL text inside `.output`; G-6(a)'s licence test is therefore red on two families today —
  the red-first comes free. → 2.3.
- **F-9 · Plan numbering → task numbering.** Plan 2.3 (fonts) becomes **2.3 (assets, licences)** + **2.4 (`uiFonts.ts`,
  stacks, fence, zero network)**; plan 2.4 (the measurement — §9-2's "measured in 2.4") is **2.5**; plan 2.5 (icons) is
  **2.6**. Plan 4.3's D-7 is **4.6**; plan 4.5–4.7 are **4.5, 4.7, 4.8**. Plan 6.1 becomes **6.1 + 6.2**; plan 9.3
  becomes **9.4 + 9.5**, with the truth re-check its own ★ task (**9.2**). → Q3.

---

## 1 — CI + truth, first pass (D-12, D-13)

- [x] **1.1 CI: push to `main`, pnpm from `packageManager`, the Dependabot count, Node pinned (D-13; G-13; F-4).**
      TEST FIRST. Re-confirm the pnpm version that wrote the lockfile (10.33.0 at drafting) and verify
      `pnpm/action-setup@v4`'s behaviour against its current README (it reads `packageManager` when `version` is
      absent; both present and different is an error). `ci.yml` `on:` gains `push: branches: [main]`; the four
      `pnpm/action-setup` steps drop `with: version: 10`; `package.json` gains `"packageManager": "pnpm@10.33.0"` and
      `"engines": { "node": ">=22 <23" }` (range confirmed at the task); `.nvmrc` `22`; `dependabot.yml`'s header drops
      the "FOUR runtime dependencies" count.
      Files: `.github/workflows/ci.yml` · `.github/workflows/supply-chain.yml` · `.github/dependabot.yml` ·
      `package.json` · `.nvmrc` (new) · `tests/ciConfig.test.ts` (new — necessary ripple, Q2: the Verify's red-first
      needs a pin)
      Verify: (**unit**) `ciConfig.test.ts` reads the workflow and `package.json` text and asserts: `ci.yml` triggers
      on `push` to `main` AND `pull_request`; no `pnpm/action-setup` step in any workflow carries `version:`;
      `packageManager` matches `/^pnpm@\d+\.\d+\.\d+$/`; `dependabot.yml` states no dependency count (no
      `/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|\d+)\s+runtime dependenc/i`). **Red-first:** the
      test is run before the edits and fails on each clause, in those words. `pnpm install --frozen-lockfile` EXIT 0
      locally under the pinned version. `pnpm lint` EXIT 0. Production bytes: none expected — clean rebuild both
      engines, content-script md5 identical to the snapshot, `.output` stated (this rebuild re-establishes the
      milestone baseline). Golden EMPTY · manifest 654 / 770 B · `permissions: []` · audit EXIT 0 stated with date.
      **Human, after push (not the agent):** the CI run on `main` is visible in Actions — recorded at 8.1.
      [D-13; G-13]
      ★ *Landed 2026-10-31 (`decisions.md`, "M13 TASK 1.1"):* as drafted, with three task-time calls — (a) `engines.node`
      is **`>=22`**, not `>=22 <23` (pnpm only warns on a mismatch; local dev runs Node 24.11.1); (b) every `setup-node`
      reads **`node-version-file: .nvmrc`**, so `.nvmrc` is CI's one Node pin, and the test pins it; (c) a second stale
      count ("The four libraries") was dropped and is pinned too. `ciConfig.test.ts` 5 cases, red-first on all five;
      all 278 shipped files md5-identical to HEAD, both engines. Unit 1422.

- [x] **1.4 CI green on Linux (DISCOVERED 2026-11-01 — the cloud environment check; run before 1.2).** ★ *Added by
      the human's rulings on the Linux reds (`decisions.md`, "M13 RULING — the Linux reds"); count 40 → 41.* CI #18
      (the first run on `main`, `ea856df`, GitHub's Linux runner) failed with 7 browser reds the Windows runs never
      showed. (1) diffChrome remote-load lane — PRODUCT: the opt-in is positioned from the comparison pill's laid-out
      edge, not a fixed 176px; CSS over JS. (2) editorUnsaved, header at 414px — PRODUCT, minimal: the app header
      keeps every control inside the viewport (wraps); CSS only, app page; group 4's toolbar supersedes it. (3)
      copyAsHtml — TEST: the wait matches this fixture's own "Body of alpha.md.". (4) golden ~1 MB — TEST: a per-test
      timeout for slower runners; the pinned SHA-256 unchanged. (5) the pipeline.perf budget — UNCHANGED, a known
      flake.
      Files: `src/theme/readerCss.ts` · `src/app/appShell.ts` · `tests/browser/diffChrome.browser.test.ts` ·
      `tests/browser/appHeaderNarrow.browser.test.ts` (new — the ruling's real-engine header check) ·
      `tests/browser/copyAsHtml.browser.test.ts` · `tests/golden/golden.test.ts` · records (`decisions.md`,
      `progress.md`, this file)
      Verify: red-first, both engines, in the Linux cloud session: (1) red at HEAD font-independently (the pill
      widened), green after at 1280 and 1400, ablate → red; (2) every header control inside the viewport at 414 × 896,
      red at HEAD, green after, editorUnsaved's inert case green, ablate → red; (3) red in CI's order, green after;
      (4) the timeout red before, green after. Lint 0 · unit green (perf: known flake) · the full browser suite alone,
      zero reds outside the known flakes · clean two-engine build, bytes per moved file, manifests unchanged,
      `permissions: []` · golden EMPTY · audit EXIT 0.
      ★ *Landed 2026-11-01 (`decisions.md`, "M13 TASK 1.4"):* CSS anchor positioning (`anchor-name` on the pill,
      `left:calc(anchor(--peekover-diff right,-8px) + 24px)` on the opt-in) and `flex-wrap:wrap` on the header. One
      ruled test edit beyond the plan: the existing lane test re-reads the opt-in's rect after the label changes (the
      human chose it when the anchored opt-in made its stored rect stale). Bytes: content script +71 B, app chunk
      +87 B, both engines; nothing else moved.
      ★ *Addendum 2026-11-01 (the human's follow-ups A and B; `decisions.md`, "M13 TASK 1.4", ADDENDUM):* A —
      diagramActions' keyboard-reveal test starts from a known pointer state (a resting pointer over the figure was
      proven to start the hover reveal); red 2/6 → 0/6 on each engine; TEST fix, not a known flake. B — no minimum
      browser version is set, and anchor positioning needs Chrome/Edge 125+, Firefox 147+, so `left:176px` now precedes
      the anchored `left` in the same rule (an older engine keeps the old lane); source-order unit check. Bytes +12 B
      on the content script and the app chunk. ★ *Second addendum 2026-11-01 (PR #14's CI):* the wrapping header
      changed height when the Stored data panel opened (the closed, empty slot still took a flex gap; on CI's DejaVu
      the header went 132 → 93px) — fixed with `__storage-slot:empty{display:none}`, pinned by a header-width sweep
      (red at HEAD in Inter, green after); the OSV SARIF upload (failing on main since at least 2026-10-12) now runs
      only on a public repository, on codeql-action v4, with the SARIF kept as an artifact; the scan stays advisory.
      Font parity: this host prefers Inter via fontconfig; CI resolves DejaVu Sans — a setup-script change proposed.
      App chunk +40 B; content script unchanged. Files added: `tests/browser/storagePanelOverlay.browser.test.ts`,
      `.github/workflows/supply-chain.yml`, `tests/ciConfig.test.ts`. Earlier files added: `tests/browser/diagramActions.browser.test.ts`,
      `src/render/diffChrome.test.ts`.

- [x] **1.2 README + SECURITY.md: withdraw what does not ship; start the claims ledger (D-12; G-1; G-8).** TEST
      FIRST. README rewritten to shipped features with one "Planned" section and no install link; the
      "Site: https://peekover.dev" line kept only in a form that does not present the site as live (wording is the
      task's, recorded in the ledger as "live at release"). `SECURITY.md` withdraws "reproducible builds … verified in
      CI", signed tags and the community audit; it promises only mechanisms that exist today, each linked;
      `hello@peekover.dev` appears nowhere as a working channel (its final channel text is 7.2's). `docs/store/claims.md`
      created: one row per factual sentence in README and SECURITY.md — sentence, evidence (test file, code path,
      "planned", or "live at release"), status.
      Files: `README.md` · `docs/trust/SECURITY.md` · `docs/store/claims.md` (new) · `tests/truthPins.test.ts` (new —
      necessary ripple, Q2)
      Verify: (**unit**) `truthPins.test.ts` asserts over README and SECURITY.md: no `hello@peekover.dev`; no install-
      shaped link ("Add to", "Install", store URLs) while no listing exists; every `peekover.dev` URL in them appears in
      `claims.md` with status "live at release"; every line of README's feature list appears in `claims.md` with a
      non-empty evidence cell. **Red-first** on today's README (the `peekover.dev` line has no ledger row) and today's
      SECURITY.md (the address). Each numeric claim removed or its evidence named in the ledger. Production bytes:
      none — content-script and `.output` md5 identical to 1.1. Golden EMPTY · manifest 654 / 770 B ·
      `permissions: []`. [D-12; G-1]
      ★ *Landed 2026-11-01 (`decisions.md`, "M13 TASK 1.2"):* README and SECURITY.md rewritten; `claims.md` 72 rows
      (47 true now · 4 live at release · 6 planned · 15 withdrawn); `truthPins.test.ts` 15 cases, red at HEAD on 9.
      Beyond the Verify line, the kickoff added (and the test pins): unbuilt mechanisms only under "Planned", the known
      false figures absent, every "true now" row's evidence path exists, exactly one README "Planned" section. The
      peekover.dev URLs sit under README's "Planned", marked not online yet (G-1 supersedes D-12's removal). Build
      identical to `main`'s, all 139 files per engine (the snapshot moved at 1.4, so the reference is `main`, not 1.1).
      ★ *Review addendum 2026-11-01:* every README feature line names its surface (app-page-only items say "On the app
      page, …"; Limits gains the tab and raw-host lines), the human's opening sentence, "Renders", one "Planned" section
      in two labelled parts, "Licence" kept (the repo's spelling); ledger 75 rows (47 · 4 · 9 · 15).

- [x] **1.3 Site content pass: shipped features + "Planned", every dead link resolved, numbers checked (D-12; F-3).**
      TEST FIRST. `site/index.html`: on-device AI, BYOK, 30+ themes, publishing, presentation mode, command palette,
      27 languages, "reproducible builds" moved to one "Planned" section or removed; every `href="#"` resolved per F-3
      (install-shaped → the plain non-link line "Not in stores yet — build from source" + the repo link); every number
      verified (evidence in the ledger) or removed. Fonts stay Google-linked until 9.1 (the site is not shipped and not
      live; 9.1 self-hosts). `claims.md` gains the site's rows.
      Files: `site/index.html` · `docs/store/claims.md` · `tests/truthPins.test.ts`
      Verify: (**unit**) `truthPins.test.ts` extended to the site: zero `href="#"`; no install-shaped anchor or button;
      every `peekover.dev` / `github.com/mosuvo/peekover` URL has a "live at release" ledger row; each feature heading
      outside "Planned" has a ledger row with evidence. **Red-first** on today's file (eleven-plus `href="#"`). The
      page opened locally in Chromium and Firefox renders without error (agent glance, not the walk). Production bytes:
      none — md5 identical to 1.2. Golden EMPTY · manifest 654 / 770 B · `permissions: []`. [D-12]
      ★ *Landed 2026-11-01 (`decisions.md`, "M13 TASK 1.3"):* text, links and the explorer's data rewritten (layout and
      styles kept for 9.1); 17 `href="#"` resolved (install-shaped → "Not in stores yet — build from source"; repo links →
      the real URLs, "live at release"); one `id="planned"` section; the site's ledger rows 214 (167 · 10 · 3 · 34);
      truthPins +6 site cases, red at HEAD on 5; the page renders without error in both engines; build identical to
      `main`'s.
      ★ *Review addendum 2026-11-01:* the security heading, the watch wording (card and explorer), the no-telemetry
      evidence; "UPDATE AT GO-LIVE" on every not-in-stores line and the Setup "Build" step, carried to 7.6 as a go-live
      step; ledger 291 rows (the site 216).

*Group-1 acceptance (spec §4 Truth + CI): README, site and SECURITY.md describe only what ships or say "Planned"; no
install link; numbers evidenced or gone; the ledger exists; CI pinned and triggered on `main`.*

## 2 — Foundation: tokens, contrast, fonts, icons (D-1, D-2, D-3, D-4, D-15, D-16)

*The census (2.2) is written before any restyle, so its first run IS the inventory. Nothing in this group touches the
toolbar.*

- [x] **2.1 `tokens.css` is the single source; every code copy pinned by one test (D-1; Q2, Q4).** TEST FIRST.
      `tests/designTokens.test.ts` (node): parse `tokens.css` per theme; parse the three reader `:host` blocks out of
      `READER_CSS`; import `LIGHT_TOKENS` / `DARK_TOKENS` (exported from `appShell.ts` — the only production edit the
      test itself needs); scan the six app sheets' `var(--x,#hex)` fallbacks against the LIGHT value; map the Mermaid
      palette (`diagramEngine.ts:328–337`) to its tokens; scan `src/**/*.ts` (tests excluded) for any hex / `rgba(`
      literal that is neither tracked nor on the named allow-list (`#26210a`, `#191504`, the logo's fixed ink `#16171F`
      and paper — each with its reason). Then the forced edits: the shell token set grows to the full set (`--code-bg
      --hl --ok --ok-soft --warn --del --del-soft`); `tokens.css` dark gains `--shadow:0 10px 30px rgba(0,0,0,.5)` and
      the reader and shell dark blocks follow; `tokens.css`'s header comment names itself the source; `brand.html` one
      annotation line. Any drift found in a copy is fixed toward `tokens.css` and named.
      Files: `design/tokens.css` · `design/brand.html` · `src/theme/readerCss.ts` · `src/app/appShell.ts` · the six
      sheets only where drift is found (`exportControls.ts`, `storageControls.ts`, `treeView.ts`, `recentsView.ts`,
      `readerPane.ts`, `appShell.ts`) · `src/render/diagramEngine.ts` only on drift · `tests/designTokens.test.ts` (new)
      · `tests/browser/designTokens.browser.test.ts` (new)
      Verify: (**unit**) red-first — change one value in each KIND of copy (reader `:host`, shell, fallback, Mermaid,
      an untracked literal) → red naming the copy and the token; restore → green. (**real engine, Cr+Fx**) computed
      custom properties on the content-script reader, the app shell and the reader pane, light and dark, equal
      `tokens.css`'s values parsed at test time (never copied). `htmlExport.test.ts`'s `:host` pin stays **26**. Bytes:
      content script expected to move by the dark `--shadow` declaration (tens of bytes) plus any named drift fix —
      stated, md5 under ablation of the shadow line restores the prior md5; app chunk delta stated. Full suite
      (production changed). Golden EMPTY · manifest 654 / 770 B · `permissions: []`. [D-1; gate-1 Q2, Q4]
      ★ *Landed 2026-11-01 (`decisions.md`, "M13 TASK 2.1"):* no drift beyond the planned gaps; tokens.css dark gains the
      mockup's shadow; the shell's full set; `LIGHT_TOKENS` / `DARK_TOKENS` / `APP_BASE_TOKENS` exported. The Mermaid
      palette is read from source text (no export needed). Content script +39 B (the shadow line; its ablation restores
      `b27e0c8b` / `16cd9bd7`), app chunk +318 B. Unit pin red at HEAD 3 / 7, browser 6 / 10; every kind ablated. The one
      on-screen change: the dark shadow.

- [x] **2.2 One contrast helper, the census, the inventory; G-4 and G-5 applied (D-16; G-4, G-5).** TEST FIRST.
      `tests/browser/helpers/contrast.ts` replaces the two private copies (both tests re-pointed, their assertions
      unchanged — cite them as the ablation precedent). `tests/browser/contrastCensus.browser.test.ts`: on the
      content-script reader (file:// fixture and one raw-host fixture), the app shell, reader pane, editor, the three
      panels and the unsaved dialog, light and dark: every text node's computed colour against its effective
      background ≥ 4.5 (≥ 3 large text), except (i) the M12 accepted list BY NAME (E-4, E-5, R12, E-9, `invalid`) and
      (ii) a **pending list** of today's other failures, each row named — the inventory (Q4). Then apply the two
      rulings: the active watch pill's text to `--ink`, green kept on dot and border (G-4); every information-bearing
      `--faint` text to `--muted`, the decorative ones listed with their reason (G-5). Their pending rows are deleted.
      **Any below-AA pair the census finds that G-4/G-5 do not reach is a STOP:** batched into one question for the
      human, never added to the accepted list (Q5).
      Files: `tests/browser/helpers/contrast.ts` (new) · `tests/browser/contrastCensus.browser.test.ts` (new) ·
      `tests/browser/editorEyeballProxy.browser.test.ts` · `tests/browser/diagramTheme.browser.test.ts` ·
      `src/theme/readerCss.ts` · `src/app/appShell.ts` and the app sheets where `--faint` carries information
      Verify: the inventory pasted (surface, theme, engine, selector, ratio). (**Cr+Fx**) red-first: revert G-4's
      colour → the census fails on the watch pill at 3.17:1 (light, panel), in those units; revert one G-5 swap → the
      census fails on that node. Helper equivalence: both old call sites produce identical ratios through the shared
      helper on the same inputs (spot table). Bytes: `--faint`→`--muted` is length-neutral and `--ok`→`--ink` is −1 B
      per site, so the content-script delta is expected to be a few bytes — stated and decomposed. Full suite. Golden
      EMPTY · manifest 654 / 770 B · `permissions: []`. [D-16; G-4, G-5]
      ★ *Landed 2026-11-01, LEFT OPEN (`decisions.md`, "M13 TASK 2.2"): the line's own STOP — one batched question for
      every below-AA pair outside G-4 / G-5 — is with the human, so 2.2 is not ticked until the ruling.* The helper (two
      moves, identical ratios), the census (8 surfaces × 2 themes × 2 engines; text nodes, per this line — the kickoff's
      non-text and state scope flagged), the inventory (54 rows, 7 causes), G-4 and G-5 applied and ablated; the pending
      list is one cause, 8 rows (the default code theme's comment colour, 3.05:1). Content script +25 B, app chunk +25 B.
      ★ *Closed 2026-11-01 (`decisions.md`, "M13 RULING — the Peekover code theme"):* the human ruled on the batched
      question after a 20-theme measurement (only `light-plus` passes every emitted token; no dark theme does) and the
      design check (code follows the page theme, `mockup.html:152,157`). The 8 pending rows stay on the census's list,
      each marked "→ resolved by task 5.8 (Peekover code theme)"; Q4 holds. Non-text contrast (1.4.11) is carried to 8.1.

- [x] **2.3 Font assets: source, subset, provenance, licences in the package, NOTICE (D-2's assets; G-6; F-5, F-8).**
      TEST FIRST. Verify against current sources before acting: the OFL status of Bricolage Grotesque and Sometype Mono
      in `google/fonts`, a pinned commit, and WXT's public-directory behaviour (F-5). Download (a dev-time network act,
      G-6) and subset with fontTools: Bricolage 400 / 600 / 700, Sometype 400 / 500; ranges **at least U+0000–00FF and
      U+0100–024F** plus every non-ASCII glyph the chrome and onboarding copy spell, enumerated from the source strings
      (§9-2(b) supersedes D-2's narrower range); Sometype keeps box-drawing. Static instances vs one variable file is
      left to 2.5's numbers — 2.3 produces both Bricolage forms in scratch and commits the static set provisionally only
      if 2.5 has not yet ruled (stated). `assets/fonts/README.md`: source URL, commit, exact commands, ranges.
      `public/licenses/` gets the four OFL texts (Literata, Bricolage Grotesque, Sometype Mono, STIX Two Math) copied
      verbatim; a root `NOTICE` credits each; README gains one credit line (necessary ripple — §9-2(a) names README).
      Files: `assets/fonts/bricolage-*.woff2` · `assets/fonts/sometype-*.woff2` · `assets/fonts/README.md` (new) ·
      `assets/fonts/OFL.txt` · `public/licenses/*.txt` (new) · `NOTICE` (new) · `README.md` ·
      `tests/fontLicences.test.ts` (new — named by §9-2)
      Verify: (**unit**) `fontLicences.test.ts`: every font family shipped (the families of `assets/fonts/*.woff2`,
      mapped by name) has `public/licenses/<family>.txt` containing "SIL OPEN FONT LICENSE Version 1.1" and that
      family's copyright line, and `NOTICE` names it. **Red-first today on Literata and STIX** (F-8), then on the two new
      families before their files land. Each subset's cmap checked with fontTools: the stated ranges present, nothing
      outside them; file sizes stated. Built `.output` on BOTH engines contains `licenses/*.txt` (the WXT copy
      verified, not assumed). Bytes: `.output` grows by the licence texts only (the woff2 files are not imported yet,
      so not emitted — verified); content-script md5 identical. Golden EMPTY · manifest 654 / 770 B ·
      `permissions: []`. [D-2; G-6]
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 2.3").* `google/fonts` pinned at `6c1dbe2`; fontTools 4.68.0 in a
      throwaway venv. Bricolage 400 / 600 / 700 as static instances (`wdth` 100, `opsz` 12), committed provisionally —
      2.5 rules static vs variable (72,816 vs 79,464 B); Sometype 400 / 500 with box drawing; `tnum` kept. Each cmap =
      source ∩ ranges, nothing outside; rebuilds byte-identical. Literata reused, not re-subset (byte-identical to
      @fontsource/literata 5.3.0); STIX untouched. Licence test red at HEAD on Literata and STIX, then on all four, green
      after; ablated. `.output` +17,711 B on both engines = the four licence files only; content script and app chunk
      md5-identical. Necessary ripple: `docs/store/claims.md` row 292 (truthPins requires a row for the README line).

- [x] **2.4 `uiFonts.ts`, the one stack string, the fence, zero network (D-2, D-3).** TEST FIRST. `src/theme/uiFonts.ts`
      — the `mathFont.ts` twin: plain asset imports, `document.fonts.add(new FontFace(…))`, `display:'swap'`,
      idempotent, failure-swallowing. Imported by `appShell.ts` only (onboarding joins at 6.1). `tokens.css` `--sans` /
      `--mono` become D-3's stacks; the reader and shell copies follow (2.1's pin forces it); `appShell.ts:451`'s
      `--sans:system-ui,…` override deleted. `src/theme/uiFontsImportFence.test.ts` in the established shape (cite
      `mathImportFence.test.ts`'s ablation; not re-earned).
      Files: `src/theme/uiFonts.ts` (new) · `src/theme/uiFonts.test.ts` (new) · `src/theme/uiFontsImportFence.test.ts`
      (new) · `design/tokens.css` · `src/theme/readerCss.ts` · `src/app/appShell.ts` ·
      `tests/browser/uiFonts.browser.test.ts` (new) · `tests/browser/uiFontsNetwork.browser.test.ts` (new)
      Verify: (**unit**) idempotence and failure-swallowing (a rejecting `FontFace.load` leaves the page rendering).
      (**real engine, Cr+Fx**) app page: `document.fonts.check()` true for each face; computed `font-family` resolves to
      Bricolage on chrome, Sometype on code, Literata on prose; content-script reader: the computed face for chrome and
      code is a system face. **Zero network**, after `wireSettled()`: zero font requests on the content script, zero
      non-extension requests on the app page — with a firing positive control and a SLOW case (a served font URL
      injected in the control arm, delayed) read only after settle. Red-first: point one face at an `https:` URL → the
      network test fails naming it; drop the `--sans` deletion → the app chrome resolves to `system-ui` and the face
      assertion fails. Bytes: content script moves by the stack strings only (expected tens to low hundreds of bytes;
      the +2 KB tripwire applies) — decomposed, md5 under ablation; `.output` grows by the emitted woff2 files + module.
      Full suite. Golden EMPTY · manifest 654 / 770 B · `permissions: []`. [D-2, D-3]
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 2.4").* `document.fonts.add` — measured: an `@font-face` in the
      shadow root is ignored on both engines. Stacks per D-3 in tokens.css, the reader and the shell; 2.1's font-token
      exception ended. Red-first on the app-page arms; ablations: off-origin face (an off-origin loopback URL, not
      `https:` — no real host), the `--sans` override, a missing file, the fence. Content script +153 B (the two stack
      strings; md5 restored with them reverted), app chunk +1,219 B, woff2 93,836 B. Necessary ripple: `reader.test.ts`
      (re-spelled, property named), `designTokens.test.ts`, and four network guards that read the shell's harness-only
      same-origin font fetches (faces loaded in a `beforeAll`; no assertion edited). No layout test moved.

- [x] **2.5 The font measurement — numbers for the human, FORBIDDEN from choosing (D-4; §9-2(c)).** ★ **HUMAN GATE
      ONLY IF IT ARISES.** Both engines, A-B-A against a same-session HEAD control, floor beside median, firing control
      included. **Arm (b), the default:** `.output` and zip deltas of the packaged faces (static vs variable Bricolage
      — the one choice this task may make, by bytes alone, stated rule: fewer bytes wins); app-page first paint against
      165 ms; content-script delta (stacks only). **Arms (a) and (c), information only:** the content-script delta if
      the full faces, or Bricolage 600 + Sometype 400, were inlined, and content-script first paint for each against
      165 ms with its 15.3 ms worst-arm headroom. Scratch arms reverted before commit (md5 restored, shown).
      Files: `docs/ai/progress.md` (the numbers) · `assets/fonts/bricolage-*.woff2` only if the variable form wins
      Verify: the table pasted for both engines. **Gate rule:** if arm (a) or (c) shows a first-paint delta inside the
      noise floor, the numbers go to the human, who may choose it and set a ceiling — every later task waits on that
      ruling; otherwise the default stands with no gate, stated. No recommendation in the record. Content-script md5
      identical to 2.4 at commit. Golden EMPTY · manifest 654 / 770 B · `permissions: []`. [D-4]
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 2.5") — NO GATE.* Cloud VM, 4 vCPUs: absolute times run ~2.7× the
      historical local figures, so the DIFFERENCES are the result. Content script, 30 warm runs per arm interleaved
      with two HEAD arms (HEAD vs itself: −15.6 ms median, 95% CI [−41.9, +0.7]): arm (a) +71.6 ms median / +93.1 floor,
      CI [+48, +110]; arm (c) +43.2 / +39.7, CI [+20, +67] — both OUTSIDE noise, so the default stands with no gate.
      App page (48 runs per arm): the fonts' cost is inside noise (no-fonts arm −12.1 ms, CI [−32, +7]); the firing
      control (126 KB inlined) fires at +48.5 ms. Static vs variable by bytes: static (72,816 vs 79,464 B) — no file
      change. First paint is Chromium only (Playwright loads no Firefox extension); bytes on both engines. Scratch arms
      discarded; content-script md5 `5b241f93…` / `8506e382…` = 2.4. Carried, information only: Literata Latin
      Extended in the content script, +99,247 B, +24.0 ms median, CI [−16, +53] — not resolvable here.

- [x] **2.6 Icons: PNGs rendered from the committed SVGs; manifest and store assets (D-15; G-14; F-7).** TEST FIRST.
      Confirm `assets/icons/icon-{16,32,48,128}.svg` match `design/icons.html`'s size-specific drawings (shapes,
      strokes; differences named). `scripts/render-icons.ts` renders each in Chromium at its exact size, transparent
      background, into `public/icons/`; also the CWS 128 (96×96 artwork, 16 px transparent padding) and the Edge 300×300
      into `docs/store/assets/` (not packaged). `wxt.config.ts` gains `icons` 16/32/48/128 and `action.default_icon`
      16/32. `PERMISSIONS.md` records both keys (spec §5). PNGs committed.
      Files: `scripts/render-icons.ts` (new) · `public/icons/icon-{16,32,48,128}.png` (new) ·
      `docs/store/assets/{cws-icon-128,edge-logo-300}.png` (new) · `wxt.config.ts` · `tests/manifest.test.ts` (ADDITIVE
      only, G-14) · `tests/icons.test.ts` (new) · `docs/trust/PERMISSIONS.md`
      Verify: (**unit**) `manifest.test.ts` gains — never loses — assertions: `icons` declares PNG at 16/32/48/128;
      `action.default_icon` 16/32; `permissions` still `[]`, no `web_accessible_resources`, no `host_permissions`.
      `icons.test.ts`: each declared file exists with the declared pixel size (PNG IHDR read); the CWS icon is 128×128
      with a fully transparent 16 px border and non-transparent pixels inside it. Red-first: delete one PNG → red naming
      it; declare a wrong size → red. `git diff tests/manifest.test.ts` shows additions only. Bytes: `.output` + the
      PNGs; **manifests grow** — new figures stated for both engines and carried from here (F-7); content-script md5
      identical. Full suite. Golden EMPTY. [D-15; G-14]
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 2.6").* The four SVGs equal `icons.html`'s size-specific drawings
      (no differences). The non-square 32 / 48 / 128 drawings are centred on transparent squares at whole-pixel
      offsets; CWS 128 = the 128 drawing at 96×83 inside a 16 px transparent border; Edge 300 = the 128 drawing
      re-rendered at 300. Re-render byte-identical on this machine. Manifests **833 / 949 B** (were 654 / 770) —
      carried from here (F-7); `.output` +8,231 B (PNGs 8,052 + manifest 179); content script and app chunk
      md5-identical. Browser suite not run (nothing rendered changes); the three built-manifest browser tests pass.

*Group-2 acceptance: tokens one-source and pinned; the census exists with its inventory and G-4/G-5 applied; faces
packaged on the app page, system stacks on the content script, zero font requests anywhere; licences in the package;
the font numbers recorded (and ruled, if they argued); icons in the manifest.*

## 3 — ★ The toolbar mock — HUMAN GATE (D-5; gate-1 Q8, §10-2)

- [x] **3.1 ★ `design/toolbar-mock.html`, approved in writing before any toolbar code.** A standalone static page that
      links `tokens.css` and `@font-face`s 2.3's woff2 files by relative path (zero network; no Google Fonts), drawn from
      the mockup's own CSS vocabulary: the proposed toolbar in **light and dark at 1440, 1080 and 414 px** as fixed-width
      frames, in the states **reading, editing, watching, Compare open, the narrow "Files" overlay open, the one-time
      snapshot notice**, plus **the status line** (D-9's three statements only). Shows the mark (fixed ink `#16171F`),
      file name in the highlighter, agent badge, watch pill (G-4: ink text, green dot), Compare + picker, Read / Edit /
      Raw, and ONE theme control, code theme, Stored data, Export. No unshipped affordance (spec §3.1). The agent captures
      a PNG per frame (Playwright, scratch, not committed) for the record.
      Files: `design/toolbar-mock.html` (new) · `docs/ai/decisions.md` (the approval, as given)
      Verify: (agent) the page loads in Chromium and Firefox from `file://` with zero network (one Playwright pass,
      request log empty after settle); every listed frame × state × theme present (checklist pasted). **(human)** opens
      the file in Chrome and Firefox, annotates, approves in writing. **The approval — with any changes — is banked in
      `decisions.md` before 4.0 starts;** a change that alters D-5's architecture is a plan redline, not a mock edit.
      No production bytes. [D-5; D-9, D-10 drawn; gate-1 Q8]
      ★ *2026-11-01 (the 2.2 ruling, `decisions.md` "M13 RULING — the Peekover code theme"):* the mock also carries a
      **sample code block** — the main token kinds of the six shipped languages (default text, keywords, comments,
      strings, numbers and constants, types and attributes, functions and tags) — in **light and dark**, coloured by task
      5.8's proposed mapping on `--code-bg`, so the human approves the Peekover code theme by eye at this gate, including
      its three flagged new light values (strings `#197E44`, numbers `#B34F2E`, types `#966319`).
      ★ *2026-11-02 (task 2.5, `decisions.md` "M13 TASK 2.5"):* the mock also shows, side by side, the Bricolage text the
      app draws above 16 px — the drop-zone message (20 px / 700) and the presentation-mode nav (20 px) — in the shipped
      static files (`opsz` 12) and in the variable file with automatic optical size, plus one display line at 44 px /
      700 for reference, so the human judges the optical-size difference by eye. Both forms load from scratch copies in
      the mock only (`assets/fonts/README.md` has the variable command).
      ★ *2026-11-02 — MOCK DELIVERED, AWAITING THE HUMAN'S WRITTEN APPROVAL (`decisions.md`, "M13 TASK 3.1"); NOT
      ticked.* `design/toolbar-mock.html`: 9 states × light / dark × 1440 / 1080 / 414, the code-theme sample and the
      optical-size panel, a 15-point review guide at the top. Self-check, both engines from `file://`: zero non-`file:`
      requests, no overflow (one 414 px picker overflow fixed), no overlap, no text below AA. The variable font for the
      optical-size panel is embedded as a `data:` URI (not shipped). No group-4 task starts before the approval is banked.
      ★ *2026-11-02 — APPROVED WITH ONE REDLINE (`decisions.md`, "M13 GATE — 3.1 TOOLBAR MOCK APPROVED"); NOT ticked
      until the human confirms the 414 frame.* Item 7: at ≤ 863 px (measured) the four app controls collapse behind
      "⋯" (More) and the toolbar keeps at most two rows; the 1080 two-row wrap stays. Group 4 builds the toolbar to the
      approved mock, this compact rule included (the shell's own width rule; the mock's container query stands in).
      Bricolage ships static (item 15).
      ★ *2026-11-02 — CONFIRMED by the human; TICKED.* The 414 frame and the More menu approved in both themes; the
      breakpoint 863 px approved over ~700; the compact layout approved as shown.

## 4 — Toolbar implementation (D-5 … D-10, D-17)

*Order follows F-6 (Q1): controls join the toolbar first while the pills still render; the app page drops the pills in
4.5, with D-8, so no commit loses a function or the capture disclosure; the band follows in 4.6. Between 4.1 and 4.4
the app page shows some controls twice — unreleased, stated.*

- [x] **4.0 The re-spelling census — before any toolbar code (D-17; gate-1 Q8's authorization).** Against the approved
      mock and plan §5.3's 48 candidate files (43 browser, 5 unit), classify every test that touches moved chrome:
      **unchanged**, **re-spelled** (selector or location moves; property kept), **retired** (the property ceases to
      exist), **replaced** (a new test owns it in the new home) — each row naming the property and the group-4 task that
      will touch it. Run the full browser suite once at HEAD as the baseline (counts recorded). No production or test
      edit.
      Files: `specs/013-first-release/census.md` (new — Q2) · `docs/ai/progress.md`
      Verify: every one of the 48 files has a row; every non-"unchanged" row names a property and a task; the baseline
      pass/skip counts recorded per engine; the retirements listed separately for the human (shown at group 4's end).
      `git diff --stat` touches only the two files. No production bytes. [D-17]
      ★ *Landed 2026-11-02 (census.md; the two-file rule moved this tick and the `decisions.md` entry into 4.1's commit).*
      353 rows across 71 test files (re-spelled 209, unchanged 104, retired 27, replaced 13); baseline 2,017 passed / 51
      skipped / 0 failed; six questions, ruled the same day (A–F, recorded on each task they govern).

- [x] **4.1 The `pills` mount option + toolbar skeleton: mark, crumb, Read / Raw (D-5; F-1).** TEST FIRST.
      `MountOptions.pills?: boolean` (default `true`); when `false`, `mount()` skips the mode toggle, theme control,
      watch chrome, diff pill / picker / status and agent badge, and still builds the TOC rail, remote-load bar, network
      indicator, failure banner and every enhancer's in-document tools; `chrome: false` implies it. **The app page does
      NOT pass it yet** (F-6). `src/app/toolbar.ts` builds the header per the mock: the mark (blink only under
      `prefers-reduced-motion: no-preference`), the file name in the highlighter, Read / Raw driving `setReaderMode`;
      one `MutationObserver` on the active host's `data-mode` / `data-watch` / `data-diff`, re-bound on document switch.
      `TOOLBAR_CSS` in the shell's document sheet; the shell sheet gains its own global reduced-motion rule.
      Files: `src/render/mount.ts` · `src/render/mount.test.ts` · `src/app/toolbar.ts` (new) · `src/app/toolbar.test.ts`
      (new) · `src/app/appShell.ts` · `tests/browser/toolbar.browser.test.ts` (new) · census-named re-spellings only
      Verify: (**unit**) omitted `pills` and `pills: true` commit identical serialised shadow roots; `pills: false` omits
      exactly the five pill groups and keeps the four document-bound ones (each selected by class alone). (**Cr+Fx**)
      Read / Raw in the toolbar flips `data-mode` and the toolbar reflects a backslash-key flip and a document switch;
      reduced motion: the mark's animation is `none` under reduce and running without it, measured in the same run
      (non-vacuous, the watch-pulse pattern); red-first: drop the observer → the toolbar misses the key flip, in that
      assertion. Every re-spelled assertion carries `KEEPS:`. Bytes: content script moves by the one conditional
      (expected tens of bytes) — decomposed, md5 under ablation; app chunk delta stated. Full suite. Golden EMPTY ·
      manifest (2.6's figures) · `permissions: []`. [D-5; D-17]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **B** — the Verify reads "the toolbar
      reflects a mode flip it did not make" (e.g. the mode pill, which renders until 4.5); `\` stays inert on the app page
      (2026-07-17). **F** — the header's "Zero network by default" tag is removed here.
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 4.1").* `pills` option (+18 B content script, md5 restored with it
      reverted); the toolbar skeleton (+3,457 B app chunk); ablations red (the blink needs both mechanisms removed). A
      regression the full suite found — the Export panel at x −195 at 414 px — fixed here by the human's ruling: at ≤ 863 px
      the three header panels drop from the header (+361 B); census C244 re-spelled here (was 4.4). Read / Raw disabled while
      editing until 4.3; the token pin's logo exceptions removed (both approved deviations).

- [x] **4.2 Watch, Compare + picker, agent badge in the toolbar (D-5).** TEST FIRST. The toolbar reuses
      `buildWatchControl(host)` (state via `aria-pressed`, styled by an app-sheet rule) and the diff registry's Compare,
      picker and status; the agent badge from the same source as the pill's. Pills still render (F-6).
      Files: `src/app/toolbar.ts` · `src/app/toolbar.test.ts` · `src/app/appShell.ts` ·
      `tests/browser/toolbar.browser.test.ts` · census-named re-spellings only
      Verify: (**Cr+Fx**) clicking toolbar Watch starts and stops the SAME watch the pill does (registry state and both
      controls' `aria-pressed` agree, delta-asserted); Compare opens the picker and the diff; the badge shows for an
      agent file and not for a plain one; red-first: bind the toolbar's Watch to a fresh controller → the pill disagrees,
      in that assertion. `KEEPS:` on each re-spelling. Content-script md5 identical to 4.1 (all edits app-only). Full
      suite. Golden EMPTY · manifest · `permissions: []`. [D-5]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **A** — the watch note is built here, in
      the notice area below the toolbar (in the page flow, never over text), alongside the toolbar's Watch.
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 4.2").* Watch, Compare + picker and the badge from the pills'
      own builders; Watch shared through the registry, Compare through the host's `data-diff` (the toolbar writes it onto
      both controls); synced both directions, both engines. The watch note and Compare's status in the notice area
      (ruling A), in the page flow at 414 / 1080 / 1440. Content-script md5 identical to 4.1; app chunk +3,544 B. A
      regression the full suite found (C061: the badge `<p>`'s UA margins grew an agent file's header 20 px) fixed here.
      Necessary ripple: `diffChrome.ts` exports its three labels. Census C355 / C356 discovered and re-spelled.

- [x] **4.3 The Edit segment; the shadow-root edit control and `EDIT_CONTROL_CSS` removed (D-6).** TEST FIRST.
      `editorEnhancer.ts:115–140`'s enter/exit body is extracted to an exported `toggleEdit(host, options)`; the toolbar's
      Read / Edit / Raw gains Edit calling it (lazy loader, "Editor unavailable" retry state kept); the unsaved-changes
      guard's capture hook (`appShell.ts:871ff`) re-targets to the segment; `EDIT_CONTROL_CSS` and its injection go.
      Files: `src/render/editorEnhancer.ts` · `src/render/editorEnhancer.test.ts` · `src/theme/readerCss.ts` ·
      `src/app/toolbar.ts` · `src/app/appShell.ts` · `tests/browser/toolbar.browser.test.ts` · census-named
      re-spellings / retirements (e.g. the Edit-pill-vs-TOC-handle overlap test — `RETIRED:`)
      Verify: (**Cr+Fx**) Edit enters edit mode via the toolbar; a dirty exit through the segment raises the guard
      dialog (red-first: leave the hook on the old target → the dirty exit discards without asking); a rejected loader
      shows the retry state, never blank; `editorImportFence.test.ts` green unchanged. No shadow root carries an edit
      control (selected by class alone). Bytes: app chunk FALLS (stated); content-script md5 identical to 4.2
      (`EDIT_CONTROL_CSS` was not on that graph — proven by md5, not grep). Full suite. Golden EMPTY · manifest ·
      `permissions: []`. [D-6]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **E** — Read and Raw leave edit through
      the unsaved-changes guard; "Editor unavailable" shows on the Edit segment; focus returns to Edit after Escape. RETIRED:
      census C046 (R3, "the exit returns to the mode edit was entered from") and C174 (the same property in `editorRender`).
      ★ *Landed 2026-11-02 (`decisions.md`, "M13 TASK 4.3").* `toggleEdit` / `leaveEdit` extracted; Read · Edit · Raw;
      Read and Raw leave edit through the guard (hook moved to the toolbar); "Editor unavailable" on the segment; focus to
      Edit on Keep / Escape. Control and `EDIT_CONTROL_CSS` gone; its notice-seat rule kept as `CAPTURE_NOTICE_SEAT_CSS`
      until 4.5 (deviation). Content-script md5 identical; app chunk +44 B (D-6 −164, an in-task Export-panel fix at
      1080 px +208). Census: 99 rows (89 / 7 / 3), C165 retired in part (deviation), C357–C361 discovered.

- [x] **4.4 App-level controls: one theme control, code theme, Stored data, Export (D-5).** TEST FIRST. Composed per the
      mock; the header's existing app controls move into the toolbar; ONE theme control (the reader pill's and the
      shell's merged, driving the theme runtime's setter). Pills still render.
      Files: `src/app/toolbar.ts` · `src/app/toolbar.test.ts` · `src/app/appShell.ts` · `src/app/exportControls.ts` /
      `storageControls.ts` / `src/theme/codeThemeControl.ts` only for their mount point · the census-named tests
      Verify: (**Cr+Fx**) the toolbar theme control changes shell and reader together, and the choice persists across
      reload (red-first: wire it to the shell only → the reader's computed `--paper` stays, in that assertion); each panel
      opens from the toolbar and keyboard order matches the mock's left-to-right. `KEEPS:` on re-spellings.
      Content-script md5 identical to 4.3. Full suite. Golden EMPTY · manifest · `permissions: []`. [D-5]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **C** — the "⋯" (More) collapse at
      ≤ 863 px belongs HERE. Tests not about the compact toolbar widen their window instead of opening "⋯"; the compact
      toolbar gets its own tests (census: the 47 rows whose first task is 4.4).
      ★ *Landed 2026-11-03 (`decisions.md`, "M13 TASK 4.4").* The four app controls in the toolbar's right-hand group
      (the theme control is the same builder and broadcast — shell and reader together, red-first on `--paper`); ≤ 863 px:
      "⋯" menu (Enter / Space, arrows, Home / End, Tab, Escape → "⋯"), no wordmark, the file name truncating, "Agent file",
      two rows in every state at 414 / 860 / 863. Both stopgaps (4.1's inset, 4.3's Export flip) removed — re-measured
      unneeded. Compact "Close" for an open comparison (deviation). C061's app arm moved to 1400 by the human's ruling.
      Census 47 (43 re-spelled, 1 replaced, 3 unchanged) + C362–C364. Content script md5 identical; app chunk +3,845 B.

- [x] **4.5 The one-time snapshot notice + its permanent home; the app page drops the pills (D-8, D-5; G-15; F-6).**
      TEST FIRST. The toolbar module renders the capture disclosure once, below the toolbar and never over text, with
      "Got it" writing an app-only settings-store row (key `notices`, not a `Settings` field — G-15) and a "Stored data"
      link; `STORAGE_DISCLOSURE_NOTE` aligned to state every clause the notice states. **In the same commit** the app page
      passes `pills: false`, and `CONTAINED_CSS`'s app-only pill overrides (`readerCss.ts:1314–1335`) are deleted.
      Files: `src/app/toolbar.ts` · `src/app/storageControls.ts` · `src/app/store.ts` (the row's get / set only) ·
      `src/app/appShell.ts` · `src/app/readerPane.ts` (the option) · `src/theme/readerCss.ts` · their unit tests ·
      `tests/browser/snapshotNotice.browser.test.ts` (new) · census-named re-spellings / retirements
      Verify: (**Cr+Fx**) the notice shows on first watch with capture on; "Got it" hides it and it stays hidden across
      reload; **"Wipe all data" restores it** (D-12; red-first: store the dismissal outside the settings store → the wipe
      test fails); after dismissal the Stored data panel shows the disclosure with every clause (Q13 / §10-4). With
      `pills: false` on the app page: no pill in any app-page shadow root, every function reachable from the toolbar,
      and the capture disclosure is never absent while watching with capture on (asserted across the switch). No chrome
      rect overlaps a text line box at 1440 / 1280 / 1080 / 414 (the hit-test is the assertion seen to fail; select by
      class alone). Bytes: content script moves by the `CONTAINED_CSS` deletion (falls) — stated, decomposed; zero
      `Settings` diff. Full suite. Golden EMPTY · manifest · `permissions: []`. [D-8, D-5; G-15]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **A** — the watch note lives in the
      notice area below the toolbar (beside this notice, in the page flow, never over text); **D** — on the app page the
      remote-images "load" bar joins the same notice area (the file:// reader keeps it where it is). Both before the pills
      drop here. Census rows: A — C020, C326–C328, C331, C334, C343–C345; D — C031, C141, C143 (retired). The tasks.md
      citation `readerCss.ts:1314–1335` has drifted: `CONTAINED_CSS` starts at 1343 (census.md notes).
      ★ *Landed 2026-11-03 (`decisions.md`, "M13 TASK 4.5" and "M13 RULING — C130").* `pills: false` at every app-page
      mount and re-render (select, the save and watch re-renders via `renderWithEnhancements`; a diff exit and a theme
      change mount nothing) — no pill after any, both engines; the file:// reader keeps every pill. The snapshot notice
      in the notice area ("Stored data", "Got it"), its dismissal in the app-only `notices` row, back after Wipe; the
      Stored data note states every clause (Q13). The watch note and the load bar in the notice area; Compare's status
      inside the picker's dropdown while it is open (the human's ruling on C130). `CAPTURE_NOTICE_SEAT_CSS` and the
      `CONTAINED_CSS` overrides removed. Census 100 (70 / 21 / 9) + the 4.3 cells' 4.5 steps + C365–C371; C168
      unpredicted. Content script −736 B (the CSS deletion, as above); app chunk +2,209 B. The carried contrast-census
      item: the code-theme premise not proven; the census now supplies its own settings (hardening, kept).

- [x] **4.6 The 130 px band reclaimed on the app page (D-7; F-2).** TEST FIRST. `CONTAINED_CSS` sets the reading
      column's AND the diff's (`readerCss.ts:227`) bottom padding to the top value, and `--edit-bottom` to the gap the
      status line needs; the content script keeps 130 px (its pills remain). `editorWalkPolish`'s bottom-gap tolerance
      (`24 + 130 + 8 = 162`, R29 Decision 2) re-spelled to the new geometry with `KEEPS:`.
      Files: `src/theme/readerCss.ts` · `tests/browser/editorWalkPolish.browser.test.ts` · census-named geometry tests
      Verify: (**Cr+Fx**) on the app page the last line of a long document, a diff and the editor sit within the new gap
      of the pane's foot at 1440 and 414; on the content script the 130 px band is unchanged (red-first: apply the rule
      outside `CONTAINED_CSS` → the content-script assertion fails). Bytes: content script moves by the `CONTAINED_CSS`
      edit only — stated. Full suite. Golden EMPTY · manifest · `permissions: []`. [D-7]
      ★ *Landed 2026-11-03 (`decisions.md`, "M13 TASK 4.6").* On the app page the column and the diff end at 56px
      (`CONTAINED_CSS`, `@media screen`); the split's `--edit-bottom` is 0 (set in EDITOR_CSS — app-only, and later than
      CONTAINED_CSS — a deviation from this line's wording), with 56px kept while the network indicator shows. Measured:
      reading / diff ~80 px (24 + 56), the split ~24 px, at 1440 / 1080 / 414, both engines and themes; the file://
      reader 130px (control; red-first A3). C225 re-spelled (162 → 28). Content script +74 B (the CONTAINED_CSS rule
      only); app chunk +158 B. Finding: the TOC rail's own 130px bottom padding, unchanged. 4.7: add the status line
      to `editorWalkPolish`'s 4.6 overlap set.

- [x] **4.7 The status line: three statements, each test-backed (D-9; G-3; gate-1 Q9).** TEST FIRST. App-page-only,
      `role="status"`, no `--faint`: the open file's name; "No network calls" / "Network: N requests you made" from the
      indicator state OR a `PerformanceObserver` on `http:`/`https:` resource entries; "Peekover <version>" from
      `runtime.getManifest().version`. Nothing else.
      Files: `src/app/statusLine.ts` (new) · `src/app/statusLine.test.ts` (new) · `src/app/appShell.ts` ·
      `tests/browser/statusLine.browser.test.ts` (new)
      Verify: (**unit**) A then B shows B; no file clears it; version equals `package.json`'s. (**Cr+Fx**, after
      `wireSettled()`) blocked remote media with no user action reads "No network calls" with zero http(s) entries;
      the positive control (the user loads the media, plus a SLOW served image) flips it — read after settle, never
      early; red-first: drop the observer arm → the slow-image case still reads "No network calls". The out-of-order
      `readerPane.select` race is not claimed fixed (stated). Content-script md5 identical to 4.6. Full suite. Golden
      EMPTY · manifest · `permissions: []`. [D-9; G-3]
      ★ *2026-11-02 (HUMAN RULINGS on the 4.0 census, `decisions.md` "M13 RULINGS — the 4.0 census questions"):* **F** — the status line's test-backed
      "No network calls" carries the claim the removed header tag made (removed at 4.1).
      ★ *Landed 2026-11-03 (`decisions.md`, "M13 TASK 4.7" and "M13 RULING — 4.7's network statement").* The line:
      the open file (set in `selectFile`, every route), "No network calls" / **"Network used" — no count, by the human's
      ruling** (Firefox writes no Resource Timing entry for a request whose connection fails), and "Peekover <version>"
      from `runtime.getManifest()` (read in `entrypoints/app/main.ts` — necessary ripple). Zero, user-load and slow
      (late, outside the load bar) cases on both engines, read after settle; red-first: the observer arm dropped → the
      slow case reads "No network calls". `editorWalkPolish` measures the split to the pane's foot and checks the line.
      Content script md5 identical to 4.6; app chunk +2,291 B.

- [x] **4.8 ≤ 1080 px: the folder pane becomes an overlay behind "Files" (D-10; gate-1 Q12); app-page first paint.**
      TEST FIRST. First re-measure the breakpoint on the shipped layout (the narrowest width keeping ≥ 60ch reader text
      beside the pane), state it, then fix it. Under the shell's `@media` block the folder `nav` becomes a fixed overlay
      (scrim, focus in, Escape and outside-click close, focus returned); "Files" shows only there. TOC rules untouched
      (Q11). Then the app-page first-paint A-B-A after the toolbar, mark blink and `backdrop-filter` (gate 165 ms).
      Files: `src/app/appShell.ts` · `src/app/toolbar.ts` · `tests/browser/filesOverlay.browser.test.ts` (new) ·
      `docs/ai/progress.md` (the breakpoint and first-paint numbers)
      Verify: (**Cr+Fx**) at the measured width + 1 the pane is inline; at the width the pane is hidden and the reading
      column keeps its full measure; "Files" opens it, Escape and scrim close it, focus returns to "Files"; red-first:
      drop the focus return → that assertion fails. First paint A-B-A both engines, floor beside median, against 165 ms.
      Content-script md5 identical to 4.7. Full suite. Golden EMPTY · manifest · `permissions: []`. [D-10]
      ★ *2026-11-02 (HUMAN RULING 3 after 2.5):* the first-paint gate is judged on the DIFFERENCE measured in the same
      session (A-B-A); an absolute figure against 165 ms needs a local run by the human, recorded as such.
      ★ *Landed 2026-11-04 (`decisions.md`, "M13 TASK 4.8").* **The breakpoint is 1272 px, not 1080** — measured on both
      engines and themes: 60ch is lost at ≤ 1272 with the TOC rail open (its default beside the pane), ≤ 976 collapsed;
      the HUMAN RULED 1272. At ≤ 1272, while a document is open, the pane is an overlay behind "Files" (APG disclosure
      button + modal-dialog focus: in, held, Escape / scrim → focus back on "Files"; a file choice closes it, after the
      guard). With no document open the pane stays in the row (deviation: it holds "Open a folder"). First paint (local,
      the human's machine, Chromium): H − pre-toolbar `432cd02` = −0.6 ms median (CI [−2.6, +2.0]; H-vs-H +0.7) — inside
      noise; 104.2 / 95.0 ms median / floor against 165. No `backdrop-filter` ships (flagged). Content-script md5
      identical to 4.7; app chunk +2,609 B. P1 (statusLine probes that must land) and P2 (`fontLicences` separators)
      test-only. Census: C264, C218, C260.
      ★ *2026-11-04 (4.8 FIX; HUMAN RULING): the breakpoint is **1281 px** (supersedes 1272) — Chromium on Linux draws
      Literata's "0" at a whole 10 px, so 60ch = 600 px and is lost beside the pane at ≤ 1281 (`decisions.md`, "M13
      TASK 4.8 FIX"). A 1280 px window gets the overlay.*

*★ GROUP 4 COMPLETE (2026-11-04) — 4.0–4.8 landed. The census's 28 retirements are listed for the human in
`census.md` § "Retirements" (gate-1 Q8), unchanged since 4.5.*

*Group-4 acceptance: one toolbar per the approved mock; every reader function reachable from it; the pills gone from
the app page only; the notice one-time, wipe-safe and permanent in Stored data; the band reclaimed; the status line's
three statements; the Files overlay. **The census's retirements are listed for the human here** (gate-1 Q8: re-spellings
are authorized, a retirement is shown).*

## 5 — Surfaces (plan §3; the five carried reader-polish items)

*Each task restyles from tokens and the mockup's vocabulary, keeps behaviour, re-runs 2.2's census (its pending rows for
that surface deleted, none added) and the native-control sweep. The sweep test lands in 5.1 with every
not-yet-restyled surface on a named pending list that each later task shrinks; it is empty at 5.7 (Q4).*

- [x] **5.0 Flake pass — DISCOVERED (2026-11-04, the human's kickoff after 4.8; before 5.1).** Test-only. For each known
      flake (`pipeline.perf`, `watchRemount`'s Raw place, `editorPreview`'s keystroke count, the contrast-census
      inventory, `uiFonts`' "chrome drew Bricolage", `diagramEnhancer`'s 5 s timeouts): the rate alone and in its suite,
      the cause with evidence or "not found" with what was ruled out, a test-only fix (no `retry`, no skip, nothing a test
      proves loosened) or a failure message naming the stalled step and the state it saw; the proof after. Plus the 28
      group-4 retirements in plain words, in the report (gate-1 Q8).
      Files: the flakes' own test files · `vitest.config.ts` / `package.json`'s `test` script (isolation only) ·
      `docs/ai/decisions.md` · `docs/ai/progress.md` · this file
      Verify: lint; unit; the full browser suite twice, both engines, every red classified; golden EMPTY; content-script
      md5 and app chunk (552,318 B) identical to `8e9bf0c`.
      ★ *Landed 2026-11-04 (`decisions.md`, "M13 TASK 5.0").* Three fixed with causes proven (`pipeline.perf` — parallel
      workers' load, now its own project run after the unit project; `diagramEnhancer` — the real mermaid loading behind
      the prologue's tests; `uiFonts` — Firefox adds the per-user installed Bricolage to its font list ~40–60 s after
      start); `watchRemount` named (cause not found; its red now carries the scroll state); `editorPreview` and the
      contrast census not reproduced (diagnostics kept). No product change.

- [ ] **5.1 Folder pane; the native-control sweep lands.** TEST FIRST. Width 228, caps section heads, row / hover /
      active per `mockup.html:78–87`, search field, pin / revoke in the `.iconbtn` style.
      `tests/browser/nativeControls.browser.test.ts` (new): every `button` / `select` / `input` on every surface, both
      themes, has an author `background-color` and `border-style` (not `buttonface` / `outset`); scrollbars carry
      `scrollbar-color`; pending list named.
      Files: `src/app/treeView.ts` · `src/app/recentsView.ts` · `src/app/appShell.ts` ·
      `tests/browser/nativeControls.browser.test.ts` (new) · census-named tests
      Verify: (**Cr+Fx**) the pane's controls leave the pending list; red-first: strip one rule → the sweep names that
      control. Census pending rows for the pane deleted. Content-script md5 identical. Full suite. Golden EMPTY ·
      manifest · `permissions: []`. [plan §3; gate-1 Q12 kept]
- [ ] **5.2 TOC look (gate-1 Q11; G-12).** TEST FIRST. Row, "here" highlighter gradient (`mockup.html:102–104`), card;
      collapsed state gains a decorative `aria-hidden` tick column — no hover card, no behaviour change.
      Files: `src/theme/readerCss.ts` · `src/render/toc*.ts` (markup for the ticks only) · census-named tests
      Verify: (**Cr+Fx**) the tick column is `aria-hidden` and absent from the a11y tree; the rail's keyboard and toggle
      tests unchanged (behaviour pinned, red-first: give a tick a tabindex → the order test fails). Bytes: content script
      moves (READER_CSS + markup) — stated, decomposed, tripwire applies. Full suite. Golden EMPTY · manifest ·
      `permissions: []`. [Q11; G-12]
- [ ] **5.3 Code, math and table buttons (gate-1 Q14; carried (f), (g)).** TEST FIRST. Code toolbar restyled to the
      mockup's copy button (`:151–156`), Line numbers / Wrap / Copy kept; display math loses the code-block toolbar and
      keeps Copy LaTeX / MathML styled like the copy button; table filter-clear and sort buttons from tokens.
      Files: `src/theme/readerCss.ts` · the enhancer CSS / markup that attaches the toolbar to math (attachment only — no
      behaviour change) · census-named tests (`codeToolbar`, `mathActions`, `tableTools`, `tableScope`)
      Verify: (**Cr+Fx**) a display-math block carries no code toolbar (selected by class alone; red-first: restore the
      attachment → present); Copy LaTeX still copies (specific-content clipboard match); sweep pending rows deleted.
      Bytes: content script moves — stated. Full suite. Golden EMPTY · manifest · `permissions: []`. [Q14]
- [ ] **5.8 The Peekover code theme — the default, built from design tokens, following the page theme (DISCOVERED
      2026-11-01; the human's 2.2 ruling, `decisions.md` "M13 RULING — the Peekover code theme"; count 41 → 42).** TEST
      FIRST. A light/dark code theme drawn from tokens, as `design/mockup.html` shows (`:152` `.codeblock pre` on
      `--code-bg`; `:157` tokens coloured from page tokens), becomes the DEFAULT code theme in place of `github-dark`. The
      20 shipped Shiki themes stay selectable and unchanged; a user's saved code-theme choice is untouched. **Proposed
      mapping, approved by eye in 3.1's mock** (ratios on `--code-bg`, light `#F1F1EB` / dark `#1C2030`, measured
      2026-11-01): default text `--ink` (15.74 / 13.61); keywords `--accent` at 500 (15.74 / 13.61); comments `--muted`
      (5.49 / 6.54 — not the mockup's `--faint`, 2.38 / 3.26, per G-5's logic); functions and tags `--ink`; strings `--ok`
      in dark (7.30) and a **NEW light value `#197E44`** (4.51; `--ok` is 3.08); numbers and constants `--del` in dark
      (5.98) and a **NEW light value `#B34F2E`** (4.55; `--del` is 4.35); types and attributes `--warn` in dark (7.58)
      and a **NEW light value `#966319`** (4.52; `--warn` is 3.21). The three new values are the nearest same-hue
      colours that pass; each is flagged for the human (at 3.1), with the alternative of an existing token (`--ink` /
      `--muted`) at the cost of hue. The mechanism (Shiki's CSS-variables theme, or a theme object built from the tokens)
      is chosen at the task against Shiki's current docs; an approved new value lands in `design/tokens.css` and joins
      2.1's pin.
      Files: `src/render/codeEngine.ts` (the theme) · `src/settings/settings.ts` (the default) · `src/theme/readerCss.ts`
      (code-token rules, if CSS-variable based) · `design/tokens.css` (only an approved new value) ·
      `tests/designTokens.test.ts` (a new value joins the pin) · `tests/browser/contrastCensus.browser.test.ts` (pending
      rows removed) · tests that pin `github-dark` as the default (re-spelled, each named, the property kept) · a test of
      the saved choice
      Verify: (**unit**) every token colour of the Peekover theme ≥ 4.5:1 on `--code-bg`, light and dark, with the
      values parsed from `tokens.css` at test time; red-first: point comments at `--faint` → red at 2.38 (light) / 3.26
      (dark). (**Cr+Fx**) the census's 8 pending rows go GREEN and its pending list is EMPTY (Q4); ablation: restore
      `github-dark` as the default → the census reds on exactly those rows. A saved choice (e.g. `monokai`, in the real
      IndexedDB) survives the default change and a re-mount. Bytes: content script and theme chunk deltas stated and
      decomposed (tripwire applies). Full suite. Golden EMPTY · manifest · `permissions: []`. [D-16; the 2.2 ruling]
      ★ *2026-11-02 (the 3.1 gate): the mapping is APPROVED as mocked* — the three new light values `#197E44` (strings),
      `#B34F2E` (numbers / constants), `#966319` (types / attributes) join `tokens.css` here; functions and tags take
      default text; keywords `--accent` (ink) at weight 500; comments `--muted`, italic.
- [ ] **5.4 Panels, unsaved dialog, lightbox, diff + picker.** TEST FIRST. `.panelbox` card (radius 14, one shadow),
      header row, list rows with hints; the dialog as `.overlay` scrim + card + ink primary; lightbox per
      `mockup.html:226`; diff and picker restyled, still inline (006 D-15).
      Files: `src/app/exportControls.ts` · `src/app/storageControls.ts` · `src/theme/codeThemeControl.ts` ·
      `src/app/appShell.ts` (dialog) · `src/theme/readerCss.ts` (lightbox, diff) · census-named tests
      Verify: (**Cr+Fx**) each panel's and the dialog's computed radius / shadow equal the tokens; focus trap and Escape
      tests unchanged; sweep and census pending rows deleted. Bytes: content script moves (lightbox, diff) — stated.
      Full suite. Golden EMPTY · manifest · `permissions: []`. [plan §3]
- [ ] **5.5 Empty / denied / unsupported app states.** TEST FIRST. Composed from `.alert` and the setup card — no new
      vocabulary.
      Files: `src/app/appShell.ts` · the state modules it composes · census-named tests
      Verify: (**Cr+Fx**) each state renders its message, never blank (AGENTS.md #5; red-first: throw in the state
      builder → the never-blank assertion fails); census rows deleted. Content-script md5 identical. Full suite.
      Golden EMPTY · manifest · `permissions: []`. [plan §3]
- [ ] **5.6 The content-script reader: pills restyled in place, network indicator, remote bar, failure banner;
      content-script first paint.** TEST FIRST. Pills restyled (Q10's default arm), the banner as `.alert`, 130 px band
      kept. Then the content-script first-paint A-B-A after 2.4's stacks and this restyle (165 ms, 15.3 ms headroom).
      Files: `src/theme/readerCss.ts` · `src/render/remoteMediaUi.ts` (markup only if needed) · census-named tests ·
      `docs/ai/progress.md` (first paint)
      Verify: (**Cr+Fx**, file:// and one raw host) census and sweep rows deleted; no chrome over text at the four
      viewports (hit-test). First paint A-B-A, floor beside median — a delta outside the floor that breaches 165 ms is a
      STOP. Bytes: content script moves — stated, decomposed; tripwire applies. Full suite. Golden EMPTY · manifest ·
      `permissions: []`. [plan §3; gate-1 Q10]
      ★ *2026-11-02 (HUMAN RULING 3 after 2.5):* judged on the same-session A-B-A DIFFERENCE; whether the absolute
      median breaches 165 ms is read only from a local run by the human, recorded as such (a cloud run is ~2.7× slower).
- [ ] **5.7 Editor details.** TEST FIRST. Save as an ink primary button, bar per `.edbar` (shape only — none of its
      unshipped tools, spec §6), faces via D-3; R11 unchanged.
      Files: `src/theme/readerCss.ts` (`EDITOR_CSS`) · `src/render/editor*.ts` (class names only if needed) ·
      census-named tests
      Verify: (**Cr+Fx**) Save computes the ink primary's tokens; R11's two-tone palette unchanged (pinned); the sweep's
      pending list is **empty**, the census's pending list holds no row this milestone could fix (each remaining row
      named and routed). Content-script md5 identical. Full suite. Golden EMPTY · manifest · `permissions: []`. [R11]

*Group-5 acceptance: every surface restyled; no native-styled control; census pending list empty or each row routed;
math without the code toolbar; content-script first paint inside 165 ms.*

## 6 — Onboarding (D-11; gate-1 Q18; G-10)

- [ ] **6.1 The onboarding page: detection per engine, the setup card, reachable from the app page (D-11).** TEST FIRST.
      Re-verify `extension.isAllowedFileSchemeAccess` against Chrome's and MDN's current docs. `entrypoints/onboarding/`
      (`index.html` + `main.ts`) + `src/app/onboarding.ts`: its own sheet (tokens pinned by 2.1's test, D-2's faces,
      reduced-motion rule, theme before JS); Chromium detection with re-check on `focus` / `visibilitychange`, a throw or
      missing API → "Unknown — here is how to check"; the Firefox build does not call the API
      (`import.meta.env.FIREFOX`) and says local files open directly (pending 8.1's real-install check); both engines
      state the four raw hosts need no setup. Deep link: whether `tabs.create('chrome://extensions/?id=…')` works from
      an extension page is verified here — a button if yes, copy-the-address + steps if no. Edge wording only if
      `navigator.userAgentData` detection is reliable, else "your browser's extensions page". App page gains "Setup
      guide". `PERMISSIONS.md` records the page.
      Files: `entrypoints/onboarding/index.html` (new) · `entrypoints/onboarding/main.ts` (new) ·
      `src/app/onboarding.ts` (new) · `src/app/onboarding.test.ts` (new) · `src/theme/uiFonts.ts` (second importer) ·
      `src/app/toolbar.ts` (the link) · `tests/designTokens.test.ts` (the new sheet) ·
      `tests/browser/onboarding.browser.test.ts` (new) · `docs/trust/PERMISSIONS.md`
      Verify: (**unit**) detection states true / false / throw / missing render distinct copy; the Firefox build path
      never references the API (asserted on the built Firefox chunk with a firing control: the Chrome chunk DOES
      reference it). (**Cr+Fx**) the page: zero network after `wireSettled()` with a firing slow control; constructed DOM
      only (no `innerHTML`); keyboard order; census and sweep green on it; a toggled stub value re-renders on `focus`
      without reload (red-first: drop the listener → stale state). Manifest unchanged by the page (a bundled page is not
      a key) — `permissions: []`. Bytes: `.output` grows by the entry; content-script md5 identical. Full suite. Golden
      EMPTY. [D-11; §7-9 sibling checklist]
- [ ] **6.2 Open once on install, never on update (D-11; G-10; gate-1 Q18).** TEST FIRST. `background.ts` gains
      `runtime.onInstalled` → `tabs.create({ url: runtime.getURL('/onboarding.html') })` only when `reason ===
      'install'`. `PERMISSIONS.md` records the listener (no `tabs` permission — the extension's own URL).
      Files: `entrypoints/background.ts` · `entrypoints/background.test.ts` (new or extended) ·
      `docs/trust/PERMISSIONS.md`
      Verify: (**unit**, stubbed `tabs.create`) `install` opens exactly once; `update`, `chrome_update`,
      `shared_module_update` open nothing (red-first: drop the reason check → `update` opens a tab). `manifest.test.ts`
      green, `permissions: []`. Bytes: background chunk delta stated; content-script md5 identical. Full suite. Golden
      EMPTY. [D-11; G-10]

## 7 — Release hygiene (D-14; G-1, G-8, G-9, G-13; §9-4, §9-5, §9-7)

- [ ] **7.1 Version 0.1.0 + CHANGELOG (gate-1 Q1).** TEST FIRST. `package.json` `0.1.0` (the manifest follows);
      `CHANGELOG.md` Keep-a-Changelog, one 0.1.0 entry assembled from the M1–M12 close records plus M13's shipped work,
      every line traceable to a close record (no unshipped feature).
      Files: `package.json` · `CHANGELOG.md` (new) · `tests/manifest.test.ts` (ADDITIVE: version, G-14) ·
      `docs/store/claims.md` (the CHANGELOG's rows)
      Verify: (**unit**) the built manifests' `version` is `0.1.0` and equals `package.json`'s (red-first before the
      bump); 4.7's status-line test still green. Each CHANGELOG line has a ledger row. Bytes: manifests length-neutral
      (F-7) — stated; content-script md5 identical. Golden EMPTY · `permissions: []`. [gate-1 Q1]
- [ ] **7.2 PRIVACY.md, THREAT-MODEL.md, SECURITY.md final (D-14's documents; G-1).** PRIVACY: no collection, no
      transmission, what is stored locally and how to wipe it, the only network is user-triggered remote media.
      THREAT-MODEL, one page: assets, adversaries, out of scope, where each defence is proven (test file names).
      SECURITY.md: reports via GitHub private vulnerability reporting (live when the repo is public), contact via
      issues, `hello@peekover.dev` nowhere; reproducibility and attestations promised "from the first public release"
      (§9-4), worded "file-identical" if 7.3 falls back (G-8) — 7.2 lands before 7.3, so the wording is set by 7.3's
      outcome and 7.3 edits it if needed.
      Files: `docs/trust/PRIVACY.md` (new) · `docs/trust/THREAT-MODEL.md` (new) · `docs/trust/SECURITY.md` ·
      `docs/store/claims.md` · `tests/truthPins.test.ts`
      Verify: `truthPins.test.ts` extended to PRIVACY and SECURITY (no address; every peekover.dev URL "live at
      release"; every test file THREAT-MODEL names exists — red-first with a misspelt name). Every sentence has a
      ledger row. No production bytes. [D-14; G-1]
- [ ] **7.3 Reproducibility spike → the CI double build → REPRODUCING.md (D-14; G-8, G-13).** Build twice from clean
      checkouts with the same `SOURCE_DATE_EPOCH`; compare zip SHA-256; if they differ, find the cause (entry mtimes,
      ordering, chunk hashes) and fix it in config. If byte-identical zips are not reached within the task, compare the
      sorted per-file SHA-256 of the extracted trees and word every claim exactly "file-identical" (G-8: SECURITY.md,
      REPRODUCING.md, the ledger, the CHANGELOG). A CI job builds twice and fails on a mismatch. `REPRODUCING.md` states
      Node 22 and pnpm 10.33.0, with AMO's differing default named (G-13).
      Files: `.github/workflows/ci.yml` (the job) · `wxt.config.ts` / build config only if a cause needs it ·
      `scripts/compare-builds.ts` (new) · `docs/trust/REPRODUCING.md` (new) · `docs/trust/SECURITY.md` and
      `CHANGELOG.md` (wording only, if file-identical)
      Verify: two local clean builds compared, both engines, digests pasted; firing control: a deliberate one-byte
      change in one tree makes the comparator fail (red); `ciConfig.test.ts` extended: the double-build job exists.
      If config changed, full suite and every byte figure re-stated; otherwise content-script md5 identical. Golden
      EMPTY · `permissions: []`. [D-14; G-8, G-13]
- [ ] **7.4 The release workflow, conditional attestations, the Pages workflow, AMO sources README (D-14; §9-1, §9-4;
      G-9).** `release.yml` on `push: tags: ['v*']` and `workflow_dispatch` (`dry_run`): pnpm via `packageManager`,
      Node 22, frozen install, lint + unit, both zips + the Firefox sources zip, SBOM with `SOURCE_DATE_EPOCH` = the
      tag's commit time, `SHA256SUMS`, `actions/attest-build-provenance` **only when the repository is public**
      (`if: ${{ !github.event.repository.private }}`, reported as skipped otherwise), a **draft** release; job-scoped
      `contents: write, id-token: write, attestations: write`; a dry run creates no release. Action versions pinned and
      verified against their current docs. `supply-chain.yml`'s "Attach SBOM to release" step removed (Q17).
      `pages.yml`, `workflow_dispatch` only, publishing `site/`; whether the custom domain needs a `CNAME` file or only
      the Pages setting for an Actions deploy is verified against GitHub's current Pages docs and done accordingly.
      `SOURCE_CODE_REVIEW.md` (OS, Node 22, pnpm 10.33.0, exact commands, AMO's Node 24.14.0 / npm 11.9.0 default named
      — G-13); the task extracts the sources zip, rebuilds inside it, compares to the shipped Firefox zip.
      Files: `.github/workflows/release.yml` (new) · `.github/workflows/pages.yml` (new) ·
      `.github/workflows/supply-chain.yml` · `SOURCE_CODE_REVIEW.md` (new; location per WXT's sources-zip rules,
      verified) · `site/CNAME` (new, only if the docs require it) · `tests/ciConfig.test.ts`
      Verify: `ciConfig.test.ts` extended: release triggers on `v*` tags and dispatch; the attest step carries the
      public-repo condition; `pages.yml` has no `push` trigger; no "Attach SBOM to release" step remains (red-first on
      each). `actionlint` (if available locally) EXIT 0, or each workflow parsed. The sources-zip rebuild compared with
      the shipped Firefox zip — "no differences" (or file-identical under G-8), digests pasted. **The dry run is the
      human's (G-9), after the branch is pushed** — recorded at 8.1. No production bytes. [D-14; G-9; §9-1]
      ★ *Gate-3 note, 2026-10-31 (Q6; `decisions.md`, "M13 GATE 3 APPROVED"): when 7.4 lands, the human pushes — a
      `workflow_dispatch` workflow must be on the default branch to be run — and triggers the dry run then; 8.1
      records the result, and a failure becomes a discovered task. The agent never pushes.*
- [ ] **7.5 Store listing text for Chrome, Firefox, Edge (gate-1 Q19, Q20).** Each meets that store's documented
      length rules (re-read at the task, cited); each links `https://peekover.dev/privacy/` ("live at release");
      Edge = text + assets, the Chrome zip; every sentence in the ledger.
      Files: `docs/store/{chrome,firefox,edge}.md` (new) · `docs/store/claims.md` · `tests/truthPins.test.ts`
      Verify: `truthPins.test.ts` extended: each listing's fields within the cited limits (red-first with an over-long
      summary); each links the privacy URL; no unshipped feature named; no address. No production bytes. [Q19, Q20]
- [ ] **7.6 The go-live checklist, `docs/store/GO-LIVE.md` (§9-7).** Written by M13, run by the human. Items, each with
      the evidence that shows it done: point DNS at GitHub Pages and set the custom domain; run `pages.yml`; verify every
      "live at release" URL in `claims.md` resolves; send and confirm a test message to `hello@peekover.dev`, then decide
      the two-file email edit; make the repository public; enable private vulnerability reporting; cut and push the
      real `v0.1.0` tag; confirm the release run's attestations and `gh attestation verify`; download the draft
      release's zips and check them against `SHA256SUMS`; publish the release; submit to the Chrome Web Store, AMO (with
      the sources zip) and Edge Add-ons.
      Files: `docs/store/GO-LIVE.md` (new)
      Verify: every §9-7 item present with an evidence line; every "live at release" ledger row is referenced by the
      URL-resolution item (a unit check in `truthPins.test.ts`, red-first with a row omitted). No production bytes.
      [§9-7; G-1, G-9]

## 8 — ★ The design walk — HUMAN GATE (spec §3.6; §9-6)

*Short check-in sessions; tree and background processes confirmed clean before each (WORKFLOW §7.4). Every item needs a
loaded extension and has NO agent substitute (AGENTS.md).*

- [ ] **8.1 ★ HUMAN-ONLY design walk, from fresh production builds of both engines.** Agent prep (not the walk): clean
      `pnpm build` and the Firefox build, zips, the checklist table filled with surfaces and blank verdicts. **The walk:**
      every surface (spec §3.6) × light / dark × Chromium / Firefox × 1440 / 1280 / 1080 / 414 — "matches", "differs by
      ruling" (with the ruling) or "fix"; the toolbar judged against **`design/toolbar-mock.html`**, not `mockup.html`
      (plan §7-2); the system stacks on the content script by eye on Windows (and macOS if available — D-3); the
      reader's own untouched surfaces in both themes (WORKFLOW §7.4); **onboarding on a real install** — the Chromium
      toggle off → on with the page updating on focus, and the deep-link path; **the Firefox file:// check (§9-6):** a
      fresh Firefox profile with the built extension opens a local `.md` via `file://` directly (not the app page) — if
      access must be granted, onboarding gains a Firefox branch as a **discovered task** (detection or instructions, no
      new permission — or a STOP if one would be needed); the icon in both browsers' toolbars, light and dark; **the
      release workflow's dry run** (G-9: the human pushes, runs `workflow_dispatch` with `dry_run`; the attestation step
      reported skipped; artefacts listed) and the CI run on `main` from 1.1.
      Files: `docs/ai/progress.md` (verdicts) · discovered fix tasks as found
      Verify: every cell has its own verdict — no implicit "looked fine"; engines and viewports recorded; each "fix"
      becomes a numbered discovered task run before group 9. Golden EMPTY · `permissions: []`.
      ★ *Gate-3 note, 2026-10-31 (Q4; `decisions.md`, "M13 GATE 3 APPROVED") — ADDED TO THIS VERIFY:* **every pending
      list (2.2's contrast census, 5.1's native-control sweep) is either EMPTY, or each remaining row is accepted by the
      human BY NAME in this task's record.** Nothing is carried out of M13 silently; a row neither fixed nor accepted
      blocks the tick. The dry-run result recorded here follows the 7.4 note (Q6).
      ★ *2026-11-02 (the 3.1 gate, `decisions.md` "M13 GATE — 3.1 TOOLBAR MOCK APPROVED") — A NAMED CHECK OF THIS WALK:*
      the look of **Editing (Read / Edit / Raw while editing), the Watching pill, the one-time snapshot notice, the
      Compare picker and the ≤ 1080 Files overlay** is judged again, WORKING, in both engines and both themes — the 3.1
      approval of these took the agent's mock self-check, not the human's eye. Also the compact toolbar (≤ 863 px, "⋯").
      ★ *2026-11-03 (4.5's record; the C061 ruling) — ADDED TO THIS WALK:* an agent file at 1280 px gets a two-row toolbar
      (C061 ruling) — judge it with the real thing.

## 9 — ★ Truth re-check, then screenshots, then close (spec §3.9; §9-1, §9-8)

- [ ] **9.1 The site: self-hosted fonts, `site/privacy/`, the privacy pin, the "live at release" sweep (D-12; §9-1).**
      TEST FIRST. `site/fonts/` gets 2.3's subsets + Literata; `@font-face` in the page; the Google Fonts links go.
      `site/privacy/index.html` carries `PRIVACY.md`'s text; `tests/privacyPage.test.ts` renders `PRIVACY.md` through
      the project's own parser and compares normalized text with the page's `<main>` (one source, pinned — the D-1
      pattern). The ledger's "live at release" markings re-checked across README, site, SECURITY, PRIVACY, store text.
      Files: `site/index.html` · `site/fonts/*` (new) · `site/privacy/index.html` (new) · `tests/privacyPage.test.ts`
      (new — named by §9-1) · `tests/truthPins.test.ts` · `tests/fontLicences.test.ts` (the site's font copies) ·
      `docs/store/claims.md`
      Verify: (**unit**) privacy pin red-first (one word changed in either file → red naming the first differing line);
      `truthPins.test.ts`: no `fonts.googleapis.com` / `fonts.gstatic.com` in the site (red-first on today's file).
      Both site pages opened locally in Chromium with zero network after settle (one Playwright pass, firing control).
      No production bytes. [D-12; §9-1; gate-1 Q15(c)]
      ★ *2026-11-02 (HUMAN RULING 2 after 2.5):* the site self-hosts its OWN variable Bricolage Grotesque (`opsz` and
      `wght` axes, covering weight 800 and the display sizes it uses, up to 180 px) — not the app's static 400 / 600 /
      700 `opsz` 12 subset. The site is not in the extension package; zero Google Fonts holds. Its licence and source are
      recorded like 2.3's (`assets/fonts/README.md`'s method; `fontLicences.test.ts` covers the site's copies).
- [ ] **9.2 ★ HUMAN GATE — the truth re-check.** Agent prep: the ledger walked against the walked build, every row's
      evidence re-run or re-read and marked, every row without evidence proposed for cutting. **The human** reads
      README, site, SECURITY, PRIVACY, THREAT-MODEL, CHANGELOG and the three listings against the ledger and signs off
      (or names cuts).
      Files: `docs/store/claims.md` · the files the human's cuts touch · `docs/ai/decisions.md` (the sign-off)
      Verify: every ledger row has evidence or is cut; the sign-off banked; `truthPins.test.ts` green.
- [ ] **9.3 ★ Store screenshots — scripted captures, the human picks (G-11; spec §3.9).** 1280×800, light and dark,
      through the app-page harness from the build that passed 8.1, of a sample document kept in the repo and not
      packaged.
      Files: `scripts/capture-screenshots.ts` (new) · `docs/store/assets/sample.md` (new) · `docs/store/assets/*.png`
      (the human's picks only)
      Verify: each PNG is 1280×800 (unit size check); nothing in `docs/store/` appears in `.output` (both engines); the
      human's picks recorded. No production bytes.
- [ ] **9.4 `/retro` — the milestone retrospective (WORKFLOW §7.5).** Read `docs/ai/retro.md`'s prior entries first.
      Includes: whether mock-first saved re-work; whether the census predicted group 4's re-spellings; whether the
      ledger kept the truth pass to one re-check.
      Files: `docs/ai/retro.md` (+ `AGENTS.md` / `WORKFLOW.md` only for a rule the retro places)
      Verify: banked, dated, real task numbers; every answer ends in an action or "none".
- [ ] **9.5 Records reconcile.** `progress.md`'s M13 narrative to `progress-archive.md`; every D-value (D-1…D-17)
      audited against the commit that landed its `decisions.md` entry; `spec-coverage.md` re-scored (F7, F11, §6-9,
      §6-10, §6-13); the byte ledger decomposed across every task against the 1,509,173 / 1,509,057 B starting headroom
      and the content script's per-task deltas summing to its close figure; `AGENTS.md`'s current-milestone line.
      Files: `docs/ai/progress.md` · `docs/ai/progress-archive.md` · `docs/ai/spec-coverage.md` ·
      `docs/ai/decisions.md` · `AGENTS.md`
      Verify: every D-value's landing commit named, gaps named; `.output` ≤ 7,340,032 B both engines; `permissions: []`
      throughout; golden's milestone diff EMPTY; the task count reconciled by counting this file.

---

## Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism

- **Revert-and-fail is the standard:** every regression test is seen red with the defect's own signature in its own
  units; the check that found the defect is the one seen to fail. A test mirroring an established pattern (the import
  fences, the contrast helper's two former copies) cites that pattern's ablation instead of re-earning it.
- **A positive control that FIRES**, in the same test, under the conditions the negative claim disclaims — and for a
  zero (network, leak), a SLOW case, read only after `wireSettled()` (Resource Timing records a request at its END).
- **Perf is A-B-A**, interleaved, floor beside median (2.5, 4.8, 5.6).
- **Viewports recorded like engines** — 1440 / 1280 / 1080 / 414 wherever layout is asserted.
- **Bundle-size Verify on every bundle-affecting task:** `pnpm build` AND the Firefox build (a stale `firefox-mv3`
  reads as a false zero) + `pnpm zip` + `.output`, each delta against the immediately-prior task's figure and
  decomposed. **Content script:** no ceiling; every move stated and proven by md5 under ablation; every task expected
  not to move it proves md5 identity — by md5, never by grep; **+2 KB in one task stops and reports** (G-7).
- **Harness-shared-state (AGENTS.md):** browser files share one `document`/`window`, the clipboard, Resource Timing,
  IndexedDB and the font/HTTP caches — the toolbar's observer, the notice's settings row and the fonts on
  `document.fonts` all live there; assertions are DELTA-based or SPECIFIC-CONTENT-matched.
- **`.output` ≤ 7 MiB (7,340,032 B).**
- **`permissions: []`**, no `web_accessible_resources`, no `host_permissions`; `tests/manifest.test.ts` edits are
  additive only (G-14). Manifest bytes stated per task from 2.6 (F-7). Any new permission is a STOP.
- **Golden EMPTY, every task** — no parse or sanitize shape changes this milestone.
- **The `:host` pin stays 26** (`htmlExport.test.ts`); any move is named in its task (plan §1 row 2).
- **No colour literal outside D-1's allow-list; no CSS rationale inside a template literal** (it ships).
- **Full-suite Verify whenever production code changes**; test-only / doc-only tasks use the targeted suite plus a
  spot-check.
- **Zero network by default; every HTML string through DOMPurify; constructed DOM only on the new pages; never a blank
  page** (AGENTS.md #1, #3, #5).
- **Control characters as `\uXXXX`; scripts authored with the file tool, not a heredoc** (AGENTS.md).
- **`progress.md`'s Now-pointer advances per task, in that task's commit.** Stage explicit paths. Never `--no-verify`.
  **Never push.**

**§4 EARS coverage.** *Truth:* shipped-only + "Planned" → 1.2, 1.3, 9.2 · no install link → 1.2, 1.3 · numbers → 1.2,
1.3 · SECURITY.md promises only what exists → 1.2, 7.2, 9.2. *CI:* push to `main` → 1.1 · pnpm from `packageManager` →
1.1 · Dependabot count → 1.1. *Design:* tokens one source → 2.1 · faces and zero font requests → 2.4 (2.5) · no native
control → 5.1–5.7 · math without the code toolbar → 5.3 · no chrome over text, no 130 px band → 4.5, 4.6, 5.6 · ≤ 1080
px sidebar → 4.8 · AA → 2.2, every group-5 task · reduced motion → 4.1, 6.1 · the human walk → 8.1. *Onboarding:*
install-once / not on update → 6.2 · Chromium state + focus re-check → 6.1 · reachable from the app page → 6.1 ·
`permissions: []` → 6.1, 6.2. *Release:* version → 7.1 · icons → 2.6 · tag → draft release → 7.4 · reproducibility job
→ 7.3 · privacy, CHANGELOG, listings → 7.1, 7.2, 7.5 · screenshots → 9.3. *Gate-1 §10-4:* panel disclosure after
dismissal → 4.5. Every clause has at least one task.

**Sequencing (dependency order; serial — WORKFLOW §7.2):**
1. **Group 1 first** (1.1 → 1.2 → 1.3): cheapest, stops the overclaiming now; 1.1's rebuild is the milestone baseline.
   ★ *2026-11-01 (the Linux reds ruling): 1.1 → **1.4** → 1.2 → 1.3 — the discovered 1.4 (CI green on Linux) runs
   before 1.2; its rebuild (+71 B content script, +87 B app chunk) is the new baseline.*
2. **2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6.** The census (2.2) precedes every restyle (groups 4–5); fonts (2.3–2.4) precede
   the measurement (2.5); if 2.5's gate arises, nothing after it starts until the human rules.
3. **3.1 needs 2.3's woff2 files and 2.6's mark; its written approval is banked before 4.0.** No group-4 task starts
   without it.
4. **4.0 (the census) before any toolbar code.** Then 4.1 → 4.2 → 4.3 → 4.4 → **4.5 (the pills drop, with D-8)** → 4.6
   (the band, only after the pills are gone) → 4.7 → 4.8.
5. ★ *2026-11-01 (the 2.2 ruling): **5.8 runs right after 5.3** (5.3 → 5.8 → 5.4), once 3.1's approval has fixed its
   token mapping.*
5. **Group 5 after group 4** (the sweep and census rows shrink against the final toolbar); **5.6's first paint after
   2.4's stacks and the restyle.**
   ★ *2026-11-02 (HUMAN RULING 3 after 2.5): every first-paint gate (4.8, 5.6, and any other) is judged on DIFFERENCES
   measured in the same session (A-B-A); absolute gate figures need a local run by the human, recorded as such.*
6. **Group 6 after group 5** (built once in the finished language, spec §3.10-5); 6.1 before 6.2 (the page exists
   before anything opens it).
7. **Group 7:** 7.1 before 7.4 (the version the release builds); 7.2 before 7.3 (7.3 adjusts SECURITY's wording to its
   outcome); 7.3 before 7.4 (the claim before the workflow that depends on it); 7.5 after 7.2 (the privacy link); 7.6
   last (it lists everything).
8. **8.1 after groups 1–7**, from fresh builds; every "fix" and the Firefox branch (if needed) are discovered tasks
   that run before group 9.
9. **9.1 → 9.2 → 9.3 → 9.4 → 9.5.** Screenshots last, from the walked build (spec §3.9).

**Count proposed for gate 3: NINE groups, 40 tasks** — 1 (3) · 2 (6) · 3 (1) · 4 (9) · 5 (7) · 6 (2) · 7 (6) · 8 (1) ·
9 (5). ★ *2026-11-01: **41 tasks** — 1.4 discovered (CI green on Linux), so group 1 has 4; the other groups unchanged.* ★ *2026-11-01 (the 2.2 ruling): **42 tasks** — 5.8 discovered (the Peekover code theme), so group 5 has 8.* **Human gates (★):** 3.1 the toolbar mock · 2.5 the font ruling, **only if it arises** · 8.1 the design walk
(incl. the Firefox file:// check, onboarding on a real install, the dry run) · 9.2 the truth re-check · 9.3 the
screenshot pick. **Conditional stops that route to the human without being gates:** a below-AA pair outside G-4/G-5
(2.2); a content-script task over +2 KB (G-7); a census retirement (shown at group 4's end); a Firefox grant needing a
permission (8.1).

---

## Gate-3 questions (numbered, each with a recommendation)

1. **Q1 · Where the app page drops the pills (F-6).** (a) In **4.5, with D-8**, and the band (D-7) after it in 4.6 —
   no commit loses a function or the capture disclosure; controls appear twice between 4.1 and 4.4. (b) The plan's
   order — D-7 in 4.3, the pills dropped whenever the toolbar skeleton lands — which leaves the disclosure absent and
   pills over text for some commits. **Recommendation: (a).**
2. **Q2 · Three files beyond plan §2's list.** `tests/ciConfig.test.ts` (1.1, extended 7.3–7.4) and
   `tests/truthPins.test.ts` (1.2, extended through 9.1) give the CI and truth criteria a red-first pin instead of a
   read-through; `specs/013-first-release/census.md` holds 4.0's 48-row table outside `progress.md`. (The font-licence
   and privacy-pin tests are named by §9 and are not extra.) **Recommendation: authorize all three.**
3. **Q3 · The splits (F-9).** Plan 2.3 → 2.3 + 2.4; group 4 → nine tasks (4.0–4.8, D-7 after the pills drop); plan 6.1
   → 6.1 (the page) + 6.2 (the install listener); plan 9.3 → 9.4 retro + 9.5 reconcile, with the truth re-check its own
   ★ task 9.2 — the M12 shape. 40 tasks against the plan's 35 (§6's 34 plus §9's 7.6). **Recommendation: approve the splits** — each red
   keeps one cause and each task fits a session.
4. **Q4 · Ratchet lists in two tests.** The census (2.2) and the native-control sweep (5.1) are green at commit with a
   named **pending** list of today's failures that may only shrink; a new row is a stop. The pending list is not the
   accepted list (which stays M12's five). **Recommendation: yes.**
5. **Q5 · Below-AA pairs the census finds outside G-4/G-5.** (a) 2.2 stops and brings them to you as one batched
   question before 2.3; (b) they sit on the pending list and you rule them at the walk. **Recommendation: (a)** — the
   rulings shape the restyle in groups 4–5, so they are cheapest before it.
6. **Q6 · When the release dry run happens (G-9).** (a) As soon as 7.4 lands — you push and run it, and 8.1 records the
   result (a failure becomes a discovered task before the walk ends); (b) only inside the walk. **Recommendation:
   (a).**

## Gate-3 notes (2026-10-31)

*The human's answers to Q1–Q6 are in `decisions.md`, "M13 GATE 3 APPROVED". Where a note and the body disagree, the note
governs.*

1. **Q1 YES** — the pills drop in 4.5 with D-8, the band in 4.6, as drafted. **No commit may lose a function or the
   capture disclosure** — a standing check on every group-4 task, not only 4.5.
2. **Q2 YES** — `tests/ciConfig.test.ts`, `tests/truthPins.test.ts`, `specs/013-first-release/census.md` authorized.
3. **Q3 YES** — 40 tasks, as counted above.
4. **Q4 YES, with a condition** — the pending lists may only shrink, **and by 8.1 each is EMPTY or every remaining row is
   accepted by the human by name in 8.1's record**; added to 8.1's Verify (★ note there). This supersedes 5.7's "each
   remaining row named and routed" as the end state: routing alone no longer closes a row.
5. **Q5 YES** — 2.2 stops with ONE batched question for every contrast failure outside G-4/G-5, before 2.3.
6. **Q6 YES** — the human pushes when 7.4 lands and triggers the dry run (★ note at 7.4); 8.1 records it.

*Gate: this file was a **DRAFT awaiting gate 3** and is now **APPROVED (2026-10-31)** — see the gate-3 notes above. The
paragraph below is the draft's text, kept as written.*

*Gate: this file is a **DRAFT awaiting gate 3** — review material, not a sealed list. Gate 3 approves it, redlines it,
and answers Q1–Q6. **What approval authorizes:** implementation, beginning at **task 1.1, in a fresh session**, task by
task in this order, test-first, one commit per task, the `progress.md` Now-pointer advancing in that same commit — and
nothing before it. **No plan D-value is re-opened, no spec §3.x decision is re-decided, and no §6 IS-NOT item is
proposed here.** The places this file declines to decide are named: 2.5's numbers (and the human's ruling if they
argue), the mock's content (3.1), the ≤ 1080 px value (measured at 4.8), the deep-link mechanism (verified at 6.1),
byte-identical vs file-identical (7.3), the CNAME question (7.4), and every walk verdict (8.1).*
