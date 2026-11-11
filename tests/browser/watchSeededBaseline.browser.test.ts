// M13 discovered task 9.3d — the watch baseline is the SOURCE TEXT the reader rendered from (`decisions.md`, "M13 TASK
// 9.3d"). Before it, the first read at the click was a silent baseline, so a save that reached disk before that read
// resolved was absorbed and the reader stayed on the older text (CI run 42943681675, `firefoxDragWatch` (A)). This is
// Chromium's app page over a LIVE handle (real OPFS), on both detector routes; the Firefox half (a dragged folder, a
// disk-backed file) is in `firefoxDragWatch.browser.test.ts` (A2, A3, E1).
//
// What each case pins:
//   S1 a save made BEFORE the click is shown (the race, forced into its losing order);
//   S2 an unchanged file of each shape (CRLF, BOM, no trailing newline) is not re-rendered, and one real change
//      re-renders exactly once;
//   E1 in an edit session with UNSAVED changes, the baseline is the loaded text, never the buffer: nothing is held as
//      an external change and the buffer is untouched;
//   E2 after a SAVE in the session, the baseline is the text written: the save is not taken for an external change.

import { describe, it, expect, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { isDirectoryPickerSupported, type FolderSource, type MarkdownFile } from '../../src/app/folderSource';
import { EDITOR_SAVE_CLASS, EDITOR_STATUS_CLASS, editorSessionFor } from '../../src/render/editorView';
import { WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR } from '../../src/watch/watchController';
import { stopWatch } from '../../src/watch/watchRegistry';

const isChromium = isDirectoryPickerSupported();
const cleanup: (() => Promise<unknown> | void)[] = [];
afterEach(async () => {
  stopWatch();
  while (cleanup.length) await cleanup.pop()!();
});

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 8000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const v = fn();
    if (v) return v as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 25));
  }
}
const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

/** Hide `FileSystemObserver` for one test so `detectorForFile` takes the POLLING route. */
function routeTo(observer: boolean): 'observer' | 'polling' {
  const g = globalThis as Record<string, unknown>;
  const saved = g.FileSystemObserver;
  if (!observer && saved !== undefined) {
    delete g.FileSystemObserver;
    cleanup.push(() => {
      g.FileSystemObserver = saved;
    });
  }
  return 'FileSystemObserver' in globalThis ? 'observer' : 'polling';
}

async function writeDisk(fh: FileSystemFileHandle, text: string): Promise<void> {
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}

/** One real OPFS file holding `text`, as the shell's `MarkdownFile` (read + live handle). */
async function diskFile(text: string): Promise<{ fh: FileSystemFileHandle; file: MarkdownFile }> {
  const root = await navigator.storage.getDirectory();
  const name = `seeded-${Math.trunc(performance.now() * 1000)}.md`;
  const fh = await root.getFileHandle(name, { create: true });
  cleanup.push(() => root.removeEntry(name));
  await writeDisk(fh, text);
  return { fh, file: { path: name, name, read: async () => (await fh.getFile()).text(), handle: fh } };
}

/** Mount the app page with one file, open it, and return its reader host. */
async function opened(file: MarkdownFile): Promise<{ container: HTMLElement; host: HTMLElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  cleanup.push(() => container.remove());
  const source: FolderSource = { name: 'docs', truncated: false, persistable: true, files: [file] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: fakeStore() });
  await app.openFolder();
  (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'), 'the tree item')).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader host');
  await waitFor(() => host.shadowRoot?.querySelector('h1'), 'the first render');
  return { container, host };
}

const watchControl = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`);

function pressWatch(container: HTMLElement): void {
  const control = watchControl(container);
  expect(control, 'a Watch control').not.toBeNull();
  control!.click();
  expect(control!.getAttribute('aria-pressed')).toBe('true');
}

/** Counts how often the reading column is re-mounted (`mount()` replaces the shadow root's children). */
function countRemounts(host: HTMLElement): () => number {
  let n = 0;
  const tally = (batch: MutationRecord[]) => {
    for (const r of batch) for (const node of r.removedNodes) if (node instanceof HTMLElement && node.classList.contains('peekover-reader')) n += 1;
  };
  const mo = new MutationObserver(tally);
  mo.observe(host.shadowRoot!, { childList: true });
  cleanup.push(() => mo.disconnect());
  return () => {
    tally(mo.takeRecords());
    return n;
  };
}

const hasH2 = (host: HTMLElement, text: string) =>
  [...(host.shadowRoot?.querySelectorAll('h2') ?? [])].some((h) => h.textContent?.includes(text));

const BEFORE = '# Rollout notes\n\nThe first version.\n';
const SHAPES: Array<[string, string]> = [
  ['CRLF', '# Rollout notes\r\n\r\nWindows line endings.\r\n'],
  ['BOM', '\uFEFF# Rollout notes\n\nA byte-order mark first.\n'],
  ['no trailing newline', '# Rollout notes\n\nNo newline at the end.'],
];
// Two polls and a margin: the polled route reads at the click and then every 1 s (WATCH_INTERVAL_MS).
const QUIET_MS = 2600;

describe.runIf(isChromium)('Chromium — the watch baseline is the rendered source (M13 9.3d)', () => {
  for (const observer of [true, false]) {
    const route = observer ? 'the engine route' : 'the POLLING route';

    it(`S1 ${route}: a save made BEFORE pressing Watch is shown`, async () => {
      const detector = routeTo(observer);
      const { fh, file } = await diskFile(BEFORE);
      const { container, host } = await opened(file);
      // The losing order of the race: the file changes after the render and before the click.
      await writeDisk(fh, `${BEFORE}\n## Saved before the click\n\nShown.\n`);
      pressWatch(container);
      await waitFor(() => hasH2(host, 'Saved before the click'), `the save made before the click (detector: ${detector})`);
    }, 20000);

    for (const [shape, text] of SHAPES) {
      it(`S2 ${route}: an unchanged ${shape} file is not re-rendered; one change re-renders once`, async () => {
        routeTo(observer);
        const { fh, file } = await diskFile(text);
        const { container, host } = await opened(file);
        const remounts = countRemounts(host);
        pressWatch(container);
        await pause(QUIET_MS);
        expect(remounts(), `an unchanged ${shape} file was re-rendered`).toBe(0);

        await writeDisk(fh, `${text}\n\n## Changed on disk\n`);
        await waitFor(() => hasH2(host, 'Changed on disk'), 'the change');
        await pause(QUIET_MS);
        expect(remounts(), 'one change, one render').toBe(1);
      }, 20000);
    }

    it(`E1 ${route}: with UNSAVED edits, the baseline is the loaded text — nothing is held, the buffer is kept`, async () => {
      routeTo(observer);
      const { file } = await diskFile(BEFORE);
      const { container, host } = await opened(file);
      container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = editorSessionFor(host)!;
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: '\nUnsaved line.\n' } });
      const buffer = session.view.state.doc.toString();
      pressWatch(container);
      await pause(QUIET_MS);
      expect(host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the unsaved buffer was taken for a change on disk').toBe(false);
      expect(session.view.state.doc.toString(), 'the buffer is kept').toBe(buffer);
    }, 20000);

    it(`E2 ${route}: after a SAVE in the session, the baseline is the text written — the save is not an external change`, async () => {
      routeTo(observer);
      const { fh, file } = await diskFile(BEFORE);
      const { container, host } = await opened(file);
      container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
      await waitFor(() => host.getAttribute('data-mode') === 'edit', 'edit mode');
      const session = editorSessionFor(host)!;
      session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: '\nSaved line.\n' } });
      host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SAVE_CLASS}`)!.click();
      await waitFor(() => {
        const status = host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`);
        return status && !status.hidden && status.textContent;
      }, 'the save to report');
      expect(await (await fh.getFile()).text(), 'the save wrote the file').toContain('Saved line.');
      pressWatch(container);
      await pause(QUIET_MS);
      expect(host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the session\'s own save was taken for an external change').toBe(false);
    }, 20000);
  }
});
