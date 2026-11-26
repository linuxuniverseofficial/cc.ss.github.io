'use strict';
/* Coastal Chaos · js/45-atualizacao-hud.js — update() do mundo por quadro, HUD e render.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
const UPD_ACT=[],UPD_SD=[-.42,.42],UPD_MOTO=[0,0];/* v3 r5: listas fixas do update (antes filter/literais por quadro) */
function update(dt){if(SKATE.ui)return;if(POOL.on){poolTick(dt);return}if(DICE.on){diceTick(dt);return}luciaIdleTick();if(roomStageKind()&&!BENCH.active){roomStageLocalTick(dt);return}crimeRoll();if(DLG.on){dlgTick(dt);return}paraTick(dt);try{dealTick(dt)}catch(e){console.error(e)}try{storyTick();duoTick(dt);questTick(dt);sideTick(dt);forestTick(dt);jetTick(dt);vortexTick();dbTick(dt);shipTick(dt);airTick2(dt);casinoTick(dt);motelTick(dt);labTick(dt);clubFxTick(dt);bankTick(dt);empTick(dt);brWorldTick(dt)}catch(e){console.error(e)}try{areaHudTick(dt)}catch(e){console.error(e)}cheatTick();maskTick(dt);jammerTick(dt);try{profTick(dt)}catch(e){console.error(e)}updateCloseCarDetails(dt);updateIndustrialGates(dt);carGeoPrewarmTick(dt);
 simT+=dt;updateDayNight(dt);csTick();riverBoatsTick(dt);
 updatePlayer(dt);if(PL.car||PL.dead)stamIdle(dt);try{skTick(dt)}catch(e){console.error(e)}try{loanTick(dt)}catch(e){console.error(e)}jailTick(dt);updateSafe(dt);heistTick(dt);v67Tick(dt);try{aqTick(dt)}catch(e){console.error(e)}try{ghostTick(dt)}catch(e){console.error(e)}misUpdate(dt);updateTune();
 buildCarHash();buildLanes();
 const _profTraffic=MON.on?performance.now():0;
 const ctr=BENCH.running?BENCH.focus:(TVM.on?TVM.foc:PL.car||PL),RP=72;
 for(let i=0;i<vehicles.length;i++){const c=vehicles[i];if(c===PL.car||c.mode==='parking')continue;
  if(c.chase){policeDrive(c,dt);continue}
  if(c.taxiAI){taxiAI(c,dt);continue}
  if(c.svc){svcAI(c,dt);continue}
  if(c.weaponPanic&&panicCarTick(c,dt))continue;
  if(c.tollHold>0){c.tollHold-=dt;c.thr=0;c.hand=true;c.steerT=0;continue}
  if(c.polBoat){polBoatAI(c,dt);continue}
  if(c.mode==='rail'){
   const _tx=c.x-ctr.x,_tz=c.z-ctr.z,_dist2=_tx*_tx+_tz*_tz;
   if(_dist2<RP*RP&&!c.rail.nr){if(c._railDelay){railUpdate(c,c._railDelay);c._railDelay=0}toPhys(c)}
   else{
    // Trafego muito distante: atualizacao logica agrupada, mantendo velocidade media.
    // Carros perto continuam a 100% da taxa original.
    if(_dist2>240*240&&!c.police&&!c.chase){c._railDelay=(c._railDelay||0)+dt;if(c._railDelay>=.08){railUpdate(c,c._railDelay);c._railDelay=0}}
    else{if(c._railDelay){railUpdate(c,c._railDelay);c._railDelay=0}railUpdate(c,dt)}
    continue
   }
  }
  if(c.ai){if(!c.crim&&Math.hypot(c.x-ctr.x,c.z-ctr.z)>RP+18&&tryRail(c))continue;aiUpdate(c,dt)}}
 for(const c of vehicles){
  c.turnSig=0;
  if(c===PL.car||!c.alive||c.police||c.chase)continue;
  const r=c.mode==='rail'?c.rail:null,ai=c.ai;
  if(r&&r.nd!=null&&r.nd!==r.d){
   const dist=r.turn?0:Math.max(0,SEG_END-r.s);
   if(r.turn||dist<=Math.max(3,r.v)*1.0+1)c.turnSig=(D[r.d][0]*D[r.nd][1]-D[r.d][1]*D[r.nd][0])>0?1:-1;
  }else if(ai&&ai.nd!=null&&ai.nd!==ai.d){
   const v=Math.max(2,Math.abs(c.fwd)),progress=(c.x-ai.kx*P)*D[ai.d][0]+(c.z-ai.kz*P)*D[ai.d][1];
   if(progress>=SEG_END-v*1.0-1)c.turnSig=(D[ai.d][0]*D[ai.nd][1]-D[ai.d][1]*D[ai.nd][0])>0?1:-1;
  }
 }
 if(BENCH.running&&BENCH.wave&&!BENCH.wave.detonated)for(const pair of BENCH.wave.pairs)for(const c of [pair.suspect,pair.police])if(c.alive){c.hp=Math.max(c.hp,100);c.fuse=0}
 const act=UPD_ACT;act.length=0;for(let i=0;i<vehicles.length;i++){const c=vehicles[i];if(c.mode==='phys'&&!c.sleep)act.push(c)}for(const c of act){rampTick(c,dt);dbCar(c,dt);airTick(c,dt)}
 /* v3 r27: barcos e jet skis parados (sleep: não passam pelo syncCar) também balançam com a ondulação — só os visíveis a <160 m da câmera */
 for(let i=0;i<vehicles.length;i++){const c=vehicles[i];if(!c.sleep||!c.t.boat||!c.g||!c.g.visible||!c.alive||c.sunk)continue;const dx=c.x-camera.position.x,dz=c.z-camera.position.z;if(dx*dx+dz*dz>25600)continue;
  if(c.type==='jetski'&&!boatOK(c.x,c.z))continue;const w=waterBob(c.x,c.z,simT),bt=bobTilt(c,1),lv=waterLevel(c.x,c.z);if(c.bob0===undefined)c.bob0=clamp(c.g.position.y-lv,-.3,.3);c.g.position.y=lv+c.bob0+w.h;if(c.ch)c.ch.rotation.set(bt[1],0,bt[0])}
 for(const c of act){c.ws[0]=c.ws[1]=c.ws[2]=c.ws[3]=0}
 const SUB=4,h=dt/SUB;
 for(let s=0;s<SUB;s++){
  for(const c of act){c.px=c.x;c.pz=c.z;c.pa=c.a;c.wet=c.t.hover&&inWater(c.x,c.z);if(c.t.boat||c.wet)boatStep(c,h);else carStep(c,h)}
  for(const c of act)if(!c.t.boat&&!c.wet){carVsWorld(c);if(c===PL.car)dbPlayerCarRamp(c);else if((c.airY||0)<=.01)dbWallActor(c,c.px,c.pz,h,Math.max(.7,c.t.L*.46))}
  for(const A of act)for(const B of carsNearTmp(A.x,A.z,A.t.R+9)){if(B===A||B.mode!=='phys')continue;if(!B.sleep&&B.id<A.id)continue;carVsCar(A,B)}
  if(ONLINE.on&&PL.car)netSubHit(); /* v3 r27: o meu carro contra os carros remotos (jogadores e trânsito do servidor) */
 }
 clubDriveTick(dt);
 tommyTick(dt);
 parkingVisitorTick(dt);
 for(const c of vehicles){if(c.mode==='rail'){ensureDetail(c);if(c.g)syncCar(c,dt);continue}
  if(!c.t.boat&&!c.t.hover&&!(c.airY>0)&&!(c.rampY>0)&&!c.sunk&&inWater(c.x,c.z)){c.sunk=true;c.alive=false;c.hp=0;c.sinkT=0;c.thr=0;c.ai=null;for(let i=0;i<24;i++)emit(c.x,waterLevel(c.x,c.z)+.4,c.z,(Math.random()-.5)*6,2+Math.random()*5,(Math.random()-.5)*6,.9,.6,.2,0xd8ecff,false,.9);
   if(c===PL.car){PL.car=null;PL.lastCar=c;PL.x=c.x;PL.z=c.z;$('#speed').hidden=true;$('#carbar').hidden=true;killPlayer('AFOGADO')}}
  if(c.ovF){c.ovT=(c.ovT||0)+dt;if(c.ovT>.5&&c.alive){const o=c.ovW;setOnFire(c);c.fuse=.25;if(o&&o.alive){setOnFire(o);o.fuse=.3}}}else c.ovT=0;c.ovF=false;
  if(c.sunk){c.sinkT+=dt;c.vx*=.96;c.vz*=.96;c.w*=.95;c.sleep=false}
  if(!c.sleep&&!c.ai&&!c.sunk&&c!==PL.car){const sp=Math.hypot(c.vx,c.vz);if(sp<.08&&Math.abs(c.w)<.05){c.sleepT+=dt;if(c.sleepT>1){c.sleep=true;c.vx=c.vz=c.w=0;c.thr=0}}else c.sleepT=0}
  if(!c.alive&&!c.sunk)fireTick(c,dt);
  ensureDetail(c);
  if(c.g){const d2=(c.x-camera.position.x)**2+(c.z-camera.position.z)**2;c.g.visible=(c.bench&&BENCH.running||c===PL.car||d2<(camMode==='top'?220*220:360*360))&&!(TIMEJUMP.hide&&c===PL.car&&!TIMEJUMP.show)}
  if(c.sleep)continue;
  syncCar(c,dt);
  if(!c.t.boat)for(let k=0;k<4;k++){if(c.type==='moto'&&k!==2)continue;const on=c.ws[k]>2.6&&Math.hypot(c.vx,c.vz)>2;let p=c.wp[k];if(c.type==='moto'){p=UPD_MOTO;p[0]=c.x-Math.cos(c.a)*c.t.wb;p[1]=c.z-Math.sin(c.a)*c.t.wb}
   if(on){if(c.skid[k])addSkid(c.skid[k][0],c.skid[k][1],p[0],p[1],c.gy+.03);{const b=c.skid[k]||(c._skB||(c._skB=[[0,0],[0,0],[0,0],[0,0]]))[k];b[0]=p[0];b[1]=p[1];c.skid[k]=b}
    if(R2()<dt*(c===PL.car?14:5))emit(p[0],.3+c.gy,p[1],(R2()-.5),.6+R2(),(R2()-.5),1.1,.8,3.4,STYLES[S.style].synth?0x6a5a80:0xcfcac2,false,.35)}
   else c.skid[k]=null}
  if((c.special||c.hasNitro)&&c.alive&&c.g&&Math.hypot(c.x-camera.position.x,c.z-camera.position.z)<160){const ca=Math.cos(c.a),sa=Math.sin(c.a),pw=c.nitro?1:!c.special?-1:c.thr>0?.55:.18,n=c.nitro?3:1;
   for(let k=0;k<n;k++)for(const sd of UPD_SD){if(R2()>pw+.15)continue;const bx=c.x-ca*(c.t.L/2+.15)-sa*sd,bz=c.z-sa*(c.t.L/2+.15)+ca*sd,sp=(c.nitro?9:4)*(.6+R2()*.6);
    emit(bx,c.gy+.45,bz,c.vx*.9-ca*sp+(R2()-.5),(R2()-.3)*.6,c.vz*.9-sa*sp+(R2()-.5),c.nitro?.22:.13,c.nitro?.75:.45,.08,R2()<.35?0xbfe8ff:0x2a7bff,true,1)}}
  if(c.alive&&c.hp<35&&R2()<dt*(c.hp<18?12:5)){const ca=Math.cos(c.a),sa=Math.sin(c.a);emit(c.x+ca*c.t.L*.35,c.gy+1.2,c.z+sa*c.t.L*.35,(R2()-.5)*.6,1.5+R2(),(R2()-.5)*.6,1.8,1,4,0x8a8a8a,false,.55)}
 }
 for(const c of vehicles)if(c.police&&c.g)policeVisual(c);updatePolice(dt);
 writeInstances();updateTrafficLights(dt);try{nrTrafficTick(dt)}catch(e){console.error('[neon road traffic]',e)}
 if(MON.on)PERF.traffic+=performance.now()-_profTraffic;
 const _profPeds=MON.on?performance.now():0;
 updatePeds(dt);netFrame(dt);npcMingleTick(dt);pedevTick(dt);try{obraTick(dt)}catch(err){console.error('[obra]',err)}try{carrxTick(dt)}catch(err){console.error('[carrx]',err)}try{gangTick(dt)}catch(err){console.error('[gang]',err)}try{scnTick(dt)}catch(err){console.error('[cenas]',err);try{scnEnd(true)}catch(e2){}SCN.cur=null}if(MON.on){PERF.peds+=performance.now()-_profPeds;PERF.frames++}updateFallers(dt);newsTick();updatePickups(dt);
 weaponTick(dt);updateGrenades(dt);remoteTick(dt);updateDecals(dt);myTick(dt);
 if(!PL.dead&&!PL.car&&!PL.heli&&!PARA.active&&!PL.inside&&!LH.fall&&!SKATE.ride?.dbFlight&&drownAt(PL.x,PL.z))drown();
 if(boomT>0){boomT-=dt;boomLight.intensity=Math.max(0,boomT/.7)*10}
 updateVehicleWrecks(dt);
 popT-=dt;if(popT<=0&&(!PL.inside||TVM.on)){popT=.35;const pp=BENCH.running?BENCH.focus:(TVM.on?TVM.foc:PL.car||PL);
  for(const c of vehicles.slice()){if(c===PL.car||c.mode==='rail'||c.ai)continue;if(Math.hypot(c.x-pp.x,c.z-pp.z)>3*P+60&&c!==PL.lastCar&&!c.keep&&(!c.sleep||!c.alive))removeVehicle(c)}
  buildLanes();populate(false);patioTick();residentialPedTick(.35);
  for(const c of vehicles.slice())if(c.sunk&&c.sinkT>7&&c!==PL.car)removeVehicle(c);
  for(const chk of city.chunks.values())if(chk.beach)for(const sp of chk.beach){const near=Math.hypot(sp.x-pp.x,sp.z-pp.z)<(MOB_LITE?120:180);if(!near){if(sp.p&&peds.includes(sp.p)&&['lie','goto'].includes(sp.p.state))removePed(sp.p);sp.p=null;sp.t=0;continue}if(DN.nightF>.5){if(sp.p&&peds.includes(sp.p))removePed(sp.p);sp.p=null;sp.t=0;continue}if(sp.p&&peds.includes(sp.p)&&sp.p.state!=='dead')continue;sp.p=null;if(rainAt(sp.x,sp.z)>.08){sp.t=0;continue}sp.t+=.35;
   if(sp.t>8+Math.random()*25){const dI=inland();const q=spawnLying(sp.x+dI[0]*(14+Math.random()*10),sp.z+dI[1]*(14+Math.random()*10),pick2(BEACH_PALS));q.state='goto';q.rot=0;q.tx=sp.x;q.tz=sp.z;q.lieNs=sp.ns;sp.p=q;chk.peds.push(q);sp.t=0}}
  for(const p of peds.slice()){if(!p.fixed&&Math.hypot(p.x-pp.x,p.z-pp.z)>3*P+20){removePed(p)}}
  const free=peds.filter(q=>!q.fixed);if(free.length>pedTarget()){free.sort((a,b)=>Math.hypot(b.x-pp.x,b.z-pp.z)-Math.hypot(a.x-pp.x,a.z-pp.z));for(let i=0;i<free.length-pedTarget();i++)removePed(free[i])}
  for(let i=free.length;i<pedTarget();i++)spawnPed({x:pp.x,z:pp.z,min:40,max:3*P-10});
  if(city.doors&&R2()<.4&&free.length<pedTarget()+4){const cand=[];for(const[ri,ds] of city.doors){const r=city.rects[ri];if(Math.abs((r[0]+r[2])/2-pp.x)>170||Math.abs((r[1]+r[3])/2-pp.z)>170)continue;for(const d of ds){if(d.cd&&d.cd>DOOR_NOW())continue;const dd=Math.hypot(d.x-pp.x,d.z-pp.z);if(dd>18&&dd<140)cand.push(d)}}
   if(cand.length){const d=cand[Math.floor(R2()*cand.length)];d.cd=DOOR_NOW()+25+R2()*20; // v78: cada porta solta no máx. 1 pedestre a cada 25–45 s (porta isolada não vira fonte contínua)
   const p=spawnPed({x:d.x,z:d.z,min:0,max:1});p.strip=null;p.ri=d.ri;p.r=perim(d.ri);p.x=d.x;p.z=d.z;p.state='fromDoor';p.wp=[[d.ox,d.oz]];
    p.fin=0;p.sp.material.alphaTest=.02;p.sp.material.opacity=p.sh.material.opacity=0;p.sp.material.needsUpdate=true}}
  if(R2()<.06&&peds.filter(q=>q.state==='talk').length<6){const p=spawnPed({x:pp.x,z:pp.z,min:30,max:120});if(p.strip||!p.r||!city.info[p.ri]||city.info[p.ri].kind==='park'){removePed(p)}else{
   const q=spawnPed({x:p.x,z:p.z,min:0,max:1});q.strip=null;q.ri=p.ri;q.r=p.r;q.t=p.t+1.15;const pt=pedPoint(q);q.x=pt[0];q.z=pt[1];const T=12+R2()*20;
   for(const[a,b] of [[p,q],[q,p]]){a.state='talk';a.timer=T+R2()*2;a.mate=b;a.leaveDir=R2()<.5?1:-1;a.fin=0;a.sp.material.alphaTest=.02;a.sp.material.opacity=a.sh.material.opacity=0;a.sp.material.needsUpdate=true}
   p._npcChatLeader=true;q._npcChatLeader=false;p._npcVoiceTurn=false;p._npcVoiceAt=simT+.35;}}
 }
 if(city.chimneys&&city.chimneys.length&&S.style!=='inverted'){const pp=PL.car||PL;for(const c of city.chimneys){if(Math.abs(c.x-pp.x)>240||Math.abs(c.z-pp.z)>240)continue;const dd=Math.hypot(c.x-pp.x,c.z-pp.z);if(Math.random()<dt*(dd<115?1.35:.48))emit(c.x,c.y,c.z,(WX.wx||1.5)*.4+(Math.random()-.5),1.6+Math.random(),(WX.wz||.8)*.4+(Math.random()-.5),4.2,2,8,STYLES[S.style].synth?0x4a4458:0x9a9894,false,.45)}}
 manholeSmokeTick(dt); /* v3 r36 */
 invertTick(dt);hazeTick(dt);heliTick(dt);taxiTick(dt);ambTick(dt);phoneTick(dt);try{animalsTick(dt);petsTick(dt)}catch(e){console.error(e)}heldGunTick();worldUpdate(dt);updateParts(dt);timeJumpTick(dt);
}
function syncVehicleHUD(){const c=PL.car,show=!!c&&!PL.dead;$('#vbars').hidden=!show;$('#carbar').hidden=!show;$('#speed').hidden=!show;$('#fuelbar').hidden=!(show&&c.alive&&!c.t.boat&&Number.isFinite(c.fuel))}
/* v3 r5: HUD sem lixo por quadro — o elemento fica guardado e só escreve (e só monta a string) quando o valor muda.
   Antes: querySelector + string nova + nó de texto novo a cada quadro em vida/colete/velocidade/dinheiro/munição. */
const HUDC=new Map();
function hudEl(sel){let e=HUDC.get(sel);if(e===undefined||e===null||!e.isConnected){e=document.querySelector(sel);HUDC.set(sel,e)}return e}
function hudW(sel,v){const e=hudEl(sel);if(e&&e._hw!==v){e._hw=v;e.style.width=v+'%'}}
function hudTx(sel,v){const e=hudEl(sel);if(e&&e._ht!==v){e._ht=v;e.textContent=v}}
function updateHUD(dt){if(TBAR.own&&simT-TBAR.t>.4){$('#tbar').hidden=true;TBAR.own=null}
 syncVehicleHUD();$('#taxiRideHint').hidden=!(PL.taxi&&TAXI.state==='ride');
 hudW('#hpbar i',Math.max(0,PL.hp));{const lk=charLock(),cs=$('#chsel');if(cs&&(cs.classList.contains('locked')!==lk||cs.classList.contains('vehicle')!==!!PL.car)){if(lk&&CHAR.open)charClose(false);charSelPaint()}}hudW('#armbar u',clamp(PL.armor||0,0,100));
 if(PL.car){const sp=Math.round(Math.abs(PL.car.fwd)*3.6),se=hudEl('#speed');if(se&&se._hs!==sp){se._hs=sp;se.firstChild.nodeValue=sp}{const rv=PL.car.fwd<-.3;if(se&&se._rv!==rv){se._rv=rv;se.classList.toggle('rev',rv)}}hudW('#carbar i',Math.max(0,PL.car.hp))}
 let near=false;if(!PL.car&&!PL.dead)for(const c of carsNearTmp(PL.x,PL.z,9)){if(c.alive&&Math.hypot(c.x-PL.x,c.z-PL.z)-c.t.W/2<5.5){near=true;break}}
 $('#prompt').hidden=!near;
 {const mv=PL.money||0,bk=Math.round(BANKACC.bal||0),me=hudEl('#money');if(me&&(me._hm!==mv||me._hb!==bk)){me._hm=mv;me._hb=bk;if(bk>0)me.innerHTML='$ '+mv+'<small class="bkHud">'+(S.lang==='en'?'BANK':'CONTA')+' $ '+bk+'</small>';else me.textContent='$ '+mv}}touchVisible();$('#gun').hidden=!GUN.has;if(GUN.has){hudTx('#gun b',GUN.ammo);hudTx('#gun span',WPN[GUN.w].name)}$('#xhair').hidden=!(GUN.has&&camMode==='fps'&&!PL.heli);
 if(POL._mgSync!==!!POL.wanted){POL._mgSync=!!POL.wanted;try{mgModeSync()}catch(e){}}
 $('#wanted').hidden=!POL.wanted;if(POL.wanted){{const lv=Math.max(1,POL.level||1),s='★'.repeat(lv)+'<i>'+'★'.repeat(3-lv)+'</i>',el=$('#wStars');if(el.dataset.s!==s){el.dataset.s=s;el.innerHTML=s}}
  const pc=PL.car||PL,cr=WZ.crime;
  const distance=cr?Math.hypot(pc.x-cr.x,pc.z-cr.z):0;
  {const wk=PL.inside?-1:POL.bustT>0?-2:Math.floor(distance)*100000+wzEscapeDistance(),we=hudEl('#wantedTxt');if(we&&we._hk!==wk){we._hk=wk;we.textContent=PL.inside?'PERSEGUIÇÃO ATIVA · SAIA DO INTERIOR':POL.bustT>0?'VOCÊ ESTÁ SENDO PRESO!':`FUJA DO CRIME · ${Math.floor(distance)} / ${wzEscapeDistance()} m`}}
 }
 v67Hud(dt);try{hudAutoTick()}catch(e){console.error(e)}$('#jailBailTag').hidden=true;if(PL.inside==='jail'){$('#ctxp').hidden=true;$('#prompt').hidden=true;}if(toastT>0)toastT-=dt;tickNotes(dt);
 drawMinimap();
}
function render(){roomStageSync();if(DBGWF.obj)dbgWfTick();if(ROOM_STAGE.mode){CLDSH.A.x=0;skyMat.uniforms.csSun.value=0}actorSpriteRenderIntegrity();if(!ROOM_STAGE.mode){syncFogDrawDistance();syncCarWheelInstances()}else{CAR_WHEEL_IM.count=0;CAR_HUB_IM.count=0}isoFadeTick(menuOpen?0:Math.min(.05,ISOFADE.lastTime?Math.max(0,(performance.now()-ISOFADE.lastTime)/1000):1/60));ISOFADE.lastTime=performance.now();if(city.chunks&&!ROOM_STAGE.mode)cullChunks();syncPartInstances(camera);
 if(ITS.on){itsSync();renderer.render(scene,camera);return} /* v79r12: IMPOSSIBLETOSEE — sem sombra, reflexo nem bloom */
 if(S.shadows&&!ROOM_STAGE.mode&&(simT-shadowRefreshAt>=1/30||simT<shadowRefreshAt)){renderer.shadowMap.needsUpdate=true;shadowRefreshAt=simT}
if(!ROOM_STAGE.mode)try{renderReflection()}catch(e){console.error(e);S.refl=false}const st=STYLES[S.style];const nb=!st.night&&DN.nightF>.45;if(composer&&S.bloom&&(st.bloom||nb||PL.inside==='mall'||PL.inside==='backrooms')){bloomPass.threshold=st.night?.62:.7;bloomPass.radius=.4;bloomPass.strength=st.night?(camMode==='top'?.5:.68)*(.3+.7*DN.nightF):.4*DN.nightF;if(PL.inside==='mall'){bloomPass.threshold=.74;bloomPass.radius=.38;bloomPass.strength=st.night?.62:.5}else if(PL.inside==='backrooms'){bloomPass.threshold=.82;bloomPass.radius=.45;bloomPass.strength=.4}else if(PL.inside)bloomPass.strength*=.3;bloomResFit();composer.render()}else renderer.render(scene,camera)}
