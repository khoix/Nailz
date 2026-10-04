# Nailz! — Game Build Plan

Prepared October 4, 2026; updated to include two-player pass-and-play and a dynamic asset-loading title screen. Music will be supplied by the user later. Based on `Nailz-game-proposal(1).md` and `Multi-Execution-Task-Planning-Convention.md`.

## Outcome

Build a polished, mobile-first 3D arcade game: one player challenges a charismatic carnival operator, or two people pass the same phone between turns. Players line up each hammer strike and compete to finish five shared nails. The defining image is an oversized hammer driving a gleaming nail into a chunky wooden block amid a beautifully lit night-market booth.

The presentation should feel like a premium arcade game: sculpted shapes, rich materials, theatrical lighting, expressive animation, and explosive but readable impacts. Simple geometry is a production technique, not permission to ship a primitive-looking scene.

This plan contains **nine executions**. Core controls, match rules, environment art, character animation, impact presentation, interface, performance, and release validation are separate milestones because each needs implementation and review. Combining the art and effects work into one final “polish” session would put the requested visual quality at risk.

## Execution summary

Settings below use the supplied Astra convention; they are recommendations if Astra executes the work. The executing agent and repository have not been assigned.

| Execution | Reviewable outcome | Setting |
|---|---|---|
| E1 | Running 3D foundation and deterministic strike model | High |
| E2 | Complete playable single-nail duel | Extra High |
| E3 | Five-nail matches, pass-and-play handoffs, fair AI, and scoring | High |
| E4 | Finished carnival environment and lighting | High |
| E5 | Expressive operator and polished physical animation | High |
| E6 | Arcade impact effects, sound, and supported haptics | High |
| E7 | Dynamic Tap to Play title, loading/audio integration, menus, and HUD | High |
| E8 | Mobile performance, compatibility, and recovery | High |
| E9 | Final integration, regression repair, and release handoff | High |

## 1. Scope and non-negotiable mechanics

The required release contains one excellent booth, one polished operator, one hammer, solo mode with four AI difficulty presets, two-player local pass-and-play, a dynamic Tap to Play title screen with asset preloading/caching and gesture-initiated audio, complete five-nail matches, a brief tutorial, local personal bests, settings, and responsive mobile/desktop controls. No backend is needed for this scope. Music playback must be ready for a user-supplied track, but delivery of that track is not a build-completion prerequisite. Do not generate, compose, source, or bundle substitute music.

- Each nail is shared. Turns alternate, and the finishing striker wins it.
- Play all five nails, even if the winner is already mathematically decided. Show the full match score.
- Preserve the sequence: stop horizontal line moving vertically → stop vertical line moving horizontally → stop one shrinking reticle → swipe downward → impact.
- The reticle makes one inward pass. It establishes a power ceiling; it does not replace swipe strength.
- Actual power is the lesser of requested swipe power and reticle power cap.
- Centering determines useful downward force. Off-center hits waste force and bend the nail away from the impact side.
- A theoretically perfect strike can finish a fresh nail in one blow. This must be reachable with real controls, not only a test fixture.
- The operator straightens a bent nail before the next strike without restoring lost depth. A finishing hit transitions directly to the round result.
- Both human players and the solo-mode operator use the same strike resolver. AI difficulty changes input distributions, never hidden damage multipliers or remaining depth.
- Nail depth is the primary progress display. Nails won determine the match winner; secondary points never overturn it.
- Keep gameplay deterministic once strike inputs are known. Animation, frame rate, particles, and sound cannot change outcomes.

Optional later work: alternate booths, hammer cosmetics, tournaments, achievements, online rankings, networked multiplayer, and installable/offline behavior. These are outside the nine-execution release. Do not add accounts, monetization, or a progression economy.

### Two-player pass-and-play mode

Add **Solo — vs. Operator** and **2 Players — Pass & Play** to mode selection. Two-player mode uses one phone, the same five shared nails, the same complete targeting/swipe sequence for both people, and separate scores. Default identities are Player 1 and Player 2; optional short display names are local to the match. Always pair each identity color with its name or number.

The carnival operator remains the host: sets up and straightens nails, watches, and reacts to both players. The operator never takes a competitive strike or receives points in this mode. Both humans use the same first-person hammer/camera presentation, keeping the phone upright; no second avatar or split-screen is required.

**Turn handoff:**

1. Finish the current strike animation and show its result. Preserve the shared nail's depth; straighten it if needed. For a nail win, complete the round result and next-nail setup first.
2. Determine the next striker from match state. If control changes to the other human, show a large **Pass to Player 2** (or their name) card with **I'm ready**. The card waits indefinitely; targeting clocks and gameplay input are inactive.
3. Ignore gameplay touches while the card is visible. Require all previous touches to end before accepting a fresh press-and-release on **I'm ready**. Consume that gesture completely so it cannot also lock the first aiming line.
4. Start targeting only after readiness confirmation and a brief visual lead-in. Show the active player's name throughout their turn.

Show a ready card before the first turn too. If the next nail starts with the same person who just finished, show **Player 1 — Next nail** with readiness confirmation, rather than incorrectly telling them to pass the phone. No handoff follows the final nail; show the match result.

Use the existing randomized first starter and alternating nail starters for both modes. For a same-mode two-player rematch, swap the first-nail starter to share the extra starting opportunity across consecutive five-nail matches. Both people get identical timing windows, swipe normalization, and power rules; solo AI difficulty does not affect local play. Use the standard Normal human timing configuration for both local players.

Pause/background/resume, orientation changes, and interrupted touches must preserve the intended recipient. A handoff screen must never auto-ready on resume. Mode changes happen outside an active match and reset participants, pending gestures, and AI work. Keep local two-player records separate from solo difficulty-based personal bests; names do not imply user accounts.

Implement the complete functional mode and handoff in E3, then polish its UI in E7. Reuse the same turn controller and input loop rather than duplicating gameplay. This fits the existing nine executions because it extends match orchestration and requires no networking or second-device synchronization.

## 2. Visual direction: electric night carnival

### Composition and materials

Use deep indigo surroundings with warm amber booth lights, coral-red painted trim, and restrained cyan accents. The wooden block and nail occupy the brightest, clearest part of the composition. Surrounding prizes, canopy folds, and hanging lights frame the action instead of competing with it.

- **Hero block:** thick, bevelled wood; visible end grain; chipped edges; old hammer marks; warm roughness variation. Use subtle local impact marks within a round.
- **Hammer:** exaggerated silhouette, weighted metal head, readable bevel highlights, a worn grip, and a deliberate raised pose. It should look satisfying to swing in a still image.
- **Nail:** broad readable head, controlled metallic highlights, a visible shaft, and bend deformation anchored at the wood surface. Avoid glare that hides the target center.
- **Booth:** enamel-painted counter, striped fabric canopy, dimensional Nailz! sign, hanging plush prizes, and a few gently animated decorations.
- **Background:** simplified festival silhouettes, soft pools of light, and depth through layered geometry. Spend detail near the block, not on distant crowds.
- **Operator:** appealing stylized proportions, strong eyebrows and hands, an apron, and a friendly competitive personality. Personality comes from poses and reactions, not caricature.

The main scene is real 3D. Raster art can support textures or signage, but cannot substitute for the hammer, nail, operator, or their animation. Use original assets or assets with recorded reuse permissions; keep an asset manifest with source, license, modifications, and file location. If suitable authored assets are unavailable, create deliberately sculpted procedural meshes with bevels and coordinated materials. Bare boxes and cylinders remain prototype assets.

### Lighting and rendering

Start with one warm key light, cool fill, and a restrained rim highlight. Give the block, hammer, and operator convincing contact shadows. Use baked or inexpensive ambient shading for static scenery, plus limited dynamic shadows near the action. Establish correct color handling before tuning exposure.

Bloom is for selected bright accents, never a fog over the entire image. Keep targeting crisp and free of depth blur, shake, and action effects. Prefer composition, material contrast, and animation over expensive full-screen effects. Quality tiers may reduce particles, shadows, bloom, and render resolution; they must preserve hero silhouettes, contact readability, and input timing.

### Arcade action language

| Moment | Animation and effects | Readability constraint |
|---|---|---|
| Axis lock | Crisp snap, small tick burst, short audio click | Locked position remains obvious |
| Perfect focus | Reticle contracts into a bright ring, brief rising chime | Do not move the chosen hit point |
| Swing | Strong anticipation, accelerating hammer arc, short curved trail | Trail follows the actual hammer path |
| Centered hit | Tight contact burst, wood dust, block compression/recoil | Show where the hammer landed |
| Glancing hit | Sideways streak, metal scrape, asymmetric nail bend | Bend visibly goes away from the struck side |
| Powerful incomplete hit | Heavy thump, small shock ring, restrained shake | Exposed nail length remains visible afterward |
| One-hit finish | Strongest burst, short hit-stop, gold accents, “ONE HIT!” | Maximum spectacle is reserved for this result |
| Nail win | Nail-shaped score marker stamps into place, brief operator reaction | Immediately communicate who scored |
| Match win | Booth lights chase, prize motion, short confetti celebration | Rematch remains easy to reach |

Use one principal callout per event. Impact effects should clear before the next targeting phase. Avoid constant chromatic aberration, heavy motion blur, repeated full-screen flashes, or every hit receiving the maximum celebration.

### Motion targets

These are initial tuning targets, not measured results:

- Experienced player strike: approximately 4–6 seconds.
- Camera move between target and impact views: approximately 250–400 ms.
- Swing contact after accepted gesture: approximately 180–300 ms.
- Strong-hit presentation pause: approximately 35–70 ms; never pause input sampling during targeting.
- Straightening: approximately 350–600 ms; no extra dialogue pause.
- Operator turns: approximately 2–3 seconds, with abbreviated but visible aim and swing.

Keep camera interpolation separate from game-state progression. The swing prompt appears only when its input is active. Reduced-motion mode replaces shake and camera whips with steady framing or short transitions while preserving timing challenges.

## 3. Technical approach

**Proposed stack:** TypeScript, Vite, Three.js, lightweight HTML/CSS UI, Web Audio, a focused unit-test runner, and browser automation. This is a proposed architecture, not a claim that a repository already exists. Reuse an existing compatible stack if the eventual repository supplies one. Pin compatible dependency versions during E1; do not introduce a framework migration for this plan.

Three.js provides post-processing and explicit canvas resolution control. Use those capabilities sparingly and profile the actual scene. Its guidance also recommends correct color-space handling for textures and rendered output. See the technical references at the end.

### Dynamic title screen, preloading, and audio start

The title screen is a living carnival attract scene: dimensional **Nailz!** lettering, chasing marquee bulbs, gently moving prizes, the operator's idle performance, and subtle camera drift. Display a large pulsing **TAP TO PLAY** prompt. Use the existing booth and animation assets once available; begin with a lightweight animated logo/background so the loading screen does not depend on the assets it is loading. Reduced-motion mode keeps the title attractive with steady framing and subdued effects. No sound plays before user activation.

On page entry, immediately begin loading a versioned asset manifest. Prioritize the title shell and assets needed for the first playable turn: hero geometry, materials/textures, operator clips, UI fonts, and essential sound effects. Prepare meshes, textures, and representative render paths before declaring play ready; downloaded bytes alone do not mean an asset is ready to render. Warm up in small batches so the title animation and tap handling remain responsive. Load optional ambience and other nonessential assets afterward.

Show honest loading stages such as **Loading booth…** and **Preparing game…**, plus measured progress when available. Never fake a percentage. Keep the tap prompt usable during loading:

1. A tap/click or keyboard activation on the actual title button records play intent and immediately creates/resumes the shared audio context inside that user event, before awaiting asset work. If a configured user-supplied music track is ready and music is enabled, start it with a short fade-in after audio activation succeeds.
2. If essential assets are still preparing, retain the animated title with **Getting ready…**. Continue loading while any available enabled music plays. When assets become ready, enter mode selection automatically using the recorded intent; do not require a second routine tap.
3. If assets become ready first, remain on **TAP TO PLAY** until the user activates it. Loading completion never starts music or enters the game by itself.
4. Debounce repeated activations and consume the title gesture so it cannot select a mode or lock an aim line on the next screen. Create only one music playback instance; returning to the title or rematching must not stack tracks.

Keep asset readiness, user play intent, and audio activation as separate state. A rejected audio activation must not deadlock loading or play: continue silently and offer an explicit sound-enable control for a later gesture. Respect saved mute/volume settings, and pause or suspend audio appropriately when backgrounded. If the user has not provided music, skip its request entirely and continue with sound effects; do not show a missing-file error or synthesize a replacement. When a track is supplied later, register its URL, version, gain, and loop behavior in one music configuration entry. Load/decode it through the existing pipeline and start it only after activation; no startup-flow rewrite should be needed.

Cache fetched assets through content-versioned URLs and HTTP caching, with a versioned Cache Storage asset cache where supported. Reuse in-memory decoded assets during the session. Validate successful responses before caching, recover from bad entries by refetching, and retire only this game's obsolete cache entries after the current required set is ready. Cache errors, denied storage, or eviction fall back to normal loading. Never mix incompatible asset versions or promise permanent storage. This asset cache is required; a service worker, install prompt, and full offline launch remain outside scope.

Essential load failures show a concise **Retry** action without losing the user's play intent. Optional audio failures continue silently. Record the manifest/cache contract in E1, implement the loader/cache and render preparation in E4, establish audio activation/music hooks in E6, and assemble the final animated startup flow in E7. E8/E9 verify cold and warm starts, failures, and actual mobile audio behavior.

### Boundaries

| Module | Owns |
|---|---|
| Game model | Mode, two participant identities/controller types, active participant, match state, turns, nail depth, scores, and transitions |
| Strike resolver | Pure transformation of strike inputs into depth, bend, and result flags |
| Input controller | Pointer timestamps, gesture normalization, cancellation, and keyboard alternative |
| AI controller | Seeded aim, focus, and power samples under difficulty configuration |
| Scene/presentation | Cameras, meshes, pose animation, materials, and effects |
| Asset loader/cache | Versioned manifest, preloading, readiness, decoded-asset reuse, persistent-cache fallback, and retry |
| Audio controller | Gesture-based audio start, layered effects, optional user-supplied music, and mute/volume settings |
| UI/storage | Menus, tutorial, results, settings, and versioned local records |

Use a single simulation owner and explicit finite states. Model each participant as human or AI; select the controller from the active participant rather than hardcoding player/operator turns. Include an explicit `TURN_HANDOFF` state and intended recipient. AI jobs must not run in two-human mode and must be cancelled when a match resets or changes mode. Rendering consumes state and immutable strike results. Resolve each strike once and apply it at the defined contact event; interruption or resume cannot apply it twice. Keep seeded gameplay randomness separate from decorative randomness.

Store hit positions in nail-local coordinates normalized by nail-head radius. Camera projection maps the targeting overlay to that coordinate system. Freeze the relevant camera during aim; preserve the selected local point through the cinematic transition. The hammer contact, effect origin, and nail bend all consume that same point.

Use a segmented or skinned nail with a fixed wood-surface root. Track insertion depth separately from temporary bend. Before the next strike, straighten the visible shape without changing depth or the incoming player's target dimensions.

The pure resolver should cover centered, edge, and complete misses; power clamping; bend direction; minimum/maximum depth; flush tolerance; and one-hit finishes. Continuous curves should avoid sudden unexplained power cliffs. The perfect window should be a small reachable region, not a requirement for mathematically exact zero error.

### Initial rule decisions to record in E1

These fill gaps in the proposal and are tuning defaults:

- Randomize the first striker of the first nail; alternate starters across the five nails in both modes. Swap the first starter on consecutive two-player rematches. Record starting side in balance results because five is odd.
- A reticle timeout locks the minimum quality for that pass and continues to swing. No automatic retry for a poor lock.
- The ring is centered on the selected hit point. A local ideal-radius cue makes focus timing readable; the faint nail-center guides continue to show aim error. Radius error sets focus quality independently of X/Y error.
- A cancelled gesture may retry the swing with the same locked aim and focus. It must not reroll earlier stages. A weak but valid downward swipe counts as a strike.
- A complete miss causes no depth gain and no contact bend; show it as a miss. Define the contact envelope from hammer-face and nail-head geometry, then keep presentation consistent with it.
- Pause or backgrounding freezes gameplay timers. Resume with a short countdown; do not let suspended time advance the reticle or AI.
- Secondary penalties belong to the striker who caused them. Do not charge a player for the opponent's prior strikes on a shared nail.

Measure one-hit frequency, starter advantage, average strikes per nail, and useful skill separation. Shared-nail tension does not automatically imply deep tactical choices; test whether partial hits remain interesting. Improve timing and distributions before considering any change to the supplied mechanics.

## 4. Quality gates

### Core-play gate — after E2

The duel is playable on a phone with one thumb. Weak swipes feel weak, a centered strong strike feels stronger, a perfect strike can finish a fresh nail, and a glancing hit visibly explains its bend. Do not proceed to full art if these relationships are unclear. Record human playtest observations separately from automated checks.

### Visual gate — after E6

Capture actual gameplay at portrait phone size: booth view, target view, raised hammer, centered contact, glancing bend, one-hit finish, and operator reaction. Review a short motion recording as well as stills. No hero object may retain an accidental prototype appearance. Impacts must show a clear hierarchy from miss to one-hit finish. Review low-quality mode too; a beautiful maximum-quality screenshot alone does not pass.

### Release targets — verified in E8/E9

- Primary physical test device: iPhone 13 Pro/Safari when available; also test a representative midrange Android/Chrome device and desktop Chrome, Safari, and Firefox where available.
- Aim for stable 60 fps on the primary device, with a viable 30 fps fallback on lower-powered devices. Report p50/p95 frame intervals, sustained behavior, and test conditions; these are targets until measured.
- Initial compressed playable payload target: at most 8 MB. Defer optional ambience and nonessential assets. Revisit only with measured load-time evidence.
- Ten consecutive matches covering both solo and pass-and-play without progressive memory growth, duplicate sound layers, orphaned effects, or input degradation.
- Two people can pass a physical phone through an entire match without accidental aim locks, duplicate turns, wrong score ownership, or a hidden AI strike. Handoff time is excluded from active-strike pacing measurements.
- No scrolling or browser gestures stealing normal play, and no UI collisions with safe areas or changing browser chrome.
- State remains valid after gesture cancellation, pause, tab backgrounding, resize/orientation change, restart, and recoverable graphics-context interruption.
- Targeting stays legible with sound off and color alone is never the only success/failure cue.
- Sound, music, motion, and supported haptics can be controlled independently. Do not promise vibration on every mobile browser.
- Animated title stays responsive during cold loading; early and late taps both reach mode selection exactly once. First play has no avoidable unloaded hero assets or first-impact shader hitch.
- No audio before activation; supplied music starts after activation when available and enabled. No supplied music means normal silent music behavior, not a blocked start. Verify warm-cache reuse, cache-version updates, denied storage, load retry, and background/resume during startup.

Desktop emulation does not establish physical touch feel, thermal performance, or browser-specific haptic support. If hardware is unavailable, mark those checks pending in the handoff instead of claiming a pass.

## 5. Full execution prompts

Each block is copyable. At the first session, supply this plan and the original proposal. Store them as `docs/NAILZ-BUILD-PLAN.md` and `docs/NAILZ-PROPOSAL.md`. Each later execution reads only its relevant plan sections and the concise handoff.

No repository URL has been supplied. E1 must use the workspace/repository actually provided; never infer a remote from another game project. Recommended branch: `<agent_name>/nailz-arcade-build`, with the prefix filled in when the executor is chosen. Inspect an existing matching branch before reusing it.

### E1 — Foundation and strike model

```text
Nailz! — EXECUTION 1 of 9. Recommended setting: High.

Begin: Read the supplied proposal and build plan, plus applicable AGENTS.md.
Inspect the actual workspace, Git status/history, and configured remote. Fetch
if configured; establish the dedicated branch without overwriting existing
work. Save the plan/proposal in docs and create docs/AI-NAILZ-HANDOFF.md.

Objective: A running portrait 3D foundation with a trustworthy strike model.

Implement: Minimal app/build setup; one block, nail, and hammer; responsive
canvas; camera anchors; mode/participant/controller types and explicit
game-state and strike-result types; pure
strike/depth/bend calculation; data-driven tuning; seeded randomness; a small
development-only strike fixture view. Record the initial rule decisions and
the proposed module boundaries, including startup readiness/play-intent/audio
state and the versioned asset-manifest/cache contract. Establish a reproducible
test/build command. Music configuration is optional and user-supplied only.

Do not implement full controls, match flow, carnival assets, or final menus.
Do not select or create a remote hosting service as an incidental setup step.

Validate: Build and typecheck. Test perfect one-hit completion, power cap,
monotonic accuracy/power behavior, all bend directions, complete misses,
depth bounds, and repeatable seeded inputs. Check portrait resizing visually.

Handoff: Record branch, module paths, formulas/units, dependency versions,
commands, decisions, and E2 starting point.

Complete: Review status/diff, commit intended work, push the established
branch if a remote exists, verify push, and leave a clean tree. Without a
remote, persist a durable checkpoint and record the missing push explicitly.
Stop; do not begin E2.
```

### E2 — Single-nail playable duel

```text
Nailz! — EXECUTION 2 of 9. Recommended setting: Extra High.

Begin: Load the exact E1 branch; fetch/sync safely, inspect status/history,
and read docs/AI-NAILZ-HANDOFF.md plus plan sections 1, 3, and the core gate.
Reuse the resolver and coordinates; correct only demonstrated defects.

Objective: One complete player-versus-operator nail, playable with one thumb.

Implement: Y and X line locks, single-pass reticle, downward swipe strength,
pointer capture/cancellation, camera transitions, hammer contact, visible depth
and bend, straightening, and alternating turns with a simple seeded operator.
Normalize gestures by viewport dimensions and elapsed time. Debounce stage
transitions so one gesture cannot trigger two stages. Add pause/background
handling and restart for this duel. Keep simulation separate from animation.

Do not implement five-nail matches, final art, elaborate VFX, or progression.

Validate: Complete duels by touch and mouse. Compare equivalent timestamped
gestures at differing sizes/frame rates. Check left/right/diagonal contacts
through camera changes, timeout, cancellation, double taps, pause, and exactly
one resolution per impact. Capture a playable recording and assess the core
gate. Test a reachable perfect finish through normal input.

Handoff: Record gesture thresholds, timing observations, coordinate decisions,
known feel issues, tests, and E3 starting point. Report unavailable phone tests.

Complete: Review diff, repair caused regressions, commit, push and verify on
the established remote, and leave a clean tree; otherwise save a durable
checkpoint and record the push limitation. Stop; do not begin E3.
```

### E3 — Match rules, pass-and-play, AI, and balance

```text
Nailz! — EXECUTION 3 of 9. Recommended setting: High.

Begin: Load/sync the exact prior branch, inspect status/history, and read the
handoff plus plan sections 1 and 3. Reuse the completed single-nail duel.

Objective: Complete five-nail matches in solo and two-player pass-and-play
with fair turn ownership and useful scoring.

Implement: Nail setup/reset, alternating starters, all five rounds, results,
rematch, primary score, secondary performance score, and Easy/Normal/Hard/
Champion input distributions. AI consumes the same resolver and visibly
expresses sampled aim/power. Create a reproducible balance simulation report
and a compact temporary HUD sufficient to play either mode. Implement the
full pass-and-play rules in section 1: two human participants, ready/handoff
state, fresh-touch guard, identical human timing, recipient labels, and
rematch starter swap. Add temporary mode selection. In local play the operator
only hosts; no AI competitive turn runs. Reuse the E2 human input pipeline.

Do not add final menus, unlock systems, hidden comeback bonuses, full art,
or score-dependent cheating. Never replace the E2 input loop.

Validate: Round ownership, finishing attribution, setup depth, bend reset,
score attribution, rematch reset, and the full five-round count. Compare
seeded cohorts for error distributions, one-hit rates, starter advantage,
and average match length. Play at least several representative matches;
simulated balance alone cannot establish fun or control fairness. Complete a
local two-player match, checking ready-tap consumption, accidental touches,
correct recipient after each finish, same-person next-nail readiness, pause
while passing, score ownership, no AI turns, and rematch starter swap. Verify
solo still works after switching modes outside a match.

Handoff: Save tuning values, report location, known balance risks, tests,
and the exact E4 starting point.

Complete: Review diff, commit, push/verify the same branch, and leave it clean.
If no remote exists, save a durable checkpoint and record that limitation.
Stop; do not begin E4.
```

### E4 — Carnival environment and lighting

```text
Nailz! — EXECUTION 4 of 9. Recommended setting: High.

Begin: Load/sync the established branch, inspect status/history, and read the
handoff and visual direction. Reuse all match and camera contracts.

Objective: A finished booth and hero props that already look compelling
without effects. This is the environment art milestone.

Implement: Sculpted block/hammer/nail assets, booth/canopy/signage/prizes,
layered festival background, coordinated materials, warm key/cool fill/rim
lighting, contact shadows, and restrained ambient motion. Establish asset
loading/disposal and the source/license manifest. Implement versioned preload,
cache/fallback, readiness reporting, and batched render preparation from section
3 behind a simple loading UI; E7 supplies the final title presentation.
Preserve gameplay pivots, scale, and hit geometry. Add basic rendering-quality
switches now.

Do not implement operator acting, impact VFX, new mechanics, or final menus.
Keep the simple operator temporarily; prioritize hero materials and framing.

Validate: Capture booth, target, and impact views at portrait and landscape
sizes. Check nail visibility, shadows, target contrast, and hammer contact
against the original fixture cases. Record asset sizes and baseline frame
cost. Verify cold/warm asset loads, failed-load retry, cache version changes,
and cache-denied fallback. Repair regressions caused by replacing meshes or
camera composition.

Handoff: Record asset pipeline, lighting/material settings, budgets, captures,
remaining intentional placeholders, and E5 starting point.

Complete: Review diff, commit, push/verify the same branch, and leave it clean;
otherwise save a durable checkpoint and record the remote limitation.
Stop; do not begin E5.
```

### E5 — Operator and physical animation

```text
Nailz! — EXECUTION 5 of 9. Recommended setting: High.

Begin: Load/sync the established branch; inspect status/history and read the
handoff plus character/motion direction. Reuse the finished environment.

Objective: A charismatic operator and believable, exaggerated hammer action.

Implement: Final operator asset/rig and short idle, setup, aim, swing,
straighten, confident, surprised, disappointed, and celebratory poses/clips.
Polish the player hammer's anticipation, acceleration, contact, and rebound.
Use a shared event timeline for poses/contact and resilient animation cleanup.
Match solo operator contact to sampled strike inputs. In pass-and-play,
keep the operator in host/setup/straightening/reaction roles, with no competitive
swing. Reuse the human hammer presentation for both players. Keep hands and
props aligned.

Do not add lengthy cutscenes, dialogue systems, new gameplay, or final VFX.
Reactions cannot delay input beyond the documented pacing targets.

Validate: Record normal, glancing, bent, near-flush, one-hit, and losing
sequences. Inspect clipping and hand/hammer alignment from all three camera
states. Skip/restart/pause during each clip and verify exactly-once impact
resolution and safe cancellation. Confirm straightening preserves depth.

Handoff: Record rig/clip names, event timing, captures, remaining animation
defects, validation, and E6 starting point; update the asset manifest.

Complete: Review diff, commit, push/verify the same branch, and leave it clean;
otherwise save a durable checkpoint and record the remote limitation.
Stop; do not begin E6.
```

### E6 — Arcade impacts and sound

```text
Nailz! — EXECUTION 6 of 9. Recommended setting: High.

Begin: Load/sync the established branch, inspect status/history, and read the
handoff, action-effects table, and visual gate. Reuse the event timeline.

Objective: Every strike feels tactile, and exceptional strikes look spectacular.

Implement: Hammer trails, contact bursts, dust, directional glance effects,
block recoil, brief hit-stop, restrained camera impulses, one-hit treatment,
score celebration, and match confetti. Pool short-lived effects. Add layered
whoosh/metal/wood/bend/finish sounds, original or cleared nonmusical ambience,
and capability-detected haptics. Implement shared audio-context activation,
optional user-supplied music configuration/loading/looping, fade-in, and separate
music/effects settings. Do not generate, source, or bundle placeholder music.
Provide reduced-motion variants. Invoke audio activation directly in a user
gesture before asynchronous loading; E7 connects the final title button.
Absent music or audio failures must not block play.

Do not add new mechanics or obscure the targeting phase with action effects.
Keep sound, VFX, and simulation driven by the same resolved contact event.

Validate: Capture every visual-gate case, with sound, muted, and at low quality.
Inspect audiovisual contact synchronization, repeated effects cleanup,
resume/mute behavior, and reduced motion. Check that both human players get
identical effects for identical results and celebrations name the right winner.
Compare miss/normal/perfect intensity. Verify absent music, saved mute state,
gesture activation, and single playback ownership. If no track is supplied,
test lifecycle logic without shipping substitute music and mark audible music
integration pending the user's asset.
Review actual gameplay footage and repair concrete visual weaknesses.

Handoff: Record effect/audio configuration, asset licenses, captures, measured
costs, visual-gate status, unresolved issues, and E7 starting point.

Complete: Review diff, commit, push/verify the same branch, and leave it clean;
otherwise save a durable checkpoint and record the remote limitation.
Stop; do not begin E7.
```

### E7 — Player-facing interface and onboarding

```text
Nailz! — EXECUTION 7 of 9. Recommended setting: High.

Begin: Load/sync the established branch, inspect status/history, and read the
handoff, release scope, and section 3 startup requirements. Reuse gameplay,
asset loader/cache, audio activation, presentation, and settings hooks.

Objective: A complete, coherent path from opening the game to replaying it.

Implement: Dynamic carnival Tap to Play title with a lightweight animated
loading shell, live progress, early/late tap handling, retry, and a readiness
gate. Connect the tap directly to shared audio activation and optional supplied
music, respecting mute state; transition once to mode selection when ready.
Never generate music or block readiness on its absence. Add Solo/2 Players
mode selection, solo-only
AI difficulty selection, optional local player names, polished handoff/ready
cards, persistent active-player labels, and a short interactive
tutorial, unobtrusive score HUD, pause/results/rematch, and settings for music,
effects volume, motion, quality, and supported haptics. Add versioned local
settings/personal bests with safe storage-failure handling, loading/error UI,
favicon/touch icon, and credits. Use bold readable arcade typography and
nail-shaped score markers. Keep tutorial feedback brief and contextual.
Provide an accessible keyboard swing alternative with the same power cap.
Explain passing the phone in the local-mode tutorial. Separate saved solo and
local records; preserve local names and swap starters on same-mode rematches.

Do not add accounts, leaderboards, achievements, progression, or install/offline
features. Avoid a dashboard-like interface over the booth.

Validate: First visit, tutorial replay, every difficulty, pause/resume,
results/rematch, reload persistence, missing/corrupt storage, touch safe areas,
keyboard navigation, and independent audio settings. Test readable feedback
without sound and without reliance on color alone. Verify mode selection,
local name fallback, handoff readability, ready input isolation, local results,
record separation, and no irrelevant AI difficulty controls in local play.
Verify tap-before-ready and ready-before-tap, repeated taps, keyboard activation,
no input leaking into mode selection, no pre-tap audio, responsive loading
animation, missing music, retry, and no duplicate playback on returning to title.

Handoff: Record UI routes/states, storage version, accessibility behavior,
captures, tests, and E8 starting point.

Complete: Review diff, commit, push/verify the same branch, and leave it clean;
otherwise save a durable checkpoint and record the remote limitation.
Stop; do not begin E8.
```

### E8 — Mobile performance and resilience

```text
Nailz! — EXECUTION 8 of 9. Recommended setting: High.

Begin: Load/sync the established branch, inspect status/history, and read the
handoff, rendering boundaries, and release targets. Reuse settled architecture.

Objective: Preserve the game's visual identity and controls on target devices.

Implement: Evidence-driven optimization of resolution, shadows, particles,
asset loading, and expensive render passes. Finalize stable quality tiers with
hysteresis for automatic switching. Repair browser gesture/safe-area issues,
startup loading/cache and first-frame stalls, gesture-based music start,
audio resume, background pause, resize/orientation behavior, graphics-context
recovery, and resource disposal. Show a useful unsupported-device screen.

Do not change hit probabilities by frame rate, redesign the game, add features,
or discard hero art wholesale to meet a performance target.

Validate: Profile sustained matches on available physical iOS/Android devices
and supported desktop browsers. Measure payload, load time under stated
network conditions, frame intervals, memory trend, and worst impact spikes.
Run ten-match soak, repeat restarts, cancellation, context loss/recovery,
background/resume, and rotation. Include physical phone passing, a handoff
held open for at least a minute, and background/rotation during handoff; verify
recipient and input guard persist. Compare normal and reduced quality visually.
Verify cold/warm startup, cache eviction/version upgrade, denied storage,
early tap, audio rejection, and background/resume while loading on physical
mobile browsers. Mark unavailable checks pending, never inferred passed.

Handoff: Record measured results with device/browser/build, applied tradeoffs,
remaining release blockers, exact E9 test commands, and regression fixtures.

Complete: Review diff, commit, push/verify the same branch, and leave it clean;
otherwise save a durable checkpoint and record the remote limitation.
Stop; do not begin E9.
```

### E9 — Final integration and release handoff

```text
Nailz! — EXECUTION 9 of 9. Recommended setting: High.

Begin: Load/sync the established branch, inspect status/history, and read the
handoff, invariants, release targets, and prior defect reports.

Objective: A verified release candidate and honest, reproducible handoff.

Implement: Only repairs for identified integration, gameplay, visual, build,
or compatibility defects. Remove accidental debug UI; retain purposeful test
fixtures through a documented test configuration. Finalize run/build guidance,
asset credits, known limitations, and a short release validation report.

Do not add features, perform unrelated refactors, reopen settled design, or
substitute new speculative improvements for completion.

Validate: Run typecheck, production build, resolver/state tests, and browser
flows. Exercise cold/warm animated title -> tap/audio activation -> mode
selection -> tutorial -> full match -> results -> rematch in both solo and
pass-and-play, including mode switches outside matches, across difficulty
and quality settings. Verify perfect one-hit possibility, shared-rule AI,
five nails, starter policy, bend direction/straightening, score attribution,
gesture cancellation, audio, and pause recovery. Verify local handoff/ready
input isolation, participant score attribution, no AI turns, same-person
next-nail readiness, and rematch starter swap. Confirm absent music never blocks
play and supplied music, if available, starts only after activation without
duplicates. Record pending audible verification when the track is not supplied.
Repeat only performance or
compatibility checks affected by repairs. Review final portrait gameplay
recordings against the visual gate. Address task-caused CI failures.

Handoff: Replace stale instructions with completion status, exact build commit,
commands, evidence locations, known limitations, and any pending physical-device
checks. Distinguish release candidate from verified deployed release.

Complete: Review status/diff, commit, push/verify the same branch, and leave a
clean tree. If no remote exists, persist the final artifact and record that
limitation. Deliver the release candidate and report; open a PR or deploy only
when that action and target are established by the build request. Stop.
```

## 6. Work-setting rationale

- **E2 warrants Extra High:** it ties touch timing, projected coordinates, camera movement, physical contact, and state transitions together. Subtle errors would undermine every later visual improvement.
- **E1/E3 use High:** shared architecture and fair scoring/AI have broad downstream consequences.
- **E4–E6 use High:** material, composition, animation, and synchronized effects require iteration and visual judgment; they are core deliverables for this game.
- **E7 uses High:** the expanded title flow coordinates asset readiness, user intent, audio activation, input isolation, and the finished interface; the loader and audio foundations already exist from E4/E6.
- **E8/E9 use High:** performance and final integration touch several systems. Escalate to Extra High only if measured defects reveal genuinely difficult interactions.
- **Light was considered:** it suits later mechanical asset/document edits, but no complete milestone here is purely mechanical.
- **Max was considered:** no planned milestone presently requires it. Reserve it for an exceptionally difficult, reproduced cross-system defect after narrowing the problem. Do not use higher effort as a substitute for splitting an oversized session.

If a session cannot finish its milestone, persist working changes and mark the execution incomplete. Resume that execution next; do not quietly move its acceptance criteria into the following milestone. Keep `docs/AI-NAILZ-HANDOFF.md` concise: completed work, decisions, important files, validation, incomplete work, and exact next step.

## Technical references

These references support the rendering approach, not claims that the proposed performance targets have already been met. Dependency compatibility and browser behavior must be verified during implementation.

- Three.js — Post Processing: https://threejs.org/manual/pages/post-processing.html
- Three.js — Responsive Design: https://threejs.org/manual/pages/responsive.html
- Three.js — Color Management: https://threejs.org/manual/pages/color-management.html
- MDN — Web Audio best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- MDN — Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- MDN — Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache

The attached game proposal is authoritative for the original mechanics. The user-requested two-player pass-and-play mode and dynamic Tap to Play title with asset preloading/caching and audio activation extend its scope and are required for this release. Music is supplied by the user later; music creation is excluded. This plan adds implementation order, visual direction, explicit defaults for unspecified cases, and completion gates.
