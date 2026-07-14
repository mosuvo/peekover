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
import { TOGGLE_KEY } from './readerMode';

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
