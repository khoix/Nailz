import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runScenario,captureScreenshot} from './browser-harness.mjs';
await runScenario('environment',5178,async({page,url,artifactDir})=>{
 await page.goto(url+'/?lab');await page.locator('#resolve').waitFor();
 const shots=[];
 for(const [width,height] of [[390,844],[844,390]]){
  await page.setViewportSize({width,height});
  for(const view of ['booth','target','impact']){
   await page.locator(`[data-view=${view}]`).click();
   await page.addStyleTag({content:'.inspector,.masthead,.scene-caption {visibility:hidden}'});
   const file=`${artifactDir}/${view}-${width}.png`;await captureScreenshot(page,file);shots.push(file);
   await page.addStyleTag({content:'.inspector,.masthead,.scene-caption {visibility:visible}'});
  }
 }
 await page.selectOption('#fixture','Perfect finish');await page.locator('#resolve').click();
 assert.match(await page.locator('#result').textContent(),/ONE HIT/);
 await page.selectOption('#fixture','Left glance');await page.locator('#resolve').click();
 assert.match(await page.locator('#result').textContent(),/Bend/);
 await page.locator('#profile').click();await page.waitForFunction(()=>document.querySelector('.inspector').dataset.profile);
 const profile=JSON.parse(await page.locator('.inspector').getAttribute('data-profile'));
 await writeFile(`${artifactDir}/views.json`,JSON.stringify({shots,profile,deviceScaleFactor:process.env.NAILZ_BROWSER_DPR||1,renderer:'Chromium SwiftShader; CPU submission cost, not hardware GPU frame rate'},null,2));
});
