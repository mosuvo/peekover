# THE WORKFLOW — AI-Assisted Development System
### Tool-agnostic · Scales from bugfix to greenfield · Plain markdown, works with any model

**Version:** 2.0 · July 10, 2026 — generalized for any project; adds debugging variant, retro ritual, parallel-agent discipline, measurement, and the obsolescence review
**Works with:** Claude Code, Cursor, Codex CLI, Copilot, Gemini CLI, Windsurf, Aider, Zed — anything that reads files
**Research base:** verified against Anthropic official docs, the AGENTS.md open standard (Linux Foundation), GitHub Spec Kit, Kiro, Cline Memory Bank, and 2026 community practice (all sources ≤ 2 months old)

---

## 0. The One Rule Above All

> **"Give the agent a way to verify its work."** — Anthropic calls this the single highest-leverage practice. Everything in this system is a corollary: rules the agent can check, plans it can be diffed against, tasks with acceptance criteria, memory it must read, and gates it cannot skip.

---

## 1. Constants (non-negotiables — never change these)

| # | Constant | Value |
|---|---|---|
| C1 | Source of truth for agent rules | One `AGENTS.md` at repo root; tool files are thin bridges to it |
| C2 | Rules are hand-written | Humans write instruction files. ETH Zurich study (138 real issues, 12 repos, multiple models): developer-written files → improved success, 35–55% fewer agent bugs; LLM-generated files → *worse* success and +20% inference cost. Agent may draft; human rewrites and owns |
| C3 | Root rules size limit | ≤ 800 words (aim ~60 lines). If the agent already does it correctly without the rule, delete the rule |
| C4 | Nothing lives only in the agent's head | Every plan, decision, and status change lands in a markdown file before the session ends |
| C5 | One fact, one file | Never duplicate a rule/decision across files; link instead. Duplicates drift |
| C6 | No "done" without evidence | Tests pass / command output / screenshot — shown, not asserted |
| C7 | Ceremony scales with the task | Three gears (Section 5). Never full-spec a typo fix; never vibe-code a feature |
| C8 | Instructions are requests; gates are guarantees | Anything that MUST happen goes in a hook/CI check, not a sentence in a rules file |
| C9 | Every AI commit gets human review | Same bar as human code. The agent's output is untrusted until reviewed |
| C10 | Memory update ends every session | `progress.md` (always) + `decisions.md` (if any decision was made) |
| C11 | Correcting the same thing twice = stop | Clear context, sharpen the prompt (include logs/expected behavior), start fresh |
| C12 | Spec-anchored, not spec-first | Specs are maintained alongside code for the feature's life, not discarded after generation |
| C13 | Review upstream, where leverage is highest | A bad line in a plan cascades into hundreds of bad lines of code. Reviewing a ~200-line plan pre-implementation catches errors at 10–100x the impact of reviewing 2,000 lines of code after |
| C14 | Context budget: 40–60% | Design work so context utilization stays in this band; each phase's artifact is a *compaction* that seeds a fresh context for the next phase |
| C15 | Correctness beats completeness in context | One incorrect fact in context is worse than missing information or extra noise — errors compound through phases. Never let stale/wrong docs stay loaded |
| C16 | Process must never out-cost the work | Benchmarks show heavyweight spec frameworks can burn ~2x the tokens of lean ones on the same task — spent "reasoning about rules" instead of executing. Our templates stay minimal; if a template section isn't earning its place, delete it |

---

## 2. The Four Layers

```
Layer 1  RULES      how agents must behave here          → AGENTS.md (+ bridges)
Layer 2  MEMORY     what the project is & where it's at  → docs/ai/*.md
Layer 3  SPECS      what we're building right now        → specs/<feature>/*.md
Layer 4  DISCIPLINE how every session runs               → rituals + gates (this file)
```

## 3. Repository Layout

```
repo/
├── AGENTS.md                  # Layer 1 — single source of truth (≤800 words)
├── CLAUDE.md                  # bridge: one line → @AGENTS.md
├── GEMINI.md                  # bridge (only if you use Gemini CLI)
├── .cursor/rules/             # only if you need Cursor glob-scoped extras
├── docs/ai/                   # Layer 2 — project memory
│   ├── brief.md               #   why + what (stable, rarely edited)
│   ├── architecture.md        #   structure, patterns, key flows
│   ├── decisions.md           #   append-only decision log (ADR-lite)
│   ├── retro.md               #   per-feature retros + metrics (7.5, 12)
│   └── progress.md            #   done / doing / next / known issues
├── specs/                     # Layer 3 — per-feature work
│   ├── _template-mini.md
│   ├── _template-spec.md
│   ├── _template-plan.md
│   ├── _template-tasks.md
│   ├── _template-bugfix.md
│   └── 001-<feature-name>/    #   spec.md, plan.md, tasks.md (Gear 3)
└── src/…                      # nested AGENTS.md per package when repo grows
```

---

## 4. Layer 1 — Rules

### 4.1 AGENTS.md (the master file)

Why AGENTS.md: it's the open standard (Linux Foundation, 60,000+ repos), read natively by Codex, Cursor, Copilot, Gemini CLI, Aider, Windsurf, Zed, Devin and ~30 tools. Nearest-file-wins nesting handles monorepos.

**Template:**

```markdown
# AGENTS.md

## Project
<One paragraph: what this is, who it's for, the core flow.>

## Stack
<Each tech + WHY in one line. e.g. "Postgres — relational data with strong constraints; we rely on transactions.">

## Commands (verified — never invent flags)
- Install: `<cmd>`
- Dev:     `<cmd>`
- Test:    `<cmd>`      ← run before claiming any task done
- Lint:    `<cmd>`
- Build:   `<cmd>`

## Architecture map
<Top-level folders, one line each. Point to nested AGENTS.md where they exist.>

## Code standards
<Only rules you'd actually flag in review. No generic advice.>

## Workflow (required)
1. Read docs/ai/progress.md and docs/ai/brief.md before any work.
2. Plan before editing. For anything beyond a trivial fix, follow specs/ per WORKFLOW.md gears.
3. One task at a time. Show verification evidence (test output) before marking done.
4. End of session: update docs/ai/progress.md; append to docs/ai/decisions.md if a decision was made.

## Boundaries
- NEVER touch: <paths — e.g. migrations/, *.lock, .env*, generated/>
- NEVER: force-push, delete tests to make CI pass, add dependencies without asking, commit secrets.
- Ask first: schema changes, new external services, public API changes.

## Definition of Done
Code + tests pass + lint clean + docs/ai updated + reviewed diff.
```

### 4.2 Bridge files (write once, forget)

- `CLAUDE.md` → file contains exactly one line: `@AGENTS.md` (Anthropic's recommended, Windows-safe import; a symlink `ln -s AGENTS.md CLAUDE.md` also works). Claude Code does not reliably read AGENTS.md natively — the bridge is mandatory.
- `GEMINI.md` → same one-line pattern if you use Gemini CLI.
- Cursor and most others read AGENTS.md directly — no bridge needed. Add `.cursor/rules/*.mdc` only if you genuinely need glob-scoped rules (e.g., React rules only on `**/*.tsx`).

### 4.3 Scaling rules

- Monorepo/growth: add a nested `AGENTS.md` inside each package; agents honor nearest-file-wins. Broad rules high, specific rules low.
- Repeated task playbooks (release process, migration steps, PR review checklist) do NOT go in AGENTS.md — package them as skills/commands (Claude Code: `.claude/skills/`, checked into git) or a `docs/ai/playbooks/` folder any tool can be pointed at. Include a **"gotchas"** section in every playbook — the ways the task usually goes wrong help more than the happy path.
- Treat rule files like code: PR-reviewed, and periodically canary-checked (ask the agent "what do your instructions say about X?" to confirm it's actually loading them).

---

## 5. Layer 3 — Specs, in Three Gears

The industry-converged loop is **Specify → Plan → Tasks → Implement** (Spec Kit, Kiro, BMAD all use it). The known failure mode is applying it to everything — reviewers describe turning a small bugfix into 16 acceptance criteria. So: match the gear to the job. When unsure, start one gear lower and shift up if the plan reveals hidden scope.

**Where the evidence says specs pay off — and where they don't.** Peer-reviewed (ICSE 2026) and industry data favor structure for complex, stable, multi-session work: architectural documentation measurably improves functional correctness and conformance of generated code, and teams report an order-of-magnitude fewer "regenerate from scratch" cycles with spec-first flows. But the same research record shows solo developers on fast-iterating prototypes often spend longer writing specs than the coding saves, and rapidly changing projects suffer **spec drift** — stale specs creating false confidence. Rules of thumb: exploration/prototyping/throwaway work stays **Gear 1 regardless of size**; anything you'll maintain across sessions earns Gear 2+. And the classic "this is just waterfall" worry doesn't hold at these economics: waterfall failed because discovering a wrong spec cost months — here the regenerate loop is minutes, so a wrong spec is cheap to fix *if you keep it maintained* (C12).

| Gear | Task size | Artifacts | Examples |
|---|---|---|---|
| **1 — Direct** | < ~30 min, ≤ 2 files, reversible | None. Plan mode in chat → approve → do | typo, copy change, small bug with clear cause |
| **2 — Mini-spec** | half-day to ~2 days, one component | One file: `specs/NNN-name/mini.md` | new setting, refactor of one module, non-trivial bug |
| **3 — Full spec** | multi-day, cross-cutting, risky, or user-facing feature | `spec.md` + `plan.md` + `tasks.md` in `specs/NNN-name/` | new feature, new subsystem, integration |

### 5.1 Gear 2 template — `mini.md`

```markdown
# <Feature> — mini-spec
**Status:** draft | approved | in-progress | done      **Date:** YYYY-MM-DD

## What & why (3 sentences max)
## Acceptance criteria  (testable; When <X>, the system shall <Y>)
- [ ] …
## Approach (how, in one short paragraph — files to touch)
## Out of scope
## Tasks
- [ ] T1 … (each ≤ ~1 hour, independently verifiable)
- [ ] T2 …
## Verification
<exact command(s) or manual check that proves it works>
```

### 5.2 Gear 3 templates

**`spec.md`** — the WHAT (no tech): problem & user value · user stories ("As a… I want… so that…") · acceptance criteria in EARS style ("When <trigger>, the system shall <response>") · non-functional requirements (perf, a11y, security) · explicitly out of scope.

**`plan.md`** — the HOW: architecture & data flow · files/modules to create or touch · libraries and why · risks & unknowns · test strategy. *Written only after spec is approved.*

**`tasks.md`** — the ORDER: numbered tasks, each small, dependency-ordered, with its own verification line. Status markers `[ ] [~] [x]` updated live during implementation.

```markdown
- [ ] T3: Add rate limiting to the public API
      Files: src/api/middleware/*  ·  Verify: `npm test api` green + manual 429 check
```

### 5.3 Spec rules

- Human approves each artifact before the next is generated (spec → plan → tasks are gates, not a pipeline).
- Powerful starter move: give the agent a rough idea and have it **interview you** to draft the spec; then execute in a *fresh* session with only the approved artifacts as context.
- Specs are **spec-anchored** (C12): when implementation reveals a spec error, fix the spec in the same commit. A closed feature's folder stays as historical record.
- **Fresh-context handoffs (C14):** implementation begins in a *clean* session whose context contains only the approved plan/tasks (plus the memory files) — not the long research conversation that produced them. The research and planning sessions may have burned 60–80% of a context window; their output artifact re-seeds a fresh one at ~15–20%. This is the single biggest quality lever on multi-day features.
- Number folders (`001-`, `002-`) — chronological IDs that double as decision references.

---

### 5.4 The debugging variant (any gear)

Bugfixes follow a different rhythm than features — root-cause first, code last:
1. **Reproduce** — a reliable repro (command, test, or steps) before anything else. No repro, no fix.
2. **Root-cause in read-only mode** — agent investigates with edits disabled; output is a one-paragraph diagnosis: current behavior, expected behavior, cause, what must NOT change.
3. **Failing test** that captures the bug (this becomes the verification artifact, C6).
4. **Fix** — minimal change to make it pass; run the full suite to catch regressions.
5. Gear 2+ bugs get the diagnosis saved as `specs/NNN-name/bugfix.md`; a recurring bug class earns a rule in AGENTS.md or a gate (C8).

Never accept a fix from an agent that can't articulate the root cause — "it works now" without a *why* is a regression scheduled for later.

## 6. Layer 2 — Memory (templates)

**`brief.md`** (stable — the flight manual): what the product is, who it's for, goals ranked, non-goals, links to the real spec docs. One page max.

**`architecture.md`** (updated on structural change): folder map, key patterns in use and why, data flow of the core path, integration points, "load-bearing weirdness" (the non-obvious things an agent would otherwise "fix"). This file has direct research backing: ICSE 2026 findings show architectural documentation in context measurably improves the functional correctness, architectural conformance, and modularity of generated code.

**`decisions.md`** (append-only, newest on top):

```markdown
## D-014 · 2026-07-09 · Use library X over library Y
**Decision:** …  **Why:** …  **Alternatives rejected:** … (and why)
**Consequences:** …
```
Log a decision when: choosing between libraries/approaches, changing architecture, rejecting something you might revisit, or any "we'll wonder why in 3 months" moment.

**`progress.md`** (the daily stand-up for your AI — updated every session):

```markdown
# Progress
**Updated:** YYYY-MM-DD

## Now (start here)
- <task> — <state, blockers>. If nothing is in progress, say so and name the next action.
## Up next
1. …
## Blockers / open questions
- …
## Closed milestones
- YYYY-MM-DD: <milestone> — one-line close summary, linking the narrative in `progress-archive.md`
## Baselines / pins
- <the current numbers: perf gates, bundle sizes, version pins>
```
**Section order is load-bearing:** *what to do* (Now · Up next · Blockers) comes before *what to know* (Closed milestones · Baselines). Keep it when editing.
**When the file gets long,** promote durable facts into `decisions.md`/`retro.md` and move closed-milestone narrative into `progress-archive.md`. That archive pass is what the older "prune monthly to a Changelog section" instruction became — same idea, real mechanism.
**`Baselines / pins` is the home for mutable current numbers** — an append-only `decisions.md` structurally cannot hold them.
**There is deliberately no "session notes" section:** it was absorbed by `Now (start here)`, which every session reads first. Don't restore it as missing.

---

## 7. Layer 4 — Session Discipline

### 7.1 Start ritual (every session)
1. Agent reads `AGENTS.md` (automatic) + `docs/ai/progress.md` + the active spec.
2. You state the goal in one sentence, scoped: *"Today: T3 and T4 of specs/003."*
3. For anything ≥ Gear 2: agent restates its understanding + plan; you approve before any edit. Use plan mode / read-only mode where the tool has one — it makes "no edits yet" physically enforced instead of polite.

### 7.2 Work loop — Explore → Plan → Execute → Review → Ship
- **Explore:** agent reads relevant code before proposing anything. Scope it ("read src/auth/ and explain the flow") — unbounded "go investigate" floods context. If the tool supports subagents, send noisy research there so the main context stays clean.
- **Plan:** written, reviewable, against the spec.
- **Execute:** one task at a time, in `tasks.md` order. Prefer test-first on logic-heavy tasks: have the agent write a failing test → minimal code to pass → refactor (agents default to code-first; you must invert it).
- **Review:** evidence, not assertions (C6). Strong pattern: a **fresh context reviews the diff** — second session/subagent/another model — because the writer grading its own work is the weakest link. Challenge prompt that works: "Grill me on these changes — prove this works."
- **Ship:** conventional commit per task or coherent group; PR when the spec's acceptance criteria are all green. You read every diff (C9).

### 7.3 End ritual (never skip — 3 minutes)
1. Update `progress.md` (move Done items, set Next, note blockers + session notes).
2. Append any decision to `decisions.md`.
3. Tick/adjust the spec's `tasks.md`; correct the spec if reality diverged (C12).
4. Uncommitted mess? Either finish to a clean point or write exact resume-state into progress notes.

### 7.4 Context hygiene
- **Watch the budget (C14):** aim to work in the 40–60% context-utilization band. Approaching it mid-feature? Compact deliberately: write current state into the plan/progress file, clear, reload from the artifact — don't wait for automatic compaction to garbage-collect your context for you.
- Long sessions rot: when quality drops or after finishing a work unit, clear/compact and let the memory files rebuild context — that's what they're for.
- **Correctness first (C15):** before starting a big task, verify the loaded docs are current — one wrong "fact" (a renamed file, a dead command) does more damage than a missing one.
- Corrected the same mistake twice → C11: clear, improve the prompt or the rules file, restart.
- Recurring correction across sessions → it's a missing rule; add one line to AGENTS.md (and delete a stale one to stay under budget).

---

### 7.5 Retro ritual (per feature — 5 minutes)

The workflow improves itself only if failures become data. After each Gear 2+ item closes, append to `docs/ai/retro.md`:

```markdown
## R-007 · 2026-07-10 · <feature/bug name> · Gear 2
1. Where did the agent fail or need correction? <…>
2. Which rule/context was missing or wrong?      <…> → action: <AGENTS.md line added / doc fixed / none>
3. Which ceremony was waste?                     <…> → action: <template line deleted / gear lowered / none>
Metrics: corrections=<n> · first-try verification pass=<y/n> · sessions used=<n>
```

Every answer must end in an action or an explicit "none" — a retro that changes nothing is theater. This file is also where the workflow itself gets pruned (C16).

## 8. Guardrails & Enforcement

### 8.1 The threat model — the Lethal Trifecta
Simon Willison's model (now echoed by OWASP's agentic guidance) explains essentially every public agent breach: an agent becomes exploitable when it simultaneously has **(1) access to private data, (2) exposure to untrusted content, and (3) the ability to communicate externally**. Models cannot reliably distinguish instructions from data — anything the agent *reads* can steer it — and OWASP's 2026 assessment is that this is architectural, not patchable. So the defense is structural: **remove one leg whenever possible.**

Practical rules for coding agents:
- Treat as **untrusted content**: fetched web pages, GitHub issues/PR comments from others, third-party dependency code and READMEs, MCP server outputs, error messages containing external input. Instructions embedded in any of these are injection attempts, not tasks.
- Don't combine legs: a session that browses the web or reads external issues should not also hold secrets or have push/publish rights. Research in one context, act in another (fits the fresh-context handoff pattern in 5.3 anyway).
- MCP servers and agent plugins are **supply chain**: install only audited/needed ones; a malicious server is an insider with your agent's permissions.
- Sandbox network egress deny-by-default for unattended runs; an agent that can't call out can't exfiltrate.
- Never store secrets where the agent reads by default (see Boundaries, 4.1).

### 8.2 Enforcement mechanics

- **Hard rules live in gates, not prose (C8).** Wherever the tool supports it, enforce: auto-format on write, test-run after edits, block dangerous commands (Claude Code hooks: PreToolUse/PostToolUse/Stop; other tools: git pre-commit hooks + CI). CI is the universal, tool-agnostic gate: lint + typecheck + tests required to merge — the agent can't argue with CI.
- **Permissions:** allowlist routine commands (test, lint, commit); deny-list destructive ones; approval required for the rest. Unattended/overnight runs only inside a sandbox/container with network egress limits — never with permissions bypassed on your real machine.
- **Git safety:** agents work on branches, never `main`. Parallel agents → separate worktrees. Checkpoint before big refactors.
- **Secrets:** never in context, never in memory files. `.env*` in Boundaries (Section 4.1).
- **Dependency changes always require explicit human approval** — supply-chain risk plus bundle discipline.

---

### 8.3 Parallel agents (when one isn't enough)

Running 2–3 agents concurrently multiplies output *only* with discipline; without it, it multiplies merge conflicts:
- **Partition by independence, not by speed.** Only parallelize tasks with no shared files and no dependency edges in `tasks.md`. When in doubt, serialize.
- **One writer per area.** Each agent gets its own git worktree + branch and an explicit file-scope ("you own `src/api/`; do not touch anything else").
- **Shared memory is read-only during parallel runs.** Agents read `progress.md`/specs but don't write them mid-run; the human merges status at the end (prevents the two-writers-one-file corruption problem).
- **Merge discipline:** integrate one branch at a time, run the full suite between merges, and review each diff independently (C9). Never let an agent resolve merge conflicts unsupervised in code it didn't write.
- **Role split beats clone split:** the highest-value second agent is usually a *reviewer* in a fresh context (7.2), not a second implementer.

## 9. Tool Adapters (thin, optional)

| Tool | Adapter |
|---|---|
| **Claude Code** | `CLAUDE.md` = `@AGENTS.md`. Plan mode for Section 7.1. Subagents for research/review. Hooks for Section 8 gates. Turn repeated playbooks into skills/commands (checked into git). |
| **Cursor** | Reads AGENTS.md natively. Add `.cursor/rules/*.mdc` only for glob-scoped extras. Use its plan mode the same way. |
| **Codex CLI / Copilot / Windsurf / Aider / Zed** | Read AGENTS.md natively — zero extra setup. |
| **Gemini CLI** | `GEMINI.md` bridge file. |
| **Any chat model (no repo access)** | Paste `AGENTS.md` + `progress.md` + active spec at conversation start — the system degrades gracefully to copy-paste. |

---

## 10. Anti-Patterns (the known failure modes)

1. **The bloated rules file** — agent ignores half of it. Prune ruthlessly (C3).
2. **LLM-written rules files** — measurably worse outcomes (C2). Agent may *draft*; human rewrites and owns.
3. **Sea of markdown** — Gear 3 for everything. Respect the gears (C7).
4. **Spec theater** — specs written, never maintained; code drifts; agents follow stale specs into bugs (C12).
5. **Trust-then-verify gap** — "looks done" shipped without running anything (C6).
6. **Infinite exploration** — unscoped investigation eats the context window (7.2).
7. **Correction loops** — arguing with a polluted context instead of clearing it (C11).
8. **Five copies of the truth** — per-tool rule files drifting apart (C1, C5).
9. **Stale memory** — progress.md three weeks old is worse than none; the end ritual (7.3) is load-bearing.
10. **Letting the agent grade its own homework** — writer and reviewer share a context (7.2 Review).
11. **Spec as guarantee** — a spec improves the odds; it doesn't certify the output. Review the result as rigorously as you would without one.
12. **Process as a substitute for understanding** — if you can't evaluate whether the output is correct, no spec, gear, or template will save you. The workflow amplifies judgment; it can't replace it.

---

## 11. Adoption Path

- **New project (30 min):** copy layout (Section 3) → hand-write AGENTS.md → fill brief.md → first feature as Gear 3 to learn the rhythm.
- **Existing project (1 hr):** have the agent *draft* architecture.md + AGENTS.md from the codebase → **you rewrite** (C2) → initialize progress.md with current truth → adopt gears from the next task forward.
- **Weekly (10 min):** prune Done list, re-rank Next, one-line-audit AGENTS.md, delete/archive dead specs.
- **Quarterly (30 min) — the obsolescence review:** models improve fast; a workflow this central must shrink, not accrete. Ask of every ritual, template section, and rule: *"can we delete this because the models got better?"* (Precedent: mature frameworks have dropped entire spec-writing phases for exactly this reason.) Review retro.md metrics to decide with data, not habit.

## 12. Measurement & Success Criteria

You can't know whether a workflow change helped without numbers. Track three metrics in `docs/ai/retro.md` (they're already fields in the 7.5 template):

| Metric | Direction | Signal |
|---|---|---|
| Corrections per session | ↓ over time | Rules and context are converging on reality |
| First-try verification pass rate | ↑ over time | Specs/plans are precise enough to implement from |
| Sessions (or hours) per gear-equivalent task | ↓ over time | The system is paying for its own ceremony |

Rule: any change to this workflow that doesn't move a metric within a few features gets reverted (C16).

Qualitatively, the system is working when: a brand-new session is productive within one prompt ("read progress and continue"); any agent/model can be swapped in without re-explaining the project; "why did we do X?" is answered by decisions.md, not archaeology; and the correction rate falls week over week.
