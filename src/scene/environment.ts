import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export function buildEnvironment(scene: THREE.Scene, textures: Map<string,THREE.Texture>) {
 const geometries=new Set<THREE.BufferGeometry>(), materials=new Set<THREE.Material>();
 const root=new THREE.Group();scene.add(root);
 const mat=(color:string,roughness=.6,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});materials.add(m);return m;};
 const coral=mat('#983747',.35,.18), cream=mat('#e8bc7e'), brass=mat('#c18a48',.29,.7), blue=mat('#174c5c',.4,.15), dark=mat('#142333'), fabric=mat('#dd7460',.92), fabricLight=mat('#e7c894',.96);
 const mesh=(g:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=root)=>{geometries.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,r=.04,parent:THREE.Object3D=root)=>mesh(new RoundedBoxGeometry(w,h,d,2,r),m,x,y,z,parent);
 // Counter hugs the hero pedestal; painted panels and brass pinstripes frame it.
 box(5.8,.3,3.5,blue,0,-.28,-.15,.1);
 box(5.65,.9,3.25,coral,0,-.87,-.15,.08);
 for(const z of [1.49,-1.79]) for(const y of [-.49,-1.12]) box(5.45,.022,.018,brass,0,y,z,.008);
 for(const x of [-2.1,-1.05,0,1.05,2.1]) box(.024,.6,.025,brass,x,-.83,1.49,.006);
 // Corner posts, collars, roof ribs and scalloped fabric canopy.
 for(const x of [-2.65,2.65]) {
  mesh(new THREE.CylinderGeometry(.095,.115,4.65,12),coral,x,1.05,-1.72);
  for(const y of [-1,.05,2.75,3.3]) mesh(new THREE.CylinderGeometry(.145,.145,.11,12),brass,x,y,-1.72);
 }
 box(5.8,.19,.2,coral,0,3.18,-1.72,.07);
 const roof=new THREE.Group();root.add(roof);
 for(let i=0;i<16;i++) {
  const x=-2.9+(i+.5)*5.8/16;
  const strip=box(5.8/16+.006,.05,2.1,i%2?fabric:fabricLight,x,3.42,-2.16,.015,roof);strip.rotation.x=.18;
  const scallop=mesh(new THREE.CylinderGeometry(.183,.183,.045,16,1,false,0,Math.PI),i%2?fabric:fabricLight,x,3.21,-1.1,roof);scallop.rotation.x=Math.PI/2;scallop.rotation.z=Math.PI;
 }
 // Dimensional plaque, lit lettering, tiny individual bulbs (instanced below).
 box(2.5,.98,.18,brass,0,2.76,-1.55,.13);
 const signMat=new THREE.MeshStandardMaterial({map:textures.get('marquee'),emissiveMap:textures.get('marquee'),emissive:'#ffffff',emissiveIntensity:.35,roughness:.7});materials.add(signMat);
 mesh(new THREE.PlaneGeometry(2.4,.9),signMat,0,2.76,-1.446);
 const bulbs:THREE.Vector3[]=[];
 for(let i=0;i<25;i++) bulbs.push(new THREE.Vector3(-2.7+i*.225,3.13,-1.03));
 for(const x of [-1.28,1.28]) for(let j=0;j<6;j++) bulbs.push(new THREE.Vector3(x,2.35+j*.16,-1.4));
 const glow=new THREE.MeshBasicMaterial({color:'#ffcd83'});materials.add(glow);
 const bulbGeo=new THREE.SphereGeometry(.045,8,6);geometries.add(bulbGeo);
 const lamps=new THREE.InstancedMesh(bulbGeo,glow,bulbs.length);root.add(lamps);const dummy=new THREE.Object3D();
 bulbs.forEach((v,i)=>{dummy.position.copy(v);dummy.updateMatrix();lamps.setMatrixAt(i,dummy.matrix);});
 // Prize shelf: soft sculpted bears, separate eyes and stitched belly patches.
 const prizes:THREE.Group[]=[]; const pink=mat('#de7d91'), mint=mat('#63afa7'), gold=mat('#d3a85f'), eye=mat('#141d29',.3);
 box(5,.09,.62,blue,0,1.3,-2.08);
 for(let i=0;i<6;i++) {
  const bear=new THREE.Group();bear.position.set(-2.1+i*.84,1.52,-2.02);root.add(bear);prizes.push(bear);
  const fur=[pink,mint,gold][i%3]!;
  const ball=(r:number,m:THREE.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1)=>{const o=mesh(new THREE.SphereGeometry(r,12,8),m,x,y,z,bear);o.scale.set(sx,sy,sz);return o;};
  ball(.22,fur,0,0,0,1,1.2,.75);ball(.2,fur,0,.29,0);ball(.14,cream,0,-.015,.145,1,1,.35);
  for(const x of [-.145,.145]) {ball(.09,fur,x,.44,0);ball(.11,fur,x,-.21,.03,1,.65,1);ball(.09,fur,x*1.65,.05,0,.7,1.4,.8);ball(.023,eye,x*.48,.31,.181);}
  ball(.055,cream,0,.23,.182,1,.7,.5);ball(.024,eye,0,.25,.21);
 }
 // Festival depth: distant booths, pennant ribbons, warm windows and a wheel silhouette.
 const distant=new THREE.Group();root.add(distant);
 const backdrop=mat('#222b4c');
 for(let i=0;i<7;i++) {
  const x=-10+i*3.2,z=-7-(i%2)*2;
  box(2.8,2.1,1.5,i%2?blue:backdrop,x,-.25,z,.08,distant);
  const tent=mesh(new THREE.ConeGeometry(2,1.1,4),i%2?coral:dark,x,1.35,z,distant);tent.rotation.y=Math.PI/4;
  box(1.5,.62,.03,glow,x,.05,z+.77,.02,distant);
 }
 const wheel=new THREE.Group();wheel.position.set(-5.3,2,-10);distant.add(wheel);
 const wheelMat=mat('#53618a',.7,.1);
 mesh(new THREE.TorusGeometry(2.7,.032,5,64),wheelMat,0,0,0,wheel);
 for(let i=0;i<12;i++) {
  const t=i*Math.PI/6,x=Math.cos(t)*2.7,y=Math.sin(t)*2.7;
  const spoke=mesh(new THREE.CylinderGeometry(.015,.015,2.7,5),wheelMat,x/2,y/2,0,wheel);spoke.rotation.z=t-Math.PI/2;
  box(.32,.38,.3,i%2?coral:cream,x,y,0,.06,wheel);
 }
 for(const x of [-1,1]) {const leg=box(.075,4.4,.1,wheelMat,x,-1.6,.2,.01,wheel);leg.rotation.z=-x*.27;}
 for(let i=0;i<22;i++) {
  const x=-8+i*.72,y=3.6+.016*x*x;
  mesh(new THREE.SphereGeometry(.055,6,4),glow,x,y,-5.4);
  if(i%2===0) {const flag=mesh(new THREE.ConeGeometry(.18,.4,3),i%4?coral:blue,x+.25,y-.26,-5.4);flag.rotation.z=Math.PI;}
 }
 // Merge scenery by material; prize groups retain their independent sway pivots.
 function batch(group:THREE.Group,recursive=false){
  group.updateWorldMatrix(true,true);
  const batches=new Map<THREE.Material,{parts:THREE.BufferGeometry[],meshes:THREE.Mesh[]}>();
  const inverse=group.matrixWorld.clone().invert();
  const visit=(object:THREE.Object3D)=>{
   if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||Array.isArray(object.material))return;
   const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();
   geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
   const batch=batches.get(object.material)??{parts:[],meshes:[]};batch.parts.push(geometry);batch.meshes.push(object);batches.set(object.material,batch);
  };
  if(recursive)group.traverse(visit);else [...group.children].forEach(visit);
  for(const [material,batch] of batches){const combined=mergeGeometries(batch.parts);batch.parts.forEach(g=>g.dispose());if(!combined)continue;
   batch.meshes.forEach(m=>m.removeFromParent());mesh(combined,material,0,0,0,group);
  }
 }
 prizes.forEach(p=>batch(p));batch(distant,true);batch(root);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let t=0;
 return {
  update(dt:number){if(reduced.matches)return;t+=Math.min(dt,.1);prizes.forEach((p,i)=>p.rotation.z=Math.sin(t*.65+i)*.035);},
  setQuality(low:boolean){distant.visible=!low;},
  dispose(){scene.remove(root);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());},
 };
}
