// Copy-as-rich-text (task 4.1, D-4) in a REAL ENGINE, Chromium AND Firefox — clipboard is
// jsdom-blind (matching `copyAsHtml.browser.test.ts`'s own split at task 3.3; there is no
// `src/export/htmlExport.test.ts` half for this reason).
//
// ══ ★ WHY THIS IS A DIFFERENT PAYLOAD FROM 3.3's copyAsHtml, PROVEN STRUCTURALLY ═══════════════
//
// tasks.md §4.1's own text: `copyAsRichText`'s `text/html` is the clone's SEMANTIC MARKUP ALONE —
// `clone.outerHTML`, never `wrapInStandaloneDocument` — so the paste target's OWN default styling
// applies instead of the reader's theme (spec §3.2's persona line: pastes "without carrying the
// reader's own styling along with it"). `copyAsHtml` (3.3) wraps the SAME clone into a full
// standalone document instead: doctype + `<head><style>…</style></head>` + `<body>`. The
// structural markers that distinguish the two (`<!doctype`, `<style`) are asserted PRESENT on
// `copyAsHtml`'s own payload FIRST, below — the firing control: it proves the "absent on
// copyAsRichText's payload" checks are capable of catching a regression that made `copyAsRichText`
// reuse `wrapInStandaloneDocument` (which would make both checks come back present for rich text
// too, collapsing 4.1 into 3.3), rather than a bare `!==` that could pass for an unrelated reason.
//
// ══ ★ ENGINE PARITY — THIS PAYLOAD IS SELF-PRODUCED, NOT OS-TRANSFORM-RELIANT ══════════════════
//
// 3.3's own probe (see `copyAsHtml.browser.test.ts`) measured that the REAL OS clipboard's native
// `text/html` format is lossy and reformats DIFFERENTLY per engine once something reads it back —
// Chromium re-serializes into a `getComputedStyle`-inlined fragment on paste, Firefox reformats
// whitespace differently. That transform happens on PASTE, in code this task does not own.
// `copyAsRichText` itself writes the IDENTICAL fragment string on both engines — proven below via
// the theme-invariance test, which would also catch either engine's build silently baking anything
// theme-specific into the payload. Whatever a specific paste TARGET later does with that fragment
// is inherently target-dependent, the same as any external paste, not a Peekover cross-engine gap.
//
// ══ CAPTURE VS REAL CLIPBOARD, SAME SPLIT 3.3/3.4 ESTABLISHED ═══════════════════════════════════
//
// The byte-shape assertions (no `<style>`, no doctype, semantic tags present, distinct from
// copyAsHtml, theme-invariant) all CAPTURE the `ClipboardItem` before the OS clipboard gets a
// chance to mangle `text/html` (3.3's own measured finding). The permission-free/liveness claim is
// proven through the REAL clipboard's `text/plain`, which round-trips unmangled on both engines
// (same probe) — `copyAsHtml.browser.test.ts`'s own consent-and-gesture shape, reused verbatim.
//
// ══ THE file:// SECURE-CONTEXT RESIDUAL (008 D-10), RE-CHECKED FOR THIS PAYLOAD SHAPE ═══════════
//
// `copyAsRichText`, like every export control, is reachable ONLY from the app page (§3.2 confines
// exports there; content-script `file://` gets no export affordance at all, M10 spec §3.2 and the
// `htmlExport.ts` module doc comment's own citation of that boundary). The app page's own origin is
// `chrome-extension:`/`moz-extension:`, always a secure context — the SAME origin 3.3's and 3.4's
// clipboard writes already run from, successfully, permission-free. Nothing about THIS payload's
// shape (fragment vs standalone document) changes which origin the call executes from, so 008
// D-10's `file://`-specific hedge does not transfer here; no dedicated test is needed for the same
// reason 3.3/3.4 added none — the confinement itself is the answer, re-confirmed rather than
// assumed (this comment IS that re-check).

import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent, cdp } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { copyAsHtml, copyAsRichText } from '../../src/export/htmlExport';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';

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

// ── The capturing stub — `diagramActions.browser.test.ts`'s own shape, reused for a THIRD call
// site (`copyAsHtml.browser.test.ts` is the second). Still reproduced inline, not extracted, per
// `exportControls.ts`'s stated rule-of-three policy. `write` is the ONLY thing replaced. ─────────
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

const RICH_SOURCE =
  '# Title\n\nSome **bold** text and a list:\n\n- one\n- two\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n';

// ── §4.1 — copyAsRichText() driven directly, mirroring 3.3's own copyAsHtml shape ───────────────

describe('copyAsRichText — a DIFFERENT payload from copyAsHtml, semantic markup alone', () => {
  it('★ THE 4.1-vs-3.3 DISTINCTION: no <style>/doctype — copyAsHtml (same host) has both', async () => {
    const host = mountedHost(RICH_SOURCE, 'dark');

    const clipboard = stubClipboard();
    try {
      await copyAsHtml(host);
      await copyAsRichText(host);
      expect(clipboard.written).toHaveLength(2);

      const htmlPayload = await blobText(clipboard.written[0][0], 'text/html');
      const richPayload = await blobText(clipboard.written[1][0], 'text/html');

      // FIRING CONTROL — see the module doc comment: proves the checks below CAN fail.
      expect(htmlPayload).toContain('<!doctype html>');
      expect(htmlPayload).toContain('<style>');

      expect(richPayload).not.toContain('<!doctype');
      expect(richPayload).not.toContain('<style');
      expect(richPayload).not.toContain('<head');
      expect(richPayload).not.toBe(htmlPayload);
    } finally {
      clipboard.restore();
    }
  });

  it('carries no reader-theme-derived styling — byte-identical across light/dark/sepia for the SAME content', async () => {
    const payloads: string[] = [];
    for (const theme of ['light', 'dark', 'sepia'] as const) {
      const host = mountedHost(RICH_SOURCE, theme);
      const clipboard = stubClipboard();
      try {
        await copyAsRichText(host);
        payloads.push(await blobText(clipboard.written[0][0], 'text/html'));
      } finally {
        clipboard.restore();
      }
    }
    expect(payloads[1]).toBe(payloads[0]);
    expect(payloads[2]).toBe(payloads[0]);
  });

  it('the semantic markup is present as real tags — paste-appropriate for Docs/Word', async () => {
    const host = mountedHost(RICH_SOURCE, 'light');
    const clipboard = stubClipboard();
    try {
      await copyAsRichText(host);
      const html = await blobText(clipboard.written[0][0], 'text/html');
      expect(html).toMatch(/<h1[ >]/);
      expect(html).toMatch(/<(strong|b)[ >]/);
      expect(html).toMatch(/<(ul|li)[ >]/);
      expect(html).toMatch(/<table[ >]/);
    } finally {
      clipboard.restore();
    }
  });

  it("the text/plain fallback is the RENDERED text, the SAME shape copyAsHtml's own fallback uses", async () => {
    const host = mountedHost(RICH_SOURCE, 'light');
    const clone = host.shadowRoot!.querySelector('.peekover-reader')!;

    const clipboard = stubClipboard();
    try {
      await copyAsRichText(host);
      const plain = await blobText(clipboard.written[0][0], 'text/plain');

      expect(plain).toBe(clone.textContent);
      expect(plain).toContain('bold');
      expect(plain).not.toContain('**bold**');
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
      await expect(copyAsRichText(host)).rejects.toThrow();
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});

// ── The export panel's own copy-rich-text row (task 4.1's exportControls.ts/appShell.ts half) ──

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

// A distinctive marker ("exported richly") no sibling file's own fixture carries — the real OS
// clipboard is shared across every serially-run file in this suite, and a bare "alpha.md"/"bold"
// substring check (both common across sibling fixtures) raced stale leftover content from an
// earlier file's own write (measured — this exact collision fired against copyAsHtml.browser
// .test.ts's own "alpha.md" fixture until fixed).
const PANEL_SOURCE = '# alpha.md\n\nBody exported richly, with **bold** text, of alpha.md.';

function mdFile(path: string, text = PANEL_SOURCE): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile('alpha.md')] };
}

/** Mount the shell with a file already selected — `activeFile` set, the reader host really
 *  mounted, mirroring `copyAsHtml.browser.test.ts`'s own `mountWithFile`. */
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

describe('the export panel — Copy as rich text row goes live at this task (pdf went live later, at task 7.1)', () => {
  it('★ clicking "Copy as rich text" writes to the REAL clipboard, permission-free (D-4, re-confirmed)', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const row = panel.querySelector<HTMLButtonElement>('[data-export="copy-rich-text"]')!;
    expect(row.disabled, 'the copy-rich-text row must be LIVE at task 4.1').toBe(false);

    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

    await userEvent.click(row);
    // Matched on this fixture's own DISTINCTIVE marker, never a bare "alpha.md"/"bold" substring
    // (both common across sibling fixtures) and never mere non-emptiness — see PANEL_SOURCE's own
    // comment for the measured collision this avoids.
    const plain = await until(async () => {
      try {
        const text = await readTextBounded();
        return text.includes('exported richly') ? text : null;
      } catch {
        return null;
      }
    });
    expect(plain).toContain('alpha.md');
    expect(plain).toContain('bold');

    // ★ Task 9.1 (ruled — decisions.md): the same real click drives the row's own completion
    // affordance too — proven here on the real click path.
    expect(row.textContent).toContain('Copied');
    expect(row.getAttribute('data-state')).toBe('done');
  });

  it('pdf stayed disabled at this task (4.1 touches one row) — re-confirmed live as of task 7.1', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    // 4.1's own scope: html/copy-html/copy-plain-text/copy-rich-text are live, pdf was still the
    // one gap. Task 7.1 closed it — this test now asserts the CURRENT state (all 5 live), not the
    // task-4.1-era snapshot; pdf's own liveness proof is printMode.browser.test.ts's job, not this
    // file's, but a stale `true` assertion here would misstate what the panel actually does today.
    for (const key of ['html', 'copy-html', 'copy-plain-text', 'copy-rich-text', 'pdf']) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.disabled, `row "${key}" should be live`).toBe(false);
    }
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
    await userEvent.click(panel.querySelector<HTMLButtonElement>('[data-export="copy-rich-text"]')!);
    await until(async () => {
      try {
        const text = await readTextBounded();
        return text.includes('exported richly') || null;
      } catch {
        return null;
      }
    });

    for (const manifest of Object.values(BUILT_MANIFESTS)) {
      expect(Array.isArray(manifest.permissions) ? manifest.permissions : ['MISSING']).toEqual([]);
    }
  });
});
