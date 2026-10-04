// @vitest-environment jsdom
//
// Raw <-> Reading toggle (task 4.2). Drives the REAL mount() success path (no mocks)
// so we exercise the actual pipeline + toggle wiring together, then flips views via
// both the on-screen control and the keyboard shortcut. The banner-on-failure path
// (which needs a throwing stage) lives in mount.fallback.test.ts.
//
// The two invariants under test: (1) toggling swaps which view is visible WITHOUT
// re-running parse/sanitize — proven by reader-element identity holding across
// toggles; (2) the key listener is tightly scoped — inert in inputs and when no
// reader is mounted, never throwing.

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from './mount';
import {
  TOGGLE_KEY,
  enterEditMode,
  exitEditMode,
  setReaderMode,
  toggleReaderMode,
} from './readerMode';

const HOST_TAG = 'peekover-root';

function makeHost(): HTMLElement {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  return host;
}

/** Dispatch a bare key on the document, the way a real keypress bubbles up to the
 *  document-level listener. Returns the event so callers can check defaultPrevented. */
function pressKey(key: string, target: EventTarget = document): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
}

describe('readerMode — Raw <-> Reading toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('starts in Reading (rendered document), with no error banner', () => {
    const host = makeHost();
    mount('# Title\n\n**bold**', host);
    const shadow = host.shadowRoot!;

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(shadow.querySelector('.peekover-reader h1')?.textContent).toBe('Title');
    // A successful render shows NO banner (banner is the failure path only).
    expect(shadow.querySelector('.peekover-alert')).toBeNull();
    // The Raw view is lazy: not built until the user asks for it.
    expect(shadow.querySelector('.peekover-raw')).toBeNull();
  });

  it('control switches to Raw (source as escaped text) and back to Reading', () => {
    const host = makeHost();
    const source = '# Title\n\n<b>not parsed here</b>';
    mount(source, host);
    const shadow = host.shadowRoot!;
    const reader = shadow.querySelector('.peekover-reader'); // capture identity

    const btn = shadow.querySelector<HTMLButtonElement>('.peekover-mode-toggle')!;
    expect(btn.textContent).toBe('Raw'); // offers the NEXT view
    expect(btn.getAttribute('aria-label')).toBe('Show raw markdown source');

    btn.click();

    expect(host.getAttribute('data-mode')).toBe('raw');
    const pre = shadow.querySelector('pre.peekover-raw')!;
    // Source shown verbatim as text — the <b> is literal, never a live element.
    expect(pre.textContent).toBe(source);
    expect(shadow.querySelectorAll('b').length).toBe(0);
    expect(btn.textContent).toBe('Reading');
    expect(btn.getAttribute('aria-label')).toBe('Show reading view');
    // A user-chosen Raw view is a deliberate view, NOT a failure — so still no banner.
    expect(shadow.querySelector('.peekover-alert')).toBeNull();
    // Reader content NOT re-rendered: same element instance survives the toggle.
    expect(shadow.querySelector('.peekover-reader')).toBe(reader);

    btn.click();

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(btn.textContent).toBe('Raw');
    // Still the exact same reader element — parse/sanitize never re-ran.
    expect(shadow.querySelector('.peekover-reader')).toBe(reader);
  });

  it('reuses the one raw <pre> across repeated toggles (no rebuild, no reparse)', () => {
    const host = makeHost();
    mount('# Title', host);
    const shadow = host.shadowRoot!;
    const btn = shadow.querySelector<HTMLButtonElement>('.peekover-mode-toggle')!;

    btn.click(); // -> raw (builds the pre)
    const pre = shadow.querySelector('pre.peekover-raw');
    btn.click(); // -> reading
    btn.click(); // -> raw again

    expect(shadow.querySelectorAll('pre.peekover-raw').length).toBe(1);
    expect(shadow.querySelector('pre.peekover-raw')).toBe(pre); // same node reused
  });

  it('keyboard shortcut toggles when the reader is active', () => {
    const host = makeHost();
    mount('# Title', host);

    const e1 = pressKey(TOGGLE_KEY);
    expect(host.getAttribute('data-mode')).toBe('raw');
    expect(e1.defaultPrevented).toBe(true); // preventDefault only when we handled it

    const e2 = pressKey(TOGGLE_KEY);
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(e2.defaultPrevented).toBe(true);
  });

  it('shortcut does NOT act (and does not preventDefault) when focus is in an input', () => {
    const host = makeHost();
    mount('# Title', host);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const e = pressKey(TOGGLE_KEY, input);

    expect(host.getAttribute('data-mode')).toBe('reading'); // unchanged
    expect(e.defaultPrevented).toBe(false); // key passed straight through
  });

  it('shortcut ignores the key when a modifier is held (browser owns Ctrl/Cmd)', () => {
    const host = makeHost();
    mount('# Title', host);

    const e = new KeyboardEvent('keydown', {
      key: TOGGLE_KEY,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(e);

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(e.defaultPrevented).toBe(false);
  });

  it('shortcut does not throw and does nothing when no reader is present', () => {
    document.body.innerHTML = ''; // no host at all
    let e!: KeyboardEvent;
    expect(() => {
      e = pressKey(TOGGLE_KEY);
    }).not.toThrow();
    expect(e.defaultPrevented).toBe(false);
  });
});

// ── Edit mode (012 task 2.1, D-1) ────────────────────────────────────────────────────────────
// `'edit'` is the third `ReaderMode`, reached ONLY through the async `enterEditMode`. The contract
// under test is ordering: load, THEN build, THEN flip — `data-mode` is never 'edit' while either
// step is pending, and a rejection in either leaves the host exactly as it was. The engine is an
// injected loader (a stub here); nothing in this file, or in readerMode.ts, imports an editor.

/** A promise whose settlement the test controls — the "load is still pending" instrument. */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const pill = (host: HTMLElement): HTMLButtonElement =>
  host.shadowRoot!.querySelector<HTMLButtonElement>('.peekover-mode-toggle')!;

describe('readerMode — edit mode (012 task 2.1)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('load-then-flip: data-mode is NOT edit while the load is pending, and IS once it resolves', async () => {
    const host = makeHost();
    mount('# Title', host);
    const load = deferred<string>();

    const entering = enterEditMode(host, { loader: () => load.promise });
    await Promise.resolve(); // let anything that would (wrongly) run before the await run

    expect(host.getAttribute('data-mode')).toBe('reading'); // the pending-state assertion

    load.resolve('engine');
    await entering;

    expect(host.getAttribute('data-mode')).toBe('edit');
  });

  it('load, THEN build, THEN flip: build receives the engine and still sees the prior mode', async () => {
    const host = makeHost();
    mount('# Title', host);
    const order: string[] = [];
    const build = deferred<void>();

    const entering = enterEditMode(host, {
      loader: async () => {
        order.push('load');
        return 'engine';
      },
      build: (engine, h) => {
        order.push(`build:${String(engine)}:${h.getAttribute('data-mode')}`);
        return build.promise;
      },
    });
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(order).toEqual(['load', 'build:engine:reading']);
    expect(host.getAttribute('data-mode')).toBe('reading'); // build pending -> still not edit

    build.resolve();
    await entering;

    expect(host.getAttribute('data-mode')).toBe('edit');
  });

  it('a rejecting loader leaves the prior mode, the attribute and the children exactly as they were', async () => {
    const host = makeHost();
    mount('# Title', host);
    pill(host).click(); // the user is in Raw
    const shadow = host.shadowRoot!;
    const childrenBefore = Array.from(shadow.childNodes);
    const htmlBefore = shadow.innerHTML;
    const attrsBefore = host.getAttributeNames().map((n) => `${n}=${host.getAttribute(n)}`);

    await expect(
      enterEditMode(host, { loader: () => Promise.reject(new Error('engine unavailable')) }),
    ).rejects.toThrow('engine unavailable');

    expect(host.getAttribute('data-mode')).toBe('raw');
    expect(host.getAttributeNames().map((n) => `${n}=${host.getAttribute(n)}`)).toEqual(attrsBefore);
    const childrenAfter = Array.from(shadow.childNodes);
    expect(childrenAfter.length).toBe(childrenBefore.length);
    childrenAfter.forEach((node, i) => expect(node).toBe(childrenBefore[i])); // same nodes, same order
    expect(shadow.innerHTML).toBe(htmlBefore);
    expect(pill(host).textContent).toBe('Reading'); // the control was not relabelled either
  });

  it('a rejecting build step leaves data-mode untouched too (never a half-state)', async () => {
    const host = makeHost();
    mount('# Title', host);

    await expect(
      enterEditMode(host, {
        loader: async () => 'engine',
        build: () => Promise.reject(new Error('build failed')),
      }),
    ).rejects.toThrow('build failed');

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(pill(host).textContent).toBe('Raw');
  });

  it('exit returns to the mode the user came from — Raw', async () => {
    const host = makeHost();
    mount('# Title', host);
    pill(host).click();
    expect(host.getAttribute('data-mode')).toBe('raw');

    await enterEditMode(host, { loader: async () => 'engine' });
    expect(host.getAttribute('data-mode')).toBe('edit');

    exitEditMode(host);

    expect(host.getAttribute('data-mode')).toBe('raw');
    expect(pill(host).textContent).toBe('Reading');
  });

  it('exit returns to the mode the user came from — Reading; and is a no-op outside edit', async () => {
    const host = makeHost();
    mount('# Title', host);

    exitEditMode(host); // not in edit: nothing happens
    expect(host.getAttribute('data-mode')).toBe('reading');

    await enterEditMode(host, { loader: async () => 'engine' });
    exitEditMode(host);

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(pill(host).textContent).toBe('Raw');
  });

  it('setReaderMode stays synchronous for reading/raw', () => {
    const host = makeHost();
    mount('# Title', host);

    expect(setReaderMode(host, 'raw')).toBeUndefined(); // not a promise
    expect(host.getAttribute('data-mode')).toBe('raw'); // applied before the call returned
    expect(setReaderMode(host, 'reading')).toBeUndefined();
    expect(host.getAttribute('data-mode')).toBe('reading');
  });

  it('toggleReaderMode stays binary: it never yields edit, and from edit it lands in raw', async () => {
    const host = makeHost();
    mount('# Title', host);

    toggleReaderMode(host);
    expect(host.getAttribute('data-mode')).toBe('raw');
    toggleReaderMode(host);
    expect(host.getAttribute('data-mode')).toBe('reading');

    await enterEditMode(host, { loader: async () => 'engine' });
    expect(pill(host).textContent).toBe('Raw'); // the pill names what its click does from edit
    toggleReaderMode(host);
    expect(host.getAttribute('data-mode')).toBe('raw');
  });

  it("setReaderMode(host, 'edit') — mount()'s carried-mode path — lands in reading, never a bare edit", async () => {
    const host = makeHost();
    mount('# Title\n\n## Two', host);
    await enterEditMode(host, { loader: async () => 'engine' });
    expect(host.getAttribute('data-mode')).toBe('edit');

    // A watch re-render during edit: mount() captures 'edit' and hands it straight back to
    // setReaderMode after replaceChildren has dropped whatever the edit session built.
    mount('# Title\n\n## Two, changed', host, { preserveReading: true });

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(pill(host).textContent).toBe('Raw');
    exitEditMode(host); // the edit session is over: exit must not resurrect a stale return mode
    expect(host.getAttribute('data-mode')).toBe('reading');
  });

  it('the bare-key shortcut is inert while data-mode is edit: not default-prevented, mode unchanged', async () => {
    const host = makeHost();
    mount('# Title', host);
    await enterEditMode(host, { loader: async () => 'engine' });

    const e = pressKey(TOGGLE_KEY);

    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(e.defaultPrevented).toBe(false);
  });
});
