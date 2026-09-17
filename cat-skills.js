import {ACTIVE_SKILLS} from './roster.js?v=cat29';
import {WORLD} from './data.js?v=cat29';
const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=n=>Math.max(-WORLD+25,Math.min(WORLD-25,n));
export const catSkills={
 resetCatSkills(){this.skillObjects=[];this.skillBuff=null;this.evoTimers={};},
 skillShot(x,y,a,effect,damage,speed=550){this.bullets.push({x,y,px:x,py:y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:effect==='return'?1.5:1.2,age:0,r:6,damage,pierce:effect==='return'?999:3,hit:[],type:'bullet',catEffect:effect,color:(this.classData.color||'#a5efd4')});},
 activateCatSkill(){const p=this.player;if(this.state!=='playing'||p.pulseCd>0)return false;const id=this.classId,r=this.stats.pulseRange,power=this.stats.power;
  p.pulseCd=this.stats.pulseCd;const x=clamp(p.x+Math.cos(p.angle)*150),y=clamp(p.y+Math.sin(p.angle)*150);
  const add=(kind,life,extra={})=>this.skillObjects.push({kind,x:p.x,y:p.y,life,max:life,tick:0,color:(this.classData.color||'#a5efd4'),...extra});
  this.sound.play('weapon-'+(this.classData.effect||id));
  if(id==='runner'){this.skillBuff={kind:'sprint',life:4,tick:0};this.recalculate();}
  if(id==='engineer')add('turret',8,{r:30});
  if(id==='warden'){this.skillBuff={kind:'guard',life:5,shield:Math.round(p.maxHp*.45)};}
  if(id==='spider')add('web',6,{x,y,r:r*.7});
  if(id==='frost'){for(let i=-2;i<=2;i++)this.skillShot(p.x,p.y,p.angle+i*.12,'freeze',(65+this.level*3)*power,620);}
  if(id==='ninja'){const ox=p.x,oy=p.y;p.x=clamp(x+Math.cos(p.angle)*60);p.y=clamp(y+Math.sin(p.angle)*60);p.invuln=Math.max(p.invuln,.65);const dx=p.x-ox,dy=p.y-oy,len=dx*dx+dy*dy;for(const e of this.enemies){const t=len?Math.max(0,Math.min(1,((e.x-ox)*dx+(e.y-oy)*dy)/len)):0;if(!e.dead&&e.warmup<=0&&Math.hypot(e.x-ox-t*dx,e.y-oy-t*dy)<e.r+42)this.damage(e,(170+this.level*5)*power,'pulse');}this.fx.push({kind:'slash',x:(ox+p.x)/2,y:(oy+p.y)/2,a:p.angle,r:Math.hypot(p.x-ox,p.y-oy)/2,life:.35,max:.35,color:'#ffb7db'});}
  if(id==='chef')add('flame',3,{r:r*1.1});
  if(id==='nurse')add('clinic',7,{r:105});
  if(id==='spark'){const targets=this.enemies.filter(e=>!e.dead&&e.warmup<=0&&dist(e,p)<r*1.5).sort((a,b)=>dist(a,p)-dist(b,p)).slice(0,6);for(const e of targets)add('charge',1.2,{targetId:e.id,x:e.x,y:e.y,r:24});}
  if(id==='wizard')add('satellites',7,{r:95,phase:0});
  if(id==='astro')this.wells.push({x,y,r:210,life:4,tick:0});
  if(id==='moon')for(let i=-2;i<=2;i++)this.skillShot(p.x,p.y,p.angle+i*.25,'return',(60+this.level*3)*power,480);
  this.toast(ACTIVE_SKILLS[id].name,false,1.2);return true;
 },
 updateCatSkills(dt){const p=this.player;if(this.skillBuff){const b=this.skillBuff;b.life-=dt;b.flash=Math.max(0,(b.flash||0)-dt);if(b.kind==='sprint'){b.tick-=dt;if(b.tick<=0){b.tick=.3;this.traps.push({x:p.x,y:p.y,age:0,life:1.1,arm:.6,damage:30*this.stats.power,r:65,echo:true});}}if(b.life<=0){this.skillBuff=null;this.recalculate();}}
  for(const z of this.skillObjects){z.life-=dt;z.tick-=dt;
   if(z.kind==='flame'||z.kind==='satellites'){z.x=p.x;z.y=p.y;z.angle=p.angle;z.phase=(z.phase||0)+dt*1.6;}
   if(z.kind==='charge'){const e=this.enemies.find(e=>e.id===z.targetId&&!e.dead);if(!e){z.life=0;continue;}z.x=e.x;z.y=e.y;if(z.life<=0){this.damage(e,110*this.stats.power,'arc');for(const n of this.enemies)if(n!==e&&!n.dead&&dist(n,e)<85)this.damage(n,45*this.stats.power,'arc');this.fx.push({kind:'ring',skillBurst:'electric',x:e.x,y:e.y,r:85,life:.35,max:.35,color:z.color});this.sound.play('arc');if(this.evolved.tesla)this.evolutionBurst?.(e.x,e.y,100,'#ffed8c',true);}continue;}
   if(z.life<=0||z.tick>0)continue;z.tick=z.kind==='flame'?.2:z.kind==='turret'?.45:.5;
   if(z.kind==='turret'||z.kind==='satellites'){const n=this.nearest(z,460);if(n){const count=z.kind==='turret'?1:3;for(let i=0;i<count;i++){const a=z.phase+i*TAU/3,sx=z.kind==='turret'?z.x:z.x+Math.cos(a)*z.r,sy=z.kind==='turret'?z.y:z.y+Math.sin(a)*z.r;this.skillShot(sx,sy,Math.atan2(n.y-sy,n.x-sx),z.kind==='turret'?'pierce':'stars',this.stats.damage*.8);}this.sound.play(z.kind==='turret'?'weapon-engineer':'weapon-stars');}}
   if(z.kind==='flame')this.sound.play('weapon-flame');
   if(z.kind==='clinic'&&dist(p,z)<z.r){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.025);this.hostile=this.hostile.filter(b=>dist(b,z)>z.r);this.ring(z.x,z.y,z.r,'#9affd3',.4);}
   if(z.kind==='web'||z.kind==='flame')for(const e of this.enemies){if(e.dead||e.warmup>0||dist(e,z)>z.r+e.r)continue;if(z.kind==='web'){e.root=Math.max(e.root||0,e.boss?.1:.6);e.slow=.8;this.damage(e,8*this.stats.power,'field');}else if(Math.cos(Math.atan2(e.y-z.y,e.x-z.x)-p.angle)>.75){e.burn=2;this.damage(e,15*this.stats.power,'cat-flame');}}
  }this.skillObjects=this.skillObjects.filter(z=>z.life>0);
 },
 updateEvolutions(dt){const p=this.player,s=this.stats;for(const id of ['aegis','tesla','blizzard','crossbeam','garden']){if(!this.evolved[id])continue;this.evoTimers[id]=(this.evoTimers[id]||0)-dt;if(this.evoTimers[id]>0)continue;
  if(id==='aegis'){const i=this.hostile.findIndex(b=>dist(b,p)<155);if(i>=0){const b=this.hostile.splice(i,1)[0];this.ring(b.x,b.y,24,'#baffdf',.2);this.evoTimers[id]=.35;}}
  if(id==='tesla'){this.evoTimers[id]=4;const n=this.nearest(p,480);if(n){this.skillObjects.push({kind:'charge',x:n.x,y:n.y,targetId:n.id,r:28,life:.8,max:.8,tick:0,color:'#fff39e'});}}
  if(id==='blizzard'){this.evoTimers[id]=2.5;for(let i=0;i<8;i++)this.skillShot(p.x,p.y,i*TAU/8,'freeze',30*s.power,420);}
  if(id==='crossbeam'){this.evoTimers[id]=4;const n=this.nearest(p,550);if(n)for(const a of [0,Math.PI/2]){const dx=Math.cos(a)*230,dy=Math.sin(a)*230;this.fx.push({kind:'rail',x:n.x-dx,y:n.y-dy,tx:n.x+dx,ty:n.y+dy,life:.3,max:.3,color:'#fff1a3',evo:true,final:true});for(const e of this.enemies)if(!e.dead&&e.warmup<=0&&Math.abs((e.x-n.x)*Math.sin(a)-(e.y-n.y)*Math.cos(a))<e.r+10&&dist(e,n)<230)this.damage(e,65*s.power,'rail');}}
  if(id==='garden'){this.evoTimers[id]=5;for(let i=0;i<3;i++){const a=p.angle+(i-1)*.7;this.traps.push({x:clamp(p.x+Math.cos(a)*150),y:clamp(p.y+Math.sin(a)*150),age:0,life:6,arm:1,r:100,damage:95*s.power});}}
 }},
 drawCatSkills(c){c.save();for(const z of this.skillObjects){if(['web','flame','clinic'].includes(z.kind))continue;c.strokeStyle=z.color;c.fillStyle=z.color+'18';c.lineWidth=2;c.beginPath();if(z.kind==='flame'){c.moveTo(z.x,z.y);c.arc(z.x,z.y,z.r,(z.angle||0)-.72,(z.angle||0)+.72);c.closePath();}else c.arc(z.x,z.y,z.r,0,TAU);c.fill();c.stroke();
  if(z.kind==='web')for(let i=0;i<8;i++){c.beginPath();c.moveTo(z.x,z.y);c.lineTo(z.x+Math.cos(i*TAU/8)*z.r,z.y+Math.sin(i*TAU/8)*z.r);c.stroke();}
  if(z.kind==='turret')this.drawDrone(c,z.x,z.y,this.visualTime);
  if(z.kind==='satellites')for(let i=0;i<3;i++){const a=z.phase+i*TAU/3;this.drawDrone(c,z.x+Math.cos(a)*z.r,z.y+Math.sin(a)*z.r,a);}
  if(z.kind==='clinic'){c.beginPath();c.moveTo(z.x-12,z.y);c.lineTo(z.x+12,z.y);c.moveTo(z.x,z.y-12);c.lineTo(z.x,z.y+12);c.stroke();}
 }if(this.skillBuff&&this.skillBuff.kind!=='guard'){c.strokeStyle=this.skillBuff.kind==='guard'?'#ffe4a4':'#9fffe0';c.lineWidth=3;c.beginPath();c.arc(this.player.x,this.player.y,38,0,TAU);c.stroke();}c.restore();}
};
