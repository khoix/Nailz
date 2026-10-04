import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const scripts=['tests/duel-browser.mjs','tests/match-browser.mjs','tests/solo-matches-browser.mjs'];
const results=[];await mkdir('artifacts/e2e',{recursive:true});
for(const script of scripts) {
 const start=Date.now();
 const code=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script],{stdio:'inherit',env:{...process.env,NAILZ_E2E:'1'}});
  const timeout=setTimeout(()=>{child.kill('SIGTERM');},10*60*1000);
  child.on('error',error=>{clearTimeout(timeout);reject(error);});
  child.on('exit',(code,signal)=>{clearTimeout(timeout);resolve(signal?1:code??1);});
 });
 results.push({script,status:code===0?'passed':'failed',elapsedMs:Date.now()-start});
 await writeFile('artifacts/e2e/summary.json',JSON.stringify({target:'production build served by vite preview',results},null,2));
 if(code!==0){process.exitCode=1;break;}
}
