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
 *
 * Deliberately absent: `style` (no inline CSS), `on*` (no event handlers),
 * `target`/`rel` (our links open in-place; no `target=_blank` can survive, so no
 * reverse-tabnabbing surface and no rel-adding hook is needed). data-* and aria-*
 * are also disabled below for a strictly minimal surface.
 *
 * `id` and `align` are intentionally NOT allowed in M1:
 *  - `id` is a DOM-clobbering surface (an attacker-controlled `id` can shadow
 *    named `document`/form properties and confuse later DOM lookups) and has no
 *    M1 producer — heading anchors arrive in M2, where we generate the ids
 *    ourselves and can re-allow `id` deliberately alongside them.
 *  - `align` is dead weight: markdown-it emits table alignment as inline `style`
 *    (which we strip), never as an `align` attribute, so allowing it does nothing.
 *    GFM alignment is restored safely in M2 by mapping to a class (see tasks.md).
 */
export const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class',
  'type', 'checked', 'disabled',
  'colspan', 'rowspan',
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
 * True if `value`'s URL scheme is `data:`. We remove EVERY control/space char
 * (code point <= 0x20) throughout the value before the check, not just leading
 * ones: browsers strip interior tab/LF/CR while resolving a scheme, so
 * `da\tta:` / `d ata:` resolve to `data:` and must be denied too. This affects
 * only the deny DECISION — the original attribute value is never rewritten.
 */
function isDataUri(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0020]+/g, '').slice(0, 5).toLowerCase() === 'data:';
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

// ── THE SVG PROFILE (007 D-1) ────────────────────────────────────────────────
//
// A SECOND NAMED sanitizer, not a parameter to `sanitize()`. A parameter is a value a
// call site can get wrong, and the failure mode is silent widening on the untrusted-
// source path; two differently-named functions cannot be confused by a typo. The
// document profile above keeps exactly one call shape and its three consts are
// BYTE-UNTOUCHED — markdown source still cannot produce an `<svg>`, because `svg` is
// not in ALLOWED_TAGS and this profile is never reachable from the parse stage.
//
// Same construction as above, for the same reason: the allow-list is DATA, and every
// tag/attribute NOT listed is dropped. There is still no FORBID list. `foreignObject`,
// `<a>`, `<switch>`, `<filter>` and the `style`/`on*`/`target` ATTRIBUTES are all denied
// the same way everything else is — by ABSENCE.
//
// The `<style>` ELEMENT is the one exception, and it is the only place in this file where
// the allow-list is not the whole story: it is ADMITTED (decisions.md `0de27f3`, option B)
// because 100% of a flowchart's/state's/gantt's paint is CSS and denying it renders them
// as black silhouettes. Admitting it needs a procedural filter beside the allow-list,
// because DOMPurify has no CSS parser — {@link cleanSvgCss} below is that filter.
//
// The input is our OWN bundled engine's output (D-6), not untrusted source. That does
// not earn it a looser profile: it earns it a TIGHTER one, because a generated artifact
// has a knowable shape. Hence `SVG_ALLOWED_URI_REGEXP` below, which can express no
// scheme at all and is strictly narrower than the document profile's
// `ALLOWED_URI_REGEXP` (`:85-86`).
//
// NOT `USE_PROFILES: {svg:true}` (D-1, rejected): that is permission-by-category, and
// the category it admits includes `foreignObject`'s neighbours. It is also unreviewable
// as data, which is the one thing this file exists to make possible.

/**
 * The only element tags a rendered diagram may contain. Grounded in what the engine
 * actually emits (a survey of `mermaid@11.16.0`'s dist), not in what SVG permits.
 *
 * Denied BY ABSENCE, each for a stated reason — this is the list to read, not a
 * FORBID list to maintain:
 *  - `foreignObject` — re-admits arbitrary HTML into a subtree the document profile
 *    never inspected (spec §3.5). `diagramEngine.ts` sets `htmlLabels: false`, which
 *    is what makes this denial cheap rather than lossy.
 *  - `a` — §3.11 declines diagram interactivity; `bindFunctions` is never called.
 *  - `image` — no producer: `registerIconPacks` is never called from this tree
 *    (`diagramEngine.ts:34-36`), so the engine emits no raster. Same reasoning that
 *    dropped `align` from the document profile: an entry with no producer is dead
 *    weight, and dead weight in an allow-list is surface. Revisit only with icon packs.
 *  - `switch`, `filter` and the `fe*` primitives — `switch` exists to select a
 *    `foreignObject` fallback we do not have; filters are decoration we do not need.
 */
export const SVG_ALLOWED_TAGS = [
  // root & grouping
  'svg', 'g', 'defs', 'symbol', 'use', 'clipPath',
  // shapes
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  // text
  'text', 'tspan',
  // arrowheads & gradients
  'marker', 'linearGradient', 'stop',
  // accessible name & description (§5 — every diagram carries an accessible name)
  'title', 'desc',
  // the engine's own stylesheet — ADMITTED (option B), gated by cleanSvgCss below
  'style',
] as const;

/**
 * The only attributes allowed on any element of a rendered diagram. Geometry, paint,
 * text metrics and the SVG fragment machinery — nothing that can reach the network or
 * the script engine.
 *
 * `id` IS allowed here, unlike the document profile. SVG's internal references are the
 * reason and the whole reason: `marker-end="url(#arrowhead)"` and `xlink:href="#gradient"`
 * are how an arrowhead and a gradient attach, and {@link SVG_ALLOWED_URI_REGEXP} below
 * permits no other kind of reference — a fragments-only URL policy with no ids is a
 * policy that permits nothing at all. The
 * document profile's `id` denial (decisions.md 2026-07-14) is about ATTACKER-authored
 * ids arriving from untrusted markdown; these are authored by our own engine, and no
 * markdown source can reach this profile.
 *
 * Denied by absence, each load-bearing:
 *  - `style` — inline CSS is a network vector DOMPurify does not inspect
 *    (`style="fill:url(http://…)"`). The ELEMENT is now admitted and CSS-cleaned
 *    ({@link cleanSvgCss}); the ATTRIBUTE stays denied, because the engine's paint
 *    rides in the stylesheet and an entry with no producer is surface for nothing.
 *    Admitting it would mean running the CSS pass over a declaration list too.
 *  - `on*` — event handlers. The engine emits `onclick` on click-bound nodes; it is
 *    dropped here rather than trusted not to appear.
 *  - `target`, `data-*` — the first is link machinery for links we do not keep, the
 *    second is the engine's own bookkeeping (`data-id`, `data-et`, `data-look`), inert
 *    but unused. `ALLOW_DATA_ATTR: false` below states the second one twice on purpose.
 *
 * COMPLETENESS is group 3's to verify, not this task's: an attribute missing from this
 * list is a rendering-fidelity bug found against real engine output, and it can never
 * be a security hole — the direction of the failure is what makes that safe.
 */
export const SVG_ALLOWED_ATTR = [
  // identity & hooks (see the `id` note above)
  'id', 'class', 'title',
  // geometry
  'x', 'y', 'dx', 'dy', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
  'x1', 'y1', 'x2', 'y2', 'd', 'points', 'transform', 'transform-origin',
  // viewport
  'viewBox', 'preserveAspectRatio', 'overflow', 'xmlns', 'xmlns:xlink',
  // paint
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
  'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'visibility',
  // text
  'font-family', 'font-size', 'font-style', 'font-weight',
  'text-anchor', 'dominant-baseline', 'alignment-baseline',
  // arrowheads & gradients
  'marker-start', 'marker-mid', 'marker-end',
  'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'orient',
  'gradientUnits', 'offset', 'stop-color', 'stop-opacity',
  // clipping
  'clip-path', 'clip-rule',
  // internal fragment references ONLY — see SVG_ALLOWED_URI_REGEXP
  'href', 'xlink:href',
  // accessibility (`aria-*` arrives via ALLOW_ARIA_ATTR, not by name)
  'role',
] as const;

/**
 * The attributes of {@link SVG_ALLOWED_ATTR} that can carry a REFERENCE, and are
 * therefore the ones {@link SVG_ALLOWED_URI_REGEXP} gates. Everything else in the
 * allow-list is geometry, a metric or a keyword — values that cannot name a resource
 * at all — and is declared URI-safe below.
 *
 * ★ THIS SPLIT IS FORCED BY DOMPURIFY'S ACTUAL BEHAVIOUR, not a preference.
 * `ALLOWED_URI_REGEXP` is NOT applied to URI attributes only: DOMPurify tests it
 * against the value of EVERY attribute that is not in its `URI_SAFE_ATTRIBUTES` set
 * (`alt`, `class`, `for`, `id`, `label`, `name`, `pattern`, `placeholder`, `role`,
 * `summary`, `title`, `value`, `style`, `xmlns`). So a fragments-only regexp applied
 * globally deletes `viewBox="0 0 100 50"`, `d="M0,0 L8,3"`, `transform="translate(4,4)"`,
 * `refX="8"`, `font-size="10"` and every other coordinate in the diagram — verified
 * against dompurify 3.4.12, not reasoned about. `ADD_URI_SAFE_ATTR` is what confines the
 * regexp to the attributes it was written for.
 */
export const SVG_REFERENCE_ATTR = [
  'href', 'xlink:href',
  'fill', 'stroke',
  'clip-path', 'marker-start', 'marker-mid', 'marker-end',
] as const;

/**
 * The complement: allow-listed attributes whose values are inert by construction.
 * DERIVED rather than written out, so the two lists cannot drift apart — an attribute
 * added to SVG_ALLOWED_ATTR is gated unless it is named a reference attribute above.
 */
export const SVG_URI_SAFE_ATTR: readonly string[] = /*#__PURE__*/ SVG_ALLOWED_ATTR.filter(
  (attr) => !(SVG_REFERENCE_ATTR as readonly string[]).includes(attr),
);

/**
 * What a reference attribute may contain. SAME-DOCUMENT REFERENCES AND COLOURS, and
 * nothing else — no scheme is expressible by any alternative below, so there is no
 * `https?`, no `mailto`, no relative path, no `data:` and no `javascript:` to reason
 * about. This is what neutralizes an external `<use href>`, an external or `data:`
 * `xlink:href`, a `javascript:` href, AND an external `fill`/`marker-end`/`clip-path`
 * paint reference: the attribute is dropped and the element survives inert.
 *
 * Four alternatives, each with a producer in real engine output:
 *   - `#[^\s()]*`                    `xlink:href="#dot"`, `fill="#16171F"`
 *   - `url\(#[^\s()]*\)`             `marker-end="url(#arrowhead)"`, `fill="url(#fade)"`
 *   - `rgb|rgba|hsl|hsla(…)`         a computed theme colour; digits and separators only
 *   - `[a-zA-Z-]+`                   a bare keyword — `none`, `currentColor`, `auto`
 *
 * NONE of them can express a fetchable URL: the first two are anchored to `#`, the third
 * admits only digits and separators, and the fourth admits no `:` so it can carry no
 * scheme. `url(http://…)` fails because `url(` must be followed by `#`.
 *
 * ★ THIS IS §2.1 AS AMENDED — design C, per decisions.md *"M7 D-1 / §2.1 AMENDMENT"*
 * (`ff8f323`). §2.1 originally specified this value as literally `/^#/`, which is not
 * implementable: applied globally (see {@link SVG_REFERENCE_ATTR}) it strips
 * `fill="none"`, `stroke="none"` and every `url(#…)` reference in the diagram —
 * arrowheads, gradients and clip paths all die with it. The two SECURITY properties
 * §2.1 asks for (fragments-only references; no external, `data:` or `javascript:` value
 * survives) are preserved here exactly; only the mechanism changed, so that the
 * expression also admits the non-reference values a paint attribute legitimately
 * carries.
 */
export const SVG_ALLOWED_URI_REGEXP =
  /^(?:#[^\s()]*|url\(#[^\s()]*\)|(?:rgb|rgba|hsl|hsla)\([\d\s,.%/+-]+\)|[a-zA-Z-]+)$/i;

/**
 * The SVG profile's DOMPurify configuration. Read side by side with SANITIZE_CONFIG
 * (`:107-117`) — every value matches it except the two named here.
 *
 * DIVERGENCE 1 — `ALLOW_ARIA_ATTR: true`, against the document profile's `false`
 * (`:113`). This is deliberate and is the only config flag that differs. Spec §5
 * requires every diagram to carry an accessible name, and the engine emits
 * `aria-labelledby` / `aria-describedby` / `aria-roledescription` pointing at the
 * `<title>` and `<desc>` allowed above. A diagram with no accessible name is an a11y
 * regression, and `aria-*` carries no script and no URL — the document profile's
 * `false` is a minimal-surface default for output that emits none, not a security
 * boundary. Un-diverging this would silently strip the accessible name.
 *
 * DIVERGENCE 2 — `ALLOWED_URI_REGEXP` is {@link SVG_ALLOWED_URI_REGEXP}, which is
 * STRICTER than the document profile's, not looser: it admits no scheme at all. Its own
 * doc comment records why §2.1's original literal `/^#/` was amended to it (`ff8f323`).
 *
 * DIVERGENCE 3 — `ADD_URI_SAFE_ATTR`, which the document profile does not set. It is not
 * a widening: it is what confines DIVERGENCE 2's regexp to the attributes that can carry
 * a reference, instead of letting it delete every coordinate in the diagram. See
 * {@link SVG_REFERENCE_ATTR} for the mechanism DOMPurify actually implements.
 *
 * The `uponSanitizeAttribute` hook above is INHERITED, not re-registered: it is on the
 * shared DOMPurify singleton, so it fires for this profile's calls too, and `URL_ATTRS`
 * (`:89`) already carries `xlink:href`. A second registration would run the same check
 * twice and would be a second thing to keep in sync. That inheritance is BY CONSTRUCTION,
 * pinned against the real engine rather than assumed (task 2.2) — but it is NOT what
 * protects this profile, and reading it that way is the error the §2.2 AMENDMENT
 * (decisions.md `b19c068`) corrects. The hook is a PROVEN NO-OP here: for it to have any
 * observable effect DOMPurify must otherwise ACCEPT the attribute, and all five
 * `_isValidAttribute` acceptance branches are closed under this config — so a future
 * `removeHook` reds NOTHING on this profile. The `data:` denial is ALLOW-LIST-DRIVEN and
 * hook-INDEPENDENT (a fresh no-hook instance is equally clean, asserted in both engines).
 * What would make the hook load-bearing again is WIDENING SVG_ALLOWED_TAGS to a
 * `DATA_URI_TAGS` member (`image` and its neighbours) — which is exactly the boundary
 * task 2.2's no-hook guard reds on, and the revisit-when `b19c068` records.
 *
 * ★ `/*#__PURE__*\/ …slice()` AND NOT `[...spread]`, AND THAT IS LOAD-BEARING — it is
 * what keeps this profile OFF the content script. `sanitize.ts` is on the content-script
 * graph for the DOCUMENT profile, and the SVG profile is imported by nothing, so it must
 * tree-shake to zero bytes there. An array SPREAD is an iteration-protocol call the
 * bundler cannot prove pure, so it retains this initializer — and with it every string
 * in all three arrays. MEASURED, not reasoned about: with spreads the content script is
 * 316,567 B; with pure-annotated `slice()` it is 315,671 B, byte-identical to the build
 * before this profile existed. The same annotation on {@link SVG_URI_SAFE_ATTR}'s
 * `filter` carries 696 B of that. Do NOT "simplify" either back to a spread.
 */
export const SANITIZE_SVG_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: /*#__PURE__*/ SVG_ALLOWED_TAGS.slice(),
  ALLOWED_ATTR: /*#__PURE__*/ SVG_ALLOWED_ATTR.slice(),
  ALLOWED_URI_REGEXP: SVG_ALLOWED_URI_REGEXP,
  ADD_URI_SAFE_ATTR: /*#__PURE__*/ SVG_URI_SAFE_ATTR.slice(), // DIVERGENCE 3 — see above
  ALLOW_UNKNOWN_PROTOCOLS: false, // keep unknown schemes disallowed
  ALLOW_DATA_ATTR: false, // no data-* attributes (the engine's own bookkeeping)
  ALLOW_ARIA_ATTR: true, // DIVERGENCE 1 — see above
  SAFE_FOR_XML: true, // DOMPurify default; kept explicit for review
  RETURN_DOM: false, // return an SVG string
  RETURN_DOM_FRAGMENT: false,
};

// ── THE CSS PASS (D-1/D-6 option B, decisions.md `0de27f3`) ──────────────────
//
// DOMPurify has no CSS parser. With `<style>` admitted (SVG_ALLOWED_TAGS above) the
// ENTIRE stylesheet would otherwise survive VERBATIM — measured, not assumed: 21/21
// `url()`-bearing declarations, both `@import` forms, `@font-face`'s `src`, and `url()`
// nested inside `@media`/`@supports` all passed through dompurify 3.4.12 untouched. So
// the allow-list needs one procedural filter beside it, and this is the whole of it.
//
// ── THE POLICY ────────────────────────────────────────────────────────────────
//
// DENY  any `url(` TOKEN whose target is not a `#`-fragment, wherever it appears.
// DENY  any at-rule that is not `@keyframes`.
// KEEP  internal `url(#…)` in every quote form, and `@keyframes`.
//
// The coverage is TOKEN-scoped, NOT property-scoped, and that is the load-bearing
// choice. An allow-list of url()-bearing PROPERTIES is one CSS release behind by
// construction: the measured set already runs to 19 spellings (`background-image`,
// `border-image-source`, `list-style-image`, `content`, `cursor`, `shape-outside`,
// `mask-image`, `fill`, `stroke`, `filter`, `clip-path`, `marker-end`, `offset-path`,
// `src` …) plus the url()-WRAPPING functional forms, and it is open-ended.
//
// `@keyframes` is an allow-list of exactly one because that is empirically the only
// at-rule mermaid emits — `edge-animation-frame` and `dash`, unconditionally, from
// `getStyles`' own template, retained by `compileCSS`'s at-rule allow-list *"needed for
// Mermaid's animation feature"*. "Strip all at-rules" would silently kill animated edges.
//
// ── WHY THIS MECHANISM, NOT THE PLATFORM PARSER ───────────────────────────────
//
// The alternative was `CSSStyleSheet` + `replaceSync` + a rule walk (what mermaid itself
// uses), which normalizes every obfuscation lane for free. It was REJECTED for three
// reasons, in order of weight:
//   1. It is BROWSER-ONLY — jsdom has no `replaceSync`, so the pass would silently no-op
//      in the unit suite and in any non-browser caller. A security filter whose teeth
//      depend on the host is a filter with an environment-shaped hole.
//   2. A rule walk must RE-SERIALIZE from the CSSOM, which DROPS every declaration the
//      host engine does not understand — it damages the artifact this pass exists to
//      protect, in a way that varies by browser version.
//   3. A CSS-parser dependency was not on the table: a new dependency is a supply-chain
//      event, and this surface does not need one.
// So: a default-deny scan, in-repo, reviewable as data like the rest of this file.
//
// ── WHY A DECODED SCAN VIEW, AND WHY THE OUTPUT IS NEVER THE DECODED TEXT ─────
//
// A naive `/url\(/` MISSES `u\72 l(` — a CSS escape inside the ident — which is the
// single most load-bearing detail in this pass. So the scan runs over a view in which
// escapes are DECODED and comments are REMOVED (a comment cannot split a token, but it
// can hide a brace or a quote from a scanner that leaves it in). Case, interior
// whitespace and quoting are handled by the token reader below.
//
// The decoded text is NEVER emitted. Cuts are found in view coordinates, mapped back
// through {@link CssScan.map}, and excised from the ORIGINAL string. Emitting decoded
// text would be its own injection vector: `content:"\3c /style\3e…"` decodes to a literal
// `</style>`, and an HTML-namespaced `<style>` serializes its text RAW.
//
// An escape can never produce STRUCTURE, either: `\28` inside an ident is a literal `(`
// in that ident's NAME, not a function-open. Decoding one to a real `(` would let a
// payload fabricate tokens the CSS parser never sees, so structural characters decode to
// {@link CSS_ESCAPE_SENTINEL} instead. That is what makes this a normalization.

/** Stands in for any character an escape decodes to that would otherwise be structural. */
const CSS_ESCAPE_SENTINEL = '\u0001';

/** Characters that carry structure in CSS, and that therefore no escape may produce. */
const CSS_STRUCTURAL = /[\s{}()[\]"';:,/*\\@<>&]/;

/** `\` + 1-6 hex digits + one optional trailing whitespace (CRLF counts as one). */
const CSS_HEX_ESCAPE = /^\\([\dA-Fa-f]{1,6})(?:\r\n|[ \n\r\t\f])?/;

/**
 * What may continue an identifier — so `blurl(` is a function named `blurl`, not a url.
 * {@link CSS_ESCAPE_SENTINEL} counts as one on purpose: it stands where an ESCAPED
 * character was, and an escape is part of the ident it sits in. Without it, `a\28 url(`
 * would read as a url token where CSS sees the function name `a(url`.
 */
// eslint-disable-next-line no-control-regex -- the sentinel is deliberate, not a stray byte
const CSS_IDENT_CHAR =/[\w\u0001\u00a0-\uffff-]/;

/** The one target a `url()` may name: a same-document fragment, anchored at both ends. */
const CSS_INTERNAL_REF = /^#[^\s()]*$/;

/**
 * Functions denied WHOLE rather than by their inner `url()`. `image-set()` accepts a bare
 * `<string>` as an image (`image-set("x.png" 1x)`) — a fetch with no `url(` token in it at
 * all — so a url()-scoped scan alone would miss it. Neither has a producer in engine
 * output, which is what makes denying the whole function free.
 */
const CSS_DENIED_FUNCTIONS = ['image-set(', '-webkit-image-set('];

/** Only `@keyframes` survives; every other at-rule is cut prelude-and-block. */
const CSS_ALLOWED_AT_RULE = 'keyframes';

/** A cut that would let raw-text serialization break out of the `<style>` element. */
const CSS_STYLE_BREAKOUT = /<\/style/i;

/** A decoded, comment-free view of CSS text, plus the map back to source offsets. */
interface CssScan {
  /** The text the scanner reads. */
  text: string;
  /** `map[i]` is the source offset that produced `text[i]`; `map[text.length]` is the end. */
  map: number[];
}

function decodeCssForScan(css: string): CssScan {
  const chars: string[] = [];
  const map: number[] = [];

  const push = (decoded: string, at: number): void => {
    for (let k = 0; k < decoded.length; k += 1) {
      chars.push(CSS_STRUCTURAL.test(decoded[k]) ? CSS_ESCAPE_SENTINEL : decoded[k]);
      map.push(at);
    }
  };

  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    // Comments are dropped from the view so they cannot hide a brace or a quote from the
    // scan. This makes the pass STRICTER than CSS, deliberately: `ur/**/l(` is two idents
    // to a real parser and fetches nothing, but reads as a url token here and is cut.
    // Removal can only ever join text into MORE apparent tokens, never fewer, so the only
    // error it can introduce is an over-strip — and no engine output puts a comment
    // mid-token.
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    if (ch === '\\') {
      const hex = CSS_HEX_ESCAPE.exec(css.slice(i, i + 9));
      if (hex) {
        const cp = Number.parseInt(hex[1], 16);
        const bad = cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff);
        push(bad ? '\ufffd' : String.fromCodePoint(cp), i);
        i += hex[0].length;
        continue;
      }
      const next = css[i + 1];
      if (next === undefined) {
        i += 1;
        continue;
      }
      // A newline after `\` is a string continuation: it contributes nothing.
      if (next !== '\n' && next !== '\r' && next !== '\f') push(next, i);
      i += 2;
      continue;
    }
    chars.push(ch);
    map.push(i);
    i += 1;
  }

  map.push(css.length);
  return { text: chars.join(''), map };
}

/** Index just past a string token. A raw newline ends a bad string, as CSS does. */
function skipCssString(t: string, open: number): number {
  const quote = t[open];
  let j = open + 1;
  while (j < t.length && t[j] !== quote && t[j] !== '\n') j += 1;
  return t[j] === quote ? j + 1 : j;
}

/** Index just past the `)` that closes the group `t[open] === '('` opens. */
function endOfCssParens(t: string, open: number): number {
  let depth = 0;
  let j = open;
  while (j < t.length) {
    const c = t[j];
    if (c === '"' || c === "'") {
      j = skipCssString(t, j);
      continue;
    }
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return j + 1;
    }
    j += 1;
  }
  return t.length;
}

/** Index just past the `}` that closes the block `t[open] === '{'` opens. */
function endOfCssBlock(t: string, open: number): number {
  let depth = 0;
  let j = open;
  while (j < t.length) {
    const c = t[j];
    if (c === '"' || c === "'") {
      j = skipCssString(t, j);
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return j + 1;
    }
    j += 1;
  }
  return t.length;
}

/** Index just past an at-rule: its `;`, or its block. Unterminated runs to the end. */
function endOfCssAtRule(t: string, at: number): number {
  let j = at + 1;
  while (j < t.length) {
    const c = t[j];
    if (c === '"' || c === "'") {
      j = skipCssString(t, j);
      continue;
    }
    if (c === ';') return j + 1;
    if (c === '{') return endOfCssBlock(t, j);
    j += 1;
  }
  return t.length;
}

/**
 * Read a url token whose `(` has already been consumed (`open` is the index after it).
 * Handles the interior-whitespace and both-quote lanes; the case lane is handled by the
 * caller's lowercased compare, the escape lane by the decoded view.
 */
function readCssUrlToken(t: string, open: number): { end: number; target: string } {
  let j = open;
  while (j < t.length && /\s/.test(t[j])) j += 1;

  let target: string;
  if (t[j] === '"' || t[j] === "'") {
    const quote = t[j];
    const start = j + 1;
    let k = start;
    while (k < t.length && t[k] !== quote && t[k] !== '\n') k += 1;
    target = t.slice(start, k);
    j = t[k] === quote ? k + 1 : k;
  } else {
    const start = j;
    while (j < t.length && t[j] !== ')') j += 1;
    target = t.slice(start, j);
  }

  while (j < t.length && t[j] !== ')') j += 1;
  return { end: j < t.length ? j + 1 : t.length, target: target.trim() };
}

/** Half-open spans of `t` to delete, in increasing order and non-overlapping. */
function findCssCuts(t: string): [number, number][] {
  const cuts: [number, number][] = [];
  let i = 0;

  while (i < t.length) {
    const c = t[i];

    if (c === '"' || c === "'") {
      i = skipCssString(t, i);
      continue;
    }

    if (c === '@') {
      const name = /^@([A-Za-z-]*)/.exec(t.slice(i, i + 40))?.[1] ?? '';
      if (name.toLowerCase() === CSS_ALLOWED_AT_RULE) {
        // Descend INTO it: a url() inside @keyframes is still a url().
        i += name.length + 1;
        continue;
      }
      const end = endOfCssAtRule(t, i);
      cuts.push([i, end]);
      i = end;
      continue;
    }

    // Cheap first char test before the slice, so this stays one pass over the text.
    if (
      (c === 'u' || c === 'U' || c === 'i' || c === 'I' || c === '-') &&
      !CSS_IDENT_CHAR.test(t[i - 1] ?? '')
    ) {
      const head = t.slice(i, i + 19).toLowerCase();
      if (head.startsWith('url(')) {
        const { end, target } = readCssUrlToken(t, i + 4);
        if (!CSS_INTERNAL_REF.test(target)) cuts.push([i, end]);
        i = end;
        continue;
      }
      const denied = CSS_DENIED_FUNCTIONS.find((fn) => head.startsWith(fn));
      if (denied) {
        const end = endOfCssParens(t, i + denied.length - 1);
        cuts.push([i, end]);
        i = end;
        continue;
      }
    }

    i += 1;
  }

  return cuts;
}

function applyCssCuts(css: string, cuts: [number, number][], map: number[]): string {
  let out = '';
  let read = 0;
  for (const [a, b] of cuts) {
    const from = map[a];
    if (from < read) continue; // defensive: the walk never emits overlapping cuts
    out += css.slice(read, from);
    read = map[b];
  }
  return out + css.slice(read);
}

/**
 * Strip every external reference from a `<style>` element's CSS text, preserving internal
 * `url(#…)` references and `@keyframes`. See the block comment above for the policy and
 * the mechanism.
 *
 * Runs to a FIXPOINT rather than once, and fails CLOSED. Excision joins the text either
 * side of a cut, and a fixpoint check is what proves the join cannot reconstitute a token
 * this pass would have denied — cheaper to guarantee than to argue. Three rounds is far
 * beyond any real input (engine output needs zero); a stylesheet still dirty after them is
 * not one to ship, so it is dropped whole.
 *
 * The breakout guard is the other half of "never emit decoded text": an excision could in
 * principle join `</style` to a following `>`, and an HTML-namespaced `<style>` serializes
 * its children RAW. The source text cannot contain a real `</style>` — the parser would
 * have ended the element — so this can only ever fire on text this pass itself produced.
 *
 * @param css The `<style>` element's text content.
 * @returns The same string when nothing is denied (byte-identical, so a clean artifact is
 *          untouched), the excised text otherwise, or `''` if it cannot be made clean.
 */
export function cleanSvgCss(css: string): string {
  let out = css;
  for (let round = 0; round < 3; round += 1) {
    const view = decodeCssForScan(out);
    const cuts = findCssCuts(view.text);
    if (cuts.length === 0) return CSS_STYLE_BREAKOUT.test(out) ? '' : out;
    out = applyCssCuts(out, cuts, view.map);
  }
  return '';
}

/**
 * The CSS pass as DOMPurify sees it. Registered around the {@link sanitizeSvg} call and
 * removed again, NOT at module scope — two reasons, both load-bearing:
 *  - it is what keeps this profile OFF THE CONTENT SCRIPT. A module-scope `addHook` is a
 *    side effect the bundler must retain, and it would drag the whole pass with it. See
 *    the `/*#__PURE__*\/` note on SANITIZE_SVG_CONFIG for the same fence, measured.
 *  - scoping is then BY CONSTRUCTION rather than by a name test: the document profile
 *    cannot reach this pass even in principle. (It could not anyway — `style` is not in
 *    its allow-list, and `afterSanitizeElements` does not run on removed nodes — but a
 *    construction beats an argument about DOMPurify's internal ordering.)
 */
const cssPassHook = (node: Node): void => {
  if (node.nodeType !== 1) return;
  const el = node as Element;
  if (el.localName.toLowerCase() !== 'style') return;

  // A non-text child means the CSS TEXT can still change after this hook has read it —
  // DOMPurify visits children AFTER their parent, and dropping one (a comment, or an
  // element whose content is forbidden) re-joins the text either side of it. That can
  // splice two inert idents into a live `url(` token. No engine output has one; deny.
  for (let i = 0; i < el.childNodes.length; i += 1) {
    if (el.childNodes[i].nodeType !== 3) {
      el.textContent = '';
      return;
    }
  }

  const css = el.textContent ?? '';
  const cleaned = cleanSvgCss(css);
  if (cleaned !== css) el.textContent = cleaned;
};

/**
 * Sanitize a rendered diagram's SVG into markup that is safe to insert into the DOM.
 *
 * Separate from {@link sanitize} on purpose (D-1): this profile permits `<svg>` and the
 * document profile must never learn to. Callers hold one or the other, never a flag.
 *
 * @param svg SVG markup produced by the bundled diagram engine.
 * @returns Sanitized SVG string containing only allow-listed tags/attributes, with every
 *          external reference stripped from any `<style>` it carries.
 */
export function sanitizeSvg(svg: string): string {
  DOMPurify.addHook('afterSanitizeElements', cssPassHook);
  try {
    return DOMPurify.sanitize(svg, SANITIZE_SVG_CONFIG) as string;
  } finally {
    DOMPurify.removeHook('afterSanitizeElements', cssPassHook);
  }
}
