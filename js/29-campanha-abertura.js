'use strict';
/* Coastal Chaos · js/29-campanha-abertura.js — Campanha: abertura, tutorial, startGame.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= CAMPANHA: ABERTURA E TUTORIAL v144 =================
   A seed define SOMENTE a cidade. A manha da missao e o roteiro sao fixos.
   O loading e opaco, e a camera cinematografica so roda depois do warmup. */
function monStoryShiftSync(){
 const cut=!!(STORYINTRO.active||STORYEND.active),g=$('#storyGuide'),mon=$('#mon'),on=!!(g&&!g.hidden&&played&&!cut);
 document.body.classList.toggle('story-guide-overlap',on);
 if(mon)mon.hidden=!MON.on||cut;
 if(on){const y=Math.max(70,Math.min(innerHeight-64,g.getBoundingClientRect().bottom+12));document.body.style.setProperty('--story-mon-top',Math.round(y)+'px')}
 else document.body.style.removeProperty('--story-mon-top');
}
addEventListener('resize',()=>{if(document.body.classList.contains('story-guide-overlap'))monStoryShiftSync()});
function storySkipSync(){const cut=!!(STORYINTRO.active||STORYEND.active);if(cut&&typeof cfgOpen!=='undefined'&&cfgOpen)closeCfg();document.body.classList.toggle('cutscene-paused',cut&&menuOpen);const s=$('#storySkip');if(s)s.hidden=!(cut&&menuOpen);}

const STORYINTRO={active:false,stage:'',t:0,guide:-1,guideT:0,guideEvent:null,guideHead:null,ready:false};
const STORY_GUIDES=[
 {title:'01 · PEGUE O VEÍCULO',desktop:'Aproxime-se do carro e pressione F para entrar.',mobile:'Aproxime-se do carro e toque em ENTRAR / SAIR.',pad:'Aproxime-se do carro e pressione Y / △ para entrar.',event:'enter'},
 {title:'02 · ACELERE',desktop:'Pressione W ou ↑ para acelerar.',mobile:'Segure o botão ACELERAR para acelerar.',pad:'Use RT / R2 para acelerar.',event:'accelerate'},
 {title:'03 · DIREÇÃO',desktop:'Vire usando A / D ou ← / →.',mobile:'Vire movendo o analógico para os lados.',pad:'Vire com o analógico esquerdo.',event:'steer'},
 {title:'04 · FARÓIS',desktop:'Pressione H para ligar ou desligar os faróis.',mobile:'Faróis: H no teclado ou direcional → no controle conectado.',pad:'Pressione direcional → para ligar ou desligar os faróis.',event:'lights'},
 {title:'05 · RÁDIO',desktop:'Pressione Q para escolher uma rádio.',mobile:'Toque em RÁDIO para ligar/desligar.',pad:'Segure direcional ← para escolher a rádio.',event:'radio'},
 {title:'PERSONAGENS LIBERADOS',desktop:'Você pode alternar com a Claire agora.',mobile:'Você pode alternar com a Claire agora.',pad:'Você pode alternar com a Claire agora.',event:'switch'}
];
function storyConditions(){
 S.hour=7;DN.tod=420;DN.day=0;DN.t=0;
 CELLS.length=0;WX.f=0;WX.cover=0;WX.gloom=0;WX.wet=false;WX.rainPhase=0;WX.pre=0;WX.storm=0;WX.stormAmt=0;
 WX.stormCell=null;WX.stormEta=null;WX.calm=null;WX.postClear=null;WX.stormNext=null;WX.stormReq=false;WX.cheatStorm=false;
 WX.chance=.18;WX.stormChance=.08;WX.stormRoll=1000;WX.cellT=240;WX.freeze=false;WX.lastOpt=S.rain;
 try{updateDayNight(0,true);updateWeather(0)}catch(e){console.warn('Abertura: clima',e)}
}
function storyTutorialShow(i){
 STORYINTRO.guide=i;STORYINTRO.guideT=0;STORYINTRO.guideEvent=null;STORYINTRO.guideHead=i===4?RADIO.userOff:HEAD.mode;
 const el=$('#storyGuide'),g=STORY_GUIDES[i];if(!g){el.hidden=true;monStoryShiftSync();return}
 el.innerHTML='<b>'+g.title+'</b>'+(PAD.on?g.pad:TOUCH.on?g.mobile:g.desktop);el.hidden=false;monStoryShiftSync();
}
function storyTutorialAction(event){if(STORYINTRO.guide<0)return;if(STORY_GUIDES[STORYINTRO.guide]?.event===event)STORYINTRO.guideEvent=event}
function storyTutorialTick(dt){const i=STORYINTRO.guide;if(i<0||menuOpen||!played)return;
 STORYINTRO.guideT+=dt;
 if(i===0&&PL.car)storyTutorialAction('enter');
 if(i===1&&PL.car&&(Math.abs(PL.car.fwd)>2||(keys.KeyW||keys.ArrowUp||PAD.r2>.4)))storyTutorialAction('accelerate');
 if(i===2&&PL.car&&(Math.abs(PL.car.steerT)>0.18||keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight||Math.abs(TOUCH.x)>.24))storyTutorialAction('steer');
 if(i===3&&HEAD.mode!==STORYINTRO.guideHead)storyTutorialAction('lights');
 if(i===4&&(WHL.open==='radio'||(TOUCH.on&&RADIO.userOff!==STORYINTRO.guideHead)))storyTutorialAction('radio');
 if(i===5&&CHAR.cur===1)storyTutorialAction('switch');
 if(STORYINTRO.guideEvent||STORYINTRO.guideT>=30)storyTutorialShow(i+1);
}
function storyAirportSpawn(){
 if(storyOn())STORY.map.add('airport');
 const A=city.air;if(!A)return;
 const r=city.rects[A.ri],c=city.startCar;
 // Quina externa, na calcada ao lado da via; evita interior do terminal, pista e hangar.
 const opts=[
  {px:r[0]+9,pz:r[1]-1.4,cx:r[0]+5,cz:r[1]-3.9,a:0},
  {px:r[2]-9,pz:r[3]+1.4,cx:r[2]-5,cz:r[3]+3.9,a:Math.PI},
  {px:r[0]-1.4,pz:r[3]-9,cx:r[0]-3.9,cz:r[3]-5,a:Math.PI/2},
  {px:r[2]+1.4,pz:r[1]+9,cx:r[2]+3.9,cz:r[1]+5,a:-Math.PI/2}
 ];
 const loc=opts.find(q=>q.px>1&&q.pz>1&&q.px<city.ext-1&&q.pz<city.ext-1&&!inWater(q.px,q.pz)&&!inWater(q.cx,q.cz)&&!riverZone(q.px,q.pz)&&!riverZone(q.cx,q.cz))||opts[0];
 if(c){c.x=loc.cx;c.z=loc.cz;c.a=loc.a;c.vx=c.vz=c.fwd=c.w=0;c.hand=true;c.sleep=false;c.hp=100;c.alive=true;if(c.mode==='rail')toPhys(c);ensureDetail(c);syncCar(c,0)}
 PL.car=null;PL.x=loc.px;PL.z=loc.pz;PL.gy=groundY(PL.x,PL.z);PL.vx=PL.vz=0;PL.yaw=0;PL.dead=false;PL.sp.visible=true;PL.sh.visible=true;camT.x=PL.x;camT.z=PL.z;
 STORY.fresh=false;setView('fps',true);
 // The opening dialogue pauses updatePlayer: place the render objects now.
 PL.jy=PL.jv=0;PL.rot=0;PL.face=[0,1];PL.mx=0;PL.mz=1;
 setFrame(PL.tex,pickDir(0,1,PL.x,PL.z),0);placeSprite(PL);
 chasePos.set(PL.x,PL.gy+2.4,PL.z+3);LOOK.yaw=0;LOOK.pitch=0;updateCamera(0);
}
function storyIntroBegin(){
 if(!storyOn()||!city.air)return false;
 storyConditions();STORY.fresh=false;
 // Reutiliza a ENTIDADE e o ciclo fisico do aeroporto livre: base > final > rollout > taxiIn.
 airTick2(0);
 if(!AIRP.p)return false;
 const A=city.air,P=AIRP;
 if(!A.compact){
  const a=2.30,R=40/.17,side=airPreferredLandingSide(AIRP.landing,(S.seed&1)?1:-1),sTD=airLandingTouch(A.L),sT=-A.L/2-460;
  P.st='base';P.side=side;P.turned=a;P.v=40;P.vA=40;P.R=R;P.th=Math.PI+side*a;
  P.s=sT-R*Math.sin(a);P.l=A.rl+side*R*(1+Math.cos(a));P.y=airApproachHeight(P,AIRP.landing,'base')+2;
  P.vy=-3;P.roll=side*.25;P.pitch=-.04;P.t=0;P.next='land';
 }else{ // Protecao para sementes raras de pista compacta: o sistema existente faz sobrevoo.
  P.st='flyby';P.s=-A.L/2-145;P.l=A.rl;P.y=52;P.th=0;P.t=0;
 }
 STORYINTRO.active=true;STORYINTRO.stage='credit';STORYINTRO.t=0;STORYINTRO.guide=-1;STORYINTRO.ready=true;STORYINTRO.airStarted=false;STORYINTRO.taxiT=0;
 const skip=$('#storySkip');skip.textContent='PULAR';skip.setAttribute('aria-label','Pular trecho atual da abertura');storySkipSync();
 const black=$('#storyBlack');black.hidden=false;black.style.transition='none';black.style.opacity='1';
 const credit=$('#storyCredit');credit.innerHTML='Zoio Corporation Entertainment<small>presents</small>';credit.style.color='#fff';credit.style.opacity='0';$('#storyClock').style.opacity='0';$('#storyClock').textContent=translatePlain('Aeroporto Internacional de Sunset Shores · voo de Nassau, Bahamas · 7:00');
 // A trilha da cena do aviao ja comeca no letreiro ZOIO PRESENTS.
 // Usa a mesma radio (local ou fallback online), sem reiniciar ao revelar o aviao.
 sceneRadioStart('arrival');document.body.classList.add('story-cinematic');monStoryShiftSync();return true;
}
function storyIntroFinish(instant=false){
 if(!STORYINTRO.active)return;
 sceneRadioStop();
 // Ao pular a cena, nao deixar o aviao circulando baixo sobre a cidade enquanto o jogador aparece.
 if(AIRP.p&&AIRP.st!=='taxiIn'&&AIRP.st!=='wait'){
  AIRP.st='wait';AIRP.t=14;AIRP.next='to';AIRP.p.g.visible=false;AIRP.v=0;AIRP.vy=0;AIRP.spoilerLift=0;if(AIRP.p.spoilers)for(const h of AIRP.p.spoilers)h.rotation.z=0;
 }
 storyAirportSpawn();
 STORYINTRO.active=false;STORYINTRO.stage='';document.body.classList.remove('story-cinematic');
 storySkipSync();$('#storyCredit').style.opacity='0';
 const black=$('#storyBlack');
 if(instant){black.style.transition='none';black.style.opacity='0';black.hidden=true}
 else{black.style.transition='opacity .9s ease';black.style.opacity='0';setTimeout(()=>{if(!STORYINTRO.active&&!STORYEND.active)black.hidden=true},970)}
 $('#storyClock').style.opacity='0';
 prologueBegin();monStoryShiftSync();
}
function storyIntroSkipPart(){
 if(!STORYINTRO.active||menuOpen)return;
 if(STORYINTRO.stage==='credit'){
  const I=STORYINTRO,black=$('#storyBlack');I.stage='arrival';I.t=0;
  $('#storyCredit').style.opacity='0';black.style.transition='none';black.style.opacity='0';black.hidden=true;
  $('#storyClock').style.opacity='1';storyIntroTick(0);return;
 }
 // Se já está vendo o avião, vai direto à jogabilidade, sem fade intermediário.
 storyIntroFinish(true);
}
function storyIntroTick(dt){
 const I=STORYINTRO;if(!I.active)return;I.t+=dt;
 const t=I.t,black=$('#storyBlack'),credit=$('#storyCredit'),clock=$('#storyClock');
 if(I.stage==='credit'){
  credit.style.opacity=t<.7?String(t/.7):t<3.6?'1':String(Math.max(0,(4.5-t)/.9));
  if(t>=5){I.stage='arrival';I.t=0;credit.style.opacity='0';black.style.transition='opacity 1s ease';black.style.opacity='0';clock.style.opacity='1'}
  return;
 }
 if(I.stage==='arrival'){
  // Identica integracao do voo do modo Livre: curva, descida, flare, pouso e taxi.
  airTick2(dt);simT+=dt;
  const A=city.air,P=AIRP,G=P.p;if(!G){I.stage='blackout';I.t=0;sceneRadioFade(1.1);return}
  const pos=G.g.position,th=P.th,dx=A.ax?Math.cos(th):Math.sin(th),dz=A.ax?Math.sin(th):Math.cos(th),nx=-dz,nz=dx;
  // Camera cinematografica da chegada: distancia reduzida pela metade,
  // preservando o angulo original e o restante da cutscene.
  const off=19,lat=13;setLens(62,.5);camera.up.set(0,1,0);
  camera.position.set(pos.x-dx*off+nx*lat,pos.y+9,pos.z-dz*off+nz*lat);
  camera.lookAt(pos.x+dx*7,pos.y-1.5,pos.z+dz*7);sky.position.copy(camera.position);
  clock.style.opacity=I.t<7?'1':String(Math.max(0,1-(I.t-7)/1.5));
  if(P.st==='taxiIn')I.taxiT+=dt;
  if(((P.st==='taxiIn'||P.st==='wait')&&I.taxiT>=5.5&&(P.spoilerLift||0)<.015)||(A.compact&&I.t>12)||(I.t>100&&(P.spoilerLift||0)<.015)){I.stage='blackout';I.t=0;sceneRadioFade(1.1);black.hidden=false;void black.offsetWidth;black.style.transition='opacity .9s ease';black.style.opacity='1'}
  return;
 }
 if(I.stage==='blackout'){airTick2(dt);simT+=dt;if(t>=1.15)storyIntroFinish();}
}
/* New campaign prologue. Gameplay uses the existing dealer, jail, checkpoint,
   mall/phone, dialogue, character switch and end-credit systems. */
const PROLOGUE={active:false,cut:null,stage:'',t:0,wait:0,car:null,mate:null,allowJail:false,after:null,shot:null};
// Secret keyboard-only debugging shortcut. Deliberately absent from cheat lists/gamepad mappings.
// v77 · Ctrl+Shift+F10 (depuração): conclui a missão ativa inteira, com o mesmo fim do roteiro, e cai no jogo
// livre já com os desbloqueios dela. Com várias missões, pula só a atual. Ctrl+Shift+F9 continua pulando um trecho.
function missionSkipActive(){
 if(!played||TIMEJUMP.busy)return;if(menuOpen)closeMenu();
 const intro=STORYINTRO.active;if(intro)storyIntroFinish(true);
 const m=missionActive();
 if(!m){if(STORYEND.active){for(let i=0;i<4&&STORYEND.active;i++)storyFinalSkipPart()}else if(!intro)toast('NENHUMA MISSÃO ATIVA');return}
 CHEAT.used=true;syncSave();transitionAudioStop();
 try{m.script.complete()}catch(e){console.error('[missão] pular',e)}
 for(let i=0;i<4&&STORYEND.active;i++)storyFinalSkipPart();
 toast('<span style="color:#ffcc33">MISSÃO PULADA</span><br><small style="font-size:11px;color:#fff">'+m.title+'</small>')}
// Leva o prólogo ao estado final de qualquer estágio (fecha diálogos/lojas, sai da cadeia/shopping, volta para Nathan
// com o conversível) e executa o mesmo encerramento da cena final.
function prologueCompleteNow(){const I=PROLOGUE;if(!I.active)return;
 for(let i=0;i<12&&DLG.on;i++)dlgClose(0);
 if(DEAL.open)dealClose();if(TECH.open)closeTech();if(PHONE.open)prologueClosePhone();
 SWITCH.on=false;CAMHOP.on=false;I.cut=null;I.after=null;
 const b=$('#storyBlack');b.hidden=true;b.style.opacity='0';const title=$('#prologueTitle');title.hidden=true;title.style.opacity='0';
 if(PL.inside==='jail'){try{jailEscape()}catch(e){}}if(PL.inside==='mall'){try{exitMall()}catch(e){}}if(PL.inside==='motel'){try{motelExit()}catch(e){}}PL.inside=false;roomStageSync();
 charUnstashCar(I.car);if(!I.car||!vehicles.includes(I.car)||!I.car.alive){const h=city.safe,c=makeVehicle('conv',h.x+h.nx*6,h.z+h.nz*6,0);c.keep=true;c.hand=true;I.car=c}
 if(CHAR.cur!==0){const st=CHAR.list[0].st||{look:CHAR.list[0].look};CHAR.list[1].look={...PLAYER_PAL};CHAR.list[1].st=charLeave();charEnter(0,{...st,car:null,heli:null},[I.car.x,I.car.z])}
 PHONE.models[1]=PHONE.models[1]||'ios';
 document.body.classList.remove('story-cinematic');
 prologuePlaceHome();prologueHomeEnd()}
// v77: atalho de teste (Ctrl+Shift+F8): teleporta em ciclo para a entrada do motel, a porta do quarto 6 e o posto anos 70.
function devTour(){if(!played||PL.inside||PL.dead||PROLOGUE.cut)return;const pts=[];const M=city.motel;
 if(M){if(M.entry)pts.push({n:'MOTEL MIRAGEM · ENTRADA',x:M.entry[0],z:M.entry[1]});pts.push({n:'MOTEL · QUARTO 6 (entrando)',x:M.x,z:M.z})}
 else if(city.motelRi!=null){const r=city.rects[city.motelRi];pts.push({n:'MOTEL MIRAGEM',x:(r[0]+r[2])/2,z:r[3]+2})}
 for(const st of GAS.list.values())if(st.retro&&st.out){pts.push({n:'POSTO ANOS 70',x:st.out.x+st.nrm[0]*14,z:st.out.z+st.nrm[1]*14});break}
 if(!st70()){const l=(city.lms||[]).find(l=>l.name==='gas'&&!city.info[l.ri]?.dealgas);if(l)pts.push({n:'POSTO ANOS 70',x:l.x,z:l.z})}
 if(AMMO.pos&&AMMO.pos.tire)pts.push({n:'BORRACHARIA · AMOnições',x:AMMO.pos.out.x+AMMO.pos.nrm[0]*4,z:AMMO.pos.out.z+AMMO.pos.nrm[1]*4});
 if(!pts.length)return;DEVT.i=(DEVT.i+1)%pts.length;const p=pts[DEVT.i];
 if(PL.car){const c=PL.car;PL.car=null;c.hand=true;c.vx=c.vz=c.fwd=0;PL.sp.visible=true;PL.sh.visible=true}
 PL.x=p.x;PL.z=p.z;PL.vx=PL.vz=0;PL.gy=groundY(p.x,p.z);camT.x=p.x;camT.z=p.z;try{updateCamera(0,true)}catch(e){}toast('TESTE · '+p.n+'<br><small style="font-size:11px;color:#fff">Ctrl+Shift+F8 vai para o próximo ponto</small>')}
function st70(){for(const st of GAS.list.values())if(st.retro)return true;return false}
const DEVT={i:-1};
function missionDebugSkip(){
 if(!played||menuOpen||cfgOpen||cmdsOpen||TIMEJUMP.busy||STORYFAIL.active)return;
 if(typeof CAMP!=='undefined'&&storyOn()&&!PROLOGUE.active&&!STORYINTRO.active&&!STORYEND.active&&STORY.done.has('pier')){CHEAT.used=true;syncSave();campDebugNext();return}
 if(!PROLOGUE.active&&!STORYINTRO.active&&!STORYEND.active)return;
 if(!MCP.ff){CHEAT.used=true;syncSave()}transitionAudioStop();
 if(STORYINTRO.active){storyIntroFinish(true);return}
 if(STORYEND.active){storySkipPart();return}
 const I=PROLOGUE;
 if(I.cut==='switch'){prologueCutTick(10);return}
 if(I.cut==='iswitch'){prologueCutTick(1);prologueCutTick(10);return}
 if(I.cut==='fade'){prologueCutTick(3);return}
 if(I.cut==='inspection'){const c=I.car;if(I.blitz)I.blitz.phase='done';I.t=11;prologueCutTick(0);return}
 if(I.cut==='beach'){I.t=PROLOGUE_CINE.end+.1;prologueCutTick(0);return}
 if(I.cut==='doorWalk'){I.t=2.4;prologueCutTick(0);return}
 if(I.cut==='motelTalk'){if(DLG.on)dlgClose(0);return}
 if(I.cut==='card'){I.card.t=Math.max(I.card.t,3.39);prologueCutTick(.02);return}
 if(I.cut==='motelDoor'){if(I.t<2.7){I.t=2.7;prologueCutTick(0)}I.t=11.7;prologueCutTick(0);return}
 // End dialogue without suppressing its existing continuation callbacks.
 if(DLG.on){dlgClose(0);return}
 // v77: F9 com a loja aberta COMPRA (antes fechava e reabria a loja para sempre)
 const dealSkip=()=>{DEAL.i=Math.max(0,DEAL.list.indexOf(MCP.ff&&MCP.snap&&MCP.snap.car&&DEAL.list.includes(MCP.snap.car)?MCP.snap.car:'conv'));PL.money=Math.max(PL.money||0,(DEAL_PRICES.conv||0)+500);dealBuy();if(DEAL.open)dealClose()};
 if(DEAL.open&&I.stage==='dealer'){dealSkip();return}
 if(TECH.open&&I.stage==='phoneBuy'){PHONE.models[1]=PHONE.models[1]||'ios';closeTech();prologuePhoneBought();return}
 if(DEAL.open)dealClose();if(TECH.open)closeTech();if(PHONE.open)prologueClosePhone();if(AMMO.uiOpen)ammoClose();
 switch(I.stage){
  case 'smsDrive':I.smsT=99;prologueSmsTick(0);break;
  case 'smsRead':PHONE.open=true;prologueSmsTick(0);break;
  case 'dealer':{const d=nearestDealRef(PL);if(!d)return;
   prologueFade(()=>{PL.x=d.sx;PL.z=d.sz;PL.gy=groundY(PL.x,PL.z);PL.vx=PL.vz=PL.jy=PL.jv=0;
    placeSprite(PL);camT.x=PL.x;camT.z=PL.z;roomStageSync();dealTick(0);updateCamera(0,true);},()=>{dealOpen();if(DEAL.open)dealSkip()});break;}
  case 'driveFirst':prologueJail();break;
  case 'prison':case 'escape':prologueFade(()=>{if(PL.inside==='jail')jailEscape();roomStageSync();prologueStage('steal');});break;
  case 'steal':case 'driveMall':prologueLoot();prologueFade(()=>{if(PL.car){const c=PL.car;PL.car=null;c.hand=true;PL.sp.visible=true;PL.sh.visible=true}const o=MALL.out;if(o){PL.x=o.x;PL.z=o.z}enterMall();roomStageSync()},()=>prologueMallInside());break;
  case 'phoneBuy':PHONE.models[1]=PHONE.models[1]||'ios';prologuePhoneBought();break;
  case 'sms':prologueCall();break;
  case 'ammo':prologueFade(()=>{if(!Object.keys(GUN.inv).length)gunGive('pistol',24);I.gun=true;},()=>prologueTick(0));break;
  case 'motelDrive':case 'motelGo':{const d=motelDoor();const T=prologueMotelTarget();if(!d&&T){prologueFade(()=>{if(PL.car){PL.car.x=T.x;PL.car.z=T.z;syncCar(PL.car,0)}PL.x=T.x;PL.z=T.z;camT.x=T.x;camT.z=T.z;updateCamera(0,true)});break}
   if(!Object.keys(GUN.inv).length)gunGive('pistol',24);
   prologueFade(()=>{if(PL.car){const c=PL.car;PL.car=null;c.hand=true;c.vx=c.vz=c.fwd=0;PL.sp.visible=true;PL.sh.visible=true}PL.x=d.x+d.nx*2;PL.z=d.z+d.nz*2;camT.x=PL.x;camT.z=PL.z;updateCamera(0,true)},()=>prologueMotelDoor());break}

 }
}
function prologueLocked(){return PROLOGUE.active}
function prologueStage(stage,objective){try{mcpMark(stage)}catch(e){}if(objective===undefined){const st=MISSION_STAGES.pier.find(q=>q.id===stage);if(!st)console.warn('[missão] estágio desconhecido:',stage);objective=st&&st.objective||null}const sub=(MISSION_STAGES.pier.find(q=>q.id===stage)||{}).sub;PROLOGUE.stage=stage;PROLOGUE.t=0;missionModeSync();if(objective){const el=$('#storyGuide');el.innerHTML='<b>UM NOVO COMEÇO</b>'+translatePlain(objective)+(sub?'<span style="display:block;margin-top:5px;font-size:.86em;opacity:.88">'+translatePlain(sub)+'</span>':'');el.hidden=false;monStoryShiftSync()}}
function prologueDialogue(name,lines,next,pal){dlgOpen({name,pal:pal||(name==='CLAIRE'?LUCIA_PAL:PLAYER_PAL),lines,onEnd:()=>{if(next)next()}})}
function prologueReset(){try{ostStop(0)}catch(e){}const title=$('#prologueTitle');if(title){title.hidden=true;title.style.opacity='0';}
 if(PROLOGUE.mate&&peds.includes(PROLOGUE.mate))removePed(PROLOGUE.mate);
 if(PROLOGUE.blitz&&BLITZ.on===PROLOGUE.blitz)blitzEnd();
 if(PROLOGUE.car){PROLOGUE.car.keep=false;PROLOGUE.car.hand=true;}
 try{SLOWFX.cine=false}catch(e){}
 for(const ch of CHAR.list)charUnstashCar(ch.st&&ch.st.car&&ch.st.car.ref);charUnstashCar(PROLOGUE.car);
 PROLOGUE.active=false;PROLOGUE.cut=null;PROLOGUE.stage='';PROLOGUE.mate=null;PROLOGUE.car=null;PROLOGUE.allowJail=false;PROLOGUE.after=null;CAMHOP.on=false;SWITCH.on=false;
 document.body.classList.remove('prologue-active','story-cinematic');
 $('#storyClock').style.opacity='0';
 for(const c of CHAR.list)if(c.jailLook){c.look={...c.jailLook};if(c===CHAR.list[CHAR.cur]){Object.assign(PLAYER_PAL,c.jailLook);applyPlayerLook()}delete c.jailLook}
 PROLOGUE.blitz=null;
}
function prologueBegin(){
 if(!MCP.keep&&!MCP.ff){MCP.stage=null;MCP.snap=null}
 prologueReset();if(!storyOn()||STORY.cleared)return;
 PROLOGUE.active=true;PROLOGUE.loot=false;document.body.classList.add('prologue-active');STORYINTRO.guide=-1;
 QUEST.pier.state='prologue';QUEST.pier.reward=0;
 for(const f of ['deal','mall','safe'])STORY.unl.add(f);
 STORY.map.clear();STORY.map.add('airport');STORY.map.add('deal');STORY.map.add('gas');
 PL.money=Math.max(PL.money||0,7500);CHAR.list[1].cash=0;PHONE.models[1]=null; /* v78: Claire sai da cela sem um tostão — a grana vem da mochila do carro roubado */
 prologueStage('dealer');
 const d=nearestDealRef(PL);if(d)misGPS(d.sx,d.sz);
 prologueDialogue('NATHAN',['Bahamas… semanas de festa, praia e rum. Fugi o quanto deu, e nem assim tirei a Claire da cabeça…','De volta a Sunset Shores. Nada de vida nova: é a mesma cidade, a mesma casa… só que vazia.','Ela tá presa por minha culpa. Fui eu que arrastei ela praquele serviço.','Vou passar na concessionária. Um conversível não enche o vazio, mas pelo menos me tira de casa e ajuda a distrair a mente.']); // v78: volta à dura realidade, não recomeço
 charSelPaint();
}
function prologuePurchase(c){if(!PROLOGUE.active||PROLOGUE.stage!=='dealer')return;PROLOGUE.car=c;c.keep=true;PROLOGUE.wait=12+Math.random()*12;storyClearObjective();prologueStage('driveFirst');think(PL,'Poderia ter sido tudo diferente… *suspira*',7)}
// v77: cartela em TELA PRETA (como a abertura) para situar as trocas de personagem; não cobre os diálogos.
// mid() roda já no preto; after() roda ainda no preto e a tela clareia em seguida.
function prologueCard(title,sub,after,mid){prologueFreeze();const I=PROLOGUE;I.card={title,sub,after,mid,t:0,mid0:false};I.cut='card';I.t=0;document.body.classList.add('story-cinematic');
 const b=$('#storyBlack'),cr=$('#storyCredit');b.hidden=false;b.style.transition='none';b.style.opacity='0';cr.style.color='#fff';cr.innerHTML=translatePlain(title)+(sub?'<small>'+translatePlain(sub)+'</small>':'');cr.style.opacity='0'}
function prologueCardTick(dt){const I=PROLOGUE,C=I.card,b=$('#storyBlack'),cr=$('#storyCredit');C.t+=dt;const t=C.t;
 b.style.opacity=String(Math.min(1,t/.45));cr.style.transition='none';cr.style.opacity=String(t<.55?0:t<1.1?(t-.55)/.55:t<2.9?1:Math.max(0,1-(t-2.9)/.45));
 if(t>=.5&&!C.mid0){C.mid0=true;try{C.mid&&C.mid()}catch(e){console.error(e)}}
 if(t>=3.4){I.cut=null;I.card=null;cr.style.opacity='0';document.body.classList.remove('story-cinematic');try{C.after&&C.after()}catch(e){console.error(e)}
  requestAnimationFrame(()=>{b.style.transition='opacity .7s ease';b.style.opacity='0';setTimeout(()=>{if(b.style.opacity==='0'&&!PROLOGUE.card&&PROLOGUE.cut!=='fade')b.hidden=true},750)})}}
function prologueCaption(txt,secs){const el=$('#storyClock');el.textContent=translatePlain(txt);el.style.opacity='1';clearTimeout(PROLOGUE.capT);PROLOGUE.capT=setTimeout(()=>{el.style.opacity='0'},(secs||4.5)*1000)}
function prologueClosePhone(){PHONE.open=false;PHONE.callT=0;PHONE.num='';if(PHONE.el)PHONE.el.hidden=true;const close=$('#phoneTouchClose');if(close)close.hidden=true}
function transitionPromptClear(){
 for(const id of ['jailp','jailBailTag','ctxp','prompt','heistp','mallTag','pumpTag','tvp']){const e=$('#'+id);if(e){e.hidden=true;if(e.dataset)delete e.dataset.h}}
 CTX.mall=null;CTX.shop=false;CTX.club=false;CTX.car=false;CTX.st=null;
}
function prologueFreeze(){transitionPromptClear();for(const k in keys)keys[k]=false;TOUCH.x=TOUCH.y=0;CHAR.open=false;if(document.pointerLockElement)document.exitPointerLock();if(PL.car){PL.car.thr=0;PL.car.hand=true;PL.car.vx=PL.car.vz=PL.car.fwd=PL.car.w=0}if(PHONE.open)prologueClosePhone()}
// v77: na missão, quem não está sendo controlado SOME do mundo (sem sprite, sombra, ícone ou carro estacionado)
// mas continua na memória: o veículo sai de `vehicles` (e da malha/colisão) e volta intacto na próxima troca.
function charStashCar(st){const c=st&&st.car&&st.car.ref;if(!c||c.stashed||!vehicles.includes(c)||!c.alive)return;c.vx=c.vz=c.fwd=c.w=0;c.hand=true;c.keep=true;removeVehicle(c);c.stashed=true}
function charUnstashCar(c){if(c&&c.stashed){c.stashed=false;c.sleep=false;if(!vehicles.includes(c))vehicles.push(c)}return c}
// v78: troca longa no mesmo mundo — sem tela preta; só a legenda "Enquanto isso…" durante todo o voo (sem fade)
function prologueCapThen(cap,after){after();if(SWITCH.on)SWITCH.cap=cap}
function switchCapSync(){const e=$('#switchCap');if(!e)return;const on=!!(SWITCH.on&&SWITCH.cap);if(on&&e.dataset.t!==SWITCH.cap){e.textContent=translatePlain(SWITCH.cap);e.dataset.t=SWITCH.cap}if(e.hidden===on)e.hidden=!on}
function prologueSwitch(to,tgt,p,after){SWITCH.cap=null;
 prologueFreeze();STORYINTRO.guide=-1;$('#storyGuide').hidden=true;storyClearObjective();duoWorldClear();
 // v78: se um dos dois está num interior (prisão, shopping, casa…), nada de voo pelo céu mostrando o interior
 // carregando no vazio: câmera recua já escurecendo → "Enquanto isso…" → movimento inverso chegando no outro.
 const interior=!!(PL.inside||(tgt&&(tgt.prologueJail||tgt.safe)));
 CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};const lv=CHAR.list[CHAR.cur].st=charLeave(),src=lv.car||lv.heli||lv;charStashCar(lv);
 if(interior){PL.inside=false;DOOR.from=null;transitionPromptClear();transitionAudioStop();
  PROLOGUE.isw={t:0,to,tgt,p,applied:false,pos0:camera.position.clone(),q0:camera.quaternion.clone(),pos1:null,q1:null,card:tgt&&tgt.card||null};
  const b=$('#storyBlack'),cr=$('#storyCredit');b.hidden=false;b.style.transition='none';b.style.opacity='0';cr.style.transition='none';cr.style.opacity='0';cr.style.color='#fff';
  cr.innerHTML=translatePlain('Enquanto isso…')+(tgt&&tgt.card?'<small>'+translatePlain(tgt.card.title)+(tgt.card.sub?' · '+translatePlain(tgt.card.sub):'')+'</small>':'');
  PROLOGUE.cut='iswitch';PROLOGUE.after=after;document.body.classList.add('story-cinematic');return}
 PL.inside=false;DOOR.from=null;transitionPromptClear();transitionAudioStop();
 // v77: o voo parte de onde o personagem ESTÁ (carro incluído); camT só anda na câmera de topo e guardava a concessionária
 SWITCH.on=true;SWITCH.t=0;SWITCH.to=to;SWITCH.tgt=tgt;SWITCH.done=false;SWITCH.a=[src.x,src.z];SWITCH.b=p;
 SWITCH.h0=Math.max(25,camera.position.y);SWITCH.H=clamp(STYLES[S.style].fogFar*.55,90,300);
 SWITCH.srcPos=camera.position.clone();SWITCH.srcQuat=camera.quaternion.clone();SWITCH.srcNadir=camNadirPitch(SWITCH.srcQuat);switchCameraPrepare();
 PROLOGUE.cut='switch';PROLOGUE.after=after;document.body.classList.add('story-cinematic');
}
function prologueJail(){
 STORY.map.add('police');
 if(!JAIL.IN)buildJail();const p=[JAIL.IN.x,JAIL.IN.z-1.3];
 prologueStage('prison');(()=>prologueSwitch(1,{prologueJail:true,look:CHAR.list[1].look,card:{title:'PENITENCIÁRIA DE SUNSET SHORES',sub:'Claire · ano 3 de 10'}},p,()=>{
  ostPlay('cell','suspense',2.5);
  JAIL.left=300;JAIL.held=0;JAIL.spoon=true;JAIL.mateSaid=true;jailMateSync();
  prologueStage('escape');
  prologueDialogue('COLEGA DE CELA',['Aê Claire… hoje é teu dia de sorte, consegui uma coisa pra você.'],()=>{
   prologueDialogue('CLAIRE',['Uma colher?! Você é incrível!','Três anos contando azulejos acabam aqui. É hoje que eu saio dessa prisão.'],()=>{JAIL.spoon=true;JAIL.gHide=8;ostStop(3.5,'cell')},CHAR.list[1].look);
  },JAIL.mate?.pal||{...CLERK_PAL,cap:null,shirt:'#e87a1a',pants:'#e87a1a'});
 }))();
}
function prologueRearrest(){const I=PROLOGUE;if(I.rearrest)return;I.rearrest=true;storyClearObjective();try{NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false}catch(e){}
 prologueFade(()=>{if(PL.car){const c=PL.car;c.thr=0;c.hand=true;PL.lastCar=c;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}
  if(PL.inside==='jail'){PL.inside=false;DOOR.from=null}if(POL.wanted)try{endWanted(true,true)}catch(e){}
  I.allowJail=true;try{jailEnter(true)}finally{I.allowJail=false}
  JAIL.left=300;JAIL.held=0;JAIL.spoon=true;JAIL.mateSaid=true;JAIL.gHide=8;try{jailMateSync()}catch(e){}prologueStage('escape');roomStageSync();ostPlay('cell','suspense',2.5)},
  ()=>{I.rearrest=false;toast('<span style="color:#ff4a4a">RECONHECIDA · PRESA DE NOVO</span>');think(PL,'Que burrice… voltei direto pra boca do lobo. Parabéns, Claire.',5)})}
function prologueMotelTarget(){const M=city.motel;if(M)return{x:M.gps[0],z:M.gps[1]};const r=city.motelRi!=null&&city.rects[city.motelRi];return r?{x:(r[0]+r[2])/2,z:(r[1]+r[3])/2}:null}
function prologueBlitz(){
 const c=PL.car,T=prologueMotelTarget();if(!c||!T)return false;
 const u=.3+Math.random()*.4,mid={x:c.x+(T.x-c.x)*u,z:c.z+(T.z-c.z)*u}; /* v79r48: ponto sorteado no trajeto borracharia→motel (o motel agora pode estar longe, em qualquer lugar da roça) */
 if(!blitzMake('calm',mid))return false;
 const b=BLITZ.on;PROLOGUE.blitz=b;b.prologue=true;PROLOGUE.blitzDone=true;PROLOGUE.said=1;$('#storyGuide').hidden=true;
 prologueStage('blitz');
 prologueFade(()=>{c.x=b.x+b.ux*2.5-b.uz*2.8;c.z=b.z+b.uz*2.5+b.ux*2.8;c.a=Math.atan2(b.uz,b.ux);c.vx=c.vz=c.fwd=c.w=0;c.legal=true;c.hand=true;syncCar(c,0);PL.x=c.x;PL.z=c.z;camT.x=c.x;camT.z=c.z;trafficCalm(b.x,b.z,70,45);},()=>{
  c.hand=true;PROLOGUE.cut='inspection';PROLOGUE.t=0;document.body.classList.add('story-cinematic');
  toast('<span style="color:#ffac48">Se você estiver procurado, blitzes serão feitas para tentar te achar.</span>');
 });return true;
}
// v78: o carro roubado tinha uma mochila com dinheiro no banco de trás — é dela que sai o celular e o chip
function prologueLoot(){if(PROLOGUE.loot)return;PROLOGUE.loot=true;if((PL.money||0)<1000)money(1000-(PL.money||0),'<span style="color:#7dff8a">'+translatePlain('MOCHILA NO BANCO DE TRÁS')+'</span><br><small style="font-size:11px;color:#fff">+$1.000</small>');
 think(PL,'Uma mochila cheia de grana no banco de trás?! Dá pra um chip e um celular novo.',5.5)}
function prologueMallInside(){
 STORY.map.add('mall');prologueStage('phoneBuy');
 toast('<span style="color:#7dff8a">LOJA DE ELETRÔNICOS · 1º ANDAR</span><br><small style="font-size:11px;color:#fff">suba pela escada do átrio</small>');
 think(PL,'Nathan é um cara bom, mas aquilo quebrou minha confiança com ele…',6);
 if(!PHONE.models[1])PHONE.models[1]=null;
}
function prologuePhoneBought(){if(PROLOGUE.active&&PROLOGUE.stage==='phoneBuy'&&PHONE.models[1]){prologueStage('sms');think(PL,'Preciso falar com o Nathan.',4)}}
function prologueCall(){
 if(!PROLOGUE.active||PROLOGUE.stage!=='sms'||CHAR.cur!==1)return false;
 prologueClosePhone();if(TECH.open)closeTech();prologueStage('smsSend');
 phoneBusy();toast('<span style="color:#ff6b5a">'+translatePlain('OCUPADO')+'</span>');
 prologueDialogue('CLAIRE',['Ocupado… depois eu tento de novo.'],()=>{
  const st=CHAR.list[0].st||{},c=PROLOGUE.car,p=c?[c.x,c.z]:[st.x||PL.x,st.z||PL.z];
  prologueStage('smsSwitch');prologueCapThen('Enquanto isso…',()=>prologueSwitch(0,st,p,()=>{
   if(c){c.hand=false}
   /* r40: volta pro Nathan dirigindo; ~10 s ao volante e aí chega o SMS ("Leia o SMS"); abrir o celular dispara a mensagem e o monólogo */
   prologueStage('smsDrive');PROLOGUE.smsT=0;
  }),()=>{if(PL.inside==='mall')exitMall()});
 },CHAR.list[1].look);return true;
}
// v77: a porta do quarto 6 — câmera atrás de Nathan, arma em punho; corte para Claire na janela.
function prologueMotelDoor(){const d=motelDoor();if(!d)return;
 prologueFreeze();transitionAudioStop();motelRoomBuild();prologueStage('motelRoom');
 const w=Object.keys(GUN.inv).find(k=>GUN.inv[k]);if(w)gunSelect(w,true);
 PL.x=d.x+d.nx*.9;PL.z=d.z+d.nz*.9;PL.vx=PL.vz=0;PL.gy=groundY(PL.x,PL.z);PL.mx=-d.nx;PL.mz=-d.nz;
 if(MOTEL.arrOut)MOTEL.arrOut.visible=false;$('#storyGuide').hidden=true;monStoryShiftSync();PROLOGUE.door=d;PROLOGUE.said=0;PROLOGUE.slowTxt=0;PROLOGUE.cut='motelDoor';PROLOGUE.t=0;document.body.classList.add('story-cinematic');
}
function prologueMotelTalk(){
 SLOWFX.cine=false;STORY.unl.add('specN');toast('<span style="color:#5ab4ff">'+translatePlain('BULLET TIME LIBERADO')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('a pé e de arma na mão, aperte')+' '+specKey()+'</small>');
 prologueStage('motelTalk');const cl=CHAR.list[1].look;
 prologueDialogue('NATHAN',['Claire?! Você… fugiu?','Eu achei que era uma armadilha. Quase atirei em você!'],()=>{
  prologueDialogue('CLAIRE',['Desculpa…','Eu ainda não tô pronta pra conversar sobre aquilo, Nate. Nem pra confiar de novo.'],()=>{
   prologueDialogue('NATHAN',['Tudo bem. Sem pressão, sem perguntas hoje.','Que tal uma volta pela orla? Vento no rosto, o pôr do sol… depois a gente vai pra casa, pra ajudar a acalmar os nervos.'],()=>{
    prologueDialogue('CLAIRE',['…Tá. Uma volta. Só isso.'],()=>{PROLOGUE.cut=null;prologueFade(()=>{
     if(PL.inside==='motel')motelExit();gunHolster(true);
     let c=PROLOGUE.car;const d=motelDoor()||{x:PL.x,z:PL.z,nx:0,nz:1};
     charUnstashCar(c);if(!c||!vehicles.includes(c)||!c.alive){c=makeVehicle('conv',d.x+d.nx*6,d.z+d.nz*6,0);c.keep=true;PROLOGUE.car=c}
     prologueBeachBegin()})},cl);
   });
  },cl);
 });
}
function prologueFade(action,after){prologueFreeze();PROLOGUE.cut='fade';PROLOGUE.t=0;PROLOGUE.cutT=0;PROLOGUE.fadeAction=action;PROLOGUE.after=after;PROLOGUE.applied=false;document.body.classList.add('story-cinematic');const b=$('#storyBlack');b.hidden=false;b.style.transition='none';b.style.opacity='0'}
function prologueCoastShot(){
 // Find the longest uninterrupted dry coastal lane, even on river-heavy seeds.
 const sp=city.coastSpan||[0,city.ext];let best=null;
 for(const u of [-2.8,-5.2,-1]){let start=null;
  for(let t=Math.max(4,sp[0]);t<=Math.min(city.ext-4,sp[1])+1;t++){
   const p=wTU(city.coast,t,u),dry=t<=Math.min(city.ext-4,sp[1])&&!inWater(p[0],p[1])&&!riverZone(p[0],p[1]);
   if(dry&&start===null)start=t;
   if(!dry&&start!==null){const len=t-start-1;if(len>0&&(!best||len>best.len))best={t:start,len:Math.min(90,len),u};start=null;}
  }
 }return best;
}
function prologueReunion(){
 STORY.map.add('safe');
 prologueFreeze();transitionAudioStop();prologueStage('reunionWalk');const c=PL.car,h=city.safe;
 if(c){PL.x=c.x-Math.sin(c.a)*1.9;PL.z=c.z+Math.cos(c.a)*1.9;PL.lastCar=c;PL.car=null;$('#speed').hidden=true;$('#carbar').hidden=true;}
 PL.sp.visible=true;PL.sh.visible=true;PL.vx=PL.vz=0;
 PROLOGUE.walk={x:PL.x,z:PL.z,tx:h.x+h.nx*3+h.nz*1.3,tz:h.z+h.nz*3-h.nx*1.3};
 PROLOGUE.cut='doorWalk';PROLOGUE.t=0;document.body.classList.add('story-cinematic');
}
// v77: câmera cinematográfica da cena final, planejada UMA vez: testa azimutes/distâncias/alturas em volta do
// carro (preferindo ficar de costas para o sol, que fica atrás do casal) e escolhe a que tem linha de visão
// livre de prédios, árvores e muros ao longo de todo o percurso, incluindo a subida final.
const PROLOGUE_CINE={T:21,rise:9,logoIn:10,logoOut:15,end:20.6};
function prologuePathAt(sh,u){return sh.fallback?[sh.x+sh.ux*u,sh.z+sh.uz*u]:wTU(city.coast,sh.t+u,sh.u??-2.8)}
function cineBlocked(ax,ay,az,bx,by,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.max(4,Math.ceil(d/.6));
 for(let i=1;i<n-1;i++){const k=i/n,x=ax+(bx-ax)*k,y=ay+(by-ay)*k,z=az+(bz-az)*k;
  for(const c of query(x,z,.7)){if(c.dead||c.kind==='pole')continue;if(x<c.x0-.45||x>c.x1+.45||z<c.z0-.45||z>c.z1+.45)continue;
   const top=c.kind==='bld'?(c.top??roofTop(c)??30):c.kind==='tree'?8:(c.low??2.6);if(y<top+.4)return true}}
 return false}
// O pôr do sol do jogo fica sobre o mar: a câmera fica do lado da terra, olhando para o mar, com o carro na orla entre os dois.
function cineSeaH(sh){const o=sh&&sh.fallback?[-sh.uz,sh.ux]:city.coast===0?[0,-1]:city.coast===1?[0,1]:city.coast===2?[-1,0]:[1,0];return o}
function cineSunH(){const v=skyMat.uniforms.sunDir&&skyMat.uniforms.sunDir.value;let x=v?v.x:0,z=v?v.z:0;
 if(Math.hypot(x,z)<.05){const o=city.coast===0?[0,-1]:city.coast===1?[0,1]:city.coast===2?[-1,0]:[1,0];x=o[0];z=o[1]}const l=Math.hypot(x,z);return[x/l,z/l]}
function prologueCinePlan(sh){const L=PROLOGUE_CINE,s=cineSeaH(sh),base=Math.atan2(-s[1],-s[0]),car=t=>{const p=prologuePathAt(sh,sh.len*Math.min(t,L.T)/L.T);return{x:p[0],y:(groundY(p[0],p[1])||0)+1.1,z:p[1]}};
 let best=null;
 for(const da of [0,.26,-.26,.52,-.52,.79,-.79,1.05,-1.05,1.4,-1.4])for(const dist of [8.5,11.5,6.5])for(const h of [2.1,3.4,1.6]){
  const a=base+da,ox=Math.cos(a)*dist,oz=Math.sin(a)*dist;let bad=0;
  for(let t=0;t<=L.rise;t+=1){const p=car(t),cx=p.x+ox,cz=p.z+oz,cy=(groundY(cx,cz)||0)+h;if(inWater(cx,cz)&&cy<1)bad+=3;const b=bldAt(cx,cz,.6);if(b&&(roofTop(b)||0)>cy-.5)bad+=5;if(cineBlocked(cx,cy,cz,p.x,p.y,p.z))bad+=t<2?3:2}
  const a0=car(L.rise),ax=a0.x+ox,az=a0.z+oz,ay=(groundY(ax,az)||0)+h+L.rise;
  for(let t=L.rise+1;t<=L.end;t+=1){const p=car(t);if(cineBlocked(ax-s[0]*3,ay,az-s[1]*3,p.x,p.y,p.z))bad+=1}
  const score=bad*10+Math.abs(da)*2+Math.abs(dist-8.5)*.15+Math.abs(h-2.1)*.3;if(!best||score<best.score)best={score,bad,da,dist,ox,oz,h,s}}
 return best}
function prologueCine(dt,c,sh){const I=PROLOGUE,L=PROLOGUE_CINE;if(!I.cine)I.cine=prologueCinePlan(sh);const P=I.cine,t=I.t,s=P.s,f={x:c.x,y:(c.gy||0)+1.1,z:c.z};
 camera.up.set(0,1,0);setLens(46,.3);const ss=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
 if(t<L.rise){const push=1.08-.12*ss(t/L.rise),drift=Math.sin(t*.35)*.35;
  camera.position.set(f.x+P.ox*push-s[1]*drift,(groundY(f.x+P.ox,f.z+P.oz)||0)+P.h+Math.sin(t*.5)*.08,f.z+P.oz*push+s[0]*drift);
  camera.lookAt(f.x+s[0]*1.6,f.y+.25,f.z+s[1]*1.6);P.anchor=null}
 else{if(!P.anchor)P.anchor=camera.position.clone();const k=ss((t-L.rise)/7),A=P.anchor;
  camera.position.set(A.x-s[0]*3*k,A.y+L.rise*k,A.z-s[1]*3*k);
  // olha para o carro e, ao subir, abre para o horizonte do pôr do sol; no fim volta a mirar o carro ao longe
  const hz={x:A.x+s[0]*160,y:A.y+14,z:A.z+s[1]*160},back=ss((t-(L.logoOut+.6))/3),w=.62*k*(1-back*.85);
  camera.lookAt(f.x+(hz.x-f.x)*w,f.y+(hz.y-f.y)*w,f.z+(hz.z-f.z)*w)}
 sky.position.copy(camera.position)}
// Continuous orbit: keep angular velocity, retract the boom instead of snapping azimuth.
function prologueOrbitRadius(f,a,r,h){
 const ca=Math.cos(a),sa=Math.sin(a);
 for(let i=1;i<=32;i++){const d=r*i/32,b=bldAt(f.x+ca*d,f.z+sa*d,1.8);
  if(b&&(roofTop(b)||0)+2.5>f.y+(h-f.y)*i/32)return Math.max(0,d-r/32-1.2);
 }return r;
}
function prologueOrbit(dt,c,sh){const I=PROLOGUE,f={x:c.x,y:(c.gy||0)+1.3,z:c.z};
 // Title reveal: lock the camera's horizontal location and let the car leave.
 if(I.t>=8){
  if(!I.finalAnchor)I.finalAnchor=camera.position.clone();
  const k=clamp((I.t-8)/10,0,1),rise=3*k*k*(3-2*k);
  camera.up.set(0,1,0);setLens(52,.3);
  camera.position.copy(I.finalAnchor);camera.position.y+=rise;
  camera.lookAt(f.x,f.y,f.z);sky.position.copy(camera.position);return;
 }

 if(!I.orbit){const outward=sh.fallback?[-sh.uz,sh.ux]:city.coast===0?[0,-1]:city.coast===1?[0,1]:city.coast===2?[-1,0]:[1,0];
  I.orbit={a:Math.atan2(outward[1],outward[0])+Math.PI-.55,r:9};
 }
 const o=I.orbit;o.a+=Math.max(0,dt)*.065;const height=f.y+9*Math.tan(Math.PI/36);
 // Preview the car's path and orbit one second ahead to start avoiding early.
 const speed=sh.len/18,dir=sh.fallback?[sh.ux,sh.uz]:city.coast<2?[1,0]:[0,1];
 const future={x:f.x+dir[0]*speed,y:f.y,z:f.z+dir[1]*speed};
 const safe=prologueOrbitRadius(f,o.a,9,height),ahead=prologueOrbitRadius(future,o.a+.065,9,height);
 const want=Math.min(safe,ahead);o.r+=(want-o.r)*(1-Math.exp(-Math.max(0,dt)*(want<o.r?5:1.4)));
 // Final clearance check is authoritative; smoothing must never cross a facade.
 o.r=Math.max(0,Math.min(o.r,safe));
 const r=o.r;camera.up.set(0,1,0);setLens(52,.3);
 camera.position.set(f.x+Math.cos(o.a)*r,f.y+(height-f.y)*r/9,f.z+Math.sin(o.a)*r);
 if(r<3){camera.position.y=f.y+3;const b=bldAt(camera.position.x,camera.position.z,1.8);if(b)camera.position.y=Math.max(camera.position.y,(roofTop(b)||0)+3)}
 camera.lookAt(f.x,f.y,f.z);sky.position.copy(camera.position);
}
// v77: logo "COASTAL CHAOS: SUNSET SHORES" — sol synthwave listrado, skyline roxo com janelas acesas na frente,
// palmeiras nas laterais, título arredondado (Fredoka) com degradê de pôr do sol e "SUNSET SHORES" ciano espaçado.
function prologueTitleDraw(){const el=$('#prologueTitle'),g=el.getContext('2d'),W=el.width,H=el.height,cx=W/2,FT="Fredoka,'Arial Rounded MT Bold','Arial Black',sans-serif";
 g.clearRect(0,0,W,H);g.save();g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
 const R=(a=>()=>(a=(a*1664525+1013904223)>>>0)/4294967296)(77);
 // sol listrado
 {const sx=cx,sy=150,sr=128,sun=cv(2*sr+8,2*sr+8),q=sun.getContext('2d'),gr=q.createLinearGradient(0,4,0,2*sr+4);gr.addColorStop(0,'#ffe86a');gr.addColorStop(.45,'#ff9a3c');gr.addColorStop(.8,'#ff3fa4');gr.addColorStop(1,'#d42bd6');
  q.fillStyle=gr;q.beginPath();q.arc(sr+4,sr+4,sr,0,7);q.fill();q.globalCompositeOperation='destination-out';for(let k=0;k<7;k++){const y=sr*.62+k*25,h=2+k*1.6;q.fillRect(0,y,2*sr+8,h)}
  g.drawImage(sun,sx-sr-4,sy-sr-4)}
 // skyline
 {const base=226,bl=[[-118,70,62],[-82,112,40],[-52,150,46],[-14,196,40],[18,168,44],[52,128,40],[84,92,46],[118,60,40]];
  for(const[x,h,w] of bl){const x0=cx+x-w/2,y0=base-h;const bg=g.createLinearGradient(0,y0,0,base);bg.addColorStop(0,'#4a2a8a');bg.addColorStop(1,'#2a1458');g.fillStyle=bg;g.fillRect(x0,y0,w,h);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x0,y0,4,h);
   for(let yy=y0+8;yy<base-6;yy+=9)for(let xx=x0+6;xx<x0+w-6;xx+=7)if(R()<.42){g.fillStyle=R()<.6?'#3fe8ff':'#ff5fd0';g.fillRect(xx,yy,3,4)}}}
 // palmeiras
 const palm=(x,y,h,lean,s)=>{g.save();g.translate(x,y);g.strokeStyle='#2a0f3a';g.lineWidth=9*s;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(lean*.5,-h*.5,lean,-h);g.stroke();g.strokeStyle='#4af0b8';g.lineWidth=5*s;g.stroke();
  g.translate(lean,-h);for(let k=0;k<7;k++){const a=-Math.PI*.95+k*(Math.PI*.9/6),L=58*s;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a)*L*.6,Math.sin(a)*L*.6-14*s,Math.cos(a)*L,Math.sin(a)*L+18*s);g.strokeStyle='#2a0f3a';g.lineWidth=10*s;g.stroke();g.strokeStyle='#4af0b8';g.lineWidth=5.5*s;g.stroke()}
  g.restore()};
 palm(cx-205,236,118,-14,1);palm(cx-250,240,80,10,.75);palm(cx+205,236,118,14,1);palm(cx+250,240,80,-10,.75);
 // COASTAL CHAOS
 {const t='COASTAL CHAOS',y=286;let fs=112;g.font='700 '+fs+'px '+FT;const mw=g.measureText(t).width+fs*.25;if(mw>W*.9){fs=Math.floor(fs*W*.9/mw);g.font='700 '+fs+'px '+FT}g.lineWidth=fs*.2;g.strokeStyle='#2a0f3a';g.strokeText(t,cx+5,y+7);g.fillStyle='#2a0f3a';g.fillText(t,cx+5,y+7);
  g.strokeText(t,cx,y);const tg=g.createLinearGradient(0,y-50,0,y+46);tg.addColorStop(0,'#fff3a0');tg.addColorStop(.45,'#ffc43a');tg.addColorStop(1,'#ff6a3a');g.fillStyle=tg;g.fillText(t,cx,y);
  g.save();g.beginPath();g.rect(0,y-56,W,40);g.clip();g.fillStyle='rgba(255,255,255,.28)';g.fillText(t,cx,y);g.restore()}
 // SUNSET SHORES
 {const t='S U N S E T   S H O R E S',y=372;let fs=46;g.font='600 '+fs+'px '+FT;{const mw=g.measureText(t).width;if(mw>W*.8){fs=Math.floor(fs*W*.8/mw);g.font='600 '+fs+'px '+FT}}g.lineWidth=10;g.strokeStyle='#14082a';g.strokeText(t,cx,y);g.shadowColor='#16e6ff';g.shadowBlur=18;
  const cg=g.createLinearGradient(cx-330,0,cx+330,0);cg.addColorStop(0,'#16e6ff');cg.addColorStop(.55,'#7ad8ff');cg.addColorStop(1,'#16e6ff');g.fillStyle=cg;g.fillText(t,cx,y);g.shadowBlur=0}
 g.restore();
}
function prologueBeachBegin(){
 STORY.map.add('beach');STORY.map.add('parachute');
 const c=PROLOGUE.car;PROLOGUE.orbit=null;PROLOGUE.finalAnchor=null;PROLOGUE.cine=null;const title=$('#prologueTitle');title.hidden=true;title.style.opacity='0';title.style.transform='translate(-50%,-50%) scale(1)';prologueTitleDraw();PROLOGUE.shot=prologueCoastShot();
 if(PROLOGUE.mate&&peds.includes(PROLOGUE.mate))removePed(PROLOGUE.mate);PROLOGUE.mate=null;
 if(!PROLOGUE.shot)throw new Error('Nenhum trecho seco da orla para a cena final');
 if(PL.car!==c){PL.car=c;PL.sp.visible=false;PL.sh.visible=false;}
 DUO.on=true;DUO.car=c;DUO.drv=0;DUO.follow=false;PROLOGUE.stage='beach';$('#storyGuide').hidden=true;transitionPromptClear();DN.tod=1110;DN.t=0;updateDayNight(0,true);
 sceneRadioStart('credits');
}
function prologueHomeEnd(){
 const c=PROLOGUE.car;DUO.on=false;DUO.car=null;DUO.follow=false;CHAR.list[1].look=CHAR.list[1].jailLook||CHAR.list[1].look;
 if(c){c.keep=true;c.hand=true;c.vx=c.vz=c.fwd=c.w=0;const p=city.safe.slots?.[0]||null;if(p){c.x=p.x;c.z=p.z;c.a=p.a||0}syncCar(c,0);c.owned=true;c.legal=true;c.homeConv=true;SAFE.conv={...carRec(c),legal:true};SAFE.convCar=c;if(Array.isArray(SAFE.stored)&&SAFE.stored[0]&&SAFE.stored[0].type===c.type)SAFE.stored[0]=null;if(SAFE.cars&&SAFE.cars[0]===c)SAFE.cars[0]=null}
 PL.car=null;PL.inside=false;DOOR.from=null;const h=city.safe;PL.x=h.x+h.nx*2.3;PL.z=h.z+h.nz*2.3;PL.vx=PL.vz=0;PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;placeSprite(PL);camT.x=PL.x;camT.z=PL.z;chasePos.set(PL.x,PL.gy+2.4,PL.z+3);
 const p=charSidewalk(true);CHAR.list[1].st={at:gameMin(),world:charWorld(),x:p[0],z:p[1],look:{...CHAR.list[1].look},car:null,heli:null};
 if(BLITZ.on===PROLOGUE.blitz)blitzEnd();PROLOGUE.active=false;PROLOGUE.cut=null;PROLOGUE.stage='done';
 QUEST.pier.state='home';updateCamera(0);storyFinalBegin(0);
}
function prologueCutTick(dt){
 if(menuOpen)return;const I=PROLOGUE;I.t+=dt;I.cutT=(I.cutT||0)+dt;simT+=dt;balTick(dt);convRiderTick();try{ped3dJobTick()}catch(e){}
 if(I.cut==='doorWalk'){
  const w=I.walk,k=Math.min(1,I.t/2.4);PL.x=w.x+(w.tx-w.x)*k;PL.z=w.z+(w.tz-w.z)*k;PL.gy=groundY(PL.x,PL.z);
  PL.mx=w.tx-w.x;PL.mz=w.tz-w.z;setFrame(PL.tex,pickDir(PL.mx,PL.mz,PL.x,PL.z),k<1?1+Math.floor(I.t*5)%2:0);placeSprite(PL);
  const h=city.safe;camera.up.set(0,1,0);setLens(52,.3);camera.position.set(h.x+h.nx*8+h.nz*5,3,h.z+h.nz*8-h.nx*5);camera.lookAt(h.x+h.nx*3,1,h.z+h.nz*3);sky.position.copy(camera.position);
  if(k>=1){I.cut=null;document.body.classList.remove('story-cinematic');prologueFade(()=>prologueBeachBegin());}return; /* r48: o diálogo antigo da porta ("faz cinco anos") foi removido; caminho morto (etapa 'home' não é mais usada) */
 }
 if(I.cut==='switch'){
  switchCam(dt);if(!SWITCH.on){I.cut=null;document.body.classList.remove('story-cinematic');const next=I.after;I.after=null;if(next)next();}return;
 }
 if(I.cut==='iswitch'){const W=I.isw,b=$('#storyBlack'),cr=$('#storyCredit'),ez=k=>k*k*(3-2*k);W.t+=dt;const t=W.t;
  // recuo da câmera: sobe 2,6 m e afasta 2 m para trás, mantendo a direção do olhar
  const pull=(pos,q,k)=>{const f=new THREE.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.lengthSq()<1e-4)f.set(0,0,-1);f.normalize();camera.position.copy(pos).addScaledVector(f,-2*k);camera.position.y+=2.6*k;camera.quaternion.copy(q);sky.position.copy(camera.position)};
  if(t<.9){const k=ez(t/.9);pull(W.pos0,W.q0,k);b.style.opacity=String(k);return}
  if(!W.applied){W.applied=true;b.style.opacity='1';
   charEnter(W.to,W.tgt,W.p);roomStageSync();
   // prisão: virada para as grades → câmera fica DENTRO da cela, atrás dela (antes ficava no corredor atrás da placa)
   if(W.tgt&&W.tgt.prologueJail){PL.yaw=Math.PI;PL.face=[0,1];PL.pitch=0}
   updateCamera(0,true);
   // mesmo caso da v43 (storyAirportSpawn): o diálogo pausa updatePlayer → sprite invisível até a conversa acabar.
   if(!PL.car&&!PL.heli)actorShowNow(PL); /* v78: já dentro do carro, mostrar o sprite em pé duplicava o personagem (passageiro fantasma) */W.pos1=camera.position.clone();W.q1=camera.quaternion.clone();pull(W.pos1,W.q1,1)}
  cr.style.opacity=String(t<1.3?Math.max(0,(t-.95)/.35):t<2.6?1:Math.max(0,1-(t-2.6)/.35));
  if(t<3){pull(W.pos1,W.q1,1);return}
  const k=ez(Math.min(1,(t-3)/.9));pull(W.pos1,W.q1,1-k);b.style.opacity=String(1-k);
  if(k>=1){cr.style.opacity='0';b.hidden=true;b.style.opacity='0';I.isw=null;I.cut=null;document.body.classList.remove('story-cinematic');updateCamera(0,true);const next=I.after;I.after=null;if(next)next()}
  return}
 if(I.cut==='inspection'){
  for(const c of [PL.car,...(I.blitz?.cars||[])])if(c){ensureDetail(c);if(c.g)c.g.visible=true;syncCar(c,dt);}
  convRiderTick();blitzTick(dt);const b=I.blitz,c=PL.car;
  if(b){for(const q of [b.cop1,b.cop2])if(q?.at){q.x=q.at.x;q.z=q.at.z;q.gy=groundY(q.x,q.z);setFrame(q.tex,pickDir(PL.x-q.x,PL.z-q.z,q.x,q.z),Math.floor(I.t*3)%2+1);placeSprite(q)}
   const shot=broadcastSafeShot({x:c.x,y:1,z:c.z},{x:c.x-b.ux*4-b.uz*2.5,y:2.55,z:c.z-b.uz*4+b.ux*2.5});camera.up.set(0,1,0);setLens(55,.3);camera.position.set(shot.x,shot.y,shot.z);camera.lookAt(c.x,1,c.z);sky.position.copy(camera.position);
      if(I.said===1&&I.t>4.4){I.said=2;say(b.cop2||b.cop1||PL,'Uma detenta fugiu hoje da penitenciária. Viu alguma moça sozinha por aí com estas características?',4.4)}
   if(I.said===2&&I.t>8.4){I.said=3;say(PL,'Não vi ninguém, seu guarda.',2.4)}
   if(b.phase==='done'&&I.t>10.8){I.cut=null;document.body.classList.remove('story-cinematic');c.hand=false;prologueStage('motelGo');const T=prologueMotelTarget();if(T)misGPS(T.x,T.z);think(PL,'Fugitiva… não é possível, não pode ser.',4)}
  }return;
 }
 if(I.cut==='fade'){
  const t=I.cutT,b=$('#storyBlack');b.style.opacity=String(t<.85?t/.85:t<1.05?1:Math.max(0,1-(t-1.05)/.85));
  if(t>=.85&&!I.applied){I.applied=true;I.fadeAction();roomStageSync();if(STORYEND.active)return;
   /* r43: a ação encerrou a cena (ex.: prologueHomeEnd no fim da missão 1 zera PROLOGUE.cut) → este tick não roda mais; clareia por CSS e solta o jogo */
   if(I.cut!=='fade'){b.style.transition='opacity .85s';b.style.opacity='0';document.body.classList.remove('story-cinematic');I.after=null;setTimeout(()=>{if(!PROLOGUE.cut&&!STORYEND.active&&!STORYINTRO.active){b.hidden=true;b.style.transition='none'}},900);return}}
  if(t>=1.95){b.hidden=true;b.style.opacity='0';I.cut=null;document.body.classList.remove('story-cinematic');const next=I.after;I.after=null;if(I.stage==='beach'){I.cut='beach';I.t=0;document.body.classList.add('story-cinematic');}else if(next)next();}return;
 }
 if(I.cut==='beach'){
  // v77: cena final em 3 atos — travelling com o pôr do sol atrás do casal (0–9 s), a câmera solta o carro
  // e sobe enquanto a logo entra e sai (9–16,5 s), +4 s do carro seguindo ao longe e fade para os créditos.
  const sh=I.shot,c=I.car,T=PROLOGUE_CINE.T,tt=Math.min(I.t,T),u=sh.len*tt/T,pt=prologuePathAt(sh,u);
  c.x=pt[0];c.z=pt[1];const dir=sh.fallback?[sh.ux,sh.uz]:city.coast<2?[1,0]:[0,1];
  c.a=Math.atan2(dir[1],dir[0]);c.fwd=5;PL.x=c.x;PL.z=c.z;PL.gy=groundY(c.x,c.z);try{ensureDetail(c)}catch(e){}if(c.g)c.g.visible=true;syncCar(c,dt);camT.x=c.x;camT.z=c.z;
  prologueCine(dt,c,sh);
  const title=$('#prologueTitle'),L=PROLOGUE_CINE;
  if(I.t>L.logoIn&&I.t<L.logoOut+1.6){const a=I.t<L.logoOut?clamp((I.t-L.logoIn)/1.4,0,1):clamp(1-(I.t-L.logoOut)/1.4,0,1),k=clamp((I.t-L.logoIn)/(L.logoOut+1.4-L.logoIn),0,1);
   title.hidden=a<=0;title.style.opacity=String(a);title.style.transform='translate(-50%,-50%) scale('+(.96+.12*(k*k*(3-2*k)))+')'}
  else if(I.t>=L.logoOut+1.6){title.hidden=true;title.style.opacity='0'}
  if(I.t>L.end){sceneRadioFade(.8);prologueFade(()=>{title.hidden=true;title.style.opacity='0';prologuePlaceHome();prologueHomeEnd();});}return;
 }
 if(I.cut==='card'){prologueCardTick(dt);return}
 if(I.cut==='motelDoor'){prologueMotelCut(dt);return}
 if(I.cut==='motelTalk'){ // diálogo no quarto com a câmera do casal (o diálogo segue rodando dentro do corte)
  const T=I.talk,q=MOTEL.claire;if(DLG.on)dlgTick(dt);if(!T||!q)return;const sw=Math.sin(simT*.35)*.25;
  setLens(46,.1);camera.up.set(0,1,0);camera.position.set(T.mx+T.px*2.4+T.pz*sw,1.55,T.mz+T.pz*2.4-T.px*sw);camera.lookAt(T.mx,1.25,T.mz);sky.position.copy(camera.position);
  for(const o of [PL,q]){const oth=o===PL?q:PL;o.mx=oth.x-o.x;o.mz=oth.z-o.z;o.gy=0;setFrame(o.tex,cineDir(o.mx,o.mz,o.x,o.z),0);placeSprite(o)}return}
 if(I.cut==='homeReveal'){updateCamera(0);if(I.t>2)prologueFade(()=>{I.cut=null;prologueHomeEnd()});}
}
// direção do sprite sempre relativa à câmera da cena (pickDir ignora a câmera no modo topo)
function cineDir(mx,mz,ox,oz){let vx=ox-camera.position.x,vz=oz-camera.position.z;const lv=Math.hypot(vx,vz)||1;vx/=lv;vz/=lv;const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;const dot=mx*vx+mz*vz,cr=vx*mz-vz*mx;return dot>.707?1:dot<-.707?0:cr>0?3:2}
function cineSay(o,txt,dur,k,thought){say(o,txt,dur,thought);const b=BAL.list[BAL.list.length-1];if(b&&b.o===o){b.w*=k;b.h*=k}}
function prologueMotelCut(dt){const I=PROLOGUE,d=I.door,M=MOTEL;
 // câmera lenta (bullet time) enquanto Claire se vira: o corte anda a 40%
 if(I.t>5.2&&I.t<7.8){I.t-=dt*.6;SLOWFX.cine=true;/* v78: sem legenda 'BULLET TIME' no reencontro */}else SLOWFX.cine=false;
 const t=I.t;camera.up.set(0,1,0);
 const face=(o,x,z)=>{o.mx=x-o.x;o.mz=z-o.z};const pose=(o,walk)=>{setFrame(o.tex,cineDir(o.mx||0,o.mz||1,o.x,o.z),walk?1+Math.floor(simT*5)%2:0);placeSprite(o)};
 if(t<2.6){ // 1) por trás de Nathan na varanda, arma em punho, encarando a porta do 6
  const sx=-d.nz,sz=d.nx;setLens(54,.2);camera.position.set(d.x+d.nx*4.4+sx*1.1,2.35,d.z+d.nz*4.4+sz*1.1);camera.lookAt(d.x-d.nx*.2,1.55,d.z-d.nz*.2);sky.position.copy(camera.position);NAV.marker=null;NAV.misMarker=false;if(NAV.beam)NAV.beam.visible=false;
  face(PL,d.x-d.nx,d.z-d.nz);pose(PL,false);try{heldGunTick()}catch(e){}
  if(I.said===0&&t>.5){I.said=1;cineSay(PL,'Quarto 6. Seja quem for, vai ter que se explicar.',2.2,.6,true)}
  return}
 if(!M.scene){ // corte: entra, Claire de costas na janela
  const IN=(motelRoomBuild(),M.IN),wp=M.window;
  if(M.claire&&peds.includes(M.claire))removePed(M.claire);
  const q=spawnPed(null,{x:wp.x,z:wp.z,vx:0,vz:0,main:true,pal:{...(CHAR.list[1].look||LUCIA_PAL)}});if(q){q.fixed=true;q.state='clerk';q.at={x:q.x,z:q.z};q.mx=0;q.mz=-1;q.gy=0;M.claire=q}
  motelEnter(true);PL.x=M.exit.x+.25;PL.z=M.exit.z-1.35;PL.gy=0;roomStageSync();fadeFlash();I.walkA={x:PL.x,z:PL.z};
 }
 const IN=M.IN,q=M.claire,a=I.walkA;if(!q)return;q.gy=0;PL.gy=0;
 if(t<5.4){ // 2) câmera da porta: Nathan de arma em punho, Claire de costas olhando a janela
  setLens(62,.1);camera.position.set(a.x-.8,1.75,a.z+1.2);camera.lookAt(q.x,1.15,q.z);sky.position.copy(camera.position);
  face(PL,q.x,q.z);pose(PL,false);q.mx=0;q.mz=-1;pose(q,false);try{heldGunTick()}catch(e){}
  if(I.said===1&&t>3.0){I.said=2;cineSay(PL,'Parado aí! Mãos onde eu possa ver!',2.3,.38)}return}
 if(t<7.6){ // 3) contracampo: Claire se vira devagar
  setLens(48,.1);camera.position.set(q.x-1.3,1.6,q.z+1.9);camera.lookAt(q.x,1.25,q.z);sky.position.copy(camera.position);
  if(t>5.9){face(q,PL.x,PL.z);ostStop(3.5,'motel')}pose(q,false);pose(PL,false);try{heldGunTick()}catch(e){}
  if(I.said===2&&t>5.5){I.said=25;cineSay(PL,'…',1.6,.45,true)}
  if(I.said===25&&t>6.1){I.said=3;cineSay(q,'Nate… sou eu.',2.4,.55)}return}
 // 4) plano lateral: ele baixa a arma, os dois se aproximam e se beijam no susto
 if(I.said===3){I.said=4;gunHolster(true);cineSay(PL,'Claire?!',1.6,.55)}
 const k=clamp((t-8.0)/1.6,0,1),mx=(a.x+q.at.x)/2,mz=(a.z+q.at.z)/2,dx=q.at.x-a.x,dz=q.at.z-a.z,dl=Math.hypot(dx,dz)||1,ux=dx/dl,uz=dz/dl;
 PL.x=a.x+(mx-ux*.27-a.x)*k;PL.z=a.z+(mz-uz*.27-a.z)*k;q.x=q.at.x+(mx+ux*.27-q.at.x)*k;q.z=q.at.z+(mz+uz*.27-q.at.z)*k; /* v79r16: mais perto — os rostos se encostam */ // narizes encostam sem atravessar
 face(PL,q.x,q.z);face(q,PL.x,PL.z);pose(PL,k>0&&k<1);pose(q,k>0&&k<1);
 const px=-uz,pz=ux,push=clamp((t-9.6)/2,0,1);setLens(50-push*8,.1);camera.position.set(mx+px*(3.1-push*.9),1.55,mz+pz*(3.1-push*.9));camera.lookAt(mx,1.3,mz);sky.position.copy(camera.position);
 if(I.said===4&&t>9.7){I.said=5;cineSay(q,'♥',2.2,.6)}
 if(t>11.6){q.x=q.at.x=mx+ux*.5;q.z=q.at.z=mz+uz*.5;PL.x=mx-ux*.5;PL.z=mz-uz*.5;I.cut='motelTalk';I.talk={mx,mz,px,pz};prologueMotelTalk()}
}
function prologuePlaceHome(){
 // Place gameplay actors behind the fade, then reveal the safe-house doorway.
 const c=PROLOGUE.car;DUO.on=false;DUO.car=null;DUO.follow=false;
 const slot=city.safe.slots?.[0];if(slot){c.x=slot.x;c.z=slot.z;c.a=slot.a;}c.gy=groundY(c.x,c.z);syncCar(c,0);
 PL.car=null;PL.inside=false;DOOR.from=null;PL.x=city.safe.x+city.safe.nx*2.3;PL.z=city.safe.z+city.safe.nz*2.3;PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;
 c.hand=true;c.fwd=c.vx=c.vz=c.w=0;placeSprite(PL);camT.x=PL.x;camT.z=PL.z;chasePos.set(PL.x,PL.gy+2.4,PL.z+3);updateCamera(0);
}
/* r38: a pé no mesmo quarteirão do objetivo (ex.: indo da bomba pra borracharia do posto) o cronômetro do conversível não liga */
function prologueNearGoal(){let tg=null;try{tg=missionTargets().find(q=>q.active)}catch(e){}if(!tg)return false;if(Math.hypot(PL.x-tg.x,PL.z-tg.z)<28)return true;
 const inR=(r,x,z)=>x>r[0]-2.5&&x<r[2]+2.5&&z>r[1]-2.5&&z<r[3]+2.5;for(const r of city.rects||[])if(inR(r,PL.x,PL.z)&&inR(r,tg.x,tg.z))return true;return false}
/* r40: SMS do número desconhecido depois de ~10 s dirigindo; abrir o celular lê a mensagem e entra o monólogo do Nathan */
function prologueSmsTick(dt){const I=PROLOGUE;
 if(I.stage==='smsDrive'){if(PL.car)I.smsT=(I.smsT||0)+dt;if(I.smsT>=10){PHONE.msgs.unshift({t:gameMin(),txt:translatePlain('NÚMERO DESCONHECIDO: Me encontra no Motel Miragem, quarto 6. Venha sozinho.'),read:false,kind:'mission'});phoneBeep();prologueStage('smsRead');think(PL,'Mensagem? Quem me mandaria um SMS…',3.5)}return}
 if(I.stage==='smsRead'&&PHONE.open){prologueClosePhone();prologueStage('smsRead2',null);$('#storyGuide').hidden=true;try{monStoryShiftSync()}catch(e){}
  const m=PHONE.msgs.find(q=>q.kind==='mission'&&/DESCONHECIDO|UNKNOWN/.test(q.txt));if(m)m.read=true;
  prologueDialogue('SMS · NÚMERO DESCONHECIDO',['Me encontra no Motel Miragem, quarto 6. Venha sozinho.'],()=>{
   prologueDialogue('NATHAN',['Número desconhecido… motel de beira de estrada… “venha sozinho”?','Isso tá com cara de armação. Algum inimigo antigo, um bandido querendo acerto de contas…','Não vou de mãos vazias. Primeiro, a borracharia…'],()=>{
    prologueStage('ammo');PROLOGUE.gun=false;const a=AMMO.pos;if(a)misGPS((a.out||a).x,(a.out||a).z)})},{...CLERK_PAL,cap:null,shirt:'#2a2a34',pants:'#2a2a34'})}}
function prologueTick(dt){
 const I=PROLOGUE;if(!I.active||I.cut||menuOpen||STORYINTRO.active||STORYFAIL.active||DLG.on||SWITCH.on||!played)return;
 if(PL.dead)return;if(I.car&&(!I.car.alive||(!vehicles.includes(I.car)&&!I.car.stashed))){storyMissionFail('SEU CONVERSÍVEL FOI DESTRUÍDO');return}I.t+=dt;
 // v78: missão 1 falha se a polícia entrar na cola, ou se o Nathan largar o conversível por mais de 30 s (dentro de lojas não conta).
 if(POL.wanted){storyMissionFail('A POLÍCIA ESTÁ NA SUA COLA');return}
 if(CHAR.cur===0&&I.car&&I.car.alive&&I.stage!=='motelGo'&&I.stage!=='blitz'&&!PL.inside&&PL.car!==I.car&&!prologueNearGoal()){I.outT=(I.outT||0)+dt;tbarShow('conv','VOLTE PARA O CONVERSÍVEL',1-I.outT/30);if(I.outT>=30){I.outT=0;I.outShow=null;tbarHide('conv');storyMissionFail('VOCÊ ABANDONOU O CONVERSÍVEL');return}}else{I.outT=0;I.outShow=null;tbarHide('conv')}
 if(I.stage==='dealer'){const d=nearestDealRef(PL);if(d&&!NAV.marker)misGPS(d.sx,d.sz);}
 if(I.stage==='smsDrive'||I.stage==='smsRead')prologueSmsTick(dt);
 if(I.stage==='driveFirst'&&PL.car===I.car&&Math.abs(PL.car.fwd)>2){I.wait-=dt;if(I.wait<=0)prologueJail()}
 if(I.stage==='escape'&&PL.inside!=='jail'&&!JAIL.locked){prologueStage('steal');I.t=0;think(PL,'Livre! Mas a pé eu não vou longe. Preciso de um carro…',5)}
 /* r46: Claire foragida que volta à delegacia é reconhecida e presa de novo → recomeça a fuga da cela */
 if((I.stage==='steal'||I.stage==='driveMall')&&CHAR.cur===1&&!I.cut&&city.polDoor&&!PL.dead){const f=PL.car||PL,dd=Math.hypot(f.x-city.polDoor.x,f.z-city.polDoor.z);if(PL.inside==='jail'||(!PL.inside&&dd<15))prologueRearrest()}
 if(I.stage==='steal'&&CHAR.cur===1&&PL.car){prologueStage('driveMall');STORY.unl.add('specC');{const el=$('#storyGuide');if(el&&!el.hidden){el.insertAdjacentHTML('beforeend','<small>'+translatePlain('ESPECIAL LIBERADO · aperte')+' <kbd>'+specKey()+'</kbd> '+translatePlain('ao volante: câmera lenta para costurar o trânsito.')+'</small>');monStoryShiftSync()}}const o=MALL.out;if(o)misGPS(o.x,o.z);prologueLoot()}
 if(I.stage==='driveMall'&&PL.inside==='mall')prologueMallInside();
 if(I.stage==='driveMall'&&MALL.out&&!NAV.marker)misGPS(MALL.out.x,MALL.out.z);
 if(I.stage==='phoneBuy')prologuePhoneBought();
 if(I.stage==='ammo'){const a=AMMO.pos;if(a&&PL.inside!=='ammo'){const o=a.out||a;if(!NAV.marker||Math.hypot(NAV.marker.x-o.x,NAV.marker.z-o.z)>3)misGPS(o.x,o.z)}
  if(I.gun&&PL.inside!=='ammo'){prologueStage('motelDrive');STORY.unl.add('motel');I.blitzDone=false;I.wait=2.5+Math.random()*1.5; /* v78: blitz logo depois da borracharia (o motel fica a 55–90 m dela) */const T=prologueMotelTarget();if(T)misGPS(T.x,T.z);think(PL,'Motel Miragem, quarto 6. Vamos ver quem tá brincando comigo.',5)}}
 if(I.stage==='motelDrive'||I.stage==='motelGo'){const T=prologueMotelTarget();
  if(T&&(!NAV.marker||Math.hypot(NAV.marker.x-T.x,NAV.marker.z-T.z)>3))misGPS(T.x,T.z);
  if(I.stage==='motelGo'&&T){const o=PL.car||PL,dm=Math.hypot(o.x-T.x,o.z-T.z);if(dm<45)ostPlay('motel','suspense',3);else if(dm>110)ostStop(3,'motel')} /* v78: suspense na chegada ao motel (loop enquanto o jogador não age) */
  if(I.stage==='motelDrive'&&!I.blitzDone&&PL.car&&T){if(Math.abs(PL.car.fwd)>2)I.wait-=dt;if(I.wait<=0||Math.hypot(PL.car.x-T.x,PL.car.z-T.z)<35){if(!prologueBlitz())I.blitzDone=true}}} /* v78: antes exigia estar a >60 m do motel após 8–14 s dirigindo — com o motel ao lado da borracharia a blitz era pulada quase sempre. A blitz usa fade e leva o carro até a operação, então vale mesmo perto do destino */
 if(I.stage==='home'){
  const h=city.safe,c=PL.car||PL,d=Math.hypot(c.x-h.x,c.z-h.z);
  if(d<70&&(!I.mate||!peds.includes(I.mate))){I.mate=spawnPed(null,{x:h.x+h.nx*3,z:h.z+h.nz*3,vx:0,vz:0,main:true,pal:CHAR.list[1].look||LUCIA_PAL});if(I.mate){I.mate.fixed=true;I.mate.state='clerk';I.mate.at={x:I.mate.x,z:I.mate.z};}}
  if(d<8&&(!PL.car||Math.abs(PL.car.fwd)<1.5))prologueReunion();
 }
}

/* Reencontro de Claire: reaproveita a barra de dialogo e a mesma casa segura. */
const STORYEND={active:false,stage:'',t:0,pay:0,scroll:0,shown:false};
const STORY_CREDITS=[
 ['Conceito','Zoio The Green Eye'],['Argumento','Zoio The Green Eye'],
 ['Modelagem 3D','Claude AI'],['Ideia de Jerico','Zoio The Green Eye'],
 ['Produção','Claude.AI','ChatGPU Plus'],['Direção Artística','Zoio The Green Eye'],
 ['Game Testers','Zoio The Green Eye','Claude.AI','ChatGPT Plus']
];
function storyReunionDialog(){
 if(!played||!storyOn()||QUEST.pier.state!=='home'||PL.inside!==true||DLG.on||STORYEND.active)return;
 document.body.classList.add('story-reunion');STORYINTRO.guide=-1;$('#storyGuide').hidden=true;monStoryShiftSync();
 dlgOpen({name:'CLAIRE',pal:{...(CHAR.list[1].look||LUCIA_PAL)},lines:['Obrigada pela volta, Nate. Ainda preciso de tempo… mas foi bom estar com você.'],onEnd:(res)=>{
  document.body.classList.remove('story-reunion');
  if(res<0){toast('APERTE E PERTO DE CLAIRE PARA CONTINUAR');return} // Somente o OK confirma o termino da primeira missao.
  storyFinalBegin(QUEST.pier.reward||0);
 }});
}
function storyFinalBegin(pay){
 if(STORYEND.active||QUEST.pier.state!=='home')return;
 /* r39: fim da missão 1 igual às outras — sem tela preta, sem "CONTINUA…" e sem créditos (os créditos ficam pro fim da missão 5).
    Volta ao jogo na hora, mostra o "MISSÃO CONCLUÍDA" e a campanha manda o SMS + "!" da missão 2. */
 const Q=QUEST.pier;Q.state='done';
 NAV.marker=null;NAV.route=null;NAV.misMarker=false;if(NAV.beam)NAV.beam.visible=false;
 storyComplete('pier',pay,false);
 storyCreditsHome();document.body.classList.remove('story-final-fading','story-cinematic','story-reunion');
 syncSave();storySkipSync();try{campDoneShow('Um novo começo',pay?'+$'+Math.round(pay).toLocaleString(S.lang==='en'?'en-US':'pt-BR'):'novos lugares liberados',false)}catch(e){}
 if(claireFree())storyTutorialShow(5);charSelPaint();if(typeof CAMP!=='undefined')CAMP.hookT=0;setTimeout(()=>{try{storyCheckpointOffer()}catch(e){}},5200);
}
/* r39: fim da campanha (missão 5): THE END + créditos, usando o mesmo palco de créditos que a missão 1 usava */
function storyTheEnd(){if(STORYEND.active)return;sceneRadioStop();try{RADIO.el.pause();stopLive()}catch(e){}
 STORYEND.active=true;STORYEND.final=true;STORYEND.stage='mission';STORYEND.t=0;STORYEND.pay=0;document.body.classList.add('story-cinematic');
 const black=$('#storyBlack'),credit=$('#storyCredit');black.hidden=false;black.style.transition='none';black.style.opacity='1';
 credit.style.color='#ffcc24';credit.style.opacity='0';credit.innerHTML='THE END<small>'+translatePlain('FIM DA LINHA')+'</small>';
 $('#storyClock').style.opacity='0';$('#storyGuide').hidden=true;monStoryShiftSync();$('#storyRoll').hidden=true;const skip=$('#storySkip');skip.textContent='PULAR';skip.setAttribute('aria-label','Pular trecho atual');storySkipSync()}
/* O modo Historia usa os MESMOS sistemas do Livre. A bandeira so retira
   todas as travas, preservando o modo selecionado e o progresso salvo. */
// A rolagem é posicionada ANTES de revelar a cena, já em movimento durante o clarear.
function storyCreditsBegin(instant=false){
 const I=STORYEND;if(!I.active)return;
 I.stage='credits';I.t=0;I.creditsTod=DN.tod;I.creditsDay=DN.day||0;sceneRadioStart('credits');
 const black=$('#storyBlack'),credit=$('#storyCredit'),roll=$('#storyRoll');
 const inner=roll.querySelector('.inner');
 inner.innerHTML=STORY_CREDITS.map(a=>'<div class="part"><div class="role">'+a[0]+'</div>'+a.slice(1).map(n=>'<div class="name">'+n+'</div>').join('')+'</div>').join('');
 // A primeira posição fica logo abaixo do viewport, em vez de piscar em y=0.
 inner.style.transform='translateY('+(innerHeight-26)+'px)';
 credit.style.opacity='0';black.hidden=false;black.style.zIndex='10003';
 black.style.transition='none';black.style.opacity='1';roll.hidden=false;
 const skip=$('#storySkip');skip.textContent='PULAR';skip.setAttribute('aria-label','Pular créditos');storySkipSync();
 if(instant){black.style.opacity='0';black.hidden=true}
 else{void black.offsetWidth;black.style.transition='opacity 1.6s ease';black.style.opacity='0'}
}
// Salto e término normal usam o mesmo fade: créditos -> preto -> câmera da safe house -> jogo.
function storyCreditsFinish(){
 if(!STORYEND.active||STORYEND.stage!=='credits')return;
 sceneRadioStop();STORYEND.stage='returnFadeIn';STORYEND.t=0;
 const black=$('#storyBlack'),credit=$('#storyCredit'),skip=$('#storySkip');
 credit.style.opacity='0';storySkipSync();black.hidden=false;
 // Fica acima do texto rolante para o escurecimento também cobrir os créditos.
 black.style.zIndex='10005';black.style.transition='none';black.style.opacity='0';
 void black.offsetWidth;
 black.style.transition='opacity .8s ease';black.style.opacity='1';
}
function storyCreditsHome(){
 document.body.classList.remove('prologue-active');
 // v77: a campanha só é "concluída" quando todas as missões de STORY_MISSIONS terminaram. Hoje a única é a
 // missão 1, então o resultado é o mesmo de antes (cidade inteira liberada). Com novas missões, cada uma libera
 // apenas o seu unlock/world e a próxima fica disponível por `needs`.
 if(STORY_MISSIONS.every(m=>STORY.done.has(m.id))){STORY.cleared=true;for(const feature of STORY_LOCKED)STORY.unl.add(feature)}
 // Keep explored places; remaining icons are discovered in the world.
 STORY.fresh=false;
 const roll=$('#storyRoll');roll.hidden=true;roll.querySelector('.inner').style.transform='';
 storySkipSync();$('#storyCredit').style.opacity='0';$('#storyClock').style.opacity='0';
 document.body.classList.add('story-final-fading');document.body.classList.remove('story-cinematic','story-reunion');
 // O reencontro termina dentro da safe house; restaura a câmera enquanto a tela está preta.
 if(SAFE.IN&&PL.inside===true){
  // Após a missão, Claire (ou Nathan se a troca já aconteceu) fica ao lado do jogador.
  // Alt permite assumi-lo; E ativa a função existente de sair juntos.
  if(!DUO.on&&!DUO.follow)safeMateSpawn([SAFE.IN.x-1.55,SAFE.IN.z+1.25],true);
  camT.x=PL.x;camT.z=PL.z;PL.gy=groundY(PL.x,PL.z);if(camMode==='fps')chasePos.set(PL.x,PL.gy+2.4,PL.z+3)
 }
 // Resolve the gameplay pose under black, including filters and camera up.
 SWITCH.on=false;CAMHOP.on=false;CAMX.on=false;
 LOOK.yaw=LOOK.pitch=LOOK.t=0;camera.up.set(0,1,0);
 camT.x=PL.x;camT.z=PL.z;camH=46;
 updateCamera(0,true);chasePos.copy(camera.position);

 try{saveGame(true)}catch(e){console.warn('Progresso do fim da campanha',e)}
}
function storyFinalSkipPart(){
 const I=STORYEND;if(!I.active||menuOpen)return;
 const credit=$('#storyCredit');
 if(I.stage==='mission'){
  if(I.final){storyCreditsBegin(true);return}
  I.stage='continue';I.t=0;credit.innerHTML='CONTINUA . . .';credit.style.color='#fff';credit.style.opacity='1';return;
 }
 if(I.stage==='continue'){storyCreditsBegin(true);return}
 if(I.stage==='credits'||I.stage==='returnFadeIn'||I.stage==='returnFadeOut'){
  sceneRadioStop();storyCreditsHome();
  const black=$('#storyBlack');black.style.transition='none';black.style.opacity='0';black.hidden=true;black.style.zIndex='';
  document.body.classList.remove('story-final-fading');
  I.active=false;I.final=false;I.stage='';I.t=0;syncSave();storySkipSync();
  toast(STORY.cleared?'<span style="color:#ffcc33">HISTORIA CONCLUIDA</span><br><small style="font-size:11px;color:#fff">Cidade inteira liberada · checkpoint liberado</small>':'<span style="color:#ffcc33">MISSÃO CONCLUÍDA</span><br><small style="font-size:11px;color:#fff">novos lugares liberados · checkpoint liberado</small>');if(claireFree())storyTutorialShow(5);charSelPaint();storyCheckpointOffer();
 }
}
function storySkipPart(forceFromMenu=false){if(menuOpen&&!forceFromMenu)return;if(STORYINTRO.active)storyIntroSkipPart();else if(STORYEND.active)storyFinalSkipPart();storySkipSync()}
$('#storySkip').addEventListener('click',()=>{if(!(STORYINTRO.active||STORYEND.active))return;if(menuOpen)closeMenu();storySkipPart(true)});
function storyFinalTick(dt){
 const I=STORYEND;if(!I.active)return;I.t+=dt;
 const black=$('#storyBlack'),credit=$('#storyCredit'),roll=$('#storyRoll');
 if(I.stage==='returnFadeIn'){
  if(I.t>=.88){storyCreditsHome();I.stage='returnFadeOut';I.t=0;black.style.transition='opacity .9s ease';black.style.opacity='0'}
  return;
 }
 if(I.stage==='returnFadeOut'){
  if(I.t>=1){I.active=false;I.final=false;I.stage='';I.t=0;black.hidden=true;black.style.zIndex='';black.style.opacity='0';document.body.classList.remove('story-final-fading');syncSave();storySkipSync();
   toast(STORY.cleared?'<span style="color:#ffcc33">HISTORIA CONCLUIDA</span><br><small style="font-size:11px;color:#fff">Cidade inteira liberada · checkpoint liberado</small>':'<span style="color:#ffcc33">MISSÃO CONCLUÍDA</span><br><small style="font-size:11px;color:#fff">novos lugares liberados · checkpoint liberado</small>');if(claireFree())storyTutorialShow(5);charSelPaint();storyCheckpointOffer()}
  return;
 }
 if(I.stage==='mission'){
  credit.style.opacity=String(I.t<.9?I.t/.9:I.t<4.4?1:Math.max(0,(5.5-I.t)/1.1));
  if(I.t>=5.7&&I.final){storyCreditsBegin(false);return}
  if(I.t>=5.7){I.stage='continue';I.t=0;credit.innerHTML='CONTINUA . . .';credit.style.color='#fff';credit.style.opacity='0'}
  return;
 }
 if(I.stage==='continue'){
  credit.style.opacity=String(I.t<.9?I.t/.9:I.t<3.9?1:Math.max(0,(5.0-I.t)/1.1));
  if(I.t>=5.3)storyCreditsBegin(false);
  return;
 }
 if(I.stage==='credits'){
  // Vista aerea continua da cidade; aproveita a camera THREE usada nas cutscenes.
  const E=city.ext,c=city.core||{x:E*.5,z:E*.5},tt=I.t*.075;
  const radius=Math.max(120,Math.min(240,E*.37));camera.up.set(0,1,0);
  camera.position.set(c.x+Math.cos(tt)*radius,Math.min(260,Math.max(130,E*.27)),c.z+Math.sin(tt)*radius);
  camera.lookAt(c.x,1,c.z);sky.position.copy(camera.position);
  setLens(63,.5);
  const H=innerHeight,inner=roll.querySelector('.inner'),h=Math.max(inner.scrollHeight,650),dur=60; /* v78: fonte 2× → rolagem mais longa pra manter a velocidade de leitura */
  const total=(I.creditsTod??1110)+1440*Math.min(1,I.t/dur);DN.tod=total%1440;DN.day=(I.creditsDay||0)+Math.floor(total/1440);updateDayNight(0,true);
  inner.style.transform='translateY('+(H-(I.t/dur)*(H+h+80))+'px)';
  if(I.t>=dur)storyCreditsFinish();
 }
}
function startGame(save){prologueReset();roomStageExit();if(!HAZE.switching)RECLOG.items.length=0;sceneRadioStop();SCENE_RADIO.introSong=null;airSoundReset();STORYEND.active=false;STORYINTRO.active=false;STORYFAIL.active=false;$('#storyFailOverlay').hidden=true;$('#storyCheckpoint').hidden=true;document.body.classList.remove('story-cinematic','story-reunion','story-final-fading');$('#storyRoll').hidden=true;storySkipSync();$('#storyBlack').hidden=true;$('#storyGuide').hidden=true;monStoryShiftSync();$('#storyBlack').style.zIndex='';musicTravelReset();teleportMode=false;if(!save){BANKACC.bal=0;bankDlgClose();PET.adopted=false;PET.catCi=0;PET.smsSent=false;try{EMP.saved=null;EMP.key='';GAMEMODE=modeSel;questLoad(null);duoDrop();storyLoad(null);STORY.fresh=GAMEMODE!=='free'}catch(e){}PL.armor=0;PHONE.models=['android','ios'];PHONE.notif=true;PHONE.msgs=[];CHAR.list.forEach(c=>{c.st=null;c.owned=null;c.cash=0;c.kit=null});CHAR.cur=0;CHAR.list[0].look=null;CHAR.list[1].look={...LUCIA_PAL};CHAR.list.forEach(c=>c.sp=1);NEWS.items=[];NEWS.lastDead=false}SPEC.on=false;SWITCH.on=false;CAMHOP.on=false;setTimeout(charFaces,50);if(!save){S.style='modern';if(GAMEMODE==='campaign')S.hour=7;}TIMEJUMP.busy=false;TIMEJUMP.loading=false;TIMEJUMP.cool=0;TIMEJUMP.armed=true;CHEAT.used=false;if(!save){wearLoad(null,WEAR_DEFAULT);Object.assign(PLAYER_PAL,WEAR_DEFAULT);PLAYER_PAL.capDark=null;applyPlayerLook();SAFE.stored=[null,null];SAFE.conv=null;SAFE.convCar=null;try{loanClear()}catch(e){}SAFE.heliStored=null;if(!BENCH.active)try{localStorage.removeItem('ps_save')}catch(e){}}SAFE.cars=[null,null];S.view='fps';VIEW.tp=true;VIEW.orbit=false;CELLS.length=0;WX.f=0;WX.rainPhase=0;WX.wet=false;WX.lastOpt=undefined;WX.stormCell=null;WX.stormEta=null;WX.pre=0;WX.stormReq=false;WX.stormNext=null;WX.calm=null;WX.freeze=false;WX.cheatStorm=false;WX.postClear=null;WX.stormRoll=null;WX.stormChance=undefined;rebuildRadio();BOOM.rng=null;initAudio();$('#loading').hidden=false;setLoadProgress(0,'GERANDO CIDADE…');
 setTimeout(async()=>{
  try{
   // v176: se a seed não fecha o plano da cidade (falta lugar para um especial etc.), não seguimos com a cidade pela metade:
   // tenta a seed seguinte (até 6 vezes) e avisa. Antes o jogo podia continuar com um plano incompleto (ex.: casas gigantes na ilha).
   {let tries=0;for(;;){try{await generateCity();break}catch(genErr){console.error('Seed '+S.seed+' falhou:',genErr);if(save||++tries>6)throw genErr;S.seed=(S.seed+1)>>>0;setLoadProgress(8,'AJUSTANDO A SEED…')}}if(tries)setTimeout(()=>{try{toast('SEED AJUSTADA<br><small style="font-size:11px;color:#fff">a seed pedida não comportava todos os especiais · usando '+S.seed+'</small>')}catch(e){}},4000)}
   initRiverBoats();applyShadows();
   setLoadProgress(45,'PREPARANDO TEXTURAS E SHADERS…');
   await new Promise(resolve=>requestAnimationFrame(resolve));
   running=true;played=true;setView(S.view,true);$('#hud').hidden=false;if(!BENCH.active)applyInterfaceVisibility();closeMenu();
   if(save){try{applySave(save)}catch(err){console.error(err)}}
   luciaIdleTick(); // v281: Claire ja aparece no mapa antes da primeira transicao
   await warmCityGPU();
   await warmInitialViews();
    if(IS_MOBILE&&S.size===7&&GAMEMODE==='free')toast('MODO MOBILE<br><small style="font-size:11px;color:#fff">cidade 7×7 para rodar leve no celular</small>');
    setLoadProgress(100,'CIDADE PRONTA!');
    if(!BENCH.active){if(!save&&GAMEMODE==='campaign'){if(!storyIntroBegin()){storyAirportSpawn();prologueBegin()}}else saveGame(true);}
  }catch(err){console.error('Erro ao iniciar cidade:',err);running=false;$('#loadText').textContent='ERRO AO GERAR CIDADE — VEJA O CONSOLE';return}
  $('#loading').hidden=true;setLoadProgress(0,'GERANDO CIDADE…');if(BENCH.active&&BENCH.preparing)benchReady();
 },30)}
syncSave();

