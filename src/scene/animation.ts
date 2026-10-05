import { DUEL_TIMING, type DuelSnapshot } from '../game/duel.ts';
export type OperatorClip = 'idle'|'setup'|'aim'|'swing'|'straighten'|'confident'|'surprised'|'disappointed'|'celebrate';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
/** Presentation samples the simulation timeline; it never schedules or applies contact. */
export function operatorClip(s:DuelSnapshot):OperatorClip {
 if(s.phase==='MATCH_RESULT')return s.mode==='pass-and-play'||s.winner==='p2'?'celebrate':'disappointed';
 if(s.phase==='NAIL_STRAIGHTEN')return 'straighten';
 if(s.phase==='NAIL_SETUP')return 'setup';
 if(s.phase==='TURN_HANDOFF')return 'confident';
 if(s.phase==='ROUND_RESULT'||s.phase==='IMPACT_RESOLUTION'){
  const hit=s.pending??s.lastResult;
  if(!hit)return 'idle';
  if(s.mode==='pass-and-play')return hit.finishing?'celebrate':hit.contact?'confident':'surprised';
  if(hit.actor==='p2')return hit.finishing?'celebrate':!hit.contact||Math.hypot(hit.bend.x,hit.bend.y)>.08?'disappointed':'confident';
  return hit.oneHit?'surprised':hit.finishing?'disappointed':'confident';
 }
 if(!s.isHuman&&s.mode==='solo')return s.phase==='SWING'||s.phase==='READY_TO_SWING'?'swing':s.phase==='TARGET_Y'?'aim':'idle';
 return 'idle';
}
export function hammerMotion(s:DuelSnapshot){
 if(s.phase==='SWING'){
  const t=clamp(s.elapsed/DUEL_TIMING.contact);
  // A short loading beat, then a cubic acceleration; exact same contact boundary.
  const travel=t<.16?-.07*Math.sin(t/.16*Math.PI):Math.pow((t-.16)/.84,3);
  return {lift:.72*(1-travel),angle:-.55*(1-smooth(t)),progress:t};
 }
 if(s.phase==='IMPACT_RESOLUTION'){
  const t=clamp(s.elapsed/.36),strength=s.pending?.usablePower??0;
  const lift=(.15+strength*.16)*Math.sin(Math.PI*t)*Math.exp(-t*.7);
  return {lift,angle:-.17*Math.sin(Math.PI*t),progress:1};
 }
 const t=smooth(s.elapsed/DUEL_TIMING.ready);
 return {lift:.60+.12*t,angle:-.42-.13*t,progress:0};
}
