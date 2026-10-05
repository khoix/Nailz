import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Duel,DUEL_TIMING,type DuelSnapshot} from '../src/game/duel.ts';
import {hammerMotion,operatorClip} from '../src/scene/animation.ts';
import {createNail,resolveStrike} from '../src/game/strike.ts';
const base=new Duel(11).snapshot;
const hit=resolveStrike(createNail(),{actor:'p1',offset:{x:0,y:0},reticleQuality:1,swipePower:1});
test('shared hammer timeline reaches exact sampled contact and settles without penetration',()=>{
 const before={...base,phase:'SWING',elapsed:DUEL_TIMING.contact} as DuelSnapshot;
 assert.equal(hammerMotion(before).lift,0);assert.ok(Math.abs(hammerMotion(before).angle)<1e-12);
 for(let i=0;i<=100;i++){
  const sample=hammerMotion({...before,phase:'IMPACT_RESOLUTION',elapsed:i/100,pending:hit});
  assert.ok(sample.lift>=-1e-12);assert.ok(sample.lift<.32);
 }
 assert.ok(Math.abs(hammerMotion({...before,phase:'IMPACT_RESOLUTION',elapsed:.7,pending:hit}).lift)<1e-10);
});
test('pass-and-play never gives the host a competitive aim or swing clip',()=>{
 for(const phase of ['TARGET_Y','TARGET_X','RETICLE','READY_TO_SWING','SWING'] as const){
  for(const actor of ['p1','p2'] as const)assert.ok(!['aim','swing'].includes(operatorClip({...base,mode:'pass-and-play',phase,actor,isHuman:true})));
 }
 assert.equal(operatorClip({...base,phase:'NAIL_STRAIGHTEN',mode:'pass-and-play'}),'straighten');
 assert.equal(operatorClip({...base,mode:'pass-and-play',phase:'ROUND_RESULT',lastResult:hit}),'celebrate');
});
test('reaction ownership distinguishes host applause, computer win, and player one-hit',()=>{
 assert.equal(operatorClip({...base,phase:'IMPACT_RESOLUTION',pending:hit}),'surprised');
 assert.equal(operatorClip({...base,phase:'IMPACT_RESOLUTION',pending:{...hit,actor:'p2'}}),'celebrate');
 assert.equal(operatorClip({...base,phase:'MATCH_RESULT',winner:'p1'}),'disappointed');
 assert.equal(operatorClip({...base,phase:'MATCH_RESULT',winner:'p2'}),'celebrate');
});
test('pause samples identical poses; restart cancels reactions and sampling never mutates results',()=>{
 const s={...base,phase:'SWING',elapsed:.12,pending:hit} as DuelSnapshot;
 const copy=JSON.stringify(s);const pose=hammerMotion(s);
 assert.deepEqual(hammerMotion({...s,paused:true}),pose);operatorClip(s);assert.equal(JSON.stringify(s),copy);
 const game=new Duel(11,{mode:'pass-and-play',firstStarter:'p1'});game.start();game.tick(.4);game.ready();game.tick(.85);game.tap();game.tick(.45);game.tap();game.tick(.695);game.tap();game.tick(.4);game.swing(1);game.tick(.24);assert.equal(operatorClip(game.snapshot),'celebrate');game.restart(11);
 assert.equal(operatorClip(game.snapshot),'setup');assert.equal(game.snapshot.appliedActionId,0);
});
