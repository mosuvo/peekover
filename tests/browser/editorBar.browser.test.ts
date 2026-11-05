// THE EDITOR'S SAVE BAR (013 task 5.7; plan §3; R11) — Chromium and Firefox.
//
// Save is the ink primary — 5.4's look, the one the unsaved-changes dialog's Keep editing and the panels' confirms
// already draw (`--ink` fill and border, `--paper` text, 600 11.5px `--sans`, radius 7, 5 / 11 px). It lives in the
// reader's shadow root, which APP_CSS cannot reach, so EDITOR_CSS carries the same declarations; the test holds the
// two to ONE computed box by reading both in the same page.
//
// The bar takes `.edbar`'s SHAPE only (`toolbar-mock.html:141`, `mockup.html:309–313`): a flex row, centred, 10 px
// apart, wrapping, in `--sans`, the status in `--muted`. None of the mock's unshipped tools (spec §6: "the editor's
// formatting/lint/table/snapshot bar") — the bar holds exactly Save and the status line (pinned below).
//
// THE SPLIT IS UNCHANGED: the bar keeps its 40.5 px height (it was 6 + 27.5 + 6 + 1 before 5.7), so the source and
// preview panes start, and measure, where they did (`decisions.md` 5.7 has the boxes at 1440 / 1600).
//
// Faces via D-3: the bar, Save and the status in `--sans`, the source in `--mono`, the preview's text in `--serif`.
//
// States, each read live (the download route — a file with no handle — on both engines; no download leaves the
// page, the anchor's click is swallowed): at rest; SAVING (read synchronously after the click: the control's text
// and `aria-busy` are set before the save's first await); a save's outcome said in the status line; a FAILED save.
// Text in every state ≥ 4.5:1 as painted. Behaviour, names and the focus order are unchanged (pinned).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { UNSAVED_KEEP_CLASS } from '../../src/app/unsavedGuard';
import { DEFAULT_SETTINGS } from '../../src/settings/settings';
import {
  EDITOR_BAR_CLASS,
  EDITOR_SAVE_CLASS,
  EDITOR_STATUS_CLASS,
  editorSessionFor,
  teardownEditorShell,
} from '../../src/render/editorView';
import { resetThemeWatchForTest, setThemeSetting } from '../../src/theme/reader';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { backdropOf, hex, inkOf, ratioOver, TEXT_BAR } from './helpers/contrast';

const ENGINE = navigator.userAgent.includes('Firefox') ? 'firefox' : 'chromium';
type Theme = 'light' | 'dark';
const THEMES: readonly Theme[] = ['light', 'dark'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, what: string, tries = 200): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error(`timed out waiting for ${what}`);
}

const DOC = '# Bar doc\n\nA paragraph to edit.\n\n## Section\n\n- one\n- two\n';
const mem = (name: string, text: string): MarkdownFile => ({ path: name, name, read: async () => text });
let theme: Theme = 'light';
/** The test's own settings: the shell applies the loaded theme as it mounts, so the load answers this test's. */
const store = (): AppStore => ({
  putFolder: async () => undefined,
  deleteFolder: async () => undefined,
  putRecent: async () => undefined,
  getSettings: async () => ({ ...DEFAULT_SETTINGS, theme }),
  putSettings: async () => undefined,
});

const made: HTMLElement[] = [];
beforeEach(async () => {
  await page.viewport(1440, 900);
});
afterEach(async () => {
  for (const c of made.splice(0)) {
    const h = c.querySelector<HTMLElement>('.peekover-app__reader__host');
    if (h) teardownEditorShell(h);
    c.remove();
  }
  vi.restoreAllMocks();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetThemeWatchForTest();
  await page.viewport(414, 896);
});

interface Editing {
  container: HTMLElement;
  host: HTMLElement;
  root: ShadowRoot;
  bar: HTMLElement;
  save: HTMLButtonElement;
  status: HTMLElement;
}

/** The app page with one in-memory file (no handle: Save is the download route on both engines), in edit, dirty. */
async function editing(t: Theme): Promise<Editing> {
  theme = t;
  setThemeSetting(t);
  const container = document.createElement('div');
  document.body.appendChild(container);
  made.push(container);
  const source: FolderSource = { name: 'docs', truncated: false, persistable: false, files: [mem('bar-5-7.md', DOC)] };
  const app = mountAppShell(container, { openFolder: async () => ({ ok: true, source }), store: store() });
  await app.openFolder();
  (await waitFor(() => container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'), 'the tree item')).click();
  const host = await waitFor(() => container.querySelector<HTMLElement>('.peekover-app__reader__host'), 'the reader pane');
  await waitFor(() => host.getAttribute('data-theme') === t, `data-theme=${t}`);
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'), 'the rendered document');
  container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="edit"]')!.click();
  const session = await waitFor(() => editorSessionFor(host), 'the edit session');
  session.view.dispatch({ changes: { from: session.view.state.doc.length, insert: '\nAn unsaved line.\n' } });
  await waitFor(() => host.hasAttribute('data-edit-dirty'), 'the dirty attribute');
  await sleep(150);
  const root = host.shadowRoot!;
  return {
    container,
    host,
    root,
    bar: root.querySelector<HTMLElement>(`.${EDITOR_BAR_CLASS}`)!,
    save: root.querySelector<HTMLButtonElement>(`.${EDITOR_SAVE_CLASS}`)!,
    status: root.querySelector<HTMLElement>(`.${EDITOR_STATUS_CLASS}`)!,
  };
}

const LOOK = [
  'font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color',
  'border-top-color', 'border-top-style', 'border-top-width', 'border-top-left-radius', 'padding-top', 'padding-left',
] as const;
const look = (el: Element): Record<string, string> => {
  const cs = getComputedStyle(el);
  return Object.fromEntries(LOOK.map((p) => [p, cs.getPropertyValue(p)]));
};
/** A token as the host resolves it, painted as a colour (so it compares with computed colours). */
const token = (host: HTMLElement, name: string): string => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  host.shadowRoot!.appendChild(probe);
  const v = getComputedStyle(probe).color;
  probe.remove();
  return v;
};
const fontToken = (host: HTMLElement, name: string): string => {
  const probe = document.createElement('span');
  probe.style.fontFamily = `var(${name})`;
  host.shadowRoot!.appendChild(probe);
  const v = getComputedStyle(probe).fontFamily;
  probe.remove();
  return v;
};
function contrast(el: HTMLElement, what: string): number {
  const { ratio, drawn, bg } = ratioOver(inkOf(el), backdropOf(el));
  console.log(`[5.7][${ENGINE}] ${what}: "${el.textContent!.slice(0, 48)}" ${hex(drawn)} on ${hex(bg)} — ${ratio.toFixed(2)}:1`);
  return ratio;
}
/** The download route's anchor click is swallowed: nothing leaves the page. */
const noDownload = (): void => void vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

describe('the editor save bar (013 task 5.7)', () => {
  for (const t of THEMES) {
    // A1's instrument: Save back to the old pill look (or 5.3's plain button) names Save here.
    it(`Save is the ink primary — one computed box with the dialog's Keep editing (5.4) — ${t}`, async () => {
      const e = await editing(t);
      e.save.blur();
      const save = look(e.save);
      // The reference: 5.4's ink primary as the unsaved-changes dialog draws it (a dirty Read asks first).
      e.container.querySelector<HTMLButtonElement>('.peekover-toolbar__seg [data-mode="reading"]')!.click();
      const keep = await waitFor(() => e.container.querySelector<HTMLButtonElement>(`.${UNSAVED_KEEP_CLASS}`), 'Keep editing');
      keep.blur();
      expect(save, 'Save').toEqual(look(keep));
      expect(save['background-color'], 'Save fill is --ink').toBe(token(e.host, '--ink'));
      expect(save['color'], 'Save text is --paper').toBe(token(e.host, '--paper'));
      keep.click();
      expect(e.host.getAttribute('data-mode'), 'Keep editing stays in edit').toBe('edit');
      expect(contrast(e.save, `${t} Save at rest`)).toBeGreaterThanOrEqual(TEXT_BAR);
    });

    it(`every save state is styled and readable: saving, an outcome, a failure — ${t}`, async () => {
      const e = await editing(t);
      const rest = look(e.save);
      noDownload();
      // SAVING: run() sets the control's text and aria-busy before its first await — read in the same task.
      e.save.click();
      expect(e.save.textContent, 'saving: the control says so').toBe('Saving…');
      expect(e.save.getAttribute('aria-busy')).toBe('true');
      expect(look(e.save), 'saving keeps the ink primary').toEqual(rest);
      expect(getComputedStyle(e.save).cursor, 'saving: the pointer says busy').toBe('progress');
      expect(contrast(e.save, `${t} Save saving`)).toBeGreaterThanOrEqual(TEXT_BAR);
      // AN OUTCOME (the download route's "Saved as a download …"): the status line, --muted on the bar.
      await waitFor(() => !e.status.hidden, 'the status line');
      expect(e.save.textContent).toBe('Save');
      expect(e.save.hasAttribute('aria-busy')).toBe(false);
      expect(e.status.textContent).toMatch(/^Saved as a download: bar-5-7\.md\./);
      expect(getComputedStyle(e.status).color, 'the status is --muted').toBe(token(e.host, '--muted'));
      expect(contrast(e.status, `${t} status after a save`)).toBeGreaterThanOrEqual(TEXT_BAR);
      // A FAILURE: the save rejects (the blob URL cannot be made).
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        throw new Error('forced failure (5.7 test)');
      });
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      e.save.click();
      await waitFor(() => e.status.textContent === 'The save failed. Your edit is still here.', 'the failed status');
      expect(warn).toHaveBeenCalled();
      expect(look(e.save), 'after a failure Save is the ink primary again').toEqual(rest);
      expect(contrast(e.status, `${t} status after a failure`)).toBeGreaterThanOrEqual(TEXT_BAR);
    });

    it(`the bar is .edbar's shape, its faces via D-3, and the split is where it was — ${t}`, async () => {
      const e = await editing(t);
      const bar = getComputedStyle(e.bar);
      // A3's instrument runs first: the split's panes start where they did — the bar keeps its 40.5 px.
      const barBox = e.bar.getBoundingClientRect();
      const source = e.root.querySelector<HTMLElement>('.peekover-editor__source')!.getBoundingClientRect();
      const preview = e.root.querySelector<HTMLElement>('.peekover-editor__preview')!.getBoundingClientRect();
      expect(barBox.height, 'the bar height (the panes start 40.5 px into the split, as before 5.7)').toBe(40.5);
      expect([source.top, preview.top], 'both panes start at the bar’s foot').toEqual([barBox.bottom, barBox.bottom]);
      expect(
        { display: bar.display, wrap: bar.flexWrap, align: bar.alignItems, gap: bar.columnGap },
        'the .edbar shape',
      ).toEqual({ display: 'flex', wrap: 'wrap', align: 'center', gap: '10px' });
      expect(bar.backgroundColor, 'the bar sits on --paper, as the mock’s does').toBe(token(e.host, '--paper'));
      const sans = fontToken(e.host, '--sans');
      expect([bar.fontFamily, getComputedStyle(e.save).fontFamily, getComputedStyle(e.status).fontFamily], 'bar faces: --sans').toEqual([sans, sans, sans]);
      expect(getComputedStyle(e.root.querySelector('.peekover-editor__source')!).fontFamily, 'source: --mono').toBe(fontToken(e.host, '--mono'));
      // The preview renders into its own nested host (R7): its paragraph is inside that host's shadow root.
      const nested = await waitFor(
        () => [...e.root.querySelectorAll<HTMLElement>('.peekover-editor__preview *')].find((el) => el.shadowRoot?.querySelector('p')),
        'the preview’s nested host',
      );
      const para = nested.shadowRoot!.querySelector<HTMLElement>('p')!;
      expect(getComputedStyle(para).fontFamily, 'preview text: --serif').toBe(fontToken(e.host, '--serif'));
    });

    // A2's instrument: any of the mock's unshipped tools (B, I, code, task, table, replace, snapshots, lint) added.
    it(`the bar holds only the shipped controls — Save and the status line; names and order unchanged — ${t}`, async () => {
      const e = await editing(t);
      expect([...e.bar.children].map((c) => `${c.tagName.toLowerCase()}.${c.className}`), 'the bar’s children').toEqual([
        `button.${EDITOR_SAVE_CLASS}`,
        `p.${EDITOR_STATUS_CLASS}`,
      ]);
      const controls = [...e.bar.querySelectorAll('button, input, select, textarea, a, [role="button"], [role="menu"], [role="toolbar"], [tabindex]')];
      expect(controls.map((c) => c.textContent), 'the bar’s controls').toEqual(['Save']);
      expect(e.save.type).toBe('button');
      expect(e.status.getAttribute('role')).toBe('status');
      // Focus order: Save, then the source.
      const content = e.root.querySelector<HTMLElement>('.cm-content')!;
      expect(e.save.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING, 'Save before the source').toBeTruthy();
      expect(e.save.tabIndex).toBe(0);
    });
  }
});
