import assert from 'node:assert/strict';
import {SignalGame} from '../cat-game.js?v=cat1';
import {Game as LegacyGame} from '../game.js';
import {WEAPONS,PROTOCOLS,createMeta,normalizeMeta} from '../data.js?v=cat1';

const canvas={getContext:()=>null};
const sound={play(){},ambient(){}};
const make=(Engine=SignalGame)=>{const g=new Engine(canvas,{},sound,{particles:false,shake:false});g.start('runner',createMeta());g.rng=62421;g.enemies=[];g.player.invuln=0;return g;};
const results=[];
function test(name,fn){fn();results.push(name);}
const enemy=(g,type='brute',x=100,y=0)=>{const e=g.spawnEnemy(type,x,y);e.warmup=0;return e;};

test('Full auxiliary loadout offers only equipped weapons and supports',()=>{
  const g=make();for(const id of ['rail','mine','field'])g.applyUpgrade(id);
  for(let i=0;i<80;i++)assert(g.getChoices().every(c=>!WEAPONS.includes(c.id)||g.u[c.id]));
  assert.equal(WEAPONS.filter(id=>g.u[id]).length,3);
});
test('Level 8 mutation is mandatory once, has a real tradeoff, and cannot waste a reroll',()=>{
  for(const protocol of PROTOCOLS){const g=make();g.level=8;g.pendingLevels=1;g.levelUp();assert(g.choiceSet.every(c=>c.protocol));const stats={...g.stats},rolls=g.rerolls;assert(!g.reroll());assert.equal(g.rerolls,rolls);g.choose(protocol.id);assert.equal(g.protocol,protocol.id);assert(!g.getChoices().some(c=>c.protocol));
    if(protocol.id==='glass'){assert(g.stats.damage>stats.damage);assert(g.player.maxHp<stats.maxHp);}
    if(protocol.id==='capacitor'){assert(g.stats.pulseCd<stats.pulseCd);assert(g.stats.damage<stats.damage);}
    if(protocol.id==='bastion'){assert(g.player.maxHp>stats.maxHp);assert(g.stats.speed<stats.speed);}
  }
});
test('Overdrive requires earned resonance, boosts damage, increases risk and expires',()=>{
  const g=make();assert(!g.activateOverdrive());const stats={...g.stats};g.resonance=100;assert(g.activateOverdrive());assert(!g.activateOverdrive());assert(g.stats.damage>stats.damage);assert(g.stats.haste>stats.haste);const hp=g.player.hp;g.hitPlayer(20);assert(hp-g.player.hp>20);
  g.overdrive=.01;g.update(1/60);assert.equal(g.overdrive,0);assert.equal(g.stats.damage,stats.damage);assert.equal(g.overdriveCount,1);
});
test('Laser warning is safe; the active line hurts; dash timing rewards and protects',()=>{
  const g=make();g.addLine(-300,0,300,0,.3,.3,12,25);const hp=g.player.hp;g.updatePatterns(.1);assert.equal(g.player.hp,hp);const resonance=g.resonance;assert(g.dash());g.updatePatterns(.25);assert.equal(g.player.hp,hp);assert(g.resonance>resonance);assert.equal(g.perfectDodges,1);
  const h=make();h.addLine(-300,0,300,0,.1,.3,12,25);h.updatePatterns(.12);assert(h.player.hp<h.player.maxHp);
});
test('Closing wave has a genuinely safe opening',()=>{
  const safe=make(),unsafe=make();for(const g of [safe,unsafe])g.addWave(0,0,150,0,0);safe.player.x=149;unsafe.player.x=-149;safe.updatePatterns(.01);unsafe.updatePatterns(.01);assert.equal(safe.player.hp,safe.player.maxHp);assert(unsafe.player.hp<unsafe.player.maxHp);
});
test('Jammer protects neighbors; rail bypasses it; cold and lightning shatter nearby enemies',()=>{
  const g=make();const e=enemy(g);e.hp=e.maxHp=1000;e.shielded=true;const hp=e.hp;g.damage(e,100,'mine');const protectedDamage=hp-e.hp;g.damage(e,100,'rail');assert(hp-protectedDamage-e.hp>protectedDamage);
  const nearby=enemy(g,'brute',e.x+35,0);const hp2=nearby.hp;e.chill=1;g.damage(e,10,'arc');assert(nearby.hp<hp2);assert(g.fx.some(f=>f.kind==='shatter'));
});
test('Mines arm before firing, pull their targets, and evolve into lasting gravity wells',()=>{
  const g=make();g.applyUpgrade('mine');g.evolved.singularity=true;g.mineTimer=0;g.updateWeapons(.01);const trap=g.traps[0],e=enemy(g,'brute',trap.x+45,trap.y);e.hp=e.maxHp=1000;g.updateTraps(.3);assert.equal(e.hp,1000);const dx=Math.abs(e.x-trap.x);g.updateTraps(.5);assert(e.hp<1000);assert(Math.abs(e.x-trap.x)<dx);assert(g.wells.length>0);assert.equal(g.traps.length,0);
});
test('Boss transitions retain readable charge attacks at each phase',()=>{
 const g=make(),boss=enemy(g,'sentinel',300,0);boss.hp=boss.maxHp*.6;boss.patternCd=0;g.updateEnemy(boss,.01);assert.equal(boss.bossStage,1);assert(boss.dashWait>1);assert(g.lines.length);for(let i=0;i<190;i++)g.updateEnemy(boss,.01);assert(boss.exposed>0);boss.hp=boss.maxHp*.3;boss.patternCd=0;g.updateEnemy(boss,.01);assert.equal(boss.bossStage,2);assert(boss.dashWait>0);
});
test('Recovery waits for breathing room and taking a hit breaks a chain',()=>{
  const g=make();g.applyUpgrade('regen');g.combo=25;g.player.hp=90;g.hitPlayer(10);assert.equal(g.combo,0);const hp=g.player.hp;for(let i=0;i<120;i++)g.update(1/60);assert.equal(g.player.hp,hp);g.t=6;g.update(1/60);assert(g.player.hp>hp);
});
test('New saves preserve mutation choices, active patterns, resonance and trap timers',()=>{
  const g=make();g.level=8;g.pendingLevels=1;g.levelUp();g.addLine(0,0,100,0);g.addWave(0,0,120,.5);g.resonance=88;g.railTimer=.25;const data=JSON.parse(JSON.stringify(g.serialize())),h=make();assert(h.restore(data));assert.deepEqual(h.choiceSet.map(c=>c.id),g.choiceSet.map(c=>c.id));assert.equal(h.lines.length,1);assert.equal(h.waves.length,1);assert.equal(h.railTimer,.25);assert.equal(h.resonance,88);h.choose('glass');assert.equal(h.protocol,'glass');
});
test('Legacy saves keep all four old weapons and resume boss attacks; permanent progress survives',()=>{
  const old=make(LegacyGame);for(const id of ['orbit','arc','field','rocket'])old.applyUpgrade(id);old.t=350;const boss=enemy(old,'sentinel',500,0);old.pendingLevels=0;const data=JSON.parse(JSON.stringify(old.serialize()));const g=make();assert(g.restore(data));assert.equal(g.weaponSlots,4);assert.equal(WEAPONS.filter(id=>g.u[id]).length,4);const restored=g.enemies.find(e=>e.id===boss.id);for(let i=0;i<250;i++)g.updateEnemy(restored,1/60);assert(g.lines.length>0);assert(Number.isFinite(restored.patternCd));assert(g.nextInterference>old.t);
  const meta=createMeta();meta.credits=175;meta.base.hull=3;meta.wins=2;const normalized=normalizeMeta(JSON.parse(JSON.stringify(meta)));assert.equal(normalized.credits,175);assert.equal(normalized.base.hull,3);assert.equal(normalized.wins,2);
});
console.log(JSON.stringify({tests:results.length,passed:results},null,2));
