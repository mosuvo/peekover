// The second user report (from X, 2026-11-11): the human's `tests/fixtures/tables-footnotes-lists.md`, used as-is.
// Its first table puts a pipe in code and in text, escaped and not. The table tool's copy must round-trip it, on both
// engines and both surfaces, through the real clipboard:
//   • Copy Markdown writes every literal `|` in a cell's shown text as `\|`, so the copied table parses back to the
//     same cells (checked by parsing the copy again).
//   • Copy CSV keeps the `|` literal: a pipe is not special in CSV, and only the comma cells are quoted.
// The serializer's own bytes are unit-pinned (`tableTools.test.ts`, "markdownField"); this file is the fixture, the
// real click and the real clipboard. Consent handling follows `tableCopy.browser.test.ts` (Chromium needs the browser
// consent granted over CDP, by `browserContextId`, and reset the same way; Gecko has none to grant).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent, cdp } from 'vitest/browser';
import fixture from '../fixtures/tables-footnotes-lists.md?raw';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { parse } from '../../src/render/parse';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { COPY_CSV_CLASS, COPY_MARKDOWN_CLASS, COPY_STATUS_CLASS } from '../../src/render/tableTools';

const cleanup: (() => void)[] = [];

async function until<T>(fn: () => T | null | undefined | false, what: string, ms = 10000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > end) throw new Error(`timed out: ${what}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

const store = { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined } as AppStore;

async function appPage(): Promise<ShadowRoot> {
  const container = document.createElement('div');
  container.style.cssText = 'width:1300px;height:900px';
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const file = { path: 'tables-footnotes-lists.md', name: 'tables-footnotes-lists.md', read: async () => fixture };
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [file] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
  await app.openFolder();
  (await until(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'tree item')).click();
  const host = await until(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'reader host');
  await until(() => host.shadowRoot?.querySelector('.peekover-reader table'), 'render');
  return host.shadowRoot!;
}

/** The tab surface through the content script's own orchestration: the copy is wired by `mountReader`, so a bare
 *  `mount` + `enhanceTables` would show the buttons with nothing behind them (measured: the status never speaks). */
async function tabSurface(): Promise<ShadowRoot> {
  const pre = document.createElement('pre');
  pre.textContent = fixture;
  document.body.appendChild(pre);
  runReader({ isRenderable: () => true });
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  await until(() => host.shadowRoot?.querySelector('.peekover-reader table'), 'render');
  return host.shadowRoot!;
}

/** The per-case reset `tableCopy.browser.test.ts` uses: the content script leaves a hide <style> and registries. */
function reset(): void {
  removeHideStyle();
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  document.body.replaceChildren();
}

/** The fixture's first table as shown: Case / Cell / Note, six rows. */
const firstTable = (shadow: ShadowRoot) => shadow.querySelector<HTMLTableElement>('.peekover-reader table')!;
const toolbarOf = (table: HTMLTableElement) => table.previousElementSibling as HTMLElement;
// By class alone: the tag is not what this file asserts.
const buttonOf = (table: HTMLTableElement, cls: string) => toolbarOf(table).querySelector<HTMLElement>(`.${cls}`)!;
const statusOf = (table: HTMLTableElement) => toolbarOf(table).querySelector<HTMLElement>(`.${COPY_STATUS_CLASS}`)!;

async function copy(table: HTMLTableElement, cls: string): Promise<string> {
  statusOf(table).textContent = '';
  await userEvent.click(buttonOf(table, cls));
  return until(() => statusOf(table).textContent || null, 'copy status');
}

/** Each shown row's cells as text (whitespace collapsed), header row first — the shape a copy must reproduce. The
 *  enhancer's own "No rows match this filter." row is `hidden` and is not a row of the table. */
function cellsOf(table: HTMLTableElement): string[][] {
  return [...table.rows].filter((r) => !r.hidden).map((r) => [...r.cells].map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim()));
}

/** The shown cells as rendered now. The unescaped pipes split, and the extra cell is dropped (GFM's rule). */
const SHOWN = [
  ['Case', 'Cell', 'Note'],
  ['Unescaped pipe in code', '`a', 'b`'],
  ['Escaped pipe in code', 'a|b', 'Shows as `a'],
  ['Escaped pipe in text', 'left | right', 'One cell, literal pipe'],
  ['Footnote in a cell', 'see this[^early]', 'Superscript link'],
  ['Bold and pipe', 'x | y', 'Bold, literal pipe'],
  ['Empty cell', '', 'Third cell still here'],
];

const EXPECTED_MARKDOWN = [
  '| Case | Cell | Note |',
  '| --- | --- | --- |',
  '| Unescaped pipe in code | `a | b` |',
  '| Escaped pipe in code | a\\|b | Shows as `a |',
  '| Escaped pipe in text | left \\| right | One cell, literal pipe |',
  '| Footnote in a cell | see this[^early] | Superscript link |',
  '| Bold and pipe | x \\| y | Bold, literal pipe |',
  '| Empty cell |  | Third cell still here |',
].join('\n');

const EXPECTED_CSV = [
  'Case,Cell,Note',
  'Unescaped pipe in code,`a,b`',
  'Escaped pipe in code,a|b,Shows as `a',
  'Escaped pipe in text,left | right,"One cell, literal pipe"',
  'Footnote in a cell,see this[^early],Superscript link',
  'Bold and pipe,x | y,"Bold, literal pipe"',
  'Empty cell,,Third cell still here',
].join('\r\n');

// ── The engines' clipboard consent (tableCopy.browser.test.ts's shape) ──────────────────────────

async function consent(): Promise<PermissionState | 'unsupported'> {
  try {
    return (await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })).state;
  } catch {
    return 'unsupported';
  }
}

async function contextId(): Promise<string | undefined> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as { targetInfo?: { browserContextId?: string } };
  return info?.targetInfo?.browserContextId;
}

let chromium = false;

beforeEach(async () => {
  reset();
  chromium = (await consent()) !== 'unsupported';
  if (!chromium) return;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: await contextId(),
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
});

afterEach(async () => {
  while (cleanup.length) cleanup.pop()!();
  reset();
  // Reset by id: a reset with no id clears the DEFAULT context and leaves this one granted for the next file.
  if (chromium) await cdp().send('Browser.resetPermissions', { browserContextId: await contextId() } as never);
});

describe('tables-footnotes-lists.md, the first table: copy round-trips the pipes', () => {
  for (const surface of ['app page', 'tab'] as const) {
    it(`${surface}: Copy Markdown escapes every | as \\|, and the copy parses back to the same cells`, async () => {
      const shadow = surface === 'app page' ? await appPage() : await tabSurface();
      const table = firstTable(shadow);
      expect(cellsOf(table), 'the fixture renders as pinned (the test is about THIS table)').toEqual(SHOWN);

      const settled = await copy(table, COPY_MARKDOWN_CLASS);
      // Blink returns the Windows clipboard's CRLF; Gecko returns the bytes as written (tableCopy.browser.test.ts).
      const copied = (await navigator.clipboard.readText()).replace(/\r\n/g, '\n');
      // The bytes first: the check that finds a missing escape must be the one seen to fail.
      expect(copied).toBe(EXPECTED_MARKDOWN);

      const back = document.createElement('template');
      back.innerHTML = parse(copied);
      const reparsed = back.content.querySelector('table');
      expect(reparsed, 'the copy is still a table').not.toBeNull();
      expect(cellsOf(reparsed!), 'parsed again, every cell is the one shown').toEqual(SHOWN);
      expect(settled).toBe('Copied 6 rows as Markdown.');
    }, 30000);

    it(`${surface}: Copy CSV keeps | literal`, async () => {
      const shadow = surface === 'app page' ? await appPage() : await tabSurface();
      const table = firstTable(shadow);
      expect(cellsOf(table)).toEqual(SHOWN);

      const settled = await copy(table, COPY_CSV_CLASS);
      expect(await navigator.clipboard.readText()).toBe(EXPECTED_CSV);
      expect(settled).toBe('Copied 6 rows as CSV.');
    }, 30000);
  }
});
