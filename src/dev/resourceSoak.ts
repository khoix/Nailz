import {Duel,DUEL_TIMING} from '../game/duel.ts';
import type {GameAudio} from '../audio/controller.ts';
import type {NailzScene} from '../scene/createScene.ts';

const FOCUS_TIME=1.5/2.15;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));

export function mountResourceSoak(scene:NailzScene,audio:GameAudio):()=>void {
 const card=document.createElement('section');card.className='duel-card';card.id='qa-soak';
 card.innerHTML='<span class="eyebrow">E6 RESOURCE SOAK</span><h2>Production stress fixture</h2><p>Runs ten complete five-nail matches through the real duel, scene, effects, and audio ownership paths.</p><button id="qa-soak-start" class="play-button">Run soak</button><output id="qa-soak-result" aria-live="polite">Ready</output>';
 document.querySelector('#app')!.append(card);
 const button=card.querySelector<HTMLButtonElement>('#qa-soak-start')!,output=card.querySelector<HTMLOutputElement>('#qa-soak-result')!;
 let cancelled=false,running=false;
 async function run(){
  if(running)return;running=true;button.disabled=true;output.dataset.status='running';
  const samples:Array<{match:number;scene:ReturnType<NailzScene['metrics']>;audio:ReturnType<GameAudio['diagnostics']>}>=[];let first:{geometries:number;textures:number}|undefined;
  try{
   for(let match=1;match<=10&&!cancelled;match++){
    const game=new Duel(7000+match,{mode:'pass-and-play',firstStarter:'p1'});
    const phase=()=>String(game.snapshot.phase);audio.observe(game.snapshot);scene.present(game.snapshot,0);game.start();
    for(let round=1;round<=5;round++){
     game.tick(DUEL_TIMING.setup);
     if(phase()!=='TURN_HANDOFF'||!game.ready())throw Error(`Match ${match} nail ${round}: handoff failed`);
     game.tick(DUEL_TIMING.setup);game.tick(.45);game.tap();game.tick(.45);game.tap();game.tick(FOCUS_TIME);game.tap();game.tick(DUEL_TIMING.ready);
     if(!game.swing(1))throw Error(`Match ${match} nail ${round}: swing failed`);
     audio.observe(game.snapshot);scene.present(game.snapshot,.016);
     game.tick(DUEL_TIMING.contact);audio.observe(game.snapshot);scene.present(game.snapshot,.016);
     game.tick(.12);audio.observe(game.snapshot);scene.present(game.snapshot,.12);
     game.tick(DUEL_TIMING.impact-.12);audio.observe(game.snapshot);scene.present(game.snapshot,.016);
     if(phase()!=='ROUND_RESULT')throw Error(`Match ${match} nail ${round}: round did not finish`);
     game.advanceRound();
    }
    if(phase()!=='MATCH_RESULT')throw Error(`Match ${match}: match did not finish`);
    audio.observe(game.snapshot);scene.present(game.snapshot,.1);
    await wait(450);
    const sceneMetrics=scene.metrics(),audioMetrics=audio.diagnostics();
    if(audioMetrics.voices!==0)throw Error(`Match ${match}: ${audioMetrics.voices} short voices remained`);
    if(!audioMetrics.ambience||audioMetrics.music)throw Error(`Match ${match}: persistent audio ownership changed`);
    if(!first)first={geometries:sceneMetrics.geometries,textures:sceneMetrics.textures};
    if(sceneMetrics.geometries!==first.geometries||sceneMetrics.textures!==first.textures)throw Error(`Match ${match}: renderer resources grew`);
    samples.push({match,scene:sceneMetrics,audio:audioMetrics});
    output.textContent=`Match ${match}/10 · ${sceneMetrics.geometries} geometries · ${sceneMetrics.textures} textures`;
   }
   if(cancelled)return;
   (globalThis as typeof globalThis & {__NAILZ_SOAK__?:unknown}).__NAILZ_SOAK__={matches:samples.length,samples};
   output.dataset.status='passed';output.textContent=`10/10 complete · ${first?.geometries} geometries · ${first?.textures} textures · audio clean`;
  }catch(error){
   output.dataset.status='failed';output.textContent=error instanceof Error?error.message:String(error);
   (globalThis as typeof globalThis & {__NAILZ_SOAK__?:unknown}).__NAILZ_SOAK__={error:output.textContent,samples};
  }finally{running=false;button.disabled=false;}
 }
 const click=()=>{audio.activate();void run();};button.addEventListener('click',click);
 return()=>{cancelled=true;button.removeEventListener('click',click);Reflect.deleteProperty(globalThis,'__NAILZ_SOAK__');card.remove();};
}
