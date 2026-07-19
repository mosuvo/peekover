# Retro log — Peekover
- **2026-07-19 · M4 close (spec 004 — themes + settings).** Auto/light/dark, persisted in the existing
  IndexedDB with **`permissions: []` still intact**, applied coherently across shell + both reader surfaces,
  plus the 003 TOC rail's open-state and width carried over as a global preference (sepia deferred, D-1).
  Eight groups. At close: lint · **384 unit** · **314 in-browser** both engines · golden diff EMPTY ·
  `manifest.test.ts` 8/8 · zip 327.6 kB both engines. The 8.1 milestone-close gate PASSED on both engines and
  both surfaces with **no defects found** — the first milestone where it found nothing, which is the question
  this entry has to answer rather than celebrate. The settled architecture (stored-vs-applied split, the seam,
  the D-2 correction) is in decisions.md 2026-07-18/19 — **linked, not restated**.
  - **(1) THE HEADLINE — a NEW named defect class: the VACUOUS PERSISTENCE TEST. A test that hardcodes what
    the fallback would have decided proves nothing whenever the two agree, and the green run says so
    nowhere.** Task 6.1's first D-F test seeded `tocOpen:false` and asserted it survived the rAF stomp. The
    harness viewport is **414 px** and `WIDE_SCROLLPORT_PX` is **720**, so the width rule had *already*
    decided `collapsed` — the stomp would have written **the same value the test asserted**. That test would
    have passed with the entire D-F handling deleted. It was caught **incidentally**, by an unrelated
    hardcoded `'open'` expectation failing; nothing about the test's own green said "I am not testing
    anything." → **The rule, mechanical enough to apply without thinking:** for any test of *restored* or
    *remembered* state, **MEASURE the fallback's answer by mounting a probe with nothing stored and reading
    production's own decision, then seed the OPPOSITE** — and assert `not.toBe(fallbackDefault)` explicitly,
    so the test is adversarial by construction on any viewport, any machine, any future default. (Fixed
    exactly this way at 6.1.) **This is a class, not an incident, and 7.1 produced its second instance from
    the other direction:** the `remoteMedia` Firefox flake was in the **POSITIVE CONTROL** ("the opt-in fetch
    DOES appear" read `[]`) — the half whose job is to prove the zero-leak assertion is non-vacuous. Had it
    flaked silently the other way, the non-negotiable zero-network count would have been certified by an
    empty buffer. **Generalized: every assertion that a value is ABSENT, UNCHANGED, or RESTORED needs a
    proof that its own measuring instrument is live** — the fallback probe and the positive control are the
    same idea. Watch item carried: if the `remoteMedia` control flakes again, await the request, don't
    sample for it.
  - **(2) Inference does not survive contact with the configuration it describes — and the process that
    caught it is the reusable part.** Task 4.1's isolation probe predicted **~26 ms** cold settings
    availability; measured behind the actual gate at 4.2 it was **~72 ms**. The probe still reproduces
    (0.4 ms warm / 5.6 ms cold), so it is not wrong about the background — it **under-predicts the
    content-script path ~13×**, because it measures an idle, already-loaded extension page while a content
    script at `document_start` competes with an active navigation. → **The win was structural, not lucky:**
    4.1 was *forbidden from choosing* (measure-only, no threshold asserted — the M1 rule), it **flagged its
    own inference as untested and named the re-measure as 4.2's job**, and D-2 was recorded with that
    re-measure as an explicit escape clause. That is the only reason a gate which breached the <150 ms
    budget on **every cold typical-doc open** never shipped. → **Carry as a rule: when a measurement is taken
    in configuration A and the decision will run in configuration B, the number is an INFERENCE — name it as
    one in the record, and make re-measuring in B a required task, not a suggestion.** → **And state
    plainly, because it is the counter-intuitive half: building the gate, measuring it, and DELETING it was
    a SUCCESS, not waste.** ~25–35 ms of cold cost that was insensitive to the deadline (75 ms → 172.7 ms;
    40 ms → 172.9 ms) is knowledge no amount of reasoning would have produced, and it is now recorded well
    enough to rebuild from (decisions.md 2026-07-18).
  - **(3) A standing pin's SCOPE was assumed rather than tested — and measurement proved the inference
    over-broad.** "Golden diff EMPTY ⇒ the reading column is untouched" was being read as a general
    guarantee. It is not. At 5.1 the theme control was deliberately appended **INSIDE `.peekover-reader`**
    and `git diff tests/golden/output/` stayed **EMPTY** with `golden.test.ts` green **10/10** — because that
    suite snapshots the pure `sanitize(parse(source))` string, a stage **upstream of `mount()`** that never
    observes chrome. The pin is fine; the inference drawn from it was wrong, and the **DOM sibling assertion
    is the sole guard**, not a belt-and-braces duplicate. → **General rule: a pin certifies exactly the stage
    it observes. Before citing one as evidence for a property, deliberately BREAK that property and check the
    pin goes red** — the same non-vacuity discipline as (1), applied to standing guards rather than new
    tests. A pin whose scope has never been probed is a claim, not a proof.
  - **(4) THE HARNESS-HONESTY LOOP CLOSED END-TO-END — the best process finding of M4, and it is now a
    complete, repeatable pattern.** Four times an implementing agent stated plainly what a test could NOT
    prove instead of substituting a weaker test that passes: **group 2** (no content-script context — the
    real `runtime.sendMessage` bus was never exercised, only a loopback through the same handler);
    **4.1** (Chromium-only by construction — Playwright cannot load a Firefox extension,
    microsoft/playwright#7297 closed out-of-scope, so no Firefox number was faked); **5.1/6.1** (a **fake
    sink injected through the PRODUCTION seam** proves our half of the contract, not that the message
    reaches the background); **3.3/5.1** (computed tokens and geometry prove values agree; they cannot see
    contrast or occlusion — the LOOK is gate-only). Each honest gap became a **NAMED item in the 8.1
    checklist**, and the gate **DISCHARGED all of them**. → **The pattern to keep, in three beats:
    honest gap → named gate item → discharged at close.** Its value is that it makes an untestable path
    *tracked* rather than *forgotten*, and it converts "we couldn't test this" from an excuse into a work
    item with an owner and a closing date. The alternative — inventing a jsdom test that exercises a fake
    and reads as coverage — is the M1 failure mode (two thorough-looking green layers certified a real
    network leak) and it did not recur once this milestone.
  - **(5) THE OPEN QUESTION, ANSWERED: the clean gate is MOSTLY THE DISCIPLINE, with the boundary genuinely
    moved in ONE direction — and the "quieter surface" half is weaker than it looks.** progress.md's group-8
    entry deliberately left this open. The evidence:
    - *What moved into CI, specifically:* M4 built its assertions on **computed style**, not attributes —
      `getComputedStyle(...).getPropertyValue('--paper')` across `themeRuntime` / `themeShell` /
      `themeControl` / `tocPersist`. That is a real boundary move: **theme incoherence (a half-themed
      screen, shell and reader disagreeing, manual-vs-OS precedence inverted) is now a CI class**, and 3.3's
      own note says an attribute-only assertion would have passed on the pre-3.3 shell. Browser tests went
      **166 → 314** across the milestone; **~20 red-first mutations** were run, all genuinely red on both
      engines.
    - *But most red-firsts prove non-vacuity, they do not find bugs* — and the honest list of what CI caught
      **mid-development** is short and specific: the **5.1 placement collision** (the obvious top-right spot
      overlaps the TOC handle at BOTH viewports — caught by geometry **before** a placement was committed,
      not diagnosed after); the **6.1 clamp gap** (a stored 5000 px rail that would have eaten the reading
      column); the **5.2 type tightening** (three literals silently reporting "no settings stored"); the
      **3.2 stale-host broadcast**. Would 5.1 have reached the gate in M3? **Probably not** — M3 had
      bounding-rect tests too, and they measured the transparent rail perfectly. The difference is not that
      geometry got smarter; it is that **M4 ran the geometry check as an input to the design decision rather
      than as a regression guard after one.** That is a discipline change, not a capability change.
    - *Was the surface quieter?* **Partly, and less than it appears.** Genuinely smaller: M4 added no new
      network surface (`permissions: []` unchanged, `mediaPolicy.ts` untouched), and `runReader.ts` ended
      the milestone **behaviourally unchanged** — the two classes that produced M1's defects (bytes-on-wire,
      engine mount timing) were barely touched. Its largest visual addition is a corner pill, against M3's
      full-height rail that reserves column width. **But the counter-evidence is strong:** M4's riskiest
      surface was the **content→background message bus, which NO test has ever run** — a wiring/reachability
      class, exactly what produced M2's three defects — and the gate walked it (collapse, drag, **reload**,
      cross-surface) and found it clean. That path was not quiet; it was *narrow*. It stayed testable-adjacent
      because both halves were proven independently through the same production seam, leaving only the
      transport itself unproven. **That is the seam design paying off, not a small surface.**
    - **Conclusion — and I'd sharpen the hypothesis rather than accept it whole:** discipline-dominant;
      surface modestly quieter in the *legacy* risk classes only; and the boundary moved **for coherence,
      not for appearance**. Contrast, legibility and occlusion are exactly where they were in M3 — gate-only,
      and the 8.1 checklist still carried two of them as named eyeball items.
    - **WHAT IT IMPLIES FOR THE GATE — it stays load-bearing, and the reasoning matters more than the
      verdict.** The two things 8.1 uniquely covered have **ZERO automated coverage and no roadmap to any**:
      **Firefox first paint** (Playwright cannot load a Firefox extension — an upstream *closed* issue, not a
      pending one) and a **genuine reload through the real transport**. → **The durable rule: a clean gate is
      evidence about the BUILD, not about the GATE.** One clean run is n=1 against 6/6; a gate covering paths
      nothing else can reach cannot be retired by a run in which it found nothing, because "found nothing" and
      "was not needed" are indistinguishable from inside a single milestone. Retire a gate item only when
      something else can *observe* the property — never because it has been quiet.
  - **(6) The seam beat threading THREE times, for the same reason each time — recording it once so it is
    not re-derived.** Group 3 (theme), group 5 (save sink), group 6 (generalized to `settingsSeam.ts`). Each
    time the alternative was threading a value through **4–5 signatures across TWO call chains**
    (`runReader`→`mountReader`→`mount` and `mountAppShell`→`createReaderPane`→`mount`) to deliver one value
    to a leaf. → **Durable architectural fact about this codebase: the render path's signatures are a
    shared, two-surface trunk, so any new cross-cutting value reaches it through a module-level seam that
    the entrypoints register into — not through `MountOptions`.** This keeps side effects in the
    entrypoints where AGENTS.md puts them, and it is why the group-6 generalization was a **pure move** with
    every group-5 test file byte-unchanged. Rationale and the deliberate stored-vs-applied split:
    decisions.md 2026-07-19. **The next milestone's first cross-cutting value should reach for this by
    default rather than re-litigating it at its group 5.**
  - **(7) THE ORCHESTRATOR'S OWN ERRORS — four, all caught by the agent re-deriving from ground truth
    instead of trusting the prompt. This is the "re-derive state, never trust a pasted SHA" rule validating
    from a direction nobody designed it for: THE INSTRUCTION ITSELF AS AN UNTRUSTED SOURCE.** A retro that
    only examines the implementing side is half a retro. Across M4 the reviewing/orchestrating side:
    - claimed to have **"placed a file" on the user's machine** — impossible; it cannot write there;
    - instructed a verification against a **`permissions: []` literal that was never in the plan file**;
    - asserted **PERMISSIONS.md lived at the repo root** when `git ls-files` put it in `docs/trust/`;
    - asserted **groups 1–3 were pushed** when `git status` showed group 3 was still four commits local.
    Every one was caught the same way: the agent ran `git ls-files` / `git status` / opened the file, rather
    than acting on the assertion. → **The rule generalizes past SHAs and past sessions: a prompt's factual
    claims about repository state — paths, push status, file contents, what a plan says — are UNVERIFIED
    INPUT, and a cheap command answers each one.** Checking is ~one tool call; acting on a wrong claim
    corrupts a verification and can destroy work (see the `git checkout` entry below for what that costs).
    → **Corollary for the orchestrating side: state repo facts as claims to check ("I believe X is at Y —
    confirm"), never as premises**, so the instruction and the verification do not share a single point of
    failure. *(A fifth, minor: this session's brief asserted everything was pushed; `git status` read
    **ahead by 1** — the 8.1 commit is local. Caught the same way, at STEP 0.)*
  - **The `git checkout` process failure is already banked** as its own dated entry immediately below
    (2026-07-19, PROCESS) — **referenced, not restated**. Its COST is the part worth carrying into future
    planning: **group 4's paint gate and its 7 jsdom orchestration tests are permanently gone**, in no
    commit, with nothing to `git revert`; decisions.md records the gate as **"rebuild, not restore"** and
    preserves its design so a rebuild is possible. Two further near-misses were caught and redone. The rule
    (`cp` the target aside as the FIRST step of any red-first mutation) held from 6.1 onward — group 6's
    five red-firsts were all reverted from a backup.
  - **Ceremony that was waste — none, and one item deserves defending.** 4.2 built a gate and deleted it;
    that cost a task and bought the knowledge that the cost is deadline-insensitive, which killed a design
    that would have breached the budget on every cold open. Measurement-only tasks (4.1, 7.1) asserted no
    thresholds and stated their scope caveats. **Deliberately CUT from this entry: the doc path drift**
    (`src/store/`→`src/app/`, `src/ui/`→`src/app/`, twice — plan and tasks naming paths that never existed).
    Both were caught in-flight at the cost of one in-place correction, neither reached code, and the
    existing habit of verifying paths at task start already covers it. A retro line would add ceremony
    without changing behaviour.
  - **Metrics:** human-gate-caught defects this milestone = **0** — the first milestone with none; running
    gate score still **6/6** across M1+M2+M3, denominator unmoved · ~**20 red-first mutations**, all red on
    both engines · browser tests **166 → 314** · defects caught by CI mid-development = 4 (placement
    collision · restore clamp · type tightening · stale-host broadcast), by measurement = 1 (the paint gate's
    cold budget breach) · orchestrator factual errors caught by ground-truth re-derivation = **4** (+1 at
    this session's STEP 0) · one increment permanently destroyed (`git checkout`) · sessions = several
    (M4, ~one per group).
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
