import type { AssetManifest } from './contracts.ts';
import { ASSET_CACHE_VERSION } from './version.ts';
export const BOOTH_MANIFEST: AssetManifest = {version:ASSET_CACHE_VERSION,assets:[
  {id:'endgrain',url:import.meta.env.BASE_URL+'assets/endgrain.svg',version:'1',kind:'texture',required:true},
  {id:'marquee',url:import.meta.env.BASE_URL+'assets/marquee.svg',version:'1',kind:'texture',required:true},
]};
