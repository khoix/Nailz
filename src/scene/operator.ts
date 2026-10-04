import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DuelSnapshot } from '../game/duel.ts';
import { DUEL_TIMING } from '../game/duel.ts';
import { operatorClip, smooth, type OperatorClip } from './animation.ts';
const UP=new THREE.Vector3(0,1,0);
/** Original articulated carnival host, built around shoulder/elbow/wrist pivots. */
export function createOperator(scene:THREE.Scene){
 const root=new THREE.Group();root.name='operator-rig';root.position.set(-.35,0,-.95);scene.add(root);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
 const mat=(color:string,roughness=.75,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
 const skin=mat('#a7603b'),lightSkin=mat('#bb7650'),shirt=mat('#e27661'),apron=mat('#1c6973'),trim=mat('#e4ba78'),hair=mat('#241c27'),white=mat('#fff2df'),dark=mat('#23202b'),gold=mat('#dcaa5b',.32,.6);
 const mesh=(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D=root)=>{geometries.add(g);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const ellipsoid=(m:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number,parent:THREE.Object3D=root)=>{const o=mesh(new THREE.SphereGeometry(1,16,12),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;};
 const torso=new THREE.Group();root.add(torso);torso.position.y=1.16;
 ellipsoid(shirt,0,.25,0,.39,.52,.23,torso);
 const bib=mesh(new RoundedBoxGeometry(.54,.66,.1,3,.09),apron,torso);bib.position.set(0,.14,.2);
 for(const x of [-.2,.2]){const strap=mesh(new RoundedBoxGeometry(.055,.47,.045,2,.015),trim,torso);strap.position.set(x,.54,.19);strap.rotation.z=-x*.3;}
 const pocket=mesh(new RoundedBoxGeometry(.33,.19,.035,2,.025),apron,torso);pocket.position.set(0,-.01,.27);
 for(const x of [-.11,.11])ellipsoid(gold,x,.37,.268,.027,.027,.018,torso);
 const badge=mesh(new THREE.TorusGeometry(.065,.012,5,18),trim,torso);badge.position.set(0,.35,.275);
 ellipsoid(skin,0,1.78,0,.11,.17,.12);
 const head=new THREE.Group();head.position.set(0,2.06,.01);root.add(head);
 ellipsoid(skin,0,0,0,.26,.32,.245,head);ellipsoid(lightSkin,0,-.125,.07,.22,.19,.18,head);
 for(const x of [-.265,.265]){ellipsoid(skin,x,0,0,.068,.095,.053,head);ellipsoid(lightSkin,x,.005,.032,.032,.054,.021,head);}
 ellipsoid(skin,0,-.005,.235,.064,.074,.074,head);
 const eyes:THREE.Mesh[]=[],brows:THREE.Mesh[]=[];
 for(const x of [-.102,.102]){
  ellipsoid(white,x,.06,.209,.063,.053,.036,head);
  const pupil=ellipsoid(dark,x,.054,.242,.023,.031,.014,head);eyes.push(pupil);
  const brow=mesh(new RoundedBoxGeometry(.128,.031,.025,2,.014),hair,head);brow.position.set(x,.141,.218);brow.rotation.z=x<0?.12:-.12;brows.push(brow);
 }
 const mouth=mesh(new THREE.TorusGeometry(.066,.012,5,20,Math.PI),dark,head);mouth.position.set(0,-.125,.243);mouth.rotation.z=Math.PI;
 // Curl clusters give a deliberately sculpted silhouette without external model assets.
 for(let i=0;i<15;i++){const a=i*Math.PI*2/15;ellipsoid(hair,Math.cos(a)*.195,.235+Math.sin(a*3)*.022,Math.sin(a)*.16,.084,.088,.078,head);}
 ellipsoid(hair,0,.285,-.025,.18,.08,.15,head);
 const cap=ellipsoid(apron,0,.318,-.01,.245,.07,.2,head);cap.name='cap';
 const peak=mesh(new RoundedBoxGeometry(.39,.045,.27,3,.025),apron,head);peak.position.set(0,.3,.17);
 const pin=ellipsoid(gold,0,.34,.19,.039,.025,.015,head);pin.name='cap-pin';
 // Each arm is a two-link IK chain. The gripping hand uses the hammer's exact transform.
 const arms=[-1,1].map(side=>{
  const upper=mesh(new THREE.CapsuleGeometry(.079,1,4,8),shirt),lower=mesh(new THREE.CapsuleGeometry(.062,1,4,8),skin);
  const hand=new THREE.Group();root.add(hand);
  ellipsoid(skin,0,0,0,.075,.095,.061,hand);
  const fingers=mesh(new THREE.TorusGeometry(.053,.026,5,10,Math.PI*1.65),lightSkin,hand);fingers.rotation.x=Math.PI/2;fingers.position.z=.022;
  ellipsoid(lightSkin,side*.059,.027,.028,.032,.054,.032,hand);
  return {side,upper,lower,hand};
 });
 // Static pieces share material batches; eyes, brows, mouth and arm joints stay articulated.
 function batch(group:THREE.Group,keep:THREE.Object3D[]=[]){
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();const remove:THREE.Object3D[]=[];
  for(const o of group.children){if(!(o instanceof THREE.Mesh)||Array.isArray(o.material)||keep.includes(o))continue;
   o.updateMatrix();const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(o.matrix);
   const parts=buckets.get(o.material)??[];parts.push(geometry);buckets.set(o.material,parts);remove.push(o);
  }
  remove.forEach(o=>o.removeFromParent());
  for(const [m,parts] of buckets){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(merged)mesh(merged,m,group);}
 }
 batch(torso);batch(head,[...eyes,...brows,mouth]);arms.forEach(a=>batch(a.hand));
 // Broad body/hand shadows give contact grounding; tiny face/curl details need no shadow pass.
 root.traverse(o=>{if(o instanceof THREE.Mesh)o.castShadow=false;});
 torso.children.forEach(o=>{if(o instanceof THREE.Mesh&&o.material===shirt)o.castShadow=true;});
 head.children.forEach(o=>{if(o instanceof THREE.Mesh&&o.material===skin)o.castShadow=true;});
 arms.forEach(a=>{a.upper.castShadow=true;a.lower.castShadow=true;a.hand.children.forEach(o=>{if(o instanceof THREE.Mesh&&o.material===skin)o.castShadow=true;});});
 const elbow=new THREE.Vector3(),delta=new THREE.Vector3();
 function bone(mesh:THREE.Mesh,a:THREE.Vector3,b:THREE.Vector3,radius:number){delta.subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(UP,delta.clone().normalize());mesh.scale.y=Math.max(.001,delta.length()/(1+2*radius));}
 function arm(index:number,world:THREE.Vector3,gripRotation?:THREE.Quaternion){
  const rig=arms[index]!;const shoulder=new THREE.Vector3(rig.side*.34,1.65,0);const wrist=root.worldToLocal(world.clone());
  const direction=wrist.clone().sub(shoulder);const length=direction.length();direction.normalize();
  const reach=Math.min(length,1.49),upper=.76,lower=.76;const along=(upper*upper-lower*lower+reach*reach)/(2*Math.max(.001,reach));
  const perpendicular=new THREE.Vector3(rig.side*.28,-.8,-.55).addScaledVector(direction,-new THREE.Vector3(rig.side*.28,-.8,-.55).dot(direction)).normalize();
  elbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(perpendicular,Math.sqrt(Math.max(0,upper*upper-along*along)));
  bone(rig.upper,shoulder,elbow,.079);bone(rig.lower,elbow,wrist,.062);rig.hand.position.copy(wrist);
  if(gripRotation)rig.hand.quaternion.copy(root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(gripRotation));else rig.hand.rotation.set(-.35,0,rig.side*.16);
 }
 root.updateWorldMatrix(true,true);arm(0,new THREE.Vector3(-.83,1.08,-.42));arm(1,new THREE.Vector3(.14,1.08,-.42));
 let idleTime=0,clip:OperatorClip='idle';let gripError=0;let holding=false;
 function update(s:DuelSnapshot,dt:number,gripPoint:THREE.Vector3,gripRotation:THREE.Quaternion,nailPoint:THREE.Vector3){
  idleTime+=Math.min(dt,.1);clip=operatorClip(s);
  let lean=0;
  if(s.mode==='solo'&&!s.isHuman){
   if(s.phase==='TARGET_Y')lean=.22*smooth(s.elapsed/DUEL_TIMING.operatorAim);
   if(s.phase==='READY_TO_SWING')lean=.22+.18*smooth(s.elapsed/DUEL_TIMING.ready);
   if(s.phase==='SWING')lean=.4;
   if(s.phase==='IMPACT_RESOLUTION')lean=.4*(1-smooth(s.elapsed/DUEL_TIMING.impact));
  }
  root.position.set(-.35,lean*.45,-.95+lean);root.updateWorldMatrix(true,true);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const breathe=reduced?0:Math.sin(idleTime*1.8)*.012;
  torso.rotation.set(0,0,0);torso.position.y=1.16+breathe;head.rotation.set(-.08,0,0);head.position.y=2.06+breathe;
  mouth.scale.set(1,1,1);mouth.rotation.z=Math.PI;
  brows.forEach((b,i)=>{b.position.y=.141;b.rotation.z=i===0?.12:-.12;});eyes.forEach(e=>e.position.y=.052);
  const left=new THREE.Vector3(-.83,1.08,-.42),right=new THREE.Vector3(.14,1.08,-.42);
  const reach=clip==='setup'?Math.sin(Math.PI*smooth(s.elapsed/DUEL_TIMING.setup)):clip==='straighten'?Math.sin(Math.PI*smooth(s.elapsed/DUEL_TIMING.straighten)):0;
  if(reach>0){right.lerp(nailPoint.clone().add(new THREE.Vector3(.095,.03,0)),reach);head.rotation.x=-.2*reach;}
  if(clip==='aim'||clip==='swing'){head.rotation.x=-.19;brows[0]!.rotation.z=-.14;brows[1]!.rotation.z=.14;}
  if(clip==='confident'){head.rotation.z=-.065;mouth.scale.x=1.15;}
  if(clip==='surprised'){brows.forEach(b=>b.position.y=.2);mouth.scale.set(.7,1.5,1);head.rotation.x=.08;left.y+=.28;}
  if(clip==='disappointed'){head.rotation.x=.22;head.rotation.z=.075;brows[0]!.rotation.z=.28;brows[1]!.rotation.z=-.28;mouth.rotation.z=0;}
  if(clip==='celebrate'){const cheer=reduced?1:.85+.15*Math.sin(Math.min(s.elapsed,1.5)*9);left.set(-.95,2.03+cheer*.12,-.62);right.set(.33,2.03+cheer*.12,-.62);head.rotation.z=reduced?0:Math.sin(s.elapsed*7)*.06;mouth.scale.x=1.3;}
  // The competitive hand is attached only during solo operator action and rebound.
  const holds=s.mode==='solo'&&!s.isHuman&&['TARGET_Y','READY_TO_SWING','SWING','IMPACT_RESOLUTION'].includes(s.phase);
  arm(0,left);arm(1,holds?gripPoint:right,holds?gripRotation:undefined);
  holding=holds;gripError=holds?arms[1]!.hand.getWorldPosition(new THREE.Vector3()).distanceTo(gripPoint):0;
 }
 return {root,update,diagnostics(){return {holding,gripError,pose:[...root.position.toArray(),...head.quaternion.toArray(),head.position.y,torso.position.y,...arms.flatMap(a=>[...a.hand.position.toArray(),...a.hand.quaternion.toArray()])]};},get clip(){return clip;},setVisible(value:boolean){root.visible=value;},dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
