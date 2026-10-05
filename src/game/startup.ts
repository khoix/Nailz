import type { AudioActivation } from '../audio/contracts.ts';
export interface StartupState {
  readonly assetsReady: boolean;
  readonly playRequested: boolean;
  readonly audio: AudioActivation;
  readonly requiredAssetError: string | null;
  /** Set exactly once when play intent and readiness meet; later events never re-enter. */
  readonly entered: boolean;
}
export type StartupEvent =
  | { type: 'assetsReady' }
  | { type: 'assetError'; message: string }
  | { type: 'retry' }
  | { type: 'play' }
  | { type: 'audio'; result: AudioActivation };
export const createStartup = (): StartupState => ({ assetsReady: false, playRequested: false, audio: 'locked', requiredAssetError: null, entered: false });
/** Audio failure or absent music never blocks play. The title remains until assets are ready and a user explicitly requests play. */
export const canEnterMenu = (state: StartupState): boolean => state.assetsReady && state.playRequested && !state.requiredAssetError && !state.entered;
/** Pure startup transitions: tap-before-ready and ready-before-tap both enter the menu exactly once. */
export function advanceStartup(state: StartupState, event: StartupEvent): StartupState {
  switch (event.type) {
    case 'assetsReady': return { ...state, assetsReady: true, requiredAssetError: null };
    case 'assetError': return { ...state, assetsReady: false, requiredAssetError: event.message };
    case 'retry': return state.requiredAssetError ? { ...state, requiredAssetError: null } : state;
    case 'play': return state.entered ? state : { ...state, playRequested: true };
    case 'audio': return { ...state, audio: event.result };
  }
}
export const enterMenu = (state: StartupState): StartupState => canEnterMenu(state) ? { ...state, entered: true } : state;
/** Player-facing stage label; progress numbers come from measured loader counts, never invented. */
export function startupLabel(state: StartupState): 'tap' | 'getting-ready' | 'loading' | 'failed' | 'entered' {
  if (state.entered) return 'entered';
  if (state.requiredAssetError) return 'failed';
  if (state.assetsReady) return 'tap';
  return state.playRequested ? 'getting-ready' : 'loading';
}
