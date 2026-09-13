import {WORLD} from './data.js?v=cat20';
const TAU=Math.PI*2,clamp=n=>Math.max(-WORLD+80,Math.min(WORLD-80,n));
export function bossProfile(e){return e.type==='final'?{name:'야간점장 · 오버클린',sprite:'robot-boss',color:'#ffcc83',hint:'레이저 → 포위 → 청소 폭주'}:e.tier===1?{name:'청소반장 · 돌돌이',sprite:'robot-cleaner',color:'#9fe8d9',hint:'예고선을 피하고 돌진 뒤를 노리세요'}:{name:'냉장고지기 · 프로스티',sprite:'robot-toy',color:'#a9dcff',hint:'냉기 장판 사이 빈 공간으로 이동하세요'};}
export const catBosses={
 updateCatBoss(e,dt){if(e.dead)return;for(const k of ['warmup','flash','exposed','chill','burn','slow'])e[k]=Math.max(0,(e[k]||0)-dt);e.burnTick=(e.burnTick??.5)-dt;if(e.burn>0&&e.burnTick<=0){e.burnTick=.5;this.damage(e,7*this.stats.power,'burn');if(e.dead)return;}if(e.warmup>0)return;
 const p=this.player,profile=bossProfile(e),stage=e.hp/e.maxHp<.33?2:e.hp/e.maxHp<.66?1:0;
 if(stage>(e.bossStage||0)){e.bossStage=stage;this.toast(profile.name+' · '+['','출력 상승','최대 출력'][stage],true,2);this.ring(e.x,e.y,e.r+45,profile.color,.5);this.sound.play('boss');}
 const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.angle=Math.atan2(dy,dx);
 if(e.dashWait>0){e.dashWait-=dt;if(e.dashWait<=0)e.dashLeft=.55;}
 else if(e.dashLeft>0){e.dashLeft-=dt;e.x=clamp(e.x+e.dashVX*dt);e.y=clamp(e.y+e.dashVY*dt);if(e.dashLeft<=0){e.exposed=3;this.ring(e.x,e.y,90,profile.color,.4);}}
 else {const speed=e.speed*(e.slow>0?.5:1),move=e.tier===2&&e.type!=='final'?(d>360?1:d<260?-1:0):d>120?1:0;e.x=clamp(e.x+dx/d*speed*dt*move);e.y=clamp(e.y+dy/d*speed*dt*move);}
 if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+12)this.hitPlayer(e.damage);
 e.patternCd=(e.patternCd??3)-dt;if(e.patternCd>0||e.dashWait>0||e.dashLeft>0)return;
 const seq=e.patternSeq||0;e.patternSeq=seq+1;
 if(e.type!=='final'&&e.tier===1){e.patternCd=6.5-stage*.6;const a=e.angle,length=Math.min(390,d+80);e.dashVX=Math.cos(a)*length/.55;e.dashVY=Math.sin(a)*length/.55;e.dashWait=1.25;this.addLine(e.x,e.y,e.x+Math.cos(a)*length,e.y+Math.sin(a)*length,1.25,.55,30,e.damage*.65);this.float(e.x,e.y-e.r-30,'돌진 준비!','#c7fff0',14);}
 else if(e.type!=='final'){e.patternCd=6-stage*.5;e.exposed=2;const gap=e.angle+Math.PI/2;for(let i=0;i<6;i++){const a=i*TAU/6+gap;if(i===0)continue;if(this.hazards.length<24)this.hazards.push({x:clamp(p.x+Math.cos(a)*140),y:clamp(p.y+Math.sin(a)*140),r:48,life:1.65,max:1.65,damage:e.damage*.8});}if(seq%2===1&&this.hazards.length<24)this.hazards.push({x:p.x,y:p.y,r:60,life:1.8,max:1.8,damage:e.damage});this.float(e.x,e.y-e.r-30,'냉기 포위 · 틈으로!','#baeaff',14);}
 else {e.patternCd=6.8-stage*.7;e.exposed=2.5;const pattern=(seq+stage)%3;
 if(pattern===0){for(const a of [e.angle-.32,e.angle+.32])this.addLine(e.x,e.y,e.x+Math.cos(a)*800,e.y+Math.sin(a)*800,1.5,.4,20,e.damage);this.float(e.x,e.y-e.r-30,'분리 레이저!','#ffe5b8',14);}
 if(pattern===1){this.addWave(e.x,e.y,410,e.angle,1.5);this.float(e.x,e.y-e.r-30,'초록 틈으로!','#baffd9',14);}
 if(pattern===2){for(let i=0;i<3+stage;i++){const a=i*TAU/(3+stage);if(this.hazards.length<24)this.hazards.push({x:clamp(p.x+Math.cos(a)*170),y:clamp(p.y+Math.sin(a)*170),r:55,life:1.6,max:1.6,damage:e.damage*.8});}this.float(e.x,e.y-e.r-30,'청소 폭주!','#ffe5b8',14);}
 }
 }
};
