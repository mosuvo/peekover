// diffView — the REAL-ENGINE proofs for task 6.1 (the diff VIEW, D-15).
//
// WHY THIS IS NOT A jsdom SUITE. Everything under test is layout the engine alone can see:
// `display:none` on the reading column (jsdom is layout-blind), and a reading-anchor restore that
// depends on scroll geometry (`getBoundingClientRect`, all-zero in jsdom). The reading-anchor
// LADDER is unit-tested in `src/render/readingAnchor.test.ts`; this file proves the diff's
// enter/exit visibility, that BOTH sides are sanitized, the anchor round-trip across the
// hidden-column rung, the fallback, and mount()'s clear-on-switch — on both surfaces via
// describe.each (the M6 "one parameterised suite, never two" rule).
//
// THE HUNK TYPE IS IMPORTED FROM THE ENGINE HERE ON PURPOSE. `diffView.ts` mirrors `DiffHunk`
// structurally rather than importing it (so the source-text import fence stays green — see
// diffView.ts's header). A test file is fence-exempt, so it imports the REAL `DiffHunk` from
// `./diffEngine` and hands it to `enterDiff`: if the mirror ever drifts from the canonical shape,
// THIS import stops type-checking under `tsc --noEmit`. That is the drift guard the mirror relies on.

import { describe, it, expect, afterEach, vi } from 'vitest';

// Hoisted so the vi.mock factory (hoisted above the imports) can read it — the readerSource.browser
// precedent. Off by default; the fallback test flips it around the single failing enterDiff.
const injected = vi.hoisted(() => ({ parseShouldThrow: false }));

vi.mock('../../src/render/parse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/render/parse')>();
  return {
    ...actual,
    parse: (markdown: string): string => {
      if (injected.parseShouldThrow) throw new Error('forced parse failure (test-only)');
      return actual.parse(markdown);
    },
  };
});

import { mount } from '../../src/render/mount';
import { enterDiff, exitDiff, DIFF_VIEW_CLASS } from '../../src/render/diffView';
import type { DiffHunk } from '../../src/render/diffEngine';
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

/** 8 well-separated h2 sections, each taller than the harness viewport (from watchAnchor). */
function buildDoc(): string {
  const parts: string[] = [];
  for (let i = 1; i <= SECTIONS; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n');
}

/** Hand-crafted hunks with a script-injection payload on BOTH the added and the removed side —
 *  both are untrusted markdown (§3.8). Typed as the engine's DiffHunk (the drift guard). */
const SCRIPT_HUNKS: DiffHunk[] = [
  { kind: 'unchanged', lines: ['Unchanged prose line.'] },
  { kind: 'added', lines: ['Added prose line.', '<script>window.__pwn_added=1</script>'] },
  { kind: 'removed', lines: ['Removed prose line.', '<script>window.__pwn_removed=1</script>'] },
];

async function waitFor<T>(fn: () => T | null | undefined, tries = 150): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Wait until the scroll box overflows AND its content height has stopped changing (watchAnchor's
 *  load-bearing "settled, not merely overflowing" precondition — a stale offset silently clamps). */
async function waitForScrollable(scroller: HTMLElement): Promise<void> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 200; i += 1) {
    const h = scroller.scrollHeight;
    if (h > scroller.clientHeight + 4 && h === prev) {
      stable += 1;
      if (stable >= 3) return;
    } else {
      stable = 0;
    }
    prev = h;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('scroll box never settled');
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

/** Vertical offset of an element's top relative to the scroll box's top. */
function topOffset(el: Element, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

function readerRoot(host: HTMLElement): HTMLElement {
  return host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
}

function diffEl(host: HTMLElement): HTMLElement | null {
  return host.shadowRoot!.querySelector<HTMLElement>(`.${DIFF_VIEW_CLASS}`);
}

function headingByText(host: HTMLElement, text: string): Element {
  return [...host.shadowRoot!.querySelectorAll('.peekover-reader h2')].find(
    (h) => (h.textContent ?? '').trim() === text,
  )!;
}

function isHidden(el: HTMLElement): boolean {
  return getComputedStyle(el).display === 'none';
}

// ── Surfaces (watchAnchor's shape) ────────────────────────────────────────────────────────────

interface Surface {
  host: HTMLElement;
  scroller: HTMLElement;
  contained: boolean;
  remount(text: string): void;
}

const fullPageHosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
afterEach(() => {
  injected.parseShouldThrow = false;
  for (const h of fullPageHosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
});

function mountFullPage(doc: string = buildDoc()): Surface {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  fullPageHosts.push(host);
  mount(doc, host);
  return { host, scroller: host, contained: false, remount: (t) => mount(t, host) };
}

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
  return { host, scroller: pane, contained: true, remount: (t) => mount(t, host, { contained: true }) };
}

const SURFACES: { name: string; mount: (doc?: string) => Promise<Surface> }[] = [
  { name: 'full-page', mount: async (doc) => mountFullPage(doc) },
  { name: 'contained', mount: (doc) => mountContained(doc) },
];

// ── The proofs ────────────────────────────────────────────────────────────────────────────────

describe.each(SURFACES)('diffView — $name surface (task 6.1, D-15)', ({ mount: mountSurface }) => {
  it('enters: data-diff active, reading column hidden, a sanitized block per kind, both sides scrubbed', async () => {
    const s = await mountSurface();

    const result = enterDiff(s.host, SCRIPT_HUNKS);
    expect(result.ok).toBe(true);

    // D-15: the attribute flip, and the reading column hides via CSS (not a DOM edit).
    expect(s.host.getAttribute('data-diff')).toBe('active');
    expect(isHidden(readerRoot(s.host))).toBe(true);

    const diff = diffEl(s.host)!;
    expect(diff).not.toBeNull();
    // One block per kind, in order.
    expect(diff.querySelector('.diff-unchanged')).not.toBeNull();
    const added = diff.querySelector<HTMLElement>('.diff-added')!;
    const removed = diff.querySelector<HTMLElement>('.diff-removed')!;
    expect(added).not.toBeNull();
    expect(removed).not.toBeNull();

    // §3.8 / AGENTS.md #3 — BOTH sides go through parse→sanitize: no <script> survives on either.
    expect(diff.querySelectorAll('script').length).toBe(0);
    expect(added.querySelector('script')).toBeNull();
    expect(removed.querySelector('script')).toBeNull();
    // ...and the scrub is non-vacuous: the benign prose on each side DID render (sanitize didn't
    // simply nuke everything), and neither injected script ever ran.
    expect(added.textContent).toContain('Added prose line.');
    expect(removed.textContent).toContain('Removed prose line.');
    expect((window as unknown as Record<string, unknown>).__pwn_added).toBeUndefined();
    expect((window as unknown as Record<string, unknown>).__pwn_removed).toBeUndefined();
  });

  it('exits: data-diff cleared, reading column visible again, diff sibling removed', async () => {
    const s = await mountSurface();

    enterDiff(s.host, SCRIPT_HUNKS);
    expect(s.host.hasAttribute('data-diff')).toBe(true);

    exitDiff(s.host);

    expect(s.host.hasAttribute('data-diff')).toBe(false);
    expect(isHidden(readerRoot(s.host))).toBe(false);
    expect(diffEl(s.host)).toBeNull();
  });

  it('restores the reading place across enter→exit (the hidden-column rung), non-vacuously', async () => {
    const s = await mountSurface();
    const scroller = s.scroller;
    await waitForScrollable(scroller);

    // Read mid-document, scrolled 40px PAST Section 5's top (a non-zero delta the anchor carries).
    const target = 'Section 5';
    const before = headingByText(s.host, target);
    scroller.scrollTop = scroller.scrollTop + topOffset(before, scroller) + 40;
    await settle(scroller);
    const offsetBefore = topOffset(before, scroller);
    expect(offsetBefore).toBeLessThan(60); // genuinely near the top of the viewport

    enterDiff(s.host, SCRIPT_HUNKS);
    // While the diff is up, the SAME scroll box is scrolled elsewhere — so a no-op exit would leave
    // the reader at the top, not where it was reading. This is the non-vacuity control.
    scroller.scrollTop = 0;
    await settle(scroller);

    exitDiff(s.host);
    await settle(scroller);

    // Same heading, same offset — the reading place is restored, not the diff's scroll pixels.
    const offsetAfter = topOffset(headingByText(s.host, target), scroller);
    expect(Math.abs(offsetAfter - offsetBefore)).toBeLessThan(8);
    // ...and demonstrably NOT the top the diff was left at (non-vacuous).
    expect(offsetAfter).toBeLessThan(60);
  });

  it('fallback: a render failure returns ok:false, sets no data-diff, inserts nothing, leaves the reader visible', async () => {
    const s = await mountSurface();

    injected.parseShouldThrow = true;
    const result = enterDiff(s.host, SCRIPT_HUNKS);
    injected.parseShouldThrow = false;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
    // The document stays exactly on screen (plan §1.5): no attribute, no sibling, reader visible.
    expect(s.host.hasAttribute('data-diff')).toBe(false);
    expect(diffEl(s.host)).toBeNull();
    expect(isHidden(readerRoot(s.host))).toBe(false);
  });

  it('mount() clears data-diff on a document switch (a diff never crosses a switch, D-15)', async () => {
    const s = await mountSurface();

    enterDiff(s.host, SCRIPT_HUNKS);
    expect(s.host.getAttribute('data-diff')).toBe('active');

    // A fresh mount() simulates the next document arriving underneath a shown diff.
    s.remount('# Fresh document\n\nbody after the switch.');

    expect(s.host.hasAttribute('data-diff')).toBe(false);
    expect(isHidden(readerRoot(s.host))).toBe(false);
    expect(diffEl(s.host)).toBeNull();
  });
});
