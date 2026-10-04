import { sampleAI } from '../src/game/ai.ts';
import { createRandom } from '../src/game/random.ts';
import { applyStrike, createNail, resolveStrike, straightenNail } from '../src/game/strike.ts';
import { otherParticipant } from '../src/game/state.ts';
import type { ParticipantId } from '../src/game/types.ts';
const seed=20261004, samples=20000, matches=2000;
const results=[];
for(const difficulty of ['easy','normal','hard','champion'] as const) {
 const random=createRandom(seed);let radial=0,misses=0,oneHits=0,depth=0;
 for(let i=0;i<samples;i++) {const input=sampleAI(difficulty,random);const r=resolveStrike(createNail(),input);radial+=r.radialError;misses+=Number(!r.contact);oneHits+=Number(r.oneHit);depth+=r.depthDelta;}
 let totalStrikes=0,starterWins=0,operatorWins=0;const winsByStart={p1:0,p2:0};
 for(let m=0;m<matches;m++) {
  // Fixed Normal input proxy for a human, NOT measured human behavior.
  const humanRandom=createRandom(seed+m*2),aiRandom=createRandom(seed+m*2+1);
  const first:ParticipantId=m%2===0?'p1':'p2';let wins=0;
  for(let round=0;round<5;round++) {
   let nail=createNail();const starter=round%2===0?first:otherParticipant(first);let actor=starter;
   for(let turn=0;!nail.winner;turn++) {
    if(turn>1000)throw Error('Simulation failed to converge');
    const input=sampleAI(actor==='p1'?'normal':difficulty,actor==='p1'?humanRandom:aiRandom,actor);
    nail=straightenNail(applyStrike(nail,resolveStrike(nail,input)));totalStrikes++;
    actor=otherParticipant(actor);
   }
   starterWins+=Number(nail.winner===starter);wins+=Number(nail.winner==='p2');
  }
  if(wins>=3){operatorWins++;winsByStart[first]++;}
 }
 results.push({difficulty,meanRadialError:+(radial/samples).toFixed(3),missPercent:+(misses/samples*100).toFixed(2),freshOneHitPercent:+(oneHits/samples*100).toFixed(2),meanFreshDepthGain:+(depth/samples).toFixed(3),starterNailWinPercent:+(starterWins/(matches*5)*100).toFixed(2),meanStrikesPerNail:+(totalStrikes/(matches*5)).toFixed(2),meanStrikesPerMatch:+(totalStrikes/matches).toFixed(2),operatorMatchWinPercent:+(operatorWins/matches*100).toFixed(2),operatorWinWhenHumanStarts:+(winsByStart.p1/(matches/2)*100).toFixed(2),operatorWinWhenOperatorStarts:+(winsByStart.p2/(matches/2)*100).toFixed(2)});
}
console.log(JSON.stringify({seed,samplesPerPreset:samples,matchesPerPreset:matches,humanProxy:'Normal preset; not empirical player data',durationUnit:'strikes; handoff and deliberation excluded',results},null,2));
