import {endingScene} from './ending-scene.js?v=1';
import {TestGame} from './test-game.js?v=4';
import {CLASSES,WEAPONS,UPGRADES,EVOLUTIONS,formatTime} from './data.js?v=cat16';
import {ACTIVE_SKILLS} from './roster.js?v=cat16';
import {Sound} from './audio.js?v=cat16';
const $=id=>document.getElementById(id),settings={sound:true,volume:.36,musicVolume:.4,effectsVolume:.8,particles:true,shake:true},sound=new Sound(settings);
let toastUntil=0;const g=new TestGame($('world'),{toast:message=>{$('notice').textContent=message;toastUntil=performance.now()+2400;}},sound,settings);
$('cat').innerHTML=CLASSES.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');$('weapon').innerHTML='<option value="none">전용 스킬만 테스트</option>'+WEAPONS.map(id=>`<option value="${id}">${UPGRADES.find(u=>u.id===id).name}</option>`).join('');$('weapon').value='orbit';
function equip(){g.equip($('weapon').value,$('stage').value);const e=EVOLUTIONS.find(e=>e.weapon===$('weapon').value&&Boolean(e.requires)===($('stage').value==='2'));$('weapon-info').textContent=$('weapon').value==='none'?'E 버튼으로 고양이 전용 스킬을 사용하세요.':$('stage').value==='0'?'진화 전 상태입니다. 진화 단계 변경 후 같은 적을 소환해 비교하세요.':e.name+' · '+e.desc;g.spawnGroup('stalker',8);}
function start(){g.startTest($('cat').value);g.primaryEnabled=$('primary').checked;equip();$('time').value='0';$('skill').textContent=ACTIVE_SKILLS[g.classId].name;$('skill-info').textContent=ACTIVE_SKILLS[g.classId].desc;sound.setMode('playing');}
$('cat').onchange=start;$('weapon').onchange=equip;$('stage').onchange=equip;
for(const [id,key] of [['god','invincible'],['cooldown','noCooldown'],['auto','autoAim'],['primary','primaryEnabled']])$(id).onchange=()=>g[key]=$(id).checked;
$('sound').onchange=()=>{sound.unlock();settings.sound=$('sound').checked;sound.sync();};
$('spawn-one').onclick=()=>g.spawnGroup($('enemy').value);$('spawn-many').onclick=()=>g.spawnGroup($('enemy').value,['sentinel','final'].includes($('enemy').value)?1:20);
$('time').onchange=()=>g.jumpTime(Number($('time').value));$('clear').onclick=()=>g.clearRoom();$('heal').onclick=()=>g.recover();
function pause(){if(g.state==='playing')g.pause();else g.resume();} $('pause').onclick=pause;
$('dash').onclick=()=>g.dash();$('skill').onclick=()=>{sound.unlock();if(g.noCooldown)g.player.pulseCd=0;g.pulse();};$('rush').onclick=()=>g.activateOverdrive();
document.addEventListener('pointerdown',()=>sound.unlock(),{once:true});
const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];window.addEventListener('keydown',e=>{if(['INPUT','SELECT','BUTTON'].includes(document.activeElement?.tagName))return;if(movement.includes(e.code)){e.preventDefault();g.keys.add(e.code);}if(e.repeat)return;if(e.code==='KeyE')g.pulse();if(e.code==='Space'){e.preventDefault();g.dash();}if(e.code==='KeyQ')g.activateOverdrive();if(e.code==='Escape')pause();});window.addEventListener('keyup',e=>g.keys.delete(e.code));
const pointers=new Map(),canvas=$('world');canvas.onpointerdown=e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,move:e.clientX-r.left<r.width/2});};canvas.onpointermove=e=>{const r=canvas.getBoundingClientRect();if(e.pointerType==='mouse'){if(!g.autoAim)g.aimScreen(e.clientX-r.left,e.clientY-r.top);return;}const p=pointers.get(e.pointerId);if(!p)return;const x=(e.clientX-p.x)/45,y=(e.clientY-p.y)/45,d=Math.max(1,Math.hypot(x,y));if(p.move)g.touch={x:x/d,y:y/d};else{g.autoAim=false;$('auto').checked=false;g.aimVector(x,y);}};function release(e){if(pointers.get(e.pointerId)?.move)g.touch={x:0,y:0};pointers.delete(e.pointerId);}canvas.onpointerup=release;canvas.onpointercancel=release;
window.addEventListener('blur',()=>{g.keys.clear();g.touch={x:0,y:0};pointers.clear();if(g.state==='playing')g.pause();});
new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();g.resize(r.width,r.height,devicePixelRatio||1);}).observe(canvas);
start();let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;g.update(dt);g.render(dt);sound.setMode(g.state);$('pause').textContent=g.state==='playing'?'일시정지':'계속';$('stats').textContent=`테스트 · ${formatTime(g.t)} · HP ${Math.ceil(g.player.hp)}/${g.player.maxHp} · 적 ${g.enemies.length} · 처치 ${g.kills}`;if(now>toastUntil)$('notice').textContent='';requestAnimationFrame(frame);}requestAnimationFrame(frame);

let previewStep=0;const previewData={classId:'runner',relays:3,bossKills:3,kills:500,bestCombo:50,credits:300};
function drawEndingPreview(){previewData.classId=g.classId;$('ending-content').innerHTML='<p>테스트 미리보기 · 아래 성과는 예시이며 보상이 지급되지 않습니다.</p>'+endingScene(previewData,previewStep,2,'장난감 진화 장인');}
$('ending-preview').onclick=()=>{if(g.state==='playing')g.pause();previewStep=0;drawEndingPreview();$('ending-dialog').showModal();};$('ending-close').onclick=()=>$('ending-dialog').close();$('ending-content').onclick=e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a==='ending-next'&&previewStep<2){previewStep++;drawEndingPreview();}else if(a)$('ending-dialog').close();};
