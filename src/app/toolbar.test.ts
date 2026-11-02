// @vitest-environment jsdom
//
// The app-page toolbar skeleton (013 task 4.1, plan D-5): the mark, the file name, Read / Raw. It
// drives the SAME state the reader's own controls use (`setReaderMode` → the host's `data-mode`) and
// reflects changes it did not make through one MutationObserver (the 4.0 census ruling B: `\` stays
// inert on the app page, so the outside flip is the mode pill's or a programmatic one). The
// real-engine half — order on screen, the blink under reduced motion, the chip's contrast — is
// tests/browser/toolbar.browser.test.ts.

import { describe, it, expect, afterEach } from 'vitest';
import { createToolbar, TOOLBAR_CLASS } from './toolbar';
import { setReaderMode } from '../render/readerMode';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

function host(mode = 'reading'): HTMLElement {
  const h = document.createElement('div');
  h.attachShadow({ mode: 'open' });
  h.setAttribute('data-mode', mode);
  document.body.appendChild(h);
  return h;
}

const seg = (el: HTMLElement): Record<string, { pressed: string | null; disabled: boolean }> =>
  Object.fromEntries(
    [...el.querySelectorAll<HTMLButtonElement>(`.${TOOLBAR_CLASS}__seg button`)].map((b) => [
      b.dataset.mode!,
      { pressed: b.getAttribute('aria-pressed'), disabled: b.disabled },
    ]),
  );

afterEach(() => document.body.replaceChildren());

describe('the toolbar skeleton (4.1)', () => {
  it('runs where a document exists (the DOM environment named on line 1)', () => {
    expect(typeof document).toBe('object');
  });

  it('composes the mark, the file name and Read / Raw, in that order', () => {
    const tb = createToolbar(document);
    const parts = [...tb.element.children].map((el) => el.className.split(' ')[0]);
    expect(parts).toEqual([`${TOOLBAR_CLASS}__brand`, `${TOOLBAR_CLASS}__file`, `${TOOLBAR_CLASS}__seg`]);
    expect([...tb.element.querySelectorAll(`.${TOOLBAR_CLASS}__seg button`)].map((b) => b.textContent)).toEqual([
      'Read',
      'Raw',
    ]);
    expect(tb.element.querySelector(`.${TOOLBAR_CLASS}__brand`)?.textContent).toBe('Peekover');
    // The mark is drawn, not an image: two eyes that can blink.
    expect(tb.element.querySelectorAll(`.${TOOLBAR_CLASS}__lid`)).toHaveLength(2);
  });

  it('shows the open file name, and nothing (hidden) with no file', () => {
    const tb = createToolbar(document);
    const file = tb.element.querySelector<HTMLElement>(`.${TOOLBAR_CLASS}__file`)!;
    expect(file.hidden).toBe(true);
    tb.setDocument('notes.md', host());
    expect(file.hidden).toBe(false);
    expect(file.textContent).toBe('notes.md');
    tb.setDocument(null, null);
    expect(file.hidden).toBe(true);
    expect(file.textContent).toBe('');
  });

  it('with no document, Read and Raw are present but disabled and unpressed', () => {
    const tb = createToolbar(document);
    expect(seg(tb.element)).toEqual({
      reading: { pressed: 'false', disabled: true },
      raw: { pressed: 'false', disabled: true },
    });
  });

  it('Read / Raw drive the host\'s data-mode through setReaderMode', async () => {
    const tb = createToolbar(document);
    const h = host();
    tb.setDocument('a.md', h);
    tb.element.querySelector<HTMLButtonElement>('[data-mode="raw"]')!.click();
    expect(h.getAttribute('data-mode')).toBe('raw');
    // setReaderMode builds the lazy Raw view, exactly as the reader's own control does.
    expect(h.shadowRoot!.querySelector('.peekover-raw')).not.toBeNull();
    await tick();
    expect(seg(tb.element).raw.pressed).toBe('true');
    tb.element.querySelector<HTMLButtonElement>('[data-mode="reading"]')!.click();
    expect(h.getAttribute('data-mode')).toBe('reading');
    await tick();
    expect(seg(tb.element).reading.pressed).toBe('true');
  });

  it('reflects a mode flip it did not make (ruling B), through its observer', async () => {
    const tb = createToolbar(document);
    const h = host();
    tb.setDocument('a.md', h);
    expect(seg(tb.element).reading.pressed).toBe('true');
    setReaderMode(h, 'raw'); // what the reader's own mode pill does
    await tick();
    expect(seg(tb.element)).toEqual({
      reading: { pressed: 'false', disabled: false },
      raw: { pressed: 'true', disabled: false },
    });
  });

  it('while editing, Read and Raw are disabled and unpressed — the unsaved-changes guard is the Edit control\'s until 4.3', async () => {
    const tb = createToolbar(document);
    const h = host();
    tb.setDocument('a.md', h);
    h.setAttribute('data-mode', 'edit');
    await tick();
    expect(seg(tb.element)).toEqual({
      reading: { pressed: 'false', disabled: true },
      raw: { pressed: 'false', disabled: true },
    });
    tb.element.querySelector<HTMLButtonElement>('[data-mode="raw"]')!.click();
    expect(h.getAttribute('data-mode')).toBe('edit');
  });

  it('a document switch re-binds: the old host no longer drives it', async () => {
    const tb = createToolbar(document);
    const a = host();
    const b = host('raw');
    tb.setDocument('a.md', a);
    tb.setDocument('b.md', b);
    expect(seg(tb.element).raw.pressed).toBe('true');
    setReaderMode(a, 'raw');
    setReaderMode(b, 'reading');
    await tick();
    expect(seg(tb.element).reading.pressed).toBe('true');
    tb.element.querySelector<HTMLButtonElement>('[data-mode="raw"]')!.click();
    expect(b.getAttribute('data-mode')).toBe('raw');
    expect(a.getAttribute('data-mode')).toBe('raw'); // untouched by this click (it was set above)
  });
});
