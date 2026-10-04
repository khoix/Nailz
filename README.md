# Nailz!

A mobile-first precision hammering arcade game. Solo versus the carnival operator and two-player pass-and-play are planned. **Current milestone: E1 foundation** — a responsive procedural 3D scene and a deterministic strike laboratory, not a playable match yet.

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

Development mode shows **Strike Lab**: choose a fixture, resolve against a fresh nail, switch cameras, straighten, or reset. Production builds exclude the inspector and fixtures. The production view intentionally says that gameplay arrives in the next execution.

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

Read `docs/AI-NAILZ-HANDOFF.md`, then the relevant execution in `docs/NAILZ-BUILD-PLAN.md`. Preserve the same branch. The plan contains the complete scope, visual direction, and acceptance criteria. Full controls, AI turn loop, and animation start in E2; pass-and-play orchestration starts in E3.

## Browser smoke check

```sh
npx playwright install chromium
npm run test:browser
```

The test starts its own loopback Vite server, checks fixtures and camera controls at portrait/landscape/desktop sizes, and writes screenshots into ignored `artifacts/`. `NAILZ_CHROMIUM_PATH` can select an already installed Chromium. Software-rendered headless checks do not replace physical iPhone/Android testing.
