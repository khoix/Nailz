import assert from 'node:assert/strict';
import {runScenario,captureScreenshot,enterGame} from './browser-harness.mjs';

const mode=process.argv[2]??'normal';
assert.ok(['normal','muted','low'].includes(mode),'Expected normal, muted, or low');
const port={normal:5190,muted:5191,low:5192}[mode];

await runScenario(`visual-${mode}`,port,async({page,url,artifactDir})=>{
 await page.clock.install({time:new Date('2026-10-04T17:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-04T17:00:01Z'));
 const target=url+(mode==='low'?'/?quality=low':'');
 const phase=()=>page.locator('#app').getAttribute('data-phase');
 const actor=()=>page.locator('#app').getAttribute('data-actor');

 async function fresh(label){
  await page.goto(target);
  await enterGame(page);
  const sound=await page.locator('#sound').textContent();
  if(mode==='muted'&&sound!=='Sound off')await page.locator('#sound').click();
  assert.equal(await page.locator('#sound').textContent(),mode==='muted'?'Sound off':'Sound on');
  await page.clock.setFixedTime(new Date(11));
  if(label==='perfect')await captureScreenshot(page,`${artifactDir}/booth.png`);
  await page.locator('#begin').click();
  assert.equal(await actor(),'p1','validation seed must start with the human player');
 }

 async function strike({name,yMs,xMs,focusMs=695,swipeStart=400,swipeEnd=740,swipeMs=120,expected}){
  await fresh(name);
  await page.clock.runFor(400+yMs);
  assert.equal(await phase(),'TARGET_Y');
  if(name==='perfect')await captureScreenshot(page,`${artifactDir}/target.png`);
  await page.mouse.click(300,600);
  assert.equal(await phase(),'TARGET_X');
  await page.clock.runFor(xMs);await page.mouse.click(300,600);
  assert.equal(await phase(),'RETICLE');
  await page.clock.runFor(focusMs);await page.mouse.click(300,600);
  await page.clock.runFor(400);assert.equal(await phase(),'READY_TO_SWING');
  if(name==='perfect')await captureScreenshot(page,`${artifactDir}/raised.png`);
  await page.mouse.move(195,swipeStart);await page.mouse.down();await page.clock.runFor(swipeMs);await page.mouse.move(195,swipeEnd,{steps:8});await page.mouse.up();
  assert.equal(await phase(),'SWING');
  for(let i=0;i<20;i++){
   await page.clock.runFor(25);
   if(i===9)await captureScreenshot(page,`${artifactDir}/${name}-contact.png`);
   if(i===15)await captureScreenshot(page,`${artifactDir}/${name}-rebound.png`);
  }
  assert.match(await page.locator('#result-flash').textContent(),expected);
 }

 await strike({name:'miss',yMs:130,xMs:130,expected:/MISSED/});
 await strike({name:'normal',yMs:450,xMs:450,swipeStart:500,swipeEnd:640,swipeMs:220,expected:/SOLID HIT/});
 for(let i=0;i<120&&!(await actor()==='p2'&&await phase()==='IMPACT_RESOLUTION');i++)await page.clock.runFor(25);
 assert.equal(await actor(),'p2');assert.equal(await phase(),'IMPACT_RESOLUTION');
 await page.clock.runFor(150);await captureScreenshot(page,`${artifactDir}/operator-reaction.png`);
 await strike({name:'glance',yMs:450,xMs:310,expected:/GLANCING HIT/});
 await strike({name:'perfect',yMs:450,xMs:450,expected:/ONE HIT/});
 await page.clock.runFor(500);assert.equal(await phase(),'ROUND_RESULT');
 await captureScreenshot(page,`${artifactDir}/one-hit-finish.png`);
});
