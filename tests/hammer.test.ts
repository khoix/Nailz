import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHammer, poseHammer, HAMMER_GRIP, HAMMER_GRIP_ROTATION } from '../src/scene/hammer.ts';
import { hammerMotion } from '../src/scene/animation.ts';
import { Duel, DUEL_TIMING } from '../src/game/duel.ts';

test('the end of the hammer head contacts the nail with a transverse handle', () => {
 const material = new THREE.MeshBasicMaterial();
 const model = createHammer({metal:material, wood:material, grip:material, trim:material, brass:material}, .07475);
 const face = model.root.getObjectByName('striking-face') as THREE.Mesh;
 const handle = model.root.getObjectByName('handle') as THREE.Mesh;
 face.geometry.computeBoundingBox();
 const faceEnd = new THREE.Vector3(0, face.geometry.boundingBox!.min.y, 0);
 for(const actor of ['p1', 'p2'] as const) for(const isHuman of [true,false]) for(const depth of [0, .4, .91]) {
  const contact = new THREE.Vector3(.08, 1.742 - depth, -.025);
  const motion = hammerMotion({...new Duel(11).snapshot, actor, phase:'SWING', elapsed:DUEL_TIMING.contact});
  poseHammer(model.root, contact, motion.lift, motion.angle, isHuman); model.root.updateMatrixWorld(true);
  // Geometry vertices use Float32 storage, unlike the double-precision pose math.
  assert.ok(face.localToWorld(faceEnd.clone()).distanceTo(contact) < 1e-7, 'actual mesh end must land on the sampled point');
  const down = new THREE.Vector3(0,-1,0).transformDirection(face.matrixWorld);
  assert.ok(down.distanceTo(new THREE.Vector3(0,-1,0)) < 1e-10, 'striking end must face down');
  const handleAxis = new THREE.Vector3(0,1,0).transformDirection(handle.matrixWorld);
  assert.ok(Math.abs(handleAxis.dot(down)) < 1e-10, 'handle must lie across the head, never point into the nail');
  assert.ok(isHuman ? handleAxis.z > .99 : handleAxis.z < -.99, 'handle points toward the human/front or operator/back, independent of player number');
  const handAxis = new THREE.Vector3(0,1,0).applyQuaternion(HAMMER_GRIP_ROTATION).applyQuaternion(model.root.quaternion);
  assert.ok(handAxis.distanceTo(handleAxis) < 1e-10, 'gripping hand follows the handle axis');
  assert.ok(model.root.localToWorld(HAMMER_GRIP.clone()).distanceTo(contact) > .7);
 }
 for(const isHuman of [true,false]) for(const phase of ['READY_TO_SWING','SWING','IMPACT_RESOLUTION'] as const) for(let i=0; i<=100; i++) {
  const motion = hammerMotion({...new Duel(11).snapshot, phase, elapsed:(phase==='SWING'?DUEL_TIMING.contact:.5)*i/100});
  poseHammer(model.root, new THREE.Vector3(0,1,0), motion.lift, motion.angle, isHuman); model.root.updateMatrixWorld(true);
  assert.ok(face.localToWorld(faceEnd.clone()).y >= 1-1e-7, 'backswing must keep the face above contact');
  const handleAxis = new THREE.Vector3(0,1,0).transformDirection(handle.matrixWorld);
  assert.ok(isHuman ? handleAxis.z > 0 : handleAxis.z < 0, `${phase}: handle keeps facing the active wielder throughout the swing`);
 }
 model.dispose(); material.dispose();
});
