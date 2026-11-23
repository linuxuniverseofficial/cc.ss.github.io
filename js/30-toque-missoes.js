'use strict';
/* Coastal Chaos · js/30-toque-missoes.js — Controles de toque, píeres/rampas, missões paralelas, tuning.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= TOUCH CONTROLS ================= */
const TOUCH={on:false,joy:null,look:null,run:false,x:0,y:0,isoDriving:false,gas:false,brake:false}; // v78: no carro o analógico só ESTERÇA; ACELERAR/FREAR são botões
const TICO={fist:'<path d="M7 12V8.5a1.5 1.5 0 013 0V11M10 10.5V7a1.5 1.5 0 013 0v3.5M13 10.5V7.5a1.5 1.5 0 013 0V11M16 11a1.5 1.5 0 013 0v3a6 6 0 01-6 6h-2a5 5 0 01-5-5v-2.5a1.5 1.5 0 013 0"/>',
 gun:'<path d="M3 8h17v3h-6l-1.5 2H10l-1 6H5l1-6H3z"/><path d="M10 11v2"/>',
 jump:'<path d="M12 17V5M6.5 10.5L12 5l5.5 5.5M5 20h14"/>',run:'<path d="M5 6l6 6-6 6M12 6l6 6-6 6"/>',
 nitro:'<path d="M12 3c.8 3.5 5 5.2 5 10a5 5 0 01-10 0c0-2.6 1.6-3.8 2-5.6 1 .8 1.7 1.8 1.9 2.9.6-2.4 1.4-4.6 1.1-7.3z"/>',
 hbrake:'<circle cx="12" cy="12" r="8.5"/><path d="M10 16.5v-9h3a2.6 2.6 0 010 5.2h-3"/>',
 horn:'<path d="M3 10v4h3.5l6.5 4.5v-13L6.5 10zM16 9a4 4 0 010 6M18.6 6.4a8 8 0 010 11.2"/>',
 wpn:'<path d="M4.5 12a7.5 7.5 0 0113.3-4.8M19.5 12a7.5 7.5 0 01-13.3 4.8M18 3.5v4h-4M6 20.5v-4h4"/>',
 car:'<path d="M4 16.5v-3.2L6.2 8h11.6l2.2 5.3v3.2zM4 16.5V19h3v-2.5M17 16.5V19h3v-2.5M6 13h12"/>',
 exit:'<path d="M13 4h6v16h-6M10 8l-4 4 4 4M6 12h10"/>',
 hand:'<path d="M8 13V6.5a1.5 1.5 0 013 0V11M11 11V5a1.5 1.5 0 013 0v6M14 11V6.5a1.5 1.5 0 013 0V14a7 7 0 01-7 7 6 6 0 01-5.1-2.9L3.3 15a1.5 1.5 0 012.5-1.6L8 16"/>',
 para:'<path d="M3 11a9 7 0 0118 0zM3 11l9 9 9-9M9 11l3 9 3-9"/>',
 map:'<path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5zM9 4v13.5M15 6.5V20"/>',
 cam:'<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3z"/>',
 more:'<path d="M5 12h.01M12 12h.01M19 12h.01" stroke-width="3.2"/>',pause:'<path d="M9 6v12M15 6v12" stroke-width="2.6"/>',
 phone:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',char:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
 spec:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',mis:'<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
 radio:'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-4.5"/><circle cx="15.5" cy="14" r="2.5"/><path d="M6 12h4M6 15.5h4"/>',
 next:'<path d="M5 6l8 6-8 6zM14 6l8 6-8 6"/>',lights:'<path d="M13 5a7 7 0 010 14zM9 7.5H3M9 10.5H3M9 13.5H3M9 16.5H3"/>',
 alt:'<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.8a2.5 2.5 0 015 .2c0 2.2-5 3-5 5.5h5"/>',
 left:'<path d="M20 12H5M11 5.5L4.5 12l6.5 6.5"/>',right:'<path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
 pedal:'<rect x="6.5" y="3" width="11" height="18" rx="3"/><path d="M9.5 7.5h.01M14.5 7.5h.01M12 10h.01M9.5 12.5h.01M14.5 12.5h.01M12 15h.01M9.5 17.5h.01M14.5 17.5h.01" stroke-width="2.6"/>'};
function tsvg(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(TICO[k]||'')+'</svg>'}
function tHap(){try{if(navigator.vibrate)navigator.vibrate(8)}catch(e){}}
function touchInteract(){initAudio();if(PL.inside==='jail')JAIL.click=performance.now();if(!PL.car&&medLoad())return;ctxAct(1)}
function touchSetup(){TOUCH.on=true;document.body.classList.add('touch');
 const joy=$('#tjoy'),knob=$('#tknob'),R0=58;
 /* v78: ícones fixos (topo e MAIS); setas e pedais com vários dedos e deslizar entre lados */
 const IC={map:'map',cam:'cam',more:'more',pause:'pause',phone:'phone',char:'char',spec:'spec',mis:'mis',radio:'radio',next:'next',lights:'lights',altact:'alt'};
 for(const b of document.querySelectorAll('#ttop .tb,#tmore .tb')){const k=IC[b.dataset.t];if(!k)continue;const lab=b.textContent.replace(/\s+/g,' ').trim();b.setAttribute('aria-label',lab);b.dataset.sig=k+'|'+lab;b.innerHTML=tsvg(k)+(b.closest('#tmore')?'<i>'+lab+'</i>':'')}
 const steer=$('#tsteer'),sArr=steer.querySelectorAll('.tsa'),ped=$('#tpedal'),pArr=ped.querySelectorAll('.tpd');
 sArr[0].innerHTML=tsvg('left');sArr[1].innerHTML=tsvg('right');pArr[0].innerHTML=tsvg('pedal');pArr[1].innerHTML=tsvg('pedal');
 sArr[0].setAttribute('aria-label','Virar à esquerda');sArr[1].setAttribute('aria-label','Virar à direita');pArr[0].setAttribute('aria-label','Frear / ré');pArr[1].setAttribute('aria-label','Acelerar');
 TOUCH.steerT=new Map();TOUCH.pedT=new Map();
 const zone=(el,m,cb)=>{const upd=()=>{const r=el.getBoundingClientRect(),mid=r.left+r.width/2;let a=false,b=false;for(const x of m.values()){if(x<mid)a=true;else b=true}cb(a,b)};
  el.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();initAudio();for(const t of e.changedTouches)m.set(t.identifier,t.clientX);tHap();upd()},{passive:false});
  el.addEventListener('touchmove',e=>{e.preventDefault();let ch=false;for(const t of e.changedTouches)if(m.has(t.identifier)){m.set(t.identifier,t.clientX);ch=true}if(ch)upd()},{passive:false});
  const end=e=>{for(const t of e.changedTouches)m.delete(t.identifier);upd()};el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);return upd};
 TOUCH.steerUpd=zone(steer,TOUCH.steerT,(l,r)=>{TOUCH.sl=l;TOUCH.sr=r;if(PL.car&&TOUCH.steerOn){keys.KeyA=l&&!r;keys.KeyD=r&&!l}sArr[0].classList.toggle('on',l);sArr[1].classList.toggle('on',r)});
 TOUCH.pedUpd=zone(ped,TOUCH.pedT,(br,g)=>{TOUCH.brake=br;TOUCH.gas=g;if(PL.car){keys.KeyW=g;keys.KeyS=br}pArr[0].classList.toggle('on',br);pArr[1].classList.toggle('on',g)});

 const setKeys=(x,y)=>{TOUCH.x=x;TOUCH.y=y;const ax=Math.abs(x),ay=Math.abs(y);keys.KeyW=y<-.32;keys.KeyS=y>.32;keys.KeyA=x<-.32;keys.KeyD=x>.32;if(PL.car){keys.KeyW=TOUCH.gas;keys.KeyS=TOUCH.brake;keys.KeyA=x<-.25;keys.KeyD=x>.25}keys.ShiftLeft=TOUCH.run||(!PL.car&&Math.hypot(x,y)>.95)};
 const jmove=t=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=t.clientX-cx,dy=t.clientY-cy;const l=Math.hypot(dx,dy);if(l>R0){dx*=R0/l;dy*=R0/l}knob.style.transform=`translate(${dx*.5}px,${dy*.5}px)`;setKeys(dx/R0,dy/R0)};
 joy.addEventListener('touchstart',e=>{e.preventDefault();initAudio();radioKick();const t=e.changedTouches[0];TOUCH.joy=t.identifier;jmove(t)},{passive:false});
 joy.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===TOUCH.joy)jmove(t)},{passive:false});
 const jend=e=>{for(const t of e.changedTouches)if(t.identifier===TOUCH.joy){TOUCH.joy=null;TOUCH.x=TOUCH.y=0;knob.style.transform='';keys.KeyA=keys.KeyD=false;keys.KeyW=!!PL.car&&TOUCH.gas;keys.KeyS=!!PL.car&&TOUCH.brake;keys.ShiftLeft=TOUCH.run}};joy.addEventListener('touchend',jend);joy.addEventListener('touchcancel',jend);
 // drag anywhere else on the game view to look around (3D)
 canvas.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(TOUCH.look===null){TOUCH.look=t.identifier;TOUCH.lx=t.clientX;TOUCH.ly=t.clientY}}},{passive:true});
 canvas.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier!==TOUCH.look)continue;const dx=t.clientX-TOUCH.lx,dy=t.clientY-TOUCH.ly;TOUCH.lx=t.clientX;TOUCH.ly=t.clientY;if(camMode==='top'&&VIEW.orbit&&!menuOpen){ORB.yaw-=dx*.008;continue}if(camMode!=='fps'||menuOpen)continue;
  if(PL.car){LOOK.yaw+=dx*.006;LOOK.pitch=clamp(LOOK.pitch+dy*.006,-.45,1.1);LOOK.t=0}else{PL.yaw-=dx*.005;PL.pitch=clamp(PL.pitch-dy*.005,-1.35,1.35)}}},{passive:false});
 const lend=e=>{for(const t of e.changedTouches)if(t.identifier===TOUCH.look)TOUCH.look=null};canvas.addEventListener('touchend',lend);canvas.addEventListener('touchcancel',lend);
 const act={interact:[()=>touchInteract()],motionGas:[()=>{TOUCH.gas=true;keys.KeyW=true},()=>{TOUCH.gas=false;keys.KeyW=false}],motionBrake:[()=>{TOUCH.brake=true;keys.KeyS=true},()=>{TOUCH.brake=false;keys.KeyS=false}],more:[()=>{$('#tmore').hidden=!$('#tmore').hidden}],pause:[()=>{openMenu()}],phone:[()=>{phoneToggle()}],char:[()=>{if(CHAR.open)charClose(true);else charOpen('touch')}],spec:[()=>{specSet(!SPEC.on)}],lights:[()=>{HEAD.mode=headOn()?'off':'on'}],altact:[()=>{ctxAct(2)}],fire:[()=>{initAudio();if(CTX.car){ctxAct(1);return}if(GUN.has){GUN.firing=true;playerShoot(camMode==='top')}else if(!PL.car)playerPunch(false)},()=>{GUN.firing=false}],
  f:[()=>{if(TOUCH.ctx==='interact'&&(CTX.shop||CTX.mall||CTX.club||TOUCH.ctxPrompt))touchInteract();else enterExit();radioKick()}],space:[()=>{keys.Space=true;if(PL.heli)heliJump();else plJump()},()=>{keys.Space=false}],run:[()=>{TOUCH.run=!TOUCH.run;keys.ShiftLeft=TOUCH.run;$('[data-t=run]').classList.toggle('on',TOUCH.run)}],
  wpn:[()=>{wheelOpen('wpn','touch');if(WHL.open!=='wpn')gunCycle(1)},()=>{if(WHL.open==='wpn'&&WHL.src==='touch')wheelClose(true)}],horn:[()=>{hornDown('touch')},()=>{hornUp('touch')}],map:[()=>{NAV.open?closeMap():openMap()}],
  cam:[()=>cycleView()],
  radio:[()=>{if(RADIO.sceneActive)return;RADIO.userOff=!RADIO.userOff;if(radioLive()){RADIO.blocked=false;RADIO.liveErrT=-1e9}if(RADIO.userOff)RADIO.el.pause();else{if(RADIO.idx<0&&RADIO.list.length){RADIO.idx=0;loadStation()}radioPlay()}toast(RADIO.userOff?'RÁDIO DESLIGADO':'RÁDIO LIGADO')}],mis:[()=>misStart()],next:[()=>{if(RADIO.blocked)radioKick();else radioSkip(1)}]};
 /* v3 r17: segurar ARMA abre a roda; arrastar o dedo escolhe (toque rápido = próxima arma, regra do wheelClose) */
 {const wb=$('#touch').querySelector('[data-t="wpn"]');let id=null,lx=0,ly=0;
  wb.addEventListener('touchstart',e=>{const t=e.changedTouches[0];id=t.identifier;lx=t.clientX;ly=t.clientY},{passive:true});
  wb.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches)if(t.identifier===id&&WHL.open==='wpn'){wheelMove((t.clientX-lx)*1.6,(t.clientY-ly)*1.6);lx=t.clientX;ly=t.clientY}},{passive:false})}
 document.querySelectorAll('#touch .tb').forEach(b=>{const a=act[b.dataset.t];if(!a)return;
  b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();tHap();b.classList.add('on');a[0]();if(b.closest('#tmore'))$('#tmore').hidden=true},{passive:false});
  const up=e=>{e.preventDefault();if(b.dataset.t!=='run')b.classList.remove('on');if(a[1])a[1]();};b.addEventListener('touchend',up);b.addEventListener('touchcancel',up)});touchLayoutApply()}
{const gb=document.getElementById('guideBtn');if(gb)gb.addEventListener('click',()=>{const g=$('#storyGuide');if(!g)return;g.classList.remove('gmin');gb.classList.remove('new');if(TOUCH.guide)TOUCH.guide.until=performance.now()+15000})}
/* v78: celular nas cenas (avião do início, final): 1º toque mostra "toque novamente para pular a cena"; 2º toque em até 3 s pula o trecho */
{const SK={t:0,h:0};document.addEventListener('touchstart',e=>{if(!TOUCH.on||!(STORYINTRO.active||STORYEND.active)||menuOpen||(typeof DLG!=='undefined'&&DLG.on))return;if(e.target&&e.target.closest&&e.target.closest('button,a,input,#menu,#cfg'))return;
 const now=performance.now(),el=document.getElementById('skipHint');if(now-SK.t<3000){SK.t=0;el.hidden=true;try{storySkipPart()}catch(_){}return}
 SK.t=now;el.hidden=false;clearTimeout(SK.h);SK.h=setTimeout(()=>{el.hidden=true},3000)},{passive:true})}
/* v3 r2 · INTERFACE AUTOMÁTICA (HUDA). Minimapa "em uso" = GPS marcado, alvo de missão/corrida/serviço ativo, procurado, X9,
   mensagem não lida (envelope no radar) ou táxi/serviço do celular vindo; fica aberto 4 s depois e espia 3 s ao entrar/sair de veículo.
   Toque: qualquer toque acorda os botões; 3 s sem dedo na tela (analógico, pedais, câmera) → touch-idle. Opções: S.miniAuto, S.touchHide. */
const HUDA={miniT:0,ck:0,lastTouch:0,car:null};
function miniInUse(){if(NAV.marker||POL.wanted||X9.p)return true;if(PL.inside==='backrooms'||!PL.inside&&brInBlock(PL.x,PL.z,70)&&brOK())return true; /* v3 r10: radar abre perto do quarteirão com falha e nas Backrooms */
 if(typeof RACE!=='undefined'&&RACE.on)return true;
 try{if(phoneUnread())return true}catch(e){}
 try{if(missionTargets().some(t=>t.active))return true}catch(e){}
 if(typeof TAXI!=='undefined'&&TAXI.fromPhone&&(TAXI.state==='call'||TAXI.state==='wait'))return true;
 for(const c of vehicles)if(c.svc&&c.svc.state==='go')return true;
 return false}
function miniRestOrigin(){const r=mini.getBoundingClientRect();if(!r.width)return;const bot=r.top+r.height/2>=innerHeight/2;mini.style.transformOrigin=(r.left+r.width/2<innerWidth/2?'0':'100%')+' '+(bot?'100%':'0');
 /* PC: o kit (vida/arma) fica em cima do radar no canto de baixo; desce junto quando ele recolhe */
 const k=$('#hpwrap'),q=k&&k.getBoundingClientRect();document.body.style.setProperty('--kitDrop',(bot&&!TOUCH.on&&q&&q.bottom<=r.top+4&&Math.abs(q.left-r.left)<40)?Math.round(r.height*.66)+'px':'0px');miniSpeedFollow(r,bot)}
/* v3 r28: velocímetro preso ao radar — quando o radar recolhe (scale .34 no canto), o velocímetro anda junto até a borda do radar pequeno
   (usa a propriedade CSS translate, separada do transform de cada layout). Mede com o velocímetro escondido (a pé) também. */
function miniSpeedFollow(r,bot){const sp=$('#speed'),B=document.body;if(!sp||!r||!r.width)return;const was=sp.hidden;if(was){sp.style.visibility='hidden';sp.hidden=false}
 const q=sp.getBoundingClientRect();if(was){sp.hidden=true;sp.style.visibility=''}let dx=0,dy=0;
 if(q.width){const k=.34,L=r.left+r.width/2<innerWidth/2,sw=r.width*k,sh=r.height*k,rs={left:L?r.left:r.right-sw,right:L?r.left+sw:r.right,top:bot?r.bottom-sh:r.top,bottom:bot?r.bottom:r.top+sh};
  const cy=q.top+q.height/2,cx=q.left+q.width/2;
  if(q.left>=r.right-6&&cy>r.top-q.height&&cy<r.bottom+q.height)dx=rs.right-r.right;else if(q.right<=r.left+6&&cy>r.top-q.height&&cy<r.bottom+q.height)dx=rs.left-r.left;
  else if(q.top>=r.bottom-6&&cx>r.left-q.width&&cx<r.right+q.width)dy=rs.bottom-r.bottom;else if(q.bottom<=r.top+6&&cx>r.left-q.width&&cx<r.right+q.width)dy=rs.top-r.top;
  if(dx&&!bot&&q.bottom>rs.bottom+4)dy=Math.max(rs.top-q.top,rs.bottom-q.bottom)}
 B.style.setProperty('--spdDX',Math.round(dx)+'px');B.style.setProperty('--spdDY',Math.round(dy)+'px')}
function hudHot(b,on){if(!b)return;on=!!on;if(b.classList.contains('hot')===on)return;b.classList.toggle('hot',on);if(on){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');clearTimeout(b._popT);b._popT=setTimeout(()=>b.classList.remove('pop'),1100)}}
function hudAutoTick(){const now=performance.now(),B=document.body;
 if(!HUDA.miniT)HUDA.miniT=now;
 {const c=!!(PL.car||PL.heli);if(HUDA.car!==c){if(HUDA.car!==null)HUDA.miniT=Math.max(HUDA.miniT,now-1000);HUDA.car=c}}
 if(now-HUDA.ck>250){HUDA.ck=now;let use=S.miniAuto===false||NAV.open;if(!use)try{use=miniInUse()}catch(e){use=true}if(use)HUDA.miniT=now;
  const rest=now-HUDA.miniT>4000;if(B.classList.contains('mini-rest')!==rest){if(rest)miniRestOrigin();B.classList.toggle('mini-rest',rest)}}
 if(!TOUCH.on)return;const mode=['auto','fade','off'].includes(S.touchHide)?S.touchHide:'auto';
 const held=TOUCH.joy!=null||TOUCH.look!=null||!!(TOUCH.steerT&&TOUCH.steerT.size)||!!(TOUCH.pedT&&TOUCH.pedT.size)||TOUCH.run||!$('#tmore').hidden;
 if(held)HUDA.lastTouch=now;
 const idle=mode==='auto'&&now-HUDA.lastTouch>3000,fade=mode==='fade';
 if(B.classList.contains('touch-idle')!==idle)B.classList.toggle('touch-idle',idle);
 if(B.classList.contains('touch-fade')!==fade)B.classList.toggle('touch-fade',fade)}
{const wake=()=>{HUDA.lastTouch=performance.now();if(document.body.classList.contains('touch-idle'))document.body.classList.remove('touch-idle')};
 document.addEventListener('touchstart',wake,{passive:true,capture:true});document.addEventListener('touchend',wake,{passive:true,capture:true})}
/* v3 r17 · EDITOR DOS BOTÕES DE TOQUE (Config › Controles de toque › EDITAR BOTÕES).
   Cada peça (analógico, setas, pedais, botões da direita e do topo) guarda {x,y,s,o} em S.touchLayout[chave]:
   deslocamento em px (CSS `translate`, não mexe no transform das animações), escala (`scale`) e opacidade (filter:opacity,
   multiplica com o apagar automático). Durante a edição o menu fica escondido mas aberto (jogo pausado) e o #touch
   engole os toques na fase de captura, então nenhum botão dispara. */
function touchEditables(){const out=[];const t=$('#touch');if(!t)return out;
 for(const id of ['tjoy','tsteer','tpedal']){const e=document.getElementById(id);if(e)out.push([id,e])}
 for(const b of t.querySelectorAll('#tbtns .tb,#ttop .tb')){const k=b.dataset.t;if(!k||/^motion/.test(k))continue;out.push([(b.closest('#ttop')?'top:':'tb:')+k,b])}
 return out}
function touchLayoutClean(L){const o={};if(!L||typeof L!=='object')return o;for(const k in L){const v=L[k];if(!v||typeof v!=='object'||!/^(car:)?(tjoy|tsteer|tpedal|tb:\w+|top:\w+)$/.test(k))continue;
 const n=(x,a,b,d)=>Number.isFinite(+x)?clamp(+x,a,b):d;o[k]={x:n(v.x,-3000,3000,0),y:n(v.y,-3000,3000,0),s:n(v.s,.6,1.6,1),o:n(v.o,.2,1,1)}}return o}
function touchLayoutApply(){const L=S.touchLayout||{},T=$('#touch'),pre=T&&T.classList.contains('drive')?'car:':'';for(const [k,e] of touchEditables()){const v=L[pre+k];
 e.style.translate=v&&(v.x||v.y)?v.x+'px '+v.y+'px':'';e.style.scale=v&&v.s!==1?String(v.s):'';e.style.filter=v&&v.o<1?'opacity('+v.o+')':''}}
const TEDIT={sel:null,drag:null,view:'foot'};
function teKey(k){return (TEDIT.view==='car'?'car:':'')+k}
function touchEditUI(){let d=$('#tedit');if(d)return d;d=document.createElement('div');d.id='tedit';d.hidden=true;
 const en=S.lang==='en',T2=(a,b)=>en?b:a;
 d.innerHTML='<div class="te-bar"><b id="teName"></b><div class="te-row te-view"><button class="btn" type="button" data-v="foot">'+T2('A PÉ','ON FOOT')+'</button><button class="btn" type="button" data-v="car">'+T2('VEÍCULO','VEHICLE')+'</button></div><label><span>'+T2('TAMANHO','SIZE')+'</span><input id="teSize" type="range" min="60" max="160" value="100"></label><label><span>'+T2('OPACIDADE','OPACITY')+'</span><input id="teAlpha" type="range" min="20" max="100" value="100"></label><div class="te-row"><button class="btn" type="button" id="teReset">'+T2('RESTAURAR','RESET')+'</button><button class="btn primary" type="button" id="teDone">'+T2('PRONTO','DONE')+'</button></div></div>';
 d.querySelectorAll('.te-view .btn').forEach(b=>b.addEventListener('click',()=>{TEDIT.view=b.dataset.v;touchEditSelect(null);touchEditView()}));
 document.body.appendChild(d);
 const cur=()=>{const k=TEDIT.sel;if(!k)return null;S.touchLayout=S.touchLayout||{};const kk=teKey(k);return S.touchLayout[kk]||(S.touchLayout[kk]={x:0,y:0,s:1,o:1})};
 $('#teSize').addEventListener('input',e=>{const v=cur();if(!v)return;v.s=e.target.value/100;touchLayoutApply();saveCfg()});
 $('#teAlpha').addEventListener('input',e=>{const v=cur();if(!v)return;v.o=e.target.value/100;touchLayoutApply();saveCfg()});
 $('#teReset').addEventListener('click',()=>{S.touchLayout={};touchLayoutApply();touchEditSelect(null);saveCfg();toast(translatePlain('BOTÕES NO LUGAR PADRÃO'))});
 $('#teDone').addEventListener('click',()=>touchEditEnd());
 const T=$('#touch');
 T.addEventListener('touchstart',e=>{if(!TOUCH.edit)return;e.preventDefault();e.stopPropagation();const t=e.changedTouches[0];
  const hit=touchEditables().find(([k,el])=>!el.hidden&&el.contains(e.target));if(!hit){touchEditSelect(null);return}
  touchEditSelect(hit[0]);const v=cur();TEDIT.drag={id:t.identifier,el:hit[1],v,x0:t.clientX,y0:t.clientY,vx:v.x,vy:v.y}},{capture:true,passive:false});
 T.addEventListener('touchmove',e=>{if(!TOUCH.edit)return;e.preventDefault();e.stopPropagation();const D=TEDIT.drag;if(!D)return;
  for(const t of e.changedTouches){if(t.identifier!==D.id)continue;const par=D.el.parentElement,pr=par.getBoundingClientRect(),k=par.offsetWidth?pr.width/par.offsetWidth:1;
   const ox=D.v.x,oy=D.v.y;D.v.x=Math.round(D.vx+(t.clientX-D.x0)/k);D.v.y=Math.round(D.vy+(t.clientY-D.y0)/k);touchLayoutApply();
   const r=D.el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;if(cx<8||cy<8||cx>innerWidth-8||cy>innerHeight-8){D.v.x=ox;D.v.y=oy;touchLayoutApply()}}},{capture:true,passive:false});
 const end=e=>{if(!TOUCH.edit)return;e.preventDefault();e.stopPropagation();if(TEDIT.drag){TEDIT.drag=null;saveCfg()}};
 T.addEventListener('touchend',end,{capture:true,passive:false});T.addEventListener('touchcancel',end,{capture:true,passive:false});
 return d}
function touchEditSelect(k){TEDIT.sel=k;for(const [kk,e] of touchEditables())e.classList.toggle('te-sel',kk===k);
 const v=k&&S.touchLayout&&S.touchLayout[teKey(k)];$('#teSize').value=Math.round((v?v.s:1)*100);$('#teAlpha').value=Math.round((v?v.o:1)*100);
 const en=S.lang==='en',nm=k?(k==='tjoy'?(en?'STICK':'ANALÓGICO'):k==='tsteer'?(en?'ARROWS':'SETAS'):k==='tpedal'?(en?'PEDALS':'PEDAIS'):((touchEditables().find(q=>q[0]===k)||[])[1]||{}).getAttribute?.('aria-label')||k):'';
 $('#teName').textContent=k?translatePlain(nm):translatePlain('ARRASTE UM BOTÃO');$('#tedit').classList.toggle('none',!k)}
function touchEditStart(){if(!TOUCH.on){toast(translatePlain('SÓ EM TELA DE TOQUE'));return}touchEditUI();TOUCH.edit=true;document.body.classList.add('touch-edit');
 $('#tmore').hidden=true;$('#touch').hidden=false;$('#tedit').hidden=false;TEDIT.view=PL.car?'car':'foot';touchEditSelect(null);touchEditView()}
/* mostra só as peças do modo escolhido (a pé ou veículo), cada modo com o seu layout */
function touchEditView(){const T=$('#touch'),car=TEDIT.view==='car';T.classList.toggle('drive',car);const arrows=car&&S.touchSteer!=='stick';
 $('#tjoy').hidden=arrows;$('#tsteer').hidden=!arrows;$('#tpedal').hidden=!car;
 const on=car?['fire','f','space','run','wpn','horn']:['fire','f','space','run','wpn','interact'];for(const b of T.querySelectorAll('#tbtns .tb'))b.hidden=!on.includes(b.dataset.t);
 for(const b of $('#tedit').querySelectorAll('.te-view .btn'))b.classList.toggle('primary',b.dataset.v===TEDIT.view);touchLayoutApply()}
function touchEditEnd(){TOUCH.edit=false;for(const b of $('#touch').querySelectorAll('#tbtns .tb'))b.dataset.sig='';TEDIT.drag=null;touchEditSelect(null);document.body.classList.remove('touch-edit');$('#tedit').hidden=true;if(!played)$('#touch').hidden=true;saveCfg()}
function touchVisible(){if(!TOUCH.on)return;if(TOUCH.edit)return;
 const h=(padActive()&&played)||menuOpen||!played||NAV.open||cfgOpen||cmdsOpen||TUNE.open||WARD.open||DEAL.open||AMMO.uiOpen||TECH.open||recordsOpen||MINIKEY.open||SLOT.open||NEWS.open||TABLE_GAME.open||DLG.on||PHONE.open||POOL.on||DICE.on||!!SKATE.ui||EMOKB.open;
 const el=$('#touch');if(el.hidden!==h){el.hidden=h;if(h){TOUCH.joy=TOUCH.look=null;TOUCH.x=TOUCH.y=0;TOUCH.run=false;TOUCH.gas=TOUCH.brake=false;keys.KeyW=keys.KeyS=keys.KeyA=keys.KeyD=keys.Space=keys.ShiftLeft=false;GUN.firing=false;hornUp('touch');$('#tknob').style.transform='';$('#tmore').hidden=true;if(TOUCH.steerT){TOUCH.steerT.clear();TOUCH.pedT.clear();TOUCH.steerUpd();TOUCH.pedUpd()}}}
 const car=!!PL.car,heli=!!PL.heli,air=!!PARA.active;
 /* v3 r17: CORRER ligado não vira NITRO preso ao entrar no carro (e vice-versa) */
 if(TOUCH.wasCar!==car){TOUCH.wasCar=car;if(TOUCH.run){TOUCH.run=false;keys.ShiftLeft=false;const rb=el.querySelector('[data-t=run]');if(rb)rb.classList.remove('on')}}
 {const g=$('#storyGuide'),gb=$('#guideBtn'),G=TOUCH.guide||(TOUCH.guide={sig:'',until:0}),now=performance.now(),on=g&&!g.hidden&&!document.body.classList.contains('story-cinematic');
  if(on){const sig=g.textContent;if(sig!==G.sig){G.sig=sig;G.until=now+15000;g.classList.remove('gmin');gb.classList.remove('new')}
   if(now>G.until&&!g.classList.contains('gmin')){g.classList.add('gmin');gb.classList.add('new')}}
  const showBtn=on&&g.classList.contains('gmin');if(gb.hidden===showBtn)gb.hidden=!showBtn;
  let top=12;if(on&&!g.classList.contains('gmin')){const r=g.getBoundingClientRect();top=Math.round(r.bottom+6)}else if(showBtn)top=54;
  const kt=top+'px';if(TOUCH.kitTop!==kt){TOUCH.kitTop=kt;document.body.style.setProperty('--kitTop','calc('+kt+' + env(safe-area-inset-top,0px))')}}
 {const hw=$('#hpwrap');const r=hw&&hw.offsetParent?hw.getBoundingClientRect():null;const t=r&&r.height?Math.round(r.bottom+8)+'px':'';if(TOUCH.miniTop!==t){TOUCH.miniTop=t;if(t)document.body.style.setProperty('--miniTop',t);else document.body.style.removeProperty('--miniTop')}}
 const set=(key,text,show=true,icon,cap)=>{const b=el.querySelector('[data-t="'+key+'"]');if(!b)return;const sig=(icon||'')+'|'+text+'|'+(cap?1:0);if(b.dataset.sig!==sig){b.dataset.sig=sig;b.innerHTML=icon?tsvg(icon)+(cap?'<i>'+text+'</i>':''):text;b.setAttribute('aria-label',text)}if(b.hidden===show)b.hidden=!show};
 const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden};
 /* v78: veículo = setas/pedais (ou analógico, opção); a pé = analógico */
 if(el.classList.contains('drive')!==car){el.classList.toggle('drive',car);touchLayoutApply()}
 const arrows=car&&S.touchSteer!=='stick'&&MOTION.mode!=='phone';
 if(TOUCH.steerOn!==arrows){TOUCH.steerOn=arrows;TOUCH.joy=null;TOUCH.x=TOUCH.y=0;$('#tknob').style.transform='';keys.KeyA=keys.KeyD=false;if(TOUCH.steerT){TOUCH.steerT.clear();TOUCH.steerUpd()}}
 {const st=$('#tsteer'),jy=$('#tjoy'),pd=$('#tpedal');if(st.hidden===arrows)st.hidden=!arrows;if(jy.hidden!==arrows)jy.hidden=arrows;if(pd.hidden===car)pd.hidden=!car}
 if(!car&&(TOUCH.gas||TOUCH.brake||(TOUCH.pedT&&TOUCH.pedT.size))){if(TOUCH.pedT){TOUCH.pedT.clear();TOUCH.pedUpd()}TOUCH.gas=TOUCH.brake=false;keys.KeyW=keys.KeyS=false}
 /* v78: botão de CONTEXTO no lugar do antigo ENTRAR: ENTRAR só perto de veículo/helicóptero, INTERAGIR só com aviso de loja/porta/NPC
    (ou dentro de interior), SAIR dentro do veículo, PARAQUEDAS no ar; sem nada por perto ele some. Perto de carro E loja: ENTRAR + mão menor. */
 const skRide=!!(typeof SKATE!=='undefined'&&SKATE.ride&&!car&&!heli&&!air&&!PL.inside&&!PL.dead);
 const foot=!car&&!heli&&!air&&!PL.dead;
 TOUCH.ctxPrompt=(vis('ctxp')&&!CTX.skate)||['jailp','heistp','mallTag','pumpTag','tvp'].some(vis);
 const inter=foot&&(!!PL.inside||!!(CTX.shop||CTX.mall||CTX.club)||TOUCH.ctxPrompt||(typeof wardNear==='function'&&wardNear()));
 let nearV=foot&&!PL.inside&&vis('prompt');if(foot&&!nearV&&!PL.inside){try{nearV=!!(heliNear()||(!skRide&&(CTX.skate||(typeof skNear==='function'&&skNear()))))}catch(e){}}
 const m=air?'para':(car||heli||PL.taxi||skRide)?'exit':nearV?'enter':inter?'interact':null;TOUCH.ctx=m;
 const ML={para:['PARAQUEDAS','para'],exit:['SAIR','exit'],enter:['ENTRAR','car'],interact:['INTERAGIR','hand']}[m]||['','car'];
 set('f',ML[0],!!m,ML[1],true);{const fb=el.querySelector('[data-t="f"]');const g=m==='enter'||m==='interact';if(fb&&fb.classList.contains('ctx')!==g)fb.classList.toggle('ctx',g);hudHot(fb,g||m==='para')}
 set('interact','INTERAGIR',nearV&&inter&&!PL.inside,'hand',false);hudHot(el.querySelector('[data-t="interact"]'),nearV&&inter&&!PL.inside);hudHot(el.querySelector('[data-t="altact"]'),!!CTX.car);
 set('motionGas','ACELERAR',false);set('motionBrake','FREAR / RÉ',false);
 set('fire',GUN.has?'ATIRAR':'SOCO',!heli&&!air,GUN.has?'gun':'fist');
 set('space',heli?'SALTAR':car?'FREIO DE MÃO':'PULAR',!air,car?'hbrake':'jump');set('run',car?'NITRO':'CORRER',!heli&&!air&&(!car||!!(PL.car.special||PL.car.hasNitro)),car?'nitro':'run');set('wpn','ARMA',!heli&&!air,'wpn');set('horn','BUZINA',car,'horn');
 set('radio','RÁDIO',car||heli||!!PLAYER_PAL.headphone,'radio',true);set('next','MÚSICA',car||heli||!!PLAYER_PAL.headphone,'next',true);set('lights','FARÓIS',car,'lights',true);set('altact','AÇÃO 2',!!CTX.car,'alt',true);
}

if(matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0))touchSetup();

/* ================= PIERS, BOATS, RAMPS, STUNT JUMPS ================= */
const DY=RY+.6;let TS=1;const JUMP={active:false,r:null,t:0,cam:null,x0:0,z0:0};
// pier frame: edge line from (ax,az) along (tx,tz); n points into the water
function pierLocal(p,x,z){const dx=x-p.ax,dz=z-p.az;return[dx*p.tx+dz*p.tz,dx*p.nx+dz*p.nz]}
function pierY(x,z){const L=city.piers;if(!L||!L.length)return null;for(const p of L){if(Math.abs(x-p.cx)>40||Math.abs(z-p.cz)>40)continue;
  if(p.beach){if(x>p.r[0]&&x<p.r[2]&&z>p.r[1]&&z<p.r[3])return p.y;continue}
  const[t,d]=pierLocal(p,x,z);if(d<-.05)continue;
  if(d<=2.6&&t>=p.ts-2.4&&t<p.ts)return 0;if(d<=2.6&&t>=p.ts&&t<p.ts+8)return-Math.floor((t-p.ts)/8*8)/8*2.4;if(d<=4.4&&t>=p.ts+8&&t<=p.ts+20)return DY}return null}
function carveGap(xa,za,xb,zb,extra=[]){let pcs=[[xa,za,xb,zb]];for(const g of [...(city.gaps||[]),...extra]){const nx=[];for(const q of pcs){if(q[2]<=g[0]||q[0]>=g[2]||q[3]<=g[1]||q[1]>=g[3]){nx.push(q);continue}
  const alongX=(q[2]-q[0])>=(q[3]-q[1]);if(alongX){if(g[0]>q[0])nx.push([q[0],q[1],g[0],q[3]]);if(g[2]<q[2])nx.push([g[2],q[1],q[2],q[3]])}else{if(g[1]>q[1])nx.push([q[0],q[1],q[2],g[1]]);if(g[3]<q[3])nx.push([q[0],g[3],q[2],q[3]])}}pcs=nx}return pcs.filter(q=>q[2]-q[0]>.05&&q[3]-q[1]>.05)}
/* v79r33: o corpo boiando (easter egg) só aparece NA ÁGUA (procura água num raio de 16 m; se não achar, não aparece). A causa do bug era `pedRiverWall`, que tirava da água qualquer ped vivo — inclusive o corpo — e o largava deitado no cais (seed 6783). */
function bodyInWater(b){if(b.okW!==undefined)return b.okW;if(inWater(b.x,b.z))return b.okW=true;for(let r=2;r<=16;r+=2)for(let k=0;k<12;k++){const a=k/12*6.283,x=b.x+Math.cos(a)*r,z=b.z+Math.sin(a)*r;if(inWater(x,z)&&inWater(x+1.5,z)&&inWater(x-1.5,z)){b.x=x;b.z=z;return b.okW=true}}return b.okW=false}
function buildPiers(){city.piers=[];city.gaps=[];city.body=null;const pr=mulberry32((S.seed^0x3ad1c5e7)>>>0),E=city.ext,o=RW/2;
 if(city.riv&&city.riv.size){const cand=[];for(const kk of city.riv){const i=Math.floor(kk/1000),j=kk%1000,r=[i*P+o,j*P+o,(i+1)*P-o,(j+1)*P-o];
   for(const[ax,az,tx,tz,nx,nz] of [[r[0],r[1],1,0,0,1],[r[0],r[3],1,0,0,-1],[r[0],r[1],0,1,1,0],[r[2],r[1],0,1,-1,0]]){const mx=ax+tx*30-nx*1.2,mz=az+tz*30-nz*1.2;if(mouthPierBlocked(mx,mz)||riverZone(mx,mz)||mx<10||mz<10||mx>E-10||mz>E-10)continue;
    const f=city.info[rectNear(ax+tx*30-nx*(o+SW+3),az+tz*30-nz*(o+SW+3))];if(f&&f.kind==='industrial'&&pr()<.7)continue;cand.push([ax,az,tx,tz,nx,nz])}}
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(pr()*(i+1));const t=cand[i];cand[i]=cand[j];cand[j]=t}
  const want=Math.max(2,Math.round(city.riv.size/5));for(const c of cand){if(city.piers.length>=want)break;const[ax,az,tx,tz,nx,nz]=c,ts=12+pr()*18;
   const p={ax,az,tx,tz,nx,nz,ts,cx:ax+tx*(ts+6),cz:az+tz*(ts+6),id:'pier'+Math.round(ax)+','+Math.round(az)+','+nx+nz};if(city.piers.some(q=>Math.hypot(q.cx-p.cx,q.cz-p.cz)<140))continue;
   p.boat={x:ax+tx*(ts+14)+nx*5.9,z:az+tz*(ts+14)+nz*5.9,a:Math.atan2(tz,tx)};const g0=[ax+tx*(ts-2.4),az+tz*(ts-2.4)],g1=[ax+tx*ts+nx*.4,az+tz*ts+nz*.4];
   city.gaps.push([Math.min(g0[0],g1[0])-.05,Math.min(g0[1],g1[1])-.05,Math.max(g0[0],g1[0])+.05,Math.max(g0[1],g1[1])+.05]);city.piers.push(p)}}
 // beach marina
 {const cs=city.coast,sp=city.coastSpan,t=sp?(sp[0]<0?E*.3:E*.7):E*(.3+pr()*.4),W2=1.8,PY=SEA_Y+1.3;const cwT=city.haze?0:coastW(t),u1=SHORE+30+Math.max(0,cwT);let u0=SAND_FLAT;while(u0<SHORE+Math.max(0,cwT)&&beachProfile(city.haze?u0:coastUe(t,u0))>PY-.12)u0+=.25; /* v3 r35: píer começa onde a areia nova chega no nível e avança junto com a ponta */const TU=(t2,u)=>cs===0?[t2,-u]:cs===1?[t2,E+u]:cs===2?[-u,t2]:[E+u,t2];
  const a=TU(t-W2,u0),b=TU(t+W2,u1);const r=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];const bp=TU(t+W2+2,u1-6),dir=TU(t,u1),dir0=TU(t,u0);
  if(city.haze)city.hazeCalm=[(r[0]+r[2])/2,(r[1]+r[3])/2];
  if(!mouthPierBlocked((r[0]+r[2])/2,(r[1]+r[3])/2))city.piers.push({beach:true,r,y:PY,cx:(r[0]+r[2])/2,cz:(r[1]+r[3])/2,id:'marina',boat:{x:bp[0],z:bp[1],a:Math.atan2(dir[1]-dir0[1],dir[0]-dir0[0])},sea:true})}
 // the floating body (easter egg): in the polluted area if there is one
 if(city.water&&city.water.length&&pr()<.85){let best=null,bv=-1;for(let k=0;k<60;k++){const w=city.water[Math.floor(pr()*city.water.length)];if(w[0]<0||w[1]<0||w[2]>E||w[3]>E)continue;const x=w[0]+4+pr()*(w[2]-w[0]-8),z=w[1]+4+pr()*(w[3]-w[1]-8);const v=pollAt(x,z)+pr()*.2;if(v>bv&&waterAt(x,z)){bv=v;best={x,z}}}
  if(best)city.body={x:best.x,z:best.z,id:'body',loot:['cash','rpg','smg'][Math.floor(pr()*3)]}}}
function waterLevel(x,z){return riverZone(x,z)?RY:SEA_Y}
function jetOK(x,z){if(boatOK(x,z))return true;if(pierY(x,z)!==null)return false;return !riverZone(x,z)&&outDist(x,z)>SHORE-3.5}
function boatOK(x,z){if(SHIPS.list.length&&shipAt(x,z,1))return false;for(const p of city.pillars||[])if(x>p[0]&&x<p[2]&&z>p[1]&&z<p[3])return false;if(pierY(x,z)!==null)return false;return mouthChannel(x,z,1)||riverZone(x,z)||outDist(x,z)>SHORE+1}
function boatStep(c,h){const t=c.t,ca=Math.cos(c.a),sa=Math.sin(c.a);let vf=c.vx*ca+c.vz*sa,vl=-c.vx*sa+c.vz*ca;c.fwd=vf;
 c.steer+=(c.steerT-c.steer)*Math.min(1,h*5);let af=c.alive?(c.thr>0?c.thr*t.acc:c.thr*t.acc*.55):0;af-=vf*Math.abs(vf)*t.acc/(t.vmax*t.vmax)+vf*.12;if(c.hand)af-=vf*.8;
 vf+=af*h;vl+=-vl*1.4*h;c.vx=vf*ca-vl*sa;c.vz=vf*sa+vl*ca;let wt=c.steer*clamp(vf/7,-1,1)*.95;
 if(c.donut){const damping=Math.exp(-h*3.5);c.vx*=damping;c.vz*=damping;wt=c.donut}
 c.w+=(wt-c.w)*Math.min(1,h*(c.donut?5:2.5));
 c.x+=c.vx*h;c.z+=c.vz*h;c.a+=c.w*h;c.ax=af*ca;c.az=af*sa;c.ws[0]=c.ws[1]=c.ws[2]=c.ws[3]=0;
 const hl=t.L/2-.3,hw=t.W/2-.2;for(const[lx,lz] of [[hl,0],[-hl,hw],[-hl,-hw],[0,hw],[0,-hw]]){const x=c.x+lx*ca-lz*sa,z=c.z+lx*sa+lz*ca;if(!(c.t.hover?(pierY(x,z)===null&&!bldAt(x,z,.2)&&!shipAt(x,z,1)):c.type==='jetski'?jetOK(x,z):boatOK(x,z))){const sp=Math.hypot(c.vx,c.vz);c.x=c.px;c.z=c.pz;c.a=c.pa;c.vx*=-.25;c.vz*=-.25;c.w*=-.3;if(sp>5){impact(c,sp,x,z);if(c===PL.car)shake=Math.max(shake,.3)}break}}}
/* --- ramps --- */
function buildRamps(){city.ramps=[];const rr2=mulberry32((S.seed^0x19e3b8f1)>>>0),o=RW/2,N=city.N,E=city.ext;
 const add=(x,z,dx,dz,L,w,h,kind,insane)=>{city.ramps.push({x,z,dx,dz,L,w,h,kind,insane,id:'J'+Math.round(x)+','+Math.round(z)});return city.ramps[city.ramps.length-1]};
 // v77: SEM rampas em estacionamentos/lotes especiais (só becos de prédios, adicionados na geração dos chunks).
 // Zona rural: alguns saltos de terra no capim, decolando por cima de uma estrada estreita de terra.
 {const cand=[];for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)for(const d of [0,1]){if(!segExists(kx,kz,d))continue;
   const mx=d?kx*P:(kx+.5)*P,mz=d?(kz+.5)*P:kz*P,line=city.lines[d?'V'+kx:'H'+kz];if(line&&line.t==='ave')continue;
   if(!isRural(mx,mz)||riverZone(mx,mz)||inWater(mx,mz))continue;
   for(const side of [-1,1])cand.push({d,mx,mz,side})}
  for(let k=cand.length-1;k>0;k--){const j=Math.floor(rr2()*(k+1));[cand[k],cand[j]]=[cand[j],cand[k]]}
  const want=Math.min(6,Math.max(2,Math.round(N*.5))),picked=[];
  for(const c of cand){if(picked.length>=want)break;if(picked.some(q=>Math.hypot(q.mx-c.mx,q.mz-c.mz)<P*2.2))continue;
   const L=6.5,off=o+.6,nx=c.d?c.side:0,nz=c.d?0:c.side; // nx/nz: lado do campo de onde sai a rampa
   const x=c.mx+nx*(off+L),z=c.mz+nz*(off+L),ri=city.rects.findIndex(r=>x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]);if(ri<0)continue;
   const f=city.info[ri];if(!f||f.kind==='lm'||f.forest||f.reservedSpecial)continue;
   const r=add(x,z,-nx,-nz,L,3.6,1.7,'dirt',false);r.field=ri;picked.push(c)}}
 // a couple of lot ramps become stunt jumps as well
 let ins=city.ramps.filter(r=>r.insane).length;for(const r of city.ramps)if(!r.insane&&r.kind==='dirt'&&ins<2&&rr2()<.5){r.insane=true;r.need=18;ins++}}
// v77: rampas de estacionamento só ficam onde cabem: rampa + 9 m de embalo + 6 m de pouso livres de
// colisores (prédio, bombas, árvores, sucata), sem vagas no embalo/rampa e dentro do miolo da quadra.
// Se a posição original falhar, procura outra dentro da mesma quadra; se nada servir, a rampa some.
function rampFits(r,x,z,dx,dz){const{L,w}=r,px=-dz,pz=dx,hw=w/2+.7,q=city.rects[r.ri];if(!q)return false;const ix0=q[0]+SW+.5,iz0=q[1]+SW+.5,ix1=q[2]-SW-.5,iz1=q[3]-SW-.5;
 for(let s0=-9;s0<=L+6;s0+=1)for(let l=-hw;l<=hw+.01;l+=hw/2){const X=x+dx*s0+px*l,Z=z+dz*s0+pz*l;
  if(X<ix0||X>ix1||Z<iz0||Z>iz1)return false;
  if(query(X,Z,.1).some(c=>!c.dead&&X>c.x0-.15&&X<c.x1+.15&&Z>c.z0-.15&&Z<c.z1+.15))return false;
  if(s0<=L+1&&(city.empParkingSlots||[]).some(p=>p.ri===r.ri&&Math.abs(p.x-X)<2.2&&Math.abs(p.z-Z)<2.2))return false}
 return true}
function rampField(r){if(r.settled!==undefined)return r.settled;const q=city.rects[r.field],px=-r.dz,pz=r.dx;let ok=!!q;
 for(let s0=-10;ok&&s0<=r.L;s0+=1)for(let l=-r.w/2-.6;l<=r.w/2+.61;l+=(r.w+1.2)/4){const X=r.x+r.dx*s0+px*l,Z=r.z+r.dz*s0+pz*l;
  if(X<q[0]||X>q[2]||Z<q[1]||Z>q[3]||query(X,Z,.1).some(c=>!c.dead&&X>c.x0-.2&&X<c.x1+.2&&Z>c.z0-.2&&Z<c.z1+.2)){ok=false;break}}
 r.settled=ok;if(!ok){const i=city.ramps.indexOf(r);if(i>=0)city.ramps.splice(i,1)}return ok}
function rampSettle(r){if(r.settled!==undefined)return r.settled;
 let ok=rampFits(r,r.x,r.z,r.dx,r.dz);
 if(!ok){const q=city.rects[r.ri],x0=q[0]+SW,z0=q[1]+SW,x1=q[2]-SW,z1=q[3]-SW;
  outer:for(let gx=x0+2;gx<x1-2;gx+=3)for(let gz=z0+2;gz<z1-2;gz+=3)for(const[dx,dz] of [[r.dx,r.dz],[-r.dz,r.dx],[r.dz,-r.dx],[-r.dx,-r.dz]]){if(rampFits(r,gx,gz,dx,dz)){r.x=gx;r.z=gz;r.dx=dx;r.dz=dz;r.id='J'+Math.round(gx)+','+Math.round(gz);ok=true;break outer}}}
 r.settled=ok;if(!ok){const i=city.ramps.indexOf(r);if(i>=0)city.ramps.splice(i,1)}return ok}
function rampMesh(r,det,neon,marks){const{x,z,dx,dz,L,w,h}=r,px=-dz,pz=dx,P3=(s,l,y)=>[x+dx*s+px*l,y,z+dz*s+pz*l],ref=P3(L*.5,0,-5);
 const col=r.kind==='dirt'?COL('#8a6a40'):r.insane?COL('#c8282a'):COL('#6a6e74'),side=r.kind==='dirt'?COL('#6a5030'):COL('#3a3a40');
 const A=P3(0,-w/2,.02),B=P3(0,w/2,.02),C=P3(L,w/2,h),Dd=P3(L,-w/2,h),C0=P3(L,w/2,0),D0=P3(L,-w/2,0);
 det.qa(A,B,C,Dd,col,P3(L*.7,0,-8));det.qa(B,C,C0,C0,side,P3(L*.6,-w,h*.3));det.qa(A,Dd,D0,D0,side,P3(L*.6,w,h*.3));det.qa(Dd,C,C0,D0,side,P3(L*.5,0,h*.4));
 if(r.kind!=='dirt'){for(let k=1;k<5;k++){const s=k/5*L,y=h*s/L+.02;det.qa(P3(s,-w/2,y),P3(s,w/2,y),P3(s+.25,w/2,y+h*.25/L),P3(s+.25,-w/2,y+h*.25/L),r.insane?COL('#f4f4f0'):COL('#e8c020'),P3(s,0,y-5))}}
 if(r.insane){for(let k=1;k<=3;k++){const s=-k*5;const t0=P3(s,0,.03),a1=P3(s-1.6,-1.3,.03),a2=P3(s-1.6,1.3,.03);marks.qa(t0,a1,a2,a2,COL('#ffd200'),[t0[0],-5,t0[2]]);marks.flat(...(()=>{const q=P3(s-3.4,0,0);return[q[0]-.35,q[2]-.35,q[0]+.35,q[2]+.35]})(),.03,COL('#ffd200'))}
  if(DN&&city.st.synth)neon.box(...(()=>{const q=P3(L,0,h);return[q[0]-.1,h,q[2]-.1,q[0]+.1,h+.1,q[2]+.1]})(),COL('#ffd200'))}}
function rampImpulse(speed,slope){return speed*slope*1.05+1.2}
function rampTick(c,dt){if(c.airY>0||c.airV>0||!city.ramps)return;let on=null;
 for(const r of city.ramps){if(Math.abs(c.x-r.x)>r.L+6||Math.abs(c.z-r.z)>r.L+6)continue;const rx=c.x-r.x,rz=c.z-r.z,s=rx*r.dx+rz*r.dz,l=-rx*r.dz+rz*r.dx;if(Math.abs(l)<r.w/2+.3&&s>-.5&&s<r.L+3){on=[r,s];break}}
 if(!on){c.rampY=0;c.rs=null;return}const[r,s]=on,v=c.vx*r.dx+c.vz*r.dz;
 if(v>2&&s>=0&&s<=r.L)c.rampY=r.h*s/r.L;else if(s<0)c.rampY=0;
 if(s>=r.L-v*dt*1.1&&s<r.L+2.5&&(c.rs===null||c.rs===undefined||c.rs<r.L)&&s>0&&v>5){c.airY=r.h;c.rampY=0;c.airV=rampImpulse(v,r.h/r.L);c.air={r,x0:c.x,z0:c.z,t:0};c.rs=null;
  if(c===PL.car&&r.insane&&v>12){JUMP.active=true;JUMP.r=r;JUMP.t=0;TS=.4;const px=-r.dz,pz=r.dx;JUMP.cam=[c.x+r.dx*14+px*24,9+r.h,c.z+r.dz*14+pz*24]}return}
 c.rs=s}
function airTick(c,dt){if(!(c.airY>0||c.airV>0))return;c.air&&(c.air.t+=dt);c.airV-=14*dt;c.airY+=c.airV*dt;
 const bridge=!!c.air?.bridge,floor=bridge&&!inWater(c.x,c.z)?groundY(c.x,c.z):0;
 if(c.airV<=0&&c.airY<=floor){const vy=-c.airV;if(bridge)c.gy=floor;c.airY=0;c.airV=0;const a=c.air;c.air=null;c.hopV=Math.min(4,vy*.2);
  if(c===PL.car||Math.hypot(c.x-PL.x,c.z-PL.z)<60){thud(Math.min(20,vy*1.4));for(let i=0;i<10;i++)emit(c.x+(Math.random()-.5)*c.t.L,.3,c.z+(Math.random()-.5)*c.t.W,(Math.random()-.5)*4,1+Math.random()*2,(Math.random()-.5)*4,.4,.5,.1,0xffb030,true,1)}
  if(c===PL.car){shake=Math.max(shake,Math.min(1.2,vy/14));rumble(clamp(vy/15,.2,1),clamp(vy/11,.2,1),Math.min(380,120+vy*14))}
  if(vy>9&&c.alive){c.hp-=(vy-9)*3.2*CRASH_DMG;if(c.hp<=0)setOnFire(c)}
  if(c===PL.car&&c.type==='moto'&&vy>12){impact(c,10,c.x,c.z)}
  if(c===PL.car&&JUMP.active)endJump(a)}}
function endJump(a){const r=JUMP.r;JUMP.active=false;TS=1;const c=PL.car;if(!r||!a)return;const dist=Math.hypot(PL.x-a.x0,PL.z-a.z0)+r.L*.3;
 const ok=c&&c.alive&&!inWater(c.x,c.z)&&dist>=(r.need||20);const done=city.stunts&&city.stunts.has(r.id);
 if(ok){city.stunts=city.stunts||new Set();const first=!done;city.stunts.add(r.id);const tot=city.ramps.filter(q=>q.insane).length,got=city.ramps.filter(q=>q.insane&&city.stunts.has(q.id)).length;const pay=first?Math.round(80+dist*2):0;if(pay)money(pay);
  toast('SALTO INSANO!'+(pay?' +$'+pay:'')+'<br><small style="font-size:11px;color:#fff">'+Math.round(dist)+' m · '+got+'/'+tot+' saltos insanos'+(first?'':' (já feito)')+'</small>');horn(.25)}
 else toast('SALTO INSANO FALHOU<br><small style="font-size:11px;color:#fff">'+Math.round(dist)+' m · precisa de '+Math.round(r.need||20)+' m</small>')}

/* ================= SIDE MISSIONS: TAXI + VIGILANTE ================= */
const MIS={type:null,stage:'',t:0,fare:null,dest:null,crims:[],level:0,earned:0,arrows:[]};
function money(n,why){PL.money=Math.max(0,Math.round((PL.money||0)+n));const el=$('#money');if(el){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}if(why)toast(why)}
/* --- paramédico ---
   Na ambulância, T começa. Vá até o ferido (seta vermelha), desça perto dele com a ambulância a poucos metros e aperte
   E (interação) para colocá-lo na ambulância; leve ao hospital. Cada paciente salvo paga; o próximo chamado vem em seguida. */
function medNext(){const sp=sidewalkPoint(110,420);if(!sp){misEnd('SEM CHAMADOS POR PERTO');return}const p=spawnLying(sp.x,sp.z);p.corpse=true;p.fixed=true;p.medPatient=true;
 for(let i=0;i<3;i++)decal(sp.x+(Math.random()-.5)*.8,sp.z+(Math.random()-.5)*.8,1.2+Math.random()*.8,2);
 MIS.fare={p,x:sp.x,z:sp.z};MIS.stage='goto';const d=Math.hypot(sp.x-MIS.amb.x,sp.z-MIS.amb.z);MIS.t=Math.round(45+d/7);misGPS(sp.x,sp.z);
 toast('CHAMADO DE EMERGÊNCIA<br><small style="font-size:11px;color:#fff">ferido a '+Math.round(d)+' m · seta vermelha</small>')}
function medNear(){return MIS.type==='med'&&MIS.stage==='goto'&&!PL.car&&MIS.fare&&MIS.fare.p&&Math.hypot(PL.x-MIS.fare.x,PL.z-MIS.fare.z)<2.6}
function medLoad(){if(!medNear())return false;const a=MIS.amb;if(!a||!a.alive||Math.hypot(a.x-MIS.fare.x,a.z-MIS.fare.z)>14){toast('TRAGA A AMBULÂNCIA MAIS PERTO');return true}
 if(peds.includes(MIS.fare.p))removePed(MIS.fare.p);MIS.fare.p=null;MIS.stage='deliver';const hp=city.hosp;if(!hp){misEnd('SEM HOSPITAL NA CIDADE');return true}
 MIS.dest={x:hp.x,z:hp.z};MIS.t+=Math.round(30+Math.hypot(hp.x-a.x,hp.z-a.z)/7);misGPS(hp.x,hp.z);clang(.2);toast('PACIENTE NA AMBULÂNCIA<br><small style="font-size:11px;color:#fff">volte para a ambulância e leve ao hospital</small>');return true}
function medUpdate(dt){const a=MIS.amb;MIS.t-=dt;
 if(MIS.stage==='goto'){const f=MIS.fare;if(f&&(!f.p||!peds.includes(f.p))&&Math.hypot((PL.car||PL).x-f.x,(PL.car||PL).z-f.z)<120){f.p=spawnLying(f.x,f.z);f.p.corpse=true;f.p.fixed=true;f.p.medPatient=true}
  if(MIS.t<=0){if(MIS.fare&&MIS.fare.p&&peds.includes(MIS.fare.p))removePed(MIS.fare.p);toast('O PACIENTE NÃO RESISTIU');MIS.stage='wait';setTimeout(()=>{if(MIS.type==='med')medNext()},2500);return}}
 else if(MIS.stage==='deliver'){if(MIS.t<=0){toast('O PACIENTE NÃO RESISTIU');MIS.stage='wait';NAV.marker=null;if(NAV.beam)NAV.beam.visible=false;setTimeout(()=>{if(MIS.type==='med')medNext()},2500);return}
  if(NAV.misMarker&&!NAV.marker)misGPS(MIS.dest.x,MIS.dest.z);
  if(PL.car===a&&Math.hypot(a.x-MIS.dest.x,a.z-MIS.dest.z)<16&&Math.abs(a.fwd)<3){MIS.saved=(MIS.saved||0)+1;const pay=CHEAT.used?0:Math.round(50+Math.min(MIS.t,120)+MIS.saved*10);
   if(pay){MIS.earned+=pay;money(pay,'PACIENTE SALVO · +$'+pay+'<br><small style="font-size:11px;color:#fff">'+MIS.saved+' salvo'+(MIS.saved>1?'s':'')+'</small>')}else toast('PACIENTE SALVO · SEM PAGAMENTO<br><small>Cheat usado nesta partida</small>');
   MIS.fare=null;MIS.dest=null;NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;MIS.stage='wait';setTimeout(()=>{if(MIS.type==='med')medNext()},2500)}}}
// Ambulâncias de rua: raras (menos que a polícia), em alta velocidade, ignorando semáforo, com giroflex.
const AMBS={t:30,list:[]};
function ambSpawn(){const pc=PL.car||PL;for(let k=0;k<60;k++){const a=Math.random()*6.283,dd=120+Math.random()*120,kx=clamp(Math.round((pc.x+Math.cos(a)*dd)/P),0,city.N),kz=clamp(Math.round((pc.z+Math.sin(a)*dd)/P),0,city.N),d=Math.floor(Math.random()*4);
  if(!canDrive(kx,kz,d)||isRural(kx*P,kz*P))continue;const li=laneValid(kx,kz,d,0)?0:1,p=lanePt(kx,kz,d,li,P/2);if(inWater(p[0],p[1])||carsNear(p[0],p[1],8).length)continue;
  const c=makeVehicle('van',p[0],p[1],Math.atan2(D[d][1],D[d][0]),'#f4f4f0');c.ambulance=true;c.npcAmb=true;c.lightsOff=false;c.ai={kx,kz,d,li,nd:null,vmax:24+Math.random()*4,stun:0,blockT:0,ignore:0};c.sleep=false;c.vx=Math.cos(c.a)*12;c.vz=Math.sin(c.a)*12;AMBS.list.push(c);return c}return null}
function ambTick(dt){if(!city.ext)return;AMBS.t-=dt;
 if(AMBS.t<=0){AMBS.t=40+Math.random()*50;if(S.style!=='haze'&&S.style!=='inverted'&&!PL.inside&&AMBS.list.length<1&&Math.random()<.4)ambSpawn()}
 const pc=PL.car||PL;for(const c of AMBS.list.slice()){if(c===PL.car||!vehicles.includes(c)){AMBS.list.splice(AMBS.list.indexOf(c),1);continue}
  if(Math.hypot(c.x-pc.x,c.z-pc.z)>380&&c!==PL.lastCar){removeVehicle(c);AMBS.list.splice(AMBS.list.indexOf(c),1)}}
 const on=Math.floor(simT*7)%2;for(const c of vehicles)if((c.ambulance||c.polBoat)&&c.ambL){const lit=c.alive&&!c.lightsOff;c.ambL[0].visible=!lit||on;c.ambL[1].visible=!lit||!on;c.ambL[0].material.color.setHex(lit&&on?0xff2020:0x6a1010);c.ambL[1].material.color.setHex(lit&&!on?0x2060ff:0x102050)}}
function misStart(){if(PL.taxi){taxiSkip();return}if(MIS.type){misEnd('MISSÃO ENCERRADA');return}const c=PL.car;
 if(!c||!c.alive){toast('ENTRE NUM TÁXI, NUMA VIATURA OU NUMA AMBULÂNCIA<br><small style="font-size:11px;color:#fff">T começa a missão do veículo</small>');return}
 if(c.type==='taxi'){MIS.type='taxi';MIS.earned=0;toast('TAXISTA EM SERVIÇO<br><small style="font-size:11px;color:#fff">siga o marcador verde até o passageiro</small>');taxiNewFare()}
 else if(c.ambulance){MIS.type='med';MIS.amb=c;MIS.earned=0;MIS.saved=0;c.lightsOff=false;c.sirenOn=false;toast('PARAMÉDICO EM SERVIÇO<br><small style="font-size:11px;color:#fff">vá até o ferido, desça perto e aperte E para socorrer</small>');medNext()}
 else if(c.police){if(POL.wanted){toast('DESPISTE A POLÍCIA PRIMEIRO');return}MIS.type='cop';MIS.level=0;MIS.earned=0;toast('VIGILANTE<br><small style="font-size:11px;color:#fff">pare os suspeitos: bata ou atire até o carro parar</small>');copNextLevel()}
 else toast('ESTE VEÍCULO NÃO TEM MISSÃO')}
function misEnd(msg){if(MIS.fare&&MIS.fare.p&&peds.includes(MIS.fare.p))removePed(MIS.fare.p);MIS.amb=null;MIS.fare=null;MIS.dest=null;
 for(const c of MIS.crims)c.crim=false;MIS.crims=[];for(const a of MIS.arrows)a.visible=false;
 if(NAV.misMarker){NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;NAV.misMarker=false}
 if(msg)toast(msg+(MIS.earned?'<br><small style="font-size:11px;color:#fff">total ganho: $'+MIS.earned+'</small>':''));MIS.type=null;MIS.stage=''}
function misGPS(x,z){NAV.marker={x,z};NAV.rT=0;NAV.misMarker=true;if(!NAV.beam){const g=new THREE.CylinderGeometry(1.2,1.2,90,16,1,true);NAV.beam=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffd200,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));NAV.beam.renderOrder=4;scene.add(NAV.beam)}NAV.beam.visible=true;NAV.beam.position.set(x,45,z)}
function sidewalkPoint(minD,maxD){const pc=PL.car||PL;for(let k=0;k<60;k++){const a=Math.random()*6.283,d=minD+Math.random()*(maxD-minD),ri=rectNear(pc.x+Math.cos(a)*d,pc.z+Math.sin(a)*d),f=city.info[ri];
  if(!f||!pedLotOk(ri))continue;const r=perim(ri),L=2*((r[2]-r[0])+(r[3]-r[1])),pt=perimPoint(r,Math.random()*L),dd=Math.hypot(pt[0]-pc.x,pt[1]-pc.z);
  if(dd<minD*.8||dd>maxD*1.2||inWater(pt[0],pt[1]))continue;return{x:pt[0],z:pt[1],ri}}return null}
/* --- taxi --- */
function taxiNewFare(){const sp=sidewalkPoint(70,260);if(!sp){misEnd('SEM PASSAGEIROS POR PERTO');return}
 const p=spawnPed({x:sp.x,z:sp.z,min:0,max:1});p.strip=null;p.ri=sp.ri;p.r=perim(sp.ri);p.x=sp.x;p.z=sp.z;p.state='fare';p.fixed=true;p.timer=0;
 MIS.fare={p,x:sp.x,z:sp.z};MIS.stage='pickup';MIS.t=0;misGPS(sp.x,sp.z)}
function taxiUpdate(dt){const c=PL.car,f=MIS.fare;if(!f)return;
 if(MIS.stage==='pickup'){if(!peds.includes(f.p)||f.p.state==='dead'){toast('O PASSAGEIRO SUMIU');taxiNewFare();return}
  const d=Math.hypot(c.x-f.p.x,c.z-f.p.z);f.p.mx=c.x-f.p.x;f.p.mz=c.z-f.p.z;
  if(d<9&&Math.abs(c.fwd)<2.2){f.p.state='board';f.p.fixed=true;MIS.stage='boarding'}}
 else if(MIS.stage==='boarding'){const p=f.p;if(!peds.includes(p)){MIS.stage='pickup';return}const dx=c.x-p.x,dz=c.z-p.z,d=Math.hypot(dx,dz);
  if(Math.abs(c.fwd)>3){p.state='fare';MIS.stage='pickup';toast('PARE PARA O PASSAGEIRO ENTRAR');return}
  if(d<c.t.R+.5){removePed(p);f.p=null;const ds=sidewalkPoint(300,950)||sidewalkPoint(150,600);if(!ds){misEnd('SEM DESTINO');return}
   MIS.dest=ds;f.dist=Math.hypot(ds.x-c.x,ds.z-c.z);MIS.t=Math.round(f.dist/8.5+28);MIS.stage='ride';misGPS(ds.x,ds.z);clang(.2);toast('PASSAGEIRO A BORDO<br><small style="font-size:11px;color:#fff">siga o GPS · '+Math.round(f.dist)+' m · bônus se chegar rápido</small>')}
  else{p.vx=dx/d*3;p.vz=dz/d*3;p.x+=p.vx*dt;p.z+=p.vz*dt;p.mx=dx;p.mz=dz}}
 else if(MIS.stage==='ride'){MIS.t-=dt;const d=Math.hypot(c.x-MIS.dest.x,c.z-MIS.dest.z);if(NAV.misMarker&&!NAV.marker)misGPS(MIS.dest.x,MIS.dest.z);
  if(d<12&&Math.abs(c.fwd)<2.5){const base=Math.round(15+f.dist/10),bonus=MIS.t>0?Math.round(base*.5*Math.min(1,MIS.t/30)+5):0,pay=CHEAT.used?0:base+bonus;
   if(pay){MIS.earned+=pay;money(pay,'CORRIDA CONCLUÍDA · +$'+pay+(bonus?'<br><small style="font-size:11px;color:#fff">gorjeta por rapidez: $'+bonus+'</small>':''))}
   else toast('CORRIDA CONCLUÍDA · SEM PAGAMENTO<br><small>Cheat usado nesta partida</small>');
   const sp=spawnPed({x:c.x,z:c.z,min:0,max:1});sp.strip=null;const sd=Math.cos(c.a),cd=Math.sin(c.a);sp.x=c.x-cd*(c.t.W/2+.9);sp.z=c.z+sd*(c.t.W/2+.9);sp.ri=rectNear(sp.x,sp.z);sp.r=perim(sp.ri);sp.t=perimNearest(sp.r,sp.x,sp.z);
   MIS.fare=null;MIS.dest=null;NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;setTimeout(()=>{if(MIS.type==='taxi')taxiNewFare()},2500);MIS.stage='wait'}}
 if(c.hp<25&&MIS.stage==='ride'){misEnd('O PASSAGEIRO DESCEU ASSUSTADO')}}
/* --- vigilante --- */
const COPLV=[['moto'],['sedan'],['sports','sedan'],['sports','pickup','sedan'],['sports','sports','suv','pickup']];
function spawnCrim(type){const pc=PL.car||PL;for(let k=0;k<80;k++){const a=Math.random()*6.283,dd=130+Math.random()*120,kx=clamp(Math.round((pc.x+Math.cos(a)*dd)/P),0,city.N),kz=clamp(Math.round((pc.z+Math.sin(a)*dd)/P),0,city.N),d=Math.floor(Math.random()*4);
  if(!canDrive(kx,kz,d))continue;const li=laneValid(kx,kz,d,0)?0:1;const p=lanePt(kx,kz,d,li,P/2);if(inWater(p[0],p[1])||carsNear(p[0],p[1],6).length)continue;
  const c=makeVehicle(type,p[0],p[1],Math.atan2(D[d][1],D[d][0]),pick2(['#c82020','#202020','#e8e8e8','#2a2a6a','#d8a020']));c.ai={kx,kz,d,li,nd:null,vmax:20+Math.random()*5,stun:0,blockT:0,ignore:0};c.crim=true;c.hp=100;c.sleep=false;c.vx=Math.cos(c.a)*8;c.vz=Math.sin(c.a)*8;return c}return null}
function copNextLevel(){if(MIS.level>=1&&!CHEAT.used){MIS.earned+=150;money(150,'NÍVEL '+MIS.level+' CONCLUÍDO · +$150')}MIS.level++;if(MIS.level>5){const pay=CHEAT.used?0:MIS.earned;misEnd(pay?'VIGILANTE COMPLETO! · TOTAL +$'+pay:'VIGILANTE COMPLETO! · SEM PAGAMENTO · CHEAT USADO');return}
 MIS.crims=[];for(const t of COPLV[MIS.level-1]){const c=spawnCrim(t);if(c)MIS.crims.push(c)}MIS.t=90+MIS.level*25;
 toast('NÍVEL '+MIS.level+'/5<br><small style="font-size:11px;color:#fff">'+MIS.crims.length+' suspeito'+(MIS.crims.length>1?'s':'')+' · setas vermelhas</small>');horn(.2)}
function copUpdate(dt){MIS.t-=dt;if(MIS.t<=0){misEnd('OS SUSPEITOS FUGIRAM');return}
 for(const c of MIS.crims.slice()){if(!vehicles.includes(c)){MIS.crims.splice(MIS.crims.indexOf(c),1);continue}
  if(!c.alive||c.hp<=40||c.sunk){MIS.crims.splice(MIS.crims.indexOf(c),1);c.crim=false;if(c.alive){c.ai=null;c.thr=0;c.hand=true;c.sleep=false;for(let i=0;i<8;i++)emit(c.x,1.2,c.z,(Math.random()-.5)*2,2,(Math.random()-.5)*2,1.5,1,3,0x5a5a5a,false,.6)}
   toast('SUSPEITO PARADO'+(MIS.crims.length?'<br><small style="font-size:11px;color:#fff">faltam '+MIS.crims.length+'</small>':''));continue}
  if(c.ai)c.ai.ignore=Math.max(c.ai.ignore,1)}
 if(!MIS.crims.length){copNextLevel()}}
function misUpdate(dt){
 for(let i=0;i<MIS.arrows.length;i++)MIS.arrows[i].visible=false;
 if(!MIS.type){$('#mission').hidden=true;return}
 const c=MIS.type==='med'?MIS.amb:PL.car;if(!c||!c.alive||PL.dead||(MIS.type==='med'&&((PL.car&&PL.car!==c)||(!PL.car&&Math.hypot(PL.x-c.x,PL.z-c.z)>45)))||(MIS.type==='taxi'&&c.type!=='taxi')||(MIS.type==='cop'&&!c.police)){misEnd(PL.dead?'MISSÃO FRACASSADA':'VOCÊ SAIU DO VEÍCULO · MISSÃO ENCERRADA');$('#mission').hidden=true;return}
 if(MIS.type==='taxi')taxiUpdate(dt);else if(MIS.type==='med')medUpdate(dt);else copUpdate(dt);if(!MIS.type){$('#mission').hidden=true;return}
 // markers above targets
 const tg=MIS.type==='med'?(MIS.stage==='goto'&&MIS.fare?[[MIS.fare.x,MIS.fare.z,0xff3030]]:[]):MIS.type==='cop'?MIS.crims.map(c=>[c.x,c.z,0xff3030]):MIS.fare&&MIS.fare.p&&MIS.stage!=='ride'?[[MIS.fare.p.x,MIS.fare.p.z,0x3dff6e]]:[];
 tg.forEach(([x,z,col],i)=>{let a=MIS.arrows[i];if(!a){a=makeArrow();MIS.arrows.push(a)}a.visible=true;a.position.set(x,3.4+Math.sin(simT*4)*.25,z);a.rotation.y=simT*2.4;a.children.forEach(m=>m.material.color.setHex(col))});
 if(MIS.t>(MIS.tPrev??-1)+.5||MIS.tKey!==MIS.type+MIS.stage){MIS.tMax=Math.max(1,MIS.t);MIS.tKey=MIS.type+MIS.stage}MIS.tPrev=MIS.t;const mm=s=>tbHTML(Math.max(0,s)/MIS.tMax); // v78: tempo da missão em barra
 const el=$('#mission');el.hidden=false;
 el.innerHTML=MIS.type==='med'?('<b>PARAMÉDICO</b> · '+(MIS.stage==='goto'?(medNear()?'aperte E para socorrer':'vá até o ferido (vermelho)')+' · '+mm(MIS.t):MIS.stage==='deliver'?(PL.car===c?'leve ao hospital · '+Math.round(Math.hypot(c.x-MIS.dest.x,c.z-MIS.dest.z))+' m':'volte para a ambulância')+' · '+mm(MIS.t):'aguardando chamado…')+' · salvos '+(MIS.saved||0)+' · ganho $'+MIS.earned+' · T encerra'):MIS.type==='taxi'?('<b>TÁXI</b> · '+(MIS.stage==='pickup'?'busque o passageiro (verde)':MIS.stage==='boarding'?'passageiro entrando…':MIS.stage==='ride'?'leve ao destino · '+Math.round(Math.hypot(c.x-MIS.dest.x,c.z-MIS.dest.z))+' m · '+(MIS.t>0?'bônus '+mm(MIS.t):'sem bônus'):'procurando passageiro…')+' · ganho $'+MIS.earned+' · T encerra')
  :('<b>VIGILANTE '+MIS.level+'/5</b> · '+MIS.crims.length+' suspeito'+(MIS.crims.length!==1?'s':'')+' · '+mm(MIS.t)+' · T encerra');if(CHEAT.used)el.innerHTML+=' · RECOMPENSAS BLOQUEADAS (CHEAT)'}

/* ================= TUNING SHOP ================= */
function tunePay(price){
 if((PL.money||0)<price){toast('DINHEIRO INSUFICIENTE · $'+price);clang(.1);return false}
 if(price>0)money(-price);
 return true;
}
const TUNE={open:false,lock:false,car:null};const TUNE_COLS=['#d62828','#ff6a1a','#f2c21a','#7ad62a','#1e9a4a','#1ac8c8','#2a6ad6','#1a2a6a','#8a3ad6','#ff4fa3','#f4f4f0','#9aa0a8','#4a4e56','#141418','#8a5a2a','#c8a86a'];
{const sw=$('#tuneSw');for(const c of TUNE_COLS){const b=document.createElement('button');b.type='button';b.className='sw';b.style.background=c;b.setAttribute('aria-label','cor '+c);b.addEventListener('click',()=>tunePaint(c));sw.appendChild(b)}
 $('#tuneCol').addEventListener('change',e=>tunePaint(e.target.value));$('#tuneClose').addEventListener('click',()=>closeTune());$('#tuneRepair').addEventListener('click',()=>{const c=TUNE.car;if(!c||!c.alive)return;const price=Math.max(0,gasCosts(c).r);if(!price||!tunePay(price))return;repairCar(c);syncTune();clang(.3);toast('CARRO CONSERTADO · −$'+price)});
 const NEON_COLS=['#ff2ad4','#2ad6ff','#3dff6e','#ffd21a','#ff3b3b','#8a3aff','#ffffff','#ff7a1a'];{const ns=$('#tuneNeonSw');for(const c of NEON_COLS){const b=document.createElement('button');b.type='button';b.className='sw';b.style.background=c;b.style.boxShadow='0 0 10px '+c;b.setAttribute('aria-label','neon '+c);b.addEventListener('click',()=>tuneNeon(c));ns.appendChild(b)}}
 $('#tuneNeonCol').addEventListener('change',e=>tuneNeon(e.target.value));$('#tuneNeonOff').addEventListener('click',()=>{const c=TUNE.car;if(!c||!c.neon)return;c.neon=false;if(c.g){dropCarMesh(c);buildCarMesh(c)}syncTune();toast('NEON DESLIGADO')});
 $('#tunePlateEdit').addEventListener('click',()=>{const c=TUNE.car;if(!c||!c.alive)return;openTextInput({placeholder:'PLACA (ATÉ 7) + ENTER',max:7,value:normPlate(c.plate)||'',sanitize:v=>normPlate(v),submit:v=>{if(!TUNE.open||TUNE.car!==c)return;if(!v){toast('PLACA INVÁLIDA');return}if((normPlate(c.plate)||'')===v){syncTune();return}setCarPlate(c,v);syncTune();clang(.2);toast('PLACA ALTERADA · '+v)}})});
 $('#tuneTurbo').addEventListener('click',()=>{const c=TUNE.car;if(!c||!c.alive||c.turbo)return;if(!tunePay(1500))return;c.turbo=true;syncTune();clang(.3);toast('TURBO INSTALADO · −$1.500<br><small style="font-size:11px;color:#fff">velocidade final em dobro · cuidado nas curvas</small>')});
 $('#tuneNitro').addEventListener('click',()=>{const c=TUNE.car;if(!c||!c.alive||c.hasNitro||c.special)return;if(!tunePay(500))return;c.hasNitro=true;syncTune();clang(.3);toast('NITRO INSTALADO · −$500<br><small style="font-size:11px;color:#fff">segure SHIFT acelerando</small>')})}
function carNeonMesh(c,g){const ug=new THREE.Mesh(new THREE.PlaneGeometry(c.t.L+3.2,c.t.W+3.2),new THREE.MeshBasicMaterial({map:glowTex,color:COL(c.neonCol||'#ff2ad4'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:1}));ug.rotation.x=-Math.PI/2;ug.position.y=.07;ug.renderOrder=3;g.add(ug);
 /* Apenas glowTex aditivo: removida a caixa solida que aparecia sob a traseira. */}
function repairCar(c){c.hp=100;c.ovT=0;c.dmg=null;if(c.g){dropCarMesh(c);buildCarMesh(c)}}
function tuneNeon(hex){const c=TUNE.car;if(!c||!c.alive)return;if(c.neon&&(c.neonCol||'').toLowerCase()===hex.toLowerCase())return;const price=c.neon?50:300;if(!tunePay(price))return;c.neon=true;c.neonCol=hex;if(c.g){dropCarMesh(c);buildCarMesh(c)}syncTune();clang(.25);toast((price===300?'NEON INSTALADO':'COR DO NEON TROCADA')+' · −$'+price)}
function tunePaint(hex){const c=TUNE.car;if(!c||!c.alive)return;if(c.color.toLowerCase()===hex.toLowerCase())return;if(!tunePay(100)){$('#tuneCol').value=c.color;return}c.color=hex;c.icol=COL(hex);if(c.g){dropCarMesh(c);buildCarMesh(c)}$('#tuneCol').value=hex.length===7?hex:'#d62828';if(c===PL.car)wzDisguise()}
function syncTune(){const c=TUNE.car;const hp=c?Math.max(0,Math.round(c.hp)):0;$('#tuneRepair').disabled=!c||hp>=100;$('#tuneRepair').textContent=hp>=100?'LATARIA 100%':'CONSERTAR · $'+(c?Math.max(0,gasCosts(c).r):0)+' ('+hp+'% → 100%)';$('#tuneNitro').disabled=!c||!!(c.hasNitro||c.special);$('#tuneNitro').textContent=c&&(c.hasNitro||c.special)?'NITRO INSTALADO':'INSTALAR NITRO · $500';$('#tuneTurbo').disabled=!c||!!c.turbo;$('#tuneTurbo').textContent=c&&c.turbo?'TURBO INSTALADO':'INSTALAR TURBO · $1.500';$('#tuneNeonOff').disabled=!c||!c.neon;$('#tunePlateEdit').disabled=!c;$('#tunePlateCur').textContent=c?(normPlate(c.plate)||'SEMPLACA'):'—';if(c&&c.neonCol)$('#tuneNeonCol').value=c.neonCol;[...$('#tuneNeonSw').children].forEach((b,i)=>{const on=c&&c.neon&&(c.neonCol||'').toLowerCase()===NEON_COLS_UI[i];b.style.outline=on?'3px solid #fff':'none';b.style.outlineOffset='2px'})}
const NEON_COLS_UI=['#ff2ad4','#2ad6ff','#3dff6e','#ffd21a','#ff3b3b','#8a3aff','#ffffff','#ff7a1a'];
function openTune(c){TUNE.open=true;TUNE.car=c;TUNE.lock=true;c.vx=c.vz=0;c.w=0;c.thr=0;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();$('#tune').hidden=false;syncTune();$('#tuneClose').focus()}
function closeTune(){TUNE.open=false;$('#tune').hidden=true;toast('BOA VIAGEM!')}
function updateTune(){const sp=city.tuneSpot,c=PL.car;if(!sp||!c||c.t.boat){if(!c)TUNE.lock=false;return}const d=Math.hypot(c.x-sp.x,c.z-sp.z);if(d>7)TUNE.lock=false;if(!TUNE.lock&&d<3.2&&Math.abs(c.fwd)<2&&c.alive){if(storyOK('tune'))openTune(c);else{TUNE.lock=true;storyLocked('OFICINA FECHADA')}}}

