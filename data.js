import {normalizeLook,DEFAULT_LOOK} from './cosmetics.js?v=cat24';
import {EXTRA_CATS,collectionMeta} from './roster.js?v=cat24';
export const VERSION = 1;
export const EDITION = 2;
export const DURATION = 900;
export const WORLD = 1550;
export const CLASSES = [
  {id:'runner',name:'치즈',en:'CHEESE',icon:'🐱',tag:'빠른 발 · 츄르총',description:'치즈는 간식 앞에선 누구보다 빨라요. 빠른 이동과 짧은 대시로 로봇 사이를 쏙쏙!',hp:115,speed:225,damage:23,interval:.34,dash:3.0,armor:0},
  {id:'engineer',name:'모찌',en:'MOCHI',icon:'🐈',tag:'깃털 · 주변 방어',description:'느긋해 보여도 준비는 철저해요. 처음부터 깃털 장난감이 주변을 지켜줘요.',hp:135,speed:195,damage:22,interval:.42,dash:3.8,armor:0},
  {id:'warden',name:'후추',en:'PEPPER',icon:'🐈‍⬛',tag:'튼튼함 · 초보 추천',description:'처음 출근한다면 후추와 함께! 높은 체력과 세 갈래 팝콘총으로 든든하게 시작해요.',hp:160,speed:185,damage:16,interval:.64,dash:4.1,armor:2}
];
CLASSES.push(...EXTRA_CATS);
export const UPGRADES = [
  {id:'power',name:'진한 츄르',icon:'🍯',max:5,desc:'모든 무기 피해량 +18%',type:'출력'},
  {id:'haste',name:'간식 급식기',icon:'🍽️',max:5,desc:'모든 무기 공격 속도 +15%',type:'발사'},
  {id:'multi',name:'두 배 간식',icon:'🍿',max:3,desc:'주 무기 투사체 +1',type:'주 무기'},
  {id:'pierce',name:'바삭한 막대과자',icon:'🥨',max:3,desc:'주 무기 관통 +1 · 사거리 +10%',type:'주 무기'},
  {id:'orbit',name:'깃털 회오리',icon:'🪶',max:5,desc:'주위를 도는 깃털 추가 · 접촉 피해 강화',type:'궤도 무기'},
  {id:'arc',name:'털실 번개',icon:'🧶',max:5,desc:'적 사이를 연결하는 연쇄 번개',type:'전기 무기'},
  {id:'rocket',name:'참치캔 폭탄',icon:'🥫',max:5,desc:'군집을 추적하는 폭발 참치캔',type:'폭발 무기'},
  {id:'field',name:'시원한 아이스팩',icon:'🧊',max:5,desc:'주변 적을 감속 · 지속 피해',type:'영역 무기'},
  {id:'vitality',name:'든든한 도시락',icon:'🍱',max:5,desc:'최대 생명력 +25 · 생명력 25 회복',type:'생존'},
  {id:'speed',name:'폭신한 발바닥',icon:'🐾',max:4,desc:'이동 속도 +8% · 대시 재사용 −8%',type:'기동'},
  {id:'magnet',name:'간식 바구니',icon:'🧺',max:4,desc:'수집 범위 +35% · 경험치 +10%',type:'성장'},
  {id:'regen',name:'따뜻한 우유',icon:'🥛',max:4,desc:'4초간 피격이 없으면 초당 생명력 0.22 회복',type:'회복'},
  {id:'armor',name:'두툼한 담요',icon:'🧣',max:4,desc:'받는 피해 −2 · 최대 생명력 +10',type:'방어'},
  {id:'crit',name:'냥냥 관찰력',icon:'👀',max:4,desc:'치명타 확률 +10% · 치명타 피해 +25%',type:'정밀'},
  {id:'pulse',name:'힘찬 전용 스킬',icon:'🥊',max:4,desc:'전용 스킬 범위 +20% · 재사용 −12%',type:'액티브'},
  {id:'rail',name:'레이저 장난감',icon:'🔦',max:5,desc:'충전 후 직선 관통 광선 · 장난감 보호막 무시',type:'정밀 무기'},
  {id:'mine',name:'캣닢 덫',icon:'🌿',max:5,desc:'이동 경로에 설치 · 접근한 적을 끌어당겨 폭발',type:'설치 무기'}
];
export const WEAPONS=['orbit','arc','rocket','field','rail','mine'];
export const PROTOCOLS=[
  {id:'glass',name:'매운맛 간식',icon:'🌶️',desc:'모든 피해 +30% / 최대 생명력 −20%',type:'간식 취향',protocol:true},
  {id:'capacitor',name:'짜릿한 간식',icon:'🍬',desc:'전용 스킬 재사용 −30% · 번개 피해 +20% / 주 무기 피해 −15%',type:'간식 취향',protocol:true},
  {id:'bastion',name:'든든한 간식',icon:'🍙',desc:'최대 생명력 +35 · 방어 +2 / 이동 속도 −12%',type:'간식 취향',protocol:true}
];
export const EVOLUTIONS = [
  {id:'nova',name:'깃털 대잔치',icon:'✺',weapon:'orbit',support:'speed',desc:'깃털이 거대한 이중 궤도로 회전하며 적을 분쇄합니다.'},
  {id:'storm',name:'털실 파티',icon:'ϟ',weapon:'arc',support:'haste',desc:'연쇄 대상과 피해가 증가하는 초고출력 번개.'},
  {id:'barrage',name:'참치캔 소나기',icon:'⋔',weapon:'rocket',support:'power',desc:'참치캔 폭탄이 세 갈래로 발사되며 폭발 범위가 증가합니다.'},
  {id:'absolute',name:'꽁꽁 아이스박스',icon:'❋',weapon:'field',support:'magnet',desc:'시원한 아이스팩 확장 · 동결된 적에게 번개가 맞으면 파쇄 피해.'},
  {id:'prism',name:'레이저 댄스',icon:'Ⅲ',weapon:'rail',support:'crit',desc:'레이저 장난감가 세 갈래로 분리되어 전방을 절단합니다.'},
  {id:'singularity',name:'캣닢 블랙홀',icon:'⊗',weapon:'mine',support:'pulse',desc:'캣닢 덫이 폭발한 자리에 적을 끌어당기는 특이점을 남깁니다.'},
  {id:'aegis',name:'깃털 수호천사',icon:'🪽',weapon:'orbit',support:'armor',requires:'nova',desc:'깃털 대잔치 + 담요 2. 주변 적 탄환을 0.35초마다 하나씩 막아냅니다.'},
  {id:'tesla',name:'털실 과충전',icon:'⚡',weapon:'arc',support:'crit',requires:'storm',desc:'털실 파티 + 관찰력 2. 4초마다 적에게 시한 전기를 심어 주변까지 폭발시킵니다.'},
  {id:'confetti',name:'참치캔 불꽃축제',icon:'🎇',weapon:'rocket',support:'pierce',requires:'barrage',desc:'참치캔 소나기 + 막대과자 2. 폭발한 캔이 관통 파편 8개로 갈라집니다.'},
  {id:'blizzard',name:'아이스 유성우',icon:'❄',weapon:'field',support:'haste',requires:'absolute',desc:'꽁꽁 아이스박스 + 급식기 2. 2.5초마다 사방으로 빙결 얼음창을 발사합니다.'},
  {id:'crossbeam',name:'레이저 십자별',icon:'✛',weapon:'rail',support:'power',requires:'prism',desc:'레이저 댄스 + 진한 츄르 2. 4초마다 적 위치에 십자 관통 레이저를 추가합니다.'},
  {id:'garden',name:'캣닢 정원',icon:'🌱',weapon:'mine',support:'magnet',requires:'singularity',desc:'캣닢 블랙홀 + 바구니 2. 5초마다 전방에 덫 3개를 추가 설치합니다.'}
];
export const BASE_UPGRADES = [
  {id:'hull',name:'푹신한 방석',icon:'🛏️',desc:'시작 생명력 +10 / 단계',max:5,cost:60},
  {id:'output',name:'튼튼한 장난감',icon:'🧸',desc:'모든 피해량 +4% / 단계',max:5,cost:75},
  {id:'learning',name:'간식 노트',icon:'📒',desc:'경험치 획득 +4% / 단계',max:5,cost:65},
  {id:'recovery',name:'우유 냉장고',icon:'🥛',desc:'간식 창고 열기 시 추가 회복 +6 / 단계',max:5,cost:50}
];
export const ENEMY_TYPES = {
  stalker:{hp:30,speed:85,r:13,damage:10,xp:4,color:'#d58270'},
  skitter:{hp:19,speed:147,r:9,damage:8,xp:4,color:'#e5ab78'},
  brute:{hp:155,speed:60,r:24,damage:23,xp:14,color:'#c06960'},
  spitter:{hp:62,speed:73,r:15,damage:13,xp:8,color:'#a099c9'},
  charger:{hp:76,speed:86,r:17,damage:19,xp:9,color:'#e47859'},
  splitter:{hp:100,speed:69,r:20,damage:14,xp:10,color:'#b9a280'},
  elite:{hp:740,speed:88,r:31,damage:22,xp:60,color:'#ffd3a0'},
  sentinel:{hp:7200,speed:53,r:54,damage:25,xp:180,color:'#fa8063'},
  final:{hp:27000,speed:62,r:68,damage:31,xp:250,color:'#ff936c'},
  sniper:{hp:110,speed:70,r:17,damage:24,xp:13,color:'#ff679b'},
  jammer:{hp:240,speed:65,r:24,damage:19,xp:20,color:'#ab8dff'},
  wraith:{hp:61,speed:128,r:12,damage:14,xp:7,color:'#ffb16c'}
};
export const RELAY_POSITIONS=[{x:-900,y:-620},{x:1000,y:-570},{x:240,y:1110}];
export function formatTime(n){n=Math.max(0,Math.floor(n));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
export function xpRequired(level){return Math.floor(18+level*6+Math.pow(level,1.65)*3);}
export function createMeta(){return {version:VERSION,cosmetics:{...DEFAULT_LOOK},credits:0,base:{},runs:0,wins:0,bestTime:0,bestKills:0,totalKills:0,history:[],collection:collectionMeta(),settings:{sound:true,volume:.55,musicVolume:.55,effectsVolume:.8,shake:true,particles:true}};}
export function normalizeMeta(raw){const m=createMeta();if(!raw||raw.version!==VERSION)return m;for(const k of ['credits','runs','wins','bestTime','bestKills','totalKills'])m[k]=Number.isFinite(raw[k])?Math.max(0,Math.floor(raw[k])):0;for(const b of BASE_UPGRADES)m.base[b.id]=Math.min(b.max,Math.max(0,Math.floor(Number(raw.base?.[b.id])||0)));if(Array.isArray(raw.history))m.history=raw.history.slice(0,10).filter(x=>x&&CLASSES.some(c=>c.id===x.classId)&&Number.isFinite(x.time)&&Number.isFinite(x.kills)).map(x=>({classId:x.classId,time:Math.max(0,x.time),kills:Math.max(0,x.kills),won:!!x.won}));m.collection=collectionMeta(raw.collection);if(raw.settings){m.settings.sound=!!raw.settings.sound;m.settings.volume=Math.max(0,Math.min(1,Number(raw.settings.volume)||0));for(const [k,d] of [['musicVolume',.55],['effectsVolume',.8]])m.settings[k]=Number.isFinite(raw.settings[k])?Math.max(0,Math.min(1,raw.settings[k])):d;m.settings.shake=raw.settings.shake!==false;m.settings.particles=raw.settings.particles!==false;}m.cosmetics=normalizeLook(raw.cosmetics,m);return m;}
