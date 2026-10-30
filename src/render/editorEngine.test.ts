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
//      ★ 3.4 (R8) ADDS ONE THING BETWEEN THEM: the token-driven highlight style. The ruled pair is
//      still first and still unmodified, the caller's extension still last; the two exact-list
//      pins below gained that one element by human authorization (decisions.md, M12 TASK 3.4).
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
  tokenHighlightSpecs,
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

/** A stand-in highlight tag: all the engine reads of one is its name, through `String()`. */
const fakeTag = (name: string): { toString(): string } => ({ toString: () => name });

/** A stand-in default style: one spec per token the map can produce, one grouped spec, and one
 *  with no colour at all. The colours are placeholders the engine must REPLACE, never read. */
const FAKE_SPECS = [
  { tag: fakeTag('meta'), color: 'DEFAULT_META' },
  { tag: fakeTag('heading'), textDecoration: 'underline', fontWeight: 'bold' },
  { tag: [fakeTag('string'), fakeTag('deleted')], color: 'DEFAULT_STRING' },
  { tag: [fakeTag('atom'), fakeTag('url')], color: 'DEFAULT_ATOM' },
  { tag: fakeTag('invalid'), color: 'DEFAULT_INVALID' },
];

/** Stand-in modules: distinguishable values and a view class that records its config. */
function fakeModules(): {
  modules: EditorModules;
  built: RecordedConfig[];
  markdown: ReturnType<typeof vi.fn>;
  define: ReturnType<typeof vi.fn>;
  syntaxHighlighting: ReturnType<typeof vi.fn>;
} {
  const built: RecordedConfig[] = [];
  class FakeView {
    static lineWrapping = 'LINE_WRAPPING';
    constructor(config: RecordedConfig) {
      built.push(config);
    }
  }
  const markdown = vi.fn(() => 'MARKDOWN_SUPPORT');
  const define = vi.fn((specs: unknown) => ({ TOKEN_STYLE: specs }));
  const syntaxHighlighting = vi.fn(() => 'TOKEN_HIGHLIGHT');
  const modules = {
    EditorView: FakeView,
    basicSetup: 'BASIC_SETUP',
    markdown,
    markdownLanguage: 'MARKDOWN_LANGUAGE',
    HighlightStyle: { define },
    defaultHighlightStyle: { specs: FAKE_SPECS },
    syntaxHighlighting,
  } as unknown as EditorModules;
  return { modules, built, markdown, define, syntaxHighlighting };
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
  it('builds a view from basicSetup + markdown(), then its ONE addition — the token highlight (3.4)', async () => {
    const { modules, built, markdown } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    const parent = host();

    const view = engine.createView(parent, 'seed text');
    expect(built).toHaveLength(1);
    expect(view).toBeInstanceOf(modules.EditorView);
    expect(built[0].doc).toBe('seed text');
    expect(built[0].parent).toBe(parent);
    expect(built[0].extensions).toEqual(['BASIC_SETUP', 'MARKDOWN_SUPPORT', 'TOKEN_HIGHLIGHT', 'LINE_WRAPPING', []]);

    // `markdown({ base: markdownLanguage })` — R1 (decisions.md, 2026-10-05) amends "called with
    // its defaults" for `base` ALONE. The config object carries that one key, so `addKeymap`,
    // `completeHTMLTags` and `pasteURLAsLink` are still whatever the package defaults them to.
    expect(markdown).toHaveBeenCalledTimes(1);
    expect(markdown.mock.calls[0]).toEqual([{ base: 'MARKDOWN_LANGUAGE' }]);
  });

  it("appends the CALLER's extension after the ruled pair, never in place of it", async () => {
    const { modules, built } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));

    engine.createView(host(), '', 'CALLER_EXTENSION' as unknown as Parameters<EditorEngine['createView']>[2]);
    expect(built[0].extensions).toEqual([
      'BASIC_SETUP',
      'MARKDOWN_SUPPORT',
      'TOKEN_HIGHLIGHT',
      'LINE_WRAPPING',
      'CALLER_EXTENSION',
    ]);
  });

  it('3.4 — the ruled pair is unchanged and still FIRST; the highlight sits after it, before the caller', async () => {
    const { modules, built, markdown } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    engine.createView(host(), '', 'CALLER_EXTENSION' as unknown as Parameters<EditorEngine['createView']>[2]);
    const extensions = built[0].extensions as unknown[];
    expect(extensions.slice(0, 2)).toEqual(['BASIC_SETUP', 'MARKDOWN_SUPPORT']);
    expect(markdown.mock.calls[0]).toEqual([{ base: 'MARKDOWN_LANGUAGE' }]);
    expect(extensions.indexOf('TOKEN_HIGHLIGHT')).toBe(2);
    // R28 — line wrapping sits after the highlight and before the caller's extension.
    expect(extensions.indexOf('LINE_WRAPPING')).toBe(3);
    expect(extensions.at(-1)).toBe('CALLER_EXTENSION');
  });

  it('exposes the view class itself, for the static facets a caller builds extensions from', async () => {
    const { modules } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    expect(engine.EditorView).toBe(modules.EditorView);
  });
});

describe('the engine — the token-driven highlight style (3.4; R8, E-3)', () => {
  const TOKEN_COLOUR = /^var\(--(ink|muted|del)\)$/;

  it('is built ONCE per page — shared by every engine and every view — from the default style’s own specs with every colour replaced by a token', async () => {
    const { modules, built, define, syntaxHighlighting } = fakeModules();
    const engine = await loadEditorEngine(host(), () => Promise.resolve(modules));
    engine.createView(host(), 'one');
    engine.createView(host(), 'two');
    // A SECOND HOST loads a second engine from the same modules — and gets the same style. One
    // built per host is the defect: on Firefox its rules did not apply from the second host on
    // (tests/browser/editorEyeballProxy, proxy 3, is where that is seen in a real engine).
    const second = await loadEditorEngine(host(), () => Promise.resolve(modules));
    expect(second).not.toBe(engine);
    second.createView(host(), 'three');
    expect(built.map((config) => (config.extensions as unknown[])[2])).toEqual([
      'TOKEN_HIGHLIGHT',
      'TOKEN_HIGHLIGHT',
      'TOKEN_HIGHLIGHT',
    ]);

    expect(define).toHaveBeenCalledTimes(1);
    const specs = define.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(specs).toHaveLength(FAKE_SPECS.length);
    // The TAG objects are the default style's own — reused, never rebuilt. That is the whole
    // route: no tag is named through a fourth package.
    specs.forEach((spec, i) => expect(spec.tag).toBe(FAKE_SPECS[i].tag));
    expect(specs.map((spec) => spec.color)).toEqual([
      'var(--muted)', // meta
      undefined, // heading — it had no colour, and gains none
      'var(--ink)', // string / deleted
      'var(--muted)', // atom / url
      'var(--del)', // invalid
    ]);
    // A spec with no colour passes through as the SAME object; the others keep every other key.
    expect(specs[1]).toBe(FAKE_SPECS[1]);
    expect(JSON.stringify(specs)).not.toContain('DEFAULT_');
    // The default style's specs were read, not written to.
    expect(FAKE_SPECS.map((spec) => spec.color)).toEqual([
      'DEFAULT_META',
      undefined,
      'DEFAULT_STRING',
      'DEFAULT_ATOM',
      'DEFAULT_INVALID',
    ]);

    // NON-FALLBACK: the style alone, no options object. `{ fallback: true }` is how basicSetup
    // registers the default palette, and a second fallback would not displace it.
    expect(syntaxHighlighting).toHaveBeenCalledTimes(1);
    expect(syntaxHighlighting.mock.calls[0]).toEqual([{ TOKEN_STYLE: specs }]);
  });

  it('tokenHighlightSpecs over the REAL default style: every colour is a var(--token), nothing else moves', async () => {
    const { defaultHighlightStyle } = await loadCodeMirror();
    const defaults = defaultHighlightStyle.specs;
    const mapped = tokenHighlightSpecs(defaults);

    expect(mapped).toHaveLength(defaults.length);
    const coloured = mapped.filter((spec) => 'color' in spec);
    // Non-vacuity: the installed default style has fourteen coloured specs, and all were seen.
    expect(defaults.filter((spec) => 'color' in spec)).toHaveLength(14);
    expect(coloured).toHaveLength(14);
    expect(coloured.filter((spec) => !TOKEN_COLOUR.test(String(spec.color)))).toEqual([]);

    const row = (spec: (typeof mapped)[number]): string =>
      `${[spec.tag].flat().map(String).join(' ')} -> ${String(spec.color)}`;
    // The whole palette, as ruled (decisions.md, M12 TASK 3.4): markup, comments and link/task
    // furniture in --muted, invalid in --del, every other role in --ink.
    expect(coloured.map(row)).toEqual([
      'meta -> var(--muted)',
      'keyword -> var(--ink)',
      'atom bool url contentSeparator labelName -> var(--muted)',
      'literal inserted -> var(--ink)',
      'string deleted -> var(--ink)',
      'regexp escape special(string) -> var(--ink)',
      'definition(variableName) -> var(--ink)',
      'local(variableName) -> var(--ink)',
      'typeName namespace -> var(--ink)',
      'className -> var(--ink)',
      'special(variableName) macroName -> var(--ink)',
      'definition(propertyName) -> var(--ink)',
      'comment -> var(--muted)',
      'invalid -> var(--del)',
    ]);

    // Everything that is not a colour is untouched: same tags, same weight / style / decoration.
    mapped.forEach((spec, i) => {
      expect(spec.tag).toBe(defaults[i].tag);
      expect({ ...spec, color: null }).toEqual({ ...defaults[i], color: null });
    });
  });

  it('the view the ENGINE builds highlights with the token style; a view on the ruled pair alone uses the default', async () => {
    // Read from the STATE, which involves no layout: the class each view's active highlighter
    // gives the `meta` tag, and the rule that class carries in the view's own style modules.
    // `highlightingFor` is the third package's own reader — imported here, in a test, as
    // `@codemirror/lang-markdown` already is below; the fence scans shipped files only.
    const { EditorView, basicSetup, markdown, markdownLanguage, defaultHighlightStyle } = await loadCodeMirror();
    const { highlightingFor } = await import('@codemirror/language');
    const meta = defaultHighlightStyle.specs.find((spec) => String(spec.tag) === 'meta')!.tag;
    const ruleFor = (view: InstanceType<typeof EditorView>): string => {
      const cls = highlightingFor(view.state, [meta].flat());
      expect(cls, 'the view has a highlighter that styles `meta`').toBeTruthy();
      return view.state
        .facet(EditorView.styleModule)
        .map((module) => module.getRules())
        .join('\n')
        .split('\n')
        .filter((rule) => rule.startsWith(`.${cls} `))
        .join('\n');
    };

    const outer = host();
    document.body.append(outer);
    const slot = document.createElement('div');
    outer.attachShadow({ mode: 'open' }).append(slot);
    const view = (await loadEditorEngine(outer)).createView(slot, '# heading\n');
    const control = new EditorView({ doc: '# heading\n', extensions: [basicSetup, markdown({ base: markdownLanguage })] });
    try {
      expect(ruleFor(view)).toContain('color: var(--muted)');
      // THE CONTROL: the same reader on the same setup WITHOUT the engine's addition finds the
      // default palette's own literal — so the line above is the style, not a reader that sees
      // nothing. (The literal is CodeMirror's, read back; it is not a colour this repo sets.)
      expect(ruleFor(control)).toMatch(/color: #[0-9a-f]{3,6}/);
      expect(ruleFor(control)).not.toContain('var(--');
    } finally {
      control.destroy();
      view.destroy();
      outer.remove();
    }
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

  // ── PLAN §4 RISK 6, RE-MEASURED UNDER R1 (decisions.md, 2026-10-05) ──────────────────────────
  //
  // 3.1 measured this once and reported it: the default base is strict CommonMark, so GFM task
  // lists, tables and strikethrough were not syntax to the editor. R1 rules the base to
  // `markdownLanguage`. The measurement is now a committed test with both arms in it — the ruled
  // base HAS the nodes, and the base it replaced does NOT, on the same document through the same
  // walk, so the first half cannot pass on a walk that names nothing.
  const GFM_DOC = [
    '- [ ] an open task',
    '- [x] a done task',
    '',
    '| a | b |',
    '| - | - |',
    '| 1 | 2 |',
    '',
    'some ~~struck~~ text',
    '',
    'a footnote reference[^1]',
    '',
    '[^1]: the footnote body',
    '',
  ].join('\n');
  const GFM_NODES = ['Task', 'TaskMarker', 'Table', 'TableHeader', 'TableRow', 'Strikethrough'];

  /** Every node name a language's own parser produces for `doc`. */
  function nodeNames(language: { parser: { parse(input: string): { iterate(spec: { enter(node: { name: string }): void }): void } } }, doc: string): Set<string> {
    const names = new Set<string>();
    language.parser.parse(doc).iterate({ enter: (node) => void names.add(node.name) });
    return names;
  }

  it('R1 — under markdownLanguage the tree has task-list, table and strikethrough nodes; the default base has none', async () => {
    const { markdownLanguage } = await loadCodeMirror();
    const { commonmarkLanguage } = await import('@codemirror/lang-markdown');

    const ruled = nodeNames(markdownLanguage, GFM_DOC);
    const replaced = nodeNames(commonmarkLanguage, GFM_DOC);
    expect(GFM_NODES.filter((name) => !ruled.has(name))).toEqual([]);
    expect(GFM_NODES.filter((name) => replaced.has(name))).toEqual([]);
    // Both walks saw the document: the nodes the two bases share are in both.
    for (const shared of ['Document', 'BulletList', 'ListItem', 'Paragraph']) {
      expect(ruled.has(shared), `ruled: ${shared}`).toBe(true);
      expect(replaced.has(shared), `replaced: ${shared}`).toBe(true);
    }
  });

  it('R1 — footnotes are STILL not syntax, under either base (stated, not fixed)', async () => {
    const { markdownLanguage } = await loadCodeMirror();
    const { commonmarkLanguage } = await import('@codemirror/lang-markdown');
    for (const language of [markdownLanguage, commonmarkLanguage]) {
      const footnoteish = [...nodeNames(language, GFM_DOC)].filter((name) => /footnote/i.test(name));
      expect(footnoteish).toEqual([]);
    }
  });

  it('R1 — the view the ENGINE builds parses GFM; a view on the replaced default does not', async () => {
    // The two tests above measure the languages. This one measures the VIEW: the syntax tree the
    // editor state itself holds, read from the language state field. (`isActiveAt` cannot tell
    // the two bases apart — they share one language-data facet, 3.1's finding — so it is not the
    // instrument.) The field is reached through the language's own class, so no further
    // CodeMirror package is imported even here.
    const { EditorView, basicSetup, markdown, markdownLanguage } = await loadCodeMirror();
    const languageField = (markdownLanguage.constructor as unknown as { state: unknown }).state;
    type TreeHolder = { tree: { iterate(spec: { enter(node: { name: string }): void }): void } };
    const treeNames = (state: { field(f: never): unknown }): Set<string> => {
      const names = new Set<string>();
      (state.field(languageField as never) as TreeHolder).tree.iterate({
        enter: (node) => void names.add(node.name),
      });
      return names;
    };

    const { view, outer } = await viewOn(GFM_DOC);
    const control = new EditorView({ doc: GFM_DOC, extensions: [basicSetup, markdown()] });
    try {
      const ruled = treeNames(view.state);
      const replaced = treeNames(control.state);
      expect(GFM_NODES.filter((name) => !ruled.has(name))).toEqual([]);
      expect(GFM_NODES.filter((name) => replaced.has(name))).toEqual([]);
      expect(replaced.has('BulletList'), 'the control view parsed the document too').toBe(true);
    } finally {
      control.destroy();
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
