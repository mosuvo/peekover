// App-page header at a narrow viewport — every control stays inside the viewport (M13 task 1.4).
//
// Found by the first Linux run (CI #18, then the cloud environment check): at 414 x 896 the header
// laid out in one row 454px (Chromium) / 470px (Firefox) wide in Inter, so the Export control sat
// at x 390-454 with its centre off-screen — clipped for a user, and `elementFromPoint` there
// returned null, which is what turned editorUnsaved's "the page behind is inert" red. Windows' system
// face (Segoe UI) happened to fit, which is why it had never shown. The property asserted here is
// font-independent: whatever face the engine resolves, no header control may lie outside the
// viewport. Both engines; the wide viewport is the control arm (one row, nothing moved).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';

const DOC = '# Heading\n\nSome body text.\n\n## Second\n\nMore text.\n';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** The real shell with a folder open and a file selected, so every header control is present. */
async function mountShell(): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', DOC) }),
    store: fakeStore(),
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
  for (let i = 0; i < 100; i += 1) {
    if (container.querySelector('.peekover-app__reader__host')) break;
    await sleep(20);
  }
  return container.querySelector<HTMLElement>('.peekover-app__header')!;
}

/** Every rendered control in the header (buttons and the brand/tag text), with its rect. */
function headerParts(header: HTMLElement): [string, DOMRect][] {
  const parts: [string, DOMRect][] = [];
  for (const el of header.querySelectorAll<HTMLElement>('button, .peekover-app__brand, .peekover-app__tag')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue; // a closed popover's rows have no box
    parts.push([el.className.split(' ')[0] || el.tagName, r]);
  }
  return parts;
}

beforeEach(() => {
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  document.body.replaceChildren();
});

afterEach(async () => {
  document.body.replaceChildren();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await page.viewport(414, 896);
});

describe('M13 task 1.4 — the app header keeps every control inside the viewport', () => {
  it.each([
    ['414 x 896 (narrow)', 414, 896],
    ['1280 x 900 (wide)', 1280, 900],
  ])('at %s, every header control lies inside the viewport', async (_label, width, height) => {
    await page.viewport(width, height);
    const header = await mountShell();
    const parts = headerParts(header);

    // Non-vacuous: the controls the 414 red was about are really there and laid out.
    const names = parts.map(([n]) => n);
    for (const must of [
      'peekover-app__export-toggle',
      'peekover-app__storage-toggle',
      'peekover-theme-toggle',
      'peekover-code-theme-toggle',
    ]) {
      expect(names, `${must} is rendered in the header`).toContain(must);
    }

    for (const [name, r] of parts) {
      const box = `[${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`;
      expect(r.left, `${name} ${box} starts left of the viewport`).toBeGreaterThanOrEqual(0);
      expect(r.right, `${name} ${box} ends past the viewport's right edge (${window.innerWidth})`).toBeLessThanOrEqual(
        window.innerWidth,
      );
      expect(r.top, `${name} ${box} starts above the viewport`).toBeGreaterThanOrEqual(0);
      expect(r.bottom, `${name} ${box} ends below the viewport`).toBeLessThanOrEqual(window.innerHeight);
    }
  });
});
