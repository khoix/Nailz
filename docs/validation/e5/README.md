# E5 operator and motion checkpoint

2026-10-04. Original procedural articulated host; no external model, voice, or music assets.

## Rig and poses

`src/scene/operator.ts` owns the rig: torso/apron, head, eyes, brows, mouth, cap/hair, two shoulder/elbow/wrist chains, and hands. Static head/torso components batch by material. Broad body and hand shadows ground the character; tiny facial/hair details do not add shadow passes. The right wrist follows the rendered hammer's local `(0, .76, 0)` grip point during solo operator aim/swing/contact. Anticipatory body lean keeps the raised grip within reach. The host never holds the competitive hammer in pass-and-play.

`src/scene/animation.ts` samples nine clips from immutable game snapshots: `idle`, `setup`, `aim`, `swing`, `straighten`, `confident`, `surprised`, `disappointed`, `celebrate`. Setup and straightening reach toward the currently rendered nail head. Solo wins/losses own their reactions; local wins receive host celebration for either player. Decorative breathing/celebration sway respects reduced motion. There are no queued callbacks, delayed scoring events, or animation-owned state transitions.

## Shared timing

All strike timing remains `DUEL_TIMING`. Ready anticipation uses .36 seconds, the accelerating hammer arc reaches contact at .24 seconds, insertion interpolates over .09 seconds, rebound settles over .36 seconds, and straightening remains .45 seconds. Model resolution applies exactly once at its original contact boundary. Presentation never changes nail depth, score, actor, or input timing. Pause/resume freezes the sampled timeline; restarting replaces the snapshot and cancels obsolete pose/reaction ownership.

Human targeting keeps its fixed overhead camera and HTML aiming overlay. Operator aiming is now visible from the action camera with a 3D aim marker; the host is hidden in the settled human target view. The same first-person hammer serves both local players.

## Evidence

`poses.json` records 13 inspected cases, including idle/setup/aim, swing/contact, normal/glancing rebound, straightening, near flush, one hit, losing, confident, and host celebration. All tested gripping poses report wrist error below 1e-8 world units. Every case was paused and checked for identical root/head/hand transforms, then reset to an idle non-gripping actor. Target/impact and short landscape views were also exercised. Selected 390×844 CSS-pixel captures are checked in here at DPR .75; the remaining captures and trace are produced by `npm run test:operator` under `artifacts/browser/operator-poses`.

These are pose/camera captures and automated UI journeys, not a physical-device or continuous slow-motion film review. Strongly raised poses deliberately use exaggerated arm proportions. Further human animation/comfort review and real-device GPU profiling remain outstanding.

## E4 CI follow-up

E4 run 37233640763 passed 36 unit tests, production build, loading checks, and solo controls, then hit the local-match script's ten-minute watchdog. It did not report an assertion failure before termination. E5 avoids redundant WebGL draws in settled human aim views (SVG targeting continues normally), avoids repeated paused draws, and renders ambient menu/handoff motion at 30 fps. Camera transitions always render their settled endpoint. Character batches and limited shadow casters reduce additional cost. E5's local production match test completed in about 175 seconds on software Chromium; hosted CI still needs a fresh result. No assertion, screenshot, or timeout was disabled.

Local regression result: 40 unit tests passed; all seven production E2E scenarios passed, including all four solo difficulties and both local matches. See `production-e2e.json` for browser/version/timing and the scope of final presentation refinements. Hosted CI on the saved commit remains a separate gate.
