// reader (theme runtime) — the side-effecting glue that turns a bare shadow root
// into the themed Peekover reading surface. Three jobs, all idempotent so mount()
// can call them on every (re-)render:
//
//   - buildReaderStyle(): a fresh <style> carrying READER_CSS. mount() commits the
//     shadow root with replaceChildren(), which drops ALL children including a prior
//     <style>, so the stylesheet is rebuilt and re-committed each render (the CSS
//     string is static and tiny — cheaper than diffing).
//   - registerReaderFonts(): loads Literata once into document.fonts (see ./fonts).
//   - applyColorScheme() / watch: M1's ACTIVE theme mechanism — auto light/dark from
//     the OS `prefers-color-scheme`, expressed as a `data-theme` attribute on the
//     host that ./readerCss.ts keys its token overrides off. A single media-query
//     listener keeps every mounted reader in sync when the OS theme flips live.
//
// Everything degrades cleanly where a browser API is missing (jsdom under tests, old
// engines): fonts and the media watch become no-ops and the theme defaults to light,
// so the render path never throws (AGENTS.md #5).

import { READER_CSS } from './readerCss';
import { registerReaderFonts } from './fonts';

const HOST_TAG = 'peekover-root';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** A fresh <style> element carrying the reader stylesheet. */
export function buildReaderStyle(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = READER_CSS;
  return style;
}

/** True when the OS prefers a dark color scheme. Safe where matchMedia is absent. */
function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Set the host's `data-theme` to match the OS color scheme. In M1 only light/dark
 * are produced here (sepia stays a dormant, defined-but-unselected theme until the
 * settings milestone). readerCss.ts keys its dark token overrides off this attribute.
 */
export function applyColorScheme(host: HTMLElement): void {
  host.setAttribute('data-theme', prefersDark() ? 'dark' : 'light');
}

let watching = false;

/**
 * Register a single OS color-scheme listener that re-themes every mounted reader
 * when the system flips light<->dark, so an open reader updates without a reload.
 * Idempotent and a no-op where matchMedia is unavailable.
 */
function watchColorScheme(): void {
  if (watching) return;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  watching = true;
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', (e) => {
    const theme = e.matches ? 'dark' : 'light';
    for (const host of document.querySelectorAll(HOST_TAG)) {
      host.setAttribute('data-theme', theme);
    }
  });
}

/**
 * Apply the reader's runtime concerns to a freshly (re-)mounted host: load fonts,
 * set the current theme, and start watching for OS theme changes. Safe to call on
 * every render — each piece guards against double-work.
 */
export function initReaderRuntime(host: HTMLElement): void {
  registerReaderFonts();
  applyColorScheme(host);
  watchColorScheme();
}
