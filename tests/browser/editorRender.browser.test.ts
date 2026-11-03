// The editor's first real render (012 task 3.2; D-1's control half, D-3) — Chromium AND Firefox.
//
// WHAT jsdom COULD NOT SAY, and this file does: that entering edit puts a CodeMirror view ON SCREEN
// holding the document; that real typed keys land in it; that the toolbar's segment is operable
// from the keyboard; that the pill is really hidden while editing (R3) and nothing of the edit view
// is left after the exit; and that the content-script reader has no edit control at all.
//
// 013 task 4.3 (D-6) removed the shadow-root edit control: Edit is the app page's toolbar segment,
// which calls `toggleEdit`. The keyboard and exit tests bind a real toolbar to the pane's host;
// the rest enter through `toggleEdit` itself.
//
// ══ THE ROUTE ═══════════════════════════════════════════════════════════════════════════════════
//
// The render tests go through `createReaderPane(document).select(file)` — production's own
// call site 1 (`readerPane.ts`), so the host under test is the one `enhanceEditor` made editable
// there, not one this file made editable for itself. The tests that need to INJECT a module loader
// (R2's memo) call `enhanceEditor` on a host mounted the way the pane mounts it, because the pane
// has no loader option and must not grow one for a test.
//
// Both engines run this file in the vitest browser harness page. That is the only way Firefox
// reaches this code under automation: an extension cannot be loaded into Firefox by the driver
// (plan §5), so the loaded-extension walk on Firefox is the human's, at 7.1 and at this task's
// informal eyeball.
//
// ══ EVERY TEST ASSERTS IT IS UNWATCHED (tasks.md, group 3's rule) ═══════════════════════════════
//
// Group 3 lands before group 4 closes the watch/edit collision, so a watch firing mid-test would
// re-mount the host under the editor. `expectUnwatched` is called on every fixture: no active
// `data-watch` on the host, no watch target registered, nothing watching. The registry is reset
// before each test so a target left behind by an earlier FILE is this file's to clear rather than
// its to trip over — and if a fixture ever became watched anyway, the assertion fails loudly.
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ════════════════════════════════════════════════════════════
//
// Files run serially on one `document`. Nothing here counts listeners or assumes a pristine page:
// loader calls are counted on a spy this file owns. (What `import()` itself does on a repeat is
// observed in editorDegrade.browser.test.ts, the first file to load the real engine.)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { createReaderPane } from '../../src/app/readerPane';
import { mount } from '../../src/render/mount';
import { mountReader } from '../../src/render/mountReader';
import { removeHideStyle } from '../../src/render/runReader';
import { loadCodeMirror, type EditorModuleLoader } from '../../src/render/editorEngine';
import { enhanceEditor, isEditable, toggleEdit } from '../../src/render/editorEnhancer';
import { createToolbar } from '../../src/app/toolbar';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  editorSessionFor,
  normaliseLineBreaks,
  teardownEditorShell,
} from '../../src/render/editorView';
import {
  getWatchTarget,
  isWatching,
  resetWatchRegistryForTest,
  watchAvailable,
} from '../../src/watch/watchRegistry';
import { WATCH_HOST_ATTR, resetWatchControlsForTest } from '../../src/watch/watchControl';

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test

const LF_DOC = '# Sample document\n\nBody text.\n\n## Second heading\n\nMore body.\n';
const CRLF_DOC = '# Sample document\r\n\r\nBody text.\r\n\r\n## Second heading\r\n\r\nMore body.\r\n';

const cleanup: HTMLElement[] = [];

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest(); // reset WITH the registry, always — see its doc comment
});

afterEach(async () => {
  for (const el of cleanup.splice(0)) {
    el.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    teardownEditorShell(el);
    el.remove();
  }
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  await page.viewport(NARROW.width, NARROW.height);
});

/** Group 3's precondition, asserted — not assumed — on every fixture. */
function expectUnwatched(host: HTMLElement): void {
  expect(host.getAttribute(WATCH_HOST_ATTR), 'the host carries no active data-watch').not.toBe(
    'active',
  );
  expect(getWatchTarget(), 'no watch target is registered').toBeNull();
  expect(watchAvailable()).toBe(false);
  expect(isWatching()).toBe(false);
}

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 15000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

/** Production call site 1: the reader pane selects a file. Returns the mounted host. */
async function openInPane(text: string): Promise<HTMLElement> {
  const pane = createReaderPane(document);
  document.body.prepend(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => text });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('the reader pane produced no mounted host');
  expectUnwatched(host);
  return host;
}

/** The app-page host shape, mounted the way the pane mounts it — for tests that inject a loader. */
function mountContained(text: string): HTMLElement {
  const host = document.createElement('div');
  host.style.display = 'block';
  document.body.prepend(host);
  cleanup.push(host);
  mount(text, host, { contained: true, pills: false }); // the pane's own call since 013 task 4.5
  expectUnwatched(host);
  return host;
}

/** The app page's toolbar, bound to `host` (D-6: Edit is its segment); its segment for `mode`. */
function toolbarFor(host: HTMLElement): (mode: 'reading' | 'edit' | 'raw') => HTMLButtonElement {
  const toolbar = createToolbar(document);
  document.body.prepend(toolbar.element);
  cleanup.push(toolbar.element);
  toolbar.setDocument('doc.md', host);
  return (mode) => toolbar.element.querySelector<HTMLButtonElement>(`.peekover-toolbar__seg [data-mode="${mode}"]`)!;
}
/** The OUTER reading column — a direct child of the host's shadow root, never the preview's. */
const columnIn = (host: HTMLElement): HTMLElement =>
  [...host.shadowRoot!.children].find((el) => el.classList.contains('peekover-reader')) as HTMLElement;
const modeIs = (host: HTMLElement, mode: string) => (): boolean =>
  host.getAttribute('data-mode') === mode;

/** KEEPS: each test's own property (C173, C175, C178). RE-SPELLED at 4.3: entered by `toggleEdit` —
 *  what the toolbar's Edit segment calls — not the removed shadow-root control. */
async function enterEdit(host: HTMLElement): Promise<void> {
  void toggleEdit(host);
  await waitFor(modeIs(host, 'edit'), 'data-mode="edit"');
  await frames();
}

/** The text CodeMirror has actually DRAWN, line by line — not the state it holds. */
const drawnText = (host: HTMLElement): string =>
  [...host.shadowRoot!.querySelectorAll('.cm-content .cm-line')].map((l) => l.textContent).join('\n');

/** The innermost element at a point, drilling through every open shadow root on the way. */
function deepElementAt(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

const centreOf = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
};

const onScreen = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

// ── The view ─────────────────────────────────────────────────────────────────────────────────

describe('012 task 3.2 — activating the control presents a CodeMirror view holding the document', () => {
  it('★ LF fixture: the view is on screen in the source slot and its content equals the source', async () => {
    const host = await openInPane(LF_DOC);
    expect(host.shadowRoot!.querySelector('.cm-editor'), 'no editor before activation').toBeNull();

    await enterEdit(host);

    const slot = host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SOURCE_CLASS}`)!;
    const editor = slot.querySelector<HTMLElement>('.cm-editor');
    expect(editor, 'a CodeMirror view in the source slot').not.toBeNull();
    const session = editorSessionFor(host)!;
    expect(session.view.dom).toBe(editor);
    expect(session.view.state.doc.toString()).toBe(LF_DOC);
    expect(drawnText(host)).toBe(LF_DOC);

    // On screen, and the thing at the slot's centre is the editor — not a cover over it.
    expect(onScreen(editor!)).toBe(true);
    const c = centreOf(slot);
    expect(editor!.contains(deepElementAt(c.x, c.y)), 'the slot centre hits the editor').toBe(true);
    // It FILLS its pane (EDITOR_CSS): a view only as tall as its text would leave most of the
    // pane a dead area that neither focuses nor scrolls the editor.
    expect(Math.abs(editor!.getBoundingClientRect().height - slot.clientHeight)).toBeLessThanOrEqual(1);
    // The reading column gave way to it.
    expect(getComputedStyle(columnIn(host)).display).toBe('none');
    expectUnwatched(host);
  });

  it('★ CRLF fixture: the view holds the LF-normalised source, originalText stays raw, and the dirty attribute is ABSENT on entry', async () => {
    const host = await openInPane(CRLF_DOC);
    await enterEdit(host);
    const session = editorSessionFor(host)!;

    // The defect's own signature first: a naive buffer-vs-raw compare marks this file dirty here.
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(session.view.state.doc.toString()).toBe(normaliseLineBreaks(CRLF_DOC));
    expect(session.view.state.doc.toString()).toBe(LF_DOC);
    expect(drawnText(host)).toBe(LF_DOC);
    expect(session.originalText).toBe(CRLF_DOC);
    expect(session.originalText).not.toBe(session.view.state.doc.toString()); // the CRs are real
    expectUnwatched(host);
  });

  it('★ typed text appears in the view; it marks the document dirty; undoing it clears the mark', async () => {
    const host = await openInPane(CRLF_DOC);
    await enterEdit(host);
    const { view } = editorSessionFor(host)!;
    const seeded = view.state.doc.toString();
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);

    view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    await userEvent.keyboard('typed marker');

    expect(view.state.doc.toString()).toBe(`typed marker${seeded}`);
    expect(drawnText(host).startsWith('typed marker# Sample document')).toBe(true);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    // The editor's OWN undo (basicSetup's history keymap), pressed until the text is back.
    for (let i = 0; i < 20 && view.state.doc.toString() !== seeded; i += 1) {
      await userEvent.keyboard('{Control>}z{/Control}');
    }
    expect(view.state.doc.toString()).toBe(seeded);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(host.getAttribute('data-mode')).toBe('edit');
    expectUnwatched(host);
  });
});

// ── The Edit segment, from the keyboard ─────────────────────────────────────────────────────────

// RETIRED: "%s: the control is hit-testable beside the pill and never under it, with either pill
// label" (C172) — there is no edit control in the shadow root to sit beside the pill (D-6).
describe('013 task 4.3 — the Edit segment is a real button, keyboard-operable, its state in its name', () => {
  // REPLACED (C177): the shadow-root control's Enter / Space and its "Stop editing" name. The
  // property kept — a real, keyboard-operable control whose state is in its name — on the segment.
  it('★ Edit is a <button>; Enter on it enters; Space on Read leaves; aria-pressed and the name say which', async () => {
    const host = await openInPane(LF_DOC);
    const segment = toolbarFor(host);
    const edit = segment('edit');

    expect(edit.tagName).toBe('BUTTON');
    expect(edit.type).toBe('button');
    expect([edit.textContent, edit.getAttribute('aria-label'), edit.getAttribute('aria-pressed')]).toEqual([
      'Edit', 'Edit this document', 'false',
    ]);
    expect(edit.tabIndex).toBe(0);

    edit.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(modeIs(host, 'edit'), 'Enter on Edit enters edit');
    expect([edit.getAttribute('aria-pressed'), edit.getAttribute('aria-label')]).toEqual(['true', 'Editing this document']);
    expect(host.shadowRoot!.querySelector('.cm-editor')).not.toBeNull();

    segment('reading').focus();
    await userEvent.keyboard(' ');
    await waitFor(modeIs(host, 'reading'), 'Space on Read leaves edit');
    expect([edit.getAttribute('aria-pressed'), segment('reading').getAttribute('aria-pressed')]).toEqual(['false', 'true']);
    expectUnwatched(host);
  });
});

// ── R3 — the pill in edit, and the exit ──────────────────────────────────────────────────────

describe('012 task 3.2 (R3) — the pill is hidden in edit; Read exits with nothing left behind', () => {
  // KEEPS: the exit is on screen and leaves no residue (C178).
  // RE-SPELLED at 4.3: the exit is the toolbar's Read (ruling E), not the removed control.
  // RETIRED at 013 task 4.5 (C178's mode-pill clause, as the census said): "the pill is display:none while
  // editing" — the app page mounts its reader with `pills: false`, so there is no pill to hide (asserted).
  it('★ the pill is display:none while editing, Read is the way out, and no shell residue remains', async () => {
    const host = await openInPane(LF_DOC);
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('.peekover-mode-toggle'), 'the app page builds no mode pill (4.5)').toBeNull();
    const control = toolbarFor(host)('reading');
    const before = [...shadow.children];
    const column = columnIn(host);

    await enterEdit(host);
    expect(onScreen(control), 'the exit is on screen').toBe(true);
    const c = centreOf(control);
    expect(deepElementAt(c.x, c.y)).toBe(control);
    expect(shadow.querySelector(`.${EDITOR_SHELL_CLASS}`)).not.toBeNull();

    control.click(); // the exit
    expect(host.getAttribute('data-mode')).toBe('reading');
    // No residue: the shadow root's children are the SAME nodes as before entry, in order.
    const after = [...shadow.children];
    expect(after.length).toBe(before.length);
    expect(after.every((node, i) => node === before[i])).toBe(true);
    expect(shadow.querySelector(`.${EDITOR_SHELL_CLASS}`)).toBeNull();
    expect(shadow.querySelector('.cm-editor')).toBeNull();
    expect(editorSessionFor(host)).toBeUndefined();
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    // And the document is back on screen.
    expect(getComputedStyle(column).display).not.toBe('none');
    expect(onScreen(column)).toBe(true);
    expectUnwatched(host);
  });

  // RETIRED: "entered from raw, the exit returns to raw" (C174) — ruling E (2026-11-02), with C046:
  // in the segment, the one you click is where you go (tests/browser/toolbar.browser.test.ts).
});

// ── Absent on the content-script reader ──────────────────────────────────────────────────────

describe('012 task 3.2 — the content-script reader has no edit control', () => {
  it('★ mountReader() — the content script’s own mount — installs none; the app page’s pane installs one', async () => {
    // Driven through production's content-script mount, so un-gating it (an `enhanceEditor` call
    // in `mountReader.ts`) is what turns this red.
    document.querySelectorAll('peekover-root').forEach((stray) => stray.remove());
    const pre = document.createElement('pre');
    pre.textContent = LF_DOC;
    document.body.appendChild(pre);
    const displays = [...document.body.children].map((el) => [el, (el as HTMLElement).style.display] as const);
    let host: HTMLElement | null = null;
    try {
      expect(mountReader(), 'the content-script mount committed').toBe(true);
      host = document.querySelector<HTMLElement>('peekover-root');
      expect(host?.shadowRoot?.querySelector('.peekover-reader h1')?.textContent).toBe('Sample document');
      expect(host!.shadowRoot!.querySelector('.peekover-mode-toggle'), 'it has its ordinary chrome').not.toBeNull();

      expect(host!.shadowRoot!.querySelector('.peekover-edit-toggle')).toBeNull();
      expect(isEditable(host), 'the content script never makes its host editable').toBe(false);
      // ...and nothing that reads as one under another class.
      expect(
        [...host!.shadowRoot!.querySelectorAll('button')]
          .map((b) => b.textContent ?? '')
          .filter((text) => /^(Edit|Stop editing|Editor unavailable)$/.test(text)),
      ).toEqual([]);
    } finally {
      host?.remove();
      pre.remove();
      removeHideStyle();
      for (const [el, display] of displays) (el as HTMLElement).style.display = display;
    }

    // POSITIVE CONTROL, same test: the same document on the app page's pane IS editable.
    // KEEPS: the content script never offers Edit; the app page does (C176). RE-SPELLED at 4.3: read
    // as `isEditable` — what the toolbar's Edit segment asks — the shadow-root control is gone.
    const appHost = await openInPane(LF_DOC);
    expect(isEditable(appHost)).toBe(true);
  });
});

// ── R2 — one load across edit → reading → edit ───────────────────────────────────────────────

describe('012 task 3.2 (R2) — the engine load is keyed on the outer host', () => {
  it('★ edit → reading → edit runs the module loader ONCE; a second host runs it again', async () => {
    const loader = vi.fn<EditorModuleLoader>(() => loadCodeMirror());
    const host = mountContained(LF_DOC);
    enhanceEditor(host, { loader });

    await enterEdit(host);
    const firstView = editorSessionFor(host)!.view;
    void toggleEdit(host);
    expect(host.getAttribute('data-mode')).toBe('reading');
    await enterEdit(host);

    expect(loader).toHaveBeenCalledTimes(1);
    // A new session on the reused engine: a fresh view, on screen, holding the document.
    const secondView = editorSessionFor(host)!.view;
    expect(secondView).not.toBe(firstView);
    expect(onScreen(secondView.dom)).toBe(true);
    expect(secondView.state.doc.toString()).toBe(LF_DOC);

    // THE CONTROL: the spy is live — a different host makes it run again.
    const other = mountContained(LF_DOC);
    enhanceEditor(other, { loader });
    await enterEdit(other);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
