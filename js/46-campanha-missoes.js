'use strict';
/* Coastal Chaos · js/46-campanha-missoes.js — Campanha: missões 2 a 5.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v2 r26 · CAMPANHA: MISSÕES 2 A 5 =================
   Motor próprio (CAMP) ao lado do prólogo (missão 1 continua no PROLOGUE, intocada).
   Cada missão = lista de etapas {id, who (0 Nathan · 1 Claire), obj, sub, cp (checkpoint), fail{wanted,car}, allow[], enter(V), tick(dt,V), skip(V)}.
   - Começo: depois da missão anterior, X s de jogo livre → SMS + "!" no mapa (missionTargets) → chegar no ponto começa a missão.
   - Falha (morte via killPlayer/respawnPlayer → storyMissionFail, procurado, carro destruído…) → tela de falha e volta ao último checkpoint.
   - Fim: SEM tela preta. O jogador continua onde está e aparece "MISSÃO CONCLUÍDA" com fundo escuro (campDoneShow).
   - Variáveis que atravessam missões ficam em STORY.vars (vão no save): ponto de troca, carro e roupas da fuga, máscara usada, final.
   - Ctrl+Shift+F9 (missionDebugSkip) e campDebugNext() pulam a etapa atual (teste). */
var CAMP={cars:{},id:null,st:null,t:0,cut:false,allow:new Set(),cp:null,failing:false,failT:0,actors:[],gang:{gang:[]},marks:[],tgt:null,tgts:[],flags:{},hookT:0,doneT:0,wasDead:false};
const CAMP_TONY_PAL={...CLERK_PAL,cap:'#3a3a30',capDark:'#2a2a20',shirt:'#5a5a48',stripe:null,glasses:'#1b1b1b'};
const CAMP_LANG_PAL={...CLERK_PAL,cap:null,capDark:null,shirt:'#2a2a34',stripe:'#d0d0d8',pants:'#1a1a22',hair:'#b8b8b8',glasses:'#121218'};
function campLook(i){return{...(i===CHAR.cur?PLAYER_PAL:(CHAR.list[i].look||(i?LUCIA_PAL:WEAR_DEFAULT))),pack:false}}
const CAMP_WHO={N:{name:'NATHAN',pal:()=>campLook(0)},C:{name:'CLAIRE',pal:()=>campLook(1)},T:{name:'TONY',pal:()=>({...CAMP_TONY_PAL})},V:{name:'VICTOR',pal:()=>({...CAMP_LANG_PAL})},R:{name:'CLAIRE (RÁDIO)',pal:()=>campLook(1)},P:{name:'VICTOR (TELEFONE)',pal:()=>({...CAMP_LANG_PAL})}};
function campV(){if(!STORY.vars||typeof STORY.vars!=='object')STORY.vars={};if(!STORY.vars.hook)STORY.vars.hook={};return STORY.vars}
function campM(id){return CAMP_MISSIONS.find(m=>m.id===(id||CAMP.id))||null}
function campDist(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function campMe(){return PL.heli||PL.car||PL}
function campHour(h){DN.tod=Math.round(h*60)%1440;try{updateDayNight(0,true)}catch(e){}}
/* ---------- conversa: [[quem,'fala'],…] em blocos por falante; opções no último bloco ---------- */
function campTalk(seq,done,choices){const groups=[];for(const [w,t] of seq){const g=groups[groups.length-1];if(g&&g.w===w)g.lines.push(t);else groups.push({w,lines:[t]})}
 CAMP.cut=true;missionModeSync();let i=0;const next=res=>{if(res===-1&&!(choices&&i>=groups.length)){i=groups.length}
  if(i>=groups.length){if(choices&&(res==null||res<0)&&groups.length){const g=groups[groups.length-1],W=CAMP_WHO[g.w]||CAMP_WHO.N;dlgOpen({name:W.name,pal:W.pal(),lines:[g.lines[g.lines.length-1]],choices,onEnd:r=>{if(r<0)return next(-2);CAMP.cut=false;missionModeSync();if(done)done(r)}});return}
   CAMP.cut=false;missionModeSync();if(done)done(res);return}
  const g=groups[i++],W=CAMP_WHO[g.w]||CAMP_WHO.N,last=i>=groups.length;dlgOpen({name:W.name,pal:W.pal(),lines:g.lines,choices:last?choices:undefined,onEnd:r=>{if(last&&choices&&r>=0){CAMP.cut=false;missionModeSync();if(done)done(r);return}next(last&&choices?-2:r)}})};
 next(0)}
/* ---------- atores (peds de história) e marcadores ---------- */
function campActor(who,x,z,face){const W=CAMP_WHO[who]||CAMP_WHO.N;const q=spawnPed(null,{x,z,vx:0,vz:0,main:true,pal:W.pal()});if(!q)return null;q.state='clerk';q.fixed=true;q.at={x,z};q.mx=face?face[0]:PL.x-x;q.mz=face?face[1]:PL.z-z;q.timer=0;q.campActor=who;q.noFlee=true;CAMP.actors.push(q);try{actorShowNow(q,q.mx,q.mz)}catch(e){}return q}
function campActorDrop(q){if(!q)return;if(peds.includes(q))removePed(q);const i=CAMP.actors.indexOf(q);if(i>=0)CAMP.actors.splice(i,1)}
function campActorsClear(){for(const q of CAMP.actors.slice())campActorDrop(q);CAMP.actors=[]}
function campGangAdd(n,wpn,x,z,spread,pal){const e=CAMP.gang;const k0=e.gang.length;empGang(e,n,wpn,x,z,spread);for(let k=k0;k<e.gang.length;k++){const q=e.gang[k];q.campGang=true;if(pal){q.pal={...pal};try{pedExact(q)}catch(err){}}}return e.gang.slice(k0)}
function campGangAlive(){return CAMP.gang.gang.filter(q=>peds.includes(q)&&q.state!=='dead'&&q.hp>0)}
function campGangClear(){for(const q of CAMP.gang.gang)if(peds.includes(q))removePed(q);CAMP.gang.gang=[]}
function campMark(x,z,sc){const a=makeArrow();if(sc)a.scale.setScalar(sc);a.position.set(x,-9999,z);scene.add(a);a.userData.campAt={x,z};CAMP.marks.push(a);return a}
function campMarksClear(){for(const a of CAMP.marks)scene.remove(a);CAMP.marks=[]}
function campMarksTick(){for(const a of CAMP.marks){const p=a.userData.campAt;a.position.set(p.x,(p.y||0)+1.6+Math.sin(simT*3)*.18,p.z);a.rotation.y=simT*1.8;a.visible=!PL.car&&Math.hypot(PL.x-p.x,PL.z-p.z)<60}}
function campGPS(p){CAMP.tgt=p?{x:p.x,z:p.z}:null;if(p)misGPS(p.x,p.z);else storyClearObjective()}
function campTargets(list){if(!CAMP.id)return;if(CAMP.tgt)list.push({x:CAMP.tgt.x,z:CAMP.tgt.z,active:true,id:'camp'});for(const q of CAMP.tgts)list.push({x:q.x,z:q.z,active:false,id:'camp2'})}
/* ---------- lugares ---------- */
function campPoi(k){try{
 if(k==='motel'){const d=motelDoor();if(d)return{x:d.x+d.nx*2,z:d.z+d.nz*2};const t=prologueMotelTarget();return t}
 if(k==='bank'){const d=bankDoor();return d?{x:d.x,z:d.z}:null}
 if(k==='pawn'){const p=HEIST.pawn;return p?{x:p.x+p.nrm[0]*1.5,z:p.z+p.nrm[1]*1.5}:null}
 if(k==='ammo')return AMMO.pos?{x:AMMO.pos.x,z:AMMO.pos.z}:null;
 if(k==='safe'){const s=city.safe;return s?{x:s.x+s.nx*2.3,z:s.z+s.nz*2.3}:null}
 if(k==='tune'){const t=city.tuneSpot;return t?{x:t.x,z:t.z}:null}
 if(k==='casino'){const K=city.casino;return K?{x:K.door.x,z:K.door.z}:null}
 if(k==='club'){const K=city.casino;return K?{x:K.clubDoor.x,z:K.clubDoor.z}:null}
 if(k==='mall'){const q=mapPoiEntries().find(e=>e.k==='mall');return q?{x:q.x,z:q.z}:null}
 if(k==='lh'){const L=city.lh;if(!L)return null;const p=wTU(L.s,L.t,SHORE-7);return{x:p[0],z:p[1],a:Math.atan2(L.sea[1],L.sea[0])}}
 if(k==='lab'){const h=LAB.hatch;return h?{x:h.x+h.nx*1.8,z:h.z+h.nz*1.8}:null}
 if(k==='polheli'){const h=HELI.list.find(q=>q.police&&q.state==='parked'&&q.o)||HELI.list.find(q=>q.police);return h?{x:h.x??h.pad.x,z:h.z??h.pad.z,h}:null}
}catch(e){console.warn('[campanha] lugar',k,e)}return null}
function campCurb(p,off){if(!p)return null;const c=curbPoint(p.x+(off?off[0]:0),p.z+(off?off[1]:0));return{x:c[0],z:c[1]}}
/* 3 pontos de troca: estacionamento perto do centro, ponte do canal e o píer. Fallback: calçadas espalhadas. */
function campDropPoints(){const E=city.ext||400,out=[];const add=(x,z,n,en)=>{if(!Number.isFinite(x)||!Number.isFinite(z))return;if(out.some(o=>Math.hypot(o.x-x,o.z-z)<120))return;const c=curbPoint(x,z);if(inWater(c[0],c[1]))return;out.push({x:c[0],z:c[1],n,en})};
 try{const L=(city.parkingLots||[]).filter(l=>Number.isFinite(l.x0)).map(l=>({x:(l.x0+l.x1)/2,z:(l.z0+l.z1)/2})).sort((a,b)=>Math.hypot(a.x-E/2,a.z-E/2)-Math.hypot(b.x-E/2,b.z-E/2))[0];if(L)add(L.x,L.z,'ESTACIONAMENTO DO CENTRO','DOWNTOWN PARKING')}catch(e){}
 try{const d=(city.dbs||[])[0];if(d){for(const o of [[14,0],[-14,0],[0,14],[0,-14]]){const n=out.length;add(d.cx+o[0],d.cz+o[1],'DEBAIXO DA PONTE DO CANAL','UNDER THE CANAL BRIDGE');if(out.length>n)break}}}catch(e){}
 try{const p=(city.piers||[]).find(q=>q.id==='marina')||(city.piers||[])[0];if(p){const c=curbPoint(clamp(p.cx,0,E),clamp(p.cz,0,E));add(c[0],c[1],'GALPÃO DO PORTO','HARBOR WAREHOUSE')}}catch(e){}
 const R0=mulberry32((S.seed>>>0)^0x5a17);for(let k=0;out.length<3&&k<60;k++){const r=city.rects[Math.floor(R0()*city.rects.length)];if(!r)continue;add((r[0]+r[2])/2,(r[1]+r[3])/2,'PONTO DE TROCA '+(out.length+1),'SWAP SPOT '+(out.length+1))}
 return out.slice(0,3)}
/* ---------- personagem: troca instantânea pela história (sem cartão preto) ---------- */
function campLeaveInterior(){const k=PL.inside;if(!k)return;try{
 if(k===true)exitSafe();else if(k==='bank'){BANK.rob=null;bankExit()}else if(k==='pawn')pawnExit();else if(k==='motel')motelExit();else if(k==='lab')labExit();
 else if(k==='club')casinoExit('club');else if(k==='casino')casinoExit('casino');else if(k==='mall')exitMall();else if(k==='shop')exitShop();else if(k==='ammo')ammoExit();
 else{PL.inside=false;DOOR.from=null}}catch(e){console.warn('[campanha] sair do interior',e);PL.inside=false}}
function campSwitch(to,p,caption){if(WARD.open)try{closeWard(false)}catch(e){}if(PL.inside)campLeaveInterior();if(PL.heli||PARA.active){try{if(PL.heli){HELI.cur=null;PL.heli.state='idle';PL.heli=null}PARA.active=null}catch(e){}}
 const pos=p?[p.x,p.z]:[PL.x,PL.z];
 if(CHAR.cur===to){PL.car=null;PL.x=pos[0];PL.z=pos[1];PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true;camT.x=PL.x;camT.z=PL.z;return}
 CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};charLeave();CHAR.list[CHAR.cur].st=null;fadeFlash();charEnter(to,null,pos);CHAR.list[to].st=null;
 camT.x=PL.x;camT.z=PL.z;chasePos.set(PL.x,PL.gy+8,PL.z+6);try{charSelPaint()}catch(e){}
 toast((caption?'<small style="font-size:11px;color:#fff">'+translatePlain(caption)+'</small><br>':'')+CHAR.list[to].name)}
function campBoard(v){if(!v)return;try{hazeBoard(v)}catch(e){PL.car=v}}
function campCar(type,p,a,color,tag){const v=makeVehicle(type,p.x,p.z,a||0,color);v.hand=true;v.sleep=false;v.keep=true;v.campCar=true;if(tag){v.campTag=tag;CAMP.cars[tag]=v}return v}
/* carro da missão por etiqueta: devolve o que existe (vivo) ou cria com make() */
function campCarGet(tag,make){const v=CAMP.cars[tag];if(v&&!campCarGone(v))return v;const n=make&&make();if(n){n.campTag=tag;n.campCar=true;CAMP.cars[tag]=n}return n||null}
function campCarsClear(keep){for(const k in CAMP.cars){const v=CAMP.cars[k];if(v&&v!==keep&&vehicles.includes(v)&&v!==PL.car)removeVehicle(v)}CAMP.cars={}}
function campCarGone(v){return !v||!vehicles.includes(v)||!v.alive||v.exploded}
/* ---------- checkpoint e falha ---------- */
function campSnap(){const cp=o=>o?JSON.parse(JSON.stringify(o)):null;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;const c=PL.car;
 return{cur:CHAR.cur,money:PL.money||0,bank:BANKACC.bal||0,luck:LUCK.v,cash:CHAR.list.map(q=>q.cash||0),pal:cp(PLAYER_PAL),looks:CHAR.list.map(q=>cp(q.look)),inv:cp(GUN.inv),w:GUN.w,x:campMe().x,z:campMe().z,style:S.style,haze:!!city.haze,
  car:c&&c.alive?{type:c.type,color:c.color,a:c.a,legal:!!c.legal,owned:!!c.owned,special:!!c.special,tag:c.campTag||null}:null,heli:PL.heli?{x:PL.heli.x,z:PL.heli.z,y:PL.heli.y,yaw:PL.heli.yaw||0}:null,vars:cp(campV()),tod:DN.tod,mask:!!MASK.have,card:!!LAB.card}}
function campCheckpoint(st){CAMP.cp={stage:st.id,snap:campSnap()};if(CAMP.cpShown)toast('<span style="color:#7dff8a">CHECKPOINT</span>');CAMP.cpShown=true}
function campFail(reason){if(!CAMP.id||CAMP.failing)return CAMP.failing;if(CAMP.st&&CAMP.st.onFail)try{if(CAMP.st.onFail(reason))return true}catch(e){console.error(e)}CAMP.failing=true;CAMP.failT=0;STORYFAIL.active=true;STORYFAIL.t=0;STORYFAIL.mission='camp';STORYFAIL.reason=reason;
 if(DLG.on)try{DLG.d.onEnd=null;dlgClose(-1)}catch(e){}CAMP.cut=false;tbarHide('camp');sideHud(null);
 const el=$('#storyFailOverlay');el.hidden=false;el.style.opacity='0';$('#storyFailReason').textContent=translatePlain(reason);void el.offsetWidth;el.style.opacity='1';
 $('#storyGuide').hidden=true;try{monStoryShiftSync()}catch(e){}for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();return true}
function campFailTick(dt){CAMP.failT+=dt;const el=$('#storyFailOverlay');if(CAMP.failT>=2&&CAMP.failT<2+dt)el.style.opacity='0';if(CAMP.failT<2.8)return;
 STORYFAIL.active=false;STORYFAIL.mission=null;el.hidden=true;el.style.opacity='0';CAMP.failing=false;try{campRestore()}catch(e){console.error('[campanha] checkpoint',e);toast('ERRO NO CHECKPOINT · VEJA O CONSOLE')}}
function campCleanStage(){campActorsClear();campGangClear();campMarksClear();CAMP.tgts=[];CAMP.tgt=null;storyClearObjective();tbarHide('camp');sideHud(null);CAMP.flags={}}
function campRestore(){const cp=CAMP.cp,m=campM();if(!cp||!m){campAbort();return}const S0=cp.snap,cpy=o=>o?JSON.parse(JSON.stringify(o)):null;
 if(DLG.on)try{DLG.d.onEnd=null;dlgClose(-1)}catch(e){}
 if(PL.inside)campLeaveInterior();if(PL.heli){HELI.cur=null;PL.heli.state='idle';PL.heli=null}PARA.active=null;
 if(POL.wanted)endWanted(true,true);POL.wanted=false;POL.level=0;POL.truce=simT+8;for(const q of peds.slice())if(q.cop)removePed(q);
 for(const c of vehicles.slice())if((c.chase&&!c.target)||c.polBoat){if(c!==PL.car)removeVehicle(c);else c.chase=false}
 PL.car=null;campCarsClear();
 campCleanStage();
 PL.dead=false;PL.deadT=0;PL.hp=100;PL.down=0;PL.rot=0;PL.vx=PL.vz=0;PL.jy=PL.jv=0;$('#ko').hidden=true;$('#ko').textContent='NOCAUTE';document.body.classList.remove('ko-grayscale');
 if(S0.cur!==CHAR.cur){CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};charEnter(S0.cur,null,[S0.x,S0.z])}
 PL.x=S0.x;PL.z=S0.z;PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;
 CHAR.list.forEach((c,i)=>{c.cash=S0.cash[i];if(i!==CHAR.cur&&S0.looks[i])c.look=cpy(S0.looks[i])});PL.money=S0.money;if(S0.bank!=null)BANKACC.bal=S0.bank;if(S0.luck!=null)LUCK.v=S0.luck;Object.assign(PLAYER_PAL,cpy(S0.pal));CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};try{applyPlayerLook();charFaces()}catch(e){}
 if(S0.inv&&Object.keys(S0.inv).length){GUN.inv=cpy(S0.inv);if(GUN.has){const w=GUN.inv[S0.w]?S0.w:Object.keys(GUN.inv)[0];try{gunSelect(w,true)}catch(e){}}}
 STORY.vars=cpy(S0.vars)||{};MASK.have=S0.mask;LAB.card=S0.card;
 let car=null;if(S0.heli){try{const h=heliAddPad(S0.heli.x,S0.heli.z,S0.heli.yaw,'campR'+Date.now());heliBoard(h);h.phase='fly';h.y=Math.max(S0.heli.y,30);h.yaw=S0.heli.yaw}catch(e){console.warn('[campanha] heli',e)}}
 if(S0.car){car=campCar(S0.car.type,{x:S0.x,z:S0.z},S0.car.a,S0.car.color,S0.car.tag);car.legal=S0.car.legal;car.owned=S0.car.owned;if(S0.car.special){car.special=true;car.hasNitro=true}campBoard(car)}
 if(S0.style!==S.style||S0.haze!==!!city.haze)console.warn('[campanha] checkpoint em outro mundo; seguindo no mundo atual');
 camT.x=PL.x;camT.z=PL.z;chasePos.set(PL.x,PL.gy+8,PL.z+6);
 campGo(cp.stage,{restore:true,car});toast('<span style="color:#7dff8a">DE VOLTA AO CHECKPOINT</span>')}
/* ---------- etapas ---------- */
function campShowObj(st){const m=campM(),el=$('#storyGuide');if(!st||!st.obj){el.hidden=true;try{monStoryShiftSync()}catch(e){}return}
 const o=typeof st.obj==='function'?st.obj(campV()):st.obj,sub=typeof st.sub==='function'?st.sub(campV()):st.sub;
 el.innerHTML='<b>'+translatePlain(m.title.toUpperCase())+'</b>'+translatePlain(o)+(sub?'<span style="display:block;margin-top:5px;font-size:.86em;opacity:.88">'+translatePlain(sub)+'</span>':'');el.hidden=false;try{monStoryShiftSync()}catch(e){}}
function campObj(txt,sub){campShowObj({obj:txt,sub})}
function campGo(id,opt){opt=opt||{};const m=campM();if(!m)return;const st=m.stages.find(s=>s.id===id);if(!st){console.warn('[campanha] etapa desconhecida',id);return}
 if(!opt.restore){campActorsClear();campGangClear();campMarksClear()}CAMP.tgts=[];CAMP.tgt=null;storyClearObjective();tbarHide('camp');sideHud(null);
 CAMP.st=st;CAMP.hold=null;CAMP.t=0;CAMP.flags={};CAMP.allow=new Set([...(m.allow||[]),...(st.allow||[])]);
 campShowObj(st);missionModeSync();
 try{if(st.enter)st.enter(campV(),opt)}catch(e){console.error('[campanha] enter',id,e)}
 if(CAMP.st===st&&$('#storyGuide').hidden&&st.obj)campShowObj(st);
 if(st.cp&&!opt.restore)campCheckpoint(st)}
function campNext(){const m=campM();if(!m||!CAMP.st)return;const i=m.stages.indexOf(CAMP.st);const n=m.stages[i+1];if(n)campGo(n.id);else campFinish()}
function campStart(id){const m=campM(id);if(!m)return;CAMP.id=id;STORYINTRO.guide=-1;CAMP.cp=null;CAMP.cpShown=false;CAMP.failing=false;CAMP.cut=false;CAMP.doneT=0;
 if(NAV.open)try{closeMap()}catch(e){}if(PHONE.open)try{prologueClosePhone()}catch(e){}if(m.hour!=null)campHour(m.hour);
 CAMP.cars={};
 /* r46: missão começada de longe (atalho de concluir/pular missão) → leva o jogador até o ponto de partida antes da abertura aérea,
    senão a câmera enquadra o lugar e o jogador aparece longe depois */
 try{const sp=m.startAt(),me=campMe();if(sp&&!PL.heli&&Math.hypot(me.x-sp.x,me.z-sp.z)>40){if(PL.inside)campLeaveInterior();const q=campCurb(sp,[0,6])||sp;
  if(PL.car){const c=PL.car;c.x=q.x;c.z=q.z;c.vx=c.vz=c.fwd=0;c.thr=0;c.hand=true;syncCar(c,0);PL.x=c.x;PL.z=c.z}else cheatWarp(q.x,q.z);camT.x=q.x;camT.z=q.z}}catch(e){console.warn('[campanha] ponto de partida',e)}
 campIntroBegin(m)}
function campStartPlay(){const m=campM();if(!m)return;campGo(m.stages[0].id);if(!CAMP.cp)campCheckpoint(CAMP.st)}
/* r31 · abertura de cada missão: câmera aérea descendo devagar sobre o lugar onde a missão começa, tarja de cinema, título; depois o diálogo/objetivo.
   Pula com ENTER/ESPAÇO/E. Durante a abertura o jogador fica parado (teclas zeradas, carro freado). */
function campIntroBegin(m){const p=(m.introAt&&m.introAt())||m.startAt()||campMe();const me=campMe();
 CAMP.intro={t:0,dur:6.2,x:p.x,z:p.z,a0:Math.atan2(me.z-p.z,me.x-p.x)||0};CAMP.cut=true;storyClearObjective();$('#storyGuide').hidden=true;
 document.body.classList.add('story-cinematic');for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();
 let el=$('#campIntro');if(!el){el=document.createElement('div');el.id='campIntro';el.innerHTML='<div class="ci-k"></div><div class="ci-t"></div>';document.body.appendChild(el)}
 const M=MAP_TITLE[S.style]||MAP_TITLE.modern,t=el.querySelector('.ci-t');el.querySelector('.ci-k').textContent=(S.lang==='en'?'MISSION':'MISSÃO')+' '+String(m.id).replace(/\D/g,'');t.textContent=translatePlain(m.title);
 t.style.setProperty('font-family',M.f,'important');t.style.color=M.c;t.style.textShadow='3px 3px 0 '+M.s+',0 0 14px rgba(0,0,0,.9)';
 el.hidden=false;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');missionModeSync()}
function campIntroEnd(){const I=CAMP.intro;if(!I)return;CAMP.intro=null;CAMP.cut=false;const el=$('#campIntro');if(el){el.classList.remove('on');setTimeout(()=>{if(!CAMP.intro)el.hidden=true},700)}
 if(!PROLOGUE.active)document.body.classList.remove('story-cinematic');camT.x=campMe().x;camT.z=campMe().z;try{updateCamera(0,true);chasePos.copy(camera.position)}catch(e){}missionModeSync();campStartPlay()}
function campIntroTick(dt){const I=CAMP.intro;I.t+=dt;for(const k in keys)if(k!=='Enter'&&k!=='Space'&&k!=='KeyE')keys[k]=false;const c=PL.car;if(c){c.thr=0;c.hand=true}PL.vx=PL.vz=0;
 if(I.t>.6&&(keys.Enter||keys.Space||keys.KeyE||(PAD.on&&typeof PAD.b!=='undefined'&&0))){keys.Enter=keys.Space=keys.KeyE=false;campIntroEnd();return}
 if(I.t>=I.dur)campIntroEnd()}
/* toque na tela pula a abertura (no celular o HUD some na tarja) */
addEventListener('pointerdown',()=>{if(CAMP.intro&&CAMP.intro.t>.6&&!menuOpen)campIntroEnd()},true);
{const _uc2=updateCamera;updateCamera=function(dt,snap){const I=CAMP.intro;if(!I){_uc2(dt,snap);return}
 const k=Math.min(1,I.t/I.dur),e=1-Math.pow(1-k,2.2),H=150-e*105,R=150-e*80,a=I.a0+.55*e,gy=groundY(I.x,I.z)||0;
 camera.up.set(0,1,0);camera.position.set(I.x+Math.cos(a)*R,gy+H,I.z+Math.sin(a)*R);camera.lookAt(I.x,gy+2,I.z)}}

function campAbort(){campCleanStage();campCarsClear(PL.car);CAMP.id=null;CAMP.st=null;CAMP.cp=null;CAMP.cut=false;CAMP.allow=new Set();$('#storyGuide').hidden=true;try{monStoryShiftSync();missionModeSync()}catch(e){}}
function campFinish(){const m=campM();if(!m)return;const id=m.id;try{if(m.finish)m.finish(campV())}catch(e){console.error(e)}
 campCleanStage();for(const k in CAMP.cars){const v=CAMP.cars[k];if(v&&vehicles.includes(v)){v.keep=false;v.campCar=false}}CAMP.cars={};CAMP.id=null;CAMP.st=null;CAMP.cp=null;CAMP.cut=false;CAMP.allow=new Set();$('#storyGuide').hidden=true;try{monStoryShiftSync()}catch(e){}
 STORY.done.add(id);for(const f of m.unlock||[])STORY.unl.add(f);for(const k of m.reveal||[])STORY.map.add(k);
 const all=STORY_MISSIONS.every(q=>STORY.done.has(q.id));if(all){STORY.cleared=true;for(const f of STORY_LOCKED)STORY.unl.add(f)}
 if(m.pay&&!CHEAT.used)money(m.pay);missionModeSync();if(all){try{saveGame(true)}catch(e){}storyTheEnd();return}campDoneShow(m.title,m.unlockTxt||'novos lugares liberados',false);
 try{charSelPaint()}catch(e){}if(id==='m2')setTimeout(()=>{try{if(!CAMP.id&&!PROLOGUE.active)storyTutorialShow(5)}catch(e){}},5600);try{saveGame(true)}catch(e){console.warn('[campanha] salvar',e)}setTimeout(()=>{try{storyCheckpointOffer()}catch(e){}},5200)}
/* "MISSÃO CONCLUÍDA": sem tela preta; o jogo segue e o texto aparece com faixa escura por trás (contraste) */
function campDoneShow(title,sub,final){let el=$('#campDone');if(!el){el=document.createElement('div');el.id='campDone';el.hidden=true;el.innerHTML='<div class="cd-k"></div><div class="cd-t"></div><div class="cd-s"></div>';document.body.appendChild(el)}
 el.querySelector('.cd-k').textContent=translatePlain(final?'FIM DA LINHA':'MISSÃO CONCLUÍDA');el.querySelector('.cd-t').textContent=translatePlain(final?'HISTÓRIA CONCLUÍDA':title.toUpperCase());el.querySelector('.cd-s').textContent=translatePlain(final?'cidade inteira liberada':sub||'');
 el.hidden=false;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(campDoneShow.t);campDoneShow.t=setTimeout(()=>{el.classList.remove('on');setTimeout(()=>{el.hidden=true},700)},final?7000:5000);try{clang(.35)}catch(e){}}
/* ---------- começo das missões: SMS + "!" ---------- */
function campHookTick(dt){if(CAMP.id||!storyOn()||!played||PROLOGUE.active||STORYINTRO.active||STORYEND.active||STORYFAIL.active||ONLINE.on)return;
 const m=CAMP_MISSIONS.find(q=>!STORY.done.has(q.id)&&q.needs.every(n=>STORY.done.has(n)));if(!m)return;const V=campV();
 if(!V.hook[m.id]){if(POL.wanted||PL.dead||menuOpen||S.style!=='modern'||city.haze||DLG.on)return;CAMP.hookT+=dt;if(CAMP.hookT<6)return;CAMP.hookT=0;
  V.hook[m.id]=true;phoneMission(translatePlain(m.sms));try{const sp=m.startAt();if(sp)misGPS(sp.x,sp.z)}catch(e){}toast('<span style="color:#ffd21a">'+translatePlain('NOVA MISSÃO')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain(m.title)+' · '+translatePlain('siga o ! no mapa')+'</small>');try{phoneBeep()}catch(e){}return}
 if(S.style!=='modern'||city.haze||PL.dead||POL.wanted)return;const p=m.startAt();if(!p)return;const me=campMe(),d=Math.hypot(me.x-p.x,me.z-p.z);
 if(d<60&&NAV.misMarker&&NAV.marker&&Math.hypot(NAV.marker.x-p.x,NAV.marker.z-p.z)<1){}
 if(d<(m.startR||7)&&!PL.inside&&Math.abs((PL.car||{fwd:0}).fwd||0)<3)campStart(m.id)}
/* ---------- laço ---------- */
function campTick(dt){if(STORYFAIL.active||!played)return;
 if(!CAMP.id){campHookTick(dt);return}
 if(CAMP.intro){campIntroTick(dt);return}
 if(DLG.on||CAMP.cut||TIMEJUMP.busy||HAZE.switching||INVERT.switching||SWITCH.on)return;
 const st=CAMP.st;if(!st)return;CAMP.t+=dt;campMarksTick();const V=campV();
 if(CAMP.gang.gang.length)try{empGangTick(CAMP.gang,dt)}catch(e){}
 if(PL.dead){campFail('VOCÊ MORREU');return}
 /* r46: procurado não reprova mais a missão — a etapa fica em espera ("Despiste a polícia") e volta sozinha quando as estrelas zeram
    (antes: atirou num policial = missão falhou na hora). Morte e prisão continuam reprovando. */
 const F=st.fail||{};if(F.wanted&&POL.wanted){if(!CAMP.hold){CAMP.hold=st;try{NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false}catch(e){}campShowObj({obj:'Despiste a polícia'})}return}
 if(CAMP.hold){const h=CAMP.hold;CAMP.hold=null;if(h===st&&st.obj)campShowObj(st)}
 if(F.car){const v=F.car(V);if(v!==undefined&&campCarGone(v)){campFail(F.carMsg||'O CARRO FOI DESTRUÍDO');return}}
 if(CAMP.tgt&&!PL.inside)try{if(!NAV.misMarker||!NAV.marker||Math.hypot(NAV.marker.x-CAMP.tgt.x,NAV.marker.z-CAMP.tgt.z)>.5)misGPS(CAMP.tgt.x,CAMP.tgt.z)}catch(e){}
 try{if(st.tick)st.tick(dt,V)}catch(e){console.error('[campanha] tick',st.id,e)}}
function campDebugNext(){if(CAMP.intro){campIntroEnd();return}if(!CAMP.id){const m=CAMP_MISSIONS.find(q=>!STORY.done.has(q.id)&&q.needs.every(n=>STORY.done.has(n)));if(m){campV().hook[m.id]=true;campStart(m.id)}return}
 if(DLG.on){try{DLG.d.onEnd&&0;dlgClose(-1)}catch(e){}return}const st=CAMP.st;if(!st)return;try{if(st.skip){st.skip(campV());return}}catch(e){console.error('[campanha] pular',e)}campNext()}
function campReset(){if(CAMP.intro){CAMP.intro=null;const el=$('#campIntro');if(el)el.hidden=true;if(!PROLOGUE.active)document.body.classList.remove('story-cinematic')}campCleanStage();CAMP.cars={};CAMP.id=null;CAMP.st=null;CAMP.cp=null;CAMP.cut=false;CAMP.failing=false;CAMP.hookT=0;CAMP.allow=new Set();STORY.vars={hook:{}}}
/* look atual × foto: quantas peças mudaram */
function campLookDiff(a){let n=0;for(const k of Object.keys(WEAR_PAL))if((a[k]||null)!==(PLAYER_PAL[k]||null))n++;return n}
function campNear(p,r){const me=campMe();return p&&Math.hypot(me.x-p.x,me.z-p.z)<r}
function campStopped(){return PL.car&&Math.abs(PL.car.fwd||0)<1.2}
function campCopNear(x,z,r){for(const c of vehicles)if((c.chase||c.police&&c.sirenOn)&&c!==PL.car&&Math.hypot(c.x-x,c.z-z)<r)return true;for(const q of peds)if(q.cop&&q.state!=='dead'&&Math.hypot(q.x-x,q.z-z)<r*.5)return true;return false}
function campEnsureGun(){if(!Object.keys(GUN.inv||{}).some(w=>w!=='jammer'&&w!=='fist'))gunGive('pistol',48)}
function campBankVault(){const v=BANK.vault;return v?{x:v.position.x,z:v.position.z}:BANK.IN?{x:BANK.IN.x,z:BANK.IN.z-6}:null}
CAMP_WHO.G={name:'CAPANGA',pal:()=>({...GANG_PAL})};CAMP_WHO.NC={name:'NATHAN E CLAIRE',pal:()=>campLook(0)};
/* frases de pensamento curtas do jogador (não abrem diálogo) */
function campThink(t,d){try{think(PL,translatePlain(t),d||4)}catch(e){}}
function campInRoomTalk(room,who,place,seq,done){if(PL.inside!==room||CAMP.flags.talked)return false;CAMP.flags.talked=true;const p=place();if(p&&who)campActor(who,p.x,p.z,[PL.x-p.x,PL.z-p.z]);campTalk(seq,done);return true}
function campMotelSpot(){const I=MOTEL.IN;return I?{x:I.x+.6,z:I.z-I.D+1.1}:null}
/* ================= MISSÃO 2 · PLANTA BAIXA ================= */
const CAMP_M2={id:'m2',title:'Planta baixa',needs:['pier'],hour:21,hookDelay:120,sms:'Claire: Vem aqui no motel hoje à noite, tenho uma ideia pra tirar a gente do buraco!',startAt:()=>campPoi('motel'),
 unlock:['mall','pawn','tune','deal','motel'],reveal:['bank','mall','pawn','tune','deal','motel','ammo'],unlockTxt:'shopping, penhores, oficina e concessionária liberados',
 stages:[
 {id:'motelPlan',who:0,cp:true,obj:'Vá ao quarto 6 do Motel Miragem',allow:['motel'],fail:{wanted:true},
  enter(V){if(CHAR.cur!==0)campSwitch(0,campMe());if(!PL.inside)campGPS(campPoi('motel'))},
  tick(dt,V){if(PL.inside!=='motel'){if(!CAMP.tgt)campGPS(campPoi('motel'));return}CAMP.tgt=null;storyClearObjective();
   campInRoomTalk('motel','C',campMotelSpot,[['C','Senta. Não é sobre a gente. É sobre o que aconteceu há três anos.'],['N','Fala do roubo ao carro-forte? A gente saiu de lá com o dinheiro e a polícia já estava esperando na ponte. Eles já sabiam de tudo. Mas quem?'],['C','Esperando por mim. Alguém avisou que eu estaria sozinha naquele carro.'],['N','Eu recebi uma ligação naquela noite. Disseram que você já tinha saído, que era pra eu sumir…'],['C','Quem ligou, Nate?'],['N','…O Victor.'],['C','O Victor Lang! DESGRAÇADO. Ele planejou o serviço, escolheu a rota e ficou com a parte dele limpinha. Eu suspeitava dele, mas agora tenho certeza.'],['C','Fiquei sabendo pelas outras detentas que o Victor tem um cofre particular no Sunset Bank. O que tem lá dentro é o motivo de ele ter vendido a gente.'],['N','Você quer roubar o banco?! Isso é loucura.'],['C','Eu quero a verdade. O dinheiro é só um bônus. E dessa vez a gente planeja tudo, só nós, sem sustos nem traição. Confia em mim?'],['N','Confio. Por onde começamos?'],['C','Você olha o banco por dentro, sem armas. Depois fala com o Tony na loja de penhores: ele sabe de tudo que entra e sai daquele cofre.'],['C','Eu cuido da roupa e do carro da fuga. Ninguém sai de um banco com a mesma cara com que entrou, especialmente do jeito que estamos planejando.']],()=>campNext())},
  skip(V){CAMP.flags.talked=true;campNext()}},
 {id:'bankScout',who:0,obj:V=>'Observe o banco ('+(V.scout||[]).length+'/3)',sub:'cofre, guarda e câmera · sem arma na mão',fail:{wanted:true},
  enter(V){V.scout=[];BANK.closedUntil=0;if(PL.inside!=='bank')campGPS(campPoi('bank'))},
  tick(dt,V){if(PL.inside!=='bank'){if(!CAMP.tgt)campGPS(campPoi('bank'));return}if(CAMP.tgt){CAMP.tgt=null;storyClearObjective()}
   if(GUN.has){campFail('VOCÊ ASSUSTOU O GERENTE E ELE CHAMOU A POLÍCIA');return}const IN=BANK.IN;if(!IN)return;
   if(!CAMP.flags.guard){CAMP.flags.guard=true;const g=campActor('G',IN.x+7.6,IN.z+5.4,[0,-1]);if(g){g.pal={...COP_PAL,cap:'#2a3a5a'};try{pedExact(g)}catch(e){}}const vt=campBankVault();CAMP.flags.mk={cofre:vt&&campMark(vt.x,vt.z,.55),guarda:campMark(IN.x+7.6,IN.z+5.4,.55),camera:campMark(IN.x,IN.z-.8,.55)}}
   const pts=[['cofre',campBankVault(),8.6,'Porta redonda, relógio de abertura. O bloqueador resolve as câmeras de dentro.'],['guarda',{x:IN.x+7.6,z:IN.z+5.4},3,'Um guarda, revólver no coldre, mais preocupado com o celular.'],['camera',{x:IN.x,z:IN.z-.8},3,'Câmera em cima do balcão. Ela pega a saída inteira.']];
   for(const [k,p,r,line] of pts)if(p&&!V.scout.includes(k)&&Math.hypot(PL.x-p.x,PL.z-p.z)<r){V.scout.push(k);{const mk=CAMP.flags.mk&&CAMP.flags.mk[k];if(mk){scene.remove(mk);const i=CAMP.marks.indexOf(mk);if(i>=0)CAMP.marks.splice(i,1)}}campThink(line,4.5);campShowObj(CAMP.st);clang(.15)}
   if(V.scout.length>=3&&!CAMP.flags.done){CAMP.flags.done=true;setTimeout(()=>{if(CAMP.st&&CAMP.st.id==='bankScout')campNext()},2500)}},
  skip(V){V.scout=['cofre','guarda','camera'];campNext()}},
 {id:'pawnTony',who:0,cp:true,obj:'Fale com o Tony nos penhores',allow:['pawn'],fail:{wanted:true},
  enter(V){if(PL.inside!=='pawn')campGPS(campPoi('pawn'))},
  tick(dt,V){if(PL.inside!=='pawn'){if(!CAMP.tgt)campGPS(campPoi('pawn'));return}CAMP.tgt=null;storyClearObjective();if(CAMP.flags.talked)return;CAMP.flags.talked=true;
   campTalk([['T','Nathan Cole, vivo e de volta. O que você quer com o Lang?'],['N','O cofre particular dele no Sunset Bank.'],['T','Caixa 217. Ele vai lá toda sexta, sozinho. E o carro-forte chega às dez, quando o cofre fica aberto por quinze minutos.'],['T','Eu arranjo uma van pra vocês e quero dez por cento do que sair da caixa.'],['N','Cinco por cento é minha oferta final.'],['T','Oito, e eu esqueço que você existe.'],['N','Feito.']],()=>{V.tony=true;campNext()})},
  skip(V){V.tony=true;campNext()}},
 {id:'mallOutfit',who:1,obj:'Compre a roupa de fuga',sub:'troque 3 peças da roupa atual',allow:['mall'],fail:{wanted:true},
  enter(V,opt){if(!opt.restore||CHAR.cur!==1){const m=campPoi('mall');campSwitch(1,m?campCurb(m,[0,8]):null,'ENQUANTO ISSO…')}V.look0C={...PLAYER_PAL};if(PL.inside!=='mall')campGPS(campPoi('mall'))},
  tick(dt,V){if(PL.inside==='mall'){if(CAMP.tgt){CAMP.tgt=null;storyClearObjective()}if(!CAMP.flags.said){CAMP.flags.said=true;campThink('Nada laranja. Nada que lembre a cadeia. E nada que eu usaria normalmente.',5)}}
   else if(!CAMP.tgt&&!CAMP.flags.ok)campGPS(campPoi('mall'));
   if(!WARD.open&&V.look0C&&campLookDiff(V.look0C)>=3&&!CAMP.flags.ok){CAMP.flags.ok=true;V.lookC={...PLAYER_PAL,pack:false};campNext()}},
  skip(V){for(const [k,v] of [['shirt','#2b5d8a'],['pants','#3a3a44'],['cap','#202020']])PLAYER_PAL[k]=v;applyPlayerLook();V.lookC={...PLAYER_PAL,pack:false};campNext()}},
 {id:'carPick',who:1,cp:true,obj:'Arranje o carro da fuga',sub:'comprado, roubado ou pintado',allow:['deal','tune'],fail:{wanted:true},
  enter(V){},
  tick(dt,V){const c=PL.car;if(!c||c.t.boat||c.police||c.type==='bus'||c.type==='moto')return;
   if(c===SAFE.convCar||c.homeConv){if(!CAMP.flags.convMsg){CAMP.flags.convMsg=true;campThink('O conversível todo mundo conhece. Precisa ser outro carro.',3.5)}return}
   const legal=!!(c.legal||c.owned);V.escCar={type:c.type,color:c.color,color0:c.color,legal,stolen:!legal,painted:false};CAMP.cars.esc=c;c.campTag='esc';c.campCar=true;c.keep=true;
   campThink(legal?'Esse ninguém vai associar a mim.':'Roubado. Melhor pintar antes, senão a placa entrega.',4.5);campNext()},
  skip(V){const p=campMe();const c=campCar('sedan',campCurb(p,[6,0]),0,'#3a5a7a','esc');c.legal=true;c.owned=true;campBoard(c);V.escCar={type:'sedan',color:'#3a5a7a',color0:'#3a5a7a',legal:true,stolen:false,painted:false};campNext()}},
 {id:'dropPick',who:1,obj:'Escolha o ponto de troca',sub:'estacione parada em um dos 3 pontos marcados',allow:['deal','tune'],fail:{wanted:'VOCÊ CHEGOU PROCURADA',car:V=>CAMP.cars.esc||(PL.car&&PL.car.campTag==='esc'?PL.car:undefined),carMsg:'O CARRO DA FUGA FOI DESTRUÍDO'},
  enter(V,opt){if(opt.car&&opt.car.campTag==='esc')CAMP.cars.esc=opt.car;const pts=campDropPoints();CAMP.flags.pts=pts;CAMP.tgts=pts.slice();for(const p of pts)campMark(p.x,p.z);campObj('Escolha o ponto de troca',pts.map(p=>translatePlain(p.n)).join(' · '))},
  tick(dt,V){const pts=CAMP.flags.pts||[],me=campMe();if(!pts.length)return;let best=pts[0],bd=1e9;for(const p of pts){const d=Math.hypot(me.x-p.x,me.z-p.z);if(d<bd){bd=d;best=p}}
   if(!CAMP.tgt||Math.hypot(CAMP.tgt.x-best.x,CAMP.tgt.z-best.z)>1)campGPS(best);
   const c=PL.car,esc=CAMP.cars.esc;if(c&&esc&&c!==esc&&!CAMP.flags.wrong){CAMP.flags.wrong=true;campThink('Esse não é o carro da fuga.',3)}
   if(c&&c===esc&&bd<10&&Math.abs(c.fwd||0)<.8){const E=V.escCar||{};E.color=c.color;E.painted=!!(E.stolen&&c.color!==E.color0);V.escCar=E;V.drop={x:best.x,z:best.z,n:best.n,en:best.en};campThink('Aqui. Roupa no porta-malas, chave no para-sol.',4.5);campNext()}},
  skip(V){const p=(CAMP.flags.pts||campDropPoints())[0];V.drop={x:p.x,z:p.z,n:p.n,en:p.en};campNext()}},
 {id:'homeOutfit',who:0,cp:true,obj:'Escolha sua roupa da fuga',sub:'guarda-roupa da casa · troque 3 peças',fail:{},
  enter(V,opt){const esc=CAMP.cars.esc;if(esc&&vehicles.includes(esc)){if(PL.car===esc){esc.thr=0;esc.hand=true}}if(!opt.restore||CHAR.cur!==0)campSwitch(0,campPoi('safe'),'ENQUANTO ISSO…');if(esc&&vehicles.includes(esc)&&esc!==PL.car){esc.hand=true;esc.keep=false;esc.campCar=false}delete CAMP.cars.esc;V.look0N={...PLAYER_PAL};campGPS(campPoi('safe'));campThink('Roupa de fuga… nunca pensei que ia escolher roupa pra assaltar um banco.',4.5)},
  tick(dt,V){if(PL.inside===true&&CAMP.tgt){CAMP.tgt=null;storyClearObjective()}if(WARD.open){if(!CAMP.flags.opened)campThink('Nada chamativo. Ninguém lembra de um cara qualquer de boné.',4);CAMP.flags.opened=true;return}
   const n=V.look0N?campLookDiff(V.look0N):0;if(n>=3||(CAMP.flags.opened&&n>=1)){V.lookN={...PLAYER_PAL,pack:false};campThink('Pronto. Se nem eu me reconheço no espelho, o guarda do banco também não vai.',4.5);campNext()}},
  skip(V){for(const [k,v] of [['shirt','#6a2a2a'],['cap','#1a1a1a'],['glasses','#121218']])PLAYER_PAL[k]=v;applyPlayerLook();V.lookN={...PLAYER_PAL,pack:false};campNext()}},
 {id:'ammoJammer',who:0,obj:'Instale o app ctOS',sub:'loja de armas · o bloqueador vem no celular',fail:{wanted:true},
  enter(V){campGPS(campPoi('ammo'))},
  tick(dt,V){if(PL.inside==='ammo'&&CAMP.tgt){CAMP.tgt=null;storyClearObjective()}if(CTOS.installed&&!AMMO.uiOpen){V.jammer=true;campThink('ctOS instalado. O bloqueador agora mora no celular.',3.5);campNext()}},
  skip(V){ctosInstall(true);V.jammer=true;campNext()}},
 {id:'motelNight',who:0,obj:'Volte ao quarto 6',allow:['motel'],fail:{wanted:true},
  enter(V){if(PL.inside==='ammo')try{ammoExit()}catch(e){}campGPS(campPoi('motel'))},
  tick(dt,V){if(PL.inside!=='motel'){if(!CAMP.tgt)campGPS(campPoi('motel'));return}CAMP.tgt=null;storyClearObjective();
   campInRoomTalk('motel','C',campMotelSpot,[['C','Roupas e o carro estão no ponto. E você?'],['N','Bloqueador comprado, Tony arranjou a van. Sabemos que o cofre abre às dez.'],['C','Eu dirijo. Você entra, pega a caixa 217 e sai. Sem bancar o vilão nem o herói.'],['N','E depois?'],['C','Depois a gente descobre se valeu a pena confiar em você de novo.'],['N','Como é???'],['C','Brincadeira, seu bobo. Depois a gente decide o que fazer com a informação.']],()=>campNext())},
  skip(V){campNext()}},
 ]};
/* ================= MISSÃO 3 · SUNSET BANK ================= */
/* bloqueador (JAMMER) dentro do banco: só na etapa da missão; fora dela o jammer continua sendo o apagão noturno ao ar livre */
function campJamHook(){if(!CAMP.id||!CAMP.st||CAMP.st.id!=='bankIn')return false;if(PL.inside!=='bank'){toast(translatePlain('ENTRE NO BANCO PRIMEIRO'));return true}
 const v=campBankVault();if(v&&Math.hypot(PL.x-v.x,PL.z-v.z)>11){toast(translatePlain('CHEGUE MAIS PERTO DO COFRE'));return true}CAMP.flags.jam=true;clang(.4);toast(translatePlain('CÂMERAS FORA'));return true}
function campVan(V,at){return campCarGet('van',()=>{const p=at||campCurb(campPoi('pawn'),[7,0]);const v=campCar('van',p,0,'#eeeeee');v.legal=true;return v})}
function campEscCar(V){return campCarGet('esc',()=>{const E=V.escCar||{type:'sedan',color:'#3a5a7a',legal:true};const d=V.drop||campDropPoints()[0];const p=campCurb(d,[0,4]);const v=campCar(E.type||'sedan',p,0,E.color);v.legal=!!E.legal;v.owned=!!E.legal;return v})}
function campDrop(V){if(!V.drop){const p=campDropPoints()[0];V.drop={x:p.x,z:p.z,n:p.n,en:p.en}}return V.drop}
const CAMP_M3={id:'m3',title:'Sunset Bank',needs:['m2'],hour:9.5,hookDelay:90,sms:'Tony: Van nos fundos da loja de penhores.',startAt:()=>campPoi('pawn'),
 unlock:['duo','casino','bankrob'],reveal:['casino','club'],unlockTxt:'dupla livre e cassino liberados',
 stages:[
 {id:'vanGet',who:1,obj:'Pegue a van do Tony',sub:'o Nathan vai de carona',fail:{wanted:true,car:V=>CAMP.cars.van,carMsg:'A VAN FOI DESTRUÍDA'},
  enter(V,opt){if(CHAR.cur!==1)campSwitch(1,campMe());const van=campVan(V);if(!PL.car||PL.car!==van){CAMP.flags.nate=campActor('N',van.x+2.6,van.z+1.5)}campGPS(van)},
  tick(dt,V){const van=CAMP.cars.van;if(van&&PL.car!==van&&!CAMP.tgt)campGPS(van);if(PL.car&&PL.car===van&&!CAMP.flags.in){CAMP.flags.in=true;campActorDrop(CAMP.flags.nate);CAMP.tgt=null;storyClearObjective();
   campTalk([['C','Van branca, sem logo, sem dono. O Tony é bom nisso de fato.'],['N','Ele é um dos melhores. Ei, olha, dez em ponto.']],()=>campNext())}},
  skip(V){const van=campVan(V);campBoard(van);campNext()}},
 {id:'bankGo',who:1,cp:true,obj:'Encoste na porta do banco',sub:'antes do cofre fechar',fail:{wanted:true,car:V=>CAMP.cars.van,carMsg:'A VAN FOI DESTRUÍDA'},
  enter(V,opt){if(opt.car&&opt.car.campTag==='van')CAMP.cars.van=opt.car;const van=campVan(V);if(PL.car!==van)campBoard(van);CAMP.flags.park=campCurb(campPoi('bank'));campGPS(CAMP.flags.park)},
  tick(dt,V){const lim=240,left=lim-CAMP.t;tbarShow('camp',translatePlain('COFRE ABERTO'),Math.max(0,left/lim));if(left<=0){campFail('ATRASO · O COFRE FECHOU');return}
   const van=CAMP.cars.van,d=campPoi('bank'),k=CAMP.flags.park||d;if(van&&PL.car===van&&d&&(Math.hypot(van.x-d.x,van.z-d.z)<18||Math.hypot(van.x-k.x,van.z-k.z)<12)&&Math.abs(van.fwd||0)<1){tbarHide('camp');CAMP.tgt=null;storyClearObjective();
    campTalk([['C','Motor ligado. Se passar de quinze minutos, eu entro buzinando.'],['N','Fica esperta, logo logo eu volto.']],()=>campNext())}},
  skip(V){const van=CAMP.cars.van,d=campCurb(campPoi('bank'));if(van&&d){van.x=d.x;van.z=d.z;van.vx=van.vz=van.fwd=0;syncCar(van,0)}campNext()}},
 {id:'bankIn',who:0,obj:'Use o bloqueador perto do cofre',sub:'entre no banco · celular › ctOS › JAMMER',allow:['bankrob'],fail:{},
  enter(V,opt){const d=campPoi('bank');const van=campVan(V,campCurb(d));if(van){van.thr=0;van.hand=true;van.vx=van.vz=van.fwd=0}
   if(CHAR.cur!==0||!opt.restore)campSwitch(0,d?{x:d.x+1.5,z:d.z}:null,'');if(van){van.hand=true;van.keep=true}
   ctosInstall(true);campEnsureGun();BANK.closedUntil=0;if(PL.inside!=='bank')campGPS(d)},
  tick(dt,V){if(PL.inside==='bank'&&CAMP.tgt){CAMP.tgt=null;storyClearObjective()}if(PL.inside!=='bank'&&!CAMP.tgt)campGPS(campPoi('bank'));
   if(CAMP.flags.jam){campThink('Câmeras fora. Agora preciso ser rápido.',3.5);campNext()}},
  skip(V){if(PL.inside!=='bank'){try{bankEnter()}catch(e){}}CAMP.flags.jam=true}},
 {id:'bankRob',who:0,cp:true,obj:'Renda o caixa',sub:'E no balcão · derrube os policiais que estavam de prontidão',allow:['bankrob'],fail:{},
  enter(V,opt){campVan(V,campCurb(campPoi('bank')));campEnsureGun();BANK.closedUntil=0;if(!opt.restore&&PL.inside==='bank')return;campGPS(campPoi('bank'))},
  tick(dt,V){if(PL.inside==='bank'&&CAMP.tgt){CAMP.tgt=null;storyClearObjective()}
   if(!BANK.rob){if(CAMP.flags.started){campFail('VOCÊ SAIU SEM O DINHEIRO');return}if(PL.inside!=='bank'&&!CAMP.tgt)campGPS(campPoi('bank'));return}
   if(!CAMP.flags.started){CAMP.flags.started=true;campThink('Ninguém precisa se machucar. Abre o cofre.',3.5)}
   if(BANK.rob.spawned>0&&!CAMP.flags.wave){CAMP.flags.wave=true;setTimeout(()=>campThink('Já? O Lang avisou alguém…',3.5),1500)}
   if(PL.inside!=='bank'&&!BANK.rob.done){campFail('VOCÊ SAIU SEM O DINHEIRO');return}
   if(BANK.rob.done)campNext()},
  skip(V){if(PL.inside!=='bank'){try{bankEnter()}catch(e){}}if(!BANK.rob)try{bankRobStart()}catch(e){}if(BANK.rob){for(const q of BANK.rob.cops)if(peds.includes(q))removePed(q);BANK.rob.cops=[];BANK.rob.killed=BANK.rob.total;BANK.rob.spawned=BANK.rob.total}}},
 {id:'vaultBox',who:0,obj:'Abra a caixa 217',sub:'fique perto do cofre',fail:{},
  enter(V){const v=campBankVault();if(v)campMark(v.x,v.z+2.2)},
  tick(dt,V){if(PL.inside!=='bank'){campFail('VOCÊ SAIU SEM A CAIXA 217');return}const v=campBankVault();if(!v)return;
   if(Math.hypot(PL.x-v.x,PL.z-v.z)<8.8){CAMP.flags.h=(CAMP.flags.h||0)+dt;tbarShow('camp',translatePlain('CAIXA 217'),Math.min(1,CAMP.flags.h/3))}else{CAMP.flags.h=0;tbarHide('camp')}
   if(CAMP.flags.h>=3&&!CAMP.flags.got){CAMP.flags.got=true;tbarHide('camp');V.loot=true;if(!CHEAT.used)money(24000,'CAIXA 217 · +$24.000');
    campTalk([['N','Ok, tem dinheiro aqui… e uma maleta? "Haze Dynamics".']],()=>{V.case=true;campNext()})}},
  skip(V){V.loot=true;V.case=true;campNext()}},
 {id:'bankOut',who:0,obj:'Volte para a van',fail:{car:V=>CAMP.cars.van,carMsg:'A VAN FOI DESTRUÍDA'},
  enter(V){const van=campVan(V,campCurb(campPoi('bank')));if(van)campGPS(van)},
  tick(dt,V){const van=CAMP.cars.van;if(PL.inside)return;if(!CAMP.tgt&&van)campGPS(van);
   if(van&&PL.car===van&&!CAMP.flags.in){CAMP.flags.in=true;CAMP.tgt=null;storyClearObjective();if(!POL.wanted)startWanted(true);wantedUp(3);
    campTalk([['N','Ok, tudo certo!'],['C','Não comemora ainda, cowboy. A coisa vai feder, estamos procurados! Se segura!']],()=>campNext())}},
  skip(V){if(PL.inside==='bank')try{BANK.rob=null;bankExit()}catch(e){}const van=campVan(V,campCurb(campPoi('bank')));campBoard(van);if(!POL.wanted)startWanted(true);wantedUp(3);campNext()}},
 {id:'escape',who:0,cp:true,obj:'Chegue ao ponto de troca',sub:V=>campDrop(V).n,fail:{car:V=>CAMP.cars.van,carMsg:'A VAN FOI DESTRUÍDA'},
  enter(V,opt){if(opt.car&&opt.car.campTag==='van')CAMP.cars.van=opt.car;const van=campVan(V,campCurb(campPoi('bank')));if(PL.car!==van)campBoard(van);if(!POL.wanted){startWanted(true);wantedUp(3)}campGPS(campDrop(V))},
  tick(dt,V){const d=campDrop(V);if(campNear(d,16))campNext()},
  skip(V){const d=campDrop(V),van=CAMP.cars.van;if(van){van.x=d.x;van.z=d.z;van.vx=van.vz=van.fwd=0;syncCar(van,0);PL.x=d.x;PL.z=d.z}campNext()}},
 {id:'shake',who:0,obj:'Despiste a polícia',sub:'fique no ponto sem viaturas por perto',fail:{car:V=>CAMP.cars.van,carMsg:'A VAN FOI DESTRUÍDA'},
  enter(V){campGPS(campDrop(V))},
  tick(dt,V){const d=campDrop(V);if(!campNear(d,45)){campGo('escape');return}
   if(!POL.wanted||!campCopNear(d.x,d.z,60)){CAMP.flags.calm=(CAMP.flags.calm||0)+dt}else CAMP.flags.calm=0;tbarShow('camp',translatePlain('DESPISTANDO'),Math.min(1,(CAMP.flags.calm||0)/5));
   if(CAMP.flags.calm>=5){tbarHide('camp');campNext()}},
  skip(V){campNext()}},
 {id:'swap',who:0,obj:'Troque de roupa e de carro',sub:'entre no carro da fuga (F)',fail:{},
  enter(V){const esc=campEscCar(V);campGPS(esc)},
  tick(dt,V){const esc=CAMP.cars.esc;if(!esc||campCarGone(esc)){CAMP.cars.esc=null;campEscCar(V);return}
   if(PL.car===esc&&!CAMP.flags.done){CAMP.flags.done=true;CAMP.tgt=null;storyClearObjective();if(POL.wanted)endWanted(true,true);
    const van=CAMP.cars.van;if(van&&vehicles.includes(van)&&van!==PL.car)removeVehicle(van);delete CAMP.cars.van;
    if(V.lookN){Object.assign(PLAYER_PAL,V.lookN);PLAYER_PAL.pack=false;applyPlayerLook()}if(V.lookC)CHAR.list[1].look={...V.lookC};CHAR.list[0].look={...PLAYER_PAL,pack:false};
    campTalk([['C','Agora a gente é só mais um casal no trânsito.']],()=>campNext())}},
  skip(V){const esc=campEscCar(V);campBoard(esc)}},
 {id:'driveCalm',who:0,cp:true,obj:'Volte ao motel sem chamar atenção',allow:['motel'],fail:{car:V=>CAMP.cars.esc,carMsg:'O CARRO DA FUGA FOI DESTRUÍDO'},
  enter(V,opt){if(opt.car&&opt.car.campTag==='esc')CAMP.cars.esc=opt.car;const esc=campEscCar(V);if(PL.car!==esc&&!PL.inside)campBoard(esc);campGPS(campPoi('motel'))},
  tick(dt,V){const E=V.escCar||{};
   if(E.stolen&&!E.painted&&!CAMP.flags.blitz&&PL.car&&CAMP.t>20){CAMP.flags.blitz=true;toast(translatePlain('BLITZ · A PLACA CONSTA COMO ROUBADA'));startWanted(true);wantedUp(2);campObj('Despiste a polícia','a placa do carro roubado foi reconhecida')}
   if(CAMP.flags.blitz&&!CAMP.flags.lost&&!POL.wanted){CAMP.flags.lost=true;campShowObj(CAMP.st)}
   if(PL.inside!=='motel'){if(!CAMP.tgt)campGPS(campPoi('motel'));return}CAMP.tgt=null;storyClearObjective();
   campInRoomTalk('motel','C',campMotelSpot,[['N','Vinte e cinco mil… Oito pro Tony.'],['C','Esquece o dinheiro, depois você conta isso. Abre logo a maleta.'],['N','Um cartão de acesso, "subsolo B2"… e uma foto nossa. Daquela noite.'],['C','Tem uma anotação atrás: "Entregue. Pagamento confirmado — H.D."'],['N','Haze Dynamics. Ele vendeu a gente pro laboratório? O que esse maníaco doente queria?'],['P','Vejo que as andorinhas vieram pro bico da águia. Vocês têm uma coisa que me pertence.'],['NC','VICTOR?!'],['P','Ilha Point Haze, amanhã ao entardecer. Venham sozinhos.'],['C','É uma armadilha, com certeza… mas é o único jeito de chegar nele.']],()=>{if(!CHEAT.used&&V.loot&&!V.tonyPaid){V.tonyPaid=true;money(-2000,'TONY · 8% · −$2.000')}V.card=true;campNext()})},
  skip(V){V.card=true;campNext()}},
 ]};
/* ================= MISSÃO 4 · POINT HAZE ================= */
function campHover(V){return campCarGet('hover',()=>{const L=campPoi('lh');if(!L)return null;const v=campCar('vortex',L,L.a||0,'#ff7a1a');return v})}
function campLangSpot(){const h=LAB.hatch,me=campMe();if(!h)return{x:me.x+8,z:me.z};const dx=h.x-me.x,dz=h.z-me.z,d=Math.hypot(dx,dz)||1,k=Math.min(18,d*.4);return{x:me.x+dx/d*k,z:me.z+dz/d*k}}
function campPoliceHeli(){let h=HELI.list.find(q=>q.police&&q.state==='parked'&&q.o);if(h)return h;const q=mapPoiEntries().find(e=>e.k==='pol');const base=q?campCurb(q,[10,0]):campCurb(campMe(),[20,0]);try{h=heliAddPad(base.x,base.z,0,'campHeli',true);return h}catch(e){console.warn('[campanha] heli',e);return null}}
const CAMP_M4={id:'m4',title:'Point Haze',needs:['m3'],hour:17,hookDelay:90,sms:'Claire: Venha às 17h para o motel, vamos nos organizar.',startAt:()=>campPoi('motel'),
 unlock:['haze','rift'],reveal:['lab'],unlockTxt:'Point Haze e a fenda liberados',
 stages:[
 {id:'motelSplit',who:0,cp:true,obj:'Vá ao quarto 6',allow:['motel'],fail:{wanted:true},
  enter(V){if(CHAR.cur!==0)campSwitch(0,campMe());if(PL.inside!=='motel')campGPS(campPoi('motel'))},
  tick(dt,V){if(PL.inside!=='motel'){if(!CAMP.tgt)campGPS(campPoi('motel'));return}CAMP.tgt=null;storyClearObjective();
   campInRoomTalk('motel','C',campMotelSpot,[['C','Ele mandou vir pelo mar porque a ponte é dele. Então a saída vai ser pelo céu.'],['N','Você pilota?'],['C','Três anos de presos falando de fuga. Eu aprendi a teoria.'],['N','Ótimo. Eu levo a maleta de hovercraft. Você pega o helicóptero da delegacia e fica de olho.']],()=>campNext())},
  skip(V){campNext()}},
 {id:'hoverGet',who:0,obj:'Pegue o hovercraft na orla',sub:'perto do farol',fail:{},
  enter(V){const h=campHover(V);if(h)campGPS(h)},
  tick(dt,V){const h=CAMP.cars.hover;if(!h||campCarGone(h)){CAMP.cars.hover=null;const n=campHover(V);if(n)campGPS(n);return}if(PL.car===h){CAMP.tgt=null;storyClearObjective();campNext()}},
  skip(V){const h=campHover(V);if(h)campBoard(h);campNext()}},
 {id:'seaRun',who:0,cp:true,obj:'Atravesse até Point Haze pelo mar',sub:'mar adentro, longe da costa · a ponte é do Lang',allow:['haze'],fail:{},
  enter(V,opt){if(opt.car&&opt.car.type==='vortex')CAMP.cars.hover=opt.car;campGPS(null)},
  tick(dt,V){if(city.haze&&!HAZE.switching){V.hazeAt={x:campMe().x,z:campMe().z};campNext()}},
  skip(V){if(!city.haze)void hazeShift(true)}},
 {id:'pierMeet',who:0,obj:'Encontre o Lang',fail:{},
  enter(V){campEnsureGun();const L=campLangSpot();CAMP.flags.L=L;CAMP.flags.lang=campActor('V',L.x,L.z);campActor('G',L.x+1.6,L.z+1.2);campActor('G',L.x-1.6,L.z+1.2);campGPS(L)},
  tick(dt,V){const L=CAMP.flags.L;if(!L||CAMP.flags.talked)return;if(campNear(L,16)){CAMP.flags.talked=true;CAMP.tgt=null;storyClearObjective();
   campTalk([['V','Nathan. Sem a Claire? Esperto…'],['N','Sem gracinhas. Foi você naquela noite, seu verme.'],['V','Foram apenas negócios. O laboratório queria alguém que soubesse dirigir rápido para um teste. A Claire era perfeita. Você só estava atrapalhando.'],['V','A maleta. Ela é minha. Me devolva.'],['N','Vem buscar.'],['V','PEGUEM ELE!']],()=>{campActorsClear();campNext()})}},
  skip(V){campActorsClear();campNext()}},
 {id:'labRun',who:0,cp:true,obj:'Entre no laboratório',fail:{},
  enter(V,opt){campEnsureGun();const L=CAMP.flags.L||campLangSpot();campGangAdd(3,'pistol',L.x,L.z,3);campGPS(campPoi('lab'))},
  tick(dt,V){if(PL.inside==='lab'){CAMP.tgt=null;storyClearObjective();campNext()}},
  skip(V){try{if(PL.car){PL.car=null}labEnter()}catch(e){}}},
 {id:'labB2',who:0,obj:'Desça até a Sala da Fenda (B2)',sub:'o cartão da maleta abre a porta',allow:['rift'],fail:{},
  enter(V){if(!LAB.card){LAB.card=true;toast('<span style="color:#7ab8ff">'+translatePlain('CARTÃO DA MALETA')+'</span><br><small style="font-size:11px;color:#fff">B2</small>')}if(PL.inside!=='lab')campGPS(campPoi('lab'))},
  tick(dt,V){if(PL.inside!=='lab'){if(!CAMP.tgt)campGPS(campPoi('lab'));return}if(CAMP.tgt){CAMP.tgt=null;storyClearObjective()}const F=labFloorAt();if(F&&F.f===2)campNext()},
  skip(V){const F2=(LAB.F||[]).find(F=>F.f===2);if(F2&&PL.inside==='lab')labGoFloor(F2,0,0);campNext()}},
 {id:'maskRoom',who:0,obj:'Pegue o artefato do cofre',sub:'ARTEFATO 0-17',allow:['rift'],fail:{},
  enter(V){if(LAB.safe)campMark(LAB.safe.x,LAB.safe.z)},
  tick(dt,V){if(PL.inside!=='lab')return;if(MASK.have&&!CAMP.flags.talked){CAMP.flags.talked=true;campTalk([['N','"Artefato 0-17. Exposição prolongada altera o comportamento do usuário." …Uma máscara?'],['R','Seja lá o que for, deve valer uma grana boa. Sai logo daí.']],()=>campNext())}},
  skip(V){MASK.have=true}},
 {id:'riftJump',who:0,cp:true,obj:'Pule no portal da fenda',sub:'a única saída',allow:['rift'],fail:{},
  enter(V,opt){if(!CAMP.flags.said&&PL.inside==='lab'){CAMP.flags.said=true;campTalk([['V','Não tem saída, Nathan. A maleta, por favor.'],['N','Sempre tem uma saída.'],['V','SEU PATIFE, VOLTE AQUI!']],()=>{try{campGangAdd(2,'pistol',PL.x,PL.z+5,1.5)}catch(e){}})}if(LAB.portal&&LAB.portal.g){const w=new THREE.Vector3();LAB.portal.g.getWorldPosition(w);campMark(w.x,w.z)}},
  tick(dt,V){if(S.style==='inverted'&&!INVERT.switching){campNext()}else if(PL.inside!=='lab'&&S.style!=='inverted'&&!CAMP.tgt)campGPS(campPoi('lab'))},
  skip(V){void invertShiftWorld('inverted','CAINDO PELA FENDA…',false,{fromLab:PL.inside==='lab'})}},
 {id:'upsideRun',who:0,cp:true,obj:'Encontre a saída do mundo invertido',sub:'abrigue-se nos prédios',fail:{},
  enter(V){campThink('Que loucura, um espelho da realidade… é a nossa cidade, mas morta!',4);if(INVERT.portal)campGPS({x:INVERT.portal.x,z:INVERT.portal.z})},
  tick(dt,V){if(INVERT.portal&&!CAMP.tgt&&S.style==='inverted')campGPS({x:INVERT.portal.x,z:INVERT.portal.z});
   if(maskOn()&&!V.maskUsed){V.maskUsed=true;campThink('Eles não me tocam. Eu me sinto… ótimo.',4)}
   if(PL.inside===true&&!CAMP.flags.shelter){CAMP.flags.shelter=true;campThink('Aqui dentro eles não entram.',3.5)}
   if(S.style!=='inverted'&&!INVERT.switching){V.nPos={x:PL.x,z:PL.z};campNext()}},
  skip(V){void invertShiftWorld('modern','FECHANDO A FENDA…',false)}},
 {id:'heliSteal',who:1,cp:true,obj:'Roube o helicóptero da delegacia',fail:{},
  enter(V,opt){if(!V.nPos)V.nPos={x:PL.x,z:PL.z};const h=campPoliceHeli();CAMP.flags.h=h;const p=h?{x:(h.x??h.pad.x)+7,z:(h.z??h.pad.z)}:campMe();if(CHAR.cur!==1||!opt.restore)campSwitch(1,p,'ENQUANTO ISSO…');if(h)campGPS({x:h.x??h.pad.x,z:h.z??h.pad.z})},
  tick(dt,V){if(PL.heli){CAMP.tgt=null;storyClearObjective();campThink('Teoria, Claire. Só teoria.',3.5);campNext()}},
  skip(V){const h=CAMP.flags.h||campPoliceHeli();if(h)try{heliBoard(h);h.phase='fly';h.y=HELI_ALT*.6}catch(e){}campNext()}},
 {id:'heliFly',who:1,obj:'Voe até o Nathan e pouse perto dele',sub:'F pousa',fail:{},
  enter(V){CAMP.flags.had=!!PL.heli;campGPS(V.nPos)},
  tick(dt,V){if(PL.heli)CAMP.flags.had=true;else if(CAMP.flags.had&&!PARA.active){campFail('O HELICÓPTERO FICOU PRA TRÁS');return}
   const n=V.nPos;if(!n)return;if(!CAMP.flags.nate&&campNear(n,220))CAMP.flags.nate=campActor('N',n.x,n.z);
   if(!CAMP.flags.call&&CAMP.t>4){CAMP.flags.call=true;campThink('Nathan, responde! …Nathan?',4)}
   const h=PL.heli;if(h&&campNear(n,40)&&h.phase==='ground'){CAMP.tgt=null;storyClearObjective();campTalk([['C','Sobe, Nate!'],['N','Eu disse que sempre tem uma saída.'],['C','Você tá dizendo isso pra quem?'],['N','Deixa pra lá, só pilota.']],()=>{campActorDrop(CAMP.flags.nate);campNext()})}},
  skip(V){campNext()}},
 {id:'heliChase',who:1,cp:true,obj:'Fuja do helicóptero do Lang',sub:'aguente 60 s no ar',fail:{},
  enter(V){CAMP.flags.had=!!PL.heli;campTalk([['C','Ele tem um helicóptero também! Segura!']],()=>{try{startWanted(true);wantedUp(2)}catch(e){}})},
  tick(dt,V){if(PL.heli)CAMP.flags.had=true;else if(CAMP.flags.had&&!PARA.active){campFail('O HELICÓPTERO FICOU PRA TRÁS');return}
   tbarShow('camp',translatePlain('FUGA'),Math.min(1,CAMP.t/60));if(CAMP.t>=60&&!CAMP.flags.end){CAMP.flags.end=true;tbarHide('camp');campTalk([['C','Perdemos o rotor! A gente tem que pular, Nate!']],()=>campNext())}},
  skip(V){campNext()}},
 {id:'paraJump',who:1,obj:'Pule!',sub:'ESPAÇO',fail:{},
  onFail(r){if(!/AFOG|QUEDA|MORREU/.test(r)||!CAMP.flags.jumped)return false;/* caiu no mar ou bateu forte: aparece na areia mais próxima em vez de voltar ao checkpoint */let x=PL.x,z=PL.z;for(let k=1;k<200&&inWater(x,z);k++){const a=k*2.4,r2=k*2.2;x=PL.x+Math.cos(a)*r2;z=PL.z+Math.sin(a)*r2}PARA.active=null;PL.x=x;PL.z=z;PL.gy=groundY(x,z);PL.hp=100;PL.dead=false;PL.down=0;PL.rot=0;PL.sp.visible=true;CAMP.flags.landed=true;return true},
  enter(V){},
  tick(dt,V){if(PARA.active&&!PARA.active.roof)CAMP.flags.jumped=true;if(CAMP.flags.jumped&&!PARA.active&&!PL.heli&&(CAMP.flags.landed||!inWater(PL.x,PL.z)||PL.gy<=groundY(PL.x,PL.z)+.2)){if(POL.wanted)endWanted(true,true);campNext();return}
   if(PL.heli&&PL.heli.phase==='ground'&&!CAMP.flags.jumped){CAMP.flags.jumped=true;try{heliLeave()}catch(e){}}},
  skip(V){if(PL.heli)try{heliLeave()}catch(e){PL.heli=null}PARA.active=null;campNext()}},
 {id:'beachEnd',who:1,obj:null,fail:{},
  enter(V){if(POL.wanted)endWanted(true,true);const me=campMe();campActor('N',me.x+1.6,me.z+.8);
   campTalk([['C','Você trouxe aquela coisa.'],['N','Ela me tirou de lá.'],V.maskUsed?['C','Eu vi você pelo rádio, Nate. Você estava rindo. Joga isso no mar.']:['C','Ou então deixa ela na mochila. Fechada.'],['N','O Lang disse que o laboratório queria você para um teste. Naquela noite.'],['C','Então a prova está naquela noite. Pena que não dá pra voltar no tempo.'],['N','…Talvez dê.']],()=>{V.m4mask=!!V.maskUsed;campNext()})},
  skip(V){campNext()}},
 ]};
/* ================= MISSÃO 5 · FIM DE LINHA ================= */
function campDmc(V,at){if(PL.car&&PL.car.special&&PL.car.type==='super'){CAMP.cars.dmc=PL.car;PL.car.campTag='dmc'}return campCarGet('dmc',()=>{const p=at||campCurb(campPoi('tune')||campMe(),[5,0]);const v=campCar('super',p,0,'#92969d');v.special=true;v.hasNitro=true;v.hasGlow=false;v.legal=true;v.owned=true;return v})}
function campDmcCar(){const c=PL.car;if(c&&c.special&&c.type==='super'){CAMP.cars.dmc=c;return c}return CAMP.cars.dmc}
function campShowdown(V){const d=campPoi('casino')||campMe();const K=city.casino;const nx=K&&K.door&&K.door.nx!=null?K.door.nx:0,nz=K&&K.door&&K.door.nz!=null?K.door.nz:1;
 const L={x:d.x+nx*9,z:d.z+nz*9};V.langPos=L;V.tonyPos={x:L.x+2.4,z:L.z+.8};return L}
const CAMP_M5={id:'m5',title:'Fim da linha',needs:['m4'],hour:20,hookDelay:120,sms:'Tony: Sei de um mecânico com um carro que vocês não vão acreditar. Vão para a oficina, agora!',startAt:()=>campPoi('tune'),
 unlock:['synth'],reveal:[],unlockTxt:'cidade inteira liberada',
 stages:[
 {id:'shopTalk',who:0,obj:null,fail:{},
  enter(V){if(CHAR.cur!==0)campSwitch(0,campMe());const me=campMe();const dmc=campDmc(V);campActor('T',me.x+1.8,me.z+1.2);campActor('C',me.x-1.6,me.z+1);
   campTalk([['T','O dono sumiu faz anos. Dizem que o carro também some, se passar de 140.'],['C','A noite em que o Lang me entregou. Ele fechou o negócio na boate, eu ouvi isso na cadeia.'],['N','E o dono da boate gravava tudo no escritório, por segurança.'],['C','Então a fita existe… mas só naquela noite.'],['N','Eu dirijo. Você busca a fita.']],()=>campNext())},
  skip(V){campNext()}},
 {id:'timeGo',who:0,cp:true,obj:'Entre no DeLorean e chegue a 140 km/h',sub:'a Claire vai junto',allow:['synth'],fail:{car:V=>TIMEJUMP.busy?undefined:campDmcCar(),carMsg:'O DELOREAN FOI DESTRUÍDO'},
  enter(V,opt){if(opt.car&&opt.car.special)CAMP.cars.dmc=opt.car;const dmc=campDmc(V);if(PL.car!==dmc)campGPS(dmc)},
  tick(dt,V){const dmc=campDmcCar();if(PL.car===dmc&&CAMP.tgt){CAMP.tgt=null;storyClearObjective()}if(S.style==='synthwave'&&!TIMEJUMP.busy&&!TIMEJUMP.loading){campDmc(V);campNext()}},
  skip(V){const dmc=campDmc(V);if(PL.car!==dmc)campBoard(dmc);TIMEJUMP.cool=0;void timeJump()}},
 {id:'tailLang',who:0,cp:true,obj:'Siga o carro do Lang sem ser visto',sub:'nem perto demais, nem longe demais',fail:{car:V=>campDmcCar(),carMsg:'O DELOREAN FOI DESTRUÍDO'},
  enter(V,opt){if(opt.car&&opt.car.special)CAMP.cars.dmc=opt.car;campDmc(V);const me=campMe(),c=PL.car,fx=c?Math.cos(c.a):1,fz=c?Math.sin(c.a):0;
   const p=campCurb({x:me.x+fx*55,z:me.z+fz*55});const lang=campCarGet('lang',()=>{const v=campCar('sedan',p,c?c.a:0,'#1a1a22');return v});lang.hand=false;lang.sleep=false;
   campThink('IMPOSSÍVEL… voltamos pra fatídica noite em que eu fui presa!',4.5)},
  tick(dt,V){const lang=CAMP.cars.lang,club=campPoi('club');if(!lang||campCarGone(lang)){campFail('O CARRO DO LANG SUMIU');return}if(!club)return;
   lang.sleep=false;lang.keep=true;try{taxiDrive(lang,dt,club.x,club.z,8,20)}catch(e){}CAMP.tgt={x:lang.x,z:lang.z};
   const d=Math.hypot(campMe().x-lang.x,campMe().z-lang.z);
   if(d>110){CAMP.flags.lost=(CAMP.flags.lost||0)+dt;tbarShow('camp',translatePlain('PERDENDO O LANG'),1-CAMP.flags.lost/10)}else{CAMP.flags.lost=0;tbarHide('camp')}
   if(d<18){CAMP.flags.close=(CAMP.flags.close||0)+dt;if(!CAMP.flags.warn){CAMP.flags.warn=true;toast(translatePlain('MUITO PERTO'))}}else{CAMP.flags.close=Math.max(0,(CAMP.flags.close||0)-dt);CAMP.flags.warn=false}
   if(CAMP.flags.lost>10){campFail('VOCÊ PERDEU O LANG DE VISTA');return}if(CAMP.flags.close>5){campFail('O LANG TE VIU');return}
   sideHud(translatePlain('DISTÂNCIA DO LANG')+' · '+Math.round(d)+' m');
   if(Math.hypot(lang.x-club.x,lang.z-club.z)<30){sideHud(null);tbarHide('camp');lang.thr=0;lang.hand=true;campNext()}},
  skip(V){const club=campPoi('club'),lang=CAMP.cars.lang;if(lang&&club){lang.x=club.x+6;lang.z=club.z;syncCar(lang,0)}const dmc=campDmcCar();if(dmc&&club){const p=campCurb(club,[0,24]);T0go(dmc,p)}campNext()}},
 {id:'clubIn',who:1,cp:true,obj:'Entre na boate e ache o escritório',sub:'atrás do bar',allow:['casino'],fail:{wanted:'OS SEGURANÇAS TE PEGARAM'},
  enter(V,opt){const club=campPoi('club');const dmc=campDmcCar();if(dmc&&PL.car===dmc){dmc.thr=0;dmc.hand=true;dmc.vx=dmc.vz=dmc.fwd=0}
   if(CHAR.cur!==1||!opt.restore)campSwitch(1,club?{x:club.x+1.5,z:club.z+1.5}:null,'');if(dmc){dmc.hand=true;dmc.keep=true}if(!CAMP.flags.said){CAMP.flags.said=true;campThink('Ninguém aqui me conhece. Ainda.',3.5)}if(PL.inside!=='club')campGPS(club)},
  tick(dt,V){if(PL.inside!=='club'){if(!CAMP.tgt)campGPS(campPoi('club'));return}if(CAMP.tgt){CAMP.tgt=null;storyClearObjective()}
   const B=CAS.bar;if(!B)return;if(!CAMP.flags.mk){CAMP.flags.mk=true;campMark(B.x-1.2,B.z-1.6)}
   if(Math.hypot(PL.x-(B.x-1.2),PL.z-(B.z-1.6))<2.4&&!CAMP.flags.got){CAMP.flags.got=true;campMarksClear();V.tape=true;campTalk([['C','"Lang — Haze Dynamics — entrega da motorista". Peguei.']],()=>campNext())}},
  skip(V){V.tape=true;campNext()}},
 {id:'timeBack',who:0,cp:true,obj:'Volte para o presente: 140 km/h',sub:'de volta ao DeLorean',allow:['synth'],fail:{car:V=>TIMEJUMP.busy?undefined:campDmcCar(),carMsg:'O DELOREAN FOI DESTRUÍDO'},
  enter(V,opt){if(opt.car&&opt.car.special)CAMP.cars.dmc=opt.car;const club=campPoi('club');const dmc=campDmc(V,club?campCurb(club,[0,6]):null);
   if(CHAR.cur!==0||!opt.restore){campSwitch(0,dmc?{x:dmc.x+2,z:dmc.z}:club,'');if(dmc)campBoard(dmc)}if(CAMP.cars.lang&&vehicles.includes(CAMP.cars.lang))removeVehicle(CAMP.cars.lang);delete CAMP.cars.lang},
  tick(dt,V){if(S.style==='modern'&&!TIMEJUMP.busy&&!TIMEJUMP.loading){campDmc(V);campNext()}},
  skip(V){const dmc=campDmc(V);if(PL.car!==dmc)campBoard(dmc);TIMEJUMP.cool=0;void timeJump()}},
 {id:'policeCall',who:0,obj:null,fail:{},
  enter(V){campTalk([['P','Bonito o carro. Mas eu tenho uma coisa que vocês querem mais: o Tony.'],['P','Terraço do Cassino Sunset Royale. Tragam a fita e a máscara.']],()=>campNext())},
  skip(V){campNext()}},
 {id:'casinoRoof',who:0,cp:true,obj:'Vá ao Cassino Sunset Royale',sub:'o Lang está com o Tony',fail:{},
  enter(V){campEnsureGun();campGPS(campPoi('casino'))},
  tick(dt,V){if(campNear(campPoi('casino'),16)){CAMP.tgt=null;storyClearObjective();campNext()}},
  skip(V){campNext()}},
 {id:'choice',who:0,obj:null,fail:{},
  enter(V){if(PL.car){const c=PL.car;c.thr=0;c.hand=true;c.vx=c.vz=c.fwd=0}const L=campShowdown(V);if(!MASK.have)MASK.have=true;
   campActor('V',L.x,L.z);campActor('T',V.tonyPos.x,V.tonyPos.z);for(const o of [[-2.4,-1],[2.4,-1.4],[-1.2,2],[1.4,2.4]])campActor('G',L.x+o[0],L.z+o[1]);const me=campMe();campActor('C',me.x+1.5,me.z+.6);
   campTalk([['V','A máscara, Nathan. Ou coloca e me mostra o que ela faz.'],['C','Nate. Olha pra mim. Não.'],['N','…']],r=>{V.choice=r===0?'mask':'clean';campGo(r===0?'fightMask':'fightClean')},['USAR A MÁSCARA','GUARDAR A MÁSCARA'])},
  skip(V){V.choice='clean';campGo('fightClean')}},
 {id:'fightMask',who:0,obj:'Acabe com o Lang',sub:'ninguém encosta em você',fail:{},
  enter(V){if(PL.car){PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}const L=V.langPos||campShowdown(V);try{maskWear(true)}catch(e){}
   campActor('T',V.tonyPos.x,V.tonyPos.z);const me=campMe();campActor('C',me.x+1.5,me.z+.6);campGangAdd(4,'smg',L.x,L.z,3);campGangAdd(1,'pistol',L.x,L.z,.3,CAMP_LANG_PAL)},
  tick(dt,V){PL.hp=Math.max(PL.hp,60);if(!campGangAlive().length&&CAMP.t>1)campGo('endBad')},
  skip(V){campGangClear();campGo('endBad')}},
 {id:'fightClean',who:0,obj:'Proteja o Tony e derrube os capangas',sub:'a Claire te cobre',fail:{},
  enter(V){if(PL.car){PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}const L=V.langPos||campShowdown(V);campEnsureGun();
   CAMP.flags.tony=campActor('T',V.tonyPos.x,V.tonyPos.z);CAMP.flags.lang=campActor('V',L.x,L.z);const me=campMe();campActor('C',me.x+1.5,me.z+.6);campGangAdd(4,'pistol',L.x,L.z,3.5)},
  tick(dt,V){const t=CAMP.flags.tony;if(t&&(!peds.includes(t)||t.state==='dead'||t.hp<=0)){campFail('O TONY MORREU');return}
   const l=CAMP.flags.lang;if(l&&(!peds.includes(l)||l.state==='dead'||l.hp<=0)&&!CAMP.flags.lDead){CAMP.flags.lDead=true}
   if(!campGangAlive().length&&CAMP.t>1&&!CAMP.flags.end){CAMP.flags.end=true;campGo('endGood')}},
  skip(V){campGangClear();campGo('endGood')}},
 {id:'endBad',who:0,obj:null,fail:{},
  enter(V){const me=campMe();campActor('C',me.x+1.5,me.z+.6);V.ending='bad';
   campTalk([['N','Acabou. Viu? Ninguém encosta na gente.'],['C','Eu vi. Você rindo, igual a ele naquela fita.'],['C','Três anos eu esperei o Nathan voltar. Quem voltou foi isso… essa coisa.'],['N','Claire…'],['C','Adeus, Nate. Não me procure mais, por favor. Está tudo acabado.']],()=>campFinish())},
  skip(V){V.ending='bad';campFinish()}},
 {id:'endGood',who:0,obj:null,fail:{},
  enter(V){const me=campMe();campActor('C',me.x+1.5,me.z+.6);V.ending='good';if(CAMP.flags.lang)campActorDrop(CAMP.flags.lang);
   campTalk([['N','A fita vai pra polícia junto com ele. E a máscara vai pro mar.'],['C','Três anos, Nate.'],['N','Eu sei. Dessa vez eu fiquei.'],['C','Agora sim. Agora tudo vai ser normal.']],()=>{try{maskInstantOff()}catch(e){}MASK.have=false;campFinish()})},
  skip(V){V.ending='good';MASK.have=false;campFinish()}},
 ]};
function T0go(c,p){c.x=p.x;c.z=p.z;c.vx=c.vz=c.fwd=0;try{syncCar(c,0)}catch(e){}if(PL.car===c){PL.x=p.x;PL.z=p.z}}

const CAMP_MISSIONS=[CAMP_M2,CAMP_M3,CAMP_M4,CAMP_M5];
/* todas as missões entram na lista da história já agora: a campanha só fica "concluída" (STORY.cleared) depois da 5 */
for(const [id,title] of [['m2','Planta baixa'],['m3','Sunset Bank'],['m4','Point Haze'],['m5','Fim da linha']]){const needs=[{m2:'pier',m3:'m2',m4:'m3',m5:'m4'}[id]];
 STORY_MISSIONS.push({id,title,needs,unlock:[],reveal:[],world:[],after:()=>{},start:()=>{const m=campM(id);if(!m||!campV().hook[id]||CAMP.id)return null;return m.startAt()},
  script:{active:()=>CAMP.id===id,cut:()=>CAMP.cut||CAMP.failing,begin:()=>{campV().hook[id]=true;campStart(id)},reset:()=>campReset(),tick:()=>{},cutTick:()=>{},skip:()=>campDebugNext(),complete:()=>{if(CAMP.id===id)campFinish()}}})}
