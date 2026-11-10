// htmlExport — the file-download exit (task 3.1). ★ REDUCED per the §3.1 gate ruling
// (decisions.md, 2026-08-29): no local-image Base64 embedding to prove — every <img> ships in the
// downloaded file exactly as the clone carried it. This file drives the REAL download codepath,
// not just the serialized string: task 2.2's `htmlExport.browser.test.ts` already proved the
// TRANSLATED stylesheet applies once a standalone document is opened bare (D-3's structural
// claim); this task's own Verify calls for that "re-proven at the file-download exit specifically,
// since a clipboard write and a file write are different browser codepaths" — so here the SAME
// render-equivalence checks run against a file that actually came out of `exportHtml`'s
// `downloadAs` (a synthetic `<a download>` click over a `blob:` URL), captured as a real
// Playwright `Download`, saved, and opened in a fresh isolated context. See vitest.config.ts's
// `armExportDownload`/`collectExportDownload` for the capture mechanism and why it needs two
// commands instead of one.
//
// §3.11 rows 3-5 (out-of-flow, the trigger itself, zero residual footprint) are NOT asserted here:
// task 3.1 has no export-panel trigger of its own (that is task 3.2) — `exportHtml` is driven
// directly, exactly as 2.2 drove `serializeReaderDocument` directly. Row 14 (no sibling suite for
// a download-triggering control) is established by this file being the first of its kind.

import { describe, it, expect, afterEach } from 'vitest';
import { commands, page } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { createReaderPane } from '../../src/app/readerPane';
import { exportHtml } from '../../src/export/htmlExport';
import { setThemeSetting } from '../../src/theme/reader';
import sampleMd from '../../docs/store/assets/sample.md?raw';

interface ExportDownloadProbe {
  suggestedFilename: string;
  html: string;
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
  extra: unknown;
}

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    armExportDownload(): Promise<true>;
    collectExportDownload(script?: string): Promise<ExportDownloadProbe>;
    printToPdfAndExtractText(html: string): Promise<{
      ok: boolean;
      error: string | null;
      pageCount: number;
      perPageText: string[];
    }>;
  }
}

const HOST_TAG = 'peekover-root';
const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

function mountedHost(markdown: string, theme: 'light' | 'dark' | 'sepia'): HTMLElement {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
  host.setAttribute('data-theme', theme);
  return host;
}

/** Arm the download capture, trigger the REAL `exportHtml` codepath in-page, collect the result. */
async function driveExportHtml(host: HTMLElement, basename: string) {
  await commands.armExportDownload();
  exportHtml(host, basename);
  return commands.collectExportDownload();
}

describe('exportHtml — the real download codepath, opened bare', () => {
  it('downloads a standalone file that renders visually equivalent to the reader (light)', async () => {
    const host = mountedHost('# Exported Title\n\nHello *world*.\n', 'light');
    const probe = await driveExportHtml(host, 'exported-title');

    expect(probe.suggestedFilename).toBe('exported-title.html');
    expect(probe.consoleErrors).toEqual([]);
    expect(probe.bodyPosition).toBe('static'); // the export is the page: it scrolls (walk fix 8.1d)
    expect(probe.bodyBackgroundColor).toBe('rgb(251, 251, 248)'); // light --paper #FBFBF8
    expect(probe.hostSelectorLiteralPresent).toBe(false); // no dead :host text shipped
    expect(probe.h1Text).toBe('Exported Title');
  });

  it('downloads the DARK theme instead when that is what was painting at export time', async () => {
    const host = mountedHost('# Dark Export\n', 'dark');
    const probe = await driveExportHtml(host, 'dark-export');

    expect(probe.consoleErrors).toEqual([]);
    expect(probe.bodyBackgroundColor).toBe('rgb(18, 20, 28)'); // dark --paper #12141C
    expect(probe.h1Text).toBe('Dark Export');
  });

  it('★ POSITIVE PASSTHROUGH: a local <img src> ships UNCHANGED — broken-reference passthrough, not embedded', async () => {
    // §3.1 gate ruling: local-image Base64 embedding is dropped from M10. The downloaded file's
    // <img> must carry the EXACT authored relative path — never a data: URI, never rewritten —
    // the same broken/unrewritten state the app-page reader itself already shows today for a
    // local relative-path image on the REAL app page (decisions.md's own D1 finding: a relative
    // reference resolves against the app page's chrome-extension:/moz-extension: baseURI, which
    // mediaPolicy classifies `inert` and leaves untouched).
    //
    // This test harness cannot reproduce that origin-dependent classification faithfully: it runs
    // the mounted document at the runner's own http://localhost origin, where a relative path
    // resolves to an http: URL and mediaPolicy would classify it `remote` (blocked into a
    // placeholder) instead of `inert` — a harness artifact, not the real app-page behavior. So the
    // fixture <img> is inserted directly into the already-mounted `.peekover-reader` subtree,
    // simulating exactly the DOM shape mediaPolicy leaves an inert/local reference in — and this
    // test's actual subject, `exportHtml`'s own passthrough (never rewriting whatever `<img>` the
    // committed reader DOM already carries), is proven regardless of how that DOM got there.
    // mediaPolicy's OWN classification is that module's own suite's job, not re-proven here.
    const host = mountedHost('# Doc\n', 'light');
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    const img = host.ownerDocument.createElement('img');
    img.src = './images/pic.png';
    img.alt = 'a local pic';
    column.appendChild(img);

    const probe = await driveExportHtml(host, 'local-image-doc');

    expect(probe.html).toContain('src="./images/pic.png"');
    expect(probe.html).not.toMatch(/src="data:/);
  });

  it('a remote image (already blocked to a placeholder upstream, at mount time) ships unrewritten (Ruling 3)', async () => {
    // Unlike the local case, https: is remote regardless of the page's own origin, so the REAL
    // production pipeline (mount -> mediaPolicy) reliably reproduces this one: by the time
    // exportHtml runs, the reader's committed DOM already carries mediaPolicy's inert placeholder
    // (`<span class="peekover-remote" data-peekover-src="...">`), never a fetch-capable <img> — the
    // remote URL rides along on the placeholder's own data-* attribute, unrewritten, never fetched.
    // §9.2's own text routes Ruling 3's HTML-export half here rather than re-checking it a third time.
    const host = mountedHost('# Doc\n\n![remote](https://example.com/pic.png)\n', 'light');
    const column = host.shadowRoot!.querySelector('.peekover-reader')!;
    expect(column.querySelector('img')).toBeNull(); // blocked upstream — no <img> survives to export

    const probe = await driveExportHtml(host, 'remote-image-doc');

    expect(probe.html).toContain('data-peekover-src="https://example.com/pic.png"');
    expect(probe.html).not.toContain('<img');
  });
});

// Walk fix 8.1a (walk-8.1.md I-9): the human's exported file printed only its first viewport. The
// export's stylesheet glued each @media condition straight onto the keyword, so the two whose
// condition starts with a word came out as `@mediaprint{` and `@mediascreen and (...)` - unknown
// at-rules, dropped whole. The print block is the one that takes body off position:fixed, so
// printing the export captured one page. The theme is set through the real setting, not by hand.
describe('exportHtml - the sample document, both themes (walk fix 8.1a)', () => {
  afterEach(() => setThemeSetting('auto'));

  const PAPER = { light: 'rgb(251, 251, 248)', dark: 'rgb(18, 20, 28)' } as const;

  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: every @media rule parses, it prints past one page to the last heading, and it paints ${theme} paper`, async () => {
      const host = document.createElement(HOST_TAG);
      document.body.appendChild(host);
      hosts.push(host);
      mount(sampleMd, host, { contained: true });
      setThemeSetting(theme);
      expect(host.getAttribute('data-theme')).toBe(theme);

      const probe = await driveExportHtml(host, `sample-${theme}`);
      const css = /<style>([\s\S]*?)<\/style>/.exec(probe.html)?.[1] ?? '';
      expect(css.length).toBeGreaterThan(0);

      // (a) Every @media in the text survives a real CSS parse as a media rule.
      expect(css).not.toMatch(/@media[a-z]/i);
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      const parsedMedia = [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule).length;
      expect(parsedMedia).toBe((css.match(/@media/g) ?? []).length);
      expect(parsedMedia).toBeGreaterThan(0);

      // (c) The opened file paints this theme's paper.
      expect(probe.consoleErrors).toEqual([]);
      expect(probe.bodyBackgroundColor).toBe(PAPER[theme]);

      // (b) Printed to PDF (Chromium only: Playwright has no Firefox pdf()).
      const pdf = await commands.printToPdfAndExtractText(probe.html);
      if (!pdf.ok) {
        expect(pdf.error).toContain('Headless Chromium');
        return;
      }
      expect(pdf.pageCount).toBeGreaterThan(1);
      expect(pdf.perPageText[pdf.pageCount - 1]).toContain('Rollback');
    });
  }
});

// Walk fix 8.1d (walk-8.1.md I-9, re-check of 8.1a): the human's exported sample opened to one screen
// and would not scroll. The reader's base rule (`:host{position:fixed;inset:0;overflow:auto}`) rides
// onto body; on the root's body the overflow goes to the viewport, and a fixed body adds nothing for
// the viewport to scroll. Same file: the display-math source showed above its formula (that hide rule
// is in the math sheet, which the export did not carry), and every control shipped with no script to
// run it. The sample is opened through the real reader pane, so all four enhancers have run.
const PROBE_OPENED_FILE = `(() => {
  const se = document.scrollingElement;
  const viewport = innerHeight;
  const scrollHeight = se.scrollHeight;
  scrollTo({ top: 400, behavior: 'instant' });
  const scrolledTo = scrollY;
  const last = [...document.querySelectorAll('h2')].pop();
  last.scrollIntoView({ block: 'center', behavior: 'instant' });
  const r = last.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
  const shown = (el) => getComputedStyle(el).display !== 'none';
  const sources = [...document.querySelectorAll('pre[data-math], pre[data-diagram], pre[data-code]')];
  const figures = [...document.querySelectorAll('figure.peekover-math')];
  return {
    viewport, scrollHeight, scrolledTo,
    lastText: last.textContent,
    hitIsLast: !!hit && (hit === last || last.contains(hit)),
    sourcesShown: sources.filter(shown).map((el) => el.outerHTML.slice(0, 60)),
    sourceCount: sources.length,
    mathSourceCount: document.querySelectorAll('pre[data-math]').length,
    mathPerFigure: figures.map((f) => [...f.querySelectorAll('math')].filter((m) => m.getBoundingClientRect().height > 0).length),
  };
})()`;

interface OpenedFileProbe {
  viewport: number;
  scrollHeight: number;
  scrolledTo: number;
  lastText: string;
  hitIsLast: boolean;
  sourcesShown: string[];
  sourceCount: number;
  mathSourceCount: number;
  mathPerFigure: number[];
}

async function until<T>(fn: () => T | null | undefined | false): Promise<T> {
  for (let i = 0; i < 300; i++) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('until: timed out');
}

describe('exportHtml - the enhanced sample scrolls, hides its sources, ships no controls (walk fix 8.1d)', () => {
  const panes: HTMLElement[] = [];
  afterEach(async () => {
    for (const el of panes.splice(0)) el.remove();
    setThemeSetting('auto');
    await page.viewport(414, 896);
  });

  const PAPER = { light: 'rgb(251, 251, 248)', dark: 'rgb(18, 20, 28)' } as const;

  for (const theme of ['light', 'dark'] as const) {
    it(`${theme}: scrolls to "Rollback", one formula per source and every source hidden, no controls; 8.1a still holds`, async () => {
      await page.viewport(1280, 900);
      setThemeSetting(theme);
      const pane = createReaderPane(document);
      document.body.appendChild(pane.element);
      panes.push(pane.element);
      await pane.select({ name: 'sample.md', read: async () => sampleMd });
      const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host')!;
      const sr = host.shadowRoot!;
      await until(
        () =>
          sr.querySelector('figure.peekover-math[data-math="rendered"]') &&
          sr.querySelector(`figure.peekover-diagram[data-diagram-theme="${theme}"]`) &&
          sr.querySelectorAll('.peekover-code[data-code="rendered"]').length === 2 &&
          sr.querySelector('.peekover-table-tools'),
      );
      expect(host.getAttribute('data-theme')).toBe(theme);
      // The live reader keeps its controls: only the export loses them.
      expect(sr.querySelectorAll('.peekover-reader button').length).toBeGreaterThan(0);

      await commands.armExportDownload();
      exportHtml(host, `sample-${theme}`);
      const probe = await commands.collectExportDownload(PROBE_OPENED_FILE);
      const opened = probe.extra as OpenedFileProbe;
      expect(probe.consoleErrors).toEqual([]);

      // (a) The page scrolls, and the last heading can be brought into view and hit-tested.
      expect(opened.scrollHeight).toBeGreaterThan(opened.viewport);
      expect(opened.scrolledTo).toBeGreaterThan(0);
      expect(opened.lastText).toBe('Rollback');
      expect(opened.hitIsLast).toBe(true);

      // (b) Every enhancer's source <pre> is hidden; each formula draws once.
      expect(opened.mathSourceCount).toBeGreaterThan(0);
      expect(opened.sourcesShown).toEqual([]);
      expect(opened.mathPerFigure).toEqual(Array(opened.mathSourceCount).fill(1));

      // (c) No controls ship. The task-list checkboxes are the document's own content (disabled;
      // the checked state is the data), so they stay; the table's header text, which lives inside
      // the sort buttons in the reader, stays as plain header text.
      const doc = new DOMParser().parseFromString(probe.html, 'text/html');
      expect(doc.querySelectorAll('button').length).toBe(0);
      expect(doc.querySelectorAll('[role="group"], [role="toolbar"]').length).toBe(0);
      const inputs = [...doc.querySelectorAll('input')];
      expect(inputs.every((i) => i.classList.contains('task-list-item-checkbox') && i.disabled)).toBe(true);
      expect(inputs.length).toBe(4);
      expect(inputs.filter((i) => i.checked).length).toBe(2);
      expect([...doc.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
        'Phase',
        'Traffic',
        'Duration',
        'p95 latency',
      ]);
      expect(doc.querySelectorAll('tbody tr').length).toBe(4);
      expect(doc.querySelector('.peekover-code-toolbar__lang')?.textContent).toBe('ts');

      // (d) 8.1a: every @media parses; light/dark paper; the PDF runs past one page to "Rollback".
      const css = /<style>([\s\S]*?)<\/style>/.exec(probe.html)?.[1] ?? '';
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      const parsedMedia = [...sheet.cssRules].filter((r) => r instanceof CSSMediaRule).length;
      expect(parsedMedia).toBe((css.match(/@media/g) ?? []).length);
      expect(probe.bodyBackgroundColor).toBe(PAPER[theme]);
      const pdf = await commands.printToPdfAndExtractText(probe.html);
      if (!pdf.ok) {
        expect(pdf.error).toContain('Headless Chromium');
        return;
      }
      expect(pdf.pageCount).toBeGreaterThan(1);
      expect(pdf.perPageText[pdf.pageCount - 1]).toContain('Rollback');
    });
  }
});
