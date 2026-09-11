export const EXTRA_CATS=[
{id:'spider',name:'스파이더냥',tag:'거미줄 · 감속',description:'끈끈한 거미줄로 적을 2초간 느리게 만들고 관통합니다.',hp:125,speed:215,damage:20,interval:.42,dash:3.4,armor:0,weapon:'실크 슈터',effect:'web',color:'#d5b5ff',unlock:'coin',cost:180},
{id:'frost',name:'눈꽃냥',tag:'얼음 조각 · 냉기',description:'세 갈래 얼음 조각으로 적을 늦춥니다. 번개와 함께 쓰면 파쇄!',hp:120,speed:205,damage:12,interval:.58,dash:3.5,armor:1,weapon:'눈꽃 산탄',effect:'ice',color:'#9ceaff',unlock:'coin',cost:240},
{id:'ninja',name:'닌자냥',tag:'표창 · 관통',description:'빠른 표창이 적 둘을 관통합니다. 낮은 체력 대신 빠른 발이 무기예요.',hp:100,speed:240,damage:21,interval:.38,dash:2.8,armor:0,weapon:'그림자 표창',effect:'pierce',color:'#ff9cae',unlock:'mission',mission:'kills',target:300,hint:'누적 300마리 격파'},
{id:'chef',name:'셰프냥',tag:'불꽃 팬 · 범위',description:'뜨거운 불꽃이 맞은 곳 주변을 태웁니다. 군집에 강해요.',hp:145,speed:190,damage:26,interval:.7,dash:3.8,armor:1,weapon:'불꽃 프라이팬',effect:'flame',color:'#ffae68',unlock:'gacha',weight:30},
{id:'nurse',name:'닥터냥',tag:'회복 주사 · 흡수',description:'적을 맞히면 2초마다 체력 2 회복. 천천히 오래 버티는 고양이예요.',hp:135,speed:205,damage:19,interval:.4,dash:3.5,armor:0,weapon:'회복 주사',effect:'heal',color:'#97f4cf',unlock:'mission',mission:'time',target:300,hint:'한 판 5분 생존'},
{id:'spark',name:'번개냥',tag:'전기 구슬 · 연쇄',description:'전기 구슬이 가까운 적 하나에게 튑니다. 냉기와 조합해 보세요.',hp:110,speed:225,damage:24,interval:.58,dash:3.2,armor:0,weapon:'찌릿 구슬',effect:'chain',color:'#ffed91',unlock:'gacha',weight:30},
{id:'wizard',name:'별빛냥',tag:'별 탄막 · 부채꼴',description:'다섯 개의 별을 펼쳐 발사합니다. 가까운 적에게 큰 피해를 줘요.',hp:110,speed:205,damage:10,interval:.7,dash:3.6,armor:0,weapon:'별가루 지팡이',effect:'stars',color:'#c6b6ff',unlock:'gacha',weight:25},
{id:'astro',name:'우주냥',tag:'중력탄 · 흡인',description:'느린 중력탄이 적을 끌어당기며 관통합니다. 군집을 한곳에 모으세요.',hp:150,speed:185,damage:28,interval:.68,dash:4,armor:2,weapon:'중력 발사기',effect:'gravity',color:'#b9d4ff',unlock:'gacha',weight:15},
{id:'moon',name:'월식냥',tag:'달빛 · 왕복',description:'초승달이 날아갔다 돌아오며 두 번 공격합니다.',hp:120,speed:220,damage:25,interval:.65,dash:3,armor:0,weapon:'초승달 부메랑',effect:'return',color:'#e6d5ff',unlock:'secret',mission:'wins',target:1,hint:'간식 창고 3개와 대왕 청소기를 정리하고 무사히 퇴근'}
];
export const STARTERS=['runner','engineer','warden'];
export const DRAW_COST=120, TICKET_COST=100;
export function collectionMeta(raw={}){return {owned:[...new Set([...STARTERS,...(Array.isArray(raw.owned)?raw.owned:[]).filter(id=>EXTRA_CATS.some(c=>c.id===id))])],tickets:Number.isFinite(raw.tickets)?Math.max(0,Math.floor(raw.tickets)):2,draws:Math.max(0,Math.floor(raw.draws||0)),pity:Math.max(0,Math.floor(raw.pity||0)),settled:Array.isArray(raw.settled)?raw.settled.slice(-100):[]};}
export function missionUnlocks(meta){const gained=[];for(const c of EXTRA_CATS){const value=c.mission==='kills'?meta.totalKills:c.mission==='time'?meta.bestTime:meta.wins;if(c.mission&&value>=c.target&&!meta.collection.owned.includes(c.id)){meta.collection.owned.push(c.id);gained.push(c);}}return gained;}
export function buyCat(meta,id){const c=EXTRA_CATS.find(c=>c.id===id);if(!c||c.unlock!=='coin'||meta.collection.owned.includes(id)||meta.credits<c.cost)return false;meta.credits-=c.cost;meta.collection.owned.push(id);return true;}
export function buyTicket(meta){if(meta.credits<TICKET_COST)return false;meta.credits-=TICKET_COST;meta.collection.tickets++;return true;}
export function drawCat(meta,random=Math.random){if(meta.credits<DRAW_COST)return null;const all=EXTRA_CATS.filter(c=>c.unlock==='gacha'),missing=all.filter(c=>!meta.collection.owned.includes(c.id));const guarantee=meta.collection.pity>=9&&missing.length>0,pool=guarantee?missing:all;const total=pool.reduce((s,c)=>s+c.weight,0);let roll=Math.max(0,Math.min(.999999,random()))*total;const cat=pool.find(c=>(roll-=c.weight)<0)||pool.at(-1);meta.credits-=DRAW_COST;meta.collection.draws++;const duplicate=meta.collection.owned.includes(cat.id);if(duplicate){meta.credits+=45;meta.collection.pity++;}else{meta.collection.owned.push(cat.id);meta.collection.pity=0;}return {cat,duplicate,guarantee};}
export const PASSIVES={
 runner:{name:'잔상 발자국',desc:'대시 시작 지점에 잠시 뒤 폭발하는 잔상 덫을 남깁니다.'},
 engineer:{name:'든든한 깃털',desc:'깃털 회오리 1레벨을 장착한 상태로 시작합니다.'},
 warden:{name:'세 번째는 버틴다',desc:'실제로 피해를 받는 매 3번째 공격의 피해가 50% 감소합니다.'},
 spider:{name:'거미줄 사냥꾼',desc:'느려진 적을 처치하면 대시의 남은 재사용 시간이 0.4초 줄어듭니다.'},
 frost:{name:'살얼음',desc:'냉기에 걸린 적에게 주는 피해가 15% 증가합니다.'},
 ninja:{name:'그림자 일격',desc:'대시 후 2초 안에 적중하는 첫 주 무기 공격의 피해가 60% 증가합니다.'},
 chef:{name:'따끈한 한입',desc:'불타는 적을 처치하면 체력 3을 회복합니다. 재사용 1.5초.'},
 nurse:{name:'야간 진료',desc:'4초 동안 피격되지 않으면 초당 체력 0.6을 추가로 회복합니다.'},
 spark:{name:'충전 발바닥',desc:'적 5마리를 처치할 때마다 냥펀치의 남은 재사용 시간이 1초 줄어듭니다.'},
 wizard:{name:'별빛 공부',desc:'간식 조각에서 얻는 경험치가 15% 증가합니다.'},
 astro:{name:'간식 중력',desc:'간식과 코인을 끌어당기는 수집 반경이 40% 넓어집니다.'},
 moon:{name:'아홉 번째 밤',desc:'첫 사망 시 부활권 없이 체력 35%로 자동 부활합니다. 한 판의 부활 기회 1회를 사용합니다.'}
};
