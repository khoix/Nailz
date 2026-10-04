import { chromium as playwright } from 'playwright';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const server = await createServer({server:{host:'127.0.0.1',port:5174,strictPort:true}});
await server.listen();
await mkdir('artifacts',{recursive:true});
let browser;
try {
 browser = await playwright.launch({executablePath:process.env.NAILZ_CHROMIUM_PATH || undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],headless:true});
 const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5174/?lab');
 await page.locator('#resolve').waitFor();
 assert.equal(await page.locator('#notice').textContent(),'');
 await page.screenshot({path:'artifacts/e1-portrait.png'});
 await page.locator('#resolve').click();
 assert.match(await page.locator('#result').textContent(),/ONE HIT!.*100.0%/);
 await page.locator('#fixture').selectOption('Left glance');await page.locator('#resolve').click();
 assert.match(await page.locator('#result').textContent(),/Bend/);
 await page.getByRole('button',{name:'Impact',exact:true}).click();
 await page.screenshot({path:'artifacts/e1-glance.png'});
 await page.getByRole('button',{name:'Target',exact:true}).click();
 await page.locator('#reset').click();
 await page.screenshot({path:'artifacts/e1-target.png'});
 await page.setViewportSize({width:1280,height:800});await page.getByRole('button',{name:'Booth',exact:true}).click();
 await page.screenshot({path:'artifacts/e1-desktop.png'});
 for (const [width,height] of [[320,568],[844,390],[390,844]]) {
  await page.setViewportSize({width,height});
  const bounds=await page.locator('.inspector').boundingBox();assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width+1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'passed',views:['booth','target','impact'],viewports:['390x844','1280x800','320x568','844x390'],errors}));
} finally { await browser?.close(); await server.close(); }
