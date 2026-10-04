# Nailz! handoff

## Completed
- **E1 foundation implemented and validated. Next execution: E2 after verifying this commit on origin.**
- Repository: https://github.com/khoix/Nailz — originally empty. Reuse branch `codex/nailz-arcade-build`.
- Pinned TypeScript/Vite/Three.js app; responsive procedural block, nail, and hammer; booth/target/impact camera anchors; visible depth and directional bend.
- Pure strike resolver, explicit application with stale/duplicate guards, straightening, seeded independent random streams, shared human/AI participant types, startup and asset/audio contracts.
- Development-only fixture inspector; production excludes fixture code. This is deliberately not a playable match yet.
- Latest build plan and original proposal stored beside this handoff. User additions: two-player pass-and-play; dynamic preloading/caching Tap to Play title; music supplied later, never generated.

## Architecture / decisions
- Node 24 recommended; >=22.18 supports native TypeScript tests. Versions pinned in package.json and lockfile: Three 0.186.1, types 0.186.0, TypeScript 7.0.2, Vite 8.3.2, Playwright 1.62.1.
- Nail length 1 world unit; setup insertion .16; visible starting length .84. Depth is insertion, not exposed height.
- Hit X/Y normalize by nail-head radius .115. +X = world +X; +Y = world -Z. Top-down camera up is -Z. `getTargetRect()` and `screenToNail()` establish the E2 screen/local boundary; freeze target camera while aiming.
- Power = min(swipe, focus cap). Focus cap ramps .12 to 1, with a reachable perfect plateau at quality >=.98. Center plateau radius .035. Accuracy efficiency falls quadratically toward contact radius 1.65. Contact envelope is an arcade effective radius; E2 must align the moving hammer contact with the stored offset.
- Downward force = usable power × efficiency. Lateral force = remaining usable power for contact only. Bend vector opposes the offset; max magnitude .9 radians. Complete misses neither insert nor bend.
- Fresh perfect capacity is .84. Depth clamps to length; flush epsilon 1e-6. Straightening changes only bend. Strike results include source depth AND strike count, so a miss cannot be applied twice despite unchanged depth.
- E2 must add action IDs and exactly-once contact application in its state machine. Render presentation must not own outcome logic. Current fixture intentionally resolves against a fresh nail every time; gold dot marks original pre-deformation contact location.
- State vocabulary includes mode, participant/controller type, pending strike, pause, and TURN_HANDOFF. E3 implements full pass-and-play; no duplicate human input pipeline.
- Startup state separates readiness, intent, and audio activation. Blocked audio never prevents ready+requested navigation. `MUSIC=null`; loader/cache/audio are contracts only. Implementation remains E4/E6/E7.
- Initial rules are in the plan: randomized first starter; alternate nails; local rematch swaps first starter; timeout uses minimum focus; cancelled swipe preserves aim/focus; same recipient survives handoff interruption; actor owns penalties.

## Important files
- `src/game/{strike,types,tuning,state,random,startup}.ts`
- `src/scene/createScene.ts`, `src/input/coordinates.ts`
- `src/assets/contracts.ts`, `src/audio/contracts.ts`
- `src/dev/{inspector,fixtures}.ts` — dynamically imported only under `import.meta.env.DEV`.
- `tests/*.test.ts`, `tests/browser-smoke.mjs`; README has exact commands.
- `docs/NAILZ-BUILD-PLAN.md`, `docs/NAILZ-PROPOSAL.md`, `docs/ASSETS.md`, `docs/EXECUTION-BUDGET.md`.

## Validation
- `npm run check`: typecheck, 14 tests, and production build passed.
- Tests cover reachable one-hit plateau, caps, monotonicity, all cardinal/diagonal bends, misses, invalid inputs, immutable source state, depth bounds, duplicate miss application, finish ownership, random stream isolation, two-human initialization, CSS coordinate normalization, and startup intent/readiness independent of audio failure.
- `npm run test:browser`: passed in headless Chromium with software WebGL, all three views, fixture results, no page errors, and no horizontal overflow at 390×844, 1280×800, 320×568, 844×390.
- Portrait/target/impact/desktop screenshots visually reviewed. Impact framing pulled back after inspection. Evidence snapshots in `docs/validation/`.
- Production JS excludes fixture labels/inspector logic; production scene intentionally reports E1 foundation.
- Build bundle roughly 537 KB JS / 135 KB gzip, plus small CSS/HTML. Vite emits the expected >500 KB chunk warning; splitting/profiling remains E8, not an E1 blocker.
- This runtime's standard browser archive download failed. Validation used the Chromium binary distributed via @sparticuz/chromium in temporary scratch, not a project dependency. `NAILZ_CHROMIUM_PATH` supports alternate binaries. Normal environments use `npx playwright install chromium`.
- Physical iPhone/Android touch, Safari, thermal performance, and audio behavior remain untested, not inferred from headless checks.

## Known incomplete work
- E2–E9 intentionally unimplemented: real tap/reticle/swipe controls, animated camera/contact sequence, AI duel, matches, operator, polished environment/effects, full UI/title, caching/audio, tuning, mobile performance.
- Current primitive art is an intentional E1 fixture, not the final visual-quality target. Target-view branding contrast and camera composition will change with the E2 gameplay HUD; E4 supplies final art.
- Initial synchronization was blocked by missing shell credentials and automatic review of default-branch initialization. The user supplied an initialized repository on October 4, 2026; its existing main commit is `64f421962c7cf1780bc9a25aa12d1ce0f2671c65`. E1 is being synchronized using the connected GitHub API on the dedicated feature branch based on that commit. Main is preserved. No deployment, PR, or merge is part of this synchronization.

## Next execution
Fetch the feature branch and verify a clean working tree, then run **E2 only**, reading its prompt in the stored build plan. Reuse the resolver and coordinate contracts. First implement the explicit Y -> X -> reticle -> ready -> swing -> contact state flow with timestamped one-thumb input and cancellation guards; then camera/hammer timing and a simple seeded alternating opponent. Use the existing fixture cases to verify that the animated contact and bend explain the same result. End with E2's core-play gate and update this note.
