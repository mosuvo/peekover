// The edit view's nested preview host, in the real engine (012 task 2.2, D-4 as re-ruled) —
// Chromium AND Firefox.
//
// THE PROPERTY. `mount()` owns a host's whole shadow root, so a live preview rendered into the
// document's own host would destroy the editor on every keystroke. The preview is therefore
// `mount()` on a NESTED host with `chrome: false`. Four things are proven here that jsdom cannot:
//
//   (1) The outer host's chrome and reading column are the SAME nodes, serialising identically,
//       across enter/exit toggles and across preview re-renders — and the source pane survives.
//   (2) The three hazards `chrome: false` exists for are ABSENT with the registries LIVE: a watch
//       target and a diff context registered, an agent-file identity set, a preview of >= 2
//       headings — so every arm of the chrome WOULD compose. The outer host, mounted under the
//       same registry state without the option, is the positive control that it does.
//   (3) The preview's scroll box is resolvable by `resolveScrollContainer`, by IDENTITY.
//   (4) The split lays out side by side when wide and stacked when narrow — by HIT-TEST — and is
//       not on screen at all once edit is left by the mode pill, a path that runs no teardown.
//
// RED-FIRST, both by editing `editorView.ts`'s one `mount()` call (recorded in progress.md):
// pointing it at the OUTER host removes the source pane from the outer root; dropping
// `chrome: false` puts a watch control, a diff affordance and a rail in the preview and hands
// the backtick to it. In each test the assertion that shows the defect comes first.
//
// HARNESS-SHARED-STATE (AGENTS.md). Files run serially on one `document`, and earlier files may
// have left key listeners behind. Nothing here counts listeners or assumes a pristine registry:
// the backtick is measured as the `data-toc` writes it makes to THESE two hosts; "the outer
// host's entries are unchanged" is the attribute writes made to THAT host during a nested render,
// and its registered source matched by content.

import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { enterEditMode, exitEditMode, readerSourceFor } from '../../src/render/readerMode';
import {
  EDITOR_SHELL_CLASS,
  buildEditorShell,
  editorShellFor,
  renderPreview,
  teardownEditorShell,
  type EditorShell,
} from '../../src/render/editorView';
import { resolveScrollContainer, scrollsVertically } from '../../src/render/scrollContainer';
import { TOC_TOGGLE_KEY } from '../../src/render/tocView';
import {
  registerWatchTarget,
  resetWatchRegistryForTest,
  type WatchTarget,
} from '../../src/watch/watchRegistry';
import { WATCH_CONTROL_CLASS, resetWatchControlsForTest } from '../../src/watch/watchControl';
import {
  createDiffContext,
  registerDiffContext,
  resetDiffRegistryForTest,
} from '../../src/render/diffRegistry';
import { DIFF_AFFORDANCE_CLASS } from '../../src/render/diffChrome';
import { registerDocIdentity, resetDocIdentityForTest } from '../../src/render/docIdentity';
import { AGENT_BADGE_CLASS } from '../../src/render/agentBadge';
import { THEME_CONTROL_CLASS } from '../../src/theme/themeControl';
import { setThemeSetting } from '../../src/theme/reader';

const NARROW = { width: 414, height: 896 }; // the harness default, restored after each test
const WIDE = { width: 1400, height: 900 }; // `diffChrome.browser.test.ts`'s own WIDE

const OUTER_DOC = '# Outer document\n\nBody text.\n\n## Outer second\n\nMore body.';
const previewDoc = (n: number): string =>
  `# Preview ${n}\n\nDraft body ${n}.\n\n## Preview second ${n}\n\nMore draft.`;
const LONG_DOC = Array.from({ length: 60 }, (_, i) => `## Section ${i}\n\nParagraph ${i}.`).join(
  '\n\n',
);

/** Every piece of reader chrome `mount()` can compose beside a reading column — by class ALONE,
 *  so a selector can never encode the tag it is supposed to be checking for. */
const CHROME: ReadonlyArray<readonly [string, string]> = [
  ['mode pill', 'peekover-mode-toggle'],
  ['theme control', THEME_CONTROL_CLASS],
  ['watch control', WATCH_CONTROL_CLASS],
  ['diff affordance', DIFF_AFFORDANCE_CLASS],
  ['agent badge', AGENT_BADGE_CLASS],
  ['TOC rail', 'peekover-toc'],
];

const hosts: HTMLElement[] = [];
const extras: HTMLElement[] = [];

afterEach(async () => {
  for (const host of hosts.splice(0)) {
    teardownEditorShell(host);
    host.remove();
  }
  for (const el of extras.splice(0)) el.remove();
  resetWatchRegistryForTest();
  resetWatchControlsForTest(); // reset WITH the registry, always — see its doc comment
  resetDiffRegistryForTest();
  resetDocIdentityForTest();
  setThemeSetting('auto');
  await page.viewport(NARROW.width, NARROW.height);
});

/** Make every registry-gated arm of the chrome live, the way the app page does on a file open. */
function liveRegistries(): void {
  const state = { watching: false };
  const target: WatchTarget = {
    start: () => {
      state.watching = true;
    },
    stop: () => {
      state.watching = false;
    },
    isWatching: () => state.watching,
  };
  registerWatchTarget(target);
  registerDiffContext(
    createDiffContext({
      docId: 'editor-nested-host',
      getCurrentSource: () => OUTER_DOC,
      fetchMeta: async () => [],
      fetchText: async () => undefined,
      showDiff: () => ({ ok: true }),
      hideDiff: () => undefined,
    }),
  );
  registerDocIdentity('CLAUDE.md');
}

/** A plain <div>, mounted contained, WITH every pill — the hazard tests' shape: the outer host carries all of
 *  the chrome so the nested host's lack of it means something. `appPage: true` is `readerPane.ts`'s own call
 *  since 013 task 4.5 (`pills: false`), the shape whose GEOMETRY the split tests measure. */
function mountOuter(parent: HTMLElement = document.body, appPage = false): HTMLElement {
  const host = document.createElement('div');
  host.style.display = 'block';
  parent.prepend(host);
  hosts.push(host);
  mount(OUTER_DOC, host, appPage ? { contained: true, pills: false } : { contained: true });
  return host;
}

/** Enter edit through the real entry point, with the shell as its build step. Returns the shell
 *  the build step itself was handed back — not a later lookup, which would turn "the shell was
 *  destroyed" into a TypeError ahead of the assertion that is supposed to show it. */
async function enterEdit(host: HTMLElement): Promise<EditorShell> {
  let shell!: EditorShell;
  await enterEditMode(host, {
    loader: async () => null,
    build: (_engine, h) => {
      shell = buildEditorShell(h);
    },
  });
  return shell;
}

/** Leave edit the way a caller does: the exit, and the shell's teardown beside it. */
function exitEdit(host: HTMLElement): void {
  exitEditMode(host);
  teardownEditorShell(host);
}

const frames = async (n = 3): Promise<void> => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => requestAnimationFrame(() => r(null)));
};

/** What `mount()` committed to the outer root: its children, minus what the shell added and the
 *  lazily built raw view. */
function outerChrome(host: HTMLElement): Element[] {
  const shellNodes = new Set<Element>();
  const root = host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`);
  if (root) {
    shellNodes.add(root);
    shellNodes.add(root.previousElementSibling!); // the shell's own <style>
  }
  return [...host.shadowRoot!.children].filter(
    (el) => !shellNodes.has(el) && !el.classList.contains('peekover-raw'),
  );
}

const serialise = (nodes: Element[]): string => nodes.map((n) => n.outerHTML).join('\n');

const sameNodes = (a: Element[], b: Element[]): boolean =>
  a.length === b.length && a.every((n, i) => n === b[i]);

/** Record every attribute written to (or removed from) `el` while `fn` runs. */
async function attributeWrites(
  el: HTMLElement,
  fn: () => void | Promise<void>,
): Promise<string[]> {
  const writes: string[] = [];
  const set = el.setAttribute.bind(el);
  const remove = el.removeAttribute.bind(el);
  el.setAttribute = (name: string, value: string): void => {
    writes.push(`${name}=${value}`);
    set(name, value);
  };
  el.removeAttribute = (name: string): void => {
    if (el.hasAttribute(name)) writes.push(`-${name}`);
    remove(name);
  };
  try {
    await fn();
  } finally {
    delete (el as { setAttribute?: unknown }).setAttribute; // back to the prototype's
    delete (el as { removeAttribute?: unknown }).removeAttribute;
  }
  return writes;
}

/** The innermost element at a point, drilling through every open shadow root on the way. */
function deepElementAt(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

const centreOf = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
};

/** Is `el` inside `ancestor`, crossing shadow boundaries upward? */
function isWithin(el: Element | null, ancestor: Element): boolean {
  let node: Node | null = el;
  while (node) {
    if (node === ancestor) return true;
    node = node.parentNode ?? (node as ShadowRoot).host ?? null;
  }
  return false;
}

describe('012 task 2.2 — the source pane survives the preview (D-4’s core)', () => {
  it('★ after build and preview renders, the source pane is still in the OUTER shadow root', async () => {
    const host = mountOuter();
    const shell = await enterEdit(host);
    const editor = document.createElement('textarea');
    shell.source.appendChild(editor);

    for (let i = 0; i < 3; i += 1) renderPreview(host, previewDoc(i));

    // The defect's own units, first: routed at the outer host, `replaceChildren` takes the pane.
    expect(host.shadowRoot!.contains(shell.source), 'the source pane is gone').toBe(true);
    expect(editor.isConnected).toBe(true);
    expect(host.getAttribute('data-mode')).toBe('edit');
    expect(editorShellFor(host)).toBe(shell);
    expect(shell.previewHost.shadowRoot!.querySelector('h1')?.textContent).toBe('Preview 2');
  });
});

describe('012 task 2.2 — the three hazards, with the registries LIVE', () => {
  it('POSITIVE CONTROL: the outer host, mounted without the option, carries all of the chrome', () => {
    liveRegistries();
    const host = mountOuter();
    for (const [name, cls] of CHROME) {
      expect(host.shadowRoot!.querySelector(`.${cls}`), `outer ${name}`).not.toBeNull();
    }
  });

  it('★ the nested shadow root holds the reading column and none of the chrome', async () => {
    liveRegistries();
    const host = mountOuter();
    const shell = await enterEdit(host);
    renderPreview(host, previewDoc(1)); // two headings: a rail WOULD compose
    const nested = shell.previewHost.shadowRoot!;

    // The hazards first — watch, diff, rail — as ONE assertion over what is present, so a red
    // names every hazard that composed rather than stopping at the first.
    const present = (classes: string[]): string[] =>
      classes.filter((cls) => nested.querySelector(`.${cls}`) !== null);
    expect(present([WATCH_CONTROL_CLASS, DIFF_AFFORDANCE_CLASS, 'peekover-toc'])).toEqual([]);
    expect(present(CHROME.map(([, cls]) => cls))).toEqual([]);
    expect([...nested.children].map((el) => el.tagName)).toEqual(['STYLE', 'STYLE', 'DIV']);

    // "No chrome" is not "nothing rendered".
    const column = nested.querySelector('.peekover-reader')!;
    expect(column.querySelectorAll('h1,h2').length).toBe(2);
    expect(column.textContent).toContain('Draft body 1.');

    // And the same registry state really does compose it on the outer host, in this same test.
    for (const [name, cls] of CHROME) {
      expect(host.shadowRoot!.querySelector(`.${cls}`), `outer ${name}`).not.toBeNull();
    }
  });

  it('★ a backtick toggles the OUTER document’s rail, never the preview', async () => {
    liveRegistries();
    const host = mountOuter();
    const shell = await enterEdit(host);
    renderPreview(host, previewDoc(1));
    await frames(); // the rail's initial open/collapsed state lands a frame after mount
    (document.activeElement as HTMLElement | null)?.blur();

    const nestedWrites: string[] = [];
    const outerWrites = await attributeWrites(host, async () => {
      nestedWrites.push(
        ...(await attributeWrites(shell.previewHost, async () => {
          await userEvent.keyboard(TOC_TOGGLE_KEY);
        })),
      );
    });

    // The hazard first: a preview that is a registered TOC host is the one the key resolves.
    expect(nestedWrites.filter((w) => w.startsWith('data-toc'))).toEqual([]);
    expect(shell.previewHost.hasAttribute('data-toc')).toBe(false);
    expect(outerWrites.filter((w) => w.startsWith('data-toc')).length).toBeGreaterThan(0);
  });

  it('a nested render writes nothing to the outer host and leaves its registered source alone', async () => {
    liveRegistries();
    const host = mountOuter();
    const shell = await enterEdit(host);
    await frames();

    const writes = await attributeWrites(host, () => {
      for (let i = 0; i < 5; i += 1) renderPreview(host, previewDoc(i));
    });

    expect(writes).toEqual([]);
    expect(readerSourceFor(host)).toBe(OUTER_DOC);
    expect(readerSourceFor(shell.previewHost)).toBe(previewDoc(4));
  });

  it('the preview is a themed host: a theme change reaches it with the outer host', async () => {
    const host = mountOuter();
    const shell = await enterEdit(host);

    setThemeSetting('dark');
    expect(host.getAttribute('data-theme')).toBe('dark');
    expect(shell.previewHost.getAttribute('data-theme')).toBe('dark');
    setThemeSetting('light');
    expect(shell.previewHost.getAttribute('data-theme')).toBe('light');
  });
});

describe('012 task 2.2 — the outer chrome is the same node set, serialising identically', () => {
  it('across ten enter/exit toggles', async () => {
    liveRegistries();
    const host = mountOuter();
    await frames();
    const before = outerChrome(host);
    const beforeHtml = serialise(before);
    const column = host.shadowRoot!.querySelector('.peekover-reader');
    expect(before.length, 'firing control: there is chrome to compare').toBeGreaterThan(6);

    for (let i = 0; i < 10; i += 1) {
      const shell = await enterEdit(host);
      expect(host.shadowRoot!.contains(shell.source)).toBe(true);
      exitEdit(host);
      expect(host.getAttribute('data-mode')).toBe('reading');
    }
    await frames();

    const after = outerChrome(host);
    expect(sameNodes(after, before), 'the outer chrome is not the same node set').toBe(true);
    expect(serialise(after)).toBe(beforeHtml);
    expect(host.shadowRoot!.querySelector('.peekover-reader')).toBe(column);
    expect(host.shadowRoot!.querySelector(`.${EDITOR_SHELL_CLASS}`)).toBeNull();
  });

  it('across twenty nested preview re-renders', async () => {
    liveRegistries();
    const host = mountOuter();
    const shell = await enterEdit(host);
    await frames();
    const before = outerChrome(host);
    const beforeHtml = serialise(before);
    const column = host.shadowRoot!.querySelector('.peekover-reader');

    for (let i = 0; i < 20; i += 1) renderPreview(host, previewDoc(i));
    await frames();

    const after = outerChrome(host);
    expect(sameNodes(after, before), 'the outer chrome is not the same node set').toBe(true);
    expect(serialise(after)).toBe(beforeHtml);
    expect(host.shadowRoot!.querySelector('.peekover-reader')).toBe(column);
    expect(shell.previewHost.shadowRoot!.querySelector('h1')?.textContent).toBe('Preview 19');
  });
});

describe('012 task 2.2 — the preview’s scroll box', () => {
  it('★ resolveScrollContainer returns the preview pane itself, by identity', async () => {
    await page.viewport(WIDE.width, WIDE.height);
    // The app-page shape in full: the host inside a scrolling pane, so "the outer pane" is a real
    // candidate the walk could wrongly reach.
    const pane = document.createElement('main');
    pane.style.cssText = 'display:block;overflow:auto;height:100vh;width:100%';
    document.body.prepend(pane);
    extras.push(pane);
    const host = mountOuter(pane);
    expect(resolveScrollContainer(host, true), 'firing control: the outer host resolves the pane').toBe(
      pane,
    );

    const shell = await enterEdit(host);
    renderPreview(host, LONG_DOC);

    const resolved = resolveScrollContainer(shell.previewHost, true);
    expect(resolved).toBe(shell.preview);
    expect(resolved).not.toBe(shell.previewHost); // not the host by fallback
    expect(resolved).not.toBe(pane); // not the outer pane

    // And it is a REAL scroll box: it scrolls, and the nested host does not.
    expect(scrollsVertically(shell.preview)).toBe(true);
    expect(shell.preview.scrollHeight).toBeGreaterThan(shell.preview.clientHeight);
    shell.preview.scrollTop = 240;
    expect(shell.preview.scrollTop).toBe(240);
    expect(shell.previewHost.scrollHeight).toBe(shell.previewHost.clientHeight);
  });
});

describe('012 task 2.2 — the split, by hit-test', () => {
  // KEEPS: the split's geometry on the app page (C168, DISCOVERED broken at 013 task 4.5 — the census had the file
  // unchanged). RE-SPELLED: the outer host is mounted the way the app page mounts it now, `pills: false`. A contained
  // mount WITH pills is a shape the app page no longer produces, and since 4.5 `CONTAINED_CSS` no longer seats its
  // pills — at 414 px they and the shadow disclosure covered the preview pane's centre.
  // R29(c): the rail is hidden while editing at <= 1400px, so the "clear of the open rail" arm lives
  // at a viewport where the rail is shown in edit; the 1400px arm below pins the hidden rail instead.
  const WIDE_RAIL = { width: 1500, height: 900 };

  it(`WIDE ${WIDE_RAIL.width}x${WIDE_RAIL.height}: source and preview sit side by side, rail open`, async () => {
    await page.viewport(WIDE_RAIL.width, WIDE_RAIL.height);
    liveRegistries();
    const host = mountOuter(document.body, true);
    const shell = await enterEdit(host);
    await frames();
    expect(host.getAttribute('data-toc'), 'firing control: the rail is open at this width').toBe(
      'open',
    );

    const s = centreOf(shell.source);
    const p = centreOf(shell.preview);
    expect(isWithin(deepElementAt(s.x, s.y), shell.source), 'source pane centre').toBe(true);
    expect(isWithin(deepElementAt(p.x, p.y), shell.preview), 'preview pane centre').toBe(true);
    // The preview's centre is content rendered INSIDE the nested shadow root, not a cover over it.
    expect(isWithin(deepElementAt(p.x, p.y), shell.previewHost)).toBe(true);

    const sr = shell.source.getBoundingClientRect();
    const pr = shell.preview.getBoundingClientRect();
    expect(sr.right).toBeLessThanOrEqual(pr.left + 1);
    expect(Math.abs(sr.top - pr.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(sr.width - pr.width)).toBeLessThanOrEqual(2);
    // Clear of the open rail: the preview's right edge stops at the rail's left edge.
    const rail = host.shadowRoot!.querySelector('.peekover-toc')!.getBoundingClientRect();
    expect(rail.width, 'firing control: the rail is laid out at this width').toBeGreaterThan(0);
    expect(pr.right).toBeLessThanOrEqual(rail.left);
  });

  it(`WIDE ${WIDE.width}x${WIDE.height}: the rail is hidden in edit and both panes are at least 360px`, async () => {
    await page.viewport(WIDE.width, WIDE.height);
    liveRegistries();
    const host = mountOuter(document.body, true);
    const shell = await enterEdit(host);
    await frames();

    const rail = host.shadowRoot!.querySelector('.peekover-toc')!.getBoundingClientRect();
    expect(rail.width, 'the rail is not laid out in edit at 1400px').toBe(0);
    expect(shell.source.getBoundingClientRect().width).toBeGreaterThanOrEqual(360);
    expect(shell.preview.getBoundingClientRect().width).toBeGreaterThanOrEqual(360);
  });

  it(`NARROW ${NARROW.width}x${NARROW.height}: the panes stack, source above preview`, async () => {
    await page.viewport(NARROW.width, NARROW.height);
    liveRegistries();
    const host = mountOuter(document.body, true);
    const shell = await enterEdit(host);
    await frames();

    const s = centreOf(shell.source);
    const p = centreOf(shell.preview);
    expect(isWithin(deepElementAt(s.x, s.y), shell.source), 'source pane centre').toBe(true);
    expect(isWithin(deepElementAt(p.x, p.y), shell.preview), 'preview pane centre').toBe(true);

    const sr = shell.source.getBoundingClientRect();
    const pr = shell.preview.getBoundingClientRect();
    expect(sr.bottom).toBeLessThanOrEqual(pr.top + 1);
    expect(Math.abs(sr.left - pr.left)).toBeLessThanOrEqual(1);
    expect(sr.height).toBeGreaterThan(100);
    expect(pr.height).toBeGreaterThan(100);
  });
});

describe('012 task 2.2 — bypass safety: edit left by the mode pill, which runs no teardown', () => {
  it('no shell element is on screen in raw or reading; the shell is still in the DOM, and is reused', async () => {
    const host = mountOuter();
    const shell = await enterEdit(host);
    const root = host.shadowRoot!.querySelector<HTMLElement>(`.${EDITOR_SHELL_CLASS}`)!;
    const pill = host.shadowRoot!.querySelector<HTMLElement>('.peekover-mode-toggle')!;
    const onScreen = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    // Positive control: in edit the instrument reads all three as on screen.
    expect(getComputedStyle(root).display).toBe('grid');
    expect([root, shell.source, shell.preview].map(onScreen)).toEqual([true, true, true]);

    pill.click(); // the bypass: toggleReaderMode, not exitEditMode
    expect(host.getAttribute('data-mode')).toBe('raw');
    expect(getComputedStyle(root).display).toBe('none');
    expect([root, shell.source, shell.preview, shell.previewHost].map(onScreen)).toEqual([
      false,
      false,
      false,
      false,
    ]);

    pill.click();
    expect(host.getAttribute('data-mode')).toBe('reading');
    expect(getComputedStyle(root).display).toBe('none');
    expect(onScreen(host.shadowRoot!.querySelector('.peekover-reader')!)).toBe(true);

    // The residue, stated: the shell is still attached, and a re-entry reuses it.
    expect(root.isConnected).toBe(true);
    expect(await enterEdit(host)).toBe(shell);
    expect(host.shadowRoot!.querySelectorAll(`.${EDITOR_SHELL_CLASS}`).length).toBe(1);
    expect(getComputedStyle(root).display).toBe('grid');
  });
});
