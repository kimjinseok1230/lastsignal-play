// Original 'Midnight Snack Run': 8-bar synth-pop score, synthesized locally.
const hz=n=>440*Math.pow(2,(n-69)/12);
const clamp=(n,d=1)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):d;
const CHORDS=[[48,60,64,67,71],[45,60,64,67,69],[50,62,65,69,72],[43,59,62,65,69],[48,60,64,67,71],[45,60,64,67,72],[53,60,65,69,72],[43,59,62,67,71]];
const MELODY=[[76,0,79,0,83,81,79,0],[76,0,72,74,76,0,79,0],[77,0,81,0,84,81,79,77],[74,0,71,0,74,76,79,0],[76,79,83,0,86,83,81,79],[81,0,79,76,72,0,76,0],[77,0,81,84,81,79,77,0],[74,0,71,74,79,0,0,0]];
export class Sound {
 constructor(settings){this.settings=settings;this.ctx=null;this.mode='menu';this.scene='store';this.step=0;this.nextNote=0;this.voices=0;this.limits={};this.weapon='runner';}
 unlock(){try{if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.ctx=new Audio();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.effects=this.ctx.createGain();this.music.connect(this.master);this.effects.connect(this.master);this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-12;this.compressor.knee.value=14;this.compressor.ratio.value=5;this.compressor.attack.value=.004;this.compressor.release.value=.16;this.master.connect(this.compressor);this.compressor.connect(this.ctx.destination);const size=Math.ceil(this.ctx.sampleRate*.5);this.noiseBuffer=this.ctx.createBuffer(1,size,this.ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=Math.random()*2-1;}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});this.sync();}catch{}}
 sync(){if(!this.master)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.settings.sound?clamp(this.settings.volume,.55):0,t,.03);this.music.gain.setTargetAtTime(this.mode==='playing'?clamp(this.settings.musicVolume,.55):0,t,.07);this.effects.gain.setTargetAtTime(clamp(this.settings.effectsVolume,.8)*1.65,t,.03);}
 setMode(mode){if(mode===this.mode)return;this.mode=mode;this.nextNote=0;this.sync();}
 setScene(scene){this.scene=scene;}
 ready(){return this.ctx&&this.settings.sound&&this.ctx.state==='running';}
 tone(freq,duration=.1,type='sine',volume=.1,end=0,delay=0,bus='effects',pan=0){if(!this.ready()||this.voices>=72)return;const t=this.ctx.currentTime+Math.max(0,delay),o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);const stereo=this.ctx.createStereoPanner?.();if(stereo){stereo.pan.value=pan;g.connect(stereo);stereo.connect(this[bus]);}else g.connect(this[bus]);this.voices++;o.onended=()=>{o.disconnect();g.disconnect();stereo?.disconnect();this.voices--;};o.start(t);o.stop(t+duration+.02);}
 noise(duration=.06,volume=.04,cutoff=3000,delay=0,bus='effects'){if(!this.ready()||this.voices>=72)return;const t=this.ctx.currentTime+Math.max(0,delay),n=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();n.buffer=this.noiseBuffer;f.type='bandpass';f.frequency.value=Math.min(2600,Math.max(350,cutoff));f.Q.value=.65;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume*.45,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(g);g.connect(this[bus]);this.voices++;n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();this.voices--;};n.start(t);n.stop(t+duration);}
 allow(key,interval){const t=this.ctx.currentTime;if(t-(this.limits[key]??-99)<interval)return false;this.limits[key]=t;return true;}
 play(name,detail={}){if(!this.ready())return;
  if(name==='shot'||name.startsWith('weapon-')){if(!this.allow('shot',.09))return;const kind=name==='shot'?this.weapon:name.slice(7);if(kind==='web'){this.tone(330,.13,'triangle',.1,110);this.noise(.04,.024,2200);}else if(kind==='ice'){this.tone(1400,.1,'sine',.065,800);this.tone(2100,.07,'sine',.035,1500,.025);}else if(kind==='pierce'){this.noise(.075,.065,3800);this.tone(740,.065,'triangle',.06,280);}else if(kind==='flame'){this.tone(120,.16,'triangle',.14,45);this.noise(.13,.065,450);}else if(kind==='heal'){this.tone(660,.13,'sine',.08,990);this.tone(1320,.08,'sine',.025,0,.035);}else if(kind==='chain'){this.tone(620,.07,'triangle',.075,240);this.tone(1050,.04,'sine',.035,600);}else if(kind==='stars'){[880,1108,1320].forEach((f,i)=>this.tone(f,.12,'sine',.035,0,i*.02));}else if(kind==='gravity'){this.tone(160,.26,'sine',.16,42);this.tone(320,.15,'triangle',.03,85);}else if(kind==='return'){this.tone(460,.16,'triangle',.065,920);this.noise(.09,.028,2400);}else if(kind==='warden'){this.tone(160,.09,'triangle',.12,60);this.noise(.06,.08,1200);}else if(kind==='engineer'){this.tone(520,.08,'triangle',.075,220);}else{this.tone(460,.075,'triangle',.085,140);this.tone(950,.03,'sine',.025,400);}return;}
  if(name==='impact'){if(!this.allow(name,.085))return;this.tone(280,.075,'sine',.16,85);this.tone(780,.032,'triangle',.07,330);this.noise(.022,.025,1400);return;}
  if(name==='bread'){if(!this.allow(name,.12))return;this.tone(320,.09,'triangle',.15,95);this.tone(920,.035,'sine',.07,400);this.noise(.035,.05,1200);return;}
  if(name==='enemy-down'){if(!this.allow(detail.boss?'boss-down':detail.large?'large-down':name,detail.large?.22:.09))return;const f=detail.large?160:460+(this.step%4)*65;this.tone(f,detail.large?.24:.1,'triangle',.1,detail.large?38:f*1.5);this.noise(detail.large?.16:.045,detail.large?.08:.045,detail.large?650:2600);this.tone(f*2,.13,'sine',.04,f*2.8,.035);return;}
  if(name==='hit'){if(!this.allow(name,.3))return;this.tone(130,.16,'triangle',.19,42);this.noise(.11,.12,800);return;}
  const sequences={level:[72,76,79,84],relay:[76,72,79,84],win:[72,76,79,84,88,91],death:[67,64,60,55],evolution:[60,67,72,76,79,84],overdrive:[60,64,67,72,79]};
  if(sequences[name]){sequences[name].forEach((n,i)=>this.tone(hz(n),name==='death'?.42:.3,'triangle',.12,0,i*.11));return;}
  if(name==='dash'){this.noise(.12,.07,2500);this.tone(280,.12,'sine',.08,800);}
  else if(name==='pulse'){this.tone(150,.3,'triangle',.2,38);this.noise(.2,.09,500);}
  else if(name==='pickup'){if(this.allow(name,.1))this.tone(1046,.065,'sine',.055,1568);}
  else if(name==='boss'){[48,47,43].forEach((n,i)=>this.tone(hz(n),.35,'triangle',.16,0,i*.21));}
  else if(name==='explode'||name==='mine'){if(!this.allow('blast',.12))return;this.tone(110,.25,'triangle',.18,28);this.noise(.18,.1,500);}
  else if(name==='arc'||name==='laser'){if(this.allow(name,.12)){this.tone(720,.09,'triangle',.085,210);this.tone(1440,.055,'sine',.035,540);}}
  else if(name==='rail'){if(!this.allow(name,.1))return;this.tone(230,.22,'triangle',.12,55);this.noise(.1,.08,2200);}
  else if(name==='warning'){[0,.22].forEach(d=>this.tone(660,.12,'triangle',.075,0,d));}
  else if(name==='perfect'){this.tone(1175,.18,'sine',.095,1760);}
  else if(name==='click'){this.tone(740,.055,'sine',.065,520);}
 }
 ambient(dt,intensity=0){if(this.mode!=='playing'||!this.ready())return;const now=this.ctx.currentTime;if(!this.nextNote||this.nextNote<now-.25)this.nextNote=now+.015;let count=0;while(this.nextNote<now+.1&&count++<3){this.scheduleStep(this.step++,Math.max(0,this.nextNote-now),intensity);this.nextNote+=60/(this.scene==='rush'?128:this.scene==='boss'?120:112)/4;}}
 scheduleStep(step,delay,intensity){const bar=Math.floor(step/16)%8,s=step%16,chord=CHORDS[bar],hot=this.scene!=='store';
  if(s===0||s===8){this.tone(125,.15,'sine',.2,38,delay,'music');this.tone(hz(chord[0]),.28,'triangle',.13,0,delay,'music',-.1);}
  if(s===6||s===14)this.tone(hz(chord[0]+7),.16,'triangle',.075,0,delay,'music',-.1);
  if(s===4||s===12){this.noise(.07,.09,1600,delay,'music');this.tone(175,.06,'triangle',.055,90,delay,'music');}
  if(s%2===0||hot)this.noise(.025,s%4===0?.022:.012,6500,delay+(s%2?.012:0),'music');
  if(s===2||s===10)chord.slice(1).forEach((n,i)=>this.tone(hz(n),.25,'sine',.034,0,delay+i*.009,'music',i%2?.35:-.35));
  if(s%2===0){const note=MELODY[bar][s/2];if(note){this.tone(hz(note),.19,'triangle',.052,0,delay,'music',.18);this.tone(hz(note+12),.14,'sine',.012,0,delay+.035,'music',-.25);}}
  if((intensity>.45||hot)&&s%4===3)this.tone(hz(chord[1+(s%3)]+12),.09,'sine',.023,0,delay,'music',-.3);
 }
}
