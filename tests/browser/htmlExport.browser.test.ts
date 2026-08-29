// htmlExport — D-3's structural claim, real-engine or nothing (task 2.2).
//
// jsdom cannot open a downloaded file (tasks.md's own §010-class rule), so the ONE thing
// htmlExport.test.ts (unit/jsdom) cannot prove — that the TRANSLATED stylesheet actually applies
// once the document is opened bare, no shadow root, no extension, outside the runner's own origin
// — is proven here, on real Chromium AND Firefox (vitest.config.ts's `browser` project instances).
//
// SCOPE, stated because it is easy to overreach: this is 2.1's finding (b) handled correctly, not
// a full visual-equivalence audit of the whole exported document (that is 3.1's file-download exit
// and 11.1's milestone-close walk, per tasks.md's own group boundaries). What is asserted: the
// wrapper (`body`) actually receives the full-bleed base + the CHOSEN theme's tokens with no
// `:host` literal shipped, and the content the shadow root rendered is legible plain HTML outside
// any shadow tree — the qualitative proof that the translation, not just its unit-level string
// shape, holds up in a real engine.

import { describe, it, expect, afterEach } from 'vitest';
import { commands } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { serializeReaderDocument, wrapInStandaloneDocument } from '../../src/export/htmlExport';

interface StandaloneRenderProbe {
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
}

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    renderStandaloneDocument(html: string): Promise<StandaloneRenderProbe>;
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

describe('the standalone export, opened bare (no extension, no shadow root)', () => {
  it('applies the full-bleed base + the LIGHT theme, with no :host literal shipped', async () => {
    const host = mountedHost('# Exported Title\n\nHello *world*.\n', 'light');
    const { clone, theme } = serializeReaderDocument(host);
    const doc = wrapInStandaloneDocument(clone, theme);

    const probe = await commands.renderStandaloneDocument(doc);
    expect(probe.consoleErrors).toEqual([]);
    expect(probe.bodyPosition).toBe('fixed'); // readerCss.ts:58's base, carried onto body
    expect(probe.bodyBackgroundColor).toBe('rgb(251, 251, 248)'); // light --paper #FBFBF8
    expect(probe.hostSelectorLiteralPresent).toBe(false); // no dead :host text shipped
    expect(probe.h1Text).toBe('Exported Title');
  });

  it('bakes the DARK theme instead when that is what was painting at export time', async () => {
    const host = mountedHost('# Dark Export\n', 'dark');
    const { clone, theme } = serializeReaderDocument(host);
    const doc = wrapInStandaloneDocument(clone, theme);

    const probe = await commands.renderStandaloneDocument(doc);
    expect(probe.consoleErrors).toEqual([]);
    expect(probe.bodyBackgroundColor).toBe('rgb(18, 20, 28)'); // dark --paper #12141C
    expect(probe.h1Text).toBe('Dark Export');
  });
});
