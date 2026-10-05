import type { DuelSnapshot } from '../game/duel.ts';
import type { StrikeResult } from '../game/types.ts';
export function impactStyle(hit: StrikeResult) {
 const kind = !hit.contact ? 'miss' : hit.oneHit ? 'perfect' : hit.finishing ? 'finish' : Math.hypot(hit.bend.x,hit.bend.y)>.08 ? 'glance' : 'normal';
 return {kind, intensity:!hit.contact?.12:hit.oneHit?1:hit.finishing?.8:.25+hit.usablePower*.45, hold:hit.contact&&hit.usablePower>.7?.045:0};
}
/** Independent presentation subscribers consume the model's resolved action exactly once. */
export class ActionEvents {
 private swing=0; private contact=0; private phase='';
 sample(s:DuelSnapshot) {
  if(s.actionId===0){this.swing=0;this.contact=0;}
  const swing=s.phase==='SWING'&&s.actionId!==this.swing;
  const contact=s.appliedActionId>0&&s.appliedActionId!==this.contact?s.lastResult:null;
  const celebrate=s.phase==='MATCH_RESULT'&&this.phase!=='MATCH_RESULT';
  if(swing)this.swing=s.actionId;if(contact)this.contact=s.appliedActionId;this.phase=s.phase;
  return {swing,contact,celebrate};
 }
}
