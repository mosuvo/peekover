// capability — the at-use grant flow made tangible. Folder access is a user-gesture web
// API, so it appears in NO manifest permission list and shows NO install-time warning
// (Task 0). That is exactly WHY the real consent has to be at-use, visible, and revocable:
// this module is that trust story in code — a plain-language line shown BEFORE the picker,
// and a persistent "granted: <folder> — revoke" chip that actually drops the handle +
// record when clicked (spec 002 §3.2; AGENTS.md #4).
//
// PURE/DOM split (M1 discipline): the grant STATE is a tiny pure value + transitions
// (idle → granted:name → idle-on-revoke), unit-testable with no DOM; the chip is a small
// separate renderer that reads that state. appShell owns the wiring (what revoke actually
// deletes); this module owns the state shape and the chip's markup.

/** The grant state. `idle` before/after access; `granted` while a folder is open. */
export type GrantState =
  | { status: 'idle' }
  | { status: 'granted'; name: string };

/** The idle state (before any grant, and what revoke returns to). */
export const IDLE_GRANT: GrantState = { status: 'idle' };

/** PURE transition: a folder named `name` was granted. */
export function grant(name: string): GrantState {
  return { status: 'granted', name };
}

/** PURE transition: access revoked → back to idle. (appShell drops the handle + record.) */
export function revoke(): GrantState {
  return IDLE_GRANT;
}

/**
 * The plain-language line shown BEFORE the picker (the trust moment). States plainly that
 * the read is on-device with no network, and that access is revocable — so the user reads
 * what will happen before the one gesture that grants it.
 */
export const GRANT_PROMPT_LINE =
  'Peekover reads the folder you pick on this device only — no upload, no network — and you can revoke access anytime.';

/** CSS class for the grant chip; scoped under the shell like every other app-page class. */
export const CHIP_CLASS = 'peekover-app__chip';

/**
 * Build the persistent "granted: <name> — revoke" chip for a granted state, or `null` when
 * idle (no chip to show). The revoke button calls `onRevoke` — appShell wires that to drop
 * the in-memory handle AND delete the stored folder record, so revoke is real, not cosmetic.
 * The folder name is set via `textContent` (never innerHTML), so a folder named with markup
 * characters can never inject (AGENTS.md #3 posture, even for local names).
 */
export function buildGrantChip(
  doc: Document,
  state: GrantState,
  onRevoke: () => void,
): HTMLElement | null {
  if (state.status !== 'granted') return null;

  const chip = doc.createElement('div');
  chip.className = CHIP_CLASS;
  chip.setAttribute('role', 'status');

  const label = doc.createElement('span');
  label.className = `${CHIP_CLASS}-label`;
  // "granted: " prefix in its own node so screen readers read the whole status line.
  const prefix = doc.createElement('span');
  prefix.className = `${CHIP_CLASS}-prefix`;
  prefix.textContent = 'granted: ';
  const name = doc.createElement('span');
  name.className = `${CHIP_CLASS}-name`;
  name.textContent = state.name;
  label.append(prefix, name);

  const revokeBtn = doc.createElement('button');
  revokeBtn.type = 'button';
  revokeBtn.className = `${CHIP_CLASS}-revoke`;
  revokeBtn.textContent = 'Revoke';
  revokeBtn.setAttribute('aria-label', `Revoke access to ${state.name}`);
  revokeBtn.addEventListener('click', onRevoke);

  chip.append(label, revokeBtn);
  return chip;
}
