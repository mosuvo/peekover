# Retro log — Peekover
- **2026-07-15 · M2 close (spec 002 — active-source foundation).** Peekover's second surface: a
  dedicated app page that reads a chosen folder of markdown, `permissions: []` intact, both engines.
  Six groups (shell · store · Chromium open · Firefox fallback · recents/pins+persist · doc/perf/
  close). All automated acceptance green: lint · 318 unit · 136 in-browser · zip 314 kB both engines.
  - **(1) Where the agent needed correction — the manual gate caught THREE real defects again, all
    invisible to a green automated stack.** A repeat of M1's central lesson, now with three data
    points instead of two:
    - *Containment* — folder files rendered full-page instead of inside the reader pane (fixed
      cdbeb06). DOM-shape tests passed; the layout wrongness only shows to a human eye.
    - *Drag-navigation* — a dropped folder fell through to the browser's default navigate-to-folder
      (the Firefox manual-gate screenshot); the drop path existed and was unit-tested but was
      **unreachable from any UI** — no wiring. A synthetic `dispatchEvent` never triggers a real
      browser's default action in ANY engine, so jsdom structurally cannot see "the browser
      navigated."
    - *Storage-UI gap* — `describeStored`/`wipeAll` existed and were real-engine-tested since group
      2, but had **no visible surface**; the app stored folders/recents/pins with no way for a user
      to see or clear them (closed by task 6.0 this group). "Function exists + tested" read as
      "feature shipped" — it wasn't, until it was wired to a control a human can find.
    → **General lesson, sharpened:** green tests certify the code paths they exercise, not that the
    capability is REACHABLE, VISIBLE, or LAID OUT right. All three defects were "wiring/visibility"
    gaps between tested units — exactly the seam jsdom + unit tests don't cover. → **Action:** the
    named human Chrome+Firefox gate stays load-bearing and non-removable (it has now caught 5/5 of
    the milestone-shipping defects across M1+M2); and a unit test that proves a function works is not
    evidence the function is wired to a user-reachable, visible control — that link is a manual-gate
    or real-engine-wiring check, by default.
  - **(2) What WORKED and should be kept — two process wins earned their cost.**
    - *Seam-design-up-front paid off.* The `FolderSource → MarkdownFile[]` seam + the
      `applyOutcome`/`paintGranted` funnel were designed at plan time (group 1–3); the group-4
      drag-and-drop target and the group-5 reopen wiring both **dropped in through the same funnel
      with zero duplication** — chip/tree/snapshot-note/never-blank came free. Designing the
      convergence boundary before the branches existed is why later engines/paths were additive, not
      surgical. → keep: name the one seam, force every branch through it.
    - *Genuine-reload / real-engine test discipline held.* Persistence, wipe, handle structured-clone,
      and bytes-on-wire ran against the engine's OWN IndexedDB/OPFS (never jsdom, never
      `fake-indexeddb`), red-first and non-vacuous (the wipe test fails vs a no-op; the network guard
      fails if a real request fires). And the **test-honesty split was held verbatim**: the OPFS
      handle proves our query→request→gate *mechanism*, while the disk `prompt`-after-reload ground
      truth is explicitly deferred to the human gate — no stub was allowed to masquerade as platform
      proof. The same discipline shaped 6.2: the perf harness measures the pure walk+build (real
      code) and honestly defers the real-browser render/layout number rather than faking it in jsdom.
  - **(3) Ceremony that was waste — none.** The plan-gate seam decision, the red-first real-engine
    proofs, and the manual gate each caught or prevented real issues; the retro rule "no un-measured
    threshold" kept 6.2 honest (measured cheap half, deferred the render lever). All worth their cost.
  - **Metrics:** manual-gate defects this milestone = 3 (containment · drag-navigation · storage-UI
    gap), all invisible to green tests · first-try automated-pass = yes per group, but the manual gate
    remained necessary at the seams · sessions = several (M2, one per group-ish). Outstanding: the
    named human milestone-close gate (6.3) — the one acceptance item an agent cannot self-certify.
- **2026-07-14 · M1 close — security + perf groups (spec 001 CLOSED).** The reader core is done
  end-to-end and the milestone is closed with all 7 acceptance criteria verified green. This retro
  covers the stretch after the shell group: remote-resource policy, the golden/perf groups, and the
  two bugs that shipped past a fully-green automated stack. Unusually rich material — captured honestly.
  - **(1) Where the agent needed correction — two real bugs cleared a green test suite; the human
    gate caught both.** The pre-opt-in remote-media **fetch leak** and the **Firefox `document_start`
    mount-timing regression** both passed the entire automated stack and were caught only at the human
    Chrome+Firefox manual gate. Two failure classes, one root: **jsdom is blind to bytes-on-wire AND
    to engine timing.** Worse than blind — two thorough-looking green layers (NO-LEAK + ORDERING)
    *certified the network leak clean* because jsdom loads no subresources, so the leak fired upstream
    of the DOM-shape checkpoints those tests inspect. **The general lesson: a test run in the wrong
    environment gives false confidence proportional to how thorough it looks** — the two green layers
    were worse than no test, because they read as "covered." A related miss: the "detached node doesn't
    fetch" / "handled by construction" assumption was asserted confidently in **three** places (two code
    comments + a review) and was simply false; the safe property is an *inert document*, not a detached
    subtree. → **Actions:**
    - *Standing rule (already in decisions.md, generalized here):* zero-network / remote-media /
      any-network-surface guards live in the **real-engine browser project**, not jsdom. New rule to
      carry: **any new remote-media or network surface gets a real-engine, request-level test BY
      DEFAULT** (Resource Timing / request assertions in real Chromium+Firefox), added with the feature
      — not after a leak. jsdom guards are kept but labeled **DOM-shape-only** so they never again read
      as network proof.
    - *"Handled by construction" is a claim to test, not trust.* Any such claim gets a **red-first,
      non-vacuous proof** in an environment that can observe the property. A real-engine request test
      would have caught the detached-node assumption on day one.
  - **(2) Rule/context missing or wrong — two, both now fixed.**
    - *The manual gate is load-bearing, not ceremony.* It caught the only two bugs the automated stack
      missed, in the two exact classes (bytes-on-wire, engine timing) jsdom cannot see. → **Action:**
      the human Chrome+Firefox pass is a **named, required milestone-close gate** for anything touching
      network or engine timing — not removable by adding more jsdom tests. (Applied at this close:
      boxes 1–2 were ticked only after the human confirmed both engines on the current build.)
    - *Acceptance numbers were written before measurement.* The `<150 ms on a 1 MB doc` gate was set
      pre-measurement and proved **physically unreachable** (~8×) in the settled design (browser parse
      floor + complete-source-before-mount + ~750 ms to lay out the reader's own ~1400-section DOM). →
      **Action:** **no acceptance threshold ships un-measured.** The size-sweep rescope replaced the
      guessed number with an evidence-based two-part gate (≤50 KB <150 ms measured; 1 MB no-flash both
      engines + <1.7 s honest bound). No threshold was softened to force a pass — one was proven, the
      other replaced with an honest one and the large-doc lever (chunked render) carried to M2.
  - **(3) Ceremony that was waste — none; the process wins earned their cost and are worth keeping.**
    The **read-only-investigation-before-fix** loop produced a correct root cause for both bugs before
    a line changed (and corrected the record on the misdiagnosed "Firefox platform gap" — it was a
    self-inflicted regression, not a platform limit). **Red-first, non-vacuous proofs** (leak reproduced
    3 requests both engines → green; empty-body DCL-no-op regression) made each fix verifiable. The
    **live-docs + competitor re-checks** reshaped real decisions across M1 (detection model, MV3 target,
    DOMPurify version, the perf-gate rescope). → keep all three.
  - **Metrics:** corrections = 4 (fetch leak · Firefox timing regression · perf-gate unreachable→rescope ·
    detached-node/record correction) · first-try verification pass = **NO** — the automated stack was
    green but let two real bugs through; the human gate was required · sessions used = several (M1 tail).
- **2026-07-14 · Shell group / M1-so-far (reader core).** Closing the reader core: detect →
  parse → sanitize → mount → themed reading → Raw toggle → never-blank fallback, Chrome +
  Firefox, `permissions:[]`, ~266KB packed, 111 tests green. One session.
  - **(1) Where the agent needed correction — stale memory files.** progress.md lagged the
    code by four tasks because memory writes were batched to end-session; its `Now` pointer
    still read "next = 3.3" when we were done through 4.2. → **Action (drafted for review, C2):**
    move the progress.md `Now` pointer *per-task* as tasks are ticked, not only at end-session;
    the Done/Up-next prose can still reconcile at session close. The pointer is the one line the
    next session trusts — it must never name an already-done task.
  - **(2) Rule/context missing or wrong — no violation, but three durability gaps.** Two good
    behaviors this stretch had no durable backing and would vanish in a fresh session, and one
    load-bearing gotcha is logged where an agent won't find it mid-task. → **Actions:**
    - *AGENTS.md line A (drafted for human review):* check current reality before deciding —
      live docs (WXT/DOMPurify/MDN/store policy) + ≥1 competitor; log what was checked. This
      stretch, such re-checks changed the detection model, MV3 target, and DOMPurify version.
    - *AGENTS.md line B (drafted for human review):* control/NULL chars in source (regex,
      literals) must be `\uXXXX` escapes, never literal bytes — literal bytes broke the edit
      flow twice on the sanitize `data:` hook and flagged the file "Binary."
    - *Doc move:* lift the shadow-tree `@font-face`-unreliable-in-Chromium → FontFace-API-on-
      `document.fonts` gotcha from decisions.md (dated log) into architecture.md (discoverable
      "how the reader is built"); leave the decisions.md entry as the dated record.
  - **(3) Ceremony that was waste — none.** Plan-gates and manual checks each caught real
    issues; the ceremony earned its cost.
  - **Metrics:** corrections = 4 (2 if counting code-only); first-try verification = mostly yes,
    with two hardening passes after review; sessions = 1.
- **2026-07-11 · Naming.** Lesson: semi-descriptive compounds get independently reinvented; a
  "clean" verdict without checking Apple App Store + Google Play is not a verdict. Fix shipped:
  8-surface checklist is now mandatory for any name (see names.md in design archive).
- **2026-07-10 · CSS shorthand bug class.** `padding: 0 X` on a shared class silently zeroed
  section rhythm site-wide. Fix: `padding-inline`/`padding-block` only on shared utility classes;
  grep for shorthand overrides when layouts misbehave. (Cost: several review cycles.)
