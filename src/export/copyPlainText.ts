// copyPlainText — Copy-as-plain-text, the clipboard exit for the document's own raw markdown
// source (task 3.4, D-4's plain-text half). Kept OUT of `htmlExport.ts` deliberately: that
// module's whole framing is D-3's shared clone-based serializer (`serializeReaderDocument`/
// `wrapInStandaloneDocument`; every export it carries takes a reader `host` and works off the
// ALREADY-SANITIZED clone). This control reads a different thing entirely — the document's SOURCE
// TEXT (`MarkdownFile.read()`), never the clone, never the DOM — so it gets its own small module
// rather than stretching htmlExport.ts's contract to cover a second, unrelated input shape.
//
// ── WHY A FRESH READ, NOT THE ALREADY-DISPLAYED TEXT (Q1) ───────────────────────────────────────
//
// Nothing caches the raw source after the reader renders it: `readerPane.ts`'s own `select()`
// awaits `file.read()` into a local variable used once to build that call's `paint(...)` and then
// drops it — no field on the pane, on `appShell.ts`'s `activeFile`, or anywhere else retains the
// text. So this control calls `file.read()` again, itself, at copy time.
//
// That reopens a question this milestone's watch feature (spec 005) makes real, not hypothetical:
// a file can change on disk while it is open, so a fresh read at copy-time COULD return bytes
// newer than whatever is currently painted on screen. That is DELIBERATE here, and it is not the
// "file A's text under file B's name" cross-feed class `readerPane.ts`'s own `stopWatch()` comment
// guards against — this never mixes two DIFFERENT documents' bytes, only ever returns ONE
// document's OWN latest bytes. §4's own line settles which bytes those must be: *"copy the raw
// source text exactly as authored ... read directly, never re-derived from rendered DOM."* The
// file is the source of truth here, not the screen — copying the freshest authored bytes honors
// "exactly as authored" more faithfully than reproducing whatever the screen happened to show at
// an earlier render, and the alternative (deriving source from the rendered clone) is the thing §4
// forbids outright. Recorded in `decisions.md`.

/** The one capability this control needs from the currently-open document — `folderSource.ts`'s
 *  `MarkdownFile` satisfies this structurally, so it is passed straight through with no import
 *  across the app/export boundary and no adapter. */
export interface ReadableSource {
  read(): Promise<string>;
}

/**
 * The write, as a promise that never throws synchronously — 008 D-10's `tableTools.ts`
 * `writeToClipboard` shape, REPRODUCED here rather than imported (that helper is module-local, and
 * this is a second, independent call site under the same rule-of-three `exportControls.ts`'s own
 * doc comment already applies to its focus trap). `navigator.clipboard` is `undefined` outside a
 * secure context, so the property read alone can throw a `TypeError` one line before `writeText`
 * is even called; `writeText` itself may also throw before it returns a promise. Both collapse
 * into ONE rejection shape, so `copyAsPlainText`'s caller has exactly one failure to handle.
 */
function writeTextToClipboard(text: string): Promise<void> {
  try {
    const clipboard = navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      return Promise.reject(new Error('the clipboard is unavailable'));
    }
    return Promise.resolve(clipboard.writeText(text));
  } catch (err) {
    return Promise.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Copy-as-plain-text — the clipboard exit for the raw authored source (task 3.4). Reads
 * `source.read()` FRESH (Q1 above — never the already-rendered text, never a cache) and writes the
 * result to the clipboard verbatim via `navigator.clipboard.writeText`, the already-permission-free
 * path (D-4; re-confirmed at this task, the same transient-activation finding 007/008 established).
 * A rejected READ never reaches the write (AGENTS.md #5 — no false success from a copy that never
 * happened); a rejected WRITE is rethrown, never swallowed, matching `copyAsHtml`'s own contract.
 *
 * @param source The currently-open document — `appShell.ts`'s `activeFile`.
 */
export async function copyAsPlainText(source: ReadableSource): Promise<void> {
  const text = await source.read();
  await writeTextToClipboard(text);
}
