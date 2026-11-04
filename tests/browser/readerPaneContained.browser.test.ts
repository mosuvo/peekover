// The REAL-ENGINE containment proof: a file selected in the app page renders INSIDE the
// reader pane, NOT as a full-page takeover of the shell. Spec 002 · manual-gate bug fix.
//
// This is the assertion jsdom STRUCTURALLY cannot make: it needs layout. The reader's
// shadow root styles :host as a full-bleed content-script takeover (position:fixed; inset:0)
// with three position:fixed chrome pills (readerCss.ts). In the content script that is
// correct — the reader SHOULD cover the raw markdown page. Reused inside the app page's
// reader pane it paints OVER the shell (header, folder tree). jsdom's mount tests pass
// because they assert the host got shadow content; they cannot see that the host also
// covers the shell. Only a real engine computing geometry can.
//
// No OPFS / no native picker needed: the grant flow is driven through the injectable
// `openFolder` seam with an IN-MEMORY folder source, so this runs (never skips) on BOTH
// Chromium AND Firefox — the point being to confirm the containment holds in both, given
// the known cross-engine quirks with positioned descendants.

import { describe, it, expect, afterEach } from 'vitest';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';

/** A store that captures nothing — the grant flow's IndexedDB writes are irrelevant here. */
function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** An in-memory folder source — one markdown file, read from memory. Structurally the real
 *  `FolderSource` the Chromium walk produces, minus the disk. Drives the full shell path
 *  (chip → tree → reader) with no OPFS, so both engines run it. */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: false,
    files: [{ path: name, name, read: async () => text }],
  };
}

/** Poll until `fn()` is truthy — the tree-click render chain is fire-and-forget async. */
async function waitFor<T>(fn: () => T | null | undefined, tries = 100): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('waitFor timed out');
}

const containers: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
});

/** Mount the shell, grant the in-memory folder, select its file, and return the live nodes
 *  needed for geometry assertions once the reader has rendered. */
async function renderSelectedFile(): Promise<{
  container: HTMLElement;
  header: HTMLElement;
  folders: HTMLElement;
  reader: HTMLElement;
  host: HTMLElement;
}> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const source = memorySource('doc.md', '# Contained heading\n\nBody rendered in the pane.');
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source }),
    store: fakeStore(),
  });

  await app.openFolder();
  const fileBtn = container.querySelector<HTMLButtonElement>(
    '[role="treeitem"][data-kind="file"]',
  );
  expect(fileBtn?.textContent).toBe('doc.md');
  fileBtn!.click();

  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  // The file really rendered (grant→read→render is live), so the geometry we assert on
  // is the geometry of an actual rendered document, not an empty host.
  await waitFor(() => host.shadowRoot?.querySelector('h1'));
  // KEEPS: the helper waits for the rendered reader before measuring (C264–C266). RE-SPELLED at 013 task 4.5: it
  // waited for the mode pill too; the app page has none (`pills: false`) — the rendered h1 above is the signal.

  return {
    container,
    header: container.querySelector<HTMLElement>('.peekover-app__header')!,
    folders: container.querySelector<HTMLElement>('.peekover-app__folders')!,
    reader: container.querySelector<HTMLElement>('.peekover-app__reader')!,
    host,
  };
}

/** The topmost element at a rect's centre, from the document's (light-DOM) perspective.
 *  A point over shadow content resolves to the shadow HOST — so if the reader host covers
 *  the shell, this returns the host, which is exactly the bug. */
function topAtCentre(rect: DOMRect): Element | null {
  return document.elementFromPoint(
    Math.round(rect.left + rect.width / 2),
    Math.round(rect.top + rect.height / 2),
  );
}

describe('app-page reader renders CONTAINED in the pane, not over the shell (both engines)', () => {
  it('the shell header stays on top at its own centre — the reader host does not cover it', async () => {
    const { header, host } = await renderSelectedFile();

    const atHeader = topAtCentre(header.getBoundingClientRect());
    // The header (or a descendant of it) is the topmost element where the header is.
    expect(atHeader === header || header.contains(atHeader)).toBe(true);
    // And crucially it is NOT the reader host painting over the header.
    expect(atHeader === host || host.contains(atHeader)).toBe(false);
  });

  it('the folder tree stays on top at its own centre — the reader host does not cover it', async () => {
    const { container, folders, host } = await renderSelectedFile();
    // KEEPS: the reader host never covers the folder tree (C264). RE-SPELLED at 013 task 4.8: at <= 1272 px with a
    // document open the tree is a closed overlay behind "Files" — open it, then the tree must be on top.
    const files = container.querySelector<HTMLButtonElement>('.peekover-toolbar__files-btn')!;
    if (files.getClientRects().length > 0) {
      files.click();
      await waitFor(() => folders.getBoundingClientRect().width > 0);
    }
    expect(folders.getBoundingClientRect().width, 'the tree is on screen to be measured').toBeGreaterThan(0);

    const atFolders = topAtCentre(folders.getBoundingClientRect());
    expect(atFolders === folders || folders.contains(atFolders)).toBe(true);
    expect(atFolders === host || host.contains(atFolders)).toBe(false);
  });

  it('the reader host is not pinned to the viewport (position != fixed)', async () => {
    const { host } = await renderSelectedFile();
    expect(getComputedStyle(host).position).not.toBe('fixed');
  });

  // RETIRED (C263) at 013 task 4.5: "the Raw toggle sits inside the reader pane" — Read / Raw are the toolbar's
  // (outside the pane); the app page builds no mode pill (`pills: false`).
});
