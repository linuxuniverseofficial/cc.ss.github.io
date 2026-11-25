'use strict';
/* Coastal Chaos · js/24-camera-input.js — Câmera, teclado e mouse.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= CAMERA ================= */
const LOOK={yaw:0,pitch:0,t:9};function lookHold(){return GUN.has&&GUN.ammo>0?7:1.8}let camMode='top';const camT={x:0,z:0};let camH=40;const chasePos=new THREE.Vector3();let shadowSize=0;
function setLens(fov,near){if(camera.fov!==fov||Math.abs(camera.near-near)>.5||(near<1&&camera.near!==near)){camera.fov=fov;camera.near=near;camera.updateProjectionMatrix()}}
// Ignore complete revolutions when returning the vehicle view to its default angle.
function cameraAngle(a){return Math.atan2(Math.sin(a),Math.cos(a))}
/* r45: distância livre da câmera testando o trajeto inteiro contra os colisores (paredes finas, ex.: laboratório) */
function colCamDist(x,z,dx,dz,max){for(let s=.2;s<=max;s+=.2){const px=x+dx*s,pz=z+dz*s;if(query(px,pz,.5).some(b=>!b.dead&&!b.low&&b.kind!=='pole'&&px>b.x0-.22&&px<b.x1+.22&&pz>b.z0-.22&&pz<b.z1+.22))return Math.max(.3,s-.3)}return max}
/* r45: laboratório — câmera em outro cômodo/corredor que o jogador (atrás de uma porta) desce para baixo da verga (2,3 m), senão a parede acima da porta tampa o jogador */
function labCamClamp(p){const F=(LAB.F||[]).find(F=>F.rooms&&Math.abs(PL.z-(F.z||0))<40);if(!F)return;const reg=(x,z)=>{for(const k in F.rooms){const r=F.rooms[k];if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)return k}return '#'};if(reg(PL.x,PL.z)!==reg(p.x,p.z))p.y=Math.min(p.y,2.1)}
function ammoCameraBounds(p){
 // v78: danceteria — a parede tem colisor fino e a câmera pulava para fora do salão (W=10, D=7, teto 4,2).
 if(PL.inside==='club'&&CAS.clubBase){const B=CAS.clubBase;p.x=clamp(p.x,B.x-9.6,B.x+9.6);p.z=clamp(p.z,B.z-6.6,B.z+6.6);p.y=clamp(p.y,.35,3.7);return}
 if(PL.inside!=='ammo'||!AMMO.IN)return;const I=AMMO.IN;p.x=clamp(p.x,I.x-6.65,I.x+6.65);p.z=clamp(p.z,I.z-5.65,I.z+5.65);p.y=clamp(p.y,.35,3.15)}
function updateCamera(dt,snapCamera=false){
 const close=PROLOGUE.active&&CHAR.cur===1&&(PL.inside==='jail'||PL.inside==='mall');
 if(!close){const rc=ONLINE.on&&!PL.car?netRideCar():null;if(!rc)return gameplayCamera(dt,snapCamera);PL.car=rc;try{return gameplayCamera(dt,snapCamera)}finally{PL.car=null}}
 const mode=camMode,tp=VIEW.tp,z=VIEW.tpz,orbit=VIEW.orbit;
 camMode='fps';VIEW.tp=true;VIEW.tpz=1;VIEW.orbit=false;
 try{return gameplayCamera(dt,snapCamera)}finally{camMode=mode;VIEW.tp=tp;VIEW.tpz=z;VIEW.orbit=orbit}
}
// Shared bank-style vertical limit for all indoor third-person cameras.
function interiorCameraHeight(p,aiming){if(PL.inside)p.y=Math.min(p.y,aiming?2.7:2.75);if(PL.inside==='lab')labCamClamp(p);if(PL.inside==='motel'&&MOTEL.rooms)houseCamClamp(p);return p}
function gameplayCamera(dt,snapCamera=false){const cameraStep=snapCamera?1e6:dt;LOOK.yaw=cameraAngle(LOOK.yaw);
if(DEAL.open&&city.deal){dealCam(dt);return}if(TVM.on){tvCam(dt);return}switchCapSync();if(SWITCH.on){switchCam(dt);return}if(CAMHOP.on){camHopTick(dt);return}if(BR.fall){brFallCam(dt);return}
 let fx,fz;
 if(camMode==='top'){const roofHeight=PARA.active||PL.heli?PL.gy:0;let tx,tz,spd=0;if(PL.car){const c=PL.car;tx=c.x+c.vx*.45;tz=c.z+c.vz*.45;spd=Math.hypot(c.vx,c.vz)}else{tx=PL.x;tz=PL.z}
  const k=1-Math.exp(-cameraStep*5);camT.x+=(tx-camT.x)*k;camT.z+=(tz-camT.z)*k;const hT=46+Math.min(spd,45)*1.1;camH+=(hT-camH)*(1-Math.exp(-cameraStep*1.4));
  if(VIEW.orbit){if(keys.KeyZ)ORB.yaw-=dt*1.6;if(keys.KeyC)ORB.yaw+=dt*1.6;const d=ORB.d+Math.min(spd,40)*.35,el=.9,h=d*Math.cos(el),H=d*Math.sin(el);camH=d*2;setLens(45,1);
   camera.up.set(0,1,0);camera.position.set(camT.x+Math.sin(ORB.yaw)*h,H+roofHeight,camT.z+Math.cos(ORB.yaw)*h);camera.lookAt(camT.x,1+roofHeight,camT.z)}
  else{setLens(50,1);camera.up.set(0,0,-1);camera.position.set(camT.x,camH+roofHeight,camT.z);camera.lookAt(camT.x,roofHeight,camT.z)}fx=camT.x;fz=camT.z;
 }else if(PL.taxi){const c=PL.taxi;if(PAD.on){TAXI.cy=(TAXI.cy||0)+PAD.rx*dt*2.4;TAXI.cpit=clamp((TAXI.cpit||0)+PAD.ry*dt*1.6,-.35,1.15)}const A=c.a+(TAXI.cy||0),ca=Math.cos(A),sa=Math.sin(A),pt=TAXI.cpit||0,R=(6.5+c.t.L*.55)*(1+pt*.25);setLens(68,.35);const want=new THREE.Vector3(c.x-ca*R*Math.cos(pt*.6),c.gy+3.4+pt*6,c.z-sa*R*Math.cos(pt*.6));chasePos.lerp(want,1-Math.exp(-cameraStep*6));camera.up.set(0,1,0);camera.position.copy(chasePos);camera.lookAt(c.x+ca*(10-pt*8),c.gy+1.4,c.z+sa*(10-pt*8));fx=c.x;fz=c.z;
 }else if(PL.heli){if(!VIEW.tp){VIEW.tp=true;VIEW.tpz=1}const h=PL.heli,ca=Math.cos(h.yaw),sa=Math.sin(h.yaw);setLens(65,.5);const want=new THREE.Vector3(h.x-ca*19,h.y+7.5,h.z-sa*19);chasePos.lerp(want,1-Math.exp(-cameraStep*4));camera.up.set(0,1,0);camera.position.copy(chasePos);camera.lookAt(h.x+ca*12,h.y-1,h.z+sa*12);fx=h.x;fz=h.z;
 }else if(PL.car&&!VIEW.tp){const c=PL.car;LOOK.t+=dt;if(LOOK.t>lookHold()){const k=1-Math.exp(-dt*2.5);LOOK.yaw-=LOOK.yaw*k;LOOK.pitch-=LOOK.pitch*k}
  setLens(72,.3);const ca=Math.cos(c.a),sa=Math.sin(c.a),HOOD={sedan:[.3,1.14],taxi:[.3,1.14],police:[.3,1.15],sports:[.3,1.0],super:[.3,.96],conv:[.28,1.12],hatch:[.28,1.18],suv:[.3,1.45],pickup:[.3,1.38],van:[.36,1.5],bus:[.515,2.05],truck:[.515,1.95]}[c.type],ox=HOOD?c.t.L*HOOD[0]:-c.t.L*.06,oz=HOOD?0:-c.t.W*.2;
  // v267: conversivel em 1a pessoa: camera no ASSENTO do personagem
  // controlado. Alt alterna Nathan/Claire, sem teleporte, transicao ou mudar o carro.
  const openTop=c.type==='conv'||c.type==='roadster',duet=DUO.on&&DUO.car===c;
  const seatZ=duet&&CHAR.cur!==DUO.drv?.40:-.40;
  camera.up.set(0,1,0);camera.position.set(c.x+ca*(openTop?-.18:ox)-sa*(openTop?seatZ:oz),c.gy+(c.hopY||0)+(c.airY||0)+(c.rampY||0)+(openTop?(c.type==='roadster'?1.12:1.24):(HOOD?HOOD[1]:c.t.H*.83)),c.z+sa*(openTop?-.18:ox)+ca*(openTop?seatZ:oz));
  camera.rotation.order='YXZ';camera.rotation.set(-LOOK.pitch*.6-c.pitch,-c.a-Math.PI/2-LOOK.yaw,c.roll);fx=c.x;fz=c.z;
 }else if(PL.car){const c=PL.car;LOOK.t+=dt;if(LOOK.t>lookHold()){const k=1-Math.exp(-dt*2.5);LOOK.yaw-=LOOK.yaw*k;LOOK.pitch-=LOOK.pitch*k}
  const ang=c.a+LOOK.yaw,ca=Math.cos(ang),sa=Math.sin(ang);const zc=VIEW.tpz||0,dist=[6.5+c.t.L*.55,4.2+c.t.L*.5,2.6+c.t.L*.45][zc],ht=[2.4+c.t.H*.7,2.05+c.t.H*.75,1.6+c.t.H*.75][zc]+Math.sin(LOOK.pitch)*dist, /* v77: perto/bem perto acima do teto (estilo GTA III/VC/SA) para ver o trânsito por cima dos carros */hd=dist*Math.cos(LOOK.pitch);
  const want=new THREE.Vector3(c.x-ca*hd,c.gy+(c.airY||0)*.7+Math.max(.8,ht),c.z-sa*hd);chasePos.lerp(want,1-Math.exp(-cameraStep*(LOOK.t<lookHold()?14:5)));
  setLens(68,.35);
  camera.up.set(0,1,0);camera.position.copy(chasePos);camera.lookAt(c.x+ca*12,c.gy+(c.airY||0)+[1.5,1.3,1.15][zc],c.z+sa*12);fx=c.x;fz=c.z;
 }else if(VIEW.tp&&GUN.has&&!PL.dead&&!PL.down){// sobre o ombro (TPS): mira no centro da tela
  setLens(62,.15);const cp=Math.cos(PL.pitch),ax=-Math.sin(PL.yaw)*cp,ay=Math.sin(PL.pitch),az=-Math.cos(PL.yaw)*cp,rx=Math.cos(PL.yaw),rz=-Math.sin(PL.yaw);
  const inB=(x,z)=>query(x,z,.6).some(b=>!b.dead&&b.kind!=='pole'&&b.kind!=='tree'&&x>b.x0-.25&&x<b.x1+.25&&z>b.z0-.25&&z<b.z1+.25);
  const hx=PL.x+rx*1.05,hz=PL.z+rz*1.05,hy=PL.gy+(PL.jy||0)+2.05;let dd=3.6;for(;dd>.6;dd-=.25){if(!inB(hx-ax*dd,hz-az*dd))break}if(PL.inside==='backrooms'&&BR.m){const hl=Math.max(.05,Math.hypot(ax,az));dd=Math.min(dd,brCamDist(hx,hz,-ax/hl,-az/hl,3.6*hl)/hl)}else if(PL.inside==='lab'){const hl=Math.max(.05,Math.hypot(ax,az));dd=Math.min(dd,colCamDist(hx,hz,-ax/hl,-az/hl,3.6*hl)/hl)}
  const want=new THREE.Vector3(hx-ax*dd,Math.max(PL.gy+.5,hy-ay*dd),hz-az*dd);
  if(PL.inside==='mall'&&MALL.G){want.y=Math.min(want.y,MALL.lvl?5.7:9.6)}
  else if((PL.inside===true||PL.inside==='heist')&&houseRooms())houseCamClamp(want)
  else if(PL.inside)want.y=Math.min(want.y,2.7);
  interiorCameraHeight(want,true);ammoCameraBounds(want);chasePos.lerp(want,1-Math.exp(-cameraStep*18));ammoCameraBounds(chasePos);interiorCameraHeight(chasePos,true);
  if((PL.inside===true||PL.inside==='heist')&&houseRooms())houseCamClamp(chasePos)
  camera.up.set(0,1,0);camera.position.copy(chasePos);camera.lookAt(chasePos.x+ax*30,chasePos.y+ay*30-1.2,chasePos.z+az*30);fx=PL.x;fz=PL.z;
 }else if(VIEW.tp){setLens(70,.2);const fwx=-Math.sin(PL.yaw),fwz=-Math.cos(PL.yaw),el=clamp(.32-PL.pitch*.7,-.15,1.2),dist=[4.6,3.3,2.3][VIEW.tpz||0],hb=[1.5,1.75,1.9][VIEW.tpz||0];
  const inB=(x,z)=>query(x,z,.6).some(b=>!b.dead&&b.kind!=='pole'&&b.kind!=='tree'&&x>b.x0-.3&&x<b.x1+.3&&z>b.z0-.3&&z<b.z1+.3);
  let dd=dist;for(;dd>1.4;dd-=.4){if(!inB(PL.x-fwx*dd*Math.cos(el),PL.z-fwz*dd*Math.cos(el)))break}
  if(PL.inside==='backrooms'&&BR.m){const ce=Math.max(.05,Math.cos(el));dd=brCamDist(PL.x,PL.z,-fwx,-fwz,dist*ce)/ce}else if(PL.inside==='lab'){const ce=Math.max(.05,Math.cos(el));dd=Math.min(dd,colCamDist(PL.x,PL.z,-fwx,-fwz,dist*ce)/ce)} /* r45: paredes finas do laboratório (Point Haze) — a câmera ficava atrás da parede */ /* v3 r10: paredes finas das Backrooms — testa o trajeto inteiro, não só o ponto da câmera */
  const want=new THREE.Vector3(PL.x-fwx*dd*Math.cos(el),PL.gy+(PL.jy||0)+hb+Math.sin(el)*dist+(dist-dd)*.35,PL.z-fwz*dd*Math.cos(el));
  if(PL.inside==='mall'&&MALL.G){const R=MALL.lvl?MALL.U:MALL.G;want.y=Math.min(want.y,MALL.lvl?5.7:9.6);want.x=clamp(want.x,R.x-50,R.x+50);want.z=clamp(want.z,R.z-50,R.z+50)}
  else if(PL.inside==='jail'&&JAIL.IN){want.y=Math.min(want.y,2.9);want.x=clamp(want.x,JAIL.IN.x-5.5,JAIL.IN.x+5.5);want.z=clamp(want.z,JAIL.IN.z-4.55,JAIL.IN.z+6.65)}
  else if(PL.inside==='shop'&&SHOP.IN){want.y=Math.min(want.y,2.85);want.x=clamp(want.x,SHOP.IN.x-SHOP.W+.25,SHOP.IN.x+SHOP.W-.25);want.z=clamp(want.z,SHOP.IN.z-SHOP.D+.25,SHOP.IN.z+SHOP.D-.25)}
  else if((PL.inside===true||PL.inside==='heist')&&houseRooms())houseCamClamp(want)
  else if(PL.inside)want.y=Math.min(want.y,2.75); // penhores, assalto, banco, cassino, império: as paredes já encurtam a câmera; antes ela era presa na caixa do esconderijo (longe)
  interiorCameraHeight(want,false);ammoCameraBounds(want);chasePos.lerp(want,1-Math.exp(-cameraStep*12));ammoCameraBounds(chasePos);interiorCameraHeight(chasePos,false);
  if((PL.inside===true||PL.inside==='heist')&&houseRooms())houseCamClamp(chasePos)
  camera.up.set(0,1,0);camera.position.copy(chasePos);camera.lookAt(PL.x+fwx*2,PL.gy+1.4-(PL.down>0?1:0),PL.z+fwz*2);fx=PL.x;fz=PL.z;
 }else{setLens(75,.25);
  const bob=Math.hypot(PL.vx,PL.vz)>.5?Math.sin(PL.anim*1.6)*.05:0;camera.position.set(PL.x,PL.gy+(PL.jy||0)+1.62+bob-(PL.down>0?1.1:0),PL.z);
  camera.rotation.order='YXZ';camera.rotation.set(PL.pitch,PL.yaw,PL.down>0?.6:0);fx=PL.x;fz=PL.z}
 if(shake>0&&!snapCamera){shake=Math.max(0,shake-dt*1.6);const k=shake*(camMode==='top'?1.2:.35);camera.position.x+=(R2()-.5)*k;camera.position.y+=(R2()-.5)*k;camera.position.z+=(R2()-.5)*k}
 if(JUMP.active&&PL.car&&JUMP.cam){const c=PL.car;JUMP.t+=dt;camera.up.set(0,1,0);setLens(55,.3);camera.position.set(JUMP.cam[0],JUMP.cam[1],JUMP.cam[2]);camera.lookAt(c.x,c.gy+(c.airY||0)+1,c.z);if(JUMP.t>3.2){JUMP.active=false;TS=1}}
 if(!snapCamera&&(DRUNK.level>0||DRUNK.coma>0)){const sway=Math.max(DRUNK.level,DRUNK.coma>0?1:0),roll=(Math.sin(DRUNK.ph*1.3)+Math.sin(DRUNK.ph*2.7)*.45)*.045*sway;camera.rotation.z+=roll;if(camMode==='top'&&!VIEW.orbit)camera.position.x+=Math.sin(DRUNK.ph*.9)*.18*sway;else camera.position.y+=Math.sin(DRUNK.ph*.9)*.08*sway}
 sky.position.copy(camera.position);
 const st=STYLES[S.style];let sz;
 if(camMode==='top'){sz=Math.max(40,camH*.95);
  if(PL.heli||PARA.active){
   const viewH=Math.max(0,camera.position.y-groundY(fx,fz));
   const half=viewH*Math.tan(camera.fov*Math.PI/360),aspect=Math.max(1,camera.aspect);
   const orbitShift=Math.hypot(camera.position.x-fx,camera.position.z-fz);
   sz=Math.max(sz,Math.hypot(half*aspect,half)*1.2+orbitShift+18);
  }
 }else{
  const sd=shadowDistanceMeters(),front=clamp(sd*.82,24,112),rear=clamp(sd*.34,18,38);
  sz=(front+rear)*.5+1.5;const bias=(front-rear)*.5;
  if(PL.heli||PARA.active){const alt=Math.max(0,camera.position.y-groundY(fx,fz));if(alt>16)sz=Math.max(sz,clamp(alt*.85+32,48,96))}
  if(!(JUMP.active&&PL.car)){const q=camera.quaternion,vx=-2*(q.x*q.z+q.w*q.y),vz=-(1-2*(q.x*q.x+q.y*q.y)),hl=Math.hypot(vx,vz);
   if(hl>1e-4){const ang=Math.atan2(vx,vz), cur=SHADOW_CACHE._biasSec*.39269908169872414, df=Math.atan2(Math.sin(ang-cur),Math.cos(ang-cur));
    if(Math.abs(df)>.24)SHADOW_CACHE._biasSec=Math.round(ang/.39269908169872414);
    const qa=SHADOW_CACHE._biasSec*.39269908169872414;fx+=Math.sin(qa)*bias;fz+=Math.cos(qa)*bias}}
 }
 if(Math.abs(sz-shadowSize)>Math.max(1,shadowSize*.05)){
  shadowSize=sz;const sc=sun.shadow.camera;sc.left=-sz;sc.right=sz;sc.top=sz;sc.bottom=-sz;sc.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;
 }
 const so=city.sunOff||st.sunOff,texel=Math.max(.001,shadowSize*2/Math.max(1,sun.shadow.mapSize.x)),qStep=Math.max(1,Math.round(1.85/texel))*texel,sh=Math.hypot(so[0],so[2]);
 if(sh>1e-4){const hx=so[0]/sh,hz=so[2]/sh,rx=hz,rz=-hx,zy=Math.max(.15,so[1]/Math.hypot(sh,so[1]));
  const u=Math.round((fx*rx+fz*rz)/qStep)*qStep,vh=Math.round((fx*hx+fz*hz)*zy/qStep)*(qStep/zy);fx=u*rx+vh*hx;fz=u*rz+vh*hz}
 else{fx=Math.round(fx/qStep)*qStep;fz=Math.round(fz/qStep)*qStep}
 sun.position.set(fx+so[0],so[1],fz+so[2]);sun.target.position.set(fx,0,fz);
}

/* ================= INPUT ================= */
const keys={};let menuOpen=true,running=false,played=false;
const VIEW={tp:true,orbit:false,tpz:1}; // v78: câmera padrão = 3ª pessoa PERTO (a pé e de carro)
const ORB={yaw:.6,d:34,drag:false};
function viewName(){return camMode==='top'?(VIEW.orbit?'PERSPECTIVA GIRATÓRIA':'VISTA DE CIMA'):(VIEW.tp?'3ª PESSOA':'1ª PESSOA')}
function cycleView(){if(camMode==='fps'&&VIEW.tp&&(VIEW.tpz||0)<2){VIEW.tpz=(VIEW.tpz||0)+1;toast(VIEW.tpz===1?'CÂMERA · 3ª PESSOA PERTO':'CÂMERA · 3ª PESSOA BEM PERTO');return}if(camMode==='fps'&&VIEW.tp&&!PL.heli){VIEW.tp=false;VIEW.tpz=0;LOOK.yaw=LOOK.pitch=0}else if(camMode==='fps'){VIEW.orbit=true;S.view='top';setView('top',true)}else if(VIEW.orbit){VIEW.orbit=false}else{VIEW.tp=true;S.view='fps';setView('fps',true)}
 if(camMode==='top'){
  // AVISO CAMERA: sempre que se alterna para isometrico ou top-down.
  // Nao modifica mira, materiais, sprites nem o shader de oclusao.
  toast(viewName()+'<br><small>Alguns recursos podem ser limitados ou inacessíveis nessa câmera</small>','camwarn',15);
 }else toast(viewName())}
function setView(v,quiet){camMode=v;if(v==='fps'){if(PL.car){const c=PL.car;chasePos.set(c.x-Math.cos(c.a)*9,4,c.z-Math.sin(c.a)*9)}else{PL.yaw=Math.atan2(-PL.face[0],-PL.face[1]);PL.pitch=0;chasePos.set(PL.x+Math.sin(PL.yaw)*4.4,PL.gy+2.9,PL.z+Math.cos(PL.yaw)*4.4)}
  if(!quiet)toast('VISÃO 3D<br><small style="font-size:11px;color:#fff">clique para usar o mouse · V alterna 1ª / 3ª pessoa</small>')}
 else{if(document.pointerLockElement)document.exitPointerLock();
  if(!quiet&&played)toast(viewName()+'<br><small>Alguns recursos podem ser limitados ou inacessíveis nessa câmera</small>','camwarn',15)}}
let fTimer=0;
let recordsOpen=false,recordsTab=0;
function recordsSwitch(tab){recordsTab=(tab===1||tab===2)?tab:0;for(let i=0;i<3;i++){$('#recordsPanel'+i).hidden=i!==recordsTab;const b=$('#recordsTab'+i);b.classList.toggle('on',i===recordsTab);b.setAttribute('aria-selected',String(i===recordsTab))}recordsRefresh()}
function recordsRefresh(){if(!recordsOpen)return;
 $('#recordsVinyl').textContent=VINYL.got.size+' / '+VINYL.N+(VINYL.bag.size?(S.lang==='en'?' · '+VINYL.bag.size+' to sell':' · '+VINYL.bag.size+' para vender'):'');
 $('#recordsTommy').textContent=TOMMY.got.size+' / 5';{const st=$('#recordsStats');if(st)st.innerHTML=statsHtml()}
 // v78: duas listas — HISTÓRIA (missão) e ALEATÓRIOS (pessoas da cidade).
 const fill=(id,type,empty)=>{const list=$(id);list.replaceChildren();const L=RECLOG.items.filter(r=>r.type===type);
  if(!L.length){const li=document.createElement('li');li.textContent=translatePlain(empty);list.appendChild(li);return}
  for(const r of L){const li=document.createElement('li'),head=document.createElement('div'),kind=document.createElement('span'),line=document.createElement('div');
   head.className='record-who';head.textContent=r.who;kind.className='record-kind';kind.textContent=r.time;head.appendChild(kind);
   line.className='record-line';line.textContent=r.text;li.append(head,line);list.appendChild(li)}
  list.scrollTop=list.scrollHeight};
 fill('#recordsStoryList','mission','Nenhum diálogo da história registrado ainda.');
 fill('#recordsDialogList','npc','Nenhum diálogo registrado ainda.');
}
function openRecords(){if(!played)return;recordsOpen=true;$('#records').hidden=false;recordsSwitch(0);for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();$('#recordsClose').focus()}
function closeRecords(){recordsOpen=false;$('#records').hidden=true;$('#regBtnMenu').focus()}
$('#recordsClose').addEventListener('click',closeRecords);
$('#records').addEventListener('click',e=>{if(e.target.id==='records')closeRecords()});
for(let i=0;i<3;i++)$('#recordsTab'+i).addEventListener('click',()=>recordsSwitch(i));
let cmdsOpen=false,cmdsReturnCfg=false;
function openCmds(){if(cfgOpen){cmdsReturnCfg=true;closeCfg()}else cmdsReturnCfg=false;cmdsOpen=true;$('#cmds').hidden=false;for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();$('#cmdsClose').focus()}
function closeCmds(){cmdsOpen=false;$('#cmds').hidden=true;if(cmdsReturnCfg){cmdsReturnCfg=false;openCfg();selectCfgCategory('6',false);$('#cfgCmdBtn').focus()}}
addEventListener('keydown',e=>{
 if(e.code==='F10'&&e.ctrlKey&&e.shiftKey){e.preventDefault();e.stopPropagation();if(!e.repeat&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))missionSkipActive();return}
 if(e.code==='F8'&&e.ctrlKey&&e.shiftKey){e.preventDefault();e.stopPropagation();if(!e.repeat)devTour();return}
 if(e.code==='F9'&&e.ctrlKey&&e.shiftKey){e.preventDefault();e.stopPropagation();if(!e.repeat&&!/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName||''))missionDebugSkip();return}
 if(e.target&&e.target.id==='chin')return;
 if(SKATE.ui){if(e.code==='Escape'){e.preventDefault();skUiClose()}else if(e.code==='Enter'){e.preventDefault();skUiBuy()}return}
 if(STORYFAIL.active){e.preventDefault();return}
 if(STORYEND.active||STORYINTRO.active){
  if(e.code==='Escape'){e.preventDefault();if(!e.repeat){if(menuOpen&&played)closeMenu();else if(played)openMenu()}return}
  if(!menuOpen){if(!e.repeat&&['Enter','NumpadEnter','Space','KeyF'].includes(e.code))storySkipPart();e.preventDefault();return}
 }
 if(e.code==='F3'){e.preventDefault();monSet(!MON.on);return}
 if(e.code==='F4'){e.preventDefault();if(!e.repeat)dbgWfCycle();return}
 if(recordsOpen){if(e.code==='Escape'){e.preventDefault();closeRecords()}return}
 if(cmdsOpen){if(e.code==='Escape'||e.key==='?'||e.code==='F1'){e.preventDefault();closeCmds()}return}
 if(cfgOpen){if(e.code==='Escape'){e.preventDefault();closeCfg()}return}
 if(TABLE_GAME.open){if(e.code==='Escape'){e.preventDefault();tableGameClose()}else if(e.code==='Enter'&&document.activeElement===document.body){e.preventDefault();$('#tgDeal').click()}return}
 if(NEWS.open){if(['Escape','KeyE','KeyF','Enter','Space','Backspace'].includes(e.code)&&!e.repeat){e.preventDefault();newsClose()}return}
 if(SLOT.open){if(e.code==='Escape'){e.preventDefault();slotClose()}else if((e.code==='KeyE'||e.code==='Space')&&!e.repeat){e.preventDefault();slotPull()}return}
 if(MP.open){if(e.code==='Escape'||e.code==='Backspace'){e.preventDefault();modePickClose()}else if(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();const L=['#mpStory','#mpFree','#mpOnline'],i=Math.max(0,L.findIndex(id=>document.activeElement===$(id))),d=(e.code==='ArrowLeft'||e.code==='KeyA')?-1:1;$(L[(i+d+L.length)%L.length]).focus()}return}
 if(DEAL.open){dealKey(e);return}
 if(WARD.open){if(e.code==='Escape'){e.preventDefault();closeWard(false)}return}
 if(TECH.open){if(e.code==='Escape'){e.preventDefault();closeTech()}return}
 if(DLG.on){e.preventDefault();if(!e.repeat)dlgKey(e);return}
 if(PHONE.open&&!menuOpen&&!NAV.open){e.preventDefault();if(!e.repeat)phoneKey(e);return}
 if(e.code==='KeyP'&&played&&!menuOpen&&!NAV.open&&!e.repeat){e.preventDefault();phoneToggle();return}
 if(TUNE.open){if(e.code==='Escape'||e.code==='Enter'){e.preventDefault();closeTune()}return}
 if(!menuOpen&&(e.key==='?'||e.code==='F1')){e.preventDefault();openCmds();return}
 if(NAV.open){if(e.code==='KeyL'){e.preventDefault();if(!e.repeat)mapLegendToggle();return}if(e.code==='KeyC'&&mapIntAvail()){e.preventDefault();if(!e.repeat)mapIntToggle();return}if(!e.repeat&&cheatKey(e)){e.preventDefault();return}if(e.code==='Escape'||e.code==='Tab'||e.code==='KeyM')closeMap();e.preventDefault();return}
 if(AMMO.uiOpen){if(e.code==='Escape')ammoClose();e.preventDefault();return}
 if(menuOpen){if(e.code==='Escape'&&played)closeMenu();return}
 if(TVM.on){if(e.code==='KeyF'&&!e.repeat)tvOff();else if(['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code)&&!e.repeat)tvChangeChannel(e.code==='KeyA'||e.code==='ArrowLeft'?-1:1);e.preventDefault();return}
 if(e.code==='Backquote'&&played&&!e.repeat){e.preventDefault();cheatConsole();return}
 if(!e.repeat&&cheatKey(e)){e.preventDefault();return}
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 keys[e.code]=true;
 if(e.repeat)return;
 if(e.code==='KeyF'){if(!taxiHoldStart('kb')){enterExit();radioKick()}}
 if(e.code==='KeyG'){if(!(ONLINE.on&&netRideTry()))taxiCall()}
 if(e.code==='Space')plJump();
 if(!PL.heli){if(e.code==='Digit1')gunHolster();if(e.code==='Digit2')gunTry('pistol');if(e.code==='Digit3')gunTry('magnum');if(e.code==='Digit4')gunTry('smg');if(e.code==='Digit5')gunTry('rpg');if(e.code==='Digit6')gunTry('grenade');if(e.code==='Digit7')gunTry('remote');if(e.code==='Digit8'&&CTOS.installed&&!PHONE.open){phoneToggle();if(PHONE.open){PHONE.scr='ctos';PHONE.zone='scr';PHONE.si=0;phoneDraw()}}if(e.code==='Digit9')gunTry('flame')}
 if(e.code==='KeyV')cycleView();
 if(e.code==='Equal'||e.code==='NumpadAdd')ORB.d=Math.max(16,ORB.d-4);if(e.code==='Minus'||e.code==='NumpadSubtract')ORB.d=Math.min(70,ORB.d+4);
 if(e.code==='Escape')openMenu();
 if(WHL.open==='wpn'&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){if(wheelPage(e.code==='ArrowLeft'||e.code==='KeyA'?-1:1)){e.preventDefault();return}}
 if(e.code==='Tab'){e.preventDefault();wheelOpen('wpn','kb')}
 if(e.code==='KeyX'&&PL.car&&CTX.car&&!menuOpen){ctxAct(3)}
 if(e.code==='KeyE'&&!PL.car&&medLoad()){}else if(e.code==='KeyE'){if(PL.car&&!CTX.car){hornDown('kb')}else ctxAct(1)}
 if(e.code==='KeyH')HEAD.mode=headOn()?'off':'on';
 if(e.code==='CapsLock'&&played){specSet(!SPEC.on);return}
 if(e.code==='AltLeft'||e.code==='AltRight'){e.preventDefault();charOpen('kb');return}
 if(CHAR.open&&CHAR.src==='kb'&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){CHAR.sel=(e.code==='ArrowLeft'||e.code==='KeyA')?0:1;charSelPaint();return}
 if(e.code==='KeyR'&&!PL.car&&!PL.heli)playerPunch(false);
 if(e.code==='KeyQ'&&radioVeh()){if(RADIO.blocked)radioKick();wheelOpen('radio','kb')}
 if(e.code==='Period')radioSkip(1);if(e.code==='Comma')radioSkip(-1);
 if(e.code==='KeyM'){e.preventDefault();openMap()}
 if(e.code==='KeyT')misStart();
 if(e.code==='KeyN'){S.sound=!S.sound;$('#optSound').checked=!S.sound;applyVolumes();saveCfg();toast(S.sound?'SOM LIGADO':'SOM DESLIGADO')}
});
addEventListener('keyup',e=>{keys[e.code]=false;if((e.code==='AltLeft'||e.code==='AltRight')&&CHAR.src==='kb'){e.preventDefault();charClose(true)}if(e.code==='KeyE')hornUp('kb');if(e.code==='Tab'&&WHL.open==='wpn'&&WHL.src==='kb')wheelClose(true);if(e.code==='KeyQ'&&WHL.open==='radio'&&WHL.src==='kb')wheelClose(true)});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;if(HORN.held){HORN.held=false;hornVoiceOff()}TOUCH.x=TOUCH.y=0;TOUCH.joy=null;TOUCH.isoDriving=false;TOUCH.gas=TOUCH.brake=false;wheelClose(false)});
let dragging=false;
canvas.addEventListener('mousemove',e=>{mouseNDC.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1)});
canvas.addEventListener('mousedown',e=>{initAudio();if(WHL.open)return;if(!menuOpen&&CTX.car&&PL.car&&(e.button===0||e.button===2||e.button===1)){e.preventDefault();ctxAct(e.button===0?1:e.button===2?2:3);return}if(e.button===1){e.preventDefault();if(!menuOpen&&played&&!NAV.open)phoneToggle();return} /* v3 r17: clique da rodinha = celular (fora da bomba) */if(!menuOpen&&!PL.heli&&e.button===0&&GUN.has&&(camMode==='top'||document.pointerLockElement===canvas)){GUN.firing=true;playerShoot();return}if(!menuOpen&&!PL.heli&&e.button===0&&!GUN.has&&!PL.car&&played&&(camMode==='top'||document.pointerLockElement===canvas)){playerPunch(true);return}if(camMode==='fps'&&!menuOpen){dragging=true;try{const p=canvas.requestPointerLock&&canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}});
addEventListener('mouseup',()=>{dragging=false;GUN.firing=false;ORB.drag=false});
canvas.addEventListener('mousedown',e=>{if(camMode==='top'&&VIEW.orbit&&(e.button===2||e.button===1)){ORB.drag=true;e.preventDefault()}});
canvas.addEventListener('contextmenu',e=>{if((camMode==='top'&&VIEW.orbit)||CTX.car||played)e.preventDefault()});
addEventListener('mousemove',e=>{if(ORB.drag&&!menuOpen)ORB.yaw-=e.movementX*.008});
addEventListener('mousemove',e=>{if(WHL.open){wheelMove(e.movementX,e.movementY);return}if(PL.taxi&&!menuOpen&&(document.pointerLockElement===canvas||dragging||e.buttons)){TAXI.cy=(TAXI.cy||0)+e.movementX*.004;TAXI.cpit=clamp((TAXI.cpit||0)+e.movementY*.003,-.35,1.15);return}if(camMode!=='fps'||menuOpen)return;if(PL.car||ONLINE.ride){if(document.pointerLockElement===canvas||dragging){LOOK.yaw+=e.movementX*.003;LOOK.pitch=clamp(LOOK.pitch+e.movementY*.003,-.45,1.1);LOOK.t=0}return}if(document.pointerLockElement===canvas||dragging){PL.yaw-=e.movementX*.0024;PL.pitch=clamp(PL.pitch-e.movementY*.0024,-1.35,1.35)}});

