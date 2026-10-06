// editorEngine — the ONE module in the tree that imports CodeMirror (plan 012 D-2), and the load
// gate in front of it. It owns four things and nothing else: the three dynamic imports, the ruled
// setup, the token-driven highlight style, and the per-host memo. It builds no chrome, knows
// nothing about the split pane, and touches no file handle — the edit view is `editorView.ts`'s,
// wired by `editorEnhancer.ts`.
//
// ── D-2: ONE IMPORTER, THREE STATIC LITERAL SPECIFIERS ────────────────────────────────────────
//
// `import('codemirror')`, `import('@codemirror/lang-markdown')` and `import('@codemirror/language')`
// each appear exactly once in the repository — below, inside {@link loadCodeMirror}. All are
// static string literals, the shape `scripts/check-dynamic-imports.ts` sanctions, so the bundler
// resolves them at build time and the chunk they name is inside the signed package.
// `editorImportFence.test.ts` pins the count, the position and the dynamic-ness, and that the
// content-script graph reaches none of it.
//
// The third was added at task 3.4 by human ruling R8 (decisions.md, "M12 RULINGS after task 4.1"),
// for the highlight style below. There is no FOURTH specifier, and no static one — not even a
// type-only import. `EditorView` comes through the `codemirror` meta-package's own re-export, and
// every type this module names is inferred from the three dynamic edges, so no
// `@codemirror/state`, `@codemirror/view` or `@lezer/highlight` is written here and none may be
// written elsewhere. `@codemirror/language` is a direct dependency at the SAME version the
// `codemirror` meta-package resolves: CodeMirror matches extensions by object identity, so a
// second copy of it would build a highlight style the editor silently ignores.
//
// ── NO FEATURE-DETECT ─────────────────────────────────────────────────────────────────────────
//
// The diagram, code and math engines load only when the document contains something for them.
// This one has no such gate: entering edit mode IS the trigger, unconditionally. What it has
// instead is "loaded once per host".
//
// ── THE SETUP IS RULED: THE DEFAULTS, AND ONE NAMED BASE ──────────────────────────────────────
//
// `basicSetup` as shipped, and `markdown({ base: markdownLanguage })` (decisions.md: M12 TASK 1.1,
// M12 TASK 1.1 EXTENDED, and the 2026-10-05 task-3.2 ruling R1 that amends the second for `base`
// alone). `markdown()`'s own default base is strict CommonMark, under which GFM tables, task lists
// and strikethrough are not syntax to the editor's highlighter; `markdownLanguage` is the same
// package's GFM-configured language, reached through the same permitted specifier. That one key
// is the whole of the configuration: `addKeymap`, `completeHTMLTags` and `pasteURLAsLink` are not
// named and stay at the package's defaults. Nothing else is stripped — no bespoke keymap, no
// theme — and ONE thing is added after the pair, below. Footnotes are syntax under NEITHER base;
// that is reported, not configured around.
//
// ── THE HIGHLIGHT STYLE: THE DEFAULT ONE, WITH EVERY COLOUR A DESIGN TOKEN (3.4; R8, E-3) ─────
//
// `basicSetup` registers CodeMirror's default highlight style as a FALLBACK. It is a light-page
// palette of literal colours, and on the dark pane it read 1.24–2.15:1. This module registers a
// second, non-fallback style after the ruled pair, which displaces the fallback entirely.
//
// It is built FROM the default style rather than written out: `defaultHighlightStyle.specs` is
// mapped spec for spec, the `tag` objects reused as they are, and only a `color` replaced. That
// is what keeps `@lezer/highlight` — where the tags are defined — out of this file: naming a tag
// would need a fourth specifier. A tag is recognised by its name, read with `String()`.
//
// THE PALETTE IS TWO-TONE, by human ruling (decisions.md, M12 TASK 3.4). On `--code-bg` only
// `--ink` and `--muted` clear WCAG AA for text in BOTH themes, so the fourteen coloured roles of
// the default style map onto those two: markup marks, comments and link / task furniture
// ({@link MUTED_TAGS}) draw in `--muted`, `invalid` in `--del`, and every other role in `--ink`.
// What the default style says with weight, slant and decoration — headings, emphasis, strong,
// links, strikethrough — is untouched, and is now what carries the structure. A coloured spec a
// later version adds falls to `--ink`.
//
// ── THE MEMO, AND WHAT A FAILURE DOES TO IT ───────────────────────────────────────────────────
//
// {@link loadEditorEngine} keeps one promise per host in a WeakMap, so a second entry into edit on
// the same host resolves the SAME promise and starts no second load; the entry goes with the host
// when the host is collected. A REJECTED load is evicted as it settles: every caller already
// waiting on it sees the rejection, and the next call starts a fresh load. A failure is therefore
// retryable by simply asking again, and is never remembered.
//
// The loader is injectable for the same reason `diagramEngine.ts`'s is: a unit test can then count
// the calls of a spy it owns.

/**
 * THE three CodeMirror imports in the repository (D-2, R8), evaluated only when an edit session
 * asks for the engine. Destructured at the import so the bundler can drop what is not named.
 */
export const loadCodeMirror = async () => {
  const [
    { EditorView, basicSetup },
    { markdown, markdownLanguage },
    { HighlightStyle, defaultHighlightStyle, syntaxHighlighting },
  ] = await Promise.all([
    import('codemirror'),
    import('@codemirror/lang-markdown'),
    // Named in a `.then` on the import ITSELF: that is a shape the bundler can read, so it keeps
    // these three exports and drops the rest of the package. Destructured only out of the
    // `Promise.all` result, as the two edges above are, the whole namespace is retained — for
    // this package that was 10,883 B of exports nothing uses (measured at 3.4, both engines).
    import('@codemirror/language').then(
      ({ HighlightStyle, defaultHighlightStyle, syntaxHighlighting }) => ({
        HighlightStyle,
        defaultHighlightStyle,
        syntaxHighlighting,
      }),
    ),
  ]);
  return {
    EditorView,
    basicSetup,
    markdown,
    markdownLanguage,
    HighlightStyle,
    defaultHighlightStyle,
    syntaxHighlighting,
  };
};

/** The members of the three packages this module uses — and all it uses. Inferred from the
 *  dynamic edges above rather than imported as types, so those edges stay the only ones. */
export type EditorModules = Awaited<ReturnType<typeof loadCodeMirror>>;

/** One entry of a highlight style: a tag or tags, and the CSS they are drawn with. */
export type HighlightSpec = EditorModules['defaultHighlightStyle']['specs'][number];

/** The default style's roles that draw in `--muted`: markdown's own marks (`meta`), comments, and
 *  the link / task-list / rule furniture the default style colours as one group. */
const MUTED_TAGS: readonly string[] = [
  'meta',
  'comment',
  'atom',
  'bool',
  'url',
  'contentSeparator',
  'labelName',
];

/** The design token a spec's colour becomes — see the module comment's palette. */
function highlightToken(spec: HighlightSpec): string {
  const names = [spec.tag].flat().map(String);
  if (names.includes('invalid')) return '--del';
  return names.some((name) => MUTED_TAGS.includes(name)) ? '--muted' : '--ink';
}

/**
 * A highlight style's specs with every `color` replaced by a design token. A spec with no colour
 * is returned as it is; a coloured one is copied, its tags and every other property kept.
 */
export function tokenHighlightSpecs(specs: readonly HighlightSpec[]): HighlightSpec[] {
  return specs.map((spec) =>
    'color' in spec ? { ...spec, color: `var(${highlightToken(spec)})` } : spec,
  );
}

/** A function that produces the editor modules. The default one, {@link loadCodeMirror}, holds
 *  the only three CodeMirror imports in the repository. */
export type EditorModuleLoader = () => Promise<EditorModules>;

/** A constructed editor view. */
export type EditorViewHandle = InstanceType<EditorModules['EditorView']>;

/** Anything CodeMirror accepts as an extension. */
export type EditorExtension = EditorModules['basicSetup'];

/** The loaded engine: what a caller needs to put an editor in an element, and no more. */
export interface EditorEngine {
  /** The view class, for the static facets a caller builds its own extensions from
   *  (`EditorView.updateListener`), so no other module has to import it. */
  readonly EditorView: EditorModules['EditorView'];
  /**
   * Build a view inside `parent`, seeded with `doc`: the ruled setup, the token-driven highlight
   * style, then `extra`. `extra` is the caller's own wiring (an update listener); it is appended
   * after the rest and cannot replace it. The caller owns the view and calls `destroy()` on it.
   */
  createView(parent: HTMLElement, doc: string, extra?: EditorExtension): EditorViewHandle;
}

/** Per default style: the token-driven highlight extension built from it. ONE per page — the
 *  default style is a module singleton, so every engine, for every host, gets the same one. */
const tokenHighlights = new WeakMap<object, EditorExtension>();

/**
 * The token-driven highlight extension, built once and shared by every engine.
 *
 * NOT once per engine. A highlight style owns generated class names and a set of CSS rules, and
 * CodeMirror keeps every view's rules in ONE constructed stylesheet per document, adopted by each
 * shadow root a view is built in. A style built per host therefore inserted a fresh set of rules
 * into that shared sheet for every host — and on Firefox, rules inserted once the sheet had
 * already been in use did not apply in the next root: from the second host on, the editor drew
 * with no highlight styling at all (measured at 3.4, both in the rules — present — and on screen).
 * One style per page is inserted once, beside the engine's own, as the default style always was.
 */
function tokenHighlightFor({
  HighlightStyle,
  defaultHighlightStyle,
  syntaxHighlighting,
}: EditorModules): EditorExtension {
  let extension = tokenHighlights.get(defaultHighlightStyle);
  if (!extension) {
    // No options object: a `fallback` style would sit beside the default palette `basicSetup`
    // registered instead of displacing it.
    extension = syntaxHighlighting(
      HighlightStyle.define(tokenHighlightSpecs(defaultHighlightStyle.specs)),
    );
    tokenHighlights.set(defaultHighlightStyle, extension);
  }
  return extension;
}

function engineFrom(modules: EditorModules): EditorEngine {
  const { EditorView, basicSetup, markdown, markdownLanguage } = modules;
  const tokenHighlight = tokenHighlightFor(modules);
  return {
    EditorView,
    createView: (parent, doc, extra = []) =>
      new EditorView({
        doc,
        parent,
        extensions: [basicSetup, markdown({ base: markdownLanguage }), tokenHighlight, extra],
      }),
  };
}

/** Per host: its load, pending or resolved. Never a rejected one — see {@link loadEditorEngine}. */
const loads = new WeakMap<HTMLElement, Promise<EditorEngine>>();

/**
 * Load the engine for `host`, once. Two calls for one host return the SAME promise; a different
 * host gets its own. A load that rejects is dropped from the memo as it settles, so the call after
 * a failure retries — the rejection itself still reaches everyone who was waiting on it.
 *
 * `loader` is injectable for tests; production callers pass nothing and get {@link loadCodeMirror}.
 * It is consulted only when the host has no load yet.
 */
export function loadEditorEngine(
  host: HTMLElement,
  loader: EditorModuleLoader = loadCodeMirror,
): Promise<EditorEngine> {
  const cached = loads.get(host);
  if (cached) return cached;
  // An async wrapper, so a loader that throws before returning a promise is a rejection too.
  const load = (async () => engineFrom(await loader()))();
  loads.set(host, load);
  load.catch(() => {
    if (loads.get(host) === load) loads.delete(host);
  });
  return load;
}
