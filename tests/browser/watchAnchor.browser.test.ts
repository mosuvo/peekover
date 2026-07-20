// Watch continuity — the REAL-ENGINE proofs for spec 005 group 3 (task 3.1; 3.2 extends this
// file).
//
// WHY THIS IS NOT A jsdom SUITE. Everything under test here is layout: which element actually
// scrolls (a COMPUTED overflow question), where a heading's top sits relative to a scroll box
// (`getBoundingClientRect`, all-zero in jsdom), and whether a restore lands the reader back at
// the same visual place after the document changed underneath it. jsdom can see none of it.
//
// ── TASK 3.1 — resolveScrollContainer, extracted and pinned ────────────────────────────────
//
// The extraction is a PURE MOVE, so its real proof is that `tocScroll.browser.test.ts` stays
// green UNCHANGED (it exercises the scroll-spy that consumes this function on both surfaces).
// What this file adds is the regression pin 003's in-code trap asked for and never had: the
// resolved ELEMENT IDENTITY per surface. Asserting "something scrollable came back" would pass
// against the exact bug the trap describes — a wrong root does not throw, it silently observes
// the viewport and tracks nothing. So both assertions here are `toBe`, against the element the
// surface is known to scroll: `:host` full-page, `.peekover-app__reader` when contained.

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { resolveScrollContainer } from '../../src/render/scrollContainer';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────

const FILLER = Array.from(
  { length: 24 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');

const SECTIONS = 8;

/** The base document: 8 well-separated h2 sections, each taller than the harness viewport. */
function buildDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SECTIONS; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Wait until the scroll box has laid out and its content actually overflows. mount() is
 *  synchronous but the engine lays out later, so an immediate `scrollTop` write clamps to 0. */
async function waitForScrollable(scroller: HTMLElement): Promise<void> {
  for (let i = 0; i < 150; i += 1) {
    if (scroller.scrollHeight > scroller.clientHeight + 4) return;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('scroll box never became scrollable (content did not overflow)');
}

/** Poll `scrollTop` until it stops changing (the full-page :host scrolls smoothly). */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 150; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return scroller.scrollTop;
}

// ── Surface 1: the full-page content-script takeover (:host is the scroll box) ───────────────

const fullPageHosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
});

/** A mounted surface, described uniformly so every property below is asserted on BOTH via
 *  describe.each — the structural close 6.1 used, one parameterised suite rather than two
 *  hand-written ones that drift. */
interface Surface {
  /** The shadow host mount() renders into. */
  host: HTMLElement;
  /** The element that ACTUALLY scrolls on this surface — the identity 3.1 must resolve to. */
  expectedScroller: HTMLElement;
  /** Whether this surface passes `{contained: true}` to mount(). */
  contained: boolean;
}

function mountFullPage(doc: string = buildDoc()): Surface {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  return {
    host,
    expectedScroller: host,
    contained: false,
  };
}

// ── Surface 2: the contained app-page reader pane (.peekover-app__reader is the scroll box) ──

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

async function mountContained(doc: string = buildDoc()): Promise<Surface> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', doc) }),
    store: fakeStore(),
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();

  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h2'));
  const pane = container.querySelector<HTMLElement>('.peekover-app__reader')!;
  return {
    host,
    expectedScroller: pane,
    contained: true,
  };
}

const SURFACES: { name: string; mount: (doc?: string) => Promise<Surface> }[] = [
  { name: 'full-page', mount: async (doc) => mountFullPage(doc) },
  { name: 'contained', mount: (doc) => mountContained(doc) },
];

// ── Task 3.1 — the extracted resolver, pinned by ELEMENT IDENTITY ───────────────────────────

describe.each(SURFACES)(
  'resolveScrollContainer — $name surface (task 3.1, the 003 trap pinned)',
  ({ mount: mountSurface }) => {
    it('resolves the EXACT element that scrolls on this surface (identity, not "something scrollable")', async () => {
      const s = await mountSurface();
      await waitForScrollable(s.expectedScroller);

      const resolved = resolveScrollContainer(s.host, s.contained);

      // IDENTITY, per 003's trap: `:host` full-page, the ancestor pane when contained. A
      // resolver that returned the host on BOTH surfaces passes any "is it scrollable" check
      // (the contained :host has overflow:auto from the base sheet) and fails this.
      expect(resolved).toBe(s.expectedScroller);

      // ...and the element it named is genuinely the one that moves, so the identity above is
      // anchored to observed behaviour rather than to our own expectation of the DOM shape.
      resolved.scrollTop = 300;
      expect(await settle(resolved)).toBeGreaterThan(0);
      resolved.scrollTop = 0;
      await settle(resolved);
    });
  },
);

describe('resolveScrollContainer — the degenerate fallback (task 3.1)', () => {
  it('falls back to the host when a contained mount has NO scrolling ancestor', async () => {
    // A host parented outside any scrolling pane. Returning the host keeps the resolved box a
    // valid shadow-including ancestor of the headings, so a consumer degrades rather than throws.
    const orphan = document.createElement('div');
    document.body.appendChild(orphan);
    fullPageHosts.push(orphan);
    const host = document.createElement('div');
    orphan.appendChild(host);
    mount(buildDoc(), host, { contained: true });

    expect(resolveScrollContainer(host, true)).toBe(host);
  });
});
