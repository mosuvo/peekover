// @vitest-environment jsdom
// M13 8.1i (f) follow-up — the at-rest band's tracker (mount.ts `trackRest`) must never throw and must not outlive
// its reader. Found by CI run 42857163617: its frame callback read a host's `shadowRoot` after tableEnhancer.test.ts
// had made that getter throw, and the throw escaped as an unhandled error (vitest exited 1 with every test passing).
// The band is decorative: nothing about it may take a reader down, and nothing of it may stay behind a removed host.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, stopRestTracking } from './mount';

const DOC = '# One\n\nText.\n\n## Two\n\nMore text.\n';

/** Capture frame callbacks instead of letting jsdom's timer run them, so each test decides when they run. */
function captureFrames(): { frames: Map<number, FrameRequestCallback>; cancel: ReturnType<typeof vi.spyOn> } {
  const frames = new Map<number, FrameRequestCallback>();
  let next = 1;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    frames.set(next, cb);
    return next++;
  });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
    frames.delete(id);
  });
  return { frames, cancel };
}

function makeHost(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('the at-rest band tracker never throws and never outlives its reader', () => {
  it('a frame that finds a throwing shadowRoot does not throw (the band is decorative)', () => {
    const { frames } = captureFrames();
    const host = makeHost();
    mount(DOC, host);
    expect(host.shadowRoot!.querySelector('.peekover-rest-band'), 'the band exists (control)').not.toBeNull();
    Object.defineProperty(host, 'shadowRoot', {
      configurable: true,
      get() {
        throw new Error('shadowRoot is poisoned');
      },
    });
    expect(frames.size, 'a frame is pending (control)').toBeGreaterThan(0);
    for (const cb of frames.values()) expect(() => cb(0)).not.toThrow();
    expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
  });

  it('a new render cancels the previous render’s pending frame', () => {
    const { frames, cancel } = captureFrames();
    const host = makeHost();
    mount(DOC, host);
    const first = [...frames.keys()].at(-1)!;
    mount(DOC, host);
    expect(cancel).toHaveBeenCalledWith(first);
  });

  it('stopRestTracking cancels the pending frame and drops the host’s and the window’s listeners', () => {
    const { frames, cancel } = captureFrames();
    const host = makeHost();
    const offWindow = vi.spyOn(window, 'removeEventListener');
    const offHost = vi.spyOn(host, 'removeEventListener');
    mount(DOC, host);
    const pending = [...frames.keys()].at(-1)!;
    stopRestTracking(host);
    expect(cancel).toHaveBeenCalledWith(pending);
    expect(offWindow.mock.calls.some(([type]) => type === 'resize'), 'the window resize listener removed').toBe(true);
    expect(offHost.mock.calls.some(([type]) => type === 'scroll'), 'the host scroll listener removed').toBe(true);
  });

  it('a removed host stops itself on the next resize (no listener left behind)', () => {
    captureFrames();
    const host = makeHost();
    const offWindow = vi.spyOn(window, 'removeEventListener');
    mount(DOC, host);
    host.remove();
    window.dispatchEvent(new Event('resize'));
    expect(offWindow.mock.calls.some(([type]) => type === 'resize'), 'the window resize listener removed').toBe(true);
  });
});
