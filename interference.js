import {aiming} from './aim.js?v=cat25';
import {Game} from './game.js?v=cat25';
import {WORLD,DURATION,EDITION,ENEMY_TYPES,UPGRADES,EVOLUTIONS,WEAPONS,PROTOCOLS} from './data.js?v=cat25';
import {signalVisuals} from './signal-visuals.js?v=cat25';

const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const lineDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;const t=d?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/d,0,1):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};

export class SignalGame extends Game {
  constructor(...args){super(...args);this.initSignal();}
  initSignal(){this.edition=EDITION;this.resonance=25;this.overdrive=0;this.overdriveCount=0;this.combo=0;this.comboTimer=0;this.bestCombo=0;this.perfectDodges=0;this.lastDamageAt=-99;this.nextInterference=48;this.interferenceIndex=0;this.interferenceUntil=0;this.interferenceName='평화로운 편의점';this.lines=[];this.waves=[];this.traps=[];this.wells=[];this.scars=[];this.protocol=null;this.weaponSlots=3;this.shieldTick=0;this.hitStop=0;this.glitch=0;this.railTimer=1.5;this.mineTimer=2;this.relayChallenge={};this.choiceIds=[];this.runDamage={};}
  resetDemo(){super.resetDemo();this.initSignal();this.resetAim();}
  start(...args){this.initSignal();super.start(...args);this.resetAim();this.toast('마우스 또는 오른쪽 스틱으로 조준 · 항상 자동 연사',false,6);}
  recalculate(){super.recalculate();const s=this.stats,p=this.protocol;
    s.regen=(this.u.regen||0)*.22;s.pulseCd=19*(1-(this.u.pulse||0)*.12);
    if(p==='glass'){s.maxHp=Math.round(s.maxHp*.8);s.power*=1.3;s.damage*=1.3;}
    if(p==='capacitor'){s.pulseCd*=.7;s.damage*=.85;}
    if(p==='bastion'){s.maxHp+=35;s.armor+=2;s.speed*=.88;}
    if(this.overdrive>0){s.haste*=1.35;s.power*=1.35;s.damage*=1.35;}
    if(this.player){this.player.maxHp=s.maxHp;this.player.hp=Math.min(this.player.hp,s.maxHp);}
  }
  activateOverdrive(){if(this.state!=='playing'||this.resonance<100||this.overdrive>0)return false;this.resonance=0;this.overdrive=7;this.overdriveCount++;this.recalculate();this.glitch=.7;this.shake=7;this.ring(this.player.x,this.player.y,300,'#e6952e',.7);this.sound.play('overdrive');this.toast('우다다 · 7초간 출력·연사 +35% / 받는 피해 +30%',true,4);return true;}
  dash(){const p=this.player;if(this.state!=='playing'||p.dashCd>0)return false;
    const danger=this.hostile.some(b=>distance(b,p)<65)||this.lines.some(l=>l.delay<.35&&lineDistance(p,l,l.end)<45)||this.waves.some(w=>Math.abs(distance(w,p)-w.r)<55&&w.delay<=0);
    const ok=super.dash();if(ok){this.fx.push({kind:'slash',x:p.x,y:p.y,a:Math.atan2(p.dashY,p.dashX),r:120,color:'#e99d42',life:.24,max:.24});if(danger){this.perfectDodges++;p.hp=Math.min(p.maxHp,p.hp+3);this.resonance=Math.min(100,this.resonance+18);p.dashCd*=.7;this.float(p.x,p.y-47,'사뿐! +3','#e6952e',16);this.sound.play('perfect');}if(this.classId==='runner'){this.traps.push({x:p.x,y:p.y,age:0,life:1.1,arm:.6,damage:45*this.stats.power,r:88,echo:true});}}return ok;
  }
  pulse(){const ok=super.pulse();if(!ok)return false;this.glitch=.22;const p=this.player;for(const e of this.enemies)if(!e.dead&&distance(p,e)<this.stats.pulseRange+e.r){e.exposed=3;this.fx.push({kind:'spark',x:e.x,y:e.y,r:30,life:.24,max:.24,color:'#dbff8e'});}this.resonance=Math.min(100,this.resonance+6);return true;}
  update(dt){if(this.state!=='playing')return;
    this.comboTimer=Math.max(0,this.comboTimer-dt);if(!this.comboTimer)this.combo=0;
    if(this.overdrive>0){this.overdrive=Math.max(0,this.overdrive-dt);if(!this.overdrive)this.recalculate();}
    // Recovery needs breathing room; repeated hits no longer heal away instantly.
    const regen=this.stats.regen;if(this.t-this.lastDamageAt<4)this.stats.regen=0;
    super.update(dt);this.stats.regen=regen;if(this.state==='ended')return;
    if(this.t>=this.nextInterference){this.triggerInterference();this.nextInterference=this.t+Math.max(38,64-this.t/40);}
    this.updatePatterns(dt);if(this.state==='ended')return;
    this.updateTraps(dt);this.shieldTick-=dt;
    if(this.shieldTick<=0){this.shieldTick=.35;const sources=this.enemies.filter(e=>e.type==='jammer'&&!e.dead&&e.warmup<=0);for(const e of this.enemies)e.shielded=e.type!=='jammer'&&sources.some(j=>distance(e,j)<180);}
    for(const scar of this.scars)scar.life-=dt;this.scars=this.scars.filter(s=>s.life>0).slice(-65);
  }
  triggerInterference(){
    const p=this.player,type=this.interferenceIndex++%3;this.interferenceUntil=this.t+9;this.sound.play('warning');this.glitch=.18;
    if(type===0){this.interferenceName='청소 레이저';this.toast('소동 / 청소 레이저 · 붉은 사격선에서 벗어나세요.',true,4);const a=this.random()*TAU,nx=Math.cos(a),ny=Math.sin(a),tx=-ny,ty=nx;for(let i=-1;i<=1;i++){const cx=p.x+tx*i*130,cy=p.y+ty*i*130;this.addLine(cx-nx*650,cy-ny*650,cx+nx*650,cy+ny*650,1.6+Math.abs(i)*.35,.36,16,25+this.t*.015);}}
    else if(type===1){this.interferenceName='장난감 행진';this.toast('소동 / 장난감 행진 · 측면의 장난감 로봇을 경계하세요.',true,4);for(let i=0;i<8+Math.floor(this.t/180);i++){const a=i*TAU/10+this.t;this.spawnEnemy('wraith',clamp(p.x+Math.cos(a)*580,-WORLD+40,WORLD-40),clamp(p.y+Math.sin(a)*580,-WORLD+40,WORLD-40));}if(this.t>160)this.spawnEnemy('sniper');}
    else{this.interferenceName='청소 물결';this.toast('소동 / 청소 물결 · 파동 틈으로 이동하거나 대시하세요.',true,5);this.addWave(p.x,p.y,430,this.random()*TAU,1.2);}
  }
  addLine(x,y,tx,ty,delay=1.35,active=.28,width=12,damage=30){if(this.lines.length>=18)return;this.lines.push({x,y,end:{x:tx,y:ty},delay,initialDelay:delay,active,maxActive:active,width,damage,fired:false});}
  addWave(x,y,r,gap,delay=1){if(this.waves.length>=4)return;this.waves.push({x,y,r,maxR:r,gap,gapWidth:1.15,delay,life:r/100,damage:28+this.t*.018});}
  updatePatterns(dt){
    for(const l of this.lines){l.delay-=dt;if(l.delay<=0){if(!l.fired){l.fired=true;this.sound.play('laser');}l.active-=dt;if(l.active>0&&lineDistance(this.player,l,l.end)<l.width/2+11)this.hitPlayer(l.damage);}}
    this.lines=this.lines.filter(l=>l.delay>0||l.active>0);
    for(const w of this.waves){w.delay-=dt;if(w.delay<=0){w.r=Math.max(0,w.r-dt*100);w.life-=dt;const d=distance(this.player,w),a=Math.atan2(this.player.y-w.y,this.player.x-w.x);if(Math.abs(d-w.r)<20&&Math.abs(angleDiff(a,w.gap))>w.gapWidth/2)this.hitPlayer(w.damage);}}
    this.waves=this.waves.filter(w=>w.life>0);
  }
  spawnEnemy(type,x,y,extra={}){if(this.enemies.length>=240&&!['final','sentinel'].includes(type))return null;const e=super.spawnEnemy(type,x,y,extra);if(!e)return e;
    const late=1+Math.pow(this.t/240,1.15)*.2;const hp=e.boss?1.45:late;e.hp*=hp;e.maxHp*=hp;e.damage*=1.14+this.t/4200;e.speed*=1.03;
    e.exposed=0;e.chill=0;e.burn=0;e.burnTick=.5;e.patternCd=4;e.burstCd=2.2;e.lockTimer=0;e.bossStage=0;return e;
  }
  spawnRandom(){const t=this.t,r=this.random();if(t>125&&r<.085)this.spawnEnemy('sniper');else if(t>240&&r<.145)this.spawnEnemy('jammer');else if(t>80&&r<.25)this.spawnEnemy('wraith');else super.spawnRandom();}
  runEvent(e){super.runEvent(e);if(e.type==='swarm'&&this.t>250)this.spawnEnemy('jammer');if(e.type==='boss')this.addWave(this.player.x,this.player.y,420,this.random()*TAU,2.8);if(e.type==='final'){for(let i=0;i<2;i++)this.spawnEnemy('jammer');}}
  updateEnemy(e,dt){if(e.dead)return;e.exposed=Math.max(0,(e.exposed||0)-dt);e.chill=Math.max(0,(e.chill||0)-dt);e.burn=Math.max(0,(e.burn||0)-dt);e.burnTick=(e.burnTick??.5)-dt;
    if(e.burn>0&&e.burnTick<=0){e.burnTick=.5;this.damage(e,7*this.stats.power,'burn');if(e.dead)return;}
    if(e.boss){e.attackCd=999;e.skillCd=999;e.phase=1;}
    if(e.type==='sniper'){e.warmup-=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);if(e.warmup>0)return;const p=this.player,d=distance(e,p)||1;const dx=(p.x-e.x)/d,dy=(p.y-e.y)/d;e.angle=Math.atan2(dy,dx);e.attackCd-=dt;const speed=(d<320?-e.speed:d>510?e.speed:0)*(e.slow>0?.5:1);e.x=clamp(e.x+dx*speed*dt,-WORLD+30,WORLD-30);e.y=clamp(e.y+dy*speed*dt,-WORLD+30,WORLD-30);if(e.attackCd<=0&&d<740){e.attackCd=3.9;const aim=Math.atan2(p.y-e.y+(p.moveY||0)*28,p.x-e.x+(p.moveX||0)*28);this.addLine(e.x,e.y,e.x+Math.cos(aim)*920,e.y+Math.sin(aim)*920,1.3,.22,10,e.damage);}if(d<e.r+11)this.hitPlayer(e.damage);return;}
    super.updateEnemy(e,dt);if(e.dead||e.warmup>0)return;
    const p=this.player,d=distance(e,p)||1;
    if(e.type==='wraith'&&d>80){const side=e.id%2?1:-1;e.x+=-(p.y-e.y)/d*side*65*dt;e.y+=(p.x-e.x)/d*side*65*dt;}
    if(e.type==='jammer'&&d<300){e.x-=(p.x-e.x)/d*e.speed*dt*1.3;e.y-=(p.y-e.y)/d*e.speed*dt*1.3;}
    if(e.boss){
      const stage=e.hp/e.maxHp<.33?2:e.hp/e.maxHp<.66?1:0;if(stage>e.bossStage){e.bossStage=stage;this.glitch=.35;this.shake=8;this.sound.play('boss');this.toast('청소로봇 / PHASE 0'+(stage+1)+' · 패턴 가속',true,4);}
      e.patternCd-=dt;e.burstCd-=dt;
      if(e.burstCd<=0){e.burstCd=(e.type==='final'?2.5:3.2)-stage*.35;const n=e.type==='final'?17:12,gap=Math.atan2(p.y-e.y,p.x-e.x)+Math.sin(this.t)*.55;for(let i=0;i<n;i++){const a=i*TAU/n+this.t*.16;if(Math.abs(angleDiff(a,gap))<.36)continue;this.shootEnemy(e,a,175+stage*28,1);}if(stage>0)this.shootEnemy(e,e.angle,245,3,.19);}
      if(e.patternCd<=0){e.patternCd=9-stage*1.2;e.exposed=4.5;const pattern=(Math.floor(this.t/9)+stage)%3;if(pattern===0){for(let i=-1;i<=1;i++){const a=e.angle+i*.36;this.addLine(e.x,e.y,e.x+Math.cos(a)*1100,e.y+Math.sin(a)*1100,1.5+Math.abs(i)*.18,.35,18,e.damage);}}
        else if(pattern===1)this.addWave(e.x,e.y,430,Math.atan2(p.y-e.y,p.x-e.x),1.4);
        else{for(let i=0;i<4+stage;i++){const a=i*TAU/(4+stage);this.hazards.push({x:p.x+Math.cos(a)*115,y:p.y+Math.sin(a)*115,r:68,life:1.5,max:1.5,damage:e.damage});}}this.float(e.x,e.y-e.r-32,'배터리 노출!','#885fa8',13);}
    }
  }
  orbitPoints(){const n=(this.u.orbit||0)+(this.evolved.nova?2:0);const points=[];for(let i=0;i<n;i++){const a=this.t*2.15*this.stats.haste+i*TAU/n,r=this.evolved.nova?(i%2?137:101):82;points.push({x:this.player.x+Math.cos(a)*r,y:this.player.y+Math.sin(a)*r,a});}return points;}
  updateWeapons(dt){
    const p=this.player,s=this.stats;
    for(const orb of this.orbitPoints())for(const e of this.nearEnemies(orb.x,orb.y,20))if(!e.dead&&e.warmup<=0&&e.orbitCd<=0&&distance(orb,e)<e.r+14){e.orbitCd=.34;this.damage(e,(15+(this.u.orbit||0)*6)*s.power*(this.evolved.nova?1.25:1),'orbit');}
    if(this.u.arc&&p.arcCd<=0){let target=this.aimTarget(470,1.1);if(target){p.arcCd=(2.7-this.u.arc*.16)/s.haste;const hit=new Set();let from=p;for(let i=0;i<2+this.u.arc+(this.evolved.storm?4:0)&&target;i++){hit.add(target.id);this.beams.push({x:from.x,y:from.y,tx:target.x,ty:target.y,life:.2,max:.2,color:'#3876bc',thread:true,evo:!!this.evolved.storm,final:!!this.evolved.tesla});this.damage(target,(24+this.u.arc*12)*s.power*(this.evolved.storm?1.35:1)*(this.protocol==='capacitor'?1.2:1),'arc');from=target;target=this.nearest(from,230,hit);}this.sound.play('arc');}}
    if(this.u.rocket&&p.rocketCd<=0){const target=this.aimTarget(700);{p.rocketCd=(3.4-this.u.rocket*.15)/s.haste;const count=this.evolved.barrage?3:1;for(let i=0;i<count;i++){const a=p.angle+(i-(count-1)/2)*.8;this.bullets.push({x:p.x,y:p.y,px:p.x,py:p.y,vx:Math.cos(a)*270,vy:Math.sin(a)*270,life:3.8,r:7,damage:(48+this.u.rocket*24)*s.power,pierce:0,hit:[],type:'rocket',targetId:target?.id,blast:75+this.u.rocket*7+(this.evolved.barrage?25:0),color:'#ffa36b'});}}}
    if(this.u.field&&this.fieldTimer<=0){this.fieldTimer=.55/s.haste;const r=100+this.u.field*13+(this.evolved.absolute?55:0);for(const e of this.nearEnemies(p.x,p.y,r))if(!e.dead&&e.warmup<=0&&distance(p,e)<r+e.r){e.slow=this.evolved.absolute?1:.65;e.chill=1.5;this.damage(e,(5+this.u.field*3)*s.power*(this.evolved.absolute?1.5:1),'field');}}
    this.railTimer-=dt;this.mineTimer-=dt;
    if(this.u.rail&&this.railTimer<=0){{this.railTimer=(3.7-this.u.rail*.22)/s.haste;const a=p.angle,count=this.evolved.prism?3:1;for(let i=0;i<count;i++){const angle=a+(i-(count-1)/2)*.19,end={x:p.x+Math.cos(angle)*680,y:p.y+Math.sin(angle)*680};let multiplier=1;for(const e of this.enemies.filter(e=>!e.dead&&e.warmup<=0&&lineDistance(e,p,end)<e.r+8).sort((a,b)=>distance(p,a)-distance(p,b))){this.damage(e,(75+this.u.rail*22)*s.power*multiplier,'rail');multiplier*=.88;}this.fx.push({kind:'rail',x:p.x,y:p.y,tx:end.x,ty:end.y,life:.3,max:.3,color:'#ab802e',evo:!!this.evolved.prism,final:!!this.evolved.crossbeam});}this.sound.play('rail');this.shake=Math.max(this.shake,2);}}
    if(this.u.mine&&this.mineTimer<=0){this.mineTimer=(4.5-this.u.mine*.25)/s.haste;if(this.traps.length<14)this.traps.push({x:p.x-p.moveX*35,y:p.y-p.moveY*35,age:0,life:11,arm:.7,r:87+this.u.mine*6,damage:(66+this.u.mine*25)*s.power});}
  }
  updateTraps(dt){for(const trap of this.traps){trap.age+=dt;trap.life-=dt;if(trap.age<trap.arm)continue;const target=this.enemies.find(e=>!e.dead&&e.warmup<=0&&distance(trap,e)<e.r+48);if(target||(trap.echo&&trap.age>.7)){trap.life=0;this.ring(trap.x,trap.y,trap.r,'#b998ff',.55);this.fx.push({kind:'collapse',x:trap.x,y:trap.y,r:trap.r,life:.45,max:.45,color:'#d7b7ff'});for(const e of this.enemies)if(!e.dead&&e.warmup<=0&&distance(trap,e)<trap.r+e.r){const d=distance(e,trap)||1;if(!trap.echo){const pull=Math.min(d*.45,e.boss?8:38);e.x+=(trap.x-e.x)/d*pull;e.y+=(trap.y-e.y)/d*pull;}this.damage(e,trap.damage,'mine');e.slow=1.4;}if(this.evolved.singularity&&!trap.echo)this.wells.push({x:trap.x,y:trap.y,r:155,life:2.8,tick:0});this.sound.play('mine');}}
    this.traps=this.traps.filter(t=>t.life>0);for(const w of this.wells){w.life-=dt;w.tick-=dt;for(const e of this.enemies){const d=distance(e,w);if(e.dead||e.warmup>0||d>w.r||d<2)continue;const pull=e.boss?28:105;e.x+=(w.x-e.x)/d*pull*dt;e.y+=(w.y-e.y)/d*pull*dt;if(w.tick<=0)this.damage(e,16*this.stats.power,'mine');}if(w.tick<=0)w.tick=.4;}this.wells=this.wells.filter(w=>w.life>0);}
  explode(b){if(b.exploded)return;super.explode(b);this.fx.push({kind:'burst',x:b.x,y:b.y,r:b.blast,life:.38,max:.38,color:'#ff9b66'});for(const e of this.enemies)if(!e.dead&&distance(e,b)<b.blast+e.r)e.burn=2.5;}
  fireMain(target){super.fireMain(target);this.fx.push({kind:'muzzle',x:this.player.x,y:this.player.y,a:this.player.angle,life:.07,max:.07,color:this.overdrive>0?'#d39036':'#42828b'});}
  damage(e,amount,source){if(e.dead)return;const initial=e.hp;const shatter=source==='arc'&&e.chill>0;if(e.shielded&&source!=='rail'&&source!=='pulse')amount*=.6;if(e.boss)amount*=e.exposed>0?1.25:.85;
    super.damage(e,amount,source);this.runDamage[source]=(this.runDamage[source]||0)+Math.max(0,Math.min(initial,initial-e.hp));
    if(source==='bullet'||source==='rail')this.fx.push({kind:'spark',x:e.x,y:e.y,r:source==='rail'?28:14,life:.12,max:.12,color:source==='rail'?'#f1ffac':'#d3f4d1'});
    if(shatter){e.chill=0;this.fx.push({kind:'shatter',x:e.x,y:e.y,r:76,life:.45,max:.45,color:'#96eeff'});for(const other of this.enemies)if(other!==e&&!other.dead&&distance(e,other)<76+other.r)this.damage(other,amount*.4,'shatter');this.resonance=Math.min(100,this.resonance+1);}
    if(this.fx.length>650)this.fx.splice(0,this.fx.length-650);
  }
  kill(e){if(e.dead)return;super.kill(e);this.combo++;this.comboTimer=3.2;this.bestCombo=Math.max(this.bestCombo,this.combo);this.resonance=Math.min(100,this.resonance+(e.boss?22:e.type==='elite'?12:.9));this.scars.push({x:e.x,y:e.y,r:e.r,color:e.color,life:e.boss?7:3.5});if(e.boss){this.hitStop=.09;this.glitch=.7;this.fx.push({kind:'burst',x:e.x,y:e.y,r:260,life:1,max:1,color:'#e0ffac'});}else if(this.combo%25===0){this.float(this.player.x,this.player.y-54,this.combo+' 콤보','#bd762c',15);this.resonance=Math.min(100,this.resonance+8);}}
  // Existing guaranteed rewards stay intact; routine healing drops are scarcer.
  spawnLoot(type,x,y,value){if(type==='med'&&this.enemies.some(e=>e.dead&&!e.boss&&e.type!=='elite'&&e.x===x&&e.y===y)&&this.random()<.65)return;super.spawnLoot(type,x,y,value);}
  hitPlayer(amount){if(this.player.invuln>0||this.state!=='playing')return;this.lastDamageAt=this.t;this.combo=0;this.comboTimer=0;this.glitch=.16;this.resonance=Math.max(0,this.resonance-12);super.hitPlayer(amount*(this.overdrive>0?1.3:1));}
  updateRelays(dt){for(const r of this.relays)if(!r.active&&this.t>=r.unlock&&distance(r,this.player)<155&&!this.relayChallenge[r.id]){this.relayChallenge[r.id]=true;for(let i=0;i<6;i++){const a=i*TAU/6;this.spawnEnemy(i%3===0?'charger':'wraith',clamp(r.x+Math.cos(a)*440,-WORLD+40,WORLD-40),clamp(r.y+Math.sin(a)*440,-WORLD+40,WORLD-40));}this.toast('열기 간식 노출 · 간식 창고를 방어하세요.',true,4);}super.updateRelays(dt);}
  getChoices(exclude=[]){if(this.level>=8&&!this.protocol)return PROTOCOLS.map(p=>({...p,level:0}));const owned=WEAPONS.filter(id=>this.u[id]);const eligible=UPGRADES.filter(u=>(this.u[u.id]||0)<u.max&&(!WEAPONS.includes(u.id)||this.u[u.id]||owned.length<this.weaponSlots));const evos=EVOLUTIONS.filter(e=>!this.evolved[e.id]&&(!e.requires||this.evolved[e.requires])&&(this.u[e.weapon]||0)>=5&&(this.u[e.support]||0)>=2);const result=[];
    if(evos.length){const e=evos[Math.floor(this.random()*evos.length)];result.push({...e,evolution:true,type:'무기 진화',level:0});}
    let pool=eligible.filter(u=>!exclude.includes(u.id));if(pool.length<3)pool=[...eligible];
    if(!result.length&&this.level<5&&owned.length<this.weaponSlots){const ws=pool.filter(u=>WEAPONS.includes(u.id)&&!this.u[u.id]);if(ws.length)result.push({...ws[Math.floor(this.random()*ws.length)],level:0});}
    pool=pool.filter(u=>!result.some(r=>r.id===u.id));while(result.length<3&&pool.length){const weighted=[];pool.forEach((u,i)=>{weighted.push(i);if(this.u[u.id])weighted.push(i);});const i=weighted[Math.floor(this.random()*weighted.length)],u=pool.splice(i,1)[0];result.push({...u,level:this.u[u.id]||0});}
    for(const u of [{id:'heal',name:'우유 한 모금',icon:'✚',desc:'생명력 50% 회복',type:'간식',level:0},{id:'cache',name:'간식 코인 주머니',icon:'◇',desc:'간식 코인 35개 획득',type:'간식',level:0},{id:'overload',name:'와구와구',icon:'↗',desc:'모든 피해량 +5%',type:'간식',level:0}])if(result.length<3)result.push(u);return result;
  }
  applyUpgrade(id){if(PROTOCOLS.some(p=>p.id===id)){const hp=this.player.hp,max=this.player.maxHp;this.protocol=id;this.recalculate();if(this.player.maxHp>max)this.player.hp=Math.min(this.player.maxHp,hp+(this.player.maxHp-max));this.toast(PROTOCOLS.find(p=>p.id===id).name+' / 간식 취향 적용',false,4);return;}super.applyUpgrade(id);if(EVOLUTIONS.some(e=>e.id===id)){this.hitStop=.06;this.glitch=.5;this.sound.play('evolution');}}
  levelUp(){super.levelUp();this.choiceIds=this.choiceSet.map(c=>c.id);this.callbacks.save?.();}
  reroll(){if(this.choiceSet[0]?.protocol)return false;const r=super.reroll();if(r){this.choiceIds=this.choiceSet.map(c=>c.id);this.callbacks.save?.();}return r;}
  serialize(){const data=super.serialize();if(!data)return null;data.signal={edition:EDITION};for(const key of ['resonance','overdrive','overdriveCount','combo','comboTimer','bestCombo','perfectDodges','lastDamageAt','nextInterference','interferenceIndex','interferenceUntil','interferenceName','lines','waves','traps','wells','protocol','weaponSlots','railTimer','mineTimer','relayChallenge','choiceIds','runDamage'])data.signal[key]=this[key];return data;}
  restore(data){this.initSignal();const saved=data?.signal;if(saved?.edition===EDITION){const stateKeys=['resonance','overdrive','overdriveCount','combo','comboTimer','bestCombo','perfectDodges','lastDamageAt','nextInterference','interferenceIndex','interferenceUntil','interferenceName','lines','waves','traps','wells','protocol','weaponSlots','railTimer','mineTimer','relayChallenge','choiceIds','runDamage'];for(const key of stateKeys)if(saved[key]!==undefined)this[key]=saved[key];}
    else{this.nextInterference=(data?.t||0)+35;this.weaponSlots=Math.max(3,WEAPONS.filter(id=>data?.u?.[id]).length);}
    const choiceIds=[...(this.choiceIds||[])];const originalUpgrade=this.callbacks.upgrade,originalSave=this.callbacks.save;let choices=null;this.callbacks.upgrade=cs=>choices=cs;this.callbacks.save=()=>{};const ok=super.restore(data);this.callbacks.upgrade=originalUpgrade;this.callbacks.save=originalSave;
    if(!ok)return false;
    this.resetAim();
    for(const e of this.enemies){for(const [key,value] of Object.entries({exposed:0,chill:0,burn:0,burnTick:.5,patternCd:4,burstCd:2.2,bossStage:0}))if(!Number.isFinite(e[key]))e[key]=value;}
    if(this.state==='upgrade'){const valid=[...UPGRADES,...PROTOCOLS,...EVOLUTIONS];if(choiceIds.length===3&&choiceIds.every(id=>valid.some(v=>v.id===id))){this.choiceSet=choiceIds.map(id=>{const u=valid.find(u=>u.id===id);return {...u,level:this.u[id]||0,evolution:EVOLUTIONS.some(e=>e.id===id),type:u.type||(u.weapon?'무기 진화':'강화')};});this.choiceIds=choiceIds;}originalUpgrade?.(this.choiceSet);}
    this.recalculate();return true;
  }
  finish(won){if(this.state==='ended')return;const finish=this.callbacks.finish;this.callbacks.finish=data=>finish?.({...data,edition:EDITION,bestCombo:this.bestCombo,perfectDodges:this.perfectDodges,overdriveCount:this.overdriveCount,protocol:this.protocol,runDamage:{...this.runDamage}});super.finish(won);this.callbacks.finish=finish;}
}
Object.assign(SignalGame.prototype,signalVisuals,aiming);
