# Tasks 007 — Mermaid diagrams + diagram cache (M7a) — check off in order; add discovered tasks BELOW the line they came from
*Gear 3 tasks stage — **DRAFT awaiting gate 3.** The human reviews these against the plan and either approves*
*or returns them with revisions. **No implementation code before this file is approved** (WORKFLOW.md §5.3).*
*Approved upstream: `spec.md` (gate 1, `e09520f`) + `plan.md` (gate 2, `c44406a`, approved with four*
*sub-decisions banked at `cab93c7`). One commit per task (`-F` heredoc, `Co-Authored-By: Claude` trailer); the*
*human reviews the pasted evidence and pushes. Each capability gets its OWN real-engine test*
*(`tests/browser/*`, Cr+Fx, red-first + non-vacuous) — never a trailing "add tests" task. Layout, rAF,*
*computed style, pointer geometry, bytes-on-wire, cross-context messaging **and an engine rendering into a***
***live container** are jsdom-**BLIND**: proven in the real engine, never in jsdom.*

**Locked by the gates — CITED, never re-argued. A task that re-opens any of these is a STOP-and-flag:**
- **spec §3.1–§3.12**, sealed at gate 1, with its three dispositions preserved by silence: standalone
  `.mermaid` files OUT (§3.4) · no content-script note (§3.2) · app-page-only **is** persona-#1 completion.
- **plan D-1 … D-16**, sealed at gate 2. Every task names the D-values it services.
- **the four gate-2 sub-decisions** (`cab93c7`): **(a)** the `PERMISSIONS.md` ledger row and the storage-panel
  line are already written — **4.3 applies them VERBATIM**, no re-authoring; **(b)** a `mermaid` version bump
  lets **eviction** reclaim stranded rows — **no purge logic in any task**; **(c)** the `architecture.md`
  correction lands in **group 9**, not group 3 or 4; **(d)** spec §7-9's flip-cost is *produced* by 5.2 and
  routed to gate 3 with plan §1.3's named fallback — 5.2 does not choose from it.
- **spec §6's IS-NOT list** is a fence: KaTeX/math · standalone diagram files · Graphviz/Vega/PlantUML ·
  diagrams in the diff view · dark-mode adaptation of images · F10 AI diagrams · compare-any-two-files ·
  agent-file awareness · table tools · Shiki / fence styling generally · Editor Mode · user-adjustable cache
  bounds · cross-device sync · generalising the lightbox to F5's · the SBOM release-attach fix. **No task
  proposes any of them.**

**Standing invariants — re-stated in EVERY task's Verify, because a preamble is not a mechanism (retro finding
9's own conclusion):**
- **Golden pin:** `git diff tests/golden/output/` **EMPTY**; 007 adds no golden fixture (plan §2 fences that
  directory). **THE CORRECTION OF RECORD: an empty golden diff proves NOTHING about a diagram or its
  placement** — that suite snapshots the pre-mount `sanitize(parse(source))` string, upstream of `mount()`, and
  D-15 leaves the source `<pre>` in it unchanged **by construction**. Placement is guarded by §3.5 row 4's
  **STRUCTURAL DOM assertion** — the sole guard, never a duplicate pin.
- **Manifest pin:** `tests/manifest.test.ts` green and **2975 B, byte-unmodified since `3b6c575`**;
  `permissions: []` on **both built manifests**; `web_accessible_resources` absent. A needed manifest edit is
  an AGENTS.md #4 event and a **hard stop**.
- **Content-script fence:** **0 delta vs 315,671 B, both engines** — total, so any growth is a breach, not a
  cost. Proven by **ablation and md5**, never by an identifier grep (the M6 retraction: a grep returning 0
  over a minified bundle returns 0 everywhere).
- **`mount.ts` is touched at ZERO sites** (D-12 seal) — asserted as an empty diff, not as an intention.
- **Byte-identical in every task:** `mount.ts` · `runReader.ts` · `mountReader.ts` · `contentWatch.ts` ·
  `parse.ts` · `isRenderableContext.ts` · `walkPolicy.ts` · `wxt.config.ts` · `tests/manifest.test.ts` ·
  `tests/golden/output/*` · `scripts/check-dynamic-imports.ts` · `.github/workflows/supply-chain.yml`.
- **Revert-and-fail (finding 5)** is the standard: every regression test verified red **with the defect's own
  signature in the defect's own units**. No revert-and-fail, task unfinished.
- **A positive control that FIRES (finding 1)**, named in the Verify line and asserted **in the same test**,
  under the same conditions the negative claim disclaims.
- **`cp` the target file aside BEFORE any red-first mutation; restore from the copy.** NEVER
  `git checkout <path>` while uncommitted task work lives in it (that destroyed group 4's paint gate in M4).
- **Two surfaces via `describe.each` EXCEPT where §3.2 collapses to one** — M7 is app-page-only, so most
  suites are single-surface, **but §3.5 row 2 asserts the INVERSE** and is a two-surface comparison.
- **No `ch` in any layout-blocking property** (`margin`, `padding`, `transform`); `max-width` is free (finding
  6) and resolves against `--reader-measure` (`readerCss.ts:83`, used at `:85`, `:570`). **CSS rationale lives
  in the doc comment ABOVE the template literal, never in the string** (finding 9) — the mechanism is a **byte
  check on the shipped CSS block** in the Verify line, not a reminder.
- **NUL check on any task that writes `SEP`:** `grep -c` on a shell-escaped NUL is **VACUOUS** in Git Bash
  (empty pattern, matches every line). Use `tr -d -c '\000' < f | wc -c` **and**
  `python3 -c "print(open(F,'rb').read().count(b'\x00'))"`. `SEP` is imported from `recents.ts:52`, never
  re-declared; its value is **the six visible characters backslash-u-0-0-0-0** — never the escape written out,
  never an embedded control byte.
- **`progress.md`'s Now-pointer advances PER TASK, in that task's own commit** (M1 rule, four recorded
  failures); group 9 is its final reconciliation. **Stage explicit paths — NEVER `git add -A` / `git add .`**

**Human-run items budgeted UP FRONT (plan §5, not discovered late) — enumerated in 9.1's Verify, not
rediscovered there:** D-11's placeholder motion at 10 and 50 diagrams · control-group discoverability ·
lightbox legibility · §3.11's touch-input consideration · **Firefox everything** · zero unexpected network with
the Network tab open · **at least one WIDE viewport, recorded like an engine** (finding 2). **Plus one human
decision gate:** 8.4, the bound values and the typical-case target.

---

## 1 — Foundation (risk-heaviest and deliberately first — every later group depends on its answers)

- [ ] **1.1 Add `mermaid`; the four supply-chain gates that move with it (§3.12).** `dependencies` four →
      **five**, nothing else. Verified against the package, not from memory: permissive licence, **no install
      scripts**, transitive production tree enumerated. **`pnpm audit --prod --audit-level low` is BLOCKING**
      (`supply-chain.yml:83-84`) and the prod tree is clean at 0 — a new advisory is **a blocker to resolve,
      not a threshold to relax**, and it can only surface here. **Plan §4-3 is a gate on this task:** if
      `mermaid`'s `dompurify ^3.3.3` does not dedupe with our `^3.4.12`, the bundle carries two DOMPurify
      instances and D-1's global hook covers only one — a silent hole in the `data:` deny. Regenerate the SBOM
      (`scripts/generate-sbom.ts` → `sbom.cdx.json`, untracked; **the workflow file is NOT edited**). Plan §4-2
      is recorded, not acted on: `katex` arrives transitively and **math stays on §6's IS-NOT list**.
      Files: `package.json` · `pnpm-lock.yaml`
      Verify: `dependencies` is **exactly five** (asserted, not eyeballed); licence + install-script result per
      component; `pnpm audit --prod --audit-level low` **EXIT=0** pasted; **`pnpm why --prod dompurify`
      resolves to exactly ONE version across the production tree** — the transitive-aware form, because D-1's
      dedupe gate concerns a *transitive* second copy that a depth-0 `pnpm list --prod dompurify` cannot
      surface (that form is insufficient and is not used); firing control (finding 1): the same `pnpm why`
      shape against a package known to carry TWO versions (e.g. `esbuild` in the full tree) must show both,
      proving the query can distinguish — so a one-version dompurify result is a genuine
      singular, not a blind query; SBOM component count + licence
      roll-up recorded. `pnpm lint` EXIT=0 · unit **549** unchanged · Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` both engines · `wxt.config.ts` byte-identical (D-16). [§3.12; plan §4-2/3/4]

- [ ] **1.2 `diagramEngine.ts` — the ONE importer, the literal specifier, the feature-detect gate (D-13).**
      One module owning `import('mermaid')` as a **static string literal** — the shape
      `check-dynamic-imports.ts:302`'s MUST_NOT_FIRE fixture sanctions, so the scanner stays green **because
      the rule permits it, not because the rule is avoided**; **007 is the first code to exercise that rule.**
      Behind §4's feature-detect: no `language-mermaid` fence ⇒ the import is **never evaluated**. D-6 step 3's
      configuration lives here (`securityLevel: 'strict'` — not `'sandbox'` · `htmlLabels: false` · no icon
      packs). The engine's **own exported version** is read at runtime for D-3's key, **never a hardcoded
      constant**. Imported by nothing yet.
      Files: `src/render/diagramEngine.ts` · `src/render/diagramEngine.test.ts`
      Verify: (**unit**) the feature-detect returns false on a fence-free document and the loader is **not
      invoked** — assert the injected loader's **call count**, since an un-called spy and a missing spy look
      identical; the version accessor reads the engine's export. `scripts/check-dynamic-imports.ts` **EXIT=0**
      AND `--self-test` **still fires** — control: a deliberately-computed specifier in a scratch fixture
      (outside `src/`, deleted in the same task) must go **RED**. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []` · scanner + workflow byte-identical. [D-13; §5 dynamic-import; plan §3-1(d)]

- [ ] **1.3 THE ABLATION — prove the lazy chunk, with plan §3-1's four outputs and every byte accounted.**
      Chunking has **never been exercised** (zero dynamic imports in `src/` today), so it is measured before
      anything depends on it. `diagramEngine.ts` is unreachable from any entrypoint at 1.2, so the ablation
      needs a **scratch** app-page reference in `appShell.ts`: build → measure → remove → rebuild. **`cp
      appShell.ts` aside FIRST; the scratch reference is never committed and the restored file must be
      md5-identical.** Outputs: **(a)** content-script bundle **md5-identical** to the pre-import build, both
      engines — *byte-identical means it was never there*; **(b)** app-page delta **decomposed to sub-block
      accounting, every byte assigned** (engine · glue · CSS · anything shipped that should not be); **(c)** the
      emitted chunk named and reachable; **(d)** scanner green with its self-test firing. **Different chunking
      behaviour than §3.2 assumes is a STOP-and-flag finding, not a quiet re-scope.**
      Files: no source commit — measurements into the task report + `docs/ai/progress.md` (numbers only)
      Verify: (a)'s md5 pasted for both engines **with the negative control in the same run** — the app-page
      chunk, which indisputably *does* gain bytes, must show a non-zero delta; a measurement reading 0 on both
      sides discriminates nothing. (b) sums to the observed delta **exactly**, residual named not rounded away.
      (c) filename recorded. (d) EXIT=0 + self-test output pasted. `appShell.ts` restored **md5-identical**. No
      threshold asserted — 8.1 owns the production-wired figure. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [plan §3-1; §5 content-script NFR; finding 1]

## 2 — The SVG sanitizer profile (D-1 — standalone and testable before anything produces an SVG)

- [ ] **2.1 `sanitizeSvg()` — a SECOND exported function, allow-list as DATA, hostile corpus red-first.**
      New exported `SVG_ALLOWED_TAGS` / `SVG_ALLOWED_ATTR` / `SANITIZE_SVG_CONFIG` + `sanitizeSvg(svg)`,
      honouring `sanitize.ts:5-10`'s stated discipline. **`ALLOWED_TAGS` (`:22-37`), `ALLOWED_ATTR` (`:61-65`)
      and `SANITIZE_CONFIG` (`:107-117`) stay BYTE-UNTOUCHED** — markdown source still cannot produce an
      `<svg>`. `ALLOWED_URI_REGEXP` is `/^#/`, **stricter** than the document profile's `:85-86`;
      `foreignObject` is denied **by absence**, not a FORBID list (`:8-10`); `ALLOW_ARIA_ATTR: true` is the one
      deliberate divergence from `:113` and is stated in the doc comment beside it.
      Files: `src/render/sanitize.ts` · `src/render/sanitize.test.ts`
      Verify: (**unit**, red-first) the hostile corpus is neutralised — `<foreignObject>`, `<use href>`,
      `<image href>`, `@import` in `<style>`, `on*`, `javascript:`, and an external `xlink:href` — **each case
      red before the profile exists, with the failure naming the surviving node**, not a bare boolean.
      **Revert-and-fail:** adding the single entry `foreignObject` to `SVG_ALLOWED_TAGS` reds exactly that case
      and nothing else — the count is the check, not the colour. The three document-profile consts asserted
      **byte-identical** by a source-text pin, so a future widening cannot pass silently. Golden EMPTY ·
      manifest green **2975 B** · `permissions: []`. [D-1; §3.5; §3.10]

- [ ] **2.2 The INHERITED global hook — asserted, not assumed (real-engine, Cr+Fx).** `sanitize.ts:131-135`
      registers `uponSanitizeAttribute` on the **shared DOMPurify singleton**, so it fires for `sanitizeSvg`
      too, and `URL_ATTRS` (`:89`) already carries `xlink:href`. **That is inherited global-singleton
      behaviour — exactly what a future `removeHook` breaks silently in a file nobody thought they were
      touching** — so it is pinned by test, in both engines, against the real DOMPurify build.
      Files: `tests/browser/diagramSanitize.browser.test.ts` · `src/render/sanitize.test.ts` (unit mirror)
      Verify: (**tests/browser** — Cr+Fx) a `data:` URI on `xlink:href` does **not** survive `sanitizeSvg`;
      **revert-and-fail: remove the hook registration and the assertion reds naming the surviving `data:`
      value**, not "expected true". Non-vacuous control in the same test: a `#fragment` on the same attribute
      **does** survive, so the assertion is not passing because everything was stripped. Plan §4-3's second
      half: the hook fires through `sanitizeSvg` **regardless of how `dompurify` resolved** at 1.1. `cp
      sanitize.ts` aside; restored byte-identical. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-1; §3.10; plan §4-3]

## 3 — Enhancer scaffolding (D-6 · D-12 · D-15 — no cache yet)

*Plan §3.5's 23-row sibling-checklist audit is a **discharged plan deliverable**; this group CONSUMES it, and*
*no diagram browser test is written before the row it discharges is read from it. Routing: **row 4** (the*
*INVERTED assertion) + **rows 2, 3** (content-script inverse, red-first by ungating) + rows 5, 18 → **3.1** ·*
***row 22** (zero-network with a control that fires) → **3.3** · **row 21** (focus trap and restore — NO*
*sibling suite exists, so 007 establishes the baseline) + rows 4b, 8–10, 12, 16, 19 → **7.2** · rows 7, 11,*
*14–17, 20 → **7.1** · row 19's placeholder half → **8.3** · rows 1, 6, 13, 23 inherited or out per the audit.*

- [ ] **3.1 The synchronous prologue + D-15's structure + D-12's two call sites.** Fence detection over
      `pre > code.language-mermaid`, reading **`textContent`, never markup**; a placeholder `<figure>` inserted
      as a **sibling** of the source `<pre>`, which is **HIDDEN, never removed** — degradation is the default
      state and success is the mutation (`readerMode.ts`'s `ensureRawView`/`setReaderMode` mechanism, **`:69-84`
      at HEAD — the plan's `:60-80` is one block early, corrected here rather than propagated**). Invoked
      from **both** app-page mount paths: `readerPane.ts:179` (verified at HEAD) and the `render` closure
      `appShell.ts:794` passes into `createWatchController` (verified at HEAD: it passes **no** `render` today;
      `watchController.ts:449` is the seam that consumes it). **`contentWatch.ts:121` passes no `render` and is
      not touched — that is the fence.** Diagram tokens + the visibility rule in `readerCss.ts`.
      Files: `src/render/diagramEnhancer.ts` · `src/render/diagramView.ts` · `src/app/readerPane.ts` ·
      `src/app/appShell.ts` · `src/theme/readerCss.ts` · `src/render/diagramEnhancer.test.ts` ·
      `tests/browser/diagramRender.browser.test.ts`
      Verify: (**unit**) the fence predicate matches `language-mermaid` and not `language-js` or a bare
      `<code>`. (**tests/browser** — Cr+Fx) **§3.5 row 4, the audit's main finding, and it INVERTS:** the
      `<figure>` is asserted **INSIDE `.peekover-reader`** — four sibling suites assert the opposite direction
      and transcribing them unexamined produces a wrong test — **verified red by placing it outside, at which
      point the golden diff stays EMPTY**, which is precisely why this assertion exists. **Rows 2 + 3:** the
      content-script reader leaves the fence a code fence with **no affordance and no note** while the app page
      grows one, as a two-surface comparison; **red-first by ungating the enhancer so it appears on the content
      script (1 thing red), proving the gate is the module graph and not an accident.** Row 18: placeholder
      hidden from AT. Row 5: the figure does not occlude the column's **text** at a WIDE viewport. The source
      `<pre>` is present-but-hidden after success (both halves). **CSS byte check:** the shipped `READER_CSS`
      delta stated and accounted; no `ch` in `margin`/`padding`/`transform`. Golden EMPTY · **`mount.ts` diff
      EMPTY** · manifest green **2975 B** · `permissions: []`. [D-12, D-15; §4 rendering; rows 2, 3, 4, 5, 18]

- [ ] **3.2 D-6 — offscreen live container, string return, inert re-parse, adoption.** `mermaid.render()`
      returns `{ svg, bindFunctions }` where **`svg` is a string**. We pass **our own** container so we own its
      lifetime (removed on our own `finally`), CSS context and teardown; **it is LIVE and in-document by
      necessity** (D-6 step 2). **Adoption is `mount.ts:131-133` verbatim:** `sanitizeSvg(svg)` → a
      `<template>`'s `innerHTML` (parsed inert) → adopt `tpl.content`. Never `innerHTML` on a live element,
      never a move of the engine's nodes, and **`bindFunctions` is NOT called**. Per-fence try/catch to the
      D-15 degraded state, so one fence's failure never reaches another.
      Files: `src/render/diagramEnhancer.ts` · `src/render/diagramEngine.ts` · `src/render/diagramView.ts` ·
      `tests/browser/diagramRender.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) a fence renders to an adopted `<svg>` inside the figure; **the
      engine's container is gone afterwards** — assert its absence **and** that it existed mid-render, since an
      empty tail is not an empty instrument; **`bindFunctions` never called** (spy, with a control proving the
      spy would have recorded a call); the adopted subtree contains no `foreignObject`. §3.8's parse/render
      failure **and sanitize rejection** — the latest-moment case D-15 is shaped for — each leave that fence as
      its **visible** source `<pre>` with an inline marker while **every other diagram renders normally**;
      **revert-and-fail: remove the per-fence catch and one bad fence takes the document's whole enhancement
      down, naming the count of unrendered figures.** Mermaid's own error graphic is suppressed. Golden EMPTY ·
      **`mount.ts` diff EMPTY** · manifest green **2975 B** · `permissions: []`.
      [D-6, D-15; §3.8; §4 rendering + degradation]

- [ ] **3.3 ★ THE ZERO-NETWORK GUARD ON D-6's MEASUREMENT WINDOW (row 22) — it GATES the mechanism, it does
      not report on it.** Between "container is live" and "artifact is sanitized" a remote reference **emitted
      by the engine during measurement** would fetch before we ever serialize. Configuration closes the known
      routes and the profile closes the adopted artifact; **neither closes the window by construction**, and
      **jsdom cannot see it — it loads no subresources** (`mount.ts:119-129`'s standing lesson).
      Files: `tests/browser/diagramNetwork.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **zero requests** across import → render → sanitize → adopt, using
      the existing `/^https?:/i` predicate **verbatim**, never a new one. **The control fires under the same
      conditions the negative claim disclaims, in the SAME test:** a diagram whose source references a remote
      image, observed **during** the live measurement window — `remoteMedia.browser.test.ts:83-92`'s
      `awaitFetchedUrls` shape extended to this window; **if the control does not fire the negative result is
      worth nothing and the task is unfinished** (finding 1). A request observed here is a STOP-and-flag
      against AGENTS.md #1, not a tuning item. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-6's named residual hole; §3.10; row 22; §4 trust]

- [ ] **3.4 The cooldown constraint and the import fence, asserted rather than assumed.** `watchController`
      times its whole synchronous block to set a cost-proportional cooldown (`:422`), so **the enhancer must
      schedule its work and return synchronously in ~nothing** or every diagram-bearing watched document gets
      an inflated cooldown. And the module must be reachable from the **app-page graph only** — `readerPane.ts`
      is imported by `appShell.ts` alone and the watch closure is built there, so the three modules the content
      script traverses never learn the enhancer exists.
      Files: `src/render/diagramEnhancer.test.ts` · `tests/browser/diagramRender.browser.test.ts` · a static
      import-graph pin in `diffEngine.test.ts`'s source-text-allowlist shape (the **architectural** proof the
      M6 retraction left standing)
      Verify: (**unit**) the enhancer returns before any async work resolves — assert the synchronous return
      **and** that the placeholder is already in the DOM at that instant (§4's pre-paint half).
      (**tests/browser** — Cr+Fx) a watch re-render **re-enhances** (§3.3: `replaceChildren` destroys rendered
      diagrams every mount), driven through the **production** path (`installWatchForFile`), never a hand-built
      controller. (**static**) `mermaid` / `diagramEngine` / `diagramEnhancer` appear in **no** content-script
      module graph — with the control: the app-page graph, which must show them. **`mermaid` in the
      content-script bundle = the fence broke and §3.2 with it, STOP-and-flag.** Golden EMPTY ·
      **`contentWatch.ts` + `mount.ts` byte-identical** · manifest green **2975 B** · `permissions: []`.
      [D-12, D-13; §3.2; §3.3]

## 4 — The cache, END-TO-END (D-2 · D-3 · D-4 · D-14)

*No schema-then-wiring split: D-14 and §3.9 bind the whole trust correction to the same commit as the first*
*cached SVG, and the split would ship `PERMISSIONS.md` announcing a cache nothing writes to. 4.1–4.2 store*
*nothing; **4.3 is the irreducible caching commit**; 4.4 verifies behaviour.*

- [ ] **4.1 `diagramCache.ts` — the pure layer: D-3's key and D-4's `planDiagramWrite`. Wired to nothing.**
      **Key (D-3):** `hash + SEP + theme + SEP + engineVersion` as the keyPath value — forced, because
      `IdbSchema` allows one `keyPath` and no compound keys while §3.7 requires **both renderings to coexist as
      rows**. `hash` = SHA-256 of the fence text via `crypto.subtle.digest`, hex (greenfield — nothing in
      `src/` hashes anything today); `theme` = the **EffectiveTheme**, never the `ThemeSetting` (`'auto'`
      renders as two different things); `engineVersion` = 1.2's runtime read. **`SEP` imported from
      `recents.ts:52`, never re-declared. ★ NUL CHECK.** **Eviction (D-4):** a **sibling** `planDiagramWrite` —
      **not** a generalisation of `planSnapshotWrite` (`snapshots.ts:170-240`), named so it is not "tidied up"
      into a shared helper later, the change that would silently give this cache a per-document count it has no
      document to be per-. All three bounds **GLOBAL**, evicting **oldest-first on `lastUsed`** (not
      `createdAt`, which would evict the light rendering of the diagram being read right now); a hit
      **touches** `lastUsed`. Single-oversized short-circuit in `snapshots.ts:178-181`'s structure, disposition
      **skip the cache, re-render every time, degrade quietly** — no user-facing message. `bytesOf` **imported
      from `snapshots.ts:126-128`**, never re-implemented. **Bound VALUES are PROPOSED as named tuneable
      constants with reasoning; this task is FORBIDDEN from treating them as chosen** — 8.4 is the gate (D-8).
      Files: `src/app/diagramCache.ts` · `src/app/diagramCache.test.ts`
      Verify: (**unit**, red-first) all three global sweeps; **multi-bound simultaneity** (the store is within
      **all three** afterwards); single-oversized refused with **no** eviction; **`lastUsed` vs creation
      ordering is the DISCRIMINATOR for D-4** — a fixture where the two orderings evict **different rows**, so
      a `createdAt` implementation reds on named rows, not on a count; keys round-trip and **two themes of one
      diagram coexist as two rows** (§3.7, asserted directly). **★ NUL count reads ZERO via `tr -d -c` AND the
      python count**; the `grep -c` form is vacuous and is not used. No bound treated as chosen (a chosen bound
      here = STOP and flag). Golden EMPTY · manifest green **2975 B** · `permissions: []`. [D-3, D-4, D-8; §4 cache]

- [ ] **4.2 Schema — `DB_VERSION` 3 → 4, two stores, rows preserved across the upgrade.** Append `diagramMeta`
      (keyPath `key`, `{key, bytes, lastUsed}`) and `diagrams` (keyPath `key`, `{key, svg}`) to `SCHEMA`
      (`store.ts:105-117`); bump `DB_VERSION` (`:47`). **Two stores, not one (D-2):** `getAll` documents its own
      assumption — *"small bounded stores — no cursor needed"* (`idbCore.ts:116-119`) — and `describeStored()`
      materialises whole stores, so an inline SVG means **every trust-panel open deserialises every cached
      diagram**. Additive-by-name, **no migration code** (`idbCore.ts:56-63`); `onversionchange` already covers
      the bump. The design **does not trip `idbCore.ts:5-9`'s STOP signal** — no index, no compound key, no
      cursor, no new `idbCore` function — and **`idbCore.ts` is not touched**. **This task STORES NOTHING.**
      Files: `src/app/store.ts` · `src/app/store.test.ts` · `tests/browser/idbVersionchange.browser.test.ts`
      Verify: (**unit**) both stores in `SCHEMA` at version 4 with correct keyPaths. (**tests/browser** — Cr+Fx)
      seed a **v3** DB with rows in the six existing stores, open at **v4**, assert **the existing rows
      survive** and the two new stores are present and empty — **red-first: a `SCHEMA` that drops or renames an
      existing store reds the row-survival assertion** (006 §3-4's gap, re-closed for this bump).
      `idbCore.ts` byte-identical. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-2; §3.6; §5 storage]

- [ ] **4.3 ★ THE CACHING COMMIT — first cached SVG + EVERY trust surface + the WHOLE `PERMISSIONS.md`
      correction, ONE commit (HARD constraint, D-14 / §3.9's "never a follow-up"). THIS TASK DOES NOT SPLIT.**
      - **Cache reaches the enhancer:** `cacheGet(key) ?? renderAndCache(...)`, `planDiagramWrite` on write,
        `lastUsed` touched on hit. **Deletion ordering META FIRST, then content** — a meta row pointing at
        missing content is a **miss**, re-rendered, self-reclaiming; bytes are briefly over-reported, **never
        under**. **Not atomic** (`idbCore.ts:97-109`); a multi-store transaction helper would be the STOP
        signal and is not added. **★ NUL CHECK (writes `SEP`).**
      - **`StoredSummary` (`store.ts:357-388`) gains a REQUIRED `diagrams: {count, bytes}`** — required for the
        reason the file gives twice: *a future summary literal that forgets the field fails to compile*. **This
        BREAKS THE BUILD at `appShell.ts:562`'s duplicated `EMPTY_SUMMARY`, which is intended**, not an
        obstacle to route around.
      - `buildStoredLines` (`:411-469`) gains a line, **reusing `humanBytes` (`:398`)**; `describeStored`
        (`:477`) reads **`diagramMeta` only** (D-2); `wipeAll` (`:298-305`) gains two `clear()` calls; a new
        **`clearDiagramCache()`** beside `eraseSnapshots()` (`:331-334`) clears the two diagram stores **and
        nothing else**; `storageControls.ts` gains a **third** control beside `:241-280`'s, in its
        `disabled`-at-zero + inline-confirm shape, wired on `appShell.ts`'s existing pattern.
      - **The panel line is `decisions.md` `cab93c7` (a)'s wording applied VERBATIM** —
        `Diagrams cached: N rendered (~size) — Clear diagram cache`, one line beneath the snapshot disclosure.
        **Not re-authored at implementation time.**
      - **`PERMISSIONS.md`: the ledger row applied VERBATIM from `cab93c7` (a)** — all five columns in the
        file's header order (`:37`), on the snapshot row's precedent (`:46`), including D-5's revoke-exemption
        sentence. **PLUS the derived facts that go stale, enumerated rather than left as "add a row":** `:42`
        reads *"**six** stores at `DB_VERSION` 3"* and *"clears **all six** stores"* — **both false at
        `DB_VERSION` 4 with eight** — and the heading (`:31`) with its parenthetical (`:33-35`) enumerates the
        capability list. **No `folderIds[]` index** and **no purge-on-version-bump logic** (gate-2 (b)).
      Files: `src/render/diagramEnhancer.ts` · `src/app/diagramCache.ts` · `src/app/store.ts` ·
      `src/app/appShell.ts` · `src/app/storageControls.ts` · `docs/trust/PERMISSIONS.md` ·
      `src/app/store.test.ts` · `src/app/appShell.test.ts` · `tests/browser/diagramCache.browser.test.ts` ·
      `tests/browser/wipe.browser.test.ts`
      Verify: (**unit**) `buildStoredLines` renders the diagram line through `humanBytes`; the `EMPTY_SUMMARY`
      compile break is **observed and then fixed**, recorded as evidence the forcing function works.
      (**tests/browser** — Cr+Fx) a second render of the same source + theme + engine version is served **from
      cache with the engine NOT invoked** — non-vacuous: the first render **did** invoke it, same test;
      changing **any one** component renders afresh (three cases, one per component — D-3's discriminator).
      **"Clear diagram cache" erases every cached diagram and leaves folders / recents / pins / settings /
      snapshots / the capture flag INTACT** — assert each survivor **and** that a diagram existed before the
      clear; **red-first: a control that also clears a non-diagram store reds the corresponding survival
      assertion (1 thing).** `wipeAll` erases diagrams and the panel then reports none. **★ NUL count ZERO
      (both reliable methods).** Ledger row and panel line **diffed against `cab93c7` (a) for verbatim
      equality**; `PERMISSIONS.md:42`'s two derived facts true again. Golden EMPTY · **`mount.ts` diff EMPTY** ·
      manifest green **2975 B** · `permissions: []` both engines.
      [D-2, D-3, D-4, D-5, D-14; gate-2 (a), (b); §3.9; §4 cache + trust]

- [ ] **4.4 The cache under WATCH — the case it exists for — and the quiet single-oversized path.** §3.3's
      *every re-render re-enhances* is what makes the cache load-bearing rather than an optimisation: an agent
      editing prose **around** an unchanged diagram must produce a **hit**, through the real
      `watchController.ts:449` seam. §4's *render normally without caching, not as a blocking error* is
      exercised here for the oversized case; 6.2 covers storage-unavailable.
      Files: `tests/browser/diagramCache.browser.test.ts` · `src/app/diagramCache.test.ts`
      Verify: (**tests/browser** — Cr+Fx, production path) a watched document whose prose changes but whose
      diagram source does not serves that diagram **from cache on the re-render** — non-vacuous: the engine
      **is** invoked for a diagram whose source *did* change, same test; **revert-and-fail: bypass the lookup
      and the hit assertion reds naming the extra engine invocation.** A single SVG over the whole byte bound
      is **not stored, evicts nothing, renders normally, and surfaces NO user-facing error** — assert the
      absence of any marker **and** the presence of the rendered figure, since an absent error and an absent
      diagram look identical otherwise. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-4; §3.3; §4 cache + degradation]

## 5 — Theme sync (D-7)

- [ ] **5.1 The re-theme trigger is a NEW notification at `applyTheme()` — NOT `onThemeSettingChange()`, and
      the red-first is the defect the decision exists to prevent.** The obvious seam is wrong for the reason
      its own doc comment gives (`reader.ts:108-112`): *an OS flip under `auto` changes what paints but NOT
      what the user picked, so it deliberately does not notify.* §4 requires re-theming **when the effective
      theme changes** and `DEFAULT_SETTINGS.theme` is `'auto'` — so the setting channel leaves every diagram
      stale on an OS dark-mode flip **in the default configuration**. `applyTheme(effective)`
      (`themeRegistry.ts:67-72`) is the one broadcast every effective-theme change goes through; the listener
      sits beside `themeHosts` (`:34`), fires after the attribute writes, and is pruned by the module's
      documented `isConnected` discipline. **Additive: `applyTheme`'s existing behaviour is pinned red-first
      BEFORE the listener lands.** Re-theming re-keys, looks up, renders on a miss and **swaps only when the
      replacement is ready** — §4's keep-previous-visible is satisfied by D-15's structure for free, because
      the old `<figure>` is **replaced**, not emptied.
      Files: `src/theme/themeRegistry.ts` · `src/theme/themeRegistry.test.ts` ·
      `src/render/diagramEnhancer.ts` · `tests/browser/diagramTheme.browser.test.ts`
      Verify: (**unit**) `applyTheme`'s pre-existing behaviour pinned **before** the listener (the control for
      "additive"); dead hosts pruned. (**tests/browser** — Cr+Fx) **an OS flip under `auto` re-themes every
      rendered diagram, and this MUST go RED against a build subscribing to `onThemeSettingChange`** —
      revert-and-fail, with the failure naming the stale diagram's theme attribute, not a bare boolean; a
      diagram is **never blank** during the swap (assert a rendered `<svg>` present at every observed frame,
      not merely at the end); the second flip in either direction is a **cache hit** (§3.7's round trip,
      through the real store). `cp themeRegistry.ts` aside; restored byte-identical. Golden EMPTY · manifest
      green **2975 B** · `permissions: []`. [D-7; §3.7; §4 theme]

- [ ] **5.2 MEASURE the theme-flip cost at 50 diagrams — PRODUCES NUMBERS; FORBIDDEN FROM CHOOSING VALUES.**
      §3.7's first flip is a full miss on **every** diagram at once. Per gate-2 **(d)** the measurement is
      produced here and **routed to gate 3**, not gate 2 — the spec's own routing was timing-inconsistent
      because the measurement cannot exist until this group's code does. **The named fallback is plan §1.3's
      progressive visible-first re-render: a gate-3 revisit-when, NOT a re-scope, not implemented here.**
      Files: measurement notes into the task report + `docs/ai/progress.md` (numbers only, nothing chosen)
      Verify: wall-clock to all-visible-diagrams-re-themed on the **first** flip (full miss) and the **second**
      (full hit) · whether keep-previous-visible produces flicker · whether cache write-through during
      re-theme dominates. **A-B-A against a same-session HEAD control, floor beside median** (finding 7).
      **Produces numbers; forbidden from choosing values** — a chosen value or an implemented fallback here is
      a STOP-and-flag. Red-first does not apply (asserts no behaviour) — stated plainly, not manufactured.
      Golden EMPTY · manifest green **2975 B** · `permissions: []`. [§7-9; gate-2 (d); plan §1.3, §7]

## 6 — Systemic failure and degradation (the two failures groups 3–5 cannot reach)

- [ ] **6.1 Engine-load failure — every fence stays a code fence, and the page is never blank.** §4: *if the
      engine cannot be loaded at all, render every diagram block as a code fence and never blank the page.*
      D-15 makes this the **default state** rather than a recovery path; this task proves it.
      Files: `src/render/diagramEnhancer.ts` · `tests/browser/diagramDegrade.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) with the dynamic import forced to reject, **every** fence remains a
      **visible** source `<pre>`, the text is fully readable, the reader interactive, and **no placeholder is
      left stranded** (assert placeholders resolved or removed, not merely that the page is non-blank).
      **Revert-and-fail: remove the load-failure catch and the assertion reds naming the stranded placeholders
      and the hidden `<pre>`s** — the defect's own units. Non-vacuous control in the same test: with the import
      succeeding, the same fixture **does** render figures. Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-15; §3.8; §4 rendering + Degradation; AGENTS.md #5]

- [ ] **6.2 Storage unavailable / upgrade failure — render on, cache off, and SAY so rather than fail
      silently.** §4's two storage clauses, and the distinction between them is the point: an unreadable/
      unwritable cache degrades **quietly**; a schema that cannot be opened or upgraded must **say** caching is
      unavailable.
      Files: `src/app/diagramCache.ts` · `src/app/appShell.ts` · `tests/browser/diagramDegrade.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) with the DB open rejecting, diagrams **still render** and the
      caching-unavailable state is **stated in words** (structural assertion on the text, not colour alone);
      with a write rejecting, the diagram renders and **no blocking error surfaces** — assert the absence of
      any modal/alert **and** the presence of the figure. **Revert-and-fail on both halves, each reddening a
      different case** — the count is the check. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§4 cache degradation; §3.8; AGENTS.md #5]

## 7 — Copy · download · lightbox (§3.11 — and the EMPIRICAL re-proof that neither needs a permission)

- [ ] **7.1 The per-diagram control group — copy-as-image and download-as-SVG, re-derived from the retained
      source.** Revealed on hover **and on keyboard focus**; **not** a right-click context menu (`contextMenus`
      is a manifest permission, and hijacking the browser's own menu inside a reader is hostile besides).
      D-15's retention is what makes this cheap — both actions re-derive from the source fence with **no second
      copy and no cross-mount state**. The group is **rebuilt every mount** (§3.3), so its handlers must reach
      the **current** figure (row 14's property, which applies even though the registry idiom does not).
      Files: `src/render/diagramView.ts` · `src/theme/readerCss.ts` ·
      `tests/browser/diagramActions.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) both actions keyboard-reachable, real `<button>`s with **no
      `tabindex` of their own** (row 16); accessible names carrying **selection AND action** (row 17); state in
      **text and `aria-*`, not colour alone** (row 15); the group **anchors to its own diagram, not the
      viewport** (row 11), **does not occlude the column's text at a WIDE viewport** (row 5), and clears the
      conditional chrome — network indicator and remote-load pill (row 7); after a watch re-render the rebuilt
      handlers act on the **current** figure (row 14) — **revert-and-fail by capturing the figure in a closure,
      which reds naming the stale node.** §4's action failure: a failing copy **says so** through a polite live
      region **out of the a11y tree while empty** (row 20), leaving the diagram intact. **CSS byte check** on
      the shipped block; no `ch` in layout-blocking properties; **no new global single-key shortcut**
      (asserted). Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§3.11; §4 diagram actions; rows 5, 7, 11, 14–17, 20]

- [ ] **7.2 The lightbox — and row 21, where NO SIBLING SUITE EXISTS and 007 establishes the baseline.** Opens
      by activating the diagram (pointer **or** keyboard), closes on **Escape**, **no new global bare key**
      (006 D-7's rule). §5 requires trap **and restore** of focus — and per the audit **no existing element in
      this codebase traps focus, so there is nothing to transcribe from and nothing would be noticed missing.**
      That absence is the signal; this task builds the baseline. `storagePanelOverlay.browser.test.ts` is the
      **only** baseline for the out-of-flow properties.
      Files: `src/render/diagramView.ts` · `src/theme/readerCss.ts` ·
      `tests/browser/diagramLightbox.browser.test.ts`
      Verify: (**tests/browser** — Cr+Fx) **row 21, the new baseline:** Tab from the last focusable element
      inside the open lightbox lands on the **first** (asserted as an actual focus move, not an attribute), and
      closing **restores focus to the trigger** — **revert-and-fail: remove the trap and focus escapes to the
      document behind, naming the element it landed on.** Row 10: out of flow, **the page under it does not
      move** (rects before/after, `storagePanelOverlay:121,135,145`'s shape); row 12: closing returns the slot
      to **zero footprint**; rows 8 + 9: the open overlay clears the TOC rail, the mode toggle and the
      conditional chrome; **row 4's other half — the lightbox asserted OUTSIDE `.peekover-reader`, a SIBLING**,
      verified red by putting it inside; row 19: the zoom animates without `prefers-reduced-motion` and is
      **instant under it** (the "does animate" half is what makes it non-vacuous); row 16: the trigger is a
      real `<button>`. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§3.11; §5 a11y; rows 4, 8–12, 16, 19, 21]

- [ ] **7.3 §3-6 RE-PROVEN EMPIRICALLY ON BOTH ENGINES — a doc read is not a build.** The plan resolved from
      current official documentation that `clipboardWrite` is **not required** for a click-triggered
      `navigator.clipboard.write()` and that `downloads` gates the `chrome.downloads` **API** only, while
      `<a download>` on a `blob:` URL is plain web platform. **That is a documentation finding; this task is
      the build.** If either action needs a manifest permission that is an **AGENTS.md #4 event and a hard
      stop**; `web_accessible_resources` remains a forbidden key.
      Files: `tests/browser/diagramActions.browser.test.ts` · measurement notes into the task report
      Verify: (**tests/browser** — Cr+Fx) a real click **writes an image to the clipboard** and a real click
      **downloads an SVG**, in the loaded build — not stubbed, not simulated; both engines' built manifests
      re-read from `.output/` and asserted `permissions: []` with no `web_accessible_resources`;
      `tests/manifest.test.ts` green and **2975 B** (`wc -c` pasted). Control: a deliberately malformed
      manifest fixture reds the same check, so the assertion is shown capable of failing. Golden EMPTY.
      [§3-6; §3.11; §5 manifest pin; AGENTS.md #4]

## 8 — Measure → decide → implement (the measuring tasks CANNOT choose; the deciding task is a human gate)

- [ ] **8.1 D-10 — package size and first paint, production-wired, every byte accounted. PRODUCES NUMBERS;
      FORBIDDEN FROM CHOOSING VALUES.** Content-script bytes vs **315,671 B** — **MUST be 0 delta, both
      engines**, re-established by **controlled ablation and md5**, never the retracted identifier grep.
      App-page chunk vs **361,500 B**, delta **decomposed to sub-block accounting with every byte assigned**
      (engine · glue · CSS · anything shipped that should not be). `pnpm zip` vs **349,744 / 349,803 B**, bound
      **< 2 MB per engine**. Plan §4-6: the Firefox `-sources.zip` (**4.29 MB**) is **the AMO review archive,
      not the bound** — recorded so this task does not report a false breach. First paint, documents
      **without** diagrams, vs **133.7 ms median / 132.1 ms floor**, gate **< 165 ms**, **A-B-A against a
      same-session HEAD control with the FLOOR beside the median**. §5's second gate too: a **diagram-bearing**
      document must meet the same text-paint gate, because §3.3 puts the engine after the commit — **a miss
      there means the enhancement is not actually post-paint, a defect rather than a budget.** Carried unfixed:
      `perf-first-paint.ts`'s false `FAIL` at 1 MB (plan §4-9); app-page first paint has **zero automated
      coverage** (plan §4-5) — stated as the weaker claim it is, never as "within budget".
      Files: `docs/ai/progress.md` (§ Baselines / pins) · measurement report
      Verify: every delta stated **with its baseline**; ablation md5 for both engines **with the app-chunk
      negative control in the same run**; the decomposition **sums exactly**, residual named; zip under bound
      both engines; first paint **median AND floor**, A-B-A, with the A-vs-A agreement stated — *A disagrees
      with A ⇒ nothing measured here means anything.* **Produces numbers; forbidden from choosing values.** A
      content-script delta above 0 is a **fence breach and a STOP-and-flag**. Golden EMPTY · manifest green
      **2975 B** · `permissions: []`. [D-10; §5 bytes + first paint; findings 1, 7]

- [ ] **8.2 D-8 + D-9 — cache-bound and typical-case measurement. PRODUCES NUMBERS; FORBIDDEN FROM CHOOSING
      VALUES.** **D-8:** rendered-SVG byte size across **≥6 diagram kinds** (flowchart, sequence, class, state,
      ER, gantt/pie) at small and large sizes · the 50-diagram fixture's total footprint · accumulation over a
      realistic reading session · **and, per axis, whether it actually BINDS in practice** — an axis that never
      binds is chosen wrong (D-8's own revisit-when, inherited from 006). **D-9:** 1 / 3 / 10 / 50-diagram
      fixtures × {wall-clock to all-visible-diagrams-resolved, time-to-first-diagram, per-diagram amortized
      cost}, **median and floor**, so the shape between points is **observed rather than assumed linear**. §8's
      50-diagram outer bounds (first open ≤ 5 s, cached reopen < 1 s) verified at that size.
      Files: measurement notes into the task report + `docs/ai/progress.md` (numbers only)
      Verify: numbers with baseline, spread, **median and floor**; the binding-axis answer stated **per axis**;
      memory reported **directional only, with its caveats** (the M6 precedent). **Produces numbers; forbidden
      from choosing values** — a chosen bound or an asserted typical-case threshold here is a STOP-and-flag.
      Red-first does not apply (asserts no behaviour). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-8, D-9; §8-1, §8-2; plan §7]

- [ ] **8.3 D-11 — the placeholder-motion fixtures, and the half that is a TEST rather than a judgement.
      PRODUCES MATERIAL; FORBIDDEN FROM CHOOSING VALUES.** D-11 settled the **axes, not the answer**: whether
      motion at 10 and 50 simultaneous placeholders reads as **progress or noise** is a 9.1 walk judgement;
      whether it is **instant under `prefers-reduced-motion`** is a §4 criterion, so **that half is a test and
      ships either way**.
      Files: `tests/browser/diagramRender.browser.test.ts` · fixtures under `tests/golden/fixtures/` **only if
      no existing fixture serves** (nothing under `tests/golden/output/` is added or altered)
      Verify: (**tests/browser** — Cr+Fx) placeholders are **instant with no animation under
      `prefers-reduced-motion`** and **DO animate without it** — the second half is what makes the first
      non-vacuous (row 19's shape); **revert-and-fail: drop the reduced-motion branch and the invariance case
      reds naming the observed animation.** The 10- and 50-placeholder fixtures are recorded as **9.1 walk
      material**; **no motion verdict is reached here.** Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-11; §8-4; §4 rendering; row 19]

- [ ] **8.4 DECISION GATE (human) — the bound VALUES and the typical-case TARGET, chosen from 8.1–8.3.** The
      human picks count / bytes / age and the 1–3-diagram time-to-rendered target from the measurements. **The
      AXES are not reopened** (D-4: all three global, oldest-first on `lastUsed` — settled). D-10's
      package-size disposition is taken here too (whether measurement landed close enough to `< 2 MB` for a
      subset build or a stricter lazy-load boundary to become gate-3 material). 5.2's flip-cost finding is read
      here and routed per gate-2 **(d)**. **Recorded in `docs/ai/decisions.md` BEFORE the code that sets the
      values.**
      Files: `docs/ai/decisions.md`
      Verify (**human gate**): each chosen number recorded **with the measurement that justifies it**, before
      8.5. **No code lands on an assumed number.** Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [D-8, D-9, D-10; gate-2 (d)]

- [ ] **8.5 Implement the CHOSEN bounds and target.** Set 4.1's proposed constants to 8.4's values — a no-op
      edit if they matched, **recorded either way** (a "PROPOSED" comment left on a chosen value is a lie about
      the decision state, and the next session reads it as still open). If the numbers change eviction
      behaviour, 4.1's unit cases move with them. **The ALGORITHM does not move** — only constants.
      Files: `src/app/diagramCache.ts` · `src/app/diagramCache.test.ts`
      Verify: (**unit**) eviction cases pass against the chosen numbers; **`planDiagramWrite`'s body, the
      `bytesOf` reuse and the IDB layer byte-identical** — the diff confined to the constants block, asserted
      rather than eyeballed; no test pinned a proposed number, so none needed updating (if one did, that is a
      finding about 4.1's test design and is stated). Re-run 8.2's accumulation cell to confirm the new bounds
      bind — or do not — **as reasoned, with the prediction stated BEFORE the harness runs** (a number read
      first and rationalised after is not a verification). Golden EMPTY · manifest green **2975 B** ·
      `permissions: []`. [D-8; plan §7]

## 9 — Human milestone-close gate + retro + the `architecture.md` correction

- [ ] **9.1 Milestone-close human gate (NAMED, required — not removable by adding more tests).** Walk, on
      **real Chromium and real Firefox with an extension loaded** (no harness reaches these): **D-11's
      placeholder motion at 10 and 50 diagrams** — progress or noise, in 006's "reads as noise" shape; whether
      the **per-diagram control group** reads as discoverable or as clutter; **legibility of a dense diagram in
      the lightbox**; §3.11's **touch-input** consideration if a device is available; **Firefox everything**
      (Playwright cannot load an extension into Firefox, so this walk is that engine's only evidence); **zero
      unexpected network with the Network tab open** across import → render → cache → re-theme → export;
      **app-page responsiveness after M7** (plan §4-5: nothing else will notice); and the content-script
      surface **still rendering a mermaid fence as a plain code fence with no affordance and no note**
      (§3.2's gate-1 disposition, walked rather than assumed).
      Verify (**human gate**): each item walked and its verdict recorded. **★ The walk records its VIEWPORT(S)
      the way it records its engines, and includes at least one WIDE viewport, because this milestone ships
      positioned chrome** — finding 2, whose mechanical cause was three gates' coverage silently conditioned on
      the monitor someone happened to be sitting at. A "reads as broken / clutter / illegible" verdict is a
      **real finding → a task added below this line, not a silent fix**.
      **★ POINTER WALK AS A DISCRETE STEP before the commit lands** (finding 3): grep § Now, § Blockers and
      § Up next for `is next`, `at the gate`, `waiting on`, `this commit`, `← NEXT` and the running gate score,
      and correct each stale assertion. Golden EMPTY · manifest green **2975 B** · `permissions: []`.
      [§5 human-gate list; findings 2, 3]

- [ ] **9.2 Retro (M7 close) — in a FRESH SESSION (the M5/M6 precedent).** Run `/retro`: append to
      `docs/ai/retro.md`, newest first — the lessons that change how the next milestone runs, and what the gate
      caught (its most valuable content). **★ M7 owes a FLOOR-DELTA STATEMENT against M6's 132.1 ms floor
      BEFORE any first-paint re-baseline is even discussed** (finding 8: a flat floor with a breaching median
      is *environment*; a floor that has moved up is *code*, and the answer is optimisation, not a bigger
      number). State the delta whether or not a re-baseline is proposed — that single number separates the two
      cases, and without it they are indistinguishable in prose.
      Files: `docs/ai/retro.md` · `docs/ai/progress.md`
      Verify: the entry is banked; `progress.md` shows M7 closed and points at what is next; **the floor-delta
      sentence is present and states a number.** Docs only — no `src/`, test, `scripts/` or spec file touched.
      Golden EMPTY · manifest green **2975 B** · `permissions: []`. [finding 8; WORKFLOW.md §7.5]

- [ ] **9.3 The `architecture.md` correction (gate-2 (c)) + the memory reconcile that closes M7.**
      `docs/ai/architecture.md` self-labels *"pre-code; describes intended M1 shape"* and its pipeline line
      names an **`enhance` stage between sanitize and mount that does not exist** — `mount()` commits in one
      synchronous `replaceChildren` (`mount.ts:210`). It lands **here, not in group 3 or 4**, where it would
      have scope-crept the group that discovered it; gate-2 (c)'s wording is that **007 group 3 landed the
      actual post-mount enhancement pattern, and the `architecture.md` "enhance stage" description was pre-code
      and never matched code shape.** Same commit as the retro or one adjacent. Also: **any commit landing
      after the measure-close task RE-RUNS THE PINS OR STATES THAT IT DID NOT** (finding 3 — § Baselines was
      stale by two commits at M6's close while calling itself *"current measured truth"*).
      Files: `docs/ai/architecture.md` · `docs/ai/progress.md` · `docs/ai/spec-coverage.md` (F2's score, if the
      coverage file is in the reconcile's scope at that time)
      Verify: the `enhance`-stage line reads true against shipped code; § Baselines either carries **re-run**
      numbers or **states plainly that it did not re-run them, and why**; 9.1's pointer walk repeated as a
      discrete step on the final commit; `decisions.md` read and left untouched unless a genuine decision
      landed (a retro banks lessons; measurement findings are not decisions). Golden EMPTY · manifest green
      **2975 B** · `permissions: []` · all forbidden paths byte-identical. [gate-2 (c); finding 3; plan §0.2-3]

---

*Gate: this file is a **DRAFT awaiting gate 3**. On approval, implementation may begin at **task 1.1, in a
fresh session**, per WORKFLOW.md §5.3 — one commit per task, the `progress.md` Now-pointer advancing in that
same commit. **No D-value is re-opened and no IS-NOT item is proposed here.***
