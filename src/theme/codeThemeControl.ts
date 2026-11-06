// codeThemeControl — the code-theme picker (task 5.2, D-9): a trigger pill + a `role="listbox"`
// popover offering `codeEngine.ts`'s {@link CODE_THEME_IDS} catalog. NOT `themeControl.ts`'s 3-way
// cycle-button shape — structurally unable to hold ≥14 discrete choices — and mirrors
// `diffChrome.ts`'s own pill + `role="listbox"` popover instead (tasks.md 5.2's own named
// precedent). App-page only: mounted once, in `appShell.ts`'s header, beside `themeControl`'s own
// pill. Code highlighting never reaches the content script (§3.8), so this control never does
// either — there is no shadow-root counterpart to style, unlike `themeControl.ts`'s dual surface.
//
// ── WHY EACH ROW IS A NATIVE <button role="option">, NOT A HAND-ROLLED ROVING TABINDEX ─────────
//
// `diffChrome.ts`'s own picker made this choice first, for a reason worth repeating rather than
// re-discovering: a `<button>` is keyboard-operable (Tab reaches it, Enter/Space activates it) for
// free — no custom keydown handling to get wrong, and it lands in the tab order natively. This
// mirrors that, rather than inventing a roving-tabindex listbox for the first time in this
// codebase.
//
// ── PERSIST, THEN REPAINT — IN THAT ORDER (§4's independence + task 5.2's own Verify line) ─────
//
// Selecting a row calls `saveSettings({codeTheme})` (`settingsSeam.ts` — persists AND updates the
// snapshot, best-effort) and ONLY THEN `reapplyCodeTheme(id)` (`codeEnhancer.ts` — repaints every
// already-rendered block on this page). Persisting first means a repaint failure can never leave a
// user's pick unsaved.
//
// ── INDEPENDENCE FROM THE DOCUMENT THEME (§4, proven both directions in the browser suite) ─────
//
// This module touches `settingsSeam.ts`'s `codeTheme` field and `codeEnhancer.ts`'s own code-host
// registry ONLY — never `themeRegistry.ts`, never the `data-theme` attribute, never `reader.ts`'s
// theme runtime. `themeControl.ts` is the same shape in reverse: it never imports this module or
// `codeTheme` either. Two controls, two settings fields, two independent registries.

import { currentSettings, onSettingsChange, saveSettings } from '../settings/settingsSeam';
import { reapplyCodeTheme } from '../render/codeEnhancer';
import { CODE_THEME_IDS, shippedCodeTheme } from '../render/codeEngine';

/** Class on the trigger `<button>` — APP_CSS styles it as a header pill, matching
 *  `themeControl.ts`'s own toggle chrome. */
export const CODE_THEME_CONTROL_CLASS = 'peekover-code-theme-toggle';
/** Class on the `role="listbox"` popover. */
export const CODE_THEME_PICKER_CLASS = 'peekover-code-theme-picker';
/** Class on each `role="option"` row. */
export const CODE_THEME_ITEM_CLASS = 'peekover-code-theme-picker__item';

const ARIA_PICKER_LABEL = 'Code theme';

/**
 * WCAG 2.x contrast ratio between two colours, each `#rgb`/`#rrggbb` (an optional trailing alpha
 * pair, as Shiki's own theme data sometimes carries, is ignored — the ratio is computed against
 * the opaque colour a token actually paints). Relative luminance per the W3C formula; 21 for
 * black-on-white, 1 for identical colours. Pure, so it needs no DOM and no Shiki import — the
 * component `codeThemeControl.test.ts` uses to PIN {@link CODE_THEME_IDS}'s own already-measured
 * bg/fg pairs against the AA 4.5:1 floor (spec §4 a11y: "every code theme meets contrast
 * requirements against its own background").
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const luminance = (hex: string): number => {
    const clean = hex.replace('#', '');
    const six = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.slice(0, 6);
    const channel = (value: number): number => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const r = channel(parseInt(six.slice(0, 2), 16));
    const g = channel(parseInt(six.slice(2, 4), 16));
    const b = channel(parseInt(six.slice(4, 6), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [luminance(hexA), luminance(hexB)].sort((a, b) => a - b);
  return (l2 + 0.05) / (l1 + 0.05);
}

/** `github-dark` → `"Github Dark"` — Shiki's bundled ids are already hyphenated words; title-
 *  casing each segment is all a bundled id needs to read as a name. */
function labelFor(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Every control currently on screen. Module-level so ONE subscription keeps them all in sync —
 *  `themeControl.ts`'s `controls`/`pruneControls`/`ensureSubscribed` pattern, verbatim. */
const controls = new Set<HTMLElement>();

function pruneControls(): void {
  for (const control of controls) {
    if (!control.isConnected) controls.delete(control);
  }
}

/** Re-label one control's trigger and re-mark its selected row for the CURRENT `codeTheme`. */
function syncControl(control: HTMLElement, saved: string): void {
  const codeTheme = shippedCodeTheme(saved); // what is drawn (013 task 7.3a)
  const trigger = control.querySelector<HTMLButtonElement>(`.${CODE_THEME_CONTROL_CLASS}`);
  if (trigger) trigger.textContent = `Code theme: ${labelFor(codeTheme)}`;
  for (const item of control.querySelectorAll<HTMLElement>(`.${CODE_THEME_ITEM_CLASS}`)) {
    item.setAttribute('aria-selected', String(item.dataset.themeId === codeTheme));
  }
}

function syncControls(settings: { codeTheme: string }): void {
  pruneControls();
  for (const control of controls) syncControl(control, settings.codeTheme);
}

let subscribed = false;
function ensureSubscribed(): void {
  if (subscribed) return;
  subscribed = true;
  onSettingsChange(syncControls);
}

/**
 * Build the code-theme control: a trigger pill that opens a `role="listbox"` popover of
 * {@link CODE_THEME_IDS}, committed by the caller (`appShell.ts`'s header — the only mount site;
 * this control never reaches the content script, §3.8). Displays the CURRENT `codeTheme`
 * immediately and updates itself whenever the setting changes — the async cold-start load
 * resolving, or a second control on the same page.
 *
 * Selecting a row: persist (`saveSettings`), repaint every rendered block on this page
 * (`reapplyCodeTheme`), close the popover, re-label the trigger — the module header's "PERSIST,
 * THEN REPAINT" order.
 */
export function buildCodeThemeControl(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'peekover-code-theme-control';
  root.style.position = 'relative';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = CODE_THEME_CONTROL_CLASS;
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'listbox');

  const picker = document.createElement('div');
  picker.className = CODE_THEME_PICKER_CLASS;
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', ARIA_PICKER_LABEL);
  picker.hidden = true;

  function closePicker(): void {
    picker.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  async function pick(id: string): Promise<void> {
    closePicker();
    saveSettings({ codeTheme: id }); // persist first (module header) — best-effort, never gates the visible change
    syncControl(root, id); // apply immediately; the settings echo (if any) is a harmless re-sync
    await reapplyCodeTheme(id); // repaint every rendered block on this page
  }

  // One `role="option"` <button> per id — module header's "native button, no hand-rolled keydown".
  for (const id of CODE_THEME_IDS) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = CODE_THEME_ITEM_CLASS;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.dataset.themeId = id;
    item.textContent = labelFor(id);
    item.addEventListener('click', () => void pick(id));
    picker.append(item);
  }

  trigger.addEventListener('click', () => {
    if (!picker.hidden) return closePicker(); // second click closes an open picker
    picker.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  });

  root.append(trigger, picker);
  controls.add(root);
  ensureSubscribed();
  syncControl(root, currentSettings().codeTheme);
  return root;
}

/** Test-only: empty the live-control set so suites do not leak controls into one another —
 *  `themeControl.ts`'s `resetThemeControlsForTest`, mirrored. */
export function resetCodeThemeControlsForTest(): void {
  controls.clear();
}
