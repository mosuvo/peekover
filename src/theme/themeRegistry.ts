// themeRegistry — the set of live THEMED HOSTS and the one `applyTheme` broadcast that
// writes `data-theme` on all of them (plan §1.3, spec §3.4).
//
// WHY A REGISTRY AT ALL. Until 004 the theme runtime re-themed by DOM query —
// `document.querySelectorAll('peekover-root')` inside reader.ts's OS-flip listener. That
// finds only the full-page content-script host: it misses the app page entirely, whose
// reader pane host is a plain `<div>` and whose shell root is a light-DOM `.peekover-app`
// element. So on the app page an OS flip re-themed nothing — the §3.4 stale-host bug. A
// host REGISTERS itself here instead, so "every themed surface" is an explicit set rather
// than a tag-name guess, and one `applyTheme` keeps shell + reader coherent (no half-themed
// screen).
//
// WHY THE PRUNE IS BY CONSTRUCTION. A Set of DOM nodes is a leak and a correctness hazard:
// readers unmount, panes re-render, and a detached node kept in the set is both retained
// memory and a silent write target. Every broadcast therefore prunes `!isConnected` entries
// FIRST — a verbatim mirror of tocView.ts's `tocHosts` pattern (deleting during Set
// iteration is safe; removed entries are simply not revisited). This is the liveness guard
// as a property of the code path, not a cleanup call someone must remember — the 5x-recurrence
// retro rule.
//
// Deliberately dependency-light: this module knows about DOM elements and the settings
// vocabulary, nothing else. reader.ts (shadow hosts, fonts, CSS) and appShell.ts (the shell
// root) both import it WITHOUT importing each other — notably the app shell does not pull in
// READER_CSS or the font loader just to be themeable.

import type { EffectiveTheme } from '../settings/settings';

/** The attribute every themed surface keys its token overrides off — `readerCss.ts`'s
 *  `:host([data-theme=…])` blocks and `appShell.ts`'s `.peekover-app[data-theme=…]` rules. */
export const THEME_ATTR = 'data-theme';

/** Every host currently claiming to be themed. Module-level (not per-call), so the OS-flip
 *  listener and the settings writer broadcast to the same set. */
const themeHosts = new Set<HTMLElement>();

/**
 * Register a host as a themed surface. Called by `initReaderRuntime` for each reader host
 * (full-page shadow host AND the contained app-page pane host) and by `mountAppShell` for
 * the light-DOM shell root. Idempotent — a Set, so a re-render re-registering the same host
 * is a no-op rather than a duplicate write.
 */
export function registerThemeHost(host: HTMLElement): void {
  themeHosts.add(host);
}

/** Drop a host from the registry. Rarely needed explicitly — the `isConnected` prune handles
 *  the normal unmount path — but exported so a caller that KNOWS a host is finished (while it
 *  is still connected) can say so. Safe for an unregistered host. */
export function unregisterThemeHost(host: HTMLElement): void {
  themeHosts.delete(host);
}

/** Drop every host no longer in the document. Runs before each broadcast so a dead node can
 *  never be written to (and is never retained). Deleting during Set iteration is safe. */
function pruneThemeHosts(): void {
  for (const host of themeHosts) {
    if (!host.isConnected) themeHosts.delete(host);
  }
}

/**
 * Listeners notified whenever the EFFECTIVE theme is broadcast (007 D-7). Beside `themeHosts`
 * deliberately: a surface whose content must be REBUILT for a new theme cannot be served by an
 * attribute write, and this is the one place that knows a broadcast happened.
 *
 * ── WHY HERE AND NOT `reader.ts`'s `onThemeSettingChange` ─────────────────────────────────────
 *
 * That is the obvious seam and it is the wrong one, for the reason its own doc comment gives
 * (`reader.ts:108-112`): *an OS flip under `auto` changes what paints but NOT what the user
 * picked, so it deliberately does not notify.* That is correct for a theme CONTROL — "Auto"
 * stays "Auto" across an OS flip — and wrong for anything that renders a picture, because the
 * picture did change. `DEFAULT_SETTINGS.theme` is `'auto'` (`settings.ts:39`), so a subscriber
 * on the setting channel would go stale on an OS dark-mode flip IN THE DEFAULT CONFIGURATION —
 * the most likely way a user meets the feature at all.
 *
 * `applyTheme` is the one broadcast BOTH paths go through — the setting writer (`reader.ts:89`)
 * and the OS-flip listener (`reader.ts:157`) — so a subscriber here cannot miss a change that
 * repaints the page. `tests/browser/diagramTheme.browser.test.ts` pins that distinction by
 * reverting to the setting channel and requiring the flip to go red.
 *
 * Listeners get the EFFECTIVE theme that was just applied, not a setting and not a "read it
 * back yourself": a subscriber that re-derives the theme from module state is a second source
 * of truth that can disagree with what these hosts now carry.
 */
const effectiveListeners = new Set<(effective: EffectiveTheme) => void>();

/**
 * Subscribe to effective-theme broadcasts. Returns an unsubscribe.
 *
 * Liveness is the SUBSCRIBER's, by the same `isConnected` discipline this module applies to its
 * own hosts: a listener that outlives one render subscribes ONCE and prunes its own dead targets
 * on each notification (`themeControl.ts:117-123`'s pattern, itself a copy of `pruneThemeHosts`).
 * A listener-per-view would be the leak the host prune exists to prevent, one level up.
 */
export function onEffectiveThemeChange(listener: (effective: EffectiveTheme) => void): () => void {
  effectiveListeners.add(listener);
  return () => effectiveListeners.delete(listener);
}

/**
 * Write the given CONCRETE theme onto every registered, still-connected host — the single
 * broadcast every theme change goes through (OS flip under Auto, and from 4.x/5.x the user
 * picking a theme). Takes an {@link EffectiveTheme}, never a setting: `auto` is resolved by
 * the caller via `resolveTheme`, so nothing downstream of here has to know about the OS.
 *
 * ADDITIVE as of 007 D-7: the attribute writes above are untouched, and the notification is
 * strictly after them — so a listener that reads the DOM (or re-renders against it) sees the
 * theme that is already applied, never the one being replaced. The pre-existing behaviour is
 * pinned by the tests that predate the listener.
 */
export function applyTheme(effective: EffectiveTheme): void {
  pruneThemeHosts();
  for (const host of themeHosts) {
    host.setAttribute(THEME_ATTR, effective);
  }
  // AFTER the writes — see above. Listeners are notified on every broadcast, including one that
  // re-applies the same theme; deciding whether that is a no-op is the subscriber's, because only
  // it knows what its own surfaces currently show.
  for (const listener of effectiveListeners) listener(effective);
}

/** Test-only: the number of hosts currently registered (after pruning). Lets a test assert the
 *  prune actually SHRANK the set, not merely that a dead node kept a stale attribute value. */
export function themeHostCountForTest(): number {
  pruneThemeHosts();
  return themeHosts.size;
}

/** Test-only: empty the registry so suites don't leak hosts into one another. */
export function resetThemeHostsForTest(): void {
  themeHosts.clear();
}

/** Test-only: drop every effective-theme subscriber, so a suite that installs one does not leave
 *  it re-rendering into a later suite's document. Same purpose as {@link resetThemeHostsForTest}. */
export function resetEffectiveThemeListenersForTest(): void {
  effectiveListeners.clear();
}
