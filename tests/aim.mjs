import assert from 'node:assert/strict';
import {SignalGame} from '../cat-game.js?v=cat1';
import {bindStick} from '../aim.js';
import {createMeta} from '../data.js?v=cat1';
const results=[];
const make=()=>{const g=new SignalGame({getContext:()=>null},{},{play(){},ambient(){}},{particles:false,shake:false});g.resize(1280,800);g.start('runner',createMeta());g.enemies=[];g.spawnTimer=100;g.eventIndex=g.events.length;g.loot=[];g.player.invuln=30;return g;};
const settle=g=>{for(let i=0;i<60;i++)g.updateAim();};
const test=(name,fn)=>{fn();results.push(name);};
const close=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
test('Fire continues without enemies or a held button',()=>{const g=make();let shots=0;const fire=g.fireMain.bind(g);g.fireMain=t=>{shots++;fire(t);};g.aimVector(1,0);settle(g);for(let i=0;i<150;i++)g.update(1/60);assert(shots>=6);assert(g.bullets.every(b=>b.vx>0&&Math.abs(b.vy)<1e-8));});
test('Movement and dash do not steal the selected attack direction',()=>{const g=make();g.aimVector(1,0);settle(g);g.keys.add('KeyA');g.update(1/60);assert(g.player.x<0);close(g.player.angle,0);g.dash();g.update(1/60);assert(g.player.dashX<0);close(g.player.angle,0);});
test('A nearby enemy behind the player cannot redirect primary fire',()=>{const g=make();const e=g.spawnEnemy('brute',-60,0);e.warmup=0;g.aimVector(1,0);settle(g);g.player.shotCd=0;g.update(1/60);assert(g.bullets[0].vx>0);close(g.bullets[0].vy,0);});
test('Mouse coordinates account for zoom, camera motion and player position',()=>{const g=make();g.zoom=.64;g.camera={x:450,y:-220};g.player.x=480;g.player.y=-170;const world={x:700,y:-330};g.aimScreen(g.w/2+(world.x-g.camera.x)*g.zoom,g.h/2+(world.y-g.camera.y)*g.zoom);settle(g);close(g.player.angle,Math.atan2(world.y-g.player.y,world.x-g.player.x));g.camera.x+=35;settle(g);close(g.player.angle,Math.atan2(world.y-g.player.y,world.x+35-g.player.x));});
test('Thumb release and a near-zero aim vector preserve the last direction',()=>{const g=make();g.aimVector(-1,1);settle(g);const angle=g.player.angle;assert(!g.aimVector(0,0));settle(g);assert(!g.aimVector(.001,.001));settle(g);g.update(1/60);close(g.player.angle,angle);});
test('Pause stops fire; restoring a save preserves the direction',()=>{const g=make();g.aimVector(-1,.5);settle(g);g.player.shotCd=0;g.pause();g.update(1);assert.equal(g.bullets.length,0);const saved=JSON.parse(JSON.stringify(g.serialize())),h=make();assert(h.restore(saved));close(h.player.angle,g.player.angle);h.player.shotCd=0;h.update(1/60);assert(h.bullets[0].vx<0);});
test('Rail and launched rockets follow aim; target acquisition ignores enemies behind',()=>{const g=make();g.aimVector(1,0);settle(g);const front=g.spawnEnemy('brute',220,0),back=g.spawnEnemy('brute',-70,0);front.warmup=back.warmup=0;g.u.rail=1;g.u.rocket=1;g.player.rocketCd=g.railTimer=0;g.updateWeapons(.01);assert(front.hp<front.maxHp);assert.equal(back.hp,back.maxHp);const rail=g.fx.find(f=>f.kind==='rail');assert(rail.tx>rail.x);close(rail.ty,rail.y);const rocket=g.bullets.find(b=>b.type==='rocket');assert(rocket.vx>0);assert.equal(rocket.targetId,front.id);front.dead=true;assert.equal(g.rocketTarget(rocket),null);});

// Event fakes exercise two simultaneous pointers without opening a browser.
function surface(){const handlers=new Map(),captured=new Set();return {style:{},classList:{add(){},remove(){}},addEventListener(n,fn){handlers.set(n,fn);},setPointerCapture(id){captured.add(id);},hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id),getBoundingClientRect:()=>({left:0,top:0}),emit(n,id,x,y){handlers.get(n)?.({pointerType:'touch',pointerId:id,clientX:x,clientY:y,preventDefault(){}});}};}
test('Two thumbs remain independent; cancellation clears movement and preserves aim',()=>{const left=surface(),right=surface();let movement={x:0,y:0},aim={x:0,y:-1};const reset=bindStick(left,surface(),surface(),(x,y)=>movement={x,y},()=>true);bindStick(right,surface(),surface(),(x,y)=>{if(x||y)aim={x,y};},()=>true);left.emit('pointerdown',1,50,50);right.emit('pointerdown',2,250,50);left.emit('pointermove',1,90,50);right.emit('pointermove',2,250,10);close(movement.x,1);close(aim.y,-1);left.emit('pointerup',2,0,0);close(movement.x,1);right.emit('pointerup',2,0,0);close(aim.y,-1);left.emit('pointercancel',1,0,0);close(movement.x,0);reset();});
console.log(JSON.stringify({tests:results.length,passed:results},null,2));
// Dragging far must not require dragging all the way back to the initial touch point.
{
 const z=surface();let move={x:0,y:0};bindStick(z,surface(),surface(),(x,y)=>move={x,y},()=>true);
 z.emit('pointerdown',1,0,0);z.emit('pointermove',1,200,0);close(move.x,1);
 z.emit('pointermove',1,150,0);assert(move.x<0,'floating origin reverses immediately');
 z.emit('pointerup',1,150,0);close(move.x,0);
}
