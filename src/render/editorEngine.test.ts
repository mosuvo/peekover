// @vitest-environment jsdom
//
// editorEngine — the load gate, the ruled setup, and the document round-trip. Three groups, each
// stating what jsdom can and cannot honestly host:
//
//   1. THE MEMO AND THE RETRY. Pure promise bookkeeping over an INJECTED loader — a spy this file
//      owns. "The loader ran once" is paired with a second host that makes the same spy run again,
//      so a spy that was never wired cannot pass for a memo that held.
//   2. THE SETUP. `basicSetup` + `markdown()` with their defaults (decisions.md, M12 TASK 1.1 and
//      M12 TASK 1.1 EXTENDED), asserted on a fake view class that records what it was constructed
//      with: `markdown` is called with NO argument, and nothing the engine adds sits between the
//      ruled pair and the caller's own extension.
//   3. THE ROUND-TRIP (plan D-7's open note), against the REAL package through the engine's own
//      default loader. This is a claim about CodeMirror's DOCUMENT MODEL — text in, text out —
//      which involves no layout, so a view constructed in jsdom answers it honestly.
//
// ★ WHAT IS NOT CLAIMED HERE. That a view RENDERS, measures, takes focus or accepts typed input:
// those are layout and input behaviour, jsdom-blind, and they are task 3.2's real-engine tests.
// A view being constructible in jsdom is used below only as a way to hold a document.

import { describe, it, expect, vi } from 'vitest';

import {
  loadCodeMirror,
  loadEditorEngine,
  type EditorEngine,
  type EditorModuleLoader,
  type EditorModules,
} from './editorEngine';

/** What the fake view class was last constructed with. */
interface RecordedConfig {
  doc?: unknown;
  parent?: unknown;
  extensions?: unknown;
}

/** Stand-in modules: three distinguishable values and a view class that records its config. */
function fakeModules(): { modules: EditorModules; built: RecordedConfig[]; markdown: ReturnType<typeof vi.fn> } {
  const built: RecordedConfig[] = [];
  class FakeView {
    constructor(config: RecordedConfig) {
      built.push(config);
    }
  }
  const markdown = vi.fn(() => 'MARKDOWN_SUPPORT');
  const modules = { EditorView: FakeView, basicSetup: 'BASIC_SETUP', markdown } as unknown as EditorModules;
  return { modules, built, markdown };
}

const host = (): HTMLElement => document.createElement('div');

describe('loadEditorEngine — memoized per host', () => {
  it('two loads for ONE host resolve the SAME promise, and the loader runs once', async () => {
    const { modules } = fakeModules();
    const loader = vi.fn<EditorModuleLoader>(() => Promise.resolve(modules));
    const a = host();

    const first = loadEditorEngine(a, loader);
    const second = loadEditorEngine(a, loader);
    expect(second).toBe(first);
    expect(await second).toBe(await first);
    // After it has settled too — edit → reading → edit on a host that is still the same element.
    expect(loadEditorEngine(a, loader)).toBe(first);
    expect(loader).toHaveBeenCalledTimes(1);

    // THE CONTROL: the same spy DOES run again for a different host, so "once" above is a memo
    // holding and not a loader that was never reached.
    const other = loadEditorEngine(host(), loader);
    expect(other).not.toBe(first);
    await other;
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('a pending load is shared too — the second caller does not start a second fetch', async () => {
    const { modules } = fakeModules();
    let release!: (m: EditorModules) => void;
    const loader = vi.fn<EditorModuleLoader>(() => new Promise((res) => (release = res)));
    const a = host();

    const first = loadEditorEngine(a, loader);
    const second = loadEditorEngine(a, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    release(modules);
    expect(await first).toBe(await second);
  });
});

describe('loadEditorEngine — a rejected load is not cached', () => {
  it('rejects to every caller waiting on it, then RETRIES on the next load', async () => {
    const { modules } = fakeModules();
    const failure = new Error('chunk failed to load');
    const loader = vi
      .fn<EditorModuleLoader>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(modules);
    const a = host();

    const first = loadEditorEngine(a, loader);
    const sharing = loadEditorEngine(a, loader);
    expect(sharing).toBe(first);
    await expect(first).rejects.toBe(failure);
    await expect(sharing).rejects.toBe(failure);
    expect(loader).toHaveBeenCalledTimes(1);

    // The retry: a NEW promise, the loader run a second time, and this one resolves.
    const retry = loadEditorEngine(a, loader);
    expect(retry).not.toBe(first);
    const engine = await retry;
    expect(loader).toHaveBeenCalledTimes(2);
    expect(typeof engine.createView).toBe('function');
    // And the success IS cached.
    expect(loadEditorEngine(a, loader)).toBe(retry);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('a loader that THROWS synchronously is a rejection, not an exception at the call site', async () => {
    const failure = new Error('threw before returning a promise');
    const loader = vi.fn<EditorModuleLoader>(() => {
      throw failure;
    });
    const a = host();

    const load = loadEditorEngine(a, loader);
    await expect(load).rejects.toBe(failure);
    void loadEditorEngine(a, loader).catch(() => undefined);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe('the engine — the ruled setup, defaults unmodified', () => {
  it('builds a view from basicSetup + markdown() and NOTHING of its own', async () => {
    const { modules, built, markdown } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    const parent = host();

    const view = engine.createView(parent, 'seed text');
    expect(built).toHaveLength(1);
    expect(view).toBeInstanceOf(modules.EditorView);
    expect(built[0].doc).toBe('seed text');
    expect(built[0].parent).toBe(parent);
    expect(built[0].extensions).toEqual(['BASIC_SETUP', 'MARKDOWN_SUPPORT', []]);

    // `markdown()` — no config object at all, so every default on its signature stands.
    expect(markdown).toHaveBeenCalledTimes(1);
    expect(markdown.mock.calls[0]).toEqual([]);
  });

  it("appends the CALLER's extension after the ruled pair, never in place of it", async () => {
    const { modules, built } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));

    engine.createView(host(), '', 'CALLER_EXTENSION' as unknown as Parameters<EditorEngine['createView']>[2]);
    expect(built[0].extensions).toEqual(['BASIC_SETUP', 'MARKDOWN_SUPPORT', 'CALLER_EXTENSION']);
  });

  it('exposes the view class itself, for the static facets a caller builds extensions from', async () => {
    const { modules } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    expect(engine.EditorView).toBe(modules.EditorView);
  });
});

describe('the REAL package, through the default loader', () => {
  it('loadCodeMirror resolves the three members the engine is built from', async () => {
    const modules = await loadCodeMirror();
    expect(typeof modules.EditorView).toBe('function');
    expect(typeof modules.markdown).toBe('function');
    expect(modules.basicSetup).toBeTruthy();
    // The update-listener facet 3.2 / 3.3 need is reachable through the `codemirror` re-export —
    // no third specifier.
    expect(typeof modules.EditorView.updateListener.of).toBe('function');
  });

  /** A view on a document, in a slot inside a shadow root — where 2.2's source slot is. */
  async function viewOn(doc: string) {
    const outer = host();
    document.body.append(outer);
    const slot = document.createElement('div');
    outer.attachShadow({ mode: 'open' }).append(slot);
    const engine = await loadEditorEngine(outer);
    const view = engine.createView(slot, doc);
    return { view, outer, slot };
  }

  // ── D-7's OPEN NOTE, MEASURED (plan §0 D-7; tasks.md 3.1) ────────────────────────────────────
  //
  // CodeMirror's document is a sequence of LINES with no memory of what separated them: every
  // `\r\n`, lone `\r` and `\n` becomes a line break, and reading the text back joins the lines
  // with `\n`. So a file's line endings do NOT survive the editor; whether the text ends in a
  // newline DOES. These rows are the finding 5.2 / 5.3 are written against — a CRLF file read
  // back out of the editor differs from what was read off disk in every line ending, which is why
  // D-7's `originalText` baseline never passes through the editor.
  const ROUND_TRIP: ReadonlyArray<{ name: string; input: string; output: string }> = [
    { name: 'LF, trailing newline', input: 'a\nb\n', output: 'a\nb\n' },
    { name: 'LF, NO trailing newline', input: 'a\nb', output: 'a\nb' },
    { name: 'CRLF, trailing newline', input: 'a\r\nb\r\n', output: 'a\nb\n' },
    { name: 'CRLF, NO trailing newline', input: 'a\r\nb', output: 'a\nb' },
    { name: 'mixed CRLF / LF / lone CR', input: 'a\r\nb\nc\rd\r\n', output: 'a\nb\nc\nd\n' },
    { name: 'lone CR only', input: 'a\rb', output: 'a\nb' },
    { name: 'empty document', input: '', output: '' },
  ];

  it.each(ROUND_TRIP)('round-trip — $name', async ({ input, output }) => {
    const { view, outer } = await viewOn(input);
    try {
      expect(view.state.doc.toString()).toBe(output);
      // The other way to read the text out — joins with the state's own line break — agrees.
      expect(view.state.sliceDoc()).toBe(output);
      expect(view.state.lineBreak).toBe('\n');
    } finally {
      view.destroy();
      outer.remove();
    }
  });

  it('round-trip — the table preserves LF input byte-for-byte and nothing with a CR in it', () => {
    // The table's own shape, so a row edited to "pass" cannot quietly change the finding.
    for (const { input, output } of ROUND_TRIP) {
      expect(output === input).toBe(!input.includes('\r'));
      expect(output.includes('\r')).toBe(false);
    }
  });

  it('text INSERTED later is normalized the same way as the seed', async () => {
    const { view, outer } = await viewOn('seed');
    try {
      view.dispatch({ changes: { from: view.state.doc.length, insert: '\r\ntyped\r\n' } });
      expect(view.state.doc.toString()).toBe('seed\ntyped\n');
    } finally {
      view.destroy();
      outer.remove();
    }
  });

  it('a view built in a shadow-root slot adopts that shadow root, and holds the seed', async () => {
    const { view, outer, slot } = await viewOn('# heading\n');
    try {
      expect(view.root).toBe(outer.shadowRoot);
      expect(view.dom.parentNode).toBe(slot);
      expect(view.state.doc.toString()).toBe('# heading\n');
    } finally {
      view.destroy();
      outer.remove();
    }
    // `destroy()` takes the view's DOM back out — 3.2's teardown relies on it.
    expect(slot.childNodes).toHaveLength(0);
  });
});
