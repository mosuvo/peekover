// ★ R15 / GHSA-238p-pmpm-9mq7: THE MATH GATE, ON A REAL ENGINE (decisions.md, M12 TASK 1.3).
//
// The audit exception for katex-via-mermaid is not "probably unreachable"; it is unreachable BY
// CONSTRUCTION. The installed mermaid has exactly one route into katex, and that route returns
// early unless the label matches `/\$\$(.*?)\$\$/` (pinned in diagramEnhancer.test.ts). A fence
// whose source carries `$$` degrades in `drawDiagram` before `engine.render`, so katex never runs.
//
// ── WHY A FILE OF ITS OWN ─────────────────────────────────────────────────────────────────
//
// `diagramSourceGuard.browser.test.ts` measures §4's remote references, ON THE WIRE (`^https?:`).
// This measures something different — whether OUR OWN lazy katex chunk is loaded and run at all —
// with a different instrument, for a different reason (an advisory, not §4). Folding it in would
// blur what that file's zeros mean.
//
// ── THE TWO INSTRUMENTS ───────────────────────────────────────────────────────────────────
//
//   • KATEX RAN — a MutationObserver over the LIVE light DOM during the render, recording any
//     katex artifact: mermaid's `#katex-temp` measuring div (`calculateMathMLDimensions`), a
//     `.katex` node or a `<math>` element. The adopted SVG lands in the reader's SHADOW root,
//     which this observer does not see, so Peekover's own Temml math can never be misread as
//     katex's. This instrument does not depend on caching: it sees katex run whether or not the
//     chunk was already loaded.
//   • THE CHUNK WAS REQUESTED — a delta-based Resource Timing reading of the katex chunk URL.
//     Secondary: once a page has loaded the chunk it is a module-cache hit, so a zero is only
//     meaningful while katex is cold. That holds here because every production path is gated,
//     and the firing control below runs LAST so that it, not an arm, is what warms it.
//
// ── THE CONTROL THAT FIRES ────────────────────────────────────────────────────────────────
//
// The last test drives the SAME mermaid instance directly, without the enhancer, with the same
// `$$` source. Both instruments must read non-zero there. If they do not, every zero above is
// worthless (retro 2026-07-19 finding 1). The red-first ablation (guard removed) is recorded in
// decisions.md's 1.3 entry.

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { DIAGRAM_ENGINE_CONFIG } from '../../src/render/diagramEngine';
import {
  DIAGRAM_ERROR_CLASS,
  DIAGRAM_FIGURE_CLASS,
  DIAGRAM_STATE_ATTR,
} from '../../src/render/diagramView';
import {
  drainMeasureContainers,
  releaseHosts,
  renderAndBracket,
  warmEngine,
} from './helpers/diagramWindow';

const GHSA = 'GHSA-238p-pmpm-9mq7 (decisions.md, M12 TASK 1.3, R15)';

/** The lazy katex chunk, as served: `deps/katex-<hash>.js` here, `chunks/katex-<hash>.js` built. */
function katexRequests(): string[] {
  return performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .filter((name) => /\/katex-[^/]*\.js/i.test(name));
}

const KATEX_ARTIFACT = '#katex-temp, .katex, math';

/** Record every katex artifact added to the live light DOM until `stop()`. */
function watchKatex(): { seen: string[]; stop: () => void } {
  const seen: string[] = [];
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches(KATEX_ARTIFACT) || node.querySelector(KATEX_ARTIFACT)) {
          seen.push(node.id || node.localName);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return {
    seen,
    stop: () => {
      for (const record of observer.takeRecords()) {
        for (const node of record.addedNodes) {
          if (node instanceof Element && (node.matches(KATEX_ARTIFACT) || node.querySelector(KATEX_ARTIFACT))) {
            seen.push(node.id || node.localName);
          }
        }
      }
      observer.disconnect();
    },
  };
}

const FLOWCHART_MATH = 'flowchart TD\n  A["$$x^2$$"] --> B[Beta]';
const SEQUENCE_MATH = 'sequenceDiagram\n  Alice->>Bob: $$x^2$$';

const doc = (...bodies: string[]): string =>
  '# Math in a diagram\n\n' + bodies.map((b) => '```mermaid\n' + b + '\n```\n').join('\n');

beforeAll(async () => {
  await warmEngine();
}, 60_000);

beforeEach(() => {
  performance.clearResourceTimings();
});

afterEach(async () => {
  releaseHosts();
  await drainMeasureContainers();
});

describe('R15 — a mermaid fence carrying `$$` never reaches katex', () => {
  it.each([
    ['a flowchart label', FLOWCHART_MATH],
    ['★ a sequence message (katex-reachable in the installed mermaid)', SEQUENCE_MATH],
  ])('%s: degrades to visible source; katex is neither requested nor run', async (_name, body) => {
    const before = katexRequests().length;
    const katex = watchKatex();
    let shadow: ShadowRoot;
    try {
      ({ shadow } = await renderAndBracket(doc(body)));
    } finally {
      katex.stop();
    }

    expect(katex.seen, `${GHSA}: katex output appeared in the live document`).toEqual([]);
    expect(
      katexRequests().length - before,
      `${GHSA}: the katex chunk was requested`,
    ).toBe(0);

    const pre = shadow.querySelector(`pre[${DIAGRAM_STATE_ATTR}]`);
    expect(pre?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(shadow.querySelector(`.${DIAGRAM_ERROR_CLASS}`)?.textContent).toContain('contains math');
    expect(shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS}`)).toHaveLength(0);
    expect(pre?.textContent, 'never a blank page — the source is still readable').toContain(
      '$$x^2$$',
    );
  }, 60_000);

  it('CONTROL — a plain diagram on the same page still renders', async () => {
    const katex = watchKatex();
    let shadow: ShadowRoot;
    try {
      ({ shadow } = await renderAndBracket(doc(SEQUENCE_MATH, 'graph TD\n  X[Ex] --> Y[Why]')));
    } finally {
      katex.stop();
    }

    expect(katex.seen).toEqual([]);
    const [carrying, plain] = [...shadow.querySelectorAll(`pre[${DIAGRAM_STATE_ATTR}]`)];
    expect(carrying?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('failed');
    expect(plain?.getAttribute(DIAGRAM_STATE_ATTR)).toBe('rendered');
    expect(shadow.querySelectorAll(`figure.${DIAGRAM_FIGURE_CLASS} svg`)).toHaveLength(1);
  }, 60_000);

  // LAST, deliberately: it is what loads katex into this page (see the header).
  it('★ FIRING CONTROL — the same source, straight into the engine, IS seen by both instruments', async () => {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize(DIAGRAM_ENGINE_CONFIG);
    const before = katexRequests().length;
    const katex = watchKatex();
    const container = document.createElement('div');
    document.body.append(container);
    try {
      await mermaid.render(`katex-gate-control-${Date.now()}`, SEQUENCE_MATH, container);
    } finally {
      container.remove();
      katex.stop();
    }

    expect(
      katex.seen.length,
      'THE CONTROL DID NOT FIRE: katex ran with no artifact observed, so the zeros above are vacuous',
    ).toBeGreaterThan(0);
    expect(
      katexRequests().length - before,
      'THE CONTROL DID NOT FIRE: no katex chunk request was observed — either the instrument is ' +
        'blind, or something earlier in this page already loaded katex (harness-shared-state)',
    ).toBeGreaterThan(0);
  }, 60_000);
});
