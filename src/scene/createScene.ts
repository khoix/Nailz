import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildEnvironment } from './environment.ts';
import { createOperator } from './operator.ts';
import { hammerMotion } from './animation.ts';
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
export function createScene(canvas: HTMLCanvasElement, textures = new Map<string, THREE.Texture>()) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101629');
  scene.fog = new THREE.Fog('#101629', 10, 23);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); const environmentMap = pmrem.fromScene(room, .06);
  scene.environment = environmentMap.texture; scene.environmentIntensity = .45;
  room.dispose(); pmrem.dispose();
  const environment = buildEnvironment(scene, textures);
  const operator = createOperator(scene);
  let quality: 'low' | 'high' = new URLSearchParams(location.search).get('quality') === 'low' ? 'low' : 'high';
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const mat = (color: string, roughness = 0.6, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); materials.push(m); return m;
  };
  const wood = mat('#9a582d');
  const endGrain = mat('#fff0d4', .86); endGrain.map = textures.get('endgrain') ?? null;
  const darkWood = mat('#653620');
  const metal = mat('#c4d3df', 0.28, 0.82);
  const brass = mat('#b68b51', .3, .72);
  const grip = mat('#a73343', 0.82);
  const plinth = mat('#25283d', 0.4, 0.2);
  const makeMesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = scene) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  scene.add(new THREE.HemisphereLight('#adc8fc', '#30203e', 1.1));
  const key = new THREE.DirectionalLight('#ffda9d', 3.2); key.position.set(-3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4; key.shadow.normalBias = 0.025; scene.add(key);
  const rim = new THREE.DirectionalLight('#75c7e3', 2.2); rim.position.set(3, 3, -4); scene.add(rim);
  const base = makeMesh(new THREE.CylinderGeometry(1.8, 1.94, 0.18, 64), plinth); base.position.y = -0.09;
  const logProfile = [[1.23,0],[1.29,.04],[1.31,.1],[1.28,.56],[1.24,.67],[1.20,.7]].map(([r,y])=>new THREE.Vector2(r,y));
  makeMesh(new THREE.LatheGeometry(logProfile,64),wood);
  // Small repeated surface details share draw calls and do not cast tiny costly shadows.
  function instances(geometry:THREE.BufferGeometry,material:THREE.Material,count:number,parent:THREE.Object3D,pose:(o:THREE.Object3D,i:number)=>void){
    geometries.push(geometry);const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.receiveShadow=true;parent.add(mesh);
    const o=new THREE.Object3D();for(let i=0;i<count;i++){pose(o,i);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);}return mesh;
  }
  instances(new THREE.CylinderGeometry(.006,.014,.52,5),darkWood,40,scene,(ridge,i)=>{const a=i*Math.PI*2/40;ridge.position.set(Math.cos(a)*1.29,.3,Math.sin(a)*1.29);ridge.rotation.z=Math.sin(i)*.035;});
  const top = makeMesh(new THREE.CylinderGeometry(1.225, 1.225, 0.016, 64), endGrain); top.position.y = BLOCK_TOP - 0.004;
  for(const y of [.13,.49]) {const band = makeMesh(new THREE.CylinderGeometry(1.309, 1.309, .047, 64, 1, true), plinth); band.position.y=y;}
  instances(new THREE.SphereGeometry(.023,8,6),brass,12,scene,(rivet,i)=>{const a=i*Math.PI/6;rivet.position.set(Math.cos(a)*1.32,.13,Math.sin(a)*1.32);});
  const floor = makeMesh(new THREE.PlaneGeometry(80, 80), mat('#171725', 0.92)); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.36;
  const nailGroup = new THREE.Group(); scene.add(nailGroup);
  const shaftGeometry = new THREE.CylinderGeometry(0.027, 0.027, 1, 12); geometries.push(shaftGeometry);
  const shaft: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) { const part = new THREE.Mesh(shaftGeometry, metal); part.castShadow = true; nailGroup.add(part); shaft.push(part); }
  const headProfile=[[0,-.021],[.098,-.021],[NAIL_HEAD_RADIUS,-.009],[NAIL_HEAD_RADIUS,.007],[.097,.021],[0,.021]].map(([r,y])=>new THREE.Vector2(r,y));
  const head = makeMesh(new THREE.LatheGeometry(headProfile,48), metal, nailGroup);
  const hammer = new THREE.Group(); scene.add(hammer);
  const hammerHead = makeMesh(new RoundedBoxGeometry(0.42, 0.15, 0.19, 3, .035), metal, hammer);
  hammerHead.position.y = 0;
  // Only this raised circular striking face contacts the nail: radius .65 heads.
  const strikingFace = makeMesh(new THREE.CylinderGeometry(NAIL_HEAD_RADIUS * .65, NAIL_HEAD_RADIUS * .65, .06, 24), metal, hammer);
  strikingFace.position.y = -.105;
  const handle = makeMesh(new THREE.CylinderGeometry(0.046, 0.06, 0.87, 16), wood, hammer); handle.position.y = 0.49;
  const sleeve = makeMesh(new THREE.CylinderGeometry(0.063, 0.068, 0.4, 16), grip, hammer); sleeve.position.y = 0.76;
  instances(new THREE.TorusGeometry(.066,.008,4,16),plinth,9,hammer,(wrap,i)=>{wrap.rotation.x=Math.PI/2;wrap.position.y=.59+i*.038;});
  for(const y of [.55,.96]){const collar=makeMesh(new THREE.CylinderGeometry(.071,.071,.032,16),brass,hammer);collar.position.y=y;}
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
      hammer.visible = false;operator.setVisible(false);
    } else {
      const portrait = camera.aspect < 0.85;
      if (currentView === 'booth') camera.position.set(portrait ? 1.1 : 3.1, portrait ? 3.7 : 3.6, portrait ? 8.3 : 6.6);
      else camera.position.set(portrait ? 3.1 : 2.5, 3.5, portrait ? 5 : 4.3);
      camera.lookAt(0, 1.3, currentView === 'booth' ? -.35 : 0); hammer.visible = true;operator.setVisible(true);
    }
    camera.updateProjectionMatrix();
  }
  function render() { if (!disposed) renderer.render(scene, camera); }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width); const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1 : 1.75);
    renderer.setSize(Math.round(width * dpr), Math.round(height * dpr), false);
    camera.aspect = width / height; updateCamera(); render();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const restore = () => { document.querySelector('#notice')!.textContent = ''; resize(); };
  const lose = (event: Event) => { event.preventDefault(); document.querySelector('#notice')!.textContent = 'Graphics paused. Waiting to restore…'; };
  canvas.addEventListener('webglcontextlost', lose); canvas.addEventListener('webglcontextrestored', restore);
  renderer.shadowMap.enabled = quality !== 'low'; environment.setQuality(quality === 'low');
  poseNail(nail); resize();
  const transitionFrom = new THREE.Vector3();
  const transitionRotation = new THREE.Quaternion();
  const destinationPosition = new THREE.Vector3();
  const destinationRotation = new THREE.Quaternion();
  let transitionTime = 1;
  let lastPresentationPhase = '';
  let lastPresentationActor = '';
  let rememberedDepth = nail.depth;
  let ambientRenderTime=0;let previousNailDepth=-1;let wasPaused=false;let cameraWasSettled=false;
  const gripPoint=new THREE.Vector3(),gripRotation=new THREE.Quaternion();
  function present(snapshot: DuelSnapshot, dt: number) {
    if(snapshot.paused||snapshot.resumeIn>0)dt=0;
    environment.update(dt);
    const { phase, elapsed, actor, pending } = snapshot;
    const inTarget = phase === 'NAIL_SETUP' || (snapshot.isHuman && ['TARGET_Y','TARGET_X','RETICLE'].includes(phase));
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
      const {lift,angle}=hammerMotion(snapshot);
      if(phase==='SWING')rememberedDepth=snapshot.nail.depth;
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
    hammer.updateWorldMatrix(true,false);
    gripPoint.set(0,.76,0).applyMatrix4(hammer.matrixWorld);hammer.getWorldQuaternion(gripRotation);
    operator.setVisible(!inTarget || phase==='NAIL_SETUP');
    operator.update(snapshot,dt,gripPoint,gripRotation,head.position);
    const staticTarget=inTarget&&phase!=='NAIL_SETUP'&&cameraWasSettled&&transitionTime===1&&!changed&&phase===lastPresentationPhase&&previousNailDepth===snapshot.nail.depth;
    const stillPaused=snapshot.paused&&wasPaused;
    const ambient=['MATCH_INTRO','TURN_HANDOFF','ROUND_RESULT','MATCH_RESULT'].includes(phase);
    ambientRenderTime+=dt;
    const ambientDue=!ambient||ambientRenderTime>=1/30||changed||phase!==lastPresentationPhase;
    if(!staticTarget&&!stillPaused&&ambientDue){render();ambientRenderTime=0;}
    previousNailDepth=snapshot.nail.depth;wasPaused=snapshot.paused;cameraWasSettled=transitionTime===1;
    lastPresentationPhase = phase; lastPresentationActor = actor;
  }
  return {
    present,
    async prepare() {
      for (const view of ['booth','target','impact'] as CameraView[]) {
        currentView=view;updateCamera();renderer.compile(scene,camera);render();
        await new Promise<void>(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};channel.port2.postMessage(null);});
      }
      currentView='booth';updateCamera();render();
    },
    async profile() {
      const samples:number[]=[];
      for(let i=0;i<60;i++){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));const start=performance.now();render();samples.push(performance.now()-start);}
      samples.sort((a,b)=>a-b);return {medianMs:samples[30]!,p95Ms:samples[57]!,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    },
    setQuality(value: 'low'|'high') {quality=value;renderer.shadowMap.enabled=value==='high';environment.setQuality(value==='low');resize();},
    metrics() {return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,quality};},
    animationState(){return {clip:operator.clip,operatorVisible:operator.root.visible,grip:gripPoint.toArray(),...operator.diagnostics()};},
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
      operator.dispose(); environment.dispose(); environmentMap.dispose(); key.shadow.dispose(); renderer.dispose();
    },
  };
}
export type NailzScene = ReturnType<typeof createScene>;
