// Edit mode's two real-engine claims (012 task 2.1, D-1 / F-2), Chromium AND Firefox.
//
//   (A) THE `\` SHORTCUT IS INERT IN EDIT. `installToggleShortcut` listens on `document`. A key
//       typed inside a shadow root arrives there RETARGETED to the host, so its
//       `isEditableTarget` guard sees the host — not the editable element the user is typing in —
//       and lets the key through; `toggleReaderMode` then flips any non-raw mode, 'edit' included,
//       to 'raw'. A typed backslash would be swallowed and would eject the user from the editor.
//       jsdom cannot show this (it needs a trusted, composed key event crossing a real shadow
//       boundary), which is why it is proven here.
//
//   (B) THE `[data-mode="edit"]` CSS hides the reading column and the raw <pre>, by computed style.
//
// ══ WHICH HOST SHAPE (A) IS PROVEN ON — STATED, NOT ASSUMED ══════════════════════════════════════
//
// The listener resolves its host with `document.querySelector('peekover-root')` — the
// content-script host. The APP PAGE's reader host is a plain `<div>` (`readerPane.ts`), so there
// the listener returns before it acts: `\` has been inert on the app page since 002
// (`decisions.md` 2026-07-17, "CARRIED HARDENING"). Edit mode runs ONLY on the app page. So at
// this HEAD the hazard in (A) cannot fire on the surface edit mode ships on, and neither could a
// positive control. Human-ruled at task 2.1 (2026-10-04): the guard ships as DEFENSE-IN-DEPTH —
// it becomes load-bearing the day the carried "unify the two shortcuts on one host registry"
// item lands — and its red-first and its positive control run on the `peekover-root` shape,
// where the listener is live. The app-page-shape case at the bottom is a PIN of today's
// behaviour: it passes with or without the guard and proves nothing about it.
//
// ══ WHY THE INSTRUMENTS ARE DELTAS (AGENTS.md, harness-shared-state) ═════════════════════════════
//
// Browser test files run serially on one shared `document`. Earlier files may have left toggle
// listeners installed (one per module instance that ever called `mount()`), so "one press flips
// the mode once" is not a safe absolute — N listeners flip it N times. Nothing here counts
// listeners or asserts a parity-dependent end state after a live press. Instead each press is
// measured for THIS host and THIS key: the `data-mode` values written to the host during the
// press, and the `preventDefault` calls made on a `\` keydown during it.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { TOGGLE_KEY, enterEditMode, setReaderMode } from '../../src/render/readerMode';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
});

const DOC = '# Edit mode\n\nBody text.\n\n## Second heading\n\nMore body.';

/** The content-script shape, placed FIRST in the document so it is the host the listener's
 *  `querySelector` resolves even if an earlier file left a `peekover-root` behind. */
function mountFullPage(): HTMLElement {
  const host = document.createElement('peekover-root');
  document.body.prepend(host);
  hosts.push(host);
  mount(DOC, host);
  expect(
    document.querySelector('peekover-root'),
    'firing control: this host must be the one the shortcut resolves',
  ).toBe(host);
  return host;
}

/** The app-page shape: a plain `<div>`, mounted contained — `readerPane.ts`'s own call. */
function mountContained(): HTMLElement {
  const host = document.createElement('div');
  document.body.prepend(host);
  hosts.push(host);
  mount(DOC, host, { contained: true });
  return host;
}

type Editable = 'textarea' | 'contenteditable';

/** Enter edit through the real entry point, with a build step that puts an editable element in
 *  the host's shadow root — the stand-in for the editor a later task builds. */
async function enterEditWith(host: HTMLElement, kind: Editable): Promise<HTMLElement> {
  let editable!: HTMLElement;
  await enterEditMode(host, {
    loader: async () => null,
    build: (_engine, h) => {
      if (kind === 'textarea') {
        editable = document.createElement('textarea');
      } else {
        editable = document.createElement('div');
        editable.setAttribute('contenteditable', 'true');
      }
      editable.className = 'edit-mode-test-editable';
      h.shadowRoot!.appendChild(editable);
    },
  });
  editable.focus();
  return editable;
}

const typedText = (el: HTMLElement): string =>
  el instanceof HTMLTextAreaElement ? el.value : (el.textContent ?? '');

interface Press {
  /** Every `data-mode` value written to the host during the press, in order. */
  writes: string[];
  /** How many times a listener called `preventDefault()` on a `\` keydown during the press. */
  prevented: number;
}

/** Type one REAL (trusted, composed) backslash at whatever has focus, measuring only what it did
 *  to `host` and to `\` keydown events. */
async function pressBackslash(host: HTMLElement): Promise<Press> {
  const writes: string[] = [];
  const setAttribute = host.setAttribute.bind(host);
  host.setAttribute = (name: string, value: string): void => {
    if (name === 'data-mode') writes.push(value);
    setAttribute(name, value);
  };
  const spy = vi.spyOn(KeyboardEvent.prototype, 'preventDefault');
  try {
    await userEvent.keyboard(TOGGLE_KEY);
    const prevented = spy.mock.contexts.filter(
      (e) => (e as KeyboardEvent).type === 'keydown' && (e as KeyboardEvent).key === TOGGLE_KEY,
    ).length;
    return { writes, prevented };
  } finally {
    spy.mockRestore();
    delete (host as { setAttribute?: unknown }).setAttribute; // back to the prototype's
  }
}

describe('012 task 2.1 (F-2) — the `\\` shortcut is inert while data-mode is edit [peekover-root shape]', () => {
  it.each<Editable>(['textarea', 'contenteditable'])(
    '★ focus in a %s inside the shadow root: `\\` leaves data-mode at edit and is not default-prevented',
    async (kind) => {
      const host = mountFullPage();
      const editable = await enterEditWith(host, kind);
      expect(host.getAttribute('data-mode')).toBe('edit');
      expect(host.shadowRoot!.activeElement, 'firing control: focus is inside the shadow root').toBe(
        editable,
      );
      expect(document.activeElement, 'the document sees the HOST as focused (retargeting)').toBe(host);

      const press = await pressBackslash(host);

      // The assertion that found the defect comes FIRST: with the guard removed this reads 'raw'.
      expect(host.getAttribute('data-mode')).toBe('edit');
      expect(press.writes).toEqual([]);
      expect(press.prevented).toBe(0);
      // And the default action really happened: the backslash was typed.
      expect(typedText(editable)).toBe(TOGGLE_KEY);
    },
  );

  it('POSITIVE CONTROL: on the same shape, in reading, `\\` flips to raw — and from raw, back to reading', async () => {
    const host = mountFullPage();
    expect(host.getAttribute('data-mode')).toBe('reading');

    const toRaw = await pressBackslash(host);
    expect(toRaw.writes[0], 'the listener is live on this shape and acts in reading').toBe('raw');
    expect(toRaw.prevented).toBeGreaterThan(0);
    expect(toRaw.prevented).toBe(toRaw.writes.length); // one flip per reacting listener

    setReaderMode(host, 'raw'); // a known start, whatever the listener count's parity left
    const toReading = await pressBackslash(host);
    expect(toReading.writes[0]).toBe('reading');
    expect(toReading.prevented).toBe(toReading.writes.length);
  });
});

describe('012 task 2.1 — [data-mode="edit"] hides the reading column and the raw <pre>', () => {
  it.each([
    { name: 'full-page', make: mountFullPage },
    { name: 'contained', make: mountContained },
  ])('$name: both are display:none in edit; each is visible in its own mode', async ({ make }) => {
    const host = make();
    const shadow = host.shadowRoot!;
    const display = (cls: string): string =>
      getComputedStyle(shadow.querySelector<HTMLElement>(`.${cls}`)!).display;

    // Positive controls, same host: the instrument reads a VISIBLE view as not-none.
    expect(display('peekover-reader')).not.toBe('none');
    setReaderMode(host, 'raw'); // builds the lazy raw <pre>
    expect(display('peekover-raw')).not.toBe('none');
    expect(display('peekover-reader')).toBe('none');

    await enterEditMode(host, { loader: async () => null });
    expect(host.getAttribute('data-mode')).toBe('edit');

    expect(display('peekover-reader')).toBe('none');
    expect(display('peekover-raw')).toBe('none');
  });
});

describe('012 task 2.1 — the app-page host shape (a PIN of today, not a proof of the guard)', () => {
  it('a contained <div> host: `\\` writes no data-mode in reading or in edit, and types into the editor', async () => {
    const host = mountContained();
    expect(getComputedStyle(host).display, 'firing control: the host is rendered').not.toBe('none');

    // In reading: the listener cannot resolve a <div> host, so nothing is written to it. This is
    // the 2026-07-17 carried inertness, and the reason the guard above is unreachable here.
    const inReading = await pressBackslash(host);
    expect(inReading.writes).toEqual([]);
    expect(host.getAttribute('data-mode')).toBe('reading');

    const editable = await enterEditWith(host, 'textarea');
    expect(host.shadowRoot!.activeElement).toBe(editable);

    const inEdit = await pressBackslash(host);
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(inEdit.writes).toEqual([]);
    expect(typedText(editable)).toBe(TOGGLE_KEY);
  });
});
