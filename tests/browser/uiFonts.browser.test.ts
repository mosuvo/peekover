// THE DESIGN FACES, PER SURFACE (013 task 2.4; plan D-2, D-3; gate-1 Q3 / Q10).
//
// App page: Bricolage Grotesque (400 / 600 / 700) and Sometype Mono (400 / 500) are registered from
// the package and LOADED; the shell's chrome is set in Bricolage, code in Sometype, prose in
// Literata. Content-script reader: neither face is registered, so its chrome and code fall through
// to system faces, and its prose keeps Literata.
//
// ★ THE USED FACE, NOT THE DECLARED ONE. Computed `font-family` only echoes the declared stack. What
// a surface actually draws is read by width: text set in the element's own stack against the same
// text set in that stack WITHOUT its first family. Equal widths = the first family is not in use
// (the browser fell through); different widths = it is. Measured on both engines at task 2.4: the
// design faces and the system faces (DejaVu under the CI font set) differ by tens of pixels on the
// probe string.
//
// ★ ORDER IS LOAD-BEARING, AND GUARDED. `document.fonts` is shared by every test in this file (one
// page per file — AGENTS.md: the font set does not carry BETWEEN files). Once the app page has
// registered the faces, a content-script reader in the same document would use them too, which the
// shipped content script never can (it runs in a page where uiFonts.ts never ran —
// uiFontsImportFence.test.ts). So the content-script block runs FIRST and asserts its precondition:
// no Bricolage / Sometype face in document.fonts.
//
// The harness cannot load file:// or a raw host's origin; it runs the content-script orchestration
// (`runReader` → mount) on the runner's page, the same path both surfaces take — the font question
// does not depend on the URL (fonts are registered by module reach, not by host).

import { describe, it, expect, afterEach } from 'vitest';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { UI_FONT_FACES, UI_MONO_FAMILY, UI_SANS_FAMILY } from '../../src/theme/uiFonts';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

const DOC = '# Fonts\n\nA paragraph of reading text, set in the serif.\n\n```js\nconst answer = 42;\n```\n';
const PROBE_TEXT = 'Hamburgefonstiv HAMBURGEFONSTIV 0123456789 quick brown fox';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

/** The faces in document.fonts for `family` (Firefox quotes multi-word family names). */
const facesOf = (family: string): FontFace[] =>
  [...document.fonts].filter((f) => f.family.replace(/^["']|["']$/g, '') === family);

/** The first family of a computed stack, unquoted. */
const firstFamily = (stack: string): string => stack.split(',')[0].trim().replace(/^["']|["']$/g, '');

/**
 * Is `el`'s FIRST declared family the face it draws? Width of the probe in the element's own font
 * against the same font minus that first family, both measured in the element's own tree (so the
 * same document.fonts and the same shadow scope apply).
 */
function drawsFirstFamily(el: Element): { family: string; uses: boolean; full: number; without: number } {
  const cs = getComputedStyle(el);
  const stack = cs.fontFamily;
  const rest = stack.split(',').slice(1).join(',');
  const measure = (family: string): number => {
    const span = document.createElement('span');
    span.textContent = PROBE_TEXT;
    span.style.cssText =
      `position:absolute;visibility:hidden;white-space:nowrap;letter-spacing:normal;` +
      `font-style:${cs.fontStyle};font-weight:${cs.fontWeight};font-size:${cs.fontSize};font-family:${family}`;
    el.parentNode!.appendChild(span);
    const w = span.getBoundingClientRect().width;
    span.remove();
    return w;
  };
  const full = measure(stack);
  const without = measure(rest);
  return { family: firstFamily(stack), uses: Math.abs(full - without) > 0.5, full, without };
}

const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];

function openContentScript(doc = DOC): ShadowRoot {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
  runReader({ isRenderable: () => true });
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  hosts.push(host);
  return host.shadowRoot!;
}

function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

async function openAppPage(doc = DOC): Promise<{ container: HTMLElement; reader: ShadowRoot }> {
  const files: MarkdownFile[] = [{ path: 'fonts.md', name: 'fonts.md', read: async () => doc }];
  const source: FolderSource = { name: 'notes', files, truncated: false, persistable: true };
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: fakeStore() });
  await app.openFolder();
  const btn = await waitFor(() =>
    [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
      (b) => b.textContent === 'fonts.md',
    ),
  );
  btn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  const reader = await waitFor(() => (host.shadowRoot?.querySelector('.peekover-reader pre') ? host.shadowRoot : null));
  return { container, reader };
}

afterEach(() => {
  removeHideStyle();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  for (const h of hosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  document.querySelectorAll('peekover-root').forEach((el) => el.remove());
  document.body.replaceChildren();
});

describe('content-script reader — no design UI faces; system chrome and code; Literata kept (runs FIRST)', () => {
  it('registers no Bricolage / Sometype face, and its chrome and code draw a system face', async () => {
    // Precondition (see the header): nothing in this document has registered the app-page faces.
    expect(facesOf(UI_SANS_FAMILY).length + facesOf(UI_MONO_FAMILY).length, 'precondition: a UI face is already registered').toBe(0);

    const root = openContentScript();
    const pre = await waitFor(() => root.querySelector('.peekover-reader pre'));
    const toggle = await waitFor(() => root.querySelector('.peekover-mode-toggle'));
    const para = await waitFor(() => root.querySelector('.peekover-reader p'));
    await document.fonts.ready;

    expect(facesOf(UI_SANS_FAMILY), 'the content script registered Bricolage Grotesque').toEqual([]);
    expect(facesOf(UI_MONO_FAMILY), 'the content script registered Sometype Mono').toEqual([]);
    const fontFaceRules = [...root.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSFontFaceRule);
    expect(fontFaceRules, 'an @font-face rule in the content-script reader').toEqual([]);

    const chrome = drawsFirstFamily(toggle);
    const code = drawsFirstFamily(pre);
    expect(chrome.family, 'the chrome stack leads with the design face (D-3, one stack string)').toBe(UI_SANS_FAMILY);
    expect(code.family, 'the code stack leads with the design face (D-3)').toBe(UI_MONO_FAMILY);
    expect(chrome.uses, `content-script chrome drew Bricolage (${chrome.full} vs ${chrome.without} px)`).toBe(false);
    expect(code.uses, `content-script code drew Sometype (${code.full} vs ${code.without} px)`).toBe(false);

    // Literata unchanged: registered (fonts.ts, inline) and drawn for prose.
    expect(facesOf('Literata').length, 'Literata faces registered on the content script').toBe(4);
    const prose = drawsFirstFamily(para);
    expect(prose.family).toBe('Literata');
    expect(prose.uses, `content-script prose did not draw Literata (${prose.full} vs ${prose.without} px)`).toBe(true);
  }, 30_000);
});

describe('app page — the design faces load from the package and are drawn', () => {
  it('registers and loads every shipped face: Bricolage 400 / 600 / 700, Sometype 400 / 500', async () => {
    await openAppPage();
    const ours = [...facesOf(UI_SANS_FAMILY), ...facesOf(UI_MONO_FAMILY)];
    await Promise.all(ours.map((f) => f.loaded.catch(() => undefined)));
    expect(ours.map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.status}`).sort()).toEqual(
      UI_FONT_FACES.map((f) => `${f.family} ${f.weight} loaded`).sort(),
    );
    for (const f of UI_FONT_FACES) {
      expect(document.fonts.check(`${f.weight} 16px "${f.family}"`), `${f.family} ${f.weight}`).toBe(true);
    }
  }, 30_000);

  it('the shell chrome draws Bricolage, code draws Sometype, prose draws Literata', async () => {
    const { container, reader } = await openAppPage();
    await Promise.all([...facesOf(UI_SANS_FAMILY), ...facesOf(UI_MONO_FAMILY)].map((f) => f.loaded.catch(() => undefined)));
    await document.fonts.ready;

    const brand = container.querySelector('.peekover-app__brand')!;
    const chrome = drawsFirstFamily(brand);
    expect(chrome.family, 'the shell chrome stack leads with Bricolage Grotesque').toBe(UI_SANS_FAMILY);
    expect(chrome.uses, `app chrome did not draw Bricolage (${chrome.full} vs ${chrome.without} px)`).toBe(true);

    const code = drawsFirstFamily(reader.querySelector('.peekover-reader pre')!);
    expect(code.family).toBe(UI_MONO_FAMILY);
    expect(code.uses, `app-page code did not draw Sometype (${code.full} vs ${code.without} px)`).toBe(true);

    const prose = drawsFirstFamily(reader.querySelector('.peekover-reader p')!);
    expect(prose.family).toBe('Literata');
    expect(prose.uses, `app-page prose did not draw Literata (${prose.full} vs ${prose.without} px)`).toBe(true);
  }, 30_000);
});
