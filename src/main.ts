import './style.css';
import * as THREE from 'three';
import { createScene, type NailzScene } from './scene/createScene.ts';
import { mountDuel } from './ui/duelUI.ts';
import { Preloader, decodeImage } from './assets/loader.ts';
import { BOOTH_MANIFEST } from './assets/manifest.ts';
const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const app=document.querySelector<HTMLElement>('#app')!;
const loading=document.createElement('section');loading.className='loading-card';loading.setAttribute('aria-live','polite');
loading.innerHTML='<span class="eyebrow">NAILZ! / NIGHT CARNIVAL</span><h2 id="load-stage">Loading booth…</h2><p id="load-detail">Preparing the stage.</p><button id="load-retry" class="play-button" hidden>Retry</button>';
app.append(loading);
let storage:CacheStorage|undefined;try{storage=window.caches;}catch{}
const loader=new Preloader(storage), textures=new Map<string,THREE.Texture>();
let scene:NailzScene|undefined,cleanup:(()=>void)|undefined,busy=false,disposed=false;
const abort=new AbortController();
async function start(){
 if(busy||disposed)return;busy=true;loading.querySelector('button')!.hidden=true;app.dataset.loading='fetching';
 try {
  await loader.prepare(BOOTH_MANIFEST,p=>{
   loading.querySelector('h2')!.textContent=p.stage==='preparing'?'Preparing game…':'Loading booth…';
   loading.querySelector('p')!.textContent=`${p.ready} / ${p.total} essential assets loaded`;
  },abort.signal);
  app.dataset.loading='preparing';
  for(const asset of BOOTH_MANIFEST.assets){
   if(textures.has(asset.id))continue;
   try{const image=await decodeImage(loader.get(asset)!);const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;texture.anisotropy=2;textures.set(asset.id,texture);}
   catch(error){await loader.invalidate(asset);throw error;}
  }
  if(disposed)return;
  scene=createScene(canvas,textures);await scene.prepare();
  if(disposed){scene.dispose();return;}
  await loader.ready(BOOTH_MANIFEST);
  if(import.meta.env.DEV&&new URLSearchParams(location.search).has('lab')){
   const {mountInspector}=await import('./dev/inspector.ts');cleanup=mountInspector(scene);
  }else{
   document.querySelector('.masthead')?.remove();document.querySelector('.scene-caption')?.remove();cleanup=mountDuel(scene);
  }
  app.dataset.loading='ready';loading.remove();
 }catch(error){
  console.warn("Booth preparation failed",error);
  scene?.dispose();scene=undefined;app.dataset.loading='failed';loading.querySelector('h2')!.textContent='The booth couldn’t load.';
  loading.querySelector('p')!.textContent='Check your connection and try again.';loading.querySelector('button')!.hidden=false;
 }finally{busy=false;}
}
loading.querySelector('button')!.addEventListener('click',start);void start();
import.meta.hot?.dispose(()=>{disposed=true;abort.abort();cleanup?.();scene?.dispose();textures.forEach(t=>t.dispose());loader.dispose();loading.remove();});
