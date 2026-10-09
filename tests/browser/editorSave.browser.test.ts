// The write path (012 task 5.3; D-6, D-7, D-9; save-time rulings A–C; routes 2(i) and 2(ii)).
//
// The first test in this repository in which Peekover CHANGES A FILE. Everything it claims about
// what is on disk is read back off disk, through the test's own handle — never inferred from a
// status line or a return value.
//
// ══ WHAT IS REAL AND WHAT IS STOOD IN ═══════════════════════════════════════════════════════════
//
// REAL: the app shell, the reader pane, the edit control, the CodeMirror view, the Save button and
// its status region, the bound save, `requestPermission`, the re-read, the compare, the writable
// and the bytes. STOOD IN: the folder. Each file is a real `FileSystemFileHandle` in the origin
// private file system, handed to the shell in a hand-built `FolderSource` — the live picker is the
// human gate's (7.1). Building the source by hand, instead of walking a directory handle, is what
// lets a test keep the SAME handle object the shell holds, and so stub one method on it (a
// declined permission, a writable that throws) without a seam in production code.
//
// ══ ENGINES ═════════════════════════════════════════════════════════════════════════════════════
//
// The write paths run on CHROMIUM only (tasks.md 5.3's Verify). The no-handle route — a file with
// no handle, which is what Firefox's folder routes produce — runs on BOTH, and on Firefox it is
// the route a real user is on.
//
// ══ WATCH STATE, STATED PER FIXTURE ═════════════════════════════════════════════════════════════
//
// `opened()` asserts the document is NOT watched. Ruling C's fixtures use `watched()`, which starts
// a hand-driven watch and asserts that it IS running (the `editorWatch.browser.test.ts` rig).
//
// ══ RED-FIRST (recorded in progress.md's 5.3 record) ════════════════════════════════════════════
//
// The compare removed → the same-length out-of-band text is gone from disk. The view's catch
// removed → a throwing writable leaves the status silent. The binding read at the click → file B
// is overwritten. An ending removed → a save after Revoke still lands.
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ════════════════════════════════════════════════════════════
//
// Files run serially on one `document` and one origin private file system. Every file this suite
// creates has a name no other test uses and is removed afterwards; the watch, diff and theme
// registries are reset around each test; text is matched by markers; download counts are deltas.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { mountAppShell, type AppController, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile, OpenFolderOutcome } from '../../src/app/folderSource';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { getDiffContext, isDiffContextRegistered, resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_SAVE_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_STATUS_CLASS,
  editorSessionFor,
  teardownEditorShell,
  type EditorSaveOutcome,
  type EditorSession,
} from '../../src/render/editorView';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import type { ChangeDetector } from '../../src/watch/changeDetector';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR, createWatchController } from '../../src/watch/watchController';
import {
  isWatching,
  registerWatchTarget,
  resetWatchRegistryForTest,
  type WatchTarget,
} from '../../src/watch/watchRegistry';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const CHROMIUM = ENGINE === 'chromium';
const record = (line: string): void => console.log(`[5.3][${ENGINE}] ${line}`);

const NARROW = { width: 414, height: 896 };

const TYPED = ' zqxtyped';
const body = (marker: string): string => `# Save doc\n\nA paragraph.\n\n${marker}\n`;
const ON_DISK = body('The line on disk at open zsa.');
/** Same length as ON_DISK, different content — the case a length check cannot see. */
const OUT_OF_BAND = body('The line on disk changed zsb.');

// ── The origin private file system ────────────────────────────────────────────────────────────

let dir: FileSystemDirectoryHandle | null = null;
let seq = 0;
const made: string[] = [];

beforeAll(async () => {
  if (!CHROMIUM) return;
  const root = await navigator.storage.getDirectory();
  dir = await root.getDirectoryHandle('editor-save-5-3', { create: true });
});

async function writeDisk(fh: FileSystemFileHandle, text: string): Promise<void> {
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

const readDisk = async (fh: FileSystemFileHandle): Promise<string> => (await fh.getFile()).text();

/** A real file holding `text`, and the `MarkdownFile` the shell is given for it — the SAME handle
 *  object in both, so a stub on `fh` is a stub on what the shell holds. */
async function diskFile(label: string, text: string): Promise<{ fh: FileSystemFileHandle; file: MarkdownFile }> {
  seq += 1;
  const name = `${label}-${seq}-${Math.trunc(performance.now())}.md`;
  const fh = await dir!.getFileHandle(name, { create: true });
  made.push(name);
  await writeDisk(fh, text);
  return { fh, file: { path: name, name, read: () => readDisk(fh), handle: fh } };
}

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 20000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

const containers: HTMLElement[] = [];
const controllers: WatchTarget[] = [];

interface App {
  app: AppController;
  container: HTMLElement;
  /** What the NEXT `openFolder()` resolves to (a cancel, another folder). */
  next: (outcome: OpenFolderOutcome) => void;
}

function source(files: MarkdownFile[], persistable = true, name = 'docs'): FolderSource {
  return { name, truncated: false, persistable, files };
}

async function mountApp(files: MarkdownFile[], persistable = true): Promise<App> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  let outcome: OpenFolderOutcome = { ok: true, source: source(files, persistable) };
  const app = mountAppShell(container, { openFolder: async () => outcome, store: fakeStore() });
  await app.openFolder();
  return { app, container, next: (o) => void (outcome = o) };
}

/** Select `file` in the tree and wait until it is the open document. */
async function select(container: HTMLElement, file: MarkdownFile): Promise<HTMLElement> {
  const item = [...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')].find(
    (el) => el.textContent === file.name,
  );
  if (!item) throw new Error(`no tree item for ${file.name}`);
  item.click();
  await waitFor(
    () => container.querySelector('[data-pin="file"]')?.textContent?.includes(file.name),
    `${file.name} to be the open file`,
  );
  const host = await waitFor(
    () => container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    'the reader host',
  );
  await waitFor(() => host.shadowRoot?.querySelector(`.${EDIT_CONTROL_CLASS}`), 'the edit control');
  return host;
}

/** One file open on the app page, NOT watched. */
async function opened(file: MarkdownFile, persistable = true): Promise<App & { host: HTMLElement }> {
  const rig = await mountApp([file], persistable);
  const host = await select(rig.container, file);
  expect(isWatching(), 'this fixture is UNWATCHED').toBe(false);
  return { ...rig, host };
}

const controlIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!;
const saveButtonIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SAVE_CLASS}`)!;
const statusIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`)!;

async function enterEdit(host: HTMLElement): Promise<EditorSession> {
  controlIn(host).click();
  await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
  const session = editorSessionFor(host);
  if (!session) throw new Error('entering edit left no live edit session');
  return session;
}

/** Append to the buffer — the document-model stand-in for typing. */
function type(session: EditorSession, text: string): void {
  session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: text } });
}

const buffer = (session: EditorSession): string => session.view.state.doc.toString();

/** Click Save and wait for the outcome's line. The status empties when a save starts, so a line
 *  left by an earlier save cannot be mistaken for this one's. */
async function clickSave(host: HTMLElement): Promise<string> {
  saveButtonIn(host).click();
  expect(statusIn(host).hidden, 'the status empties as the save starts').toBe(true);
  await waitFor(() => !statusIn(host).hidden, 'the save to report');
  return statusIn(host).textContent ?? '';
}

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
});

afterEach(async () => {
  for (const controller of controllers.splice(0)) controller.stop();
  for (const c of containers.splice(0)) {
    c.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    c.remove();
  }
  for (const name of made.splice(0)) await dir?.removeEntry(name).catch(() => undefined);
  __resetConnectionForTest();
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

// ── The write ─────────────────────────────────────────────────────────────────────────────────

describe.runIf(CHROMIUM)('012 task 5.3 — Save writes the buffer to the file being edited (Chromium)', () => {
  it('★ SAVE: the file read back is the buffer; a SECOND save in the same session also writes', async () => {
    const { fh, file } = await diskFile('save', ON_DISK);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe(ON_DISK + TYPED);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'dirty cleared by the save').toBe(false);
    expect(session.originalText, 'the baseline is what was written').toBe(ON_DISK + TYPED);

    // The firing control that the compare is not refusing everything: the advanced baseline.
    type(session, ' again');
    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe(`${ON_DISK + TYPED} again`);
    record('save: two saves in one session, both read back byte for byte');
  });

  it('★ D-7 SAME-LENGTH: a file rewritten out-of-band with text of identical length is NOT overwritten', async () => {
    expect(OUT_OF_BAND.length, 'the fixture is the same length').toBe(ON_DISK.length);
    expect(OUT_OF_BAND).not.toBe(ON_DISK);
    const { fh, file } = await diskFile('same-length', ON_DISK);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, TYPED);

    await writeDisk(fh, OUT_OF_BAND); // someone else, after edit entry

    const said = await clickSave(host);
    const onDisk = await readDisk(fh);
    record(`same-length: status=${JSON.stringify(said)}; disk still the out-of-band text: ${onDisk === OUT_OF_BAND}`);
    expect(onDisk, 'the out-of-band text is still on disk, byte for byte').toBe(OUT_OF_BAND);
    expect(said).toMatch(/^Not saved: the file changed on disk\./);
    expect(buffer(session), 'the buffer is kept').toBe(ON_DISK + TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
    expect(session.originalText, 'the baseline did not move').toBe(ON_DISK);
  });

  it('★ RULING A: a uniformly CRLF file is saved as CRLF, with no qualifier', async () => {
    const crlf = '# T\r\n\r\nBody.\r\n';
    const { fh, file } = await diskFile('crlf', crlf);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'a CRLF file does not enter dirty').toBe(false);
    type(session, 'more\n');

    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe('# T\r\n\r\nBody.\r\nmore\r\n');

    type(session, 'again\n'); // the baseline is the CRLF text that was written: no conflict
    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe('# T\r\n\r\nBody.\r\nmore\r\nagain\r\n');
  });

  it('★ RULING A: a mixed-ending file is saved as LF and the status says so; the next save is no conflict', async () => {
    const mixed = '# T\r\n\nBody.\rTail.\n';
    const { fh, file } = await diskFile('mixed', mixed);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, 'more\n');

    expect(await clickSave(host)).toBe('Saved. Line endings were normalised to LF.');
    expect(await readDisk(fh)).toBe('# T\n\nBody.\nTail.\nmore\n');

    type(session, 'again\n');
    expect(await clickSave(host), 'now an LF file: nothing left to say').toBe('Saved.');
    expect(await readDisk(fh)).toBe('# T\n\nBody.\nTail.\nmore\nagain\n');
  });

  it('★ FAILURE: a writable that throws → "failed" in text, the buffer and dirty kept, the file unchanged', async () => {
    const { fh, file } = await diskFile('failure', ON_DISK);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, TYPED);

    // Stubbed on the test's own handle — the object the shell holds. The real writable is opened
    // and then aborted by the shell, so nothing is committed.
    const real = fh.createWritable.bind(fh);
    let aborted = 0;
    fh.createWritable = (async (...args: Parameters<typeof real>) => {
      const writable = await real(...args);
      return {
        write: async () => {
          throw new Error('the writable threw (test)');
        },
        close: () => writable.close(),
        abort: async () => {
          aborted += 1;
          await writable.abort();
        },
      };
    }) as unknown as typeof fh.createWritable;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    saveButtonIn(host).click();
    // Bounded, and never throws: with the failure swallowed the status never appears, and the
    // assertions below must be what says so.
    await waitFor(() => !statusIn(host).hidden, 'the save to report', 3000).catch(() => undefined);
    const said = statusIn(host).textContent ?? '';
    warn.mockRestore();
    fh.createWritable = real;

    record(`failure: status=${JSON.stringify(said)}; aborted=${aborted}`);
    expect(said, 'the failure is SAID').toMatch(/^The save failed\./);
    expect(buffer(session), 'the edit is not lost').toBe(ON_DISK + TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
    expect(session.originalText).toBe(ON_DISK);
    expect(await readDisk(fh), 'the file on disk is as it was').toBe(ON_DISK);
    expect(aborted, 'the half-open writable was aborted').toBe(1);
    expect(saveButtonIn(host).textContent, 'the control is usable again').toBe('Save');

    // And it was the stub that failed, not the route: the same session now saves.
    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe(ON_DISK + TYPED);
  });

  it('★ NOT AVAILABLE: a declined write prompt writes nothing and keeps the edit', async () => {
    const { fh, file } = await diskFile('declined', ON_DISK);
    const asked: unknown[] = [];
    (fh as unknown as { requestPermission: (d: unknown) => Promise<PermissionState> }).requestPermission =
      async (descriptor) => {
        asked.push(descriptor);
        return 'denied';
      };
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, TYPED);

    const said = await clickSave(host);

    expect(asked, 'write access was asked for, on this file, at the click').toEqual([{ mode: 'readwrite' }]);
    expect(said).toMatch(/^Not saved: saving is not available here\./);
    expect(await readDisk(fh)).toBe(ON_DISK);
    expect(buffer(session)).toBe(ON_DISK + TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
  });

  it('the permission is asked for BEFORE the re-read, and only at the click', async () => {
    const { fh, file } = await diskFile('order', ON_DISK);
    const order: string[] = [];
    const realRead = file.read;
    file.read = async () => {
      order.push('read');
      return realRead();
    };
    const realAsk = (fh as unknown as { requestPermission: (d: unknown) => Promise<PermissionState> })
      .requestPermission.bind(fh);
    (fh as unknown as { requestPermission: (d: unknown) => Promise<PermissionState> }).requestPermission =
      async (descriptor) => {
        order.push('permission');
        return realAsk(descriptor);
      };
    const { host } = await opened(file);
    const session = await enterEdit(host);
    type(session, TYPED);
    expect(order.filter((step) => step === 'permission'), 'nothing asks before the click').toEqual([]);
    order.length = 0;

    expect(await clickSave(host)).toBe('Saved.');
    expect(order).toEqual(['permission', 'read']);
  });

  it('the Save control is a <button>, keyboard-operable, and its status region is out of the tree at rest', async () => {
    const { fh, file } = await diskFile('control', ON_DISK);
    const { host } = await opened(file);
    const session = await enterEdit(host);
    const button = saveButtonIn(host); // selected by class alone
    const status = statusIn(host);

    expect(button.tagName).toBe('BUTTON');
    expect(button.textContent).toBe('Save');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.hidden, 'empty → hidden → out of the accessibility tree').toBe(true);
    expect(getComputedStyle(status).display).toBe('none');
    expect(status.textContent).toBe('');
    const box = button.getBoundingClientRect();
    expect(box.width * box.height, 'the control is on screen').toBeGreaterThan(0);
    const hit = host.shadowRoot!.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    expect(hit, 'and nothing covers it').toBe(button);

    type(session, TYPED);
    button.focus();
    expect(host.shadowRoot!.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => !status.hidden, 'the keyboard save to report');

    expect(status.textContent).toBe('Saved.');
    expect(getComputedStyle(status).display).not.toBe('none');
    expect(await readDisk(fh)).toBe(ON_DISK + TYPED);
  });
});

// ── Ruling C — the hint warns, the compare decides ────────────────────────────────────────────

describe.runIf(CHROMIUM)('012 task 5.3 — ruling C, on a WATCHED document (Chromium)', () => {
  function handDriven(): { detector: ChangeDetector; fire: (text: string) => void } {
    let cb: ((text: string) => void) | null = null;
    return {
      detector: {
        start(next) {
          cb = next;
        },
        stop() {
          cb = null;
        },
      },
      fire: (text) => cb?.(text),
    };
  }

  /** The file open with a hand-driven watch RUNNING on the reader host. */
  async function watched(file: MarkdownFile): Promise<{ host: HTMLElement; fire: (text: string) => void }> {
    const { container } = await mountApp([file]);
    const host = await select(container, file);
    await waitFor(() => isDiffContextRegistered(), 'the app page registered its document');
    const fake = handDriven();
    const controller = createWatchController({
      detector: fake.detector,
      docId: getDiffContext()!.docId,
      contained: true,
    });
    registerWatchTarget(controller);
    controller.start(host);
    controllers.push(controller);
    expect(isWatching(), 'this fixture is WATCHED').toBe(true);
    return { host, fire: fake.fire };
  }

  it('★ (i) changed and changed BACK: the hint is present, the content equals the baseline → the save proceeds, and warns', async () => {
    const { fh, file } = await diskFile('hint-back', ON_DISK);
    const { host, fire } = await watched(file);
    const session = await enterEdit(host);
    type(session, TYPED);

    await writeDisk(fh, OUT_OF_BAND);
    fire(OUT_OF_BAND);
    await writeDisk(fh, ON_DISK);
    fire(ON_DISK);
    await waitFor(() => host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the hint');

    const said = await clickSave(host);

    record(`ruling C (i): ${JSON.stringify(said)}`);
    expect(said).toMatch(/^Saved\. The file changed on disk while you were editing/);
    expect(await readDisk(fh)).toBe(ON_DISK + TYPED);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('★ (ii) changed and NOT back: the hint is present, the content differs → the safe floor', async () => {
    const { fh, file } = await diskFile('hint-conflict', ON_DISK);
    const { host, fire } = await watched(file);
    const session = await enterEdit(host);
    type(session, TYPED);

    await writeDisk(fh, OUT_OF_BAND);
    fire(OUT_OF_BAND);
    await waitFor(() => host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the hint');

    const said = await clickSave(host);

    expect(said).toMatch(/^Not saved: the file changed on disk\./);
    expect(await readDisk(fh)).toBe(OUT_OF_BAND);
    expect(buffer(session)).toBe(ON_DISK + TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
  });
});

// ── Route 2 — the binding, and the endings ────────────────────────────────────────────────────

describe.runIf(CHROMIUM)('012 task 5.3 — route 2(i): the file is bound to the edit session at edit entry (Chromium)', () => {
  it('★ moving the open file to B after entering edit on A cannot make a save write B', async () => {
    // Identical text in both, so the compare cannot be what protects B: the baseline matches it.
    const a = await diskFile('bound-a', ON_DISK);
    const b = await diskFile('bound-b', ON_DISK);
    const { container } = await mountApp([a.file, b.file]);
    const host = await select(container, a.file);
    const session = await enterEdit(host);
    type(session, TYPED);
    const save = session.save!;
    const request = { text: buffer(session), baseline: session.originalText };

    await select(container, b.file); // by the code path; the guard on this is task 6.1's

    const outcome = await save(request);

    const [diskA, diskB] = [await readDisk(a.fh), await readDisk(b.fh)];
    record(`route 2(i): outcome=${outcome.kind}; A written=${diskA === ON_DISK + TYPED}; B untouched=${diskB === ON_DISK}`);
    expect(diskB, 'B is byte-identical').toBe(ON_DISK);
    expect([ON_DISK, ON_DISK + TYPED], 'A is written, or nothing is').toContain(diskA);
    expect(outcome.kind === 'saved' ? diskA : ON_DISK + TYPED).toBe(ON_DISK + TYPED);
  });
});

describe.runIf(CHROMIUM)('012 task 5.3 — route 2(ii): Revoke, closing the folder and switching folders END the edit session (Chromium)', () => {
  const ENDINGS: ReadonlyArray<readonly [string, (rig: App, other: MarkdownFile) => Promise<void>]> = [
    [
      'Revoke',
      async ({ container }) => {
        container.querySelector<HTMLButtonElement>('.peekover-app__chip-revoke')!.click();
        await waitFor(() => container.querySelector('.peekover-app__cta'), 'the idle affordance');
      },
    ],
    [
      'closing the folder (a re-pick that is cancelled)',
      async ({ app, container, next }) => {
        next({ ok: false, reason: 'cancelled', message: 'No folder was opened.' });
        await app.openFolder();
        await waitFor(() => container.querySelector('.peekover-app__cta'), 'the idle affordance');
      },
    ],
    [
      'switching folders',
      async ({ app, container, next }, other) => {
        next({ ok: true, source: source([other], true, 'elsewhere') });
        await app.openFolder();
        await waitFor(
          () => container.querySelector('[role="treeitem"][data-kind="file"]')?.textContent === other.name,
          'the other folder',
        );
      },
    ],
  ];

  it.each(ENDINGS)('★ %s: the edit view is gone, and the captured save and Ctrl/Cmd+S write nothing', async (what, end) => {
    const { fh, file } = await diskFile('ending', ON_DISK);
    const other = await diskFile('ending-other', body('Another folder zsc.'));
    const rig = await opened(file);
    const session = await enterEdit(rig.host);
    type(session, TYPED);
    const save = session.save!;
    const request = { text: buffer(session), baseline: session.originalText };
    expect(rig.app.saveEdit(), 'firing control: in edit, the shortcut path is a save').toBe(true);
    await waitFor(() => !statusIn(rig.host).hidden, 'that save to report');
    expect(await readDisk(fh), 'firing control: it wrote').toBe(ON_DISK + TYPED);
    await writeDisk(fh, ON_DISK); // back to the start, out of band
    request.baseline = ON_DISK;

    await end(rig, other.file);

    const outcome: EditorSaveOutcome = await save(request);
    const shortcut = rig.app.saveEdit();
    await new Promise<void>((r) => setTimeout(r, 150));

    const onDisk = await readDisk(fh);
    record(`route 2(ii) ${what}: captured save → ${outcome.kind}; saveEdit() → ${shortcut}; disk untouched=${onDisk === ON_DISK}`);
    // The disk first: it is the claim, and the check an ending that did nothing must fail on.
    expect(onDisk, 'nothing was written after the ending').toBe(ON_DISK);
    expect(outcome.kind).toBe('unavailable');
    expect(rig.host.getAttribute('data-mode'), 'no longer in edit').not.toBe('edit');
    expect(rig.host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`), 'the edit view is gone').toBeNull();
    expect(editorSessionFor(rig.host)).toBeUndefined();
    expect(rig.host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
    expect(shortcut, 'the shortcut path finds no edit session').toBe(false);
    expect(await readDisk(other.fh)).toBe(body('Another folder zsc.'));
  });
});

// ── The no-handle route — BOTH engines; on Firefox, the route a real user is on ───────────────

describe('012 task 5.3 — a file with no handle: Save says it is not available here (Chromium + Firefox)', () => {
  it('★ nothing is written, nothing is downloaded, and the edit stays on screen', async () => {
    let reads = 0;
    const file: MarkdownFile = {
      path: 'snapshot.md',
      name: 'snapshot.md',
      read: async () => {
        reads += 1;
        return ON_DISK;
      },
    };
    const { host } = await opened(file, false); // a read-only snapshot: no handle, not persistable
    const session = await enterEdit(host);
    type(session, TYPED);
    const readsBefore = reads;
    const anchorClicks = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    const clicksBefore = anchorClicks.mock.calls.length;

    const said = await clickSave(host);

    const downloads = anchorClicks.mock.calls.length - clicksBefore;
    anchorClicks.mockRestore();
    record(`no handle: ${JSON.stringify(said)}; downloads=${downloads}; re-reads=${reads - readsBefore}`);
    expect(said).toMatch(/^Not saved: saving is not available here\./);
    expect(downloads, 'no download: that is task 5.4').toBe(0);
    expect(reads - readsBefore, 'with no handle there is nothing to compare against').toBe(0);
    expect(buffer(session)).toBe(ON_DISK + TYPED);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
    expect(session.originalText).toBe(ON_DISK);
    expect(saveButtonIn(host).tagName).toBe('BUTTON');
  });
});
