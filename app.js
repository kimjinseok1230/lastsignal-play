import {bindStick} from './aim.js?v=3';
import {SignalGame as Game} from './interference.js?v=3';
import {Sound} from './audio.js?v=3';
import {CLASSES,UPGRADES,EVOLUTIONS,BASE_UPGRADES,DURATION,WEAPONS,PROTOCOLS,createMeta,normalizeMeta,formatTime,xpRequired} from './data.js?v=3';

const $=id=>document.getElementById(id);
const STORAGE='last-signal-v1',RUN_STORAGE=STORAGE+'-run';
let storageOK=true;
function read(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;}catch{return null;}}
function write(key,value){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));}catch{if(storageOK){storageOK=false;$('save-notice').classList.remove('hidden');setTimeout(()=>$('save-notice').classList.add('hidden'),6500);}}}
const meta=normalizeMeta(read(STORAGE));
let savedRun=read(RUN_STORAGE),selectedClass='warden',modalClose=null,toastTimer=null,lastDock='',lastObjective='',lastHud=0,lastMini=0,menuModal='',result=null,priorFocus=null;
const sound=new Sound(meta.settings);
const game=new Game($('world'),{
  start:()=>{resetControls();$('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('pause-btn').classList.remove('hidden');document.body.classList.add('playing');hideModal();lastDock='';lastObjective='';updateHUD(true);},
  pause:()=>{resetControls();saveRun();showPause();},
  resume:()=>{hideModal();lastDock='';updateHUD(true);},
  upgrade:choices=>showUpgrade(choices),
  toast:(message,warning,duration)=>{clearTimeout(toastTimer);$('toast').textContent=message;$('toast').className='toast'+(warning?' warning':'');toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration*1000);},
  save:()=>saveRun(),
  finish:data=>finishRun(data)
},sound,meta.settings);

function saveMeta(){write(STORAGE,meta);}
function saveRun(){const data=game.serialize();if(data){savedRun=data;write(RUN_STORAGE,data);}}
function hideModal(){const wasVisible=!$('overlay').classList.contains('hidden');$('overlay').classList.add('hidden');modalClose=null;menuModal='';if(wasVisible&&priorFocus?.isConnected&&game.state==='menu')priorFocus.focus();}
function openModal(html,onClose=null){priorFocus=document.activeElement;$('modal').innerHTML=html;$('overlay').classList.remove('hidden');modalClose=onClose;requestAnimationFrame(()=>$('modal').focus());}
const closeButton='<button class="modal-close" data-action="close" aria-label="닫기">×</button>';
function menuRefresh(){
  if(game.state==='menu')game.classId=selectedClass;
  $('class-picker').innerHTML=CLASSES.map(c=>`<button class="class-card ${c.id===selectedClass?'selected':''}" data-class="${c.id}" aria-pressed="${c.id===selectedClass}"><span><b class="class-symbol">${c.icon}</b> ${c.en}</span><strong>${c.name}</strong></button>`).join('');
  $('class-description').textContent=CLASSES.find(c=>c.id===selectedClass).description;
  $('credits-badge').textContent=meta.credits.toLocaleString();
  $('continue-btn').classList.toggle('hidden',!savedRun);
  $('best-summary').textContent=meta.runs?`BEST ${formatTime(meta.bestTime)} / ${meta.wins} EXTRACTIONS`:'YOUR SIGNAL STARTS HERE';
  updateSound();
}
function updateSound(){$('sound-btn').innerHTML=`${meta.settings.sound?'♫':'♪'} <span>${meta.settings.sound?'ON':'OFF'}</span>`;$('sound-btn').setAttribute('aria-label',meta.settings.sound?'소리 끄기':'소리 켜기');$('sound-btn').setAttribute('aria-pressed',String(meta.settings.sound));sound.sync();}
function beginRun(difficulty=0){sound.unlock();sound.play('click');savedRun=null;write(RUN_STORAGE,null);game.start(selectedClass,meta,difficulty);saveRun();}
function requestStart(){if(savedRun){menuModal='replace';openModal(`${closeButton}<div class="eyebrow">NEW TRANSMISSION</div><h2 id="modal-title">새로운 작전을 시작할까요?</h2><p class="modal-intro">저장된 ${formatTime(savedRun.t||0)} 작전이 있습니다. 새 작전을 시작하면 진행 중인 작전은 교체됩니다. 기지 강화와 완료한 작전 기록은 유지됩니다.</p><div class="modal-bottom"><button class="secondary-button" data-action="continue">이어서 하기</button><button class="primary-button" data-action="new-confirm"><span>새 작전 시작</span><span>↗</span></button></div>`,()=>hideModal());}else beginRun();}
function continueRun(){sound.unlock();if(!game.restore(savedRun)){savedRun=null;write(RUN_STORAGE,null);menuRefresh();openModal(`${closeButton}<div class="eyebrow">CONNECTION RESET</div><h2 id="modal-title">작전 기록을 읽을 수 없습니다.</h2><p class="modal-intro">기지 강화와 완료한 기록은 유지됩니다. 새 작전으로 다시 출격하세요.</p><button class="primary-button" data-action="new-confirm"><span>새 작전 시작</span><span>↗</span></button>`,hideModal);}}
function toMenu(){resetControls();hideModal();game.state='menu';game.resetDemo();$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('pause-btn').classList.add('hidden');document.body.classList.remove('playing');clearTimeout(toastTimer);$('toast').classList.add('hidden');menuRefresh();}
function skillColor(u){const key=u.weapon||u.id;return {orbit:'#d6ff83',arc:'#90edff',rocket:'#ffa773',field:'#a6deef',rail:'#edffa2',mine:'#c7a1ff'}[key]||'#d0dcb0';}
function showUpgrade(choices){
  resetControls();
  const proto=choices[0]?.protocol,evo=choices.some(c=>c.evolution),owned=WEAPONS.filter(id=>game.u[id]).length;
  openModal(`<div class="eyebrow">${proto?'FREQUENCY MUTATION':evo?'EVOLUTION AVAILABLE':'SIGNAL AMPLIFIED'} / LV. ${String(game.level).padStart(2,'0')}</div><h2 id="modal-title">${proto?'신호의 성질을 바꾸세요.':evo?'간섭이 새로운 힘이 됩니다.':'어떤 신호를 남기겠습니까?'}</h2><p class="modal-intro">${proto?'강점과 약점이 함께 적용됩니다. 한 작전에 한 번 선택합니다.':`보조 무기 ${owned} / ${game.weaponSlots} 슬롯 · ${owned>=game.weaponSlots?'장착 무기와 지원 기술을 강화하세요.':'선택한 무기로 이번 작전의 조합을 만드세요.'}`}</p><div class="choice-grid">${choices.map((u,i)=>`<button class="upgrade-card ${u.evolution?'evolution':''} ${u.protocol?'protocol-card':''}" data-upgrade="${u.id}" style="--skill-color:${skillColor(u)}"><span class="rarity">${u.evolution?'EVOLUTION':u.type}<span>0${i+1}</span></span><span class="big-icon">${u.icon}</span><strong>${u.name}</strong><p>${u.desc}</p><span class="upgrade-bottom"><span>${u.protocol?'신호 변조 · 작전 내 유지':u.evolution?'최종 진화':u.max?`${u.level===0?'NEW':'LV. '+u.level} → LV. ${u.level+1}`:'즉시 적용'}</span><span>[${i+1}]</span></span></button>`).join('')}</div>${proto?'':`<div class="modal-bottom"><button class="secondary-button" data-action="reroll" ${game.rerolls<=0?'disabled':''}>선택지 다시 받기 (${game.rerolls}/2)</button></div>`}<p class="upgrade-note">${proto?'생명력·이동·공격 방식에 직접 영향을 주는 선택입니다.':game.pendingLevels>1?`${game.pendingLevels}회 선택할 수 있습니다.`:'무기 5 + 연계 강화 2 → 진화 · 서리 + 번개 → 파쇄'}</p>`);
}
function showPause(){
  openModal(`${closeButton}<div class="eyebrow">TRANSMISSION PAUSED</div><h2 id="modal-title">잠시 숨을 고르세요.</h2><div class="pause-grid"><div class="pause-stat"><b>${formatTime(game.t)}</b><span>생존 시간</span></div><div class="pause-stat"><b>${game.kills.toLocaleString()}</b><span>격파</span></div><div class="pause-stat"><b>${game.level}</b><span>레벨</span></div></div><div class="run-loadout">${Object.entries(game.u).map(([id,n])=>{const u=UPGRADES.find(u=>u.id===id);return u?`<span>${u.icon} ${u.name} ${n}</span>`:'';}).join('')||'<span>신호 파편을 모아 무기를 강화하세요.</span>'}</div><div class="settings-row"><label for="sound-toggle">게임 사운드</label><input id="sound-toggle" type="checkbox" ${meta.settings.sound?'checked':''}></div><div class="settings-row"><label for="volume-slider">음량</label><input id="volume-slider" type="range" min="0" max="100" value="${Math.round(meta.settings.volume*100)}"></div><div class="settings-row"><label for="shake-toggle">화면 흔들림</label><input id="shake-toggle" type="checkbox" ${meta.settings.shake?'checked':''}></div><div class="settings-row"><label for="particles-toggle">파티클 효과</label><input id="particles-toggle" type="checkbox" ${meta.settings.particles?'checked':''}></div><div class="modal-bottom"><button class="primary-button" data-action="resume"><span>작전 계속</span><span>↗</span></button><button class="secondary-button" data-action="guide-pause">생존 가이드</button></div><button class="quiet-button" data-action="save-menu">저장하고 메뉴로</button>`,()=>game.resume());
}
function showGuide(fromPause=false){
  menuModal=fromPause?'guide-pause':'guide';
  openModal(`${closeButton}<div class="eyebrow">FIELD MANUAL / 01</div><h2 id="modal-title">신호가 남아 있는 한.</h2><p class="modal-intro">한 판 약 15~20분. 이동하며 적을 피하고, 마우스로 조준하고 자동 연사로 길을 여세요.</p><div class="guide-grid"><div><h3>조작 방법</h3><table class="controls-table"><tr><td>이동</td><td><kbd>WASD</kbd> / <kbd>방향키</kbd></td></tr><tr><td>조준 방향</td><td>마우스 이동 · 클릭 불필요</td></tr><tr><td>자동 연사</td><td>적이 없어도 계속 발사</td></tr><tr><td>무적 대시</td><td><kbd>SPACE</kbd></td></tr><tr><td>전자기 펄스</td><td><kbd>E</kbd></td></tr><tr><td>과부하 · 공명 100%</td><td><kbd>Q</kbd></td></tr><tr><td>일시정지</td><td><kbd>ESC</kbd> / <kbd>P</kbd></td></tr><tr><td>강화 선택</td><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></td></tr></table><p style="margin-top:14px">모바일: 왼쪽 스틱으로 이동, 오른쪽 스틱으로 조준합니다. 손을 떼어도 마지막 방향으로 계속 발사합니다. 아래 버튼으로 대시·펄스·과부하를 사용하세요.</p></div><div><h3>돌아오는 방법</h3><p>01. 파편을 모아 성장하세요. 보조 무기는 최대 3개, 8레벨에는 장단점을 가진 신호 변조를 선택합니다.</p><p>02. 1·4·7분에 발견되는 중계기 원 안에서 12초 머무르면 복구됩니다. 밖으로 나가도 복구 진행도는 유지됩니다.</p><p>03. 5·10분에 감시자, 14분에 최후의 감시자가 등장합니다. 붉은 원과 사격선은 공격 예고입니다. 보스의 코어가 열렸을 때 집중 공격하세요.</p><p>04. 중계기 3개 복구 + 최후의 감시자 처치 후, 15분부터 중앙 탈출 지점에서 5초간 생존하세요.</p></div></div><div class="guide-tip"><strong>무기 진화 조합</strong><br>방어 드론 5 + 경량 프레임 2 → 성운 포위망<br>아크 방전 5 + 가속 장전 2 → 종말의 번개<br>유도 로켓 5 + 과충전 탄환 2 → 궤도 폭격<br>서리장 5 + 신호 수집기 2 → 절대 영도<br>위상 절단기 5 + 약점 분석 2 → 삼중 간섭<br>중력 덫 5 + 펄스 증폭 2 → 사건의 지평선<br><br><strong>조준하는 법</strong><br>주 무기와 위상 절단기는 조준 방향으로 발사됩니다. 로켓과 첫 번개는 조준 방향에 있는 적을 노립니다. 드론과 서리장은 주변을 방어합니다.<br><br><strong>전투를 이어가는 법</strong><br>연속 처치와 위험 직전의 대시로 공명을 채우세요. 정밀 회피는 생명력도 3 회복합니다. 100%에서 Q를 누르면 7초간 피해·연사 +35%, 받는 피해 +30%의 과부하가 시작됩니다.<br>서리장에 느려진 적을 번개로 공격하면 주변에 파쇄 피해를 줍니다. 로켓은 화상을, 중력 덫의 진화는 흡인 영역을 남깁니다.<br>오염 보호막은 보랏빛 송신자를 먼저 잡거나 위상 절단기로 관통하세요. 펄스는 주변 탄환을 지우고 보스 코어를 3초간 노출합니다.<br>수축 파동은 초록 틈으로 빠져나오거나 타이밍에 맞춰 대시하세요.</div><p class="upgrade-note">진행 상황은 20초마다 현재 브라우저에 저장됩니다. 기지 정비와 기록도 같은 브라우저에 보관됩니다.</p><div class="modal-bottom"><button class="primary-button" data-action="${fromPause?'back-pause':'close'}"><span>${fromPause?'작전 화면으로':'확인했습니다'}</span><span>↗</span></button></div>`,fromPause?showPause:hideModal);
}
function showBase(){
  menuModal='base';openModal(`${closeButton}<div class="eyebrow">BASE OPERATIONS</div><h2 id="modal-title">다음 신호를 준비하세요.</h2><p class="modal-intro">보유 부품 <strong style="color:var(--accent)">${meta.credits.toLocaleString()}</strong> · 강화는 이후 모든 작전에 적용됩니다.</p><div class="base-grid">${BASE_UPGRADES.map(u=>{const n=meta.base[u.id]||0,cost=u.cost*(n+1);return `<article class="base-card"><div class="base-card-head"><h3>${u.icon} ${u.name}</h3><span>${n} / ${u.max}</span></div><p>${u.desc}</p><button data-base="${u.id}" ${n>=u.max||meta.credits<cost?'disabled':''}>${n>=u.max?'최대 강화 완료':`${cost} 부품으로 강화`}</button></article>`;}).join('')}</div><p class="guide-tip">쓰러져도 회수한 부품은 남습니다. 생존 시간, 적 처치, 중계기 복구와 보급 상자로 부품을 모으세요.</p>${meta.wins?`<div class="modal-bottom"><button class="secondary-button" data-action="hard-start">심층 구역 도전 ↗ · 더 강하고 많은 적</button></div>`:''}<div class="modal-bottom"><button class="primary-button" data-action="close"><span>출격 준비 완료</span><span>↗</span></button></div>`,hideModal);
}
function showRecords(){menuModal='records';openModal(`${closeButton}<div class="eyebrow">OPERATION ARCHIVE</div><h2 id="modal-title">남겨진 신호들.</h2><div class="pause-grid"><div class="pause-stat"><b>${meta.runs}</b><span>완료한 작전</span></div><div class="pause-stat"><b>${meta.wins}</b><span>탈출 성공</span></div><div class="pause-stat"><b>${meta.totalKills.toLocaleString()}</b><span>누적 격파</span></div></div><div class="record-list">${meta.history.length?meta.history.map(r=>`<div class="record-row"><b>${r.won?'탈출 성공':'신호 소실'}</b><span>${CLASSES.find(c=>c.id===r.classId)?.name||'러너'}</span><span>${formatTime(r.time)}</span><span>${r.kills.toLocaleString()} 격파</span></div>`).join(''):'<p class="modal-intro">아직 남겨진 기록이 없습니다.<br>첫 번째 신호를 보내세요.</p>'}</div><p class="upgrade-note">최근 10개 작전 · 현재 브라우저에 저장</p>`,hideModal);}
function finishRun(data){
  resetControls();
  result=data;meta.runs++;meta.wins+=data.won?1:0;meta.credits+=data.credits;meta.bestTime=Math.max(meta.bestTime,Math.floor(data.time));meta.bestKills=Math.max(meta.bestKills,data.kills);meta.totalKills+=data.kills;meta.history.unshift({classId:data.classId,time:Math.floor(data.time),kills:data.kills,won:data.won});meta.history=meta.history.slice(0,10);savedRun=null;write(RUN_STORAGE,null);saveMeta();updateHUD(true);
  openModal(`<div class="eyebrow">${data.won?'EXTRACTION COMPLETE':'TRANSMISSION ENDED'}</div><h2 id="modal-title" class="display-heading">${data.won?'SIGNAL<br>RECEIVED.':'SIGNAL<br><span style="color:var(--accent)">LOST.</span>'}</h2><p class="result-label">${data.won?'당신의 신호가 끝내 닿았습니다.':'이번 신호는 끊겼지만, 끝은 아닙니다.'}</p><div class="pause-grid"><div class="pause-stat"><b>${formatTime(data.time)}</b><span>생존 시간</span></div><div class="pause-stat"><b>${data.kills.toLocaleString()}</b><span>격파</span></div><div class="pause-stat"><b>LV. ${data.level}</b><span>도달 레벨</span></div></div><div class="result-credit"><span>회수한 부품 · 기지 정비에 사용</span><strong>+${data.credits.toLocaleString()}</strong></div><p class="upgrade-note">최대 ${data.bestCombo||0} 연속 처치 · 정밀 회피 ${data.perfectDodges||0}회 · 과부하 ${data.overdriveCount||0}회</p><p class="upgrade-note">중계기 ${data.relays}/3 · 감시자 ${data.bossKills}기 격파 · 보유 부품 ${meta.credits.toLocaleString()}</p>${data.won&&meta.wins===1?'<p class="unlock-message">심층 구역이 열렸습니다. 기지 정비에서 더 어려운 작전에 도전할 수 있습니다.</p>':''}<div class="modal-bottom"><button class="primary-button" data-action="retry"><span>다시 신호 보내기</span><span>↗</span></button><button class="secondary-button" data-action="result-base">기지 정비</button></div><button class="quiet-button" data-action="menu">메뉴로 돌아가기</button>`);
}

function updateHUD(force=false){
  if(game.state==='menu')return;const p=game.player;
  $('operator-name').textContent=game.classData.name;$('level-label').textContent='LV. '+String(game.level).padStart(2,'0');$('health-fill').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';$('hp-number').textContent=Math.ceil(p.hp)+' / '+p.maxHp;$('xp-fill').style.width=Math.min(100,game.xp/xpRequired(game.level)*100)+'%';$('timer').textContent=formatTime(game.t);$('kills').textContent=String(game.kills).padStart(4,'0');$('relays').textContent=game.relays.filter(r=>r.active).length+' / 3';
  $('phase-label').textContent=game.t>=900?'탈출 작전':game.t>=840?'최후의 감시자':game.t>=600?'마지막 저항':game.t>=300?'심층 구역':'신호 탐색';
  $('dash-status').textContent=p.dashCd>0?p.dashCd.toFixed(1)+'s':'READY';$('pulse-status').textContent=p.pulseCd>0?Math.ceil(p.pulseCd)+'s':'READY';$('dash-fill').style.width=(1-p.dashCd/game.stats.dashCd)*100+'%';$('pulse-fill').style.width=(1-p.pulseCd/game.stats.pulseCd)*100+'%';$('dash-btn').setAttribute('aria-disabled',String(p.dashCd>0));$('pulse-btn').setAttribute('aria-disabled',String(p.pulseCd>0));
  const hot=game.overdrive>0,ready=game.resonance>=100;
  $('overdrive-status').textContent=hot?game.overdrive.toFixed(1)+'s':ready?'READY':Math.floor(game.resonance)+'%';
  $('overdrive-fill').style.width=(hot?game.overdrive/7*100:game.resonance)+'%';
  $('overdrive-btn').classList.toggle('charged',ready||hot);
  $('overdrive-btn').setAttribute('aria-disabled',String(!ready||hot));
  $('resonance-fill').style.width=(hot?game.overdrive/7*100:game.resonance)+'%';
  $('combo-label').textContent=game.combo>=5?game.combo+' CHAIN · 공명 '+Math.floor(game.resonance)+'%':'공명 '+Math.floor(game.resonance)+'%';
  $('protocol-label').textContent=game.protocol?PROTOCOLS.find(p=>p.id===game.protocol)?.name||'CARRIER / 07':'CARRIER / 07';
  const interference=game.t<game.interferenceUntil;
  $('interference-label').textContent=interference?game.interferenceName:'다음 간섭';
  $('interference-countdown').textContent=formatTime(Math.max(0,(interference?game.interferenceUntil:game.nextInterference)-game.t));
  document.querySelector('.signal-hud').classList.toggle('danger',interference);
  const active=game.relays.filter(r=>!r.active&&game.t>=r.unlock).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];const next=game.relays.filter(r=>!r.active&&game.t<r.unlock)[0];let objective='';
  if(active)objective=`<b>중계기 0${active.id+1} 복구</b><small>주황색 방향 표시를 따라가세요</small>`;
  else if(next)objective=`<b>다음 중계기 ${formatTime(next.unlock)}</b><small>신호 파편을 모아 강화하세요</small>`;
  else if(!game.finalDead)objective='<b>중계기 연결 완료</b><small>14:00 최후의 감시자 처치</small>';
  else if(game.t<DURATION)objective='<b>탈출 신호 준비 완료</b><small>15:00까지 생존 · 중앙으로 이동</small>';
  else objective='<b>중앙에서 5초간 생존</b><small>민트색 탈출 표시를 따라가세요</small>';
  if(force||objective!==lastObjective){$('objective').innerHTML=objective;lastObjective=objective;}
  const boss=game.enemies.filter(e=>e.boss&&!e.dead).sort((a,b)=>(b.type==='final')-(a.type==='final'))[0];$('boss-hud').classList.toggle('hidden',!boss);if(boss){$('boss-name').textContent=boss.type==='final'?'THE SILENCER · 최후의 감시자':boss.tier===1?'THE WATCHER · 감시자':'THE WARDEN · 심층 감시자';$('boss-health').textContent=Math.ceil(boss.hp/boss.maxHp*100)+'%';$('boss-fill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';}
  const charging=game.charging,evac=game.t>=900&&game.finalDead&&game.relays.every(r=>r.active)&&game.evacuating>0;
  $('relay-progress').classList.toggle('hidden',!charging&&!evac);if(charging||evac){$('relay-progress').querySelector('span').textContent=charging?'중계기 복구 중 · 원 안에 머무르세요':'탈출 중 · 신호를 유지하세요';$('relay-fill').style.width=(charging?charging.charge/12:game.evacuating/5)*100+'%';}
  const dock=JSON.stringify([game.u,game.evolved,game.protocol]);if(force||dock!==lastDock){lastDock=dock;const weapons=UPGRADES.filter(u=>WEAPONS.includes(u.id)&&game.u[u.id]);$('weapon-dock').innerHTML=`<div class="weapon-chip" title="${game.classId==='warden'?'산탄총':'펄스 라이플'} · 마우스 조준 / 자동 연사"><span class="weapon-icon">⌁</span><small>MAIN</small></div>`+weapons.map(u=>{const evolved=EVOLUTIONS.find(e=>e.weapon===u.id&&game.evolved[e.id]);return `<div class="weapon-chip" style="--skill-color:${skillColor(u)}" title="${evolved?evolved.name:u.name}"><span class="weapon-icon" ${evolved?'style="color:var(--accent)"':''}>${evolved?evolved.icon:u.icon}</span><small>${evolved?'EVO':'LV.'+game.u[u.id]}</small></div>`;}).join('')+Array.from({length:Math.max(0,game.weaponSlots-weapons.length)},()=>'<div class="weapon-chip empty"><span class="weapon-icon">＋</span><small>EMPTY</small></div>').join('');}
}

$('class-picker').addEventListener('click',e=>{const c=e.target.closest('[data-class]');if(c){selectedClass=c.dataset.class;sound.play('click');menuRefresh();}});
$('start-btn').addEventListener('click',requestStart);
$('continue-btn').addEventListener('click',continueRun);
$('base-btn').addEventListener('click',showBase);
$('guide-btn').addEventListener('click',()=>showGuide());
$('records-btn').addEventListener('click',showRecords);
$('pause-btn').addEventListener('click',()=>game.pause());
$('overdrive-btn').addEventListener('pointerdown',e=>{e.preventDefault();game.activateOverdrive();});
$('overdrive-btn').addEventListener('click',e=>{if(e.detail===0)game.activateOverdrive();});
$('dash-btn').addEventListener('pointerdown',e=>{e.preventDefault();game.dash();});
$('pulse-btn').addEventListener('pointerdown',e=>{e.preventDefault();game.pulse();});
$('dash-btn').addEventListener('click',e=>{if(e.detail===0)game.dash();});
$('pulse-btn').addEventListener('click',e=>{if(e.detail===0)game.pulse();});
$('home-mark').addEventListener('click',()=>{if(game.state==='menu')hideModal();});
$('sound-btn').addEventListener('click',()=>{sound.unlock();meta.settings.sound=!meta.settings.sound;updateSound();saveMeta();sound.play('click');});
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{game.toast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.',false,3);}});
if(!document.documentElement.requestFullscreen)$('fullscreen-btn').classList.add('hidden');
$('modal').addEventListener('click',e=>{
  const upgrade=e.target.closest('[data-upgrade]');if(upgrade){game.choose(upgrade.dataset.upgrade);return;}
  const base=e.target.closest('[data-base]');if(base&&!base.disabled){const u=BASE_UPGRADES.find(u=>u.id===base.dataset.base);const n=meta.base[u.id]||0,cost=u.cost*(n+1);if(n<u.max&&meta.credits>=cost){meta.credits-=cost;meta.base[u.id]=n+1;saveMeta();sound.play('level');menuRefresh();showBase();}return;}
  const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const a=button.dataset.action;
  if(a==='close'){modalClose?.();}
  else if(a==='new-confirm')beginRun();
  else if(a==='continue')continueRun();
  else if(a==='resume')game.resume();
  else if(a==='reroll')game.reroll();
  else if(a==='guide-pause')showGuide(true);
  else if(a==='back-pause')showPause();
  else if(a==='save-menu'){saveRun();toMenu();}
  else if(a==='retry'){selectedClass=result.classId;beginRun(result.difficulty);}
  else if(a==='result-base'){toMenu();showBase();}
  else if(a==='menu')toMenu();
  else if(a==='hard-start'){if(savedRun){openModal(`${closeButton}<div class="eyebrow">DEEP SECTOR</div><h2 id="modal-title">심층 구역으로 출격할까요?</h2><p class="modal-intro">진행 중인 저장 작전을 교체합니다. 적의 생명력·피해량이 30% 증가하고 더 많은 적이 등장합니다.</p><button class="primary-button" data-action="hard-confirm"><span>심층 구역 출격</span><span>↗</span></button>`,showBase);}else beginRun(1);}
  else if(a==='hard-confirm')beginRun(1);
});
$('modal').addEventListener('input',e=>{const id=e.target.id;if(id==='volume-slider'){meta.settings.volume=Number(e.target.value)/100;sound.sync();}else if(id==='sound-toggle'){sound.unlock();meta.settings.sound=e.target.checked;updateSound();}else if(id==='shake-toggle')meta.settings.shake=e.target.checked;else if(id==='particles-toggle')meta.settings.particles=e.target.checked;else return;saveMeta();});
$('overlay').addEventListener('click',e=>{if(e.target===$('overlay')&&game.state==='menu')modalClose?.();});

const movementCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
window.addEventListener('keydown',e=>{
  if(e.code==='Tab'&&!$('overlay').classList.contains('hidden')){const items=[...$('modal').querySelectorAll('button:not(:disabled), input, [tabindex="0"]')];if(items.length){const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('modal'))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}
  if(e.code==='Escape'||e.code==='KeyP'){if(e.repeat)return;e.preventDefault();if(game.state==='playing')game.pause();else if(modalClose)modalClose();return;}
  if(game.state==='upgrade'){const n=Number(e.code.replace(/^(Digit|Numpad)/,''));if(n>=1&&n<=3&&!e.repeat){e.preventDefault();const choice=game.choiceSet[n-1];if(choice)game.choose(choice.id);}return;}
  if(game.state!=='playing')return;
  if(movementCodes.includes(e.code)){e.preventDefault();game.keys.add(e.code);}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)game.dash();}
  if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)game.pulse();}
  if(e.code==='KeyQ'){e.preventDefault();if(!e.repeat)game.activateOverdrive();}
});
window.addEventListener('keyup',e=>game.keys.delete(e.code));
function loseFocus(){game.keys.clear();game.touch={x:0,y:0};resetControls();if(game.state==='playing')game.pause();else if(game.state==='upgrade')saveRun();}
window.addEventListener('blur',loseFocus);
document.addEventListener('visibilitychange',()=>{if(document.hidden)loseFocus();});
window.addEventListener('pagehide',saveRun);
const reticle=$('aim-reticle');
const hideReticle=()=>{reticle.classList.add('hidden');document.body.classList.remove('pointer-aim');};
const resetMove=bindStick($('touch-zone'),$('stick-base'),$('stick-knob'),(x,y)=>{game.touch={x,y};},()=>game.state==='playing');
const resetAimStick=bindStick($('aim-zone'),$('aim-stick-base'),$('aim-stick-knob'),(x,y)=>{if(game.aimVector(x,y))hideReticle();},()=>game.state==='playing');
function resetControls(){resetMove();resetAimStick();hideReticle();}
window.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  if(game.state!=='playing'||e.target.closest?.('button,input,[role="dialog"]')){hideReticle();return;}
  game.aimScreen(e.clientX,e.clientY);reticle.style.left=e.clientX+'px';reticle.style.top=e.clientY+'px';reticle.classList.remove('hidden');document.body.classList.add('pointer-aim');
});
document.documentElement.addEventListener('pointerleave',hideReticle);

function resize(){game.resize(window.innerWidth,window.innerHeight,window.devicePixelRatio||1);if(game.aim?.mode==='pointer'){game.resetAim();hideReticle();}}
window.addEventListener('resize',resize);resize();menuRefresh();
let previous=0,accumulator=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;accumulator=0;return;}const delta=previous?Math.min(.1,(now-previous)/1000):0;previous=now;if(game.state==='playing'&&game.hitStop<=0){accumulator+=delta;let steps=0;while(accumulator>=1/60&&steps<6&&game.state==='playing'){game.update(1/60);accumulator-=1/60;steps++;}}else accumulator=0;game.render(delta);if(now-lastHud>90){updateHUD();lastHud=now;}if(game.state!=='menu'&&now-lastMini>240){game.drawMinimap($('minimap'));lastMini=now;}}
requestAnimationFrame(frame);
