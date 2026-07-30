// storageControls — the "what's stored" transparency panel + "wipe all data" control.
// Spec 002 §6.17 / the trust story: storage ships VISIBLE, with its wipe/transparency
// controls. `store.describeStored()` (group 2) already computes the plain-language picture
// and `store.wipeAll()` already erases it — this is the DOM view that surfaces both so a
// user can actually SEE what Peekover holds on-device and clear it in one place. DOM-only
// glue (mirrors treeView/recentsView): the summary is COMPUTED by store.ts; this renders it
// and re-derives nothing.
//
// The honesty posture made concrete:
//   • Remembered folders are shown ONLY as `persisted: boolean` — the presence of a stored
//     directory handle, NEVER the handle object itself (store.describeStored guarantees this).
//   • It carries the standing storage disclosure — present even when the store is empty — stating
//     plainly what IS stored (on-device watched-document snapshots) and what is names-only
//     (folders/recents/pins), so the honest picture is visible unconditionally (006 task 1.4).
//   • Never blank: an empty store shows the designed "Nothing stored" state describeStored()
//     already returns (its `lines`), not a blank box.
//   • Wipe is destructive, so it takes a lightweight INLINE confirm ("Confirm wipe?") — one
//     surface, no modal library, no browser confirm(). The caller re-renders after wipe so the
//     cleared state is immediately visible.
//
// Names/paths are set via textContent (never innerHTML), so a folder/file name carrying markup
// can't inject — the AGENTS.md #3 posture, held even for on-device names.

import type { StoredSummary } from './store';

/**
 * The standing storage disclosure, shown unconditionally (empty store included). Rewritten at 006
 * task 1.4: Peekover now stores watched-document SNAPSHOTS (file contents), so the old "never stores
 * the contents" promise would be false. This states the new truth honestly — bounded on-device text
 * states that never leave the device — while keeping the names-only posture for folders/recents/pins.
 * How MANY bytes are held is the panel's live snapshot line (`describeStored`), not this static note.
 * (The DOM hook stays `data-note="contents-never-stored"` — a stable selector, not a claim.)
 */
export const STORAGE_DISCLOSURE_NOTE =
  'Peekover keeps a bounded number of past text states (snapshots) of documents you watch, so you ' +
  'can compare versions — stored on this device only and never uploaded. Folders, recents, and pins ' +
  'remain names and paths only. Everything Peekover stores lives on this device.';

export interface StorageViewOptions {
  /** The plain-language picture from `store.describeStored()`. */
  summary: StoredSummary;
  /** The current snapshot-capture flag (D-12, task 1.5) — the caller passes `getCaptureFlag()`
   *  (the live cache) at render time, so the checkbox reflects the flag the watch loop honours. */
  captureEnabled: boolean;
  /** Toggle snapshot capture on/off (D-12, task 1.5). Called with the NEW value on change; the
   *  caller both persists it (`store.setCaptureEnabled`) AND updates the live cache
   *  (`setCaptureFlag`) so the next watched render honours it immediately. */
  onToggleCapture(enabled: boolean): void;
  /** Erase everything — invoked ONLY after the inline confirm (never on the first click). */
  onWipe(): void;
  /** Erase ONLY the cached diagram renderings (D-5, task 4.3) — invoked ONLY after the control's own
   *  inline confirm. This is the one-click gesture that pays for D-5's revoke exemption: a
   *  content-hash cache key carries no folder identity, so revoking a folder cannot clear cached
   *  diagrams, and this is what the user has instead. Optional for the same reason as
   *  `onEraseSnapshots` — a minimal consumer still mounts the panel; appShell always provides it. */
  onClearDiagramCache?(): void;
  /** Erase ONLY the saved document snapshots (D-13, task 1.6) — invoked ONLY after the control's own
   *  inline confirm. The panel does not know when the async erase resolves; the caller (appShell)
   *  manages the refresh, exactly as it does for `onWipe`. Optional so a minimal consumer that only
   *  exercises another part of the panel (e.g. the capture-toggle probe) need not supply it — the
   *  erase control still renders, its confirm is a no-op when absent (appShell always provides it). */
  onEraseSnapshots?(): void;
  /** Dismiss the panel. */
  onClose(): void;
}

export interface StorageViewController {
  /** The panel root — the caller slots this into the shell. */
  readonly element: HTMLElement;
}

const SC_CLASS = 'peekover-storage';

const SC_CSS = /* css */ `
.${SC_CLASS}{
  display:flex; flex-direction:column; gap:.8rem; min-width:0;
  padding:1rem 1.1rem; border-bottom:1px solid var(--line,#E6E6DF);
  background:var(--panel,#F4F4EF); color:var(--ink,#16171F);
}
.${SC_CLASS}__head{display:flex; align-items:baseline; gap:.6rem}
.${SC_CLASS}__title{font-size:.95rem; font-weight:650; letter-spacing:-.01em; flex:1 1 auto}
.${SC_CLASS}__close{
  font:inherit; font-size:.78rem; color:var(--ink,#16171F); background:transparent;
  border:1px solid var(--line,#E6E6DF); border-radius:999px; padding:.1rem .6rem; cursor:pointer;
}
.${SC_CLASS}__close:hover{background:var(--accent-soft,#ECECE3)}
.${SC_CLASS}__lines{display:flex; flex-direction:column; gap:.25rem; margin:0; padding:0; list-style:none}
.${SC_CLASS}__line{color:var(--muted,#5D6070); font-size:.85rem}
.${SC_CLASS}__group{display:flex; flex-direction:column; gap:.2rem; min-width:0}
.${SC_CLASS}__group-title{
  font-size:.7rem; text-transform:uppercase; letter-spacing:.06em;
  color:var(--faint,#9A9DAC); font-weight:650;
}
.${SC_CLASS}__row{
  display:flex; align-items:baseline; gap:.4rem; min-width:0; font-size:.85rem;
  color:var(--ink,#16171F);
}
.${SC_CLASS}__name{white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0}
.${SC_CLASS}__tag{color:var(--muted,#5D6070); font-size:.75em; flex:0 0 auto}
.${SC_CLASS}__never{
  color:var(--muted,#5D6070); font-size:.8rem; border-left:3px solid var(--line,#E6E6DF);
  padding:.4rem .6rem; background:var(--paper,#FBFBF8); border-radius:6px; max-width:52ch;
}
.${SC_CLASS}__capture{display:flex; flex-direction:column; gap:.3rem; min-width:0}
.${SC_CLASS}__capture-row{display:flex; align-items:baseline; gap:.5rem; cursor:pointer; font-size:.85rem; color:var(--ink,#16171F)}
.${SC_CLASS}__capture-row input{flex:0 0 auto; margin:0; cursor:pointer}
.${SC_CLASS}__capture-note{color:var(--muted,#5D6070); font-size:.8rem; margin:0; max-width:52ch}
.${SC_CLASS}__erase{display:flex; align-items:center; gap:.5rem; flex-wrap:wrap}
.${SC_CLASS}__erase-prompt{color:var(--muted,#5D6070); font-size:.82rem; max-width:52ch}
.${SC_CLASS}__wipe{display:flex; align-items:center; gap:.5rem; flex-wrap:wrap}
.${SC_CLASS}__wipe-prompt{color:var(--muted,#5D6070); font-size:.82rem}
.${SC_CLASS}__btn{
  font:inherit; font-size:.8rem; color:var(--ink,#16171F); background:var(--paper,#FBFBF8);
  border:1px solid var(--line,#E6E6DF); border-radius:999px; padding:.2rem .7rem; cursor:pointer;
}
.${SC_CLASS}__btn:hover{background:var(--accent-soft,#ECECE3)}
.${SC_CLASS}__btn:disabled{opacity:.5; cursor:default}
.${SC_CLASS}__btn[data-wipe="confirm"],
.${SC_CLASS}__btn[data-erase-snapshots="confirm"],
.${SC_CLASS}__btn[data-clear-diagrams="confirm"]{border-color:var(--accent,#16171F); font-weight:600}
`;

function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = SC_CSS;
  return style;
}

/** A titled group of plain rows (Folders / Recents / Pins), or null when empty. */
function buildGroup(doc: Document, title: string, rows: HTMLElement[]): HTMLElement | null {
  if (rows.length === 0) return null;
  const group = doc.createElement('section');
  group.className = `${SC_CLASS}__group`;
  group.setAttribute('aria-label', title);
  const heading = doc.createElement('h3');
  heading.className = `${SC_CLASS}__group-title`;
  heading.textContent = title;
  group.append(heading, ...rows);
  return group;
}

/** One plain row: a name + an optional secondary tag (both textContent, never innerHTML). */
function buildRow(doc: Document, name: string, tag?: string): HTMLElement {
  const row = doc.createElement('div');
  row.className = `${SC_CLASS}__row`;
  const nameEl = doc.createElement('span');
  nameEl.className = `${SC_CLASS}__name`;
  nameEl.textContent = name;
  row.append(nameEl);
  if (tag) {
    const tagEl = doc.createElement('span');
    tagEl.className = `${SC_CLASS}__tag`;
    tagEl.textContent = tag;
    row.append(tagEl);
  }
  return row;
}

/**
 * Create the "what's stored" panel. Renders `summary` (the plain-language lines + every
 * folder/recent/pin record) plus the standing contents-never-stored promise and the
 * inline-confirm wipe control. The confirm is a local two-step: the first "Wipe all data"
 * click swaps in a "Confirm wipe? / Cancel" affordance; only the confirm click calls
 * `onWipe`. Everything is one surface — no modal, no browser confirm().
 */
export function createStorageView(doc: Document, opts: StorageViewOptions): StorageViewController {
  const {
    summary,
    captureEnabled,
    onToggleCapture,
    onWipe,
    onEraseSnapshots,
    onClearDiagramCache,
    onClose,
  } = opts;

  const element = doc.createElement('div');
  element.className = SC_CLASS;
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', 'Stored data');
  element.dataset.state = summary.total === 0 ? 'nothing-stored' : 'has-data';
  element.append(buildStyle(doc));

  // Header: title + close.
  const head = doc.createElement('div');
  head.className = `${SC_CLASS}__head`;
  const title = doc.createElement('h2');
  title.className = `${SC_CLASS}__title`;
  title.textContent = 'What Peekover has stored on this device';
  const close = doc.createElement('button');
  close.type = 'button';
  close.className = `${SC_CLASS}__close`;
  close.textContent = 'Close';
  close.addEventListener('click', onClose);
  head.append(title, close);
  element.append(head);

  // The plain-language lines describeStored() computed (incl. the "Nothing stored" line when
  // the store is empty — the designed never-blank state, rendered as-is).
  const lines = doc.createElement('ul');
  lines.className = `${SC_CLASS}__lines`;
  for (const text of summary.lines) {
    const li = doc.createElement('li');
    li.className = `${SC_CLASS}__line`;
    li.textContent = text;
    lines.append(li);
  }
  element.append(lines);

  // The structured record view: folders (as persisted-boolean only), recents, pins.
  const folderRows = summary.folders.map((f) =>
    buildRow(doc, f.name, f.persisted ? 'folder access remembered' : 'name only'),
  );
  const recentRows = summary.recents.map((r) => buildRow(doc, r.name, r.path));
  const pinRows = summary.pins.map((p) => buildRow(doc, p.name, p.kind));

  const foldersGroup = buildGroup(doc, 'Remembered folders', folderRows);
  const recentsGroup = buildGroup(doc, 'Recent files', recentRows);
  const pinsGroup = buildGroup(doc, 'Pinned', pinRows);
  if (foldersGroup) element.append(foldersGroup);
  if (recentsGroup) element.append(recentsGroup);
  if (pinsGroup) element.append(pinsGroup);

  // The standing promise — shown unconditionally, empty store included.
  const never = doc.createElement('p');
  never.className = `${SC_CLASS}__never`;
  never.dataset.note = 'contents-never-stored';
  never.textContent = STORAGE_DISCLOSURE_NOTE;
  element.append(never);

  // The snapshot-capture off-switch (D-12, task 1.5). A checkbox reflecting the current flag; its
  // change persists the new value and updates the live cache the watch loop reads at render time,
  // so the next watched render honours it. Never blank (AGENTS.md #5): the label states plainly what
  // capture does — bounded past text states of watched documents, on this device only, never uploaded.
  const capture = doc.createElement('section');
  capture.className = `${SC_CLASS}__capture`;
  capture.setAttribute('aria-label', 'Snapshot capture');
  const captureLabel = doc.createElement('label');
  captureLabel.className = `${SC_CLASS}__capture-row`;
  const captureBox = doc.createElement('input');
  captureBox.type = 'checkbox';
  captureBox.checked = captureEnabled;
  captureBox.dataset.captureToggle = '';
  captureBox.addEventListener('change', () => onToggleCapture(captureBox.checked));
  const captureText = doc.createElement('span');
  captureText.textContent = 'Keep version snapshots of documents you watch';
  captureLabel.append(captureBox, captureText);
  const captureNote = doc.createElement('p');
  captureNote.className = `${SC_CLASS}__capture-note`;
  captureNote.textContent =
    'Keeps a bounded number of past text states of the documents you watch, on this device only and ' +
    'never uploaded, so you can compare versions. Turn this off to stop keeping new snapshots.';
  capture.append(captureLabel, captureNote);
  element.append(capture);

  // The clear-diagram-cache control (D-5, task 4.3) — the THIRD erase control, built on the erase-
  // snapshots pair's shape below (inline confirm, one surface, disabled when there is nothing to
  // clear) because gate-2 sub-decision (a) specified it as matching that pair. It is placed FIRST of
  // the three by the same least-destructive-first rule that put "Erase snapshots" above "Wipe all
  // data": cached diagrams are REGENERABLE — clearing them costs the user nothing but a re-render,
  // which makes this the most forgiving control in the panel and the safest one to reach first.
  //
  // ★ Its button label, `Clear diagram cache`, is the second half of the VERBATIM panel line banked
  // at `cab93c7` (a): `Diagrams cached: N rendered (~size) — Clear diagram cache`. `store.ts`'s
  // `buildStoredLines` renders the disclosure half; this renders the control half. Neither is
  // re-authored here.
  const diagrams = doc.createElement('div');
  diagrams.className = `${SC_CLASS}__erase`;
  element.append(diagrams);

  function renderClearDiagrams(confirming: boolean): void {
    diagrams.replaceChildren();
    if (!confirming) {
      const start = doc.createElement('button');
      start.type = 'button';
      start.className = `${SC_CLASS}__btn`;
      start.dataset.clearDiagrams = 'start';
      start.textContent = 'Clear diagram cache';
      start.disabled = summary.diagrams.count === 0; // nothing cached → nothing to clear
      start.addEventListener('click', () => renderClearDiagrams(true));
      diagrams.append(start);
      return;
    }
    const prompt = doc.createElement('span');
    prompt.className = `${SC_CLASS}__erase-prompt`;
    // Names (a) what clears — every cached diagram rendering — and (b) that it costs nothing
    // permanent, since a cleared diagram is simply drawn again next time the document is opened.
    prompt.textContent =
      'Clear diagram cache? This deletes every stored diagram rendering from this device. Nothing ' +
      'is lost — each diagram is drawn again the next time you open the document that contains it.';
    const confirm = doc.createElement('button');
    confirm.type = 'button';
    confirm.className = `${SC_CLASS}__btn`;
    confirm.dataset.clearDiagrams = 'confirm';
    confirm.textContent = 'Yes, clear diagram cache';
    confirm.addEventListener('click', () => onClearDiagramCache?.());
    const cancel = doc.createElement('button');
    cancel.type = 'button';
    cancel.className = `${SC_CLASS}__btn`;
    cancel.dataset.clearDiagrams = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => renderClearDiagrams(false));
    diagrams.append(prompt, confirm, cancel);
  }
  renderClearDiagrams(false);

  // The erase-snapshots control (D-13, task 1.6) — placed ABOVE the wipe control deliberately: it is
  // the less destructive of the two (it erases only saved document snapshots, keeping everything
  // else), so the narrower action comes before the nuclear "wipe all". Same inline-confirm shape as
  // wipe — one surface, no browser confirm(). Rebuilt in place between idle/confirming. Disabled when
  // there is nothing to erase (no snapshots stored), mirroring wipe's disabled-at-total-0 state.
  const erase = doc.createElement('div');
  erase.className = `${SC_CLASS}__erase`;
  element.append(erase);

  function renderErase(confirming: boolean): void {
    erase.replaceChildren();
    if (!confirming) {
      const start = doc.createElement('button');
      start.type = 'button';
      start.className = `${SC_CLASS}__btn`;
      start.dataset.eraseSnapshots = 'start';
      start.textContent = 'Erase snapshots';
      start.disabled = summary.snapshots.count === 0; // nothing stored → nothing to erase
      start.addEventListener('click', () => renderErase(true));
      erase.append(start);
      return;
    }
    const prompt = doc.createElement('span');
    prompt.className = `${SC_CLASS}__erase-prompt`;
    // Names (a) what erases — all saved document snapshots — and (b) what SURVIVES: folders, recents,
    // pins, reader settings, and the snapshot-capture preference. Erasing snapshots is not erasing
    // settings (D-13), and the confirm surface says so plainly so the user is not misled.
    prompt.textContent =
      'Erase snapshots? This deletes all saved document snapshots from this device. Your remembered ' +
      'folders, recents, pins, reader settings, and snapshot-capture preference are kept.';
    const confirm = doc.createElement('button');
    confirm.type = 'button';
    confirm.className = `${SC_CLASS}__btn`;
    confirm.dataset.eraseSnapshots = 'confirm';
    confirm.textContent = 'Yes, erase snapshots';
    confirm.addEventListener('click', () => onEraseSnapshots?.());
    const cancel = doc.createElement('button');
    cancel.type = 'button';
    cancel.className = `${SC_CLASS}__btn`;
    cancel.dataset.eraseSnapshots = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => renderErase(false));
    erase.append(prompt, confirm, cancel);
  }
  renderErase(false);

  // The wipe control — inline confirm, one surface. Rebuilt in place between idle/confirming.
  const wipe = doc.createElement('div');
  wipe.className = `${SC_CLASS}__wipe`;
  element.append(wipe);

  function renderWipe(confirming: boolean): void {
    wipe.replaceChildren();
    if (!confirming) {
      const start = doc.createElement('button');
      start.type = 'button';
      start.className = `${SC_CLASS}__btn`;
      start.dataset.wipe = 'start';
      start.textContent = 'Wipe all data';
      start.disabled = summary.total === 0; // nothing to erase → nothing to confirm
      start.addEventListener('click', () => renderWipe(true));
      wipe.append(start);
      return;
    }
    const prompt = doc.createElement('span');
    prompt.className = `${SC_CLASS}__wipe-prompt`;
    prompt.textContent =
      'Confirm wipe? This erases everything on this device — remembered folders, recents, pins, ' +
      'reader settings, and every saved document snapshot — and resets snapshot capture to its ' +
      'default (on).';
    const confirm = doc.createElement('button');
    confirm.type = 'button';
    confirm.className = `${SC_CLASS}__btn`;
    confirm.dataset.wipe = 'confirm';
    confirm.textContent = 'Yes, wipe everything';
    confirm.addEventListener('click', onWipe);
    const cancel = doc.createElement('button');
    cancel.type = 'button';
    cancel.className = `${SC_CLASS}__btn`;
    cancel.dataset.wipe = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => renderWipe(false));
    wipe.append(prompt, confirm, cancel);
  }
  renderWipe(false);

  return { element };
}
