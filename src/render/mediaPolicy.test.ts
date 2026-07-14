// @vitest-environment jsdom
//
// The remote-resource policy (AGENTS.md #1). Two layers are tested here:
//   - classifyMediaUrl: the pure URL-classification matrix (the whole point is that
//     the SAME relative reference is remote on an https page and local on a file:
//     page — resolution, not string inspection, decides).
//   - applyMediaPolicy / restoreBlockedImages: the DOM neutralize + restore, over a
//     detached root (the inert context mount() uses before commit).

import { describe, it, expect } from 'vitest';
import {
  classifyMediaUrl,
  applyMediaPolicy,
  restoreBlockedImages,
  REMOTE_PLACEHOLDER_CLASS,
} from './mediaPolicy';

const FILE_PAGE = 'file:///home/user/notes/doc.md';
const RAW_HTTPS_PAGE = 'https://raw.githubusercontent.com/o/r/main/README.md';

describe('classifyMediaUrl — resolves against the page URL, then classifies by scheme', () => {
  // [rawUrl, baseUrl, expected]
  const CASES: Array<[string, string, ReturnType<typeof classifyMediaUrl>]> = [
    // absolute http/https → always remote, on any page.
    ['https://example.com/pic.png', FILE_PAGE, 'remote'],
    ['http://example.com/pic.png', RAW_HTTPS_PAGE, 'remote'],
    // protocol-relative → inherits the page scheme (https here) → remote.
    ['//example.com/pic.png', RAW_HTTPS_PAGE, 'remote'],
    // relative ON A file: PAGE → resolves to file: → local (no network).
    ['./assets/diagram.png', FILE_PAGE, 'local'],
    ['../up/one.png', FILE_PAGE, 'local'],
    // the SAME relative reference on a raw-git HTTPS page → remote!
    ['./assets/diagram.png', RAW_HTTPS_PAGE, 'remote'],
    // file: absolute → local.
    ['file:///etc/logo.png', FILE_PAGE, 'local'],
    // data: → inert (never fetched; sanitize already strips it from <img src>).
    ['data:image/png;base64,iVBORw0KGgo=', RAW_HTTPS_PAGE, 'inert'],
    // blob: → inert.
    ['blob:https://example.com/uuid', RAW_HTTPS_PAGE, 'inert'],
  ];

  it.each(CASES)('classifies %s (base %s) as %s', (rawUrl, baseUrl, expected) => {
    expect(classifyMediaUrl(rawUrl, baseUrl)).toBe(expected);
  });

  it('treats an unresolvable value as inert (never fetchable)', () => {
    // A base that URL() cannot use → resolution throws → inert (leave alone).
    expect(classifyMediaUrl('pic.png', 'not-a-valid-base')).toBe('inert');
  });
});

/** Build a DETACHED root with the given innerHTML — mount()'s inert pre-commit context. */
function detachedRoot(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('applyMediaPolicy — block remote, lazy-load local, count blocks', () => {
  it('blocks a remote image: removes the <img>, stashes URL/alt/title on the placeholder', () => {
    const root = detachedRoot(
      '<img src="https://example.com/a.png" alt="a picture" title="t">',
    );
    const blocked = applyMediaPolicy(root, FILE_PAGE);

    expect(blocked).toBe(1);
    expect(root.querySelector('img')).toBeNull();
    const ph = root.querySelector(`.${REMOTE_PLACEHOLDER_CLASS}`)!;
    expect(ph.getAttribute('data-peekover-src')).toBe('https://example.com/a.png');
    expect(ph.getAttribute('data-peekover-alt')).toBe('a picture');
    expect(ph.getAttribute('data-peekover-title')).toBe('t');
    expect(ph.getAttribute('role')).toBe('img');
    expect(ph.getAttribute('aria-label')).toBe('Remote image blocked: a picture');
  });

  it('lazy-loads a local image on a file: page (no block, no placeholder)', () => {
    const root = detachedRoot('<img src="./diagram.png" alt="local">');
    const blocked = applyMediaPolicy(root, FILE_PAGE);

    expect(blocked).toBe(0);
    const img = root.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('./diagram.png');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('blocks a relative image on a raw-git HTTPS page (it is remote there)', () => {
    const root = detachedRoot('<img src="./diagram.png" alt="d">');
    const blocked = applyMediaPolicy(root, RAW_HTTPS_PAGE);

    expect(blocked).toBe(1);
    expect(root.querySelector('img')).toBeNull();
    expect(
      root.querySelector(`.${REMOTE_PLACEHOLDER_CLASS}`)?.getAttribute('data-peekover-src'),
    ).toBe('./diagram.png');
  });

  it('defensively neutralizes a surviving srcset (stashed to data-peekover-srcset)', () => {
    // srcset is not in sanitize's ALLOWED_ATTR today, so this is belt-and-suspenders:
    // if it ever survives, the policy must still not leave a fetchable srcset behind.
    const root = detachedRoot(
      '<img srcset="https://example.com/2x.png 2x, https://example.com/1x.png 1x">',
    );
    const blocked = applyMediaPolicy(root, FILE_PAGE);

    expect(blocked).toBe(1);
    expect(root.querySelector('img')).toBeNull();
    expect(
      root.querySelector(`.${REMOTE_PLACEHOLDER_CLASS}`)?.getAttribute('data-peekover-srcset'),
    ).toBe('https://example.com/2x.png 2x, https://example.com/1x.png 1x');
  });

  it('counts multiple blocks and mixes with a lazy-loaded local image', () => {
    const root = detachedRoot(
      '<img src="https://a.example/1.png">' +
        '<img src="./local.png">' +
        '<img src="http://b.example/2.png">',
    );
    const blocked = applyMediaPolicy(root, FILE_PAGE);

    expect(blocked).toBe(2);
    expect(root.querySelectorAll(`.${REMOTE_PLACEHOLDER_CLASS}`).length).toBe(2);
    const local = root.querySelector('img')!; // the only surviving <img>
    expect(local.getAttribute('src')).toBe('./local.png');
    expect(local.getAttribute('loading')).toBe('lazy');
  });
});

describe('restoreBlockedImages — opt-in turns placeholders back into <img>s', () => {
  it('restores src/srcset/alt/title with loading="lazy", returns the count', () => {
    const root = detachedRoot(
      '<img src="https://example.com/a.png" alt="pic" title="tt">',
    );
    applyMediaPolicy(root, FILE_PAGE);

    const restored = restoreBlockedImages(root);
    expect(restored).toBe(1);
    expect(root.querySelector(`.${REMOTE_PLACEHOLDER_CLASS}`)).toBeNull();
    const img = root.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://example.com/a.png');
    expect(img.getAttribute('alt')).toBe('pic');
    expect(img.getAttribute('title')).toBe('tt');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('is a no-op (returns 0) when there is nothing blocked', () => {
    const root = detachedRoot('<p>no images</p>');
    expect(restoreBlockedImages(root)).toBe(0);
  });
});
