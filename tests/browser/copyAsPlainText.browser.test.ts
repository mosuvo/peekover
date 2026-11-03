// Copy-as-plain-text (task 3.4, D-4's plain-text half) in a REAL ENGINE, Chromium AND Firefox —
// clipboard is jsdom-blind (matching `copyAsHtml.browser.test.ts`'s own split at task 3.3; there is
// no `src/export/copyPlainText.test.ts` for the same reason `htmlExport.ts`'s clipboard calls have
// no jsdom half).
//
// ══ ★ UNLIKE 3.3, THIS TASK'S OWN CORRECTNESS CHECK USES THE REAL CLIPBOARD DIRECTLY ═════════════
//
// 3.3's same-artifact check had to CAPTURE the `ClipboardItem` because a throwaway probe (run
// before that file was written) found the native `text/html` OS clipboard format LOSSY on both
// engines. The SAME probe found `text/plain` round-trips UNMANGLED on both — so this task's own
// distinguishing claim (raw source, not the render) is checked with a captured stub where the
// PAYLOAD needs isolating from a mounted document's DOM, and with the REAL clipboard where the
// claim is "the row's click really writes," reusing `copyAsHtml.browser.test.ts`'s own
// consent-and-gesture shape (`tableCopy.browser.test.ts`'s pattern, reused a second time) verbatim.
//
// ══ ★ THE SOURCE-VS-SCREEN CONSISTENCY QUESTION (Q1, `copyPlainText.ts`'s own doc comment) ═══════
//
// `copyAsPlainText` reads `source.read()` FRESH, never a cache — this is the thing that makes 3.4
// distinct from every other row in this panel, which all work off the already-rendered clone. The
// fixtures below prove the payload is the SOURCE (`**bold**`), never the RENDER (`bold`) — the
// mirror image of `copyAsHtml.browser.test.ts`'s own Q2 proof that ITS fallback is the render, not
// the source.

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { page, userEvent, cdp } from 'vitest/browser';
import { mount } from '../../src/render/mount';
import { copyAsPlainText, type ReadableSource } from '../../src/export/copyPlainText';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';

// RULING C (the 4.0 census, 2026-11-02; 013 task 4.4): this file is not about the compact toolbar, so
// its window is WIDE — above the 863 px breakpoint, where the app controls sit in the toolbar
// instead of behind "⋯". KEEPS: each test's own property (C104); RE-SPELLED at 4.4 by the
// window alone. The harness default (414 × 896) is restored after each test — the window is shared
// by every file that runs after this one.
beforeEach(async () => {
  await page.viewport(1280, 900);
});
afterEach(async () => {
  await page.viewport(414, 896);
});

const HOST_TAG = 'peekover-root';
const hosts: HTMLElement[] = [];
const containers: HTMLElement[] = [];
afterEach(async () => {
  for (const host of hosts.splice(0)) host.remove();
  for (const c of containers.splice(0)) c.remove();
  await page.viewport(414, 896); // the harness default, restored after each test
});

function mountedHost(markdown: string): HTMLElement {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  hosts.push(host);
  mount(markdown, host, { contained: true });
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

/** `navigator.clipboard.readText()`, bounded — `copyAsHtml.browser.test.ts`'s own shape, reused
 *  verbatim: a single call must never be allowed to hang a retry loop indefinitely if an engine's
 *  read stalls rather than rejects. */
function readTextBounded(ms = 300): Promise<string> {
  return Promise.race([
    navigator.clipboard.readText(),
    new Promise<string>((_, reject) => setTimeout(() => reject(new Error('readText timeout')), ms)),
  ]);
}

/** A fake `MarkdownFile`-shaped source — `copyAsPlainText` only ever calls `.read()`, so a bare
 *  `{ read }` exercises the same contract without pulling in `folderSource.ts`. */
function fakeSource(text: string): ReadableSource {
  return { read: async () => text };
}

// ── Captures `navigator.clipboard.writeText` — the ONLY thing replaced; `copyAsPlainText` itself
// runs unmodified. `copyAsHtml.browser.test.ts`'s own `stubClipboard` shape, adapted for a
// `writeText`-shaped API instead of `write([ClipboardItem])`. ───────────────────────────────────
function stubWriteText() {
  const written: string[] = [];
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string): Promise<void> => {
        written.push(text);
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

// ── `copyAsPlainText()` driven directly, mirroring 3.3's own direct-call describe block ─────────

describe('copyAsPlainText — the RAW SOURCE, never the rendered DOM (Q1)', () => {
  it('★ RAW-SOURCE, NOT RENDERED: the payload is the authored markdown, not its rendered text', async () => {
    const source = '# Title\n\nSome **bold** text.\n';
    const host = mountedHost(source);
    const clone = host.shadowRoot!.querySelector('.peekover-reader')!;
    // Sanity: this fixture really does render differently from its source — otherwise the
    // assertion below would pass vacuously regardless of which one `copyAsPlainText` actually read.
    expect(clone.textContent).toContain('bold');
    expect(clone.textContent).not.toContain('**bold**');

    const clipboard = stubWriteText();
    try {
      await copyAsPlainText(fakeSource(source));
      expect(clipboard.written).toEqual([source]);
      expect(clipboard.written[0]).toContain('**bold**');
      expect(clipboard.written[0]).not.toBe(clone.textContent);
    } finally {
      clipboard.restore();
    }
  });

  it('byte-identical to the source over a hostile fixture: unicode, trailing whitespace, mixed CRLF/LF', async () => {
    const source = '# Café ☕ résumé\n\nLine one   \r\nLine two\nLine three  \r\n\ntrailing   ';
    const clipboard = stubWriteText();
    try {
      await copyAsPlainText(fakeSource(source));
      expect(clipboard.written).toHaveLength(1);
      expect(clipboard.written[0]).toBe(source);
      expect(clipboard.written[0].length).toBe(source.length);
    } finally {
      clipboard.restore();
    }
  });

  it('a REJECTED READ never reaches the write — no false success (AGENTS.md #5)', async () => {
    const clipboard = stubWriteText();
    const failingSource: ReadableSource = {
      read: async () => {
        throw new Error('permission/IO failure');
      },
    };
    try {
      await expect(copyAsPlainText(failingSource)).rejects.toThrow('permission/IO failure');
      expect(clipboard.written).toHaveLength(0);
    } finally {
      clipboard.restore();
    }
  });

  it('a rejected clipboard WRITE is rethrown, never swallowed into a false success (AGENTS.md #5)', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (): Promise<void> => {
          throw new DOMException('denied', 'NotAllowedError');
        },
      },
    });
    try {
      await expect(copyAsPlainText(fakeSource('# Doc\n'))).rejects.toThrow();
    } finally {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });
});

// ── The export panel's own copy-plain-text row (task 3.4's `exportControls.ts`/`appShell.ts` half) ──

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

// The fixture's SOURCE deliberately differs from its RENDER (`**bold**` -> "bold") so a click that
// copied the render instead of the source would fail the content match below, not merely pass
// vacuously against identical text.
const PANEL_SOURCE = '# alpha.md\n\nBody of alpha.md with **bold** text.';

function mdFile(path: string, text = PANEL_SOURCE): MarkdownFile {
  return { path, name: path.split('/').pop() ?? path, read: async () => text };
}

function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile('alpha.md')] };
}

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
  const toggle = container.querySelector<HTMLButtonElement>('.peekover-app__export-toggle')!;
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

/** Chromium-only real browser CONSENT (never a manifest permission) — `copyAsHtml.browser.test
 *  .ts`'s own `grantClipboardConsent` shape, reused verbatim. */
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

describe('the export panel — Copy as plain text row goes live at this task, 2 still disabled', () => {
  it('★ clicking "Copy as plain text" writes the RAW SOURCE to the REAL clipboard, permission-free', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const row = panel.querySelector<HTMLButtonElement>('[data-export="copy-plain-text"]')!;
    expect(row.disabled, 'the copy-plain-text row must be LIVE at task 3.4').toBe(false);

    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

    await userEvent.click(row);
    // Matched on this fixture's own expected content, never mere non-emptiness (Q5 — the real OS
    // clipboard is shared across every serially-run file in this suite; a bare non-empty check
    // raced stale content from an earlier file's own write, measured at task 3.3).
    const plain = await until(async () => {
      try {
        const text = await readTextBounded();
        return text.includes('**bold**') ? text : null;
      } catch {
        return null;
      }
    });
    // ★ MEASURED (this task): comparing the ROUND-TRIPPED read back against `PANEL_SOURCE` with
    // strict `toBe` is not the right instrument on Windows/Chromium — the real OS clipboard itself
    // normalizes `\n` to `\r\n` for plain text on write (CF_UNICODETEXT's own convention), so a
    // byte-exact LF source reads back as CRLF even though `copyAsPlainText` handed `writeText` the
    // UNMODIFIED source string. That is an OS/engine artifact outside Peekover's control — the same
    // kind of finding 3.3's own probe made for `text/html` — not a defect in this control. The
    // ACTUAL byte-identical-to-source claim (unicode, trailing whitespace, mixed CRLF/LF) is proven
    // above, in the captured-`writeText` direct-call tests, which observe the string BEFORE the OS
    // clipboard gets to normalize anything. This real-clipboard assertion instead proves what only
    // the real clipboard CAN prove: the row's click really drives a write, permission-free, and
    // that write reaches the OS clipboard carrying THIS fixture's own content, newlines normalized
    // for the comparison so the two measurements are not conflated.
    expect(plain?.replace(/\r\n/g, '\n')).toBe(PANEL_SOURCE);
    expect(plain).toContain('**bold**');
    expect(plain).not.toContain('<'); // never the exported/rendered HTML artifact

    // ★ Task 9.1 (ruled — decisions.md): the same real click drives the row's own completion
    // affordance too — proven here on the real click path.
    expect(row.textContent).toContain('Copied');
    expect(row.getAttribute('data-state')).toBe('done');
  });

  it('pdf: disabled at this task (3.4), re-confirmed live as of task 7.1', async () => {
    // ★ RIPPLE, task 4.1: copy-rich-text went live one task later than this file, which invalidated
    // this assertion's row set (it originally named copy-rich-text among the still-disabled rows).
    // Fixed in place, mirroring 3.3's own ripple to `exportPanel.browser.test.ts` for the same
    // reason — copy-rich-text's own liveness is proven in `copyAsRichText.browser.test.ts`, not here.
    // ★ RIPPLE AGAIN, task 7.1: pdf itself went live, the row this test was written to prove stayed
    // inert — a stale `true` here would misstate the panel's current behavior, so this now asserts
    // the CURRENT state; pdf's own liveness proof is printMode.browser.test.ts's job, not this file's.
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    for (const key of ['pdf']) {
      const row = panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
      expect(row.disabled, `row "${key}" should be live`).toBe(false);
    }
    // And the HTML (3.2) + copy-HTML (3.3) rows stay live too — this task adds a row, it does not
    // touch either of those.
    expect(panel.querySelector<HTMLButtonElement>('[data-export="html"]')!.disabled).toBe(false);
    expect(panel.querySelector<HTMLButtonElement>('[data-export="copy-html"]')!.disabled).toBe(
      false,
    );
  });
});
