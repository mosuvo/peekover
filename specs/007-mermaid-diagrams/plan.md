# Plan 007 — Mermaid diagrams + diagram cache (M7a)

**Status:** draft (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-07-27
**Spec:** `specs/007-mermaid-diagrams/spec.md`, approved at gate 1 (`e09520f`). This plan is the HOW; it resolves the spec's ten §7 risks against the **actual code**, not against the spec document. No §3.x decision is re-opened, and nothing on the §6 IS-NOT list is proposed.
**Gate-1 dispositions inherited, not re-argued:** standalone `.mermaid` files OUT (§3.4) · no content-script note (§3.2) · app-page-only IS persona-#1 completion (§3.2). These were settled by the reviewer at `e09520f` and are *preserved by silence* below rather than re-listed as D-values — a plan that re-decides a gate-1 answer is a scope-reopen even when it agrees.
**Evidence base:** a codebase recon at `e09520f`, plus verification of the two external contracts §7-2 and §7-6 turn on, against **current official documentation and the engine's own source** (AGENTS.md's standing rule). Every `file:line` below was re-derived against the tree in this session; nothing is inherited from the spec or from the kickoff brief. **Three inherited claims were falsified and are corrected in place** — see §0.2.
**Libraries:** one addition — `mermaid` (§3.12). Verified against the registry, not from memory: **11.16.0, MIT, no install scripts, ESM-only, 22 direct runtime dependencies**. `dependencies` goes four → five (verified: `diff`, `dompurify`, `markdown-it`, `markdown-it-task-lists`). Nothing else.
**Spec status:** §3.1–§3.12 are closed. This plan found none of them unbuildable.

---

## 0. Decisions SETTLED at this gate (2026-07-27)

*Every decision below gets a `decisions.md` entry, named here, landing with the commit that implements it — never after. The 005→006 backfill is not repeated.*

**D-1 · The SVG profile is a SECOND EXPORTED FUNCTION in `sanitize.ts`, not a parameter to `sanitize()`. DECIDED.**
`decisions.md` entry: *"007 D-1 — a second named sanitizer, not a configurable one; the document profile keeps exactly one call shape"*

`sanitize.ts`'s own header states the discipline: the profile is *"expressed as DATA (the exported const arrays below), not as inline literals, so the allow-list is reviewable in one place"* (`:5-10`). Two profiles in that one file honour it; a profile in a second file splits the review surface. So: new exported `SVG_ALLOWED_TAGS` / `SVG_ALLOWED_ATTR` / `SANITIZE_SVG_CONFIG` arrays and a new `sanitizeSvg(svg: string): string`, with `ALLOWED_TAGS` (`:22-37`), `ALLOWED_ATTR` (`:61-65`) and `SANITIZE_CONFIG` (`:107-117`) **byte-untouched**.

*Not a parameter to `sanitize()`*, on the merits: a parameter is a value a call site can get wrong, and the failure is silent widening on the untrusted-source path. Two differently-named functions cannot be confused by a typo.

Three properties of the profile, each forced by the code rather than chosen:

- **★ The `data:` default-deny is INHERITED, not re-implemented — and this is the single most valuable thing the recon found.** `DOMPurify.addHook('uponSanitizeAttribute', …)` at `:131-135` is registered on the **shared DOMPurify singleton**, so it fires for *every* `DOMPurify.sanitize` call in the process, including the SVG profile's. And `URL_ATTRS` at `:89` is already `new Set(['href', 'src', 'xlink:href'])` — **`xlink:href` is already in it**, forward-looking, though no document-profile tag can carry one today. So §3.10's "no `data:` on any URL-bearing attribute, including `xlink:href`" is in force the moment `sanitizeSvg` exists. **This is inherited GLOBAL-SINGLETON behaviour and must be asserted by test, not assumed** — the hook IS registered on the singleton `sanitizeSvg` calls, by construction, and §2.2 pins that in both engines. **But it is NOT what protects this profile, and §2.2's proof is amended accordingly** — see `decisions.md` *"M7 §2.2 AMENDMENT — the inherited hook is PROVABLY redundant for `sanitizeSvg`"*: all five `_isValidAttribute` acceptance branches are closed under `SANITIZE_SVG_CONFIG` (2.1's allow-list already denies the `DATA_URI_TAGS` elements), so the hook is a proven no-op here and a `DOMPurify.removeHook` or isolated-instance refactor would NOT red it. The SVG profile's `data:` denial is ALLOW-LIST-driven; the hook is defense-in-depth, and what §2.2 guards instead is the boundary — a no-hook instance is clean on this profile too, and that assertion reds the moment `SVG_ALLOWED_TAGS` is widened to a `DATA_URI_TAGS` member.
- **The URI regexp is STRICTER than the document profile's, not looser.** Mermaid's output references only same-document fragments (`url(#arrowhead)`, `xlink:href="#id"` for markers and gradients). It needs no scheme at all. So `SANITIZE_SVG_CONFIG.ALLOWED_URI_REGEXP` is fragments-and-inert-values only (a scheme-free regexp confined by `ADD_URI_SAFE_ATTR` to the reference attributes) — see `decisions.md` *"M7 D-1 / §2.1 AMENDMENT — the SVG profile's `ALLOWED_URI_REGEXP` is NOT `/^#/`"*; `/^#/` alone is unimplementable against DOMPurify's global attribute gating. Still narrower than `ALLOWED_URI_REGEXP` (`:85-86`), which permits `https?`/`mailto`/relative. A generated artifact gets a tighter allow-list than untrusted source, which is the right direction and the opposite of what "we need a second profile because SVG needs more" would produce.
- **`foreignObject` is denied by ABSENCE, not by a FORBID list** — the file's stated construction (`:8-10`: *"There is no FORBID list because there is nothing to forbid explicitly"*). `ALLOW_ARIA_ATTR: true` is the one deliberate divergence from `SANITIZE_CONFIG` (`:113`), per §3.5, and it is a divergence to be *stated in the doc comment beside it*, since the two configs will be read side by side.

*Rejected:* widening the document profile (§3.5, closed). `USE_PROFILES: {svg:true}` — a category switch that admits DOMPurify's whole SVG allow-list including `foreignObject`'s neighbours, which is denial-by-category replaced with permission-by-category, and unreviewable as data.

**D-2 · TWO cache stores: `diagramMeta` (small rows) + `diagrams` (the SVG). DECIDED.**
`decisions.md` entry: *"007 D-2 — diagram-cache metadata is split from the rendered SVG, for the same reason 006 split snapshots"*

Confirmed against the code, not inherited from 006's conclusion. `IdbSchema.stores` entries are `{name, keyPath}` (`idbCore.ts:28`) — no indexes, no compound keys, no cursors, STOP comment at `:5-9`. The decisive evidence is unchanged and re-verified: `getAll` documents its own assumption — *"small bounded stores — no cursor needed"* (`idbCore.ts:116-119`) — and `describeStored()` materialises whole stores. A single store with the SVG inline means **every trust-panel open deserialises every cached diagram**, which is worse here than it was for snapshots because an SVG is the *only* thing in the row. Eviction, byte accounting and the panel figure read `diagramMeta` alone; the SVG is fetched only on a cache hit.

`DB_VERSION` 3 → 4 (`store.ts:47`), two entries appended to `SCHEMA` (`:105-117`), additive-by-name (`idbCore.ts:56-63`), no migration code. The `onversionchange` close-and-drop already covers the bump (`idbCore.ts:64-74`, `store.ts:128-137`).

*Rejected:* one store with the SVG inline (above). Reaching for `idb` (the STOP signal is real; this design does not trip it, and escalating without needing to spends the dependency budget twice in one milestone).

**D-3 · The cache key is the COMPOSITE STRING `hash + SEP + theme + SEP + engineVersion`, as the keyPath value. DECIDED — and it is forced, not preferred.**
`decisions.md` entry: *"007 D-3 — all three key components live in the key itself, because two themes of one diagram must coexist"*

`IdbSchema` allows one `keyPath` and no compound keys, so a three-part key must be one string. The real question is whether the *other two* parts could live in the record body with an equality check on read, keyed on `hash` alone. **They cannot, and the reason is a §3.7 requirement rather than a preference:** with `hash` as the key, the dark render of a diagram **overwrites** its light render. §3.7 requires that after the first flip *"every subsequent flip in either direction is a hit"* — which requires both renderings to coexist as rows. A hash-keyed store cannot hold two.

- **`hash`:** SHA-256 of the fence's text content via `crypto.subtle.digest`, hex-encoded. Async, which is free here (the enhancer is already async). **Nothing in `src/` hashes anything today** — verified: no `subtle`/`digest` occurrence outside `crypto.randomUUID` at `appShell.ts:335`. Greenfield.
- **`theme`:** the **EffectiveTheme** (`'light' | 'dark' | 'sepia'`, `settings.ts:18`), never the `ThemeSetting`. Keying on the setting would put `'auto'` in the key, and `auto` renders as two different things.
- **`engineVersion`:** read from the engine's own exported version at runtime, **never a hardcoded constant** — a constant goes stale silently on the Dependabot bump that is the entire reason §3.6 put the version in the key.
- **`SEP`** is imported from `recents.ts:52`, not re-declared — the same convention reuse 006 §1.1 made, and for the same collision argument (`recents.ts:38-52`). A hex digest, a three-value theme literal and a semver string can none of them contain it. **`SEP` is the six visible characters backslash-u-0-0-0-0, never a NUL byte** (AGENTS.md's control-character rule; 006 §4-10's warning applies verbatim to this plan and to every file `tasks.md` derives from it).

**D-4 · Eviction: ALL THREE BOUNDS GLOBAL, oldest-first, in a NEW pure `planDiagramWrite`. DECIDED.**
`decisions.md` entry: *"007 D-4 — the diagram cache is bounded globally on all three axes; there is no per-document axis to be per-"*

- **The axis assignment differs from 006 D-16, and the difference is forced by D-5.** 006 made count per-document because a snapshot key carries `folderId + SEP + path`. A diagram key carries a **content hash and nothing else** — there is no document to be per-. So count, bytes and age are all **global**, evicting oldest-first on a `lastUsed` timestamp until all three hold simultaneously.
- **`lastUsed`, not `createdAt`.** This is the second divergence from 006 and it matters: a snapshot is a historical record whose age is its meaning, so oldest-created-first is right there. A cache entry's value is its likelihood of being hit again, and §3.7's theme-flip round trip depends on a *previously rendered* row surviving. Ordering by creation would evict the light rendering of a diagram the user is reading right now, purely because they rendered it before lunch. So a cache hit **touches** `lastUsed` — a small write on the read path, confined to the meta store, which is a cost D-2's split makes affordable.
- **Single-oversized:** the short-circuit shape of `snapshots.ts:178-181`, verbatim in structure — if one SVG exceeds the whole byte bound, refuse the write, evict nothing. **Disposition: skip the cache, render that diagram from the engine every time, degrade quietly** (§4: *"render diagrams normally without caching and shall not present the failure as a blocking error"*). No user-facing message — a diagram that renders correctly and merely re-renders is not a failure the user has an action for.
- **A sibling function, not a generalisation of `planSnapshotWrite` (`snapshots.ts:170-240`).** Not duplication-by-laziness: the two algorithms genuinely differ (three global sweeps vs one per-doc + two global; `lastUsed` vs `ts`). Parameterising a shipped, tested pure function to serve a second caller with a different axis assignment changes 006's code from inside 007 for no gain. **Named here so it is not "tidied up" into a shared helper later**, which is the change that would silently give the diagram cache a per-document count.

**D-5 · The diagram cache is EXEMPT from per-folder revoke, and the exemption is DISCLOSED. DECIDED.**
`decisions.md` entry: *"007 D-5 — a content-hash cache has no folder identity; the exemption is stated in the ledger, not left silent"*

006 D-10 erases a revoked folder's snapshots because a snapshot **is** that folder's file contents, keyed `folderId + SEP + path`, and `PERMISSIONS.md:39` promises revoke *"drops the handle and its IndexedDB row"*. A diagram row is keyed by a hash of the diagram source and carries no folder identity — and that is a *property of what it is*, not an oversight: the same Mermaid source written by an agent in two folders is one row serving both.

The alternative was a `folderIds[]` index on the row. Rejected on three grounds, in order of weight: it makes a cache hit from a new folder a **write on the read path** (appending a folder id); it does not answer what to do when one of two referencing folders is revoked (delete, or keep and under-honour the promise?); and it couples a content-derived artifact to a membership model that exists for a different purpose.

**★ But an engineering reason is not sufficient here, because the honest statement is that a cached SVG contains the diagram's label text verbatim (§3.6) — it IS derived from file contents.** So the exemption is paid for by disclosure and by an alternative gesture, both of which already exist in the design:

- the ledger row (D-14) **says so in plain language** — revoking a folder does not clear cached diagram renderings, and here is the one click that does;
- **"Clear diagram cache"** erases all of it (§3.9), and **"Wipe all data"** erases it.

So contents do not outlive the user's *ability* to remove them; they outlive one particular gesture, disclosed. **The exact wording is a trust-copy call and goes to gate 2 (§8-1)** — the mechanism is decided here, the sentence is not mine to write.

**D-6 · The engine renders into an OFFSCREEN LIVE container WE own; only the returned SVG STRING is adopted, after `sanitizeSvg` and an inert re-parse. DECIDED.**
`decisions.md` entry: *"007 D-6 — measurement is live by necessity; adoption is inert by construction, and the two are different objects"*

§7-2 states the two forces pull in opposite directions. **Verified against the engine's own source, they do not actually collide — because the measured nodes are never adopted.**

`mermaid.render(id, definition, svgContainingElement?)` returns `{ svg, bindFunctions }`, where **`svg` is a string**. With no container passed it appends a temporary enclosing div (or, at `securityLevel: 'sandbox'`, an **iframe**) to `document.body` and removes it afterwards via its own `removeTempElements()`. So:

1. **Pass our own container.** Not because `document.body` would fail, but because we then control its lifetime (a throw mid-render inside the engine leaves *its* temp div behind; ours is removed on our own `finally`), its CSS context, and its teardown.
2. **The container is LIVE and in-document, and that is required, not conceded.** Text measurement needs a browsing context — and specifically, this project's fonts are registered through the FontFace API on `document.fonts` rather than as shadow-tree `@font-face` (`architecture.md` § Load-bearing weirdness, `src/theme/fonts.ts`). An in-document container is exactly where those faces participate in matching. A `<template>` cannot measure at all. **So "make the measuring container inert" is not available, and pretending otherwise is how this gets designed wrong.**
3. **`securityLevel: 'strict'`, `htmlLabels: false`, no icon packs registered.** Strict — **not `'sandbox'`**: sandbox creates an iframe in the live document (verified in source), a browsing context we would have to reason about separately, and it breaks the string-return path. `htmlLabels:false` keeps the output pure SVG with no HTML subtree, which is also what makes the §3.5 profile's `foreignObject` denial cheap rather than lossy.
4. **Adoption is the `mount.ts:131-133` pattern, verbatim:** `sanitizeSvg(svg)` → assign to a `<template>`'s `innerHTML` (parsed inert, no browsing context, no fetch) → adopt `tpl.content`. Never `innerHTML` on a live element, and never a move of the engine's own nodes.
5. **`bindFunctions` is NOT called.** It attaches click handlers to the live SVG, which is exactly the interactivity §3.11 declines and the adopted tree must not carry.

**★ The residual hole, named rather than hidden.** Between (2) and (4) the container is live, so a remote reference *emitted by the engine during measurement* would fetch before we ever serialize. Configuration closes the known routes; the profile closes the adopted artifact; neither closes the measurement window by construction. **Only a real-engine, request-level guard with a control that fires can show that window is clean — jsdom loads no subresources and cannot see it** (the standing lesson, `mount.ts:119-129`). That guard is **group 3's, not group 8's**, because it gates the mechanism rather than reports on it.

**D-7 · The re-theme trigger is a NEW effective-theme notification at `themeRegistry.applyTheme()`. NOT `onThemeSettingChange()`. DECIDED.**
`decisions.md` entry: *"007 D-7 — diagrams follow the EFFECTIVE theme, so they subscribe where the effective theme is broadcast"*

**★ This is a shipped-defect-class avoided at plan time, and it is the recon's second real finding.** The obvious seam is `onThemeSettingChange` (`reader.ts:124-127`). It is the wrong one, and its own doc comment says why: *"Not the effective theme: an OS flip under `auto` changes what paints but NOT what the user picked, so it deliberately does not notify"* (`reader.ts:108-112`). §4 requires re-theming **"when the effective theme changes."** `DEFAULT_SETTINGS.theme` is `'auto'` (`settings.ts:39`). So subscribing to the setting channel would leave every diagram stale on an OS dark-mode flip **in the default configuration** — the single most likely way a user meets this feature.

`applyTheme(effective)` (`themeRegistry.ts:67-72`) is the one broadcast every effective-theme change goes through: both the setting writer (`reader.ts:89`) and the OS-flip listener (`reader.ts:157`) call it. So the notification belongs there — a listener set beside `themeHosts` (`:34`), notified after the attribute writes, pruned by the `isConnected` discipline the module already documents and calls *"the liveness guard as a property of the code path"* (`:13-19`). Additive; `applyTheme`'s existing behaviour is unchanged and is red-first pinned before the listener is added.

**D-8 · Cache bound VALUES are MEASURED, then chosen by a human at gate 3. The measuring task is FORBIDDEN from choosing. DECIDED.** (spec §8-1)
`decisions.md` entry: *"007 D-8 — diagram-cache bound values are proposed, measured, and chosen at a separate human gate"*
The 004 D-2 / 006 D-8 shape, unchanged. Axes are settled (D-4: count, bytes, age, all global); values are not. Outputs in §7.

**D-9 · The typical-case (1–3 diagram) time-to-rendered TARGET is set at gate 3 from measurement. DECIDED.** (spec §8-2) `decisions.md` entry: *"007 D-9 — the typical-case diagram target is measured before it is asserted"*. §8's 50-diagram bounds are inherited as hard outer bounds; the typical-case number is not derivable from them and is not asserted from prose (the M1 standing rule). Outputs in §7.

**D-10 · The package-size boundary decision fires only if measurement lands close. DECIDED.** (spec §8-3) `decisions.md` entry: *"007 D-10 — no subset-build strategy is chosen before the engine's real cost is known"*. The operative bound is `pnpm zip` **< 2 MB per engine** against the current **349,744 / 349,803 B**. No byte figure is asserted here; the direction decision's ~400 KB is an estimate and is treated as one. Outputs in §7.

**D-11 · Whether the placeholder shimmers is a gate-3 WALK judgement. DECIDED — the axes, not the answer.** (spec §8-4) `decisions.md` entry: *"007 D-11 — placeholder motion is judged on a real document, in 006's reads-as-noise shape"*. Axes: whether motion at 10 and 50 simultaneous placeholders reads as progress or as noise; whether it is instant under `prefers-reduced-motion` (a §4 criterion, so this half is a **test**, not a judgement, and ships either way).

**D-12 · The enhancer is invoked from TWO app-page call sites. NOT from a registry inside `mount()`. DECIDED.**
`decisions.md` entry: *"007 D-12 — the app page invokes the enhancer at both of its mount sites; mount() stays read-only library"*

§3.3 requires the enhancement run *after* `mount()` returns and *not* become a branch inside it, and 006 D-15 keeps `mount()` read-only library. The recon's finding is that **the app page has two mount paths, not one**, and a plan that names only the obvious one ships a feature that vanishes the first time an agent edits the file:

| path | site | when |
|---|---|---|
| initial select | `readerPane.ts:179` — `mount(outcome.text, host, { contained: true })` | user picks a file |
| every watch re-render | `watchController.ts:449` — `render(text, target, {contained, preserveReading:true})`, where `render` defaults to `mount` (`:293`) | agent rewrites the file |

The second path is precisely the one §3.3 calls out (*"Every re-render re-enhances"*) and the one the cache exists for. So:

- `readerPane.paint()` calls the enhancer after `mount()` returns;
- `appShell.installWatchForFile` passes a `render` closure into `createWatchController` (`appShell.ts:794`, which passes no `render` today) that calls `mount` and then the enhancer.

**★ The import fence, and it is the same seam as the surface gate — 006 §1.4's shape reused.** `readerPane.ts` is imported by `appShell.ts` and nothing else (verified across `src/` and `entrypoints/`), and the watch closure is *constructed in* `appShell.ts`. So the enhancer module is reachable from the app-page graph only, and never from `mount.ts`, `mountReader.ts` or `watchController.ts` — all three of which the content script traverses. **`contentWatch.ts:121` passes no `render`**, so it keeps the bare `mount` and the content-script graph never learns the enhancer exists. If `mermaid` ever appears in the content-script bundle, the fence broke and §3.2 with it — a STOP-and-flag.

**★ The cooldown interaction, named so it is not discovered by a slow reader.** `watchController` times its whole synchronous block to set the cost-proportional cooldown (`:422`, DECISION 3). **The enhancer must schedule its work and return synchronously in ~nothing**, or every diagram-bearing watched document gets an inflated cooldown. Same constraint 006 §1.1 put on the fire-and-forget snapshot write, for the same reason.

*Rejected:* a `registerDiagramEnhancer` registry read inside `mount()` — structurally tidier and it is what D-14 of 006 would suggest, but §3.3 forbids the branch and 006 D-15 forbids the crossing; the two-call-site cost is the price of that fence and it is small. Enhancing from `readerPane` alone (misses every watch re-render — the case the cache exists for).

**D-13 · `mermaid` is imported by EXACTLY ONE module, `src/render/diagramEngine.ts`, via the literal `import('mermaid')`. DECIDED.**
`decisions.md` entry: *"007 D-13 — one module owns the engine import; the specifier is a static literal and 007 is the first code the CI rule ever sees"*

Mirrors `diffEngine.ts`'s single-importer fence (006 §1.4). The specifier is the static string literal `'mermaid'` — the exact shape `check-dynamic-imports.ts`'s own MUST_NOT_FIRE fixture sanctions (`:302`, *"bare-specifier lazy chunk (spec §10 Shiki pattern)"*), so the bundler resolves it into the signed package at build time and the scanner stays green **because the rule permits it, not because the rule is being avoided**. `decisions.md` 2026-07-27(c) records that there are **zero** dynamic imports in `src/`/`entrypoints/` today; **007 is the first code in the repository to exercise the rule that was written for it**, and `supply-chain.yml:61-65` runs the scanner's self-test before the repo scan, so a scanner that has stopped firing fails on its own.

The import is behind a feature-detect: **no `language-mermaid` fence in the committed DOM ⇒ `import('mermaid')` is never evaluated** (§4: *"When a document contains no mermaid block, the system shall not load the diagram engine"*).

**D-14 · The trust surface mirrors the snapshot pair EXACTLY, and the PERMISSIONS.md derived facts move with it. DECIDED.**
`decisions.md` entry: *"007 D-14 — the diagram cache is disclosed, counted and separately erasable on the snapshot row's pattern"*

Each site re-derived, and each is a compile-time or test-time forcing function rather than a thing to remember:

- `StoredSummary` (`store.ts:357-388`) gains a **REQUIRED** `diagrams: { count: number; bytes: number }` — required for the reason `store.ts:362-375` already gives twice: *"a future summary literal that forgets the field fails to compile."* This **breaks the build** at `appShell.ts:562`'s duplicated `EMPTY_SUMMARY`, which is the intended behaviour.
- `buildStoredLines` (`store.ts:411-469`) gains a line; `humanBytes` (`:398`) is reused.
- `describeStored` (`store.ts:477`) reads `diagramMeta` only (D-2).
- `wipeAll` (`store.ts:298-305`) gains two `clear()` calls; a new `clearDiagramCache()` beside `eraseSnapshots()` (`:331-334`) clears the two diagram stores and nothing else.
- `storageControls.ts` gains a third control beside the erase-snapshots one (`:241-280`), following its `disabled`-at-zero and inline-confirm shape; `appShell.ts:599`'s wiring shape is copied at `:626`.
- **`docs/trust/PERMISSIONS.md`: a new ledger row in the established five-column format, PLUS the derived facts that go stale.** The IndexedDB row currently reads *"**six** stores at `DB_VERSION` 3"* and *"clears **all six** stores"* — both false at `DB_VERSION` 4 with eight stores. This is 006 §1.3's derived-facts class exactly, and it is why the correction is enumerated here rather than left as "add a row".
- **Ordering: all of it lands in the same commit as the first code that caches an SVG** (§3.9, *"never a follow-up"*; the 006 precedent). Expressed as a group-4 constraint in §6.

**D-15 · The rendered diagram is inserted as a SIBLING `<figure>` and the source `<pre>` is HIDDEN, never removed. DECIDED.**
`decisions.md` entry: *"007 D-15 — degradation is the default state and success is the mutation; the source fence is never destroyed"*

§3.8 requires three distinct failures — engine load, parse/render, **sanitize rejection** — to all degrade to the source fence, and §4 requires *"leave that block as its source code fence with an inline marker."* Note the ordering trap: a sanitize rejection happens **after** the engine succeeded, i.e. at the latest possible moment. If the enhancer had removed the `<pre>` on the way in, every failure path would have to rebuild it from text it must then separately retain.

Keeping the `<pre>` in the tree and toggling visibility makes **the degraded state the default and the rendered state the mutation** — the never-blank invariant expressed structurally instead of as error handling spread across three catch blocks. It is the mechanism `readerMode` already uses for the Raw view (`readerMode.ts:60-80`: build the alternate view, flip an attribute, let CSS swap), reused rather than re-derived.

Consequences, stated: the fence's source text stays in the shadow tree for every rendered diagram (bounded — a fence is small), and that retention is what lets copy / download / lightbox and the theme re-render re-derive from source with **no second copy and no cross-mount state**. It also means the golden pin is untouched by construction, because the committed `sanitize(parse(source))` string still contains the `<pre>` exactly as today.

### 0.1 Decisions this plan needs that the SPEC DOES NOT COVER — flagged, not guessed

Routed to gate 2 as §8. Two of them are copy, one is a routing inconsistency in the spec itself.

### 0.2 Three inherited claims, FALSIFIED against the tree and corrected here

Recorded rather than quietly dropped — the 006 revision-1 discipline.

1. **`runReader.ts` is NOT "the hook site where post-mount enhancement is invoked."** It is the **content-script** orchestration exclusively (`runReader.ts:35-36` imports `mountReader`; the whole file is the `document_start` hide-and-reveal dance). Hooking the enhancer there would ship the engine to the surface §3.2 forbids. The real sites are D-12's two.
2. **The first-paint baseline is 133.7 ms median / 132.1 ms floor, not 137.7 ms.** `progress.md:330,346-350`. 137.7 ms is plan 005's figure. The spec (§5) has it right; the brief did not.
3. **`docs/ai/architecture.md` is pre-code and self-labels as such** (*"Updated: 2026-07-11 (pre-code; describes intended M1 shape)"*). Its pipeline line names an `enhance` stage between sanitize and mount that **does not exist** — `mount()` commits in one synchronous `replaceChildren` (`mount.ts:210`). §3.3 already decided the real placement; the divergence is noted because the file is on the mandatory-read list and will mislead the next reader. **Correcting it is outside this plan's fence** and is named in §8-3.

---

## 1. Architecture & data flow

### 1.1 The enhancer's shape

Invoked per D-12 after a committed mount, given the reader host. Synchronous prologue, async body:

```
enhanceDiagrams(host):                       # returns immediately (D-12's cooldown constraint)
    fences = shadow.querySelectorAll('pre > code.language-mermaid')
    if fences.length == 0: return            # §4 — the engine is never imported
    for each fence: insert placeholder <figure>, mark <pre> pending   # synchronous, pre-paint
    void (async () => {
        engine = await import('mermaid')     # D-13, one literal specifier
        for each fence:
            key   = hash(text) + SEP + effectiveTheme + SEP + engine.version   # D-3
            svg   = await cacheGet(key) ?? await renderAndCache(text, key)
            adopt(fence, svg)                # D-6 step 4, D-15's flip
    })()
```

`renderAndCache` is D-6 steps 1–5 plus a `planDiagramWrite` (D-4) write. Every step is individually try/caught to the D-15 degraded state: the failure of one fence never reaches another, which is §4's *"shall render every other diagram in the document normally."*

**The fence seam is empirically confirmed, not assumed.** `parse.ts` installs no custom fence renderer, and markdown-it's default output survives sanitization: `tests/golden/output/code.html:2` reads `<pre><code class="language-js">` in a committed golden file. `pre` and `code` are in `ALLOWED_TAGS` (`sanitize.ts:26,28`), `class` in `ALLOWED_ATTR` (`:62`). The enhancer reads `textContent`, never markup.

### 1.2 Storage

Per D-2/D-3/D-4:

- `diagramMeta` — keyPath `key`, holds `{ key, bytes, lastUsed }`
- `diagrams` — keyPath `key`, holds `{ key, svg }`

Bytes via `bytesOf` (`snapshots.ts:126-128`, exported and reused — it is the same `TextEncoder` figure the panel surfaces, and re-deriving it would be the second implementation of one trust number).

**Deletion ordering: META FIRST, then content** — 006 §1.2's argument transfers intact and is not re-derived. The failure mode is a meta row pointing at missing content; the diagram path treats a missing content row as a **miss** and re-renders, which is a designed state that costs nothing, so the self-reclaim here is *better* than 006's (no "comparison unavailable" surface is needed at all). Bytes are briefly over-reported; never under.

**Not atomic**, same as 006: `idbCore` writes one store per transaction (`:97-109`). Adding a multi-store transaction helper would be the `idbCore.ts:5-9` STOP signal, and this design does not need one.

### 1.3 Theme

Per D-7. On the effective-theme notification, for every rendered `<figure>` in a live host: re-key with the new theme, look up, render on a miss, and **swap only when the replacement is ready** — §4's *"keep the previously rendered diagram visible until its replacement is ready"* is satisfied by the D-15 structure for free, because the old `<figure>` is a node that is replaced, not emptied.

The first flip is a full miss on every diagram at once (§7-9). Measured in group 5 with its own axes (§7); the fallback if it is a product problem is **progressive re-render in visible-first order**, named now as a gate-3 revisit-when, not a re-scope.

### 1.4 Design translation

`design/mockup.html` **exists** (97,471 B, dated 2026-07-14) and is the design authority. It predates 007, so per §7-10: carry the design *language*; **re-measure placement with a real rect probe** (005 §4.1's precedent, and `watchControl.ts:17-28`'s worked elimination); verify every token against `readerCss.ts` before use — the three theme blocks are `:host` light (default), `:host([data-theme="dark"])` (`:42`) and `:host([data-theme="sepia"])` (`:50`), and **sepia overrides only paper/ink/accent**, so a token that exists only in the light block is inherited by sepia (the check 006 §1.7 ran and this one must run again for whatever tokens the diagram surface uses). **Where mockup and spec disagree, the spec wins, and the divergence is recorded in-code** (`watchController.ts:14-31`'s precedent).

**`--reader-measure` is load-bearing here.** `readerCss.ts:83` defines it as `748px` and `:85` and `:570` both consume it; retro finding 6 is *why* it is a px constant. A diagram's `max-width` must resolve against that same variable or a wide diagram breaks the centring the variable exists to preserve. **And no `ch` in any layout-blocking property** (`margin`, `padding`, `transform`) in diagram styling — finding 6, cited not restated; `max-width` is free.

**Finding 9, pre-empted at plan level:** any diagram styling rationale lives in the **TypeScript doc comment above** the block, never inside the CSS template literal. This would be the third site after `readerCss.ts` and `appShell.ts`'s `APP_CSS`, and the finding's own conclusion is that awareness is not the mechanism — so the group-3 and group-7 tasks carry a **byte check on the shipped CSS block**, not a reminder.

## 2. Files to create / touch / NOT touch

**Create** — `src/render/diagramEngine.ts` (the only `mermaid` importer, D-13) · `src/render/diagramEnhancer.ts` (the §1.1 orchestration; imported by `appShell.ts` and `readerPane.ts` only) · `src/render/diagramView.ts` (the `<figure>`, placeholder, failure marker, control group, lightbox) · `src/app/diagramCache.ts` (pure `planDiagramWrite` + the IDB layer, split as `snapshots.ts` is) · test files per §5.

**Touch** — `src/render/sanitize.ts` (D-1: additive exports only; the three existing consts byte-untouched) · `src/app/readerPane.ts:179` and `src/app/appShell.ts:794` (D-12's two sites) · `src/theme/themeRegistry.ts` (D-7's listener, beside `:34`) · `src/app/store.ts` (`DB_VERSION` 4 at `:47`, two `SCHEMA` entries at `:105-117`, `wipeAll` `:298-305`, new `clearDiagramCache`, `StoredSummary` `:357-388`, `buildStoredLines` `:411-469`, `describeStored` `:477`) · `src/app/appShell.ts:562` (`EMPTY_SUMMARY`, a forced compile break) and `:586-599` (panel wiring) · `src/app/storageControls.ts:241-280` (the third control) · `src/theme/readerCss.ts` (diagram tokens + the D-15 visibility rule) · `docs/trust/PERMISSIONS.md` (D-14, same commit as the first cached byte) · `package.json` (`mermaid`).

**Explicitly NOT touched** — `src/render/mount.ts` (§3.3, 006 D-15: `mount()` stays read-only library; **007 touches it at zero sites**, and that is a checkable property, not an aspiration) · `src/render/runReader.ts` / `mountReader.ts` / `src/watch/contentWatch.ts` (the content-script graph, §3.2) · `src/render/parse.ts` (the fence seam already emits what is needed) · `src/detect/isRenderableContext.ts` and `src/app/walkPolicy.ts` (§3.4: no `.mermaid` extension) · `wxt.config.ts` (D-16 below) · `tests/manifest.test.ts` (**2975 B, byte-unmodified since `3b6c575`**) · `tests/golden/output/*` · `scripts/check-dynamic-imports.ts` and `.github/workflows/supply-chain.yml` (007 satisfies the rules; it does not amend them).

**D-16 · `wxt.config.ts` is UNCHANGED, and the Firefox declaration stands.** `data_collection_permissions: {required:['none']}` is generated at `wxt.config.ts:36` inside the Firefox-only branch (`:28-40`), documented at `PERMISSIONS.md:170-176` (§ *Firefox data collection declaration*). **006 D-9 cited `:163-167` for this; that is now the watch-relay note — the citation is corrected here rather than propagated, which is what "re-derive, do not inherit" means when it costs something.** 006 D-9 resolved that on-device snapshot storage is not "collection"; **caching a rendering the device itself generated is strictly further from collection than storing the document's own text**, which is the thing already resolved. No install-time user-visible string changes, so this does not return to a human gate. Re-verified this session, not inherited. (§7-7 closed.)

## 3. Risk resolutions (spec §7 → concrete)

1. **Lazy-import chunking** → group 1's ablation task, before anything depends on it. D-13 fixes the specifier. Four outputs, each with its control: (a) content-script bundle **md5-identical** to the pre-import build — the 006 ablation shape, and *byte-identical means it was never there*; (b) app-page chunk delta **decomposed to sub-block accounting, every byte assigned** (engine · glue · CSS · anything shipped that should not be) — retro finding 1's third instrument; (c) the emitted chunk is named and reachable; (d) `check-dynamic-imports.ts` exits 0 **and its self-test still fires** (the control: a deliberately-computed specifier in a scratch fixture must go red). If chunking behaves differently than §3.2 assumes, **that is a gate-2 finding, not a quiet re-scope.**
2. **Live measurement container** → **D-6**, resolved concretely against the engine's source. Container ours, live by necessity, adopted artifact is a sanitized string re-parsed inert. Residual measurement-window hole named and given a real-engine guard in group 3.
3. **Per-folder revoke** → **D-5**: deliberate exemption, disclosed in the ledger and answerable by a one-click clear. Copy to gate 2.
4. **Byte accounting and eviction** → **D-4**: three global bounds, `lastUsed` ordering, single-oversized short-circuit with a stated disposition (skip cache, re-render, quiet).
5. **`idbCore`'s STOP signal** → **D-2**: the two-store split satisfies §4's bounds criteria with no index, no cursor and no new `idbCore` function. `IdbSchema` re-verified: the schema is `{name, version, stores[]}` and `{name, keyPath}` is the *store* shape (`idbCore.ts:24-29`) — the same correction 006 §3-3 had to make.
6. **Copy / download permissions** → **RESOLVED; no permission needed; no AGENTS.md #4 event.** Verified against current official docs, both engines: `clipboardWrite` is **not required** to call `navigator.clipboard.write()` — it only removes the transient-activation requirement, and our write is triggered by an explicit click, so activation is present by construction ([MDN, *Interact with the clipboard*](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard): *"with the `\"clipboardWrite\"` permission, transient activation isn't required"*). The `downloads` permission gates the `chrome.downloads` **API** only ([Chrome, *Permissions list*](https://developer.chrome.com/docs/extensions/reference/permissions-list)); a `<a download>` on a `blob:` URL is plain web platform and explicitly in-scope for the attribute ([MDN, `<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a): *"`download` only works for same-origin URLs, or the `blob:` and `data:` schemes"*). **`permissions: []` and the 2975 B pin both hold.** Re-proven empirically on both engines in group 7 — a doc read is not a build.
7. **Firefox `data_collection_permissions`** → **D-16**: closed, no change, argued from 006 D-9 rather than inherited from it.
8. **Sibling-checklist audit** → **discharged below in §3.5**, as a plan deliverable rather than a note.
9. **Theme flip cost at 50 diagrams** → measured in group 5, axes in §7. Fallback named (progressive visible-first re-render) as a gate-3 revisit-when. **The spec routes this finding to gate 2 but the measurement cannot exist before group 5's code does** — see §8-2.
10. **Design translation** → §1.4. Mockup verified present; tokens verified against `readerCss.ts`'s three theme blocks before use; placement re-measured with a rect probe; spec wins on divergence, recorded in-code.

### 3.5 THE SIBLING-CHECKLIST AUDIT (§7-8 · retro finding 4) — the plan's deliverable

*Enumerated from the five named suites at `e09520f`. `Y` = the diagram surface inherits the property and tests the same shape · `D` = a distinct assertion is required · `—` = explicitly out of scope, with the reason. **`tasks.md` consumes this table; no diagram browser test is written before it is read.***

| # | property | sibling source | 007 |
|---|---|---|---|
| 1 | renders on BOTH surfaces via the one `mount()` seam | `themeControl:115,122`; `watchControl:190` | **—** §3.2: app page only. Row 2 asserts the inverse. |
| 2 | grows NO chrome where the capability is absent | `watchControl:198`; `diffChrome:242` | **D** the content-script reader leaves the fence a code fence, with **no affordance and no note** (§4, verbatim) |
| 3 | red-first that the gate is the RIGHT property | `diffChrome:274` | **D** ungate the enhancer; it must appear on the content script, proving the fence is the graph and not an accident |
| 4 | **SIBLING of `.peekover-reader`, never inside it** | `watchControl:205`; `diffChrome:312`; `mount.ts:163-167` | **D — AND IT INVERTS.** 007 is the first feature whose output belongs **inside** the reading column: the `<figure>` replaces a block in document flow and is asserted **inside** `.peekover-reader`; the **lightbox** is asserted **outside**, as a sibling. Four suites assert one direction; transcribing them unexamined would produce a wrong test. **This inversion is the audit's main finding.** |
| 5 | clears the reading column at a WIDE viewport | `watchControl:453`; `themeControl:341`; `diffChrome:431` *(the assertion M6 lost)* | **D** the per-diagram control group floats **over** a diagram inside the column, so "clearance" means it must not occlude the column's **text** — same class, different geometry |
| 6 | `--reader-measure` == resolved `max-width` | `diffChrome:474` | **Y** a diagram's `max-width` resolves against the same variable or centring breaks (§1.4) |
| 7 | clears the conditional chrome (indicator + remote-load pill) | `themeControl:352`; `watchControl:471` | **Y** for the control group and the lightbox |
| 8 | clears the TOC rail and the mode toggle | `diffChrome:350` | **Y** for the lightbox |
| 9 | the OPEN overlay clears that chrome too | `diffChrome:389` | **Y** the open lightbox |
| 10 | overlay is out of flow; the page under it does not move | `storagePanelOverlay:121,135,145` | **Y** the lightbox — and `storagePanelOverlay` is its **only** baseline |
| 11 | anchored where it claims to be | `storagePanelOverlay:154` | **D** the control group anchors to **its own** diagram, not to the viewport |
| 12 | closing returns the slot to zero footprint | `storagePanelOverlay:169` | **Y** the lightbox |
| 13 | host attribute survives a re-mount | `watchControl:236` | **—** §3.3: every re-render re-enhances; the enhancer keeps **no** cross-mount host state. The **cache** is what survives, and that is D-2's test, not a chrome test. |
| 14 | still works after a re-render (closure death) | `watchControl:251,278` | **D** the control group is rebuilt every mount; its handlers must reach the **current** figure. The registry idiom does not apply (D-12 invokes from outside), but the property does. |
| 15 | state in TEXT and `aria-*`, not colour alone | `watchControl:310` | **Y** the failure marker and both action buttons |
| 16 | a real `<button>`, keyboard-operable, no `tabindex` of its own | `watchControl:339`; `themeControl:260` | **Y** both actions and the lightbox trigger |
| 17 | accessible name carrying selection AND action | `themeControl:250` | **Y** plus §5's *every diagram carries an accessible name* |
| 18 | decorative parts hidden from AT | `watchControl:348` | **Y** the placeholder |
| 19 | reduced motion: no animation under reduce, **DOES** animate without it (non-vacuous) | `watchControl:358,694,709` | **Y** the placeholder (D-11) and the lightbox zoom |
| 20 | polite live region, out of the a11y tree while empty | `diffChrome:651` | **Y** the failure marker and action-failure messages |
| 21 | **focus TRAP and RESTORE** | **NO SIBLING SUITE HAS THIS** | **D — and this is finding 4's *other* half.** §5 requires the lightbox trap and restore focus. No existing element traps focus, so there is no baseline to transcribe from and **nothing would be noticed missing**. Per finding 4: *"If no sibling suite exists, THAT IS THE SIGNAL."* 007 establishes the baseline. |
| 22 | zero-network with a control that FIRES | `remoteMedia:120,140` | **D** same `/^https?:/i` predicate and the `awaitFetchedUrls` control shape (`remoteMedia:83-92`), extended: the control must fire **under the same conditions the negative claim disclaims** — i.e. a diagram whose source references a remote image, during D-6's live measurement window |
| 23 | `describe.each` over both surfaces | `watchControl:189` | **—** collapses to one surface by §3.2; row 2 carries the other surface as its own case |

## 4. Risks & unknowns this plan still carries

1. **★ The measurement window (D-6) is closed by configuration and by the adopted-artifact profile, but not by construction.** Unlike `mount.ts:131-133`'s inert `<template>`, there is no engine-guaranteed inertness available for a step that must measure glyphs. The guard is empirical and lives in group 3.
2. **★ `mermaid` pulls `katex` into the production tree as a transitive dependency** (verified: 22 direct deps include `katex ^0.16.45`, `d3`, `cytoscape`, `marked`, `roughjs`). **Math rendering is on §6's IS-NOT list, and this does not put it back on** — but the SBOM will list `katex`, and a reader of the SBOM could reasonably infer a feature that does not exist. Named so nobody "discovers" it later as a scope breach. It is also byte-accounting pressure (§7, D-10).
3. **`mermaid` depends on `dompurify ^3.3.3` and we ship `^3.4.12`.** Expected to dedupe to one copy; **if it does not, the bundle carries two DOMPurify instances and the D-1 global hook applies to only one of them.** That would be a silent hole in the `data:` deny for the SVG profile. Group 1 verifies the resolved tree has exactly one `dompurify`; group 2's test asserts the hook fires through `sanitizeSvg` regardless.
4. **`pnpm audit --prod --audit-level low` is BLOCKING** (`supply-chain.yml:83-84`) and the production tree is currently clean at 0. A 22-package addition may not stay clean. Per §3.12 **that is a blocker to resolve, not a threshold to relax** — and it can only be discovered at install time, i.e. group 1.
5. **App-page first paint has ZERO automated coverage, and 007 ships to the app page.** `scripts/perf-first-paint.ts` navigates a `file://` document and triggers on `<peekover-root>` — the content-script surface exclusively. Carried from 006 §4-3, unchanged, and now load-bearing for a heavier feature. The <165 ms gate 007 must not regress is measured on the surface 007 does not touch; the surface it does touch is measured by nothing but the human gate.
6. **The `pnpm zip` <2 MB bound is on the extension zips; the Firefox run also emits `peekover-0.0.0-sources.zip` at 4.29 MB** (`progress.md:364-367`). Mermaid's source will grow that too. It is the AMO review archive, not a shipped package, and not the bound — recorded so a group-8 measurement does not report a false breach.
7. **A Dependabot mermaid bump strands every cached row.** The key includes `engineVersion` (D-3), so old rows are never hit again but occupy bytes until age or byte eviction reclaims them. Correct but wasteful right after an update — the purge-on-upgrade alternative is §8-2's question.
8. **No shared browser-test helper module.** `flush()`/`afterFrames()`/`waitFor()` duplicated across 6+ files; 007 adds more, and §3.5's geometry checklist is the thing retro finding 4 says belongs in it. Still carried, now with a second argument behind it.
9. **Carried, unfixed:** `scripts/perf-first-paint.ts` prints a false `FAIL` on the 1 MB fixture (`progress.md:356-360`).

## 5. Test strategy

- **jsdom unit:** `planDiagramWrite` (all three global sweeps; multi-bound simultaneity; single-oversized; `lastUsed` ordering vs creation ordering — the discriminator for D-4) · key construction and the theme/version components · `sanitizeSvg` against a hand-built hostile SVG corpus (`foreignObject`, `<use href>`, `<image href>`, `@import` in `<style>`, `on*`, `javascript:`, `data:` on `xlink:href`) · `buildStoredLines` with diagrams · the fence-detection predicate.
- **Real-engine (Chromium + Firefox), red-first and non-vacuous:**
  - **§3.5 row 2 + 3:** absent on the content-script reader, red-first by ungating.
  - **§3.5 row 4:** the `<figure>` **inside** `.peekover-reader`, the lightbox **outside** — each verified red by putting it on the wrong side.
  - **D-6's measurement window (row 22):** zero requests across import → render → sanitize → adopt → cache → re-theme → export, with the control fetch shown live **in the same test**, using the existing `/^https?:/i` predicate verbatim.
  - **D-7 red-first, and in the direction that matters:** an **OS flip under `auto`** re-themes every rendered diagram. This must go red against a build that subscribes to `onThemeSettingChange`, because that is the defect the decision exists to prevent.
  - **D-1's inherited global hook:** a `data:` `xlink:href` is stripped by `sanitizeSvg` — **and by a no-hook instance too**, because the denial is allow-list-driven (§2.2 AMENDMENT). Verified red by widening `SVG_ALLOWED_TAGS` to a `DATA_URI_TAGS` member, **not** by removing the hook, which reds nothing.
  - `DB_VERSION` 3→4 preserves existing rows (the gap 006 §3-4 identified in `idbVersionchange` and closed for itself).
  - clear-diagram-cache leaves folders/recents/pins/settings/snapshots/capture-flag intact; `wipeAll` erases diagrams.
  - a cache hit on an unchanged diagram during a **watch** re-render (§4's watch criterion, and the reason the cache is load-bearing).
  - all three §3.8 failures degrade to the visible source fence with the page intact — including **sanitize rejection**, the latest-moment case D-15 is shaped for.
  - §3.5 rows 5–21, at the widths the sibling suites use, **including the WIDE viewport** (finding 2's close-gate rule).
- **Pins every task:** `git diff tests/golden/output/` **EMPTY** — *and per the standing correction that proves nothing about the rendered diagram or its placement*, so §3.5 row 4's structural assertion is the actual guard · `tests/manifest.test.ts` green and **2975 B** · `permissions: []` on both built manifests · **the import fence:** `mermaid` in no content-script module graph, asserted statically **and** by md5-identical content-script bytes under ablation.
- **Revert-and-fail (retro finding 5) is the standard, not an option:** every regression test 007 produces is verified red **with the defect's own signature in the defect's own units**. The plan does not write the reverts; it states that a task that cannot produce one has not finished.
- **Measurement (not CI):** §7.
- **Human gate:** placeholder motion at 10 and 50 diagrams (D-11) · whether the control group reads as discoverable or as clutter · the touch-input consideration §3.11 carries, if a device is available · legibility of a dense diagram in the lightbox · Firefox everything (Playwright cannot load an extension into Firefox) · zero unexpected network with the Network tab open · **at least one WIDE viewport, recorded like an engine** (finding 2).

## 6. Group order

*Sequencing only. `tasks.md` at gate 3 owns decomposition, in a fresh session.*

Three hard constraints, all from the spec rather than convenience: **the dependency addition, the SBOM regeneration and the `pnpm audit --prod` gate move together** (§3.12) — group 1 is where a blocker surfaces or does not; **the whole trust correction lands in the same commit as the first cached SVG** (§3.9, D-14) — which is why group 4 is end-to-end rather than schema-then-wiring, the split that would ship `PERMISSIONS.md` announcing a cache nothing writes to; and **§3.5's audit precedes the first diagram browser test**, discharged above.

**1 · Foundation.** Add `mermaid`; verify licence, install scripts, single `dompurify`, `pnpm audit --prod` clean; regenerate the SBOM; prove the lazy chunk by ablation (§3-1's four outputs). *Touches:* `package.json`, `src/render/diagramEngine.ts`. *Must NOT touch:* any render or app module beyond the engine stub, `wxt.config.ts`, `tests/manifest.test.ts`. *Acceptance:* content-script bytes md5-identical; app-page delta decomposed and fully accounted; scanner green with its self-test firing. **Risk-heaviest group and deliberately first — every later group depends on the answer.**

**2 · The SVG sanitizer profile.** D-1, standalone and testable before anything produces an SVG. *Touches:* `src/render/sanitize.ts` (additive only). *Must NOT touch:* `ALLOWED_TAGS`/`ALLOWED_ATTR`/`SANITIZE_CONFIG`, `tests/golden/*`. *Acceptance:* the hostile corpus is neutralised; the inherited global hook is asserted, not assumed; the document profile's arrays are byte-identical.

**3 · Enhancer scaffolding.** D-6, D-12, D-15 — offscreen render, sanitize, inert re-parse, adopt, placeholder, per-fence degradation, and **the zero-network guard that gates the mechanism**. No cache. *Touches:* `diagramEnhancer.ts`, `diagramView.ts`, `readerPane.ts:179`, `appShell.ts:794`, `readerCss.ts`. *Must NOT touch:* `mount.ts`, `store.ts`, the content-script graph. *Acceptance:* §4's rendering and degradation criteria; §3.5 rows 2, 3, 4, 22; `mount.ts` diff empty.

**4 · The cache, end-to-end.** D-2, D-3, D-4, D-14 — schema, storage, eviction, panel line, clear control, **and the whole `PERMISSIONS.md` correction in the same commit**. *Touches:* `diagramCache.ts`, `store.ts`, `appShell.ts`, `storageControls.ts`, `PERMISSIONS.md`. *Acceptance:* §4's cache criteria; 3→4 preserves rows; the derived facts in the ledger are true again.

**5 · Theme sync.** D-7. *Touches:* `themeRegistry.ts`, the enhancer. *Acceptance:* §4's two theme criteria; the OS-flip-under-`auto` red-first; the §7-9 flip-cost measurement produced (not chosen from).

**6 · Systemic failure and degradation.** The two failures groups 3–5 could not reach: engine-load failure and storage-unavailable/upgrade-failure. *Acceptance:* §4's two engine/storage degradation criteria and the §4 Degradation clause.

**7 · Copy · download · lightbox.** D-15's re-derivation, §3.11's affordances, and the **empirical** re-proof of §3-6 on both engines. *Acceptance:* §4's four diagram-action criteria; §3.5 rows 5, 9–12, 15–21 — **including row 21's new focus-trap baseline**; `permissions: []` and 2975 B re-proven.

**8 · Measure.** §7's four measurement tasks. **Produces numbers; forbidden from choosing values.**

**9 · Human milestone-close gate + retro.** Including the §5 human-gate list, the recorded viewports, and **M7's floor-delta statement before any re-baseline is discussed** (retro finding 8 — the sentence that entry says M7 will read).

**§4 EARS coverage:** Rendering → 3 (+1 → 6, +content-script clause → 3) · Cache → 4 (+degradation clauses → 6) · Theme → 5 · Diagram actions → 7 · Trust → 1 (manifest/bytes), 3 (network), 4 (disclosure) · Degradation → 6. Every clause has at least one group.

## 7. Measurement plan (D-8 · D-9 · D-10 · D-11 · §7-9)

*Every task below is **forbidden from choosing a value**. Protocol for anything timed: **A-B-A against a same-session HEAD control, floor reported beside median** (finding 7), with the ablation as the firing control (finding 1).*

- **D-8 — cache bounds.** Outputs: rendered-SVG byte size across ≥6 representative diagram kinds (flowchart, sequence, class, state, ER, gantt/pie) at small and large sizes · total footprint of the 50-diagram fixture · accumulation over a realistic reading session · **and, for each of the three axes, whether it actually binds in practice** — an axis that never binds is chosen wrong (D-8's own revisit-when, inherited from 006).
- **D-9 — typical case.** Outputs: 1 / 3 / 10 / 50-diagram fixtures × {absolute wall-clock to all-visible-diagrams-resolved, time-to-first-diagram, per-diagram amortized cost}, **median and floor**, so the shape between the points is observed rather than assumed linear.
- **D-10 — package size.** Outputs: app-page chunk and `pnpm zip` (both engines) against **361,500 B** and **349,744 / 349,803 B**; content-script bytes against **315,671 B** (must be **0 delta**); the app-page delta **decomposed to sub-blocks with every byte accounted**. Note §4-6: the sources zip is not the bound.
- **§7-9 — theme flip at 50 diagrams.** Outputs: wall-clock to all-visible-diagrams-re-themed on the **first** flip (full miss) and the **second** (full hit) · whether the keep-previous-visible rule produces flicker · whether cache write-through during re-theme dominates the cost.
- **D-11 — placeholder motion.** A walk observation at 10 and 50 diagrams, plus the `prefers-reduced-motion` invariance which is a **test**, not a judgement.
- **First paint, no diagrams:** the <165 ms gate against **133.7 ms median / 132.1 ms floor**, A-B-A, **floor beside median**, plus **the floor-delta statement finding 8 requires before any re-baseline is even discussed.**

## 8. Gate-2 questions

1. **The revoke-exemption copy (D-5).** The mechanism is decided; the ledger sentence and the panel line are not. The honest version has to say that revoking a folder leaves cached renderings of that folder's diagrams on the device, and point at the one click that clears them. That is trust copy, and copy is yours.
2. **Should a `mermaid` version bump PURGE stranded cache rows, or let eviction reclaim them?** D-3 makes old-version rows unreachable but not immediately reclaimed (§4-7). My lean is **let eviction handle it** — a purge-on-upgrade is a write on a path that should be a read, and the age bound already covers it — but it means the first launch after a Dependabot bump carries dead bytes the panel will report, and a user reading that panel is entitled to an explanation. Worth a decision rather than a default.
3. **`docs/ai/architecture.md` is stale in a way that will mislead the next planner** (§0.2-3): it describes an `enhance` pipeline stage that does not exist and pre-dates every milestone. Correcting it is outside this plan's fence. Should M7 carry the correction, and if so at which group?
4. **A routing inconsistency in the spec's own text, surfaced not resolved:** §7-9 says the theme-flip cost, if bad, *"is a finding for gate 2"* — but the measurement cannot exist until group 5's code does, which is well past gate 2. This plan routes it to gate 3 with a named fallback (§1.3). Confirm that re-routing, or hold gate 2 open for a spike.

---

*Gate: this plan is a **DRAFT awaiting gate 2**. On approval, `tasks.md` — the ORDER — is the next artifact and the next gate, generated in a **fresh session** (C14). **No implementation code before `tasks.md` is approved** (WORKFLOW.md §5.3).*

*No spec amendments ride with this plan. The spec was found correct everywhere this plan checked it — including §3.3's fence seam, §3.5's profile requirements, §3.6's store enumeration and §5's baseline figures. The three corrections in §0.2 are to inherited briefing claims and to `architecture.md`, not to `spec.md`, which stays sealed.*
