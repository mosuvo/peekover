// diffChrome — the diff AFFORDANCE (task 6.2). THE ONLY DIFF MODULE `mount.ts` IMPORTS (plan §1.4).
//
// ── THE FENCE IS WHY THIS FILE IMPORTS ONLY THE REGISTRY ──────────────────────────────────────
//
// `mount.ts` reaches this file, and `mount.ts` is the content script's render path. Plan §1.4
// fences THREE things off that graph, and this module may import none of them:
//   • the `diff` package        — bytes that must never ship to the content script (C7);
//   • `./diffEngine`            — its only importer, so the same bytes by another name;
//   • `./diffView`              — "Imported by `appShell.ts`, never by `mount.ts`; `mount.ts`
//                                 importing it would drag the view into the content-script graph
//                                 and put the hole back in the fence" (plan §1.4, verbatim).
// So the affordance owns the GESTURE and nothing else. The capability — compute a diff, render it,
// leave it — arrives as `showDiff` / `hideDiff` closures that `appShell.installWatchForFile`
// provisions on the {@link DiffContext} (`diffRegistry.ts`'s header records the shape and why it is
// coarse). The app page imports the engine and the view; this file imports neither, and the surface
// gate and the bundle fence stay THE SAME SEAM. If `diff` ever appears in the content-script bundle
// that is a STOP-and-flag (plan §1.4) — §5 pins it statically and by measured bytes.
//
// ── D-14: EMPTY REGISTRY → `[]`, AND NO NOTE BRANCH ───────────────────────────────────────────
//
// {@link buildDiffChrome} returns `[]` when no diff context is registered — and returns it with NO
// explanation, which is the DECISION, not an omission. `buildWatchChrome` has four states because a
// user who cannot watch WOULD wonder why a control they have seen is missing. Nothing is analogous
// here: spec §3.2 is verbatim that "the user never saw a history feature on that surface, so there
// is nothing to be told they are missing. **Do not add one.**" The absence of a note branch IS the
// design (D-14 — "a surface that registered no diff target grows no diff chrome at all"). The gate
// is `isDiffContextRegistered()` — the SAME signal 3.1's capture disclosure reads, and it is
// reliable on the content script because that surface's `installWatchForFile` never runs and 1.4
// gates capture off there with `docId: null` (proven by 2.1's production-path browser test).
//
// ── THE SEAM: NO CONTEXT REFERENCE IS EVER CAPTURED ───────────────────────────────────────────
//
// `mount()` rebuilds its chrome on EVERY render via `replaceChildren`, including the renders a
// running watch causes. So this control holds NO context reference: it asks `getDiffContext()` at
// CLICK time, exactly as `watchControl.ts` asks `watchRegistry` (the third instance of the pattern,
// copied not re-derived — `watchRegistry.ts`'s header has the argument).
//
// ── PLACEMENT: MEASURED, NOT CHOSEN — AND MEASURED ON THE RIGHT SURFACE ───────────────────────
//
// The 4.1 rule (watchControl.ts:17-28 is the worked example). It lives HERE rather than on the CSS
// rule it explains for a measured reason of its own: readerCss.ts's comments sit INSIDE a template
// literal, so they ship verbatim in every bundle — including the content-script bundle, which by
// D-14 never renders any of this. A `.ts` comment is stripped by the minifier. (The first draft put
// this block in the CSS and cost ~8 KB of shipped prose.)
//
// ★ THE SURFACE IS THE CONTAINED PANE, not the full-page reader every other pill in readerCss.ts
// was measured against — D-14 puts this chrome on the APP PAGE ONLY. That distinction is not
// academic: under CONTAINED_CSS the pills become position:absolute inside a `:host{position:
// relative}` box that is the whole DOCUMENT's height, so the pane's geometry bears no resemblance
// to the full-page one. A first probe measured full-page, "cleared" top-left, and was contradicted
// the moment the real surface was measured. The rects below are that re-measurement — TOC rail
// forced OPEN (its width-derived initial state stomps an early `data-toc` a frame later), at 8- and
// 30-heading documents, on both engines. Page coordinates, contained pane at 1280x900:
//
//   - BOTTOM-LEFT, the next 40px step (bottom:216): pill [360,3513,490,3543] lands INSIDE the
//     capture disclosure [360,3473,580,3583]. bottom:256 lands inside it too. AND NO FURTHER STEP
//     FIXES IT: 3.1's disclosure is a width-capped aside whose height is TEXT-WRAP dependent —
//     110px at 1280, 182px at 414 — so every fixed offset that clears it at one width is inside it
//     at the other. The column is out of deterministic room, and picking a magic number here is
//     exactly the guess the measure-don't-choose rule exists to prevent.
//   - TOP-RIGHT below the mode toggle (top:56): pill [1110,133,1240,163] vs the TOC handle
//     [1029,133,1148,163] — the collision 004 measured and watchControl.ts:19-21 records,
//     reproduced on this surface. Its picker lands on the rail's entry list as well.
//   - TOP-LEFT at :16 is the remote-load opt-in's own slot (position:fixed;top:16;left:16), so it
//     is taken on exactly the documents that have blocked media — watchControl.ts:22-23's
//     conditional-clearance objection, applying unchanged.
//   - BOTTOM-RIGHT (bottom:16): clears, but sits on the OPAQUE full-height rail's surface, and its
//     picker must expand UPWARD into the aside stack — measured at 414 it lands on the theme pill,
//     the watch pill, the watch note AND the disclosure.
//
// TOP-LEFT below the remote-load slot is what survived: pill [360,133,490,163], picker
// [360,171,600,391], hitting nothing at either document length on either engine — and it is the
// only corner whose picker expands into open space rather than into occupied chrome. Its one cost
// is a 40px gap above the pill on documents with no blocked media, which is the trade the other
// column already ships (the network indicator at bottom:16 is hidden until a network action).
//
// NOT ASSERTED AT 414x896, deliberately rather than as a gap: at that width the app shell's tree
// leaves the reader pane 194px wide and the reader host 146px — narrower than a single 130px pill —
// so EVERY candidate collides there, and the existing bottom-left stack ALREADY self-overlaps
// (watch note [260,20451,390,20543] vs capture disclosure [260,20321,390,20503]) before this task
// adds anything. That is a pre-existing 3.1-era condition of the contained pane; it is recorded
// rather than papered over with an offset tuned to today's copy, and it is not 6.2's to fix.
//
// ── ★ SUPERSEDED BY RECOVERY B1 (the M6 9.1 gate's finding 2) — top:56 → top:12 ────────────────
//
// EVERYTHING ABOVE STANDS AS THE CANDIDATE RECORD; the surviving offset does not. The 6.2
// measurement swept the six sibling CHROMES and the rail and cleared them all — but it never
// measured the READING COLUMN, and that is where top:56 collided. `.peekover-reader` carries
// `padding:56px 32px 130px`, so the h1's top edge is at exactly 56 too: the pill's top edge and the
// heading's were flush, and they overlapped horizontally on every app-page width where the column's
// left margin fell under ~114px (≲1440 CSS-px). The clearance loop in
// diffChrome.browser.test.ts cited watchControl.browser.test.ts by name, borrowed its scoping
// decision, and dropped its reading-column assertion — so the sweep was green and wrong.
//
// THE FIX IS VERTICAL, AND THAT CHOICE IS LOAD-BEARING. The same recovery pass fixed finding A (the
// column was flung right against the rail because the data-toc="open" override left margin-left
// auto; readerCss.ts's B1 .ts block has that argument). Finding A's fix MOVES the column's left
// margin — it grows with viewport width — so any horizontal fix for finding 2 would have been tuned
// against geometry that was about to change underneath it, and would simply have relocated the
// collision to wider viewports. The reading column's top 56px of padding, by contrast, is empty at
// EVERY width, forever. A 32px pill at top:12 sits wholly inside it and clears the h1 by 12px
// independently of how wide the viewport is or where the column's margin lands.
//
//   CONTAINED_CSS ONLY — the pill exists on the app page alone (D-14), so no full-page rule moves.
//   .peekover-diff-affordance  top:56 → top:12   pill host-rect [16,12,101,44]  ("Compare",  85px)
//                                                             [16,12,152,44]  ("Close…", 136px)
//   .peekover-diff-picker      top:94 → top:50   picker [16,50,256,94] — the SAME 6px gap under the
//   .peekover-diff-status      top:94 → top:50   pill that the 6.2 pair had (88→94).
//
// ── THE REMOTE-LOAD LANE: the conditional-clearance objection, finally answered ────────────────
//
// Moving the pill up puts it in the band the remote-load opt-in owns (top:16; left:16) — the
// objection recorded four paragraphs above as "applying unchanged". It cannot stay recorded now, and
// two ~30px pills cannot stack inside a 56px band, so the band is split into LANES instead:
// the diff pill keeps left:16, and CONTAINED_CSS displaces `.peekover-remote-load` to left:176.
//
// ★ THE DIFF PILL TAKES THE LEFT LANE, AND THE DIRECTION IS THE WHOLE POINT — it is the one whose
// width is DETERMINISTIC. Its label is one of exactly two module constants (LABEL_COMPARE 85px,
// LABEL_EXIT 136px, both measured on both engines), so an offset set off the wider one — 152 + a
// 24px gap = 176 — is a derived number, not a tuned one. remote-load's copy is
// `${n} remote image(s) blocked · Load`: its width moves with the blocked COUNT and its plural, so
// placing the diff pill to the RIGHT of it would have meant guessing past content-dependent text —
// exactly the magic-number trap the bottom-left elimination above rejects at :55-60, where 3.1's
// disclosure height varies with text wrap. The variable-width element goes on the right, where its
// variability extends into open space instead of into someone else's offset.
//
// Both lanes asserted at 1280 AND 1400 on both engines, in BOTH pill label states, on a document
// with genuinely blocked media (diffChrome.browser.test.ts). The 414 case is still not asserted, for
// the pre-existing reason recorded above — nothing about B1 changes it.

// ── 008 D-3 / D-4: TWO KINDS IN ONE LISTBOX, AND WHERE THE DISCRIMINANT LIVES ─────────────────
//
// The picker offers two kinds of comparison target: this document's own snapshots, and the OTHER
// markdown files in the folder (the D-3 optional capability pair, provisioned by the app page —
// `diffRegistry.ts:62-78`). Two rules, both sealed at gate 2, applied here and not re-argued:
//
//   • THE DISCRIMINANT IS ON THE ROW — `dataset.targetKind`, beside today's `dataset.snapshotId`.
//     That is the only place that needs it: ONE branch reads it. A tagged union in the context
//     would push a `kind` through two closures to reach that same single branch (D-3).
//   • THE TWO `role="group"`s APPEAR ONLY WHEN BOTH KINDS HAVE ENTRIES. With one kind the picker is
//     STRUCTURALLY what 006 shipped — flat `role="option"` rows in the one listbox. That is not
//     tidiness: it keeps the snapshot-only path — the path every existing assertion in this
//     module's two suites drives — identical, so those assertions cannot pass by transcription
//     drift, and it spares AT a single-group nesting that announces a grouping which groups nothing
//     (D-4).
//
// `role="group"` is a legal owned child of `role="listbox"`, and grouping is the standard ARIA
// answer to "one list, two kinds" — so this stays ONE control: no dialog, no menu, no second pill
// (§3.2 rejected a second control; divergence 1 below rejected the dialog).
//
// ── THE CONTENT-SCRIPT BYTES THIS COSTS, ASSIGNED ─────────────────────────────────────────────
//
// `mount.ts:28` imports `buildDiffChrome`, so this module is on BOTH graphs — the picker is
// app-page-only at RUNTIME (D-14: no context registered there, so it builds nothing), never in the
// BUNDLE. Plan §4 risk 2 is where that was decided: the content-script bundle stops being
// byte-identical in M8, and the price of that is that every byte is assigned. Measured for this
// task, both engines, content script and app chunk moving by the same amount:
//
//   +6 B   the `ARIA_PICKER` const and the named `snapshotRows` local
//   +48 B  the row discriminant and the widened listbox label
//   +585 B the file row — `buildFileItem`, its two spans, its label
//   +248 B the grouping — `buildGroup` and the both-non-empty ternary
//   = 887 B, and stripping all four reproduces HEAD's bundles to the md5 (residual zero).

import { getDiffContext, isDiffContextRegistered, type DiffFileEntry } from './diffRegistry';

/** CSS class the reader stylesheet styles (`readerCss.ts`). The affordance pill itself. */
export const DIFF_AFFORDANCE_CLASS = 'peekover-diff-affordance';
/** The snapshot picker the affordance opens — a plain listbox, never a dialog (see below). */
export const DIFF_PICKER_CLASS = 'peekover-diff-picker';
/** The fallback / empty-state line (`role="status"`), rendered beside the untouched reader. */
export const DIFF_STATUS_CLASS = 'peekover-diff-status';

/** Copy, in one place so the tests and the UI cannot drift. */
const LABEL_COMPARE = 'Compare';
const ARIA_COMPARE = 'Compare this document with a saved snapshot';
const LABEL_EXIT = 'Close comparison';
/** The listbox's own label. It WIDENS with the picker (D-4): the list is no longer snapshots alone,
 *  and a label that still said so would misname what it contains for exactly the AT users who
 *  cannot see the two groups' shape. */
const ARIA_PICKER = 'Snapshots and other files to compare against';
/** One label per `role="group"` — the group is announced by name, never by its position in the
 *  listbox (§5: never carried by position or colour alone). */
const GROUP_SNAPSHOTS = 'Snapshots of this document';
const GROUP_FILES = 'Other files in this folder';
/** A file row SAYS it is a file, in text — the row's own kind, visible, not inferred from which
 *  group it happens to sit in (D-4). */
const TEXT_FILE_KIND = 'File';
const TEXT_NO_SNAPSHOTS = 'No snapshots yet — this document has not changed since watching started.';
const TEXT_UNAVAILABLE = 'Comparison unavailable — that snapshot is no longer stored.';
const TEXT_NO_SOURCE = 'Comparison unavailable — nothing is on screen to compare against.';

/** `ts` → a short, absolute, locale-formatted stamp. Absolute rather than relative ("2 min ago")
 *  on purpose: relative stamps are the VERSION-BROWSER register that divergence 2 below rejects. */
function stampOf(ts: number): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** `bytes` → a compact size, so an item names WHAT it is comparing against, not just when. */
function sizeOf(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Build the diff affordance for `host`, or `[]` when the diff registry is empty.
 *
 * D-14: a surface that registered no diff target grows no diff chrome AT ALL — no affordance and,
 * unlike {@link buildWatchChrome}'s four-state note, NO explanation either (§3.2, above).
 *
 * `mount()` spreads the result into its `children[]`, so every piece is a SIBLING of
 * `.peekover-reader` and the reading column stays byte-identical (the golden pin cannot see this —
 * the DOM sibling relationship is asserted directly in the browser suite).
 */
export function buildDiffChrome(host: HTMLElement): Node[] {
  // THE GATE. Read at BUILD time (this is chrome composition, not a gesture) — and it is the only
  // condition. Not `contained`, not `watchAvailable()`: D-14 is explicit that the signal is the
  // registry's emptiness, because that is the one signal that is false on the Chromium
  // content-script reader, which CAN watch but registers no diff target.
  if (!isDiffContextRegistered()) return [];

  // ── MOCKUP DIVERGENCE 1 (plan §1.7, recorded so nobody later "fixes" it to match) ────────────
  // The mockup's diff is a MODAL OVERLAY — `design/mockup.html:753-754`, `role="dialog"
  // aria-modal="true"`, opened by `openDiff()` at `:1283`. Spec §3.7 requires the diff INLINE in
  // the reading column, and spec §6 puts modals out of scope. THE SPEC WINS. Concretely: the
  // picker below is a `role="listbox"` anchored to the pill, never a dialog; it traps no focus,
  // dims no backdrop, and the reader stays interactive behind it.
  //
  // ── MOCKUP DIVERGENCE 2 ─────────────────────────────────────────────────────────────────────
  // The mockup frames snapshots as a VERSION BROWSER — "Snapshot v3 · 2 min ago restored — every
  // save is versioned locally" (`mockup.html:681`). Spec §3.7 makes the picker a DIFF-TARGET
  // SELECTOR, and 005 §6 keeps version-history-as-a-surface out of scope. THE SPEC WINS.
  // Concretely: no version numbers, no "restore" verb, no relative "2 min ago" stamp — each item
  // names the absolute time and size of a thing to COMPARE AGAINST, and choosing one enters the
  // diff. There is no path from this control to a stored version as an artifact in its own right.
  const chrome: Node[] = [];

  const status = document.createElement('p');
  status.className = DIFF_STATUS_CLASS;
  // `role="status"` — polite, not an alert, and the SAME shape `buildWatchNote` uses: this is the
  // fallback surface (plan §1.5, §7-8), which explains WITHOUT a re-render so the last good render
  // stays exactly where it is. `hidden` (not a class) keeps an empty region out of the a11y tree.
  status.setAttribute('role', 'status');
  status.hidden = true;

  const picker = document.createElement('div');
  picker.className = DIFF_PICKER_CLASS;
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', ARIA_PICKER);
  picker.hidden = true;

  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = DIFF_AFFORDANCE_CLASS;
  pill.setAttribute('aria-label', ARIA_COMPARE);
  pill.setAttribute('aria-expanded', 'false');
  pill.textContent = LABEL_COMPARE;

  /** Show `text` in the fallback/empty-state line, or clear it. Never blank (AGENTS.md #5). */
  function say(text: string | null): void {
    status.textContent = text ?? '';
    status.hidden = text === null;
  }

  /** Close the picker and return the pill to its resting state. */
  function closePicker(): void {
    picker.replaceChildren();
    picker.hidden = true;
    pill.setAttribute('aria-expanded', 'false');
  }

  /** Put the pill into "a diff is on screen" state, where its gesture becomes EXIT. */
  function showExit(): void {
    pill.textContent = LABEL_EXIT;
    pill.setAttribute('aria-label', LABEL_EXIT);
    pill.dataset.diffOpen = 'true';
  }

  /** Return the pill to "offer a comparison" state. */
  function showCompare(): void {
    pill.textContent = LABEL_COMPARE;
    pill.setAttribute('aria-label', ARIA_COMPARE);
    delete pill.dataset.diffOpen;
  }

  /** Enter the diff against snapshot `id`. Every failure lands in the fallback (plan §1.5). */
  async function compareWith(id: string): Promise<void> {
    // THE REGISTRY IS READ HERE, AT GESTURE TIME — never captured when this control was built.
    const context = getDiffContext();
    if (!context) return;
    closePicker();

    const before = await context.fetchText(id);
    const after = context.getCurrentSource();
    // 1.2's designed self-reclaim window: meta can outlive its content row. That lands HERE, in
    // the same fallback state as a render failure — the document stays on screen, untouched.
    if (before == null) return say(TEXT_UNAVAILABLE);
    if (after == null) return say(TEXT_NO_SOURCE);

    // The engine and the view, both reached over the fence as one provisioned capability.
    const result = context.showDiff(host, before, after);
    if (!result.ok) return say(result.reason);
    say(null);
    showExit();
  }

  /** Build one picker row. A BUTTON so it is keyboard-operable (Enter/Space) for free — no
   *  hand-rolled keydown handling to get wrong, and it lands in the tab order natively. */
  function buildItem(entry: { id: string; ts: number; bytes: number }): HTMLElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'peekover-diff-picker__item';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.dataset.snapshotId = entry.id;
    // THE DISCRIMINANT (D-3), on the ROW because that is the only place that needs it: one branch
    // reads it to choose which capability the pick resolves through. Everything else about this row
    // is UNCHANGED — the absolute stamp and the size included (divergence 2 stands).
    item.dataset.targetKind = 'snapshot';
    // The item NAMES what it is: a time and a size to compare against (divergence 2). Both are
    // text, so the choice is never carried by colour alone (§5).
    const when = document.createElement('span');
    when.className = 'peekover-diff-picker__when';
    when.textContent = stampOf(entry.ts);
    const size = document.createElement('span');
    size.className = 'peekover-diff-picker__size';
    size.textContent = sizeOf(entry.bytes);
    item.append(when, size);
    item.setAttribute('aria-label', `Compare with the snapshot from ${when.textContent} (${size.textContent})`);
    item.addEventListener('click', () => void compareWith(entry.id));
    return item;
  }

  /**
   * Build one OTHER-FILE row (D-3, D-4) — the same `<button role="option">` as a snapshot row, for
   * the same stated reason, carrying `targetKind: 'file'` and the `path` its capability takes.
   *
   * It NAMES the file and SAYS IT IS A FILE, in text: the kind is readable on the row itself, never
   * inferred from which group it sits in or from where it falls in the list (§5).
   *
   * ★ NO CLICK HANDLER, DELIBERATELY. The gesture is task 2.5's, where `compareWith` branches ONCE
   * on `dataset.targetKind` — snapshot → `fetchText(id)`, file → `fetchFileText(path)`. Wiring it
   * here would be that branch written early and in the wrong task; routing a file row through
   * today's snapshot-only `compareWith` would be worse still, since it would answer a file pick
   * with "that snapshot is no longer stored".
   *
   * The two spans carry classes of their own rather than borrowing `__when` / `__size`: calling a
   * file's name "when" is a lie a later reader has to unpick. They are untuned today because the
   * picker's CSS lives in `readerCss.ts`, whose comments and rules ship to BOTH graphs — the row's
   * own flex rule already lays the pair out, so no rule is added for them.
   */
  function buildFileItem(entry: DiffFileEntry): HTMLElement {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'peekover-diff-picker__item';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.dataset.targetKind = 'file';
    item.dataset.filePath = entry.path;
    const name = document.createElement('span');
    name.className = 'peekover-diff-picker__name';
    name.textContent = entry.name;
    const kind = document.createElement('span');
    kind.className = 'peekover-diff-picker__kind';
    kind.textContent = TEXT_FILE_KIND;
    item.append(name, kind);
    item.setAttribute('aria-label', `Compare with the file ${entry.name}`);
    return item;
  }

  /** Wrap `rows` in a labelled `role="group"` — a legal owned child of `role="listbox"` (D-4).
   *  Called ONLY when both kinds have entries; see the header for why a lone group is never built. */
  function buildGroup(label: string, rows: HTMLElement[]): HTMLElement {
    const group = document.createElement('div');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label);
    group.append(...rows);
    return group;
  }

  /** Open the picker over the current comparison targets, or explain that there are none. */
  async function openPicker(): Promise<void> {
    const context = getDiffContext();
    if (!context) return;
    say(null);

    const entries = await context.fetchMeta();
    // OPTIONAL BY DESIGN (D-3): a surface with snapshots but no folder list is a legal, designed
    // state, and `?? []` is what makes the single-kind path below the one that surface always takes.
    const files = (await context.fetchFiles?.()) ?? [];
    if (entries.length === 0 && files.length === 0) {
      // A DESIGNED empty state, not a blank list (AGENTS.md #5). Note this is NOT the D-14 note
      // branch: the user asked for this by clicking, so an answer is owed. D-14 forbids explaining
      // an affordance that was never offered — not answering a gesture that was made.
      // ★ BOTH-EMPTY IS TODAY'S SHIPPED PATH, PRESERVED: it is the branch the surface with no
      // folder list takes, and 2.4 revisits the copy for the two half-empty states.
      closePicker();
      return say(TEXT_NO_SNAPSHOTS);
    }
    // Newest first — the most likely comparison target is the least travel away.
    const ordered = [...entries].sort((a, b) => b.ts - a.ts);
    const snapshotRows = ordered.map(buildItem);
    // The FOLDER's own order, unsorted: `fetchFiles` hands over `activeSource.files` filtered, which
    // is the order of the tree the user just picked this document from. Re-sorting here would make
    // the picker disagree with the tree beside it.
    const fileRows = files.map(buildFileItem);
    // ★ D-4, the whole rule in one expression: two labelled groups when BOTH kinds have entries,
    // and otherwise the flat listbox 006 ships — no lone group, no empty group, no scaffolding
    // around a list that has only one kind in it.
    picker.replaceChildren(
      ...(snapshotRows.length > 0 && fileRows.length > 0
        ? [buildGroup(GROUP_SNAPSHOTS, snapshotRows), buildGroup(GROUP_FILES, fileRows)]
        : [...snapshotRows, ...fileRows]),
    );
    picker.hidden = false;
    pill.setAttribute('aria-expanded', 'true');
  }

  pill.addEventListener('click', () => {
    const context = getDiffContext();
    if (!context) return;
    // One control, two states — the gesture is EXIT while a diff is on screen. A separate exit
    // button would be a second control for the inverse of the same action, and the pill's label
    // and aria-label both move with the state, so the change is never carried by position alone.
    if (pill.dataset.diffOpen === 'true') {
      context.hideDiff(host);
      showCompare();
      say(null);
      return;
    }
    if (!picker.hidden) return closePicker(); // second click closes an open picker
    void openPicker();
  });

  chrome.push(pill, picker, status);
  return chrome;
}
