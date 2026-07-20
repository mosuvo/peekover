// watchControl — the in-reader watch pill (task 4.1), and the one gesture that starts a watch.
//
// ── WHAT THIS IS, AND WHAT THE MOCKUP ASKED FOR INSTEAD ──────────────────────────────────────
//
// `design/mockup.html` puts the watch badge in a fixed 52px TOOLBAR, beside a brand mark, a
// breadcrumb, an AI button and a three-way segmented mode control. **The shipped reader has no
// toolbar and this task does not build one.** Peekover's reader chrome is a family of CORNER
// PILLS — mode toggle (top-right), theme pill (bottom-left), remote-load opt-in (top-left),
// network indicator (bottom-left), TOC rail (right edge) — and the right answer is to translate
// the mockup's DESIGN LANGUAGE into that family, not to import its layout.
//
// What is carried across from the mockup, faithfully: the pill shape (`border-radius:99px`), the
// `--ok` colour semantic ("this is live and healthy" — NOT the generic `--accent`), the pulsing
// dot, the `--ok-soft` hover, and the word "watching". What is dropped, and why, is recorded on
// the CSS rule in `theme/readerCss.ts`.
//
// PLACEMENT IS MEASURED, NOT CHOSEN BY TASTE (the M3 collision defect class; 004's 5.1 precedent).
// The bottom-left column, one pill-height above the theme pill, is what survived elimination:
//   - TOP-RIGHT is the mode toggle [341,16,398,46]; stacking beneath it lands at y 56-86, INSIDE
//     the TOC handle [280,56,392,102] — the exact collision 004 measured and rejected.
//   - TOP-LEFT is the remote-load opt-in, and it exists only on documents with blocked media, so
//     a control that clears it only sometimes is not a design.
//   - BOTTOM-RIGHT is inside the TOC rail box [257,0,414,896] at a narrow viewport, and the rail's
//     entry LIST runs to y=988 — past the viewport bottom — so a bottom:16 pill sits on live rail
//     content, not merely on its padding.
// That leaves the bottom-left stack: network indicator (bottom:16, hidden until a network action),
// theme pill (bottom:56), watch pill (bottom:96). Asserted, not asserted-about, in
// tests/browser/watchControl.browser.test.ts at a narrow AND a wide viewport on BOTH surfaces.
//
// ── THE SEAM: WHY THIS FILE HOLDS NO CONTROLLER REFERENCE ────────────────────────────────────
//
// The control is rebuilt on EVERY mount; the thing it drives is not. Watch mode is the feature
// whose success causes that re-render, so a controller captured in the click closure would be
// dead by the second update. Every click therefore asks `watchRegistry` for the CURRENT target.
// See `watchRegistry.ts`'s header for how that single holder subsumed task 2.2's.

import {
  getWatchTarget,
  isWatching,
  onWatchChanged,
  watchAvailable,
  watchNote,
} from './watchRegistry';

/** CSS class the reader stylesheet styles (`readerCss.ts`). */
export const WATCH_CONTROL_CLASS = 'peekover-watch';

/** The pulsing status dot — a child span so the pill's state reads visually AND textually. */
export const WATCH_DOT_CLASS = 'peekover-watch__dot';

/** The attribute the HOST carries while a watch is running.
 *
 *  IT LIVES ON THE HOST, NOT ON THE CONTROL, AND THAT IS THE POINT: `mount()` commits its chrome
 *  with `replaceChildren`, which destroys the control on every render — including the renders
 *  watch mode itself causes. State on the host survives that, so CSS and assistive tech both keep
 *  seeing "watching" across an update instead of flickering off once per agent keystroke. */
export const WATCH_HOST_ATTR = 'data-watch';

/** Every control currently on screen. Module-level so ONE subscription keeps them all in sync —
 *  the verbatim `themeControl.ts` / `tocView.ts` pattern. A per-control subscription would leak
 *  one dead listener per re-render, and watch mode re-renders a lot. */
const controls = new Set<HTMLButtonElement>();

/** The host each live control belongs to, so a state sync can rewrite the right host attribute. */
const hosts = new WeakMap<HTMLButtonElement, HTMLElement>();

/** Drop controls no longer in a document (the `pruneThemeHosts` liveness guard, verbatim).
 *  Deleting during Set iteration is safe. */
function pruneControls(): void {
  for (const control of controls) {
    if (!control.isConnected) controls.delete(control);
  }
}

/**
 * Write the CURRENT watch state onto one control and its host.
 *
 * A11Y — THE STATE IS NEVER COLOUR-ONLY, asserted in the browser suite. Three independent
 * carriers, so no user depends on distinguishing green from grey:
 *   1. the VISIBLE TEXT changes ("Watching" / "Watch this file");
 *   2. `aria-pressed` carries the on/off state natively — this genuinely IS a toggle button
 *      (unlike the theme control's three-value cycle, which correctly avoids aria-pressed);
 *   3. `aria-label` names the state AND what activating it will do, the same contract the theme
 *      control's accessible name uses.
 * The dot is decorative and marked `aria-hidden`, so it is never announced twice.
 */
function labelControl(control: HTMLButtonElement, watching: boolean): void {
  const host = hosts.get(control);
  if (host) {
    if (watching) host.setAttribute(WATCH_HOST_ATTR, 'active');
    else host.removeAttribute(WATCH_HOST_ATTR);
  }
  const text = control.querySelector('.peekover-watch__text');
  if (text) text.textContent = watching ? 'Watching' : 'Watch this file';
  control.setAttribute('aria-pressed', String(watching));
  control.setAttribute(
    'aria-label',
    watching
      ? 'Watching this file for changes. Activate to stop watching.'
      : 'Not watching this file. Activate to watch it for changes.',
  );
}

/** Re-label every live control. Pruned first, so a control a re-render dropped is never written
 *  to and never retained. */
function syncControls(): void {
  pruneControls();
  const watching = isWatching();
  for (const control of controls) labelControl(control, watching);
  syncNotes();
}

let subscribed = false;

/** Subscribe ONCE, module-level (see `controls`). */
function ensureSubscribed(): void {
  if (subscribed) return;
  subscribed = true;
  onWatchChanged(syncControls);
}

/**
 * Build the watch control for `host`, or return `null` when this context cannot watch at all.
 *
 * RETURNING NULL IS A DELIBERATE DESIGN POSITION, not a missing branch. A context with no
 * registered target (a focused test, a reader over a document with no file behind it, and the
 * Firefox surfaces task 4.4 covers) must NEVER get a button that looks live and does nothing —
 * spec §4's honesty posture. 4.4 replaces this null with a designed EXPLANATION for the cases
 * where the user would otherwise wonder why watching is missing; until then, absent beats dead.
 *
 * The caller (`mount()`) commits it as a SIBLING of `.peekover-reader`, never inside the reading
 * column — the golden pin cannot see that placement (it snapshots `sanitize(parse(source))`,
 * upstream of `mount()` entirely), so the DOM sibling assertion in the browser suite is the ONLY
 * guard on it.
 */
export function buildWatchControl(host: HTMLElement): HTMLButtonElement | null {
  if (!watchAvailable()) return null;

  const control = document.createElement('button');
  control.type = 'button';
  control.className = WATCH_CONTROL_CLASS;

  // Decorative: the pill's meaning is carried by its text and aria-pressed, so the dot is hidden
  // from assistive tech rather than announced as an unlabelled child.
  const dot = document.createElement('span');
  dot.className = WATCH_DOT_CLASS;
  dot.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'peekover-watch__text';

  control.append(dot, text);

  control.addEventListener('click', () => {
    // THE REGISTRY IS READ HERE, AT CLICK TIME — never captured when this control was built.
    // Swap this lookup for a reference captured in the enclosing scope and the control stops
    // working after the first watch-driven re-render (proven red-first in the browser suite).
    const active = getWatchTarget();
    if (!active) return;
    if (active.isWatching()) active.stop();
    else active.start(host);
    syncControls();
  });

  controls.add(control);
  hosts.set(control, host);
  ensureSubscribed();
  // Render the CURRENT state, not "off": this control may well have been built by a re-render
  // that a running watch itself triggered.
  labelControl(control, isWatching());
  return control;
}

/** The class carrying the update flash (task 4.2). Applied to the CONTROL, never to the document
 *  — see `watchController.ts`'s "DECISION 2" for why the mockup's per-element flash is 006's. */
export const WATCH_FLASH_CLASS = 'is-updated';

/**
 * Fire the brief update signal on `host`'s watch control (task 4.2).
 *
 * Called by the controller AFTER the re-render, which is the only order that works: `mount()`'s
 * `replaceChildren` has just destroyed the control that existed a moment ago, so this necessarily
 * looks the CURRENT one up rather than holding a reference — the same lifetime property the
 * registry exists for, one layer down.
 *
 * Because the element is freshly built, adding the class is enough to play the animation from the
 * start; there is no previous animation state to reset and no reflow-forcing dance needed. The
 * class is left in place: the next update replaces the element entirely, and a control that is
 * never updated again simply keeps a finished (visually inert) animation.
 *
 * Reduced motion needs no branch — the reader's global
 * `:host *{animation-duration:.001ms!important}` rule under `@media (prefers-reduced-motion:reduce)`
 * neutralises this exactly as it neutralises the pulsing dot.
 */
export function signalWatchUpdate(host: HTMLElement): void {
  host.shadowRoot?.querySelector<HTMLElement>(`.${WATCH_CONTROL_CLASS}`)
    ?.classList.add(WATCH_FLASH_CLASS);
}

// --- the designed explanation (tasks 4.3 + 4.4) --------------------------------------

/** CSS class for the plain-language explanation shown when watching died or cannot start. */
export const WATCH_NOTE_CLASS = 'peekover-watch-note';

/** Live note elements, kept in sync by the same single subscription as the controls. */
const notes = new Set<HTMLElement>();

/** Write the current explanation into one note element, hiding it entirely when there is none. */
function labelNote(el: HTMLElement): void {
  const text = watchNote();
  el.textContent = text ?? '';
  // `hidden` rather than a class, so the element is out of the a11y tree too — an empty
  // `role="status"` region that is merely transparent still gets announced by some AT.
  el.hidden = text === null;
}

/** Drop note elements a re-render dropped, then re-write the survivors. */
function syncNotes(): void {
  for (const el of notes) {
    if (!el.isConnected) notes.delete(el);
  }
  for (const el of notes) labelNote(el);
}

/**
 * Build the explanation element (tasks 4.3 + 4.4).
 *
 * `role="status"` — polite, not an assertive alert. A watch that stopped is worth telling the user
 * about, but it is not an emergency and must not interrupt what a screen-reader user is reading.
 * It is a live region, so the 4.3 case (the note arriving with NO re-render, while the last good
 * render stays on screen) is announced when it appears rather than only on next focus.
 */
export function buildWatchNote(): HTMLElement {
  const el = document.createElement('p');
  el.className = WATCH_NOTE_CLASS;
  el.setAttribute('role', 'status');
  notes.add(el);
  ensureSubscribed();
  labelNote(el);
  return el;
}

/**
 * The watch chrome for `host`: the toggle, the explanation, both, or NOTHING.
 *
 * `mount()` calls this once and spreads the result into its `children[]`, so every piece is a
 * SIBLING of `.peekover-reader` and the reading column stays byte-identical. The four states are
 * the honest ones:
 *   • can watch, nothing to explain      → the toggle alone.
 *   • can watch, but something to say    → the toggle AND the note (4.3: a watch that just died on
 *     this file — the toggle stays, because retrying is the user's to choose).
 *   • cannot watch, with a reason        → the note alone (4.4: Firefox). Never a dead button.
 *   • cannot watch, nothing to explain   → nothing at all (a focused test, a reader with no file
 *     behind it). Absent beats inert.
 */
export function buildWatchChrome(host: HTMLElement): Node[] {
  const chrome: Node[] = [];
  const control = buildWatchControl(host);
  if (control) chrome.push(control);
  if (control || watchNote() !== null) chrome.push(buildWatchNote());
  return chrome;
}

/**
 * Test-only: empty the live-control and note sets so suites do not leak into one another.
 *
 * `subscribed` MUST be reset alongside them, and the reason is a bug this very reset caused once:
 * `resetWatchRegistryForTest()` clears the registry's listener SET, but this module's once-guard
 * lives here. Clearing one without the other leaves `subscribed === true` with no listener
 * actually registered — so every control built after the first reset silently never syncs, and a
 * note that should have appeared stays hidden. Reset them together, always.
 */
export function resetWatchControlsForTest(): void {
  controls.clear();
  notes.clear();
  subscribed = false;
}
