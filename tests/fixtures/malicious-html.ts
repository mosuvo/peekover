// Malicious-HTML fixtures for the sanitize stage (src/render/sanitize.ts).
//
// Each case is an attack payload that MUST be neutralized: after sanitize(),
// none of the `forbidden` substrings may appear in the output (case-insensitive).
// Where a payload carries benign text, `survives` lists text that MUST remain —
// proving we neutralize without nuking everything (never a blank page).
//
// These are DATA so the coverage is auditable at a glance. Add a row here to add
// a case; the test iterates the array.

export interface MaliciousCase {
  /** Human label shown in the test name. */
  name: string;
  /** The untrusted HTML fed to sanitize(). */
  html: string;
  /** Substrings that MUST NOT survive sanitization (matched case-insensitively). */
  forbidden: string[];
  /** Benign text that MUST survive (optional). */
  survives?: string[];
}

export const MALICIOUS_CASES: MaliciousCase[] = [
  {
    name: '<script> element',
    html: `<p>hi</p><script>alert('xss')</script>`,
    forbidden: ['<script', 'alert('],
    survives: ['hi'],
  },
  {
    name: '<img onerror> handler',
    html: `<img src="x" onerror="alert(1)">`,
    forbidden: ['onerror', 'alert('],
  },
  {
    name: 'javascript: URL in href',
    html: `<a href="javascript:alert(1)">click</a>`,
    forbidden: ['javascript:', 'alert('],
    survives: ['click'],
  },
  {
    name: 'SVG wrapping a <script>',
    html: `<svg><script>alert(1)</script></svg>`,
    forbidden: ['<svg', '<script', 'alert('],
  },
  {
    name: 'SVG onload event vector',
    html: `<svg onload="alert(1)"><circle r="10"/></svg>`,
    forbidden: ['<svg', 'onload', 'alert('],
  },
  {
    name: '<iframe> injection',
    html: `<iframe src="https://evil.example/x"></iframe>`,
    forbidden: ['<iframe', 'evil.example'],
  },
  {
    name: '<object> injection',
    html: `<object data="https://evil.example/x.swf"></object>`,
    forbidden: ['<object', 'evil.example'],
  },
  {
    name: '<embed> injection',
    html: `<embed src="https://evil.example/x.swf">`,
    forbidden: ['<embed', 'evil.example'],
  },
  {
    name: 'on* handler on an allowed tag (<p onclick>)',
    html: `<p onclick="alert(1)">text</p>`,
    forbidden: ['onclick', 'alert('],
    survives: ['text'],
  },
  {
    name: 'onmouseover on an allowed link',
    html: `<a href="https://ok.example" onmouseover="alert(1)">safe</a>`,
    forbidden: ['onmouseover', 'alert('],
    survives: ['safe'],
  },
  {
    name: 'data: URL in href',
    html: `<a href="data:text/html,<script>alert(1)</script>">x</a>`,
    forbidden: ['data:text/html', '<script', 'alert('],
    survives: ['x'],
  },
  {
    name: 'data: URL in img src',
    html: `<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+">`,
    forbidden: ['data:image', 'base64'],
  },
  {
    // Interior TAB obfuscation: `da\tta:` resolves to `data:` in a browser. The
    // src (and its base64 payload) must be dropped — `base64` present in output
    // would prove the attribute survived, so its absence proves the fix.
    name: 'data: URL in img src with an interior TAB in the scheme',
    html: `<img src="da\tta:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">`,
    forbidden: ['data:', 'base64', 'image/svg'],
  },
  {
    // Same evasion on a href. `text/html` only appears if the href survived.
    name: 'data: URL in a href with an interior TAB in the scheme',
    html: `<a href="da\tta:text/html,payloadmarker">link</a>`,
    forbidden: ['data:', 'text/html', 'payloadmarker'],
    survives: ['link'],
  },
  {
    name: '<style> with CSS url(javascript:)',
    html: `<style>body{background:url("javascript:alert(1)")}</style><p>after</p>`,
    forbidden: ['<style', 'javascript:', 'alert('],
    survives: ['after'],
  },
  {
    name: 'IE conditional-comment script',
    html: `<!--[if IE]><script>alert(1)</script><![endif]--><p>ok</p>`,
    forbidden: ['<script', 'alert(', '[if IE]'],
    survives: ['ok'],
  },
  {
    name: 'mXSS nested payload (noscript breakout)',
    html: `<noscript><p title="</noscript><img src=x onerror=alert(1)>">home</p></noscript>`,
    forbidden: ['onerror', 'alert('],
  },
  {
    name: 'mXSS math/mglyph/style breakout',
    html: `<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>`,
    forbidden: ['onerror', 'alert(', '<math', '<style'],
  },
  // ---------------------------------------------------------------------------
  // Appended for the in-browser mXSS re-check (task 5.1 part B / decisions.md
  // 2026-07-14). These are engine-DIVERGENCE payloads: they lean on how a REAL
  // HTML parser reparses foreign content (SVG/MathML), <template>/<noscript>
  // boundaries, and <form>-in-<table> — behavior jsdom does not fully mirror.
  // The point is to run the SAME assertions in real Chromium + Firefox, where a
  // parser quirk jsdom hides would surface. All must be inert in every engine.
  // ---------------------------------------------------------------------------
  {
    // MathML namespace confusion: <mglyph>/<style> inside an integration point
    // can flip the tokenizer back to HTML in a real engine, "reviving" the img.
    name: 'mXSS MathML mtext/mglyph namespace confusion',
    html: `<math><mtext><mglyph><style></style><img src=x onerror=alert(1)></mglyph></mtext></math>`,
    forbidden: ['onerror', 'alert(', '<math', '<style', '<mglyph'],
  },
  {
    // SVG foreign-content breakout: a <p> (HTML) nested in <svg> forces the
    // parser out of foreign content, a classic reparse divergence point.
    name: 'mXSS SVG foreign-content <p> reparse',
    html: `<svg><p><style><!--</style><img src=x onerror=alert(1)></p></svg>`,
    forbidden: ['onerror', 'alert(', '<svg', '<style'],
  },
  {
    // <svg><foreignObject> re-enters the HTML namespace — another reparse edge.
    name: 'mXSS SVG foreignObject breakout',
    html: `<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>`,
    forbidden: ['onerror', 'alert(', '<svg', '<foreignobject'],
  },
  {
    // <template> smuggles inert-until-adopted content; its .content lives in a
    // separate document fragment engines parse differently from jsdom.
    name: 'mXSS <template> content smuggling',
    html: `<template><img src=x onerror=alert(1)><script>alert(2)</script></template><p>after</p>`,
    forbidden: ['onerror', 'alert(', '<template', '<script'],
    survives: ['after'],
  },
  {
    // <noscript> is parsed as text when scripting is ENABLED (real browser) but
    // as elements when disabled (jsdom default) — a canonical divergence.
    name: 'mXSS <noscript> scripting-enabled divergence',
    html: `<noscript><style></noscript><img src=x onerror=alert(1)></style></noscript><p>tail</p>`,
    forbidden: ['onerror', 'alert(', '<style'],
    survives: ['tail'],
  },
  {
    // <form>-in-<table> foster-parenting: the inner <form>/<input> gets moved by
    // the tree builder, historically a source of attribute-smuggling mXSS.
    name: 'mXSS <form> in <table> foster-parenting',
    html: `<table><form><input name=1 value=2><img src=x onerror=alert(1)></form></table>`,
    forbidden: ['onerror', 'alert(', '<form'],
  },
  {
    // DOM clobbering: an attacker-chosen name/id on <img>/<form> can shadow
    // document/form properties (e.g. document.body, form.attributes). Neither
    // `name` nor `id` is allow-listed, so both must be stripped.
    name: 'DOM clobbering via name/id on <img> and <form>',
    html: `<img name="attributes" id="body" src="x"><form id="attributes" name="nodeName"><input id="ownerDocument"></form>`,
    forbidden: ['name=', 'id=', '<form', 'attributes', 'nodename'],
  },
];

// ---------------------------------------------------------------------------
// EXECUTION cases — payloads whose neutralization is OBSERVABLE at runtime, used
// only by the in-browser suite (tests/browser/). After sanitize() the result is
// inserted into a live DOM; the test then asserts nothing executed. A vector that
// slipped through would set `window.__peekoverPwned` (event handler / script body)
// or leave a <script>/on* attribute in the live subtree. Every `html` uses only a
// relative/invalid URL (src="x") so the suite needs ZERO network to run.
// ---------------------------------------------------------------------------

/** The global an escaped payload would set. Declared for the browser test. */
declare global {
  interface Window {
    __peekoverPwned?: boolean;
  }
}

export interface ExecutionCase {
  /** Human label shown in the test name. */
  name: string;
  /** Untrusted HTML whose execution, if not neutralized, is observable. */
  html: string;
}

export const EXECUTION_CASES: ExecutionCase[] = [
  {
    // img onerror fires on a failed load even when inserted via innerHTML — the
    // most reliable "did a handler run?" probe.
    name: 'img onerror sets the pwned flag',
    html: `<img src="x" onerror="window.__peekoverPwned = true">`,
  },
  {
    // SVG root onload fires on insertion in real engines.
    name: 'svg onload sets the pwned flag',
    html: `<svg onload="window.__peekoverPwned = true"><circle r="10"></circle></svg>`,
  },
  {
    // iframe onload (no src -> about:blank, no network) fires on insertion.
    name: 'iframe onload sets the pwned flag',
    html: `<iframe onload="window.__peekoverPwned = true"></iframe>`,
  },
  {
    // A raw <script> does NOT auto-run via innerHTML, but a surviving <script>
    // element in the subtree is itself the failure — the test asserts none exist.
    name: 'script body (element must not survive)',
    html: `<script>window.__peekoverPwned = true</script>`,
  },
  {
    // The mXSS reparse vector, now with an OBSERVABLE handler: proves the engine
    // divergence payloads are inert in a live real-browser DOM, not just as text.
    name: 'mXSS MathML/style reparse with live onerror',
    html: `<math><mtext><mglyph><style></style><img src="x" onerror="window.__peekoverPwned = true"></mglyph></mtext></math>`,
  },
];
