// TASK 3.8 — THE COPY-OUT, IN A REAL ENGINE (F22 · D-10 · §3.8 · gate-2 ruling Q2)
//
// `src/render/tableTools.test.ts` answers the serializer, the row set, the button shape, the
// failure path and the properties — exactly and cheaply, in jsdom, against a recorder. FIVE things
// it cannot answer at all are here, and each is a property whose whole content is that a REAL
// engine does something:
//
//   • D-10 — a gesture-driven `navigator.clipboard.writeText` RESOLVES at `permissions: []`.
//     jsdom implements no clipboard whatsoever, so the entire claim is invisible there. This is
//     the one leg of D-10 that a documentation read cannot settle, and *"a doc read is not a
//     build"* is `diagramActions.browser.test.ts:813`'s own words for the same question.
//   • §3.8 — an UNAVAILABLE clipboard degrades to a stated failure beside a still-readable table.
//     Proven against a REAL `NotAllowedError` from a real engine, not an injected rejection.
//   • Row 16 — a real tab stop and a real activation. jsdom focuses anything you ask it to and has
//     no default `<button>` behaviour, so the claim is untestable there.
//   • §5 — the confirmation is PAINTED. *"State in text"* is a claim about what a sighted reader
//     can see, and a `width:0` span passes every `textContent` assertion ever written.
//   • Gate-2 Q2 — the two buttons are on the screen, inside the strip, with nothing overlaying
//     them and focus never leaving where the reader put it.
//
// ★ AND NOTHING BELOW CALLS `enhanceTables`. The copy arrives through the app page's own click
// chain or it does not arrive — the M5 "built, tested, wired to nothing" defect is why.
//
// ══ ★ THE TWO ENGINES GATE THE WRITE DIFFERENTLY, AND NEITHER GATE IS A MANIFEST KEY ══════════
//
// Measured here, and identical to what `diagramActions.browser.test.ts:840-849` measured for
// `clipboard.write`:
//
//   • FIREFOX writes on the gesture alone. `clipboard-write` is not a `PermissionName` in Gecko —
//     there is nothing to ask for and nothing to grant — so a real trusted click, the engine's
//     real clipboard and NOTHING granted to anybody is D-10's claim in its strongest form.
//   • CHROMIUM consults the Permissions API, and a Playwright browser context leaves that consent
//     at `prompt`, so the identical click reds with `NotAllowedError: Write permission denied`.
//     That is not an obstacle to route around: it is TWO findings at once. It is the OFF arm of an
//     A-B ablation whose ON arm grants the browser consent over CDP — same build, same button,
//     same bytes, nothing rebuilt — and it is §3.8's degradation happening for real, which is why
//     the failure case below runs on the engine that produces the failure by itself.
//
// ★ WHAT THIS DOES NOT PROVE, STATED SO NOBODY READS MORE INTO A GREEN: that a focused, headful
// Chrome auto-grants the consent to a gesture-driven write. That is real-Chrome behaviour a
// Playwright context cannot exhibit, and it stays a documentation finding rather than a build.
// D-10's `file://` residual is 4.2's — it needs the content-script surface, which is not here.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { userEvent, cdp, commands } from 'vitest/browser';
// ★ 4.2's content-script surface: `runReader` is the entrypoint's own document_start
// orchestration, which reaches `mountReader` and through it D-6 site 3. Nothing below calls
// `enhanceTables` — on this surface either, for 3.4's reason.
import { runReader, removeHideStyle } from '../../src/render/runReader';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { TABLE_TOOLBAR_CLASS } from '../../src/render/tableEnhancer';
import {
  COPY_BUTTON_CLASS,
  COPY_CSV_CLASS,
  COPY_MARKDOWN_CLASS,
  COPY_STATUS_CLASS,
  FILTER_CLEAR_CLASS,
  FILTER_COUNT_CLASS,
  FILTER_FIELD_CLASS,
  SORT_BUTTON_CLASS,
} from '../../src/render/tableTools';
import { resetDocIdentityForTest } from '../../src/render/docIdentity';
import { resetWatchRegistryForTest } from '../../src/watch/watchRegistry';
import { resetWatchControlsForTest } from '../../src/watch/watchControl';
import { resetThemeHostsForTest } from '../../src/theme/themeRegistry';
import { resetThemeControlsForTest } from '../../src/theme/themeControl';
import { resetDiffRegistryForTest } from '../../src/render/diffRegistry';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────────

/**
 * Three data rows over three columns, chosen so that DOCUMENT order and SCREEN order can be made
 * to share no position and no row set: `dept` has two `eng` rows for the filter to keep, and `n` is
 * 10 / 9 / 2 for the sort to move. F22 is unfalsifiable against a fixture where the two agree.
 */
const COPY_DOC = [
  '# Report',
  '',
  '| dept | who | n |',
  '| --- | --- | --- |',
  '| eng | zoe | 10 |',
  '| eng | adam | 9 |',
  '| ops | bo | 2 |',
  '',
  'Trailing prose, below the table.',
  '',
].join('\n');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => T | null | undefined | false, tries = 400): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    const v = fn();
    if (v) return v as T;
    await sleep(20);
  }
  throw new Error('waitFor timed out');
}

// ── The app-page harness (call site 1 — `readerPane.ts`'s paint) ──────────────────────────────

const containers: HTMLElement[] = [];

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function sourceOf(files: MarkdownFile[]): FolderSource {
  return { name: 'notes', files, truncated: false, persistable: true };
}

/** Mount the shell and open the file — the real gesture chain, never a direct `selectFile`. */
async function openDoc(doc: string): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const app = mountAppShell(container, {
    openFolder: async () => ({
      ok: true,
      source: sourceOf([{ path: 'report.md', name: 'report.md', read: async () => doc }]),
    }),
    store: fakeStore(),
  });
  await app.openFolder();

  const btn = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="treeitem"][data-kind="file"]'),
  ].find((b) => b.textContent === 'report.md')!;
  btn.click();
  const host = await waitFor(() =>
    container.querySelector<HTMLElement>('.peekover-app__reader__host'),
  );
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

// ── Readers ───────────────────────────────────────────────────────────────────────────────────

const columnOf = (host: HTMLElement) =>
  host.shadowRoot!.querySelector<HTMLElement>('.peekover-reader')!;
const tablesIn = (host: HTMLElement) => [...columnOf(host).querySelectorAll('table')];
const toolbarOf = (table: HTMLTableElement) => table.previousElementSibling as HTMLElement;

/**
 * The copy controls, found BY CLASS ALONE — never `button.${COPY_CSV_CLASS}`.
 *
 * ★ THE SELECTOR MUST NOT ENCODE THE ANSWER. The gate-2 ruling's claim is that these ARE two real
 * `<button>`s. A tag-qualified selector makes that unfalsifiable: a `<span>` control returns
 * NOTHING, every case dies on an undefined dereference, and the shape assertion written to catch
 * exactly this never runs. (Paid for at 3.5, again at 3.6, and again at 3.7.)
 */
const copyButtonsIn = (table: HTMLTableElement) => [
  ...toolbarOf(table).querySelectorAll<HTMLButtonElement>(`.${COPY_BUTTON_CLASS}`),
];
const csvButtonOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_CSV_CLASS}`)!;
const markdownButtonOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${COPY_MARKDOWN_CLASS}`)!;
const statusOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLElement>(`.${COPY_STATUS_CLASS}`)!;
const fieldOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLInputElement>(`.${FILTER_FIELD_CLASS}`)!;
const clearOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLButtonElement>(`.${FILTER_CLEAR_CLASS}`)!;
const countOf = (table: HTMLTableElement) =>
  toolbarOf(table).querySelector<HTMLElement>(`.${FILTER_COUNT_CLASS}`)!;
const sortButtonsIn = (table: HTMLTableElement) => [
  ...table.querySelectorAll<HTMLButtonElement>(`.${SORT_BUTTON_CLASS}`),
];

const bodyRowsOf = (table: HTMLTableElement) => [...table.tBodies[0].rows];

/** ★ RENDERED, not merely un-`hidden`. This is the reading the whole browser half exists for. */
const isPainted = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};
const paintedRowsOf = (table: HTMLTableElement) => bodyRowsOf(table).filter(isPainted);
const paintedText = (table: HTMLTableElement, index: number) =>
  paintedRowsOf(table).map((row) => (row.cells[index]?.textContent ?? '').trim());

/** Type into the filter the way a reader does — a real focus and real key presses. */
async function typeInto(table: HTMLTableElement, text: string): Promise<void> {
  fieldOf(table).focus();
  await userEvent.keyboard(text);
}

/**
 * A REAL trusted click, then the copy's own settle.
 *
 * Playwright's real mouse carries the user activation both engines require of an async clipboard
 * write; a dispatched `click()` would not, which is the difference between this file and the
 * stubbed unit suite. The settle is the status region acquiring text, because the write is a
 * promise and `userEvent.click` returns long before it resolves.
 */
async function clickAndSettle(
  table: HTMLTableElement,
  button: HTMLButtonElement,
): Promise<string> {
  statusOf(table).textContent = '';
  await userEvent.click(button);
  return waitFor(() => statusOf(table).textContent || null);
}

const COPIED_CSV = 'Copied 2 rows as CSV.';
const COPY_FAILED = 'Copy unavailable. The table is unchanged.';

/** The CSV the SCREEN implies once the table below has been sorted and filtered. */
const EXPECTED_CSV = 'dept,who,n\r\neng,adam,9\r\neng,zoe,10';

/**
 * Sort by `n` ascending and filter to `eng`, then assert the screen really disagrees with the
 * document — the fixture step every F22 case depends on, kept in one place so no case can quietly
 * assert F22 against a table where document order and screen order happen to agree.
 */
async function sortAndFilter(table: HTMLTableElement): Promise<void> {
  await userEvent.click(sortButtonsIn(table)[2]);
  await typeInto(table, 'eng');
  expect(paintedText(table, 1), 'the fixture must really be sorted AND filtered').toEqual([
    'adam',
    'zoe',
  ]);
  expect(
    bodyRowsOf(table).map((r) => (r.cells[1]?.textContent ?? '').trim()),
    'and the DOM order must differ from the document order',
  ).toEqual(['bo', 'adam', 'zoe']);
}

// ── The engines' clipboard consent (`diagramActions.browser.test.ts:890-928`'s shape) ─────────

/**
 * The engine's OWN answer about clipboard-write consent — the seam the two engines differ on.
 *
 * Gecko rejects the descriptor outright (`clipboard-write` is not a `PermissionName` there), which
 * is not an error to route around: it IS the finding, and it is what the cases below branch on.
 * Branching on a capability rather than on `navigator.userAgent` keeps the case honest about WHY
 * the engines diverge instead of merely noting THAT they do.
 */
async function clipboardWriteConsent(): Promise<PermissionState | 'unsupported'> {
  try {
    const status = await navigator.permissions.query({
      name: 'clipboard-write' as PermissionName,
    });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

let grantedContextId: string | undefined;
let consentGranted = false;

/**
 * Grant the BROWSER-CONTEXT clipboard consent — Chromium only, over CDP.
 *
 * ★ THIS IS A USER CONSENT, NOT A MANIFEST PERMISSION, and the distinction is the whole of D-10.
 * `Browser.grantPermissions` needs the `browserContextId` because a Playwright page lives in a
 * non-default context. Nothing is rebuilt and nothing is re-manifested — only the browser's
 * consent moves.
 *
 * ★ AND THE CONTEXT ID IS KEPT, BECAUSE THE RESET NEEDS IT TOO — MEASURED. A
 * `Browser.resetPermissions` sent with no `browserContextId` clears the DEFAULT context and leaves
 * this one granted, and the browser window is shared across every file in the run: the leak
 * surfaced as `diagramActions.browser.test.ts`'s own consent ablation reading `granted` where it
 * pins `prompt`. Its OFF arm is another file's property, so this file cleans up by id.
 */
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

// ── Lifecycle ─────────────────────────────────────────────────────────────────────────────────

function reset(): void {
  // 4.2's content-script arms leave a `peekover-root` and a hide <style> behind. The host is a
  // body child and goes with `replaceChildren` below; the <style> lives under `documentElement`
  // and does not, so it is dropped by name — a surviving `body > :not(peekover-root){display:none}`
  // would hide the NEXT case's app-page container and read as a paint failure.
  removeHideStyle();
  resetDocIdentityForTest();
  resetWatchRegistryForTest();
  resetWatchControlsForTest();
  resetThemeHostsForTest();
  resetThemeControlsForTest();
  resetDiffRegistryForTest();
  for (const c of containers.splice(0)) c.remove();
  document.body.replaceChildren();
}

/**
 * ★ THE CONSENT FLOOR THIS FILE ESTABLISHES FOR ITSELF, AND THE MEASURED REASON IT HAS TO.
 *
 * The browser window is shared across every file in the run, and `diagramActions.browser.test.ts`
 * — which runs earlier — grants the same consent WITH a `browserContextId` and resets it WITHOUT
 * one. `Browser.resetPermissions` sent with no id clears the DEFAULT context, so that grant
 * outlives its file and arrives here as `granted`. Measured: this file's OFF arm, which PINS
 * `prompt`, red with `expected 'granted' to be 'prompt'` — the pin doing exactly its job.
 *
 * That sibling's cleanup is outside this task's fence, so the answer is not to reach into it: this
 * file resets the consent on ITS OWN context before every case, and therefore starts from a state
 * it established rather than one it inherited. Carried as a finding.
 */
beforeEach(async () => {
  reset();
  if ((await clipboardWriteConsent()) === 'unsupported') return; // Gecko has nothing to reset
  const info = (await cdp().send('Target.getTargetInfo', {} as never)) as {
    targetInfo?: { browserContextId?: string };
  };
  await cdp().send('Browser.resetPermissions', {
    browserContextId: info?.targetInfo?.browserContextId,
  } as never);
});

afterEach(async () => {
  reset();
  // Leave the browser context as this file found it. Guarded by the flag rather than an engine
  // sniff, because `cdp()` is Chromium-only.
  if (!consentGranted) return;
  consentGranted = false;
  await cdp().send('Browser.resetPermissions', {
    browserContextId: grantedContextId,
  } as never);
  // The instrument for the cleanup itself: if the consent survived, say so HERE rather than in
  // whichever file happens to run next and pin `prompt`.
  expect(await clipboardWriteConsent(), 'the granted consent outlived this file').toBe('prompt');
});

// ══ GATE-2 RULING Q2 — TWO BUTTONS, ON THE SCREEN, AND NO OVERLAY ═════════════════════════════

describe('3.8 · ★ gate-2 Q2 — two painted buttons in the strip, no menu and no focus trap', () => {
  it('both are in the toolbar, both are painted, and there are exactly two', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];

    // The firing control: the document really rendered a table.
    expect(tablesIn(host), 'the fixture must actually render a table').toHaveLength(1);

    const bar = toolbarOf(table);
    expect(bar.classList.contains(TABLE_TOOLBAR_CLASS)).toBe(true);
    expect(copyButtonsIn(table)).toHaveLength(2);
    expect(bar.contains(csvButtonOf(table))).toBe(true);
    expect(bar.contains(markdownButtonOf(table))).toBe(true);
    expect(isPainted(csvButtonOf(table)), 'the CSV button is not on screen').toBe(true);
    expect(isPainted(markdownButtonOf(table)), 'the Markdown button is not on screen').toBe(true);
  });

  it('★ the two buttons stay INSIDE the toolbar strip`s own box', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];
    const strip = toolbarOf(table).getBoundingClientRect();

    // 3.5 measured an EMPTY strip contained within the column; `tablePlacement.browser.test.ts` is
    // where that measurement lives and it still runs. This is the narrower claim the two new
    // controls put at risk: the strip's own children do not spill out of the strip.
    for (const button of copyButtonsIn(table)) {
      const rect = button.getBoundingClientRect();
      expect(rect.left, `${button.className} spills left`).toBeGreaterThanOrEqual(strip.left - 0.5);
      expect(rect.right, `${button.className} spills right`).toBeLessThanOrEqual(strip.right + 0.5);
      expect(rect.top, `${button.className} spills above`).toBeGreaterThanOrEqual(strip.top - 0.5);
      expect(rect.bottom, `${button.className} spills below`).toBeLessThanOrEqual(
        strip.bottom + 0.5,
      );
    }
  });

  it('★ NO overlay of any kind — rows 9 and 21 stay inactive, in a real engine', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];
    const shadow = host.shadowRoot!;

    await userEvent.click(csvButtonOf(table));
    await sleep(50);

    // A menu version needs at least one of these, and a click is exactly when it would appear.
    expect(shadow.querySelectorAll('[aria-haspopup]')).toHaveLength(0);
    expect(shadow.querySelectorAll('[role="menu"], [role="menuitem"], [role="dialog"]')).toHaveLength(
      0,
    );
    expect(shadow.querySelectorAll('dialog')).toHaveLength(0);
    // ★ AND NO FOCUS TRAP: focus is exactly where the reader's click put it, which is the property
    // row 21 would otherwise be asserting the presence of.
    expect(shadow.activeElement, 'focus moved — a menu or a trap took it').toBe(csvButtonOf(table));
  });
});

// ══ ROW 16 — A REAL TAB STOP AND A REAL ACTIVATION ════════════════════════════════════════════

describe('3.8 · ★ row 16 — the copy is reachable by keyboard, with no tabindex of its own', () => {
  it('★ TAB walks field → clear → CSV → Markdown, in the engine`s own order', async () => {
    const host = await openDoc(COPY_DOC);
    const shadow = host.shadowRoot!;
    const table = tablesIn(host)[0];

    fieldOf(table).focus();
    await userEvent.tab();
    expect(shadow.activeElement, 'tab did not reach the clear control').toBe(clearOf(table));
    await userEvent.tab();
    // RED-FIRST target: a non-button control takes no tab stop at all, and one made focusable with
    // a `tabindex` hack sits outside the natural order. Both stop here.
    expect(shadow.activeElement, 'tab did not reach the CSV button').toBe(csvButtonOf(table));
    await userEvent.tab();
    expect(shadow.activeElement, 'tab did not reach the Markdown button').toBe(
      markdownButtonOf(table),
    );

    for (const button of copyButtonsIn(table)) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.hasAttribute('tabindex'), 'no tabindex of its own').toBe(false);
    }
  });

  it('★ ENTER and SPACE activate the copy, with no key handling of ours', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];

    csvButtonOf(table).focus();
    await userEvent.keyboard('{Enter}');
    // The OUTCOME rather than the format: what a key press proves here is that the handler RAN,
    // and both the confirmation and the stated failure are that. Which of the two arrives is the
    // engine's consent, and that is the next section's whole subject.
    const onEnter = await waitFor(() => statusOf(table).textContent || null);
    expect([`Copied 3 rows as CSV.`, COPY_FAILED]).toContain(onEnter);

    statusOf(table).textContent = '';
    markdownButtonOf(table).focus();
    await userEvent.keyboard(' ');
    const onSpace = await waitFor(() => statusOf(table).textContent || null);
    expect([`Copied 3 rows as Markdown.`, COPY_FAILED]).toContain(onSpace);
  });
});

// ══ ★ D-10 — THE REAL CLIPBOARD, AND F22 THROUGH IT ══════════════════════════════════════════

describe('3.8 · ★ D-10 / F22 — a real gesture writes the SHOWN rows to the REAL clipboard', () => {
  it('is talking to the browser`s own clipboard — no own property, writeText is [native code]', () => {
    // HARNESS SANITY. Without it every assertion in this section could be passing against a
    // recorder some other file left behind, and the section would prove the opposite of its name.
    expect(Object.getOwnPropertyDescriptor(navigator, 'clipboard')).toBeUndefined();
    expect(typeof navigator.clipboard?.writeText).toBe('function');
    expect(String(navigator.clipboard.writeText)).toContain('[native code]');
  });

  it('★ what gates the write is a browser CONSENT, not the manifest — and §3.8 degrades', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];
    await sortAndFilter(table);

    const consent = await clipboardWriteConsent();
    let settled: string;

    if (consent === 'unsupported') {
      // ── FIREFOX ──────────────────────────────────────────────────────────────────────────────
      // Gecko has no `clipboard-write` permission to ask for or to grant. The gesture IS the whole
      // gate, so this is D-10 in its strongest form: a real trusted click, the engine's real
      // clipboard, and nothing granted to anybody.
      settled = await clickAndSettle(table, csvButtonOf(table));
    } else {
      // ── CHROMIUM: THE A-B ABLATION, WHOSE OFF ARM IS §3.8's DEGRADATION ──────────────────────
      // Blink gates the write on the Permissions-API consent, and a Playwright browser context
      // leaves that at `prompt` (a headless window is never the OS-focused active tab real Chrome
      // auto-grants). The two arms run THE SAME BUILD, THE SAME BUTTON and THE SAME BYTES, and
      // move exactly one variable: the browser's user consent.
      //
      // The OFF arm is PINNED, not conditional: an ablation whose off arm can quietly not run is
      // no ablation at all. If Playwright ever starts auto-granting, this reds and says so.
      expect(
        consent,
        'the context no longer starts at `prompt` — the OFF arm is void and this case needs ' +
          're-deriving, not relaxing',
      ).toBe('prompt');
      expect(
        await clickAndSettle(table, csvButtonOf(table)),
        'Blink accepted the write at consent `prompt` — the OFF arm did not fire',
      ).toBe(COPY_FAILED);
      // ★ §3.8 IN ITS OWN WORDS, AGAINST A REAL `NotAllowedError`: a stated failure BESIDE A
      // STILL-READABLE TABLE, never a broken button. The rejection did not escape the handler,
      // the rows are still painted, and the filter's own count is untouched.
      expect(paintedText(table, 1)).toEqual(['adam', 'zoe']);
      expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');
      expect(isPainted(csvButtonOf(table))).toBe(true);

      await grantClipboardConsent();
      expect(await clipboardWriteConsent()).toBe('granted');
      settled = await clickAndSettle(table, csvButtonOf(table));
    }

    // ★ F22 THROUGH THE REAL CLIPBOARD, AND ASSERTED BEFORE THE CONFIRMATION IS. Read back from
    // the engine, not from a recorder: the bytes that actually landed are the rows the reader can
    // SEE, in the order they are shown. A copy reading the source, or `documentOrder`, puts three
    // rows here in the other order.
    //
    // ★ THE ORDER OF THESE TWO CLAUSES IS DELIBERATE. Measured: with the copy ablated to ignore
    // the filter, the confirmation reads *"Copied 3 rows"* and reds FIRST — so the clipboard
    // readback, which is the clause that actually inspects the copied bytes, never ran. The check
    // that finds the defect has to be the one seen to fail, so the bytes go first.
    expect(await navigator.clipboard.readText()).toBe(EXPECTED_CSV);
    expect(
      settled,
      'the real write did not resolve — if this is a NotAllowedError with consent granted then a ' +
        'manifest permission IS required, which is an AGENTS.md #4 event and a hard stop',
    ).toBe(COPIED_CSV);
  });

  it('★ the same table as MARKDOWN — the same set, the same order, through the real clipboard', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];
    await sortAndFilter(table);

    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

    const settled = await clickAndSettle(table, markdownButtonOf(table));

    // ★ MEASURED HERE, AND THE REASON THIS COMPARISON NORMALIZES: the WINDOWS CLIPBOARD stores
    // `CF_UNICODETEXT` with CRLF terminators, and Blink applies that normalization on the way
    // through — a markdown table written with `\n` reads back with `\r\n`, while Gecko returns it
    // unchanged. That is the CLIPBOARD's transformation, not the serializer's, and asserting it
    // byte-for-byte here would pin an OS behaviour under a test named for a table. The
    // serializer's exact bytes are pinned in `tableTools.test.ts`, which is where they belong; what
    // this case is for is the SET and the ORDER surviving a real round trip.
    // The BYTES first, the confirmation second — same reason as the case above.
    const readBack = (await navigator.clipboard.readText()).replace(/\r\n/g, '\n');
    expect(readBack).toBe(
      ['| dept | who | n |', '| --- | --- | --- |', '| eng | adam | 9 |', '| eng | zoe | 10 |'].join(
        '\n',
      ),
    );
    expect(settled).toBe('Copied 2 rows as Markdown.');
  });

  it('★ the confirmation is PAINTED, and the region is out of the a11y tree while silent', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];

    // Row 20 / F13's property, one control over: `hidden` rather than merely empty.
    expect(statusOf(table).getAttribute('role')).toBe('status');
    expect(statusOf(table).hidden, 'a silent region stays OUT of the tree').toBe(true);
    expect(isPainted(statusOf(table)), 'a hidden region has no box').toBe(false);

    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();
    await clickAndSettle(table, csvButtonOf(table));

    // ★ ON THE SCREEN. §5's "state in text" is a claim about what a sighted reader can SEE, and a
    // `width:0` span passes every `textContent` assertion ever written.
    expect(statusOf(table).hidden).toBe(false);
    expect(isPainted(statusOf(table)), 'the confirmation is not painted').toBe(true);
    expect(statusOf(table).textContent).toBe('Copied 3 rows as CSV.');
  });
});

// ══ ★ D-10 — `permissions: []` RE-PROVEN ON THE BUILT MANIFESTS, AFTER A COPY HAS RUN ════════
//
// ★ WHY THE CONJUNCTION IS THE PROOF AND EITHER HALF ALONE IS NOT. `permissions: []` read on its
// own proves nothing: it has been `[]` since 007 and would be `[]` in a build where the copy did
// not exist. What is asserted is an ABSENCE DESPITE EXERCISE — the copy RAN, reached the engine's
// own clipboard, and the shipped manifests still ask for nothing.
//
// ★ READ FROM `.output/`, NOT FROM `wxt.config.ts`. `tests/manifest.test.ts` guards the SOURCE
// deliberately, because CI runs the unit project before any build. That leaves the GENERATED
// artifact unguarded, which is the whole point of an empirical re-proof: whether the BUILD added a
// key nobody authored. `pnpm test:browser` runs BEFORE `pnpm build` in ci.yml and Firefox is never
// built there, so this case SKIPS by name in the reporter when `.output/` is absent — visibly,
// never silently green — and runs on every machine that has built both engines.

const BUILT_MANIFESTS = import.meta.glob('/.output/*/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>;

/** Every manifest key that would represent a capability this task claims not to need. */
const CAPABILITY_KEYS = ['host_permissions', 'web_accessible_resources', 'webRequest'] as const;

/**
 * The ONE check, run against the real artifacts AND against a deliberately malformed fixture.
 *
 * Returns a list rather than asserting, so the same code path can be required to be EMPTY for a
 * shipped manifest and NON-EMPTY for a control. A checker that only ever runs on good input is
 * indistinguishable from a checker that returns `[]` unconditionally.
 */
function capabilityViolations(manifest: Record<string, unknown>): string[] {
  const found: string[] = [];
  const perms = manifest.permissions;
  if (!Array.isArray(perms)) found.push('permissions is missing or not an array');
  else if (perms.length > 0) found.push(`permissions requests: ${perms.join(', ')}`);
  for (const key of CAPABILITY_KEYS) {
    if (manifest[key] !== undefined) found.push(`forbidden key present: ${key}`);
  }
  return found;
}

describe('3.8 · ★ D-10 — the clipboard asked the manifest for nothing', () => {
  it('the check FIRES on a manifest that does ask for something', () => {
    // The control, run unconditionally so the assertion below is never vacuous even in CI.
    expect(capabilityViolations({ permissions: ['clipboardWrite'] })).toContain(
      'permissions requests: clipboardWrite',
    );
    expect(capabilityViolations({ permissions: [], web_accessible_resources: [] })).toContain(
      'forbidden key present: web_accessible_resources',
    );
    expect(capabilityViolations({ permissions: [] })).toEqual([]);
  });

  it.skipIf(Object.keys(BUILT_MANIFESTS).length === 0)(
    '★ BOTH built manifests still read `permissions: []` after the copy has run',
    async () => {
      const host = await openDoc(COPY_DOC);
      const table = tablesIn(host)[0];
      if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();

      // EXERCISE FIRST. A copy that silently no-opped would red here, before any manifest is read,
      // which is what makes the absence below an absence DESPITE exercise.
      expect(await clickAndSettle(table, csvButtonOf(table))).toBe('Copied 3 rows as CSV.');

      const engines = Object.keys(BUILT_MANIFESTS).sort();
      expect(engines, 'both engines must have been built for this re-proof').toEqual([
        '/.output/chrome-mv3/manifest.json',
        '/.output/firefox-mv3/manifest.json',
      ]);
      for (const engine of engines) {
        expect(capabilityViolations(BUILT_MANIFESTS[engine]), engine).toEqual([]);
      }
    },
  );
});

// ══════════════════════════════════════════════════════════════════════════════════════════════
// TASK 4.2 — D-10's `file://` RESIDUAL, MEASURED IN A REAL `file://` DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ── THE QUESTION, AND WHY IT WAS LEFT OPEN UNTIL NOW ─────────────────────────────────────────
//
// Everything above runs on the APP PAGE, at the runner's own `http://localhost` origin. The
// content script does not: it runs in the PAGE's context, and one of its two document classes is
// `file://`. `navigator.clipboard` is only available in a SECURE CONTEXT, and MDN's own wording on
// `file://` is hedged — *"The same is generally true for `file://` URLs"* (Secure Contexts).
// **"Generally" is not a contract.** So whether the copy works at all on the content script's
// `file://` class was an EMPIRICAL question, and 4.1 deliberately declined to answer it from this
// surface: asserting on the runner's `http://` origin would have ratified the WRONG secure context.
//
// ── MEASURE, DO NOT CHOOSE ───────────────────────────────────────────────────────────────────
//
// Nothing below decides what `file://` ought to do. It reports what a real engine does in a real
// `file://` document and asserts THAT — the same discipline 3.5 applied to `max-width: none` and
// 3.9 to `aria-sort: none`. Both answers were acceptable going in: available, or unavailable and
// degrading to §3.8's stated failure. The measured answer is recorded in the case names.
//
// ── HOW A REAL `file://` DOCUMENT IS REACHED, AND WHY A SIMULATION WOULD BE WORTHLESS ────────
//
// This test runs IN the page, and BOTH engines refuse to navigate web content to a `file://` URL
// (this repo already carries the finding: watchContentWiring.browser.test.ts:24). An iframe is
// blocked identically. So there is no in-page route, and the one thing that must NOT be done is
// simulate it — stubbing `isSecureContext` or faking the origin would prove exactly nothing about
// the surface in question, which is the whole reason the residual was named rather than argued.
//
// The driver can navigate there, so the measurement is taken through `probeFileUrlClipboard`
// (`vitest.config.ts`), the same server-side Playwright seam `emulateColorScheme` already uses and
// the only CROSS-ENGINE one — `cdp()` is Chromium-only and would have to navigate this very page.
// The command writes a real `.md` file, opens it in a FRESH browser context, and clicks a real
// button in it. The fixture is a raw `.md` file rather than an `.html` one because that IS the
// content-script document class.
//
// ── THE OTHER DOCUMENT CLASS, AND AN HONEST LIMIT ON IT ──────────────────────────────────────
//
// §7 names two: `file://` and the allowlisted raw hosts (`https://raw.githubusercontent.com/*`,
// `entrypoints/peekover.content.ts:35`). The `https://` class is measured HERE, at the runner's own
// `http://localhost` origin — and the limit is stated rather than glossed: localhost and `https://`
// are the same class for the ONE property under test, both being potentially-trustworthy origins
// by the same spec rule, and this suite will not reach an actual raw host because that would be a
// network call (AGENTS.md #1). What is measured on that class is its secure-context status and its
// clipboard, which is what the residual asks about.

interface ClipboardWriteOutcome {
  outcome: string;
  errorName: string | null;
  readBack: string | null;
}

interface FileUrlClipboardProbe {
  url: string;
  origin: string;
  isSecureContext: boolean;
  hasClipboard: boolean;
  writeTextType: string;
  preCount: number;
  sourceStart: string;
  noConsent: ClipboardWriteOutcome;
  withConsent: ClipboardWriteOutcome & { grant: 'granted' | 'unsupported' };
}

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    probeFileUrlClipboard(): Promise<FileUrlClipboardProbe>;
  }
}

/** The `file://` measurement is one navigation per arm; taken ONCE and read by every case. */
let fileProbe: FileUrlClipboardProbe;

describe('4.2 · ★ D-10 — the `file://` residual, MEASURED (it IS a secure context, on both engines)', () => {
  beforeEach(async () => {
    fileProbe ??= await commands.probeFileUrlClipboard();
  });

  it('★ the harness really landed on a raw `.md` `file://` document — the content-script document class', async () => {
    // THE HARNESS CONTROL, and it comes first because every reading below is worthless without it.
    // A probe that silently landed on an error page, a download shim or `about:blank` would report
    // a perfectly plausible `isSecureContext` for a document that is not the one under test. The
    // `<pre>` count and the document's own first bytes are what tie the measurement to OUR file —
    // and `preCount: 1` is independently the shape `readPageSource()` reads (`mountReader.ts:41`).
    expect({
      scheme: fileProbe.url.slice(0, 8),
      endsWithOurFile: fileProbe.url.endsWith('/report.md'),
      preCount: fileProbe.preCount,
      sourceStart: fileProbe.sourceStart,
    }).toEqual({
      scheme: 'file:///',
      endsWithOurFile: true,
      preCount: 1,
      sourceStart: '# Report',
    });
  });

  it('★ MDN`s hedge resolves to YES: `file://` IS a secure context and DOES carry the clipboard — and so does the raw-host class', async () => {
    // ★ THE RESIDUAL'S ANSWER, ON BOTH DOCUMENT CLASSES, IN ONE INSTRUMENT. The second half is the
    // runner's own origin, read in-page — the unambiguous class, carried so the `file://` reading
    // is a comparison rather than an isolated number.
    expect({
      fileUrl: {
        isSecureContext: fileProbe.isSecureContext,
        hasClipboard: fileProbe.hasClipboard,
        writeTextType: fileProbe.writeTextType,
      },
      secureHostClass: {
        isSecureContext: window.isSecureContext,
        hasClipboard: 'clipboard' in navigator,
        writeTextType: typeof navigator.clipboard?.writeText,
      },
    }).toEqual({
      fileUrl: { isSecureContext: true, hasClipboard: true, writeTextType: 'function' },
      secureHostClass: { isSecureContext: true, hasClipboard: true, writeTextType: 'function' },
    });
  });

  it('★ the ORIGIN is not the discriminator — `file://` is gated by exactly what the secure host is gated by', async () => {
    // ★ THE FINDING THIS CASE EXISTS FOR, and it is the one that actually retires the residual.
    // What differs between the engines is the GATE, not the scheme: Gecko has no `clipboard-write`
    // PermissionName at all and writes on the gesture alone, while Blink consults the Permissions
    // API and a Playwright context leaves that at `prompt`. Measured on `file://`, that is the
    // SAME A-B the section above pins at the runner's origin — so `file://` introduces no new
    // behaviour and no new failure mode for the copy to have to handle.
    //
    // Branching on the CAPABILITY rather than on `navigator.userAgent` keeps the case honest about
    // WHY the engines diverge instead of merely noting THAT they do (3.8's shape).
    const consent = await clipboardWriteConsent();

    if (consent === 'unsupported') {
      // ── FIREFOX: the gesture IS the whole gate, on `file://` exactly as on the secure host ──
      expect({
        grantIsOffered: fileProbe.withConsent.grant,
        noConsent: {
          outcome: fileProbe.noConsent.outcome,
          readBack: fileProbe.noConsent.readBack,
        },
      }).toEqual({
        grantIsOffered: 'unsupported',
        noConsent: { outcome: 'resolved', readBack: 'PEEKOVER-FILE-PROBE' },
      });
      return;
    }

    // ── CHROMIUM: the A-B ablation, on `file://`. Same document, same button, same bytes; the
    // ONE variable is the browser's user consent — never a manifest key (D-10's whole point).
    // The OFF arm is PINNED, not conditional: an ablation whose off arm can quietly not run is no
    // ablation at all.
    expect(consent, 'the runner context no longer starts at `prompt` — the OFF arm is void').toBe(
      'prompt',
    );
    expect({
      offArm: {
        errorName: fileProbe.noConsent.errorName,
        readBack: fileProbe.noConsent.readBack,
      },
      onArm: {
        grant: fileProbe.withConsent.grant,
        outcome: fileProbe.withConsent.outcome,
        readBack: fileProbe.withConsent.readBack,
      },
    }).toEqual({
      // The refusal is a permission decision, NOT an absent clipboard: `NotAllowedError` is what a
      // gated write throws, and `TypeError` is what an insecure context would have produced one
      // line earlier. Which one it is decides whether §3.8's degradation is even the right path.
      offArm: { errorName: 'NotAllowedError', readBack: null },
      onArm: { grant: 'granted', outcome: 'resolved', readBack: 'PEEKOVER-FILE-PROBE' },
    });
  });
});

// ══ ★ THE COPY ON THE CONTENT-SCRIPT SURFACE — F26's DEGRADATION, WHATEVER THE ANSWER ════════
//
// 4.1 routed this here rather than asserting it on its own surface, and the measurement above is
// what unblocks it: `file://` and the runner's origin are now KNOWN to be the same secure-context
// class, gated by the same consent, failing with the same `NotAllowedError`. So driving the real
// content-script copy at this origin is no longer ratifying the wrong secure context — it is
// exercising the one failure mode `file://` was measured to produce.
//
// ★ AND THE CLAIM HOLDS EITHER WAY, WHICH IS WHY IT IS ONE CASE AND NOT TWO. Whatever the engine's
// consent gives — a confirmation on Gecko, §3.8's stated failure on Blink — the table stays
// READABLE, the button stays a button, and NOTHING THROWS (D-7). That conjunction is the property;
// which branch supplies it is the engine's business.

/** The content script's own document, driven through `runReader`'s real orchestration. */
async function openContentScriptDoc(doc: string): Promise<HTMLElement> {
  const pre = document.createElement('pre');
  pre.textContent = doc;
  document.body.appendChild(pre);
  runReader({ isRenderable: () => true });
  const host = document.querySelector<HTMLElement>('peekover-root')!;
  await waitFor(() => host.shadowRoot?.querySelector('.peekover-reader h1'));
  return host;
}

describe('4.2 · ★ the content-script copy degrades gracefully whatever the clipboard answers (§3.8 F26, D-7)', () => {
  it('★ the click never throws, the status SAYS what happened, and the table is still readable', async () => {
    const host = await openContentScriptDoc(COPY_DOC);
    const table = tablesIn(host)[0];

    // The firing control: the content script really rendered a table AND really got the copy
    // controls. Without it, "the table is still readable" is a claim about a surface that never
    // enhanced, and the degradation below would be unfalsifiable.
    expect(tablesIn(host), 'the content script must actually render a table').toHaveLength(1);
    expect(copyButtonsIn(table), 'and D-6 site 3 must have reached the copy').toHaveLength(2);

    const consent = await clipboardWriteConsent();

    // ★ NO THROW — asserted as a RESOLVED click rather than inferred from a green run. A rejection
    // escaping the handler surfaces as an unhandled rejection, which does not fail the case that
    // caused it; the status region acquiring text is the observable that the handler ran to its
    // own end. `clickAndSettle` times out rather than hanging if it never does.
    const settled = await clickAndSettle(table, csvButtonOf(table));

    // ★ ONE INSTRUMENT: what the reader was told, AND that the table survived being told it. A
    // ladder would let the status assertion pass while the table lay in pieces below it.
    expect({
      settled,
      // §3.8's exact words on the failure branch; the confirmation on the success branch. The
      // engine's consent decides which — measure-not-choose, one case for both.
      isAStatedOutcome: settled === COPY_FAILED || settled === 'Copied 3 rows as CSV.',
      // NEVER A BROKEN BUTTON (§3.8): still a button, still painted, still enabled.
      button: {
        tag: csvButtonOf(table).tagName,
        painted: isPainted(csvButtonOf(table)),
        disabled: csvButtonOf(table).disabled,
      },
      // STILL A READABLE TABLE — and READABLE means the cells are on screen with their text, not
      // merely that three `<tr>`s survive in the DOM. (The filter's count region is empty here
      // because nothing is filtered; that is measured, not assumed — `filterCountText` only speaks
      // once a query narrows the set, and asserting a "Showing 3 of 3" that the product never
      // writes would have been the test inventing a string for itself.)
      table: {
        paintedRowText: paintedText(table, 1),
        countWhileUnfiltered: countOf(table).textContent,
        hostConnected: host.isConnected,
      },
    }).toEqual({
      settled,
      isAStatedOutcome: true,
      button: { tag: 'BUTTON', painted: true, disabled: false },
      table: {
        paintedRowText: ['zoe', 'adam', 'bo'],
        countWhileUnfiltered: '',
        hostConnected: true,
      },
    });

    // ★ AND ON THE ENGINE THAT REFUSES, THE BRANCH IS PINNED rather than left to the disjunction
    // above — otherwise a Blink run that silently started succeeding would still read green and
    // §3.8's degradation would never actually be exercised on this surface again.
    if (consent === 'prompt') expect(settled).toBe(COPY_FAILED);
  });
});

// ══ THE COMPOSITION — 3.6 AND 3.7 STILL WORK WITH THE COPY BESIDE THEM ═══════════════════════

describe('3.8 · the sort and the filter still work, with two more controls in the strip', () => {
  it('sorting, filtering and clearing all behave exactly as 3.6 and 3.7 left them', async () => {
    const host = await openDoc(COPY_DOC);
    const table = tablesIn(host)[0];

    await userEvent.click(sortButtonsIn(table)[0]);
    expect(paintedText(table, 1), '3.6`s stability, still stable').toEqual(['zoe', 'adam', 'bo']);

    await typeInto(table, 'eng');
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam']);
    expect(countOf(table).textContent).toBe('Showing 2 of 3 rows');

    await userEvent.click(clearOf(table));
    expect(paintedRowsOf(table), 'the clear must restore every row').toHaveLength(3);

    // F23 still holds: the sort's order survives the round trip through the filter.
    expect(paintedText(table, 1)).toEqual(['zoe', 'adam', 'bo']);
  });
});
