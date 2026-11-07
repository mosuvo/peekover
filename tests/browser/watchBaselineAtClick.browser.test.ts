// M13 discovered task — the watch baseline is taken AT THE CLICK, so a save made right after pressing Watch is shown
// (`decisions.md`, "M13 TASK 9.3a"). The Firefox half (a dragged folder, a disk-backed file) is in
// `firefoxDragWatch.browser.test.ts` (A); this is Chromium's app-page route: a LIVE folder handle (real OPFS), the
// file rewritten through its handle immediately after Watch is pressed. Which detector Chromium uses here is the
// engine's choice (`detectorForFile`: an observer when `FileSystemObserver` exists, else polling); the test records it
// in its name-free assertion message and holds for both.

import { describe, it, expect, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { isDirectoryPickerSupported, openFolderFromDrop, type FolderSource } from '../../src/app/folderSource';
import { WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';

const cleanup: (() => Promise<unknown> | void)[] = [];
afterEach(async () => {
  while (cleanup.length) await cleanup.pop()!();
});

async function waitFor<T>(fn: () => T | null | undefined, ms = 5000): Promise<T> {
  for (let t = 0; t < ms; t += 50) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 50));
  }
  throw new Error('waitFor timed out');
}

function fakeStore(): AppStore {
  return { putFolder: async () => undefined, deleteFolder: async () => undefined, putRecent: async () => undefined };
}

async function write(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  await w.write(text);
  await w.close();
}

const isChromium = isDirectoryPickerSupported();

/** Run the flow; `observer: false` hides `FileSystemObserver` so `detectorForFile` takes the POLLING route. */
async function saveRightAfterWatch(observer: boolean): Promise<{ updated: boolean; detector: string }> {
    const saved = (globalThis as Record<string, unknown>).FileSystemObserver;
    if (!observer && saved !== undefined) {
      delete (globalThis as Record<string, unknown>).FileSystemObserver;
      cleanup.push(() => {
        (globalThis as Record<string, unknown>).FileSystemObserver = saved;
      });
    }
    const root = await navigator.storage.getDirectory();
    const name = `peekover-baseline-${Math.trunc(performance.now() * 1000)}`;
    const dir = await root.getDirectoryHandle(name, { create: true });
    cleanup.push(() => root.removeEntry(name, { recursive: true }));
    await write(dir, 'notes.md', '# Rollout notes\n\nThe first version.\n');

    const drop = { items: [{ kind: 'file', getAsFileSystemHandle: async () => dir }] } as unknown as DataTransfer;
    const outcome = await openFolderFromDrop(drop);
    expect(outcome.ok && outcome.source.persistable).toBe(true);
    const source = (outcome as { ok: true; source: FolderSource }).source;

    const container = document.createElement('div');
    document.body.appendChild(container);
    cleanup.push(() => container.remove());
    mountAppShell(container, { dropToOutcome: async () => ({ ok: true, source }), store: fakeStore() });
    container
      .querySelector<HTMLElement>('.peekover-app')!
      .dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
    (await waitFor(() => container.querySelector<HTMLElement>('[role="treeitem"][data-kind="file"]'))).click();
    const reader = () => container.querySelector('.peekover-app__reader__host')?.shadowRoot ?? null;
    await waitFor(() => reader()?.querySelector('h1'));

    const control = container.querySelector<HTMLButtonElement>(`.${WATCH_CONTROL_CLASS}`)!;
    control.click();
    expect(control.getAttribute('aria-pressed')).toBe('true');
    await new Promise<void>((r) => setTimeout(r, 0));
    await write(dir, 'notes.md', '# Rollout notes\n\nThe first version.\n\n## Saved right after Watch\n\nShown.\n');

    const detector = 'FileSystemObserver' in globalThis ? 'observer' : 'polling';
    let updated = false;
    for (let t = 0; t < 6000 && !updated; t += 100) {
      await new Promise<void>((r) => setTimeout(r, 100));
      updated = [...(reader()?.querySelectorAll('h2') ?? [])].some((h) => h.textContent?.includes('Saved right after Watch'));
    }
    return { updated, detector };
}

describe.runIf(isChromium)('Chromium — a save made right after pressing Watch is shown', () => {
  it('the engine route (a live handle; the observer where the engine has one)', async () => {
    const r = await saveRightAfterWatch(true);
    expect(r.updated, `the save made at once reached the reader (detector: ${r.detector})`).toBe(true);
  }, 20000);

  it('the POLLING route (no FileSystemObserver): the baseline is taken at the click', async () => {
    const r = await saveRightAfterWatch(false);
    expect(r.detector).toBe('polling');
    expect(r.updated, 'the save made at once reached the reader through the polled detector').toBe(true);
  }, 20000);
});
