// THE BUNDLED SAMPLE on the app page (0.1.2, D4; decisions.md, "0.1.2 B3: THE SETUP GUIDE") — Chromium and Firefox.
// The entry shows it through `AppController.selectFile`, the shell's store-free seam; this mounts the shell the same
// way with a store that records every call, then reads: the sample is on screen (its heading, its sortable table, its
// task list), the store saw no write, and nothing went off-origin (read after the wire settles; the guard's firing
// control, with its slow case, is the established one in onboarding.browser.test.ts, "6.1 — zero network", whose
// helpers this reuses — cited, not re-earned, per AGENTS.md).
import { describe, it, expect, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import { sampleFile } from '../../src/app/sample';
import { isOffOrigin, networkedUrls, wireSettled } from './helpers/diagramWindow';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 300): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

function recordingStore(): { store: AppStore; writes: string[] } {
  const writes: string[] = [];
  const write = (name: string) => async (): Promise<void> => {
    writes.push(name);
  };
  const store: AppStore = {
    putFolder: write('putFolder'),
    deleteFolder: write('deleteFolder'),
    putRecent: write('putRecent'),
    putPin: write('putPin'),
    deleteRecent: write('deleteRecent'),
    deletePin: write('deletePin'),
    getFolders: async () => [],
    getRecents: async () => [],
    getPins: async () => [],
  };
  return { store, writes };
}

describe('0.1.2 — the sample through the store-free seam', () => {
  it('renders the sample, writes nothing to the store, and puts nothing off-origin on the wire', async () => {
    performance.clearResourceTimings();
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const { store, writes } = recordingStore();
    const app = mountAppShell(container, { store });
    await app.refresh();
    await app.selectFile(sampleFile());

    const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader host');
    const root = await waitFor(() => host.shadowRoot?.querySelector<HTMLElement>('.peekover-reader'), 'the rendered sample');
    expect(root.querySelector('h1')?.textContent).toBe('A sample file');
    expect(root.querySelectorAll('input[type="checkbox"]').length, 'the task list').toBe(3);
    expect(root.querySelector('table th')?.textContent?.trim()).toMatch(/^Step/);
    expect(container.querySelector('.peekover-app')!.hasAttribute('data-document'), 'a document is open').toBe(true);
    expect(container.querySelector('.peekover-app')!.hasAttribute('data-folder'), 'no folder: the store-free route').toBe(false);

    await sleep(300);
    expect(writes, 'the sample stored nothing (no folder, recent or pin)').toEqual([]);
    await wireSettled();
    expect(networkedUrls().filter(isOffOrigin), 'the sample put an OFF-ORIGIN request on the wire').toEqual([]);
  }, 30_000);
});
