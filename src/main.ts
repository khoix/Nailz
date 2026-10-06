import './style.css';
import * as THREE from 'three';
import { createScene, type NailzScene } from './scene/createScene.ts';
import { mountDuel } from './ui/duelUI.ts';
import { Preloader, decodeImage } from './assets/loader.ts';
import { createAudio } from './audio/controller.ts';
import { BOOTH_MANIFEST } from './assets/manifest.ts';
import { advanceStartup, createStartup, enterMenu, startupLabel, type StartupEvent } from './game/startup.ts';

const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const app=document.querySelector<HTMLElement>('#app')!;
const params=new URLSearchParams(location.search);
const bypassTitle=params.has('soak')||(import.meta.env.DEV&&params.has('lab'));

const startup=document.createElement('section');
if(bypassTitle){
 startup.className='loading-card';startup.setAttribute('aria-live','polite');
 startup.innerHTML='<span class="eyebrow">NAILZ! / NIGHT CARNIVAL</span><h2 id="load-stage">Loading booth…</h2><p id="load-detail">Preparing the stage.</p><button id="load-retry" class="play-button" hidden>Retry</button>';
}else{
 document.querySelector('.masthead')?.remove();document.querySelector('.scene-caption')?.remove();
 startup.id='title-screen';startup.className='title-screen';startup.setAttribute('aria-live','polite');
 startup.innerHTML=`<div class="title-panel">
   <span class="title-kicker">NIGHT CARNIVAL</span>
   <h1 class="title-wordmark">NAILZ<span>!</span></h1>
   <p class="title-tagline">PRECISION. POWER. ONE PERFECT HIT.</p>
   <div class="title-loader">
    <div class="title-progress-meta"><span id="load-stage">Loading carnival…</span><span id="load-percent">0%</span></div>
    <progress id="load-progress" max="100" value="0" aria-label="Game loading progress"></progress>
    <p id="load-detail">Setting up the booth.</p>
    <button id="tap-to-play" class="play-button title-play">Tap to Play <span>↗</span></button>
    <button id="load-retry" class="quiet-button" hidden>Retry loading</button>
   </div>
  </div>`;
}
app.append(startup);
// Prevent the raw server-rendered fallback markup from flashing before Vite's CSS
// and the real title screen are ready. Full styles are loaded before this module runs.
app.style.visibility='visible';

let storage:CacheStorage|undefined;try{storage=window.caches;}catch{}
const loader=new Preloader(storage),textures=new Map<string,THREE.Texture>();
const audio=createAudio(loader);
let scene:NailzScene|undefined,cleanup:(()=>void)|undefined,busy=false,disposed=false;
let state=createStartup(),mounted=false;
const abort=new AbortController();
const entered=()=>state.entered;

function setProgress(value:number,stage:string,detail:string){
 startup.querySelector<HTMLElement>('#load-stage')!.textContent=stage;
 startup.querySelector<HTMLElement>('#load-detail')!.textContent=detail;
 const bar=startup.querySelector<HTMLProgressElement>('#load-progress');if(bar)bar.value=value;
 const percent=startup.querySelector<HTMLElement>('#load-percent');if(percent)percent.textContent=`${Math.round(value)}%`;
}
/** Apply one startup event, reflect the pure state in the DOM, and enter the menu at most once. */
function dispatch(event:StartupEvent){
 state=enterMenu(advanceStartup(state,event));
 const label=startupLabel(state);
 startup.dataset.ready=String(state.assetsReady);startup.dataset.intent=String(state.playRequested);
 const tap=startup.querySelector<HTMLButtonElement>('#tap-to-play');
 if(tap){tap.hidden=label==='failed';tap.disabled=label==='getting-ready';tap.setAttribute('aria-busy',String(label==='getting-ready'));tap.innerHTML=label==='getting-ready'?'Getting ready…':'Tap to Play <span>↗</span>';}
 app.dataset.startup=label==='entered'?'playing':label==='failed'?'load-failed':label==='tap'?'awaiting-intent':label==='getting-ready'?'getting-ready':'loading';
 if(label==='entered'&&!mounted){mounted=true;if(bypassTitle)mountPreparedExperience();else mountGame();}
}
function showFailure(){
 app.dataset.loading='failed';
 setProgress(0,'The booth couldn’t load.','Check your connection and try again.');
 startup.querySelector<HTMLButtonElement>('#load-retry')!.hidden=false;
}
function mountPreparedExperience(){
 if(!scene||disposed)return;
 if(params.has('soak')){
  document.querySelector('.masthead')?.remove();document.querySelector('.scene-caption')?.remove();
  void import('./dev/resourceSoak.ts').then(({mountResourceSoak})=>{if(!disposed)cleanup=mountResourceSoak(scene!,audio);});
 }else if(import.meta.env.DEV&&params.has('lab')){
  void import('./dev/inspector.ts').then(({mountInspector})=>{if(!disposed)cleanup=mountInspector(scene!);});
 }
 startup.remove();
}
function mountGame(){
 if(!scene||disposed)return;
 cleanup=mountDuel(scene,audio);
 startup.remove();
}
/** The title button is live during loading: record intent and activate audio inside the gesture. Entry happens when assets are ready. */
function requestPlay(){
 if(entered()||disposed)return;
 audio.activate();dispatch({type:'audio',result:audio.state==='running'?'active':audio.state==='locked'?'blocked':'activating'});
 dispatch({type:'play'});
}
async function prepare(){
 if(busy||disposed)return;busy=true;app.dataset.loading='fetching';
 startup.querySelector<HTMLButtonElement>('#load-retry')!.hidden=true;
 dispatch({type:'retry'});
 setProgress(0,'Loading carnival…','Setting up the booth.');
 try{
  await loader.prepare(BOOTH_MANIFEST,p=>{
   const ratio=p.total?p.ready/p.total:1;
   const value=p.stage==='preparing'?70:Math.round(ratio*70);
   setProgress(value,p.stage==='preparing'?'Getting things ready…':'Loading carnival…','Setting up the booth.');
  },abort.signal);
  app.dataset.loading='preparing';
  const imageAssets=BOOTH_MANIFEST.assets.filter(asset=>asset.kind==='texture');let decoded=0;
  for(const asset of imageAssets){
   if(!textures.has(asset.id)){
    try{const image=await decodeImage(loader.get(asset)!);const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;texture.anisotropy=2;textures.set(asset.id,texture);}
    catch(error){await loader.invalidate(asset);throw error;}
   }
   decoded++;setProgress(70+Math.round(decoded/Math.max(1,imageAssets.length)*15),'Getting things ready…','Polishing the stage.');
  }
  if(disposed)return;
  setProgress(88,'Warming up the booth…','Almost there…');
  scene=createScene(canvas,textures);await scene.prepare();
  if(disposed){scene.dispose();return;}
  scene.setView('booth');
  setProgress(96,'Almost ready…','');
  await loader.ready(BOOTH_MANIFEST);
  app.dataset.loading='ready';setProgress(100,'','');
  if(bypassTitle)dispatch({type:'play'});
  dispatch({type:'assetsReady'});
 }catch(error){console.warn('Booth preparation failed',error);scene?.dispose();scene=undefined;dispatch({type:'assetError',message:String(error)});showFailure();}
 finally{busy=false;}
}
startup.querySelector<HTMLButtonElement>('#load-retry')!.addEventListener('click',prepare);
// Native button click covers pointer taps and Enter/Space keyboard activation. Click fires after pointerup,
// so the title gesture is already finished before the menu's pointer listeners mount.
startup.querySelector<HTMLButtonElement>('#tap-to-play')?.addEventListener('click',requestPlay);
dispatch({type:'retry'});
void prepare();

import.meta.hot?.dispose(()=>{disposed=true;abort.abort();cleanup?.();scene?.dispose();textures.forEach(t=>t.dispose());audio.dispose();loader.dispose();startup.remove();});
