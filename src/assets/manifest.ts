import type { AssetManifest } from './contracts.ts';
export const BOOTH_MANIFEST: AssetManifest = {version:'e4-1',assets:[
  {id:'endgrain',url:import.meta.env.BASE_URL+'assets/endgrain.svg',version:'1',kind:'texture',required:true},
  {id:'marquee',url:import.meta.env.BASE_URL+'assets/marquee.svg',version:'1',kind:'texture',required:true},
]};
