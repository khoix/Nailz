# Nailz! handoff

## Checkpoint
- **E3 implemented. Next execution: E4 only**, after verifying origin and reading the human playtest limitation below.
- Repository: https://github.com/khoix/Nailz, branch `codex/nailz-arcade-build`. E3 starts from E2 commit `e3f77ea4efcc8b0f14921dce3163784c8d02fbec`.
- Complete five-nail matches in Solo — vs. Operator and 2 Players — Pass & Play. Random first starter, alternating nail starters, all five nails even after an early clinch, round/match results, scoring, rematch, and mode selection outside matches.
- Local rematches swap the first starter. Both participants use E2's existing Y/X/focus/swipe pipeline and identical timing. The operator has no competitive local turns. Existing primitive scene remains temporary; operator character/host art comes later.
- User supplies music later. No music was generated or substituted. Dynamic Tap to Play, preload/cache, gesture-initiated audio, final art, and menu polish remain in their planned executions.

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
- `npm run check`: typecheck, 31 unit tests, production build. Includes complete solo matches at every difficulty, complete local matches, all-five-round enforcement, same-person next-nail readiness, pause freezes, identical local difficulty behavior, score ownership, point/nail priority, exactly-once awards, rematch reset/swap, seeded inputs, and E1/E2 strike/input regressions.
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

## CI screenshot correction
The initial push/PR workflows (37224577424 / 37224578280) passed installation, all 31 unit tests, and the production build, then timed out in explicit screenshots inside `solo-controls` (different capture points). Local verification had used Chromium 153; Actions used Playwright’s Chromium 151 headless-shell. The harness now selects the full Chromium new-headless channel and disables continuous trace screencasting while retaining DOM/action/source traces and every explicit screenshot/assertion. Result JSON records the actual browser version/channel/DPR. The first channel/trace change alone still failed in hosted Chromium 151. Explicit screenshots now use the CDP browser-view capture path (`fromSurface: false`) instead of Playwright’s default surface capture; CDP view capture alone also stalled on CI, so each capture now explicitly supplies 32ms (two render frames) through the controlled clock. A 20-second capture failure still fails the scenario; wall-clock time is never resumed. Captures occur after locks or on readiness/results, and all existing gameplay assertions remain. Screenshot timeouts and gameplay assertions have not been relaxed. Verify the newest hosted run before calling CI fixed.

## E4 starting point
Read E4 in `docs/NAILZ-BUILD-PLAN.md`: carnival environment and lighting. Preserve the tested match/input/physics contracts, target-camera stability, readable handoff cards, named identities, and exact shared-nail scoring. Do not begin E4 automatically. The current scene is primitive and should not be represented as the final stunning arcade art.

## Persistence
Shell Git has read access but no push credentials. Use connected GitHub Git Data APIs on this feature branch: upload changed blobs/tree, create a commit with the verified branch head as parent, update the same ref without force, fetch, compare tree SHA, and align local history only after exact content verification. Preserve the local checkpoint before aligning API-created history. Do not initialize main, merge, or deploy by default.
