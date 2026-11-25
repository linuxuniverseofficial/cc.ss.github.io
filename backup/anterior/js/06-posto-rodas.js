'use strict';
/* Coastal Chaos · js/06-posto-rodas.js — Soco, rodas de arma/rádio, zerinho, combustível, posto, conveniência, setas, perseguição.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v67: soco, rodas (arma/rádio), zerinho, combustível, posto + conveniência, zonas de procurado ================= */
const CTX={car:false,shop:false,club:false,txt:'',st:null};
const MELEE={cd:0,t:0,d:[0,1]};
function plDir(){if(camMode==='fps')return[-Math.sin(PL.yaw),-Math.cos(PL.yaw)];return PL.face}
function swingSnd(){if(!AC)return;const t=AC.currentTime,s=AC.createBufferSource();s.buffer=AC._noise;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(2600,t+.12);f.Q.value=1.4;const g=AC.createGain();g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.18)}
function punchSnd(){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator();o.type='square';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(48,t+.09);const g=AC.createGain();g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(master);o.start(t);o.stop(t+.13);
 const s=AC.createBufferSource();s.buffer=AC._noise;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g2=AC.createGain();g2.gain.setValueAtTime(.4,t);g2.gain.exponentialRampToValueAtTime(.001,t+.07);s.connect(f);f.connect(g2);g2.connect(master);s.start(t);s.stop(t+.08)}
function playerPunch(useMouse){if(PL.car||PL.heli||PL.dead||PL.down>0||menuOpen||MELEE.cd>0||WHL.open)return;initAudio();
 MELEE.cd=.42;MELEE.t=.22;let d=plDir();
 if(useMouse&&camMode==='top'){_ray.setFromCamera(mouseNDC,camera);const r=_ray.ray,by=PL.gy+1.1,t=(by-r.origin.y)/r.direction.y;if(t>0){const tx=r.origin.x+r.direction.x*t-PL.x,tz=r.origin.z+r.direction.z*t-PL.z,l=Math.hypot(tx,tz);if(l>.1)d=[tx/l,tz/l]}}
 const l0=Math.hypot(d[0],d[1])||1;d=[d[0]/l0,d[1]/l0];MELEE.d=d;if(camMode==='top')PL.face=[d[0],d[1]];
 PL.vx+=d[0]*1.4;PL.vz+=d[1]*1.4;swingSnd();
 let best=null,bs=1e9;for(const q of peds){if(q.state==='dead'||q.state==='inside')continue;const dx=q.x-PL.x,dz=q.z-PL.z,dist=Math.hypot(dx,dz);if(dist>1.6||dist<.01)continue;const dot=(dx*d[0]+dz*d[1])/dist;if(dot<.4)continue;const s=dist-dot;if(s<bs){bs=s;best=q}}
 if(best){punchPed(best,d);return}
 const hx=PL.x+d[0]*.9,hz=PL.z+d[1]*.9;labTankPoke({x:hx,y:PL.gy+1.1,z:hz},.5);
 for(const c of carsNear(hx,hz,6)){if(!c.alive)continue;const px=hx-c.x,pz=hz-c.z,ca=Math.cos(c.a),sa=Math.sin(c.a),lx=px*ca+pz*sa,lz=-px*sa+pz*ca;
  if(Math.abs(lx)<c.t.L/2+.25&&Math.abs(lz)<c.t.W/2+.25){if(c.mode==='rail')toPhys(c);c.hp-=2;c.sleep=false;punchSnd();rumble(.3,.5,90);for(let i=0;i<4;i++)emit(hx,PL.gy+1,hz,(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2,.2,.25,.05,0xffffff,true,.8);if(policeTrafficCar(c))startWanted();if(c.ai)c.ai.stun=.6;if(c.hp<=0&&c.alive)setOnFire(c);return}}}
function punchPed(q,d){if(q&&q.net){punchSnd();netHitPed(q,12,'fist');return}if(q.hp===undefined)q.hp=3;q.hp-=1;punchSnd();ouch(q.x,q.z,q.pitch);rumble(.45,.6,110);
 for(let i=0;i<6;i++)emit(q.x,(q.gy||0)+1.35,q.z,d[0]*2+(Math.random()-.5)*2,Math.random()*2,d[1]*2+(Math.random()-.5)*2,.25,.28,.06,0xfff0c0,true,.9);
 if(q.cop)startWanted();if(q.shopkeep)shopAlarm();
 if(q.hp<=0){bloodHit(q.x,1.2,q.z,new THREE.Vector3(d[0],0,d[1]));killPed(q);q.vx=d[0]*4;q.vz=d[1]*4;registerKill(q,true);return}
 if(q.cop)return;dropUmbrella(q);q.strip=null;
 if(q.shopkeep){q.jy=.25;return}
 q.fixed=false;q.mate=null;
 if(q.state==='bskate'||q.hp===1)knockPedDown(q,d[0],d[1]);
 else{q.state='flee';q.timer=4+R2()*3;q.vx=d[0]*5.2;q.vz=d[1]*5.2;q.rot=0}}
function meleeTick(dt){MELEE.cd=Math.max(0,MELEE.cd-dt);if(MELEE.t>0){MELEE.t-=dt;if(!PL.car&&!PL.dead){const k=Math.sin(Math.max(0,MELEE.t)/.22*Math.PI)*.35;PL.sp.position.x+=MELEE.d[0]*k;PL.sp.position.z+=MELEE.d[1]*k;setFrame(PL.tex,pickDir(MELEE.d[0],MELEE.d[1],PL.x,PL.z),1)}}
 /* v1r19: arma na primeira pessoa (pixel art no estilo do punho): pistola, metralhadora, magnum e bazuca; balança ao andar, tranco + clarão no tiro */
 {const fg=$('#fpGun');if(fg){const w=GUN.w,on=camMode==='fps'&&!VIEW.tp&&!PL.car&&!PL.heli&&!PL.dead&&GUN.has&&!!FP_GUN_SVG[w]&&played&&!menuOpen;if(fg.hidden===on)fg.hidden=!on;
  if(on){if(fg.dataset.w!==w){fg.dataset.w=w;fg.innerHTML=FP_GUN_SVG[w]}const age=performance.now()-(GUN.kickAt||-1e9),k=Math.max(0,1-age/(w==='rpg'?260:w==='smg'?70:130)),big=w==='rpg'?1.6:w==='magnum'?1.3:1,bob=Math.hypot(PL.vx,PL.vz)>.5?Math.sin(PL.anim*1.6)*6:0;
   fg.style.transform=`translate(${k*10*big}px,${k*34*big+bob}px) rotate(${-k*6*big}deg)`;fg.classList.toggle('shot',age<55)}}}
 const fist=$('#fist');if(fist){const on=camMode==='fps'&&!VIEW.tp&&!PL.car&&!PL.heli&&!PL.dead&&(!GUN.has||(GUN.w==='grenade'||GUN.w==='remote'||GUN.w==='jammer'))&&played&&!menuOpen;if(fist.hidden===on)fist.hidden=!on;if(on){const k=MELEE.t>0?Math.sin(Math.max(0,MELEE.t)/.22*Math.PI):0,bob=Math.hypot(PL.vx,PL.vz)>.5?Math.sin(PL.anim*1.6)*6:0;fist.style.transform=`translate(${-k*60}px,${-k*70+bob}px) scale(${1+k*.25})`}}}
/* armas: punhos entram no ciclo */
function gunHolster(quiet){if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;GUN.has=false;GUN.firing=false;if(!quiet)toast('PUNHOS<br><small style="font-size:11px;color:#fff">R ou clique: soco</small>')}
// v275: seleção de armas em veículos, inspirada no drive-by do GTA V.
// Motorista: armas de uma mão/compactas + jammer. Nathan de carona: também pode usar bazuca.
// Granadas/bombas programadas continuam reservadas ao uso a pé.
function vehicleWeaponAllowed(w){if(!PL.car)return true;
 if(w==='fist')return true;
 if(['pistol','magnum','smg'].includes(w))return true;
 return w==='rpg'&&DUO.on&&DUO.car===PL.car&&CHAR.cur!==DUO.drv;
}
function gunTry(w){if(!GUN.inv[w]){toast('VOCÊ NÃO TEM '+WPN[w].name);return}
 if(!vehicleWeaponAllowed(w)){toast('ARMA INDISPONÍVEL NESTE ASSENTO');return}gunSelect(w)}
/* ---------- rodas (armas / rádio) ---------- */
const WHL={open:null,src:null,sel:-1,vx:0,vy:0,items:[],t0:0,moved:false,weaponPages:{}};
const WICON={flame:'<path d="M3 9h14v2h4v2h-7v5H8v-5H3z M20 6q4 2 1 4q-3 0-1-4z"/>',fist:'<path d="M6 10h12v3h2v6h-2v2H8v-2H6z M8 7h2v3H8z M11 6h2v4h-2z M14 6h2v4h-2z M17 7h2v4h-2z"/>',
 pistol:'<path d="M3 8h17v4H11v2H9l-1 6H4l1-6H3z"/>',magnum:'<path d="M2 9h19v3H13v1h-2v-1h-1l-1 7H5l1-6H3V9z M10 7h4v2h-4z"/>',
 smg:'<path d="M2 9h20v3H14v2h-3v6H8v-6H6l-1 4H2l1-6H2z M12 12h2v6h-2z"/>',grenade:'<path d="M9 3h6v3h-6z M15 2h4v2h-4z M8 7h8v2h-8z M6 11q0-3 4-3h4q4 0 4 3v7q0 4-6 4t-6-4z"/>',remote:'<path d="M3 7h18v13H3z M6 9h12v8H6z M9 4h6v3H9z M9 12h2v2H9z M14 12h3v2h-3z"/>',jammer:'<path d="M5 5h14v16H5z M8 8h8v5H8z M8 15h2v2H8z M13 15h3v2h-3z M12 5V2h1v3z"/>',rpg:'<path d="M1 9h18v4H1z M19 8l4 3-4 3z M7 13h3v6H7z"/>',
 radio:'<path d="M4 9h16v11H4z M6 4l10 5 M8 12a3 3 0 1 0 0.1 0z M14 12h4v2h-4z M14 16h4v2h-4z" fill="none" stroke="currentColor" stroke-width="2"/>',
 off:'<path d="M5 5l14 14 M19 5L5 19" stroke="currentColor" stroke-width="3"/>',
 mask:'<path d="M3 8q9-5 18 0v4q-1 6-9 8q-8-2-9-8z M6 10v2h4v-2z M14 10v2h4v-2z M9 16q3 2 6 0v1q-3 2-6 0z" fill-rule="evenodd"/>'};
const WEAPON_WHEEL_GROUPS=[
 ['fist'],
 ['pistol','magnum'],
 ['smg'],
 ['rpg','flame'],
 ['grenade','remote'],
 ['jammer']
];
function weaponWheelItems(){
 const equipped=GUN.has?GUN.w:'fist';
 return WEAPON_WHEEL_GROUPS.map(group=>{
  const pages=group.filter(k=>k!=='jammer').map(k=>{
   const owned=GUN.inv[k],fist=k==='fist';
   return {k,n:fist?'PUNHOS':WPN[k].name,ic:k,ok:(fist||!!owned)&&vehicleWeaponAllowed(k),
    sub:fist?'SOCO':owned?String(k===equipped?GUN.ammo:owned.ammo):'—'};
  });
  const id=group[0];
  if(id==='jammer'&&MASK.have&&CHAR.cur===0){
   pages.push({k:'mask',n:'MASKARA',ic:'mask',ok:!PL.dead,sub:MASK.original&&!MASK.off?'VESTIDA':'GUARDADA'});
  }
  if(!pages.length)pages.push({k:'none',n:'—',ic:'off',ok:false,sub:''});
  const active=pages.findIndex(it=>it.ok&&it.k===equipped);
  const remembered=pages.findIndex(it=>it.ok&&it.k===WHL.weaponPages[id]);
  const page=active>=0?active:remembered>=0?remembered:Math.max(0,pages.findIndex(it=>it.ok));
  return {...pages[page],id,page,pages:pages.length>1?pages:null};
 });
}
function wheelItems(kind){if(kind==='wpn')return weaponWheelItems();
 const out=[{k:-1,n:'DESLIGADO',ic:'off',ok:true,sub:''}];
 if(radioLive()){out.push({k:'live',n:'KRFM',ic:'radio',ok:true,sub:'AO VIVO'});return out}
 const N=RADIO.list.length,M=Math.min(N,10),c=Math.max(0,RADIO.idx);let s=N>M?c-Math.floor(M/2):0;
 for(let j=0;j<M;j++){const i=((s+j)%N+N)%N;out.push({k:i,n:RADIO.list[i].name,ic:'radio',ok:true,sub:''})}return out}
function wheelOpen(kind,src){if(missionUiBlocked('wheel'))return;if(kind==='wpn'&&PL.heli)return;if(RADIO.sceneActive&&kind==='radio')return;if(WHL.open||menuOpen||PL.dead||!played)return;if(kind==='radio'&&!radioVeh())return;
 WHL.open=kind;WHL.src=src;WHL.t0=performance.now();WHL.vx=WHL.vy=0;WHL.moved=false;WHL.items=wheelItems(kind);
 WHL.sel=kind==='wpn'?Math.max(0,WHL.items.findIndex(i=>i.k===(GUN.has?GUN.w:'fist')&&i.ok)):WHL.items.findIndex(i=>radioLive()?i.k===(RADIO.userOff?-1:'live'):i.k===(RADIO.userOff||RADIO.idx<0?-1:RADIO.idx));
 GUN.firing=false;const el=$('#wheel'),ring=$('#whlRing');ring.innerHTML='';const n=WHL.items.length,R0=Math.min(150,innerWidth*.34);
 WHL.items.forEach((it,i)=>{const a=-Math.PI/2+i/n*Math.PI*2,d=document.createElement('div');d.style.left=`calc(50% + ${Math.cos(a)*R0}px)`;d.style.top=`calc(50% + ${Math.sin(a)*R0}px)`;wheelSlotHTML(d,it,i);ring.appendChild(d)});
 $('#whlT').textContent=kind==='wpn'?'ARMAS':'RÁDIO';el.hidden=false;wheelPaint();wheelTip(kind,src)}
function wheelTip(kind,src){const k='ps_whltip_'+src+'_'+kind;try{if(localStorage.getItem(k))return;localStorage.setItem(k,'1')}catch(e){return}
 toast(src==='touch'?translatePlain('ARRASTE E SOLTE PARA ESCOLHER'):src==='pad'?translatePlain('ANALÓGICO ESCOLHE · SOLTE PARA CONFIRMAR'):translatePlain('MOUSE ESCOLHE · SOLTE PARA CONFIRMAR'))}
function wheelSlotHTML(d,it,i){d.className='ws'+(it.ok?'':' no')+(it.pages?' pg':'');
 d.innerHTML=`<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">${WICON[it.ic]||''}</svg><span>${it.n.length>14?it.n.slice(0,13)+'…':it.n}</span>${it.sub?'<b>'+it.sub+'</b>':''}${it.pages?`<em class="wpg"><a data-p="-1">‹</a>${it.page+1}/${it.pages.length}<a data-p="1">›</a></em>`:''}`;
 if(it.pages)for(const el of d.querySelectorAll('.wpg a'))el.onpointerdown=e=>{e.preventDefault();e.stopPropagation();WHL.sel=i;wheelPage(+el.dataset.p)}}
/* troca a página da fatia selecionada (setas ‹ ›, A/D, ←/→, rodinha do mouse, direcional do controle) */
function wheelPage(dir){if(!WHL.open||WHL.open!=='wpn')return false;const it=WHL.items[WHL.sel];if(!it||!it.pages)return false;const N=it.pages.length;it.page=((it.page+dir)%N+N)%N;Object.assign(it,it.pages[it.page]);WHL.moved=true;if(it.ok)WHL.weaponPages[it.id]=it.k;
 const el=$('#whlRing').children[WHL.sel];if(el)wheelSlotHTML(el,it,WHL.sel);clang(.06);wheelPaint();return true}
function wheelPaint(){const els=$('#whlRing').children;for(let i=0;i<els.length;i++)els[i].classList.toggle('on',i===WHL.sel);const it=WHL.items[WHL.sel];$('#whlName').textContent=it?it.n:'';
 const song=it&&WHL.open==='radio'&&typeof it.k==='number'&&it.k>=0?radioSong(RADIO.list[it.k]):null;
 $('#whlSub').textContent=it?(it.ok?(WHL.open==='wpn'?(it.k==='fist'?'mão limpa':it.k==='mask'?(MASK.original&&!MASK.off?'vestida · solte para guardar':'guardada · solte para vestir'):'munição '+it.sub):(song?song.name:it.sub||'SEM MÚSICA')):'não encontrada'):'';
 const p=$('#whlPtr');if(p){const L=Math.hypot(WHL.vx,WHL.vy);p.style.opacity=L>10?1:0;p.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(WHL.vy,WHL.vx)}rad) translateX(46px)`}}
function wheelPick(){const L=Math.hypot(WHL.vx,WHL.vy);if(L<26)return;WHL.moved=true;const n=WHL.items.length;let a=Math.atan2(WHL.vy,WHL.vx)+Math.PI/2;a=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2);const i=Math.round(a/(Math.PI*2)*n)%n;if(i!==WHL.sel){WHL.sel=i;clang(.06)}wheelPaint()}
function wheelMove(dx,dy){WHL.vx+=dx;WHL.vy+=dy;const L=Math.hypot(WHL.vx,WHL.vy);if(L>110){WHL.vx*=110/L;WHL.vy*=110/L}wheelPick();wheelPaint()}
function wheelClose(apply){if(!WHL.open)return;const kind=WHL.open,it=WHL.items[WHL.sel],tap=performance.now()-WHL.t0<220&&!WHL.moved;WHL.open=null;$('#wheel').hidden=true;if(!apply)return;
 if(kind==='wpn'){if(tap){gunCycle(1);return}if(!it||!it.ok)return;if(it.k==='mask'){maskWear(!(MASK.original&&!MASK.off));return}if(it.k==='fist'){if(GUN.has)gunHolster()}else if(!GUN.has||GUN.w!==it.k)gunSelect(it.k);return}
 if(tap){radioStep(1);return}if(!it)return;
 if(it.k===-1){if(!RADIO.userOff){RADIO.userOff=true;RADIO.el.pause();toast('RÁDIO DESLIGADO')}return}
 RADIO.userOff=false;if(radioLive()){RADIO.blocked=false;RADIO.liveErrT=-1e9;toast('RÁDIO · KRFM AO VIVO');return}
 if(it.k!==RADIO.idx){RADIO.idx=it.k;RADIO.err='';loadStation();radioPlay();toast('RÁDIO · '+RADIO.list[RADIO.idx].name);clang(.15)}else radioPlay()}
function radioStep(dir){if(RADIO.sceneActive||!PL.car)return;if(RADIO.blocked){radioKick()}if(RADIO.userOff){RADIO.userOff=false;if(RADIO.idx<0&&RADIO.list.length){RADIO.idx=0;loadStation()}radioPlay();toast('RÁDIO LIGADO');return}tuneRadio(dir)}
/* ---------- zerinho ---------- */
function donutTick(dt){const c=PL.car;if(!c||!c.alive)return;c.donut=0;if(c.airY>0)return;
 const up=keys.KeyW||keys.ArrowUp||(PAD.on&&PAD.r2>.5),dn=keys.KeyS||keys.ArrowDown||(PAD.on&&PAD.l2>.5),st=c.steerT||0;
 if(!(up&&(dn||(c.t.boat&&TOUCH.on&&keys.Space)))||Math.abs(st)<.3||Math.abs(c.fwd)>12||(c.fuel!==undefined&&c.fuel<=0))return;
 if(c.t.boat){
  c.donut=Math.sign(st)*2.2;c.thr=0;c.hand=true;c.sleep=false;
  if(Math.random()<dt*10)emit(c.x,waterLevel(c.x,c.z)+.1,c.z,(Math.random()-.5)*2,.2,(Math.random()-.5)*2,.45,.25,.08,0xd8ecff,false,.6);
  return;
 }
 c.donut=Math.sign(st)*(c.type==='moto'?3.0:3.7);c.thr=.35;c.hand=true;c.sleep=false;
 const ca=Math.cos(c.a),sa=Math.sin(c.a),rx=c.x-ca*c.t.L*.38,rz=c.z-sa*c.t.L*.38;
 for(const sd of c.type==='moto'?[0]:[-1,1]){const wx=rx-sa*sd*c.t.W*.42,wz=rz+ca*sd*c.t.W*.42;if(c.dn0&&c.dn0[sd+1])addSkid(c.dn0[sd+1][0],c.dn0[sd+1][1],wx,wz,c.gy+.03);c.dn0=c.dn0||[];c.dn0[sd+1]=[wx,wz];
  if(Math.random()<dt*22)emit(wx,.4,wz,(Math.random()-.5)*1.4,.5+Math.random()*.8,(Math.random()-.5)*1.4,1.6,.8,3.4,city.st&&city.st.night?0x9a8aa8:0xd8d6d2,false,.5)}
 if(scrG&&AC)scrG.gain.setTargetAtTime(.2*(S.sound?1:0),AC.currentTime,.05);rumble(.12,.35,120,true)}
/* ---------- combustível ---------- */
const FUEL={warn:false,out:false};
function fuelTick(dt){const c=PL.car;if(!c||!c.alive||c.t.boat)return;if(c.fuel===undefined)c.fuel=c.police?100:40+R2()*60;
 const use=.01+Math.abs(c.thr||0)*.085*(c.type==='moto'?.55:1)+(c.nitro?.25:0)+(c.donut?.12:0);if(!CHEAT.used||true)c.fuel=Math.max(0,c.fuel-use*dt);
 if(c.fuel<=0){c.thr=0;c.nitro=false;c.donut=0;if(!FUEL.out){FUEL.out=true;toast('SEM COMBUSTÍVEL<br><small style="font-size:11px;color:#fff">empurre… ou roube outro · postos no mapa (ícone laranja)</small>');clang(.2)}}else FUEL.out=false;
 if(c.fuel<15&&c.fuel>0&&!FUEL.warn){FUEL.warn=true;toast('POUCO COMBUSTÍVEL<br><small style="font-size:11px;color:#fff">procure um posto (ícone laranja no mapa)</small>')}else if(c.fuel>20)FUEL.warn=false}
/* ---------- posto de combustível ---------- */
const GAS={list:new Map(),q:[],pv:new WeakMap(),tex:{},arrow:null};
const GAS_BRANDS=[{n:'PIXOIL',a:'#d8202a',b:'#f2c21a'},{n:'NEOGÁS',a:'#1e8a3a',b:'#f2e21a'},{n:'TURBO',a:'#1e5ab0',b:'#ffffff'},{n:'SOLAR',a:'#ff6a1a',b:'#ffffff'}];
function gasTex(kind,br,burnt){const key=kind+br.n+br.a+(burnt?1:0);if(GAS.tex[key])return GAS.tex[key];
 const W=kind==='py'?96:256,H=kind==='py'?160:kind==='shop'?48:40,c=cv(W,H),g=c.getContext('2d');g.fillStyle=burnt?'#1a1716':br.vc?'#2a1840':br.a;g.fillRect(0,0,W,H);
 g.fillStyle=burnt?'#3a3432':br.b;g.textAlign='center';g.textBaseline='middle';
 if(kind==='can'){g.font='700 28px Silkscreen,monospace';g.fillText(br.n,W/2,H/2+1,W-10);g.fillRect(0,0,W,3);g.fillRect(0,H-3,W,3)}
 else if(kind==='shop'){g.fillStyle=burnt?'#2a2624':'#111';g.fillRect(0,0,W,H);g.fillStyle=burnt?'#3a3432':br.b;let fs=22;g.font='700 '+fs+'px Silkscreen,monospace';while(g.measureText('CONVENIÊNCIA 24H').width>W-14&&fs>10){fs--;g.font='700 '+fs+'px Silkscreen,monospace'}g.fillText('CONVENIÊNCIA 24H',W/2,H/2+1,W-14)}
 else{g.font='700 20px Silkscreen,monospace';g.fillText(br.n,W/2,22);g.fillStyle=burnt?'#221e1c':'#111';g.fillRect(6,44,W-12,H-52);g.fillStyle=burnt?'#3a3432':'#ffd23a';g.font='700 15px Silkscreen,monospace';
  // A arte do totem e estreita (96 px): duas colunas com larguras
  // limitadas. O 4º parametro de fillText evita sobreposicao mesmo
  // quando a fonte Silkscreen nao estiver carregada no primeiro frame.
  g.font='700 13px Silkscreen,monospace';g.textAlign='left';
  for(const [i,n] of ['GAS','ALC','DSL'].entries())g.fillText(n,12,64+i*28,29);
  g.fillStyle=burnt?'#3a3432':'#5aff6a';g.textAlign='right';
  for(const [i,n] of ['5,89','4,19','6,02'].entries())g.fillText(n,W-10,64+i*28,40);
  g.fillStyle=burnt?'#3a3432':br.b;g.font='700 11px Silkscreen,monospace';g.textAlign='center';g.fillText('24 HORAS',W/2,146)}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;const m=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});m.userData.cached=true;return GAS.tex[key]=m}
// v77: bombas/cobertura 1,5 m mais perto da calçada da frente; conveniência mais ao fundo (vão para 4 vagas na porta).
const GAS_SHIFT=1.5,GAS_STORE_V=23.5;
function gasBuild(K){const{F,W,D,f,ch,ri}=K;let st=GAS.list.get(ri);
 const P3=(u,v)=>F.pt(u,v-GAS_SHIFT),nrm=F.nrm;
 if(!st){const br=GAS_BRANDS[(ri*7+S.seed)%GAS_BRANDS.length];st={ri,br,burnt:false,burnT:0,fireT:0,hits:0};GAS.list.set(ri,st)}
 st.F=F;st.W=W;st.D=D;st.ch=ch;st.nrm=nrm;st.retro=!city.info[ri]?.dealgas&&(city.lms||[]).some(l=>l.name==='gas'&&l.ri===ri); // v77: 2º posto = estilo anos 70
 /* v4 r5: lote raso e largo (posto do centro sem borracharia) = loja AO LADO da cobertura (K.side); Wc = largura do bloco das bombas */
 const Wc=K.side?26:W;st.Wc=Wc;st.side=!!K.side;
 const cu0=Wc*.14,cu1=Wc*.86,cv0=4.5,cv1=16.5,isl=[Wc*.36,Wc*.64];st.isl=isl;
 {const a=F.pt(cu0-1,cv0-1-GAS_SHIFT),b=F.pt(cu1+1,cv1+1-GAS_SHIFT);st.fc=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];(city.gasFc||(city.gasFc=[])).push(st.fc)} /* v79: piso do pátio das bombas (topo .285/.29) entra no groundY · v1r2: com o mesmo GAS_SHIFT do piso visível (antes ficava 1,5 m pra trás = degrau invisível) */
 st.pumps=[];st.spots=[];for(const u of isl){for(const v of [9.2,12.2])st.pumps.push(P3(u,v));for(const s of [-1,1])st.spots.push(P3(u+s*2.75,10.7))}
 {const c=P3(Wc/2,(cv0+cv1)/2);st.x=c[0];st.z=c[1]}
 const sv0=K.side?8.5:Math.min(Math.max(GAS_STORE_V,D-15),Math.max(21,D-12.5)),sv1=K.side?Math.min(D-2,sv0+11):Math.min(D-2.5,sv0+12);st.sv=[sv0,sv1];
 const su0=K.side?Wc+1.5:W*.2,su1=K.side?Math.min(W-6.2,su0+15):W*.8,sc=(su0+su1)/2;st.su=[su0,su1];st.sc=sc;
 const dp=F.pt(sc,sv0-1.1);st.door={x:dp[0],z:dp[1]};const op=F.pt(sc,sv0-2.6);st.out={x:op[0],z:op[1]};
 K.doorAt(F,sc,sv0);
 // colisões (só na construção do chunk)
 for(const u of isl)F.box(u-.75,u+.75,7-GAS_SHIFT,14.4-GAS_SHIFT,0,1,COL('#000'),new MB(),'rock');
 F.box(su0,su1,sv0,sv1,0,1,COL('#000'),new MB(),'bld');
 F.box(1.8,2.6,1.8,2.6,0,1,COL('#000'),new MB(),'rock');
 /* v3 r58 · LAVA-JATO de rolete. v3 r59 (José): encostado na lateral direita da loja (no lugar da máquina de bebidas). v4 r5: só no posto do centro (K.wash). Só os trilhos colidem. */
 {const u0=su1+.05,u1=Math.min(W-.25,u0+5.2),v0=sv0-.6,v1=Math.min(D-.8,v0+7);st.wash=null;if(K.wash&&u1-u0>=4.6&&v1-v0>=6.2){st.wash={u0,u1,v0,v1,t:-1,stopT:0,msgT:0,g:null};for(const u of [u0,u1-.5])F.box(u,u+.5,v0+.15,v1-.15,0,1,COL('#000'),new MB(),'rock')}}
 gasVisual(st)}
function gasVisual(st){const{W,D,ch}=st;const F0=st.F;if(!F0)return;const F={...F0,pt:(u,v)=>F0.pt(u,v-GAS_SHIFT),p3:(u,y,v)=>F0.p3(u,y,v-GAS_SHIFT),box:(u0,u1,v0,v1,...r)=>F0.box(u0,u1,v0-GAS_SHIFT,v1-GAS_SHIFT,...r)};const burnt=st.burnt,night=!!city.st.synth,M=city.M,VC=night&&!burnt,br=night?{n:st.br.n,a:'#f3d9cc',b:'#ff4fd8',vc:1}:st.br,PK=COL('#ff3ec8'),CY=COL('#2af0ff'),MI=COL('#7affd0');
 if(st.grp){st.grp.parent&&st.grp.parent.remove(st.grp);st.grp.traverse(o=>{if(o.geometry&&!o.isSprite)o.geometry.dispose()})}
 const grp=new THREE.Group();st.grp=grp;const d=new MB(),n=new MB(),h=new MB(),gl=new MB();d.ab=1;n.ab=1;
 const BK=COL('#141210');const C=(hx,k)=>{const c=COL(hx);if(k)c.multiplyScalar(k);return burnt?BK.clone().lerp(c,.13):c};
 const NE=burnt?d:n,cyl=(x,y0,y1,z,r,col)=>d.geo(GEO.cyl,mtx(x,(y0+y1)/2,z,r,y1-y0,r),col);
 const Wc=st.Wc||W,cu0=Wc*.14,cu1=Wc*.86,cv0=4.5,cv1=16.5,isl=st.isl,[sv0,sv1]=st.sv.map(v=>v+GAS_SHIFT),[su0,su1]=st.su||[W*.2,W*.8],sw=su1-su0,sc=(su0+su1)/2,SU=f=>su0+(f-.2)/.6*sw;
 const rf=new MB();rf.ab=1;st.roofSigns=[]; /* v4 r5: laje da cobertura num lote próprio, para ficar transparente na vista de cima */
 /* v4 r19: neon da borda da cobertura em TUBO (cilindro com pontas redondas) + halo aditivo (lote gasHalo, 1 malha por posto) e
    2 barras vermelhas fracas ("neon velho"). e = borda em coordenadas locais (u,v) na face externa: [u0,v0,u1,v1,du,dv]; gap = trecho sem tubo (letreiro) */
 const hal=[],WT=COL('#ffffff'),tubeSeg=(e,t0,t1,y,r,col,mb,hk,caps,hw=1)=>{const[u0,v0,u1,v1,du,dv]=e,o=r+.012,ua=u0+(u1-u0)*t0+du*o,va=v0+(v1-v0)*t0+dv*o,ub=u0+(u1-u0)*t1+du*o,vb=v0+(v1-v0)*t1+dv*o,A=F.p3(ua,y,va),B=F.p3(ub,y,vb);
   wseg(mb,A[0],A[1],A[2],B[0],B[1],B[2],r,col,GEO.cyl);if(caps)for(const Q of [A,B])mb.geo(GEO.bulb,mtx(Q[0],Q[1],Q[2],r,r,r),col);
   if(hk>0&&!burnt){const O=F.p3(ua+du,y,va+dv);hal.push(A,B,[O[0]-A[0],O[2]-A[2]],r*hw,col,hk)}},
  tube=(e,y,r,col,mb,hk,gap,dim,hw)=>{const L=Math.hypot(e[2]-e[0],e[3]-e[1]),cuts=[[0,1]];if(gap){const a=(gap[0]-Math.min(e[0],e[2]))/L,b=(gap[1]-Math.min(e[0],e[2]))/L;if(b>0&&a<1){cuts.length=0;if(a>.02)cuts.push([0,a]);if(b<.98)cuts.push([b,1])}}
   for(const[c0,c1] of cuts){if(!dim){tubeSeg(e,c0,c1,y,r,col,mb,hk,true,hw);continue}
    const n=Math.max(1,Math.round((c1-c0)*L/1.6)),gp=.02/L;for(let i=0;i<n;i++){const h=((i*37+Math.round(e[0]*7+e[1]*13+y*29))%11)/10,k=.55+.45*h;tubeSeg(e,c0+(c1-c0)*i/n+(i?gp:0),c0+(c1-c0)*(i+1)/n-(i<n-1?gp:0),y,r,col.clone().multiplyScalar(k),mb,hk*k,i===0||i===n-1)}}}, /* segmentos com 4 cm de folga (tubos separados, como neon de verdade; sem tampas coladas = sem z-fight) */
  RDIM=COL('#ff2a2a').multiplyScalar(.36);
 // pátio: concreto mais claro sob a cobertura + mancha de queimado
 F.box(cu0-1,cu1+1,cv0-1,cv1+1,.26,.285,C(night?'#5a5468':'#b8b4aa'),d);
 if(burnt){for(let k=0;k<5;k++){const p=F.pt(W*(.3+.1*k),9+((k*37)%5));d.box(p[0]-3.5,.285,p[1]-3.2,p[0]+3.5,.29,p[1]+3.2,COL('#0c0b0a'))}}
 // ilhas e bombas
 for(const u of isl){F.box(u-.75,u+.75,7,14.4,.285,.5,C('#d8d4cc'),d);F.box(u-.8,u+.8,6.9,7.1,.285,.55,C('#f2c21a'),d);F.box(u-.8,u+.8,14.3,14.5,.285,.55,C('#f2c21a'),d);
  for(const v of [9.2,12.2]){F.box(u-.45,u+.45,v-.38,v+.38,.5,1.95,C(br.vc?'#c8ccd6':'#f4f4f0'),d);F.box(u-.47,u+.47,v-.4,v+.4,1.95,2.15,C(br.vc?'#e8e8ee':br.a),d);F.box(u-.47,u+.47,v-.4,v+.4,1.88,1.95,C(br.vc?'#d8203a':br.a),d);if(br.vc)F.box(u-.47,u+.47,v-.4,v+.4,1.8,1.88,C('#2a5ab0'),d);F.box(u-.47,u+.47,v-.4,v+.4,.5,.75,C(br.vc?'#e8c8b4':br.a),d);
   for(const s of [-1,1]){F.box(s<0?u-.48:u+.45,s<0?u-.45:u+.48,v-.26,v+.26,1.3,1.75,burnt?C('#111'):COL(night?'#5affc8':'#1a3a2a'),burnt?d:n);F.box(s<0?u-.6:u+.45,s<0?u-.45:u+.6,v-.1,v+.1,.9,1.15,C('#222'),d)}
   if(!burnt){const p=F.pt(u,v);n.box(p[0]-.08,2.15,p[1]-.08,p[0]+.08,2.22,p[1]+.08,COL(br.b))}}
  for(const v of [7.6,13.8]){const p=F.pt(u,v);if(st.retro)continue;if(br.vc)F.box(u-.32,u+.32,v-.32,v+.32,.5,5.2,C('#f0cdb8'),d);else cyl(p[0],.5,5.2,p[1],.22,C('#e8e6e0'))}}
 // v77: bombas retrô (faixa vermelha e globo leitoso no topo) no posto anos 70
 if(st.retro)for(const u of isl)for(const v of [9.2,12.2]){F.box(u-.465,u+.465,v-.395,v+.395,.95,1.55,C('#c8302a'),d);const p=F.pt(u,v);d.geo(GEO.crownSmall,mtx(p[0],2.42,p[1],.24,.22,.24),C(night?'#ffe8b0':'#f4f0e0'))}
 // cobertura
 if(st.retro){const sag=burnt?.35:0,red=C('#c8202a'),white=C(night?'#c8c4d0':'#f2eee6'),under=C(night?'#9a96a8':'#d8d4cc');
  // anos 70: laje fina em balanço, bem mais larga que as ilhas, borda em cunha vermelha com neon, pernas em "Λ"
  const a0=cu0-3.5,a1=cu1+3.5,b0=cv0+1.2,b1=cv1-1.2,y=5.5-sag;
  F.box(a0,a1,b0,b1,y+.18,y+.36,white,rf);F.box(a0+1,a1-1,b0+.6,b1-.6,y,y+.18,under,rf);
  F.box(a0,a1,b0-.06,b0,y+.12,y+.36,red,rf);F.box(a0,a1,b1,b1+.06,y+.12,y+.36,red,rf);F.box(a0-.06,a0,b0,b1,y+.12,y+.36,red,rf);F.box(a1,a1+.06,b0,b1,y+.12,y+.36,red,rf);
  {const E=[[a0-.06,b0-.06,a1+.06,b0-.06,0,-1],[a0-.06,b1+.06,a1+.06,b1+.06,0,1],[a0-.06,b0-.06,a0-.06,b1+.06,-1,0],[a1+.06,b0-.06,a1+.06,b1+.06,1,0]];
   for(const e of E){tube(e,y+.24,.055,burnt?C('#ff3a3a'):COL('#ff4a40'),burnt?d:n,1,null,false,.55);if(!burnt)for(const yy of [y+.13,y+.35])tube(e,yy,.028,RDIM,n,.3,null,true)}} /* v4 r19: tubo vermelho grosso nas 4 bordas + 2 barras vermelhas fracas (antes 2 faixas chapadas de 8 cm só na frente e atrás) */
  for(const u of isl)for(const sd of [-1,1]){const A=F.p3(u,.28,10.7+sd*2.7),Bp=F.p3(u,y+.05,10.7+sd*.3);wseg(d,A[0],A[1],A[2],Bp[0],Bp[1],Bp[2],.16,red,GEO.cyl)}
  if(!burnt)for(let u=a0+2;u<a1-1.5;u+=3.4){const p=F.pt(u,b0+1.5),q=F.pt(u+1.4,b1-1.5);n.box(Math.min(p[0],q[0]),y-.04,Math.min(p[1],q[1]),Math.max(p[0],q[0]),y,Math.max(p[1],q[1]),COL('#fff6dc'))}
  if(!burnt&&night){const a=F.pt(a0,b0),b=F.pt(a1,b1);gl.flat(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),.3,COL('#fff2c8').multiplyScalar(.28))}
  {const c=cv(256,96),g=c.getContext('2d');g.font='900 84px Impact,Arial Black,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=10;g.strokeStyle='#ffffff';g.strokeText('GAS',128,52);g.fillStyle=burnt?'#2a1a1a':'#d8202a';g.fillText('GAS',128,52);
   const t=new THREE.CanvasTexture(c);const mt0=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide}),mt=S.style==='inverted'?unlitSignMat(mt0):mt0;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.35),mt),p=F.p3(a0+2.4,y+1.05,b0+.4);m.position.set(p[0],p[1],p[2]);m.rotation.y=Math.atan2(st.nrm[0],st.nrm[1]);grp.add(m);st.roofSigns.push(m)}
 }else if(!burnt||true){const sag=burnt?.35:0;F.box(cu0,cu1,cv0,cv1,5.2-sag,5.95-sag,C(br.vc?'#f0dcd2':'#cfd0d4'),rf);for(const[a0,a1,b0,b1] of [[cu0-.08,cu1+.08,cv0-.08,cv0],[cu0-.08,cu1+.08,cv1,cv1+.08],[cu0-.08,cu0,cv0,cv1],[cu1,cu1+.08,cv0,cv1]]){F.box(a0,a1,b0,b1,5.2-sag,6.05-sag,C(br.a),rf)} /* v4 r19: a faixa chapada de neon (5,3–5,42, a 1 cm da face) virou tubo (abaixo) */
  if(!burnt)for(let u=cu0+2;u<cu1-1;u+=3.2)for(const v of [7,10.5,14]){const a=F.pt(u,v-.5),b=F.pt(u+1.6,v+.5);n.box(Math.min(a[0],b[0]),5.15,Math.min(a[1],b[1]),Math.max(a[0],b[0]),5.2,Math.max(a[1],b[1]),COL('#fff6dc'))}
  if(!burnt&&night){const a=F.pt(cu0,cv0),b=F.pt(cu1,cv1);gl.flat(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),.3,COL('#fff2c8').multiplyScalar(.28))}
  {const g0=cu0-.08,g1=cu1+.08,h0=cv0-.08,h1=cv1+.08,sgw=Math.min(9,(cu1-cu0)*.5),gap=[Wc/2-sgw/2-.25,Wc/2+sgw/2+.25],
    EF=[g0,h0,g1,h0,0,-1],EB=[g0,h1,g1,h1,0,1],EL=[g0,h0,g0,h1,-1,0],ER=[g1,h0,g1,h1,1,0];
   if(VC){/* Synthwave: rosa na metade esquerda, ciano na direita, em dois níveis */
    for(const[y,r,gp] of [[5.32-sag,.075,null],[5.95-sag,.06,gap]]){for(const e of [EF,EB]){tube([g0,e[1],Wc/2,e[1],0,e[5]],y,r,PK,n,1,gp);tube([Wc/2,e[1],g1,e[1],0,e[5]],y,r,CY,n,1,gp)}tube(EL,y,r,PK,n,1);tube(ER,y,r,CY,n,1)}
    for(const yy of [5.56-sag,5.76-sag])for(const e of [EF,EB,EL,ER])tube(e,yy,.032,RDIM,n,.22,e===EF?gap:null,true)}
   else{for(const e of [EF,EB,EL,ER]){tube(e,5.32-sag,.075,burnt?C(br.b):COL(br.b),NE,1);if(!burnt)for(const yy of [5.62,5.84])tube(e,yy,.032,RDIM,n,.22,e===EF?gap:null,true)}}} /* v4 r19: tubo grosso (raio 7,5 cm) + 2 barras vermelhas fracas; no Synth substitui as faixas de 16 cm */
  if(VC){
   for(const[a0,a1,col] of [[cu0-3,Wc/2,PK],[Wc/2,cu1+3,CY]]){const a=F.pt(a0,cv0-3),b=F.pt(a1,cv1+3);gl.flat(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),.3,col.clone().multiplyScalar(.42))}}
  const sm0=gasTex('can',br,burnt),sm=S.style==='inverted'?unlitSignMat(sm0):sm0,sg=new THREE.PlaneGeometry(Math.min(9,(cu1-cu0)*.5),.52),m=new THREE.Mesh(sg,sm),p=F.p3(Wc/2,5.75-sag,cv0-.08);st.roofSigns.push(m);m.position.set(p[0]+st.nrm[0]*.02,p[1],p[2]+st.nrm[1]*.02);m.rotation.y=Math.atan2(st.nrm[0],st.nrm[1]);grp.add(m)}
 // loja de conveniência
 {F.box(su0,su1,sv0,sv1,.26,4.4,C(br.vc?'#f2ddd0':night?'#8a84a0':'#e8e4dc'),d);F.box(su0-.2,su1+.2,sv0-.2,sv1+.2,4.4,4.75,C(br.vc?'#e8b8a8':br.a),d);if(VC){F.box(su0-.3,su1+.3,sv0-.3,sv0-.22,4.5,4.58,MI,n);F.box(su0-.3,su1+.3,sv0-.3,sv0-.22,3.22,3.3,PK,n);F.box(su0-.3,su0-.22,sv0-.3,sv1,4.5,4.58,MI,n);F.box(su1+.22,su1+.3,sv0-.3,sv1,4.5,4.58,MI,n)}
  F.box(SU(.22),SU(.78),sv0-.12,sv0,.7,3.1,burnt?C('#111'):COL(night?'#ffe2a8':'#9ac8e0'),burnt?d:h);
  F.box(sc-1,sc+1,sv0-.18,sv0-.1,.26,2.6,C('#3a3a40'),d);F.box(sc-.9,sc+.9,sv0-.2,sv0-.15,.4,2.5,burnt?C('#111'):COL(night?'#ffd9a0':'#7ab0d0'),burnt?d:h);
  for(const u of [SU(.22),sc-1.6,sc+1.6,SU(.78)])F.box(u-.12,u+.12,sv0-.2,sv0,.26,3.3,C('#3a3a40'),d);
  F.box(SU(.24),SU(.76),sv0-.1,sv0,3.3,4.35,C('#1a1a20'),d);
  const sm0=gasTex('shop',br,burnt),sm=S.style==='inverted'?unlitSignMat(sm0):sm0,sg=new THREE.PlaneGeometry(Math.min(10,sw*.83),.9),m=new THREE.Mesh(sg,sm),p=F.p3(sc,3.85,sv0-.14);m.position.set(p[0],p[1],p[2]);m.rotation.y=Math.atan2(st.nrm[0],st.nrm[1]);grp.add(m);
  if(sv1-sv0>=5)for(const u of [SU(.32),SU(.62)]){F.box(u-.9,u+.9,sv1-3,sv1-1.4,4.75,5.6,C('#9a9aa2'),d)}
  if(!st.wash){F.box(su1+.4,su1+1.6,sv0+.5,sv0+2.5,.26,1.4,C('#e8e8f0'),d);F.box(su1+.35,su1+1.65,sv0+.45,sv0+.55,.9,1.2,C('#2a8ad6'),d)} /* máquina de bebidas: sai quando há lava-jato (v3 r59) */
  F.box(su0-1.8,su0-.4,sv0+.6,sv0+2.2,.26,1.6,C('#6a6a72'),d);for(let k=0;k<3;k++)F.box(su0-1.7,su0-.5,sv0+.7,sv0+2.1,.4+k*.42,.42+k*.42,C('#9a9aa2'),d);
  if(!burnt)F.box(sc-2.2,sc+2.2,sv0-.25,sv0-.18,4.5,4.65,COL(br.b),n)}
 // totem de preços
 if(st.retro){const p=F.pt(2.4,2.2),grey=C('#5a5a62'),yaw=Math.atan2(st.nrm[0],st.nrm[1]);
  // totem retrô de treliça: losango GAS em neon e um pneu gigante no topo (vizinho da borracharia)
  for(const sd of [-1,1]){const a=F.p3(2.4+sd*.75,.26,2.2),b=F.p3(2.4+sd*.4,9.3,2.2);wseg(d,a[0],a[1],a[2],b[0],b[1],b[2],.09,grey,GEO.cyl)}
  for(let y=1.1;y<8.6;y+=1.3){const a=F.p3(1.75,y,2.2),b=F.p3(3.05,y+1.1,2.2);wseg(d,a[0],a[1],a[2],b[0],b[1],b[2],.04,grey,GEO.cyl)}
  {const c=cv(256,160),g=c.getContext('2d');g.fillStyle=burnt?'#1a1414':'#b81c24';g.beginPath();g.moveTo(128,4);g.lineTo(252,80);g.lineTo(128,156);g.lineTo(4,80);g.closePath();g.fill();g.lineWidth=7;g.strokeStyle=burnt?'#2a2a2a':'#ffe0a0';g.stroke();
   g.font='900 70px Impact,Arial Black,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=burnt?'#3a3030':'#fff4d8';g.fillText('GAS',128,84);const t=new THREE.CanvasTexture(c);const mt0=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide}),mt=S.style==='inverted'?unlitSignMat(mt0):mt0;
   const m=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.25),mt),q=F.p3(2.4,7.0,2.2);m.position.set(q[0]+st.nrm[0]*.15,q[1],q[2]+st.nrm[1]*.15);m.rotation.y=yaw;grp.add(m)}
  {const tg=new THREE.TorusGeometry(1.25,.52,8,18).toNonIndexed();d.geo(tg,mtx(p[0],10.4,p[1],1,1,1,0,yaw,0),C('#1e1e20'));tg.dispose();
   const c=cv(256,64),g=c.getContext('2d');g.font='800 40px Arial Black,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#e8e4d8';g.fillText(translatePlain('PNEUS'),128,34);const t=new THREE.CanvasTexture(c);
   const mt0=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide}),mt=S.style==='inverted'?unlitSignMat(mt0):mt0,m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),mt),q=F.p3(2.4,11.95,2.2);m.position.set(q[0]+st.nrm[0]*.3,q[1],q[2]+st.nrm[1]*.3);m.rotation.y=yaw;grp.add(m)}
  if(!burnt&&night){const q=F.p3(2.4,5.8,2.2);n.box(q[0]-1.4,5.8,q[2]-1.4,q[0]+1.4,5.86,q[2]+1.4,COL('#ff3a3a'))}
 }else{const p=F.pt(2.2,2.2);d.box(p[0]-.18,.26,p[1]-.18,p[0]+.18,5,p[1]+.18,C('#6a6a72'));F.box(1.2,3.2,2.0,2.4,5,8.6,C(br.a),d);
  const sm0=gasTex('py',br,burnt),sm=S.style==='inverted'?unlitSignMat(sm0):sm0;for(const s of [1,-1]){const sg=new THREE.PlaneGeometry(1.8,3.4),m=new THREE.Mesh(sg,sm),q=F.p3(2.2,6.8,s>0?2.0-.02:2.4+.02);m.position.set(q[0],q[1],q[2]);m.rotation.y=Math.atan2(st.nrm[0]*s,st.nrm[1]*s);grp.add(m)}
  if(!burnt&&night)n.box(p[0]-1.05,8.6,p[1]-1.05,p[0]+1.05,8.7,p[1]+1.05,COL(br.b))}
 if(st.wash)try{washBuild(st,grp,C,d,n)}catch(e){console.error(e)}
 const add=(mb,mat,ro)=>{const m=mb.mesh(mat,true,true);if(m){grp.add(m);if(ro)m.renderOrder=ro}return m};add(d,M.solid);
 {const b=M.solid,mt=b.clone();mt.onBeforeCompile=b.onBeforeCompile;mt.customProgramCacheKey=b.customProgramCacheKey;mt.userData={...b.userData,cached:false};const m=add(rf,mt);st.roof=m?{m,mat:mt,a:1}:null}add(n,M.neonSt||M.neon);add(h,M.hwinSoft||M.hwin);if(!city.st.noLamps)add(gl,M.glow,2); /* v4 r19: neon do posto fixo (M.neonSt: sem zumbido nem falha por célula de 12 m, que fazia o posto da cidade "falhar" à noite) */
 if(hal.length&&!burnt&&!city.st.noLamps){const m=gasHaloMesh(hal);if(m){grp.add(m);m.renderOrder=3}}
 grp.position.y=-.24; // v77: sem o piso elevado: o pátio do posto assenta no concreto novo
 if(ch&&city.chunks.get(ch.key)===ch)ch.group.add(grp)}
/* v4 r19: halo dos tubos de neon do posto. Faixa vertical aditiva na frente de cada tubo, com pontas redondas (3 quads: ponta, meio, ponta);
   textura = núcleo claro estreito + brilho largo. Halos de alturas diferentes ficam a 6–12 mm um do outro (planos coincidentes contam como z-fight no detector). Material único (GAS.haloMat, cached); a opacidade acompanha o anoitecer em updateDayNight. */
function gasHaloMat(){if(GAS.haloMat)return GAS.haloMat;const c=cv(64,64),g=c.getContext('2d'),im=g.createImageData(64,64);
 for(let j=0;j<64;j++)for(let i=0;i<64;i++){const dx=(i+.5)/32-1,dy=(j+.5)/32-1,dd=Math.min(1,Math.hypot(dx,dy)),v=Math.min(1,Math.exp(-(dd/.13)*(dd/.13))*.9+Math.exp(-(dd/.5)*(dd/.5))*.42)*(1-dd*dd),q=(j*64+i)*4;im.data[q]=im.data[q+1]=im.data[q+2]=Math.round(255*v);im.data[q+3]=255}
 g.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
 const m=jammerBasicMaterial(new THREE.MeshBasicMaterial({map:t,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.userData.cached=true;GAS.haloMat=m;return m}
function gasHaloMesh(H){const nq=H.length/6*3,pos=new Float32Array(nq*18),uv=new Float32Array(nq*12),col=new Float32Array(nq*18);let k=0;const W=new THREE.Color(1,1,1),cc=new THREE.Color();
 const quad=(ax,az,bx,bz,y,w,ox,oz,ua,ub,c)=>{const v=[[ax,y-w,az,ua,0],[bx,y-w,bz,ub,0],[bx,y+w,bz,ub,1],[ax,y-w,az,ua,0],[bx,y+w,bz,ub,1],[ax,y+w,az,ua,1]];
  for(const q of v){pos[k*3]=q[0]+ox;pos[k*3+1]=q[1];pos[k*3+2]=q[2]+oz;uv[k*2]=q[3];uv[k*2+1]=q[4];col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;k++}};
 for(let i=0;i<H.length;i+=6){const A=H[i],B=H[i+1],O=H[i+2],r=H[i+3],hk=H[i+5];cc.copy(H[i+4]).lerp(W,.18).multiplyScalar(hk);
  const ol=Math.hypot(O[0],O[1])||1,oo=r+.03+(Math.round(A[1]*20)%3)*.006,ox=O[0]/ol*oo,oz=O[1]/ol*oo,w=Math.max(.1,r*4.2),L=Math.hypot(B[0]-A[0],B[2]-A[2])||1,tx=(B[0]-A[0])/L,tz=(B[2]-A[2])/L,y=A[1];
  quad(A[0]-tx*w,A[2]-tz*w,A[0],A[2],y,w,ox,oz,0,.5,cc);quad(A[0],A[2],B[0],B[2],y,w,ox,oz,.5,.5,cc);quad(B[0],B[2],B[0]+tx*w,B[2]+tz*w,y,w,ox,oz,.5,1,cc)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.Mesh(g,gasHaloMat());m.frustumCulled=true;g.computeBoundingSphere();return m}
function gasShot(pt,w){if(!pt)return;for(const st of GAS.list.values()){if(st.burnt||!st.pumps)continue;if(Math.abs(st.x-pt.x)>30||Math.abs(st.z-pt.z)>30)continue;
 for(const p of st.pumps)if(Math.hypot(pt.x-p[0],pt.z-p[1])<.95&&pt.y<2.5){st.hits+=w==='magnum'?2:1;for(let i=0;i<8;i++)emit(p[0],1.4,p[1],(Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4,.3,.3,.06,0xffd070,true,1);
  if(st.hits>=2)gasExplode(st,true);return}}}
function gasNearBlast(x,z){for(const st of GAS.list.values()){if(st.burnt||!st.pumps)continue;for(const p of st.pumps)if(Math.hypot(x-p[0],z-p[1])<7.5){gasExplode(st,GAS.by);return}}}
function gasExplode(st,byPlayer){if(st.burnt)return;st.burnt=true;st.burnT=simT;st.fireT=32;st.hits=0;const P=st.pumps;
 const pts=[P[0],P[P.length-1],[st.x,st.z]];pts.forEach((p,i)=>GAS.q.push({t:simT+i*.42,fn:()=>gasBoom(p[0],p[1],byPlayer,i===2)}));
 GAS.q.push({t:simT+.05,fn:()=>{try{gasVisual(st)}catch(e){console.error(e)}}});
 if(byPlayer)GAS.q.push({t:simT+.2,fn:()=>{if(copSees((PL.car||PL).x,(PL.car||PL).z))startWanted()}})}
function gasBoom(x,z,byPlayer,big){GAS.by=byPlayer;blastAt(x,z,null,byPlayer);GAS.by=false;boomLight.position.set(x,6,z);boomLight.intensity=big?40:28;boomT=1.4;
 const K=3;for(let i=0;i<34*K/2;i++){const a=Math.random()*6.28,s=Math.random()*9*K*.7;emit(x,1+Math.random()*3,z,Math.cos(a)*s,4+Math.random()*12,Math.sin(a)*s,.9+Math.random()*.7,5,13,Math.random()<.5?0xff6a10:0xffc040,true,.95)}
 for(let i=0;i<22*K/2;i++){const a=Math.random()*6.28,s=Math.random()*7;emit(x,3,z,Math.cos(a)*s,2.5+Math.random()*5,Math.sin(a)*s,3.5+Math.random()*2,5,18,0x1a1616,false,.8)}
 for(let i=0;i<30;i++){const a=Math.random()*6.28,s=12+Math.random()*20;emit(x,1,z,Math.cos(a)*s,6+Math.random()*12,Math.sin(a)*s,1.1,.4,.1,0xffd070,true,1)}
 const RB=36;for(const v of vehicles){const dx=v.x-x,dz=v.z-z,dd=Math.hypot(dx,dz);if(dd<14||dd>RB)continue;const f=1-dd/RB;v.vx+=dx/dd*f*18;v.vz+=dz/dd*f*18;v.sleep=false;v.sleepT=0;v.hp-=f*70;if(v.ai)v.ai.stun=2;if(v.hp<=0&&v.alive){setOnFire(v);v.fuse=.4+Math.random()}}
 for(const p of peds){const dx=p.x-x,dz=p.z-z,dd=Math.hypot(dx,dz);if(dd<11||dd>26||p.state==='dead')continue;const f=1-dd/26;ouch(p.x,p.z,p.pitch);if(byPlayer)registerKill(p,true);p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;p.state='dead';p.timer=9;p.vx=dx/dd*f*16;p.vz=dz/dd*f*16;p.rot=(Math.random()<.5?1:-1)*Math.PI/2}
 if(!PL.dead){const pc=PL.car||PL,dx=pc.x-x,dz=pc.z-z,dd=Math.hypot(dx,dz);if(PL.car&&dd<20){PL.car.hp-=(1-dd/20)*60;PL.car.vx+=dx/(dd||1)*12*(1-dd/20);PL.car.vz+=dz/(dd||1)*12*(1-dd/20);if(PL.car.hp<=0&&PL.car.alive){setOnFire(PL.car);PL.car.fuse=1.2}}
  else if(!PL.car&&dd>=11&&dd<24){const f=1-dd/24;if(maskSafe())maskBurn();else PL.hp-=armorHit(Math.round(f*75));PL.down=1.6;PL.rot=Math.PI/2;PL.vx=dx/dd*f*16;PL.vz=dz/dd*f*16;if(PL.hp<=0)killPlayer()}}
 shake=Math.max(shake,2.2)}
function gasTick(dt){const pc=PL.car||PL;
 if(GAS.q.length){const now=GAS.q.filter(e=>e.t<=simT);GAS.q=GAS.q.filter(e=>e.t>simT);for(const e of now)try{e.fn()}catch(err){console.error(err)}}
 let nearSt=null,nd=1e9;
 for(const st of GAS.list.values()){if(!st.pumps)continue;const dd=Math.hypot(st.x-pc.x,st.z-pc.z);if(dd<nd){nd=dd;nearSt=st}
  if(st.fireT>0){st.fireT-=dt;if(dd<260&&!PL.inside)for(const p of st.pumps){if(Math.random()<dt*7)emit(p[0]+(Math.random()-.5),1+Math.random(),p[1]+(Math.random()-.5),(Math.random()-.5)*.8,2+Math.random()*2,(Math.random()-.5)*.8,.6,1.2,2.6,Math.random()<.5?0xff6a10:0xffb030,true,.85*Math.min(1,st.fireT/8));
    if(Math.random()<dt*4)emit(p[0],2.5,p[1],(WX.wx||1)*.4,2.5+Math.random(),(WX.wz||.6)*.4,4,2,7,0x1c1a18,false,.55*Math.min(1,st.fireT/8))}}
  if(st.burnt&&simT-st.burnT>360&&dd>220){st.burnt=false;st.fireT=0;try{gasVisual(st)}catch(e){console.error(e)}}
  if(st.burnt||dd>90)continue;
  for(const c of carsNearTmp(st.x,st.z,40)){if(!c.alive||c.t.boat)continue;const sp=Math.hypot(c.vx,c.vz),pv=GAS.pv.get(c);GAS.pv.set(c,sp);if(pv===undefined)continue;
   if(pv>6.5&&pv-sp>3.2){const ca=Math.cos(c.a),sa=Math.sin(c.a);for(const p of st.pumps){const dx=p[0]-c.x,dz=p[1]-c.z,lx=Math.abs(dx*ca+dz*sa)-c.t.L/2,lz=Math.abs(-dx*sa+dz*ca)-c.t.W/2;if(Math.hypot(Math.max(lx,0),Math.max(lz,0))<1.9){gasExplode(st,c===PL.car||(c===PL.lastCar&&!c.ai));break}}if(st.burnt)break}}}
 if(nearSt&&nearSt.wash&&nd<60)try{washTick(nearSt,dt)}catch(e){console.error(e)}
 if(nearSt&&nearSt.roof&&nd<90)gasRoofTick(nearSt,dt);
 // seta da loja
 if(!GAS.arrow)GAS.arrow=makeArrow();const ar=GAS.arrow;const show=nearSt&&!nearSt.burnt&&!PL.inside&&nd<140;ar.visible=!!show;if(show){ar.position.set(nearSt.door.x,1.5+Math.sin(simT*3)*.18,nearSt.door.z);ar.rotation.y=simT*1.8}
 // abastecer / consertar
 if(PL.car&&nearSt&&!nearSt.burnt&&nd<30&&!PL.dead){const c=PL.car;if(Math.hypot(c.vx,c.vz)<1.3&&!c.t.boat)for(const s of nearSt.spots)if(Math.hypot(c.x-s[0],c.z-s[1])<2.6){CTX.car=true;CTX.st=nearSt;break}}
 // entrar na loja
 if(!PL.inside&&!PL.car&&!PL.dead&&SHOP.lock<=0&&nearSt&&!nearSt.burnt&&Math.hypot(PL.x-nearSt.door.x,PL.z-nearSt.door.z)<1.1)enterShop(nearSt);
 else if(!PL.inside&&!PL.car&&nearSt&&nearSt.burnt&&nd<40&&Math.hypot(PL.x-nearSt.door.x,PL.z-nearSt.door.z)<1.3&&!GAS.cmsg){GAS.cmsg=true;toast('LOJA FECHADA<br><small style="font-size:11px;color:#fff">reabre em 6 horas</small>')}else if(nd>40)GAS.cmsg=false}
/* r61 · CARRO SUJO: terra (estrada rural) suja devagar, lama (poças) suja rápido; chuva no asfalto lava um pouco.
   Visual: a lataria do carro do jogador ganha um material próprio com a cor puxada para o barro (só ele; o material do tipo é compartilhado).
   Lavar no posto: 3ª opção do menu da bomba (teclado X / clique do meio, controle ▼ no direcional, toque no item). */
const DIRT_COL=new THREE.Color('#9a7a50'),WASH_PRICE=15;
function dirtTick(dt){const c=PL.car;if(!c||!c.alive||c.t.boat||c.t.hover||c.type==='jetski')return;const sp=Math.hypot(c.vx||0,c.vz||0);c.grime=c.grime||0;
 if(sp>1&&!(c.airY>0)){const mud=c.mudG||0,rural=isRural(c.x,c.z);let k=mud>.02?.0045:rural?.0007:0;if(k){const r=rainAt(c.x,c.z);if(r>.2)k*=1.6;c.grime=Math.min(1,c.grime+k*sp*dt)}
  else if(rainAt(c.x,c.z)>.3)c.grime=Math.max(0,c.grime-.004*dt)}
 if((c.grimeT=(c.grimeT||0)-dt)<=0){c.grimeT=.5;dirtApply(c)}}
function dirtApply(c){const sh=c.dentParts&&c.dentParts.shell;if(!sh)return;const d=c.grime||0;
 if(d<.04){if(c.grimeMat&&sh.material===c.grimeMat&&c.grimeBase){sh.material=c.grimeBase}return}
 const base=sh.material===c.grimeMat?c.grimeBase:sh.material;if(!base||base.userData.burnt)return;
 if(!c.grimeMat||c.grimeBase!==base){if(c.grimeMat)c.grimeMat.dispose();const m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;m.userData={...base.userData,cached:false,dirt:true};c.grimeMat=m;c.grimeBase=base}
 const f=Math.min(.78,d*.78);c.grimeMat.color.setRGB(1,1,1).lerp(DIRT_COL,f);c.grimeMat.roughness=Math.min(1,(c.grimeBase.roughness??.5)+d*.5);if(sh.material!==c.grimeMat)sh.material=c.grimeMat}
/* toque/clique numa linha do menu da bomba = aquela opção (1 abastecer, 2 consertar, 3 lavar) */
setTimeout(()=>{const tg=document.getElementById('pumpTag');if(!tg||tg.dataset.tap)return;tg.dataset.tap='1';const go=e=>{if(!CTX.car||!PL.car)return;e.preventDefault();e.stopPropagation();const r=tg.getBoundingClientRect(),y=(e.touches?e.touches[0].clientY:e.clientY)-r.top-5,n=Math.floor(y/((r.height-10)/(tg.querySelectorAll('br').length+1)))+1;if(n>=1&&n<=2){initAudio();ctxAct(n)}};
 tg.addEventListener('touchstart',go,{passive:false});tg.addEventListener('mousedown',go)},0);
function carWash(c){if(!c)return;if((c.grime||0)<.04){toast(translatePlain('O CARRO JÁ ESTÁ LIMPO'));return}if((PL.money||0)<WASH_PRICE){toast('SEM DINHEIRO · $'+WASH_PRICE);clang(.1);return}
 money(-WASH_PRICE);c.grime=0;dirtApply(c);try{for(let i=0;i<24;i++)emit(c.x+(Math.random()-.5)*c.t.W,1+Math.random()*1.2,c.z+(Math.random()-.5)*c.t.L,(Math.random()-.5)*1.5,1+Math.random(),(Math.random()-.5)*1.5,.5,.35,.9,0xd8f4ff,true,.8)}catch(e){}
 toast(translatePlain('CARRO LAVADO')+' · −$'+WASH_PRICE)}
/* ---------- v3 r58 · LAVA-JATO de rolete (pedido do José) ----------
   Pórtico azul que corre em 2 trilhos por cima do carro parado: 2 roletes de pé + 1 deitado, respingo de água (emit) e chiado.
   Área em st.wash (u/v do posto, sem GAS_SHIFT), montada no gasBuild; parte fixa no lote d do gasVisual; pórtico = grupo próprio (st.wash.g).
   Pare o carro entre os trilhos: começa sozinho, $15 no fim, sujeira zera. Sair do lugar cancela sem cobrar. Carro grande (L>6 ou H>2.6) não cabe. */
const WASH={T:7,tex:null,mats:null,snd:null};
function washMats(){if(WASH.mats)return WASH.mats;const c=cv(64,256),g=c.getContext('2d');for(let x=0;x<64;x+=8){g.fillStyle=(x/8)%2?'#2f86e8':'#7ac4ff';g.fillRect(x,0,8,256)}for(let i=0;i<220;i++){g.fillStyle='rgba(255,255,255,.35)';g.fillRect(Math.random()*64,Math.random()*256,1,5)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;const r=new THREE.MeshLambertMaterial({map:t});r.userData.cached=true;
 const c2=cv(512,96),g2=c2.getContext('2d');g2.fillStyle='#1f5fbf';g2.fillRect(0,0,512,96);g2.font='900 64px Impact,Arial Black,sans-serif';g2.textAlign='center';g2.textBaseline='middle';g2.fillStyle='#fff';g2.fillText(S.lang==='en'?'CAR WASH':'LAVA-JATO',256,52);
 const t2=new THREE.CanvasTexture(c2);const sg=new THREE.MeshBasicMaterial({map:t2});sg.userData.cached=true;WASH.mats={r,sg};return WASH.mats}
function washBuild(st,grp,C,d,n){const w=st.wash,F=st.F,burnt=st.burnt,{u0,u1,v0,v1}=w,uc=(u0+u1)/2,gp=F.pt(uc,(v0+v1)/2),y=w.y=(parkingGroundAt(gp[0],gp[1])?0:groundY0(gp[0],gp[1]))+.24; /* grp do posto em −.24. v4 r5: o piso do lote do posto do centro fica em .2, mas lote marcado como estacionamento (o da periferia) fica em 0 — usar o mesmo critério do groundY, senão a base flutua */
 /* base, faixas e trilhos (fixos, no lote do posto) */
 F.box(u0,u1,v0,v1,y,y+.03,C('#8e959e'),d);for(const v of [v0,v1-.22])F.box(u0+.5,u1-.5,v,v+.22,y+.03,y+.05,C('#f2c21a'),d);
 for(const u of [u0,u1-.5]){F.box(u,u+.5,v0+.15,v1-.15,y+.03,y+.12,C('#5a5e66'),d);F.box(u+.18,u+.32,v0+.15,v1-.15,y+.12,y+.16,C('#2a2a30'),d)}
 F.box(u0+.5,u1-.5,v0+.3,v1-.3,y+.03,y+.045,C('#7a828c'),d);
 /* pórtico (grupo que anda): eixo local x = u, z = v; origem no meio da largura */
 const o=F.pt(0,0),a=F.pt(1,0),b=F.pt(0,1),du=[a[0]-o[0],a[1]-o[1]],dv=[b[0]-o[0],b[1]-o[1]],hw=(u1-u0)/2,g=new THREE.Group();
 g.rotation.y=Math.atan2(dv[0],dv[1]);
 const m=new MB(),BL=C('#1f5fbf'),YL=C('#ffd21a'),GR=C('#2a2a30');
 for(const s of [-1,1]){const x=s*(hw-.25);m.box(x-.2,y+.12,-.32,x+.2,y+3.05,.32,BL);m.box(x-.24,y+.1,-.38,x+.24,y+.3,.38,GR)}
 m.box(-hw+.05,y+2.85,-.42,hw-.05,y+3.35,.42,BL);m.box(-hw+.05,y+3.1,-.44,hw-.05,y+3.18,.44,YL);
 m.box(-hw+.4,y+2.6,-.08,hw-.4,y+2.85,.08,GR);
 const fm=m.mesh(city.M.solid,true,true);if(fm)g.add(fm);
 const {r,sg}=washMats(),rv=[],geo=new THREE.CylinderGeometry(.36,.36,1,14);
 for(const s of [-1,1]){const k=new THREE.Mesh(geo,r);k.scale.y=2.3;k.position.set(s*(hw-.85),y+.2+1.15,0);k.userData.s=s;g.add(k);rv.push(k)}
 const piv=new THREE.Group();piv.rotation.z=Math.PI/2;piv.position.set(0,y+2.3,0);const top=new THREE.Mesh(geo,r);top.scale.y=hw*2-1.3;piv.add(top);g.add(piv);
 const pg=new THREE.PlaneGeometry(hw*2-.4,.46);for(const s of [-1,1]){const p=new THREE.Mesh(pg,sg);p.position.set(0,y+3.1,s*.45);p.rotation.y=s>0?0:Math.PI;g.add(p)}
 g.userData={rv,top,piv,hw,uc};w.g=g;w.side=rv;washPlace(st,w.park=v1-.6,0,null);grp.add(g);if(burnt)g.traverse(q=>{if(q.isMesh&&q.material!==city.M.solid){q.material=q.material.clone();q.material.color.setRGB(.12,.11,.1)}})}
function washPlace(st,v,spin,c){const w=st.wash,g=w.g;if(!g)return;const ud=g.userData,p=st.F.pt(ud.uc,v);g.position.set(p[0],0,p[1]);
 const half=c?Math.min(ud.hw-.85,c.t.W/2+.38):ud.hw-.85;for(const k of ud.rv){k.position.x=k.userData.s*half;k.rotation.y+=spin*k.userData.s}
 ud.piv.position.y=c?Math.min(w.y+2.3,w.y+c.t.H+.4):w.y+2.3;ud.top.rotation.y+=spin;
 /* o buildChunk congela as matrizes do chunk (matrixAutoUpdate=false): o pórtico se atualiza à mão */
 g.traverse(o=>o.updateMatrix());g.updateMatrixWorld(true)}
function washFits(c){return c&&c.alive&&!c.t.boat&&!c.t.hover&&c.type!=='jetski'&&c.type!=='vortex'&&c.t.L<=6&&c.t.H<=2.6}
function washInLane(st,c){const w=st.wash,o=st.F.pt(0,0),a=st.F.pt(1,0),b=st.F.pt(0,1);const dx=c.x-o[0],dz=c.z-o[1],u=dx*(a[0]-o[0])+dz*(a[1]-o[1]),v=dx*(b[0]-o[0])+dz*(b[1]-o[1]);
 return{u,v,ok:Math.abs(u-(w.u0+w.u1)/2)<1.1&&v>w.v0+1&&v<w.v1-1,near:u>w.u0-1&&u<w.u1+1&&v>w.v0-4&&v<w.v1+.5}}
function washSnd(on){if(!AC)return;if(on&&!WASH.snd){const s=AC.createBufferSource();s.buffer=AC._noise;s.loop=true;const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=1800;const g=AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.07,AC.currentTime+.4);s.connect(f);f.connect(g);g.connect(master);s.start();WASH.snd={s,g}}
 else if(!on&&WASH.snd){const{s,g}=WASH.snd;WASH.snd=null;try{g.gain.linearRampToValueAtTime(0,AC.currentTime+.3);s.stop(AC.currentTime+.35)}catch(e){}}}
function washTick(st,dt){const w=st.wash;if(!w.g||!w.g.parent||st.burnt){if(w.t>=0){w.t=-1;washSnd(false)}return}const c=PL.car;
 if(w.t>=0){const cc=w.car;const L=cc&&cc.alive&&PL.car===cc?washInLane(st,cc):null;
  if(!L||!L.ok||Math.hypot(cc.x-w.cx,cc.z-w.cz)>1.2){w.t=-1;washSnd(false);w.msgT=simT+3;toast(translatePlain('LAVAGEM CANCELADA'));return}
  w.idle=false;w.t+=dt;const k=Math.min(1,w.t/WASH.T),ph=(1-Math.cos(k*Math.PI*2))/2,front=w.v0+.6,vv=w.park+(front-w.park)*ph;washPlace(st,vv,dt*9,cc);
  /* respingo: névoa branca em volta do carro, mais forte onde o pórtico está */
  const g=w.g,ud=g.userData,ca=Math.cos(cc.a),sa=Math.sin(cc.a);
  for(let i=0;i<6;i++){const sd=Math.random()<.5?-1:1,ox=(sd*(cc.t.W/2+.2))*(-sa),oz=(sd*(cc.t.W/2+.2))*ca,px=g.position.x+ox+(Math.random()-.5)*.8,pz=g.position.z+oz+(Math.random()-.5)*.8;
   emit(px,.4+Math.random()*1.6,pz,ox*1.1+(Math.random()-.5)*.8,.5+Math.random()*1.1,oz*1.1+(Math.random()-.5)*.8,.9+Math.random()*.6,.5,2.3,0xf4faff,false,.62)}
  if(Math.random()<dt*30){const px=g.position.x+(Math.random()-.5)*cc.t.W,pz=g.position.z+(Math.random()-.5)*.8;emit(px,cc.t.H+.5,pz,(Math.random()-.5)*1.2,1+Math.random(),(Math.random()-.5)*1.2,.6,.3,1.1,0xd8f0ff,false,.5)}
  if(Math.random()<dt*10){const px=cc.x+(Math.random()-.5)*cc.t.W,pz=cc.z+(Math.random()-.5)*cc.t.L;emit(px,.35,pz,(Math.random()-.5)*2,.6,(Math.random()-.5)*2,.5,.2,.7,0xffffff,true,.35)}
  if(k>=1){w.t=-1;washSnd(false);washPlace(st,w.park,0,null);money(-WASH_PRICE);cc.grime=0;dirtApply(cc);toast(translatePlain('CARRO LAVADO')+' · −$'+WASH_PRICE);w.msgT=simT+4;w.done=cc}
  return}
 if(!w.idle){w.idle=true;washPlace(st,w.park,0,null)}
 if(!c||PL.dead||!c.alive){w.stopT=0;return}const L=washInLane(st,c);if(!L.near){w.stopT=0;w.done=null;return}if(w.done===c)return;
 if(!washFits(c)){if(simT>w.msgT){w.msgT=simT+6;toast(translatePlain('NÃO CABE NO LAVA-JATO'))}return}
 if(!L.ok){w.stopT=0;return}
 if(Math.hypot(c.vx||0,c.vz||0)>.8){w.stopT=0;return}w.stopT+=dt;if(w.stopT<.8||simT<w.msgT)return;
 if((c.grime||0)<.04){w.msgT=simT+8;toast(translatePlain('O CARRO JÁ ESTÁ LIMPO'));return}
 if((PL.money||0)<WASH_PRICE){w.msgT=simT+6;toast('SEM DINHEIRO · $'+WASH_PRICE);clang(.1);return}
 w.t=0;w.car=c;w.cx=c.x;w.cz=c.z;w.stopT=0;initAudio();washSnd(true)}
function washHint(){const c=PL.car;if(!c||PL.inside)return'';for(const st of GAS.list.values()){const w=st.wash;if(!w||st.burnt||!w.g||Math.abs(st.x-c.x)>40||Math.abs(st.z-c.z)>40)continue;if(w.t>=0)return translatePlain('LAVANDO…');const L=washInLane(st,c);if(L.near&&washFits(c))return translatePlain('LAVA-JATO · PARE ENTRE OS TRILHOS · $15')}return''}
/* v4 r5 · na vista de cima/isométrica a cobertura fica transparente com o jogador (ou o carro) embaixo dela (pedido do José, como o viaduto sobre as lanchas) */
function gasRoofTick(st,dt){const r=st.roof,f=st.fc,p=PL.car||PL,mg=st.retro?4:1.5;
 const under=camMode==='top'&&!PL.inside&&!TVM.on&&!PHOTO.on&&!!f&&p.x>f[0]-mg&&p.x<f[2]+mg&&p.z>f[1]-mg&&p.z<f[3]+mg,want=under?.16:1;if(r.a===want)return;
 r.a+=(want-r.a)*(1-Math.exp(-dt*10));if(Math.abs(r.a-want)<.01)r.a=want;const tr=r.a<1;if(r.mat.transparent!==tr){r.mat.transparent=tr;r.mat.depthWrite=!tr;r.mat.needsUpdate=true}r.mat.opacity=r.a;r.m.castShadow=!tr||r.a>.9;
 for(const m of st.roofSigns||[])m.visible=r.a>.6}
function gasCosts(c){return{f:Math.ceil((100-(c.fuel===undefined?100:c.fuel))*.6),r:Math.ceil((100-c.hp)*1.2)}}
function ctxAct(n){if(n===1&&ONLINE.on&&netImpoundTry())return;if(invRoom()){if(n===1&&simT>(INVROOM.msgT||0)){INVROOM.msgT=simT+2;toast(translatePlain('NADA FUNCIONA AQUI'))}return}if(n===1&&bankAtmNear()){bankDlgOpen();return}if(n===1&&newsNear()){newsBuy();return}if(n===1&&PL.inside==='ammo'&&ammoCounterNear()){ammoOpen();return}if(n===1&&petAdopt())return;if(n===1&&PL.inside===true&&QUEST.pier.state==='home'&&SAFE.mate&&Math.hypot(PL.x-SAFE.mate.x,PL.z-SAFE.mate.z)<3.2){storyReunionDialog();return}if(n===1&&(PL.inside==='heist'||PL.inside==='pawn')&&heistAct())return;if((PARA.active||paraNear())&&paraAct())return;initAudio();if(n===1&&paraAct())return;if(n===1&&!PL.car&&empAct())return;if(n===1&&bankCounterNear()&&!BANK.rob){bankRobStart();return}if(n===1&&casinoTableNear()){tableGameOpen(casinoTableNear().kind);return}if(n===1&&slotNear()>=0){slotOpen();return}if(CTX.club&&n===1&&!PL.car){clubDrink();return}if(n===1&&!PL.car&&dbBoothNear()){dbBoothAct(dbBoothNear());return}if(n===1&&bedNear()){bedSave();return}if(n===1&&!PL.car&&duoCtx())return;if(n===1&&wardNear()){openWard('home');return}if(n===1&&dealNear()){dealOpen();return}if(n===1&&jailBail())return;if(CTX.mall&&n===1&&!PL.car){mallAct(CTX.mall);return}
 if(CTX.car&&PL.car){const c=PL.car,k=gasCosts(c);
  if(n===3)return; /* v3 r58: lavar saiu da bomba, agora é o lava-jato */
  if(n===1){if(k.f<=0){toast('TANQUE CHEIO');return}if((PL.money||0)<=0){toast('SEM DINHEIRO');clang(.1);return}const pay=Math.min(k.f,PL.money),add=pay/.6;c.fuel=Math.min(100,(c.fuel||0)+add);money(-pay);toast('ABASTECIDO · −$'+pay+(c.fuel<99.5?'<br><small style="font-size:11px;color:#fff">o dinheiro só deu pra '+Math.round(c.fuel)+'%</small>':''));glug();return}
  if(n===2){if(k.r<=0){toast('O CARRO ESTÁ INTEIRO');return}if((PL.money||0)<k.r){toast('DINHEIRO INSUFICIENTE · CONSERTO $'+k.r);clang(.1);return}money(-k.r);repairCar(c);toast('CARRO CONSERTADO · −$'+k.r);clang(.3);return}}
 if(CTX.shop&&n===1)shopBuy()}
function glug(){if(!AC)return;const t=AC.currentTime;for(let i=0;i<6;i++){const o=AC.createOscillator();o.type='sine';o.frequency.setValueAtTime(180+Math.random()*60,t+i*.09);o.frequency.exponentialRampToValueAtTime(90,t+i*.09+.07);const g=AC.createGain();g.gain.setValueAtTime(.12,t+i*.09);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.08);o.connect(g);g.connect(master);o.start(t+i*.09);o.stop(t+i*.09+.09)}}
/* ---------- loja de conveniência (interior) ---------- */
const SHOP={IN:null,grp:null,st:null,cashier:null,arrIn:null,lock:0,rob:0,alarm:false,alarmT:0,robbed:new Map(),buyCd:0,W:7,D:5};
const CLERK_PAL={cap:'#c8202a',capDark:'#7a1016',skin:'#c68642',hair:'#1a1010',shirt:'#d8282a',pants:'#2a2a33',shoes:'#111',belt:'#111',stripe:'#f2c21a'};
function buildShop(){if(SHOP.grp){scene.remove(SHOP.grp);disposeGroup(SHOP.grp)}if(!SHOP.arrIn)SHOP.arrIn=makeArrow();
 const IN={x:SAFE.IN.x+60,z:SAFE.IN.z};SHOP.IN=IN;const X=IN.x,Z=IN.z,W=SHOP.W,D=SHOP.D,H=3.2,C=h=>COL(h);const g=new THREE.Group();SHOP.grp=g;scene.add(g);const mb=new MB();
 const t1=C('#e8e6e0'),t2=C('#a8a8b0');for(let x=X-W;x<X+W;x++)for(let z=Z-D;z<Z+D;z++)mb.quad([x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z],0,1,0,[0,0,1,1],((x+z)&1)?t1:t2);
 const wl=C('#f0ece0'),wl2=C('#e4dccb');
 mb.qa([X-W,0,Z-D],[X+W,0,Z-D],[X+W,H,Z-D],[X-W,H,Z-D],wl,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wl,[X,1,Z+D+9]);
 mb.qa([X-W,0,Z-D],[X-W,0,Z+D],[X-W,H,Z+D],[X-W,H,Z-D],wl2,[X-W-9,1,Z]);mb.qa([X+W,0,Z-D],[X+W,0,Z+D],[X+W,H,Z+D],[X+W,H,Z-D],wl2,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],C('#dcdad2'),[X,H+9,Z]);
 ibox(mb,X-W,0,Z-D,X+W,.14,Z-D+.04,C('#c8202a'));ibox(mb,X-W,0,Z+D-.04,X+W,.14,Z+D,C('#c8202a'));ibox(mb,X-W,2.6,Z-D,X+W,2.75,Z-D+.04,C('#c8202a'));
 // vitrine na frente e porta de vidro
 ibox(mb,X-W+.3,.8,Z+D-.06,X-1.2,2.5,Z+D,C('#2a3a4a'));ibox(mb,X+1.2,.8,Z+D-.06,X+W-.3,2.5,Z+D,C('#2a3a4a'));ibox(mb,X-1,0,Z+D-.07,X+1,2.3,Z+D,C('#7ab0d0'));ibox(mb,X-1.05,2.3,Z+D-.1,X+1.05,2.4,Z+D,C('#3a3a40'));ibox(mb,X-.03,0,Z+D-.1,X+.03,2.3,Z+D-.05,C('#3a3a40'));
 // balcão do caixa (lado esquerdo) e área de funcionário
 const ck=C('#5a3a28'),ctop=C('#d8d0c0');ibox(mb,X-6.4,0,Z-1.0,X-2.2,1.0,Z-.3,ck);ibox(mb,X-6.5,1.0,Z-1.1,X-2.1,1.08,Z-.2,ctop);ibox(mb,X-2.2,0,Z-4.95,X-2.0,1.0,Z-1.0,ck);
 ibox(mb,X-4.1,1.08,Z-.95,X-3.3,1.4,Z-.5,C('#2a2a30'));ibox(mb,X-4.0,1.4,Z-.9,X-3.4,1.62,Z-.82,C('#5aff8a'));ibox(mb,X-5.6,1.08,Z-.9,X-4.9,1.35,Z-.45,C('#f2c21a'));
 // prateleira de cigarros e bebidas atrás do caixa
 ibox(mb,X-6.8,0,Z-4.95,X-2.4,2.4,Z-4.55,C('#4a3a30'));for(let r=0;r<4;r++)for(let k=0;k<11;k++){const cc=['#d8202a','#f2f2ee','#2a5ab0','#f2c21a','#1e8a3a','#ff8a1a'][(r*5+k*3)%6];ibox(mb,X-6.7+k*.39,.4+r*.5,Z-4.55,X-6.4+k*.39,.75+r*.5,Z-4.45,C(cc))}
 // gôndolas
 const prod=['#d8202a','#f2c21a','#2a8ad6','#3ab36a','#ff6fae','#f2f2ee','#7a4ad6','#ff8a1a','#5a3a24'];
 for(const gx of [X+.6,X+3.4]){ibox(mb,gx-.45,0,Z-2.6,gx+.45,1.55,Z+1.6,C('#d8d8dc'));ibox(mb,gx-.5,1.55,Z-2.65,gx+.5,1.62,Z+1.65,C('#c8202a'));
  for(const s of [-1,1])for(let r=0;r<3;r++)for(let k=0;k<10;k++){const z0=Z-2.5+k*.41,y0=.2+r*.5,cc=C(prod[(k*7+r*3+(s>0?2:0)+Math.round(gx))%prod.length]),xs=s<0?gx-.52:gx+.45;ibox(mb,xs,y0,z0,xs+.07,y0+.32+((k+r)%3)*.05,z0+.33,cc)}}
 // geladeiras no fundo à direita
 for(let k=0;k<5;k++){const x0=X+.2+k*1.3;ibox(mb,x0,0,Z-4.95,x0+1.25,2.35,Z-4.2,C('#c8ccd4'));ibox(mb,x0+.08,.2,Z-4.21,x0+1.17,2.2,Z-4.15,C('#bfefff'));for(let r=0;r<4;r++)for(let j=0;j<4;j++)ibox(mb,x0+.15+j*.26,.3+r*.48,Z-4.5,x0+.33+j*.26,.62+r*.48,Z-4.3,C(prod[(k*3+r*2+j)%prod.length]))}
 // máquina de café / raspadinha, caixa eletrônico, cone de piso molhado, cesta
 ibox(mb,X+6.2,0,Z+.8,X+6.95,1.0,Z+3.8,C('#5a5a62'));ibox(mb,X+6.3,1.0,Z+1.0,X+6.9,1.9,Z+1.8,C('#e8202a'));ibox(mb,X+6.3,1.0,Z+2.2,X+6.9,1.7,Z+3.0,C('#2ad6ff'));ibox(mb,X+6.3,1.0,Z+3.1,X+6.9,1.5,Z+3.6,C('#3a2a20'));
 ibox(mb,X+4.6,0,Z+4.2,X+5.6,2.0,Z+4.95,C('#3a3a44'));ibox(mb,X+4.75,1.2,Z+4.18,X+5.45,1.7,Z+4.22,C('#5ad0ff'));
  /* v79r2: sem o cone e a cesta soltos no piso */
 ibox(mb,X-6.9,0,Z+1.2,X-6.3,1.5,Z+4.2,C('#d8d8dc'));for(let r=0;r<3;r++)for(let k=0;k<6;k++)ibox(mb,X-6.3,.25+r*.45,Z+1.3+k*.48,X-6.22,.55+r*.45,Z+1.7+k*.48,C(prod[(r+k*2)%prod.length]));
 /* v78 · ACABAMENTO DA CONVENIÊNCIA (mesmo layout e colisões; tudo no mesmo lote de malha + placas pintadas) */
 {const sg=(txt,w,h,bg,fg,x,y,z,ry,fs,sub)=>{const c=cv(Math.round(w*96),Math.round(h*96)),q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,c.width,c.height);q.fillStyle=fg;q.textAlign='center';q.textBaseline='middle';const fit=(t,px,y)=>{let f=px;q.font='700 '+f+'px Silkscreen,monospace';while(f>8&&q.measureText(t).width>c.width*.9){f--;q.font='700 '+f+'px Silkscreen,monospace'}q.fillText(t,c.width/2,y)};fit(translatePlain(txt),fs||Math.round(c.height*(sub?.36:.42)),sub?c.height*.36:c.height/2);if(sub)fit(translatePlain(sub),Math.round(c.height*.26),c.height*.74)
   const t=new THREE.CanvasTexture(c);const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));o.position.set(x,y,z);o.rotation.y=ry||0;g.add(o);return o};
  // forro de placas: grade fina no teto
  for(let x=X-W+1.2;x<X+W;x+=1.2)ibox(mb,x-.015,H-.03,Z-D,x+.015,H,Z+D,C('#d2d0c8'));for(let z=Z-D+1.2;z<Z+D;z+=1.2)ibox(mb,X-W,H-.03,z-.015,X+W,H,z+.015,C('#d2d0c8'));
  // calhas das fluorescentes
  for(const[lx,lz] of [[X-3.5,Z-2],[X+2,Z-2],[X-3.5,Z+2.5],[X+2,Z+2.5]]){ibox(mb,lx-1.2,H-.08,lz-.32,lx+1.2,H-.03,lz-.28,C('#d8d8dc'));ibox(mb,lx-1.2,H-.08,lz+.28,lx+1.2,H-.03,lz+.32,C('#d8d8dc'))}
  // sujeira e marcas no piso; tapete da entrada
  for(let k=0;k<14;k++){const a=X-W+.6+((k*37)%13)/13*(2*W-1.2),b=Z-D+.6+((k*53)%11)/11*(2*D-1.2),w=.3+((k*7)%5)*.12;ibox(mb,a,.004,b,a+w,.008,b+w*.7,C(k%3?'#9a988e':'#7f7c70'))}
  ibox(mb,X-1.3,.004,Z+D-1.5,X+1.3,.02,Z+D-.12,C('#2a2a30'));ibox(mb,X-1.15,.02,Z+D-1.35,X+1.15,.024,Z+D-.27,C('#3a5ad6'));
  // geladeiras: cabeçalho iluminado, molduras, puxadores
  ibox(mb,X+.2,2.35,Z-4.95,X+6.7,2.62,Z-4.2,C('#2a2a32'));sg('BEBIDAS GELADAS',6.2,.24,'#0d6ad6','#ffffff',X+3.45,2.485,Z-4.19,0);
  for(let k=0;k<=5;k++){const x0=X+.2+k*1.3;ibox(mb,x0-.03,.15,Z-4.17,x0+.03,2.3,Z-4.12,C('#8a8e98'))}
  for(let k=0;k<5;k++){const x0=X+.2+k*1.3;ibox(mb,x0+1.05,.9,Z-4.13,x0+1.1,1.6,Z-4.06,C('#e8e8ec'));ibox(mb,x0+.12,2.12,Z-4.18,x0+1.13,2.16,Z-4.14,C('#fffbe8'))}
  // gôndolas: trilho de preço com etiquetas, ponta promocional e placas penduradas
  for(const gx of [X+.6,X+3.4])for(const s2 of [-1,1]){const xs=s2<0?gx-.53:gx+.46;for(let r=0;r<3;r++){const y=.16+r*.5;ibox(mb,xs,y,Z-2.55,xs+.07,y+.05,Z+1.55,C('#f4f4f0'));for(let k=0;k<10;k+=2)ibox(mb,s2<0?xs-.005:xs+.07,y,Z-2.45+k*.41,s2<0?xs:xs+.075,y+.05,Z-2.25+k*.41,C('#f2c21a'))}}
  for(const[gx,lbl,col] of [[X+.6,'SNACKS','#d8202a'],[X+3.4,'DOCES · MERCEARIA','#3ab36a']]){
   for(let i=0;i<3;i++)for(let j=0;j<3-i;j++)ibox(mb,gx-.42+j*.3,i*.28,Z+1.7,gx-.14+j*.3,i*.28+.26,Z+2.05,C(['#f2c21a','#d8202a','#ff8a1a'][(i+j)%3]));
   sg('OFERTA',.8,.36,'#ff2a2a','#ffffff',gx,.4,Z+2.062,0,null,'2 POR $5'); /* v79r4: cartaz colado na frente da pilha (antes flutuava acima dela) */
   ibox(mb,gx-.01,1.62,Z-2.1,gx+.01,1.99,Z+1.1,C('#3a3a40'));sg(lbl,3.2,.34,col,'#ffffff',gx+.012,1.8,Z-.5,Math.PI/2);sg(lbl,3.2,.34,col,'#ffffff',gx-.012,1.8,Z-.5,-Math.PI/2)} /* v79r2: placa assentada no topo da gôndola, virada pros corredores (antes pendurada solta do teto) */
  // balcão: chapa de salsicha, display de doces na frente, maquininha, raspadinhas
  ibox(mb,X-3.1,1.08,Z-.95,X-2.3,1.2,Z-.45,C('#9aa0a8'));for(let k=0;k<5;k++)mb.geo(GEO.cyl,mtx(X-2.7,1.24,Z-.88+k*.1,.035,.7,.035,0,0,Math.PI/2),C(k%2?'#c8642a':'#b8582a'));
  ibox(mb,X-3.15,1.2,Z-.95,X-2.25,1.44,Z-.93,C('#cfe8f0'));
  for(let r=0;r<3;r++)for(let k=0;k<9;k++)ibox(mb,X-6.3+k*.46,.18+r*.26,Z-.31,X-5.94+k*.46,.38+r*.26,Z-.24,C(prod[(r*4+k)%prod.length]));
  ibox(mb,X-6.3,1.08,Z-.85,X-6.0,1.18,Z-.6,C('#1a1a20'));ibox(mb,X-6.27,1.18,Z-.83,X-6.03,1.2,Z-.72,C('#5ad0ff'));
  mb.geo(GEO.cyl,mtx(X-2.6,1.2,Z-.35,.09,.24,.09),C('#cfe8f0'));
  for(let k=0;k<6;k++)ibox(mb,X-6.6+k*.42,2.45,Z-4.55,X-6.24+k*.42,2.95,Z-4.5,C(['#f2c21a','#3ab36a','#ff6fae','#2a8ad6','#ff8a1a','#d8202a'][k]));sg('LOTERIA · RASPADINHA',2.6,.24,'#111','#f2c21a',X-5.4,3.07,Z-4.49,0);
  // câmera de segurança e espelho convexo no canto
  mb.geo(GEO.sph,mtx(X-6.6,H-.12,Z-4.6,.16,.12,.16),C('#1a1a20'));mb.geo(GEO.sph,mtx(X+W-.25,H-.4,Z-D+.25,.35,.35,.08,0,-Math.PI/4,0),C('#c8d0d8'));
  ibox(mb,X+W-.45,H-.2,Z-D+.08,X+W-.08,H-.12,Z-D+.45,C('#3a3a40'));
  // freezer de gelo perto da entrada
  ibox(mb,X+1.8,0,Z+D-1.05,X+3.6,1.0,Z+D-.15,C('#e8eef4'));ibox(mb,X+1.85,1.0,Z+D-1.0,X+3.55,1.06,Z+D-.2,C('#9ad0f0'));sg('GELO',1.2,.36,'#2a8ad6','#ffffff',X+2.7,.6,Z+D-1.06,Math.PI);
  // porta de funcionários, extintor, relógio e cartazes
  ibox(mb,X-W,0,Z-3.9,X-W+.06,2.2,Z-2.5,C('#6a6e78'));ibox(mb,X-W+.06,1.0,Z-2.7,X-W+.1,1.1,Z-2.6,C('#c8c8cc'));sg('SÓ FUNCIONÁRIOS',1.2,.24,'#c8202a','#ffffff',X-W+.07,2.4,Z-3.2,Math.PI/2);
  mb.geo(GEO.cyl,mtx(X-W+.18,.45,Z-1.8,.12,.6,.12),C('#d8202a'));ibox(mb,X-W+.06,1.0,Z-2.0,X-W+.08,1.4,Z-1.6,C('#c8202a'));
  mb.geo(GEO.cyl,mtx(X+W-.04,2.55,Z+1.5,.28,.04,.28,0,0,Math.PI/2),C('#f4f4f0'));ibox(mb,X+W-.07,2.53,Z+1.38,X+W-.06,2.57,Z+1.52,C('#111'));ibox(mb,X+W-.07,2.5,Z+1.48,X+W-.06,2.65,Z+1.52,C('#111'));
  sg('PROIBIDO FUMAR',1.1,.3,'#ffffff','#c8202a',X+W-.07,1.9,Z-1.6,-Math.PI/2);
  sg('REFRI 2L',1.2,.9,'#d8202a','#ffffff',X+W-.07,1.7,Z-3.2,-Math.PI/2,null,'$3,99');
  sg('CAFÉ FRESQUINHO',1.3,.5,'#3a2a20','#f2c21a',X+W-.07,2.35,Z+2.3,-Math.PI/2);
  sg('24 HORAS',1.0,.3,'#111','#5aff8a',X+1.6,2.45,Z+D-.07,Math.PI)}
 const m=mb.mesh(roomLitMat({x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights:[[X-3.5,H-.1,Z-2],[X+2,H-.1,Z-2],[X-3.5,H-.1,Z+2.5],[X+2,H-.1,Z+2.5]],warm:'#fff2dc',amb:.6,pow:.55,rad:5.2,grime:.2}));g.add(m); // v77: fluorescente da conveniência, penumbra leve
 for(const[lx,lz] of [[X-3.5,Z-2],[X+2,Z-2],[X-3.5,Z+2.5],[X+2,Z+2.5]]){const l=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.5),new THREE.MeshBasicMaterial({color:0xfffbf0}));l.rotation.x=Math.PI/2;l.position.set(lx,H-.02,lz);g.add(l)}
 {const c=cv(128,40),gg=c.getContext('2d');gg.fillStyle='#111';gg.fillRect(0,0,128,40);gg.fillStyle='#ff3e6a';gg.font='700 22px Silkscreen,monospace';gg.textAlign='center';gg.textBaseline='middle';gg.fillText(translatePlain('ABERTO'),64,21);const t=new THREE.CanvasTexture(c);const s=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.44),new THREE.MeshBasicMaterial({map:t}));s.position.set(X-4,2,Z+D-.08);s.rotation.y=Math.PI;g.add(s)}
 {const c=cv(128,64),gg=c.getContext('2d');gg.fillStyle='#f2c21a';gg.fillRect(0,0,128,64);gg.fillStyle='#c8202a';gg.font='700 16px Silkscreen,monospace';gg.textAlign='center';gg.fillText(translatePlain('LANCHE'),64,22);gg.fillText('$20',64,46);const t=new THREE.CanvasTexture(c);const s=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.6),new THREE.MeshBasicMaterial({map:t}));s.position.set(X-4.4,2.12,Z-4.36);g.add(s)} /* v79r2: na frente dos produtos da prateleira (antes ficava atrás deles) */
 for(const[x0,z0,x1,z1,k] of [[X-W-.5,Z-D-.5,X+W+.5,Z-D,'rock'],[X-W-.5,Z+D,X+W+.5,Z+D+.5,'rock'],[X-W-.5,Z-D,X-W,Z+D,'rock'],[X+W,Z-D,X+W+.5,Z+D,'rock'],[X-6.5,Z-1.1,X-2.0,Z-.2,'pole'],[X-2.25,Z-5,X-1.95,Z-1.0,'pole'],[X+.1,Z-2.65,X+1.1,Z+1.65,'rock'],[X+2.9,Z-2.65,X+3.9,Z+1.65,'rock'],[X,Z-5,X+W,Z-4.15,'rock'],[X+6.15,Z+.75,X+W,Z+3.85,'rock'],[X+4.55,Z+4.15,X+5.65,Z+D,'rock'],[X-W,Z+1.15,X-6.25,Z+4.25,'rock']])addCol(x0,z0,x1,z1,k);
 addCol(X+1.8,Z+D-1.05,X+3.6,Z+D-.15,'rock'); /* v78: freezer de gelo */
 SHOP.arrIn.visible=false;SHOP.counter={x:X-4.3,z:Z+.35};SHOP.clerkAt={x:X-4.3,z:Z-1.9};SHOP.exitAt={x:X,z:Z+D-.9}}
function shopAlarm(){if(SHOP.alarm||PL.inside!=='shop')return;SHOP.alarm=true;SHOP.alarmT=7;toast('<span style="color:#ff4a4a">O CAIXA APERTOU O ALARME!</span>')}
/* ---------- Setas amarelas -> interiores reaproveitados ----------
   Toda entrada grava a origem: interior (qual cenário), código (qual porta) e o ponto/direção de saída.
   A saída devolve sempre para essa origem. Ex.: cada posto tem código 'gas:<quarteirão>' e todos usam o
   mesmo interior 'shop'. Missões futuras podem checar doorCode() para saber por qual porta o jogador entrou. */
const DOOR={from:null};
function doorEnter(interior,code,out,nrm){{const pp=document.getElementById('paraPrompt');if(pp)pp.hidden=true}DOOR.from={interior,code,x:out.x,z:out.z,nx:nrm[0],nz:nrm[1],style:S.style,seed:S.seed}}
function doorExit(def){const f=DOOR.from&&DOOR.from.seed===S.seed&&DOOR.from.style===S.style?DOOR.from:def;DOOR.from=null;if(!f)return false;
 PL.x=f.x;PL.z=f.z;PL.vx=PL.vz=0;PL.face=[f.nx,f.nz];PL.yaw=Math.atan2(-f.nx,-f.nz);camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x-f.nx*4,2.6,PL.z-f.nz*4);return true}
function doorCode(){return PL.inside&&DOOR.from?DOOR.from.code:null}
function enterShop(st){if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');SHOP.lock=1.5;return}if(!SHOP.IN)buildShop();fadeFlash();SHOP.st=st;doorEnter('shop','gas:'+st.ri,st.out,st.nrm);PL.inside='shop';const IN=SHOP.IN;PL.x=IN.x;PL.z=IN.z+SHOP.D-1.8;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;SHOP.lock=1;SHOP.rob=0;SHOP.alarm=false;SHOP.deadDone=false;SHOP.robMsg=false;
 if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+3);camT.x=PL.x;camT.z=PL.z;for(const p of peds.slice())if(!p.fixed)removePed(p);
 const q=spawnPed(null,{x:SHOP.clerkAt.x,z:SHOP.clerkAt.z,vx:0,vz:0,pal:CLERK_PAL});q.state='clerk';q.fixed=true;q.shopkeep=true;q.hp=3;q.mx=0;q.mz=1;q.timer=0;SHOP.cashier=q;setTimeout(()=>say(q,SAY.greet),700);
 void 0}
function exitShop(){const st=SHOP.st;fadeFlash();PL.inside=false;doorExit({x:st.out.x,z:st.out.z,nx:st.nrm[0],nz:st.nrm[1]});SHOP.lock=1.2;camT.x=PL.x;camT.z=PL.z;
 if(camMode==='fps')chasePos.set(PL.x-st.nrm[0]*4,2.6,PL.z-st.nrm[1]*4);if(SHOP.cashier&&peds.includes(SHOP.cashier))removePed(SHOP.cashier);SHOP.cashier=null;SHOP.rob=0;
 if(SHOP.alarm){SHOP.alarm=false;startWanted(true);for(let k=0;k<2;k++){const c=spawnPoliceCar(45,140);if(c)startChase(c)}toast('<span style="color:#ff4a4a">POLÍCIA NO POSTO!</span>')}}
function clerkTick(p,dt){if(p.clubType){if(p.at){p.x=p.at.x;p.z=p.at.z}return}const dx=PL.x-p.x,dz=PL.z-p.z,l=Math.hypot(dx,dz)||1;p.mx=dx/l;p.mz=dz/l;const at=p.at||SHOP.clerkAt;if(at){p.x=at.x;p.z=at.z}
 if(SHOP.rob>0||SHOP.alarm){p.jy=Math.abs(Math.sin(simT*22))*.12}else p.jy=Math.max(0,(p.jy||0)-dt*2)}
function aimingAt(x,z,maxD,cosT){const dx=x-PL.x,dz=z-PL.z,d=Math.hypot(dx,dz);if(d>maxD||d<.2)return false;const ux=dx/d,uz=dz/d;let dirs=[];
 if(camMode==='fps'){const v=new THREE.Vector3();camera.getWorldDirection(v);const l=Math.hypot(v.x,v.z)||1;dirs.push([v.x/l,v.z/l])}
 else{dirs.push(PL.face);_ray.setFromCamera(mouseNDC,camera);const r=_ray.ray,t=(PL.gy+1.1-r.origin.y)/r.direction.y;if(t>0){const tx=r.origin.x+r.direction.x*t-PL.x,tz=r.origin.z+r.direction.z*t-PL.z,l=Math.hypot(tx,tz);if(l>.3)dirs.push([tx/l,tz/l])}}
 return dirs.some(q=>q[0]*ux+q[1]*uz>cosT)}
function shopBuy(){if(SHOP.buyCd>0)return;SHOP.buyCd=.8;if(SHOP.st&&SHOP.closed&&SHOP.closed[SHOP.st.ri]){say(SHOP.cashier,['Não vendo nada pra você!','Sai da minha loja!'],2.5);return}const q=SHOP.cashier;if(!q||q.state==='dead'||SHOP.alarm)return;if(PL.hp>=100){toast('VOCÊ JÁ ESTÁ SATISFEITO');return}if((PL.money||0)<20){toast('DINHEIRO INSUFICIENTE · O LANCHE CUSTA $20');clang(.1);return}
 money(-20);const g0=PL.hp;PL.hp=Math.min(100,PL.hp+50);toast('LANCHE · +'+Math.round(PL.hp-g0)+' VIDA · −$20');clang(.25);say(SHOP.cashier&&PL.inside==='shop'?SHOP.cashier:peds.find(p=>p.mallClerk==='food'),SAY.thanks)}
function shopTick(dt){SHOP.lock=Math.max(0,SHOP.lock-dt);SHOP.buyCd=Math.max(0,SHOP.buyCd-dt);const inS=PL.inside==='shop';
 if(SHOP.arrIn){SHOP.arrIn.visible=inS;if(inS){SHOP.arrIn.position.set(SHOP.exitAt.x,1.5+Math.sin(simT*3)*.18,SHOP.exitAt.z);SHOP.arrIn.rotation.y=simT*1.8}}
 if(!inS)return;const q=SHOP.cashier,alive=q&&peds.includes(q)&&q.state!=='dead',st=SHOP.st;
 if(SHOP.lock<=0&&!PL.dead&&Math.hypot(PL.x-SHOP.exitAt.x,PL.z-SHOP.exitAt.z)<.8){exitShop();return}
 if(alive&&q.state!=='clerk'){q.state='clerk';q.rot=0;q.vx=q.vz=0;shopAlarm()}
 if(alive&&!SHOP.alarm&&!GUN.has&&Math.hypot(PL.x-SHOP.counter.x,PL.z-SHOP.counter.z)<1.7)CTX.shop=true;
 if(alive&&GUN.has&&!SHOP.alarm&&!PL.dead){if(aimingAt(q.x,q.z,8,.93)){SHOP.rob+=dt;if(!SHOP.robMsg){SHOP.robMsg=true;say(q,SAY.spare,3.2);toast('<span style="color:#ff4a4a">ASSALTO!</span><br><small style="font-size:11px;color:#fff">continue mirando no caixa</small>');ouch(q.x,q.z,1.3)}
   if(SHOP.rob>=3.2){const last=SHOP.robbed.get(st.ri),empty=last!==undefined&&simT-last<720;SHOP.robbed.set(st.ri,simT);SHOP.closed=SHOP.closed||{};SHOP.closed[st.ri]={reopen:null,saw:true};say(q,empty?'Só tinha isso! Juro!':'Tá aí! Tá tudo aí!',3);const v=empty?20:120+Math.floor(R2()*140);money(v,'<span style="color:#5aff6a">+$'+v+'</span> '+(empty?'· O CAIXA ESTAVA QUASE VAZIO':'· O CAIXA ENCHEU A SACOLA'));clang(.4);for(let i=0;i<14;i++)emit(q.x,1.3,q.z,(Math.random()-.5)*3,1+Math.random()*2,(Math.random()-.5)*3,.8,.3,.15,0x5aff6a,true,.9);SHOP.alarm=false;shopAlarm()}}
  else SHOP.rob=Math.max(0,SHOP.rob-dt*.5)}
 if(q&&!alive&&!SHOP.deadDone){SHOP.deadDone=true;const last=SHOP.robbed.get(st.ri);if(last===undefined||simT-last>720){SHOP.robbed.set(st.ri,simT);const v=60+Math.floor(R2()*80);money(v,'+$'+v+' · VOCÊ LIMPOU O CAIXA')}SHOP.alarm=false;shopAlarm()}
 if(SHOP.alarm){SHOP.alarmT-=dt;if(SHOP.alarmT<=0){toast('A POLÍCIA INVADIU A LOJA!');exitShop()}}}
/* ---------- v58: perseguição e busca territorial ---------- */
const WZ={list:[],crime:null,susT:0,cur:null,fromZone:null,fade:[]};
/* r48: busca encerrada por disfarce/casa segura/Maskara → a área NÃO some na hora: vira azul e esmaece em WZ_FADE_MS (só visual; não reconhece nem chama patrulha) */
const WZ_FADE_MS=20000;
function wzFadeOut(x,z,r,lvl){if(Number.isFinite(x)&&Number.isFinite(z))WZ.fade.push({x,z,r:r||wzSearchRadius(),t0:performance.now(),lvl:clamp(lvl||1,1,3)})}
function wzFadeAll(){const now=POL.wanted?POL.level||1:1;for(const z of WZ.list)wzFadeOut(z.x,z.z,z.r,Math.max(z.lvl||1,now));if(WZ.crime)wzFadeOut(WZ.crime.x,WZ.crime.z,0,now)}
/* crime dentro de uma área azul que ainda não sumiu → volta o nível de estrelas que o jogador tinha (2 → 2, 3 → 3) */
function wzFadeHit(){if(!WZ.fade.length)return null;const pc=PL.car||PL,now=performance.now();let best=null;for(const z of WZ.fade){if(now-z.t0>=WZ_FADE_MS)continue;if(Math.hypot(pc.x-z.x,pc.z-z.z)<z.r&&(!best||z.lvl>best.lvl))best=z}if(!best)return null;WZ.fade=WZ.fade.filter(z=>!(Math.hypot(pc.x-z.x,pc.z-z.z)<z.r));return best}
const WZ_HALF_MATCH=60; // busca só termina após roupa E veículo deixarem de corresponder
// Distancias por tamanho da cidade (MOBILE = mapa 7x7, mesmo no desktop).
function wzEscapeDistance(){return city.N===7?300:500}
function wzSearchRadius(){return city.N===7?150:300}
function lookKey(){try{return JSON.stringify(PLAYER_PAL)}catch(e){return''}}
function carKey(c){return c?c.type+'|'+(c.color||''):'pé'}
// Veículo associado ao jogador: o atual ou, a pé, o último usado (descer do carro não é trocar de carro).
function wzCarKey(){const l=PL.lastCar;return carKey(PL.car||(l&&l.alive&&vehicles.includes(l)?l:null))}
function wzCrime(){const pc=PL.inside&&DOOR.from&&DOOR.from.seed===S.seed?DOOR.from:PL.inside==='bank'&&bankDoor()?bankDoor():PL.inside==='shop'&&SHOP.st?SHOP.st.out:(PL.car||PL),prev=WZ.fromZone;
 WZ.fromZone=null;WZ.crime={x:prev?prev.x:pc.x,z:prev?prev.z:pc.z,
 looks:new Set(prev?prev.looks:[]),cars:new Set(prev?prev.cars:[])};
 // Quando a polícia reconhece uma identidade já procurada, NÃO cadastramos o disfarce atual.
 if(!prev){WZ.crime.looks.add(lookKey());WZ.crime.cars.add(wzCarKey())}}
function wzEscape(){const c=WZ.crime;WZ.crime=null;if(!c)return;
 WZ.list=WZ.list.filter(z=>Math.hypot(z.x-c.x,z.z-c.z)>wzSearchRadius());
 WZ.list.push({x:c.x,z:c.z,r:wzSearchRadius(),looks:[...c.looks],cars:[...c.cars],age:0,lvl:POL.level||1});
 WZ.susT=0;void 0;}
function wzTick(dt){
 // A identidade procurada e registrada no momento do crime; disfarces posteriores nao entram no cadastro.
 WZ.cur=null;if(!played)return;
 const pc=PL.car||PL;let best=null,bd=Infinity;
 for(const z of WZ.list.slice()){
  z.age=(z.age||0)+dt; // update(dt) e o mesmo tempo em minutos usado pelo relogio do jogo.
  const d=Math.hypot(pc.x-z.x,pc.z-z.z);z.inside=!PL.inside&&d<z.r;
  // Os indicadores sao a identidade procurada, independentemente de estar na zona.
  z.lk=z.looks.includes(lookKey());z.ck=z.cars.includes(wzCarKey());
  if(d<bd){bd=d;best=z}
 }
 // Sem roupa nem veiculo identificados, a busca desta ocorrencia e encerrada.
 for(const z of WZ.list.slice()){if(!z.lk&&!z.ck){WZ.list.splice(WZ.list.indexOf(z),1);wzFadeOut(z.x,z.z,z.r,z.lvl);if(best===z)best=null;toast('DISFARCE COMPLETO · BUSCA ENCERRADA')}}
 WZ.cur=best;
 if(POL.wanted&&WZ.crime&&!WZ.crime.looks.has(lookKey())&&!WZ.crime.cars.has(wzCarKey())){
  wzFadeAll();endWanted(true,true);toast('DISFARCE COMPLETO · BUSCA E PERSEGUIÇÃO ENCERRADAS');WZ.susT=0;return;
 }
 if(!best||POL.wanted||PL.dead||!best.inside){WZ.susT=0;return}
 const matches=Number(best.lk)+Number(best.ck);
 if(matches===2){WZ.fromZone=best;WZ.susT=0;
  startWanted(true);toast('<span style="color:#ff4a4a">RECONHECIDO!</span> · MESMA ROUPA E VEÍCULO');}
 else if(matches===1){WZ.susT+=dt;if(WZ.susT>=WZ_HALF_MATCH){WZ.fromZone=best;WZ.susT=0;
  startWanted(true);toast('<span style="color:#ff4a4a">RECONHECIDO!</span> · VOCÊ FICOU 1 HORA NA ZONA DE PROCURA');}}
 else WZ.susT=0;
}
function wzMap(g,sc){const now=performance.now();for(let i=WZ.fade.length-1;i>=0;i--){const z=WZ.fade[i],k=1-(now-z.t0)/WZ_FADE_MS;if(k<=0){WZ.fade.splice(i,1);continue}
 g.fillStyle='rgba(18,38,128,'+(0.42*k).toFixed(3)+')';g.beginPath();g.arc(z.x+MOFF,z.z+MOFF,z.r,0,Math.PI*2);g.fill();
 g.strokeStyle='rgba(40,70,190,'+(0.8*k).toFixed(3)+')';g.lineWidth=2/sc;g.stroke()}
 try{obraMap(g,sc)}catch(e){}try{gangMap(g,sc)}catch(e){}
 for(const z of WZ.list){
 g.fillStyle='rgba(255,40,50,0.22)';g.beginPath();g.arc(z.x+MOFF,z.z+MOFF,z.r,0,Math.PI*2);g.fill();
 g.strokeStyle='rgba(255,70,70,0.55)';g.lineWidth=2/sc;g.stroke();}}
function gasMapIcons(g,s,rot=0){for(const l of city.lms||[]){if(l.name!=='gas')continue;const st=GAS.list.get(l.ri)||{burnt:false,x:l.x,z:l.z};const x=(st.x||l.x)+MOFF,y=(st.z||l.z)+MOFF;
 // O posto acompanha os outros pictogramas: mesmo medalhão, raio e margem interna.
 // Postos destruídos ficam sem destaque, preservando a indicação do local.
 g.save();if(st.burnt)g.globalAlpha*=.40;drawMapIcon(g,'gas',x,y,s*.52,rot);g.restore()}}
function wzSave(){return WZ.list.map(z=>({x:z.x,z:z.z,r:z.r,looks:z.looks,cars:z.cars,age:z.age||0,lvl:z.lvl||1}))}
/* ---------- HUD e tick ---------- */
function v67Tick(dt){CTX.car=false;CTX.shop=false;CTX.club=false;CTX.st=null;CTX.mall=null;meleeTick(dt);statsTick(dt);if(PL.car){donutTick(dt);fuelTick(dt);try{dirtTick(dt)}catch(e){console.error(e)}}gasTick(dt);shopTick(dt);mallTick(dt);ammoTick(dt);clubContextTick();wzTick(dt)}
function v67Hud(dt){if(!GUN.has&&!PL.car&&played){$('#gun').hidden=false;hudTx('#gun span','PUNHOS');hudTx('#gun b','')}
 const fb=$('#fuelbar');if(fb){const c=PL.car,show=!!(c&&c.alive&&!c.t.boat&&c.fuel!==undefined);if(fb.hidden===show)fb.hidden=!show;if(show){fb.querySelector('i').style.width=Math.max(0,c.fuel)+'%';fb.classList.toggle('low',c.fuel<15)}}
 {const tg=$('#pumpTag');let show=false;const c=PL.car;
  if(c&&c.alive&&!c.t.boat&&!PL.dead&&!NAV.open&&!PL.inside){let best=null,bd=14;for(const st of GAS.list.values()){if(st.burnt||!st.spots||Math.abs(st.x-c.x)>40||Math.abs(st.z-c.z)>40)continue;for(const sp of st.spots){const d=Math.hypot(c.x-sp[0],c.z-sp[1]);if(d<bd){bd=d;best=sp}}}
   if(best){let isl=null,id=1e9;for(const st of GAS.list.values())if(st.pumps)for(const p of st.pumps){const d=Math.hypot(p[0]-best[0],p[1]-best[1]);if(d<id){id=d;isl=p}}
    const v=new THREE.Vector3(isl?isl[0]:best[0],2.9,isl?isl[1]:best[1]).project(camera);if(v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05){show=true;
     const g=PAD.on?padGet():null,xb=g&&/xbox|xinput|microsoft/i.test(g.id||''),a1=g?(xb?'X':'□'):'CLIQUE',a2=g?(xb?'B':'○'):'BOT. DIR.',a3=g?'▼':'X',k=gasCosts(c),stop=CTX.car,dd=Math.round((c.grime||0)*100);
     const en=S.lang==='en',T=(x,y)=>en?y:x,h=`<kbd>${en&&!g?(a1==='CLIQUE'?'CLICK':a1):a1}</kbd>${T('ABASTECER','REFUEL')}${k.f>0?' $'+k.f:T(' (cheio)',' (full)')}<br><kbd>${en&&!g?'RIGHT CLICK':a2}</kbd>${T('CONSERTAR','REPAIR')}${k.r>0?' $'+k.r:T(' (inteiro)',' (intact)')}${stop?'':'<br><small style="color:#ffb066">'+T('pare ao lado da bomba','stop next to the pump')+'</small>'}`;
     if(tg.dataset.h!==h){tg.dataset.h=h;tg.innerHTML=h}tg.style.left=((v.x+1)/2*innerWidth)+'px';tg.style.top=((1-v.y)/2*innerHeight)+'px'}}}
  if(tg.hidden===show)tg.hidden=!show}
 {const tg=$('#mallTag');let show=false;if(false&&PL.inside==='mall'&&MALL.G&&!PL.dead&&!WARD.open){let best=null,bd=14,bk=null;for(const key of ['wear','food','tech','bag','cafe','jewel','music','pharm']){const sp=MALL[key+(MALL.lvl?'U':'G')];if(!sp)continue;const d=Math.hypot(PL.x-sp.x,PL.z-sp.z);if(d<bd){bd=d;best=sp;bk=key}}
   if(best){const v=new THREE.Vector3(best.clerk.x,2.75,best.clerk.z).project(camera);if(v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05){show=true;const g=PAD.on?padGet():null,k=g?'→':'E',near=CTX.mall===bk;
     const h=bk==='wear'?(near?`<kbd>${k}</kbd>ABRIR O PROVADOR<br><small>cores e acessórios novos · $10 cada · peças adquiridas grátis</small>`:`MODA PIXEL · PROVADOR<br><small>chegue no balcão e aperte <kbd>${k}</kbd></small>`)
      :bk==='tech'?(near?`<kbd>${k}</kbd>VER CELULARES E HEADPHONE`:`ELETRÔNICOS<br><small>chegue no balcão e aperte <kbd>${k}</kbd></small>`)
      :bk==='bag'?(near?`<kbd>${k}</kbd>VER MOCHILAS · $500<br><small>munição até 1.500 por arma</small>`:`MALAS & MOCHILAS CO.<br><small>chegue no balcão e aperte <kbd>${k}</kbd></small>`)
      :(near?`<kbd>${k}</kbd>COMPRAR LANCHE $20<br><small>+50 de vida</small>`:`CONVENIÊNCIA · LANCHE $20<br><small>chegue no balcão e aperte <kbd>${k}</kbd></small>`);
     if(tg.dataset.h!==h){tg.dataset.h=h;tg.innerHTML=h}tg.classList.toggle('food',bk==='food');tg.style.left=((v.x+1)/2*innerWidth)+'px';tg.style.top=((1-v.y)/2*innerHeight)+'px'}}}
  if(tg.hidden===show)tg.hidden=!show}
 const cp=$('#ctxp');let h='';CTX.skate=false;CTXB.an=null;
 if(ctxAt(petNearCat(),1.2))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>ADOTAR GATINHO';
 else if(wardNear()&&!WARD.open)h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>GUARDA-ROUPA · ROUPAS E ACESSÓRIOS';
 else if(empHint())h=empHint();
 else if(ctxAt(bankAtmNear(),1.9))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>CONTA CORRENTE';
 else if(bankCounterNear())h=BANK.rob?'':(GUN.has||Object.keys(GUN.inv||{}).length?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd><span style="color:#ff4a4a">ANUNCIAR O ASSALTO</span>':'BANCO · você precisa de uma arma para assaltar');
 else if(!TABLE_GAME.open&&ctxAt(casinoTableNear(),1.9))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>'+(casinoTableNear().kind==='dice'?"DADOS · LIAR'S DICE":casinoTableNear().kind==='pool'?'SINUCA · CASTIGADO':casinoTableNear().kind==='bj'?'BLACKJACK · 21':casinoTableNear().kind==='roul'?'ROLETA · 0 A 36':'VIDEOPÔQUER · JACKS OR BETTER');
 else if(slotNear()>=0&&!SLOT.open&&ctxAt(CAS.machines[slotNear()],2.3))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>CAÇA-NÍQUEL · $10 POR JOGADA';
 else if(dbBoothNear())h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>'+(dbBoothNear().ang>.01||dbBoothNear().state==='rising'?'ABAIXAR A PONTE':'LEVANTAR A PONTE');
 else if(bedNear())h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>DEITAR NA CAMA · SALVAR O JOGO';
 else if(!NEWS.open&&ctxAt(newsNear(),2.9))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>BANCA DE JORNAL · JORNAL $1';
 else if(duoWorldNear()&&storyOK('duo')&&ctxAt(DUO.worldPed,2.5))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>BORA ROLÊ · '+duoName(1-CHAR.cur);
 else if(duoMateNear()&&storyOK('duo')&&ctxAt(SAFE.mate,2.5))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>CHAMAR '+duoName(1-CHAR.cur)+' PRA SAIR JUNTO';
 else if(duoPedNear()&&ctxAt(DUO.ped,2.5))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>MANDAR '+duoName(1-CHAR.cur)+' PRA CASA';
 else if(dealNear()&&ctxAt(DEAL.clerk,2.5))h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>CONCESSIONÁRIA COASTAL · VER VEÍCULOS À VENDA';
 else if(CTX.car&&PL.car){h=''}
 else if(PL.car&&washHint())h=washHint();
 else if(PL.inside==='shop'&&SHOP.rob>0&&!SHOP.alarm){const k=Math.min(1,SHOP.rob/3.2),n=12,f=Math.round(k*n);h=`<span style="color:#ff4a4a">ASSALTO</span> ${'█'.repeat(f)}${'░'.repeat(n-f)}`}
 else if(SKATE.near){h='<kbd>F</kbd><kbd>→</kbd>SUBIR NO SKATE';CTX.skate=true}
 else if(SKATE.ride&&SKATE.ride.v<.6&&!PL.inside){h='<kbd>F</kbd><kbd>→</kbd>DESCER DO SKATE';CTX.skate=true}
 else if(CTX.shop)h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>COMPRAR LANCHE $20 · +50 VIDA';
 else if(CTX.mall&&/^fc\d$/.test(CTX.mall)){const f=MALL_FOOD[+CTX.mall[2]];h='<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>'+f[0]+' $'+f[2]+' · +'+f[3]+' VIDA'}
 else if(CTX.mall)h=CTX.mall==='skate'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>SKATE SHOP · SKATES $120':CTX.mall==='cafe'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>CAFÉ $5 · +25 VIDA':CTX.mall==='pharm'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>FARMÁCIA · REMÉDIO $60 · +100 VIDA':CTX.mall==='jewel'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>JOIAS · COLARES E FIVELAS':CTX.mall==='optic'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>ÓTICA · ÓCULOS':CTX.mall==='shoes'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>SAPATOS · CALÇADOS':CTX.mall==='beach'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>MODA PRAIA · SUNGA E BIQUÍNI':CTX.mall&&/^vd\d+$/.test(CTX.mall)?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>REFRIGERANTE $1 · +1 VIDA':CTX.mall==='music'?'LOJA DE DISCOS · fone de cortesia perto das prateleiras':CTX.mall==='bag'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>MALAS & MOCHILAS CO. · MOCHILA':CTX.mall==='tech'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>ELETRÔNICOS · CELULAR E HEADPHONE':CTX.mall==='wear'?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>PROVADOR · TROCAR ROUPA E ACESSÓRIOS':'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>COMPRAR LANCHE $20 · +50 VIDA';
 else if(PL.inside==='shop'&&GUN.has&&!SHOP.alarm&&SHOP.cashier&&SHOP.cashier.state!=='dead')h='<span style="color:#ff4a4a">MIRE NO CAIXA = ASSALTO</span> · <kbd>1</kbd>guarda a arma';
 else if(PL.inside==='shop'&&SHOP.alarm)h=`<span style="color:#ff4a4a">ALARME · POLÍCIA EM ${Math.max(0,Math.ceil(SHOP.alarmT))}s</span>`;
 if(cp){if(cp.hidden===!!h)cp.hidden=!h;{const ak=h.indexOf('<kbd>')>=0;if(cp.classList.contains('act')!==ak)cp.classList.toggle('act',ak)} /* v79r49: lógica estava invertida desde a v77 — o aviso nunca aparecia (no PC o E funcionava às cegas; no toque o botão INTERAGIR depende dele) */if(h&&padActive())h=padCtxGlyph(h);if(h&&cp.dataset.h!==h){cp.dataset.h=h;cp.innerHTML=h}}
 if(h)$('#prompt').hidden=true;
 ctxBalTick();
 const wz=$('#wzone');if(wz){const z=WZ.cur;const show=!!z&&played;if(wz.hidden===show)wz.hidden=!show;if(show){
  wz.querySelector('.sh').classList.toggle('on',!!z.lk);wz.querySelector('.cr').classList.toggle('on',!!z.ck);
  const t=$('#wzTxt');const txt=POL.wanted?'ZONA VERMELHA':z.inside?(WZ.susT>0?'SUSPEITO '+Math.max(0,Math.ceil(60-WZ.susT))+' min':(z.lk||z.ck)?'NA ZONA':'DISFARÇADO'):'BUSCA '+Math.max(0,Math.ceil(300-z.age))+' min';if(t.textContent!==txt)t.textContent=txt;wz.classList.toggle('hot',z.inside&&WZ.susT>0)}}}

/* v4 r13: no PC (teclado/mouse), as barras de interação de baixo (#ctxp, #heistp, #tvp) viram o balão laranja do posto,
   preso no alvo (ou acima do jogador quando o alvo não tem posição). Toque e controle continuam com a barra.
   Só aparece com tecla na barra; sem ponto visível na tela (ex.: câmera 1ª pessoa) volta a ser barra. */
const CTXB={an:null,v:new THREE.Vector3()};
function ctxAt(o,hy){if(!o)return o;CTXB.an={x:o.x,z:o.z,gy:o.gy,h:hy};return o}
function ctxBalPC(){return !document.body.classList.contains('touch')&&!padActive()}
function ctxBalPt(an){const top=camMode==='top'&&!VIEW.orbit,v=CTXB.v;
 v.set(an?an.x:PL.x,(an&&an.gy!==undefined&&isFinite(an.gy)?an.gy:(PL.gy||0))+(an?an.h:2.45)+(top?1.2:0),an?an.z:PL.z).project(camera);
 return v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1}
function ctxBalTick(){const pc=ctxBalPC();
 for(const id of ['ctxp','heistp','tvp']){const el=$('#'+id);if(!el)continue;
  let on=pc&&!el.hidden&&!!el.querySelector('kbd');
  if(on){const an=id==='ctxp'?CTXB.an:id==='tvp'?ctxTvAnchor():null;on=ctxBalPt(an)||(!!an&&ctxBalPt(null))}
  if(el.classList.contains('bal')!==on){if(on&&el._l0===undefined)el._l0=el.style.left;el.classList.toggle('bal',on);if(!on){el.style.left=el._l0||'';el.style.top=''}}
  if(on){const x=Math.round((CTXB.v.x+1)/2*innerWidth)+'px',y=Math.round((1-CTXB.v.y)/2*innerHeight)+'px';if(el.style.left!==x)el.style.left=x;if(el.style.top!==y)el.style.top=y}}}
function ctxTvAnchor(){const t=tvSpot();return t?{x:t.x,z:t.z,h:1.9}:null}

function gasPicks(pick,ok,far,area){/* v161: postos passam a nascer juntos da concessionária em quadras compartilhadas; a reserva é feita depois, na etapa de especiais. */}
function worldPicks(pick,ok,far,area,lr){
 pick('pol',(f,r)=>ok(f,r)&&f.d<.5,(f,r)=>far(r,P*3)*1.5-Math.abs(f.d-.28)*3);
 if(!city.lms.some(l=>l.name==='pol'))pick('pol',(f,r)=>(f.kind==='bld'||f.kind==='houses'||f.kind==='lot')&&f.d<.62,(f,r)=>far(r,P*2)-f.d);
}
