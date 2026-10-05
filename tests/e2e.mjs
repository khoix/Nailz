import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const scenarios=[
 {name:'audio-settings',script:'tests/audio-browser.mjs',args:[]},
 {name:'asset-loading',script:'tests/loading-browser.mjs',args:[]},
 {name:'solo-controls',script:'tests/duel-browser.mjs',args:[]},
 {name:'local-matches',script:'tests/match-browser.mjs',args:[]},
 ...['easy','normal','hard','champion'].map(difficulty=>({name:`solo-${difficulty}`,script:'tests/solo-matches-browser.mjs',args:[difficulty]})),
];
const requested=process.argv.slice(2);
if(requested.length>1||requested.length===1&&!scenarios.some(({name})=>name===requested[0])) {
 console.error(`Usage: node tests/e2e.mjs [${scenarios.map(({name})=>name).join('|')}]`);process.exit(1);
}
const selected=requested.length?scenarios.filter(({name})=>name===requested[0]):scenarios;
const results=[];await mkdir('artifacts/e2e',{recursive:true});
for(const {name,script,args} of selected) {
 const start=Date.now();
 console.log(`${new Date().toISOString()} START ${name}`);
 const outcome=await new Promise(resolve=>{
  let timedOut=false,killTimer;
  const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,NAILZ_E2E:'1'}});
  const timeout=setTimeout(()=>{
   timedOut=true;console.error(`TIMEOUT ${name}: exceeded the 10-minute scenario budget`);
   child.kill('SIGTERM');killTimer=setTimeout(()=>child.kill('SIGKILL'),5000);
  },10*60*1000);
  const finish=result=>{clearTimeout(timeout);clearTimeout(killTimer);resolve({...result,timedOut});};
  child.on('error',error=>finish({exitCode:1,error:error.message}));
  child.on('close',(exitCode,signal)=>finish({exitCode:exitCode??1,signal}));
 });
 const passed=outcome.exitCode===0&&!outcome.timedOut;
 results.push({name,script,args,status:passed?'passed':'failed',elapsedMs:Date.now()-start,...outcome});
 await writeFile('artifacts/e2e/summary.json',JSON.stringify({target:'production build served by vite preview',results},null,2));
 console.log(`${new Date().toISOString()} ${passed?'PASS':'FAIL'} ${name} (${Date.now()-start} ms)`);
 if(!passed){process.exitCode=1;break;}
}
