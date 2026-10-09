// @vitest-environment jsdom
//
// editorEnhancer — the edit control, the edit session behind it, and the save-capability
// injection (012 task 3.2; D-1's control half, D-3; F-4, F-5).
//
// jsdom-safe vs real-engine. Everything here is DOM shape, attributes, call counts, source text
// read off disk, and CodeMirror's DOCUMENT MODEL (text in, text out — 3.1 established that a view
// built in jsdom holds a document honestly). That the view RENDERS, takes typed input, that the
// control is keyboard-operable, that the pill is really hidden and nothing is left on screen after
// exit: tests/browser/editorRender.browser.test.ts and editorDegrade.browser.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { mount } from './mount';
import { loadCodeMirror, type EditorModuleLoader } from './editorEngine';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_SHELL_CLASS,
  editorSessionFor,
  normaliseLineBreaks,
} from './editorView';
import { EDIT_CONTROL_CLASS, enhanceEditor, type EditorSave } from './editorEnhancer';
import { EDITOR_CSS, EDIT_CONTROL_CSS, READER_CSS } from '../theme/readerCss';
import { createReaderPane } from '../app/readerPane';
import { mountAppShell, type AppStore } from '../app/appShell';
import type { FolderSource, MarkdownFile } from '../app/folderSource';

const ROOT = process.cwd(); // vitest runs from the project root
const read = (file: string): string => readFileSync(join(ROOT, file), 'utf8');

const DOC = '# Outer\n\nBody.\n\n## Second\n\nMore.\n';
const CRLF_DOC = '# Outer\r\n\r\nBody.\r\n\r\n## Second\r\n\r\nMore.\r\n';
const MIXED_DOC = 'a\r\nb\nc\rd\r\n';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
});

/** The app-page shape: a plain <div>, mounted contained — `readerPane.ts`'s own call. */
function mountedHost(source = DOC): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  mount(source, host, { contained: true });
  return host;
}

const controlsIn = (host: HTMLElement): HTMLElement[] => [
  ...host.shadowRoot!.querySelectorAll<HTMLElement>(`.${EDIT_CONTROL_CLASS}`),
];
const controlIn = (host: HTMLElement): HTMLElement => controlsIn(host)[0];
const shellIn = (host: HTMLElement): Element | null =>
  host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`);

/** Click the control and wait for the mode the click is expected to land in. */
async function clickUntil(host: HTMLElement, mode: string): Promise<void> {
  controlIn(host).click();
  await vi.waitFor(() => expect(host.getAttribute('data-mode')).toBe(mode));
}

/** Replace the whole buffer — the document-model stand-in for typing. */
function setBuffer(host: HTMLElement, text: string): void {
  const { view } = editorSessionFor(host)!;
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
}

// ── The injection shape (D-3; F-5) ───────────────────────────────────────────────────────────

describe('D-3 — no render module names a file handle type; readerPane stays capability-free', () => {
  const HANDLE_TYPE = 'FileSystemFileHandle';
  const editorModules = (): string[] =>
    readdirSync(join(ROOT, 'src/render'))
      .filter((name) => /^editor[A-Z]\w*\.ts$/.test(name))
      .map((name) => `src/render/${name}`);

  it('neither readerPane.ts nor any src/render/editor*.ts names FileSystemFileHandle', () => {
    const modules = editorModules();
    // The name match must be seen to match — the enhancer included, so this cannot pass on a
    // tree that does not have one.
    expect(modules).toEqual(
      expect.arrayContaining([
        'src/render/editorEngine.ts',
        'src/render/editorView.ts',
        'src/render/editorEnhancer.ts',
      ]),
    );
    const offenders = ['src/app/readerPane.ts', ...modules].filter((file) =>
      read(file).includes(HANDLE_TYPE),
    );
    expect(offenders).toEqual([]);
  });

  it('FIRING CONTROL: the same scan finds the type where it really is', () => {
    expect(existsSync(join(ROOT, 'src/app/folderSource.ts'))).toBe(true);
    expect(read('src/app/folderSource.ts')).toContain(HANDLE_TYPE);
  });

  it('enhanceEditor is LISTED at both app-page call sites, directly after enhanceMath', () => {
    for (const [file, arg] of [
      ['src/app/readerPane.ts', 'host'],
      ['src/app/appShell.ts', 'target'],
    ] as const) {
      const src = read(file);
      const math = src.indexOf(`enhanceMath(${arg})`);
      const editor = src.indexOf(`enhanceEditor(${arg}, { save`);
      const tables = src.indexOf(`enhanceTables(${arg})`);
      expect(math, `${file}: enhanceMath`).toBeGreaterThan(-1);
      expect(editor, `${file}: enhanceEditor(${arg}, { save … })`).toBeGreaterThan(math);
      expect(tables, `${file}: enhanceTables`).toBeGreaterThan(editor);
    }
  });

  // RE-SPELLED AT 5.3. The injected capability is now a binder, called once at edit entry, so
  // "by identity" is the identity of what it RETURNED, and "nothing invokes it" (true of 3.2's
  // plumbing) became "it is bound once, and the bound save is not called until a Save".
  it('readerPane threads an injected save into the session, by identity', async () => {
    const bound = vi.fn(async () => ({ kind: 'unavailable' as const }));
    const save = vi.fn<EditorSave>(() => bound);
    const pane = createReaderPane(document, { save });
    document.body.appendChild(pane.element);
    hosts.push(pane.element);
    await pane.select({ name: 'doc.md', read: async () => DOC });
    const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host')!;

    expect(save).not.toHaveBeenCalled(); // not at mount: nothing is bound until edit is entered
    await clickUntil(host, 'edit');
    expect(save).toHaveBeenCalledTimes(1);
    expect(editorSessionFor(host)!.save).toBe(bound);
    expect(bound).not.toHaveBeenCalled(); // entering edit saves nothing
  });

  it('a pane created with no options still edits; its session simply has no save', async () => {
    const pane = createReaderPane(document);
    document.body.appendChild(pane.element);
    hosts.push(pane.element);
    await pane.select({ name: 'doc.md', read: async () => DOC });
    const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host')!;

    await clickUntil(host, 'edit');
    expect(editorSessionFor(host)!.save).toBeUndefined();
  });

  // RE-SPELLED AT 5.3: 3.2's body was a stub that said "not yet available". The body is now the
  // write (tests/browser/editorSave.browser.test.ts). What jsdom can still say of it is the route
  // with nothing to write to: this file carries no handle, so the answer is `unavailable`.
  it('★ appShell injects a save that, for a file with no handle, answers "unavailable" — and does nothing else', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    hosts.push(container);
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
    };
    const read = vi.fn(async () => DOC);
    const file: MarkdownFile = { path: 'notes.md', name: 'notes.md', read };
    const source: FolderSource = { name: 'notes', files: [file], truncated: false, persistable: false };
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    const host = await vi.waitFor(() => {
      const el = container.querySelector<HTMLElement>('.peekover-app__reader__host');
      expect(el?.shadowRoot?.querySelector(`.${EDIT_CONTROL_CLASS}`)).toBeTruthy();
      return el!;
    });

    await clickUntil(host, 'edit');
    const { save } = editorSessionFor(host)!;
    expect(typeof save).toBe('function');
    read.mockClear();
    const outcome = await save!({ text: 'edited text', baseline: DOC });
    expect(outcome).toEqual({ kind: 'unavailable' });
    expect(read).not.toHaveBeenCalled(); // nothing to compare against, so nothing is re-read
  });
});

// ── The control (D-1's control half; R3) ─────────────────────────────────────────────────────

describe('the edit control — installed beside the mode pill, once, and after every outer mount', () => {
  it('is one real <button> placed directly after the mode pill, with its own stylesheet', () => {
    const host = mountedHost();
    expect(controlsIn(host)).toHaveLength(0); // mount() alone composes no edit control

    enhanceEditor(host);

    const [control] = controlsIn(host);
    expect(controlsIn(host)).toHaveLength(1);
    expect(control.tagName).toBe('BUTTON');
    expect((control as HTMLButtonElement).type).toBe('button');
    expect(control.previousElementSibling?.className).toBe('peekover-mode-toggle');
    const sheets = [...host.shadowRoot!.querySelectorAll('style')].filter(
      (s) => s.textContent === EDIT_CONTROL_CSS,
    );
    expect(sheets).toHaveLength(1);
  });

  it('is idempotent: a second call adds no second control and no second stylesheet', () => {
    const host = mountedHost();
    enhanceEditor(host);
    const first = controlIn(host);
    enhanceEditor(host);

    expect(controlsIn(host)).toEqual([first]);
    expect(
      [...host.shadowRoot!.querySelectorAll('style')].filter((s) => s.textContent === EDIT_CONTROL_CSS),
    ).toHaveLength(1);
  });

  it('★ re-installs after an outer mount(), which rebuilds the chrome and drops it', () => {
    const host = mountedHost();
    enhanceEditor(host);
    const first = controlIn(host);

    mount(DOC, host, { contained: true });
    // The firing control: the re-mount really did take the control and its stylesheet away.
    expect(controlsIn(host)).toHaveLength(0);
    expect(first.isConnected).toBe(false);

    enhanceEditor(host);
    expect(controlsIn(host)).toHaveLength(1);
    expect(controlIn(host)).not.toBe(first);
    expect(controlIn(host).previousElementSibling?.className).toBe('peekover-mode-toggle');
  });

  it('installs nothing on a failed render (no data-mode) or on a host with no shadow root', () => {
    const bare = document.createElement('div');
    document.body.appendChild(bare);
    hosts.push(bare);
    enhanceEditor(bare);
    expect(bare.shadowRoot).toBeNull();
    expect(bare.childNodes).toHaveLength(0);

    const failed = mountedHost();
    failed.removeAttribute('data-mode'); // the raw-fallback path's signature (mount.ts)
    enhanceEditor(failed);
    expect(controlsIn(failed)).toHaveLength(0);
  });

  it('★ R3 — the label and the accessible name say Edit at rest, and say the exit while editing', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    const control = controlIn(host);
    expect(control.textContent).toBe('Edit');
    expect(control.getAttribute('aria-label')).toBe('Edit this document');

    await clickUntil(host, 'edit');
    expect(control.textContent).toBe('Stop editing');
    expect(control.getAttribute('aria-label')).toBe('Stop editing and return to the document');
    expect(shellIn(host)).not.toBeNull();
    expect(editorSessionFor(host)).toBeDefined();

    await clickUntil(host, 'reading');
    expect(control.textContent).toBe('Edit');
    expect(control.getAttribute('aria-label')).toBe('Edit this document');
    // The exit ran the teardown: no shell, no session, no dirty attribute.
    expect(shellIn(host)).toBeNull();
    expect(editorSessionFor(host)).toBeUndefined();
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('R3 — the exit returns to the mode edit was entered from', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    host.shadowRoot!.querySelector<HTMLElement>('.peekover-mode-toggle')!.click();
    expect(host.getAttribute('data-mode')).toBe('raw');

    await clickUntil(host, 'edit');
    await clickUntil(host, 'raw');
    expect(shellIn(host)).toBeNull();
  });

  it('R3 — the pill-hide rule lives in EDITOR_CSS, and READER_CSS gains no rule for the control', () => {
    expect(EDITOR_CSS).toContain(':host([data-mode="edit"]) .peekover-mode-toggle{display:none}');
    expect(READER_CSS).not.toContain(EDIT_CONTROL_CLASS);
    expect(EDIT_CONTROL_CSS).toContain(`.${EDIT_CONTROL_CLASS}{`);
    expect(EDIT_CONTROL_CSS).not.toContain(':host'); // no new :host site anywhere for the control
    expect(EDIT_CONTROL_CSS).not.toContain('/*'); // rationale ships if it is written in the literal
  });

  it('a second click while the engine is still loading starts no second entry', async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const loader = vi.fn<EditorModuleLoader>(async () => {
      await gate;
      return loadCodeMirror();
    });
    const host = mountedHost();
    enhanceEditor(host, { loader });

    controlIn(host).click();
    controlIn(host).click();
    expect(host.getAttribute('data-mode')).toBe('reading'); // never 'edit' while the load is pending
    release();
    await vi.waitFor(() => expect(host.getAttribute('data-mode')).toBe('edit'));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`)).toHaveLength(1);
  });
});

// ── R2 — the load is keyed on the OUTER host ─────────────────────────────────────────────────

describe('R2 — one engine load spans edit → reading → edit', () => {
  it('★ the module loader runs once across two edit sessions on one host', async () => {
    const loader = vi.fn<EditorModuleLoader>(() => loadCodeMirror());
    const host = mountedHost();
    enhanceEditor(host, { loader });

    await clickUntil(host, 'edit');
    await clickUntil(host, 'reading');
    await clickUntil(host, 'edit');
    expect(loader).toHaveBeenCalledTimes(1);

    // THE CONTROL: the same spy does run again for a different host, so "once" is the memo
    // holding on this host and not a loader that was never reached.
    const other = mountedHost();
    enhanceEditor(other, { loader });
    await clickUntil(other, 'edit');
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

// ── The seed, originalText and the dirty attribute (D-7; F-4) ────────────────────────────────

describe('normaliseLineBreaks — the editor’s own line-break rule, as a pure function', () => {
  it.each([
    ['LF is untouched', 'a\nb\n', 'a\nb\n'],
    ['CRLF', 'a\r\nb\r\n', 'a\nb\n'],
    ['lone CR', 'a\rb', 'a\nb'],
    ['mixed', MIXED_DOC, 'a\nb\nc\nd\n'],
    ['CR CR LF is two breaks', 'a\r\r\nb', 'a\n\nb'],
    ['empty', '', ''],
  ])('%s', (_name, input, output) => {
    expect(normaliseLineBreaks(input)).toBe(output);
  });
});

describe('the edit session — seeded from the registered source; originalText stays RAW', () => {
  it.each([
    ['an LF file', DOC],
    ['a CRLF file', CRLF_DOC],
    ['a mixed-ending file', MIXED_DOC],
  ])('★ %s: the dirty attribute is ABSENT on entry, present after an edit, absent after undoing it', async (_name, source) => {
    const host = mountedHost(source);
    enhanceEditor(host);
    await clickUntil(host, 'edit');
    const session = editorSessionFor(host)!;

    // originalText is the raw read — never the editor's normalised copy of it (D-7).
    expect(session.originalText).toBe(source);
    expect(session.view.state.doc.toString()).toBe(normaliseLineBreaks(source));
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);

    const seeded = session.view.state.doc.toString();
    setBuffer(host, `${seeded}typed`);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    setBuffer(host, seeded); // back to the original text, as an undo leaves it
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('the dirty attribute is written on the OUTER host and nowhere else', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    await clickUntil(host, 'edit');
    setBuffer(host, 'changed');

    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
    expect(host.shadowRoot!.querySelectorAll(`[${EDITOR_DIRTY_ATTR}]`)).toHaveLength(0);
    expect(EDITOR_DIRTY_ATTR).toBe('data-edit-dirty'); // 4.2 and 6.1 read it by this literal
  });

  it('★ an outer re-mount during an edit ends the session: no stale dirty attribute survives it', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    await clickUntil(host, 'edit');
    setBuffer(host, 'unsaved');
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    // What a document switch does: the same host, re-mounted with another file's text.
    mount('# Another document\n', host, { contained: true });
    enhanceEditor(host);

    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(editorSessionFor(host)).toBeUndefined();
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(controlIn(host).textContent).toBe('Edit');

    // And the next session seeds from the NEW document.
    await clickUntil(host, 'edit');
    expect(editorSessionFor(host)!.originalText).toBe('# Another document\n');
  });
});

// ── Degrade (§3.7) ───────────────────────────────────────────────────────────────────────────

describe('degrade — the engine cannot load', () => {
  it('★ leaves the prior mode, builds no editor, and the control says so in text', async () => {
    const loader = vi.fn<EditorModuleLoader>(() => Promise.reject(new Error('chunk failed to load')));
    const host = mountedHost();
    enhanceEditor(host, { loader });
    const control = controlIn(host);
    const before = [...host.shadowRoot!.children];

    control.click();
    // Wait on the LOAD settling, not on the control's text: a wait for the text would be the first
    // thing to fail under the defect, ahead of the assertion that actually shows it.
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    await Promise.allSettled(loader.mock.results.map((r) => r.value));
    await new Promise<void>((r) => setTimeout(r, 0));

    // The half-mounted signature first: 'edit' with nothing behind it.
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(control.textContent).toBe('Editor unavailable');
    expect(shellIn(host)).toBeNull();
    expect(host.shadowRoot!.querySelector('.cm-editor')).toBeNull();
    expect([...host.shadowRoot!.children]).toEqual(before);
    expect(control.getAttribute('aria-label')).toBe(
      'The editor could not be loaded. Activate to try again.',
    );
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('a failure is retryable: the next activation loads again and enters edit', async () => {
    const loader = vi
      .fn<EditorModuleLoader>()
      .mockRejectedValueOnce(new Error('chunk failed to load'))
      .mockImplementation(() => loadCodeMirror());
    const host = mountedHost();
    enhanceEditor(host, { loader });
    const control = controlIn(host);

    control.click();
    await vi.waitFor(() => expect(control.textContent).toBe('Editor unavailable'));
    await clickUntil(host, 'edit');

    expect(loader).toHaveBeenCalledTimes(2);
    expect(control.textContent).toBe('Stop editing');
    expect(editorSessionFor(host)).toBeDefined();
  });
});
