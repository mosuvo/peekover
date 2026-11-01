// Copy-as-HTML (task 3.3, D-3/D-4) in a REAL ENGINE, Chromium AND Firefox — clipboard is jsdom-blind
// (`src/export/htmlExport.test.ts` has no browser half for this reason, matching `htmlExport
// .browser.test.ts`'s own split at task 3.1).
//
// ══ ★ WHY THE SAME-ARTIFACT ASSERTION USES A CAPTURED WRITE, NOT A REAL CLIPBOARD ROUND TRIP ═════
//
// MEASURED, not assumed (a throwaway probe ran against this harness before this file was written):
// the REAL OS clipboard's `text/html` format does NOT preserve bytes on EITHER engine. Chromium
// discards the document entirely and re-serializes the SELECTION as a fragment with every rule
// turned into a per-element inline `style` attribute (`getComputedStyle`, not the authored CSS) —
// `<style>`, `<head>`, and the doctype are gone. Firefox keeps more structure but still reformats
// whitespace and drops the `<meta charset>` tag. Neither loss is a Peekover bug — it is the
// browser's native "HTML clipboard format" doing what it always does for rich-paste consumers
// (this IS the mechanism task 4.1's Copy-as-rich-text will want) — but it means a REAL round trip
// answers a different, irrelevant question ("did the OS's rich-paste transform survive," which it
// provably does not, byte-for-byte, on either engine) instead of this task's own question ("did
// `copyAsHtml` hand the clipboard API the SAME bytes `exportHtml` downloaded").
//
// So the same-artifact comparison below CAPTURES the `ClipboardItem` `copyAsHtml` constructs,
// reading its `Blob` directly via `getType()` — `diagramActions.browser.test.ts`'s own
// `stubClipboard` shape (the codepath under test, `navigator.clipboard.write`, is the ONLY thing
// replaced; `copyAsHtml` itself, `serializeReaderDocument`, and `wrapInStandaloneDocument` all run
// for real). This is the SECOND call site for that stub shape (`diagramActions.browser.test.ts` is
// the first) — still under the rule-of-three, so it is reproduced inline here rather than
// extracted, matching `exportControls.ts`'s own stated policy for its focus trap.
//
// The PERMISSION-FREE / real-write claim is proven separately, through the REAL clipboard, because
// `text/plain` (unlike `text/html`) round-trips unmangled on both engines (measured in the same
// probe) — `tableCopy.browser.test.ts`'s own consent-and-gesture shape (CDP `clipboardReadWrite`
// grant for Chromium, gesture alone for Firefox, `readText()` in-page) is reused verbatim for that
// half, driven through the REAL panel row so it also proves the row is live.

import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent, commands, cdp } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { exportHtml, copyAsHtml } from '../../src/export/htmlExport';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';

interface ExportDownloadProbe {
  suggestedFilename: string;
  html: string;
  bodyPosition: string;
  bodyBackgroundColor: string;
  hostSelectorLiteralPresent: boolean;
  h1Text: string | null;
  consoleErrors: string[];
}

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    armExportDownload(): Promise<true>;
    collectExportDownload(): Promise<ExportDownloadProbe>;
  }
}

const HOST_TAG = 'peekover-root';
const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
afterEach(async () => {
  for (const host of hosts.splice(0)) host.remove();
  for (const c of containers.splice(0)) c.remove();
  await page.viewport(414, 896); // the harness default, restored after each test
});

function mountedHost(markdown: string, theme: 'light' | 'dark' | 'sepia' = 'light'): HTMLElement {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
  host.setAttribute('data-theme', theme);
  return host;
}

async function until<T>(
  fn: () => T | null | undefined | false | Promise<T | null | undefined | false>,
  tries = 400,
): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = await fn();
    if (v) return v;
    await new Promise<void>((r) => setTimeout(r, 20));
  }
  throw new Error('until() timed out');
}

/** `navigator.clipboard.readText()`, bounded — a single call must never be allowed to hang a
 *  retry loop indefinitely if an engine's read stalls rather than rejects. */
function readTextBounded(ms = 300): Promise<string> {
  return Promise.race([
    navigator.clipboard.readText(),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error('readText timeout')), ms)),
  ]);
}

// ── The capturing stub — `diagramActions.browser.test.ts`'s own shape, reused for a second call
// site (rule-of-three: still two, not three — reproduced inline, not extracted). `write` is the
// ONLY thing replaced; `copyAsHtml` itself runs unmodified. ────────────────────────────────────
function stubClipboard() {
  const written: ClipboardItem[][] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      write: async (items: ClipboardItem[]): Promise<void> => {
        written.push(items);
      },
    },
  });
  return {
    written,
    restore(): void {
      Reflect.deleteProperty(navigator, 'clipboard');
    },
  };
}

async function blobText(item: ClipboardItem, mime: string): Promise<string> {
  return (await item.getType(mime)).text();
}

// ── §3.3 — copyAsHtml() driven directly, mirroring 3.1's own `driveExportHtml` shape ───────────

describe('copyAsHtml — SAME artifact as exportHtml, a captured clipboard sink', () => {
  it('★ SAME-ARTIFACT, CROSS-SINK: the captured text/html Blob is byte-identical to the REAL downloaded file', async () => {
    const host = mountedHost('# Exported Title\n\nHello *world*.\n', 'light');

    await commands.armExportDownload();
    exportHtml(host, 'exported-title');
    const downloaded = await commands.collectExportDownload();
    expect(downloaded.consoleErrors).toEqual([]);

    const clipboard = stubClipboard();
    try {
      await copyAsHtml(host);
      expect(clipboard.written).toHaveLength(1);
      const items = clipboard.written[0];
      expect(items).toHaveLength(1);
      expect([...items[0].types].sort()).toEqual(['text/html', 'text/plain']);

      const copiedHtml = await blobText(items[0], 'text/html');
      expect(copiedHtml).toBe(downloaded.html);
    } finally {
      clipboard.restore();
    }
  });

  it('★ FIRING CONTROL: the same comparison DOES distinguish two genuinely different artifacts', async () => {
    // Proves the byte-identity check above is not vacuously true — it is exercised here against
    // two REAL documents (different content AND a different theme) built through the SAME pair of
    // sinks, and the two payloads must NOT match.
    const hostA = mountedHost('# Doc A\n', 'light');
    const hostB = mountedHost('# Doc B\n\nSomething else entirely.\n', 'dark');

    await commands.armExportDownload();
    exportHtml(hostA, 'doc-a');
    const downloadedA = await commands.collectExportDownload();

    const clipboard = stubClipboard();
    try {
      await copyAsHtml(hostB);
      const copiedB = await blobText(clipboard.written[0][0], 'text/html');
      expect(copiedB).not.toBe(downloadedA.html);
      expect(copiedB).toContain('Doc B');
      expect(downloadedA.html).toContain('Doc A');
    } finally {
      clipboard.restore();
    }
  });

  it('the text/plain fallback is the RENDERED text, not the raw markdown source (Q2 — distinct from 3.4)', async () => {
    // `**bold**` renders as "bold" — if the fallback carried the raw source instead, this would
    // read "**bold**" and be byte-identical to task 3.4's own whole payload, the exact
    // two-paths-same-bytes redundancy the §3.1(cont.) ZIP ruling removed.
    const source = '# Title\n\nSome **bold** text.\n';
    const host = mountedHost(source, 'light');
    const clone = host.shadowRoot!.querySelector('.peekover-reader')!;

    const clipboard = stubClipboard();
    try {
      await copyAsHtml(host);
      const plain = await blobText(clipboard.written[0][0], 'text/plain');

      expect(plain).toBe(clone.textContent);
      expect(plain).toContain('bold');
      expect(plain).not.toContain('**bold**');
      expect(plain).not.toBe(source);
    } finally {
      clipboard.restore();
    }
  });

  it('a rejected clipboard write is rethrown, never swallowed into a false success (AGENTS.md #5)', async () => {
    const host = mountedHost('# Doc\n', 'light');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: async (): Promise<void> => {
          throw new DOMException('denied', 'NotAllowedError');
        },
      },
    });
    try {
      await expect(copyAsHtml(host)).rejects.toThrow();
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});

// ── The export panel's own copy-html row (task 3.3's `exportControls.ts`/`appShell.ts` half) ──

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function mdFile(path: string, text = `# ${path}\n\nBody of ${path}.`): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile('alpha.md')] };
}

/** Mount the shell with a file already selected — `activeFile` set, the reader host really
 *  mounted, mirroring `exportPanel.browser.test.ts`'s own `mountWithFile`. */
async function mountWithFile(): Promise<{ container: HTMLElement; toggle: HTMLButtonElement }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({ ok: true, source: memorySource() }),
    store: fakeStore(),
  });
  await app.openFolder();
  const fileBtn = await until(() =>
    container.querySelector<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  );
  fileBtn.click();
  await until(() => container.querySelector('.peekover-app__reader__host'));
  const toggle = container.querySelector<HTMLButtonElement>(
    '.peekover-app__export-toggle',
  )!;
  return { container, toggle };
}

async function openPanel(container: HTMLElement, toggle: HTMLButtonElement): Promise<HTMLElement> {
  toggle.click();
  return until(() => container.querySelector<HTMLElement>('.peekover-export'));
}

async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

let grantedContextId: string | undefined;
let consentGranted = false;

/** Chromium-only real browser CONSENT (never a manifest permission) — `tableCopy.browser.test.ts`'s
 *  own `grantClipboardConsent` shape, reused verbatim. */
async function grantClipboardConsent(): Promise<void> {
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  grantedContextId = info?.targetInfo?.browserContextId;
  consentGranted = true;
  await cdp().send('Browser.grantPermissions', {
    origin: location.origin,
    browserContextId: grantedContextId,
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
  } as never);
}

afterEach(async () => {
  if (!consentGranted) return;
  consentGranted = false;
  await cdp().send('Browser.resetPermissions', { browserContextId: grantedContextId } as never);
});

describe('the export panel — Copy as HTML row goes live at this task, the other 3 stay disabled', () => {
  it('★ clicking "Copy as HTML" writes to the REAL clipboard, permission-free (D-4, re-confirmed)', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const copyHtmlRow = panel.querySelector<HTMLButtonElement>('[data-export="copy-html"]')!;
    expect(copyHtmlRow.disabled, 'the copy-html row must be LIVE at task 3.3').toBe(false);

    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

    await userEvent.click(copyHtmlRow);
    // The REAL clipboard acquiring THIS test's own rendered text IS the observable that the
    // click's write actually ran and resolved. Matched on the fixture's own content, not merely
    // "non-empty": the real OS clipboard is a resource shared across every serially-run file in
    // this suite, and a bare non-empty check raced stale leftover content from an earlier file's
    // own clipboard write (measured — this exact assertion flaked intermittently under the full
    // suite until fixed).
    // ★ M13 task 1.4: the wait matches "Body of alpha.md." — this fixture's own body line — not
    // merely "alpha.md". copyAsRichText.browser.test.ts's fixture ALSO contains "alpha.md", and when
    // it runs just before this file (as on CI's Linux order) the first read could return its
    // leftover before this click's write landed, so the wait ended early on the wrong text.
    const plain = await until(async () => {
      try {
        const text = await readTextBounded();
        return text.includes('Body of alpha.md.') ? text : null;
      } catch {
        return null;
      }
    });
    expect(plain).toContain('alpha.md');
    expect(plain).toContain('Body of alpha.md.');

    // ★ Task 9.1 (ruled — decisions.md): the SAME real click now also drives the row's own
    // completion affordance — proven here on the real click path, not merely on the direct
    // `reportCopyOutcome` unit-shaped assertions in `exportDegrade.browser.test.ts`.
    expect(copyHtmlRow.textContent).toContain('Copied');
    expect(copyHtmlRow.getAttribute('data-state')).toBe('done');
  });

  it('pdf: disabled at this task (3.3), re-confirmed live as of task 7.1', async () => {
    // ★ RIPPLE, task 3.4: copy-plain-text went live one task later than this file, which invalidated
    // this assertion's row set (it originally named copy-plain-text among the still-disabled rows).
    // Fixed in place then; ★ RIPPLE AGAIN, task 4.1: copy-rich-text also went live; ★ RIPPLE AGAIN,
    // task 7.1: pdf itself went live, the row this test was written to prove stayed inert — a stale
    // `true` here would misstate the panel's current behavior, so this now asserts the CURRENT
    // state. pdf's own liveness proof is printMode.browser.test.ts's job, not this file's.
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    for (const key of ['pdf']) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.disabled, `row "${key}" should be live`).toBe(false);
    }
    // And the HTML-file row (3.2) stays live too — this task adds a row, it does not touch that one.
    expect(panel.querySelector<HTMLButtonElement>('[data-export="html"]')!.disabled).toBe(false);
  });

  it('permission-free re-confirmed: BOTH built manifests still read `permissions: []` after the copy has run', async () => {
    const BUILT_MANIFESTS = import.meta.glob('/.output/*/manifest.json', {
      eager: true,
      import: 'default',
    }) as Record<string, Record<string, unknown>>;
    if (Object.keys(BUILT_MANIFESTS).length === 0) return; // skip: not built this run

    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();
    await userEvent.click(panel.querySelector<HTMLButtonElement>('[data-export="copy-html"]')!);
    await until(async () => {
      try {
        const text = await readTextBounded();
        return text.includes('alpha.md') || null;
      } catch {
        return null;
      }
    });

    for (const manifest of Object.values(BUILT_MANIFESTS)) {
      expect(Array.isArray(manifest.permissions) ? manifest.permissions : ['MISSING']).toEqual([]);
    }
  });
});
