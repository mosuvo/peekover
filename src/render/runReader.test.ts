// @vitest-environment jsdom
//
// runReader — the document_start hidden-raw orchestration (AGENTS.md #5). These tests
// drive the timing/visibility contract directly with injected seams (isRenderable,
// mount) so no real navigation is needed. The one path that needs the REAL pipeline —
// a pipeline throw degrading to the shadow raw view — lives in runReader.fallback.test.ts
// (it must mock ./parse file-wide). Here we prove: detect-before-hide, unhide on every
// failure shape, the safety timer both ways, and that a real success neutralizes the
// hide while the Raw toggle keeps working.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runReader, injectHideStyle, HIDE_STYLE_ID, SAFETY_UNHIDE_MS } from './runReader';

/** Seed the page the way a browser renders a raw .md file: text inside a <pre>. */
function seedRawPage(markdown: string): HTMLElement {
  document.body.innerHTML = '';
  const pre = document.createElement('pre');
  pre.textContent = markdown;
  document.body.appendChild(pre);
  return pre;
}

/** Force document.readyState (jsdom leaves it 'complete'; document_start is 'loading'). */
function setReadyState(value: DocumentReadyState): void {
  Object.defineProperty(document, 'readyState', { configurable: true, value });
}

describe('runReader — mount at document_start behind a hidden raw view', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    // The hide <style> lives under <html>, not <body>, so innerHTML='' won't clear it.
    document.getElementById(HIDE_STYLE_ID)?.remove();
    document.querySelectorAll('peekover-root').forEach((el) => el.remove());
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    vi.useRealTimers();
    setReadyState('complete');
  });

  it('injects the hide <style> under <html> so it applies at document_start', () => {
    injectHideStyle();
    const style = document.getElementById(HIDE_STYLE_ID);
    expect(style).not.toBeNull();
    // <head>/<body> may not exist yet at document_start; parenting to <html> is the point.
    expect(style?.parentElement).toBe(document.documentElement);
    // display:none (not visibility:hidden) — it must keep the raw <pre> out of layout.
    expect(style?.textContent).toContain('display:none');
    expect(style?.textContent).toContain('peekover-root');
  });

  it('does nothing and injects no hide style when the context does not match', () => {
    const pre = seedRawPage('# hello');
    const mount = vi.fn();

    runReader({ isRenderable: () => false, mount });

    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // page completely untouched
    expect(mount).not.toHaveBeenCalled();
    expect(pre.style.display).not.toBe('none');
  });

  it('hides BEFORE mounting: the hide style is live when mount() runs', () => {
    seedRawPage('# hello');
    let hideActiveAtMount = false;
    const mount = vi.fn(() => {
      hideActiveAtMount = !!document.getElementById(HIDE_STYLE_ID);
    });

    runReader({ isRenderable: () => true, mount });

    expect(mount).toHaveBeenCalledOnce();
    expect(hideActiveAtMount).toBe(true); // detect -> hide -> mount, in that order
  });

  it('reveals the raw text when the mount does not take over the page (failure)', () => {
    const pre = seedRawPage('# hello');
    // Simulate mountReader's failure/no-op shape: nothing mounted, originals untouched.
    const mount = vi.fn(() => {});

    runReader({ isRenderable: () => true, mount });

    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // unhidden -> raw visible
    expect(pre.style.display).not.toBe('none');
    expect(document.body.contains(pre)).toBe(true);
  });

  it('still reveals if the mount throws unexpectedly (the finally backstop)', () => {
    const pre = seedRawPage('# hello');
    const mount = vi.fn(() => {
      throw new Error('unforeseen mount failure');
    });

    // The throw surfaces (mountReader itself never throws; this is the belt-and-suspenders
    // path), but the hide style is dropped first, so the page is never left blank.
    expect(() => runReader({ isRenderable: () => true, mount })).toThrow('unforeseen');
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull();
    expect(pre.style.display).not.toBe('none');
  });

  it('safety timer reveals the raw text if the mount never runs', () => {
    vi.useFakeTimers();
    setReadyState('loading'); // document_start: mount is deferred to DOMContentLoaded
    const pre = seedRawPage('# hello');
    const mount = vi.fn();

    runReader({ isRenderable: () => true, mount });

    // Hidden, and mount is waiting for a DOMContentLoaded that never comes.
    expect(document.getElementById(HIDE_STYLE_ID)).not.toBeNull();
    expect(mount).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SAFETY_UNHIDE_MS);

    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // backstop unhid the page
    expect(mount).not.toHaveBeenCalled();
    expect(pre.style.display).not.toBe('none');
  });

  it('a completed mount cancels the safety timer — no late double-toggle or flicker', () => {
    vi.useFakeTimers(); // readyState stays 'complete' -> mount runs synchronously
    const pre = seedRawPage('# hello');
    const mount = vi.fn(() => {
      // Simulate a mountReader success: reader host up, originals hidden inline.
      const host = document.createElement('peekover-root');
      host.attachShadow({ mode: 'open' }).appendChild(document.createElement('div'));
      document.body.appendChild(host);
      pre.style.display = 'none';
    });

    runReader({ isRenderable: () => true, mount });

    expect(mount).toHaveBeenCalledOnce();
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // neutralized on success

    vi.advanceTimersByTime(SAFETY_UNHIDE_MS * 2);

    // The late timer must not resurrect the hide, spawn a second reader, or un-hide the
    // originals the reader is now responsible for.
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull();
    expect(document.querySelectorAll('peekover-root').length).toBe(1);
    expect(pre.style.display).toBe('none');
  });

  it('success with the REAL reader: mounts, neutralizes the hide, Raw toggle still works', () => {
    const source = '# Title\n\nSome body text.';
    seedRawPage(source);

    runReader({ isRenderable: () => true }); // real mountReader + real parse/sanitize/mount

    const host = document.querySelector('peekover-root') as HTMLElement | null;
    expect(host).not.toBeNull();
    expect(host!.shadowRoot?.querySelector('.peekover-reader')).not.toBeNull();
    expect(host!.getAttribute('data-mode')).toBe('reading');
    expect(document.getElementById(HIDE_STYLE_ID)).toBeNull(); // hide handed back to the toggle

    // The bare-`\` shortcut flips Raw <-> Reading (a pure attribute flip, no reparse).
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\' }));
    expect(host!.getAttribute('data-mode')).toBe('raw');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\' }));
    expect(host!.getAttribute('data-mode')).toBe('reading');
  });
});
