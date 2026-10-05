import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ActionEvents,impactStyle} from '../src/effects/events.ts';
import {Duel} from '../src/game/duel.ts';
import {createNail,resolveStrike} from '../src/game/strike.ts';
const hit=resolveStrike(createNail(),{actor:'p1',offset:{x:0,y:0},swipePower:1,reticleQuality:1});
test('presentation consumes contact once across pause, duplicate frames and reset',()=>{
 const gate=new ActionEvents(),base=new Duel(11).snapshot;
 const s={...base,phase:'IMPACT_RESOLUTION' as const,actionId:1,appliedActionId:1,lastResult:hit};
 assert.equal(gate.sample(s).contact,hit);assert.equal(gate.sample({...s,paused:true}).contact,null);assert.equal(gate.sample(s).contact,null);
 gate.sample(base);assert.equal(gate.sample(s).contact,hit);
 assert.equal(gate.sample({...s,phase:'MATCH_RESULT'}).celebrate,true);assert.equal(gate.sample({...s,phase:'MATCH_RESULT'}).celebrate,false);
});
test('effect hierarchy and hold are independent of human participant identity',()=>{
 assert.deepEqual(impactStyle(hit),impactStyle({...hit,actor:'p2'}));
 const miss=impactStyle({...hit,contact:false,oneHit:false,finishing:false});
 const normal=impactStyle({...hit,oneHit:false,finishing:false,usablePower:.5});
 assert.ok(miss.intensity<normal.intensity);assert.ok(normal.intensity<impactStyle(hit).intensity);assert.equal(miss.hold,0);assert.equal(impactStyle(hit).hold,.045);
});

import * as THREE from 'three';
import {createImpactEffects} from '../src/effects/impact.ts';
test('effects reuse fixed pools, scale quality, honor reduced motion, and dispose cleanly',()=>{
 const scene=new THREE.Scene(),effects=createImpactEffects(scene),base=new Duel(11).snapshot;
 const s={...base,phase:'IMPACT_RESOLUTION' as const,elapsed:.1,lastResult:hit,actionId:1,appliedActionId:1};
 const origin=new THREE.Vector3(0,1,0),face=origin.clone();
 const children=[...scene.children];
 for(let i=0;i<1000;i++)effects.update(s,.016,origin,face,false,false);
 assert.deepEqual(scene.children,children);
 const particles=scene.children.find(o=>o instanceof THREE.Points) as THREE.Points;
 assert.equal(particles.geometry.drawRange.count,64);
 const before=Array.from(particles.geometry.attributes.position!.array);
 effects.update({...s,actor:'p2',lastResult:{...hit,actor:'p2'}},.016,origin,face,false,false);
 assert.deepEqual(Array.from(particles.geometry.attributes.position!.array),before,'identical strikes have identical cosmetic intensity');
 effects.update(s,.016,origin,face,true,false);assert.equal(particles.geometry.drawRange.count,16);
 const shake=effects.update(s,.016,origin,face,false,true);assert.equal(particles.visible,false);assert.equal(shake.length(),0);
 effects.dispose();assert.equal(scene.children.length,0);
});
