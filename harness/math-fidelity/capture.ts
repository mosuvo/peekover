// capture.ts — captures the fidelity harness (index.html) in real Chromium AND real Firefox,
// committing the screenshots as staged evidence for the deferred human milestone-close walk
// (decisions.md's 2026-09-07 "M11 1.2-R SEQUENCING DEVIATION" entry). This script renders NO
// verdict — it only saves what each engine actually painted.
//
// Uses the `playwright` package directly (already a devDependency for vitest's browser project —
// no new dependency), not vitest: this is a one-off capture utility, not a test.
//
// Run: npx tsx harness/math-fidelity/capture.ts
import { chromium, firefox, type Browser } from 'playwright';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const HARNESS_PATH = path.join(HERE, 'index.html');
const OUT_DIR = path.join(HERE, 'screenshots');

async function capture(name: string, launch: () => Promise<Browser>): Promise<void> {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto(pathToFileURL(HARNESS_PATH).href, { waitUntil: 'load' });
    await page.waitForSelector('body[data-harness-ready]', { timeout: 20_000 });
    const readyState = await page.getAttribute('body', 'data-harness-ready');
    if (readyState !== 'true') {
      throw new Error(`harness reported data-harness-ready="${readyState}", not "true"`);
    }
    // Let any final layout after the font swap settle before painting.
    await page.waitForTimeout(200);

    mkdirSync(OUT_DIR, { recursive: true });
    const outPath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });

    // Fact-only observation (no fidelity verdict): count of temml-error spans this engine actually
    // rendered — 0 means every corpus formula parsed without throwing on this engine, real signal
    // to accompany the screenshot, not a substitute for the human's own visual judgment.
    const errorSpanCount = await page.evaluate(() => {
      const hostEl = document.getElementById('host');
      const root = hostEl && hostEl.shadowRoot;
      if (!root) return -1;
      return root.querySelectorAll('.harness-math-block [style*="color"], .harness-math-inline [style*="color"]')
        .length;
    });
    console.log(
      `[${name}] captured -> ${outPath}` +
        ` | temml-error spans: ${errorSpanCount}` +
        ` | console errors: ${consoleErrors.length}` +
        (consoleErrors.length ? ` (${consoleErrors.slice(0, 3).join(' | ')})` : ''),
    );
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  await capture('chromium', () => chromium.launch({ headless: true }));
  await capture('firefox', () => firefox.launch({ headless: true }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
