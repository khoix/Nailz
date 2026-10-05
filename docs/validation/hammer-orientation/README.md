# Hammer orientation correction

The old mesh struck with a disk under the middle of the head while the handle pointed upward. The corrected head has its striking face on the downward end, perpendicular to the handle. The handle points toward the front/player (+Z) for human turns, including both pass-and-play participants, and toward the operator (-Z) for computer turns; swing rotation and operator wrist orientation follow this new geometry. The actual rotated face offset anchors to the sampled nail contact. Gameplay timing, contact radius, strike resolution, and scoring are unchanged.

Verification on software Chromium 153.0.8010.0, DPR 0.5:
- `npm run check`: typecheck, production build, and all 41 unit tests passed. The new regression samples the actual mesh end at different nail depths for both actors, verifies a downward face and transverse handle, checks grip orientation, and checks handle direction throughout wind-up, swing, and rebound for both controller types.
- `npm run test:operator`: all 19 pose cases passed, including human wind-up/swing/contact/rebound, local Player 2 contact, operator contact, wrist alignment, pause, and reset. Portrait and landscape captures were reviewed.
- `npm run test:e2e -- solo-controls`: production UI journey passed with perfect/weak strikes, operator alternation, cancellation, pause/resume, rotation, and no browser/runtime/network errors.
- Full seven-scenario hosted regression is enforced by GitHub Actions on the saved commit; inspect that run for its final result. These browser checks do not claim physical-phone certification.

`contact.png` shows operator contact; `human-contact.png` shows the player-facing handle at contact. `swing-ready.png` and `perfect-impact.png` show the real production UI before the swipe and during rebound.
