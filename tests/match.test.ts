import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Duel } from '../src/game/duel.ts';
import { sampleAI } from '../src/game/ai.ts';
import { createRandom } from '../src/game/random.ts';
import { createNail, resolveStrike } from '../src/game/strike.ts';
import type { Difficulty } from '../src/game/types.ts';
function local(firstStarter: 'p1'|'p2' = 'p1', difficulty: Difficulty = 'normal') {
 const g=new Duel(44,{mode:'pass-and-play',firstStarter,difficulty});g.start();g.tick(.4);return g;
}
function hit(g:Duel, power=1, offCenter=false) {
 assert.equal(g.snapshot.phase,'TURN_HANDOFF');assert.equal(g.ready(),true);g.tick(.4);
 g.tick(offCenter?.13:.45);g.tap();g.tick(offCenter?.13:.45);g.tap();g.tick(1.5/2.15);g.tap();g.tick(.36);
 assert.equal(g.swing(power),true);g.tick(.24);
}
function settle(g:Duel) { g.tick(2); }
test('local match plays all five nails, alternates starters, awards once, and swaps rematch starter',()=>{
 const g=local('p2');const starters=[];
 for(let nail=1;nail<=5;nail++) {
  starters.push(g.snapshot.actor);assert.equal(g.snapshot.round,nail);assert.equal(g.snapshot.isHuman,true);
  const before=g.snapshot.nailsWon[g.snapshot.actor];hit(g);assert.equal(g.snapshot.nailsWon[g.snapshot.actor],before+1);
  const points=g.snapshot.points;settle(g);assert.deepEqual(g.snapshot.points,points);
  assert.equal(g.snapshot.phase,'ROUND_RESULT');g.advanceRound();g.tick(.4);
 }
 assert.deepEqual(starters,['p2','p1','p2','p1','p2']);assert.equal(g.snapshot.phase,'MATCH_RESULT');
 assert.deepEqual(g.snapshot.nailsWon,{p1:2,p2:3});assert.equal(g.snapshot.winner,'p2');
 g.restart(99);g.tick(.4);assert.equal(g.snapshot.actor,'p1');assert.equal(g.snapshot.round,1);
 assert.deepEqual(g.snapshot.points,{p1:0,p2:0});assert.deepEqual(g.snapshot.nailsWon,{p1:0,p2:0});assert.equal(g.snapshot.pending,null);
});
test('three early wins never end a five-nail match; secondary points cannot override nails',()=>{
 const g=local();
 for(let nail=1;nail<=5;nail++) {
  if(g.snapshot.actor==='p2') { hit(g,.1);settle(g); }
  hit(g);settle(g);g.advanceRound();g.tick(.4);
  if(nail<5)assert.equal(g.snapshot.phase,'TURN_HANDOFF');
 }
 assert.deepEqual(g.snapshot.nailsWon,{p1:5,p2:0});assert.equal(g.snapshot.winner,'p1');
});
test('handoff freezes indefinitely; pause and resume preserve recipient without auto-ready',()=>{
 const g=local();const before=g.snapshot;g.tick(1000);g.tap();assert.equal(g.swing(1),false);
 assert.deepEqual(g.snapshot,before);g.pause();assert.equal(g.ready(),false);g.resume();assert.equal(g.ready(),false);
 g.tick(.8);assert.equal(g.snapshot.phase,'TURN_HANDOFF');assert.equal(g.snapshot.actor,'p1');
 assert.equal(g.ready(),true);g.tap();g.tick(.4);assert.equal(g.snapshot.phase,'TARGET_Y');
 assert.equal(g.snapshot.aim.y,0);
});
test('local penalties and partial depth belong only to their striker; same-person next nail stays ready-gated',()=>{
 const g=local();hit(g,1,true);assert.equal(g.snapshot.lastResult!.contact,false);
 assert.deepEqual(g.snapshot.points,{p1:-10,p2:0});settle(g);assert.equal(g.snapshot.actor,'p2');
 hit(g);settle(g);assert.deepEqual(g.snapshot.nailsWon,{p1:0,p2:1});assert.equal(g.snapshot.points.p1,-10);
 g.advanceRound();g.tick(.4);assert.equal(g.snapshot.actor,'p2');assert.equal(g.snapshot.previousHuman,'p2');
 assert.equal(g.snapshot.phase,'TURN_HANDOFF');
});
test('local difficulty has no effect and neither human can receive an automatic AI strike',()=>{
 const a=local('p1','easy'),b=local('p1','champion');
 for(const g of [a,b]) { hit(g,.2);settle(g);assert.equal(g.snapshot.actor,'p2');g.tick(1000);assert.equal(g.snapshot.nail.strikeCount,1);hit(g,.5);settle(g); }
 assert.deepEqual(a.snapshot.nail,b.snapshot.nail);assert.deepEqual(a.snapshot.points,b.snapshot.points);
});
test('all solo difficulties finish all five nails via the common human controls and AI resolver',()=>{
 for(const difficulty of ['easy','normal','hard','champion'] as const) {
  const g=new Duel(123,{difficulty,firstStarter:'p2'});g.start();let steps=0;
  while(g.snapshot.phase!=='MATCH_RESULT' && steps++<500) {
   const s=g.snapshot;
   if(s.phase==='ROUND_RESULT')g.advanceRound();
   else if(!s.isHuman) { g.tick(.85);if(g.snapshot.pending)assert.deepEqual(g.snapshot.pending,resolveStrike(g.snapshot.nail,sampleFromSnapshot(g)));g.tick(2); }
   else if(s.phase==='NAIL_SETUP')g.tick(.4);
   else if(s.phase==='TARGET_Y'||s.phase==='TARGET_X') {g.tick((.45-s.elapsed+1.8)%1.8);g.tap();}
   else if(s.phase==='RETICLE') {g.tick(1.5/2.15);g.tap();}
   else if(s.phase==='READY_TO_SWING') {g.tick(.4);g.swing(1);g.tick(.94);}
   else g.tick(.1);
  }
  assert.equal(g.snapshot.phase,'MATCH_RESULT',difficulty);assert.equal(g.snapshot.nailsWon.p1+g.snapshot.nailsWon.p2,5);
 }
});
function sampleFromSnapshot(g:Duel) {const p=g.snapshot.pending!;return {actor:p.actor,offset:p.offset,reticleQuality:p.reticleQuality,swipePower:p.swipePower};}
test('AI samples are reproducible, bounded, and harder presets have lower average aim error',()=>{
 const errors=[];
 for(const difficulty of ['easy','normal','hard','champion'] as const) {
  const a=createRandom(31),b=createRandom(31);let error=0;
  for(let i=0;i<1000;i++) {const input=sampleAI(difficulty,a);assert.deepEqual(input,sampleAI(difficulty,b));error+=Math.hypot(input.offset.x,input.offset.y);const r=resolveStrike(createNail(),input);assert.ok(r.depthAfter>=.16&&r.depthAfter<=1);}
  errors.push(error/1000);
 }
 assert.ok(errors.every((v,i)=>i===0||v<errors[i-1]!));
});
test('a player with fewer performance points still wins by taking three nails',()=>{
 const g=local();
 for(let round=1;round<=5;round++) {
  if(round<=3) {
   if(g.snapshot.actor==='p1'){hit(g,1,true);settle(g);}
   hit(g,.99);settle(g);hit(g);settle(g);
  } else {
   if(g.snapshot.actor==='p1'){hit(g,1,true);settle(g);}
   hit(g);settle(g);
  }
  g.advanceRound();g.tick(.4);
 }
 assert.deepEqual(g.snapshot.nailsWon,{p1:3,p2:2});assert.ok(g.snapshot.points.p1<g.snapshot.points.p2);assert.equal(g.snapshot.winner,'p1');
});
