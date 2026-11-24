'use strict';
/* Coastal Chaos · js/31-casa-segura-assalto.js — Casa segura (setas amarelas), assalto a residências, casa de penhores, polícia (níveis, blitz), jet ski.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= SAFE HOUSE + SAVE ================= */
const SAFE={arrowOut:null,arrowIn:null,grp:null,IN:null,lock:0,tvT:0,saveT:20};
const _arrRay=new THREE.Raycaster(),_arrO=new THREE.Vector3(),_arrD=new THREE.Vector3(0,-1,0);
var ARROW_MATS=[]; /* v79r5: materiais das setas amarelas (portas/interiores) — o modo foto esconde todas */
function makeArrow(){const g=new THREE.Group();const m=new THREE.MeshBasicMaterial({color:0xffd21a,depthTest:true,depthWrite:true});ARROW_MATS.push(m);if(typeof PHOTO!=='undefined'&&PHOTO.on)m.visible=false;const c=new THREE.Mesh(new THREE.ConeGeometry(.42,.9,4),m);c.rotation.x=Math.PI;const b=new THREE.Mesh(new THREE.BoxGeometry(.32,.6,.32),m);b.position.y=.7;g.add(c,b);
 const ring=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:glowTex,color:0xffc81a,transparent:true,blending:THREE.AdditiveBlending,depthTest:true,depthWrite:false,opacity:.8,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));ARROW_MATS.push(ring.material);ring.rotation.x=-Math.PI/2;ring.position.y=-1.15;g.add(ring);
 /* v78: a luz da seta fica rente ao chão e parada — só a seta sobe e desce. O centro do balanço (média do pico e do vale da altura
    da seta) menos a altura de repouso (1,5 m; userData.rest muda) dá o piso; a mancha fica 3 cm acima (sem z-fight, com polygonOffset). */
 ring.onBeforeRender=function(){const u=g.userData;if(u.ringFixed)return;const x=g.position.x,y=g.position.y,z=g.position.z;
  if(u.floorRay){ // v78: piso real por raio (ex.: seta-guia do shopping sobre a escada) — a luz fica parada no degrau/piso, só a seta balança
   if(u.fx===undefined||Math.abs(x-u.fx)+Math.abs(z-u.fz)>.05||Math.abs(y-(u.fyc??y))>1){u.fx=x;u.fz=z;u.fyc=y;const grp=u.floorRay();u.fy=null;if(grp){_arrRay.set(_arrO.set(x,y,z),_arrD);const h=_arrRay.intersectObject(grp,true).find(q=>q.object.visible!==false&&q.object.isMesh&&!q.object.isSprite);if(h)u.fy=h.point.y}}
   if(u.fy!=null){ring.position.y=u.fy+.03-y;ring.updateMatrix();ring.matrixWorld.multiplyMatrices(g.matrixWorld,ring.matrix);ring.modelViewMatrix.multiplyMatrices(arguments[2].matrixWorldInverse,ring.matrixWorld);ring.normalMatrix.getNormalMatrix(ring.modelViewMatrix);return}}
  if(u.lx===undefined||Math.abs(x-u.lx)+Math.abs(z-u.lz)>.3||y>u.hi+.45||y<u.lo-.45){u.hi=u.lo=y}u.lx=x;u.lz=z;if(y>u.hi)u.hi=y;if(y<u.lo)u.lo=y;
  ring.position.y=(u.hi+u.lo)/2-(u.rest||1.5)+.03-y;ring.updateMatrix();ring.matrixWorld.multiplyMatrices(g.matrixWorld,ring.matrix);ring.modelViewMatrix.multiplyMatrices(arguments[2].matrixWorldInverse,ring.matrixWorld);ring.normalMatrix.getNormalMatrix(ring.modelViewMatrix)};
 g.visible=false;scene.add(g);return g}
function applySafeSlots(sl){city.safe.slots=sl;if(!SAFE.pads)SAFE.pads=[];for(let i=0;i<2;i++){if(!SAFE.pads[i]){const mb=new MB(),y=COL('#ffd21a');mb.box(-2.9,0,-1.6,2.9,.06,-1.45,y);mb.box(-2.9,0,1.45,2.9,.06,1.6,y);mb.box(-2.9,0,-1.6,-2.75,.06,1.6,y);mb.box(2.75,0,-1.6,2.9,.06,1.6,y);
    const mark=new MB();mark.box(-.9,0,-.7,-.6,.07,.7,y);mark.box(-.9,0,-.7,.5,.07,-.4,y);mark.box(-.9,0,-.1,.5,.07,.2,y);mark.box(.2,0,-.7,.5,.07,.2,y);SAFE.pads[i]=mb.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));const letter=mark.mesh(new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));letter.rotation.x=0;letter.rotation.y=-Math.PI/2;// v273: letra P centrada no centro geometrico da vaga, sem deslocamento lateral.
    letter.position.set(0,.03,.2);SAFE.pads[i].add(letter);scene.add(SAFE.pads[i])}
   const q=sl[i];SAFE.pads[i].visible=!!q&&S.style!=='inverted';if(q){SAFE.pads[i].position.set(q.x,groundY(q.x,q.z)+.04,q.z);SAFE.pads[i].rotation.y=-q.a}}}
function setSafeDoor(x,z,face){if(city.haze)SAFE.slotsNext=[];const n=face==='n'?[0,-1]:face==='s'?[0,1]:face==='e'?[1,0]:[-1,0];city.safe={x:x+n[0]*1.4,z:z+n[1]*1.4,nx:n[0],nz:n[1],door:[x,z]};
 {let sl=SAFE.slotsNext||city.garSlots;SAFE.slotsNext=null;SAFE.lastSide=!!sl;const tg=[-n[1],n[0]];
  if(!sl){sl=[];for(const k of [5.5,11.5,-5.5,-11.5]){if(sl.length>=2)break;const gx=x+n[0]*2.4+tg[0]*k,gz=z+n[1]*2.4+tg[1]*k;if(!inWater(gx,gz)&&!query(gx,gz,3).some(b=>!b.dead&&(b.kind==='bld'||b.kind==='rock'||b.kind==='tree'||b.kind==='pole')&&gx>b.x0-2.6&&gx<b.x1+2.6&&gz>b.z0-1.2&&gz<b.z1+1.2))sl.push({x:gx,z:gz,a:Math.atan2(tg[1],tg[0])})}}
  applySafeSlots(sl)}if(SAFE.arrowOut){SAFE.arrowOut.position.set(city.safe.x,1.5,city.safe.z)}}
function ibox(mb,x0,y0,z0,x1,y1,z1,col){mb.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,[0,0,1,1],col);const c2=col.clone().multiplyScalar(.8),c3=col.clone().multiplyScalar(.66);
 if(y0>.5)mb.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],0,-1,0,[0,0,1,1],c3);
 mb.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0,[0,0,1,1],c2);mb.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0,[0,0,1,1],c2);
 mb.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1,[0,0,1,1],c3);mb.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1,[0,0,1,1],c3)}
/* ================= ASSALTO A RESIDÊNCIAS + CASA DE PENHORES =================
   Das 22h às 8h, setas aparecem em casas aleatórias da zona residencial. Lá dentro: 10 s para pegar TV,
   micro-ondas, DVD e celular (cada um vale $20–150) e sair, senão a polícia é chamada. Algumas casas têm
   cachorro bravo no quintal. Os objetos só viram dinheiro na casa de penhores (1 por cidade, num beco).
   Interiores: 5 versões da casa segura (cores e lado espelhado diferentes), construídas sob demanda. */
const HEIST={list:[],arrows:[],night:-1,robbed:new Set(),loot:[],cur:null,t:0,alarm:false,lock:0,IN:{},built:{},items:[],pawn:null,pawnIN:null,pawnGrp:null,pawnArr:null,pawnArrIn:null,pawnT:0,pawnAlarm:false,clerk:null,dogs:new Set()};
const HEIST_VAR=[{wall:'#d8cdb8',wall2:'#c9bfa8',floor:'#9a7048',mir:false},{wall:'#b8d0c8',wall2:'#a8c0b8',floor:'#6a5a48',mir:true},{wall:'#e8c8c0',wall2:'#d8b8b0',floor:'#8a6a5a',mir:false},{wall:'#c8c8e0',wall2:'#b8b8d0',floor:'#5a4a3a',mir:true},{wall:'#e8e0a8',wall2:'#d8d098',floor:'#a88058',mir:false}];
const LOOT_NM={tv:'TV',mic:'MICRO-ONDAS',dvd:'DVD PLAYER',cel:'CELULAR',joia:'JOIAS',lap:'NOTEBOOK',perf:'PERFUME',sec:'SECADOR',liq:'LIQUIDIFICADOR',caf:'CAFETEIRA',vg:'VIDEOGAME',gra:'DINHEIRO'};
function heistNight(){const hh=Math.floor(DN.tod/60)%24;return hh>=22||hh<8}
function heistReset(){houseDispose(HEIST.house);HEIST.house=null;HEIST.built={};HEIST.list=[];HEIST.night=-1;HEIST.robbed=new Set();HEIST.dogs=new Set();HEIST.cur=null;HEIST.items=[];if(HEIST.grps)for(const k in HEIST.grps){scene.remove(HEIST.grps[k]);disposeGroup(HEIST.grps[k])}HEIST.grps={};
 for(const a of HEIST.arrows)a.visible=false;if(HEIST.pawnGrp){scene.remove(HEIST.pawnGrp);disposeGroup(HEIST.pawnGrp);HEIST.pawnGrp=null}HEIST.pawn=null;HEIST.pawnPending=!city.haze}
function lootModel(kind){const g=new THREE.Group(),B=(w,h,d,col,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:col}));m.position.set(x,y,z);g.add(m);return m};
 // modelos de frente para -x (lado de onde o jogador chega no rack/balcão)
 if(kind==='tv'){B(.07,.82,1.42,0x18181c,0,.5,0);B(.01,.72,1.32,0x26405a,-.04,.5,0);B(.01,.2,.5,0x3a5a7a,-.045,.62,-.3);B(.05,.18,.08,0x18181c,.02,.05,0);B(.26,.03,.5,0x26262c,.02,0,0);B(.01,.03,.03,0xff3a3a,-.04,.13,.62)}
 else if(kind==='mic'){B(.42,.3,.58,0xe8e8ea,0,.15,0);B(.01,.22,.36,0x1a1a20,-.212,.15,-.06);B(.01,.22,.12,0x2a2a30,-.212,.15,.2);for(let i=0;i<3;i++)B(.01,.025,.06,0x7dff8a,-.216,.22-i*.05,.2);B(.02,.2,.02,0xb0b0b8,-.22,.15,.12)}
 else if(kind==='dvd'){B(.32,.07,.44,0x141418,0,.035,0);B(.01,.012,.26,0x050508,-.162,.045,-.04);B(.01,.012,.012,0x3dff6a,-.163,.035,.17);B(.01,.02,.05,0x5a5a62,-.163,.035,.12);B(.3,.005,.42,0x2a2a32,0,.072,0)}
 else if(kind==='joia'){B(.2,.12,.28,0x5a1a2a,0,.06,0);B(.21,.02,.29,0xd8b040,0,.125,0);B(.01,.04,.06,0xd8b040,-.105,.08,0);B(.04,.012,.04,0x7ad8f0,-.02,.14,.06);B(.03,.012,.03,0xf0f0f0,.03,.14,-.05)}
 else if(kind==='lap'){B(.3,.022,.42,0x2a2a30,0,.011,0);B(.02,.27,.42,0x2a2a30,.15,.15,0);B(.005,.23,.38,0x4a7ac0,.138,.15,0);B(.2,.004,.32,0x1a1a1e,-.03,.024,0)}
 else if(kind==='perf'){B(.08,.13,.08,0xd8a040,0,.065,0);B(.04,.05,.04,0x1a1a1a,0,.155,0);B(.005,.05,.05,0xf0e8d0,-.042,.07,0)}
 else if(kind==='sec'){B(.22,.1,.1,0xd84a8a,0,.2,0);B(.06,.16,.06,0xd84a8a,.05,.08,0);B(.02,.08,.08,0x2a2a2a,-.115,.2,0)}
 else if(kind==='liq'){B(.16,.12,.16,0x2a2a2a,0,.06,0);B(.13,.24,.13,0xb8d8e8,0,.24,0);B(.14,.03,.14,0x1a1a1a,0,.375,0);B(.01,.02,.03,0x7dff8a,-.081,.07,0)}
 else if(kind==='caf'){B(.2,.04,.18,0x1a1a1a,0,.02,0);B(.08,.3,.18,0x1a1a1a,.06,.15,0);B(.2,.05,.18,0x1a1a1a,0,.3,0);B(.11,.1,.11,0x5a3a1a,-.03,.09,0)}
 else if(kind==='vg'){B(.22,.06,.28,0xe8e8ec,0,.03,0);B(.005,.012,.08,0x3a8ae0,-.111,.04,-.06);B(.08,.03,.14,0x2a2a2e,-.05,.075,.22);B(.02,.012,.02,0xe84a4a,-.05,.092,.25)}
 else if(kind==='gra'){B(.08,.05,.16,0x3a8a4a,0,.025,0);B(.082,.052,.025,0xe8e0c0,0,.026,0);B(.08,.05,.16,0x4a9a5a,0,.075,.02)}
 else{B(.09,.014,.17,0x111114,0,.007,0);B(.075,.002,.15,0x2a6ad6,0,.015,0);B(.02,.002,.004,0x444,0,.016,-.07)}
 return g}
/* v77 · CASAS — gerador de interiores residenciais.
   Sala 10×8 m (porta ao sul, mesmas coordenadas de antes) + quarto e banheiro ao norte + cozinha a leste ou
   oeste; às vezes a cozinha divide a ala com um quarto de criança. A safe house usa um layout fixo; cada
   casa roubável sai de uma seed (posição da porta × seed da cidade): layout, cores, móveis e objetos mudam. */
const HOUSE_WALL={living:['#d8cdb8','#b8d0c8','#e8c8c0','#c8c8e0','#e8e0a8','#d0c4b0'],bed:['#c8d4e8','#e8d0d8','#d8e0c8','#e0d4c0','#cfc8e4'],kid:['#bfe0f2','#f2d6a8','#c8eac0','#f0c8d8'],
 kitchen:['#f0ead8','#e8f0e0','#f4e4c8','#e4ecf0'],bath:['#e8eef0','#f0ece4','#e8f0ec','#f2e8ec']};
const HOUSE_TILE={kitchen:[['#e8e8e0','#3a3a40'],['#d8c8a8','#b8a888'],['#e0e4e8','#8a98a8'],['#f0e0c0','#c86a4a']],bath:[['#f2f2f2','#c8d8e0'],['#e8f0f0','#9ac0c8'],['#f4ece4','#d8c0b0'],['#eef2ea','#a8c8a8']]};
const HOUSE_FLOOR={living:['#9a7048','#6a5a48','#8a6a5a','#a88058','#5a4a3a','#b08a60'],bed:['#8a6a4a','#b89a70','#7a6a5a','#8a7a9a','#6a7a8a'],kid:['#9ab0c8','#c8a878','#a8c098']};
const LOOT_VAL={tv:[80,200],lap:[90,220],joia:[60,260],vg:[60,150],mic:[30,70],dvd:[20,50],cel:[30,120],perf:[20,60],sec:[15,40],liq:[15,35],caf:[20,50],gra:[40,180]};
function lootVal(k){const r=LOOT_VAL[k]||[20,150];return r[0]+Math.floor(Math.random()*(r[1]-r[0]+1))}
function houseLayout(seed,safe){const R=mulberry32((seed^0x2c1b3c6d)>>>0),rooms=[{k:'living',x0:-5,z0:-4,x1:5,z1:4}],doors=[];
 const nd=safe?4.6:3.9+R()*1.1,bw=safe?3.4:2.8+R()*.8,bathL=safe?false:R()<.5;
 const bed=bathL?{k:'bed',x0:-5+bw,z0:-4-nd,x1:5,z1:-4}:{k:'bed',x0:-5,z0:-4-nd,x1:5-bw,z1:-4},bath=bathL?{k:'bath',x0:-5,z0:-4-nd,x1:-5+bw,z1:-4}:{k:'bath',x0:5-bw,z0:-4-nd,x1:5,z1:-4};
 rooms.push(bed,bath);
 const kw=safe?4.4:3.9+R()*1.0,side=safe?-1:(R()<.5?-1:1),kid=!safe&&R()<.38,kx0=side<0?-5-kw:5,kx1=side<0?-5:5+kw;
 const kit={k:'kitchen',x0:kx0,z0:kid?0:-4,x1:kx1,z1:4,side};rooms.push(kit);if(kid)rooms.push({k:'kid',x0:kx0,z0:-4,x1:kx1,z1:0,side});
 // portas de 1,1 m: quarto e banheiro na parede norte da sala; cozinha/quarto infantil na parede lateral
 const bc=(bed.x0+bed.x1)/2+(bathL?.9:-.9);doors.push({a:'z',c:-4,s0:bc-.55,s1:bc+.55});
 const bd=bathL?bath.x1-1.5:bath.x0+.4;doors.push({a:'z',c:-4,s0:bd,s1:bd+1.1});
 const kz=side<0?1.6+R()*.7:(kid?.5+R()*2.2:-2.2+R()*4.0);doors.push({a:'x',c:side*5,s0:kz,s1:kz+1.1});
 if(kid){const q=-3.8+R()*.6;doors.push({a:'x',c:side*5,s0:q,s1:q+1.1})}
 return {rooms,doors,bathL,side,kid,R}}
function remCol(c){if(!c)return;c.dead=true;for(const k of c.keys){const l=grid.get(k);if(l){const i=l.indexOf(c);if(i>=0)l.splice(i,1)}}const i=colliders.indexOf(c);if(i>=0)colliders.splice(i,1)}
function houseDispose(h){if(!h)return;for(const c of h.cols)remCol(c);if(h.g){scene.remove(h.g);disposeGroup(h.g)}}
function housePainting(g,R,px,py,pz,ry,w,h){const cvs=cv(64,48),gg=cvs.getContext('2d');const pal=[['#f2a65a','#e85d4a','#3a2a5a','#ffd27a'],['#2a6a8a','#7ac0c8','#f0e8d0','#1a3a4a'],['#3a7a4a','#a8c868','#f2e6a0','#5a3a2a'],['#c83a6a','#2a2a5a','#f0c040','#ffffff']][Math.floor(R()*4)];
 gg.fillStyle=pal[0];gg.fillRect(0,0,64,48);const kind=Math.floor(R()*3);
 if(kind===0){gg.fillStyle=pal[1];gg.fillRect(0,30,64,18);gg.fillStyle=pal[3];gg.beginPath();gg.arc(20+R()*24,26,10,0,7);gg.fill();gg.fillStyle=pal[2];gg.fillRect(0,40,64,8)}
 else if(kind===1){for(let k=0;k<6;k++){gg.fillStyle=pal[1+Math.floor(R()*3)];gg.fillRect(R()*50,R()*36,8+R()*20,6+R()*16)}}
 else{gg.fillStyle=pal[2];gg.beginPath();gg.moveTo(0,48);gg.lineTo(22,14);gg.lineTo(40,36);gg.lineTo(52,22);gg.lineTo(64,48);gg.fill();gg.fillStyle=pal[3];gg.beginPath();gg.arc(48,10,5,0,7);gg.fill()}
 const tex=new THREE.CanvasTexture(cvs);tex.magFilter=THREE.NearestFilter;const fr=new THREE.Mesh(new THREE.BoxGeometry(w+.12,h+.12,.05),new THREE.MeshBasicMaterial({color:0x2a1a10}));fr.position.set(px,py,pz);fr.rotation.y=ry;g.add(fr);
 const pic=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));pic.position.set(px+Math.sin(ry)*.035,py,pz+Math.cos(ry)*.035);pic.rotation.y=ry;g.add(pic)}
function houseBuild(X,Z,seed,safe){
 const L=houseLayout(seed,safe),R=L.R,H=3.1,C=h=>COL(h),pk=a=>a[Math.floor(R()*a.length)];
 const g=new THREE.Group(),mb=new MB(),m2=new MB(),cols=[],spots=[],lights=[],lamps=[];
 const cc=c=>typeof c==='string'?C(c):c;
 const col=(x0,z0,x1,z1)=>cols.push(addCol(X+Math.min(x0,x1),Z+Math.min(z0,z1),X+Math.max(x0,x1),Z+Math.max(z0,z1),'rock'));
 const B=(x0,y0,z0,x1,y1,z1,c)=>ibox(mb,X+Math.min(x0,x1),y0,Z+Math.min(z0,z1),X+Math.max(x0,x1),y1,Z+Math.max(z0,z1),cc(c));
 const CB=(x0,y0,z0,x1,y1,z1,c,r)=>m2.cbox(X+Math.min(x0,x1),y0,Z+Math.min(z0,z1),X+Math.max(x0,x1),y1,Z+Math.max(z0,z1),cc(c),r||.05);
 const CY=(x,y0,y1,z,r,c,rz)=>m2.geo(GEO.cyl16,mtx(X+x,(y0+y1)/2,Z+z,r,y1-y0,rz??r),cc(c));
 const SP=(x,y,z,rx,ry,rz,c)=>m2.geo(GEO.sph,mtx(X+x,y,Z+z,rx,ry,rz),cc(c));
 const loot=(k,x,y,z,yaw)=>spots.push([k,x,y,z,yaw||0]);
 const doorsOn=(a,c,s0,s1)=>L.doors.filter(d=>d.a===a&&Math.abs(d.c-c)<.01&&d.s1>s0&&d.s0<s1);
 const nearDoor=(x,z,r)=>L.doors.some(d=>d.a==='z'?(Math.abs(z-d.c)<r&&x>d.s0-r&&x<d.s1+r):(Math.abs(x-d.c)<r&&z>d.s0-r&&z<d.s1+r));
 const pal={};for(const r of L.rooms)pal[r.k]={wall:C(safe?{living:'#d8cdb8',bed:'#c8d4e8',bath:'#e8eef0',kitchen:'#f0ead8',kid:'#bfe0f2'}[r.k]:pk(HOUSE_WALL[r.k]))};
 // ---------- casca: piso, teto, paredes com vãos, rodapé, batentes e colisores ----------
 for(const r of L.rooms){const P=pal[r.k],w=r.x1-r.x0,d=r.z1-r.z0;
  if(r.k==='kitchen'||r.k==='bath'){const t=safe?(r.k==='bath'?HOUSE_TILE.bath[0]:HOUSE_TILE.kitchen[1]):pk(HOUSE_TILE[r.k]),s=r.k==='bath'?.4:.5,a=C(t[0]),b=C(t[1]);P.tile=t;
   for(let x=r.x0,i=0;x<r.x1-.001;x+=s,i++)for(let z=r.z0,j=0;z<r.z1-.001;z+=s,j++){const x1=Math.min(r.x1,x+s),z1=Math.min(r.z1,z+s);mb.quad([X+x,0,Z+z1],[X+x1,0,Z+z1],[X+x1,0,Z+z],[X+x,0,Z+z],0,1,0,[0,0,1,1],(i+j)&1?b:a)}}
  else{const f=C(safe?{living:'#9a7048',bed:'#8a6a4a',kid:'#9ab0c8'}[r.k]:pk(HOUSE_FLOOR[r.k]));
   for(let x=r.x0,i=0;x<r.x1-.001;x+=.5,i++){const x1=Math.min(r.x1,x+.5),c=f.clone().multiplyScalar(i%3===0?.9:i%3===1?1:.95);mb.quad([X+x,0,Z+r.z1],[X+x1,0,Z+r.z1],[X+x1,0,Z+r.z0],[X+x,0,Z+r.z0],0,1,0,[0,0,1,1],c)}}
  mb.quad([X+r.x0,H,Z+r.z0],[X+r.x1,H,Z+r.z0],[X+r.x1,H,Z+r.z1],[X+r.x0,H,Z+r.z1],0,-1,0,[0,0,1,1],C('#efe9dc')); // teto: visto de baixo, invisível de cima (câmera de topo)
  const walls=[['z',r.z0,r.x0,r.x1,1],['z',r.z1,r.x0,r.x1,-1],['x',r.x0,r.z0,r.z1,1],['x',r.x1,r.z0,r.z1,-1]];
  for(const[a,c,s0,s1,n] of walls){const gaps=doorsOn(a,c,s0,s1).sort((p,q)=>p.s0-q.s0),segs=[];let s=s0;for(const d of gaps){if(d.s0>s)segs.push([s,d.s0]);s=Math.max(s,d.s1)}if(s<s1)segs.push([s,s1]);
   const P3=(u,y)=>a==='z'?[X+u,y,Z+c]:[X+c,y,Z+u],away=a==='z'?[X+(s0+s1)/2,1,Z+c-n*9]:[X+c-n*9,1,Z+(s0+s1)/2];
   const quad=(u0,u1,y0,y1,colr)=>mb.qa(P3(u0,y0),P3(u1,y0),P3(u1,y1),P3(u0,y1),colr,a==='z'?[X+(u0+u1)/2,1,Z+c-n*9]:[X+c-n*9,1,Z+(u0+u1)/2]);
   const lo=r.k==='bath'?C(P.tile[1]):r.k==='kitchen'?C(P.tile[0]).multiplyScalar(.95):null;
   for(const[u0,u1] of segs){if(lo){quad(u0,u1,0,1.35,lo);quad(u0,u1,1.35,H,P.wall)}else quad(u0,u1,0,H,P.wall);
    // rodapé e colisor da parede
    const t=.03*n;if(a==='z'){B(u0,0,c,u1,.1,c+t,'#70543b');col(u0,c-.12,u1,c+.12)}else{B(c,0,u0,c+t,.1,u1,'#70543b');col(c-.12,u0,c+.12,u1)}}
   for(const d of gaps){quad(d.s0,d.s1,2.2,H,P.wall);if(lo&&r.k==='bath')void 0}
   void away}}
 // batentes dos vãos (um só por porta, atravessando a parede)
 for(const d of L.doors){const fr='#957754';if(d.a==='z'){B(d.s0-.08,0,d.c-.08,d.s0,2.28,d.c+.08,fr);B(d.s1,0,d.c-.08,d.s1+.08,2.28,d.c+.08,fr);B(d.s0-.08,2.2,d.c-.08,d.s1+.08,2.28,d.c+.08,fr)}
  else{B(d.c-.08,0,d.s0-.08,d.c+.08,2.28,d.s0,fr);B(d.c-.08,0,d.s1,d.c+.08,2.28,d.s1+.08,fr);B(d.c-.08,2.2,d.s0-.08,d.c+.08,2.28,d.s1+.08,fr)}}
 // porta da rua (sul da sala) e janela
 B(-.6,0,3.94,.6,2.2,4,'#5a3a24');B(.35,1,3.88,.45,1.1,3.94,'#d8b040');for(const x of [-.68,.6])B(x,0,3.88,x+.08,2.27,3.97,'#957754');B(-.68,2.2,3.88,.68,2.28,3.97,'#957754');
 const win=(a,c,u0,u1,y0,y1,n)=>{if(a==='z'){B(u0,y0,c,u1,y1,c+.05*n,'#f2f2ee');B(u0+.1,y0+.1,c+.01*n,u1-.1,y1-.1,c+.06*n,'#9ad0f0');B((u0+u1)/2-.03,y0+.1,c+.01*n,(u0+u1)/2+.03,y1-.1,c+.08*n,'#f2f2ee');B(u0-.1,y0-.06,c,u1+.1,y0+.02,c+.22*n,'#b4a58a')}
  else{B(c,y0,u0,c+.05*n,y1,u1,'#f2f2ee');B(c+.01*n,y0+.1,u0+.1,c+.06*n,y1-.1,u1-.1,'#9ad0f0');B(c+.01*n,y0+.1,(u0+u1)/2-.03,c+.08*n,y1-.1,(u0+u1)/2+.03,'#f2f2ee');B(c,y0-.06,u0-.1,c+.22*n,y0+.02,u1+.1,'#b4a58a')}};
 win('z',4,2.0,3.8,1.1,2.25,-1);
 const room=k=>L.rooms.find(r=>r.k===k);
 // ---------- SALA ----------
 {const sofa=C(safe?'#3a5a8a':pk(['#3a5a8a','#7a3a3a','#4a6a4a','#5a4a6a','#8a6a3a','#3a3a3a'])),so2=sofa.clone().multiplyScalar(1.12),so3=sofa.clone().multiplyScalar(.92);
  CY(-1,.007,.021,-.2,2.25,safe?'#8a2a3a':pk(['#8a2a3a','#2a4a6a','#6a5a2a','#3a5a3a']),1.75);CY(-1,.02,.032,-.2,1.55,'#c8a050',1.12);CY(-1,.03,.042,-.2,.8,'#d9bf78',.6);
  CB(-4.9,.18,-1.75,-3.4,.46,1.35,sofa,.12);CB(-4.92,.3,-1.7,-4.35,1.05,1.3,sofa,.16);CB(-4.88,.18,-1.78,-3.4,.8,-1.4,so3,.12);CB(-4.88,.18,.98,-3.4,.8,1.38,so3,.12);
  CB(-4.4,.46,-1.38,-3.5,.62,-.2,so2,.08);CB(-4.4,.46,-.15,-3.5,.62,.96,so2,.08);CB(-4.35,.6,-1.3,-3.95,.98,-.85,'#e8b84a',.12);CB(-4.35,.6,.5,-3.95,.95,.95,'#c24a5a',.12);col(-4.95,-1.8,-3.4,1.4);
  CY(-1.75,.38,.44,-.15,.62,'#7a5232');CY(-1.75,.06,.38,-.15,.05,'#5a3a24');CY(-1.75,0,.06,-.15,.26,'#5a3a24');for(let i=0;i<6;i++){const z0=-.62+i*.21;col(-2.3,-.15+z0,-1.2,-.15+z0+.21)}
  CB(-1.95,.44,-.38,-1.6,.49,-.15,'#a83a3a',.02);CY(-1.45,.44,.56,.05,.045,'#f4f4f0');
  CB(.85,.14,-1.4,1.5,.55,1.0,'#3a2a20',.07);for(const dz of [-1.3,.9])for(const dx of [.95,1.4])CY(dx,0,.14,dz,.035,'#1a1410');col(.85,-1.4,1.5,1.0);
  if(safe){CB(1.0,.55,-1.08,1.18,1.47,.68,'#101014',.05);CB(.9,.55,-1.45,1.12,.62,-1.15,'#2a2a30',.05);for(const dz of [-1.28,.98])CB(.9,.55,dz-.1,1.12,1.15,dz+.12,'#26262c',.06);CB(.88,.56,.5,1.11,.66,.83,'#b6bbb8',.02)}
  else{loot('tv',1.13,.55,-.2,0);if(R()<.8)loot('dvd',1.15,.55,.6,0);if(R()<.45)loot('vg',1.15,.55,-1.1,0);if(R()<.4)loot('cel',-3.9,.62,.2,0)}
  // estante em pé (parede sul, à esquerda da porta) com livros
  {const x0=-4.6,x1=-2.5;CB(x0,0,3.58,x1,1.9,3.95,'#6a4a2e',.03);for(const y of [.05,.5,.95,1.4]){B(x0+.05,y,3.62,x1-.05,y+.04,3.92,'#5a3a24');let x=x0+.1;while(x<x1-.2){const w=.06+R()*.09,h=.22+R()*.18;B(x,y+.04,3.66,x+w,y+.04+h,3.88,pk(['#c0392b','#2c6aa8','#d8a020','#3a8a4a','#7a3a8a','#e8e0d0','#2a2a3a']));x+=w+.012}}col(x0,3.55,x1,3.97)}
  // luminária de chão e planta em cantos livres
  const corners=[[-4.55,-3.55],[4.55,-3.55],[4.55,3.5],[-4.55,3.0]].filter(([x,z])=>!nearDoor(x,z,.9));
  if(corners[0]){const[x,z]=corners[0];CY(x,0,.04,z,.16,'#2a2a30');CY(x,.04,1.55,z,.022,'#2a2a30');CY(x,1.52,1.84,z,.22,'#ffeab8',.22);col(x-.2,z-.2,x+.2,z+.2);lamps.push([x,1.68,z,.18])}
  if(corners[1]){const[x,z]=corners[1];CY(x,0,.5,z,.26,'#a8603a');for(let k=0;k<7;k++)m2.geo(GEO.ico,mtx(X+x+Math.cos(k*.9)*.22,.8+k*.11,Z+z+Math.sin(k*.9)*.22,.2,.28,.2,k,k*2,k*3),C(k%2?'#2f7a34':'#3f8a3a'));col(x-.3,z-.3,x+.3,z+.3)}
  housePainting(g,R,X-4.97,1.9,Z-.2,Math.PI/2,1.5,1);lights.push([0,H-.3,-1.6],[0,H-.3,1.8],[-3.5,H-.3,0])}
 // ---------- QUARTO ----------
 {const r=room('bed'),cx=(r.x0+r.x1)/2,ext=L.bathL?r.x1:r.x0,es=L.bathL?-1:1,bx=cx+(L.bathL?-.3:.3),bz0=r.z0+.06,bz1=bz0+2.15,wood=C(pk(['#7a5232','#5a3a24','#8a6a4a','#4a3a2e'])),wood2=wood.clone().multiplyScalar(.8);
  const sheet=C(pk(['#4a7a5a','#3a5a8a','#8a3a4a','#c8a050','#6a4a7a'])),cream=C('#f0ece4');
  CB(bx-1.02,0,r.z0+.02,bx+1.02,1.25,r.z0+.12,wood,.05);B(bx-.98,.1,bz0,bx+.98,.38,bz1,wood2);for(const sx of [-.95,.88])for(const z of [bz0+.05,bz1-.12])B(bx+sx,0,z,bx+sx+.07,.1,z+.07,wood2);
  CB(bx-.93,.38,bz0+.04,bx+.93,.64,bz1-.03,cream,.08);CB(bx-.95,.6,bz0+.7,bx+.95,.7,bz1,sheet,.05);CB(bx-.95,.68,bz1-.32,bx+.95,.74,bz1-.02,sheet.clone().multiplyScalar(.85),.03);
  CB(bx-.82,.62,bz0+.12,bx-.08,.83,bz0+.6,'#ffffff',.1);CB(bx+.08,.62,bz0+.12,bx+.82,.83,bz0+.6,'#f6efe0',.1);col(bx-1.02,r.z0,bx+1.02,bz1);
  for(const s of [-1,1]){const nx0=s<0?bx-1.62:bx+1.07,nx1=nx0+.55;CB(nx0,0,r.z0+.05,nx1,.5,r.z0+.55,wood,.05);B((nx0+nx1)/2-.12,.2,r.z0+.55,(nx0+nx1)/2+.12,.26,r.z0+.56,'#c0ac7d');col(nx0,r.z0,nx1,r.z0+.56);
   CY((nx0+nx1)/2,.5,.62,r.z0+.25,.07,'#d8d8d8');CY((nx0+nx1)/2,.62,.9,r.z0+.25,.17,'#ffe9a8',.17);lamps.push([(nx0+nx1)/2,.78,r.z0+.25,.12]);
   if(!safe){if(s<0)loot('joia',(nx0+nx1)/2-.12,.5,r.z0+.36,Math.PI/2);else if(R()<.55)loot('cel',(nx0+nx1)/2+.08,.5,r.z0+.38,Math.PI/2)}}
  if(!safe&&R()<.55)loot('lap',bx+.2,.72,bz0+1.35,Math.PI/2);
  // guarda-roupa na parede externa, ao sul do quarto
  const wx0=es>0?ext:ext-.62,wx1=wx0+.62,wz1=r.z1-.2,wz0=Math.max(bz1-.2,wz1-1.9);
  CB(wx0,0,wz0,wx1,2.3,wz1,'#7a5a3a',.03);const fx=es>0?wx1:wx0;B(fx-.04*es,.12,wz0+.04,fx+.02*es,2.22,(wz0+wz1)/2-.02,'#8a6a46');B(fx-.04*es,.12,(wz0+wz1)/2+.02,fx+.02*es,2.22,wz1-.04,'#8a6a46');
  SP(fx+.03*es,1.1,(wz0+wz1)/2-.1,.04,.04,.04,'#d8b040');SP(fx+.03*es,1.1,(wz0+wz1)/2+.1,.04,.04,.04,'#d8b040');col(wx0,wz0,wx1,wz1);
  if(!safe&&R()<.4)loot('gra',fx+.18*es,.02,(wz0+wz1)/2,es>0?Math.PI:0);
  // cômoda com espelho na parede da divisória (lado do banheiro)
  const px=L.bathL?r.x0:r.x1,ps=L.bathL?1:-1,dz0=r.z1-1.7,dz1=r.z1-.5;if(dz0>bz1-.4){const dx0=ps>0?px:px-.5,dx1=dx0+.5;CB(dx0,0,dz0,dx1,.82,dz1,wood,.04);for(const y of [.2,.45,.68])B((ps>0?dx1:dx0)-.01*ps,y,dz0+.08,(ps>0?dx1:dx0)+.02*ps,y+.18,dz1-.08,wood.clone().multiplyScalar(1.12));
   B(px+.01*ps,1.05,dz0+.15,px+.04*ps,1.85,dz1-.15,'#c8d8e0');col(dx0,dz0,dx1,dz1);if(!safe&&R()<.5)loot('perf',(dx0+dx1)/2,.82,dz0+.3,ps>0?Math.PI:0)}
  CY(bx,.008,.02,bz1+.75,1.1,pk(['#c8a050','#8a4a3a','#4a6a8a','#d8c8a8']),.55);
  win('z',r.z0,cx+(L.bathL?1.6:-3.0),cx+(L.bathL?3.0:-1.6),1.2,2.2,1);
  housePainting(g,R,X+bx,1.85,Z+r.z0+.14,0,1.1,.7);lights.push([cx,H-.3,(r.z0+r.z1)/2]);
  if(safe){SAFE.bedRect={x0:X+bx-1.6,x1:X+bx+1.6,z0:Z+r.z0,z1:Z+bz1+.9};SAFE.bedSpot={x:X+bx+.2,z:Z+bz1+.55};SAFE.catSpot={x:X+bx-.6,z:Z+bz1+.35};
   SAFE.wardRect={x0:X+Math.min(fx,fx+1.4*es),x1:X+Math.max(fx,fx+1.4*es),z0:Z+wz0-.4,z1:Z+wz1+.2}}}
 // ---------- BANHEIRO ----------
 {const r=room('bath'),ext=L.bathL?r.x0:r.x1,es=L.bathL?1:-1,part=L.bathL?r.x1:r.x0,ps=-es;
  // box com vidro no canto externo-norte
  const sx0=es>0?ext:ext-1.05,sx1=sx0+1.05,sz0=r.z0,sz1=r.z0+1.05;B(sx0,0,sz0,sx1,.1,sz1,'#e8e8ec');B(es>0?sx1-.04:sx0,0,sz0,es>0?sx1:sx0+.04,2.0,sz1,'#b8dce8');B(sx0,0,sz1-.04,sx1,2.0,sz1,'#b8dce8');
  CY((sx0+sx1)/2,2.05,2.1,sz0+.25,.12,'#c8c8d0');B((sx0+sx1)/2-.02,2.1,sz0,(sx0+sx1)/2+.02,2.14,sz0+.25,'#c8c8d0');col(sx0,sz0,sx1,sz1);
  // vaso sanitário junto à divisória
  const tx=part+ps*.45;CB(tx-.2,0,r.z0+.08,tx+.2,.42,r.z0+.7,'#f4f4f6',.1);CB(tx-.22,.38,r.z0+.12,tx+.22,.46,r.z0+.72,'#ffffff',.06);CB(tx-.2,.4,r.z0+.02,tx+.2,.85,r.z0+.24,'#f4f4f6',.05);col(tx-.24,r.z0,tx+.24,r.z0+.72);
  // pia com gabinete e espelho na parede externa
  const kz0=Math.max(sz1+.25,r.z1-1.55),kz1=kz0+.9,kx0=es>0?ext:ext-.5,kx1=kx0+.5;CB(kx0,0,kz0,kx1,.82,kz1,'#e8e4dc',.03);CB(kx0-.02,.82,kz0-.02,kx1+.02,.88,kz1+.02,'#3a3a40',.02);CY((kx0+kx1)/2,.86,.88,(kz0+kz1)/2,.16,'#c8ccd0');
  B(ext+.01*es,1.15,kz0+.1,ext+.04*es,1.95,kz1-.1,'#c8dce8');CY(ext+.12*es,.88,1.02,(kz0+kz1)/2,.02,'#c8c8d0');col(kx0,kz0,kx1,kz1);
  if(!safe){loot('perf',(kx0+kx1)/2,.88,kz0+.18,es>0?Math.PI:0);if(R()<.5)loot('sec',(kx0+kx1)/2,.88,kz1-.2,es>0?Math.PI:0)}
  // toalheiro e tapetinho
  B(part+.02*ps,1.2,(r.z0+r.z1)/2-.1,part+.08*ps,1.24,(r.z0+r.z1)/2+.6,'#c8c8d0');B(part+.04*ps,.7,(r.z0+r.z1)/2-.05,part+.07*ps,1.22,(r.z0+r.z1)/2+.55,pk(['#c84a5a','#4a8ac8','#e8c040','#5aa86a']));
  CY((r.x0+r.x1)/2,.006,.016,sz1+.55,.45,'#7aa8c8',.3);
  win('z',r.z0,tx-.35,tx+.35,1.6,2.2,1);lights.push([(r.x0+r.x1)/2,H-.3,(r.z0+r.z1)/2])}
 // ---------- COZINHA ----------
 {const r=room('kitchen'),ext=r.side<0?r.x0:r.x1,es=r.side<0?1:-1,cx0=es>0?ext:ext-.62,cx1=cx0+.62,fz1=r.z1-.12,fz0=fz1-.8,cz0=r.z0+.08,cz1=fz0-.08,top=C('#3a3a40');
  B(cx0,0,cz0,cx1,.9,cz1,'#e8e4dc');CB(cx0-.02,.88,cz0-.02,cx1+.02,.98,cz1+.02,top,.02);for(let z=cz0+.1;z<cz1-.4;z+=.45)B((es>0?cx1:cx0)-.005*es,.12,z,(es>0?cx1:cx0)+.02*es,.82,z+.42,'#f4f0e8');col(cx0,cz0,cx1,cz1);
  const sz=cz0+(cz1-cz0)*.3,stz=cz0+(cz1-cz0)*.7;B(cx0+.08,.98,sz-.35,cx1-.08,1.0,sz+.35,'#9a9aa0');B(cx0+.13,.97,sz-.28,cx1-.13,1.0,sz+.28,'#6a6a70');CY(ext+.1*es,.98,1.32,sz,.025,'#c8c8d0');
  for(const[dx,dz] of [[.18,-.15],[.18,.15],[.42,-.15],[.42,.15]])CY(cx0+(es>0?dx:.62-dx),.98,1.0,stz+dz,.11,'#1a1a1c');
  for(const[a,b] of [[cz0,stz-.45],[stz+.45,cz1]])if(b-a>.3)B(es>0?ext:ext-.38,1.65,a,es>0?ext+.38:ext,2.35,b,'#e8e4dc');CB(es>0?ext:ext-.55,1.85,stz-.4,es>0?ext+.55:ext,2.1,stz+.4,'#d8d4cc',.03);
  B(ext+.01*es,1.02,cz0,ext+.04*es,1.6,cz1,'#c8c6b5');
  CB(es>0?ext:ext-.75,0,fz0,es>0?ext+.75:ext,1.85,fz1,'#f4f4f6',.1);B((es>0?ext+.75:ext-.75)+.005*es,.95,fz0+.1,(es>0?ext+.75:ext-.75)+.03*es,1.55,fz0+.15,'#9a9aa0');col(Math.min(ext,ext+.75*es),fz0,Math.max(ext,ext+.75*es),fz1);
  if(!safe){loot('mic',cx0+.31,.98,cz0+.45,es>0?Math.PI:0);if(R()<.6)loot('liq',cx0+.31,.98,sz+.62,es>0?Math.PI:0);if(R()<.6)loot('caf',cx0+.31,.98,stz-.62,es>0?Math.PI:0)}else{CB(cx0+.06,.98,cz0+.2,cx1-.06,1.28,cz0+.7,'#e8e8ea',.03)}
  // mesa com cadeiras
  const tx=(r.x0+r.x1)/2+.25*es,tz=r.z1-r.z0>5?(r.z0+r.z1)/2-.6:(r.z0+r.z1)/2-.2;CY(tx,.72,.76,tz,.55,'#8a6a4a');CY(tx,.05,.72,tz,.05,'#5a3a24');CY(tx,0,.05,tz,.3,'#5a3a24');col(tx-.5,tz-.5,tx+.5,tz+.5);
  for(const[a,b] of [[0,-.85],[0,.85],[-.85,0],[.85,0]].slice(0,r.z1-r.z0>5?4:2)){CB(tx+a-.2,.42,tz+b-.2,tx+a+.2,.47,tz+b+.2,'#c8402a',.03);for(const[p,q] of [[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])B(tx+a+p-.02,0,tz+b+q-.02,tx+a+p+.02,.42,tz+b+q+.02,'#5a3a24')}
  CY(tx,.76,.9,tz,.08,'#e8e0d0');
  win('x',ext,stz+.45>cz1?sz-.5:sz-.6,stz+.45>cz1?sz+.5:sz+.6,1.65,2.3,es);lights.push([(r.x0+r.x1)/2,H-.3,(r.z0+r.z1)/2]);
  if(safe){CB(es>0?ext+.08:ext-.35,1.0,cz1-.6,es>0?ext+.35:ext-.08,1.24,cz1-.25,'#d84a4a',.03)}}
 // ---------- QUARTO DE CRIANÇA ----------
 {const r=room('kid');if(r){const ext=r.side<0?r.x0:r.x1,es=r.side<0?1:-1,bx0=es>0?ext:ext-1.0,bx1=bx0+1.0,bz0=r.z0+.1,bz1=bz0+2.05,c=C(pk(['#4a8ac8','#c84a7a','#5aa86a','#e8a030']));
  B(bx0,.1,bz0,bx1,.36,bz1,'#8a6a4a');CB(bx0+.05,.36,bz0+.05,bx1-.05,.56,bz1-.05,'#f0ece4',.06);CB(bx0+.04,.52,bz0+.6,bx1-.04,.6,bz1-.03,c,.04);CB(bx0+.15,.55,bz0+.1,bx1-.15,.72,bz0+.5,'#ffffff',.08);col(bx0,bz0,bx1,bz1);
  const dz1=r.z1-.05,dz0=dz1-.6,dxc=(r.x0+r.x1)/2+.3*es;CB(dxc-.6,.72,dz0,dxc+.6,.78,dz1,'#e8dcc0',.02);for(const s of [-1,1])B(dxc+s*.55-.03,0,dz0+.05,dxc+s*.55+.03,.72,dz1-.05,'#8a8a90');col(dxc-.62,dz0,dxc+.62,dz1);
  CB(dxc-.35,.78,dz1-.25,dxc+.1,1.12,dz1-.05,'#1a1a1e',.03);B(dxc-.33,.8,dz1-.26,dxc+.08,1.1,dz1-.255,'#3a6aa0');
  CB(dxc-.2,0,dz0-.55,dxc+.2,.45,dz0-.15,c,.04);
  const tbx=es>0?r.x1-.8:r.x0+.1;CB(tbx,0,r.z1-1.35,tbx+.7,.5,r.z1-.8,'#e8a030',.05);SP(tbx+.35,.6,r.z1-1.08,.12,.12,.12,'#e84a4a');col(tbx,r.z1-1.35,tbx+.7,r.z1-.8);
  if(!safe){loot('vg',dxc+.35,.78,dz1-.3,-Math.PI/2);if(R()<.4)loot('cel',bx0+.5,.6,bz1-.4,0)}
  win('x',ext,bz1+.3,bz1+1.3,1.2,2.2,es);lights.push([(r.x0+r.x1)/2,H-.3,(r.z0+r.z1)/2])}}
 // ---------- luz, malhas e luminárias ----------
 const wl=lights.slice(0,8).map(([x,y,z])=>[X+x,y,Z+z]),bb=L.rooms.reduce((a,r)=>({x0:Math.min(a.x0,r.x0),z0:Math.min(a.z0,r.z0),x1:Math.max(a.x1,r.x1),z1:Math.max(a.z1,r.z1)}),{x0:9,z0:9,x1:-9,z1:-9});
 const RL={x0:X+bb.x0,z0:Z+bb.z0,x1:X+bb.x1,z1:Z+bb.z1,H,lights:wl,warm:safe?'#ffc488':pk(['#ffc488','#ffd2a0','#ffb878','#fff0d0']),amb:.5,pow:.8,rad:4.6,grime:safe?0:R()*.35};
 g.add(mb.mesh(roomLitMat(RL)));g.add(m2.mesh(roomLitMat(RL)));
 // luminárias de teto rentes (plafon achatado), não mais bolas penduradas
 const lampM=new THREE.MeshBasicMaterial({color:0xfff2c8}),baseM=new THREE.MeshBasicMaterial({color:0xd8d0c0}),domeG=new THREE.SphereGeometry(1,10,3,0,Math.PI*2,Math.PI/2,Math.PI/2),baseG=new THREE.CylinderGeometry(.17,.17,.03,10);
 for(const[x,y,z] of wl){const b=new THREE.Mesh(baseG,baseM);b.position.set(x,H-.015,z);g.add(b);const s=new THREE.Mesh(domeG,lampM);s.scale.set(.14,.06,.14);s.position.set(x,H-.03,z);g.add(s)}
 for(const[x,y,z,rr] of lamps){const s=new THREE.Mesh(new THREE.SphereGeometry(rr*.5,8,6),new THREE.MeshBasicMaterial({color:0xffe6a8,transparent:true,opacity:.3,depthWrite:false}));s.position.set(X+x,y,Z+z);g.add(s)}
 const rooms=L.rooms.map(r=>({k:r.k,x0:X+r.x0,z0:Z+r.z0,x1:X+r.x1,z1:Z+r.z1}));
 return {g,cols,spots,rooms,bb:{x0:X+bb.x0,z0:Z+bb.z0,x1:X+bb.x1,z1:Z+bb.z1},X,Z,H}}
// câmera: presa ao cômodo onde o jogador está (as paredes internas já encurtam a câmera de 3ª pessoa)
function houseRooms(){return PL.inside===true?SAFE.rooms:PL.inside==='heist'?HEIST.house?.rooms:PL.inside==='motel'?MOTEL.rooms:null}
function houseCamClamp(p){const L=houseRooms();if(!L)return p;const r=L.find(q=>PL.x>q.x0-.05&&PL.x<q.x1+.05&&PL.z>q.z0-.05&&PL.z<q.z1+.05)||L[0];p.x=clamp(p.x,r.x0+.25,r.x1-.25);p.z=clamp(p.z,r.z0+.25,r.z1-.25);p.y=Math.min(p.y,2.75);return p}
function heistSeed(hs){return ((Math.round(hs.x*13)^Math.round(hs.z*7)^(S.seed*2654435761))>>>0)}
function heistEnter(hs){if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');HEIST.lock=1.5;return}
 // casa nova a cada assalto: descarta a anterior (malhas e colisores) e monta o layout da seed desta porta
 if(!HEIST.house||HEIST.house.id!==hs.id){houseDispose(HEIST.house);const h=houseBuild(SAFE.IN.x-130,SAFE.IN.z+40,heistSeed(hs),false);h.id=hs.id;scene.add(h.g);h.g.visible=false;HEIST.house=h}
 const h=HEIST.house,g=h.g;for(const it of HEIST.items)if(it.m.parent)it.m.parent.remove(it.m);HEIST.items=[];
 const rn=mulberry32((heistSeed(hs)^(HEIST.night*977))>>>0);
 for(const[k,x,y,z,yaw] of h.spots){if(k!=='tv'&&rn()<.12)continue;const m=lootModel(k);m.position.set(h.X+x,y,h.Z+z);m.rotation.y=yaw;g.add(m);HEIST.items.push({k,m,x:h.X+x,z:h.Z+z,val:lootVal(k)})}
 fadeFlash();doorEnter('heist','house:'+hs.id,hs.out,hs.nrm);PL.inside='heist';HEIST.cur=hs;HEIST.t=15;HEIST.alarm=false;HEIST.lock=1;g.visible=true;
 PL.x=h.X;PL.z=h.Z+1.3;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+2);camT.x=PL.x;camT.z=PL.z;for(const p of peds.slice())if(!p.fixed)removePed(p);
 if(!HEIST.arrIn)HEIST.arrIn=makeArrow();HEIST.arrIn.position.set(h.X,1.5,h.Z+4-.9);HEIST.arrIn.visible=true;
 toast('<span style="color:#ff4a4a">ASSALTO</span> · 15 SEGUNDOS<br><small style="font-size:11px;color:#fff">quarto, cozinha e banheiro têm coisas · pegue com E (→ no controle) e saia pela seta</small>')}
function heistExit(){const hs=HEIST.cur;fadeFlash();PL.inside=false;doorExit({x:hs.out.x,z:hs.out.z,nx:hs.nrm[0],nz:hs.nrm[1]});HEIST.lock=1.5;if(HEIST.house)HEIST.house.g.visible=false;if(HEIST.arrIn)HEIST.arrIn.visible=false;HEIST.robbed.add(hs.id);HEIST.cur=null;
 if(HEIST.alarm){HEIST.alarm=false;startWanted(true);for(let k=0;k<2;k++){const c=spawnPoliceCar(40,130);if(c)startChase(c)}toast('<span style="color:#ff4a4a">A POLÍCIA CHEGOU NA CASA!</span>')}else if(HEIST.loot.length)toast('SAIU LIMPO<br><small style="font-size:11px;color:#fff">venda tudo na casa de penhores</small>')}
function heistFront(){let best=null,bd=1.9;for(const it of HEIST.items){const dx=it.x-PL.x,dz=it.z-PL.z,d=Math.hypot(dx,dz);if(d>bd||d<.05)continue;if(d>.7&&(dx*PL.face[0]+dz*PL.face[1])/d<.35)continue;bd=d;best=it}return best}
function heistAct(){if(PL.inside==='heist'){const it=heistFront();if(!it)return false;HEIST.items.splice(HEIST.items.indexOf(it),1);it.m.parent&&it.m.parent.remove(it.m);HEIST.loot.push({k:it.k,val:it.val});clang(.3);toast(LOOT_NM[it.k]+' · <span style="color:#7dff8a">$'+it.val+'</span>');return true}
 if(PL.inside==='pawn'){const c=HEIST.pawnCounter;if(!c||Math.hypot(PL.x-c.x,PL.z-c.z)>2.4)return false;if(VINYL.bag.size){const nv=vinylSell(),pay=nv*VINYL_PRICE;money(pay,translatePlain('DISCOS VENDIDOS')+' · '+nv+' · <span style="color:#7dff8a">+$'+pay+'</span><br><small style="font-size:11px;color:#fff">'+(S.lang==='en'?'collection':'coleção')+' '+VINYL.got.size+'/'+VINYL.N+'</small>');say(HEIST.clerk,['Raridade boa. Fechado.','Esse disco vale ouro.'],3);clang(.4);if(!HEIST.loot.length)return true}if(!HEIST.loot.length){say(HEIST.clerk,SAY.pawnNo);return true}
  const n=HEIST.loot.length,sum=Math.round(HEIST.loot.reduce((a,b)=>a+b.val,0)*.6);HEIST.loot=[];say(HEIST.clerk,SAY.pawnBuy,3);money(sum,'VENDIDO · '+n+(n>1?' ITENS':' ITEM')+' · <span style="color:#7dff8a">+$'+sum+'</span><br><small style="font-size:11px;color:#fff">"negócio fechado. agora some daqui."</small>');clang(.4);return true}return false}
// casa de penhores: 1 por cidade, num beco longe das armas e dos discos, com seta amarela
function pawnPlace(){const R=mulberry32((S.seed^0x7a11c0de)>>>0),L=(city.catSpots||[]).filter(q=>!q.residential).slice().map(q=>({q,o:R()})).sort((a,b)=>a.o-b.o).map(a=>a.q);
 const bad=(x,z)=>pickups.some(p=>p.kind!=='hp'&&p.kind!=='cash'&&p.kind!=='armor'&&Math.hypot(p.x-x,p.z-z)<45)||VINYL.spots.some(s=>Math.hypot(s.x-x,s.z-z)<25)||(city.safe&&Math.hypot(city.safe.x-x,city.safe.z-z)<80);
 for(const q of L){const r=q.r,along=(r[2]-r[0])<(r[3]-r[1]),x=(r[0]+r[2])/2,z=along?r[1]+(r[3]-r[1])*.3:(r[1]+r[3])/2,xx=along?x:r[0]+(r[2]-r[0])*.3;if(bad(xx,z))continue;HEIST.pawn={x:xx,z,nrm:along?[0,1]:[1,0]};break}
 if(!HEIST.pawn&&L.length){const r=L[0].r;HEIST.pawn={x:(r[0]+r[2])/2,z:(r[1]+r[3])/2,nrm:[0,1]}}
 if(!HEIST.pawnArr){HEIST.pawnArr=makeArrow();HEIST.pawnArrIn=makeArrow()}}
function buildPawn(){const X=SAFE.IN.x-60,Z=SAFE.IN.z-60,W=6,D=4.5,H=3.2,C=h=>COL(h);HEIST.pawnIN={x:X,z:Z};const g=new THREE.Group();HEIST.pawnGrp=g;scene.add(g);g.visible=false;const mb=new MB();
 const t1=C('#5a4a38'),t2=C('#4a3c2c');for(let x=X-W;x<X+W;x++)for(let z=Z-D;z<Z+D;z++)mb.quad([x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z],0,1,0,[0,0,1,1],((x+z)&1)?t1:t2);
 const wl=C('#7a6a52'),wl2=C('#6a5a44');mb.qa([X-W,0,Z-D],[X+W,0,Z-D],[X+W,H,Z-D],[X-W,H,Z-D],wl,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wl,[X,1,Z+D+9]);
 mb.qa([X-W,0,Z-D],[X-W,0,Z+D],[X-W,H,Z+D],[X-W,H,Z-D],wl2,[X-W-9,1,Z]);mb.qa([X+W,0,Z-D],[X+W,0,Z+D],[X+W,H,Z+D],[X+W,H,Z-D],wl2,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],C('#3a3228'),[X,H+9,Z]);
 const R=mulberry32((S.seed^0x99aa)>>>0),junk=['#6a5038','#5a4630','#7a6040','#4a4a48','#3a3a40','#8a7050','#5a5a50','#6a3a2a'];
 // prateleiras sujas: estrutura marrom e tralha empoeirada
 const shelf=(x0,z0,x1,z1)=>{ibox(mb,x0,0,z0,x1,2.5,z0+.06,C('#4a3a28'));for(let y=.1;y<2.5;y+=.6){ibox(mb,x0,y,z0,x1,y+.05,z1,C('#5a4430'));let x=x0+.05;while(x<x1-.3){const w=.2+R()*.45,hh=.15+R()*.35;ibox(mb,x,y+.05,z0+.08+R()*.1,Math.min(x1-.05,x+w),y+.05+hh,z1-.05,C(junk[Math.floor(R()*junk.length)]).multiplyScalar(.85));x+=w+.06}}
  for(const xx of [x0,x1-.06])ibox(mb,xx,0,z0,xx+.06,2.5,z1,C('#3a2c1e'))};
 shelf(X-5.9,Z-4.4,X-1.4,Z-3.7);shelf(X+1.4,Z-4.4,X+5.9,Z-3.7);
 for(const sx of [X-4.6,X+2.2]){const x0=sx,x1=sx+2.4;for(const s of [0,1]){const z0=Z-1.6+s*.71,z1=z0+.7;ibox(mb,x0,0,z0,x1,1.9,z0+.04,C('#4a3a28'));for(let y=.1;y<1.9;y+=.6){ibox(mb,x0,y,z0,x1,y+.05,z1,C('#5a4430'));let x=x0+.05;while(x<x1-.3){const w=.2+R()*.4,hh=.12+R()*.3;ibox(mb,x,y+.05,z0+.06,Math.min(x1-.05,x+w),y+.05+hh,z1-.06,C(junk[Math.floor(R()*junk.length)]).multiplyScalar(.8));x+=w+.06}}}}
 // caixas no chão, balcão com vidro e caixa registradora
 for(let k=0;k<6;k++){const x=X-5.6+R()*2,z=Z+1.4+R()*2.4,s=.4+R()*.4;ibox(mb,x,0,z,x+s,s*.8,z+s,C(junk[k%3]))}
 ibox(mb,X+1.2,0,Z+.9,X+5.8,1.0,Z+1.6,C('#3a2a1e'));ibox(mb,X+1.15,1.0,Z+.85,X+5.85,1.06,Z+1.65,C('#8a9a9a'));ibox(mb,X+3.6,1.06,Z+1.0,X+4.3,1.36,Z+1.45,C('#2a2a2a'));ibox(mb,X+3.7,1.36,Z+1.05,X+4.2,1.5,Z+1.15,C('#c8a020'));
 ibox(mb,X-W,0,Z-D,X+W,.12,Z-D+.04,C('#2a2018'));ibox(mb,X-.6,0,Z+D-.06,X+.6,2.2,Z+D,C('#3a2a1e'));
 g.add(mb.mesh(roomLitMat({x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights:[[X,H-.4,Z],[X-4,H-.4,Z-2],[X+4,H-.4,Z-2],[X+3.5,H-.4,Z+2]],warm:'#ffc070',amb:.42,pow:.9,rad:5,grime:.7}))); // v77: penhores empoeirado e na penumbra
 const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xd8c890}));lamp.position.set(X,H-.4,Z);g.add(lamp);
 {const c=cv(256,48),q=c.getContext('2d');q.fillStyle='#1a140e';q.fillRect(0,0,256,48);q.fillStyle='#d8b040';q.font='700 20px Silkscreen,monospace';q.textAlign='center';q.textBaseline='middle';q.fillText(translatePlain('PENHORES · COMPRO TUDO'),128,25);const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.66),new THREE.MeshBasicMaterial({map:t}));m.position.set(X+3.5,2.4,Z+2.9);m.rotation.y=Math.PI;g.add(m)}
 for(const[x0,z0,x1,z1] of [[X-W-.5,Z-D-.5,X+W+.5,Z-D],[X-W-.5,Z+D,X+W+.5,Z+D+.5],[X-W-.5,Z-D,X-W,Z+D],[X+W,Z-D,X+W+.5,Z+D],[X-5.9,Z-4.4,X-1.4,Z-3.6],[X+1.4,Z-4.4,X+5.9,Z-3.6],[X-4.6,Z-1.6,X-2.2,Z-.15],[X+2.2,Z-1.6,X+4.6,Z-.15],[X+1.15,Z+.85,X+5.85,Z+1.65]])addCol(x0,z0,x1,z1,'rock');
 HEIST.pawnCounter={x:X+3.9,z:Z+2.1};HEIST.pawnClerkAt={x:X+3.9,z:Z+.3}}
function pawnEnter(){if(!storyOK('pawn')){storyLocked('CASA DE PENHORES');return}if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');HEIST.lock=1.5;return}const p=HEIST.pawn,IN=HEIST.pawnIN;fadeFlash();doorEnter('pawn','pawn',{x:p.x+p.nrm[0]*1.5,z:p.z+p.nrm[1]*1.5},p.nrm);PL.inside='pawn';HEIST.pawnGrp.visible=true;HEIST.pawnT=0;HEIST.pawnAlarm=false;HEIST.lock=1;
 PL.x=IN.x;PL.z=IN.z+4.5-2.4;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+3);camT.x=PL.x;camT.z=PL.z;for(const q of peds.slice())if(!q.fixed)removePed(q);
 const q=spawnPed(null,{x:HEIST.pawnClerkAt.x,z:HEIST.pawnClerkAt.z,vx:0,vz:0,pal:{...CLERK_PAL,cap:'#3a3a30',capDark:'#2a2a20',shirt:'#5a5a48',stripe:null,glasses:'#1b1b1b'}});q.state='clerk';q.fixed=true;q.at=HEIST.pawnClerkAt;q.mx=0;q.mz=1;q.timer=0;HEIST.clerk=q;setTimeout(()=>say(q,SAY.pawnHi),700);
 HEIST.pawnArrIn.position.set(IN.x,1.5,IN.z+4.5-.9);HEIST.pawnArrIn.visible=true;
 void 0}
function pawnExit(){const p=HEIST.pawn;fadeFlash();PL.inside=false;doorExit({x:p.x+p.nrm[0]*1.5,z:p.z+p.nrm[1]*1.5,nx:p.nrm[0],nz:p.nrm[1]});HEIST.lock=1.5;HEIST.pawnGrp.visible=false;HEIST.pawnArrIn.visible=false;if(HEIST.clerk&&peds.includes(HEIST.clerk))removePed(HEIST.clerk);HEIST.clerk=null;
 if(HEIST.pawnAlarm){HEIST.pawnAlarm=false;startWanted(true);for(let k=0;k<2;k++){const c=spawnPoliceCar(40,130);if(c)startChase(c)}toast('<span style="color:#ff4a4a">A POLÍCIA ESTAVA DE OLHO NA LOJA!</span>')}}
function heistPick(){HEIST.list=[];const L=[];for(const[ri,arr] of city.doors||[]){if(city.info[ri]?.kind!=='houses'||city.info[ri]?.safe)continue;for(const d of arr)if(d.house&&d.f)L.push(d)}
 const R=mulberry32((S.seed*7+HEIST.night*131)>>>0);for(let i=L.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[L[i],L[j]]=[L[j],L[i]]}
 for(const d of L.slice(0,Math.min(15,Math.max(5,Math.round(L.length*.18))))){const n=d.f==='n'?[0,-1]:d.f==='s'?[0,1]:d.f==='e'?[1,0]:[-1,0],id=Math.round(d.x)+','+Math.round(d.z),hv=((Math.round(d.x*13)^Math.round(d.z*7)^S.seed)>>>0);
  HEIST.list.push({id,x:d.x,z:d.z,nrm:n,out:{x:d.x+n[0]*1.3,z:d.z+n[1]*1.3},v:hv%5,dog:hv%3===0})}}
/* Assalto em qualquer loja do shopping (mesmas regras da conveniência): mire a arma no vendedor por 3 s.
   A loja fecha (some a venda) e só reabre 3 h de jogo depois do fim da perseguição, da sua morte ou da prisão.
   Ao sair do shopping depois de um assalto, a polícia te espera. */
const MALLROB={};let ROB_prevIn=null;
function robTick(dt){const now=gameMin();
 for(const k in MALLROB){const r=MALLROB[k];if(!r.closed)continue;if(POL.wanted)r.saw=true;if(r.reopen==null&&(PL.dead||PL.inside==='jail'||(r.saw&&!POL.wanted&&PL.inside!=='mall')))r.reopen=now+180;if(r.reopen!=null&&now>=r.reopen){r.closed=false;r.reopen=null;r.saw=false;r.rob=0}}
 for(const k in SHOP.closed||{}){const r=SHOP.closed[k];if(POL.wanted)r.saw=true;if(r.reopen==null&&(PL.dead||PL.inside==='jail'||(r.saw&&!POL.wanted&&PL.inside!=='shop')))r.reopen=now+180;if(r.reopen!=null&&now>=r.reopen)delete SHOP.closed[k]}
 if(ROB_prevIn==='mall'&&PL.inside!=='mall'&&MALL.alarm){MALL.alarm=false;startWanted(true);for(let i=0;i<2;i++){const c=spawnPoliceCar(45,140);if(c)startChase(c)}toast('<span style="color:#ff4a4a">POLÍCIA NO SHOPPING!</span>')}ROB_prevIn=PL.inside;
 if(PL.inside!=='mall'||!GUN.has||PL.dead)return;
 for(const k of ['wear','food','tech','bag']){const q=peds.find(p=>p.mallClerk===k&&p.state!=='dead');if(!q)continue;const r=MALLROB[k]||(MALLROB[k]={rob:0,closed:false});if(r.closed)continue;
  if(aimingAt(q.x,q.z,8,.93)){if(r.rob===0){say(q,SAY.spare,3.2);toast('<span style="color:#ff4a4a">ASSALTO!</span><br><small style="font-size:11px;color:#fff">continue mirando no vendedor</small>');ouch(q.x,q.z,1.3)}r.rob+=dt;q.jy=Math.abs(Math.sin(simT*22))*.12;
   if(r.rob>=3.2){r.closed=true;r.reopen=null;r.saw=true;r.rob=0;const v=120+Math.floor(Math.random()*160);money(v,'<span style="color:#5aff6a">+$'+v+'</span> · O VENDEDOR ESVAZIOU O CAIXA');say(q,'Tá aí! Tá tudo aí!',3);clang(.4);MALL.alarm=true;toast('<span style="color:#ff4a4a">O VENDEDOR APERTOU O ALARME!</span><br><small style="font-size:11px;color:#fff">a polícia espera na saída</small>')}}
  else r.rob=Math.max(0,r.rob-dt*.5)}}
/* Arma na mão (a pé, na rua): pedestres por perto fogem como na chuva, alguns gritam.
   Se o pânico durar 1 min real, a polícia vem. */
/* Arma à mostra assusta também motoristas comuns: aceleração forte e semáforos ignorados.
   A fuga segue a IA original de ruas, cruzamentos e curvas; ultrapassagens só usam
   faixa existente e livre, sem mirar para fora da via. Viaturas/serviços são excluídos. */
const PANIC={t:0,scan:0,carRadius:25};
function panicCarStart(c){
 if(!c.alive||c===PL.car||c.police||c.chase||c.crim||c.svc||c.taxiAI||c.bench||c.display||c.stationParked||c.keep||c.special||c.tollHold>0||c.t.boat||c.t.hover||c.airY>0||c.weaponPanic||simT<(c.weaponPanicCd||0)||!(c.mode==='rail'||c.ai))return;
 if(c.mode==='rail'){
  if(c._railDelay){railUpdate(c,c._railDelay);c._railDelay=0}
  toPhys(c);
 }
 c.weaponPanic={t:5+R2()*3};
 c.weaponPanicCd=simT+17;
 c.sleep=false;c.sleepT=0;c.hand=false;
 if(c.ai){c.ai.panicLaneCd=0;c.ai.rev=0;c.ai.dodge=0;}
}
function panicCarRejoin(c){
 // A rota original é preservada durante o pânico; basta devolver a velocidade normal.
 // A busca por outra rota é apenas uma recuperação excepcional, se a IA já a perdeu.
 if(c.ai){c.ai.panicLaneCd=0;return true}
 let best=null,bd=Infinity;
 const cx=Math.round(c.x/P),cz=Math.round(c.z/P);
 for(let ix=Math.max(0,cx-1);ix<=Math.min(city.N,cx+1);ix++)for(let iz=Math.max(0,cz-1);iz<=Math.min(city.N,cz+1);iz++)for(let d=0;d<4;d++){
  if(!canDrive(ix,iz,d))continue;
  for(let li=0;li<2;li++){
   if(!laneValid(ix,iz,d,li))continue;
   const dx=D[d][0],dz=D[d][1],ss=clamp((c.x-ix*P)*dx+(c.z-iz*P)*dz,RW/2+3,SEG_END-3),pt=lanePt(ix,iz,d,li,ss),dist=Math.hypot(pt[0]-c.x,pt[1]-c.z);
   if(dist<bd){bd=dist;best={kx:ix,kz:iz,d,li,nd:null,vmax:c.vmax,stun:0,blockT:0,ignore:0}}
  }
 }
 if(best&&bd<18){c.ai=best;c.sleep=false;return true}
 // Fora de qualquer via: não deixar acelerador preso e remover depois, fora de vista.
 c.ai=null;c.thr=0;c.steerT=0;c.hand=true;c.fleeAbandoned=simT;
 return false;
}
function panicCarTick(c,dt){
 const p=c.weaponPanic;if(!p)return false;
 if(!c.alive||c.sunk){c.weaponPanic=null;return false}
 p.t-=dt;
 if(p.t<=0){c.weaponPanic=null;panicCarRejoin(c);return false}
 if(!c.ai){c.weaponPanic=null;panicCarRejoin(c);return false}
 // Reaproveita orientação, waypoints, limites da pista e colisões do tráfego.
 // As únicas exceções de pânico são tratadas em aiUpdate: velocidade, sinais e ultrapassagem.
 aiUpdate(c,dt);return true;
}
function panicTick(dt){if(!played||PL.dead||PL.car||PL.heli||PL.inside||!GUN.has||TVM.on){PANIC.t=Math.max(0,PANIC.t-dt*2);return}
 if((PANIC.scan-=dt)>0)return;PANIC.scan=.5;let n=0;
 for(const q of peds){if(q.cop||q.fixed||q.mate||q.state==='dead'||q.state==='down'||q.state==='lie'||q.corpse)continue;const dx=q.x-PL.x,dz=q.z-PL.z,d=Math.hypot(dx,dz);if(d>18)continue;n++;
  if(q.state!=='flee')panicPedFlee(q,PL.x,PL.z)}
 // Mesmo gatilho dos pedestres: arma visível, sem exigir disparo.
 const max2=PANIC.carRadius*PANIC.carRadius;
 for(const c of vehicles){if((c.x-PL.x)**2+(c.z-PL.z)**2<=max2)panicCarStart(c)}
 if(n){PANIC.t+=.5;if(PANIC.t>=60&&!POL.wanted){PANIC.t=0;startWanted(true);toast('<span style="color:#ff4a4a">ALGUÉM CHAMOU A POLÍCIA</span><br><small style="font-size:11px;color:#fff">muita gente correndo de um homem armado</small>')}}else PANIC.t=Math.max(0,PANIC.t-.5)}
/* ================= POLÍCIA: NÍVEIS, HELICÓPTERO, LANCHA, BLITZ =================
   ★ 1 viatura · ★★ 2 viaturas (elas atiram) · ★★★ 2 viaturas + helicóptero que atira do alto.
   Sobe de nível explodindo 3 coisas durante a fuga; pegar helicóptero na fuga = ★★★; furar blitz = ★★.
   Na água, lancha da polícia com giroflex e sirene (também atira). Todos acertam 40% dos tiros. */
const POLHIT=.4;
function copFireAt(o,dmg,maxD,col){const pc=PL.heli||PL.car||PL,px=pc.x,pz=pc.z,py=PL.heli?PL.heli.y:(PL.car?(PL.car.gy||0)+1:(PL.gy||0)+1.2),d=Math.hypot(px-o.x,pz-o.z);if(d>maxD||PL.dead||PL.inside)return;
 const hit=Math.random()<POLHIT,mx=hit?0:(Math.random()<.5?-1:1)*(1.6+Math.random()*2.5),mz=hit?0:(Math.random()<.5?-1:1)*(1.6+Math.random()*2.5),end=new THREE.Vector3(px+mx,hit?py:Math.max(.1,py-1.5),pz+mz);
 tracer(new THREE.Vector3(o.x,o.y,o.z),end,col||0xff9a7a);gunSound(Math.max(.15,1-d/70),.85);if(!hit){if(Math.random()<.4)emit(end.x,end.y,end.z,0,.6,0,.25,.3,.08,0xd8d0c0,false,.8);return}
 if(PL.car&&!PL.car.t.boat&&PL.car.alive){PL.car.hp-=dmg;if(PL.car.hp<=0)setOnFire(PL.car);rumble(.25,.5,90);return}
 if(CHEAT.hp)return;PL.hp-=armorHit(dmg);rumble(.3,.65,120);bloodHit(px,py,pz,new THREE.Vector3(px-o.x,0,pz-o.z).normalize());if(PL.hp<=0)killPlayer('ABATIDO')}
function copCarShoot(chasers,dt){if((POL.level||1)<2||PL.inside)return;for(const c of chasers){c.shootT=(c.shootT||1+Math.random())-dt;if(c.shootT>0)continue;c.shootT=1.3+Math.random()*.8;const pc=PL.car||PL;if(Math.hypot(pc.x-c.x,pc.z-c.z)<28)copFireAt({x:c.x,y:(c.gy||0)+1.3,z:c.z},7,28)}}
// helicóptero de perseguição (★★★)
const COPH={h:null,respawnAt:0};
// v78: o nível de procurado cai com o tempo de sobrevivência: a cada 10 min (reais) sem subir de nível, cai 1 (mínimo 1).
function polDecayTick(dt){if(!played||!POL.wanted||menuOpen){if(!POL.wanted)POL.lvT=0;return}POL.lvT=(POL.lvT||0)+dt;if((POL.level||1)>1&&POL.lvT>=600){POL.lvT=0;POL.level--;POL.boomW=0;toast('<span style="color:#ffd200">'+'★'.repeat(POL.level)+'</span> '+translatePlain('NÍVEL')+' '+POL.level+'<br><small style="font-size:11px;color:#fff">'+translatePlain('você sobreviveu · a polícia afrouxou o cerco')+'</small>')}}
function copHeliTick(dt){polDecayTick(dt);const want=played&&POL.wanted&&(POL.level||1)>=3&&!city.haze&&!PL.dead,pc=PL.heli||PL.car||PL;let H=COPH.h;
 if(!H){if(!want||PL.inside||simT<COPH.respawnAt)return;const a=Math.random()*6.283;H=COPH.h={o:skyHeli('police'),x:pc.x+Math.cos(a)*170,z:pc.z+Math.sin(a)*170,y:60,yaw:0,shootT:3,leave:0,ang:Math.random()*6.283};scene.add(H.o.g);initAudio();H.snd=heliSound();toast('<span style="color:#4aa8ff">HELICÓPTERO DA POLÍCIA</span> NO AR!')}
 if(H.state==='falling'){
  if(heliFallTick(H,dt)){COPH.h=null;COPH.respawnAt=simT+(want?8:45)}
  return;
 }
 H.vx=H.vz=0;
 if(!want){H.leave+=dt;H.y+=dt*12}else H.leave=0;
 H.ang+=dt*.35;const ty0=PL.heli?PL.heli.y+8:Math.max(groundY(pc.x,pc.z)+30,30),tx=pc.x+Math.cos(H.ang)*20,tz=pc.z+Math.sin(H.ang)*20;
 if(H.leave<=0){const dx=tx-H.x,dz=tz-H.z,d=Math.hypot(dx,dz),sp=Math.min(34,d*1.4);if(d>.1){H.vx=dx/d*sp;H.vz=dz/d*sp;H.x+=H.vx*dt;H.z+=H.vz*dt}H.y+=(ty0-H.y)*Math.min(1,dt*1.2)}
 H.yaw=Math.atan2(pc.z-H.z,pc.x-H.x);const g=H.o.g;g.position.set(H.x,H.y,H.z);g.rotation.set(0,-H.yaw,0);g.rotateZ(-.12);H.o.rot.rotation.y+=dt*30;H.o.tr.rotation.y+=dt*42;
 if(H.o.pl){const f=Math.floor(simT*6)%2;H.o.pl[0].visible=!!f;H.o.pl[1].visible=!f}
 if(H.snd){const d=Math.hypot(H.x-PL.x,H.z-PL.z);H.snd.g.gain.setTargetAtTime(menuOpen||!S.sound?0:Math.max(0,.8-d/220),AC.currentTime,.2)}
 if(want&&!PL.inside){H.shootT-=dt;if(H.shootT<=0){H.shootT=1.1+Math.random()*.6;copFireAt({x:H.x,y:H.y-1,z:H.z},8,90,0xffd070)}}
 if(H.leave>6||(!want&&PL.inside)){scene.remove(H.o.g);disposeGroup(H.o.g);heliSnd(H,false);COPH.h=null}}
// lancha da polícia
function polBoatTick(dt){const onWater=PL.car&&PL.car.t.boat,want=played&&POL.wanted&&onWater&&!city.haze;
 for(const c of listSnap(POLB_SNAP,vehicles))if(c.polBoat&&((!want&&Math.hypot(c.x-PL.x,c.z-PL.z)>90)||!c.alive&&simT-(c.wreckAt||simT)>20))removeVehicle(c);
 if(!want)return;let n=0;for(let i=0;i<vehicles.length;i++)if(vehicles[i].polBoat&&vehicles[i].alive)n++;const cap=(POL.level||1)>=3?2:1;POL.boatT=(POL.boatT||0)-dt;if(n>=cap||POL.boatT>0)return;POL.boatT=6;
 const p=PL.car;for(let k=0;k<60;k++){const a=Math.random()*6.283,d=90+Math.random()*70,x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;if(!inWater(x,z)||!inWater(x+6,z)||!inWater(x-6,z)||!inWater(x,z+6)||!inWater(x,z-6))continue;
  const c=makeVehicle('boat',x,z,Math.atan2(p.z-z,p.x-x),'#1d3470');c.polBoat=true;c.sleep=false;c.hand=false;c.lightsOff=false;c.sirenOn=true;if(c.g){dropCarMesh(c)}ensureDetail(c);toast('<span style="color:#4aa8ff">LANCHA DA POLÍCIA</span> NA ÁGUA!');break}}
function polBoatAI(c,dt){if(!c.alive){c.thr=0;return}const p=PL.car||PL,ca=Math.cos(c.a),sa=Math.sin(c.a),ex=p.x-c.x,ez=p.z-c.z,d=Math.hypot(ex,ez),lx=ex*ca+ez*sa,lz=-ex*sa+ez*ca;let ang=Math.atan2(lz,lx);
 if(!inWater(c.x+ca*10,c.z+sa*10)){ang=(c.avoid||1)*1.4;c.avoid=c.avoid||(Math.random()<.5?1:-1)}else c.avoid=0;
 c.steerT=clamp(ang/(c.t.steer*.75),-1,1);c.thr=d>14?1:d>6?.35:0;c.hand=false;c.sleep=false;
 if(c.ambL){const f=Math.floor(simT*6)%2;c.ambL[0].visible=!!f;c.ambL[1].visible=!f}
 if(POL.wanted){c.shootT=(c.shootT||2)-dt;if(c.shootT<=0){c.shootT=1.3+Math.random()*.7;if(d<40)copFireAt({x:c.x,y:1.8,z:c.z},7,40)}}}
// ---------- JET SKI: parados na beira da praia (e ao lado do píer) e alguns andando no mar ----------
const JET={key:'',spots:[],ai:[],aiT:0};
function jetCoastT(x,z){return city.coast<2?x:z}
function jetWorldKey(){return S.seed+':'+S.style+':'+S.size+':'+(city.worldNo||0)}
function jetInit(){JET.key=jetWorldKey();for(const q of JET.spots)if(q.v&&vehicles.includes(q.v)&&q.v!==PL.car&&!q.v.used)removeVehicle(q.v);for(const v of JET.ai)if(vehicles.includes(v)&&v!==PL.car)removeVehicle(v);JET.spots=[];JET.ai=[];JET.aiT=0;
 if(!city.ext||city.coast==null||S.style==='inverted')return;
 const cs=city.coast,E=city.ext,o=cs===0?[0,-1]:cs===1?[0,1]:cs===2?[-1,0]:[1,0],a=Math.atan2(o[1],o[0]),R=mulberry32((S.seed^0x7e75c1)>>>0);
 // A praia pode ocupar apenas METADE da costa. Sortear entre 15% e 85% de E
 // deixava quase todos os jetskis fora da areia em certas seeds (ex.: 3031265903).
 const br=beachRange(),lo=Math.max(0,br[0])+12,hi=Math.min(E,br[1])-12;
 if(hi<=lo)return;
 const count=S.size===7?3:4,step=(hi-lo)/count;
 const add=t=>{if(t<lo||t>hi||!inSpan(t)||JET.spots.some(q=>Math.abs(jetCoastT(q.x,q.z)-t)<26))return false;
  const p=wTU(cs,t,coastUr(t,SHORE+2.4)),w=wTU(cs,t,coastUr(t,SHORE+6));
  if(!jetOK(p[0],p[1])||!boatOK(w[0],w[1])||pierY(p[0],p[1])!==null||mouthPierBlocked(p[0],p[1]))return false;
  JET.spots.push({x:p[0],z:p[1],a,v:null,cd:0});return true};
 // Espalha os pontos em faixas, com pequena variação fixa da seed. Se um píer/foz
 // bloquear a vaga, procura outra posição NA MESMA faixa, sem perder o jetski.
 for(let k=0;k<count;k++){
  const mid=lo+(k+.5)*step,jit=(R()-.5)*step*.30;
  for(const d of [jit,0,-step*.18,step*.18,-step*.35,step*.35])if(add(mid+d))break;
 }
 // O píer pode ter uma vaga extra, desde que ela também fique na praia navegável.
 const mar=(city.piers||[]).find(q=>q.id==='marina');if(mar)add(jetCoastT(mar.cx,mar.cz)+9);
 // Reserva de contingência para seeds com píeres/fozes cruzando várias faixas.
 if(JET.spots.length<Math.min(3,count))for(let t=lo+14;t<hi-14&&JET.spots.length<Math.min(3,count);t+=17)add(t);
}
function jetTick(dt){if(!played)return;if(JET.key!==jetWorldKey())jetInit();if(!JET.spots.length&&!city.ext)return;const pc=PL.car||PL;
 for(const q of JET.spots){const d=Math.hypot(pc.x-q.x,pc.z-q.z);if(q.v&&(!vehicles.includes(q.v)||q.v.used||q.v===PL.car)){if(q.v.used||q.v===PL.car)q.cd=gameMin()+120;q.v=null}
  if(!q.v&&d<220&&gameMin()>=q.cd){const v=makeVehicle('jetski',q.x,q.z,q.a,pick2(['#e94d36','#2d91cf','#e8b73e','#40b3a1','#151518','#ff4fa3']));v.hand=true;v.sleep=true;q.v=v}
  else if(q.v&&d>330&&q.v!==PL.car&&!q.v.used){removeVehicle(q.v);q.v=null}}
 // andando no mar
 const cs=city.coast,E=city.ext;if(city.haze){ /* v79r2: na Point Haze só ficam as embarcações atracadas — nada de jet ski/lancha passando */
  for(const v of JET.ai.splice(0))if(vehicles.includes(v)&&v!==PL.car&&v.alive)removeVehicle(v);return}if(cs==null)return;const nearSea=outDist(pc.x,pc.z)>-260;
 for(const v of JET.ai.slice()){if(!vehicles.includes(v)||!v.alive||v===PL.car||Math.hypot(v.x-pc.x,v.z-pc.z)>480){if(vehicles.includes(v)&&v!==PL.car&&v.alive)removeVehicle(v);if(v===PL.car)v.jetAI=null;JET.ai.splice(JET.ai.indexOf(v),1);continue}
  const J=v.jetAI;if(!J)continue;let t=jetCoastT(v.x,v.z);if(t<E*.04)J.dir=1;if(t>E*.96)J.dir=-1;const tg=wTU(cs,t+J.dir*35,J.u),ca=Math.cos(v.a),sa=Math.sin(v.a),ex=tg[0]-v.x,ez=tg[1]-v.z,ang=Math.atan2(-ex*sa+ez*ca,ex*ca+ez*sa);
  v.sleep=false;v.hand=false;v.steerT=clamp(ang/(v.t.steer*.75),-1,1);v.thr=Math.abs(ang)>1.2?.4:J.thr}
 JET.aiT-=dt;if(JET.aiT<=0&&nearSea&&JET.ai.length<2&&S.style!=='inverted'){JET.aiT=8;const t=jetCoastT(pc.x,pc.z)+(Math.random()-.5)*300,u=SHORE+18+Math.random()*30,p=wTU(cs,clamp(t,E*.08,E*.92),u);if(boatOK(p[0],p[1])&&Math.hypot(p[0]-pc.x,p[1]-pc.z)>60){const dir=Math.random()<.5?1:-1,ta=wTU(cs,clamp(t,E*.08,E*.92)+dir*10,u),v=makeVehicle('jetski',p[0],p[1],Math.atan2(ta[1]-p[1],ta[0]-p[0]),pick2(['#e94d36','#2d91cf','#e8b73e','#40b3a1','#ff4fa3']));v.jetAI={dir,u,thr:.6+Math.random()*.3};v.sleep=false;JET.ai.push(v)}}}
