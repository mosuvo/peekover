// sanitize — the render pipeline's security core. Raw (parser- or HTML-derived)
// markup in, inert markup out. This is the ONLY thing that makes `html: true` in
// the parse stage safe (AGENTS.md #3: every HTML string that touches the DOM goes
// through DOMPurify). The wire order is always parse -> sanitize before mount.
//
// The strict profile is expressed as DATA (the exported const arrays below), not
// as inline literals, so the allow-list is reviewable in one place and testable:
// every tag/attribute NOT listed is dropped by construction. There is no FORBID
// list because there is nothing to forbid explicitly — an allow-list already
// denies everything it does not name (scripts, event handlers, style, etc.).

import DOMPurify from 'dompurify';

/**
 * The only element tags the reader renders. Anything else (script, iframe,
 * object, embed, style, svg, form controls beyond the task-list checkbox, …) is
 * removed. Kept text content of removed elements survives (KEEP_CONTENT default).
 *
 * Note: markdown-it emits `<s>` for `~~strikethrough~~` (not `<del>`); both are
 * listed so strikethrough survives and inline `<del>` from source HTML also does.
 */
export const ALLOWED_TAGS = [
  // headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // block text
  'p', 'br', 'hr', 'blockquote', 'pre',
  // inline emphasis / semantics
  'em', 'strong', 'del', 's', 'code', 'sup', 'sub',
  // lists
  'ul', 'ol', 'li',
  // task-list checkbox (rendered disabled — see parse.ts)
  'input',
  // links & images
  'a', 'img',
  // tables
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
] as const;

/**
 * The only attributes allowed on any element. Minimal by design:
 *  - href/src/alt/title  links & images
 *  - class               markdown-it / task-list hooks (e.g. `language-js`,
 *                        `task-list-item`, `contains-task-list`)
 *  - type/checked/disabled  the task-list checkbox
 *  - colspan/rowspan     table cells
 *  - id                  forward-looking heading anchors (M2 anchor plugin)
 *  - align               forward-looking table alignment
 *
 * Deliberately absent: `style` (no inline CSS), `on*` (no event handlers),
 * `target`/`rel` (our links open in-place; no `target=_blank` can survive, so no
 * reverse-tabnabbing surface and no rel-adding hook is needed). data-* and aria-*
 * are also disabled below for a strictly minimal surface.
 */
export const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class',
  'type', 'checked', 'disabled',
  'colspan', 'rowspan',
  'id', 'align',
] as const;

/**
 * Permitted URL schemes for href/src: http, https, mailto, and scheme-less
 * relative references. Everything else — notably `javascript:` and `data:` — is
 * stripped. This is DOMPurify's own battle-tested URI pattern with the scheme
 * alternation narrowed to `https?|mailto` (removing ftp/tel/callto/sms/cid/xmpp);
 * the two trailing alternatives are what preserve relative URLs:
 *   - `[^a-z]`                       first char isn't a letter → `/p`, `#h`, `?q`
 *   - `[a-z+.-]+(?:[^a-z+.\-:]|$)`   a scheme-like run NOT followed by `:` → a
 *                                    relative path like `page.html`, `foo/bar`
 * `data:` is DISALLOWED even for images (default-deny): a data: URI is an extra
 * attack surface (e.g. SVG data URIs) with no M1 use case. Revisit only with a
 * justified image-only carve-out.
 *
 * NOTE: this regex alone does NOT stop `data:` on `<img src>` — DOMPurify has a
 * built-in `DATA_URI_TAGS` exception (img/audio/video/…) that bypasses the URI
 * regex for those media tags. The `uponSanitizeAttribute` hook below closes that
 * gap so the default-deny actually holds.
 */
export const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/** URL-bearing attributes on which a `data:` value must be stripped. */
const URL_ATTRS = new Set(['href', 'src', 'xlink:href']);

/**
 * True if `value`'s URL scheme is `data:`, ignoring the leading C0 control and
 * space characters (code point <= 0x20) that browsers strip before resolving a
 * scheme — this defeats `\tdata:` / ` data:` obfuscation. Kept as a code-point
 * scan (no control chars in a regex literal) for clarity and lint-cleanliness.
 */
function isDataUri(value: string): boolean {
  let i = 0;
  while (i < value.length && value.charCodeAt(i) <= 0x20) i++;
  return value.slice(i, i + 5).toLowerCase() === 'data:';
}

/**
 * The full DOMPurify configuration, assembled from the data above. Passed as
 * explicit config arrays on every call — never mutated at runtime.
 */
export const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [...ALLOWED_TAGS],
  ALLOWED_ATTR: [...ALLOWED_ATTR],
  ALLOWED_URI_REGEXP,
  ALLOW_UNKNOWN_PROTOCOLS: false, // keep unknown schemes disallowed
  ALLOW_DATA_ATTR: false, // no data-* attributes
  ALLOW_ARIA_ATTR: false, // no aria-* attributes (our output emits none in M1)
  SAFE_FOR_XML: true, // DOMPurify default; kept explicit for review
  RETURN_DOM: false, // return an HTML string
  RETURN_DOM_FRAGMENT: false,
};

// Enforce the `data:` default-deny that ALLOWED_URI_REGEXP can't cover alone,
// because DOMPurify whitelists data: URIs on media tags (img/audio/video/source/
// image/track) internally. We drop any href/src/xlink:href whose value resolves
// to a `data:` scheme.
//
// SECURITY (GHSA-76mc-f452-cxcm): this hook is allow-list-SAFE by construction.
// The advisory is about hooks that MUTATE the shared allow-list sets
// (`data.allowedTags` / `data.allowedAttributes`), which pollutes later calls and
// was fixed in dompurify 3.4.7. This hook does neither — it only inspects one
// attribute and, at most, sets `data.keepAttr = false` to drop that value from
// the current node. It never touches `data.allowedTags`/`data.allowedAttributes`.
// Do NOT "simplify" it into an allow-list mutation.
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (URL_ATTRS.has(data.attrName) && isDataUri(data.attrValue)) {
    data.keepAttr = false;
  }
});

/**
 * Sanitize an HTML string into markup that is safe to insert into the DOM.
 *
 * @param html Untrusted HTML (typically the parse stage's output).
 * @returns Sanitized HTML string containing only allow-listed tags/attributes.
 */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;
}
