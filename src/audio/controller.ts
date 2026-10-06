import type { DuelSnapshot } from '../game/duel.ts';
import { ActionEvents, impactStyle } from '../effects/events.ts';
import type { Preloader } from '../assets/loader.ts';
import { ASSET_CACHE_VERSION } from '../assets/version.ts';
import { MUSIC, type MusicConfig } from './config.ts';
export type QualityTier='high'|'low';
/** Player settings persisted under nailz-settings-v1; quality was added in E7 as an optional field (older saves default to high). */
export interface AudioSettings { effects:number; music:number; muted:boolean; haptics:boolean; reducedMotion:boolean; quality:QualityTier }
export function readSettings(storage?:Pick<Storage,'getItem'>):AudioSettings {
 const defaults:AudioSettings={effects:.65,music:.45,muted:false,haptics:false,reducedMotion:false,quality:'high'};
 try {const s=JSON.parse(storage?.getItem('nailz-settings-v1')??'null');if(!s||typeof s!=='object')return defaults;
  return {...defaults,...Object.fromEntries(['muted','haptics','reducedMotion'].map(k=>[k,typeof s[k]==='boolean'?s[k]:false])),effects:Number.isFinite(s.effects)?Math.max(0,Math.min(1,s.effects)):.65,music:Number.isFinite(s.music)?Math.max(0,Math.min(1,s.music)):.45,quality:s.quality==='low'?'low':'high'};
 }catch{return defaults;}
}
export function createAudio(loader:Preloader, music:MusicConfig|null=MUSIC) {
 let storage:Storage|undefined;try{storage=localStorage;}catch{}
 const settings=readSettings(storage),events=new ActionEvents();
 let context:AudioContext|undefined,fx:GainNode|undefined,musicGain:GainNode|undefined,source:AudioBufferSourceNode|undefined,buffer:AudioBuffer|undefined,loading:Promise<void>|undefined;
 let ambience:AudioBufferSourceNode|undefined,ambienceFilter:BiquadFilterNode|undefined,ambienceGain:GainNode|undefined;
 let paused=false,disposed=false;const voices=new Set<AudioScheduledSourceNode>();
 function gains(){if(!context)return;fx!.gain.setTargetAtTime(settings.muted||paused?0:settings.effects,context.currentTime,.025);musicGain!.gain.setTargetAtTime(settings.muted||paused?0:settings.music*(music?.gain??1),context.currentTime,.2);}
 // A quiet, nonmusical air/booth bed, synthesized once; no music placeholder.
 function startAmbience(){
  if(!context||ambience||disposed)return;
  const data=context.createBuffer(1,context.sampleRate*2,context.sampleRate),channel=data.getChannelData(0);
  let previous=0;for(let i=0;i<channel.length;i++){previous=(previous+(Math.random()*2-1)*.025)/1.025;channel[i]=previous;}
  // Taper the join to keep the loop free from a sharp click.
  const fade=Math.min(1024,channel.length/2);for(let i=0;i<fade;i++){channel[i]=channel[i]!*i/fade;channel[channel.length-1-i]=channel[channel.length-1-i]!*i/fade;}
  ambience=context.createBufferSource();ambience.buffer=data;ambience.loop=true;
  ambienceFilter=context.createBiquadFilter();ambienceFilter.type='lowpass';ambienceFilter.frequency.value=650;
  ambienceGain=context.createGain();ambienceGain.gain.value=.12;
  ambience.connect(ambienceFilter);ambienceFilter.connect(ambienceGain);ambienceGain.connect(fx!);ambience.start();
 }
 function reconcilePlayback(){
  if(!context||disposed)return;gains();
  if(paused){void context.suspend().catch(()=>{});return;}
  startAmbience();startMusic();
 }
 function startMusic(){if(!context||!buffer||source||disposed||paused)return;source=context.createBufferSource();source.buffer=buffer;source.loop=music?.loop??true;source.connect(musicGain!);musicGain!.gain.cancelScheduledValues(context.currentTime);musicGain!.gain.setValueAtTime(0,context.currentTime);source.start();gains();}
 async function loadMusic(){if(!music||!context||buffer||disposed)return;
  const entry={id:'user-music',url:music.url,version:music.version,kind:'music' as const,required:false};
  await loader.prepare({version:ASSET_CACHE_VERSION,assets:[entry]},()=>{});
  const blob=loader.get(entry);if(!blob||disposed)return;
  try{const decoded=await context.decodeAudioData(await blob.arrayBuffer());if(disposed)return;buffer=decoded;reconcilePlayback();}catch{await loader.invalidate(entry);/* Retry a corrupt cached file on a later gesture. */}
 }
 function activate(){ // Call synchronously from the input gesture, before any await.
  if(disposed)return;
  try{if(!context){context=new AudioContext();fx=context.createGain();musicGain=context.createGain();fx.connect(context.destination);musicGain.connect(context.destination);musicGain.gain.value=0;gains();}
   if(!paused)void context.resume().then(reconcilePlayback).catch(()=>{});
   if(music&&!buffer&&!loading)loading=loadMusic().catch(()=>{}).finally(()=>{loading=undefined;});
  }catch{/* Unsupported/denied audio leaves the game playable. */}
 }
 function sound(frequency:number,duration:number,gain:number,noise=false){
  if(!context||context.state!=='running'||settings.muted||paused||settings.effects===0||voices.size>=16)return;
  const now=context.currentTime,envelope=context.createGain();envelope.connect(fx!);envelope.gain.setValueAtTime(Math.max(.0001,gain),now);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
  let voice:AudioBufferSourceNode|OscillatorNode;
  if(noise){voice=context.createBufferSource();const data=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate);const channel=data.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*Math.exp(-i/channel.length*3);voice.buffer=data;
   const filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=frequency;voice.connect(filter);filter.connect(envelope);voice.onended=()=>{voices.delete(voice);voice.disconnect();filter.disconnect();envelope.disconnect();};
  }else{voice=context.createOscillator();voice.type='triangle';voice.frequency.setValueAtTime(frequency,now);voice.frequency.exponentialRampToValueAtTime(Math.max(25,frequency*.32),now+duration);voice.connect(envelope);voice.onended=()=>{voices.delete(voice);voice.disconnect();envelope.disconnect();};}
  voices.add(voice);voice.start(now);voice.stop(now+duration);
 }
 function observe(s:DuelSnapshot){
  const nextPaused=s.paused||s.resumeIn>0||document.hidden;
  if(nextPaused!==paused){paused=nextPaused;gains();if(paused){for(const voice of voices)try{voice.stop();}catch{}void context?.suspend().catch(()=>{});}else void context?.resume().then(reconcilePlayback).catch(()=>{});}
  const event=events.sample(s);
  if(event.swing)sound(950,.16,.11,true);
  if(event.contact){const style=impactStyle(event.contact);
   if(event.contact.contact){sound(120,.2,.3*style.intensity);sound(style.kind==='glance'?2100:1400,.13,.16*style.intensity,true);sound(760,.07,.08*style.intensity);if(event.contact.finishing)sound(260,.35,.16,true);}
   else sound(420,.08,.05,true);
   if(settings.haptics&&!paused&&typeof navigator.vibrate==='function')try{navigator.vibrate(event.contact.oneHit?[20,25,35]:event.contact.contact?12:5);}catch{}
  }
 }
 function update(next:Partial<AudioSettings>){Object.assign(settings,next);try{storage?.setItem('nailz-settings-v1',JSON.stringify(settings));}catch{}gains();}
 return {settings,activate,observe,update,diagnostics(){return {state:context?.state??'locked',voices:voices.size,ambience:Boolean(ambience),music:Boolean(source),musicBuffered:Boolean(buffer),loading:Boolean(loading),disposed};},dispose(){if(disposed)return;disposed=true;for(const voice of voices)try{voice.stop();}catch{}try{source?.stop();}catch{}source?.disconnect();try{ambience?.stop();}catch{}ambience?.disconnect();ambienceFilter?.disconnect();ambienceGain?.disconnect();source=undefined;ambience=undefined;ambienceFilter=undefined;ambienceGain=undefined;voices.clear();buffer=undefined;fx?.disconnect();musicGain?.disconnect();void context?.close().catch(()=>{});},get state(){return context?.state??'locked';}};
}
export type GameAudio=ReturnType<typeof createAudio>;
