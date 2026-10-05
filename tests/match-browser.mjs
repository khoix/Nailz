import assert from 'node:assert/strict';
import { runScenario, captureScreenshot } from './browser-harness.mjs';
await runScenario('local-matches',5176,async ({page,errors,artifactDir,url})=>{
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});await page.clock.pauseAt(new Date('2026-10-04T17:00:01Z'));await page.goto(url);await page.locator('#begin').waitFor();
 await page.clock.setFixedTime(new Date(11));await page.selectOption('#mode','pass-and-play');assert.equal(await page.locator('#difficulty').isVisible(),false);
 await page.locator('#begin').click();await page.clock.runFor(450);
 const phase=()=>page.locator('#app').getAttribute('data-phase');const actor=()=>page.locator('#app').getAttribute('data-actor');
 assert.equal(await phase(),'TURN_HANDOFF');assert.equal(await actor(),'p1');await page.clock.runFor(5000);assert.equal(await phase(),'TURN_HANDOFF');
 // A finger already resting on the phone blocks a new ready press until every touch ends.
 await page.locator('#scene').dispatchEvent('pointerdown',{pointerId:99,pointerType:'touch',clientX:5,clientY:5});
 await page.locator('#ready').click();assert.equal(await phase(),'TURN_HANDOFF');
 await page.locator('#scene').dispatchEvent('pointerup',{pointerId:99,pointerType:'touch',clientX:5,clientY:5});
 const readyBox=await page.locator('#ready').boundingBox();await page.mouse.move(readyBox.x+20,readyBox.y+20);await page.mouse.down();
 await page.locator('#ready').dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});await page.mouse.up();assert.equal(await phase(),'TURN_HANDOFF');
 await page.locator('#pause').click();await page.locator('#resume').click();await page.clock.runFor(850);assert.equal(await phase(),'TURN_HANDOFF');
 // Background and rotation preserve the recipient and require a new ready gesture.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.equal(await page.locator('#pause-card').isVisible(),true);
 await page.evaluate(()=>{delete document.hidden;});await page.locator('#resume').click();await page.clock.runFor(850);
 await page.setViewportSize({width:844,height:390});await page.clock.runFor(100);await page.locator('#pause-card').waitFor({state:'visible'});
 await page.setViewportSize({width:390,height:844});await page.locator('#resume').click();await page.clock.runFor(850);
 assert.equal(await actor(),'p1');assert.equal(await phase(),'TURN_HANDOFF');
 await captureScreenshot(page,`${artifactDir}/handoff.png`);
 async function strike(weak=false) {
  await page.locator('#ready').click();assert.equal(await phase(),'NAIL_SETUP');
  await page.clock.runFor(850);assert.equal(await phase(),'TARGET_Y');
  await page.touchscreen.tap(300,600);assert.equal(await phase(),'TARGET_X');
  await page.clock.runFor(450);await page.touchscreen.tap(300,600);await page.clock.runFor(695);await page.touchscreen.tap(300,600);
  await page.clock.runFor(450);await page.mouse.move(195,400);await page.mouse.down();await page.clock.runFor(weak?600:120);await page.mouse.move(195,weak?480:740,{steps:8});await page.mouse.up();await page.clock.runFor(1500);
 }
 await strike(true);assert.equal(await phase(),'TURN_HANDOFF');assert.equal(await actor(),'p2');assert.match(await page.locator('#handoff-title').textContent(),/Pass to Player 2/);
 await page.clock.runFor(5000);assert.equal(await phase(),'TURN_HANDOFF');
 await strike();assert.equal(await phase(),'ROUND_RESULT');assert.match(await page.locator('#duel-card h2').textContent(),/Player 2/);
 console.log(`${new Date().toISOString()} local-matches: first match nail 1/5 complete`);
 await page.locator('#begin').click();await page.clock.runFor(450);assert.match(await page.locator('#handoff-title').textContent(),/Player 2 — Next nail/);
 for(let round=2;round<=5;round++) {
  assert.equal(await actor(),round%2===0?'p2':'p1');await strike();assert.equal(await phase(),'ROUND_RESULT');await page.locator('#begin').click();await page.clock.runFor(450);
  console.log(`${new Date().toISOString()} local-matches: first match nail ${round}/5 complete`);
 }
 assert.equal(await phase(),'MATCH_RESULT');assert.match(await page.locator('#duel-card h2').textContent(),/Player 2 wins/);assert.match(await page.locator('#match-score').textContent(),/2 — 3/);
 await captureScreenshot(page,`${artifactDir}/match-result.png`);
 await page.locator('#begin').click();await page.clock.runFor(450);assert.equal(await actor(),'p2');assert.equal(await phase(),'TURN_HANDOFF');assert.match(await page.locator('#match-score').textContent(),/0 — 0/);
 // Finish the rematch to exercise mode changes only at match boundaries.
 for(let round=1;round<=5;round++){await strike();await page.locator('#begin').click();await page.clock.runFor(450);console.log(`${new Date().toISOString()} local-matches: rematch nail ${round}/5 complete`);}
 await page.locator('#choose-mode').click();assert.equal(await phase(),'MATCH_INTRO');await page.selectOption('#mode','solo');assert.equal(await page.locator('#difficulty').isVisible(),true);
 await page.selectOption('#difficulty','champion');await page.locator('#begin').click();await page.clock.runFor(450);assert.notEqual(await phase(),'TURN_HANDOFF');assert.match(await page.locator('#match-score').textContent(),/Player.*0 — 0.*Operator/);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',localMatches:2,allFiveNails:true,freshTouch:true,cancel:true,pause:true,background:true,rotation:true,samePersonReady:true,rematchSwap:true,modeChange:true,errors}));
});
