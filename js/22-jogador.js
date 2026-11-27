'use strict';
/* Coastal Chaos · js/22-jogador.js — Jogador, partículas e marcas de pneu.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= PLAYER ================= */
const PL={jy:0,jv:0,x:0,z:0,vx:0,vz:0,face:[0,1],hp:100,car:null,down:0,rot:0,anim:0,yaw:0,pitch:0,gy:.2,dead:false,deadT:0,lastCar:null,...makeCharacter(PLAYER_PAL)};
function spawnPlayer(){const N=city.N,cx=city.core?city.core.x:N*P/2,cz=city.core?city.core.z:N*P/2;let cand=city.rects.filter(r=>groundY((r[0]+r[2])/2,r[3]+4)===0).filter(r=>{const f=city.info[city.rects.indexOf(r)];return f&&f.kind!=='lm'&&f.kind!=='industrial'}).sort((a,b)=>Math.hypot((a[0]+a[2])/2-cx,(a[1]+a[3])/2-cz)-Math.hypot((b[0]+b[2])/2-cx,(b[1]+b[3])/2-cz));
 const spawnRng=mulberry32((S.seed^0x5c31b7a9)>>>0),pickR0=cand[Math.floor(spawnRng()*Math.min(4,cand.length))]||city.rects[0];const[x0,z0,x1,z1]=pickR0;PL.x=(x0+x1)/2;PL.z=z1-1.6;PL.vx=PL.vz=0;PL.hp=100;PL.car=null;PL.dead=false;PL.rot=0;PL.down=0;PL.sp.visible=true;PL.sh.visible=true;PL.face=[0,1];PL.yaw=0;
 // a free car waiting at the curb
 if(city.haze){if(city.safe){PL.x=city.safe.x;PL.z=city.safe.z+1.5}camT.x=PL.x;camT.z=PL.z;return}
 let sx=PL.x;for(let k=0;k<40;k++){const x=PL.x+(k%2?1:-1)*Math.ceil(k/2)*1.5;if(!query(x,z1-2.5,3).some(b=>b.x1>x-2.6&&b.x0<x+2.6&&b.z1>z1-3.7&&b.z0<z1-1.3)){sx=x;break}}
 const OC=ONLINE.on&&ONLINE.me&&ONLINE.me.car,c=OC?makeVehicle(OC.type,sx,z1-2.5,Math.PI,OC.color):makeVehicle('sports',sx,z1-2.5,Math.PI,STYLES[S.style].synth?'#ff2e88':'#d62828');if(OC)setCarPlate(c,OC.plate);city.startCar=c;c.hand=true;c.sleep=true;PL.x=sx+3.4;PL.z=z1-1.2;
 camT.x=PL.x;camT.z=PL.z}
function respawnBase(){const wasDead=PL.dead;worldReset();if(wasDead)try{homeOnDeath()}catch(e){console.error(e)}if(PL.dead&&!PL.inside&&!ONLINE.on){/* v4 r19: primeiro o dinheiro em mãos, o resto sai da conta corrente do banco */const m=Math.max(0,PL.money||0),fee=Math.max(100,Math.min(1000,Math.round(m*.1))),pd=bankPay(fee),tot=pd.hand+pd.acc;if(tot>0)setTimeout(()=>toast('CONTA DO HOSPITAL · −$'+tot+(pd.acc?'<br><small style="font-size:11px;color:#fff">$'+pd.acc+' '+translatePlain('DA CONTA NO BANCO')+'</small>':'')),2600)}if(POL.wanted)endWanted(true);for(const q of peds.slice())if(q.cop)removePed(q);for(const c of vehicles)c.copsOut=null;const r=perim(rectNear(PL.x+(R2()-.5)*300,PL.z+(R2()-.5)*300));const pt=perimPoint(r,R2()*400);const hs=city.haze&&city.safe?{x:city.safe.x,z:city.safe.z+1.5,hz:true}:worldRespawnSpot();
 PL.armor=0;PL.x=hs?hs.x:pt[0];PL.z=hs?hs.z:pt[1];PL.vx=PL.vz=0;PL.inside=false;PL.hp=100;PL.dead=false;PL.rot=0;PL.down=0;document.body.classList.remove('ko-grayscale');$('#ko').hidden=true;$('#ko').textContent='NOCAUTE';toast(hs&&hs.hz?'POINT HAZE<br><small style="font-size:11px;color:#fff">você acordou nas ruínas do castelo</small>':hs?(hs.pol?'DELEGACIA<br><small style="font-size:11px;color:#fff">você foi liberado</small>':'HOSPITAL<br><small style="font-size:11px;color:#fff">você recebeu alta</small>'):'DE VOLTA ÀS RUAS')}
/* v79r40: morreu → seus veículos voltam na hora pra garagem: carros da frota (vagas), o conversível da história (vaga 1) e skates seus largados na rua.
   Carro destruído continua perdido (regra da frota); carro roubado não é seu e fica onde está. */
function homeOnDeath(){const s=city.safe;if(s&&s.slots){const back=(c,sl)=>{if(!c||!sl||!c.alive||c.exploded||!vehicles.includes(c))return false;if(Math.hypot(c.x-sl.x,c.z-sl.z)<2.5)return false;if(PL.car===c)PL.car=null;if(PL.lastCar===c)PL.lastCar=null;c.x=sl.x;c.z=sl.z;c.a=sl.a||0;c.vx=c.vz=c.fwd=c.w=0;c.sleep=true;c.hand=true;c.owned=true;try{syncCar(c,0)}catch(e){}return true};let n=0;
  for(let i=0;i<2;i++)if(!(i===0&&SAFE.conv)&&back(SAFE.cars&&SAFE.cars[i],s.slots[i]))n++;if(SAFE.conv&&back(SAFE.convCar,s.slots[0]))n++;
  if(n)setTimeout(()=>toast(translatePlain(n>1?'SEUS VEÍCULOS VOLTARAM PRA GARAGEM':'SEU VEÍCULO VOLTOU PRA GARAGEM')),4200)}
 if(typeof SKATE!=='undefined'&&city.safe)for(const it of SKATE.items.slice())if(it.mine&&it.seed===S.seed&&it.style===S.style&&!skInGarage(it)){const L=it.look;skRemove(it);skGaragePlace(L)}}
function respawnPlayer(){if(storyMissionFail('VOCÊ MORREU'))return;if(S.style==='inverted'||INVERT.deathReturn){if(!INVERT.switching)void invertShiftWorld('modern','ESCAPANDO DA MORTE…',true);return}respawnBase()}
function enterExit(){if(ONLINE.on&&netEnterHook())return;if(PL.inside==='ammo'){if(ammoCounterNear())ammoOpen();return}if((PL.inside==='heist'||PL.inside==='pawn')&&heistAct())return;if(PL.taxi){taxiEnd('CORRIDA ENCERRADA · TOTAL $'+TAXI.paid);return}if(heliAct())return;if(paraAct())return;if(PL.inside==='jail'){jailBail();return}if(TVM.on){tvOff();return}if(PL.inside==='shop'||PL.inside==='mall'||PL.inside==='club'||PL.inside==='casino'){if(CTX.shop||CTX.mall||CTX.club||slotNear()>=0||casinoTableNear())ctxAct(1);return}if(wardNear()){openWard('home');return}if(PL.inside&&tvNear()){tvOn();return}
 if(PL.dead||menuOpen)return;if(SKATE.ride&&!PL.car){skDismount(false);return}if(!PL.car){const sk=skNear();if(sk){skMount(sk);return}}PL.jy=0;PL.jv=0;
 if(PL.car&&PL.car.t.boat){const c=PL.car;let spot=null;for(const p of city.piers||[]){if(Math.hypot(p.boat?p.boat.x-c.x:1e9,p.boat?p.boat.z-c.z:1e9)<14||Math.hypot(p.cx-c.x,p.cz-c.z)<16){for(let a=0;a<16&&!spot;a++){for(const dd of [2.2,3,4,5]){const x=c.x+Math.cos(a/16*6.283)*dd,z=c.z+Math.sin(a/16*6.283)*dd;if(pierY(x,z)!==null){spot=[x,z];break}}}}}
  if(!spot)for(let a=0;a<24&&!spot;a++)for(const dd of [2.5,3.5,4.5]){const x=c.x+Math.cos(a/24*6.283)*dd,z=c.z+Math.sin(a/24*6.283)*dd;if(!inWater(x,z)&&!riverZone(x,z)){spot=[x,z];break}}
  if(!spot&&maskOn()){const a=c.a+Math.PI/2;spot=[c.x+Math.cos(a)*(c.t.W/2+1.4),c.z+Math.sin(a)*(c.t.W/2+1.4)]} /* v78: com a Maskara desce da lancha em qualquer lugar (anda na água) */
  if(!spot){toast('ENCOSTE NUM PÍER OU NA PRAIA PARA SAIR');return}c.thr=0;c.hand=true;c.steerT=0;c.vx*=.2;c.vz*=.2;PL.lastCar=c;PL.car=null;PL.x=spot[0];PL.z=spot[1];PL.gy=maskOn()&&inWater(PL.x,PL.z)?waterLevel(PL.x,PL.z):groundY(PL.x,PL.z);PL.vx=PL.vz=0;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true;return}
 if(PL.car){const c=PL.car;const ca=Math.cos(c.a),sa=Math.sin(c.a);
  for(const side of [-1,1,0]){const off=side===0?-(c.t.L/2+1):0;const lzv=side*(c.t.W/2+.8);
   const x=c.x+(off*ca)-lzv*sa,z=c.z+(off*sa)+lzv*ca;const o={x,z};circleVsWorld(o,.4);
   if(Math.hypot(o.x-x,o.z-z)<.05||side===0){PL.x=o.x;PL.z=o.z;break}}
  c.thr=0;c.hand=true;c.steerT=0;PL.lastCar=c;PL.car=null;PL.rot=0;PL.sp.visible=true;PL.sh.visible=true;PL.vx=c.vx*.4;PL.vz=c.vz*.4;
  PL.yaw=Math.atan2(-Math.cos(c.a),-Math.sin(c.a));PL.face=[Math.cos(c.a),Math.sin(c.a)];
  $('#speed').hidden=true;$('#carbar').hidden=true;return}
 let best=null,bd=5.5;for(const c of carsNearTmp(PL.x,PL.z,9)){if(!c.alive||c.display||c.net)continue;const d=Math.hypot(c.x-PL.x,c.z-PL.z)-c.t.W/2;if(d<bd){bd=d;best=c}}
 if(!best)return;
 const stolenRoadPolice=policeTrafficCar(best);
 if(best.mode==='rail')toPhys(best);
 // v229: um visitante nao segue o sistema de raias; ao entrar ele passa a usar fisica normal.
 if(best.tempPark){if(best.tempPark.phase==='fade')return;best.tempPark.lot.nextVisit=simT+60+R2()*60;best.tempPark=null;best.mode='phys';best.rail=null;best.keep=false;best.ai=null;best.vx=best.vz=best.fwd=0;}
 if(best.ai){const ca=Math.cos(best.a),sa=Math.sin(best.a),escaped=[];
  const exitPed=(x,z,pal)=>{const dx=x-PL.x,dz=z-PL.z,l=Math.hypot(dx,dz)||1;
   const jp=spawnPed(null,{x,z,vx:dx/l*6.8,vz:dz/l*6.8,pal});if(jp){jp.timer=4.5;jp.spd=1.5;escaped.push(jp)}return jp};
  const x=best.x+sa*(best.t.W/2+.9),z=best.z-ca*(best.t.W/2+.9);
  const driver=exitPed(x,z,best.rpal);if(driver)say(driver,SAY.jack);if(driver&&best.type!=='pickup')pedevReact(driver,best);
  if(best.type==='pickup'&&best.bedN>0){
   // Dois caronas ja renderizados na caçamba saem junto com o motorista.
   const riders=best.bedRs||[];
   for(let k=0;k<best.bedN;k++){const side=(k?1:-1)*(best.t.W*.48+.9),back=-best.t.L*.35;
    exitPed(best.x+back*ca-side*sa,best.z+back*sa+side*ca,riders[k]&&riders[k].rpal)}
   best.bedN=0;
   if(best.bedRs){for(const r of best.bedRs){BEDR.delete(r);killChar(r)}best.bedRs=null}
   // Metade das abordagens: um ou dois dos tres ocupantes reagem a tiros.
   if(R2()<.5){const n=1+(R2()<.5?1:0);for(const p of escaped.slice().sort(()=>R2()-.5).slice(0,n)){
    p.robberyGun=6+R2()*2;p.robberyShootT=.45+R2()*.7;p.robberyCar=best}}
  }
  if((best.type==='conv'||best.type==='roadster')&&best.convRs){const riders=best.convRs;
   riders.forEach((r,k)=>{const side=(k?1:-1)*(best.t.W*.5+.9);exitPed(best.x-.2*ca-side*sa,best.z-.2*sa+side*ca,r.rpal)});
   best.convN=0;for(const r of riders){CONVR.delete(r);killChar(r)}best.convRs=null}
  best.ai=null;best.hasRider=false;}
 if(RADIO.list.length){RADIO.lastCar=best}
 if(GUN.has&&GUN.ammo>0&&camMode==='fps')setTimeout(()=>toast('DRIVE-BY<br><small style="font-size:11px;color:#fff">mouse mira · clique atira · V troca 1ª/3ª pessoa</small>'),900);
 if(!best.owned&&!best.vinylCar&&!(SAFE.cars||[]).includes(best)&&!best.net)STATS.stolen++;
 duoJoinCar(best);if(!best.owned&&!best.vinylCar&&!(SAFE.cars||[]).includes(best)&&!POL.wanted&&(stolenRoadPolice||copSees(best.x,best.z,best))){setTimeout(()=>{if(STORYINTRO.active||STORYFAIL.active||!played)return;toast('<span style="color:#ff4a4a">A POLÍCIA TE VIU ROUBANDO O CARRO!</span>');startWanted()},300)}best.owned=true;
 if(best.pedevThief){best.pedevThief=false;best.crim=false}if(best.evt&&EVT.cars[0]===best)evtEnd(); best.sleep=false;best.hand=false;PL.car=best;PL.sp.visible=false;PL.sh.visible=false;
  if(best.type==='moto'){ensureDetail(best);if(best.g)best.g.visible=true}
  $('#speed').hidden=false;$('#carbar').hidden=false;
 if(camMode==='fps'){chasePos.set(best.x-Math.cos(best.a)*9,4,best.z-Math.sin(best.a)*9)}
 initAudio();
}
function plJump(){if(SKATE.ride){skJump();return}if(PL.car||PL.dead||PL.down>0||PL.jy>.05&&PL.jv!==0)return;if(PL.jy>.05&&PL.jv===0){PL.jv=6.2;return}PL.jv=7.4;PL.jy=.001}
/* Beach rooftop jumps: resident access points and a small shared parachute model. */
const PARA={sites:[],active:null,npcs:[],timer:15,lastNpcMin:-1e9,group:null,approachCd:0,approachArmed:true};
function paraModel(npc){
 // v224: cabos inclinados 33,3% mais compridos, sem alterar a lona (jogador e NPCs).
 const PARA_CABLE_START_Y=1.3,PARA_CABLE_RADIUS=3.5;
 const PARA_CANOPY_Y=PARA_CABLE_START_Y+Math.sqrt(Math.pow(Math.hypot(PARA_CABLE_RADIUS,4-PARA_CABLE_START_Y)*4/3,2)-PARA_CABLE_RADIUS*PARA_CABLE_RADIUS);const g=new THREE.Group(),geo=new THREE.SphereGeometry(3.5,12,5,0,Math.PI*2,0,Math.PI/2),cols=[];const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const c=new THREE.Color(Math.atan2(pos.getZ(i),pos.getX(i))>0?'#fa73ac':'#61d5db');cols.push(c.r,c.g,c.b)}geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));const canopy=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));canopy.scale.y=.48;canopy.position.y=PARA_CANOPY_Y;g.add(canopy);const points=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;points.push(0,PARA_CABLE_START_Y,0,Math.cos(a)*3.5,PARA_CANOPY_Y,Math.sin(a)*3.5)}const lines=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:0xd9d4e5}));g.add(lines);if(npc){const pal={...pick2(PED_PALS)},tex=atlasTex(pal),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:.5,fog:true}));sprite.center.set(.5,0);sprite.scale.set(1.2,1.9,1);sprite.position.y=.12;g.add(sprite)}scene.add(g);return g}
function paraClear(){paraTargetClear();if(PARA.active)paraDrop(PARA.active.g);for(const n of PARA.npcs)paraDrop(n.g);if(PARA.group)paraDrop(PARA.group);PARA.sites=[];PARA.npcs=[];PARA.active=null;PARA.group=null;PARA.timer=15;PARA.lastNpcMin=-1e9;PARA.approachCd=0;PARA.approachArmed=true}
function paraDrop(g){if(!g)return;scene.remove(g);disposeGroup(g)}
function paraBeachPoint(t,u){
 const cs=city.coast,E=city.ext;
 return {x:cs===2?-u:cs===3?E+u:t,z:cs===0?-u:cs===1?E+u:t};
}
function paraLandingSites(site){
 const span=city.coastSpan||[0,city.ext],along=city.coast<2?site.x:site.z,out=[];
 for(const offset of [-12,0,12]){
  for(let attempt=0;attempt<64;attempt++){
   const t=paraSandT(clamp(along+offset+(attempt?attempt%2?attempt*3:-attempt*3:0),span[0]+8,span[1]-8));
   const point=paraBeachPoint(t,SHORE*.62);
   if(inWater(point.x,point.z)||outDist(point.x,point.z)<RW/2+SW+3)continue;
   if(query(point.x,point.z,3).some(c=>!c.dead))continue;
   out.push(point);break;
  }
 }
 if(!out.length){for(let k=0;k<128&&out.length<3;k++)for(const depth of [.52,.66,.8]){const t=paraSandT(span[0]+8+(span[1]-span[0]-16)*k/127),point=paraBeachPoint(t,SHORE*depth);if(inWater(point.x,point.z)||outDist(point.x,point.z)<RW/2+SW+3||query(point.x,point.z,2).some(c=>!c.dead)||out.some(q=>Math.hypot(q.x-point.x,q.z-point.z)<8))continue;out.push(point);break;}}
 return out;
}
function paraInit(){
 paraClear();
 const recorded=[];for(const ch of city.chunks.values())for(const roof of ch.paraRoofs||[])recorded.push(roof);
 const pr=mulberry32((S.seed^0x5ab24119)>>>0);for(let i=recorded.length-1;i>0;i--){const j=Math.floor(pr()*(i+1));[recorded[i],recorded[j]]=[recorded[j],recorded[i]]}
 recorded.sort((a,b)=>Number(b.ri===city.paraRi)-Number(a.ri===city.paraRi));
 for(const roof of recorded){const best={...roof},r=city.rects[roof.ri],doors=city.doors.get(roof.ri)||[],door=doors.slice().sort((a,b)=>Math.hypot(a.x-best.x,a.z-best.z)-Math.hypot(b.x-best.x,b.z-best.z))[0];best.ex=door?door.ox:(r[0]+r[2])/2;best.ez=door?door.oz:r[1]+1;best.landings=paraLandingSites(best);if(best.landings.length){PARA.sites.push(best);break}}
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);ray.camera=camera;scene.updateMatrixWorld(true);
 for(let i=0;i<city.info.length&&PARA.sites.length<3;i++){
  if(!city.info[i].tour||PARA.sites.some(s=>s.ri===i))continue;
  const r=city.rects[i];let best=null;
  for(const u of [.3,.5,.7])for(const v of [.3,.5,.7]){
   ray.set(new THREE.Vector3(r[0]+(r[2]-r[0])*u,400,r[1]+(r[3]-r[1])*v),down);
   const hit=ray.intersectObject(city.group,true).find(h=>h.face&&h.face.normal.y>.9&&h.point.y>14&&h.point.y<160);
   if(!hit)continue;
   const box=new THREE.Box3(),position=hit.object.geometry.attributes.position;
   for(const index of [hit.face.a,hit.face.b,hit.face.c])box.expandByPoint(new THREE.Vector3().fromBufferAttribute(position,index).applyMatrix4(hit.object.matrixWorld));
   const width=box.max.x-box.min.x,depth=box.max.z-box.min.z,area=width*depth;
   if(width<5||depth<5||best&&area<=best.area)continue;
   best={x:(box.min.x+box.max.x)/2,z:(box.min.z+box.max.z)/2,y:hit.point.y+.1,x0:box.min.x+.65,x1:box.max.x-.65,z0:box.min.z+.65,z1:box.max.z-.65,area};
  }
  if(!best)continue;
  const doors=city.doors.get(i)||[],door=doors.slice().sort((a,b)=>Math.hypot(a.x-best.x,a.z-best.z)-Math.hypot(b.x-best.x,b.z-best.z))[0];
  best.ex=door?door.ox:(r[0]+r[2])/2;best.ez=door?door.oz:r[1]+1;
  best.landings=paraLandingSites(best);if(!best.landings.length)continue;
  PARA.sites.push(best);
 }
 if(!city.haze&&(!PARA.sites.length||!PARA.sites.some(s=>s.ri===city.paraRi)))console.warn('Sem salto de praia para seed '+S.seed+' / quadra '+city.paraRi+' (r39: aviso; antes derrubava a geração da cidade e a viagem no tempo)');
 for(const L of city.lms||[])if(L.name==='sky'){
  const r=city.rects[L.ri],cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2,h=(Math.min(r[2]-r[0]-2*SW,r[3]-r[1]-2*SW)/2-3)*.26;
  const door=(city.doors.get(L.ri)||[])[0];
  const site={ri:L.ri,sky:true,free:true,x:cx+h-.8,z:cz,y:109.05,x0:cx-h+.3,x1:cx+h-.3,z0:cz-h+.3,z1:cz+h-.3,ex:door?door.ox:cx,ez:door?door.oz:r[3]-1};
  site.landings=paraLandingSites(site);if(!site.landings.length)site.landings=[{x:site.ex,z:site.ez}];PARA.sites.push(site);
 }
 PARA.group=new THREE.Group();PARA.group.visible=S.style!=='inverted';scene.add(PARA.group);
 for(const site of PARA.sites){const arrow=makeArrow();arrow.visible=true;arrow.position.set(site.ex,groundY(site.ex,site.ez)+1.5,site.ez);PARA.group.add(arrow);site.arrow=arrow}
}
function paraNear(){if(S.style==='inverted'||PARA.active||PL.car||PL.dead||PL.inside)return null;return PARA.sites.find(s=>Math.hypot(PL.x-s.ex,PL.z-s.ez)<2.8)}
function paraEdge(a){const s=a.s;return [{side:0,d:PL.z-s.z0,dx:0,dz:-1},{side:1,d:s.z1-PL.z,dx:0,dz:1},{side:2,d:PL.x-s.x0,dx:-1,dz:0},{side:3,d:s.x1-PL.x,dx:1,dz:0}].sort((a,b)=>a.d-b.d)[0]}
function paraAtEdge(a){return paraEdge(a).d<1.6}
function paraTargetSet(a){
 paraTargetClear();if(!a.s.landings.length)return;
 a.target={...a.s.landings[Math.floor(Math.random()*a.s.landings.length)]};
 // Concentric rings and bullseye share one geometry/material/draw call.
 const targetGeo=new THREE.BufferGeometry(),positions=[];
 for(const [inner,outer] of [[2.45,3.1],[1.15,1.55],[0,.4]]){
  const indexed=new THREE.RingGeometry(inner,outer,48),part=indexed.toNonIndexed();
  positions.push(...part.attributes.position.array);part.dispose();indexed.dispose();
 }
 targetGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const ring=new THREE.Mesh(targetGeo,new THREE.MeshBasicMaterial({color:0xff2020,side:THREE.DoubleSide,depthWrite:true,polygonOffset:true,polygonOffsetFactor:-12,polygonOffsetUnits:-12}));
 ring.layers.set(1);ring.renderOrder=5;ring.frustumCulled=false;ring.rotation.x=-Math.PI/2;
 {const tx=a.target.x,tz=a.target.z,gy=groundY(tx,tz),d=1.5,n=AQ.inl||[0,1],gs=(groundY(tx-n[0]*d,tz-n[1]*d)-groundY(tx+n[0]*d,tz+n[1]*d))/(2*d);
  ring.position.set(tx,gy+.12,tz);ring.rotation.set(0,0,0);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(n[0]*gs,1,n[1]*gs).normalize())}scene.add(ring);PARA.target=ring;
}
function paraTargetClear(){if(PARA.target){paraDrop(PARA.target);PARA.target=null}}
function paraAct(){
 if(PARA.active){
  const a=PARA.active;
  if(a.roof&&paraAtEdge(a)){
   const edge=paraEdge(a);a.roof=false;
   if(edge.side===0)PL.z=a.s.z0-1.5;
   if(edge.side===1)PL.z=a.s.z1+1.5;
   if(edge.side===2)PL.x=a.s.x0-1.5;
   if(edge.side===3)PL.x=a.s.x1+1.5;
   if(!a.target||!PARA.target)paraTargetSet(a);
   const duration=Math.max(1,(PL.gy-.2)/2);
   a.vx=edge.side===city.coast&&!a.s.free?(a.target.x-PL.x)/duration*.85:edge.dx*2.5;
   a.vz=edge.side===city.coast&&!a.s.free?(a.target.z-PL.z)/duration*.85:edge.dz*2.5;
   a.heading=Math.atan2(a.vz,a.vx);a.glideSpeed=Math.max(2.5,Math.hypot(a.vx,a.vz));a.pitch=0;a.bank=0;
   toast('← → DIREÇÃO · ↓ PLANAR MAIS · ↑ DESCER MAIS RÁPIDO<br><small>ALVO VERMELHO · $100</small>');
  }
  return true;
 }
 const site=paraNear();if(!site)return false;
 PARA.active={roof:true,s:site,g:null};paraTargetSet(PARA.active);PL.x=site.x;PL.z=site.z;PL.gy=site.y;PL.jy=PL.jv=0;
 toast(site.sky?'TOPO DO ARRANHA-CÉU · INTERAJA NA BORDA PARA SALTAR DE PARAQUEDAS':'TERRAÇO · SALTE POR QUALQUER UMA DAS QUATRO BORDAS');return true;
}
function paraFlightStep(a,turn,pull,dt){
 a.heading+=turn*1.45*dt;
 const lift=Math.max(0,pull),dive=Math.max(0,-pull),speed=a.glideSpeed*(1+lift*.15-dive*.12);
 a.vx=Math.cos(a.heading)*speed;a.vz=Math.sin(a.heading)*speed;
 a.sink=2-lift*.45+dive*1.3;
 const blend=1-Math.exp(-dt*5);a.pitch+=(pull*.18-a.pitch)*blend;a.bank+=(-turn*.2-a.bank)*blend;
}
function paraPlayer(dt){
 const a=PARA.active;if(!a)return false;
 if(PL.dead||PL.car||PL.inside){paraDrop(a.g);paraTargetClear();PARA.active=null;return false}
 let x=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+PAD.lx;
 let z=((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0)+PAD.ly;
 const length=Math.max(1,Math.hypot(x,z));x/=length;z/=length;
 const angle=camMode==='fps'?PL.yaw:VIEW.orbit?ORB.yaw:0;
 const dx=Math.cos(angle)*x+Math.sin(angle)*z,dz=-Math.sin(angle)*x+Math.cos(angle)*z;
 if(a.roof){
  if(a.s.sky){
   PL.x+=dx*4.3*dt;PL.z+=dz*4.3*dt;
   if(PL.jv||PL.jy){PL.jv-=9.8*dt;PL.jy=Math.max(0,PL.jy+PL.jv*dt);if(!PL.jy)PL.jv=0;}
   PL.gy=a.s.y;
   if(PL.x<a.s.x0||PL.x>a.s.x1||PL.z<a.s.z0||PL.z>a.s.z1){a.roof=false;a.freefall=true;a.fallSpeed=-Math.max(0,PL.jv);a.vx=dx*4.3;a.vz=dz*4.3;PL.gy+=PL.jy;PL.jy=PL.jv=0;}
  }else{PL.x=clamp(PL.x+dx*4.3*dt,a.s.x0,a.s.x1);PL.z=clamp(PL.z+dz*4.3*dt,a.s.z0,a.s.z1);PL.gy=a.s.y;}
 }else if(a.freefall){
  PL.x+=a.vx*dt;PL.z+=a.vz*dt;a.fallSpeed+=9.8*dt;PL.gy-=a.fallSpeed*dt;
  const floor=groundY(PL.x,PL.z);if(PL.gy<=floor){PL.gy=floor;paraTargetClear();PARA.active=null;if(drownAt(PL.x,PL.z))drown();else{PL.hp=0;killPlayer('QUEDA');}return true;}
 }else{
  if(!a.g)a.g=paraModel(false);
  paraFlightStep(a,clamp(x,-1,1),clamp(z,-1,1),dt);
  {const nx=PL.x+a.vx*dt,nz=PL.z+a.vz*dt,b=bldAt(nx,nz,.35);if(!b||roofTop(b)<PL.gy-.05){PL.x=nx;PL.z=nz}}PL.gy-=a.sink*dt;
  {const b=bldAt(PL.x,PL.z);if(b&&PL.gy<=roofTop(b)+.05){paraDrop(a.g);standOnRoof(b);toast('TELHADO<br><small style="font-size:11px;color:#fff">E na borda: saltar de novo</small>');return true}}a.g.position.set(PL.x,PL.gy,PL.z);
  a.g.rotation.set(0,-a.heading,0);a.g.rotateZ(a.pitch);a.g.rotateX(a.bank);PL.face=[Math.cos(a.heading),Math.sin(a.heading)];setFrame(PL.tex,pickDir(PL.face[0],PL.face[1],PL.x,PL.z),0);
  if(PL.gy<=(shipAt(PL.x,PL.z)?shipSupportY(PL.x,PL.z,PL.gy):groundY(PL.x,PL.z))+.1){
   PL.gy=shipAt(PL.x,PL.z)?shipSupportY(PL.x,PL.z,PL.gy):groundY(PL.x,PL.z);paraDrop(a.g);paraTargetClear();PARA.active=null;
   if(drownAt(PL.x,PL.z))drown();
   else{const td=Math.hypot(PL.x-a.target.x,PL.z-a.target.z);if(td<=3.1){const v=td<=.6?300:td<=1.55?150:60,lb=td<=.6?'NA MOSCA!':td<=1.55?'ANEL DO MEIO':'NA BORDA';if(!CHEAT.used)money(v,lb+' · +$'+v);else toast(lb+' · RECOMPENSA BLOQUEADA (CHEAT)')}}
  }
 }
 if(a.roof&&Math.hypot(dx,dz)>.05){PL.face=[dx,dz];PL.anim+=dt;setFrame(PL.tex,pickDir(dx,dz,PL.x,PL.z),Math.floor(PL.anim*7)%2)}
 PL.vx=PL.vz=PL.jy=PL.jv=0;placeSprite(PL);PL.sp.visible=camMode!=='fps'||VIEW.tp;PL.sh.visible=false;return true;
}
function paraSandT(t){if(!city.seaBranch)return t;const a=city.seaBranch.a*P+RW/2-14,b=(city.seaBranch.a+1)*P-RW/2+14;return t>a&&t<b?(t<(a+b)/2?a:b):t}
function paraBeachArrival(dt){
 const P2=PARA,p=PL.car||PL;
 P2.approachCd=Math.max(0,(P2.approachCd||0)-dt);
 if(!played||!p||PL.dead||PL.inside||STORYINTRO.active||STORYEND.active||city.coast==null)return;
 const u=outDist(p.x,p.z),span=city.coastSpan||[0,city.ext],along=city.coast<2?p.x:p.z;
 const near=u>-100&&u<SHORE*.7&&along>span[0]+10&&along<span[1]-10;
 if(!near){if(u<-140)P2.approachArmed=true;return}
 if(!P2.approachArmed||P2.approachCd>0||P2.npcs.length>=2||rainAt(p.x,p.z)>.55)return;
 P2.approachArmed=false;P2.approachCd=100;
 let best=null,bestScore=-1e9;
 const view=new THREE.Vector3();camera.getWorldDirection(view);
 for(const offset of [0,18,-18,32,-32,48,-48]){
  const t=paraSandT(clamp(along+offset,span[0]+12,span[1]-12)),q=paraBeachPoint(t,SHORE*.57);
  if(inWater(q.x,q.z)||riverZone(q.x,q.z)||query(q.x,q.z,2).some(o=>!o.dead))continue;
  const dx=q.x-camera.position.x,dz=q.z-camera.position.z,d=Math.hypot(q.x-p.x,q.z-p.z);
  if(d<18||d>165)continue;
  // Pontos a frente do observador ganham prioridade sobre os que estao atras da camera.
  const forward=(dx*view.x+dz*view.z)/Math.max(1,Math.hypot(dx,dz)),score=forward*160-Math.abs(d-65)*.6;
  if(score>bestScore){bestScore=score;best=q}
 }
 if(!best){P2.approachArmed=true;P2.approachCd=15;return}
 const height=groundY(best.x,best.z)+27;
 P2.npcs.push({x:best.x+4,z:best.z+4,y:height,tx:best.x,tz:best.z,g:paraModel(true),beachEvent:true});
 P2.timer=Math.max(P2.timer,70); // evita NPC automatico saltar logo junto ao evento
 if(PL.car)say(PL.car,'Será que eu consigo saltar também?',5);
}
function paraTick(dt){
 paraBeachArrival(dt);
 {const want=!!PARA.active;if(!!PLAYER_PAL.pack!==want){PLAYER_PAL.pack=want;applyPlayerLook()}}
 const label=document.getElementById('paraPrompt'),a=PARA.active,near=paraNear();
 label.hidden=!!menuOpen||!((a?.roof&&paraAtEdge(a))||near);
 label.textContent=a?.roof?'E / AÇÃO · SALTAR DE PARAQUEDAS':'E / AÇÃO · SUBIR AO TERRAÇO';
 for(const site of PARA.sites)if(site.arrow){site.arrow.rotation.y=simT*1.8;site.arrow.visible=!PL.inside&&!PARA.active;site.arrow.position.y=groundY(site.ex,site.ez)+1.5+Math.sin(simT*3)*.15}
 // O relogio do jogo avanca um minuto a cada GMIN (3) s reais (v3 r23); o timer abaixo continua em s reais. A cada <=180
 // minutos de jogo um NPC REALMENTE nasce, mesmo sem jogador perto da praia.
 // Mantem no maximo dois paraquedas simultaneos, sem dependencia de chuva.
 PARA.timer-=dt;
 if(PARA.timer<=0||gameMin()-PARA.lastNpcMin>=175){
  if(PARA.sites.length&&PARA.npcs.length<2&&!city.haze){ /* v79r2: nada de paraquedista na Point Haze */
   const p=PL.car||PL,valid=PARA.sites.filter(s=>s.landings?.length);
   const near=valid.filter(s=>Math.hypot(s.x-p.x,s.z-p.z)<350),choices=near.length?near:valid;
   if(choices.length){const site=choices[Math.floor(Math.random()*choices.length)],t=site.landings[Math.floor(Math.random()*site.landings.length)];
    PARA.npcs.push({x:city.coast===2?site.x0-1.5:city.coast===3?site.x1+1.5:site.x,z:city.coast===0?site.z0-1.5:city.coast===1?site.z1+1.5:site.z,y:site.y,tx:t.x,tz:t.z,g:paraModel(true)});
    PARA.lastNpcMin=gameMin();PARA.timer=50+Math.random()*78;
   }else PARA.timer=5;
  }else PARA.timer=3;
 }
 for(const npc of PARA.npcs.slice()){
  const step=Math.min(1,dt*2/Math.max(.01,npc.y-.2));npc.x+=(npc.tx-npc.x)*step;npc.z+=(npc.tz-npc.z)*step;npc.y-=2*dt;npc.g.position.set(npc.x,npc.y,npc.z);
  if(npc.y<=.2){paraDrop(npc.g);PARA.npcs.splice(PARA.npcs.indexOf(npc),1)}
 }
}

/* v3 r5: PL.face só ganha array novo quando a direção muda (antes: array novo por quadro andando/dirigindo).
   Não reescreve o array antigo no lugar: outras partes guardam a referência (tiro, mira). */
function plFace(x,z){const f=PL.face;if(!f||f[0]!==x||f[1]!==z)PL.face=[x,z]}
const PL_CAR_SPR={state:undefined,patioSpot:null,sp:null,sh:null,rot:0,jy:0,gy:0,balcony:false,x:0,z:0};
function updatePlayer(dt){
 if(PL.maskKO&&!(PL.down>0))PL.maskKO=false;document.body.classList.toggle('ko-grayscale',!!PL.dead||DRUNK.coma>0||!!PL.maskKO);if(!PL.dead&&DRUNK.coma<=0&&!$('#ko').hidden&&!(PL.down>0)){$('#ko').hidden=true;$('#ko').textContent='NOCAUTE'}
 if(TVM.on){PL.vx=PL.vz=0;return}
 if(paraPlayer(dt))return;
 if(heliPlayer(dt))return;
 if(taxiPlayer(dt))return;
 document.body.classList.toggle('ko-grayscale',!!PL.dead||DRUNK.coma>0||!!PL.maskKO);
 if(DRUNK.coma>0){PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.rot=Math.PI/2;PL.down=Math.max(PL.down,DRUNK.coma+.05);return}
 if(PL.dead){PL.deadT-=dt;if(PL.deadT<=0)respawnPlayer();}
 if(PL.car){if(GUN.has&&!vehicleWeaponAllowed(GUN.w))gunHolster(true);
  const c=PL.car;const up=keys.KeyW||keys.ArrowUp,dn=keys.KeyS||keys.ArrowDown,lf=keys.KeyA||keys.ArrowLeft,rt=keys.KeyD||keys.ArrowRight;
  c.dirt=!c.t.boat&&!PL.heli&&!inWater(c.x,c.z)&&isRural(c.x,c.z)?1:0;if(c.dirt&&Math.hypot(c.vx,c.vz)>5&&Math.random()<dt*28){const ca=Math.cos(c.a),sa=Math.sin(c.a),sd=Math.random()<.5?1:-1;emit(c.x-ca*c.t.L*.5-sa*sd*c.t.W*.4,.4,c.z-sa*c.t.L*.5+ca*sd*c.t.W*.4,(Math.random()-.5)*1.5,.6+Math.random(),(Math.random()-.5)*1.5,1.3,.9,3.2,STYLES[S.style].night?0x5a4a52:0xb89a70,false,.45)}
  let thr=(up?1:0)-(dn?1:0),st=(rt?1:0)-(lf?1:0);if(PAD.on){thr=clamp(thr+PAD.r2-PAD.l2,-1,1);st=clamp(st+Math.sign(PAD.lx)*Math.pow(Math.abs(PAD.lx),1.4),-1,1)}
  // lama: barro voando das rodas traseiras ao passar nas poças (mais forte acelerando/atolando)
  if((c.mudG||0)>.08&&!c.t.boat){const sp=Math.hypot(c.vx,c.vz),spin=Math.abs(thr)*(1-Math.min(1,sp/12));if((sp>1.5||spin>.2)&&Math.random()<dt*(18+40*c.mudG+30*spin)){const ca=Math.cos(c.a),sa=Math.sin(c.a),sd=Math.random()<.5?1:-1,bx=c.x-ca*c.t.L*.38-sa*sd*c.t.W*.42,bz=c.z-sa*c.t.L*.38+ca*sd*c.t.W*.42,k=2+sp*.25+spin*4;
   emit(bx,.35+(c.gy||0),bz,-ca*k+(Math.random()-.5)*2,1.5+Math.random()*2.5+spin*2,-sa*k+(Math.random()-.5)*2,.55+Math.random()*.3,.32,.18,Math.random()<.5?0x4a3018:0x6a4626,false,.95)}}
  const isoTouch=TOUCH.on&&TOUCH.isoLegacy===true&&!PAD.on&&!motionHasData()&&camMode==='top'&&VIEW.orbit&&!c.t.boat&&(TOUCH.joy!==null||TOUCH.isoDriving);
  let isoHand=false;if(isoTouch){const drive=isoTouchDrive(c,TOUCH.x,TOUCH.y,ORB.yaw);thr=drive.thr;st=drive.steer;isoHand=drive.hand;TOUCH.isoDriving=TOUCH.joy!==null||Math.hypot(c.vx,c.vz)>.4}else TOUCH.isoDriving=false;
  const sensed=motionSteer(dt);if(sensed!==null)st=clamp((rt?1:0)-(lf?1:0)+sensed,-1,1);
  c.nitro=!!((c.special||c.hasNitro)&&(up||thr>.3)&&(keys.ShiftLeft||keys.ShiftRight||PAD.nitro));c.thr=thr;c.steerT=st;c.hand=!!keys.Space||PAD.hand||isoHand;c.sleep=false;if(duoAutoOn())duoAuto(c,dt);if(RACE.on&&RACE.count>0&&c===RACE.car){c.thr=0;c.hand=true;c.nitro=false}PL.x=c.x;PL.z=c.z;
  if(c.type==='moto'||c.type==='jetski'){const vis=camMode!=='fps'||VIEW.tp;PL.sp.visible=vis;PL.sh.visible=false;PL.gy=c.gy+(c.airY||0)+(c.rampY||0)+(c.type==='moto'?.42:(camMode==='top'&&!VIEW.orbit?.04:.08));PL.jy=0;PL.rot=-(c.roll||0)*.9;const ca=Math.cos(c.a),sa=Math.sin(c.a);plFace(ca,sa);setFrame(PL.tex,pickDir(ca,sa,c.x-ca*.15,c.z-sa*.15),0);{const o=PL_CAR_SPR;o.state=PL.state;o.patioSpot=PL.patioSpot;o.sp=PL.sp;o.sh=PL.sh;o.rot=PL.rot;o.jy=PL.jy;o.gy=PL.gy;o.balcony=PL.balcony;o.x=c.x-ca*.15;o.z=c.z-sa*.15;placeSprite(o)}}
  return}
 if(PL.down>0||PL.dead){PL.down-=dt;PL.x+=PL.vx*dt;PL.z+=PL.vz*dt;PL.vx*=Math.exp(-dt*3);PL.vz*=Math.exp(-dt*3);circleVsWorld(PL,.4);if(PL.down<=0&&!PL.dead)PL.rot=0}
 else if(SKATE.ride)skMove(dt);
 else{
  let mx=0,mz=0;
  if(camMode==='top'){const sx=clamp(((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+PAD.lx,-1,1),sy=clamp(((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0)-PAD.ly,-1,1),y=VIEW.orbit?ORB.yaw:0;mx=Math.cos(y)*sx-Math.sin(y)*sy;mz=-Math.sin(y)*sx-Math.cos(y)*sy}
  else{const f=clamp(((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0)-PAD.ly,-1,1),s=clamp((keys.KeyD?1:0)-(keys.KeyA?1:0)+PAD.lx,-1,1);
   if(keys.ArrowLeft)PL.yaw+=dt*2.2;if(keys.ArrowRight)PL.yaw-=dt*2.2;
   const fx=-Math.sin(PL.yaw),fz=-Math.cos(PL.yaw),rx=Math.cos(PL.yaw),rz=-Math.sin(PL.yaw);mx=fx*f+rx*s;mz=fz*f+rz*s}
  const l=Math.hypot(mx,mz);const pm=Math.hypot(PAD.lx,PAD.ly),spd=(keys.ShiftLeft||keys.ShiftRight||(PAD.on&&PAD.run))&&!STAM.ex?7.8:(pm>0&&pm<.5&&!(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.ArrowUp||keys.ArrowDown))?4.3*Math.max(.45,pm*2):4.3;let spdM=maskOn()?3:1;if(spdM===1&&!PL.car){const wd=wadeDepth(PL.x,PL.z);if(wd>.05){spdM=1-.5*Math.min(1,wd/WADE_D);if(l&&Math.random()<dt*7)emit(PL.x,waterLevel(PL.x,PL.z)+.05,PL.z,(Math.random()-.5)*2,1+Math.random()*1.5,(Math.random()-.5)*2,.5,.3,.1,0xd8ecff,false,.7)}} /* v4 r29: no raso anda mais devagar e espirra água */
 if(spdM!==3){stamTick(dt,spd===7.8&&l>.1,l>.1);if(STAM.ex)spdM*=.72} /* v4 r36: fôlego */ /* v78: Maskara = supervelocidade a pé */
  const tx=l?mx/l*spd*spdM:0,tz=l?mz/l*spd*spdM:0;PL.vx+=(tx-PL.vx)*Math.min(1,dt*12);PL.vz+=(tz-PL.vz)*Math.min(1,dt*12);
  if(l){plFace(mx/l,mz/l);PL.anim+=dt*(spd>5?11:7)}else PL.anim=0;
  const bx=PL.x,bz=PL.z;PL.x+=PL.vx*dt;PL.z+=PL.vz*dt;circleVsWorld(PL,.4);shipPlayerVsContainers(PL,.38);
  if(!PL.inside)dbWallActor(PL,bx,bz,dt,.36);
  bumpBeachSkater(bx,bz);
 }
 if(PL.jy>0||PL.jv>0){PL.jv-=16*dt;PL.jy+=PL.jv*dt;let fl=0;
  for(const c of carsNearTmp(PL.x,PL.z,8)){if(c===PL.car)continue;const dx=PL.x-c.x,dz=PL.z-c.z,ca=Math.cos(c.a),sa=Math.sin(c.a),lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;if(Math.abs(lx)<c.t.L/2-.1&&Math.abs(lz)<c.t.W/2-.05&&PL.jy>c.t.H-.5)fl=Math.max(fl,c.t.H*.95)}
  const bridgeFlight=SKATE.ride?.dbFlight;
  if(bridgeFlight&&PL.jv<=0&&!inWater(PL.x,PL.z))fl=Math.max(fl,groundY(PL.x,PL.z));
  if(PL.jy<=fl){if(bridgeFlight){SKATE.ride.dbFlight=false;PL.gy=fl+skRideHeight();fl=0}PL.jy=fl;if(PL.jv<0){if(fl>0&&PL.jv<-4)thud(3);PL.jv=0}}}
 if(!PL.dead){const h=circleVsCars(PL,.4,true);if(h&&h.v>4.2&&!h.front){PL.vx=h.nx*3.5;PL.vz=h.nz*3.5}
  else if(h&&h.v>4.2&&maskSafe()){PL.down=2.4;PL.maskKO=true;PL.vx=h.pvx*.8+h.nx*4;PL.vz=h.pvz*.8+h.nz*4;PL.rot=Math.PI/2;thud(h.v);if(h.c.ai&&h.v>6)h.c.ai.stun=1.2;$('#ko').textContent=translatePlain('OLHA MÃE, FUI ATROPELADO! HA HA!');$('#ko').hidden=false} /* v78: Maskara atropelada não se machuca: cai, ri e levanta */
  else if(h&&h.v>4.2){const dmg=Math.round((h.v-3)*4.5);PL.hp-=armorHit(dmg);rumble(.8,.8,300);PL.down=1.4;PL.vx=h.pvx*.8+h.nx*4;PL.vz=h.pvz*.8+h.nz*4;PL.rot=Math.PI/2;thud(h.v);
  if(h.c.ai&&h.v>6)h.c.ai.stun=1.2;
  if(PL.hp<=0){NEWS.cause='ATROPELADO';if(!storyMissionFail('VOCÊ MORREU ATROPELADO')){PL.hp=0;PL.dead=true;PL.deadT=5;$('#ko').hidden=false}}}}
 const es=maskOn()?null:estuaryAt(PL.x,PL.z,true);if(es&&!PL.car&&!PL.dead){const pk=(1-es.edge)*5*clamp((es.bank-1.2)/1.6,0,1)*clamp(es.sl/.2,0,1)*dt;PL.x+=es.dx*pk;PL.z+=es.dz*pk;if(es.wet&&drownAt(PL.x,PL.z))drown()} /* v3 r27: escorrega só nas margens altas (perto da ponte, como antes); na corneta rasa perto do mar, não */if(!worldPlGy(dt)){let sy=shipAt(PL.x,PL.z)?shipSupportY(PL.x,PL.z,PL.gy+PL.jy):groundY(PL.x,PL.z);{ /* v79r2: Maskara correndo na água passa POR BAIXO das pontes — segue no nível da água, ignora a mureta baixa e some sob a laje (balão 1x por passagem) */
  const mk=maskOn()&&!PL.car&&!PL.inside,wet=mk&&inWater(PL.x,PL.z),dk=(m)=>(city.decks||[]).some(r=>PL.x>r[0]-m&&PL.x<r[2]+m&&PL.z>r[1]-m&&PL.z<r[3]+m);
  PL.ubr=mk&&!wet&&PL.gy<-1&&dk(1.2);PL.ubrIn=PL.ubr&&dk(-.3);if(PL.ubrIn&&!PL.ubrSaid){PL.ubrSaid=true;think(PL,'Gostoso esse concreto todo',2.6)}if(!PL.ubr&&!dk(3))PL.ubrSaid=false;
  if(wet||PL.ubr)sy=waterLevel(PL.x,PL.z)+.02} /* v78: só fora de interiores (o lab fica em coordenada de mar) */ /* v78: Maskara corre por cima de rio e mar */if(SKATE.ride)sy=SKATE.ride.dbFlight?skRideHeight():sy+skRideHeight();PL.gy+=(sy-PL.gy)*Math.min(1,dt*10)}
 const moving=Math.hypot(PL.vx,PL.vz)>.5&&PL.down<=0;const ph=Math.floor(PL.anim)%4;const fr=PL.jy>.05?1:moving?(ph===1?1:ph===3?2:0):0;
 setFrame(PL.tex,pickDir(PL.face[0],PL.face[1],PL.x,PL.z),fr);
 placeSprite(PL);const vis=(camMode!=='fps'||VIEW.tp)&&!PL.ubrIn&&!(typeof PHOTO!=='undefined'&&PHOTO.hidePl);PL.sp.visible=vis;PL.sh.visible=vis;
}

/* ================= PARTICLES & SKIDS ================= */
const PART_CAP=420,partNormGeo=new THREE.PlaneGeometry(1,1),partAddGeo=new THREE.PlaneGeometry(1,1),partNormOp=new THREE.InstancedBufferAttribute(new Float32Array(PART_CAP),1),partAddOp=new THREE.InstancedBufferAttribute(new Float32Array(PART_CAP),1);
partNormOp.setUsage(THREE.DynamicDrawUsage);partAddOp.setUsage(THREE.DynamicDrawUsage);partNormGeo.setAttribute('aPartOp',partNormOp);partAddGeo.setAttribute('aPartOp',partAddOp);
function makePartInstMat(blending){const m=new THREE.MeshBasicMaterial({map:glowTex,color:0xffffff,transparent:true,depthWrite:false,blending});
 m.onBeforeCompile=sh=>{sh.vertexShader='attribute float aPartOp;\nvarying float vPartOp;\n'+sh.vertexShader.replace('#include <begin_vertex>','vPartOp=aPartOp;\n#include <begin_vertex>');sh.fragmentShader='varying float vPartOp;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragColor.a*=vPartOp;')};
 m.customProgramCacheKey=()=>'partInst-'+(blending===THREE.AdditiveBlending?'add':'norm');return m}
const PART_NORM_IM=new THREE.InstancedMesh(partNormGeo,makePartInstMat(THREE.NormalBlending),PART_CAP),PART_ADD_IM=new THREE.InstancedMesh(partAddGeo,makePartInstMat(THREE.AdditiveBlending),PART_CAP);
for(const im of [PART_NORM_IM,PART_ADD_IM]){im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(PART_CAP*3),3);im.instanceColor.setUsage(THREE.DynamicDrawUsage);im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);im.layers.set(1);im.frustumCulled=false;im.count=0;scene.add(im)}
const parts=[],_partCol=new THREE.Color(),_partM=new THREE.Matrix4(),_partV=new THREE.Vector3(),_partS=new THREE.Vector3();
for(let i=0;i<PART_CAP;i++)parts.push({life:0,max:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,s0:1,s1:1,op:1,sc:1,curOp:0,cr:1,cg:1,cb:1,add:false,vis:false});
let partI=0;
function emit(x,y,z,vx,vy,vz,life,s0,s1,color,add,op){const p=parts[partI=(partI+1)%parts.length];p.vis=true;p.nograv=false;p.x=x;p.y=y;p.z=z;p.vx=vx;p.vy=vy;p.vz=vz;p.life=p.max=life;p.s0=s0;p.s1=s1;p.op=op;p.sc=s0;p.curOp=op;p.add=!!add;_partCol.setHex(color);p.cr=_partCol.r;p.cg=_partCol.g;p.cb=_partCol.b}
function updateParts(dt){for(const p of parts){if(p.life<=0)continue;p.life-=dt;if(p.life<=0){p.vis=false;continue}
 const k=1-p.life/p.max;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.s0<.5&&!p.nograv)p.vy-=9*dt;p.sc=p.s0+(p.s1-p.s0)*k;p.curOp=p.op*(1-k)}}
function syncPartInstances(cam){const q=cam.quaternion,na=partAddOp.array,no=partNormOp.array;let nn=0,nad=0;
 for(let i=0;i<parts.length;i++){const p=parts[i];if(p.life<=0||!p.vis||p.curOp<=.002)continue;_partV.set(p.x,p.y,p.z);_partS.set(p.sc,p.sc,1);_partM.compose(_partV,q,_partS);
  if(p.add){PART_ADD_IM.setMatrixAt(nad,_partM);PART_ADD_IM.instanceColor.setXYZ(nad,p.cr,p.cg,p.cb);na[nad]=p.curOp;nad++}
  else{PART_NORM_IM.setMatrixAt(nn,_partM);PART_NORM_IM.instanceColor.setXYZ(nn,p.cr,p.cg,p.cb);no[nn]=p.curOp;nn++}}
 PART_NORM_IM.count=nn;PART_ADD_IM.count=nad;
 if(nn){PART_NORM_IM.instanceMatrix.needsUpdate=true;PART_NORM_IM.instanceColor.needsUpdate=true;partNormOp.needsUpdate=true}
 if(nad){PART_ADD_IM.instanceMatrix.needsUpdate=true;PART_ADD_IM.instanceColor.needsUpdate=true;partAddOp.needsUpdate=true}}
const SKMAX=4000,skPos=new Float32Array(SKMAX*18);let skI=0,skN=0;
const skGeo=new THREE.BufferGeometry();skGeo.setAttribute('position',new THREE.BufferAttribute(skPos,3));
const skMesh=new THREE.Mesh(skGeo,new THREE.MeshBasicMaterial({color:0x0c0c0c,transparent:true,opacity:.55,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
skMesh.frustumCulled=false;skMesh.renderOrder=1;scene.add(skMesh);skGeo.setDrawRange(0,0);
// v78: marcas de pneu somem em 1 min real: ficam 50 s e esmaecem nos 10 s finais. Material básico próprio (não toca no shader de luz).
const skAge=new Float32Array(SKMAX*6).fill(-999),SKCLK={t:0,u:{value:0}};skGeo.setAttribute('aT',new THREE.BufferAttribute(skAge,1));
skMesh.material.onBeforeCompile=sh=>{sh.uniforms.uNow=SKCLK.u;sh.vertexShader='attribute float aT;varying float vT;\n'+sh.vertexShader.replace('#include <begin_vertex>','vT=aT;\n#include <begin_vertex>');
 sh.fragmentShader='uniform float uNow;varying float vT;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n gl_FragColor.a*=clamp((60.0-(uNow-vT))/10.0,0.0,1.0);')};
skMesh.material.customProgramCacheKey=()=>'skidFade-v78';
// v107: altura da marca pelo chão de cada ponta (não pelo centro do carro, que oscila na suspensão);
// gramados (praças, quintais) ficam ~4 cm acima do nível da calçada, então a marca sobe junto pra não sumir embaixo da grama
function skidY(x,z,y){const g=groundY(x,z);return Math.abs(g-.2)<.01?g+.052:Math.abs(g)<.01?.03:Math.max(g+.03,Math.min(y,g+.06))}
function addSkid(x0,z0,x1,z1,y){const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz);if(l<.05||l>3)return;const nx=-dz/l*.14,nz=dx/l*.14;const o=skI*18;const ya=skidY(x0,z0,y),yb=skidY(x1,z1,y);
 const v=skPos;v[o]=x0-nx;v[o+1]=ya;v[o+2]=z0-nz;v[o+3]=x0+nx;v[o+4]=ya;v[o+5]=z0+nz;v[o+6]=x1+nx;v[o+7]=yb;v[o+8]=z1+nz;v[o+9]=x0-nx;v[o+10]=ya;v[o+11]=z0-nz;v[o+12]=x1+nx;v[o+13]=yb;v[o+14]=z1+nz;v[o+15]=x1-nx;v[o+16]=yb;v[o+17]=z1-nz;
 skAge.fill(SKCLK.t,skI*6,skI*6+6);skGeo.attributes.aT.needsUpdate=true;skI=(skI+1)%SKMAX;skN=Math.min(SKMAX,skN+1);skGeo.attributes.position.needsUpdate=true;skGeo.setDrawRange(0,skN*6)}
function clearSkids(){skI=0;skN=0;skGeo.setDrawRange(0,0);skAge.fill(-999);skGeo.attributes.aT.needsUpdate=true}


/* v4 r36 · FÔLEGO: correr gasta (≈14 s de corrida contínua), esgotado = sem corrida até 35% e andar 28% mais lento.
   Indicador: borda branca embaçada nas beiradas da tela (#fatigue), sem texto. Maskara não cansa. */
const STAM={v:1,ex:false,el:null,a:-1,t:0};
function stamTick(dt,run,moving){
 if(run){STAM.v=Math.max(0,STAM.v-dt/10.5);if(STAM.v<=0)STAM.ex=true} /* v4 r41: 75% da corrida de antes (14 s) */
 else STAM.v=Math.min(1,STAM.v+dt*(moving?.045:.1)); /* v4 r41: descanso 2× mais lento */
 if(STAM.ex&&STAM.v>=.35)STAM.ex=false;stamFx(dt)}
function stamIdle(dt){if(STAM.v<1||STAM.ex){STAM.v=Math.min(1,STAM.v+dt*.1);if(STAM.ex&&STAM.v>=.35)STAM.ex=false}stamFx(dt)}
function stamFx(dt){STAM.t+=dt;stamBar(dt);
 let a=STAM.v<.6?(.6-STAM.v)/.6:0;if(STAM.ex)a=Math.max(a,.75);
 if(a>0)a*=.82+.18*Math.sin(STAM.t*(STAM.ex?5.5:3.5)); /* respiração */
 a=Math.round(a*40)/40;if(a===STAM.a)return;STAM.a=a;
 if(!STAM.el){const d=document.createElement('div');d.id='fatigue';document.body.appendChild(d);STAM.el=d;
  const st=document.createElement('style');st.textContent='#fatigue{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;display:none;'+
   'background:radial-gradient(ellipse at center,rgba(255,255,255,0) 52%,rgba(255,255,255,.28) 78%,rgba(255,255,255,.62) 100%);'+
   'backdrop-filter:blur(2.2px);-webkit-backdrop-filter:blur(2.2px);'+
   '-webkit-mask-image:radial-gradient(ellipse at center,transparent 50%,#000 88%);mask-image:radial-gradient(ellipse at center,transparent 50%,#000 88%)}';
  document.head.appendChild(st)}
 STAM.el.style.display=a>0?'block':'none';STAM.el.style.opacity=a.toFixed(3)}
/* v4 r41 · barra branca de fôlego embaixo da sorte (#hpwrap): aparece enquanto o fôlego não está cheio e some 1,5 s depois de encher; com o mouse no minimapa aparece sempre */
function stamBar(dt){let el=STAM.bar;if(!el){const w=document.getElementById('hpwrap');if(!w)return;
  const st=document.createElement('style');st.textContent='#stam{display:flex;align-items:center;gap:5px;margin-top:3px;opacity:0;transition:opacity .4s;justify-content:flex-end}#stam.on,body:has(#mini:hover) #stam{opacity:1}#stam i{font-style:normal;font-size:10px;line-height:1;filter:drop-shadow(1px 1px 0 #000)}#stam b{position:relative;display:block;width:96px;height:4px;background:rgba(0,0,0,.55);border:1px solid rgba(0,0,0,.8)}#stam u{position:absolute;left:0;top:0;bottom:0;background:#fff;transition:background .3s}#stam.ex u{background:#ffb3b3}body.hide-gamehud #stam{display:none!important}body.touch #stam b{width:80px}';
  document.head.appendChild(st);el=document.createElement('div');el.id='stam';el.innerHTML='<i>💨</i><b><u></u></b>';
  const lk=document.getElementById('luck');if(lk&&lk.parentNode===w)lk.after(el);else w.appendChild(el);STAM.bar=el;STAM.hold=0}
 if(!el.isConnected||(STAM.lk!==1)){const w=document.getElementById('hpwrap'),lk=document.getElementById('luck');if(lk&&lk.parentNode===w){if(lk.nextSibling!==el)lk.after(el);STAM.lk=1}else if(w&&!el.isConnected)w.appendChild(el)} /* fica sempre logo abaixo da sorte */
 if(STAM.v<1)STAM.hold=1.5;else STAM.hold=Math.max(0,(STAM.hold||0)-dt);
 const on=STAM.hold>0;if(el._on!==on){el._on=on;el.classList.toggle('on',on)}
 if(el._ex!==STAM.ex){el._ex=STAM.ex;el.classList.toggle('ex',STAM.ex)}
 const v=Math.round(STAM.v*100);if(el._v!==v){el._v=v;el.querySelector('u').style.width=v+'%'}}
