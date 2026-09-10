export const VERSION = 1;
export const EDITION = 2;
export const DURATION = 900;
export const WORLD = 1550;
export const CLASSES = [
  {id:'runner',name:'러너',en:'RUNNER',icon:'⌁',tag:'기동 · 연사',description:'빠른 이동과 짧은 대시. 대시 뒤에 폭발하는 신호 잔상을 남깁니다.',hp:115,speed:225,damage:23,interval:.34,dash:3.0,armor:0},
  {id:'engineer',name:'엔지니어',en:'ENGINEER',icon:'◎',tag:'드론 · 제어',description:'방어 드론과 함께 출격. 다가오는 위협을 자동으로 제압합니다.',hp:135,speed:195,damage:22,interval:.42,dash:3.8,armor:0},
  {id:'warden',name:'파수꾼',en:'WARDEN',icon:'⋈',tag:'산탄 · 방어',description:'처음이라면 추천. 튼튼한 장갑과 3발 산탄으로 전선을 지킵니다.',hp:160,speed:185,damage:16,interval:.64,dash:4.1,armor:2}
];
export const UPGRADES = [
  {id:'power',name:'과충전 탄환',icon:'↗',max:5,desc:'모든 무기 피해량 +18%',type:'출력'},
  {id:'haste',name:'가속 장전',icon:'»',max:5,desc:'모든 무기 공격 속도 +15%',type:'발사'},
  {id:'multi',name:'분할 탄창',icon:'⋔',max:3,desc:'주 무기 투사체 +1',type:'주 무기'},
  {id:'pierce',name:'관통 코어',icon:'➜',max:3,desc:'주 무기 관통 +1 · 사거리 +10%',type:'주 무기'},
  {id:'orbit',name:'방어 드론',icon:'◎',max:5,desc:'주위를 도는 드론 추가 · 접촉 피해 강화',type:'궤도 무기'},
  {id:'arc',name:'아크 방전',icon:'ϟ',max:5,desc:'적 사이를 연결하는 연쇄 번개',type:'전기 무기'},
  {id:'rocket',name:'유도 로켓',icon:'↑',max:5,desc:'군집을 추적하는 폭발 로켓',type:'폭발 무기'},
  {id:'field',name:'서리장',icon:'❋',max:5,desc:'주변 적을 감속 · 지속 피해',type:'영역 무기'},
  {id:'vitality',name:'보강 외피',icon:'＋',max:5,desc:'최대 생명력 +25 · 생명력 25 회복',type:'생존'},
  {id:'speed',name:'경량 프레임',icon:'⌁',max:4,desc:'이동 속도 +8% · 대시 재사용 −8%',type:'기동'},
  {id:'magnet',name:'신호 수집기',icon:'⊙',max:4,desc:'수집 범위 +35% · 경험치 +10%',type:'성장'},
  {id:'regen',name:'복원 나노봇',icon:'✚',max:4,desc:'4초간 피격이 없으면 초당 생명력 0.22 회복',type:'회복'},
  {id:'armor',name:'반응 장갑',icon:'◇',max:4,desc:'받는 피해 −2 · 최대 생명력 +10',type:'방어'},
  {id:'crit',name:'약점 분석',icon:'⌖',max:4,desc:'치명타 확률 +10% · 치명타 피해 +25%',type:'정밀'},
  {id:'pulse',name:'펄스 증폭',icon:'◉',max:4,desc:'전자기 펄스 범위 +20% · 재사용 −12%',type:'액티브'},
  {id:'rail',name:'위상 절단기',icon:'╱',max:5,desc:'충전 후 직선 관통 광선 · 오염 보호막 무시',type:'정밀 무기'},
  {id:'mine',name:'중력 덫',icon:'⊗',max:5,desc:'이동 경로에 설치 · 접근한 적을 끌어당겨 폭발',type:'설치 무기'}
];
export const WEAPONS=['orbit','arc','rocket','field','rail','mine'];
export const PROTOCOLS=[
  {id:'glass',name:'유리 심장',icon:'◈',desc:'모든 피해 +30% / 최대 생명력 −20%',type:'신호 변조',protocol:true},
  {id:'capacitor',name:'불안정 축전기',icon:'ϟ',desc:'펄스 재사용 −30% · 번개 피해 +20% / 주 무기 피해 −15%',type:'신호 변조',protocol:true},
  {id:'bastion',name:'고정 주파수',icon:'▥',desc:'최대 생명력 +35 · 방어 +2 / 이동 속도 −12%',type:'신호 변조',protocol:true}
];
export const EVOLUTIONS = [
  {id:'nova',name:'성운 포위망',icon:'✺',weapon:'orbit',support:'speed',desc:'드론이 거대한 이중 궤도로 회전하며 적을 분쇄합니다.'},
  {id:'storm',name:'종말의 번개',icon:'ϟ',weapon:'arc',support:'haste',desc:'연쇄 대상과 피해가 증가하는 초고출력 번개.'},
  {id:'barrage',name:'궤도 폭격',icon:'⋔',weapon:'rocket',support:'power',desc:'유도 로켓이 세 갈래로 발사되며 폭발 범위가 증가합니다.'},
  {id:'absolute',name:'절대 영도',icon:'❋',weapon:'field',support:'magnet',desc:'서리장 확장 · 동결된 적에게 번개가 맞으면 파쇄 피해.'},
  {id:'prism',name:'삼중 간섭',icon:'Ⅲ',weapon:'rail',support:'crit',desc:'위상 절단기가 세 갈래로 분리되어 전방을 절단합니다.'},
  {id:'singularity',name:'사건의 지평선',icon:'⊗',weapon:'mine',support:'pulse',desc:'중력 덫이 폭발한 자리에 적을 끌어당기는 특이점을 남깁니다.'}
];
export const BASE_UPGRADES = [
  {id:'hull',name:'강화 선체',icon:'◇',desc:'시작 생명력 +10 / 단계',max:5,cost:60},
  {id:'output',name:'출력 보정',icon:'↗',desc:'모든 피해량 +4% / 단계',max:5,cost:75},
  {id:'learning',name:'신호 해독',icon:'⊙',desc:'경험치 획득 +4% / 단계',max:5,cost:65},
  {id:'recovery',name:'응급 프로토콜',icon:'✚',desc:'중계기 복구 시 추가 회복 +6 / 단계',max:5,cost:50}
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
export function xpRequired(level){return Math.floor(18+level*8+Math.pow(level,1.75)*4);}
export function createMeta(){return {version:VERSION,credits:0,base:{},runs:0,wins:0,bestTime:0,bestKills:0,totalKills:0,history:[],settings:{sound:false,volume:.36,shake:true,particles:true}};}
export function normalizeMeta(raw){const m=createMeta();if(!raw||raw.version!==VERSION)return m;for(const k of ['credits','runs','wins','bestTime','bestKills','totalKills'])m[k]=Number.isFinite(raw[k])?Math.max(0,Math.floor(raw[k])):0;for(const b of BASE_UPGRADES)m.base[b.id]=Math.min(b.max,Math.max(0,Math.floor(Number(raw.base?.[b.id])||0)));if(Array.isArray(raw.history))m.history=raw.history.slice(0,10).filter(x=>x&&CLASSES.some(c=>c.id===x.classId)&&Number.isFinite(x.time)&&Number.isFinite(x.kills)).map(x=>({classId:x.classId,time:Math.max(0,x.time),kills:Math.max(0,x.kills),won:!!x.won}));if(raw.settings){m.settings.sound=!!raw.settings.sound;m.settings.volume=Math.max(0,Math.min(1,Number(raw.settings.volume)||0));m.settings.shake=raw.settings.shake!==false;m.settings.particles=raw.settings.particles!==false;}return m;}
