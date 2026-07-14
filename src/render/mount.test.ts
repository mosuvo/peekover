// @vitest-environment jsdom
//
// The mount stage composes the real parse -> sanitize pipeline into a shadow
// root. These tests run against jsdom (a real DOM, matching DOMPurify's own
// validation environment) and exercise: correct rendered output, that the output
// is sanitized, that re-render is idempotent (no duplicate roots / stale content),
// and that the media seam is a no-op in M1. The throw -> raw-fallback path lives
// in mount.fallback.test.ts (it needs a mocked stage).

import { describe, it, expect } from 'vitest';
import { mount } from './mount';

function makeHost(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  return host;
}

/**
 * Every element in the committed tree (light DOM + our shadow root) that carries a
 * fetch-capable URL resolving to http(s) — the no-leak proxy. jsdom does not actually
 * load subresources, so "no such element in the committed DOM" stands in for "no
 * request fired": in a real engine, any connected element with a remote src/srcset
 * WOULD have fetched on insertion.
 */
function remoteRefs(host: HTMLElement): string[] {
  const refs: string[] = [];
  const roots: ParentNode[] = [document, host.shadowRoot].filter(Boolean) as ParentNode[];
  for (const rootNode of roots) {
    for (const el of rootNode.querySelectorAll('*')) {
      for (const attr of ['src', 'srcset']) {
        const v = el.getAttribute(attr);
        // http:, https:, or protocol-relative (which resolves to http(s) on any web page).
        if (v && /^\s*(https?:|\/\/)/i.test(v)) refs.push(`${el.tagName}[${attr}]=${v}`);
      }
    }
  }
  return refs;
}

/**
 * Same fetch-capable-URL proxy as remoteRefs, but scoped to a single node's own
 * subtree (the node itself + descendants) rather than the live document. Used by the
 * ordering test to inspect exactly the nodes handed to replaceChildren AT COMMIT TIME.
 */
function remoteRefsIn(node: Node): string[] {
  const refs: string[] = [];
  if (!(node instanceof Element)) return refs;
  for (const el of [node, ...node.querySelectorAll('*')]) {
    for (const attr of ['src', 'srcset']) {
      const v = el.getAttribute(attr);
      if (v && /^\s*(https?:|\/\/)/i.test(v)) refs.push(`${el.tagName}[${attr}]=${v}`);
    }
  }
  return refs;
}

describe('mount — parse -> sanitize -> shadow DOM', () => {
  it('mounts rendered HTML into an OPEN shadow root', () => {
    const host = makeHost();
    mount('# Title\n\n- one\n- two', host);

    expect(host.shadowRoot).not.toBeNull();
    // Open root is inspectable — the whole point of mode:'open'.
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('h1')?.textContent).toBe('Title');
    const items = shadow.querySelectorAll('li');
    expect([...items].map((li) => li.textContent)).toEqual(['one', 'two']);
  });

  it('themes the reader: injects the token stylesheet + sets data-theme on the host', () => {
    const host = makeHost();
    mount('# Title', host);
    const shadow = host.shadowRoot!;

    // The tokens stylesheet is committed into the shadow root (not the page).
    const style = shadow.querySelector('style');
    expect(style?.textContent).toContain('--paper:#FBFBF8');
    expect(style?.textContent).toContain('76ch');
    // Auto theme applied to the host (light in jsdom — no matchMedia).
    expect(host.getAttribute('data-theme')).toBe('light');
    // Content still present alongside the style.
    expect(shadow.querySelector('.peekover-reader h1')?.textContent).toBe('Title');
  });

  it('renders formatted HTML, not raw text (bold, headings survive)', () => {
    const host = makeHost();
    mount('## Sub\n\nsome **bold** text', host);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('h2')?.textContent).toBe('Sub');
    expect(shadow.querySelector('strong')?.textContent).toBe('bold');
  });

  it('sanitizes: a <script> payload never reaches the DOM, benign text survives', () => {
    const host = makeHost();
    mount('ok text\n\n<script>alert(1)</script>', host);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.innerHTML).not.toContain('alert(');
    expect(shadow.textContent).toContain('ok text');
  });

  it('is idempotent: re-render replaces content with no duplicate roots', () => {
    const host = makeHost();
    mount('# First', host);
    const firstRoot = host.shadowRoot;

    mount('# Second\n\n- x', host);
    const shadow = host.shadowRoot!;

    // Same shadow root instance reused (attachShadow only ever called once).
    expect(host.shadowRoot).toBe(firstRoot);
    // Exactly one reader root — old content fully replaced, not appended.
    expect(shadow.querySelectorAll('.peekover-reader').length).toBe(1);
    expect(shadow.querySelectorAll('h1').length).toBe(1);
    expect(shadow.querySelector('h1')?.textContent).toBe('Second');
    expect(shadow.textContent).not.toContain('First');
  });

  it('blocks a remote <img> by default: src moves to data-peekover-src, no fetchable src', () => {
    const host = makeHost();
    mount('![alt text](https://example.com/i.png "a title")', host);
    const shadow = host.shadowRoot!;

    // The <img> is gone — replaced by an inert placeholder (nothing to fetch).
    expect(shadow.querySelector('img')).toBeNull();
    const ph = shadow.querySelector('.peekover-remote');
    expect(ph).not.toBeNull();
    expect(ph?.getAttribute('data-peekover-src')).toBe('https://example.com/i.png');
    expect(ph?.getAttribute('data-peekover-alt')).toBe('alt text');
    expect(ph?.getAttribute('data-peekover-title')).toBe('a title');
    // The placeholder shows the label + alt text.
    expect(ph?.querySelector('.peekover-remote__badge')?.textContent).toBe('remote image');
    expect(ph?.querySelector('.peekover-remote__alt')?.textContent).toBe('alt text');
  });

  it('NO-LEAK: committing a doc of remote images leaves zero fetchable src/srcset', () => {
    const host = makeHost();
    // DOM-SHAPE GUARD ONLY: jsdom loads no subresources, so this proves the committed
    // tree holds nothing fetchable — NOT that zero bytes hit the wire. The real
    // bytes-on-wire guard is tests/browser/remoteMedia.browser.test.ts (Resource Timing
    // in real Chromium + Firefox); a leak upstream of the committed shape is invisible here.
    // The REAL pipeline, committed to a live shadow the way mount() does. If any
    // remote src survived to the live tree, a real browser would have fetched it.
    mount(
      [
        '![one](https://example.com/1.png)',
        '',
        '![two](http://example.org/2.jpg)',
        '',
        'inline ![three](https://cdn.example.net/3.gif) here',
      ].join('\n'),
      host,
    );
    expect(remoteRefs(host)).toEqual([]);
    // And the opt-in reports all three.
    expect(host.shadowRoot!.querySelector('.peekover-remote-load')?.textContent).toBe(
      '3 remote images blocked · Load',
    );
  });

  it('ORDERING: neutralizes remote media BEFORE committing the tree (replaceChildren)', () => {
    // DOM-SHAPE GUARD ONLY: this pins neutralize-before-commit at the replaceChildren
    // seam, but the shipped leak fired UPSTREAM of it (at innerHTML, before commit), so
    // this test stayed green through the whole bug. The bytes-on-wire guard is
    // tests/browser/remoteMedia.browser.test.ts — trust that one for "no request fired".
    // The NO-LEAK test above inspects FINAL DOM state, so a policy that ran AFTER
    // replaceChildren would still pass it — yet in a real engine the remote <img>s
    // would already have fetched the instant they were inserted. jsdom fires no such
    // request, so final-state checks are blind to this ordering. This test closes that
    // gap by pinning the ordering itself: we patch the shadow root's replaceChildren
    // and, at the moment of commit, walk the exact nodes being handed to it and assert
    // the tree is ALREADY neutralized — not merely eventually.
    const host = makeHost();
    const proto = ShadowRoot.prototype;
    const original = proto.replaceChildren;
    const seenAtCommit: string[] = [];
    let commits = 0;
    proto.replaceChildren = function (this: ShadowRoot, ...nodes: Node[]) {
      commits++;
      for (const node of nodes) seenAtCommit.push(...remoteRefsIn(node));
      return original.apply(this, nodes);
    };
    try {
      mount(
        ['![one](https://example.com/1.png)', '', '![two](http://example.org/2.jpg)'].join(
          '\n',
        ),
        host,
      );
    } finally {
      proto.replaceChildren = original; // restore for the rest of the suite
    }

    // The commit happened, and the subtree it committed carried zero fetch-capable
    // remote refs: neutralize-before-commit, the ordering the module header requires.
    expect(commits).toBeGreaterThan(0);
    expect(seenAtCommit).toEqual([]);
  });

  it('opt-in restores the images (loading="lazy") and lights the network indicator', () => {
    const host = makeHost();
    mount('![pic](https://example.com/pic.png)', host);
    const shadow = host.shadowRoot!;

    // Pre-opt-in: indicator is not lit, no live <img>, and a network light exists but dark.
    expect(host.hasAttribute('data-network')).toBe(false);
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelector('.peekover-net')).not.toBeNull();

    const loadBar = shadow.querySelector<HTMLButtonElement>('.peekover-remote-load')!;
    expect(loadBar).not.toBeNull();
    loadBar.click();

    // Post-opt-in: placeholder is now a real <img> with the original src + lazy loading,
    // the indicator is lit, and the one-shot pill removed itself.
    const img = shadow.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/pic.png');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(host.getAttribute('data-network')).toBe('active');
    expect(shadow.querySelector('.peekover-remote')).toBeNull();
    expect(shadow.querySelector('.peekover-remote-load')).toBeNull();
  });

  it('a document with no remote images shows no opt-in and no indicator', () => {
    const host = makeHost();
    mount('# Just text\n\nno images at all', host);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('.peekover-remote-load')).toBeNull();
    expect(shadow.querySelector('.peekover-net')).toBeNull();
    expect(host.hasAttribute('data-network')).toBe(false);
  });
});
