import {test} from 'node:test';import assert from 'node:assert/strict';import {createMeta,normalizeMeta} from '../data.js?v=cat21';import {COSMETICS,equipCosmetic,normalizeLook,previewLook} from '../cosmetics.js?v=cat21';import {CatGame} from '../cat-game.js?v=cat21';
test('free cosmetics follow completed runs and wins; paid previews cannot be equipped',()=>{const m=createMeta();assert(!equipCosmetic(m,'scarf'));m.runs=1;assert(equipCosmetic(m,'scarf'));assert(!equipCosmetic(m,'leaf'));m.runs=3;assert(equipCosmetic(m,'leaf'));assert(!equipCosmetic(m,'clover'));m.wins=1;assert(equipCosmetic(m,'clover'));for(const c of COSMETICS.filter(c=>c.premium))assert(!equipCosmetic(m,c.id));assert.deepEqual(normalizeMeta(JSON.parse(JSON.stringify(m))).cosmetics,m.cosmetics);assert.equal(normalizeLook({effect:'paw'},m).effect,'crumb');assert.equal(previewLook('starter').effect,'paw');});
test('cosmetic selection does not change combat stats, damage, loot, or RNG; particles bounded',()=>{const make=()=>{const g=new CatGame({getContext:()=>null},{},{play(){},ambient(){}},{particles:false});g.start('runner',createMeta());g.seed=g.rng=123;g.enemies=[];return g;};const a=make(),b=make();b.cosmetics=previewLook('starter');assert.deepEqual(a.stats,b.stats);for(const g of [a,b]){const e=g.spawnEnemy('brute',100,0);e.warmup=0;g.damage(e,10000,'bullet');}assert.equal(a.rng,b.rng);assert.equal(a.kills,b.kills);assert.deepEqual(a.loot,b.loot);for(let i=0;i<100;i++)b.emitCosmetic({x:0,y:0});assert(b.cosmeticFX.length<=36);b.updateCosmetics(1);assert.equal(b.cosmeticFX.length,0);});
for(const item of COSMETICS)test(`equip/restore/preview: ${item.id}`,()=>{
 const m=createMeta();m.runs=3;m.wins=1;
 const before=JSON.stringify(m.cosmetics);
 assert.equal(equipCosmetic(m,item.id),!item.premium);
 if(item.premium)assert.equal(JSON.stringify(m.cosmetics),before);
 else {assert.equal(normalizeMeta(JSON.parse(JSON.stringify(m))).cosmetics[item.slot],item.id);}
 assert.equal(previewLook(item.id)[item.slot],item.id);
 const make=()=>{const g=new CatGame({getContext:()=>null},{},{play(){},ambient(){}},{particles:true});g.start('runner',m);g.seed=g.rng=777;g.enemies=[];return g;};
 const a=make(),b=make();b.cosmetics=previewLook(item.id);assert.deepEqual(a.stats,b.stats);
 for(const g of [a,b]){const e=g.spawnEnemy('stalker',90,0);e.warmup=0;g.damage(e,10000,'bullet');}
 assert.equal(a.rng,b.rng);assert.deepEqual(a.loot,b.loot);assert.equal(b.cosmeticFX[0].id,previewLook(item.id).effect);
});
