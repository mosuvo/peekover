// @vitest-environment jsdom
//
// htmlExport — serializeReaderDocument/translateReaderStylesheet/wrapInStandaloneDocument/
// downloadAs/exportHtml (tasks 2.2 + 3.1, D-3 + finding (b)'s :host translation).
//
// jsdom-safe vs real-engine, stated per AGENTS.md's own standing rule: everything asserted here is
// DOM SHAPE, string content, or a reference-identity check — never layout, computed style, or
// "does this render correctly outside a shadow root." D-3's "renders visually equivalent"
// standalone claim, and the real file-download codepath, are real-engine-or-nothing
// (tests/browser/htmlExport.browser.test.ts) and are NOT re-asserted here.
//
// No `collectLocalImages`/`LocalImageRef` tests here — that resolution machinery was removed at
// task 3.1 (§3.1 gate ruling, decisions.md 2026-08-29): `serializeReaderDocument` no longer
// computes an image partition, so there is nothing left of that shape to test.

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '../render/mount';
import { READER_CSS } from '../theme/readerCss';
import {
  serializeReaderDocument,
  translateReaderStylesheet,
  wrapInStandaloneDocument,
} from './htmlExport';

// `downloadAs`/`exportHtml` (task 3.1) are NOT unit-tested here: their mechanics (Blob,
// `URL.createObjectURL`, a synthetic anchor click) are the exact shape `diagramView.ts`'s
// `downloadDiagramAsSvg` already established for 007's diagram-download control, real-engine-
// tested only (`tests/browser/diagramActions.browser.test.ts`) — jsdom implements neither
// `URL.createObjectURL` nor real anchor-download semantics, and AGENTS.md's own standing rule
// is that a pattern mirroring already-established precedent doesn't earn its own per-extension
// ablation. `exportHtml`'s own composition (serialize → wrap) is already covered by
// `serializeReaderDocument`/`wrapInStandaloneDocument`'s tests above; the file-download exit
// itself is proven in `tests/browser/htmlExport.browser.test.ts`.

const HOST_TAG = 'peekover-root';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

/** A real mounted reader: parse -> sanitize -> shadow DOM, exactly as both surfaces commit it —
 *  the tableEnhancer.test.ts precedent, reused so fixtures are real render output, never hand-built. */
function mountedHost(markdown: string): HTMLElement {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
  return host;
}

describe('serializeReaderDocument', () => {
  it('clones .peekover-reader without mutating the live tree', () => {
    const host = mountedHost('# Title\n\nSome *text*.\n');
    const before = host.shadowRoot!.querySelector('.peekover-reader')!;
    const beforeHtml = before.innerHTML;

    const { clone } = serializeReaderDocument(host);

    const after = host.shadowRoot!.querySelector('.peekover-reader')!;
    expect(after).toBe(before); // reference-identity: still the SAME live node
    expect(after.innerHTML).toBe(beforeHtml); // and its content is untouched
    expect(clone).not.toBe(before); // the clone is a DIFFERENT node
    expect(clone.outerHTML).toBe(before.outerHTML); // but structurally equivalent
  });

  it('reports the effective theme painting on the host', () => {
    const host = mountedHost('# Doc\n');
    host.setAttribute('data-theme', 'dark');
    expect(serializeReaderDocument(host).theme).toBe('dark');
    host.setAttribute('data-theme', 'sepia');
    expect(serializeReaderDocument(host).theme).toBe('sepia');
    host.removeAttribute('data-theme');
    expect(serializeReaderDocument(host).theme).toBe('light');
  });

  it('throws a descriptive error when the host has no .peekover-reader (never a silent empty export)', () => {
    const host = document.createElement(HOST_TAG);
    document.body.appendChild(host);
    hosts.push(host);
    host.attachShadow({ mode: 'open' });
    expect(() => serializeReaderDocument(host)).toThrow(/peekover-reader/);
  });
});

describe('translateReaderStylesheet — the :host translation (finding (b))', () => {
  it('pins the LIVE READER_CSS at exactly 25 :host-scoped rule sites', () => {
    // Task 2.1's own finding (decisions.md, progress.md) counts 26 :host rule sites — but that
    // grep ran over the WHOLE FILE, which also exports CONTAINED_CSS. This module only ever
    // translates READER_CSS's own text (see the module doc comment on why CONTAINED_CSS is out
    // of scope BY CONSTRUCTION, never fed into `translateReaderStylesheet` at all) — so READER_CSS
    // alone carries 25 of the 26; the 26th (`readerCss.ts:1191`, CONTAINED_CSS's own `:host{
    // position:relative; inset:auto; }`) is resolved by SCOPE, not by classification.
    const { diagnostics } = translateReaderStylesheet('light');
    expect(diagnostics.hostSiteCount).toBe(25);
    expect(diagnostics.carried + diagnostics.resolved + diagnostics.dropped).toBe(25);
  });

  it('CARRY: translates bare :host to body, unconditionally, in every theme', () => {
    for (const theme of ['light', 'dark', 'sepia'] as const) {
      const { css } = translateReaderStylesheet(theme);
      expect(css).toContain('body{'); // the base full-bleed block (readerCss.ts:58)
      expect(css).toContain('body *,body *::before,body *::after{box-sizing:border-box}');
      expect(css).toContain('body :focus-visible{');
      expect(css).toContain('body ::selection{');
      expect(css).toContain('--reader-measure:748px');
      expect(css).not.toMatch(/:host/); // no live :host selector survives translation
    }
  });

  it('RESOLVE: bakes exactly the export\'s own theme, drops the other two', () => {
    const dark = translateReaderStylesheet('dark').css;
    expect(dark).toContain('--paper:#12141C'); // dark tokens (readerCss.ts:43)
    expect(dark).toContain('body .peekover-reader a{background:linear-gradient(transparent 88%');
    expect(dark).not.toContain('--paper:#F6EEDF'); // sepia tokens never ride along

    const sepia = translateReaderStylesheet('sepia').css;
    expect(sepia).toContain('--paper:#F6EEDF');
    expect(sepia).not.toContain('--paper:#12141C');

    const light = translateReaderStylesheet('light').css;
    expect(light).not.toContain('--paper:#12141C');
    expect(light).not.toContain('--paper:#F6EEDF');
  });

  it('DROP: no :host-gated live-toggle attribute predicate survives, in any theme', () => {
    // NOTE: base (non-:host) chrome selectors like `.peekover-toc{…}` legitimately ship
    // verbatim — not :host-scoped, out of THIS rule's scope (see the "non-:host rules ship
    // byte-for-byte unchanged" test below), dead weight for the same reason
    // `.peekover-diagram-lightbox` is: D-3's original framing, not finding (b)'s. Some of
    // those non-:host rules carry an attribute predicate of THEIR OWN too (e.g.
    // `.peekover-diff-affordance[data-diff-open="true"]`), so this asserts the EXACT
    // attribute=value predicates the dropped :host(…) rules were gated on, never a bare
    // substring that a coincidental non-:host attribute name could also satisfy.
    for (const theme of ['light', 'dark', 'sepia'] as const) {
      const { css } = translateReaderStylesheet(theme);
      expect(css).not.toContain('[data-mode="reading"]');
      expect(css).not.toContain('[data-mode="raw"]');
      expect(css).not.toContain('[data-diff="active"]');
      expect(css).not.toContain('[data-watch="active"]');
      expect(css).not.toContain('[data-network="active"]');
      expect(css).not.toContain('[data-toc="collapsed"]');
      expect(css).not.toContain('[data-toc="open"]');
    }
  });

  it('DROP: the data-toc="open" reader-margin rule never ships (the enumerated trap case)', () => {
    const { css } = translateReaderStylesheet('light');
    expect(css).not.toContain('margin-right:var(--toc-w)');
  });

  it('non-:host rules ship byte-for-byte unchanged (typography, tables, diagrams, …)', () => {
    const { css } = translateReaderStylesheet('light');
    expect(css).toContain('.peekover-reader h1{font-size:44px');
    expect(css).toContain('.peekover-reader table{');
    // Sibling-chrome, non-:host rules (e.g. the lightbox) still ship verbatim — that dead weight is
    // D-3's ORIGINAL "bundle the stylesheet" framing, out of finding (b)'s :host-only scope.
    expect(css).toContain('.peekover-diagram-lightbox{');
  });

  it('DRIFT GUARD — red-first: a :host rule ADDED to the source moves the pinned count, live', () => {
    const injected = ':host([data-theme="dark"]) .peekover-reader h9{color:red}\n';
    const ablatedSource = READER_CSS + injected;
    expect(ablatedSource).not.toBe(READER_CSS); // the injection actually landed in the fixture

    const before = translateReaderStylesheet('dark').diagnostics.hostSiteCount;
    const after = translateReaderStylesheet('dark', ablatedSource).diagnostics.hostSiteCount;
    expect(after).toBe(before + 1); // the counter tracks the LIVE text, not a hardcoded 26

    const { css: darkAblated } = translateReaderStylesheet('dark', ablatedSource);
    expect(darkAblated).toContain('body .peekover-reader h9{color:red}'); // the new rule resolves
    const { css: lightAblated } = translateReaderStylesheet('light', ablatedSource);
    expect(lightAblated).not.toContain('h9{color:red}'); // and drops on a non-matching theme
  });

  it('throws on a shape the flat-rule/one-level-nesting parser does not model (loud, not silent)', () => {
    const unbalanced = '.foo{color:red';
    expect(() => translateReaderStylesheet('light', unbalanced)).toThrow();
  });
});

describe('wrapInStandaloneDocument', () => {
  it('emits a standalone doctype + <style> + the clone, structurally', () => {
    const host = mountedHost('# Title\n\nHello.\n');
    const { clone, theme } = serializeReaderDocument(host);
    const doc = wrapInStandaloneDocument(clone, theme);
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<style>');
    expect(doc).toContain('class="peekover-reader"');
    expect(doc).toContain('<h1>Title</h1>');
  });

  it('carries no per-node inline style attributes (D-3\'s interpretation note: a bundled <style> block only)', () => {
    const host = mountedHost('# Title\n\nHello *world*.\n');
    const { clone, theme } = serializeReaderDocument(host);
    const doc = wrapInStandaloneDocument(clone, theme);
    expect(doc).not.toMatch(/ style="/);
  });
});
