// recentsView — the DOM view over the persisted recents + pins: the app page's REOPEN HUB.
// Spec 002 §5.2. DOM-only glue; the display ORDER is decided by the pure `recents` module
// (orderRecents / orderPins), which this renders and never re-derives.
//
// The interaction the spec fixes: re-opening a remembered folder is ONE gesture. Each entry
// here is a single button — clicking it IS the whole interaction (Chromium: the click's
// gesture carries the `requestPermission()` re-grant; Firefox: the click opens the re-pick
// chooser). Re-ask-on-use is the DEFAULT narrative and a trust feature ("nothing is granted
// silently"), so an entry that cannot silently rehydrate (Firefox / picker-disabled) is NOT
// greyed out — it shows a one-gesture "pick again" affordance with a plain reason.
//
// Never blank: empty recents/pins simply render nothing (the idle affordance above still
// shows). Self-contained styling mirrors treeView/readerPane — reads the shell tokens by
// inheritance with plain fallbacks. Folder/file names are set via textContent (never
// innerHTML), so a name with markup can't inject (AGENTS.md #3 posture, even for local names).

/** How an entry reopens: `rehydrate` = one-gesture re-grant of a remembered handle (Chromium);
 *  `repick` = re-open the chooser because no live handle can be remembered (Firefox snapshot). */
export type ReopenKind = 'rehydrate' | 'repick';

/** A recent-file entry as the view shows it (already ordered by the pure module). */
export interface RecentEntryVM {
  id: string;
  folderId: string;
  /** File name, e.g. `intro.md`. */
  name: string;
  /** Path within the folder, e.g. `docs/intro.md`. */
  path: string;
  reopen: ReopenKind;
}

/** A pin entry as the view shows it (a pinned file or whole folder). */
export interface PinEntryVM {
  id: string;
  folderId: string;
  kind: 'file' | 'folder';
  name: string;
  path: string;
  reopen: ReopenKind;
}

export interface RecentsViewOptions {
  recents: readonly RecentEntryVM[];
  pins: readonly PinEntryVM[];
  /** Reopen a recent (one gesture). */
  onOpenRecent(entry: RecentEntryVM): void;
  /** Reopen a pin (one gesture). */
  onOpenPin(entry: PinEntryVM): void;
  /** Remove a pin (the "remove" in pin add/remove/order). */
  onUnpin(entry: PinEntryVM): void;
}

export interface RecentsViewController {
  /** The view root, or `null` when there is nothing to show (no recents and no pins). */
  readonly element: HTMLElement | null;
}

const RV_CLASS = 'peekover-recents';

const RV_CSS = /* css */ `
.${RV_CLASS}{display:flex; flex-direction:column; gap:1rem; min-width:0; margin-top:1.1rem}
.${RV_CLASS}__section{display:flex; flex-direction:column; gap:.3rem; min-width:0}
.${RV_CLASS}__title{
  margin:4px 8px 6px; font:700 10.5px/1.3 var(--sans); text-transform:uppercase; letter-spacing:.14em; color:var(--muted);
}
.${RV_CLASS}__list{display:flex; flex-direction:column; gap:1px; min-width:0}
.${RV_CLASS}__row{display:flex; align-items:center; gap:.3rem; min-width:0}
.${RV_CLASS}__entry{
  font:inherit; font-size:13px; text-align:left; flex:1 1 auto; min-width:0;
  color:var(--muted); background:transparent; border:0; border-radius:7px; transition:background-color .15s,color .15s;
  padding:6px 8px; cursor:pointer; display:flex; flex-direction:column; gap:.1rem;
}
.${RV_CLASS}__entry:hover{background:var(--panel); color:var(--ink)}
.${RV_CLASS}__name{
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; gap:.35rem; align-items:baseline;
}
.${RV_CLASS}__kind{color:var(--muted,#5D6070); font-size:.75em; flex:0 0 auto}
.${RV_CLASS}__hint{color:var(--muted,#5D6070); font-size:.72rem}
.${RV_CLASS}__unpin{
  flex:0 0 auto; font:600 12.5px/1 var(--sans); color:var(--muted); background:var(--panel);
  border:1px solid var(--line); border-radius:8px; padding:7px 11px; cursor:pointer; transition:transform .15s,color .15s;
}
.${RV_CLASS}__unpin:hover{color:var(--ink); transform:translateY(-1px)}
`;

function buildStyle(doc: Document): HTMLStyleElement {
  const style = doc.createElement('style');
  style.textContent = RV_CSS;
  return style;
}

/** The plain "why re-pick" reason for a non-rehydratable (Firefox) entry — honest, not a
 *  dead end. Framed as the platform limitation, mirroring the snapshot note. */
export const REPICK_HINT = 'Firefox can’t remember folder access — click to pick it again.';

/**
 * Build one reopen entry button. A `repick` entry carries a plain reason line so the honest
 * one-gesture re-pick is explained, never a silent/greyed dead end.
 */
function buildEntry(
  doc: Document,
  label: string,
  path: string,
  reopen: ReopenKind,
  kindTag: string | null,
  onOpen: () => void,
): HTMLButtonElement {
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.className = `${RV_CLASS}__entry`;
  btn.dataset.reopen = reopen;
  if (path) btn.title = path;

  const nameRow = doc.createElement('span');
  nameRow.className = `${RV_CLASS}__name`;
  if (kindTag) {
    const tag = doc.createElement('span');
    tag.className = `${RV_CLASS}__kind`;
    tag.textContent = kindTag;
    nameRow.append(tag);
  }
  const nameEl = doc.createElement('span');
  nameEl.textContent = label;
  nameRow.append(nameEl);
  btn.append(nameRow);

  if (reopen === 'repick') {
    const hint = doc.createElement('span');
    hint.className = `${RV_CLASS}__hint`;
    hint.textContent = REPICK_HINT;
    btn.append(hint);
  }

  btn.addEventListener('click', onOpen);
  return btn;
}

/** Build a titled section (Pinned / Recent) as a labelled list, or return null if empty. */
function buildSection(
  doc: Document,
  title: string,
  rows: HTMLElement[],
): HTMLElement | null {
  if (rows.length === 0) return null;
  const section = doc.createElement('section');
  section.className = `${RV_CLASS}__section`;
  section.setAttribute('aria-label', title);

  const heading = doc.createElement('h2');
  heading.className = `${RV_CLASS}__title`;
  heading.textContent = title;

  const list = doc.createElement('div');
  list.className = `${RV_CLASS}__list`;
  list.setAttribute('role', 'list');
  for (const row of rows) list.append(row);

  section.append(heading, list);
  return section;
}

/**
 * Create the recents/pins view. Returns `{ element: null }` when there is nothing to show, so
 * the caller can simply skip appending it (never renders an empty box). Pins render above
 * recents (a pin is a deliberate keep; a recent is incidental history).
 */
export function createRecentsView(doc: Document, opts: RecentsViewOptions): RecentsViewController {
  const { recents, pins, onOpenRecent, onOpenPin, onUnpin } = opts;
  if (recents.length === 0 && pins.length === 0) return { element: null };

  const element = doc.createElement('div');
  element.className = RV_CLASS;
  element.append(buildStyle(doc));

  // Pinned section: each row is a reopen button + an unpin control.
  const pinRows = pins.map((pin) => {
    const row = doc.createElement('div');
    row.className = `${RV_CLASS}__row`;
    row.setAttribute('role', 'listitem');
    const entry = buildEntry(
      doc,
      pin.name,
      pin.path,
      pin.reopen,
      pin.kind === 'folder' ? '📁' : null,
      () => onOpenPin(pin),
    );
    entry.dataset.pinKind = pin.kind;
    const unpin = doc.createElement('button');
    unpin.type = 'button';
    unpin.className = `${RV_CLASS}__unpin`;
    unpin.textContent = 'Unpin';
    unpin.setAttribute('aria-label', `Unpin ${pin.name}`);
    unpin.addEventListener('click', () => onUnpin(pin));
    row.append(entry, unpin);
    return row;
  });

  // Recent section: each row is a single reopen button (recents are auto-managed, no remove).
  const recentRows = recents.map((rec) => {
    const row = doc.createElement('div');
    row.className = `${RV_CLASS}__row`;
    row.setAttribute('role', 'listitem');
    row.append(buildEntry(doc, rec.name, rec.path, rec.reopen, null, () => onOpenRecent(rec)));
    return row;
  });

  const pinned = buildSection(doc, 'Pinned', pinRows);
  const recent = buildSection(doc, 'Recent', recentRows);
  if (pinned) element.append(pinned);
  if (recent) element.append(recent);

  return { element };
}
