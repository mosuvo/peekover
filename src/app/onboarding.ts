// onboarding — the setup guide page (M13 task 6.1; plan D-11; gate-1 Q18).
//
// One card, the mock's setup card (`design/mockup.html`, "Setup guide"), saying what each kind of
// file needs on THIS engine:
// - Chromium: whether "Allow access to file URLs" is on, read through the injected `readFileAccess`
//   (the entry wires `extension.isAllowedFileSchemeAccess()`; no permission), with the steps to turn
//   it on and a button that opens Peekover's own details on the extensions page. Read again on
//   `focus` and on `visibilitychange` to visible, so the page follows a change made elsewhere.
//   A missing reader, a throw, a rejection or a non-boolean answer is "unknown": the steps, never a
//   blank card (AGENTS.md #5).
// - Firefox: no detection (the entry never wires the API on that build) and no steps.
// - Both: raw files on the four hosts need no setup.
//
// The dependency names here never spell the browser API: this module ships on both engines, and the
// Firefox chunk must not reference it (tasks.md 6.1; `onboarding.test.ts` bundles both engines).
//
// Constructed DOM only — every string is `textContent`; nothing is parsed as HTML.
//
// THE SHEET mirrors the app shell's: the token sets (pinned to `design/tokens.css` by
// `tests/designTokens.test.ts`), the light base, the OS dark default before any script decides,
// and an explicit `data-theme` override on the root, which beats the media rule by specificity
// (`appShell.ts`, the APP_CSS doc comment). Since 6.2 the injected `loadTheme` (the entry reads the
// saved setting from the settings store, as the app page does) writes `data-theme` for a manual light
// or dark; Auto leaves it off and the OS rule decides. The card, its header row, the alert and the ink
// primary button are the app page's start card, `.alert` and 5.4's primary, copied rule for rule
// (5.5's record). The step numbers are the mock's circles on the highlighter, their text in the
// toolbar file name's pair (`--ink` light, `--paper` dark) instead of the mock's untracked colour.
// CSS comments would ship (AGENTS.md), so the rationale lives here.
import { registerUiFonts } from '../theme/uiFonts';

/** The page's class root; every part is `${ONBOARDING_CLASS}__part`. */
export const ONBOARDING_CLASS = 'peekover-onboard';
const C = ONBOARDING_CLASS;

/** What the page knows about file access on this engine. */
export type FileAccessState = 'on' | 'off' | 'unknown';

export interface OnboardingDeps {
  /** Which build is running (`import.meta.env.FIREFOX` in the entry). */
  engine: 'chromium' | 'firefox';
  /** Chromium: resolves whether the extension may read file:// URLs. Absent → "unknown". */
  readFileAccess?: () => Promise<unknown>;
  /** Chromium: opens Peekover's details on the extensions page. Absent or rejecting → the address. */
  openDetails?: () => Promise<unknown>;
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

/** Every user-facing sentence on the page, in one place (approved by the human at 6.1). */
export const ONBOARDING_COPY = {
  title: 'Set up Peekover',
  introChromium: 'Peekover shows markdown files as formatted pages. Raw files on the web need no setup. Files on your computer need one browser setting.',
  introFirefox: 'Peekover shows markdown files as formatted pages. In Firefox, nothing needs setting up.',
  localHeading: 'Files on your computer',
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
  step3: 'Your browser may restart Peekover and close this page. Then open your markdown file again.',
  firefoxLocal: 'In Firefox, markdown files you open from your computer are shown with no setup.',
  webHeading: 'Raw files on the web',
  web: 'Raw markdown files on raw.githubusercontent.com, gist.githubusercontent.com, GitLab and Bitbucket are shown with no setup.',
  failed: 'Peekover’s setup guide couldn’t be shown. To read files on your computer in Chrome or Edge, turn on “Allow access to file URLs” for Peekover on your browser’s extensions page.',
} as const;

/** The page's copies of `design/tokens.css`, pinned by tests/designTokens.test.ts. */
export const ONBOARDING_LIGHT_TOKENS = /* css */ `
  --paper:#FBFBF8; --panel:#F4F4EF; --ink:#16171F; --muted:#5D6070; --faint:#9A9DAC;
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
  display:flex; justify-content:center; align-items:flex-start; padding:14vh 16px 2rem;
  background:var(--paper); color:var(--ink); font-family:var(--sans); font-size:15px; line-height:1.55;
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
.${C}__card{width:min(440px,100%); margin:0; background:var(--paper); border:1px solid var(--line);
  border-radius:14px; box-shadow:var(--shadow); overflow:hidden}
.${C}__title{margin:0; padding:14px 18px; border-bottom:1px solid var(--line); font:700 13.5px/1.3 var(--sans); color:var(--ink)}
.${C}__body{padding:22px; font-size:13.5px; line-height:1.6; color:var(--muted)}
.${C}__body > *{margin:0}
.${C}__body > * + *{margin-top:14px}
.${C}__h{margin-top:22px!important; font:700 11px/1.3 var(--sans); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.${C}__notice{padding:10px 14px; font-size:13px; line-height:1.5; color:var(--ink);
  border-left:3px solid var(--accent); border-radius:0 var(--r) var(--r) 0;
  background:color-mix(in srgb,var(--accent-soft) 55%,transparent)}
.${C}__notice[data-tone="warn"]{border-left-color:var(--warn); background:color-mix(in srgb,var(--hl-soft) 55%,transparent)}
.${C}__notice[hidden],.${C}__steps[hidden]{display:none}
.${C}__steps{list-style:none; padding:0}
.${C}__step{display:flex; gap:12px; align-items:flex-start; margin:14px 0 0}
.${C}__step:first-child{margin-top:0}
.${C}__step > div > * + *{margin-top:10px}
.${C}__step p{margin:0}
.${C}__n{flex:none; width:22px; height:22px; border-radius:50%; background:var(--hl); color:var(--ink);
  font:700 11px/22px var(--sans); text-align:center}
.${C}__cta{display:block; font:600 11.5px/normal var(--sans); color:var(--paper); background:var(--ink);
  border:1px solid var(--ink); border-radius:7px; padding:5px 11px; margin:0; cursor:pointer}
.${C} code{font:12.5px/1.4 var(--mono); color:var(--ink); background:var(--code-bg); border-radius:4px; padding:1px 5px;
  overflow-wrap:anywhere}
`;

/** Read file access through `read`; anything but a boolean answer is "unknown". Never throws. */
export async function detectFileAccess(read: (() => Promise<unknown>) | undefined): Promise<FileAccessState> {
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

/**
 * Build the setup guide into `root` and, on Chromium, read file access (then again on focus and on
 * becoming visible). The first paint is synchronous: before the first answer the Chromium page shows
 * the "unknown" card, so it is never blank while the browser answers.
 */
export function mountOnboarding(root: HTMLElement, deps: OnboardingDeps): OnboardingController {
  const doc = root.ownerDocument;
  installSheet(doc);
  registerUiFonts();
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
    const node = doc.createElement(tag);
    if (cls) node.className = `${C}__${cls}`;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const page = el('main');
  page.className = C;
  page.dataset.engine = deps.engine;
  const card = el('section', 'card');
  const title = el('h1', 'title', ONBOARDING_COPY.title);
  title.id = `${C}-title`;
  card.setAttribute('aria-labelledby', title.id);
  const body = el('div', 'body');
  card.append(title, body);
  page.append(card);

  const chromium = deps.engine === 'chromium';
  const intro = el('p', 'intro', chromium ? ONBOARDING_COPY.introChromium : ONBOARDING_COPY.introFirefox);
  const localHeading = el('h2', 'h', ONBOARDING_COPY.localHeading);
  const state = el('p', 'notice');
  state.dataset.part = 'access';
  state.setAttribute('role', 'status');
  body.append(intro, localHeading, state);

  // Chromium only: the steps.
  const steps = el('ol', 'steps');
  const step2Text = el('p');
  if (chromium) {
    const step = (n: number, ...content: HTMLElement[]): HTMLLIElement => {
      const li = el('li', 'step');
      const num = el('span', 'n', String(n));
      num.setAttribute('aria-hidden', 'true');
      const text = el('div');
      text.append(...content);
      li.append(num, text);
      return li;
    };
    const open = el('button', 'cta', ONBOARDING_COPY.openDetails);
    open.type = 'button';
    const address = el('p');
    const [before, after] = ONBOARDING_COPY.address.split(ONBOARDING_COPY.addressCode);
    address.append(before, el('code', undefined, ONBOARDING_COPY.addressCode), after);
    const failure = el('p', 'notice', ONBOARDING_COPY.openFailed);
    failure.dataset.tone = 'warn';
    failure.dataset.part = 'open-failed';
    failure.setAttribute('role', 'status');
    failure.hidden = true;
    open.addEventListener('click', () => {
      failure.hidden = true;
      const go = deps.openDetails;
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
    steps.append(
      step(1, el('p', undefined, ONBOARDING_COPY.step1), open, address, failure),
      step(2, step2Text),
      step(3, el('p', undefined, ONBOARDING_COPY.step3)),
    );
    body.append(steps);
  }

  const webHeading = el('h2', 'h', ONBOARDING_COPY.webHeading);
  body.append(webHeading, el('p', 'web', ONBOARDING_COPY.web));

  function paint(access: FileAccessState): void {
    if (!chromium) {
      state.textContent = ONBOARDING_COPY.firefoxLocal;
      return;
    }
    page.dataset.access = access;
    state.textContent = ONBOARDING_COPY[access];
    if (access === 'on') delete state.dataset.tone;
    else state.dataset.tone = 'warn';
    steps.hidden = access === 'on';
    step2Text.textContent = access === 'off' ? ONBOARDING_COPY.step2Off : ONBOARDING_COPY.step2Unknown;
  }

  let seq = 0;
  let destroyed = false;
  async function recheck(): Promise<FileAccessState> {
    if (!chromium) return 'unknown';
    const mine = (seq += 1);
    const access = await detectFileAccess(deps.readFileAccess);
    if (!destroyed && mine === seq) paint(access); // a later read wins
    return access;
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
  if (chromium) {
    doc.defaultView?.addEventListener('focus', onFocus);
    doc.addEventListener('visibilitychange', onVisible);
    void recheck();
  }

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
