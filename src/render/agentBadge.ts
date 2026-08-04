// agentBadge — the one consumer of the identity seam: it pairs `docIdentity`'s registered name
// with `agentFile`'s predicate and returns either ONE text pill or nothing at all (008 plan §1.1,
// D-1 · D-2 · D-12). This module is where 1.1's registry and 1.2's predicate finally meet.
//
// ── THE GATE, AND WHY IT IS THE `buildDiffChrome` SHAPE VERBATIM ──────────────────────────────
//
// `diffChrome.ts:175` states the property this borrows: *"THE GATE. Read at BUILD time (this is
// chrome composition, not a gesture) — and it is the only condition."* The same three words apply
// here for the same three reasons:
//
//   • READ AT BUILD TIME, NEVER CAPTURED. `mount()`'s `replaceChildren` destroys every piece of
//     chrome on every render, so a name captured into a closure is stranded by the next one — the
//     property `diffRegistry.ts:5-10` states for its own siblings. `getDocIdentity()` is called
//     inside this function, per render, so render N+1 reads what render N+1's registry holds.
//   • IT IS THE ONLY CONDITION. Not `contained`, not the surface, not whether a watch is running:
//     the badge exists iff the registered name is recognized. Task 1.4's row-3 red-first check
//     ungates the name and requires the badge to appear on an unrecognized document, which is what
//     proves the gate is the NAME and not an accident of the surface it happens to render on.
//   • ONE EMPTY STATE, NOT TWO. `[]` covers "nothing registered" AND "registered but unrecognized",
//     and `isAgentFile(undefined)` collapses them by construction (1.2's signature takes
//     `string | undefined` for exactly this). That is 1.1's deliberate divergence from its two
//     sibling registries, which pair a nullable holder with a presence predicate: here recognition
//     IS the presence question, so there is no second state to keep in step.
//
// ── NO EXPLANATORY NOTE IN EITHER EMPTY CASE — D-14, AND IT IS A RULE ABOUT THE USER ──────────
//
// `buildWatchChrome` returns a designed explanation where a user WOULD wonder why watching is
// missing; `buildDiffChrome` returns bare `[]` because the user was never offered a history
// feature on that surface. The badge is the second kind and more so: an unrecognized document is
// not a degraded state, it is the resting one (spec §3.8 — *"An unrecognized filename, or no
// filename at all, produces no badge and no explanation. Absence is the resting state, not a
// degraded one."*). A note here would announce a feature by telling people it did not apply.
//
// ── A SIBLING OF THE READING COLUMN, WHICH IS WHAT KEEPS THE GOLDEN PIN HONEST ────────────────
//
// `mount()` spreads the result into `children[]` (declared `mount.ts:154`, `root` pushed last
// `:203`, committed `:210`), so the badge is a SIBLING of `.peekover-reader` and never inside it —
// the column stays byte-identical and the golden fixtures cannot move. ★ That is a construction
// property, not a test result: `tests/golden/` snapshots the pre-mount `sanitize(parse(source))`
// string, which is upstream of this function entirely, so an EMPTY golden diff would also be the
// reading on a badge wrongly appended INTO the column. Task 1.4 asserts the sibling relationship
// directly in a real engine, red-first by putting the badge inside — at which point the golden
// diff stays empty and the structural assertion is the only thing that fires.
//
// ── THE COPY: WHAT D-12 CARRIES FROM THE MOCKUP, AND WHAT IT DECLINES TO ──────────────────────
//
// `design/mockup.html:634` is the badge's only design precedent: an eyebrow reading
// `◈ Agent file detected · tuned rendering on`, coloured `var(--ok)`, INSIDE the reading column.
// D-12's rule is to carry the mockup's language and let the spec win each divergence. Three win
// here, and each is recorded rather than silently taken:
//
//   1. `· tuned rendering on` is DROPPED. Which presentation defaults a recognized file gets is
//      spec §8-4's, and §8-4 is a human call taken at 6.1 from the walk (plan D-2's closing line:
//      *"This plan builds the seam and the badge; it does not pick the tuning."*). A badge that
//      announced tuned rendering would be asserting an outcome nothing has chosen yet.
//   2. `◈` and `color:var(--ok)` are DROPPED. Spec §5 requires the badge to be TEXT, not colour
//      (§3.11 row 15), and a glyph plus a status colour is precisely the state-carried-by-an-icon
//      shape D-12 divergence 2 rejects for `aria-sort`. The pill reads in monochrome.
//   3. It is a SIBLING, not an in-column eyebrow — plan D-2, above.
//
// What is carried is the phrase `Agent file`, and the name is appended: `Agent file · CLAUDE.md`.
// The name is the half only this seam can supply — the content-script reader shows no filename
// anywhere in the shadow root, and the whole of D-1 exists to get that string here.
//
// ★ AND THE LABEL'S WIDTH IS AN INPUT TO TASK 1.5, so its shape is deliberate. Plan §8 Q3 prices
// the badge's lane on the label being *"one of ~6 strings"*: `AGENT_FILE_NAMES` is frozen at five
// members, so `${LABEL_AGENT_FILE} · ${name}` is exactly FIVE enumerable strings and the widest is
// derivable rather than tuned — the same deterministic-width argument `diffChrome.ts:118-129` used
// to give the diff pill the left lane. 1.5 probes all five at both geometry widths; 6.1 chooses.
//
// ── PLACEMENT IS NOT CHOSEN HERE, AND THAT IS A GATE RULING, NOT A DEFERRAL ───────────────────
//
// Gate-2 Q3 ruled the badge's lane UNCHANGED — *"produce, do not choose"*: **1.5 PRODUCES the rect
// measurement** at 1280 AND 1400, and the lane CHOICE is the human's at 6.1. So the rule this task
// ships is PROVISIONAL by instruction. Its rationale, and the collision candidates 1.5 must probe,
// live in `readerCss.ts` above the block — including the one this task already knows about (the
// contained pane's diff picker at `top:50px`, `hidden` until opened).
//
// ★ Nothing registers a name in PRODUCTION until task 1.4, so at this commit the badge is reachable
// but never built on either surface: `getDocIdentity()` returns `undefined` at every production
// render, `isAgentFile` declines it, and the result is `[]`. The bytes ship; the pill does not
// appear until 1.4 wires the two registration sites. That is the task boundary, stated so the next
// session does not read the absence as a defect.

import { getDocIdentity } from './docIdentity';
import { isAgentFile } from './agentFile';

/** The badge's class. Exported so the browser suite (1.4, 1.5) selects the shipped name rather
 *  than a re-typed string literal that a rename would silently strand. */
export const AGENT_BADGE_CLASS = 'peekover-agent-badge';

/** The carried half of the mockup's copy (`mockup.html:634`), minus the `tuned rendering on`
 *  claim §8-4 has not made and minus the `◈` glyph §5 forbids as state. */
const LABEL_AGENT_FILE = 'Agent file';

/** The separator every sibling chrome already uses between a label and its subject
 *  (`diffChrome`'s picker rows, the remote-load pill's `· Load`). */
const SEPARATOR = ' · ';

/**
 * The agent-file badge, or nothing.
 *
 * `mount()` spreads the result into its `children[]`, so the pieces are SIBLINGS of
 * `.peekover-reader` and the reading column is untouched. Called once per render, on both
 * surfaces, with no per-surface branching — the registry is the only input.
 *
 * @returns Exactly ONE node when this context registered a recognized agent-file name; `[]`
 *   otherwise — the same `[]` for "no name registered" and for "name not recognized", with NO
 *   explanatory note in either case (D-14).
 */
export function buildAgentBadge(): Node[] {
  // THE GATE. Read at BUILD time — and it is the only condition. `getDocIdentity()` is called
  // here, per render, never captured: the registry is re-read by every render, so switching
  // documents re-derives the badge instead of stranding the previous document's name on the new
  // one (§3.11 row 14, asserted red-first at 1.4 against a captured name).
  const name = getDocIdentity();
  // `name === undefined` is REDUNDANT AT RUNTIME — `isAgentFile(undefined)` is already `false`
  // (1.2's signature takes `string | undefined` precisely so this stays one question), so this arm
  // is unreachable today and NO test can turn it red. It is kept deliberately, and what it is
  // worth was MEASURED rather than assumed (task 1.3, ablation C): `isAgentFile` returns `boolean`
  // and not a type predicate, so with this clause removed `name` stays `string | undefined` at the
  // template literal below — and NEITHER `tsc --noEmit` NOR this repo's eslint flags that. The
  // interpolation compiles clean and would ship the literal label `Agent file · undefined` the
  // moment 1.2's predicate is ever widened to accept an absent name. So the guard is a deliberate
  // belt against a silent, un-caught failure mode, not a compiler-enforced one — recorded as such
  // because a reader who assumes the toolchain is holding this would be wrong.
  //
  // The alternative — widening 1.2's predicate into `name is string` — edits a module this task
  // does not own and is not in its Files list. Both arms still return the SAME `[]`, so the
  // one-empty-state property is unchanged either way.
  if (name === undefined || !isAgentFile(name)) return [];

  // A <p>, not a <button>: the badge is not interactive (§3.11 rows 12, 16 — it opens nothing and
  // takes no gesture), so it gets no role, no tabindex and no accessible-name attribute of its
  // own. Its state IS its text (§3.11 row 15, spec §5), which is what makes it readable to
  // assistive technology with no `aria-*` at all.
  const badge = document.createElement('p');
  badge.className = AGENT_BADGE_CLASS;
  badge.textContent = `${LABEL_AGENT_FILE}${SEPARATOR}${name}`;
  return [badge];
}
