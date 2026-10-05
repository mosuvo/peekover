// editorEngine — the ONE module in the tree that imports CodeMirror (plan 012 D-2), and the load
// gate in front of it. It owns three things and nothing else: the two dynamic imports, the ruled
// setup, and the per-host memo. It builds no chrome, knows nothing about the split pane, and
// touches no file handle — the edit view is `editorView.ts`'s, wired by a later task.
//
// ── D-2: ONE IMPORTER, TWO STATIC LITERAL SPECIFIERS ──────────────────────────────────────────
//
// `import('codemirror')` and `import('@codemirror/lang-markdown')` each appear exactly once in the
// repository — below, inside {@link loadCodeMirror}. Both are static string literals, the shape
// `scripts/check-dynamic-imports.ts` sanctions, so the bundler resolves them at build time and the
// chunk they name is inside the signed package. `editorImportFence.test.ts` pins the count, the
// position and the dynamic-ness, and that the content-script graph reaches none of it.
//
// There is no THIRD specifier, and no static one — not even a type-only import. `EditorView` comes
// through the `codemirror` meta-package's own re-export, and every type this module names is
// inferred from the two dynamic edges, so no `@codemirror/state` or `@codemirror/view` is written
// here and none may be written elsewhere.
//
// ── NO FEATURE-DETECT ─────────────────────────────────────────────────────────────────────────
//
// The diagram, code and math engines load only when the document contains something for them.
// This one has no such gate: entering edit mode IS the trigger, unconditionally. What it has
// instead is "loaded once per host".
//
// ── THE SETUP IS RULED, AND IT IS THE DEFAULTS ────────────────────────────────────────────────
//
// `basicSetup` as shipped, and `markdown()` called with no argument (decisions.md, M12 TASK 1.1 and
// M12 TASK 1.1 EXTENDED). Nothing is stripped and nothing is added: no bespoke keymap, no theme, no
// language configuration. `markdown()`'s default base is strict CommonMark, so GFM tables, task
// lists and strikethrough are not recognised as syntax by the editor's highlighter — a known,
// reported consequence of the ruling, not something to configure around here.
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
 * THE two CodeMirror imports in the repository (D-2), evaluated only when an edit session asks for
 * the engine. Destructured at the import so the bundler can drop what is not named.
 */
export const loadCodeMirror = async () => {
  const [{ EditorView, basicSetup }, { markdown }] = await Promise.all([
    import('codemirror'),
    import('@codemirror/lang-markdown'),
  ]);
  return { EditorView, basicSetup, markdown };
};

/** The members of the two packages this module uses — and all it uses. Inferred from the dynamic
 *  edges above rather than imported as types, so those two edges stay the only ones. */
export type EditorModules = Awaited<ReturnType<typeof loadCodeMirror>>;

/** A function that produces the editor modules. The default one, {@link loadCodeMirror}, holds
 *  the only two CodeMirror imports in the repository. */
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
   * Build a view inside `parent`, seeded with `doc`: the ruled setup, then `extra`. `extra` is the
   * caller's own wiring (an update listener); it is appended after the setup and cannot replace it.
   * The caller owns the view and calls `destroy()` on it.
   */
  createView(parent: HTMLElement, doc: string, extra?: EditorExtension): EditorViewHandle;
}

function engineFrom({ EditorView, basicSetup, markdown }: EditorModules): EditorEngine {
  return {
    EditorView,
    createView: (parent, doc, extra = []) =>
      new EditorView({ doc, parent, extensions: [basicSetup, markdown(), extra] }),
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
