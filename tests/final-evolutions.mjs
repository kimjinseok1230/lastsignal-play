import {test} from 'node:test';import assert from 'node:assert/strict';
import {CatGame} from '../cat-game.js?v=cat16';import {createMeta,EVOLUTIONS} from '../data.js?v=cat16';
function make(){const g=new CatGame({getContext:()=>null},{},{play(){},ambient(){}},{particles:false});g.start('runner',createMeta());g.enemies=[];g.player.angle=0;g.protocol='bastion';g.level=10;const e=g.spawnEnemy('brute',100,0);e.warmup=0;e.hp=e.maxHp=10000;return g;}
test('six final evolutions need their first evolution and a second support',()=>{for(const evo of EVOLUTIONS.filter(e=>e.requires)){const g=make();g.u[evo.weapon]=5;g.u[evo.support]=2;assert(!g.getChoices().some(e=>e.id===evo.id));g.evolved[evo.requires]=true;assert(g.getChoices().some(e=>e.id===evo.id));g.applyUpgrade(evo.id);assert(g.evolved[evo.id]);assert(!g.getChoices().some(e=>e.id===evo.id));const h=make();assert(h.restore(JSON.parse(JSON.stringify(g.serialize()))));assert(h.evolved[evo.id]);}});
test('final evolution effects block, detonate, split, freeze, crossfire and plant',()=>{
 const a=make();a.evolved.aegis=true;a.hostile=[{x:80,y:0},{x:100,y:0}];a.updateEvolutions(.1);assert.equal(a.hostile.length,1);a.updateEvolutions(.1);assert.equal(a.hostile.length,1);
 const t=make();t.evolved.tesla=true;t.updateEvolutions(.1);t.updateCatSkills(.9);assert(t.enemies[0].hp<10000);
 const c=make();c.evolved.confetti=true;const b={x:100,y:0,blast:100,damage:100,life:1};c.explode(b);assert.equal(c.bullets.length,8);c.explode(b);assert.equal(c.bullets.length,8);
 const f=make();f.evolved.blizzard=true;f.updateEvolutions(.1);assert.equal(f.bullets.length,8);assert(f.bullets.every(b=>b.catEffect==='freeze'));
 const r=make();r.evolved.crossbeam=true;r.updateEvolutions(.1);assert(r.enemies[0].hp<10000);assert.equal(r.fx.filter(f=>f.kind==='rail').length,2);
 const g=make();g.evolved.garden=true;g.updateEvolutions(.1);assert.equal(g.traps.length,3);assert(g.traps.every(t=>t.x>0));
});
