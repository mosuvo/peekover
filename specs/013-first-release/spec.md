# Spec 013 — A truthful, on-design first release

**Status:** **approved at gate 1 (2026-10-30)** — with the human's answers banked in `decisions.md` ("M13 GATE 1
APPROVED") and the changes to this draft recorded as dated notes in §10; the body below is the draft as approved,
not rewritten. Next: `plan.md` (gate 2).
**Scope:** **013 delivers M13 — make what already ships honest, on-design and releasable; no new reader
features.** Five strands, in the human's own scope statement of 2026-10-30: (1) TRUTH — the site, the README
and `SECURITY.md` say only what ships; (2) CI — the gate runs on `main` too, pnpm is pinned, a stale comment is
corrected; (3) DESIGN CONFORMANCE — every shipped surface matches `design/` in both themes, including the five
carried reader-polish items; (4) ONBOARDING — a minimal F11 first-run page that detects file-URL access with no
new permission; (5) RELEASE HYGIENE — a version, a changelog, raster icons, a privacy policy, store listing
text, a tagged-release workflow with both zips, the SBOM and checksums, and — last — store screenshots.
**Going live is OUT** (publishing the site, submitting to any store): the human does those after a personal
check once M13 closes.
**Date:** 2026-10-30
**Milestone:** M13 · builds on 012 (Editor Mode's focused core — CLOSED 2026-10-30, HEAD `14f20d7`) and on the
POST-M12 CONSOLIDATED LIST in `docs/ai/progress.md` § Carried items (item 1, reader polish; item 5, supply chain).
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT) and 012's section shape — §3 key scope calls,
§4 EARS acceptance criteria, §5 non-functional, §6 the IS-NOT fence, §7 plan-stage risks, §8 measure-then-
choose, §9 the gate-1 questions. Two appendices carry this draft's evidence: **A — the design inventory and the
gap analysis** (the token mapping table, the per-surface gaps with sizes, the conflicts with standing rulings);
**B — release items and current store requirements**, each cited.
**Evidence base:** `design/` read in full (tokens.css, brand.html, icons.html, mockup.html — 1,360 lines);
`src/theme/readerCss.ts` (tokens at :43–65, the `READER_CSS` / `CONTAINED_CSS` / `EDITOR_CSS` /
`EDIT_CONTROL_CSS` sheets at :41 / :1314 / :1460 / :1561), `src/theme/fonts.ts`, `src/app/appShell.ts:370–470`
(the shell's own token copy and `APP_CSS`), `wxt.config.ts`, the built `.output/chrome-mv3/manifest.json`; the
README, `site/index.html`, `docs/trust/SECURITY.md` and `PERMISSIONS.md`, the three workflows and
`dependabot.yml`; `docs/product/spec.md` §F7, §F11, §6, §7, §8; `docs/ai/spec-coverage.md`'s F7, F9–F12, §6, §7
rows; `decisions.md`'s font (2026-07-14), brand (2026-07-10), R11/R12, task 3.5 / R28–R29 and M12-close entries;
five real-engine screenshots of the current app page left by the M12 browser suite in `.vitest-attachments/`
(git-ignored scratch, not committed — no new screenshot run was needed). Store requirements were read from the
stores' own documentation on 2026-10-30 (Appendix B, cited per row). **Preflight:** tree clean, HEAD `14f20d7` =
`origin/main` (0 ahead / 0 behind), `pnpm audit --prod` **EXIT 0 on 2026-10-30** (1 low, ignored —
GHSA-238p-pmpm-9mq7). **Byte snapshot carried from the M12 close:** `.output` 5,830,859 B (Cr) / 5,830,975 B
(Fx) against ≤ 7 MiB (7,340,032 B) — headroom 1,509,173 / 1,509,057 B; content script 344,195 B both engines;
manifest `permissions: []`. **Every `file:line` here must be re-derived by `plan.md` at its own HEAD** (the
standing rule since 006).

---

## 1. Problem & value

Peekover is close to its first release, and three things stand between the tree and a release a careful person
would put their name to.

**It says more than it does.** `site/index.html` sells on-device AI, BYOK providers, 30+ themes, publishing to
Gist/Medium/Dev.to, presentation mode, a command palette, 27 languages and "reproducible builds", and carries
three "Add to Chrome — Free" buttons that link to `#`. `spec-coverage.md` scores F10 (AI) at 3%, F7 (theming) at
6%, F11 (onboarding) at 11%, and §6-10 (reproducible builds) and §6-13 (threat model) at ✗. `SECURITY.md`
promises reproducible builds "verified in CI as they land". The brand's first behaviour is *"Trust is shown, not
claimed"* (`design/brand.html`); the Chrome Web Store's policy rejects listings that are *"misleading,
inaccurate, incomplete"* (Appendix B). A trust product that overclaims fails on its own terms first.

**It does not look like itself.** The design system names three faces — Literata for reading, Bricolage
Grotesque for UI, Sometype Mono for code — and only Literata is bundled (`fonts.ts:22–25`); every button, label
and code block renders in the OS fallback, and the app shell sets `--sans` to `system-ui` outright
(`appShell.ts:450`). The mockup's 52 px toolbar with the mark, the Read/Edit/Raw switch and the quiet status
line became, in the shipped app page, a panel-coloured header of text pills plus a second stack of floating
pills inside the reader (the snapshot notice over text, the 130 px band under the editor, native unstyled
buttons in dark — the carried reader-polish list). The built manifest has **no `icons` key at all**: the
toolbar shows the browser's default puzzle piece, while four SVG renditions sit unused in `assets/icons/`.

**It cannot be released.** `package.json` and the manifest say `0.0.0`; there is no CHANGELOG, no privacy
policy, no store text, no release workflow; `git tag -l` is empty, and the SBOM job's release-attach step
cannot be reached from a tag push (no `tags:` trigger — `spec-coverage.md` §6-9). CI's per-change gate runs on
pull requests only, so a direct push to `main` is never verified.

**Who it serves:** every persona, at the moment that matters most for a free trust product — the first
install. The milestone's value is not new capability; it is that the first impression, the store listing and
the source tree all tell the same true story.

## 2. User stories

- As a prospective user reading the site or README, I want every feature described there to be one I can use
  today, with anything planned clearly labelled as planned, so I can trust the rest of what it says.
- As a user installing Peekover, I want a first-run page that tells me whether local files will open and
  exactly how to switch that on, so the category's #1 friction does not end my first session.
- As a reader, I want every Peekover surface — the file:// reader, the app page, the editor, the panels and
  dialogs — to look like one designed product in light and in dark, so the chrome stays quiet and the
  document stays the hero.
- As a security-minded user, I want each release to come with checksums, an SBOM and a documented way to
  rebuild it, and I want `SECURITY.md` to promise only what is delivered.
- As the maintainer, I want CI to verify every push to `main`, and a tag to produce both store zips, the
  SBOM and checksums without hand-assembly, so releasing is a check rather than a ritual.
- As a store reviewer, I want listing text, screenshots, a privacy policy and (for AMO) buildable sources
  that match the package exactly.

## 3. Key scope decisions (proposed at this gate — redline as needed)

**3.1 M13 IS A CONFORMANCE AND RELEASE MILESTONE: NO NEW READER FEATURES. DECIDED by the human's scope
statement.** Every design change restyles, re-lays-out or relocates something that already ships. The mockup is
an *aspirational* prototype of the whole Phase-1 product (command palette, AI panel, presentation mode, tour,
backlinks, nine-font settings, frontmatter chips, find-in-folder, the editor's lint/table/snapshot bar);
**conformance means shipped features adopt the mockup's visual language and component shapes — it never means
building, stubbing or showing an affordance for an unshipped feature** (a disabled "AI" button would be a TRUTH
violation in the chrome itself). The single onboarding page (§3.5) is the one new surface, and it is named by
the human's scope.

**3.2 TRUTH IS A PASS OVER THREE FILES PLUS A RULE FOR THE FUTURE.** README.md and `site/index.html` describe
only shipped behaviour; anything else is either removed or moved into one clearly labelled "Planned" section
with no install-shaped call to action next to it. **No install link anywhere until a store listing exists** —
the three "Add to Chrome" buttons become a plain, non-link line ("Not in stores yet — build from source") and a
link to the repo. Numeric claims (30+ themes, 27 languages, 14+ code themes, 190+ languages, "< 150 ms") are
each either verified against the tree or removed. **A final truth re-check runs at milestone close** (§3.9),
because the design and release work changes what is true.

**3.3 SECURITY.md'S TWO PROMISES — PROPOSED: DELIVER BOTH, MINIMALLY; WITHDRAW WHAT IS NOT DELIVERED.**
- *Reproducible builds:* deliver the minimal honest form — the tagged-release workflow builds both zips from the
  tag with pinned pnpm and Node and `SOURCE_DATE_EPOCH`; a CI job builds **twice** in clean checkouts and fails
  if the two zips' SHA-256 differ; a `docs/trust/REPRODUCING.md` gives the exact commands to rebuild and compare
  against the published checksums. **This is also a store requirement, not only a promise:** AMO rebuilds
  submitted bundled code from source and requires *"no differences"* (Appendix B). Claiming "byte-comparable to
  the store artifact" is only made once a store-downloaded package has been compared by a human — until then
  the claim is "byte-comparable to the release zips".
- *Threat model:* deliver `docs/trust/THREAT-MODEL.md`, one page — what is protected (local files, settings,
  snapshots), from whom (a hostile markdown document, a hostile host page on the raw hosts, a compromised
  dependency, a hijacked publisher account), what is out of scope (a compromised browser or OS), and where each
  defence is proven (the sanitizer suites, the zero-network suites, `permissions: []`, the remote-code scan).
  Most of its content already exists in `PERMISSIONS.md` and the test suites; this collects it.
- *Withdrawn unless delivered:* signed tags (needs the human's key — human-only), GitHub artifact attestations
  (proposed IN as a cheap workflow step; withdrawn if gate 1 declines), "community audit invitation" and
  third-party scanner reports (launch-time items — out of scope with going live).
- The `hello@peekover.dev` disclosure channel stays only if the human confirms it is live (§9-Q15).

**3.4 CI: THREE SMALL, EXACT CHANGES.** `ci.yml` gains `push: branches: [main]`; `package.json` gains a
`packageManager` field pinning the exact pnpm version the lockfile was written with, and all three workflows'
`pnpm/action-setup` read it instead of `version: 10` (closing the carried risk that a future 10.x moves where
`auditConfig` is read and silently drops the GHSA ignore); `dependabot.yml`'s "FOUR runtime dependencies"
comment states the real count (11 today) or, better, stops stating a count that drifts. `supply-chain.yml`'s
`on.push` gains `tags: ['v*']` only if gate 1 does not route release-time SBOM through the new release
workflow instead (§9-Q12).

**3.5 ONBOARDING: ONE FIRST-RUN PAGE, NO NEW PERMISSION.** A bundled extension page (the app page's sibling, not
a popup), opened once by a `runtime.onInstalled` listener on **install only** (never on update), and reachable
again from the app page. It detects whether "Allow access to file URLs" is on — on Chromium via
`chrome.extension.isAllowedFileSchemeAccess()`, which Chrome documents with no permission entry (Appendix B;
re-verified at plan time per AGENTS.md) — shows the state plainly, and shows how to turn it on (the mockup's
three-step setup card, `mockup.html:844–859`). It re-checks when the page regains focus, so flipping the toggle
updates the page without a reload. On Firefox the page states Firefox's own behaviour, which `plan.md` verifies
against current Firefox documentation before any copy is written. It also states, in the brand's voice, that
remote raw-host files work with no setup at all (F11 item 2, already true). **Out:** the extension-conflict
detector, the demo document, the tour, the command palette — the rest of F11.

**3.6 DESIGN CONFORMANCE — WHAT "MATCHES" MEANS, AND HOW IT IS JUDGED.**
- **Surfaces in scope (all shipped surfaces):** the content-script reader on `file://` and on the four raw
  hosts; the app page — header/toolbar, folder pane (picker, granted state, pins, search, tree, recents, empty
  and denied states), reader pane, TOC rail, the reader's chrome (watch, theme, Raw/Reading, Edit, Compare,
  diff view and snapshot picker, snapshot notice, agent badge, remote-media badges and load button, network
  indicator, render-failure banner), code blocks, table tools, math actions, diagram lightbox; the editor (bar,
  Save, status, source, preview, search panel); the panels and dialogs (Stored data, Export, Code theme, the
  unsaved-changes guard); the new onboarding page; the toolbar icon. **There is no popup and no options page**
  today, and none is added (§9-Q10).
- **Themes:** light and dark. Sepia stays dormant (decisions.md 2026-07-17, 004 D-1) unless gate 1 reopens it
  (§9-Q6).
- **Engines:** Chromium and Firefox, every surface.
- **Viewports:** 1440×900 (wide), 1280×800 (the store screenshot size), 1080×800 (the mockup's own collapse
  breakpoint, `mockup.html:72`), 414×896 (narrow). The walk records each, per the standing close-gate rule.
- **Judged by test** (red-first, revert-and-fail): every surface's computed design tokens equal
  `design/tokens.css`'s values, parsed from that file rather than copied into the test; the three faces are
  loaded and applied (serif on prose, sans on chrome, mono on code) with **zero font requests on the wire**;
  every text/background pair on every shipped surface clears 4.5:1 (3:1 for large text and non-text UI), except
  items on an explicit accepted list (§5); no native-styled control remains (no `buttonface` / UA border on any
  `button` in either theme); no chrome rect overlaps a text line box at any of the four viewports.
- **Judged by a human walk** (no agent substitute, marked human-only up front): layout, proportion, rhythm and
  component shape against the mockup, per surface, per theme, per engine, at the four viewports, from a fresh
  production build loaded as a real extension. The walk's checklist is Appendix A.2's surface table.

**3.7 FONTS ARE BUNDLED, NEVER FETCHED — AND THEIR BYTES ARE MEASURED BEFORE ANY CHOICE.** Bricolage Grotesque
and Sometype Mono (both SIL OFL per the design's Google Fonts sources — the licence re-verified at plan time,
`OFL.txt` updated) ship inside the package, subset to Latin and to the weights the design actually uses
(Bricolage 400/600/700; Sometype 400/500). Where they live — inline in the content script, as packaged assets
on extension pages only, or both — is a byte decision (§8-1), not this draft's.

**3.8 RELEASE HYGIENE, AS ARTEFACTS IN THE REPO; NOTHING IS PUBLISHED.** Version 0.1.0 in `package.json` (the
manifest follows); `CHANGELOG.md` (Keep-a-Changelog shape, one 0.1.0 entry that lists what ships, derived from
the M1–M12 close records); PNG icons at 16/32/48/128 rendered from `design/icons.html`'s size-specific SVGs
(icons.html's own export rule: *"ship PNGs rendered from these exact SVGs at 1× and 2×"*) and wired into the
manifest's `icons` and `action.default_icon`; a privacy policy (`docs/trust/PRIVACY.md`, with the same text
ready for the site); store listing text for Chrome, Firefox and Edge (`docs/store/`); a tag-triggered release
workflow that builds both zips, the AMO sources zip, the SBOM and `SHA256SUMS`, and attaches them to a
**draft** GitHub release (a draft publishes nothing). Cutting the tag and running the workflow for real is the
human's — the agent never pushes.

**3.9 STORE SCREENSHOTS LAST.** Produced only after the design walk passes and the truth re-check is done, at
1280×800 (accepted by both Chrome and Edge, Appendix B), light and dark, from a sample document kept in the repo
but not shipped in the package.

**3.10 PROPOSED INTERNAL ORDER — the reviewer's, with one change and one addition.**
1. **CI + truth** — agreed: cheapest, and it stops the overclaiming now.
2. **Design foundation: tokens AND fonts together** — the font byte measurement (§8-1) is the milestone's one
   real fork; it must come first because its answer decides how far the content-script reader can follow the
   design, and every later surface reads these tokens and faces.
3. **Layout and surfaces** — app page first (the largest gap), then the content-script reader, then editor,
   panels and dialogs.
4. **Icons** — *moved up from release hygiene*: the toolbar icon and the header mark are design surfaces the walk
   must see, and they cost nothing in the content script.
5. **Onboarding** — after the surfaces, so it is built once in the finished language.
6. **Release hygiene** (version, CHANGELOG, privacy policy, listing text, release workflow, reproducibility job).
7. **The human design walk** — the gate for everything above.
8. **Truth re-check, then store screenshots** — *added*: the site and README are re-checked against the
   finished build, because steps 2–6 change what is true (the faces, the icon, onboarding).

## 4. Acceptance criteria (EARS)

**Truth**
- The README and `site/index.html` shall describe as available only features present in the build; each other
  feature shall be removed or listed under a section labelled as planned.
- The README and site shall contain no link or button that presents itself as an install path while no store
  listing exists.
- Each numeric claim in the README and site shall be either verifiable against the tree (with the evidence named
  in the task record) or removed.
- `SECURITY.md` shall promise only mechanisms that exist in the repository at milestone close, and shall link to
  each.

**CI**
- When a commit is pushed to `main`, the CI workflow shall run the same jobs it runs on a pull request.
- The pnpm version used by every workflow shall come from `package.json`'s `packageManager` field.
- `dependabot.yml` shall make no statement about the dependency count that disagrees with `package.json`.

**Design conformance**
- Every in-scope surface (§3.6), in light and dark, on both engines, shall compute each design token to the value
  in `design/tokens.css` (one source; any copy in code is test-pinned to it).
- Prose shall render in Literata, UI chrome in Bricolage Grotesque and code in Sometype Mono wherever §8-1's
  ruling places those faces, and no surface shall make a network request to obtain a font.
- No shipped surface shall render a native-styled button, select or scrollbar in either theme.
- Display math shall not carry the code-block toolbar.
- At each of the four viewports, no reader chrome (including the snapshot notice) shall overlap a line of
  document text, and the editor shall not leave the 130 px band under it that R29 Decision 2 carried.
- At ≤ 1080 px (or the breakpoint gate 1 rules), the left file sidebar shall not take reading width from the
  document by default and shall remain reachable by one control.
- Every text/background pair on every shipped surface shall meet WCAG 2.1 AA contrast, except the items on the
  accepted list recorded in §5.
- When the user prefers reduced motion, no new motion introduced by this milestone (the mark's blink, panel
  entrances, the watch pulse) shall animate.
- The human design walk shall record, per surface × theme × engine × viewport, "matches", "differs by ruling"
  (with the ruling) or "fix".

**Onboarding**
- When Peekover is first installed, the system shall open the onboarding page once; when it is updated, it shall
  not.
- While file-URL access is off on Chromium, the onboarding page shall say so and show how to turn it on; when it
  is turned on and the page regains focus, the page shall show the new state without a reload.
- The onboarding page shall be reachable from the app page at any time.
- The built manifests shall remain `permissions: []` with no `web_accessible_resources`.

**Release hygiene**
- The built manifests and `package.json` shall carry version 0.1.0 (or the version gate 1 rules).
- The built manifests shall declare PNG icons at 16, 32, 48 and 128 px rendered from the design's SVGs, and the
  128 px icon shall meet the Chrome Web Store's artwork rule (96×96 artwork, 16 px transparent padding).
- When a `v*` tag is pushed, the release workflow shall produce the Chrome zip, the Firefox zip, the Firefox
  sources zip, the SBOM and `SHA256SUMS`, and attach them to a draft release.
- When the reproducibility job builds the same commit twice in clean environments, the two outputs' SHA-256 shall
  be identical; if they differ, the job shall fail.
- The repository shall contain a privacy policy, a CHANGELOG with a 0.1.0 entry, and listing text for each of the
  three stores that meets that store's documented length rules.
- Store screenshots shall be 1280×800, in light and dark, captured from the build that passed the design walk.

## 5. Non-functional requirements and trust invariants (restated)

- **Permissions:** `permissions: []` and no `web_accessible_resources` on both built manifests, re-proven by
  `tests/manifest.test.ts` at every task. The `icons` and `action.default_icon` keys are manifest keys, not
  permissions; `PERMISSIONS.md` records them anyway (AGENTS.md #4 is about trust, not only the `permissions`
  array), and records the `runtime.onInstalled` listener and the onboarding page the same way the app page was
  recorded at M2.
- **Zero network:** fonts are bundled and never fetched — not from a CDN, not from Google Fonts (which all three
  design files load), and on the content script not even from the package URL (that would need
  `web_accessible_resources`). Proven at the request level on both engines with a firing positive control and a
  slow case, read after `wireSettled()` (AGENTS.md; the M12 retro rule). The onboarding page's detection is a
  local API call, proven to make no request the same way.
- **Bytes:** `.output` ≤ 7 MiB (7,340,032 B); headroom 1,509,173 B (Cr) / 1,509,057 B (Fx) at the M12 close.
  PNG icons and two subset font families are small against that. **The content script (344,195 B) has no numeric
  ceiling today — only a per-task fence** (byte-length identical across engines, per-engine md5 stable when a task
  should move nothing). Fonts inlined into it would be the largest content-script growth since M1; gate 1 sets a
  number (§9-Q3). Every task kickoff states the snapshot (bytes used / ceiling / headroom), per AGENTS.md.
- **First paint:** < 165 ms (product spec §8) unchanged, re-measured A-B-A after any change to the content-script
  reader's chrome or font registration — new faces must not block first paint (`font-display: swap`, the existing
  `fonts.ts` pattern).
- **Contrast floors:** AA (4.5:1 text, 3:1 large text and non-text UI). The accepted below-AA list carried from the
  M12 walk stands unchanged (E-4, E-5, R12, E-9, `invalid` at 4.35:1 — `progress.md` § Carried items, item 7) and
  is not re-litigated; any NEW below-AA pair goes to the human, not onto the list by the agent.
- **CSS discipline:** rationale in doc comments, never in a CSS template literal (it ships as bytes); no hardcoded
  colours outside the documented text-on-highlighter literals; logo internals use the fixed ink #16171F.
- **Sanitization (AGENTS.md #3):** unchanged; the onboarding page builds its DOM from constructed nodes, no
  `innerHTML` with any non-constant input.
- **Reduced motion:** the global `prefers-reduced-motion` rule covers every animation this milestone adds, on every
  surface including the onboarding page and the app shell's document-level sheet (which is outside the reader's
  shadow root and needs its own rule).
- **Never a blank page:** a font that fails to load, or an onboarding detection call that throws, degrades to the
  fallback stack / an "unknown — here is how to check" state, never a blank or broken page.

## 6. Out of scope (explicit)

- **Going live:** publishing the site to peekover.dev, submitting to the Chrome Web Store, AMO or Edge Add-ons,
  making the repository public if it is not, cutting and pushing the release tag. The human does these after M13.
- **Any unshipped mockup feature** (§3.1): command palette, AI panel and consent, presentation mode, tour and hint
  pills, find-in-folder and replace, backlinks and wiki-links, the nine-font / type-size / line-height / width
  settings, frontmatter chips, TL;DR, the drop zone, the reading-progress bar, keyboard cheat-sheet, read-aloud,
  link checking, the editor's formatting/lint/table/snapshot bar. The mockup's status bar beyond the network
  state is the subject of §9-Q9, not assumed.
- **Sepia** (dormant per 004 D-1) unless §9-Q6 reopens it; **new code themes** or a syntax-colour token set (R11
  stands for the editor; the reader keeps its Shiki code-theme setting).
- **The rest of F11** — conflict detection, demo document as a shipped asset, the customizable shortcut map.
- **Localization** (F12) — the onboarding page and listing text are English only.
- **Publisher-account security documentation** (§6-11), community audit invitation (§6-15) — launch-time.
- **The non-polish carried items** — the editor's 1 MB limits (R26/R27), `readerPane.select`'s ordering guard,
  "Wipe all data" not closing a folder, the harness helper split, the clipboard flake, the katex ignore's
  revisit, `@mdit/plugin-tex`'s peer range, the import-shape byte saving. They keep their recorded homes.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **★ The geometry-pinned browser tests.** Many suites assert the reader chrome's current positions (the
   editorWalkPolish 162 px tolerance, the eyeball proxies, the pill-stack collisions, the storage/export panel
   anchors). Moving that chrome into a toolbar will turn them red by design. `plan.md` enumerates every such
   assertion before the first layout change and states, per assertion, the property it protects and how it is
   re-spelled — the R29(c) authorization precedent — so a red is a planned re-spelling, never a surprise.
2. **The `:host` rule pin.** `htmlExport.test.ts` pins `READER_CSS` at exactly 26 `:host`-scoped rule sites; any new
   theme or chrome rule there moves it, and each export translates those rules. Plan states each deliberate move.
3. **Three copies of the tokens** (`design/tokens.css`, `readerCss.ts:43–65`, `appShell.ts:370–377`) plus
   `exportControls.ts` / `storageControls.ts` / `treeView.ts` / `recentsView.ts` / `readerPane.ts` /
   `unsavedGuard.ts` each with its own small sheet. Plan chooses between generating the copies from `tokens.css`
   at build time and pinning each to it by test (AGENTS.md: a second copy of a resolved value is drift risk).
4. **Font registration on extension pages vs the content script.** `fonts.ts` registers via `document.fonts`
   because `@font-face` in a shadow tree is unreliable on Chromium; the app page is a document-level surface and
   may use a plain `@font-face` to a packaged asset (the STIX math pattern, `mathFont.ts`). Plan verifies both on
   both engines, and measures whether registering three families delays first paint.
5. **Subsetting the UI fonts** by their required glyph set (AGENTS.md's font rule — not by scanning rendered
   text): Latin, the UI's punctuation (·, —, ✓, ←, →, the arrows the chrome already uses) and Sometype's
   box/indent glyphs if code uses them.
6. **`isAllowedFileSchemeAccess` on current Chromium and MV3**, and Firefox's file-URL behaviour for content
   scripts — both verified against current documentation before onboarding copy is written; and whether an
   extension page can open `chrome://extensions/?id=…` for the user (deep-link) or must instruct.
7. **Release reproducibility in practice:** WXT's zip ordering and timestamps, Vite's chunk hashing, and
   `SOURCE_DATE_EPOCH` — plan proves two clean builds match before the workflow claims it, and states AMO's
   default rebuild environment (Ubuntu, Node 24, npm) against ours (pnpm, Node 22) in the sources README.
8. **Rendering the PNG icons reproducibly** — which local, open-source rasterizer, at which settings, with the
   output committed and a test that the manifest's icon files exist at the declared sizes.
9. **The sibling-checklist audit** for the onboarding page — the app page's own property set (CSP, theme cascade
   before JS, reduced motion, zero network, never-blank) applied to a second bundled page.

## 8. Product decisions routed to a later gate (measure first, then choose)

*The D-8 pattern: the axes are settled here; values are chosen by the human from measurements a task produced and
is forbidden from choosing from.*

1. **★ WHERE THE UI FONTS LIVE.** **Axes:** (a) inlined into the content script and the app page (the Literata
   pattern — the content-script reader fully on-design, the largest content-script growth); (b) packaged assets on
   extension pages only, the content-script reader on system fallbacks for chrome and code (zero content-script
   growth, two looks); (c) a smallest-useful inline subset in the content script (e.g. Bricolage 600 for its pills,
   Sometype 400 for code) plus full sets on extension pages. **What the plan measures:** the subset woff2 sizes, the
   content-script delta per arm (inline base64 adds ~33%), `.output` and zip deltas, and first paint A-B-A per arm
   on both engines. An unmeasured estimate for orientation only: +60–150 KB on the content script for arm (a).
2. **The app-page toolbar's final composition**, once §9-Q8 is ruled — which existing controls live in the
   toolbar, which move into a settings-style panel (the mockup's "Aa" panel holds theme), and what the narrow
   toolbar keeps. **What the plan produces:** a static mock of the composed toolbar at the four viewports in both
   themes, for the human to choose from before code.

## 9. Decisions gate 1 must make

*Each with options and a recommendation; nothing here is assumed decided.*

1. **Q1 · Slug and version.** `013-first-release`, version **0.1.0** (the mockup's status bar already says
   "Peekover 0.1"). Alternatives: 1.0.0 (the product spec reserves v1.0 for "everything in Section 5"), 0.0.1.
   **Recommendation: 0.1.0.**
2. **Q2 · Canonical token values where the design files disagree.** `tokens.css` says its source of truth is
   `brand.html`, yet differs from it on `--accent-soft` (#ECECE3 vs #EDEDE4), `--del` (#B8512F vs #C43D3D) and
   night paper (#12141C vs #14161F); the mockup adds a dark `--shadow` (rgba(0,0,0,.5)) that `tokens.css` lacks, a
   full 13-token sepia set against `tokens.css`'s 4, and no light `--warn`. Options: (a) `tokens.css` wins
   everywhere, its header is corrected to say so, brand.html is annotated; (b) brand.html wins and the shipped
   values move. **Recommendation: (a)**, plus adopt the mockup's dark `--shadow` into `tokens.css` (the light
   shadow is invisible on dark paper) — the one value change, made deliberately.
3. **Q3 · A content-script byte ceiling.** Today there is a fence but no number. Options: (a) set a ceiling now
   (e.g. 450,000 B, about +106 KB) so §8-1 measures against a stated bound; (b) rule §8-1 on its numbers with no
   standing ceiling. **Recommendation: (a)** — a number makes the font fork decidable and protects the < 165 ms
   gate; the value itself is the human's.
4. **Q4 · One source for the tokens in code.** Options: (a) generate the code copies from `tokens.css` at build;
   (b) keep the copies, pin each to `tokens.css` by a test that parses the file. **Recommendation: (b)** — no build
   plugin, the drift becomes a red test; (a) can follow later.
5. **Q5 · The R11 two-tone editor palette vs the mockup's coloured code tokens** (keyword in accent, strings in
   `--ok`, which measures 3.08–4.35:1 on light code-bg). **Recommendation: R11 stands**; the mockup's code colours
   are not adopted; the reader keeps its Shiki code-theme setting. Recorded as "differs by ruling" in the walk.
6. **Q6 · Sepia.** The mockup and settings type carry it; 004 D-1 deferred it. **Recommendation: stays dormant**
   — activating it is a new reader feature with its own contrast work.
7. **Q7 · The reading measure.** The mockup uses 76ch; the reader uses 748 px by an earlier ruling (`readerCss.ts`
   :95, "Why px not ch: B1 block"). **Recommendation: 748 px stands** ("differs by ruling").
8. **Q8 · ★ Consolidate the app page's chrome into the mockup's toolbar.** Today: a header of pills (Theme, Code
   theme, Stored data, Export) plus floating reader pills (Watch, Theme again, Raw/Reading, Edit / Stop editing,
   Compare) and a floating snapshot notice. The mockup: one 52 px translucent toolbar with the mark, the file name
   in the highlighter, a green "watching" pill, a Read/Edit/Raw segmented switch and a settings button. Options:
   (a) consolidate into the toolbar (one theme control, not two; the pill stack, the 130 px band and the notice's
   narrow case all dissolve with it); (b) restyle the pills where they stand. **Recommendation: (a)** — it is what
   the mockup draws, it removes three carried items at their cause, and its geometry-test cost is planned (§7-1).
   §8-2 then decides the exact composition from a static mock.
9. **Q9 · The status bar.** The brand sheet makes "the status bar reads 'no network calls'" a brand behaviour; today
   the network indicator appears only while a request is live. Options: (a) a quiet status line on the app page
   showing the existing network state (no new behaviour, a new presentation); (b) out of scope as a new feature.
   **Recommendation: (a), app page only**, showing only true facts (file name, network state, version) — not the
   mockup's "GFM + math + mermaid" or "UTF-8" unless they are verifiably true for the open file.
10. **Q10 · The content-script reader's chrome.** The mockup draws one reader; the `file://` / raw-host reader has
    no folder pane and every byte of its chrome counts against the content script. Options: (a) the same toolbar
    as the app page, minus folder controls; (b) the pills, restyled to the design. **Recommendation: decide with
    §8-1's numbers**; lean (a) if it fits the ceiling Q3 sets, else (b). No popup or options page is added either
    way (the action opens the app page, `PERMISSIONS.md`).
11. **Q11 · The TOC.** The mockup has a 56 px tick rail with a hover card and a pin; the shipped TOC is a collapsible,
    resizable, persisted rail with its own rulings and keyboard pattern. **Recommendation: keep the shipped
    behaviour, adopt the mockup's visuals** (the tick rail when collapsed, the highlighter "here" mark, the card
    styling) — a behaviour change is a feature change.
12. **Q12 · The narrow-screen left sidebar** (carried, R29). The mockup hides both side panels at ≤ 1080 px and
    offers a "☰ Files" pill. **Recommendation: adopt it** — at ≤ 1080 px the folder pane becomes an overlay opened
    from the toolbar; 1080 is re-measured on the shipped layout before it is fixed.
13. **Q13 · The snapshot notice** (carried, option C). **Recommendation:** a one-time, dismissible notice in the
    toolbar's area (never over text), its dismissal stored in the existing settings row — no new store, no new
    permission. If Q8 is (b), the in-flow placement instead.
14. **Q14 · Code and math toolbars** (carried). **Recommendation:** code blocks keep Line numbers / Wrap / Copy,
    restyled to the mockup's copy button (`mockup.html:154`); display math loses the code toolbar and keeps only its
    Copy LaTeX / Copy MathML actions, styled the same; table filter-clear and sort buttons styled from tokens.
15. **Q15 · Truth details the human must confirm.** (a) Is `hello@peekover.dev` receiving mail? If not,
    `SECURITY.md` points to GitHub's private vulnerability reporting instead. (b) Is the repository public, or
    will it be by release? The privacy policy, `REPRODUCING.md` and AMO's sources all assume a readable repo.
    (c) The site loads its fonts from Google Fonts; the extension's brand is "no network calls". Options: self-host
    the site's fonts (recommended — the site is the product's taste demo, product spec §7) or leave it.
16. **Q16 · SECURITY.md (§3.3).** **Recommendation:** deliver the minimal reproducible build and the one-page
    threat model; include GitHub artifact attestations in the release workflow; withdraw signed tags and "community
    audit" wording until the human does them.
17. **Q17 · The release workflow's SBOM.** Options: (a) the new release workflow generates and attaches the SBOM
    itself and `supply-chain.yml`'s attach step is removed; (b) add `tags: ['v*']` to `supply-chain.yml`. 
    **Recommendation: (a)** — one workflow owns a release's artefacts; the supply-chain workflow keeps its scheduled
    and per-change runs.
18. **Q18 · Onboarding auto-open.** Options: (a) open once on install (F11's own wording); (b) never auto-open,
    link from the app page only. **Recommendation: (a)**, install only, never on update.
19. **Q19 · The privacy policy's home before the site is live.** **Recommendation:** `docs/trust/PRIVACY.md` in the
    repo (its GitHub URL serves the store forms) and the same text as a site section, unpublished until going live.
    It is written even though Chrome makes a policy conditional on handling user data — Peekover reads local files
    the user opens, and AMO's rule could not be confirmed from its policy page this session (Appendix B).
20. **Q20 · Edge.** Chrome's zip is the Edge package. **Recommendation:** in scope as listing text and assets only
    (Edge requires a 250–10,000-character description and a 1:1 logo of at least 128 px, recommended 300 px).

## 10. Gate-1 notes (2026-10-30)

*The human's answers to §9 are in `decisions.md`, "M13 GATE 1 APPROVED". Answers that took the recommendation
as written (Q1, Q2 with the dark shadow, Q4, Q5, Q6, Q7, Q11, Q12, Q14, Q16, Q17, Q18, Q20) change nothing below.
These notes record where an answer changes or narrows the draft; where a note and the body disagree, the note
governs.*

1. **Q3 + Q10 — no content-script ceiling now; a default for §8-1.** §5 "Bytes" ("gate 1 sets a number") and §8-1's
   open axes are superseded by this default: the **app page** loads all design fonts from the extension package
   (no `web_accessible_resources`, no network); the **file:// content-script reader** keeps Literata and uses
   close-matching **system fallback stacks** for UI and code, adding **no font bytes** (§8-1 arm (b), and §9-Q10's
   restyled-pills arm unless the numbers argue otherwise). The §4 font criterion is read accordingly: on the
   content script, "UI chrome in Bricolage / code in Sometype" becomes "UI chrome and code in their system
   fallback stacks". §8-1 still measures; it may argue for another arm only by bringing bytes and first paint
   (against 165 ms with its ~15 ms headroom) to the human, who sets a ceiling then, if at all.
2. **Q8 — the toolbar merge, mock first.** No toolbar implementation before the human approves a static mock (both
   themes; 1440 / 1080 / 414). §8-2's mock is therefore a hard gate, not only an input. Test re-spellings that
   follow from moved chrome are **authorized per surface**, each named with the property it protected kept
   (resolves §7-1's process).
3. **Q9 — the status line, test-backed.** Every statement on it must be backed by a test; anything that cannot be
   proven is left off (sharpens §9-Q9's "only true facts").
4. **Q13 — the snapshot notice is also permanent.** One-time and dismissible where it appears, **and** the same
   disclosure stays permanently reachable in the Stored data panel (a trust disclosure must not disappear with a
   dismissal). Adds an acceptance criterion: when the notice has been dismissed, the Stored data panel shall still
   show the snapshot disclosure.
5. **Q15 — contact and repository.** (a) `hello@peekover.dev` is **not confirmed**; the human does not plan to buy
   a domain for now. Under §3.2/§3.3 it is treated as not live: no surface presents it as a working channel, and
   the replacement channel is open (`plan.md` proposes; GitHub private vulnerability reporting is the fallback,
   usable once the repo is public). **Flagged:** this conflicts with `decisions.md` 2026-07-11 ("peekover.dev
   owned+verified") — the truth pass must check the README's and site's peekover.dev references and the privacy
   policy's home against whichever is true, assuming neither. (b) The repository goes **public at release**: docs
   may link it; nothing in M13 may depend on it being readable before then. (c) The site **self-hosts its fonts**
   — now in scope for the truth/site pass.
6. **Q19 — the privacy policy is linked from all three store listings** (adds to §3.8's listing text).

---

## Appendix A — design inventory and gap analysis

### A.1 Where the design lives, and what is in it

**In the repository, `design/`, four files, all HTML/CSS, all readable here; last changed `b6fbc08`
(2026-07-14, "reconcile dark tokens"):**

| File | What it is | Format | Notes |
|---|---|---|---|
| `tokens.css` | The colour, radius, shadow and font-family tokens; light, dark, partial sepia | CSS, 28 lines | Header says "source of truth: design/brand.html" — but values differ from it (Q2) |
| `brand.html` | The style guide: idea, logo rules, colour, typography, core tokens (radius 10/14/99, motion 150–250 ms, measure 76ch, one shadow, chrome at 88–92% + blur), voice, brand behaviours | HTML | Loads Google Fonts; three token values differ from `tokens.css` |
| `icons.html` | The mark in four size-specific renditions (128 / 48 / 32 / 16), dark-background variants (#FFD84D / #0B0C12), construction rules, export rule (PNGs at 1× and 2×) | HTML + inline SVG | `assets/icons/icon-{16,32,48,128}.svg` exist but are not in the manifest |
| `mockup.html` | ONE interactive prototype of the whole Phase-1 product: toolbar, folder sidebar, reading view (three demo docs), edit split pane, TOC rail + hover card, status bar, ten overlays (palette, diff, presentation, lightbox, AI, find, cheat-sheet, setup guide, export, AI consent), settings panel, toast, tour | HTML/CSS/JS, 1,360 lines; light/dark/sepia via `data-theme` | Not per-surface files; no separate content-script mockup; many drawn features are unshipped |

**Fonts:** named by the design, loaded by its HTML from Google Fonts — Literata (bundled, `assets/fonts/`, four
Latin faces, about 86 KB raw), **Bricolage Grotesque and Sometype Mono (not bundled anywhere)**; the mockup also
loads the eight alternative reading faces of the unshipped font setting. **There are no raster files, no Figma or
external-tool artefacts, and no per-theme mockup files** — themes are toggles inside the one mockup.

### A.2 The token mapping table — design vs `readerCss.ts` (reader) vs `appShell.ts` (shell)

| Token / property | Design (`tokens.css` · mockup) | Reader (`readerCss.ts:43–65`) | App shell (`appShell.ts:370–450`) | Verdict |
|---|---|---|---|---|
| `--paper --panel --ink --muted --faint --line --accent --accent-soft --hl-soft` (light, dark) | as tokens.css | same | same | **same** (three copies — drift risk, Q4) |
| `--code-bg --hl --ok --ok-soft --warn --del --del-soft` | as tokens.css | same | absent | **missing** in the shell's own sheet |
| `--logo-ink --logo-eye` | tokens.css only; mockup uses literals | defined | absent | **extra / unused** |
| `--r` 10px | 10px | 10px | 10px | **same** |
| `--shadow` light | 0 10px 30px rgba(22,23,31,.10) | same | same | **same** |
| `--shadow` dark | mockup rgba(0,0,0,.5); tokens.css none | inherits light | inherits light | **different** (Q2) |
| `--warn` light | tokens.css #B7791F; mockup none | #B7791F | absent | **same** as tokens.css |
| sepia | mockup 13 tokens (`--hl` #F5C33B …); tokens.css 4 | 4 | none | **different / dormant** (Q6) |
| brand.html values | `--accent-soft` #EDEDE4, `--del` #C43D3D, night paper #14161F | tokens.css values | tokens.css values | **conflict between design files** (Q2) |
| `--serif` | "Literata",Georgia,serif | same, Literata **bundled** | not used | **same** |
| `--sans` | "Bricolage Grotesque",system-ui | same name, face **not bundled** → system-ui | `system-ui,"Segoe UI",Roboto` | **different** (effective: system font everywhere) |
| `--mono` | "Sometype Mono",ui-monospace | same name, face **not bundled** → ui-monospace | not used | **different** (effective) |
| Body type | 17px / 1.7 serif | 17px / 1.7 | 15px / 1.55 sans (chrome) | **same** (reader) |
| h1 / h2 | 44 / 1.12, 27 | 44 / 1.12, 27 | — | **same** |
| h3–h6, lede, eyebrow | mockup: lede 20 italic, eyebrow 11 caps; no h3–h6 | h3 20 … h6 12 | — | **extra** (reader) / lede+eyebrow n/a (no such markdown) |
| Code / raw | pre 13.5/1.7, raw 13/1.75 | same | — | **same** (but face differs) |
| Table | sans 14.5, th 11.5 caps .08em | same | — | **same** |
| Chrome type | toolbar 13.5, buttons 12.5/600, pills 12 | pills 12.5/600 | 15px base | **different** (shell) |
| Measure | 76ch | 748px (B1 ruling) | — | **different by ruling** (Q7) |
| Column padding | 56 32 130 | 56 32 130 | — | **same** (the 130 is the carried band's source) |
| Radii beyond `--r` | cards/panels 14, pills 99, small 6–8 | lightbox 12, pills 999, 6 | — | **different** (cards 12 vs 14) |
| Motion | 150–250 ms ease; reduced-motion respected | .15s; global reduced-motion rule | no reduced-motion rule | **same** (reader) / **missing** (shell) |
| Chrome translucency | paper 88–92% + blur | pills solid `--panel` | header solid `--panel` | **different** |
| `::selection`, focus ring | focus 2px accent | focus same; selection `--hl-soft` | focus same | **same / extra** |
| Spacing scale | none defined | none | rem-based | **not covered by the design** |

### A.3 Per-surface gaps (both themes unless noted), with a rough size

| Surface | Mockup reference | Renders today | What differs | Size |
|---|---|---|---|---|
| Foundation: fonts + tokens | `tokens.css`; brand.html "Typography" | `fonts.ts:22–45`; `readerCss.ts:43–65`; `appShell.ts:370–450` | Two of three faces unbundled; three token copies; shell `--sans` overridden | **M** (riskiest: content-script bytes, §8-1) |
| Toolbar icon | `icons.html` (16/32/48/128) | built manifest has no `icons` key | Default browser icon shows | **S** |
| App header / toolbar | `mockup.html:441–466`, CSS :41–64 | `appShell.ts` `__header` (CSS :465ff) | No mark/wordmark, no file name, solid panel not translucent, text pills, no Read/Edit/Raw switch, theme control duplicated | **L** (Q8) |
| Folder pane | `mockup.html:471–501`, CSS :74–87 | `treeView.ts`, `recentsView.ts`, `appShell.ts` | Width ≈256 px vs 228; no section caps headings; pills for pin/revoke; search field styling; no collapse control; narrow screens keep it | **M** (narrow case: Q12) |
| Reader typography | CSS :107–184 | `readerCss.ts:94–206` | Faces only (sans tables, mono code) | **S** |
| Reader chrome pills (watch, theme, Raw/Reading, Edit, Compare, agent badge) | toolbar `.watch`, `.seg`; `.iconbtn` | `readerCss.ts:249–470`, `EDIT_CONTROL_CSS` :1561 | Floating pills stacked bottom-left/top-right vs toolbar components; 130 px band | **L** (rides on Q8/Q10) |
| Snapshot notice | none (mockup diff footer copy only) | `readerCss.ts:364–392` + app-only rule | Sits on text at narrow; no mockup | **S** (Q13) |
| TOC rail | `mockup.html:692–710`, CSS :89–105 | `tocView.ts`, `readerCss.ts:528–660` | Tick rail + hover card + pin vs collapsible resizable rail; "here" mark gradient | **M** (Q11) |
| Code blocks | `.codeblock`, `.copy` CSS :151–157 | `codeView.ts`, `codeEnhancer.ts` | Toolbar buttons vs one copy button; native-looking controls | **S** |
| Display math | `.math` CSS :167 | `mathView.ts`, `mathEnhancer.ts` | Carries the code toolbar; native Copy LaTeX/MathML buttons in dark | **S** |
| Table tools | `.tablewrap`, `th` CSS :143–149 | `tableTools.ts`, `readerCss.ts:192–198` | Native filter-clear / sort buttons in dark | **S** |
| Diff view + snapshot picker | `.diffbox` overlay CSS :204–213 | `diffView.ts`, `diffChrome.ts`, `readerCss.ts:215–460` | Inline column vs modal card; picker styling | **S–M** (keep inline by D-15; restyle) |
| Diagram lightbox | `.lightbox` CSS :225–228 | `readerCss.ts:747–752` | Paper scrim 76% vs ink scrim .75; card radius | **S** |
| Remote-media badge / network indicator / failure banner | `.status .net`, `.alert` | `readerCss.ts:470–527` | Indicator shown only when live; banner styling close to `.alert` | **S** (+ Q9) |
| Editor | `.editor`, `.edbar` CSS :299–313 | `EDITOR_CSS` :1460–1560, `editorView.ts` | Close already (R29); faces; Save button style; the 130 px band | **S** |
| Panels: Stored data, Export, Code theme | `.panelbox`, `.exports`, `.settings` CSS :194, :351, :401 | `storageControls.ts`, `exportControls.ts`, `codeThemeControl.ts` | Card radius/shadow/header pattern; export as list rows with hints | **M** |
| Unsaved-changes guard dialog | `.overlay` + `.consent` btns CSS :192, :408–416 | `unsavedGuard.ts` | Scrim, card, primary ink button pattern | **S** |
| Empty / denied / unsupported app states | none | `appShell.ts`, `capability.ts:36–49` | **No mockup** — product spec §7-7 calls them designed moments | **M** (design question below) |
| Content-script reader on `file://` and raw hosts | none separate (the reader view) | `mountReader.ts`, `READER_CSS` | Faces and chrome as above, bounded by bytes | **M** (Q10) |
| Onboarding page (new) | setup card `mockup.html:844–859`, CSS :327–336 | does not exist | New | **M** |
| Popup / options | none | none exist | — | **none** |

**The riskiest part** is not any single surface: it is the toolbar consolidation (Q8) touching every
geometry-pinned chrome test at once (§7-1), compounded by the font fork deciding how much of it the content
script can carry (§8-1).

**Surfaces the design does not cover (questions for the walk, not choices made here):** the app page's empty,
denied and unsupported states; the Stored data panel's content; the snapshot notice; the Code theme picker; the
unsaved-changes dialog's copy layout; the content-script reader as a standalone tab; the 16 px mark on a dark
browser toolbar (icons.html's dark set exists — whether the manifest uses `theme_icons`-style variants is a plan
question; Chrome MV3 has no per-theme action icon key, so light-only is the likely answer). **Proposed rule for
all of them:** compose from the mockup's existing components (`.panelbox` card, `.alert`, ink primary button,
section caps headings) — no new component vocabulary.

### A.4 Conflicts with standing rulings and invariants (each is a question above, not a choice)

| Conflict | Standing ruling / invariant | Question |
|---|---|---|
| Mockup code colours (accent keyword, `--ok` strings) | R11 two-tone editor palette; AA on code-bg | Q5 |
| Mockup `--faint` (#9A9DAC, about 2.6:1 on paper) used for small text: sidebar headings, status bar, captions | AA floors; the accepted below-AA list is closed | §5 — information-bearing text uses `--muted`; `--faint` only where non-essential, each new case to the human |
| Two more faces | Zero network (no remote fonts); content-script fence; 7 MiB | §8-1, Q3 |
| Fonts on the content script from the package URL | `web_accessible_resources` forbidden (`manifest.test.ts`) | §8-1 — inline or not at all there |
| New theme/chrome rules in `READER_CSS` | the 26 `:host` sites pin | §7-2 |
| 76ch measure | 748 px B1 ruling | Q7 |
| Sepia in the mockup | 004 D-1 deferral | Q6 |
| Mockup TOC behaviour | M3 TOC rulings, persisted width | Q11 |
| Diff as a modal | 006 D-15 (diff is an attribute flip on the column) | keep inline, restyle |
| Blinking mark, pulsing watch dot, panel entrances | reduced motion; < 165 ms first paint | §5 |
| Toolbar `backdrop-filter: blur` | < 165 ms first paint | measured with §8-1 |
| `tokens.css` header vs brand.html values | AGENTS.md "tokens come from design/tokens.css" | Q2 |
| Site's Google Fonts | brand "no network calls" (the site is not the extension) | Q15(c) |

## Appendix B — release items and current store requirements

### B.1 What exists today, per release item

| Item | Today | Gap |
|---|---|---|
| Version | `package.json` and the built manifest say `0.0.0` | 0.1.0 (Q1) |
| CHANGELOG | none (`spec-coverage.md` §6-7 notes it) | `CHANGELOG.md` with a 0.1.0 entry |
| Raster icons | none; manifest has no `icons`; four SVGs in `assets/icons/` unused | PNGs 16/32/48/128 (+2× where the store wants it), wired into the manifest |
| Privacy policy | none; Firefox manifest declares `data_collection_permissions: { required: ["none"] }` | `docs/trust/PRIVACY.md` (Q19) |
| Store listing text | manifest description only (79 chars) | per-store text in `docs/store/` |
| Tagged-release workflow | none; `supply-chain.yml`'s SBOM attach step cannot fire from a tag push | new release workflow (Q17) |
| Both zips | `pnpm zip` (WXT) exists; Firefox sources zip to be confirmed at plan | built and attached by the workflow |
| SBOM | `scripts/generate-sbom.ts`, CycloneDX, `SOURCE_DATE_EPOCH`-pinned, runs on PR/main/schedule | attached per release |
| Checksums | none | `SHA256SUMS` per release |
| Reproducibility | not proven; no tags ever cut | double-build job (§3.3) |
| Screenshots | none | last (§3.9) |

### B.2 Store requirements found (read 2026-10-30; every row cited)

| Store | Requirement | Source |
|---|---|---|
| Chrome Web Store | 128×128 PNG icon in the package; artwork 96×96 with 16 px transparent padding; works on light and dark | developer.chrome.com/docs/webstore/images |
| Chrome Web Store | Screenshots: at least 1, up to 5; 1280×800 (preferred) or 640×400; square corners, full bleed | same |
| Chrome Web Store | Promo tiles optional: small 440×280, marquee 1400×560 (listings without the small tile rank after those with one) | same |
| Chrome Web Store | Privacy tab: single-purpose description, a justification per permission, data-usage disclosure and certification, privacy-policy link | developer.chrome.com/docs/webstore/cws-dashboard-privacy |
| Chrome Web Store | "If your Product handles any user data, then you must post an accurate and up to date privacy policy"; listings with "misleading, inaccurate, incomplete" descriptions, icons or screenshots are rejected | developer.chrome.com/docs/webstore/program-policies/policies |
| Chrome (API) | `extension.isAllowedFileSchemeAccess()` — "Retrieves the state of the extension's access to the 'file://' scheme"; Chrome 99+; no permission listed | developer.chrome.com/docs/extensions/reference/api/extension |
| Firefox AMO | Source must be uploaded when code is built with bundlers/minifiers; include build instructions (README), OS and tool versions, every command, the lockfile; tools open-source and local; the rebuild must show "no differences"; default reviewer environment Ubuntu 24.04, Node 24.14.0, npm 11.9.0 unless stated | extensionworkshop.com/documentation/publish/source-code-submission/ |
| Firefox AMO | Listing must describe "what the add-on does, and what information it transmits"; manifest must accurately declare data collection, including when none (Firefox 140+) — already declared | extensionworkshop.com/documentation/publish/add-on-policies/ |
| Edge Add-ons | Privacy page: single purpose, permission justifications, remote-code declaration (MV3: none), data-usage certification, privacy-policy URL (required if any personal information is accessed, transmitted or collected) | learn.microsoft.com/microsoft-edge/extensions/publish/publish-extension |
| Edge Add-ons | Description 250–10,000 characters; logo 1:1, minimum 128×128, recommended 300×300; small tile 440×280 and large tile 1400×560 optional; up to 6 screenshots at 640×480 or 1280×800 | same |

**Not confirmed from official pages this session — open, for `plan.md` to verify:** AMO's rule on when a privacy
policy is required (its policy page truncated before that section; Q19 writes one regardless); AMO's icon and
screenshot sizes; the Chrome Web Store's summary-length limit for the manifest description; whether WXT's
Firefox zip already produces an AMO-ready sources archive.

---

_Gate status: **approved at gate 1 (2026-10-30)** — see §10. Next, `plan.md` — the HOW — is the next artifact
and gate, written in a **fresh session**, resolving §7 against the actual code; `tasks.md` is gate 3. **No
implementation code before tasks.md is approved** (WORKFLOW.md §5.3). The design walk is human-only and needs a
loaded extension from a fresh production build of both engines — no agent substitute (AGENTS.md)._

_Standing verification rules this milestone inherits: every regression test is revert-and-fail with the
defect's own signature; every empirical claim carries a positive control that fires; perf numbers are A-B-A with
the floor beside the median; zero-network guards include a slow case and read after `wireSettled()`; browser-suite
assertions about shared state are delta- or specific-content-based; bundle-affecting tasks measure `pnpm build` +
`pnpm zip` + `.output` on BOTH engines; the close walk records engines, themes and viewports, and covers the
reader's own surfaces the milestone did not touch (WORKFLOW.md §7.4)._
