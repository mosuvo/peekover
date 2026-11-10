// scripts/walk-probe.ts — the mechanical checks run on every walk-shots `--walk-d` capture (M13 task 8.1, walk D).
// Not a test; never in CI. It MEASURES and never judges design: the human judges the shots.
//
// One in-page expression (a string — the walk-shots convention: tsc never type-checks browser globals here), run
// on the same page right after its screenshot, read-only (it scrolls nothing and clicks nothing). It returns:
//   hScroll     the page scrolls sideways (scrollingElement.scrollWidth > clientWidth)
//   clipped     text cut by an overflow:hidden/clip box (sideways; or a box under three lines tall), or past the
//               viewport's right edge outside any scroll container
//   overlaps    two text runs drawn over each other with nothing opaque between them (topmost by hit-test)
//   occluded    text hidden under a fixed / sticky / absolute box (hit-tested at five points along each line);
//               a box covering over 60% of the viewport (a dialog's scrim) is left out
//               — both are measurements: an open menu over the text is reported as readily as a pill at rest
//   lowContrast text below WCAG 1.4.3 AA (4.5:1; 3:1 large), topmost text only, disabled controls exempt — the
//               arithmetic of tests/browser/helpers/contrast.ts (source-over in sRGB down to the first opaque
//               ancestor across shadow roots, canvas white; foreground alpha × every ancestor's opacity).
//               A backdrop with a background-image is not measured (counted in `unmeasured`), as in the helper.
//   controls    every rendered control's role and name, and `struct` (headings, images, tables, code, math) —
//               for the cross-engine "missing element" comparison in scripts/walk-sheet.ts.
// Only what is inside the viewport is checked for clipping, overlap and contrast (the PNG is the viewport).

export const PROBE = String.raw`(() => {
  const W = innerWidth, VH = innerHeight;
  const all = [];
  const walk = (n) => { for (const el of n.querySelectorAll('*')) { all.push(el); if (el.shadowRoot) walk(el.shadowRoot); } };
  walk(document);
  const up = (n) => { if (n.parentElement) return n.parentElement; const r = n.getRootNode(); return r instanceof ShadowRoot ? r.host : null; };
  const isAncOrEq = (a, b) => { for (let n = b; n; n = up(n)) if (n === a) return true; return false; };
  const cs = (e) => getComputedStyle(e);
  const parse = (v) => {
    v = v.trim();
    if (v === 'transparent') return [0, 0, 0, 0];
    let m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(v);
    if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4] / (m[5] ? 100 : 1)];
    m = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/.exec(v);
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4] / (m[5] ? 100 : 1)];
    return null;
  };
  const over = (t, u) => [t[0] * t[3] + u[0] * (1 - t[3]), t[1] * t[3] + u[1] * (1 - t[3]), t[2] * t[3] + u[2] * (1 - t[3]), 1];
  const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + [c[0], c[1], c[2]].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  const name = (e) => e.localName + (e.id ? '#' + e.id : '') + (e.classList.length ? '.' + [...e.classList].filter((c) => !/^ͼ/.test(c)).slice(0, 2).join('.') : '');
  const vis = (e) => { const s = cs(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inView = (r) => r.right > 0 && r.left < W && r.bottom > 0 && r.top < VH;
  const srOnly = (el) => { let n = el; for (let i = 0; i < 4 && n; i++, n = up(n)) { const r = n.getBoundingClientRect(); const s = cs(n); if ((r.width <= 2 || r.height <= 2) && s.overflow !== 'visible') return true; if (s.clip && s.clip.startsWith('rect(0')) return true; if ((s.clipPath || '').startsWith('inset(50%')) return true; } return false; };
  const hit = (x, y) => { let h = document.elementFromPoint(x, y); while (h && h.shadowRoot) { const d = h.shadowRoot.elementFromPoint(x, y); if (!d || d === h) break; h = d; } return h; };
  const opacityOf = (el) => { let o = 1; for (let n = el; n; n = up(n)) o *= +cs(n).opacity; return o; };

  // Text runs: an element with its own non-blank text, rendered, in the viewport.
  const items = [];
  for (const el of all) {
    if (el.closest('svg, script, style, noscript, template, .katex-mathml')) continue;
    const tn = [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!tn.length || !vis(el) || srOnly(el)) continue;
    const ink = parse(cs(el).color);
    const alpha = ink ? ink[3] * opacityOf(el) : 1;
    if (alpha < 0.02) continue;
    const rects = [];
    for (const t of tn) { const r = document.createRange(); r.selectNodeContents(t); for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1 && inView(q)) rects.push(q); }
    if (!rects.length) continue;
    items.push({ el, rects, text: tn.map((t) => t.nodeValue).join('').replace(/\s+/g, ' ').trim().slice(0, 60), ink, alpha });
  }

  // 1 · sideways scroll
  const se = document.scrollingElement || document.documentElement;
  const hScroll = se.scrollWidth > se.clientWidth + 1 ? { scrollWidth: se.scrollWidth, clientWidth: se.clientWidth } : null;

  // 2 · clipped text
  const clipped = [];
  for (const it of items) {
    const lh = parseFloat(cs(it.el).lineHeight) || parseFloat(cs(it.el).fontSize) * 1.3;
    const ell = cs(it.el).textOverflow === 'ellipsis';
    let why = null;
    for (const q of it.rects) {
      let xDone = false, yDone = false, inXScroll = false;
      for (let a = up(it.el); a && !(xDone && yDone); a = up(a)) {
        const s = cs(a);
        const r = a.getBoundingClientRect();
        const box = { l: r.left + a.clientLeft, t: r.top + a.clientTop };
        box.r = box.l + a.clientWidth; box.b = box.t + a.clientHeight;
        if (!xDone) {
          if (s.overflowX === 'auto' || s.overflowX === 'scroll') { xDone = true; inXScroll = true; }
          else if ((s.overflowX === 'hidden' || s.overflowX === 'clip') && !ell && s.textOverflow !== 'ellipsis') {
            const partial = q.left < box.r && q.right > box.l && (q.right > box.r + 1 || q.left < box.l - 1);
            if (partial) { why = 'cut sideways by ' + name(a) + ' (text ' + Math.round(q.left) + '–' + Math.round(q.right) + ', box ' + Math.round(box.l) + '–' + Math.round(box.r) + ')'; xDone = true; }
          }
        }
        if (!yDone) {
          if (s.overflowY === 'auto' || s.overflowY === 'scroll') yDone = true;
          else if ((s.overflowY === 'hidden' || s.overflowY === 'clip') && box.b - box.t < 3 * lh) {
            const partial = q.top < box.b && q.bottom > box.t && (q.bottom > box.b + 1 || q.top < box.t - 1);
            if (partial) { why = 'cut top/bottom by ' + name(a) + ' (text ' + Math.round(q.top) + '–' + Math.round(q.bottom) + ', box ' + Math.round(box.t) + '–' + Math.round(box.b) + ')'; yDone = true; }
          }
        }
      }
      if (!why && !inXScroll && q.right > W + 1 && q.left < W) why = 'past the viewport right edge (' + Math.round(q.right) + ' > ' + W + ')';
      if (why) break;
    }
    if (why) clipped.push({ el: name(it.el), text: it.text, why });
  }

  // 3 · text over text
  const overlaps = [];
  const seen = new Set();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j];
      if (isAncOrEq(A.el, B.el) || isAncOrEq(B.el, A.el)) continue;
      const ka = A.el.closest('.katex'), kb = B.el.closest('.katex');
      if (ka && ka === kb) continue;
      for (const p of A.rects) {
        let done = false;
        for (const q of B.rects) {
          const l = Math.max(p.left, q.left), r = Math.min(p.right, q.right), t = Math.max(p.top, q.top), b = Math.min(p.bottom, q.bottom);
          if (r - l <= 2 || b - t <= 2) continue;
          const x = (l + r) / 2, y = (t + b) / 2;
          const h = hit(x, y);
          if (!h) continue;
          const top = isAncOrEq(A.el, h) ? A : isAncOrEq(B.el, h) ? B : null;
          if (!top) continue;
          const bottom = top === A ? B : A;
          let covered = false;
          for (let n = top.el; n && !isAncOrEq(n, bottom.el); n = up(n)) {
            const bg = parse(cs(n).backgroundColor);
            const nr = n.getBoundingClientRect();
            if (bg && bg[3] >= 0.9 && x >= nr.left && x <= nr.right && y >= nr.top && y <= nr.bottom) { covered = true; break; }
          }
          if (covered) continue;
          const key = name(A.el) + '|' + A.text + '|' + name(B.el) + '|' + B.text;
          if (!seen.has(key)) { seen.add(key); overlaps.push({ top: name(top.el) + ' "' + top.text + '"', under: name(bottom.el) + ' "' + bottom.text + '"', at: [Math.round(x), Math.round(y)] }); }
          done = true; break;
        }
        if (done) break;
      }
    }
  }

  // 3b · text hidden under floating chrome (a fixed / sticky / absolute box drawn over it, not a full-page overlay)
  const occluded = [];
  for (const it of items) {
    let rep = null;
    for (const q of it.rects) {
      const y = (q.top + q.bottom) / 2;
      let hits = 0, tried = 0, by = null;
      for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const x = q.left + f * (q.right - q.left);
        if (x < 0 || x >= W || y < 0 || y >= VH) continue;
        tried++;
        const h = hit(x, y);
        if (!h || isAncOrEq(it.el, h) || isAncOrEq(h, it.el)) continue;
        let cover = null;
        for (let n = h; n && !isAncOrEq(n, it.el); n = up(n)) { const p = cs(n).position; if (p === 'fixed' || p === 'sticky' || p === 'absolute') cover = n; }
        if (!cover) continue;
        const cr = cover.getBoundingClientRect();
        if (cr.width * cr.height > 0.6 * W * VH) continue; // a dialog's scrim or a full overlay: by its nature
        hits++; by = cover;
      }
      if (hits) { rep = { el: name(it.el), text: it.text, by: name(by) + ' "' + (by.getAttribute('aria-label') || by.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) + '"', share: hits + '/' + tried }; break; }
    }
    if (rep) occluded.push(rep);
  }

  // 4 · contrast (topmost text only)
  const lowContrast = [];
  let unmeasured = 0;
  for (const it of items) {
    if (!it.ink) { unmeasured++; continue; }
    if (it.el.closest(':disabled, [aria-disabled="true"]')) continue;
    const q = it.rects[0];
    const h = hit(Math.min(Math.max((q.left + q.right) / 2, 0), W - 1), Math.min(Math.max((q.top + q.bottom) / 2, 0), VH - 1));
    if (!h || !(isAncOrEq(it.el, h) || isAncOrEq(h, it.el))) continue;
    const layers = [];
    let base = null, img = false;
    for (let n = it.el; n; n = up(n)) {
      const s = cs(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') { img = true; break; }
      const bg = parse(s.backgroundColor);
      if (!bg) { img = true; break; }
      if (bg[3] >= 1) { base = bg; break; }
      if (bg[3] > 0) layers.push(bg);
    }
    if (img) { unmeasured++; continue; }
    let bgc = base || [255, 255, 255, 1];
    for (const l of layers.reverse()) bgc = over(l, bgc);
    const drawn = over([it.ink[0], it.ink[1], it.ink[2], it.alpha], bgc);
    const s = cs(it.el);
    const px = parseFloat(s.fontSize), wt = +s.fontWeight || 400;
    const large = px >= 24 || (px >= 18.66 && wt >= 700);
    const r = ratio(drawn, bgc);
    const bar = large ? 3 : 4.5;
    if (r < bar - 0.005) lowContrast.push({ el: name(it.el), text: it.text, ratio: Math.round(r * 100) / 100, bar, fg: hex(drawn), bg: hex(bgc), px: Math.round(px * 10) / 10 });
  }

  // 5 · what is there, for the cross-engine comparison
  const CTRL = 'button, a[href], input, select, textarea, summary, [role="button"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="switch"], [role="link"], [role="radio"]';
  const controls = [...new Set(all.filter((e) => e.matches(CTRL) && vis(e) && !srOnly(e)).map((e) => {
    const lab = (e.getAttribute('aria-label') || e.textContent || e.value || e.getAttribute('placeholder') || e.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    return (e.getAttribute('role') || e.localName + (e.type && e.localName === 'input' ? ':' + e.type : '')) + ' · ' + lab;
  }))].sort();
  const count = (sel, f) => all.filter((e) => e.matches(sel) && vis(e) && (!f || f(e))).length;
  const struct = {
    headings: count('h1, h2, h3, h4, h5, h6'),
    images: count('img'),
    svg: count('svg', (e) => !(e.parentElement && e.parentElement.closest('svg'))),
    tables: count('table'),
    code: count('pre'),
    math: count('.katex'),
  };
  return { vw: W, vh: VH, hScroll, clipped: clipped.slice(0, 25), overlaps: overlaps.slice(0, 25), occluded: occluded.slice(0, 25), lowContrast: lowContrast.slice(0, 40), unmeasured, texts: items.length, controls, struct };
})()`;
