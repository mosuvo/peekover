// PDF export (task 7.1, D-7, §3.6-sealed) in a REAL ENGINE, Chromium AND Firefox.
//
// §3.6 sealed the mechanism before this task started: PDF export is `window.print()`, the SAME
// pipeline the browser's own print command drives — no second rendering path, no PDF-generation
// dependency. This file proves the WIRING (panel row → `exportPdf()` → `window.print()`), the one
// thing every other export/copy row's own browser test already proves for ITS OWN action —
// `exportPanel.browser.test.ts` proves the panel mechanics generically (rows 3-7, 11) and 3.1's own
// download codepath; this file is pdf's equivalent of `copyAsHtml.browser.test.ts` /
// `copyAsRichText.browser.test.ts`, scoped to pdf's own action.
//
// What this file does NOT re-prove: the print-mode CSS itself (chrome hidden, document de-clipped,
// page-break rules, the `@page` margin-box relocation) — that is `printMode.browser.test.ts`'s own,
// already-measured job (tasks 6.1 + 7.1). Re-deriving it here per row/action would be exactly the
// "own per-extension ablation" AGENTS.md warns against when a pattern's precedent already stands;
// `window.print()` triggering the SAME print pipeline is what makes that CSS the whole story.
//
// Unlike every copy row (3.3/3.4/4.1), `window.print()` needs NO clipboard permission, NO secure-
// context distinction, and writes nothing — there is no OS-mangling/consent story to re-check here
// the way `copyAsHtml.browser.test.ts`/`copyAsRichText.browser.test.ts` had to for the clipboard.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function mdFile(path: string, text = `# ${path}\n\nBody of ${path}.`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile('alpha.md')] };
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Mounts the shell, grants an in-memory folder, and selects the one file — the same shape every
 *  sibling export/copy browser test uses (`exportPanel.browser.test.ts`'s own `mountWithFile`,
 *  reproduced inline per this suite's own no-shared-fixture-module convention). */
async function mountWithFile(): Promise<{ container: HTMLElement; toggle: HTMLButtonElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource() }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = await waitFor(() =>
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  );
  fileBtn.click();
  await waitFor(() => container.querySelector('.peekover-app__reader__host'));

  return {
    container,
    toggle: container.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!,
  };
}

async function openPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return waitFor(() => container.querySelector<HTMLElement>('.peekover-export'));
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

describe('PDF export (task 7.1) — the panel row drives the real window.print() pipeline', () => {
  it('clicking "PDF" calls window.print() exactly once, no second rendering path', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const pdfRow = panel.querySelector<HTMLButtonElement>('[data-export="pdf"]')!;
    expect(pdfRow.disabled, 'the pdf row must be LIVE as of task 7.1').toBe(false);

    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    try {
      pdfRow.click();
      expect(printSpy).toHaveBeenCalledTimes(1);
      // No arguments: window.print() is document-global, exportPdf() takes and forwards nothing
      // (see exportControls.ts's own doc comment on why there is no host/clone param here, unlike
      // every other export/copy row).
      expect(printSpy.mock.calls[0]).toEqual([]);
    } finally {
      printSpy.mockRestore();
    }
  });

  it('the row is accessibly named and matches the other 4 rows\' own shape', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const pdfRow = panel.querySelector<HTMLButtonElement>('[data-export="pdf"]')!;

    expect(pdfRow.tagName).toBe('BUTTON');
    expect(pdfRow.getAttribute('aria-label')).toBe('Export as PDF');
    expect(pdfRow.disabled).toBe(false);
  });
});
