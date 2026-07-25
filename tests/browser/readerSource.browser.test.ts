// readerSourceFor + the fallback-path register — REAL-ENGINE (M6 task 1.3), Chromium AND Firefox.
//
// D-1 makes the reader-source WeakMap's invariant TOTAL: it holds what is currently on screen,
// on BOTH the successful render path AND the never-blank fallback path. Two directions, each
// red-first proven, each parameterised over the two surfaces mount() serves (the content-script
// full-page takeover and the app-page {contained} pane) through ONE describe.each — never two
// hand-written suites, which drift.
//
//   (a) THE CHANGE lands on the FAILURE path. After a successful render of A, a render of B that
//       FAILS must leave readerSourceFor(host) === B — the fallback registered what it put on
//       screen. Before Edit 2 (the register in mountRawFallback) the map still held A, so this
//       is RED first: proven on every parameterised instance before the fix landed.
//   (b) THE CHANGE is INERT on the SUCCESS path. A successful render's Raw view still shows that
//       document's source — the additive edit to mountRawFallback does not touch what happens
//       when mount succeeds. Non-vacuity is the OTHER procedure: deleting the success-path
//       register (mount.ts:202) reds (b) while (a) STAYS GREEN, because the fallback's own
//       register keeps the failed-render case correct even under that mutation.
//
// WHY REAL-ENGINE. mountRawFallback runs inside a real shadow root and the Raw <pre> is built
// lazily off the same WeakMap; the value under test is "what the user would see," which is a DOM
// fact, so it is proven in the engine, not asserted against a jsdom shape.
//
// THE FAILED-RENDER FIXTURE. There is no pre-existing helper that forces mount() into its catch
// block, so this task constructs one: parse (src/render/parse.ts) is module-mocked to delegate to
// the real parser by default and to THROW when a per-file flag is set. mount() calls
// sanitize(parse(source)) first inside its try, so a throwing parse routes straight to
// mountRawFallback with the same source — the cheapest reproducible failure, and it touches
// neither sanitize nor the fallback's textContent path (which never parses). The flag is off for
// the successful A render and flipped on only for the failing B render.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Hoisted so the vi.mock factory (itself hoisted above the imports) can read it. Off by default;
// each test that needs a forced failure flips it around the single failing mount and resets it.
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
import { readerSourceFor, setReaderMode } from '../../src/render/readerMode';

// ── Surfaces ──────────────────────────────────────────────────────────────────────────────────
// Both mount through the SAME mount() seam and both reach mountRawFallback on failure; the only
// difference is the host element and the {contained} option, exactly as production wires them
// (content script: <peekover-root>; app page: a <div> with {contained:true} — readerPane.ts).
const SURFACES = [
  { name: 'full-page', tag: 'peekover-root', options: {} as Parameters<typeof mount>[2] },
  { name: 'contained', tag: 'div', options: { contained: true } as Parameters<typeof mount>[2] },
];

function makeHost(tag: string): HTMLElement {
  const host = document.createElement(tag);
  document.body.appendChild(host);
  return host;
}

function rawText(host: HTMLElement): string | null | undefined {
  return host.shadowRoot?.querySelector('.peekover-raw')?.textContent;
}

const DOC_A = '# Document A\n\nalpha body text.';
const DOC_B = '# Document B\n\nbravo body text.';

beforeEach(() => {
  injected.parseShouldThrow = false;
  document.body.replaceChildren();
});

afterEach(() => {
  injected.parseShouldThrow = false;
  document.body.replaceChildren();
});

describe.each(SURFACES)('reader source — $name surface', ({ tag, options }) => {
  // Direction (a): the change lands on the FAILURE path.
  it('registers the fallback source after a forced render failure follows a successful render', () => {
    const host = makeHost(tag);

    mount(DOC_A, host, options); // succeeds → the success path registers A

    injected.parseShouldThrow = true;
    mount(DOC_B, host, options); // fails → mountRawFallback(B) runs
    injected.parseShouldThrow = false;

    // The fallback genuinely put B on screen (proves we took the catch, not a silent success) —
    // and this holds regardless of the SUCCESS-path register, which is why direction (a) stays
    // green under Procedure B: its claim is about the FAILURE path alone. Deliberately no
    // assertion here couples to the success-path registration of A.
    expect(rawText(host)).toBe(DOC_B);
    // THE DIRECTION-(a) CLAIM: the fallback registered what it displayed. Pre-fix the map still
    // held A (RED — Edit 2 not landed); post-fix, and even with the success register deleted, the
    // fallback's own register makes this B.
    expect(readerSourceFor(host)).toBe(DOC_B);
  });

  // Non-vacuity control for the getter itself: it distinguishes "registered" from "not."
  it('returns undefined for a host that was never registered', () => {
    const fresh = makeHost(tag);
    expect(readerSourceFor(fresh)).toBeUndefined();
  });

  // Direction (b): the change is INERT on the SUCCESS path.
  it("leaves a successful render's Raw view showing that document's source", () => {
    const host = makeHost(tag);

    mount(DOC_A, host, options); // succeeds
    setReaderMode(host, 'raw'); // build + reveal the lazy Raw view

    // Built off the same WeakMap the success path registered to. Pre-fix AND post-fix this is A;
    // it only reds when the success-path register is removed (Procedure B), which is the pin.
    expect(rawText(host)).toBe(DOC_A);
  });
});
