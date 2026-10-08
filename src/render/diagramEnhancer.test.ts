// @vitest-environment jsdom
//
// The synchronous prologue (007 task 3.1) and the state machine around the async body (3.2), built
// over the REAL mount() output so the fence seam is exercised rather than hand-mocked.
//
// The 3.1 blocks involve no engine at all: what is under test there is the shape a document is left
// in when nothing further ever happens to it. That state is not a placeholder for a test — it IS
// the shipped degraded state (§3.8, §4, AGENTS.md #5), which is why it gets asserted directly. The
// 3.2 blocks inject a FAKE engine, for the reason `diagramEngine.ts` made the loader injectable:
// jsdom cannot lay out an SVG, so a real mermaid here would prove nothing about a renderer that
// measures glyphs, while the D-15 state machine around it is exactly what a fake can drive.
//
// The jsdom limit is respected throughout: every assertion here is DOM SHAPE. Whether the CSS rule
// actually hides the source <pre>, whether the figure lands inside the reading column's box, and
// everything that depends on real engine OUTPUT (the adopted `<style>`, `foreignObject`, the
// container's lifetime under a real render) are questions jsdom cannot answer — they live in
// tests/browser/diagramRender.browser.test.ts on both engines.

import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mount } from './mount';
import {
  DIAGRAM_FENCE_SELECTOR,
  DIAGRAM_MEASURE_CLASS,
  diagramFencesIn,
  diagramSourceOf,
  enhanceDiagrams,
  hasDiagramMath,
  hasRemoteReference,
} from './diagramEnhancer';
import {
  DIAGRAM_FENCE_SELECTOR as ENGINE_FENCE_SELECTOR,
  loadDiagramEngine,
} from './diagramEngine';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
  insertDiagramPlaceholder,
  markDiagramFailed,
  markDiagramRendered,
} from './diagramView';
import type { DiagramEngine, DiagramEngineModule } from './diagramEngine';

const HOST_TAG = 'peekover-root';
const FIGURE_SELECTOR = `figure.${DIAGRAM_FIGURE_CLASS}`;

/** Hosts are removed between tests: the async body reaches into `document.body` for its measuring
 *  container (D-6 step 1), so a stale host from a previous test is a stale document to query. */
const mounted: HTMLElement[] = [];
afterEach(() => {
  for (const host of mounted.splice(0)) host.remove();
});

/** A real mounted reader: parse -> sanitize -> shadow DOM, exactly as the app page commits it. */
function mountedHost(markdown: string): { host: HTMLElement; shadow: ShadowRoot } {
  const host = document.createElement(HOST_TAG);
  document.body.appendChild(host);
  mounted.push(host);
  mount(markdown, host, { contained: true });
  const shadow = host.shadowRoot;
  if (!shadow) throw new Error('mount() produced no shadow root');
  return { host, shadow };
}

const fence = (lang: string, body: string): string => '```' + lang + '\n' + body + '\n```\n';

describe('the fence predicate', () => {
  it('matches language-mermaid and not language-js or a bare code block', () => {
    const { shadow } = mountedHost(
      '# Doc\n\n' +
        fence('mermaid', 'graph TD; A-->B;') +
        '\n' +
        fence('js', 'const a = 1;') +
        '\n' +
        '    an indented block\n\n' +
        'Some `inline code` in prose.\n',
    );

    const fences = diagramFencesIn(shadow);
    expect(fences).toHaveLength(1);
    expect(fences[0].tagName).toBe('PRE');
    expect(fences[0].querySelector('code')?.className).toBe('language-mermaid');

    // The control that makes the count meaningful: the document really does contain other code
    // blocks, so "1" is a discrimination and not an empty instrument.
    expect(shadow.querySelectorAll('pre > code').length).toBeGreaterThan(1);
    expect(shadow.querySelectorAll('code.language-js')).toHaveLength(1);
  });

  it('takes its selector FROM diagramEngine — 3.1s duplicate copy is gone', () => {
    // At 3.1 these were two declarations pinned equal, because importing diagramEngine was what
    // would have put mermaid's chunk on the app-page graph before there was a task to account for
    // its bytes. 3.2 imports the engine for real, so the enhancer re-exports the constant instead
    // of restating it and the drift this pin guarded against is now unrepresentable.
    expect(DIAGRAM_FENCE_SELECTOR).toBe(ENGINE_FENCE_SELECTOR);
    expect(DIAGRAM_FENCE_SELECTOR).toBe('pre > code.language-mermaid');
  });
});

describe('the synchronous prologue', () => {
  it('leaves D-15 structure in the DOM before any microtask can run', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0); // pre-state

    const returned: unknown = enhanceDiagrams(host);

    // Already committed, in the SAME synchronous tick as the call — this is D-12's cooldown
    // constraint and §4's pre-paint half. A function that awaited anything would fail here.
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(returned).toBeUndefined();
    expect(returned).not.toBeInstanceOf(Promise);
  });

  it('builds the figure as a SIBLING of the source pre, both marked pending', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected a fence and a figure');

    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.parentElement).toBe(pre.parentElement);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');

    // Row 18 — an empty box has nothing to announce.
    expect(figure.getAttribute('aria-hidden')).toBe('true');
    expect(figure.childNodes).toHaveLength(0);

    // The reading column, not a detached corner of the shadow root (the browser suite asserts the
    // geometric half of this; the containment relation is checkable here).
    expect(figure.closest('.peekover-reader')).not.toBeNull();
  });

  it('CONTROL: a fence-free document grows no structure at all', () => {
    const { host, shadow } = mountedHost('# Doc\n\n' + fence('js', 'const a = 1;'));
    enhanceDiagrams(host);

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('CONTROL: an unenhanced mount of the same markdown has no structure either', () => {
    // The presence assertions above are only results if the structure is absent when the enhancer
    // is not called. Same input, same mount, no call.
    const { shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(shadow.querySelectorAll(`[${DIAGRAM_STATE_ATTR}]`)).toHaveLength(0);
  });

  it('no-ops on a host with no shadow root, and is idempotent over an enhanced tree', () => {
    expect(() => enhanceDiagrams(document.createElement('div'))).not.toThrow();

    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);
    enhanceDiagrams(host);
    enhanceDiagrams(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
  });

  it('enhances every fence in a multi-diagram document', () => {
    const { host, shadow } = mountedHost(
      fence('mermaid', 'graph TD; A-->B;') +
        '\n' +
        fence('js', 'const a = 1;') +
        '\n' +
        fence('mermaid', 'sequenceDiagram; A->>B: hi'),
    );
    enhanceDiagrams(host);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(2);
  });
});

describe('the diagram source is read as TEXT, never as markup', () => {
  // The one security-adjacent assertion in 3.1. The fence body below is chosen so that assigning
  // it as markup ANYWHERE would be observable: the <img onerror> fires on a real engine and
  // materialises an <img> element in jsdom, and the </pre><script> sequence would break out of the
  // retained fence if the source were ever re-serialised into innerHTML. The whole point of D-15
  // retaining mount()'s already-sanitized <pre> is that no such assignment exists to reach.
  const PAYLOAD = 'graph TD; A["<img src=x onerror=alert(1)>"]--></pre><script>alert(2)</script>';

  it('round-trips a markup payload through textContent with nothing parsed', () => {
    const { host, shadow } = mountedHost(fence('mermaid', PAYLOAD));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the source fence to be retained');

    // Read back byte-for-byte: this is what 3.2 will hand the engine, and it is text. The trailing
    // newline is markdown-it's fence terminator, not ours — pinned rather than trimmed, because
    // trimming here would be this module quietly editing the source it is supposed to only read.
    expect(diagramSourceOf(pre)).toBe(PAYLOAD + '\n');

    // Nothing was parsed. If any stage had assigned this as markup, at least one of these fires.
    expect(shadow.querySelector('img')).toBeNull();
    expect(shadow.querySelector('script')).toBeNull();
    expect(shadow.querySelectorAll('pre')).toHaveLength(1);

    // The placeholder received no content — the source went nowhere near it.
    expect(shadow.querySelector(FIGURE_SELECTOR)?.childNodes).toHaveLength(0);

    // CONTROL: the payload really is present as text, so the nulls above are a result and not an
    // artefact of the fence having been dropped somewhere upstream.
    expect(pre.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(pre.textContent).toContain('<script>');
  });

  it('CONTROL: the same payload assigned as markup DOES materialise an img', () => {
    // Proves the instrument fires. Assigned into an inert <template> so this control cannot itself
    // put anything on the wire (mount.ts:119-129's standing lesson).
    const tpl = document.createElement('template');
    tpl.innerHTML = PAYLOAD;
    expect(tpl.content.querySelector('img')).not.toBeNull();
  });
});

describe("D-15's states", () => {
  it('rendered: content committed, source marked hidden, both still in the tree', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    markDiagramRendered(pre, figure, svg);

    expect(figure.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(figure.hasAttribute('aria-hidden')).toBe(false);
    expect(figure.firstElementChild).toBe(svg);

    // NEVER REMOVED — both halves. The <pre> is still in the document and still holds its source;
    // only its state attribute changed, and CSS does the rest (asserted for real in the browser).
    expect(pre.isConnected).toBe(true);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(diagramSourceOf(pre)).toBe('graph TD; A-->B;\n');
  });

  it('failed: the placeholder goes, the source fence stays visible', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    markDiagramFailed(pre, figure, 'the test said so');

    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
    expect(pre.isConnected).toBe(true);
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    // `failed` is not `rendered`, which is the only value the stylesheet hides.
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).not.toBe('rendered');

    // §4's inline marker: it took the figure's slot and it NAMES the failure.
    const marker = pre.nextElementSibling;
    expect(marker?.className).toBe(DIAGRAM_ERROR_CLASS);
    expect(marker?.textContent).toContain('the test said so');
  });

  it('a second failure replaces the marker rather than stacking a second one', () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    if (!pre || !figure) throw new Error('expected the enhanced pair');

    markDiagramFailed(pre, figure, 'first reason');
    markDiagramFailed(pre, figure, 'second reason');

    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(1);
    expect(pre.nextElementSibling?.textContent).toContain('second reason');
  });

  it('the never-rendered document degrades by construction, not by a catch block', () => {
    // The engine is not wired at 3.1, so this is literally what a user sees today — and what they
    // would still see if the engine never loaded (§3.8's first failure, group 6.1's subject).
    const { host, shadow } = mountedHost('Prose.\n\n' + fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host);

    const pre = shadow.querySelector('pre');
    expect(pre?.isConnected).toBe(true);
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
    expect(pre?.textContent).toContain('graph TD; A-->B;');
    expect(shadow.textContent).toContain('Prose.');
  });

  it('insertDiagramPlaceholder places the figure after the pre in a plain tree', () => {
    // The view module standing alone, with no mount and no enhancer — the unit under the unit.
    const parent = document.createElement('div');
    parent.innerHTML = '<pre><code class="language-mermaid">x</code></pre><p>after</p>';
    const pre = parent.querySelector('pre');
    if (!pre) throw new Error('fixture');

    const figure = insertDiagramPlaceholder(pre);
    expect(pre.nextElementSibling).toBe(figure);
    expect(figure.nextElementSibling?.tagName).toBe('P');
  });
});

// ── The async body (007 task 3.2), driven with an INJECTED engine ────────────────────────────
//
// SCOPE, STATED. The engine here is a fake: jsdom cannot lay out an SVG, and importing real
// mermaid into it would prove nothing about a renderer that measures glyphs. What these DO reach —
// and reach cheaply, on every `pnpm test` — is the STATE MACHINE around the engine: which of D-15's
// states each of §3.8's three failures lands in, whether one fence's failure reaches another, and
// that the sanitize step is the REAL `sanitizeSvg` rather than a pass-through. The end-to-end
// proof over the real engine (adoption, the container's lifetime, `bindFunctions`, the inert
// `<style>`) is `tests/browser/diagramRender.browser.test.ts`, on both engines.

/** Let the enhancer's async body run to completion — it is deliberately not awaitable. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await new Promise<void>((r) => setTimeout(r, 0));
}

/** An engine module whose `render` returns whatever `svgFor` says, per call. */
function fakeEngine(svgFor: (definition: string) => string): {
  module: DiagramEngineModule;
  render: ReturnType<typeof vi.fn>;
  bindFunctions: ReturnType<typeof vi.fn>;
} {
  const bindFunctions = vi.fn();
  const render = vi.fn(async (_id: string, definition: string) => ({
    svg: svgFor(definition),
    bindFunctions,
  }));
  const engine: DiagramEngine = { initialize: vi.fn(), render } as unknown as DiagramEngine;
  return { module: { default: engine } as DiagramEngineModule, render, bindFunctions };
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><g/></svg>';

describe('the async body — the happy path', () => {
  it('adopts the sanitized SVG into the figure and flips both halves to rendered', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const { module, render, bindFunctions } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const pre = shadow.querySelector('pre');
    const figure = shadow.querySelector<HTMLElement>(FIGURE_SELECTOR);
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(figure?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(figure?.querySelector('svg')).not.toBeNull();

    // The engine got the fence's TEXT, byte for byte — not markup, not a re-serialization.
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][1]).toBe('graph TD; A-->B;\n');

    // D-6 step 5: never called. The control that it COULD have been is below.
    expect(bindFunctions).toHaveBeenCalledTimes(0);

    // Source retained, per D-15 — the marker exists nowhere on a success.
    expect(pre?.isConnected).toBe(true);
    expect(diagramSourceOf(pre!)).toBe('graph TD; A-->B;\n');
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  });

  it('CONTROL: the bindFunctions spy records when something DOES call it', async () => {
    // Without this, "0 calls" is equally consistent with a spy that was never wired up.
    const { module, bindFunctions } = fakeEngine(() => SVG);
    const result = await module.default.render('id', 'graph TD; A-->B;');
    result.bindFunctions?.(document.createElement('div'));
    expect(bindFunctions).toHaveBeenCalledTimes(1);
  });

  it('leaves the engine unloaded on a fence-free document (§4s feature detect)', async () => {
    const { host } = mountedHost('# Doc\n\n' + fence('js', 'const a = 1;'));
    const loader = vi.fn(async () => fakeEngine(() => SVG).module);

    enhanceDiagrams(host, { loader });
    await settle();

    expect(loader).toHaveBeenCalledTimes(0);
  });
});

describe('§3.8s three failures all land on the visible source fence', () => {
  const FAILING_DOC = fence('mermaid', 'bad one') + '\n' + fence('mermaid', 'good one');

  /** Every failure assertion needs this: the SAME harness hides the source when it succeeds. */
  async function successControl(): Promise<{ pre: HTMLElement; shadow: ShadowRoot }> {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    enhanceDiagrams(host, { loader: async () => fakeEngine(() => SVG).module });
    await settle();
    const pre = shadow.querySelector('pre');
    if (!pre) throw new Error('expected the retained fence');
    expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    return { pre, shadow };
  }

  it('CONTROL: the success path really does reach `rendered` in this harness', async () => {
    const { shadow } = await successControl();
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  });

  it('engine load: every fence stays visible, each with a marker naming the load failure', async () => {
    // The code path is 3.2's; the full proof — no stranded placeholder, page interactive — is 6.1's.
    const { host, shadow } = mountedHost(FAILING_DOC);
    enhanceDiagrams(host, { loader: async () => { throw new Error('chunk unavailable'); } });
    await settle();

    const pres = [...shadow.querySelectorAll('pre[data-diagram]')];
    expect(pres).toHaveLength(2);
    for (const pre of pres) expect(pre.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0); // nothing stranded
    const markers = [...shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)];
    expect(markers).toHaveLength(2);
    expect(markers[0].textContent).toContain('engine could not be loaded');
  });

  it('parse/render: the bad fence degrades and the OTHER one renders normally (§4)', async () => {
    const { host, shadow } = mountedHost(FAILING_DOC);
    const module = fakeEngine((definition) => {
      if (definition.includes('bad')) throw new Error('Parse error');
      return SVG;
    }).module;

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const [bad, good] = [...shadow.querySelectorAll('pre[data-diagram]')];
    expect(bad.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(bad.nextElementSibling?.textContent).toContain('could not be drawn');
    // THE ISOLATION CLAIM: one fence's failure did not reach the next one.
    expect(good.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(shadow.querySelector(FIGURE_SELECTOR)?.querySelector('svg')).not.toBeNull();
  });

  it('sanitize rejection: the LATEST-moment failure, after the engine already succeeded', async () => {
    // `<foreignObject>` alone — nothing the SVG profile admits, so the artifact sanitizes to
    // nothing with no <svg> root. The engine "succeeded"; the artifact did not survive.
    const { host, shadow } = mountedHost(FAILING_DOC);
    const module = fakeEngine((definition) =>
      definition.includes('bad') ? '<foreignObject><p>not an svg</p></foreignObject>' : SVG,
    ).module;

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const [bad, good] = [...shadow.querySelectorAll('pre[data-diagram]')];
    expect(bad.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(bad.nextElementSibling?.textContent).toContain('rejected by the sanitizer');
    expect(good.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');

    // NEVER AN EMPTY BOX: the rejection removed the placeholder rather than committing nothing
    // into it, and the source is still there to read.
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(bad.textContent).toContain('bad one');
  });

  it('the sanitize step is the REAL profile, not a pass-through', async () => {
    // If `sanitizeSvg` were bypassed this <script> would be adopted. It is the same assertion the
    // browser suite makes on true engine output; here it pins that the call is wired at all.
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const module = fakeEngine(
      () => '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><g/></svg>',
    ).module;

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    expect(shadow.querySelector('pre')?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelector(FIGURE_SELECTOR)?.querySelector('svg')).not.toBeNull();
    expect(shadow.querySelector('script')).toBeNull();
  });
});

// ── §4's SOURCE GUARD (decisions.md 2026-07-30) ───────────────────────────────────────────────
//
// SCOPE, STATED, because this is the half jsdom CAN answer and it is not the important half. What
// is reachable here is DOM SHAPE — which state a carrying fence lands in, what its marker says,
// whether the fence beside it still renders — plus the predicate's boundary, which is a pure
// function over text and needs no DOM at all. Whether the guard actually keeps bytes off the wire
// is a request-level question on a real engine, and jsdom loads no subresources at all
// (`mount.ts:119-129`): it is `tests/browser/diagramSourceGuard.browser.test.ts`, both engines.

describe("§4's source-guard predicate — the boundary between an accepted cost and a bug", () => {
  /**
   * DEGRADES. The first two are the routes that actually put bytes on the wire; the rest are the
   * ACCEPTED COST banked in decisions.md 2026-07-30 — references that do not fetch in this engine
   * version and degrade anyway, because a predicate that depended on current fetch behaviour would
   * re-create the version-coupled narrowness the decision exists to remove.
   */
  const CARRIES: readonly [string, string][] = [
    ['flowchart img: (fetches, then throws)', 'flowchart TD\n  A@{ img: "https://h.example/x.png" }'],
    ['sequence properties.icon (fetches AND renders)',
      'sequenceDiagram\n  participant A\n  properties A: {"icon": "http://h.example/i.png"}'],
    ['ACCEPTED COST — click href (reaches the SVG, never loads)',
      'flowchart TD\n  A --> B\n  click A href "https://h.example/page"'],
    ['ACCEPTED COST — sequence link (same)',
      'sequenceDiagram\n  participant A\n  link A: Home @ https://h.example/'],
    ['ACCEPTED COST — a URL in a node LABEL', 'flowchart TD\n  A["see https://h.example/docs"]'],
    ['ACCEPTED COST — a URL in a %% comment', 'flowchart TD\n  %% https://h.example/notes\n  A --> B'],
    ['protocol-relative, quoted', 'flowchart TD\n  A@{ img: "//h.example/x.png" }'],
    ['protocol-relative, unquoted after a space', 'flowchart TD\n  A@{ img: //h.example/x.png }'],
    ['scheme with no slashes — the URL parser still resolves it',
      'flowchart TD\n  A@{ img: "http:h.example/x.png" }'],
    ['uppercase spelling', 'flowchart TD\n  A@{ img: "HTTPS://H.EXAMPLE/X.PNG" }'],
    // `scheme://host` degrades whatever the scheme is. Deliberate, and the reason is the line
    // below it: `img://h.example/x.png` is the UNSPACED spelling of the flowchart image route, and
    // a predicate that only recognised schemes this engine version happens to fetch would be the
    // version-coupled narrowness decisions.md 2026-07-30 exists to remove.
    ['any scheme with an authority', 'flowchart TD\n  A@{ img: "xhttp://h.example/x" }'],
    ['the unspaced image route', 'flowchart TD\n  A@{ img://h.example/x.png }'],
  ];

  /**
   * DOES NOT DEGRADE. Everything here contains an `http` or a `//` SUBSTRING and none of it is a
   * remote reference. A hit on any of these is a PREDICATE BUG, not §4's stance: the accepted cost
   * above is a genuine URL that happens not to fetch, which is a different thing from a fence
   * refused for a slash inside a word. The last four are mermaid's OWN sequence arrows.
   */
  const CLEAN: readonly [string, string][] = [
    ['a word merely containing "http"', 'flowchart TD\n  A[authtoken] --> B[shttpd]'],
    ['prose using the protocol name', 'flowchart TD\n  A["Use HTTP: the fast one"]'],
    ['an unknown scheme with NO authority', 'flowchart TD\n  A@{ img: "xhttp:local" }'],
    ['a double slash inside a word', 'flowchart TD\n  A[TCP//IP] --> B[and//or]'],
    ['a double slash inside a number', 'flowchart TD\n  A["50//50"]'],
    ['a relative image path', 'flowchart TD\n  A@{ img: "./local.png" }'],
    ['a data: URI (C4 $sprite travels this way)', 'flowchart TD\n  A@{ img: "data:image/png;base64,iVBOR" }'],
    ['sequence arrow --//', 'sequenceDiagram\n  A --// B: hi'],
    ['sequence arrow //--', 'sequenceDiagram\n  A //-- B: hi'],
    ['sequence arrow -//', 'sequenceDiagram\n  A -// B: hi'],
    ['sequence arrow //-', 'sequenceDiagram\n  A //- B: hi'],
    ['an ordinary diagram', 'graph TD; A-->B;'],
  ];

  it.each(CARRIES)('carries a remote reference: %s', (_name, source) => {
    expect(hasRemoteReference(source)).toBe(true);
  });

  it.each(CLEAN)('does NOT carry one: %s', (_name, source) => {
    expect(hasRemoteReference(source)).toBe(false);
  });

  it('has no `g` flag, so it answers the same on a second call', () => {
    const source = 'flowchart TD\n  A@{ img: "https://h.example/x.png" }';
    expect(hasRemoteReference(source)).toBe(true);
    expect(hasRemoteReference(source)).toBe(true);
  });
});

describe("§4's source guard degrades a carrying fence and never calls the engine", () => {
  const CARRYING = 'flowchart TD\n  A@{ img: "https://h.example/x.png" }\n  A --> B';

  it('the carrying fence reaches `failed` with a marker naming THIS cause', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', CARRYING));
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const pre = shadow.querySelector('pre');
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    // The reason names the CAUSE, and is distinguishable from §3.8's three.
    const marker = shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`);
    expect(marker?.textContent).toContain('references a remote resource');
    expect(marker?.textContent).not.toContain('could not be drawn');

    // The whole point: the engine — the only place the reference could have gone out — never ran.
    expect(render).toHaveBeenCalledTimes(0);

    // §3.8's shape, reused rather than re-invented: source visible, no stranded empty box.
    expect(pre?.isConnected).toBe(true);
    expect(pre?.textContent).toContain('h.example');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
  });

  it('CONTROL: the same harness renders a fence WITHOUT one — the guard does not over-degrade', async () => {
    // Without this, "failed" above is equally consistent with a guard that refuses everything.
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    expect(shadow.querySelector('pre')?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(render).toHaveBeenCalledTimes(1);
    expect(shadow.querySelectorAll(`.${DIAGRAM_ERROR_CLASS}`)).toHaveLength(0);
  });

  it('PER-FENCE: the carrying fence degrades, the clean one beside it renders (§4)', async () => {
    const { host, shadow } = mountedHost(
      fence('mermaid', CARRYING) + '\n' + fence('mermaid', 'graph TD; A-->B;'),
    );
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const [carrying, clean] = [...shadow.querySelectorAll('pre[data-diagram]')];
    expect(carrying.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(clean.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    // The guard is per fence, not document-wide: the engine ran exactly once, for the clean one.
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][1]).toBe('graph TD; A-->B;\n');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
  });

  it('the ACCEPTED COST is a decision, not an accident: `click href` degrades too', async () => {
    // Pinned deliberately (decisions.md 2026-07-30). `click A href` puts the URL in the SVG but an
    // <a> does not LOAD, and the profile strips `a` anyway — so this fence degrades for a reference
    // that would never have fetched. §4 forbids diagram content that REFERENCES a remote resource;
    // the supported path for an external link is a markdown link outside the fence. If this test
    // ever reads as a regression, the thing to change is the decision, not the predicate.
    const { host, shadow } = mountedHost(
      fence('mermaid', 'flowchart TD\n  A --> B\n  click A href "https://h.example/page"'),
    );
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    expect(shadow.querySelector('pre')?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(render).toHaveBeenCalledTimes(0);
  });

  it('reads the source ONCE and hands the engine that same string (D-15: read, never rewritten)', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    // The scan did not consume, trim or normalise anything on the way past.
    expect(render.mock.calls[0][1]).toBe('graph TD; A-->B;\n');
    expect(diagramSourceOf(shadow.querySelector('pre')!)).toBe('graph TD; A-->B;\n');
  });
});

// ── R15 / GHSA-238p-pmpm-9mq7: THE MATH GATE (decisions.md, M12 TASK 1.3) ─────────────────────
//
// The audit exception for katex-via-mermaid stands on ONE premise: katex is unreachable because
// every route into it requires `$$`, and a fence carrying `$$` degrades before `engine.render`.
// These blocks ARE that premise's pin (R15 dropped the separate diagramEngine.test.ts pin):
//
//   1. THE SUPERSET — over a corpus, every input mermaid's OWN detection flags, ours flags too.
//      Compared against mermaid's real `hasKatex`, imported from the INSTALLED package here in
//      the test (never from shipped code — the import fence scans shipped files only).
//   2. THE DRIFT PIN — the installed mermaid still has exactly ONE `import("katex")`, behind
//      `if (!hasKatex(text)) return text`, with the regex quoted in decisions.md. A mermaid bump
//      that moves any of it reds HERE, before the exception can silently outlive its proof.
//   3. THE DEGRADE — a carrying fence never reaches the engine, and the fence beside it renders.
//
// Whether katex is REQUESTED on a real engine is the browser file's question
// (`tests/browser/diagramKatexGate.browser.test.ts`, both engines) — jsdom loads no chunk at all.

/** The installed mermaid's ESM core chunks — the graph `import('mermaid')` resolves to. */
function mermaidCoreFiles(): string[] {
  const root = dirname(createRequire(import.meta.url).resolve('mermaid/package.json'));
  const chunks = join(root, 'dist', 'chunks', 'mermaid.core');
  return [
    join(root, 'dist', 'mermaid.core.mjs'),
    ...readdirSync(chunks)
      .filter((f) => f.endsWith('.mjs'))
      .map((f) => join(chunks, f)),
  ];
}

/** The one core chunk that defines mermaid's `$$` detection. */
function katexGateChunk(): string {
  const hits = mermaidCoreFiles().filter((f) => readFileSync(f, 'utf8').includes('var katexRegex ='));
  expect(hits, 'GHSA-238p-pmpm-9mq7: mermaid no longer defines `katexRegex` in ONE core chunk — ' +
    're-assess the audit exception (decisions.md, M12 TASK 1.3)').toHaveLength(1);
  return hits[0];
}

const DRIFT = 'GHSA-238p-pmpm-9mq7 (decisions.md, M12 TASK 1.3): the installed mermaid changed its ' +
  'katex entry — the audit exception rests on it; re-assess before touching this assertion';

describe('R15 — the math-gate predicate is a SUPERSET of mermaid’s own `$$` detection', () => {
  /** Mixed on purpose: some mermaid flags, some it does not; ours must flag every one it does. */
  const CORPUS: readonly [string, string][] = [
    ['a sequence message', 'sequenceDiagram\n  A->>B: $$x^2$$'],
    ['a quoted flowchart label', 'flowchart TD\n  A["$$x^2$$"]'],
    ['an unquoted label', 'graph TD\n  A[$$x^2$$] --> B'],
    ['an edge label', 'graph TD\n  A -->|$$x$$| B'],
    ['a state description', 'stateDiagram-v2\n  s1: $$x^2$$'],
    ['empty math', 'sequenceDiagram\n  A->>B: $$$$'],
    ['two formulas on a line', 'sequenceDiagram\n  A->>B: $$a$$ and $$b$$'],
    ['$$ inside a %%{init}%% directive', '%%{init: {"title": "$$x$$"}}%%\ngraph TD\n  A-->B'],
    ['an ESCAPED \\$$', 'sequenceDiagram\n  A->>B: \\$$x\\$$'],
    ['$$ unbalanced', 'sequenceDiagram\n  A->>B: $$x^2'],
    ['$$ across lines', 'sequenceDiagram\n  A->>B: $$x\n  B->>A: y$$'],
    ['a single $', 'sequenceDiagram\n  A->>B: costs $5'],
    ['single $ pairs', 'sequenceDiagram\n  A->>B: $x$ and $y$'],
    ['a plain flowchart', 'graph TD; A-->B;'],
    ['a plain sequence diagram', 'sequenceDiagram\n  Alice->>Bob: hello'],
  ];

  it.each(CORPUS)('flags whatever mermaid flags: %s', async (_name, source) => {
    const { hasKatex } = (await import(/* @vite-ignore */ pathToFileURL(katexGateChunk()).href)) as {
      hasKatex: (text: string) => boolean;
    };
    // The superset is asserted over the whole source AND every line of it: mermaid tests a LABEL,
    // which is a substring of the source, so a label it would flag must sit inside what we scan.
    for (const text of [source, ...source.split('\n')]) {
      if (hasKatex(text)) {
        expect(hasDiagramMath(source), `mermaid flags ${JSON.stringify(text)} and we do not`).toBe(
          true,
        );
      }
    }
  });

  it('the corpus is not vacuous: mermaid flags some of it and leaves some alone', async () => {
    const { hasKatex } = (await import(/* @vite-ignore */ pathToFileURL(katexGateChunk()).href)) as {
      hasKatex: (text: string) => boolean;
    };
    const flagged = CORPUS.filter(([, s]) => s.split('\n').some((l) => hasKatex(l)));
    expect(flagged.length).toBeGreaterThan(0);
    expect(flagged.length).toBeLessThan(CORPUS.length);
  });

  it('does NOT flag a single $ or a diagram with no math (no over-degrade)', () => {
    expect(hasDiagramMath('sequenceDiagram\n  A->>B: costs $5')).toBe(false);
    expect(hasDiagramMath('sequenceDiagram\n  A->>B: $x$ and $y$')).toBe(false);
    expect(hasDiagramMath('graph TD; A-->B;')).toBe(false);
  });

  it('answers the same on a second call', () => {
    const source = 'sequenceDiagram\n  A->>B: $$x$$';
    expect(hasDiagramMath(source)).toBe(true);
    expect(hasDiagramMath(source)).toBe(true);
  });
});

describe('R15 — the DRIFT PIN: the installed mermaid’s katex entry is still the one 1.3 assessed', () => {
  it('detects math with exactly /\\$\\$(.*?)\\$\\$/g', () => {
    const src = readFileSync(katexGateChunk(), 'utf8');
    expect(src, DRIFT).toContain('var katexRegex = /\\$\\$(.*?)\\$\\$/g;');
  });

  it('has exactly ONE `import("katex")` in its whole core graph', () => {
    const imports = mermaidCoreFiles().flatMap((f) =>
      readFileSync(f, 'utf8').includes('import("katex")') ? [f] : [],
    );
    expect(imports, DRIFT).toHaveLength(1);
    expect(imports[0], DRIFT).toBe(katexGateChunk());
    // And exactly one occurrence inside that file.
    expect(readFileSync(imports[0], 'utf8').split('import("katex")'), DRIFT).toHaveLength(2);
  });

  it('reaches that import only past `if (!hasKatex(text)) return text`', () => {
    const src = readFileSync(katexGateChunk(), 'utf8');
    const fn = src.indexOf('var renderKatexUnsanitized =');
    const gate = src.indexOf('if (!hasKatex(text)) {\n    return text;\n  }', fn);
    const entry = src.indexOf('import("katex")', fn);
    expect(fn, DRIFT).toBeGreaterThan(-1);
    expect(gate, DRIFT).toBeGreaterThan(fn);
    // The gate is the function's FIRST statement and precedes the import.
    expect(src.slice(fn, gate).split('\n'), DRIFT).toHaveLength(2);
    expect(entry, DRIFT).toBeGreaterThan(gate);
  });
});

describe('R15 — a fence carrying `$$` degrades and never reaches the engine', () => {
  const CARRYING = 'sequenceDiagram\n  Alice->>Bob: $$x^2$$';

  it('the carrying fence reaches `failed` with a marker naming THIS cause', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', CARRYING));
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const pre = shadow.querySelector('pre');
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    const marker = shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`);
    expect(marker?.textContent).toContain('contains math');
    expect(marker?.textContent).not.toContain('could not be drawn');
    expect(marker?.textContent).not.toContain('references a remote resource');
    expect(render, 'GHSA-238p-pmpm-9mq7: a `$$` fence reached engine.render').toHaveBeenCalledTimes(0);
    // §3.8's shape: the source stays visible, no stranded empty box.
    expect(pre?.textContent).toContain('$$x^2$$');
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(0);
  });

  it('PER-FENCE: the carrying fence degrades, the plain one beside it renders', async () => {
    const { host, shadow } = mountedHost(
      fence('mermaid', CARRYING) + '\n' + fence('mermaid', 'graph TD; A-->B;'),
    );
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    const [carrying, clean] = [...shadow.querySelectorAll('pre[data-diagram]')];
    expect(carrying.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(clean.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][1]).toBe('graph TD; A-->B;\n');
  });

  it('Peekover’s own math outside the fence does not degrade the diagram beside it', async () => {
    const { host, shadow } = mountedHost(
      '$$x^2$$\n\n' + fence('mermaid', 'graph TD; A-->B;'),
    );
    const { module, render } = fakeEngine(() => SVG);

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    // `pre[data-diagram]`, not `pre`: M11 retains a <pre> as the math block's copy source.
    expect(shadow.querySelector('pre[data-diagram]')?.getAttribute(DIAGRAM_STATE_ATTR)).toBe(
      'rendered',
    );
    expect(render).toHaveBeenCalledTimes(1);
  });
});

describe('idempotency over an already-rendered host', () => {
  it('a second enhance neither re-renders nor double-adopts', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const { module, render } = fakeEngine(() => SVG);
    const loader = async (): Promise<DiagramEngineModule> => module;

    enhanceDiagrams(host, { loader });
    await settle();
    enhanceDiagrams(host, { loader });
    await settle();

    expect(render).toHaveBeenCalledTimes(1);
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1);
    expect(shadow.querySelectorAll(`${FIGURE_SELECTOR} svg`)).toHaveLength(1);
  });
});

describe('the measuring container (D-6 step 1)', () => {
  it('is gone from the document afterwards — and existed while the engine was rendering', async () => {
    const { host } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    let containerAtRenderTime: Element | null = null;
    const module = fakeEngine(() => SVG).module;
    const inner = module.default.render.bind(module.default);
    module.default.render = async (id, definition, container) => {
      // Observed DURING the call: an empty tail is not an empty instrument.
      containerAtRenderTime = document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`);
      expect(container).toBe(containerAtRenderTime);
      return inner(id, definition, container);
    };

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    expect(containerAtRenderTime).not.toBeNull();
    expect(containerAtRenderTime!.isConnected).toBe(false);
    expect(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`)).toBeNull();
  });

  it('is removed even when the render throws', async () => {
    const { host } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const module = fakeEngine(() => { throw new Error('boom'); }).module;

    enhanceDiagrams(host, { loader: async () => module });
    await settle();

    expect(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`)).toBeNull();
  });
});

// ── D-12's COOLDOWN CONSTRAINT (007 task 3.4) ────────────────────────────────────────────────
//
// `watchController.renderNow` (`watchController.ts:422`) times its WHOLE synchronous block —
// "start to return — that the main thread cannot do anything else during" — and sets the next
// re-render's cooldown from what that block cost:
//
//     const started = now(); … render(text, target, …); … readyAt = now();
//     readyAt += (readyAt - started) * COOLDOWN_MULTIPLIER;
//
// On the app page that `render` is `appShell.ts:132`'s `renderWithDiagrams`, which is `mount()`
// followed by `enhanceDiagrams()`. So every millisecond the enhancer spends before it returns is
// multiplied into the cooldown of every subsequent update, on every diagram-bearing watched
// document. The enhancer's contract is therefore not merely "is async somewhere" but "schedules
// and returns in ~nothing" — a shape the source states (`diagramEnhancer.ts:361`: "Everything
// above is synchronous and already committed; everything below is off this stack") and which is
// asserted here.
//
// THE MEASUREMENT IS A WITH/WITHOUT PAIR ON ONE CLOCK, and it has to be. "The enhancer returned
// fast" is unfalsifiable on its own — a fake engine that costs nothing makes it true no matter
// how the enhancer is written. So the fake engine below BURNS a real, blocking `BURN_MS` of main
// thread inside `render()`, and the same clock measures that same work driven INLINE. The inline
// number is the cooldown watchController would have charged; the synchronous number is what it
// actually charges. If the inline control did not read the burn, the fast reading would mean
// nothing.
//
// MEASURED at 3.4 on this machine, one `BURN_MS = 40` engine, one fence:
//   inline (the control, work inside the block) …… 40.43 ms  — the control fires; the burn is read
//   scheduled (the shipped shape) ………………………………………  0.83 ms
//   the same, in the first test ……………………………………… 0.22 ms
// So watchController times ~0.2–0.8 ms of enhancer instead of ~40, and `COOLDOWN_MULTIPLIER`
// scales that difference into every subsequent update of a diagram-bearing watched document.
describe("D-12's cooldown constraint — the enhancer's cost is OFF watchController's timed block", () => {
  /** Long enough to dwarf a jsdom prologue by an order of magnitude, short enough to stay cheap. */
  const BURN_MS = 40;

  /** An engine whose `render` blocks the main thread for `BURN_MS` — a stand-in for the real one,
   *  whose cost is a genuine layout-and-measure pass (D-6). A `setTimeout` would NOT do: the
   *  quantity under test is main-thread occupancy, which is what a timed block measures. */
  function burningEngine(): DiagramEngineModule {
    const render = vi.fn(async () => {
      const until = performance.now() + BURN_MS;
      while (performance.now() < until) {
        /* block, exactly as a real measure-and-lay-out pass does */
      }
      return { svg: SVG, bindFunctions: vi.fn() };
    });
    const engine: DiagramEngine = { initialize: vi.fn(), render } as unknown as DiagramEngine;
    return { default: engine } as DiagramEngineModule;
  }

  it('returns with the placeholder committed and NOT ONE unit of the engine work done', async () => {
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const module = burningEngine();
    const render = module.default.render as unknown as Mock;

    const started = performance.now();
    const returned: unknown = enhanceDiagrams(host, { loader: async () => module });
    const syncMs = performance.now() - started;

    // AT THE INSTANT OF RETURN — the state watchController's `readyAt = now()` would observe.
    expect(returned).toBeUndefined(); // nothing to await, so nothing CAN be awaited into the block
    expect(shadow.querySelectorAll(FIGURE_SELECTOR)).toHaveLength(1); // §4's pre-paint half
    expect(shadow.querySelector(FIGURE_SELECTOR)?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('pending');
    expect(render).not.toHaveBeenCalled();
    // The measuring container is created AFTER the engine await (`diagramEnhancer.ts:283`), so its
    // absence here is the async body's own boundary, observed rather than assumed.
    expect(document.querySelector(`.${DIAGRAM_MEASURE_CLASS}`)).toBeNull();
    expect(syncMs).toBeLessThan(BURN_MS);

    // THE INSTRUMENT IS LIVE: every one of those readings flips once the work actually runs, so
    // the "not yet" above is a not-yet and not a dead probe.
    await settle();
    expect(render).toHaveBeenCalledTimes(1);
    expect(shadow.querySelector(FIGURE_SELECTOR)?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(performance.now() - started).toBeGreaterThanOrEqual(BURN_MS);
  });

  it('CONTROL — the same engine driven INLINE charges the timed block the full cost', async () => {
    // WITHOUT the schedule-and-return shape: an enhancer that awaited its own work would leave
    // `renderNow` holding the stack for the whole render. This is that block, on the same clock
    // and the same engine — the number watchController would have multiplied into the cooldown.
    const { host, shadow } = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const module = burningEngine();

    const inlineStart = performance.now();
    const engine = await loadDiagramEngine(shadow, async () => module);
    await engine!.render('inline-control', 'graph TD; A-->B;', host);
    const inlineMs = performance.now() - inlineStart;

    // The control FIRES: a timer around the work reads the burn. (If this failed, the fast
    // reading in the test above would be measuring an engine that costs nothing.)
    expect(inlineMs).toBeGreaterThanOrEqual(BURN_MS);

    // And the shipped shape, measured against it on the same clock in the same test.
    const shipped = mountedHost(fence('mermaid', 'graph TD; A-->B;'));
    const scheduledStart = performance.now();
    enhanceDiagrams(shipped.host, { loader: async () => burningEngine() });
    const scheduledMs = performance.now() - scheduledStart;
    await settle();

    expect(scheduledMs).toBeLessThan(inlineMs);
    // Not merely "less" — the burn is absent from it entirely, which is the claim the cooldown
    // depends on. An enhancer that awaited even one render would land above BURN_MS here.
    expect(scheduledMs).toBeLessThan(BURN_MS);
  });
});
