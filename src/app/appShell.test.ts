// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountAppShell } from './appShell';
import type { ReaderFile } from './readerPane';

// Task 1.1: the app-page surface EXISTS and renders its skeleton + empty state.
// (The reader/folder behaviour is later tasks; here we only pin that the shell mounts
// the three panes and the inert affordance, so the toolbar action opens something
// real — never a blank page, AGENTS.md #5.)
//
// Task 1.2: the shell wires selection → the reader pane. selectFile() renders a fed
// file through the unchanged M1 mount(), and empty/unreadable/no-selection each show a
// designed never-blank state [§9 select-file-renders; §9 empty designed state, jsdom
// half — real cancel/deny is the 6.3 human gate].

describe('appShell (task 1.1 skeleton)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders header, folder pane, reader pane', () => {
    mountAppShell(container);
    expect(container.querySelector('.peekover-app__header')).not.toBeNull();
    expect(container.querySelector('.peekover-app__folders')).not.toBeNull();
    expect(container.querySelector('.peekover-app__reader')).not.toBeNull();
  });

  it('shows the inert "Open a folder to begin" empty state', () => {
    mountAppShell(container);
    expect(container.textContent).toContain('Open a folder to begin');
    const cta = container.querySelector<HTMLButtonElement>('.peekover-app__cta');
    expect(cta).not.toBeNull();
    // Inert this task — behaviour is wired in task 3, marked so it can't read as live.
    expect(cta!.getAttribute('data-peekover-inert')).toBe('true');
  });

  it('is idempotent — a second mount replaces, never duplicates', () => {
    mountAppShell(container);
    mountAppShell(container);
    expect(container.querySelectorAll('.peekover-app').length).toBe(1);
  });
});

describe('appShell (task 1.2 reader wiring + designed states)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  function fileWith(text: string, name = 'doc.md'): ReaderFile {
    return { name, read: async () => text };
  }

  it('starts with the reader pane in the designed no-selection state (never blank)', () => {
    mountAppShell(container);
    const reader = container.querySelector('.peekover-app__reader');
    expect(reader).not.toBeNull();
    expect(reader!.querySelector('[data-state="no-selection"]')).not.toBeNull();
    expect(reader!.textContent?.trim()).not.toBe('');
  });

  it('selectFile() renders a fed file through the unchanged M1 mount() pipeline', async () => {
    const app = mountAppShell(container);
    await app.selectFile(fileWith('# Fed heading\n\nbody'));

    const host = container.querySelector<HTMLElement>('.peekover-app__reader__host');
    expect(host).not.toBeNull();
    expect(host!.shadowRoot?.querySelector('h1')?.textContent).toContain('Fed heading');
  });

  it('selectFile() with an empty file shows the designed empty state', async () => {
    const app = mountAppShell(container);
    await app.selectFile(fileWith('', 'blank.md'));

    const state = container.querySelector('.peekover-app__reader [data-state="empty-file"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('blank.md');
    expect(container.querySelector('.peekover-app__reader__host')).toBeNull();
  });

  it('selectFile() with an unreadable file shows the designed error state (never blank)', async () => {
    const app = mountAppShell(container);
    await app.selectFile({
      name: 'gone.md',
      read: async () => {
        throw new Error('revoked');
      },
    });

    const state = container.querySelector('.peekover-app__reader [data-state="unreadable"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('gone.md');
    expect(container.querySelector('.peekover-app__reader__host')).toBeNull();
  });
});
