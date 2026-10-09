// @vitest-environment jsdom
//
// unsavedGuard — the unsaved-changes dialog (012 task 6.1, ruling R23) and the one question that
// decides whether it is shown.
//
// jsdom-safe vs real-engine: the DOM shape, the ARIA wiring, which element holds focus, the key
// handling and the `inert` ATTRIBUTE are asserted here. What `inert` does — that nothing behind
// can take focus or a click — and a real Tab key are real-engine-or-nothing:
// tests/browser/editorUnsaved.browser.test.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UNSAVED_DIALOG_CLASS,
  UNSAVED_DISCARD_CLASS,
  UNSAVED_KEEP_CLASS,
  hasUnsavedEdit,
  openUnsavedDialog,
} from './unsavedGuard';
import { EDITOR_DIRTY_ATTR } from '../render/editorView';

let shell: HTMLElement;
let header: HTMLElement;
let main: HTMLElement;
let opener: HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = '';
  shell = document.createElement('div');
  header = document.createElement('header');
  main = document.createElement('div');
  opener = document.createElement('button');
  main.append(opener);
  shell.append(header, main);
  document.body.append(shell);
});

afterEach(() => {
  document.body.innerHTML = '';
});

const dialog = (): HTMLElement | null => shell.querySelector<HTMLElement>(`.${UNSAVED_DIALOG_CLASS}`);
const keep = (): HTMLElement => shell.querySelector<HTMLElement>(`.${UNSAVED_KEEP_CLASS}`)!;
const discard = (): HTMLElement => shell.querySelector<HTMLElement>(`.${UNSAVED_DISCARD_CLASS}`)!;

function open(fileName = 'notes.md') {
  const answers = { onKeep: vi.fn(), onDiscard: vi.fn() };
  openUnsavedDialog(shell, fileName, answers);
  return answers;
}

const press = (target: Element, key: string, shiftKey = false): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

describe('hasUnsavedEdit — when the guard asks', () => {
  const host = (mode: string | null, dirty: boolean): HTMLElement => {
    const el = document.createElement('div');
    if (mode) el.setAttribute('data-mode', mode);
    if (dirty) el.setAttribute(EDITOR_DIRTY_ATTR, 'true');
    return el;
  };

  it('★ asks only for a host that is in edit AND carries the dirty attribute', () => {
    expect(hasUnsavedEdit(host('edit', true))).toBe(true);
  });

  it('★ a clean edit session, a reading view and no host at all ask nothing', () => {
    expect(hasUnsavedEdit(host('edit', false))).toBe(false);
    expect(hasUnsavedEdit(host('reading', false))).toBe(false);
    expect(hasUnsavedEdit(host('raw', false))).toBe(false);
    expect(hasUnsavedEdit(null)).toBe(false);
    expect(hasUnsavedEdit(undefined)).toBe(false);
  });

  it('a dirty attribute left on a host that is no longer in edit asks nothing', () => {
    expect(hasUnsavedEdit(host('reading', true))).toBe(false);
  });
});

describe('openUnsavedDialog — the dialog (R23)', () => {
  it('the class literals are the ones the real-engine suite finds it by', () => {
    expect(UNSAVED_DIALOG_CLASS).toBe('peekover-unsaved');
    expect(UNSAVED_KEEP_CLASS).toBe('peekover-unsaved__keep');
    expect(UNSAVED_DISCARD_CLASS).toBe('peekover-unsaved__discard');
  });

  it('★ is a modal dialog inside the shell, named and described by its own text, naming the file', () => {
    open('notes.md');
    const el = dialog()!;
    expect(el.parentElement).toBe(shell);
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(el.getAttribute('aria-labelledby')!)!;
    const body = document.getElementById(el.getAttribute('aria-describedby')!)!;
    expect(el.contains(title) && el.contains(body)).toBe(true);
    expect(title.textContent).toBe('Discard unsaved edits?');
    expect(body.textContent).toBe(
      '“notes.md” has edits that are not saved to the file in its folder. If you discard them, they are gone.',
    );
  });

  it('with no file name it says "This document"', () => {
    openUnsavedDialog(shell, undefined, { onKeep: vi.fn(), onDiscard: vi.fn() });
    const el = dialog()!;
    expect(document.getElementById(el.getAttribute('aria-describedby')!)!.textContent).toBe(
      'This document has edits that are not saved to the file in its folder. If you discard them, they are gone.',
    );
  });

  it('a file name is text, never markup', () => {
    open('<img src=x onerror=alert(1)>.md');
    expect(dialog()!.querySelector('img')).toBeNull();
    expect(dialog()!.textContent).toContain('<img src=x onerror=alert(1)>.md');
  });

  it('★ two real buttons, the state of each in its text; "Keep editing" is first and has focus', () => {
    open();
    for (const button of [keep(), discard()]) {
      expect(button.tagName).toBe('BUTTON'); // selected by class alone
      expect((button as HTMLButtonElement).type).toBe('button');
    }
    expect(keep().textContent).toBe('Keep editing');
    expect(discard().textContent).toBe('Discard edits');
    expect(document.activeElement).toBe(keep());
  });

  it('★ the rest of the shell is inert while it is open, and only for that long', () => {
    main.setAttribute('data-untouched', '');
    open();
    expect(header.hasAttribute('inert')).toBe(true);
    expect(main.hasAttribute('inert')).toBe(true);
    expect(dialog()!.hasAttribute('inert')).toBe(false);
    keep().click();
    expect(header.hasAttribute('inert')).toBe(false);
    expect(main.hasAttribute('inert')).toBe(false);
    expect(main.hasAttribute('data-untouched')).toBe(true);
  });

  it('an element that was ALREADY inert stays inert afterwards', () => {
    header.setAttribute('inert', '');
    open();
    discard().click();
    expect(header.hasAttribute('inert')).toBe(true);
    expect(main.hasAttribute('inert')).toBe(false);
  });

  it('★ "Keep editing" closes it, answers keep and nothing else, and puts focus back', () => {
    opener.focus();
    const answers = open();
    keep().click();
    expect(dialog()).toBeNull();
    expect(answers.onKeep).toHaveBeenCalledTimes(1);
    expect(answers.onDiscard).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });

  it('★ Escape is "Keep editing"', () => {
    opener.focus();
    const answers = open();
    const event = press(keep(), 'Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(dialog()).toBeNull();
    expect(answers.onKeep).toHaveBeenCalledTimes(1);
    expect(answers.onDiscard).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });

  it('★ "Discard edits" answers discard — once the dialog is closed and the page is live again', () => {
    let seen: { open: boolean; inert: boolean } | null = null;
    const onDiscard = vi.fn(() => {
      seen = { open: dialog() !== null, inert: main.hasAttribute('inert') };
    });
    const onKeep = vi.fn();
    openUnsavedDialog(shell, 'notes.md', { onKeep, onDiscard });
    discard().click();
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onKeep).not.toHaveBeenCalled();
    expect(seen).toEqual({ open: false, inert: false });
  });

  it('★ Tab from the last button wraps to the first, and Shift+Tab from the first to the last', () => {
    open();
    discard().focus();
    const forward = press(discard(), 'Tab');
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(keep());

    const back = press(keep(), 'Tab', true);
    expect(back.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(discard());
  });

  it('Tab between the two buttons is the browser’s own move — not prevented', () => {
    open();
    expect(press(keep(), 'Tab').defaultPrevented).toBe(false);
    discard().focus();
    expect(press(discard(), 'Tab', true).defaultPrevented).toBe(false);
  });

  it('focus that was inside a shadow root goes back INTO it', () => {
    const host = document.createElement('div');
    main.append(host);
    const inner = document.createElement('button');
    host.attachShadow({ mode: 'open' }).append(inner);
    inner.focus();
    open();
    keep().click();
    expect(host.shadowRoot!.activeElement).toBe(inner);
  });

  it('an answer is given once: a second click on a closed dialog’s button does nothing', () => {
    const answers = open();
    const button = discard();
    button.click();
    button.click();
    expect(answers.onDiscard).toHaveBeenCalledTimes(1);
  });
});
