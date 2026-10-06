export interface GesturePoint { readonly x: number; readonly y: number; readonly time: number }
export interface SwipeMeasurement { readonly valid: boolean; readonly power: number; readonly distance: number; readonly duration: number }
/** CSS viewport fractions and milliseconds, never device pixels or event counts. */
export function measureSwipe(points: readonly GesturePoint[], viewportHeight: number): SwipeMeasurement {
  const first = points[0]; const last = points.at(-1);
  if (!first || !last || points.length < 2 || viewportHeight <= 0) return { valid: false, power: 0, distance: 0, duration: 0 };
  const distance = (last.y - first.y) / viewportHeight;
  const duration = (last.time - first.time) / 1000;
  let path = 0;
  for (let i = 1; i < points.length; i++) path += Math.hypot(points[i]!.x - points[i-1]!.x, points[i]!.y - points[i-1]!.y);
  const straightDistance = Math.hypot(last.x - first.x, last.y - first.y);
  const continuity = path > 0 ? Math.min(1, straightDistance / path) : 0;
  const valid = Number.isFinite(duration) && duration > 0 && distance >= .035 && (last.y - first.y) > Math.abs(last.x - first.x) * .7;
  const strength = Math.sqrt(Math.min(1, distance / .25) * Math.min(1, distance / Math.max(.025, duration) / 1.15)) * continuity;
  return { valid, power: valid ? Math.max(0, Math.min(1, strength)) : 0, distance, duration };
}
/** Keyboard swing: hold-and-release duration maps to requested power on the same 0..1 scale as a swipe; the reticle cap still applies in the resolver. A quick press is a deliberately weak hit; a half-second hold reaches full power. */
export function keyboardSwingPower(holdSeconds: number): number {
  if (!Number.isFinite(holdSeconds) || holdSeconds < 0) return 0;
  return Math.max(.3, Math.min(1, .3 + holdSeconds / .5 * .7));
}
