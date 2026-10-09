// The ZERO-NETWORK GUARD across EVERY export/copy/print action in this milestone, in ONE test
// (task 9.2, §3.11 row 12), real engine (Chromium AND Firefox). §3.11 row 12's own reconciliation
// note (`docs/ai/progress.md`) is unambiguous that a missed request in any one of these paths would
// change group 10's own headroom numbers — so this is one run across all five actions, not five.
//
// ══ THE CLAIM, AND WHY IT IS ONLY WORTH WHAT ITS CONTROL IS WORTH ═══════════════════════════════
//
// Every action below (HTML export, the three copy rows, PDF export) builds a string or writes a
// blob/clipboard payload from an ALREADY-SANITIZED, already-neutralized clone
// (`htmlExport.ts`'s own module doc comment: `cloneNode`, never a re-parse). None of it *should*
// reach the network. "No request" has two readings — the action is quiet, or the buffer is blind —
// and only a control that FIRES tells them apart (`agentBadgeNetwork.browser.test.ts`'s own finding
// 1, reused). So the probe is armed, shown to fire, in this test's own body, before any action is
// measured against it.
//
// ══ REAL ENGINE OR NOTHING ═══════════════════════════════════════════════════════════════════════
//
// jsdom loads no subresources, so a jsdom "no fetchable node" reading is a DOM-SHAPE proxy, not a
// bytes-on-wire proof (the M1 leak stayed green through exactly that shape). This file asserts on
// the engine's own Resource Timing buffer, `remoteMedia.browser.test.ts`'s discipline; the
// `/^https?:/i` predicate is that suite's verbatim, and `awaitProbeUrls` is `awaitFetchedUrls`'s
// shape for the same stated reason: you can WAIT for a request that should arrive, and cannot wait
// for one that should never come.
//
// ══ ★ ONE CONTROL, NOT TWO — plan.md's own text, not `agentBadgeNetwork`'s shape ═══════════════
//
// `agentBadgeNetwork.browser.test.ts` arms BOTH a bare-`fetch()` lane and a subresource lane,
// because the module under test there (`isAgentFile`/`buildAgentBadge`) is generic enough that
// either lane is a plausible leak vector. THIS task's own plan entry (plan.md §3.11 row 12) already
// named its control, singular: *"the control fetch case being D-8's own live mechanism ... the
// natural positive control to borrow rather than construct fresh."* `tasks.md`'s own §9.2 body
// repeats it the same way — "the positive control" (singular), never a second lane. That is not an
// omission to patch here: none of the five actions under test ever calls `fetch`/`XMLHttpRequest`
// (grep-confirmed — `htmlExport.ts`, `copyPlainText.ts`, `exportControls.ts`, and `appShell.ts`'s
// five export-dispatch functions contain no such call), so a bare-fetch control would prove the
// observer sees a request class none of this code can ever emit. The one lane these actions COULD
// plausibly open is the subresource lane: adopting the reader's own (already-neutralized) clone
// into a document with a browsing context. `restoreBlockedImages` (`mediaPolicy.ts:166`, the exact
// function `remoteMediaUi.ts:77`'s restore-button click handler calls) is that lane's own
// already-wired, already-proven mechanism — borrowed here whole, per plan.md's text, and never
// routed through any of THIS milestone's own code.
//
// ══ THE INERT `<template>`, PER THE STANDING FIREFOX `@import` LESSON ═══════════════════════════
//
// The probe placeholder is parsed into a `<template>`'s `.content` first — never a detached `div`,
// which IS owned by the live document and would leak the moment a real `<img>` replaced it
// (`mediaPolicy.ts`'s own module doc comment names this exact class of bug). It is then imported
// into a live, attached container — `restoreBlockedImages`'s real call shape
// (`remoteMediaUi.ts:74-80` calls it on an attached shadow root) — where building the real `<img>`
// fires the fetch. That fire is the whole control; this file does not re-derive the
// inert-vs-live CONTRAST itself (already proven at `remoteMedia.browser.test.ts` and
// `agentBadgeNetwork.browser.test.ts`) — 9.2's job is to prove the borrowed control is LIVE here,
// not to re-litigate `mediaPolicy.ts`'s own inert-safety.
//
// ══ WHAT IS MEASURED — all five actions, driven through the REAL export panel ═══════════════════
//
// `exportPanel.browser.test.ts`/`exportDegrade.browser.test.ts`'s own harness shape, copied (not
// imported — a test module has its own lifecycle): open the app, select a file, open the export
// panel, click each real row. HTML export and PDF export use a plain `.click()` (no clipboard
// permission needed for either); the three copy rows use `userEvent.click()` for real transient
// activation, gated on `exportDegrade.browser.test.ts`'s own CDP consent-grant shape. PDF's
// `window.print()` is stubbed (`pdfExport.browser.test.ts`'s own `vi.spyOn` shape) — a REAL
// `window.print()` opens a modal print dialog that would hang the runner; the assertion this file
// makes is therefore precisely *"Peekover's own path TO `window.print()` (the panel row →
// `exportPdf()` → the call) fires zero requests,"* never a claim about the browser's own print-
// pipeline internals, which never run here (they are stubbed) and which the page's own Resource
// Timing buffer could not see regardless.
//
// Every action gets its own labeled zero-check immediately after it runs (never batched ahead of
// the instrument, per the standing "the check that found the defect must be the one seen to fail"
// lesson), then one cumulative check over the whole unclearedsince-arm buffer, then the control is
// fired again to prove the observer stayed live through the entire run.

import { describe, it, expect, afterEach, vi } from 'vitest';
// 5.8: read the zero only after a later request has landed (helpers/diagramWindow.ts).
import { isSentinel, wireSettled } from './helpers/diagramWindow';
import { userEvent, commands, cdp } from 'vitest/browser';
import { mountAppShell, type AppStore } from '../../src/app/appShell';
import type { FolderSource, MarkdownFile } from '../../src/app/folderSource';
import { restoreBlockedImages, REMOTE_PLACEHOLDER_CLASS } from '../../src/render/mediaPolicy';
import { EXPORT_ROW_STATE_ATTR } from '../../src/app/exportControls';

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

// ── Fixture ───────────────────────────────────────────────────────────────────────────────────
//
// A filename/marker not shared with any sibling export suite. `exportDegrade.browser.test.ts`'s own
// header comment names the hazard: the real OS clipboard is one resource shared across every
// serially-run file in this suite (`fileParallelism:false`), and a generic marker can match a
// sibling's stale leftover clipboard content mid-poll.
const HEADING = 'Zero-network guard fixture';
const MARKER = 'exportnetwork-guard-marker';

function fakeStore(): AppStore {
  return {
    putFolder: async () => undefined,
    deleteFolder: async () => undefined,
    putRecent: async () => undefined,
  };
}

function memorySource(): FolderSource {
  const file: MarkdownFile = {
    path: 'exportnetwork-guard.md',
    name: 'exportnetwork-guard.md',
    read: async () => `# ${HEADING}\n\nBody text, ${MARKER}.\n`,
  };
  return { name: 'docs', truncated: false, persistable: false, files: [file] };
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
const adopted: HTMLElement[] = [];
afterEach(() => {
  for (const c of containers.splice(0)) c.remove();
  for (const el of adopted.splice(0)) el.remove();
});

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

// ── The instrument (`remoteMedia`/`agentBadgeNetwork`'s own shape, verbatim predicate) ──────────

let seq = 0;
const nextToken = (): string => `exportnet-${(seq += 1)}-${Math.trunc(performance.now())}`;

/** ★ THE VERBATIM PREDICATE — every zero-check below is made of this, over the WHOLE buffer, so a
 *  leak to any host, expected or not, lands in it. */
function networkedUrls(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /^https?:/i.test(name) && !isSentinel(name));
}

function probeUrls(token: string): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => name.includes(`/__peekover_export_probe__/${token}/`));
}

function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 60)), 120);
  });
}

const CONTROL_BUDGET_MS = 5000;
async function awaitProbeUrls(token: string, expected: string[]): Promise<string[]> {
  const deadline = performance.now() + CONTROL_BUDGET_MS;
  let seen = probeUrls(token);
  while (!expected.every((u) => seen.includes(u)) && performance.now() < deadline) {
    await new Promise<void>((r) => setTimeout(r, 25));
    seen = probeUrls(token);
  }
  return seen;
}

/** Same-origin, so even a regression hits the vitest dev server (a 404), never the public internet
 *  — but the http(s) scheme still classifies as on-wire exactly as a real CDN URL would. */
function probeUrl(token: string, leaf: string): string {
  return new URL(`/__peekover_export_probe__/${token}/${leaf}`, location.origin).href;
}

/** Flush and assert NOTHING hit the wire. `label` names the action so a failure points at the
 *  exact one, never a later one whose own check would otherwise mask it. */
async function assertNoNetwork(label: string): Promise<void> {
  await flush();
  expect(networkedUrls(), `"${label}" put bytes on the wire`).toEqual([]);
}

/**
 * THE ONE CONTROL — `restoreBlockedImages` (`mediaPolicy.ts:166`), invoked directly, never through
 * any of this milestone's own export code (plan.md §3.11 row 12). Step 1 parses hand-written
 * placeholder markup into an inert `<template>`'s `.content` (never a detached div — the standing
 * Firefox `@import` lesson). Step 2 imports it into a live, attached container — the real call
 * shape `remoteMediaUi.ts:74-80` uses on an attached shadow root — where `restoreBlockedImages`
 * builds a genuine `<img src>` and the fetch fires, proving this run's observer can see a leak
 * through the one lane these five actions could plausibly open.
 */
async function armSubresourceLane(): Promise<void> {
  const token = nextToken();
  const url = probeUrl(token, 'control.png');

  const tpl = document.createElement('template');
  tpl.innerHTML = `<span class="${REMOTE_PLACEHOLDER_CLASS}" data-peekover-src="${url}"></span>`;
  const placeholder = tpl.content.querySelector<HTMLElement>(`.${REMOTE_PLACEHOLDER_CLASS}`);
  expect(
    placeholder?.getAttribute('data-peekover-src'),
    'the probe placeholder did not survive the inert parse — this control would measure nothing',
  ).toBe(url);

  const container = document.createElement('div');
  document.body.appendChild(container); // attached first — restoreBlockedImages' real call shape
  adopted.push(container);
  container.appendChild(document.importNode(tpl.content, true));

  const restored = restoreBlockedImages(container);
  expect(restored, 'restoreBlockedImages did not find the adopted placeholder').toBe(1);
  const img = container.querySelector('img');
  expect(img?.getAttribute('src'), 'restoreBlockedImages did not build a real <img>').toBe(url);

  const seen = await awaitProbeUrls(token, [url]);
  expect(
    seen,
    'CONTROL: restoreBlockedImages must fetch once live — else this probe cannot see a leak',
  ).toContain(url);
  expect(networkedUrls(), 'CONTROL: the verbatim predicate must ALSO see it').toContain(url);
}

/** Arm, then hand back a clean buffer for the measurement. */
async function armTheProbe(): Promise<void> {
  performance.clearResourceTimings();
  await armSubresourceLane();
  for (const el of adopted.splice(0)) el.remove();
  performance.clearResourceTimings();
}

// ── Clipboard consent — `exportDegrade.browser.test.ts`'s own shape, reproduced (module-local,
// second call site, under the rule-of-three `exportControls.ts`'s own doc comment already states
// for its focus trap) ─────────────────────────────────────────────────────────────────────────

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

const COPY_KEYS = ['copy-html', 'copy-plain-text', 'copy-rich-text'] as const;

describe('9.2 — zero network across every export/copy/print action, against an ARMED control', () => {
  it('HTML export, Copy-as-HTML, Copy-as-plain-text, Copy-as-rich-text, PDF export: ZERO requests', async () => {
    // ★ ARM FIRST, IN THIS TEST'S OWN BODY — the control fires here, so every zero below is
    // measured against an instrument just shown to see a request in THIS engine, in THIS run.
    await armTheProbe();

    const { container, toggle } = await mountWithFile();
    const panel = await openPanel(container, toggle);

    // ── HTML export (task 3.1) — the file-download exit ──
    await commands.armExportDownload();
    rowIn(panel, 'html').click();
    const downloaded = await commands.collectExportDownload();
    // NON-VACUITY: the real download really happened, carrying the real fixture's own heading.
    expect(downloaded.consoleErrors, 'HTML export: the downloaded file failed to open cleanly').toEqual(
      [],
    );
    expect(downloaded.h1Text, 'HTML export: no heading rode along — this window measured nothing').toBe(
      HEADING,
    );
    await assertNoNetwork('HTML export');

    // ── The three copy rows (tasks 3.3, 3.4, 4.1) — the clipboard exits ──
    if ((await clipboardWriteConsent()) !== 'unsupported') await grantClipboardConsent();
    for (const key of COPY_KEYS) {
      const row = rowIn(panel, key);
      await userEvent.click(row);
      await until(() => row.getAttribute(EXPORT_ROW_STATE_ATTR) === 'done');
      // NON-VACUITY: 'done' is only reachable via the copy handler's OWN `.then(onCopied, ...)`
      // resolving — i.e. the real `navigator.clipboard` write actually succeeded.
      expect(
        row.getAttribute(EXPORT_ROW_STATE_ATTR),
        `${key}: the write never really succeeded — this window measured nothing`,
      ).toBe('done');
      await assertNoNetwork(key);
    }

    // ── PDF export (task 7.1) — window.print() stubbed (pdfExport.browser.test.ts's own shape):
    // a real print dialog would hang the runner, and this file's own claim is precisely
    // "Peekover's path TO window.print() is silent," never a claim about the browser's print
    // internals, which never run here and which the page's own buffer could not see regardless.
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    try {
      rowIn(panel, 'pdf').click();
      await new Promise<void>((r) => setTimeout(r, 100)); // window.print() is a sync call
      // NON-VACUITY: the panel row really reached exportPdf() → window.print().
      expect(printSpy, 'PDF export: window.print() was never reached — this window measured nothing')
        .toHaveBeenCalledTimes(1);
      await assertNoNetwork("PDF export (Peekover's own path to window.print())");
    } finally {
      printSpy.mockRestore();
    }

    // CUMULATIVE — the buffer was never re-cleared since armTheProbe's own final clear, so this
    // also re-reads every action above.
    await wireSettled();
    expect(
      networkedUrls(),
      'cumulative: some export/copy/print action put a byte on the wire',
    ).toEqual([]);

    // ★ AND THE CONTROL IS STILL LIVE. Without this, an observer that went blind mid-run would
    // report a clean zero indistinguishable from five genuinely silent actions.
    await armSubresourceLane();
  });
});
