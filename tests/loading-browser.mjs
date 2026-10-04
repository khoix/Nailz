import assert from 'node:assert/strict';
import {runScenario} from './browser-harness.mjs';
await runScenario('asset-loading',5179,async({page,url})=>{
 const fetched=[];page.on('request',r=>{if(r.url().includes('/assets/')&&r.url().includes('.svg'))fetched.push(r.url());});
 await page.goto(url);await page.locator('#begin').waitFor();assert.equal(fetched.length,2);
 let keys=await page.evaluate(()=>caches.keys());assert.ok(keys.includes('nailz-assets-e4-1'));
 await page.evaluate(async()=>{await caches.open('nailz-assets-obsolete');await caches.open('unrelated-cache');});
 fetched.length=0;await page.reload();await page.locator('#begin').waitFor();assert.equal(fetched.length,0,'Warm start must reuse Cache Storage');
 keys=await page.evaluate(()=>caches.keys());assert.ok(!keys.includes('nailz-assets-obsolete'));assert.ok(keys.includes('unrelated-cache'));
 // An invalid cached response is discarded and replaced by a successful network image.
 await page.evaluate(async()=>{const c=await caches.open('nailz-assets-e4-1');await c.put('/assets/endgrain.svg?v=1',new Response('bad',{status:503}));});
 fetched.length=0;await page.reload();await page.locator('#begin').waitFor();assert.equal(fetched.length,1);
 // Successful HTTP but corrupt image must expose Retry and invalidate its cached bytes.
 await page.evaluate(()=>caches.delete('nailz-assets-e4-1'));
 await page.route('**/assets/endgrain.svg?*',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'invalid image'}));
 await page.reload();await page.locator('#load-retry').waitFor();assert.equal(await page.locator('#begin').count(),0);
 await page.unroute('**/assets/endgrain.svg?*');await page.locator('#load-retry').click();await page.locator('#begin').waitFor();
 // Access to Cache Storage itself may throw in restricted browsers.
 await page.addInitScript(()=>Object.defineProperty(window,'caches',{configurable:true,get(){throw Error('storage denied by test');}}));
 fetched.length=0;await page.goto(url+'/?quality=low');await page.locator('#begin').waitFor();assert.equal(fetched.length,2);
 assert.equal(await page.locator('#app').getAttribute('data-loading'),'ready');
 console.log('Cold/warm load, obsolete cache retirement, corrupt-cache refetch, decode retry, storage denial and low quality passed.');
});
