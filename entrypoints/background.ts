import { defineBackground } from '#imports';

// Minimal background service worker. Peekover makes zero network calls by
// default (AGENTS.md non-negotiable #1), so there are no listeners yet — this
// entrypoint exists to give the extension a valid MV3 background.
export default defineBackground(() => {
  // Intentionally empty for the scaffold.
});
