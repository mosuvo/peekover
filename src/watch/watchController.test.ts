// @vitest-environment jsdom
//
// watchController — the jsdom-testable half (spec 005 task 4.2).
//
// WHAT IS HERE AND WHAT DELIBERATELY IS NOT. Two things about this controller are honest logic
// rather than layout, so they are proven here: the PURE at-bottom predicate, and the contract that
// the re-render carries `preserveReading: true`. Everything else this module does — whether the
// follow actually lands at the bottom, whether it is instant under `prefers-reduced-motion`,
// whether a reader scrolled mid-document is left alone — is layout and media emulation, which
// jsdom returns all-zero and cannot fake. Those live in tests/browser/watchControl.browser.test.ts
// and are proven on Chromium AND Firefox.
//
// The `render` and `signal` dependencies are INJECTED for exactly this reason (the settingsPort /
// changeDetector precedent): the options `mount` is handed are observable without a real engine.

import { describe, it, expect, vi } from 'vitest';
import { createWatchController, isAtBottom, AT_BOTTOM_SLACK_PX } from './watchController';
import type { ChangeDetector, OnText } from './changeDetector';
import type { MountOptions } from '../render/mount';
import { resetWatchRegistryForTest } from './watchRegistry';

/** A detector whose callback this test drives by hand — the seam, with no timers involved. */
function fakeDetector(): { detector: ChangeDetector; fire: (text: string) => void; stops: number } {
  let cb: OnText | null = null;
  const state = { stops: 0 };
  return {
    detector: {
      start(next) {
        cb = next;
      },
      stop() {
        cb = null;
        state.stops += 1;
      },
    },
    fire: (text) => cb?.(text),
    get stops() {
      return state.stops;
    },
  };
}

describe('isAtBottom — the pure predicate (task 4.2)', () => {
  it('is true exactly at the bottom', () => {
    expect(isAtBottom(500, 1000, 500)).toBe(true);
  });

  it('is true within the slack, and false beyond it', () => {
    // The boundary asserted from BOTH sides, so a change to the slack cannot pass unnoticed.
    expect(isAtBottom(500 - AT_BOTTOM_SLACK_PX, 1000, 500)).toBe(true);
    expect(isAtBottom(500 - AT_BOTTOM_SLACK_PX - 1, 1000, 500)).toBe(false);
  });

  it('is false in the middle of a document — the case the whole decision exists for', () => {
    expect(isAtBottom(200, 5000, 500)).toBe(false);
    expect(isAtBottom(0, 5000, 500)).toBe(false);
  });

  it('is true for a box that does not overflow at all', () => {
    // Not a degenerate case: there is nothing to follow, so the follow is a no-op either way.
    expect(isAtBottom(0, 400, 500)).toBe(true);
  });
});

describe('watchController — the re-render contract (task 4.2)', () => {
  it('re-renders with preserveReading: true when the detector reports new text', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn<(t: string, h: HTMLElement, o: MountOptions) => void>();
    const host = document.createElement('div');

    const controller = createWatchController({ detector, render, signal: () => {} });
    controller.start(host);
    fire('# new text');

    // THE FLAG IS THE POINT: without it `mount()` resets the reader to Reading mode and to the top
    // of the document on every agent keystroke (task 3.3's direction (a)).
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toBe('# new text');
    expect(render.mock.calls[0][1]).toBe(host);
    expect(render.mock.calls[0][2]).toMatchObject({ preserveReading: true });
  });

  it('threads `contained` to the render, so the app-page pane stays contained across an update', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn<(t: string, h: HTMLElement, o: MountOptions) => void>();

    createWatchController({ detector, contained: true, render, signal: () => {} }).start(
      document.createElement('div'),
    );
    fire('# x');

    // Dropping this would make the app page's reader re-render as a full-page takeover mid-watch,
    // painting over the shell — the contained-surface regression M2 already paid for once.
    expect(render.mock.calls[0][2]).toMatchObject({ contained: true, preserveReading: true });
  });

  it('fires the update signal on every update', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const signal = vi.fn();
    const host = document.createElement('div');

    createWatchController({ detector, render: () => {}, signal }).start(host);
    fire('a');
    fire('b');

    expect(signal).toHaveBeenCalledTimes(2);
    expect(signal).toHaveBeenCalledWith(host);
  });

  it('reports its running state, and stop() reaches the detector', () => {
    resetWatchRegistryForTest();
    const fake = fakeDetector();
    const controller = createWatchController({
      detector: fake.detector,
      render: () => {},
      signal: () => {},
    });

    expect(controller.isWatching()).toBe(false);
    controller.start(document.createElement('div'));
    expect(controller.isWatching()).toBe(true);

    controller.stop();
    expect(controller.isWatching()).toBe(false);
    expect(fake.stops).toBe(1);
  });

  it('does not re-render after stop, even if a late read delivers', () => {
    // The detector already guards this (task 1.1), but the controller must not RELY on that: an
    // in-flight read delivering after a stop would re-render a reader the user switched away from.
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn();
    const controller = createWatchController({ detector, render, signal: () => {} });

    controller.start(document.createElement('div'));
    controller.stop();
    fire('late text');

    expect(render).not.toHaveBeenCalled();
  });

  it('start() is idempotent — a second start does not double-subscribe', () => {
    resetWatchRegistryForTest();
    const { detector, fire } = fakeDetector();
    const render = vi.fn();
    const controller = createWatchController({ detector, render, signal: () => {} });
    const host = document.createElement('div');

    controller.start(host);
    controller.start(host);
    fire('x');

    expect(render).toHaveBeenCalledTimes(1);
  });
});
