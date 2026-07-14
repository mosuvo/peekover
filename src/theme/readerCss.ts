// readerCss — the reader's entire stylesheet, as a string injected into the shadow
// root (never the host page). Two things live here and nothing else:
//
//   1. The design tokens (design/tokens.css is the SOURCE OF TRUTH — values here
//      are copied verbatim). They are scoped to `:host` instead of `:root` because
//      inside a shadow tree `:host` is the styleable root, and custom properties set
//      on it inherit down to every rendered node. All three themes are DEFINED
//      (light default, dark, sepia); in M1 only light/dark are ACTIVE, driven by the
//      OS `prefers-color-scheme` via a `data-theme` attribute the runtime sets on the
//      host (see theme/reader.ts). Sepia + manual switching are dormant until the
//      settings milestone wires a UI to them.
//
//   2. The reading typography — a centered ~76ch column of Literata on paper, styled
//      to design/mockup.html's `.doc` reading feel (headings, lists, tables, quotes,
//      code, links-as-ink+highlighter-underline, mark). Selectors target the plain
//      semantic tags markdown-it emits (h1..h6, p, ul/ol/li, blockquote, pre>code,
//      table, a, code, em/strong/del, img, hr) plus markdown-it-task-lists' classes.
//
// TRAP GUARD (docs/ai/decisions.md 2026-07-10, brand.html): anything sitting ON the
// highlighter must use a LITERAL dark hex for its text, NEVER var(--ink). --hl stays
// yellow in every theme, but --ink INVERTS to near-white in dark mode — so var(--ink)
// text on --hl would vanish in dark. `mark` and link:hover text below use literal
// hex for exactly this reason. (The task-list checkmark uses var(--paper) on
// var(--accent): those two ALWAYS contrast — opposite ends of the theme — so that
// pairing is safe and is not a trap case.)

/** The <style> payload for the reader shadow root: tokens + reading typography. */
export const READER_CSS = /* css */ `
/* ============ Design tokens (design/tokens.css — verbatim) ============ */
:host{
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --code-bg:#F1F1EB;
  --accent:#16171F; --accent-soft:#ECECE3;
  --hl:#FFE94A; --hl-soft:#FFF6BF;
  --ok:#1F9D55; --ok-soft:#E4F5EB; --warn:#B7791F;
  --del:#B8512F; --del-soft:#F8E9E2;
  --logo-ink:#16171F; --logo-eye:#FBFBF8;
  --r:10px; --shadow:0 10px 30px rgba(22,23,31,.10);
  --serif:"Literata",Georgia,serif; --sans:"Bricolage Grotesque",system-ui,sans-serif;
  --mono:"Sometype Mono",ui-monospace,monospace;
}
:host([data-theme="dark"]){
  --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
  --line:#262A38; --code-bg:#1C2030;
  --accent:#EAEBF3; --accent-soft:#232838;
  --hl:#FFD84D; --hl-soft:#3A3413;
  --ok:#4CC38A; --ok-soft:#15291F; --warn:#E0A83E;
  --del:#E08663; --del-soft:#342016;
}
:host([data-theme="sepia"]){
  --paper:#F6EEDF; --ink:#3B2F1E; --accent:#3B2F1E; --accent-soft:#E9DCC1;
}

/* ============ Shadow root as a full-bleed reader takeover ============ */
/* Fixed to the viewport so the paper reaches every edge regardless of the host
   page's body margins — we style ONLY our own shadow host, never the page. The
   original page nodes are already display:none'd by mountReader. */
:host{
  all:initial;
  display:block;
  position:fixed;
  inset:0;
  overflow:auto;
  background:var(--paper);
  color:var(--ink);
  font-family:var(--serif);
  font-size:17px;
  line-height:1.7;
  -webkit-text-size-adjust:100%;
  text-rendering:optimizeLegibility;
  scroll-behavior:smooth;
}
:host *,:host *::before,:host *::after{box-sizing:border-box}
:host :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
:host ::selection{background:var(--hl-soft)}
@media (prefers-reduced-motion:reduce){
  :host{scroll-behavior:auto}
  :host *{animation-duration:.001ms!important;transition-duration:.001ms!important}
}

/* ============ Reading column ============ */
.peekover-reader{
  max-width:76ch;
  margin:0 auto;
  padding:56px 32px 130px;
  width:100%;
}
.peekover-reader > :first-child{margin-top:0}

/* ---- headings ---- */
.peekover-reader h1,.peekover-reader h2,.peekover-reader h3,
.peekover-reader h4,.peekover-reader h5,.peekover-reader h6{
  font-family:var(--serif);font-weight:600;color:var(--ink);
  letter-spacing:-.01em;line-height:1.2;
}
.peekover-reader h1{font-size:44px;line-height:1.12;letter-spacing:-.015em;margin:0 0 14px}
.peekover-reader h2{font-size:27px;margin:52px 0 14px}
.peekover-reader h3{font-size:20px;margin:36px 0 10px}
.peekover-reader h4{font-size:16px;margin:28px 0 8px}
.peekover-reader h5{font-size:13px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.peekover-reader h6{font-size:12px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)}

/* ---- prose ---- */
.peekover-reader p{margin:0 0 16px}
.peekover-reader strong{font-weight:700}
.peekover-reader em{font-style:italic}
.peekover-reader del,.peekover-reader s{color:var(--muted)}
.peekover-reader sup,.peekover-reader sub{font-size:.75em;line-height:0}
.peekover-reader hr{border:none;border-top:1px solid var(--line);margin:40px 0}
.peekover-reader img{max-width:100%;height:auto;border-radius:var(--r)}

/* links: ink text + highlighter underline (brand: interactive = ink + highlighter) */
.peekover-reader a{
  color:var(--ink);text-decoration:none;
  background:linear-gradient(transparent 72%, var(--hl) 72%);
  padding:0 1px;transition:background .15s;border-radius:2px;
}
.peekover-reader a:hover{background:var(--hl);color:#26210a}   /* literal: text on highlighter */
:host([data-theme="dark"]) .peekover-reader a{background:linear-gradient(transparent 88%, var(--hl) 88%)}
:host([data-theme="dark"]) .peekover-reader a:hover{color:#191504} /* literal: text on highlighter */

/* highlight: literal dark text — --hl is yellow in every theme, so NEVER var(--ink) */
.peekover-reader mark{background:var(--hl);color:#26210a;padding:0 3px;border-radius:3px}
:host([data-theme="dark"]) .peekover-reader mark{color:#191504}

/* ---- lists ---- */
.peekover-reader ul,.peekover-reader ol{margin:0 0 16px;padding-left:1.5em}
.peekover-reader li{margin:6px 0}
.peekover-reader li::marker{color:var(--faint)}
.peekover-reader li > ul,.peekover-reader li > ol{margin:6px 0 0}

/* task lists (markdown-it-task-lists): rendered checkboxes, disabled */
.peekover-reader ul.contains-task-list{list-style:none;padding-left:0}
.peekover-reader li.task-list-item{display:flex;align-items:flex-start;gap:11px;margin:7px 0}
.peekover-reader li.task-list-item::marker{content:""}
.peekover-reader input[type="checkbox"]{
  appearance:none;-webkit-appearance:none;
  width:19px;height:19px;margin:3px 0 0;flex:none;position:relative;
  border:2px solid var(--faint);border-radius:6px;background:var(--paper);
}
.peekover-reader input[type="checkbox"]:checked{background:var(--accent);border-color:var(--accent)}
/* checkmark: var(--paper) on var(--accent) — always-opposite pair, safe in both themes */
.peekover-reader input[type="checkbox"]:checked::after{
  content:"";position:absolute;left:3.5px;top:4px;width:8px;height:4.5px;
  border:solid var(--paper);border-width:0 0 2.5px 2.5px;transform:rotate(-45deg);
}

/* ---- blockquote ---- */
.peekover-reader blockquote{
  margin:24px 0;padding:4px 22px;border-left:3px solid var(--hl);
  color:var(--muted);font-style:italic;
}
.peekover-reader blockquote p:last-child{margin-bottom:0}

/* ---- code ---- */
.peekover-reader code{
  font-family:var(--mono);font-size:.85em;
  background:var(--code-bg);padding:1px 5px;border-radius:4px;
}
.peekover-reader pre{
  font-family:var(--mono);font-size:13.5px;line-height:1.7;
  background:var(--code-bg);border:1px solid var(--line);border-radius:var(--r);
  padding:22px;margin:22px 0;overflow:auto;
}
.peekover-reader pre code{background:none;padding:0;font-size:inherit;border-radius:0}

/* ---- tables ---- */
.peekover-reader table{
  width:100%;border-collapse:collapse;font-family:var(--sans);font-size:14.5px;
  margin:22px 0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
}
.peekover-reader th{
  text-align:left;background:var(--panel);padding:11px 16px;
  font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
}
.peekover-reader td{padding:11px 16px;border-top:1px solid var(--line);color:var(--ink)}

/* ============ Raw fallback (never a blank page — AGENTS.md #5) ============ */
.peekover-raw{
  max-width:76ch;margin:56px auto;padding:26px;
  font-family:var(--mono);font-size:13px;line-height:1.75;color:var(--muted);
  background:var(--code-bg);border:1px solid var(--line);border-radius:var(--r);
  overflow:auto;white-space:pre-wrap;word-break:break-word;
}

/* ============ Raw <-> Reading toggle (task 4.2) ============ */
/* View visibility is driven PURELY by data-mode on the host, so toggling is an
   attribute flip — parse/sanitize never re-run. The failure path sets NO data-mode
   (banner + raw is the only view there), so neither rule hides its raw <pre>. */
:host([data-mode="reading"]) .peekover-raw{display:none}
:host([data-mode="raw"]) .peekover-reader{display:none}

/* One minimal pill, fixed in an unobtrusive corner. Styled from tokens (panel/ink/
   line) — NOT the mockup's full toolbar. Stays put while the column scrolls; its
   transition is neutralised under prefers-reduced-motion by the global rule above. */
.peekover-mode-toggle{
  position:fixed;top:16px;right:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 15px;cursor:pointer;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-mode-toggle:hover{color:var(--ink);border-color:var(--faint)}

/* ============ Render-failure banner (AGENTS.md #5, upgraded) ============ */
/* A quiet left-accent alert (mockup .alert.warn) — a left border bar, NOT a heavy
   filled box. Shown ONLY on the failure path, above the raw source; a user-chosen
   Raw view (via the toggle) has NO banner. */
.peekover-alert{
  max-width:76ch;margin:26px auto 0;padding:12px 16px;
  font-family:var(--sans);font-size:14px;color:var(--ink);
  background:var(--hl-soft);
  border-left:3px solid var(--warn);border-radius:0 var(--r) var(--r) 0;
}
`;
