# Plan 006 — Snapshots + diff

**Status:** draft, revision 2 (Gear-3 gate 2 — awaiting human approval before `tasks.md`)
**Date:** 2026-07-23
**Spec:** `specs/006-snapshots-diff/spec.md` (approved gate 1, commit `528200c`). This plan is the HOW; it resolves the fifteen §7 risks against the actual code, not against the spec document.
**Evidence base:** a codebase recon at `528200c`, plus a full re-derivation of every citation at revision 1. Nothing is inherited from a 005 artifact. Where the spec and the code disagree, the code is quoted and the divergence is named. Two claims in revision 0 were falsified against the tree and are corrected in place (§3-6, §3-7) rather than silently dropped.
**Libraries:** one addition — `diff` (approved at 005's plan gate as D-2, backfilled into `decisions.md` at 006 gate 1; verified `decisions.md:5`). `dependencies` goes three → four (verified: `dompurify`, `markdown-it`, `markdown-it-task-lists`). Nothing else.
**Spec status:** §3.1–§3.8 are closed. This plan found none of them unbuildable. If implementation does, that is a STOP-and-flag, not a redesign.

---

## 0. Decisions SETTLED at this gate (2026-07-22)

*Every decision below gets a `decisions.md` entry, named here, landing with the commit that implements it — never after. 005 skipped this for its three plan-gate decisions and they were backfilled at 006 gate 1. Not repeated.*

**D-1 · The outgoing content comes from `mount()`'s EXISTING WeakMap, via a new exported getter. DECIDED.**
`decisions.md` entry: *"006 D-1 — the outgoing snapshot source is read from the reader-source WeakMap, not retained a second time"*

The recon dissolved most of spec §7-1. `mount()` already stashes every source it successfully renders: `mount.ts:202` — `registerReaderSource(host, source)` → `readerMode.ts:35` — `const sources = new WeakMap<HTMLElement, string>()`. This fires on every successful mount on both surfaces, including the app page's initial mount performed by the page rather than the watch controller (`readerPane.ts:179`), which is the case §7-1 was worried about. The app-page host is created once and reused for the controller's lifetime (`readerPane.ts:163-164`, rationale `:142-147`), so its WeakMap entry is the document on screen.

- **Mechanism:** export a getter from `readerMode.ts` beside the existing setter (`:39-41`). The watch controller reads it immediately before `render(...)` at `watchController.ts:293`. That read is a READ, not a STORE — §3.5's line held intact, because the value already exists and 006 neither creates nor extends its lifetime.
- **§7-2 collapses with it.** Steady-state retention today is one WeakMap copy plus at most one `pendingText` (`watchController.ts:219`). Sourcing from the WeakMap adds no third copy. The 3×1 MB figure §7-2 feared is not incurred by capture; it is incurred only while a diff renders, which §1.6 bounds separately.
- **THE STALE-AFTER-FAILED-RENDER CASE, and its answer.** The fallback path does not register: `readerMode.ts:37-38` states *"Called by mount() on the successful render path (the failure path builds its raw `<pre>` eagerly itself)"*, and `mountRawFallback` (`mount.ts:276-303`) makes no such call. So after a failed render the WeakMap holds the previous document's source — capturing that would store text that left the screen two renders ago. **The fix is to make the invariant total rather than to special-case it:** `mountRawFallback` registers the source too. This is correct on its own terms, not a workaround — that path sets `pre.textContent = source` (`mount.ts:292`), so the source genuinely is what is displayed. The invariant becomes *"the WeakMap holds what is currently on screen"*, with no exception to remember. Red-first proven in BOTH directions (§5, and see the direction-(b) control there — the WeakMap's sole reader today is the Raw view at `readerMode.ts:65`, so this changes what Raw shows after a failed render and the OLD behaviour is what must be pinned first).

*Rejected:* widening the `OnText` seam to carry prior text — `OnText` is single-argument (`changeDetector.ts:30`), it would touch both detectors, and the observer path has no prior text to hand over anyway (`observerDetector.ts:104-106`: *"Unlike pollingDetector, there is NO silent baseline read"*). Re-reading the file at watch start — §3.5 explicitly forbids a separate capture at watch-start, and the read would race the render it is supposed to describe. Having `watchController` retain its own copy — that is exactly §7-2's second full copy, duplicating state that already exists three lines away.

**D-2 · Seam pins are generalised to a SHARED, CALL-SITE-SCOPED helper before 006's second registry is added. DECIDED.**
`decisions.md` entry: *"006 D-2 — seam pins match the registration expression, not the file; one helper, two registries"*

*(Justification corrected at revision 1. Revision 0 argued "the blind spot triples"; that conflated the `registerWatchTarget` pin with 006's new seam, and it is false — 006 adds no second `registerWatchTarget` call site, so the existing pin's coverage is unchanged. The real argument is below.)*

The existing pin (`contentWatch.test.ts:101-127`) is file-scoped, not call-scoped: `:117-119` asks whether the file contains `createWatchController(` anywhere, not whether that registration uses it. A file with one correct and one hand-built registration passes green. Today that is safe — two production call sites (`appShell.ts:690`, `contentWatch.ts:119`), each in a file with exactly one registration.

006 adds a second registry (D-14/§1.4's diff target), and it needs the same class of pin. The choice is between copying a matcher with a known hole into a second place, or fixing it once and using it twice. Copying propagates the hole; and `appShell.ts` — the file that will hold both registrations, one per registry — is precisely where a file-scoped matcher is weakest, because a `createWatchController(` anywhere in it satisfies the watch pin regardless of which line the watch target actually came from. So: extract a shared source-text seam-pin helper that matches the registration expression itself, and use it for both `registerWatchTarget` → `createWatchController` and the diff registry's equivalent. The test's own header sanctions being argued with deliberately (`:31-32`); this is that argument, made on purpose.

*Rejected:* defer to a hardening pass — the second pin is written this milestone either way, so deferring means writing the weak version first. Copy the file-scoped matcher (propagates the hole). Leave it file-scoped and rely on review — review missed this class three times in M5; the pin exists because review is not the control.

**D-3 · The capture disclosure gets its OWN channel. It does NOT go in the watch-note slot. DECIDED.**
`decisions.md` entry: *"006 D-3 — capture disclosure is an additive channel, not a seventh writer of the single note slot"*

`watchRegistry.ts:128` holds one `let note: string | null`, with six unconditional production writers (`appShell.ts:658`, `:661`, `:682`; `contentWatch.ts:104`; `watchController.ts:266`, `:358`). Two facts make it the wrong home:

1. **Its semantic is the opposite of a disclosure.** `watchRegistry.ts:113-125` defines the channel as *"watching is not happening, and here is why in plain language"* — a failure or a platform limit. A capture disclosure says watching **is** happening and something additional is now true.
2. **`start()` clears it.** `watchController.ts:358` — `setWatchNote(null)` — fires on every start, which is precisely the moment §3.6 requires the disclosure to appear. A disclosure written into that slot at watch-start is destroyed by the same call that begins the watch, and one written after would be overwritten by the dead-read note at `:266`.

So: a separate slot and a separate element, rendered by `buildWatchChrome` (`watchControl.ts:256-262`) alongside the note rather than instead of it. **Arbitration rule, stated so it is not invented per-site:** the two are independent and may coexist; the note (a failure or limit) always renders first and closer to the control; the disclosure (informational) renders after it and is suppressed entirely while `watchAvailable()` is false — there is nothing to disclose about capture on a surface that cannot watch. It is additionally suppressed while the diff registry is empty (D-14), which is what keeps it off the content-script surface that *can* watch — see D-14, because this is exactly the case a `watchAvailable()`-only rule gets wrong.

**★ Persistence is load-bearing, and it is pinned here.** The disclosure is a persistent rendered element in `buildWatchChrome` — present for as long as capture is enabled and watch is available — **not dismissed, and not shown once.** This is not an incidental implementation detail: D-12's wipe-reset safety rests entirely on it (a user who wipes and then re-watches must see the disclosure again, exactly as a new user would). If implementation makes the disclosure one-shot, D-12 is void and the wipe-survival question reopens. Stated in those terms so it cannot be traded away silently at a wiring task.

*Rejected:* reuse the note slot (above — semantic collision plus `start()`'s clear). A toast — no toast primitive exists, and `watchController.ts:94-100` records in detail why 005 declined to build one (*"a new corner, a new stacking context, a new dismissal contract"*); building one at a wiring task is un-walked chrome. A modal or interstitial — spec §6 forbids it outright.

**D-4 · Two stores: `snapshotMeta` (per `docId`) + `snapshots` (per snapshot id). DECIDED.**
`decisions.md` entry: *"006 D-4 — snapshot metadata is split from snapshot content to stay inside idbCore"*

Confirmed against the code, not inherited. `IdbSchema` is `{ name, version, stores: ReadonlyArray<{name, keyPath}> }` (`idbCore.ts:24-29`) — note the spec and the gate-1 handoff both describe it as `{name, keyPath}`; that is the store shape, not the schema. No indexes, no compound keys, no cursors; the STOP comment is `idbCore.ts:5-9`. The decisive evidence is `idbCore.ts:116` — `getAll` documents its own assumption: *"small bounded stores — no cursor needed"* — and `describeStored()` materialises whole stores (`store.ts:308-313`). A single combined store would load every snapshot's full text on every trust-panel open. The split keeps listing, eviction and byte-accounting on small rows and fetches content only when a diff renders. No index is needed, so no escalation, and no new `idbCore` function — see C6's resolution in §1.2, which was redesigned specifically so `getAllKeys` is not needed.

*Rejected:* one store with content inline (the `getAll` problem above); reaching for `idb` (the STOP signal is real but this design does not trip it — escalating without needing to would spend the milestone's dependency budget twice).

**D-5 · Line endings are normalised at the DIFF and CAPTURE boundary. The DETECTOR is not touched. DECIDED.**
`decisions.md` entry: *"006 D-5 — CRLF is normalised for comparison and diffing; 005's content-compare detection is left exactly as shipped"*

§7-6 has two halves and they get different answers.

- **The differ half:** normalise both sides before diffing, or a CRLF working-tree document rewritten with LF reports every line changed. Evidenced: `git ls-files --eol` reports 11 working-tree-CRLF files at `528200c`, and all 11 confirmed byte-level CRLF (21–817 CRLF pairs each).
- **The detector half:** leave `changeDetector.ts:110` alone. A pure EOL flip *is* a change to the file on disk, and 005's exact-string content compare is load-bearing and documented (`changeDetector.ts:9-27`). Changing it would alter shipped 005 re-render semantics from inside 006.
- **The cost lands where it belongs — at capture.** If the normalised outgoing text equals the normalised incoming text, store no snapshot. The render still happens (005 unchanged); the storage does not. This satisfies §7-6's real worry (*"storing a snapshot of a document whose text did not change"*) without reaching into the detector.

*Rejected:* normalising in the detector (changes 005's shipped behaviour from a downstream milestone); normalising nowhere and documenting the artifact (the first CRLF document a user watches produces an all-changed diff — the feature's worst possible first impression).

**D-6 · No part of the carried anchor-correction item lands in 006. DECIDED — deciding no, explicitly.**
`decisions.md` entry: *"006 D-6 — the anchor's visible correction stays carried; diff does not become a re-render optimisation here"*

Spec §7-9 requires an explicit decision and sanctions "no". The item's premise — *"006's diff work knows what changed and could avoid the full replace"* — is true and is exactly why it is tempting. It is declined because it converts `mount()`'s commit path from a full `replaceChildren` (`mount.ts:201`) into an incremental patch, in the same milestone that already adds a schema bump, the first dependency since M1, a storage path, and a render-boundary crossing. `mount.ts:101-104` already carries M1's deliberate deferral of exactly this (*"A diffing / morphdom-style patch is a deliberately DEFERRED optimization"*). The carried item keeps its recorded home; it does not drift in.

**D-7 · 006 adds NO new bare-key shortcut. DECIDED.**
`decisions.md` entry: *"006 D-7 — the diff view is keyboard-reachable without a third global bare key"*

Two document-level keydown listeners exist, both permanently installed with once-guards and never removed: `readerMode.ts:124` (`'\\'`, `:26`) and `tocView.ts:914` (`` '`' ``, `:882`). `readerMode`'s resolves via `document.querySelector('peekover-root')` (`:128`, `HOST_TAG` `:16`) and is therefore **app-page-blind** — the app page's host is a `div.peekover-app__reader__host` (`readerPane.ts:163-164`). Unifying them is a carried item. The mockup binds diff to ⌘⇧D (`mockup.html:1310`), which is a modifier combination and a different question from the bare keys — but adding a third global listener before the existing two are unified compounds the item this milestone would inherit.

The a11y criterion (§5: *"reachable and dismissible by keyboard"*) is met by focusable controls plus Escape scoped to the diff view while it is shown — not a document-level global.

*Rejected:* inherit the unification task (it is a settings/hardening pass, and pulling it in here means touching `readerMode`'s host resolution mid-milestone); add ⌘⇧D now (a third permanent global listener, un-walked, in a milestone with four other structural changes).

**D-8 · Bound defaults are PROPOSED WITH REASONING in tasks, tuneable and not gated. The measuring task is FORBIDDEN from choosing. DECIDED.**
`decisions.md` entry: *"006 D-8 — snapshot bound defaults are proposed, measured, and chosen at a separate human gate"*

Unchanged from 005 §7-5 and the standing M1 rule. Nothing in the codebase measures bytes today (re-verified: zero `TextEncoder` occurrences anywhere in `src/`). The only eviction precedent that exists is the recents count cap, computed by pure `addRecent` and applied in the shell rather than the store (`appShell.ts:622-628`). This is the 004 D-2 shape that stopped a budget-breaching gate shipping: measure, then choose, in separate tasks, with the choosing human-gated. D-16's axis assignment (which bound is per-document, which global) goes to the same gate, because an axis and its number are only meaningful together.

**D-9 · §7-11 is CLOSED — the Firefox data-collection declaration does not change.**
`decisions.md` entry: *"006 D-9 — on-device snapshot storage is not data collection; `data_collection_permissions: {required:['none']}` stands"*

Re-verified at revision 1: generated at `wxt.config.ts:36` inside the Firefox-only branch (`:28-40`), documented at `PERMISSIONS.md:163-167`. No install-time user-visible string changes, so this does not return to a human gate. The `manifest.test.ts` pin stays green and unchanged.

---

### The four gate-1 questions, now answered

**D-10 · Revoking a folder ERASES that folder's snapshots. DECIDED.**
`decisions.md` entry: *"006 D-10 — revoke erases the revoked folder's snapshots; contents outlive access to nothing"*

`PERMISSIONS.md:39` promises, present tense and unqualified, that revoke *"drops the handle and its IndexedDB row"*. Snapshots keyed `folderId + SEP + path` (§1.1) surviving a revoke would leave file contents on disk after the user asked for access to be removed — making an already-published promise false, the exact class §3.3 exists to prevent.

The sharper argument comes from what revoke does today. `revokeAccess()` (`appShell.ts:972-980`) deletes the `folders` row (`:976`) and nothing else — that folder's recents and pins survive a revoke. That asymmetry is defensible for recents and pins because they are *"names only, never file contents"* (`store.ts:280`). It is not defensible for snapshots, which are the contents themselves. So D-10 is not a new policy; it is the existing policy applied to the first stored thing that is not a name. Revoke gains one call: delete every snapshot whose `docId` starts with `folderId + SEP` — **scanned on the delimiter, not the bare id.** `folderId` is generated by `newId()` (`appShell.ts:270`): `crypto.randomUUID()` where available (hex + hyphens), else the fallback `f-${Date.now()}-${idCounter}` (`:274`, digits + hyphens). Neither form can contain `SEP`'s six-character `\u0000` sentinel — literal text, not a NUL byte (`recents.ts:40-42`) — which `recents.ts:38-43` documents as collision-free for its own composite keys, so `SEP` is an unambiguous delimiter — but the fallback form *can* be a prefix of another (`f-100-1` prefixes `f-100-10`), so a bare `startsWith(folderId)` would over-delete on an erase path where over-deletion is silent and unrecoverable. Scanning on `folderId + SEP` is exact-boundary and safe precisely because `SEP` cannot appear inside `folderId` — the same argument `recents.ts:38-43` already makes, reused rather than re-derived.

*Rejected:* leave them and disclose it (the disclosure would read *"we kept the contents of files in the folder you just revoked"* — there is no honest phrasing). Erase recents and pins too, for symmetry — out of scope, a change to shipped 002/004 behaviour, and the asymmetry is justified rather than accidental.

**D-11 · Capture is NOT skipped while a diff is displayed — and the mechanism that guarantees it is DEFERRAL of the render, not a second capture path. DECIDED.**
`decisions.md` entry: *"006 D-11 — a displayed diff defers the re-render; the deferred render captures normally, so no state is lost"*

This is the consequence worked through rather than asserted, per the gate's instruction.

Spec §4 requires that a displayed diff is not silently replaced. Spec §3.5 requires a snapshot per render. Naively those collide: suppress the render and no snapshot is taken; render anyway and the diff is destroyed.

They do not actually collide, and the reason is that the outgoing content does not move while the render is suppressed. Concretely: the user is reading a diff of snapshot S against the on-screen document C. The file changes to C′. The controller defers — it does not render, and it holds C′ in the coalescer's existing single `pendingText` slot (`watchController.ts:219`, `:340`). On diff exit, the deferred render runs; at that moment `renderNow`'s outgoing read (D-1) still returns C, because C is still what is on screen. C is captured. Nothing is lost, and §1.1's one call site inside `renderNow` survives intact.

Two properties follow, and both are consistent with the spec rather than concessions:

- **Intermediate states during a long diff read are coalesced away**, exactly as they are during a cooldown. §3.5 already settles this: history is *"the sequence of states the user could have read — not a complete transaction log."* A state the user could not read because they were reading a diff is correctly absent.
- **The deferral must be visible.** §4 forbids only silent replacement, but a document that has changed with no indication is the same dishonesty one layer over. The diff view carries its own line — *"this document has changed again since you opened this diff"* — inside the diff view, not new global chrome and not a toast (D-3's rejection stands). Whether that line reads as useful or as noise is a §5 human-gate item.

*Rejected:* skip capture while a diff is up (reviewing one change costs you the next — the worst possible moment to drop history). Render underneath and rebuild the diff (spec §4 forbids it, and rebuilding silently re-bases the comparison the user is mid-way through reading). A second capture path that writes without rendering (breaks §3.5's per-render invariant and creates a snapshot of a state nobody saw — the transaction log §3.5 rejects).

**D-12 · The capture off-switch is its OWN ROW in the existing settings store — not a field on the shared `Settings` record. DECIDED.**
`decisions.md` entry: *"006 D-12 — the capture flag is a second settings row, so the content script never fetches a setting it cannot act on"*

006 is app-page-only (§3.2). A field on the shared `Settings` record would be fetched by the content script on every reader start, round-tripped through the background (`peekover:getSettings`), and acted on by nothing — a setting shipped to a surface that has no capture path.

And that path is trapped. `getSettings()` enumerates its fields by hand (`store.ts:185`): `return { ...DEFAULT_SETTINGS, theme: row.theme, tocOpen: row.tocOpen, tocWidth: row.tocWidth }`. A new `Settings` field would persist through `putSettings` and then vanish on read, with no type error and no test failure. This is the exact inverse of the pattern one screen away in the same file: `store.ts:243-247` made `StoredSummary.settings` required specifically so *"a future summary literal that forgets the field fails to compile"* — one construct turns the mistake into a compile error, the other makes it silent. That contrast is what turns D-12 from a preference into something close to forced.

**Mechanism:** the settings store is keyPath `'id'` (`store.ts:97`) and holds one row today, `SETTINGS_ID = 'reader'` (`:87`). The capture flag is a second row in the same store — no new store, no additional schema surface, and `getSettings()` is untouched because it reads by key. Consequences, stated so they are not discovered later:

- **`wipeAll()` resets the capture flag to its default (on), and the wipe confirmation copy states that wiping restores settings to their defaults, including snapshot capture.** This is a trust-surface product call, not bookkeeping, so it is argued as one. *Reset rather than survive*, because under D-12 `describeStored()` reads both settings rows: a flag that survived wipe-all would leave a lingering record the instant the user asked for everything to be erased — the panel then either reports it (and "wipe all data" visibly did not) or hides it (and the product acquires exactly the invisible state `PERMISSIONS.md` exists to deny). A wipe-all that does not wipe is a harder sentence to write than a wipe-all that resets a preference. *Safe*, because D-3's disclosure is a persistent rendered element in `buildWatchChrome`, not a one-shot notification — so a user who wipes and then starts watching sees the capture disclosure again, exactly as a new user would. The state is never hidden; it is re-defaulted and re-disclosed at the next moment it matters, which is the standard the house already uses. **This safety depends on D-3's persistence: if implementation makes the disclosure one-shot, this decision is void and the wipe-survival question reopens (pinned in D-3).**
- Erase-snapshots clears only the two snapshot stores, so the flag survives it. Correct — §4 requires erasing snapshots not erase settings.
- `describeStored()` must read both rows, or the panel hides a stored record and breaks the "no hidden state" posture (`store.ts:231-236`).

*Rejected:* a field on the `Settings` record (above — a dead setting on one surface, over `store.ts:185`'s live fuse). A third object store (a whole store for one boolean, and it would need its own `wipeAll` clause and its own summary line). Fixing `store.ts:185` to spread the row — tempting and probably right eventually, but it changes shipped 004 read semantics for every field from inside 006; it is named in §4 as a carried risk instead.

**D-13 · "Erase snapshots" is GLOBAL only in 006. Per-document erase is DEFERRED WITH A HOME. DECIDED.**
`decisions.md` entry: *"006 D-13 — one global erase-snapshots control; per-document erase is deferred, not rejected"*

§3.4 commits to the global control and that is what ships. Per-document erase is a reasonable expectation the moment §3.7's picker makes a per-document list visible — so it is recorded as deferred with a home (§6), explicitly not rejected: the reason it is out is scope, not principle. Shipping it now edges toward version-history-as-a-surface, which 005 §6 excludes and §3.7 restates.

---

### Two decisions this revision adds

**D-14 · The diff affordance's surface gate is the DIFF REGISTRY'S EMPTINESS — not `contained`, and not `watchAvailable()`. DECIDED.**
`decisions.md` entry: *"006 D-14 — a surface that registered no diff target grows no diff chrome at all"*

Spec §4 Surfaces requires no snapshot or diff affordance on the content-script reader, and §3.2 adds no explanatory note either. Nothing in `mount()` gates chrome by surface today: `mount.ts:153` builds `children[]`, `:181` pushes `...buildWatchChrome(host)` under no `contained` check, and both `mountReader.ts:90` (content script, no options) and `readerPane.ts:179` (`{contained:true}`) traverse that identical line. An unqualified "the diff view in `children[]`" therefore ships the affordance on the forbidden surface — and this is the defect class that reaches the human gate on the one surface no harness covers.

The gate is the registry-emptiness idiom — `mount.ts:174-177` states it deliberately (*"a surface that cannot watch grows no chrome at all"*) and it is the idiom 005 chose for this identical question. It is structural rather than a flag someone can forget to pass; `contained` is available at that exact site (`:154`, `:192`) but is the weaker property, and a boolean about layout is the wrong thing to hang a capability on.

**★ But it must be the DIFF registry, and this is the trap.** `watchAvailable()` is true on the Chromium content-script `file://` reader — `installContentWatch` registers a real controller there (`contentWatch.ts:119`). Gating on the watch registry would ship the diff pill on exactly the surface §3.2 forbids. So 006 adds a second, separate registry holding a diff target, registered only by `appShell.installWatchForFile` and by nothing in the content-script graph. `buildDiffChrome(host)` returns `[]` when that registry is empty.

And it returns `[]` **with no note branch**, unlike `buildWatchChrome`. `buildWatchChrome` (`watchControl.ts:256-262`) has a fourth state — a note with no control — because 005 had surfaces where the user would wonder. §3.2 states the opposite for 006: *"The user never saw a history feature on that surface, so there is nothing to be told they are missing. Do not add one."* The absence of a note branch is the decision, written into the function's shape.

This gate is load-bearing twice, and the second time is C7's. Because the engine is reached through the registry, `diffEngine.ts` (the only module importing `diff`) is imported by `appShell.ts` and by nothing `mount.ts` reaches. `mount.ts` imports the affordance builder only. So the same seam that keeps the affordance off the content-script surface keeps the dependency out of the content-script bundle. The import fence is stated in §1.4 and pinned in §5.

*Rejected:* gate on `contained` (weaker property, and a flag a fourth call site could forget). Gate on `watchAvailable()` (wrong answer on the Chromium content script — verified, not assumed). No gate, relying on the app page being the only caller (`mount.ts:181` proves both surfaces traverse one line).

**D-15 · The diff is a SIBLING VIEW behind a host attribute — NOT a third `MountOptions` field. DECIDED.**
`decisions.md` entry: *"006 D-15 — entering a diff is an attribute flip, not a re-render; mount() stays read-only library"*

*(Revision 0 left this undecided — §1.5 said "a new `MountOptions` field or a sibling view" while §2 listed the field as settled and §3-8 leaned on a property only the field route has. Decided here; §1.5, §2 and §3-8 are consistent below.)*

The mechanism is the one already shipped for the Raw view: build the view lazily into the shadow root, flip an attribute on the host, let CSS swap visibility (`readerMode.ts:60-80`; `setReaderMode` at `:71-75` is a pure attribute flip that *"NEVER re-runs parse/sanitize"*, `:1-8`). The attribute lives on the host, not on any child, for the reason `watchControl.ts:51-57` already states about `WATCH_HOST_ATTR`: `replaceChildren` destroys children on every render, host attributes survive.

Why this beats a `MountOptions` field, on the merits rather than by preference:

- **Entering a diff would otherwise be a full re-render.** A `MountOptions` field means calling `mount()` again — re-parsing, re-sanitizing and re-committing the whole document just to show a comparison, and colliding with `preserveReading`'s capture/restore (`mount.ts:199`, `:218`) on every entry and exit.
- **`mount()` has been read-only library for four milestones** (`readerPane.ts:16`). A third field is not the mistake 004 made — `MountOptions` has exactly two fields (`mount.ts:38-65`) threaded through three call sites — but a field that no call site passes and that only an in-shadow interaction sets would be a fourth thing, and the wrong shape.
- **The exit criterion gets easier, not harder.** §4 requires exit to restore the document and the reading place. The document DOM is never touched, so only the scroll position needs restoring — and `readingAnchor.ts`'s `captureReadingAnchor`/`restoreReadingAnchor` already exist and are already used for exactly this (`mount.ts:199`, `:218`, `:258-262`). The Raw-mode subtlety applies verbatim and must not be rediscovered: `mount.ts:251-257` documents that a hidden reading column has all-zero heading rects, so an anchor restore computed against them resolves to ~0 — a jump to the top. The diff exit takes the same rung: capture the anchor before hiding the column, restore after unhiding it.

**Mechanism, stated precisely:** `data-diff="active"` on the host, mirroring `WATCH_HOST_ATTR` (`watchControl.ts:57`); `:host([data-diff="active"]) .peekover-reader{display:none}` in `readerCss.ts`. It is a separate attribute from `data-mode`, deliberately — `readerMode.ts:129` guards its shortcut on `hasAttribute('data-mode')`, so adding a third value there would change the shipped Raw toggle's semantics. Entering a diff from Raw is legal; the previous `data-mode` is untouched and is simply what the reader returns to. `mount()` clears `data-diff` on the success path (beside its existing `setReaderMode` at `:206`) and on the fallback path (beside `host.removeAttribute('data-mode')` at `:282`), so a diff is never carried across a document switch — the one-line touch this decision costs `mount.ts`.

**M5's four cheapness conditions, re-derived for THIS mechanism** (§7-8 requires the shape be followed or the departure argued):

| condition | holds? |
|---|---|
| additive | yes — a new attribute, a new CSS rule, a lazily-built sibling. No existing field's meaning changes; committed output with no diff open is byte-identical. |
| defaulted-off | yes — the attribute is absent until the user asks. |
| read at exactly one site | **two sites, argued not claimed.** One is presentational — the CSS selector controlling visibility; one is a guard — the controller's deferral predicate (D-11). Neither can diverge from the other: both read the same host attribute directly, with no derived state, no cached copy and no second source of truth between them. M5's condition exists to prevent a flag's meaning drifting across readers; two readers of one attribute cannot drift. |
| old behaviour proven red-first | discharged on the exit path, and separately on D-1's Raw-view direction-(b) control (§5). |

*Rejected:* a third `MountOptions` field (above). A separate route or tab (spec §3.7 forbids it). Re-using `data-mode` with a third value (changes `readerMode.ts:129`'s shipped guard).

**D-16 · Count is PER-DOCUMENT; age and total bytes are GLOBAL. DECIDED — the axis; the numbers go to D-8's gate.**
`decisions.md` entry: *"006 D-16 — snapshot count is bounded per document, bytes and age across the store"*

§7-5 requires the algorithm be specified rather than emergent, and which bound applies to what is the axis that makes global-vs-per-document a materially different product.

- **Bytes: GLOBAL.** Forced by spec §4: *"shall not evict other documents' snapshots in the attempt"* — a clause that only makes sense if eviction normally can cross documents.
- **Count: PER-DOCUMENT.** "Keep the last N states of this document" is the unit the user reasons in, and it is the unit §3.7's picker displays. A global count cap means opening a second watched document silently evicts the first document's history for no reason the user can see — loss discovered by surprise, which §4 forbids.
- **Age: GLOBAL.** Age is a property of a snapshot, not of a document; per-document and global produce identical evictions. Global is simply the honest phrasing, and it is what the retention policy sentence (§4: *"bounded by count, age and size"*) can state plainly.

There is deliberately no global count cap — the total is bounded by bytes, and two caps on the same axis is a bound nobody could reason about.

### 0.1 Decisions this plan needs that the SPEC DOES NOT COVER — flagged, not guessed

Gate 1's four are answered above as D-10…D-13. Two remain, both narrower, both surfaced by this revision.

1. **Whether the "changed again while you were reading this diff" line ships.** D-11's deferral is required; §4 forbids only silent replacement. The line is the plan's proposal, not the spec's requirement, and it is a new sentence of product copy. Ship it, or defer the copy and let exit simply show the newer document? My lean is ship it — a document that changed with no indication is the same dishonesty one layer over — but it is copy, and copy is yours.
2. **What happens to a document's snapshots when its recents row is evicted.** `appShell.ts:622-628` auto-evicts recents by a count cap. Snapshots are keyed `folderId + SEP + path` (§1.1), independent of the recents row, so today's answer is "nothing" — the history survives, invisible in the reopen hub until the file is opened again. That is defensible (the user never asked to erase it) but it is a document with stored contents and no visible entry pointing at it. Leave it, or tie snapshot life to the recents row? My lean is leave it — the storage panel discloses the bytes either way, and tying contents to a cap the user never sees would delete history by surprise.

---

## 1. Architecture & data flow

### 1.1 Capture — one call site, sourced from state that already exists

The whole capture path is one read and one conditional write, at `watchController.ts:293`:

```
renderNow(text, target):
    outgoing = readerSourceFor(target)      // D-1 — a READ; the value already exists
    ... existing capture of wasAtBottom (mount.ts geometry) ...
    render(text, target, {contained, preserveReading:true})     // :293, unchanged
    ... existing signal / cooldown / follow ...
    if (captureEnabled && outgoing != null && normalise(outgoing) !== normalise(text))
        void storeSnapshot(docId, outgoing)  // D-5; fire-and-forget, never awaited
```

And one condition added to the existing coalescer at `onText` (`watchController.ts:324-342`), which is the whole of D-11:

```
onText(text):
    ...
    if (diffDisplayed(target)) { pendingText = text; return }   // defer; no timer armed
    ... existing cooldown / coalesce, unchanged ...
```

The deferred text is flushed by the existing `flushPending` on diff exit. `cancelPending()` (`:234-240`) already cancels timer-and-intent together and every teardown path already calls it, so a document switch during a displayed diff drops the pending text exactly as it drops a cooldown-pending one — the cross-feed bug `:224-233` documents does not reappear here.

Three properties this shape buys, each mapped to a spec criterion:

- **"Per render, not per change" (§3.5)** is free — this sits inside `renderNow`, which the coalescer already calls once per visible update (`watchController.ts:307-322`), and D-11 keeps it there.
- **"No separate capture at watch-start" (§3.5)** is free — `start()` (`:345-361`) is not touched.
- **"If storing a snapshot fails … complete the re-render normally" (§4)** requires the write to be outside the timed block. `watchController.ts:277-304` times the whole synchronous block deliberately to set the cost-proportional cooldown (`:299-301`, DECISION 3). An awaited write would inflate the measured cost and inflate the cooldown with it. So the write is issued after `readyAt` is computed and its promise is never awaited — a rejection is swallowed to the designed state, never surfaced as a blocking error.

**Document identity:** `docId = folderId + SEP + path`, where `SEP` is the exact composite-key separator `recents.ts:38-43` already defines and documents — a printable six-character sentinel (literal text, never a NUL control byte), collision-free because a UUID or `f-…` `folderId` can never contain it. The convention is reused, not re-derived: `SEP` is exported from `recents.ts` and imported here rather than re-declared, and `RecentRecord`'s stated identity carries over (`store.ts:60` — *"Identity is (folderId, path)"*, though its stored keyPath is a generated `id`). App page only, so the content-script `url` form 005's plan sketched is not built (§3.2). The `folderId` prefix is what makes D-10's revoke-erase a `folderId + SEP` prefix scan rather than a join.

### 1.2 Storage — two stores, `DB_VERSION` 2 → 3

Per D-4:

- `snapshotMeta` — keyPath `docId`, holds `{ docId, entries: [{ id, ts, bytes }] }`
- `snapshots` — keyPath `id`, holds `{ id, text }`

`DB_VERSION = 2` at `store.ts:36`; `STORES` at `:39-44`; `SCHEMA` at `:90-99`. The upgrade is additive-by-name and never drops or migrates (`idbCore.ts:56-63`), so this is two `SCHEMA` entries and a version bump with no migration code. `onversionchange` close-and-drop already exists and covers the bump (`idbCore.ts:64-74`, `store.ts:110-119`).

**Bytes:** `new TextEncoder().encode(text).length` — synchronous and exact. Written into `snapshotMeta.entries[].bytes` at capture time, so eviction and the usage figure never read content.

**Eviction, as one specified algorithm** (§7-5 requires this be specified, not emergent; axes per D-16):

1. Before the write, the single-oversized case short-circuits: if one snapshot's bytes exceed the global byte bound on its own, it is not stored and nothing is evicted (§4, verbatim).
2. After a successful write, evaluate all three bounds against `snapshotMeta` alone and delete oldest-first until all three hold simultaneously — which is what satisfies *"when more than one bound is exceeded, the store shall be within all three afterwards"*. Per-document count evicts within its own document; global age and global bytes evict oldest-first across documents.
3. Eviction is visible (§4: loss shall not be discovered by surprise) — the storage panel states the policy and the current usage, and the diff picker shows what history exists rather than implying more.

**★ Deletion ordering: META FIRST, then content.** *(This reverses revision 0, which specified content-first. The reversal is the point, so it is argued rather than swapped.)* Revision 0 chose content-first so a crash between the two writes leaves an orphaned content row — "invisible, reclaimable". It is invisible; nothing reclaims it. Bytes are accounted in `snapshotMeta`, so an orphan consumes storage the accounting no longer knows about, and the trust panel under-reports actual usage, indefinitely — a trust surface understating what is held is the one direction it must never fail in. Meta-first inverts both properties:

- The resulting failure mode is a meta entry pointing at missing content — which is the state §4 already requires be handled: *"If a snapshot's content cannot be read, then the system shall state that the comparison is unavailable and shall leave the rendered document reachable."* No new degradation path is invented; an existing required one absorbs it.
- It is self-reclaiming, but **LAZILY** — and the word must not be read as "promptly reclaimed". The reclaim fires only when someone opens a diff against that specific snapshot; at that point the diff path finds a missing content row, states the comparison is unavailable, and drops the dangling entry, so the accounting corrects itself. Until that read happens, the dangling entry's `bytes` still count toward the **global** byte bound (D-16), so phantom bytes can evict real snapshots in the interim. This is a real window, named — not a defect to fix here. *(Targeted check, confirmed: eviction evaluates the three bounds against `snapshotMeta` alone — nothing on the eviction path reads a content row, by D-4's design — so there is no eager reclaim, and the diff-read is the only reclaim path. If a future change put a content-row read on the eviction path, the reclaim would become eager and this window would dissolve; it does not today.)*
- It fails in the safe direction: bytes are briefly over-reported. We may claim to hold more than we do; we never claim to hold less.

This is also why D-4 needs no new `idbCore` function — a `getAllKeys` sweep was the only other way to close C6, and adding one, however small, is a nudge toward the `idbCore.ts:5-9` STOP signal for a problem the ordering solves outright.

### 1.3 The trust surface — and where the correction actually reaches

`describeStored()` (`store.ts:306-331`) gains a snapshot count and total bytes read from `snapshotMeta` only, plus the capture-flag row (D-12). `buildStoredLines()` (`store.ts:266-298`, pure) gains a line. `StoredSummary` (`store.ts:237-252`) gains the field — and that is a compile-time forcing function by prior design: `store.ts:243-247` records that `settings` was made required at 005 task 5.2 precisely so *"a future summary literal that forgets the field fails to compile"*. The duplicated `EMPTY_SUMMARY` literal at `appShell.ts:487-494` must gain it or the build breaks — which is the intended behaviour, not an obstacle.

`wipeAll()` (`store.ts:210-216`) clears stores explicitly and sequentially; it gains two `clear()` calls. The new control — erase snapshots without erasing anything else (§3.4, D-13) — is a sibling that clears only the two snapshot stores.

**★ The correction reaches CODE, not only `docs/trust/PERMISSIONS.md`.** This is the recon's largest finding against the spec and it drives the amendments at the foot of this plan:

| site | what it says |
|---|---|
| `storageControls.ts:26-27` | `CONTENTS_NEVER_STORED_NOTE` — *"Peekover never stores the contents of your files…"*, rendered unconditionally at `:182` (header `:12-13` states the unconditionality is deliberate) |
| `store.ts:280` | *"— names only, never file contents."* |
| `store.ts:289` | *"Theme / display settings — stored on-device, no file contents."* |
| `tests/browser/wipe.browser.test.ts:119` | `expect(text).toContain('never file contents')` — green, and pinning a claim 006 makes false |
| `src/app/appShell.test.ts:715` | same assertion, same problem |
| `src/app/appShell.test.ts:716-718` | **a THIRD assertion revision 0 missed** — `expect(panel!.querySelector('[data-note="contents-never-stored"]')?.textContent).toMatch(/never stores the contents/i)`. It pins `CONTENTS_NEVER_STORED_NOTE`'s text and its `data-note` hook — i.e. it pins the very string the correction must rewrite. |

Two further sites in `appShell.test.ts` are fixtures, not assertions, and are named so they are not mistaken for either: `:655` is a hand-rolled mirror of `buildStoredLines` inside the test, and `:697` is a summary literal. Both embed `store.ts:280`'s copy. Neither guards anything — which is the problem: `:655` silently diverges from production if the real line changes.

In `PERMISSIONS.md` the claim sentence appears three times — `:42` (*"File contents are never stored."*), `:45` (*"No file contents are stored"*), `:82-83` (the meta-claim about the claim). Spec §3.3's "three places" is correct at that scope. What is broader is the correction surface: closely-related phrasings at `:39`, `:40`, `:41`, `:42` (twice more), `:44`, `:49-50`; and derived facts that go stale — *"four stores"* and *"`DB_VERSION` 2"* (`:42`), *"clears all four stores"* (`:42`), the compound at `:45` (false four ways after 006: *"Nothing"*, *"no snapshot, no history, no cache"*, *"adds no IndexedDB store"*, *"`DB_VERSION` is unchanged at 2"*), `:84` (*"no cache, no history, and does not touch `DB_VERSION`"*), the ledger heading `:31` and its parenthetical `:33-35`.

**Ordering constraint (§7-10):** all of it — doc, code strings, and the three test assertions — lands in the same commit as the first code that stores a snapshot. That is a task-order constraint, expressed in §6.

### 1.4 The diff — engine, the seam it is reached through, and the import fence

`diff`'s line API against `normalise(snapshotText)` and `normalise(currentText)` (D-5). The library returns hunks; the markup is ours. Both sides go through the unchanged `parse → sanitize` path (`mount.ts:116`) — a diff of an agent-written file is untrusted input on both sides (§3.8, AGENTS.md #3).

Line granularity survives the transform because it is applied to source and displayed against blocks (§3.8). No sub-line spans; deferred with a home (§6 of the spec).

**Registration seam.** The diff view is reached from the reader chrome, so it inherits the seam rule verbatim from plan 005 §1.9 and `watchRegistry.ts:4-16`: the control is rebuilt on every mount; the thing it drives is not. `mount()` rebuilds chrome on every render via `replaceChildren` (`mount.ts:201`), including the renders a running watch causes — so the affordance holds no reference and asks a module-level registry at click time. This is the third instance of the same pattern (`registerThemeSaveSink` → `watchRegistry` → here), and it is copied, not re-derived. D-2's generalised pin covers both registries.

The gate is that registry's emptiness (D-14): `buildDiffChrome(host)` returns `[]` when nothing is registered, with no note branch, so the content-script surface grows neither an affordance nor an explanation (§3.2, verbatim).

**★ The import fence, and it is load-bearing (C7).** The dependency must not enter the content-script module graph:

- `src/render/diffChrome.ts` — the affordance + the registry read. This is the only diff module `mount.ts` imports. It imports no engine.
- `src/render/diffEngine.ts` — the only module that imports `diff`. Imported by `appShell.ts` (which constructs and registers the diff target) and by nothing `mount.ts` reaches.
- `src/render/diffView.ts` — hunks → sanitized markup. Takes hunks as data; imports no engine. **Imported by `appShell.ts`, never by `mount.ts`** — the view is constructed on the app-page side that builds the diff target; `mount.ts` importing it would drag the view into the content-script graph and put the hole back in the fence it is the point of §1.4 to close.

So the surface gate and the bundle fence are the same seam. If `diff` ever appears in the content-script bundle, that is a STOP-and-flag — it would mean the fence broke, and §3.2 with it. §5 pins it both statically and by measured bytes.

### 1.5 The diff VIEW — inline, sibling, and the fallback named before building

Mechanism per D-15 — a lazily-built sibling behind `data-diff` on the host, not a `MountOptions` field. The exit path restores the document (untouched) and the reading place via the existing `readingAnchor` pair, taking `mount.ts:251-257`'s hidden-column rung.

**The fallback, named now** (§7-8 requires it be sanctioned in advance): if the diff cannot be produced or rendered, the rendered document stays on screen and the failure is surfaced beside it — the diff is never entered, and `data-diff` is never set. This is the same shape as `watchController`'s dead-read policy (`watchController.ts:259-267`): explain without a re-render, so the last good render stays exactly where it is. Never blank (AGENTS.md #5), and there is no improvisation left for implementation to do under pressure. The same fallback absorbs the missing-content-row case §1.2's ordering deliberately routes into it.

### 1.6 Memory while a diff renders

This is where §7-2's real ceiling sits, now that capture no longer adds a copy (D-1). Rendering a diff holds: the current source (WeakMap), the snapshot's text (fetched), the hunks, and the rendered output. The plan asserts no threshold — the standing M1 rule — and §5 measures it at 1 MB against the requirement that the document remains usable.

### 1.7 Design translation — tokens verified, placement re-measured

§7-14's token risk does not materialise, and this was checked before use rather than after (004's sepia deferral is what skipping it costs). `--del` and `--del-soft` are defined in `readerCss.ts:36` (light) and `:48` (dark), byte-matching `design/tokens.css:8` / `:20`. `--ok`/`--ok-soft` likewise (`readerCss.ts:35`/`:47`, `tokens.css:7`/`:19`). The sepia block (`readerCss.ts:51-53`) overrides only paper/ink/accent, so both pairs inherit the light values in all three themes — no gap. The mockup's diff uses exactly them (`mockup.html:210-211`):

```css
.diff .add{background:var(--ok-soft);color:var(--ok)}
.diff .del{background:var(--del-soft);color:var(--del);text-decoration:line-through}
```

So this is a fill, not a decision — with one genuine exception: `--del` already carries a shipped semantic as the lit network indicator (`readerCss.ts:366`, described at `:353` as *"the one warm accent"*). Diff-removed would be its second meaning. That is a design judgement for the human gate, and it is not resolved by silently substituting a nearby token (the rule 004 broke).

**Two mockup divergences, recorded in-code so nobody later "fixes" them to match** — the `watchController.ts:14-31` precedent:

1. The mockup's diff is a modal overlay — `mockup.html:754`, `role="dialog" aria-modal="true"`, opened by `openDiff()` (`:1283`). Spec §3.7 requires inline in the reading column and §6 puts modals out. **The spec wins.**
2. The mockup frames snapshots as a version browser (*"Snapshot v3 · 2 min ago restored — every save is versioned locally"*, `:681`). Spec §3.7 makes the picker a diff-target selector, and 005 §6 keeps version-history-as-a-surface out. **The spec wins.**

Placement is re-measured with a throwaway rect probe, not chosen (005's 4.1 precedent, and the elimination reasoning at `watchControl.ts:17-28` is the worked example to follow). The existing bottom-left stack is network indicator (16) · theme pill (56) · watch pill (96); the diff affordance has to clear it, the TOC rail's live entry list, and the mode toggle. **A11y:** added/removed is conveyed by more than colour (§5) — the mockup's own `text-decoration:line-through` on removed lines is one carried signal, not the only one.

## 2. Files to create / touch

**Create**

- `src/app/snapshots.ts` — snapshot CRUD, byte accounting, the bounds/eviction algorithm (§1.2). Pure arithmetic split from the IDB calls so the eviction maths is jsdom-testable.
- `src/render/diffEngine.ts` — normalise + `diff` line API → hunks (pure, no DOM). The only module importing `diff` (§1.4).
- `src/render/diffView.ts` — hunks → sanitized markup; the view's build/enter/exit and the `data-diff` flip (D-15). Imported by `appShell.ts`, not `mount.ts` (§1.4).
- `src/render/diffChrome.ts` — the affordance + the diff registry read; the only diff module `mount.ts` imports (§1.4).
- `src/render/diffRegistry.ts` — the second registration seam (D-14).
- `src/watch/captureDisclosure.ts` *(or a section of `watchControl.ts` — one module either way)* — D-3's separate channel.
- Test files per §5, including the shared seam-pin helper D-2 extracts.

**Touch**

- `src/render/readerMode.ts` — export the source getter (D-1)
- `src/render/mount.ts` — register the source on the fallback path (`:276-303`, D-1); `...buildDiffChrome(host)` in `children[]` beside `:181`; clear `data-diff` on both commit paths (`:206`, `:282`) per D-15. No new `MountOptions` field.
- `src/theme/readerCss.ts` — the `:host([data-diff="active"])` visibility rule and the diff view's token fill (§1.7)
- `src/watch/watchController.ts` — the capture call at `:293` and the D-11 deferral in `onText` (`:324-342`)
- `src/watch/watchControl.ts` — render the disclosure alongside the note (`:256-262`, D-3)
- `src/watch/watchRegistry.ts` — the disclosure slot (D-3)
- `src/app/store.ts` — `DB_VERSION` 3, two stores, `wipeAll`, erase-snapshots, the capture-flag row (D-12), `describeStored`, `StoredSummary`, `buildStoredLines`, and the two trust strings at `:280`/`:289`
- `src/app/appShell.ts` — `EMPTY_SUMMARY` at `:487-494`; the diff target registration in `installWatchForFile` (`:649-691`); the snapshot-erase on revoke at `:976` (D-10, scanning `folderId + SEP`); the storage panel's snapshot line; the erase control
- `src/app/storageControls.ts` — `CONTENTS_NEVER_STORED_NOTE` at `:26-27`; the erase-snapshots affordance
- `src/watch/contentWatch.test.ts` — the pin, re-expressed through D-2's shared call-site helper
- `tests/browser/wipe.browser.test.ts:119`, `src/app/appShell.test.ts:715` and `:716-718` — the three assertions that pin the now-false claim (plus the two fixture mirrors at `:655`/`:697`)
- `docs/trust/PERMISSIONS.md` — same commit as the first storing code: a new capability ledger row, the claim sentence at `:42`/`:45`/`:82-83`, the related phrasings, and the derived facts (§1.3)
- `src/app/recents.ts` — export the existing `SEP` (`:43`, currently module-private) so the snapshot `docId` reuses the documented separator convention (`:38-43`) rather than re-declaring it (§1.1). No behaviour change to recents/pins.
- `package.json` — `diff`

**Explicitly NOT touched:** `src/watch/changeDetector.ts` (D-5) · `src/app/idbCore.ts` (§1.2's ordering removed the need) · `entrypoints/*` beyond wiring (an entrypoint wires; it does not decide or construct) · `tests/manifest.test.ts` (byte-unmodified since `3b6c575`) · `wxt.config.ts` (D-9).

## 3. Risk resolutions (spec §7 → concrete)

1. **Outgoing content on the observer path** → dissolved by D-1. `mount.ts:202` already retains it for every render on both surfaces, including the page-performed initial mount. Read, not stored.
2. **Memory cost of retaining it** → collapses with §7-1. No second copy is added. The real ceiling is the diff render (§1.6), measured at 1 MB, no threshold asserted.
3. **`idbCore`'s STOP signal** → D-4 confirmed against the code. The two-store split satisfies §4's bounds criteria with no index and no new `idbCore` function — eviction and accounting read `snapshotMeta` only, and §1.2's meta-first ordering removed the one reason a `getAllKeys` would have been needed. No escalation. *(Correction: `IdbSchema` is `{name, version, stores[]}`; the spec's `{name, keyPath}` is the store shape.)*
4. **Schema upgrade + duplicated literal** → additive-by-name, `idbCore.ts:56-63`; `EMPTY_SUMMARY` re-derived at `appShell.ts:487-494` (plan 005 said `:483`). The required `StoredSummary` field makes divergence a compile error by prior design (`store.ts:243-247`). **Note the gap:** `idbVersionchange.browser.test.ts` proves the versionchange choreography on throwaway DBs and asserts nothing about existing rows surviving — §5 adds that.
5. **Byte accounting and eviction ordering** → specified in §1.2 as one algorithm, with axes fixed by D-16, both the multi-bound and single-oversized cases, and a deletion ordering argued rather than assumed. Nothing measures bytes today (zero `TextEncoder` in `src/`); this is greenfield.
6. **Line endings** → D-5, split into differ (normalise) and detector (untouched), with the cost taken at capture. **Evidenced and corrected at revision 1:** 11 CRLF working-tree files, byte-verified. No fixture under `tests/fixtures/` or `tests/golden/` is CRLF, so the hazard is structurally invisible to the suite and §5 builds a CRLF fixture from explicit `\r\n` escapes rather than from a checked-out file. *(Revision 0 described the other nine as spec documents and `src/` modules; in fact four are test sources — `src/app/appShell.test.ts` and three `tests/browser/*.browser.test.ts`. The conclusion is unchanged — none is a fixture — but the enumeration was wrong and is corrected here rather than quietly.)*
7. **Registration seams** → D-2 generalises the pin to a shared call-site-scoped helper before the second registry exists. Both registries follow `watchRegistry.ts:4-16`'s control-is-rebuilt/controller-is-not rule. At least one test per seam drives the production entry path.
8. **The render boundary, again** → D-15 decides the mechanism (sibling view, not a `MountOptions` field) and re-derives M5's four cheapness conditions against it, including the one — read at exactly one site — that revision 0 asserted for a mechanism it had not chosen, and that revision 2 states honestly as two argued-non-diverging readers. §1.5 names the fallback before building.
9. **The carried anchor item** → D-6: no. Explicitly decided, not drifted past.
10. **Trust-correction ordering** → §1.3. Site count and shape re-derived from the file: the claim sentence is genuinely at three sites (spec §3.3 was right at its scope), but the correction surface extends to related phrasings, derived facts, three code strings and three green test assertions the spec does not mention. Same commit as the first storing code, and §6 moves capture wiring into that group so the correction describes something true.
11. **Firefox data collection** → D-9: closed, no change. No install-time string changes; no human gate.
12. **The disclosure surface** → D-3, with the arbitration rule stated, including the D-14 suppression that keeps it off the content script. The human gate judges whether it reads as honesty or noise — that is the acceptance test and it is budgeted in §5.
13. **Bound defaults** → D-8: proposed with reasoning; measured; the measuring task is forbidden from choosing; the choosing is a separate human gate, which D-16's axes go to as well.
14. **Design translation** → §1.7. Tokens verified present in all three themes; two mockup divergences recorded; placement re-measured with a rect probe.
15. **Keyboard shortcuts** → D-7: no new bare key. The `readerMode` app-page-blindness (`:128`) is confirmed and stays carried.

## 4. Risks & unknowns this plan still carries

1. **★ `getSettings()` enumerates fields by hand.** `store.ts:185` — `return { ...DEFAULT_SETTINGS, theme: row.theme, tocOpen: row.tocOpen, tocWidth: row.tocWidth }`. Any new `Settings` field is silently dropped on read — it would persist, then vanish, with no type error. This is the exact inverse of the pattern one screen away in the same file (`store.ts:243-247` made a `StoredSummary` field required so omission is a compile error). D-12 routes around it rather than through it; the trap itself remains live for whoever adds the next field.
2. **The capture write is fire-and-forget by design (§1.1), so a persistently failing store is invisible.** §4 requires the re-render complete normally and the failure not block — satisfied. But a user whose quota is exhausted gets silence. The degradation criterion (*"say that history is unavailable rather than failing silently"*) covers the schema case; the per-write case is thinner.
3. **★ App-page first paint has ZERO automated coverage, and 006 ships to the app page.** `scripts/perf-first-paint.ts` navigates a `file://` document and triggers on `<peekover-root>` acquiring populated shadow content (`:51`, `:117`, `:122-127`, `:314`) — the content-script surface, exclusively. So the render cost of the diff work on its own surface is unmeasured, not bounded — a weaker claim than "within budget", and it must not be stated as the latter. This joins the harness ledger's existing gaps (Firefox first paint, the content→background transport, cold-start theme flash). The human gate is the only thing that will notice if opening a folder gets sluggish.
4. **`--del`'s second semantic** (§1.7) is a design judgement no test can settle.
5. **The two-store split is not atomic.** `idbCore` writes one store per transaction (`idbCore.ts:97-109`); there is no multi-store transaction helper. §1.2's meta-first ordering makes the crash window benign and self-reclaiming (lazily — see §1.2), but it is a real window, and adding a multi-store transaction to `idbCore` would be the STOP signal.
6. **The real content→background transport still has zero automated coverage** — where M5's shipping defect lived. 006 is app-page-only (§3.2) precisely to stay off it, so this is a risk the milestone avoids rather than carries. Named so the avoidance is not mistaken for coverage.
7. **No shared browser-test helper module** — `flush()`/`afterFrames()`/`waitFor()` duplicated across 6+ files. 006 adds more. Still carried, now more load-bearing.
8. **Carried item — `scripts/perf-first-paint.ts` prints a false verdict on the large-doc fixture.** It compares the 1 MB fixture against the typical-doc gate (`:372-373` computes the scope label and then prints PASS/FAIL against `GATE_MS` regardless), self-labels the comparison informational on the same line, and prints `FAIL`. This is the harness-ledger class — an instrument that lies — corrosive in both directions. Already recorded, correctly framed, at `docs/ai/progress.md:285-291`; this plan re-lists it as carried and does not fix it.
9. **★ `SEP` becomes a shared constant across two subsystems, and a change to it silently orphans every snapshot.** §2 puts `src/app/recents.ts` on the touch list to export `SEP` (module-private at `:43`) so `docId` reuses the documented separator (§1.1) rather than re-declaring it. The coupling that buys: recents-identity and snapshot-identity now depend on one value — and if `SEP` ever changes, existing snapshot `docId`s stop matching. Meta rows point at content nobody can find, and D-10's `startsWith(folderId + SEP)` revoke scan stops matching the folder it must erase. Nothing throws; it just silently misses — the failure is *silence*, not a crash. The plan's intent is a comment at the export site warning the constant is now load-bearing for two subsystems, so the caution lives where someone would be about to break it.
10. **The separator's literal value must never be written as an escape a tool might decode.** `SEP` is the six visible characters backslash-u-0-0-0-0 (`recents.ts:40-42`), not an embedded NUL control byte; that literal text now appears in this plan and will appear again in `snapshots.ts` and its tests. AGENTS.md's control-character rule forbids the byte, and a real NUL is invisible in every normal diff — one was introduced and excised once while `plan.md` was being edited. Any task that writes this text must carry a byte-level NUL-count check (must read zero), the guard STEP 0 of this gate ran on both artifacts.

## 5. Test strategy

- **jsdom unit:** the eviction algorithm (multi-bound; single-oversized; oldest-first ordering; per-document count vs global bytes/age, D-16) · byte accounting · `normalise` + `diffEngine` hunks incl. CRLF, trailing-newline and empty-input cases · `buildStoredLines` with snapshots · the disclosure arbitration rule (D-3) · D-2's shared call-site seam pin, applied to both registries.
- **Real-engine (Chromium + Firefox), `describe.each` over both surfaces, red-first and non-vacuous:**
  - **D-1's stale case — red-first against the pre-fix tree:** force a render failure, then assert the captured source is the displayed one, not the previous document's. Must go red before the `mountRawFallback` fix, with the count of what goes red checked, not just the colour (M5 finding 2).
  - **★ D-1's direction (b), the control M5 needed 8× and revision 0 omitted:** the WeakMap's sole reader today is the Raw view (`readerMode.ts:65`), so registering on the fallback path changes what Raw shows after a failed render. Pin the OLD behaviour first — the Raw toggle on a failed render behaves identically before and after — exactly as §1.5 does for the diff-exit path.
  - **★ D-14: the diff affordance is ABSENT on the content-script reader**, and no explanation appears there either (§3.2). Red-first proven by ungating it. This is the criterion for the surface no harness otherwise covers.
  - **D-11:** a change arriving while a diff is displayed does not replace the diff, and the state on screen is captured when the deferred render runs on exit. Both halves, or the decision is only half-proven.
  - **D-10:** revoking a folder erases that folder's snapshots and leaves another folder's intact — including the delimiter case: a `folderId` that is a string prefix of another folder's id must NOT have its snapshots erased by the first folder's revoke (the `folderId + SEP` boundary, D-10).
  - `DB_VERSION` 2→3 preserves existing rows — the gap §3-4 identifies in the current `idbVersionchange` suite.
  - erase-snapshots leaves folders/recents/pins/settings intact, including the capture flag (D-12); `wipeAll` erases snapshots and resets the flag to its default.
  - the diff renders inline and replaces the rendered document; exit restores the document and the reading place — pre-006 exit behaviour red-first (D-15).
  - a dangling meta entry (content row deleted, meta surviving) lands in §4's designed "comparison unavailable" state, leaves the document reachable, and drops the entry (§1.2's lazy self-reclaim).
  - diff status is conveyed by more than colour (structural assertion, not a screenshot).
  - **zero-network** across capture, eviction and diff, using the existing `/^https?:/i` predicate verbatim, with the control fetch shown live in the same test (the `remoteMedia` flake is why the control is re-proven, never assumed).
  - a **CRLF fixture built deliberately from explicit `\r\n` escapes**, since no fixture in the tree is CRLF (§3-6) and a checked-out file cannot be relied on for it.
- **Pins every task:** golden diff EMPTY — and per the standing correction that proves nothing about chrome or placement, so the diff affordance gets a structural DOM assertion that it is a sibling of `.peekover-reader`, verified red by appending it inside (`mount.ts:162-166` states why this is the only guard) · `tests/manifest.test.ts` green and byte-unchanged · `permissions: []` on both built manifests · **the import fence:** `diff` appears in no content-script module graph (§1.4), asserted statically and cross-checked against the measured content-script byte delta.
- **Measurement (not CI):** capture cost against the 50 KB ≈ 34.9/35.7 ms and 1 MB ≈ 717.3/713.9 ms synchronous baselines (`progress.md:325`) with a like-for-like control (005 showed layout moved rather than added, and only the control made that visible) · diff memory at 1 MB · first paint vs 138.6 ms (content script; the app page is unmeasured — §4-3) · bytes vs 299,411 / 332,895 B, with `diff` expected in the app-page number and not in the content-script one · `pnpm zip` vs 335.89 / 335.95 kB.
- **Human gate (an agent cannot self-certify):** whether the persistently-visible capture disclosure reads as honesty or as nagging (§7-12) — now load-bearing for D-12 as well, since the wipe-reset's safety rests on that line re-appearing persistently rather than surviving as hidden state · whether D-11's "changed again" line reads as useful or as noise (§0.1-1) · whether the inline diff is legible at real document sizes · `--del`'s second semantic · the diff affordance's discoverability · app-page responsiveness after 006 (§4-3 — nothing else will notice) · Firefox everything (Playwright cannot load an extension into Firefox) · zero unexpected network with the Network tab open.

## 6. Group order and the ordering constraints it must respect

*Sequencing only — this is not task decomposition. `tasks.md` at gate 3 owns that, in a fresh session.*

The two hard constraints, both from the spec rather than from convenience:

- **The trust correction lands in the same commit as the first code that stores a snapshot** (§3.3, §7-10). This is why capture wiring moves into group 1 (revision 1; revision 0 had storage in group 1 and capture in group 2). Split across groups, group 1 would ship storage wired to nothing — the M5 defect class, three instances — while `PERMISSIONS.md` announced that contents are stored when nothing stored them. Moving the correction later instead is the alternative, and it is worse: it leaves a shipped window in which the published claim is false. So group 1 is end-to-end: schema → storage → the D-1 getter and fallback fix → the §1.1 call site → the whole correction.
- **D-2's pin generalisation lands before the diff registry exists**, or the new seam's pin is written against a matcher with a known hole and then has to be rewritten.

**Group order:** schema + snapshot storage + capture wiring + the whole trust correction → the disclosure channel (D-3) → D-2's shared seam-pin helper → diff engine → diff view + its registry, gate and import fence (D-14, D-15) → measure (capture cost, diff memory, perf/bytes/pins, the import fence) → bound defaults and axes chosen at a human gate (D-8, D-16) → milestone-close human gate.

---

*Gate: this plan is a DRAFT awaiting gate 2. On approval, `tasks.md` — the ORDER — is the next artifact and the next gate, generated in a fresh session (C14). No implementation code before `tasks.md` is approved (WORKFLOW.md §5.3).*

***Two spec amendments ride with this plan's commit*** *(strikethrough-and-annotate in place, the pattern 005 §7-1/§7-4 and 006 §3.4 already use — original preserved, marked superseded, pointed here):*

1. **§3.3** — *"states `"File contents are never stored"` … in three places"* is **not corrected as to count — it is correct.** What is superseded is its **scope**: the claim sentence does appear at three sites in `docs/trust/PERMISSIONS.md` (`:42`, `:45`, `:82-83`), but the correction surface is broader than that document. The same claim lives in shipped product code — `storageControls.ts:26-27` (rendered unconditionally at `:182`), `store.ts:280`, `store.ts:289` — and is asserted by **three** currently-green tests: `tests/browser/wipe.browser.test.ts:119`, `src/app/appShell.test.ts:715`, and `src/app/appShell.test.ts:716-718`. Related phrasings and derived facts elsewhere in `PERMISSIONS.md` go stale alongside them (§1.3). The same-commit rule covers all of it, not the document alone.
2. **§7-10** — *"Re-derive the site count and the ledger row's shape from `docs/trust/PERMISSIONS.md` itself"* is superseded: re-derive from the file **and** from `src/` **and** `tests/`, and treat the three green test assertions as part of the correction rather than as collateral breakage to be fixed afterwards.
