# GO-LIVE run sheet — Peekover 0.1.0

*One-screen order of `GO-LIVE.md` (the source of truth: its Check / If it fails lines win). Tick boxes there, not here.
Who: **H** human · **A** agent session. ⛔ = point of no return. ⏳ = a wait. Commands in Git Bash, `D:\Dev\peekover`.*

*~~Struck~~ = **DEFERRED**: the Edge Add-ons listing is not part of v0.1.0 (HUMAN RULING 2026-11-11, top of GO-LIVE.md). Skip;
kept for the later Edge submission.*

**0 · Gates (release day, ~30 min, stop on any red)**
- 0.1–0.2 · H · tasks.md: 8.1, 9.1–9.5 ticked; `docs/store/assets/` holds the picks · 2 min · all `[x]`.
- 0.3 · A/H · `git log -1 --format=%h` then `gh run list --branch main --limit 4` · 1 min (+~15 min if a push is
  pending) · CI and Supply chain `completed success` on that hash. Any later commit (this file's too) needs its own green.
- 0.4 · A · `pnpm audit --prod` · 1 min · exit 0.
- 0.5 · A · `pnpm build && pnpm exec wxt build -b firefox && pnpm exec vitest run --project unit tests/extensionSize.test.ts`
  · ~5 min · 4 passed, 0 skipped.

**1 · Accounts (any day before, ~1 h total; ⏳ DNS)**
- 1.1 · H · GitHub 2FA on, recovery codes saved · 10 min.
- 1.2 · H · `git config user.email "93656238+mosuvo@users.noreply.github.com"` · 1 min · `git config user.email` prints it.
- 1.3 · H · GitHub Settings → Pages → Add a domain `peekover.dev` → TXT at DNS → Verify · 10 min ⏳ up to 24 h · verified.
- 1.4 · H · Chrome dev console: agreement, fee, Google 2-Step on · 15 min · **Add new item** shows. Publishing email
  cannot be changed later.
- 1.5 · H · AMO Developer Hub, Mozilla 2FA on · 10 min · **Submit a New Add-on** shows.
- ~~1.6 · H · Edge Partner Center, Individual · 15 min ⏳ verification email · enrolled. Country and type are permanent.~~ DEFERRED.

**2 · Repo public (~15 min)**
- 2.1 · A · `gitleaks git . --log-opts="--all" --report-format json --redact=50` (8.30.1) on the release commit · 5 min · no leaks.
- 2.2 · H · ⛔ **Make public** (Settings → Danger Zone) · 2 min · signed-out window opens the repo. Clones can't be recalled.
- 2.3 · H · Settings → Advanced Security → Private vulnerability reporting → Enable · 1 min · signed out, Advisories shows
  **Report a vulnerability**. Go straight on to 3 (SECURITY.md's privacy URL is dead until then).

**3 · Site (~20 min hands-on; ⏳ DNS + HTTPS up to 24 h each)**
- 3.1 · H · Settings → Pages → Source **GitHub Actions** · 1 min.
- 3.2 · H · `gh workflow run pages.yml --ref main` then `gh run watch` · ~3 min · green, deploy shows a URL.
- 3.3 · H · Custom domain `peekover.dev` → Save · 1 min · survives reload.
- 3.4 · H · DNS: 4 `A` (185.199.108–111.153), 4 `AAAA` (2606:50c0:8000–8003::153), `www` CNAME → `mosuvo.github.io`, no
  wildcard · 10 min ⏳ · `dig peekover.dev +noall +answer -t A` (and `-t AAAA`) lists exactly those.
- 3.5 · H · tick **Enforce HTTPS** ⏳ · `http://` redirects to `https://`, valid cert.
- 3.6 · H · open all 11 rows of GO-LIVE 3.6's table, signed out · 10 min · every row opens, no 404. **No store before this.**

**4 · Email (optional, ⏳ up to 1 h)** · H · mail `hello@peekover.dev` from another account. Arrives → the email edit is an
A task before it appears anywhere; doesn't → nothing changes (AMO email empty, Edge contact = issues URL).

**5 · Release v0.1.0 (~20 min)**
- 5.1 · H · ⛔ `git switch main` · `git pull --ff-only` · `git tag -a v0.1.0 -m "Peekover 0.1.0"` · `git push origin v0.1.0` ·
  1 min · `gh run list --workflow release.yml --limit 1` shows a Release run.
- 5.2 · H · `gh run watch` · ~10 min · 3 jobs green, Attest RAN (not skipped), summary shows `REPRODUCIBLE` + SHA-256s.
- 5.3 · H · `mkdir -p ~/peekover-v0.1.0 && cd ~/peekover-v0.1.0` · `gh release download v0.1.0 --repo mosuvo/peekover` ·
  `sha256sum -c SHA256SUMS` · 2 min · 5 files + SHA256SUMS, every line `OK`, sums = 5.2's.
- 5.4 · H · `for f in *.zip sbom.cdx.json THIRD_PARTY_LICENSES.txt; do gh attestation verify "$f" --repo mosuvo/peekover || echo "FAILED: $f"; done`
  · 2 min · all verify, no `FAILED:`.
- 5.5 · H · ⛔ `gh release edit v0.1.0 --repo mosuvo/peekover --draft=false` · 1 min · signed out, Releases shows 0.1.0.

**6 · Read each dashboard against the files (~10 min, during 7)** · H · 6.1 questions match `chrome.md` / `firefox.md`;
~~6.2 Edge offers "Website content" + the certifications; 6.3 Edge has **Productivity**~~ DEFERRED; 6.4 AMO summary ≤ 250
(only if edited after 2026-11-11). A mismatch on data → stop that store, bring it to A.

**7 · Store submissions (~30 min each; ⏳ review)**
- 7.1 · H · ⛔ Chrome: upload `peekover-0.1.0-chrome.zip`, fields + 5 `chrome-*.png` in order, Privacy tab, **Submit for
  Review** (untick auto-publish to choose the moment) · status pending review · ⏳ a few days, up to weeks.
- 7.2 · H · ⛔ AMO: listed, desktop only, `peekover-0.1.0-firefox.zip`, source **Yes** + `peekover-0.1.0-sources.zip`,
  reviewer note from GO-LIVE 7.2, PRIVACY.md full text, 5 `amo-*.png` + descriptions · confirmation email · ⏳ no timeline.
- ~~7.3 · H · ⛔ Edge: Chrome zip, Public / all markets, fields + 6 `edge-*.png`, **Publish** · in certification ·
  ⏳ up to 7 business days.~~ DEFERRED.

**8 · After approval** · 8.1 H record the 2 listing URLs (Chrome, AMO) · 8.2 A the 2 store links replace "Not in stores
yet", then H re-runs 3.2 · 8.3 H fresh-profile install from Chrome and AMO, restart: guide opens once only · 8.4 A flip the
"planned" lines (one commit, truthPins green; "Edge Add-ons later" stays planned) · 8.5 H review screenshots + AMO
captions. ~~Edge parts of 8.1–8.3~~ DEFERRED.

**9 · Rollback** — GO-LIVE §9. Unpublish per store (Chrome, AMO; ~~Edge~~ DEFERRED); `gh release delete v0.1.0 --repo mosuvo/peekover --yes`; DNS records
off **before** removing the domain or making the repo private.
