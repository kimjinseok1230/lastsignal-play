export const COSMETICS=[
{id:'plain',slot:'outfit',name:'편한 차림',icon:'🐱',hint:'기본 지급'},
{id:'scarf',slot:'outfit',name:'새내기 민트 스카프',icon:'🧣',hint:'근무 1회 완료',stat:'runs',target:1},
{id:'uniform',slot:'outfit',name:'야간조 유니폼',icon:'👕',hint:'첫 출근팩 · 판매 준비 중',premium:true},
{id:'crumb',slot:'effect',name:'간식 부스러기',icon:'🍪',hint:'기본 지급'},
{id:'leaf',slot:'effect',name:'캣닢 꽃잎',icon:'🌿',hint:'근무 3회 완료',stat:'runs',target:3},
{id:'paw',slot:'effect',name:'말랑 발바닥',icon:'🐾',hint:'첫 출근팩 · 판매 준비 중',premium:true},
{id:'star',slot:'effect',name:'별사탕 톡톡',icon:'✨',hint:'개별 상품 · 판매 준비 중',premium:true},
{id:'bell',slot:'effect',name:'파란 방울',icon:'🔔',hint:'개별 상품 · 판매 준비 중',premium:true},
{id:'simple',slot:'frame',name:'기본 이름표',icon:'🪪',hint:'기본 지급'},
{id:'clover',slot:'frame',name:'무사 퇴근 이름표',icon:'🍀',hint:'퇴근 성공 1회',stat:'wins',target:1},
{id:'peach',slot:'frame',name:'복숭아빛 이름표',icon:'🌸',hint:'첫 출근팩 · 판매 준비 중',premium:true}];
export const COSMETIC_DETAILS={
plain:'고양이의 기본 모습입니다. 의상 장식을 표시하지 않습니다.',
scarf:'로비와 전투에서 고양이 몸에 민트색 스카프를 표시합니다.',
uniform:'로비와 전투에서 민트색 유니폼과 작은 명찰을 표시합니다.',
crumb:'적 처치 위치에 노란 간식 부스러기가 흩어집니다.',
leaf:'적 처치 위치에 연두색 잎사귀가 흩어집니다.',
paw:'적 처치 위치에 분홍색 발바닥이 흩어집니다.',
star:'적 처치 위치에 노란 별사탕이 흩어집니다.',
bell:'적 처치 위치에 하늘색 방울이 흩어집니다. 전용 소리는 없습니다.',
simple:'로비의 고양이 이름표를 기본 모양으로 표시합니다.',
clover:'로비의 고양이 이름표에 연두색 테두리를 표시합니다.',
peach:'로비의 고양이 이름표에 분홍색 테두리를 표시합니다. 출입권이 아닙니다.'
};
export const SLOT_LABELS={outfit:'의상 · 로비/전투',effect:'처치 효과 · 적을 잡을 때',frame:'이름표 · 로비'};
// Keep original asset separate from the composited portrait to prevent stacking outfits.
const portraits=new Map();
export function applyLobbyOutfit(element,cat,outfit){
 const src='./assets/cat-'+cat+'.webp',key=cat+':'+outfit;element.dataset.portraitKey=key;
 if(outfit==='plain'){element.src=src;return;}
 let im=portraits.get(src);if(!im){im=new Image();im.src=src;portraits.set(src,im);}
 const draw=()=>{if(element.dataset.portraitKey!==key||!im.naturalWidth)return;
 const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
 const c=canvas.getContext('2d');c.drawImage(im,0,0);const scale=canvas.height/54;c.scale(scale,scale);
 cosmeticVisuals.drawOutfit.call({cosmetics:{outfit}},c,canvas.width/scale/2,54*.69);
 element.src=canvas.toDataURL('image/png');};
 if(im.complete&&im.naturalWidth)draw();else{element.src=src;im.addEventListener('load',draw,{once:true});}
}
export const DEFAULT_LOOK={outfit:'plain',effect:'crumb',frame:'simple'};
export const hasCosmetic=(meta,item)=>!item.premium&&(!item.stat||(meta[item.stat]||0)>=item.target);
export function normalizeLook(raw,meta){return Object.fromEntries(Object.entries(DEFAULT_LOOK).map(([slot,fallback])=>{const item=COSMETICS.find(c=>c.id===raw?.[slot]&&c.slot===slot);return [slot,item&&hasCosmetic(meta,item)?item.id:fallback];}));}
export function equipCosmetic(meta,id){const item=COSMETICS.find(c=>c.id===id);if(!item||!hasCosmetic(meta,item))return false;meta.cosmetics=normalizeLook(meta.cosmetics,meta);meta.cosmetics[item.slot]=id;return true;}
export function previewLook(id){const look={...DEFAULT_LOOK};if(id==='starter')return {outfit:'uniform',effect:'paw',frame:'peach'};const item=COSMETICS.find(c=>c.id===id);if(item)look[item.slot]=id;return look;}
export function cosmeticCard(c,meta,cat){const has=hasCosmetic(meta,c),equipped=meta.cosmetics[c.slot]===c.id;return `<article class="cosmetic-card"><div class="cosmetic-art art-${c.id}" aria-hidden="true">${c.icon}</div><small>${c.premium?'미리보기 전용':has?'보유 중':'플레이 보상'}</small><h3>${c.name}</h3><p class="cosmetic-description"><b>${SLOT_LABELS[c.slot]}</b><br>${COSMETIC_DETAILS[c.id]}</p><p>${c.hint}${c.stat&&!has?` · ${Math.min(meta[c.stat]||0,c.target)}/${c.target}`:''}</p><div class="cosmetic-actions"><a class="secondary-button" target="_blank" rel="noopener" href="./test-room.html?v=cat24&look=${c.id}&cat=${cat}">적용 모습 보기 ↗</a>${has?`<button class="primary-button" data-equip-look="${c.id}" ${equipped?'disabled':''}>${equipped?'착용 중':'착용'}</button>`:''}</div></article>`;}
function shape(c,id,size){c.beginPath();if(id==='paw'){c.ellipse(0,2,size*.55,size*.42,0,0,Math.PI*2);c.fill();for(let i=0;i<3;i++){c.beginPath();c.arc((i-1)*size*.5,-size*.45,size*.22,0,Math.PI*2);c.fill();}}else if(id==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?size*.45:size;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();}else if(id==='bell'){c.arc(0,0,size,Math.PI,0);c.lineTo(size,size*.5);c.lineTo(-size,size*.5);c.closePath();c.stroke();c.beginPath();c.arc(0,size*.65,2,0,Math.PI*2);c.fill();}else if(id==='leaf'){c.ellipse(0,0,size*.45,size,Math.PI/4,0,Math.PI*2);c.fill();}else{c.moveTo(-size,-size*.6);c.lineTo(size,-size*.3);c.lineTo(size*.4,size);c.closePath();c.fill();}}
export const cosmeticVisuals={
 emitCosmetic(e){this.cosmeticFX??=[];if(this.cosmeticFX.length>=36)return;this.cosmeticFX.push({x:e.x,y:e.y,id:this.cosmetics?.effect||'crumb',life:.45});},
 updateCosmetics(dt){this.cosmeticFX=(this.cosmeticFX||[]).filter(f=>(f.life-=dt)>0);},
 drawCosmeticEffects(c){for(const f of this.cosmeticFX||[]){if(!this.visible(f.x,f.y,55))continue;const q=f.life/.45,n=this.settings.particles?5:2;c.save();c.globalAlpha=q*.85;c.fillStyle=c.strokeStyle=({crumb:'#f8ce8d',leaf:'#9ce8bd',paw:'#ffb9d3',star:'#ffe99a',bell:'#b6daff'})[f.id]||'#f8ce8d';c.lineWidth=1.6;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,r=8+(1-q)*30;c.save();c.translate(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r-12*(1-q));c.rotate(a*.3);shape(c,f.id,5+q*2);c.restore();}c.restore();}},
 drawOutfit(c,x,y){const outfit=this.cosmetics?.outfit;if(!outfit||outfit==='plain')return;c.save();c.translate(x,y);c.lineJoin='round';c.lineCap='round';c.lineWidth=1;
 if(outfit==='uniform'){
 c.strokeStyle='#347c6b';c.fillStyle='#a6e3d2';
 c.beginPath();c.moveTo(-8,-10);c.lineTo(-6,-3);c.moveTo(8,-10);c.lineTo(6,-3);c.stroke();
 c.beginPath();c.moveTo(-7,-5);c.quadraticCurveTo(0,-2,7,-5);c.lineTo(10,9);c.quadraticCurveTo(0,13,-10,9);c.closePath();c.fill();c.stroke();
 c.fillStyle='#69bba6';c.beginPath();c.moveTo(-4,2);c.lineTo(4,2);c.lineTo(4,6);c.quadraticCurveTo(0,9,-4,6);c.closePath();c.fill();c.stroke();
 c.fillStyle='#fff7da';c.fillRect(2,-3,4,2);c.fillStyle='#347c6b';c.beginPath();c.arc(-5,-3,.7,0,Math.PI*2);c.fill();
 }else{
 c.fillStyle='#7adcc6';c.strokeStyle='#347c6b';
 c.beginPath();c.moveTo(-9,-10);c.quadraticCurveTo(0,-6,9,-10);c.lineTo(8,-6);c.quadraticCurveTo(0,-2,-8,-6);c.closePath();c.fill();c.stroke();
 c.beginPath();c.moveTo(5,-6);c.quadraticCurveTo(11,-3,10,5);c.lineTo(6,2);c.lineTo(4,4);c.lineTo(3,-5);c.closePath();c.fill();c.stroke();
 c.fillStyle='#c2f5e4';c.beginPath();c.arc(5,-6,2,0,Math.PI*2);c.fill();c.stroke();
 }c.restore();}
};
