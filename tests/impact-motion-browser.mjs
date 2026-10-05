import assert from 'node:assert/strict';
import {runScenario,captureScreenshot,enterGame} from './browser-harness.mjs';
// Optional recording: NAILZ_RECORD_VIDEO=1. Uses the public pointer flow only.
const mode=process.argv[2]??'normal';
if(!['normal','muted','low'].includes(mode))throw Error('Expected normal, muted or low');
await runScenario(`impact-motion-${mode}`,5188,async({page,url,artifactDir})=>{
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-04T17:00:01Z'));
 await page.goto(url+(mode==='low'?'/?quality=low':''));await enterGame(page);
 if(mode==='muted')await page.locator('#sound').click();
 await page.clock.setFixedTime(new Date(11));await page.locator('#begin').click();
 await page.clock.runFor(850);await page.mouse.click(300,600);
 await captureScreenshot(page,`${artifactDir}/target.png`);
 await page.clock.runFor(450);await page.mouse.click(300,600);
 await page.clock.runFor(695);await page.mouse.click(300,600);await page.clock.runFor(400);
 await captureScreenshot(page,`${artifactDir}/ready.png`);
 await page.mouse.move(195,400);await page.mouse.down();await page.clock.runFor(120);await page.mouse.move(195,740,{steps:8});await page.mouse.up();
 // Advance actual simulation in small increments so the screencast retains the arc.
 for(let i=0;i<24;i++){
  await page.clock.runFor(25);
  await page.screenshot({timeout:60000,...(i===9?{path:`${artifactDir}/contact.png`}:i===15?{path:`${artifactDir}/rebound.png`}:{})});
 }
 assert.match(await page.locator('#result-flash').textContent(),/ONE HIT/);
 await page.clock.runFor(400);assert.equal(await page.locator('#app').getAttribute('data-phase'),'ROUND_RESULT');
 await captureScreenshot(page,`${artifactDir}/finish.png`);
});
