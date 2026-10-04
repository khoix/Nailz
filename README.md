# Nailz!

A mobile-first precision hammering arcade game. Solo versus the carnival operator and two-player pass-and-play are planned. **Current milestone: E2 single-nail duel** — playable timing, swipe input, animated contact, and an alternating computer opponent. Five-nail matches and pass-and-play orchestration arrive in E3.

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

Development mode at `/?lab` shows **Strike Lab**: choose a fixture, resolve against a fresh nail, switch cameras, straighten, or reset. Production builds exclude the inspector and fixtures. The normal development and production views run the single-nail duel. Tap to lock the two moving axes, tap when the focus rings match, then swipe downward. Pause and restart are available; turning the device or backgrounding the page pauses the duel.

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

Read `docs/AI-NAILZ-HANDOFF.md`, then the relevant execution in `docs/NAILZ-BUILD-PLAN.md`. Preserve the same branch. The plan contains the complete scope, visual direction, and acceptance criteria. Single-nail controls, AI turn loop, and basic animation are implemented. Pass-and-play and full match orchestration start in E3.

## Browser smoke check

```sh
npx playwright install chromium
npm run test:browser
```

The test starts its own loopback Vite server, checks fixtures and camera controls at portrait/landscape/desktop sizes, and writes screenshots into ignored `artifacts/`. `NAILZ_CHROMIUM_PATH` can select an already installed Chromium. Software-rendered headless checks do not replace physical iPhone/Android testing.

E2 integration check: `npm run test:duel-browser` uses normal browser pointer controls with a controlled clock to verify a perfect finish, timeout, pause, cancelled swipe, operator alternation, and rotation. Unit tests cover frame-rate-independent resolution and swipe normalization. Physical-phone comfort and human playtesting remain pending.
