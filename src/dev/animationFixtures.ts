import {Duel,type DuelSnapshot} from '../game/duel.ts';
import {applyStrike,createNail,resolveStrike} from '../game/strike.ts';
export const ANIMATION_CASES=['Idle','Setup','Aim','Swing','Contact','Normal rebound','Glancing rebound','Straighten','Near flush','One hit','Losing','Confident','Host celebration'] as const;
export function animationFixture(name:string):DuelSnapshot{
 const base=new Duel(12,{firstStarter:'p2'}).snapshot;
 const fresh=createNail();
 const glance=name==='Glancing rebound'||name==='Straighten';
 const before=name==='Near flush'?{...fresh,depth:.91}:fresh;
 const hit=resolveStrike(before,{actor:name==='One hit'?'p1':'p2',offset:glance?{x:-.85,y:.15}:{x:0,y:0},reticleQuality:1,swipePower:name==='Normal rebound'?.3:1});
 const after=applyStrike(before,hit);
 const common={...base,phase:'IMPACT_RESOLUTION',elapsed:.12,pending:hit,lastResult:hit,nail:after,aim:hit.offset,actor:hit.actor,actionId:1,appliedActionId:1,isHuman:hit.actor==='p1'} as DuelSnapshot;
 if(name==='Idle')return base;
 if(name==='Setup')return {...base,phase:'NAIL_SETUP',elapsed:.2,isHuman:true};
 if(name==='Aim')return {...base,phase:'TARGET_Y',elapsed:.35};
 if(name==='Swing'||name==='Contact')return {...common,phase:'SWING',nail:before,elapsed:name==='Swing'?.1:.24,appliedActionId:0};
 if(name==='Straighten')return {...common,phase:'NAIL_STRAIGHTEN',elapsed:.2};
 if(name==='Losing')return {...common,phase:'MATCH_RESULT',winner:'p1'};
 if(name==='Confident')return {...base,phase:'TURN_HANDOFF',isHuman:true};
 if(name==='Host celebration')return {...common,mode:'pass-and-play',isHuman:true,phase:'ROUND_RESULT'};
 return common;
}
