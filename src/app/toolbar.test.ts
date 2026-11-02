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
import { registerWatchTarget, resetWatchRegistryForTest, setWatchNote } from '../watch/watchRegistry';
import { resetWatchControlsForTest } from '../watch/watchControl';
import { createDiffContext, registerDiffContext, resetDiffRegistryForTest } from '../render/diffRegistry';
import { registerDocIdentity, resetDocIdentityForTest } from '../render/docIdentity';
import { mount } from '../render/mount';
import { enhanceEditor } from '../render/editorEnhancer';

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
    // KEEPS: the toolbar composes the mock's parts in the mock's order (4.1's own test). RE-SPELLED at
    // 4.2: the badge, Watch and Compare slots join between the file name and Read / Raw.
    const parts = [...tb.element.children].map((el) => el.className.split(' ')[0]);
    expect(parts).toEqual([
      `${TOOLBAR_CLASS}__brand`,
      `${TOOLBAR_CLASS}__file`,
      `${TOOLBAR_CLASS}__badge`,
      `${TOOLBAR_CLASS}__watch`,
      `${TOOLBAR_CLASS}__compare`,
      `${TOOLBAR_CLASS}__seg`,
    ]);
    // KEEPS: the segment's views in the mock's order (C358). RE-SPELLED at 4.3: Edit joins (D-6).
    expect([...tb.element.querySelectorAll(`.${TOOLBAR_CLASS}__seg button`)].map((b) => b.textContent)).toEqual([
      'Read',
      'Edit',
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

  it('with no document, Read, Edit and Raw are present but disabled and unpressed', () => {
    const tb = createToolbar(document);
    // KEEPS: nothing to act on, nothing offered (C359). RE-SPELLED at 4.3: Edit joins.
    expect(seg(tb.element)).toEqual({
      reading: { pressed: 'false', disabled: true },
      edit: { pressed: 'false', disabled: true },
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
    // KEEPS: the flip is reflected (C360). RE-SPELLED at 4.3: Edit joins — disabled on this host,
    // which was never made editable (`enhanceEditor`).
    expect(seg(tb.element)).toEqual({
      reading: { pressed: 'false', disabled: false },
      edit: { pressed: 'false', disabled: true },
      raw: { pressed: 'true', disabled: false },
    });
  });

  // RETIRED: "while editing, Read and Raw are disabled" (C361) — 4.1's interim, ended by ruling E:
  // Read and Raw leave edit through the unsaved-changes guard. Their behaviour while editing is
  // the 4.3 describe below, and tests/browser/toolbar.browser.test.ts's.

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

describe('the toolbar — Watch, Compare, the badge, the notice area (4.2)', () => {
  afterEach(() => {
    resetWatchRegistryForTest();
    resetWatchControlsForTest();
    resetDiffRegistryForTest();
    resetDocIdentityForTest();
  });

  function registries(): void {
    registerWatchTarget({ start: () => undefined, stop: () => undefined, isWatching: () => false });
    registerDiffContext(
      createDiffContext({
        docId: 'f\u001fCLAUDE.md',
        getCurrentSource: () => '# A',
        fetchMeta: async () => [],
        fetchText: async () => undefined,
        showDiff: () => ({ ok: true }) as never,
        hideDiff: () => undefined,
      }),
    );
    registerDocIdentity('CLAUDE.md');
  }

  it('fills the badge, Watch and Compare slots from the same builders as the pills, and empties them with no document', () => {
    registries();
    const tb = createToolbar(document);
    const h = document.createElement('div');
    document.body.appendChild(h);
    mount('# A', h, { contained: true });
    tb.setDocument('CLAUDE.md', h);
    expect(tb.element.querySelector('.peekover-agent-badge')?.textContent).toBe('Agent file · CLAUDE.md');
    expect(tb.element.querySelector('.peekover-watch')?.getAttribute('aria-pressed')).toBe('false');
    expect(tb.element.querySelector('.peekover-diff-affordance')?.textContent).toBe('Compare');
    expect(tb.element.querySelector('.peekover-diff-picker'), 'the picker sits under Compare, in the toolbar').not.toBeNull();
    // Compare's status line lives in the notice area, not the toolbar.
    expect(tb.notices.querySelector('.peekover-diff-status')).not.toBeNull();
    tb.setDocument(null, null);
    for (const sel of ['.peekover-agent-badge', '.peekover-watch', '.peekover-diff-affordance']) {
      expect(tb.element.querySelector(sel), `${sel} with no document`).toBeNull();
    }
  });

  it('Compare follows the host\'s data-diff on BOTH controls — its own and the reader\'s pill', async () => {
    registries();
    const tb = createToolbar(document);
    const h = document.createElement('div');
    document.body.appendChild(h);
    mount('# A', h, { contained: true });
    tb.setDocument('CLAUDE.md', h);
    const pill = h.shadowRoot!.querySelector<HTMLElement>('.peekover-diff-affordance')!;
    const own = tb.element.querySelector<HTMLElement>('.peekover-diff-affordance')!;
    h.setAttribute('data-diff', 'active'); // what diffView does when a comparison shows, from either control
    await tick();
    expect([own.textContent, own.dataset.diffOpen, pill.textContent, pill.dataset.diffOpen]).toEqual([
      'Close comparison', 'true', 'Close comparison', 'true',
    ]);
    h.removeAttribute('data-diff');
    await tick();
    expect([own.textContent, own.dataset.diffOpen, pill.textContent, pill.dataset.diffOpen]).toEqual([
      'Compare', undefined, 'Compare', undefined,
    ]);
  });

  it('the notice area carries the watch note — hidden with nothing to say, shown when there is', () => {
    const tb = createToolbar(document);
    document.body.appendChild(tb.notices);
    const note = tb.notices.querySelector<HTMLElement>('.peekover-watch-note')!;
    expect(note.hidden).toBe(true);
    setWatchNote('Watching stopped.');
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe('Watching stopped.');
  });
});

describe('the toolbar — the Edit segment (4.3; ruling E)', () => {
  it('Edit is offered only on an editable host; a failed load says "Editor unavailable" on it and keeps the mode', async () => {
    const tb = createToolbar(document);
    const h = document.createElement('div');
    document.body.appendChild(h);
    mount('# A', h, { contained: true });
    tb.setDocument('a.md', h);
    const edit = tb.element.querySelector<HTMLButtonElement>('[data-mode="edit"]')!;
    expect(edit.disabled, 'not editable until enhanceEditor').toBe(true);

    let calls = 0;
    enhanceEditor(h, { loader: () => ((calls += 1), Promise.reject(new Error('chunk failed to load'))) });
    tb.setDocument('a.md', h);
    expect(edit.disabled).toBe(false);
    expect([edit.textContent, edit.getAttribute('aria-label')]).toEqual(['Edit', 'Edit this document']);
    edit.click();
    edit.click(); // a second activation while the load is pending joins it
    for (let i = 0; i < 5; i += 1) await tick();
    expect(calls, 'one entry, one load').toBe(1);
    expect(edit.textContent).toBe('Editor unavailable');
    expect(edit.getAttribute('aria-label')).toBe('The editor could not be loaded. Activate to try again.');
    expect(h.getAttribute('data-mode')).toBe('reading');
    tb.setDocument('b.md', h);
    expect(edit.textContent, 'a document switch starts the segment afresh').toBe('Edit');
  });
});
