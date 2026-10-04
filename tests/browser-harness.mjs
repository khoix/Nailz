import { chromium } from 'playwright';
import { createServer, preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

/** Keep screenshot failure part of the scenario, including on CPU-only CI runners. */
export async function captureScreenshot(page, path) {
 // Software WebGL can queue more GPU work than CI finishes within the action timeout.
 return page.screenshot({path,timeout:60000});
}

/** Same UI scenarios can target Vite development or the actual dist build. */
export async function runScenario(name, port, scenario) {
 const production=process.env.NAILZ_E2E==='1';
 const artifactDir=`artifacts/${production?'e2e':'browser'}/${name}`;
 await mkdir(artifactDir,{recursive:true});
 const options={host:'127.0.0.1',port,strictPort:true};
 const server=production?await preview({preview:options}):await createServer({server:options});
 if(!production)await server.listen();
 let browser,context,page,failure,browserVersion;const errors=[];const started=Date.now();
 try {
  browser=await chromium.launch({channel:process.env.NAILZ_CHROMIUM_PATH?undefined:'chromium',executablePath:process.env.NAILZ_CHROMIUM_PATH||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  browserVersion=browser.version();console.log(`Browser ${browserVersion}; ${process.env.NAILZ_CHROMIUM_PATH?'custom executable':'chromium'}; headless`);
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:Number(process.env.NAILZ_BROWSER_DPR||1),hasTouch:true});
  // Avoid a continuous screencast competing with explicit WebGL captures while the game clock is paused.
  await context.tracing.start({screenshots:false,snapshots:true,sources:true});page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});
  page.on('requestfailed',r=>errors.push(`request: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`);});
  await scenario({page,errors,artifactDir,url:`http://127.0.0.1:${port}`});
  assert.deepEqual(errors,[],'Browser/runtime/network errors');
  console.log(`PASS ${name} (${production?'production':'development'})`);
 } catch(error) {
  failure=error;
  if(page) {await captureScreenshot(page,`${artifactDir}/failure.png`).catch(()=>{});await writeFile(`${artifactDir}/failure.html`,await page.content().catch(()=>''));}
  throw error;
 } finally {
  await writeFile(`${artifactDir}/result.json`,JSON.stringify({name,browserVersion,browserChannel:process.env.NAILZ_CHROMIUM_PATH?'custom executable':'chromium',deviceScaleFactor:Number(process.env.NAILZ_BROWSER_DPR||1),target:production?'production dist':'development',status:failure?'failed':'passed',elapsedMs:Date.now()-started,errors,failure:failure?.stack??null},null,2));
  await context?.tracing.stop({path:`${artifactDir}/trace.zip`}).catch(()=>{});
  await browser?.close();
  if(production)await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));else await server.close();
 }
}
