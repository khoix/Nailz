import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runScenario,captureScreenshot} from './browser-harness.mjs';

await runScenario('resource-soak',5193,async({page,url,artifactDir})=>{
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-04T17:00:01Z'));
 await page.goto(url+'/?qa=1');await page.locator('#begin').waitFor();
 await page.clock.setFixedTime(new Date(11));await page.selectOption('#difficulty','normal');await page.locator('#begin').click();
 const phase=()=>page.locator('#app').getAttribute('data-phase');
 const actor=()=>page.locator('#app').getAttribute('data-actor');
 const samples=[];

 async function humanStrike(){
  const line=Number(await page.locator('#line-y').getAttribute('y1'));
  const elapsed=Math.acos(Math.max(-1,Math.min(1,-line/1.8)))*1.8/(2*Math.PI);
  assert.ok(elapsed<.2,'Runner must catch the beginning of the human aiming phase');
  await page.clock.runFor(Math.round((.45-elapsed)*1000));await page.touchscreen.tap(300,600);
  assert.equal(await phase(),'TARGET_X');await page.clock.runFor(450);await page.touchscreen.tap(300,600);
  assert.equal(await phase(),'RETICLE');await page.clock.runFor(695);await page.touchscreen.tap(300,600);
  await page.clock.runFor(400);assert.equal(await phase(),'READY_TO_SWING');
  await page.mouse.move(195,400);await page.mouse.down();await page.clock.runFor(120);await page.mouse.move(195,740,{steps:8});await page.mouse.up();
  assert.equal(await phase(),'SWING');
 }

 for(let match=1;match<=10;match++){
  for(let round=1;round<=5;round++){
   let steps=0;
   while(await phase()!=='ROUND_RESULT'){
    assert.ok(++steps<1200,`Match ${match} nail ${round} must finish`);
    if(await actor()==='p1'&&await phase()==='TARGET_Y')await humanStrike();
    else await page.clock.runFor(50);
   }
   await page.locator('#begin').click();
  }
  assert.equal(await phase(),'MATCH_RESULT');
  if(match===1)await captureScreenshot(page,`${artifactDir}/match-result.png`);
  await page.clock.runFor(3000);await page.waitForTimeout(450);
  const sample=await page.evaluate(()=>({
   scene:window.__NAILZ_QA__?.scene?.()??null,
   audio:window.__NAILZ_QA__?.audio?.()??null,
   heap:performance.memory?.usedJSHeapSize??null,
  }));
  assert.ok(sample.scene&&sample.audio,'QA diagnostics must be available only when explicitly requested');
  assert.equal(sample.audio.voices,0,'short audio voices must drain after every match');
  assert.equal(sample.audio.ambience,true,'one shared ambience loop must remain active');
  assert.equal(sample.audio.music,false,'no user music is configured in E6');
  samples.push({match,...sample});
  if(match>1){
   const first=samples[0];
   assert.equal(sample.scene.geometries,first.scene.geometries,'geometry count must remain stable across matches');
   assert.equal(sample.scene.textures,first.scene.textures,'texture count must remain stable across matches');
   assert.equal(sample.audio.ambience,first.audio.ambience);
   assert.equal(sample.audio.music,first.audio.music);
  }
  console.log(`resource-soak match ${match}/10: ${sample.scene.geometries} geometries, ${sample.scene.textures} textures, ${sample.audio.voices} short voices`);
  if(match<10)await page.locator('#begin').click();
 }
 await writeFile(`${artifactDir}/resource-soak.json`,JSON.stringify({matches:10,samples},null,2));
});
