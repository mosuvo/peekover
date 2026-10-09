// scripts/perf-edit-preview.page.ts — the IN-PAGE half of `perf-edit-preview.ts` (012 task 6.2).
//
// Bundled from production SOURCE by the driver and loaded into a real Chromium / Firefox page. It
// builds the edit view out of production's own parts — `mount`, `enterEditMode`,
// `loadEditorEngine`, `buildEditorShell`, `renderPreview` (the real `mount()` into the nested
// host plus the four enhancers) — and puts ONE thing of its own between the editor and the
// preview: the scheduler under measurement. Production's scheduler is `createPreviewCooldown`,
// imported as it ships (candidate C1). Every other candidate lives HERE and nowhere in `src/`.
//
// NOTHING IN THIS FILE CHOOSES. It measures; tasks.md 6.2 forbids more.

import { mount } from '../src/render/mount';
import { enterEditMode } from '../src/render/readerMode';
import { loadEditorEngine } from '../src/render/editorEngine';
import { buildEditorShell, createPreviewCooldown, renderPreview } from '../src/render/editorView';

/** What a scheduler is: told of the newest text, it decides when the preview renders. */
interface Scheduler {
  push(text: { toString(): string }): void;
  cancel(): void;
}
type Render = (text: string) => void;
type Factory = (render: Render) => Scheduler;

/**
 * THE HARNESS'S COPY OF THE COST-PROPORTIONAL COOLDOWN, with the two things production fixes made
 * parameters: the multiplier, and whether the first render runs inside the keystroke. With
 * `(1, false)` it is `createPreviewCooldown` line for line — and is measured BESIDE the real one
 * (candidate `C1-copy`) so that any difference between the copy and production is visible in the
 * tables rather than assumed away.
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
  'C1 today (x1, first render in the key)': (render) => createPreviewCooldown(render),
  'C1-copy (harness copy of C1)': cooldown(1, false),
  'C2 x1, first render deferred (0 ms task)': cooldown(1, true),
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
