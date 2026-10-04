# Nailz!

A mobile-first precision hammering arcade game. **Current milestone: E3 complete five-nail matches** — solo versus four operator difficulties, or two-player pass-and-play on one phone. Timing controls, animated contact, scoring, rematches, and protected handoffs are playable. Art and menus are still temporary.

## Run

Use Node **24 LTS** (Node >=22.18 also supports the test runner's native TypeScript). Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the address printed by Vite. `npm run dev` exposes the server on your network for physical-phone testing. For environments that restrict network-interface enumeration, use `npm run dev -- --host 127.0.0.1`.

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Development mode at `/?lab` shows **Strike Lab**: choose a fixture, resolve against a fresh nail, switch cameras, straighten, or reset. Production builds exclude the inspector and fixtures. The normal development and production views run complete five-nail matches. Tap to lock the two moving axes, tap when the focus rings match, then swipe downward. Pause and restart are available; turning the device or backgrounding the page pauses the match.

## Architecture

- `src/game/strike.ts`: pure strike resolution, application, and straightening.
- `src/game/types.ts`, `tuning.ts`, `state.ts`: shared participants, finite-state vocabulary, configuration, and initial match data.
- `src/game/random.ts`: reproducible independent PRNG streams.
- `src/input/coordinates.ts`: CSS-pixel to nail-local coordinates.
- `src/scene/createScene.ts`: responsive Three.js scene, three camera anchors, and view-only deformation.
- `src/game/startup.ts`, `src/assets/contracts.ts`, `src/audio/contracts.ts`: startup/readiness, cache/loader, and audio boundaries for later executions.
- `tests/`: native Node tests for gameplay invariants and startup contracts.

Nail-local +X means right; +Y means up in the fixed top-down view, mapping to world -Z. Nail depth is insertion in world units; temporary bend is a direction vector whose magnitude is radians. Rendering never resolves a strike or modifies scores.

Music will be supplied by the user later. `MUSIC` remains null; no generated or substitute music is included. Preloading/cache and Tap to Play contracts exist, but their implementations remain assigned to E4/E6/E7.

## Continue

Read `docs/AI-NAILZ-HANDOFF.md`, then the relevant execution in `docs/NAILZ-BUILD-PLAN.md`. Preserve the same branch. The plan contains the complete scope, visual direction, and acceptance criteria. Match orchestration, four AI input presets, and pass-and-play are implemented. E4 is the carnival environment and lighting pass; do not start it without a new execution request.

## Browser smoke check

```sh
npx playwright install chromium
npm run test:browser
```

The test starts its own loopback Vite server, checks fixtures and camera controls at portrait/landscape/desktop sizes, and writes screenshots into ignored `artifacts/`. `NAILZ_CHROMIUM_PATH` can select an already installed Chromium. Software-rendered headless checks do not replace physical iPhone/Android testing.

E2 integration check: `npm run test:duel-browser` uses normal browser pointer controls with a controlled clock to verify a perfect finish, timeout, pause, cancelled swipe, operator alternation, and rotation. Unit tests cover frame-rate-independent resolution and swipe normalization. Physical-phone comfort and human playtesting remain pending.

## Match rules and local play

Choose **Solo — vs. Operator** with Easy, Normal, Hard, or Champion, or **2 Players — Pass & Play**. Every match plays all five shared nails. The finisher takes the nail; nails won determine the winner. The first starter is randomized, subsequent nail starters alternate, and local rematches swap the first starter.

In local play, each turn waits at a named handoff card. Lift every finger, then the recipient presses and releases **I’m ready**. The ready tap cannot lock aim. Same-person next-nail turns also require readiness. Pause, backgrounding, and rotation preserve the recipient. Difficulty controls apply only to solo; the operator never takes a competitive local turn. Change modes from match results.

`npm run test:match-browser` exercises two complete local matches through real UI pointer actions, interrupted readiness, pause/background/rotation, same-person readiness, rematch starter swap, and returning to solo. `npm run balance` reproduces the seeded report in `docs/validation/e3/`. See `BALANCE.md` there for scoring formulas and known starter effects. Browser emulation and input proxies do not replace a physical two-person phone playtest.

## Production end-to-end tests

```sh
npx playwright install chromium
npm run test:e2e
```

This builds `dist` and serves the production bundle with Vite preview. Browser actions complete every solo difficulty, two local matches, rematch/reset, handoffs, and mode switching; the existing controls regression covers timeout, cancellation, pause, and weak/strong swipes. No game-state injection or debug API is used. A controlled clock makes inputs repeatable. Browser exceptions, console errors, failed requests, and HTTP errors fail the run.

Results, screenshots, and Playwright traces are saved under `artifacts/e2e/`; failures also save the page HTML. Open a trace with `npx playwright show-trace artifacts/e2e/<scenario>/trace.zip`. `.github/workflows/test.yml` runs unit tests and production E2E on pushes and pull requests, retaining artifacts for seven days. The individual `test:duel-browser` and `test:match-browser` commands still use the development server for fast diagnosis.

`NAILZ_CHROMIUM_PATH` selects an installed browser. Optional `NAILZ_BROWSER_DPR` changes rendering pixel density (default 1) without changing the 390×844 CSS-pixel phone viewport or input rules. Test outcomes are browser automation results, not physical phone certification.

Browser E2E uses Chromium’s full new-headless channel rather than the separate headless-shell binary. Traces retain DOM snapshots, actions, and sources; continuous trace screencasting is disabled to avoid competing with explicit WebGL screenshots while the controlled game clock is paused. Scenario screenshots and failure screenshots remain enabled. Result JSON records the actual browser version, channel, and pixel density.

Explicit screenshots use Chromium’s DevTools `Page.captureScreenshot` with `fromSurface: false` to capture the browser view without requesting a new off-screen surface under the paused clock. Capture still has a 20-second limit and fails the scenario on error; each capture explicitly advances the controlled clock by 32ms (two render frames) so Chromium can complete WebGL composition. It never resumes wall-clock time or loops until an assertion passes. Captures occur after input locks or on result/handoff screens.
