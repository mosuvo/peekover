// @vitest-environment jsdom
//
// runReader end-to-end when the render PIPELINE throws (AGENTS.md #5). We force the
// parse stage to throw so the whole real chain runs: runReader hides the raw text ->
// mounts -> mount() degrades to the shadow raw view + banner -> mountReader treats that
// non-empty render as success -> runReader neutralizes the hide. The user sees the raw
// source, never a blank page. Isolated in its own file because it mocks './parse'
// file-wide (same reason mount.fallback.test.ts is separate).

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted above the import chain (runReader -> mountReader -> mount -> parse), so the
// real mount() binds to this throwing parse and takes its never-blank fallback.
vi.mock('./parse', () => ({
  parse: () => {
    throw new Error('forced parse failure');
  },
}));

import { runReader, HIDE_STYLE_ID } from './runReader';

/** Seed the page the way a browser renders a raw .md file: text inside a <pre>. */
function seedRawPage(markdown: string): HTMLElement {
  document.body.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = markdown;
  document.body.appendChild(pre);
  return pre;
}

describe('runReader — a pipeline throw ends with the raw source visible, never blank', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.getElementById(HIDE_STYLE_ID)?.remove();
    document.querySelectorAll('peekover-root').forEach((el) => el.remove());
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('drops the hide style and shows the raw source (in the shadow fallback) on a parse throw', () => {
    const source = '# hello\n\n<script>alert(1)</script>';
    seedRawPage(source);

    runReader({ isRenderable: () => true });

    // 1. The hide <style> is gone — the page is not left hidden.
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull();

    // 2. The reader host is up, showing the raw source as escaped text (never blank,
    //    never parsed as HTML — the <script> is inert text, not an element).
    const host = document.querySelector('peekover-root') as HTMLElement | null;
    expect(host).not.toBeNull();
    const raw = host!.shadowRoot?.querySelector('pre.peekover-raw');
    expect(raw?.textContent).toBe(source);
    expect(host!.shadowRoot?.querySelector('script')).toBeNull();

    // 3. Failure-raw is distinguishable from user-raw (decisions.md): banner + NO
    //    data-mode, so the toggle shortcut stays inert.
    expect(host!.shadowRoot?.querySelector('.peekover-alert')).not.toBeNull();
    expect(host!.hasAttribute('data-mode')).toBe(false);

    // Dev-only warning fired from mount()'s fallback.
    expect(warn).toHaveBeenCalled();
  });
});
