import assert from 'node:assert/strict';
import {runScenario,captureScreenshot} from './browser-harness.mjs';
await runScenario('audio-settings',5184,async({page,url,artifactDir})=>{
 await page.addInitScript(()=>{const Native=window.AudioContext;window.audioContexts=0;window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContexts++;}};});
 const musicRequests=[];page.on('request',r=>{if(/\.(mp3|ogg|wav)(\?|$)/.test(r.url()))musicRequests.push(r.url());});
 await page.goto(url);await page.locator('#begin').waitFor();assert.equal(await page.evaluate(()=>window.audioContexts),0,'No context before user intent');
 await page.locator('#sound').click();await page.locator('#sound').click();assert.equal(await page.evaluate(()=>window.audioContexts),1,'One shared context across gestures');
 await page.locator('#begin').click();await page.locator('#pause').click();
 await page.locator('#motion-setting').check();await page.locator('#haptics-setting').check();
 await page.locator('#effects-volume').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');
 await page.locator('#sound').click();await captureScreenshot(page,`${artifactDir}/settings.png`);
 await page.reload();await page.locator('#begin').waitFor();assert.equal(await page.locator('#sound').textContent(),'Sound off');
 const settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('nailz-settings-v1')));assert.equal(settings.effects,.05);assert.equal(settings.reducedMotion,true);assert.equal(settings.haptics,true);
 assert.deepEqual(musicRequests,[],'Absent music must make no audio file requests');
 await page.addInitScript(()=>{window.AudioContext=class {constructor(){throw Error('Audio denied');}};});
 await page.goto(url+'/?quality=low');await page.locator('#begin').click();assert.notEqual(await page.locator('#app').getAttribute('data-phase'),'MATCH_INTRO','Audio failure cannot block play');
});
