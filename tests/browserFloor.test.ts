// THE MINIMUM BROWSER VERSIONS (M13 task 7.1) — the inventory that sets them, as data.
//
// Each row is a web-platform feature with the first Chrome / Firefox version that supports it, from MDN's
// browser-compat-data 8.1.8 (2026-11-02; `__compat.support`, the earliest unflagged, unprefixed entry), and a
// detector run over Peekover's OWN shipped source (src/ and entrypoints/, tests excluded, comments stripped —
// CSS in a template literal keeps its comments, and one of them names color-mix()). The floors are the maximum
// over every row that fires and is not excluded, and the manifests must carry exactly those floors: adding a
// listed newer feature without raising the floor turns this red, and so does a floor set higher than needed.
//
// What this file cannot see, measured once at 7.1 on the built packages and recorded as fixed rows below
// (decisions.md, "M13 TASK 7.1", the feature table): the dependencies' own code (a scan of both built packages,
// each hit read in context — most are feature-detected or strings in a grammar), and the JS syntax level
// (esbuild 0.28.1 left every shipped file unchanged from Chrome 91 / Firefox 93, `\p{…}` regexes aside, which
// MDN dates to Chrome 64 / Firefox 78). A watch-list row only catches the feature it names.
//
// THE RULE (HUMAN RULING, 2026-11-06): Chrome's floor is the newest feature whose absence changes behaviour or
// appearance; Firefox's is the newest feature Peekover needs there (153 since 2026-11-10: the local-file setting and
// the call that reads it; before that 127 — the human raised it from 115, since the clipboard copies need
// ClipboardItem). Excluded rows say why.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import config from '../wxt.config';

const ROOT = join(__dirname, '..');

type Row = {
  feature: string;
  /** MDN browser-compat-data 8.1.8 path. */
  bcd: string;
  chrome: number | 'no';
  firefox: number | 'no';
  /** Fires on Peekover's own shipped source (comment-stripped), or a fixed measurement. */
  detect: RegExp | 'measured';
  /** Which engines' builds use it (a Chromium-only branch does not set Firefox's floor). */
  engines?: Array<'chrome' | 'firefox'>;
  /** Fires, but does not set a floor — and why. */
  excluded?: string;
};

const BOTH: Array<'chrome' | 'firefox'> = ['chrome', 'firefox'];

const ROWS: Row[] = [
  // ── relied on (fire today) ──────────────────────────────────────────────────────────────────────────────
  { feature: 'CSS scrollbar-color', bcd: 'css.properties.scrollbar-color', chrome: 121, firefox: 64, detect: /scrollbar-color\s*:/ },
  { feature: 'ClipboardItem', bcd: 'api.ClipboardItem', chrome: 76, firefox: 127, detect: /new ClipboardItem\(/ },
  // M13 (HUMAN RULING 2026-11-10, "raise the Firefox floor to strict_min_version 153.0"): the setting's existence sets
  // Firefox's floor. Since 153, local-file access is its own default-off setting ("Access local files on your
  // computer") and this call reports it; before 153 it always returned false (MDN browser-compat-data,
  // webextensions/api/extension.json: firefox 153 "reflects the … option", 48–153 "Always returns `false`").
  { feature: 'extension.isAllowedFileSchemeAccess() (the local-file setting)', bcd: 'webextensions.api.extension.isAllowedFileSchemeAccess', chrome: 12, firefox: 153, detect: /isAllowedFileSchemeAccess/ },
  { feature: 'Clipboard.write()', bcd: 'api.Clipboard.write', chrome: 76, firefox: 127, detect: /clipboard\??\.write\(/ },
  { feature: 'CSS color-mix()', bcd: 'css.types.color.color-mix', chrome: 111, firefox: 113, detect: /color-mix\(/ },
  { feature: 'CSS container-type', bcd: 'css.properties.container-type', chrome: 105, firefox: 110, detect: /container-type\s*:/ },
  { feature: 'CSS container query units', bcd: 'css.types.length.container_query_length_units', chrome: 105, firefox: 110, detect: /\dcq(h|w|i|b|min|max)\b/ },
  { feature: 'Object.hasOwn()', bcd: 'javascript.builtins.Object.hasOwn', chrome: 93, firefox: 92, detect: /Object\.hasOwn\(/ },
  { feature: 'CSS accent-color', bcd: 'css.properties.accent-color', chrome: 93, firefox: 92, detect: /accent-color\s*:/ },
  { feature: 'crypto.randomUUID()', bcd: 'api.Crypto.randomUUID', chrome: 92, firefox: 95, detect: /randomUUID/ },
  { feature: 'CSS aspect-ratio', bcd: 'css.properties.aspect-ratio', chrome: 88, firefox: 89, detect: /aspect-ratio\s*:/ },
  { feature: 'CSS inset', bcd: 'css.properties.inset', chrome: 87, firefox: 66, detect: /[;{\s]inset\s*:/ },
  { feature: 'Element.replaceChildren()', bcd: 'api.Element.replaceChildren', chrome: 86, firefox: 78, detect: /\.replaceChildren\(/ },
  { feature: 'CSS :focus-visible', bcd: 'css.selectors.focus-visible', chrome: 86, firefox: 85, detect: /:focus-visible/ },
  { feature: 'File System Access (folder picker, drop, write)', bcd: 'api.Window.showDirectoryPicker', chrome: 86, firefox: 'no', detect: /showDirectoryPicker/, engines: ['chrome'] },
  { feature: 'CSS gap in flex layout', bcd: 'css.properties.gap.flex_context', chrome: 84, firefox: 63, detect: /[;{\s]gap\s*:/ },
  { feature: 'webkitGetAsEntry() (folder drop)', bcd: 'api.DataTransferItem.webkitGetAsEntry', chrome: 13, firefox: 50, detect: /webkitGetAsEntry/ },
  { feature: 'HTMLDialogElement.showModal()', bcd: 'api.HTMLDialogElement.showModal', chrome: 37, firefox: 98, detect: /\.showModal\(/ },
  // ── fixed rows: the dependencies, the syntax, the extension platform (measured at 7.1) ───────────────────
  { feature: 'URL.canParse() — @braintree/sanitize-url, via Mermaid (unconditional)', bcd: 'api.URL.canParse_static', chrome: 120, firefox: 115, detect: 'measured' },
  { feature: 'JS syntax of every shipped file (esbuild 0.28.1)', bcd: '—', chrome: 91, firefox: 93, detect: 'measured' },
  { feature: 'Manifest V3 `action`', bcd: 'webextensions.manifest.action', chrome: 88, firefox: 109, detect: 'measured' },
  { feature: 'MV3 background service worker', bcd: 'webextensions.manifest.background.service_worker', chrome: 88, firefox: 'no', detect: 'measured', engines: ['chrome'] },
  // ── fire, excluded ─────────────────────────────────────────────────────────────────────────────────────
  { feature: 'CSS font-size-adjust', bcd: 'css.properties.font-size-adjust', chrome: 127, firefox: 1, detect: /font-size-adjust\s*:/,
    excluded: "Temml's math reset sets it to `none`, its initial value: no effect where unsupported" },
  { feature: 'FileSystemObserver', bcd: 'api.FileSystemObserver', chrome: 133, firefox: 'no', detect: /FileSystemObserver/,
    excluded: 'feature-detected; watch falls back to polling (contentWatch / folderSource)' },
  // ── the watch-list: newer than a floor, must not fire unless the floor rises ─────────────────────────────
  { feature: 'Set methods (union …)', bcd: 'javascript.builtins.Set.union', chrome: 122, firefox: 127, detect: /\.(union|intersection|symmetricDifference|isSubsetOf|isSupersetOf|isDisjointFrom)\(/ },
  { feature: 'Iterator helpers', bcd: 'javascript.builtins.Iterator.from', chrome: 122, firefox: 131, detect: /Iterator\.from\(|\.values\(\)\.(map|filter|take|drop|toArray|flatMap)\(/ },
  { feature: 'CSS light-dark()', bcd: 'css.types.color.light-dark', chrome: 123, firefox: 120, detect: /light-dark\(/ },
  { feature: 'CSS @starting-style', bcd: 'css.at-rules.starting-style', chrome: 117, firefox: 129, detect: /@starting-style/ },
  { feature: 'CSS @scope', bcd: 'css.at-rules.scope', chrome: 118, firefox: 146, detect: /@scope\b/ },
  { feature: 'CSS :has()', bcd: 'css.selectors.has', chrome: 105, firefox: 121, detect: /:has\(/ },
  { feature: 'CSS nesting', bcd: 'css.selectors.nesting', chrome: 120, firefox: 117, detect: /[{;]\s*&[:.[]/ },
  { feature: 'CSS @property', bcd: 'css.at-rules.property', chrome: 85, firefox: 128, detect: /@property\b/ },
  { feature: 'CSS text-wrap: balance / pretty', bcd: 'css.properties.text-wrap.balance', chrome: 114, firefox: 121, detect: /text-wrap\s*:\s*(balance|pretty)/ },
  { feature: 'CSS field-sizing', bcd: 'css.properties.field-sizing', chrome: 123, firefox: 152, detect: /field-sizing/ },
  { feature: 'CSS anchor positioning', bcd: 'css.properties.anchor-name', chrome: 125, firefox: 147, detect: /anchor-name|position-anchor|position-try/ },
  { feature: 'CSS interpolate-size', bcd: 'css.properties.interpolate-size', chrome: 129, firefox: 'no', detect: /interpolate-size/ },
  { feature: 'Popover API', bcd: 'api.HTMLElement.popover', chrome: 114, firefox: 125, detect: /showPopover|togglePopover|['"]popover['"]/ },
  { feature: 'HTMLDialogElement.requestClose()', bcd: 'api.HTMLDialogElement.requestClose', chrome: 134, firefox: 139, detect: /requestClose\(/ },
  { feature: 'URL.parse()', bcd: 'api.URL.parse_static', chrome: 126, firefox: 126, detect: /URL\.parse\(/ },
  { feature: 'Promise.withResolvers()', bcd: 'javascript.builtins.Promise.withResolvers', chrome: 119, firefox: 121, detect: /Promise\.withResolvers/ },
  { feature: 'Promise.try()', bcd: 'javascript.builtins.Promise.try', chrome: 128, firefox: 134, detect: /Promise\.try\(/ },
  { feature: 'Object.groupBy() / Map.groupBy()', bcd: 'javascript.builtins.Object.groupBy', chrome: 117, firefox: 119, detect: /(Object|Map)\.groupBy\(/ },
  { feature: 'Array.fromAsync()', bcd: 'javascript.builtins.Array.fromAsync', chrome: 121, firefox: 115, detect: /Array\.fromAsync/ },
  { feature: 'RegExp.escape()', bcd: 'javascript.builtins.RegExp.escape', chrome: 136, firefox: 134, detect: /RegExp\.escape\(/ },
  { feature: 'RegExp modifiers', bcd: 'javascript.regular_expressions.modifier', chrome: 125, firefox: 132, detect: /\(\?[ims]+(-[ims]+)?:|\(\?-[ims]+:/ },
  { feature: 'Float16Array', bcd: 'javascript.builtins.Float16Array', chrome: 135, firefox: 129, detect: /Float16Array/ },
  { feature: 'setHTMLUnsafe() / parseHTMLUnsafe()', bcd: 'api.Element.setHTMLUnsafe', chrome: 124, firefox: 123, detect: /(set|parse)HTMLUnsafe/ },
];

/** Peekover's own shipped source: src/ and entrypoints/, test files excluded. */
function shippedSource(): string {
  const parts: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|html|css)$/.test(name) && !/\.test\.ts$/.test(name)) parts.push(readFileSync(p, 'utf8'));
    }
  };
  walk(join(ROOT, 'src'));
  walk(join(ROOT, 'entrypoints'));
  // Block comments (also those inside CSS template literals), then line comments not preceded by ":" (a URL).
  return parts.join('\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

const SOURCE = shippedSource();
const fires = (r: Row): boolean => r.detect === 'measured' || r.detect.test(SOURCE);

function floor(engine: 'chrome' | 'firefox'): { version: number; set: string[] } {
  const used = ROWS.filter((r) => fires(r) && !r.excluded && (r.engines ?? BOTH).includes(engine));
  const versions = used.map((r) => r[engine]).filter((v): v is number => typeof v === 'number');
  const version = Math.max(...versions);
  return { version, set: used.filter((r) => r[engine] === version).map((r) => r.feature) };
}

type ManifestFn = (env: { browser: string }) => Record<string, unknown>;
const manifestFor = (browser: string) => (config.manifest as ManifestFn)({ browser });

describe('7.1 — the minimum browser versions are the inventory\'s maximum', () => {
  it('the detectors see the source (a firing control: the row that sets each floor fires)', () => {
    expect(SOURCE.length).toBeGreaterThan(100_000);
    expect(fires(ROWS.find((r) => r.feature === 'CSS scrollbar-color')!)).toBe(true);
    expect(fires(ROWS.find((r) => r.feature === 'ClipboardItem')!)).toBe(true);
    expect(fires(ROWS.find((r) => r.feature.startsWith('extension.isAllowedFileSchemeAccess'))!)).toBe(true);
    // A comment is not a use: READER_CSS's comment names color-mix(); the onboarding sheet uses it.
    expect(/color-mix\(/.test(SOURCE)).toBe(true);
  });

  it('every excluded row still fires (drop it when the feature goes)', () => {
    for (const r of ROWS.filter((x) => x.excluded)) expect(fires(r), r.feature).toBe(true);
  });

  it('Chrome: minimum_chrome_version is the inventory\'s maximum', () => {
    const { version, set } = floor('chrome');
    expect({ version, set }).toEqual({ version: 121, set: ['CSS scrollbar-color'] });
    expect(manifestFor('chrome').minimum_chrome_version, 'minimum_chrome_version').toBe(String(version));
  });

  it('Firefox: browser_specific_settings.gecko.strict_min_version is the inventory\'s maximum', () => {
    const { version, set } = floor('firefox');
    expect({ version, set }).toEqual({ version: 153, set: ['extension.isAllowedFileSchemeAccess() (the local-file setting)'] });
    const gecko = (manifestFor('firefox').browser_specific_settings as { gecko: Record<string, unknown> }).gecko;
    expect(gecko.strict_min_version, 'gecko.strict_min_version').toBe(`${version}.0`);
  });

  it('each floor is written only for its own engine', () => {
    expect(manifestFor('firefox').minimum_chrome_version).toBeUndefined();
    expect(manifestFor('chrome').browser_specific_settings).toBeUndefined();
  });
});
