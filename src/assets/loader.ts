import type { AssetEntry, AssetManifest, AssetProgress } from './contracts.ts';
export const CACHE_PREFIX = 'nailz-assets-';
/** Injected storage/fetch keep failure paths testable without browser globals. */
export class Preloader {
  private memory = new Map<string, Blob>();
  private storage: CacheStorage | undefined;
  private request: typeof fetch;
  constructor(storage: CacheStorage | undefined, request: typeof fetch = fetch) { this.storage=storage;this.request=request; }
  async prepare(manifest: AssetManifest, report: (p: AssetProgress) => void, signal?: AbortSignal) {
    let cache: Cache | undefined;
    try { cache = await this.storage?.open(CACHE_PREFIX + manifest.version); } catch { /* Storage denial is nonfatal. */ }
    const required = manifest.assets.filter(a => a.required); let ready = 0;
    report({ stage:'fetching',ready,total:required.length,failedIds:[] });
    const failedIds: string[] = [];
    for (const asset of manifest.assets) {
      if (signal?.aborted) throw signal.reason;
      const key = `${asset.url}${asset.url.includes('?')?'&':'?'}v=${encodeURIComponent(asset.version)}`;
      try {
        if (!this.memory.has(key)) {
          let response: Response | undefined;
          try { response = await cache?.match(key); } catch { /* Fall back to network. */ }
          if (response && (!response.ok || !validType(asset,response))) {
            try { await cache?.delete(key); } catch { /* Refetch regardless. */ }
            response = undefined;
          }
          if (!response) {
            const request=this.request; response = await request(key,{signal});
            if (!response.ok || !validType(asset,response)) throw new Error(`Invalid asset: ${asset.id}`);
            try { await cache?.put(key,response.clone()); } catch { /* Quota/private mode: session memory still works. */ }
          }
          const blob = await response.blob();
          if (!blob.size) { try { await cache?.delete(key); } catch {} throw new Error(`Empty asset: ${asset.id}`); }
          this.memory.set(key,blob);
        }
        if (asset.required) ready++;
      } catch (error) { if (signal?.aborted) throw error; if (asset.required) failedIds.push(asset.id); }
      report({stage:'fetching',ready,total:required.length,failedIds:[...failedIds]});
    }
    if (failedIds.length) { report({stage:'failed',ready,total:required.length,failedIds}); throw new Error(`Unable to load ${failedIds.join(', ')}`); }
    report({stage:'preparing',ready,total:required.length,failedIds:[]});
  }
  get(asset: AssetEntry) { return this.memory.get(`${asset.url}${asset.url.includes('?')?'&':'?'}v=${encodeURIComponent(asset.version)}`); }
  async ready(manifest: AssetManifest) {
    // Retire only this game's caches, after decoded assets and render preparation succeed.
    try { for (const name of await this.storage?.keys() ?? []) if (name.startsWith(CACHE_PREFIX) && name !== CACHE_PREFIX+manifest.version) await this.storage?.delete(name); } catch {}
  }
  invalidate(asset: AssetEntry) {
    const key=`${asset.url}${asset.url.includes('?')?'&':'?'}v=${encodeURIComponent(asset.version)}`;
    this.memory.delete(key);
    return this.storage?.keys().then(async names=>{for(const name of names.filter(n=>n.startsWith(CACHE_PREFIX))) try{await (await this.storage!.open(name)).delete(key);}catch{}}).catch(()=>{});
  }
  dispose() { this.memory.clear(); }
}
function validType(asset: AssetEntry, response: Response) {
  const type=response.headers.get('content-type')??'';
  return asset.kind==='texture' ? type.startsWith('image/') : !type.includes('text/html');
}
export function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{const url=URL.createObjectURL(blob);const image=new Image();
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Texture decode failed'));};image.src=url;});
}
