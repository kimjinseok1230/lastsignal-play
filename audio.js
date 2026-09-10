export class Sound {
  constructor(settings){this.settings=settings;this.ctx=null;this.lastShot=0;this.beat=0;}
  unlock(){try{if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});this.sync();}catch{}}
  sync(){if(this.master)this.master.gain.setTargetAtTime(this.settings.sound?this.settings.volume:0,this.ctx.currentTime,.05);}
  tone(freq,duration=.1,type='sine',volume=.1,end=0,delay=0){if(!this.ctx||!this.settings.sound||this.ctx.state!=='running')return;try{const t=this.ctx.currentTime+delay;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};}catch{}}
  play(name){if(!this.ctx||!this.settings.sound)return;const now=this.ctx.currentTime;
    if(name==='shot'){if(now-this.lastShot<.075)return;this.lastShot=now;this.tone(150,.055,'triangle',.075,65);}
    else if(name==='hit'){this.tone(80,.14,'sawtooth',.12,30);}
    else if(name==='dash'){this.tone(420,.16,'triangle',.1,65);}
    else if(name==='pulse'){this.tone(70,.45,'sawtooth',.12,26);this.tone(550,.3,'sine',.08,40);}
    else if(name==='level'){[392,494,587,784].forEach((n,i)=>this.tone(n,.32,'sine',.13,0,i*.085));}
    else if(name==='pickup'){this.tone(850,.045,'sine',.045,1200);}
    else if(name==='relay'){[262,330,392,523,659].forEach((n,i)=>this.tone(n,.5,'sine',.14,0,i*.14));}
    else if(name==='boss'){[65,65,55].forEach((n,i)=>this.tone(n,.7,'sawtooth',.08,30,i*.45));}
    else if(name==='explode'){this.tone(95,.22,'sawtooth',.075,23);}
    else if(name==='win'){[262,330,392,523,659,784].forEach((n,i)=>this.tone(n,.7,'triangle',.14,0,i*.15));}
    else if(name==='death'){[196,165,130,65].forEach((n,i)=>this.tone(n,.8,'triangle',.13,0,i*.25));}
    else if(name==='arc'){this.tone(860,.12,'sawtooth',.045,90);}
    else if(name==='rail'){this.tone(170,.3,'triangle',.12,28);this.tone(950,.14,'sawtooth',.045,110);}
    else if(name==='laser'){this.tone(700,.2,'sawtooth',.045,100);}
    else if(name==='mine'){this.tone(52,.4,'triangle',.13,24);this.tone(300,.2,'sine',.055,45);}
    else if(name==='warning'){this.tone(220,.19,'triangle',.08,0);this.tone(220,.19,'triangle',.08,0,.3);}
    else if(name==='perfect'){this.tone(1175,.16,'sine',.09,1568);}
    else if(name==='overdrive'){[110,164.81,220,329.63].forEach((n,i)=>this.tone(n,.6,'sawtooth',.045,0,i*.06));}
    else if(name==='evolution'){[220,329.63,440,659.25,880].forEach((n,i)=>this.tone(n,.6,'triangle',.1,0,i*.09));}
    else if(name==='click'){this.tone(660,.075,'sine',.07,420);}
  }
  ambient(dt,intensity){this.beat-=dt;if(this.beat>0)return;this.beat=.4-intensity*.11;this.musicStep=((this.musicStep||0)+1)%16;const bass=[55,55,65.41,55,73.42,65.41,49,55][Math.floor(this.musicStep/2)];if(this.musicStep%2===0)this.tone(bass,.3,'sine',.04);if(intensity>.22&&this.musicStep%4===2)this.tone(bass*4,.19,'triangle',.015);if(intensity>.55&&this.musicStep%2)this.tone(920,.025,'triangle',.009,170);}
}
