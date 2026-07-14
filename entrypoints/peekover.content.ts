import { defineContentScript } from '#imports';
import { isRenderableContext } from '@/src/detect/isRenderableContext';

// Peekover content script. The manifest `matches` below are a COARSE, host-level
// gate (they decide where the browser injects at all); `isRenderableContext` is
// the authoritative in-script gate that narrows to actual markdown resources.
// Every pattern here is justified in docs/trust/PERMISSIONS.md (AGENTS.md #4).
//
// This milestone (task 2.2) mounts only a minimal "hello-shell" marker so we can
// verify injection in Chrome and Firefox. It does NOT hide the raw text or render
// markdown yet — that is the pipeline/mount milestone (tasks 3.x).

const HOST_TAG = 'peekover-hello';

/**
 * Mount a Shadow-DOM marker in the page corner. Shadow DOM keeps page styles from
 * leaking in and our styles from leaking out. Idempotent: a second call is a no-op.
 */
function mountHelloShell(): void {
  if (document.querySelector(HOST_TAG)) return;

  const host = document.createElement(HOST_TAG);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
    }
    .pill {
      font: 500 13px/1.4 system-ui, -apple-system, Segoe UI, sans-serif;
      color: #16171F;
      background: #FDFBF7;
      border: 1px solid rgba(22, 23, 31, 0.15);
      border-radius: 999px;
      padding: 6px 12px;
      box-shadow: 0 2px 8px rgba(22, 23, 31, 0.18);
      white-space: nowrap;
    }
  `;

  const pill = document.createElement('div');
  pill.className = 'pill';
  pill.textContent = 'Peekover — markdown detected';

  shadow.append(style, pill);
  (document.body ?? document.documentElement).append(host);
}

export default defineContentScript({
  matches: [
    // (a) Local markdown files opened via file:// — one pattern per extension.
    'file:///*.md',
    'file:///*.mkd',
    'file:///*.mdx',
    'file:///*.markdown',
    'file:///*.mdown',
    'file:///*.mkdn',
    'file:///*.mdwn',
    'file:///*.mdtxt',
    'file:///*.mdtext',
    // (b) Named raw-content hosts (exact host).
    'https://raw.githubusercontent.com/*',
    'https://gist.githubusercontent.com/*',
    // (b) Path-scoped raw views so we do not inject across the whole site.
    'https://gitlab.com/*/-/raw/*',
    'https://bitbucket.org/*/raw/*',
  ],
  runAt: 'document_idle',
  main() {
    // Authoritative gate: on any non-markdown context, do literally nothing.
    if (!isRenderableContext(location.href)) return;
    mountHelloShell();
  },
});
