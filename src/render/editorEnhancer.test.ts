// @vitest-environment jsdom
//
// editorEnhancer — entering and leaving edit (`toggleEdit`, `leaveEdit`), the edit session behind
// it, and the save-capability injection (012 task 3.2; D-1, D-3; F-4, F-5). 013 task 4.3 (D-6)
// removed the shadow-root edit control: the way in is the toolbar's Edit segment, which calls
// `toggleEdit` — so the tests here drive `toggleEdit` itself, and the segment's own text, state and
// guard are src/app/toolbar.test.ts's and tests/browser/toolbar.browser.test.ts's.
//
// jsdom-safe vs real-engine. Everything here is DOM shape, attributes, call counts, source text
// read off disk, and CodeMirror's DOCUMENT MODEL (text in, text out — 3.1 established that a view
// built in jsdom holds a document honestly). That the view RENDERS, takes typed input, that the pill
// is really hidden and nothing is left on screen after exit: tests/browser/editorRender.browser.test.ts
// and editorDegrade.browser.test.ts.

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
import { enhanceEditor, isEditable, toggleEdit, type EditorSave } from './editorEnhancer';
import { EDITOR_CSS, READER_CSS } from '../theme/readerCss';
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

const shellIn = (host: HTMLElement): Element | null =>
  host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`);

/** Toggle edit and wait for the mode it is expected to land in.
 *  KEEPS: every session test's own property (C033, C036–C039, C042–C044, C048). RE-SPELLED at 4.3:
 *  entered and left by `toggleEdit` — what the toolbar's Edit segment calls — not the removed
 *  shadow-root control (D-6). */
async function clickUntil(host: HTMLElement, mode: string): Promise<void> {
  void toggleEdit(host);
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

  // ── The route → download decision (5.4; D-6) ───────────────────────────────────────────────
  //
  // What jsdom can say of the shell's save is the routes with nothing to write to. jsdom has no
  // `URL.createObjectURL`, so a stand-in records the blob `downloadAs` builds, and the anchor
  // click — which would otherwise be a navigation jsdom does not implement — is swallowed and
  // recorded. The real blob, the real click and both engines: tests/browser/editorSave.browser.test.ts.

  interface Captured {
    filename: string;
    type: string;
    text: string;
  }

  /** The blob's text, byte for byte (FileReader: jsdom's Blob predates `text()` in some versions). */
  const blobText = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });

  /** Record every download from here on. The two URL functions are left in place afterwards:
   *  `downloadAs` revokes its URL a task later, after the test that made it has returned. */
  function captureDownloads(): { settled: () => Promise<Captured[]>; restore: () => void } {
    const blobs = new Map<string, Blob>();
    URL.createObjectURL = (object: Blob | MediaSource) => {
      const url = `blob:test/${blobs.size + 1}`;
      blobs.set(url, object as Blob);
      return url;
    };
    URL.revokeObjectURL = () => undefined;
    const clicked: { filename: string; href: string }[] = [];
    const clicks = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked.push({ filename: this.download, href: this.getAttribute('href') ?? '' });
      });
    return {
      settled: () =>
        Promise.all(
          clicked.map(async ({ filename, href }) => {
            const blob = blobs.get(href)!;
            return { filename, type: blob.type, text: await blobText(blob) };
          }),
        ),
      restore: () => clicks.mockRestore(),
    };
  }

  /** The app shell with `file` open and in edit; the session's bound save, and the container. */
  async function shellEditing(file: MarkdownFile) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    hosts.push(container);
    const store: AppStore = {
      putFolder: async () => undefined,
      deleteFolder: async () => undefined,
      putRecent: async () => undefined,
    };
    const source: FolderSource = { name: 'notes', files: [file], truncated: false, persistable: false };
    const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store });
    await app.openFolder();
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
    const host = await vi.waitFor(() => {
      const el = container.querySelector<HTMLElement>('.peekover-app__reader__host');
      expect(isEditable(el)).toBe(true); // KEEPS (C037, C038): the document is editable — 4.3: no control to wait for
      return el!;
    });
    await clickUntil(host, 'edit');
    const { save } = editorSessionFor(host)!;
    expect(typeof save).toBe('function');
    return { container, host, save: save! };
  }

  // RE-SPELLED AT 5.4 (and at 5.3 before it: 3.2's body was a stub that said "not yet available").
  // This was "★ appShell injects a save that, for a file with no handle, answers "unavailable" —
  // and does nothing else": the interim answer for a route that now downloads. "Nothing is
  // re-read" is unchanged.
  it('★ appShell injects a save that, for a file with no handle, DOWNLOADS the text under the file’s own name', async () => {
    const read = vi.fn(async () => DOC);
    const { save } = await shellEditing({ path: 'docs/notes.md', name: 'notes.md', read });
    read.mockClear();
    const downloads = captureDownloads();

    const outcome = await save({ text: 'edited text\n', baseline: DOC }).finally(downloads.restore);

    expect(outcome).toEqual({ kind: 'downloaded', written: 'edited text\n', filename: 'notes.md' });
    expect(await downloads.settled()).toEqual([
      { filename: 'notes.md', type: 'text/markdown', text: 'edited text\n' },
    ]);
    expect(read).not.toHaveBeenCalled(); // nothing to compare against, so nothing is re-read
  });

  it('★ ruling A reaches the download: a uniformly CRLF baseline → CRLF bytes in the blob; a mixed one → LF', async () => {
    const { save } = await shellEditing({ path: 'notes.md', name: 'notes.md', read: async () => CRLF_DOC });
    const downloads = captureDownloads();

    const crlf = await save({ text: 'one\ntwo\n', baseline: CRLF_DOC });
    const mixed = await save({ text: 'one\ntwo\n', baseline: MIXED_DOC }).finally(downloads.restore);

    expect(crlf).toMatchObject({ kind: 'downloaded', written: 'one\r\ntwo\r\n' });
    expect(mixed).toMatchObject({ kind: 'downloaded', written: 'one\ntwo\n' });
    expect((await downloads.settled()).map((d) => d.text)).toEqual(['one\r\ntwo\r\n', 'one\ntwo\n']);
  });

  it('★ write access NOT granted → the same download, and no writable is ever opened', async () => {
    const asked: unknown[] = [];
    const createWritable = vi.fn();
    const handle = {
      requestPermission: async (descriptor: unknown) => {
        asked.push(descriptor);
        return 'denied' as const;
      },
      createWritable,
    } as unknown as FileSystemFileHandle;
    const read = vi.fn(async () => DOC);
    const { save } = await shellEditing({ path: 'notes.md', name: 'notes.md', read, handle });
    read.mockClear();
    const downloads = captureDownloads();

    const outcome = await save({ text: 'edited text', baseline: DOC }).finally(downloads.restore);

    expect(asked).toEqual([{ mode: 'readwrite' }]);
    expect(outcome).toEqual({ kind: 'downloaded', written: 'edited text', filename: 'notes.md' });
    expect(await downloads.settled()).toEqual([
      { filename: 'notes.md', type: 'text/markdown', text: 'edited text' },
    ]);
    expect(createWritable).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled(); // no compare: nothing on disk is overwritten
  });

  it('a session bound to NO file (the store-free select seam) downloads under the fallback name', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    hosts.push(container);
    const app = mountAppShell(container, {
      store: { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined },
    });
    await app.selectFile({ name: 'loose.md', read: async () => DOC }); // sets no active file
    const host = await vi.waitFor(() => {
      const el = container.querySelector<HTMLElement>('.peekover-app__reader__host');
      expect(isEditable(el)).toBe(true); // KEEPS (C037, C038): the document is editable — 4.3: no control to wait for
      return el!;
    });
    await clickUntil(host, 'edit');
    const downloads = captureDownloads();

    const outcome = await editorSessionFor(host)!.save!({ text: 'edited', baseline: DOC }).finally(downloads.restore);

    expect(outcome).toEqual({ kind: 'downloaded', written: 'edited', filename: 'document.md' });
    expect((await downloads.settled()).map((d) => d.filename)).toEqual(['document.md']);
  });

  it('★ a session the shell ENDED still answers "unavailable": nothing is downloaded after Revoke', async () => {
    const { container, save } = await shellEditing({ path: 'notes.md', name: 'notes.md', read: async () => DOC });
    const downloads = captureDownloads();

    container.querySelector<HTMLButtonElement>('.peekover-app__chip-revoke')!.click();
    const outcome = await save({ text: 'edited text', baseline: DOC }).finally(downloads.restore);

    expect(outcome).toEqual({ kind: 'unavailable' });
    expect(await downloads.settled()).toEqual([]);
  });
});

// ── Making a host editable (D-1; R3; 013 D-6) ────────────────────────────────────────────────

// RETIRED: "is one real <button> placed directly after the mode pill, with its own stylesheet"
// (C051) and "is idempotent: no second control and no second stylesheet" (C050) — 013 task 4.3
// (D-6) removed the shadow-root control and EDIT_CONTROL_CSS; Edit is the toolbar's segment. The
// test below holds what `enhanceEditor` still adds — no control, one app-only seat sheet, once.
// RETIRED: "R3 — the exit returns to the mode edit was entered from" (C046) — ruling E: in the
// segment, the one you click is where you go (src/app/toolbar.test.ts, the browser toolbar suite).
describe('enhanceEditor — makes a host editable; builds no control', () => {
  // KEEPS: enhanceEditor builds no control (C366). RE-SPELLED at 013 task 4.5: it adds NOTHING to the
  // shadow root now — the capture notice's seat sheet went with the notice (D-8).
  it('adds no edit control, no button and no sheet: the shadow root is untouched', () => {
    const host = mountedHost();
    const before = [...host.shadowRoot!.children];
    enhanceEditor(host);
    enhanceEditor(host);
    expect([...host.shadowRoot!.children]).toEqual(before);
    expect(host.shadowRoot!.querySelector('.peekover-edit-toggle')).toBeNull();
    expect(isEditable(host)).toBe(true);
  });

  // REPLACED (C053): "re-installs after an outer mount()" — there is no control to re-install; the
  // property kept is that the document is still editable after a re-mount (the segment, outside
  // the shadow root, survives it: tests/browser/toolbar.browser.test.ts).
  it('★ stays editable after an outer mount(), which rebuilds the shadow root', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    mount(DOC, host, { contained: true });
    enhanceEditor(host);
    expect(isEditable(host)).toBe(true);
    await clickUntil(host, 'edit');
    expect(editorSessionFor(host)).toBeDefined();
  });

  it('a failed render (no data-mode) or a host with no shadow root is not editable', async () => {
    // KEEPS: Edit is not offered where there is no document view (C049). RE-SPELLED at 4.3: read as
    // `isEditable` (the segment's disabled state) and a `toggleEdit` that loads nothing.
    const loader = vi.fn<EditorModuleLoader>(() => loadCodeMirror());
    const bare = document.createElement('div');
    document.body.appendChild(bare);
    hosts.push(bare);
    enhanceEditor(bare, { loader });
    expect(bare.shadowRoot).toBeNull();
    expect(bare.childNodes).toHaveLength(0);
    expect(isEditable(bare)).toBe(false);

    const failed = mountedHost();
    failed.removeAttribute('data-mode'); // the raw-fallback path's signature (mount.ts)
    enhanceEditor(failed, { loader });
    expect(isEditable(failed)).toBe(false);
    expect(await toggleEdit(failed)).toBe('rest');
    expect(loader).not.toHaveBeenCalled();
  });

  // REPLACED (C052): the label and accessible name are the Edit segment's (src/app/toolbar.test.ts);
  // the property kept here is the exit's teardown.
  it('★ R3 — toggleEdit enters ("editing"), and its exit tears the session down', async () => {
    const host = mountedHost();
    enhanceEditor(host);
    expect(await toggleEdit(host)).toBe('editing');
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(shellIn(host)).not.toBeNull();
    expect(editorSessionFor(host)).toBeDefined();

    expect(await toggleEdit(host)).toBe('rest');
    expect(host.getAttribute('data-mode')).toBe('reading');
    // The exit ran the teardown: no shell, no session, no dirty attribute.
    expect(shellIn(host)).toBeNull();
    expect(editorSessionFor(host)).toBeUndefined();
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  // RETIRED (C047): EDIT_CONTROL_CSS's shape — the constant is deleted (D-6). What stays true is
  // asserted: the pill-hide rule is EDITOR_CSS's, and the one app-only sheet left ships no :host and
  // no comment.
  // KEEPS: the pill-hide rule is EDITOR_CSS's (C367). RE-SPELLED at 013 task 4.5: the seat sheet's half is
  // RETIRED — CAPTURE_NOTICE_SEAT_CSS is deleted with the in-reader notice (D-8).
  it('R3 — the pill-hide rule lives in EDITOR_CSS', () => {
    expect(EDITOR_CSS).toContain(':host([data-mode="edit"]) .peekover-mode-toggle{display:none}');
    expect(READER_CSS).not.toContain('peekover-edit-toggle');
  });

  it('a second activation while the engine is still loading starts no second entry', async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const loader = vi.fn<EditorModuleLoader>(async () => {
      await gate;
      return loadCodeMirror();
    });
    const host = mountedHost();
    enhanceEditor(host, { loader });

    // KEEPS: one entry per pending load (C048). RE-SPELLED at 4.3: two `toggleEdit` calls.
    const first = toggleEdit(host);
    const second = toggleEdit(host);
    expect(second).toBe(first);
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
    expect(isEditable(host), 'KEEPS (C044): the new document is editable — 4.3: no control label').toBe(true);

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
    const before = [...host.shadowRoot!.children];

    // KEEPS: the degrade, said in text (C041). RE-SPELLED at 4.3: `toggleEdit` resolves
    // 'unavailable' — the Edit segment shows EDIT_LABELS.unavailable for it (toolbar tests).
    const state = toggleEdit(host);
    // Wait on the LOAD settling, not on the control's text: a wait for the text would be the first
    // thing to fail under the defect, ahead of the assertion that actually shows it.
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    await Promise.allSettled(loader.mock.results.map((r) => r.value));
    await new Promise<void>((r) => setTimeout(r, 0));

    // The half-mounted signature first: 'edit' with nothing behind it.
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(await state).toBe('unavailable');
    expect(shellIn(host)).toBeNull();
    expect(host.shadowRoot!.querySelector('.cm-editor')).toBeNull();
    expect([...host.shadowRoot!.children]).toEqual(before);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('a failure is retryable: the next activation loads again and enters edit', async () => {
    const loader = vi
      .fn<EditorModuleLoader>()
      .mockRejectedValueOnce(new Error('chunk failed to load'))
      .mockImplementation(() => loadCodeMirror());
    const host = mountedHost();
    enhanceEditor(host, { loader });

    // KEEPS: retryable from the same activation (C040). RE-SPELLED at 4.3: `toggleEdit` twice.
    expect(await toggleEdit(host)).toBe('unavailable');
    expect(await toggleEdit(host)).toBe('editing');

    expect(loader).toHaveBeenCalledTimes(2);
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(editorSessionFor(host)).toBeDefined();
  });
});
