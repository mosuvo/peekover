// ★ THE ZERO-NETWORK PROOF FOR THE EDIT SAVE-BACK PATH (012 task 5.7; spec §4 Trust; AGENTS.md #1).
// Real engine — Chromium AND Firefox — at the request level, never a DOM-shape proxy.
//
// ══ THE CLAIM ═══════════════════════════════════════════════════════════════════════════════════
//
//     Entering edit, the live preview, and Save — the write, the refusal, and the download —
//     put NOTHING on the wire that leaves this origin.
//
// It is scoped to OFF-ORIGIN, exactly as `diagramNetwork` and `mathNetwork` scope theirs and for
// the reason their headers give: in the PRODUCT the lazy chunks (CodeMirror, and the reader's
// engines the preview reuses) are `chrome-extension://` / `moz-extension://` URLs inside the
// signed package, which the `/^https?:/i` wire predicate excludes by scheme. In THIS harness the
// dev server serves the same chunks over `http://localhost`, so a cold load is same-origin module
// traffic. A bare "zero requests" would measure whether an earlier file had already loaded
// CodeMirror, not whether anything left the origin.
//
// ══ THE THREE WINDOWS (tasks.md 5.7) ════════════════════════════════════════════════════════════
//
//   LOAD     entering edit — the click on the edit control to a live CodeMirror view.
//   PREVIEW  a document holding a fence for each of the reader's four enhancers (mermaid, math,
//            code, table), a mermaid fence carrying `$$` (R15's gate), real keys, and a typed
//            REMOTE image reference — from edit entry until the re-rendered preview has finished.
//   SAVE     the download (no handle — both engines; a declined prompt — Chromium); the granted
//            write, the Ctrl/Cmd+S path, leaving edit after a save, and a refused conflict —
//            unwatched and on a document the app page is itself watching (Chromium: the write
//            needs a real `FileSystemFileHandle`, here in the origin private file system).
//
// A window is a time bracket: `performance.now()` at its opening, and every reading is of what
// STARTED at or after that. Nothing here reads an absolute count or assumes a pristine buffer.
//
// ══ THE TWO INSTRUMENTS ═════════════════════════════════════════════════════════════════════════
//
//   THE WIRE   Resource Timing, with the `/^https?:/i` predicate every guard file here shares and
//              `helpers/diagramWindow.ts`'s `isOffOrigin`. Read two ways and united: the shared
//              buffer, and a `PerformanceObserver` opened with the window — so a full buffer
//              cannot turn into a quiet zero.
//   THE CALLS  `fetch`, `XMLHttpRequest.open`, `navigator.sendBeacon`, `WebSocket` and
//              `EventSource`, each wrapped for the window and passed through. A WebSocket never
//              enters Resource Timing, and AGENTS.md #1 names it.
//
// `blob:` and `data:` URLs are not on the wire by scheme; a download's blob URL is neither
// counted nor needs to be.
//
// ══ ★ THE FIRING CONTROL — in every window, on the window's own reading ═════════════════════════
//
// After each window's claim is read, and before the window closes, a leak is put INTO the surface
// that was measured: an SVG `<image href>` built node by node and adopted with no sanitizer and no
// media policy in front of it (`injectLiveImageHref` — the seam `diagramNetwork`'s TIER 2 uses,
// and immune by construction to the Firefox inert-parse trap), plus a bare `fetch` and a
// `WebSocket`. The SAME reading that said "nothing" must now name all three. If it does not, the
// zero above it was a blind spot and the test fails on the control, not on the claim.
//
// The claim is then read a SECOND time, the control's probes taken out. Resource Timing records a
// request when it ends, so the first reading cannot see one still in flight; the control's own
// request landing is what says an earlier one has had time to (`claimThenControl`).
//
// Every probe is on the LOOPBACK: the page is `http://localhost:PORT`, the probes are
// `127.0.0.1:PORT` — a different origin, the same machine. Nothing here names an external host.
//
// RED-FIRST (progress.md's 5.7 record): with a leak adopted into the surface BEFORE the claim is
// read, every window's claim goes red naming it, on every engine it runs on — at the second
// reading. At the first it stayed green, which is how the second came to exist.
//
// ══ WHAT THIS FILE DOES NOT REACH — named, and on the 7.1 walk ══════════════════════════════════
//
//   • the real folder picker and a write to the user's own disk (OPFS is not their disk);
//   • the browser's own write prompt, and its re-prompt after a reload or in a duplicated tab —
//     an OPFS handle is granted without a prompt, and a test cannot reload the page it runs in;
//   • the loaded extension, where the chunks are extension-scheme URLs (and all of Firefox there);
//   • the browser's own handling of a download — the anchor click is swallowed here, as in
//     `editorSave.browser.test.ts`, so no file is really saved;
//   • the Ctrl/Cmd+S KEY itself: its listener is `entrypoints/app/main.ts`'s, pinned by
//     `exportShortcut.browser.test.ts`. This file drives what the key calls, `saveEdit()`.
//
// ══ WATCH STATE, STATED PER FIXTURE; HARNESS-SHARED-STATE (AGENTS.md) ═══════════════════════════
//
// `opened()` asserts the document is NOT watched; `appWatched()` asserts that it IS. Files run
// serially on one `document`: registries are reset around each test, every wrapper is restored,
// every file this suite creates is its own and is removed, and CodeMirror or an engine having
// been loaded by an earlier file is expected — which is why no arm asserts a cold load.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { mountAppShell, type AppController, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { DIAGRAM_ERROR_CLASS, DIAGRAM_STATE_ATTR } from '../../src/render/diagramView';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import {
  EDITOR_SAVE_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_STATUS_CLASS,
  editorSessionFor,
  editorShellFor,
  teardownEditorShell,
  type EditorSession,
} from '../../src/render/editorView';
import { REMOTE_PLACEHOLDER_CLASS } from '../../src/render/mediaPolicy';
import { readerSourceFor } from '../../src/render/readerMode';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetWatchControlsForTest, WATCH_CONTROL_CLASS } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR } from '../../src/watch/watchController';
import { isWatching, resetWatchRegistryForTest, stopWatch } from '../../src/watch/watchRegistry';
import {
  drainMeasureContainers,
  flush,
  injectLiveImageHref,
  isOffOrigin,
  offOriginProbeUrl,
} from './helpers/diagramWindow';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const CHROMIUM = ENGINE === 'chromium';
const record = (line: string): void => console.log(`[5.7][${ENGINE}] ${line}`);

const NARROW = { width: 414, height: 896 };

// ── The window, and its two instruments ───────────────────────────────────────────────────────

interface NetWindow {
  /** `performance.now()` at the opening. */
  open: number;
  /** Resource Timing entries the observer delivered. */
  observed: PerformanceEntry[];
  /** Absolute URLs handed to a network API while the window was open. */
  calls: string[];
  observer: PerformanceObserver;
  close: () => void;
}

const windows: NetWindow[] = [];

const absolute = (input: unknown): string => {
  const raw = input instanceof Request ? input.url : String(input);
  try {
    return new URL(raw, location.href).href;
  } catch {
    return raw;
  }
};

function openWindow(): NetWindow {
  const observed: PerformanceEntry[] = [];
  const calls: string[] = [];
  const observer = new PerformanceObserver((list) => void observed.push(...list.getEntries()));
  observer.observe({ type: 'resource' });

  const realFetch = window.fetch.bind(window);
  const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation((input, init) => {
    calls.push(absolute(input));
    return realFetch(input, init);
  });
  const realXhrOpen = XMLHttpRequest.prototype.open;
  const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(function (
    this: XMLHttpRequest,
    ...args: unknown[]
  ) {
    calls.push(absolute(args[1]));
    return (realXhrOpen as (...a: unknown[]) => void).apply(this, args);
  });
  const realBeacon = navigator.sendBeacon.bind(navigator);
  const beaconSpy = vi.spyOn(navigator, 'sendBeacon').mockImplementation((url, data) => {
    calls.push(absolute(url));
    return realBeacon(url, data);
  });
  const RealWebSocket = window.WebSocket;
  window.WebSocket = class extends RealWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      calls.push(absolute(url));
      super(url, protocols);
    }
  };
  const RealEventSource = window.EventSource;
  window.EventSource = class extends RealEventSource {
    constructor(url: string | URL, init?: EventSourceInit) {
      calls.push(absolute(url));
      super(url, init);
    }
  };

  const w: NetWindow = {
    open: performance.now(),
    observed,
    calls,
    observer,
    close: () => {
      observer.disconnect();
      fetchSpy.mockRestore();
      xhrSpy.mockRestore();
      beaconSpy.mockRestore();
      window.WebSocket = RealWebSocket;
      window.EventSource = RealEventSource;
    },
  };
  windows.push(w);
  return w;
}

/** THE WIRE: every http(s) request that STARTED inside the window — the shared buffer and the
 *  window's own observer, united. */
function wire(w: NetWindow): string[] {
  w.observed.push(...w.observer.takeRecords());
  const entries = [...w.observed, ...performance.getEntriesByType('resource')];
  return [
    ...new Set(entries.filter((e) => e.startTime >= w.open).map((e) => e.name)),
  ].filter((name) => /^https?:/i.test(name));
}

/** THE CALLS that named another origin: http(s) or ws(s), and not this page's own host. */
function callsLeavingOrigin(w: NetWindow): string[] {
  return w.calls.filter((url) => /^(https?|wss?):/i.test(url) && new URL(url).host !== location.host);
}

/** ★ THE CLAIM'S READING — everything, by either instrument, that left this origin. */
function leftOrigin(w: NetWindow): string[] {
  return [...wire(w).filter(isOffOrigin), ...callsLeavingOrigin(w)];
}

let probeSeq = 0;

/**
 * Read the claim, fire the control into `surface`, then read the claim AGAIN — all inside the
 * window, all off the same reading.
 *
 * ★ WHY TWICE. Resource Timing records a request when it ENDS, not when it starts. A request
 * still in flight is in neither the buffer nor the observer, so the first reading — taken after
 * a `flush()` — sees only what has already finished. (Measured while writing this file: a leak
 * adopted 1.5 s before that reading was NOT in it; a refused loopback connection takes about two
 * seconds to fail here.) The control is what times the second reading: once the control's own
 * off-origin request has landed, any off-origin request the window issued BEFORE it has had
 * longer. So the second reading, with the control's three probes taken out, is the claim.
 */
async function claimThenControl(w: NetWindow, surface: HTMLElement, label: string): Promise<void> {
  await flush();
  const sameOrigin = wire(w).filter((name) => !isOffOrigin(name)).length;
  const left = leftOrigin(w);
  expect(
    left,
    `${label}: something LEFT THIS ORIGIN inside the window, and had already finished — AGENTS.md ` +
      '#1. This is a finding to report, not an assertion to adjust.',
  ).toEqual([]);

  probeSeq += 1;
  const slug = `/__peekover_probe__/editor-network/${label.replace(/[^a-z0-9]+/gi, '-')}-${probeSeq}`;
  const image = offOriginProbeUrl(`${slug}/leak.png`);
  const fetched = offOriginProbeUrl(`${slug}/leak.txt`);
  const socket = `ws://127.0.0.1:${location.port}${slug}/leak`;
  expect(surface.isConnected, `${label}: the measured surface is still live`).toBe(true);
  injectLiveImageHref(surface, image);
  void fetch(fetched, { mode: 'no-cors' }).catch(() => undefined);
  new WebSocket(socket).close();

  await flush();
  const deadline = performance.now() + 5000;
  while (
    !(wire(w).includes(image) && wire(w).includes(fetched)) &&
    performance.now() < deadline
  ) {
    await new Promise<void>((r) => setTimeout(r, 25));
  }
  const after = leftOrigin(w);
  record(
    `${label}: same-origin requests in window=${sameOrigin}; left origin=${left.length}; ` +
      `control caught — adopted image=${after.includes(image)}, fetch (wire)=${wire(w).includes(fetched)}, ` +
      `fetch (call)=${w.calls.includes(fetched)}, websocket (call)=${after.includes(socket)}`,
  );
  expect(
    after,
    `${label}: THE CONTROL DID NOT FIRE — a remote reference adopted into the measured surface ` +
      'with no sanitizer in front of it was not seen, so the zero above is a blind spot',
  ).toContain(image);
  expect(wire(w), `${label}: a bare off-origin fetch did not reach Resource Timing`).toContain(fetched);
  expect(callsLeavingOrigin(w), `${label}: the call log missed the fetch`).toContain(fetched);
  expect(callsLeavingOrigin(w), `${label}: the call log missed the WebSocket`).toContain(socket);

  // ★ THE CLAIM, read again now that an off-origin request has had time to land.
  const probes = [image, fetched, socket];
  expect(
    after.filter((url) => !probes.includes(url)),
    `${label}: something LEFT THIS ORIGIN inside the window — it was still in flight at the first ` +
      'reading. AGENTS.md #1: a finding to report, not an assertion to adjust.',
  ).toEqual([]);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

const TYPED = ' zqntyped';
const body = (marker: string): string => `# Network doc\n\nA paragraph.\n\n${marker}\n`;
const ON_DISK = body('The line on disk at open zna.');
/** Same length as ON_DISK, different content. */
const OUT_OF_BAND = body('The line on disk changed znb.');

const FENCE = '```';
/** A fence for each of the reader's four enhancers, and a mermaid fence carrying `$$` (R15). */
const FOUR_ENHANCERS = [
  'Intro line znc.',
  '',
  `${FENCE}mermaid`,
  'graph TD',
  '  A[Alpha] --> B[Beta]',
  FENCE,
  '',
  `${FENCE}mermaid`,
  'sequenceDiagram',
  '  Alice->>Bob: $$x^2$$',
  FENCE,
  '',
  '$$',
  'E = mc^2',
  '$$',
  '',
  'Inline math $x^2$ here.',
  '',
  `${FENCE}javascript`,
  'const answer = 42;',
  FENCE,
  '',
  '| name | count |',
  '| ---- | ----- |',
  '| beta | 2     |',
  '| alfa | 1     |',
  '',
].join('\n');

let dir: FileSystemDirectoryHandle | null = null;
let seq = 0;
const made: string[] = [];

beforeAll(async () => {
  if (!CHROMIUM) return;
  const root = await navigator.storage.getDirectory();
  dir = await root.getDirectoryHandle('editor-network-5-7', { create: true });
});

async function writeDisk(fh: FileSystemFileHandle, text: string): Promise<void> {
  const writable = await fh.createWritable();
  await writable.write(text);
  await writable.close();
}

const readDisk = async (fh: FileSystemFileHandle): Promise<string> => (await fh.getFile()).text();

const fileName = (label: string): string => {
  seq += 1;
  return `net-${label}-${seq}-${Math.trunc(performance.now())}.md`;
};

/** A real file in the origin private file system, and the `MarkdownFile` the shell is given for
 *  it — the SAME handle object in both. Chromium only. */
async function diskFile(label: string, text: string): Promise<{ fh: FileSystemFileHandle; file: MarkdownFile }> {
  const name = fileName(label);
  const fh = await dir!.getFileHandle(name, { create: true });
  made.push(name);
  await writeDisk(fh, text);
  return { fh, file: { path: name, name, read: () => readDisk(fh), handle: fh } };
}

/** A read-only snapshot file: no handle — what every Firefox folder route produces. */
function snapshot(label: string, text: string): MarkdownFile {
  const name = fileName(label);
  return { path: name, name, read: async () => text };
}

// ── Harness (`editorSave.browser.test.ts`'s rig, copied — a test module has its own lifecycle) ─

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

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const containers: HTMLElement[] = [];

interface Rig {
  app: AppController;
  container: HTMLElement;
  host: HTMLElement;
}

async function mountAndSelect(file: MarkdownFile, persistable: boolean): Promise<Rig> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const source: FolderSource = { name: 'docs', truncated: false, persistable, files: [file] };
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source }),
    store: fakeStore(),
  });
  await app.openFolder();
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
  return { app, container, host };
}

/** One file open on the app page, NOT watched. */
async function opened(file: MarkdownFile, persistable = true): Promise<Rig> {
  const rig = await mountAndSelect(file, persistable);
  expect(isWatching(), 'this fixture is UNWATCHED').toBe(false);
  return rig;
}

/** One file open and WATCHED through the reader's own watch control: the shell's controller and
 *  the shell's detector. Chromium only. */
async function appWatched(file: MarkdownFile): Promise<Rig> {
  const rig = await mountAndSelect(file, true);
  const pill = rig.host.shadowRoot!.querySelector<HTMLElement>(`.${WATCH_CONTROL_CLASS}`);
  expect(pill, 'the app page offers its watch control for this file').not.toBeNull();
  pill!.click();
  await waitFor(() => isWatching(), 'the app page’s own watch to start');
  expect(isWatching(), 'this fixture is WATCHED').toBe(true);
  return rig;
}

const controlIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!;
const shellIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SHELL_CLASS}`)!;
const saveButtonIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SAVE_CLASS}`)!;
const statusIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`)!;
/** The OUTER reading column — a direct child of the host's shadow root, never the preview's. */
const outerColumn = (host: HTMLElement): HTMLElement =>
  [...host.shadowRoot!.children].find((el) => el.classList.contains('peekover-reader')) as HTMLElement;

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

/** Wait for the outcome line of a save that has just been started. */
async function reported(host: HTMLElement): Promise<string> {
  expect(statusIn(host).hidden, 'the status empties as the save starts').toBe(true);
  await waitFor(() => !statusIn(host).hidden, 'the save to report');
  return statusIn(host).textContent ?? '';
}

async function clickSave(host: HTMLElement): Promise<string> {
  saveButtonIn(host).click();
  return reported(host);
}

/** `editorSave.browser.test.ts`'s download instrument: swallow every anchor click and record the
 *  name and the blob behind its `href`. Nothing is really downloaded. */
function watchDownloads(): { named: (name: string) => Array<{ type: string | undefined }>; restore: () => void } {
  const blobs = new Map<string, Blob>();
  const realCreate = URL.createObjectURL.bind(URL);
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((object) => {
    const url = realCreate(object);
    if (object instanceof Blob) blobs.set(url, object);
    return url;
  });
  const seen: Array<{ filename: string; type: string | undefined }> = [];
  const clicks = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    seen.push({ filename: this.download, type: blobs.get(this.href)?.type });
  });
  return {
    named: (name) => seen.filter((d) => d.filename === name),
    restore: () => {
      clicks.mockRestore();
      create.mockRestore();
    },
  };
}

const downloadLine = (name: string): string =>
  `Saved as a download: ${name}. The file in the folder was not changed.`;

/** Long enough for the app page's watch to have seen a write (`editorSave`'s figure). */
const detected = (): Promise<void> => sleep(1600);

beforeEach(async () => {
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  await wipeAll();
  document.body.replaceChildren();
  // The buffer is finite and shared; an entry dropped from a full one is the quiet zero the
  // window's observer exists to prevent. Every guard file clears it here, and reads by window.
  performance.clearResourceTimings();
});

afterEach(async () => {
  for (const w of windows.splice(0)) w.close();
  stopWatch();
  await drainMeasureContainers();
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

// ── LOAD ──────────────────────────────────────────────────────────────────────────────────────

describe('012 task 5.7 — LOAD: entering edit puts nothing off-origin on the wire (Chromium + Firefox)', () => {
  it('★ the edit control → a live CodeMirror view: zero off-origin; the control fires', async () => {
    const file = snapshot('load', ON_DISK);
    const { host } = await opened(file, false); // UNWATCHED, asserted

    const w = openWindow();
    const session = await enterEdit(host);
    await waitFor(() => host.shadowRoot!.querySelector('.cm-editor'), 'the CodeMirror view');

    // The window measured a working edit view, not a failed load.
    expect(buffer(session), 'the editor is seeded with the document').toBe(ON_DISK);
    expect(editorShellFor(host)?.previewHost.shadowRoot, 'and the preview was built').toBeTruthy();
    const modules = wire(w).filter((name) => !isOffOrigin(name));
    record(
      `LOAD: ${modules.length} same-origin module request(s) — ` +
        (modules.length > 0 ? 'a cold editor load in this page' : 'the editor was already loaded by an earlier file'),
    );

    await claimThenControl(w, shellIn(host), 'LOAD');
  }, 120_000);
});

// ── PREVIEW ───────────────────────────────────────────────────────────────────────────────────

describe('012 task 5.7 — PREVIEW: typing with the four enhancers live puts nothing off-origin on the wire (Chromium + Firefox)', () => {
  const finished = (column: Element): boolean =>
    column.querySelectorAll('.peekover-diagram svg').length > 0 &&
    column.querySelectorAll('math').length > 0 &&
    column.querySelectorAll('.peekover-code pre.shiki').length > 0 &&
    column.querySelectorAll('.peekover-table-tools').length > 0 &&
    column.querySelectorAll(`[${DIAGRAM_STATE_ATTR}="pending"]`).length === 0;
  /** Never throws: an un-enhanced column is then read by the assertions, in its own units. */
  const settle = async (column: () => Element | null | undefined, ms = 90_000): Promise<void> => {
    const until = performance.now() + ms;
    for (;;) {
      const el = column();
      if ((el && finished(el)) || performance.now() > until) return;
      await sleep(50);
    }
  };

  /** katex's own lazy chunk, by `diagramKatexGate.browser.test.ts`'s pattern. */
  const katexRequests = (w: NetWindow): string[] => wire(w).filter((name) => /\/katex-[^/]*\.js/i.test(name));
  /** katex's artifacts in the LIVE light DOM — that file's second instrument. The reader's own
   *  Temml `<math>` lands in a shadow root, which this does not see. */
  function watchKatex(): { seen: string[]; stop: () => void } {
    const seen: string[] = [];
    const selector = '#katex-temp, .katex, math';
    const tally = (records: MutationRecord[]): void => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node instanceof Element && (node.matches(selector) || node.querySelector(selector))) {
            seen.push(node.id || node.localName);
          }
        }
      }
    };
    const observer = new MutationObserver(tally);
    observer.observe(document.body, { childList: true, subtree: true });
    return {
      seen,
      stop: () => {
        tally(observer.takeRecords());
        observer.disconnect();
      },
    };
  }

  it('★ build, real keys, a typed REMOTE image, and the re-render: zero off-origin; R15’s gate holds; the control fires', async () => {
    const file = snapshot('preview', FOUR_ENHANCERS);
    const { host } = await opened(file, false); // UNWATCHED, asserted
    // The reader's own render of this document is the reader's to prove (diagramNetwork,
    // mathNetwork, codeNetwork, tableNetwork). Let it finish, so the window is the preview's.
    await settle(() => outerColumn(host));
    expect(finished(outerColumn(host)), 'the reader rendered all four kinds before the window').toBe(true);

    /** A remote reference the user types. Its own URL: the control's is a different one. */
    const typedRemote = offOriginProbeUrl(`/__peekover_probe__/editor-network/typed-${Date.now()}/remote.png`);
    expect(isOffOrigin(typedRemote)).toBe(true);

    const w = openWindow();
    const katex = watchKatex();
    try {
      const session = await enterEdit(host);
      const shell = editorShellFor(host)!;
      const column = (): HTMLElement | null =>
        shell.previewHost.shadowRoot!.querySelector<HTMLElement>('.peekover-reader');
      await settle(column);
      const built = column();
      expect(built && finished(built), 'at build the preview holds all four enhanced kinds').toBe(true);

      // Real keys, then the remote image — each a change the preview re-renders.
      session.view.focus();
      await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
      await userEvent.keyboard('zqxnet');
      type(session, `\n![typed remote](${typedRemote})\n`);
      await waitFor(() => readerSourceFor(shell.previewHost) === buffer(session), 'the preview caught up with the buffer');
      expect(column(), 'the typing re-rendered the preview').not.toBe(built);
      await settle(column);

      const now = column()!;
      expect(buffer(session)).toContain('zqxnet');
      expect(buffer(session)).toContain(typedRemote);
      // The four enhancers ran on the RE-RENDERED column — the window measured them at work.
      expect(now.querySelectorAll('.peekover-diagram svg').length, 'the diagram').toBe(1);
      expect(now.querySelectorAll('math').length, 'block and inline math').toBeGreaterThanOrEqual(2);
      expect(now.querySelectorAll('.peekover-code pre.shiki').length, 'the highlighted fence').toBe(1);
      expect(now.querySelectorAll('.peekover-table-tools').length, 'the table toolbar').toBe(1);
      // R15, in the window: the `$$` fence degraded before the engine, and katex neither ran nor loaded.
      expect(now.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}="failed"]`).length, 'the $$ fence degraded').toBe(1);
      expect(now.querySelector(`.${DIAGRAM_ERROR_CLASS}`)?.textContent).toContain('contains math');
      katex.stop();
      expect(katex.seen, 'R15: katex output appeared in the live document').toEqual([]);
      expect(katexRequests(w), 'R15: the katex chunk was requested').toEqual([]);
      // The typed remote image reached the preview's document — blocked, not fetched.
      expect(
        now.querySelectorAll(`.${REMOTE_PLACEHOLDER_CLASS}`).length,
        'the typed remote image is in the preview as a blocked placeholder',
      ).toBeGreaterThan(0);
      expect(now.querySelector('img[src^="http://127.0.0.1"]'), 'and never as a live <img>').toBeNull();
      expect(wire(w), 'the typed remote reference was never requested').not.toContain(typedRemote);

      await claimThenControl(w, now, 'PREVIEW');
    } finally {
      katex.stop();
    }
  }, 300_000);
});

// ── SAVE: the download ────────────────────────────────────────────────────────────────────────

describe('012 task 5.7 — SAVE as a download, a file with no handle: nothing off-origin (Chromium + Firefox)', () => {
  it('★ Save, then the Ctrl/Cmd+S path: two downloads, zero off-origin; the control fires', async () => {
    const file = snapshot('download', ON_DISK);
    const { app, host } = await opened(file, false); // UNWATCHED, asserted
    const session = await enterEdit(host);
    type(session, TYPED);
    const downloads = watchDownloads();
    try {
      const w = openWindow();
      expect(await clickSave(host)).toBe(downloadLine(file.name));
      type(session, ' more');
      expect(app.saveEdit(), 'in edit, the shortcut path is a save').toBe(true);
      expect(await reported(host)).toBe(downloadLine(file.name));

      const mine = downloads.named(file.name);
      expect(mine, 'both saves were downloads of this file').toHaveLength(2);
      expect(mine.map((d) => d.type)).toEqual(['text/markdown', 'text/markdown']);

      await claimThenControl(w, shellIn(host), 'SAVE download (no handle)');
    } finally {
      downloads.restore();
    }
  }, 60_000);
});

// ── SAVE: the write (Chromium) ────────────────────────────────────────────────────────────────

describe.runIf(CHROMIUM)('012 task 5.7 — SAVE to the file: nothing off-origin (Chromium)', () => {
  it('★ UNWATCHED — a granted write, the Ctrl/Cmd+S path, then leaving edit: zero off-origin; the control fires', async () => {
    const { fh, file } = await diskFile('write', ON_DISK);
    const { app, host } = await opened(file); // UNWATCHED, asserted
    const session = await enterEdit(host);
    type(session, TYPED);

    const w = openWindow();
    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh), 'the write landed').toBe(ON_DISK + TYPED);
    type(session, ' more');
    expect(app.saveEdit()).toBe(true);
    expect(await reported(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe(`${ON_DISK + TYPED} more`);
    // Leaving edit after a save re-renders the reading view from the saved text (R19).
    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') !== 'edit', 'edit to be left');
    await waitFor(() => readerSourceFor(host) === `${ON_DISK + TYPED} more`, 'the reading view to show the saved text');

    await claimThenControl(w, outerColumn(host), 'SAVE write (unwatched)');
  }, 60_000);

  it('★ UNWATCHED — a conflict is refused: nothing written, zero off-origin; the control fires', async () => {
    const { fh, file } = await diskFile('conflict', ON_DISK);
    const { host } = await opened(file); // UNWATCHED, asserted
    const session = await enterEdit(host);
    type(session, TYPED);
    await writeDisk(fh, OUT_OF_BAND); // someone else, after edit entry

    const w = openWindow();
    expect(await clickSave(host)).toMatch(/^Not saved: the file changed on disk\./);
    expect(await readDisk(fh), 'nothing was written').toBe(OUT_OF_BAND);
    expect(buffer(session), 'the edit is still on screen').toBe(ON_DISK + TYPED);

    await claimThenControl(w, shellIn(host), 'SAVE conflict (unwatched)');
  }, 60_000);

  it('★ a DECLINED write prompt becomes a download: zero off-origin; the control fires', async () => {
    const { fh, file } = await diskFile('declined', ON_DISK);
    (fh as unknown as { requestPermission: () => Promise<PermissionState> }).requestPermission = async () => 'denied';
    const { host } = await opened(file); // UNWATCHED, asserted
    const session = await enterEdit(host);
    type(session, TYPED);
    const downloads = watchDownloads();
    try {
      const w = openWindow();
      expect(await clickSave(host)).toBe(downloadLine(file.name));
      expect(downloads.named(file.name)).toHaveLength(1);
      expect(await readDisk(fh), 'the file is untouched').toBe(ON_DISK);

      await claimThenControl(w, shellIn(host), 'SAVE download (declined)');
    } finally {
      downloads.restore();
    }
  }, 60_000);

  it('★ WATCHED by the app page — a write, its echo, an external change and the refused save: zero off-origin; the control fires', async () => {
    const { fh, file } = await diskFile('watched', ON_DISK);
    const { host } = await appWatched(file); // WATCHED, asserted
    const session = await enterEdit(host);
    type(session, TYPED);

    const w = openWindow();
    expect(await clickSave(host)).toBe('Saved.');
    expect(await readDisk(fh)).toBe(ON_DISK + TYPED);
    await detected(); // the watch has seen our own write by now
    expect(host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'our own write is not an external change').toBe(false);

    await writeDisk(fh, OUT_OF_BAND);
    await waitFor(() => host.hasAttribute(CHANGED_IN_EDIT_ATTR), 'the hint, for a change that is not ours', 8000);
    type(session, ' third');
    expect(await clickSave(host)).toMatch(/^Not saved: the file changed on disk\./);
    expect(await readDisk(fh), 'nothing was written over it').toBe(OUT_OF_BAND);
    expect(isWatching(), 'still watched as the window closes').toBe(true);

    await claimThenControl(w, shellIn(host), 'SAVE write + conflict (watched)');
  }, 60_000);
});
