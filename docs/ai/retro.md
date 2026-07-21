# Retro log — Peekover
- **2026-07-21 · M5 close (spec 005 — watch mode).** Watch a chosen local markdown file and re-render it in
  place while an agent rewrites it, on both engines and both surfaces, with **`permissions: []` still
  intact**, **no new dependency** (still three) and **no file contents stored** — D-1/D-2 held to the last
  commit. Seven groups plus **five discovered tasks** (4.5, 4.6, 4.7, 4.8, 5.1a). At close: lint ·
  **456 unit** · **499 in-browser passed / 15 skipped**, 54 file-instances, both engines · golden diff EMPTY ·
  `manifest.test.ts` 8/8 and **byte-unmodified since M2** · zip 335.89 / 335.95 kB · first paint **138.6 ms**
  against the **<150 ms** budget. The 7.1 milestone-close gate **PASSED and found ONE shipping defect** —
  the first gate since M1 to find one, found **in the first five minutes, on the first item checked**. The
  settled architecture (the register-once registry, the entrypoint rule, the cooldown's mechanism, the OPFS
  confirmation) is in decisions.md 2026-07-19/20/21 — **linked, not restated**.
  - **(1) THE HEADLINE — a NEW named defect class: BUILT, TESTED, AND WIRED TO NOTHING. It hit THREE TIMES
    in one milestone, and all three have ONE cause.** `observerDetector` was built, real-engine tested via
    OPFS, perf-measured — and **imported by nothing**, so spec §4's *"detect changes without polling"* was
    **FALSE in shipped code** (4.7). The watch pill **did not exist on the first file opened in a session**,
    on both engines, because the target was registered after the mount that decides whether to build a
    control (4.7's own verification). And the content script's registered `WatchTarget` called
    `detector.start(() => {})` — **an empty callback**: watch detected every change and rendered **none**
    (4.8, found by a human at the gate; the relay underneath it was measured working — 200, 28 623 bytes,
    88 background reads in ~90 s, **zero re-renders**). → **The one cause, and it is why every suite stayed
    green: every watch test calls `registerWatchTarget(createWatchController({…}))` ITSELF before mounting.**
    That is a good way to test the controller, the pill and the registry, and it is exactly why all of them
    passed — **no test ever asked which target *production* registers.** → **The rule, mechanical enough to
    apply without thinking: for any capability reached through a registration seam, at least one test must
    drive the PRODUCTION ENTRY PATH rather than construct its own preconditions.** 4.8 shipped the
    generalisable form and it is the new *kind* of assertion in this repo — a **call-site pin**: *every
    production `registerWatchTarget(...)` call site builds its target with `createWatchController`*, verified
    RED against the pre-4.8 tree, naming the offending file. It asserts a property of the wiring, not of a
    unit, which is the only altitude at which this class is visible. → **And record the aggravating factor as
    a standing rule, because it is structural, not a habit: a WXT entrypoint imports the virtual `#imports`
    module, so NEITHER Vitest project can load one at all.** Logic living in an entrypoint is **untestable by
    construction** and verified by code review and nothing else — so **an entrypoint wires; it does not decide
    or construct** (decisions.md 2026-07-21; the fix was a relocation into `src/watch/contentWatch.ts`,
    leaving three genuinely engine-bound values behind). **It was written down twice and acted on zero times:**
    4.1's note said the adapter delivers no re-render and 4.2 would replace it — **4.2 replaced it in
    `appShell.ts` only** — and 4.6 later restated the same mechanism verbatim as evidence for a *different*
    argument. **A correct observation filed under the wrong conclusion is not caught by re-reading the notes.**
  - **(2) RED-FIRST IS NOT "DID IT GO RED" — IT IS "DID THE RIGHT THINGS GO RED, IN THE RIGHT NUMBER." Five
    instances this milestone, and TWICE the check revealed structure nobody knew existed.** This is a
    distinct rule from M4's finding (1): that one is about the TEST's instrument being live; this is about
    the MUTATION isolating the property. The evidence: **3.3** — a first-draft test appended a section and
    asserted `scrollTop` was unchanged, and **passed against a `mount()` with no continuity code at all**,
    because the engine does not reset `scrollTop` when `replaceChildren` leaves the box tall enough (the
    *engine* was satisfying the assertion; rewritten to INSERTED-ABOVE, where holding steady is the wrong
    answer). **3.4** — disabling `applyInitialTocState`'s stored-value early return left the suite **fully
    green**, and investigating why found `decide()` carrying its **own independent stand-down**: two guards,
    either sufficient. **4.1** — swapping the click-time registry lookup for a captured reference stayed
    green, because across a plain re-render the registry holds the **same object**; what actually dies is a
    capture taken before the slot's *occupant* changes, so a test for **that** was added and the same break
    then failed 4×. **5.3** — removing `stop()`'s cancel left the switch test green because **`start()`
    cancels too**; breaking both exposed `"A: pending -> HOST B"`, 4.3's cross-feed bug one level up. And
    **5.1**'s A/B control was **vacuous twice** before it measured anything. → **The rule: check the failure
    COUNT and the failure REASON, and treat a break that stays green as a finding rather than a relief.**
    Twice here it meant *two independent guards*, which is knowledge you cannot get by reading the code —
    both times the second guard was in a different file, added for a different reason, by a different task.
    → **Corollary for anyone tidying: a guard that looks redundant may be the one the suite is actually
    resting on. Removing "the duplicate" goes red NOWHERE** (decisions.md 2026-07-21 records this for the
    cooldown's two cancels specifically).
  - **(3) "IT'S THE HARNESS" IS THE MOST DANGEROUS SENTENCE AVAILABLE — this milestone said it THREE TIMES
    and was right three times, and the reason it was right is the reusable part.** **3.2**: the standing
    `waitForScrollable` returns while the reader is still restyling — `scrollHeight` **81 798 px at first
    overflow → 26 069 px settled**, so a heading offset read there is stale by tens of thousands of pixels
    and the following `scrollTop` write **CLAMPS**, parking the test at the document bottom *deterministically
    on both engines*. **4.5**: cross-file viewport concurrency, ~40% flaky. **5.3**: a macrotask-spaced burst
    measures the harness's scheduler, not the coalescer. → **What makes it a diagnosis rather than an excuse
    is that each was argued from a variable that isolates the harness, not asserted.** 4.5 is the model:
    `--no-file-parallelism` fixes it **while the same test still resizes the same viewport**, so the only
    variable that flips pass→fail is cross-file concurrency. That mattered because the failure shape here is
    this milestone's recurring one — **a plausible WRONG position, never an error** (`expected 8092.6 to be
    greater than 8092.6`) — which is indistinguishable from a real defect until you isolate it. → **And in
    all three, NO assertion was weakened and the fix was measured, not taken on convenience:** 4.5 compared
    global serial **62 s** against a Firefox-only serial **57 s** and rejected the 5 s saving as not worth an
    asymmetric config. **Test-runtime is not a shipped metric; a weakened geometry assertion is a permanent
    hole.** (Two further instrument defects at 4.2 and one at 4.3 were fixed the same way.)
  - **(4) A MECHANISM THAT *CAN* PRODUCE A SYMPTOM IS NOT EVIDENCE THAT IT *DID* — an agent's diagnosis was
    falsified by a human with a grep and a toggle.** The `"Unsafe attempt to load URL file:///…"` console
    line was investigated thoroughly, correctly scoped, and **correctly flagged-not-fixed** — and the
    conclusion (render-time media in the document resolving to the page's own URL) was **wrong**. Two
    measurements at the gate killed it: `grep -n '!\[' small.md` → **nothing** (the fixture is headings and
    lorem ipsum from an `awk` one-liner and contains no images at all, so the explanation required media the
    document does not have), and **the line appears with the extension disabled**. It is Chrome's own
    behaviour on `file://` documents. → **The rule: when you identify a mechanism, CHECK THE SPECIFIC CASE
    CONTAINS THE MECHANISM'S PRECONDITIONS before concluding.** Two minutes of measurement beat an hour of
    correct reasoning, and the reasoning really was correct — every supporting fact in that investigation
    survives (the product makes exactly one `fetch`, remote URLs are neutralised inside an inert `<template>`
    before commit). Only the conclusion was unearned. **This is the same shape as (2) at the level of prose
    rather than tests:** a proof that a thing *could* be true, mistaken for a proof that it *is*.
  - **(5) MEASURE-THEN-DECIDE HELD AGAIN — and the LIKE-FOR-LIKE control is the only reason 5.2 did not
    decide from a wrong premise.** 004's D-2 split applied a second time: 5.1 measured and was **forbidden
    from choosing**, 5.2 (human) chose, 5.3 implemented — with the decision recorded in decisions.md before
    5.3 wrote a line. **The finding it bought inverts the obvious reading:** `preserveReading` roughly
    **DOUBLES the synchronous block** (16.8→34.9 ms at 50 KB; 360→717 ms at 1 MB) but adds **≈0 ms to the
    whole unresponsive window** (start → 2nd rAF), because `restoreReadingAnchor`'s `getBoundingClientRect`
    forces layout that a plain mount pays one frame later regardless. **Layout MOVED, not ADDED** — measured
    twice (5.1, re-run at 6.1 with opposite signs on the two surfaces, i.e. noise around zero). Quoting
    *"preserve − plain"* as the anchor's cost — the obvious reading, and the one a single-row table invites —
    would have concluded the anchor should be optimised or dropped, and 5.2 would have chosen a mechanism to
    fix a cost that does not exist. → **The rule: an A/B control must be like-for-like in the DIMENSION YOU
    WILL QUOTE, or it measures displacement and reports it as cost.** Getting there took two corrections
    (the first draft gave both mounts identical geometry, so the anchor had nothing to correct — **0 px
    drift on every cell**; and drift read on the timing frame reported **2738 px contained but 2 px
    full-page**, because `:host` is `scroll-behavior:smooth` and was still animating). **Read geometry after
    a settle, never on the timing frame.**
  - **(6) M4's FINDING 2 NOW HAS A KNOWN EXCEPTION, and recording it was worth a task precisely because the
    answer was "it matched."** That finding — 004's isolated probe under-predicting the real path **~13×** —
    is the entire reason 5.1 refused to quote its OPFS observer latency as a disk number and gave the gap a
    named home (5.1a) instead of a footnote. **At the gate the isolated probe HELD:** on local disk a small
    file updates instantly and 1 MB in a few milliseconds; OPFS did not under-predict. → **The asymmetry is
    the durable part** (decisions.md 2026-07-21): 004's probe erred by **omitting work the real path did**,
    whereas OPFS's suspected error ran the other way — no filesystem watcher, no atomic rename, no OS
    notification queue were all reasons disk could have been **slower**. **A rule with a known exception is
    more useful than either alone**, and *"it matched"* is the outcome nobody writes down, so an unconfirmed
    inference silently stays a guess forever. The confirmation's own limit is stated where it lives: the gate
    instrument is coarser than the harness instrument, so it confirms a **magnitude class**, not a rival
    figure — the table keeps its OPFS provenance.
  - **(7) THE `mount()` BOUNDARY — §4-1's FEAR WAS DISPROPORTIONATE, AND WHAT MADE IT CHEAP IS REPEATABLE
    RATHER THAN LUCKY.** *(tasks.md §7.2, question 1.)* Four milestones treated `mount()` as read-only
    library; plan §4-1 named editing it as the riskiest thing in 005. **The bill: the sanctioned
    anchor-only fallback was NOT needed, direction (b) was satisfiable alongside (a), `readerPane.ts` was
    never modified, and no existing caller changed behaviour.** → **Three structural properties did that
    work, and they generalise to the next shared-trunk change (006 will touch `mount()` again for diff):**
    **(i) the change was ADDITIVE and DEFAULTED-OFF** — `preserveReading?: boolean` on a `MountOptions` that
    was **already threaded through every caller**, so adding a field was not 004's port mistake; **(ii) the
    flag is read at EXACTLY ONE PLACE** (whether to capture at all), so every existing caller reaches
    `replaceChildren` with nothing read and nothing changed — a one-site read is what makes "unchanged" a
    small claim instead of a survey; **(iii) the fallback was sanctioned IN ADVANCE**, so the risk had a
    landing site and nobody had to improvise one under pressure (the 4.2 pattern from M4 — build it, measure
    it, remove it if it fails its bar). → **Would it have been cheap without the both-directions red-first?
    No — and that is the answer, not a hedge.** Direction (b) failed **8×** when the capture was made
    unconditional, *including the test that drives the real `readerPane.select()` across two files, which
    times out waiting for Reading*. **That is the app-page bug default-off prevents, observed rather than
    argued.** Without it, "existing callers are unchanged" would have been a claim resting on the same
    reasoning that produced it. → **The transferable lever: the cost of crossing a long-respected boundary
    is set by whether the change is additive, defaulted-off and read at one site — and by whether the OLD
    behaviour is red-first proven — not by how long the boundary has stood.** Four milestones of deference
    turned out to be a fact about nobody having needed it, not a measure of the risk.
  - **(8) THE GATE: M4's OPEN QUESTION ANSWERED FROM THE INVERSE DIRECTION — 6/6 → 7/7 — AND THE PROPERTY
    THAT CANNOT BE DELEGATED TO A TEST AT ALL.** *(tasks.md §7.2, questions 2 and 3.)*
    - **Question 3 — did M5 move the denominator? Yes, and the *reasoning* M4 gave for keeping the gate is
      now confirmed by an instance rather than only argued.** M4 concluded *"a clean gate is evidence about
      the BUILD, not about the GATE"* and *"retire a gate item only when something else can OBSERVE the
      property."* **The item M4 kept on exactly that ground — the real content→background transport, which no
      test on any milestone has ever exercised — is the item that caught 4.8**, in the first five minutes, on
      the first item checked. → **But read the ratio precisely, because the honest reading is narrower than
      the number:** 7/7 says every **known** shipping defect was caught here; the denominator only counts
      defects someone eventually found, so it is an upper bound on the escape rate and says nothing about
      what shipped unnoticed. **A dirty gate is strong evidence that nothing else could reach the path, and
      weak evidence about how much the gate catches.**
    - **Did the boundary move this milestone? Marginally, and NOT in the direction M4's did.** M4's
      `emulateColorScheme` was a genuine capability move (a browser command reaching platform state no in-page
      API can fake). M5 added no browser capability — it added a new **class of assertion**: the 4.8 call-site
      pin (a property of production *wiring*) and source-text pins on a file no test can load. Both are real
      and both are cheap, and **neither can reach the transport**. The gate item is untouched, and per the
      harness ledger there is still **no roadmap** to a harness that loads an extension and runs a content
      script.
    - **Question 2 — the anchor survived all three gate cases** (inserted-above lands on the same sentence;
      a wholesale heading rewrite lands via **the index fallback, the ladder's second rung, exercised on real
      disk for the first time**; that same `sed -i` is an **atomic save** and the watch survived it, answering
      spec §7-7 on disk rather than on OPFS). **The second half is still worth answering: had it failed, the
      failure would have been in the JUDGEMENT, not the mechanism** — and the tests would have stayed green
      through it. They pin *a* correct position against a numeric bar (`< 8 px`, `< 12 px`) with a non-vacuity
      control proving the naive `scrollTop` restore lands **3239.9 px / 11 592.8 px** away. **"The reader's
      place" is not a geometric property**; it is defined by a human's expectation of where they were, so a
      test can only ever pin a **proxy** for it. → **The generalisable line: a property whose definition
      references a human's expectation cannot be delegated to a test at all — name the proxy, gate the
      property, and do it AT PLAN TIME.** 005 did exactly that (D-3 declared the *feel* human-gate-only
      before a line was written), which is why the gate had a checklist item rather than a surprise. **The
      gate's own §10 finding is the same shape from the other side:** the pill's placement was *measured*
      correct (4.1's rects) and is still **not discoverable** — a measured placement is not a
      discoverability argument, and conflating them would have let a correct measurement certify a property
      it never observed (decisions.md 2026-07-21; carried, not filed as a defect).
  - **(9) A KNOWN-BUT-UNAPPLIED RULE NEEDS A MECHANICAL DEFAULT, NOT MORE AWARENESS — the SECOND instance of
    that shape in two milestones.** M4 banked it for `git checkout` (*"INCONSISTENCY, not ignorance"* — the
    safe pattern was used correctly in the same sessions), and the mechanical fix — **`cp` the file aside as
    the FIRST step of the mutation** — then held for **every** red-first in 005; the DONE notes say so per
    task and no work was lost. **The recurrence is in the shell:** a PowerShell here-string used in Git Bash
    produced a malformed commit subject repeatedly this milestone (reported by the human as ~five times),
    caught and amended every time — `git log` shows every subject well-formed, so the *catching* worked and
    only the *avoiding* did not. → **The mechanical default: pass commit messages with `-F` (a file or a
    heredoc), never an inline here-string.** *(Checked before writing this: the lesson was **NOT** already
    banked — `retro.md`, `decisions.md`, `WORKFLOW.md` and `AGENTS.md` contain no mention of it. This is the
    first time it is written down, which is itself the explanation for five recurrences.)* Same family, also
    reported this milestone: **a recursive delete followed a junction into `node_modules`** (4.4) — that is
    M4's `git checkout` incident's class exactly, **a destructive command traversing into state you did not
    mean to touch** — so the general form of both is *bound the blast radius before you run it, don't rely on
    remembering the exception at the moment you're moving fastest.*
  - **Deliberately CUT from this entry — the milestone split (D-1).** It was right, but no future session
    behaves differently for reading that: 005 alone produced five discovered tasks and a gate defect, and
    006 additionally carries snapshot storage, `DB_VERSION` 2→3, the first dependency since M1 and a
    PERMISSIONS.md trust-claim correction — the split is self-evidently the smaller of the two. **The one
    fact worth keeping is a metric, not a finding, and it corrects the number this retro was briefed with:**
    discovered work was **5 of 25 tasks (+25% over a 20-task plan), not ~35%** — but **group 4 alone
    DOUBLED, 4 planned → 8** — and **every discovered task was rework on work already believed done**
    (two "wired to nothing" defects, one harness fix, one falsified premise), **not new scope**. That is the
    plannable shape: budget the discovery margin where the *wiring* is, not evenly.
  - **Metrics:** human-gate-caught defects this milestone = **1** (4.8 — the content-script relay rendering
    nothing); running gate score **6/6 → 7/7**, **the denominator moved for the first time since M3** · the
    gate also **falsified one agent diagnosis** (the console line) and **confirmed one deferred measurement**
    (5.1a) · **~21 red-first mutations recorded in the task DONE notes**, of which **5 failed to isolate the
    property on the first attempt** (3.3's appended-block draft · 3.4's single guard · 4.1's captured
    reference · 5.3's `stop()`-only break · 5.1's control, vacuous twice) and **2 of those revealed a second
    independent guard** · unit **384 → 456**; browser **314 → 499 passed / 15 skipped** across 54
    file-instances · **defects by WHO CAUGHT THEM** — **human gate = 1**; **CI mid-development = 1** (the
    pill absent on the first file opened, six `openAndWatch` timeouts); **agent code review = 2** (4.7's
    `grep -rn "observerDetector"` finding a spec §4 criterion FALSE in shipped code, before any test existed
    that could; 4.6's Chrome file-URLs premise falsified against the docs **before a line was written**);
    **measurement = 1 prevented wrong decision, not a defect** (5.1's like-for-like control) · **harness /
    instrument defects, counted SEPARATELY = 6** (3.2 · 4.2 ×2 · 4.3 · 4.5 · 5.3 — **none of them a product
    defect**, which is exactly why they are not in the column above) · orchestrator factual errors caught by ground-truth re-derivation = **3 verified at
    this session's STEP 0 alone**, plus others reported in-milestone that no artifact records · sessions =
    several (M5, ~one per task).
    - **Why the CI column is ONE and not four, keeping M4's correction discipline:** 4.7 and 4.6 were caught
      by **an agent reading and grepping**, not by a suite — 4.7's whole finding is that *nothing in the repo
      could see it* — and 5.1's inversion was **measurement**. Counting those as CI catches would produce
      exactly the number a future retro would cite to justify thinning the review and gate steps that
      actually did the catching. **And the one genuine CI catch needs its own asterisk:** it was found by
      **new coverage written to drive the production path**, not by the existing 48-file suite, which had
      been green over that defect for the whole of group 4. **That distinction IS finding (1).**
    - **Three factual claims in this retro's own brief did not survive checking, and are corrected above
      rather than repeated:** *"tree is clean, up to date with origin"* (`git status`: **ahead by 2**);
      *"the here-string lesson is already banked in M4's retro"* (grep: **it is nowhere**); *"discovered
      tasks were ~35% of the milestone's task count"* (**20%; group 4 doubled**). Each cost one command.
      **The rule from M4's finding (7) — a prompt's factual claims about repository state are UNVERIFIED
      INPUT — is now validated on a third kind of claim: a prompt's claims about the RECORD ITSELF.**
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
    - *Computed-token coverage is real rigour but NOT a boundary move — correcting this entry's own first
      draft, by its own test.* M4 built its assertions on **computed style**, not attributes —
      `getComputedStyle(...).getPropertyValue('--paper')` across `themeRuntime` / `themeShell` /
      `themeControl` / `tocPersist` — and 3.3's own note says an attribute-only assertion would have passed
      on the pre-3.3 shell. That is the right way to test it. But **theme incoherence was never gate-only
      before 004: it did not EXIST.** With no manual theming there was no shell-vs-reader disagreement and
      no manual-vs-OS precedence to invert, and nothing stopped M3 from calling `getComputedStyle`.
      **Covering a NEW class in CI from birth is not a boundary moving** — it is the boundary being drawn in
      the right place the first time. Claiming otherwise would be finding (3)'s error exactly: citing a
      guard as evidence for a property whose scope was assumed rather than tested.
    - ***THE GENUINE CAPABILITY MOVE — `emulateColorScheme` (group 3), which the first draft of this entry
      missed.*** Before it, "an OS flip re-themes an already-open reader" was verifiable **only by a human
      flipping the OS setting**: jsdom can stub `matchMedia` but cannot deliver a real `change` event, and a
      signal injected at our own seam proves our plumbing, not the platform's. Group 3 added a Playwright
      `page.emulateMedia({colorScheme})` browser command to `vitest.config.ts` and **spiked it FIRST** —
      confirming `matches` flips, a **real `change` event fires**, and **CSS media rules re-evaluate**, on
      **both engines** — before relying on it. That converted a gate-only property into a CI-testable one,
      and the tests it enabled are load-bearing: the auto-only guard and the one-listener-many-flips
      standing guard are both proven against a genuine emulated OS flip. 003 established the seam with
      `emulateReducedMotion`; 004 extended it to a second media feature. → **THE ACTIONABLE LEVER: when a
      property looks gate-only, ask whether a SERVER-SIDE browser command can reach it before accepting it
      as human-only.** Playwright drives the browser from outside the page, so it can move platform state
      that no in-page API can fake. That is how the boundary actually moves — not by asserting harder from
      inside the page. Browser tests went **166 → 314** across the milestone; **~20 red-first mutations**
      were run, all genuinely red on both engines.
    - *But most red-firsts prove non-vacuity, they do not find bugs* — and the honest list of what CI caught
      **mid-development** is only TWO items: the **5.1 placement collision** (the obvious top-right spot
      overlaps the TOC handle at BOTH viewports — caught by geometry **before** a placement was committed,
      not diagnosed after) and the **5.2 type tightening** (three literals silently reporting "no settings
      stored"). The other two candidates do **not** belong to CI, and the attribution matters (see Metrics):
      the **6.1 restore clamp** was **specified in the task brief up front** — its red-first proved the
      implementation, it discovered no gap — and the **3.2 stale-host broadcast** was found by
      **orchestrator CODE REVIEW before implementation** (it became spec §3.4, "ruled IN"); CI proved that
      fix, it did not find that bug. Would 5.1 have reached the gate in M3? **Probably not** — M3 had
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
    both engines · browser tests **166 → 314** · **defects by WHO CAUGHT THEM: CI = 2** (the 5.1 placement
    collision · the 5.2 type tightening, which surfaced three literals silently reporting "no settings
    stored"); **measurement = 1** (the paint gate's cold budget breach); **orchestrator code review = 1**
    (the 3.2 stale-host broadcast, caught pre-implementation and written into spec §3.4) · orchestrator
    factual errors caught by ground-truth re-derivation = **4** (+1 at this session's STEP 0) · one
    increment permanently destroyed (`git checkout`) · sessions = several (M4, ~one per group).
    - **Why this split is kept honest rather than rounded up (it was inflated to "CI = 4" in this entry's
      first draft):** the restore clamp was *specified*, not discovered, and the stale-host broadcast was
      caught by review before a line was written. **An inflated CI-catch count is exactly what a future
      retro would cite as evidence that CI is catching more than it is** — and would then use to justify
      thinning the gate or the review step that actually did the catching. Finding (3) of this same entry
      is about a pin whose scope was assumed rather than tested; a metric whose provenance is assumed
      rather than traced is the same error wearing a number.
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
