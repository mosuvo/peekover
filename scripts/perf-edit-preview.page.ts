// scripts/perf-edit-preview.page.ts — the IN-PAGE half of `perf-edit-preview.ts` (012 tasks 6.2
// and 6.3).
//
// Bundled from production SOURCE by the driver and loaded into a real Chromium / Firefox page. It
// builds the edit view out of production's own parts — `mount`, `enterEditMode`,
// `loadEditorEngine`, `buildEditorShell`, `renderPreview` (the real `mount()` into the nested
// host plus the four enhancers) — and puts ONE thing of its own between the editor and the
// preview: the scheduler under measurement. Production's scheduler is `createPreviewCooldown`,
// imported as it ships (candidate C1 — since task 6.4 that is the R26 scheduler). Every other
// candidate lives HERE and nowhere in `src/`.
//
// The second half of the file (THE NESTED-HOST ARMS, task 6.3) builds the edit view five ways to
// price the preview's nested shadow root; its harness-only constructions are named there.
//
// NOTHING IN THIS FILE CHOOSES. It measures; tasks.md 6.2 and 6.3 forbid more.

import { mount } from '../src/render/mount';
import { enterEditMode, exitEditMode } from '../src/render/readerMode';
import { loadEditorEngine, type EditorEngine } from '../src/render/editorEngine';
import {
  buildEditor,
  buildEditorShell,
  createPreviewCooldown,
  editorShellFor,
  renderPreview,
  teardownEditorShell,
  EDITOR_PREVIEW_CLASS,
  EDITOR_PREVIEW_HOST_CLASS,
  EDITOR_SHELL_CLASS,
  EDITOR_SOURCE_CLASS,
} from '../src/render/editorView';
import { parse } from '../src/render/parse';
import { sanitize } from '../src/render/sanitize';
import { applyMediaPolicy } from '../src/render/mediaPolicy';
import { captureReadingAnchor, restoreReadingAnchor } from '../src/render/readingAnchor';
import { buildTocModel } from '../src/render/tocModel';
import { EDITOR_CSS } from '../src/theme/readerCss';
import { unregisterThemeHost } from '../src/theme/themeRegistry';

/** What a scheduler is: told of the newest text, it decides when the preview renders. */
interface Scheduler {
  push(text: { toString(): string }): void;
  cancel(): void;
}
type Render = (text: string) => void;
type Factory = (render: Render) => Scheduler;

/**
 * THE HARNESS'S COPY OF THE COST-PROPORTIONAL COOLDOWN, with the two things production fixes made
 * parameters: the multiplier, and whether the first render runs inside the keystroke.
 *
 * AT TASK 6.2 `(1, false)` was `createPreviewCooldown` line for line, measured beside the real one
 * as `C1-copy`. SINCE TASK 6.4 (ruling R26) production defers its first render into a 0 ms task,
 * so the copy of what SHIPS is `(1, true)` — candidate C2 — and `C1-copy` is the behaviour R26
 * replaced, kept so a re-run still has the old row to stand beside the shipped one.
 */
function cooldown(multiplier: number, deferFirst: boolean): Factory {
  return (render) => {
    let readyAt = 0;
    let pending: { toString(): string } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const renderNow = (text: { toString(): string }): void => {
      const started = performance.now();
      render(text.toString());
      readyAt = performance.now();
      readyAt += (readyAt - started) * multiplier;
    };
    const flush = (): void => {
      timer = null;
      if (pending === null) return;
      const remaining = readyAt - performance.now();
      if (remaining > 0) {
        timer = setTimeout(flush, remaining);
        return;
      }
      const text = pending;
      pending = null;
      renderNow(text);
    };
    return {
      push(text) {
        const wait = readyAt - performance.now();
        if (wait <= 0 && timer === null && !deferFirst) {
          renderNow(text);
          return;
        }
        pending = text;
        // Deferred: a 0 ms TASK (`setTimeout(…, 0)`), so the keystroke's own task ends first.
        if (timer === null) timer = setTimeout(flush, Math.max(0, wait));
      },
      cancel() {
        if (timer !== null) clearTimeout(timer);
        timer = null;
        pending = null;
      },
    };
  };
}

/** A fixed TRAILING debounce: render `ms` after the last key, and not before. */
function trailing(ms: number): Factory {
  return (render) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return {
      push(text) {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          render(text.toString());
        }, ms);
      },
      cancel() {
        if (timer !== null) clearTimeout(timer);
        timer = null;
      },
    };
  };
}

export const CANDIDATES: Record<string, Factory> = {
  'C1 shipped (R26: x1, first render in a 0 ms task)': (render) => createPreviewCooldown(render),
  'C1-copy (pre-R26: x1, first render in the key)': cooldown(1, false),
  'C2 x1, first render deferred (harness copy of what ships)': cooldown(1, true),
  'C3 x2': cooldown(2, false),
  'C3 x3': cooldown(3, false),
  'C4 trailing 150 ms': trailing(150),
  'C4 trailing 300 ms': trailing(300),
};

interface Session {
  host: HTMLElement;
  previewHost: HTMLElement;
  view: { state: { doc: { length: number; toString(): string } }; dispatch(spec: unknown): void; focus(): void; destroy(): void };
  scheduler: Scheduler;
}

let session: Session | null = null;

// ── What a typing run records ─────────────────────────────────────────────────────────────────
//
// EVERY TIME IS AN EPOCH (ms, `performance.timeOrigin + performance.now()`), so the driver — a
// different process on the same machine clock — can subtract the moment it SENT each key. A key's
// latency therefore includes everything a user waits through: the wait behind a render that was
// still running when the key arrived, as well as the handling itself (and a millisecond or two of
// automation protocol, visible as the floor in the tables).
const now = (): number => performance.timeOrigin + performance.now();

interface Run {
  /** Per key: when the character was in the buffer (the editor's own update listener). */
  bufferAt: number[];
  /** Per key: when the main thread was next free — a message-channel task posted as the
   *  character entered the buffer ran. Later than `bufferAt` by any render that key started. */
  freeAt: number[];
  /** Each preview render: when it started, and how long `renderPreview` took (mount + the
   *  enhancers' synchronous half). */
  renders: { at: number; ms: number }[];
  /** When a render first left the final text in the preview. */
  finalAt: number | null;
  /** The last DOM mutation inside the preview — the enhancers' asynchronous half settling. */
  lastMutationAt: number;
  /** Long Tasks API durations, where the engine has it (Chromium). */
  longTasks: number[];
}
let run: Run | null = null;
let marker = '';
let mutations: MutationObserver | null = null;

const channel = new MessageChannel();
channel.port1.onmessage = () => {
  run?.freeAt.push(now());
};

try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) run?.longTasks.push(entry.duration);
  }).observe({ entryTypes: ['longtask'] });
} catch {
  // No Long Tasks API (Firefox): the driver counts keys whose main thread stayed busy >= 50 ms
  // instead, and says so.
}

function watchPreview(previewHost: HTMLElement): void {
  mutations?.disconnect();
  mutations = new MutationObserver(() => {
    if (run) run.lastMutationAt = now();
  });
  // The nested host's own shadow root; `mount()` keeps the root and replaces its children.
  mutations.observe(previewHost.shadowRoot!, { childList: true, subtree: true, attributes: true, characterData: true });
}

/** Open `text` and enter edit with `candidate` between the editor and the preview. */
export async function open(text: string, candidate: string): Promise<void> {
  close();
  const scroller = document.createElement('main');
  scroller.style.cssText = 'position:fixed;inset:0;overflow:auto';
  const host = document.createElement('div');
  scroller.appendChild(host);
  document.body.replaceChildren(scroller);
  mount(text, host, { contained: true });

  const made: Partial<Session> = { host };
  const render: Render = (source) => {
    const at = now();
    renderPreview(host, source);
    const ms = now() - at;
    if (!run) return;
    run.renders.push({ at, ms });
    run.lastMutationAt = now();
    if (run.finalAt === null && marker && source.endsWith(marker)) run.finalAt = now();
  };
  const scheduler = CANDIDATES[candidate](render);
  await enterEditMode(host, {
    loader: () => loadEditorEngine(host),
    build: (engine, h) => {
      const shell = buildEditorShell(h);
      made.previewHost = shell.previewHost;
      made.view = engine.createView(
        shell.source,
        text,
        engine.EditorView.updateListener.of((update: { docChanged: boolean; state: { doc: { toString(): string } } }) => {
          if (!update.docChanged) return;
          if (run) {
            run.bufferAt.push(now());
            channel.port2.postMessage(0); // runs when THIS task — and any render it starts — is over
          }
          scheduler.push(update.state.doc);
        }),
      ) as Session['view'];
    },
  });
  session = { host, previewHost: made.previewHost!, view: made.view!, scheduler };
  watchPreview(session.previewHost);
  const end = session.view.state.doc.length;
  session.view.dispatch({ selection: { anchor: end }, scrollIntoView: true });
  session.view.focus();
}

export function close(): void {
  session?.scheduler.cancel();
  session?.view.destroy();
  mutations?.disconnect();
  session = null;
  run = null;
}

/** Start recording. `endsWith` is what the buffer will end with once the last key is in. */
export function begin(endsWith: string): void {
  marker = endsWith;
  run = { bufferAt: [], freeAt: [], renders: [], finalAt: null, lastMutationAt: 0, longTasks: [] };
}

/** Has the preview shown the final text, and has it been quiet for `quietMs` since? */
export function settled(quietMs: number): boolean {
  return !!run && run.finalAt !== null && now() - run.lastMutationAt >= quietMs;
}

export function end(): Run & { bufferOk: boolean } {
  const result = { ...run!, bufferOk: session!.view.state.doc.toString().endsWith(marker) };
  run = null;
  return result;
}

/**
 * RENDER WALL-CLOCK (tasks.md 6.2's own metric): one `renderPreview` of the open document —
 * `mount()` into the nested host plus the enhancers' synchronous half — then the time until the
 * preview's DOM has been quiet for `quietMs` (the asynchronous half: diagrams, math, code).
 */
export async function timeRender(quietMs: number, capMs: number): Promise<{ sync: number; settle: number | null }> {
  const s = session!;
  const text = s.view.state.doc.toString();
  let last = performance.now();
  const seen = new MutationObserver(() => {
    last = performance.now();
  });
  seen.observe(s.previewHost.shadowRoot!, { childList: true, subtree: true, attributes: true, characterData: true });
  const started = performance.now();
  renderPreview(s.host, text);
  const sync = performance.now() - started;
  last = Math.max(last, started + sync);
  let settle: number | null = null;
  for (;;) {
    await new Promise<void>((r) => setTimeout(r, 25));
    const t = performance.now();
    if (t - last >= quietMs) {
      settle = last - started;
      break;
    }
    if (t - started > capMs) break;
  }
  seen.disconnect();
  return { sync, settle };
}

/** What the preview holds — counts the driver prints so a profile is seen to be what it claims. */
export function census(): Record<string, number> {
  const root = session!.previewHost.shadowRoot!;
  const count = (selector: string): number => root.querySelectorAll(selector).length;
  return {
    svg: count('svg'),
    math: count('math'),
    pre: count('pre'),
    table: count('table'),
    nodes: count('*'),
  };
}

// ════ THE NESTED-HOST ARMS (012 task 6.3; D-4, plan §4 risk 3) ═════════════════════════════════
//
// What does the preview's SECOND shadow root cost, apart from CodeMirror and apart from the
// preview's own content? Five ways of standing in edit on the same document:
//
//   R   reading only — the document mounted, edit never entered. The base for memory.
//   E   EDITOR ONLY — the shell and the engine's view; the preview pane is left empty.
//   S   SINGLE ROOT — the ablated control. The preview's content sits in the preview pane as a
//       second `.peekover-reader` column INSIDE THE OUTER shadow root: no nested host, no second
//       `attachShadow`, no second copy of the reader's stylesheets. It is the alternative plan
//       D-4 rejected ("ONE shadow root instead of two"), built here so its cost can be read.
//   N   NESTED — the harness's copy of what ships: the same shell, a nested host, and
//       production's own `mount(text, previewHost, { contained, preserveReading, chrome:false })`.
//   P   PRODUCTION — `buildEditor`, exactly as the edit control calls it (no save bar): the
//       shipped nested host, the shipped scheduler, and the four enhancers after each render.
//
// N − S is the nesting. S − E is the preview's content. E − R is CodeMirror and the shell.
// P beside N says how far the harness's copy is from the shipped thing.
//
// WHAT IS THE HARNESS'S OWN, AND WHY IT HAS TO BE. Production's `buildEditorShell` always renders
// the preview as it builds, so an editor with no preview (E) cannot be made by calling it; and
// nothing in `src/` renders a preview without a nested host (S). So E, S and N build the shell
// from `buildEditorShell`'s own lines — same classes, same `EDITOR_CSS`, same order: shell, then
// preview, then the view — and differ ONLY in what goes in the preview pane.
//
// S IS LIKE FOR LIKE WITH `mount()` WHERE IT CAN BE: the same `sanitize(parse())`, the same inert
// `<template>`, the same media policy, the same reading-anchor capture and restore that
// `preserveReading` runs (so both arms force the same synchronous layout). What S leaves out is
// exactly what the nested host adds: the two `<style>` elements `mount()` rebuilds on every
// render, the commit into a second root, and the post-commit wiring (source registry, mode
// attribute, TOC un-registration, theme-host registration).
//
// THE ENHANCERS RUN IN P ONLY. They find a host's reading column as the FIRST `.peekover-reader`
// in its shadow root, which in S is the hidden reading view, not the preview — so they cannot be
// run like for like there, and N leaves them out to stay comparable with S. On a prose document
// they find nothing and P ≈ N; on an enhancer-heavy one P − N is the enhancers, not the nesting.
//
// Two rules in S are the harness's, both scoped to the preview pane, both there so S's column is
// laid out as N's is: the outer sheet hides every `.peekover-reader` under `data-mode="edit"`, so
// the preview column is shown again; and it insets every `.peekover-reader` by the TOC rail's
// width while the document's rail is open, which the nested host (it has no rail) never sees —
// left in, S's column was half the width and twice the height of N's (109,692 px against 56,674
// on the 50 KB document), and S paid for layout N did not. The census prints both heights.

export type NestedArm = 'R' | 'E' | 'S' | 'N' | 'P';

interface NestedState {
  host: HTMLElement;
  text: string;
  /** What the harness's own arms added to the outer root, and their view. Empty in R and P. */
  added: Element[];
  view: { destroy(): void } | null;
  preview: HTMLElement | null;
  previewHost: HTMLElement | null;
}

let nested: NestedState | null = null;

const frame2 = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

const SINGLE_ROOT_CSS =
  `:host([data-mode="edit"]) .${EDITOR_PREVIEW_CLASS} > .peekover-reader{display:block}` +
  `:host([data-toc="open"]) .${EDITOR_PREVIEW_CLASS} > .peekover-reader{width:100%;margin:0 auto}`;

/** `buildEditorShell`'s DOM, without the nested host and without the render it does at build. */
function buildShellCopy(host: HTMLElement, extraCss = ''): { added: Element[]; source: HTMLElement; preview: HTMLElement } {
  const style = document.createElement('style');
  style.textContent = EDITOR_CSS + extraCss;
  const root = document.createElement('div');
  root.className = EDITOR_SHELL_CLASS;
  const source = document.createElement('div');
  source.className = EDITOR_SOURCE_CLASS;
  const preview = document.createElement('div');
  preview.className = EDITOR_PREVIEW_CLASS;
  preview.setAttribute('role', 'region');
  preview.setAttribute('aria-label', 'Live preview');
  root.append(source, preview);
  host.shadowRoot!.append(style, root);
  return { added: [style, root], source, preview };
}

/** S's render: `mount()`'s content path and its continuity, into the pane, in the outer root. */
function renderSingleRoot(preview: HTMLElement, text: string): void {
  const tpl = document.createElement('template');
  tpl.innerHTML = sanitize(parse(text)); // sanitized, and parsed inert — as `mount()` does
  applyMediaPolicy(tpl.content, document.baseURI);
  const column = document.createElement('div');
  column.className = 'peekover-reader';
  column.append(tpl.content);
  const previous = preview.querySelector('.peekover-reader');
  const anchor = previous ? captureReadingAnchor(preview, buildTocModel(previous)) : null;
  preview.replaceChildren(column);
  if (anchor) restoreReadingAnchor(preview, buildTocModel(column), anchor);
}

const renderNested = (previewHost: HTMLElement, text: string): void =>
  mount(text, previewHost, { contained: true, preserveReading: true, chrome: false });

/** Build one arm's edit view — `enterEditMode`'s `build` step. */
function buildArm(arm: NestedArm, engine: EditorEngine, state: NestedState): void {
  const { host, text } = state;
  if (arm === 'P') {
    state.view = buildEditor(engine, host).view;
    return;
  }
  const shell = buildShellCopy(host, arm === 'S' ? SINGLE_ROOT_CSS : '');
  state.added = shell.added;
  state.preview = shell.preview;
  if (arm === 'S') renderSingleRoot(shell.preview, text);
  if (arm === 'N') {
    const previewHost = document.createElement('div');
    previewHost.className = EDITOR_PREVIEW_HOST_CLASS;
    shell.preview.append(previewHost);
    state.previewHost = previewHost;
    renderNested(previewHost, text);
  }
  // An update listener, as production's session has one; it has nothing to do here.
  state.view = engine.createView(shell.source, text, engine.EditorView.updateListener.of(() => undefined));
}

/** Mount `text` as a document in reading mode, on a fresh host, and let it paint. */
export async function nestedOpen(text: string): Promise<void> {
  const scroller = document.createElement('main');
  scroller.style.cssText = 'position:fixed;inset:0;overflow:auto';
  const host = document.createElement('div');
  scroller.appendChild(host);
  document.body.replaceChildren(scroller);
  mount(text, host, { contained: true });
  nested = { host, text, added: [], view: null, preview: null, previewHost: null };
  await frame2();
}

export interface NestedEntry {
  /** Before `enterEditMode` → it resolved: the engine (loaded on a first entry, memoized after),
   *  the build, the mode flip. */
  enter: number;
  /** The build step alone: the shell, the preview's first render, the engine's view. */
  build: number;
  /** Before `enterEditMode` → the 2nd animation frame after it resolved: the edit view painted. */
  paint: number;
}

/** Enter edit as `arm`. */
export async function nestedEnter(arm: NestedArm): Promise<NestedEntry> {
  const state = nested!;
  let build = 0;
  const t0 = performance.now();
  await enterEditMode(state.host, {
    loader: () => loadEditorEngine(state.host),
    build: (engine) => {
      const b0 = performance.now();
      buildArm(arm, engine, state);
      build = performance.now() - b0;
    },
  });
  const enter = performance.now() - t0;
  await frame2();
  return { enter, build, paint: performance.now() - t0 };
}

/** Leave edit and remove everything the arm built, as the edit control's exit does. */
export async function nestedExit(arm: NestedArm): Promise<void> {
  const state = nested!;
  exitEditMode(state.host);
  if (arm === 'P') {
    teardownEditorShell(state.host);
  } else {
    state.view?.destroy();
    for (const node of state.added) node.remove();
    if (state.previewHost) unregisterThemeHost(state.previewHost);
  }
  state.added = [];
  state.view = null;
  state.preview = null;
  state.previewHost = null;
  await frame2();
}

/** One preview re-render, in the arm's own way, of the document with `suffix` typed at its end:
 *  the call alone, and out to the 2nd frame. */
export async function nestedRerender(arm: NestedArm, suffix: string): Promise<{ sync: number; paint: number }> {
  const state = nested!;
  const text = state.text + suffix;
  const t0 = performance.now();
  if (arm === 'P') renderPreview(state.host, text);
  else if (arm === 'N') renderNested(state.previewHost!, text);
  else if (arm === 'S') renderSingleRoot(state.preview!, text);
  else throw new Error(`arm ${arm} has no preview to re-render`);
  const sync = performance.now() - t0;
  await frame2();
  return { sync, paint: performance.now() - t0 };
}

/** What the arm actually built — printed so each arm is seen to be what it claims. */
export function nestedCensus(arm: NestedArm): Record<string, number> {
  const { host, preview, previewHost } = nested!;
  const outer = host.shadowRoot!;
  const inner = (arm === 'P' ? editorShellFor(host)?.previewHost : previewHost)?.shadowRoot ?? null;
  const css = (root: ParentNode): number =>
    Array.from(root.querySelectorAll('style')).reduce((n, style) => n + (style.textContent ?? '').length, 0);
  const column = inner?.querySelector('.peekover-reader') ?? preview?.querySelector('.peekover-reader') ?? null;
  return {
    shadowRoots: 1 + (inner ? 1 : 0),
    outerElements: outer.querySelectorAll('*').length,
    nestedElements: inner ? inner.querySelectorAll('*').length : 0,
    nestedStyleElements: inner ? inner.querySelectorAll('style').length : 0,
    nestedStyleChars: inner ? css(inner) : 0,
    outerStyleChars: css(outer),
    previewColumnElements: column ? column.querySelectorAll('*').length : 0,
    previewColumnHeight: column ? Math.round(column.getBoundingClientRect().height) : 0,
    editorLines: outer.querySelectorAll('.cm-line').length,
  };
}
