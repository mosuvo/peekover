// htmlExport — D-3's shared serializer. `serializeReaderDocument` clones the ALREADY-sanitized
// `.peekover-reader` shadow-root subtree (no re-parse, no new sanitizer surface — AGENTS.md #3
// is satisfied by construction: cloneNode never touches innerHTML); `wrapInStandaloneDocument`
// bundles that clone with a translated copy of the reader's own stylesheet into a standalone
// document. Both 3.1 (HTML export) and 3.3 (Copy-as-HTML) consume this pair — SAME artifact,
// different sink (spec §4: "the SAME standalone HTML").
//
// ── NO IMAGE RESOLUTION HERE — DROPPED BY THE §3.1 GATE RULING (decisions.md, 2026-08-29) ───────
//
// This module used to also compute `collectLocalImages`/`LocalImageRef`, a pure path-math walk
// resolving local `<img>` references against the open document's path, feeding a Base64-embed
// step neither this task nor any other in M10 still performs. The human ruling that dropped
// local-image embedding from M10 (local raster images ship exactly as `.peekover-reader`'s clone
// already carries them — broken/unrewritten, the SAME state the app-page reader itself already
// shows today, not a new regression) named that resolution machinery orphaned and recommended its
// removal land with task 3.1's own implementation, since 3.1 already touches this file. Removed
// here: `collectLocalImages`, `LocalImageRef`, `resolveRelativePath`, `isAbsoluteUrl`, and the
// `documentPath` parameter that existed only to feed that resolution. `serializeReaderDocument`
// now takes only `host` and returns only `{ clone, theme }`.
//
// ── WHY THE STYLESHEET NEEDS TRANSLATING AT ALL — FINDING (b), task 2.1 (decisions.md) ─────────
//
// `readerCss.ts`'s `READER_CSS` is written for a SHADOW ROOT: its design tokens, base layout and
// every conditional (theme, mode, diff, watch, network, TOC) are scoped through `:host`, which
// resolves to nothing outside a shadow tree. A standalone exported document has no shadow root, so
// bundling `READER_CSS` verbatim would ship rules that never apply — task 2.1 found this and
// flagged the translation as new, reviewable scope (not a silent addition; see decisions.md's M10
// task-2.1 entry and progress.md's "finding (b)"). 2.1's own grep counted 26 `:host` rule sites —
// but that grep ran over the WHOLE `readerCss.ts` FILE, which also exports `CONTAINED_CSS` (see
// below); 25 of the 26 live in `READER_CSS` itself, the only stylesheet this module ever reads.
//
// ── THE TRANSLATION IS DERIVED LIVE, NEVER A COMMITTED SECOND COPY ──────────────────────────────
//
// `translateReaderStylesheet` below reads `READER_CSS`'s OWN text at call time and reclassifies
// each `:host`-scoped rule by ONE mechanical, general rule (no per-site table, no hand-authored
// exceptions) — see its own doc comment. There is therefore only ONE copy of the stylesheet's
// source text in this codebase; nothing here can silently desync from a `readerCss.ts` edit the
// way a committed translated-CSS artifact could. `htmlExport.test.ts`'s drift-guard test still
// exists, because "derived live" protects against desync but not against the PARSER silently
// mis-modeling a `readerCss.ts` shape it was not written for — the guard pins the live rule count
// so an unexpected shape change is caught (see that test for the ablation proof).
//
// ── WHAT IS DELIBERATELY NOT FED INTO THE TRANSFORM: `CONTAINED_CSS` ────────────────────────────
//
// `readerCss.ts` also exports `CONTAINED_CSS`, a SECOND stylesheet injected only when a caller
// mounts with `{ contained: true }` (the app page's shell-region reader pane). Its own `:host{
// position:relative; inset:auto; }` rule (readerCss.ts's own "CONTAINED variant" section) undoes
// the full-page takeover for THAT context — it has nothing to do with print and nothing to do with
// a standalone export, which is neither a shadow-root full-page takeover nor an app-page shell
// pane; it is a THIRD context this module owns. Only `READER_CSS`'s text is ever translated here.

import { READER_CSS } from '../theme/readerCss';
import { MATH_CSS } from '../theme/mathCss';
import type { EffectiveTheme } from '../settings/settings';

export interface SerializedReaderDocument {
  /** A DETACHED clone of `.peekover-reader` — the live tree is never mutated (only read). */
  clone: HTMLElement;
  /** The theme painting on `host` at serialization time — `wrapInStandaloneDocument`'s theme arg. */
  theme: EffectiveTheme;
}

const KNOWN_THEMES: readonly EffectiveTheme[] = ['light', 'dark', 'sepia'];

/** The effective theme currently painting on a reader host — `readerCss.ts`'s own token blocks key
 *  off exactly this attribute (`theme/reader.ts`'s `applyColorScheme`). Absent/unrecognized → the
 *  base (light) tokens, matching `resolveTheme`'s own default. */
function currentTheme(host: HTMLElement): EffectiveTheme {
  const attr = host.getAttribute('data-theme');
  return (KNOWN_THEMES as readonly string[]).includes(attr ?? '') ? (attr as EffectiveTheme) : 'light';
}

/**
 * Clone the sanitized `.peekover-reader` subtree out of `host`'s shadow root. No re-parse, no new
 * sanitizer profile — `cloneNode(true)` walks already-sanitized nodes; the only string built from
 * any of this is `wrapInStandaloneDocument`'s own serialization, taken AFTER cloning (AGENTS.md #3
 * satisfied by construction). Every `<img>` — local or remote — ships in the clone exactly as
 * sanitize/`mediaPolicy` produced it; no image resolution happens here (see the module doc comment).
 *
 * @param host The shadow-root-owning reader host to serialize.
 */
export function serializeReaderDocument(host: HTMLElement): SerializedReaderDocument {
  const column = host.shadowRoot?.querySelector<HTMLElement>('.peekover-reader');
  if (!column) {
    throw new Error("serializeReaderDocument: no '.peekover-reader' in this host's shadow root");
  }
  const clone = column.cloneNode(true) as HTMLElement;
  return { clone, theme: currentTheme(host) };
}

// ============================================================================
// THE :host TRANSLATION — one mechanical rule, derived live from READER_CSS.
// ============================================================================
//
// Every rule in READER_CSS falls into exactly one of two buckets:
//
//   NOT :host-scoped  — the typography/table/code/diagram rules that target the reading column's
//     OWN classes. These ship byte-for-byte unchanged: D-3's original "bundle the stylesheet"
//     framing already covers them, and finding (b) is about `:host` specifically, not a general
//     dead-code pass over chrome the clone never carries (e.g. `.peekover-diagram-lightbox`'s
//     plain-selector rules ship unchanged too, unconditionally — out of THIS task's scope).
//
//   :host-scoped — reclassified by ONE rule, general over every current AND future `:host` site,
//     not a per-line table:
//
//     • NO attribute predicate (`:host`, `:host *`, `:host :focus-visible`, `:host{ --toc-w:… }`,
//       …) → CARRY. `:host` is replaced with `body`, unconditionally. This is the wrapper's own
//       box — design tokens, the full-bleed base, the box-sizing/focus/selection reset, the
//       reduced-motion override. (One token this carries with nothing left to consume it —
//       `--toc-w`, since the TOC never rides into a standalone export — is accepted as harmless
//       dead weight rather than special-cased out: a bare `:host` custom-property declaration does
//       not "match nothing" the way a dead SELECTOR would, and a per-token exception is exactly the
//       hand-authored carve-out this mechanical rule exists to avoid.)
//     • `:host([data-theme="…"])` → RESOLVE. Kept — with the predicate stripped — IFF its value
//       equals the export's OWN theme (baked once, at serialization time; there is no live theme
//       toggle in a static file). The other two theme blocks are dropped entirely, not shipped
//       inert: an export carries exactly one theme, forever.
//     • `:host([data-ATTR="…"])` for any OTHER attribute (`data-mode`, `data-diff`, `data-watch`,
//       `data-network`, `data-toc`, or any attribute a future readerCss.ts edit adds) → DROP,
//       unconditionally. None of these states is ever baked onto the export's wrapper — a static
//       file has no raw/reading toggle, no diff overlay, no watch status, no network indicator, no
//       collapsible TOC, and (per `serializeReaderDocument`'s own clone target) none of their
//       SUBJECT elements — `.peekover-toc`, `.peekover-watch`, `.peekover-net`,
//       `.peekover-diff-affordance`, `.peekover-raw` — ride into the clone at all, since it clones
//       ONLY `.peekover-reader`, never its shadow-root siblings. A rule gated on one of these
//       attributes is therefore dropped rather than translated into a selector proven to match
//       nothing (`:host([data-toc="open"]) .peekover-reader` is the sharpest case: its SUBJECT,
//       `.peekover-reader`, DOES survive the clone, but the STATE gating it — an open TOC — can
//       never occur in a file with no TOC to open, so translating it unconditionally would apply a
//       TOC-reserved margin to a reader that has no TOC, a real rendering defect, not a no-op).

/** One classified `:host` rule (or a pass-through non-`:host` rule) after translation. `null` marks
 *  a dropped rule — filtered out before the output is assembled. */
type ClassifiedRule = { selector: string; body: string } | null;

/** Strip `/* … *‍/` comments before parsing rules — the doc-prose in READER_CSS mentions `:host` in
 *  17 places (task 2.1's own grep) that are not selectors at all; comments also cost export bytes
 *  for no reason once this text is no longer riding inside the shipped bundle's own minifier-blind
 *  template literal. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Split a flat (non-`@media`-nested) chunk of CSS into `{selector, body}` rules. READER_CSS uses
 *  no nesting beyond one `@media`/`@keyframes` level (verified by the residual check below), so a
 *  rule is simply "text up to `{`, then text up to the matching `}`" with no braces inside either
 *  part. KNOWN LIMIT, stated rather than silently assumed: this is not a general CSS parser — a
 *  nested `@media` (an `@media` block containing another `@media` block) would NOT reliably throw;
 *  READER_CSS has never done this and the drift guard's own pinned rule count is the practical
 *  guard against a shape change this parser was not written for. */
function parseFlatRules(css: string): { rules: { selector: string; body: string }[]; residual: string } {
  const rules: { selector: string; body: string }[] = [];
  const residual = css.replace(/([^{}]+)\{([^{}]*)\}/g, (_m, sel: string, body: string) => {
    rules.push({ selector: sel.trim(), body });
    return '';
  });
  return { rules, residual };
}

/** Pull every `@media (...) { … }` block out of `css`, parsing its (flat) interior as rules too.
 *  Returns the leftover text with every matched block removed, plus each block's condition + rules. */
function extractMediaBlocks(css: string): {
  plain: string;
  media: { condition: string; rules: { selector: string; body: string }[] }[];
} {
  const media: { condition: string; rules: { selector: string; body: string }[] }[] = [];
  const plain = css.replace(
    /@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g,
    (_m, condition: string, inner: string) => {
      const { rules, residual } = parseFlatRules(inner);
      if (residual.trim() !== '') {
        throw new Error('translateReaderStylesheet: unparsed text inside an @media block');
      }
      media.push({ condition: condition.trim(), rules });
      return '';
    },
  );
  return { plain, media };
}

/** Pull every `@keyframes name { … }` block out of `css` untouched — animation keyframes never
 *  carry a `:host` selector (verified: `readerCss.ts`'s three `@keyframes` blocks are pure
 *  percentage/from/to steps), so they need no classification, only pass-through preservation. Like
 *  `extractMediaBlocks`, this assumes exactly one level of nesting inside the block. */
function extractKeyframeBlocks(css: string): { plain: string; keyframes: string[] } {
  const keyframes: string[] = [];
  const plain = css.replace(
    /@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,
    (whole: string) => {
      if (/:host/.test(whole)) {
        throw new Error('translateReaderStylesheet: unexpected :host inside an @keyframes block');
      }
      keyframes.push(whole);
      return '';
    },
  );
  return { plain, keyframes };
}

/** Pull the `@page { … }` block out of `css` untouched — 010 D-7's print-mode addition, one level
 *  of nesting deeper than `@media`/`@keyframes` (its own `@top-center`/`@bottom-center` margin-box
 *  at-rules), so it needs its own extractor rather than reusing either. `@page` never carries a
 *  `:host` selector (there is no element context inside a page-box rule for `:host` to mean
 *  anything), so — like keyframes — this is pass-through preservation only: a standalone HTML
 *  export SHOULD carry the page-number/header/footer rule when the user prints the exported file
 *  directly, exactly as printing the live reader would. */
function extractPageBlocks(css: string): { plain: string; pageBlocks: string[] } {
  const pageBlocks: string[] = [];
  const plain = css.replace(/@page[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (whole: string) => {
    if (/:host/.test(whole)) {
      throw new Error('translateReaderStylesheet: unexpected :host inside an @page block');
    }
    pageBlocks.push(whole);
    return '';
  });
  return { plain, pageBlocks };
}

/** Classify + translate one rule against `theme`. `null` selector text on a `:host([data-attr=…])`
 *  match with a NON-theme attribute (or a non-matching theme value) signals DROP. */
function classifyRule(
  rule: { selector: string; body: string },
  theme: EffectiveTheme,
): ClassifiedRule {
  const { selector, body } = rule;
  if (!selector.includes(':host')) return { selector, body }; // pass through unchanged
  const attrMatch = selector.match(/:host\(\[data-([a-z-]+)="([^"]+)"\]\)/);
  if (!attrMatch) {
    // Bare :host (no attribute predicate) — CARRY, unconditionally.
    return { selector: selector.split(':host').join('body'), body };
  }
  const [full, attr, value] = attrMatch;
  if (attr !== 'theme' || value !== theme) return null; // DROP
  const remainder = selector.replace(full, '').trim();
  return { selector: remainder ? `body ${remainder}` : 'body', body };
}

/** Render a list of classified rules back to CSS text, dropped ones already filtered out. */
function renderRules(rules: ClassifiedRule[]): string {
  return rules
    .filter((r): r is { selector: string; body: string } => r !== null)
    .map((r) => `${r.selector}{${r.body}}`)
    .join('\n');
}

/** Diagnostics surfaced for the drift-guard test (htmlExport.test.ts) — never consumed in
 *  production. `hostSiteCount` is the number of `:host`-scoped rules the LIVE READER_CSS text
 *  actually carried at call time (2.1's own finding pins it at 26); a `readerCss.ts` edit that
 *  adds, removes, or reshapes a `:host` rule moves this number on the very next call — there is no
 *  separate copy for it to desync from. */
export interface TranslationDiagnostics {
  hostSiteCount: number;
  carried: number;
  resolved: number;
  dropped: number;
}

/**
 * Derive, LIVE from `READER_CSS`'s own text, the stylesheet a standalone export should ship — see
 * the module-level doc comment above for the one mechanical rule this applies. Throws if
 * `READER_CSS` no longer matches the flat-plus-one-@media/@keyframes/@page-level shape the parser
 * assumes (a structural change, not a silent mistranslation) — the residual checks below are
 * exact. `@page` (010 D-7) is extracted and carried verbatim, the same pass-through treatment
 * `@keyframes` already gets, for the same reason: neither ever carries a `:host` selector.
 */
export function translateReaderStylesheet(
  theme: EffectiveTheme,
  source: string = READER_CSS,
): { css: string; diagnostics: TranslationDiagnostics } {
  const stripped = stripCssComments(source);
  const { plain: withoutKeyframes, keyframes } = extractKeyframeBlocks(stripped);
  const { plain: withoutPage, pageBlocks } = extractPageBlocks(withoutKeyframes);
  const { plain, media } = extractMediaBlocks(withoutPage);
  const { rules: flatRules, residual } = parseFlatRules(plain);
  if (residual.trim() !== '') {
    throw new Error('translateReaderStylesheet: unparsed text at the top level of READER_CSS');
  }

  let hostSiteCount = 0;
  let carried = 0;
  let resolved = 0;
  let dropped = 0;
  const tally = (rule: { selector: string; body: string }, out: ClassifiedRule) => {
    if (!rule.selector.includes(':host')) return;
    hostSiteCount++;
    if (out === null) dropped++;
    else if (/^:host\(\[data-theme=/.test(rule.selector)) resolved++;
    else carried++;
  };

  const flatOut = flatRules.map((r) => {
    const c = classifyRule(r, theme);
    tally(r, c);
    return c;
  });

  const mediaOut = media
    .map((block) => {
      const inner = block.rules.map((r) => {
        const c = classifyRule(r, theme);
        tally(r, c);
        return c;
      });
      const rendered = renderRules(inner);
      // The space is load-bearing: `condition` is trimmed, so `@media${condition}` gave
      // `@mediaprint` / `@mediascreen and …` — unknown at-rules the engine drops (walk fix 8.1a).
      return rendered ? `@media ${block.condition}{${rendered}}` : '';
    })
    .filter((s) => s !== '');

  const css = [renderRules(flatOut), ...mediaOut, ...keyframes, ...pageBlocks]
    .filter((s) => s !== '')
    .join('\n');
  return { css, diagnostics: { hostSiteCount, carried, resolved, dropped } };
}

/**
 * The export's own override, appended after the translated sheet (walk fix 8.1d) — the same move
 * `CONTAINED_CSS` makes for the app page's pane. The reader's base rule puts its box at
 * `position:fixed;inset:0;overflow:auto`; translated onto the root's body, the overflow passes to
 * the viewport, and a fixed body gives the viewport nothing to scroll, so the file showed one screen.
 * A static body is the normal page and scrolls the normal way. Smaller than a scrolling wrapper,
 * and it leaves the body that the theme and print rules already target as the one box.
 */
const EXPORT_BODY_CSS = 'body{position:static}';

/**
 * Strip the reader's controls out of a detached clone (walk fix 8.1d): a static file has no script
 * to run them. Every `<button>` goes, except that a table's sort button is unwrapped to its header
 * text (the text lives inside it). Groups, live-status regions and the table tool row go too. What
 * a removed control was hiding comes back: rows a filter hid, and a code block's collapse. The
 * task-list checkboxes stay — disabled, they are the document's own content, not a control.
 */
function stripControls(clone: HTMLElement): void {
  for (const sort of clone.querySelectorAll('th > button.peekover-table-sort')) {
    sort.querySelectorAll('.peekover-table-sort__state, .peekover-table-sort__glyph').forEach((s) => s.remove());
    sort.replaceWith(...sort.childNodes);
  }
  clone
    .querySelectorAll(
      'button, [role="group"], [role="toolbar"], [role="status"], .peekover-table-tools, .peekover-table-filter__empty',
    )
    .forEach((el) => el.remove());
  clone.querySelectorAll('table tr[hidden]').forEach((row) => row.removeAttribute('hidden'));
  clone.querySelectorAll('[data-code-state]').forEach((el) => el.removeAttribute('data-code-state'));
}

/**
 * Wrap a serialized clone into a standalone HTML document: doctype, a `<style>` carrying the
 * TRANSLATED stylesheet (per the module-level doc comment), and the clone itself. `:host`
 * translates to `body` (see `classifyRule`), so the wrapper IS the document's own `<body>` — no
 * extra wrapper element, matching D-3's interpretation note ("a bundled `<style>` block, never
 * per-node inline `style` attributes").
 *
 * The clone is stripped of its controls in place (`stripControls`). When it carries math, the math
 * sheet rides along verbatim (every selector is already `.peekover-reader`-scoped, no `:host`): it
 * holds the rule that hides a rendered formula's source `<pre>`, and Temml's layout rules.
 */
export function wrapInStandaloneDocument(clone: HTMLElement, theme: EffectiveTheme): string {
  stripControls(clone);
  const math = clone.querySelector('[data-math]') ? `\n${MATH_CSS}` : '';
  const css = `${translateReaderStylesheet(theme).css}\n${EXPORT_BODY_CSS}${math}`;
  return (
    '<!doctype html>\n' +
    '<html>\n<head>\n<meta charset="utf-8">\n' +
    `<style>${css}</style>\n` +
    `</head>\n<body>\n${clone.outerHTML}\n</body>\n</html>\n`
  );
}

/**
 * Download `text` as a file named `filename`, via a `blob:` URL and a synthetic anchor click — no
 * `downloads` permission needed (the click itself carries transient activation; MDN's own
 * `<a download>` contract). `diagramView.ts`'s `downloadDiagramAsSvg` established this exact shape
 * for 007's diagram-download control, reused verbatim here rather than re-derived: the anchor is
 * inserted before it is clicked and removed straight after (a detached anchor's `download` fires
 * inconsistently across engines), and revocation is deferred a task so the engine has taken the
 * blob before the URL dies.
 */
export function downloadAs(text: string, filename: string, mimeType = 'text/html'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * HTML export — the file-download exit (task 3.1). Reuses 2.2's serializer/wrapper unchanged: no
 * re-parse, no second serialization path, no image walk. Every `<img>` — local or remote — ships
 * exactly as `serializeReaderDocument`'s clone carried it, per the §3.1 gate ruling (see the module
 * doc comment): a local relative reference is broken/unrewritten, the SAME state the app-page
 * reader itself already shows today for that reference, not a new regression.
 *
 * @param host     The shadow-root-owning reader host to export.
 * @param basename The exported file's name, without extension (e.g. `intro` for `intro.md`) — the
 *   caller's job to supply (the currently-open document's own name), since this module has no
 *   document-identity concept of its own now that image-path resolution is gone.
 */
export function exportHtml(host: HTMLElement, basename: string): void {
  const { clone, theme } = serializeReaderDocument(host);
  const doc = wrapInStandaloneDocument(clone, theme);
  downloadAs(doc, `${basename}.html`);
}

/**
 * The `text/plain` fallback for `copyAsHtml`'s `ClipboardItem` — the clone's OWN RENDERED text, not
 * the raw markdown source. This is deliberate: the raw source is task 3.4's distinct payload (§4:
 * "copy the raw source text exactly as authored"). If this fallback read the source instead, it
 * would be byte-identical to 3.4's whole payload — the same two-paths-same-bytes redundancy the
 * §3.1(cont.) ZIP ruling removed. `text/html` + `text/plain` here are the SAME content (the clone) in
 * two formats, the standard `ClipboardItem` idiom — not two different sources.
 */
function plainTextOf(clone: HTMLElement): string {
  return clone.textContent ?? '';
}

/**
 * Copy-as-HTML — the clipboard exit (task 3.3). SAME artifact as `exportHtml`: reuses 2.2's
 * serializer/wrapper unchanged, no second serialization path, no image walk. Writes a two-format
 * `ClipboardItem` (D-4) — `text/html` carrying the SAME standalone document `exportHtml` downloads,
 * `text/plain` carrying the clone's rendered text as a readable fallback (see `plainTextOf` above).
 * Permission-free: `navigator.clipboard.write()` needs no `clipboardWrite` permission because this is
 * only ever invoked from a real click's transient activation (007/008's already-verified finding).
 *
 * A rejected write is rethrown, never swallowed — AGENTS.md #5 (never a false success) and §4's own
 * degradation clause; the caller (`appShell.ts`) is responsible for surfacing the failure.
 *
 * @param host The shadow-root-owning reader host to copy.
 */
export async function copyAsHtml(host: HTMLElement): Promise<void> {
  const { clone, theme } = serializeReaderDocument(host);
  const doc = wrapInStandaloneDocument(clone, theme);
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([doc], { type: 'text/html' }),
      'text/plain': new Blob([plainTextOf(clone)], { type: 'text/plain' }),
    }),
  ]);
}

/**
 * Copy-as-rich-text — the clipboard exit for pasting into Google Docs / Word (task 4.1). A
 * DIFFERENT payload from `copyAsHtml`'s, and the difference is load-bearing (D-4; tasks.md §4.1):
 * the clone's SEMANTIC MARKUP ALONE — `clone.outerHTML`, no `wrapInStandaloneDocument` call, so no
 * doctype, no `<head>`, no bundled `<style>` block, no reader-theme colors baked onto a `<body>`.
 * The paste target's OWN default styling applies instead of the reader's light/dark/sepia theme —
 * exactly the row's own subtext ("Paste straight into Google Docs or Word") and spec §3.2's persona
 * line ("without carrying the reader's own styling along with it"). This is engine-independent:
 * Peekover writes the identical fragment string on both Chromium and Firefox; what either engine's
 * OS clipboard does with `text/html` AFTER that (3.3's own probe found Chromium re-serializes any
 * written `text/html` into a `getComputedStyle`-inlined fragment on paste, Firefox reformats
 * differently) is a paste-target-dependent transform outside this function's own bytes, the same
 * way any paste into any external app is target-dependent — not a Peekover cross-engine asymmetry.
 *
 * Reuses `serializeReaderDocument`'s clone and `plainTextOf`'s fallback derivation verbatim — SAME
 * clone, SAME `text/plain` shape `copyAsHtml` already uses; only the `text/html` payload differs.
 * `wrapInStandaloneDocument` is deliberately never called here — calling it would make this payload
 * byte-identical to `copyAsHtml`'s, collapsing 4.1 into 3.3.
 *
 * Same honest-failure shape as `copyAsHtml`: a rejected write is rethrown, never swallowed
 * (AGENTS.md #5) — the caller (`appShell.ts`) surfaces the failure.
 *
 * @param host The shadow-root-owning reader host to copy.
 */
export async function copyAsRichText(host: HTMLElement): Promise<void> {
  const { clone } = serializeReaderDocument(host);
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([clone.outerHTML], { type: 'text/html' }),
      'text/plain': new Blob([plainTextOf(clone)], { type: 'text/plain' }),
    }),
  ]);
}
