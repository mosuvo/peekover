// Ambient types for `jsdom` (29.1.1), used only by scripts/perf-toc.ts. jsdom ships no
// bundled types and @types/jsdom is not a project dependency — the unit suite reaches jsdom
// through vitest's `environment: 'jsdom'`, never importing it, so no types were needed until
// this harness. A standalone .d.ts (no top-level import → an ambient declaration, not an
// augmentation of the untyped JS module) is the same pattern markdown-it-task-lists.d.ts uses.
// Minimal surface — enough for `new JSDOM(html).window`.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string);
    readonly window: Window & typeof globalThis;
  }
}
