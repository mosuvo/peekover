// TOC zero-network guard — the REAL-ENGINE bytes-on-wire proof (task 4.1, §6 R4).
// AGENTS.md #1 ("zero network by default") made testable for the TOC: NOTHING the rail
// does — build it, click-to-scroll, scroll-spy, collapse a subtree, toggle via the opener
// or the backtick shortcut, drag the resizer — may put a byte on the wire. The rail is pure
// DOM/CSS and its behaviors are scroll/IntersectionObserver/pointer work; none issues a
// request. This suite PROVES that, rather than trusting it.
//
// Why real-engine (the retro standing rule): jsdom is blind to bytes-on-wire — it loads no
// subresources, so "no fetchable node in the tree" is only a PROXY. The M1 remote-image leak
// shipped straight through a green jsdom stack for exactly this reason (progress.md
// 2026-07-14). So this guard asserts on the engine's OWN Resource Timing buffer, where an
// entry appears ONLY when Chromium/Firefox actually put a request on the wire. It mirrors the
// established discipline of remoteMedia.browser.test.ts and folderMode.network.browser.test.ts
// verbatim: clear the buffer, exercise the code, read `performance.getEntriesByType('resource')`.
//
// SCOPING (honest): the reader is zero-network by default and the doc used here is a plain
// heading+prose document — NO remote media, NO code fences (Shiki), NO math (KaTeX), NO mermaid
// — so nothing on the render path lazy-loads a chunk or fetches a subresource. The whole
// module graph (mount/tocView/appShell/…) is statically imported at file load, before any
// measured window, so building the rail after a `clearResourceTimings()` triggers no import.
// Therefore ANY http(s) entry that appears during a measured window is a genuine TOC-attributable
// leak, not incidental traffic. We filter to http(s) and assert the count is ZERO after every
// action and cumulatively, on BOTH surfaces (full-page content-script host + contained app-page
// pane) and BOTH engines.
//
// NON-VACUITY / CONTROL FIRST (the load-bearing part): before trusting any zero, a same-origin
// control `fetch` is shown to LAND in the same buffer through the same `flush()` window — proving
// the observer genuinely sees requests in this engine, so a "zero" cannot pass by the observer
// being blind. The same buffer + same http(s) filter + same `toEqual([])` check backs every
// per-action zero-assert, so a leak from ANY TOC action would land there identically and fail the
// assert. A final control repeats the demonstration AFTER all the zero-asserts, proving the
// observer stayed live throughout. RED-FIRST was additionally demonstrated out-of-band by
// temporarily adding a `fetch()` to a TOC handler (the opener click), which made the matching
// per-action assert go red on both engines; reverted (recorded in progress.md). Every control URL
// is SAME-ORIGIN, so even a regression would hit the vitest dev server (a 404), never the public
// internet — but http(s) still classifies as an on-wire entry exactly as a CDN URL would.

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '../../src/render/mount';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

let seq = 0;
const nextId = (): string => `toc${(seq += 1)}-${Math.trunc(performance.now())}`;

// A macrotask + rAF + settle — long enough that any request fired during the window has
// reached the Resource Timing buffer (mirrors remoteMedia/folderMode browser tests). If a
// request fired it is recorded within this window; if none did the buffer stays empty no matter
// how long we wait — so this is a sound "zero requests" proof.
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/** The http(s) resource-timing entry names currently in the buffer (all on-wire requests). */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** Flush and assert NOTHING new hit the wire — the buffer was cleared before the measured
 *  window, so any http(s) entry here is a TOC-attributable leak. `label` names the action so a
 *  failure points at the exact one. */
async function assertNoNetwork(label: string): Promise<void> {
  await flush();
  expect(networkedUrls(), `TOC action "${label}" put bytes on the wire`).toEqual([]);
}

/** CONTROL: a same-origin fetch that MUST register in the buffer — proves the observer can see a
 *  request in this engine through this exact `flush()` window, so every zero-assert is non-vacuous
 *  (a blind observer would fail this). Same-origin, so a stray request hits the dev server (404),
 *  never the internet. */
async function controlFetchRegisters(): Promise<void> {
  const probe = new URL(`/__peekover_toc_probe__/${nextId()}.txt`, location.origin).href;
  await fetch(probe).catch(() => undefined);
  await flush();
  expect(networkedUrls(), 'control fetch must register — else the observer is blind').toContain(
    probe,
  );
}

// A tall multi-heading document with real NESTING: an h1 "Overview" whose child h2 sections give
// the h1 entry a disclosure twist (so the collapse-toggle action has a subtree to fold), and 5
// tall h2 sections so the scroll box genuinely overflows (so click-to-scroll and scroll-spy do
// real work). Plain prose only — no image/code/math/mermaid, so nothing lazy-loads or fetches.
const FILLER = Array.from(
  { length: 24 },
  (_, i) =>
    `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit, ` +
    `sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
).join('\n\n');

function buildDoc(): string {
  const parts: string[] = ['# Overview', FILLER];
  for (let i = 1; i <= 5; i += 1) parts.push(`## Section ${i}`, FILLER);
  return parts.join('\n\n'); // 6 headings (1 h1 + 5 nested h2) → rail present, twist present
}

/** Wait until the scroll box has laid out and overflows (so scroll/scroll-spy do real work).
 *  mount() is synchronous but the engine lays out on a later frame. */
async function waitForScrollable(scroller: HTMLElement): Promise<void> {
  for (let i = 0; i < 160; i += 1) {
    if (scroller.scrollHeight > scroller.clientHeight + 4) return;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  throw new Error('scroll box never became scrollable (content did not overflow)');
}

/** Poll `scroller.scrollTop` until it stops changing (a smooth scroll animates over several
 *  frames) or we time out, then return the settled offset — makes each action's completion
 *  independent of smooth-vs-instant behavior. */
async function settle(scroller: HTMLElement): Promise<number> {
  let prev = Number.NaN;
  let stable = 0;
  for (let i = 0; i < 160; i += 1) {
    const cur = scroller.scrollTop;
    if (cur === prev) {
      stable += 1;
      if (stable >= 3) return cur;
    } else {
      stable = 0;
    }
    prev = cur;
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  return scroller.scrollTop;
}

async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

/** Dispatch a real PointerEvent directly ON the resizer — the drag math (delta + captured start
 *  width) is what runs, regardless of OS pointer routing. Mirrors tocScroll.browser.test.ts. */
function firePointer(resizer: Element, type: string, clientX: number): void {
  resizer.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/**
 * Exercise EVERY TOC action once, asserting via `after(label)` that each put zero bytes on the
 * wire (cumulatively — the buffer is never re-cleared, so a leak from any earlier action would
 * still be caught by a later assert too). `host` owns the rail's shadow root; `scroller` is the
 * reader's actual scroll box (differs by surface). The build already happened (mount) before this
 * runs, so `after('build')` measures it.
 */
async function exerciseEveryTocAction(
  host: HTMLElement,
  scroller: HTMLElement,
  after: (label: string) => Promise<void>,
): Promise<void> {
  const shadow = host.shadowRoot!;

  // BUILD — the rail was composed by mount() (or the app-shell reader mount). It must be present
  // (proving the build action really ran, so its zero-assert is non-vacuous) and have added nothing
  // to the wire.
  expect(shadow.querySelector('.peekover-toc'), 'rail must be built for this guard to be meaningful').toBeTruthy();
  await after('build');

  await waitForScrollable(scroller);

  const links = [...shadow.querySelectorAll<HTMLElement>('button.peekover-toc__link')];
  const twist = shadow.querySelector<HTMLButtonElement>('button.peekover-toc__twist');
  const opener = shadow.querySelector<HTMLButtonElement>('button.peekover-toc__toggle');
  const resizer = shadow.querySelector<HTMLElement>('.peekover-toc__resizer');
  expect(links.length).toBeGreaterThanOrEqual(2);
  expect(twist, 'the nested h1 should carry a disclosure twist to exercise').toBeTruthy();
  expect(opener, 'the rail should carry an always-present opener').toBeTruthy();
  expect(resizer, 'the rail should carry a resize handle').toBeTruthy();

  // CLICK-TO-SCROLL — activate the last entry → scrollIntoView of its carried heading ref.
  scroller.scrollTop = 0;
  await settle(scroller);
  links[links.length - 1].click();
  await settle(scroller);
  await after('click-to-scroll');

  // SCROLL-SPY — scroll the container so the IntersectionObserver + rAF-coalesced scroll listener
  // fire and recompute the active section (the mark flips via getBoundingClientRect, no request).
  scroller.scrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  await settle(scroller);
  scroller.scrollTop = 0;
  await settle(scroller);
  await after('scroll-spy');

  // COLLAPSE TOGGLE — fold then unfold a subtree via its disclosure twist.
  twist!.click();
  twist!.click();
  await after('collapse-toggle');

  // OPENER — collapse then expand the whole rail via the always-present handle.
  opener!.click();
  opener!.click();
  await after('opener-toggle');

  // BACKTICK SHORTCUT — the REAL document-level handler installTocShortcut() wired at mount().
  // Assert the toggle actually happened, so the action is genuinely exercised (not a swallowed key).
  const before = host.getAttribute('data-toc');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '`', bubbles: true }));
  expect(host.getAttribute('data-toc'), 'backtick should have toggled the resolved rail').not.toBe(
    before,
  );
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '`', bubbles: true })); // toggle back
  await after('backtick-toggle');

  // RESIZE DRAG — pointer drag on the resizer rewrites the per-view --toc-w (one CSS var write).
  host.setAttribute('data-toc', 'open');
  const w0 = parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'));
  firePointer(resizer!, 'pointerdown', 600);
  firePointer(resizer!, 'pointermove', 540); // outward (clientX decreases) → wider
  firePointer(resizer!, 'pointerup', 540);
  const w1 = parseFloat(getComputedStyle(host).getPropertyValue('--toc-w'));
  expect(w1, 'the drag should have moved --toc-w so the action is genuinely exercised').toBeGreaterThan(w0);
  await after('resize-drag');
}

// ── Surface 1: the full-page content-script host (:host is the scroll box) ───────────────────
const fullPageHosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
afterEach(() => {
  for (const h of fullPageHosts.splice(0)) h.remove();
  for (const c of containers.splice(0)) c.remove();
});

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

describe('TOC zero-network guard — no TOC action touches the wire (task 4.1, both surfaces)', () => {
  it('full-page host: build + click + spy + collapse + opener + backtick + resize fire ZERO requests', async () => {
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    fullPageHosts.push(host);

    // CONTROL FIRST: prove the observer sees a request in this engine BEFORE trusting any zero.
    performance.clearResourceTimings();
    await controlFetchRegisters();

    // Clean slate, then BUILD (mount) + every action, asserting zero throughout.
    performance.clearResourceTimings();
    mount(buildDoc(), host);
    await exerciseEveryTocAction(host, host, assertNoNetwork);

    // FINAL cumulative zero, then a closing control proving the observer stayed live all along.
    await flush();
    expect(networkedUrls(), 'cumulative: no TOC action put a byte on the wire').toEqual([]);
    await controlFetchRegisters();
  });

  it('contained pane: build + click + spy + collapse + opener + backtick + resize fire ZERO requests', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const app = mountAppShell(container, {
      openFolder: async () => ({ ok: true, source: memorySource('doc.md', buildDoc()) }),
      store: fakeStore(),
    });

    // CONTROL FIRST (mountAppShell is network-free): observer proven live before the build.
    performance.clearResourceTimings();
    await controlFetchRegisters();

    // Clean slate, then BUILD via the app-shell reader path (openFolder → tree → file click →
    // contained mount) + every action, asserting zero throughout.
    performance.clearResourceTimings();
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    const host = await waitFor(() =>
      container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    );
    await waitFor(() => host.shadowRoot?.querySelector('.peekover-toc'));
    const scroller = container.querySelector<HTMLElement>('.peekover-app__reader')!;

    await exerciseEveryTocAction(host, scroller, assertNoNetwork);

    await flush();
    expect(networkedUrls(), 'cumulative: no TOC action put a byte on the wire').toEqual([]);
    await controlFetchRegisters();
  });
});
