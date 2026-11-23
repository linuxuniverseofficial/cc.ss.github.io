'use strict';
/* Coastal Chaos · js/36-municao-cadeia.js — Micro-ilha/DeLorean, loja de munição, balões de fala, diálogo, câmera pro céu, delegacia e cadeia.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= MICRO-ILHA: pedágio e DeLorean =================
   Ponte única com guarita e duas cancelas: com $10 ou mais a cancela abre e cobra; sem dinheiro ela não abre,
   e furar a cancela dá ★. Na ilha, uma casinha com garagem coberta guarda o DeLorean; roubado, outro aparece 3 h de jogo depois. */
const ISLE={car:null,goneAt:null,t:0,toll:null};
function isleSpawnCar(){const s=city.delSlot;if(!s)return;const v=makeVehicle('super',s.x,s.z,s.a,'#92969d');v.hand=true;v.sleep=false;v.thr=0;v.special=true;v.hasNitro=true;v.hasGlow=false;v.isleCar=true;v.keep=true;ISLE.car=v;ISLE.goneAt=null}
function islePlace(){ISLE.car=null;ISLE.goneAt=null;if(ISLE.toll&&ISLE.toll.man){scene.remove(ISLE.toll.man.sp);scene.remove(ISLE.toll.man.sh)}if(ISLE.toll&&ISLE.toll.g){scene.remove(ISLE.toll.g);disposeGroup(ISLE.toll.g)}ISLE.toll=null;if(!city.isle)return;
 const q=city.isle.bridge,hx=q[0]==='h',bx=hx?(q[1]+.5)*P:q[1]*P,bz=hx?q[2]*P:(q[2]+.5)*P,ux=hx?1:0,uz=hx?0:1,px=-uz,pz=ux,y=Math.max(groundY(bx,bz),.26),g=new THREE.Group(),C=c=>new THREE.MeshLambertMaterial({color:c});
 const box=(w,hh,d,col,x,yy,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),C(col));m.position.set(x,yy,z);g.add(m);return m};
 // guarita no canteiro central: base, cabine com vidro, telhado e placa
 const r=Math.atan2(uz,ux);const cab=new THREE.Group();cab.position.set(bx,y,bz);cab.rotation.y=-r;g.add(cab);const B=(w,hh,d,col,x,yy,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),C(col));m.position.set(x,yy,z);cab.add(m);return m};
 B(2.2,.25,1.5,'#9a9aa2',0,.12,0);B(1.6,1.0,1.1,'#e8e2d0',0,.75,0);for(const sx of [-.77,.77])for(const sz of [-.52,.52])B(.08,1.1,.08,'#e8e2d0',sx,1.8,sz);{const gl=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.05,1.0),new THREE.MeshBasicMaterial({color:0x9ad0f0,transparent:true,opacity:.28,depthWrite:false}));gl.position.y=1.8;cab.add(gl)}B(2.4,.18,1.7,'#c82020',0,2.45,0);
 {const c=cv(128,40),gg=c.getContext('2d');gg.fillStyle='#f2c21a';gg.fillRect(0,0,128,40);gg.fillStyle='#111';gg.font='700 22px Arial';gg.textAlign='center';gg.textBaseline='middle';gg.fillText(translatePlain('PEDÁGIO $10'),64,21,118);const t=new THREE.CanvasTexture(c),sm=unlitSignMat(new THREE.MeshBasicMaterial({map:t}));for(const s of [1,-1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.55),sm);m.position.set(s*1.21,2.8,0);m.rotation.y=s*Math.PI/2;cab.add(m)}B(2.2,.6,.06,'#f2c21a',0,2.8,0)}
 const plateScreens=[];
 for(const side of [-1,1]){
  const canvas=cv(256,64),ctx=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.45,.38),S.style==='inverted'?new THREE.MeshLambertMaterial({color:0x101014}):new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  mesh.position.set(0,.92,side*.565);mesh.rotation.y=side<0?Math.PI:0;cab.add(mesh);
  const screen={side,canvas,ctx,tex,plate:null};plateScreens.push(screen);tollPlateWrite(screen,'-------');
 }
 // cancelas (uma por sentido), braço listrado com pivô junto da guarita
 const arms=[];for(const s of [1,-1]){const pv=new THREE.Group();pv.position.set(s*1.4,1.05,s*.2);cab.add(pv);const post=new THREE.Mesh(new THREE.BoxGeometry(.25,1.1,.25),C('#3a3a40'));post.position.y=-.5;pv.add(post);
  const arm=new THREE.Group();pv.add(arm);for(let k=0;k<6;k++){const m=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,.9),C(k%2?'#f4f4f0':'#d62828'));m.position.set(0,0,s*(.45+k*.9));arm.add(m)}arms.push({pv:arm,s,open:0,want:0,broken:false})}
 scene.add(g);addCol(bx-Math.abs(px)*.8-Math.abs(ux)*1.1,bz-Math.abs(pz)*.8-Math.abs(uz)*1.1,bx+Math.abs(px)*.8+Math.abs(ux)*1.1,bz+Math.abs(pz)*.8+Math.abs(uz)*1.1,'rock');
 ISLE.toll={g,x:bx,z:bz,ux,uz,px,pz,arms,plateScreens,paid:0,inside:null};
 {const ch=makeCharacter({...CLERK_PAL,cap:'#f2c21a',capDark:'#b88a10',shirt:'#f2c21a',stripe:'#1b1b1b'});ISLE.toll.man={...ch,x:bx,z:bz,gy:y,mx:px,mz:pz}}
 isleSpawnCar()}
// Os braços são identificados pela FAIXA LATERAL que bloqueiam (eixo da guarita),
 // não pela cabeceira longitudinal de onde o veículo está chegando.
 // Na via de mão dupla a faixa de quem vem de -eixo está no lado +perpendicular.
function tollPlateWrite(screen,plate){
 if(screen.plate===plate)return;screen.plate=plate;const g=screen.ctx;
 g.fillStyle='#050505';g.fillRect(0,0,256,64);g.strokeStyle='#806900';g.lineWidth=3;g.strokeRect(2,2,252,60);
 g.fillStyle='#ffd21a';g.font='bold 43px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(plate,128,34,240);screen.tex.needsUpdate=true;
}
const TOLL_CL={1:{d:0,v:null},[-1]:{d:0,v:null}};
function tollPlateScan(T){
 const closest=TOLL_CL;closest[1].v=null;closest[-1].v=null;
 // Read all land vehicles, including player, police and service traffic.
 for(const v of vehicles){if(!v.alive||v.t.boat||v.t.hover)continue;
  const dx=v.x-T.x,dz=v.z-T.z,a=dx*T.ux+dz*T.uz,l=dx*T.px+dz*T.pz;
  if(Math.abs(a)>12||Math.abs(l)>7)continue;const side=isleGateLaneSide(l,a),d=Math.abs(a);
  const q=closest[side];if(q&&(!q.v||d<q.d)){q.d=d;q.v=v}
 }
 for(const screen of T.plateScreens||[]){const hit=closest[screen.side];if(hit&&hit.v)tollPlateWrite(screen,blitzPlate(hit.v))}
}
function isleGateLaneSide(lateral,along){return Math.abs(lateral)>.55?Math.sign(lateral):(-Math.sign(along)||1)}
const ISLE_SIDES={1:false,[-1]:false},ISLE_SNAP=[];
function isleTick(dt){if(!city.isle||!played)return;const T=ISLE.toll,pc=PL.car||PL;
 if(T&&T.man){const m=T.man,dx=PL.x-m.x,dz=PL.z-m.z,near=S.style!=='inverted'&&Math.hypot(dx,dz)<160&&!PL.inside;m.sp.visible=m.sh.visible=near;if(near){setFrame(m.tex,pickDir(dx,dz,m.x,m.z),0);placeSprite(m)}}
 if(T){if(S.style!=='inverted')tollPlateScan(T);const rx=pc.x-T.x,rz=pc.z-T.z,al=rx*T.ux+rz*T.uz,latSigned=rx*T.px+rz*T.pz,lat=Math.abs(latSigned),playerLaneSide=isleGateLaneSide(latSigned,al);
  // Pedágio vale apenas para tráfego terrestre na pista: barcos/jet skis passam por baixo da ponte,
  // e pedestres/hovercrafts não devem pagar nem acionar a perseguição pela cancela.
  const roadVehicle=!!(PL.car&&!PL.car.t.boat&&!PL.car.t.hover),near=roadVehicle&&Math.abs(al)<11&&lat<9;
  // Cada faixa controla somente sua própria cancela, usando o lado perpendicular
  // real ao eixo da ponte (os braços apontam para +/- perp), nunca a margem longitudinal.
  const npcSides=ISLE_SIDES;npcSides[1]=false;npcSides[-1]=false;let n=0;const _vs=ISLE_SNAP;_vs.length=0;for(let i=0;i<vehicles.length;i++)_vs.push(vehicles[i]);
  for(const v of _vs){
   if(v===PL.car||v.police||v.chase||v.svc||v.taxiAI||v.t.boat)continue;
   const vx=v.x-T.x,vz=v.z-T.z,va=vx*T.ux+vz*T.uz,vlat=vx*T.px+vz*T.pz,vl=Math.abs(vlat);
   if(Math.abs(va)>P*.5||vl>9){if(Math.abs(va)>30){v.tollDone=false;v.tollSide=0;v.tollApproach=0}continue}
   if(++n>2&&Math.hypot(v.x-pc.x,v.z-pc.z)>30){removeVehicle(v);continue}
   const sp=v.mode==='rail'?1:Math.hypot(v.vx||0,v.vz||0);
   const dirIn=v.mode==='rail'||((v.vx||0)*T.ux+(v.vz||0)*T.uz)*-Math.sign(va)>0;
   if(!v.tollDone&&Math.abs(va)<8&&Math.abs(va)>3&&dirIn){v.tollDone=true;v.tollSide=isleGateLaneSide(vlat,va);v.tollApproach=Math.sign(va);v.tollHold=2}
   if(v.tollDone&&Math.abs(va)<12&&Math.sign(va)===v.tollApproach&&vl<8)npcSides[v.tollSide]=true;
  }
  if(S.style!=='inverted'&&near&&!T.paid&&!PL.dead){if((PL.money||0)>=10){money(-10,'PEDÁGIO · −$10');T.paid=1;T.paidSide=playerLaneSide;clang(.2);if(T.man)say(T.man,['Obrigado! Boa viagem.','Pode passar!','Tenha um bom dia!'],2.4)}else if(!T.warned){if(T.man)say(T.man,'São 10 dólares, amigo.',2.6);T.warned=true}}
  if(!roadVehicle||(!near&&Math.abs(al)>16)){T.paid=0;T.paidSide=0;T.warned=false}
  for(const a of T.arms){
   // Keep each NPC lane open for two extra seconds after its last passage signal.
   a.npcCloseDelay=npcSides[a.s]?2:Math.max(0,(a.npcCloseDelay||0)-dt);
   const open=S.style==='inverted'||(T.paid&&T.paidSide===a.s)||npcSides[a.s]||a.npcCloseDelay>0;a.want=open?1:0;
   if(a.broken)continue;
   // Mesma curva anterior, agora três vezes mais lenta.
   a.open+=(a.want-a.open)*Math.min(1,dt*4/3);
   a.pv.rotation.x=-a.s*a.open*1.4;
   // Somente a cancela do sentido do jogador pode ser danificada.
   if(!open&&a.open<.3&&roadVehicle&&playerLaneSide===a.s&&Math.abs(al-a.s*1.4)<1.2&&lat<6&&Math.abs(PL.car.fwd)>2){a.broken=true;a.pv.rotation.x=-a.s*1.5;a.pv.rotation.z=.6;clang(.3);if(!POL.wanted){startWanted(true);toast('<span style="color:#ff4a4a">FUROU O PEDÁGIO!</span>')}else if((POL.level||1)<3){toast('<span style="color:#ff4a4a">FUROU O PEDÁGIO!</span>');wantedUp((POL.level||1)+1)}}} // v78: já procurado → +1 estrela (até 3)
 }
 // DeLorean da ilha: depois de levado/destruído, outro aparece 3 h de jogo depois
 if((ISLE.t-=dt)>0)return;ISLE.t=2;const s=city.delSlot;if(!s)return;const c=ISLE.car,now=gameMin();if(c&&PL.car===c)c.keep=false;
 const gone=!c||!vehicles.includes(c)||!c.alive||Math.hypot(c.x-s.x,c.z-s.z)>12;if(!gone){ISLE.goneAt=null;return}
 if(ISLE.goneAt==null){ISLE.goneAt=now;return}
 if(now-ISLE.goneAt>=180&&Math.hypot(pc.x-s.x,pc.z-s.z)>60&&!carsNear(s.x,s.z,3).length)isleSpawnCar()}
/* ============================================================
   v260 — AMOnições · loja + progressão de armamento.
   NÃO ALTERAR AQUI (sprites): não tocar em SpriteMaterial, atlas,
   drawRange, geometria compartilhada, iluminação ou descartes da v258.
   Toda a vitrine usa malha estática de cenário, sem sprites novos.
   ============================================================ */
const AMMO={pos:null,grp:null,IN:null,arrow:null,inArrow:null,clerk:null,lock:0,uiOpen:false,panel:null,up:{},sel:'pistol'};
const AMMO_PRICES={pistol:450,smg:1700,magnum:2300,rpg:12500,grenade:1000,remote:2300,jammer:3800,flame:2400};
const AMMO_BATCH={pistol:50,smg:50,magnum:50,rpg:3,grenade:3,remote:3,jammer:1,flame:50};
const AMMO_CATS={pistol:'Pistolas',smg:'Automáticas',magnum:'Pistolas',rpg:'Pesadas',grenade:'Explosivos',remote:'Explosivos',jammer:'Eletrônicos',flame:'Pesadas'};
const AMMO_UPGRADABLE=new Set(['pistol','smg','magnum']);
function ammoUpgrade(w,k){const x=AMMO.up[w];return x?Math.min(3,Math.max(0,x[k]|0)):0}
function ammoUpgradeCost(w,k){const n=ammoUpgrade(w,k),factor=k==='damage'?1:k==='rate'?1.15:1.05;
 return Math.round((300+AMMO_PRICES[w]*.30)*(1+n*.9)*factor/10)*10}
function ammoMsg(br,en){return S.lang==='en'?en:br}
function ammoBalance(){return '$'+Math.max(0,PL.money||0).toLocaleString(S.lang==='en'?'en-US':'pt-BR')}
function ammoText(w){if(w==='jammer')return 'APP ctOS';return S.lang==='en'?({pistol:'PISTOL',smg:'SMG',magnum:'COLT MAGNUM',rpg:'ROCKET LAUNCHER',grenade:'GRENADE',remote:'REMOTE CHARGE',jammer:'JAMMER',flame:'FLAMETHROWER'}[w]):WPN[w].name}
function ammoResetView(){if(AMMO.guy&&peds.includes(AMMO.guy))removePed(AMMO.guy);AMMO.guy=null;if(AMMO.panel)AMMO.panel.hidden=true;AMMO.uiOpen=false;AMMO.lock=0;
 if(AMMO.clerk&&peds.includes(AMMO.clerk))removePed(AMMO.clerk);AMMO.clerk=null;
 for(const k of ['arrow','inArrow'])if(AMMO[k]){scene.remove(AMMO[k]);disposeGroup(AMMO[k]);AMMO[k]=null}
 if(AMMO.grp){scene.remove(AMMO.grp);disposeGroup(AMMO.grp);AMMO.grp=null}if(AMMO.extSign){scene.remove(AMMO.extSign);disposeGroup(AMMO.extSign);AMMO.extSign=null}AMMO.IN=null;AMMO.pos=null}
AMMO.reset=function(){ammoResetView();AMMO.up={};AMMO.sel='pistol'};
function ammoPlace(){if(city.haze)return;
 if(city.tireRi!=null&&!city.tireNone){if(city.tireOffice){AMMO.pos={...city.tireOffice,tire:true};return}
  const a=city.rects[city.tireRi];if(a){const x=(a[0]+a[2])/2,z=(a[1]+a[3])/2;AMMO.pos={x,z,nrm:[0,1],out:{x,z},tire:true,pending:true};return}}
 ammoPlaceBld()}
function ammoTireReady(){const p=AMMO.pos;if(!city.tireOffice||!p||!p.pending)return;AMMO.pos={...city.tireOffice,tire:true};AMMO.extBuilt=true}
function ammoTireFallback(){city.tireNone=true;if(AMMO.pos&&AMMO.pos.pending){AMMO.pos=null;ammoPlaceBld();AMMO.extBuilt=false}}
function ammoPlaceBld(){
 const r=mulberry32((S.seed^0x9f61ca73)>>>0),options=[];
 for(const [ri,arr] of city.doors||[]){const f=city.info[ri];if(!f||f.kind!=='bld'||f.safe||f.para||f.airRestricted)continue;
  for(const d of arr){if(d.house)continue;const n=d.f==='n'?[0,-1]:d.f==='s'?[0,1]:d.f==='e'?[1,0]:[-1,0];
   const x=Number.isFinite(d.ox)?d.ox:d.x+n[0]*1.6,z=Number.isFinite(d.oz)?d.oz:d.z+n[1]*1.6;
   if(inWater(x,z)||!Number.isFinite(x)||!Number.isFinite(z)||groundY(x,z)<-.3)continue;
   if(HEIST.pawn&&Math.hypot(HEIST.pawn.x-x,HEIST.pawn.z-z)<65)continue;
   options.push({x,z,nrm:n,out:{x,z},rank:r(),ri});}}
 options.sort((a,b)=>a.rank-b.rank);
 const chosen=options[0];if(chosen){AMMO.pos=chosen;return}
 // Fallback: passagem urbana válida; não interrompe a geração em seeds extremas.
 const sites=(city.catSpots||[]).filter(q=>!q.residential);
 for(const q of sites){const a=q.r,x=(a[0]+a[2])/2,z=(a[1]+a[3])/2;if(!inWater(x,z)&&groundY(x,z)>-.2){AMMO.pos={x,z,nrm:[0,1],out:{x,z},rank:0};break}}
 if(!AMMO.pos){const l=(city.lms||[]).find(l=>l.name==='mkt'||l.name==='mall');if(l)AMMO.pos={x:l.x,z:l.z+14,nrm:[0,1],out:{x:l.x,z:l.z+14}}}
}
function ammoSign(g,x,y,z,txt,width,rot){const can=cv(512,96),c=can.getContext('2d');
 c.fillStyle='#17191c';c.fillRect(0,0,512,96);c.strokeStyle='#e6bd56';c.lineWidth=9;c.strokeRect(4,4,504,88);
 c.font='900 54px Arial, sans-serif';c.fillStyle='#f6d379';c.textBaseline='middle';c.textAlign='center';c.fillText(txt,256,52,498);
 const tex=new THREE.CanvasTexture(can);const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*96/512),g===AMMO.extSign&&S.style==='inverted'?new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide}):new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
 m.position.set(x,y,z);m.rotation.y=rot||0;g.add(m);return m}
// v267: modelos exatamente iguais aos colecionaveis de rua, mas sem registro em
// pickups, sem halo, sem colisao ou interacao. A compra continua SOMENTE no balcao.
function ammoShowcaseWeapon(kind){const g=new THREE.Group();
 if(kind==='flame'){
  const dark=new THREE.MeshStandardMaterial({color:0x24252e}),tank=new THREE.MeshStandardMaterial({color:0xa54025});
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,1.22,8),dark);barrel.rotation.z=Math.PI/2;barrel.position.x=.23;
  const fuel=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.68,10),tank);fuel.rotation.z=Math.PI/2;fuel.position.set(-.22,-.21,0);
  g.add(barrel,fuel);return g;
 }
 if(kind==='grenade'||kind==='remote'){const gm=kind==='grenade'?grenadeMesh():remoteMesh();while(gm.children.length)g.add(gm.children[0])}
 else if(kind==='jammer'){const body=new THREE.MeshStandardMaterial({color:0x303b31,roughness:.72}),screen=new THREE.MeshStandardMaterial({color:0x78b69c,emissive:0x0c3530,emissiveIntensity:.32});g.add(new THREE.Mesh(new THREE.BoxGeometry(.43,.65,.15),body));const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.24,.16),screen);m.position.y=.1;g.add(m);const ant=new THREE.Mesh(new THREE.BoxGeometry(.035,.35,.035),body);ant.position.set(.15,.46,0);g.add(ant)}
 else if(kind==='smg'){const gm=new THREE.MeshStandardMaterial({color:0x26262a,metalness:.6,roughness:.35});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(1.25,.26,.18),gm);b1.position.x=.1;const b2=new THREE.Mesh(new THREE.BoxGeometry(.16,.55,.14),gm);b2.position.set(.05,-.36,0);const b3=new THREE.Mesh(new THREE.BoxGeometry(.18,.4,.15),gm);b3.position.set(-.38,-.25,0);b3.rotation.z=-.3;const b4=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.08),gm);b4.position.set(.85,.03,0);g.add(b1,b2,b3,b4)}
 else if(kind==='rpg'){const gm=new THREE.MeshStandardMaterial({color:0x4a5a2a,roughness:.6}),tm=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.5}),wm=new THREE.MeshStandardMaterial({color:0xb8402a,roughness:.5});
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,1.7,10),gm);tb.rotation.z=Math.PI/2;const w=new THREE.Mesh(new THREE.ConeGeometry(.2,.4,10),wm);w.rotation.z=-Math.PI/2;w.position.x=1.05;const gr=new THREE.Mesh(new THREE.BoxGeometry(.14,.4,.12),tm);gr.position.set(-.1,-.3,0);g.add(tb,w,gr)}
 else if(kind==='magnum'){const sm=new THREE.MeshStandardMaterial({color:0xc8ccd4,metalness:.85,roughness:.25}),wm=new THREE.MeshStandardMaterial({color:0x5a3a22,roughness:.6});
  const br=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.95,12),sm);br.rotation.z=Math.PI/2;br.position.set(.32,.05,0);const dr=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.26,12),sm);dr.rotation.z=Math.PI/2;dr.position.set(-.18,0,0);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.12),sm);fr.position.set(-.05,.08,0);const gp=new THREE.Mesh(new THREE.BoxGeometry(.18,.46,.15),wm);gp.position.set(-.42,-.24,0);gp.rotation.z=-.35;g.add(br,dr,fr,gp)}
 else{const gm=new THREE.MeshStandardMaterial({color:0x2a2a2e,metalness:.6,roughness:.35});
 const b1=new THREE.Mesh(new THREE.BoxGeometry(.9,.22,.16),gm);b1.position.x=.15;const b2=new THREE.Mesh(new THREE.BoxGeometry(.2,.44,.15),gm);b2.position.set(-.18,-.25,0);b2.rotation.z=-.25;g.add(b1,b2)}
 return g;
}
function ammoBuild(){if(!AMMO.pos)return;const X=SAFE.IN.x+165,Z=SAFE.IN.z-115,W=7,D=6,H=3.5,C=h=>COL(h);
 AMMO.IN={x:X,z:Z};const g=new THREE.Group();AMMO.grp=g;scene.add(g);g.visible=false;
 const mb=new MB(),wall=C('#3a3f45'),floor=C('#4e4e54'),metal=C('#1d2328'),gold=C('#c99c3a'),B=(x0,y0,z0,x1,y1,z1,c)=>ibox(mb,X+x0,y0,Z+z0,X+x1,y1,Z+z1,typeof c==='string'?C(c):c);
 // v77: piso de borracha em placas, rodapé, lambri de chapa e teto com luminárias (mesma luz quente/penumbra do cassino)
 for(let x=-W;x<W-.01;x+=1)for(let z=-D;z<D-.01;z+=1){const k=(Math.round(x)+Math.round(z))&1;mb.quad([X+x,0,Z+z+1],[X+x+1,0,Z+z+1],[X+x+1,0,Z+z],[X+x,0,Z+z],0,1,0,[0,0,1,1],C(k?'#4a4a50':'#54545a'))}
 for(const [a,b,c,d] of [[-W,-D,W,-D+.12],[-W,D-.12,W,D],[-W,-D,-W+.12,D],[W-.12,-D,W,D]])B(a,0,b,c,H,d,wall);
 for(const [a,b,c,d] of [[-W,-D+.12,W,-D+.16],[-W+.12,-D,-W+.16,D],[W-.16,-D,W-.12,D],[-W,D-.16,W,D-.12]])B(a,0,b,c,1.05,d,'#2b2f34'); // lambri de chapa
 for(const [a,b,c,d] of [[-W,-D+.12,W,-D+.2],[-W+.12,-D,-W+.2,D],[W-.2,-D,W-.12,D],[-W,D-.2,W,D-.12]])B(a,1.05,b,c,1.12,d,'#6a5a3a');
 B(-W,H,-D,W,H+.13,D,'#26282d');
 for(const x of [-4,0,4])for(const z of [-2.5,2.5]){B(x-.9,H-.08,z-.18,x+.9,H,z+.18,'#3a3e44');B(x-.82,H-.1,z-.12,x+.82,H-.08,z+.12,'#e8efe0')}
 // porta de entrada (sul) com vidro e barra
 B(-.75,0,D-.16,.75,2.25,D-.1,'#1c2a30');B(-.82,2.25,D-.18,.82,2.35,D-.1,gold);B(-.55,1.0,D-.2,.55,1.06,D-.16,'#9aa0a6');
 // balcão com tampo de vidro, base de chapa, caixa registradora e mostruário de facas
 B(-5.6,0,-3.15,5.6,.95,-2.15,metal);B(-5.7,.95,-3.2,5.7,1.0,-2.1,'#3b3326');B(-5.65,1.0,-3.15,5.65,1.04,-2.15,'#5d7684');
 for(let x=-5.2;x<5.2;x+=1.3)B(x,.2,-2.17,x+1.1,.8,-2.14,'#2b3238');
 B(2.6,1.04,-2.95,3.2,1.3,-2.5,'#2a2a2e');B(2.65,1.3,-2.95,3.15,1.42,-2.75,'#5a8a60');B(-3.4,1.04,-2.95,-2.2,1.06,-2.4,'#8a7a52');
 for(let k=0;k<5;k++)B(-3.3+k*.22,1.06,-2.85,-3.2+k*.22,1.08,-2.5,'#c8ccd4');
 // armários de canto
 B(-5.8,0,-5.8,-5.45,2.75,-3.7,metal);B(5.45,0,-5.8,5.8,2.75,-3.7,metal);
 // parede do fundo: painel perfurado verde-oliva atrás das vitrines
 B(-6.2,.6,-D+.16,6.2,2.65,-D+.2,'#3e4a38');for(let x=-6;x<6.1;x+=.4)for(let y=.8;y<2.6;y+=.4)B(x,y,-D+.2,x+.04,y+.04,-D+.21,'#2a3226');
 const rack=C('#282d31');
 // As sete armas da vitrine sao os mesmos meshes dos colecionaveis, incluindo
 // cilindro da Colt, tubo/cone da bazuca e os modelos originais das granadas.
 const kinds=['pistol','smg','magnum','rpg','grenade','remote','jammer'];
 for(let i=0;i<kinds.length;i++){
  const xx=X-5.25+i*1.75,zz=Z-D+.24,yy=i%2?2.02:1.24,k=kinds[i];
  ibox(mb,xx-.71,yy-.46,zz-.22,xx+.72,yy+.43,zz+.06,rack);ibox(mb,xx-.73,yy-.48,zz-.24,xx+.74,yy-.44,zz+.08,gold);
  const display=ammoShowcaseWeapon(k);
  display.position.set(xx,yy,zz+.22);
  display.scale.setScalar(k==='rpg'?.54:k==='grenade'||k==='remote'||k==='jammer'?.90:.78);
  display.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});
  g.add(display);
 }
 // gôndolas laterais de verdade: montantes, 4 prateleiras com borda, caixas de munição de tamanhos/cores variados,
 // latas, coldres e miras; topo com caixas de papelão (decorativas, não coletáveis)
 const ar=mulberry32((S.seed^0x5a11)>>>0),boxC=['#556a55','#826c48','#6a2a24','#2a3a5a','#c8a040','#3a3a3a','#7a7a3a'];
 for(const side of [-1,1]){const x0=side<0?-6.85:5.95,x1=side<0?-5.95:6.85;
  for(const z of [-2.0,-.25,1.5,3.25])B(x0,0,z,x1,2.3,z+.06,'#3a3f44');
  for(const y of [.12,.68,1.24,1.8])B(x0,y,-2.0,x1,y+.05,3.31,'#4a5056');
  B(x0,.05,-2.0,x1,.12,3.31,'#2a2e33');
  for(const y of [.17,.73,1.29,1.85]){let z=-1.92;while(z<3.2){const w=.18+ar()*.32,h=.16+ar()*.3,dpt=.3+ar()*.4;if(z+w>3.2)break;const cx=side<0?x1-.05-dpt:x0+.05;B(cx,y,z,cx+dpt,y+h,z+w,boxC[Math.floor(ar()*boxC.length)]);
    if(ar()<.5)B(side<0?cx+dpt:cx-.005,y+h*.35,z+w*.15,side<0?cx+dpt+.005:cx,y+h*.65,z+w*.85,'#e8d8a8');z+=w+.04+ar()*.06}}
  for(let k=0;k<3;k++){const z=-1.6+k*1.6;B(x0+.1,2.3,z,x1-.1,2.3+.3+ar()*.25,z+.9,'#9a7a52')}
 }
 // alvos de papel e cartazes nas paredes laterais (acima do lambri)
 const tgt=(x,z,sd)=>{const xx=X+x;B(x-.005*sd,1.6,z-.45,x,2.6,z+.45,'#e8e2d0');for(const [r,c] of [[.38,'#1a1a1a'],[.28,'#e8e2d0'],[.18,'#1a1a1a'],[.08,'#c82020']]){const f=.005+.004+(.4-r)*.06,a=x-sd*f;B(Math.min(a,a+sd*.002),2.1-r,z-r,Math.max(a,a+sd*.002),2.1+r,z+r,c)}}; /* v78: anéis do alvo empilhados à frente do quadro, o menor na frente, 6 mm entre camadas (antes ficavam coplanares/dentro do quadro) */
 tgt(-W+.17,4.2,1);tgt(W-.17,4.2,-1);
 // tapete na entrada e poltrona/estante de espera
 B(-1.1,0,3.9,1.1,.015,5.6,'#6a2a24');B(-1.05,.015,3.95,1.05,.02,5.55,'#7e3a2c');
 B(4.4,0,4.4,5.6,.45,5.6,'#5a3a24');B(4.4,.45,5.3,5.6,1.1,5.6,'#5a3a24');
 const lights=[[X-4,H-.4,Z-2.5],[X,H-.4,Z-2.5],[X+4,H-.4,Z-2.5],[X-4,H-.4,Z+2.5],[X,H-.4,Z+2.5],[X+4,H-.4,Z+2.5]];
 const mesh=mb.mesh(roomLitMat({x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights,warm:'#ffe0b0',amb:.52,pow:.75,rad:6,grime:.25},{side:THREE.DoubleSide}));mesh.castShadow=false;g.add(mesh);
 
 // v77: colisões do interior (antes não havia nenhuma: dava para atravessar balcão, gôndolas e armários)
 {const cc=curChunk;curChunk=null;try{for(const c of AMMO.cols||[])c.dead=true;AMMO.cols=[];
  for(const [a,b,c,d] of [[-5.75,-3.25,5.75,-2.05],[-5.85,-5.85,-5.4,-3.65],[5.4,-5.85,5.85,-3.65],[-6.9,-2.05,-5.9,3.36],[5.9,-2.05,6.9,3.36],[4.35,4.35,5.65,5.65],[-W-.5,-D-.5,W+.5,-D+.25],[-W-.5,-D,-W+.2,D],[W-.2,-D,W+.5,D]])AMMO.cols.push(addCol(X+a,Z+b,X+c,Z+d,'rock'))}finally{curChunk=cc}}
 AMMO.arrow=makeArrow();AMMO.inArrow=makeArrow();AMMO.inArrow.visible=false;
 // Placa externa junto à porta selecionada, sem colisores ou carga no shadow pass.
 const ext=new THREE.Group();AMMO.extSign=ext;scene.add(ext);
 const pp=AMMO.pos,n=pp.nrm||[0,1];AMMO.extBuilt=false;ammoFacadeFix();
}
// v77: a placa, a porta e a seta da AMOnições nascem NA fachada do prédio (antes ficavam no ponto de saída, 1,6 m na calçada).
// A fachada é achada recuando do ponto da porta até o colisor do prédio; roda quando o quarteirão já tem colisores.
function ammoFacadeFix(){const pp=AMMO.pos,ext=AMMO.extSign;if(!pp||!ext||AMMO.extBuilt)return;if(pp.tire){if(!pp.pending)AMMO.extBuilt=true;return}const n=pp.nrm||[0,1],o0=pp.out0||(pp.out0={x:pp.out.x,z:pp.out.z});
 const inB=(x,z)=>query(x,z,.4).some(c=>!c.dead&&c.kind==='bld'&&x>c.x0&&x<c.x1&&z>c.z0&&z<c.z1);let f=null;
 for(let d=-1.2;d<=5;d+=.05){const x=o0.x-n[0]*d,z=o0.z-n[1]*d;if(inB(x,z)){f={x:o0.x-n[0]*(d-.05),z:o0.z-n[1]*(d-.05)};break}}
 if(!f){if(Math.hypot(PL.x-o0.x,PL.z-o0.z)>70)return;f={x:o0.x-n[0]*1.6,z:o0.z-n[1]*1.6}}
 AMMO.extBuilt=true;while(ext.children.length){const c=ext.children.pop();c.geometry&&c.geometry.dispose();c.material&&c.material.dispose()}
 const ry=Math.atan2(n[0],n[1]),fx=f.x+n[0]*.02,fz=f.z+n[1]*.02;
 const bd=new THREE.Mesh(new THREE.BoxGeometry(2.9,.98,.1),S.style==='inverted'?new THREE.MeshLambertMaterial({color:0x29282c}):new THREE.MeshBasicMaterial({color:0x29282c}));bd.position.set(fx+n[0]*.05,3.85,fz+n[1]*.05);bd.rotation.y=ry;ext.add(bd);
 ammoSign(ext,fx+n[0]*.11,3.85,fz+n[1]*.11,'AMOnições',2.7,ry);
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.3,.08),new THREE.MeshLambertMaterial({color:0x1c2a30}));door.position.set(fx+n[0]*.04,1.15,fz+n[1]*.04);door.rotation.y=ry;ext.add(door);
 const fr=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.12),new THREE.MeshLambertMaterial({color:0xc99c3a}));fr.position.set(fx+n[0]*.05,2.35,fz+n[1]*.05);fr.rotation.y=ry;ext.add(fr);
 for(const sd of [-1,1]){const j=new THREE.Mesh(new THREE.BoxGeometry(.1,2.35,.12),fr.material);j.position.set(fx+n[0]*.05-n[1]*sd*.8,1.17,fz+n[1]*.05+n[0]*sd*.8);j.rotation.y=ry;ext.add(j)}
 pp.out={x:f.x+n[0]*.9,z:f.z+n[1]*.9};pp.x=pp.out.x;pp.z=pp.out.z}
function ammoCounterNear(){return PL.inside==='ammo'&&AMMO.IN&&Math.hypot(PL.x-AMMO.IN.x,PL.z-(AMMO.IN.z-1.15))<3.3}
function ammoEnter(){if(!AMMO.pos||!AMMO.IN||!AMMO.grp||PL.inside||AMMO.lock>0)return;
 if(POL.wanted){toast(ammoMsg('AMOnições · VOLTE QUANDO NÃO ESTIVER PROCURADO','GUN STORE · RETURN WHEN YOU ARE NOT WANTED'));AMMO.lock=1.4;return}
 const p=AMMO.pos;doorEnter('ammo','ammonitions',p.out,p.nrm);PL.inside='ammo';AMMO.grp.visible=true;AMMO.lock=1.1;
 PL.x=AMMO.IN.x;PL.z=AMMO.IN.z+3.25;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;camT.x=PL.x;camT.z=PL.z;PL.pitch=0;LOOK.yaw=LOOK.pitch=0;LOOK.t=9;chasePos.set(PL.x,2.5,PL.z+2);ammoCameraBounds(chasePos);
 for(const q of peds.slice())if(!q.fixed)removePed(q);
 const x=AMMO.IN.x,z=AMMO.IN.z-4.1;
 try{const q=spawnPed(null,{x,z,vx:0,vz:0,pal:{...CLERK_PAL,cap:'#111920',capDark:'#111920',shirt:'#4e5150',stripe:null}});q.state='clerk';q.fixed=true;q.at={x,z};q.mx=0;q.mz=1;AMMO.clerk=q}catch(e){console.warn('AMOnições clerk',e)}
}
function ammoExit(){if(AMMO.uiOpen)ammoClose();if(!AMMO.pos)return;PL.inside=false;const p=AMMO.pos;
 doorExit({x:p.out.x,z:p.out.z,nx:p.nrm[0],nz:p.nrm[1]});AMMO.lock=1.2;AMMO.grp.visible=false;
 if(AMMO.clerk&&peds.includes(AMMO.clerk))removePed(AMMO.clerk);AMMO.clerk=null;AMMO.inArrow.visible=false;camT.x=PL.x;camT.z=PL.z}
// v77: o "borracheiro" na porta do escritório dá a dica com trocadilhos
const AMMO_LINES=['Calibragem? A gente calibra de tudo: 9 mm, .45, 12…','Furou? Aqui a gente resolve furo de todo calibre.','Rodízio de pneus e de pentes. Fala com o chefe no escritório.','Troca de óleo, troca de chumbo… entra aí, freguês.','Balanceamento e munição. Mais a munição, na real.','Pneu careca a gente não vende. Já cano curto…'];
function ammoGuyTick(dt,p){const want=p&&p.tire&&!p.pending&&!PL.inside&&S.style!=='inverted'&&Math.hypot(PL.x-p.x,PL.z-p.z)<60;let q=AMMO.guy;
 if(q&&(!want||!peds.includes(q))){if(peds.includes(q))removePed(q);AMMO.guy=q=null}
 if(want&&!q){const sx=p.side?p.side[0]:1,sz=p.side?p.side[1]:0,x=p.out.x+sx*1.25-p.nrm[0]*.3,z=p.out.z+sz*1.25-p.nrm[1]*.3;
  try{q=spawnPed(null,{x,z,vx:0,vz:0,pal:{...CLERK_PAL,cap:'#2a2a2a',capDark:'#1a1a1a',shirt:'#3a4a5a',stripe:null,pants:'#2a2a30'}});if(q){q.state='clerk';q.fixed=true;q.at={x,z};q.mx=p.nrm[0];q.mz=p.nrm[1];AMMO.guy=q;AMMO.guyT=1.2}}catch(e){}}
 if(q){AMMO.guyT=(AMMO.guyT||0)-dt;const d=Math.hypot(PL.x-q.x,PL.z-q.z);if(d<9&&AMMO.guyT<=0){AMMO.guyI=((AMMO.guyI??-1)+1)%AMMO_LINES.length;say(q,AMMO_LINES[AMMO.guyI],4.5);AMMO.guyT=8}
  if(d<9){q.mx=PL.x-q.x;q.mz=PL.z-q.z}}}
function ammoTick(dt){AMMO.lock=Math.max(0,AMMO.lock-dt);
 if(!AMMO.pos||!AMMO.grp){return}
 if(!AMMO.extBuilt)ammoFacadeFix();
 const inStore=PL.inside==='ammo',p=AMMO.pos;
 ammoGuyTick(dt,p);
 if(AMMO.arrow){const near=!p.pending&&!PL.inside&&!PL.car&&!PL.dead&&Math.hypot(PL.x-p.x,PL.z-p.z)<100;
  AMMO.arrow.visible=near;AMMO.arrow.position.set(p.x,1.5+Math.sin(simT*3)*.18,p.z);AMMO.arrow.rotation.y=simT*1.8}
 if(!inStore){AMMO.inArrow.visible=false;
  if(!p.pending&&AMMO.lock<=0&&!PL.inside&&!PL.car&&!PL.dead&&Math.hypot(PL.x-p.x,PL.z-p.z)<1.1)ammoEnter();return}
 if(AMMO.lock<=0&&Math.hypot(PL.x-AMMO.IN.x,PL.z-(AMMO.IN.z+5.28))<.80){ammoExit();return}
 PL.x=clamp(PL.x,AMMO.IN.x-6.55,AMMO.IN.x+6.55);PL.z=clamp(PL.z,AMMO.IN.z-5.45,AMMO.IN.z+5.45);
 AMMO.inArrow.visible=true;AMMO.inArrow.position.set(AMMO.IN.x,1.5+Math.sin(simT*3)*.18,AMMO.IN.z+5.35);
 AMMO.inArrow.rotation.y=simT*1.8;
 const hp=$('#heistp');if(hp){const near=ammoCounterNear(),msg=near?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>'+ammoMsg('AMOnições · ARMAS E UPGRADES','GUN STORE · WEAPONS & UPGRADES'):'';
  if(hp.dataset.h!==msg){hp.dataset.h=msg;hp.innerHTML=msg}hp.hidden=!near}
}
function ammoPanel(){if(AMMO.panel)return AMMO.panel;const root=document.createElement('div');root.id='ammoStore';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','ammoStoreTitle');
 root.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(3,5,10,.85);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;';
 const pane=document.createElement('div');pane.style.cssText='width:min(940px,98vw);max-height:90vh;max-height:calc(100dvh - 24px);box-sizing:border-box;overflow:auto;overscroll-behavior:contain;scroll-padding-top:65px;background:#171b21;color:#f4f0e5;border:2px solid #dfb852;border-radius:12px;padding:18px;font:14px/1.45 Arial,sans-serif;box-shadow:0 12px 60px #000;';
 root.appendChild(pane);root.addEventListener('click',ev=>{if(ev.target===root)ammoClose();const b=ev.target.closest('button[data-action]');if(!b)return;
  if(b.disabled)return;ev.preventDefault();ev.stopPropagation();const a=b.dataset.action,w=b.dataset.weapon,k=b.dataset.field;if(a==='close')ammoClose();if(a==='select'&&WPN[w]){AMMO.sel=w;ammoRender()}
  if((a==='buy'||a==='buyAll')&&WPN[w])ammoBuy(w,a==='buyAll');if(a==='upgrade'&&WPN[w])ammoBuyUpgrade(w,k);if(a==='sig')netSigBuy()});
 document.body.appendChild(root);AMMO.panel=root;AMMO.pane=pane;
 const sty=document.createElement('style');sty.textContent='#ammoStore[hidden]{display:none!important}#ammoStore button{border:1px solid #947b3b;border-radius:6px;background:#30353d;color:#f6deb0;padding:8px 12px;margin:3px;cursor:pointer;font:600 13px Arial}#ammoStore button:hover,#ammoStore button:focus{background:#66552b;outline:1px solid #fff}#ammoStore button:disabled{opacity:.35;cursor:default}#ammoStore button.selected{background:#7e6330}#ammoStore .arow{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:6px 8px;border-bottom:1px solid #454139}#ammoStore .astat{color:#adb8be;font-size:12px}#ammoStore header{position:sticky;top:-18px;z-index:1;background:#171b21;padding:8px 0}body.touch #ammoStore button{min-height:44px;touch-action:manipulation}@media (pointer:coarse){#ammoStore button{min-height:44px;touch-action:manipulation}}';
 document.head.appendChild(sty);
 // Captura teclado da UI antes do listener de jogabilidade, sem mexer no motor.
 document.addEventListener('keydown',ev=>{
  if(!AMMO.uiOpen)return;
  const arrow={ArrowDown:[0,1],ArrowUp:[0,-1],ArrowRight:[1,0],ArrowLeft:[-1,0]}[ev.code];
  if(ev.code==='Escape'){if(!ev.repeat)ammoClose();ev.preventDefault()}
  else if(ev.code==='Tab'){
   const buttons=[...root.querySelectorAll('button:not(:disabled)')];
   const dir=ev.shiftKey?-1:1,i=buttons.indexOf(document.activeElement);
   const next=i<0?(ev.shiftKey?buttons.at(-1):buttons[0]):buttons[(i+dir+buttons.length)%buttons.length];
   next?.focus();ev.preventDefault();
  }else if(arrow){padNavFocus(root,arrow[0]+arrow[1],arrow);ev.preventDefault()}
  else if(ev.code==='Enter'||ev.code==='NumpadEnter'||ev.code==='Space'){
   const button=document.activeElement;
   if(!ev.repeat&&root.contains(button)&&button.tagName==='BUTTON'&&!button.disabled)button.click();
   ev.preventDefault();
  }
  ev.stopImmediatePropagation();
 },true);
 return root}
function ammoOpen(){if(!ammoCounterNear()||!AMMO.pos||AMMO.uiOpen)return;ammoPanel();AMMO.uiOpen=true;AMMO.panel.hidden=false;
 for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();ammoRender();
 const btn=AMMO.panel.querySelector('button.selected');if(btn)btn.focus()}
function ammoClose(){AMMO.uiOpen=false;if(AMMO.panel)AMMO.panel.hidden=true}
function ammoOffer(w,all=false){
 const owned=!!GUN.inv[w],cap=ammoCap(w),batch=AMMO_BATCH[w];
 const current=owned?(GUN.has&&GUN.w===w?GUN.ammo:GUN.inv[w].ammo):0;
 const amount=Math.max(0,Math.min(all?cap:batch,cap-current));
 const price=Math.ceil(AMMO_PRICES[w]*amount/batch);
 return {owned,cap,current,amount,price};
}
function ammoBuy(w,all=false){if(!AMMO.uiOpen||!WPN[w])return;
 if(w==='jammer'){if(CTOS.installed){toast(ammoMsg('ctOS JÁ INSTALADO','ctOS ALREADY INSTALLED'));return}if((PL.money||0)<CTOS.price){toast(ammoMsg('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+CTOS.price);return}money(-CTOS.price);clang(.25);ctosInstall();ammoRender();return}
 const {amount,price}=ammoOffer(w,all);
 if(!amount){toast(ammoMsg('LIMITE DE MUNIÇÃO ATINGIDO','AMMO LIMIT REACHED'));return}
 if((PL.money||0)<price){toast(ammoMsg('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+price);return}
 const added=gunGive(w,amount);
 if(added<=0){toast(ammoMsg('LIMITE DE MUNIÇÃO ATINGIDO','AMMO LIMIT REACHED'));return}
 money(-price);clang(.25);if(PROLOGUE.active&&PROLOGUE.stage==='ammo'){PROLOGUE.gun=true;toast('<span style="color:#7dff8a">ARMADO</span><br><small style="font-size:11px;color:#fff">agora saia e vá ao Motel Miragem</small>')}
 toast(ammoText(w)+' · +'+added+' · -$'+price);ammoRender()}
function ammoBuyUpgrade(w,k){if(!AMMO.uiOpen||!AMMO_UPGRADABLE.has(w)||!['damage','rate','focus'].includes(k)||!GUN.inv[w])return;
 const n=ammoUpgrade(w,k);if(n>=3)return;const price=ammoUpgradeCost(w,k);
 if((PL.money||0)<price){toast(ammoMsg('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+price);return}
 money(-price);const up=AMMO.up[w]||(AMMO.up[w]={damage:0,rate:0,focus:0});up[k]=n+1;
 clang(.4);toast(ammoText(w)+' · '+k.toUpperCase()+' '+(n+1)+'/3');ammoRender()}
function ammoRender(){if(!AMMO.panel||!AMMO.pane)return;const ae=document.activeElement,focus=AMMO.panel.contains(ae)?{...ae.dataset}:null;const en=S.lang==='en',tr=(b,e)=>en?e:b;
 const labels={damage:tr('DANO','DAMAGE'),rate:tr('CADÊNCIA','FIRE RATE'),focus:tr('FOCO','FOCUS')};
 const w=AMMO.sel;
 const {owned,cap,current,amount,price:cost}=ammoOffer(w);
 const cash=PL.money||0;
 const fill=ammoOffer(w,true);
 const fillButton=fill.amount>amount?
  '<button data-action="buyAll" data-weapon="'+w+'" '+(cash<fill.price?'disabled':'')+'>'+
  (cash<fill.price?tr('SALDO INSUFICIENTE','NOT ENOUGH MONEY'):tr('COMPRAR TUDO','BUY ALL')+' +'+fill.amount)+' · $'+fill.price+'</button>':'';
 if(w==='jammer'){const inst=CTOS.installed;AMMO.pane.innerHTML='<header style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div><h2 id="ammoStoreTitle" style="color:#f8cf62;margin:0;font:900 26px Arial">AMOnições</h2><small>'+tr('ARMAS · MUNIÇÃO · UPGRADES','WEAPONS · AMMO · UPGRADES')+'</small></div><div style="text-align:right"><b>'+ammoBalance()+'</b><button data-action="close">'+tr('FECHAR ✕','CLOSE ✕')+'</button></div></header><div style="padding:8px 0">'+Object.keys(WPN).map(k=>'<button data-action="select" data-weapon="'+k+'" class="'+(k===w?'selected':'')+'">'+ammoText(k)+'</button>').join('')+'</div><div class="arow"><div><b>APP ctOS</b><div class="astat">'+tr('Invade sistemas públicos pelo celular: JAMMER (apagão à noite, semáforos verdes de dia, ponte levadiça) e PERFIL de pedestres. Fica no celular do Nathan e da Claire.','Hacks public systems from your phone: JAMMER (blackout at night, all-green lights by day, drawbridge) and pedestrian PROFILES. Works on both Nathan\'s and Claire\'s phones.')+'</div></div><button data-action="buy" data-weapon="jammer" '+(inst||cash<CTOS.price?'disabled':'')+'>'+(inst?tr('INSTALADO','INSTALLED'):cash<CTOS.price?tr('SALDO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+CTOS.price:tr('INSTALAR','INSTALL')+' · $'+CTOS.price)+'</button></div>'+(ONLINE.on?'<div class="arow"><div><b>'+tr('BLOQUEADOR DE SINAL','SIGNAL JAMMER')+'</b><div class="astat">'+tr('Ninguém hackeia seu PIX no online. Fica na conta.','Nobody can hack your PIX online. Stays on your account.')+'</div></div><button data-action="sig" data-weapon="jammer" '+(ONLINE.sig||SIG.wait||cash<SIG.price?'disabled':'')+'>'+(ONLINE.sig?tr('ATIVO','ACTIVE'):SIG.wait?'…':cash<SIG.price?tr('SALDO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+SIG.price:tr('COMPRAR','BUY')+' · $'+SIG.price)+'</button></div>':'');const bn=[...AMMO.panel.querySelectorAll('button')];if(focus){const nx=bn.find(b=>!b.disabled&&b.dataset.action===focus.action&&b.dataset.weapon===focus.weapon)||bn.find(b=>b.classList.contains('selected'))||bn[0];if(nx){nx.focus({preventScroll:true});nx.scrollIntoView({block:'nearest'})}}return}
 const buyLabel=!amount?tr('MUNIÇÃO CHEIA','AMMO FULL'):cash<cost?tr('SALDO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+cost:(owned?tr('COMPRAR +','BUY +'):tr('COMPRAR ARMA +','BUY WEAPON +'))+amount+' · $'+cost;
 const buttons=Object.keys(WPN).map(k=>'<button data-action="select" data-weapon="'+k+'" class="'+(k===w?'selected':'')+'">'+ammoText(k)+'</button>').join('');
 const upgrades=AMMO_UPGRADABLE.has(w)?Object.keys(labels).map(k=>{const level=ammoUpgrade(w,k),price=ammoUpgradeCost(w,k);
  return '<div class="arow"><span>'+labels[k]+' <b>'+level+'/3</b></span><span class="astat">'+(k==='damage'?'+'+(level*10)+'%':k==='rate'?'+'+Math.round((1/(1-.10*level)-1)*100)+'%':tr('desvio','spread')+' -'+(level*20)+'%')+'</span><button data-action="upgrade" data-weapon="'+w+'" data-field="'+k+'" '+(!owned||level===3||cash<price?'disabled':'')+'>'+ (level===3?tr('MÁXIMO','MAX'):!owned?tr('COMPRE A ARMA','BUY THE WEAPON'):(cash<price?tr('SALDO INSUFICIENTE','NOT ENOUGH MONEY'):tr('MELHORAR','UPGRADE'))+' · $'+price)+'</button></div>'}).join(''):
 '<div class="astat" style="margin:12px 0">'+tr('Arma especial sem melhorias permanentes.','Special weapon with no permanent upgrades.')+'</div>';
 AMMO.pane.innerHTML='<header style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div><h2 id="ammoStoreTitle" style="color:#f8cf62;margin:0;font:900 26px Arial">AMOnições</h2><small>'+tr('ARMAS · MUNIÇÃO · UPGRADES','WEAPONS · AMMO · UPGRADES')+'</small></div><div style="text-align:right"><b>'+ammoBalance()+'</b><button data-action="close">'+tr('FECHAR ✕','CLOSE ✕')+'</button></div></header>'+
 '<div style="padding:8px 0">'+buttons+'</div><div class="arow"><div><b>'+ammoText(w)+'</b><div class="astat">'+tr('Categoria: ','Category: ')+(en?({pistol:'Pistols',smg:'Automatic',magnum:'Pistols',rpg:'Heavy',grenade:'Explosives',remote:'Explosives',jammer:'Electronic',flame:'Heavy'}[w]):AMMO_CATS[w])+' · '+tr('Munição','Ammo')+': ' +current+'/'+cap+'</div></div><button data-action="buy" data-weapon="'+w+'" '+(!amount||cash<cost?'disabled':'')+'>'+buyLabel+'</button>'+fillButton+'</div>'+
 '<h3 style="color:#f8cf62;margin-bottom:6px">'+tr('MELHORIAS PERMANENTES','PERMANENT UPGRADES')+'</h3>'+upgrades+'<p class="astat">'+tr('Armas dos becos: raras e sem respawn. Cada compra de arma existente repõe munição até o limite da mochila.','Alley weapons: rare with no respawns. Buying an owned weapon replenishes ammo up to backpack capacity.')+'</p>';
 const buttonsNow=[...AMMO.panel.querySelectorAll('button')];
 if(focus){const next=buttonsNow.find(b=>!b.disabled&&b.dataset.action===focus.action&&b.dataset.weapon===focus.weapon&&b.dataset.field===focus.field)||buttonsNow.find(b=>!b.disabled&&b.dataset.action==='buy')||buttonsNow.find(b=>b.classList.contains('selected'))||buttonsNow[0];if(next){next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});}}

}

function heistTick(dt){panicTick(dt);try{isleTick(dt)}catch(e){console.error(e)}try{copHeliTick(dt);polBoatTick(dt);blitzTick(dt);x9Tick(dt)}catch(e){console.error(e)}balTick(dt);abandonTick(dt);
 robTick(dt);
 {if(PL.inside==='mall'){if(CTX.mall&&CTX.mall!==BAL.lm){const q=peds.find(p=>p.mallClerk===CTX.mall);if(q)say(q,SAY.greet)}BAL.lm=CTX.mall}else BAL.lm=null}if(HEIST.pawnPending&&played&&city.catSpots){HEIST.pawnPending=false;try{pawnPlace();buildPawn()}catch(e){console.error(e)}try{ammoPlace();ammoBuild()}catch(e){console.error('AMOnições:',e)}}HEIST.lock=Math.max(0,HEIST.lock-dt);const inH=PL.inside==='heist',inP=PL.inside==='pawn',lt=$('#loot'),hp=$('#heistp');
 if(PL.dead&&HEIST.loot.length){HEIST.loot=[]}
 {const sum=HEIST.loot.reduce((a,b)=>a+b.val,0);let t='';if(HEIST.loot.length)t='ROUBADO · '+HEIST.loot.length+(HEIST.loot.length>1?' itens':' item')+' · <b>$'+sum+'</b>';if(inH)t+=(t?'<br>':'')+(HEIST.alarm?'<i>POLÍCIA A CAMINHO · SAIA!</i>':'SAIA '+tbHTML(HEIST.t/15));if(inP)t+=(t?'<br>':'')+(HEIST.pawnAlarm?'<i>POLÍCIA A CAMINHO</i>':'NÃO DEMORE '+tbHTML((10-HEIST.pawnT)/10));
  if(lt){if(lt.dataset.h!==t){lt.dataset.h=t;lt.innerHTML=t}lt.hidden=!t||!played}}
 for(const a of [HEIST.arrIn,HEIST.pawnArrIn,HEIST.pawnArr,...HEIST.arrows])if(a&&a.visible){a.position.y=1.5+Math.sin(simT*3)*.18;a.rotation.y=simT*1.8}
 if(inH){HEIST.t-=dt;if(HEIST.t<=0&&!HEIST.alarm){HEIST.alarm=true;toast('<span style="color:#ff4a4a">UM VIZINHO CHAMOU A POLÍCIA!</span>')}const it=heistFront();const k=PAD.on?'→':'E',h=it?'<kbd>'+k+'</kbd>PEGAR '+LOOT_NM[it.k]+' · $'+it.val:'';if(hp){if(hp.dataset.h!==h){hp.dataset.h=h;hp.innerHTML=h}hp.hidden=!h}
  const hz=HEIST.house;if(hz){PL.x=clamp(PL.x,hz.bb.x0+.3,hz.bb.x1-.3);PL.z=clamp(PL.z,hz.bb.z0+.3,hz.bb.z1-.3);if(HEIST.lock<=0&&Math.hypot(PL.x-hz.X,PL.z-(hz.Z+3.1))<.8)heistExit()}return}
 if(inP){HEIST.pawnT+=dt;if(HEIST.pawnT>10&&!HEIST.pawnAlarm){HEIST.pawnAlarm=true;toast('<span style="color:#ff4a4a">TEM VIATURA RONDANDO A LOJA…</span>')}const c=HEIST.pawnCounter,near=c&&Math.hypot(PL.x-c.x,PL.z-c.z)<2.4,k=PAD.on?'→':'E',h=near?'<kbd>'+k+'</kbd>'+(HEIST.loot.length?'VENDER TUDO · $'+HEIST.loot.reduce((a,b)=>a+b.val,0):'FALAR COM O DONO'):'';if(hp){if(hp.dataset.h!==h){hp.dataset.h=h;hp.innerHTML=h}hp.hidden=!h}
  const IN=HEIST.pawnIN;PL.x=clamp(PL.x,IN.x-5.6,IN.x+5.6);PL.z=clamp(PL.z,IN.z-4.1,IN.z+4.1);if(HEIST.lock<=0&&Math.hypot(PL.x-IN.x,PL.z-(IN.z+3.6))<.8)pawnExit();return}
 if(hp&&!hp.hidden)hp.hidden=true;
 const ok=played&&!city.haze&&S.style!=='inverted'&&!PL.inside;
 // penhores (v2 r17: abre também no Upside Down, só como abrigo)
 if(HEIST.pawnArr){const p=HEIST.pawn,v=played&&!city.haze&&!PL.inside&&storyOK('pawn')&&p&&Math.hypot(PL.x-p.x,PL.z-p.z)<90;HEIST.pawnArr.visible=!!v;if(p)HEIST.pawnArr.position.set(p.x,1.5+Math.sin(simT*3)*.18,p.z);
  if(v&&!PL.car&&!PL.dead&&HEIST.lock<=0&&Math.hypot(PL.x-p.x,PL.z-p.z)<1.1)pawnEnter()}
 // casas: só de noite
 const night=heistNight(),day=(DN.day||0)+(Math.floor(DN.tod/60)%24<8?-1:0);if(night&&HEIST.night!==day){HEIST.night=day;HEIST.robbed=new Set();HEIST.dogs=new Set();heistPick()}
 while(HEIST.arrows.length<15)HEIST.arrows.push(makeArrow());
 HEIST.arrows.forEach((a,i)=>{const hs=HEIST.list[i];const v=ok&&night&&hs&&!HEIST.robbed.has(hs.id)&&Math.hypot(PL.x-hs.x,PL.z-hs.z)<34;a.visible=!!v;if(!v)return;a.position.x=hs.x;a.position.z=hs.z;
  const d=Math.hypot((PL.car||PL).x-hs.x,(PL.car||PL).z-hs.z);
  if(hs.dog&&!HEIST.dogs.has(hs.id)&&d<28&&!PL.car){HEIST.dogs.add(hs.id);try{const ci=Math.floor(Math.random()*DOG_COLS.length),tex=animalTex('dog',ci),sp=makeActorLitSprite(tex);const x=hs.x+hs.nrm[0]*3,z=hs.z+hs.nrm[1]*3;
   ANIM.list.push({kind:'dog',home:'street',spot:null,y:0,onBin:null,x,z,hx:x,hz:z,tx:x,tz:z,sp,tex,mx:1,mz:0,anim:0,wait:0,flee:0,dead:false,deadT:0,aggro:true,biteT:.6});toast('<span style="color:#ff4a4a">TEM CACHORRO NESSA CASA!</span>');say(ANIM.list[ANIM.list.length-1],'AU AU! GRRR!',2.5)}catch(e){console.error(e)}}
  if(!PL.car&&!PL.dead&&HEIST.lock<=0&&d<1.1)heistEnter(hs)})}
/* ================= BALÕES DE FALA (pixel art) =================
   say(alvo, texto | [variantes], segundos) — alvo é qualquer coisa com x/z (pedestre, NPC, carro, animal).
   Um balão por alvo; ele segue o alvo e some sozinho. Usado nas ações que já existem no jogo. */
const BAL={list:[]};
/* v186: registro leve, até 10 falas; sem consultas por quadro e sem HTML de NPC. */
const RECLOG={items:[],max:10,maxStory:300,pt:new THREE.Vector3()};
function recordsWho(o){
 if(o===SAFE.mate)return 'CONHECIDO';
 if(o===HEIST.clerk)return 'RECEPTADOR';
 if(o===DEAL.clerk)return 'VENDEDOR DE CARROS';
 if(o===CAS.bartender||o.clubType==='bar')return 'BARMAN';
 if(o===JAIL.guard)return 'GUARDA';
 if(o===JAIL.mate)return 'COLEGA DE CELA';
 if(o===QUEST.pier.ped)return 'PASSAGEIRA';
 if(o.mallClerk)return 'VENDEDOR';
 if(o.blitzCop||o.cop)return 'POLICIAL';
 if(o.duo)return CHAR.cur===0?'CLAIRE':'NATHAN';
 if(typeof o.name==='string'&&o.name.trim())return o.name.trim().slice(0,70);
 if(o.kind==='dog')return 'CACHORRO';
 if(o.kind==='cat')return 'GATO';
 return 'NPC ALEATÓRIO';
}
function recordsNpcVisible(o){
 if(!o||!played||!camera||o.x==null||o.z==null)return false;
 // A verificação acontece só quando um balão nasce, usando a câmera real (FPS/iso/top).
 camera.updateMatrixWorld();
 const p=RECLOG.pt.set(o.x,(o.gy||0)+(o.y||0)+1.5,o.z).project(camera);
 return p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;
}
// v78: limites separados — história guarda até 300 falas; aleatórios, as últimas 10 (antes 10 no total: a conversa
// de figurantes empurrava as falas da história para fora do registro).
function recordsTrim(){const I=RECLOG.items;let m=0,n=0;for(let i=I.length-1;i>=0;i--){const k=I[i].type==='mission'?++m>RECLOG.maxStory:++n>RECLOG.max;if(k)I.splice(i,1)}}
function recordsAdd(who,text,type){const t=String(text??'').trim();if(!t)return;
 const min=((DN.tod||0)%1440+1440)%1440,time=String(Math.floor(min/60)).padStart(2,'0')+':'+String(Math.floor(min%60)).padStart(2,'0');
 RECLOG.items.push({who:String(who||'NPC ALEATÓRIO').slice(0,80),text:t.slice(0,700),type:type==='mission'?'mission':'npc',time});
 recordsTrim();
 if(recordsOpen)recordsRefresh();
}

function think(o,txt,dur){say(o,txt,dur||4.5,true)}
function say(o,txt,dur,thought){if(!o||o.x==null||!played)return;if(Array.isArray(txt))txt=txt[Math.floor(Math.random()*txt.length)];const rawLine=txt;txt=translatePlain(txt);dur=dur||2.6;
 if(peds.includes(o))npcMumble(o,'talk');
 // v78: registro. Antes só entrava se o balão nascesse dentro da tela (recordsNpcVisible) e o próprio jogador saía
 // como "NPC ALEATÓRIO": pensamentos da Claire/Nathan em 1ª pessoa (câmera dentro da cabeça) nunca eram gravados.
 // Agora: jogador sempre (com o nome do personagem atual); durante prólogo/missão, todo personagem identificado
 // (policial da blitz, guarda, colega de cela, dupla…) entra como diálogo de MISSÃO, mesmo fora da tela.
 // Figurantes ("NPC ALEATÓRIO") continuam com o filtro de visibilidade.
 {let story=false;try{story=!!(PROLOGUE.active||missionMode())}catch(e){}
  const self=o===PL||(PL.car&&o===PL.car),who=self?String(duoName(CHAR.cur)||'VOCÊ').toUpperCase():recordsWho(o),tag=thought?' · pensamento':'';
  if(self||(story&&who!=='NPC ALEATÓRIO'))recordsAdd(who+tag,rawLine,story?'mission':'npc');
  else if(recordsNpcVisible(o))recordsAdd(who+tag,rawLine,'npc')}
 for(const b of BAL.list.slice())if(b.o===o)balDrop(b);
 const F=(thought?'italic 600':'700')+' 22px system-ui,"Segoe UI",Arial,sans-serif',m=document.createElement('canvas').getContext('2d');m.font=F;
 const words=String(txt).split(' '),lines=[];let ln='';for(const w of words){const t=ln?ln+' '+w:w;if(m.measureText(t).width>300&&ln){lines.push(ln);ln=w}else ln=t}if(ln)lines.push(ln);
 const tw=Math.max(...lines.map(l=>m.measureText(l).width)),W=Math.ceil(tw+36),Hh=lines.length*26+26,c=cv(W,Hh+14),g=c.getContext('2d');
 // balão em pixel art: borda preta em degraus, fundo branco, sombra e rabinho
 const tx=Math.round(W*.35);
 if(thought){ // v77: balão de PENSAMENTO — nuvem arredondada cinza-clara com bolinhas no lugar do rabinho
  const rr=Math.min(18,Hh/2-2);g.fillStyle='#3a3a46';g.beginPath();g.roundRect?g.roundRect(1,1,W-2,Hh-2,rr):g.rect(1,1,W-2,Hh-2);g.fill();g.fillStyle='#f4f2fb';g.beginPath();g.roundRect?g.roundRect(4,4,W-8,Hh-8,rr-3):g.rect(4,4,W-8,Hh-8);g.fill();
  for(const [dx,dy,r] of [[4,5,6],[0,11,4]]){g.fillStyle='#3a3a46';g.beginPath();g.arc(tx+dx,Hh+dy-2,r+2,0,7);g.fill();g.fillStyle='#f4f2fb';g.beginPath();g.arc(tx+dx,Hh+dy-2,r,0,7);g.fill()}
 }else{
 g.fillStyle='#000';g.fillRect(4,0,W-8,Hh);g.fillRect(0,4,W,Hh-8);g.fillStyle='#fff';g.fillRect(8,4,W-16,Hh-8);g.fillRect(4,8,W-8,Hh-16);g.fillStyle='#d8d8e0';g.fillRect(8,Hh-10,W-16,4);
 g.fillStyle='#000';for(let i=0;i<4;i++)g.fillRect(tx+i*3-2,Hh-4+i*3,16-i*4+4,4);g.fillStyle='#fff';for(let i=0;i<3;i++)g.fillRect(tx+i*3,Hh-6+i*3,12-i*4,3);}
 g.font=F;g.fillStyle=thought?'#4a4660':'#111';g.textBaseline='top';lines.forEach((l,i)=>g.fillText(l,18,13+i*26));
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false}));
 sp.center.set(.35,0);sp.renderOrder=999;sp.layers.enableAll();scene.add(sp);BAL.list.push({o,sp,t,life:dur,max:dur,w:W/100,h:(Hh+14)/100})}
function balDrop(b){scene.remove(b.sp);b.t.dispose();b.sp.material.dispose();const i=BAL.list.indexOf(b);if(i>=0)BAL.list.splice(i,1)}
function balTick(dt){const top=camMode==='top'&&!VIEW.orbit,k=top?2.2:1;for(const b of BAL.list.slice()){b.life-=dt;const o=b.o;if(b.life<=0||o.state==='dead'||(o.alive===false&&!o.kind)){balDrop(b);continue}
  const car=o.t&&o.t.L,y=(o.gy||0)+(o.jy||0)+(o.y||0)+(car?(o.t.H||1.5)+.5:o.kind?1.0:2.05);b.sp.position.set(o.x,y+(top?1:0),o.z);const s=.85*k;b.sp.scale.set(b.w*s,b.h*s,1);b.sp.material.opacity=Math.min(1,b.life*3,(b.max-b.life)*8)}}
const SAY={greet:['Olá, amigo! O que deseja?','O que vai comprar hoje?','O que gostaria?','Bem-vindo! Posso ajudar?'],thanks:['Obrigado e volte sempre!','Valeu! Até a próxima!','Bom apetite!'],
 spare:['Por favor, poupe minha vida!','Calma! Leva tudo!','Não atira, por favor!'],pawnHi:['Hm... o que você trouxe?','Compro tudo, sem perguntas.','Fala logo, tô ocupado.'],pawnBuy:['Negócio fechado. Some daqui.','Tá pago. Não te vi aqui.'],pawnNo:['Sem mercadoria, sem conversa.','Volta quando tiver algo.'],
 armed:['Socorro!','Ele tá armado!','Alguém chama a polícia!','Corre!','Ai meu Deus!'],hurt:['Socorro!','Aaai!','Tá maluco?!','Chama a polícia!'],jack:['Ei! Meu carro!','Ladrão!','Volta aqui!'],cop:['PARADO! POLÍCIA!','Mãos pra cima!','Encosta aí!'],
 medic:['Segura aí, vai ficar tudo bem!','Pronto, novo em folha!'],taxi:['Pra onde, chefe?','Entra aí!','Táxi chegou!'],mate:['E aí! Tudo certo?','Chegou! Descansa um pouco.','Vai sair de novo?']};
/* ================= BARRA DE DIÁLOGO (pronta para missões futuras; ainda não usada no jogo) =================
   dlgOpen({name:'TONY',pal:{...cores do NPC...},lines:['Fala aí.','Tenho um serviço pra você.'],choices:['Aceitar','Recusar'],onEnd:(escolha)=>{}})
   O jogo pausa enquanto a barra está aberta. ENTER/E/ESPAÇO (✕/A) continua, ↑↓ (direcional) escolhe, ESC (○/B) fecha.
   O texto aparece letra por letra com um bipe; o retrato usa o mesmo desenho do personagem. */
const DLG={on:false,el:null,d:null,i:0,shown:0,ch:0,t:0};
function dlgTap(e){e.preventDefault();e.stopPropagation();if(!DLG.on)return;
 const choice=e.target.closest('[data-dlg-choice]');
 if(choice){const n=Number(choice.dataset.dlgChoice);if(!Number.isInteger(n)||!DLG.d.choices||n<0||n>=DLG.d.choices.length)return;DLG.ch=n;dlgNext();return}
 // Do not accept an unseen/default choice by tapping outside its button.
 const d=DLG.d;if(d.choices&&DLG.i===d.lines.length-1&&DLG.shown>=(d.lines[DLG.i]||'').length)return;
 dlgNext();
}
function dlgOpen(d){if(!DLG.el){const e=document.createElement('div');e.id='dlg';e.hidden=true;e.innerHTML='<canvas width="96" height="96"></canvas><div class="dt"><b></b><p></p><div class="dc"></div><small>ENTER / ✕ continua · ESC / ○ fecha</small></div>';document.body.appendChild(e);DLG.el=e;e.addEventListener('click',dlgTap)}
 const rawD=d;d={...d,_originalLocale:{lines:d.lines.slice(),choices:d.choices?.slice()},lines:d.lines.map(translatePlain),choices:d.choices?.map(translatePlain)};DLG.d=d;DLG.i=0;DLG.shown=0;DLG.ch=0;DLG.t=0;DLG.on=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();
 const c=DLG.el.querySelector('canvas'),g=c.getContext('2d');g.clearRect(0,0,96,96);g.imageSmoothingEnabled=false;g.fillStyle='#1a1530';g.fillRect(0,0,96,96);/* v78i: retrato 3D plano com boca e piscada (dlgFace) — só com "Pedestres em 3D"; padrão = pixel art */try{if(S.sprite8!==true)throw 0;DLG.port=charPortrait({...(d.pal||CLERK_PAL),pack:false});DLG.faceKey='';DLG.blinkAt=performance.now()+2500+Math.random()*2000;dlgFace()}catch(e){if(e!==0)console.error(e);DLG.port=null;g.imageSmoothingEnabled=false;const at=makeAtlas({...(d.pal||CLERK_PAL),pack:false});g.drawImage(at,4,0,24,24,6,10,84,84)}
 DLG.el.querySelector('small').textContent=translatePlain(TOUCH.on?'TOQUE PARA CONTINUAR':'ENTER / ✕ continua · ESC / ○ fecha');DLG.el.querySelector('b').textContent=d.name||'';DLG.el.hidden=false;recordsAdd(d.name||'PERSONAGEM DA MISSÃO',d._originalLocale.lines[0]||'','mission');dlgPaint()}
function dlgPaint(){const d=DLG.d,line=d.lines[DLG.i]||'',last=DLG.i>=d.lines.length-1,p=DLG.el.querySelector('p'),dc=DLG.el.querySelector('.dc');p.textContent=line.slice(0,Math.floor(DLG.shown));
 dc.innerHTML=last&&DLG.shown>=line.length&&d.choices?d.choices.map((t,i)=>'<button type="button" data-dlg-choice="'+i+'" class="'+(i===DLG.ch?'on':'')+'">'+(i===DLG.ch?'▶ ':'')+t+'</button>').join(''):''}
// v78i: boca mexe enquanto o texto é digitado (troca a cada 110 ms) e o olho pisca 140 ms a cada 3–5 s.
function dlgFace(){if(!DLG.port||!DLG.el)return;const now=performance.now(),line=(DLG.d&&DLG.d.lines[DLG.i])||'';
 if(now>DLG.blinkAt+140)DLG.blinkAt=now+3000+Math.random()*2000;const eyes=now>=DLG.blinkAt?'closed':'open';
 const talking=DLG.shown<line.length,mouth=talking&&Math.floor(now/110)%2?'open':'closed',key=eyes+'_'+mouth;if(key===DLG.faceKey)return;DLG.faceKey=key;
 const c=DLG.el.querySelector('canvas'),g=c.getContext('2d');g.fillStyle='#1a1530';g.fillRect(0,0,96,96);g.imageSmoothingEnabled=true;g.drawImage(DLG.port[key],0,0,192,192,0,0,96,96)}
function dlgTick(dt){if(!DLG.on)return;try{dlgFace()}catch(e){}const line=DLG.d.lines[DLG.i]||'';if(DLG.shown<line.length){const n0=Math.floor(DLG.shown);DLG.shown=Math.min(line.length,DLG.shown+dt*45);if(Math.floor(DLG.shown)>n0&&n0%3===0&&AC&&S.sound){const o=AC.createOscillator(),gg=AC.createGain(),t=AC.currentTime;o.type='square';o.frequency.value=520+Math.random()*80;gg.gain.setValueAtTime(.025,t);gg.gain.linearRampToValueAtTime(0,t+.04);o.connect(gg);gg.connect(master);o.start(t);o.stop(t+.05)}dlgPaint()}}
function dlgNext(){const d=DLG.d;if(!DLG.on||!d)return;const line=d.lines[DLG.i]||'';if(DLG.shown<line.length){DLG.shown=line.length;dlgPaint();return}if(DLG.i<d.lines.length-1){DLG.i++;DLG.shown=0;recordsAdd(d.name||'PERSONAGEM DA MISSÃO',d._originalLocale.lines[DLG.i]||'','mission');dlgPaint();return}dlgClose(d.choices?DLG.ch:0)}
function dlgMove(dy){const d=DLG.d;if(!d.choices)return;DLG.ch=(DLG.ch+dy+d.choices.length)%d.choices.length;dlgPaint()}
function dlgClose(res){if(!DLG.on)return;
 // v78: registro completo mesmo pulando com ESC (falas que não chegaram a aparecer) + resposta escolhida pelo jogador.
 {const d=DLG.d;if(d&&d._originalLocale){const L=d._originalLocale.lines;for(let i=DLG.i+1;i<L.length;i++)recordsAdd(d.name||'PERSONAGEM DA MISSÃO',L[i]||'','mission');
  const C=d._originalLocale.choices;if(C&&res!=null&&res>=0&&C[res])recordsAdd(String(duoName(CHAR.cur)||'VOCÊ').toUpperCase(),C[res],'mission')}}
 DLG.on=false;DLG.el.hidden=true;const f=DLG.d&&DLG.d.onEnd;DLG.d=null;if(f)try{f(res==null?-1:res)}catch(e){console.error(e)}}
function dlgKey(e){const c=e.code;if(c==='Escape'){dlgClose(-1);return}if(c==='Enter'||c==='NumpadEnter'||c==='KeyE'||c==='Space'||c==='KeyF')dlgNext();else if(c==='ArrowUp'||c==='KeyW')dlgMove(-1);else if(c==='ArrowDown'||c==='KeyS')dlgMove(1)}
/* ================= CÂMERA PRO CÉU (estilo troca do GTA V) =================
   Usada ao trocar de personagem entre mundos, ao ir/voltar da Point Haze e do Upside Down:
   a câmera sobe até o alto olhando a cidade, a tela escurece, carrega; depois clareia lá de cima e desce até o jogador. */
const CAMX={on:false,up:true,t0:0,dur:1.15,res:null,q:new THREE.Quaternion(),o:new THREE.Object3D()};
function camSkyStart(up){CAMX.on=true;CAMX.up=up;if(up)CAMX.x=null;CAMX.t0=performance.now();CAMX.dur=up?1.4:1.6;return new Promise(r=>{CAMX.res=r})}
function camSky(up){const p=camSkyStart(up);return Promise.race([p,delayTimeJump(1800)])}
function camSkyWait(){return CAMX.on?Promise.race([new Promise(r=>{const o=CAMX.res;CAMX.res=()=>{o&&o();r()}}),delayTimeJump(1800)]):Promise.resolve()}
{const _uc=updateCamera;updateCamera=function(dt){if(!CAMX.on){_uc(dt);return}
 // Igual à troca de personagem no mesmo mundo (vista de cima, câmera reta para baixo), só que subindo mais alto;
 // na ida termina em fade; na volta desce de lá de cima até o personagem.
 const p=PL.car||PL,ss=x=>{x=clamp(x,0,1);return x*x*(3-2*x)},k=ss((performance.now()-CAMX.t0)/1000/CAMX.dur),HI=city.haze?55:clamp(STYLES[S.style].fogFar*.55,90,300);
 if(CAMX.up&&CAMX.x==null){CAMX.x=p.x;CAMX.z=p.z;CAMX.h0=Math.max(25,camera.position.y)}
 const x=CAMX.up?CAMX.x:p.x,z=CAMX.up?CAMX.z:p.z,y=CAMX.up?CAMX.h0+(HI-CAMX.h0)*k:HI+(46-HI)*k;
 setLens(50,1);camera.up.set(0,0,-1);camera.position.set(x,y,z);camera.lookAt(x,0,z);camT.x=x;camT.z=z;sky.position.copy(camera.position);
 if(k>=1){const r=CAMX.res;CAMX.res=null;if(!CAMX.up){CAMX.on=false;CAMX.x=null;camH=46;camT.x=PL.x;camT.z=PL.z}if(r)r()}}}
/* Limpeza de veículos abandonados: carro (ou moto) que o jogador usou e largou some depois de 1 h de jogo
   (3 min reais desde a v3 r23), só quando estiver a mais de 50 m. Não some: carro da garagem, carro do outro personagem,
   carro do prêmio dos discos, táxi chamado, serviços e lanchas. Helicópteros largados fora do heliponto
   (ex.: num telhado) voltam para o heliponto depois de 1 h de jogo. */
const ABAND={t:0};
function abandonTick(dt){if((ABAND.t-=dt)>0||!played)return;ABAND.t=2;const now=gameMin(),pc=PL.car||PL;
 for(const c of vehicles.slice()){if(c===PL.car||c===PL.taxi){c.used=true;c.leftAt=null;continue}if(!c.used)continue;if(c.leftAt==null){c.leftAt=now;continue}
  if(now-c.leftAt<60||c.keep||c.vinylCar||c.svc||c===TAXI.c||(c.t&&c.t.boat)||(SAFE.cars||[]).includes(c))continue;
  if(Math.hypot(c.x-pc.x,c.z-pc.z)>50){removeVehicle(c)}}
 for(const hl of HELI.list||[]){if(!hl.pad||hl.noReturn||hl.state!=='parked'||HELI.cur===hl){hl.leftAt=null;continue}const off=Math.hypot(hl.x-hl.pad.x,hl.z-hl.pad.z)>4;if(!off){hl.leftAt=null;continue}if(hl.leftAt==null){hl.leftAt=now;continue}
  if(now-hl.leftAt>=60&&Math.hypot(hl.x-pc.x,hl.z-pc.z)>80){try{if(hl.o){scene.remove(hl.o.g);disposeGroup(hl.o.g)}heliSpawnAt(hl);hl.landY=null;hl.roofC=null}catch(e){console.error(e)}hl.leftAt=null}}}
function buildSafehouse(){if(SAFE.grp){scene.remove(SAFE.grp);disposeGroup(SAFE.grp)}if(SAFE.house){for(const c of SAFE.house.cols)remCol(c);SAFE.house=null}if(!SAFE.arrowOut){SAFE.arrowOut=makeArrow();SAFE.arrowIn=makeArrow()}
 const E=city.ext,c=city.coast,IN=c===0?{x:E/2,z:E+1500}:c===1?{x:E/2,z:-1500}:c===2?{x:E+1500,z:E/2}:{x:-1500,z:E/2};SAFE.IN=IN;
 const g=new THREE.Group();SAFE.grp=g;scene.add(g);const X=IN.x,Z=IN.z,D=4,H=3.1,C=(h)=>COL(h);
 // v77: casa segura repaginada — sala (mesmas coordenadas), quarto, banheiro e cozinha separados (houseBuild, layout fixo)
 const hs=houseBuild(X,Z,(S.seed^0x5afe5afe)>>>0,true);g.add(hs.g);SAFE.house=hs;SAFE.rooms=hs.rooms;SAFE.tvPos={x:X+.1,z:Z-.2};
 const tvm=new THREE.MeshBasicMaterial({color:0x4a8ae0});const tv=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.78),tvm);tv.position.set(X+.984,1.0,Z-.2);tv.rotation.y=-Math.PI/2;g.add(tv);SAFE.tv=tvm;SAFE.tvObj=tv;
 SAFE.arrowIn.position.set(X,1.5,Z+D-.9);SAFE.cars=[null,null];SAFE.convCar=null;SAFE.slotsNext=null;if(SAFE.pads&&!city.safe)for(const q of SAFE.pads)q.visible=false;SAFE.arrowOut.visible=false;SAFE.arrowIn.visible=false;PL.inside=false;SAFE.lock=0;try{buildShop()}catch(e){console.error(e)}try{buildMall()}catch(e){console.error(e)}try{heistReset()}catch(e){console.error(e)}}
/* ================= v98: DELEGACIA E CADEIA ================= */
const JAIL={IN:null,grp:null,arrowOut:null,arrowIn:null,locked:false,left:0,lock:0,exitHold:false,guard:null,guardT:0,lastReal:0,bail:1000,hole:null,mark:null,holeTex:null,holeMat:null,holeShade:null};
function jailText(s,x,y,z,w=3,h=.45){const c=cv(256,48),q=c.getContext('2d');q.fillStyle='#172031';q.fillRect(0,0,256,48);q.fillStyle='#f1f1e5';q.font='bold 19px monospace';q.textAlign='center';q.textBaseline='middle';q.fillText(translatePlain(s),128,24);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));m.position.set(x,y,z);JAIL.grp.add(m)}
function makeJailHoleTex(){const c=cv(128,128),g=c.getContext('2d');g.clearRect(0,0,128,128);g.save();g.translate(64,64);
 const splat=(r,col,a=1)=>{g.save();g.globalAlpha=a;g.fillStyle=col;g.beginPath();for(let i=0;i<22;i++){const ang=(Math.PI*2/22)*i+(Math.random()-.5)*.18,rr=r*(.62+Math.random()*.48);const x=Math.cos(ang)*rr,y=Math.sin(ang)*rr;if(i===0)g.moveTo(x,y);else g.lineTo(x,y)}g.closePath();g.fill();g.restore()};
 splat(42,'#7a5736',.95);splat(31,'#5a3f27',.95);splat(21,'#352416',.98);
 for(let i=0;i<70;i++){const ang=Math.random()*Math.PI*2,rr=20+Math.random()*40,s=2+Math.random()*7;g.fillStyle=i%3===0?'#9b7348':i%3===1?'#6d4a2d':'#3f2a1a';g.globalAlpha=.42+Math.random()*.35;g.beginPath();g.ellipse(Math.cos(ang)*rr,Math.sin(ang)*rr,s*(.7+Math.random()*.8),s*(.45+Math.random()*.65),Math.random()*Math.PI,0,7);g.fill()}
 g.globalAlpha=1;const rg=g.createRadialGradient(0,0,8,0,0,54);rg.addColorStop(0,'rgba(0,0,0,.95)');rg.addColorStop(.48,'rgba(32,18,10,.76)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(0,0,54,0,7);g.fill();g.restore();const t=new THREE.CanvasTexture(c);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t}
// v77: cela 12×15,2 m, pé-direito 3,2; luz quente em 3 pontos e sujeira moderada
const JAIL_ROOM=(X,Z)=>({x0:X-6,z0:Z-5,x1:X+6,z1:Z+10.2,H:3.2,lights:[[X,2.9,Z-1.5],[X-3,2.9,Z+5],[X+3,2.9,Z+5],[X,2.9,Z+8.8]],warm:'#ffb868',amb:.5,pow:.95,rad:6,grime:1});
function buildJail(){if(JAIL.grp){scene.remove(JAIL.grp);disposeGroup(JAIL.grp)}JAIL.hole=null;JAIL.mark=null;JAIL.holeMat=null;JAIL.holeShade=null;if(JAIL.mate){scene.remove(JAIL.mate.sp);scene.remove(JAIL.mate.sh);JAIL.mate=null}if(JAIL.guard){scene.remove(JAIL.guard.sp);scene.remove(JAIL.guard.sh);JAIL.guard.sp.material.dispose();JAIL.guard.sh.geometry.dispose();JAIL.guard.sh.material.dispose();JAIL.guard.tex.dispose();JAIL.guard=null}
 if(!JAIL.arrowOut){JAIL.arrowOut=makeArrow();JAIL.arrowIn=makeArrow()}if(!JAIL.holeTex)JAIL.holeTex=makeJailHoleTex();
 const E=city.ext,c=city.coast,X=c===0?E/2+35:c===1?E/2+35:c===2?E+1540:-1540,Z=c===0?E+1560:c===1?-1560:c===2?E/2+35:E/2+35;
 JAIL.IN={x:X,z:Z};const g=new THREE.Group();JAIL.grp=g;scene.add(g);const mb=new MB(),C=h=>COL(h),floor=C('#73767a'),wall=C('#a0a4a9'),wall2=C('#8f949b'),dark=C('#40454e'),bars=C('#24282e');
 // Interior completo: cela 8×6 m, corredor 12×5 m, com salinha do policial ao fundo.
 mb.box(X-6,-.16,Z-5,X+6,0,Z+10.2,floor);
 mb.box(X-6,0,Z-5,X+6,3.2,Z-4.85,wall); // fundo da cela
 // parede do fundo do corredor com vão da porta central
 mb.box(X-6,0,Z+7,X-1.08,3.2,Z+7.15,wall);mb.box(X+1.08,0,Z+7,X+6,3.2,Z+7.15,wall);mb.box(X-1.08,2.35,Z+7,X+1.08,3.2,Z+7.15,wall2);
 mb.box(X-6,0,Z-5,X-5.85,3.2,Z+10.2,wall);mb.box(X+5.85,0,Z-5,X+6,3.2,Z+10.2,wall);
 mb.box(X-6,3.15,Z-5,X+6,3.25,Z+10.2,C('#b1b2b3'));
 // salinha/área de serviço do guarda atrás da porta
 mb.box(X-6,0,Z+10.05,X+6,3.2,Z+10.2,wall);mb.box(X-5.6,0,Z+8.15,X+5.6,.05,Z+8.3,C('#62666d')); // desnível sutil / batente interno
 // Grade real: barras verticais, duas travessas e porta visível.
 for(let x=-4;x<=4.01;x+=.5)mb.box(X+x-.045,0,Z+.94,X+x+.045,2.9,Z+1.03,bars);
 for(const y of [.25,1.25,2.75])mb.box(X-4,y,Z+.92,X+4,y+.075,Z+1.05,dark);
 for(const x of [-4,4])mb.box(X+x-.12,0,Z+.85,X+x+.12,3.1,Z+1.14,dark);
 mb.box(X-4,3,Z+.9,X+4,3.16,Z+1.09,dark);
 // moldura da porta da grade
 mb.box(X-.55,0,Z+.88,X+.55,.1,Z+1.12,dark);mb.box(X-.55,2.8,Z+.88,X+.55,2.95,Z+1.12,dark);mb.box(X-.55,0,Z+.88,X-.42,2.95,Z+1.12,dark);mb.box(X+.42,0,Z+.88,X+.55,2.95,Z+1.12,dark);
 // Parede da cela e móveis simples: beliche, colchão, vaso, pia e luz fria.
 // Left partition stays solid. Escape wall has exactly one inward-facing surface.
 mb.box(X-4.18,0,Z-4.85,X-4.02,3.15,Z+1.03,wall);
 // v77: fecha os vãos entre o fim da grade e as paredes externas (dava pra ver o vazio e o verso da parede de fuga)
 mb.box(X-5.85,0,Z+.88,X-4.12,3.15,Z+1.14,wall);mb.box(X+4.12,0,Z+.88,X+5.85,3.15,Z+1.14,wall);
 const escapeWall=new MB();escapeWall.quad([X+4.02,0,Z-4.85],[X+4.02,0,Z+1.03],[X+4.02,3.15,Z+1.03],[X+4.02,3.15,Z-4.85],-1,0,0,[0,0,1,1],wall);
 const wallPanel=escapeWall.mesh(roomLitMat(JAIL_ROOM(X,Z),{side:THREE.FrontSide,depthWrite:true,depthTest:true}));wallPanel.name='jail-escape-wall';g.add(wallPanel);
 // Furnishings are visual only; all gameplay coordinates remain unchanged.
 const B=(a,b,c,d,e,f,h)=>mb.box(X+a,b,Z+c,X+d,e,Z+f,C(h));
 // Two-tone masonry, skirting and closed joints. Escape surface stays unobstructed.
 B(-3.99,.08,-4.84,3.99,1.1,-4.80,'#7c8987');
 B(-4.01,.08,-4.78,-3.97,1.1,.84,'#7c8987');
 B(-4,.0,-4.79,4,.12,-4.73,'#606b6a');
 B(-4.01,3.0,-4.85,-3.86,3.14,1.03,'#929b9c');
 B(3.87,3.0,-4.85,4.01,3.14,1.03,'#929b9c');
 // Fill the missing lintel above the cell bars and partition corners.
 B(-4.18,2.98,.87,4.18,3.15,1.15,'#939c9e');
 B(-5.84,0,6.96,-1.08,.12,7.0,'#657074');B(1.08,0,6.96,5.84,.12,7.0,'#657074');
 for(const sx of [-1,1])B(sx>0?4.12:-5.84,0,1.14,sx>0?5.84:-4.12,.12,1.18,'#657074');
 // Steel bunk: four posts, ladder, thin mattresses, pillows and folded blankets.
 // v77: beliche de solteiro (1,05 m de largura = sprite deitado + folga), antes tinha 2 m e parecia cama de casal
 for(const x of [-3.7,-1.42])for(const z of [-4.5,-3.52])B(x,0,z,x+.07,2.05,z+.07,'#4b555d');
 for(const y of [.53,1.63]){
  B(-3.7,y,-4.5,-1.35,y+.11,-3.45,'#505c62');
  B(-3.58,y+.11,-4.42,-1.47,y+.25,-3.53,'#b7b6aa');
  B(-3.5,y+.25,-4.3,-2.98,y+.34,-3.65,'#d2cdbc');
  B(-2.4,y+.25,-4.41,-1.48,y+.3,-3.54,'#7e9291');
  for(const z of [-4.49,-3.49])B(-3.65,y+.32,z,-1.4,y+.37,z+.045,'#626d71');
 }
 for(const x of [-2.12,-1.65])B(x,.04,-3.4,x+.045,1.96,-3.35,'#687275');
 for(let y=.25;y<1.9;y+=.32)B(-2.12,y,-3.42,-1.6,y+.045,-3.34,'#7d8587');
 // Wall-mounted shelf replaces the old narrow bed protruding through the partition.
 B(-3.96,1.38,-.4,-3.48,1.46,.5,'#8d7c67');
 for(const z of [-.28,.32])B(-3.96,1.1,z,-3.65,1.38,z+.04,'#636d70');
 B(-3.84,1.46,-.25,-3.6,1.58,.12,'#b5ad95');B(-3.83,1.58,-.23,-3.62,1.65,.09,'#8d9893');
 // Compact stainless toilet and basin, tucked against rear wall.
 B(2.72,0,-4.27,3.17,.32,-3.7,'#8d999d');
 B(2.52,.32,-4.36,3.38,.5,-3.45,'#b4bec0');
 B(2.62,.5,-4.25,3.28,.55,-3.55,'#626f75');
 B(2.73,.55,-4.12,3.17,.56,-3.66,'#43535d');
 B(2.62,.32,-4.78,3.32,1.15,-4.36,'#a9b3b5');B(2.66,1.15,-4.76,3.28,1.2,-4.38,'#c3cbcd');B(2.9,1.2,-4.6,3.04,1.24,-4.5,'#7c8a8f');
 B(1.12,.76,-4.73,2.16,.9,-4.14,'#bbc3bf');B(1.46,0,-4.66,1.82,.76,-4.34,'#a7b0ac');B(1.4,0,-4.7,1.88,.06,-4.3,'#8e9894');
 B(1.24,.9,-4.62,2.04,.93,-4.25,'#6d838a');
 B(1.58,.92,-4.65,1.64,1.19,-4.59,'#c3ccc6');B(1.58,1.15,-4.65,1.64,1.21,-4.4,'#c3ccc6');
 B(1.06,1.35,-4.79,2.2,2.1,-4.74,'#515e63');B(1.12,1.41,-4.735,2.14,2.04,-4.72,'#99aeb3');
 // High recessed barred window (decorative; does not change escape logic).
 B(-.85,2.02,-4.79,.85,2.82,-4.71,'#56656f');B(-.76,2.1,-4.7,.76,2.74,-4.68,'#8dabb7');
 for(const x of [-.6,-.3,0,.3,.6])B(x-.025,2.06,-4.65,x+.025,2.78,-4.61,'#58656c');
 B(-.92,1.98,-4.78,.92,2.06,-4.55,'#aeb5b3');
 // Compact fluorescent housings, conduits and end caps, instead of broad white slabs.
 for(const z of [-2.6,3.2,8.4]){
  B(-1.15,3.02,z-.23,1.15,3.14,z+.23,'#68747b');
  B(-1.04,2.99,z-.14,1.04,3.02,z+.14,'#d4d8c9');
  for(const x of [-1.08,1.02])B(x,2.97,z-.2,x+.06,3.05,z+.2,'#899395');
 }
 B(-.025,3.11,-4.8,.025,3.14,10,'#7c8688');
 // Corridor furniture stays outside the unchanged guard patrol at x +/-4.7.
 B(5.15,.72,3.1,5.78,.83,4.8,'#8d7964');
 for(const z of [3.2,4.6])B(5.2,0,z,5.29,.72,z+.08,'#606a70');
 B(5.32,.83,3.35,5.64,.89,3.86,'#d7d1bc');B(5.35,.89,3.39,5.61,.92,3.82,'#b6c0ba');
 B(5.28,0,5.05,5.73,.43,5.56,'#64727b');B(5.65,.43,5.05,5.75,.91,5.56,'#81918e');
 B(-5.85,0,3.3,-5.15,2.1,5.15,'#7e8a8c');
 for(const z of [3.35,4.25]){B(-5.14,.1,z,-5.12,2.03,z+.83,'#939e9d');B(-5.1,1.03,z+.67,-5.07,1.22,z+.72,'#46565e');for(let y=1.6;y<1.9;y+=.09)B(-5.105,y,z+.15,-5.09,y+.025,z+.6,'#67787c')}
 // Bench moved against the rear wall, clear of the patrol's diagonal return leg.
 B(-4.1,.38,6.5,-2,.48,6.88,'#87908a');B(-4.1,.48,6.83,-2,.95,6.9,'#8a958e');
 for(const x of [-3.95,-2.2])B(x,0,6.55,x+.09,.38,6.85,'#55616a');
 // Cell number backed by a small metal plaque on the grille, not floating over it.
 B(-.79,2.5,.87,.79,2.82,1.15,'#495861');
 // porta do fundo por onde o guarda some
 mb.box(X-1.02,0,Z+7.01,X+1.02,.12,Z+7.12,C('#2e3440')); // soleira
 mb.box(X-1.12,0,Z+6.97,X-1.0,2.35,Z+7.19,dark);mb.box(X+1.0,0,Z+6.97,X+1.12,2.35,Z+7.19,dark); // batentes (v77: saltam da parede, sem z-fight)
 mb.box(X-1.12,2.3,Z+6.97,X+1.12,2.44,Z+7.19,dark); // verga
 // Door visibly open against jamb; guard route is unaltered.
 B(.88,0,7.18,.96,2.18,8.94,'#6b6456');B(.85,1.03,8.7,.99,1.16,8.8,'#b9b39a');
 g.add(mb.mesh(roomLitMat(JAIL_ROOM(X,Z),{side:THREE.DoubleSide}))); // v77: cela aconchegante/quente, com umidade e manchas leves
 // janelas/aberturas pequenas e placas
 jailText('CELA 01',X,2.66,Z+1.16,1.45,.24);jailText('SAÍDA / DELEGACIA',X,2.7,Z+6.95,2.9,.34);JAIL.grp.children[JAIL.grp.children.length-1].rotation.y=Math.PI; // v77: placa virada para o corredor (antes lia espelhada)
 // v77: colisão dos móveis (antes o jogador atravessava beliche, vaso, pia, mesa, armário e banco)
 for(const c of JAIL.cols||[])c.dead=true;JAIL.cols=[];{const cc=curChunk;curChunk=null;try{for(const[a,b,c,d] of [[-3.75,-4.6,-1.3,-3.3],[2.5,-4.85,3.42,-3.42],[1.08,-4.85,2.2,-4.1],[5.1,3.05,5.85,4.85],[5.24,5.0,5.85,5.6],[-5.85,3.28,-5.12,5.17],[-4.15,6.45,-1.95,7.0]])JAIL.cols.push(addCol(X+a,Z+b,X+c,Z+d,'jail'))}finally{curChunk=cc}}
 const ch=makeCharacter({cap:'#202530',capDark:'#141820',skin:'#bd8e6b',hair:'#171717',shirt:'#243b67',pants:'#202c44',shoes:'#101218',belt:'#111111',stripe:'#899ebf'});
 JAIL.guard={...ch,x:X,z:Z+4,gy:0,mx:1,mz:0};JAIL.arrowIn.position.set(X,1.5,Z+6.15);JAIL.lock=0;JAIL.locked=false;JAIL.left=0;JAIL.exitHold=false;
}
function jailWear(on){
 const ch=CHAR.list[CHAR.cur];
 if(on){if(!ch.jailLook)ch.jailLook={...PLAYER_PAL};Object.assign(PLAYER_PAL,{shirt:'#f07818',pants:'#f07818',belt:'#f07818',stripe:null,art:null,cap:null,capDark:null,bag:null,pack:false,glasses:null,necklace:null,headphone:null,swim:null});}
 else{if(!ch.jailLook)return;Object.assign(PLAYER_PAL,ch.jailLook);delete ch.jailLook;}
 ch.look={...PLAYER_PAL};applyPlayerLook();charFaces();
}
function jailEnter(locked){if(locked&&!PROLOGUE.allowJail&&storyMissionFail('VOCÊ FOI PRESO'))return;if(!JAIL.IN)buildJail();if(JAIL.grp)JAIL.grp.visible=true;if(locked)storyClearObjective();if(PL.car){PL.car.thr=0;PL.car.hand=true;PL.lastCar=PL.car;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}
 if(locked)jailWear(true);fadeFlash();PL.dead=false;PL.deadT=0;PL.down=0;PL.rot=0;PL.jy=PL.jv=0;PL.hp=Math.max(30,PL.hp);PL.vx=PL.vz=0;DOOR.from=null;if(city.polDoor)doorEnter('jail',locked?'pol:preso':'pol',city.polDoor,[0,1]);PL.inside='jail';JAIL.locked=!!locked;JAIL.left=locked?300:0;JAIL.bail=Math.max(500,Math.round((PL.money||0)*.15));JAIL.dig=0;JAIL.spoon=false;JAIL.held=0;JAIL.gs=0;JAIL.gHide=4;JAIL.click=0;JAIL.mateSaid=false;JAIL.lock=1;JAIL.lastReal=performance.now();
 PL.x=JAIL.IN.x;PL.z=JAIL.IN.z+(locked?-1.3:4.1);PL.face=[0,1];PL.yaw=0;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x,2.3,PL.z+3);
 if(locked){const lm=(city.lms||[]).find(l=>l.name==='pol');if(lm&&!city.polDoor){const c=chunkOf(lm.x,lm.z);try{buildChunk(c[0],c[1])}catch(e){console.error(e)}}gunReset();for(const q of peds.slice())if(q.cop)removePed(q);if(!PROLOGUE.rearrest)toast('PRESO · 5 MINUTOS<br><small>ARMAS CONFISCADAS · FIANÇA: $'+JAIL.bail.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+' NA GRADE · ou fuja…</small>')}else toast('DELEGACIA · VISITANTES')}
/* ---------- Fuga da cela ----------
   O guarda anda em U pelo corredor e some pela porta por alguns segundos. Depois de 1 min preso, o colega de cela
   te dá uma colher. Fora da vista do guarda, no canto da parede (marca na parede), clique/E/R (R2/□ no controle)
   para cavar: 30 s de cavação. Se o guarda vir você cavando, a pena volta a 5 minutos. Túnel pronto = fuga para um beco. */
const JAIL_PATH=[[0,6.5],[-4.7,6.0],[-4.7,2.0],[4.7,2.0],[4.7,6.0],[0,6.5]];
function jailGuardMove(q,X,Z,dt){if(JAIL.gHide>0){JAIL.gHide-=dt;JAIL.gVis=false;q.x=X;q.z=Z+6.6;return}JAIL.gVis=true;
 let s=(JAIL.gs||0)+dt*1.5,i=0;const seg=JAIL_PATH.slice(1).map((p,k)=>Math.hypot(p[0]-JAIL_PATH[k][0],p[1]-JAIL_PATH[k][1])),tot=seg.reduce((a,b)=>a+b,0);
 if(s>=tot){JAIL.gs=0;JAIL.gHide=7+Math.random()*7;JAIL.gVis=false;return}JAIL.gs=s;while(i<seg.length-1&&s>seg[i]){s-=seg[i];i++}const a=JAIL_PATH[i],b=JAIL_PATH[i+1],t=Math.min(1,s/seg[i]);
 q.x=X+a[0]+(b[0]-a[0])*t;q.z=Z+a[1]+(b[1]-a[1])*t;q.mx=b[0]-a[0];q.mz=b[1]-a[1];const l=Math.hypot(q.mx,q.mz)||1;q.mx/=l;q.mz/=l}
function jailResetDig(){
 JAIL.dig=0;JAIL.click=0;
 if(JAIL.hole){JAIL.hole.visible=false;JAIL.hole.scale.set(.12,.12,1)}
 if(JAIL.holeShade){JAIL.holeShade.visible=false;JAIL.holeShade.scale.set(.15,.15,1)}
 if(JAIL.holeMat){JAIL.holeMat.color.set('#5a4330');JAIL.holeMat.opacity=.52}
 if(JAIL.mark){JAIL.mark.visible=true;JAIL.mark.scale.set(.75,.75,1);if(JAIL.mark.material){JAIL.mark.material.opacity=.53;JAIL.mark.material.color.set('#8d7558')}}
}
// v78: colega de cela criada/posicionada fora do tick — a cutscene da cela (diálogo) já a mostra desde o começo
function jailMateSync(){if(!JAIL.IN)return;const X=JAIL.IN.x,Z=JAIL.IN.z;
 if(!JAIL.mate){const ch=makeCharacter({cap:null,capDark:null,skin:'#8d5524',hair:'#1a1010',shirt:'#e87a1a',pants:'#e87a1a',shoes:'#222',belt:'#c86a10',stripe:null});JAIL.mate={...ch,x:X-2.4,z:Z-1.2,gy:0,mx:1,mz:0}}
 const m=JAIL.mate;m.sp.visible=m.sh.visible=PL.inside==='jail';if(m.sp.visible){const dx=PL.x-m.x,dz=PL.z-m.z;setFrame(m.tex,pickDir(dx,dz,m.x,m.z),0);placeSprite(m)}}
function jailEscapeTick(dt){const el=$('#jailp');if(!JAIL.IN)return;const on=PL.inside==='jail'&&JAIL.locked,X=JAIL.IN.x,Z=JAIL.IN.z;
 jailMateSync();
 if(!JAIL.hole){
  const hm=new THREE.MeshBasicMaterial({map:JAIL.holeTex,transparent:true,depthWrite:false,color:0x5a4330,alphaTest:.05,side:THREE.DoubleSide});
  const g=new THREE.Mesh(new THREE.PlaneGeometry(1.35,1.25),hm);g.rotation.y=-Math.PI/2;g.position.set(X+3.99,.56,Z-2.4);JAIL.grp.add(g);JAIL.hole=g;JAIL.holeMat=hm;
  JAIL.holeShade=null;
  const mkm=new THREE.MeshBasicMaterial({map:JAIL.holeTex,transparent:true,depthWrite:false,color:0x5c4e3c,opacity:.55,alphaTest:.03,side:THREE.DoubleSide});
  const mk=new THREE.Mesh(new THREE.PlaneGeometry(.62,.62),mkm);mk.rotation.y=-Math.PI/2;mk.position.set(X+3.97,.42,Z-2.4);JAIL.grp.add(mk);JAIL.mark=mk;
  for(const [i,m] of [g,mk].entries()){m.renderOrder=2+i;m.material.polygonOffset=true;m.material.polygonOffsetFactor=-1;m.material.polygonOffsetUnits=-1;}
 }
 const k=clamp((JAIL.dig||0)/30,0,1),s=.12+.98*k;if(JAIL.hole){JAIL.hole.scale.set(s,s,1);JAIL.hole.visible=k>.01;if(JAIL.holeMat){JAIL.holeMat.color.set(k<.33?'#5a4330':k<.66?'#3e2a1a':'#1e140c');JAIL.holeMat.opacity=.52+.44*k}}if(JAIL.holeShade){JAIL.holeShade.scale.set(.15+.8*k,.15+.8*k,1);JAIL.holeShade.visible=k>.03;JAIL.holeShade.material.opacity=.18+.62*k}if(JAIL.mark){JAIL.mark.visible=k<.98;JAIL.mark.scale.set(.55+.2*(1-k),.55+.2*(1-k),1);if(JAIL.mark.material){JAIL.mark.material.opacity=.45*(1-k)+.08;JAIL.mark.material.color.set(k<.5?'#5c4e3c':'#45392c')}}
 if(!on){if(el)el.hidden=true;return}
 const m=JAIL.mate||PL; /* v78: 'm' não existia → ReferenceError na cela */
 JAIL.held=(JAIL.held||0)+dt;if(!JAIL.spoon&&JAIL.held>=60){JAIL.spoon=true;toast('O COLEGA DE CELA TE PASSOU UMA COLHER');say(m,'Usa a colher pra cavar um túnel de fuga. Ali no canto!',4.5)}
 if(!JAIL.mateSaid&&JAIL.held>2){JAIL.mateSaid=true;say(m,'Novato, é? Espera um pouco que eu te arrumo algo…',4)}
 const near=Math.hypot(PL.x-(X+3.55),PL.z-(Z-2.4))<1.2,digging=near&&JAIL.spoon&&performance.now()-(JAIL.click||0)<400;
 if(digging){if(JAIL.gVis){JAIL.left=300;jailResetDig();toast('<span style="color:#ff4a4a">O GUARDA TE PEGOU CAVANDO!</span>');say(JAIL.guard,'EI! O QUE TÁ FAZENDO AÍ?!',3);clang(.2)}
  else{JAIL.dig=(JAIL.dig||0)+dt;if(Math.random()<dt*6)emit(X+3.9,.4,Z-2.4,-1-Math.random(),1+Math.random(),(Math.random()-.5),.5,.15,.05,0x4a3e30,false,.75);if(JAIL.dig>=30){jailEscape();return}}}
 if(el){const mm=Math.floor(JAIL.left/60),ss=Math.floor(JAIL.left%60),warn=!JAIL.gVis&&JAIL.gHide<2.2;
  // v78: diz qual botão usar e onde (antes o controle não sabia o que apertar; o △ não cava)
  const key=PAD.on?'✕ ou R2':TOUCH.on?'o botão de ação':'E ou o clique',pct=Math.floor(clamp((JAIL.dig||0)/30,0,1)*100);
  const how=!JAIL.spoon?'espere: o colega de cela vai arrumar algo':!near?'vá até a marca no canto da cela':JAIL.gVis?'pare de cavar até ele sair':'segure '+key+' para cavar';
  el.innerHTML=(JAIL.gVis?'<i>GUARDA OLHANDO</i>':warn?'<em>GUARDA VOLTANDO!</em>':'<b>GUARDA FORA · CAVE!</b>')+'<br><small>'+translatePlain(how)+'</small>'+(JAIL.spoon?'<br>'+translatePlain('TÚNEL')+tbHTML(pct/100,'ok'):'');el.hidden=false}}
function jailEscape(){STATS.escapes++;ostStop(1.5,'cell');if(PROLOGUE.active&&CHAR.cur===1){CHAR.list[1].look={...PLAYER_PAL}}else jailWear(false); /* v78: na missão 1 a Claire foge com o uniforme laranja (jailLook guardado); a loja/fim da missão devolvem a roupa */const p=city.polDoor||{x:PL.x,z:PL.z},pt=INVERT.portal;let best=null,bd=1e9;
 /* v79r11: o beco da fuga tem que ser chão seco — sem água/estuário num raio de 9 m e fora de colisão (antes podia cair num beco colado no canal/foz: a Claire era puxada e se afogava, e o checkpoint repetia a mesma fuga) */
 const dry=(x,z)=>{if(inWater(x,z)||(typeof estuaryAt==='function'&&estuaryAt(x,z)))return false;for(let k=0;k<12;k++){const a=k/12*6.2832;for(const r of [4,9]){const xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;if(inWater(xx,zz)||(typeof estuaryAt==='function'&&estuaryAt(xx,zz)))return false}}return !query(x,z,.6).some(b=>!b.dead&&!b.low&&x>b.x0-.5&&x<b.x1+.5&&z>b.z0-.5&&z<b.z1+.5)};
 for(const q of city.catSpots||[]){if(q.residential)continue;const r=q.r,x=(r[0]+r[2])/2,z=(r[1]+r[3])/2,d=Math.hypot(x-p.x,z-p.z);if(d<35||d>220)continue;if(!dry(x,z))continue;if(pt&&Math.hypot(pt.x-x,pt.z-z)<80)continue;if(pickups.some(k=>k.kind!=='hp'&&k.kind!=='cash'&&k.kind!=='armor'&&Math.hypot(k.x-x,k.z-z)<30))continue;if(d<bd){bd=d;best={x,z}}}
 if(!best){for(let rr=30;rr<=120&&!best;rr+=6)for(let k=0;k<16&&!best;k++){const a=k/16*6.2832,x=p.x+Math.cos(a)*rr,z=p.z+Math.sin(a)*rr;if(x>0&&z>0&&x<city.ext&&z<city.ext&&dry(x,z))best={x,z}}}if(!best)best={x:p.x,z:p.z};fadeFlash();JAIL.locked=false;JAIL.left=0;JAIL.dig=0;JAIL.spoon=false;JAIL.held=0;PL.inside=false;DOOR.from=null;PL.x=best.x;PL.z=best.z;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z;JAIL.lock=1;JAIL.exitHold=true;
 const el=$('#jailp');if(el)el.hidden=true;toast('<span style="color:#7dff8a">VOCÊ FUGIU!</span>');clang(.4)}
function jailExit(){if(JAIL.locked)return;jailWear(false);fadeFlash();PL.inside=false;if(!doorExit(null)){const p=city.polDoor;if(p){PL.x=p.x;PL.z=p.z}else{const lm=(city.lms||[]).find(l=>l.name==='pol');if(lm){PL.x=lm.x;PL.z=lm.z+13}}PL.vx=PL.vz=0;PL.face=[0,1];PL.yaw=0}JAIL.lock=1;JAIL.exitHold=true;camT.x=PL.x;camT.z=PL.z;toast('VOCÊ SAIU DA DELEGACIA')}
function jailRelease(paid){if(!JAIL.locked)return;jailWear(false);JAIL.locked=false;JAIL.left=0;JAIL.lock=1;if(JAIL.IN){PL.x=JAIL.IN.x;PL.z=JAIL.IN.z+1.75;PL.vx=PL.vz=0}if(paid){money(-JAIL.bail);toast('FIANÇA PAGA · −$'+JAIL.bail.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+'<br><small>você pode sair pela seta da delegacia</small>')}else toast('PENA CUMPRIDA · VOCÊ ESTÁ LIVRE<br><small>saia pela seta amarela no corredor</small>')}
addEventListener('mousedown',()=>{if(PL.inside==='jail')JAIL.click=performance.now()});addEventListener('keydown',e=>{if(PL.inside==='jail'&&(e.code==='KeyE'||e.code==='KeyR'))JAIL.click=performance.now()});
function jailBail(){if(PL.inside!=='jail'||!JAIL.locked||!JAIL.IN)return false;const X=JAIL.IN.x,Z=JAIL.IN.z;if(Math.abs(PL.x-X)>3.85||Math.abs(PL.z-(Z+.85))>1.7){toast(PROLOGUE.active&&PROLOGUE.stage==='escape'?'CAVE NO CANTO: SEGURE '+(PAD.on?'✕ OU R2':'E'):'FIANÇA: VÁ ATÉ AS GRADES');return true}if(PROLOGUE.active&&PROLOGUE.stage==='escape'){toast('CLAIRE PRECISA FUGIR PELO TÚNEL');return true;}if((PL.money||0)<JAIL.bail){toast('FIANÇA $'+JAIL.bail.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+' · DINHEIRO INSUFICIENTE');return true}jailRelease(true);return true}
/* v78: relógio da pena no canto (m:ss). O guarda pegando cavando volta a 5:00 e zera o túnel (jailResetDig). */
function tbHTML(f,cls){f=clamp(f,0,1);return '<span class="tb'+(cls?' '+cls:(f<.25?' warn':''))+'"><i style="width:'+(f*100).toFixed(1)+'%"></i></span>'}
const TBAR={own:null,t:0};function tbarShow(own,label,f){const el=$('#tbar');if(!el)return;TBAR.own=own;TBAR.t=simT;const L=translatePlain(label);if(el.firstChild.textContent!==L)el.firstChild.textContent=L;const fc=clamp(f,0,1),i=el.lastChild;i.className='tb'+(fc<.25?' warn':'');i.firstChild.style.width=(fc*100).toFixed(1)+'%';el.hidden=false}
function tbarHide(own){if(TBAR.own===own){$('#tbar').hidden=true;TBAR.own=null}}
function jailClockSync(){const el=$('#jailClock');if(!el)return;const on=played&&PL.inside==='jail'&&JAIL.locked&&!menuOpen;if(el.hidden===on)el.hidden=!on;if(!on)return;JAIL.full=Math.max(JAIL.full||300,JAIL.left);const f=clamp(JAIL.left/JAIL.full,0,1),b=el.lastChild;b.className='tb fill'+(f<.15?' ok':'');b.firstChild.style.width=(f*100).toFixed(2)+'%'} // v78: pena = barra que esvazia; guarda pegando → reenche (transição)
function jailTick(dt){try{jailClockSync()}catch(e){}if(PROLOGUE.active&&PROLOGUE.stage==='escape')JAIL.left=Math.max(120,JAIL.left);if(!JAIL.IN)return;const nowReal=performance.now(),realDt=JAIL.lastReal?Math.min(.06,(nowReal-JAIL.lastReal)/1000):dt;JAIL.lastReal=nowReal;JAIL.lock=Math.max(0,JAIL.lock-dt);if(JAIL.arrowOut){const p=city.polDoor;if(p&&JAIL.exitHold&&Math.hypot(PL.x-p.x,PL.z-p.z)>2.8)JAIL.exitHold=false;JAIL.arrowOut.visible=!!p&&!PL.inside&&!PL.car&&!PL.dead&&Math.hypot(PL.x-p.x,PL.z-p.z)<180;if(p){JAIL.arrowOut.position.set(p.x,1.5+Math.sin(simT*3)*.18,p.z);JAIL.arrowOut.rotation.y=simT*1.8}}
 if(JAIL.arrowIn){JAIL.arrowIn.visible=PL.inside==='jail'&&!JAIL.locked;JAIL.arrowIn.position.y=1.5+Math.sin(simT*3)*.18;JAIL.arrowIn.rotation.y=simT*1.8}
 const q=JAIL.guard,X=JAIL.IN.x,Z=JAIL.IN.z;if(q){jailGuardMove(q,X,Z,realDt);q.gy=0;setFrame(q.tex,pickDir(q.mx,q.mz,q.x,q.z),Math.floor(simT*5)%4===1?1:Math.floor(simT*5)%4===3?2:0);placeSprite(q);const near=PL.inside==='jail'&&JAIL.gVis;q.sp.visible=q.sh.visible=near}
 jailEscapeTick(realDt);
 if(PL.inside==='jail'){if(JAIL.locked){JAIL.left=Math.max(0,JAIL.left-realDt);if(JAIL.left<=0)jailRelease(false)}
 // Limites físicos da cela. A grade não é atravessável enquanto preso.
 PL.x=clamp(PL.x,X+(JAIL.locked?-3.7:-5.55),X+(JAIL.locked?3.7:5.55));PL.z=clamp(PL.z,Z+(JAIL.locked?-4.55:1.4),Z+(JAIL.locked?.55:6.7));
 if(!JAIL.locked&&JAIL.lock<=0&&Math.hypot(PL.x-X,PL.z-(Z+6.15))<1.05)jailExit();return}
 if(!PL.inside&&!PL.dead&&!PL.car&&JAIL.lock<=0&&city.polDoor&&!POL.wanted&&!JAIL.exitHold&&Math.hypot(PL.x-city.polDoor.x,PL.z-city.polDoor.z)<1.15)jailEnter(false)
}

