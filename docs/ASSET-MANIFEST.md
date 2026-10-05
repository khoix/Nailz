# Nailz! asset provenance and preparation

All game art in E4 is original code-authored geometry or SVG artwork created for this repository. No third-party models, stock textures, music, or external font files were downloaded. Original assets inherit the repository's eventual license; no separate license is claimed for the project.

| Asset | Location | Source / permission | Modification / use |
|---|---|---|---|
| End grain, cracks, old dents | `public/assets/endgrain.svg` | Original authored SVG | Deterministic rings and scars; 512×512 color texture, 83,237 bytes |
| Marquee face | `public/assets/marquee.svg` | Original authored SVG | 1024×384 lettering and rules, 853 bytes; system sans-serif resolves locally |
| Sculpted log, hammer, nail | `src/scene/createScene.ts`, `src/scene/hammer.ts` | Original procedural meshes | Lathed/bevelled profiles, wrapped grip, collars, bands and rivets; hammer contacts with its head end and transverse handle |
| Booth, canopy, bears, wheel, festival | `src/scene/environment.ts` | Original procedural meshes | Batched static meshes; independently swaying prize pivots; instanced bulbs |
| Reflection environment / rounded mesh utilities | Three.js pinned npm dependency | Three.js MIT license in `node_modules/three/LICENSE` | RoomEnvironment produces an in-memory PMREM; no fetched environment map |
| Favicon | `public/favicon.svg` | Original authored SVG from CI repair | N! mark |
| Operator rig / poses | `src/scene/operator.ts`, `src/scene/animation.ts` | Original procedural geometry and code-authored poses | Articulated arms, face, apron and cap; shared deterministic strike timeline |
| Music | None | User will supply it later | No substitute music, no music request |

## Loader contract

`src/assets/manifest.ts` is the required asset list (`e4-1`). Each URL includes an asset content-version query. Increment the asset's version when bytes change and the manifest version when a required set changes. Successful responses enter `nailz-assets-<manifest version>`; decoded textures are reused within the session. Incorrect MIME/status and empty responses are rejected, corrupt images invalidate their cache entries, and Retry retains valid work. Storage denial, quota failure, and missing optional assets fall back to session/network loading.

`main.ts` separately reports fetched asset count, preparation, and readiness. Required images are decoded, textures uploaded, and booth/target/impact shader paths compiled and rendered in separate browser tasks before the game UI mounts. Only after this succeeds are obsolete `nailz-assets-` caches retired; unrelated caches are preserved. The final intent/audio-gated title remains E7. Cache Storage is an optimization, not an offline-launch guarantee.

Geometry/material/shadow/environment resources are owned and disposed by the scene; decoded color textures and loader memory are owned by startup. Object URLs are revoked after each decode. Hot reload aborts pending work and disposes owned resources.

## Rendering baseline

High (default): sRGB color maps/output, ACES exposure .95, one 1024² shadow map, warm key 3.2, cool hemisphere 1.1, cyan rim 2.2, PMREM intensity .45, DPR capped at 1.75. No fullscreen bloom or postprocessing. Low (`?quality=low`, or scene API): DPR capped at 1, dynamic shadows and distant scenery disabled; hero geometry and aiming coordinates unchanged. A later settings UI can call `setQuality()`.

Static scenery merges by material and bulbs instance together. Prize motion honors reduced motion and paused simulation time. The fixed top-down targeting camera and nail-local radius .115 remain unchanged; the booth camera now frames the marquee and hero together. The hammer's contact face retains its original radius and gameplay timing. Its mesh-end offset is transformed with the swing so the downward head end reaches the sampled contact while the handle faces the active wielder: front/player for human turns and back/operator for computer turns.

Measured development captures and CPU submission profile are in `docs/validation/e4/`. CPU timing in software-rendered Chromium is not a phone GPU/frame-rate claim. E8 must measure real iPhone/Android performance and tune tiers.

## E5 operator ownership

The scene owns and disposes the operator geometry/materials and rig. No additional downloads are required. Pose inspection fixtures are development-only (`src/dev/animationFixtures.ts`); production has no pose injection API. Hand transforms follow the sampled hammer, while only the existing game model applies contact. See `docs/validation/e5/README.md` for clip names, timing, screenshots, and validation limits. Stable human target views reuse the last WebGL frame while SVG aim runs continuously; pause and ambient drawing avoid redundant GPU work.

## E6 effects/audio checkpoint
`src/effects/impact.ts` contains original procedural, pooled particles/rings/trails and one shared 16×16 RGBA soft-spark texture (1,024 bytes). `src/audio/controller.ts` synthesizes original short nonmusical noise/oscillator transients and one two-second filtered-noise ambience loop (one mono float buffer at the context sample rate); no external recordings or music are bundled. Optional user music is configured only in `src/audio/config.ts` and uses the existing versioned cache. Pool/voice limits and incomplete gates are documented in `docs/validation/e6/README.md`.
