// themeControl — the user-facing theme picker (task 5.1) and the SAVE SEAM it writes through.
//
// One builder serves BOTH surfaces: mount() commits it into the reader's shadow root (content
// script full-page AND the app-page {contained} pane, through the single mount() seam), and
// appShell puts the same element in its header (5.2). Positioning differs per surface and lives
// in CSS (readerCss.ts for the shadow root, appShell's APP_CSS for the header); the element,
// its behaviour and its a11y contract are identical, so there is one implementation to reason
// about and no per-surface branching.
//
// ── WHY A MODULE SEAM AND NOT A THREADED PORT (task 5.1, decision D-A) ──────────────────────
//
// tasks.md 5.1 says the port is "threaded through MountOptions". That threading does not exist,
// and adding it would mean changing FIVE signatures across TWO call chains for one callback:
//   content script:  entrypoint -> runReader -> mountReader -> mount -> the control
//   app page:        main -> mountAppShell -> createReaderPane -> mount -> the control
// Group 3 already faced exactly this and chose the other answer: reader.ts owns the current
// setting as module state with `setThemeSetting` as the ONE writer, and each entrypoint calls it
// (see reader.ts's header, and entrypoints/peekover.content.ts's `load().then(setThemeSetting)`).
// Group 4 then deliberately kept the port in the entrypoint rather than plumbing it into mount().
//
// This module mirrors that precedent for the WRITE direction: each context registers its own
// port's `save` ONCE (content script -> messagingPort, app page -> directPort), and the control
// calls the registered sink. mount() and the control never import `store` — the sink is injected
// by whoever owns the context, which is the same dependency-injection property threading would
// have bought, without the signature churn. tasks.md 5.1's "threaded through MountOptions" line
// is corrected to match (same class as the earlier src/store -> src/app path-drift fixes).
//
// A context with NO sink registered (a focused test, a surface not yet wired) still applies the
// theme — the pick just is not persisted. Never a throw on the UI path.
//
// ── HOW THE CONTROL STAYS IN SYNC (decision D-B) ────────────────────────────────────────────
//
// The control is built at MOUNT time, but the persisted setting arrives AFTER that on a cold
// start (group 4's measured behaviour), and on the app page a second control can change it. It
// therefore cannot render its label once and be done, and it cannot read `data-theme` off the
// host either: that attribute is the EFFECTIVE theme, so `auto` on a light OS is indistinguish-
// able from a manual `light`. It asks the runtime (`currentThemeSetting`) and subscribes to
// changes (`onThemeSettingChange`) — both added to reader.ts for this, the one group-3 file
// change 5.1 needs.
//
// Liveness is by construction, not by cleanup: ONE module-level subscription feeds a Set of live
// controls that is pruned by `isConnected` before every sync — the verbatim themeRegistry /
// tocView pattern. mount() rebuilds its chrome on every render (replaceChildren drops the old
// control), so a per-control listener would leak one subscription per re-render; this cannot.

import { setThemeSetting, currentThemeSetting, onThemeSettingChange } from './reader';
import type { Settings, ThemeSetting } from '../settings/settings';

/**
 * The settings the control offers, in cycle order. auto/light/dark ONLY — sepia is DEFERRED
 * from 004 (D-1 = A: design/tokens.css defines only 4 of ~15 sepia tokens, so completing the
 * palette is a brand decision, not an implementation fill). `ThemeSetting` still carries
 * `sepia`, so re-activating it later means adding one entry here and nothing else.
 */
export const THEME_CYCLE: readonly ThemeSetting[] = ['auto', 'light', 'dark'] as const;

/** Human labels for every ThemeSetting — including the deferred `sepia`, so a setting that
 *  somehow arrives from persistence is always displayable rather than rendering blank. */
export const THEME_LABELS: Record<ThemeSetting, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
  sepia: 'Sepia',
};

/**
 * PURE: the next setting in the cycle. The one piece of 5.1 that is real logic rather than DOM,
 * so it is unit-tested in jsdom while everything else is proven in a real engine.
 *
 * A setting OUTSIDE the cycle (today only the deferred `sepia`, which persistence could still
 * hold from a future build) yields the FIRST entry rather than getting stuck: `indexOf` returns
 * -1, so `(-1 + 1) % 3` is 0. That is deliberate — the user can always cycle back out.
 */
export function nextThemeSetting(current: ThemeSetting): ThemeSetting {
  const index = THEME_CYCLE.indexOf(current);
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length];
}

// --- the save seam (D-A) -----------------------------------------------------------

/** What the control needs from a SettingsPort: persist a patch. Deliberately narrower than the
 *  port itself, so a context hands over one function and this module never sees the store. */
export type SaveSettings = (patch: Partial<Settings>) => void;

let saveSink: SaveSettings | null = null;

/**
 * Register the context's persistence sink — called ONCE per context by whoever owns the port:
 * the content script with `messagingPort(...).save`, the app page with `directPort(store).save`.
 * Last registration wins (a context has exactly one settings port). Registering is optional: an
 * unregistered context still applies theme picks, it just does not persist them.
 */
export function registerThemeSaveSink(save: SaveSettings): void {
  saveSink = save;
}

/** Test-only: forget the registered sink so suites do not leak one into another. */
export function resetThemeSaveSinkForTest(): void {
  saveSink = null;
}

// --- the control -------------------------------------------------------------------

/** CSS class both surfaces style (readerCss.ts inside the shadow root, APP_CSS in the header). */
export const THEME_CONTROL_CLASS = 'peekover-theme-toggle';

/** Every control currently on screen. Module-level so ONE subscription keeps them all in sync. */
const controls = new Set<HTMLButtonElement>();

/** Drop controls no longer in a document — the by-construction liveness guard (themeRegistry's
 *  `pruneThemeHosts`, verbatim). Deleting during Set iteration is safe. */
function pruneControls(): void {
  for (const control of controls) {
    if (!control.isConnected) controls.delete(control);
  }
}

/** Write the CURRENT setting onto one control: visible label, and an accessible name that
 *  carries both the current value and what activating it will do. */
function labelControl(control: HTMLButtonElement, setting: ThemeSetting): void {
  const label = THEME_LABELS[setting];
  control.textContent = `Theme: ${label}`;
  // The visible text already names the current value, so the accessible name adds only the
  // ACTION — what a user cannot see from the label alone. aria-pressed / role=radio were both
  // considered and rejected: this is one button cycling three values (the mode-toggle pill's
  // precedent), not a toggle and not a radiogroup, and a real radiogroup would need roving
  // tabindex to be correct ARIA. A <button> whose name states the current selection is
  // keyboard-operable natively, needs no tabindex, and announces the selection on focus.
  control.setAttribute(
    'aria-label',
    `Theme: ${label}. Activate for ${THEME_LABELS[nextThemeSetting(setting)]}.`,
  );
}

/** Re-label every live control. Pruned first, so a control dropped by a re-render is never
 *  written to and is not retained. */
function syncControls(setting: ThemeSetting): void {
  pruneControls();
  for (const control of controls) labelControl(control, setting);
}

let subscribed = false;

/** Subscribe ONCE, module-level. Not per control — mount() rebuilds its chrome every render,
 *  so a per-control subscription would accumulate one dead listener per re-render. */
function ensureSubscribed(): void {
  if (subscribed) return;
  subscribed = true;
  onThemeSettingChange(syncControls);
}

/**
 * Build the theme control: one focusable <button> that cycles auto -> light -> dark, committed
 * by the caller (mount() into the shadow root as a SIBLING of the reading column; appShell into
 * its header). Displays the CURRENT setting immediately and updates itself whenever the setting
 * changes from anywhere — the async cold-start load resolving, or the other surface's control.
 *
 * A click does exactly two things, in this order:
 *   1. `setThemeSetting` — the ONE writer (group 3). Its registry broadcast re-themes every
 *      registered host, so shell + reader move together, instantly, with no reload. This is the
 *      same call the OS-flip listener and the cold-start load make; there is no second code path
 *      that applies a theme.
 *   2. the registered save sink — best-effort persistence. Applying is NOT gated on saving: a
 *      dead background or a storage failure leaves the pick applied for this view.
 */
export function buildThemeControl(): HTMLButtonElement {
  const control = document.createElement('button');
  control.type = 'button';
  control.className = THEME_CONTROL_CLASS;
  control.addEventListener('click', () => {
    const next = nextThemeSetting(currentThemeSetting());
    setThemeSetting(next); // applies + broadcasts + notifies (which re-labels this control)
    saveSink?.({ theme: next }); // best-effort; never gates the visible change
  });
  controls.add(control);
  ensureSubscribed();
  labelControl(control, currentThemeSetting());
  return control;
}

/** Test-only: empty the live-control set so suites do not leak controls into one another. */
export function resetThemeControlsForTest(): void {
  controls.clear();
}
