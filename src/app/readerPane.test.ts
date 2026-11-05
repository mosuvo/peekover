// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { createReaderPane, classifyReaderOutcome, type ReaderFile } from './readerPane';
import { CONTAINED_CSS } from '../theme/readerCss';

// Task 1.2 [§9 select-file-renders; §9 empty designed state — jsdom half].
//
// Two levels, matching the M1 mount/mountReader discipline:
//   1. classifyReaderOutcome — the PURE never-blank decision, tested in isolation.
//   2. the DOM controller — a selected file renders through the unchanged mount()
//      pipeline (a mount host with shadow content appears), and every other outcome
//      (empty file, unreadable file, cleared selection) paints a designed state, never
//      a blank pane.
//
// jsdom is the right home for these: they are DOM-SHAPE assertions. mount() itself is
// M1-tested; the real cancel/deny grant flow is the human gate (6.3). The bytes-on-wire
// zero-network proof lives in the browser project (group 3), not here.

/** A file whose read resolves to `text`. */
function fileWith(text: string, name = 'doc.md'): ReaderFile {
  return { name, read: async () => text };
}
/** A file whose read rejects — the unreadable / revoked-access case. */
function unreadableFile(name = 'gone.md'): ReaderFile {
  return {
    name,
    read: async () => {
      throw new Error('read failed');
    },
  };
}

describe('classifyReaderOutcome (pure never-blank decision)', () => {
  it('no file → no-selection', () => {
    expect(classifyReaderOutcome(null, { ok: true, text: 'anything' })).toEqual({
      kind: 'no-selection',
    });
  });

  it('read failure → unreadable (carries the name)', () => {
    expect(classifyReaderOutcome(fileWith('x', 'a.md'), { ok: false, error: new Error('x') })).toEqual(
      { kind: 'unreadable', name: 'a.md' },
    );
  });

  it('empty / whitespace-only text → empty-file (carries the name)', () => {
    expect(classifyReaderOutcome(fileWith('', 'b.md'), { ok: true, text: '' })).toEqual({
      kind: 'empty-file',
      name: 'b.md',
    });
    expect(classifyReaderOutcome(fileWith(' \n\t ', 'c.md'), { ok: true, text: ' \n\t ' })).toEqual({
      kind: 'empty-file',
      name: 'c.md',
    });
  });

  it('real content → render (passes the text through verbatim)', () => {
    expect(classifyReaderOutcome(fileWith('# Hi'), { ok: true, text: '# Hi' })).toEqual({
      kind: 'render',
      text: '# Hi',
    });
  });
});

describe('reader pane (DOM controller)', () => {
  let pane: ReturnType<typeof createReaderPane>;

  beforeEach(() => {
    document.body.innerHTML = '';
    pane = createReaderPane(document);
    document.body.appendChild(pane.element);
  });

  it('starts in the designed no-selection state, never blank', () => {
    const state = pane.element.querySelector('[data-state="no-selection"]');
    expect(state).not.toBeNull();
    expect(pane.element.textContent?.trim()).not.toBe('');
    // The detail copy (human-approved 2026-11-05: it shows only with a folder open).
    expect(state!.textContent).toContain('Pick a file to start reading.');
    // Nothing has been mounted yet.
    expect(pane.element.querySelector('.peekover-app__reader__host')).toBeNull();
  });

  it('selecting a file renders it through the unchanged M1 mount() pipeline', async () => {
    await pane.select(fileWith('# Heading\n\nSome **bold** text.'));

    // The mount host appears and mount() populated its shadow root — the M1 pipeline
    // ran. This FAILS if select() stopped short of calling mount() (non-vacuous).
    const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot).not.toBeNull();
    expect(host!.shadowRoot!.childNodes.length).toBeGreaterThan(0);
    // The rendered heading is inside the shadow root (proof the source was rendered,
    // not just an empty host committed).
    expect(host!.shadowRoot!.querySelector('h1')?.textContent).toContain('Heading');
    // No designed state is showing while real content renders.
    expect(pane.element.querySelector('[data-state]')).toBeNull();
  });

  it('renders CONTAINED — requests mount()`s contained mode so the reader stays in the pane', async () => {
    // Intent-guard (jsdom can't prove GEOMETRY — see the browser test for that). It proves
    // the pane OPTED IN: mount() injects CONTAINED_CSS as an extra <style> ONLY when called
    // with { contained: true }, so its presence in the shadow root is a direct, cheap witness
    // that the flag is still wired. If a refactor drops it, the pane silently reverts to the
    // full-page-takeover bug — and this fails fast.
    await pane.select(fileWith('# Heading'));

    const host = pane.element.querySelector<HTMLElement>('.peekover-app__reader__host');
    const styles = Array.from(host!.shadowRoot!.querySelectorAll('style'));
    expect(styles.some((s) => s.textContent === CONTAINED_CSS)).toBe(true);
  });

  it('degrades an EMPTY file to the designed empty state — never blank, no mount host', async () => {
    await pane.select(fileWith('   \n  ', 'empty.md'));

    const state = pane.element.querySelector('[data-state="empty-file"]');
    // Non-vacuous: if the empty-file degrade path were removed and select() instead
    // mounted the whitespace, this assertion fails (no empty-file state, a host instead).
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('empty.md');
    expect(pane.element.querySelector('.peekover-app__reader__host')).toBeNull();
    expect(pane.element.textContent?.trim()).not.toBe('');
  });

  it('degrades an UNREADABLE file (read rejects) to the designed error state — never blank', async () => {
    await pane.select(unreadableFile('gone.md'));

    const state = pane.element.querySelector('[data-state="unreadable"]');
    // Non-vacuous: if the try/catch around read() were removed, select() would reject
    // and this state would never render — the test would fail on the rejected promise.
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('gone.md');
    expect(pane.element.querySelector('.peekover-app__reader__host')).toBeNull();
    expect(pane.element.textContent?.trim()).not.toBe('');
  });

  it('re-selecting after a designed state renders again (host reused, no leaked roots)', async () => {
    await pane.select(fileWith('# First'));
    await pane.select(unreadableFile()); // designed state — host detached
    await pane.select(fileWith('# Second'));

    const hosts = pane.element.querySelectorAll('.peekover-app__reader__host');
    // Exactly one host — the persistent one reused, not a duplicate per render.
    expect(hosts.length).toBe(1);
    expect(hosts[0].shadowRoot!.querySelector('h1')?.textContent).toContain('Second');
    expect(pane.element.querySelector('[data-state]')).toBeNull();
  });

  it('clearing the selection (null) returns to the no-selection state', async () => {
    await pane.select(fileWith('# Content'));
    expect(pane.element.querySelector('[data-state]')).toBeNull();

    await pane.select(null);
    expect(pane.element.querySelector('[data-state="no-selection"]')).not.toBeNull();
    expect(pane.element.querySelector('.peekover-app__reader__host')).toBeNull();
  });
});
