// Print mode + the @page margin-box FIDELITY PROBE (task 6.1, D-7, §3.6/§7-4) — the REAL-ENGINE
// proof. This is not a "wire a mechanism" test: its primary output is a PLAIN, PER-ENGINE STATEMENT
// of whether Chromium's and Firefox's print pipelines render @page margin-box running content
// (page numbers via counter(page)/counter(pages)) at production quality — the input task 7.1's own
// fork (§3.6) reads to decide whether window.print() is the whole of PDF export or whether the
// named fallback (a PDF-generation library) needs pricing. 6.1 does not rule that fork here.
//
// jsdom cannot answer any of this: computed style under a real print-media emulation and (for the
// margin-box question) the actual rendered PDF text layer are both beyond it — margin-box content
// is GENERATED print content, never a DOM node `getComputedStyle` can read.
//
// ── THE PROBE'S TWO INDEPENDENT SIGNALS, AND WHY BOTH ARE NEEDED ──────────────────────────────
//
// (1) CSSOM-parse (both engines, plain in-page DOM reads, no seam): does the engine's own CSS
//     parser even RETAIN the `@top-center`/`@bottom-center` nested at-rules, or silently drop them.
// (2) Render (Chromium only, via a new `printToPdfAndExtractText` command in vitest.config.ts):
//     does the SAME print pipeline `window.print()` drives (Playwright's `page.pdf()` runs under
//     `print` CSS media, the real print rendering path, not a second renderer) actually PAINT that
//     content. Firefox has no `page.pdf()` in Playwright (verified this session — see below) so (2)
//     cannot run there; (1) is what carries Firefox's half of this probe's verdict, and its own
//     result is stated plainly rather than silently read as "fine".
//
// ── EMPIRICAL FINDINGS, THIS SESSION (Playwright 1.61.1, this repo's pinned version) ──────────
//
// PARSE (signal 1): Chromium's CSSOM RETAINS both nested margin-box at-rules verbatim. Firefox's
// CSSOM returns the `@page` rule with an EMPTY body — the nested at-rules are silently dropped at
// PARSE time, before rendering is even in question.
//
// RENDER (signal 2, Chromium only — Firefox's `page.pdf()` throws "PDF generation is only
// supported for Headless Chromium", a Playwright/automation limitation, not evidence about
// Firefox's own print engine): a PLAIN, TOP-LEVEL-DOCUMENT `@page` rule (no shadow root involved)
// DOES render margin-box content correctly — verified in an isolated scratch check outside this
// suite (a bare `page.setContent()` page, `@top-center`/`@bottom-center` both appeared in
// `page.pdf()`'s extracted text on every page). But D-7 places the rule inside `readerCss.ts`'s
// `READER_CSS`, injected into the reader's SHADOW ROOT (§3.2's own encapsulation) — and there, the
// SAME rule is INERT: the shadow tree's own content still paginates fine, but no margin-box text
// renders anywhere, on the real appShell-mounted surface 7.1's `exportPdf(host)` actually drives.
//
// VERDICT: margin-box running content is INADEQUATE via D-7's own mechanism, on BOTH engines — and
// for a STRONGER reason than "browser lacks support": Chromium DOES support the feature, but a
// shadow-scoped stylesheet cannot deliver it at all, independent of any future engine upgrade
// (unlike Firefox's gap, which a future Firefox release could close, this one is structural to
// WHERE the rule is declared). This is task 7.1's fork input; 7.1 rules on it (including whether
// relocating the rule to a document-level stylesheet is worth pursuing before pricing a PDF-
// generation dependency) — this task states the finding, it does not rule the fork.

import { describe, it, expect, afterEach } from 'vitest';
import { commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { enhanceCode } from '../../src/render/codeEnhancer';
import { enhanceTables } from '../../src/render/tableEnhancer';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { READER_CSS } from '../../src/theme/readerCss';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { CODE_TOOLBAR_CLASS } from '../../src/render/codeView';
import { TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    emulatePrintMedia(value: 'print' | 'screen' | null): Promise<void>;
    printToPdfAndExtractText(html: string): Promise<{
      ok: boolean;
      error: string | null;
      pageCount: number;
      perPageText: string[];
    }>;
  }
}

const VOID_ELEMENTS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW_TEXT_ELEMENTS = new Set(['style', 'script']);

/** Serializes a live element into an HTML string that PRESERVES its shadow trees, as Declarative
 *  Shadow DOM (`<template shadowrootmode="open">`) — plain `outerHTML` drops shadow-root content
 *  entirely, which would silently produce a PDF of an EMPTY reader. `open`-mode only, matching
 *  `mount.ts`'s own `SHADOW_MODE` — this app never uses closed shadow roots. Used ONLY to hand a
 *  real rendered DOM across the command boundary to a fresh, non-iframed page for PDF generation
 *  (see vitest.config.ts's `printToPdfAndExtractText` for why a fresh page is necessary). */
function serializeWithShadowRoots(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const attrs = el
    .getAttributeNames()
    .map((name) => ` ${name}="${(el.getAttribute(name) ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('');
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs}>`;

  let inner = '';
  const shadow = (el as HTMLElement).shadowRoot;
  if (shadow) {
    inner += '<template shadowrootmode="open">';
    for (const child of Array.from(shadow.childNodes)) inner += serializeWithShadowRoots(child);
    inner += '</template>';
  }
  if (RAW_TEXT_ELEMENTS.has(tag)) {
    inner += el.textContent ?? '';
  } else {
    for (const child of Array.from(el.childNodes)) inner += serializeWithShadowRoots(child);
  }
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

// ── Fixture: headings + a code fence + a table + enough filler to force several physical print
// pages (the @page probe needs a genuinely multi-page document, not one that happens to fit on
// page 1 — "present on every page" is only a meaningful check if there IS more than one page). ──
const FILLER = Array.from(
  { length: 220 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');
const CODE_FENCE = ['```ts', 'export const answer = 42;', '```'].join('\n');
const TABLE = ['| a | b |', '| --- | --- |', '| 1 | 2 |'].join('\n');

function buildLongFixture(): string {
  return [
    '# Print mode probe fixture',
    '',
    '## Section one',
    FILLER,
    '',
    '## Code section',
    CODE_FENCE,
    '',
    '## Table section',
    TABLE,
    '',
    '## Section two',
    FILLER,
  ].join('\n\n');
}

function resetAppShellRegistries(): void {
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
}

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function memorySource(text: string): FolderSource {
  const file: MarkdownFile = { path: 'doc.md', name: 'doc.md', read: async () => text };
  return { name: 'docs', truncated: false, persistable: false, files: [file] };
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Places a bare marker element under a class name this print block hides — for the pills whose
 *  triggering state (an active watch, a diff snapshot, the agent-file heuristic) this suite does
 *  not reproduce. The cascade does not care how an element entered the DOM; this is still a REAL
 *  engine reading the REAL shipped rule, not a jsdom stand-in. */
function injectPill(root: ShadowRoot | HTMLElement, className: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = className;
  root.appendChild(el);
  return el;
}

const INJECTED_PILL_CLASSES = [
  'peekover-watch',
  'peekover-watch-note',
  'peekover-watch-disclosure',
  'peekover-diff-affordance',
  'peekover-diff-picker',
  'peekover-diff-status',
  'peekover-agent-badge',
  'peekover-remote-load',
  'peekover-net',
  'peekover-diagram-lightbox',
  'peekover-diagram-actions',
];

const fullPageHosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
afterEach(async () => {
  for (const h of fullPageHosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
  await commands.emulatePrintMedia(null);
});

/** Surface 1: the full-page content-script-style host — `mount()` direct, no `contained`. */
function mountFullPage(doc: string = buildLongFixture()): { host: HTMLElement; shadow: ShadowRoot } {
  resetAppShellRegistries();
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  const shadow = host.shadowRoot!;
  enhanceCode(shadow.host as HTMLElement);
  enhanceTables(shadow.host as HTMLElement);
  return { host, shadow };
}

/** Surface 2: the contained app-page reader pane, through the real appShell (header + folders +
 *  reader). This is the ONLY surface 7.1's `exportPdf(host)` ever drives (§3.2) — production PDF
 *  export never reaches the content-script surface — so the render-side @page probe (below) uses
 *  this surface specifically. */
async function mountContained(
  doc: string = buildLongFixture(),
): Promise<{ container: HTMLElement; host: HTMLElement; shadow: ShadowRoot }> {
  resetAppShellRegistries();
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource(doc) }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!;
  fileBtn.click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'));
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));
  return { container, host, shadow: host.shadowRoot! };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// CHROME HIDDEN UNDER PRINT MEDIA — the easy, PASS-expected half (§4 print criteria)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('Print mode — reader chrome hidden, both surfaces, both engines (task 6.1)', () => {
  it('full-page host: every reader chrome pill + per-block toolbar is display:none under print', async () => {
    const { shadow } = mountFullPage();
    const injected = INJECTED_PILL_CLASSES.map((c) => injectPill(shadow, c));
    const codeToolbar = shadow.querySelector<HTMLElement>(`.${CODE_TOOLBAR_CLASS}`)!;
    const tableTools = shadow.querySelector<HTMLElement>(`.${TABLE_TOOLBAR_CLASS}`)!;
    const modeToggle = shadow.querySelector<HTMLElement>('.peekover-mode-toggle')!;
    const themeToggle = shadow.querySelector<HTMLElement>('.peekover-theme-toggle')!;
    const toc = shadow.querySelector<HTMLElement>('.peekover-toc')!;
    expect(codeToolbar).toBeTruthy();
    expect(tableTools).toBeTruthy();
    expect(modeToggle).toBeTruthy();
    expect(themeToggle).toBeTruthy();
    expect(toc).toBeTruthy();

    const allPills = [codeToolbar, tableTools, modeToggle, themeToggle, toc, ...injected];
    // `.peekover-net` is display:none by SCREEN default too (shown only on blocked media, per
    // remoteMediaUi.ts) — excluded from the "visible before print" firing control for that reason,
    // not exempted from the print assertion below.
    const visibleByDefault = allPills.filter((el) => el.className !== 'peekover-net');

    // SCREEN CONTROL — none of this is display:none before print media is engaged (a firing
    // control: if these were already hidden the print assertions below would be vacuous).
    for (const el of visibleByDefault) {
      expect(getComputedStyle(el).display).not.toBe('none');
    }

    await commands.emulatePrintMedia('print');
    for (const el of allPills) {
      expect(getComputedStyle(el).display).toBe('none');
    }
  });

  it('contained pane: reader chrome AND the app shell (header/folders) are display:none under print', async () => {
    const { container, shadow } = await mountContained();
    const injected = INJECTED_PILL_CLASSES.map((c) => injectPill(shadow, c));
    const codeToolbar = shadow.querySelector<HTMLElement>(`.${CODE_TOOLBAR_CLASS}`)!;
    const tableTools = shadow.querySelector<HTMLElement>(`.${TABLE_TOOLBAR_CLASS}`)!;
    const toc = shadow.querySelector<HTMLElement>('.peekover-toc')!;
    const header = container.querySelector<HTMLElement>('.peekover-app__header')!;
    const folders = container.querySelector<HTMLElement>('.peekover-app__folders')!;
    expect(codeToolbar).toBeTruthy();
    expect(tableTools).toBeTruthy();
    expect(toc).toBeTruthy();
    expect(header).toBeTruthy();
    expect(folders).toBeTruthy();

    const allPills = [codeToolbar, tableTools, toc, header, folders, ...injected];
    const visibleByDefault = allPills.filter((el) => el.className !== 'peekover-net');

    for (const el of visibleByDefault) {
      expect(getComputedStyle(el).display).not.toBe('none');
    }

    await commands.emulatePrintMedia('print');
    for (const el of allPills) {
      expect(getComputedStyle(el).display).toBe('none');
    }
  });

  it('★ Ruling 4: .peekover-code-toolbar hiding is a NEW rule; the EXISTING rule body is byte-unchanged', () => {
    // The exact, unmodified body M9 9.1 shipped (readerCss.ts:651-655 at HEAD before this task).
    const EXISTING_RULE = [
      '.peekover-reader .peekover-code-toolbar{',
      '  display:flex;flex-wrap:wrap;align-items:center;gap:6px;',
      '  margin-bottom:8px;',
      '  font-family:var(--sans);font-size:12px;color:var(--muted);',
      '}',
    ].join('\n');
    expect(READER_CSS).toContain(EXISTING_RULE);

    // The NEW print rule references the same class inside a DIFFERENT body, inside @media print —
    // never inside the existing rule's own braces, and never editing its declarations.
    const printBlockStart = READER_CSS.indexOf('@media print{');
    expect(printBlockStart).toBeGreaterThan(-1);
    const printBlockEnd = READER_CSS.indexOf('\n}\n@page{', printBlockStart);
    expect(printBlockEnd).toBeGreaterThan(printBlockStart);
    const printBlock = READER_CSS.slice(printBlockStart, printBlockEnd);
    expect(printBlock).toContain('.peekover-code-toolbar{display:none!important}');
    // The existing rule's own declarations never appear inside the print block.
    expect(printBlock).not.toContain('flex-wrap:wrap');
    expect(printBlock).not.toContain('margin-bottom:8px');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// DOCUMENT DE-CLIPPED UNDER PRINT — the fixed-viewport/internal-scroll bug this task also fixes
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('Print mode — the fixed-viewport / internal-scroll clip is defeated under print (task 6.1)', () => {
  it('full-page host: :host leaves position:fixed + overflow:auto under print', async () => {
    const { host } = mountFullPage();
    expect(getComputedStyle(host).position).toBe('fixed');
    expect(getComputedStyle(host).overflow).toBe('auto');
    await commands.emulatePrintMedia('print');
    expect(getComputedStyle(host).position).toBe('static');
    expect(getComputedStyle(host).overflow).toBe('visible');
  });

  it('contained pane: .peekover-app / .peekover-app__reader leave their clipping layout under print', async () => {
    const { container } = await mountContained();
    const shell = container.querySelector<HTMLElement>('.peekover-app')!;
    const reader = container.querySelector<HTMLElement>('.peekover-app__reader')!;
    expect(getComputedStyle(shell).position).toBe('fixed');
    expect(getComputedStyle(reader).overflow).toBe('auto');
    await commands.emulatePrintMedia('print');
    expect(getComputedStyle(shell).position).toBe('static');
    expect(getComputedStyle(reader).overflow).toBe('visible');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PAGE-BREAK RULES ON A LONG FIXTURE (§4 print criteria)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe('Print mode — page-break rules (task 6.1, §4)', () => {
  it('headings avoid a break AFTER; code/table/blockquote avoid a break INSIDE, under print', async () => {
    const { shadow } = mountFullPage();
    const heading = shadow.querySelector<HTMLElement>('.peekover-reader h2')!;
    const pre = shadow.querySelector<HTMLElement>('.peekover-reader pre')!;
    const table = shadow.querySelector<HTMLElement>('.peekover-reader table')!;
    expect(heading).toBeTruthy();
    expect(pre).toBeTruthy();
    expect(table).toBeTruthy();

    await commands.emulatePrintMedia('print');
    expect(getComputedStyle(heading).breakAfter).toBe('avoid');
    expect(getComputedStyle(pre).breakInside).toBe('avoid');
    expect(getComputedStyle(table).breakInside).toBe('avoid');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE @page MARGIN-BOX FIDELITY PROBE — THIS TASK'S PRIMARY OUTPUT (D-7, §3.6/§7-4)
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The shadow root's own `@page` rule(s) — both engines expose this via plain CSSOM, no seam
 *  needed. readerCss.ts writes ONE `@page{}` block (margin + the two nested margin-box at-rules
 *  together); if an engine drops the nested at-rules it does so INSIDE that same rule, never as a
 *  separate empty rule (verified this session against the real shipped `READER_CSS` text). */
function findPageRules(shadow: ShadowRoot): CSSRule[] {
  const rules: CSSRule[] = [];
  for (const styleEl of Array.from(shadow.querySelectorAll('style'))) {
    const sheet = (styleEl as HTMLStyleElement).sheet;
    if (!sheet) continue;
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule.type === CSSRule.PAGE_RULE) rules.push(rule);
    }
  }
  return rules;
}

describe('Print mode — the @page margin-box fidelity PROBE, per engine (task 6.1, D-7, §7-4)', () => {
  it('CSSOM-parse signal: does the engine retain the @top-center/@bottom-center at-rules at all', () => {
    const { shadow } = mountFullPage();
    const pageRules = findPageRules(shadow);
    // FIRING CONTROL: the ONE `@page{}` rule (margin + the two nested margin-box at-rules) must
    // parse and be readable in BOTH engines, retaining at least the plain `margin` declaration —
    // if this fails, the CSSOM read pipeline itself is broken and the margin-box signal below
    // would be meaningless.
    expect(pageRules.length).toBe(1);
    const pageRule = pageRules[0]!;
    expect(pageRule.cssText).toContain('2cm');

    const retainsMarginBoxContent = /@top-center|@bottom-center/.test(pageRule.cssText);

    // PINNED TO TODAY'S EMPIRICAL REALITY (verified this session, Playwright 1.61.1's bundled
    // engines) — Chromium RETAINS both nested at-rules verbatim; Firefox's CSSOM returns the rule
    // with an EMPTY body (`@page { }`), silently dropping them at PARSE time. This is the ONE
    // engine-sniffed assertion in this file, deliberately: if a future engine build changes this,
    // the test goes RED, forcing a re-measurement of 7.1's fork input rather than drifting stale.
    const isFirefox = navigator.userAgent.includes('Firefox');
    if (isFirefox) {
      expect(retainsMarginBoxContent).toBe(false);
    } else {
      expect(retainsMarginBoxContent).toBe(true);
    }
  });

  it('Chromium render signal: printToPdfAndExtractText finds the running content on EVERY page', async () => {
    // Runs on the CONTAINED app-page surface deliberately — 7.1's exportPdf(host) never drives the
    // content-script surface (§3.2), so this is the surface the finding actually needs to be about.
    const { container } = await mountContained();
    await commands.emulatePrintMedia('print');
    const html = serializeWithShadowRoots(container);
    const result = await commands.printToPdfAndExtractText(html);

    if (!result.ok) {
      // Firefox (or any engine without Playwright PDF support): the render signal is unavailable
      // here — verified this session, the message is the SPECIFIC known Playwright limitation, not
      // a generic failure this test is papering over.
      expect(result.error).toContain('Headless Chromium');
      return;
    }

    // FIRING CONTROL: the fixture's OWN distinguishing text must be present, proving the PDF was
    // really generated from THIS document and pdfjs-dist really extracted its text layer — an
    // absence-based finding below is worthless without this (the 1.1 firing-control lesson).
    const fullText = result.perPageText.join('\n');
    expect(fullText).toContain('Print mode probe fixture');
    expect(result.pageCount).toBeGreaterThan(1); // a genuinely multi-page fixture, "every page" is non-vacuous

    // NEGATIVE CONTROL: the app shell's own chrome text must NOT appear in the rendered PDF — proof
    // that the print CSS suppression is real in the ACTUAL print pipeline, not only under
    // emulateMedia's on-screen approximation.
    expect(fullText).not.toContain('Zero network by default');

    // THE PROBE ITSELF, AND THE FINDING IT SURFACED — NOT the simple "does Chromium support
    // margin boxes" question this task set out to measure (it does — see the CSSOM-parse test
    // above and this file's own module doc comment for the plain top-level-document control that
    // proves it). Measured this session, TWICE independently (this test's real appShell mount, and
    // a minimal imperative-`attachShadow` scratch replica): an `@page` rule whose OWN stylesheet
    // lives INSIDE A SHADOW ROOT — exactly where D-7 places it (`readerCss.ts`'s `READER_CSS`,
    // injected into the reader's shadow root, never the document) — is INERT for margin-box
    // purposes even in Chromium. The shadow tree's own CONTENT still paginates correctly (`pageCount`
    // above, `fullText`'s firing control above), but the page-box configuration itself is a
    // document-global concept the print pipeline never reads from a shadow-scoped stylesheet. This
    // is a STRONGER, more specific finding than "engine lacks support": the mechanism D-7 sealed
    // (readerCss.ts) cannot deliver margin-box content AT ALL, on either engine, regardless of
    // future browser support changes — moving the `@page` rule to a document-level stylesheet
    // (e.g. appShell.ts's APP_CSS) is the one variable this session did NOT re-test inside THIS
    // suite, but the isolated scratch replica confirms the SAME rule at the top level of a plain
    // document DOES render (this file's module doc comment); relocating it is 7.1's decision to
    // make, not 6.1's to silently perform.
    const headerPresent = result.perPageText.some((t) => t.includes('Peekover'));
    const footerPresent = result.perPageText.some((t) => /Page\s+\d+\s+of\s+\d+/.test(t));
    expect(headerPresent).toBe(false);
    expect(footerPresent).toBe(false);
  });
});
