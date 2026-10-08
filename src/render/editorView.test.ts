// @vitest-environment jsdom
//
// editorView — the edit view's shell (012 task 2.2, D-4 as re-ruled): what build adds to the outer
// shadow root, that preview renders go to the nested host and nowhere else, and that teardown is
// build's exact inverse.
//
// jsdom-safe vs real-engine: everything here is DOM shape, node identity and call arguments.
// Layout, the resolved scroll box, the registry-gated chrome with the registries live and the
// backtick are real-engine-or-nothing — tests/browser/editorNestedHost.browser.test.ts.

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('./mount', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mount')>();
  return { ...actual, mount: vi.fn(actual.mount) };
});

import { mount } from './mount';
import { enterEditMode, exitEditMode } from './readerMode';
import { loadEditorEngine, type EditorEngine } from './editorEngine';
import {
  EDITOR_DIRTY_ATTR,
  EDITOR_PREVIEW_CLASS,
  EDITOR_PREVIEW_HOST_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  PREVIEW_COOLDOWN_MULTIPLIER,
  buildEditor,
  buildEditorShell,
  createPreviewCooldown,
  editorSessionFor,
  editorShellFor,
  hasConflict,
  renderPreview,
  teardownEditorShell,
  type EditorSave,
} from './editorView';

const DOC = '# Outer\n\nBody.\n\n## Second\n\nMore.';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  vi.mocked(mount).mockClear();
});

/** The app-page shape: a plain <div>, mounted contained. */
function mountedHost(source = DOC): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  mount(source, host, { contained: true });
  vi.mocked(mount).mockClear();
  return host;
}

const childrenOf = (host: HTMLElement): Element[] => [...host.shadowRoot!.children];

/** The OUTER reading column: a direct child of the host's shadow root, never the preview's. */
const outerColumnOf = (host: HTMLElement): Element =>
  childrenOf(host).find((el) => el.classList.contains('peekover-reader'))!;

describe('buildEditorShell', () => {
  it('adds one stylesheet and one shell beside the reading column, and touches nothing else', () => {
    const host = mountedHost();
    const before = childrenOf(host);

    const shell = buildEditorShell(host);

    const after = childrenOf(host);
    expect(after.slice(0, before.length)).toEqual(before); // same nodes, same order
    const added = after.slice(before.length);
    expect(added.map((el) => el.tagName)).toEqual(['STYLE', 'DIV']);
    expect(added[1].className).toBe(EDITOR_SHELL_CLASS);
    expect(added[1].previousElementSibling?.previousElementSibling?.className).toBe(
      'peekover-reader',
    );

    expect([...added[1].children]).toEqual([shell.source, shell.preview]);
    expect(shell.source.className).toBe(EDITOR_SOURCE_CLASS);
    expect(shell.preview.className).toBe(EDITOR_PREVIEW_CLASS);
    expect([...shell.preview.children]).toEqual([shell.previewHost]);
    expect(shell.previewHost.className).toBe(EDITOR_PREVIEW_HOST_CLASS);
    expect(shell.source.childElementCount).toBe(0); // a slot: the editor is a later task's
  });

  it('gives the preview its OWN shadow root, holding the document with no chrome', () => {
    const host = mountedHost();
    const { previewHost } = buildEditorShell(host);

    const nested = previewHost.shadowRoot!;
    expect(nested).not.toBe(host.shadowRoot);
    expect([...nested.children].map((el) => el.tagName)).toEqual(['STYLE', 'STYLE', 'DIV']);
    expect(nested.querySelector('.peekover-reader h1')?.textContent).toBe('Outer');
    expect(previewHost.getAttribute('data-theme')).toBe(host.getAttribute('data-theme'));
  });

  it('is idempotent: a second build returns the same shell and duplicates nothing', () => {
    const host = mountedHost();
    const first = buildEditorShell(host);
    const count = childrenOf(host).length;

    expect(buildEditorShell(host)).toBe(first);
    expect(editorShellFor(host)).toBe(first);
    expect(childrenOf(host).length).toBe(count);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
  });

  it('builds afresh when a re-mount of the outer host dropped the previous shell', () => {
    const host = mountedHost();
    const first = buildEditorShell(host);
    mount(DOC, host, { contained: true }); // replaceChildren: the shell is gone

    expect(editorShellFor(host)).toBeUndefined();
    const second = buildEditorShell(host);
    expect(second).not.toBe(first);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
  });

  it('throws on a host with no shadow root, having added nothing', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    expect(() => buildEditorShell(host)).toThrow(/shadow root/);
    expect(host.childNodes.length).toBe(0);
    expect(host.shadowRoot).toBeNull();
  });
});

describe('renderPreview', () => {
  it('★ always mounts on the nested host with { contained, preserveReading, chrome: false }', () => {
    const host = mountedHost();
    const shell = buildEditorShell(host);
    renderPreview(host, '# Draft one');
    renderPreview(host, '# Draft two\n\n## Sub');

    const calls = vi.mocked(mount).mock.calls;
    expect(calls.length).toBe(3); // build's initial render + the two above
    for (const [, target, options] of calls) {
      expect(target).toBe(shell.previewHost);
      expect(target).not.toBe(host);
      expect(options).toEqual({ contained: true, preserveReading: true, chrome: false });
    }
    expect(calls.map(([text]) => text)).toEqual([DOC, '# Draft one', '# Draft two\n\n## Sub']);
  });

  it('★ leaves the outer shadow root — and whatever sits in the source slot — untouched', () => {
    const host = mountedHost();
    const shell = buildEditorShell(host);
    const editor = document.createElement('textarea');
    shell.source.appendChild(editor);
    const before = childrenOf(host);
    const outerColumn = outerColumnOf(host);
    const outerHtml = outerColumn.outerHTML;

    for (let i = 0; i < 5; i += 1) renderPreview(host, `# Draft ${i}\n\n## Sub ${i}`);

    expect(childrenOf(host)).toEqual(before);
    expect(editor.isConnected).toBe(true);
    expect(editor.parentElement).toBe(shell.source);
    expect(outerColumnOf(host)).toBe(outerColumn);
    expect(outerColumn.outerHTML).toBe(outerHtml);
    expect(shell.previewHost.shadowRoot!.querySelector('h1')?.textContent).toBe('Draft 4');
  });

  it('does nothing on a host with no shell', () => {
    const host = mountedHost();
    renderPreview(host, '# Nowhere to go');
    expect(vi.mocked(mount)).not.toHaveBeenCalled();
  });
});

describe('teardownEditorShell', () => {
  it('removes exactly what build added', () => {
    const host = mountedHost();
    const before = childrenOf(host);
    const shell = buildEditorShell(host);

    teardownEditorShell(host);

    expect(childrenOf(host)).toEqual(before);
    expect(shell.previewHost.isConnected).toBe(false);
    expect(editorShellFor(host)).toBeUndefined();
    teardownEditorShell(host); // a second call, and a host that never had one, are no-ops
    expect(childrenOf(host)).toEqual(before);
  });
});

describe('as enterEditMode’s build step (2.1’s seam)', () => {
  const build = (_engine: unknown, host: HTMLElement): void => {
    buildEditorShell(host);
  };

  it('the shell exists before the mode flips, and re-entry does not duplicate it', async () => {
    const host = mountedHost();
    await enterEditMode(host, { loader: async () => null, build });
    expect(host.getAttribute('data-mode')).toBe('edit');
    const shell = editorShellFor(host);
    expect(shell).toBeDefined();

    exitEditMode(host);
    teardownEditorShell(host);
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`)).toBeNull();

    await enterEditMode(host, { loader: async () => null, build });
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
    expect(editorShellFor(host)).not.toBe(shell);
  });

  it('a build that cannot run rejects with the mode and the DOM as they were', async () => {
    const host = document.createElement('div'); // never mounted: no shadow root
    document.body.appendChild(host);
    hosts.push(host);
    await expect(enterEditMode(host, { loader: async () => null, build })).rejects.toThrow();
    expect(host.hasAttribute('data-mode')).toBe(false);
    expect(host.childNodes.length).toBe(0);
  });
});

// ════ TASK 3.3 — THE PREVIEW'S COST-PROPORTIONAL COOLDOWN, AND THE FEED BEHIND IT ══════════════
//
// The rule under test is the watch's (decisions.md 2026-07-21, spec 005 tasks 5.2 / 5.3), in a
// NEW instance scoped to the preview: after a render finishes, the next may not START until as
// long as that render TOOK has elapsed; whatever arrives in between coalesces into ONE pending
// render carrying the NEWEST text; the first render is immediate; the timer is never re-armed per
// change.
//
// The clock is injected for the reason it is there: the distinguishing property is that the wait
// is PROPORTIONAL TO WHAT A RENDER COST, and a jsdom render costs nothing measurable. The fake
// render BURNS clock time; timer time advances 1 ms at a time in lockstep, so a wait is a number.
//
// The clock, the rig and the two tests that carry the property mirror `watchController.test.ts`'s
// 5.3 block. Everything about layout — where the preview is scrolled to, that real keys land while
// a render waits — is real-engine-or-nothing: tests/browser/editorPreview.browser.test.ts.

/** `burn` is time a render consumed; `advance` is time passing with timers running. Separate
 *  because a synchronous render does NOT let timers run. */
function fakeClock(): { now: () => number; burn: (ms: number) => void; advance: (ms: number) => void } {
  let t = 10_000;
  return {
    now: () => t,
    burn: (ms) => {
      t += ms;
    },
    advance: (ms) => {
      // 1 ms at a time, so a timer fires at its due millisecond and not at the end of a jump.
      for (let i = 0; i < ms; i += 1) {
        t += 1;
        vi.advanceTimersByTime(1);
      }
    },
  };
}

interface CooldownRig {
  cooldown: ReturnType<typeof createPreviewCooldown>;
  renders: { text: string; at: number }[];
  clock: ReturnType<typeof fakeClock>;
}

/** A cooldown whose render costs exactly `costMs` of clock time, every time. */
function cooldownRig(costMs: number): CooldownRig {
  const clock = fakeClock();
  const renders: { text: string; at: number }[] = [];
  const cooldown = createPreviewCooldown((text) => {
    renders.push({ text, at: clock.now() });
    clock.burn(costMs); // THE RENDER'S COST — the quantity the cooldown is proportional to
  }, clock.now);
  return { cooldown, renders, clock };
}

/** Advance until a render lands, or give up. */
function advanceUntilRender(r: CooldownRig, limit = 5000): void {
  const target = r.renders.length + 1;
  for (let i = 0; i < limit && r.renders.length < target; i += 1) r.clock.advance(1);
}

describe('createPreviewCooldown — the cost-proportional cooldown (3.3; D-5’s mechanism)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the FIRST text immediately — nothing to be proportional to yet', () => {
    const r = cooldownRig(40);
    const at = r.clock.now();

    r.cooldown.push('first');

    expect(r.renders).toEqual([{ text: 'first', at }]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('★ THE WAIT SCALES WITH THE RENDER COST, from when the render FINISHED — the test a fixed window fails', () => {
    const measure = (costMs: number): number => {
      const r = cooldownRig(costMs);
      r.cooldown.push('first'); // immediate; costs `costMs` of clock time
      const finishedAt = r.clock.now();
      r.cooldown.push('second'); // inside the cooldown -> pending
      expect(r.renders).toHaveLength(1);
      advanceUntilRender(r);
      expect(r.renders).toHaveLength(2);
      return r.renders[1].at - finishedAt;
    };

    const cheap = measure(10);
    const expensive = measure(400);

    // A 10 ms render waits 10 ms; a 400 ms render waits 400 ms.
    expect(cheap).toBe(10 * PREVIEW_COOLDOWN_MULTIPLIER);
    expect(expensive).toBe(400 * PREVIEW_COOLDOWN_MULTIPLIER);
    expect(expensive).toBeGreaterThan(cheap * 10);
  });

  it('★ COALESCES a burst: exactly ONE pending render, carrying the NEWEST text', () => {
    // The count AND the content: a coalescer that keeps the FIRST text passes a count-only test.
    const r = cooldownRig(40);
    r.cooldown.push('v0');
    expect(r.renders).toHaveLength(1);

    for (let i = 1; i <= 10; i += 1) r.cooldown.push(`v${i}`); // ten changes inside the cooldown
    expect(r.renders, 'nothing may render during the cooldown').toHaveLength(1);
    expect(vi.getTimerCount(), 'one pending render, not a queue of ten').toBe(1);

    r.clock.advance(5000);

    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v10']); // v1..v9 never rendered at all
    expect(vi.getTimerCount()).toBe(0);
  });

  it('★ the timer is NOT re-armed per change — a later change does not push the render out', () => {
    // Re-arming on every change IS a trailing debounce. Changes arrive 10 ms apart inside a 40 ms
    // cooldown: the pending render must land 40 ms after the first render FINISHED, not 40 ms
    // after the last change.
    const r = cooldownRig(40);
    const armed = vi.spyOn(globalThis, 'setTimeout');
    r.cooldown.push('v0');
    const finishedAt = r.clock.now();

    r.cooldown.push('v1');
    r.clock.advance(10);
    r.cooldown.push('v2');
    r.clock.advance(10);
    r.cooldown.push('v3');
    expect(armed, 'one timer for three changes').toHaveBeenCalledTimes(1);
    advanceUntilRender(r);

    expect(r.renders[1]).toEqual({ text: 'v3', at: finishedAt + 40 });
    armed.mockRestore();
  });

  it('★ does not STARVE: a stream that never goes quiet still renders', () => {
    // What a trailing debounce loses. A change every 10 ms for 600 ms never leaves 40 ms of quiet.
    const r = cooldownRig(40);
    for (let i = 0; i < 60; i += 1) {
      r.cooldown.push(`v${i}`);
      r.clock.advance(10);
    }
    expect(r.renders.length, 'renders during the stream').toBeGreaterThanOrEqual(5);
    expect(r.renders.length, 'and still fewer than the changes').toBeLessThan(60);
  });

  it('a QUIET GAP produces a render per change, and leaves no timer behind', () => {
    const r = cooldownRig(40);
    r.cooldown.push('a');
    r.clock.advance(200);
    r.cooldown.push('b');
    r.clock.advance(200);
    r.cooldown.push('c');

    expect(r.renders.map((x) => x.text)).toEqual(['a', 'b', 'c']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('★ cancel() drops the pending render — the TIMER, not only the text', () => {
    const r = cooldownRig(40);
    r.cooldown.push('rendered');
    r.cooldown.push('pending');
    expect(vi.getTimerCount(), 'the pending render is armed').toBe(1);

    r.cooldown.cancel();

    expect(vi.getTimerCount()).toBe(0);
    r.clock.advance(5000);
    expect(r.renders.map((x) => x.text)).toEqual(['rendered']);
  });

  it('holds the text it is given unread until it renders it', () => {
    // The feed hands over the editor's document, not a string built on every keystroke.
    const r = cooldownRig(40);
    let reads = 0;
    const lazy = (text: string): { toString(): string } => ({
      toString: () => {
        reads += 1;
        return text;
      },
    });
    r.cooldown.push(lazy('v0'));
    r.cooldown.push(lazy('v1'));
    r.cooldown.push(lazy('v2'));
    expect(reads).toBe(1); // v0 rendered; v1 was replaced unread; v2 is waiting
    r.clock.advance(5000);
    expect(reads).toBe(2);
    expect(r.renders.map((x) => x.text)).toEqual(['v0', 'v2']);
  });

  it('the multiplier is 1, and is marked PROVISIONAL in exactly one place', () => {
    expect(PREVIEW_COOLDOWN_MULTIPLIER).toBe(1);
    const source = readFileSync(join(process.cwd(), 'src/render/editorView.ts'), 'utf8');
    expect(source.match(/PROVISIONAL/g) ?? []).toHaveLength(1);
  });
});

describe('the feed — the editor’s buffer reaches the nested host through the cooldown (3.3)', () => {
  let actualMount: typeof mount;
  beforeAll(async () => {
    actualMount = (await vi.importActual<typeof import('./mount')>('./mount')).mount;
  });
  afterEach(() => {
    for (const host of hosts) teardownEditorShell(host);
    vi.mocked(mount).mockImplementation(actualMount);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  interface Editing {
    host: HTMLElement;
    engine: EditorEngine;
    clock: ReturnType<typeof fakeClock>;
    view: NonNullable<ReturnType<typeof editorSessionFor>>['view'];
    previewHost: HTMLElement;
  }

  /** An edit session on the REAL engine whose every preview render costs `costMs` of an injected
   *  clock. The engine is loaded before the timers are faked; the build-time render is cleared
   *  from the spy, so every count below is of renders the FEED made. */
  async function editing(costMs: number): Promise<Editing> {
    const host = mountedHost();
    const engine = await loadEditorEngine(host);
    vi.useFakeTimers();
    const clock = fakeClock();
    vi.mocked(mount).mockImplementation((...args) => {
      clock.burn(costMs);
      actualMount(...args);
    });
    const { view } = buildEditor(engine, host, { now: clock.now });
    vi.mocked(mount).mockClear();
    return { host, engine, clock, view, previewHost: editorShellFor(host)!.previewHost };
  }

  /** Append to the buffer — the document-model stand-in for a keystroke. */
  const type = (e: Editing, text: string): void =>
    e.view.dispatch({ changes: { from: e.view.state.doc.length, insert: text } });

  const rendered = (): string[] => vi.mocked(mount).mock.calls.map(([text]) => text);

  it('★ a change renders the BUFFER into the nested host, at once, with the preview’s three options', async () => {
    const e = await editing(40);

    type(e, 'X');

    const calls = vi.mocked(mount).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(`${DOC}X`);
    expect(calls[0][0]).toBe(e.view.state.doc.toString());
    expect(calls[0][1]).toBe(e.previewHost);
    expect(calls[0][2]).toEqual({ contained: true, preserveReading: true, chrome: false });
    expect(e.previewHost.shadowRoot!.querySelector('.peekover-reader')?.textContent).toContain('More.X');
    // Dirty tracking is the same listener, unchanged.
    expect(e.host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
  });

  it('★ a burst coalesces: fewer renders than changes, the last carrying the whole buffer', async () => {
    const e = await editing(40);

    for (const ch of 'abcdef') type(e, ch);
    expect(rendered()).toEqual([`${DOC}a`]);
    e.clock.advance(5000);

    expect(rendered()).toEqual([`${DOC}a`, `${DOC}abcdef`]);
  });

  it('an update that changes no text feeds nothing', async () => {
    const e = await editing(40);
    e.view.dispatch({ selection: { anchor: 3 } });
    e.clock.advance(5000);
    expect(rendered()).toEqual([]);
  });

  it('★ GUARD A, alone — teardown CLEARS the pending timer, by its own handle', async () => {
    // Guard B (below) would also stop this render at fire time, so "nothing rendered" cannot see
    // a teardown that forgot to cancel. The timer's own handle can.
    const e = await editing(40);
    type(e, 'a');
    const armed = vi.spyOn(globalThis, 'setTimeout');
    const cleared = vi.spyOn(globalThis, 'clearTimeout');
    type(e, 'b'); // inside the cooldown -> pending
    const arming = armed.mock.calls.findIndex(([, delay]) => delay === 40);
    expect(arming, 'the pending render armed a 40 ms timer').toBeGreaterThan(-1);
    const handle = armed.mock.results[arming].value as ReturnType<typeof setTimeout>;

    teardownEditorShell(e.host);

    expect(cleared).toHaveBeenCalledWith(handle);
    e.clock.advance(5000);
    expect(rendered()).toEqual([`${DOC}a`]);
  });

  it('★ GUARD B, alone — a session an outer re-mount orphaned never renders into the shell built after it', async () => {
    // No teardown runs on this path, so guard A never does: the timer is still armed. Without the
    // fire-time check the orphan's text lands in the NEW shell's preview — the cross-feed.
    const e = await editing(40);
    type(e, 'a');
    type(e, ' STALE'); // pending
    mount(DOC, e.host, { contained: true }); // the outer re-mount: shell and view are dropped
    const fresh = buildEditorShell(e.host);
    expect(fresh.previewHost).not.toBe(e.previewHost);
    vi.mocked(mount).mockClear();

    e.clock.advance(5000);

    expect(rendered().filter((text) => text.includes('STALE'))).toEqual([]);
    expect(rendered()).toEqual([]);
    expect(fresh.previewHost.shadowRoot!.textContent).not.toContain('STALE');
  });

  it('★ exit while a render is pending, then re-enter: the discarded text never reaches the new session', async () => {
    const e = await editing(40);
    type(e, 'a');
    type(e, ' DISCARDED'); // pending

    exitEditMode(e.host);
    teardownEditorShell(e.host);
    const next = buildEditor(e.engine, e.host, { now: e.clock.now });
    vi.mocked(mount).mockClear();
    e.clock.advance(5000);

    expect(rendered()).toEqual([]);
    expect(next.view.state.doc.toString()).toBe(DOC);
    expect(editorShellFor(e.host)!.previewHost.shadowRoot!.textContent).not.toContain('DISCARDED');
  });

  it('★ a render that throws OUT of mount() never leaves the feed: the view and the buffer stand, and the next change renders', async () => {
    const e = await editing(40);
    const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failure = new Error('mount itself failed');
    vi.mocked(mount).mockImplementationOnce(() => {
      e.clock.burn(40);
      throw failure;
    });

    expect(() => type(e, 'a')).not.toThrow();

    expect(warned).toHaveBeenCalledWith('[peekover] preview render failed', failure);
    expect(e.view.state.doc.toString()).toBe(`${DOC}a`);
    expect(e.view.dom.isConnected).toBe(true);
    expect(editorSessionFor(e.host)?.view).toBe(e.view);
    // Still editable, and the preview catches up once the failed render's own cooldown has passed.
    type(e, 'b');
    e.clock.advance(5000);
    expect(rendered().at(-1)).toBe(`${DOC}ab`);
    expect(e.previewHost.shadowRoot!.querySelector('.peekover-reader')?.textContent).toContain('More.ab');
  });
});

// ════ TASK 5.2 — THE CONFLICT PREDICATE AND THE ONE BASELINE (D-7) ════════════════════════════
//
// The save-time compare (D-7) and the dirty attribute (3.2) both answer "what was the file, last we
// knew?" — the compare against the RAW text, the attribute against it put through the editor's own
// line-break rule. They read ONE baseline, `session.originalText`: the raw read at seed, advanced to
// the exact string written after a successful save. Two copies could disagree after a write.
//
// The CRLF and lone-CR cases are mandatory, not decorative: the editor's document turns both into LF
// before the user types anything (012 D-2's round-trip finding, `editorEngine.test.ts`), so a
// compare or a baseline that passed through the editor would hide exactly these differences.
//
// Nothing here writes a file: the write, the re-read and the permission are 5.3's.

describe('hasConflict — strict equality of the re-read text against the baseline (D-7)', () => {
  it('equal text is no conflict', () => {
    expect(hasConflict('# A\n\nBody.\n', '# A\n\nBody.\n')).toBe(false);
    expect(hasConflict('', '')).toBe(false);
    expect(hasConflict('a\r\nb\r\n', 'a\r\nb\r\n')).toBe(false);
  });

  // [baseline, re-read, what the difference is]
  const DIFFERENT: ReadonlyArray<[string, string, string]> = [
    ['# Title\n\nalpha\n', '# Title\n\nbravo\n', 'SAME LENGTH'],
    ['a\r\nb\r\n', 'a\nb\n', 'line endings only: CRLF vs LF'],
    ['a\nb\n', 'a\nb', 'trailing newline only'],
    ['a\rb', 'a\nb', 'line endings only: lone CR vs LF, same length too'],
    ['', 'x', 'empty vs non-empty'],
  ];

  for (const [baseline, reread, what] of DIFFERENT) {
    it(`any difference is a conflict — ${what}`, () => {
      expect(hasConflict(baseline, reread)).toBe(true);
    });
  }

  it('the SAME-LENGTH cases really are the same length (the fixtures would prove nothing otherwise)', () => {
    expect(DIFFERENT[0][0].length).toBe(DIFFERENT[0][1].length);
    expect(DIFFERENT[3][0].length).toBe(DIFFERENT[3][1].length);
  });

  it('is order-safe: hasConflict(a, b) === hasConflict(b, a)', () => {
    const pairs: ReadonlyArray<[string, string]> = [
      ['same', 'same'],
      ...DIFFERENT.map(([a, b]): [string, string] => [a, b]),
    ];
    for (const [a, b] of pairs) expect(hasConflict(a, b)).toBe(hasConflict(b, a));
  });
});

describe('the session baseline — one source of truth for the compare and the dirty attribute (5.2)', () => {
  afterEach(() => {
    for (const host of hosts) teardownEditorShell(host);
  });

  type View = NonNullable<ReturnType<typeof editorSessionFor>>['view'];

  /** A real-engine edit session on a document mounted from `source`. */
  async function editing(source: string, save?: EditorSave) {
    const host = mountedHost(source);
    const engine = await loadEditorEngine(host);
    const session = buildEditor(engine, host, { save });
    return { host, session, view: session.view };
  }

  const append = (view: View, text: string): void =>
    view.dispatch({ changes: { from: view.state.doc.length, insert: text } });

  const deleteLast = (view: View, n: number): void =>
    view.dispatch({ changes: { from: view.state.doc.length - n, to: view.state.doc.length } });

  const CRLF_DOC = '# Title\r\n\r\nBody line.\r\n';

  it('★ is the RAW read at seed — a CRLF file’s baseline is CRLF, not the editor’s LF buffer', async () => {
    const { session, view } = await editing(CRLF_DOC);
    expect(session.originalText).toBe(CRLF_DOC);
    expect(view.state.doc.toString()).toBe('# Title\n\nBody line.\n'); // the editor did normalise
    expect(hasConflict(session.originalText, CRLF_DOC)).toBe(false); // an untouched file re-reads clean
  });

  it('is never derived from the editor’s document: typing leaves it unchanged', async () => {
    const { session, view } = await editing(CRLF_DOC);
    append(view, 'typed');
    deleteLast(view, 2);
    expect(session.originalText).toBe(CRLF_DOC);
  });

  for (const [what, written] of [
    ['an LF write', '# Title\n\nBody line.\nmore\n'],
    ['a CRLF write (ruling A)', '# Title\r\n\r\nBody line.\r\nmore\r\n'],
  ] as const) {
    it(`★ after ${what}, the baseline is EXACTLY the written string, and an immediate re-read is no conflict`, async () => {
      const { session, view } = await editing(CRLF_DOC);
      append(view, 'more\n');

      session.advanceBaseline(written); // what 5.3 calls once its write has succeeded

      expect(session.originalText).toBe(written);
      expect(hasConflict(session.originalText, written)).toBe(false); // a second save does not conflict with the first
      expect(hasConflict(session.originalText, CRLF_DOC)).toBe(true); // and the seed is no longer the baseline
    });
  }

  it('a refused or failed save does not move it — only the advance seam does', async () => {
    const refused = async () => ({ ok: false as const, reason: 'cannot save here yet' });
    const failed = async (): Promise<never> => {
      throw new Error('the writable threw');
    };
    for (const save of [refused, failed]) {
      const { session, view } = await editing(CRLF_DOC, save);
      append(view, 'edit');
      await session.save!(view.state.doc.toString()).catch(() => undefined);
      expect(session.originalText).toBe(CRLF_DOC);
    }
  });

  it('★ dirty AGREES with the compare after an advance: returning the buffer to the written text clears it', async () => {
    const { host, session, view } = await editing(DOC);
    append(view, 'X');
    session.advanceBaseline(`${DOC}X`); // the save wrote the buffer
    append(view, 'Y');
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    deleteLast(view, 1); // back to exactly what was written

    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('★ the same after a CRLF write: the dirty side normalises the ONE baseline', async () => {
    const { host, session, view } = await editing(CRLF_DOC);
    append(view, 'more\n');
    session.advanceBaseline('# Title\r\n\r\nBody line.\r\nmore\r\n');
    append(view, 'Y');
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');

    deleteLast(view, 1);

    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });

  it('before an advance, the seed still drives dirty', async () => {
    const { host, view } = await editing(DOC);
    append(view, 'X');
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true');
    append(view, 'Y');
    deleteLast(view, 1);
    expect(host.getAttribute(EDITOR_DIRTY_ATTR)).toBe('true'); // `${DOC}X` is not the seed
    deleteLast(view, 1);
    expect(host.hasAttribute(EDITOR_DIRTY_ATTR)).toBe(false);
  });
});

describe('no file metadata on the conflict path (D-7)', () => {
  // Content comparison is the shipped mechanism; metadata is not read at all until a measurement
  // promotes it (plan D-7). Whole words, comments included: the module names neither, so a match is
  // a read — or a comment that should say "metadata" instead.
  it('editorView.ts names neither `lastModified` nor `size`', () => {
    const source = readFileSync(join(process.cwd(), 'src/render/editorView.ts'), 'utf8');
    expect(source.match(/\blastModified\b/g) ?? []).toEqual([]);
    expect(source.match(/\bsize\b/g) ?? []).toEqual([]);
  });
});
