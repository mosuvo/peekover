// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mountAppShell } from './appShell';

// Task 1.1: the app-page surface EXISTS and renders its skeleton + empty state.
// (The reader/folder behaviour is later tasks; here we only pin that the shell mounts
// the three panes and the inert affordance, so the toolbar action opens something
// real — never a blank page, AGENTS.md #5.)

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
