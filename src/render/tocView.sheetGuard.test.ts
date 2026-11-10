// @vitest-environment jsdom
// M13 8.1i (a), audited at the (f) follow-up (CI run 42857163617): the narrow sheet's breakpoint listener (tocView.ts,
// `matchMedia(...).addEventListener('change', …)`) runs long after any test or render, over every registered reader.
// A reader whose shadow root cannot be read must be skipped, never thrown out of. jsdom has no `matchMedia`, so a
// stand-in is installed BEFORE the module loads (the listener is installed once, at the first rail).
import { describe, it, expect, afterEach, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('the narrow-breakpoint listener never throws', () => {
  it('a registered reader whose shadowRoot throws is skipped when the breakpoint is crossed', async () => {
    // Only the contents' breakpoint query is collected: the theme runtime installs its own (dark-scheme) listener.
    const listeners: Array<() => void> = [];
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      addEventListener: (_type: string, fn: () => void) => {
        if (query.includes('863px')) listeners.push(fn);
      },
    }));
    vi.resetModules();
    const { mount } = await import('./mount');
    const host = document.createElement('peekover-root');
    document.body.appendChild(host);
    mount('# One\n\nText.\n\n## Two\n\nMore.\n', host);
    expect(listeners.length, 'the breakpoint listener is installed (control)').toBeGreaterThan(0);
    Object.defineProperty(host, 'shadowRoot', {
      configurable: true,
      get() {
        throw new Error('shadowRoot is poisoned');
      },
    });
    for (const fn of listeners) expect(() => fn()).not.toThrow();
  });
});
