# Plan 005 — Watch mode + diff

**Status:** approved (Gear-3 gate 2 passed 2026-07-19) — tasks.md next
**Scope note:** this milestone (**005**) ships **watch mode only**. Snapshots + diff are split out to **006** (D-1 below). The spec covers the whole feature area; this plan delivers its first half.
**Date:** 2026-07-19
**Spec:** `specs/005-watch-diff/spec.md` (approved gate 1). This plan is the HOW; it resolves the eight spec §7 risks against the **actual code**, not against recollection.
**Evidence base:** the task-0 platform probe (`decisions.md` 2026-07-19) **and** a codebase recon run before this plan was written. Every path, signature and behavioural claim below is cited to `file:line`. The 004 plan was wrong about two paths and one seam because it was written from fragments; this one was not.
**Libraries:** **one new dependency proposed** (`diff`, §0 D-2). Everything else uses what exists.

---

## 0. Decisions SETTLED at this gate (2026-07-19)

**D-1 · SPLIT — 005 ships watch; snapshots + diff become 006. DECIDED (B).**
The task order came out at **10 groups** against 004's 8, and the halves are cleanly separable: diff depends on watch only for *"when do we take a snapshot"*, which is one call.
- **005 = watch:** detection · relay · re-render continuity · watch UX · measure · perf/pins/docs · human gate. **Seven groups — 004's proven size.**
- **006 = snapshots + diff:** storage · diff engine + view · trust surface. Gets its own Gear-3 cycle (plan + tasks), drawing on this spec's §3.3/§3.4 and the deferred acceptance criteria.
- **Why:** watch alone is the headline differentiator and independently valuable; §1.4's anchor work is the least-estimable piece in the milestone and deserves room; and **the PERMISSIONS.md trust-claim change lands with the code that forces it** rather than months early. **Nothing in 005 stores file contents**, so the "file contents are never stored" claim stays TRUE for the whole of this milestone.
- **Consequence — four spec amendments ride with this plan's commit** (listed at the foot).

**D-2 · Add the `diff` dependency — DECIDED (A), and now DEFERRED TO 006.** `diff` is the product spec §10 stack choice, battle-tested, and line diffing has more edge cases than it looks (trailing newlines, CRLF, unicode, large-file performance). It would be the **first `dependencies` addition since M1**, so it is a governed act — but **not in this milestone**. 005 adds **no dependency**; `dependencies` stays at three.

**D-3 · Scroll continuity is ANCHOR-based, not `scrollTop`-based — DECIDED.** Spec §4 says preserve the reader's **place**, and `scrollTop` is correct only when content is *appended*. An agent rewriting a whole spec file inserts above the reading position constantly, which is the case `scrollTop` gets wrong — so the easy case is the one restoring pixels handles, and the common case is the one it breaks. §1.4 specifies heading-anchor restoration with a `scrollTop` fallback. **Whether it *feels* like your place is human-gate-only** (§4-2).

---

## 1. Architecture & data flow

### 1.1 Detection is a 2×2, not a per-engine split — and this corrects the spec

The probe established Chromium=events / Firefox=polling. The recon plus the `FileSystemObserver` contract establish something narrower: **`observe()` takes a `FileSystemHandle`. The content script has only a URL, and there is no URL→handle API.** So:

| | app page | content script |
|---|---|---|
| **Chromium** | **event-driven** — `FileSystemObserver` on the file handle | **polled** — background `fetch(url)` |
| **Firefox** | **polled** — `entry.file()` fresh per tick, drag-only | **unknown** (§3-1) |

Consequence: **spec §3.2 and §4 need amending** (§7 of this plan). "Chromium detects without polling" is true of the app page only.

**One seam, two implementations.** A detector reports *the document's current text*, nothing more:

```
type OnText = (text: string) => void;
interface ChangeDetector { start(cb: OnText): void; stop(): void; }
```

- `observerDetector(fileHandle)` — Chromium app page. `FileSystemObserver` → on `modified`, `getFile().text()`.
- `pollingDetector(read: () => Promise<string>, intervalMs)` — everything else. **Compares CONTENT, never metadata** (the probe's Firefox trap: `size`/`lastModified` are frozen at drop time and would silently never fire).

The `read` function is injected, exactly as `settingsPort` injects its transport:
- Firefox app page (drag): `() => entryFile(entry).then(f => f.text())`
- Content script (either engine): `() => relayRead(location.href)`

That gives **one** polling implementation, unit-testable with a fake `read`, and pushes every platform difference into the factory that chooses a detector.

### 1.2 The relay — a second message type on the existing channel

The content script cannot re-read its own file (probe: `fetch` → `TypeError`, XHR → status 0, *even with file-URL access granted*). The background can. So watch on that surface relays, exactly as settings do.

New message on the same channel, mirroring `settingsPort.ts`'s contract verbatim in shape:

```
export const WATCH_READ = 'peekover:watchRead' as const;
interface WatchReadMessage { type: typeof WATCH_READ; url: string; }
// reply: { ok: true; text: string } | { ok: false; error: string }
```

- **Handler shape is copied, not reinvented:** `createWatchListener(read)` returns `(message, sender, sendResponse) => boolean`, returning `false` for messages that are not ours (so the settings listener still gets them) and `true` + async `sendResponse` for ours. That `return true` contract is load-bearing and engine-specific — WXT ships the **native** namespace, not the polyfill, and native Chrome ignores a returned Promise (`settingsPort.ts:171-180`).
- **URL validation, defence in depth:** the handler accepts only `file://` URLs with a markdown extension matching the content script's own `matches` list. The content script can only run on those anyway, but the background must not become a general file-read oracle for a compromised page context.
- **The loop lives in the PAGE, not the background.** The content script owns the `setInterval`; the background is a **stateless fetch proxy**. This is what dissolves spec §7-6 (MV3 service-worker teardown): there is no long-lived background state to lose, the SW wakes per tick and sleeps again, and the watch dies with the tab that owns it — which is correct, because the user is watching a document they are looking at.

### 1.3 Re-render with continuity — and this means editing `mount()`

**The uncomfortable fact the recon surfaced:** of the four things spec §4 requires preserved across an update, **one survives today**.

| state | today | source |
|---|---|---|
| theme | survives, re-asserted | `mount.ts:160` → `reader.ts:198` |
| TOC open/width | survives *only via* 004's persistence round-trip; re-decided every mount | `tocView.ts:564, :498-500` |
| Raw/Reading mode | **actively RESET** | `mount.ts:151` — unconditional `setReaderMode(host,'reading')` |
| scroll position | **no preservation code exists** | nothing in `mount.ts` touches scroll |

So this is **new work inside `mount()`**, the one function every milestone has treated as read-only library (`readerPane.ts:16`). **The plan names that boundary crossing rather than discovering it in task 3.**

**Mechanism: extend `MountOptions`.** It currently has exactly one field (`contained?: boolean`, `mount.ts:34-43`) and — unlike 004's port — **it is already threaded through every caller**. Adding a field is not the mistake 004 made.

```
interface MountOptions {
  contained?: boolean;
  /** This is a re-render of the SAME document: keep the reader where they were. */
  preserveReading?: boolean;
}
```

When set, `mount()`:
1. **before** `replaceChildren`: capture the reading anchor (§1.4) and the current `data-mode`;
2. **after** the commit: restore the mode instead of forcing `'reading'`, then restore the anchor.

Everything else already behaves: the scroll-spy is torn down and rebuilt (`tocView.ts:543,:574`), registries are idempotent re-asserts (`mount.ts:157-160`), `--toc-w` is an inline host style and survives.

**One open behaviour to verify, not assume (§4-5):** with nothing stored, `applyInitialTocState` re-derives `data-toc` from the laid-out width on every mount (`tocView.ts:498-500`) and can re-open a rail the user just collapsed. The recon suggests this is already covered — `setTocOpenByUser` persists on click and `saveSettings` updates the snapshot **immediately** (`settingsSeam.ts`), so the next mount restores rather than re-derives. **Confirm by test before treating it as covered.**

### 1.4 The reading anchor — the largest unscoped piece

"Preserve the reader's place" ≠ "restore `scrollTop`". Restoring the pixel offset is correct only when content is **appended**; when an agent rewrites a file and inserts above, the same offset is different content.

**Design: heading anchor, `scrollTop` fallback.**
- **Capture:** resolve the scroll box (§1.5), find the **last heading whose top is at or above the scroll position**, and record `{ text, index, delta }` where `delta` is the pixel gap from that heading's top to the scroll position.
- **Restore:** after commit, match by **heading text first** (stable across re-parses of a mostly-unchanged doc), by **index** if the text is gone, and fall back to raw `scrollTop` if the document has no headings or nothing matches.
- Headings are already extracted — `buildTocModel(root)` runs on every mount, immediately before the commit (`mount.ts`, the `buildTocView(host, buildTocModel(root), …)` line), so the model exists at exactly the right moment. **Reuse it; do not re-derive.**

This is deliberately the simplest thing that is right in the common case. §5 measures whether it is enough; the human gate judges whether it *feels* right, which no test can.

### 1.5 The scroll container must be shared, not re-derived

`resolveScrollContainer(host, contained)` is **private** to `tocView.ts:636-644`, and the container genuinely differs per surface: `:host` full-page (`readerCss.ts:58-72`), `.peekover-app__reader` when contained (`appShell.ts:206`, an ancestor **outside the shadow root**).

003 recorded the trap in-code (`tocView.ts:580-593`): *"the container must be RESOLVED, never assumed to be `:host`"* — a wrong root silently observes the viewport and tracks nothing. Watch is the second consumer, so **extract it to a shared module** (`src/render/scrollContainer.ts`) and have `tocView` import it. Small, mechanical, and it stops the trap being re-derived a third time.

Note it needs `contained` **passed in** — there is no marker on the host recording which surface it is.

### 1.6 Coalescing rapid updates

`mount()` is **synchronous** with no scheduling and no abort (`mount.ts:79-167`); a 1 MB doc's ~1.25 s render blocks the main thread entirely — during which nothing can scroll, fire, or cancel. So the only available mechanism is **outside** `mount()`:
- **trailing debounce** — render after N ms of quiet, so a burst of agent writes produces one render;
- **at most one pending render**, intermediate texts dropped (the newest wins — this is a viewer, not a log);
- **N is MEASURED, not guessed** (§5, group 5). This is 004's D-2 shape exactly, and 004's lesson was that the inference did not survive contact with the measured configuration.

### 1.7 Snapshots — two stores, to dodge idbCore's STOP signal

Snapshots want "all versions of doc X, oldest first, evict past a bound". `idbCore`'s `IdbSchema` is `{name, keyPath}` with **no indexes, no compound keys, no cursors** (`idbCore.ts:28`), and its own header names exactly this as the *"reach for `idb`"* STOP signal.

**Split metadata from content:**
- `snapshotMeta` — keyed by `docId`, holds `{ docId, entries: [{ id, ts, bytes }] }`
- `snapshots` — keyed by snapshot `id`, holds `{ id, text }`

Listing, eviction and byte-accounting read **only** `snapshotMeta` — one small row per document. Content is fetched only when a diff is actually rendered. This avoids both the STOP signal *and* the memory problem of `getAll`-ing every snapshot's full text just to decide what to evict.

`DB_VERSION` 2 → 3. `openDb`'s upgrade is **additive-by-name** — it creates missing stores and never drops, rebuilds or migrates records (`idbCore.ts:53-82`) — so this is two lines in `SCHEMA` and a version bump, with no migration code. 004's `onversionchange` close-and-drop handler already exists and covers the bump.

**Bytes:** `new TextEncoder().encode(text).length` — synchronous and exact for UTF-8. Nothing in the codebase measures bytes today (recon §5e), so this is greenfield: a new field on `StoredSummary`, a new line in the pure `buildStoredLines`, and a matching change to the **duplicated** `EMPTY_SUMMARY` literal (`store.ts:295` / `appShell.ts:483` — the two are commented as must-not-diverge).

**Bounds:** count, age and bytes, whichever binds first; eviction oldest-first; defaults proposed in tasks (§4-4) as tuneable, not gated.

### 1.8 Diff

`diff`'s line-level API against the snapshot's text and the current text; render into a designed view (inline first). The renderer is ours — the library gives hunks, not markup. Diff output goes through the **existing sanitize path** like any other rendered content; a diff of an agent-written file is untrusted input on both sides.

### 1.9 What the user drives

- **A watch control** in the reader chrome, following the 004 theme-control precedent: a sibling of `.peekover-reader` in `mount()`'s `children[]` (never inside the reading column), styled from tokens.
- **Active state** on the host (`data-watch="active"`), so CSS and AT can both see it — and, critically, **a host attribute survives `replaceChildren`**, so the state outlives the re-render that watch itself causes.
- **The control is rebuilt on every mount; the controller is not.** So they need a seam, exactly as 004's theme control needed `registerThemeSaveSink`: a module-level registry the context registers a start/stop callback into, which the freshly-built button calls. **Do not hold a controller reference in the button's closure** — it dies every render.
- **An update signal** — brief, non-intrusive, `prefers-reduced-motion`-instant (the existing `emulateReducedMotion` browser command tests this; no new harness needed).
- **Follow-at-bottom only**: if the reader is at the bottom, follow new content; if they have scrolled away, never move them.

### 1.10 Document identity and watch lifecycle — two gaps this plan closes explicitly

**Identity.** Snapshots are keyed per document, and there is no existing document identity in the codebase. It differs per surface: the content script has a `file://` URL; the app page has a path within a `FolderSource`, and the same path can exist under two different remembered folders. `RecentRecord` already faces this and keys on `(folderId, path)` (`store.ts`). **Snapshots reuse that convention**: `docId = url` on the content script, `docId = folderId + ':' + path` on the app page. Named here because a plan that leaves it implicit gets it invented inconsistently in task 6.

**Lifecycle.** Watch is per-document and **opt-in**, so:
- starting is a user gesture on the control; nothing watches by default (spec §4 Trust);
- **switching documents stops the previous watch.** On the app page `readerPane.select()` re-mounts the shared host with a different file (`readerPane.ts:177-178`) — a watch left running would then be feeding *the old file's* content into *the new document's* reader. This is a real bug the design must prevent, not an edge case;
- closing the tab ends it, by construction (§1.2 — the loop lives in the page);
- a read failure (deleted, moved, permission revoked) stops the watch and surfaces a designed state, rather than retrying forever.

## 2. Files to create / touch

**Create**
- `src/watch/changeDetector.ts` — the `ChangeDetector` seam + `pollingDetector` (pure, injected `read`)
- `src/watch/observerDetector.ts` — the Chromium `FileSystemObserver` implementation
- `src/watch/watchRelay.ts` — `WATCH_READ` contract, `relayRead()`, `createWatchListener()`
- `src/watch/watchController.ts` — start/stop, debounce, the re-render call
- `src/render/scrollContainer.ts` — extracted from `tocView` (§1.5)
- `src/render/readingAnchor.ts` — capture/restore (§1.4)
- `src/app/snapshots.ts` — snapshot CRUD, bounds, eviction, byte accounting *(groups 6–8; moot if D-1=B)*
- `src/render/diffView.ts` — diff rendering *(ditto)*
- Test files per group (§5)

**Touch**
- `src/render/mount.ts` — `MountOptions.preserveReading`; skip the `'reading'` reset (`:151`); anchor capture/restore around `:149`; the watch control in `children[]`
- `src/render/tocView.ts` — import the extracted `resolveScrollContainer` instead of its private copy
- `entrypoints/background.ts` — register `createWatchListener` beside the settings listener
- `entrypoints/peekover.content.ts` — build the relay read fn; wire the controller
- `src/app/appShell.ts` — wire watch for the app-page reader; snapshot usage in the storage panel *(latter is groups 6–8)*
- `src/app/store.ts` — `DB_VERSION` 3, two stores, `wipeAll`, `describeStored`, `StoredSummary`, `buildStoredLines` *(groups 6–8)*
- `docs/trust/PERMISSIONS.md` — **same PR as the first storing code**: the "file contents are never stored" claim (three places) becomes false; plus the `file://` read disclosure per spec §3.6
- `package.json` — `diff` *(D-2, group 7)*

## 3. Risk resolutions (spec §7 → concrete)

1. **Firefox content-script watch unverified** → **group 2 verifies it first, before anything depends on it.** A background `fetch("file://…")` on Firefox is untested; Firefox has no file-URL toggle. If it fails, Firefox watch is **app-page-only** and spec §3.5 narrows — decided by measurement, not by hope.
2. **Observer latency unmeasured** → group 5 measures it cleanly (mark → programmatic write → callback, no human in the loop; the probe's 5127 ms was human reaction time).
3. **Re-render cost under rapid updates** → group 5, **measure then choose** the debounce window. No mechanism is pre-committed. This is 004 D-2's shape and its lesson.
4. **Does `file://` appear in Resource Timing?** → group 2. The recon **verified §3.6's premise**: all seven guard files filter `/^https?:/i` or a narrower same-origin token; none counts all entries. So the guards cannot trip on a watch loop. **But they also cannot prove the read stayed local** — they exclude `file://` rather than assert on it. Group 2 records which, and the zero-network guard for watch reuses the existing predicate unchanged.
5. **Snapshot bound defaults unevidenced** → group 6 proposes with reasoning; tuneable, not gated. *(Moot if D-1=B.)*
6. **Watch lifetime vs. surface lifetime** → **dissolved by §1.2**: the loop lives in the page, the background is a stateless proxy. No SW state to lose.
7. **Atomic-save fragility** → group 1 handles `disappeared`/`errored` records as *"the observation is dead"* and re-observes or falls back to polling. The probe saw only `modified` **on one machine with one editor**; the design must not depend on that holding.
8. **Firefox drag-only discoverability** → group 4 ships a designed explanation at the moment it matters, not a disabled control.

## 4. Risks & unknowns this plan still carries

1. **Editing `mount()` is a boundary crossing.** Four milestones have treated it as read-only library. `preserveReading` is additive and defaulted-off, so existing callers are unchanged — but the mode-reset removal at `:151` changes behaviour for anyone passing the flag, and `readerPane`'s routine re-mount (`:177-178`) must keep its current reset semantics. **Red-first that existing behaviour, don't just add the new one.**
2. **The anchor may not feel right.** Heading-text matching degrades when an agent rewrites headings. Geometry tests can prove the scroll position is *a* correct position; whether it is *the reader's place* is human-gate-only — the M3 defect-#6 class.
3. **Two document-level keydown listeners already exist**, permanently installed with once-guards and never removed (`readerMode.ts:104-133`, `tocView.ts:915-943`), and `readerMode`'s resolves via `document.querySelector('peekover-root')` — app-page-blind. If watch adds a shortcut it inherits this pattern; the existing bare keys are `\` and `` ` ``.
4. **The relay is untestable end-to-end in `tests/browser`.** The harness loads no extension, so `runtime.sendMessage` has no receiving end (recorded repeatedly: `tocPersist.browser.test.ts:24-33`). The handler is unit-tested as a pure function through the **production** seam; the round trip is a **named human-gate item**, budgeted up front rather than discovered at group 9.
5. **The TOC re-decide interaction** (§1.3) is believed covered by 004's persistence. **Verify by test.**
6. **First-paint margin is thin and partly borrowed.** ~7–12 ms against the <150 ms budget — measured with a dependency set that has **no Shiki, KaTeX, Mermaid or CodeMirror installed**. Some of that margin belongs to the eventual stack, not to watch.
7. **No shared test helpers exist.** `flush()`, `afterFrames()`, `waitFor()` are duplicated verbatim across 6+ browser test files. Watch adds more. Extracting them is out of scope here but the duplication is now load-bearing enough to name.

## 5. Test strategy

- **jsdom unit:** `pollingDetector` with a fake `read` (change detected · identical content ignored · stop() halts); the debounce/coalesce logic; the pure anchor capture/restore maths; `handleWatchMessage` as a pure function incl. URL validation; snapshot bounds/eviction arithmetic; `buildStoredLines` with snapshots.
- **Real-engine (Chromium + Firefox), red-first, non-vacuous:**
  - `preserveReading` keeps mode and scroll across a re-mount — **red-first: without the flag, mode resets to `reading` (`mount.ts:151`) and scroll jumps**;
  - the anchor restores position when content is **inserted above** (the case `scrollTop` gets wrong);
  - both surfaces, via `describe.each` (the recurring two-surface gotcha, closed structurally as 6.1 did);
  - `resolveScrollContainer` resolves correctly per surface after extraction (regression pin for 003's trap);
  - zero-network across watch start/tick/stop using the **existing `/^https?:/i` predicate verbatim**, with the live control fetch (the M4 `remoteMedia` positive-control flake is why the control must be re-proven, not assumed);
  - `DB_VERSION` 2→3 preserves existing rows (the `idbVersionchange` suite is exactly this guard);
  - `wipeAll` erases snapshots; `describeStored` reports them and their bytes.
- **Measurement (not CI):** observer latency; re-render cost at 50 KB and 1 MB; the debounce window; bytes vs the **288,654 B** baseline; first paint vs **137.7 ms**.
- **Pins every task:** golden diff **EMPTY** — *and per the 5.1 correction, that proves nothing about chrome*, so the watch control's placement gets a **structural** DOM assertion; `manifest.test.ts` green **unchanged** (`permissions: []` — re-confirm, since a background `file://` read is a new capability shape).
- **Human gate (an agent cannot self-certify):** the relay round trip end-to-end; whether the anchor *feels* like your place; whether the update signal is noticeable-but-not-annoying; Firefox drag-only discoverability; cold-start behaviour; zero unexpected network with the Network tab open.

## 6. Task order — 005 (watch), seven groups

1. **Detection core** — the seam, `pollingDetector`, `observerDetector`, dead-observation handling. *(jsdom for the pure half; real-engine for the observer.)*
2. **The relay + the Firefox verification** — `WATCH_READ`, background listener, URL validation, and **§3-1's answer**. Blocks group 4's surface promise.
3. **Re-render continuity** — `scrollContainer` extraction, `readingAnchor`, `MountOptions.preserveReading`, the `mount.ts:151` change. **The riskiest group** (§4-1, §4-2).
4. **Watch UX** — control + its registry seam, active state, update signal, follow-at-bottom, lifecycle (§1.10), Firefox degraded state.
5. **MEASURE → tune** — latency, re-render cost, debounce window. *Measurement first, mechanism second.*
6. **Perf / bytes / pins / docs** — bytes vs **288,654 B**, first paint vs **137.7 ms**, golden + manifest pins, memory reconcile. **No PERMISSIONS.md trust-claim change** — 005 stores nothing.
7. **Human milestone-close gate.**

**Deferred to 006 (snapshots + diff), with its own Gear-3 cycle:** snapshot storage (`DB_VERSION` 3, the two-store split §1.7, bounds, eviction, byte accounting) · the `diff` dependency and engine · the diff view · the trust surface (`describeStored`/`wipeAll`/`EMPTY_SUMMARY`/**PERMISSIONS.md's "file contents are never stored"**). §1.7, §1.8 and §3-5 above are written for 006 and stand as its starting point.

---

*Gate: this plan is APPROVED. tasks.md (the ORDER) is drafted next — seven groups per §6 — for a separate human gate before any implementation code (WORKFLOW.md §5.3).*

***Four spec amendments ride with this plan's commit:***
1. **§3.1 scope** — 005 delivers **auto-reload + watch**; **diff-vs-snapshot moves to 006** with its own Gear-3 cycle (D-1). The spec remains the WHAT for the whole feature area.
2. **§3.2 framing** — the split is **per-surface-and-engine**, not per-engine. `FileSystemObserver.observe()` takes a `FileSystemHandle`; the content script has only a URL and there is no URL→handle API, so **that surface polls on Chromium too** (§1.1).
3. **§4 detection criterion** — *"While watching on Chromium, the system shall detect changes without polling"* is true of the **app page only**; narrow it.
4. **§4 re-render criterion** — the parenthetical *"003's and 004's persisted state must not reset"* implies all three already survive. **Only theme does.** TOC survives via 004's persistence round-trip; **Raw/Reading mode is actively reset at `mount.ts:151`** and is new work inside `mount()`. The requirement stands; the framing understates it.

*Additionally: §3.3/§3.4 (snapshots store contents; storage bounds) and the snapshot/diff acceptance criteria in §4 are marked **deferred to 006** rather than deleted — they are good criteria that land later. **PERMISSIONS.md's "file contents are never stored" claim stays TRUE for all of 005.***
