# Spec 005 — Watch mode + diff

**Status:** approved (Gear-3 gate 1 passed 2026-07-19); plan approved (gate 2 passed 2026-07-19) — tasks.md next
**Scope:** **005 delivers watch mode only.** Snapshots + diff are split out to **006** (`plan.md` §0 D-1). This spec remains the WHAT for the whole feature area.
**Date:** 2026-07-19
**Milestone:** M5 · builds on 004 (themes + settings, CLOSED)
**Structure:** follows WORKFLOW.md §5.2 (`spec.md` = the WHAT, no tech). Reconcile against `specs/_template-spec.md` if it carries extra sections.
**Task-0 evidence:** a feasibility probe was built, run on both engines and both surfaces, and torn down before this spec was written. Every scope decision below rests on a measured result, recorded in `docs/ai/decisions.md` 2026-07-19 (spec-005 task-0 probe). **This spec cites that entry; it does not restate it.**

---

## 1. Problem & value

Peekover renders a document once, at open. An AI agent writing a spec, a plan, or a CLAUDE.md rewrites that file continuously — and today the reader shows a frozen snapshot of whatever the file was when the tab opened. The user's only recourse is to reload, losing their place, repeatedly, for minutes at a time.

This is **the differentiator** (product spec §5 F6, the only section flagged "headline differentiators"), and it is why the AI-tool developer persona exists in §3 of that spec. Nobody in the category ships it.

This milestone makes the reader **follow a file as it is written**, and makes **what changed** legible — the two halves of "watch my agent work". It does so on both engines and both reader surfaces, with the honest asymmetry the platform forces (§3.2), and without spending a manifest permission (§5).

**Who it serves:** primarily the AI-tool developer ("read the CLAUDE.md/specs/plans their agents generate"). Secondarily the technical writer watching their own edits render live, and the developer following a doc a teammate's script is updating.

## 2. User stories

- As a developer with an agent writing a spec, I want the reader to **update as the file changes**, so I can watch progress without reloading.
- As a reader of a long updating document, I want to **keep my place** — an update must not throw me back to the top.
- As someone watching an agent work, I want to see **that** something changed, so I can tell a small edit from a rewrite without re-reading.
- As a reviewer, I want to see **what changed since earlier**, so I can judge an agent's work rather than re-reading the whole file.
- As a security-conscious user, I want to know **exactly what is now stored on my device** and be able to **erase it**, and I want the zero-network promise to still hold while watching.
- As a Firefox user, I want to be **told plainly** what my browser can and cannot do here, rather than watching a feature silently not work.

## 3. Key scope decisions (decided at this gate — redline as needed)

**3.1 Milestone scope — three of F6's six items.** IN: **auto-reload on change**, **watch mode** (the reading experience while it updates), and **diff against an earlier snapshot**. OUT, each with a recorded home (§6): compare-any-two-files, agent-file awareness/badges, session-transcript rendering, and the post-v1 MCP bridge. This is still the headline differentiator; it is also already a larger surface than 004.
_(**The split was TAKEN at the plan gate** — `plan.md` §0 D-1. **005 ships auto-reload + watch** (§4 change detection / re-render / watch UX); **diff-vs-snapshot moves to 006**, which gets its own Gear-3 cycle drawing on §3.3/§3.4 and the criteria marked deferred below. This spec remains the WHAT for the whole feature area. **Consequence: nothing in 005 stores file contents, so PERMISSIONS.md's "file contents are never stored" claim stays TRUE for all of 005** — §3.3's correction lands in 006, in the same PR as the code that forces it.)_

**3.2 The engine split is REAL, MEASURED, and stated honestly rather than papered over.** The probe settled this; the spec promises what each engine can actually do:

- **Chromium:** the split is **per-surface as well as per-engine**. On the **app page**, change detection is **event-driven** (`FileSystemObserver`) — no polling loop. On the **content script** it is **polled via the background relay**: `FileSystemObserver.observe()` takes a `FileSystemHandle`, the content script has only a URL, and there is **no URL→handle API**. (Full reasoning and the 2×2: `plan.md` §1.1.)
- **Firefox:** no observer, no directory picker. Detection is **polled**, and works **only via the drag route** — a folder opened with the file input yields permanently stale reads. Detection must compare **content**, because `size`/`lastModified` are frozen at drop time (the trap that would otherwise compile, pass a naive test, and silently never fire).
- **Consequence, stated in-product:** on Firefox, watch is available for **drag-opened** folders and unavailable otherwise, with a designed explanation — not a dead toggle. Same honesty posture M2 took for Firefox's read-only folder snapshot.

**3.3 Snapshots store FILE CONTENTS — and that changes a published trust claim.** _(deferred to 006 — see §3.1)_ Diffing against an earlier version requires keeping earlier versions. `docs/trust/PERMISSIONS.md` currently states **"File contents are never stored"** in three places; that becomes **false** the moment this ships.

- **Decision: store the contents, and say so plainly.** No content-hash-only workaround that would yield change detection but not diff. This product's character is disclosure, not minimisation-by-trick.
- **Not literally an AGENTS.md #4 permission event** (no manifest change), **but treated with the same weight**: PERMISSIONS.md is corrected **in the same PR** as the first code that stores a snapshot; the "Stored data" panel discloses snapshots; "Wipe all data" erases them.
- The claims that must remain true: **nothing leaves the device**, and everything stored is **visible and erasable**.

**3.4 Snapshot storage is BOUNDED on three axes, with user-visible controls.** _(deferred to 006 — see §3.1)_ Snapshots are the first unbounded-growth feature in the product. Caps by **count**, **age**, and **total bytes** — whichever binds first — with the limits visible and adjustable and current usage shown. Eviction is oldest-first, and the user can see what is retained rather than discovering loss by surprise.

**3.5 Both reader surfaces, by two different routes.** Watch ships to the app-page reader **and** the content-script `file://` reader — the two-surface symmetry every milestone since M1 has held.

- **App page:** the folder handle (Chromium) or dragged entry (Firefox) is already in hand.
- **Content script:** it **cannot re-read its own file** — measured: `fetch` and XHR both fail on a `file://` page _even with file-URL access granted_. It must **relay through the background**, the pattern 004 established for settings.
- **Firefox's content-script route is UNVERIFIED** (§7-1). If it proves impossible, watch is app-page-only on Firefox and the spec says so rather than shipping a dead control.

**3.6 A local-file read is NOT a network call — DECIDED (option A) at this gate.** The background reads a watched `file://` document with `fetch()`. That is **mechanically a fetch**, through the same API AGENTS.md #1 and the Resource-Timing guards watch — even though reading a local file is not a network call in any meaningful sense. Left undecided, the first honest guard we write would trip on our own watch loop.

- **Decision:** a local-file read **does not** light the network indicator; the zero-network guards stay scoped to **http(s)** (already how the existing assertions are written); PERMISSIONS.md states explicitly that watching reads the user's own chosen local file from disk and makes **no network request**.
- **Verify, do not assume** — §7-4 checks whether a `file://` fetch appears in the Resource-Timing buffer at all, and that the guards remain **non-vacuous** afterwards. If it does appear, the assertions need explicit http(s) scoping _and_ a re-proven live control.
- **Rejected, recorded so they are not re-litigated:** **(B)** light the indicator on every re-read — honest to the mechanism, actively misleading to the user; an indicator firing every second while reading a local file trains people to ignore it. **(C)** avoid the relay entirely and make watch app-page-only — cheapest, but abandons the surface where "follow a `file://` doc my agent is writing" is most natural.

## 4. Acceptance criteria (EARS)

**Change detection**

- When a watched file changes on disk, the system shall detect the change without user action.
- While watching on Chromium **on the app page**, the system shall detect changes **without polling**. (The content-script surface polls on both engines — §3.2.)
- While watching on Firefox, the system shall detect changes by comparing **content**, not file metadata.
- If a watched file becomes unreadable (deleted, moved, permission revoked), then the system shall surface a designed state and stop watching — never fail silently, never retry forever.

**Re-render**

- When a watched file changes, the system shall re-render the document and **preserve the reader's place** in the content they were reading.
- While a document re-renders from a change, the system shall preserve the user's **theme, TOC open-state/width, and Raw/Reading mode** — this state must not reset on every agent keystroke. **Verified against the code: only theme survives a re-mount today.** TOC survives only via 004's persistence round-trip and is re-decided every mount; **Raw/Reading mode is actively RESET by an existing unconditional line in `mount()`**. Preserving it is therefore **new work inside a function four milestones have treated as read-only library** — not merely a matter of not breaking what already works (`plan.md` §1.3).
- If a re-render fails, then the system shall keep the last good render, surface the failure, and never blank the page (AGENTS.md #5).

**Watch UX**

- When the user enables watch on a document, the system shall indicate that watching is **active**.
- When a watched document updates, the system shall give a **brief, non-intrusive** signal that it changed.
- While watch is active and the reader is at the bottom of the document, when new content is appended, the system shall follow the newest content.
- While watch is active and the reader has scrolled **away** from the bottom, when the document updates, the system shall **not** move them — following is opt-in-by-position, never a hijack.
- While `prefers-reduced-motion` is set, any update signal or follow-scroll shall be **instant**.

**Snapshots & diff** _(deferred to 006 — see §3.1)_

- When a watched document changes, the system shall be able to retain the previous version as a snapshot.
- When the user asks what changed, the system shall show the difference between the current document and a chosen earlier snapshot.
- When snapshots exceed any configured bound (count, age, or bytes), the system shall evict oldest-first, and the user shall be able to see that this happened.
- The system shall let the user see how much snapshot storage is in use and adjust the limits.

**Surfaces**

- The system shall provide watch on **both** the app-page reader and the content-script reader — or, where an engine makes a surface impossible, state that plainly in-product rather than presenting a control that does nothing.

**Trust**

- When the user opens "Stored data", the system shall disclose that document **snapshots (file contents)** are stored on-device, distinctly from settings/folders/recents/pins. _(deferred to 006 — see §3.1)_
- When the user wipes all data, the system shall erase all snapshots. _(deferred to 006 — see §3.1)_
- The system shall make **no network request** while watching, and shall keep the built manifest at `permissions: []` on both engines.
- The system shall not begin watching, or store any snapshot, without the user choosing to.

**Degradation**

- If the engine cannot support watch for the way the user opened the document (Firefox, non-drag), then the system shall explain that in plain language at the moment it matters.

## 5. Non-functional requirements

- **First paint (unwatched docs):** opening a document that is not being watched shall not regress the <150 ms typical-doc budget. Measured against the M4 close baseline **137.7 ms**, delta stated. **The margin is thin** — ~7–12 ms on the recorded hardware (progress.md § Baselines / pins).
- **Update responsiveness:** a change shall reach the reader promptly enough to feel live. **No number is asserted here.** Observer latency is currently **UNMEASURED** (the probe's single sample was dominated by human reaction time) and the re-render cost under rapid updates is unknown. Both are measured in the plan before any threshold is written — M1 retro standing rule, no un-measured gate.
- **Rapid-update resilience:** an agent writing continuously must not make the reader unusable. The requirement is that the reader **stays responsive**; the mechanism (debounce, coalesce, skip-while-rendering) is the plan's to choose **from measurement**.
- **Large documents:** watching a ~1 MB document shall not degrade the reading experience. Firefox's polled path re-reads the whole file per tick (**measured ~2–8 ms at 1.12 MiB**), so the **re-render**, not the read, is the suspect cost.
- **Zero-network (AGENTS.md #1):** watching, snapshotting and diffing shall issue **no http(s) request**, proven at the request level in real Chromium and Firefox, **non-vacuously** (the control must be shown live — see the M4 `remoteMedia` positive-control flake, decisions.md/progress.md). Subject to §3.6's classification.
- **Manifest pin:** `permissions: []` re-proven on both built manifests. **Re-confirm, do not assume** — the background reading `file://` is a new capability shape; if it ever needs a permission, that is an AGENTS.md #4 event.
- **Golden pin:** `tests/golden/output/` shall stay **EMPTY** — watch/diff/snapshot touch chrome, storage and re-render orchestration, never the pre-mount `sanitize(parse(source))` string. **But per the 5.1 correction of record, an empty golden diff proves nothing about chrome** — structural assertions are required where placement matters.
- **Bytes:** content-script size delta measured vs the M4 baseline **288,654 B**, delta stated; `pnpm zip` **< 2 MB** both engines.
- **Storage:** snapshots must be bounded (§3.4) and must not degrade read/write for the existing stores. _(deferred to 006 — see §3.1)_
- **a11y:** the update signal and any follow-scroll respect `prefers-reduced-motion`; watch state is exposed to assistive technology and never colour-only.
- **Sanitization (AGENTS.md #3):** re-rendered content goes through the unchanged parse → sanitize path. **A file being rewritten by an agent is untrusted input on every update, not just the first.**

## 6. Out of scope (explicit)

- **Compare any two files** in the folder (F6) — needs a file-pair picker; deferred.
- **Agent-file awareness** — badges and tuned defaults for CLAUDE.md / AGENTS.md / .cursorrules (F6); deferred.
- **Session-transcript rendering** (F6); deferred.
- **Local MCP bridge** (F6, explicitly post-v1 in the product spec).
- **Editing or writing files** — watch is read-only. Write-back (F5 interactive checkboxes, F8 editor mode) is later work.
- **Watching remote URLs** — `http(s)` documents are not watched. That would be real network polling and a different trust conversation.
- **Per-file scroll-position memory across sessions** (F5) — within-watch place-keeping IS in scope (§4); remembering it across opens is not.
- **Version history as a product surface** — snapshots exist to serve diff, not as a document-history feature.
- **Cross-device sync of snapshots** — 004's `storage.sync` deferral stands.

## 7. Open risks — for plan.md to resolve (not spec-level)

1. **Firefox content-script watch is UNVERIFIED.** The probe measured Chromium's background `fetch("file://…")` working (status 200, fresh bytes) but never tested Firefox's. Firefox has no "Allow access to file URLs" toggle and its background may not fetch `file://` at all. If it cannot, **Firefox watch is app-page-only** and §3.5 narrows. Verify before promising.
2. **Observer latency is UNMEASURED** (decisions.md 2026-07-19). The design assumes event-driven detection is effectively immediate; that is untested. Measure it cleanly before writing any responsiveness threshold.
3. **Re-render cost under rapid updates is unknown.** A 1 MB document currently takes ~1.25 s to render; an agent producing several updates per second could make the reader unusable. **This is the "measure, then decide" class 004's D-2 established** — no mitigation is pre-committed here, and the plan must not inherit one.
4. **Does a `file://` fetch appear in the Resource-Timing buffer?** §3.6-A's guards depend on the answer. If it does appear, the existing zero-network assertions need explicit http(s) scoping **and** a non-vacuity check that still holds afterwards.
5. **Snapshot bound defaults are unevidenced.** _(deferred to 006 — see §3.1)_ Count/age/bytes are required (§3.4); the actual numbers are guesses until real documents and real agent-write patterns are observed. Propose defaults with reasoning — tuneable, not gated.
6. **Watch lifetime vs. surface lifetime.** An MV3 service worker is torn down when idle; an app-page tab or content-script page lives as long as the tab. **Where the watch loop lives determines whether it survives.** The probe ran in a long-lived tab, which masked this entirely. Decide deliberately.
7. **Atomic-save fragility (Chromium).** The probe saw `modified` records for both agent appends and editor saves **on one machine with one editor** — no `disappeared`+`appeared` rename pair. Another editor or agent may write atomically, which on Windows can invalidate the observed file handle. Decide whether file-level observation suffices or the design must observe the directory.
8. **Firefox drag-only discoverability.** If watch requires a drag-opened folder on Firefox, a user who used the file input gets no watch and may not know why. §4's degradation criterion needs a real designed state, not a disabled control.

---

_Gate: on approval of this spec, plan.md (the HOW) is drafted next — the detection architecture per engine, the relay seam, the snapshot schema and bounds, the diff approach, the re-render/place-keeping mechanism, and the test strategy — for a separate human gate before any implementation code (WORKFLOW.md §5.3)._
