// mediaPolicy — the render-layer remote-resource policy (AGENTS.md #1: zero network
// by DEFAULT; the brand, not a preference). Peekover renders a document's media
// WITHOUT letting the page fetch anything remote until the user opts in with one
// click. This is a RENDER-LAYER decision, not a sanitize strip: sanitize still lets
// http/https `src` through the allow-list (decisions.md 2026-07-14 "Remote resources
// are BLOCKED by default"); THIS module is what actually decides what loads.
//
// THE LOAD-BEARING GOTCHA (read twice): inserting an <img src="http://…"> into the
// LIVE DOM fires the fetch immediately. So the neutralization MUST be complete before
// the HTML ever reaches the live tree. mount() satisfies this by building the reader
// root DETACHED (document.createElement + innerHTML — a detached subtree has no
// browsing context and fetches nothing) and calling applyMediaPolicy() on it BEFORE
// shadow.replaceChildren() commits it. A policy that stripped src AFTER commit would
// have already leaked the request — that is a failed implementation, and the no-leak
// test in mount.test.ts exists to keep it failed-if-reintroduced.
//
// What the policy does, per rendered <img>:
//   - remote  (resolves to http:/https:, incl. protocol-relative) → BLOCK: move the
//             URL to data-peekover-src (+ data-peekover-srcset if a srcset somehow
//             survives sanitize), remove every fetch-capable attribute, and swap the
//             <img> for an inert themed placeholder showing the alt text + a label.
//   - local   (resolves to file: on a file: page — no network involved) → ALLOW, with
//             native loading="lazy".
//   - inert   (data:/blob:/unresolvable) → left alone; data: is already stripped from
//             <img src> by sanitize's own hook, so nothing fetchable reaches here.
//
// One click on the opt-in affordance restores the stored URLs (restoreBlockedImages),
// which re-inserts real <img>s (loading="lazy") and lights the network indicator. No
// persistence — permissions:[] means there is no storage, so a reload blocks again.

/** The classification of a media URL once resolved against the page URL. */
export type MediaClass = 'remote' | 'local' | 'inert';

/** CSS class marking a blocked-remote placeholder (also the restore selector). */
export const REMOTE_PLACEHOLDER_CLASS = 'peekover-remote';

/**
 * Classify a media URL by the scheme it RESOLVES to against the page's base URL.
 * Resolution is what makes a bare `./pic.png` correctly remote on a raw-git https
 * page but local on a file:// page — the same relative reference, two verdicts.
 *
 *   - `remote` — http: or https: (a protocol-relative `//host/x` inherits the base's
 *                scheme, so it lands here on any http(s) page).
 *   - `local`  — file: (a file:// page's own relative/absolute references; no network).
 *   - `inert`  — anything else (data:, blob:) or an unresolvable value; nothing to
 *                fetch, so the policy leaves it untouched.
 *
 * @param rawUrl  The attribute value as authored (may be relative).
 * @param baseUrl The absolute page URL to resolve against (document.baseURI).
 */
export function classifyMediaUrl(rawUrl: string, baseUrl: string): MediaClass {
  let resolved: URL;
  try {
    resolved = new URL(rawUrl, baseUrl);
  } catch {
    // Unresolvable (e.g. empty, or a base we could not use) — not fetchable.
    return 'inert';
  }
  const scheme = resolved.protocol;
  if (scheme === 'http:' || scheme === 'https:') return 'remote';
  if (scheme === 'file:') return 'local';
  return 'inert';
}

/** The first URL token of a srcset value ("url 1x, url2 2x" → "url"). '' if none. */
function firstSrcsetUrl(srcset: string | null | undefined): string {
  if (!srcset) return '';
  const firstCandidate = srcset.split(',')[0]?.trim() ?? '';
  return firstCandidate.split(/\s+/)[0] ?? '';
}

/**
 * Replace a remote <img> with an inert, themed placeholder. The <img> is REMOVED
 * (not merely stripped) so no fetch-capable element remains; its URL(s), alt and
 * title ride along on data-* attributes for a lossless restore on opt-in.
 *
 * The placeholder is an inline <span> (not a block figure): a rendered image can sit
 * inside a paragraph, so a block element would be invalid nesting. Styling in
 * readerCss.ts renders it as a small dashed card carrying a "remote image" label and
 * the alt text.
 */
function replaceWithPlaceholder(
  img: Element,
  src: string,
  srcset: string | null,
): void {
  const doc = img.ownerDocument;
  const alt = img.getAttribute('alt') ?? '';
  const title = img.getAttribute('title');

  const placeholder = doc.createElement('span');
  placeholder.className = REMOTE_PLACEHOLDER_CLASS;
  // Stash the originals for restore. These are data-* attributes we ADD after
  // sanitize has already run, so DOMPurify's ALLOW_DATA_ATTR:false does not apply.
  if (src) placeholder.setAttribute('data-peekover-src', src);
  if (srcset) placeholder.setAttribute('data-peekover-srcset', srcset);
  if (alt) placeholder.setAttribute('data-peekover-alt', alt);
  if (title) placeholder.setAttribute('data-peekover-title', title);
  // a11y: announce it as an image whose remote content is withheld.
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute(
    'aria-label',
    alt ? `Remote image blocked: ${alt}` : 'Remote image blocked',
  );

  const badge = doc.createElement('span');
  badge.className = `${REMOTE_PLACEHOLDER_CLASS}__badge`;
  badge.textContent = 'remote image';
  placeholder.appendChild(badge);
  if (alt) {
    const altText = doc.createElement('span');
    altText.className = `${REMOTE_PLACEHOLDER_CLASS}__alt`;
    altText.textContent = alt;
    placeholder.appendChild(altText);
  }

  img.replaceWith(placeholder);
}

/**
 * Apply the remote-resource policy to every <img> under `root`, classifying each
 * against `baseUrl`. MUST be called on a DETACHED/inert root before it is committed
 * to the live DOM (see the module header + mount.ts) — otherwise remote fetches have
 * already fired.
 *
 * @param root    The (detached) reader root to scan.
 * @param baseUrl The page's absolute base URL for resolving relative references.
 * @returns The count of images BLOCKED (used to decide whether to show the opt-in).
 */
export function applyMediaPolicy(root: ParentNode, baseUrl: string): number {
  let blocked = 0;
  for (const img of Array.from(root.querySelectorAll('img'))) {
    const src = img.getAttribute('src') ?? '';
    // srcset/sizes are NOT in sanitize's ALLOWED_ATTR, so they do not survive to
    // here today — handled defensively so the policy stays correct if that changes.
    const srcset = img.getAttribute('srcset');
    const probe = src || firstSrcsetUrl(srcset);
    const cls = probe ? classifyMediaUrl(probe, baseUrl) : 'inert';

    if (cls === 'remote') {
      blocked++;
      replaceWithPlaceholder(img, src, srcset);
    } else if (cls === 'local') {
      // Permitted local media: never blocks the render, but defer the decode/paint.
      img.setAttribute('loading', 'lazy');
    }
    // 'inert': nothing fetchable — leave it exactly as sanitize produced it.
  }
  return blocked;
}

/**
 * Restore every blocked placeholder under `scope` to a real <img> (loading="lazy"),
 * pulling the URL(s)/alt/title back off the data-* attributes. Returns how many were
 * restored. Called by the opt-in affordance; inserting these <img>s into the live
 * tree is precisely what initiates the (now user-triggered) fetches.
 */
export function restoreBlockedImages(scope: ParentNode): number {
  let restored = 0;
  for (const placeholder of Array.from(
    scope.querySelectorAll(`.${REMOTE_PLACEHOLDER_CLASS}`),
  )) {
    const doc = placeholder.ownerDocument;
    const img = doc.createElement('img');
    const src = placeholder.getAttribute('data-peekover-src');
    const srcset = placeholder.getAttribute('data-peekover-srcset');
    const alt = placeholder.getAttribute('data-peekover-alt');
    const title = placeholder.getAttribute('data-peekover-title');
    if (src) img.setAttribute('src', src);
    if (srcset) img.setAttribute('srcset', srcset);
    if (alt) img.setAttribute('alt', alt);
    if (title) img.setAttribute('title', title);
    img.setAttribute('loading', 'lazy'); // opt-in media is lazy-loaded too
    placeholder.replaceWith(img);
    restored++;
  }
  return restored;
}
