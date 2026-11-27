'use strict';
/* Coastal Chaos · js/20-tv-fisica-carros.js — TV da casa segura, instancing de carros, física dos carros.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= TV da casa segura ================= */
const TVM={on:false,foc:{x:0,z:0},ang:0,kind:null,saved:null,sideHeld:false};
function tvSpot(){return SAFE.tvPos||(SAFE.IN?{x:SAFE.IN.x-.3,z:SAFE.IN.z-.2}:null)}
function tvNear(){const t=tvSpot();return !!(t&&PL.inside===true&&Math.hypot(PL.x-t.x,PL.z-t.z)<2)}
function tvDryGround(){if(WET.wf)WET.wf.fill(0);if(WET.grid)WET.grid.fill(0);WET.max=0;WET.t=0;if(WET.tex)WET.tex.needsUpdate=true;if(WET.mesh)WET.mesh.visible=false;if(WET.mesh2)WET.mesh2.visible=false}
function tvRestoreWeather(dry=false){
 if(!TVM.saved)return;
 applyWx(TVM.saved.weather);Object.assign(WX,TVM.saved.transient);
 if(dry)tvDryGround();
 for(let i=0;i<6;i++){const c=CELLS[i];if(c)CELLS_U[i].set(c.x,c.z,c.r,c.s);else CELLS_U[i].set(0,0,1,0)}
 LT.seq=[];LT.flash=0;for(const b of LT.bolts){scene.remove(b.g);disposeGroup(b.g)}LT.bolts=[];
}
const TV_CHANNELS=['storm','chase','blitz','pollution','parachute','airport','forest'];
function tvForestSite(){const f=city.forest;return f&&city.info[f.ri]?.forest&&city.rects[f.ri]?f:null}
function tvAvailableChannels(){return TV_CHANNELS.filter(k=>k!=='forest'||tvForestSite())}

function tvClearScene(){
 if(BLITZ.on?.broadcast)blitzEnd();
 if(TVM.scene){scene.remove(TVM.scene);disposeGroup(TVM.scene);TVM.scene=null}
 if(TVM.parachutist){paraDrop(TVM.parachutist.g);TVM.parachutist=null}
 for(const v of TVM.props||[])if(vehicles.includes(v))removeVehicle(v);
 for(const q of TVM.officers||[])if(peds.includes(q))removePed(q);
 TVM.props=[];TVM.officers=[];TVM.elapsed=0;TVM.angT=null;TVM.camH=null;
}
function tvRoadblock(){
 if(!blitzMake('calm'))return false;
 BLITZ.on.broadcast=true;TVM.foc={x:BLITZ.on.x,z:BLITZ.on.z};return true;
}
function tvParachuteStart(){
 const site=PARA.sites.find(q=>q.landings?.length);if(!site)return false;
 const end=site.landings[Math.floor(Math.random()*site.landings.length)];
 // Film the beach-side part of the descent, within the configured view range.
 const viewRange=Math.max(32,Math.min(DRAW_FOG_BASE.far,drawDistanceMeters())),height=clamp(viewRange*.23,7,48);
 const x=site.x+(end.x-site.x)*.72,z=site.z+(end.z-site.z)*.72;
 TVM.parachutist={g:paraModel(true),x,z,y:groundY(end.x,end.z)+height,tx:end.x,tz:end.z};
 TVM.foc={x,z};return true;
}
function tvAirportReady(){
 if(!city.air)return false;airTick2(0);const P=AIRP,A=city.air;if(!P.p)return false;
 if(A.compact){P.st='flyby';P.s=-A.L/2-145;P.l=A.rl;P.y=52;P.th=0;P.t=0}
 else{P.st='roll';P.s=-A.L/2+34;P.l=A.rl;P.th=0;P.y=AIRY;P.v=12;P.vy=0;P.roll=P.pitch=0;P.next='to';P.t=0;P.spoilerLift=0}
 const q=airPt(P.s,P.l);P.p.g.position.set(q[0],P.y,q[1]);P.p.g.visible=true;TVM.foc={x:q[0],z:q[1]};return true;
}
const TV_IDENTITIES={
 forest:{name:'ALÉM DO SINAL',tag:'ARQUIVOS DA CIDADE',live:'● SOBREVOO DA FLORESTA',section:'MISTÉRIOS DE SUNSET SHORES',mark:'<path d="m16 3 13 25H3Z"/><path d="m8 18 8-5 8 5-8 5Z"/><circle cx="16" cy="18" r="2"/>'},
 storm:{name:'CÉU AGORA',tag:'TEMPO & CIDADE',live:'● MONITORAMENTO AO VIVO',section:'ALERTA METEOROLÓGICO',mark:'<path d="M8 19a6 6 0 1 1 2-12 8 8 0 0 1 15 4 4 4 0 0 1-1 8H8Z"/><path d="m10 23-2 4m10-4-2 4m10-4-2 4"/>'},
 chase:{name:'PIXEL NEWS',tag:'PLANTÃO',live:'● IMAGENS AO VIVO',section:'ACOMPANHAMENTO AÉREO',mark:'<path d="M5 26V6h9a6 6 0 0 1 0 12H5m17-12h5v20h-5"/>'},
 blitz:{name:'CIDADE 24',tag:'SEGURANÇA EM PAUTA',live:'● OPERAÇÃO AO VIVO',section:'NAS RUAS',mark:'<path d="M16 3 28 8v8c0 7-12 13-12 13S4 23 4 16V8Z"/><path d="m10 16 4 4 8-9"/>'},
 pollution:{name:'TERRA VIVA',tag:'AMBIENTE URBANO',live:'● OBSERVATÓRIO',section:'RIOS DA CIDADE',mark:'<path d="m16 2 12 14-12 14L4 16Z"/>'},
 parachute:{name:'SALTO LIVRE',tag:'VIVA LÁ FORA',live:'● NO AR',section:'EXPLORE SUNSET SHORES',mark:'<path d="M3 14a13 13 0 0 1 26 0Zm0 0 13 12 13-12M16 3c-6 4-6 7-6 11m6-11c6 4 6 7 6 11M16 14v16"/>'},
 airport:{name:'HORIZONTE',tag:'CONEXÕES & DESTINOS',live:'● AEROPORTO AO VIVO',section:'SUNSET SHORES INTERNACIONAL',mark:'<path d="M16 3v26m0-19L4 19v3l12-5 12 5v-3L16 10m-5 20 5-4 5 4"/>'}
};
function tvApplyIdentity(kind){
 const id=TV_IDENTITIES[kind],bar=$('#tvbar');if(!id)return;
 bar.dataset.channel=kind;
 $('#tvbar .tvlogo').innerHTML='<svg class="tvmark" viewBox="0 0 32 32" aria-hidden="true">'+id.mark+'</svg><span>'+id.name+'<b>'+id.tag+'</b></span>';
 $('#tvbar .tvlive').textContent=id.live;
 $('#tvHead').dataset.kicker='CANAL '+(TV_CHANNELS.indexOf(kind)+1)+' / '+id.section;
}
function tvChannel(kind){
 if(!TVM.on)return;
 if(kind==='forest'&&!tvForestSite())kind='storm';
 tvClearScene();evtEnd();tvRestoreWeather(true);for(const p of peds.slice())if(!TVM.saved.peds.has(p))removePed(p);TVM.kind=kind;TVM.camH=null;TVM.angT=null;TVM.chk=0;TVM.sideHeld=true;TVM.props=[];TVM.officers=[];
 const r=city.rects[Math.floor(Math.random()*city.rects.length)];TVM.foc={x:(r[0]+r[2])/2,z:Math.round(r[1]/P)*P};TVM.ang=Math.random()*6.283;
 if(kind==='chase'){const cr=evtSpawn(TVM.foc,30,160);if(cr){TVM.foc={x:cr.x,z:cr.z};EVT.life=9999}}
 if(kind==='storm'){
  CELLS.length=0;WX.stormEta=WX.stormNext=WX.calm=null;WX.stormReq=false;WX.cheatStorm=false;WX.freeze=true;WX.lastOpt=S.rain;WX.stormDir=Math.random()*6.283;
  const c=spawnCell(false,null,true);c.s=c.max=1;c.age=60;c.life=1e9;WX.stormCell=c;
  Object.assign(WX,{cover:1,coverMsg:true,pre:0,f:1,storm:1,stormAmt:1,gloom:1,fair:0,fairTg:0,wet:true});LT.t=1;
 }
 if(kind==='blitz')tvRoadblock();
 if(kind==='forest'){const f=tvForestSite();TVM.foc={x:f.x,z:f.z};}
 if(kind==='pollution'){
  let best=null,value=-1;
  for(const w of city.water||[]){if(w.cutOnly||w.estuary)continue;for(let i=1;i<6;i++)for(let j=1;j<6;j++){const x=w[0]+(w[2]-w[0])*i/6,z=w[1]+(w[3]-w[1])*j/6,v=pollAt(x,z);if(v>value){value=v;best={x,z}}}}
  TVM.polluted=value>.05;if(best)TVM.foc=best;
 }
 if(kind==='parachute')tvParachuteStart();
 if(kind==='airport')tvAirportReady();
 // The broadcast has its own population focus while the player stays inside the house.
 buildCarHash();buildLanes();populate(true);
 const n=Math.min(pedTarget(),MOB_LITE?24:42);for(let i=0;i<n;i++)spawnPed({x:TVM.foc.x,z:TVM.foc.z,min:20,max:110});
 const programs={
 forest:['SERÁ QUE EXISTE ALGO DE MISTERIOSO NESSAS MATAS?','Há rumores de que um demogorgon escapou para nosso mundo e se esconde aqui!'],
 storm:['TEMPESTADE FORTE NA CIDADE','Chuva intensa, ventania e raios · motoristas enfrentam pista escorregadia · moradores correm para se abrigar'],
 chase:['PERSEGUIÇÃO POLICIAL EM ANDAMENTO','Viatura persegue suspeito em alta velocidade'],
 blitz:['OPERAÇÃO PREVENTIVA','Blitz da polícia: fiscalização e operações preventivas para conter criminosos e aumentar a segurança nas ruas'],
 pollution:['POLUIÇÃO: UM DESAFIO URBANO',TVM.polluted?'Rios perto de áreas industriais revelam os impactos da poluição nas grandes cidades · preservar a água é cuidar da cidade':'A poluição é um problema urbano nas grandes cidades · nesta região, não há mancha industrial visível'],
 parachute:['UMA NOVA VISTA DE SUNSET SHORES','Experimente você também!'],
 airport:['AEROPORTO INTERNACIONAL DE SUNSET SHORES','Conectando pessoas, turismo e negócios · o Aeroporto Internacional de Sunset Shores impulsionou a economia e valorizou a cidade']};
 const info=programs[kind];tvApplyIdentity(kind);$('#tvHead').textContent=info[0];
 $('#tvTick').textContent=info[1]+' · '+TV_IDENTITIES[kind].name;
 updateCamera(0);updateWeather(0);updateDayNight(0,true);
}
$('#tvPrev').addEventListener('click',()=>tvChangeChannel(-1));$('#tvNext').addEventListener('click',()=>tvChangeChannel());$('#tvExit').addEventListener('click',()=>tvOff());
function tvChangeChannel(dir=1){const channels=tvAvailableChannels(),i=channels.indexOf(TVM.kind);tvChannel(channels[(i+dir+channels.length)%channels.length])}
function tvOn(){
 TVM.saved={weather:wxState(),transient:{},cars:new Set(vehicles),peds:new Set(peds)};
 for(const k of ['f','storm','stormAmt','gloom','fair','fairTg','fairT','wet','lastOpt','stormReq','stormChance','msgT'])TVM.saved.transient[k]=WX[k];
 TVM.on=true;TVM.sideHeld=false;keys.KeyA=keys.KeyD=keys.ArrowLeft=keys.ArrowRight=false;GUN.firing=false;
 tvChannel('storm');$('#hud').hidden=true;$('#tvbar').hidden=false;$('#tvp').hidden=true;if($('#mon'))$('#mon').style.visibility='hidden';
}
function tvOff(){
 if(!TVM.on)return;tvClearScene();evtEnd();tvRestoreWeather(true);
 for(const c of vehicles.slice())if(!TVM.saved.cars.has(c)&&c!==PL.car&&c!==PL.lastCar)removeVehicle(c);
 for(const p of peds.slice())if(!TVM.saved.peds.has(p))removePed(p);
 TVM.on=false;TVM.saved=null;TVM.kind=null;TVM.sideHeld=false;
 keys.KeyA=keys.KeyD=keys.ArrowLeft=keys.ArrowRight=false;PL.vx=PL.vz=0;
 $('#tvbar').hidden=true;delete $('#tvbar').dataset.channel;delete $('#tvHead').dataset.kicker;$('#tvbar .tvlogo').innerHTML='PIXEL<b>NEWS</b>';$('#tvbar .tvlive').textContent='● AO VIVO';$('#hud').hidden=false;if($('#mon'))$('#mon').style.visibility='';updateCamera(0);updateWeather(0);tvDryGround();updateDayNight(0,true);
}
function broadcastSafeShot(focus,desired){
 const dx=desired.x-focus.x,dz=desired.z-focus.z,r=Math.hypot(dx,dz),base=Math.atan2(dz,dx),fy=focus.y||1;
 const clear=(a,h)=>{for(let k=1;k<=12;k++){const f=k/12,x=focus.x+Math.cos(a)*r*f,z=focus.z+Math.sin(a)*r*f,b=bldAt(x,z,1.8);if(b){let top=0;try{top=roofTop(b)||0}catch(e){}if(top+3>fy+(h-fy)*f)return false}}return true};
 for(let rise=0;rise<=96;rise+=24)for(let i=0;i<=16;i++){const a=base+(i?((i%2?1:-1)*Math.ceil(i/2)*Math.PI/8):0),h=desired.y+rise;if(clear(a,h))return{x:focus.x+Math.cos(a)*r,y:h,z:focus.z+Math.sin(a)*r};}
 return{x:focus.x+dx,y:desired.y+200,z:focus.z+dz};
}
function broadcastCam(dt,bc){
 const cr=bc===TVM&&bc.kind==='chase'&&EVT.cars[0]&&vehicles.includes(EVT.cars[0])?EVT.cars[0]:null;if(cr){bc.foc.x+=(cr.x-bc.foc.x)*Math.min(1,dt*2);bc.foc.z+=(cr.z-bc.foc.z)*Math.min(1,dt*2)}
 bc.ang+=dt*.06;const R=bc.kind==='benchmark'?56:bc.kind==='storm'?42:bc.kind==='blitz'?11.5:46,H=bc.kind==='benchmark'?30:bc.kind==='storm'?24:bc.kind==='blitz'?8:30;
 const pos=broadcastSafeShot({x:bc.foc.x,z:bc.foc.z,y:1},{x:bc.foc.x+Math.cos(bc.ang)*R,y:H,z:bc.foc.z+Math.sin(bc.ang)*R});
 camera.up.set(0,1,0);setLens(bc.kind==='benchmark'?66:50,1);camera.position.set(pos.x,pos.y,pos.z);camera.lookAt(bc.foc.x,1,bc.foc.z);sky.position.copy(camera.position);
}
// Camera stays seaward and looks inland; frame both canopy and terrain below it.
function tvParachuteShot(n,coast,ground){
 const inland=coast===0?[0,1]:coast===1?[0,-1]:coast===2?[1,0]:[-1,0];
 const h=Math.max(0,n.y-ground),d=Math.max(18,h*1.05),rise=Math.max(3,h*.12);
 return {x:n.x-inland[0]*d,y:n.y+rise,z:n.z-inland[1]*d,
 tx:n.x+inland[0]*3,ty:n.y-Math.max(2,h*.40),tz:n.z+inland[1]*3};
}
function tvForestShot(site,angle){
 const r=city.rects[site.ri],span=Math.max(r[2]-r[0],r[3]-r[1]);
 const radius=Math.max(18,Math.min(30,span*.32)),height=Math.max(34,Math.min(60,span*.7));
 return {x:site.x+Math.cos(angle)*radius,y:groundY(site.x,site.z)+height,z:site.z+Math.sin(angle)*radius};
}
function tvCam(dt){
 if(TVM.kind==='forest'){
  const f=tvForestSite();if(!f){tvChangeChannel(1);return}
  TVM.ang+=dt*.035;const shot=tvForestShot(f,TVM.ang);
  camera.up.set(0,1,0);setLens(58,.3);camera.position.set(shot.x,shot.y,shot.z);
  camera.lookAt(f.x,groundY(f.x,f.z)+2,f.z);sky.position.copy(camera.position);return;
 }
 if(TVM.kind==='blitz'&&!BLITZ.on){tvChannel('blitz');return}
 TVM.elapsed=(TVM.elapsed||0)+dt;
 if(TVM.kind==='parachute'&&TVM.parachutist){const n=TVM.parachutist,dy=n.y-groundY(n.tx,n.tz),t=Math.min(1,dt/Math.max(.1,dy/1.8));n.x+=(n.tx-n.x)*t;n.z+=(n.tz-n.z)*t;n.y-=dt*1.8;n.g.position.set(n.x,n.y,n.z);n.g.rotation.y=Math.atan2(n.tx-n.x,n.tz-n.z);TVM.foc={x:n.x,z:n.z};
  const shot=tvParachuteShot(n,city.coast,groundY(n.tx,n.tz));
  camera.up.set(0,1,0);setLens(60,.3);camera.position.set(shot.x,shot.y,shot.z);camera.lookAt(shot.tx,shot.ty,shot.tz);sky.position.copy(camera.position);
  if(dy<.3){paraDrop(n.g);TVM.parachutist=null;tvParachuteStart()}return;
 }
 if(TVM.kind==='airport'&&AIRP.p){const P=AIRP,A=city.air,pos=P.p.g.position;if(!P.p.g.visible||['wait','taxiIn'].includes(P.st)){tvAirportReady()}
  const th=P.th||0,dx=A.ax?Math.cos(th):Math.sin(th),dz=A.ax?Math.sin(th):Math.cos(th);TVM.foc={x:pos.x,z:pos.z};camera.up.set(0,1,0);setLens(62,.5);camera.position.set(pos.x-dx*19-dz*13,pos.y+9,pos.z-dz*19+dx*13);camera.lookAt(pos.x+dx*7,pos.y-1.5,pos.z+dz*7);sky.position.copy(camera.position);return;
 }
 broadcastCam(dt,TVM);
}
function tvTick(dt){const el=$('#tvp');if(!el)return;const show=!TVM.on&&tvNear()&&!menuOpen;if(el.hidden===show)el.hidden=!show;if(TVM.on){if(!PL.inside)tvOff();else{const side=keys.KeyA||keys.KeyD||keys.ArrowLeft||keys.ArrowRight||Math.abs(PAD.lx)>.55;if(side&&!TVM.sideHeld)tvChangeChannel(keys.KeyA||keys.ArrowLeft||PAD.lx<-.55?-1:1);TVM.sideHeld=!!side;}}}
/* v3 r5: motoristas/caronas de NPC (moto, caçamba, conversível) voltam para um pool em vez de serem destruídos e recriados
   a cada vez que o carro entra/sai dos ~160 m (sprite+material+sombra+textura novos a cada vez). Pool por roupa, até 24,
   esvaziado na troca de mundo ou de modo de sprite. */
const RIDER_POOL={list:[],world:-1,s8:null},CONV_NOPACK=new WeakMap();
function riderPoolSync(){const P=RIDER_POOL,w=city.worldNo||0,s8=S.sprite8===true;if(P.world!==w||P.s8!==s8){for(const o of P.list)killChar(o);P.list.length=0;P.world=w;P.s8=s8}}
function riderMake(pal){riderPoolSync();const L=RIDER_POOL.list;for(let i=L.length-1;i>=0;i--){const o=L[i];if(o.pal===pal){L.splice(i,1);o.sp.visible=true;return o}}return makeCharacter(pal)}
function riderFree(o){riderPoolSync();if(!o||!o.sp||o.pal===PLAYER_PAL||RIDER_POOL.list.length>=24){killChar(o);return}o.sp.visible=false;o.sh.visible=false;o.sp.position.y=-9999;o.sh.position.y=-9999;RIDER_POOL.list.push(o)}
function convNoPack(pal){let q=CONV_NOPACK.get(pal);if(!q){q={...pal,pack:false};CONV_NOPACK.set(pal,q)}return q}
function killChar(o){scene.remove(o.sp);scene.remove(o.sh);o.sp.material.dispose();charTexRelease(o.tex);o.sh.geometry.dispose();o.sh.material.dispose()}
// piloto 2D das motos (NPC); some quando a moto é roubada ou quando ele cai
const RIDERS=new Map();
function motoRiderTick(){if(RIDERS.size){for(const[rs,c] of RIDERS)if(!vehicles.includes(c)||c.rs!==rs){riderFree(rs);RIDERS.delete(rs);if(c.rs===rs)c.rs=null}}
 for(const c of vehicles){if(c.type!=='moto'&&!c.jetAI)continue;const show=c.alive&&c.hasRider!==false&&c!==PL.car&&(!!c.ai||c.mode==='rail'||!!c.chase||!!c.jetAI);
  if(!show){if(c.rs){RIDERS.delete(c.rs);riderFree(c.rs);c.rs=null}continue}
  if(!c.rs){c.rpal=c.rpal||pick2(PED_PALS);c.rs=riderMake(c.rpal);c.rs.rot=0;RIDERS.set(c.rs,c)}
  const ca=Math.cos(c.a),sa=Math.sin(c.a),o=c.rs;o.x=c.x-ca*.15;o.z=c.z-sa*.15;o.gy=c.gy+(c.hopY||0)+(c.airY||0)+(c.rampY||0)+(camMode==='top'&&!VIEW.orbit?.04:.08);o.rot=-(c.roll||0)*.9;
  setFrame(o.tex,pickDir(ca,sa,o.x,o.z),0);placeSprite(o);o.sh.visible=false}}
// v107: picape com 2 NPCs em pé na caçamba, apoiados no santantônio (mais comum na zona rural)
const BEDR=new Map();
function bedRiderTick(){if(BEDR.size){for(const[rs,c] of BEDR)if(!vehicles.includes(c)||!c.bedRs||!c.bedRs.includes(rs)){riderFree(rs);BEDR.delete(rs)}}
 for(const c of vehicles){if(c.type!=='pickup')continue;
  if(c.bedN===undefined)c.bedN=Math.random()<(isRural(c.x,c.z)?.4:.08)?2:0;
  const show=c.bedN>0&&c.alive&&c!==PL.car&&(!!c.ai||c.mode==='rail')&&Math.hypot(c.x-PL.x,c.z-PL.z)<160;
  if(!show){if(c.bedRs){for(const r of c.bedRs){BEDR.delete(r);riderFree(r)}c.bedRs=null}continue}
  if(!c.bedRs){c.bedRs=[];for(let k=0;k<c.bedN;k++){const pal=pick2(PED_PALS),r=riderMake(pal);r.rot=0;r.rpal=pal;c.bedRs.push(r);BEDR.set(r,c)}}
  const ca=Math.cos(c.a),sa=Math.sin(c.a),y=c.gy+(c.hopY||0)+(c.airY||0)+(c.rampY||0)+.48;
  for(let k=0;k<c.bedRs.length;k++){const o=c.bedRs[k];const xl=-.84-k*.06,zl=(k?1:-1)*.42;o.x=c.x+xl*ca-zl*sa;o.z=c.z+xl*sa+zl*ca;o.gy=y;o.rot=-((c.roll||0)+(c.susp?c.susp.r:0))*.9;
   setFrame(o.tex,pickDir(ca,sa,o.x,o.z),0);placeSprite(o);o.sh.visible=false}}}
// Passageiros dos conversíveis: 1 ou 2 sprites sentados no interior (tráfego NPC).
const CONVR=new Map();
/* v3 r5: assinaturas prontas (antes era 'npc-'+n montado a cada quadro por carro) */
const CONV_SIGN=(()=>{const o={};for(const k of ['duo','solo','park','self','npc']){o[k]=[];for(let i=0;i<4;i++)o[k][i]=k+'-'+i}return o})();
function convRiderTick(){
 if(CONVR.size){for(const [rs,c] of CONVR){if(!vehicles.includes(c)||!c.convRs||!c.convRs.includes(rs)){riderFree(rs);CONVR.delete(rs)}}}
 for(const c of vehicles){if(c.type!=='conv'&&c.type!=='roadster')continue;
  if(c.convN===undefined)c.convN=1+(R2()<.5?1:0);
  const active=c===PL.car,duo=active&&DUO.on&&DUO.car===c;
  const other=CHAR.list[1-CHAR.cur],st=other.st;
  const parked=!active&&charFresh(other)&&st?.car?.ref===c;
  const selfSt=!active&&!parked&&SWITCH.on&&charFresh(CHAR.list[CHAR.cur])&&CHAR.list[CHAR.cur].st?.car?.ref===c,/* r38: só durante a troca de personagem; fora dela um st antigo punha um segundo Nathan sentado no conversível com o jogador do lado de fora */mine=!active&&!parked&&!selfSt&&(c.owned||c===PL.lastCar||c===(typeof PROLOGUE!=='undefined'&&PROLOGUE.car)||(SAFE.cars||[]).includes(c)); /* v79r16: carro do jogador nunca ganha motorista sorteado (antes o conversível da história mostrava um NPC qualquer no lugar do Nathan) */
  const n=active?(duo?2:1):parked||selfSt?1:mine?0:c.convN;
  const sign=active?(duo?CONV_SIGN.duo[DUO.drv]:CONV_SIGN.solo[CHAR.cur]):parked?CONV_SIGN.park[1-CHAR.cur]:selfSt?CONV_SIGN.self[CHAR.cur]:CONV_SIGN.npc[n];
  const show=n>0&&(active||parked||selfSt||c.hasRider!==false)&&c.alive&&(active||parked||selfSt||!!c.ai||c.mode==='rail')&&Math.hypot(c.x-PL.x,c.z-PL.z)<165;
  if(!show||c.convSign!==sign||c.convRs&&c.convRs.length!==n){
   if(c.convRs){for(const r of c.convRs){CONVR.delete(r);riderFree(r)}c.convRs=null}
   c.convSign=null;
  }
  if(!show)continue;
  if(!c.convRs){c.convRs=[];c.convSign=sign;for(let k=0;k<n;k++){
   let pal;if(active){const ix=duo?(k===0?DUO.drv:1-DUO.drv):CHAR.cur;
    pal=ix===CHAR.cur?PLAYER_PAL:(CHAR.list[ix].look||(ix?LUCIA_PAL:PLAYER_PAL));}
   else if(parked)pal=st.look||other.look||(CHAR.cur===0?LUCIA_PAL:PLAYER_PAL);
   else if(selfSt)pal=PLAYER_PAL;
   else pal=pick2(PED_PALS);
   const r=riderMake(convNoPack(pal));r.rpal=pal;r.rot=0;c.convRs.push(r);CONVR.set(r,c);
  }}
  const ca=Math.cos(c.a),sa=Math.sin(c.a),y=c.gy+(c.hopY||0)+(c.airY||0)+(c.rampY||0)+(c.type==='roadster'?.12:.2);
  for(let k=0;k<c.convRs.length;k++){const o=c.convRs[k];const xl=k?-.65:-.18,zl=k?.40:-.40;o.x=c.x+xl*ca-zl*sa;o.z=c.z+xl*sa+zl*ca;o.gy=y;o.rot=-((c.roll||0)+(c.susp?c.susp.r:0))*.9;
   setFrame(o.tex,pickDir(ca,sa,o.x,o.z),0);placeSprite(o);o.sp.scale.multiplyScalar(.78);o.sh.visible=false}
 }
}
// tiro na moto: o piloto cai (não morre), levanta e sai andando
function motoThrow(c,d){const p=spawnPed(null,{x:c.x+d.z*.9,z:c.z-d.x*.9,vx:(c.vx||0)*.5+d.x*2.5,vz:(c.vz||0)*.5+d.z*2.5,pal:c.rpal});p.state='down';p.timer=2.4;p.rot=Math.PI/2;p.hp=2;
 ouch(p.x,p.z,p.pitch);c.hasRider=false;c.ai=null;c.chase=false;c.thr=0;c.hand=true;c.sleep=false}
// v78: o jogador some ao entrar num veículo; nas embarcações abertas não havia ninguém pilotando. Sprite próprio com a
// roupa atual (PLAYER_PAL): lancha = em pé no comando, à DIREITA (estibordo, padrão americano), um pouco atrás do meio;
// jet ski = no centro. Recriado se o visual mudar; some ao desembarcar.
const PBOAT={o:null,pal:null};
function playerBoatTick(){const c=PL.car,show=!!(c&&c.t&&c.t.boat&&c.type!=='jetski'&&c.alive&&!PL.dead&&!PL.inside); /* v78: no jet ski o piloto já é o próprio sprite do jogador (como na moto) — eram 2 sobrepostos */
 if(!show||PBOAT.pal!==PLAYER_PAL){if(PBOAT.o){killChar(PBOAT.o);PBOAT.o=null;PBOAT.pal=null}if(!show)return}
 if(!PBOAT.o){PBOAT.o=makeCharacter({...PLAYER_PAL,pack:false});PBOAT.o.rot=0;PBOAT.pal=PLAYER_PAL}
 const o=PBOAT.o,ca=Math.cos(c.a),sa=Math.sin(c.a),jet=c.type==='jetski',back=jet?.25:c.t.L*.12,side=jet?0:c.t.W*.22;
 o.x=c.x-ca*back-sa*side;o.z=c.z-sa*back+ca*side;o.gy=(c.gy||0)+(jet?.15:.3);o.rot=-(c.roll||0)*.6;
 setFrame(o.tex,pickDir(ca,sa,o.x,o.z),0);placeSprite(o);o.sh.visible=false}
function myTick(dt){birdsTick(dt);environmentWindTick(dt);motoRiderTick();playerBoatTick();bedRiderTick();convRiderTick();if(typeof beachTick==='function')beachTick(dt);if(typeof skyTick==='function')skyTick(dt);if(typeof evtTick==='function')evtTick(dt);if(typeof tvTick==='function')tvTick(dt)}
function removeVehicle(c){if(TVM.on&&!EVT.ending&&EVT.cars.includes(c))return;for(const ch of city.chunks.values()){const i=(ch.cars||[]).indexOf(c);if(i>=0)ch.cars.splice(i,1)}if(PL.lastCar===c)PL.lastCar=null;if(c.rs){RIDERS.delete(c.rs);riderFree(c.rs);c.rs=null}
 if(c.bedRs){for(const r of c.bedRs){BEDR.delete(r);riderFree(r)}c.bedRs=null}
 if(c.convRs){for(const r of c.convRs){CONVR.delete(r);riderFree(r)}c.convRs=null}
 dropCarMesh(c);const i=vehicles.indexOf(c);if(i>=0)vehicles.splice(i,1)}
// Wrecks are transient actors, independent of the permanent city-region cache.
function updateVehicleWrecks(dt){const pc=PL.car||PL,wrecks=vehicles.filter(c=>!c.alive&&c.exploded&&!c.sunk&&c!==PL.car).sort((a,b)=>(a.wreckAt||0)-(b.wreckAt||0));let removed=false;
 for(let i=0;i<wrecks.length;i++){const c=wrecks[i];if(!Number.isFinite(c.wreckAt))c.wreckAt=simT;const age=simT-c.wreckAt,d=Math.hypot(c.x-pc.x,c.z-pc.z);if((c.burn||0)>0)continue;
  // Clear old wrecks promptly away from the player; fade retained nearby ones after a minute.
  const due=age>75||age>18&&d>105||age>25&&wrecks.length-i>(MOB_LITE?18:32);if(!due&&!c.wreckFade)continue;
  if(d>105||!c.g){removeVehicle(c);removed=true;continue}
  if(!c.wreckFade){attachCarWheelMeshes(c);c.wreckFade={t:0,mats:[]};const clones=new Map();c.g.traverse(o=>{if(!o.material)return;const clone=m=>{if(!clones.has(m)){const shared=[carBodyMat,carLightMat,wheelMat,hubMat,burntMat].includes(m)||!!m.userData.carBody,n=shared?m.clone():m;n.onBeforeCompile=m.onBeforeCompile;n.transparent=true;n.depthWrite=false;clones.set(m,n);c.wreckFade.mats.push(n)}return clones.get(m)};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material)})}
  c.wreckFade.t+=dt;const alpha=Math.max(0,1-c.wreckFade.t/1.2);for(const m of c.wreckFade.mats)m.opacity=alpha;if(!alpha){removeVehicle(c);removed=true}
 }if(removed)buildCarHash();return removed}
function clearVehicles(){while(vehicles.length)removeVehicle(vehicles[0])}

/* --- GPU instancing for every car without a detailed mesh --- */
const INST={types:{},ug:null,beam:null,turnL:null,turnR:null,group:null,CAP:2600,VR:230,XR:150};const INST_LOW={sph:new THREE.SphereGeometry(1,8,6).toNonIndexed(),lamp:new THREE.SphereGeometry(1,6,4).toNonIndexed(),tiny:new THREE.SphereGeometry(1,4,3).toNonIndexed(),cyl:new THREE.CylinderGeometry(1,1,1,6).toNonIndexed(),hemi:new THREE.SphereGeometry(1,10,4,0,Math.PI*2,0,Math.PI/2).toNonIndexed()},INST_PM=new THREE.Matrix4(),INST_FR=new THREE.Frustum(),INST_SP=new THREE.Sphere();
const EU2=new THREE.Euler(0,0,0,'YXZ');
/* v3 r50 · carro "caixote" dos carros bem distantes: caixa de baixo (cor do carro), cabine com laterais de vidro escuro e teto na cor, 4 rodas de 6 lados.
   Frente = +x (como o carParts). Proporções por família; null = usa a geometria normal. */
const INST_BOX={sedan:[.55,-.3,.2],taxi:[.55,-.3,.2],police:[.55,-.3,.2],wagon:[.55,-.42,.2],hatch:[.55,-.38,.18],crossover:[.55,-.34,.2],suv:[.55,-.4,.2],mini:[.55,-.4,.2],
 sports:[.58,-.26,.1],super:[.6,-.22,.1],roadster:[.62,-.2,.04],conv:[.62,-.2,.04],pickup:[.55,-.05,.3],van:[.5,-.47,.36],bus:[.42,-.48,.46],truck:'truck'};
function instBoxGeo(k){const f=INST_BOX[k],t=VT[k];if(!f)return null;const m=new MB(),L=t.L/2,W=t.W/2,H=t.H,y0=t.wr*.95,wh=COL('#ffffff'),gl=COL('#1c2530');m.carGlassColor=gl;
 if(f==='truck'){const cx=L-1.9;m.box(cx,y0,-W,L,H*.42,W,wh);m.box(cx+.2,H*.42,-W+.06,L-.15,H*.8,W-.06,gl,{topCol:wh});m.box(-L,y0,-W,cx-.1,H,W,wh)}
 else{const [lo,c0,c1]=f;m.box(-L,y0,-W,L,H*lo,W,wh);
  if(k==='roadster'||k==='conv')m.box(-L*.1,H*lo,-W+.12,L*c1+.15,H*.88,W-.12,gl);
  else m.box(L*c0*2,H*lo,-W+.08,L*c1*2,H,W-.08,gl,{topCol:wh})}
 const g6=new THREE.CylinderGeometry(1,1,1,6).toNonIndexed();g6.rotateX(Math.PI/2);
 for(let w=0;w<4;w++){const x=w<2?t.wb:-t.wb,z=(w%2?1:-1)*(t.vtw!==undefined?t.vtw:t.tw);m.geo(g6,mtx(x,t.wr,z,t.wr,t.wr,.3),COL('#141414'))}
 g6.dispose();return m.mesh(null).geometry}
function buildInstancing(st){
 if(INST.group){scene.remove(INST.group);INST.group.traverse(o=>{if(o.geometry&&!o.isSprite)o.geometry.dispose();if(o.material&&o.material!==carBodyMat&&o.material!==carLightMat)o.material.dispose()})}
 const grp=new THREE.Group();scene.add(grp);INST.group=grp;INST.types={};const CAP=INST.CAP;
 // v77: carros instanciados (os sem malha detalhada, ou seja, os mais distantes) usam esferas/cilindros de baixa resolução
 /* r43: carParts usa CARG (não GEO): troca CARG pelas versões do LOD e devolve no finally */
 const G0=Object.assign({},CARG);CARG.sph=CARG.mid=INST_LOW.sph;CARG.lamp=CARG.mirror=INST_LOW.lamp;CARG.tiny=INST_LOW.tiny;CARG.cyl=CARG.rod=INST_LOW.cyl;
 try{
 for(const k in VT){const t=VT[k],body=new MB(),li=new MB();carParts(k,'#ffffff',st,body,li,'#ffffff');
  for(let w=0;w<(t.boat?0:4);w++){const x=w<2?t.wb:-t.wb,z=(w%2?1:-1)*(t.vtw!==undefined?t.vtw:t.tw);body.geo(k==='moto'?WHEEL_FULL:WHEEL_NI,mtx(x,t.wr,z,t.wr,t.wr,1),COL('#141414'))}
  const bim=new THREE.InstancedMesh(body.mesh(null).geometry,carBodyMat,CAP);bim.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3);
  bim.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bim.castShadow=true;bim.receiveShadow=true;bim.frustumCulled=false;bim.count=0;
  const lim=new THREE.InstancedMesh(li.mesh(null).geometry,carLightMat,CAP);lim.frustumCulled=false;lim.count=0;
  lim.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bim.instanceColor.setUsage(THREE.DynamicDrawUsage);
  // v77: carros distantes (além do alcance da sombra) num 2º lote SEM castShadow — mesma geometria e material
  const fim=new THREE.InstancedMesh(bim.geometry,carBodyMat,CAP);fim.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3);fim.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fim.instanceColor.setUsage(THREE.DynamicDrawUsage);fim.castShadow=false;fim.receiveShadow=true;fim.frustumCulled=false;fim.count=0;
  /* v3 r50: 3º lote = carro "caixote" (~100–150 tri) para os que estão além de INST.XR (2 quarteirões). Sem sombra. Moto/barcos/vortex reaproveitam a geometria do lote normal. */
  const xg=instBoxGeo(k)||bim.geometry,xim=new THREE.InstancedMesh(xg,carBodyMat,CAP);xim.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3);xim.instanceMatrix.setUsage(THREE.DynamicDrawUsage);xim.instanceColor.setUsage(THREE.DynamicDrawUsage);xim.castShadow=false;xim.receiveShadow=true;xim.frustumCulled=false;xim.count=0;
  grp.add(bim,lim,fim,xim);INST.types[k]={bim,lim,fim,xim,n:0,ln:0,fn:0,xn:0}}
 }finally{Object.assign(CARG,G0)}
 INST.ug=INST.beam=INST.turnL=INST.turnR=null;
 const ledGeo=new THREE.BoxGeometry(.055,.075,.115),ledMat=new THREE.MeshBasicMaterial({color:0xffb900, toneMapped:false});
 INST.turnL=new THREE.InstancedMesh(ledGeo,ledMat,CAP);INST.turnR=new THREE.InstancedMesh(ledGeo,ledMat,CAP);
 for(const m of [INST.turnL,INST.turnR]){m.count=0;m.frustumCulled=false;grp.add(m)}
 const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);
 INST.beam=new THREE.InstancedMesh(pg,new THREE.MeshBasicMaterial({map:glowTex,color:0xfff0c0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:st.night&&!st.noLamps?.2:0}),CAP*2);
 if(st.synth){INST.ug=new THREE.InstancedMesh(pg.clone(),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.6}),CAP*2);
  INST.ug.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(CAP*6),3)}
 for(const m of [INST.ug,INST.beam])if(m){m.frustumCulled=false;m.renderOrder=3;m.count=0;grp.add(m)}}
/* v3 r5: tabela fixa + resultado num rascunho (era objeto novo por seta por carro por quadro) */
const TSIG_SPEC={police:[.66,.42],sedan:[.66,.42],taxi:[.66,.42],sports:[.6,.4],super:[.6,.4],conv:[.64,.42],hatch:[.72,.38],suv:[.9,.42],van:[.9,.4],pickup:[.86,.42],bus:[.75,.35],truck:[1,.4]},TSIG_DEF=[.7,.42],TSIG_OUT={x:0,y:0,z:0};
function turnSignalMount(type,side,front,out){
 const t=VT[type],o=out||{x:0,y:0,z:0};
 if(type==='moto'){if(front){o.x=.9;o.y=.98;o.z=side*.12}else{o.x=-1.015;o.y=.78;o.z=side*.085}return o}
 if(front){if(t.sigF){o.x=t.sigF.x;o.y=t.sigF.y;o.z=side*t.sigF.z}else{o.x=t.L/2+.01;o.y=.62;o.z=side*(t.W/2-.36)}return o}
 const spec=TSIG_SPEC[type]||TSIG_DEF;
 o.x=-t.L/2-.025;o.y=spec[0];o.z=side*(t.W/2-spec[1]+.06);return o;
}
const turnSignalMatrix=new THREE.Matrix4(),turnSignalBody=new THREE.Matrix4();
function turnSignalTransform(c,side,out,front){
 const p=turnSignalMount(c.type,side,front,TSIG_OUT);
 if(c.ch){c.ch.updateWorldMatrix(true,false);out.makeTranslation(p.x,p.y,p.z);out.premultiply(c.ch.matrixWorld)}
 else{EU2.set(c.roll||0,-c.a,c.pitch||0);Q.setFromEuler(EU2);turnSignalBody.compose(V3.set(c.x,c.gy,c.z),Q,SC.set(1,1,1));out.makeTranslation(p.x,p.y,p.z);out.premultiply(turnSignalBody)}
 return out;
}
function uploadInstances(mesh,n){
 const attr=mesh.instanceMatrix;mesh.count=n;
 if(n>0){attr.updateRange.offset=0;attr.updateRange.count=n*16;attr.needsUpdate=true}
 if(mesh.instanceColor&&n>0){mesh.instanceColor.updateRange.offset=0;mesh.instanceColor.updateRange.count=n*3;mesh.instanceColor.needsUpdate=true}
}
function writeInstances(){
 for(const k in INST.types){const T=INST.types[k];T.n=0;T.ln=0;T.fn=0;T.xn=0}let gn=0,bn=0;
 const cx=camera.position.x,cz=camera.position.z,vr=camMode==='top'?camH*1.35+30:INST.VR,vr2=vr*vr,xr2=camMode==='top'?1e12:INST.XR*INST.XR;/* v3 r50: era 360 m; agora 3 quarteirões (INST.VR) e caixote além de INST.XR */
 // v77: recorte por frustum (antes TODOS os carros num raio de 360 m iam para a GPU, inclusive atrás da câmera),
 // faróis só nos carros com farol aceso (antes os apagados ainda mandavam ~1600 triângulos zerados cada)
 // e sombra só para os carros dentro do alcance da sombra.
 camera.updateMatrixWorld();INST_PM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);INST_FR.setFromProjectionMatrix(INST_PM);
 const sr=S.shadows?Math.min(140,Math.max(45,shadowDistanceMeters()*.8)):0,sr2=sr*sr;
 for(const c of vehicles){if(c.g)continue;const dx=c.x-cx,dz=c.z-cz,d2=dx*dx+dz*dz;if(d2>vr2)continue;const T=INST.types[c.type];if(T.n>=INST.CAP)continue;
  if(d2>900){INST_SP.center.set(c.x,c.gy+1,c.z);INST_SP.radius=(c.t.L||4)*.6+2.5;if(!INST_FR.intersectsSphere(INST_SP))continue}
  EU2.set(c.roll||0,-c.a,c.pitch||0);Q.setFromEuler(EU2);M4.compose(V3.set(c.x,c.gy,c.z),Q,SC.set(1,1,1));
  const lampsOn=carLampOn(c);T.n++;if(d2>xr2){T.xim.setMatrixAt(T.xn,M4);T.xim.instanceColor.setXYZ(T.xn,c.icol.r,c.icol.g,c.icol.b);T.xn++}else if(d2<sr2){T.bim.setMatrixAt(T.n-1-T.fn-T.xn,M4);T.bim.instanceColor.setXYZ(T.n-1-T.fn-T.xn,c.icol.r,c.icol.g,c.icol.b)}else{T.fim.setMatrixAt(T.fn,M4);T.fim.instanceColor.setXYZ(T.fn,c.icol.r,c.icol.g,c.icol.b);T.fn++}
  if(lampsOn)T.lim.setMatrixAt(T.ln++,M4);
  if(INST.beam&&bn<INST.CAP*2&&INST.beam.material.opacity>.01){const ca=Math.cos(c.a),sa=Math.sin(c.a);EU2.set(0,-c.a,0);Q.setFromEuler(EU2);
   if(c.hasGlow&&INST.ug){M4.compose(V3.set(c.x,.06,c.z),Q,SC.set(c.t.L+2.4,1,c.t.W+2.4));INST.ug.setMatrixAt(gn,M4);INST.ug.instanceColor.setXYZ(gn,c.glow.r,c.glow.g,c.glow.b);gn++}
   if(lampsOn){M4.compose(V3.set(c.x+ca*(c.t.L/2+4.6),.07,c.z+sa*(c.t.L/2+4.6)),Q,SC.set(10,1,5));INST.beam.setMatrixAt(bn,M4);bn++}}}
 // Setas amarelas atras: piscam durante o ultimo segundo antes da curva e ate a conclusao.
 let tcL=0,tcR=0;
 if(Math.floor(simT*2.5)%2===0)for(const c of vehicles){
  if(c===PL.car||!c.alive||c.t.boat||!c.turnSig)continue;
  const dx=c.x-cx,dz=c.z-cz;if(dx*dx+dz*dz>vr2)continue;
  for(let fi=0;fi<2;fi++){const fr=fi===1;turnSignalTransform(c,c.turnSig,M4,fr);
  if(c.turnSig<0&&tcL<INST.CAP)INST.turnL.setMatrixAt(tcL++,M4);
  else if(c.turnSig>0&&tcR<INST.CAP)INST.turnR.setMatrixAt(tcR++,M4)}
 }
 uploadInstances(INST.turnL,tcL);uploadInstances(INST.turnR,tcR);
 for(const k in INST.types){const T=INST.types[k];uploadInstances(T.bim,T.n-T.fn-T.xn);uploadInstances(T.fim,T.fn);uploadInstances(T.xim,T.xn);uploadInstances(T.lim,T.ln)}
 if(INST.ug)uploadInstances(INST.ug,gn);
 if(INST.beam)uploadInstances(INST.beam,bn)}

/* --- spatial hash of cars --- */
const CH=16;let carHash=new Map();
function buildCarHash(){/* v3 r5: baldes reaproveitados (zera o tamanho em vez de recriar) */for(const a of carHash.values())a.length=0;for(const c of vehicles){const k=Math.floor(c.x/CH)*100003+Math.floor(c.z/CH);let a=carHash.get(k);if(!a){a=[];carHash.set(k,a)}a.push(c)}if(carHash.size>600)for(const[k,a] of carHash)if(!a.length)carHash.delete(k)}
/* v3 r5: carsNearTmp = carsNear sem alocar: devolve um de 32 arrays em rodízio. Usar só no laço logo em seguida; nunca guardar o resultado. */
const CARSNEAR_RING=Array.from({length:32},()=>[]);let CARSNEAR_I=0;
function carsNearTmp(x,z,r){const out=CARSNEAR_RING[CARSNEAR_I=(CARSNEAR_I+1)&31];out.length=0;for(let gx=Math.floor((x-r)/CH);gx<=Math.floor((x+r)/CH);gx++)for(let gz=Math.floor((z-r)/CH);gz<=Math.floor((z+r)/CH);gz++){const a=carHash.get(gx*100003+gz);if(a)for(let i=0;i<a.length;i++)out.push(a[i])}return out}
function carsNear(x,z,r){const out=[];for(let gx=Math.floor((x-r)/CH);gx<=Math.floor((x+r)/CH);gx++)for(let gz=Math.floor((z-r)/CH);gz<=Math.floor((z+r)/CH);gz++){const a=carHash.get(gx*100003+gz);if(a)for(const c of a)out.push(c)}return out}

/* --- physics (Pat Kerr style: rigid body + 4 velocity-proportional tyres) --- */
function carStep(c,h){
 if(c.airY>0){c.x+=c.vx*h;c.z+=c.vz*h;c.a+=c.w*h;c.w*=1-.4*h;c.ax=c.az=0;c.fwd=c.vx*Math.cos(c.a)+c.vz*Math.sin(c.a);return}
 const t=c.t,ca=Math.cos(c.a),sa=Math.sin(c.a);
 const mud=carMud(c),drive=1-mud*.92;c.mud=mud;
 const vfB=c.vx*ca+c.vz*sa;c.fwd=vfB;
 c.steer+=(c.steerT-c.steer)*Math.min(1,h*7);
 let delta=c.steer*t.steer/(1+Math.abs(vfB)/24);
 /* r40: especial da Claire ao volante (câmera lenta) — esterço 2× e um empurrão de giro na direção da curva */
 if(c===PL.car&&SPEC.on&&CHAR.cur===1&&!t.boat){delta*=2;c.w+=c.steer*Math.min(1,Math.abs(vfB)/8)*Math.sign(vfB||1)*2.4*h}
 c.delta=delta;
 const Nw=c.m*9.81/4;let Fx=0,Fz=0,T=0;
 for(let k=0;k<4;k++){
  const front=k<2,lx=front?t.wb:-t.wb,lz=(k%2?1:-1)*t.tw;
  const rx=lx*ca-lz*sa,rz=lx*sa+lz*ca;
  const pvx=c.vx-c.w*rz,pvz=c.vz+c.w*rx;
  const wa=c.a+(front?delta:0),wx=Math.cos(wa),wz=Math.sin(wa),nx=-wz,nz=wx;
  const vf=pvx*wx+pvz*wz,vl=pvx*nx+pvz*nz;
  const hb=c.hand&&!front;
  let ks=t.ks,mu=t.mu;const wet=c===PL.car?Math.max(WX.f,(c.dirt||0)*.6):0;if(wet>.05){mu*=1-.2*wet;ks*=1-.18*wet}if(c.mudG>.01){mu*=1-.45*c.mudG;ks*=1-.4*c.mudG}if(hb){ks*=.22;mu*=.48}
  let fl=-ks*vl;const cap=mu*Nw;let slip=0;
  if(Math.abs(fl)>cap){fl=Math.sign(fl)*cap;slip=Math.abs(vl)}
  let ff=-t.kr*(c.turbo?.5:1)*vf;
  if(c.thr>0&&!front&&c.alive){ff+=c.thr*t.eng*drive/2*(c.nitro?1.75:1);if(!hb)ff=Math.min(ff,cap*1.25)}
  if(c.thr<0){ if(vfB>.8)ff+=-clamp(vf*c.m*3,-Nw*.95,Nw*.95)*(-c.thr); else if(!front&&c.alive)ff+=c.thr*t.eng*drive*.45/2*revK(-vfB); }
  if(hb)ff+=-clamp(vf*c.m*3,-Nw*.85,Nw*.85);
  const tot=Math.hypot(ff,fl),cap2=cap*1.3;if(tot>cap2){const s=cap2/tot;ff*=s;fl*=s;slip=Math.max(slip,!front&&c.thr>.5&&Math.abs(vfB)<14?6:Math.abs(vl)+1)}
  if(c.ws[k]<slip)c.ws[k]=slip;
  const fx=ff*wx+fl*nx,fz=ff*wz+fl*nz;Fx+=fx;Fz+=fz;T+=rx*fz-rz*fx;
  c.wp[k][0]=c.x+rx;c.wp[k][1]=c.z+rz;
 }
 const sp=Math.hypot(c.vx,c.vz),cdk=t.cd*(c.turbo?.25:1);Fx-=(cdk*sp+c.m*mud*.75)*c.vx;Fz-=(cdk*sp+c.m*mud*.75)*c.vz;
 c.ax=Fx/c.m;c.az=Fz/c.m;
 c.vx+=c.ax*h;c.vz+=c.az*h;c.w+=T/c.I*h;c.w*=1-.6*h;if(c.donut){c.w+=(c.donut-c.w)*Math.min(1,h*5);c.vx*=1-1.1*h;c.vz*=1-1.1*h}
 c.x+=c.vx*h;c.z+=c.vz*h;c.a+=c.w*h;
}
function pointVel(c,px,pz){const rx=px-c.x,rz=pz-c.z;return[c.vx-c.w*rz,c.vz+c.w*rx]}
function resolveStatic(c,px,pz,nx,nz,depth){
 c.x+=nx*depth;c.z+=nz*depth;const rx=px-c.x,rz=pz-c.z;const pvx=c.vx-c.w*rz,pvz=c.vz+c.w*rx;const vn=pvx*nx+pvz*nz;
 if(vn<0){const rn=rx*nz-rz*nx;const j=-(1.25)*vn/(1/c.m+rn*rn/c.I);c.vx+=j*nx/c.m;c.vz+=j*nz/c.m;c.w+=rn*j/c.I;
  const tx=-nz,tz=nx,vt=pvx*tx+pvz*tz;const jt=clamp(-vt*c.m*.15,-j*.4,j*.4);c.vx+=jt*tx/c.m;c.vz+=jt*tz/c.m;
  impact(c,-vn,px,pz)}}
const CP=[[.5,.5],[.5,-.5],[-.5,.5],[-.5,-.5],[.5,0],[-.5,0],[0,.5],[0,-.5],[.25,.5],[.25,-.5],[-.25,.5],[-.25,-.5]];
function carVsWorld(c){
 const t=c.t,ca=Math.cos(c.a),sa=Math.sin(c.a),hl=t.L/2,hw=t.W/2;
 const near=query(c.x,c.z,t.R+1);
 for(let q=0;q<near.length;q++){const b=near[q];
  if(b.dead||c.x+t.R<b.x0||c.x-t.R>b.x1||c.z+t.R<b.z0||c.z-t.R>b.z1)continue;
  if(b.drawbridgeGate&&c===PL.car)continue;
  if(c.airY>.8&&(b.kind==='pole'||b.kind==='tree'||(b.kind==='bin'&&c.airY>(b.bin?.height??.8))||b.kind==='tlight'||(b.low&&c.airY>b.low-.25)))continue;
  if(b.kind==='tlight'&&b.tl){const px=(b.x0+b.x1)/2-c.x,pz=(b.z0+b.z1)/2-c.z,lx=px*ca+pz*sa,lz=-px*sa+pz*ca;if(Math.abs(lx)<hl+.35&&Math.abs(lz)<hw+.35&&Math.hypot(c.vx,c.vz)>3.6){breakTL(b,c);if(c.alive){c.hp-=Math.min(Math.hypot(c.vx,c.vz),35)*.65*CRASH_DMG;if(c.hp<=0)setOnFire(c)}if(c===PL.car)shake=Math.max(shake,.25);continue}}
  if(b.kind==='bin'&&(!b.bin?.big||Math.hypot(c.vx,c.vz)>=4)){
   const dx=(b.x0+b.x1)/2-c.x,dz=(b.z0+b.z1)/2-c.z;
   const bx=(b.x1-b.x0)/2,bz=(b.z1-b.z0)/2,ac=Math.abs(ca),as=Math.abs(sa);
   // Separating axes of the car and the bin: contact works at the ends of wide dumpsters.
   if(Math.abs(dx)<bx+hl*ac+hw*as&&Math.abs(dz)<bz+hl*as+hw*ac&&
      Math.abs(dx*ca+dz*sa)<hl+bx*ac+bz*as&&Math.abs(-dx*sa+dz*ca)<hw+bx*as+bz*ac){
    knockBin(b,c.vx,c.vz);continue;
   }
  }
  if(b.kind==='pole'||b.kind==='tree'){const px=(b.x0+b.x1)/2-c.x,pz=(b.z0+b.z1)/2-c.z;const lx=px*ca+pz*sa,lz=-px*sa+pz*ca;const sp=Math.hypot(c.vx,c.vz),isT=b.kind==='tree';
   if(Math.abs(lx)<hl+.35&&Math.abs(lz)<hw+.35&&sp>(isT?4.5:3.6)){if(isT)breakTree(b,c);else breakPole(b,c);carDent(c,sp*.8,(b.x0+b.x1)/2,(b.z0+b.z1)/2);
    if(c.alive){c.hp-=Math.min(sp,35)*(isT?.85:.65)*CRASH_DMG;if(c.hp<=0)setOnFire(c)}if(c===PL.car)shake=Math.max(shake,.25);continue}}
  for(const p of CP){const lx=p[0]*t.L,lz=p[1]*t.W;const wx=c.x+lx*ca-lz*sa,wz=c.z+lx*sa+lz*ca;
   if(wx>b.x0&&wx<b.x1&&wz>b.z0&&wz<b.z1){const d0=wx-b.x0,d1=b.x1-wx,d2=wz-b.z0,d3=b.z1-wz;const m=Math.min(d0,d1,d2,d3);
    if(m===d0)resolveStatic(c,wx,wz,-1,0,d0);else if(m===d1)resolveStatic(c,wx,wz,1,0,d1);else if(m===d2)resolveStatic(c,wx,wz,0,-1,d2);else resolveStatic(c,wx,wz,0,1,d3)}}
  const ca2=Math.cos(c.a),sa2=Math.sin(c.a);
  for(let qi=0;qi<4;qi++){const bx=qi&1?b.x1:b.x0,bz=qi&2?b.z1:b.z0;const dx=bx-c.x,dz=bz-c.z; /* v3 r5: cantos sem arrays (eram 5 por colisor por carro por subpasso) */const lx=dx*ca2+dz*sa2,lz=-dx*sa2+dz*ca2;
   if(Math.abs(lx)<hl&&Math.abs(lz)<hw){const ex=hl-Math.abs(lx),ez=hw-Math.abs(lz);let nlx=0,nlz=0,dep;
    if(ex<ez){nlx=-Math.sign(lx);dep=ex}else{nlz=-Math.sign(lz);dep=ez}
    resolveStatic(c,bx,bz,nlx*ca2-nlz*sa2,nlx*sa2+nlz*ca2,dep)}}
 }
}
function carVsCar(A,B){const dx=A.x-B.x,dz=A.z-B.z,rs=A.t.R+B.t.R;if(dx*dx+dz*dz>rs*rs)return;if(!!A.t.boat!==!!B.t.boat)return;if((A.airY||0)>B.t.H-.3||(B.airY||0)>A.t.H-.3)return;
 const caA=Math.cos(A.a),saA=Math.sin(A.a),caB=Math.cos(B.a),saB=Math.sin(B.a);let best=0,bnx=0,bnz=0,bpx=0,bpz=0;
 const rA=A.t.W/2,rB=B.t.W/2;
 for(const oa of A.t.circ){const ax=A.x+oa*caA,az=A.z+oa*saA;for(const ob of B.t.circ){const bx=B.x+ob*caB,bz=B.z+ob*saB;
  const ex=ax-bx,ez=az-bz,d=Math.hypot(ex,ez),pen=rA+rB-d;if(pen>best&&d>1e-4){best=pen;bnx=ex/d;bnz=ez/d;bpx=bx+bnx*rB;bpz=bz+bnz*rB}}}
 if(best<=0)return;
 if(best>1.0&&A.alive&&B.alive){A.ovF=B.ovF=true;A.ovW=B;B.ovW=A}
 if(A.sleep)A.sleep=false;if(B.sleep)B.sleep=false;A.sleepT=B.sleepT=0;
 const iA=1/A.m,iB=1/B.m,s=best/(iA+iB);A.x+=bnx*s*iA;A.z+=bnz*s*iA;B.x-=bnx*s*iB;B.z-=bnz*s*iB;
 const[avx,avz]=pointVel(A,bpx,bpz),[bvx,bvz]=pointVel(B,bpx,bpz);const vn=(avx-bvx)*bnx+(avz-bvz)*bnz;
 if(vn<0){const rAx=bpx-A.x,rAz=bpz-A.z,rBx=bpx-B.x,rBz=bpz-B.z;const rnA=rAx*bnz-rAz*bnx,rnB=rBx*bnz-rBz*bnx;
  const j=-1.3*vn/(iA+iB+rnA*rnA/A.I+rnB*rnB/B.I);
  A.vx+=j*bnx*iA;A.vz+=j*bnz*iA;A.w+=rnA*j/A.I;B.vx-=j*bnx*iB;B.vz-=j*bnz*iB;B.w-=rnB*j/B.I;
  impact(A,-vn,bpx,bpz);impact(B,-vn,bpx,bpz);
  if(-vn>4){for(const C of [A,B])if(C.ai){C.ai.stun=1.5+Math.random()}}
  if(-vn>3&&PL.car&&(A===PL.car||B===PL.car))policeWitness(A===PL.car?B:A)}}
function impact(c,v,px,pz){if(v<3)return;if(ONLINE.on)netCrash(c,v); /* v3 r38: batidas do ranking (Lataria de Papel) */if(c===PL.car)rumble(clamp((v-3)/16,0,1),clamp((v-1)/11,.15,1),Math.min(420,110+v*14));
 if(c===PL.car&&c.type==='moto'&&v>8.5&&!PL.dead){const vx=c.vx,vz=c.vz,sp0=Math.max(v,Math.abs(c.fwd||0));enterExit();PL.down=1.6;PL.rot=Math.PI/2;PL.vx=vx*.55;PL.vz=vz*.55;PL.hp-=armorHit(Math.round(v*1.6));thud(v);if(PL.hp<=0)killPlayer();
   try{plMotoThrow(Math.cos(c.a)*sp0*.75,Math.sin(c.a)*sp0*.75,sp0)}catch(e){}} /* v4 r46: no 3D o jogador sai voando em ragdoll (js/49) */
 if(v>6&&c.alive){c.hp-=(v-6)*3.2*(c===PL.car?.8:1)*CRASH_DMG;if(c.hp<=0)setOnFire(c)}
 carDent(c,v,px,pz);
 const n=Math.min(10,v|0);for(let i=0;i<n;i++)emit(px,.6,pz,(Math.random()-.5)*6,Math.random()*4+1,(Math.random()-.5)*6,.35,.25,.08,0xffb030,true,1);
 if(c===PL.car||Math.hypot(c.x-PL.x,c.z-PL.z)<40)crashSound(v)}
const SUSP_OFF=[-.9,-.6,-.3,0,.3,.6,.9];/* v3 r5: amostras fixas da suspensão (era array literal por roda por quadro) */
/* v3 r27 · balanço na água: ondulação de 3 senos (o maior vem do mar para a praia, AQ.inl) — barcos próximos sobem e descem juntos;
   rio = 35%. Devolve altura (h) e inclinação (gx,gz) no objeto BOB (sem lixo por quadro). calm = menos balanço em alta velocidade. */
const BOB={h:0,gx:0,gz:0},BOB_W=[[0,1,.16,.42,1.05],[0,0,.27,.24,1.6],[0,0,.41,.12,2.2]];
function waterBob(x,z,t){const A=(riverZone(x,z)?.35:1)*.32,ix=(AQ.inl&&AQ.inl[0])||0,iz=AQ.inl?AQ.inl[1]:1;
 BOB_W[0][0]=ix;BOB_W[0][1]=iz;BOB_W[1][0]=ix*.8-iz*.6;BOB_W[1][1]=iz*.8+ix*.6;BOB_W[2][0]=-iz;BOB_W[2][1]=ix;let h=0,gx=0,gz=0;
 for(const w of BOB_W){const ph=(x*w[0]+z*w[1])*w[2]-t*w[4],a=w[3]*A;h+=Math.sin(ph)*a;const d=Math.cos(ph)*a*w[2];gx+=d*w[0];gz+=d*w[1]}BOB.h=h;BOB.gx=gx;BOB.gz=gz;return BOB}
function bobTilt(c,k){const ca=Math.cos(c.a),sa=Math.sin(c.a);return[(BOB.gx*ca+BOB.gz*sa)*k,-(BOB.gz*ca-BOB.gx*sa)*k]} /* [pitch, roll] */
function syncCar(c,dt){
 if(c.dmgDirty&&c.dentParts&&c.ch)carDmgApply(c);
 if(c.t.boat){const lv=waterLevel(c.x,c.z),sd=c.type==='jetski'&&!boatOK(c.x,c.z)?groundY(c.x,c.z)+.04:-1e9;const wb=waterBob(c.x,c.z,simT),calm=1-.6*clamp(Math.abs(c.fwd)/22,0,1),bt=bobTilt(c,calm*(c.type==='jetski'?1.3:1));c.gy=sd>lv?sd:lv+wb.h*calm+Math.sin(simT*2.1+c.id)*.02; /* v79r2: jet ski encalhando sobe na areia (na Haze afundava na praia antes de parar) */ /* v3 r27: sobe/desce e inclina com a ondulação (waterBob) */c.roll=(sd>lv?0:bt[1])+Math.sin(simT*1.7+c.id*2)*.015+clamp(-c.w*c.fwd*.01,-.15,.15);c.pitch=clamp(c.fwd/40,0,.12)+(sd>lv?0:bt[0])+Math.sin(simT*1.3+c.id)*.01;if(Math.abs(c.fwd)>3&&Math.random()<dt*30){const ca=Math.cos(c.a),sa=Math.sin(c.a);emit(c.x-ca*(c.t.L/2+.4)+(Math.random()-.5)*1.5*-sa,lv+.2,c.z-sa*(c.t.L/2+.4)+(Math.random()-.5)*1.5*ca,-ca*2+(Math.random()-.5)*2,.6+Math.random(),-sa*2+(Math.random()-.5)*2,1,.6,2,0xf4f8ff,false,.7)}}
 else if(c.t.hover){const wet=inWater(c.x,c.z);let base=wet?waterLevel(c.x,c.z):groundY(c.x,c.z);{const tg=[0,0];if(wet){const calm=1-.6*clamp(Math.abs(c.fwd)/22,0,1);base+=waterBob(c.x,c.z,simT).h*calm*.8;const bt=bobTilt(c,calm*.8);tg[0]=bt[0];tg[1]=bt[1]}const kq=Math.min(1,dt*4);c.wobP=(c.wobP||0)+(tg[0]-(c.wobP||0))*kq;c.wobR=(c.wobR||0)+(tg[1]-(c.wobR||0))*kq} /* v3 r27: hovercraft balança na água */c.gy+=(base+.18+Math.sin(simT*3+c.id)*.04-c.gy)*Math.min(1,dt*8);if(Math.abs(c.fwd)>3&&Math.random()<dt*24){const ca=Math.cos(c.a),sa=Math.sin(c.a);emit(c.x-ca*(c.t.L/2+.3)+(Math.random()-.5)*2*-sa,base+.2,c.z-sa*(c.t.L/2+.3)+(Math.random()-.5)*2*ca,-ca*3+(Math.random()-.5)*2,.5+Math.random(),-sa*3+(Math.random()-.5)*2,1,.6,2,wet?0xf4f8ff:0xd8c8a0,false,.6)}}
 else if(c.g&&c.wheels&&c.wheels.length===4&&!c.sunk&&!(c.airY>0)&&!(c.rampY>0)&&dt>0){
  // v104: suspensão por roda: cada roda lê o chão (calçada = +20 cm); a carroceria segue com mola amortecida (heave, pitch e roll)
  const t=c.t,ca0=Math.cos(c.a),sa0=Math.sin(c.a),tw=t.vtw!==undefined?t.vtw:t.tw,H=c.wh||(c.wh=[0,0,0,0]);let sum=0;
  // a roda "rola" sobre a quina: amostra o chão em volta do contato e usa o perfil do pneu (círculo), depois filtra
  const r=t.wr,HS=c.whs||(c.whs=[null,null,null,null]),fx=ca0,fz=sa0;
  for(let k=0;k<4;k++){const xl=k<2?t.wb:-t.wb,zl=(k%2?1:-1)*tw,wx=c.x+xl*ca0-zl*sa0,wz=c.z+xl*sa0+zl*ca0;let h=-9;
   for(const d of SUSP_OFF){const dx=d*r,lift=r-Math.sqrt(r*r-dx*dx);h=Math.max(h,groundY(wx+fx*dx,wz+fz*dx)-lift)}
   HS[k]=HS[k]===null||Math.abs(h-HS[k])>.6?h:HS[k]+(h-HS[k])*Math.min(1,dt*16);H[k]=HS[k];sum+=H[k]}
  const mean=sum/4;if(!c.susp||Math.abs(mean-c.gy)>.6){c.gy=mean;c.susp={v:0,p:0,pv:0,r:0,rv:0}}
  const Sp=c.susp,K=120,D=10.5,st=Math.min(dt,.04);
  // Motos têm distância lateral das rodas zero: não existe suspensão diferencial entre lados.
  // Se essa divisão foi feita por zero, a rotação da carroceria vira NaN e apenas as rodas aparecem.
  if(Math.abs(tw)<=.001){Sp.r=0;Sp.rv=0}
  const pt=Math.atan(((H[0]+H[1])-(H[2]+H[3]))/2/(2*t.wb)),rt=Math.abs(tw)>.001?Math.atan(((H[0]+H[2])-(H[1]+H[3]))/2/(2*tw)):0;
  Sp.v+=(K*(mean-c.gy)-D*Sp.v)*st;c.gy+=Sp.v*st;Sp.pv+=(K*(pt-Sp.p)-D*Sp.pv)*st;Sp.p+=Sp.pv*st;Sp.rv+=(K*(rt-Sp.r)-D*Sp.rv)*st;Sp.r+=Sp.rv*st;
  // fim de curso: se alguma roda passaria do topo do arco, a carroceria é empurrada pra cima (como bater no batente) em vez da roda entrar na lataria
  {const A=t.arch;if(A){let ex=0;for(let k=0;k<4;k++){const xl=k<2?t.wb:-t.wb,zl=(k%2?1:-1)*tw,cyk=xl*Math.sin((c.pitch||0)+Sp.p)-zl*Math.sin((c.roll||0)+Sp.r),cap=k<2?A.capF:A.capR,up=Math.min(A.r0-t.wr,(cap>5?9:cap)-2*t.wr)-.012;ex=Math.max(ex,H[k]-c.gy-cyk-up)}if(ex>0){c.gy+=ex;if(Sp.v<0)Sp.v=0}}}}
 else if(c.air?.bridge){c.gy=0;c.susp=null;c.wh=null;c.whs=null}
 else if(dt===0&&c.susp){}
 else{c.susp=null;c.wh=null;c.whs=null;if(c.sunk&&c.sunkY==null)c.sunkY=waterAt(c.x,c.z)?Math.min(-3.4,riverBedY(c.x,c.z)+.6):-3.4; /* v3 r32: no rio afunda até o fundo novo */
  c.gy+=((c.sunk?c.sunkY:groundY(c.x,c.z))-c.gy)*Math.min(1,dt*(c.sunk?.7:10))}
 if(c.hopV||c.hopY>0){c.hopY=(c.hopY||0);c.hopV-=22*dt;c.hopY+=c.hopV*dt;if(c.hopY<0){c.hopY=0;c.hopV=c.hopV<-3?-c.hopV*.3:0}}
 const ca=Math.cos(c.a),sa=Math.sin(c.a);const lng=c.ax*ca+c.az*sa,lat=-c.ax*sa+c.az*ca;
 if(!c.t.boat)c.roll+=((c.type==='moto'?clamp(lat*.04,-.6,.6):clamp(-lat*.009,-.07,.07))-c.roll)*Math.min(1,dt*6);if(!c.t.boat){const br=c.airY>0&&c.air?.bridge; /* v4 r46: no salto da ponte o nariz segue a trajetória (sobe na saída, desce suave no ar) */
  c.pitch+=((br?clamp(Math.atan2(c.airV||0,Math.max(8,Math.abs(c.fwd)))*.85,-.6,.7):c.airY>0?clamp((c.airV||0)/Math.max(8,Math.abs(c.fwd))*.6,-.35,.35):c.rampY>0?.28:clamp(lng*.006,-.05,.05))-c.pitch)*Math.min(1,dt*(br?2.6:6))}
 c.spin-=c.fwd*dt/c.t.wr;
 if(!c.g)return;
 if(c.rider)c.rider.visible=c!==PL.car&&(!!c.ai||c.mode==='rail'||c.chase);
 if(c.type==='taxi')taxiSignVisual(c);
 const lampsOn=carLampOn(c);if(c.lampMesh)c.lampMesh.visible=lampsOn;if(c.headBeam)c.headBeam.visible=lampsOn&&c!==PL.car;
 c.g.position.set(c.x,c.gy+(c.hopY||0)+(c.airY||0)+(c.rampY||0)+(c.dealLift||0),c.z);c.g.rotation.y=-c.a;c.ch.rotation.set(c.roll+(c.susp?c.susp.r:0)+(c.wobR||0),0,c.pitch+(c.susp?c.susp.p:0)+(c.wobP||0));
 // batente: a roda sobe no máximo até a folga do arco em relação ao canto da carroceria (o pneu "afunda" na calçada em vez de entrar na lataria)
 {const t=c.t,A=t.arch,sp=(c.pitch||0)+(c.susp?c.susp.p:0),sr=(c.roll||0)+(c.susp?c.susp.r:0),tw=t.vtw!==undefined?t.vtw:t.tw;
  if(c.type!=='moto')for(let i=0;i<c.wheels.length;i++){const w=c.wheels[i];let off=c.wh?c.wh[i]-c.gy:0;if(A&&c.wh){const xl=i<2?t.wb:-t.wb,zl=(i%2?1:-1)*tw,cy=xl*Math.sin(sp)-zl*Math.sin(sr),cap=i<2?A.capF:A.capR,up=Math.min(A.r0-t.wr,(cap>5?9:cap)-2*t.wr)-.008;off=clamp(off,cy-.22,cy+up)}w.piv.position.y=t.wr+clamp(off,-.25,.3)}}
 for(const w of c.wheels){w.piv.rotation.y=w.front?-c.delta:0;w.w.rotation.z=c.spin;if(c.type==='moto'){const u=w.piv.userData;if(u.y0==null){u.y0=w.piv.position.y;u.z0=w.piv.position.z}const r=c.roll;w.piv.rotation.x=r;w.piv.position.y=u.y0*Math.cos(r);w.piv.position.z=u.z0+u.y0*Math.sin(r)}}
}

