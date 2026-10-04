# Nailz! handoff

## Completed
- **E2 single-nail duel implemented. Next execution: E3**, after verifying this commit on origin and considering the physical playtest limitation below.
- Reuse `codex/nailz-arcade-build` in https://github.com/khoix/Nailz. E1 was merged by the user into main (`b03505b`); E2 started by fast-forwarding to that identical source tree.
- Full human sequence: Y line -> X line -> one-pass focus -> downward swipe -> animated impact. Same nail alternates between player and seeded operator until a finishing strike. Restart creates a fresh duel.
- Normal app runs the duel; development fixture lab is at `/?lab` and excluded from production.
- Primitive art remains intentional. Full matches/pass-and-play, final character/art/effects, title/preload/cache/music implementations stay in their planned later executions. User supplies music later; no generated music exists.

## Architecture / decisions
- `src/game/duel.ts`: DOM-free single-nail simulation. `tick(seconds)` consumes phase boundaries; a result resolves before the swing and applies once at the .24s contact boundary. Action ID + applied ID and the existing depth/count guard prevent duplicate impacts, including after pause. There are no delayed callbacks to leak into a restarted duel.
- `src/ui/duelUI.ts`: synchronizes the simulation before pointer actions, captures one pointer, consumes one stage per gesture, rejects short double taps, ignores multitouch, and preserves locked aim/focus on cancelled/invalid swipes. Pause, visibility loss, context loss, resize, and restart clear gesture ownership. Resize pauses instead of reinterpreting an in-progress gesture.
- Pause freezes the phase clock; resume has an .8s lead-in. Explicit readiness delays input until the .32s camera movement is finished. Operator aim is .85s; impact feedback .7s; straightening .45s.
- Axis position uses elapsed-time cosine, period 1.8s, range ±1.8 head radii. Reticle makes one 1s inward pass; ideal at 1.5/2.15 seconds, full-focus window ±35ms, then quality falls continuously. Timeout sets zero quality and proceeds without replay.
- `src/input/swipe.ts`: viewport-normalized distance/velocity and path continuity. Valid downward swipe >=3.5% viewport height; full requested power needs >=25% height and >=1.15 viewport heights/second with a straight path. Weak valid swipes count; upward/tiny/horizontal gestures retry the same swing. Reticle cap still bounds requested power.
- `src/scene/createScene.ts`: consumes snapshots only. Camera interpolation, .24s accelerating hammer path, 90ms depth/bend presentation, rebound, and straightening cannot alter simulation outcomes. Target view hides the hammer and remains still during timing stages. Circular striking face radius equals .65 nail-head radii, matching the resolver's 1.65 contact envelope. Aim +Y maps to world -Z.
- Gold/cyan point and moving lines show the selected contact. Operator's sampled aim, quality, and power feed the same resolver; no hidden damage. Its cyan grip distinguishes turns. The human starts this E2 duel; randomized starters/full scoring are E3.
- Existing E1 formulas and startup/asset/audio contracts remain. `MUSIC=null`. No AI character, SFX, music, final title, or cache implementation has been added early.

## Important files / commands
- New: `src/game/duel.ts`, `src/input/swipe.ts`, `src/ui/duelUI.ts`, `tests/duel.test.ts`, `tests/duel-browser.mjs`.
- Extended: scene, app entry, styles, browser fixture test. `README.md` describes controls and tests.
- `npm run check`: typecheck + unit tests + production build.
- `npm run test:browser`: E1 fixture regression at `/?lab`.
- `npm run test:duel-browser`: normal UI input integration with Playwright's controlled clock.
- Browser install: `npx playwright install chromium`; this environment uses a scratch Chromium via `NAILZ_CHROMIUM_PATH` and its colocated software-rendering libraries.

## Validation / evidence
- 23 unit tests pass: E1 invariants plus perfect input sequence, double-tap guard, reticle timeout, freeze/resume/contact uniqueness, operator alternation, frame-rate independence at 30/60/120Hz, restart isolation, and swipe normalization/sampling independence.
- Production build and typecheck pass; JS is about 552KB / 140KB gzip. Existing large-chunk warning remains for E8 profiling.
- Browser integration passed with no page errors: normal pointer-controlled one-hit finish, real touch taps, weak mouse swipe, cancelled pointer, timeout, pause/resume, AI returning control, and landscape pause. E1 three-view/resizing tests still pass.
- Screenshots and a short 10fps gameplay recording in `docs/validation/e2/` document the real UI/camera/swing sequence. Recording uses controlled time; it is visual evidence, not a frame-rate benchmark.
- Core gate: automated controls prove reachable one-hit finish, weaker swipe response, visible bend/straightening, and a complete duel. **Human phone feel/playtesting remains pending**, as do Safari/Android hardware, thermal performance, and true physical touch-swiping. Do not report emulation as physical-device validation. Get those observations before committing to full art if feel defects appear.

## Next execution
E3 only: reuse `Duel`/input/presentation contracts to add five-nail orchestration, starter policy, score attribution, difficulty inputs, and complete two-human pass-and-play handoffs. Avoid a second copy of the human controls. Update the current single-nail controller with a participant/controller boundary rather than branching physics. Preserve pause/gesture guards and exactly-once application. Read E3 in `docs/NAILZ-BUILD-PLAN.md` and the pass-and-play section before implementation.

## Persistence
Shell Git has read access but no push credentials. Use connected GitHub Git Data APIs: upload changed blobs/tree, create commit with the verified branch head as parent, update the same ref without force, fetch, compare tree SHA, and align the local branch only after exact content verification. Do not initialize main or merge by default. Preserve the local checkpoint before aligning API-created commit history.
