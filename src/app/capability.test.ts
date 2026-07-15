// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  IDLE_GRANT,
  grant,
  revoke,
  buildGrantChip,
  GRANT_PROMPT_LINE,
  CHIP_CLASS,
} from './capability';

// Task 3.2 — the at-use grant STATE + chip. The state transitions are pure (no DOM); the
// chip is a small renderer that reads the state. The trust invariants proved here: the
// plain-language line discloses on-device/no-network/revocable; the chip is present only
// when granted, names the folder via textContent (never innerHTML), and its revoke button
// actually invokes the caller's revoke handler.

describe('grant state (pure)', () => {
  it('idle is the starting/after-revoke state', () => {
    expect(IDLE_GRANT).toEqual({ status: 'idle' });
    expect(revoke()).toEqual({ status: 'idle' });
  });

  it('grant(name) carries the folder name', () => {
    expect(grant('my-notes')).toEqual({ status: 'granted', name: 'my-notes' });
  });
});

describe('GRANT_PROMPT_LINE — the plain-language line before the picker', () => {
  it('discloses on-device / no-network / revocable in plain language', () => {
    expect(GRANT_PROMPT_LINE).toMatch(/device/i);
    expect(GRANT_PROMPT_LINE).toMatch(/no upload|no network/i);
    expect(GRANT_PROMPT_LINE).toMatch(/revoke/i);
  });
});

describe('buildGrantChip', () => {
  it('returns null when idle (no chip to show)', () => {
    expect(buildGrantChip(document, IDLE_GRANT, () => {})).toBeNull();
  });

  it('renders "granted: <name>" with a revoke button when granted', () => {
    const chip = buildGrantChip(document, grant('project-docs'), () => {});
    expect(chip).not.toBeNull();
    expect(chip!.classList.contains(CHIP_CLASS)).toBe(true);
    expect(chip!.textContent).toContain('granted:');
    expect(chip!.querySelector(`.${CHIP_CLASS}-name`)?.textContent).toBe('project-docs');
    const btn = chip!.querySelector<HTMLButtonElement>(`.${CHIP_CLASS}-revoke`);
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('aria-label')).toContain('project-docs');
  });

  it('sets the folder name via textContent (no HTML injection from a folder name)', () => {
    const chip = buildGrantChip(document, grant('<img src=x onerror=alert(1)>'), () => {});
    const nameEl = chip!.querySelector(`.${CHIP_CLASS}-name`);
    // The name is inert text — no <img> element was created from it.
    expect(nameEl!.querySelector('img')).toBeNull();
    expect(nameEl!.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('the revoke button invokes the caller-supplied handler', () => {
    let called = 0;
    const chip = buildGrantChip(document, grant('n'), () => {
      called += 1;
    });
    chip!.querySelector<HTMLButtonElement>(`.${CHIP_CLASS}-revoke`)!.click();
    expect(called).toBe(1);
  });
});
