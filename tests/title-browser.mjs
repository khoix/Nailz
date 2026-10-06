import assert from 'node:assert/strict';
import {runScenario,captureScreenshot} from './browser-harness.mjs';
/** Title flow: early tap, late tap, repeated taps, keyboard activation, retry with preserved intent, and gesture isolation. */
await runScenario('title-flow',5191,async({page,url,artifactDir})=>{
 await page.addInitScript(()=>{const Native=window.AudioContext;window.audioContexts=0;window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContexts++;}};});
 // Early tap: hold the second texture so the title is still loading when the user taps.
 let release,pending=Promise.resolve();const held=new Promise(r=>release=r);
 await page.route('**/assets/endgrain.svg?*',route=>{pending=held.then(()=>route.continue());});
 await page.goto(url);
 const tap=page.locator('#tap-to-play');await tap.waitFor();
 assert.equal(await page.locator('#app').getAttribute('data-startup'),'loading');
 assert.equal(await page.evaluate(()=>window.audioContexts),0,'No audio before activation');
 await tap.click();
 assert.equal(await page.locator('#app').getAttribute('data-startup'),'getting-ready','Early tap records intent while loading continues');
 assert.equal(await page.evaluate(()=>window.audioContexts),1,'Early tap activates the shared AudioContext inside the gesture');
 assert.equal(await tap.textContent(),'Getting ready…');assert.equal(await page.locator('#begin').count(),0);
 await captureScreenshot(page,`${artifactDir}/getting-ready.png`);
 release();await pending;await page.unroute('**/assets/endgrain.svg?*');
 await page.locator('#begin').waitFor();
 assert.equal(await page.locator('#title-screen').count(),0,'Readiness after intent enters mode selection automatically');
 assert.equal(await page.locator('#app').getAttribute('data-phase'),'MATCH_INTRO','The title tap never leaks into the menu or aim');
 assert.equal(await page.evaluate(()=>window.audioContexts),1);
 // Late tap with repeated activations and keyboard entry.
 await page.reload();await tap.waitFor();await page.waitForFunction(()=>document.querySelector('#app').dataset.startup==='awaiting-intent');
 assert.equal(await page.locator('#begin').count(),0,'Loading completion never enters by itself');
 await captureScreenshot(page,`${artifactDir}/tap-to-play.png`);
 await tap.focus();await page.keyboard.press('Enter');await page.locator('#begin').waitFor();
 assert.equal(await page.evaluate(()=>window.audioContexts),1,'Keyboard activation owns one context');
 await page.reload();await tap.waitFor();await page.waitForFunction(()=>document.querySelector('#app').dataset.startup==='awaiting-intent');
 await page.evaluate(()=>{const b=document.querySelector('#tap-to-play');b.click();b.click();b.click();});await page.locator('#begin').waitFor();
 assert.equal(await page.locator('.duel-ui').count(),1,'Repeated taps mount the game once');
 // Failure, then Retry after intent: no second tap required.
 await page.evaluate(async()=>{for(const key of await caches.keys())if(key.startsWith('nailz-'))await caches.delete(key);});
 let fail,failPending=Promise.resolve();const failHeld=new Promise(r=>fail=r);
 await page.route('**/assets/endgrain.svg?*',r=>{failPending=failHeld.then(()=>r.fulfill({status:200,contentType:'image/svg+xml',body:'invalid image'}));});
 await page.reload();await tap.waitFor();await tap.click();
 assert.equal(await page.locator('#app').getAttribute('data-startup'),'getting-ready');
 fail();await failPending;await page.locator('#load-retry').waitFor();assert.equal(await tap.isVisible(),false);
 assert.equal(await page.locator('#title-screen').getAttribute('data-intent'),'true','Failure keeps the recorded intent');
 await page.unroute('**/assets/endgrain.svg?*');await page.locator('#load-retry').click();
 await page.locator('#begin').waitFor();assert.equal(await page.locator('#title-screen').count(),0,'Retry after intent enters without another tap');
 console.log('Early tap, auto-entry, late tap, keyboard activation, repeated taps, and retry with preserved intent passed.');
});
