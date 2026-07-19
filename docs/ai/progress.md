# Progress — Peekover
*The file every session reads first. Keep the "Now" section honest.*
*Updated: 2026-07-19.*

> **Closed-milestone narrative lives in [`progress-archive.md`](progress-archive.md).** This file is the
> working set: what is true today, what is next, what is carried, and the current numbers. If you want the
> step-by-step evidence behind a closed milestone, follow the link from its close summary below.

## Now (start here)

**M4 is CLOSED. Nothing is in progress. The next action is a spec-005 kickoff in a FRESH session.**

- **M1 (001), M2 (002), M3 (003), M4 (004) are all fully closed** — code-complete, human-gated, retro'd.
  **Nothing on any of them is outstanding**, and no work of any kind on 001–004 remains to be started.
- **NEXT MILESTONE: M5 — spec 005, watch mode + diff** (the Phase-1 differentiator; roadmap in
  `docs/product/spec.md` §Phase-1). **NOT STARTED.** No spec folder, no plan, no tasks.
- **Its first action is a Gear-3 kickoff, in a FRESH session** (WORKFLOW.md §5.3), in this order and no
  other: **spec.md (the WHAT, no tech) → human gate 1 → plan.md (the HOW) → human gate 2 → tasks.md →
  human gate 3 → only then implementation code.** Do not write implementation code before tasks are
  approved.
- **Before the first task of any group, re-read the standing rules that keep costing time when skipped:**
  `docs/ai/decisions.md` (the harness ledger, the dead ends, the gate procedure — all three promoted
  2026-07-19) and `docs/ai/retro.md` (newest entry first).

## Closed milestones

**M4 · spec 004 — themes + settings · CLOSED 2026-07-19.** Auto/light/dark with sepia deferred (D-1),
persisted in the existing IndexedDB with **`permissions: []` still intact** — no manifest permission was
spent — applied coherently across the app shell and **both** reader surfaces through one theme-host
registry, plus the 003 TOC rail's open-state and width carried over as a single global preference. Eight
groups: store foundation · `SettingsPort` + messaging seam · theme runtime + host registry · flash
MEASURE-then-mitigate · settings UI on both surfaces · TOC carry-over · re-measure + trust docs · the
human gate. The headline engineering result is a **negative** one, and it is the milestone's best work:
group 4 built the paint gate D-2 specified, measured it, found it breached the <150 ms budget on **every
cold typical-doc open** by a cost that was **insensitive to the deadline** (75 ms → 172.7 ms; 40 ms →
172.9 ms), and **deleted it** — shipping D-2's own recorded fallback (mount Auto + an instant re-theme).
The **8.1 milestone-close human gate PASSED**, both engines, both surfaces, fresh production builds,
Network tab open, **with no defects found** — the first milestone whose gate found nothing, which the
retro answers rather than celebrates (verdict: **discipline-dominant**; the boundary moved for
*coherence* via computed-token assertions and `emulateColorScheme`, **not** for *appearance* — contrast,
legibility and occlusion are exactly as gate-only as in M3, so **the gate stays load-bearing**). The gate
also discharged the three items groups 6–7 deferred into it (Firefox first paint · end-to-end TOC
carry-over through the real messaging→background→IndexedDB path · the narrow-viewport theme-pill
occlusion eyeball) — none of them is open. → narrative:
[archive § M4](progress-archive.md#m4--spec-004--themes--settings--closed-2026-07-19) · decisions:
`decisions.md` 2026-07-18 (D-2 + its correction of record) and 2026-07-19 (stored-vs-applied split; the
three promoted entries) · lessons: `retro.md` 2026-07-19 (the **vacuous persistence test** defect class;
inference-does-not-survive-configuration; pin scope; the harness-honesty loop; the `git checkout`
process failure).

**M3 · spec 003 — TOC / navigation · CLOSED 2026-07-17.** An in-reader right-side table-of-contents rail
serving **both** reader surfaces from one `mount()`-seam compose: pure `buildTocModel` + `buildTocView`,
click/Enter scroll by element ref, host-rooted scroll-spy, backtick toggle, pointer-drag resize.
`permissions: []` intact, zero network on every TOC action. The 6.2 human gate caught **1 real defect** a
158-test green real-engine stack missed — the rail rendered fully **TRANSPARENT** with the column
reserving no room for it — establishing the **"visual occlusion is gate-only"** defect class that every
milestone since plans around. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-16/17 · lessons: `retro.md` 2026-07-17.

**M2 · spec 002 — active-source foundation · CLOSED 2026-07-15.** Peekover's second surface — a dedicated
full-tab app page that reads a chosen folder of markdown from disk — shipped **without spending a single
manifest permission** (folder access via user-gesture web APIs; consent is at-use, visible, revocable).
The `FolderSource → MarkdownFile[]` seam is the one engine boundary; everything above it is
engine-agnostic. The 6.3 human gate caught **3** defects the green stack missed (containment ·
drag-navigation · the storage-UI gap). → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-15 · lessons: `retro.md` 2026-07-15.

**M1 · spec 001 — core render pipeline · CLOSED 2026-07-14.** The reader itself: detect → hide-raw →
mount → parse → markdown-it/GFM → DOMPurify → shadow-DOM themed reading → Raw toggle →
block-remote-media → never-blank fallback, on Chrome + Firefox, `permissions: []`, ~270 KB packed. Its
gate caught **2** defects, both invisible to jsdom: a pre-opt-in remote-image **fetch leak** (the
"a detached node doesn't fetch" assumption is FALSE — the safe property is an *inert* document) and the
Firefox mount-timing regression. → narrative:
[archive § task log](progress-archive.md#task--session-log--newest-first--m1--m3-close--the-004-planning-gates)
· decisions: `decisions.md` 2026-07-14 · lessons: `retro.md` 2026-07-14.

**The human-gate score: 6/6** — six milestone-shipping defects, **all** caught by the milestone-close
gate, across M1+M2+M3. **M4 contributed zero defects and zero misses**, so the ratio is unmoved; the
denominator did not grow because nothing shipped past the gate to move it. *A clean gate is evidence
about the BUILD, not about the GATE* (retro 2026-07-19).

**Product progress (rough):** M1 opened build-order phase 1-of-7 (product spec §11). Spec-level
milestones are finer than the 7 phases (roadmap after 001: 002 sources · 003 TOC · 004 themes+settings ·
005 watch+diff · … ~a dozen to v1.0), so a precise product % is **deferred** — honestly this is early
foundation, ~fourth of ~12+ spec-milestones. Don't over-read the fraction.

## Baselines / pins
*Current measured truth, as of the M4 close (7.1, 2026-07-19). This section is MUTABLE — each milestone's
close task overwrites the numbers and moves the previous ones into the "vs" column. It lives here, not in
decisions.md, because decisions.md is dated append-only and a current-numbers table cannot be corrected
there without either lying or duplicating.*

| pin | at M4 close | previous (003) | bound | verdict |
|---|---|---|---|---|
| First paint, typical doc (50.4 KB) | **137.7 ms** | 133.5 ms | <150 ms **GATE** | PASS |
| First paint, 1 MB / ~1400-entry TOC | **1248.6 ms** | 1196.3 ms | <1.7 s (informational) | PASS |
| Content script (`.output/chrome-mv3/`) | **288,654 B** | 284,744 B | none — **stated, not gated** | — |
| `pnpm zip` Chrome / Firefox | **327.61 / 327.66 kB** | 323.63 / 323.69 kB | <2 MB | PASS |
| Suites | 384 unit · 314 browser (both engines) | 350 · 166 | — | green |

- **HEADROOM IS THIN — the number to know before spending margin.** The typical-doc budget now sits
  **~7–12 ms from its ceiling** on this hardware (i7-13700, Windows, headless Chromium). A second
  independent 7-iteration pass read median 140.3 ms with a single warm iteration at **150.9 ms**, over the
  bar. Both medians PASS and the gate is on the median — but the next perf-touching session should know
  this before it assumes room.
- **The +4.2 ms since 003 is NOISE, not regression, and the spread is why:** the **floor did not move**
  (min 132.6 ms, *below* the 4.2-session min of 133.1 ms — real added cost raises the floor, noise raises
  only the middle), and the run-to-run median spread (2.6 ms) is the same magnitude as the delta.
- **Every first-paint number here is CHROMIUM.** `perf-first-paint.ts` cannot drive Firefox
  (decisions.md 2026-07-19, harness ledger). Firefox first paint is evidenced only by the human gate.
- **The 1 MB harness line prints `-> FAIL`** because it compares the 1 MB fixture against the *typical-doc*
  bar and self-labels the comparison informational. That is the known ~8× reading (decisions.md
  2026-07-14), **not** a breach. Do not read it as a regression.
- **Standing pins, all green at close:** `git diff tests/golden/output/` **EMPTY** · `tests/manifest.test.ts`
  **8/8 and byte-unchanged** since M2 (so `permissions: []` is re-proven by an unmodified test) · huge-doc
  `sha256=8bc5094c…e61bbd` intact · `pnpm lint` clean.
- **Measurement protocol (unchanged since M1 — keep it, so numbers stay comparable):** 7 iterations, run 1
  discarded as cold, **median of the warm 6**, min/max as spread. **No threshold is ever asserted from a
  measurement task** (standing M1 retro rule).
- **A pin certifies exactly the stage it observes.** "Golden diff EMPTY ⇒ the reading column is untouched"
  is **FALSE** — that suite snapshots `sanitize(parse(source))`, upstream of `mount()`, and stayed empty
  through the 5.1 chrome addition. Before citing a pin as evidence, break the property and check it goes
  red (retro 2026-07-19, finding 3).

## Up next

**Immediate: spec 005 — watch mode + diff.** Gear-3 kickoff in a fresh session (see Now). Nothing else is
queued ahead of it.

**Carried items — banked deliberately, each with a recorded home. Do NOT guess at any of them; every one
is either measurement-driven or explicitly deferred.**

- **Comment-only nit, to ride along with the NEXT `src/render/tocView.ts` touch.** `clampTocWidth`'s doc
  comment claims a non-finite input yields `TOC_MIN_WIDTH` "via Math.min/Math.max's NaN propagation being
  caught by the caller's guard". **The comment is wrong twice; the CODE is right.**
  `Math.max(180, Math.min(480, NaN))` is **`NaN`** — NaN propagates through both, it is not clamped by
  them — and the caller does not "catch" it: `applyStoredTocWidth` guards with `Number.isFinite` and
  **returns early**, so `clampTocWidth` is never called with a non-finite value at all. The guard is
  correct and load-bearing (without it the restore path writes the literal `"NaNpx"` and silently kills
  the `--toc-w` custom property). **Only the doc comment needs fixing** — describe the function as
  *partial* on non-finite input, guarded by the caller. No behaviour change, no test change.
- **Sepia stays DEFERRED** (D-1 = A; `design/tokens.css` defines only 4 of ~15 sepia tokens, so completing
  the palette is a brand/design decision, not an implementation fill). A candidate for a later themes pass.
- **Unify the two keyboard shortcuts on ONE host registry.** 003 left `` ` `` (TOC toggle) on a host
  registry while readerMode's `\` still resolves differently and is inert on the app page. The
  inconsistency is deliberate and recorded (decisions.md 2026-07-17) — **revisit at a settings/hardening
  pass, or the next time `readerMode`'s shortcut host-resolution is touched.**
- **Chunked/virtualized *TOC-tree* render** — the many-heading lever (003 §5.1: ~45 ms rail build @1401
  headings, scales ~linearly). **NOT forced for typical docs**; revisit at N-thousand headings
  (decisions.md 2026-07-17).
- **Chunked/virtualized *folder-tree* render** — the large-folder lever. 6.2 measured the pure
  walk+build+filter as **cheap** (~7 ms typical, ~40 ms at the 5000-file cap); the suspect is `treeView`
  laying out one DOM node per file+dir. **Decide from a real-browser tree-render measurement** (the
  deferred half of 6.2), not from a guessed bound.
- **Chunked/virtualized *reader* render** — the M1-carried large-*doc* first-paint lever (decisions.md
  2026-07-14). Same class, different surface; 003's 5.2 and 004's 7.1 both confirmed no first-paint
  regression, so it stays carried rather than forced.
- **Restore GFM table alignment safely** (map to a class, never an inline style) — carried from M1;
  spec 003 §Out-of-scope leaves it to table work.

**Roadmap:** 003 TOC/navigation ✓ · 004 themes+settings ✓ · **005 watch mode + diff** (the
differentiator) · … full order in `docs/product/spec.md` §Phase-1.

## Blockers / open questions

- **No blockers, and nothing waiting on a human.** M1–M4 are all fully closed (code + the named human gate
  + retro). Nothing outstanding on any of them.
- **The gaps that 8.1 closed are closed as *findings*, but remain gaps in AUTOMATED coverage** — Firefox
  first paint, the real end-to-end settings/TOC round-trip through the background, and the cold-start theme
  flash. They were never known defects; the gate walked all three and found nothing. **But a future change
  touching those paths still has no test that can see it** — and per the harness ledger (decisions.md
  2026-07-19) there is **no roadmap to any**. Plan coverage accordingly; do not assume CI will catch a
  regression there.
- **OPEN QUESTION (an M2 finding, NOT an 004 defect — recorded so it is not lost). Dropping a single `.md`
  file onto the app page does nothing; only folders work.** Found by the human during the 8.1 session. 004
  touched no folder/drop code and this did not affect the gate result; it is **spec-002 / M2 territory**.
  **UNVERIFIED — do not assume either way.** The evidence points at folder-only **BY DESIGN**:
  `docs/trust/PERMISSIONS.md`'s ledger describes only folder drop/pick in all three of its rows; M2 is the
  "active-source foundation", where the FOLDER is the source; and the architecture is folder-shaped
  throughout (`FolderSource → MarkdownFile[]`, `folderId`-keyed recents/pins, remembered directory handles
  — a lone file has no `folderId` and no handle worth persisting). **But that is inference from surrounding
  artifacts, not verification.** **Two checks would settle it:** (1) does `docs/product/spec.md` state
  "open a single file from the app page" as a feature at all? If the product answer is "single files open
  via `file://` through the content script; the app page is the FOLDER surface", then folder-only is
  coherent by design. (2) does the drop handler bail **SILENTLY**? `getAsFileSystemHandle()` returns
  handles for files *and* directories, so the code very likely checks `kind === 'directory'` — the real
  question is whether the user gets **any** feedback. **Worth flagging regardless of the answer:** a
  reasonable gesture producing total silence is its own small **never-blank (#5)** gap. Even if
  single-file open is correctly out of scope, a line like *"Drop a folder — single files open directly
  from your file manager"* would close it cheaply. *Recorded only — not investigated, not fixed.*
- **Watch item (not a blocker): the `remoteMedia.browser.test.ts` positive control flaked once on Firefox**
  during 7.1 — *"DOES fire the requests after opt-in"* read `[]`. Green in isolation (4/4, both engines)
  and on full re-run (38/38 · 314/314), and 004 touches nothing in `mediaPolicy.ts`, so: a flake, not a
  regression. **The reason it is watched rather than shrugged off is the SHAPE:** the flaky half is the
  **positive control**, the thing whose job is to prove the zero-leak assertion is non-vacuous — had it
  flaked the other way, the non-negotiable zero-network count would have been certified by an empty
  buffer. **If it recurs, the fix is to AWAIT the request, not sample for it.** (retro 2026-07-19,
  finding 1.)
