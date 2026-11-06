import { describe, it, expect } from 'vitest';
import config from '../wxt.config';
import pkg from '../package.json';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The zero-permission TRUST PIN (AGENTS.md #4 · spec 002 §9 built-manifest).
//
// `permissions: []` is the brand, not a preference — it must survive EVERY future
// change and fail LOUDLY the moment a permission, host grant, WAR, webRequest, or
// tabs entry creeps in. This asserts on the CONFIG-DERIVED manifest for BOTH browser
// variants, deliberately, because that is the drift surface: a permission would be
// authored in wxt.config.ts (or a browser-gated block), and CI runs the unit project
// BEFORE any build and never builds Firefox — so reading .output/*/manifest.json here
// would be vacuous in CI. The GENERATED build was empirically re-proven to match this
// (both engines, `permissions: []`, `action` the only add, no forbidden keys) at
// task-1.1 time; this test guards the source so generation can't silently drift.
//
// If Peekover ever legitimately needs a permission, this test breaks on purpose:
// update it in the SAME PR as the manifest change and PERMISSIONS.md (AGENTS.md #4).

type ManifestEnv = { browser: string; manifestVersion?: number; mode?: string; command?: string };
type ManifestFn = (env: ManifestEnv) => Record<string, unknown>;

function manifestFor(browser: string): Record<string, unknown> {
  const fn = config.manifest;
  if (typeof fn !== 'function') {
    throw new Error('wxt.config.ts `manifest` must be a function (per-browser variant)');
  }
  return (fn as ManifestFn)({ browser });
}

/** Manifest keys that would each represent a capability escalation — none may appear. */
const FORBIDDEN_KEYS = ['host_permissions', 'web_accessible_resources', 'webRequest'] as const;

describe.each(['chrome', 'firefox'])('manifest zero-permission trust-pin (%s)', (browser) => {
  const m = manifestFor(browser);

  it('declares permissions: [] (present and empty)', () => {
    expect(Array.isArray(m.permissions)).toBe(true);
    expect(m.permissions).toEqual([]);
  });

  it('grants no host_permissions / web_accessible_resources / webRequest', () => {
    for (const key of FORBIDDEN_KEYS) {
      expect(m[key], `forbidden manifest key present: ${key}`).toBeUndefined();
    }
  });

  it('requests no tabs / webRequest permission (permissions list stays capability-free)', () => {
    const perms = m.permissions as unknown[];
    expect(perms).not.toContain('tabs');
    expect(perms).not.toContain('webRequest');
    expect(perms).not.toContain('activeTab');
    expect(perms).not.toContain('scripting');
  });

  it('adds the toolbar action — the ONLY new manifest key in 002/1.1 — with no popup', () => {
    expect(m.action, 'action key missing').toBeDefined();
    const action = m.action as Record<string, unknown>;
    expect(action.default_title).toBe('Open Peekover');
    // No default_popup: a click fires background action.onClicked → tabs.create.
    expect(action.default_popup).toBeUndefined();
  });

  // 013 task 2.6 (plan D-15; gate-2 G-14 authorizes this ADDITIVE edit). `icons` and
  // `action.default_icon` are manifest keys, not permissions (PERMISSIONS.md records both).
  // PNG only: Chrome supports no SVG or WebP here. The files' pixel sizes: tests/icons.test.ts.
  it('declares the icon as PNG at 16 / 32 / 48 / 128, and the toolbar icon at 16 / 32', () => {
    expect(m.icons, 'icons key missing').toEqual({
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    });
    const action = m.action as Record<string, unknown>;
    expect(action.default_icon, 'action.default_icon missing').toEqual({
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    });
  });
});

// 013 task 7.1 (gate-1 Q1; ADDITIVE, G-14). The version has ONE source, `package.json`: the config writes no
// `version` / `version_name`, so WXT copies package.json's into both built manifests. When `.output` holds a
// build, each built manifest's version is read and must equal package.json's (CI builds after the unit run, so
// there the built half finds nothing to read; locally both engines are built before Verify).
describe('the version (013 task 7.1)', () => {
  it('package.json says 0.1.0', () => {
    expect(pkg.version).toBe('0.1.0');
  });

  it.each(['chrome', 'firefox'])('the %s config writes no version of its own', (browser) => {
    const m = manifestFor(browser);
    expect(m.version).toBeUndefined();
    expect(m.version_name).toBeUndefined();
  });

  it('every built manifest under .output carries package.json\'s version', () => {
    const dir = join(__dirname, '..', '.output');
    const built = existsSync(dir)
      ? readdirSync(dir).map((d) => join(dir, d, 'manifest.json')).filter((p) => existsSync(p))
      : [];
    for (const p of built) {
      expect((JSON.parse(readFileSync(p, 'utf8')) as { version: string }).version, p).toBe(pkg.version);
    }
  });
});
