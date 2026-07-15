// Task 3.4 — the FOLDER-MODE zero-network guard (both engines). [§9 zero-network guard]
// plan.md §Sequencing item 3 (the open/walk/render side of the bytes-on-wire guard).
//
// This is the bytes-on-wire property for the WHOLE folder path, extending the
// Resource-Timing discipline of remoteMedia.browser.test.ts and wipe.browser.test.ts:
// opening a folder, walking it, rendering a local file, and persisting to `store` must put
// NOTHING on the wire — folder access + IndexedDB + OPFS are all on-device; a handle `put`
// is structured clone, not a fetch (AGENTS.md #1). And remote media INSIDE an opened file
// stays blocked before the explicit opt-in (the M1 remote-resource policy still governs
// files reached through folder mode).
//
// Why real-engine: jsdom is blind to bytes-on-wire (the M1 fetch leak shipped through a
// green jsdom stack — retro standing rule), and loads no subresources, so a "no <img> in
// the tree" check there is only a proxy. Here we assert on the engine's own Resource Timing
// buffer, where an entry appears ONLY when the engine actually made the request.
//
// NON-VACUOUS / RED-FIRST: a CONTROL same-origin fetch is shown to land in the same buffer,
// proving the observer genuinely sees requests (so the zero-count is a real result, not a
// broken observer). And the guard FAILS if a real request fires — verified RED by opting
// into the blocked image (clicking Load), which fires exactly one image request and breaks
// the zero-network assert (recorded in progress.md). Every probe URL is SAME-ORIGIN, so if
// the policy ever regressed the request would hit the vitest dev server (a 404), never the
// public internet — but http(s) still classifies as a networked entry, exactly as a CDN
// URL would.
//
// The real folder-walk slice uses a real OPFS handle (feature-detected; skips cleanly where
// OPFS/async-iteration is absent). The remote-media-stays-blocked slice needs no OPFS and
// runs on both engines unconditionally.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { folderSourceFromHandle } from '../../src/app/chromiumFolderSource';
import { mount } from '../../src/render/mount';
import {
  putFolder,
  putRecent,
  wipeAll,
  __resetConnectionForTest,
} from '../../src/app/store';

let seq = 0;
const nextId = () => `net${(seq += 1)}-${Math.trunc(performance.now())}`;

// A macrotask + rAF + settle — long enough that any request fired during the window has
// reached the Resource Timing buffer (mirrors remoteMedia/wipe browser tests).
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

/** The http(s) resource-timing entry names currently in the buffer. */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name));
}

/** A same-origin, absolute, http(s) URL → classifyMediaUrl() returns 'remote' → BLOCKED. */
function remoteUrl(token: string, n: number): string {
  return new URL(`/__peekover_folder_net__/${token}/${n}.png`, location.origin).href;
}

// --- OPFS stand-in helpers (feature-detected) -----------------------------------

async function opfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return (await navigator.storage?.getDirectory?.()) ?? null;
  } catch {
    return null;
  }
}
async function writeFile(dir: FileSystemDirectoryHandle, name: string, text: string): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}
async function detectSupport(): Promise<boolean> {
  const root = await opfsRoot();
  if (!root) return false;
  const probe = `peekover-netprobe-${Math.trunc(performance.now())}`;
  try {
    const dir = await root.getDirectoryHandle(probe, { create: true });
    await writeFile(dir, 'x.md', '# x');
    if (typeof dir.values !== 'function') return false;
    const first = await dir.values()[Symbol.asyncIterator]().next();
    await root.removeEntry(probe, { recursive: true });
    return !first.done;
  } catch {
    try {
      await root.removeEntry(probe, { recursive: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

const created: string[] = [];
async function makeDir(): Promise<FileSystemDirectoryHandle> {
  const root = (await opfsRoot())!;
  const name = `peekover-net-${nextId()}`;
  created.push(name);
  return root.getDirectoryHandle(name, { create: true });
}

let supported = false;

describe('folder mode — real-engine zero-network guard (bytes on the wire)', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    supported = await detectSupport();
    await wipeAll();
    performance.clearResourceTimings();
    host = document.createElement('peekover-root');
    document.body.appendChild(host);
  });

  afterEach(async () => {
    host.remove();
    __resetConnectionForTest();
    const root = await opfsRoot();
    if (root) {
      for (const name of created.splice(0)) {
        try {
          await root.removeEntry(name, { recursive: true });
        } catch {
          /* ignore */
        }
      }
    }
  });

  it('open + walk + render a local file + store put(+handle) fire ZERO network requests', async () => {
    if (!supported) return; // engine without the real OPFS folder path (group-4 territory)

    performance.clearResourceTimings();

    // A real folder with a couple of markdown files.
    const dir = await makeDir();
    await writeFile(dir, 'index.md', '# Index heading\n\nLocal body.');
    const docs = await dir.getDirectoryHandle('docs', { create: true });
    await writeFile(docs, 'guide.md', '# Guide heading\n\nMore local text.');

    // Walk it (eager, bounded) and persist the folder + a recent — incl. the real handle.
    const source = await folderSourceFromHandle(dir);
    expect(source.files.length).toBe(2);
    const folderId = nextId();
    await putFolder({
      id: folderId,
      name: source.name,
      handle: source.handle,
      addedAt: performance.now(),
      lastOpenedAt: performance.now(),
    });
    await putRecent({
      id: nextId(),
      folderId,
      path: 'index.md',
      name: 'index.md',
      openedAt: performance.now(),
    });

    // Render a local file through the unchanged M1 pipeline.
    const file = source.files.find((f) => f.name === 'index.md')!;
    mount(await file.read(), host);
    expect(host.shadowRoot?.querySelector('h1')?.textContent).toContain('Index heading');

    await flush();

    // GROUND TRUTH: not one http(s) request hit the wire across the whole folder path.
    expect(networkedUrls()).toEqual([]);

    // NON-VACUOUS control: a same-origin fetch DOES land in the buffer — the observer works.
    const probe = new URL(`/__peekover_folder_probe__/${nextId()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flush();
    expect(networkedUrls()).toContain(probe);
  });

  it('a remote image inside an opened folder file stays BLOCKED pre-opt-in (no wire, no <img>)', async () => {
    // No OPFS needed: an "opened file" is modelled by its markdown text rendered through the
    // same mount() the reader pane uses. Runs on both engines.
    performance.clearResourceTimings();

    const token = `t${nextId()}`;
    const urls = [remoteUrl(token, 1), remoteUrl(token, 2)];
    const markdown = `# Doc from a folder\n\n![a](${urls[0]})\n\n![b](${urls[1]})`;

    mount(markdown, host);
    await flush();

    // GROUND TRUTH: neither image was fetched — zero bytes on the wire for the folder file.
    const fetched = performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .filter((name) => name.includes(`/__peekover_folder_net__/${token}/`));
    expect(fetched).toEqual([]);

    // And the committed tree is in the designed blocked state (no live <img>, placeholders +
    // opt-in pill present, network indicator dark) — the M1 policy governs folder files too.
    const shadow = host.shadowRoot!;
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelectorAll('.peekover-remote').length).toBe(2);
    expect(shadow.querySelector('.peekover-remote-load')?.textContent).toContain('blocked');
    expect(host.hasAttribute('data-network')).toBe(false);

    // NON-VACUOUS control: prove the observer sees requests on this engine.
    const probe = new URL(`/__peekover_folder_probe__/${nextId()}.txt`, location.origin).href;
    await fetch(probe).catch(() => undefined);
    await flush();
    expect(networkedUrls()).toContain(probe);
  });
});
