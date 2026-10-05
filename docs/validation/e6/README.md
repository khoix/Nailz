# E6 partial validation

## Continuation on October 5, 2026

48 unit tests, typecheck, and production build pass. Audio lifecycle tests cover context/loop ownership, volume/mute/pause, 20 repeated pause cycles, 100 contact events, 16 overlapping voices, cleanup/reuse, optional load retry, corrupt decode invalidation, and late completion after disposal. These use a mocked Web Audio context and test-only blobs, not an included music track.

Production `audio-settings` passed again on Chromium 153.0.8010.0, software WebGL, DPR .5, including repeated sound toggles while paused. The actual pointer-driven one-hit journey passed in normal, muted, and low-quality modes. Results and compact recordings are in `followup/`. Contact/rebound stills were reviewed in normal and low modes: the hammer head contacts the nail and the human grip faces the player, with readable result feedback. This is not a claim that every gameplay pose was reviewed.

Recordings: [normal](followup/normal.mp4), [muted](followup/muted.mp4), [low](followup/low.mp4). Playwright captures the real production UI with the simulation clock advanced in 25ms steps during the strike. The saved 256px-wide, 12fps silent previews accelerate captured wall time by 5×. The software screencast occasionally pads a lower-resolution frame during screenshot capture. They are ordering/pose evidence, not audio recordings or real-time frame-rate measurements. Full-size WebM, stills and traces are reproducible with the README command. The video dependency is Playwright FFmpeg; recording is opt-in and off in routine CI.

A full sequential production regression was started during this time-boxed run. `followup/production-e2e.json` records completed scenarios at the save checkpoint; omitted scenarios must not be treated as passes. Four local scenarios completed (audio-settings, asset-loading, solo-controls, and two local matches); the solo difficulty run was stopped for the save phase. The previous checkpoint's eight hosted scenarios passed (run 37265678171); new hosted CI must be checked separately.

## Resource and ownership checks

Effects reuse one 80-point pool, one ring, one eight-point trail, and a 1,024-byte spark texture. Low tier reduces draw counts. The existing test repeats 1,000 effect updates, checks stable scene objects, equal effects for both actors, reduced motion, and disposal. Audio limits short voices to 16 and owns one ambience loop plus at most one optional music source. The quiet ambience is original filtered noise, not substitute music. Structural/mocked checks are not measured GPU/memory/phone performance.

## Remaining E6 gates

Auditory review/tuning of sound layers and ambience; real music integration when the user supplies a track; complete visual-gate captures and motion review across miss/normal/glance/perfect/operator; ten complete matches with real resource telemetry; physical haptics, Safari and phone performance. No physical-device, auditory-quality, or final E6-completion claim is made. E7 has not started.
