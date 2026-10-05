import * as THREE from 'three';
import type { DuelSnapshot } from '../game/duel.ts';
import { impactStyle } from './events.ts';
/** Fixed pools: cosmetic particles never consume gameplay RNG or allocate per strike. */
export function createImpactEffects(scene:THREE.Scene){
 const count=80,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 // Soft round sparks avoid square point sprites; one tiny texture is shared by the pool.
 const spritePixels=new Uint8Array(16*16*4);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const i=(y*16+x)*4,r=Math.hypot((x-7.5)/7.5,(y-7.5)/7.5);
  spritePixels[i]=spritePixels[i+1]=spritePixels[i+2]=255;spritePixels[i+3]=Math.round(Math.max(0,1-r)**1.5*255);
 }
 const sprite=new THREE.DataTexture(spritePixels,16,16);sprite.needsUpdate=true;
 const material=new THREE.PointsMaterial({size:.055,map:sprite,vertexColors:true,transparent:true,depthWrite:false,opacity:1});
 const particles=new THREE.Points(geometry,material);particles.frustumCulled=false;particles.visible=false;scene.add(particles);
 const ringMaterial=new THREE.MeshBasicMaterial({color:'#ffd07b',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const ringGeometry=new THREE.RingGeometry(.085,.11,40);const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2;scene.add(ring);
 const trailData=new Float32Array(24);const trailGeometry=new THREE.BufferGeometry();trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailData,3));
 const trailMaterial=new THREE.LineBasicMaterial({color:'#ffd797',transparent:true,opacity:.45,depthWrite:false});
 const trail=new THREE.Line(trailGeometry,trailMaterial);trail.frustumCulled=false;trail.visible=false;scene.add(trail);
 let previousPhase='',time=0,trailCount=0;const impulse=new THREE.Vector3();
 function update(s:DuelSnapshot,dt:number,origin:THREE.Vector3,hammerFace:THREE.Vector3,low:boolean,reduced:boolean){
  if(previousPhase!==s.phase){time=0;trailCount=0;}else time+=dt;previousPhase=s.phase;
  impulse.set(0,0,0);particles.visible=false;ring.visible=false;trail.visible=false;
  const hit=s.lastResult,active=s.phase==='IMPACT_RESOLUTION'&&hit;
  if(active){const style=impactStyle(hit),age=s.elapsed;material.size=hit.oneHit?.095:.055;
   ring.visible=hit.contact&&age<.45;ring.position.copy(origin);ring.scale.setScalar(1+age*(hit.oneHit?9:5));ringMaterial.opacity=(1-age/.45)*style.intensity;ringMaterial.color.set(hit.oneHit?'#fff1a0':style.kind==='glance'?'#78e5f0':'#ffc27e');
   if(!reduced){particles.visible=hit.contact&&age<.55;geometry.setDrawRange(0,low?16:hit.oneHit?64:32);
    for(let i=0;i<count;i++){const a=i*2.39996,speed=(.3+(i%7)*.13)*style.intensity;const glance=style.kind==='glance';
     positions[i*3]=origin.x+Math.cos(a)*speed*age+(glance?hit.bend.x*age*3:0);
     positions[i*3+1]=origin.y+(.3+(i%5)*.15)*age-2.5*age*age;
     positions[i*3+2]=origin.z+Math.sin(a)*speed*age-(glance?hit.bend.y*age*3:0);
     const dust=i%3===0;colors[i*3]=dust? .65:1;colors[i*3+1]=dust?.4:.8;colors[i*3+2]=dust?.2:hit.oneHit?.7:.35;
    }
    material.opacity=Math.max(0,1-age/.55);impulse.set(Math.sin(age*100),Math.cos(age*83),0).multiplyScalar(style.intensity*.025*Math.max(0,1-age/.18));
   }
  }
  if(s.phase==='SWING'&&!reduced){
   if(dt>0||trailCount===0){
   for(let i=7;i>0;i--)for(let axis=0;axis<3;axis++)trailData[i*3+axis]=trailData[(i-1)*3+axis]!;
   hammerFace.toArray(trailData,0);trailCount=Math.min(8,trailCount+1);}
   trailGeometry.setDrawRange(0,trailCount);trail.visible=trailCount>1;trailGeometry.attributes.position!.needsUpdate=true;
  }
  if(s.phase==='MATCH_RESULT'&&!reduced&&time<2.8){material.size=.07;particles.visible=true;geometry.setDrawRange(0,low?24:80);material.opacity=Math.min(1,2.8-time);
   for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*7.13)*2.2;positions[i*3+1]=3.4+(i%11)*.12-time*.9;positions[i*3+2]=Math.cos(i*3.7)*1.3;colors[i*3]=i%2?1:.3;colors[i*3+1]=.7;colors[i*3+2]=i%2?.3:1;}
  }
  geometry.attributes.position!.needsUpdate=true;geometry.attributes.color!.needsUpdate=true;
  return impulse;
 }
 return {update,dispose(){scene.remove(particles,ring,trail);geometry.dispose();material.dispose();sprite.dispose();ringGeometry.dispose();ringMaterial.dispose();trailGeometry.dispose();trailMaterial.dispose();}};
}
