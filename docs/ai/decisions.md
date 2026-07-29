# Decisions — Peekover
*Append-only. Newest first. Format: date · decision · why · revisit-when.*

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
