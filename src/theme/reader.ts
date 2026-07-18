// reader (theme runtime) — the side-effecting glue that turns a bare shadow root
// into the themed Peekover reading surface. Three jobs, all idempotent so mount()
// can call them on every (re-)render:
//
//   - buildReaderStyle(): a fresh <style> carrying READER_CSS. mount() commits the
//     shadow root with replaceChildren(), which drops ALL children including a prior
//     <style>, so the stylesheet is rebuilt and re-committed each render (the CSS
//     string is static and tiny — cheaper than diffing).
//   - registerReaderFonts(): loads Literata once into document.fonts (see ./fonts).
//   - the THEME: resolve the current setting to a concrete theme and write it as a
//     `data-theme` attribute that ./readerCss.ts keys its token overrides off. A single
//     media-query listener keeps every registered surface in sync when the OS flips.
//
// WHAT 004 CHANGED HERE (spec §3.4, plan §1.3). Two things:
//
//   1. The broadcast target. M1's OS-flip listener re-themed via
//      `document.querySelectorAll('peekover-root')` — a tag-name query that finds ONLY the
//      full-page content-script host. The app page's reader pane host is a plain <div> and
//      its shell root is a light-DOM `.peekover-app` element, so neither was ever re-themed:
//      an OS flip left an open app-page reader stale. The broadcast now goes through
//      ./themeRegistry, whose members REGISTER themselves — so every themed surface is in
//      the set by construction, and one write keeps shell + reader coherent.
//
//   2. Theme = setting resolved against the OS, not the OS alone. M1 had no persisted
//      preference, so "the theme" WAS `prefers-color-scheme`. 004 adds a user setting, so
//      the OS is only consulted under `auto`; a manual light/dark PINS the theme and an OS
//      flip must be ignored (the spec §4 "manual wins over auto" rule).
//
// WHERE THE SETTING COMES FROM (and why it is a module-level value). The SettingsPort is
// NOT threaded into the render path until tasks 4.2/5.1 — mount() has no port to hand us
// yet, and reaching for one here would mean editing a later group's files. So the runtime
// owns the current setting as module state, defaulting to `auto`, with `setThemeSetting()`
// as the ONE writer. Groups 4/5 call that setter from the port (on `load()` resolving and
// on the user picking a theme); until then the default `auto` makes this behaviourally
// identical to M1's OS-driven theming, so nothing regresses. This module deliberately does
// NOT import the port or the store — it stays surface-agnostic and jsdom-testable.
//
// Everything degrades cleanly where a browser API is missing (jsdom under tests, old
// engines): fonts and the media watch become no-ops and the theme defaults to light,
// so the render path never throws (AGENTS.md #5).

import { READER_CSS } from './readerCss';
import { registerReaderFonts } from './fonts';
import { applyTheme, registerThemeHost } from './themeRegistry';
import {
  resolveTheme,
  DEFAULT_SETTINGS,
  type EffectiveTheme,
  type ThemeSetting,
} from '../settings/settings';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** A fresh <style> element carrying the reader stylesheet. */
export function buildReaderStyle(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = READER_CSS;
  return style;
}

/** True when the OS prefers a dark color scheme. Safe where matchMedia is absent (jsdom, old
 *  engines) — absent means "not dark", so the theme degrades to light rather than throwing. */
function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * The current theme SETTING — what the user picked ({@link ThemeSetting}), not what paints.
 * Module-level and defaulting to `auto` (see the header note on why it lives here and not
 * behind the port yet).
 */
let currentSetting: ThemeSetting = DEFAULT_SETTINGS.theme;

/** The concrete theme that should be painting right now: the current setting resolved against
 *  the live OS preference. `auto` follows the OS; a manual setting ignores it entirely. */
export function currentEffectiveTheme(): EffectiveTheme {
  return resolveTheme(currentSetting, prefersDark());
}

/**
 * Set the current theme setting and re-theme every registered host immediately. THE one writer
 * of `currentSetting` — groups 4/5 call this from the SettingsPort (when `load()` resolves and
 * when the user picks a theme); tests drive it directly. Broadcasting here is what makes a
 * manual pick apply to shell + reader together, with no reload.
 */
export function setThemeSetting(setting: ThemeSetting): void {
  currentSetting = setting;
  applyTheme(currentEffectiveTheme());
  // Notify AFTER the broadcast, so any listener that reads the DOM sees the applied theme.
  for (const listener of settingListeners) listener(setting);
}

/**
 * Read back the current theme SETTING without resolving it — what the user picked, not what
 * paints. Task 5.1 promoted this from test-only to public, and the reason is a real constraint:
 * a settings CONTROL must display the setting, and `data-theme` on a host cannot tell it apart.
 * `data-theme` carries the EFFECTIVE theme, so `auto` on a light OS and a manual `light` both
 * read `light` there — indistinguishable. The control therefore has to ask the runtime.
 */
export function currentThemeSetting(): ThemeSetting {
  return currentSetting;
}

/** Test-only alias kept so `reader.test.ts` reads as it did before 5.1 promoted the getter. */
export const currentThemeSettingForTest = currentThemeSetting;

/**
 * Listeners notified whenever the SETTING changes (task 5.1). Not the effective theme: an OS
 * flip under `auto` changes what paints but NOT what the user picked, so it deliberately does
 * not notify — a control showing "Auto" stays correct across an OS flip.
 *
 * Why this exists: a theme control is built at mount time, but the persisted setting arrives
 * AFTER that on a cold start (group 4's measured behaviour — the entrypoint's
 * `load().then(setThemeSetting)`), and on the app page a SECOND control (5.2) can change it.
 * Both are `setThemeSetting` calls, so one notification point keeps every control in sync with
 * no per-surface wiring.
 */
const settingListeners = new Set<(setting: ThemeSetting) => void>();

/** Subscribe to setting changes. Returns an unsubscribe. Callers that outlive a render must
 *  prune themselves — see themeControl.ts, which subscribes ONCE and prunes dead controls by
 *  `isConnected` (the themeRegistry liveness pattern) rather than adding a listener per view. */
export function onThemeSettingChange(listener: (setting: ThemeSetting) => void): () => void {
  settingListeners.add(listener);
  return () => settingListeners.delete(listener);
}

/**
 * Write the currently-resolved theme onto one host. Named for continuity with M1, but it now
 * applies the RESOLVED SETTING rather than the raw OS preference — under the default `auto`
 * setting those are the same value, which is why the M1 behavior is preserved exactly.
 */
export function applyColorScheme(host: HTMLElement): void {
  host.setAttribute('data-theme', currentEffectiveTheme());
}

let watching = false;

/**
 * Register a single OS color-scheme listener that re-themes every REGISTERED host when the
 * system flips light<->dark, so an open reader updates without a reload. Idempotent and a
 * no-op where matchMedia is unavailable.
 *
 * The listener re-resolves ONLY under `auto`: a manual light/dark is a deliberate override of
 * the OS, so an OS flip beneath it must change nothing (spec §4). Note the guard reads
 * `currentSetting` at EVENT time, not at registration time — the setting can change while this
 * listener is installed, and the freshest value is the one that decides.
 */
function watchColorScheme(): void {
  if (watching) return;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  watching = true;
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', (e) => {
    if (currentSetting !== 'auto') return; // manual pins the theme — the OS does not win
    applyTheme(resolveTheme(currentSetting, e.matches));
  });
}

/**
 * Test-only: forget that the OS listener was installed, so the next `initReaderRuntime` installs
 * a fresh one.
 *
 * TEST ISOLATION, not a workaround for a product limitation. The listener installed here handles
 * REPEATED flips for as long as the page lives — proven on both engines by the "ONE listener,
 * MANY flips" test in tests/browser/themeRuntime.browser.test.ts, which flips the emulated OS
 * twice against a single install and requires both to land. (That test is non-vacuous: making the
 * handler remove itself after one fire turns it red on Chromium AND Firefox.) So production's
 * once-per-page install is sound and needs no reset.
 *
 * What this seam is actually for is the TEST BOUNDARY. Measured with the seam disabled: a
 * listener installed in one Vitest test stops receiving emulated flips in LATER tests, so those
 * tests fail on their first flip. The cause is internal to Playwright's `emulateMedia` override
 * lifecycle across tests and is NOT pinned; two hypotheses were probed and both DISPROVED —
 * GC of the MediaQueryList (holding a strong reference did not help) and the `emulateMedia(null)`
 * teardown in `afterEach` (removing it did not help). Nothing production does resembles this: a
 * real page has one media state that changes, never an override swapped out from under it.
 * Re-installing per test gives each test a live listener. Same family of seam as store.ts's
 * `__resetConnectionForTest`.
 */
export function resetThemeWatchForTest(): void {
  watching = false;
}

/**
 * Apply the reader's runtime concerns to a freshly (re-)mounted host: load fonts, register the
 * host as a themed surface, set the current theme, and start watching for OS theme changes.
 * Safe to call on every render — each piece guards against double-work (the registry is a Set,
 * the font load and the media watch are once-only).
 *
 * Signature is UNCHANGED from M1 (`host` only, no port): mount() calls this on both surfaces
 * and needs no edit for group 3. The settings port arrives in 4.2/5.1 via `setThemeSetting`.
 */
export function initReaderRuntime(host: HTMLElement): void {
  registerReaderFonts();
  registerThemeHost(host);
  applyColorScheme(host);
  watchColorScheme();
}
