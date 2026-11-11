// M13 walk fix 8.1k — a block nested in a quote looks like the same block at the top level (the human's weird-nesting
// hand test, Chrome, 2026-11-11; `tests/fixtures/weird-nesting.md`, used as-is). The cause: the quote's own rule,
// `.peekover-reader blockquote{color:var(--muted);font-style:italic}`, is inherited by every block inside it — code,
// tables, diagrams and math took the quote's italic, and on the tab surface (no highlighter there, by design) code
// also took its muted colour.
//
// The comparison is ALWAYS against a top-level control of the same kind, rendered on the same surface in the same
// theme — so this pins "the same as a top-level one" and nothing more: on the app page a labelled fence has a toolbar
// and highlighted spans at any depth; on the tab surface (no code engine, a published limit) no fence has either, at
// any depth; an unlabelled fence has no toolbar on either surface, at any depth, exactly like a top-level one.

import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { commands } from 'vitest/browser';
import fixture from '../fixtures/weird-nesting.md?raw';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { mount } from '../../src/render/mount';
import { enhanceTables } from '../../src/render/tableEnhancer';
import { serializeReaderDocument, wrapInStandaloneDocument } from '../../src/export/htmlExport';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulateColorScheme(value: 'light' | 'dark' | null): Promise<void>;
  }
}

const cleanup: (() => void)[] = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()!();
});
afterAll(async () => {
  await commands.emulateColorScheme(null);
});

const CONTROL = ['# Control', '', '```js', 'const top = 1;', '```', '', '```', 'plain top-level fence', '```', '', '| A | B |', '| --- | --- |', '| 1 | 2 |', ''].join('\n');
const EMBEDS = [
  '# Embeds', '',
  '> ```mermaid', '> graph TD; A-->B', '> ```', '',
  '> ```math', '> x^2', '> ```', '',
  '> | Q | T |', '> | --- | --- |', '> | in | quote |', '',
].join('\n');

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

/** The app page with one document open; resolves once code (if any) has been highlighted. */
async function appPage(text: string): Promise<ShadowRoot> {
  const container = document.createElement('div');
  container.style.cssText = 'width:1200px;height:900px';
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const file = { path: 'doc.md', name: 'doc.md', read: async () => text };
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [file] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
  await app.openFolder();
  (await until(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'tree item')).click();
  const host = await until(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'reader host');
  await until(() => host.shadowRoot?.querySelector('h1'), 'render');
  const shadow = host.shadowRoot!;
  await until(() => [...shadow.querySelectorAll('.peekover-code')].every((w) => w.querySelector('pre.shiki')), 'highlighting');
  await until(() => [...shadow.querySelectorAll('pre[data-diagram], pre[data-math]')].every((p) => p.getAttribute('data-diagram') !== 'pending' && p.getAttribute('data-math') !== 'pending'), 'diagrams and math', 15000);
  return shadow;
}

/** The tab surface: what `mountReader` does — `mount` then `enhanceTables`, nothing else. */
function tabSurface(text: string): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  cleanup.push(() => host.remove());
  mount(text, host);
  enhanceTables(host);
  return host.shadowRoot!;
}

interface Look { fontStyle: string; color: string; toolbar: boolean; highlighted: boolean }

/** What a reader SEES of one fence: the highlighted copy when there is one, else the source `<pre>`. */
function lookOf(pre: HTMLElement): Look {
  const wrapper = pre.closest('.peekover-code');
  const shown = (wrapper?.querySelector<HTMLElement>('pre.shiki')) ?? pre;
  const cs = getComputedStyle(shown);
  return {
    fontStyle: cs.fontStyle,
    color: cs.color,
    toolbar: !!wrapper?.querySelector('.peekover-code-toolbar'),
    highlighted: shown.querySelectorAll('span').length > 0,
  };
}

/** Source fences (never the highlighted copy), keyed by the fixture section (`## n.`) they sit in. */
function fencesBySection(shadow: ShadowRoot): Array<{ section: string; labelled: boolean; look: Look }> {
  const out: Array<{ section: string; labelled: boolean; look: Look }> = [];
  let section = '(before §1)';
  const column = shadow.querySelector('.peekover-reader')!;
  const walker = document.createTreeWalker(column, NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode() as Element | null; n; n = walker.nextNode() as Element | null) {
    if (n.tagName === 'H2') section = (n.textContent ?? '').trim();
    if (n.tagName === 'PRE' && !n.classList.contains('shiki')) {
      const code = n.querySelector('code');
      out.push({ section, labelled: !!code && /(^| )language-/.test(code.className), look: lookOf(n as HTMLElement) });
    }
  }
  return out;
}

function controlLooks(shadow: ShadowRoot): { labelled: Look; plain: Look } {
  const [labelled, plain] = [...shadow.querySelectorAll<HTMLElement>('pre:not(.shiki)')];
  return { labelled: lookOf(labelled), plain: lookOf(plain) };
}

async function theme(scheme: 'light' | 'dark'): Promise<void> {
  await commands.emulateColorScheme(scheme);
  await new Promise((r) => setTimeout(r, 100));
}

const SECTIONS_WITH_FENCES = ['1. The exact combo', '2. Same, but the table is inside the list item', '4. Lazy continuation and tight spacing', '5. Deep nesting', '6. Unclosed fence inside a quote in a list'];

describe('Export and Copy as HTML (one serializer, one wrapper) carry nested fences as they look on screen', () => {
  it('the standalone document: every nested fence present, highlighted and not italic', async () => {
    await theme('light');
    const shadow = await appPage(fixture);
    const doc = wrapInStandaloneDocument(serializeReaderDocument(shadow.host as HTMLElement).clone, 'light');
    const frame = document.createElement('iframe');
    frame.style.cssText = 'width:1000px;height:800px';
    document.body.appendChild(frame);
    cleanup.push(() => frame.remove());
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc = doc;
    });
    const out = frame.contentDocument!;
    const nested = [...out.querySelectorAll<HTMLElement>('blockquote pre.shiki')];
    expect(nested.map((p) => (p.textContent ?? '').trim().split('\n')[0])).toEqual([
      'const nested = "code in a quote in a list";',
      'def inside():',
      'echo "four levels deep"',
    ]);
    for (const pre of nested) {
      expect(pre.querySelectorAll('span').length, 'highlighted in the export').toBeGreaterThan(0);
      expect(frame.contentWindow!.getComputedStyle(pre).fontStyle, 'not italic in the export').toBe('normal');
    }
  }, 30000);
});

for (const scheme of ['light', 'dark'] as const) {
  describe(`a fence nested in a quote or a list looks like a top-level one — ${scheme}`, () => {
    it('the app page: every section of the fixture', async () => {
      await theme(scheme);
      const control = controlLooks(await appPage(CONTROL));
      const fences = fencesBySection(await appPage(fixture));
      expect(fences.map((f) => f.section)).toEqual(expect.arrayContaining(SECTIONS_WITH_FENCES));
      for (const f of fences) {
        const want = f.labelled ? control.labelled : control.plain;
        expect(f.look, `app page, ${scheme}, ${f.section} (${f.labelled ? 'labelled' : 'unlabelled'})`).toEqual(want);
      }
    }, 40000);

    it('the tab surface: every section of the fixture', async () => {
      await theme(scheme);
      const control = controlLooks(tabSurface(CONTROL));
      const fences = fencesBySection(tabSurface(fixture));
      expect(fences.map((f) => f.section)).toEqual(expect.arrayContaining(SECTIONS_WITH_FENCES));
      for (const f of fences) {
        const want = f.labelled ? control.labelled : control.plain;
        expect(f.look, `tab, ${scheme}, ${f.section} (${f.labelled ? 'labelled' : 'unlabelled'})`).toEqual(want);
      }
    }, 20000);

    it('the other enhancers: a table, a diagram and math inside a quote are not italic', async () => {
      await theme(scheme);
      const app = await appPage(EMBEDS);
      const tab = tabSurface(EMBEDS);
      const top = getComputedStyle(tabSurface(CONTROL).querySelector('table')!).fontStyle;
      expect(top).toBe('normal');
      for (const [where, shadow] of [['app page', app], ['tab', tab]] as const) {
        expect(getComputedStyle(shadow.querySelector('blockquote table')!).fontStyle, `${where}: table in a quote`).toBe(top);
      }
      for (const sel of ['blockquote .peekover-diagram', 'blockquote .peekover-math']) {
        const el = await until(() => app.querySelector(sel), sel, 15000);
        expect(getComputedStyle(el).fontStyle, `app page: ${sel}`).toBe('normal');
      }
    }, 40000);
  });
}
