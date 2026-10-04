import assert from 'node:assert/strict';
import { runScenario, captureScreenshot } from './browser-harness.mjs';

const difficulties=['easy','normal','hard','champion'];
const requested=process.argv.slice(2);
assert.ok(requested.length<=1&&requested.every(difficulty=>difficulties.includes(difficulty)),'Expected one of: easy, normal, hard, champion');
for(const difficulty of requested.length?requested:difficulties) {
 await runScenario(`solo-${difficulty}`,5177,async({page,artifactDir,url})=>{
  await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});await page.clock.pauseAt(new Date('2026-10-04T17:00:01Z'));await page.goto(url);await page.locator('#begin').waitFor();
  // Fix the clock/seed, not the game state. All actions use the visible UI.
  await page.clock.setFixedTime(new Date(11));await page.selectOption('#difficulty',difficulty);await page.locator('#begin').click();
  const phase=()=>page.locator('#app').getAttribute('data-phase');
  const actor=()=>page.locator('#app').getAttribute('data-actor');
  const wins={Player:0,Operator:0};let humanStrikes=0,operatorTurns=0;
  async function humanStrike() {
   // Read the visible moving line to account for time already spent entering aim.
   const line=Number(await page.locator('#line-y').getAttribute('y1'));
   const elapsed=Math.acos(Math.max(-1,Math.min(1,-line/1.8)))*1.8/(2*Math.PI);
   assert.ok(elapsed<.2,'Runner must catch the beginning of the human aiming phase');
   await page.clock.runFor(Math.round((.45-elapsed)*1000));await page.touchscreen.tap(300,600);
   assert.equal(await phase(),'TARGET_X');await page.clock.runFor(450);await page.touchscreen.tap(300,600);
   assert.equal(await phase(),'RETICLE');await page.clock.runFor(695);await page.touchscreen.tap(300,600);
   await page.clock.runFor(400);assert.equal(await phase(),'READY_TO_SWING');
   await page.mouse.move(195,400);await page.mouse.down();await page.clock.runFor(120);await page.mouse.move(195,740,{steps:8});await page.mouse.up();
   assert.equal(await phase(),'SWING');humanStrikes++;
  }
  for(let round=1;round<=5;round++) {
   assert.match(await page.locator('#strike-count').textContent(),new RegExp(`NAIL ${round}/5`));
   let steps=0;let lastOperatorAction=false;
   while(await phase()!=='ROUND_RESULT') {
    assert.ok(++steps<1000,`Round ${round} must finish`);
    const currentPhase=await phase(),currentActor=await actor();
    assert.notEqual(currentPhase,'TURN_HANDOFF','Solo must not require passing the phone');
    if(currentActor==='p2'&&!lastOperatorAction)operatorTurns++;
    lastOperatorAction=currentActor==='p2';
    if(currentActor==='p1'&&currentPhase==='TARGET_Y')await humanStrike();
    else await page.clock.runFor(50);
   }
   const title=await page.locator('#duel-card h2').textContent();const winner=title.startsWith('Operator')?'Operator':'Player';wins[winner]++;
   assert.match(await page.locator('#match-score').textContent(),new RegExp(`Player\\s+${wins.Player} — ${wins.Operator}\\s+Operator`));
   console.log(`${new Date().toISOString()} solo-${difficulty}: nail ${round}/5 complete`);
   await page.locator('#begin').click();
  }
  assert.equal(await phase(),'MATCH_RESULT');assert.equal(wins.Player+wins.Operator,5);
  assert.match(await page.locator('#duel-card h2').textContent(),new RegExp(`^${wins.Player>wins.Operator?'Player':'Operator'} wins!`));
  assert.ok(humanStrikes>0);assert.ok(operatorTurns>0);await captureScreenshot(page,`${artifactDir}/results.png`);
  await page.locator('#begin').click();assert.match(await page.locator('#strike-count').textContent(),/NAIL 1\/5/);assert.match(await page.locator('#match-score').textContent(),/0 — 0.*0 \/ 0 pts/);
  console.log(JSON.stringify({difficulty,rounds:5,wins,humanStrikes,operatorTurns,rematchReset:true}));
 });
}
