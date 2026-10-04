import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Duel, DUEL_TIMING, focusQuality } from '../src/game/duel.ts';
import { measureSwipe } from '../src/input/swipe.ts';
function aim(game: Duel, qualityTime = 1.5/2.15) {
  game.tick(.4);game.tick(.45);game.tap();game.tick(.45);game.tap();game.tick(qualityTime);game.tap();game.tick(.4);
}
test('perfect normal action sequence can finish a fresh nail',()=>{
  const g=new Duel(9271,{firstStarter:'p1'});g.start();aim(g);assert.equal(g.snapshot.phase,'READY_TO_SWING');
  assert.equal(g.swing(1),true);g.tick(.24);assert.equal(g.snapshot.nail.depth,1);
  assert.equal(g.snapshot.nail.winner,'p1');assert.equal(g.snapshot.nail.strikeCount,1);
  g.tick(2);assert.equal(g.snapshot.phase,'ROUND_RESULT');assert.equal(g.snapshot.nail.strikeCount,1);
});
test('one tap cannot lock two stages; short double tap is ignored',()=>{
 const g=new Duel(9271,{firstStarter:'p1'});g.start();g.tick(.85);g.tap();g.tap();assert.equal(g.snapshot.phase,'TARGET_X');
 g.tick(.05);g.tap();assert.equal(g.snapshot.phase,'TARGET_X');
});
test('reticle times out once and never replays',()=>{
 const g=new Duel(9271,{firstStarter:'p1'});g.start();g.tick(.85);g.tap();g.tick(.45);g.tap();g.tick(2);
 assert.equal(g.snapshot.phase,'READY_TO_SWING');assert.equal(g.snapshot.quality,0);
 g.tap();g.tick(5);assert.equal(g.snapshot.quality,0);g.swing(1);assert.equal(g.snapshot.pending!.powerCap,.12);
});
test('pause freezes all timers, resume countdown protects a pending swing',()=>{
 const g=new Duel(9271,{firstStarter:'p1'});g.start();aim(g);g.swing(.4);g.tick(.1);const before=g.snapshot;
 g.pause();g.tick(20);assert.equal(g.snapshot.elapsed,before.elapsed);assert.equal(g.snapshot.nail.strikeCount,0);
 g.resume();g.tick(DUEL_TIMING.resume);assert.equal(g.snapshot.nail.strikeCount,0);
 g.tick(.14);assert.equal(g.snapshot.nail.strikeCount,1);g.tick(.1);assert.equal(g.snapshot.nail.strikeCount,1);
});
test('operator alternates on same nail and uses the shared strike result',()=>{
 const g=new Duel(12,{firstStarter:'p1'});g.start();aim(g);g.swing(.1);g.tick(.24+.7);
 assert.equal(g.snapshot.actor,'p2');const depth=g.snapshot.nail.depth;
 g.tick(.85);const result=g.snapshot.pending!;assert.equal(result.actor,'p2');assert.equal(result.depthBefore,depth);
 g.tick(.24);assert.equal(g.snapshot.nail.depth,result.depthAfter);assert.equal(g.snapshot.nail.strikeCount,2);
 g.tick(.7+.45);assert.equal(g.snapshot.actor,'p1');assert.equal(g.snapshot.nail.depth,result.depthAfter);
 assert.deepEqual(g.snapshot.nail.bend,{x:0,y:0});
});
test('same sequence at different frame intervals gives same resolved strike',()=>{
 const outputs=[];
 for(const hz of [30,60,120]) {
  const g=new Duel(9271,{firstStarter:'p1'});g.start();aim(g);g.swing(.3);
  let remaining=2.4;
  while(remaining>1e-9){const dt=Math.min(1/hz,remaining);g.tick(dt);remaining-=dt;}
  outputs.push(g.snapshot.nail);
 }
 assert.deepEqual(outputs[0],outputs[1]);assert.deepEqual(outputs[1],outputs[2]);
});
test('restart discards pending impact and pause state',()=>{
 const g=new Duel(9271,{firstStarter:'p1'});g.start();aim(g);g.swing(1);g.pause();g.restart(12);g.tick(.4);
 assert.equal(g.snapshot.phase,'TARGET_Y');assert.equal(g.snapshot.nail.strikeCount,0);assert.equal(g.snapshot.paused,false);
});
test('swipe power is viewport-normalized and sampling-density independent',()=>{
 const a=measureSwipe([{x:10,y:100,time:0},{x:10,y:400,time:150}],800);
 const b=measureSwipe([{x:20,y:200,time:0},{x:20,y:500,time:75},{x:20,y:800,time:150}],1600);
 assert.equal(a.power,b.power);assert.equal(a.power,1);
 const weak=measureSwipe([{x:10,y:100,time:0},{x:10,y:160,time:700}],800);
 assert.equal(weak.valid,true);assert.ok(weak.power<.25);
 assert.equal(measureSwipe([{x:0,y:100,time:0},{x:0,y:0,time:100}],800).valid,false);
 assert.equal(measureSwipe([{x:0,y:0,time:0},{x:100,y:5,time:100}],800).valid,false);
});
test('focus window is reachable without exact millisecond timing',()=>{
 assert.equal(focusQuality(.69),1);assert.equal(focusQuality(.72),1);assert.ok(focusQuality(.1)<.1);
});
