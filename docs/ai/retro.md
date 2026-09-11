# Retro log — Peekover
- **2026-09-11 · M11 retro (spec 011 — math rendering: Temml/MathML inline `$…$` and block `$$…$$`/fence
  math, KaTeX's original approach REOPENED and replaced via a three-gate REVISIT, copy-as-LaTeX/MathML;
  `/retro` interview, per WORKFLOW.md §7.5, task 8.2-R).
  ★ M11 IS STILL NOT CLOSED — 8.3-R (records reconcile) remains before the milestone is done.** Per §7.5,
  this retro ran as an INTERVIEW, not solo synthesis: the human answered all three standard questions plus
  four milestone-specific experiential ones the 8.2-R kickoff added (whether the deferred 1.2-R fidelity-walk
  fork was worth deferring, whether the reopen-from-a-busted-gate decision was right, whether the
  fidelity-spike-first Group 1-R gate held up, and process). All seven answers are banked verbatim-in-substance
  below; none is invented or left pending.
  **THE HEADLINE, CITED NOT RE-DERIVED: THREE INSTANCES OF ONE FAILURE CLASS.** `decisions.md`'s 2026-09-10
  "M11 8.1-R / 1.2-R" entry names it directly: the temml bundling lone-surrogate defect (`decisions.md`
  2026-09-09, macros silently didn't render, fixed via `pnpm patch`), the §8-1(b) inline-copy-source gap
  (`decisions.md` 2026-09-10, a rendered inline formula's LaTeX source was unrecoverable), and the font-subset
  MATH-table blind spot (`decisions.md` 2026-09-10 "M11 RADICAL-RENDER DEFECT", radicals rendered as bare
  radicands). **Each was a correct-looking method with GREEN TESTS, blind to a specific untested case, and
  each surfaced only when a human looked at real rendered output** — the bundling defect at macro-fixture
  drafting, the copy gap at 6.2-R's own proof, the radical defect at the 8.1-R walk (twice — the walk found it,
  the re-walk confirmed the fix). No new action beyond what's below: the reusable lesson (green tests over a
  method's own corpus prove it against what it was tested on, not against what it's blind to) is the milestone's
  central finding, and it is why AGENTS.md's existing "a milestone-close walk or human gate has no agent
  substitute" rule (placed at the M8 seam) is load-bearing rather than ceremonial — confirmed by the human's own
  process answer below (experiential Q4(a)).
  1. **Q1 — where did the agent fail or need correction? Human's answer: "Agent was good" — no correction
     needed beyond the three observable defects above, each caught by process (the human gate / a fix-spike
     diagnosis), not by a mid-task correction to the agent's approach.** → **Action: none.**
  2. **Q2 — which rule/context was missing or wrong? Human's answer: the font-subset blind spot, specifically.**
     Task 1.1-R subset the bundled math font (`stix-two-math-subset.woff2`) by scanning Temml's rendered TEXT
     for codepoints — structurally blind to U+221A, which the browser draws from the font's OpenType MATH
     table (`MathVariants` stretchy-construction coverage) rather than emitting as a text character. → **ACTION
     — a NEW standing rule, PLACED (not just drafted) in `AGENTS.md`'s Style & structure section, 2026-09-11 (the
     M11 retro edit):** *"A specialized or math font must be subset by its required-glyph-set — including
     OpenType MATH-table constructions (radicals, delimiter extenders, operator size-variants) — never by
     scanning rendered text for codepoints; text-scanning is blind to glyphs the browser draws from font tables
     rather than emitting as characters."* Findable by the next milestone that bundles a font, so it is not
     rediscovered by walk the way M11 rediscovered it.
  3. **Q3 — which ceremony was waste? Human's answer: "None — all of it earned its keep" (the three-gate
     reopen, Golden-grows, the fix-spike shape, the deferred fidelity fork).** → **Action: none.**
  4. **Experiential Q1 — the deferred 1.2-R fidelity-walk fork (six groups, 2-R–8-R, built under the open
     fork before 8.1-R resolved it at close). Human's answer, verbatim in substance:** *"Deferring was
     net-sound — the risk was bounded (the byte-forecast de-risked the byte axis, and nothing built-at-risk
     actually had to revert), and the eventual radical fix was small. But it did delay catching the radical
     defect by several tasks: the broken font subset landed at 1.1-R and wasn't seen until the close walk after
     7.1-R. The reusable lesson is that the harness eyeball is cheap enough to run right after the font first
     renders (4.2-R), not at close — doing so would have caught the radical defect earlier at essentially no
     cost. Defer the formal fork if you want, but do the informal fidelity eyeball as soon as there's something
     to look at."* → **Action (drafted, human to place/commit per C2) — a WORKFLOW.md candidate, not placed this
     session:** *"A deferred formal fidelity/quality fork does not excuse deferring the informal eyeball — the
     first cheap human glance at a new rendering surface's real output happens as soon as that surface first
     renders, not at the fork's own close."*
  5. **Experiential Q2 — the reopen decision itself (M11 reopened, via three fresh REVISIT gates, rather than
     closing when the 1.1 byte hard gate busted; `decisions.md`'s 2026-09-06 "M11 GATE 1/2/3 — REVISIT"
     entries). Human's answer, verbatim in substance:** *"Right call. It shipped math, which was the point, and
     the three fresh REVISIT gates plus three fix-spikes all earned their keep — none was wasted overhead. The
     reusable finding is that reopening a milestone from a busted hard gate, through fresh spec/plan/tasks
     REVISIT gates, is a validated pattern, not a one-off scramble — the next busted-gate milestone has
     precedent to follow rather than improvise."* → **Action: none — this retro entry itself is the banked
     precedent** (per WORKFLOW.md §7.5's own instruction that a ritual task's kickoff should read "the target
     log's own history," this entry is now that history for the next busted-gate milestone).
  6. **Experiential Q3 — the fidelity-spike-first Group 1-R gate (`decisions.md`'s 2026-09-06 "M11 GATE 3 —
     REVISIT" entry: a merged fidelity-AND-byte gate, replacing the original single byte-only gate shape).
     Human's answer, verbatim in substance:** *"It held and earned its keep — it caught the byte bust (1.1
     branch C, the whole reason the milestone reopened) and front-loaded the fidelity risk so the fork resolved
     on measured evidence rather than vibes. The one wrinkle worth naming: it was really 'byte-spike-first,
     fidelity-spike-deferred' — the byte half ran first as designed, but the fidelity half (1.2-R) slid to close
     by choice (see experiential Q1). The structure is reusable, with the note that deferring half of a merged
     gate re-opens the exact question the gate was built to close early."* → **Action: none — the wrinkle is
     the naming this task's own kickoff asked for; a future merged gate should read this alongside experiential
     Q1's drafted action.**
  7. **Experiential Q4 — process. Human's answer, verbatim in substance, three parts:** **(a)** *"The human
     gate caught what the tests missed — three times (the bundling defect, the copy-source gap, the radical
     blind spot), each a green-tested method blind to an untested case, each surfaced only by a human looking
     at real rendered output. Keeping 8.1-R a human walk with no agent substitute is what kept the milestone
     from shipping broken radicals; it earned its existence."* — confirms the headline finding above and the
     existing AGENTS.md "no agent substitute" rule; **action: none, rule already stands and held.** **(b)**
     *"Agent runs on the close/measurement tasks got very long (6.1-R, 6.2-R, the rule-9 hardening each ran
     multi-hour with heavy autonomous bisection) — the results were sound, but as we approached the
     human-gated close the loop wanted more human check-ins on the seams, not fewer."* → **Action (drafted,
     human to place/commit per C2):** *"As a milestone approaches its human-gated close, prefer shorter,
     more frequent check-in sessions on close/measurement tasks over long autonomous bisection runs — the
     seams near a human gate are exactly where a check-in is cheapest and most valuable."* **(c)** *"Background/
     loop activity surfaced twice near close that wasn't driven by the active task (a stray shell, a stray font
     search) — benign both times, but the hygiene lesson is to confirm the tree is clean before each code task
     at milestone-close, and to understand what's firing those processes."* → **Action (drafted, human to
     place/commit per C2):** *"At milestone close, confirm the working tree and any background/loop processes
     are clean and accounted for before starting each task — a stray shell or unrelated background search
     carried between close-adjacent tasks is a hygiene defect even when benign."*
  **Other observable findings, cited not re-derived, tied to the answers above.** The rule-9 (harness-shared-
  state) rule placed at the M10→M11 seam (`AGENTS.md`, the M10 retro's own action) FIRED repeatedly and
  correctly this milestone — 4.3-R's Resource Timing buffer, 5.1-R's button count, 6.2-R's watch-note, and a
  dedicated rule-9 hardening pass (`decisions.md`/`tasks.md`'s own 8.1-b entry, "full browser suite green in ONE
  pass, repeatably") — it held up under M11's heaviest browser-test load yet; no refinement requested (Q2/Q3).
  "Golden grows" (3.1-R's read-only audit before the parse rule landed, then 3.2-R's own growth) is this
  milestone's shape-difference from M10's "Golden EMPTY," and per Q3 ("all of it earned its keep") it is
  confirmed as not having caused friction worth naming as its own finding. The fix-spike shape — three defects
  (bundling, radical, §8-1(b)) fixed via out-of-sequence spike tasks rather than numbered `tasks.md` entries,
  each banked as its own dated `decisions.md` entry with the pivot recorded — is the same discipline Q3 and
  experiential Q2 both confirm earned its keep: no silent detours, no full re-gates, each spike is its own
  citable record.
  **Metrics:** corrections = **0** (Q1: "agent was good," no mid-task correction to the agent's approach) ·
  distinct from corrections, **defects caught by human gate / fix-spike diagnosis = 3** (bundling, §8-1(b),
  radical — each shipped past a first green test-suite run, per the headline finding, not classed as an
  agent-execution first-try failure) · first-try verification pass = **MOSTLY YES**, with the three
  above as the named, already-cited exceptions · sessions used **≈ 24** (an estimate: 3 original planning
  gates + 3 REVISIT gates + 15 tasks across reopened groups 1-R–8-R including this retro + 3 out-of-sequence
  fix spikes — bundling, radical, §8-1(b)). **All seven interview answers landed from the human this session —
  none is marked pending.** 8.3-R (records reconcile) closes the milestone next.
- **2026-09-06 · M10 retro (spec 010 — local exports: HTML/PDF export, copy as rich-text/HTML/plain
  text, export shortcut, print-optimized mode; `/retro` interview, fresh session, per WORKFLOW.md §7.5).
  ★ M10 IS STILL NOT CLOSED — 11.2's own checkbox is ticked by this entry, but a final 11.3 pass (repeating
  the pointer walk as a discrete step on the actual closing commit, folding in whichever carried items this
  entry resolves) remains before the milestone is done.** **M10 opened with a dependency-measurement hard
  gate that BUSTED, and closed having added ZERO net production dependencies.** Task 1.1 measured
  `docx` + `client-zip` against the ~367 KiB (375,808 B) `.output` headroom: the combined ablation cost
  **+380,358 B**, busting the ceiling by **4,550 B (~1.2% over)** — `docx` alone was **+373,820 B** of that.
  The milestone was SUSPENDED at that fork. The resolution was not "find room" — it was **four
  human-ruled scope reductions**, each evidence-backed, and both installed dependencies were later removed
  (production deps: 6 → 8 at task 1.1 → 6 at close, confirmed against the installed tree, not assumed).
  The gate's real output was scope discipline, not a go/no-go answer.
  - **(1) THE FOUR SCOPE REDUCTIONS ARE ONE PATTERN — EVIDENCE RETIRED WHAT DIDN'T FIT, NONE CUT FOR TIME.**
    DOCX export (§3.10) busted the byte ceiling — MEASURED out. Local-image embedding (§3.1) — the
    folder-source seam retains no byte-readable local-image reference (D1), and local images were already
    broken in the reader — DIAGNOSED out, and **empirically CONFIRMED at 11.1's human walk (finding A1)**,
    the one finding no test harness could reach, verified by a human opening a real local-image document.
    ZIP export (§3.1(cont.)) — redundant with copy-as-plain-text once images were gone — REASONED out. The
    progress indicator (§8.3) — 10.2 measured no surviving export "heavy" (0.30–26.95 ms across a
    1 KB–1.12 MB corpus) and the two remaining export paths are synchronous-can't-render or async-instant —
    MEASURED out. The milestone SHRANK to fit reality rather than forcing features that didn't fit, and
    shipped the survivors solidly: HTML export, three copy actions, PDF via `window.print()`, the Ctrl+S
    shortcut defaulting to HTML, last-format memory, per-action failure states, zero-network, print mode.
    `spec-coverage.md`'s F9 (Export & Publishing) moved **0% → 38%**, F5 (Navigation & Reading UX) moved
    **36% → 38%** (11.3's re-score). No action — this is the milestone's story, not a rule gap.
  - **(2) A MISSING STANDING RULE FOR THE BROWSER SUITE'S SHARED CROSS-FILE STATE — THE MILESTONE'S BIGGEST
    REUSABLE ENGINEERING LESSON, HIT REPEATEDLY AND NEVER NAMED ONCE, STANDING.** The browser suite runs
    files SERIALLY, sharing one real per-engine `document`/`window`, so any assertion about shared state
    must be delta-based or specific-content-matched — never absolute or pristine-state-assuming. Four
    facets this milestone: a cross-file clipboard-content race (M8-era, only flagged for this retro at
    11.3), a document-listener cross-file leak (task 8.1 — `reactionsTo()`'s delta-spy is the worked
    reference), enhancer timing-flakiness (clears on isolated rerun, ruled out as flaky-not-real by a causal
    argument, not merely a clean rerun), and a lesser instance, codeDetect corpus-drift (a re-pin, not a
    test regression). **Interview answer (Q2 — missing/wrong rule): none volunteered beyond this candidate,
    which the session confirmed is worth banking.** → **ACTION (drafted, human to place/commit per C2):**
    *"The browser test suite runs files serially sharing one real per-engine `document`/`window`; any
    assertion about shared state (clipboard, document-level listeners, timing, module-level caches) must be
    delta-based or specific-content-matched, distinguishable from a real regression by an isolated rerun —
    never asserted as an absolute count or non-empty check."* **PLACED in `AGENTS.md`, 2026-09-06** (the
    M10→M11 seam edit).
  - **(3) THE KICKOFF-IS-A-HYPOTHESIS LOOP CAUGHT ITSELF REPEATEDLY, INCLUDING AT THE MOST TEMPTING MOMENT
    TO CUT A CORNER — THE CLOSE. Interview answer (Q1 — where did the agent fail or need correction): "it
    worked well" — no correction needed; the standing rule performed as designed.** Instances, confirmed
    against decisions.md: **7.1** — the kickoff's own Q2 guidance ("prefer MOVE `@page` to `appShell.ts`")
    was checked against 6.1's landed finding and found wrong; the kickoff's literal binary (adequate/
    inadequate) turned out to have a third, cheaper option the kickoff never named. **9.1** — the kickoff's
    framing of which tasks deferred completion-UI was checked against `tasks.md`'s own text and corrected.
    **9.2** — the kickoff leaned toward arming two firing-control lanes; the code could only emit one, so
    one lane, correctly. **10.3** — the gate clause pointed at 6.1's superseded "inadequate" finding; 7.1's
    relocation superseded it, and the walk proceeded on the corrected premise. **10.4** — a prior-turn
    kickoff's own byte-ledger draft had task 3.2's figure wrong (+2,052 B stated vs +7,752 B actual),
    caught by re-summing against the task's own recorded commit figure. Five of these are reviewer-kickoff
    catches; **10.5 is the one self-catch** — the executor's own reconcile step found a third premise-rewrite
    and a third byte-graph (`background.js`) that neither the kickoff nor the first pass had named. **★ THE
    CAPSTONE, at 11.3: a kickoff instructed "do 11.2 and 11.3" on the false premise that 11.1 was already
    landed. Ground truth: 11.1 and 11.2 were both unticked, no landing commit for either, zero retro
    entries.** The executor caught it, flagged it, asked, and refused to declare M10 closed on the false
    premise — left 11.3's own checkbox unticked, did only the reconcile work that didn't depend on 11.1/11.2.
    The value here was never either role being "right" — it was the discipline that a kickoff's claims get
    verified against the code/record before acting, holding at the point where "just mark it done" was the
    easy wrong move. No action — the standing AGENTS.md rule already covers this and worked six-for-six plus
    one self-catch.
  - **(4) WHAT WAS GENUINELY HARD, NAMED RATHER THAN SMOOTHED.** The DOCX bust suspended the whole milestone
    mid-flight at task 1.1, with every task past it SUSPENDED pending a human spec revisit — a real stop,
    not a formality. The `@page` print-fidelity engine-divergence forced the 6.1→7.1 relocation (Chromium/
    app-page ships full fidelity; Firefox and the content-script surface do not — a named, flagged residual,
    not a silent gap). The browser-suite harness flakiness (finding 2) recurred across the milestone rather
    than being fixed once. And the reviewer's own false-premise-at-the-close (finding 3's capstone) is the
    kind of error that, caught one session later, could have shipped a false "M10 CLOSED" record.
  - **Interview answer (Q3 — which ceremony was waste): "nothing was wasted."** No action.
  - **Metrics:** corrections = **7** (six reviewer-kickoff catches — 7.1, 9.1, 9.2, 10.3, 10.4, and 11.3's
    capstone — plus **one executor self-catch**, 10.5, which is not a reviewer-kickoff miss and is counted
    separately per the human's own correction to this entry's draft) · first-try verification pass =
    **MOSTLY YES** — the harness-flakiness incidents (enhancer timing, the document-listener leak, codeDetect
    corpus drift) are correctly classed as shared-cross-file-state environment artifacts, not first-try
    implementation failures · sessions used **≈ 30** (an estimate, endorsed as such, not hardened to a false
    precision — 3 gates, 1.1, 2.1–2.2, 3.1–3.5, 4.1, 5.1, 6.1, 7.1, 8.1–8.3, 9.1–9.2, 10.1–10.5, 11.1–11.3).
- **2026-08-22 · M9 close (spec 009 — code blocks: Shiki syntax highlighting, per-block toolbar (copy /
  line-numbers / line-highlighting / word-wrap), code themes, collapsible blocks, systemic degradation
  paths).** Gate 1 → gate 2 (four rulings) → gate 3 (two rulings) → 24 tasks across nine groups: foundation
  (Shiki engine, governed import) · the app-page harness (D-1, built before any Shiki code) · fence-meta
  plumbing (D-8) · the enhancer + toolbar + import fence (group 4's five tasks) · code themes (D-9) · the
  collapse/expand structure (D-10) · systemic engine/theme-load failure paths · a measure→decide→implement
  cluster (M-1 byte budget, M-2 first-paint gate, M-3 auto-detection pricing, M-4 theme/threshold/defaults,
  all seven values human-ruled at 8.5, implemented at 8.6) · the milestone-close walk (9.1, real
  Chromium+Firefox, 8 PASS/1 PASS+FINDING). At close: `.output` **4,866,741 B (Cr) / 4,866,857 B (Fx)**
  against the 5 MiB bound (~367 KiB headroom) · zip **1,470,730 / 1,470,788 B** against the 2 MB bound
  (~612 KiB headroom) · content script **334,858 B** · app chunk **475,579 B** · deps **6** ·
  `permissions: []` both engines · golden EMPTY. **The headline is that this milestone's own kickoff
  discipline was the thing under test, not the feature** — five-going-on-six kickoff scope-hypothesis
  errors in a row drove a mid-milestone methodology shift, and the retro task itself (9.2) fell into the
  exact failure M8's retro had already named and filed an action for.
  - **(1) THE KICKOFF-IS-A-HYPOTHESIS RULE CAUGHT SIX SEPARATE MISSES THIS MILESTONE, AND THE SIXTH WAS A
    RECURRENCE OF A FAILURE M8's OWN RETRO HAD ALREADY DOCUMENTED AND ACTIONED.** 4.1's kickoff merged 4.2's
    scope into one task; a related task assumed the wrong shiki-import edge count; 4.5 repeated the shape;
    5.2 proposed a hand-curated 14-theme set where tasks.md explicitly said "not hand-curated"; 6.1's
    resolution said "always default expanded, no threshold" where tasks.md's own line specified a
    collapse-past-40-lines rule. Each was caught at Step 0 and routed via AskUserQuestion before code was
    written — the discipline held every time — but the recurrence rate (five tasks across groups 4-6) was
    high enough that 7.1 shifted the kickoff-writing methodology itself to scope-minimal and
    methodology-heavy, which stopped the recurrence but was a lagging fix, not a leading one. **The sixth
    miss is the more pointed one**: 9.2's own kickoff, drafted this same milestone, proposed a fully
    autonomous solo-synthesis retro where tasks.md 9.2's own line says *"Run `/retro`"* — an interview
    ritual, documented in `.claude/commands/retro.md` — and M8's retro (this file, 2026-08-13, finding 1)
    had already named this EXACT shape of error at 6.2 and filed the standing rule for it. The evidence to
    catch it was sitting in the same file the retro was about to be written into, and it wasn't checked
    until Step 0. → **ACTION (drafted, human to place/commit per C2):** a WORKFLOW.md §7.5 line — *"Before
    drafting a kickoff for a ritual task (retro/gate/walk), read the target log's own history for how prior
    instances of this ritual ran — it is closer authoritative precedent than tasks.md's one-line pointer."*
    → **A second, leading-not-lagging action for the recurring scope-hypothesis miss itself:** *"A kickoff's
    WORK section must be checked against tasks.md's own line-item text before drafting — not after. If a
    kickoff's scope exceeds, narrows, or substitutes a resolution for what the task's own line already
    states, that is a drafting-time defect, not just a Step-0 catch."*
  - **(2) A MISSING RULE FOR HOW PROVISIONAL CONSTANTS RESOLVE, DERIVED IN-SESSION AT 5.2 RATHER THAN
    STATED ANYWHERE STANDING.** 5.1 shipped `PROVISIONAL_CODE_THEME` with a comment pending 8.4/8.5's
    ruling; 5.2 correctly removed the constant entirely rather than updating the comment in place, on
    drift-risk reasoning that was 5.2's own contribution, not a citation to any existing rule. This is
    adjacent to 008's "a PROPOSED comment left on a chosen value is a lie about the decision state" but adds
    the constructive half that rule never stated. → **ACTION (drafted, human to place/commit):**
    *"When the mechanism that made a value PROVISIONAL becomes real, remove the provisional constant rather
    than updating its comment in place — if a single source of truth already carries the resolved value, a
    second copy is drift risk, not documentation."*
  - **(3) "NECESSARY RIPPLE" WAS HANDLED WELL THREE SEPARATE TIMES (5.1, 5.2, 6.1) WITHOUT EVER BEING NAMED
    AS A RULE — A MISSING RULE, NOT A WRONG ONE.** 5.1 routed an ambiguous ripple file to the human; 5.2
    used plan-mode with explicit per-file justifications; 6.1 applied 4.3's CS-byte-identity precedent to
    override an apparent scope boundary. By 7.x the pattern was stable enough to name, and it governs both
    kickoff-writers and task-executors, which argues for AGENTS.md placement over a workflow-ritual note.
    → **ACTION (drafted, human to place/commit) — bidirectional, naming both failure modes:**
    *"Necessary ripple — a file structurally required by the Verify line but absent from the Files list — is
    not scope creep; it must be enumerated explicitly, in the plan or kickoff, with a per-file justification
    tied to the specific Verify clause that requires it. Conversely, a file added beyond what the Verify
    line requires IS scope creep, even if related — route it via AskUserQuestion rather than including it on
    judgment alone."*
  - **(4) THE BYTE-BUDGET HEADROOM WAS TIGHTER THAN THE STANDING MENTAL MODEL FOR MOST OF THE MILESTONE,
    AND NOTHING SURFACED IT UNTIL IT BECAME A LIVE CONSTRAINT AT 5.2.** The actual headroom at 8.5's
    measurement — ~367 KiB against the 5 MiB `.output` bound, ~612 KiB against the 2 MB zip bound — never
    bound this milestone, but 5.2's own Decision 1 had to navigate it explicitly (theme-chunk cost against
    the picker), and that navigation wasn't informed by any kickoff's standing-invariants block stating the
    snapshot up front. → **ACTION (drafted, human to place/commit):** *"Every task kickoff's
    standing-invariants block states the current bundle-budget snapshot (bytes used / ceiling / headroom),
    not only at milestone close — a small tax that surfaces a ceiling-breach before it lands instead of at
    measurement time."*
  - **(5) TWO CEREMONIES TAXED THE MILESTONE WITHOUT PROPORTIONATE PAYOFF: PER-EXTENSION RED-FIRST
    ABLATIONS ON PATTERN-MIRRORING TESTS, AND FULL-SUITE VERIFY ON EMPTY-PRODUCTION-DIFF TASKS.** Ablating a
    new `describe` block that mirrors an already-established fixture-and-assertion shape re-proves what the
    pattern's original ablation already proved, at roughly 5 minutes per instance across groups 4-7. Full
    browser-suite runs on tasks with an empty production diff (7.1's unchanged `codeEnhancer.ts` plus one new
    browser test file) structurally could not catch anything a targeted run wouldn't — **except that 5.2's
    own [hidden]/cascade defect is the standing proof that "obviously scoped" is sometimes wrong**, which is
    why the carve-out below is narrow rather than a blanket relaxation. → **ACTION (drafted, human to
    place/commit), two lines:** *"Red-first ablations earn their keep on novel assertions. A test extension
    that mirrors an already-established pattern's shape doesn't need its own per-extension ablation — the
    pattern's original ablation is standing precedent, cite it instead of re-earning it."* and *"Full-suite
    Verify is mandatory whenever production code changes. Test-only tasks with an empty production diff may
    use targeted-suite Verify plus a spot-check that adjacent surfaces weren't inadvertently touched, instead
    of the full suite."*
  - **(6) THE [HIDDEN]/CASCADE DEFECT CLASS RECURRED AT 5.2, CAUGHT ONLY BY THE FULL-BROWSER-SUITE GATE,
    BECAUSE STANDALONE-MODULE TESTS STRUCTURALLY CANNOT SEE CROSS-FILE SELECTOR INTERCEPTION.**
    `codeThemeControl.ts` shipped past its own unit and browser tests — both built against bare markup with
    no `APP_CSS` stylesheet attached — and only the mandatory full-suite Verify gate caught the interception
    across 22 unrelated tests. Fixed with the same pattern `readerCss.ts` already established for
    `diffChrome`. Not a new defect class (permanent since M-prior), but a fresh instance proving self-scoped
    tests cannot structurally catch it — the full-suite gate is load-bearing, not redundant, which is the
    fact that bounds finding (5)'s carve-out to production-diff tasks only.
  - **(7) RULING 4's STANDING-BASELINE CLAIM: HOLDS, WITH ONE HONEST GAP NAMED RATHER THAN SMOOTHED.** The
    app-page harness (D-1) produced two independent numeric readings this milestone — 2.2's pre-Shiki
    89.2/89.3 ms median, 84.8/86.8 ms floor, and 8.2's post-Shiki 90.8-96.3 ms median, 86.2-88.1 ms floor —
    an A-B-A within the same milestone with a flat delta inside the same-session noise band both readings
    independently carry. That two-reading comparison is real evidence the number is stable enough to serve
    as a floor. **The gap:** 9.1's walk-time check against this baseline was a subjective "feel" read
    against 8.2's banked figure, not a third independent numeric run — so the standing-baseline claim rests
    on two numeric readings plus one qualitative confirmation, not three numeric ones. Honest status: holds,
    un-re-opened, but a third numeric confirming run (rather than a subjective one) would strengthen it
    further if a future milestone's own work touches this surface anyway. **Content-script floor (26.9/29.9
    ms) confirmed UNMOVED** — 009 never touches that surface, so no floor-delta statement is owed there, but
    the confirmation is stated, not assumed.
  - **Carried items (decisions.md references, not fixed here):** 9.1's toolbar/block vertical spacing
    (`decisions.md` 2026-08-22 · M9 9.1, ship-as-is, revisit when `readerCss.ts`'s `.peekover-code-toolbar`
    rule is next touched, by M11 close at the latest).
  - **A note on this entry's own ceremony, named by the person who wrote most of these kickoffs, not by
    CC:** review write-ups across the milestone ran a fairly constant 800-1500 words regardless of a task's
    actual novelty — appropriate for 5.2 (large design surface) and 6.1 (a real off-by-one), excessive for
    low-novelty tasks (7.1's empty diff, 8.6's bundled implementation) whose "lessons to carry" mostly
    restated that the discipline held. This is the kickoff-writer's own discipline to fix, not a rule for CC
    to follow, so no AGENTS.md action is filed for it.
  - **Metrics:** corrections = **6** (five kickoff scope-hypothesis misses across 4.1/4.2, 4.5, 5.2, 6.1,
    counted as cascading-from-one-event where applicable, plus the 9.2 ritual-precedent miss) · first-try
    verification pass = **MOSTLY YES** — the exceptions are two full-suite/boundary catches, not first-try
    implementation failures: 5.2's [hidden]/cascade surfaced only on the full-browser-suite run, and 6.1's
    phantom `.line` span off-by-one was caught by a boundary test before commit · sessions used ≈ **25**
    (gate 1, gate 2, gate 3, 1.1-1.2, 2.1-2.2, 3.1, 4.1-4.5, 5.1-5.2, 6.1, 7.1-7.2, 8.1-8.6, 9.1, 9.2 — plus
    8.5's human-decision-gate session, interactive rather than solo).
- **2026-08-13 · M8 close (spec 008 — Persona-#1 QoL: compare two files · agent-file awareness · table
  tools).** A same-basename agent-file badge (D-1/D-2), a compare picker widened to admit any file in the
  folder beside snapshots (D-3/D-4/D-5), and table tools — sort, filter, copy-out — on both surfaces behind
  a measured escape hatch (D-6…D-9, D-12) that §8-1 could have pulled if the content-script reach didn't
  fit. Six groups, **thirty-five planned tasks, ZERO discovered tasks**, closed by the gate-2 split (3.2–3.5,
  the heaviest table-tools task reviewed as four revertable units) and the measure→choose→implement→execute
  arc group 5 ran end to end: 5.1–5.4 measured without choosing, 5.5 chose on a human gate with the numbers
  in hand, 5.6 and 5.7 executed the choice — one of them a recorded no-op, because always-on set no constant
  and the reach shipping meant nothing to remove. At close: bundles **CS 329,233 B** (Cr `b115c9ae…` / Fx
  `237831d2…`), **app 399,646 B** (`7275a378…`), **background 3,548 B**, unchanged since 5.4 because no
  `src/` file moved after it; golden **EMPTY**; **007 import fence 8/8**; `permissions: []` both engines;
  manifest **2975 B**; deps **exactly 5**. Full suite re-verification is **6.3's**, not re-run here.
  **The headline is that the discipline this project has been building for eight milestones got tested
  against its first real edge case each — a non-zero byte delta, a chosen-not-discovered scope, a walk that
  turned out to be genuinely irreplaceable — and held on all three, with the wrinkles named rather than
  smoothed.**
  - **(1) THE KICKOFF-IS-A-HYPOTHESIS RULE FIRED THREE TIMES THIS MILESTONE AND WAS NEVER PROMOTED TO A
    STANDING RULE — SO THE SAME DISAGREEMENT GOT RE-DERIVED INSTEAD OF CAUGHT ONCE.** 3.9's kickoff
    hypothesized a new predicate where the task's own body was test-only; 5.7's kickoff demanded a rebuild
    where the body specified a bare conditional record (5.5 had ruled the reach IN, so 5.7 had nothing to
    execute); and this entry's own kickoff said "write the retro solo" where 6.2's body said *"Run `/retro`"*
    — an interview, not a solo write-up. Each time the agent caught the mismatch and followed the tasks-file
    body, because "a kickoff is a hypothesis, the body is authority" is *true* in this project — but that
    instruction lived inside each kickoff's own text rather than as a rule the agent could check
    independently of whichever kickoff it was handed, so the same catch had to be re-derived three times
    instead of made once. **The honest counterweight: this was not pure waste.** Flagging the mismatch each
    time is exactly what kept 5.7 from ballooning into an unneeded rebuild and kept this retro from being
    written without a human in the room — the pattern recurring three times is evidence the discipline held,
    not evidence it failed. → **ACTION: name the rule once, standing, in `AGENTS.md` — the rule is named
    above; its `AGENTS.md` wording is reserved to the human, adopted 2026-08-13 (AGENTS.md, Workflow
    section, kickoff-is-a-hypothesis bullet).**
  - **(2) THE MILESTONE-CLOSE WALK HAS NO AGENT SUBSTITUTE, AND THAT WAS DISCOVERED EMPIRICALLY MID-ROUND
    INSTEAD OF STATED UP FRONT — COSTING A REPEAT BEFORE IT PAID OFF EXACTLY AS M7's FINDING 4 PREDICTED.**
    Group 6's three kickoffs arrived in an order that let the agent reach for 6.3 (the reconcile) before 6.1
    (the walk) had run, and separately attempt the walk itself — twice hitting the same wall (`chrome://` is
    walled off from automation; no tooling exists to load an extension into Firefox) before the actual human
    walk landed. The agent refused to fake the walk on both attempts, so no task shipped wrong, but the wall
    was **rediscovered** rather than known. Once the real walk ran, it did exactly what a milestone-close gate
    is for: it found two things no rect probe or byte count could — the badge reads better grouped with the
    other pills than alone at its measured lane, and the toolbar's Filter/Clear/Copy controls ship as
    unstyled default form elements, never integrated with the reader's design language. Both **filed forward,
    not fixed** (the human ruled record-not-fix), and both **confirmed rather than overturned** §3.6/§8-2's
    per-table call — five filter boxes on `plan.md`'s five tables read as repetition that "looks good," not
    noise. → **ACTION: state once, standing, that a human-gate item requiring a loaded browser extension has
    no agent substitute — the rule is named above; its `AGENTS.md` wording is reserved to the human,
    adopted 2026-08-13 (AGENTS.md, Workflow section, milestone-close-walk bullet).**
  - **(3) THE FLOOR MOVED, AND M8 STATES THE NUMBER BEFORE ANY RE-BASELINE DISCUSSION, PER FINDING 8's OWN
    RULE APPLIED TO THIS MILESTONE'S OWN CODE.** M8's shipped first-paint floor on the standing 50.4 KB
    fixture reads **145.7 / 143.4 / 145.2 ms**, against the standing baseline floors of **135.1 / 132.6 /
    134.7 ms** (2026-08-03, `757f953`) — a floor delta of **roughly +10.5 to +10.8 ms across the three
    readings**, stated as a number whether or not a re-baseline follows. **None is proposed here.** The delta
    is not a surprise re-derived at close — it is 5.1's own measured price for the content-script reach
    (**+8.9 ms median / +11.1 ms floor** against the standing **26.9 / 29.9 ms** headroom, consuming
    **37.1% / 40.8%** of it at the widest reading), and §8-1 shipped precisely because the moved floor still
    fits inside that budget — 5.5's ruling is the record of that choice, not this entry's. **A flat floor with
    a breaching median is environment; a floor that has moved up is code** — M8's is code, named, and it fits.
  - **(4) THE ZERO-RESIDUAL BYTE DISCIPLINE HELD UNDER M8's FIRST DELIBERATELY NON-ZERO DELTA, DECOMPOSED IN
    BOTH DIRECTIONS AND RECONCILED A THIRD WAY.** Every milestone through M7 either moved zero content-script
    bytes or treated a delta as a defect to eliminate; M8 is the first to spend bytes on purpose and account
    for them anyway. Content script: **318,747 → 329,233 B (+10,486 B)**, decomposed component-by-component
    at 4.3 to a measured zero residual, confirmed by a master control (all fourteen M8-touched files reverted
    returns the build to baseline byte-for-byte and md5-for-md5). App chunk: **389,143 → 399,646 B
    (+10,503 B)**, decomposed the same way at 5.4, confirmed by its own master control. **The two chunk
    deltas reconcile a third way**: the unzipped package moved by exactly **20,989 B**, and 10,503 + 10,486 =
    20,989 — nothing outside those two chunks drifted a byte. Never by grep, every time by ablation and md5.
    **The one honest wrinkle:** 5.4's own component sum landed 2 B off its measured figure (6,719 vs 6,717
    for the three controls) — named as the minifier's name-pool non-linearity and **quarantined, not smoothed
    into the residual** (row 6 enters as the single ablation-measured 6,717, never a sum of sub-marginals),
    matching 4.3's earlier −1 B instance of the same effect on the content script. The discipline survived
    contact with a real, non-zero, deliberately-spent delta — the first time it has been tested that way.
  - **(5) A MID-RUN SELF-CATCH, NAMED RATHER THAN SMOOTHED, BECAUSE A CORRECTED SLIP THAT NEVER REACHES THE
    RECORD IS INVISIBLE UNLESS THE RETRO SAYS SO.** During 5.4's measurement pass, a cut regex corrupted a
    neighbouring declaration; caught before commit, re-cut, and the shipped artifact and its commit carry no
    trace of it — which is exactly why it belongs here and nowhere else. No action proposed: this is a process
    note, not a rule gap, and the same session's −2 B non-linearity (finding 4) is itself evidence the byte
    accounting was being checked closely enough to catch it.
  - **Metrics:** corrections = **5** (three kickoff-vs-body flags — 3.9, 5.7, 6.2 itself — one group-6
    walk-sequencing catch that recurred across two sessions before 6.1 landed, and one self-caught cut-regex
    slip at 5.4) · first-try verification pass = **NO** — 5 corrections against 35 tasks, the other 30 landed
    clean · sessions used ≈ **37** (35 task sessions, one per task per the M5/M6/M7 convention, plus 2 extra
    spent discovering that the milestone-close walk has no agent substitute before 6.1 could run).
- **2026-08-02 · M7 close (spec 007 — Mermaid diagrams + diagram cache, M7a).** Mermaid rendering on the
  app-page reader behind a lazy chunk the content script never reaches, a **SECOND named sanitizer profile**
  for SVG, a theme-partitioned diagram cache (`DB_VERSION` 4, two stores), per-diagram copy / download /
  lightbox, and degradation to readable source on engine-load and storage failure — with **`permissions: []`
  still intact** and the **SECOND `dependencies` addition since M1** (`mermaid@^11.16.0`, the fifth
  production dependency, **~3.3 MB of it proven OFF the gated path by ablation**). Nine groups, **twenty-eight
  planned tasks, ZERO discovered tasks** — and **TWO out-of-plan fix commits AFTER the close gate**, which is
  where this entry's headline lives. At close, **re-measured this session at `fc3a142`**: lint EXIT=0 ·
  **728 unit** (51 files) · **927 in-browser passed / 15 skipped**, 100 file-instances, both engines · golden
  diff EMPTY · the diagram import fence **8/8** · content script **318,747 B** both engines (per-engine md5
  stable; the engines differ in exactly ONE pre-existing byte) · app chunk **389,143 B**, md5-identical both
  engines · `permissions: []` on both built manifests · first paint **152.3–163.2 ms** medians, **floor
  145.3 ms**, against the **<165 ms** bar M6 re-baselined. The 9.1 gate **PASSED all eight items and found
  TWO shipping defects** (running score **10/10 → 12/12**), both fixed before close, each in its own session
  and its own commit. The settled architecture (D-1…D-15, the six 8.4 bound decisions, the six in-flight
  amendments) is in decisions.md 2026-07-27…2026-08-01 — **linked, not restated**; the measurement evidence
  is progress.md § Baselines and § Carried items. **The headline is that BOTH end-of-milestone fixes had
  their KICKOFF PREMISE FALSIFIED BY MEASUREMENT before a line was written, and the single most valuable
  move this milestone made — repeatedly — was red-first-ing the DIAGNOSIS instead of the fix.**
  - **(1) THE HEADLINE — A KICKOFF PREMISE IS A HYPOTHESIS, AND THE FIRST STEP OF A FIX IS TO MEASURE THE
    PREMISE, NOT TO EXECUTE IT. Twice in a row, at the end of the milestone, the stated diagnosis was wrong,
    and one measurement each killed it before a line was written.** **(a) The dark-mode fix.** The kickoff
    said *"we pass a theme, just not the keys"* — i.e. add the missing colour keys. The truth was that the
    effective theme reached **`diagramCacheKey` and nothing else**: `DIAGRAM_ENGINE_CONFIG` carried no
    `theme` and no `themeVariables`, and `initialize()` was handed that theme-free constant once per load.
    **Mermaid drew its default LIGHT picture at every theme** — proven, not argued: the adopted `<svg>` was
    **byte-identical at dark and at light** on both engines once the render id was normalised. Executing the
    premise would have added keys to a config that was never consulted per theme. **(b) The gantt fix.** The
    kickoff said *"give it a real width"*. The reading column's width is **reachable AND insufficient**:
    measured on the sparse fixture, no width → **12 of 12** adjacent labels overlap, **700 → 12 of 12**,
    1200 → 0, and **684 sits inside the overlapping regime**. Nor does any larger constant work — d3 picks
    tick **count** by count and never by pixels, so the width a gantt needs grows with its SPAN, and
    `useMaxWidth` then scales an over-wide layout back DOWN, below the designed glyph size. **The lever was
    the axis FORMAT** (`%b %d`), with a width only as the room it needs to work in. → **What is common to
    both is the reusable part: the SYMPTOM was reported correctly and the MECHANISM was reported wrongly.**
    A kickoff written without the artifact executing in front of it can see WHAT is broken and cannot see
    WHY. → **THE RULE, mechanical enough to apply without thinking: the first commit-shaped move of any fix
    task is a MEASUREMENT WHOSE ONLY JOB IS TO FALSIFY THE STATED DIAGNOSIS.** Normalise the render id and
    diff the two artifacts; sweep the container width across the range the premise assumes; *then* build.
    **It cost one measurement each.** → **This is M5's finding (4) — a mechanism that CAN produce a symptom
    is not evidence that it DID — at the altitude of a fix kickoff rather than a console line, and it is the
    third kind of prompt claim this project has had to treat as UNVERIFIED INPUT** (M5 banked repository
    state, M6 banked machine state; **M7 banks the DIAGNOSIS itself**). → **And state the counter-intuitive
    half plainly, because it is what makes routing a premise back feel like progress rather than friction:**
    both fixes are smaller and more correct than the ones their kickoffs described, and in (b) the premise's
    own fix would have shipped a NEW defect — a shrunken glyph — in place of the old one.
  - **(2) THE COROLLARY, AND IT HAS THE LONGEST REACH: A GREEN SUITE CAN BE VACUOUS ON THE PROPERTY THAT
    MATTERS. A TEST PROVES WHAT IT ASSERTS, NOT WHAT IT IS NAMED.** D-7 — *"diagrams follow the effective
    theme"* — was **green for the whole milestone while the two theme renderings were byte-identical**.
    Every D-7 test asked *"was it re-rendered?"*; none asked *"does it look different?"*. Those are different
    assertions, the suite only ever wrote the first, and the NAME promises the second. **The flip machinery
    was correct and load-bearing throughout and is byte-untouched by the fix** — that is the point: it
    worked perfectly, flipping between two copies of the same picture. → **The same lesson fired one level
    up, inside the fix itself, which is what makes it a class rather than an anecdote: the colour fix's OWN
    new two-picture test was VACUOUS ON ITS FIRST RUN**, because two renderings always differ by their
    `peekover-diagram-N` id — it would have passed against the unfixed tree. The ablation caught it;
    normalising the id is what made the assertion mean the thing its name claims. → **THE RULE: for any
    assertion of the form "X changes when Y changes", NAME THE DIMENSION and normalise away the dimensions
    that always change — then ABLATE, because only a guard that reds on the real defect tells you which of
    the two assertions you actually wrote.** → **And the planning-time half, which is where it gets cheap:
    when a suite is named for a USER-VISIBLE property (theme, legibility, layout), at least one member must
    assert THAT property — a contrast ratio, an artifact diff, an overlap count — and not only the mechanism
    believed to produce it.** M7's replacement is exactly that shape: five canvas labels, each asserted
    separately at WCAG AA against **the background actually painted behind them**, with the LIGHT arm as a
    control that PASSED unfixed (dark 1.14:1 → 15.1:1; light 12–20:1 → 16.2:1, unregressed) — so the red
    discriminates a broken picture from a broken assertion. → **This is the FOURTH RUNG of the red-first
    ladder, and it is about the PREDICATE rather than the instrument.** M4 (1): did the instrument go red at
    all. M5 (2): did the RIGHT things go red, in the RIGHT number. M6 (5): does the failure carry the
    defect's own signature. **M7: is the thing being asserted the property a human would NAME?** All three
    earlier rungs were satisfied by D-7's suite the whole time, and it was still blind.
  - **(3) THE RED-FIRST WIDENED BY KIND ACROSS THE MILESTONE, AND EVERY NEW KIND NEEDED A NEW ASSERTION
    SHAPE — "it renders" never once sufficed.** Read in order, M7 is a ladder of property classes.
    **TRUST** (groups 2–3): a hostile corpus red **9 of 9** under an identity passthrough, each red NAMING
    the surviving node, and the D-6 `secure` hardening measured **on the wire** with a benign
    `%%{init:{"theme":"dark"}}%%` control that visibly re-themes in the same run — so *"no fetch"* is a
    RESULT and not a dead probe. **IDENTITY / CORRECTNESS** (group 4): engine-invocation counts taken through
    the PRODUCTION watch path, with controls asserted against a **NAMED key and a NAMED surviving row**
    rather than against a count — the oversized-diagram refusal is decided by **ONE BYTE** at the bound, and
    *"evicts nothing"* is proven by the pre-existing row still SERVING, not by a row tally. **LEGIBILITY**
    (the colour fix): contrast ratios against the painted background, both arms. **LAYOUT** (the gantt fix):
    adjacent-label overlap counts through the real width-less measuring container, with the pre-fix geometry
    restated explicitly as a firing control — *"without which a broken detector and a fixed axis are
    indistinguishable."* → **THE RULE: when a milestone enters a NEW property class, budget a NEW ASSERTION
    SHAPE, not another case in the old one — and find the shape by asking what MEASUREMENT would red on the
    defect a human just described, in the UNITS the human used.** → **The confirming pattern is uncomfortable
    and worth stating: the two classes M7 entered LAST (legibility, layout) are exactly the two the gate
    found defects in, and for the same reason in both — no assertion of that shape existed yet, so there was
    nothing to be green about.**
  - **(4) THE HUMAN GATE FOUND BOTH DEFECTS, FOR TWO DIFFERENT REASONS, AND BOTH REASONS GENERALISE — this
    is the clearest statement of what a milestone-close walk is FOR that this project has produced.**
    **927 browser cases across two engines were green over both defects.** The dark-mode one was invisible
    because **the suite's assertion was the wrong one** (finding 2). The gantt one was invisible because
    **no test asserted layout width at all** — there was no sibling suite to transcribe an assertion from,
    which is **M6's finding (4), second half, recurring**: the dangerous failure is the one with nothing to
    notice missing. → **And the gate is the ONLY instrument for two entire properties.** Item 6 (zero
    unexpected network with the Network tab open, across import → render → cache → re-theme → export) is
    **the only evidence for the real loaded extension** — 3.4's import fence is a module-graph assertion, not
    a wire reading — and item 5 (**Firefox everything**) is that engine's only evidence, because Playwright
    cannot load an extension into Firefox. → **★ THE INVERSE, AND IT IS NEW: SOMETIMES WRITING THE TEST WOULD
    PRE-EMPT THE GATE, AND THE HONEST OUTPUT IS A RECORD RATHER THAN A COMMIT.** §8.3 was written to assert
    placeholder motion; 8.3 found that **every writable form of that test DECIDES D-11** — asserting
    "animates" is impossible against a static placeholder, asserting `animationName === 'none'` pins static
    as the answer, and building the shimmer to make the first form writable would settle the very question
    9.1 exists to ask. **8.3 committed NO test and recorded walk material instead**, and 9.1 then decided
    (D-11 CONFIRMED STATIC, no shimmer built, nothing under `src/` touched to reach the verdict). → **THE
    RULE: before writing coverage for a property a HUMAN GATE owns, check whether the test would ANSWER the
    question rather than observe it. If it would, the deliverable is the walk material, not the assertion**
    — and say so in the record, because a struck Verify clause reads like an omission otherwise. **This is
    M4's honest-gap → named-gate-item → discharged-at-close loop with the arrow reversed**, and it is the
    first time this project has declined to write a test on the ground that writing it would be a decision.
  - **(5) THE WRONG PREMISE MIGRATED INTO THE WRITTEN CONTRACT — SIX GATE-APPROVED CLAUSES WERE AMENDED BY
    MEASUREMENT DURING IMPLEMENTATION, EVERY ONE CAUGHT BY AN IMPLEMENTER CHECKING THE TEXT AGAINST THE
    ARTIFACT BEFORE BUILDING TO IT.** In order: **D-1 / §2.1** — the SVG profile's `ALLOWED_URI_REGEXP` was
    specified as the literal `/^#/`, which is unimplementable against DOMPurify's GLOBAL attribute gating (it
    would delete every coordinate in every diagram); **D-3 / D-13** — `engineVersion` was specified from the
    engine's own export, and mermaid **exposes no runtime version**, so it comes from a resolved
    `mermaid/package.json`; **§2.2** — the task was framed around the inherited sanitize hook being the
    security discriminator, and the hook is a **proven no-op** for this profile, so the ABSENCE of a
    "remove the hook → `data:` reds" revert IS the finding; **D-6** — the engine config was believed closed
    and carried a **LIVE pre-sanitize `themeCSS` / `fontFamily` fetch route**, closed by addendum and proven
    on the wire in both directions; **§4** — the remote-reference route needed a closure decision the spec
    had not taken, and the measurement window's claim was **sharpened** to *"no off-origin request"* once
    relative references were measured as package-local; **§8.3** — a Verify clause premised on a shimmer
    **never specified into existence**, struck. → **What these six have in common is not sloppiness: every
    one is an ASSERTION ABOUT SOMEONE ELSE'S CODE** — a library's API surface, a config key's semantics, a
    sanitizer's gating order — **written by someone who did not have that code executing in front of them.**
    → **THE RULE: a spec / plan / tasks clause naming a third-party API, config key or artifact shape is a
    HYPOTHESIS with exactly the standing of a kickoff premise (finding 1), and it is verified in the FIRST
    TEN MINUTES of the task that implements it — not discovered at the point of failure.** → **And keep the
    mechanism that made "approved" survivable, deliberately: every amendment was banked as its own DATED
    decisions.md entry naming the clause it amends, BEFORE the implementing commit** (`ff8f323`, `bddd5af`,
    `b19c068`, `16c7790`, `4061398`, and 8.3's record). Six corrections to a gate-approved contract did not
    weaken the gate, because **none of them was silent. A gate that cannot be amended in writing gets amended
    in code.**
  - **(6) THE CONTRACT IS THE SECTION BODY. A SUMMARISING PREAMBLE THAT CLAIMS TO ENUMERATE IS THE MORE
    DANGEROUS FORM, PRECISELY BECAUSE IT INVITES BEING READ AS THE CONTRACT.** `tasks.md`'s front matter
    budgets the human-run items *"UP FRONT … enumerated in 9.1's Verify, not rediscovered there"* and lists
    **SIX**; §9.1's BODY lists **EIGHT** — the preamble omits **app-page responsiveness after M7** and **the
    content-script surface still rendering a mermaid fence as a plain code fence**. The walk was driven from
    the body and still came in at **seven of eight** for one commit — **and the item that needed the second
    sitting is one of the two the preamble omits.** → **THE RULE: a gate's item count is read from the
    SECTION BODY, and the walk record states the count it is walking against before it starts.** A preamble
    may summarise; the moment it says *"enumerated"* it makes a completeness claim, and a completeness claim
    inside a summary is the one place nobody checks. *(Whether §9.1's preamble text is edited is a **9.3**
    reconcile call — the LESSON is banked here, the TEXT is routed.)*
  - **(7) M6's FINDING (3) IS RIGHT AND ITS TRIGGER IS WRONG — the remedy fires on "a gate-closing task", and
    M7's staleness landed on commits that were neither gate-closing nor numbered tasks.** Two instances.
    **(a)** 8.2 advanced § Up next and left § Now reading *"NEXT: 8.2"*; the two sites disagreed until 8.3's
    sweep caught it. **(b)** the two post-gate FIX commits — out-of-plan by design, not numbered 9.x tasks —
    updated § Carried items thoroughly and left **§ Now, § Up next and § Blockers all still describing the
    dark-mode defect as filed-and-unfixed CARRIED work**, and left the score paragraph's pre-registration
    (*"the one way the figure still moves is if the gantt overprint resolves"*) standing after it had
    resolved. **§ Baselines went stale by the same mechanism** — its header says *"Current measured truth"*,
    dates itself to 8.1, and carries an app-chunk row of 387,837 B against **389,143 B** measured at HEAD and
    a suites row of 911/15/98 against **927/15/100**. → **THE RULE, and it is a one-clause edit to a rule
    that already exists: the pointer walk is triggered by ANY COMMIT THAT CHANGES STATE A POINTER SITE
    ASSERTS — not by "a gate-closing task".** **An out-of-plan fix is simultaneously the commit most likely
    to invalidate a pointer site and the least likely to run the checklist, because it is not on the
    checklist.** *(9.2 ran the sweep and corrected the pointer sites; § Baselines' numbers are **routed to
    9.3**, which owns them by name.)*
  - **(8) THE FLOOR-DELTA RULE GOT ITS FIRST APPLICATION, AND IT NEEDS ONE MORE NUMBER STANDING BESIDE IT OR
    IT DECIDES NOTHING.** **The statement M7 owes, with the number: M7's first-paint floor is 145.3 ms
    against M6's 132.1 ms — a floor delta of +13.2 ms — and NO RE-BASELINE IS PROPOSED.** M6's <165 ms bar
    stands and passed on all four arms (medians 152.3 / 157.6 / 157.9 / 163.2 ms) with **worst-arm headroom
    1.8 ms**. → **Now the refinement, which is the part that changes a future measurement.** M6's rule reads
    *"flat floor + breaching median = environment; a floor that has MOVED UP = code"*, and on its face
    +13.2 ms is a moved floor. **It decides nothing here, because the same session's A-vs-A floor
    disagreement was 13.4 ms — larger than the delta it is being asked to adjudicate** — and the
    machine-state discriminator moved with it: the 1 MB fixture read **+9.8%**, and M6's floor scaled by that
    same 9.8% predicts **~145.1 ms** against **145.3 ms** measured. **The machine accounts for the delta
    almost exactly, and any residual is smaller than the instrument's own disagreement with itself.** →
    **THE RULE: state the floor delta, the instrument's own A-vs-A floor disagreement, and the machine-state
    discriminator IN THE SAME SENTENCE. A floor delta smaller than the instrument's own disagreement is not
    evidence of drift — it is not evidence of anything.** M6's rule taken alone would license reading this
    milestone's noise as code growth and spending a session optimising nothing. → **The honest corollary
    about the bar itself: at 1.8 ms of worst-arm headroom, the next milestone cannot measure first paint on a
    working machine and believe the answer.** That is not an argument for a bigger number — it is an argument
    that **M8's first measurement of the render path must be A-B-A on a quiesced machine, budgeted as such**,
    and that first paint is now this project's least sensitive instrument.
  - **(9) A BOUND'S COST CURVE IS MEASURED, NOT DERIVED — the eviction cliff is TOTAL rather than graded, and
    the arithmetic that said otherwise was off by 25×.** 8.2 measured what ONE row over the `count` bound
    costs. The natural model says a cache one row short loses roughly one row's worth of work; the
    measurement says **51 re-renders at N=51** where the arithmetic predicted **2**, because a document that
    exceeds the bound loses the ENTIRE cache's value rather than a proportion of it. That single measurement
    is what turned 8.4's human question from *"how big should the cache be"* into *"where should the
    discontinuity SIT"*, and the answer changed with it (`count` 100 → **150**, putting the cliff at N=75).
    → **THE RULE: before a human is asked to CHOOSE a bound, measure the cost of being ONE UNIT OVER IT. A
    bound whose cost curve was reasoned about rather than measured hands the human the wrong question** —
    and a wrong question gets answered confidently. → **The companion, from 8.5, and worth its sentence: a
    reconstruction is validated against the measurement it claims to reproduce BEFORE it is trusted to
    predict.** 8.5's accumulation harness reproduced 8.2's CELL 5 **exactly** at the old bounds — `document
    39` / `document 10`, rows pegged 100/100, COUNT binding, 0 refusals — and only then ran at the chosen
    ones, with its five predictions stated before it ran. → **And one reading correction that outlives the
    numbers: D-9 is NOT a cap.** It is the typical-case time-to-rendered *target*; *"D-8 and D-9 are the two
    numeric caps"* is the natural and wrong reading, and it is banked as a commitment with **nothing
    enforcing it**, said in as many words.
  - **Deliberately CUT from this entry — three candidates, each for a stated reason.** **(i) "A revert that
    reds nothing is a broken control, applied PROSPECTIVELY."** M7 declined to ship two guards on exactly
    that ground — 7.2's `prefers-reduced-motion` rule for the lightbox panel (deleted as dead bytes, because
    `readerCss.ts`'s sheet-wide `:host *{animation-duration:.001ms!important}` already owned the
    suppression) and 8.3's would-be D-11 reduced-motion rule (declined for the same reason). **Real, and its
    rule is already M6's finding (5);** what is new is only the DIRECTION, and finding (4) carries that half
    in the form that changes behaviour. **(ii) "Decompose every byte delta to zero residual."** M7 did it on
    essentially every commit that moved a bundle — including **+55 B on the gantt fix (54 B literal + 1 B
    separating comma)** and a **0-byte** whole-tree delta at 8.5 resolved to **ONE residual byte** at app-chunk
    offset 323,975. **That is M6's finding (1) being obeyed, not a new finding** — it belongs in the metrics,
    and it is there. **(iii) "The scratch harness is deleted, not committed."** 5.2, 8.1 and 8.2 each built,
    ran and deleted one, and 5.2 explicitly refused to commit a time-bound assertion that would both flake and
    smuggle in a threshold 8.4 owned. **Correct and already the house pattern**; nobody behaves differently
    for reading it again.
  - **ROUTED TO 9.3, NOT RESOLVED HERE** *(they are reconcile items, not lessons — listed so 9.3 inherits a
    complete set)*: the **"manifest green 2975 B"** mislabel's source text in `tasks.md` §7.1 / §7.2 and every
    §8.x fence line (the measurement was always right; the NAME was wrong — it is `wc -c tests/manifest.test.ts`,
    and the built manifests are 654 / 770 B) · `architecture.md`'s **`enhance`-stage** line, which describes a
    pipeline stage that does not exist (gate-2 (c)) · **§ Baselines' stale app-chunk and suites rows** and its
    first-paint provenance · the **checkbox convention** — all **28 boxes still `[ ]`** with all 28 tasks
    landed and **no landing notes in `tasks.md` at all**, so a future planner reads 0/28 from the boxes and the
    two out-of-plan fixes are invisible in them (**M6's finding (3), fifth sub-point, recurring and worse**) ·
    **where a gate finding is filed** — §9.1 says *"a task added below this line"* in a gate-sealed file, and
    both M7 findings landed in § Carried items by 8.4's precedent · §8.3's **struck Verify clause** and whether
    it earns an in-file note · §9.1's preamble/body item count (finding 6).
  - **Metrics.** Human-gate-caught defects this milestone = **2** (dark-mode diagram text renders black on the
    canvas · the gantt date axis overprints into a smear), **both fixed before close, each in its own session
    and its own commit** · **running gate score 10/10 → 12/12**, and **"caught at its own gate" HOLDS for both**
    — M7 shipped the surfaces they live on, so neither escaped a prior gate (M6's broken invariant is not
    extended) · **the gate's viewport was recorded QUALITATIVELY ("WIDE") and the gap was stated rather than
    dressed up as a number** — M6's finding (2) remedy applied *in kind*; **a later gate records the digits** ·
    **formal retractions of an empirical claim = 0**, but the nearest equivalent is worth its own line and is
    finding (2): **D-7 was green-but-vacuous on colour for the entire milestone** · **premise corrections = 9**
    — 2 fix kickoffs (finding 1), 6 gate-approved contract clauses (finding 5), 1 struck Verify clause · unit
    **549 → 728** (+179); browser **629/15/76 → 927/15/100** (+298 passed, +24 file-instances), both counts
    spanning two engine projects · content script **315,671 → 318,747 B** (+3,076, decomposed to a **0 B
    residual** across five named commits, and **byte- and md5-identical with the engine ablated away** while the
    negative control fired −3,349,366 B) · app chunk **361,500 → 389,143 B** (+27,643) · **dependencies 4 → 5** ·
    **zip headroom 1.65 MB → 0.70 MB — 58% of M6's margin consumed in one milestone, the one metric trending
    badly**, with D-10 (b)'s inline narrowing carried against a ~0.5 MB trigger.
    - **Defects by WHO CAUGHT THEM, keeping M4's and M5's correction discipline.** **Human gate = 2** (both
      product defects, both legibility/layout, both on surfaces named in finding 4). **CI mid-development = 1,
      and it is a genuine one:** 7.1's live region shipped as a `<p>` and was therefore a paragraph OF THE
      DOCUMENT to every `.peekover-reader p` rule — **caught by a SIBLING suite's own control**
      (`diagramRender.browser.test.ts`'s row-5 requirement that each column paragraph have a real box), which
      is M6's finding (4) working in the direction it was written for. **Agent code review / design reading =
      2** (D-6's LIVE pre-sanitize `themeCSS` fetch route, found by reasoning about the config's routes before
      any test existed; §4's relative-reference finding, which sharpened the window's claim rather than
      loosening it). **Measurement = 3 corrections of the RECORD, not defects** (the eviction cliff falsifying
      the graded-cost model; 8.1's A-B-A returning a NEGATIVE verdict and refusing to claim a diagram
      first-paint cost in either direction; the 2975 relabel) — counting those as defect catches would inflate
      the column that did the least product work.
    - **Red-first: not tallied milestone-wide, and the reason is itself the routed checkbox item.** `tasks.md`
      carries **no landing notes** for any of the 28 tasks, so the evidence lives in commit bodies and the
      progress.md folds — same as M6. What the record does state, verifiably: **7.2 records SEVEN reverts each
      verified to actually red on both engines and restored from a `cp`, plus ONE that stayed green and was
      therefore deleted as a dead control**; 2.1's hostile corpus is red **9 of 9** with the widening reding
      **exactly 3**; 2.2's widening reds **exactly 5**; 4.4's cache-bypass reds in the defect's own units
      (`expected 1 to be +0`); and the gantt fix's four arms include an explicit pre-fix-geometry firing
      control. **The named flake family (`pipeline.perf`, the 1 MB golden) fired again at 8.5 and was PINNED TO
      THE MACHINE by an ablated-HEAD tree in the same session** — M6's instrument, reused without incident, and
      it did not fire at all in this session's clean run (728/728).
    - **Orchestrator factual errors caught by ground-truth re-derivation = 0 verified** (M4:4, M5:5, M6:3) —
      **recorded because "it matched" is the outcome nobody writes down.** Every fence figure this session's
      brief stated was re-derived from HEAD and agreed exactly: content script **318,747 B** both engines with
      per-engine md5s stable, app chunk **389,143 B** md5-identical both engines, `permissions: []` both, golden
      **EMPTY**, import fence **8/8**, **28 tasks / 9 groups**, HEAD `fc3a142`, and both walk-surfaced defects
      fixed. The brief's two summaries of prior findings (#1 the positive control, #5 revert-and-fail) also
      check out against the register. **The one thing it asked to be re-derived rather than carried — the
      post-gantt-fix app-chunk size — is the one a stale prompt would most likely have got wrong**, which is
      the shape of instruction that produced this zero.
- **2026-07-27 · M6 close (spec 006 — snapshots + diff).** Snapshot capture on the app page, bounded
  retention (count 15 / 20 MiB / 30 days, D-8), a global erase control, a **persistent** capture disclosure,
  and an inline line-diff against any stored snapshot — with **`permissions: []` still intact**, the
  **FIRST `dependencies` addition since M1** (`diff@^9.0.0`), and PERMISSIONS.md's *"file contents are never
  stored"* claim corrected **in the same commit as the first stored byte** (1.4). Nine groups, **twenty
  planned tasks, ZERO discovered tasks** — against M5's five. At close: lint EXIT=0 · **549 unit** (46 files)
  · **629 in-browser passed / 15 skipped**, 76 file-instances, both engines · golden diff EMPTY ·
  `manifest.test.ts` 8/8 and **2975 B, byte-unmodified since M2** · first paint **137.9 ms** against a bar
  that **moved this milestone** (see finding 8). The 9.1 gate **PASSED and found THREE layout defects plus a
  disclosure gap**, all fixed before close across **four unplanned recovery sessions** (A, B1, B1 v2, B2, and
  a pointer-fix session C). The settled architecture (D-1…D-16, the gate-3 product calls, the bound values,
  the re-baseline) is in decisions.md 2026-07-22/23/25/26 — **linked, not restated**; the measurement
  evidence is progress.md § Baselines and the tasks.md landing notes. **Two claims this milestone formally
  RETRACTED, which is the entry's headline and is not a failure to apologise for — it is the only milestone
  so far that audited its own prior evidence hard enough to find it hollow.**
  - **(1) THE HEADLINE — TWO FORMAL RETRACTIONS AT 8.1, AND BOTH RETRACTED CLAIMS WERE *UNFALSIFIABLE UNDER
    THE CONDITIONS THEY WERE MEASURED IN*. That is one defect class, not two incidents, and it is a NEW
    metric column: M4 had zero retractions, M5 had zero, M6 has two.** **(a) The import fence was never
    verified by bytes.** Every progress.md entry since 5.1 cited *"content-script grep for
    `diffLines|jsdiff|computeDiff|enterDiff|…` = **0**, both engines"* as fence-by-measurement. Those are
    **identifiers**, the bundle is **minified**, and the proof is the negative control 5.1–7.1 never ran:
    grep the **app-page chunk**, which indisputably *does* contain the engine, and it **also returns 0**.
    **A test that returns the same answer whether or not the thing is present has zero discriminating
    power** — the fence was carried the whole time, unnoticed, by layer 1 alone (the source-text allowlist in
    `diffEngine.test.ts`). **(b) The coalescer never dropped anything.** 7.1's *"9 of 12 edits rendered at
    1 MB"* came from a `renders` probe **sampled once**, right after `__pwSettle`, before a 1 MB render
    re-stashes its source. It could not be falsified at 7.1 either, because the proposed 5 MiB byte bound
    clamped the snapshot count at 4 — **the discriminator had no room to disagree with itself.** 7.3 lifted
    the ceiling to 20 MiB, the count then said 13 while `renders` said 9, and 8.1 polled instead of sampling:
    **12 of 12 at both fixtures.** → **THE RULE, mechanical enough to apply without thinking: every empirical
    claim needs a POSITIVE CONTROL THAT FIRES UNDER THE SAME CONDITIONS THE NEGATIVE CLAIM DISCLAIMS.** Grep
    for a marker you *know* exists in the artifact you claim doesn't have them; if the control also reads 0,
    your grep detects nothing (8.1 banked the replacement heuristic **with its controls in the table**, and
    labelled it a heuristic, not a proof). Ablate the imported code and diff the bytes; **byte-identical means
    it was never there** (−9,481 B in the app chunk, **0 B, md5-identical** in the content script — the fence
    is not "small", it is nil). And a discriminator that can legitimately read empty must **await**, not
    sample. → **The third instrument in the same family, and the one that caught real waste: DECOMPOSE AN
    UNEXPLAINED BYTE DELTA AGAINST ITS SUB-BLOCK SIZES AND ACCOUNT EVERY BYTE.** B1 v2 did it and matched to
    the byte (READER_CSS +289 + CONTAINED_CSS +238 = 527); B2 did it and found **~1.5 KB of the +1,873 B was
    CSS-comment prose** (finding 9). A delta you accept without decomposing is where waste hides. →
    **This is M4's finding (3) — "a pin certifies exactly the stage it observes" — from the other side.**
    That rule is about a guard's SCOPE; this one is about a guard's SENSITIVITY. A pin can be perfectly
    scoped and still be blind, and green tells you neither.
  - **(2) THE RUNNING GATE SCORE IS **10/10**, NOT THE 8/8 RECORDED AT 9.1 — AND "NONE ESCAPING" IS FALSE
    FOR THE FIRST TIME IN THE PROJECT'S HISTORY. Correct both, because the second one matters and the
    number is how it gets found.** The arithmetic first: the score has always counted **defects**, not
    milestones — M1:2 + M2:3 + M3:1 + M4:0 + M5:1 = **7/7** (progress.md § Closed milestones states each).
    M6's own landing block says *"M6 contributes THREE defects"* and then writes **8/8**, which contradicts
    its own sentence. **7 + 3 = 10.** (On the stricter denominator that also counts the Firefox app-page
    disclosure gap the walk closed, it is 11/11; prior milestones did not count copy gaps, so **10/10** is
    the like-for-like figure. Stating the denominator's definition is the point.) → **Now the part the
    arithmetic was hiding. "Finding A" — the reader right-aligned against the TOC rail on wide viewports —
    ships on BOTH surfaces and, per the walk's own attribution, has done SINCE M3.** It was present and
    missed at **M3's, M4's and M5's close gates**. So the invariant this project has cited for five
    milestones — *"every shipping defect caught by the gate of the milestone that shipped it, none
    escaping"* — **is broken.** Nine of ten were caught at their own gate; **one escaped three.** →
    **And M4's clean gate now has a known miss, which is the honest correction to make here rather than
    leave for someone to notice later:** M4's retro concluded its zero-defect gate was *discipline-dominant*
    and that reasoning still stands **for what M4 built** — but the gate was not, in fact, clean about the
    shipped product. **A clean gate is evidence about the BUILD, not about the GATE** (M4's own words) —
    M6 supplies the instance where that caveat cashes out. → **WHY it escaped is mechanical and fixable, and
    it is the actionable half: the gate has an UNRECORDED ENVIRONMENT VARIABLE — the walker's viewport.**
    Playwright's default viewport never reproduced it, and **no gate record on any milestone states what
    window size the walk used.** Engine and surface are recorded every time; the dimension that actually
    decides whether a layout defect is visible is not. → **THE RULE: a gate walk records its viewport(s) the
    way it records its engines, and a milestone that ships positioned chrome walks at least one WIDE
    viewport deliberately.** Three gates' worth of coverage was silently conditioned on the monitor someone
    happened to be sitting at.
  - **(3) THE CLOSE-MEASUREMENT TASK IS NOT THE LAST COMMIT OF THE MILESTONE, BUT EVERY ARTIFACT IS WRITTEN
    AS IF IT WERE — and the § Baselines pin table is stale RIGHT NOW, at the moment this entry is written.**
    8.1 measured the M6-close pins; B1 v2 and B2 then shipped **production code** after it and **neither
    re-ran them**. Verified against the recovery commits' own byte accounting: content script **315,144 B
    recorded vs 315,671 B actual** (+527, B1 v2), app chunk **360,423 vs 361,500** (+1,077), suites
    **605/15/74 recorded vs 629/15/76 actual** (+24 cases, +2 file-instances). The table's own header says
    *"Current measured truth"* and then dates itself *"(task 8.1)"* — **the parenthetical is the tell, and
    nobody read it as a warning.** B1 v2 touched **no doc at all** (three files, all `src/` and `tests/`);
    B2 touched progress.md only for the gate strike-through. → **This is the same defect as the three
    POINTER INVERSIONS the milestone already logged, and they are one finding, not four:** 8.1 landed
    without advancing the Now-pointer, leaving a next-action block instructing a session to redo a landed
    task — **with the M1 "advances PER TASK" rule printed at the bottom of that same section** (caught at
    8.2); 9.1's *closing* commit still carried Blockers saying *"006 IS NOW WAITING ON A HUMAN — next human
    gate is 9.1"* and a roadmap saying *"at its close gate"*, both false **on the commit that closed it**
    (caught by session C); and 8.2's own folded prose said *"(this commit)"*, which session C had to rewrite
    to *"(a previous commit, 5ea9723)"*. **A fourth, still live and left for the archive pass: § Closed
    milestones still reads "The human-gate score: 7/7."** → **A fifth, of a different kind, and worth its
    own sentence because it is what a future planner will read: the tasks.md box list says 20/20 with ZERO
    discovered tasks, and four recovery sessions are invisible in it.** 9.1's own Verify says a bad verdict
    becomes *"a task added below this line, not a silent fix"* — the fixes were anything but silent (the
    commit bodies are more thorough than most task notes), but no box was added, so **anyone estimating
    "how much rework does a close gate cause" reads zero from the boxes.** → **THE RULE, and it is a
    checklist item rather than a habit: any commit that lands after the measure-close task RE-RUNS THE PINS
    OR STATES THAT IT DID NOT, and every gate-closing task ends with a POINTER WALK as a discrete step —
    grep the fixed phrase list (`is next`, `at the gate`, `waiting on`, `this commit`, `← NEXT`, the running
    score) before committing.** Prose that states current pending state is **false by construction** the
    next time anything ships; the only defence is a mechanical sweep, because the person who just did the
    work is the person least able to see it.
  - **(4) THE TEST-PER-FILE AUDIT MUST WALK THE SIBLING SUITE'S FULL CHECKLIST — THE SINGLE MOST VALUABLE
    MECHANICAL ITEM M6 PRODUCED, because it is the specific practice that would have prevented the pill
    collision outright.** `diffChrome.browser.test.ts`'s clearance loop checked **six sibling chromes and
    the rail** — and not the reading column. Both `watchControl.browser.test.ts:453-466` and
    `themeControl.browser.test.ts:349` **do** check reader clearance, and `diffChrome.browser.test.ts:339-340`
    **cites watchControl by name** — it borrowed the *scoping decision* (assert at WIDE) and dropped the
    *assertion*. **One assertion lost in transcription, from a file that names its source.** Every test
    passed; the property that should have been tested was absent. **This is CI-invisible by construction:
    nothing goes red, because the missing test IS the defect.** → **The storage panel is the same finding's
    other half, and they belong together because the remedy is one thing:** it had **no positioning
    coverage at all** — not a dropped assertion, no sibling to drop it from, no baseline. B2's
    `storagePanelOverlay.browser.test.ts` is now the pin. **"The assertion was dropped in transcription" and
    "there was no sibling to transcribe from" are the two ways the same audit fails**, and the second is the
    more dangerous because there is nothing to notice missing. → **THE RULE: before writing coverage for a
    new piece of chrome, ENUMERATE the property set from every existing sibling suite and record each item
    as present / absent / explicitly out-of-scope. If no sibling suite exists, THAT IS THE SIGNAL** — a
    visible feature with no positioning baseline is the storage panel again. progress.md already carries
    *"a shared browser-test helper module"* for `flush()`/`afterFrames()`/`waitFor()`; **the geometry
    checklist belongs in it, and this milestone is the argument for building it.**
  - **(5) REVERT-AND-FAIL IS THE THIRD RUNG OF THE RED-FIRST LADDER, AND IT IS STRICTLY STRONGER THAN THE
    SECOND FOR REGRESSION TESTS SPECIFICALLY.** The ladder now reads: **M4's finding (1)** — did the
    instrument go red *at all* (non-vacuity); **M5's finding (2)** — did the RIGHT things go red, in the
    RIGHT NUMBER, for the RIGHT REASON; **M6** — does the failure carry **the defect's own signature, in the
    defect's own units.** B2 verified `storagePanelOverlay.browser.test.ts` by reverting `appShell.ts` to
    the unfixed HEAD and re-running: not *"six tests failed"* but **6 of 10 cases failing on named rects —
    reader top 73 → 476 px, reader height 823 → 420 px, the navigator displaced, `position` computing
    `static`** — which is the defect's description read back out of the assertions. → **Why it is stronger
    and not merely a companion:** red-first proves a test *can* fail; signature-matching proves it fails
    **on the thing the fix restored**, which is the only property a regression test exists to hold. A
    regression test that reds for some other reason is a tautology with a green tick on it. → **The cost is
    one `git stash`-shaped move and it is already the house pattern** (M4's mechanical default — `cp` the
    file aside FIRST — held for every M6 red-first; every one of the ~18 mutations in the commit bodies
    records *"restored byte-identical"*).
  - **(6) THE `ch` UNIT IN A CSS *MARGIN CALC* COSTS ~28 MS OF FIRST PAINT; THE SAME `76ch` IN `max-width`
    IS FREE. Same value, same file, different property, ~20% of the entire paint budget.** `max-width`
    resolves once and caches; a margin computation pulls **font metrics into layout**, which sits on the
    first-paint critical path. B1 v1 was geometrically correct and cost the gate its whole headroom
    (~5 ms quiesced); B1 v2 resolves the measure **once** into `--reader-measure:748px` and references it
    twice. → **THE RULE, and it is durable well past this instance: for any value that could live in either
    a CACHED property (`max-width`, `min-width`) or a LAYOUT-BLOCKING one (`margin`, `padding`, `transform`),
    measure BOTH placements — the expression is identical and the runtime cost is not.** → **The variable
    was not a tidy-up.** `max-width:748px` and `margin-left:calc(… − 748px − …)` must resolve to the same
    length or the centring is silently wrong at every wide viewport, so one variable feeds both and a
    browser test asserts at runtime that `getComputedStyle(reader).maxWidth` equals the resolved value —
    **it reds mechanically, no vigilance required.** *(And the restraint was right: the same `76ch` in
    `.peekover-raw` / `.peekover-diff` / `.peekover-alert` was deliberately LEFT ALONE — those have no
    coupling to preserve, and folding them into a serif-derived px constant would have silently changed
    their widths. A structural guard preserves a property that must hold; it is not a refactor of "this
    number appears twice.")*
  - **(7) PERF UNDER NOISE NEEDS TWO THINGS, AND M6 IS WHERE BOTH EARNED THEIR KEEP: A-B-A AGAINST A
    SAME-SESSION CONTROL, AND FLOOR-REPORTED-BESIDE-MEDIAN.** **(a) A-B-A.** Re-running a perf harness on
    the same build re-measures **the same machine**, so ordering effects — warm-up, other processes settling
    — get attributed to code. Interleave: measure A (HEAD) → B (change) → A again. **A agrees with A ⇒ the
    machine is stable and B−A is code. A disagrees with A ⇒ nothing measured here means anything.** At
    B1 v1 the `ch` form read **~180 ms in BOTH the early and the late slot** while HEAD read ~160 ms in the
    same slot — so the cost tracked the code, not the clock — and ablating the single declaration recovered
    it. **That protocol is the only reason "the `ch` costs 28 ms" was believable rather than dismissible as
    noise**, which on a machine this variable is otherwise the default fate of any 28 ms claim. → **This is
    M4's finding (2) — inference does not survive contact with the configuration it describes — applied to
    MEASUREMENT rather than to prediction.** **(b) Floor beside median.** Noise raises the median; real cost
    raises the **floor**. 8.1's first attempt read 154/157 ms medians with the floor still at ~145 → machine.
    B1 v1's floor jumped to 155 from HEAD's 133 → code. → **THE RULE: report median AND floor on every
    first-paint measurement. The gate asserts the median; the FLOOR is what tells you whether the gate is
    sitting at the noise floor** — and, per finding 8, whether a proposed re-baseline is honest.
  - **(8) THE FIRST RE-BASELINE OF THE M1 GATE (<150 → <165 ms) IS DISCIPLINE-PRESERVING — BUT THE
    RATIONALE IT WAS RECORDED WITH NAMES THE WRONG CAUSE, AND THAT IS THE PART THAT WILL DO DAMAGE AT M7.**
    The decision itself is sound and was taken correctly: 8.1 measured, **refused to move the bar**, and
    routed it to the human at 9.1 (the standing measure-then-decide split, D-2's shape from 004); both the
    breaching **154.0 / 157.6 ms** working-day readings and the passing quiesced ones are recorded side by
    side; **no measurement changed, only the threshold**; and the struck-through `<150 ms` stays visible in
    the table so the M1 bar is not quietly erased. A gate that needs **49 browser processes closed** to go
    green is measuring the machine. → **But decisions.md 2026-07-26 gives the cause as *"the codebase grew
    ~40% since M1"*, and the measurements say otherwise.** M6's first paint at close is **137.9 ms against
    M5's 138.6 — it got FASTER** — and the floor is **133.0 vs M5's 132.0**, i.e. flat. **006's bytes did not
    move this gate.** What moved was the honesty of the measurement environment: the bar was set on a quiet
    machine and had *always* been breaching on a working-day one; nobody had measured it there. → **Why the
    distinction is not pedantic: "we grew, so we re-baseline" is a rationale that licenses every future
    re-baseline, and it is exactly the sentence M7 will read.** → **THE RULE, and it is the inflection point
    M7 kickoff needs: a re-baseline is legitimate when the FLOOR IS FLAT and the median breaches — that is
    environment. It is DRIFT when the FLOOR HAS MOVED UP — that is code, and the answer is optimisation
    work, not a bigger number.** M6's floor moved +1.0 ms, so M6's re-baseline was environment.
    **Any future re-baseline proposal must state the floor delta against the previous milestone before the
    threshold is discussed** — that single number separates the two cases, and without it the two are
    indistinguishable in prose.
  - **(9) A RULE THAT HAS BEEN PAID FOR ONCE RECURS ANYWAY — AND M6 RAN THE CONTROLLED COMPARISON THAT SAYS
    WHY, BECAUSE IT ALSO CONTAINS A RULE THAT HELD.** **The recurrence:** B2's first draft wrote its
    rationale as **CSS comments inside the `APP_CSS` template literal** — string content the minifier cannot
    reach — shipping **+1,873 B**, of which ~1.5 KB was prose. Moving it into the TypeScript doc comment
    above the block cut it to **+550 B with no loss of explanation**. **This rule was already discovered and
    paid for at 6.2, in this same milestone**, where readerCss.ts's placement rationale cost ~8 KB in a
    first draft and the fix was the identical relocation. **Same milestone. Same repository. Days apart.** →
    **The control: a rule that did NOT recur.** decisions.md 2026-07-22 recorded that 005's plan-gate
    decisions were **never logged**, and attached a revisit-when. The very next gate — 006's, one day later
    — logged **at** the gate, and the entry says so in as many words: *"the fix the 2026-07-22 entry's
    revisit-when asked for, applied on the first occasion after it."* → **THE DIFFERENCE IS NOT DILIGENCE,
    IT IS WHERE THE RULE LIVES.** The decisions rule was written in the **indexed, append-only file every
    session reads, with a trigger attached**. The template-literal rule was written in a **code comment in
    one file** — findable only by someone already editing that file, which is precisely not the person about
    to make the mistake somewhere else. → **THE RULE: a lesson learned in one file must be banked where its
    CLASS is searchable, not where its instance happened.** And for this one specifically, the honest answer
    to "should it be mechanical?" is **yes and it is cheap**: a build-time assertion on the shipped byte
    delta per CSS block, or an ESLint rule forbidding `/* */` inside the known CSS template literals, would
    end the class. **Until then it will recur a third time** — the two instances are two tasks apart in one
    milestone, which is the strongest possible evidence that awareness is not the mechanism.
  - **Deliberately CUT from this entry — three candidates, each for a stated reason.** **(i) "Coupling
    guards are scoped to the coupling, not the file"** — real, correct, and it changes nobody's behaviour:
    the restraint it describes (declining to fold three uncoupled `76ch` values into the new variable) is
    already the default a careful reader applies, and the one durable half of it is the runtime coupling
    assertion, kept inside finding 6. **(ii) "Prompt premises about machine and repo state are stale by
    construction"** — M5 already banked *"a prompt's factual claims about repository state are UNVERIFIED
    INPUT"* and validated it on a second kind of claim. M6 supplies a third kind (**machine** state: a
    recovery prompt said *"close Brave completely — all four processes"* against an actual **28 Brave + 21
    Chrome**) and that is a genuinely different failure mode — the category was right and the number was
    unknowable at write-time — but it is **one sentence, not a finding**, so it lives in the metrics below.
    **(iii) The two-pass recon disagreement at gate 2** (`specs/recon-006-gate2.md`, deliberately outside
    the repo): pass 1 said the outgoing content *"is not held anywhere"*, pass 2 found it one layer down in
    `mount()`'s WeakMap, and the recon's own diagnosis — *"a correctly-answered question can still be the
    wrong question"* — is sharp. **Cut because the artifact already states it at the top of itself**, it is
    read by exactly the sessions that need it, and D-1 shipped on pass 2's finding without incident.
  - **Metrics.** Human-gate-caught defects this milestone = **3** (storage panel opening into the layout ·
    the Compare pill colliding with the reading column's `h1` · finding A, the reader right-aligned against
    the TOC rail), **plus one disclosure gap** (Firefox app-page watch silently absent) — all four fixed
    before close · **running gate score 7/7 → 10/10, CORRECTED from the 8/8 recorded at 9.1** (finding 2),
    and **the "none escaping" invariant is BROKEN for the first time**: finding A escaped **three** prior
    close gates · **formal retractions = 2** (the fence grep; the coalescer undercount) — **a NEW metric
    column; M4 had zero, M5 had zero** · **~18 red-first mutations** recorded across the milestone's commit
    bodies (1.1–6.3), **every one naming its isolating asymmetry and restored byte-identical**, and **no
    record in M6 shows a mutation that failed to isolate on the first attempt** — M5 had 5 of ~21; stated as
    what the record shows, not as proof none occurred · the recovery sessions added **two non-vacuity proofs
    of a different kind** (B2's revert-and-fail, 6 of 10 cases on named rects; B1 v2's runtime coupling
    guard, plus the whole geometry set re-run at **1280 as well as 1400**, since 1400 alone sat on the clean
    side of the pill defect) · unit **456 → 549** (+93); browser **499 → 629 passed / 15 skipped** (+130)
    across **54 → 76 file-instances**, both counts spanning **two engine projects** (Chromium + Firefox), so
    the case totals are per-engine-pair, not per-assertion · zero discovered tasks in-plan (M5: five) against
    **four unplanned recovery sessions after the gate** — the rework moved from the plan to the close.
    - **Defects by WHO CAUGHT THEM, keeping M4's and M5's correction discipline — and the CI column is
      ZERO.** **Human gate = 3 defects + 1 disclosure gap.** **Measurement = 2 RETRACTIONS, not defects**
      (7.3's relaxed bound exposing the `renders` contradiction; 8.1's negative control on the fence grep) —
      these corrected the *record*, not the product, and counting them as defect catches would inflate the
      column that did the least work. **Agent code review / design reading = 2** (6.3's `flushPending` hole,
      a cooldown timer armed just before a diff opens and never passing through `onText`, found by reasoning
      about exit paths before a test existed; 4.1's file-scoped seam matcher, which passes green on a file
      holding one correct and one hand-built registration). **CI mid-development = 0.** No commit body or
      landing note in M6 records the existing suite catching a product defect during development.
      **That number is honest and it is the expected one:** M4's retro already said most red-firsts prove
      non-vacuity rather than find bugs, and M6's coverage additions were written *after* their features,
      to pin them. **The column to watch is not CI's zero — it is that all three product defects were
      LAYOUT, and finding 4 names why the suite could not have seen two of them.**
    - **Orchestrator factual errors caught by ground-truth re-derivation = 3 verified** (M4:4, M5:5), plus
      one reported in-milestone that no artifact records. **Two of the three are in THIS session's own
      brief:** the byte anchors `373/245/912/2975` — only **2975** resolves (`tests/manifest.test.ts`,
      byte-unmodified since M2), and the other three match no artifact named anywhere in M6's record; and
      *"earlier groups' counts are in tasks.md"* — **tasks 1.1 through 6.2 have NO landing notes in
      tasks.md at all** (landing blocks begin at 6.3), so the milestone's red-first evidence lives in commit
      bodies and the progress.md folds, and this entry's ~18 was counted from `git log`, not from tasks.md.
      The third is the machine-state one described in cut (ii) above. **What did NOT need correcting is
      worth recording too, since M5's equivalent claim was false:** this brief said HEAD `a6c7716`, clean,
      up to date with origin — **and it was, exactly.**
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
