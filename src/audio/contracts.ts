export interface MusicConfig {
  readonly url: string;
  readonly version: string;
  readonly gain: number;
  readonly loop: boolean;
}
/** The user supplies music later. No placeholder request or generated track. */
export const MUSIC: MusicConfig | null = null;
export type AudioActivation = 'locked' | 'activating' | 'active' | 'blocked';
export interface AudioController {
  /** Call synchronously from a user gesture, before awaiting downloads. */
  activate(): Promise<void>;
  setMusicVolume(volume: number): void;
  setEffectsVolume(volume: number): void;
  suspend(): Promise<void>;
  dispose(): void;
}
