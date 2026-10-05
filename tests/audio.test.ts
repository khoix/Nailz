import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/audio/controller.ts';
import type {Preloader} from '../src/assets/loader.ts';
import {Duel} from '../src/game/duel.ts';
import {createNail,resolveStrike} from '../src/game/strike.ts';

class Param {value=0;setTargetAtTime(v:number){this.value=v;}setValueAtTime(v:number){this.value=v;}cancelScheduledValues(){}exponentialRampToValueAtTime(v:number){this.value=v;}}
class Node {
 static finishImmediately=true;
 gain=new Param();frequency=new Param();type='';loop=false;buffer:unknown;onended:(()=>void)|null=null;starts=0;stops=0;disconnected=false;
 connect(){}disconnect(){this.disconnected=true;}start(){this.starts++;}stop(){this.stops++;if(Node.finishImmediately)this.onended?.();}
}
class Context {
 static instances:Context[]=[];state='suspended';currentTime=0;sampleRate=1000;destination={};nodes:Node[]=[];decoded=0;failDecode=false;
 constructor(){Context.instances.push(this);}
 createGain(){return this.node();}createBiquadFilter(){return this.node();}createBufferSource(){return this.node();}createOscillator(){return this.node();}
 node(){const n=new Node();this.nodes.push(n);return n;}
 createBuffer(_channels:number,length:number){return {getChannelData:()=>new Float32Array(length)};}
 async decodeAudioData(){this.decoded++;if(this.failDecode)throw Error('corrupt');return this.createBuffer(1,100);}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const snapshot=new Duel(11).snapshot;
const music={url:'/test-only-track',version:'test',gain:.5,loop:true};

test('audio owns one context, ambience and music across repeated gestures, pause and mute',async()=>{
 const oldContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});Object.defineProperty(globalThis,'document',{value:{hidden:false},configurable:true});
 let audio:ReturnType<typeof createAudio>|undefined;
 try {
  Context.instances=[];let loads=0;
  const loader={prepare:async()=>{loads++;},get:()=>new Blob(['test-only decoded data'])} as unknown as Preloader;
  audio=createAudio(loader,music);assert.equal(Context.instances.length,0,'no audio before gesture');
  audio.activate();audio.activate();await settle();const context=Context.instances[0]!;
  assert.equal(Context.instances.length,1);assert.equal(loads,1);assert.equal(context.decoded,1);
  assert.equal(context.nodes.filter(n=>n.starts).length,2,'one nonmusical ambience and one optional track');
  audio.observe({...snapshot,paused:true});await settle();assert.equal(context.state,'suspended');
  audio.activate();await settle();assert.equal(context.state,'suspended','settings gesture cannot resume a paused track');
  audio.update({muted:true});audio.observe(snapshot);await settle();assert.equal(context.state,'running');
  assert.equal(context.nodes[0]!.gain.value,0);assert.equal(context.nodes[1]!.gain.value,0);
  audio.update({muted:false,effects:.2,music:.7});assert.equal(context.nodes[0]!.gain.value,.2);assert.equal(context.nodes[1]!.gain.value,.35);
  for(let i=0;i<20;i++){audio.observe({...snapshot,paused:true});audio.activate();await settle();audio.observe(snapshot);await settle();}
  assert.equal(loads,1);assert.equal(context.nodes.filter(n=>n.starts).length,2,'no duplicated loops over repeated sessions');
  const hit=resolveStrike(createNail(),{actor:'p1',offset:{x:0,y:0},swipePower:1,reticleQuality:1});
  for(let i=1;i<=100;i++)audio.observe({...snapshot,phase:'IMPACT_RESOLUTION',actionId:i,appliedActionId:i,lastResult:hit});
  assert.equal(context.nodes.filter(n=>n.starts&&!n.disconnected).length,2,'ended impact sources release their graph connections');
  audio.dispose();await settle();assert.equal(context.state,'closed');assert.ok(context.nodes.filter(n=>n.starts).every(n=>n.stops===1&&n.disconnected));
  audio.activate();await settle();assert.equal(Context.instances.length,1);
 }finally{audio?.dispose();if(oldContext)Object.defineProperty(globalThis,'AudioContext',oldContext);else Reflect.deleteProperty(globalThis,'AudioContext');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');}
});

test('optional track retries after failure and async completion cannot revive disposed audio',async()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});
 let audio:ReturnType<typeof createAudio>|undefined;
 try{
  let loads=0,ready=false;
  const loader={prepare:async()=>{loads++;if(!ready)throw Error('offline');},get:()=>new Blob(['test'])} as unknown as Preloader;
  audio=createAudio(loader,music);audio.activate();await settle();assert.equal(loads,1);
  ready=true;audio.activate();await settle();assert.equal(loads,2);assert.equal(Context.instances.at(-1)!.decoded,1);audio.dispose();
  let release!:()=>void;
  audio=createAudio({prepare:()=>new Promise<void>(resolve=>{release=resolve;}),get:()=>new Blob(['late'])} as unknown as Preloader,music);
  audio.activate();await settle();const context=Context.instances.at(-1)!;audio.dispose();release();await settle();
  assert.equal(context.state,'closed');assert.equal(context.decoded,0);assert.equal(context.nodes.filter(n=>n.starts).length,1,'only ambience started before disposal');
 }finally{audio?.dispose();if(old)Object.defineProperty(globalThis,'AudioContext',old);else Reflect.deleteProperty(globalThis,'AudioContext');}
});


test('corrupt decoded music is invalidated and retried only on the next gesture',async()=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});
 let audio:ReturnType<typeof createAudio>|undefined;
 try{
  let invalidations=0,loads=0;
  const loader={prepare:async()=>{loads++;},get:()=>new Blob(['test']),invalidate:async()=>{invalidations++;}} as unknown as Preloader;
  audio=createAudio(loader,music);audio.activate();const context=Context.instances.at(-1)!;context.failDecode=true;await settle();
  assert.equal(invalidations,1);assert.equal(loads,1);assert.equal(context.nodes.filter(n=>n.starts).length,1);
  context.failDecode=false;audio.activate();await settle();assert.equal(loads,2);assert.equal(context.decoded,2);assert.equal(context.nodes.filter(n=>n.starts).length,2);
 }finally{audio?.dispose();if(old)Object.defineProperty(globalThis,'AudioContext',old);else Reflect.deleteProperty(globalThis,'AudioContext');}
});


test('overlapping impact effects obey the voice cap and release for the next contact',async()=>{
 const oldContext=Object.getOwnPropertyDescriptor(globalThis,'AudioContext'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});Object.defineProperty(globalThis,'document',{value:{hidden:false},configurable:true});
 let audio:ReturnType<typeof createAudio>|undefined;
 try{
  Node.finishImmediately=false;audio=createAudio({} as Preloader,null);audio.activate();await settle();const context=Context.instances.at(-1)!;
  const hit=resolveStrike(createNail(),{actor:'p1',offset:{x:0,y:0},swipePower:1,reticleQuality:1});
  for(let i=1;i<=100;i++)audio.observe({...snapshot,phase:'IMPACT_RESOLUTION',actionId:i,appliedActionId:i,lastResult:hit});
  assert.equal(context.nodes.filter(n=>n.starts&&!n.loop).length,16,'overlap is bounded even before ended events arrive');
  for(const node of context.nodes.filter(n=>n.starts&&!n.loop))node.onended?.();
  assert.equal(context.nodes.filter(n=>n.starts&&!n.disconnected).length,1,'only the ambience loop remains connected');
  audio.observe({...snapshot,phase:'IMPACT_RESOLUTION',actionId:101,appliedActionId:101,lastResult:hit});
  assert.ok(context.nodes.filter(n=>n.starts&&!n.disconnected).length>1,'new effects can play after cleanup');
 }finally{Node.finishImmediately=true;audio?.dispose();if(oldContext)Object.defineProperty(globalThis,'AudioContext',oldContext);else Reflect.deleteProperty(globalThis,'AudioContext');if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');}
});
