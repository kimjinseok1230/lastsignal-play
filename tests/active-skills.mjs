import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CatGame} from '../cat-game.js?v=cat11';
import {createMeta} from '../data.js?v=cat11';
import {ACTIVE_SKILLS} from '../roster.js?v=cat11';
function make(id){const g=new CatGame({getContext:()=>null},{},{play(){},ambient(){}},{particles:true,shake:false});g.start(id,createMeta());g.enemies=[];g.player.angle=0;g.player.invuln=0;g.player.hp=30;for(const x of [90,-90]){const e=g.spawnEnemy('brute',x,0);e.warmup=0;e.hp=e.maxHp=10000;}return g;}
test('12 active skills enforce cooldown, pause gate and retain cooldown on restore',()=>{for(const id of Object.keys(ACTIVE_SKILLS)){const g=make(id);g.state='paused';assert.equal(g.pulse(),false);g.state='playing';assert(g.pulse());assert.equal(g.pulse(),false);assert.equal(g.player.pulseCd,ACTIVE_SKILLS[id].cd);const h=make('runner');assert(h.restore(JSON.parse(JSON.stringify(g.serialize()))));assert.equal(h.player.pulseCd,g.player.pulseCd);}});
test('active skills change movement, install allies, protect or control enemies',()=>{
 const r=make('runner'),speed=r.stats.speed;r.pulse();assert.equal(r.stats.speed,speed*1.6);r.updateCatSkills(.1);assert(r.traps.length);r.updateCatSkills(4);assert.equal(r.stats.speed,speed);
 const t=make('engineer');t.pulse();t.player.x=200;t.updateCatSkills(.1);assert.equal(t.skillObjects[0].x,0);assert(t.bullets.length>0);
 const w=make('warden');w.pulse();const hp=w.player.hp,e=w.enemies[0];w.hitPlayer(20);assert.equal(w.player.hp,hp);assert(e.hp<10000);
 const s=make('spider');s.pulse();s.updateCatSkills(.1);assert(s.enemies[0].root>0);assert(!s.enemies[1].root);
 const f=make('frost');f.pulse();assert.equal(f.bullets.length,5);f.activeCatBullet=f.bullets[0];f.damage(f.enemies[0],1,'bullet');assert.equal(f.enemies[0].root,2);
 const n=make('ninja');n.pulse();assert.equal(n.player.x,210);assert(n.enemies[0].hp<10000);assert.equal(n.enemies[1].hp,10000);
 const c=make('chef');c.pulse();c.updateCatSkills(.1);assert(c.enemies[0].burn>0);assert.equal(c.enemies[1].hp,10000);
 const h=make('nurse');h.pulse();assert.equal(h.player.hp,30);h.updateCatSkills(.1);assert(h.player.hp>30);const hp2=h.player.hp;h.player.x=500;h.updateCatSkills(.5);assert.equal(h.player.hp,hp2);
 const z=make('spark');z.pulse();assert.equal(z.enemies[0].hp,10000);z.updateCatSkills(.6);assert.equal(z.enemies[0].hp,10000);z.updateCatSkills(.7);assert(z.enemies[0].hp<10000);
 const a=make('wizard');a.pulse();a.updateCatSkills(.1);assert.equal(a.bullets.length,3);a.player.x=100;a.updateCatSkills(.5);assert.equal(a.skillObjects[0].x,100);
 const g=make('astro');g.pulse();g.updateTraps(.1);assert(g.enemies[0].x>90);
 const m=make('moon');m.pulse();assert.equal(m.bullets.length,5);m.updateBullet(m.bullets[0],.7);assert(m.bullets[0].returning);
});
test('skill objects and timed buffs survive saves and new runs reset them',()=>{for(const id of ['runner','engineer','warden','spider','chef','nurse','spark','wizard']){const g=make(id);g.pulse();g.updateCatSkills(.1);const h=make('runner');assert(h.restore(JSON.parse(JSON.stringify(g.serialize()))));assert.deepEqual(h.skillObjects,g.skillObjects);assert.deepEqual(h.skillBuff,g.skillBuff);h.start(id,createMeta());assert.equal(h.skillObjects.length,0);assert.equal(h.skillBuff,null);}});
test('death feedback occurs once and respects particle setting',()=>{const g=make('runner'),e=g.enemies[0];g.kill(e);const n=g.fx.length;assert(g.fx.some(f=>f.kind==='shatter'));g.kill(e);assert.equal(g.fx.length,n);const h=make('runner');h.settings.particles=false;h.kill(h.enemies[0]);assert(!h.fx.some(f=>f.kind==='shatter'));});
