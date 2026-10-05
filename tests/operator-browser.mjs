import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runScenario,captureScreenshot} from './browser-harness.mjs';
await runScenario('operator-poses',5182,async({page,url,artifactDir})=>{
 await page.goto(url+'/?lab');await page.locator('#pose').waitFor();
 const names=['Idle','Setup','Aim','Ready','Swing','Contact','Human ready','Human swing','Human contact','Human rebound','Local P2 contact','Normal rebound','Glancing rebound','Straighten','Near flush','One hit','Losing','Confident','Host celebration'];
 const results=[];
 for(const name of names){
  await page.selectOption('#animation-case',name);await page.locator('#pose').click();
  const state=JSON.parse(await page.locator('.inspector').getAttribute('data-animation'));results.push({name,...state});
  assert.ok(state.gripError<1e-8,'Operator wrist must coincide with the hammer grip');if(name==='Host celebration'){assert.equal(state.clip,'celebrate');assert.equal(state.holding,false);}if(name==='Swing')assert.equal(state.clip,'swing');if(name==='One hit')assert.equal(state.clip,'surprised');
  const human=name.startsWith('Human ')||name==='Local P2 contact';
  if(human)assert.ok(state.grip[2]>state.hammerFace[2]+.5,'Human handle must point toward the player throughout the action');
  if(name==='Contact'||name==='Human contact'||name==='Local P2 contact'){
   assert.ok(Math.abs(state.hammerDown[1]+1)<1e-8,'Head striking end must face straight down at contact');
   assert.ok(Math.abs(state.grip[1]-state.hammerFace[1]-.27)<1e-8,'Grip must sit above the head face with a horizontal handle');
   assert.ok(human?state.grip[2]>state.hammerFace[2]+.7:state.grip[2]<state.hammerFace[2]-.7,'Handle must extend toward the active wielder');
  }
  await page.addStyleTag({content:'.inspector,.masthead,.scene-caption {visibility:hidden}'});
  await captureScreenshot(page,`${artifactDir}/${name.toLowerCase().replaceAll(' ','-')}.png`);
  await page.addStyleTag({content:'.inspector,.masthead,.scene-caption {visibility:visible}'});
  await page.locator('#freeze-pose').click();const frozen=JSON.parse(await page.locator('.inspector').getAttribute('data-animation'));assert.deepEqual(frozen.pose,state.pose,`${name}: pause freezes every hand and head transform`);
  await page.locator('#restart-pose').click();const reset=JSON.parse(await page.locator('.inspector').getAttribute('data-animation'));assert.equal(reset.clip,'idle');assert.equal(reset.holding,false);
 }
 for(const view of ['target','impact']){await page.selectOption('#animation-case','Contact');await page.locator('#pose').click();await page.locator(`[data-view=${view}]`).click();await captureScreenshot(page,`${artifactDir}/contact-${view}.png`);}
 await page.setViewportSize({width:844,height:390});await page.selectOption('#animation-case','Swing');await page.locator('#pose').click();await captureScreenshot(page,`${artifactDir}/swing-landscape.png`);
 await writeFile(`${artifactDir}/poses.json`,JSON.stringify(results,null,2));
});
