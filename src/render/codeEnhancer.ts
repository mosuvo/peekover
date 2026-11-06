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
  buildCodeToolbar,
  CODE_STATE_ATTR,
  CODE_WRAPPER_CLASS,
  CODE_LINE_HIGHLIGHT_CLASS,
} from './codeView';
import {
  loadCodeEngine,
  grammarKeyFor,
  languageInputFor,
  shippedCodeTheme,
  themeInputFor,
  type EngineLoader,
  type HighlighterCore,
  type TokensResult,
} from './codeEngine';
import { currentSettings } from '../settings/settingsSeam';

/** See the module header's "A MERMAID FENCE IS NEVER A CODE-HIGHLIGHTING CANDIDATE" section. */
const MERMAID_FENCE_CLASS = 'language-mermaid';

/** A display-math fence (`$$…$$` and ```` ```math ````, both `language-math` — `parse.ts`) belongs to
 *  `mathEnhancer.ts`, the same way a mermaid fence belongs to the diagram enhancer: it gets the
 *  formula's own Copy LaTeX / Copy MathML, never this module's code toolbar (013 task 5.3; gate-1
 *  Q14; carried (g)). A literal class check, for the mermaid exclusion's reason (no math import). */
const MATH_FENCE_CLASS = 'language-math';

/** Options exist for the tests, and for two things: injecting the loader, and forcing a theme id
 *  that will not resolve (the "theme-apply failure" case, tasks.md 4.2's Verify). Production
 *  passes neither. Mirrors `diagramEnhancer.ts`'s own `EnhanceOptions` shape exactly. */
export interface EnhanceOptions {
  /** Overrides the `import('shiki/core')` `codeEngine.ts` performs. See {@link EngineLoader}. */
  readonly loader?: EngineLoader;
  /** Overrides `settings.codeTheme` (task 5.2 — `PROVISIONAL_CODE_THEME` is retired now that the
   *  fallback reads a real settings field, see the module header). An id `themeInputFor` cannot
   *  resolve is how the theme-apply-failure path is exercised without a picker click. */
  readonly theme?: string;
}

/** The pair D-6 maintains: the retained source `<pre>` and the wrapper `insertCodeWrapper` built
 *  around it. Mirrors `diagramEnhancer.ts`'s own `DiagramPair`. `lang` is the prologue's own
 *  `classToLang` read, carried rather than re-derived so the toolbar's label (task 4.3) and the
 *  highlighter's language choice can never read the fence's class differently. */
interface CodePair {
  readonly pre: HTMLElement;
  readonly wrapper: HTMLElement;
  readonly lang: string;
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
 * a mermaid fence, which 007's `diagramEnhancer.ts` already owns (module header), and a display-math
 * fence, which `mathEnhancer.ts` owns (013 task 5.3).
 *
 * The selector matches the `<code>`; the element this returns is its `<pre>` parent, because the
 * `<pre>` is what D-6's wrapper re-parents. `pre > code` guarantees the parent exists, so the cast
 * is structural rather than optimistic.
 */
export function codeFencesIn(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll(CODE_FENCE_SELECTOR))
    .filter((code) => !code.classList.contains(MERMAID_FENCE_CLASS) && !code.classList.contains(MATH_FENCE_CLASS))
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

/** One `{start[-end]}` token, or `{start}` alone. Anything else is malformed and skipped. Each
 *  digit run is capped at 7 characters — comfortably past {@link MAX_LINE_NUMBER} — so the token
 *  itself can never carry a number `Number()` would have to represent imprecisely. */
const LINE_RANGE_TOKEN = /^(\d{1,7})(?:-(\d{1,7}))?$/;

/** No real code block runs anywhere near this many lines — a bare line number past this, OR a
 *  range wider than this, is treated as malformed (skipped) rather than expanded. Both guards are
 *  needed: a WIDE range (`{1-99999999999}`) is caught by the span check below, but a single bare
 *  number past `Number.MAX_SAFE_INTEGER` (`{999999999999999999}`) has a span of ZERO — `start ===
 *  end` — and would sail past a span-only guard. At that magnitude floating-point precision makes
 *  `line += 1` a NO-OP, so the per-line loop below would never terminate — a hostile or
 *  fat-fingered fence meta must degrade to "no lines highlighted", never a hang. */
const MAX_LINE_NUMBER = 1_000_000;
const MAX_LINE_RANGE_SPAN = 10_000;

/**
 * D-8's consumer (task 4.3): `code.dataset.fenceMeta` (now surviving `sanitize.ts`'s allow-list,
 * resolution (a)) → the 1-based line numbers it names. `{2,4}` → `[2, 4]`; `{1-3,7}` → `[1, 2, 3,
 * 7]`; anything malformed or absent → `[]`, NEVER a throw — this runs on untrusted-markdown-derived
 * text on every fence's highlight pass, so a reader's typo in a fence's info string must degrade to
 * "no lines highlighted", not an unhandled exception that would take the fence down with it.
 *
 * Pure and exported so it is unit-testable without an engine — plan §5's own jsdom-unit list names
 * it explicitly. Deduplicated and sorted, so `{4,2,4}` and `{2-4,3}` both answer `[2, 3, 4]`
 * regardless of how a reader wrote the overlap.
 */
export function parseLineRanges(meta: string | undefined | null): number[] {
  if (!meta) return [];
  const wrapped = /^\{(.*)\}$/.exec(meta.trim());
  if (!wrapped) return [];
  const lines = new Set<number>();
  for (const rawToken of wrapped[1].split(',')) {
    const token = rawToken.trim();
    if (!token) continue;
    const parsed = LINE_RANGE_TOKEN.exec(token);
    if (!parsed) continue; // malformed token — skipped, never thrown over
    const start = Number(parsed[1]);
    const end = parsed[2] !== undefined ? Number(parsed[2]) : start;
    if (start < 1 || end < start) continue;
    if (end > MAX_LINE_NUMBER || end - start > MAX_LINE_RANGE_SPAN) continue;
    for (let line = start; line <= end; line += 1) lines.add(line);
  }
  return [...lines].sort((a, b) => a - b);
}

/**
 * D-4: walk `codeToTokens`'s structured 2-D token array and build the highlighted `<pre>` as DOM,
 * directly — `document.createElement`, `element.style.color`, `Text` nodes. NO HTML STRING
 * ANYWHERE, the same shape `tableTools.ts` already uses for its own DOM construction (plan §0's
 * D-4 text, AGENTS.md #3). One `<span class="line">` per source line (so per-line CSS — word-wrap,
 * the line-highlight background below — has something to key off), one `<span>` per token inside
 * it with an inline `color` when Shiki's theme data supplies one, and a literal newline `Text` node
 * between lines so a plain-text copy of this element (never actually taken — D-6 copies the
 * RETAINED `<pre>`, task 4.3's toolbar) would still read correctly.
 *
 * `highlightedLines` is task 4.3's own addition (D-8's consumer): a 1-based line number in the set
 * gets {@link CODE_LINE_HIGHLIGHT_CLASS} (background only) AND an `aria-label` stating it in text —
 * row 15's *"state in TEXT and `aria-*`, not colour alone"*. Setting `aria-label` on the line span
 * is what makes an emphasized line announce as more than its own syntax-highlighted characters; a
 * background colour alone would carry no signal to a screen reader at all.
 */
function adoptHighlighted(
  doc: Document,
  tokens: TokensResult,
  highlightedLines: readonly number[],
): HTMLElement {
  const pre = doc.createElement('pre');
  pre.className = 'shiki';
  if (tokens.bg) pre.style.backgroundColor = tokens.bg;
  if (tokens.fg) pre.style.color = tokens.fg;
  const code = doc.createElement('code');
  tokens.tokens.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const lineEl = doc.createElement('span');
    lineEl.className = 'line';
    for (const token of line) {
      const span = doc.createElement('span');
      if (token.color) span.style.color = token.color;
      span.textContent = token.content;
      lineEl.appendChild(span);
    }
    if (highlightedLines.includes(lineNumber)) {
      lineEl.classList.add(CODE_LINE_HIGHLIGHT_CLASS);
      const lineText = line.map((token) => token.content).join('');
      lineEl.setAttribute('aria-label', `Highlighted line ${lineNumber}: ${lineText}`);
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
      const adopted = await tokenizeAndAdopt(doc, engine, pair.pre, pair.lang, theme);
      markCodeRendered(pair.pre, pair.wrapper, adopted);
    } catch {
      markCodeFailed(pair.pre, pair.wrapper);
    }
  }
}

/**
 * Tokenize one wrapped fence's retained source with `theme` and build the adopted node —
 * `code.dataset.fenceMeta` is read here, BEFORE the retained `<pre>` is hidden, though D-6 never
 * mutates it either way (kept beside the tokenize call so the two D-8-dependent reads — the
 * language class, the meta attribute — stay together). The exact sequence {@link highlightFences}
 * and task 5.2's {@link reapplyCodeTheme} both need, factored out because it is IDENTICAL between
 * them; only what happens to the RESULT (commit vs. replace) and what a FAILURE does (mark failed
 * vs. leave the previous render alone) differs, and both stay at their own call site.
 *
 * An unresolved language OR theme raises HERE, inside `codeToTokens` — `codeEngine.ts`'s module
 * header: one failure surface for "unknown key" and "tokenize genuinely failed" alike.
 */
async function tokenizeAndAdopt(
  doc: Document,
  engine: HighlighterCore,
  pre: HTMLElement,
  lang: string,
  theme: string,
): Promise<HTMLElement> {
  const code = pre.querySelector('code');
  const source = code?.textContent ?? '';
  const langInput = languageInputFor(lang);
  if (langInput) await engine.loadLanguage(langInput);
  const themeInput = themeInputFor(theme);
  if (themeInput) await engine.loadTheme(themeInput);
  // 013 task 5.11: the grammar's own key (an alias or a capitalised label resolved), else the raw
  // label, which `codeToTokens` rejects as before — one failure surface for an unknown language.
  const tokens = engine.codeToTokens(source, { lang: grammarKeyFor(lang) ?? lang, theme });
  const highlightedLines = parseLineRanges(code?.dataset.fenceMeta);
  return adoptHighlighted(doc, tokens, highlightedLines);
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
    const wrapper = insertCodeWrapper(pre);
    const lang = classToLang(pre.querySelector('code'));
    // Task 4.3's toolbar (D-7): built HERE, in the sync prologue, alongside the wrapper — so
    // copy-raw is usable from first paint even if highlighting never resolves (§4's "never blank"
    // property, D-6's own argument one control further). `prepend` puts it ahead of the retained
    // `<pre>`, the wrapper's first child, in normal flow (module header, `codeView.ts`).
    wrapper.prepend(buildCodeToolbar(wrapper, pre, lang));
    pairs.push({ pre, wrapper, lang });
  }
  if (pairs.length === 0) return;
  // Task 5.2: this host has at least one code fence, so it is a candidate for a later re-theme —
  // register it BEFORE the async body, same as the sync prologue's other side effects.
  codeHosts.add(host);
  void highlightFences(
    host.ownerDocument,
    shadow,
    pairs,
    options.loader,
    options.theme ?? shippedCodeTheme(currentSettings().codeTheme),
  );
}

// ── TASK 5.2: THE RE-THEME REGISTRY AND ENTRY POINT ────────────────────────────────────────────
//
// Mirrors `themeRegistry.ts`'s `themeHosts`/`pruneThemeHosts`/`isConnected` pattern exactly — a
// module-level Set, pruned before every use — but this registry is functionally INDEPENDENT of
// that one: §4 requires a code-theme change to never touch the document theme and vice versa, so
// sharing `themeRegistry`'s set or broadcast would conflate the two axes it is written to keep
// apart. `codeThemeControl.ts` never sees this Set directly — it calls {@link reapplyCodeTheme}.

/** Live hosts with at least one code fence, registered by {@link enhanceCode}. */
const codeHosts = new Set<HTMLElement>();

/** Drop hosts no longer in a document — `themeRegistry.ts`'s `pruneThemeHosts`, verbatim pattern.
 *  Deleting during Set iteration is safe. */
function pruneCodeHosts(): void {
  for (const host of codeHosts) {
    if (!host.isConnected) codeHosts.delete(host);
  }
}

/** One already-rendered fence: its retained source `<pre>` (still holds the original
 *  `<code class="language-…">` untouched — D-6 never mutates it) and the wrapper around it.
 *  `lang` is re-derived rather than carried, since a rendered fence has no live {@link CodePair}
 *  to carry it in by the time a re-theme runs. */
interface RenderedCodePair {
  readonly pre: HTMLElement;
  readonly wrapper: HTMLElement;
  readonly lang: string;
}

/** Every already-rendered fence under `root` — {@link codeFencesIn}'s counterpart, keyed off the
 *  RENDERED state rather than an unwrapped fence, since a re-theme acts on what is already on
 *  screen. The retained source `<pre>` is the one carrying {@link CODE_STATE_ATTR} — `markCodeRendered`
 *  sets it there, never on the adopted `.shiki` sibling — so it is found unambiguously. */
function renderedCodePairsIn(root: ParentNode): RenderedCodePair[] {
  const pairs: RenderedCodePair[] = [];
  const wrappers = root.querySelectorAll(`.${CODE_WRAPPER_CLASS}[${CODE_STATE_ATTR}="rendered"]`);
  for (const wrapper of Array.from(wrappers) as HTMLElement[]) {
    const pre = wrapper.querySelector(`pre[${CODE_STATE_ATTR}="rendered"]`) as HTMLElement | null;
    if (!pre) continue; // structural guarantee from markCodeRendered setting both together.
    pairs.push({ pre, wrapper, lang: classToLang(pre.querySelector('code')) });
  }
  return pairs;
}

/**
 * Task 5.2's re-theme entry point: repaint every ALREADY-RENDERED fence on every live registered
 * host with `theme`, in place. `codeThemeControl.ts` is the only caller (persist first via
 * `saveSettings`, then this, per the module's own header).
 *
 * Unlike `enhanceCode`, this is not on `render()`'s timed path (D-5's cooldown constraint) — it
 * runs from a picker click, never from a mount — so it is a plain, awaitable `async function`
 * rather than the fire-and-forget `void highlightFences(...)` shape above.
 *
 * Per-host engine-load failure, and per-fence tokenize/theme-apply failure, both leave the
 * affected block(s) showing their PREVIOUS theme rather than flipping to the `failed` state
 * `highlightFences` uses on first render (AGENTS.md #5's "never blank" carried one block further:
 * a repaint that fails on an already-working block must not regress it to no colour at all).
 */
export async function reapplyCodeTheme(theme: string): Promise<void> {
  pruneCodeHosts();
  for (const host of codeHosts) {
    const shadow = host.shadowRoot;
    if (!shadow) continue;
    const pairs = renderedCodePairsIn(shadow);
    if (pairs.length === 0) continue;
    let engine: HighlighterCore | null;
    try {
      engine = await loadCodeEngine(shadow);
    } catch {
      continue; // this host's blocks keep their previous theme — see the doc comment above.
    }
    if (!engine) continue;
    for (const pair of pairs) {
      try {
        const adopted = await tokenizeAndAdopt(host.ownerDocument, engine, pair.pre, pair.lang, theme);
        // Replace the CURRENT adopted `.shiki` sibling — never `markCodeRendered`, which APPENDS
        // and would duplicate content rather than swap it. The retained source `<pre>` is the one
        // carrying `CODE_STATE_ATTR`, so the sibling without it is the adopted content.
        const previous = pair.wrapper.querySelector(`pre:not([${CODE_STATE_ATTR}])`);
        if (previous) previous.replaceWith(adopted);
        else pair.wrapper.append(adopted); // structurally shouldn't happen — defensive only.
      } catch {
        // Leave this one block exactly as it was — see the doc comment above.
      }
    }
  }
}

/** Test-only: empty the host registry so suites do not leak hosts into one another — mirrors
 *  `themeRegistry.ts`'s `resetThemeHostsForTest`. */
export function resetCodeHostsForTest(): void {
  codeHosts.clear();
}

/** Test-only: the number of hosts currently registered (after pruning) — lets a test assert the
 *  prune actually shrank the set, `themeRegistry.ts`'s `themeHostCountForTest` mirrored. */
export function codeHostCountForTest(): number {
  pruneCodeHosts();
  return codeHosts.size;
}
