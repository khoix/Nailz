# E6 validation — implementation complete

## Scope completed

E6 now implements the arcade-impact and sound layer described in the build plan without changing gameplay resolution or timing:

- pooled hammer trails, contact bursts, dust/sparks, directional glance treatment, block recoil, brief presentation-only hit-stop, restrained camera impulse, one-hit treatment, score celebration, and match confetti;
- layered synthesized whoosh, wood, metal, glance/bend, and finish effects plus a quiet original nonmusical filtered-noise booth ambience;
- a single gesture-created AudioContext, bounded short-effect voices, pause/background suspension, idempotent cleanup, and capability-detected opt-in haptics;
- separate effects/music levels, master mute, reduced motion, saved settings with storage-failure fallback, and a single optional user-supplied music path with cache/decode/retry/fade-in lifecycle;
- no generated, sourced, or bundled placeholder music. MUSIC remains null until the user supplies a track.

## Automated validation

The code-bearing E6 completion checkpoint is 6bdc359 on codex/nailz-arcade-build.

- **49 unit tests pass**, including exact contact/event ownership, fixed-pool effects, reduced motion, one-context audio ownership, 20 pause cycles, 100 contact events, 16-voice overlap cap, retry/corrupt-cache handling, late async disposal, and opt-in haptic dispatch.
- Typecheck and production build pass.
- Production browser coverage now includes the established asset-loading, solo-controls, local-match, and all four solo-difficulty journeys plus audio-settings, three E6 visual-gate modes, and the E6 resource soak.
- visual-normal, visual-muted, and visual-low exercise the real production UI and public pointer controls. Each records/captures booth, targeting, raised hammer, miss, normal hit, glancing hit, perfect/one-hit, rebound, operator reaction, and finish states. Muted mode preserves visual feedback; low quality preserves the required impact hierarchy.
- The visual captures and motion recording were reviewed. The hammer head reaches the nail with the grip facing the human player; misses read as misses, glancing hits visibly bend the nail, the perfect hit resolves flush during rebound, and the operator reaction remains legible. No concrete E6 visual defect was found that warranted another presentation change.
- The production ten-match resource soak uses the real Duel state machine plus production scene/effects/audio ownership paths through a query-gated test fixture. All **10 complete five-nail matches** passed in Chromium 151 / software WebGL / DPR 0.5. Across every match the renderer remained at **106 geometries and 7 textures**, short audio voices returned to **0**, exactly one ambience loop remained owned, and no music source/buffer existed. The scenario completed in about 49 seconds. This is resource-ownership evidence, not phone GPU or memory-performance evidence.
- The first naive public-control ten-match soak was intentionally replaced: software-rendered Chromium needed roughly 4–5 minutes per match, so it hit the scenario watchdog after two matches. The replacement keeps the same production model/scene/effects/audio code paths while avoiding thousands of redundant software-rendered targeting frames. Normal public-control match journeys remain covered separately.

GitHub Actions uploads traces, screenshots, recordings, and JSON reports for each matrix scenario. E6-specific scenarios are reproducible with:

    npm run test:e2e -- audio-settings
    npm run test:e2e -- visual-normal
    npm run test:e2e -- visual-muted
    npm run test:e2e -- visual-low
    npm run test:e2e -- resource-soak

## Resource ownership

Effects reuse one 80-point pool, one ring, one eight-point trail, and one 16×16 soft spark texture; low quality lowers draw counts rather than allocating new systems. Audio owns at most one ambience source, one optional music source, and 16 overlapping short voices. Ended voices disconnect, optional-track failures remain retryable, and disposal releases persistent sources/nodes and decoded-buffer ownership.

The resource-soak fixture is production-built but only mounted when ?soak=1 is explicitly supplied. It is test infrastructure, not part of the player-facing flow. E7 remains responsible for the final Tap-to-Play/title/settings presentation.

## External checks intentionally still pending

These are not represented as automated passes:

- **User-supplied music:** no real track has been provided. Lifecycle behavior is tested with a test-only buffer, but audible integration with the eventual track must be verified after that asset exists.
- **Subjective audio mix:** automated checks establish synchronization/lifecycle, not whether the ambience/SFX balance sounds ideal on real speakers/headphones.
- **Physical Safari/haptics/device performance:** no physical iPhone/Android claim is made here. Those hardware/performance checks remain part of the E8/E9 release-validation scope.

Within the available web/automation scope, **E6 is complete. E7 may begin next.**
