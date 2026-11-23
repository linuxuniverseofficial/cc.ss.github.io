'use strict';
/* Coastal Chaos · js/23-audio.js — Áudio, rádio, OST de cena, sons curtos + funções comuns (actorShowNow, audioCutKeepScene…).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= AUDIO ================= */
// v270: micro-modulador comum aos SFX procedurais. Varia o timbre/rotação
// sem buffers novos, sem osciladores extras e sem processar áudio na CPU do jogo.
function soundVary(base,range=.06,variation=Math.random()){return base*(1+(variation*2-1)*range)}
let AC=null,master,engO1,engO2,engG,engF,engMix2,scrG,muted=false,engO3,engAMd,engRumG,engRes,engMain,engSh,engLP2;
function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();const limiter=AC.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=10;limiter.ratio.value=4;limiter.attack.value=.003;limiter.release.value=.16;master.connect(limiter);limiter.connect(AC.destination);musicBus=AC.createGain();musicBus.connect(AC.destination);applyVolumes();
 /* r41 · MOTOR COM RONCO: frequência de explosão real (rpm × cilindros), sub-oitava, ruído grave modulado no giro do virabrequim (o "lope"),
    saturação suave pra dar corpo em caixinha de celular, ressonância de escapamento e passa-baixa que abre com o acelerador. */
 engO1=AC.createOscillator();engO2=AC.createOscillator();engO2.type='sine';engO3=AC.createOscillator();engO3.type='sine';
 engMain=AC.createGain();engMain.gain.value=.6;engMix2=AC.createGain();engMix2.gain.value=.5;
 engSh=AC.createWaveShaper();{const n=1024,cu=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cu[i]=Math.tanh(x*2.4)/Math.tanh(2.4)}engSh.curve=cu;engSh.oversample='2x'}
 engRes=AC.createBiquadFilter();engRes.type='peaking';engRes.frequency.value=95;engRes.Q.value=1.1;engRes.gain.value=7;
 engF=AC.createBiquadFilter();engF.type='lowpass';engF.frequency.value=500;engF.Q.value=.8;engLP2=AC.createBiquadFilter();engLP2.type='lowpass';engLP2.frequency.value=2400;engLP2.Q.value=.5;
 const engHP=AC.createBiquadFilter();engHP.type='highpass';engHP.frequency.value=24;engG=AC.createGain();engG.gain.value=0;
 {const nb=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),nd=nb.getChannelData(0);let b=0;for(let i=0;i<nd.length;i++){b=b*.97+(Math.random()*2-1)*.03;nd[i]=b*6}const ns=AC.createBufferSource();ns.buffer=nb;ns.loop=true;
  const nlp=AC.createBiquadFilter();nlp.type='lowpass';nlp.frequency.value=260;const am=AC.createGain();am.gain.value=.5;engAMd=AC.createGain();engAMd.gain.value=.4;engO3.connect(engAMd);engAMd.connect(am.gain);
  engRumG=AC.createGain();engRumG.gain.value=0;ns.connect(nlp);nlp.connect(am);am.connect(engRumG);engRumG.connect(engSh);ns.start()}
 engO1.connect(engMain);engMain.connect(engSh);engO2.connect(engMix2);engMix2.connect(engSh);engSh.connect(engRes);engRes.connect(engF);engF.connect(engLP2);engLP2.connect(engHP);engHP.connect(engG);engG.connect(master);engO1.start();engO2.start();engO3.start();
 const buf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const ns=AC.createBufferSource();ns.buffer=buf;ns.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2100;bp.Q.value=2.5;scrG=AC.createGain();scrG.gain.value=0;
 ns.connect(bp);bp.connect(scrG);scrG.connect(master);ns.start();AC._noise=buf;for(const kind of Object.keys(SHOT_TIMBRE))for(let v=0;v<3;v++)shotBuffer(kind,v);setupRadioChain()}catch(e){AC=null}}
const canRoute=!/^file:/i.test(location.protocol);
function eqChain(input,boost){const ls=AC.createBiquadFilter();ls.type='lowshelf';ls.frequency.value=105;ls.gain.value=4.5;
 const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=3200;pk.Q.value=.9;pk.gain.value=1.5;
 const hs=AC.createBiquadFilter();hs.type='highshelf';hs.frequency.value=9000;hs.gain.value=3;
 const cp=AC.createDynamicsCompressor();cp.threshold.value=-20;cp.knee.value=14;cp.ratio.value=3;cp.attack.value=.008;cp.release.value=.25;
 const g=AC.createGain();g.gain.value=boost;input.connect(ls);ls.connect(pk);pk.connect(hs);hs.connect(cp);cp.connect(g);return g}
// v77: efeito da rádio do shopping (radios/Mall): passa-baixa + passa-alta, leve saturação, "wow" de fita e eco curto.
function mallFxChain(src){const mix=AC.createGain(),dry=AC.createGain(),wet=AC.createGain();dry.gain.value=1;wet.gain.value=0;src.connect(dry);dry.connect(mix);
 const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=260;hp.Q.value=.7;
 const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1250;lp.Q.value=.8;
 const lp2=AC.createBiquadFilter();lp2.type='lowpass';lp2.frequency.value=1700;lp2.Q.value=.5;
 const lp3=AC.createBiquadFilter();lp3.type='lowpass';lp3.frequency.value=2400;lp3.Q.value=.4;
 const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=850;pk.Q.value=1.;pk.gain.value=3.5;
 const ws=AC.createWaveShaper(),cu=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;cu[i]=Math.tanh(2.2*x)/Math.tanh(2.2)}ws.curve=cu;
 const wow=AC.createDelay(.05);wow.delayTime.value=.012;const lfo=AC.createOscillator(),ld=AC.createGain();lfo.frequency.value=.55;ld.gain.value=.0011;lfo.connect(ld);ld.connect(wow.delayTime);lfo.start();
 const dl=AC.createDelay(.5);dl.delayTime.value=.11;const fb=AC.createGain();fb.gain.value=.28;const dlp=AC.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=900;const wg=AC.createGain();wg.gain.value=1.7;
 src.connect(hp);hp.connect(pk);pk.connect(ws);ws.connect(lp);lp.connect(lp2);lp2.connect(lp3);lp3.connect(wow);wow.connect(wg);wow.connect(dl);dl.connect(dlp);dlp.connect(fb);fb.connect(dl);dlp.connect(wg);wg.connect(wet);wet.connect(mix);
 RADIO.fx={dry,wet,on:false};return mix}
function mallFxSet(on){const F=RADIO.fx;if(!F||F.on===on||!AC)return;F.on=on;const t=AC.currentTime;F.dry.gain.setTargetAtTime(on?0:1,t,.08);F.wet.gain.setTargetAtTime(on?1:0,t,.08)}
function setupRadioChain(){if(!canRoute||RADIO.routed)return;try{const src=AC.createMediaElementSource(RADIO.el);RADIO.gain=eqChain(mallFxChain(src),1.7);RADIO.gain.connect(musicBus);RADIO.routed=true}catch(e){}}
// v269: VOZES AMBIENTAIS — apenas Web Audio; NÃO ALTERAR AQUI os shaders,
// SpriteMaterial, atlas, drawRange ou geometria compartilhada da v258.
// v284: um oscilador, dois formantes e uma fonte curta de respiração por fala; sem arquivos ou meshes.
const NPC_VOICE={poll:0,meetPoll:0,soloAt:0,slots:[]};
function npcMumble(p,kind='talk'){
 if(!AC||AC.state!=='running'||!S.sound||VOL.sfx<=.01||VOL.master<=.01||!running||menuOpen||cfgOpen||cmdsOpen||BENCH.active||TIMEJUMP.busy||PL.inside||PL.dead||!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
 const ear=PL.car||PL,dx=p.x-ear.x,dz=p.z-ear.z,dist=Math.hypot(dx,dz);
 const range=kind==='solo'?17:26;if(dist>=range)return false;
 const t=AC.currentTime;
 if(t<(p._npcSoundCool||0))return false;
 NPC_VOICE.slots=NPC_VOICE.slots.filter(end=>end>t);
 if(NPC_VOICE.slots.length>=(MOB_LITE?1:2))return false;
 const volume=Math.pow(1-dist/range,1.5)*(kind==='solo'?.073:.11);
 if(volume<.002)return false;
 // Identidade estável por pedestre; as frases variam sem trocar a voz a cada fala.
 const voice=p._voice284||(p._voice284={base:soundVary(138,.23,R2())*clamp(p.pitch||1,.65,1.5),tract:.86+R2()*.28,pace:.105+R2()*.035});
 const n=kind==='solo'?2+Math.floor(R2()*2):4+Math.floor(R2()*4),pace=voice.pace;
 const osc=AC.createOscillator(),f1=AC.createBiquadFilter(),f2=AC.createBiquadFilter(),gain=AC.createGain(),mix=AC.createGain();
 const breath=AC.createBufferSource(),bf=AC.createBiquadFilter(),bg=AC.createGain();
 osc.type='sawtooth';f1.type=f2.type='bandpass';f1.Q.value=4;f2.Q.value=6;mix.gain.value=.55;
 breath.buffer=AC._noise;breath.loop=true;bf.type='highpass';bf.frequency.value=1800;bg.gain.value=.0001;
 const vowels=[[730,1090],[270,2290],[300,870],[530,1840],[570,840]];
 gain.gain.setValueAtTime(.0001,t);
 for(let i=0;i<n;i++){
  const at=t+i*pace,len=pace*(.65+R2()*.24),v=vowels[Math.floor(R2()*vowels.length)];
  const contour=1+.09*Math.sin(i/n*Math.PI)-(i===n-1?.12:0),f=voice.base*contour*soundVary(1,.035,R2());
  osc.frequency.setValueAtTime(f,at);osc.frequency.linearRampToValueAtTime(f*.94,at+len);
  for(const [filter,hz] of [[f1,v[0]],[f2,v[1]]]){filter.frequency.setTargetAtTime(hz*voice.tract,at,.012)}
  const amp=volume*(.7+R2()*.3)*(i===n-1?.8:1);
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(amp,at+.018);gain.gain.exponentialRampToValueAtTime(.0001,at+len);
  bg.gain.setValueAtTime(volume*(R2()<.4?.16:.045),at);bg.gain.exponentialRampToValueAtTime(.0001,at+.035);
 }
 osc.connect(f1);osc.connect(f2);f1.connect(mix);f2.connect(mix);mix.connect(gain);
 breath.connect(bf);bf.connect(bg);bg.connect(gain);
 let pan=null;
 if(AC.createStereoPanner){pan=AC.createStereoPanner();const m=camera.matrixWorld.elements;pan.pan.value=clamp((dx*m[0]+dz*m[2])/Math.max(5,dist),-.8,.8);gain.connect(pan);pan.connect(master)}else gain.connect(master);
 const end=t+n*pace+.04;osc.start(t);osc.stop(end);breath.start(t,R2()*.3);breath.stop(end);
 osc.onended=()=>{for(const node of [osc,f1,f2,mix,gain,breath,bf,bg,pan])if(node)node.disconnect()};
 NPC_VOICE.slots.push(end);p._npcSoundCool=t+(kind==='solo'?7:.20);
 return true;
}
// O encontro de dois pedestres nao cria novos atores: aproveita as caminhadas existentes.
// Procura-se pares apenas ao redor do jogador e em uma cadencia lenta (sem N² por frame).
function npcMingleTick(dt){
 if(!running||!AC||!S.sound||VOL.sfx<=.01||S.peds<=0||PL.inside||PL.dead||menuOpen||cfgOpen||cmdsOpen||BENCH.active||TIMEJUMP.busy||S.style==='inverted'||S.style==='haze')return;
 NPC_VOICE.poll-=dt;if(NPC_VOICE.poll>0)return;NPC_VOICE.poll=.28;
 const ear=PL.car||PL,near=[];
 for(const p of peds){const dx=p.x-ear.x,dz=p.z-ear.z;if(dx*dx+dz*dz<28*28)near.push(p)}
 // Diálogos já existentes (incluindo pares gerados na rua): alternância de falas.
 for(const p of near){
  const q=p.mate;
  if(p.state!=='talk'||!q||q.state!=='talk'||p._npcChatLeader!==true||!near.includes(q))continue;
  if(simT<(p._npcVoiceAt||0))continue;
  const voice=p._npcVoiceTurn?q:p;
  const played=npcMumble(voice,'talk');
  if(played)p._npcVoiceTurn=!p._npcVoiceTurn;
  p._npcVoiceAt=simT+(played?1.12+R2()*1.1:.85);
 }
 NPC_VOICE.meetPoll-=.28;
 if(NPC_VOICE.meetPoll<=0){
  NPC_VOICE.meetPoll=1.1+R2()*.6;
  const walkers=near.filter(p=>!p.fixed&&!p.cop&&!p.strip&&p.r&&!p.rainMode&&p.state==='walk'&&
   simT>=(p._npcMeetCool||0)&&!p.mate&&p.fin===undefined);
  if(walkers.length>=2&&near.filter(p=>p.state==='talk').length<6){
   let found=false;
   for(let i=0;i<walkers.length&&!found;i++)for(let j=i+1;j<walkers.length&&!found;j++){
    const a=walkers[i],b=walkers[j],dx=a.x-b.x,dz=a.z-b.z;
    if(dx*dx+dz*dz>2.2*2.2||Math.abs((a.gy||0)-(b.gy||0))>1)continue;
    if(R2()>.55)continue;
    const duration=4+R2()*3;
    a.state=b.state='talk';a.timer=b.timer=duration;a.mate=b;b.mate=a;
    a.leaveDir=a.dir;b.leaveDir=b.dir;
    a._npcChatLeader=true;b._npcChatLeader=false;
    a._npcVoiceTurn=false;a._npcVoiceAt=simT+.25;
    a._npcMeetCool=b._npcMeetCool=simT+35+R2()*30;
    found=true;
   }
  }
 }
 // Grunhidos/saudacoes ocasionais individuais. Longe do jogador, nao existem vozes.
 if(simT>=(NPC_VOICE.soloAt||0)){
  NPC_VOICE.soloAt=simT+7+R2()*7;
  const casual=near.filter(p=>p.state==='walk'||p.state==='idle');
  if(casual.length&&R2()<.70)npcMumble(casual[Math.floor(R2()*casual.length)],'solo');
 }
}
function ouch(x,z,pitch=1){if(!AC)return;const d=Math.hypot(x-camera.position.x,z-camera.position.z)*(camMode==='top'?.35:1);const vol=Math.max(0,1-d/45);if(vol<=0)return;
 const t=AC.currentTime,f0=(200+Math.random()*60)*pitch;const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f0*1.25,t);o.frequency.linearRampToValueAtTime(f0,t+.08);o.frequency.exponentialRampToValueAtTime(f0*.72,t+.38);
 const f1=AC.createBiquadFilter();f1.type='bandpass';f1.Q.value=6;f1.frequency.setValueAtTime(850,t);f1.frequency.linearRampToValueAtTime(330,t+.3);
 const f2=AC.createBiquadFilter();f2.type='bandpass';f2.Q.value=8;f2.frequency.setValueAtTime(1250,t);f2.frequency.linearRampToValueAtTime(2300,t+.3);
 const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.55*vol,t+.03);g.gain.setValueAtTime(.55*vol,t+.22);g.gain.exponentialRampToValueAtTime(.001,t+.42);
 o.connect(f1);o.connect(f2);f1.connect(g);f2.connect(g);g.connect(master);o.start(t);o.stop(t+.45)}
/* spatial music from passing cars (on foot) */
const BOOM={slots:[],t:0};
// v78: rádio dos carros que passam não vaza para dentro dos interiores (motel, lojas…): corta ao entrar
function boomStop(){for(const sl of BOOM.slots){try{sl.el.pause()}catch(e){}sl.car=null}BOOM.t=.8}
/* v79r17: carro que passa toca a rádio que você escolheu — ONLINE (KRFM ao vivo) ou as do servidor, estas em sequência (antes: loop da mesma música, e sem rádios no servidor ficava mudo).
   Só carro rodando com motorista (trânsito/IA): estacionado, seu, da garagem, da história ou guardado não toca. */
function boomLive(){return RADIO.mode==='live'&&S.style==='modern'&&!RADIO.liveDown}
function boomOk(c){return!!(c&&c.boom&&c.alive&&!c.exploded&&(c.ai||c.mode==='rail')&&!c.tempPark&&!c.owned&&!c.stashed&&c!==PL.lastCar&&!(SAFE.cars||[]).includes(c)&&!(typeof PROLOGUE!=='undefined'&&c===PROLOGUE.car)&&!(DUO.car&&c===DUO.car))}
function boomPick(sl){const live=boomLive();if(live)return{url:LIVE_URL,live:true};BOOM.rng=BOOM.rng||mulberry32((S.seed*2654435761)>>>0);const pool=RADIO.list.filter(s=>!s.world&&s.songs.length),sts=pool.length?pool:RADIO.list.filter(s=>s.songs.length);if(!sts.length)return null;
 const st=sts[Math.floor(BOOM.rng()*sts.length)],i=Math.floor(BOOM.rng()*st.songs.length);sl.st=st;sl.i=i;return{url:st.songs[i].url,live:false}}
function boomSet(sl,src,seek){sl.live=src.live;if(sl.el.dataset.url===src.url)return;sl.el.dataset.url=src.url;sl.el.src=src.live?src.url:encodeURI(decodeURI(src.url));if(seek&&!src.live)sl.el.addEventListener('loadedmetadata',()=>{try{if(sl.el.seekable.length&&isFinite(sl.el.duration))sl.el.currentTime=Math.random()*sl.el.duration*.8}catch(e){}},{once:true})}
function boomUpdate(dt){if(!AC||!canRoute)return;if(!boomLive()&&!RADIO.list.some(s=>s.songs.length)){for(const sl of BOOM.slots)if(sl.car){sl.el.pause();sl.car=null}return}
 if(!BOOM.slots.length){for(let i=0;i<2;i++){const el=new Audio();el.loop=false;el.preload='auto';try{const src=AC.createMediaElementSource(el);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;
  const pn=AC.createPanner();pn.panningModel='HRTF';pn.distanceModel='inverse';pn.refDistance=5;pn.rolloffFactor=1.3;pn.maxDistance=80;const g=eqChain(lp,1.3),g7=AC.createGain();g7.gain.value=.7;src.connect(lp);g.connect(g7);g7.connect(pn);pn.connect(musicBus);const sl={el,pn,car:null};BOOM.slots.push(sl);el.addEventListener('ended',()=>{if(!sl.car||sl.live||!sl.st||!sl.st.songs.length)return;sl.i=(sl.i+1)%sl.st.songs.length;boomSet(sl,{url:sl.st.songs[sl.i].url,live:false},false);const pr=el.play();if(pr&&pr.catch)pr.catch(()=>{})})}catch(e){return}}}
 const cp=camera.position;const lx=camMode==='top'?PL.x:cp.x,lz=camMode==='top'?PL.z:cp.z;
 const active=!PL.car&&!PL.inside&&!menuOpen&&S.sound&&S.style==='modern';
 const liveNow=boomLive();for(const sl of BOOM.slots){const c=sl.car;if(c&&(!active||vehicles.indexOf(c)<0||!boomOk(c)||Math.hypot(c.x-lx,c.z-lz)>60||!!sl.live!==liveNow)){sl.el.pause();sl.car=null}
  if(sl.car){if(sl.pn.positionX){sl.pn.positionX.value=c.x;sl.pn.positionY.value=1;sl.pn.positionZ.value=c.z}else sl.pn.setPosition(c.x,1,c.z)}}
 BOOM.t-=dt;if(BOOM.t>0||!active)return;BOOM.t=.8;
 const used=new Set(BOOM.slots.map(s=>s.car));const cands=carsNear(lx,lz,45).filter(c=>boomOk(c)&&!used.has(c)).sort((a,b)=>Math.hypot(a.x-lx,a.z-lz)-Math.hypot(b.x-lx,b.z-lz));
 for(const sl of BOOM.slots){if(sl.car||!cands.length)continue;const src=boomPick(sl);if(!src)continue;const c=cands.shift();sl.car=c;boomSet(sl,src,true);
  if(sl.pn.positionX){sl.pn.positionX.value=c.x;sl.pn.positionY.value=1;sl.pn.positionZ.value=c.z}const pr=sl.el.play();if(pr&&pr.catch)pr.catch(()=>{})}}
/* ---- RADIO ---- */
const LIVE_URL='https://azura.sims.dev.br/listen/krfm/128k.mp3';
const RADIO={mode:'live',live:new Audio(),liveErrT:-1e9,liveDown:false,livePending:false,liveTryAt:0,liveConfirmed:false,liveStalledAt:0,fallbackPending:false,fallbackActive:false,fallbackBad:new Set(),srv:[],custom:[],onlyCustom:false,list:[],idx:-1,userOff:false,el:new Audio(),label:$('#radio'),probeDone:false,sceneActive:false,sceneStation:null};
RADIO.el.loop=false;RADIO.el.preload='auto';
/* Estações: cada pasta dentro de radios/ é uma rádio; os áudios da pasta formam a programação dela.
   Arquivos soltos direto em radios/ viram a estação "RÁDIO". Pastas com o nome de um mundo
   (SYNTHWAVE, UPSIDE DOWN / MUNDO INVERTIDO, POINT HAZE, MODERNO) são a trilha daquele mundo. */
const AUDIO_RE=/\.(?:mp3|ogg|m4a|aac|wav|opus|flac)$/i;
// KRFM ao vivo só no Modern; nos outros mundos toca só a pasta do mundo.
function radioVeh(){return!!(PL.car||PL.heli||PL.taxi||(PLAYER_PAL.headphone&&!PL.inside&&!PL.dead)||MUSIC.tmp)}
// v77: dentro do shopping a "trilha do mundo" passa a ser a pasta radios/Mall (mesma mecânica das OSTs de
// Synthwave/Point Haze/Mundo Invertido: toca a pé, em sequência, e some ao sair). Na loja de discos o fone
// de cortesia volta para as rádios normais.
function radioWorld(){return PL.inside==='mall'&&!MUSIC.tmp&&RADIO.srv.some(s=>s.world==='mall'&&s.songs.length)?'mall':S.style}
function radioLive(){return RADIO.mode==='live'&&S.style==='modern'&&!RADIO.liveDown&&radioWorld()!=='mall'}
function radioWorldOf(name){const k=name.normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z]/g,'');return k==='MALL'?'mall':k==='SYNTHWAVE'?'synthwave':k==='MUNDOINVERTIDO'||k==='INVERTIDO'||k==='UPSIDEDOWN'?'inverted':k==='MODERNO'||k==='MODERN'?'modern':k==='POINTHAZE'||k==='HAZE'?'haze':null}
function radioSongName(url){return decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/,'').toUpperCase().slice(0,32)}
function radioAddStation(name,urls){urls=[...new Set(urls)];if(!urls.length)return;if(sceneRadioNormalize(name)==='OST')return; /* v78: radios/OST = trilhas de cena, não é rádio */const label=name.toUpperCase().slice(0,24);
 let st=RADIO.srv.find(s=>s.name===label);if(!st){st={name:label,songs:[],pos:0,order:null,world:radioWorldOf(name)};RADIO.srv.push(st)}
 for(const url of urls)if(!st.songs.some(s=>s.url===url))st.songs.push({name:radioSongName(url),url})}
// Links de uma listagem de diretório (nginx/Apache) que ficam DENTRO da pasta listada.
function dirLinks(t,base){const out=[],re=/href\s*=\s*["']([^"'?#]+)["']/gi;let m;while((m=re.exec(t))){let url;try{url=new URL(m[1],base).href}catch(e){continue}if(url!==base&&url.startsWith(base))out.push(url)}return out}
function probeRadios(){const base=new URL('radios/',location.href).href;
 fetch(base,{cache:'no-store'}).then(r=>r.ok?r.text():'').then(async t=>{if(!/<a\s/i.test(t)){probePlaylist();return}
  const links=dirLinks(t,base);radioAddStation('RÁDIO',links.filter(u=>AUDIO_RE.test(u)));
  await Promise.all(links.filter(u=>u.endsWith('/')).map(d=>fetch(d,{cache:'no-store'}).then(r=>r.ok?r.text():'').then(tt=>radioAddStation(decodeURIComponent(d.slice(base.length,-1)),dirLinks(tt,d).filter(u=>AUDIO_RE.test(u)))).catch(()=>{})));
  if(RADIO.srv.length){RADIO.srv.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));RADIO.probeDone=true;updateRadioInfo()}else probePlaylist()}).catch(()=>probePlaylist())}
// Servidor sem listagem de diretório: radios/lista.txt, uma linha por arquivo no formato PASTA/arquivo.mp3.
function probePlaylist(){const base=new URL('radios/lista.txt',location.href);
 fetch(base.href,{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{if(/<html/i.test(t))t='';const groups=new Map();
  for(const l of t.split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')&&AUDIO_RE.test(l))){let url;try{url=new URL(l,base).href}catch(e){continue}const p=l.split('/'),name=p.length>1?p[p.length-2]:'RÁDIO';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(url)}
  for(const[n,u] of groups)radioAddStation(n,u);RADIO.srv.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));RADIO.probeDone=true;updateRadioInfo()}).catch(()=>{RADIO.probeDone=true;updateRadioInfo()})}

// Música atual da estação selecionada (cada estação tem a sua ordem embaralhada pela seed).
function probeMallOst(){if(RADIO.mallProbe||RADIO.srv.some(s=>s.world==='mall'&&s.songs.length))return;RADIO.mallProbe=true;const base=new URL('radios/Mall/',location.href).href,found=[];
 const nx=i=>{if(i>20){if(found.length){radioAddStation('Mall',found);updateRadioInfo()}return}const u=base+'mall'+i+'.mp3';
  fetch(u,{method:'HEAD',cache:'no-store'}).then(r=>{const t=(r.headers.get('content-type')||'').toLowerCase();if(r.ok&&!/html/.test(t)){found.push(u);nx(i+1)}else nx(21)}).catch(()=>nx(21))};nx(1)}
function radioSong(st=RADIO.sceneStation||RADIO.list[RADIO.idx]){return st&&st.songs.length?st.songs[st.order[st.pos%st.order.length]]:null}
function rebuildRadio(){const cur=RADIO.list[RADIO.idx],world=radioWorld();
 if(!RADIO.mine)RADIO.mine={name:'MINHAS MÚSICAS',songs:RADIO.custom,pos:0,order:null,world:null};
 // A trilha do mundo vem primeiro e é sintonizada sozinha; as rádios comuns continuam na roda.
 const list=[...RADIO.srv.filter(s=>s.world===world),...(RADIO.onlyCustom?[]:RADIO.srv).filter(s=>!s.world),...(RADIO.mode==='live'&&RADIO.liveDown?RADIO.srv.filter(s=>s.world&&s.world!==world&&s.world!=='mall'):[])];if(RADIO.custom.length)list.push(RADIO.mine);
 // Ordem das músicas embaralhada a cada sessão, e a rádio abre numa música sorteada.
 for(const st of list)if(st.world&&(!st.order||st.order.length!==st.songs.length)){st.songs.sort((a,b)=>a.url.localeCompare(b.url,undefined,{numeric:true}));st.order=st.songs.map((_,i)=>i);st.pos=0}
 else if(!st.order||st.order.length!==st.songs.length){st.order=st.songs.map((_,i)=>i);for(let i=st.order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[st.order[i],st.order[j]]=[st.order[j],st.order[i]]}st.pos=Math.floor(Math.random()*st.songs.length)}
 RADIO.list=list;const ni=cur?list.indexOf(cur):-1;
 if(RADIO.sceneActive){RADIO.idx=ni;return} // Atualiza catalogo sem tocar na musica da cutscene.
 if(ni>=0)RADIO.idx=ni;else{const back=RADIO.beforeOst?list.indexOf(RADIO.beforeOst):-1;RADIO.beforeOst=null;if(back>=0){RADIO.idx=back;RADIO.autoDone=true;RADIO.err='';loadStation();if(!RADIO.userOff)radioPlay()}else{RADIO.idx=-1;RADIO.autoDone=false;RADIO.el.pause();RADIO.el.dataset.url=''}}
 // Entrou num mundo que tem trilha própria: sintoniza nela.
 if(RADIO.worldSeen!==world){RADIO.worldSeen=world;const ost=list.findIndex(s=>s.world===world);if(ost>=0&&!radioLive()){if(RADIO.idx>=0&&!list[RADIO.idx].world)RADIO.beforeOst=list[RADIO.idx];RADIO.idx=ost;RADIO.autoDone=true;RADIO.err='';loadStation();if(!RADIO.userOff)radioPlay()}}}
function updateRadioInfo(){if(RADIO.probeDone)probeMallOst();rebuildRadio();if(RADIO.mode==='live'&&RADIO.liveDown&&(RADIO.fallbackPending||(!RADIO.fallbackActive&&RADIO.custom.length)))radioFallbackNext();if(typeof AUDIO_TEST!=='undefined'&&AUDIO_TEST.pending&&RADIO.probeDone)audioPreviewStartMusic(false,AUDIO_TEST.localFallback)}
$('#radioSrc').addEventListener('change',e=>{setRadioMode(e.target.value)});
function setRadioMode(m){if(AUDIO_TEST.mode)audioPreviewStop();RADIO.mode=m;RADIO.onlyCustom=m==='custom';$('#radioSrc').value=m;
 RADIO.liveDown=false;RADIO.livePending=false;RADIO.liveTryAt=0;RADIO.liveConfirmed=false;RADIO.liveStalledAt=0;RADIO.fallbackPending=false;RADIO.fallbackActive=false;RADIO.fallbackBad.clear();
 try{localStorage.setItem('ps_radio',m)}catch(e){}
 if(m==='live'){RADIO.el.pause();RADIO.liveErrT=-1e9}else stopLive();updateRadioInfo()}
function stopLive(){const L=RADIO.live;if(!L.paused)L.pause();if(L.getAttribute('src')){L.removeAttribute('src');try{L.load()}catch(e){}}RADIO.livePending=false;RADIO.liveTryAt=0;RADIO.liveStalledAt=0}
// Ordem automática quando a KRFM está offline: arquivos de radios/ primeiro, uploads do navegador depois.
// A consulta à pasta é assíncrona; nunca concluir que está vazia antes de probeRadios/probePlaylist.
function radioFallbackNext(){
 if(RADIO.sceneActive||RADIO.mode!=='live'||!RADIO.liveDown)return false;
 if(!RADIO.probeDone){RADIO.fallbackPending=true;setRadioStatus('KRFM offline · procurando músicas no servidor…');return false}
 RADIO.fallbackPending=false;
 const local=RADIO.srv.filter(st=>st.songs&&st.songs.length&&st.world!=='mall');
 const browser=RADIO.custom.length&&RADIO.mine?[RADIO.mine]:[];
 for(const st of [...local,...browser]){
  if(!st.order||st.order.length!==st.songs.length){st.order=st.songs.map((_,i)=>i)}
  for(let j=0;j<st.order.length;j++){
   const pos=(st.pos+j)%st.order.length,song=st.songs[st.order[pos]];
   if(!song||!song.url||RADIO.fallbackBad.has(song.url))continue;
   st.pos=pos;RADIO.idx=RADIO.list.indexOf(st);if(RADIO.idx<0)continue;
   RADIO.err='';RADIO.fallbackActive=true;RADIO.autoDone=true;loadStation();
   setRadioStatus('KRFM offline · '+(st===RADIO.mine?'músicas do navegador':'músicas do servidor')+' · '+song.name);
   if(!RADIO.userOff)radioPlay();return true
  }
 }
 RADIO.fallbackActive=false;RADIO.el.pause();setRadioStatus('KRFM offline · sem músicas disponíveis no servidor ou navegador');return false
}
function radioLiveFallback(){
 if(RADIO.sceneActive||RADIO.mode!=='live'||RADIO.liveDown)return;
 RADIO.liveDown=true;RADIO.liveErrT=performance.now();RADIO.livePending=false;RADIO.liveConfirmed=false;RADIO.fallbackBad.clear();RADIO.fallbackActive=false;
 stopLive();rebuildRadio();radioFallbackNext()
}
RADIO.live.addEventListener('error',()=>{
 if(!RADIO.live.getAttribute('src')||RADIO.sceneActive)return;
 RADIO.liveErrT=performance.now();RADIO.livePending=false;
 if(AUDIO_TEST.mode&&AUDIO_TEST.source==='online'){audioPreviewLocalFallback();return}
 radioLiveFallback()
});
RADIO.live.addEventListener('playing',()=>{
 RADIO.livePending=false;RADIO.liveConfirmed=true;RADIO.liveStalledAt=0;
 if(AUDIO_TEST.mode&&AUDIO_TEST.source==='online'&&AUDIO_TEST.onlineTimer){clearTimeout(AUDIO_TEST.onlineTimer);AUDIO_TEST.onlineTimer=null}
 if(AUDIO_TEST.mode&&AUDIO_TEST.source==='online'){AUDIO_TEST.onlineConfirmed=true;setRadioStatus('Tocando rádio online · KRFM')}
 else if(!RADIO.sceneActive)setRadioStatus(RADIO.preview?'Tocando: KRFM ao vivo':'')
});
RADIO.live.addEventListener('waiting',()=>{if(!RADIO.sceneActive&&RADIO.mode==='live'&&!RADIO.liveStalledAt)RADIO.liveStalledAt=performance.now();if(!RADIO.sceneActive&&AUDIO_TEST.mode&&AUDIO_TEST.source==='online'){const P=AUDIO_TEST;if(P.onlineTimer)clearTimeout(P.onlineTimer);P.onlineTimer=setTimeout(()=>{if(P.mode&&P.source==='online'&&RADIO.liveStalledAt)audioPreviewLocalFallback()},12000)}});
$('#radioFiles').addEventListener('change',e=>{for(const f of e.target.files){RADIO.custom.push({name:f.name.replace(/\.[^.]+$/,'').toUpperCase().slice(0,32),url:URL.createObjectURL(f),off:Math.random()*600})}updateRadioInfo();e.target.value=''});
function tuneRadio(dir,silent){if(RADIO.sceneActive)return;if(radioLive()){if(!silent)toast('RÁDIO · KRFM AO VIVO');return}const N=RADIO.list.length;if(!N){toast('NENHUMA RÁDIO<br><small style="font-size:11px;color:#fff">adicione músicas em CONFIG → ÁUDIO</small>');return}
 RADIO.idx=RADIO.idx<0?0:((RADIO.idx+dir)%N+N)%N;RADIO.err='';loadStation();radioPlay();
 if(!silent){toast('RÁDIO · '+RADIO.list[RADIO.idx].name);clang(.15)}}
// Próxima música da MESMA estação (fim da faixa ou arquivo com erro).
function radioNextSong(dir=1){if(RADIO.sceneActive){sceneRadioNaturalEnd();return}const st=RADIO.list[RADIO.idx];if(!st||!st.songs.length)return;st.pos=((st.pos+dir)%st.songs.length+st.songs.length)%st.songs.length;RADIO.err='';const same=RADIO.el.dataset.url===(radioSong()||{}).url;loadStation();if(same)try{RADIO.el.currentTime=0}catch(e){}radioPlay()}
// Pular música dentro da rádio atual (. / , no teclado, ↑ no controle, botão MÚSICA no toque).
function radioSkip(dir){if(RADIO.sceneActive)return;const st=RADIO.list[RADIO.idx],ambient=st&&st.world===radioWorld();if(!radioVeh()&&!ambient)return;if(radioLive()){toast('RÁDIO · KRFM AO VIVO');return}
 if(RADIO.blocked)radioKick();if(RADIO.idx<0||RADIO.userOff){radioStep(1);return}radioNextSong(dir);const sg=radioSong();if(sg){toast('♪ '+sg.name+'<br><small style="font-size:11px;color:#fff">'+st.name+'</small>');clang(.12)}}
RADIO.el.addEventListener('ended',()=>{if(AUDIO_TEST.mode&&AUDIO_TEST.source==='local')audioPreviewStartMusic(true);else radioNextSong()});
const ERRS={1:'carregamento cancelado',2:'erro de rede ao baixar o arquivo',3:'o navegador não conseguiu decodificar o áudio',4:'arquivo não encontrado (404) ou formato não suportado'};
RADIO.el.addEventListener('error',()=>{if(RADIO.sceneActive){sceneRadioLocalFailed();return}const e=RADIO.el.error;RADIO.err=e?(ERRS[e.code]||'erro '+e.code):'erro';if(AUDIO_TEST.mode&&AUDIO_TEST.source==='local'){audioPreviewStartMusic(true,true);return}if(RADIO.fallbackActive&&RADIO.mode==='live'&&RADIO.liveDown){RADIO.fallbackBad.add(RADIO.el.dataset.url);radioFallbackNext();return}setRadioStatus('RÁDIO: '+RADIO.err);if(PL.car)toast('RÁDIO: '+RADIO.err.toUpperCase());{const st=RADIO.list[RADIO.idx];if(st&&st.songs.length>1&&!RADIO.preview){const bad=RADIO.el.dataset.url;setTimeout(()=>{if(RADIO.el.dataset.url===bad)radioNextSong()},1500)}}});
RADIO.el.addEventListener('playing',()=>{if(RADIO.sceneActive){sceneRadioLocalPlaying();return}RADIO.err='';if(!AUDIO_TEST.mode)setRadioStatus(RADIO.preview?'Tocando: '+(RADIO.list[RADIO.idx]||{}).name+' · '+(radioSong()||{}).name:'')});
function setRadioStatus(t){const el=$('#radioStatus');if(el)el.textContent=t}
function loadStation(){const el=RADIO.el,sg=radioSong();if(!sg){el.pause();return}
 if(el.dataset.url!==sg.url){el.dataset.url=sg.url;RADIO.err='';el.src=encodeURI(decodeURI(sg.url));el.load()}}
function radioPlay(){const el=RADIO.el,cinematic=!!(RADIO.sceneActive&&RADIO.sceneStation);
 if((radioLive()&&!cinematic)||(RADIO.idx<0&&!cinematic)||RADIO.err)return;
 el.muted=false;el.volume=S.sound?(RADIO.routed?1:.75*musVol()*musicTravelFactor()):0;const pr=el.play();
 if(pr&&pr.catch)pr.catch(e=>{
  if(e&&e.name==='AbortError')return; // play() cancelado por pause()/load() durante troca de faixa/mundo
  if(cinematic){sceneRadioPlayRejected(e);return}
  if(e&&e.name==='NotAllowedError'){RADIO.blocked=true;setRadioStatus('O navegador bloqueou o som: clique na tela ou aperte Q')}
  else if(RADIO.fallbackActive&&RADIO.mode==='live'&&RADIO.liveDown){RADIO.fallbackBad.add(el.dataset.url);radioFallbackNext()}
 })}
function radioKick(){if(RADIO.sceneActive){if(SCENE_RADIO.active&&SCENE_RADIO.blocked){SCENE_RADIO.blocked=false;RADIO.blocked=false;
   if(SCENE_RADIO.kind==='local')radioPlay();else if(SCENE_RADIO.kind==='online')sceneRadioOnline(true)}return}
 RADIO.blocked=false;if((!radioLive())&&(PL.car||RADIO.preview))radioPlay()}
function radioLabel(show,h){const L=RADIO.label;if(!show){L.hidden=true;RADIO.lastLbl=null;return}const now=performance.now();if(h!==RADIO.lastLbl){RADIO.lastLbl=h;L.innerHTML=h;RADIO.lblT=now}L.hidden=false;L.style.opacity=now-RADIO.lblT>5000?0:1}
function updateRadio(){if(STORYFAIL.active){RADIO.el.pause();stopLive();RADIO.label.hidden=true;return}if(RADIO.sceneActive){mallFxSet(false);return}if(musicBus)musicBus.gain.value=S.sound?1.1*VOL.master*VOL.music*MUS_K*musicTravelFactor():0;if(RADIO.worldSeen!==radioWorld()&&(RADIO.srv.length||RADIO.custom.length))rebuildRadio();const el=RADIO.el,inCar=radioVeh()&&!menuOpen&&running;
 if(radioLive()){mallFxSet(false);if(!el.paused)el.pause();const L=RADIO.live,want=(inCar||RADIO.preview)&&!RADIO.userOff,now=performance.now();L.volume=S.sound?Math.min(1,.8*musVol()*1.25*musicTravelFactor()):0;
  if(want&&RADIO.livePending&&RADIO.liveTryAt&&now-RADIO.liveTryAt>12000){if(AUDIO_TEST.mode&&AUDIO_TEST.source==='online')audioPreviewLocalFallback();else radioLiveFallback();return}
  if(want&&RADIO.liveStalledAt&&now-RADIO.liveStalledAt>12000){if(AUDIO_TEST.mode&&AUDIO_TEST.source==='online')audioPreviewLocalFallback();else radioLiveFallback();return}
  if(want&&L.paused&&!RADIO.livePending&&!RADIO.blocked&&now-RADIO.liveErrT>8000&&now-(RADIO.tryT||0)>1500){
   RADIO.tryT=now;RADIO.liveTryAt=now;RADIO.livePending=true;RADIO.liveConfirmed=false;RADIO.liveStalledAt=0;
   L.src=LIVE_URL+'?t='+Date.now();const pr=L.play();if(pr&&pr.catch)pr.catch(e=>{
    if(e&&e.name==='AbortError')return;
    RADIO.livePending=false;
    if(e&&e.name==='NotAllowedError'){RADIO.blocked=true;setRadioStatus('O navegador bloqueou o som: clique na tela')}
    else radioLiveFallback()
   })
  }else if(!want)stopLive();
  radioLabel(!!radioVeh(),RADIO.userOff?'RÁDIO <b>DESLIGADO</b> · Q':RADIO.blocked?'RÁDIO <b>BLOQUEADO</b> · clique':'RÁDIO <b>KRFM · AO VIVO</b> · Q');return}
 stopLive();
 // A pé volta sempre para a trilha do mundo; ao entrar num veículo, volta a rádio que estava no carro.
 {const W0=radioWorld(),ost=RADIO.list.findIndex(s=>s.world===W0);if(ost>=0&&running&&!menuOpen&&(!PL.inside||W0==='mall')){const cur0=RADIO.list[RADIO.idx];
  if(!radioVeh()&&RADIO.idx!==ost){if(cur0)RADIO.carSt=cur0;RADIO.idx=ost;RADIO.err='';loadStation();if(!RADIO.userOff)radioPlay()}
  else if(radioVeh()&&RADIO.carSt){const k=RADIO.list.indexOf(RADIO.carSt);RADIO.carSt=null;if(k>=0&&k!==RADIO.idx){RADIO.idx=k;RADIO.err='';loadStation();if(!RADIO.userOff)radioPlay()}}}}
 if(inCar&&RADIO.idx<0&&!RADIO.userOff&&RADIO.list.length&&!RADIO.autoDone){RADIO.autoDone=true;RADIO.idx=0;loadStation();radioPlay();toast('RÁDIO · '+RADIO.list[RADIO.idx].name)}
 const cur=RADIO.list[RADIO.idx],W1=radioWorld(),ambient=!!(cur&&cur.world&&cur.world===W1&&running&&!menuOpen&&(!PL.inside||W1==='mall')&&!radioVeh()),amb=ambient?(W1==='mall'?.8*VOL.interior/.7:.6):1;mallFxSet(!!(cur&&cur.world==='mall'));
 const want=(inCar||ambient||RADIO.preview)&&RADIO.idx>=0&&!RADIO.userOff;el.volume=S.sound?(RADIO.routed?1:.75*musVol()*amb*musicTravelFactor()):0;if(RADIO.routed&&RADIO.gain){if(RADIO.gainBase==null)RADIO.gainBase=RADIO.gain.gain.value;RADIO.gain.gain.value=RADIO.gainBase*amb}
 if(want&&el.paused&&!RADIO.err&&!RADIO.blocked){const now=performance.now();if(now-(RADIO.tryT||0)>700){RADIO.tryT=now;radioPlay()}}else if(!want&&!el.paused)el.pause();
 const show=!!(radioVeh()&&(RADIO.list.length||RADIO.liveDown));radioLabel(show,!show?'':RADIO.liveDown&&RADIO.idx<0?'RÁDIO <b>KRFM OFFLINE</b> · sem músicas':RADIO.idx<0?'RÁDIO <b>DESLIGADO</b> · Q':RADIO.err?'RÁDIO <b>ERRO</b> · '+RADIO.err:RADIO.blocked?'RÁDIO <b>BLOQUEADO</b> · clique ou Q':'RÁDIO <b>'+RADIO.list[RADIO.idx].name+'</b> · Q')}
// Testes de volume na aba ÁUDIO: cada botao alterna entre tocar e pausar.
// O teste geral combina exatamente a mesma musica e o mesmo efeito, mas usa o volume geral.
const AUDIO_TEST={mode:'',source:'',pending:false,localFallback:false,onlineConfirmed:false,onlineTimer:null,tracks:[],index:0,fx:null};
function audioPreviewButtons(){
 for(const [id,mode,on,off] of [
  ['radioTest','music','PAUSAR RÁDIO','TESTAR RÁDIO'],
  ['vol_sfx_test','sfx','PAUSAR EFEITOS','TESTAR EFEITOS'],
  ['vol_master_test','master','PAUSAR GERAL','TESTAR GERAL']]){
  const b=$('#'+id);b.textContent=AUDIO_TEST.mode===mode?on:off;b.setAttribute('aria-pressed',String(AUDIO_TEST.mode===mode));
 }
}
function audioPreviewStop(){
 const P=AUDIO_TEST,wasPreview=!!(P.mode||P.pending||RADIO.preview);
 P.pending=false;P.mode='';P.source='';P.tracks=[];P.index=0;P.localFallback=false;P.onlineConfirmed=false;if(P.onlineTimer){clearTimeout(P.onlineTimer);P.onlineTimer=null}
 if(wasPreview){RADIO.preview=false;RADIO.el.pause();stopLive();}
 if(P.fx){const f=P.fx;P.fx=null;try{const t=AC.currentTime;f.g.gain.cancelScheduledValues(t);f.g.gain.setTargetAtTime(0,t,.025);f.carrier.stop(t+.12);f.lfo.stop(t+.12)}catch(e){}}
 setRadioStatus('');audioPreviewButtons();
}
function audioPreviewSfx(){
 if(!AC)return;
 // Sirene sintetica em 2 osciladores: nao carrega nenhum audio nem cria geometria.
 const t=AC.currentTime,carrier=AC.createOscillator(),lfo=AC.createOscillator(),depth=AC.createGain(),g=AC.createGain();
 carrier.type='sawtooth';carrier.frequency.value=610;lfo.type='sine';lfo.frequency.value=1.05;depth.gain.value=190;
 lfo.connect(depth);depth.connect(carrier.frequency);carrier.connect(g);g.connect(master);
 g.gain.setValueAtTime(0,t);g.gain.setTargetAtTime(.17,t,.07);carrier.start(t);lfo.start(t);
 AUDIO_TEST.fx={carrier,lfo,g};
}
function audioPreviewLocalFallback(){
 const P=AUDIO_TEST;if(!P.mode||P.source!=='online')return;
 if(P.onlineTimer){clearTimeout(P.onlineTimer);P.onlineTimer=null}
 stopLive();P.source='';P.onlineConfirmed=false;P.localFallback=true;
 audioPreviewStartMusic(false,true)
}
function audioPreviewOnline(){
 const P=AUDIO_TEST;P.pending=false;P.source='online';P.localFallback=false;P.onlineConfirmed=false;RADIO.preview=true;
 const L=RADIO.live;stopLive();L.src=LIVE_URL;applyVolumes();
 setRadioStatus('Tentando rádio online · KRFM…');
 P.onlineTimer=setTimeout(()=>{if(P.mode&&P.source==='online'&&!P.onlineConfirmed)audioPreviewLocalFallback()},12000);
 const result=L.play();if(result&&result.catch)result.catch(e=>{
  if(!P.mode||P.source!=='online'||e?.name==='AbortError')return;
  if(e?.name==='NotAllowedError'){audioPreviewStop();setRadioStatus('Som bloqueado pelo navegador: clique novamente no teste');return}
  audioPreviewLocalFallback()
 });
}
function audioPreviewStartMusic(skip=false,fallback=false){
 const P=AUDIO_TEST;if(!P.mode||P.mode==='sfx')return;
 if(!skip&&!fallback&&RADIO.mode==='live')return audioPreviewOnline();
 if(!RADIO.probeDone){
  P.pending=true;P.localFallback=!!fallback;setRadioStatus('Preparando as músicas do servidor…');return
 }
 P.pending=false;
 if(!skip){
  // Primeiro arquivos hospedados em radios/; apenas depois os uploads do navegador.
  const stations=RADIO.mode==='custom'&&!fallback?[]:RADIO.srv.filter(st=>st.songs&&st.songs.length&&st.world!=='mall');
  if(RADIO.custom.length&&RADIO.mine)stations.push(RADIO.mine);
  P.tracks=[];
  for(const st of stations){if(!st.order||st.order.length!==st.songs.length)st.order=st.songs.map((_,i)=>i);
   for(let j=0;j<st.order.length;j++){const song=st.songs[st.order[(st.pos+j)%st.order.length]];if(song)P.tracks.push({st,song})}}
  P.index=0;
 }
 if(P.index>=P.tracks.length){RADIO.el.pause();P.source='failed';setRadioStatus('KRFM offline · nenhuma música disponível no servidor ou navegador');return}
 const {st,song}=P.tracks[P.index++],idx=RADIO.list.indexOf(st);
 if(idx>=0)RADIO.idx=idx;
 RADIO.err='';RADIO.preview=true;P.source='local';
 if(RADIO.el.dataset.url!==song.url){RADIO.el.dataset.url=song.url;RADIO.el.src=encodeURI(decodeURI(song.url));RADIO.el.load()}
 applyVolumes();setRadioStatus('Testando: '+st.name+' · '+song.name);
 const result=RADIO.el.play();if(result&&result.catch)result.catch(e=>{
  if(!P.mode||P.source!=='local'||RADIO.el.dataset.url!==song.url||e?.name==='AbortError')return;
  if(e?.name==='NotAllowedError'){audioPreviewStop();setRadioStatus('Som bloqueado pelo navegador: clique novamente no teste');return}
  audioPreviewStartMusic(true,true);
 });
}
function audioPreviewToggle(mode){
 if(AUDIO_TEST.mode===mode){audioPreviewStop();return}
 audioPreviewStop();
 if(!S.sound){setRadioStatus('Ative SOM LIGADO para testar');return}
 initAudio();try{AC?.resume()}catch(e){}
 AUDIO_TEST.mode=mode;audioPreviewButtons();
 if(mode==='sfx'||mode==='master')audioPreviewSfx();
 if(mode==='music'||mode==='master')audioPreviewStartMusic();
}
$('#radioTest').addEventListener('click',()=>audioPreviewToggle('music'));
$('#vol_sfx_test').addEventListener('click',()=>audioPreviewToggle('sfx'));
$('#vol_master_test').addEventListener('click',()=>audioPreviewToggle('master'));
addEventListener('pointerdown',()=>{if(RADIO.blocked)radioKick()});
// v275: o scroll em veículo seleciona armas de drive-by; rádio permanece no Q ou , / .
addEventListener('wheel',e=>{if(WHL.open==='wpn'&&Math.abs(e.deltaY)>=20){wheelPage(e.deltaY>0?1:-1);return}if(menuOpen||!played||NAV.open||WHL.open||Math.abs(e.deltaY)<20)return;
 if(PL.heli||PL.taxi)return;
 const now=performance.now();if(now-(GUN.wt||0)>200){GUN.wt=now;gunCycle(e.deltaY>0?1:-1)}
},{passive:true});
probeRadios();
/* Cinema: chegada e créditos tentam KRFM online antes de radios/ e arquivos do browser.
   Clube mantém sua estação local preferencial. Reaproveita RADIO.el e RADIO.live. */
const SCENE_RADIO={active:false,scene:'',kind:'off',wait:0,elapsed:0,fadeTotal:0,fadeLeft:0,
 confirmed:false,blocked:false,onlineFailed:false,onlineStallAt:0,station:null,currentSong:null,introSong:null,bad:new Set()};
function sceneRadioNormalize(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function sceneRadioStation(){return RADIO.srv.find(st=>sceneRadioNormalize(st.name)==='FLASHBACKFM'&&st.songs&&st.songs.length)||null}
function sceneRadioEnsureOrder(st){if(st.order&&st.order.length===st.songs.length)return;
 st.order=st.songs.map((_,i)=>i);for(let i=st.order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[st.order[i],st.order[j]]=[st.order[j],st.order[i]]}
 st.pos=Math.floor(Math.random()*st.songs.length)}
function sceneRadioSelect(st){const M=SCENE_RADIO,n=st.songs.length;sceneRadioEnsureOrder(st);
 const begin=((st.pos%n)+n)%n;
 for(let k=0;k<n;k++){st.pos=(begin+k)%n;const song=radioSong(st);if(!song||!song.url||M.bad.has(song.url))continue;
  if(M.scene==='credits'&&M.introSong&&n>1&&song.url===M.introSong)continue;
  return song}
 st.pos=begin;return null}
function sceneRadioLocalStations(){
 // Prioridade de arquivos: Flashback FM do servidor, outras estações do servidor, minhas músicas do navegador.
 const flash=sceneRadioStation(),others=RADIO.srv.filter(st=>st!==flash&&st.songs&&st.songs.length&&st.world!=='mall');
 return [...(flash?[flash]:[]),...others,...(RADIO.custom.length&&RADIO.mine?[RADIO.mine]:[])]
}
function sceneRadioTuneLocal(){const M=SCENE_RADIO;if(!M.active)return false;
 for(const st of sceneRadioLocalStations()){
  M.station=st;const song=sceneRadioSelect(st);if(!song)continue;
  RADIO.sceneStation=st;M.kind='local';M.elapsed=0;M.confirmed=false;M.blocked=false;M.currentSong=song.url;
  RADIO.err='';RADIO.blocked=false;loadStation();radioPlay();return true
 }
 M.station=null;return false
}
function sceneRadioOnline(){const M=SCENE_RADIO;if(!M.active)return;
 M.kind='online';M.station=null;M.currentSong=null;M.elapsed=0;M.confirmed=false;M.blocked=false;M.onlineStallAt=0;
 RADIO.sceneStation=null;RADIO.el.pause();stopLive();
 const el=RADIO.live;el.src=LIVE_URL+'?t='+Date.now();el.volume=S.sound?Math.min(1,.8*musVol()*1.25):0;
 try{const pr=el.play();if(pr&&pr.catch)pr.catch(e=>{
  if(!M.active||M.kind!=='online'||e&&e.name==='AbortError')return;
  if(e&&e.name==='NotAllowedError'){M.blocked=true;RADIO.blocked=true;return}sceneRadioOnlineFailed()})}
 catch(e){sceneRadioOnlineFailed()}
}
function sceneRadioOnlineFailed(){const M=SCENE_RADIO;if(!M.active||M.kind!=='online')return;
 M.onlineFailed=true;M.kind='waiting';M.wait=0;M.confirmed=false;M.onlineStallAt=0;
 stopLive();if(RADIO.probeDone&&!sceneRadioTuneLocal())sceneRadioSilence()
}
function sceneRadioSilence(){const M=SCENE_RADIO;if(!M.active)return;
 M.kind='silent';M.confirmed=false;M.station=null;RADIO.sceneStation=null;RADIO.el.pause();stopLive()}
function sceneRadioLocalFailed(){const M=SCENE_RADIO;if(!M.active||M.kind!=='local'||M.fadeTotal)return;
 if(M.currentSong)M.bad.add(M.currentSong);
 if(sceneRadioTuneLocal())return;
 if(!M.onlineFailed&&M.scene==='club')sceneRadioOnline();else sceneRadioSilence()
}
function sceneRadioPlayRejected(e){const M=SCENE_RADIO;if(!M.active||M.kind!=='local'||e&&e.name==='AbortError')return;
 if(e&&e.name==='NotAllowedError'){M.blocked=true;RADIO.blocked=true;return}
 sceneRadioLocalFailed()}
function sceneRadioLocalPlaying(){const M=SCENE_RADIO;if(!M.active||M.kind!=='local'||RADIO.el.dataset.url!==M.currentSong)return;
 M.confirmed=true;M.blocked=false;M.elapsed=0;
 if(M.scene==='arrival'&&M.currentSong)M.introSong=M.currentSong}
function sceneRadioNaturalEnd(){const M=SCENE_RADIO;if(!M.active||M.kind!=='local'||M.fadeTotal)return;
 const st=M.station;if(!st||!st.songs.length){sceneRadioLocalFailed();return}
 st.pos=(st.pos+1)%st.songs.length;M.bad.clear();
 if(!sceneRadioTuneLocal()){if(!M.onlineFailed&&M.scene==='club')sceneRadioOnline();else sceneRadioSilence();return}
 // Se o proximo arquivo for o mesmo, recomecar como no radio original do carro.
 if(RADIO.el.dataset.url===M.currentSong&&RADIO.el.ended)try{RADIO.el.currentTime=0;radioPlay()}catch(e){}
}
function sceneRadioStart(scene){sceneRadioStop();const M=SCENE_RADIO;
 M.active=true;M.scene=scene;M.kind='waiting';M.wait=0;M.bad.clear();M.elapsed=0;M.fadeLeft=0;M.fadeTotal=0;M.onlineFailed=false;M.onlineStallAt=0;
 RADIO.sceneActive=true;RADIO.sceneStation=null;RADIO.el.pause();stopLive();
 // v78: a danceteria segue a mesma ordem das outras cenas: KRFM ao vivo → estações do servidor (Flashback FM primeiro)
 // → MP3 que o jogador anexou no navegador. Antes ela tentava os arquivos locais primeiro e só ia ao vivo sem nenhum.
 sceneRadioOnline()}
function sceneRadioStop(){const M=SCENE_RADIO;if(!M.active)return;
 M.active=false;M.kind='off';M.scene='';M.station=null;M.blocked=false;M.currentSong=null;M.fadeTotal=0;M.fadeLeft=0;M.bad.clear();
 RADIO.el.pause();stopLive();RADIO.sceneActive=false;RADIO.sceneStation=null;
 RADIO.blocked=false;RADIO.err='';RADIO.el.dataset.url='';
 if(RADIO.idx>=0&&!radioLive())loadStation();else{RADIO.el.removeAttribute('src');try{RADIO.el.load()}catch(e){}}
}
function sceneRadioFade(seconds=1){const M=SCENE_RADIO;if(!M.active)return;M.fadeTotal=Math.max(.05,seconds);M.fadeLeft=M.fadeTotal}
function sceneRadioTick(dt){const M=SCENE_RADIO;if(!M.active)return;
 if(M.kind==='waiting'){M.wait+=dt;
  // Quando a KRFM falha, esperar a pesquisa do servidor e somente então os uploads locais.
  if(M.onlineFailed){if(RADIO.probeDone&&!sceneRadioTuneLocal())sceneRadioSilence()}
  else if(!sceneRadioTuneLocal()&&(RADIO.probeDone||M.wait>=18))sceneRadioOnline();
 }else if(M.kind==='local'||M.kind==='online'){
  M.elapsed+=dt;
  if(!M.confirmed&&!M.blocked&&M.elapsed>12){
   if(M.kind==='local')sceneRadioLocalFailed();else sceneRadioOnlineFailed();
  }
  if(M.kind==='online'&&M.onlineStallAt&&performance.now()-M.onlineStallAt>12000)sceneRadioOnlineFailed();
 }
 let fade=1;if(M.fadeTotal){M.fadeLeft=Math.max(0,M.fadeLeft-dt);fade=M.fadeLeft/M.fadeTotal;
  if(M.fadeLeft<=0){sceneRadioStop();return}}
 // Mesmo ganho/EQ e configuracao da radio dos carros: unica fonte RADIO.el.
 if(M.kind==='local'){
  if(musicBus)musicBus.gain.value=S.sound?1.1*VOL.master*VOL.music*MUS_K:0;
  RADIO.el.volume=S.sound?(RADIO.routed?1:.75*musVol())*fade:0;
 }else if(M.kind==='online')RADIO.live.volume=S.sound?Math.min(1,.8*musVol()*1.25)*fade:0;
}
RADIO.live.addEventListener('playing',()=>{if(SCENE_RADIO.active&&SCENE_RADIO.kind==='online'){SCENE_RADIO.confirmed=true;SCENE_RADIO.onlineStallAt=0}});
RADIO.live.addEventListener('waiting',()=>{if(SCENE_RADIO.active&&SCENE_RADIO.kind==='online'&&!SCENE_RADIO.onlineStallAt)SCENE_RADIO.onlineStallAt=performance.now()});
RADIO.live.addEventListener('error',()=>{if(SCENE_RADIO.active&&SCENE_RADIO.kind==='online')sceneRadioOnlineFailed()});
try{const m=localStorage.getItem('ps_radio');if(m==='all'||m==='custom'||m==='live')setRadioMode(m)}catch(e){}

// Perfis de motor por tipo de veículo (dois osciladores + filtro): timbre, faixa de rotação, marchas e volume diferentes.
// Cada carro ainda ganha uma variação própria de ±6% (pelo id), então dois sedãs não soam idênticos. Turbo e nitro mudam o som.
const ENG_PROF={
 car:{o1:'triangle',o2:'sawtooth',r2:.5,base:48,rk:85,gk:10,ld:14,gears:5,gs:11,fb:500,fr:900,fl:400,q:1,g0:.07,g1:.05,lag:.05},
 small:{o1:'triangle',o2:'sawtooth',r2:.5,base:58,rk:95,gk:12,ld:16,gears:5,gs:10,fb:650,fr:1000,fl:400,q:1.4,g0:.06,g1:.045,lag:.04},
 sport:{o1:'sawtooth',o2:'sawtooth',r2:.5,base:62,rk:120,gk:14,ld:20,gears:6,gs:12,fb:800,fr:1500,fl:700,q:2,g0:.075,g1:.06,lag:.035},
 super:{o1:'sawtooth',o2:'square',r2:.25,base:72,rk:150,gk:16,ld:26,gears:6,gs:15,fb:1000,fr:2000,fl:900,q:3,g0:.08,g1:.065,lag:.03},
 heavy:{o1:'triangle',o2:'sawtooth',r2:.5,base:40,rk:62,gk:7,ld:10,gears:5,gs:10,fb:380,fr:600,fl:250,q:1.2,g0:.08,g1:.05,lag:.07},
 truck:{o1:'triangle',o2:'sawtooth',r2:.5,base:26,rk:40,gk:5,ld:8,gears:7,gs:6,fb:260,fr:380,fl:180,q:.8,g0:.11,g1:.05,lag:.1},
 moto:{o1:'sawtooth',o2:'square',r2:2,base:78,rk:170,gk:14,ld:24,gears:5,gs:10,fb:1200,fr:2200,fl:800,q:3,g0:.06,g1:.06,lag:.025},
 boat:{o1:'sine',o2:'sawtooth',r2:.5,base:34,rk:52,gk:5,ld:10,gears:0,gs:1,fb:300,fr:500,fl:200,q:1,g0:.08,g1:.05,lag:.12,wob:9,wa:3},
 jet:{o1:'sawtooth',o2:'square',r2:1.5,base:70,rk:120,gk:10,ld:18,gears:0,gs:1,fb:900,fr:1800,fl:600,q:2,g0:.06,g1:.06,lag:.05,wob:14,wa:5},
 hover:{o1:'triangle',o2:'sawtooth',r2:4,base:32,rk:30,gk:4,ld:8,gears:0,gs:1,fb:1400,fr:1200,fl:400,q:4,g0:.07,g1:.04,lag:.15}};
const ENG_OF={sedan:'car',taxi:'car',wagon:'car',police:'sport',hatch:'small',mini:'small',sports:'sport',conv:'sport',roadster:'sport',super:'super',suv:'heavy',crossover:'heavy',pickup:'heavy',van:'heavy',truck:'truck',bus:'truck',moto:'moto',boat:'boat',jetski:'jet',vortex:'hover'};
const ENG_GEARS=6;
function engProf(c){return ENG_PROF[ENG_OF[c.type]||'car']}
// v284: bancos de harmônicos reutilizados, mantendo os dois osciladores existentes.
const ENGINE_WAVES=new Map();let engineWaveKind=null;
/* r41: perfis do motor por tipo: cilindros, marcha lenta e corte (rpm), sub-oitava, ruído grave, "lope" (irregularidade do V8/V2),
   passa-baixa (base, +acelerador, +rotação), ressonância do escapamento (Hz, dB) e volume (base, +acelerador). */
const ENG2={
 car:{cyl:4,idle:850,red:6200,sub:.45,rum:.22,lope:.12,lp0:220,lpL:520,lpR:380,q:.9,res:92,resG:6,g0:.1,g1:.06,drive:.55},
 small:{cyl:3,idle:950,red:6500,sub:.32,rum:.2,lope:.28,lp0:250,lpL:560,lpR:420,q:1,res:118,resG:5,g0:.09,g1:.06,drive:.6},
 sport:{cyl:8,idle:680,red:4800,sub:.62,rum:.42,lope:.38,lp0:190,lpL:560,lpR:420,q:1.15,res:82,resG:9,g0:.11,g1:.08,drive:.75},
 super:{cyl:6,idle:850,red:6400,sub:.5,rum:.36,lope:.22,lp0:240,lpL:700,lpR:560,q:1.2,res:100,resG:8,g0:.11,g1:.08,drive:.8},
 heavy:{cyl:6,idle:700,red:5600,sub:.62,rum:.4,lope:.18,lp0:180,lpL:640,lpR:440,q:.9,res:78,resG:8,g0:.11,g1:.07,drive:.6},
 truck:{cyl:6,idle:600,red:2600,sub:.75,rum:.62,lope:.1,lp0:150,lpL:520,lpR:300,q:.8,res:62,resG:9,g0:.13,g1:.07,drive:.7},
 moto:{cyl:2,idle:1100,red:8500,sub:.42,rum:.5,lope:.55,lp0:260,lpL:820,lpR:640,q:1.3,res:110,resG:6,g0:.1,g1:.08,drive:.85},
 boat:{cyl:8,idle:650,red:5200,sub:.6,rum:.55,lope:.3,lp0:170,lpL:600,lpR:420,q:.9,res:70,resG:8,g0:.11,g1:.07,drive:.6,wob:6,wa:.03},
 jet:{cyl:2,idle:1700,red:8200,sub:.25,rum:.3,lope:.2,lp0:450,lpL:1600,lpR:1200,q:1.4,res:160,resG:4,g0:.08,g1:.07,drive:.8,wob:12,wa:.04},
 hover:{cyl:6,idle:1300,red:4200,sub:.35,rum:.7,lope:.05,lp0:600,lpL:900,lpR:600,q:2,res:140,resG:3,g0:.08,g1:.05,drive:.4}};
function engineWave(kind,layer){
 const key=kind+layer;if(ENGINE_WAVES.has(key))return ENGINE_WAVES.get(key);
 if(layer===0&&ENG2[kind]){/* trem de pulsos das explosões: harmônicos caindo rápido, pares/ímpares conforme o tipo (V8 cheio, I4 mais "liso", V2 batendo) */
  const P=ENG2[kind],re=new Float32Array(25),im=new Float32Array(25);for(let h=1;h<25;h++){const odd=h%2;im[h]=Math.exp(-h*.11)/Math.pow(h,1.05)*(odd?1:(P.cyl>=8?.85:P.cyl<=2?1.1:.6));re[h]=(P.lope*.4)*Math.exp(-h*.2)/h}
  const wave=AC.createPeriodicWave(re,im);ENGINE_WAVES.set(key,wave);return wave}
 const re=new Float32Array(33),im=new Float32Array(33);
 const heavy=kind==='truck'||kind==='heavy',sport=kind==='sport'||kind==='super'||kind==='moto';
 for(let h=1;h<33;h++){
  const firing=heavy?3:sport?4:2;
  const pulse=Math.exp(-h*(layer?.16:.10));
  im[h]=pulse*(h%firing===0?1:.23)/(Math.pow(h,heavy?.68:.85));
  if(layer)im[h]*=h%2?.7:1;
 }
 const wave=AC.createPeriodicWave(re,im);ENGINE_WAVES.set(key,wave);return wave;
}
// v270: áudio espacial é compartilhado entre sirene, rádio externo e NPCs;
// orientação não deve depender de haver alguma rádio configurada.
const AUDIO_FW=new THREE.Vector3(),AUDIO_UP=new THREE.Vector3();
function syncSpatialListener(){
 if(!AC)return;const top=camMode==='top',c=camera.position,pc=PL.car||PL;
 AUDIO_FW.set(0,0,-1);AUDIO_UP.set(0,1,0);
 if(!top){AUDIO_FW.applyQuaternion(camera.quaternion);AUDIO_UP.applyQuaternion(camera.quaternion)}
 const x=top||PL.car?pc.x:c.x,y=top||PL.car?2:c.y,z=top||PL.car?pc.z:c.z,L=AC.listener;
 if(L.positionX){L.positionX.value=x;L.positionY.value=y;L.positionZ.value=z;L.forwardX.value=AUDIO_FW.x;L.forwardY.value=AUDIO_FW.y;L.forwardZ.value=AUDIO_FW.z;L.upX.value=AUDIO_UP.x;L.upY.value=AUDIO_UP.y;L.upZ.value=AUDIO_UP.z}
 else{L.setPosition(x,y,z);L.setOrientation(AUDIO_FW.x,AUDIO_FW.y,AUDIO_FW.z,AUDIO_UP.x,AUDIO_UP.y,AUDIO_UP.z)}
}
/* ================= v78 · FUNÇÕES COMUNS (ver CLAUDE.md → "Armadilhas") =================
   Use estas em vez de repetir o código; cada uma resolve um bug que já apareceu mais de uma vez. */
// Mostra e posiciona um ator AGORA (jogador ou ped). Diálogos/cutscenes pausam updatePlayer/updatePeds:
// sem isto o sprite fica invisível ou na posição antiga até a conversa acabar (v43 aeroporto, v78 prisão).
function actorShowNow(o,mx,mz){if(!o||!o.sp)return;if(mx!=null){o.face=[mx,mz];o.mx=mx;o.mz=mz}
 o.sp.visible=true;if(o.sh)o.sh.visible=true;o.jy=o.jv=0;o.rot=0;
 const f=o.face||[o.mx||0,o.mz||1];setFrame(o.tex,pickDir(f[0],f[1],o.x,o.z),0);placeSprite(o)}
// Armas do jogador por quadro. Precisa rodar no mundo aberto (update) E nos interiores com palco
// (roomStageLocalTick); antes só rodava em update() e a arma travava após o 1º tiro nos interiores.
function weaponTick(dt){updateTracers(dt);GUN.cd-=dt;if(GUN.firing&&GUN.cd<=0)playerShoot((TOUCH.on||PAD.firing)&&camMode==='top');updateRockets(dt)}
// Corte de áudio de transição que NÃO derruba o rádio de cena já ligado (danceteria etc.).
function audioCutKeepScene(){const k=SCENE_RADIO.active?SCENE_RADIO.kind:null;transitionAudioStop();return k}
function sceneRadioResume(k){if(k==='online')sceneRadioOnline();else if(k==='local'){if(!sceneRadioTuneLocal())sceneRadioOnline()}}
// Continuous sources outlive the world tick; mute them at scene boundaries.
/* v78 · OST de cena (pasta radios/OST, fora da roda de rádios): "Corredor Sem Luz" = suspense.
   Envelope linear (entra/sai em segundos), em loop até alguém mandar parar. Enquanto toca, rádios/cenas abaixam (ostDuck entra no musicTravelFactor).
   Usos: Claire na cela (entra ao chegar, sai ao fim do diálogo com a colega) e chegada ao motel na missão 1 (sai quando o rosto da Claire aparece). */
var OSTM={el:null,key:'',want:0,env:0,rate:.4,paused:false};
const OST_FILES={suspense:'radios/OST/corredor_sem_luz.mp3'};
function ostDuck(){return OSTM&&OSTM.env>0?1-.85*OSTM.env:1}
function ostPlay(key,track='suspense',fadeIn=2.5){const M=OSTM;if(M.key===key&&M.want===1)return;
 if(!M.el){M.el=new Audio();M.el.loop=true;M.el.preload='auto'}
 const url=new URL(OST_FILES[track],location.href).href;if(M.el.src!==url){M.el.src=url;M.env=0}
 M.key=key;M.want=1;M.rate=1/Math.max(.05,fadeIn);if(M.el.paused){M.el.volume=0;const pr=M.el.play();if(pr&&pr.catch)pr.catch(()=>{})}}
function ostStop(fadeOut=3,key){const M=OSTM;if(!M.key||(key&&M.key!==key))return;M.want=0;M.rate=1/Math.max(.05,fadeOut);if(fadeOut<=0){M.env=0;M.key='';if(M.el)M.el.pause();applyVolumes()}}
function ostTick(){const M=OSTM,now=performance.now(),dt=Math.min(.25,Math.max(0,(now-(M.last||now))/1000));M.last=now;if(!M.el||!M.key)return; /* relógio real: não acompanha câmera lenta nem dt limitado */
 if(menuOpen){if(!M.el.paused){M.el.pause();M.paused=true}return}if(M.paused){M.paused=false;const pr=M.el.play();if(pr&&pr.catch)pr.catch(()=>{})}
 const d=M.want-M.env;M.env=d>0?Math.min(1,M.env+M.rate*dt):Math.max(0,M.env-M.rate*dt);
 M.el.volume=S.sound?Math.min(1,.75*musVol()*musicTravelFactor0()*M.env):0;applyVolumes();
 if(M.want===0&&M.env<=0){M.el.pause();M.key=''}}
function transitionAudioStop(){
 boomStop();RADIO.el.pause();stopLive();RADIO.label.hidden=true;
 if(!AC)return;const t=AC.currentTime;
 const zero=n=>{if(n?.gain){n.gain.cancelScheduledValues(t);n.gain.setTargetAtTime(0,t,.035)}};
 zero(engG);zero(scrG);if(POL.siren)zero(POL.siren.g);
 const mute=s=>{if(s?.g)zero(s.g)};
 for(const c of vehicles)mute(c.snd);for(const h of HELI.list)mute(h.snd);
 if(HELI.cur)mute(HELI.cur.snd);if(COPH.h)mute(COPH.h.snd);
 for(const slot of SKY.slots)if(slot.o)mute(slot.o.snd);
 airSoundReset();
}
function updateAudio(dt){hornTick();updateRadio();if(!AC)return;const t=AC.currentTime;syncSpatialListener();boomUpdate(dt||0);sirenUpdate();
 if(menuOpen){// pausado: os ticks de helicóptero/avião não rodam, então zera os loops aqui
  const mute=s=>{if(s&&s.g)s.g.gain.setTargetAtTime(0,t,.05)};for(const h of HELI.list)mute(h.snd);if(HELI.cur)mute(HELI.cur.snd);if(typeof COPH!=='undefined'&&COPH.h)mute(COPH.h.snd);for(const sl of SKY.slots)if(sl.o)mute(sl.o.snd);for(const v of vehicles)mute(v.snd)}
 if(PL.car&&!menuOpen&&!TIMEJUMP.mute){const c=PL.car,E=engProf(c),sp=Math.abs(c.fwd),vt=c.vt||(c.vt=soundVary(1,.06,(((c.id*2654435761)>>>0)%1000)/1000));
  const rev=c.fwd<-.3;let gear=0,rpm;if(rev)rpm=Math.min(1.6,-c.fwd/REV_MAX);else{const GR=engGear(c,sp);gear=GR[0];rpm=GR[1]} /* v3 r39: ré = marcha única, giro sobe até o corte a 30 km/h */ /* v79r14: todo veículo (carro, moto, lancha, jet ski, hovercraft) troca 5 marchas até ~70% da vel. máx.; a 6ª fica contínua */
  const a=c._audio284||(c._audio284={load:0,gear,ramp:0});a.load+=((c.thr<0&&c.fwd<.8?-c.thr:Math.max(0,c.thr))-a.load)*(1-Math.exp(-Math.min(.1,dt||0)*9));if(a.gear!==gear){a.gear=gear;a.ramp=.14}a.ramp=Math.max(0,a.ramp-(dt||0));const load=a.load,idle=sp<1.2?Math.sin(t*7.2+c.id)*1.35:0,f=c.alive?(E.base+rpm*E.rk+gear*E.gk+load*E.ld+idle)*vt*(c.turbo?1.06:1)*(c.nitro?1.12:1):0;
  const kind=ENG_OF[c.type]||'car',P=ENG2[kind]||ENG2.car;if(engineWaveKind!==kind){engineWaveKind=kind;engO1.setPeriodicWave(engineWave(kind,0))}
  /* rotação: lenta + acelerador em ponto morto; andando, a faixa da marcha (engGear) vai de ~22% a 100% do giro */
  const rf=sp<1.2?load*.42+Math.max(0,idle)*.01:.22+.78*Math.min(1,Math.max(0,rpm)),rpmV=(P.idle+(P.red-P.idle)*rf)*vt*(c.turbo?1.04:1)*(c.nitro?1.06:1),ff=c.alive?rpmV/60*P.cyl/2:0,crank=rpmV/60;
  const wob=P.wob?1+Math.sin(t*P.wob)*P.wa:1;engO1.frequency.setTargetAtTime(ff*wob,t,.045);engO2.frequency.setTargetAtTime(ff*.5*wob,t,.05);engO3.frequency.setTargetAtTime(Math.max(4,crank*(P.cyl>=8?.5:1)),t,.06);
  engAMd.gain.setTargetAtTime(.25+P.lope*.7,t,.1);engMix2.gain.setTargetAtTime(P.sub*(1-.25*rf),t,.1);engMain.gain.setTargetAtTime(.32+P.drive*(.35+load*.65),t,.06);engRumG.gain.setTargetAtTime(c.alive?P.rum*(.45+load*.55):0,t,.08);
  engRes.frequency.setTargetAtTime(P.res*(1+rf*.35),t,.12);engRes.gain.setTargetAtTime(P.resG,t,.2);engF.frequency.setTargetAtTime((P.lp0+load*P.lpL+rf*P.lpR)*(c.turbo?1.2:1),t,.07);engF.Q.setTargetAtTime(P.q,t,.1);
  engG.gain.setTargetAtTime(c.alive?(P.g0+load*P.g1)*(1-.45*Math.sin(Math.PI*a.ramp/.14))*(RADIO.el.paused?1:.72):0,t,.06);const sl=Math.max(...c.ws);scrG.gain.setTargetAtTime(sl>3.5?Math.min(.16,(sl-3.5)*.022)*(c.dirt?.3:1):0,t,.05)}
 else{engG.gain.setTargetAtTime(0,t,.1);scrG.gain.setTargetAtTime(0,t,.1)}}
function horn(v=.3){if(!AC)return;const t=AC.currentTime;const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.42,t+.02);g.gain.setTargetAtTime(0,t+.38,.05);
 const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.Q.value=1.2;const pk=AC.createBiquadFilter();pk.type='peaking';pk.frequency.value=320;pk.gain.value=6;g.connect(lp);lp.connect(pk);pk.connect(master);
 for(const f of [196,247]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=(Math.random()-.5)*14;o.connect(g);o.start(t);o.stop(t+.62)}}
function sparkSound(v=1){if(!AC||!AC._noise)return;const t=AC.currentTime;const s=AC.createBufferSource();s.buffer=AC._noise;s.playbackRate.value=.55;const bp=AC.createBiquadFilter();bp.type='lowpass';bp.frequency.setValueAtTime(1400,t);bp.frequency.exponentialRampToValueAtTime(260,t+.22);
 const g=AC.createGain();g.gain.setValueAtTime(0,t);for(let k=0;k<5;k++){const tk=t+k*.035+Math.random()*.015;g.gain.setValueAtTime(.38*v*(1-k*.16),tk);g.gain.exponentialRampToValueAtTime(.02,tk+.03)}g.gain.exponentialRampToValueAtTime(.001,t+.26);
 s.connect(bp);bp.connect(g);g.connect(master);s.start(t,Math.random()*1.5);s.stop(t+.3)}
let lastCrash=0;function crashSound(v){if(!AC)return;const t=AC.currentTime;if(t-lastCrash<.08)return;lastCrash=t;const s=AC.createBufferSource();s.buffer=AC._noise;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g=AC.createGain();
 g.gain.setValueAtTime(Math.min(.6,v*.03),t);g.gain.exponentialRampToValueAtTime(.001,t+.35);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.4)}
function clang(v=1){if(!AC)return;const t=AC.currentTime;const g=AC.createGain();g.gain.setValueAtTime(.12*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);g.connect(master);
 for(const f of [820,1210,1630]){const o=AC.createOscillator();o.type='square';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.8,t+.4);o.connect(g);o.start(t);o.stop(t+.5)}}
function boomSound(dist){if(!AC)return;const t=AC.currentTime,vol=Math.max(.05,1-dist/180);const s=AC.createBufferSource();s.buffer=AC._noise;s.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1600,t);f.frequency.exponentialRampToValueAtTime(120,t+1.6);
 const g=AC.createGain();g.gain.setValueAtTime(.9*vol,t);g.gain.exponentialRampToValueAtTime(.001,t+1.8);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+1.9);
 const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(30,t+.8);const g2=AC.createGain();g2.gain.setValueAtTime(.8*vol,t);g2.gain.exponentialRampToValueAtTime(.001,t+1);o.connect(g2);g2.connect(master);o.start(t);o.stop(t+1.1)}
/* v79r14: pancada seca de porcelana (tacada e bola com bola): estalo de ruído agudo bem curto + 2 parciais inarmônicos que morrem em ~60 ms + corpo médio sem cauda */
function poolClack(v=1){if(!AC)return;const t=AC.currentTime;if(t-(AC._pcT||0)<.025)return;AC._pcT=t;v=Math.max(.05,Math.min(1,v));
 const s=AC.createBufferSource();s.buffer=AC._noise;s.playbackRate.value=1.6;const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=2200;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=3900;bp.Q.value=1.3;const gn=AC.createGain();gn.gain.setValueAtTime(.5*v,t);gn.gain.exponentialRampToValueAtTime(.001,t+.022);s.connect(hp);hp.connect(bp);bp.connect(gn);gn.connect(master);s.start(t,Math.random()*.5);s.stop(t+.03);
 for(const [f,a,d] of [[2630,.16,.06],[4170,.08,.04],[6020,.035,.025]]){const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(f*(.98+Math.random()*.04),t);const g=AC.createGain();g.gain.setValueAtTime(a*v,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.01)}
 const b=AC.createOscillator();b.type='triangle';b.frequency.setValueAtTime(1050,t);b.frequency.exponentialRampToValueAtTime(620,t+.03);const gb=AC.createGain();gb.gain.setValueAtTime(.14*v,t);gb.gain.exponentialRampToValueAtTime(.0005,t+.045);b.connect(gb);gb.connect(master);b.start(t);b.stop(t+.06)}
function thud(v){if(!AC)return;const t=AC.currentTime;const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.2);const g=AC.createGain();g.gain.setValueAtTime(Math.min(.5,v*.04),t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3)}

