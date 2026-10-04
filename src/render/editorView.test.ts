// @vitest-environment jsdom
//
// editorView — the edit view's shell (012 task 2.2, D-4 as re-ruled): what build adds to the outer
// shadow root, that preview renders go to the nested host and nowhere else, and that teardown is
// build's exact inverse.
//
// jsdom-safe vs real-engine: everything here is DOM shape, node identity and call arguments.
// Layout, the resolved scroll box, the registry-gated chrome with the registries live and the
// backtick are real-engine-or-nothing — tests/browser/editorNestedHost.browser.test.ts.

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./mount', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./mount')>();
  return { ...actual, mount: vi.fn(actual.mount) };
});

import { mount } from './mount';
import { enterEditMode, exitEditMode } from './readerMode';
import {
  EDITOR_PREVIEW_CLASS,
  EDITOR_PREVIEW_HOST_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
  buildEditorShell,
  editorShellFor,
  renderPreview,
  teardownEditorShell,
} from './editorView';

const DOC = '# Outer\n\nBody.\n\n## Second\n\nMore.';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts.splice(0)) host.remove();
  vi.mocked(mount).mockClear();
});

/** The app-page shape: a plain <div>, mounted contained. */
function mountedHost(source = DOC): HTMLElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  mount(source, host, { contained: true });
  vi.mocked(mount).mockClear();
  return host;
}

const childrenOf = (host: HTMLElement): Element[] => [...host.shadowRoot!.children];

/** The OUTER reading column: a direct child of the host's shadow root, never the preview's. */
const outerColumnOf = (host: HTMLElement): Element =>
  childrenOf(host).find((el) => el.classList.contains('peekover-reader'))!;

describe('buildEditorShell', () => {
  it('adds one stylesheet and one shell beside the reading column, and touches nothing else', () => {
    const host = mountedHost();
    const before = childrenOf(host);

    const shell = buildEditorShell(host);

    const after = childrenOf(host);
    expect(after.slice(0, before.length)).toEqual(before); // same nodes, same order
    const added = after.slice(before.length);
    expect(added.map((el) => el.tagName)).toEqual(['STYLE', 'DIV']);
    expect(added[1].className).toBe(EDITOR_SHELL_CLASS);
    expect(added[1].previousElementSibling?.previousElementSibling?.className).toBe(
      'peekover-reader',
    );

    expect([...added[1].children]).toEqual([shell.source, shell.preview]);
    expect(shell.source.className).toBe(EDITOR_SOURCE_CLASS);
    expect(shell.preview.className).toBe(EDITOR_PREVIEW_CLASS);
    expect([...shell.preview.children]).toEqual([shell.previewHost]);
    expect(shell.previewHost.className).toBe(EDITOR_PREVIEW_HOST_CLASS);
    expect(shell.source.childElementCount).toBe(0); // a slot: the editor is a later task's
  });

  it('gives the preview its OWN shadow root, holding the document with no chrome', () => {
    const host = mountedHost();
    const { previewHost } = buildEditorShell(host);

    const nested = previewHost.shadowRoot!;
    expect(nested).not.toBe(host.shadowRoot);
    expect([...nested.children].map((el) => el.tagName)).toEqual(['STYLE', 'STYLE', 'DIV']);
    expect(nested.querySelector('.peekover-reader h1')?.textContent).toBe('Outer');
    expect(previewHost.getAttribute('data-theme')).toBe(host.getAttribute('data-theme'));
  });

  it('is idempotent: a second build returns the same shell and duplicates nothing', () => {
    const host = mountedHost();
    const first = buildEditorShell(host);
    const count = childrenOf(host).length;

    expect(buildEditorShell(host)).toBe(first);
    expect(editorShellFor(host)).toBe(first);
    expect(childrenOf(host).length).toBe(count);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
  });

  it('builds afresh when a re-mount of the outer host dropped the previous shell', () => {
    const host = mountedHost();
    const first = buildEditorShell(host);
    mount(DOC, host, { contained: true }); // replaceChildren: the shell is gone

    expect(editorShellFor(host)).toBeUndefined();
    const second = buildEditorShell(host);
    expect(second).not.toBe(first);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
  });

  it('throws on a host with no shadow root, having added nothing', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    expect(() => buildEditorShell(host)).toThrow(/shadow root/);
    expect(host.childNodes.length).toBe(0);
    expect(host.shadowRoot).toBeNull();
  });
});

describe('renderPreview', () => {
  it('★ always mounts on the nested host with { contained, preserveReading, chrome: false }', () => {
    const host = mountedHost();
    const shell = buildEditorShell(host);
    renderPreview(host, '# Draft one');
    renderPreview(host, '# Draft two\n\n## Sub');

    const calls = vi.mocked(mount).mock.calls;
    expect(calls.length).toBe(3); // build's initial render + the two above
    for (const [, target, options] of calls) {
      expect(target).toBe(shell.previewHost);
      expect(target).not.toBe(host);
      expect(options).toEqual({ contained: true, preserveReading: true, chrome: false });
    }
    expect(calls.map(([text]) => text)).toEqual([DOC, '# Draft one', '# Draft two\n\n## Sub']);
  });

  it('★ leaves the outer shadow root — and whatever sits in the source slot — untouched', () => {
    const host = mountedHost();
    const shell = buildEditorShell(host);
    const editor = document.createElement('textarea');
    shell.source.appendChild(editor);
    const before = childrenOf(host);
    const outerColumn = outerColumnOf(host);
    const outerHtml = outerColumn.outerHTML;

    for (let i = 0; i < 5; i += 1) renderPreview(host, `# Draft ${i}\n\n## Sub ${i}`);

    expect(childrenOf(host)).toEqual(before);
    expect(editor.isConnected).toBe(true);
    expect(editor.parentElement).toBe(shell.source);
    expect(outerColumnOf(host)).toBe(outerColumn);
    expect(outerColumn.outerHTML).toBe(outerHtml);
    expect(shell.previewHost.shadowRoot!.querySelector('h1')?.textContent).toBe('Draft 4');
  });

  it('does nothing on a host with no shell', () => {
    const host = mountedHost();
    renderPreview(host, '# Nowhere to go');
    expect(vi.mocked(mount)).not.toHaveBeenCalled();
  });
});

describe('teardownEditorShell', () => {
  it('removes exactly what build added', () => {
    const host = mountedHost();
    const before = childrenOf(host);
    const shell = buildEditorShell(host);

    teardownEditorShell(host);

    expect(childrenOf(host)).toEqual(before);
    expect(shell.previewHost.isConnected).toBe(false);
    expect(editorShellFor(host)).toBeUndefined();
    teardownEditorShell(host); // a second call, and a host that never had one, are no-ops
    expect(childrenOf(host)).toEqual(before);
  });
});

describe('as enterEditMode’s build step (2.1’s seam)', () => {
  const build = (_engine: unknown, host: HTMLElement): void => {
    buildEditorShell(host);
  };

  it('the shell exists before the mode flips, and re-entry does not duplicate it', async () => {
    const host = mountedHost();
    await enterEditMode(host, { loader: async () => null, build });
    expect(host.getAttribute('data-mode')).toBe('edit');
    const shell = editorShellFor(host);
    expect(shell).toBeDefined();

    exitEditMode(host);
    teardownEditorShell(host);
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`)).toBeNull();

    await enterEditMode(host, { loader: async () => null, build });
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
    expect(editorShellFor(host)).not.toBe(shell);
  });

  it('a build that cannot run rejects with the mode and the DOM as they were', async () => {
    const host = document.createElement('div'); // never mounted: no shadow root
    document.body.appendChild(host);
    hosts.push(host);
    await expect(enterEditMode(host, { loader: async () => null, build })).rejects.toThrow();
    expect(host.hasAttribute('data-mode')).toBe(false);
    expect(host.childNodes.length).toBe(0);
  });
});
