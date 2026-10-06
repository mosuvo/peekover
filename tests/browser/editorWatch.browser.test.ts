// The watch/edit collision, on a WATCHED document (012 task 4.1; D-8) — Chromium AND Firefox.
//
// This is the first editor test with a watch running. Every group-3 file asserts it is unwatched;
// this one asserts the opposite, on every fixture.
//
// WHAT jsdom COULD NOT SAY, and this file does. `watchController.test.ts` proves the deferral as a
// state machine over `data-mode`, set by hand, against an injected render. It cannot show that the
// real edit control reaches that attribute, that a real `mount()` on the outer host is what an
// external change would otherwise cost, or what that costs a real editor: its DOM, and the text
// typed into it.
//
// THE WATCH IS HAND-DRIVEN (the `watchDiffDefer.browser.test.ts` precedent). The external change
// arrives through the detector seam on command, into a controller built here with the production
// `docId`; everything after that is production — the real controller, the real `mount`, the real
// edit control, the real CodeMirror view, the real capture path.
//
// ══ THE INSTRUMENT ══════════════════════════════════════════════════════════════════════════════
//
// A re-render of the document is `mount()` on the outer host, which ends in `replaceChildren` on
// that host's shadow root. `watchOuterRoot` observes exactly that: the root's own child list, and
// everything inside the outer reading column. It is read as a DELTA across the external change.
// The editor's own DOM is deliberately outside it — CodeMirror may touch its own nodes whenever
// it likes — and is checked by reference instead.
//
// ══ THE POSITIVE CONTROL IS IN THE SAME TEST ════════════════════════════════════════════════════
//
// "Nothing rendered" means something only if the watch is firing. Each deferral test ends by
// leaving edit and delivering one more change through the same seam, into the same host, read by
// the same instrument — and that one must re-render.
//
// ══ RED-FIRST (recorded in progress.md's 4.1 record) ════════════════════════════════════════════
//
// With `watchController.ts`'s `data-mode` read removed, the external change re-mounts the outer
// host under the editor: the root's child list is replaced, the editor node is disconnected, the
// host falls to 'reading', no live session remains and the typed text is on screen nowhere.
//
// ══ WHAT THIS FILE DOES NOT CLAIM ═══════════════════════════════════════════════════════════════
//
// Nothing here leaves edit with unsaved text. At 4.1 that exit discards the buffer (3.2; the guard
// is 6.1) and then flushes the on-disk text like any other exit; what it should do is task 4.2's.
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ════════════════════════════════════════════════════════════
//
// Files run serially on one `document`. Mutation counts and snapshot counts are deltas; text is
// matched by markers that appear in exactly one version of the document; every controller this
// file starts is stopped, and the watch, diff and theme registries are reset around each test.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource } from '../../src/app/folderSource';
import { getSnapshotMeta, getSnapshotText } from '../../src/app/snapshots';
import { wipeAll, __resetConnectionForTest } from '../../src/app/store';
import { getDiffContext, isDiffContextRegistered, resetDiffRegistryForTest } from '../../src/render/diffRegistry';
import { EDIT_CONTROL_CLASS } from '../../src/render/editorEnhancer';
import {
  EDITOR_DIRTY_ATTR,
  editorSessionFor,
  teardownEditorShell,
  type EditorSession,
} from '../../src/render/editorView';
import { readerSourceFor } from '../../src/render/readerMode';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import type { ChangeDetector } from '../../src/watch/changeDetector';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { CHANGED_IN_EDIT_ATTR, createWatchController } from '../../src/watch/watchController';
import {
  isWatching,
  registerWatchTarget,
  resetWatchRegistryForTest,
  watchNote,
  type WatchTarget,
} from '../../src/watch/watchRegistry';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const record = (line: string): void => console.log(`[4.1][${ENGINE}] ${line}`);

const NARROW = { width: 414, height: 896 }; // the harness default; this task ships no new chrome

const FILLER = Array.from(
  { length: 8 },
  (_, i) => `Paragraph ${i + 1}: lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
).join('\n\n');

const doc = (line: string): string => ['# Watched doc', FILLER, '## Section two', line].join('\n\n');

/** Each marker appears in exactly one version. */
const ON_DISK_AT_OPEN = 'The line on disk when the file was opened zqa.';
const ARRIVED_WHILE_EDITING = 'THIS ARRIVED WHILE THE DOCUMENT WAS BEING EDITED zqb.';
const ARRIVED_AFTER_EDITING = 'THIS ARRIVED AFTER EDIT MODE WAS LEFT zqc.';
const DOC_V1 = doc(ON_DISK_AT_OPEN);
const DOC_V2 = doc(ARRIVED_WHILE_EDITING);
const DOC_V3 = doc(ARRIVED_AFTER_EDITING);

const TYPED = 'zqxtyped';

// ── Harness ───────────────────────────────────────────────────────────────────────────────────

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

/** A PERSISTABLE in-memory source — that is what makes the app page watchable. */
function memorySource(name: string, text: string): FolderSource {
  return {
    name: 'docs',
    truncated: false,
    persistable: true,
    files: [{ path: name, name, read: async () => text }],
  };
}

/** A detector this suite drives by hand: `fire(text)` delivers a change on command. */
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

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 20000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

/** Long enough that a render which WAS going to happen has happened. */
const settle = (): Promise<void> => new Promise<void>((r) => setTimeout(r, 250));

const containers: HTMLElement[] = [];
const controllers: WatchTarget[] = [];

/** The OUTER reading column — a direct child of the host's shadow root, never the preview's. */
const outerColumn = (host: HTMLElement): HTMLElement =>
  [...host.shadowRoot!.children].find((el) => el.classList.contains('peekover-reader')) as HTMLElement;
const controlIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!;

/** Count mutations of the outer document: the shadow root's own child list (what `mount()`'s
 *  `replaceChildren` changes) and anything inside the outer reading column. */
function watchOuterRoot(host: HTMLElement): { count: () => number; stop: () => void } {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => void records.push(...batch));
  observer.observe(host.shadowRoot!, { childList: true });
  observer.observe(outerColumn(host), {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
  return {
    count: () => {
      records.push(...observer.takeRecords());
      return records.length;
    },
    stop: () => observer.disconnect(),
  };
}

async function snapshotTexts(docId: string): Promise<(string | undefined)[]> {
  const entries = (await getSnapshotMeta()).find((m) => m.docId === docId)?.entries ?? [];
  return Promise.all(entries.map((e) => getSnapshotText(e.id)));
}

/** Poll for `want` snapshots, then return whatever is there — it never throws, so a missing
 *  capture reddens at the `expect` that names it (the watchDiffDefer precedent). */
async function snapshotTextsSettling(docId: string, want: number): Promise<(string | undefined)[]> {
  for (let i = 0; i < 80; i += 1) {
    const texts = await snapshotTexts(docId);
    if (texts.length >= want) return texts;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  return snapshotTexts(docId);
}

interface Rig {
  host: HTMLElement;
  docId: string;
  fire: (text: string) => void;
}

/** The app page with DOC_V1 open through the real gesture chain, and a hand-driven watch RUNNING
 *  on the reader host — asserted, since a watched document is this file's whole premise. */
async function watched(): Promise<Rig> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource('doc.md', DOC_V1) }),
    store: fakeStore(),
  });
  await app.openFolder();
  container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]')!.click();
  const host = await waitFor(
    () => container.querySelector<HTMLElement>('.peekover-app__reader__host'),
    'the reader host',
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'), 'the rendered document');
  await waitFor(() => isDiffContextRegistered(), 'the app page registered its document');
  const docId = getDiffContext()!.docId;

  const fake = handDriven();
  const controller = createWatchController({ detector: fake.detector, docId, contained: true });
  registerWatchTarget(controller); // last-write-wins, as the registry documents
  controller.start(host);
  controllers.push(controller);

  expect(isWatching(), 'the document is WATCHED').toBe(true);
  expect(outerColumn(host).textContent).toContain(ON_DISK_AT_OPEN);
  return { host, docId, fire: fake.fire };
}

/** Enter edit through the real control and wait for the real editor. */
async function enterEdit(host: HTMLElement): Promise<EditorSession> {
  controlIn(host).click();
  await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
  const session = editorSessionFor(host);
  if (!session) throw new Error('entering edit left no live edit session');
  expect(isWatching(), 'still watched, in edit').toBe(true);
  return session;
}

/** The positive control: with edit OFF, a change through the same seam re-renders this host. */
async function expectWatchRerenders(rig: Rig): Promise<void> {
  expect(rig.host.getAttribute('data-mode')).not.toBe('edit');
  const snapshotsBefore = (await snapshotTexts(rig.docId)).length;
  const outer = watchOuterRoot(rig.host);
  const before = outer.count();
  rig.fire(DOC_V3);
  await waitFor(
    () => outerColumn(rig.host).textContent?.includes(ARRIVED_AFTER_EDITING),
    'the control change to reach the reading column',
  );
  const mutations = outer.count() - before;
  outer.stop();
  expect(mutations, 'the control re-render mutated the outer root').toBeGreaterThan(0);
  record(`control: edit off, one external change -> ${mutations} outer-root mutation record(s)`);
  // The control render captures as well, fire-and-forget. Wait it out: the teardown closes the
  // store's connection, and a write still in flight would reject into the next test.
  expect(await snapshotTextsSettling(rig.docId, snapshotsBefore + 1)).toHaveLength(snapshotsBefore + 1);
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
  __resetConnectionForTest();
  resetDiffRegistryForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  document.body.replaceChildren();
  await page.viewport(NARROW.width, NARROW.height);
});

describe('012 task 4.1 — an external change while editing a watched document is deferred (D-8)', () => {
  it('★ mutates nothing in the outer root and leaves the editor node in place; a clean exit shows the new text', async () => {
    const rig = await watched();
    const { host, docId, fire } = rig;
    const session = await enterEdit(host);
    const editorNode = session.view.dom;
    const columnNode = outerColumn(host);
    const snapshotsBefore = (await snapshotTexts(docId)).length;

    const outer = watchOuterRoot(host);
    const before = outer.count();

    // ── THE FILE CHANGES ON DISK WHILE THE DOCUMENT IS BEING EDITED ───────────────────────────
    fire(DOC_V2);
    await settle();

    const mutations = outer.count() - before;
    outer.stop();
    expect(
      {
        outerRootMutations: mutations,
        editorNodeConnected: editorNode.isConnected,
        editorNodeIsTheSessionsNode: editorSessionFor(host)?.view.dom === editorNode,
        outerColumnIsTheSameNode: outerColumn(host) === columnNode,
        mode: host.getAttribute('data-mode'),
      },
      'the external change re-rendered the document under the editor',
    ).toEqual({
      outerRootMutations: 0,
      editorNodeConnected: true,
      editorNodeIsTheSessionsNode: true,
      outerColumnIsTheSameNode: true,
      mode: 'edit',
    });
    expect(session.view.state.doc.toString(), 'the buffer is intact').toBe(DOC_V1);
    expect(outerColumn(host).textContent).not.toContain(ARRIVED_WHILE_EDITING);
    expect(readerSourceFor(host)).toBe(DOC_V1);
    record(`deferred: one external change in edit -> ${mutations} outer-root mutation record(s)`);

    // ── A CLEAN EXIT: nothing was typed, so there is nothing to lose ───────────────────────────
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'the buffer is clean').toBe(false);
    controlIn(host).click();
    await waitFor(
      () => outerColumn(host).textContent?.includes(ARRIVED_WHILE_EDITING),
      'the deferred text to reach the reading column after the exit',
      5000, // under the test timeout, so a flush that never comes reddens by this name
    );

    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(outerColumn(host).textContent).not.toContain(ON_DISK_AT_OPEN);
    expect(outerColumn(host).querySelector('h1'), 'a document, not a blank page').not.toBeNull();
    expect(readerSourceFor(host)).toBe(DOC_V2);
    expect(editorNode.isConnected, 'the editor is gone with the mode').toBe(false);
    // No comparison was open, so the comparison's "changed again" line is not said.
    expect(watchNote()).toBeNull();
    // The flush is an ordinary watch render: it captured the document it replaced.
    const captured = await snapshotTextsSettling(docId, snapshotsBefore + 1);
    expect(captured, 'the flush did not capture the outgoing document').toHaveLength(snapshotsBefore + 1);
    expect(captured).toContain(DOC_V1);

    await expectWatchRerenders(rig);
  });

  it('★ keeps the typed buffer: the editor, its text and its mode all survive the external change', async () => {
    const rig = await watched();
    const { host, fire } = rig;
    const session = await enterEdit(host);
    const editorNode = session.view.dom;

    session.view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    await userEvent.keyboard(TYPED);
    await waitFor(() => session.view.state.doc.toString().includes(TYPED), 'the typed text in the buffer');
    const typedBuffer = session.view.state.doc.toString();
    expect(typedBuffer).toBe(`${TYPED}${DOC_V1}`);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    fire(DOC_V2);
    await settle();

    // In the defect's own units: the editor's DOM, and the text that was typed into it.
    expect(
      {
        editorNodeConnected: editorNode.isConnected,
        mode: host.getAttribute('data-mode'),
        liveSessionBuffer: editorSessionFor(host)?.view.state.doc.toString() ?? null,
        typedTextOnScreen:
          host.shadowRoot!.querySelector('.cm-content')?.textContent?.includes(TYPED) ?? false,
      },
      'the external change destroyed the editor and the unsaved text in it',
    ).toEqual({
      editorNodeConnected: true,
      mode: 'edit',
      liveSessionBuffer: typedBuffer,
      typedTextOnScreen: true,
    });
    expect(outerColumn(host).textContent).not.toContain(ARRIVED_WHILE_EDITING);

    // ...and it is still an editor: the next key lands in the same buffer.
    await userEvent.keyboard('q');
    await waitFor(() => session.view.state.doc.length === typedBuffer.length + 1, 'one more key');
    expect(session.view.state.doc.toString()).toContain(TYPED);
    expect(isWatching()).toBe(true);
  });

  it('says and does nothing on a clean exit when nothing arrived: same column node, no line, no snapshot', async () => {
    const rig = await watched();
    const { host, docId } = rig;
    await enterEdit(host);
    const columnNode = outerColumn(host);
    const snapshotsBefore = (await snapshotTexts(docId)).length;

    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') === 'reading', 'the mode edit was entered from');
    await settle();

    expect(outerColumn(host), 'the document was not re-rendered').toBe(columnNode);
    expect(outerColumn(host).textContent).toContain(ON_DISK_AT_OPEN);
    expect(readerSourceFor(host)).toBe(DOC_V1);
    expect(watchNote()).toBeNull();
    expect(await snapshotTexts(docId)).toHaveLength(snapshotsBefore);

    await expectWatchRerenders(rig);
  });
});

// ════ 012 TASK 4.2 — THE "CHANGED ON DISK WHILE YOU WERE EDITING" HINT (D-8; ruling R6) ══════════
//
// While the controller holds an external change behind an edit session, the OUTER host carries
// `CHANGED_IN_EDIT_ATTR`. Nothing displays it at this task; 5.3 reads it.
//
// WHAT THE REAL ENGINE ADDS to `watchController.test.ts`'s state machine: that the attribute lands
// on the host the real edit control put into edit; that writing it costs the document nothing (the
// same outer-root instrument as above, still zero) and the editor nothing (same node, same buffer);
// and that the real exit — `exitEditMode` then the shell's teardown — takes it away again.
//
// BOTH DIRECTIONS, and the silent one is asserted rather than assumed: an edit session nothing
// arrives in never has the attribute written at all, counted on the host.
//
// RED-FIRST (recorded in progress.md's 4.2 record): with the set removed, "present" reds; with the
// flush's clear removed the attribute is still there after the exit, and with the teardown's clear
// removed it is still there after `stop()`.
//
// The exits here are CLEAN, or are not exits: the typed-buffer case ends by stopping the watch, in
// edit. A dirty exit is task 6.1's.

const record42 = (line: string): void => console.log(`[4.2][${ENGINE}] ${line}`);

const hinted = (host: HTMLElement): boolean => host.hasAttribute(CHANGED_IN_EDIT_ATTR);

/** Count writes of the hint attribute on the outer host — a delta, on this host alone. */
function watchHintWrites(host: HTMLElement): { count: () => number; stop: () => void } {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => void records.push(...batch));
  observer.observe(host, { attributes: true, attributeFilter: [CHANGED_IN_EDIT_ATTR] });
  return {
    count: () => {
      records.push(...observer.takeRecords());
      return records.length;
    },
    stop: () => observer.disconnect(),
  };
}

describe('012 task 4.2 — a change held during edit is marked on the outer host (D-8, R6)', () => {
  it('★ sets the hint, mutating nothing in the outer root and leaving the editor intact; the exit removes it and shows the on-disk text', async () => {
    const rig = await watched();
    const { host, docId, fire } = rig;
    const session = await enterEdit(host);
    const editorNode = session.view.dom;
    const snapshotsBefore = (await snapshotTexts(docId)).length;
    expect(hinted(host), 'in edit, nothing held yet').toBe(false);

    const outer = watchOuterRoot(host);
    const writes = watchHintWrites(host);
    const before = outer.count();
    const writesBefore = writes.count();

    fire(DOC_V2);
    await settle();

    const mutations = outer.count() - before;
    outer.stop();
    expect(
      {
        hint: hinted(host),
        hintValue: host.getAttribute(CHANGED_IN_EDIT_ATTR),
        hintWrites: writes.count() - writesBefore,
        outerRootMutations: mutations,
        editorNodeConnected: editorNode.isConnected,
        editorNodeIsTheSessionsNode: editorSessionFor(host)?.view.dom === editorNode,
        mode: host.getAttribute('data-mode'),
      },
      'an external change held during edit is not marked on the host',
    ).toEqual({
      hint: true,
      hintValue: '',
      hintWrites: 1,
      outerRootMutations: 0,
      editorNodeConnected: true,
      editorNodeIsTheSessionsNode: true,
      mode: 'edit',
    });
    expect(session.view.state.doc.toString(), 'the buffer is intact').toBe(DOC_V1);
    record42(`held: one external change in edit -> hint present, ${mutations} outer-root mutation record(s)`);

    // ── THE EXIT (clean): the flush ends the hold, so the hint goes with it ────────────────────
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR), 'the buffer is clean').toBe(false);
    controlIn(host).click();
    await waitFor(
      () => outerColumn(host).textContent?.includes(ARRIVED_WHILE_EDITING),
      'the held text to reach the reading column after the exit',
      5000,
    );

    expect(
      { hint: hinted(host), mode: host.getAttribute('data-mode') },
      'the hint outlived the change it was about',
    ).toEqual({ hint: false, mode: 'reading' });
    expect(writes.count() - writesBefore, 'one set, one removal').toBe(2);
    writes.stop();
    expect(outerColumn(host).textContent).not.toContain(ON_DISK_AT_OPEN);
    expect(readerSourceFor(host)).toBe(DOC_V2);
    expect(watchNote(), 'the flush is silent (R4)').toBeNull();
    record42('exit: the hint is gone and the on-disk text shows');
    expect(await snapshotTextsSettling(docId, snapshotsBefore + 1)).toHaveLength(snapshotsBefore + 1);

    await expectWatchRerenders(rig);
    expect(hinted(host), 'an ordinary watch render outside edit').toBe(false);
  });

  it('★ keeps the typed buffer byte-identical under the hint; stopping the watch removes it, and a restart on another host never carries it over', async () => {
    const rig = await watched();
    const { host, fire } = rig;
    const controller = controllers[controllers.length - 1];
    const session = await enterEdit(host);
    const editorNode = session.view.dom;

    session.view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    await userEvent.keyboard(TYPED);
    await waitFor(() => session.view.state.doc.toString().includes(TYPED), 'the typed text in the buffer');
    const typedBuffer = session.view.state.doc.toString();
    expect(typedBuffer).toBe(`${TYPED}${DOC_V1}`);
    expect(hinted(host), 'typing alone is not an external change').toBe(false);

    fire(DOC_V2);
    await settle();

    const held = {
      hint: hinted(host),
      editorNodeConnected: editorNode.isConnected,
      mode: host.getAttribute('data-mode'),
      dirty: host.getAttribute(EDITOR_DIRTY_ATTR),
      liveSessionBuffer: editorSessionFor(host)?.view.state.doc.toString() ?? null,
    };
    expect(held, 'the hint, with the unsaved buffer untouched beside it').toEqual({
      hint: true,
      editorNodeConnected: true,
      mode: 'edit',
      dirty: 'true',
      liveSessionBuffer: typedBuffer,
    });
    expect(outerColumn(host).textContent).not.toContain(ARRIVED_WHILE_EDITING);

    // ── THE WATCH STOPS, still in edit: the held text is dropped, so the hint is too ──────────
    controller.stop();
    expect(isWatching()).toBe(false);
    expect(
      {
        hint: hinted(host),
        mode: host.getAttribute('data-mode'),
        liveSessionBuffer: editorSessionFor(host)?.view.state.doc.toString() ?? null,
      },
      'a stopped watch left its hint on the host',
    ).toEqual({ hint: false, mode: 'edit', liveSessionBuffer: typedBuffer });
    record42('stop while held: the hint is gone, the editor and its typed text are not');

    // ── ...and the other half of a document switch: a start on a different host ───────────────
    const other = document.createElement('div');
    containers[containers.length - 1].appendChild(other);
    controller.start(other);
    await settle();
    expect({ first: hinted(host), second: hinted(other) }).toEqual({ first: false, second: false });
    expect(outerColumn(host).textContent, 'nothing was rendered into the first host').not.toContain(
      ARRIVED_WHILE_EDITING,
    );
  });

  it('never writes the hint when nothing arrives: in edit, across the exit, and on the watch render after it', async () => {
    const rig = await watched();
    const { host } = rig;
    const writes = watchHintWrites(host);
    const writesBefore = writes.count();

    await enterEdit(host);
    await settle();
    expect(hinted(host), 'in edit, nothing held').toBe(false);

    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') === 'reading', 'the mode edit was entered from');
    await settle();
    expect(hinted(host)).toBe(false);

    await expectWatchRerenders(rig); // non-vacuous: this watch is live, and it renders
    expect(hinted(host)).toBe(false);
    expect(writes.count() - writesBefore, 'the attribute was never written').toBe(0);
    writes.stop();
  });
});
