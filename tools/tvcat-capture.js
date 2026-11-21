const {chromium}=require('playwright');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ONLY=process.argv[2]||'';const STYLE=process.argv[3]||'';
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));const ev=(f,a)=>p.evaluate(f,a);
 await p.goto('http://127.0.0.1:8777/');await p.waitForFunction(()=>typeof generateCity==='function',null,{timeout:120000});await sleep(2500);
 await ev(()=>{$('#seed').value='716540';$('#seedPlay').click()});await sleep(2500);await ev(()=>$('#mpFree').click());
 await p.waitForFunction(()=>played&&$('#loading').hidden,null,{timeout:1500000,polling:3000});await sleep(2000);
 await ev(()=>{const st=document.createElement('style');st.textContent='body.capmode *:not(canvas){visibility:hidden!important} body.capmode canvas{visibility:visible!important} body.capmode #mini,body.capmode #minimap,body.capmode #mmap{visibility:hidden!important}';document.head.appendChild(st);
  CHEAT.hp=true;callOK=()=>false;PHONE.notif=false;window.toastOrig=window.toast;
  const uc=window.updateCamera;window.CAMOV=null;window.updateCamera=function(dt,s){uc(dt,s);if(window.CAMOV){const c=window.CAMOV;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5])}};
  window.AER=(x,z,h,d,ang,ty)=>{window.CAMOV=[x+Math.cos(ang)*d,h,z+Math.sin(ang)*d,x,ty??1,z]};
  window.TOD=t=>{DN.tod=t;updateDayNight(0,true)};
  window.STEP=(n)=>{for(let i=0;i<n;i++)update(.05)}});
 const shot=async(name,clean=true,wait=2500,rect)=>{if(clean)await ev(()=>document.body.classList.add('capmode'));await sleep(wait);await p.screenshot({path:'/home/claude/cap/'+name+'.png',clip:rect});await ev(()=>document.body.classList.remove('capmode'));console.log('shot',name)};
 const run=(k)=>!ONLY||ONLY.split(',').includes(k);
 const poi=async(name,fn,wait=3500)=>{if(!run(name))return;try{await ev(fn);await shot(name,true,wait)}catch(e){console.log('FAIL',name,e.message.slice(0,200))}await ev(()=>{window.CAMOV=null})};
 if(STYLE==='inv'){await ev(()=>{void invertShiftWorld('inverted')});await p.waitForFunction(()=>S.style==='inverted'&&!INVERT.switching,null,{timeout:900000,polling:3000});await sleep(3000);
   await poi('w_inv1',()=>{CAMOV=null;camMode='chase'},4000);await poi('w_inv2',()=>{const o=INVERT.portal||{x:PL.x,z:PL.z};cheatWarp(o.x+8,o.z+8);AER(o.x,o.z,14,26,.8,4)},5000);}
 else if(STYLE==='haze'){await ev(()=>{void hazeShift(true)});await p.waitForFunction(()=>city.haze&&!HAZE.switching,null,{timeout:900000,polling:3000});await sleep(3000);
   await poi('w_haze1',()=>{TOD(17*60);camMode='chase'},4000);await poi('w_haze2',()=>{TOD(17.5*60);AER(PL.x,PL.z,40,70,2.2,0)},5000);}
 else if(STYLE==='synth'){await ev(async()=>{S.style='synthwave';clearRiverBoats();await generateCity();initRiverBoats();applyShadows();await warmCityGPU();cheatWarp(city.startCar.x,city.startCar.z)});await sleep(4000);
   await poi('w_synth1',()=>{TOD(22*60);const c=makeVehicle('super',PL.x+3,PL.z,0,'#b8bcc4');c.special=true;campBoard(c);camMode='chase'},4000);await poi('w_synth2',()=>{TOD(21*60);AER(PL.x,PL.z,45,80,.6,0)},5000);}
 else{
 await poi('poi_casino',()=>{TOD(21.5*60);const d=city.casino.door;cheatWarp(d.x+10,d.z+10);AER(d.x,d.z,22,40,.9,4)},4000);
 await poi('poi_club',()=>{TOD(23*60);const d=city.casino.clubDoor;cheatWarp(d.x+8,d.z+8);CLUBFX.cool=0;for(let i=0;i<5;i++)clubFxTick(.1);AER(d.x,d.z,9,20,.7,2)},4000);
 await poi('poi_bank',()=>{TOD(11*60);const d=city.bankDoor;cheatWarp(d.x+10,d.z+10);AER(d.x,d.z,20,38,.9,4)});
 await poi('poi_hosp',()=>{TOD(10*60);const d=city.hosp;cheatWarp(d.x+10,d.z+10);AER(d.x,d.z,26,46,.9,3)});
 await poi('poi_police',()=>{TOD(15*60);const d=city.polDoor;cheatWarp(d.x+10,d.z+10);AER(d.x,d.z,24,44,.9,3)});
 await poi('poi_safe',()=>{TOD(18*60);const d=city.safe;cheatWarp(d.x+8,d.z+8);AER(d.x,d.z,20,36,.9,2)});
 await poi('poi_motel',()=>{TOD(19*60);const d=city.motel;cheatWarp(d.x+8,d.z+8);AER(d.x,d.z,24,44,.9,2)});
 await poi('poi_air',()=>{TOD(13*60);const a=city.air;cheatWarp(a.cx+20,a.cz+20);AER(a.cx,a.cz,70,120,.8,0)},5000);
 await poi('poi_bridge',()=>{TOD(12*60);const d=city.dbs[0];cheatWarp(d.cx+30,d.cz+30);try{dbBeginWarning(d);d.override=true}catch(e){}STEP(80);AER(d.cx,d.cz,26,60,.7,3)},4000);
 await poi('poi_forest',()=>{TOD(16*60);const d=city.forest;cheatWarp(d.x,d.z);AER(d.x,d.z,40,70,.9,0)},5000);
 await poi('poi_cem',()=>{TOD(19.5*60);const d=city.mausoleum;cheatWarp(d.x+8,d.z+8);AER(d.x,d.z,16,30,.9,2)});
 await poi('poi_tune',()=>{TOD(14*60);const d=city.tuneSpot;cheatWarp(d.x+6,d.z+6);AER(d.x,d.z,14,26,.9,2)});
 await poi('side_race',()=>{TOD(23*60);const q=SIDE.spots.find(q=>q.k==='race');cheatWarp(q.x+6,q.z+6);AER(q.x,q.z,14,26,.9,2)});
 await poi('side_skull',()=>{TOD(20*60);const q=SIDE.spots.find(q=>q.k==='skull');cheatWarp(q.x+4,q.z+4);AER(q.x,q.z,6,12,.9,1.5)});
 await poi('side_drag',()=>{TOD(23.5*60);const q=SIDE.spots.find(q=>q.k==='drag');cheatWarp(q.x+4,q.z+4);AER(q.x,q.z,10,22,.9,1.5)});
 await poi('poi_beach',()=>{TOD(17.5*60);const q=PARA.sites[0];cheatWarp(q.x,q.z);AER(q.x,q.z,30,60,2.4,0)},4500);
 await poi('obra',()=>{TOD(9*60);OBRA.day=-1;obraTick(.1);const g=OBRA.seg;if(!g)throw new Error('sem obra');const x=g[0]*P+D[g[2]][0]*P/2,z=g[1]*P+D[g[2]][1]*P/2;cheatWarp(x+14,z+14);for(let i=0;i<400&&OBRA.phase!=='on';i++)obraTick(.5);STEP(20);AER(x,z,16,30,.9,0);window.OBRAP=OBRA.phase},4000);
 await poi('int_club',()=>{TOD(23.5*60);casinoEnter('club');STEP(30)},4000);
 await poi('int_casino',()=>{try{casinoExit()}catch(e){}TOD(21*60);casinoEnter();STEP(30)},4000);
 await poi('beach2',()=>{try{casinoExit()}catch(e){}TOD(17.5*60);const q=PARA.sites[1]||PARA.sites[0];const l=q.landings&&q.landings[0]||q;cheatWarp(l.x,l.z);AER(l.x,l.z,20,50,Math.atan2(q.z-l.z,q.x-l.x)+Math.PI,0)},4500);
 await poi('gang_alley',()=>{TOD(17*60);GANG.day=-1;gangTick(.1);const t=GANG.T[0];cheatWarp(t.x+4,t.z+4);gangTick(.1);t.hot=true;STEP(20);AER(t.x,t.z,18,14,.9,0)},3000);
 await poi('jam_day',()=>{TOD(13*60);let best=null;for(let kx=2;kx<city.N-1;kx++)for(let kz=2;kz<city.N-1;kz++){if(isRural(kx*P,kz*P))continue;const n=vehicles.filter(c=>Math.hypot(c.x-kx*P,c.z-kz*P)<90).length;if(!best||n>best.n)best={kx,kz,n}}cheatWarp(best.kx*P+9,best.kz*P+9);ctosInstall(true);jammerReset();jammerFire();STEP(120);AER(best.kx*P,best.kz*P,30,40,.8,0)},3000);
 await poi('jam_night',()=>{jammerReset();TOD(22.5*60);cheatWarp(PL.x+5,PL.z);jammerFire();STEP(5);AER(PL.x,PL.z,55,90,.8,0)},4000);
 await poi('scn_purse',()=>{jammerReset();TOD(11*60);let e=null;for(let i=0;i<30&&!e;i++)e=scnSpawn('purse');SCN.cur=e;const T=e.a;cheatWarp(T.x-e.S.nx*4,T.z-e.S.nz*4);for(let i=0;i<14;i++){scnTick(.1);updatePeds(.1)}AER(T.x,T.z,6,9,Math.atan2(-e.S.nz,-e.S.nx)+.5,1)},2500);
 await poi('scn_chase',()=>{scnEnd(true);let e=null;for(let i=0;i<30&&!e;i++)e=scnSpawn('chase');SCN.cur=e;const T=e.a;cheatWarp(T.x-e.S.nx*4,T.z-e.S.nz*4);for(let i=0;i<22;i++){scnTick(.1);updatePeds(.1)}AER(T.x,T.z,7,11,Math.atan2(-e.S.nz,-e.S.nx)+.5,1)},2500);
 await poi('scn_crash',()=>{scnEnd(true);let e=null;for(let i=0;i<30&&!e;i++)e=scnSpawn('crash');SCN.cur=e;const q=(e.cars&&e.cars[0])||e.a||e.peds[0];cheatWarp(q.x+6,q.z+6);for(let i=0;i<10;i++){scnTick(.1);updatePeds(.1)}AER(q.x,q.z,8,13,.9,1)},2500);
 await poi('scn_stop',()=>{scnEnd(true);let e=null;for(let i=0;i<30&&!e;i++)e=scnSpawn('stop');SCN.cur=e;const q=(e.cars&&e.cars[0])||e.a||e.peds[0];cheatWarp(q.x+6,q.z+6);for(let i=0;i<10;i++){scnTick(.1);updatePeds(.1)}AER(q.x,q.z,8,13,.9,1)},2500);
 await poi('car_dmc',()=>{scnEnd(true);const q=peds.find(carrxPedOK);const c=makeVehicle('super',q.x+4,q.z,0,'#b8bcc4');c.special=true;campBoard(c);c.vx=2;CARRX.cd=0;CARRX.t=0;for(let i=0;i<4;i++)carrxTick(.3);AER(q.x+2,q.z,5,9,2.0,1)},1500);
 await poi('mask_on',()=>{if(PL.car)enterExit();TOD(12*60);cheatWarp(PL.x+20,PL.z);MASK.have=true;maskWear(true);STEP(40);AER(PL.x,PL.z,2.6,5,PL.a||0,1.4)},2000);
 await poi('dirt_car',()=>{TOD(10*60);let rx=null;for(let x=0;x<city.ext&&!rx;x+=20)for(let z=0;z<city.ext;z+=20)if(isRural(x,z)&&!inWater(x,z)){rx={x,z};break}cheatWarp(rx.x,rx.z);const c=makeVehicle('pickup',rx.x+3,rx.z,0,'#f2f2f2');campBoard(c);c.grime=.85;c.dirtT=0;dirtTick(.1);STEP(10);AER(c.x,c.z,3,7,.8,1)},2500);

 for(const k of ['storm','chase','blitz','pollution','parachute','airport']){await poi('tv_'+k,new Function("if(PL.car)enterExit();CAMOV=null;TOD(15*60);PL.inside=true;if(!TVM.on)tvOn();tvChannel('"+k+"');STEP(60)"),3500)}
 await poi('eclipse',()=>{if(TVM.on)tvOff();PL.inside=false;CAMOV=null;cheatRun('ECLIPSE');for(let i=0;i<2400&&!(ECLIPSE.dark>.85);i++)update(.05);AER(PL.x,PL.z,30,60,.8,20)},3500);
 for(const k of ['dog','argue','skate']){await poi('scn_'+k,new Function("try{scnEnd(true)}catch(e){};TOD(10.5*60);let e=null;for(let i=0;i<40&&!e;i++)e=scnSpawn('"+k+"');SCN.cur=e;const q=e.a||e.peds[0];cheatWarp(q.x-e.S.nx*4,q.z-e.S.nz*4);for(let i=0;i<24;i++){scnTick(.1);updatePeds(.1)}AER(q.x,q.z,6,10,Math.atan2(-e.S.nz,-e.S.nx)+.5,1)"),2500)}
 await poi('ship',()=>{try{scnEnd(true)}catch(e){};TOD(16*60);const s=SHIPS.list[0];const q=PARA.sites[0];cheatWarp(q.x,q.z);STEP(5);let sp={x:q.x,z:q.z};try{const a=shipAt(s);sp={x:a.x??a[0],z:a.z??a[1]}}catch(e){}AER(sp.x,sp.z,40,90,2.2,0)},4000);
 await poi('isle',()=>{TOD(16.5*60);const I=city.isle;const x=(I.i+.5)*P,z=(I.j+.5)*P;cheatWarp(x,z);AER(x,z,60,90,.8,0)},4500);
 await poi('int_bank',()=>{TOD(11*60);const d=city.bankDoor;cheatWarp(d.x,d.z);bankEnter();STEP(30)},4000);
 await poi('int_pawn',()=>{try{bankExit&&bankExit()}catch(e){}TOD(13*60);pawnEnter();STEP(30)},4000);
 await poi('int_jail',()=>{try{heistExit&&heistExit()}catch(e){}jailEnter(true);STEP(30)},4000);
 if(run('wanted')){await ev(()=>{if(PL.car)enterExit();TOD(16*60);cheatWarp(city.core.x,city.core.z);startWanted(true);wantedUp(3);STEP(40);openMap()});await sleep(2000);await p.screenshot({path:'/home/claude/cap/map_red.png'});
   await ev(()=>{closeMap();endWanted(true);try{wzFadeAll()}catch(e){}STEP(10);openMap()});await sleep(2000);await p.screenshot({path:'/home/claude/cap/map_blue.png'});await ev(()=>closeMap());
   await ev(()=>{GANG.day=-1;gangTick(.1);openMap()});await sleep(2000);await p.screenshot({path:'/home/claude/cap/map_gang.png'});await ev(()=>closeMap());}
 if(run('police')){await ev(()=>{TOD(16*60);const c=makeVehicle('sports',PL.x+3,PL.z,0,'#d42a2a');campBoard(c);camMode='chase';startWanted(true);wantedUp(2);for(let i=0;i<60;i++){c.thr=1;update(.05)}});await shot('pol_chase',false,2500);await ev(()=>{enterExit();endWanted(true)})}
 if(run('phone')){for(const [n,f] of [['ph_home',()=>{phoneToggle();PHONE.zone='scr';PHONE.si=0;phoneDraw()}],['ph_apps',()=>{ctosInstall(true);PHONE.scr='apps';PHONE.si=0;phoneDraw()}],['ph_prof',()=>{const q=peds.find(carrxPedOK)||peds[0];profOf(q).bal=640;PROF.p=q;PHONE.scr='perfil';PHONE.si=0;phoneDraw()}],['ph_call',()=>{CALL.cur={...CALL_SCRIPTS[0],num:'(21) 98877-1020'};CALL.ring=99;PHONE.scr='incoming';PHONE.si=0;phoneDraw()}]]){await ev(f);await sleep(800);const r=await ev(()=>{const e=PHONE.el.getBoundingClientRect();return{x:e.left-20,y:Math.max(0,e.top-20),width:e.width+40,height:Math.min(720,e.height+40)}});await p.screenshot({path:'/home/claude/cap/'+n+'.png',clip:r});console.log('shot',n)}
   await ev(()=>{phoneToggle();PROF.hack={p:PROF.p,t:3.5,dur:7,warn:0};PROF.p.x=PL.x-12;PROF.p.z=PL.z;profTick(.05)});await sleep(600);await p.screenshot({path:'/home/claude/cap/ph_pix.png',clip:{x:340,y:520,width:600,height:120}});await ev(()=>{PROF.hack=null;profTick(0)})}
 }
 console.log('ERRS',JSON.stringify(errs.slice(0,5)));await b.close()})();
