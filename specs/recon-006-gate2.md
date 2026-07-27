# Recon report — spec 006 gate 2 (MERGED, v2)

**Status:** complete. Input to `plan.md` (gate 2). **Supersedes v1.** Where v1 and v2 disagreed, v2's finding is recorded with the reason v1 got it wrong.

**Not a repo artifact** — 005 produced no recon file (`git ls-files | grep -iE 'recon|survey|audit'` returns nothing repo-wide), so this deliberately does not add a fourth Gear-3 artifact type. Keep it outside the repo.

**Sources:** two independent read-only recon passes by Claude Code against `D:/Dev/peekover` at HEAD `528200c` (clean, pushed), 2026-07-22, plus one live Mozilla policy check by the orchestrator. Both passes were fenced report-only; neither wrote to the repo or proposed a design.

**★ Why two passes matter — read this before trusting any single line.** Pass 1 concluded the outgoing content "is not held anywhere." Pass 2 found it **is** held, one layer below where pass 1 looked. The cause was the question framing: pass 1 was asked whether *the controller* retains it, answered that correctly, and stopped. **A correctly-answered question can still be the wrong question.** Treat every "X does not exist" below as scoped to where it was looked for.

**How to use this:** it is the factual base for the plan, and gate 2 checks the plan's `file:line` citations against it. **It is not a design.** Where it records a constraint, the plan still chooses the response.

---

## Part 1 — The two findings that most change the plan

### A ★★ §7-1 — the outgoing content IS already retained, by `mount()`

**Pass 1 said no. Pass 2 found it. Pass 2 is right.**

`src/render/mount.ts:202`:

```ts
registerReaderSource(host, source); // stash source for the lazy Raw view
```

- `src/render/readerMode.ts:35` — `const sources = new WeakMap<HTMLElement, string>();`
- `readerMode.ts:39-41` — `registerReaderSource` is the setter. **The only reader is internal**, `readerMode.ts:65`: `pre.textContent = sources.get(host) ?? '';`

This fires on **every successful mount on both surfaces**, including the app page's initial, page-performed mount (`src/app/readerPane.ts:179`, `mount(outcome.text, host, { contained: true })`) — which is exactly the mount §7-1 flagged as not the controller's. The app-page host is created once and reused for the controller's lifetime (`readerPane.ts:163-164`, comment `:142-147`), so the WeakMap entry for that host **is the document currently on screen**.

The watch re-render goes through `src/watch/watchController.ts:293` — `render(text, target, { contained, preserveReading: true })`. **At the instant before that line, `sources.get(target)` is the content leaving the screen.**

**Three constraints the plan must carry:**

1. **No getter is exported.** `readerMode.ts` exports `registerReaderSource` only; `sources.get` has one internal call site (`:65`).
2. **The failure path does not register.** `readerMode.ts:37-38`: *"Called by mount() on the successful render path (the failure path builds its raw `<pre>` eagerly itself)."* `mountRawFallback` (`mount.ts:276-303`) makes no such call — so **after a failed render the WeakMap holds the previous document's source, stale.**
3. **It is a WeakMap keyed by host, chosen deliberately** to keep untrusted source off the DOM and let it be GC'd (`readerMode.ts:31-34`).

**§7-2 largely dissolves.** Steady-state retention today is one WeakMap copy plus at most one `pendingText` (`watchController.ts:219`). Sourcing the outgoing content from the existing WeakMap **adds no third copy**.

**005 left the breadcrumb.** `changeDetector.ts:74-77` names the residual window and assigns ownership: *"closing it needs the caller's already-rendered text seeded as the baseline — which the controller (4.2) owns, not this module."*

**What pass 1 got right and still stands** — the controller and both detectors hold nothing usable:

- **Controller retains nothing.** Complete mutable state, `watchController.ts:212-222`: `host`, `running`, `consecutiveFailures`, `readyAt`, `pendingText`, `pendingTimer` — **no `lastRendered`**. `renderNow(text, target)` (`:277`) takes text as a parameter and never stores it. `pendingText` is cleared **before** the render, `:319-321`:

```ts
const text = pendingText;
pendingText = null;
renderNow(text, target);
```

  On the fast path (`:330-333`, cooldown not binding) `pendingText` is never assigned at all.

- **Both detectors overwrite prior content before the callback**, and only one has a baseline:

| | prior content | overwritten where | baseline read at start? |
|---|---|---|---|
| `pollingDetector` | `lastText`, `changeDetector.ts:95` | `:111-112` — `lastText = text;` **then** `callback?.(text)` | **Yes** — silent baseline (`:104-109`, documented `:66-77`) |
| `observerDetector` | `lastText`, `observerDetector.ts:123` | `:130-131` — same order | **No** — `:105-106`: *"Unlike pollingDetector, there is NO silent baseline read"* |

- `OnText` is single-argument (`changeDetector.ts:30`), so the detector seam carries no second value today.
- `createWatchController({ detector, contained: true })` (`appShell.ts:689`) passes no text, and `WatchControllerOptions` (`watchController.ts:178-196`) has no field for one. `appShell.ts:608-610` orders `stopWatch()` → `installWatchForFile(file)` → `await selectFile(file)`, so registration precedes the mount.

### B ★★ §7-10 — the trust claim lives in CODE and in TWO GREEN TESTS

**Neither the spec nor the gate-2 handoff accounts for this.** §3.3 and §7-10 scope the correction to `docs/trust/PERMISSIONS.md`.

**In shipped product strings, user-visible:**

- `src/app/storageControls.ts:26-27` — exported constant, rendered **unconditionally** at `:182`:
  > *"Peekover never stores the contents of your files — only names and paths, so this list can reopen them. Everything here lives on this device only."*
  Its header (`:12-13`) states the intent: *"It states PLAINLY that file contents are never stored — a standing line, present even when the store is empty, so the promise is visible unconditionally."*
- `src/app/store.ts:280` — *"… — names only, never file contents."*
- `src/app/store.ts:289` — *"Theme / display settings — stored on-device, no file contents."*

**Two live tests assert it and will stay green while the product becomes untrue:**

- `tests/browser/wipe.browser.test.ts:119` — `expect(text).toContain('never file contents');`
- `src/app/appShell.test.ts:715` — `expect(panel!.textContent).toContain('never file contents');`

**Frame these as a tripwire, not an obstacle.** They fire the moment storing code lands without the correction — the enforcement §3.3 wants, and the inverse of the wired-to-nothing class. **The failure mode is someone editing the expected string to make red go green.** Correction order: product string → PERMISSIONS.md → new ledger row → **test assertions last**.

**On the PERMISSIONS.md count — the spec is NOT falsified.** "Three places" refers to three occurrences of the claim sentence itself, verified at lines **42, 45, 82** (two exact, one variant). Pass 2 additionally lists 39, 40, 41, 44, 49-50, 83-84 as lines making some form of the contents-not-stored claim across ledger rows. Both counts are correct at different scopes; **the correction surface is the union.**

**Derived facts that also go stale:** "four stores" and "`DB_VERSION` 2" (`:42`, `:45`, `:84`), "clears all four stores" (`:42`), the ledger heading enumerating milestones (`:31`), and its parenthetical (`:33-35`). Line 45 is the compound claim (*"no snapshot, no history, no cache … `DB_VERSION` is unchanged at 2"*); lines 82-84 are the meta-claim (*"Watching stores nothing, and the claim above stands unchanged."*), which must be rewritten or time-scoped rather than word-swapped.

**Recommendation carried to the plan:** amend spec §3.3 and §7-10 **at the plan gate** to name the code sites and the two tests. Precedent is exact — plan 005 §0 D-1 carried *"four spec amendments ride with this plan's commit."*

---

## Part 2 — Falsified premises

Both passes independently falsified several handoff and spec claims.

### F1 ★ `idbVersionchange` is not the preserves-rows guard

`tests/browser/idbVersionchange.browser.test.ts:23` operates on throwaway databases:

```ts
const nextName = () => `peekover-vc-${(seq += 1)}-${Math.trunc(performance.now())}`;
```

`grep "peekover'"` exits 1 — it never touches the real DB, never writes a record, never reads one back. It is a **matched pair**: a positive (`:66-88` — a held v1 connection steps aside, v2 proceeds, `objectStoreNames` contains `'b'`) and a **live negative control** (`:90-103` — a raw non-stepping v1 connection blocks, `openDb` rejects `/blocked/i`). **It guards versionchange choreography, not data preservation.**

**The real row-preservation guard is `tests/browser/settingsStore.browser.test.ts:118-119`:**

```ts
describe('settings store — additive v1→v2 upgrade (real engine; jsdom-blind)', () => {
  it('the 1→2 upgrade PRESERVES folders/recents/pins AND adds a working settings store (red-first vs a drop/recreate)', async () => {
```

Row preservation is also structurally guaranteed by `idbCore`'s additive-by-name upgrade (`idbCore.ts:56-63`). **Consequence: the pattern v2→v3 needs already exists and was proven red the right way — against a drop/recreate. The plan extends that file.** Both suites still matter, for different properties.

### F2 `IdbSchema` is not `{name, keyPath}`

`src/app/idbCore.ts:24-29`, quoted whole:

```ts
export interface IdbSchema {
  name: string;
  version: number;
  /** Each store is created keyed by an in-record property (keyPath). No indexes. */
  stores: ReadonlyArray<{ name: string; keyPath: string }>;
}
```

`{name, keyPath}` is the **store-entry** shape. `IdbSchema` is `{name, version, stores[]}`. The substance — no indexes, no compound keys, no cursors — **holds**, stated at `:27`.

### F3 ★★ The call-site pin is FILE-granular, not call-site-granular

**Both passes found this independently.** `src/watch/contentWatch.test.ts:117-119`:

```ts
const handBuilt = registrars
  .filter(({ source }) => !source.includes('createWatchController('))
```

`registrars` is a list of **files** (`:108-110`); `registrationLines(source).length > 0` is used only as a boolean non-vacuity check (`:112-115`). The test asks whether a file's whole source mentions `createWatchController(` **anywhere, once**. **A file with one correct registration and one hand-built one passes green.**

The full pin is `contentWatch.test.ts:101-127`: walks `src/` + `entrypoints/` (`:103-106`), excludes `*.test.ts` (`:54`), filters comment lines (`:61-68`), asserts non-vacuity, then flags registering files lacking `createWatchController(`. `entrypoints/peekover.content.ts` is pinned separately by source text (`:70-99`) because no Vitest project can load an entrypoint — the standing `#imports` rule.

The test's own header anticipates being argued with, `:31-32`: *"If a future target is legitimately hand-built … this test is the place that has to be argued with, deliberately, rather than a silent green."*

**Why this matters beyond 006:** the call-site pin was M5's *generalisable* answer to the wired-to-nothing class — the transferable lesson the retro banked. It was verified red against the pre-fix tree: **one red**, proving it *could* fail, not that it isolated per-call-site. That is M5's own finding 2 (*red-first is a count and a reason, not a colour*) landing on the instrument built to enforce M5's other finding, and the standing rule that *a pin certifies exactly the stage it observes* was never turned on the pin itself.

Production has exactly two registrations today and both are correct, so nothing is broken. **006 adds two seams.** Strengthening to per-call-site granularity, with its own red-first evidence (a file with one good and one hand-built registration must go red), is a plan decision — not something to fold in silently.

### F4 The STOP-signal comment says three stores; there are four

`idbCore.ts:4-5` reads *"one database, three keyPath object stores"*. `store.ts:39-44` and `:90-99` define **four**. Cosmetic — but it is the sentence someone reads when judging whether the STOP signal has fired.

### F5 No test fixture has CRLF in the working tree

11 files at `i/lf w/crlf`, matching the spec's count:

```
LICENSE
scripts/perf-watch.ts
specs/004-themes-settings/tasks.md
specs/005-watch-diff/spec.md
src/app/appShell.test.ts
src/theme/reader.ts
src/theme/readerCss.ts
src/theme/themeControl.ts
tests/browser/themeRuntime.browser.test.ts
tests/browser/tocPersist.browser.test.ts
tests/browser/watchDetector.browser.test.ts
```

The only two `.md` members are **spec documents**, and nothing under `tests/`, `src/` or `scripts/` references either. Every file under `tests/fixtures/` and `tests/golden/fixtures/` is LF.

**The CRLF hazard is real for user documents and structurally invisible to the entire suite — no fixture could catch it by accident.** A CRLF fixture must be authored, and authored carefully: `.gitattributes` carries `text=auto eol=lf`, so a naive fixture normalizes itself away at commit and the test passes for the wrong reason.

### F6 The token check passes clean — no sepia repeat

`--del`/`--del-soft` **are** defined in `src/theme/readerCss.ts`, both themes, byte-matching `design/tokens.css`:

- `readerCss.ts:36` — `--del:#B8512F; --del-soft:#F8E9E2;` ↔ `tokens.css:8`
- `readerCss.ts:48` — `--del:#E08663; --del-soft:#342016;` ↔ `tokens.css:20`

`--ok`/`--ok-soft` likewise (`:35`, `:47`). `readerCss.ts` defines all 23 of `tokens.css`'s properties plus `--toc-w`; nothing referenced-but-undefined in either direction. The sepia block (`readerCss.ts:51-53`) overrides only 4 tokens and includes neither — consistent with sepia being deferred.

**The add/remove palette is a fill, not a decision. The 004 sepia failure mode does not recur.**

### F7 Document identity cannot be reused

The gate-2 handoff said snapshots should reuse `RecentRecord`'s key. **Wrong.** `RecentRecord` is `{id, folderId, path, name, openedAt}` (`store.ts:61-67`) with keyPath `'id'`. The doc-comment at `:60` says *"Identity is (folderId, path)"* but **the stored key is a generated id**. A snapshot `docId` must be **composed**, not reused.

---

## Part 3 — Facts by risk

### §7-3 — `idbCore`'s STOP signal

The STOP comment, `idbCore.ts:5-9`:

> *"If this file starts sprouting real edge-case complexity (cursors, indexes, versioned migrations, blocked-upgrade choreography), that is the STOP-and-flag signal: `idb` is the honest fallback, but raw+local is the default and the whole point of the decision."*

Available operations: `get` / `getAll` / `put` / `del` / `clear` (`:112-134`). **No cursor, no index, no range.** `getAll`'s doc states the assumption 006 would inherit — `idbCore.ts:116`: *"Get every record in a store (small bounded stores — no cursor needed)."*

**★ The load-bearing fact for the two-store question:** `describeStored()` reads **whole stores** — four concurrent `getAll`/`get` at `store.ts:308-313`. **A snapshots store holding contents in the same shape would be fully materialised on every trust-panel open.** That is the sharpest argument for plan 005 §1.7's metadata/content split.

### §7-4 / §7-5 — schema, the duplicated literal, byte accounting

| fact | site |
|---|---|
| `DB_VERSION = 2` | `store.ts:36` |
| four stores | `store.ts:39-44` (`STORES`), `:90-99` (`SCHEMA`) |
| `wipeAll()` — four explicit sequential `clear()` calls | `store.ts:210-216` |
| `describeStored()` | `store.ts:306-331` |
| `buildStoredLines()` (pure) | `store.ts:266-298` |
| `StoredSummary` | `store.ts:237-252` |
| `EMPTY_SUMMARY` literal | `appShell.ts:487-494`, literal at `:493` |
| the must-not-diverge comment | `store.ts:291-296` |

Both line numbers re-derived; plan 005 §1.7's have drifted.

**A property worth inheriting deliberately:** `store.ts:243-247` records that at 005 task 5.2, `settings` was made **required** on `StoredSummary` so that *"a future summary literal that forgets the field fails to compile instead of silently reporting"*. **A new byte-count field inherits that compile-time enforcement if declared required.**

`openDb` upgrade (`idbCore.ts:56-63`) is additive-by-name, never drops or migrates.

**★ The "Nothing stored" literal is in THREE places, not two** — the third is a test-side reimplementation at `appShell.test.ts:658`.

**Nothing anywhere measures bytes** — no `TextEncoder`/`byteLength` in `store.ts`.

**Eviction precedent:** the only one that exists is the recents cap, computed by pure `addRecent` and applied **in the shell, not the store** — `appShell.ts:622-628`.

### §7-6 — line endings

Detector mechanism confirmed at `changeDetector.ts:110`:

```ts
if (text === lastText) return; // CONTENT compare — the whole point
```

An exact string comparison, so a pure `\r\n`→`\n` flip **is** a change by this code path. **The spec correctly flags the consequence as inference and it remains one — nothing was measured.** Running the experiment is behaviour-probing, which both report-only fences forbade. **This belongs to the plan as a designated experiment, not as an assumption.**

### §7-7 — the registration seams

Exactly two production `registerWatchTarget` call sites:

- `src/app/appShell.ts:690` — `registerWatchTarget(controller);` (built `:689` with `createWatchController({ detector, contained: true })`)
- `src/watch/contentWatch.ts:119` — `registerWatchTarget(createWatchController({ detector, contained: false }));`

Both correct today. Test sites: 22 across three browser files. See **F3** for why the guard is weaker than believed.

### §7-8 — the render boundary

`mount(source: string, host: HTMLElement, options: MountOptions = {}): void` — `src/render/mount.ts:111`. Synchronous, no scheduling, no abort (`watchController.ts:70` and `:370` both depend on it).

`MountOptions` — `mount.ts:38-65` — exactly two fields, `contained?` and `preserveReading?`. **`preserveReading`'s doc-comment (`:49-63`) is the M5 crossing precedent verbatim**, including *"BOTH directions of this flag are red-first proven in `tests/browser/watchRemount.browser.test.ts`, not just the new one."*

Three production call sites:

| site | options |
|---|---|
| `src/render/mountReader.ts:90` | none (content-script full-page) |
| `src/app/readerPane.ts:179` | `{ contained: true }` |
| `src/watch/watchController.ts:293` | `{ contained, preserveReading: true }` — via injected `RenderFn` (`:176`, defaulted to `mount` at `:208`) |

Plus `scripts/perf-watch.ts` (bundled from source, not the build artifact — `:55`).

**Not a call site, checked:** `runReader.ts:148` `didCommit = mount()` is the zero-arg injectable `options.mount ?? mountReader` (`:88`, `:115`) — a name collision, not `render/mount`.

`preserveReading` has **one reader** (`mount.ts:199`) and **one production setter** (site 3). **§7-8's "read at exactly one site" premise holds.**

### §7-12 — the disclosure surface, and the contention problem

`buildWatchNote()`, `watchControl.ts:233-241`, class `peekover-watch-note` (`:203`), `role="status"`. Reaches the DOM through `buildWatchChrome()` (`:256-262`), which returns `Node[]`, spread into `mount()`'s `children[]` at `mount.ts:181` — **a sibling of `.peekover-reader`, never inside the reading column.**

Placement, `readerCss.ts:311-320`: `position:fixed; bottom:136px; left:16px; max-width:34ch`, `--muted` on `--panel`, `border-left:3px solid var(--warn)`. Bottom-left stack: network 16 · theme 56 · watch pill 96 · **note 136**. In contained (app-page) mode `CONTAINED_CSS` flips it to `position:absolute` (`:542`).

Rationale, `readerCss.ts:306-310`:

> *"It sits directly above the watch pill in the same bottom-left column and is width-capped so it reads as a quiet aside rather than a modal — the document stays the hero. The left accent bar borrows the render-failure banner's language (`.peekover-alert`) so degraded states across the reader look like one family. `--warn`, not `--del`: this is 'something you should know', not an error the user caused. Tokens ONLY."*

**★ Fully parameterised, with exactly ONE string at a time.** `labelNote()`, `:209-215`:

```ts
function labelNote(el: HTMLElement): void {
  const text = watchNote();
  el.textContent = text ?? '';
  // `hidden` rather than a class, so the element is out of the a11y tree too — an empty
  // `role="status"` region that is merely transparent still gets announced by some AT.
  el.hidden = text === null;
}
```

Every string comes from `watchRegistry.watchNote()`, backed by **one module-level slot** — `watchRegistry.ts:128` `let note: string | null = null;`, written only by `setWatchNote()` (`:135-138`). **Last write wins.** The note appears **without a re-render** (`watchRegistry.ts:130-134`), the property 4.3 depends on.

**Four production claimants already exist**, all exported constants, none built at runtime:

| constant | location |
|---|---|
| `DEAD_READ_NOTE` | `watchController.ts:140-142` |
| `FIREFOX_CONTENT_SCRIPT_NOTE` | `watchAvailability.ts:97-100` |
| `FIREFOX_PICKER_NOTE` | `watchAvailability.ts:103-106` |
| `REMOTE_DOCUMENT_NOTE` | `watchAvailability.ts:120-122` |

Non-interchangeability is **red-first proven** — `watchAvailability.ts:62-63`: *"The three notes are deliberately non-interchangeable, and that is red-first proven — swapping any pair fails, the same discrimination check that caught 4.4's engine leak."* And `:65`: *"Whether the copy READS as honest rather than broken is human-gate 7.1, not a test."*

**Varies in exactly one dimension: present vs hidden.** One class, one CSS rule, no `data-` attributes, no severity variants. All four strings render identically. State machine: `watchCapability()` (`watchAvailability.ts:130-159`, pure) plus `onReadError` (`watchController.ts:255-267`); four chrome states enumerated at `watchControl.ts:249-254`. Sync is one module-level subscription (`syncNotes()`, `:218-223`), pruning disconnected elements before writing.

**⇒ A capture disclosure does not get "added" — it CONTENDS for the single slot.** A capture note occupying it when a read error fires is overwritten by `DEAD_READ_NOTE`, or vice versa depending on order. The plan needs an arbitration rule or a different surface, and a fifth note **extends the red-first discrimination suite** rather than slipping in beside it.

*Semantic fit is good: `--warn`, documented as "something you should know, not an error the user caused."*

### §7-14 — the mockup's diff is a MODAL, and a version browser

**DOM**, `design/mockup.html:752-766`: `<div class="overlay" id="diffOverlay">` containing `<div class="panelbox diffbox" role="dialog" aria-modal="true" aria-label="Diff since last snapshot">`. Full-viewport scrim, `:192-194`:

```css
.overlay{position:fixed;inset:0;background:rgba(10,10,16,.45);backdrop-filter:blur(3px);z-index:60;display:none;align-items:flex-start;justify-content:center;padding-top:14vh}
```

`:205` `.diffbox{width:min(640px,92vw)}` · `:208` `.diff{...max-height:52vh;overflow:auto}`. Opened by `openDiff()` (`:1283`), bound to ⌘⇧D (`:1310`).

**This contradicts spec §3.7 (inline in the reading column) and §6 (no modal) — and the picker at `:681` frames it as versions** (*"Snapshot v3 · 2 min ago restored — every save is versioned locally"*), which §3.7 and §6 also exclude, plus it implies restore (deferred to F8).

**Same class as 005**, where the mockup scrolled unconditionally while spec §4 forbade moving a reader who had scrolled away: **the spec won, and the divergence was recorded in-code** — `watchController.ts:14-31` DECISION 1 is the precedent for where that comment lives.

Three facts make the call easy:

1. `grep -rn "aria-modal\|role=\"dialog\"" src entrypoints` → **exit 1**. No dialog/modal primitive exists in shipped code.
2. `openCompare()` (`:1104-1116`) **mutates `#diffOverlay` in place** — that box is really the shell for compare-two-files, which spec §3.1 **defers**.
3. Four non-token primitives have no shipped counterpart: hardcoded `rgba(10,10,16,.45)` scrim · `backdrop-filter:blur(3px)` (no hit in `readerCss.ts`) · `border-radius:14px` on `.panelbox` (vs `var(--r)` = 10px) · `animation:pop .18s ease` (`@keyframes pop` undefined; `readerCss.ts` defines only `peekover-watch-pulse` `:281` and `peekover-watch-flash` `:294`).

**★ The pattern to translate is `.rw`, not the overlay** — a genuinely inline diff already in the mockup, `:289-298`:

```css
.rw{display:none;margin:16px 0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;font-size:15px}
.rw.on{display:block;animation:pop .2s ease}
.rw .l{padding:10px 16px}
.rw .old{background:var(--del-soft);color:var(--del);text-decoration:line-through}
.rw .new{background:var(--ok-soft)}
```

**In normal flow** (`margin:16px 0`), not a modal. It belongs to the AI rewrite-preview feature (`:797`), not ⌘⇧D — but it is the design language that fits §3.7.

**Line marking is DOUBLED**, `:209-212`:

```css
.diff div{padding:1px 12px;border-radius:5px;white-space:pre-wrap}
.diff .add{background:var(--ok-soft);color:var(--ok)}
.diff .del{background:var(--del-soft);color:var(--del);text-decoration:line-through}
.diff .ctx{color:var(--muted)}
```

Class colour **and** a literal `+ ` / `- ` / `  ` prefix baked into each div's text, preserved by `white-space:pre-wrap`. **That satisfies A16's more-than-colour-alone requirement using a pattern the design already committed to.** Line granularity throughout; no sub-line spans anywhere.

**One decision, not a fill:** `--del` already carries a shipped semantic — the lit network indicator, `readerCss.ts:353` (*"the one warm accent"*), used `:366`. Diff-removed would be its second meaning. Whether large `--ok-soft`/`--del-soft` blocks in the reading column compete with the watch pill's `--ok` in the bottom-left stack is a design question for the plan and the gate.

### §7-15 — keyboard

| | key | registered | resolves host by | removed? |
|---|---|---|---|---|
| reader mode | `'\\'` (`readerMode.ts:26`) | `:124`, once-guard `:104`+`:120` | `document.querySelector('peekover-root')` — `:128`, `HOST_TAG` `:16` | **never** |
| TOC toggle | `` '`' `` (`tocView.ts:882`) | `:914`, once-guard `:911-913` | `resolveActiveTocHost()` registry — `:918`, defined `:847` | **never** |

**Plan 005 §4-3's claim is confirmed:** `readerMode`'s `\` is **app-page-blind** — it queries the tag `peekover-root`, while the app page's mount host is a `div` with class `peekover-app__reader__host` (`readerPane.ts:163-164`). The TOC's backtick resolves through a registry `mount()` maintains (`tocView.ts:805`, `:813-818`) and works on both surfaces.

A third keydown at `src/app/treeView.ts:228` is bound to `body`, not `document` — scoped to the folder tree.

Shipped convention is **bare keys with modifiers explicitly rejected** — both guarded by `if (e.ctrlKey || e.metaKey || e.altKey) return;`. The mockup binds ⌘⇧D one branch above bare ⌘D for theme-flip, and mod+`\` to `toggleSide()` (`:1306`). **Adopting the mockup's combo would change the shortcut convention repo-wide** — the carried unify-the-two-shortcuts item. Either/or for the plan.

### §7-11 — Firefox data-collection declaration: **CLOSED, NO CHANGE**

`wxt.config.ts:36`, inside the Firefox-only branch (`:29-41`): `data_collection_permissions: { required: ['none'] },`. Documented at `PERMISSIONS.md:162-167`: *"'none' is the collects-nothing value, shown to the user at install time. This key is Firefox-only and never appears in the Chrome manifest."*

**Resolved against current Mozilla policy (checked 2026-07-22), not assumed.** Mozilla's Extension Workshop page states the governing definition: data transmission refers to any data collected, used, transferred, shared, or handled **outside the add-on or the local browser**. MDN's manifest reference matches — the declared types are those collected and transmitted for storage and processing **outside the extension**.

Snapshots are IndexedDB **inside the extension, inside the local browser**. Not transmission. **`required: ["none"]` stays correct; no install-time user-visible string changes; this does not return to a human gate.**

Notes for later milestones, not 006:

- Once an extension adopts the key it must keep using it in all subsequent versions. Peekover already does.
- Mozilla stated it would require *all* extensions to adopt the framework in the first half of 2026. That window has passed; Peekover already complies, so the only exposure is a schema change at that rollout — one check at the milestone gate.
- `websiteContent` is the category that could plausibly have caught this (it covers text, images, links, embedded content), but the "outside the add-on or the local browser" qualifier governs all eleven categories, so it does not fire.

### Miscellaneous

- **Dependencies are exactly three, unchanged:** `dompurify`, `markdown-it`, `markdown-it-task-lists`.
- **27 browser test files** under `tests/browser/`.

---

## Part 4 — What recon could NOT close

**§7-6 second half — the CRLF detection consequence.** The mechanism is confirmed (`changeDetector.ts:110`, exact string compare). The *consequence* — that a pure line-ending flip triggers a render and stores a snapshot of a document whose text did not change — **remains inference. Nothing was measured.** Running the experiment is behaviour-probing, which both fences forbade.

*This is the correct outcome, not a gap: a mechanism that CAN produce a symptom is not evidence that it DID. An M5 investigation was thorough, correctly scoped, and wrong for exactly this reason.*

**§7-2 / §7-13 measurement.** Memory cost and bound defaults are measurement questions no read can answer. **A measurement task measures and is forbidden from choosing**; the choosing is a separate human gate.

**§7-9 — the anchor-correction internals** were not read past the carried-item level.

---

## Part 5 — Where §7 stands

**Answered from code:** §7-1 (with A above), §7-3, §7-4, §7-5, §7-7, §7-8, §7-10 (expanded), §7-11 (closed), §7-12, §7-14, §7-15.

**Remaining, all plan-designated tasks rather than recon gaps:**

- **§7-6** — the CRLF detection experiment, plus a CRLF fixture authored against `text=auto eol=lf` (F5).
- **§7-2 / §7-13** — measurement, forbidden from choosing.
- **§7-9** — decide explicitly whether any anchor-correction work lands here. Deciding no is fine; drifting in is not.

## Part 6 — New items neither the spec nor the handoff anticipated

1. **★ The trust claim lives in product code and two green tests** (Part 1B). Spec §3.3/§7-10 scope is too narrow — recommend amending at the plan gate, 005 D-1 precedent.
2. **★ `mount()` already retains the outgoing source** (Part 1A) — changes §7-1's answer and largely dissolves §7-2.
3. **★ F3 — the call-site pin needs strengthening to per-call-site granularity**, with its own red-first evidence. Affects the whole project's defence against the wired-to-nothing class.
4. **`describeStored()` reads whole stores** — a snapshots store in the same shape would be fully materialised on every panel open. The strongest argument for the metadata/content split.
5. **F7 — snapshot `docId` must be composed**, not reused from `RecentRecord`.
6. **F5 — a CRLF fixture must be authored** carefully enough that `.gitattributes` does not normalize it away.
7. **§7-12 — the watch-note slot is single-occupancy with four existing claimants.** Arbitration rule or a different surface.
8. **`StoredSummary`'s required-field pattern** (`store.ts:243-247`) gives compile-time enforcement to a new byte-count field if declared required.
9. **The "Nothing stored" literal is triplicated**, including a test-side reimplementation at `appShell.test.ts:658`.
10. **F1 — schema work answers to `settingsStore.browser.test.ts`**, not `idbVersionchange`.
11. **F4 — `idbCore.ts:4-5` says three stores; there are four.** One-line correction, rides any commit touching the file.
