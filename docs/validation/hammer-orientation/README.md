# Hammer orientation correction

The old mesh struck with a disk under the middle of the head while the handle pointed upward. The corrected head has its striking face on the downward end, perpendicular to the handle. The handle extends back toward the wielder; swing rotation and operator wrist orientation follow this new geometry. The actual rotated face offset anchors to the sampled nail contact. Gameplay timing, contact radius, strike resolution, and scoring are unchanged.

Verification on software Chromium 153.0.8010.0, DPR 0.5:
- `npm run check`: typecheck, production build, and all 41 unit tests passed. The new regression samples the actual mesh end at different nail depths for both actors, verifies a downward face and transverse handle, checks grip orientation, and checks the pre-contact sweep.
- `npm run test:operator`: all 15 pose cases passed, including human and operator contact, wrist alignment, pause, and reset. Portrait and landscape captures were reviewed.
- `npm run test:e2e -- solo-controls`: production UI journey passed with perfect/weak strikes, operator alternation, cancellation, pause/resume, rotation, and no browser/runtime/network errors.
- Full seven-scenario hosted regression is enforced by GitHub Actions on the saved commit; inspect that run for its final result. These browser checks do not claim physical-phone certification.

`contact.png` shows the exact contact fixture. `swing-ready.png` and `perfect-impact.png` show the real production UI before the swipe and during rebound.
