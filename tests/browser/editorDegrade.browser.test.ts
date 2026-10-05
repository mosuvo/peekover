// The editor's degrade path (012 task 3.2; spec §3.7 — "CodeMirror cannot load") — Chromium AND
// Firefox. Task 3.3 adds the preview-failure degrade to this file (its own block, at the end).
//
// THE PROPERTY. If the engine cannot be loaded, the document stays in the mode it was in, no editor
// node exists anywhere, the reading column is still ON SCREEN, and the control says the editor is
// unavailable in text. Never 'edit' with nothing behind it — in edit the reading column and the
// raw view are both hidden, so a mode flipped ahead of a failed load is a blank page.
//
// RED-FIRST (recorded in progress.md's 3.2 record). The defect is the tidy-looking version: flip
// the mode on click, load after, swallow a failed load. With `editorEnhancer.ts` ablated to that,
// the first assertion of each ★ test below reads 'edit' where it expects the prior mode, and the
// on-screen check finds the document gone. The half-mounted state is asserted in those units, and
// the mode assertion comes first — it is the one that shows the defect.
//
// TWO KINDS OF FAILING LOADER. A loader that simply rejects, and a REAL failed module fetch — a
// dynamic `import()` of a URL the server does not have — so the rejection that reaches
// `enterEditMode` is the engine's own, not one this file manufactured.
//
// UNWATCHED (tasks.md, group 3's rule): every fixture asserts it — see `expectUnwatched`.
//
// HARNESS-SHARED-STATE (AGENTS.md): nothing here counts listeners or assumes a pristine page.
// Loader calls are counted on a spy this file owns; the network observation uses an observer
// scoped to the operation, with a firing control, never the shared Resource Timing buffer.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { loadCodeMirror, type EditorModuleLoader } from '../../src/render/editorEngine';
import { EDIT_CONTROL_CLASS, enhanceEditor } from '../../src/render/editorEnhancer';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_SHELL_CLASS,
  editorSessionFor,
  editorShellFor,
  teardownEditorShell,
  type EditorSession,
  type EditorShell,
} from '../../src/render/editorView';
import {
  getWatchTarget,
  isWatching,
  resetWatchRegistryForTest,
  watchAvailable,
} from '../../src/watch/watchRegistry';
import { WATCH_HOST_ATTR, resetWatchControlsForTest } from '../../src/watch/watchControl';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
const record = (line: string): void => console.log(`[3.2][${ENGINE}] ${line}`);

const DOC = '# Degrade\n\nBody text.\n\n## Second heading\n\nMore body.\n';

const hosts: HTMLElement[] = [];

beforeEach(() => {
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
});

afterEach(() => {
  for (const host of hosts.splice(0)) {
    teardownEditorShell(host);
    host.remove();
  }
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  vi.restoreAllMocks();
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

/** The app-page host shape, mounted the way `readerPane.ts` mounts it, with an injected loader. */
function mountWith(loader: EditorModuleLoader): HTMLElement {
  const host = document.createElement('div');
  host.style.display = 'block';
  document.body.prepend(host);
  hosts.push(host);
  mount(DOC, host, { contained: true });
  enhanceEditor(host, { loader });
  expectUnwatched(host);
  return host;
}

async function waitFor<T>(fn: () => T | null | undefined | false, what: string, ms = 15000): Promise<T> {
  const until = performance.now() + ms;
  for (;;) {
    const value = fn();
    if (value) return value as T;
    if (performance.now() > until) throw new Error(`waitFor timed out: ${what}`);
    await new Promise<void>((r) => setTimeout(r, 20));
  }
}

const controlIn = (host: HTMLElement): HTMLElement =>
  host.shadowRoot!.querySelector<HTMLElement>(`.${EDIT_CONTROL_CLASS}`)!;

const onScreen = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

/** A module URL the server does not have — a real failed chunk fetch, fresh per call. */
let missingSeq = 0;
const missingModuleUrl = (): string =>
  `${location.origin}/peekover-3-2-missing-chunk-${Date.now()}-${(missingSeq += 1)}.js`;

/** Activate the control and wait until the attempt has settled, one way or the other. */
async function activateAndSettle(host: HTMLElement, loader: ReturnType<typeof vi.fn>): Promise<void> {
  const calls = loader.mock.calls.length;
  controlIn(host).click();
  await waitFor(() => loader.mock.calls.length > calls, 'the loader was called');
  await Promise.allSettled(loader.mock.results.map((r) => r.value as Promise<unknown>));
  // Let the rejection travel through enterEditMode to the control's handler.
  await new Promise<void>((r) => setTimeout(r, 50));
}

/** Everything the degrade must leave true. The mode comes FIRST: it is the defect's signature. */
function expectDegraded(host: HTMLElement, priorMode: string, before: Element[]): void {
  const shadow = host.shadowRoot!;
  expect(host.getAttribute('data-mode'), 'the document is still in its prior mode').toBe(priorMode);
  const shown = priorMode === 'raw' ? 'peekover-raw' : 'peekover-reader';
  const view = [...shadow.children].find((el) => el.classList.contains(shown)) as HTMLElement;
  expect(getComputedStyle(view).display, 'the document is still displayed').not.toBe('none');
  expect(onScreen(view), 'the document is still on screen — never a blank page').toBe(true);
  expect(shadow.querySelector(`.${EDITOR_SHELL_CLASS}`), 'no edit shell').toBeNull();
  expect(shadow.querySelector('.cm-editor'), 'no editor node').toBeNull();
  expect([...shadow.children], 'the shadow root holds exactly what it held').toEqual(before);
  expect(editorSessionFor(host)).toBeUndefined();
  expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  // The control reports it, in TEXT and in its accessible name.
  const control = controlIn(host);
  expect(control.textContent).toBe('Editor unavailable');
  expect(control.getAttribute('aria-label')).toBe(
    'The editor could not be loaded. Activate to try again.',
  );
  expect(onScreen(control)).toBe(true);
}

// ── FIRST IN THE FILE, ON PURPOSE ────────────────────────────────────────────────────────────
//
// This is the first browser file to load the REAL engine (the two editor files before it in run
// order inject stub loaders), so the first call below is the page's first `import()` of the
// engine's specifiers and the repeat is a true repeat. Moved lower, "first" would just mean
// "first in this test".

/** Collect resource-timing entries observed while `fn` runs — from an observer, not the shared
 *  buffer, which is size-capped and may be full by the time this file runs. */
async function resourcesDuring(fn: () => Promise<void>): Promise<string[]> {
  const names: string[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) names.push(entry.name);
  });
  observer.observe({ type: 'resource' });
  try {
    await fn();
    await new Promise<void>((r) => setTimeout(r, 150)); // entries are delivered asynchronously
  } finally {
    for (const entry of observer.takeRecords()) names.push(entry.name);
    observer.disconnect();
  }
  return names;
}

describe('012 task 3.2 — OBSERVED, not asserted: does a second import() of the engine re-fetch?', () => {
  it('OBSERVED, not asserted: a second import() of the engine’s specifiers fetches nothing', async () => {
    // FIRING CONTROL for the instrument: a real fetch IS seen by this observer.
    const probe = `${location.origin}/peekover-3-2-probe-${Date.now()}`;
    const seen = await resourcesDuring(async () => {
      await fetch(probe).catch(() => undefined);
    });
    expect(seen.some((name) => name.startsWith(probe)), 'the observer sees a real fetch').toBe(true);

    const isEngine = (name: string): boolean => /codemirror|lezer|lang-markdown/i.test(name);
    const first = (await resourcesDuring(async () => void (await loadCodeMirror()))).filter(isEngine);
    const second = (await resourcesDuring(async () => void (await loadCodeMirror()))).filter(isEngine);
    record(
      `import() re-fetch (vite dev harness, NOT the built extension): the page's FIRST call fetched ` +
        `${first.length} engine resource(s), the repeat fetched ${second.length}`,
    );
    // Reported only: a FULL-suite run is where "first" is the page's first; a re-run of this file
    // alone in a warm page reports whatever its own run order left.
    expect(Array.isArray(second)).toBe(true);
  });
});

describe('012 task 3.2 — degrade: the engine cannot load', () => {
  it('★ a rejecting loader: prior mode kept, no editor node, the document on screen, the control says so', async () => {
    const loader = vi.fn<EditorModuleLoader>(() => Promise.reject(new Error('chunk failed to load')));
    const host = mountWith(loader);
    const before = [...host.shadowRoot!.children];

    await activateAndSettle(host, loader);

    expectDegraded(host, 'reading', before);
    expectUnwatched(host);
  });

  it('★ from RAW: the same, and the raw view is what stays on screen', async () => {
    const loader = vi.fn<EditorModuleLoader>(() => Promise.reject(new Error('chunk failed to load')));
    const host = mountWith(loader);
    host.shadowRoot!.querySelector<HTMLElement>('.peekover-mode-toggle')!.click();
    expect(host.getAttribute('data-mode')).toBe('raw');
    const before = [...host.shadowRoot!.children];

    await activateAndSettle(host, loader);

    expectDegraded(host, 'raw', before);
    expectUnwatched(host);
  });

  it('★ a REAL failed module fetch degrades the same way', async () => {
    const loader = vi.fn<EditorModuleLoader>(
      () => import(/* @vite-ignore */ missingModuleUrl()) as ReturnType<EditorModuleLoader>,
    );
    const host = mountWith(loader);
    const before = [...host.shadowRoot!.children];

    await activateAndSettle(host, loader);

    await expect(loader.mock.results[0].value).rejects.toBeInstanceOf(Error);
    expectDegraded(host, 'reading', before);
    expectUnwatched(host);
  });

  it('POSITIVE CONTROL: on the same fixture a loader that resolves DOES enter edit', async () => {
    // Without this, every assertion above would also hold for a control wired to nothing.
    const loader = vi.fn<EditorModuleLoader>(() => loadCodeMirror());
    const host = mountWith(loader);

    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');

    expect(host.shadowRoot!.querySelector('.cm-editor')).not.toBeNull();
    expect(controlIn(host).textContent).toBe('Stop editing');
    expectUnwatched(host);
  });

  it('a failure is not remembered: activating the control again loads again, and enters edit', async () => {
    const loader = vi
      .fn<EditorModuleLoader>()
      .mockImplementationOnce(() => Promise.reject(new Error('chunk failed to load')))
      .mockImplementation(() => loadCodeMirror());
    const host = mountWith(loader);
    const before = [...host.shadowRoot!.children];

    await activateAndSettle(host, loader);
    expectDegraded(host, 'reading', before);

    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') === 'edit', 'the retry enters edit');
    expect(loader).toHaveBeenCalledTimes(2);
    expect(host.shadowRoot!.querySelector('.cm-editor')).not.toBeNull();
    expect(controlIn(host).textContent).toBe('Stop editing');
    expectUnwatched(host);
  });
});

describe('012 task 3.2 — OBSERVED, not asserted: does a repeated import() retry a failed chunk fetch?', () => {
  it('imports one missing URL twice and reports how many requests each attempt made', async () => {
    // 3.1 left this open: the engine's memo forgets a failed load and asks again, but whether the
    // BROWSER issues a second request for the same specifier is engine behaviour. Measured here on
    // a URL the server does not have. Reported per engine; the product does not depend on the
    // answer being "yes" — it is what decides whether "try again" can ever succeed without a reload.
    const requestsDuring = async (fn: () => Promise<unknown>, match: string): Promise<number> => {
      const names: string[] = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) names.push(entry.name);
      });
      observer.observe({ type: 'resource' });
      try {
        await fn().catch(() => undefined);
        await new Promise<void>((r) => setTimeout(r, 200));
      } finally {
        for (const entry of observer.takeRecords()) names.push(entry.name);
        observer.disconnect();
      }
      return names.filter((name) => name.startsWith(match)).length;
    };

    // FIRING CONTROL: the instrument sees a real request to this origin.
    const probe = `${location.origin}/peekover-3-2-probe-${Date.now()}`;
    expect(await requestsDuring(() => fetch(probe), probe), 'the observer sees a real fetch').toBeGreaterThan(0);

    const url = missingModuleUrl();
    let firstRejected = false;
    let secondRejected = false;
    const first = await requestsDuring(
      () => import(/* @vite-ignore */ url).catch(() => void (firstRejected = true)),
      url,
    );
    const second = await requestsDuring(
      () => import(/* @vite-ignore */ url).catch(() => void (secondRejected = true)),
      url,
    );
    record(
      `repeated import() of ONE missing URL (vite dev harness, NOT the built extension): ` +
        `1st attempt rejected=${firstRejected} requests=${first}; 2nd attempt rejected=${secondRejected} requests=${second}`,
    );
    expect(firstRejected && secondRejected, 'both imports of a missing module reject').toBe(true);
  });
});

// ════ TASK 3.3 — THE PREVIEW-FAILURE DEGRADE (spec §3.7 — "the preview fails to render") ═══════
//
// THE PROPERTY. A preview render that fails shows the reader's EXISTING render-failure state — its
// banner over the raw source — IN THE PREVIEW PANE, and nowhere else. The editor is the same
// node, the buffer is byte-for-byte what was typed, and typing goes on.
//
// HOW A FAILURE IS FORCED, with no seam in production code. Every `mount()` ends in one
// `replaceChildren` on its host's shadow root, and its never-blank fallback is a second one. The
// nested preview root's own `replaceChildren` is overridden on the instance:
//   'commit' — the commit of a rendered reading column throws; the fallback's goes through. This
//              is a render failure as `mount()` sees one, and `mount()` degrades it itself.
//   'always' — the fallback's commit throws too, so the throw LEAVES `mount()`. Nothing in the
//              product does this today; it is the case the feed's own guard exists for.
//
// RED-FIRST — TWO REVERTS, BOTH RECORDED (human ruling 2026-10-05; decisions.md, 012 D-5). Each
// edits `editorView.ts`'s feed and reds the 'always' test:
//   - THE LITERAL ONE, tasks.md's "let the throw propagate": the feed's guard removed. The editor
//     and the buffer are NOT lost — CodeMirror runs every update listener inside its own
//     try/catch, and a timer's throw unwinds nothing. What reds is the last block: every throw
//     reaches the page as an error.
//   - THE ONE THAT LOSES THE EDITOR: a failed render handled the way the render at BUILD is (tear
//     the shell down, rethrow). The first assertion reds — the editor node is gone.
// The 'commit' test is red before the feed exists and green with it; no revert of the feed's
// guard touches it, because `mount()` handles that failure itself.
// In each test the editor and the buffer are asserted FIRST: they are what a wrong feed loses.

const record33 = (line: string): void => console.log(`[3.3][${ENGINE}] ${line}`);

const RENDER_FAILED = "Couldn't render this document — showing raw source.";

type FailureArm = 'off' | 'commit' | 'always';

/** Override the nested preview root's `replaceChildren` (see the block comment above). */
function failureSwitch(previewHost: HTMLElement): { set: (arm: FailureArm) => void; thrown: () => number } {
  const root = previewHost.shadowRoot!;
  const commit = ShadowRoot.prototype.replaceChildren;
  let arm: FailureArm = 'off';
  let thrown = 0;
  root.replaceChildren = function forced(this: ShadowRoot, ...nodes: (Node | string)[]): void {
    const column = nodes.some((n) => n instanceof Element && n.classList.contains('peekover-reader'));
    if (arm === 'always' || (arm === 'commit' && column)) {
      thrown += 1;
      throw new Error('forced preview render failure');
    }
    commit.apply(this, nodes);
  };
  return {
    set: (next) => {
      arm = next;
    },
    thrown: () => thrown,
  };
}

/** Errors that reach the page while a test runs: uncaught ones, and CodeMirror's own report of a
 *  listener that threw (it calls `console.error` when the page has no `window.onerror`). */
function pageErrors(): { seen: string[]; stop: () => void } {
  const seen: string[] = [];
  const onError = (ev: ErrorEvent): void => {
    seen.push(`uncaught: ${ev.message}`);
    ev.preventDefault();
  };
  window.addEventListener('error', onError);
  const logged = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    seen.push(`console.error: ${args.map(String).join(' ')}`);
  });
  return {
    seen,
    stop: () => {
      window.removeEventListener('error', onError);
      logged.mockRestore();
    },
  };
}

describe('012 task 3.3 — degrade: the preview fails to render', () => {
  interface Editing {
    host: HTMLElement;
    editor: HTMLElement;
    shell: EditorShell;
    session: EditorSession;
  }

  /** Enter edit on this file's fixture with the REAL engine, with focus in the editor and the
   *  caret at the start of the document. */
  async function edit(): Promise<Editing> {
    const host = mountWith(vi.fn<EditorModuleLoader>(() => loadCodeMirror()));
    controlIn(host).click();
    await waitFor(() => host.getAttribute('data-mode') === 'edit', 'data-mode="edit"');
    const session = editorSessionFor(host);
    const shell = editorShellFor(host);
    if (!session || !shell) throw new Error('entering edit left no live edit session');
    session.view.focus();
    await waitFor(() => host.shadowRoot!.activeElement?.closest('.cm-editor'), 'focus in the editor');
    return { host, editor: host.shadowRoot!.querySelector<HTMLElement>('.cm-editor')!, shell, session };
  }

  const buffer = (e: Editing): string => e.session.view.state.doc.toString();
  const nested = (e: Editing): ShadowRoot => e.shell.previewHost.shadowRoot!;
  const feedWarnings = (warned: { mock: { calls: unknown[][] } }): number =>
    warned.mock.calls.filter(([first]) => first === '[peekover] preview render failed').length;

  /** The editor is the node it was, in edit, holding exactly `text`. Asserted first, always. */
  function expectEditorIntact(e: Editing, text: string): void {
    expect(e.editor.isConnected, 'the editor node was lost').toBe(true);
    expect(e.host.shadowRoot!.querySelector('.cm-editor'), 'the same editor node').toBe(e.editor);
    expect(buffer(e), 'the buffer is byte-identical to what was typed').toBe(text);
    expect(e.host.getAttribute('data-mode')).toBe('edit');
    expect(editorSessionFor(e.host), 'the same live session').toBe(e.session);
    expect(e.host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
  }

  it('★ a forced render throw: the reader’s render-failure state is IN THE PREVIEW PANE; the buffer is byte-identical and still editable', async () => {
    const TYPED = 'zqx typed while broken ';
    const e = await edit();
    const failure = failureSwitch(e.shell.previewHost);
    const errors = pageErrors();
    const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await userEvent.keyboard('first ');
    await waitFor(() => nested(e).querySelector('.peekover-reader')?.textContent?.includes('first '), 'a good preview render');
    failure.set('commit');
    await userEvent.keyboard(TYPED);
    await waitFor(() => nested(e).querySelector('.peekover-raw')?.textContent === buffer(e), 'the failure state caught up with the buffer');

    expectEditorIntact(e, `first ${TYPED}${DOC}`);
    // The reader's own failure state, in the nested root: its banner, and the raw source.
    const banner = nested(e).querySelector<HTMLElement>('.peekover-alert')!;
    expect(banner.textContent).toBe(RENDER_FAILED);
    expect(banner.getAttribute('role')).toBe('status');
    expect(nested(e).querySelector('.peekover-raw')!.textContent).toBe(`first ${TYPED}${DOC}`);
    expect(nested(e).querySelector('.peekover-reader'), 'no rendered column behind the banner').toBeNull();
    // In the PREVIEW PANE: on screen, inside the pane's box.
    const b = banner.getBoundingClientRect();
    const p = e.shell.preview.getBoundingClientRect();
    expect(onScreen(banner)).toBe(true);
    expect(
      b.left >= p.left && b.right <= p.right && b.top >= p.top && b.bottom <= p.bottom,
      'the banner is inside the preview pane',
    ).toBe(true);
    // And nowhere else: the outer document's root has no failure state of its own.
    expect(e.host.shadowRoot!.querySelector('.peekover-alert')).toBeNull();
    expect(e.host.shadowRoot!.querySelector('.peekover-raw')).toBeNull();
    // FIRING CONTROL: the failure was real, and it was mount()'s own fallback that handled it.
    expect(failure.thrown()).toBeGreaterThan(0);
    expect(
      warned.mock.calls.some(([first]) => String(first).includes('render failed; showing raw source')),
    ).toBe(true);
    expect(feedWarnings(warned), 'nothing left mount()').toBe(0);

    // Still editable: type once more and it lands — and the failure state follows the buffer.
    await userEvent.keyboard('X');
    expectEditorIntact(e, `first ${TYPED}X${DOC}`);
    await waitFor(() => nested(e).querySelector('.peekover-raw')?.textContent === buffer(e), 'the failure state followed');

    // Once rendering works again, so does the preview.
    failure.set('off');
    await userEvent.keyboard('Y');
    await waitFor(
      () => nested(e).querySelector('.peekover-reader')?.textContent?.includes(`${TYPED}XY`),
      'the preview recovered',
    );
    expect(nested(e).querySelector('.peekover-alert')).toBeNull();
    expectEditorIntact(e, `first ${TYPED}XY${DOC}`);

    errors.stop();
    expect(errors.seen, 'nothing reached the page as an error').toEqual([]);
    record33(
      `preview failure contained by mount(): ${failure.thrown()} forced throw(s); banner ` +
        `${Math.round(b.width)}x${Math.round(b.height)} px inside a ${Math.round(p.width)}x${Math.round(p.height)} px pane`,
    );
    expectUnwatched(e.host);
  });

  it('★ a throw that LEAVES mount(): the editor and the buffer stand, nothing reaches the page as an error, and the preview recovers', async () => {
    // Both reverts in the block comment above red HERE: the teardown one at the first assertion,
    // the literal one at the last block.
    const TYPED = 'zqx typed while broken ';
    const e = await edit();
    const failure = failureSwitch(e.shell.previewHost);
    const errors = pageErrors();
    const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await userEvent.keyboard('first ');
    await waitFor(() => nested(e).querySelector('.peekover-reader')?.textContent?.includes('first '), 'a good preview render');
    const lastGood = nested(e).querySelector('.peekover-reader')!.textContent;
    failure.set('always');
    await userEvent.keyboard(TYPED);
    await new Promise<void>((r) => setTimeout(r, 300)); // any pending render has been attempted

    expectEditorIntact(e, `first ${TYPED}${DOC}`);
    expect(failure.thrown(), 'FIRING CONTROL: renders were attempted, and threw').toBeGreaterThan(0);
    // Nothing could be committed, so the pane still shows the last render that worked.
    expect(nested(e).querySelector('.peekover-reader')?.textContent).toBe(lastGood);

    // Still editable, and the preview recovers with the whole buffer once rendering works.
    await userEvent.keyboard('X');
    expectEditorIntact(e, `first ${TYPED}X${DOC}`);
    failure.set('off');
    await userEvent.keyboard('Y');
    await waitFor(
      () => nested(e).querySelector('.peekover-reader')?.textContent?.includes(`${TYPED}XY`),
      'the preview recovered',
    );
    expectEditorIntact(e, `first ${TYPED}XY${DOC}`);

    // The guard's own units: the failure was logged by the feed, and never reached the page.
    errors.stop();
    expect(errors.seen, 'a preview failure reached the page as an error').toEqual([]);
    expect(feedWarnings(warned)).toBeGreaterThan(0);
    record33(
      `preview failure that left mount(): ${failure.thrown()} forced throw(s), ${feedWarnings(warned)} ` +
        `logged by the feed, ${errors.seen.length} reached the page`,
    );
    expectUnwatched(e.host);
  });
});
