import {CatGame} from './cat-game.js?v=cat25';
import {CLASSES,WEAPONS,EVOLUTIONS,createMeta} from './data.js?v=cat25';
export class TestGame extends CatGame{
 constructor(canvas,callbacks,sound,settings){super(canvas,{toast:callbacks.toast},sound,settings);this.manualSpawns=true;this.invincible=true;this.noCooldown=true;this.autoAim=true;this.primaryEnabled=true;}
 startTest(id='runner'){if(!CLASSES.some(c=>c.id===id))return false;super.start(id,createMeta());this.events=[];this.nextInterference=1e9;this.clearRoom();return true;}
 serialize(){return null;}
 restore(){return false;}
 spawnRandom(){}
 updateRelays(){}
 updateEvac(){}
 levelUp(){this.pendingLevels=0;this.xp=0;}
 finish(){this.state='paused';this.toast('테스트 종료 · 체력 회복 후 계속할 수 있어요.',false,3);}
 hitPlayer(n){if(!this.invincible)super.hitPlayer(n);}
 fireMain(target){if(this.primaryEnabled)super.fireMain(target);else this.player.shotCd=.1;}
 update(dt){if(this.state!=='playing')return;if(this.noCooldown){this.player.dashCd=0;this.player.pulseCd=0;this.resonance=100;}if(this.autoAim){const e=this.nearest(this.player,850);if(e)this.aimVector(e.x-this.player.x,e.y-this.player.y);}super.update(dt);}
 clearRoom(){for(const k of ['enemies','bullets','hostile','loot','hazards','lines','waves','traps','wells','fx','texts','beams','scars'])this[k]=[];this.resetCatSkills();this.recalculate();this.kills=0;this.combo=0;this.hitStop=0;this.shake=0;this.player.dashTime=0;this.player.invuln=0;}
 equip(weapon,stage){if(!WEAPONS.includes(weapon)&&weapon!=='none')return false;stage=Number(stage);if(![0,1,2].includes(stage))return false;this.clearRoom();this.u={};this.evolved={};if(weapon!=='none'){this.u[weapon]=5;const first=EVOLUTIONS.find(e=>e.weapon===weapon&&!e.requires),last=EVOLUTIONS.find(e=>e.weapon===weapon&&e.requires);if(stage>=1){this.u[first.support]=2;this.applyUpgrade(first.id);}if(stage===2){this.u[last.support]=Math.max(2,this.u[last.support]||0);this.applyUpgrade(last.id);}}this.recalculate();this.player.hp=this.player.maxHp;this.player.arcCd=0;this.player.rocketCd=0;this.railTimer=0;this.mineTimer=0;this.fieldTimer=0;return true;}
 spawnGroup(type='stalker',count=1){if(!['stalker','brute','sniper','jammer','sentinel','final'].includes(type))return;const n=Math.min(40,Math.max(1,count));for(let i=0;i<n;i++){const a=this.player.angle+(i-(n-1)/2)*.18,r=180+(i%3)*45;this.spawnEnemy(type,this.player.x+Math.cos(a)*r,this.player.y+Math.sin(a)*r,{tier:this.t>=600?2:1});}}
 jumpTime(t){if(![0,300,600,840].includes(Number(t)))return;this.clearRoom();this.t=Number(t);this.nextInterference=1e9;this.eventIndex=0;if(this.t)this.spawnGroup(this.t===840?'final':'sentinel');}
 recover(){this.player.hp=this.player.maxHp;this.player.invuln=2;this.state='playing';}
}
