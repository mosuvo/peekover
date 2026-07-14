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
