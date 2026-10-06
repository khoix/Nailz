# E7 validation — checkpoint 1 (partial)

E7 is not complete. This checkpoint covers the startup state machine and Tap to Play title flow only; menus, names, records, tutorial, keyboard swing, and HUD polish follow in the next E7 session (see `docs/AI-NAILZ-HANDOFF.md`).

## Covered

- `src/game/startup.ts` reducer: tap-before-ready, ready-before-tap, repeated taps enter once, retry preserves intent, blocked audio never blocks play (`tests/startup.test.ts`, 5 tests; 54 unit tests total, typecheck and production build pass).
- Production scenario `title-flow` (`npm run test:e2e -- title-flow`), Chromium 151 software WebGL, 390×844, DPR 1: no AudioContext before activation; early tap during a held texture request shows **Getting ready…**, creates the one shared AudioContext inside the gesture, and enters mode selection automatically once readiness arrives with no leaked input (`data-phase` stays `MATCH_INTRO`); loading completion alone never enters; Enter on the focused button enters with one context; three synchronous repeated clicks mount the game once; a required-asset failure after an early tap hides the button, shows Retry with intent retained, and a successful retry enters without a second tap. Result: `title-flow.json`; captures `getting-ready.png`, `tap-to-play.png`.
- Regression at save time: `asset-loading`, `audio-settings`, and `solo-controls` production scenarios pass with the always-visible title button. `visual-low` could not launch locally (the workspace Playwright cache lacked ffmpeg for video recording; not a game failure). Other scenarios were not rerun locally in this session; hosted CI on the checkpoint commit is the gate.

## Not covered yet

- Attract scene choreography (camera drift, operator idle performance) and a reduced-motion review of the title; only the CSS marquee chase, prompt glow, and booth show-through exist.
- Everything else in the E7 prompt. No physical-device claims.

## Continuation 2 (October 6, 00:00 UTC) — settings, records, keyboard, tutorial

- 62 unit tests, typecheck, and production build pass (records store ×4, keyboard power mapping ×1, names ×3 from the prior continuation).
- New production scenario `interface` (`npm run test:e2e -- interface`), Chromium 151 software WebGL: seeded `nailz-records-v1` shows the Hard solo line and the Pass & Play line as mode/difficulty change and nothing for Normal; the first match in a mode shows the contextual tutorial hints; a keyboard-only strike (Space ×2, Enter, hold/release Space) reaches `SWING` through the normal resolver; the quality select persists `quality:"low"` and is restored after reload; corrupt records JSON leaves the menu working with an empty records line. Result: `interface.json`; captures `records.png`, `keyboard-swing.png`.
- `asset-loading` and `audio-settings` pass with the corrected ready-state wait (the earlier hosted failure on PR #10 was this race). `local-matches`/`solo-controls` were running under CPU contention at save time; see the handoff for whether they completed.
- Not covered: visual review of the new card content on a phone, nail-shaped score markers, segmented controls, attract choreography.
