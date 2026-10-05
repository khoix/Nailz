import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// In the contact pose the head's end faces down; the handle extends toward the wielder.
export const HAMMER_FACE = new THREE.Vector3(0, -.27, 0);
export const HAMMER_GRIP = new THREE.Vector3(0, 0, -.76);
export const HAMMER_GRIP_ROTATION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

export function createHammer(materials: Record<'metal'|'wood'|'grip'|'trim'|'brass', THREE.Material>, faceRadius: number) {
 const root = new THREE.Group(); root.name = 'hammer';
 const geometries: THREE.BufferGeometry[] = [];
 const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
  geometries.push(geometry);
  const part = new THREE.Mesh(geometry, material); part.name = name;
  part.castShadow = true; part.receiveShadow = true; root.add(part); return part;
 };
 mesh(new RoundedBoxGeometry(.19, .42, .15, 3, .035), materials.metal, 'hammer-head');
 const face = mesh(new THREE.CylinderGeometry(faceRadius, faceRadius, .06, 24), materials.metal, 'striking-face');
 face.position.y = -.24;
 const handle = mesh(new THREE.CylinderGeometry(.046, .06, .87, 16), materials.wood, 'handle');
 handle.position.z = -.49; handle.rotation.x = -Math.PI / 2;
 const sleeve = mesh(new THREE.CylinderGeometry(.063, .068, .4, 16), materials.grip, 'grip');
 sleeve.position.copy(HAMMER_GRIP); sleeve.rotation.x = -Math.PI / 2;
 const wrapGeometry = new THREE.TorusGeometry(.066, .008, 4, 16); geometries.push(wrapGeometry);
 const wraps = new THREE.InstancedMesh(wrapGeometry, materials.trim, 9); wraps.receiveShadow = true; root.add(wraps);
 const pose = new THREE.Object3D();
 for(let i = 0; i < 9; i++) { pose.position.z = -.59 - i * .038; pose.updateMatrix(); wraps.setMatrixAt(i, pose.matrix); }
 for(const z of [-.55, -.96]) {
  const collar = mesh(new THREE.CylinderGeometry(.071, .071, .032, 16), materials.brass, 'grip-collar');
  collar.position.z = z; collar.rotation.x = -Math.PI / 2;
 }
 return {root, dispose() { geometries.forEach(geometry => geometry.dispose()); }};
}

/** Anchor the actual striking face, including its rotated offset, to the sampled contact. */
export function poseHammer(root: THREE.Object3D, contact: THREE.Vector3, lift: number, angle: number, isHuman: boolean) {
 // Human players stand on the camera/front (+Z) side, opposite the operator.
 // Yaw the complete swing so the handle and backswing both face the active wielder.
 root.rotation.set(angle, isHuman ? Math.PI : 0, 0, 'YXZ');
 root.position.copy(contact).add(new THREE.Vector3(0, lift, (isHuman ? 1 : -1) * .35 * lift))
  .sub(HAMMER_FACE.clone().applyQuaternion(root.quaternion));
}
