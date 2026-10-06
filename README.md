# Nailz!

A mobile-first precision hammering arcade game. **Current milestone: E7 interface and onboarding (in progress)** — solo versus four operator difficulties, or two-player pass-and-play on one phone. Timing controls, animated contact, scoring, rematches, protected handoffs, the booth and hero props, the articulated operator, impact effects, and gesture audio are implemented. The Tap to Play title flow is complete; final menus, names, tutorial, records, and HUD polish are still being built.

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

Music will be supplied by the user later. `MUSIC` remains null; no generated or substitute music is included. Versioned preloading, cache fallback, retry, and render preparation are implemented. Gesture audio is implemented; the final Tap to Play presentation remains E7.

## Continue

Read `docs/AI-NAILZ-HANDOFF.md`, then the relevant execution in `docs/NAILZ-BUILD-PLAN.md`. Preserve the same branch (`fable51/nailz-arcade-build` for E7). The plan contains the complete scope, visual direction, and acceptance criteria. E7 (interface and onboarding) is in progress: the Tap to Play title flow is complete; see the handoff for the remaining ordered work. Verify the current CI gate before continuing.

The title button is live while assets load: an early tap records intent and activates audio, shows **Getting ready…**, and enters mode selection automatically once; a late tap or keyboard activation enters once. Loading completion never enters or plays sound by itself. `npm run test:e2e -- title-flow` covers this in production.

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

CI runs eight independent browser jobs: `audio-settings`, `asset-loading`, `solo-controls`, `local-matches`, `solo-easy`, `solo-normal`, `solo-hard`, and `solo-champion`. Each keeps the ten-minute scenario watchdog and uploads its own artifacts; a failed job does not cancel the others. This gives each complete solo journey its own budget on software-rendered runners. Run one production scenario locally with, for example, `npm run test:e2e -- solo-hard`; omit the argument to run all eight sequentially. Logs include scenario and completed-nail progress, and watchdog termination is explicitly recorded in the summary.

`NAILZ_CHROMIUM_PATH` selects an installed browser. Optional `NAILZ_BROWSER_DPR` changes rendering pixel density (default 1) without changing the 390×844 CSS-pixel phone viewport or input rules. Test outcomes are browser automation results, not physical phone certification.

GitHub Actions uses full headless Chromium with software WebGL at DPR 0.5; the phone viewport and all input coordinates remain 390×844 CSS pixels. This reduces rendering cost on CPU-only runners without changing gameplay. Screenshots get a separate 60-second readback timeout; UI action/assertion limits remain 20 seconds. No screenshot failures are ignored, and screenshot capture never advances the controlled clock. Traces retain DOM snapshots, actions, and sources without continuous video capture. Results record browser version/channel and pixel density.

## Environment and loading

See `docs/ASSET-MANIFEST.md` for asset provenance, cache/version rules, rendering settings, and disposal ownership. `?quality=low` selects the basic low tier; the default high tier caps DPR at 1.75. `npm run test:environment` captures booth, target, and impact views at portrait and landscape sizes and profiles CPU render submission in the development inspector.

Production E2E also verifies cold/warm cache loading, old-cache retirement, corrupted-cache refetch, failed-image retry, and denied-storage fallback. Node tests cover HTTP failures, version changes, optional failures, and aborts.

## Operator and motion

The host has nine sampled poses, an articulated hammer grip, player-hit reactions, and host-only behavior in local play. Contact timing and scoring remain simulation-owned. `npm run test:operator` inspects pose alignment, pause/reset cleanup, near-flush/glancing contact, and camera views through the development inspector. See `docs/validation/e5/README.md` for timing and captures.

## E6 impact/audio checkpoint
Strikes now drive pooled trails, impact rings/dust, glance bursts, recoil, restrained camera impulses, and match confetti. Sound starts from a user gesture. Use the header Sound button or pause settings for mute, effects/music levels, reduced motion, and opt-in supported haptics. User music remains absent by default; configure its URL/version/gain/loop in `src/audio/config.ts` later. A quiet procedural nonmusical ambience loop shares the effects controls. Optional music retries failed downloads/decodes on a later gesture and stays suspended while paused. Full E6 audiovisual and device validation remain pending; see the handoff.

Optional motion evidence: `NAILZ_RECORD_VIDEO=1 NAILZ_E2E=1 node tests/impact-motion-browser.mjs normal` records the actual pointer-driven one-hit journey (Playwright FFmpeg required). Repeat with `muted` and `low`; artifacts go under `artifacts/e2e/impact-motion-<mode>/`. The game clock advances deterministically, so these recordings demonstrate ordering/poses, not real-time phone frame rate. Video capture remains opt-in to avoid competing with normal software-rendered CI screenshots.
