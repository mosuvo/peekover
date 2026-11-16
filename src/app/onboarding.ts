// onboarding — the setup guide page (M13 task 6.1; plan D-11; gate-1 Q18; redesigned in 0.1.2, decisions.md
// "0.1.2 B3: THE SETUP GUIDE", the human's approval of the Phase A prototype, 2026-11-16).
//
// A full-width page that says what each kind of file needs on THIS build: a status block at the top (Ready / One
// step left / Check one setting, then the state's own sentence), numbered steps for this build's browsers only, a
// drawing at the step that has the setting, a "Try it" block that opens a bundled sample, and the raw-files note.
// - Chromium: whether "Allow access to file URLs" is on, read through the injected `readFileAccess`
//   (the entry wires `extension.isAllowedFileSchemeAccess()`; no permission), with the steps to turn
//   it on and a button that opens Peekover's own details on the extensions page. Read again on
//   `focus` and on `visibilitychange` to visible, so the page follows a change made elsewhere — and since 0.1.2
//   the page says so. A missing reader, a throw, a rejection or a non-boolean answer is "unknown": the steps,
//   never a blank page (AGENTS.md #5).
//   SITE ACCESS (8.1f, walk I-2): the file-URL toggle is not the only gate. Chrome's site access ("Automatically
//   allow access on the following sites", Chrome 157) can withhold `file:///*` while the toggle stays on — the
//   API then truthfully answers true and the tab stays plain text (measured on the kept walk profile). So
//   "on" needs the injected `readSiteAccess('files')` to answer true as well: false is its own state
//   ("blocked": the site step instead of the toggle step), anything else is "unknown" — never "on" unsure.
//   8.1g: with the toggle OFF the site answer for files reads false even when site access is on, so "off" cannot
//   tell — its site line is conditional; "blocked" keeps the direct step. The labels name Chrome, Edge and Brave
//   (0.1.2 D6: the labels measured identical in Chromium 149, Edge 157 and Brave 157).
// - Firefox (153+, HUMAN RULING 2026-11-10): the same detection — Firefox 153 made local-file access a
//   separate, default-off setting, "Access local files on your computer", and the same call reports it.
//   Since 0.1.2 (D3) the Firefox build declares `options_ui`, so `runtime.openOptionsPage()` opens about:addons on
//   Peekover's own card (Options selected; "Permissions and data" one tab over — measured on Firefox 160). The
//   injected `openAddons` does that; the typed address stays beneath it, as Chromium's does. Inside about:addons
//   (the Options tab shows this page, `embedded`) that button is not offered: the user is already there.
//   Firefox asks no site question for files: `file:///*` is always granted there (measured, Firefox 159 on
//   the signed install); the local-files setting is its only gate.
// - Both: the raw-hosts line asks `readSiteAccess('web')`. True or no answer keeps "shown with no setup";
//   false is the engine's own sentence saying where to turn it on (8.1f).
//
// The dependency names here never spell the browser API: the entry wires it (`onboarding.test.ts` bundles both
// engines; only the Chromium bundle carries the extensions-page deep link and its drawing, only Firefox's the
// add-ons opener and its drawing).
//
// Constructed DOM only — every string is `textContent`; nothing is parsed as HTML.
//
// THE SHEET mirrors the app shell's token sets (pinned to `design/tokens.css` by `tests/designTokens.test.ts`), the
// light base, the OS dark default before any script decides, and an explicit `data-theme` override on the root,
// which beats the media rule by specificity (`appShell.ts`, the APP_CSS doc comment). The injected `loadTheme` writes
// `data-theme` for a manual light or dark; Auto leaves it off and the OS rule decides. Layout (0.1.2): a top bar
// with the mark, then one column of at most 880 px with a 16 px gutter at any width; 17 px text; the title in
// Literata 700 (the one face, loaded from the package as a file — the reader's faces are inlined into its own
// chunk); step numbers are the mock's circles on the highlighter, their text in the toolbar file name's pair
// (`--ink` light, `--paper` dark); the warn badge's ring is the fixed logo ink, since the highlighter is yellow in
// both themes. Below 641 px the type steps down, the step number sits beside its text, buttons go full width and
// each drawing shows its narrow form. CSS comments would ship (AGENTS.md), so the rationale lives here.
import { registerUiFonts } from '../theme/uiFonts';
import { buildMark } from '../theme/mark';
import literata700 from '../../assets/fonts/literata-latin-700-normal.woff2';

/** The page's class root; every part is `${ONBOARDING_CLASS}__part`. */
export const ONBOARDING_CLASS = 'peekover-onboard';
const C = ONBOARDING_CLASS;

/** What the page knows about file access on this engine. */
export type FileAccessState = 'on' | 'off' | 'unknown' | 'blocked';
type Answer = 'on' | 'off' | 'unknown';

export interface OnboardingDeps {
  /** Which build is running (`import.meta.env.FIREFOX` in the entry). */
  engine: 'chromium' | 'firefox';
  /** Both engines: resolves whether the extension may read file:// URLs. Absent → "unknown". */
  readFileAccess?: () => Promise<unknown>;
  /** Both: resolves whether the extension holds its content-script sites: `files` (the file:// matches,
   *  asked on Chromium only) or `web` (the raw hosts). Absent, failing or not a boolean → not known. */
  readSiteAccess?: (sites: 'files' | 'web') => Promise<unknown>;
  /** Chromium: opens Peekover's details on the extensions page. Absent or rejecting → the address. */
  openDetails?: () => Promise<unknown>;
  /** Firefox (0.1.2, D3): opens about:addons on Peekover's card. Absent → no button; rejecting → the address. */
  openAddons?: () => Promise<unknown>;
  /** Both (0.1.2, D4): opens the bundled sample on the app page. Absent → no "Try it" block. */
  openSample?: () => Promise<unknown>;
  /** Both (0.1.2): the drawing of where the setting is, for this build (`onboardingFigures.ts`). Absent → none. */
  figure?: (doc: Document) => HTMLElement;
  /** Firefox: the page is shown inside about:addons (the Options tab), so the add-ons button is not offered. */
  embedded?: boolean;
  /** Both: resolves the user's saved theme setting. Absent, rejecting or not light/dark → the system's. */
  loadTheme?: () => Promise<unknown>;
}

export interface OnboardingController {
  /** The page's root element. */
  readonly element: HTMLElement;
  /** Read file access again and repaint (the focus / visibility listeners call this). */
  recheck(): Promise<FileAccessState>;
  /** Remove the listeners and the page. */
  destroy(): void;
}

/** Every user-facing sentence on the page, in one place (approved by the human at 6.1; 0.1.2's additions approved
 *  2026-11-16, D1–D6). `tests/truthPins.test.ts` requires an "onboarding" ledger row for each sentence. */
export const ONBOARDING_COPY = {
  brand: 'Peekover',
  bar: 'Setup guide',
  title: 'Set up Peekover',
  introChromium: 'Peekover shows markdown files as formatted pages. Raw files on the web need no setup. Files on your computer need a browser setting.',
  introFirefox: 'Peekover shows markdown files as formatted pages. Raw files on the web need no setup. Files on your computer need one Firefox setting.',
  ready: 'Ready',
  oneLeft: 'One step left',
  checkLabel: 'Check one setting',
  recheck: 'This page checks again by itself when you come back to it.',
  localHeading: 'Files on your computer',
  browsersChromium: 'These steps are for Chrome, Edge and Brave.',
  browsersFirefox: 'These steps are for Firefox.',
  on: 'Peekover can read files on your computer: “Allow access to file URLs” is on. Open a markdown file in a tab to read it.',
  off: 'Peekover can’t read files on your computer yet: “Allow access to file URLs” is off.',
  unknown: 'Peekover couldn’t check whether it can read files on your computer. Here is how to check.',
  step1: 'Open Peekover’s details on your browser’s extensions page.',
  openDetails: 'Open Peekover’s details',
  address: 'Or type chrome://extensions in the address bar and choose Details under Peekover.',
  addressCode: 'chrome://extensions',
  openFailed: 'Your browser didn’t open the page. Use the address above instead.',
  step2Off: 'Turn on “Allow access to file URLs”.',
  step2Unknown: 'Check that “Allow access to file URLs” is on.',
  siteOff: 'Peekover can’t read files on your computer yet: its site access for file:///* is turned off.',
  stepSite: 'Under site access, turn on file:///* (in Chrome, Edge and Brave: “Automatically allow access on the following sites”).',
  stepSiteIfOff: 'If site access for file:///* is off, turn it on too (in Chrome, Edge and Brave: “Automatically allow access on the following sites”).',
  siteCode: 'file:///*',
  step3: 'Your browser may restart Peekover and close this page.',
  step3Then: 'Then open your markdown file again.',
  onFirefox: 'Peekover can read files on your computer: “Access local files on your computer” is on. Open a markdown file in a tab to read it.',
  offFirefox: 'Peekover can’t read files on your computer yet: “Access local files on your computer” is off.',
  step1FirefoxButton: 'Open Peekover in the Add-ons Manager.',
  openAddons: 'Open the Add-ons Manager',
  step1Firefox: 'Open about:addons (type it in the address bar) and choose Peekover.',
  addonsCode: 'about:addons',
  step2Firefox: 'Open the Permissions and data tab.',
  step3OffFirefox: 'Turn on “Access local files on your computer”.',
  step3UnknownFirefox: 'Check that “Access local files on your computer” is on.',
  step4Firefox: 'Then open your markdown file again.',
  figureChromium: 'Drawing: the toggle Allow access to file URLs, on Peekover’s details page',
  figureFirefox: 'Drawing: the Permissions and data tab and the toggle Access local files on your computer, on Peekover’s page in about:addons',
  tryHeading: 'Try it',
  tryText: 'Open a sample markdown file that comes with Peekover.',
  tryCta: 'Open the sample',
  webHeading: 'Raw files on the web',
  web: 'Raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket are shown with no setup.',
  webOff: 'Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its site access for at least one of them is turned off. Turn them on under site access in Peekover’s details on your browser’s extensions page.',
  webOffFirefox: 'Peekover can’t show raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket yet: its permission for at least one of them is turned off. Turn them on under Peekover’s Permissions and data in about:addons.',
  failed: 'Peekover’s setup guide couldn’t be shown. To read files on your computer in Chrome or Edge, turn on “Allow access to file URLs” for Peekover on your browser’s extensions page. In Firefox, turn on “Access local files on your computer” under Peekover’s Permissions and data in about:addons.',
} as const;

/** The page's copies of `design/tokens.css`, pinned by tests/designTokens.test.ts. */
export const ONBOARDING_LIGHT_TOKENS = /* css */ `
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#8F91A0;
  --line:#E6E6DF; --code-bg:#F1F1EB; --accent:#16171F; --accent-soft:#ECECE3;
  --hl:#FFE94A; --hl-soft:#FFF6BF; --ok:#1F9D55; --ok-soft:#E4F5EB; --warn:#B7791F;
  --del:#B8512F; --del-soft:#F8E9E2; --code-str:#197E44; --code-num:#B34F2E; --code-type:#966319;
`;
export const ONBOARDING_DARK_TOKENS = /* css */ `
  --paper:#12141C; --panel:#181B26; --ink:#EAEBF3; --muted:#A0A4B8; --faint:#6B6F84;
  --line:#262A38; --code-bg:#1C2030; --accent:#EAEBF3; --accent-soft:#232838;
  --hl:#FFD84D; --hl-soft:#3A3413; --ok:#4CC38A; --ok-soft:#15291F; --warn:#E0A83E;
  --del:#E08663; --del-soft:#342016; --code-str:#4CC38A; --code-num:#E08663; --code-type:#E0A83E;
  --shadow:0 10px 30px rgba(0,0,0,.5);
`;
export const ONBOARDING_BASE_TOKENS = /* css */ `--r:10px; --shadow:0 10px 30px rgba(22,23,31,.10);
  --logo-ink:#16171F; --logo-eye:#FBFBF8;
  --serif:"Literata",Georgia,serif; --sans:"Bricolage Grotesque",system-ui,sans-serif;
  --mono:"Sometype Mono",ui-monospace,monospace;`;

const NUM_DARK = 'color:var(--paper)';

export const ONBOARDING_CSS = /* css */ `
.${C}{
  ${ONBOARDING_LIGHT_TOKENS}
  ${ONBOARDING_BASE_TOKENS}
  position:fixed; inset:0; overflow:auto; scrollbar-color:var(--faint) transparent;
  background:var(--paper); color:var(--ink); font:400 17px/1.6 var(--sans);
  -webkit-text-size-adjust:100%;
}
@media (prefers-color-scheme:dark){
  .${C}{${ONBOARDING_DARK_TOKENS}}
  .${C}:not([data-theme="light"]) .${C}__n{${NUM_DARK}}
}
.${C}[data-theme="light"]{${ONBOARDING_LIGHT_TOKENS}}
.${C}[data-theme="dark"]{${ONBOARDING_DARK_TOKENS}}
.${C}[data-theme="dark"] .${C}__n{${NUM_DARK}}
.${C} *,.${C} *::before,.${C} *::after{box-sizing:border-box}
.${C} :focus-visible{outline:2px solid var(--accent); outline-offset:2px}
@media (prefers-reduced-motion:reduce){
  .${C} *,.${C} *::before,.${C} *::after{animation:none!important; transition:none!important}
}
.${C} [hidden]{display:none!important}
.${C}[data-embedded]{position:static; overflow:visible}
.${C}[data-embedded] .${C}__bar{display:none}
.${C}[data-embedded] .${C}__card{padding:16px 16px 24px}
.${C}__bar{display:flex; align-items:center; gap:10px; padding:14px 24px; border-bottom:1px solid var(--line); background:var(--panel)}
.${C}__mark{width:34px; height:30px; flex:none}
.${C}__brand{font:700 17px/1 var(--sans)}
.${C}__crumb{font:500 15px/1 var(--sans); color:var(--muted)}
.${C}__card{max-width:880px; margin:0 auto; padding:48px 32px 72px}
.${C}__title{margin:0; font:700 44px/1.15 var(--serif); letter-spacing:-.01em; text-wrap:balance}
.${C}__intro{margin:14px 0 0; font-size:19px; color:var(--muted); max-width:62ch}
.${C}__status{display:flex; gap:18px; align-items:flex-start; margin:32px 0 0; padding:22px 24px; border-radius:16px;
  border:1px solid var(--line); background:var(--panel)}
.${C}__status[data-tone="ok"]{border-color:color-mix(in srgb,var(--ok) 45%,var(--line)); background:var(--ok-soft)}
.${C}__status[data-tone="warn"]{border-color:color-mix(in srgb,var(--warn) 45%,var(--line)); background:var(--hl-soft)}
.${C}__badge{flex:none; width:44px; height:44px; border-radius:50%; display:grid; place-items:center; font:700 20px/1 var(--sans)}
.${C}__status[data-tone="ok"] .${C}__badge{background:var(--ok); color:var(--paper)}
.${C}__status[data-tone="warn"] .${C}__badge{background:var(--hl); color:var(--logo-ink); border:2px solid var(--logo-ink)}
.${C}__status-text{min-width:0}
.${C}__label{margin:0; font:700 24px/1.25 var(--sans)}
.${C}__notice{margin:6px 0 0}
.${C}__recheck{margin:8px 0 0; font-size:14.5px; color:var(--muted)}
.${C}__h{margin:48px 0 0; font:700 26px/1.3 var(--sans)}
.${C}__browsers{margin:6px 0 0; font-size:14.5px; color:var(--muted)}
.${C}__steps{list-style:none; margin:22px 0 0; padding:0; display:grid; gap:18px}
.${C}__step{display:grid; grid-template-columns:40px minmax(0,1fr); gap:16px; padding:20px 22px; border:1px solid var(--line); border-radius:14px; background:var(--paper)}
.${C}__n{width:40px; height:40px; border-radius:50%; background:var(--hl); color:var(--ink); font:700 18px/40px var(--sans); text-align:center}
.${C}__step-head{margin:6px 0 0; font:600 19px/1.35 var(--sans)}
.${C}__step-body > *{margin:10px 0 0}
.${C}__more{color:var(--muted); font-size:16px}
.${C}__cta{display:inline-flex; align-items:center; justify-content:center; gap:8px; margin-top:14px; font:600 16px/1.2 var(--sans);
  color:var(--paper); background:var(--ink); border:1px solid var(--ink); border-radius:10px; padding:12px 18px; cursor:pointer}
.${C}__cta--quiet{color:var(--ink); background:var(--paper); border-color:var(--line)}
.${C}__cta--quiet:hover{border-color:var(--ink)}
.${C}__warn{padding:10px 14px; font-size:15px; color:var(--ink); border-left:3px solid var(--warn); border-radius:0 var(--r) var(--r) 0;
  background:color-mix(in srgb,var(--hl-soft) 55%,transparent)}
.${C} code{font:15px/1.4 var(--mono); color:var(--ink); background:var(--code-bg); border-radius:5px; padding:2px 6px; overflow-wrap:anywhere}
.${C}__figs{margin-top:16px}
.${C}__fig{border-radius:12px; overflow:hidden; border:1px solid var(--line); background:var(--panel)}
.${C}__fig svg{display:block; width:100%; height:auto}
.${C}__fig--narrow{display:none}
.${C}__fig-sans{font-family:var(--sans)}
.${C}__fig-mono{font-family:var(--mono)}
.${C}__try{display:flex; gap:20px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin:22px 0 0; padding:22px 24px;
  border-radius:16px; border:1px dashed color-mix(in srgb,var(--ink) 30%,var(--line))}
.${C}__try p{margin:0; min-width:0}
.${C}__try .${C}__cta{margin:0}
.${C}__web{margin:14px 0 0}
@media (max-width:640px){
  .${C}{font-size:16.5px}
  .${C}__bar{padding:12px 16px}
  .${C}__card{padding:28px 16px 56px}
  .${C}__title{font-size:34px}
  .${C}__intro{font-size:17.5px}
  .${C}__status{padding:18px; gap:14px}
  .${C}__label{font-size:21px}
  .${C}__h{font-size:23px; margin-top:40px}
  .${C}__step{grid-template-columns:32px minmax(0,1fr); gap:12px; padding:16px}
  .${C}__n{width:32px; height:32px; font-size:16px; line-height:32px}
  .${C}__step-head{margin-top:2px; font-size:17.5px}
  .${C}__cta{width:100%}
  .${C}__fig--wide{display:none}
  .${C}__fig--narrow{display:block}
}
`;

/** Read file access through `read`; anything but a boolean answer is "unknown". Never throws. */
export async function detectFileAccess(read: (() => Promise<unknown>) | undefined): Promise<Answer> {
  if (typeof read !== 'function') return 'unknown';
  try {
    const value = await read();
    if (value === true) return 'on';
    if (value === false) return 'off';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

let sheetInstalled = false;
function installSheet(doc: Document): void {
  if (sheetInstalled && doc.querySelector(`style[data-peekover-onboard]`)) return;
  const style = doc.createElement('style');
  style.dataset.peekoverOnboard = '';
  style.textContent = ONBOARDING_CSS;
  doc.head.append(style);
  sheetInstalled = true;
}

let titleFaceAdded = false;
/** The title's one Literata face (a packaged file, the extension's own origin). A no-op without the Font Loading
 *  API (jsdom); a failure is swallowed — the `--serif` stack falls back to Georgia (AGENTS.md #5). */
function registerTitleFace(doc: Document): void {
  if (titleFaceAdded || typeof FontFace === 'undefined' || !doc.fonts) return;
  titleFaceAdded = true;
  try {
    const face = new FontFace('Literata', `url(${literata700}) format('woff2')`, { weight: '700', style: 'normal', display: 'swap' });
    doc.fonts.add(face);
    void face.load().catch(() => undefined);
  } catch {
    /* the stack falls back */
  }
}

/**
 * Build the setup guide into `root` and read file access (then again on focus and on becoming
 * visible). The first paint is synchronous: before the first answer the page shows
 * the "unknown" state, so it is never blank while the browser answers.
 */
export function mountOnboarding(root: HTMLElement, deps: OnboardingDeps): OnboardingController {
  const doc = root.ownerDocument;
  installSheet(doc);
  registerUiFonts();
  registerTitleFace(doc);
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
    const node = doc.createElement(tag);
    if (cls) node.className = cls.split(' ').map((c) => `${C}__${c}`).join(' ');
    if (text !== undefined) node.textContent = text;
    return node;
  };
  /** A paragraph whose `code` part is set as code. */
  const withCode = (text: string, code: string, cls?: string): HTMLElement => {
    const p = el('p', cls);
    const [before, after] = text.split(code);
    p.append(before, el('code', undefined, code), after);
    return p;
  };
  /** An opener button with its failure notice: a missing or rejecting opener shows the notice. */
  const opener = (label: string, go: (() => Promise<unknown>) | undefined, part: string): [HTMLButtonElement, HTMLElement] => {
    const button = el('button', 'cta', label);
    button.type = 'button';
    const failure = el('p', 'warn', ONBOARDING_COPY.openFailed);
    failure.dataset.part = part;
    failure.setAttribute('role', 'status');
    failure.hidden = true;
    button.addEventListener('click', () => {
      failure.hidden = true;
      if (typeof go !== 'function') {
        failure.hidden = false;
        return;
      }
      void Promise.resolve()
        .then(() => go())
        .catch(() => {
          failure.hidden = false;
        });
    });
    return [button, failure];
  };

  const chromium = deps.engine === 'chromium';
  const page = el('main');
  page.className = C;
  page.dataset.engine = deps.engine;
  // Inside about:addons (Firefox's Options tab) the page flows, so the frame grows to it, and the bar is dropped.
  if (deps.embedded) page.dataset.embedded = '';

  const bar = el('header', 'bar');
  bar.append(buildMark(doc, C), el('span', 'brand', ONBOARDING_COPY.brand), el('span', 'crumb', `· ${ONBOARDING_COPY.bar}`));

  const card = el('section', 'card');
  const title = el('h1', 'title', ONBOARDING_COPY.title);
  title.id = `${C}-title`;
  card.setAttribute('aria-labelledby', title.id);
  page.append(bar, card);

  const intro = el('p', 'intro', chromium ? ONBOARDING_COPY.introChromium : ONBOARDING_COPY.introFirefox);
  // The status block: the label and the state's sentence are one live region, read together when the answer changes.
  const status = el('section', 'status');
  status.dataset.part = 'status';
  status.setAttribute('role', 'status');
  const badge = el('span', 'badge');
  badge.setAttribute('aria-hidden', 'true');
  const statusText = el('div', 'status-text');
  const label = el('p', 'label');
  label.dataset.part = 'label';
  const state = el('p', 'notice');
  state.dataset.part = 'access';
  const recheckNote = el('p', 'recheck', ONBOARDING_COPY.recheck);
  recheckNote.dataset.part = 'recheck';
  statusText.append(label, state, recheckNote);
  status.append(badge, statusText);

  const localHeading = el('h2', 'h', ONBOARDING_COPY.localHeading);
  const browsers = el('p', 'browsers', chromium ? ONBOARDING_COPY.browsersChromium : ONBOARDING_COPY.browsersFirefox);
  card.append(title, intro, status, localHeading, browsers);

  // The steps, per engine. `turnOnText` is the step whose words follow the answer (off / unknown).
  const steps = el('ol', 'steps');
  const turnOnText = el('p', 'step-head');
  // Chromium's site line (8.1f), `file:///*` as code; shown while the site answer for files is false. Two
  // wordings (8.1g): "blocked" (the toggle on) gives the direct step; otherwise the toggle is off or unknown, and
  // then the browser reports file sites as not allowed whatever site access says — so the line is conditional.
  const siteText = withCode(ONBOARDING_COPY.stepSite, ONBOARDING_COPY.siteCode, 'step-head');
  const siteIfOffText = withCode(ONBOARDING_COPY.stepSiteIfOff, ONBOARDING_COPY.siteCode);
  const figure = typeof deps.figure === 'function' ? deps.figure(doc) : null;
  let n = 0;
  const step = (head: HTMLElement, ...body: HTMLElement[]): HTMLLIElement => {
    n += 1;
    const li = el('li', 'step');
    const num = el('span', 'n', String(n));
    num.setAttribute('aria-hidden', 'true');
    const text = el('div', 'step-body');
    text.append(head, ...body);
    li.append(num, text);
    return li;
  };
  if (chromium) {
    const [open, failure] = opener(ONBOARDING_COPY.openDetails, deps.openDetails, 'open-failed');
    const address = withCode(ONBOARDING_COPY.address, ONBOARDING_COPY.addressCode, 'more');
    steps.append(
      step(el('p', 'step-head', ONBOARDING_COPY.step1), open, address, failure),
      step(turnOnText, siteText, siteIfOffText, ...(figure ? [figure] : [])),
      step(el('p', 'step-head', ONBOARDING_COPY.step3), el('p', 'more', ONBOARDING_COPY.step3Then)),
    );
  } else {
    // Firefox (153+): the setting is on the add-on's own page in about:addons. With `options_ui` declared (0.1.2,
    // D3) the entry can open it there; the typed address stays beneath, as Chromium's does. Inside about:addons
    // (`embedded`) the button is not offered.
    const typed = withCode(ONBOARDING_COPY.step1Firefox, ONBOARDING_COPY.addonsCode);
    if (typeof deps.openAddons === 'function' && !deps.embedded) {
      const [open, failure] = opener(ONBOARDING_COPY.openAddons, deps.openAddons, 'open-failed');
      typed.className = `${C}__more`;
      steps.append(step(el('p', 'step-head', ONBOARDING_COPY.step1FirefoxButton), open, typed, failure));
    } else {
      typed.className = `${C}__step-head`;
      steps.append(step(typed));
    }
    steps.append(
      step(el('p', 'step-head', ONBOARDING_COPY.step2Firefox)),
      step(turnOnText, ...(figure ? [figure] : [])),
      step(el('p', 'step-head', ONBOARDING_COPY.step4Firefox)),
    );
  }
  card.append(steps);

  // "Try it" (0.1.2, D4): only where the entry can open the sample.
  if (typeof deps.openSample === 'function') {
    const go = deps.openSample;
    const tryBox = el('div', 'try');
    tryBox.dataset.part = 'try';
    const cta = el('button', 'cta cta--quiet', ONBOARDING_COPY.tryCta);
    cta.type = 'button';
    cta.addEventListener('click', () => {
      void Promise.resolve()
        .then(() => go())
        .catch(() => undefined);
    });
    tryBox.append(el('p', undefined, ONBOARDING_COPY.tryText), cta);
    card.append(el('h2', 'h', ONBOARDING_COPY.tryHeading), tryBox);
  }

  const webHeading = el('h2', 'h', ONBOARDING_COPY.webHeading);
  const webLine = el('p', 'web', ONBOARDING_COPY.web);
  card.append(webHeading, webLine);

  /** The page's file state from the two answers: on Chromium, "on" only when both say yes. */
  function combine(file: Answer, filesSite: boolean | undefined): FileAccessState {
    if (!chromium || file !== 'on') return file;
    if (filesSite === true) return 'on';
    return filesSite === false ? 'blocked' : 'unknown';
  }

  function paint(file: Answer, filesSite?: boolean, webSite?: boolean): void {
    const access = combine(file, filesSite);
    page.dataset.access = access;
    webLine.textContent =
      webSite === false ? (chromium ? ONBOARDING_COPY.webOff : ONBOARDING_COPY.webOffFirefox) : ONBOARDING_COPY.web;
    const siteLine = chromium && filesSite === false;
    siteText.hidden = !(siteLine && access === 'blocked');
    siteIfOffText.hidden = !(siteLine && access !== 'blocked');
    turnOnText.hidden = access === 'blocked';
    if (figure) figure.hidden = access === 'blocked';
    if (access === 'blocked') state.textContent = ONBOARDING_COPY.siteOff;
    else if (access === 'unknown') state.textContent = ONBOARDING_COPY.unknown;
    else if (chromium) state.textContent = ONBOARDING_COPY[access];
    else state.textContent = access === 'on' ? ONBOARDING_COPY.onFirefox : ONBOARDING_COPY.offFirefox;
    label.textContent = access === 'on' ? ONBOARDING_COPY.ready : access === 'unknown' ? ONBOARDING_COPY.checkLabel : ONBOARDING_COPY.oneLeft;
    badge.textContent = access === 'on' ? '✓' : '!';
    status.dataset.tone = access === 'on' ? 'ok' : 'warn';
    if (access === 'on') delete state.dataset.tone;
    else state.dataset.tone = 'warn';
    const ready = access === 'on';
    steps.hidden = ready;
    localHeading.hidden = ready;
    browsers.hidden = ready;
    recheckNote.hidden = ready;
    if (chromium) turnOnText.textContent = access === 'off' ? ONBOARDING_COPY.step2Off : ONBOARDING_COPY.step2Unknown;
    else turnOnText.textContent = access === 'off' ? ONBOARDING_COPY.step3OffFirefox : ONBOARDING_COPY.step3UnknownFirefox;
  }

  /** One site answer: true / false, anything else (missing, a throw, a non-boolean) not known. Never throws. */
  async function siteAnswer(which: 'files' | 'web'): Promise<boolean | undefined> {
    const read = deps.readSiteAccess;
    const a = await detectFileAccess(typeof read === 'function' ? () => read(which) : undefined);
    return a === 'unknown' ? undefined : a === 'on';
  }

  let seq = 0;
  let destroyed = false;
  async function recheck(): Promise<FileAccessState> {
    const mine = (seq += 1);
    const [file, filesSite, webSite] = await Promise.all([
      detectFileAccess(deps.readFileAccess),
      chromium ? siteAnswer('files') : undefined,
      siteAnswer('web'),
    ]);
    if (!destroyed && mine === seq) paint(file, filesSite, webSite); // a later read wins
    return combine(file, filesSite);
  }
  const onFocus = (): void => void recheck();
  const onVisible = (): void => {
    if (doc.visibilityState === 'visible') void recheck();
  };

  paint('unknown');
  root.replaceChildren(page);
  // The saved theme (6.2): a manual light or dark is written to `data-theme`, which beats the OS
  // rule; Auto, a failure or anything else leaves the attribute off, so the OS rule decides — the
  // app page's cascade. The first paint above never waits for it.
  if (typeof deps.loadTheme === 'function') {
    const load = deps.loadTheme;
    void Promise.resolve()
      .then(() => load())
      .then((saved) => {
        if (destroyed) return;
        if (saved === 'light' || saved === 'dark') page.dataset.theme = saved;
        else delete page.dataset.theme;
      })
      .catch(() => undefined);
  }
  doc.defaultView?.addEventListener('focus', onFocus);
  doc.addEventListener('visibilitychange', onVisible);
  void recheck();

  return {
    element: page,
    recheck,
    destroy(): void {
      destroyed = true;
      doc.defaultView?.removeEventListener('focus', onFocus);
      doc.removeEventListener('visibilitychange', onVisible);
      page.remove();
    },
  };
}
