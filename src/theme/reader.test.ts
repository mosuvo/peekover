// @vitest-environment jsdom
//
// The reader theme runtime: the stylesheet carries the tokens (scoped to the shadow
// root, values from design/tokens.css) and the OS color scheme is applied as a
// data-theme attribute on the host. matchMedia is absent in jsdom, so these tests
// stub it to drive the light/dark branch deterministically.

import { readFileSync } from 'node:fs';
import { describe, it, expect, afterEach } from 'vitest';
import {
  buildReaderStyle,
  applyColorScheme,
  initReaderRuntime,
  setThemeSetting,
  currentEffectiveTheme,
  currentThemeSettingForTest,
} from './reader';
import { READER_CSS, CONTAINED_CSS } from './readerCss';
import { TABLE_TOOLBAR_CLASS } from '../render/tableEnhancer';
import { resetThemeHostsForTest } from './themeRegistry';

/** Install a matchMedia stub that reports the given dark-mode preference. */
function stubMatchMedia(dark: boolean): void {
  // Minimal MediaQueryList: enough for prefersDark() + the change listener.
  (window as unknown as { matchMedia: (q: string) => object }).matchMedia = (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

afterEach(() => {
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  // The theme runtime holds the current setting as MODULE state (see reader.ts's header on
  // why it lives there until the port arrives in 4.2/5.1), so a test that changes it would
  // otherwise leak into the next one. Reset both it and the host registry.
  setThemeSetting('auto');
  resetThemeHostsForTest();
  document.body.replaceChildren();
});

describe('reader theme — stylesheet + tokens', () => {
  it('builds a <style> carrying tokens scoped to :host (not the page)', () => {
    const style = buildReaderStyle();
    expect(style.tagName).toBe('STYLE');
    const css = style.textContent ?? '';
    // Scoped to the shadow root, never :root / the host page.
    expect(css).toContain(':host');
    expect(css).not.toContain(':root');
    // Light + dark token values, verbatim from design/tokens.css.
    expect(css).toContain('--paper:#FBFBF8');
    expect(css).toContain('--ink:#16171F');
    expect(css).toContain('--paper:#12141C'); // dark paper
    expect(css).toContain('--ink:#EAEBF3'); // dark ink
    // Reader typography: Literata body + the 76ch column.
    expect(css).toContain('Literata');
    expect(css).toContain('76ch');
  });

  it('keeps on-highlighter text as a literal hex, never var(--ink) (trap guard)', () => {
    const css = buildReaderStyle().textContent ?? '';
    // mark uses a literal dark hex so it stays legible on yellow in dark mode.
    expect(css).toMatch(/mark\{background:var\(--hl\);color:#26210a/);
  });
});

// ── 008 task 3.3: the table-tools toolbar's presentation ──────────────────────────────────────
//
// The toolbar host is `tableEnhancer`'s (3.2) and is EMPTY until 3.6-3.8 fill it; what is asserted
// here is the CONTAINER's styling and the two properties D-12 puts on it. Both are string-level
// properties of the SHIPPED sheet, which is why they are unit assertions: the RESOLVED values —
// the toolbar's computed `max-width` (row 6) and its rect containment (row 5) — are jsdom-blind and
// are 3.5's, in a real engine at both geometry widths.

/** Declarations of a `{ … }` block, parsed out of the shipped sheet by its selector. */
function declarationsOf(selectorWithBrace: string, sheet: string = READER_CSS): Record<string, string> {
  const at = sheet.indexOf(selectorWithBrace);
  if (at < 0) throw new Error(`no such rule in the shipped sheet: ${selectorWithBrace}`);
  const body = sheet.slice(at + selectorWithBrace.length, sheet.indexOf('}', at));
  const out: Record<string, string> = {};
  for (const decl of body.split(';')) {
    const colon = decl.indexOf(':');
    if (colon > 0) out[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim();
  }
  return out;
}

const LIGHT = declarationsOf(':host{');
const DARK = declarationsOf(':host([data-theme="dark"]){');
const SEPIA = declarationsOf(':host([data-theme="sepia"]){');

/** A token's value in each theme: an unlisted override INHERITS the light block (D-12). */
function resolveInEveryTheme(token: string): { light?: string; dark?: string; sepia?: string } {
  return {
    light: LIGHT[token],
    dark: DARK[token] ?? LIGHT[token],
    sepia: SEPIA[token] ?? LIGHT[token],
  };
}

/** Both toolbar rules as shipped — the host's own block plus the adjacency rule that follows it. */
const TOOLBAR_RULES = (() => {
  const start = READER_CSS.indexOf(`.peekover-reader .${TABLE_TOOLBAR_CLASS}{`);
  return start < 0 ? '' : READER_CSS.slice(start, READER_CSS.indexOf('\n\n', start));
})();

describe('reader theme — the table-tools toolbar (008 task 3.3, D-12)', () => {
  it('styles tableEnhancer’s own host class, in READER_CSS so BOTH surfaces carry it', () => {
    // The selector is bound to the module constant, not transcribed: 3.2 exports the class the
    // enhancer actually writes, and a rename on either side reds this rather than going silent.
    expect(TABLE_TOOLBAR_CLASS).toBe('peekover-table-tools');
    expect(READER_CSS).toContain(`.peekover-reader .${TABLE_TOOLBAR_CLASS}{`);
    // ★ THE SHEET CHOICE IS THE ASSERTION. The toolbar lives INSIDE .peekover-reader, and D-6
    // gives the enhancer four call sites — 1-2 app page (3.4), 3-4 content script (4.1). A
    // CONTAINED_CSS-only rule (2.4's answer for the picker's D-14 chrome, two blocks below) would
    // leave the content-script reader's toolbar unstyled from 4.1 onward.
    expect(CONTAINED_CSS).not.toContain(TABLE_TOOLBAR_CLASS);
  });

  it('makes its declared spacing true against the bare <table>, without editing the table rule', () => {
    // No .tablewrap exists (D-12): the toolbar is a PRECEDING SIBLING, so the 8px would collapse
    // into the table's own 22px top margin. Specificity (0,2,1) beats (0,1,1) — not source order.
    expect(TOOLBAR_RULES).toContain('margin:22px 0 8px');
    expect(READER_CSS).toContain(`.peekover-reader .${TABLE_TOOLBAR_CLASS} + table{margin-top:0}`);
    // The table's own rule is untouched: a table with no toolbar keeps its 22px byte-for-byte.
    expect(declarationsOf('.peekover-reader table{').margin).toBe('22px 0');
  });

  it('takes its colour ONLY from tokens that resolve in all three theme blocks', () => {
    const used = [...new Set([...TOOLBAR_RULES.matchAll(/var\((--[a-z-]+)\)/g)].map((m) => m[1]))];
    expect(used).toEqual(['--sans', '--muted']);
    // ★ Each token NAMED WITH ITS RESOLUTION in all three blocks (D-12's standing check), written
    // out rather than computed twice — a token whose value moves in any theme reds this.
    // RE-SPELLED at 013 task 2.4 (plan D-3's long stack), and again at 5.10 (the human's ruling R1: the
    // short stack, D-3 amended). Property kept: it resolves to ONE value, the same in all three theme blocks.
    const SANS = '"Bricolage Grotesque",system-ui,sans-serif';
    expect(Object.fromEntries(used.map((t) => [t, resolveInEveryTheme(t)]))).toEqual({
      '--sans': { light: SANS, dark: SANS, sepia: SANS },
      '--muted': { light: '#5D6070', dark: '#A0A4B8', sepia: '#5D6070' },
    });
  });

  it('hard-codes no colour — and the matcher that says so FIRES on this same sheet', () => {
    const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;
    expect(TOOLBAR_RULES).not.toMatch(LITERAL_COLOUR);
    // The control (finding 1): the sheet DOES carry literal colours — the trap-guard hexes on the
    // highlighter — so a green above is an absence the instrument could have seen.
    expect(READER_CSS).toMatch(LITERAL_COLOUR);
  });

  it('sepia overrides ONLY four tokens, so --muted is the LIGHT ink on sepia paper (D-12)', () => {
    expect(Object.keys(SEPIA)).toEqual(['--paper', '--ink', '--accent', '--accent-soft']);
    expect(SEPIA['--muted']).toBeUndefined();
    expect(resolveInEveryTheme('--muted').sepia).toBe(LIGHT['--muted']);
    // …and the toolbar declares no surface at all, which is why that reading costs it nothing:
    // --panel (#F4F4EF) on sepia paper (#F6EEDF) is a 2/2/16 delta. Stated, never swapped.
    expect(TOOLBAR_RULES).not.toContain('background');
    expect(TOOLBAR_RULES).not.toContain('border');
  });

  it('uses no `ch` in a layout-blocking property, and declares no max-width of its own', () => {
    const CH_UNIT = /\d(?:\.\d+)?ch\b/;
    for (const prop of ['margin', 'padding', 'transform']) {
      expect(declarationsOf(`.peekover-reader .${TABLE_TOOLBAR_CLASS}{`)[prop] ?? '').not.toMatch(CH_UNIT);
    }
    expect(TOOLBAR_RULES).not.toMatch(CH_UNIT);
    // The control: `ch` IS present in this sheet (the free `max-width` case), so the matcher fires.
    expect(READER_CSS).toMatch(CH_UNIT);
    // Row 6 is DECLARED here by absence and ASSERTED at 3.5 as a computed style: the toolbar is a
    // child of the column, so --reader-measure already governs it. A second site for the same
    // number is the coupling readerCss.ts argues against.
    expect(TOOLBAR_RULES).not.toContain('max-width');
    expect(READER_CSS).toContain('--reader-measure:748px');
  });

  it('keeps its rationale OUT of the shipped literal — a byte check, not a reminder (finding 9)', () => {
    const HEADING = 'THE TABLE-TOOLS TOOLBAR — 008 §3.11, task 3.3 (D-12)';
    // Read from disk, repo-relative (vitest runs from the project root): the claim is about the
    // MODULE's bytes versus the EXPORTED string's, so the module cannot be the thing that reports it.
    const source = readFileSync('src/theme/readerCss.ts', 'utf8');
    const start = source.indexOf(HEADING);
    expect(start).toBeGreaterThan(0);
    // The rationale block runs to the next banner. Its SIZE is the control: there is real prose
    // here that would have shipped to both surfaces had it been written beside the rule.
    const closingBanner = source.indexOf('\n// ====', start + HEADING.length); // the heading's own
    const rationale = source.slice(start, source.indexOf('\n// ====', closingBanner + 8));
    expect(rationale.length).toBeGreaterThan(1500);
    for (const line of rationale.split('\n').map((l) => l.replace(/^\/\/ ?/, '').trim())) {
      if (line.length > 40) expect(READER_CSS).not.toContain(line);
    }
    // What DOES ship is one pointer line, and its size is pinned rather than trusted.
    const shipped = [...READER_CSS.matchAll(/\/\*[\s\S]*?\*\//g)]
      .map((m) => m[0])
      .filter((c) => c.includes('task 3.3'));
    expect(shipped).toHaveLength(1);
    expect(shipped[0].length).toBeLessThanOrEqual(110);
  });
});

describe('reader theme — auto light/dark from OS', () => {
  it('sets data-theme=light when the OS is not dark', () => {
    stubMatchMedia(false);
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('light');
  });

  it('sets data-theme=dark when the OS prefers dark', () => {
    stubMatchMedia(true);
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('dark');
  });

  it('defaults to light and never throws where matchMedia is absent', () => {
    const host = document.createElement('peekover-root');
    expect(() => applyColorScheme(host)).not.toThrow();
    expect(host.getAttribute('data-theme')).toBe('light');
  });

  it('initReaderRuntime wires fonts + theme without throwing', () => {
    stubMatchMedia(true);
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    expect(() => initReaderRuntime(host)).not.toThrow();
    expect(host.getAttribute('data-theme')).toBe('dark');
  });
});

// The 004 addition: the theme is the SETTING resolved against the OS, not the OS alone. The
// OS-flip half of this is jsdom-blind (a page cannot fake `prefers-color-scheme`) and is proven
// against a REAL emulated OS flip in tests/browser/themeRuntime.browser.test.ts; what is
// asserted here is the pure resolution + broadcast wiring.
describe('reader theme — setting resolved against the OS (004)', () => {
  it('defaults to the auto setting, so M1 OS-driven behavior is preserved', () => {
    stubMatchMedia(true);
    expect(currentThemeSettingForTest()).toBe('auto');
    expect(currentEffectiveTheme()).toBe('dark'); // auto follows the OS
  });

  it('a manual setting pins the effective theme against the OS', () => {
    stubMatchMedia(true); // OS says dark...
    setThemeSetting('light'); // ...user says light
    expect(currentEffectiveTheme()).toBe('light');
  });

  it('setThemeSetting re-themes every registered host at once (shell + reader coherence)', () => {
    stubMatchMedia(false);
    const reader = document.createElement('peekover-root');
    const shell = document.createElement('div'); // stands in for the .peekover-app shell root
    document.body.append(reader, shell);
    initReaderRuntime(reader);
    // The shell root registers itself in mountAppShell (3.3); register it directly here.
    initReaderRuntime(shell);
    expect(reader.getAttribute('data-theme')).toBe('light');

    setThemeSetting('dark');

    expect(reader.getAttribute('data-theme')).toBe('dark');
    expect(shell.getAttribute('data-theme')).toBe('dark');
  });

  it('applyColorScheme on a fresh host reflects the manual setting, not the OS', () => {
    stubMatchMedia(true);
    setThemeSetting('light');
    const host = document.createElement('peekover-root');
    applyColorScheme(host);
    expect(host.getAttribute('data-theme')).toBe('light');
  });
});
