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
// `<style>`, `<a>`, `<switch>`, `<filter>` and the `style`/`on*`/`target` attributes
// are all denied the same way everything else is — by ABSENCE.
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
 *  - `style` — DOMPurify has no CSS parser, so an `@import` inside a `<style>` it was
 *    told to keep survives VERBATIM (verified against dompurify 3.4.12, not assumed).
 *    Dropping the element drops the rule with it, which keeps the `@import` denial
 *    inside the allow-list instead of needing a CSS hook beside it.
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
 *    (`style="fill:url(http://…)"`), for the same reason the `<style>` element is out.
 *    The engine emits it heavily; see the note above SVG_ALLOWED_TAGS.
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

/**
 * Sanitize a rendered diagram's SVG into markup that is safe to insert into the DOM.
 *
 * Separate from {@link sanitize} on purpose (D-1): this profile permits `<svg>` and the
 * document profile must never learn to. Callers hold one or the other, never a flag.
 *
 * @param svg SVG markup produced by the bundled diagram engine.
 * @returns Sanitized SVG string containing only allow-listed tags/attributes.
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, SANITIZE_SVG_CONFIG) as string;
}
