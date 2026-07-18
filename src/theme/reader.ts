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
}

/** Test-only: read back the current setting without resolving it. */
export function currentThemeSettingForTest(): ThemeSetting {
  return currentSetting;
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
 * This exists for a HARNESS limitation, not a product one. A page normally installs this
 * listener once and keeps it for its lifetime — which is exactly what production does and what
 * the 8.1 human gate exercises. But the browser suite emulates many OS flips within ONE page
 * (Playwright `page.emulateMedia`), and a MediaQueryList created inside a test callback was
 * measured to receive only the FIRST subsequent change before going silent, while a
 * module-scope one kept receiving them (Chromium; diagnosed with fire-counters — see
 * tests/browser/themeRuntime.browser.test.ts). Re-installing per test sidesteps that quirk so
 * each test observes a live listener. Same family of seam as store.ts's
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
