import { mountAppShell } from '../../src/app/appShell';
import { folderSourceFromHandle } from '../../src/app/chromiumFolderSource';
import type { OpenFolderOutcome } from '../../src/app/folderSource';

// Bootstrap for the bundled app page (spec 002). Side-effects only — the entrypoint
// binds the DOM to the shell, mirroring how the content entrypoint only calls
// runReader(). All layout/logic lives in src/app/* so it is unit-testable without a
// real page (the M1 runReader/mountReader discipline).
//
// Imported by RELATIVE path, not the `@/…` alias `wxt prepare` generates: WXT's own
// bundler resolves either form identically, but `tests/browser/appHarnessSeam.browser
// .test.ts` (task 2.1) imports this module directly under plain Vitest, which has no
// `@/…` resolver wired in (`vitest.config.ts` carries none). Relative works in both.

/** True when focus is in a field we must not hijack Ctrl/Cmd+S from — mirrors
 *  `readerMode.ts`'s own `isEditableTarget`; see the task-8.1 comment below for why this is a
 *  small duplicate rather than an import. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable === true;
}

const root = document.getElementById('app');
if (root) {
  /**
   * ★ THE `__peekoverHarness` QUERY-GATED SEAM (task 2.1, D-1). Approved at gate 2 as new
   * PRODUCTION code for an automation need — `decisions.md`'s **M9 GATE 2** entry
   * (2026-08-15), Ruling 1 — permitted ONLY because it is capability-free by construction:
   *   1. no manifest change — no permission, no `web_accessible_resources`;
   *   2. query-inert on every real visit — `background.ts`'s `action.onClicked` opens
   *      `/app.html` with no query string, so this branch never runs for a real user;
   *   3. handle-only surface — `openFromHandle` accepts nothing but a caller-constructed
   *      `FileSystemDirectoryHandle` and feeds it through the SAME production
   *      `folderSourceFromHandle` (chromiumFolderSource.ts) that `openFolder()` already
   *      runs after `showDirectoryPicker()` resolves, so the harness grants no ability
   *      the caller does not already have.
   * Ruling 1's own recorded note: this does NOT set a precedent for other automation
   * seams — each is its own decision (specs/009-code-blocks/tasks.md 2.1).
   */
  const isHarness = new URL(location.href).searchParams.has('__peekoverHarness');

  // The handle most recently handed to `openFromHandle` — read only by the injected
  // `openFolder` override below, which exists only when `isHarness` is true.
  let harnessHandle: FileSystemDirectoryHandle | null = null;

  /**
   * Duck-typed, never `instanceof` (the constructor need not exist in every context this
   * bundle can run in). A real `FileSystemDirectoryHandle` carries all three; a plain
   * object, a string, or a URL carries none — so the surface REJECTS them rather than
   * silently minting a capability the caller does not already hold.
   */
  function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
    return (
      typeof value === 'object' &&
      value !== null &&
      (value as { kind?: unknown }).kind === 'directory' &&
      typeof (value as { values?: unknown }).values === 'function' &&
      typeof (value as { getDirectoryHandle?: unknown }).getDirectoryHandle === 'function'
    );
  }

  const app = mountAppShell(
    root,
    isHarness
      ? {
          openFolder: async (): Promise<OpenFolderOutcome> => {
            if (!harnessHandle) {
              return { ok: false, reason: 'error', message: '__peekoverHarness: no handle provided' };
            }
            return { ok: true, source: await folderSourceFromHandle(harnessHandle) };
          },
        }
      : {},
  );

  if (isHarness) {
    (
      window as unknown as {
        __peekoverHarness?: { openFromHandle(handle: FileSystemDirectoryHandle): Promise<void> };
      }
    ).__peekoverHarness = {
      openFromHandle: async (handle: FileSystemDirectoryHandle): Promise<void> => {
        if (!isDirectoryHandle(handle)) {
          throw new TypeError(
            '__peekoverHarness.openFromHandle requires a real FileSystemDirectoryHandle',
          );
        }
        harnessHandle = handle;
        await app.openFolder();
      },
    };
  }

  /**
   * ★ TASK 8.1 (D-5) — Ctrl/Cmd+S EXPORT SHORTCUT, APP-PAGE-ONLY BY CONSTRUCTION. Bound HERE, on
   * `document`, inside this `if (root)` block — never in a shared module `mount.ts`/the content
   * entrypoint also imports. That is the deliberate INVERSION of `readerMode.ts`'s
   * `installToggleShortcut` (D-5's own rejected-alternative text): that listener is installed
   * from a module BOTH surfaces run and scopes itself only by DOM shape (`data-mode` present),
   * so it fires wherever that shape exists, regardless of which script mounted it. Binding here
   * instead means the content-script bundle never carries this listener at all — proven by its
   * bytes staying md5-identical across this task (see `exportShortcut.browser.test.ts` and
   * `progress.md`'s own byte ledger), not merely by a DOM-shape guard that could be satisfied by
   * either surface.
   *
   * `isEditableTarget` is a deliberate small duplicate of `readerMode.ts`'s own helper of the same
   * name, not an import: importing from `readerMode.ts` would pull a content-script-oriented
   * module into the app-page graph for one four-line guard — two call sites don't earn an
   * extraction (this codebase's own rule-of-three precedent, `exportControls.ts`'s module doc
   * comment).
   */
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== 's') return;
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    if (isEditableTarget(e.target)) return;
    // Suppresses the native "Save Page As" dialog regardless of what happens next — including a
    // first-ever Ctrl+S, which now runs the HTML export (`lastExportFormat` defaults to `'html'`;
    // Ruling M-1, decisions.md 2026-09-04 · M10 10.4), and the rarer no-op when the stored value
    // is genuinely unrecognized.
    e.preventDefault();
    // Ruling B (012 task 5.3): while the document is being edited this is Save — the edit view's
    // own, reached through the shell, so no editor module is imported here. Outside edit
    // `saveEdit()` does nothing and returns false, and the export runs exactly as before.
    if (app.saveEdit()) return;
    app.triggerLastExport();
  });

  // DEV-ONLY manual seam (task 1.2). There is no folder source yet (group 3), so in
  // `pnpm dev` the human feeds a file by hand to confirm the reader pane renders it
  // through the themed M1 pipeline and that the no-selection/empty states show designed
  // content. Guarded by import.meta.env.DEV so it is stripped from production builds —
  // it adds no capability, no network, no stored state, only a console handle:
  //   __peekover.selectFile({ name: 'demo.md', read: async () => '# Hello\n\nWorld' })
  //   __peekover.selectFile({ name: 'empty.md', read: async () => '' })   // empty state
  //   __peekover.selectFile({ read: async () => { throw new Error('x') } }) // unreadable
  //   __peekover.selectFile(null)                                          // no-selection
  if (import.meta.env.DEV) {
    (globalThis as unknown as { __peekover?: typeof app }).__peekover = app;
  }
}
