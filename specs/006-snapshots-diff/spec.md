# Spec 006 — Snapshots + diff

**Status:** draft (Gear-3 gate 1 — awaiting human approval before `plan.md`)
**Scope:** **006 delivers the second half of F6's watch cluster** — snapshots and diff-against-history. Split out of 005 at its plan gate (`specs/005-watch-diff/plan.md` §0 D-1). 005's spec remains the WHAT for the shared feature area; this spec is the WHAT for 006 and **amends 005 in two places** (§3.4, and the foot of this document).
**Date:** 2026-07-22
**Milestone:** M6 · builds on 005 (watch mode, CLOSED)
**Structure:** follows WORKFLOW.md §5.3 (`spec.md` = the WHAT, no tech). Mirrors 005's section shape; `specs/_template-spec.md` carries no section this omits.
**Evidence base:** no new probe. This spec rests on 005's approved spec and plan, the M5 close baselines (`docs/ai/progress.md` § Baselines / pins), the M5 retro, and `docs/trust/PERMISSIONS.md` as it stands today. **Every `file:line` and every number cited from a 005 artifact must be re-derived by `plan.md` against the actual tree, not inherited** — plan 005 §1.7's own line references have already drifted.

---

## 1. Problem & value

005 made the reader **follow** a file as an agent rewrites it. It did not make **what changed** legible.

Today, when a watched document updates, the reader shows the new document and nothing else. The version the user was reading a moment ago is gone the instant it is replaced — there is no record of it. So the user can see *that* something changed (005's update signal) but not *what*, and on a 400-line spec, finding the three edited paragraphs by re-reading is slower than not watching at all.

That is the half of *"watch my agent work"* that is still missing. 005's own §1 names both halves and ships one: *"makes the reader follow a file as it is written, and makes what changed legible."*

**Who it serves:** the same persona 005 serves, at the next step of the same task — the AI-tool developer reading the CLAUDE.md/specs/plans their agents generate (product spec §3), who now wants to **review** the agent's work rather than merely watch it arrive. Secondarily the technical writer checking what their last save actually altered.

## 2. User stories

- As a reviewer of an agent's work, I want to see **what changed since earlier**, so I can judge the edit rather than re-read the whole file.
- As a reader whose document just updated, I want to reach that answer **without leaving the reading column** or opening another tool.
- As someone reading a long document, I want **reading to stay the default** — the diff is something I ask for, never something that happens to me.
- As a security-conscious user, I want to know that Peekover now **stores the contents of documents I watch**, to see how much is stored, and to erase it — without having to destroy my folders, recents, pins and settings to do so.
- As a user who does not want any of this, I want **one switch** that stops it.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — snapshots and diff-against-this-document's-own-history. Nothing else.** IN: capturing snapshots of watched documents, bounding and disclosing that storage, and rendering a diff of the current document against a chosen snapshot. OUT, each with a recorded home (§6): compare-any-two-files, agent-file awareness/badges, session-transcript rendering, the MCP bridge. Those four were deferred at 005's gate 1 and **are not re-opened here**. This is the last of F6's headline items in this cycle.

**3.2 006 ships to the APP PAGE ONLY. The content-script `file://` reader gets no snapshots and no diff — DECIDED.**

The content script has no storage of its own; it reaches storage only through the background. Extending snapshots to it does not merely add message types — **it changes the background's character.** Today the background is a *stateless fetch proxy*, and that is precisely what dissolved 005's §7-6 watch-lifetime risk (plan 005 §3-6: *"dissolved by §1.2: the loop lives in the page, the background is a stateless proxy. No SW state to lose."*). Making it a storage proxy would round-trip whole document contents — up to a megabyte — through `runtime.sendMessage`, on a transport with **zero automated coverage**, which is exactly where M5's one shipping defect lived.

The product cost is narrower than it first appears: 005 already established that **Firefox watch is app-page-only** (§7-1, measured — Gecko's URI policy closes both halves of the relay). So this decision does not create an asymmetry; it means full snapshots and diff on the app page, on **both** engines, and watch-without-history on one engine's second surface.

Two consequences stated so they are not silently reversed:

- **This is a named deferral, not a silence.** §6 records it with a home.
- **The content script gets no new affordance and no explanatory note.** 005's standing rule is to explain where a user would otherwise wonder why a control does nothing — but there is no control here to explain. The user never saw a history feature on that surface, so there is nothing to be told they are missing. **Do not add one.**

*Rejected:* extending the relay to carry snapshot traffic in 006 (above); shipping diff on the content script against snapshots captured elsewhere (a document identity mismatch and a half-feature).

**3.3 Snapshots store FILE CONTENTS, and that changes published trust claims — DECIDED.**

This inherits 005 §3.3 unchanged in substance and states what it costs in practice. `docs/trust/PERMISSIONS.md` states *"File contents are never stored"* (and a variant, *"No file contents are stored"*) in **three places**; one of them is a compound claim that 005 keeps *"no snapshot, no history, no cache"* and does not touch `DB_VERSION`, and a fourth site — the ledger's own section heading — enumerates the milestones it covers. **★ AMENDED BY the 006 gate-2 plan (§1.3, and the plan's amendment note): the SCOPE broadens — the count is not corrected.** *"three places"* is right for the claim *sentence* in `docs/trust/PERMISSIONS.md` (`:42`, `:45`, `:82-83`). What the plan re-derives is the correction's *reach*: the same claim also ships in product code — `storageControls.ts:26-27` (rendered unconditionally at `:182`), `store.ts:280`, `store.ts:289` — and is asserted by **three** currently-green tests (`tests/browser/wipe.browser.test.ts:119`, `src/app/appShell.test.ts:715`, `src/app/appShell.test.ts:716-718`). The same-commit rule below therefore covers all of it, not this document alone. The count is kept, not corrected, so it is not re-litigated.

- **Store the contents, and say so plainly.** No content-hash-only workaround: it would yield change detection but not diff, and this product's character is disclosure, not minimisation-by-trick (005 §3.3).
- **Not literally an AGENTS.md #4 permission event** — no manifest permission changes, `permissions: []` is untouched — **but treated with the same weight.** PERMISSIONS.md is corrected **in the same commit as the first code that stores a snapshot**, never a follow-up.
- **PERMISSIONS.md is a *capability* ledger, not a claims list.** Its own rule: a permission/capability change and its justification land in the same PR. 006 adds a capability, so the correction is **a new ledger row in the established format** *plus* the four sites above — not four string replacements.
- **The claims that must remain true:** nothing leaves the device, and everything stored is visible and erasable.

**3.4 Storage bounds are DISCLOSED DEFAULTS, not user settings — DECIDED. This AMENDS 005 §3.4.**

Retention is bounded on **count, age and total bytes — whichever binds first**, evicting oldest-first. The values are product defaults, stated plainly in-product, and **not adjustable by the user in 006**.

005 §3.4 promised limits *"visible and adjustable"*, and one 005 §4 criterion promised the user could *"adjust the limits"*. **Only the adjustable half is amended.** Visible limits, visible current usage, and visible eviction all survive and are criteria in §4 below.

- **Why:** 005 §7-5 concedes the numbers are guesses until real documents and real agent-write patterns are observed, and both it and plan 005 §1.7 specify defaults *"tuneable, not gated"* — meaning **we** may change them without a gate, not that the user tunes them. Exposing guessed numbers as a user-facing control hardens them into an interface before we know what they should be, and adds a settings surface, validation and persistence to a milestone already carrying a schema bump, the first dependency since M1, a render-boundary crossing and a trust-claim correction.
- **What is kept from the promise:** §3.4's section title said *"user-visible controls"*, and one control ships — **the user can erase stored snapshots without erasing folders, recents, pins and settings.** Wipe-all remains, but it is a disproportionate remedy for "stop storing my document contents", and a product whose character is *everything stored is visible and erasable* should not force that trade.
- **How the amendment is recorded:** 005's folder stays as historical record (C12). The amendment uses the strikethrough-and-annotate pattern 005 §7-1 and §7-4 already use — original text preserved, marked superseded, pointed here. *Kept, not deleted, so it is not re-opened from scratch.*

*Rejected:* shipping adjustable limits in 006 (above); a single axis (count alone is unbounded in bytes; bytes alone lets one large document evict every other document's history).

**3.5 A snapshot is THE CONTENT LEAVING THE SCREEN, captured only for watched documents — DECIDED.**

- **Only watched documents.** Opening and reading a file that nothing is writing stores **nothing**. Capture happens because a change was observed, not because a document was opened. This is what makes the storage story defensible: the set of documents with history is the set the user deliberately pointed watch at — small, intentional, and already visible to them. It also satisfies 005 §4's Trust criterion *"the system shall not store any snapshot without the user choosing to"*: **the watch gesture is the choosing**, and §3.6's off switch is the way to decline it. Recorded explicitly so nobody later reads that criterion as demanding a second opt-in.
- **Per render, not per change.** 005's cooldown coalesces rapid updates, so a burst of agent writes may produce far fewer renders than changes. A snapshot corresponds to **something that was actually displayed**. History is therefore the sequence of states the user could have read — not a complete transaction log of the file, which would store states nobody ever saw and would be harder to disclose honestly than what it buys.
- **No separate capture at watch-start.** At the first watch-driven render, the outgoing content *is* the baseline, so the first diff is available immediately after the first change. Nothing is written to disk until a change actually occurs: press watch on a file nobody edits, walk away, and **no content was ever stored**.
- **Acquiring the outgoing content in memory is a READ, not a STORE.** Establishing what is currently on screen may require reading the document once when watching begins. That is not a snapshot and must not become one. The distinction is stated here because it is exactly the kind of thing implementation collapses.

*Rejected:* snapshot every opened document (turns a reader into an archiver; storage grows with browsing rather than intent); snapshot on an explicit per-change user action (the state to be captured is already overwritten by the time a user could react); an explicit baseline write at watch-start (makes pressing watch write file contents to disk by itself — a materially harder sentence for the disclosure, for no gain).

**3.6 Capture is ON by default once watching starts, with one off switch — DECIDED.**

The user has already made an explicit gesture by starting watch (§3.5). Requiring a second opt-in before any history exists means the **first** change is never captured — and the first change is the one that prompts the question. The feature would be useless exactly when it is first wanted.

- The off switch is **one** setting that disables capture entirely, reachable from the surface where snapshots are disclosed.
- Turning it off stops future capture. Erasing what already exists is the separate act in §3.4.
- **Disclosure is owed at the moment capture begins**, on a surface the user is already looking at — not only in a panel they must go find. This is the standard 005 set twice for degradation (*explain in plain language at the moment it matters*) and M2 set for Firefox's read-only folder snapshot. **The surface is `plan.md`'s to choose; a blocking modal or interstitial is out** (§6).

*Rejected:* off by default (loses the first change every time); per-document opt-in (a settings decision at the moment the user least wants one).

**3.7 The diff renders INLINE in the reading column — DECIDED.**

Not side-by-side, not a separate view, not a new tab. Product spec F6 sanctions *"inline or side-by-side"*; this picks one, and side-by-side is recorded in §6 rather than rejected outright.

- **Why inline:** a second column competes with 003's TOC rail for horizontal space, and the rail is already the constrained resource on a narrow window. And an inline diff is the only form that could eventually *reduce* re-render work — which regions changed is knowledge the render path can use — where a parallel view can only add to it.
- **The diff replaces the rendered document while it is shown, and reading returns on exit.** Reading is the default state; diff is a mode you enter.
- **A snapshot picker is a diff-target selector, not a version browser.** 005 §6 puts *"version history as a product surface"* out of scope — snapshots exist to serve diff. Choosing which snapshot to compare against serves the diff; presenting stored versions as a browsable document-history feature does not, and is out (§6).

*Rejected:* side-by-side (§6, F6's other sanctioned form); a separate route or tab (breaks §2's "without leaving the reading column"); a permanently-on annotated render (diff is asked for, not imposed).

**3.8 The diff is computed on SOURCE TEXT, at LINE granularity — DECIDED.**

- **On source, not on rendered output.** The source is what the agent wrote and what the user is asking about. Diffing rendered output would couple the diff to markup decisions and complicate the sanitization story for no user-visible gain.
- **Line granularity, because it survives the transform.** The diff is computed on source text and displayed against rendered output; a changed source line maps to a changed rendered block. Sub-line (word or character) spans do **not** survive: they would have to be carried through markdown → HTML and landed inside DOM nodes the parser produced. That is a substantially harder problem nobody has scoped, and it is deferred with a home (§6) rather than assumed away.
- **Diff output goes through the unchanged parse → sanitize path** (AGENTS.md #3). A diff of an agent-written file is untrusted input **on both sides** — the snapshot as much as the current document.

## 4. Acceptance criteria (EARS)

**Capture**

- When watch observes that a watched document's content has changed and the document is re-rendered, the system shall retain the content that was displayed before that render as a snapshot.
- When watch is active and no change has occurred, the system shall store no snapshot content.
- When a document is open and not watched, the system shall store no snapshot for it.
- While snapshot capture is disabled, the system shall store no snapshot content, and shall watch and re-render exactly as 005 specifies.
- If storing a snapshot fails, then the system shall complete the re-render normally and shall not present the failure as a blocking error.

**Retention & bounds**

- While snapshots exist, the system shall keep them within a default maximum **count**, a default maximum **age**, and a default maximum **total bytes**, whichever binds first.
- When any bound is exceeded, the system shall evict oldest-first, and **the user shall be able to see that this happened** — loss shall not be discovered by surprise.
- When more than one bound is exceeded, the system shall leave the store within all three afterwards.
- If a single document's content exceeds the total byte bound on its own, then the system shall not store it, and shall not evict other documents' snapshots in the attempt.
- When the user views stored data, the system shall show **how much snapshot storage is in use** and shall state the retention policy — bounded by count, age and size, discarded oldest-first.

**Diff**

- When a document has at least one snapshot, the system shall offer a way to see what changed.
- When the user asks what changed, the system shall render the difference **inline in the reading column**, replacing the rendered document while it is shown.
- When the user exits the diff, the system shall return to the rendered document, preserving their reading state to the standard 005 §4 already requires.
- When a diff is shown without further selection, the system shall compare the current content against the **most recent** snapshot.
- When more than one snapshot exists, the system shall let the user choose which one the current content is compared against.
- When rendering a diff, the system shall mark each line as added, removed or unchanged, and shall convey that distinction by **more than colour alone**.
- If the compared contents are identical, then the system shall say so rather than present an empty column.
- If a snapshot's content cannot be read, then the system shall state that the comparison is unavailable and shall leave the rendered document reachable.
- While a diff is displayed and the underlying document changes again, the system shall not silently replace the diff the user is reading.

**Trust**

- When the user opens "Stored data", the system shall disclose that document **snapshots (file contents)** are stored on-device, distinctly from settings, folders, recents and pins.
- When snapshot capture would begin storing content for the first time, the system shall disclose that plainly, at that moment, on a surface the user is already looking at.
- When the user erases snapshots, the system shall delete all stored snapshots and their content **without** erasing folders, recents, pins or settings.
- When the user wipes all data, the system shall erase all snapshots.
- When the user disables capture, the system shall capture no further snapshots.
- The system shall not store any snapshot without the user choosing to — satisfied by the watch gesture (§3.5), declinable by the switch in §3.6.
- The system shall make **no network request** while snapshotting or diffing, and shall keep the built manifest at `permissions: []` on both engines.

**Degradation**

- If a diff cannot be produced or rendered, then the system shall keep the last good render, surface the failure, and never blank the page (AGENTS.md #5).
- If the storage schema cannot be opened or upgraded, then the system shall continue to render and watch documents without snapshots, and shall say that history is unavailable rather than failing silently.

**Surfaces**

- The system shall provide snapshots and diff on the **app-page reader**, on both engines.
- The system shall present no snapshot or diff affordance on the content-script reader, and shall present no explanation there (§3.2).

## 5. Non-functional requirements

- **First paint (unwatched, non-diffing documents):** shall not regress the **<150 ms** typical-doc gate. Measured against the M5 close baseline **138.6 ms**, delta stated. **The margin is thin — ~11–14 ms** — and 006 adds both a dependency and a storage path. Measurement protocol unchanged since M1: 7 iterations, discard run 1 as cold, median of the warm 6, min/max as spread. Chromium only, by construction.
- **Capture cost:** snapshotting shall not materially extend the unresponsive window of a watch re-render. Baselines to beat: 50 KB ≈ 35 ms synchronous / 50 ms to second rAF; 1 MB ≈ 717 ms / 806 ms. **A like-for-like control is required** — 005 showed that continuity *moved* layout rather than adding it, and only the control made that visible. **No threshold is asserted here**; measure before writing one (M1 standing rule).
- **Storage:** snapshots shall be bounded (§3.4) and shall **not degrade read or write for the four existing stores** (`folders`, `recents`, `pins`, `settings`). The schema upgrade shall preserve existing rows.
- **Memory:** rendering a diff of a large document holds both sides plus the result, alongside whatever the watch loop already retains. The requirement is that a 1 MB document remains usable; the ceiling is the plan's to establish by measurement.
- **Bytes:** content-script and app-page deltas measured against the M5 baselines (**299,411 B** / **332,895 B**), stated not gated; `pnpm zip` **< 2 MB** on both engines (from **335.89 / 335.95 kB**).
- **Dependencies:** exactly one addition — `diff`, approved at 005's plan gate as a governed act and the first since M1 (plan 005 §0 D-2). Nothing else.
- **Manifest pin:** `permissions: []` re-proven on both built manifests, `tests/manifest.test.ts` green and **unchanged**. If any 006 capability appears to need a permission, that is an AGENTS.md #4 event — **stop and flag**.
- **Golden pin:** `tests/golden/output/` shall stay **EMPTY**. Snapshots and diff touch storage, chrome and render orchestration, never the pre-mount `sanitize(parse(source))` string. **Per the 5.1 correction of record, an empty golden diff proves nothing about chrome or placement** — structural assertions are required where placement matters.
- **Zero-network (AGENTS.md #1):** no http(s) request during capture, eviction or diff, proven at the request level on both engines, **non-vacuously** (the control shown live). The existing `/^https?:/i` predicate is used verbatim; 005 §7-4 measured that a `file://` read leaves the Resource-Timing buffer empty on both engines, so the scoping is correct rather than convenient.
- **Sanitization (AGENTS.md #3):** unchanged parse → sanitize path, applied to **both sides** of every diff.
- **a11y:** diff status is never colour-only; the diff view is reachable and dismissible by keyboard; any transition into or out of diff is instant under `prefers-reduced-motion`.
- **Never blank (AGENTS.md #5):** every degraded snapshot or diff state renders something.

## 6. Out of scope (explicit)

- **The content-script `file://` reader** — snapshots and diff are app-page-only in 006 (§3.2). Home: revisit when the background's role is deliberately reconsidered, or when the relay gains automated coverage. **No affordance and no explanation ship on that surface.**
- **User-adjustable retention limits** (amends 005 §3.4) — home: the next milestone that legitimately opens a settings surface, once the defaults have been observed against real agent-write patterns (005 §7-5).
- **Compare any two files** in the folder (F6) — needs a file-pair picker; deferred at 005 gate 1, still deferred.
- **Agent-file awareness** — badges and tuned defaults for CLAUDE.md / AGENTS.md / .cursorrules (F6); deferred at 005 gate 1, still deferred.
- **Session-transcript rendering** (F6); deferred at 005 gate 1, still deferred.
- **Local MCP bridge** (F6, explicitly post-v1 in the product spec).
- **Side-by-side diff** — F6's other sanctioned form (§3.7). Home: revisit if inline proves insufficient in use; the horizontal-space argument would need the TOC rail question answered first.
- **Sub-line (word/character) diff highlighting** (§3.8) — home: revisit once line-level is in use, and only with the source→rendered span problem scoped.
- **Restoring or reverting a document to a snapshot** — home: **F8 Editor Mode**, which lists *"restore or diff any snapshot"* by name. 005 §6 already parks write-back at F5 interactive checkboxes / F8 editor mode. 006 has no write story at all, and admitting one write means consent, confirmation, failure handling and a disclosure for writes.
- **Version history as a product surface** — 005 §6 stands: snapshots exist to serve diff, not as a document-history feature (§3.7).
- **Cross-device sync of snapshots** — 004's `storage.sync` deferral stands; this would also break "nothing leaves the device".
- **Exporting or sharing snapshots** — same reason.
- **A blocking modal or interstitial for the capture disclosure** (§3.6) — this is a reader; a dialog on first watch would be worse than the problem.
- **Making the diff discoverable through onboarding** — home: F11, together with the carried watch-pill discoverability item.
- **Using diff knowledge to reduce re-render churn** — see §7-9. `plan.md` decides explicitly whether any of it lands here; drifting into it is not an option.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Where the outgoing content comes from on the observer path.** §3.5 requires the content leaving the screen. The polled detectors hold prior content by construction — 005 §3.2 requires content-comparison detection. The Chromium app-page **observer** path is event-driven and may hold nothing prior at the moment it fires; the initial mount is performed by the page, not by the watch controller. Resolve whether the controller already retains it, is handed it, or must read once at watch start — **and keep §3.5's read-vs-store line intact whichever way it goes.**
2. **Memory cost of retaining the outgoing source.** Holding it means a second full copy, alongside the coalescer's pending slot — three copies of up to 1 MB before a diff is even rendered. Measure; do not assume.
3. **`idbCore`'s STOP signal.** `IdbSchema` is `{name, keyPath}` — no indexes, no compound keys, no cursors — and its own header names this as the *"reach for `idb`"* signal. Plan 005 §1.7 proposed splitting `snapshotMeta` (per-`docId`) from `snapshots` (per-id) precisely to stay inside it, so listing, eviction and byte-accounting read only small metadata rows. **Confirm that split actually satisfies §4's bounds criteria without reaching for an index — or escalate deliberately.**
4. **Schema upgrade.** `DB_VERSION` 2 → 3, additive-by-name, must preserve existing rows; the `idbVersionchange` suite is exactly that guard. Separately, the empty-summary literal is duplicated across `store.ts` and `appShell.ts` with a must-not-diverge comment, and a byte-count field touches both — **re-derive both line numbers; plan 005 §1.7's have drifted.**
5. **Byte accounting and eviction ordering have no precedent.** Nothing in the codebase measures bytes today. Eviction when two bounds bind at once, and the single-oversized-document case, both need a specified algorithm rather than an emergent one.
6. **★ Line endings — evidenced, and it reaches the detector, not just the differ.** `git ls-files --eol` reports 11 files as `i/lf w/crlf`: LF in the index, **CRLF in the Windows working tree**, despite `attr/text=auto eol=lf`. Peekover reads the working tree, not the index, and `git status` stays clean because normalization happens at commit — so this is invisible to the usual checks. `specs/005-watch-diff/spec.md` is one of the 11. Two consequences: a differ that does not normalize reports **every line changed** the first time a CRLF document is rewritten with LF endings; and 005's **content-comparison detection** fires on a pure line-ending flip, triggering a render and — under §3.5 — **storing a snapshot of a document whose text did not change.** D-2 named CRLF as a `diff` edge case in the abstract; it is concretely present.
7. **New registration seams, and the defect class M5 named.** Capture and the diff view are both reached through registration. *"Built, tested, and wired to nothing"* hit three times in M5, every time because tests constructed their own preconditions instead of driving production's. **At least one test per seam must drive the production entry path**, and M5's call-site pin should be extended rather than reinvented. Related, and load-bearing: an entrypoint **wires**; it does not decide or construct — a WXT entrypoint imports `#imports` and no Vitest project can load one. Plan 005 §1.9's control/controller seam (*"the control is rebuilt on every mount; the controller is not — do not hold a controller reference in the button's closure"*) is the precedent to follow.
8. **The render boundary is crossed again.** M5's crossing was cheap for four identifiable reasons: additive, defaulted-off, read at exactly **one** site, with the *old* behaviour proven red-first — **and the fallback sanctioned in advance**, so the risk had a landing site and nobody improvised under pressure. Follow that shape for the diff render, including naming the fallback **before** building, or state why it cannot apply.
9. **The carried anchor-correction item.** Content inserted above the viewport makes the view move up and return: correct behaviour, visible mechanism, recorded as a polish candidate whose fix *"belongs with 006's diff work, which knows what changed and could avoid the full replace."* **Decide explicitly whether any of it lands here.** Deciding no is fine; drifting in is not.
10. **The trust-claim correction is an ordering constraint, not just content** (§3.3). It must land in the same commit as the first storing code, which constrains task order. Re-derive the site count and the ledger row's shape ~~from `docs/trust/PERMISSIONS.md` itself~~ **from that file *and* from `src/` *and* `tests/` (AMENDED BY 006 gate-2 plan §1.3).** The claim also lives in shipped product strings and is pinned by three currently-green test assertions (`tests/browser/wipe.browser.test.ts:119`, `src/app/appShell.test.ts:715`, `:716-718`); those assertions are **part of the correction**, rewritten in the same commit — not collateral breakage discovered afterward. Kept, not deleted, so the ordering constraint is not re-opened from scratch.
11. **Firefox's data-collection declaration.** The Firefox build declares `browser_specific_settings.gecko.data_collection_permissions = { required: ["none"] }` — *"Peekover collects no data"*, **shown to the user at install time by Mozilla**. 006 begins storing document contents on-device. The answer is very likely that local-only storage is not "collection", but AGENTS.md forbids assuming it: *verify against current official docs — browser/store policy is often stale in training knowledge.* **Resolve before any storing code.** If it changes, an install-time user-visible string changes, and that returns to a human gate.
12. **The disclosure surface** (§3.6). The requirement is disclosure at the moment capture begins, on a surface the user is already looking at; the existing watch note is the obvious candidate. Choose the surface, and expect the human gate to judge whether it reads as honesty or as noise.
13. **Bound defaults are unevidenced** (005 §7-5, unchanged). Count, age and bytes are required; the numbers are guesses until real documents and real agent-write patterns are observed. **Propose with reasoning — tuneable, not gated.** A measurement task measures and is **forbidden from choosing**; the choosing is a separate human gate.
14. **Design translation.** `design/mockup.html` has a diff overlay and a version story, but also a toolbar, sidebar and pinned TOC the shipped reader does not have. Carry the design *language*; **re-measure the placement** — 005's throwaway rect probe is the precedent. Verify every token against `src/theme/readerCss.ts` before use; **never substitute a nearby token silently — it throws away the semantic** (004's sepia deferral is what happens when this is skipped). Where the mockup's behaviour and this spec disagree, **the spec wins**, and the divergence is recorded in-code so nobody later "fixes" it to match.
15. **Keyboard shortcuts.** The mockup binds the diff overlay to a shortcut. Two document-level keydown listeners already exist, permanently installed with once-guards and never removed, one of which resolves via a selector that is app-page-blind (plan 005 §4-3); the existing bare keys are `\` and `` ` ``. Unifying them is a carried item. **Decide whether 006 inherits that or leaves it.**

---

### Amendments to spec 005 riding with this commit

Both use the strikethrough-and-annotate pattern 005 §7-1 and §7-4 already use — original text preserved, marked superseded, pointed here (C12: a closed feature's folder stays as historical record).

1. **005 §3.4** — the words *"and adjustable"* superseded by 006 §3.4. Everything else in §3.4 stands.
2. **005 §4, Snapshots & diff** — the criterion *"The system shall let the user see how much snapshot storage is in use and adjust the limits"* superseded by 006 §4 (Retention & bounds), which keeps the usage half and drops the adjustment half.

---

_Gate status: this spec is a **DRAFT awaiting gate 1**. On approval, `plan.md` — the HOW — is the next artifact and the next gate, generated in a **fresh session** (C14), and it resolves the §7 risks above against the **actual code** rather than against this document. `tasks.md` is gate 3. **No implementation code before tasks.md is approved** (WORKFLOW.md §5.3)._
