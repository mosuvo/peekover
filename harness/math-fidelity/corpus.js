// corpus.js — the dense representative formula corpus this harness renders, matching task 1.1-R's
// own class list verbatim (specs/011-math-rendering/tasks.md, task 1.1-R's RESULT block): fractions,
// nested radicals, single/double/triple/contour integrals, sum/product/coproduct/big-union/
// big-intersection, all five matrix delimiter styles, \left/\right + \Bigl-family nested stretchy
// delimiters, nested sub/superscripts, full Greek, relations, set ops, \nabla/\lim/accents/
// over-under-braces, all eight math-alphabet styles, named functions, arrows, digits.
//
// 48 formulas (vs. 1.1-R's own 51 — a few single-glyph Greek-letter entries there are consolidated
// into one "full alphabet in one formula" entry here per class; every NAMED CLASS is still covered,
// this is a divergence from the exact count, flagged in the commit rather than smoothed over).
// Every entry below was validated against the real installed temml (node_modules/temml, v0.13.5)
// before being committed — renderToString({throwOnError:true}) on all 48 raised zero errors.
//
// Plain global script (no import/export): file:// pages cannot load ES modules cross-file in
// either Chromium or Firefox (CORS-blocked), so every harness script here is a classic script that
// assigns to `window`.
(function () {
  'use strict';

  /** @typedef {{ cls: string, label: string, latex: string }} CorpusEntry */

  /** @type {CorpusEntry[]} */
  const MATH_CORPUS = [
    { cls: 'fractions', label: 'simple fraction', latex: '\\frac{a}{b}' },
    { cls: 'fractions', label: 'nested fraction', latex: '\\frac{1}{1+\\frac{1}{1+\\frac{1}{x}}}' },
    { cls: 'fractions', label: 'binomial-style fraction', latex: '\\dfrac{n!}{k!(n-k)!}' },

    { cls: 'radicals', label: 'square root', latex: '\\sqrt{x+1}' },
    { cls: 'radicals', label: 'nth root', latex: '\\sqrt[n]{x^n+y^n}' },
    { cls: 'radicals', label: 'nested radical', latex: '\\sqrt{1+\\sqrt{1+\\sqrt{1+x}}}' },

    { cls: 'integrals', label: 'single integral', latex: '\\int_0^1 x^2\\,dx' },
    { cls: 'integrals', label: 'double integral', latex: '\\iint_D f(x,y)\\,dA' },
    { cls: 'integrals', label: 'triple integral', latex: '\\iiint_V \\rho(x,y,z)\\,dV' },
    { cls: 'integrals', label: 'contour integral', latex: '\\oint_C \\mathbf{F}\\cdot d\\mathbf{r}' },

    { cls: 'big-operators', label: 'sum', latex: '\\sum_{i=1}^{n} i^2' },
    { cls: 'big-operators', label: 'product', latex: '\\prod_{k=1}^{n} \\frac{k}{k+1}' },
    { cls: 'big-operators', label: 'coproduct', latex: '\\coprod_{i \\in I} A_i' },
    { cls: 'big-operators', label: 'big union', latex: '\\bigcup_{n=1}^{\\infty} A_n' },
    { cls: 'big-operators', label: 'big intersection', latex: '\\bigcap_{n=1}^{\\infty} A_n' },

    { cls: 'matrices', label: 'pmatrix (parens)', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { cls: 'matrices', label: 'bmatrix (brackets)', latex: '\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}' },
    { cls: 'matrices', label: 'Bmatrix (braces)', latex: '\\begin{Bmatrix} a & b \\\\ c & d \\end{Bmatrix}' },
    { cls: 'matrices', label: 'vmatrix (determinant)', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    { cls: 'matrices', label: 'Vmatrix (norm)', latex: '\\begin{Vmatrix} a & b \\\\ c & d \\end{Vmatrix}' },

    { cls: 'stretchy-delimiters', label: 'left/right parens', latex: '\\left(\\frac{a}{b}\\right)' },
    {
      cls: 'stretchy-delimiters',
      label: 'nested Big-family',
      latex: '\\Biggl(\\biggl(\\Bigl(\\bigl(x\\bigr)\\Bigr)\\biggr)\\Biggr)',
    },
    {
      cls: 'stretchy-delimiters',
      label: 'left/right brackets around fraction stack',
      latex: '\\left[\\frac{1}{1+\\frac{1}{x}}\\right]',
    },

    { cls: 'sub-superscripts', label: 'nested superscript tower', latex: 'x^{y^{z^2}}' },
    { cls: 'sub-superscripts', label: 'nested sub/superscript', latex: 'a_{i_{j_k}}^{b^{c^d}}' },
    { cls: 'sub-superscripts', label: 'sub and sup together', latex: 'x_i^2 + y_j^3' },

    {
      cls: 'greek-lower',
      label: 'full lowercase Greek alphabet',
      latex:
        '\\alpha\\beta\\gamma\\delta\\epsilon\\zeta\\eta\\theta\\iota\\kappa\\lambda\\mu' +
        '\\nu\\xi\\pi\\rho\\sigma\\tau\\upsilon\\phi\\chi\\psi\\omega',
    },
    {
      cls: 'greek-upper',
      label: 'full uppercase Greek alphabet',
      latex: '\\Gamma\\Delta\\Theta\\Lambda\\Xi\\Pi\\Sigma\\Upsilon\\Phi\\Psi\\Omega',
    },

    {
      cls: 'relations',
      label: 'equalities/inequalities',
      latex: 'a=b\\neq c\\leq d\\geq e\\approx f\\equiv g\\sim h\\propto i',
    },
    {
      cls: 'set-ops',
      label: 'set operations',
      latex: 'A\\cup B\\cap C\\subset D\\subseteq E, x\\in F, y\\notin G, H=\\emptyset',
    },

    { cls: 'nabla-lim', label: 'gradient', latex: '\\nabla f(x,y,z)' },
    { cls: 'nabla-lim', label: 'limit', latex: '\\lim_{x\\to\\infty}\\frac{1}{x}=0' },

    {
      cls: 'accents',
      label: 'hat/bar/dot/ddot/tilde/vec',
      latex: '\\hat{a}\\ \\bar{b}\\ \\dot{c}\\ \\ddot{d}\\ \\tilde{e}\\ \\vec{f}',
    },
    {
      cls: 'over-under-braces',
      label: 'overbrace/underbrace',
      latex: '\\overbrace{a+b+c}^{n\\text{ terms}}\\underbrace{x+y}_{\\text{sum}}',
    },

    { cls: 'math-alphabets', label: 'mathbb', latex: '\\mathbb{ABCXYZ}' },
    { cls: 'math-alphabets', label: 'mathcal', latex: '\\mathcal{ABCXYZ}' },
    { cls: 'math-alphabets', label: 'mathfrak', latex: '\\mathfrak{ABCXYZ}' },
    { cls: 'math-alphabets', label: 'mathrm', latex: '\\mathrm{ABCxyz}' },
    { cls: 'math-alphabets', label: 'mathit', latex: '\\mathit{ABCxyz}' },
    { cls: 'math-alphabets', label: 'mathbf', latex: '\\mathbf{ABCxyz}' },
    { cls: 'math-alphabets', label: 'mathsf', latex: '\\mathsf{ABCxyz}' },
    { cls: 'math-alphabets', label: 'mathtt', latex: '\\mathtt{ABCxyz}' },

    {
      cls: 'named-functions',
      label: 'trig/log/exp',
      latex: '\\sin x + \\cos x + \\tan x + \\log x + \\ln x + \\exp x',
    },
    {
      cls: 'named-functions',
      label: 'max/min/sup/inf',
      latex: '\\max_{x\\in S} f(x) + \\min_{x\\in S} f(x) + \\sup_x g(x) + \\inf_x g(x)',
    },

    {
      cls: 'arrows',
      label: 'basic arrows',
      latex: 'a\\rightarrow b\\quad c\\Rightarrow d\\quad e\\leftarrow f\\quad g\\Leftrightarrow h',
    },
    {
      cls: 'arrows',
      label: 'mapsto and vertical arrows',
      latex: 'x\\mapsto x^2\\quad \\uparrow\\ \\downarrow\\ \\Uparrow\\ \\Downarrow',
    },

    { cls: 'digits', label: 'digits in an expression', latex: '3.14159 + 2.71828 = 5.85987, \\quad 10^{100}' },
    {
      cls: 'digits',
      label: 'digits in subscripts/exponents',
      latex: 'x_0 + x_1 + x_2 + \\cdots + x_{10}^{20}',
    },
  ];

  /** A handful of the classes above, re-rendered inline ($…$-context, in running text) — Chrome's
   *  MathML sizing/baseline differs between inline and display mode, and the deferred human walk
   *  needs to see both, per this task's own kickoff. */
  const MATH_INLINE_SAMPLES = [
    { cls: 'fractions', before: 'The probability is', latex: '\\frac{a}{b}', after: 'in this run.' },
    { cls: 'radicals', before: 'Note that', latex: '\\sqrt{x+1}', after: 'is real for x ≥ -1.' },
    {
      cls: 'sub-superscripts',
      before: 'Consider the tower',
      latex: 'x^{y^{z^2}}',
      after: 'as n grows.',
    },
    {
      cls: 'greek-lower',
      before: 'Here',
      latex: '\\alpha, \\beta, \\gamma',
      after: 'denote the three angles.',
    },
    { cls: 'relations', before: 'Since', latex: 'a \\leq b \\leq c', after: 'the chain holds.' },
    { cls: 'accents', before: 'The estimator', latex: '\\hat{\\theta}', after: 'is unbiased.' },
    {
      cls: 'nabla-lim',
      before: 'As x grows,',
      latex: '\\lim_{x\\to\\infty}\\frac{1}{x}=0',
      after: 'so the tail vanishes.',
    },
    { cls: 'arrows', before: 'The map', latex: 'x\\mapsto x^2', after: 'is not injective on ℝ.' },
    { cls: 'named-functions', before: 'By definition,', latex: '\\sin^2 x + \\cos^2 x = 1', after: 'always.' },
    { cls: 'digits', before: 'With', latex: 'n = 10^{100}', after: 'terms, the sum diverges.' },
  ];

  window.MATH_CORPUS = MATH_CORPUS;
  window.MATH_INLINE_SAMPLES = MATH_INLINE_SAMPLES;
})();
