// parse — the first render-pipeline stage: raw markdown text → raw HTML string.
//
// This stage is DELIBERATELY unsafe on its own: `html: true` lets inline HTML in
// the source flow straight through, and the output is not sanitized here. Safety
// is the sanitize stage's job (see sanitize.ts / AGENTS.md #3) — the wire order
// is always parse → sanitize before anything touches the DOM. Never mount the
// output of this function directly.
//
// One markdown-it instance, configured options-object-first, so future feature
// toggles (M2+) become config changes rather than new parser instances.

import MarkdownIt, { type Options } from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

/**
 * Parser options. Options-object-first per the milestone plan: everything that
 * can be expressed as config lives here rather than as imperative setup.
 *
 * - `html`   inline HTML passes through (DOMPurify downstream makes this safe).
 * - `linkify` bare URLs (`https://…`) become links without explicit syntax.
 * - `typographer` OFF for M1 — no smart quotes / dash substitution yet.
 */
const PARSE_OPTIONS: Options = {
  html: true,
  linkify: true,
  typographer: false,
  breaks: false,
  xhtmlOut: false,
};

/**
 * The GFM built-in rules we turn on explicitly. markdown-it's default preset
 * already enables these, but we assert them so the GFM set is a visible,
 * reviewable decision rather than an implicit default:
 *   - `table`         GFM pipe tables
 *   - `strikethrough` `~~text~~`
 *   - `linkify`       bare-URL autolinking (paired with `linkify: true` above)
 * CommonMark angle-bracket autolinks (`<https://…>`) are always on in core.
 */
const ENABLED_RULES = ['table', 'strikethrough', 'linkify'] as const;

const md = new MarkdownIt(PARSE_OPTIONS).enable([...ENABLED_RULES]);

// GitHub-style task lists (`- [ ]` / `- [x]`). No options passed → the plugin's
// default renders checkboxes DISABLED, which is what M1 wants: read-only, no
// write-back. (Passing `enabled: true` would make them interactive — don't.)
md.use(taskLists);

/**
 * Conditional fence-renderer override (D-8, Ruling 2 — decisions.md M9 GATE 2):
 * appends `data-fence-meta` to the emitted `<code>` element ONLY when a fence's
 * info string carries content beyond its language word — e.g.
 * ```javascript {2,4}``` → `<code class="language-javascript"
 * data-fence-meta="{2,4}">`. Every fence WITHOUT such content — no language,
 * language only, or trailing whitespace only — renders through markdown-it's
 * UNMODIFIED default fence rule, byte-for-byte (pinned in parse.test.ts
 * against the golden corpus's own committed strings; no new golden fixture
 * for this — plan §2's Explicitly-NOT-touched list).
 *
 * Predicate: the info string (markdown-it's own unescaped, trimmed `info`,
 * the same value the default rule computes internally) up to its first
 * whitespace run is the language word; everything after that run is meta.
 * The attribute is added iff that remainder is non-empty. Predicate table:
 *   ```javascript              → no meta  → no attribute (falls through)
 *   ```javascript {2,4}        → meta "{2,4}"
 *   ```                        → no lang  → no meta → no attribute
 *   ```javascript   {2,4}      → meta "{2,4}" (only the leading run before
 *                                  meta is stripped, matching the default
 *                                  rule's own `langAttrs` computation)
 *   ```javascript   (trailing ws only) → meta empty after trim → no attribute
 *
 * The meta value is pushed RAW (never pre-escaped here) — `Renderer
 * #renderAttrs` HTML-escapes every attribute value it renders (`& < > "`),
 * so it comes out escaped exactly like every other attribute in this
 * pipeline (`class` included).
 */
const defaultFenceRule: NonNullable<typeof md.renderer.rules.fence> =
  md.renderer.rules.fence ??
  ((tokens, idx, options, _env, slf) => slf.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
  const spaceIdx = info.search(/\s/);
  const meta = spaceIdx === -1 ? '' : info.slice(spaceIdx).replace(/^\s+/, '');

  if (!meta) {
    return defaultFenceRule(tokens, idx, options, env, slf);
  }

  const originalAttrs = token.attrs;
  token.attrPush(['data-fence-meta', meta]);
  const html = defaultFenceRule(tokens, idx, options, env, slf);
  token.attrs = originalAttrs;
  return html;
};

/**
 * Parse markdown into an HTML string.
 *
 * The returned HTML is UNSANITIZED. Callers must pass it through the sanitize
 * stage before inserting it into the DOM.
 *
 * @param markdown Raw markdown source text.
 * @returns Raw (unsanitized) HTML.
 */
export function parse(markdown: string): string {
  return md.render(markdown);
}
