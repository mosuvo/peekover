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
// hex for exactly this reason. The dark link:hover rule repeats the solid --hl fill: the dark
// thin-underline rule for links is more specific than the plain a:hover, so without it the dark
// text sat on the dark page (walk fix 8.1b).
//
// WATCH NOTE AS AN ASIDE (walk fix 8.1c): a watch note with no Watch control beside it (a raw web
// page; Firefox file://) is placed after the reading column by mount() and marked
// data-place="aside"; it flows after the last line, aligned to the column's text edge, so it never
// covers text. The column's 130px bottom room for the floating pills moves below the aside.
// 8.1h (HUMAN RULING, option A): a quiet footnote, not a card — its box mirrors the reading column
// (the same measure, padding and margins, the contents-rail rule included), so its text starts at
// the paragraphs' left x at every width; no fill, border, accent bar or shadow; the note's own muted
// 12px UI face. 8.1c's margin formula ignored the rail (298px vs the text's 173px at 1280). (The task-list checkmark uses var(--paper) on
// var(--accent): those two ALWAYS contrast — opposite ends of the theme — so that
// pairing is safe and is not a trap case.)

/**
 * The <style> payload for the reader shadow root: tokens + reading typography.
 *
 * VIEW VISIBILITY AND `data-mode="edit"` (012 task 2.1). The two original rules each hide the
 * OTHER view for their own mode, so a third `data-mode` value matched neither and both the
 * reading column and the raw <pre> stayed on screen. 'edit' is therefore a second selector on
 * EACH of those two rules, hiding both; what takes their place is the edit view a later task
 * builds. It is folded into the existing rules rather than written as a rule of its own so that
 * READER_CSS gains no new `:host` rule site (htmlExport.test.ts pins that count; human-ruled at
 * 2.1 — the export drops every `data-mode` rule either way). Nothing here can blank a
 * page on its own: readerMode.ts writes 'edit' only from enterEditMode, after the edit view is
 * built, and its setReaderMode turns a carried 'edit' back into 'reading'. Rationale for rules
 * in this file belongs up here — a comment inside the template literal ships as bytes.
 */
export const READER_CSS = /* css */ `
/* ============ Design tokens (design/tokens.css — verbatim) ============ */
:host{
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
  --line:#E6E6DF; --code-bg:#F1F1EB;
  --accent:#16171F; --accent-soft:#ECECE3;
  --hl:#FFE94A; --hl-soft:#FFF6BF;
  --ok:#1F9D55; --ok-soft:#E4F5EB; --warn:#B7791F;
  --del:#B8512F; --del-soft:#F8E9E2;
  --code-str:#197E44; --code-num:#B34F2E; --code-type:#966319;
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
  --code-str:#4CC38A; --code-num:#E08663; --code-type:#E0A83E;
  --shadow:0 10px 30px rgba(0,0,0,.5);
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
  scrollbar-color:var(--faint) transparent;
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
/* Measure: ONE value, referenced twice (max-width + the data-toc margin). Why px not ch: B1 block. */
:host{ --reader-measure:748px; }
.peekover-reader{
  max-width:var(--reader-measure);
  margin:0 auto;
  padding:56px 32px 130px;
  width:100%;
}
.peekover-reader > :first-child{margin-top:0}
@media screen and (max-width:1280px){.peekover-mode-toggle~.peekover-reader{padding-top:calc(var(--toc-handle-top) + var(--toc-handle-h) + 30px)}.peekover-mode-toggle~.peekover-raw{margin-top:calc(var(--toc-handle-top) + var(--toc-handle-h) + 30px)}}

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
.peekover-reader h6{font-size:12px;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}

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
:host([data-theme="dark"]) .peekover-reader a:hover{background:var(--hl);color:#191504} /* literal: text on highlighter */

/* highlight: literal dark text — --hl is yellow in every theme, so NEVER var(--ink) */
.peekover-reader mark{background:var(--hl);color:#26210a;padding:0 3px;border-radius:3px}
:host([data-theme="dark"]) .peekover-reader mark{color:#191504}

/* ---- lists ---- */
.peekover-reader ul,.peekover-reader ol{margin:0 0 16px;padding-left:1.5em}
.peekover-reader li{margin:6px 0}
.peekover-reader li::marker{color:var(--muted)}
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
/* Table tools toolbar (008 task 3.3, D-12) — the EMPTY host; rationale + tokens: below this literal */
.peekover-reader .peekover-table-tools{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px;
  margin:22px 0 8px;
  font-family:var(--sans);font-size:12px;color:var(--muted);
}
.peekover-reader .peekover-table-tools + table{margin-top:0}

.peekover-reader .peekover-table-filter__label{display:inline-flex;align-items:center;gap:6px}
.peekover-reader .peekover-table-filter{
  font-family:var(--sans);font-size:12px;color:var(--ink);background:var(--paper);
  border:1px solid var(--line);border-radius:7px;padding:5px 9px;margin:0;width:12em;
}
.peekover-reader .peekover-table-filter:hover{border-color:var(--faint)}
.peekover-reader .peekover-table-sort{
  font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;text-align:inherit;
  background:transparent;border:0;border-radius:4px;padding:0;margin:0;cursor:pointer;
}
.peekover-reader .peekover-table-sort:hover,.peekover-reader th[aria-sort$="ending"] .peekover-table-sort{color:var(--ink)}
.peekover-reader .peekover-table-sort__glyph{color:var(--accent);font-size:10px;margin-left:4px}

/* ============ Raw fallback (never a blank page — AGENTS.md #5) ============ */
.peekover-raw{
  margin:56px calc(max(0px,(100% - var(--reader-measure)) / 2) + 32px);padding:26px;
  font-family:var(--mono);font-size:13px;line-height:1.75;color:var(--muted);
  background:var(--code-bg);border:1px solid var(--line);border-radius:var(--r);
  overflow:auto;white-space:pre-wrap;word-break:break-word;
}

/* ============ Raw <-> Reading toggle (task 4.2) ============ */
/* View visibility is driven PURELY by data-mode on the host, so toggling is an
   attribute flip — parse/sanitize never re-run. The failure path sets NO data-mode
   (banner + raw is the only view there), so neither rule hides its raw <pre>. */
:host([data-mode="reading"]) .peekover-raw,:host([data-mode="edit"]) .peekover-raw{display:none}
:host([data-mode="raw"]) .peekover-reader,:host([data-mode="edit"]) .peekover-reader{display:none}

/* ============ Diff view (task 6.1, D-15) ============ */
/* Entering a diff is an ATTRIBUTE FLIP, not a re-render: data-diff="active" on the HOST — mirroring
   data-watch/data-mode — hides the reading column while a lazily-built sibling .peekover-diff
   (diffView.ts) takes its place. The host attribute survives replaceChildren (like data-watch); the
   .peekover-reader DOM is never touched, so exit is just clearing the attribute + restoring the
   reading anchor. SEPARATE from data-mode on purpose: a diff is not a view mode (data-mode is
   'reading' | 'raw' | 'edit' — readerMode.ts's ReaderMode). */
:host([data-diff="active"]) .peekover-reader{display:none}

/* The diff occupies the reading column's space — same centered measure and padding as
   .peekover-reader, so a diff reads at the width the document did. */
.peekover-diff{
  max-width:var(--reader-measure);margin:0 auto;padding:56px 32px 130px;width:100%;
  font-family:var(--serif);color:var(--ink);
}
.peekover-diff > :first-child{margin-top:0}
/* Hunks: the kind's fill, --ink text (AA), removed struck through; rationale: decisions.md, M13 TASK 5.4. */
.peekover-diff .diff-added,.peekover-diff .diff-removed,.peekover-diff .diff-unchanged{border-radius:5px;padding:2px 12px;margin:2px 0}
.peekover-diff .diff-added{background:var(--ok-soft);color:var(--ink)}
.peekover-diff .diff-removed{background:var(--del-soft);color:var(--ink);text-decoration:line-through}
.peekover-diff .diff-unchanged{color:var(--muted)}
.peekover-diff a{color:inherit}

.peekover-mode-toggle,.peekover-theme-toggle,.peekover-watch,.peekover-agent-badge,.peekover-remote-load,.peekover-net{
  position:fixed;left:16px;z-index:2;margin:0;
  font:600 12.5px/1 var(--sans);white-space:nowrap;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:8px;
  padding:7px 11px;box-shadow:var(--shadow);
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-mode-toggle,.peekover-theme-toggle,.peekover-watch,.peekover-remote-load{cursor:pointer}
.peekover-mode-toggle:hover,.peekover-theme-toggle:hover,.peekover-watch:hover,.peekover-remote-load:hover{color:var(--ink);border-color:var(--faint)}
.peekover-mode-toggle{top:16px;left:auto;right:16px}
.peekover-watch,.peekover-agent-badge,.peekover-net{border-radius:999px}

/* ============ Theme control (task 5.1 — auto/light/dark) ============ */
/* The same pill chrome as the mode toggle, in the BOTTOM-LEFT, stacked above the network
   indicator. The corner is chosen by elimination, not taste — every other one is already
   claimed, and this is the M3 collision defect class:
     - the whole RIGHT side belongs to the TOC rail (full height, right:0). A top-right pill
       stacked under the mode toggle looks free at a wide viewport but collides with the rail's
       handle at a narrow one, where the rail clamps to 38vw and its content shifts left into
       exactly that band. Measured, not assumed.
     - TOP-RIGHT is the mode toggle, TOP-LEFT the remote-load opt-in.
   That leaves the bottom-left, which only the network indicator uses (bottom:16px, and hidden
   until the user triggers a network action) — so this sits one pill-height above it at 56px and
   the two never intersect whether or not the indicator is lit. Tokens ONLY. */
.peekover-theme-toggle{bottom:56px}

/* ============ Watch control (spec 005 task 4.1 — "watching") ============ */
/* THE MOCKUP'S BADGE, TRANSLATED INTO THIS READER'S CHROME FAMILY — not its toolbar.
   design/mockup.html puts a .watch button with a .dot span inside
   in a fixed 52px top bar beside a brand, a breadcrumb, an AI button and a segmented mode
   control. None of that exists here and this task does not build it (see watchControl.ts's
   header). What IS carried across: the pill shape, the --ok "live and healthy" semantic, the
   pulsing dot, the --ok-soft hover, and the word "watching".

   PLACEMENT, BY ELIMINATION AND BY MEASUREMENT (004's 5.1 method; rects in watchControl.ts):
   top-right is the mode toggle and the row beneath it is the TOC handle; top-left is the
   remote-load opt-in and exists only sometimes; bottom-right sits inside the TOC rail box AND
   its live entry list at a narrow viewport. The bottom-left column is the one that clears
   everything, so this is its THIRD tenant: network indicator (16) -> theme pill (56) -> watch
   (96). Asserted at a narrow and a wide viewport on both surfaces.

   TWO TOKENS THE MOCKUP USES AND THIS FILE ALREADY DEFINES: --ok and --ok-soft, in BOTH themes
   (see the token blocks at the top — copied verbatim from design/tokens.css). No token had to be
   added; substituting --accent here would have silently thrown away the "this is live" meaning.

   ONE MOCKUP DECLARATION DELIBERATELY DROPPED: its border is
   1px solid color-mix(in srgb, var(--ok) 35%, transparent). color-mix() appears NOWHERE in
   Peekover's shipped CSS, and introducing a new CSS feature for one border is not worth it — the
   pill family's own var(--line) border is used instead. Nothing is lost: the --ok semantic is
   carried by the TEXT and the DOT, which are also the two carriers a colour-blind user reads via
   the label change rather than the hue (a11y — state is never colour-only). */
.peekover-watch{bottom:96px;display:inline-flex;align-items:center;gap:7px;padding:7px 13px}
/* ACTIVE: the mockup's green. Driven off the HOST attribute, so it survives replaceChildren —
   which matters precisely because watching is what causes the re-render. */
:host([data-watch="active"]) .peekover-watch{color:var(--ink);border-color:var(--ok)}
:host([data-watch="active"]) .peekover-watch:hover{color:var(--ink);background:var(--ok-soft)}

.peekover-watch__dot{
  flex:none;width:7px;height:7px;border-radius:50%;
  background:var(--muted);
}
/* The pulse — an expanding ring that then vanishes, the mockup's @keyframes pulse with the
   color-mix ring replaced by the --ok-soft token. INFINITE, and therefore the strongest possible
   case for prefers-reduced-motion: the global :host * animation-duration:.001ms!important rule
   near the top of this sheet neutralises it under reduce, which the browser suite asserts
   NON-VACUOUSLY (it measures the un-reduced 2s path in the same run). */
:host([data-watch="active"]) .peekover-watch__dot{
  background:var(--ok);
  animation:peekover-watch-pulse 2s infinite;
}
@keyframes peekover-watch-pulse{
  0%,100%{box-shadow:0 0 0 0 var(--ok-soft)}
  55%{box-shadow:0 0 0 6px transparent}
}

/* THE UPDATE SIGNAL (task 4.2) — the mockup's .flash keyframe and its 1.6s duration, applied to
   the CONTROL rather than to the changed element. 005 re-renders the whole document and cannot
   know WHICH element changed without a diff, and the diff is 006; flashing the whole reading
   column instead would wash the entire document on every agent keystroke, which is the opposite
   of brief and non-intrusive. Flashing the chrome that already means "this file is live" says
   exactly what 005 knows and nothing it does not. Full argument: watchController.ts, DECISION 2.
   Neutralised under reduce by the same global animation-duration rule as the pulse. */
.peekover-watch.is-updated{animation:peekover-watch-flash 1.6s ease}
@keyframes peekover-watch-flash{
  0%{background:var(--hl-soft)}
  100%{background:var(--panel)}
}

/* THE DESIGNED EXPLANATION (tasks 4.3 + 4.4) — NOT a disabled control, NOT a dead toggle.
   One element serves both honesty cases, because from the user's side they are the same case:
   watching is not happening, and here is why, in plain language. 4.3 = a watch that DIED (the file
   stopped being readable) — it appears WITHOUT a re-render, so the last good render stays exactly
   where it is (AGENTS.md #5: never blank, and never a silent failure either). 4.4 = a watch that
   could never START on this Firefox surface.

   It sits directly above the watch pill in the same bottom-left column and is width-capped so it
   reads as a quiet aside rather than a modal — the document stays the hero. The left accent bar
   borrows the render-failure banner's language (.peekover-alert) so degraded states across the
   reader look like one family. --warn, not --del: this is "something you should know", not an
   error the user caused. Tokens ONLY. */
.peekover-watch-note{
  position:fixed;bottom:136px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--warn);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-watch-note[hidden]{display:none}
.peekover-watch-note[data-place="aside"]{position:static;max-width:var(--reader-measure);width:100%;margin:0 auto 130px;padding:0 32px;background:none;border:0;border-radius:0;box-shadow:none}
:host([data-toc="open"]) .peekover-watch-note[data-place="aside"]{width:auto;margin-right:var(--toc-w);margin-left:max(0px,calc((100% - var(--reader-measure) - var(--toc-w)) / 2))}
.peekover-reader:has(+.peekover-watch-note[data-place="aside"]){padding-bottom:24px}

/* The persistent capture disclosure (task 3.1, D-3) — a SEPARATE channel from the watch note,
   sitting one 40px step above it in the same bottom-left column (net 16 · theme 56 · watch pill 96
   · watch note 136 · disclosure 176). It BORROWS the note's quiet-aside shape — same width cap,
   typography, panel fill, fixed/absolute split — because both are the reader's calm asides. What
   differs is the accent, and that difference is the semantic: the note is a WARNING (--warn amber,
   "something you should know"); this is INFORMATIONAL (--accent, the brand ink), a standing
   statement that capture is on and on-device. Ink, not amber, so it reads as disclosure rather than
   alarm. Tokens ONLY. */
.peekover-watch-disclosure{
  position:fixed;bottom:176px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--accent);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-watch-disclosure[hidden]{display:none}

/* ============ Diff affordance + snapshot picker (task 6.2, D-14) ============ */
/* Top-left below the remote-load slot, MEASURED not chosen (the 4.1 rule) — on the CONTAINED pane,
   because D-14 ships this chrome to the app page only. The candidate-by-candidate rects that ruled
   out the bottom-left stack, both top-right slots and bottom-right live in diffChrome.ts's header
   (a .ts comment, so it does not ship; THESE css comments are inside a template literal and DO).
   Geometry is asserted at the wide viewport in tests/browser/diffChrome.browser.test.ts. */
.peekover-diff-affordance{
  position:fixed;top:56px;left:16px;z-index:2;
  font-family:var(--sans);font-size:12.5px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:7px 15px;cursor:pointer;
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-diff-affordance:hover{color:var(--ink);border-color:var(--faint)}
/* While a diff is on screen the pill's gesture is EXIT, and it says so — the label and aria-label
   both change (diffChrome.ts), so the state is never carried by colour alone (§5). --accent is the
   brand ink: this is an active, actionable mode, not a warning. Deliberately NOT --ok (that is
   watch's "live and healthy" semantic) and NOT --del (already double-booked between the network
   indicator and diff-removed — see .peekover-diff .diff-removed above). */
.peekover-diff-affordance[data-diff-open="true"]{color:var(--accent);border-color:var(--accent)}

/* The snapshot picker — a listbox anchored under the pill, NEVER a dialog: no backdrop, no dim, no
   focus trap, no centering (mockup divergence 1 — the mockup's modal vs spec §3.7's inline; the
   verbatim record is at diffChrome.ts's rendering site, per plan §1.7). Sized to the measured slot
   and scrolling internally so a full retention window stays one calm list. Tokens ONLY. */
.peekover-diff-picker{
  position:fixed;top:94px;left:16px;z-index:2;
  box-sizing:border-box;width:240px;max-width:calc(100vw - 32px);
  max-height:min(46vh,320px);overflow:auto;
  background:var(--panel);border:1px solid var(--line);border-radius:var(--r);
  box-shadow:var(--shadow);padding:5px;
}
.peekover-diff-picker[hidden]{display:none}
/* One row = one comparison target. A <button>, so Enter/Space and the tab order come for free. */
.peekover-diff-picker__item{
  display:flex;align-items:baseline;justify-content:space-between;gap:10px;
  width:100%;box-sizing:border-box;text-align:left;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:none;border:0;border-radius:calc(var(--r) - 3px);
  padding:7px 9px;cursor:pointer;
  transition:color .15s,background .15s;
}
.peekover-diff-picker__item:hover{color:var(--ink);background:var(--paper)}
.peekover-diff-picker__when{font-weight:600}
.peekover-diff-picker__size{color:var(--muted);font-variant-numeric:tabular-nums}

/* The fallback / empty-state line (plan §1.5, §7-8) — shown BESIDE the untouched reader when a
   comparison cannot be made: the document stays exactly on screen, data-diff is never set, never
   blank (AGENTS.md #5). It occupies the picker's slot, which is safe because the two are mutually
   exclusive by construction in diffChrome.ts (every path closes one before showing the other).
   It BORROWS .peekover-watch-note's shape and its --warn accent, and that is the semantic, not
   laziness: "comparison unavailable" and "no snapshots yet" are the same class of thing the watch
   note carries — something you should know, not an error you caused. --accent is reserved for the
   informational capture disclosure (3.1), which this is not. Tokens ONLY. */
.peekover-diff-status{
  position:fixed;top:94px;left:16px;z-index:2;
  margin:0;max-width:34ch;
  font-family:var(--sans);font-size:12px;line-height:1.5;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-left:3px solid var(--warn);
  border-radius:0 var(--r) var(--r) 0;
  padding:9px 13px;box-shadow:var(--shadow);
}
.peekover-diff-status[hidden]{display:none}

/* Agent-file badge (008 task 1.3, D-1/D-2/D-12) — PROVISIONAL LANE, rationale: below this literal */
.peekover-agent-badge{top:56px;font-size:12px;padding:6px 11px}

/* ============ Remote-resource policy (block-by-default) ============ */
/* A blocked remote image becomes this inert, themed placeholder (no src → cannot
   fetch; the original URL rides on data-peekover-src for one-click restore). Inline
   so it is valid inside a paragraph, and dashed to read as "withheld", not broken. */
.peekover-remote{
  display:inline-flex;align-items:baseline;gap:9px;
  max-width:100%;margin:2px 0;padding:8px 13px;vertical-align:middle;
  font-family:var(--sans);font-size:13px;color:var(--muted);
  background:var(--panel);border:1px dashed var(--line);border-radius:var(--r);
}
.peekover-remote__badge{
  flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--muted);
}
.peekover-remote__alt{font-style:italic;overflow-wrap:anywhere}

/* Opt-in affordance: one pill in the top-left, mirroring the mode-toggle chrome
   (top-right). Removes itself once clicked — a one-shot; reload re-blocks. */
.peekover-remote-load{top:16px}

/* Network indicator: the "this view has now used the network" light. Ships HIDDEN
   and is revealed ONLY when the host carries data-network="active" (set the moment
   the user opts into a network action) — then it stays for the rest of the view. It
   never shows otherwise (AGENTS.md #1). --del is the one warm accent — a deliberate,
   honest signal that the zero-network default has been left. */
.peekover-net{bottom:16px;display:none;align-items:center;gap:8px;font-size:12px;padding:6px 11px}
:host([data-network="active"]) .peekover-net{display:inline-flex}
.peekover-net__dot{
  flex:none;width:8px;height:8px;border-radius:50%;
  background:var(--del);box-shadow:0 0 0 3px var(--del-soft);
}

/* ============ Render-failure banner (AGENTS.md #5, upgraded) ============ */
/* A quiet left-accent alert (mockup .alert.warn) — a left border bar, NOT a heavy
   filled box. Shown ONLY on the failure path, above the raw source; a user-chosen
   Raw view (via the toggle) has NO banner. */
.peekover-alert{
  max-width:76ch;margin:26px auto 0;padding:10px 14px;
  font-family:var(--sans);font-size:13px;line-height:1.5;color:var(--ink);
  background:color-mix(in srgb,var(--hl-soft) 55%,transparent);
  border-left:3px solid var(--warn);border-radius:0 var(--r) var(--r) 0;
}

/* ============ TOC rail (task 2.2 — right-side "on this page" navigation) ============ */
/* Quiet right-rail chrome, a SIBLING of the reading column and the pills — never inside
   .peekover-reader (that column stays byte-identical). Same fixed→absolute containment
   trick the pills use under {contained} (CONTAINED_CSS below). Width is a per-view custom
   property --toc-w that the resize drag (3.4) rewrites; open/collapsed keys off data-toc on
   the host (initialTocOpen sets it in 2.1; the backtick toggle flips it in 2.3). Tokens
   ONLY — panel/line for the surface, muted/faint/ink for text, hl for the active mark. */
:host{ --toc-w:250px; --toc-handle-top:52px; --toc-handle-h:30px; }

.peekover-toc{
  position:fixed;top:54px;right:8px;bottom:8px;z-index:1;
  box-sizing:border-box;width:calc(var(--toc-w) - 8px);max-width:calc(38vw - 8px);
  overflow:auto;padding:18px 18px 121px;
  /* OPAQUE surface (group-3 gate fix): without a background the rail is see-through and
     the reading column's text shows THROUGH it. --paper matches the page; the card's
     border and shadow set it off. (Collapsed, the handle's box is paper-on-paper.) */
  background:var(--paper);
  font-family:var(--sans);font-size:13px;line-height:1.5;color:var(--muted);
  border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);
  scrollbar-color:var(--faint) transparent;
}

/* Always-present opener/handle heading the rail — the single control that flips data-toc,
   and the affordance that MUST survive the collapsed state (a hidden whole-rail with no way
   back was the ship-dark defect). A pill echoing the mode-toggle chrome; the ☰ glyph via an
   escaped code point (\\2630) so no literal control byte lands in this string. */
.peekover-toc__toggle{
  display:inline-flex;align-items:center;gap:7px;margin:0 0 12px;
  font-family:var(--sans);font-size:12px;font-weight:600;letter-spacing:.02em;
  color:var(--muted);background:var(--panel);
  border:1px solid var(--line);border-radius:999px;
  padding:6px 13px;cursor:pointer;
  transition:color .15s,background .15s,border-color .15s;
}
.peekover-toc__toggle:hover{color:var(--ink);border-color:var(--faint)}
.peekover-toc__toggle::before{content:"\\2630";font-size:13px;line-height:1;color:var(--faint)}

/* Collapsed (narrow scrollport / toggled off) collapses the rail TO ITS HANDLE — the list
   body is hidden, but the opener stays visible and clickable so the TOC is never unreachable.
   The nav shrinks to fit the handle and drops the card; its top offset clears
   the top-right mode pill. The document stays the hero — the reading column is untouched. */
:host([data-toc="collapsed"]) .peekover-toc{
  top:0;right:0;bottom:auto;width:auto;max-width:38vw;height:auto;overflow:visible;
  padding:var(--toc-handle-top) 16px 16px;border:none;border-radius:0;box-shadow:none;
}
:host([data-toc="collapsed"]) .peekover-toc__list{display:none}
:host([data-toc="collapsed"]) .peekover-toc__toggle{margin:0}
:host([data-toc="collapsed"]) .peekover-mode-toggle~.peekover-toc{max-width:none}
:host([data-toc="collapsed"]) .peekover-mode-toggle~.peekover-toc .peekover-toc__toggle{box-sizing:border-box;height:var(--toc-handle-h);white-space:nowrap}
.peekover-toc [hidden]{display:none} /* collapsed subtree (childList.hidden) — explicit in shadow */
.peekover-toc__ticks{display:none}
.peekover-toc__toggle[aria-expanded="false"]~.peekover-toc__ticks{
  display:flex;flex-direction:column;align-items:flex-end;gap:9px;width:max-content;margin:14px 0 0 auto;
  max-height:50vh;overflow:hidden;pointer-events:none;
}
.peekover-toc__tick{display:block;width:16px;height:3px;border-radius:2px;background:var(--line);transition:width .2s,background .2s}
.peekover-toc__tick[data-nested]{width:10px}
.peekover-toc__tick.is-here{width:26px;background:var(--hl)}
@media (max-width:1080px){.peekover-toc__toggle[aria-expanded="false"]~.peekover-toc__ticks{display:none}}

/* Reserve the rail's width on the COLUMN so the now-opaque rail never CLIPS the reading text
   (group-3 gate fix, companion to the opaque background above). While OPEN the reading column
   gives up EXACTLY --toc-w of right margin, so its right edge is pulled clear of the rail's left
   edge and no column text can sit under the rail to be clipped. margin-left is COMPUTED, not auto:
   half the surplus after column+rail, floored at 0 — wide centres the column beside the rail, narrow
   keeps the left-align. Argument: the B1 .ts block below. Reserving exactly one rail-width — not both
   sides — is what keeps this correct on a NARROW scrollport (where the
   column's padding floor plus a two-sided reservation would overshoot the rail); the column simply
   takes whatever width remains left of the rail. The reservation is --toc-w, so a 3.4 resize
   widens it too, and it is ZERO when collapsed (this rule is gated on data-toc="open" → the base
   margin:0 auto re-centers the column beside the handle, no phantom gutter left). Column-side ONLY
   → identical on both surfaces: the full-page fixed rail and the contained absolute rail both
   anchor to the same :host right edge the column's margin is measured against. padding-right on
   :host is deliberately avoided — it fights the fixed rail's right:0 anchor and the scrollbar and
   breaks the contained case (the investigation's finding). width:auto is REQUIRED here: the base
   column is width:100%, and a bare margin-right on a 100%-wide box does not shrink it — it drives
   margin-left negative and shoves the column off-screen left. width:auto lets the column shrink to
   fill exactly the space LEFT of the rail (still capped at the base max-width), so on a narrow
   scrollport it takes what remains and on a wide one it caps at the measure. */
:host([data-toc="open"]) .peekover-reader,:host([data-toc="open"]) .peekover-diff{
  width:auto;
  margin-right:var(--toc-w);
  margin-left:max(0px,calc((100% - var(--reader-measure) - var(--toc-w)) / 2));
}
:host([data-toc="open"]) .peekover-toc~.peekover-raw{
  margin-left:calc(max(0px,(100% - var(--reader-measure) - var(--toc-w)) / 2) + 32px);
  margin-right:calc(max(0px,(100% - var(--reader-measure) - var(--toc-w)) / 2) + var(--toc-w) + 32px);
}

.peekover-toc__list{list-style:none;margin:0;padding:0}
/* Nested levels indent under their parent with a hairline guide (the nesting made visible). */
.peekover-toc__list .peekover-toc__list{margin-left:11px;padding-left:9px;border-left:1px solid var(--line)}
.peekover-toc__item{margin:0}
.peekover-toc__row{display:flex;align-items:flex-start;gap:3px}

/* Disclosure twist: a bare glyph that rotates on expand (transition neutralised under
   prefers-reduced-motion by the global :host rule). No token color beyond faint/muted. */
.peekover-toc__twist{
  flex:none;width:18px;height:24px;padding:0;
  display:inline-flex;align-items:center;justify-content:center;
  background:none;border:none;cursor:pointer;color:var(--faint);
}
.peekover-toc__twist:hover{color:var(--muted)}
.peekover-toc__twist::before{content:"\\25B8";font-size:10px;display:inline-block;transition:transform .15s}
.peekover-toc__twist[aria-expanded="true"]::before{transform:rotate(90deg)}

/* Entry link: a full-width text button, single-line with ellipsis so long headings never
   break the rail. */
.peekover-toc__link{
  flex:1 1 auto;min-width:0;
  display:block;text-align:left;
  margin:1px 0;padding:5px 10px;
  background:none;border:none;border-left:2px solid transparent;border-radius:6px;cursor:pointer;
  font-family:var(--sans);font-size:12.5px;line-height:1.4;color:var(--muted);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  transition:color .15s,background .15s;
}
.peekover-toc__link:hover{color:var(--ink)}
/* Active section (scroll-spy sets aria-current="location" + .is-active in 3.2). */
.peekover-toc__link.is-active,
.peekover-toc__link[aria-current="location"]{
  color:var(--ink);font-weight:600;
  background:linear-gradient(90deg,var(--hl-soft),transparent 85%);border-left-color:var(--hl);
}

/* Resize handle (3.4 wires the pointer drag that rewrites --toc-w; the rule ships here so
   the seam task carries the rail's full chrome). A thin grab strip on the rail's inner edge;
   contained within the now-positioned .peekover-toc. */
.peekover-toc__resizer{
  position:absolute;top:0;left:0;width:6px;height:100%;
  padding:0;background:none;border:none;cursor:ew-resize;touch-action:none;
}
.peekover-toc__resizer:hover{background:var(--line)}
.peekover-toc__close{display:none}
@media (max-width:863px){
:host([data-toc="open"]) .peekover-toc,:host([data-toc="collapsed"]) .peekover-toc{position:static;width:auto;max-width:var(--reader-measure);height:auto;margin:0 auto;padding:56px 32px 0;overflow:visible;text-align:right;background:none;border:0;border-radius:0;box-shadow:none}
.peekover-toc__toggle{margin:0}
.peekover-toc__list,.peekover-toc__resizer{display:none}
:host([data-toc="open"]) .peekover-reader,:host([data-toc="open"]) .peekover-diff{width:100%;margin:0 auto}
:host([data-toc="open"]) .peekover-toc~.peekover-raw{margin-left:32px;margin-right:32px}
:host([data-toc="open"]) .peekover-watch-note[data-place="aside"]{width:100%;margin:0 auto 130px}
.peekover-toc~.peekover-reader{padding-top:16px}
.peekover-toc~.peekover-raw{margin-top:16px}
:host([data-toc-sheet="open"]) .peekover-toc{position:fixed;inset:0;z-index:4;max-width:none;padding:16px 16px 32px;overflow:auto;text-align:left;background:var(--paper)}
:host([data-toc-sheet="open"]) .peekover-toc__list{display:block;margin-top:16px}
:host([data-toc-sheet="open"]) .peekover-toc__close{display:block;position:absolute;top:16px;right:16px}
}

/* scroll-margin-top so a TOC click's scrollIntoView (3.1) lands the heading below the top
   chrome, not flush against the scrollport edge. Container-relative → engine-correct on both
   surfaces, no JS pixel math. Additive property only; the column's own rules are unchanged. */
.peekover-reader h1,.peekover-reader h2,.peekover-reader h3,
.peekover-reader h4,.peekover-reader h5,.peekover-reader h6{ scroll-margin-top:24px; }

/* Code blocks (009 D-6) — rationale: codeView.ts. Placed BEFORE the diagram block, not after —
   diagramActions.browser.test.ts pins that block by slicing to end-of-string. */
.peekover-reader .peekover-code{position:relative}
.peekover-reader .peekover-code pre[data-code="rendered"]{display:none}

/* Per-fence toolbar (009 §3.11, task 4.3) — IN-FLOW, the FIRST child of .peekover-code, pushing
   both <pre>s down. §3.11's routing table routes rows 7/9/10 OUT for exactly this reason: no
   position:fixed/absolute here, unlike .peekover-diagram-actions below — mirrors
   .peekover-table-tools's in-flow shape instead. Rationale: codeView.ts's buildCodeToolbar. */
.peekover-reader .peekover-code-toolbar{
  display:flex;flex-wrap:wrap;align-items:center;gap:6px;
  margin-bottom:8px;
  font-family:var(--sans);font-size:12px;color:var(--muted);
}
.peekover-reader .peekover-code-toolbar__lang{
  margin-right:auto;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);
}
.peekover-reader .peekover-code-toolbar button,.peekover-reader .peekover-math-action,
.peekover-reader .peekover-table-copy,.peekover-reader .peekover-table-filter__clear,
.peekover-reader .peekover-code-toolbar__collapse,.peekover-diagram-lightbox__close,.peekover-toc__close{
  font-family:var(--sans);font-size:11.5px;font-weight:600;line-height:normal;color:var(--muted);
  background:var(--paper);border:1px solid var(--line);border-radius:7px;padding:5px 11px;margin:0;
  cursor:pointer;
}
.peekover-reader .peekover-code-toolbar button:hover,.peekover-reader .peekover-math-action:hover,
.peekover-reader .peekover-table-copy:hover,.peekover-reader .peekover-table-filter__clear:hover,
.peekover-reader .peekover-code-toolbar__collapse:hover,.peekover-diagram-lightbox__close:hover,.peekover-toc__close:hover{color:var(--ink)}
.peekover-reader .peekover-code-toolbar button[aria-pressed="true"]{
  color:var(--ink);border-color:var(--faint);background:var(--accent-soft);
}
.peekover-reader .peekover-code-toolbar__copy{transition:color 150ms ease,border-color 150ms ease,background-color 150ms ease}
.peekover-reader .peekover-code-toolbar__copy[data-state="done"],
.peekover-reader .peekover-math-action[data-state="done"]{color:var(--ink);border-color:var(--ok);background:var(--ok-soft)}
.peekover-reader .peekover-code-toolbar__copy[data-state="failed"],
.peekover-reader .peekover-math-action[data-state="failed"]{color:var(--del);border-color:var(--del)}
@media (prefers-reduced-motion:reduce){.peekover-reader .peekover-code-toolbar__copy{transition:none}}
.peekover-reader .peekover-code pre.shiki{scrollbar-color:var(--faint) transparent}
.peekover-reader pre.shiki span[style*="--accent"]{font-weight:500}
.peekover-reader pre.shiki span[style*="--muted"]{font-style:italic}
.peekover-reader .peekover-math-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:8px}

/* Line numbers (task 4.3) — CSS counters on the highlighted sibling's own .line spans, gated on
   the WRAPPER's data-line-numbers attribute (D-7: absent by default; codeView.ts never mutates
   the highlighted <pre>'s structure to add this). */
.peekover-reader .peekover-code[data-line-numbers="on"] pre.shiki code{counter-reset:peekover-code-line}
.peekover-reader .peekover-code[data-line-numbers="on"] pre.shiki .line{counter-increment:peekover-code-line}
.peekover-reader .peekover-code[data-line-numbers="on"] pre.shiki .line::before{
  content:counter(peekover-code-line);display:inline-block;min-width:2em;margin-right:1em;
  text-align:right;color:var(--faint);user-select:none;
}

/* Word-wrap (task 4.3) — white-space/overflow-wrap only, gated the same way. NEVER a ch unit in
   a layout-blocking property here (retro finding 6) — a monospace surface is exactly where that
   looks tempting. */
.peekover-reader .peekover-code[data-wrap="on"] pre.shiki{white-space:pre-wrap;overflow-wrap:anywhere}

/* Line-highlighting (task 4.3, D-8's consumer) — background ONLY; the text/aria-* half (row 15)
   is the aria-label codeEnhancer.ts's adoptHighlighted sets on the same span. Content-width, not
   full-row (PROVISIONAL — the full-bleed treatment is a walk-informed call, M-4's territory, not
   a decision to make quietly here). */
.peekover-reader .peekover-code-line--highlighted{background:var(--ok-soft);border-radius:3px}

/* Collapsible long blocks (009 D-10, task 6.1) — rationale: codeView.ts's §6 section. Two rules
   only match ONE at a time (data-code-state is a single value). Collapsed clamps the HEIGHT only
   and still scrolls sideways (8.1i); expanded, the base '.peekover-reader pre' overflow:auto
   governs. The max-height is a
   FIXED length, never JS-measured, so a collapse/expand/collapse cycle always returns to the
   EXACT same rect (§3.11 row 12) — nothing cached to drift from. The transition mirrors
   .peekover-code-toolbar__copy's own shape above (its own explicit reduced-motion neutraliser,
   not the sheet-wide :host * rule alone) rather than the storage panel's dead-control finding
   further down this file — this control sits in the SAME toolbar family the copy button does. */
.peekover-reader .peekover-code[data-code-state] pre.shiki{transition:max-height 200ms ease}
.peekover-reader .peekover-code[data-code-state="collapsed"] pre.shiki{max-height:320px;overflow:auto hidden}
.peekover-reader .peekover-code[data-code-state="expanded"] pre.shiki{max-height:none}
@media (prefers-reduced-motion:reduce){.peekover-reader .peekover-code[data-code-state] pre.shiki{transition:none}}
.peekover-reader .peekover-code-toolbar__collapse{display:block;width:100%;margin-top:8px;text-align:center}

/* Diagrams (007 D-15) — rationale: diagramView.ts */
.peekover-reader .peekover-diagram{
  margin:28px 0;padding:0;overflow-x:auto;text-align:center;
  color:var(--ink);
}
.peekover-reader .peekover-diagram svg{max-width:100%;height:auto}
.peekover-reader pre[data-diagram="rendered"]{display:none}
/* Per-diagram controls (007 §3.11) — rationale: below this literal */
.peekover-reader .peekover-diagram{position:relative}
.peekover-reader .peekover-diagram-actions{position:absolute;top:6px;right:6px;z-index:1;display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity 120ms ease}
.peekover-reader .peekover-diagram:hover .peekover-diagram-actions,
.peekover-reader .peekover-diagram:focus-within .peekover-diagram-actions{opacity:1;pointer-events:auto}
@media (prefers-reduced-motion:reduce){.peekover-reader .peekover-diagram-actions{transition:none}}
.peekover-reader .peekover-diagram-action{font:600 12px/1 var(--sans);color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:6px 10px;cursor:pointer}
.peekover-reader .peekover-diagram-action:hover{background:var(--hl-soft)}
.peekover-reader .peekover-diagram-action[data-state="done"]{background:var(--hl);color:#26210a;border-color:var(--hl)}
.peekover-reader .peekover-diagram-action[data-state="failed"]{background:var(--del-soft);color:var(--del);border-color:var(--del)}
.peekover-reader .peekover-diagram-status{margin:8px 0 0;font:400 13px/1.4 var(--sans);color:var(--muted);text-align:center}
/* Lightbox trigger + the modal itself (007 §3.11, task 7.2) — rationale: below this literal */
.peekover-reader .peekover-diagram-open{position:absolute;inset:0;z-index:0;display:block;width:100%;padding:0;background:none;border:0;border-radius:8px;cursor:zoom-in}
.peekover-reader .peekover-diagram-open:focus-visible{outline:2px solid var(--hl);outline-offset:2px}
.peekover-diagram-lightbox{position:fixed;inset:0;z-index:3;display:flex;background:color-mix(in srgb,var(--logo-ink) 75%,transparent);cursor:zoom-out}
.peekover-diagram-lightbox__panel{position:absolute;top:64px;right:calc(min(var(--toc-w),38vw) + 16px);bottom:96px;left:16px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:14px;background:var(--paper);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);cursor:auto;animation:peekover-diagram-zoom 180ms ease-out}
@keyframes peekover-diagram-zoom{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.peekover-diagram-lightbox__close{align-self:flex-end}
.peekover-diagram-lightbox__view{flex:1;min-height:0;overflow:auto;scrollbar-color:var(--faint) transparent;display:flex;align-items:center;justify-content:center}
.peekover-diagram-lightbox__view svg{max-width:none;height:auto}
@media (max-width:863px){.peekover-diagram-lightbox__panel{inset:16px}.peekover-diagram-lightbox__view svg{width:100%}}

/* Print mode (010 D-7, task 6.1) — chrome hidden, document de-clipped, page-break rules; the
   @page margin-box fidelity PROBE follows below. Rationale: the .ts comment after this literal. */
@media print{
  :host{position:static;inset:auto;overflow:visible;height:auto;font-size:12pt}
  .peekover-mode-toggle,.peekover-theme-toggle,.peekover-watch,.peekover-watch-note,
  .peekover-watch-disclosure,.peekover-diff-affordance,.peekover-diff-picker,.peekover-diff-status,
  .peekover-agent-badge,.peekover-remote-load,.peekover-net,.peekover-toc,.peekover-diagram-lightbox,
  .peekover-table-tools,.peekover-diagram-actions,.peekover-code-toolbar{display:none!important}
  .peekover-reader{max-width:100%;padding:0}
  .peekover-reader h1,.peekover-reader h2,.peekover-reader h3,
  .peekover-reader h4,.peekover-reader h5,.peekover-reader h6{break-after:avoid;page-break-after:avoid}
  .peekover-reader pre,.peekover-reader table,.peekover-reader blockquote,
  .peekover-reader .peekover-diagram{break-inside:avoid;page-break-inside:avoid}
}
@page{
  margin:2cm 1.5cm 2.2cm;
  @top-center{content:"Peekover"}
  @bottom-center{content:"Page " counter(page) " of " counter(pages)}
}
`;
// KEPT HERE ON PURPOSE, task 7.1: this @page block stays inert for the LIVE reader (shadow-scoped,
// see the finding below), but htmlExport.ts's extractPageBlocks() pulls this exact block out of
// READER_CSS and ships it verbatim into every standalone HTML export / Copy-as-HTML document —
// which has NO shadow root once serialized, so it is document-level there and (per this task's own
// finding) DOES render. Task 7.1 additionally copies this text into appShell.ts's APP_CSS, a real
// document-level sheet, so the LIVE app-page reader's own window.print() can reach a page box too.
// Two copies, two distinct consumers — see appShell.ts's own comment on its copy.

// ============================================================================
// THE COPY BUTTON — 013 task 5.3 (gate-1 Q14; carried (f), (g))
// ============================================================================
// One look, `design/mockup.html:154–156`'s `.copy`, for every small action button inside the
// column: the code toolbar's Line numbers / Wrap / Copy, display math's Copy LaTeX / Copy MathML,
// and the table strip's Clear / Copy CSV / Copy Markdown. Grouped selectors, so "styled like the
// copy button" is one rule, not four copies that can drift. The toolbar stays IN FLOW (§3.11's
// routing, codeView.ts) — the mock floats its copy button over the pre; only the look is adopted.
// States the mock does not draw, from tokens: a pressed toggle `--ink` on `--accent-soft` with a
// `--faint` border; "Copied" `--ink` on `--ok-soft` with an `--ok` border — NOT the mock's `--ok`
// text, which is 3.37:1 on `--paper` in light (below AA; G-5's logic, as 2.2 chose `--muted` over
// `--faint`); "Copy failed" `--del` (4.76 / 6.79). Focus is the reader's own ring
// (`:host :focus-visible`). Only the copy button keeps a colour transition: row 19 of
// codeToolbar.browser.test.ts pins it and its reduced-motion neutraliser by shape.
// The table strip: the field is a `--paper` box (`--faint` border under the pointer); the sort
// button takes the `<th>`'s own type and colour (`mockup.html:145–147`), `--ink` under the pointer
// and while it is the sorted column, its glyph `--accent`. These rules sit after a blank line, apart
// from the strip's host rules, which reader.test.ts slices to the first blank line and pins as
// declaring no surface. The math figure's own scroll box gets its scrollbar colour in MATH_CSS
// (mathCss.ts, app-page only); the highlighted code pre gets it here.

// ============================================================================
// THE BROWSER-TAB READER'S CHROME — 013 task 5.6 (gate-1 Q10's default arm: the pills, in place)
// ============================================================================
// The floating controls take the approved toolbar's look for the same controls (toolbar.ts draws
// them on the app page): Raw / Reading, Theme and the load bar are its buttons (`--panel`, 1 px
// `--line`, radius 8, 600 12.5px, `--muted` → `--ink` under the pointer); the watch pill, the agent
// badge and the network indicator its round pills (radius 999; the badge and the indicator 12px).
// One shared rule carries the look; each control keeps only its lane (top / bottom, left or right).
// They keep `--shadow` because they float over the page. The watch dot at rest is `--muted` (the
// toolbar's; `--faint` was 2.60:1). The render-failure banner is the mock's `.alert.warn`, as 5.5
// drew the app page's alerts (13px, 10 / 14 padding, the `--hl-soft` fill at 55%, the `--warn` rule).
// The full-page host carries `scrollbar-color`; it inherits, so the page and every pre scroll with it.
// THE CORNER (5.2's note): the open contents card starts at 54px, below the mode pill (16 + 28.5)
// with the card's own 18px padding — it sat under the pill's corner from 8px with 47px padding.
// CONTAINED_CSS puts the 47px back on the app page's rail (its own `top:8px` already wins there).
// AT REST (the human's ruling, 2026-11-05): at <= 1280px the column starts at 112px, so its first
// line clears the top chrome — the agent badge (56 + 26) and, at 414, the collapsed contents box,
// which paints `--paper` to 98px. 5.6 FIX: that box's height must not follow the system face (the
// chrome draws in one, D-3) — on Linux its label wrapped inside the old 38vw cap and the box grew
// to 110-112px over the first line. The collapsed handle is now one line (`nowrap`, no 38vw cap)
// at a fixed `--toc-handle-h` below `--toc-handle-top`, and the column's top is DERIVED from the
// two: top + handle + the box's 16px foot + a 14px gap = 112px. Both keyed like the column's top
// (after the mode pill), so the app page's rail — packaged faces, no pill — is untouched. The
// other top chrome (mode pill, load bar, badge) is `line-height:1` and `nowrap` already, so its
// height is the font size's.
// Keyed to the mode pill as a preceding sibling, so it reaches only
// the full-page reader: the app page (`pills: false`), the editor preview (`chrome: false`) and an
// HTML export (which clones `.peekover-reader` alone) draw no pill and keep their 56px.

// ============================================================================
// PRINT MODE + THE @page MARGIN-BOX FIDELITY PROBE — 010 D-7, task 6.1
// ============================================================================
// A `.ts` comment ON PURPOSE (finding 9, restated every milestone since): the rules above live
// inside READER_CSS's template literal and ship verbatim to BOTH bundles, so the argument for them
// lives here instead, where it costs nothing.
//
// ── WHAT COUNTS AS "NON-DOCUMENT CHROME" HERE, AND WHY THE LIST IS LONGER THAN THE MOCKUP'S ──────
//
// design/mockup.html:430-435 hides `.toolbar,.side,.toc,.status,.progress,.hintpill,.figtools,
// .hint,.edbar` — but that is a single flat demo page with one stylesheet; those class names do
// not exist anywhere in this tree (D-7's own text: "design language to carry, not readerCss.ts's
// own rules yet to be written"). The real reader chrome is every `position:fixed` pill READER_CSS
// already defines above (mode-toggle, theme-toggle, watch + its note/disclosure, the diff
// affordance/picker/status trio, the agent-file badge, remote-load, the network indicator, the TOC
// rail, the diagram lightbox) plus the three IN-FLOW per-block toolbars (code, table, diagram
// actions) — a strictly MORE COMPLETE translation of "hide everything that is not the document"
// than a literal copy of the mockup's own five-class list would have produced. `.peekover-diagram-
// status` is DELIBERATELY NOT hidden: unlike the others, it is document-adjacent fallback content
// (e.g. "diagram failed to render"), the printed-page equivalent of alt text, not an interactive
// control — the same distinction §3.11's own routing table draws between chrome and content.
//
// ── RULING 4, HELD: THIS BLOCK IS THE ONLY THING THAT CHANGED ─────────────────────────────────
//
// `.peekover-code-toolbar` above is a NEW selector reference inside a NEW `@media print` block; the
// EXISTING `.peekover-reader .peekover-code-toolbar{...}` rule (:651-655, M9 9.1's shipped spacing)
// is byte-unchanged — verified by diffing that rule's own body specifically, not the file as a
// whole (tests/browser/printMode.browser.test.ts's own Ruling-4 assertion; see there for the exact
// mechanism). `!important` is used throughout this block because several hidden selectors are
// styled at higher specificity elsewhere (`.peekover-reader .peekover-table-tools`, `.peekover-diff-
// picker:not([hidden]) ~ .peekover-diff-status` in CONTAINED_CSS below) and a print stylesheet
// relying on exact per-selector specificity arithmetic to win is the kind of fragile coupling this
// codebase avoids elsewhere — the existing `:host *{animation-duration:.001ms!important}` reduced-
// motion rule is the standing precedent for `!important` inside this file, not a new pattern.
//
// ── THE DE-CLIPPING FIX, AND WHY IT IS NOT PART OF THE PROBE ──────────────────────────────────
//
// `:host{position:fixed;inset:0;overflow:auto}` (the full-page content-script takeover, :58-66) is
// exactly the shape that silently under-prints an app: a fixed-position, internally-scrolling
// viewport prints only what is currently laid out in its box on many engines, not the full
// document. `position:static;inset:auto;overflow:visible;height:auto` returns `:host` to normal
// document flow so the browser's own pagination sees the WHOLE rendered document, not one scrolled
// screenful. This is a well-established, uncontroversial print-CSS correction (not itself the
// empirical unknown D-7 names) — the true probe is the `@page` block below. `font-size:12pt`
// mirrors the mockup's own 12pt print body-copy convention (:434), translated from this file's
// screen-size 17px serif base; headings keep their own explicit px sizes below `.peekover-reader`
// and are unaffected (no `ch` unit anywhere in this block, the standing rule).
//
// In CONTAINED mode (the app-page reader pane), `:host` is ALREADY `position:relative;inset:auto`
// unconditionally (CONTAINED_CSS below, injected as a later `<style>` in the same shadow root) —
// this print rule's `position:static` is therefore a no-op there (a later, unconditional sheet
// rule beats an earlier, print-conditional one at equal specificity), but `overflow:visible` still
// applies (CONTAINED_CSS never touches `overflow`), which is the property that actually matters:
// the CLIPPING container on the app-page surface is `.peekover-app__reader` in `appShell.ts`'s
// `APP_CSS` (`overflow:auto`, a flex child of `.peekover-app__body`), a file OUTSIDE this shadow
// root's cascade entirely — CSS scoped to a shadow tree cannot reach light-DOM ancestors by
// construction, so THAT fix cannot live here. See appShell.ts's own new `@media print` block
// (this task's necessary ripple, flagged in progress.md/the commit message — tasks.md's Files list
// for 6.1 named only readerCss.ts, but "reader chrome hidden under print media" (this task's own
// Verify clause) is unreachable in full without it: `.peekover-app__header` (the toolbar: brand,
// theme/code-theme controls, storage/export toggles+panels) and `.peekover-app__folders` (the side
// panel) are light-DOM siblings of the reader's shadow host, never selectors this file can hide).
//
// ── THE @page MARGIN-BOX PROBE — MEASURED, AND THE RESULT IS INADEQUATE ON BOTH ENGINES ───────
//
// `@top-center`/`@bottom-center` running content with `counter(page)`/`counter(pages)` is the
// spec-standard CSS Paged Media mechanism (spec §3.6/§7-4's own uncertainty, plan risk 4). The
// exact copy here ("Peekover" / "Page X of Y") is FINAL, not provisional — Ruling M-3 (`decisions.md`
// 2026-09-04 M10 GATE, task 10.4) walked these values (task 10.3) and ruled all three kept as shipped;
// task 10.5 confirmed this a no-op (byte-identical to the ruled values). No longer routed to a future
// gate.
//
// tests/browser/printMode.browser.test.ts is the PRIMARY OUTPUT this task produces (feeding task
// 7.1's fork, §3.6, rather than ruling it here) and its finding is NOT the simple "does the engine
// support margin boxes" question this rule set out to measure — Chromium DOES, verified against a
// plain top-level-document control. The finding is SHARPER and WORSE: an `@page` rule whose own
// stylesheet lives inside a SHADOW ROOT (exactly where this rule lives, injected via READER_CSS
// into the reader's shadow root) is INERT for margin-box rendering purposes on EITHER engine —
// the shadow tree's own content still paginates correctly, but no margin-box text renders at all,
// a structural consequence of shadow encapsulation applied to a document-global CSS concept, not
// an engine-support gap a future browser release could close. Firefox additionally drops the
// nested at-rules at PARSE time regardless of where they live (its own, separate finding). See the
// test file's own module doc comment for the full measurement (both signals, both engines).

// ============================================================================
// THE AGENT-FILE BADGE — 008 §3.11, task 1.3 (D-12)
// ============================================================================
// A `.ts` comment ON PURPOSE, and this is the mechanism rather than the reminder: comments inside
// READER_CSS's template literal cannot be stripped by the minifier and ship verbatim in EVERY
// bundle, on BOTH surfaces — the failure `diffChrome.ts:40-44` records as having cost ~8 KB once.
// The rule above therefore carries a one-line pointer and the argument lives down here, where it
// costs nothing. Task 1.3's byte decomposition measures the shipped block, so this stays true by
// measurement and not by memory.
//
// ── ★ THE LANE IS PROVISIONAL BY INSTRUCTION, NOT BY OMISSION ────────────────────────────────
//
// D-12's standing rule is that placement is RE-MEASURED with a real rect probe, never chosen. This
// task does not run that probe and must not: gate-2 Q3 ruled the badge's lane UNCHANGED —
// *"produce, do not choose"* — routing the measurement to task 1.5 (both `GEOMETRY_WIDTHS`, 1280
// AND 1400, all five label widths, with the network indicator and the remote-load pill present)
// and the CHOICE to the human at 6.1. So `top:56px;left:16px` below is a placeholder that 1.5
// measures and 6.1 rules on. It is written down here rather than left implicit so nobody reads a
// shipped offset as a settled one.
//
// ★ It ships un-probed at zero user risk THIS commit, and that is why it is acceptable to ship at
// all: nothing calls `registerDocIdentity` in production until task 1.4, so `buildAgentBadge()`
// returns `[]` at every production render on both surfaces and this rule matches no element yet.
// The badge first appears at 1.4; 1.5 probes it; 6.1 rules. The lane is never live and un-measured.
//
// ── WHAT 1.5 MUST PROBE — THE CANDIDATES THIS TASK ALREADY KNOWS ABOUT ───────────────────────
//
// Read off the shipped rules rather than guessed, so 1.5 starts from an inventory:
//
//   FULL PAGE (content script, READER_CSS): `top:56;left:16` is EMPTY. The band's occupants are
//     `.peekover-remote-load` (`top:16;left:16`, and only on a document with blocked media) and
//     `.peekover-mode-toggle` (`top:16;right:16`). `.peekover-diff-affordance` also declares
//     `top:56;left:16`, but D-14 ships diff chrome to the APP PAGE ONLY, so no element ever
//     matches it here. ★ 1.5 must still assert that, because it is a two-rule coincidence held
//     apart by a build-time gate, not by geometry — if D-14 ever changes, these two collide
//     silently and the badge is the one that would be covered.
//   CONTAINED PANE (app page, CONTAINED_CSS): recovery B1 moved `.peekover-diff-affordance` to
//     `top:12` and its picker and status to `top:50`, and displaced `.peekover-remote-load` to
//     `left:176`. So at `top:56;left:16` the badge sits 12px under the diff pill and OVERLAPS the
//     picker's and status's `top:50` slot — both of which are `hidden` until opened. **That is a
//     known, live collision candidate the moment 1.4 lands, and it is the first thing 1.5 should
//     probe.** No CONTAINED override is added here because adding one would be choosing the lane.
//   BOTTOM-LEFT is already ruled out and is not re-derived: `diffChrome.ts:55-60` measured every
//     40px step into 3.1's capture disclosure, whose height is TEXT-WRAP dependent (110px at 1280,
//     182px at 414), so no fixed offset clears it at both widths.
//
// ── THE TOKENS, EACH RESOLVED IN ALL THREE THEME BLOCKS BEFORE USE (the standing check) ──────
//
// `:host` light `:31-40` · `:host([data-theme="dark"])` `:43-48` · `:host([data-theme="sepia"])`
// `:51`. Sepia overrides ONLY `--paper`, `--ink`, `--accent`, `--accent-soft`, so everything else
// resolves to the LIGHT value on sepia paper. Run this session, per token, never assumed:
//
//   --sans    light: D-3's stack (5.10) · dark SAME · sepia SAME (declared
//             once in the light block; neither override touches it).
//   --muted   light #5D6070 · dark #A0A4B8 · sepia #5D6070 (inherited light) on paper #F6EEDF.
//   --panel   light #F4F4EF · dark #181B26 · sepia #F4F4EF (inherited light) on paper #F6EEDF.
//   --line    light #E6E6DF · dark #262A38 · sepia #E6E6DF (inherited light).
//   --shadow  light 0 10px 30px rgba(22,23,31,.10) · dark SAME · sepia SAME (light block only).
//
// ★ THE SEPIA READING, STATED RATHER THAN SILENTLY SUBSTITUTED. On sepia the fill `--panel`
// (#F4F4EF) sits on paper `--paper` (#F6EEDF) — a per-channel delta of 2/2/16 — so the pill's
// SURFACE is very nearly invisible and the `--line` border is what carries its shape. That is the
// exact condition plan D-12 warned about, and it is INHERITED DELIBERATELY: `.peekover-mode-toggle`,
// `.peekover-theme-toggle`, `.peekover-watch`, `.peekover-remote-load` and
// `.peekover-diff-affordance` all ship the same `--panel`/`--line`/`--muted` triple and therefore
// all read this way on sepia today. Substituting `--accent-soft` (which sepia DOES override, to
// #E9DCC1) would fix this one pill and make it the only chrome that looks different on one theme —
// a divergence, not a fix. The whole-band sepia question belongs to whatever task takes all six
// pills at once; it is recorded here, not solved unilaterally by a badge.
//
// ── NO `ch` IN A LAYOUT-BLOCKING PROPERTY (finding 6) ────────────────────────────────────────
//
// `margin`, `padding` and `transform` above are px or 0; the rule uses no `ch` at all. The memory
// of record prices one `ch` in a margin calculation at ~28 ms. (`max-width:34ch` on
// `.peekover-diff-status` is the free case and is untouched.)
//
// ── WHY A PILL AND NOT AN EYEBROW, AND WHY NO TRANSITION ────────────────────────────────────
//
// The mockup's precedent (`mockup.html:634`) is an in-column eyebrow; plan D-2 makes the badge a
// SIBLING of `.peekover-reader`, so it takes the sibling pills' shape instead — same font stack,
// size, weight, radius and border as `.peekover-diff-affordance`, because it belongs to that band
// and reading as a stranger in it would be the design defect. It carries NO `cursor`, NO `:hover`
// and NO `transition`: it is not interactive (§3.11 rows 12, 16), and a hover response on a thing
// that takes no gesture is a lie about affordance. `margin:0` because it is a `<p>` and the UA
// default would otherwise offset a `position:fixed` box from its declared inset.

// ============================================================================
// THE TABLE-TOOLS TOOLBAR — 008 §3.11, task 3.3 (D-12)
// ============================================================================
// A `.ts` comment ON PURPOSE, and 1.3's block above states the mechanism this one inherits: prose
// written beside the rule, inside READER_CSS's template literal, is prose the minifier cannot enter
// and it ships verbatim to BOTH surfaces — the failure `diffChrome.ts:40-44` records as having cost
// ~8 KB once. The rule carries a one-line pointer; the argument lives here, where it costs zero
// shipped bytes, and 3.3's byte decomposition MEASURES that zero rather than trusting it.
//
// ── WHICH SHEET, AND WHY IT IS NOT THE PICKER'S ANSWER ───────────────────────────────────────
//
// READER_CSS, not CONTAINED_CSS — the opposite of 2.4's status lane two blocks below, and for a
// reason that is structural rather than stylistic. Diff chrome is app-page-only by D-14, so a
// full-page rule for it would style an element that never renders there. The toolbar is not that
// kind of chrome: it is a sibling of a `<table>` INSIDE `.peekover-reader`, and the reading column
// is the one thing both surfaces render identically. `enhanceTables` (`tableEnhancer.ts:148`) walks
// `.peekover-reader` on whichever host it is handed, and D-6 gives it FOUR call sites — 1 and 2 on
// the app page (3.4), 3 and 4 on the content script (4.1). A CONTAINED-only rule would leave the
// content-script reader's toolbar unstyled from 4.1 onward: invisible on one surface, and invisible
// in a way no app-page test could see. So the rule goes where both injected stylesheets carry it,
// and the content-script bytes move HERE, before any call site exists, deliberately (plan §6): with
// the CSS the only contributor in flight the ablation is exact, and the presentation stays
// revertable without touching the logic.
//
// ── THE TOKENS, EACH RESOLVED IN ALL THREE THEME BLOCKS BEFORE USE (the standing check) ──────
//
// `:host` light `:31-40` · `:host([data-theme="dark"])` `:43-48` · `:host([data-theme="sepia"])`
// `:51`. Sepia overrides ONLY `--paper`, `--ink`, `--accent`, `--accent-soft`, so every other token
// resolves to its LIGHT value on sepia paper. Run this session, per token, never assumed:
//
//   --sans   light: D-3's stack (5.10) · dark SAME · sepia SAME (declared
//            once in the light block; neither override touches it).
//   --muted  light #5D6070 · dark #A0A4B8 · sepia #5D6070 (inherited light) on paper #F6EEDF.
//
// Those two are the whole list, because the rule declares no surface of its own — see below. The
// toolbar's text therefore reads as the same secondary ink as the `<th>` row it sits above
// (`:174-177` already uses `--muted` on `--sans`), in all three themes.
//
// ★ THE SEPIA READING, STATED RATHER THAN SILENTLY SUBSTITUTED — AND IT IS WHY THERE IS NO FILL.
// The obvious chrome surface here is the pills' `--panel` + `--line` pair. On sepia `--panel`
// (#F4F4EF) sits on `--paper` (#F6EEDF) — a per-channel delta of 2/2/16 — so the fill is very
// nearly invisible and only the border carries the shape; 1.3's block above records the same
// reading for all six pills and declines to fix it for one of them. This rule does not inherit that
// problem, because it does not need a surface at all: the toolbar is not a floating pill over the
// document, it is a strip in the flow of the column, and the paper it sits on is the paper the
// prose sits on. So it declares NO `background` and NO `border`, in any theme. That is a finding
// applied, not a token swapped: `--accent-soft` (which sepia DOES override, to #E9DCC1) was NOT
// substituted, because a toolbar that looked different on one theme from the chrome it belongs to
// would be a divergence rather than a fix. If the walk at 6.1 rules that the strip needs a surface,
// the whole-band sepia question is what it inherits, and it is recorded here for that session.
//
// ── NO `max-width` OF ITS OWN: IT INHERITS THE MEASURE ───────────────────────────────────────
//
// `--reader-measure` is `748px` (`:83`), consumed by `.peekover-reader` at `:85`. The toolbar is a
// CHILD of the column, so the measure already governs it; declaring one here would be a second site
// for the same number and the coupling `:925-930` argues for would silently rot. §3.11 row 6 is
// therefore DECLARED here and ASSERTED at 3.5 as a computed style, in a real engine — a resolved
// `max-width` is jsdom-blind, so a unit test asserting it would be asserting the string it was
// handed.
//
// ── NO `ch` IN A LAYOUT-BLOCKING PROPERTY (finding 6) ────────────────────────────────────────
//
// `margin` and `gap` above are px; the rule uses no `ch` at all, and declares no `padding` and no
// `transform`. The memory of record prices one `ch` in a margin calculation at ~28 ms of first
// paint, and this rule is on the content script's critical path from 4.1 onward.
//
// ── WHY THE SECOND RULE EXISTS: THE BARE `<table>` HAS NO WRAPPER TO SPACE AGAINST ───────────
//
// D-12's structural finding is that `design/mockup.html`'s `.tablewrap` does not exist in our DOM —
// markdown-it emits a bare `<table>` and `:170-173` puts the border, radius and `overflow:hidden`
// on the table itself — so the toolbar is a PRECEDING SIBLING (`tableEnhancer.ts:119-132`), not a
// child of a shared container. Sibling margins collapse: the toolbar's 8px bottom against the
// table's own 22px top would resolve to 22px, and the 8px would be a number the sheet states and
// the engine ignores. `.peekover-table-tools + table{margin-top:0}` is what makes the declared
// spacing true — 22px above the toolbar, 8px between it and the table it belongs to. It is written
// at specificity (0,2,1) so it beats `.peekover-reader table`'s (0,1,1) BY SPECIFICITY and not by
// source order, on 2.4's precedent. Nothing about the existing table rule is edited; a table with
// no toolbar in front of it is matched by neither selector and keeps its 22px byte-for-byte.
//
// ── WHAT IS DELIBERATELY NOT HERE ─────────────────────────────────────────────────────────────
//
// The host is EMPTY at this task and this rule styles the CONTAINER, not its contents: no sort
// control (3.6), no filter (3.7), no copy buttons (3.8), no `role`, no label. `display:flex` with a
// gap is the container's own layout and is the one thing that must exist before there is anything
// to lay out. ★ And whether the strip READS as part of its table or as clutter above it is a WALK
// judgement, not a CSS one: it is 6.1's, with 3.5's rect probe as its measurement.

// ============================================================================
// THE PER-DIAGRAM CONTROL GROUP — 007 §3.11, task 7.1
// ============================================================================
// A `.ts` comment ON PURPOSE: the rules above live inside READER_CSS's template literal, and
// comments in THERE ship verbatim in every bundle, on BOTH surfaces. `diagramActions.browser.test.ts`
// pins the shipped block's byte length so this stays true by mechanism rather than by memory.
//
// ── WHY opacity AND NOT display/visibility ────────────────────────────────────────────────────
//
// §3.11 reveals the group on hover AND on keyboard focus. `display:none` and `visibility:hidden`
// both take the buttons out of the tab order, which would make the keyboard half unreachable — the
// exact affordance the spec names first. `opacity:0` leaves two real <button>s focusable and in the
// accessibility tree, and `:focus-within` on the figure then reveals them, so tabbing into a diagram
// IS the reveal. `pointer-events:none` while hidden keeps an invisible button from eating a click
// meant for the diagram under it; focus is unaffected by it.
//
// ── WHY THE FIGURE IS THE POSITIONING CONTEXT (row 11) ────────────────────────────────────────
//
// `position:relative` on the figure makes the group's `absolute` resolve against ITS OWN diagram,
// not the viewport and not the reading column. Two consequences the suite asserts: a document with
// two diagrams gets two groups in two places, and scrolling moves each with its figure. A `fixed`
// group would satisfy neither, and would look correct in a screenshot of a document that fits.
//
// ── WHY IT DOES NOT OCCLUDE THE COLUMN'S TEXT (row 5) ─────────────────────────────────────────
//
// The group floats over the DIAGRAM, inset 6px from the figure's own top-right corner. The figure
// carries `margin:28px 0`, so the group's box starts 6px inside a box that already stands 28px clear
// of the paragraph above it. Row 5's clearance is therefore a property of the inset being smaller
// than the margin, not a tuned constant — the suite asserts it at a WIDE viewport, where the gutter
// exists and the column is at its full measure.
//
// ── THE STATUS LINE IS IN FLOW, DELIBERATELY ──────────────────────────────────────────────────
//
// The live region sits BELOW the diagram in normal flow rather than floating: it is `hidden` until
// an action resolves, so it costs no layout on the overwhelmingly common path, and when it does
// appear it must not cover the picture it is reporting on. An absolutely positioned message would
// be the one piece of this group that CAN occlude something, for no benefit.
//
// ── NO `ch` IN A LAYOUT-BLOCKING PROPERTY (retro finding 6) ───────────────────────────────────
//
// Every `margin`, `padding` and `gap` above is px. The measured 28 ms cost of a `ch` in a margin
// calc is why, and the suite greps the shipped block for it rather than trusting this paragraph.

// ============================================================================
// THE LIGHTBOX — 007 §3.11, task 7.2
// ============================================================================
// Same rule as above: this is a `.ts` comment because comments inside the template literal ship
// verbatim on both surfaces, and the byte pin in `diagramActions.browser.test.ts` is what enforces
// it. Behaviour (trap, restore, Escape) lives in `diagramView.ts`; only geometry is here.
//
// ── THE TRIGGER IS AN OVERLAY, NOT A WRAPPER ──────────────────────────────────────────────────
//
// `.peekover-diagram-open` is `absolute; inset:0` over the figure at `z-index:0`, under the control
// group's `z-index:1`. That ordering is load-bearing: while the group is revealed it takes its own
// clicks, and while it is hidden its `pointer-events:none` lets a click through to the trigger
// beneath — so "click the diagram" and "click Copy image" are never the same gesture. It is a
// sibling of the `<svg>` rather than its parent because `diagramEnhancer.test.ts:232` pins the
// content as the figure's first element child.
//
// ── THE ROOT IS NOT NAMESPACED UNDER `.peekover-reader`, AND THAT IS THE POINT (row 4b) ───────
//
// Every other rule in this block is written `.peekover-reader .peekover-diagram…` because the
// figure lives INSIDE the reading column. The lightbox is the inversion's other half: it is
// appended to the shadow root as a SIBLING of the column, so a `.peekover-reader`-prefixed selector
// would silently never match it. The unprefixed selectors are the mechanism, not an oversight.
//
// ── WHY THE PANEL IS INSET RATHER THAN FULL-BLEED (rows 8 + 9) ────────────────────────────────
//
// The dim backdrop covers the surface; the PANEL does not. Its insets are derived from the chrome
// it must clear rather than chosen: `top:64px` clears the top band (`.peekover-mode-toggle` and
// `.peekover-remote-load` at `top:16px`), `bottom:96px` clears `.peekover-theme-toggle` at
// `bottom:56px` and the network indicator below it, and `right:calc(min(var(--toc-w),38vw) + 16px)`
// clears the TOC rail by recomputing the rail's OWN width expression — `width:var(--toc-w)` capped
// by `max-width:38vw` — so a 3.4 resize drag moves both together, and the clearance cannot drift
// out of sync with a constant, nor over-inset at a narrow viewport where the cap is what binds.
//
// ── ★ THE LIGHTBOX IS THE ONE PIECE OF CONTAINED CHROME THAT STAYS `position:fixed` ──────────
//
// `CONTAINED_CSS` switches every other pill and the TOC rail from `fixed` to `absolute` so they
// anchor to the pane's corners instead of the window's. `.peekover-diagram-lightbox` is
// deliberately NOT in that list, and its absence is load-bearing rather than an omission.
//
// The app page's reader pane is the scroll container (`appShell.ts`: `__reader{overflow:auto}`) and
// the shadow host inside it grows to the document's full height. So `position:absolute` resolves
// against a host that may be several thousand pixels tall, which anchors the panel 64px from the
// top of the DOCUMENT rather than of the viewport: on any document long enough to scroll, the
// "modal" opens off-screen and taking focus into it yanks the reader back to the top. That is the
// failure `diagramLightbox.browser.test.ts` caught — the reader's scroll offset moving on open,
// which is exactly what an out-of-flow overlay must never cause.
//
// The reason `CONTAINED_CSS` avoided `fixed` for the pills does not transfer: a pill pinned to the
// window instead of the pane is misplaced chrome, whereas a MODAL pinned to the window is correct
// by definition — it is supposed to cover the viewport. The cross-engine caveat recorded there
// (fixed descendants of a transformed ancestor are contained by it) does not apply, because no
// ancestor of the shadow host carries a transform, filter or `will-change`.
//
// ── THE ZOOM IS AN `animation`, NOT A `transition` (row 19) ───────────────────────────────────
//
// A transition needs two frames and a mid-flight sample to observe, which is a timing test. An
// animation is declarative: `animationName` and `animationDuration` are readable from computed
// style at any instant, so both halves of row 19 — that it IS animated without the media query and
// instant under it — are asserted as facts about the cascade rather than races. `watchControl`'s
// pulsing-dot pair is the shape being reused. `transform:scale()` carries no `ch`.
//
// ★ AND THERE IS DELIBERATELY NO `prefers-reduced-motion` RULE FOR THE PANEL. Task 7.2 wrote one,
// then deleted it: removing it left the suite GREEN, which makes it a dead control rather than a
// passing one. The reduce half of row 19 is already carried by the sheet-wide rule at the top of
// this file (`:host *{animation-duration:.001ms!important}`), which this panel is matched by like
// everything else in the shadow tree. A per-panel override would be bytes that change no
// observable, and — worse — a second place to have to remember. The suite still ASSERTS both
// halves, because the behaviour is required whoever provides it; what it does not do is pretend
// 7.2 is what provides it.

// ============================================================================
// THE data-toc="open" COLUMN MARGIN — recovery B1, the M6 9.1 gate's finding A.
// ============================================================================
// This block is a `.ts` comment ON PURPOSE. The rule it explains lives inside READER_CSS's template
// literal, and comments in THERE ship verbatim in every bundle (diffChrome.ts:41-44 records the
// first 6.2 draft paying ~8 KB of shipped prose for exactly that mistake). The rule itself carries a
// four-line summary; the argument, and the alternatives that were rejected, are here.
//
// ── THE DEFECT ────────────────────────────────────────────────────────────────────────────────
//
// `margin-left` used to stay `auto`, inherited from the base `.peekover-reader{margin:0 auto}`. That
// reads as "still centred", and it is not. `max-width:76ch` + `width:auto` + one auto margin is the
// CSS 2.1 §10.3.3/§10.4 trap: the auto width resolves first, the max-width clamp then makes `width`
// NON-auto, the algorithm re-runs, and the single remaining auto margin absorbs the ENTIRE surplus.
// The column is flung RIGHT, flush against the rail, with the whole gutter dumped on the left —
// measured at ~590px of dead left gutter on the app pane at 1920 CSS-px and ~880px on the full-page
// content-script reader. Shipped since M3 on both surfaces; invisible to every existing test because
// they assert CLEARANCE (does the column avoid the rail — it does) and never CENTRING.
//
// ── THE REJECTED ALTERNATIVE, WHICH STILL BINDS ───────────────────────────────────────────────
//
// The obvious fix is symmetric `margin-left:var(--toc-w)`. It was rejected on MEASURED
// narrow-scrollport grounds, and that rejection is not stale — it is the same constraint the
// one-sided reservation above exists to satisfy. At widths where the rail is open into an already
// squeezed pane, a full rail-width taken off BOTH sides drives the column under its usable measure
// (the contained pane at 414 leaves the reader host 146px — narrower than one pill; see
// diffChrome.ts's NOT-ASSERTED note). A fix that is correct at 1920 and unusable at 414 is not a fix.
//
// ── THE RESOLUTION: HALF THE SURPLUS, FLOORED AT ZERO ─────────────────────────────────────────
//
//   margin-left: max(0px, calc((100% - var(--reader-measure) - var(--toc-w)) / 2))
//
// `100%` is the containing block's width, so the calc is "what is left over once the column has its
// full measure AND the rail has its reservation" — the surplus — halved. Two regimes, and they
// are the two the constraints demand:
//
//   WIDE (surplus > 0): margin-left = surplus/2. The used width clamps to the measure, which over-constrains
//     the box, so §10.3.3 drops `margin-right` and the right gap becomes --toc-w + surplus/2 — i.e.
//     the column sits exactly CENTRED in the space left of the rail, and clears the rail by MORE than
//     the reservation, never less. Centring is a property of the formula here, not a tuned constant.
//   NARROW (surplus <= 0): the floor clamps margin-left to 0px, width resolves to
//     (100% - --toc-w) with no max-width clamp, margin-right is honoured exactly, and the behaviour
//     is BYTE-FOR-BYTE the pre-B1 left-aligned one the narrow-viewport rejection asked for.
//
// ── THE --reader-measure COUPLING (why px, not ch) ────────────────────────────────────────────
//
// 748px IS Literata's 76ch at this sheet's 17px, measured in a real browser under Playwright on both
// engines. It is a px constant in a variable rather than the `ch` unit written twice, and that is a
// MEASURED decision, not a style preference:
//
//   `ch` INSIDE A MARGIN CALC COSTS ~28ms OF FIRST PAINT. The same 76ch in `max-width` is cheap —
//   resolved once and cached — but in a margin computation it pulls font metrics into layout, and
//   layout for the reading column is the first-paint critical path. Measured on the 50 KB typical
//   doc, medians, interleaved against a HEAD control to rule out machine state (A-B-A: the ch form
//   read ~180ms in BOTH the early and the late slot, so the cost tracks the code, not the machine):
//     HEAD (no margin-left at all)      ~160ms
//     margin-left with 76ch             ~182ms   ← the gate breaker
//     margin-left ablated, rest of B1   ~155ms   ← isolates the declaration
//     margin-left with the px measure   ~151ms   ← what ships
//   The <150ms gate's quiesced headroom is ~5ms, so the ch form was not affordable.
//
// THE COUPLING IS STRUCTURAL, NOT DOCUMENTARY. `max-width` and this margin MUST refer to the same
// measure or the centring is silently wrong, and a comment asking a future session to remember that
// is exactly the class of guard that fails. So there is ONE variable, referenced twice, and a
// browser test asserts at runtime that `getComputedStyle(reader).maxWidth` equals the resolved
// `--reader-measure` (diffChrome.browser.test.ts). Change the reader's measure and the variable is
// the ONE site to edit; drift the two apart and the test reds mechanically.
//
// FALLBACK-FONT WINDOW, carried as an honesty note rather than a defect: before Literata loads, the
// fallback's own `ch` may differ, so during that window a true `76ch` column and this px measure
// would disagree slightly. The MAX-WIDTH governs the column's actual width and both forms now use
// the same value, so the column is never mis-sized — only the centring could be off by a few px for
// ~50-100ms. First eye-fixation lands well after font load, so it is invisible in practice; it is
// recorded because "invisible in practice" is a judgement someone may want to revisit.
//
// NO DISCRETE THRESHOLD, and that is why it respects the rejection rather than trading against it:
// the regimes meet continuously at surplus = 0, the width at which the column is exactly the measure with
// the rail reserved. margin-left is 0 on one side of that width and grows from 0 on the other, so
// there is no jump to place, no breakpoint to keep in sync with --toc-w, and a 3.4 resize drag moves
// the crossover automatically because --toc-w is IN the expression.
//
// WHY `/ 2` RATHER THAN THE min(--toc-w, ...) FORM: capping the left margin at one rail-width leaves
// the column left-of-centre the moment the surplus exceeds 2 * --toc-w — at 2560 it would sit 760px
// off centre, which is the same defect class in a smaller size. Halving the surplus has no such
// ceiling and needs no constant beyond the measure the base rule already declares.
//
// ============================================================================
// CONTAINED variant — opt-in via mount(source, host, { contained: true }).
// ============================================================================
// READER_CSS above styles the shadow root as a FULL-PAGE takeover: :host is
// position:fixed; inset:0, and the three chrome pills are position:fixed to the
// viewport corners. That is exactly right for the CONTENT SCRIPT, where the reader
// SHOULD cover the raw markdown document (mountReader also display:none's the page's
// own nodes). It is WRONG for the app page's reader pane, where the same shadow root
// lives inside a shell region — there the full-bleed :host paints OVER the header and
// folder tree, and the fixed pills float at the window's corners.
//
// CONTAINED_CSS is injected as a SECOND <style>, AFTER READER_CSS, ONLY when a caller
// passes { contained: true } (the app-page reader pane; never the content script). It
// undoes exactly the two content-script escapes and nothing else:
//
//   1. :host returns to normal flow (position:relative; inset:auto), so it fills its
//      PANE box instead of pinning to the viewport. Every other :host declaration
//      (background, colour, overflow, typography) is inherited from READER_CSS.
//   2. The chrome pills (mode toggle, theme control, remote-load, network indicator) and the
//      TOC rail switch position:fixed → position:absolute, so they
//      anchor to the now-positioned :host — the pane's corners — keeping their
//      top/right/bottom/left offsets. Switching fixed→absolute (rather than a
//      transform / contain containing-block trick on :host) deliberately SIDESTEPS the
//      known cross-engine quirks with fixed-positioned descendants: an absolutely
//      positioned child of a position:relative ancestor is contained identically in
//      Chromium and Firefox.
//
// Because it lives in a separate string injected only on the opt-in path, READER_CSS —
// and therefore the content script's injected stylesheet — is left byte-for-byte
// unchanged. Its rules come from a later <style> than READER_CSS, so equal-specificity
// declarations (:host, .peekover-mode-toggle, …) win by source order — no !important.
//
// ── 008 TASK 2.4: THE STATUS LINE'S LANE, AND WHY IT IS DERIVED RATHER THAN PICKED ────────────
//
// A `.ts` comment ON PURPOSE (finding 9): the rule below lives inside a template literal the
// minifier cannot enter, and this file is on BOTH graphs, so prose written beside the rule would
// ship to the content script — the failure diffChrome.ts:40-44 records as having cost ~8 KB once.
//
// THE DEFECT IT FIXES, MEASURED BEFORE IT WAS DECIDED. `.peekover-diff-picker` and
// `.peekover-diff-status` share ONE slot — top:94/left:16 in READER_CSS (:400-401, :429-430),
// top:50 here (:996-997 before this rule) — and the CSS says so in as many words at :421-428:
// "safe because the two are mutually exclusive by construction in diffChrome.ts (every path closes
// one before showing the other)". 008 D-4 ends that. The two HALF-EMPTY states — snapshots but no
// other markdown, or files but no snapshots — must LIST the kind that has entries AND SPEAK the
// empty one, at the same time, because a picker that closed itself to say "no snapshots yet" would
// be hiding the files it was just about to offer. Probed on the real surface at HEAD, both engines,
// by HIT-TEST rather than by rects: elementFromPoint over the first list row returned
// `peekover-diff-status`, and every row was covered. The message painted OVER the list.
//
// THE LANE IS ARITHMETIC ON THE PICKER'S OWN TOKENS, NOT A NUMBER THAT LOOKED RIGHT:
//
//   picker top (50px, :997)  +  picker max-height (min(46vh,320px), :403)  +  6px
//
// Each term is already in the file. The 6px is the gap this chrome already uses between the pill
// and the picker (pill top:12 + its 32px height = 44, picker top:50 — diffChrome.ts:107 calls it
// "the SAME 6px gap"), so the status sits under the picker exactly as the picker sits under the
// pill. ★ THE MAX-HEIGHT TERM IS THE LOAD-BEARING ONE. The picker's height is CONTENT-dependent —
// one 44px row for a single snapshot, up to the token's cap for a full retention window — and CSS
// cannot read a sibling's rendered height. An offset derived from any PARTICULAR height would clear
// at that height and overlap at every taller one, which is precisely the magic-number trap
// diffChrome.ts:55-60 rejects for 3.1's text-wrap-dependent disclosure. Deriving from the CAP
// clears at EVERY height the picker can reach, by construction rather than by measurement luck —
// the measurement then CONFIRMS the derivation instead of producing it.
//
// SIBLING COMBINATOR, AND IT IS LEGAL HERE: diffChrome.ts pushes `pill, picker, status` in that
// order, so the status always FOLLOWS the picker among the shadow root's children. `:not([hidden])`
// reads the same `hidden` property `closePicker()` sets, so the lane applies ONLY while the picker
// is open — a state change already in the code, not a new class to keep in sync. THE BOTH-EMPTY
// BRANCH IS THEREFORE UNTOUCHED: it calls `closePicker()` first, so `[hidden]` is set, the rule
// does not match, and the status keeps its original slot byte-for-byte.
//
// CONTAINED_CSS ONLY — diffChrome.ts:104's standing precedent ("the pill exists on the app page
// alone (D-14), so no full-page rule moves"), which recovery B1 already followed. READER_CSS is
// byte-untouched: a full-page lane would be a rule for chrome D-14 guarantees never renders there.
// Specificity (0,3,0) beats the (0,1,0) `top:50px` above it, so source order is not relied on.
//
// ── M13 TASK 1.4: THE REMOTE-LOAD LANE IS ANCHORED TO THE PILL'S LAID-OUT EDGE ──────────────────
//
// Recovery B1 put the opt-in at a FIXED `left:176px` — the widest pill label as measured on Windows
// (136px, Segoe UI) + 16 + a 24px gap. On CI's Linux runner the system face is DejaVu Sans, which
// lays "Close comparison" out 160.10px wide, so the pill's right edge reached 520.10 against the
// opt-in's 520.00 and the lanes overlapped (CI #18; `decisions.md`, "M13 RULING — the Linux reds").
// A constant derived from one OS's font metrics cannot hold on another.
//
// The rule now READS the pill's edge instead of predicting it: the pill is a CSS anchor
// (`anchor-name:--peekover-diff`) and the opt-in's `left` is `anchor(--peekover-diff right) + 24px`
// — the same 24px gap, after wherever the pill is actually laid out, on any font. Pure CSS; no JS
// measures anything. It works because `mount()` pushes the diff chrome BEFORE the remote-load bar
// (mount.ts — an anchor must precede the element positioned against it in tree order); probed on
// both engines (Chrome for Testing 149, Firefox 151). With NO laid-out pill (none on the surface,
// or hidden), `anchor()` takes its fallback, -8px, so the opt-in lands at -8 + 24 = 16px — its own
// READER_CSS slot, the place it would sit if the diff chrome did not exist. The human ruled CSS over
// JS measurement (2026-11-01). Asserted in tests/browser/diffChrome.browser.test.ts ("the opt-in's
// lane starts 24px after the pill's LAID-OUT edge"), which widens the pill font-independently.
//
// THE OLD FIXED LANE STAYS AS THE FALLBACK FOR ENGINES WITHOUT ANCHOR POSITIONING (1.4 addendum).
// `anchor-name` / `anchor()` need Chrome and Edge 125+, Firefox 147+ (MDN browser-compat-data,
// 2026-11-01), and the manifests set no minimum version. An engine without them drops the anchored
// `left` at parse time and keeps the declaration before it. That is `left:176px` in the same rule:
// the old lane, clear of the widest Windows label, instead of READER_CSS's `left:16px`, which is the
// pill's own slot. So the same rule says `left:176px` and then the anchored `left`; a supporting
// engine takes the later one. The order is pinned in src/render/diffChrome.test.ts. This is not a
// provisional constant: it is what an older engine gets, for as long as no minimum version is set.
//
// ── M13 TASK 4.6: THE 130 PX BAND, RECLAIMED ON THE APP PAGE (D-7; F-2) ─────────────────────────
//
// The reading column's and the diff's bottom padding (`56px 32px 130px` in READER_CSS) reserved a 130px band
// for the bottom-left pill stack. Since 4.5 the app page builds no pills (`pills: false`), so here both end at
// their TOP value, 56px. READER_CSS is untouched: the content script keeps its band because its pills remain.
// `@media screen` because READER_CSS's print block sets the column's padding to 0 at the same specificity,
// and this later sheet would otherwise win in print too. The split's own band (`--edit-bottom`) is in
// EDITOR_CSS, which ships to the app page alone.
//
// ── M13 TASK 5.2a: THE RAIL STAYS IN VIEW WHILE READING (the human's ruling, 2026-11-04) ────────
//
// Here the scroll box is the pane (`.peekover-app__reader`), outside the shadow root, and an absolute
// rail scrolled away with the document. Now the rail is `position:sticky` against that pane, which
// is the full-page reader's fixed rail in a box that scrolls:
//   - `:host` drops the full-page `overflow:auto`. Otherwise the host is the rail's nearest scroll
//     box (it never scrolls) and sticky does nothing. The host stays a block formatting context
//     (`display:flow-root`, in readerPane.ts, because the light DOM's own `display` wins over `:host`),
//     so no margin leaves it.
//   - the pane is a size container (appShell.ts), so `100cqh` is its content box height. The open
//     card is that height less 8 px above and below, and it scrolls its own list when the list is long.
//     Sticky insets count from the pane's content edge in both engines (measured), so `top:8px` puts
//     the card where the old absolute `top:8px` did.
//   - the rail stays in flow but takes no height: its bottom margin cancels its top margin and its
//     height. Its left edge (what the column reserves) is unchanged: `margin-left:auto` with
//     `margin-right:8px` matches the old `right:8px`.
//   - collapsed, the box spans the pane with no fill and no pointer, and only the opener takes the
//     pointer. Text under that strip stays readable and selectable, and the opener and ticks stay
//     where they were (`top:0`, flush right).
// Edit mode and print still hide the rail (EDITOR_CSS, READER_CSS's print block). The content
// script's rail is the fixed one in READER_CSS, and these rules do not reach it.
export const CONTAINED_CSS = /* css */ `
:host{ position:relative; inset:auto; overflow:visible; }
.peekover-net{ position:absolute; }
@media (min-width:864px){
.peekover-toc{ position:sticky; top:8px; right:auto; bottom:auto; height:calc(100cqh - 16px); margin:8px 8px calc(8px - 100cqh) auto; padding-top:47px; }
:host([data-toc="collapsed"]) .peekover-toc{ top:0; height:100cqh; margin:0 0 -100cqh auto; width:max-content; background:none; pointer-events:none; }
:host([data-toc="collapsed"]) .peekover-toc__toggle{ pointer-events:auto; }
}
@media (max-width:863px){
:host([data-toc="open"]) .peekover-toc,:host([data-toc="collapsed"]) .peekover-toc{ padding-top:0; }
:host([data-toc-sheet="open"]) .peekover-toc{ padding-top:16px; }
.peekover-reader{ padding-top:0; }
.peekover-raw{ margin-top:0; }
}
@media screen{
.peekover-reader,
.peekover-diff{ padding-bottom:56px; }
}
`;

// ============================================================================
// EDITOR variant — the edit view's split pane (012 task 2.2, D-4).
// ============================================================================
// A THIRD string, injected by editorView.ts as its own <style> in the document host's shadow root
// when the edit view is built, and removed with it. Kept out of READER_CSS and CONTAINED_CSS on
// purpose:
//
//   - htmlExport's translation reads READER_CSS only and pins its `:host` rule sites, so the
//     `:host([data-mode="edit"])` gates below would move that pin; here they cannot.
//   - nothing on the content-script graph imports this export, so it ships to the app page alone
//     (the edit view is app-page-only) — CONTAINED_CSS, by contrast, rides into the content script.
//
// All rationale is in this comment: the literal below ships as written.
//
// VISIBILITY. The shell is `display:none` at rest and laid out ONLY under `data-mode="edit"` on
// the host. That is what keeps it off screen when edit is left by a path that runs no teardown
// (the mode pill's toggle) — its panes are descendants, so they are hidden with it.
//
// LAYOUT, from design/mockup.html's `.editor` (:300-304): two equal columns, a 1px --line border
// with the --r radius and clipped corners, the source pane on --code-bg in the mono face, the
// preview divided from it by a --line rule. Two departures, both forced:
//   - HEIGHT is definite (60vh) where the mockup has `min-height:60vh`. A pane whose height is
//     only a minimum grows to its content and never scrolls, and the preview must be a real
//     scroll box (editorView.ts, THE SCROLL BOX).
//   - the MARGIN is the reading column's own padding (56px 32px 130px, `.peekover-reader`), so
//     the split clears the same corner chrome the column clears; and while the TOC rail is open
//     it gives up --toc-w on the right exactly as the column does, so it never sits under the
//     rail. The mockup's `margin-top:8px` assumes a page with no such chrome.
// The preview pane takes no padding of its own: the nested reader's column brings its own.
//
// NARROW (<= 720px): the two panes stack, source above preview, each still a definite height.
//
// Tokens used, each present in design/tokens.css and in READER_CSS's :host block: --line, --r,
// --code-bg, --ink, --mono. --toc-w is READER_CSS's own rail-width property, not a design token.
//
// THE ENGINE'S VIEW IN THE SOURCE PANE (012 task 3.2). CodeMirror brings its own base stylesheet,
// written for a light page. Five rules, the least that makes the view usable in this pane in
// every theme — NOT a Peekover editor theme (none is built; the engine's setup adds no theme):
//   - `.cm-editor` takes the pane's full height. By default it is only as tall as its text, which
//     leaves the rest of the pane a dead area: a click there neither focuses the editor nor
//     scrolls it. Found by this task's own hit-test at the pane's centre.
//   - `.cm-scroller` inherits the pane's face and leading. Its default (`monospace`, 1.4) is what
//     silently defeated the `--mono` face this pane has set since 2.2.
//   - the gutter, the caret and the drawn cursor read the tokens. Their defaults are a light-grey
//     strip and a BLACK caret, and on the dark theme's --code-bg a black caret is invisible.
// Each selector carries three classes so it outranks the engine's own two-class rules whichever
// sheet the cascade meets last. What is left at the engine's defaults, and so is still light-page
// colouring in the dark theme — the active-line band, the search panel — is a design-walk item
// (7.1), reported at this task, not decided here.
//
// THE ACTIVE LINE (M13 walk fix 8.1i (g), CC flag 6). The band and its gutter cell were the engine's
// light-page defaults (#cceeff44 on the line, an opaque #e2f2ff cell): a light cell in the dark
// editor. Both now draw ONE band, --paper at 50 % over the pane's --code-bg: lighter than the pane in
// light, darker in dark (so the gutter numbers, E-4, read no worse on it). Half-transparent, as the
// engine's own is, so a selection on the active line still shows through. Token used: --paper.
// Tokens used: --faint, --line, --ink.
//
// THREE MORE OF THE ENGINE'S SURFACES, FROM TOKENS (012 task 3.4 — finding E-2). The engine has no
// dark theme of its own here, so its LIGHT-page rules apply under every theme, and on the dark
// pane three text pairs fell below WCAG AA (measured by tests/browser/editorEyeballProxy): selected
// text on the selection 1.16:1, the current search match's text 1.52:1, an autocomplete option
// 1.09:1 — light ink on a light fill each time. Each fill now comes from a token, so it follows
// the theme with the ink:
//   - THE SELECTION is --hl-soft, focused or not — the reader's own `::selection` colour. The
//     engine's focused rule is five classes deep (`&light.cm-focused > .cm-scroller >
//     .cm-selectionLayer .cm-selectionBackground`), so this selector carries SIX; one rule covers
//     the focused and the unfocused state because it outranks both.
//   - THE CURRENT SEARCH MATCH is --hl-soft with an --ink rule under it (the brand's "ink +
//     highlighter underline"). --hl itself is not used as a fill: it is yellow in every theme, so
//     text on it needs a literal dark colour, which this sheet does not write. The other matches
//     keep the engine's translucent yellow, which already cleared AA on both themes.
//   - THE TOOLTIP (autocomplete) is --panel with --ink text and a --line border. The SELECTED
//     option keeps the engine's own blue band and white text, which already cleared AA.
// These are in THIS sheet rather than an `EditorView.theme()` so the engine's setup stays the
// ruled pair plus one highlight style, and so they sit with the five rules above that already
// restyle the engine from here. Tokens used: --hl-soft, --ink, --panel, --line.
//
// THE COLLAPSED TOC HANDLE (012 task 3.4 — finding E-1). A collapsed rail shrinks to its handle,
// a pill at the top right from 52px to 82px down; the pane started at 56px and reserved the
// rail's width only while the rail was OPEN, so the handle covered the pane's top-right corner by
// 103x26px at every width. While the rail is collapsed the pane now starts at 90px — 8px below
// the handle. A TOP offset
// rather than a right reservation: reserving the handle's width would take ~135px from a pane
// that is 350px wide on a narrow screen, and would depend on the width of the handle's label.
// A document with no rail has no `data-toc` and keeps the 56px margin.
//
// THE MODE PILL IS HIDDEN IN EDIT (012 task 3.2, human ruling R3). The pill's click is
// toggleReaderMode, which leaves edit for Raw WITHOUT the edit view's teardown — the bypass 2.1
// and 2.2 carried. While the host is in edit the pill is therefore not offered at all, and the
// toolbar's Read / Raw (013 D-6) are the way out. The rule is HERE, in the sheet that exists
// only while an edit view does, and not in READER_CSS: a `:host([data-mode="edit"])` rule
// there is a new `:host` site (htmlExport.test.ts pins the count) and would ship to the content
// script, which has no edit mode.
//
// THE SAVE BAR (012 task 5.3). A row across the top of the split, inside its border: the Save
// button, then the status line. The grid gains a first row sized to the bar (`auto`), and the two
// panes are PLACED in the row below it — placed, not auto-flowed, because a session with no save
// capability has no bar, and auto-flow would then put the panes in the `auto` row and collapse
// them to their content. With no bar that first row is simply empty and takes no height. Stacked
// (<= 720px) the preview moves to a third row. `minmax(0,1fr)` rather than `1fr`: a pane is a
// scroll box and must not grow the row to fit what it holds.
//   - 013 TASK 5.7: the bar takes `.edbar`'s SHAPE only (toolbar-mock.html:141, mockup.html:309):
//     a centred, wrapping flex row 10px apart on --paper, in --sans. None of the mock's tools
//     (spec §6: the formatting / lint / table / snapshot bar is not shipped). `min-height` holds
//     the bar at its pre-5.7 height (6 + 27.5 + 6 + 1 = 40.5px), so the panes below it keep their
//     boxes to the pixel.
//   - Save is the INK PRIMARY, 5.4's look (APP_CSS's confirms and the unsaved dialog's Keep
//     editing): --ink fill and border, --paper text, 600 11.5px --sans, radius 7, 5px 11px. APP_CSS
//     does not reach this shadow root, so the declarations are repeated here; a browser test holds
//     the two to one computed box. While a save runs (`aria-busy`) the pointer says busy.
//   - The status line is --muted text (the mock's) and nothing else. No outcome has a colour: what
//     happened is said in words (the control's own text while a save is running, this line once
//     it has ended), so there is no state here that colour alone carries.
//   - `min-width:0` lets a long status line wrap inside the bar instead of widening the grid.
// Tokens used, each already in this sheet's set: --line, --paper, --ink, --muted, --sans.
//
// THE 7.1 WALK'S POLISH (012 R28, R29; decisions.md "M12 TASK 3.5").
//   - HEIGHT. The split was a fixed 60vh. It now fills the reader pane: editorView.ts measures the
//     pane's content box (a ResizeObserver on the scroll container) into `--peekover-edit-avail` on
//     the host, and the split is that minus its own top and bottom margins. No percentage can do
//     this — the host sits in `height:auto` wrappers — and the shell's header height is not a
//     constant. With no scrolling pane (a bare pane in a test) the property is unset and the height
//     falls back to `--edit-fallback`, 60vh as before (90vh stacked). The top margin clears the
//     corner chrome. The bottom margin was 130px, the clearance the bottom-left pill stack (net 16,
//     theme 56, watch 96) was always given; M13 task 4.6 (D-7) reclaimed it — the app page has had no
//     pill stack since 4.5 — so the split now runs to the reader pane's own padding. The one piece of
//     chrome still drawn at the reader's foot is the network indicator (16px from the host's bottom,
//     shown only after the user loads remote media): while the host carries data-network="active"
//     the split keeps 56px for it, the same clearance the reading column keeps.
//   - SCROLLBARS. `scrollbar-color` (thumb --faint, transparent track) on the split, inherited by
//     both scrollers, and `color-scheme` by theme so native controls and any scrollbar left at
//     auto follow it. Both engines expose `scrollbar-color`; neither exposes the native bar's own
//     colours, so the test reads the computed property.
//   - THE RAIL. At or below 1400px the rail is hidden while editing. With it open each pane
//     measured under 360px up to that width: folder pane 320 + reader padding 48 + split margins
//     64 + rail 250 + 32 leave 720 for two panes at 1403px. Leaving edit shows the rail again.
//   - THE SEARCH PANEL (Ctrl-F). The engine's panel is light-page colouring under every theme
//     (`&light` rules, a gradient button, a white field, black text). Panel, field, buttons, labels
//     and the close mark now draw from --panel, --paper, --line and --ink. Each selector is four
//     classes deep so it outranks the engine's three-to-four-class rules whichever sheet is last.
// Tokens used: --panel, --paper, --ink, --line, --faint, --accent-soft.
export const EDITOR_CSS = /* css */ `
.peekover-editor{display:none}
:host([data-mode="edit"]) .peekover-mode-toggle{display:none}
:host([data-mode="edit"]) .peekover-editor{
  --edit-top:56px;--edit-bottom:0px;--edit-fallback:60vh;
  display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto minmax(0,1fr);
  height:calc(var(--peekover-edit-avail,calc(var(--edit-fallback) + var(--edit-top) + var(--edit-bottom))) - var(--edit-top) - var(--edit-bottom));
  margin:var(--edit-top) 32px var(--edit-bottom);
  border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
  color-scheme:light;scrollbar-color:var(--faint) transparent;
}
:host([data-mode="edit"][data-theme="dark"]) .peekover-editor{color-scheme:dark}
:host([data-mode="edit"][data-network="active"]) .peekover-editor{--edit-bottom:56px}
:host([data-mode="edit"][data-toc="open"]) .peekover-editor{margin-right:calc(var(--toc-w) + 32px)}
:host([data-mode="edit"][data-toc="collapsed"]) .peekover-editor{--edit-top:90px}
:host([data-mode="edit"]) .peekover-toc__toggle~.peekover-toc__ticks{display:none}
@media (max-width:1400px){
  :host([data-mode="edit"]) .peekover-toc{display:none}
  :host([data-mode="edit"][data-toc="open"]) .peekover-editor{margin-right:32px}
  :host([data-mode="edit"][data-toc="collapsed"]) .peekover-editor{--edit-top:56px}
}
@media (max-width:863px){
  :host([data-mode="edit"]) .peekover-editor,:host([data-mode="edit"][data-toc]) .peekover-editor{--edit-top:0px}
}
.peekover-editor__bar{
  grid-column:1/-1;grid-row:1;display:flex;flex-wrap:wrap;align-items:center;gap:10px;
  box-sizing:border-box;min-height:40.5px;padding:6px 10px;border-bottom:1px solid var(--line);
  background:var(--paper);color:var(--muted);font:400 12.5px/1.4 var(--sans);
}
.peekover-editor__save{
  flex:none;margin:0;font:600 11.5px/normal var(--sans);color:var(--paper);background:var(--ink);
  border:1px solid var(--ink);border-radius:7px;padding:5px 11px;cursor:pointer;
}
.peekover-editor__save[aria-busy="true"]{cursor:progress}
.peekover-editor__status{margin:0;min-width:0}
.peekover-editor__source,.peekover-editor__preview{grid-row:2}
.peekover-editor__source{
  min-width:0;overflow:auto;
  background:var(--code-bg);color:var(--ink);font:13.5px/1.8 var(--mono);
}
.peekover-editor__source .cm-editor{height:100%}
.peekover-editor__source .cm-editor .cm-scroller{font-family:inherit;line-height:inherit}
.peekover-editor__source .cm-editor .cm-gutters{background:transparent;color:var(--faint);border-right-color:var(--line)}
.peekover-editor__source .cm-editor .cm-content{caret-color:var(--ink)}
.peekover-editor__source .cm-editor .cm-cursor{border-left-color:var(--ink)}
.peekover-editor__source .cm-editor .cm-activeLine,.peekover-editor__source .cm-editor .cm-activeLineGutter{background:color-mix(in srgb,var(--paper) 50%,transparent)}
.peekover-editor .peekover-editor__source .cm-editor .cm-scroller .cm-selectionLayer .cm-selectionBackground{background:var(--hl-soft)}
.peekover-editor__source .cm-editor .cm-searchMatch-selected{background:var(--hl-soft);box-shadow:inset 0 -2px 0 var(--ink)}
.peekover-editor__source .cm-editor .cm-tooltip{background:var(--panel);color:var(--ink);border-color:var(--line)}
.peekover-editor .peekover-editor__source .cm-editor .cm-panels{background:var(--panel);color:var(--ink);border-color:var(--line)}
.peekover-editor .peekover-editor__source .cm-editor .cm-panels-bottom{border-top:1px solid var(--line)}
.peekover-editor .peekover-editor__source .cm-editor .cm-panels-top{border-bottom:1px solid var(--line)}
.peekover-editor .peekover-editor__source .cm-editor .cm-textfield{background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:2px 6px}
.peekover-editor .peekover-editor__source .cm-editor .cm-button{background:var(--panel);background-image:none;color:var(--ink);border:1px solid var(--line);border-radius:4px;cursor:pointer}
.peekover-editor .peekover-editor__source .cm-editor .cm-button:hover{border-color:var(--faint)}
.peekover-editor .peekover-editor__source .cm-editor .cm-button:active{background:var(--accent-soft);background-image:none}
.peekover-editor .peekover-editor__source .cm-editor .cm-search label{color:var(--ink)}
.peekover-editor .peekover-editor__source .cm-editor .cm-search [name="close"]{background:transparent;color:var(--ink);cursor:pointer}
.peekover-editor .peekover-editor__source .cm-editor .cm-search input[type="checkbox"]{accent-color:var(--ink)}
.peekover-editor__preview{min-width:0;overflow:auto;border-left:1px solid var(--line)}
@media (max-width:720px){
  :host([data-mode="edit"]) .peekover-editor{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) minmax(0,1fr);--edit-fallback:90vh}
  .peekover-editor__preview{grid-row:3;border-left:none;border-top:1px solid var(--line)}
}
`;

