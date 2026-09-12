import {missionUnlocks,buyCat,buyTicket,drawCat,DRAW_COST,TICKET_COST,PASSIVES,ACTIVE_SKILLS} from './roster.js?v=cat15';
import {bindStick} from './aim.js?v=cat15';
import {SignalGame as Game} from './cat-game.js?v=cat15';
import {Sound} from './audio.js?v=cat15';
import {CLASSES,UPGRADES,EVOLUTIONS,BASE_UPGRADES,DURATION,WEAPONS,PROTOCOLS,createMeta,normalizeMeta,formatTime,xpRequired} from './data.js?v=cat15';

const $=id=>document.getElementById(id);
const STORAGE='night-shift-cats-v1',RUN_STORAGE=STORAGE+'-run';
let storageOK=true;
function read(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null;}catch{return null;}}
function write(key,value){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));}catch{if(storageOK){storageOK=false;$('save-notice').classList.remove('hidden');setTimeout(()=>$('save-notice').classList.add('hidden'),6500);}}}
const meta=normalizeMeta(read(STORAGE));
missionUnlocks(meta);
let savedRun=read(RUN_STORAGE),selectedClass=meta.collection.owned.includes(read(STORAGE+'-selected'))?read(STORAGE+'-selected'):'runner',modalClose=null,toastTimer=null,lastDock='',lastObjective='',lastHud=0,lastMini=0,menuModal='',result=null,priorFocus=null;
const sound=new Sound(meta.settings);
const game=new Game($('world'),{
  start:()=>{sound.setMode('playing');resetControls();$('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('pause-btn').classList.remove('hidden');document.body.classList.add('playing');hideModal();lastDock='';lastObjective='';updateHUD(true);},
  pause:()=>{sound.setMode('paused');resetControls();saveRun();showPause();},
  resume:()=>{sound.setMode('playing');hideModal();lastDock='';updateHUD(true);},
  upgrade:choices=>showUpgrade(choices),
  toast:(message,warning,duration)=>{clearTimeout(toastTimer);$('toast').textContent=message;$('toast').className='toast'+(warning?' warning':'');toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration*1000);},
  save:()=>saveRun(),
  downed:()=>showRevive(),
  finish:data=>finishRun(data)
},sound,meta.settings);

function saveMeta(){write(STORAGE,meta);}
function saveRun(){const data=game.serialize();if(data){savedRun=data;write(RUN_STORAGE,data);}}
function hideModal(){const wasVisible=!$('overlay').classList.contains('hidden');$('overlay').classList.add('hidden');modalClose=null;menuModal='';if(wasVisible&&priorFocus?.isConnected&&game.state==='menu')priorFocus.focus();}
function openModal(html,onClose=null){priorFocus=document.activeElement;$('modal').innerHTML=html;$('overlay').classList.remove('hidden');modalClose=onClose;requestAnimationFrame(()=>$('modal').focus());}
const closeButton='<button class="modal-close" data-action="close" aria-label="닫기">×</button>';
function owned(id){return meta.collection.owned.includes(id);}
function showCollection(message=''){
 menuModal='collection';const gained=missionUnlocks(meta);if(gained.length)saveMeta();
 openModal(`${closeButton}<div class="eyebrow">고양이 도감 ${meta.collection.owned.length} / ${CLASSES.length}</div><h2 id="modal-title">야간조를 모아 보세요</h2><p class="modal-intro">간식 코인 ${meta.credits} · 부활권 ${meta.collection.tickets}장</p>${message?`<p class="collection-message" role="status">${message}</p>`:''}<div class="collection-actions"><button class="primary-button" data-action="draw-cat" ${meta.credits<DRAW_COST?'disabled':''}>코인 뽑기 · ${DRAW_COST}</button><button class="secondary-button" data-action="buy-ticket" ${meta.credits<TICKET_COST?'disabled':''}>부활권 1장 · ${TICKET_COST} 코인</button></div><p class="upgrade-note">셰프냥 30% · 번개냥 30% · 별빛냥 25% · 우주냥 15%<br>중복은 45코인 반환. 신규 없이 9회 뽑으면 다음은 미보유 고양이 확정 (${Math.min(9,meta.collection.pity)}/9). 확정 뽑기는 미보유 고양이의 기존 가중치 비율로 추첨합니다. 모두 모으면 확정 보장은 종료됩니다.</p><div class="collection-grid">${CLASSES.map(c=>{const has=owned(c.id),secret=c.unlock==='secret'&&!has;const label=has?'보유 중':c.unlock==='coin'?`${c.cost} 코인`:c.unlock==='gacha'?'코인 뽑기':c.unlock==='secret'?'시크릿 미션':c.hint;const progress=c.mission==='kills'?meta.totalKills:c.mission==='time'?meta.bestTime:meta.wins;return `<article class="collection-card ${has?'':'locked'}"><img src="./assets/cat-${c.id}.webp" alt="${has?c.name:'잠긴 고양이 실루엣'}"><h3>${secret?'???':c.name}</h3><p>${secret?'무사 퇴근 뒤 모습을 드러내요.':c.description}</p><p class="passive-note">${secret?'패시브도 해금 후 공개':'<b>E · '+ACTIVE_SKILLS[c.id].name+'</b><br>'+ACTIVE_SKILLS[c.id].desc+'<br><b>패시브 · '+PASSIVES[c.id].name+'</b><br>'+PASSIVES[c.id].desc}</p><small>${label}${c.mission&&!has?` · ${Math.min(progress,c.target)}/${c.target}${c.mission==='time'?'초':''}`:''}</small>${has?`<button data-select-cat="${c.id}" class="secondary-button">${selectedClass===c.id?'선택됨':'함께 출근'}</button>`:c.unlock==='coin'?`<button data-buy-cat="${c.id}" class="secondary-button" ${meta.credits<c.cost?'disabled':''}>코인으로 해금</button>`:''}</article>`;}).join('')}</div><p class="upgrade-note">코인과 수집 기록은 이 브라우저에 저장됩니다. 현금 결제는 없습니다. 부활권은 한 판에 1회, 체력 60%와 3초 무적으로 부활합니다.</p>`,hideModal);
}
let adPending=false;
function showRevive(){sound.setMode('paused');resetControls();saveRun();const adReady=typeof window.CatRewardedAds?.show==='function';openModal(`<div class="eyebrow">한 번 더 도전</div><h2 id="modal-title">다시 일어날까요?</h2><p class="modal-intro">체력 60% 회복 · 3초 무적 · 주변 적 밀어내기<br>한 판에 부활 1회</p><div class="modal-bottom"><button class="primary-button" data-action="revive-ticket" ${meta.collection.tickets<1?'disabled':''}>부활권 사용 (${meta.collection.tickets}장)</button>${adReady?'<button class="secondary-button" data-action="revive-ad">광고 보고 부활</button>':''}</div><p id="revive-message" class="upgrade-note" role="status">${adReady?'광고 시청 완료 후에만 부활합니다.':'부활권은 고양이 도감에서 코인으로 구매할 수 있어요.'}</p><button class="quiet-button" data-action="accept-death">이번 근무 마치기</button>`);}
async function rewardedRevive(){if(adPending||!game.awaitingRevive||typeof window.CatRewardedAds?.show!=='function')return;adPending=true;document.querySelectorAll('[data-action^="revive"],[data-action="accept-death"]').forEach(b=>b.disabled=true);try{const reward=await window.CatRewardedAds.show({placement:'revive',runId:game.runId});if(reward?.completed===true&&game.awaitingRevive)game.revive();else{$('revive-message').textContent='시청이 완료되지 않았습니다. 부활권을 사용하거나 다시 시도할 수 있어요.';}}catch{$('revive-message').textContent='광고를 불러오지 못했습니다. 부활권은 차감되지 않았어요.';}finally{adPending=false;if(game.awaitingRevive){document.querySelector('[data-action="revive-ad"]').disabled=false;document.querySelector('[data-action="accept-death"]').disabled=false;document.querySelector('[data-action="revive-ticket"]').disabled=meta.collection.tickets<1;}}}

function menuRefresh(){
  if(game.state==='menu')game.classId=selectedClass;
  $('class-picker').innerHTML=CLASSES.filter(c=>owned(c.id)).map(c=>`<button class="class-card ${c.id===selectedClass?'selected':''}" data-class="${c.id}" aria-pressed="${c.id===selectedClass}"><span class="cat-portrait cat-${c.id}" aria-hidden="true"></span><strong>${c.name}</strong><span class="cat-role">${c.tag}</span><span class="selection-mark" aria-hidden="true">${c.id===selectedClass?"✓":""}</span></button>`).join('');
  const partner=CLASSES.find(c=>c.id===selectedClass);
  $('class-description').textContent=partner.description+' · '+PASSIVES[partner.id].name+': '+PASSIVES[partner.id].desc;
  $('lobby-cat').src='./assets/cat-'+partner.id+'.webp';$('lobby-cat').alt=partner.name;
  $('lobby-name').textContent=partner.name;$('lobby-weapon').textContent=partner.tag;
  $('owned-count').textContent='보유 '+meta.collection.owned.length+' / '+CLASSES.length;
  $('ticket-badge').textContent=meta.collection.tickets;
  $('credits-badge').textContent=meta.credits.toLocaleString();
  $('continue-btn').classList.toggle('hidden',!savedRun);
  $('best-summary').textContent=meta.runs?`최고 ${formatTime(meta.bestTime)} · 퇴근 성공 ${meta.wins}회`:'첫 야간 근무를 시작해 보세요.';
  updateSound();
}
function updateSound(){$('sound-btn').innerHTML=`${meta.settings.sound?'♫':'♪'} <span>${meta.settings.sound?'ON':'OFF'}</span>`;$('sound-btn').setAttribute('aria-label',meta.settings.sound?'소리 끄기':'소리 켜기');$('sound-btn').setAttribute('aria-pressed',String(meta.settings.sound));sound.sync();}
function beginRun(difficulty=0){if(!owned(selectedClass))return;sound.unlock();sound.play('click');savedRun=null;write(RUN_STORAGE,null);game.start(selectedClass,meta,difficulty);saveRun();}
function requestStart(){if(savedRun){menuModal='replace';openModal(`${closeButton}<div class="eyebrow">새 야간 근무</div><h2 id="modal-title">새 근무를 시작할까요?</h2><p class="modal-intro">저장된 ${formatTime(savedRun.t||0)} 근무이 있습니다. 새 근무을 시작하면 진행 중인 근무은 교체됩니다. 아지트 강화와 완료한 근무 일지은 유지됩니다.</p><div class="modal-bottom"><button class="secondary-button" data-action="continue">이어서 하기</button><button class="primary-button" data-action="new-confirm"><span>새 근무 시작</span><span>↗</span></button></div>`,()=>hideModal());}else beginRun();}
function continueRun(){sound.unlock();if(!game.restore(savedRun)){savedRun=null;write(RUN_STORAGE,null);menuRefresh();openModal(`${closeButton}<div class="eyebrow">근무 기록 확인</div><h2 id="modal-title">근무 일지을 읽을 수 없습니다.</h2><p class="modal-intro">아지트 강화와 완료한 기록은 유지됩니다. 새 근무으로 다시 출근하세요.</p><button class="primary-button" data-action="new-confirm"><span>새 근무 시작</span><span>↗</span></button>`,hideModal);}}
function toMenu(){sound.setMode('menu');resetControls();hideModal();game.state='menu';game.resetDemo();$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('pause-btn').classList.add('hidden');document.body.classList.remove('playing');clearTimeout(toastTimer);$('toast').classList.add('hidden');menuRefresh();}
function skillColor(u){const key=u.weapon||u.id;return {orbit:'#478676',arc:'#3766a9',rocket:'#ca683b',field:'#41839e',rail:'#9c7234',mine:'#9566aa'}[key]||'#d0dcb0';}
function showUpgrade(choices){sound.setMode('paused');
  resetControls();
  const proto=choices[0]?.protocol,evo=choices.some(c=>c.evolution),owned=WEAPONS.filter(id=>game.u[id]).length;
  openModal(`<div class="eyebrow">${proto?'간식 취향':evo?'특별한 간식':'간식 봉지 도착'} / LV. ${String(game.level).padStart(2,'0')}</div><h2 id="modal-title">${proto?'오늘의 간식 취향은?':evo?'특별한 간식 조합 완성!':'간식 봉지에서 하나 골라요!'}</h2><p class="modal-intro">${proto?'강점과 약점이 함께 적용됩니다. 한 근무에 한 번 선택합니다.':`보조 무기 ${owned} / ${game.weaponSlots} 슬롯 · ${owned>=game.weaponSlots?'장착 무기와 지원 기술을 강화하세요.':'선택한 무기로 이번 근무의 조합을 만드세요.'}`}</p><div class="choice-grid">${choices.map((u,i)=>`<button class="upgrade-card ${u.evolution?'evolution':''} ${u.protocol?'protocol-card':''}" data-upgrade="${u.id}" style="--skill-color:${skillColor(u)}"><span class="rarity">${u.evolution?'EVOLUTION':u.type}<span>0${i+1}</span></span><span class="big-icon">${u.icon}</span><strong>${u.name}</strong><p>${u.desc}</p><span class="upgrade-bottom"><span>${u.protocol?'간식 취향 · 근무 내 유지':u.evolution?'최종 진화':u.max?`${u.level===0?'NEW':'LV. '+u.level} → LV. ${u.level+1}`:'즉시 적용'}</span><span>[${i+1}]</span></span></button>`).join('')}</div>${proto?'':`<div class="modal-bottom"><button class="secondary-button" data-action="reroll" ${game.rerolls<=0?'disabled':''}>선택지 다시 받기 (${game.rerolls}/2)</button></div>`}<p class="upgrade-note">${proto?'생명력·이동·공격 방식에 직접 영향을 주는 선택입니다.':game.pendingLevels>1?`${game.pendingLevels}회 선택할 수 있습니다.`:'무기 5 + 연계 강화 2 → 진화 · 아이스팩 + 번개 → 파쇄'}</p>`);
}
function showPause(){
  openModal(`${closeButton}<div class="eyebrow">잠깐 쉬는 시간</div><h2 id="modal-title">잠시 숨을 고르세요.</h2><div class="pause-grid"><div class="pause-stat"><b>${formatTime(game.t)}</b><span>생존 시간</span></div><div class="pause-stat"><b>${game.kills.toLocaleString()}</b><span>격파</span></div><div class="pause-stat"><b>${game.level}</b><span>레벨</span></div></div><p class="guide-tip"><strong>E · ${ACTIVE_SKILLS[game.classId].name}</strong><br>${ACTIVE_SKILLS[game.classId].desc}<br><br><strong>패시브 · ${PASSIVES[game.classId].name}</strong><br>${PASSIVES[game.classId].desc}</p><div class="run-loadout">${EVOLUTIONS.filter(e=>game.evolved[e.id]).map(e=>`<span>${e.icon} ${e.name}</span>`).join('')}${Object.entries(game.u).map(([id,n])=>{const u=UPGRADES.find(u=>u.id===id);return u?`<span>${u.icon} ${u.name} ${n}</span>`:'';}).join('')||'<span>간식 조각을 모아 무기를 강화하세요.</span>'}</div><div class="settings-row"><label for="sound-toggle">게임 사운드</label><input id="sound-toggle" type="checkbox" ${meta.settings.sound?'checked':''}></div><div class="settings-row"><label for="volume-slider">음량</label><input id="volume-slider" type="range" min="0" max="100" value="${Math.round(meta.settings.volume*100)}"></div><div class="settings-row"><label for="music-volume">배경음악</label><input id="music-volume" type="range" min="0" max="100" value="${Math.round(meta.settings.musicVolume*100)}"></div><div class="settings-row"><label for="effects-volume">효과음</label><input id="effects-volume" type="range" min="0" max="100" value="${Math.round(meta.settings.effectsVolume*100)}"></div><div class="settings-row"><label for="shake-toggle">화면 흔들림</label><input id="shake-toggle" type="checkbox" ${meta.settings.shake?'checked':''}></div><div class="settings-row"><label for="particles-toggle">파티클 효과</label><input id="particles-toggle" type="checkbox" ${meta.settings.particles?'checked':''}></div><div class="modal-bottom"><button class="primary-button" data-action="resume"><span>근무 계속</span><span>↗</span></button><button class="secondary-button" data-action="guide-pause">집사 안내</button></div><button class="quiet-button" data-action="save-menu">저장하고 메뉴로</button>`,()=>game.resume());
}
function showGuide(fromPause=false){
  menuModal=fromPause?'guide-pause':'guide';
  openModal(`${closeButton}<div class="eyebrow">초보 집사 안내</div><h2 id="modal-title">처음 출근한 집사님께.</h2><p class="modal-intro">한 판 약 15~20분. 이동하며 적을 피하고, 마우스로 조준하고 자동 연사로 길을 여세요.</p><div class="guide-grid"><div><h3>조작 방법</h3><table class="controls-table"><tr><td>이동</td><td><kbd>WASD</kbd> / <kbd>방향키</kbd></td></tr><tr><td>조준 방향</td><td>마우스 이동 · 클릭 불필요</td></tr><tr><td>자동 연사</td><td>적이 없어도 계속 발사</td></tr><tr><td>무적 대시</td><td><kbd>SPACE</kbd></td></tr><tr><td>전용 스킬</td><td><kbd>E</kbd></td></tr><tr><td>우다다 · 신남 100%</td><td><kbd>Q</kbd></td></tr><tr><td>일시정지</td><td><kbd>ESC</kbd> / <kbd>P</kbd></td></tr><tr><td>강화 선택</td><td><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></td></tr></table><p style="margin-top:14px">모바일: 왼쪽 스틱으로 이동, 오른쪽 스틱으로 조준합니다. 손을 떼어도 마지막 방향으로 계속 발사합니다. 아래 버튼으로 대시·전용 스킬·우다다를 사용하세요.</p></div><div><h3>돌아오는 방법</h3><p>01. 파편을 모아 성장하세요. 보조 무기는 최대 3개, 8레벨에는 장단점을 가진 간식 취향를 선택합니다.</p><p>02. 1·4·7분에 발견되는 간식 창고 원 안에서 10초 머무르면 열립니다. 밖으로 나가도 열기 진행도는 유지됩니다.</p><p>03. 5·10분에 청소로봇, 14분에 대왕 청소기가 등장합니다. 붉은 원과 사격선은 공격 예고입니다. 보스의 배터리가 열렸을 때 집중 공격하세요.</p><p>04. 간식 창고 3개 열기 + 대왕 청소기 처치 후, 15분부터 중앙 퇴근 지점에서 5초간 생존하세요.</p></div></div><div class="guide-tip"><strong>무기 진화 · 총 12종</strong><br>${EVOLUTIONS.filter(e=>e.requires).map(e=>e.name+" · "+e.desc).join("<br>")}<br><br><strong>첫 진화 조합</strong><br>깃털 회오리 5 + 폭신한 발바닥 2 → 깃털 대잔치<br>털실 번개 5 + 간식 급식기 2 → 털실 파티<br>참치캔 폭탄 5 + 진한 츄르 2 → 참치캔 소나기<br>시원한 아이스팩 5 + 간식 바구니 2 → 꽁꽁 아이스박스<br>레이저 장난감 5 + 냥냥 관찰력 2 → 레이저 댄스<br>캣닢 덫 5 + 힘찬 전용 스킬 2 → 캣닢 블랙홀<br><br><strong>조준하는 법</strong><br>주 무기와 레이저 장난감는 조준 방향으로 발사됩니다. 참치캔과 첫 번개는 조준 방향에 있는 적을 노립니다. 깃털과 시원한 아이스팩은 주변을 방어합니다.<br><br><strong>전투를 이어가는 법</strong><br>연속 처치와 위험 직전의 대시로 신남을 채우세요. 사뿐 회피는 생명력도 3 회복합니다. 100%에서 Q를 누르면 7초간 피해·연사 +35%, 받는 피해 +30%의 우다다가 시작됩니다.<br>시원한 아이스팩에 느려진 적을 번개로 공격하면 주변에 파쇄 피해를 줍니다. 참치캔은 화상을, 캣닢 덫의 진화는 흡인 영역을 남깁니다.<br>장난감 보호막은 보라색 장난감를 먼저 잡거나 레이저 장난감로 관통하세요. 전용 스킬은 고양이마다 작동 방식이 다릅니다. 일시정지 화면에서 설명을 확인하세요.<br>수축 파동은 초록 틈으로 빠져나오거나 타이밍에 맞춰 대시하세요.</div><p class="upgrade-note">진행 상황은 20초마다 현재 브라우저에 저장됩니다. 우리 아지트와 기록도 같은 브라우저에 보관됩니다.</p><div class="modal-bottom"><button class="primary-button" data-action="${fromPause?'back-pause':'close'}"><span>${fromPause?'근무 화면으로':'확인했습니다'}</span><span>↗</span></button></div>`,fromPause?showPause:hideModal);
}
function showBase(){
  menuModal='base';openModal(`${closeButton}<div class="eyebrow">아지트 살림</div><h2 id="modal-title">우리 아지트를 더 포근하게.</h2><p class="modal-intro">보유 간식 코인 <strong style="color:var(--accent)">${meta.credits.toLocaleString()}</strong> · 강화는 이후 모든 근무에 적용됩니다.</p><div class="base-grid">${BASE_UPGRADES.map(u=>{const n=meta.base[u.id]||0,cost=u.cost*(n+1);return `<article class="base-card"><div class="base-card-head"><h3>${u.icon} ${u.name}</h3><span>${n} / ${u.max}</span></div><p>${u.desc}</p><button data-base="${u.id}" ${n>=u.max||meta.credits<cost?'disabled':''}>${n>=u.max?'최대 강화 완료':`${cost} 간식 코인으로 강화`}</button></article>`;}).join('')}</div><p class="guide-tip">쓰러져도 회수한 간식 코인은 남습니다. 생존 시간, 적 처치, 간식 창고 열기와 간식 봉지로 간식 코인을 모으세요.</p>${meta.wins?`<div class="modal-bottom"><button class="secondary-button" data-action="hard-start">주말 야간조 도전 ↗ · 더 강하고 많은 적</button></div>`:''}<div class="modal-bottom"><button class="primary-button" data-action="close"><span>아지트에서 나가기</span><span>↗</span></button></div>`,hideModal);
}
function showRecords(){menuModal='records';openModal(`${closeButton}<div class="eyebrow">근무 일지</div><h2 id="modal-title">우리의 야간 근무 일지</h2><div class="pause-grid"><div class="pause-stat"><b>${meta.runs}</b><span>완료한 근무</span></div><div class="pause-stat"><b>${meta.wins}</b><span>퇴근 성공</span></div><div class="pause-stat"><b>${meta.totalKills.toLocaleString()}</b><span>누적 격파</span></div></div><div class="record-list">${meta.history.length?meta.history.map(r=>`<div class="record-row"><b>${r.won?'퇴근 성공':'조기 퇴근'}</b><span>${CLASSES.find(c=>c.id===r.classId)?.name||'치즈'}</span><span>${formatTime(r.time)}</span><span>${r.kills.toLocaleString()} 격파</span></div>`).join(''):'<p class="modal-intro">아직 남겨진 기록이 없습니다.<br>첫 번째 간식를 보내세요.</p>'}</div><p class="upgrade-note">최근 10개 근무 · 현재 브라우저에 저장</p>`,hideModal);}
function finishRun(data){sound.setMode('ended');
  resetControls();
  if(meta.collection.settled.includes(data.runId))return;meta.collection.settled.push(data.runId);meta.collection.settled=meta.collection.settled.slice(-100);
  result=data;meta.runs++;meta.wins+=data.won?1:0;meta.credits+=data.credits;meta.bestTime=Math.max(meta.bestTime,Math.floor(data.time));meta.bestKills=Math.max(meta.bestKills,data.kills);meta.totalKills+=data.kills;meta.history.unshift({classId:data.classId,time:Math.floor(data.time),kills:data.kills,won:data.won});meta.history=meta.history.slice(0,10);savedRun=null;write(RUN_STORAGE,null);const unlocked=missionUnlocks(meta);if(data.won)meta.collection.tickets++;saveMeta();updateHUD(true);
  openModal(`<div class="eyebrow">${data.won?'퇴근 성공':'수고했어, 오늘도'}</div><h2 id="modal-title" class="display-heading">${data.won?'오늘도<br>무사 퇴근!':'오늘은<br><span style="color:var(--accent)">조기 퇴근!</span>'}</h2><p class="result-label">${data.won?'간식도 챙기고, 무사히 퇴근했어요!':'오늘은 여기까지. 아지트에서 쉬었다 다시 와요.'}</p><div class="pause-grid"><div class="pause-stat"><b>${formatTime(data.time)}</b><span>생존 시간</span></div><div class="pause-stat"><b>${data.kills.toLocaleString()}</b><span>격파</span></div><div class="pause-stat"><b>LV. ${data.level}</b><span>도달 레벨</span></div></div>${unlocked.length?`<p class="unlock-message">새 고양이 해금: ${unlocked.map(c=>c.name).join(", ")}</p>`:""}${data.won?'<p class="unlock-message">무사 퇴근 보상 · 부활권 +1</p>':''}<div class="result-credit"><span>회수한 간식 코인 · 우리 아지트에 사용</span><strong>+${data.credits.toLocaleString()}</strong></div><p class="upgrade-note">최대 ${data.bestCombo||0} 연속 처치 · 사뿐 회피 ${data.perfectDodges||0}회 · 우다다 ${data.overdriveCount||0}회</p><p class="upgrade-note">간식 창고 ${data.relays}/3 · 청소로봇 ${data.bossKills}기 격파 · 보유 간식 코인 ${meta.credits.toLocaleString()}</p>${data.won&&meta.wins===1?'<p class="unlock-message">주말 야간조이 열렸습니다. 우리 아지트에서 더 어려운 근무에 도전할 수 있습니다.</p>':''}<div class="modal-bottom"><button class="primary-button" data-action="retry"><span>한 번 더 출근하기</span><span>↗</span></button><button class="secondary-button" data-action="result-base">우리 아지트</button></div><button class="quiet-button" data-action="menu">메뉴로 돌아가기</button>`);
}

function updateHUD(force=false){
  if(game.state==='menu')return;const p=game.player;
  $('operator-name').textContent=game.classData.name;$('level-label').textContent='LV. '+String(game.level).padStart(2,'0');$('health-fill').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';$('hp-number').textContent=Math.ceil(p.hp)+' / '+p.maxHp;$('xp-fill').style.width=Math.min(100,game.xp/xpRequired(game.level)*100)+'%';$('timer').textContent=formatTime(game.t);$('kills').textContent=String(game.kills).padStart(4,'0');$('relays').textContent=game.relays.filter(r=>r.active).length+' / 3';
  $('phase-label').textContent=game.t>=900?'퇴근 근무':game.t>=840?'대왕 청소기':game.t>=600?'마지막 간식 탐색':game.t>=300?'주말 야간조':'간식 탐색';
  $('pulse-btn').querySelector('span').textContent=ACTIVE_SKILLS[game.classId].name;$('pulse-btn').title=ACTIVE_SKILLS[game.classId].desc;$('dash-status').textContent=p.dashCd>0?p.dashCd.toFixed(1)+'s':'준비 완료';$('pulse-status').textContent=p.pulseCd>0?Math.ceil(p.pulseCd)+'s':'준비 완료';$('dash-fill').style.width=(1-p.dashCd/game.stats.dashCd)*100+'%';$('pulse-fill').style.width=(1-p.pulseCd/game.stats.pulseCd)*100+'%';$('dash-btn').setAttribute('aria-disabled',String(p.dashCd>0));$('pulse-btn').setAttribute('aria-disabled',String(p.pulseCd>0));
  const hot=game.overdrive>0,ready=game.resonance>=100;
  $('overdrive-status').textContent=hot?game.overdrive.toFixed(1)+'s':ready?'준비 완료':Math.floor(game.resonance)+'%';
  $('overdrive-fill').style.width=(hot?game.overdrive/7*100:game.resonance)+'%';
  $('overdrive-btn').classList.toggle('charged',ready||hot);
  $('overdrive-btn').setAttribute('aria-disabled',String(!ready||hot));
  $('resonance-fill').style.width=(hot?game.overdrive/7*100:game.resonance)+'%';
  $('combo-label').textContent=game.combo>=5?game.combo+' 콤보 · 신남 '+Math.floor(game.resonance)+'%':'신남 '+Math.floor(game.resonance)+'%';
  $('protocol-label').textContent=game.protocol?PROTOCOLS.find(p=>p.id===game.protocol)?.name||'야간 간식반':'야간 간식반';
  const interference=game.t<game.interferenceUntil;
  $('interference-label').textContent=interference?game.interferenceName:'다음 소동';
  $('interference-countdown').textContent=formatTime(Math.max(0,(interference?game.interferenceUntil:game.nextInterference)-game.t));
  document.querySelector('.signal-hud').classList.toggle('danger',interference);
  const active=game.relays.filter(r=>!r.active&&game.t>=r.unlock).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];const next=game.relays.filter(r=>!r.active&&game.t<r.unlock)[0];let objective='';
  if(active)objective=`<b>간식 창고 0${active.id+1} 열기</b><small>주황색 방향 표시를 따라가세요</small>`;
  else if(next)objective=`<b>다음 간식 창고 ${formatTime(next.unlock)}</b><small>간식 조각을 모아 강화하세요</small>`;
  else if(!game.finalDead)objective='<b>간식 회수 완료</b><small>14:00 대왕 청소기 처치</small>';
  else if(game.t<DURATION)objective='<b>퇴근 준비 완료</b><small>15:00까지 생존 · 중앙으로 이동</small>';
  else objective='<b>중앙에서 5초간 생존</b><small>파란색 퇴근 표시를 따라가세요</small>';
  if(force||objective!==lastObjective){$('objective').innerHTML=objective;lastObjective=objective;}
  const boss=game.enemies.filter(e=>e.boss&&!e.dead).sort((a,b)=>(b.type==='final')-(a.type==='final'))[0];$('boss-hud').classList.toggle('hidden',!boss);if(boss){$('boss-name').textContent=boss.type==='final'?'대왕 청소기 · 대왕 청소기':boss.tier===1?'청소반장 · 청소로봇':'점보 청소기 · 점보 청소기';$('boss-health').textContent=Math.ceil(boss.hp/boss.maxHp*100)+'%';$('boss-fill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';}
  const charging=game.charging,evac=game.t>=900&&game.finalDead&&game.relays.every(r=>r.active)&&game.evacuating>0;
  $('relay-progress').classList.toggle('hidden',!charging&&!evac);if(charging||evac){$('relay-progress').querySelector('span').textContent=charging?'회수 '+Math.ceil(10-charging.charge)+'초':'퇴근 '+Math.ceil(5-game.evacuating)+'초';$('relay-fill').style.width=(charging?charging.charge/10:game.evacuating/5)*100+'%';}
  const dock=JSON.stringify([game.u,game.evolved,game.protocol]);if(force||dock!==lastDock){lastDock=dock;const weapons=UPGRADES.filter(u=>WEAPONS.includes(u.id)&&game.u[u.id]);$('weapon-dock').innerHTML=`<div class="weapon-chip" title="${game.classData.weapon||(game.classId==='warden'?'팝콘총':'츄르총')} · 마우스 조준 / 자동 연사"><span class="weapon-icon">⌁</span><small>기본</small></div>`+weapons.map(u=>{const evolved=[...EVOLUTIONS].reverse().find(e=>e.weapon===u.id&&game.evolved[e.id]);return `<div class="weapon-chip" style="--skill-color:${skillColor(u)}" title="${evolved?evolved.name:u.name}"><span class="weapon-icon" ${evolved?'style="color:var(--accent)"':''}>${evolved?evolved.icon:u.icon}</span><small>${evolved?'진화':'LV.'+game.u[u.id]}</small></div>`;}).join('')+Array.from({length:Math.max(0,game.weaponSlots-weapons.length)},()=>'<div class="weapon-chip empty"><span class="weapon-icon">＋</span><small>빈자리</small></div>').join('');}
}

$('class-picker').addEventListener('click',e=>{const c=e.target.closest('[data-class]');if(c){selectedClass=c.dataset.class;write(STORAGE+'-selected',selectedClass);sound.play('click');menuRefresh();}});
$('lobby-home').addEventListener('click',()=>{hideModal();menuRefresh();});
$('start-btn').addEventListener('click',requestStart);
$('continue-btn').addEventListener('click',continueRun);
$('collection-btn').addEventListener('click',()=>showCollection());
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
$('home-mark').addEventListener('click',()=>{if(game.state==='menu')hideModal();else if(game.state==='playing')game.pause();});
$('sound-btn').addEventListener('click',()=>{sound.unlock();meta.settings.sound=!meta.settings.sound;updateSound();saveMeta();sound.play('click');});
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();}catch{game.toast('이 브라우저에서는 전체 화면을 사용할 수 없습니다.',false,3);}});
if(!document.documentElement.requestFullscreen)$('fullscreen-btn').classList.add('hidden');
$('modal').addEventListener('click',e=>{
  const select=e.target.closest('[data-select-cat]');if(select&&owned(select.dataset.selectCat)){selectedClass=select.dataset.selectCat;write(STORAGE+'-selected',selectedClass);hideModal();menuRefresh();return;}
  const purchase=e.target.closest('[data-buy-cat]');if(purchase&&!purchase.disabled){if(buyCat(meta,purchase.dataset.buyCat)){saveMeta();menuRefresh();showCollection('새 고양이가 합류했어요!');}return;}
  const upgrade=e.target.closest('[data-upgrade]');if(upgrade){game.choose(upgrade.dataset.upgrade);return;}
  const base=e.target.closest('[data-base]');if(base&&!base.disabled){const u=BASE_UPGRADES.find(u=>u.id===base.dataset.base);const n=meta.base[u.id]||0,cost=u.cost*(n+1);if(n<u.max&&meta.credits>=cost){meta.credits-=cost;meta.base[u.id]=n+1;saveMeta();sound.play('level');menuRefresh();showBase();}return;}
  const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const a=button.dataset.action;
  if(a==='draw-cat'){const r=drawCat(meta);if(r){saveMeta();menuRefresh();showCollection(r.duplicate?r.cat.name+' 중복 · 45코인 반환':r.cat.name+' 합류!');}return;}
  if(a==='buy-ticket'){if(buyTicket(meta)){saveMeta();menuRefresh();showCollection('부활권 1장을 받았어요.');}return;}
  if(a==='revive-ticket'){if(!adPending&&game.awaitingRevive&&meta.collection.tickets>0){meta.collection.tickets--;saveMeta();game.revive();}return;}
  if(a==='revive-ad'){rewardedRevive();return;}
  if(a==='accept-death'){if(!adPending)game.declineRevive();return;}
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
  else if(a==='hard-start'){if(savedRun){openModal(`${closeButton}<div class="eyebrow">주말 야간조</div><h2 id="modal-title">주말 야간조으로 출근할까요?</h2><p class="modal-intro">진행 중인 저장 근무을 교체합니다. 적의 생명력·피해량이 30% 증가하고 더 많은 적이 등장합니다.</p><button class="primary-button" data-action="hard-confirm"><span>주말 야간조 출근</span><span>↗</span></button>`,showBase);}else beginRun(1);}
  else if(a==='hard-confirm')beginRun(1);
});
$('modal').addEventListener('input',e=>{const id=e.target.id;if(id==='volume-slider'){meta.settings.volume=Number(e.target.value)/100;sound.sync();}else if(id==='music-volume'||id==='effects-volume'){meta.settings[id==='music-volume'?'musicVolume':'effectsVolume']=Number(e.target.value)/100;sound.sync();}else if(id==='sound-toggle'){sound.unlock();meta.settings.sound=e.target.checked;updateSound();}else if(id==='shake-toggle')meta.settings.shake=e.target.checked;else if(id==='particles-toggle')meta.settings.particles=e.target.checked;else return;saveMeta();});
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
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;accumulator=0;return;}const delta=previous?Math.min(.1,(now-previous)/1000):0;previous=now;if(game.state==='playing'&&game.hitStop<=0){accumulator+=delta;let steps=0;while(accumulator>=1/60&&steps<6&&game.state==='playing'){game.update(1/60);accumulator-=1/60;steps++;}}else accumulator=0;sound.setMode(game.state==='playing'?'playing':game.state);game.render(delta);if(now-lastHud>90){updateHUD();lastHud=now;}if(game.state!=='menu'&&now-lastMini>240){game.drawMinimap($('minimap'));lastMini=now;}}
requestAnimationFrame(frame);
