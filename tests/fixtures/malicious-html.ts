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
];
