// snapshotNotice — what the app page says about a folder it holds as a SNAPSHOT (a `persistable: false` source: Firefox,
// or a Chromium-based browser without `showDirectoryPicker`, such as Brave). Release 0.1.1 (`decisions.md`, "0.1.1
// RULINGS" D2 redesign; the copy APPROVED by the human 2026-11-14, "0.1.1 NOTICE REDESIGN").
//
// The 0.1.0 notices named Firefox in every browser and said everything at once: a banner over the reader
// (`FIREFOX_PICKER_NOTE`) and a long box in the sidebar (`READ_ONLY_SNAPSHOT_NOTE` / `DRAGGED_SNAPSHOT_NOTE`). Now:
//   • the Watch control carries the one limit that concerns it (`WATCH_UNAVAILABLE_REASON`, toolbar.ts);
//   • the sidebar shows one line, "Snapshot", and an ⓘ button whose popover holds at most three short lines;
//   • a file the Chromium picker route can no longer read says why (`CHANGED_AFTER_PICK`, readerPane.ts).
//
// THE BUILD DECIDES THE FACTS, THE ROUTE DECIDES THE ACTION. The facts differ by engine and were measured (Playwright
// Chromium 149 / Firefox 151, a real `<input webkitdirectory>`, 2026-11-14; the human's Brave checks the same day):
// on the Chromium picker route a file changed after the pick throws `NotReadableError` and a deleted one
// `NotFoundError`; Firefox reads a changed file fresh. So the Firefox build's words are kept, and the Chromium build's
// say what Chromium does. `build` is the build-time constant (`import.meta.env.FIREFOX`, read by the app entry), never
// a runtime engine sniff. The picker route gets "Pick again"; the drag route gets no button, as no button can start a
// drag (its second line says to drag the folder in again).

/** Which build is running — `import.meta.env.FIREFOX` in the app entry. */
export type AppBuild = 'chromium' | 'firefox';

/** How a snapshot folder arrived. */
export type SnapshotRoute = 'picker' | 'drop';

/** The Watch control's visible reason on the picker route (both builds). */
export const WATCH_UNAVAILABLE_REASON = 'To watch, drag the folder in.';

/** The sidebar line's visible text. */
export const SNAPSHOT_LABEL = 'Snapshot';

/** The ⓘ button's accessible name, and the popover's. */
export const SNAPSHOT_INFO_NAME = 'About this snapshot';

/** The picker route's action in the popover: the same picker the "Open a folder" button runs. */
export const PICK_AGAIN = 'Pick again';

/** The popover's lines, per build and route (approved 2026-11-14). */
export const SNAPSHOT_LINES: Readonly<Record<AppBuild, Readonly<Record<SnapshotRoute, readonly string[]>>>> = {
  chromium: {
    picker: [
      'This is the folder as it was when you picked it.',
      'New files won’t appear, and changed or deleted files won’t open.',
      'This browser can’t keep folder access, so you’ll pick it again next time.',
    ],
    drop: [
      'This is the folder as it was when you dragged it in.',
      'To see new or removed files, drag it in again.',
      'This browser can’t keep folder access, so you’ll open it again next time.',
    ],
  },
  firefox: {
    picker: [
      'Firefox shows this folder as it was when you picked it: new files won’t appear.',
      'Opening a file shows its latest saved version.',
      'Firefox can’t keep folder access, so you’ll pick it again next time.',
    ],
    drop: [
      'Firefox shows this folder as it was when you dragged it in.',
      'To see new or removed files, drag it in again.',
      'Firefox can’t keep folder access, so you’ll open it again next time.',
    ],
  },
};

/** A recent or pinned folder that must be picked again (no stored handle): its reason line, per build. The Chromium
 *  line (C4) also covers Chrome after Revoke, where the old Firefox line stayed for good. */
export const REPICK_HINTS: Readonly<Record<AppBuild, string>> = {
  chromium: 'Peekover no longer has access to this folder — click to pick it again.',
  firefox: 'Firefox can’t remember folder access — click to pick it again.',
};

/** C5: the reader pane's state for a file the picker route can no longer read because it changed after the pick
 *  (`NotReadableError`). Shown only on that route (appShell decides); a deleted file keeps "Couldn't read this file". */
export const CHANGED_AFTER_PICK = {
  title: 'This file changed after you picked the folder',
  detail: 'Pick the folder again to read its latest version.',
} as const;

/** The class root of the sidebar line. */
export const SNAPSHOT_CLASS = 'peekover-app__snapshot';

let popoverCount = 0;

/**
 * Build the sidebar's snapshot line: "Snapshot" and an ⓘ button opening a native popover with the route's lines (and
 * "Pick again" on the picker route). The popover is `popover="auto"`, so Esc and a press outside close it, and the
 * button is its `popovertarget` invoker, so it sits next in the focus order and focus stays with the user. It is
 * placed under the button by script on open (no CSS anchor positioning: Firefox 153, the floor, lacks it).
 */
export function buildSnapshotLine(
  doc: Document,
  opts: { build: AppBuild; route: SnapshotRoute; onPickAgain: () => void },
): HTMLElement {
  const line = doc.createElement('div');
  line.className = SNAPSHOT_CLASS;
  line.setAttribute('data-state', 'read-only-snapshot');

  const dot = doc.createElement('span');
  dot.className = `${SNAPSHOT_CLASS}-dot`;
  dot.setAttribute('aria-hidden', 'true');
  const label = doc.createElement('span');
  label.className = `${SNAPSHOT_CLASS}-label`;
  label.textContent = SNAPSHOT_LABEL;

  popoverCount += 1;
  const id = `peekover-snapshot-about-${popoverCount}`;
  const info = doc.createElement('button');
  info.type = 'button';
  info.className = `${SNAPSHOT_CLASS}-info`;
  info.textContent = 'i';
  info.setAttribute('aria-label', SNAPSHOT_INFO_NAME);
  info.setAttribute('popovertarget', id);
  info.setAttribute('aria-controls', id);
  info.setAttribute('aria-expanded', 'false');

  const pop = doc.createElement('div');
  pop.id = id;
  pop.className = `${SNAPSHOT_CLASS}-about`;
  pop.setAttribute('popover', 'auto');
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', SNAPSHOT_INFO_NAME);
  pop.setAttribute('data-state', 'snapshot-details');
  for (const text of SNAPSHOT_LINES[opts.build][opts.route]) {
    const p = doc.createElement('p');
    p.textContent = text;
    pop.append(p);
  }
  if (opts.route === 'picker') {
    const again = doc.createElement('button');
    again.type = 'button';
    again.className = `${SNAPSHOT_CLASS}-again`;
    again.textContent = PICK_AGAIN;
    again.addEventListener('click', () => {
      (pop as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
      opts.onPickAgain();
    });
    pop.append(again);
  }

  // Place it under the button, inside the window; keep aria-expanded true to the popover's state.
  pop.addEventListener('beforetoggle', (event) => {
    const open = (event as Event & { newState?: string }).newState === 'open';
    info.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const r = info.getBoundingClientRect();
    const view = doc.defaultView;
    const width = Math.min(280, (view?.innerWidth ?? 320) - 16);
    const left = Math.max(8, Math.min(r.left - 8, (view?.innerWidth ?? width) - width - 8));
    pop.style.width = `${width}px`;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(r.bottom + 6)}px`;
  });

  line.append(dot, label, info, pop);
  return line;
}

/** The sidebar line's styles, scoped under the shell (tokens inherit from `.peekover-app`; the popover is in the top
 *  layer but keeps its DOM parent's inherited custom properties). */
export const SNAPSHOT_CSS = /* css */ `
.${SNAPSHOT_CLASS}{display:flex; align-items:center; gap:6px; margin:0 0 .7rem; padding:0 2px; font:600 12px/1.2 var(--sans); color:var(--muted)}
.${SNAPSHOT_CLASS}-dot{width:7px; height:7px; border-radius:50%; background:var(--hl); flex:none}
.${SNAPSHOT_CLASS}-info{box-sizing:border-box; width:20px; height:20px; padding:0; border-radius:50%; display:grid; place-items:center;
  border:1px solid var(--line); background:var(--paper); color:var(--muted); font:700 11px/1 var(--sans); cursor:pointer}
.${SNAPSHOT_CLASS}-info:hover{color:var(--ink); border-color:var(--faint)}
.${SNAPSHOT_CLASS}-info:focus-visible,.${SNAPSHOT_CLASS}-again:focus-visible{outline:2px solid var(--ink); outline-offset:2px}
.${SNAPSHOT_CLASS}-about{position:fixed; inset:auto; margin:0; box-sizing:border-box; padding:12px 14px; border:1px solid var(--line);
  border-radius:10px; background:var(--paper); color:var(--ink); box-shadow:var(--shadow); font:400 12.5px/1.5 var(--sans)}
.${SNAPSHOT_CLASS}-about p{margin:0 0 6px}
.${SNAPSHOT_CLASS}-again{margin-top:4px; font:600 12.5px/1 var(--sans); color:var(--paper); background:var(--ink); border:0;
  border-radius:8px; padding:8px 12px; cursor:pointer}
`;
