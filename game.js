import {CLASSES,UPGRADES,EVOLUTIONS,ENEMY_TYPES,RELAY_POSITIONS,DURATION,WORLD,VERSION,xpRequired} from './data.js?v=cat5';

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
const norm=(x,y)=>{const d=Math.hypot(x,y)||1;return {x:x/d,y:y/d};};
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
const COLORS={mint:'#4b7bbf',orange:'#d9783e',floor:'#0d181d'};

export class Game {
  constructor(canvas,callbacks,sound,settings){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.callbacks=callbacks;this.sound=sound;this.settings=settings;
    this.state='menu';this.keys=new Set();this.touch={x:0,y:0};this.camera={x:0,y:0};this.fx=[];this.texts=[];this.beams=[];this.visualTime=0;this.frameCount=0;this.shake=0;this.flash=0;this.uid=1;this.w=1280;this.h=800;this.zoom=1;
    this.decor=this.makeDecor();this.resetDemo();
  }
  makeDecor(){let seed=4821;const r=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};return Array.from({length:100},()=>({x:(r()-.5)*WORLD*2,y:(r()-.5)*WORLD*2,w:12+r()*42,h:12+r()*65,a:r()*Math.PI,kind:Math.floor(r()*3)}));}
  resetDemo(){this.player={x:80,y:50,hp:110,maxHp:110,angle:-1.1,invuln:0,dashTime:0};this.enemies=[];this.bullets=[];this.hostile=[];this.loot=[];this.hazards=[];this.camera={x:-200,y:-50};this.relays=RELAY_POSITIONS.map((p,i)=>({...p,id:i,charge:0,active:false,unlock:[60,240,420][i]}));this.t=0;this.u={};this.evolved={};this.stats={speed:220,pickup:95,range:470};}
  resize(w,h,dpr=1){this.w=w;this.h=h;this.dpr=Math.min(dpr,2);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.zoom=clamp(Math.min(w/1300,h/850),.64,1.2);}
  start(classId,meta,difficulty=0){
    this.classId=classId;this.classData=CLASSES.find(c=>c.id===classId)||CLASSES[0];this.base={...meta.base};this.difficulty=difficulty;
    this.seed=(Date.now()^Math.floor(Math.random()*1e8))>>>0;this.rng=this.seed||1;this.uid=1;this.runId=String(Date.now())+'-'+this.seed;
    this.t=0;this.kills=0;this.level=1;this.xp=0;this.pendingLevels=0;this.u={};if(classId==='engineer')this.u.orbit=1;this.evolved={};this.collected=0;this.bossKills=0;this.eliteKills=0;this.finalDead=false;this.evacuating=0;this.eventIndex=0;this.spawnTimer=.8;this.fieldTimer=0;this.regenTimer=0;this.saveTimer=20;this.survivalBeat=0;this.pickupSound=0;this.damageTaken=0;this.rerolls=2;this.choiceSet=[];
    this.events=[{t:60,type:'relay',id:0},{t:100,type:'swarm'},{t:150,type:'elite'},{t:240,type:'relay',id:1},{t:300,type:'boss',tier:1},{t:390,type:'swarm'},{t:450,type:'elite'},{t:420,type:'relay',id:2},{t:600,type:'boss',tier:2},{t:690,type:'swarm'},{t:750,type:'elite'},{t:840,type:'final'},{t:900,type:'evac'}].sort((a,b)=>a.t-b.t);
    this.enemies=[];this.bullets=[];this.hostile=[];this.loot=[];this.hazards=[];this.fx=[];this.texts=[];this.beams=[];this.relays=RELAY_POSITIONS.map((p,i)=>({...p,id:i,charge:0,active:false,unlock:[60,240,420][i]}));
    this.recalculate();this.player={x:0,y:0,hp:this.stats.maxHp,maxHp:this.stats.maxHp,angle:-Math.PI/2,invuln:1.5,dashTime:0,dashCd:0,pulseCd:0,shotCd:.35,arcCd:1,rocketCd:2,dashX:0,dashY:-1,moveX:0,moveY:-1};this.camera={x:0,y:0};this.shake=0;this.flash=0;this.charging=null;this.keys.clear();this.touch={x:0,y:0};this.state='playing';this.callbacks.start?.();this.toast('이동하며 간식 조각을 수집하세요. 공격은 자동입니다.',false,6);this.spawnLoot('xp',-70,-60,3);this.spawnLoot('xp',65,-100,3);this.spawnLoot('xp',0,110,3);for(const [x,y] of [[420,-170],[-380,180],[60,540]])this.spawnEnemy('stalker',x,y).warmup=1.2;
  }
  random(){let x=this.rng;x^=x<<13;x^=x>>>17;x^=x<<5;this.rng=x>>>0;return this.rng/4294967296;}
  recalculate(){const c=this.classData||CLASSES[0],u=this.u,b=this.base||{};this.stats={maxHp:c.hp+(b.hull||0)*10+(u.vitality||0)*25+(u.armor||0)*10,speed:c.speed*(1+(u.speed||0)*.08),damage:c.damage*(1+(u.power||0)*.18+(b.output||0)*.04),power:1+(u.power||0)*.18+(b.output||0)*.04,haste:1+(u.haste||0)*.15,armor:c.armor+(u.armor||0)*2,crit:.08+(u.crit||0)*.1,critDamage:1.8+(u.crit||0)*.25,range:470*(1+(u.pierce||0)*.1),pickup:95*(1+(u.magnet||0)*.35),xpBonus:1+(u.magnet||0)*.1+(b.learning||0)*.04,regen:(u.regen||0)*.45,dashCd:c.dash*(1-(u.speed||0)*.08),pulseCd:19*(1-(u.pulse||0)*.15),pulseRange:230*(1+(u.pulse||0)*.2)};if(this.player)this.player.maxHp=this.stats.maxHp;}
  toast(message,warning=false,duration=4){this.callbacks.toast?.(message,warning,duration);}
  pause(){if(this.state!=='playing')return;this.state='paused';this.keys.clear();this.touch={x:0,y:0};this.callbacks.pause?.();}
  resume(){if(this.state!=='paused')return;this.state='playing';this.keys.clear();this.callbacks.resume?.();}
  dash(){const p=this.player;if(this.state!=='playing'||p.dashCd>0)return false;let x=this.touch.x+(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0),y=this.touch.y+(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);if(!x&&!y){x=p.moveX;y=p.moveY;}const n=norm(x,y);p.dashX=n.x;p.dashY=n.y;p.dashTime=.2;p.invuln=Math.max(p.invuln,.4);p.dashCd=this.stats.dashCd;this.sound.play('dash');this.ring(p.x,p.y,55,COLORS.mint,.25);return true;}
  pulse(){const p=this.player;if(this.state!=='playing'||p.pulseCd>0)return false;p.pulseCd=this.stats.pulseCd;const r=this.stats.pulseRange;this.ring(p.x,p.y,r,COLORS.orange,.65);this.ring(p.x,p.y,r*.8,'#ffffff',.35);this.sound.play('pulse');this.shake=Math.max(this.shake,7);for(const e of this.enemies){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<r+e.r&&e.warmup<=0){this.damage(e,(95+this.level*4)*this.stats.power,'pulse');const n=norm(e.x-p.x,e.y-p.y);e.x+=n.x*(e.boss?14:85);e.y+=n.y*(e.boss?14:85);e.slow=2.5;}}this.hostile=this.hostile.filter(b=>Math.hypot(b.x-p.x,b.y-p.y)>r);return true;}
  input(){let x=this.touch.x+(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0),y=this.touch.y+(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);const d=Math.hypot(x,y);if(d>1){x/=d;y/=d;}return{x,y};}
  update(dt){
    if(this.state!=='playing')return;
    this.t+=dt;const p=this.player,s=this.stats;this.pickupSound-=dt;this.saveTimer-=dt;this.fieldTimer-=dt;
    if(this.saveTimer<=0){this.saveTimer=20;this.callbacks.save?.();}
    p.invuln=Math.max(0,p.invuln-dt);p.dashCd=Math.max(0,p.dashCd-dt);p.pulseCd=Math.max(0,p.pulseCd-dt);p.shotCd-=dt;p.arcCd-=dt;p.rocketCd-=dt;
    const v=this.input();if(v.x||v.y){p.moveX=v.x;p.moveY=v.y;}
    if(p.dashTime>0){p.x+=p.dashX*900*dt;p.y+=p.dashY*900*dt;p.dashTime-=dt;if(this.settings.particles)this.fx.push({kind:'ghost',x:p.x,y:p.y,angle:p.angle,life:.2,max:.2,color:COLORS.mint});}
    else{p.x+=v.x*s.speed*dt;p.y+=v.y*s.speed*dt;}
    p.x=clamp(p.x,-WORLD+35,WORLD-35);p.y=clamp(p.y,-WORLD+35,WORLD-35);p.hp=Math.min(p.maxHp,p.hp+s.regen*dt);
    while(this.eventIndex<this.events.length&&this.t>=this.events[this.eventIndex].t)this.runEvent(this.events[this.eventIndex++]);
    this.spawnTimer-=dt;
    if(this.spawnTimer<=0){this.spawnTimer=1/(.8+this.t*.0095)*(this.difficulty? .8:1);if(this.enemies.length<190)this.spawnRandom();}
    this.spatial=new Map();for(const e of this.enemies){const key=(Math.floor(e.x/96)+40)*100+Math.floor(e.y/96)+40;let bucket=this.spatial.get(key);if(!bucket)this.spatial.set(key,bucket=[]);bucket.push(e);}
    this.updateMain(v);
    if(p.shotCd<-.1)p.shotCd=-.1;
    this.updateWeapons(dt);
    for(const e of this.enemies){this.updateEnemy(e,dt);if(this.state==='ended')return;}
    for(const b of this.bullets)this.updateBullet(b,dt);
    this.bullets=this.bullets.filter(b=>b.life>0);
    for(const b of this.hostile){b.life-=dt;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.life>0&&this.segmentHit(b,p,13+b.r)){b.life=0;this.hitPlayer(b.damage);if(this.state==='ended')return;}}
    this.hostile=this.hostile.filter(b=>b.life>0&&Math.abs(b.x)<WORLD+300&&Math.abs(b.y)<WORLD+300);
    for(const h of this.hazards){h.life-=dt;if(h.life<=0&&!h.fired){h.fired=true;this.ring(h.x,h.y,h.r,'#ff8566',.6);this.particles(h.x,h.y,20,'#fbac79',160);if(Math.hypot(h.x-p.x,h.y-p.y)<h.r+11)this.hitPlayer(h.damage);if(this.state==='ended')return;}}
    this.hazards=this.hazards.filter(h=>h.life>0);
    this.enemies=this.enemies.filter(e=>!e.dead);
    this.updateLoot(dt);this.updateRelays(dt);
    if(this.t>=DURATION){if(this.relays.every(r=>r.active)&&this.finalDead){if(Math.hypot(p.x,p.y)<125){this.evacuating+=dt;if(this.evacuating>=5)this.finish(true);}else this.evacuating=Math.max(0,this.evacuating-dt*.4);}else this.evacuating=0;}
    if(this.pendingLevels>0&&this.state==='playing')this.levelUp();
    this.sound.ambient(dt,Math.min(1,this.t/DURATION));
  }
  runEvent(event){
    if(event.type==='relay')this.toast('간식 창고 0'+(event.id+1)+' 간식 발견. 지도와 방향 표시를 따라가세요.',false,7);
    if(event.type==='swarm'){this.toast('이상 파동 감지 · 군집이 접근합니다.',true,5);for(let i=0;i<24;i++)if(this.enemies.length<200)this.spawnEnemy(i%4===0?'charger':'skitter');}
    if(event.type==='elite'){this.spawnEnemy('elite',undefined,undefined,{tier:Math.round(event.t/150)});this.toast('대형 장난감 접근 · 처치하면 간식 봉지를 얻습니다.',true,5);this.sound.play('boss');}
    if(event.type==='boss'){this.spawnEnemy('sentinel',undefined,undefined,{tier:event.tier});this.toast(event.tier===1?'첫 번째 청소로봇가 깨어났습니다.':'점보 청소기가 접근합니다.',true,6);this.sound.play('boss');}
    if(event.type==='final'){this.spawnEnemy('final',undefined,undefined,{tier:1});this.toast('대왕 청소기 · 대왕 청소기',true,7);this.sound.play('boss');}
    if(event.type==='evac')this.toast(this.relays.every(r=>r.active)&&this.finalDead?'퇴근 준비 완료. 중앙의 원 안에서 5초간 버티세요.':'문 열릴 시간. 간식 창고 3개와 대왕 청소기를 확인하세요.',false,8);
  }
  spawnRandom(){const q=this.random(),t=this.t;let type='stalker';if(t>45&&q<.2)type='skitter';if(t>100&&q>.78)type='brute';if(t>175&&q>.55&&q<.68)type='spitter';if(t>250&&q>.38&&q<.51)type='charger';if(t>380&&q>.68&&q<.78)type='splitter';this.spawnEnemy(type);}
  spawnEnemy(type,x,y,extra={}){
    const data=ENEMY_TYPES[type];if(!data)return;
    if(x===undefined){const a=this.random()*TAU;const radius=Math.min(1100,Math.max(610,Math.hypot(this.w,this.h)/(2*this.zoom)+90));x=clamp(this.player.x+Math.cos(a)*radius,-WORLD+45,WORLD-45);y=clamp(this.player.y+Math.sin(a)*radius,-WORLD+45,WORLD-45);if(Math.hypot(x-this.player.x,y-this.player.y)<260){const n=norm(-this.player.x,-this.player.y);x=clamp(this.player.x+n.x*680,-WORLD+45,WORLD-45);y=clamp(this.player.y+n.y*680,-WORLD+45,WORLD-45);}}
    const boss=type==='sentinel'||type==='final';const scale=boss?1+((extra.tier||1)-1)*.6:1+Math.pow(this.t/400,1.25)*1.3;const mode=this.difficulty?1.3:1;
    const e={...data,id:this.uid++,type,x,y,angle:0,hp:data.hp*scale*mode,maxHp:data.hp*scale*mode,speed:data.speed*(1+Math.min(.3,this.t/3000))*(this.difficulty?1.07:1),damage:data.damage*(1+this.t/1800)*mode,boss,tier:extra.tier||1,attackCd:2+this.random(),skillCd:4,chargeTimer:0,chargeX:0,chargeY:0,warmup:boss?2.5:.55,flash:0,slow:0,orbitCd:0,fieldCd:0,dead:false,phase:0};
    this.enemies.push(e);return e;
  }
  nearest(point,range,exclude){let best=null,d2=range*range;for(const e of this.enemies){if(e.dead||e.warmup>0||exclude?.has(e.id))continue;const d=dist2(point,e);if(d<d2){d2=d;best=e;}}return best;}
  nearEnemies(x,y,r){if(!this.spatial)return this.enemies;const result=[];const x1=Math.floor((x-r-75)/96),x2=Math.floor((x+r+75)/96),y1=Math.floor((y-r-75)/96),y2=Math.floor((y+r+75)/96);for(let ix=x1;ix<=x2;ix++)for(let iy=y1;iy<=y2;iy++){const a=this.spatial.get((ix+40)*100+iy+40);if(a)result.push(...a);}return result;}
  updateMain(v){const p=this.player,target=this.nearest(p,this.stats.range);if(target){p.angle=Math.atan2(target.y-p.y,target.x-p.x);if(p.shotCd<=0)this.fireMain(target);}else if(v.x||v.y)p.angle=Math.atan2(v.y,v.x);}
  fireMain(target){const p=this.player;const count=(this.classId==='warden'?3:1)+(this.u.multi||0);const spread=this.classId==='warden'?.15:.105;p.shotCd=this.classData.interval/this.stats.haste;const a=Math.atan2(target.y-p.y,target.x-p.x);for(let i=0;i<count;i++){const angle=a+(i-(count-1)/2)*spread;this.bullets.push({x:p.x+Math.cos(a)*18,y:p.y+Math.sin(a)*18,px:p.x,py:p.y,vx:Math.cos(angle)*760,vy:Math.sin(angle)*760,life:this.stats.range/760,r:3.5,damage:this.stats.damage,pierce:this.u.pierce||0,hit:[],type:'bullet',color:COLORS.mint});}this.sound.play('shot');}
  updateWeapons(dt){
    const p=this.player,s=this.stats;
    if(this.u.orbit){const n=this.u.orbit+(this.evolved.nova?4:0),radius=this.evolved.nova?120:83;for(let i=0;i<n;i++){const a=this.t*(this.evolved.nova?2.8:2.2)*s.haste+i*TAU/n;const r=this.evolved.nova&&i%2?165:radius;const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;for(const e of this.nearEnemies(x,y,20)){if(e.dead||e.warmup>0||e.orbitCd>0)continue;if(Math.hypot(x-e.x,y-e.y)<e.r+15){e.orbitCd=.24;this.damage(e,(18+this.u.orbit*8)*s.power*(this.evolved.nova?1.5:1),'orbit');}}}}
    if(this.u.arc&&p.arcCd<=0){const first=this.nearest(p,490);if(first){p.arcCd=(2.4-this.u.arc*.17)/s.haste;const hit=new Set();let from=p,target=first;const jumps=2+this.u.arc+(this.evolved.storm?7:0);for(let i=0;i<jumps&&target;i++){hit.add(target.id);this.beams.push({x:from.x,y:from.y,tx:target.x,ty:target.y,life:.22,max:.22,color:this.evolved.storm?'#eee4ad':'#a9c6f3'});this.damage(target,(35+this.u.arc*16)*s.power*(this.evolved.storm?2:1),'arc');from=target;target=this.nearest(from,270,hit);}}}
    if(this.u.rocket&&p.rocketCd<=0){const target=this.nearest(p,760);if(target){p.rocketCd=(3.1-this.u.rocket*.18)/s.haste;const n=this.evolved.barrage?3:1;for(let i=0;i<n;i++){const a=p.angle+(i-(n-1)/2)*.6;this.bullets.push({x:p.x,y:p.y,px:p.x,py:p.y,vx:Math.cos(a)*310,vy:Math.sin(a)*310,life:3.8,r:7,damage:(62+this.u.rocket*30)*s.power,pierce:0,hit:[],type:'rocket',targetId:target.id,blast:85+this.u.rocket*8+(this.evolved.barrage?60:0),color:'#efbc91'});}}}
    if(this.u.field&&this.fieldTimer<=0){this.fieldTimer=.45;const r=104+this.u.field*15+(this.evolved.absolute?90:0);for(const e of this.nearEnemies(p.x,p.y,r)){if(!e.dead&&e.warmup<=0&&Math.hypot(e.x-p.x,e.y-p.y)<r+e.r){e.slow=this.evolved.absolute?1.5:.7;this.damage(e,(8+this.u.field*5)*s.power*(this.evolved.absolute?2.2:1),'field');}}}
  }
  updateEnemy(e,dt){
    if(e.dead)return;e.warmup-=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);e.orbitCd=Math.max(0,e.orbitCd-dt);if(e.warmup>0)return;
    const p=this.player;let dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;e.angle=Math.atan2(dy,dx);let speed=e.speed*(e.slow>0?(this.evolved.absolute?.23:.5):1);
    e.attackCd-=dt;e.skillCd-=dt;
    if(e.type==='spitter'){if(d<300)speed=-speed*.55;else if(d<410)speed=0;if(e.attackCd<=0&&d<730){e.attackCd=2.8;this.shootEnemy(e,e.angle,210,1,.2);}}
    if(e.type==='charger'){
      if(e.chargeTimer>0){e.chargeTimer-=dt;if(e.chargeTimer>.38)speed=0;else{e.x+=e.chargeX*510*dt;e.y+=e.chargeY*510*dt;speed=0;}}
      else if(e.attackCd<=0&&d<520){e.attackCd=4.7;e.chargeTimer=1.05;e.chargeX=dx/d;e.chargeY=dy/d;}
    }
    if(e.type==='elite'&&e.attackCd<=0){e.attackCd=3.5;this.shootEnemy(e,e.angle,175,7,.29);}
    if(e.boss){
      if(d<220)speed=-speed*.45;const phase=e.hp/e.maxHp<.45?1:0;
      if(e.attackCd<=0){e.attackCd=(e.type==='final'?2.8:3.9)-(phase*.6);const n=e.type==='final'?14:10;for(let i=0;i<n;i++)this.shootEnemy(e,i*TAU/n+this.t*.13,phase?215:165,1,0);if(e.type==='final')this.shootEnemy(e,e.angle,250,3,.16);}
      if(e.skillCd<=0){e.skillCd=e.type==='final'?5.3:7.4;const count=e.type==='final'?5:3;for(let i=0;i<count;i++){const a=this.random()*TAU,rd=i===0?0:80+this.random()*200;this.hazards.push({x:p.x+Math.cos(a)*rd,y:p.y+Math.sin(a)*rd,r:e.type==='final'?83:68,life:1.7,max:1.7,damage:e.damage,fired:false});}}
      if(phase&&!e.phase){e.phase=1;this.ring(e.x,e.y,150,COLORS.orange,.8);this.toast(e.type==='final'?'청소로봇 우다다 · 공격 간격이 짧아집니다.':'청소로봇가 폭주합니다. 붉은 영역을 피하세요.',true,4);}
    }
    e.x+=dx/d*speed*dt;e.y+=dy/d*speed*dt;
    // Soft separation keeps crowds readable without quadratic pair scans.
    if(!e.boss&&this.spatial){const key=(Math.floor(e.x/96)+40)*100+Math.floor(e.y/96)+40;const near=this.spatial.get(key)||[];for(let i=0;i<Math.min(near.length,10);i++){const other=near[i];if(other===e||other.dead)continue;const ox=e.x-other.x,oy=e.y-other.y,dd=Math.hypot(ox,oy),rr=(e.r+other.r)*.76;if(dd>0&&dd<rr){e.x+=ox/dd*(rr-dd)*dt*3;e.y+=oy/dd*(rr-dd)*dt*3;}}}
    e.x=clamp(e.x,-WORLD+e.r,WORLD-e.r);e.y=clamp(e.y,-WORLD+e.r,WORLD-e.r);
    if(Math.hypot(e.x-p.x,e.y-p.y)<e.r+11){this.hitPlayer(e.damage);if(!e.boss){const n=norm(e.x-p.x,e.y-p.y);e.x+=n.x*24;e.y+=n.y*24;}}
    if(d>1600&&!e.boss&&e.type!=='elite'){const a=this.random()*TAU;e.x=clamp(p.x+Math.cos(a)*1000,-WORLD+40,WORLD-40);e.y=clamp(p.y+Math.sin(a)*1000,-WORLD+40,WORLD-40);e.warmup=.7;}
  }
  shootEnemy(e,angle,speed,count=1,spread=0){if(this.hostile.length>350)return;for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;this.hostile.push({x:e.x+Math.cos(a)*(e.r+5),y:e.y+Math.sin(a)*(e.r+5),px:e.x,py:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:e.boss?5:4,life:7,damage:e.damage*.7,color:e.type==='spitter'?'#c3b3ef':'#ff967d'});}}
  segmentHit(b,e,r){const dx=b.x-b.px,dy=b.y-b.py;const len=dx*dx+dy*dy;const t=len?clamp(((e.x-b.px)*dx+(e.y-b.py)*dy)/len,0,1):0;return (b.px+t*dx-e.x)**2+(b.py+t*dy-e.y)**2<r*r;}
  updateBullet(b,dt){
    if(b.life<=0)return;b.life-=dt;b.px=b.x;b.py=b.y;
    if(b.type==='rocket'){let target=this.enemies.find(e=>e.id===b.targetId&&!e.dead);if(!target){target=this.rocketTarget?this.rocketTarget(b):this.nearest(b,750);b.targetId=target?.id;}if(target){const n=norm(target.x-b.x,target.y-b.y);b.vx+=(n.x*430-b.vx)*Math.min(1,dt*5);b.vy+=(n.y*430-b.vy)*Math.min(1,dt*5);}if(this.settings.particles&&this.random()<.32)this.fx.push({x:b.x,y:b.y,vx:0,vy:0,life:.3,max:.3,size:4,color:'#cb8a5b',kind:'particle'});}
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    for(const e of this.nearEnemies(b.x,b.y,50)){if(e.dead||e.warmup>0||b.hit.includes(e.id))continue;if(this.segmentHit(b,e,e.r+b.r)){b.hit.push(e.id);if(b.type==='rocket'){this.explode(b);break;}this.damage(e,b.damage,'bullet');const n=norm(b.vx,b.vy);if(!e.boss){e.x+=n.x*5;e.y+=n.y*5;}if(b.pierce<=0){b.life=0;break;}b.pierce--;}}
    if(b.type==='rocket'&&b.life<=0&&!b.exploded)this.explode(b);
  }
  explode(b){if(b.exploded)return;b.exploded=true;b.life=0;this.ring(b.x,b.y,b.blast,'#ebb991',.45);this.particles(b.x,b.y,11,'#ffaf76',130);for(const e of this.nearEnemies(b.x,b.y,b.blast))if(!e.dead&&e.warmup<=0&&Math.hypot(e.x-b.x,e.y-b.y)<b.blast+e.r)this.damage(e,b.damage,'rocket');this.sound.play('explode');}
  damage(e,amount,source){if(e.dead)return;const crit=(source==='bullet'||source==='arc')&&this.random()<this.stats.crit;amount*=crit?this.stats.critDamage:1;e.hp-=amount;e.flash=.09;if(crit||source==='rocket'||e.boss&&this.random()<.16)this.float(e.x,e.y-e.r,String(Math.round(amount)),crit?'#ffe4a4':'#c1dbce',crit?16:12);if(e.hp<=0)this.kill(e);}
  kill(e){
    if(e.dead)return;e.dead=true;this.kills++;this.particles(e.x,e.y,e.boss?38:e.type==='elite'?20:6,e.color,e.boss?230:95);this.spawnLoot('xp',e.x,e.y,e.xp);
    if(e.boss){this.bossKills++;this.spawnLoot('chest',e.x,e.y,1);this.spawnLoot('med',e.x+42,e.y,1);this.collected+=40;this.shake=10;this.sound.play('relay');this.ring(e.x,e.y,250,COLORS.mint,1.2);this.player.hp=Math.min(this.player.maxHp,this.player.hp+25);if(e.type==='final'){this.finalDead=true;this.toast('대왕 청소기 격파. 15:00에 중앙 퇴근 지점이 열립니다.',false,7);}else this.toast('청소로봇 격파 · 생명력 +25 · 간식 봉지 투하',false,5);}
    else if(e.type==='elite'){this.eliteKills++;this.collected+=15;this.spawnLoot('chest',e.x,e.y,1);this.spawnLoot('med',e.x+35,e.y,1);this.toast('대형 장난감 제거 · 간식 봉지를 회수하세요.',false,4);}
    else{const r=this.random();if(r<.018)this.spawnLoot('med',e.x,e.y,1);else if(r<.05)this.spawnLoot('credit',e.x,e.y,1);else if(r<.053&&this.t>70)this.spawnLoot('magnet',e.x,e.y,1);}
    if(e.type==='splitter'){for(let i=0;i<3;i++){const a=i*TAU/3;const child=this.spawnEnemy('skitter',e.x+Math.cos(a)*24,e.y+Math.sin(a)*24);if(child){child.xp=1;child.warmup=.65;}}}
  }
  hitPlayer(amount){const p=this.player;if(p.invuln>0||this.state!=='playing')return;const damage=Math.max(2,amount-this.stats.armor);p.hp-=damage;this.damageTaken+=damage;p.invuln=.72;this.flash=.25;this.shake=8;this.float(p.x,p.y-30,'−'+Math.ceil(damage),'#ff927f',16);this.sound.play('hit');if(p.hp<=0){p.hp=0;this.finish(false);}}
  spawnLoot(type,x,y,value){
    if(type==='xp'&&this.loot.length>380){let best=null,d=Infinity;for(const l of this.loot)if(l.type==='xp'){const dd=(l.x-x)**2+(l.y-y)**2;if(dd<d){d=dd;best=l;}}if(best){best.value+=value;return;}}
    this.loot.push({type,x,y,value,age:0,magnet:false});
  }
  updateLoot(dt){const p=this.player;let xpGain=0;for(const l of this.loot){l.age+=dt;const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy);if(d<this.stats.pickup||(l.type==='chest'&&d<65))l.magnet=true;if(l.magnet){const speed=clamp(350+l.age*25,350,950);const amount=Math.min(d,speed*dt);if(d){l.x+=dx/d*amount;l.y+=dy/d*amount;}}
      if(d<20){l.dead=true;if(l.type==='xp'){xpGain+=l.value;}
        else if(l.type==='med'){p.hp=Math.min(p.maxHp,p.hp+24);this.float(p.x,p.y-25,'+24 HP',COLORS.mint,13);this.sound.play('pickup');}
        else if(l.type==='credit'){this.collected+=1;}
        else if(l.type==='magnet'){for(const gem of this.loot)if(gem.type==='xp'||gem.type==='credit')gem.magnet=true;this.toast('자기장 활성화 · 모든 간식 조각 수집',false,3);}
        else if(l.type==='chest'){this.pendingLevels++;this.collected+=12;p.hp=Math.min(p.maxHp,p.hp+15);this.toast('간식 회수 · 무료 강화 선택 · 생명력 +15',false,3);}}
    }this.loot=this.loot.filter(l=>!l.dead);if(xpGain>0){this.addXp(xpGain*this.stats.xpBonus);if(this.pickupSound<=0){this.sound.play('pickup');this.pickupSound=.16;}}
  }
  addXp(amount){this.xp+=amount;while(this.xp>=xpRequired(this.level)){this.xp-=xpRequired(this.level);this.level++;this.pendingLevels++;}}
  updateRelays(dt){const p=this.player;let charging=null;for(const r of this.relays){if(r.active||this.t<r.unlock)continue;const d=Math.hypot(p.x-r.x,p.y-r.y);if(d<107){r.charge=Math.min(10,r.charge+dt);charging=r;if(r.charge>=10){r.active=true;this.collected+=35;p.hp=Math.min(p.maxHp,p.hp+35+(this.base.recovery||0)*6);this.pendingLevels++;this.ring(r.x,r.y,400,COLORS.mint,1.2);this.sound.play('relay');this.toast('간식 창고 0'+(r.id+1)+' 열기 · 무료 강화 · 생명력 회복',false,5);for(const e of this.enemies)if(!e.boss&&Math.hypot(e.x-r.x,e.y-r.y)<400)this.damage(e,350*this.stats.power,'relay');}}}this.charging=charging&&!charging.active?charging:null;}
  getChoices(exclude=[]){
    const pool=UPGRADES.filter(u=>(this.u[u.id]||0)<u.max).map(u=>({...u,level:this.u[u.id]||0}));const evos=EVOLUTIONS.filter(e=>!this.evolved[e.id]&&(this.u[e.weapon]||0)>=5&&(this.u[e.support]||0)>=2).map(e=>({...e,evolution:true,type:'무기 진화',level:0}));
    const selected=[];if(evos.length)selected.push(evos[Math.floor(this.random()*evos.length)]);
    else if(this.level<=4){const weapons=pool.filter(u=>['orbit','arc','rocket','field'].includes(u.id)&&!exclude.includes(u.id)&&!this.u[u.id]);if(weapons.length)selected.push(weapons[Math.floor(this.random()*weapons.length)]);}
    let candidates=pool.filter(u=>!exclude.includes(u.id)&&!selected.some(s=>s.id===u.id));if(candidates.length<3-selected.length)candidates=pool.filter(u=>!selected.some(s=>s.id===u.id));
    while(selected.length<3&&candidates.length){const index=Math.floor(this.random()*candidates.length);selected.push(candidates.splice(index,1)[0]);}
    const fallback=[{id:'heal',name:'우유 한 모금',icon:'✚',desc:'생명력을 50% 회복합니다.',type:'간식',level:0},{id:'cache',name:'간식 코인 주머니',icon:'◇',desc:'우리 아지트용 간식 코인 35개를 확보합니다.',type:'간식',level:0},{id:'overload',name:'와구와구',icon:'↗',desc:'모든 피해량이 추가로 5% 증가합니다.',type:'간식',level:0}];for(const u of fallback)if(selected.length<3)selected.push(u);
    return selected;
  }
  levelUp(){this.state='upgrade';this.keys.clear();this.touch={x:0,y:0};this.choiceSet=this.getChoices();this.sound.play('level');this.callbacks.upgrade?.(this.choiceSet);}
  reroll(){if(this.state!=='upgrade'||this.rerolls<=0)return false;this.rerolls--;this.choiceSet=this.getChoices(this.choiceSet.map(c=>c.id));this.callbacks.upgrade?.(this.choiceSet);return true;}
  choose(id){if(this.state!=='upgrade'||!this.choiceSet.some(c=>c.id===id))return false;this.applyUpgrade(id);this.pendingLevels=Math.max(0,this.pendingLevels-1);this.sound.play('click');if(this.pendingLevels>0)this.levelUp();else{this.state='playing';this.callbacks.resume?.();this.callbacks.save?.();}return true;}
  applyUpgrade(id){const evo=EVOLUTIONS.find(e=>e.id===id);if(evo){this.evolved[id]=true;this.toast(evo.name+' 진화 완료',false,5);}else if(id==='heal'){this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.5);}else if(id==='cache')this.collected+=35;else if(id==='overload')this.base.output=(this.base.output||0)+1.25;else{this.u[id]=(this.u[id]||0)+1;this.recalculate();if(id==='vitality')this.player.hp=Math.min(this.player.maxHp,this.player.hp+25);if(id==='armor')this.player.hp=Math.min(this.player.maxHp,this.player.hp+10);}this.recalculate();}
  finish(won){if(this.state==='ended')return;this.state='ended';this.keys.clear();this.touch={x:0,y:0};const credits=Math.floor(this.t/10)+Math.floor(this.kills/15)+this.collected+(won?150:0);this.sound.play(won?'win':'death');this.callbacks.finish?.({won,credits,time:this.t,kills:this.kills,level:this.level,classId:this.classId,relays:this.relays.filter(r=>r.active).length,bossKills:this.bossKills,runId:this.runId,difficulty:this.difficulty});}
  serialize(){if(!['playing','paused','upgrade'].includes(this.state))return null;const keys=['runId','classId','base','difficulty','seed','rng','uid','t','kills','level','xp','pendingLevels','u','evolved','collected','bossKills','eliteKills','finalDead','evacuating','eventIndex','spawnTimer','fieldTimer','damageTaken','rerolls','player','enemies','bullets','hostile','loot','hazards','relays','events'];const data={version:VERSION};for(const key of keys)data[key]=this[key];return data;}
  restore(data){
    if(!data||data.version!==VERSION||!CLASSES.some(c=>c.id===data.classId)||!Number.isFinite(data.t)||data.t<0||!data.player||!Number.isFinite(data.player.hp)||data.player.hp<=0||!Number.isFinite(data.player.x)||!Number.isFinite(data.player.y))return false;
    for(const k of ['enemies','bullets','hostile','loot','hazards','events','relays'])if(!Array.isArray(data[k])||data[k].length>2000)return false;
    if(data.relays.length!==3||!data.u||!data.evolved||!data.base||!Number.isFinite(data.level)||data.level<1||!Number.isFinite(data.eventIndex))return false;
    for(const list of ['enemies','bullets','hostile','loot','hazards','relays'])if(data[list].some(e=>!e||!Number.isFinite(e.x)||!Number.isFinite(e.y)))return false;
    const keys=['runId','classId','base','difficulty','seed','rng','uid','t','kills','level','xp','pendingLevels','u','evolved','collected','bossKills','eliteKills','finalDead','evacuating','eventIndex','spawnTimer','fieldTimer','damageTaken','rerolls','player','enemies','bullets','hostile','loot','hazards','relays','events'];for(const key of keys)this[key]=data[key];this.classData=CLASSES.find(c=>c.id===this.classId);this.recalculate();this.camera={x:this.player.x,y:this.player.y};this.fx=[];this.texts=[];this.beams=[];this.pickupSound=0;this.saveTimer=20;this.state='playing';this.keys.clear();this.touch={x:0,y:0};this.callbacks.start?.();if(this.pendingLevels>0)this.levelUp();else this.toast('다시 출근 완료 · 근무을 이어갑니다.',false,4);return true;
  }
  particles(x,y,n,color,speed=100){if(!this.settings.particles)return;for(let i=0;i<n&&this.fx.length<480;i++){const a=this.random()*TAU,v=(.2+this.random()*.8)*speed,l=.25+this.random()*.45;this.fx.push({kind:'particle',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:l,max:l,size:1.5+this.random()*3,color});}}
  ring(x,y,r,color,life){this.fx.push({kind:'ring',x,y,r,color,life,max:life});}
  float(x,y,text,color,size){if(this.texts.length<55)this.texts.push({x,y,text,color,size,life:.65,max:.65});}
  render(delta){
    const dt=Math.min(delta,.05);this.visualTime+=dt;this.frameCount++;const c=this.ctx;if(!c)return;
    const live=this.state==='playing';if(live){for(const f of this.fx){f.life-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.94;f.vy*=.94;}}this.fx=this.fx.filter(f=>f.life>0);for(const f of this.texts){f.life-=dt;f.y-=dt*24;}this.texts=this.texts.filter(f=>f.life>0);for(const b of this.beams)b.life-=dt;this.beams=this.beams.filter(b=>b.life>0);}
    this.shake=Math.max(0,this.shake-dt*40);this.flash=Math.max(0,this.flash-dt);
    if(this.state==='menu'){this.camera.x=-260+Math.sin(this.visualTime*.05)*75;this.camera.y=-150+Math.cos(this.visualTime*.07)*65;}else{const f=1-Math.exp(-dt*14);this.camera.x+=(this.player.x-this.camera.x)*f;this.camera.y+=(this.player.y-this.camera.y)*f;}
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle=COLORS.floor;c.fillRect(0,0,this.w,this.h);c.save();const shak=this.settings.shake?this.shake:0;c.translate(this.w/2+(Math.sin(this.visualTime*173)*shak),this.h/2+(Math.cos(this.visualTime*151)*shak));c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
    this.drawFloor(c);this.drawRelays(c);if(this.state==='menu')this.drawDemo(c);else{
      this.drawHazards(c);this.drawLoot(c);this.drawFields(c);for(const e of this.enemies)if(this.visible(e.x,e.y,110))this.drawEnemy(c,e);this.drawBullets(c);this.drawPlayer(c,this.player.x,this.player.y,this.player.angle);this.drawOrbits(c);
      for(const b of this.beams){c.globalAlpha=Math.max(0,b.life/b.max);c.strokeStyle=b.color;c.lineWidth=2.3;c.beginPath();c.moveTo(b.x,b.y);const dx=b.tx-b.x,dy=b.ty-b.y,len=Math.hypot(dx,dy)||1;for(let i=1;i<5;i++){const zig=(i%2?1:-1)*9;c.lineTo(b.x+dx*i/5-dy/len*zig,b.y+dy*i/5+dx/len*zig);}c.lineTo(b.tx,b.ty);c.stroke();}c.globalAlpha=1;
      this.drawEffects(c);this.drawEvac(c);
    }c.restore();if(this.state!=='menu')this.drawDirections(c);
    if(this.flash>0){c.fillStyle='#ef5743';c.globalAlpha=this.flash*.34;c.fillRect(0,0,this.w,this.h);c.globalAlpha=1;}
    if(this.player.hp/this.player.maxHp<.28&&this.state==='playing'){c.strokeStyle='#e5684c';c.globalAlpha=.3+Math.sin(this.visualTime*4)*.12;c.lineWidth=5;c.strokeRect(2,2,this.w-4,this.h-4);c.globalAlpha=1;}
  }
  visible(x,y,margin=80){return Math.abs(x-this.camera.x)<this.w/(2*this.zoom)+margin&&Math.abs(y-this.camera.y)<this.h/(2*this.zoom)+margin;}
  drawFloor(c){
    const vx=this.w/(2*this.zoom),vy=this.h/(2*this.zoom),left=this.camera.x-vx,right=this.camera.x+vx,top=this.camera.y-vy,bottom=this.camera.y+vy;
    c.lineWidth=1/this.zoom;c.strokeStyle='#1e323780';c.beginPath();for(let x=Math.floor(left/80)*80;x<=right;x+=80){c.moveTo(x,top);c.lineTo(x,bottom);}for(let y=Math.floor(top/80)*80;y<=bottom;y+=80){c.moveTo(left,y);c.lineTo(right,y);}c.stroke();
    c.strokeStyle='#37534e6b';c.beginPath();for(let x=Math.floor(left/320)*320;x<=right;x+=320)for(let y=Math.floor(top/320)*320;y<=bottom;y+=320){c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);}c.stroke();
    for(const d of this.decor){if(!this.visible(d.x,d.y,100)||Math.hypot(d.x,d.y)<180)continue;c.save();c.translate(d.x,d.y);c.rotate(d.a);c.fillStyle=d.kind===0?'#12242a':'#132228';c.strokeStyle='#2e444766';c.lineWidth=1;c.fillRect(-d.w/2,-d.h/2,d.w,d.h);c.strokeRect(-d.w/2,-d.h/2,d.w,d.h);if(d.kind===1){c.strokeStyle='#3a4d4866';c.beginPath();c.moveTo(-d.w/2,-d.h/2);c.lineTo(d.w/2,d.h/2);c.stroke();}c.restore();}
    c.strokeStyle='#66827630';c.lineWidth=1;c.beginPath();c.arc(0,0,150,0,TAU);c.arc(0,0,161,0,TAU);c.stroke();c.setLineDash([3,13]);c.beginPath();c.arc(0,0,185,0,TAU);c.stroke();c.setLineDash([]);c.fillStyle='#75988866';c.font='11px monospace';c.textAlign='center';c.fillText('퇴근 출입구',0,212);c.strokeStyle='#71978888';c.lineWidth=2;c.beginPath();c.moveTo(-12,0);c.lineTo(12,0);c.moveTo(0,-12);c.lineTo(0,12);c.stroke();
    c.strokeStyle='#ae675b99';c.lineWidth=3;c.strokeRect(-WORLD,-WORLD,WORLD*2,WORLD*2);c.setLineDash([12,20]);c.strokeStyle='#8d655530';c.lineWidth=12;c.strokeRect(-WORLD-12,-WORLD-12,WORLD*2+24,WORLD*2+24);c.setLineDash([]);
    c.fillStyle='#050d13b5';if(left<-WORLD)c.fillRect(left,top,-WORLD-left,bottom-top);if(right>WORLD)c.fillRect(WORLD,top,right-WORLD,bottom-top);if(top<-WORLD)c.fillRect(left,top,right-left,-WORLD-top);if(bottom>WORLD)c.fillRect(left,WORLD,right-left,bottom-WORLD);
  }
  drawRelays(c){for(const r of this.relays){if(!this.visible(r.x,r.y,170))continue;const available=this.t>=r.unlock||this.state==='menu',color=r.active?COLORS.mint:available?COLORS.orange:'#557879';c.save();c.translate(r.x,r.y);c.strokeStyle=color;c.fillStyle=color;c.globalAlpha=.09;c.beginPath();c.arc(0,0,107,0,TAU);c.fill();c.globalAlpha=available?.6:.22;c.lineWidth=1.5;c.setLineDash([10,9]);c.beginPath();c.arc(0,0,107,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=1;c.lineWidth=2;if(r.charge>0){c.beginPath();c.arc(0,0,108,-Math.PI/2,-Math.PI/2+TAU*r.charge/12);c.stroke();}c.fillStyle='#0c191e';c.fillRect(-22,-22,44,44);c.strokeRect(-22,-22,44,44);c.rotate(Math.PI/4);c.strokeRect(-12,-12,24,24);c.rotate(-Math.PI/4);c.fillStyle=color;c.beginPath();c.arc(0,0,5,0,TAU);c.fill();if(available){c.globalAlpha=.35;c.beginPath();c.arc(0,0,35+(this.visualTime*15)%55,0,TAU);c.stroke();}c.globalAlpha=.8;c.fillStyle=color;c.textAlign='center';c.font='12px monospace';c.fillText('창고 0'+(r.id+1),0,-127);c.font='11px sans-serif';c.fillText(r.active?'간식 회수 완료':available?'12초간 머물러 열기':'간식 탐색 중',0,138);c.restore();}}
  drawDemo(c){
    const t=this.visualTime;const cx=230,cy=-15;c.save();c.translate(cx,cy);const g=c.createRadialGradient(0,0,20,0,0,370);g.addColorStop(0,'#69998a18');g.addColorStop(1,'#69998a00');c.fillStyle=g;c.fillRect(-380,-380,760,760);
    c.strokeStyle='#6fa18f33';c.lineWidth=1;for(const r of [90,180,280]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}c.save();c.rotate(t*.15);c.strokeStyle='#91c9ad66';c.beginPath();c.moveTo(0,0);c.lineTo(279,0);c.stroke();c.restore();c.restore();
    this.drawPlayer(c,cx,cy,-.75+Math.sin(t*.4)*.2);
    for(let i=0;i<3;i++){const a=t*.6+i*TAU/3;this.drawDrone(c,cx+Math.cos(a)*82,cy+Math.sin(a)*82,a);}
    for(let i=0;i<11;i++){const a=i*2.39,r=280+(i%3)*95;const e={...ENEMY_TYPES[i%4===0?'brute':'stalker'],type:i%4===0?'brute':'stalker',x:cx+Math.cos(a+t*.02)*r,y:cy+Math.sin(a+t*.02)*r,angle:a+Math.PI,warmup:0,flash:0,hp:30,maxHp:30};this.drawEnemy(c,e);}
    for(let i=0;i<32;i++){const a=i*2.39,r=140+(i%7)*22;c.fillStyle=i%4===0?'#bead79':'#719f8c';c.globalAlpha=.45+Math.sin(t+i)*.2;c.fillRect(cx+Math.cos(a)*r,cy+Math.sin(a)*r,3,3);}c.globalAlpha=1;
  }
  drawPlayer(c,x,y,a){const p=this.player;if(p.invuln>0&&Math.floor(this.visualTime*16)%2===0&&this.state!=='menu')c.globalAlpha=.5;c.save();c.translate(x,y);c.fillStyle='#020a10aa';c.beginPath();c.ellipse(0,10,18,9,0,0,TAU);c.fill();c.strokeStyle='#bbebd266';c.lineWidth=1;c.beginPath();c.arc(0,0,25,0,TAU);c.stroke();c.rotate(a);c.fillStyle='#d3e0cc';c.strokeStyle='#ecf4d9';c.lineWidth=1.5;c.beginPath();c.moveTo(15,0);c.lineTo(5,-10);c.lineTo(-9,-10);c.lineTo(-14,-5);c.lineTo(-14,5);c.lineTo(-9,10);c.lineTo(5,10);c.closePath();c.fill();c.stroke();c.fillStyle='#3e5957';c.fillRect(-10,-7,9,14);c.fillStyle=COLORS.orange;c.fillRect(-9,-4,4,8);c.fillStyle='#f1f4d8';c.fillRect(5,-4,18,8);c.fillStyle='#314542';c.fillRect(19,-3,5,6);c.restore();c.globalAlpha=1;}
  drawDrone(c,x,y,a){c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#548caf';c.fillRect(-8,-5,16,10);c.fillStyle='#264947';c.fillRect(-4,-3,8,6);c.fillStyle='#d4f4d8';c.fillRect(-3,-2,6,4);c.strokeStyle='#93b8a466';c.lineWidth=1;c.strokeRect(-11,-8,22,16);c.restore();}
  drawOrbits(c){if(!this.u.orbit)return;const n=this.u.orbit+(this.evolved.nova?4:0),radius=this.evolved.nova?120:83;c.strokeStyle='#a1d6ca22';c.lineWidth=1;c.beginPath();c.arc(this.player.x,this.player.y,radius,0,TAU);c.stroke();for(let i=0;i<n;i++){const a=this.t*(this.evolved.nova?2.8:2.2)*this.stats.haste+i*TAU/n,r=this.evolved.nova&&i%2?165:radius;this.drawDrone(c,this.player.x+Math.cos(a)*r,this.player.y+Math.sin(a)*r,a);}}
  drawFields(c){if(!this.u.field)return;const r=104+this.u.field*15+(this.evolved.absolute?90:0);c.save();c.translate(this.player.x,this.player.y);c.fillStyle=this.evolved.absolute?'#a2dfef16':'#a2dfef0b';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='#91cdd244';c.lineWidth=1.2;c.setLineDash([5,10]);c.rotate(-this.t*.25);c.stroke();c.setLineDash([]);c.restore();}
  drawEnemy(c,e){
    c.save();c.translate(e.x,e.y);if(e.warmup>0){c.strokeStyle=e.color;c.globalAlpha=.45;c.lineWidth=1.5;c.setLineDash([5,5]);c.beginPath();c.arc(0,0,e.r+16+Math.sin(this.visualTime*5)*4,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=.3;}
    c.fillStyle='#03090d80';c.beginPath();c.ellipse(0,e.r*.65,e.r*1.15,e.r*.55,0,0,TAU);c.fill();c.rotate(e.angle);c.strokeStyle=e.flash>0?'#fff8db':e.color;c.fillStyle=e.flash>0?'#efe7d2':e.color+'2b';c.lineWidth=e.boss?3:1.7;const r=e.r;
    if(e.type==='skitter'){c.beginPath();c.moveTo(r+3,0);c.lineTo(-r,-r*.8);c.lineTo(-r*.55,0);c.lineTo(-r,r*.8);c.closePath();}
    else if(e.type==='charger'){c.beginPath();c.moveTo(r+4,0);c.lineTo(-r*.25,-r);c.lineTo(-r,-r*.8);c.lineTo(-r*.55,0);c.lineTo(-r,r*.8);c.lineTo(-r*.25,r);c.closePath();}
    else if(e.type==='spitter'){c.beginPath();c.moveTo(r,0);c.lineTo(0,-r);c.lineTo(-r,0);c.lineTo(0,r);c.closePath();}
    else{c.beginPath();const n=e.boss?8:e.type==='brute'?6:e.type==='splitter'?7:5;for(let i=0;i<n;i++){const a=i*TAU/n,rr=i%2&&e.boss?r*.83:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();}c.fill();c.stroke();
    c.fillStyle=e.flash>0?'#ffffff':e.color;c.fillRect(e.boss?-9:0,e.boss?-9:-3,e.boss?18:6,e.boss?18:6);
    if(e.boss||e.type==='elite'){c.rotate(-e.angle+this.visualTime*.35);c.strokeStyle=e.color+'88';c.lineWidth=1;c.setLineDash([12,8]);c.beginPath();c.arc(0,0,r+9,0,TAU);c.stroke();c.setLineDash([]);c.rotate(e.angle-this.visualTime*.35);}
    if(e.type==='charger'&&e.chargeTimer>.38){c.rotate(-e.angle+Math.atan2(e.chargeY,e.chargeX));c.strokeStyle='#f0a18b88';c.lineWidth=2;c.setLineDash([8,9]);c.beginPath();c.moveTo(22,0);c.lineTo(225,0);c.stroke();c.setLineDash([]);}
    c.restore();if(!e.boss&&e.hp<e.maxHp&&e.maxHp>100){c.fillStyle='#3f262b';c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2,3);c.fillStyle=e.color;c.fillRect(e.x-e.r,e.y-e.r-10,e.r*2*Math.max(0,e.hp/e.maxHp),3);}
  }
  drawBullets(c){c.lineCap='round';for(const b of this.bullets){if(!this.visible(b.x,b.y,10))continue;c.strokeStyle=b.color;c.lineWidth=b.type==='rocket'?4:2.5;c.beginPath();const n=norm(b.vx,b.vy);c.moveTo(b.x-n.x*(b.type==='rocket'?17:13),b.y-n.y*(b.type==='rocket'?17:13));c.lineTo(b.x,b.y);c.stroke();c.fillStyle='#f8f5d7';c.beginPath();c.arc(b.x,b.y,b.type==='rocket'?3:2,0,TAU);c.fill();}c.lineCap='butt';for(const b of this.hostile){if(!this.visible(b.x,b.y,10))continue;c.fillStyle=b.color+'25';c.beginPath();c.arc(b.x,b.y,b.r+5,0,TAU);c.fill();c.fillStyle=b.color;c.beginPath();c.arc(b.x,b.y,b.r,0,TAU);c.fill();c.fillStyle='#f7e4c7';c.beginPath();c.arc(b.x,b.y,1.5,0,TAU);c.fill();}}
  drawHazards(c){for(const h of this.hazards){if(!this.visible(h.x,h.y,h.r))continue;const q=1-h.life/h.max;c.fillStyle='#d56e491c';c.beginPath();c.arc(h.x,h.y,h.r,0,TAU);c.fill();c.strokeStyle='#f9926988';c.lineWidth=1.8;c.stroke();c.fillStyle='#f2815b'+Math.round(20+q*50).toString(16).padStart(2,'0');c.beginPath();c.arc(h.x,h.y,h.r*q,0,TAU);c.fill();c.strokeStyle='#ffd3ad';c.beginPath();c.moveTo(h.x-6,h.y-6);c.lineTo(h.x+6,h.y+6);c.moveTo(h.x+6,h.y-6);c.lineTo(h.x-6,h.y+6);c.stroke();}}
  drawLoot(c){for(const l of this.loot){if(!this.visible(l.x,l.y,20))continue;const y=l.y+(l.type==='xp'?0:Math.sin(this.visualTime*3+l.x)*3);if(l.type==='xp'){const size=l.value>20?6:l.value>7?4.5:3.2;c.fillStyle=l.value>20?'#d5eab0':'#8dbba6';c.beginPath();c.moveTo(l.x,y-size);c.lineTo(l.x+size,y);c.lineTo(l.x,y+size);c.lineTo(l.x-size,y);c.fill();}
      else if(l.type==='med'){c.fillStyle='#1a3b34';c.fillRect(l.x-9,y-9,18,18);c.strokeStyle='#9bc8a2';c.strokeRect(l.x-9,y-9,18,18);c.fillStyle='#c4edb5';c.fillRect(l.x-5,y-1.5,10,3);c.fillRect(l.x-1.5,y-5,3,10);}
      else if(l.type==='credit'){c.fillStyle='#cfb786';c.fillRect(l.x-3,y-3,6,6);}
      else if(l.type==='chest'){c.fillStyle='#d8944822';c.beginPath();c.arc(l.x,y,30,0,TAU);c.fill();c.fillStyle='#59412b';c.strokeStyle='#facd8b';c.lineWidth=1.5;c.fillRect(l.x-13,y-10,26,20);c.strokeRect(l.x-13,y-10,26,20);c.fillStyle='#f8ce8a';c.fillRect(l.x-2,y-11,4,22);c.font='11px sans-serif';c.textAlign='center';c.fillText('간식',l.x,y-22);}
      else if(l.type==='magnet'){c.strokeStyle=COLORS.mint;c.lineWidth=2;c.beginPath();c.arc(l.x,y,9,0,TAU);c.stroke();c.font='12px monospace';c.textAlign='center';c.fillStyle=COLORS.mint;c.fillText('M',l.x,y+4);}}
  }
  drawEffects(c){for(const f of this.fx){c.globalAlpha=Math.max(0,f.life/f.max);if(f.kind==='ring'){c.strokeStyle=f.color;c.lineWidth=2;c.beginPath();c.arc(f.x,f.y,f.r*(1-f.life/f.max*.8),0,TAU);c.stroke();}else if(f.kind==='ghost'){c.save();c.translate(f.x,f.y);c.rotate(f.angle);c.fillStyle=f.color;c.fillRect(-12,-9,23,18);c.restore();}else{c.fillStyle=f.color;c.fillRect(f.x-f.size/2,f.y-f.size/2,f.size,f.size);}}for(const f of this.texts){c.globalAlpha=Math.max(0,f.life/f.max);c.fillStyle=f.color;c.font='600 '+f.size+'px monospace';c.textAlign='center';c.fillText(f.text,f.x,f.y);}c.globalAlpha=1;}
  drawEvac(c){if(this.t<DURATION)return;const ready=this.finalDead&&this.relays.every(r=>r.active);c.strokeStyle=ready?COLORS.mint:'#ba9470';c.lineWidth=3;c.setLineDash([15,7]);c.beginPath();c.arc(0,0,125,0,TAU);c.stroke();c.setLineDash([]);if(ready){c.fillStyle='#4b7bbf12';c.fill();c.beginPath();c.arc(0,0,135,-Math.PI/2,-Math.PI/2+TAU*this.evacuating/5);c.stroke();}c.fillStyle=ready?COLORS.mint:'#ba9470';c.font='14px sans-serif';c.textAlign='center';c.fillText(ready?'퇴근 안내 · 5초간 머무르세요':'간식 창고와 대왕 청소기 확인',0,-151);}
  drawDirections(c){
    const targets=this.relays.filter(r=>!r.active&&this.t>=r.unlock).map(r=>({...r,label:'0'+(r.id+1),color:COLORS.orange}));if(this.t>=DURATION)targets.push({x:0,y:0,label:'퇴근',color:COLORS.mint});
    const boss=this.enemies.find(e=>e.boss&&!e.dead);if(boss)targets.push({...boss,label:'BOSS',color:'#e89b94'});
    for(const t of targets){const sx=(t.x-this.camera.x)*this.zoom+this.w/2,sy=(t.y-this.camera.y)*this.zoom+this.h/2;const top=this.w<800?185:165,bottom=this.w<800?this.h-255:this.h-145;if(sx>55&&sx<this.w-55&&sy>top&&sy<bottom)continue;const dx=sx-this.w/2,dy=sy-this.h/2;const fac=Math.min((this.w/2-37)/(Math.abs(dx)||1),(Math.max(60,this.h/2-(this.w<800?155:145)))/(Math.abs(dy)||1));const x=clamp(this.w/2+dx*fac,37,this.w-37),y=clamp(this.h/2+dy*fac,150,this.h-145);c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));c.fillStyle=t.color;c.beginPath();c.moveTo(7,0);c.lineTo(-5,-5);c.lineTo(-5,5);c.closePath();c.fill();c.restore();c.textAlign='center';c.font='11px monospace';c.fillStyle=t.color;c.fillText(t.label,x,y+20);c.font='10px monospace';c.globalAlpha=.65;c.fillText(Math.round(Math.hypot(t.x-this.player.x,t.y-this.player.y)/10)+'m',x,y+34);c.globalAlpha=1;}
  }
  drawMinimap(canvas){const c=canvas.getContext('2d');if(!c)return;const size=canvas.width;c.clearRect(0,0,size,size);const scale=(size-16)/(WORLD*2);const sx=x=>size/2+x*scale;const sy=y=>size/2+y*scale;c.strokeStyle='#456b6466';c.lineWidth=1;c.strokeRect(8,8,size-16,size-16);c.setLineDash([2,7]);c.beginPath();c.moveTo(8,size/2);c.lineTo(size-8,size/2);c.moveTo(size/2,8);c.lineTo(size/2,size-8);c.stroke();c.setLineDash([]);for(const e of this.enemies){if(e.dead)continue;c.fillStyle=e.boss?'#ff9d86':'#af776a88';c.fillRect(sx(e.x)-(e.boss?3:1),sy(e.y)-(e.boss?3:1),e.boss?6:2,e.boss?6:2);}for(const r of this.relays){c.strokeStyle=r.active?COLORS.mint:this.t>=r.unlock?COLORS.orange:'#46615f';c.lineWidth=1.5;c.strokeRect(sx(r.x)-4,sy(r.y)-4,8,8);if(r.active){c.fillStyle=COLORS.mint;c.fillRect(sx(r.x)-2,sy(r.y)-2,4,4);}}c.strokeStyle=this.t>=DURATION?COLORS.mint:'#5c7970';c.beginPath();c.arc(size/2,size/2,5,0,TAU);c.stroke();const p=this.player;c.fillStyle='#f3f4d7';c.beginPath();c.arc(sx(p.x),sy(p.y),3,0,TAU);c.fill();c.strokeStyle='#d8efd67a';c.strokeRect(sx(p.x)-this.w/(2*this.zoom)*scale,sy(p.y)-this.h/(2*this.zoom)*scale,this.w/this.zoom*scale,this.h/this.zoom*scale);}
}
