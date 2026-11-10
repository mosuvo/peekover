// @vitest-environment jsdom
//
// mountReader composition — the REAL content-script injection path (AGENTS.md #5).
// mount()'s own throw -> raw-fallback is covered in mount.fallback.test.ts; this
// file covers the step mount() cannot see: mountReader hides the HOST page's
// original nodes, and it must NEVER leave the page hidden with nothing valid
// shown. We mock ./mount so each test can drive success / throw / empty-render
// independently of the real parse -> sanitize pipeline.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mutable stub, so each test decides how the render behaves. Hoisted above the
// import of ./mountReader so mountReader() binds to this mock.
let mountImpl: (source: string, host: HTMLElement) => void;
// M13 8.1i (f) follow-up: the teardown also stops the at-rest band's tracking (its frame and listeners).
const stopped: HTMLElement[] = [];
vi.mock('./mount', () => ({
  mount: (source: string, host: HTMLElement) => mountImpl(source, host),
  stopRestTracking: (host: HTMLElement) => void stopped.push(host),
}));

import { mountReader } from './mountReader';

const HOST_TAG = 'peekover-root';

/** Seed the page the way a browser renders a raw .md file: text inside a <pre>. */
function seedRawPage(markdown: string): HTMLElement {
  document.body.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = markdown;
  document.body.appendChild(pre);
  return pre;
}

/** A render that SUCCEEDS: commit non-empty content into an open shadow root, the
 *  way the real mount() does (replaceChildren of a reader root). */
function renderOk(source: string, host: HTMLElement): void {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const root = document.createElement('div');
  root.className = 'peekover-reader';
  root.textContent = source;
  shadow.replaceChildren(root);
}

describe('mountReader — never leaves the page hidden with nothing shown', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    mountImpl = renderOk;
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('restores the original page when the render THROWS (not blank)', () => {
    const pre = seedRawPage('# hello\n\nworld');
    mountImpl = () => {
      throw new Error('forced render failure');
    };

    // NOT committed — a real render failure returns false, so runReader's floor
    // (timer / final attempt) reveals the raw text rather than handing off to us.
    expect(mountReader()).toBe(false);

    // The invariant: never both hidden AND nothing shown. Original text is still
    // visible (not display:none)...
    expect(pre.style.display).not.toBe('none');
    expect(document.body.textContent).toContain('hello');
    // ...and our host was torn back out (full restore of the browser's rendering).
    expect(document.querySelector(HOST_TAG)).toBeNull();
    expect(warn).toHaveBeenCalled();
    // ...with its at-rest tracking stopped first (8.1i (f) follow-up).
    expect(stopped.at(-1)?.tagName.toLowerCase()).toBe(HOST_TAG);
  });

  it('bails and restores when the render produces EMPTY content', () => {
    const pre = seedRawPage('# hello');
    mountImpl = (_source, host) => {
      // Attaches a shadow root but commits nothing — a degenerate blank render
      // mount() should never do, but mountReader must not trust it and hide behind.
      host.attachShadow({ mode: 'open' });
    };

    // Empty render is treated as failure -> not committed.
    expect(mountReader()).toBe(false);

    expect(pre.style.display).not.toBe('none');
    expect(document.querySelector(HOST_TAG)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('hides the originals ONLY after a successful, non-empty render', () => {
    const pre = seedRawPage('# hello\n\nworld');

    // A committed reader host -> true.
    expect(mountReader()).toBe(true);

    // Success path: originals hidden, reader mounted with visible content.
    expect(pre.style.display).toBe('none');
    const host = document.querySelector(HOST_TAG);
    expect(host).not.toBeNull();
    expect(host!.shadowRoot?.textContent).toContain('hello');
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves the page untouched when there is no readable source', () => {
    seedRawPage('   \n   ');
    // The no-source no-op returns false — this is what tells runReader "not ready yet,
    // keep waiting" instead of tearing the mount path down (the Gecko-timing fix).
    expect(mountReader()).toBe(false);
    // No host injected, nothing hidden — a full no-op (existing guard preserved).
    expect(document.querySelector(HOST_TAG)).toBeNull();
  });

  it('is idempotent: a second call is a no-op once the host exists', () => {
    seedRawPage('# hello');
    mountReader();
    const first = document.querySelector(HOST_TAG);

    // Re-entry over a live reader counts as committed (visibility already ours) -> true.
    expect(mountReader()).toBe(true);

    expect(document.querySelectorAll(HOST_TAG).length).toBe(1);
    expect(document.querySelector(HOST_TAG)).toBe(first);
  });
});
