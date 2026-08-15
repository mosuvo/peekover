// codeEnhancer — the synchronous prologue (D-5, D-6, task 4.1) and the async highlighting body
// (D-4, task 4.2). Given a reader host that mount() has already committed, it finds the
// language-classed code fences, puts D-6's retained/wrapper structure around each one, returns —
// and THEN, off the caller's stack, loads the engine, tokenizes every fence and adopts the result.
// Mirrors `diagramEnhancer.ts`'s task-3.1-vs-3.2 split exactly, one task apart in this milestone
// too (4.1 shipped the prologue alone; this task adds the body inside the SAME function).
//
// ── WHY THE ENTRY POINT IS SYNCHRONOUS, AND WHY THAT IS A CONSTRAINT RATHER THAN A STYLE ──────
//
// Two independent reasons, either of which alone would force it (007 D-12's reasons, unchanged):
//
//   1. §4 / AGENTS.md #5 — never a blank page. The wrapper must exist before the first paint that
//      follows the mount, so a document that will never get its highlighting (engine fails to load,
//      the tokenize throws) is already sitting in its designed degraded state — the retained `<pre>`,
//      visible — rather than transitioning into one.
//
//   2. D-5's cooldown constraint — `watchController` times its whole synchronous block to set a
//      cost-proportional cooldown (`watchController.ts:422`). It measures `render(...)` end to end,
//      and the app page's render closure calls this function. Anything awaited in here would be
//      billed to every code-bearing watched document as inflated idle. (Task 4.5 re-asserts this.)
//
// ── THE ENGINE IS NOW IMPORTED — FIRST TIME THIS MILESTONE (task 4.2) ─────────────────────────
//
// `codeEngine.ts` is the ONE importer of `shiki` (D-3); this module now imports IT — never a
// `shiki/…` specifier directly — for {@link loadCodeEngine} and the language/theme resolvers,
// which is what puts Shiki's chunk on the app-page graph for real (tasks.md 4.5's own text
// expected this move at 4.5; it happens here, at 4.2, because D-4's own Files list names
// `codeEngine.ts` and this task's whole job is calling it — see `codeEngine.ts`'s module header
// for the follow-on to that prediction). `CODE_FENCE_SELECTOR` stays independently declared below
// rather than imported alongside — the ORIGINAL reason (avoiding the import entirely, pre-4.2) no
// longer applies, but the duplication costs nothing further to keep once `codeEnhancer.test.ts`'s
// equality pin already exists, and changing it is outside D-4's own narrow scope.
//
// ── THE SOURCE IS READ AS TEXT, ALWAYS ────────────────────────────────────────────────────────
//
// The fence's contents are untrusted markdown. This module never assigns markup anywhere, and it
// never needs to: D-6 RETAINS the `<pre>` that mount() already committed through
// `sanitize(parse(source))` instead of rebuilding it, and `codeView.ts` has no `innerHTML` at all.
//
// ── A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE (discovered this task, not specified) ─
//
// `CODE_FENCE_SELECTOR` below is `pre > code[class^="language-"]`, the literal tasks.md 4.1/plan.md
// §1.3 both give verbatim — and `language-mermaid` starts with `language-`, so it matches too.
// 007's `diagramEnhancer.ts` runs FIRST at both call sites (D-5's own ordering) and already claims
// a mermaid fence's `<pre>` with its own D-15 sibling structure; if this module re-parented that
// same `<pre>` into a `.peekover-code` wrapper, it would corrupt 007's already-shipped structure —
// `pre.nextElementSibling` would stop being the diagram `<figure>` the moment this task's own code
// ran. Verified this session: wiring `enhanceCode` at the real call sites (not merely importing it)
// reds `diagramRender.browser.test.ts`'s D-12 parity case with exactly that signature. No spec, plan
// or tasks.md text names this exclusion — plan §2's "no interaction between the two engines is
// scoped" line forbids this module from IMPORTING any diagram module to check for it structurally,
// so the exclusion is a literal class check instead, confined entirely to this file. `codeEngine.ts`
// had the SAME unscoped selector and therefore the SAME gap in its own `hasCodeFence`
// feature-detect — named at 4.1 as a carried finding for THIS task, the first to actually call it:
// a document with only a mermaid fence and no other code would otherwise make `loadCodeEngine`
// decide "yes, load Shiki" for nothing to highlight. Fixed this task, in `codeEngine.ts` itself
// (see its own module header) — this module's exclusion and that one are two independent copies
// of the same literal check, matching `CODE_FENCE_SELECTOR`'s own established duplication pattern.

import {
  insertCodeWrapper,
  markCodeRendered,
  markCodeFailed,
  CODE_STATE_ATTR,
} from './codeView';
import {
  loadCodeEngine,
  languageInputFor,
  themeInputFor,
  type EngineLoader,
  type HighlighterCore,
  type TokensResult,
} from './codeEngine';

/** See the module header's "A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE" section. */
const MERMAID_FENCE_CLASS = 'language-mermaid';

/**
 * ★ PROVISIONAL — task 5.1 gives `codeTheme` a real settings field and task 8.4 rules the actual
 * default (plan §8 M-4, measure-then-choose); this task has neither yet, so every fence highlights
 * at ONE fixed, hard-coded bundled theme id until then. Named PROVISIONAL in this comment rather
 * than left to read as a decision — the 008 standing rule ("a PROPOSED comment left on a chosen
 * value is a lie about the decision state") applies to a hard-coded literal exactly as it does to
 * a settings default. `'github-dark'` is chosen only because it is one of Shiki's own bundled
 * theme ids (D-4's "Shiki's own theme-data colours" requirement) and produces visibly distinct
 * token colours for the hostile/plain fixtures this task's tests use — not a design opinion.
 */
const PROVISIONAL_CODE_THEME = 'github-dark';

/** Options exist for the tests, and for two things: injecting the loader, and forcing a theme id
 *  that will not resolve (the "theme-apply failure" case, tasks.md 4.2's Verify). Production
 *  passes neither. Mirrors `diagramEnhancer.ts`'s own `EnhanceOptions` shape exactly. */
export interface EnhanceOptions {
  /** Overrides the `import('shiki/core')` `codeEngine.ts` performs. See {@link EngineLoader}. */
  readonly loader?: EngineLoader;
  /** Overrides {@link PROVISIONAL_CODE_THEME}. An id `themeInputFor` cannot resolve is how the
   *  theme-apply-failure path is exercised without D-9's real picker existing yet. */
  readonly theme?: string;
}

/** The pair D-6 maintains: the retained source `<pre>` and the wrapper `insertCodeWrapper` built
 *  around it. Mirrors `diagramEnhancer.ts`'s own `DiagramPair`. */
interface CodePair {
  readonly pre: HTMLElement;
  readonly wrapper: HTMLElement;
}

/**
 * The fence markdown-it emits for a fenced code block carrying a language class, after
 * sanitization. Matches ONLY a `code` that is a DIRECT child of a `pre`, whose class starts with
 * `language-` — no bare `code`, no unlabelled fence, no `code` behind an intervening element (D-6's
 * wrapper needs a direct child to re-parent).
 *
 * Mirrors `codeEngine.CODE_FENCE_SELECTOR` — see the module header for why it is not imported from
 * there, and `codeEnhancer.test.ts` for the equality pin that keeps them honest.
 */
export const CODE_FENCE_SELECTOR = 'pre > code[class^="language-"]';

/**
 * The source `<pre>` of every language-classed code fence under `root`, in document order — EXCEPT
 * a mermaid fence, which 007's `diagramEnhancer.ts` already owns (module header).
 *
 * The selector matches the `<code>`; the element this returns is its `<pre>` parent, because the
 * `<pre>` is what D-6's wrapper re-parents. `pre > code` guarantees the parent exists, so the cast
 * is structural rather than optimistic.
 */
export function codeFencesIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll(CODE_FENCE_SELECTOR))
    .filter((code) => !code.classList.contains(MERMAID_FENCE_CLASS))
    .map((code) => code.parentElement as HTMLElement);
}

/**
 * `<code class="language-javascript">` → `"javascript"`. Reads the FIRST class token that carries
 * the `language-` prefix — `pre > code[class^="language-"]` guarantees at least one exists, and
 * markdown-it never emits a second — so this is a structural extraction, not a guess. An absent
 * `<code>` (never true for a fence `codeFencesIn` returned, but the type is `Element | null`)
 * yields `''`, which `languageInputFor` resolves to `undefined` exactly like an unknown language:
 * one failure surface, not a special case (`codeEngine.ts`'s module header).
 */
function classToLang(code: Element | null): string {
  const cls = code?.className ?? '';
  for (const token of cls.split(/\s+/)) {
    if (token.startsWith('language-')) return token.slice('language-'.length);
  }
  return '';
}

/**
 * D-4: walk `codeToTokens`'s structured 2-D token array and build the highlighted `<pre>` as DOM,
 * directly — `document.createElement`, `element.style.color`, `Text` nodes. NO HTML STRING
 * ANYWHERE, the same shape `tableTools.ts` already uses for its own DOM construction (plan §0's
 * D-4 text, AGENTS.md #3). One `<span class="line">` per source line (so per-line CSS — word-wrap,
 * a future line-highlight background — has something to key off, task 4.3's own need), one
 * `<span>` per token inside it with an inline `color` when Shiki's theme data supplies one, and a
 * literal newline `Text` node between lines so a plain-text copy of this element (never actually
 * taken — D-6 copies the RETAINED `<pre>`, task 4.3) would still read correctly.
 */
function adoptHighlighted(doc: Document, tokens: TokensResult): HTMLElement {
  const pre = doc.createElement('pre');
  pre.className = 'shiki';
  if (tokens.bg) pre.style.backgroundColor = tokens.bg;
  if (tokens.fg) pre.style.color = tokens.fg;
  const code = doc.createElement('code');
  tokens.tokens.forEach((line, lineIndex) => {
    const lineEl = doc.createElement('span');
    lineEl.className = 'line';
    for (const token of line) {
      const span = doc.createElement('span');
      if (token.color) span.style.color = token.color;
      span.textContent = token.content;
      lineEl.appendChild(span);
    }
    code.appendChild(lineEl);
    if (lineIndex < tokens.tokens.length - 1) code.appendChild(doc.createTextNode('\n'));
  });
  pre.appendChild(code);
  return pre;
}

/**
 * The async body (D-4): load the engine once, then tokenize and adopt each pending fence.
 *
 * SEQUENTIAL, mirroring `diagramEnhancer.ts`'s `renderDiagrams` — not for a shared-container
 * reason (Shiki, unlike mermaid, touches no DOM to tokenize), but because there is no benefit to
 * racing fences against each other and a sequential loop is the simpler, more obviously-correct
 * shape to read a per-fence `try`/`catch` against.
 *
 * Engine-load failure is document-wide (§3.9's first failure): no fence got as far as having its
 * own outcome, so every pair is marked `failed` together and the function returns. Per-fence
 * failure (tokenize OR theme-apply — both surface as a `codeToTokens`/`loadLanguage`/`loadTheme`
 * throw, module header) never reaches another fence: the `try`/`catch` is INSIDE the loop.
 */
async function highlightFences(
  doc: Document,
  root: ParentNode,
  pairs: readonly CodePair[],
  loader: EngineLoader | undefined,
  theme: string,
): Promise<void> {
  let engine: HighlighterCore | null;
  try {
    engine = await (loader ? loadCodeEngine(root, loader) : loadCodeEngine(root));
  } catch {
    for (const pair of pairs) markCodeFailed(pair.pre, pair.wrapper);
    return;
  }
  if (!engine) return; // §4's feature-detect said no fence; the prologue disagrees, so do nothing.

  for (const pair of pairs) {
    try {
      const code = pair.pre.querySelector('code');
      const lang = classToLang(code);
      const source = code?.textContent ?? '';

      const langInput = languageInputFor(lang);
      if (langInput) await engine.loadLanguage(langInput);
      const themeInput = themeInputFor(theme);
      if (themeInput) await engine.loadTheme(themeInput);

      // An unresolved language OR theme raises HERE, not above — `codeEngine.ts`'s module header:
      // one failure surface for "unknown key" and "tokenize genuinely failed" alike.
      const tokens = engine.codeToTokens(source, { lang, theme });
      markCodeRendered(pair.pre, pair.wrapper, adoptHighlighted(doc, tokens));
    } catch {
      markCodeFailed(pair.pre, pair.wrapper);
    }
  }
}

/**
 * D-5's entry point: put D-6's structure around every language-classed code fence in a freshly
 * mounted reader, then — off the caller's stack — highlight each one (D-4, task 4.2).
 *
 * Called from both app-page mount paths and from nowhere else — `readerPane.ts` after its `mount`,
 * and the `render` closure `appShell.ts` passes into `createWatchController`. The content script
 * reaches neither, which is why its reader leaves a code fence exactly as markdown-it/sanitize
 * committed it, with no affordance and no note (§3.8, rows 2 + 3): the gate is the module graph, not
 * a runtime check, and it is what keeps `codeEngine.ts` (and Shiki's chunk behind it) off the
 * content-script graph entirely.
 *
 * No-ops on a host with no shadow root and on a document with no fences — the overwhelmingly common
 * case, and the one §4 cares about ("when a document contains no code fence, the system shall not
 * load the code engine"). The empty-list return below is in front of the async call, so on a
 * fence-free document `loadCodeEngine` — and therefore `import('shiki/core')` — is never reached.
 *
 * Idempotent over an already-enhanced tree: a fence whose `<pre>` already carries the state
 * attribute is skipped, so a second call cannot re-wrap an already-wrapped fence. In production
 * every mount arrives via `replaceChildren` and the fences are always fresh, so this guard is a
 * property, not a path the app relies on.
 *
 * Everything above the `void highlightFences(...)` call is synchronous and already committed
 * before this function returns (D-5's cooldown constraint, the module header's first section) —
 * 4.1's own test asserts exactly that instant, unchanged by this task's addition.
 */
export function enhanceCode(host: HTMLElement, options: EnhanceOptions = {}): void {
  const shadow = host.shadowRoot;
  if (!shadow) return;
  const pairs: CodePair[] = [];
  for (const pre of codeFencesIn(shadow)) {
    if (pre.hasAttribute(CODE_STATE_ATTR)) continue;
    pairs.push({ pre, wrapper: insertCodeWrapper(pre) });
  }
  if (pairs.length === 0) return;
  void highlightFences(
    host.ownerDocument,
    shadow,
    pairs,
    options.loader,
    options.theme ?? PROVISIONAL_CODE_THEME,
  );
}
