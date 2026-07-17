# Spec 004 — Themes + Settings

**Status:** approved (Gear-3 gate 1 passed 2026-07-17) — plan.md next
**Date:** 2026-07-17
**Milestone:** M4 · builds on 003 (TOC/navigation, CLOSED)
**Structure:** follows WORKFLOW.md §5.2 (`spec.md` = the WHAT, no tech). Reconcile against `specs/_template-spec.md` if it carries extra sections.

---

## 1. Problem & value

Peekover currently themes itself **for** the user but gives the user **no say**. M1 wired light/dark to `prefers-color-scheme` (auto only); sepia and manual switching are defined-but-dormant (`readerCss.ts`, `reader.ts`; decisions.md 2026-07-14). Reading preferences do not persist — every reader open starts from OS default, and 003's TOC open-state/width are per-view only (decisions.md 2026-07-17). There is no settings surface at all.

This milestone gives the reader a **remembered, user-chosen appearance**: pick a theme (including sepia), have it stick across opens on both surfaces, and carry the TOC's open-state/width forward — all **without spending a manifest permission**, keeping the "permissions:[] survived" trust posture that is core positioning (spec §6, PERMISSIONS.md).

**Who it serves:** every reader persona (spec §3) — the developer who reads in dark, the writer who prefers sepia paper, the security-conscious user who gets a real preference system that still makes zero network calls and asks for nothing at install.

## 2. User stories

- As a reader, I want to **choose** light / dark / sepia / auto, so the document reads the way I like rather than only how my OS is set.
- As a reader, I want my choice to **persist**, so I don't re-set it on every file.
- As a reader on the app page, I want the **whole page** (shell + reader) to honor my theme, so I never see a half-dark screen.
- As a reader, I want the **TOC's open-state and width remembered**, so it opens the way I left it.
- As a security-conscious user, I want to **see** that settings are stored on-device and **wipe** them, and I want confidence the extension still asks for no new permission and makes no network call to remember my preferences.

## 3. Key scope decisions (decided at this gate — redline as needed)

These are the five choices the gate exists to settle. Each is decided here so the plan implements rather than re-litigates.

**3.1 Persistence path — zero-permission, local-only (no new manifest permission).**
Settings persist in the existing on-device `peekover` IndexedDB (a new `settings` store), reached from the content-script reader via a message to the extension's own background context (the reader's own origin cannot see the extension database). The app page reaches the store directly.
- **Consequence (kept):** the built manifest stays `permissions: []` on both engines; the `manifest.test.ts` pin holds; PERMISSIONS.md is updated **in the same PR** (AGENTS.md #4) to document the new capability honestly (the background gains a settings message handler; it previously held one listener).
- **Consequence (deferred, on purpose):** **no cross-device sync** this milestone. The product spec's `storage.sync` path (spec §9 / §6.17 / F7) is a *later, deliberate* decision — taking the `storage` permission is a #4 event to be scoped on its own when sync's value justifies spending the permission, not defaulted into here.

**3.2 Milestone scope — minimal.** Theme selection (auto/light/dark/sepia) + persistence + a settings surface reachable from both reader surfaces + TOC open-state/width carry-over. The wider F7 set is **out** (§6).

**3.3 Shell chrome is themed too.** A manual theme applies to **both** the reader and the app-page shell/pane chrome, so there is never a themed reader inside an OS-default shell. This requires the shell's currently `@media (prefers-color-scheme)`-only theming (`appShell.ts` `APP_CSS`, `readerPane.ts` state CSS) to become **attribute-driven**, with the OS media query as the *auto* default. (A half-themed screen is the coherence/occlusion defect class the M3 gate exists to catch — retro 2026-07-17.)

**3.4 Auto-theme staleness fix ruled IN.** The theme runtime (`reader.ts` `watchColorScheme`) currently re-themes only content-script hosts (`querySelectorAll('peekover-root')`), so an OS light↔dark flip with an app-page document open leaves that reader's theme **stale** — a latent M2 defect this milestone's runtime rewrite fixes by construction (host-registry broadcast, mirroring 003's TOC registry). Shipping the rewrite without fixing it would be knowingly shipping the bug.

**3.5 Sepia activated — with its palette completed.** Sepia becomes user-selectable. Its token block currently overrides only `--paper/--ink/--accent/--accent-soft` (`readerCss.ts`), so chrome (code, tables, rail, pills) would inherit **light** tokens on sepia paper. Completing sepia's token set is **in scope**, and is a *verify-first* task: check `design/tokens.css` (the stated source of truth) for a full sepia palette and copy it; if only the four tokens are defined there, that is a **design decision to escalate**, not a gap to silently fill. Sepia's rendered look (contrast, the on-highlighter literal-hex trap) is a **human-gate item** — occlusion-class, not measurable by geometry.

## 4. Acceptance criteria (EARS)

**Theme selection**
- When the user selects a theme (Auto / Light / Dark / Sepia) in the settings surface, the system shall apply it to the current reader immediately.
- While a manual theme is selected, when the OS color-scheme changes, the system shall **not** override the manual choice (manual wins over auto).
- While **Auto** is selected, when the OS color-scheme changes, the system shall re-theme **every** open reader on **both** surfaces to match (fixing the §3.4 staleness).

**Persistence**
- When the user selects a theme, the system shall persist it on-device so a newly opened reader on **either** surface applies it with no re-selection.
- When a reader opens with a persisted theme, the system shall present that theme as the **first painted state**, without a user-visible flip from a default theme to the persisted one. *(FLAG: feasibility of "no flip" on the content-script surface — where the read is necessarily async at document_start — must be confirmed and MEASURED in plan.md; if a flip is unavoidable within the first-paint budget, the plan defines and this spec adopts an honest fallback rather than asserting an un-measured guarantee. M1 retro rule.)*
- The system shall persist all settings **without requesting any new manifest permission**; the built manifest shall keep `permissions: []` on both engines.

**Surface coherence**
- While a manual theme is active on the app page, the system shall apply it to **both** the reader pane and the shell chrome (no half-themed screen).

**TOC carry-over**
- When the user changes the TOC open-state or width, the system shall persist it so the next reader open applies the remembered state instead of the width-derived default (`initialTocOpen`). *(Scope: a single global remembered state this milestone; per-file memory is out — §6.)*

**Sepia completeness**
- When Sepia is selected, the system shall render a complete, contrast-checked palette across the reading column **and** its chrome (code, tables, rail, pills) — no light-theme token bleed.

**Trust surface**
- When the user opens the "Stored data" panel, the system shall disclose (plain language) that theme/display settings are stored on-device, alongside folders/recents/pins.
- When the user wipes all data, the system shall also clear persisted settings, returning theming to Auto.

**Never-blank / degradation (AGENTS.md #5)**
- If the settings store is unreachable (blocked upgrade, restricted context, read failure), the system shall fall back to Auto (OS) theming and shall never blank, hang, or throw on the render path.

## 5. Non-functional requirements

- **First paint (typical doc ≤50 KB):** the persisted-theme read shall not regress the <150 ms typical-doc target; measured against the 003 baseline, delta stated. No un-measured threshold ships (M1 retro).
- **First paint (theme correctness):** the no-flip property of §4 is the primary first-paint risk and a **human-gate** item on both engines (Chrome + Firefox), on both surfaces.
- **Zero-network (AGENTS.md #1):** persisting/reading settings issues **no** network request; proven at the request level in real Chromium + Firefox (Resource-Timing assertion, non-vacuous — the established folder-mode/reader pattern).
- **Golden pin:** `tests/golden/output/` shall stay **EMPTY** — themes/settings touch chrome, tokens, and the shadow stylesheet, never the pre-mount `sanitize(parse(source))` reading-column string. A golden diff is a stop-and-flag.
- **Manifest pin:** `permissions: []` re-proven on both built manifests; no new `host_permissions` / `web_accessible_resources` / `webRequest` / `tabs` / `storage`.
- **Bytes:** content-script size delta measured vs the 284,744 B (003) baseline, delta stated; `pnpm zip` < 2 MB both engines.
- **a11y (spec §7.3, F12):** any theme-change transition shall respect `prefers-reduced-motion` (instant under reduce). The app-page contained surface's known reduced-motion asymmetry (decisions.md 2026-07-16) shall not be worsened — see §6.
- **Store integrity:** the first-ever `DB_VERSION` bump shall preserve existing folders/recents/pins data (additive store creation only; a record-shape migration would be idbCore's documented STOP signal and is not in scope).

## 6. Out of scope (explicit)

- **Cross-device sync / `storage.sync`** — deferred as a future deliberate #4 event (§3.1).
- **Multiple document themes (30+), GitHub-identical named themes** (F7) — later milestone.
- **Font family / size / line-height / paragraph-spacing / dyslexia-font controls** (F7) — later.
- **Per-origin / per-document theme overrides; custom CSS** (F7) — later.
- **Settings export/import (JSON)** (F7) — later.
- **Per-file scroll-position or per-file TOC state** — TOC state is a single global preference this milestone (F5 per-file memory is later).
- **`\` (Raw/Reading) app-page shortcut unification** — recorded revisit (decisions.md 2026-07-17). The host-registry infrastructure §3.4 builds makes a later unification cheap, but the unification itself (touching `readerMode` + its tests) is not done here.
- **Adding `scroll-behavior:smooth` to the app-page `.peekover-app__reader` box** — explicitly **not** added; doing so would silently violate `prefers-reduced-motion` on the app page (decisions.md 2026-07-16). Any §3.3 work in that file must leave scroll-behavior alone.
- **Heading permalinks / deep-links / frontmatter-driven render options** — need a security-reviewed re-opening of the sanitize `id`-closure; separate work (decisions.md 2026-07-17).

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Theme-flash on the content-script reader.** The persisted theme is read asynchronously (extension storage is not synchronously readable from a content script — true for messaging *and* for the `storage` permission, so not a route artifact). At `document_start`→mount, the reader may paint OS-default then flip. Plan must choose and **measure** block-until-read vs. paint-and-transition against the <150 ms budget, and define the honest fallback if no-flip is infeasible. Human-gate item.
2. **idbCore `versionchange` gap becomes live.** This is the codebase's first `DB_VERSION` bump (1→2). `idbCore.openDb` registers no `db.onversionchange`, and connections are memoized per context (`store.ts`), so a context holding a v1 connection during an update **blocks** the v2 open (surfaced, not hung, by `onblocked` — but still a real state). Plan adds a `versionchange`→close-and-drop handler **by construction** (checklist item, same spirit as the isConnected liveness guard), plus optionally the `onblocked` orphaned-open close.
3. **Shell/reader theme desync.** §3.3's `@media`→attribute restructure of `APP_CSS` + `readerPane` state CSS risks the shell and reader disagreeing on theme. Needs a real-engine coherence check where machine-readable (computed background tokens match across shell + reader) **and** a human-gate eyeball (the occlusion-class part).
4. **Sepia token completeness (§3.5).** Verify against `design/tokens.css` before filling; escalate a 4-token-only source as a design decision.
5. **First non-page idbCore consumer.** If the background reads/writes settings (§3.1), idbCore gains a background consumer with its own memoized connection; correct behavior across an update depends on risk-2's handler.

---

*Gate: on approval of this spec, plan.md (the HOW) is drafted next — architecture, the settings-store schema, the message seam, the theme-runtime rewrite, the flash-mitigation approach, and the test strategy — for a separate human gate before any implementation code (WORKFLOW.md §5.3).*
