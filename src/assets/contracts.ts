/** Versioned asset contract. Never cache error responses or unversioned content. */
export interface AssetEntry {
  readonly id: string;
  readonly url: string;
  readonly version: string;
  readonly kind: 'model' | 'texture' | 'font' | 'sound' | 'music';
  readonly required: boolean;
}
export interface AssetManifest { readonly version: string; readonly assets: readonly AssetEntry[] }
export type AssetStage = 'idle' | 'fetching' | 'preparing' | 'ready' | 'failed';
export interface AssetProgress {
  readonly stage: AssetStage;
  readonly ready: number;
  readonly total: number;
  readonly failedIds: readonly string[];
}
export interface AssetLoader {
  prepare(manifest: AssetManifest, onProgress: (progress: AssetProgress) => void, signal?: AbortSignal): Promise<void>;
  dispose(): void;
}
