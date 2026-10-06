import assert from 'node:assert/strict';
import {runScenario,enterGame,captureScreenshot} from './browser-harness.mjs';
/** E7 interface: keyboard aim/swing alternative, quality setting persistence, local records display, corrupt-storage fallback. */
await runScenario('interface',5192,async({page,url,artifactDir})=>{
 const phase=()=>page.locator('#app').getAttribute('data-phase');
 // Seeded records: solo Hard has history, local has history; the intro line must follow the selected mode/difficulty.
 await page.addInitScript(()=>{if(!localStorage.getItem('nailz-records-v1'))localStorage.setItem('nailz-records-v1',JSON.stringify({version:1,solo:{hard:{matches:4,wins:3,bestNails:4,bestPoints:900,fewestStrikes:8,oneHits:2}},local:{matches:2,p1Wins:1,p2Wins:1,oneHits:0}}));});
 await page.clock.install({time:new Date(10)});await page.goto(url);await enterGame(page);
 assert.equal(await page.locator('#records-line').textContent(),'','Normal has no record yet');
 await page.selectOption('#difficulty','hard');assert.match(await page.locator('#records-line').textContent(),/Hard: 3 wins in 4 matches · fewest strikes to win 8 · 2 one-hits/);
 await page.selectOption('#mode','pass-and-play');assert.match(await page.locator('#records-line').textContent(),/Pass & Play: 2 matches · Player 1 1 — 1 Player 2/);
 await page.selectOption('#mode','solo');await captureScreenshot(page,`${artifactDir}/records.png`);
 // Keyboard-only strike: Space locks each stage; holding Space swings with hold-based power.
 await page.locator('#begin').click();await page.clock.runFor(450);
 // Seeded clock keeps the human as first starter; if the operator starts, let its turn run through.
 for(let i=0;i<4&&(await phase()!=='TARGET_Y'||await page.locator('#app').getAttribute('data-actor')!=='p1');i++)await page.clock.runFor(1500);
 assert.equal(await page.locator('.duel-prompt').getAttribute('data-tutorial'),'true','First match in a mode shows the contextual tutorial');
 assert.match(await page.locator('#hint').textContent(),/First, the height/);
 await page.clock.runFor(200);await page.keyboard.press('Space');assert.equal(await phase(),'TARGET_X');
 await page.clock.runFor(450);await page.keyboard.press('Space');assert.equal(await phase(),'RETICLE');
 await page.clock.runFor(695);await page.keyboard.press('Enter');assert.equal(await phase(),'READY_TO_SWING');
 await page.clock.runFor(450);await page.keyboard.down('Space');await page.clock.runFor(120);await page.keyboard.up('Space');
 assert.equal(await phase(),'SWING','Keyboard hold-and-release swings through the normal resolver');
 await captureScreenshot(page,`${artifactDir}/keyboard-swing.png`);
 await page.clock.runFor(1200);
 if(await phase()==='ROUND_RESULT'){await page.locator('#begin').click();await page.clock.runFor(450);}
 await page.waitForFunction(()=>!document.querySelector('#pause').hidden);
 // Quality setting persists and is reflected after reload; the pause card hosts the control.
 await page.locator('#pause').click();await page.selectOption('#quality-setting','low');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('nailz-settings-v1')));assert.equal(saved.quality,'low');
 await page.reload();await enterGame(page);assert.equal(await page.locator('#quality-setting').inputValue(),'low');
 // Corrupt records never block the menu.
 await page.evaluate(()=>localStorage.setItem('nailz-records-v1','{broken'));await page.reload();await enterGame(page);
 assert.equal(await page.locator('#records-line').textContent(),'');
 console.log('Records display, keyboard strike, quality persistence, and corrupt-records fallback passed.');
});
