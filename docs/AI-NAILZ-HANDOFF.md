# Nailz! handoff

## Checkpoint
- **E4 implemented and saved; full production E2E gate remains incomplete within the 20-minute budget. Continue E4 validation before E5.**
- Repository: https://github.com/khoix/Nailz, branch `codex/nailz-arcade-build`. E4 starts from green CI commit `9c6da914eab23927535aa520eea41bb2c8637500`. PR #2 was merged externally before E4; continue the same feature branch.
- Complete five-nail matches in Solo — vs. Operator and 2 Players — Pass & Play. Random first starter, alternating nail starters, all five nails even after an early clinch, round/match results, scoring, rematch, and mode selection outside matches.
- Local rematches swap the first starter. Both participants use E2's existing Y/X/focus/swipe pipeline and identical timing. The operator has no competitive local turns. Carnival scenery and hero props are now authored; operator character/host art comes in E5.
- User supplies music later. No music was generated or substituted. Preload/cache and render preparation are implemented. Dynamic Tap to Play, gesture-initiated audio, operator animation, effects, and menu polish remain in E5–E7.

## Architecture and rules
- `src/game/duel.ts` remains the single DOM-free state machine. Participant controller type replaces hardcoded player-side checks. `advanceRound()` resets the nail and picks the alternating starter; the fifth result leads to MATCH_RESULT. There are no delayed AI callbacks to survive restart or mode changes.
- All results resolve through `strike.ts` and apply once at the contact boundary using action IDs plus the resolver's stale-result guard. Nails won determine the match winner; secondary points never override it.
- Secondary points: rounded depth delta × 100, +100 finishing, +50 one-hit, −10 complete miss or −5 contact bend above .08 radians. Each actor owns only their own strike's awards/penalties. Negative totals are allowed. Details and rationale in `docs/validation/e3/BALANCE.md`.
- Local turns enter NAIL_SETUP then TURN_HANDOFF. `ready()` consumes readiness and begins a fresh .4s setup lead-in before Y aiming. Handoff clocks are frozen indefinitely. First turn says who starts; different-person turns say Pass to Player N; same-person next-nail starts say Player N — Next nail.
- `duelUI.ts` tracks pointers on controls and gameplay. Readiness needs a new down/up on the ready control with no other active pointer. Old fingers, multitouch, cancelled presses, and gestures crossing phase boundaries cannot aim or ready. Lost pointer capture cancels gesture ownership without treating a held finger as released. The keyboard can activate Ready only with no active pointer.
- Pause/background/rotation/context loss clear pending gestures and preserve the intended recipient. Resume has E2's .8s countdown and never auto-readies a handoff. Rotation immediately renders the pause card.
- Mode selection is on the initial screen and reachable again from match results. Starting a different mode creates a fresh Duel and resets pending input/AI state. Optional player names, saved records, tutorial, final title, and settings remain E7.
- Temporary HUD shows named participants, nail count, points, and nail-depth progress. Scene uses controller type to show AI markers, so Player 2 receives normal human aim controls.

## AI and balance
- `src/game/ai.ts`: Easy/Normal/Hard/Champion use symmetric triangular X/Y error, uniform bounded focus/power, and a reachable perfect-input component. Presets never inspect score/depth/opponent and never multiply damage.
- Error scales: 1.8 / .95 / .5 / .22. Minimum focus: .3 / .45 / .7 / .86. Minimum requested power: .4 / .55 / .75 / .9. Perfect-input probabilities: .001 / .006 / .025 / .22.
- `npm run balance` reproduces `docs/validation/e3/balance.json`: 20,000 fresh-nail samples and 2,000 full matches per preset, seed 20261004. A fixed Normal sampler is the simulated human; this is not empirical human performance.
- Simulated operator match wins: 17.05%, 49.45%, 64.35%, 70.70%. Mean strikes per match: 24.53, 18.02, 13.60, 10.15. Champion fresh-nail one-hit rate: 21.81%.
- Known risk: strong partial strikes can donate an easy finish. Champion win rate differs substantially by first starter (60.2% when operator starts, 81.2% when proxy human starts). Initial 8% perfect-input Champion was weaker than Hard; 22% gives useful model separation. Do not add hidden comeback/depth-aware damage to obscure this. Human playtests must decide whether Champion one-hit frequency and match pacing feel right.

## Validation
- E3 baseline: `npm run check`: typecheck, 31 unit tests, production build. Includes complete solo matches at every difficulty, complete local matches, all-five-round enforcement, same-person next-nail readiness, pause freezes, identical local difficulty behavior, score ownership, point/nail priority, exactly-once awards, rematch reset/swap, seeded inputs, and E1/E2 strike/input regressions.
- `npm run test:duel-browser`: preserved E2 controls coverage with E3 round transitions. Perfect pointer finish, actual touch taps, reticle timeout, cancelled swipe, weak swipe, solo operator return, and rotation.
- `npm run test:match-browser`: normal UI pointer controls for two full local matches, old-finger readiness blocking, cancelled ready, pause/background/rotation, ready tap consumption, same-person next-nail label, no automatic local strike, rematch swap, score ownership, and mode switch back to solo.
- `npm run test:browser`: existing E1 fixture regression; unchanged script.
- E3 screenshots were selected into `docs/validation/e3/`. Current individual browser checks write to `artifacts/browser/<scenario>/`; production E2E writes to `artifacts/e2e/<scenario>/`. Controlled-clock screenshots are visual/behavior evidence, not frame-rate benchmarks.
- Software-rendered Chromium is available in this workspace via `NAILZ_CHROMIUM_PATH=/workspace/scratch/2da0bc65e702/nailz-qa/chromium` and `LD_LIBRARY_PATH=/workspace/scratch/2da0bc65e702/nailz-qa`. Tests start their own loopback Vite server. Standard environments can use Playwright's installed Chromium.
- **Physical iPhone/Android, Safari, human fun/comfort, and two-person phone passing remain untested.** Automated matches do not establish the human quality gate. Gather physical observations before committing to final art if input feel issues appear.
- Existing bundle-size warning remains (~558KB JS /142KB gzip); optimization is E8, not grounds for broad premature refactoring.

## Production E2E follow-up requested by user
- `npm run test:e2e` builds production assets and executes the real UI against Vite preview. The existing development browser scenarios are reused through `tests/browser-harness.mjs`; `tests/solo-matches-browser.mjs` adds complete five-nail solo journeys for all four difficulties, including score ownership, correct winner, and rematch reset.
- `tests/e2e.mjs` orchestrates the suite and writes a summary. Each scenario records a Playwright trace and JSON result; failure includes a screenshot and page HTML. The harness rejects runtime/console/network/HTTP errors.
- `.github/workflows/test.yml` runs unit tests and production E2E on push/PR with read-only repository permissions and uploads artifacts. Local execution does not imply that the hosted GitHub Actions job has run.
- Every later implementation checkpoint must include production E2E; expand the journeys as title/cache/audio/tutorial/settings become available. This follow-up adds testing infrastructure, not E4 art.

- Follow-up result: all six production E2E scenarios passed on Chromium 153 (software rendered, DPR .5), including four complete solo matches and two complete local matches. All 31 unit tests passed. Checked-in report: `docs/validation/e3/production-e2e.json`. Raw traces/screenshots remain in `artifacts/e2e/`; CI uploads equivalent artifacts on future runs.

## E4 environment / loading
- `src/scene/environment.ts`: enamel counter, scalloped striped canopy, dimensional illuminated marquee, sculpted bear prizes, layered booths/pennants/wheel, restrained prize sway (paused/reduced-motion aware). Static meshes batch by material; bulbs and hero surface details instance.
- `src/scene/createScene.ts`: lathed block and bevelled nail head, rounded hammer with wrapped grip, original versioned end-grain texture, warm/cool/rim lighting and PMREM reflections. Shared-nail scale, fixed target camera, hit radius, contact pivot, and strike timing are preserved. Booth framing now includes the sign.
- `src/assets/manifest.ts` + `loader.ts`: versioned required textures, cache/MIME/status validation, session reuse, failed-image invalidation/retry, storage/quota fallback, and retirement of only old Nailz caches after readiness. `main.ts` decodes textures, prepares three view paths in separate tasks, then mounts the normal UI. It is a simple loading UI; E7 still owns intent/audio title choreography.
- Source/license/bytes/settings/ownership: `docs/ASSET-MANIFEST.md`. Scene disposes geometry/materials/shadows/PMREM; startup owns decoded textures and loader memory. No music added or requested.
- High is default; `?quality=low` removes dynamic shadows/distant scenery and caps DPR at 1. `setQuality()` is the later menu integration hook. High caps DPR at 1.75. No gameplay timing changes.
- 390×844 and 844×390 booth/target/impact captures and rendering baseline: `docs/validation/e4/`. Measured sample: 109 calls, 46,248 triangles; 1.2ms median /1.9ms p95 CPU submission on software Chromium. Not phone GPU performance.
- `npm run test:environment` checks visual fixtures and records the 60-frame profile. `tests/loading-browser.mjs` is added to production E2E: cold/warm starts, obsolete-cache cleanup, corrupt-cache recovery, decode retry, denied storage and low tier. Five new unit tests cover HTTP failure/retry, version changes, quota/storage denial, bad cache, optional failure and abort (36 total).

## CI baseline
Previous screenshot-timeout repairs are retained: full Chromium, DPR .5 in CI, 60-second explicit screenshot timeout, normal 20-second actions, source/DOM traces without screencasting, favicon served, and auto-wait for native rotation. Both push and PR workflows passed on the E3 CI-fix commit (runs 37226547421 and 37226551098). E4 adds visual cost and loading coverage; inspect its new run separately, never infer it passed from E3.

## Resume E4 validation, then E5
Latest changes include a CSS-only HUD contrast repair (targeted browser capture passed) and moving the controlled-clock pause before navigation, avoiding slow startup advancing past the test timestamp (targeted startup/aim check passed). All 36 unit tests, typecheck/build, six environment views, loader E2E, solo-controls E2E, and both local matches passed. The four-difficulty full solo run was still pending at save cutoff; do not count old E3 artifact results as E4. Run the complete production suite and inspect the new GitHub run. After E4 regression validation passes, read E5 in `docs/NAILZ-BUILD-PLAN.md`: expressive operator and polished physical animation. Reuse the finished booth, cache/preparation pipeline, original hit geometry, match/input/physics contracts, and stable target camera. Keep E6 impact VFX/audio and E7 final title/menu work separate. Physical-device and two-person feel validation remain pending; the new PMREM environment's context-loss recovery needs E8 testing. Do not begin E5 automatically.

## Persistence
Shell Git has read access but no push credentials. Use connected GitHub Git Data APIs on this feature branch: upload changed blobs/tree, create a commit with the verified branch head as parent, update the same ref without force, fetch, compare tree SHA, and align local history only after exact content verification. Preserve the local checkpoint before aligning API-created history. Do not initialize main, merge, or deploy by default.
