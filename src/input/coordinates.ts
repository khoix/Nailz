import type { Vec2 } from '../game/types.ts';
export interface TargetRect { readonly centerX: number; readonly centerY: number; readonly radiusPixels: number }
/** Target camera stays fixed while aiming; pointer positions use CSS pixels. */
export function screenToNail(clientX: number, clientY: number, target: TargetRect): Vec2 {
  if (!Number.isFinite(target.radiusPixels) || target.radiusPixels <= 0) throw new RangeError('Target radius must be positive.');
  return { x: (clientX - target.centerX) / target.radiusPixels, y: (target.centerY - clientY) / target.radiusPixels };
}
