// @vitest-environment jsdom
// Task 5.2 (jsdom) — the recents/pins REOPEN HUB render + affordances. The list ORDER is the
// pure `recents` module's job (unit-tested in recents.test.ts); here we prove the DOM-shape:
// entries render as single reopen buttons, a Firefox (repick) entry shows the honest re-pick
// reason (not greyed out), clicking routes to the right callback, and unpin fires. The real
// one-gesture re-grant path is proven in reopen.test.ts / handlePersist.browser.test.ts.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRecentsView,
  type RecentEntryVM,
  type PinEntryVM,
} from './recentsView';
import { REPICK_HINTS } from './snapshotNotice';

/** Any build's hint: the view shows what the shell hands it (the per-build strings: snapshotNotice.test.ts). */
const REPICK_HINT = REPICK_HINTS.firefox;

function recent(over: Partial<RecentEntryVM> = {}): RecentEntryVM {
  return { id: 'r1', folderId: 'F', name: 'intro.md', path: 'docs/intro.md', reopen: 'rehydrate', ...over };
}
function pin(over: Partial<PinEntryVM> = {}): PinEntryVM {
  return { id: 'p1', folderId: 'F', kind: 'folder', name: 'my-notes', path: '', reopen: 'rehydrate', ...over };
}

describe('createRecentsView', () => {
  let doc: Document;
  beforeEach(() => {
    doc = document;
    document.body.innerHTML = '';
  });

  it('returns element:null when there is nothing to show (never an empty box)', () => {
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [],
      pins: [],
      onOpenRecent: () => {},
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    expect(view.element).toBeNull();
  });

  it('renders Pinned above Recent, each as labelled sections', () => {
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [recent()],
      pins: [pin()],
      onOpenRecent: () => {},
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    document.body.append(view.element!);
    const sections = [...document.querySelectorAll('.peekover-recents__section')];
    expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual(['Pinned', 'Recent']);
    expect(document.querySelector('.peekover-recents__title')?.textContent).toBe('Pinned');
  });

  it('a recent entry is a single reopen button carrying its name + path title', () => {
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [recent({ name: 'guide.md', path: 'docs/guide.md' })],
      pins: [],
      onOpenRecent: () => {},
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    document.body.append(view.element!);
    const btn = document.querySelector<HTMLButtonElement>('.peekover-recents__entry');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain('guide.md');
    expect(btn!.title).toBe('docs/guide.md');
    expect(btn!.dataset.reopen).toBe('rehydrate');
  });

  it('clicking a recent entry fires onOpenRecent with that entry (one gesture)', () => {
    let opened: RecentEntryVM | null = null;
    const entry = recent({ id: 'rX' });
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [entry],
      pins: [],
      onOpenRecent: (e) => (opened = e),
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    document.body.append(view.element!);
    document.querySelector<HTMLButtonElement>('.peekover-recents__entry')!.click();
    expect(opened).not.toBeNull();
    expect(opened!.id).toBe('rX');
  });

  it('a Firefox (repick) entry is NOT greyed out — it shows the honest re-pick reason', () => {
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [],
      pins: [pin({ reopen: 'repick' })],
      onOpenRecent: () => {},
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    document.body.append(view.element!);
    const btn = document.querySelector<HTMLButtonElement>('.peekover-recents__entry');
    // Still a live, clickable button (never disabled/greyed) …
    expect(btn!.disabled).toBe(false);
    expect(btn!.dataset.reopen).toBe('repick');
    // … with the plain reason so the re-pick is explained, not a dead end.
    expect(btn!.querySelector('.peekover-recents__hint')?.textContent).toBe(REPICK_HINT);
  });

  it('a folder pin shows a folder tag; clicking reopens; Unpin fires onUnpin', () => {
    let opened: PinEntryVM | null = null;
    let unpinned: PinEntryVM | null = null;
    const p = pin({ id: 'pZ', kind: 'folder', name: 'proj' });
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [],
      pins: [p],
      onOpenRecent: () => {},
      onOpenPin: (e) => (opened = e),
      onUnpin: (e) => (unpinned = e),
    });
    document.body.append(view.element!);
    const entry = document.querySelector<HTMLButtonElement>('.peekover-recents__entry')!;
    expect(entry.dataset.pinKind).toBe('folder');
    entry.click();
    expect(opened!.id).toBe('pZ');

    const unpin = document.querySelector<HTMLButtonElement>('.peekover-recents__unpin')!;
    expect(unpin.getAttribute('aria-label')).toBe('Unpin proj');
    unpin.click();
    expect(unpinned!.id).toBe('pZ');
  });

  it('sets names via textContent (a markup-y folder name cannot inject)', () => {
    const view = createRecentsView(doc, {
      repickHint: REPICK_HINT,
      recents: [],
      pins: [pin({ name: '<img src=x onerror=alert(1)>' })],
      onOpenRecent: () => {},
      onOpenPin: () => {},
      onUnpin: () => {},
    });
    document.body.append(view.element!);
    // The name is text, so no <img> element was created from it.
    expect(document.querySelector('.peekover-recents img')).toBeNull();
    expect(document.querySelector('.peekover-recents__entry')!.textContent).toContain('<img');
  });
});
