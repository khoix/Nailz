import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Preloader,CACHE_PREFIX} from '../src/assets/loader.ts';
import type {AssetManifest} from '../src/assets/contracts.ts';
const manifest:AssetManifest={version:'test-2',assets:[{id:'wood',url:'/wood.svg',version:'2',kind:'texture',required:true}]};
function fakeStorage(){
 const buckets=new Map<string,Map<string,Response>>();
 return {buckets,storage:{
  async open(name:string){const items=buckets.get(name)??new Map();buckets.set(name,items);return {
   async match(key:string){return items.get(key)?.clone();},async put(key:string,value:Response){items.set(key,value.clone());},async delete(key:string){return items.delete(key);},
  };},async keys(){return [...buckets.keys()];},async delete(name:string){return buckets.delete(name);},
 } as unknown as CacheStorage};
}
const image=()=>new Response('<svg/>',{headers:{'content-type':'image/svg+xml'}});
test('cold fetch, warm cache and session reuse honor versioned URLs',async()=>{
 const {storage}=fakeStorage();const requests:string[]=[];
 const fetcher=(async(url:RequestInfo|URL)=>{requests.push(String(url));return image();}) as typeof fetch;
 const first=new Preloader(storage,fetcher);await first.prepare(manifest,()=>{});await first.prepare(manifest,()=>{});
 await new Preloader(storage,fetcher).prepare(manifest,()=>{});
 assert.deepEqual(requests,['/wood.svg?v=2']);assert.ok(first.get(manifest.assets[0]!)?.size);
 const newer={...manifest,version:'test-3',assets:[{...manifest.assets[0]!,version:'3'}]};
 await first.prepare(newer,()=>{});assert.equal(requests[1],'/wood.svg?v=3');
});
test('required failure remains retryable and HTTP errors are never cached',async()=>{
 const {storage,buckets}=fakeStorage();let failing=true;
 const loader=new Preloader(storage,(async()=>failing?new Response('bad',{status:503}):image()) as typeof fetch);
 const stages:string[]=[];await assert.rejects(loader.prepare(manifest,p=>stages.push(p.stage)));
 assert.equal(stages.at(-1),'failed');assert.equal(buckets.get(CACHE_PREFIX+manifest.version)?.size,0);
 failing=false;await loader.prepare(manifest,()=>{});assert.ok(loader.get(manifest.assets[0]!));
});
test('denied storage and quota failure fall back to usable memory',async()=>{
 for(const storage of [{async open(){throw Error('denied');}}, {async open(){return {async match(){throw Error('denied');},async put(){throw Error('quota');}};}}]){
  const loader=new Preloader(storage as unknown as CacheStorage,(async()=>image()) as typeof fetch);
  await loader.prepare(manifest,()=>{});assert.ok(loader.get(manifest.assets[0]!));await loader.ready(manifest);
 }
});
test('bad cached response is refetched; old game caches retired only after readiness',async()=>{
 const {storage,buckets}=fakeStorage();await storage.open(CACHE_PREFIX+'old');await storage.open('other-app');
 const cache=await storage.open(CACHE_PREFIX+manifest.version);await cache.put('/wood.svg?v=2',new Response('<html/>',{headers:{'content-type':'text/html'}}));
 let fetched=0;const loader=new Preloader(storage,(async()=>{fetched++;return image();}) as typeof fetch);
 await loader.prepare(manifest,()=>{});assert.equal(fetched,1);assert.ok(buckets.has(CACHE_PREFIX+'old'));
 await loader.ready(manifest);assert.ok(!buckets.has(CACHE_PREFIX+'old'));assert.ok(buckets.has('other-app'));
 await loader.invalidate(manifest.assets[0]!);await loader.prepare(manifest,()=>{});assert.equal(fetched,2);
});
test('optional missing music does not block required assets; abort is respected',async()=>{
 const loader=new Preloader(undefined,(async(url:RequestInfo|URL)=>String(url).includes('music')?new Response('',{status:404}):image()) as typeof fetch);
 await loader.prepare({...manifest,assets:[...manifest.assets,{id:'optional',url:'/music',version:'1',kind:'music',required:false}]},()=>{});
 const abort=new AbortController();abort.abort();await assert.rejects(loader.prepare(manifest,()=>{},abort.signal));
});
