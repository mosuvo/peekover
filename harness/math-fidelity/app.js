// app.js — the harness's own render logic. NOT the shipping render path: this is a standalone
// harness page (task 1.2-R's AGENT-PREPARABLE half, per decisions.md's 2026-09-07 "M11 1.2-R
// SEQUENCING DEVIATION" entry) that imports temml DIRECTLY for harness use only. It never touches
// src/render/parse.ts, src/render/mount.ts, or any real mathEnhancer (unbuilt — groups 3-R/4-R).
//
// Classic script, no import/export (see corpus.js's header on why).
(function () {
  'use strict';

  /** AGENTS.md #3 ("no innerHTML with unsanitized input anywhere, including 'trusted' sources") is
   *  unconditional — even though this corpus is author-controlled LaTeX, not user input, every
   *  Temml-rendered HTML string is still routed through DOMPurify before touching the DOM. This is
   *  NOT group 2-R's own MathML sanitizer profile (that hasn't been built — D-5-R names it as the
   *  future work); it is a generic, permissive harness-local pass whose only job is to satisfy the
   *  no-unsanitized-innerHTML rule without pre-deciding what the real profile will allow. `class`
   *  and `style` are added because Temml's own real output (and Temml-STIX2.css, which this harness
   *  also reuses verbatim) both depend on them for correct cross-engine layout — DOMPurify's
   *  default MathML attribute allow-list does not include either.
   */
  function sanitize(html) {
    return window.DOMPurify.sanitize(html, { ADD_ATTR: ['class', 'style'] });
  }

  function escapeText(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  /** Renders one formula through the REAL installed temml. A parse/throw failure renders a
   *  plainly-labeled error note instead of crashing the whole harness (AGENTS.md #5, "never a
   *  blank page" — this is a harness, not the shipping degrade path, but the same spirit applies:
   *  one bad formula must not blank the rest of the corpus). */
  function renderMath(latex, displayMode) {
    try {
      return window.temml.renderToString(latex, { displayMode: displayMode, throwOnError: false });
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      return '<span style="color:var(--del,#B8512F)">temml threw: ' + escapeText(msg) + '</span>';
    }
  }

  function buildInlineSection(host) {
    const h2 = document.createElement('h2');
    h2.className = 'harness-class-heading';
    h2.textContent = 'Inline (running-text, $…$-context) samples';
    host.appendChild(h2);

    const p2 = document.createElement('p');
    p2.className = 'harness-note';
    p2.textContent =
      'Same temml engine, displayMode:false — Chrome/Firefox size and baseline-align inline math ' +
      'differently from the block/display samples below.';
    host.appendChild(p2);

    window.MATH_INLINE_SAMPLES.forEach(function (s) {
      const p = document.createElement('p');
      p.className = 'harness-inline-sample';

      const pre = document.createElement('span');
      pre.textContent = s.before + ' ';
      p.appendChild(pre);

      const mathSpan = document.createElement('span');
      mathSpan.className = 'harness-math-inline';
      mathSpan.innerHTML = sanitize(renderMath(s.latex, false));
      p.appendChild(mathSpan);

      const post = document.createElement('span');
      post.textContent = ' ' + s.after;
      p.appendChild(post);

      const tag = document.createElement('span');
      tag.className = 'harness-tag';
      tag.textContent = ' [' + s.cls + ': ' + s.latex + ']';
      p.appendChild(tag);

      host.appendChild(p);
    });
  }

  function buildBlockSection(host) {
    const h2top = document.createElement('h2');
    h2top.className = 'harness-class-heading';
    h2top.textContent = 'Block/display (' + window.MATH_CORPUS.length + '-formula dense corpus, grouped by class)';
    host.appendChild(h2top);

    const groups = {};
    const order = [];
    window.MATH_CORPUS.forEach(function (entry) {
      if (!groups[entry.cls]) {
        groups[entry.cls] = [];
        order.push(entry.cls);
      }
      groups[entry.cls].push(entry);
    });

    order.forEach(function (cls) {
      const h3 = document.createElement('h3');
      h3.className = 'harness-class-subheading';
      h3.textContent = cls;
      host.appendChild(h3);

      groups[cls].forEach(function (entry) {
        const fig = document.createElement('figure');
        fig.className = 'harness-formula';
        fig.setAttribute('data-class', entry.cls);

        const cap = document.createElement('figcaption');
        cap.className = 'harness-caption';
        cap.textContent = entry.label + '  —  ' + entry.latex;
        fig.appendChild(cap);

        const mathHost = document.createElement('div');
        mathHost.className = 'harness-math-block';
        mathHost.innerHTML = sanitize(renderMath(entry.latex, true));
        fig.appendChild(mathHost);

        host.appendChild(fig);
      });
    });
  }

  const BASE_STYLE =
    '.harness-root{font-family:var(--serif,serif);color:var(--ink,#16171F);}' +
    '.harness-class-heading{font-family:var(--sans,sans-serif);font-size:1.1rem;margin:2rem 0 0.5rem;' +
    'border-bottom:1px solid var(--line,#E6E6DF);padding-bottom:0.35rem;}' +
    '.harness-class-subheading{font-family:var(--sans,sans-serif);font-size:0.85rem;' +
    'text-transform:uppercase;letter-spacing:0.04em;color:var(--muted,#5D6070);margin:1.5rem 0 0.4rem;}' +
    '.harness-note{font-family:var(--sans,sans-serif);font-size:0.85rem;color:var(--muted,#5D6070);}' +
    '.harness-formula{margin:0 0 1.1rem;padding:0.75rem 1rem;background:var(--panel,#F4F4EF);' +
    'border:1px solid var(--line,#E6E6DF);border-radius:var(--r,10px);}' +
    '.harness-caption{font-family:var(--mono,monospace);font-size:0.78rem;color:var(--muted,#5D6070);' +
    'margin-bottom:0.5rem;word-break:break-word;}' +
    '.harness-math-block{font-size:1.3rem;}' +
    '.harness-inline-sample{margin:0 0 0.85rem;line-height:1.9;}' +
    '.harness-math-inline{font-size:1.1em;}' +
    '.harness-tag{font-family:var(--mono,monospace);font-size:0.75rem;color:var(--faint,#9A9DAC);}';

  async function main() {
    const fontPromise = typeof window.registerStixFont === 'function' ? window.registerStixFont() : undefined;
    try {
      await fontPromise;
    } catch {
      /* fonts.ts's own discipline: a font failing to decode must not break rendering */
    }
    try {
      await document.fonts.ready;
    } catch {
      /* no-op: some engines/contexts may not expose this */
    }

    const hostEl = document.getElementById('host');
    // {mode:'open'} — mirrors D-3-R's own app-page shadow-root context (src/render/mount.ts's
    // SHADOW_MODE), which is exactly the context task 1.1-R's own INPUT A proof measured the font
    // resolving inside.
    const root = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = BASE_STYLE + '\n' + window.TEMML_STIX_CSS;
    root.appendChild(style);

    const container = document.createElement('div');
    container.className = 'harness-root';
    root.appendChild(container);

    buildInlineSection(container);
    buildBlockSection(container);

    // Signals readiness to the capture script (harness/math-fidelity/capture.ts) — screenshots are
    // taken only after this attribute is set, so they never race the font swap or the corpus render.
    document.body.setAttribute('data-harness-ready', 'true');
  }

  document.addEventListener('DOMContentLoaded', function () {
    main().catch(function (e) {
      // AGENTS.md #5 spirit: never a blank page — surface the failure plainly instead of leaving
      // an empty host element with no explanation.
      const hostEl = document.getElementById('host');
      if (hostEl) {
        hostEl.textContent = 'Harness failed to render: ' + (e && e.message ? e.message : String(e));
      }
      document.body.setAttribute('data-harness-ready', 'error');
    });

    const btn = document.getElementById('themeToggle');
    if (btn) {
      const THEMES = ['light', 'dark', 'sepia'];
      let idx = 0;
      btn.addEventListener('click', function () {
        idx = (idx + 1) % THEMES.length;
        const t = THEMES[idx];
        if (t === 'light') {
          delete document.documentElement.dataset.theme;
        } else {
          document.documentElement.dataset.theme = t;
        }
        btn.textContent = 'theme: ' + t;
      });
    }
  });
})();
