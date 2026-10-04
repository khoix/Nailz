import * as THREE from 'three';
import type { NailState, StrikeResult } from '../game/types.ts';
import { createNail } from '../game/strike.ts';
import { DUEL_TIMING, type DuelSnapshot } from '../game/duel.ts';

export type CameraView = 'booth' | 'target' | 'impact';
export const NAIL_HEAD_RADIUS = 0.115;
const BLOCK_TOP = 0.7;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
// +y nail-local maps to -z world, so up stays up in the target camera.
export function nailLocalToWorld(x: number, y: number, height: number): THREE.Vector3 {
  return new THREE.Vector3(x * NAIL_HEAD_RADIUS, height, -y * NAIL_HEAD_RADIUS);
}
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111222');
  scene.fog = new THREE.Fog('#111222', 7, 19);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const mat = (color: string, roughness = 0.6, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(m); return m;
  };
  const wood = mat('#9a582d');
  const endGrain = mat('#bb824b');
  const darkWood = mat('#653620');
  const metal = mat('#b5c2d1', 0.26, 0.8);
  const grip = mat('#a73343', 0.82);
  const plinth = mat('#25283d', 0.4, 0.2);
  const makeMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = scene) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  scene.add(new THREE.HemisphereLight('#adc8fc', '#482329', 2));
  const key = new THREE.DirectionalLight('#ffe0a3', 4.5); key.position.set(-3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.normalBias = 0.025; scene.add(key);
  const rim = new THREE.DirectionalLight('#78aaff', 3); rim.position.set(3, 3, -4); scene.add(rim);
  const base = makeMesh(new THREE.CylinderGeometry(1.8, 1.94, 0.18, 64), plinth); base.position.y = -0.09;
  const block = makeMesh(new THREE.CylinderGeometry(1.24, 1.31, BLOCK_TOP, 48), wood); block.position.y = BLOCK_TOP / 2;
  const top = makeMesh(new THREE.CylinderGeometry(1.225, 1.225, 0.016, 64), endGrain); top.position.y = BLOCK_TOP - 0.004;
  for (let i = 1; i <= 7; i++) {
    const ring = makeMesh(new THREE.TorusGeometry(i * 0.151, 0.003, 3, 96), darkWood);
    ring.rotation.x = Math.PI / 2; ring.position.set(0.026, BLOCK_TOP + 0.005, -0.015); ring.scale.y = 0.93;
  }
  const band = makeMesh(new THREE.CylinderGeometry(1.294, 1.294, 0.055, 48, 1, true), plinth); band.position.y = 0.15;
  const floor = makeMesh(new THREE.PlaneGeometry(80, 80), mat('#171725', 0.92)); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.19;
  const nailGroup = new THREE.Group(); scene.add(nailGroup);
  const shaftGeometry = new THREE.CylinderGeometry(0.027, 0.027, 1, 12); geometries.push(shaftGeometry);
  const shaft: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) { const part = new THREE.Mesh(shaftGeometry, metal); part.castShadow = true; nailGroup.add(part); shaft.push(part); }
  const head = makeMesh(new THREE.CylinderGeometry(NAIL_HEAD_RADIUS, NAIL_HEAD_RADIUS, 0.042, 32), metal, nailGroup);
  const hammer = new THREE.Group(); scene.add(hammer);
  const hammerHead = makeMesh(new THREE.BoxGeometry(0.42, 0.15, 0.19), metal, hammer);
  hammerHead.position.y = 0;
  // Only this raised circular striking face contacts the nail: radius .65 heads.
  const strikingFace = makeMesh(new THREE.CylinderGeometry(NAIL_HEAD_RADIUS * .65, NAIL_HEAD_RADIUS * .65, .06, 24), metal, hammer);
  strikingFace.position.y = -.105;
  const handle = makeMesh(new THREE.CylinderGeometry(0.046, 0.06, 0.87, 16), wood, hammer); handle.position.y = 0.49;
  const sleeve = makeMesh(new THREE.CylinderGeometry(0.063, 0.068, 0.4, 16), grip, hammer); sleeve.position.y = 0.76;
  const contactMaterial = new THREE.MeshBasicMaterial({ color: '#ffde8a', depthTest: false }); materials.push(contactMaterial);
  const marker = makeMesh(new THREE.SphereGeometry(0.018, 12, 8), contactMaterial); marker.renderOrder = 10; marker.visible = false;
  let nail = createNail();
  let currentView: CameraView = 'booth';
  let disposed = false;
  function poseNail(state: NailState, immediate = true) {
    nail = state;
    const height = Math.max(0, state.length - state.depth);
    const bend = Math.hypot(state.bend.x, state.bend.y);
    const direction = new THREE.Vector3(state.bend.x, 0, -state.bend.y).normalize();
    const point = (t: number) => new THREE.Vector3(0, BLOCK_TOP + height * t, 0)
      .addScaledVector(direction, Math.tan(Math.min(bend, 0.9)) * height * t * t * 0.55);
    shaft.forEach((part, i) => {
      const a = point(i / shaft.length); const b = point((i + 1) / shaft.length);
      const delta = b.clone().sub(a);
      part.visible = height > 0.001; part.position.copy(a.add(b).multiplyScalar(0.5));
      part.scale.y = delta.length(); part.quaternion.setFromUnitVectors(WORLD_UP, delta.normalize());
    });
    head.position.copy(point(1)); head.position.y += 0.021;
    const tangent = point(1).sub(point(0.99)).normalize();
    head.quaternion.setFromUnitVectors(WORLD_UP, height > 0 ? tangent : WORLD_UP);
    hammer.position.set(0.43, BLOCK_TOP + height + 0.46, 0.05); hammer.rotation.set(0, 0, -0.55);
    marker.visible = false;
    if (immediate) { updateCamera(); render(); }
  }
  function updateCamera() {
    const h = BLOCK_TOP + Math.max(0, nail.length - nail.depth);
    camera.up.set(0, 1, 0);
    if (currentView === 'target') {
      camera.position.set(0, h + 2.4, 0); camera.up.set(0, 0, -1); camera.lookAt(0, h, 0);
      hammer.visible = false;
    } else {
      const portrait = camera.aspect < 0.85;
      if (currentView === 'booth') camera.position.set(portrait ? 3.9 : 3.1, portrait ? 4.5 : 3.6, portrait ? 5.5 : 4.7);
      else camera.position.set(portrait ? 3.1 : 2.5, 3.5, portrait ? 5 : 4.3);
      camera.lookAt(0, currentView === 'impact' ? 1.3 : 0.72, 0); hammer.visible = true;
    }
    camera.updateProjectionMatrix();
  }
  function render() { if (!disposed) renderer.render(scene, camera); }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width); const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setSize(Math.round(width * dpr), Math.round(height * dpr), false);
    camera.aspect = width / height; updateCamera(); render();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const restore = () => { document.querySelector('#notice')!.textContent = ''; resize(); };
  const lose = (event: Event) => { event.preventDefault(); document.querySelector('#notice')!.textContent = 'Graphics paused. Waiting to restore…'; };
  canvas.addEventListener('webglcontextlost', lose); canvas.addEventListener('webglcontextrestored', restore);
  poseNail(nail); resize();
  const transitionFrom = new THREE.Vector3();
  const transitionRotation = new THREE.Quaternion();
  const destinationPosition = new THREE.Vector3();
  const destinationRotation = new THREE.Quaternion();
  let transitionTime = 1;
  let lastPresentationPhase = '';
  let lastPresentationActor = '';
  let rememberedDepth = nail.depth;
  function present(snapshot: DuelSnapshot, dt: number) {
    const { phase, elapsed, actor, pending } = snapshot;
    const inTarget = phase === 'NAIL_SETUP' || phase === 'TARGET_Y' || phase === 'TARGET_X' || phase === 'RETICLE';
    const requestedView: CameraView = ['MATCH_INTRO','ROUND_RESULT','MATCH_RESULT','TURN_HANDOFF'].includes(phase) ? 'booth' : inTarget ? 'target' : 'impact';
    // Draw impact insertion and bend over 90ms; model already owns the result.
    let visibleNail = snapshot.nail;
    if (phase === 'IMPACT_RESOLUTION' && pending) {
      const progress = Math.min(1, elapsed / .09);
      visibleNail = { ...snapshot.nail, depth: pending.depthBefore + pending.depthDelta * progress,
        bend: { x: pending.bend.x * progress, y: pending.bend.y * progress } };
    } else if (phase === 'NAIL_STRAIGHTEN') {
      const progress = Math.min(1, elapsed / DUEL_TIMING.straighten);
      visibleNail = { ...snapshot.nail, bend: { x: snapshot.nail.bend.x * (1-progress), y: snapshot.nail.bend.y * (1-progress) } };
    }
    poseNail(visibleNail, false);
    const changed = requestedView !== currentView || actor !== lastPresentationActor || (phase === 'NAIL_SETUP' && phase !== lastPresentationPhase);
    if (changed) {
      transitionFrom.copy(camera.position); transitionRotation.copy(camera.quaternion);
      currentView = requestedView; updateCamera();
      destinationPosition.copy(camera.position); destinationRotation.copy(camera.quaternion);
      camera.position.copy(transitionFrom); camera.quaternion.copy(transitionRotation); transitionTime = 0;
    }
    if (transitionTime < 1) {
      transitionTime = Math.min(1, transitionTime + dt / .32);
      const t = transitionTime * transitionTime * (3 - 2 * transitionTime);
      camera.position.lerpVectors(transitionFrom, destinationPosition, t);
      camera.quaternion.slerpQuaternions(transitionRotation, destinationRotation, t);
    }
    const headHeight = BLOCK_TOP + visibleNail.length - visibleNail.depth + .042;
    grip.color.set(actor === 'p1' ? '#a73343' : '#247e91');
    hammer.visible = !inTarget;
    if (phase === 'READY_TO_SWING' || phase === 'SWING' || phase === 'IMPACT_RESOLUTION') {
      const offset = pending?.offset ?? snapshot.aim;
      const point = nailLocalToWorld(offset.x, offset.y, headHeight + .135);
      let lift = .72;
      let angle = -.55;
      if (phase === 'SWING') {
        const t = Math.min(1, elapsed / DUEL_TIMING.contact);
        lift = .72 * (1 - t * t * t); angle = -.55 * (1 - t);
        rememberedDepth = snapshot.nail.depth;
      } else if (phase === 'IMPACT_RESOLUTION') {
        const bounce = Math.min(1, elapsed / .24);
        lift = Math.sin(bounce * Math.PI / 2) * (.13 + (pending?.usablePower ?? 0) * .13); angle = -.12 * bounce;
      }
      // Head's bottom face reaches the sampled nail-local contact at t=1.
      hammer.position.copy(point).add(new THREE.Vector3(.35 * lift, lift, 0));
      hammer.rotation.set(0, 0, angle);
    }
    if (!snapshot.isHuman && phase === 'TARGET_Y') {
      marker.visible = true;
      marker.position.copy(nailLocalToWorld(snapshot.aim.x, snapshot.aim.y, headHeight + .008));
      contactMaterial.color.set('#53e2e9');
    }
    if (phase === 'IMPACT_RESOLUTION' && pending?.contact && elapsed < .16) {
      marker.visible = true;
      marker.position.copy(nailLocalToWorld(pending.offset.x, pending.offset.y, BLOCK_TOP + visibleNail.length - rememberedDepth + .046));
      contactMaterial.color.set('#ffde8a');
    }
    lastPresentationPhase = phase; lastPresentationActor = actor;
    render();
  }
  return {
    present,
    setNail: poseNail,
    setView(view: CameraView) { currentView = view; updateCamera(); render(); },
    showStrike(result: StrikeResult) {
      // Contact is retained in the original straight nail's local coordinates.
      marker.position.copy(nailLocalToWorld(result.offset.x, result.offset.y, BLOCK_TOP + nail.length - result.depthBefore + 0.05));
      marker.visible = result.contact; render();
    },
    getTargetRect() {
      const rect = canvas.getBoundingClientRect();
      const center = head.position.clone().project(camera);
      const edge = head.position.clone().add(new THREE.Vector3(NAIL_HEAD_RADIUS, 0, 0)).project(camera);
      return { centerX: rect.left + (center.x + 1) * rect.width / 2,
        centerY: rect.top + (1 - center.y) * rect.height / 2,
        radiusPixels: Math.abs(edge.x - center.x) * rect.width / 2 };
    },
    dispose() {
      disposed = true; observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lose); canvas.removeEventListener('webglcontextrestored', restore);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      key.shadow.dispose(); renderer.dispose();
    },
  };
}
export type NailzScene = ReturnType<typeof createScene>;
