// The live preview, under real typing (012 task 3.3; D-4, D-5's mechanism) — Chromium AND Firefox.
//
// WHAT jsdom COULD NOT SAY, and this file does: that real keys typed into the editor come out in
// the NESTED host's rendered document and nowhere in the outer reading column; that keys keep
// landing in the buffer while a preview render waits; that a burst costs fewer renders than keys;
// that the preview stays where it was scrolled to; that the editor's own DOM survives its preview
// (D-4); that leaving edit with a render waiting renders nothing afterwards; that the reader's
// four enhancers run in the preview (3.4 — reported at 3.3, asserted since); and that the preview
// is drawn in the document's own ink, paper and type on both themes (the appearance proxies).
//
// ══ "PENDING" ═══════════════════════════════════════════════════════════════════════════════════
//
// `mount()` is synchronous, so a preview render is never in flight while a key is handled. A
// PENDING render is one waiting in the cooldown: scheduled, not yet committed. The cooldown lasts
// as long as the previous render took, so the tests that need one type into a document large
// enough that a render costs tens of milliseconds — longer than the gap between two driven keys.
//
// ══ THE TWO INSTRUMENTS ═════════════════════════════════════════════════════════════════════════
//
// COMMITS. Every `mount()` ends in one `replaceChildren` on its host's shadow root. While a test
// runs, `ShadowRoot.prototype.replaceChildren` is wrapped to record the calls made on a preview
// host (matched by class, then filtered to THIS test's own host element). It is installed before
// edit is entered, so the render at build is counted too — and named as such, never folded in.
//
// KEYSTROKES. The view's `dispatch` is wrapped on the instance, recording for each change to the
// document how many commits had been made before and after it. A key whose two numbers are equal
// rendered nothing itself: it went to the pending slot. Every test that reads this log asserts it
// is non-empty first — a wrapper CodeMirror did not route through would otherwise read as "no key
// ever rendered".
//
// ══ RED-FIRST (recorded in progress.md's 3.3 record) ════════════════════════════════════════════
//
//   scroll        — `EDITOR_CSS`'s preview pane made `overflow:hidden`, so the pane is no longer
//                   found by its computed overflow and resolution falls back to the nested host,
//                   which does not scroll: nothing is restored, the pane keeps its pixel position
//                   and the marker heading is pushed out of its bottom.
//   D-4           — the feed's render pointed at the OUTER host: the editor node is disconnected
//                   by the first key's render.
//   cancellation  — the session's cancel and the feed's fire-time check both removed: the text
//                   discarded by an exit appears in the next session's preview. Either one alone
//                   leaves this file green (each hides the other); each is seen red on its own in
//                   src/render/editorView.test.ts.
//   enhancers     — (3.4) `renderPreview`'s enhancer calls removed: the preview is back in P-1's
//                   measured state — no figure, no `<math>`, no wrapped or highlighted fence, no
//                   table toolbar — and the theme-flip test finds no diagram to re-theme.
//   containment   — (3.4) the guard around each enhancer removed: an enhancer that throws at
//                   build takes the edit view with it (edit mode is never entered).
//
// ══ EVERY TEST ASSERTS IT IS UNWATCHED (tasks.md, group 3's rule) ═══════════════════════════════
//
// ══ HARNESS-SHARED-STATE (AGENTS.md) ════════════════════════════════════════════════════════════
//
// Files run serially on one `document`. Commits are filtered to this test's own preview host and
// compared as deltas; the prototype wrapper and the viewport are restored after every test; errors
// are collected by listeners scoped to the test and matched by content.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { createReaderPane } from '../../src/app/readerPane';
import { readerSourceFor } from '../../src/render/readerMode';
import { toggleEdit } from '../../src/render/editorEnhancer';
import {
  EDITOR_PREVIEW_HOST_CLASS,
  editorSessionFor,
  editorShellFor,
  teardownEditorShell,
  type EditorSession,
  type EditorShell,
} from '../../src/render/editorView';
import { resolveScrollContainer } from '../../src/render/scrollContainer';
import { setThemeSetting } from '../../src/theme/reader';
import {
  getWatchTarget,
  isWatching,
  resetWatchRegistryForTest,
  watchAvailable,
} from '../../src/watch/watchRegistry';
import { WATCH_HOST_ATTR, resetWatchControlsForTest } from '../../src/watch/watchControl';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const record = (line: string): void => console.log(`[3.3][${ENGINE}] ${line}`);

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 };

const SMALL_DOC = 'Intro line.\n\n# Sample document\n\nBody text.\n\n## Second heading\n\nMore body.\n';

/** Large enough that one preview render costs tens of milliseconds on either engine. */
const BIG_DOC =
  'Intro line.\n\n' +
  Array.from(
    { length: 2400 },
    (_, i) => `## Section ${i}\n\nParagraph ${i} with **bold**, \`code\` and a [link](#s${i}).\n\n- one\n- two\n`,
  ).join('\n');

const MARKER_HEADING = 'Marker heading zqx';
const LONG_DOC =
  'Intro line.\n\n' +
  Array.from({ length: 90 }, (_, i) =>
    i === 55 ? `## ${MARKER_HEADING}\n\nMarked paragraph.` : `## Section ${i}\n\nParagraph ${i}.`,
  ).join('\n\n') +
  '\n';

const FENCE = '```';
const FIDELITY_DOC = [
  'Intro line.',
  '',
  `${FENCE}mermaid`,
  'graph TD',
  '  A --> B',
  FENCE,
  '',
  'Inline math $x^2$ here.',
  '',
  `${FENCE}js`,
  'const answer = 42;',
  FENCE,
  '',
  `${FENCE}javascript`,
  'const other = 7;',
  FENCE,
  '',
  '| name | count |',
  '| ---- | ----- |',
  '| beta | 2     |',
  '| alfa | 1     |',
  '',
].join('\n');

// ── The commit instrument ────────────────────────────────────────────────────────────────────

const commits: Element[] = [];
let restoreCommitSpy: (() => void) | null = null;

function spyOnPreviewCommits(): void {
  const original = ShadowRoot.prototype.replaceChildren;
  ShadowRoot.prototype.replaceChildren = function spied(this: ShadowRoot, ...nodes: (Node | string)[]) {
    if (this.host.classList.contains(EDITOR_PREVIEW_HOST_CLASS)) commits.push(this.host);
    return original.apply(this, nodes);
  };
  restoreCommitSpy = () => {
    ShadowRoot.prototype.replaceChildren = original;
  };
}

const commitsInto = (previewHost: Element): number => commits.filter((h) => h === previewHost).length;

const cleanup: HTMLElement[] = [];

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest(); // reset WITH the registry, always — see its doc comment
  commits.length = 0;
  spyOnPreviewCommits();
});

afterEach(async () => {
  restoreCommitSpy?.();
  restoreCommitSpy = null;
  for (const el of cleanup.splice(0)) {
    el.querySelectorAll<HTMLElement>('.peekover-app__reader__host').forEach(teardownEditorShell);
    el.remove();
  }
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  setThemeSetting('auto');
  vi.restoreAllMocks();
  await page.viewport(NARROW.width, NARROW.height);
});

/** Group 3's precondition, asserted — not assumed — on every fixture. */
function expectUnwatched(host: HTMLElement): void {
  expect(host.getAttribute(WATCH_HOST_ATTR), 'the host carries no active data-watch').not.toBe(
    'active',
  );
  expect(getWatchTarget(), 'no watch target is registered').toBeNull();
  expect(watchAvailable()).toBe(false);
  expect(isWatching()).toBe(false);
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

const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Production call site 1: the reader pane selects a file. Returns the mounted host. */
async function openInPane(text: string): Promise<HTMLElement> {
  const pane = createReaderPane(document);
  document.body.prepend(pane.element);
  cleanup.push(pane.element);
  await pane.select({ name: 'doc.md', read: async () => text });
  const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
  if (!host?.shadowRoot) throw new Error('the reader pane produced no mounted host');
  expectUnwatched(host);
  return host;
}

/** KEEPS: each test's own preview property (C171). RE-SPELLED at 4.3: edit is entered and left by
 *  `toggleEdit` — what the toolbar's Edit segment calls (D-6); this pane harness has no toolbar. */
const toggle = (host: HTMLElement): void => void toggleEdit(host);
/** The OUTER reading column — a direct child of the host's shadow root, never the preview's. */
const outerColumn = (host: HTMLElement): HTMLElement =>
  [...host.shadowRoot!.children].find((el) => el.classList.contains('peekover-reader')) as HTMLElement;
/** The PREVIEW's reading column, inside the nested host's own shadow root. */
const previewColumn = (shell: EditorShell): HTMLElement =>
  shell.previewHost.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;

interface Editing {
  host: HTMLElement;
  shell: EditorShell;
  session: EditorSession;
  view: EditorSession['view'];
}

/** Open through the pane, enter edit through the control, and put real focus in the editor with
 *  the caret at the very start of the document. */
async function edit(text: string): Promise<Editing> {
  const host = await openInPane(text);
  toggle(host);
  await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
  await frames();
  const session = editorSessionFor(host);
  const shell = editorShellFor(host);
  if (!session || !shell) throw new Error('entering edit left no live edit session');
  session.view.focus();
  await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
  expectUnwatched(host);
  return { host, shell, session, view: session.view };
}

const buffer = (e: Editing): string => e.view.state.doc.toString();

/** The preview has caught up: what the nested host last rendered IS the buffer. */
const settled = (e: Editing) => (): boolean => readerSourceFor(e.shell.previewHost) === buffer(e);

interface Keystroke {
  /** Commits into the preview host before this change was dispatched, and after. */
  before: number;
  after: number;
  /** How long the dispatch took — for a key that rendered at once, about what the render cost. */
  ms: number;
}

/** Wrap the view's `dispatch` to log every document change against the commit count. */
function logKeystrokes(e: Editing, onKey?: (log: Keystroke[]) => void): Keystroke[] {
  const log: Keystroke[] = [];
  const view = e.view as unknown as { dispatch: (...args: unknown[]) => void };
  const original = view.dispatch.bind(view);
  view.dispatch = (...args: unknown[]): void => {
    const doc = e.view.state.doc;
    const before = commitsInto(e.shell.previewHost);
    const t0 = performance.now();
    original(...args);
    if (e.view.state.doc === doc) return;
    log.push({ before, after: commitsInto(e.shell.previewHost), ms: performance.now() - t0 });
    onKey?.(log);
  };
  return log;
}

/** A key that rendered nothing itself — it went to the pending slot. */
const waited = (k: Keystroke): boolean => k.after === k.before;

/** Errors reaching the page while a test runs, and the feed's own failure log. */
function watchForErrors(): { errors: string[]; stop: () => void } {
  const errors: string[] = [];
  const onError = (ev: ErrorEvent): void => void errors.push(`error: ${ev.message}`);
  const onRejection = (ev: PromiseRejectionEvent): void => void errors.push(`rejection: ${String(ev.reason)}`);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  const warn = vi.spyOn(console, 'warn');
  return {
    errors,
    stop: () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      for (const call of warn.mock.calls) {
        if (String(call[0]).includes('[peekover]')) errors.push(`warn: ${call.map(String).join(' ')}`);
      }
      warn.mockRestore();
    },
  };
}

// ── Where the typed text goes ────────────────────────────────────────────────────────────────

describe('012 task 3.3 — typed text reaches the preview, and only the preview', () => {
  it('★ a typed marker appears in the nested host’s rendered output and nowhere in the outer reading column', async () => {
    const MARKER = 'zqxmarker7741';
    const e = await edit(SMALL_DOC);
    const atBuild = commitsInto(e.shell.previewHost);
    expect(previewColumn(e.shell).textContent, 'the preview does not hold the marker yet').not.toContain(MARKER);

    await userEvent.keyboard(MARKER);
    await waitFor(settled(e), 'the preview caught up with the buffer');

    expect(buffer(e)).toBe(`${MARKER}${SMALL_DOC}`);
    expect(previewColumn(e.shell).textContent).toContain(`${MARKER}Intro line.`);
    // Nowhere in the outer reading column — and the outer document is still the file as opened.
    expect(outerColumn(e.host).textContent).not.toContain(MARKER);
    expect(outerColumn(e.host).querySelector('h1')?.textContent).toBe('Sample document');
    expect(readerSourceFor(e.host)).toBe(SMALL_DOC);
    expect(e.host.shadowRoot!.querySelectorAll('.peekover-reader').length, 'one outer column').toBe(1);

    record(
      `marker: ${MARKER.length} keys -> ${commitsInto(e.shell.previewHost) - atBuild} feed render(s), ` +
        `after ${atBuild} at build`,
    );
    expectUnwatched(e.host);
  });

  it('★ D-4 under real typing: the editor’s own DOM survives every preview render', async () => {
    const MARKER = 'zqxsurvive';
    const e = await edit(SMALL_DOC);
    const editor = e.host.shadowRoot!.querySelector<HTMLElement>('.cm-editor')!;
    const atBuild = commitsInto(e.shell.previewHost);

    await userEvent.keyboard(MARKER);
    await sleep(150);

    // The defect's own units, first: routed at the outer host, the first key's render replaces
    // the outer shadow root's children and the editor with them.
    expect(editor.isConnected, 'the editor node was destroyed mid-typing').toBe(true);
    expect(e.host.shadowRoot!.querySelector('.cm-editor'), 'the same editor node').toBe(editor);
    expect(buffer(e), 'every key landed').toBe(`${MARKER}${SMALL_DOC}`);
    expect(e.host.getAttribute('data-mode')).toBe('edit');
    expect(editorSessionFor(e.host)).toBe(e.session);
    await waitFor(settled(e), 'the preview caught up with the buffer');
    // Firing control: renders really happened while the editor stood.
    expect(commitsInto(e.shell.previewHost) - atBuild).toBeGreaterThan(0);
    expectUnwatched(e.host);
  });
});

// ── Responsiveness and coalescing ────────────────────────────────────────────────────────────

describe('012 task 3.3 — keys land while a render waits; a burst costs fewer renders than keys', () => {
  it('★ a keystroke lands in the buffer while a preview render is pending in the cooldown', async () => {
    const KEYS = 'qzxwvkjh';
    const e = await edit(BIG_DOC);
    const atBuild = commitsInto(e.shell.previewHost);
    const log = logKeystrokes(e);

    await userEvent.keyboard(KEYS);

    expect(log.length, 'the instrument saw every key').toBe(KEYS.length);
    expect(buffer(e), 'every key is in the buffer').toBe(`${KEYS}${BIG_DOC}`);
    // RE-SPELLED AT 6.4 (human ruling R26, spec §8-2). This was "The first key renders at once":
    // `expect(log[0].after - log[0].before, 'the first key rendered immediately').toBe(1)`. R26
    // moves that render out of the keystroke into a 0 ms task, so the first key — like every
    // other — commits NOTHING inside its own dispatch. Asserted for every key, the first by name.
    expect(log[0].after - log[0].before, 'R26: the first key rendered nothing inside its own dispatch').toBe(0);
    expect(log.filter((k) => !waited(k)), 'R26: no key renders inside its own dispatch').toEqual([]);
    // Two consecutive keys that rendered nothing: the first scheduled a render, and the second
    // landed in the buffer while that render was still waiting.
    const pair = log.findIndex((k, i) => i > 0 && waited(k) && waited(log[i - 1]) && k.before === log[i - 1].after);
    expect(pair, `no key landed behind a pending render: ${JSON.stringify(log)}`).toBeGreaterThan(0);
    // And that pending render did commit, carrying the buffer as it finally stood.
    await waitFor(settled(e), 'the pending render committed');
    expect(commitsInto(e.shell.previewHost)).toBeGreaterThan(log[pair].after);
    expect(previewColumn(e.shell).textContent).toContain(`${KEYS}Intro line.`);

    record(
      `responsiveness: first key's dispatch (no render in it, R26) took ${log[0].ms.toFixed(1)} ms; ` +
        `${log.filter(waited).length} of ${log.length} keys landed while a render was pending; ` +
        `slowest waiting key ${Math.max(...log.filter(waited).map((k) => k.ms)).toFixed(1)} ms; ` +
        `${atBuild} render at build`,
    );
    expectUnwatched(e.host);
  });

  it('★ a burst coalesces: feed renders strictly below keystrokes, the build render counted apart', async () => {
    const KEYS = 'qzxwvkjhgfdsmnbp';
    const e = await edit(BIG_DOC);
    // Counted explicitly: entering edit rendered the preview once, before any key.
    const atBuild = commitsInto(e.shell.previewHost);
    expect(atBuild, 'the render at build').toBe(1);
    const log = logKeystrokes(e);

    await userEvent.keyboard(KEYS);
    await waitFor(settled(e), 'the preview caught up with the buffer');
    await sleep(200); // nothing further is owed

    const feedRenders = commitsInto(e.shell.previewHost) - atBuild;
    expect(log.length).toBe(KEYS.length);
    expect(feedRenders).toBeGreaterThan(0);
    expect(feedRenders, 'renders strictly below keystrokes').toBeLessThan(KEYS.length);
    expect(readerSourceFor(e.shell.previewHost), 'the last render carried the newest text').toBe(
      `${KEYS}${BIG_DOC}`,
    );
    record(`coalescing: ${KEYS.length} keys -> ${feedRenders} feed render(s) (+${atBuild} at build)`);
    expectUnwatched(e.host);
  });
});

// ── Scroll ───────────────────────────────────────────────────────────────────────────────────

describe('012 task 3.3 — the preview keeps its place under real typing', () => {
  const markerIn = (shell: EditorShell): HTMLElement =>
    [...previewColumn(shell).querySelectorAll<HTMLElement>('h2')].find(
      (h) => h.textContent === MARKER_HEADING,
    )!;
  /** The marker heading's top, measured from the top of the preview pane. */
  const markerOffset = (shell: EditorShell): number =>
    markerIn(shell).getBoundingClientRect().top - shell.preview.getBoundingClientRect().top;

  it(`★ WIDE ${WIDE.width}x${WIDE.height}: scrolled to a marker, then typing above it, the marker is still in view`, async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const e = await edit(LONG_DOC);
    const pane = e.shell.preview;

    pane.scrollTop = markerOffset(e.shell) + pane.scrollTop + 8; // the marker just above the top edge
    await frames();
    const before = markerOffset(e.shell);
    expect(pane.scrollTop, 'firing control: the pane really scrolled').toBeGreaterThan(1000);
    expect(before).toBeGreaterThan(-12);
    expect(before).toBeLessThan(0);
    const scrolledTo = pane.scrollTop;
    const heightBefore = pane.scrollHeight;
    const atBuild = commitsInto(e.shell.previewHost);

    // Sixteen paragraphs typed ABOVE the marker — taller, together, than the pane itself, so a
    // pane that only kept its pixel position would have the marker pushed out of its bottom.
    await userEvent.keyboard('zqx typed above{Enter}{Enter}'.repeat(16));
    await waitFor(settled(e), 'the preview caught up with the buffer');
    await frames();

    // The defect's own units, first: where the marker is, measured from the pane's top.
    const after = markerOffset(e.shell);
    expect(after, 'the marker left the view').toBeGreaterThan(-markerIn(e.shell).offsetHeight);
    expect(after, 'the marker left the view').toBeLessThan(pane.clientHeight);
    // It sits where it sat. The restore runs once per render and each lands on a whole or
    // fractional pixel as the engine has it; 4 px is the allowance for that over a whole burst.
    expect(Math.abs(after - before), 'the marker moved within the pane').toBeLessThanOrEqual(4);
    // FIRING CONTROL: more was inserted above the marker than the pane is tall — so "still in
    // view" is not a pane that simply had room for it.
    const feedRenders = commitsInto(e.shell.previewHost) - atBuild;
    expect(pane.scrollHeight - heightBefore).toBeGreaterThan(pane.clientHeight);
    expect(previewColumn(e.shell).textContent).toContain('zqx typed above');
    expect(feedRenders).toBeGreaterThan(0);
    expect(pane.scrollTop).toBeGreaterThan(scrolledTo);
    expect(resolveScrollContainer(e.shell.previewHost, true)).toBe(pane);

    record(
      `scroll: marker ${before.toFixed(1)} px -> ${after.toFixed(1)} px from the pane's top across ` +
        `${feedRenders} feed render(s); scrollTop ${scrolledTo.toFixed(0)} -> ${pane.scrollTop.toFixed(0)}; ` +
        `content grew ${pane.scrollHeight - heightBefore} px in a ${pane.clientHeight} px pane`,
    );
    expectUnwatched(e.host);
  });
});

// ── Exit while a render is pending ───────────────────────────────────────────────────────────

describe('012 task 3.3 — leaving edit with a render pending', () => {
  /** Type until two keys in a row are waiting behind a render, then leave edit in that state —
   *  from inside the page, before the timer can fire. Resolves once the exit has run. */
  async function exitWhilePending(e: Editing, andThen?: () => void): Promise<{ commitsAtExit: number; owed: boolean }> {
    const state = { commitsAtExit: -1, owed: false, left: false };
    logKeystrokes(e, (log) => {
      const n = log.length;
      if (state.left || n < 2 || !waited(log[n - 1]) || !waited(log[n - 2])) return;
      state.left = true;
      queueMicrotask(() => {
        // A render is owed at this instant: the buffer is ahead of what the preview last drew.
        state.owed = readerSourceFor(e.shell.previewHost) !== buffer(e);
        state.commitsAtExit = commitsInto(e.shell.previewHost);
        toggle(e.host);
        andThen?.();
      });
    });
    await userEvent.keyboard('qzx');
    await waitFor(() => state.left && state.commitsAtExit >= 0, 'edit was left with a render pending');
    return state;
  }

  it('★ no render lands in the torn-down shell, and nothing errors', async () => {
    const e = await edit(BIG_DOC);
    const watching = watchForErrors();

    const { commitsAtExit, owed } = await exitWhilePending(e);
    expect(owed, 'a render really was pending at the exit').toBe(true);
    expect(e.host.getAttribute('data-mode')).toBe('reading');
    await sleep(700); // far longer than the cooldown that was running
    await frames();
    watching.stop();

    expect(commitsInto(e.shell.previewHost), 'a render after the exit').toBe(commitsAtExit);
    expect(watching.errors).toEqual([]);
    expect(e.shell.previewHost.isConnected).toBe(false);
    expect(e.host.shadowRoot!.querySelector('.cm-editor')).toBeNull();
    expect(editorSessionFor(e.host)).toBeUndefined();
    expect(outerColumn(e.host).textContent, 'the document, not the buffer').not.toContain('qzxIntro');
    record(`exit while pending: ${commitsAtExit} commit(s) at the exit, ${commitsInto(e.shell.previewHost)} after 700 ms`);
    expectUnwatched(e.host);
  });

  it('★ re-entering at once: the text the exit discarded never reaches the new session’s preview', async () => {
    const e = await edit(BIG_DOC);
    const watching = watchForErrors();

    // Out and straight back in, in the same task: the old session's timer is still due.
    const { owed } = await exitWhilePending(e, () => toggle(e.host));
    expect(owed, 'a render really was pending at the exit').toBe(true);
    await waitFor(() => e.host.getAttribute('data-mode') === 'edit', 'edit re-entered');
    const next = editorShellFor(e.host)!;
    expect(next.previewHost, 'a new shell').not.toBe(e.shell.previewHost);
    await sleep(700);
    await frames();
    watching.stop();

    // The defect's own units, first: the discarded text, in the new session's preview.
    expect(previewColumn(next).textContent?.slice(0, 40), 'the discarded text was rendered').not.toContain('qz');
    expect(readerSourceFor(next.previewHost)).toBe(BIG_DOC);
    expect(editorSessionFor(e.host)!.view.state.doc.toString()).toBe(BIG_DOC);
    expect(commitsInto(next.previewHost), 'the new preview: its render at build, and no other').toBe(1);
    expect(watching.errors).toEqual([]);
    expectUnwatched(e.host);
  });
});

// ── The preview's enhancers — ASSERTED (3.4; R7, R10) ────────────────────────────────────────
//
// At 3.3 this block REPORTED finding P-1: the reader's enhancers ran on the outer host only, so
// the preview held the raw mermaid fence, the literal formula and an un-highlighted block. The
// human ruled the preview runs them (R7), tables included (R10), and 3.4 built it — so the same
// census is now ASSERTED: the nested host's column holds exactly what the reader's own column
// holds for the same document, at build and again after a keystroke has rebuilt it.

describe('012 task 3.4 — the reader’s four enhancers run in the preview (P-1; R7, R10)', () => {
  /** What a reading column holds for each of the four enhanced kinds. */
  const census = (column: Element): Record<string, number> => ({
    mermaidSource: column.querySelectorAll('pre > code.language-mermaid').length,
    diagramFigure: column.querySelectorAll('.peekover-diagram').length,
    diagramSvg: column.querySelectorAll('.peekover-diagram svg').length,
    mathInlineSource: column.querySelectorAll('code.peekover-math-inline').length,
    mathRendered: column.querySelectorAll('math').length,
    jsSource: column.querySelectorAll('pre > code.language-js').length,
    javascriptSource: column.querySelectorAll('pre > code.language-javascript').length,
    codeWrapper: column.querySelectorAll('.peekover-code').length,
    codeHighlighted: column.querySelectorAll('.peekover-code pre.shiki').length,
    table: column.querySelectorAll('table').length,
    tableToolbar: column.querySelectorAll('.peekover-table-tools').length,
  });
  const codeStates = (column: Element): string[] =>
    [...column.querySelectorAll('.peekover-code')].map((el) => el.getAttribute('data-code') ?? 'none');
  /** The four finished states: a diagram's SVG, a formula, a highlighted fence, a table toolbar. */
  const finished = (column: Element): boolean => {
    const c = census(column);
    return c.diagramSvg > 0 && c.mathRendered > 0 && c.codeHighlighted > 0 && c.tableToolbar > 0;
  };
  /** Give the lazy engines time, and NEVER throw: a column that stays un-enhanced is then read by
   *  the assertions below in its own units, not reported as a timeout. */
  const lazyEnginesSettle = async (column: () => Element, ms = 45000): Promise<void> => {
    const until = performance.now() + ms;
    while (!finished(column()) && performance.now() < until) await sleep(50);
  };

  async function enterEdit(host: HTMLElement): Promise<Editing> {
    toggle(host);
    await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
    const session = editorSessionFor(host)!;
    const shell = editorShellFor(host)!;
    return { host, shell, session, view: session.view };
  }

  // TWO code fences. `js` is what the task names; it is not a key the highlighter knows, so the
  // OUTER reader leaves it un-highlighted too (state `failed`). `javascript` is, and is the code
  // row's firing control.
  it('★ a mermaid fence, inline math, two code fences and a table: enhanced in the preview at build, and again after a keystroke', async () => {
    const host = await openInPane(FIDELITY_DOC);
    const outer = outerColumn(host);
    // FIRING CONTROL: on the outer host — where the two call sites run them — all four render.
    await waitFor(() => outer.querySelector('.peekover-diagram svg'), 'the outer diagram rendered', 60000);
    await waitFor(() => outer.querySelector('math'), 'the outer formula rendered', 60000);
    await waitFor(() => outer.querySelector('.peekover-code pre.shiki'), 'the outer javascript fence was highlighted', 60000);
    const outerCensus = census(outer);
    record(`enhancers — outer code fence state(s): ${JSON.stringify(codeStates(outer))}`);

    const e = await enterEdit(host);
    const { shell, session } = e;
    await lazyEnginesSettle(() => previewColumn(shell));
    const builtColumn = previewColumn(shell);
    const atBuild = census(builtColumn);

    session.view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    await userEvent.keyboard('z');
    await waitFor(settled(e), 'the preview caught up with the buffer');
    // The key's render REPLACED the nested root's children: what is enhanced below is a NEW
    // column, so "still enhanced" cannot be the build's work surviving.
    expect(previewColumn(shell), 'the keystroke re-rendered the preview').not.toBe(builtColumn);
    await lazyEnginesSettle(() => previewColumn(shell));
    const afterTyping = census(previewColumn(shell));

    record(`enhancers — outer document:      ${JSON.stringify(outerCensus)}`);
    record(`enhancers — preview at build:    ${JSON.stringify(atBuild)}`);
    record(`enhancers — preview after a key: ${JSON.stringify(afterTyping)}`);
    record(
      `enhancers — the preview's inline math reads ${JSON.stringify(
        previewColumn(shell).querySelector('code.peekover-math-inline')?.textContent ?? null,
      )}; its mermaid fence reads ${JSON.stringify(
        previewColumn(shell).querySelector('pre > code.language-mermaid')?.textContent ?? null,
      )}; its code fence state(s): ${JSON.stringify(codeStates(previewColumn(shell)))}`,
    );

    expect(outerCensus.diagramSvg, 'outer diagram').toBeGreaterThan(0);
    expect(outerCensus.mathRendered, 'outer formula').toBeGreaterThan(0);
    expect(outerCensus.codeWrapper, 'outer code fences, wrapped by their enhancer').toBe(2);
    expect(outerCensus.codeHighlighted, 'outer highlighted fence').toBeGreaterThan(0);
    expect(outerCensus.tableToolbar, 'outer table toolbar').toBe(1);
    // The preview holds the three SOURCE elements the enhancers look for — so the rows below are
    // read off a column that has something to render, not an empty one.
    expect(afterTyping.mermaidSource + afterTyping.diagramFigure).toBeGreaterThan(0);
    expect(afterTyping.mathInlineSource + afterTyping.mathRendered).toBeGreaterThan(0);
    expect(afterTyping.jsSource + afterTyping.javascriptSource + afterTyping.codeWrapper).toBeGreaterThan(0);

    // P-1, AS ASSERTIONS — each of the four, named, at build and after the key.
    for (const [when, seen] of [['at build', atBuild], ['after a key', afterTyping]] as const) {
      expect(seen.diagramFigure, `${when}: the mermaid fence has its figure`).toBe(1);
      expect(seen.diagramSvg, `${when}: the figure holds an SVG`).toBe(1);
      expect(seen.mathRendered, `${when}: $x^2$ is a <math> element`).toBeGreaterThan(0);
      expect(seen.codeWrapper, `${when}: both code fences are wrapped`).toBe(2);
      expect(seen.codeHighlighted, `${when}: the javascript fence is highlighted`).toBe(1);
      expect(seen.tableToolbar, `${when}: the table has its toolbar`).toBe(1);
      // And, taken whole, the preview holds what the reader holds for this document.
      expect(seen, `${when}: the preview's census equals the outer document's`).toEqual(outerCensus);
    }
    expect(codeStates(previewColumn(shell)).sort()).toEqual(codeStates(outer).sort());
    expectUnwatched(host);
  }, 300000);

  it('★ a theme flip WHILE editing re-themes the preview’s diagram, each way', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    setThemeSetting('light');
    const host = await openInPane(FIDELITY_DOC);
    const e = await enterEdit(host);
    e.view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    await userEvent.keyboard('z'); // a feed render has happened: this is the live preview's diagram
    await waitFor(settled(e), 'the preview caught up with the buffer');

    const figure = (): HTMLElement | null => previewColumn(e.shell).querySelector<HTMLElement>('.peekover-diagram');
    const drawnAt = (theme: string) => (): boolean =>
      figure()?.getAttribute('data-diagram-theme') === theme && figure()!.querySelector('svg') !== null;
    await waitFor(drawnAt('light'), 'the preview diagram is drawn, light', 60000);
    const lightSvg = figure()!.querySelector('svg')!.outerHTML;

    setThemeSetting('dark');
    await waitFor(drawnAt('dark'), 'the preview diagram re-themed to dark', 60000);
    const darkSvg = figure()!.querySelector('svg')!.outerHTML;
    expect(darkSvg, 'the dark diagram is a different drawing, not a relabelled one').not.toBe(lightSvg);
    record(`theme flip while editing: the preview diagram is ${figure()!.getAttribute('data-diagram-theme')} (svg ${lightSvg.length} -> ${darkSvg.length} chars)`);
    // FIRING CONTROL: the outer document's diagram took the same flip.
    await waitFor(
      () => outerColumn(host).querySelector('.peekover-diagram')?.getAttribute('data-diagram-theme') === 'dark',
      'the outer diagram re-themed to dark',
      60000,
    );

    // A diagram drawn by the NEXT feed render is born in the theme now in force.
    const before = previewColumn(e.shell);
    await userEvent.keyboard('k');
    await waitFor(settled(e), 'the preview caught up with the buffer');
    expect(previewColumn(e.shell)).not.toBe(before);
    await waitFor(drawnAt('dark'), 'the re-rendered preview diagram is drawn dark', 60000);

    setThemeSetting('light');
    await waitFor(drawnAt('light'), 'the preview diagram re-themed back to light', 60000);
    expect(buffer(e), 'the buffer rode through both flips').toBe(`zk${FIDELITY_DOC}`);
    expectUnwatched(host);
  }, 300000);

  it('★ an enhancer that throws costs neither the edit view nor the buffer — at build or under typing — and the next enhancer still runs', async () => {
    // No production seam: `querySelectorAll` on a PREVIEW host's shadow root is made to throw. The
    // diagram, math and code enhancers all open with it; `mount()` never calls it on the root, and
    // the table enhancer reaches its tables through the column — so three enhancers fail, the
    // render itself does not, and the fourth has work it can still do.
    const original = ShadowRoot.prototype.querySelectorAll;
    let forced = 0;
    ShadowRoot.prototype.querySelectorAll = function failing(this: ShadowRoot, selectors: string) {
      if (this.host.classList.contains(EDITOR_PREVIEW_HOST_CLASS)) {
        forced += 1;
        throw new Error('forced enhancer failure (3.4)');
      }
      return original.call(this, selectors);
    } as typeof original;
    const watch = watchForErrors();
    let host: HTMLElement;
    try {
      host = await openInPane(FIDELITY_DOC);
      toggle(host);
      // Bounded, and not a throw: when the build is lost, the assertion below says so.
      for (let i = 0; i < 250 && host.getAttribute('data-mode') !== 'edit'; i += 1) await sleep(20);
      expect(forced, 'the instrument fired during the build').toBeGreaterThan(0);
      expect(host.getAttribute('data-mode'), 'an enhancer failure at build cost the edit view').toBe('edit');

      const session = editorSessionFor(host)!;
      const shell = editorShellFor(host)!;
      const e: Editing = { host, shell, session, view: session.view };
      expect(
        previewColumn(shell).querySelectorAll('.peekover-table-tools').length,
        'at build: the table enhancer ran after the three that threw',
      ).toBe(1);

      const atBuild = forced;
      session.view.focus();
      await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
      await userEvent.keyboard('zqx');
      await waitFor(settled(e), 'the preview caught up with the buffer');
      expect(forced, 'the instrument fired again under typing').toBeGreaterThan(atBuild);
      expect(buffer(e), 'the buffer is exactly what was typed').toBe(`zqx${FIDELITY_DOC}`);
      expect(e.view.dom.isConnected, 'the editor node is still in the document').toBe(true);
      expect(previewColumn(shell).textContent, 'the preview shows the typed text').toContain('zqxIntro line.');
      expect(
        previewColumn(shell).querySelectorAll('.peekover-table-tools').length,
        'after a key: the table enhancer ran after the three that threw',
      ).toBe(1);
      expectUnwatched(host);
    } finally {
      ShadowRoot.prototype.querySelectorAll = original;
      watch.stop();
    }
    // Each failure is LOGGED, by name — and none reached the page, nor was mistaken for a failed
    // render (which would have skipped every enhancer after the first).
    const logged = watch.errors.filter((line) => line.includes('preview enhancement failed'));
    expect(logged.length, 'three enhancers failed at build and three more per render').toBeGreaterThanOrEqual(6);
    expect(watch.errors.filter((line) => !line.includes('preview enhancement failed'))).toEqual([]);
  }, 120000);
});

// ── Appearance proxies ───────────────────────────────────────────────────────────────────────

describe('012 task 3.3 — appearance proxies: the preview is drawn in the document’s own ink, paper and type', () => {
  /** The first painted background at or above `el`, crossing shadow boundaries upward. */
  function paperBehind(el: Element): string {
    let node: Node | null = el;
    while (node) {
      if (node instanceof Element) {
        const bg = getComputedStyle(node).backgroundColor;
        const alpha = /^rgba\(.*,\s*([\d.]+)\)$/.exec(bg);
        if (bg !== 'transparent' && !(alpha && Number(alpha[1]) === 0)) return bg;
      }
      node = node.parentNode ?? (node as ShadowRoot).host ?? null;
    }
    return 'none';
  }

  interface Look {
    ink: string;
    paper: string;
    font: string;
  }
  const lookOf = (column: Element): Look => ({
    ink: getComputedStyle(column).color,
    paper: paperBehind(column),
    font: getComputedStyle(column).fontFamily,
  });
  const pair = (e: Editing): { outer: Look; preview: Look } => ({
    outer: lookOf(outerColumn(e.host)),
    preview: lookOf(previewColumn(e.shell)),
  });

  it('★ under light and under dark, the preview column’s ink, paper and font-family equal the outer column’s', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    const seen: Record<string, Look> = {};
    for (const theme of ['light', 'dark'] as const) {
      setThemeSetting(theme);
      const e = await edit(SMALL_DOC);
      await frames();
      expect(e.host.getAttribute('data-theme')).toBe(theme);
      expect(e.shell.previewHost.getAttribute('data-theme')).toBe(theme);

      const { outer, preview } = pair(e);
      record(`appearance ${theme}: outer ${JSON.stringify(outer)} | preview ${JSON.stringify(preview)}`);
      expect(preview, `${theme}: the preview's look`).toEqual(outer);
      seen[theme] = preview;
      expectUnwatched(e.host);
    }
    // FIRING CONTROL: the instrument tells the two themes apart.
    expect(seen.dark.ink).not.toBe(seen.light.ink);
    expect(seen.dark.paper).not.toBe(seen.light.paper);
  });

  it('★ a theme flip WHILE editing re-themes the preview, each way', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    setThemeSetting('light');
    const e = await edit(SMALL_DOC);
    await userEvent.keyboard('zqx'); // a feed render has happened: this is the live preview
    await waitFor(settled(e), 'the preview caught up with the buffer');
    const light = pair(e);
    expect(light.preview).toEqual(light.outer);

    setThemeSetting('dark');
    await frames();
    const dark = pair(e);
    record(`theme flip light -> dark while editing: outer ${JSON.stringify(dark.outer)} | preview ${JSON.stringify(dark.preview)}`);
    expect(dark.preview, 'the preview after the flip to dark').toEqual(dark.outer);
    expect(dark.preview.ink).not.toBe(light.preview.ink);
    expect(dark.preview.paper).not.toBe(light.preview.paper);

    // And it holds across the next feed render, which rebuilds the nested root.
    await userEvent.keyboard('k');
    await waitFor(settled(e), 'the preview caught up with the buffer');
    expect(pair(e).preview).toEqual(dark.outer);

    setThemeSetting('light');
    await frames();
    const back = pair(e);
    record(`theme flip dark -> light while editing: outer ${JSON.stringify(back.outer)} | preview ${JSON.stringify(back.preview)}`);
    expect(back.preview).toEqual(back.outer);
    expect(back.preview).toEqual(light.preview);
    expect(buffer(e), 'the buffer rode through both flips').toBe(`zqxk${SMALL_DOC}`);
    expectUnwatched(e.host);
  });
});
