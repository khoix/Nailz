import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runScenario,captureScreenshot} from './browser-harness.mjs';

await runScenario('resource-soak',5193,async({page,url,artifactDir})=>{
 await page.goto(url+'/?soak=1');await page.locator('#qa-soak-start').waitFor();
 await page.locator('#qa-soak-start').click();
 await page.locator('#qa-soak-result[data-status="passed"]').waitFor({timeout:60000});
 const result=await page.evaluate(()=>window.__NAILZ_SOAK__);
 assert.equal(result.matches,10);
 assert.equal(result.samples.length,10);
 const first=result.samples[0];
 for(const sample of result.samples){
  assert.equal(sample.scene.geometries,first.scene.geometries);
  assert.equal(sample.scene.textures,first.scene.textures);
  assert.equal(sample.audio.voices,0);
  assert.equal(sample.audio.ambience,true);
  assert.equal(sample.audio.music,false);
 }
 await writeFile(`${artifactDir}/resource-soak.json`,JSON.stringify(result,null,2));
 await captureScreenshot(page,`${artifactDir}/complete.png`);
});
