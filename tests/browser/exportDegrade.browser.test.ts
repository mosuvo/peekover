// Task 9.1 — per-action failure states for the export panel, AND (human ruling, decisions.md) the
// copy-completion affordance the void→then change makes possible in the same commit — in a REAL
// ENGINE, Chromium AND Firefox.
//
// §9.1's own sealed body names the failure modes it must force: "a library fails to load,
// serialization throws, an image cannot be read." Of those, THIS milestone's surviving scope makes
// exactly TWO reachable: a serialization throw (`htmlExport.ts`'s `serializeReaderDocument`, shared
// by HTML export and every copy-from-clone row) and a failed copy (a rejected clipboard write, every
// copy row). "A library fails to load" and "an image cannot be read" have no forceable path here —
// M10 ships no PDF-generation library (D-7, `window.print()` only) and local-image embedding was
// dropped from scope entirely (the §3.1 gate ruling, `htmlExport.ts`'s own module doc comment) — so
// this file forces the two modes that are real, not the two that are not.
//
// ── THE RULING THIS FILE ALSO PROVES (decisions.md, M10 9.1) ────────────────────────────────────
//
// The reconciliation ahead of this task found a scope gap: §9.1's own sealed body owns
// FAILURE-STATES only, but three prior tasks (3.3, 3.4, 4.1 — every COPY row, decisions.md's own
// "task 9.1 owns the completion/failure UI this task named but did not build" note at each) had
// already loaded a positive COMPLETION affordance onto this task, unnamed in §9.1's own text. Ruled:
// they are ONE code change — every copy handler's `void copyFn(...)` becomes
// `copyFn(...).then(onCopied, onFailed)`, and the success branch of that same `.then` IS the
// completion affordance — scoped to the 3 COPY rows only. HTML export and PDF get NO Peekover
// completion affordance: each already has a native browser signal for success (the download shelf;
// the print dialog), so a Peekover "Exported!" would be redundant with it (the same "still
// justified / not redundant" discipline that dropped ZIP export). HTML DOES still get a
// FAILURE report — a thrown serialization error has no native signal at all — but PDF gets neither
// (`window.print()` has no promise/throw surface for `appShell.ts`'s guard to catch).

import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent, commands, cdp } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { EXPORT_ROW_STATE_ATTR, EXPORT_STATUS_CLASS } from '../../src/app/exportControls';

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

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

const SOURCE_MARKER = 'degrade-fixture-marker'; // distinctive — no sibling suite's fixture carries it
function mdFile(path: string): MarkdownFile {
  return {
    path,
    name: path.split('/').pop() ?? path,
    read: async () => `# ${path}\n\nBody of ${path}, ${SOURCE_MARKER}.\n`,
  };
}

// ★ A DELIBERATELY NON-SHARED FILENAME. Every sibling copy-row suite's fixture is named
// 'alpha.md' — this file's own successful-copy arms write real clipboard content containing that
// exact substring, and the real OS clipboard is one resource shared across every serially-run
// file in this suite (`fileParallelism:false`). Reusing 'alpha.md' collided in practice (measured
// while writing this file): a sibling's own generic `text.includes('alpha.md')` poll matched THIS
// file's stale leftover content before that sibling's own click had written anything — the exact
// race class `copyAsRichText.browser.test.ts`'s own distinctive-marker fix already named. A unique
// filename removes the collision at its root rather than tightening every sibling's own poll.
function memorySource(): FolderSource {
  return { name: 'docs', truncated: false, persistable: false, files: [mdFile('degrade.md')] };
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

const containers: HTMLElement[] = [];
afterEach(async () => {
  for (const c of containers.splice(0)) c.remove();
  await page.viewport(414, 896); // the harness default, restored after each test
});

/** `exportPanel.browser.test.ts`'s own `mountWithFile`, reused verbatim in shape: a file already
 *  selected, the real reader host really mounted (not a stub). */
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

function rowIn(panel: HTMLElement, key: string): HTMLButtonElement {
  return panel.querySelector<HTMLButtonElement>(`[data-export="${key}"]`)!;
}

function statusIn(panel: HTMLElement): HTMLElement {
  return panel.querySelector<HTMLElement>(`.${EXPORT_STATUS_CLASS}`)!;
}

/** `.peekover-reader`'s own subtree, straight off the reader host's shadow root — the "never blank,
 *  never disturbed by a failed action" target every forced-failure arm below checks against. */
function readerColumn(container: HTMLElement): HTMLElement {
  const host = container.querySelector<HTMLElement>('.peekover-app__reader__host')!;
  return host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
}

// ── THE CLIPBOARD STUB — `copyAsHtml.browser.test.ts`'s own rejection shape, reused for the panel
// click path rather than a direct function call. Replaces `navigator.clipboard` entirely, so no
// CDP consent is needed (the real permission-gated API is never reached) — cross-engine by
// construction, unlike a CDP grant, which is Chromium-only. ────────────────────────────────────
function stubClipboardRejecting(): () => void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      write: async (): Promise<void> => {
        throw new DOMException('denied (test-only, forced clipboard failure)', 'NotAllowedError');
      },
      writeText: async (): Promise<void> => {
        throw new DOMException('denied (test-only, forced clipboard failure)', 'NotAllowedError');
      },
    },
  });
  return () => Reflect.deleteProperty(navigator, 'clipboard');
}

/** Forces `htmlExport.ts`'s `serializeReaderDocument` to throw for REAL — §3.9's own named
 *  "serialization throw" mode — WITHOUT touching the live `.peekover-reader` subtree at all: it
 *  patches `cloneNode` on that ONE element instance (an own-property override, restorable by
 *  deleting it so the prototype method returns), so the reader stays fully rendered and
 *  reference-identical throughout. Removing the element itself instead would be self-defeating —
 *  the destruction WE performed to force the failure would be indistinguishable from the defect
 *  this test exists to catch. */
function forceSerializationThrow(column: HTMLElement): () => void {
  const patched = (() => {
    throw new Error('cloneNode failed (test-only, forced serialization throw)');
  }) as typeof column.cloneNode;
  Object.defineProperty(column, 'cloneNode', { configurable: true, value: patched });
  return () => Reflect.deleteProperty(column, 'cloneNode');
}

// ── PART A — THE 3 COPY ROWS: FORCED FAILURE STATES A COMPLETION UI MADE POSSIBLE ANY OF ────────

const COPY_ROWS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'copy-html', label: 'Copy as HTML' },
  { key: 'copy-plain-text', label: 'Copy as plain text' },
  { key: 'copy-rich-text', label: 'Copy as rich text' },
];

describe('9.1 — a rejected clipboard write states the failure, never a false success', () => {
  for (const { key } of COPY_ROWS) {
    it(`★ ${key}: forced failure shows "Copy failed", never "Copied", and the reader is untouched`, async () => {
      const { container, toggle } = await mountWithFile();
      const panel = await openPanel(container, toggle);
      const row = rowIn(panel, key);
      const status = statusIn(panel);
      const before = readerColumn(container);
      const beforeHtml = before.innerHTML;

      expect(status.hidden, 'firing control: the live region starts empty').toBe(true);

      const unstub = stubClipboardRejecting();
      try {
        row.click();
        await until(() => row.getAttribute(EXPORT_ROW_STATE_ATTR) === 'failed');
      } finally {
        unstub();
      }

      // ★ THE FAILURE IS STATED, DISTINCTLY.
      expect(row.textContent, `${key}: row text`).toContain('Copy failed');
      expect(row.getAttribute('aria-label'), `${key}: aria-label`).toContain('copy failed');
      expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('failed');
      expect(status.hidden, `${key}: live region should have announced`).toBe(false);
      expect(status.textContent, `${key}: announcement`).toContain('could not be copied');

      // ★ NO FALSE SUCCESS (AGENTS.md #5) — the negative, stated as its own assertion.
      expect(row.textContent, `${key}: must never say Copied on a rejected write`).not.toContain(
        'Copied',
      );

      // ★ NEVER BLANK, NEVER DISTURBED — same node, same content, pre/post the forced failure.
      const after = readerColumn(container);
      expect(after, `${key}: the reader column was replaced, not merely edited`).toBe(before);
      expect(after.innerHTML, `${key}: the reader's own markup changed`).toBe(beforeHtml);
    });
  }
});

// ★ REVERT-AND-FAIL (M6 finding 5 — "the standard, not an option"): the arms above were verified
// red by actually reverting `appShell.ts`'s `.then(onCopied, onFailed)` wiring back to the
// pre-9.1 `void copyFn(host)` shape and re-running this file. Signature: every "forced failure"
// arm's `until(() => row.getAttribute(EXPORT_ROW_STATE_ATTR) === 'failed')` timed out (a discarded
// promise rejects into nothing a row can react to — the row is left exactly as it started, "Copy as
// HTML"/etc, forever), and Firefox additionally surfaced the rejection as a genuine unhandled
// promise rejection in `read_console_messages` — the exact "silent no-op OR an uncaught error, never
// a stated failure" defect §9.1 exists to close. The transcript is not re-run automatically here
// (there is no seam to flip `.then` back to `void` from inside a test without duplicating
// `appShell.ts`'s own logic) — recorded instead in `decisions.md`'s M10 9.1 entry, per this
// codebase's own precedent for revert-and-fail proofs that require a real source edit
// (`diagramDegrade.browser.test.ts`'s own header comment names the same limit for its engine-load
// arm).

describe('9.1 — a real successful copy shows "Copied" and announces it (the completion half)', () => {
  let grantedContextId: string | undefined;
  let consentGranted = false;
  async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
    try {
      const status = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
      return status.state;
    } catch {
      return 'unsupported';
    }
  }
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

  for (const { key, label } of COPY_ROWS) {
    it(`★ ${key}: a real successful copy shows "Copied" and announces it`, async () => {
      const { container, toggle } = await mountWithFile();
      const panel = await openPanel(container, toggle);
      const row = rowIn(panel, key);
      const status = statusIn(panel);

      if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

      await userEvent.click(row);
      await until(() => row.getAttribute(EXPORT_ROW_STATE_ATTR) === 'done');

      expect(row.textContent, `${key}: row text`).toContain('Copied');
      expect(row.getAttribute('aria-label'), `${key}: aria-label`).toContain('copied');
      expect(status.hidden, `${key}: live region should have announced`).toBe(false);
      expect(status.textContent, `${key}: announcement`).toContain(`${label} copied.`);
    });
  }
});

// ── PART B — HTML EXPORT: A FAILURE-ONLY SURFACE, NO SUCCESS AFFORDANCE (the ruling) ────────────

describe('9.1 — HTML export: a serialization throw states failure; success stays native-signal-only', () => {
  it('★ a real serialization throw shows "Export failed", never disturbs the reader, and never a false success', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const row = rowIn(panel, 'html');
    const status = statusIn(panel);
    const before = readerColumn(container);
    const beforeHtml = before.innerHTML;

    const restore = forceSerializationThrow(before);
    try {
      row.click();
      await until(() => row.getAttribute(EXPORT_ROW_STATE_ATTR) === 'failed');
    } finally {
      restore();
    }

    expect(row.textContent, 'row text').toContain('Export failed');
    expect(row.getAttribute('aria-label'), 'aria-label').toContain('failed');
    expect(row.getAttribute(EXPORT_ROW_STATE_ATTR)).toBe('failed');
    expect(status.hidden, 'the live region should have announced the export failure').toBe(false);
    expect(status.textContent).toContain('failed');

    // ★ NO FALSE SUCCESS — the download-shelf-redundant "Copied" vocabulary must never appear here.
    expect(row.textContent, 'must never say Copied — HTML has no completion affordance at all').not
      .toContain('Copied');

    // ★ NEVER BLANK, NEVER DISTURBED — cloneNode was patched, not the live tree; the SAME node,
    // SAME markup, survives the forced failure untouched.
    const after = readerColumn(container);
    expect(after, 'the reader column was replaced, not merely edited').toBe(before);
    expect(after.innerHTML, "the reader's own markup changed").toBe(beforeHtml);
  });

  it('a real successful export shows NO Peekover completion affordance — the download shelf is the signal (ruling)', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const row = rowIn(panel, 'html');
    const status = statusIn(panel);

    await commands.armExportDownload();
    row.click();
    const downloaded = await commands.collectExportDownload();
    expect(downloaded.consoleErrors).toEqual([]); // the real download really happened

    // ★ THE RULING'S OWN EXCLUSION: no row-state, no live-region announcement — the browser's own
    // download UI is the only signal, deliberately not duplicated by this panel.
    expect(row.hasAttribute(EXPORT_ROW_STATE_ATTR), 'html must never gain a completion data-state')
      .toBe(false);
    expect(row.textContent).not.toContain('Copied');
    expect(row.textContent).not.toContain('Exported');
    expect(status.hidden, 'the live region must stay silent for a successful HTML export').toBe(true);
  });
});

// ── PART C — PDF: NEITHER HALF, ON EITHER OUTCOME (window.print() has no promise/throw surface) ─

describe('9.1 — PDF export: no completion or failure report on either count (the ruling)', () => {
  it('window.print() firing leaves the row exactly as it was — no data-state, no announcement', async () => {
    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);
    const row = rowIn(panel, 'pdf');
    const status = statusIn(panel);
    const beforeLabel = row.getAttribute('aria-label');
    const beforeText = row.textContent;

    const printSpy = ((): { restore(): void } => {
      const original = window.print;
      window.print = () => undefined;
      return { restore: () => (window.print = original) };
    })();
    try {
      row.click();
      await new Promise<void>((r) => setTimeout(r, 100)); // no async settle to await — a sync call
    } finally {
      printSpy.restore();
    }

    expect(row.hasAttribute(EXPORT_ROW_STATE_ATTR)).toBe(false);
    expect(row.getAttribute('aria-label')).toBe(beforeLabel);
    expect(row.textContent).toBe(beforeText);
    expect(status.hidden, 'the live region must stay silent for PDF, on either outcome').toBe(true);
  });
});
