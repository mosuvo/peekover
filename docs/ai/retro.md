# Retro log — Peekover
- **2026-07-19 · PROCESS (spec 004, groups 3–5) — `git checkout <path>` as a red-first revert destroyed
  uncommitted task work THREE times. The revert tool must not be repo-scoped when the file is dirty.**
  The red-first discipline requires mutating `src/` to prove a test fails, then undoing the mutation. Three
  times across groups 3–5 the undo was `git checkout <path>` — which restores the file to HEAD, i.e. it
  reverts the mutation **and** every uncommitted line of the task itself, because both live in the same file:
  - *Group 3:* `git checkout src/theme/reader.ts` wiped the `setThemeSetting` rewrite. Caught, redone.
  - *Group 4:* `git checkout src/render/runReader.ts src/render/runReader.test.ts` **permanently destroyed**
    the paint gate and its 7 jsdom orchestration tests. Nothing recovered them — which is why decisions.md
    records the gate as "rebuild, not restore".
  - *Group 5:* `git checkout src/render/mount.ts` dropped the mount edits again. Caught, redone.
  **The lesson: while uncommitted task work lives in a file, NEVER revert a red-first mutation with
  `git checkout <path>`. Use a file-level backup (`cp` the file aside, mutate, restore from the copy) or a
  targeted edit that undoes exactly the mutated lines.** The distinguishing property is that `git checkout`'s
  restore point is HEAD, while the wanted restore point is *the working tree one mutation ago* — those differ
  by exactly the task's own work.
  - **This is INCONSISTENCY, not ignorance, and that is the sharper finding.** The safe pattern was used
    correctly in the SAME sessions — group 5 backed up `src/theme/themeControl.ts` to `/tmp/` before mutating
    it and restored from there. So the knowledge was present and the wrong tool was still reached for under
    the momentum of "just undo it". A rule that is known but not reliably applied needs a mechanical trigger,
    not more understanding: **before any red-first mutation, `cp` the target aside first — make the backup the
    first step of the mutation, not a thing remembered at revert time.**
  - Cost: one destroyed increment (group 4's gate + 7 tests, rebuilt from scratch), two near-misses. Groups
    6–8 all still have red-first mutations ahead; this is followed from task 6.1 onward.
- **2026-07-17 · M3 close (spec 003 — TOC / navigation).** An in-reader right-side table-of-contents
  rail serving BOTH reader surfaces from ONE `mount()`-seam compose (see decisions.md 2026-07-17 for the
  settled architecture — not restated here). Six groups (model · rail+seam · scroll/spy/motion/resize ·
  zero-network · perf/first-paint/bytes · close). All automated acceptance green at close: lint · 350 unit ·
  166 in-browser both engines · golden diff EMPTY · `permissions:[]` pinned · zip 323 kB both engines. The
  6.2 human milestone-close gate PASSED on both engines and both surfaces (incl. the Firefox no-raw-flash
  1 MB first-paint ground truth deferred here from 5.2). Rich, honest material — the real-engine tests earned
  their cost this milestone AND a new human-gate-only defect class surfaced.
  - **(1) THE HEADLINE — a NEW gate-only defect class: visual occlusion / opacity / z-order is invisible to
    geometry tests (defect #6, running score 6/6 caught at the human gate).** The first group-3 human gate found
    the `.peekover-toc` rail rendered TRANSPARENT — the reading column's text bled straight through it — and the
    column reserved no room for the rail, so it also underlapped (an opaque rail would then clip the column's
    right edge). This passed EVERY automated test, including **158 green real-engine browser tests** in real
    Chromium + Firefox, because those tests assert **geometry and behavior** — scroll position, active index,
    rail width, request counts, bounding-rect non-overlap — and a transparent-but-correctly-positioned element
    scrolls, highlights, resizes, and *measures* perfectly while looking broken. **The crisp lesson:
    bounding-rect / behavior tests can prove non-overlap and correct position, but they CANNOT see see-through,
    opacity, or paint z-order — those are human-gate-only properties.** Follow-on: the fix (348eb67) both
    OCCLUDED (opaque `background:var(--paper)`) and RESERVED (`:host([data-toc="open"]) .peekover-reader
    {width:auto;margin-right:var(--toc-w)}`), and ADDED a real-engine test that CAN check the part a real engine
    exposes — rail computes a **non-transparent** background when open, and column `right ≤` rail `left` (no
    underlap), red-first proven both engines/surfaces. So the class is now *partially* test-covered (computed
    background-color + edge geometry), but the ROOT lesson stands for the next overlay-chrome feature: **a
    real-engine test can read computed opacity if you think to assert it, but nothing short of a human eye tells
    you the chrome LOOKS wrong** — occlusion/opacity/z-order is not something geometry alone surfaces. This is
    defect #6 of 6 caught at the human gate across M1+M2+M3 (M1: fetch leak, Firefox timing; M2: containment,
    drag-navigation, storage-UI gap; M3: rail occlusion). The gate is 6/6 load-bearing.
  - **(2) Where the line fell between "a real-engine test caught it" and "only a human/real-load caught it" —
    and this milestone the automated real-engine tests were NOT ceremony.** Unlike M1/M2 (where the manual gate
    caught bugs a green stack missed), the browser suite genuinely caught real bugs MID-implementation, before
    any gate:
    - *Scroll-spy staleness (3.2)* — an early `isIntersecting`-snapshot spy left the highlight stale under fast
      scroll; the real-engine scroll assertion failed until it was re-rooted on LIVE `getBoundingClientRect` per
      recompute (decisions.md 2026-07-17).
    - *Dead-node / liveness hazards* — the rAF-coalesced scroll listener, the host `Set` registry, and the
      rail-less backtick resolution each had a torn-down-host hazard the tests forced out (16821a8, e4d3bc6,
      997d81e, 361be37).
    - *Initial-state 0-width collapse (2.2)* — the rail could mount collapsed to zero width with no reachable
      opener; caught and fixed with a real shape test (16821a8).
    - *Reduced-motion contained-surface finding (3.3)* — measurement, not reasoning, revealed the app-page box is
      reduced-motion-safe only by accident (see (4)).
    But the two things the automated stack still could NOT see were **gate/procedure-only**: the **rail occlusion**
    (defect #6, above) and the **Firefox no-raw-flash / stale-build scares** — the latter a *procedure* trap
    (a stale or dev Firefox load shows a dead reader + `localhost` CSP warning that reads as a code defect but
    isn't; decisions.md 2026-07-16). → **The reusable boundary:** real-engine tests now catch geometry, behavior,
    engine-timing staleness, and bytes-on-wire; what remains human-only is **how the chrome LOOKS** (opacity,
    occlusion, "is the document still the hero") and **whether the build under test is the fresh production one**.
  - **(3) Process wins to CARRY — codify the liveness guard by construction.** The isConnected / liveness
    discipline recurred **5×** this milestone (rAF scroll callback · host `Set` registry · rail-less backtick
    resolution · scroll-spy observer teardown · resize pointer listeners) — every deferred / observer / listener
    on the shared `mount()` path needed the SAME "is the host still connected?" teardown guard, rediscovered
    per-task. → **Action:** the next feature that adds deferred/observer/listener work to the shared mount path
    should apply the isConnected-prune-on-teardown guard **by construction**, not rediscover it — treat it as a
    checklist item of "anything async rooted on a mountable host." The **fresh-production-build-before-a-Firefox-
    gate** procedure is already durably recorded (decisions.md 2026-07-16) — reference it, don't repeat the scare.
    And the **per-task pointer-move + per-task commit + fresh-skeptic-review** loop held again with no pointer lag
    (the M1 defect that started this rule) — keep it.
  - **(4) A plan-conformance miss found only by measurement — "CSS governs on both surfaces" did not hold.** Plan
    §3-#2 asserted the `:host{scroll-behavior}` reduced-motion override governs on BOTH surfaces. Measurement (3.3)
    showed it FALSE for the app page: the contained reader scrolls `.peekover-app__reader`, a **light-DOM** box
    whose CSS lives in the app shell, which the shadow `:host` override never reaches — so the app page is
    reduced-motion-safe by *accident* (instant-always), not by enforcement (decisions.md 2026-07-16). → **Lesson:**
    a "CSS governs" claim about a shadow-host stylesheet does NOT reach light-DOM scroll boxes; such per-surface
    claims need per-surface **measurement**, not reasoning. (The a11y obligation holds trivially here; the latent
    hazard — someone later adding `scroll-behavior:smooth` to that light-DOM box — is recorded for the revisit.)
  - **Ceremony that was waste — none.** The red-first real-engine proofs caught 4+ mid-implementation bugs; the
    "no un-measured threshold" rule kept 5.1/5.2 honest (measured the ~45 ms/1401 rail build + first-paint
    re-run, asserted no new threshold); the human gate caught defect #6. All earned their cost.
  - **The carried TOC-tree render lever is CARRIED, not decided** (5.1 measured ~45 ms/1401-heading build, scales
    ~linearly, fine for typical docs; the one-node-per-heading cost is the same suspect as the folder tree —
    revisit at N-thousand headings, decisions.md 2026-07-17). The `\`-app-page inert-shortcut gap is durably
    recorded (decisions.md 2026-07-17, per 6.1) — TOC backtick works on both surfaces; `\` was deliberately not
    retrofitted.
  - **Metrics:** human-gate-caught defects this milestone = **1** (rail occlusion — a NEW class: opacity/z-order
    invisible to geometry tests), running gate score **6/6** across M1+M2+M3 · first-try verification pass = the
    automated real-engine stack caught bugs mid-implementation (genuine, not ceremony), but the human gate was
    still required for the occlusion class it structurally cannot see · sessions = several (M3, ~one per group).
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
