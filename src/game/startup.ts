import type { AudioActivation } from '../audio/contracts.ts';
export interface StartupState {
  readonly assetsReady: boolean;
  readonly playRequested: boolean;
  readonly audio: AudioActivation;
  readonly requiredAssetError: string | null;
}
export const createStartup = (): StartupState => ({ assetsReady: false, playRequested: false, audio: 'locked', requiredAssetError: null });
/** Audio failure or absent music never blocks play. E7 wires events and the title. */
export const canEnterMenu = (state: StartupState): boolean => state.assetsReady && state.playRequested && !state.requiredAssetError;
