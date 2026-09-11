// Aiming is independent of movement. Screen coordinates use CSS pixels.
const diff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const aiming={
  resetAim(angle=this.player?.angle??-Math.PI/2){
    this.aim={mode:'direction',angle:Number.isFinite(angle)?angle:-Math.PI/2};
    if(this.player)this.player.angle=this.aim.angle;
  },
  aimScreen(x,y){
    if(this.state!=='playing'||!Number.isFinite(x)||!Number.isFinite(y))return false;
    this.aim={mode:'pointer',x,y,angle:this.player.angle};return true;
  },
  aimVector(x,y){
    if(this.state!=='playing'||!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.22)return false;
    this.aim={mode:'direction',angle:Math.atan2(y,x)};return true;
  },
  updateAim(dt=1/60){
    if(!this.aim)this.resetAim();
    if(this.aim.mode==='pointer'){
      const x=this.camera.x+(this.aim.x-this.w/2)/this.zoom-this.player.x;
      const y=this.camera.y+(this.aim.y-this.h/2)/this.zoom-this.player.y;
      if(Math.hypot(x,y)>48)this.aim.angle=Math.atan2(y,x);
    }
    const d=diff(this.aim.angle,this.player.angle),step=7.5*dt;
    this.player.angle+=Math.max(-step,Math.min(step,d));
  },
  updateMain(){
    this.updateAim();const p=this.player;
    if(p.shotCd<=0)this.fireMain({x:p.x+Math.cos(p.angle)*this.stats.range,y:p.y+Math.sin(p.angle)*this.stats.range});
  },
  aimTarget(range,cone=.9,from=this.player,angle=this.player.angle){
    let target=null,best=Infinity;
    for(const e of this.enemies){
      if(e.dead||e.warmup>0)continue;
      const d=Math.hypot(e.x-from.x,e.y-from.y),a=Math.abs(diff(Math.atan2(e.y-from.y,e.x-from.x),angle));
      if(d>range||a>cone)continue;
      const score=a*range*.7+d*.35;if(score<best){best=score;target=e;}
    }
    return target;
  },
  rocketTarget(b){return this.aimTarget(750,1,b,Math.atan2(b.vy,b.vx));},
  drawAim(c,x,y,angle){
    if(this.state==='menu')return;
    const p=this.player,point=this.aim?.mode==='pointer'?{x:this.camera.x+(this.aim.x-this.w/2)/this.zoom,y:this.camera.y+(this.aim.y-this.h/2)/this.zoom}:null;
    const range=Math.min(this.stats.range,point?Math.hypot(point.x-x,point.y-y):170);
    c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle='#dff69566';c.lineWidth=1/this.zoom;c.setLineDash([2,9]);c.beginPath();c.moveTo(38,0);c.lineTo(Math.max(40,range),0);c.stroke();c.setLineDash([]);
    const spread=this.classId==='warden'?.15:.105,count=(this.classId==='warden'?3:1)+(this.u.multi||0);
    if(count>1){const a=(count-1)*spread/2;c.strokeStyle='#e5efbf40';for(const side of [-1,1]){c.beginPath();c.moveTo(35,0);c.lineTo(Math.cos(a)*115,Math.sin(a)*115*side);c.stroke();}}
    if(!point){c.strokeStyle='#e4f4b6';c.lineWidth=1.5/this.zoom;c.beginPath();c.moveTo(range-8,-7);c.lineTo(range,0);c.lineTo(range-8,7);c.stroke();}
    c.restore();
  }
};

// Each thumb owns its pointer; releasing aim keeps its last direction.
export function bindStick(zone,base,knob,onVector,isPlaying){
  let pointer=null,origin={x:0,y:0};
  const reset=()=>{const held=pointer;pointer=null;knob.style.transform='translate(0px,0px)';base.style.left='';base.style.top='';base.style.bottom='';zone.classList.remove('active');onVector(0,0);if(held!==null&&zone.hasPointerCapture?.(held))zone.releasePointerCapture(held);};
  zone.addEventListener('pointerdown',e=>{
    if(!isPlaying()||pointer!==null||e.pointerType==='mouse')return;
    e.preventDefault();pointer=e.pointerId;origin={x:e.clientX,y:e.clientY};zone.setPointerCapture(pointer);zone.classList.add('active');
    const rect=zone.getBoundingClientRect();base.style.left=(e.clientX-rect.left-50)+'px';base.style.top=(e.clientY-rect.top-50)+'px';base.style.bottom='auto';
  });
  zone.addEventListener('pointermove',e=>{
    if(e.pointerId!==pointer)return;if(!isPlaying()){reset();return;}e.preventDefault();
    const dx=e.clientX-origin.x,dy=e.clientY-origin.y,d=Math.hypot(dx,dy)||1,x=dx/d*Math.min(d,40),y=dy/d*Math.min(d,40);
    knob.style.transform=`translate(${x}px,${y}px)`;const magnitude=Math.hypot(x,y)/40;const strength=magnitude<.16?0:(magnitude-.16)/.84;onVector(x/40/(magnitude||1)*strength,y/40/(magnitude||1)*strength);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(event,e=>{if(e.pointerId===pointer)reset();});
  return reset;
}
