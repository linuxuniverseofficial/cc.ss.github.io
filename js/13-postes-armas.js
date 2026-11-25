'use strict';
/* Coastal Chaos · js/13-postes-armas.js — Postes, cabos, árvores, jammer, armas, colecionáveis, projéteis, granada, bomba, sangue, policiais a pé.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= LAMPS, CABLES, TREES (breakable) ================= */
const ZM=new THREE.Matrix4().makeScale(0,0,0);
const fallers=[];const LAMP_ON=COL('#ffc070'),LAMP_OFF=COL('#5c584f');
const deadHeadMat=new THREE.MeshStandardMaterial({color:0x34303a,roughness:.6});
// Iluminacao real de postes em ate tres quarteiroes do jogador.
// Um conjunto reutilizavel maior evita que so tres postes parecam acender ao aproximar.
const NEAR_LAMP_RADIUS=3*P, NEAR_LAMP_RANGE=14, NEAR_LAMP_COUNT=4;
const nearLampLights=Array.from({length:NEAR_LAMP_COUNT},()=>{
 const light=new THREE.PointLight(0xffc477,0,NEAR_LAMP_RANGE,2);
 light.castShadow=false;light.visible=true;/* v78: luz VIRTUAL (fora da cena): nao ilumina malhas, so alimenta o tom dos sprites (actor light). Luz real so nos farois. */return {light,lamp:null};
});
let nearLampTimer=0;
function updateNearbyLampLights(dt){
 nearLampTimer-=dt;
 const p=PL.car||PL;
 if(!running||!p||PL.inside||DN.nightF<.32||S.lampLighting===false){
  for(const slot of nearLampLights){slot.light.intensity=0;slot.lamp=null}
  carLampSync();return;
 }
 if(nearLampTimer<=0){
  nearLampTimer=.16;
  const candidates=[],radius2=NEAR_LAMP_RADIUS*NEAR_LAMP_RADIUS;
  for(const ch of city.chunks.values()){
   if(!ch.lamps)continue;
   for(const l of ch.lamps){
    if(l.broken||!l.on)continue;
    const dx=l.x-p.x,dz=l.z-p.z,d2=dx*dx+dz*dz;
    if(d2<=radius2)candidates.push({l,d2});
   }
  }
  candidates.sort((a,b)=>a.d2-b.d2);
  const chosen=candidates.slice(0,NEAR_LAMP_COUNT);
  const chosenSet=new Set(chosen.map(e=>e.l));
  // Conservar a atribuicao de luzes ja existentes, evitando saltos entre postes.
  for(const slot of nearLampLights)if(slot.lamp&&!chosenSet.has(slot.lamp))slot.lamp=null;
  const assigned=new Set(nearLampLights.map(slot=>slot.lamp).filter(Boolean));
  for(const entry of chosen){
   if(assigned.has(entry.l))continue;
   const slot=nearLampLights.find(slot=>!slot.lamp);
   if(!slot)break;
   slot.lamp=entry.l;assigned.add(entry.l);
  }
 }
 for(const slot of nearLampLights){
  const l=slot.lamp,light=slot.light;
  if(!l){light.intensity=0;continue}
  const dist=Math.hypot(l.x-p.x,l.z-p.z);
  const fade=Math.max(0,Math.min(1,(NEAR_LAMP_RADIUS-dist)/(P*.65)));
  light.position.set(l.x+l.dx*1.6,5.65,l.z+l.dz*1.6);
  light.intensity=1.65*fade;light.visible=true;
 }
 carLampSync();
}
// Halo rente ao asfalto, com pequena folga para evitar z-fighting.
let LAMPF=0;
function lampGlowM(l){
 // Halo restrito ao lado da rua: nao atravessa a guia elevada da calcada.
 // O eixo comprido acompanha a via; o eixo curto aponta para o asfalto.
 const cx=l.x+l.dx*4.1,cz=l.z+l.dz*4.1;
 const ang=Math.atan2(l.dx,l.dz);
 return mtx(cx,.075,cz,7.2,1,12.5,0,ang,0);
}
function buildChunkLamps(ch){const M=city.M,n=ch.lamps.length;if(!n)return;const night=city.st.night;
 const pole=new THREE.InstancedMesh(M.poleGeo,M.pole,n),head=new THREE.InstancedMesh(M.headGeo,M.head,n),glow=new THREE.InstancedMesh(M.glowGeo,M.lglow,n);
 pole.castShadow=true;pole.receiveShadow=true;glow.renderOrder=2;
 ch.lamps.forEach((l,i)=>{l.i=i;const m=mtx(l.x,.2,l.z,1,1,1,0,Math.atan2(-l.dz,l.dx),0);pole.setMatrixAt(i,m);head.setMatrixAt(i,m);l.on=Math.max(DN.nightF,LAMPF)>l.th&&!jammerBlocked(l.x,l.z);head.setColorAt(i,l.on?LAMP_ON:LAMP_OFF);glow.setMatrixAt(i,l.on&&S.lampLighting!==false?lampGlowM(l):ZM)});
 for(const m of [pole,head,glow]){m.frustumCulled=false;ch.group.add(m)}ch.lampIM={pole,head,glow}}
function cablePts(ax,ay,az,bx,by,bz,sag,arr,off){for(let k=0;k<10;k++){for(const[t,oo] of [[k/10,0],[(k+1)/10,3]]){arr[off+oo]=ax+(bx-ax)*t;arr[off+oo+1]=ay+(by-ay)*t-sag*4*t*(1-t);arr[off+oo+2]=az+(bz-az)*t}off+=6}}
// Fiação por região: campo 1, cidade 2, distrito industrial 3.
// Pequenos isoladores retangulares prendem os cabos ao topo reto do poste.
const CABLE_LEVELS=[5.05,4.76,4.47];
function lampWireCount(l){
 const ri=rectNear(l.x,l.z),info=ri>=0&&city.info[ri];
 return info&&info.kind==='industrial'?3:info&&info.kind==='rural'?1:2;
}
function cableAnchor(l,j){
 // Os fios passam ao lado da coluna, não pelo braço curvo da luminária.
 const side=j===0?0:j===1?.19:-.19;
 return [l.x-l.dz*side,CABLE_LEVELS[j],l.z+l.dx*side];
}
/* Detalhes de bairro residencial: bola ou frisbee presos na copa de algumas árvores e
   par de tênis pendurado pelo cadarço nos fios dos postes. Geometria e materiais compartilhados. */
const TOYS={g:null};
function toysInit(){if(TOYS.g)return;const M=c=>new THREE.MeshLambertMaterial({color:c});TOYS.g={ball:new THREE.SphereGeometry(.16,10,8),disc:new THREE.CylinderGeometry(.2,.17,.035,14),shoe:new THREE.BoxGeometry(.13,.12,.3),sole:new THREE.BoxGeometry(.14,.04,.32),toe:new THREE.BoxGeometry(.12,.06,.08)};
 TOYS.m={balls:['#e8202a','#2a6ad6','#f2c21a','#f4f4f0','#ff7a1a'].map(M),discs:['#ff3ea5','#2ad6ff','#f4f4f0','#ffd21a','#ff7a1a'].map(M),shoe:['#f4f4f0','#1b1b1b','#d62828','#2a6ad6'].map(M),sole:M('#e8e8e0'),dark:M('#2a2a30'),lace:new THREE.LineBasicMaterial({color:0xe8e8e0})};
 TOYS.white=new THREE.MeshLambertMaterial({color:0xffffff});TOYS.vc=new THREE.MeshLambertMaterial({vertexColors:true});TOYS.white.userData.cached=TOYS.vc.userData.cached=true;
 TOYS.gn={shoe:TOYS.g.shoe.toNonIndexed(),sole:TOYS.g.sole.toNonIndexed(),toe:TOYS.g.toe.toNonIndexed()}}
function isHouseZone(x,z){const ri=rectNear(x,z);return ri>=0&&city.info[ri]&&city.info[ri].kind==='houses'}
// v78: mesmas posições, cores e sorteios (mesma ordem de R()), mas em lote: bolas e frisbees viram 2 InstancedMesh
// por chunk (cor por instância, Lambert branco × cor = mesma cor de antes); t.toy esconde só a sua instância quando a
// árvore cai. Tênis nos fios: as 3 peças de cada pé assadas numa malha Lambert com cor por vértice; cadarços numa só
// LineSegments. Antes: 1 draw por brinquedo e 7 por par de tênis.
function buildStuckToys(ch){if(city.haze)return;const R=mulberry32(((ch.key||'').split('').reduce((a,c)=>a*31+c.charCodeAt(0)|0,7)^S.seed^0x7011)>>>0);let made=0;
 const toys=[],dummy=new THREE.Object3D(),shoeMB=new MB(),lace=[];
 for(const t of ch.trees||[]){if(t.night||!isHouseZone(t.x,t.z)||R()>.1)continue;toysInit();const a=R()*6.283,s=t.s,disc=R()<.45,mat=disc?TOYS.m.discs[Math.floor(R()*5)]:TOYS.m.balls[Math.floor(R()*5)];
  dummy.position.set(t.x+Math.cos(a)*1.78*s,t.y0+2.35*s+R()*.5*s,t.z+Math.sin(a)*1.78*s);if(disc){dummy.rotation.set(.4+R()*.6,R()*3,.3)}else dummy.rotation.set(0,0,0);dummy.updateMatrix();
  toys.push({t,disc,col:mat.color,m:dummy.matrix.clone()});made++}
 for(const disc of[false,true]){const L=toys.filter(q=>q.disc===disc);if(!L.length)continue;
  const im=new THREE.InstancedMesh(disc?TOYS.g.disc:TOYS.g.ball,TOYS.white,L.length);im.frustumCulled=false;im.castShadow=false;
  L.forEach((q,i)=>{im.setMatrixAt(i,q.m);im.setColorAt(i,q.col);let vis=true;
   q.t.toy={get visible(){return vis},set visible(v){if(v===vis)return;vis=!!v;im.setMatrixAt(i,vis?q.m:ZM);im.instanceMatrix.needsUpdate=true}}});
  ch.group.add(im)}
 for(const cb of ch.cables||[]){if(cb.j!==0||!isHouseZone(cb.a.x,cb.a.z)||R()>.07)continue;toysInit();const A=cableAnchor(cb.a,cb.j),B=cableAnchor(cb.b,cb.j),t=.3+R()*.4,x=A[0]+(B[0]-A[0])*t,z=A[2]+(B[2]-A[2])*t,y=A[1]+(B[1]-A[1])*t-.55*4*t*(1-t);
  const dx=B[0]-A[0],dz=B[2]-A[2],l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l,col=TOYS.m.shoe[Math.floor(R()*4)];
  for(const sd of [-1,1]){const drop=.45+(sd>0?.12:0),sx=x+ux*sd*.13,sz=z+uz*sd*.13,sh=new THREE.Group();sh.position.set(sx,y-drop,sz);sh.rotation.y=Math.atan2(ux,uz)+R()*.6-.3;sh.rotation.x=1.25+sd*.15;
   const b=new THREE.Object3D(),so=new THREE.Object3D(),to=new THREE.Object3D();so.position.y=-.07;to.position.set(0,-.02,.16);sh.add(b,so,to);sh.updateMatrixWorld(true);
   shoeMB.geo(TOYS.gn.shoe,b.matrixWorld,col.color);shoeMB.geo(TOYS.gn.sole,so.matrixWorld,TOYS.m.sole.color);shoeMB.geo(TOYS.gn.toe,to.matrixWorld,TOYS.m.sole.color);
   lace.push(x,y,z,sx,y-drop+.1,sz)}
  made++}
 if(lace.length){const sm=shoeMB.mesh(TOYS.vc,false,false);if(sm)ch.group.add(sm);
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lace,3));ch.group.add(new THREE.LineSegments(lg,TOYS.m.lace))}
 return made}
function buildCables(ch){
 const groups=new Map();
 for(const l of ch.lamps){
  l.wireCount=lampWireCount(l);
  const k=l.dz!==0?'h'+Math.round(l.z)+'|'+l.dz:'v'+Math.round(l.x)+'|'+l.dx;
  let a=groups.get(k);if(!a){a=[];groups.set(k,a)}a.push(l);
 }
 // Isoladores quadrados discretos, sem alterar a geometria curva da luminária.
 const insGeo=new THREE.BoxGeometry(.29,.12,.29);
 const insMat=new THREE.MeshStandardMaterial({color:0x55545a,roughness:.85,metalness:.25});
 const count=ch.lamps.reduce((n,l)=>n+l.wireCount,0);
 const ins=new THREE.InstancedMesh(insGeo,insMat,count);let idx=0;
 for(const l of ch.lamps){l.insStart=idx;
  for(let j=0;j<l.wireCount;j++){
   const a=cableAnchor(l,j);ins.setMatrixAt(idx++,mtx(a[0],a[1],a[2],1,1,1));
  }
 }
 ins.frustumCulled=false;ch.group.add(ins);ch.wireIns=ins;
 // Cada segmento mantém seu número de fios; mudanças de zona são graduais.
 const list=[];
 for(const a of groups.values()){
  a.sort((p,q)=>p.dz!==0?p.x-q.x:p.z-q.z);
  for(let i=0;i+1<a.length;i++){
   const d=Math.hypot(a[i].x-a[i+1].x,a[i].z-a[i+1].z);
   if(d>6&&d<32)for(let j=0;j<Math.min(a[i].wireCount,a[i+1].wireCount);j++)list.push({a:a[i],b:a[i+1],j});
  }
 }
 const arr=new Float32Array(list.length*60);
 list.forEach((cb,i)=>{cb.off=i*60;const A=cableAnchor(cb.a,cb.j),B=cableAnchor(cb.b,cb.j);cablePts(...A,...B,.55,arr,cb.off)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
 const ls=new THREE.LineSegments(g,city.M.cable);ls.frustumCulled=false;
 ch.group.add(ls);ch.cables=list;ch.cableGeo=g;
}
/* v1r25: TORRES DE ALTA TENSÃO na roça. Linha norte→sul por uma coluna de lotes rurais; uma torre por quarteirão,
   num ponto livre do lote (longe de casas, fardos, pedras e copas; nunca na rua). Cabos = mesmo LineSegments/material dos
   postes da rua (cablePts), com vão longo podendo passar sobre casas e ruas. Nas bordas do mapa (que não são praia) a linha
   continua 3 torres pra fora. Luzes vermelhas de balizamento no corpo (acesas sempre, halo mais forte à noite).
   Montado depois do preload (colisores de todos os chunks prontos); gerador próprio → não mexe no R() da cidade. */
function pylonGeom(night){const mb=new MB(),bg=new THREE.BoxGeometry(1,1,1).toNonIndexed(),col=COL(night?'#2c2a36':'#5c6068'),dk=COL(night?'#1c1a24':'#34363c'),ins=COL(night?'#4a4858':'#8a9098'),
 v=new THREE.Vector3(),q=new THREE.Quaternion(),Z=new THREE.Vector3(0,0,1),m=new THREE.Matrix4(),sc=new THREE.Vector3(),ps=new THREE.Vector3();
 const beam=(a,b,w,c)=>{v.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const L=v.length();v.normalize();q.setFromUnitVectors(Z,v);sc.set(w,w,L+w*.6);ps.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.compose(ps,q,sc);mb.geo(bg,m,c||col)};
 const B=1.6,T=.42,YT=15,PK=17,hw=y=>B+(T-B)*Math.min(y,YT)/YT,C=[[1,1],[-1,1],[-1,-1],[1,-1]],LV=[0,3.2,6.2,8.8,10.8,12.9,15];
 for(const[a,b] of C)beam([a*B,0,b*B],[a*T,YT,b*T],.17);
 for(let k=0;k<LV.length;k++){const y=LV[k],h=hw(y);if(k)for(let i=0;i<4;i++){const p=C[i],n=C[(i+1)%4];beam([p[0]*h,y,p[1]*h],[n[0]*h,y,n[1]*h],.09)}
  if(k+1<LV.length){const y2=LV[k+1],h2=hw(y2);for(let i=0;i<4;i++){const p=C[i],n=C[(i+1)%4];beam([p[0]*h,y,p[1]*h],[n[0]*h2,y2,n[1]*h2],.06);beam([n[0]*h,y,n[1]*h],[p[0]*h2,y2,p[1]*h2],.06)}}}
 for(const[a,b] of C)beam([a*T,YT,b*T],[0,PK,0],.09);beam([-.8,16.3,0],[.8,16.3,0],.07);
 const att=[],lights=[[0,PK+.18,0]]; /* r26: sem a luz baixa do meio das pernas */
 for(const[y,L] of [[10.8,3.0],[12.9,3.5],[15,3.0]])for(const sd of[-1,1]){const h=hw(y),h1=hw(y+1.1),tip=[sd*L,y,0];
  beam([sd*h,y,.38],tip,.09);beam([sd*h,y,-.38],tip,.09);beam([sd*h1,y+1.1,0],tip,.08);beam([sd*(h+L)/2,y,0],[sd*h1,y+1.1,0],.05);
  const ix=sd*(L-.2);beam([ix,y,0],[ix,y-1.05,0],.07,dk);for(let d=0;d<4;d++){const yy=y-.28-d*.24;mb.box(ix-.15,yy-.04,-.15,ix+.15,yy+.04,.15,ins)}
  att.push([ix,y-1.1,0]);lights.push([sd*(L+.05),y+.12,0])}
 att.push([0,PK,0]);const me=mb.mesh(new THREE.MeshLambertMaterial({vertexColors:true}),true,true);bg.dispose();return{geo:me.geometry,mat:me.material,att,lights,hw}}
let TREE_RURAL_K=2; /* r32: escala das árvores comuns na roça */
const RING_DEPTH=34;
const PYL_K=1.25; /* r26: ~21 m até o para-raios (≈4× uma casa da roça de 5,3 m); fase mais baixa a ~12 m; vão de 76 m com flecha ~1,5 m → cabo ≥10 m do chão (real 138 kV: torre 25–35 m, cabo ≥7 m) */
// Lowest point of the rendered cable over the padded building footprint.
function ringCableHeight(cables,box){
 let height=Infinity;
 for(let i=0;i<cables.length;i+=6){
  let lo=0,hi=1;
  for(const [axis,min,max] of [[0,box.x0-.75,box.x1+.75],[2,box.z0-.75,box.z1+.75]]){
   const start=cables[i+axis],delta=cables[i+axis+3]-start;
   if(Math.abs(delta)<1e-6){if(start<min||start>max){hi=-1;break}continue}
   const a=(min-start)/delta,b=(max-start)/delta;
   lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
   if(lo>hi)break;
  }
  if(lo<=hi){
   const y=cables[i+1],dy=cables[i+4]-y;
   height=Math.min(height,y+dy*(dy<0?hi:lo));
  }
 }
 return height;
}
function fitRingUnderCables(cables){
 for(const ch of city.chunks.values()){
  const edited=new Set();
  for(const {rp,ranges,col,actors,props,iso} of ch.ringGeometry||[]){
   if(!col)continue;
   const limit=ringCableHeight(cables,iso||col)-.8;
   const highest=iso?.y1??col.top+4.2;
   if(highest<=limit)continue;
   const roof=col.top,newRoof=roof-(highest-limit);
   // Preserve the ground floor and translate the roof kit as a unit.
   const pivot=Math.min(3.2,newRoof*.65),scale=(newRoof-pivot)/(roof-pivot);
   const move=y=>y<=pivot?y:y>=roof?y+newRoof-roof:pivot+(y-pivot)*scale;
   for(const {mesh,from,to} of ranges){
    if(!mesh)continue;
    const {position,uv,aTop}=mesh.geometry.attributes;
    const wall=mesh===ch.actorWallMesh||mesh===ch.actorAbWallMesh;
    for(let i=from;i<to;i++){
     const y=position.getY(i),next=move(y);
     position.setY(i,next);
     if(wall)uv.setY(i,uv.getY(i)+(next-y)/25.6);
     if(aTop)aTop.setX(i,move(aTop.getX(i)));
    }
    if(wall)uv.needsUpdate=true;
    if(aTop)aTop.needsUpdate=true;
    edited.add(mesh.geometry);
   }
   for(const actor of actors)actor.jy=move(actor.gy+actor.jy)-actor.gy;
   for(const prop of props){
    prop.position.y=move(prop.position.y);
    prop.scale.y*=scale;
   }
   col.top=newRoof;
   rp[5]=newRoof;
   if(iso)iso.y1=move(highest);
  }
  for(const geo of edited){
   geo.attributes.position.needsUpdate=true;
   geo.computeBoundingBox();
   geo.computeBoundingSphere();
  }
  // The existing chunk bounds are conservative after lowering.
  ch.ringGeometry=null;
 }
}
function pylonsBuild(){city.pylons=null;if(city.haze||!city.rects||!city.rects.length)return;const N=city.N,E=city.ext,rnd=mulberry32((S.seed^0x7e1a5c3d)>>>0),cc=k=>k*P+RW/2+BS/2;
 const ruralAt=(x,z)=>{for(let i=0;i<city.rects.length;i++){const r=city.rects[i];if(x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]){const f=city.info[i];return f&&f.kind==='rural'&&!f.forest&&!f.safe?i:-1}}return -1};
 const free=(x,z,ri)=>{const r=city.rects[ri];if(x<r[0]+5.4||x>r[2]-5.4||z<r[1]+5.4||z>r[3]-5.4)return false;
  for(const c of query(x,z,7)){if(c.dead)continue;const dx=Math.abs(x-clamp(x,c.x0,c.x1)),dz=Math.abs(z-clamp(z,c.z0,c.z1));if(c.kind==='tree'){if((dx/5.6)**2+(dz/3.8)**2<1)return false}else if(dx<3.4&&dz<3.4)return false}return true};
 const cols=[];for(let i=0;i<N;i++){let n=0;for(let j=0;j<N;j++)if(ruralAt(cc(i),cc(j))>=0)n++;cols.push({i,n,r:rnd()})}
 cols.sort((a,b)=>b.n-a.n||a.r-b.r);const pick=[];
 for(const c of cols){if(c.n<(pick.length?3:1))break;if(pick.some(p=>Math.abs(p.i-c.i)<4))continue;pick.push(c);if(pick.length>=(N>=14?2:1))break}
 const cand=[];for(let a=-4;a<=4;a++)for(let b=-9;b<=9;b++)cand.push([a*2.4,b*2,Math.abs(a)*2.4*1.6+Math.abs(b)*2]);cand.sort((p,q)=>p[2]-q[2]);
 const lines=[];
 for(const c of pick){const X=cc(c.i)+(rnd()-.5)*12,L=[];
  for(let j=0;j<N;j++){const z0=cc(j)+(rnd()-.5)*6;for(const[dx,dz] of cand){const x=X+dx,z=z0+dz,ri=ruralAt(x,z);if(ri>=0&&free(x,z,ri)){L.push({x,z,j});break}}}
  let seg=[];const flush=()=>{seg.ci=c.i;if(seg.length>=2||(seg.length===1&&((seg[0].j<=3&&city.coast!==0)||(seg[0].j>=N-4&&city.coast!==1))))lines.push(seg);seg=[]};
  for(const t of L){if(seg.length&&t.j-seg[seg.length-1].j>3)flush();seg.push(t)}flush()}
 for(const sg of lines){const a=sg[0],b=sg[sg.length-1];
  /* entra/sai do mapa: se a ponta está a até 3 quadras da borda (sem praia), o vão passa por cima do que houver e a linha segue fora do mapa */
  if(a.j<=3&&city.coast!==0)for(let k=1;k<=3;k++){const z=Math.min(cc(-k)+(rnd()-.5)*6,-(RW/2+RING_DEPTH+6));if(inWater(a.x,z))break;sg.unshift({x:a.x,z,out:true})}
  if(b.j>=N-4&&city.coast!==1)for(let k=0;k<3;k++){const z=Math.max(cc(N+k)+(rnd()-.5)*6,E+RW/2+RING_DEPTH+6);if(inWater(b.x,z))break;sg.push({x:b.x,z,out:true})}}
 /* r28: com 2 filas, uma 3ª linha leste–oeste liga as duas: mesma quadra (linha j) com torre nas duas filas; torres nos lotes rurais
    livres entre elas (mesma regra), vãos de no máx. 3 quadras; prefere a ligação com mais torres e mais perto do meio do mapa */
 {const segs=lines.filter(sg=>sg.ci!=null&&sg.filter(t=>!t.out).length>=2);let best=null;
  for(let a=0;a<segs.length;a++)for(let b=a+1;b<segs.length;b++){if(segs[a].ci===segs[b].ci)continue;const Lf=segs[a].ci<segs[b].ci?segs[a]:segs[b],Rt=Lf===segs[a]?segs[b]:segs[a];
   for(const ta of Lf)if(!ta.out)for(const tb of Rt)if(!tb.out&&ta.j===tb.j){const j=ta.j,z0=(ta.z+tb.z)/2,mid=[];let ok=true,last=Lf.ci;
    for(let i=Lf.ci+1;i<Rt.ci;i++){let got=null;for(const[dz,dx] of cand){const x=cc(i)+dx,z=z0+dz,ri=ruralAt(x,z);if(ri>=0&&free(x,z,ri)){got={x,z,j,conn:true};break}}
     if(got){if(i-last>3){ok=false;break}mid.push(got);last=i}}
    if(!ok||Rt.ci-last>3)continue;const sc=mid.length*10-Math.abs(j-(N-1)/2)-Math.abs(ta.z-tb.z)*.05;if(!best||sc>best.sc)best={sc,ta,tb,mid}}}
  if(best){best.ta.junc=best.tb.junc=true;const sg=[best.ta,...best.mid,best.tb];sg.conn=true;lines.push(sg)}}
 const towers=[],seen=new Set();for(const sg of lines){if(sg.length<2)continue;sg.forEach((t,k)=>{if(seen.has(t))return;seen.add(t);const p=sg[Math.max(0,k-1)],n=sg[Math.min(sg.length-1,k+1)];t.yaw=Math.atan2(n.x-p.x,n.z-p.z);t.y=groundY(t.x,t.z);towers.push(t)})}
 if(!towers.length){for(const ch of city.chunks.values())ch.ringGeometry=null;return;}
 const night=!!city.st.synth,noL=!!city.st.noLamps,G=pylonGeom(night),grp=new THREE.Group();grp.name='pylons';
 const im=new THREE.InstancedMesh(G.geo,G.mat,towers.length);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
 const lgM=noL?new THREE.MeshStandardMaterial({color:0x261c1c,roughness:.72,metalness:.2}):new THREE.MeshBasicMaterial({color:0xff2414}),lgG=new THREE.BoxGeometry(.2,.2,.2),nl=G.lights.length,lim=new THREE.InstancedMesh(lgG,lgM,towers.length*nl);lim.frustumCulled=false;
 const gpos=new Float32Array(towers.length*nl*3),M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),ONE=new THREE.Vector3(1,1,1),Y=new THREE.Vector3(0,1,0);
 const K=PYL_K,W=(t,p)=>{const c=Math.cos(t.yaw),s_=Math.sin(t.yaw);return[t.x+K*(p[0]*c+p[2]*s_),t.y+K*p[1],t.z+K*(-p[0]*s_+p[2]*c)]},KS=new THREE.Vector3(K,K,K);
 const cc0=curChunk;curChunk=null;
 towers.forEach((t,i)=>{Q.setFromAxisAngle(Y,t.yaw);V.set(t.x,t.y,t.z);M4.compose(V,Q,KS);im.setMatrixAt(i,M4);
  G.lights.forEach((lp,k)=>{const w=W(t,lp);M4.makeTranslation(w[0],w[1],w[2]);lim.setMatrixAt(i*nl+k,M4);gpos.set(w,(i*nl+k)*3)});
  for(const[a,b] of [[1,1],[-1,1],[-1,-1],[1,-1]]){const w=W(t,[a*1.6,0,b*1.6]);const col=addCol(w[0]-.4,w[2]-.4,w[0]+.4,w[2]+.4,'rock');col.pyl=true}});
 curChunk=cc0;
 const spans=[];for(const sg of lines)for(let k=0;k+1<sg.length;k++)spans.push([sg[k],sg[k+1],!!sg.conn]);
 const na=G.att.length,arr=new Float32Array(spans.length*na*60);let off=0;
 /* torre de junção: a ligação chega amarrada no corpo da torre (cantos da face voltada pra ligação), na altura de cada braço */
 const JA=(t,yc,p,fw)=>{if(p[0]===0)return W(t,p);const y=p[1]+1.1,h=G.hw(y);return W({x:t.x,y:t.y,z:t.z,yaw:yc},[Math.sign(p[0])*h*.9,y,fw*h])};
 for(const[a,b,cn] of spans){const span=Math.hypot(b.x-a.x,b.z-a.z),sag=clamp(span*.02,.8,3),yc=Math.atan2(b.x-a.x,b.z-a.z);for(const p of G.att){const A=cn&&a.junc?JA(a,yc,p,1):W(a,p),Bp=cn&&b.junc?JA(b,yc,p,-1):W(b,p);cablePts(...A,...Bp,p[0]===0?sag*.8:sag,arr,off);off+=60}}
 fitRingUnderCables(arr);
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(arr,3));const cl=new THREE.LineSegments(cg,city.M.cable);cl.frustumCulled=false;
 if(noL){grp.add(im,lim,cl)}else{
  const tc=document.createElement('canvas');tc.width=tc.height=64;{const g=tc.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,'rgba(255,170,150,.9)');gr.addColorStop(.45,'rgba(255,60,40,.35)');gr.addColorStop(1,'rgba(255,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64)}
  const gt=new THREE.CanvasTexture(tc),gm=new THREE.PointsMaterial({map:gt,color:0xff3a22,size:2.6,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.3});
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(gpos,3));const pts=new THREE.Points(gg,gm);pts.frustumCulled=false;pts.renderOrder=3;
  pts.onBeforeRender=()=>{const nf=Math.max(DN.nightF||0,typeof LAMPF==='number'?LAMPF:0);gm.opacity=(.16+.84*nf)*(.72+.28*Math.sin(performance.now()*.0022))};
  grp.add(im,lim,cl,pts)}
 city.group.add(grp);city.pylons={towers,lines,grp};
 /* r32: árvores 2× da roça que ficam sob a linha (copa alcançaria os cabos/braços) voltam ao tamanho normal → faixa baixa sob as torres */
 try{const segD=(px,pz,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz||1,t=clamp(((px-a.x)*dx+(pz-a.z)*dz)/L2,0,1);return Math.hypot(px-(a.x+dx*t),pz-(a.z+dz*t))};
  for(const ch of city.chunks.values())for(const tr of ch.trees||[]){if(!tr.big||tr.broken)continue;const lim=7+1.9*tr.s+1;let hit=false;for(const[a,b] of spans){if(segD(tr.x,tr.z,a,b)<lim){hit=true;break}}if(hit)treeRescale(tr,1/TREE_RURAL_K)}}catch(e){console.error(e)}
}
/* r26: torres no mapa como camada (antes gravadas no mapCv) */
function treeRescale(tr,f){const src=tr.forest?tr.ch.forestTreeMesh:tr.ch.plantMesh;if(!src)return;const pa=src.geometry.attributes.position;
 for(let i=tr.v0;i<tr.v1;i++)pa.setXYZ(i,tr.x+(pa.getX(i)-tr.x)*f,tr.y0+(pa.getY(i)-tr.y0)*f,tr.z+(pa.getZ(i)-tr.z)*f);pa.needsUpdate=true;src.geometry.computeBoundingSphere();tr.s*=f;tr.crown=tr.y0+(tr.crown-tr.y0)*f;tr.big=false}
function pylonMap(g,sc){const P_=city.pylons;if(!P_)return;g.save();g.strokeStyle='rgba(28,28,38,.6)';g.lineWidth=1.2/sc;for(const sg of P_.lines){g.beginPath();sg.forEach((t,k)=>k?g.lineTo(t.x+MOFF,t.z+MOFF):g.moveTo(t.x+MOFF,t.z+MOFF));g.stroke()}
 const a=3.6/sc,b=1.4/sc;for(const t of P_.towers){g.fillStyle='#2e2e38';g.fillRect(t.x+MOFF-a/2,t.z+MOFF-a/2,a,a);g.fillStyle=S.style==='inverted'?'#585860':'#ff3a22';g.fillRect(t.x+MOFF-b/2,t.z+MOFF-b/2,b,b)}g.beginPath();g.restore()}
function dropCables(l){
 const ch=l.ch;if(!ch||!ch.cableGeo)return;
 if(ch.wireIns){for(let j=0;j<l.wireCount;j++)ch.wireIns.setMatrixAt(l.insStart+j,ZM);ch.wireIns.instanceMatrix.needsUpdate=true}
 const arr=ch.cableGeo.attributes.position.array;
 for(const cb of ch.cables){if(cb.a!==l&&cb.b!==l)continue;
  const A=cb.a.broken?[cb.a.x,.25,cb.a.z]:cableAnchor(cb.a,cb.j);
  const B=cb.b.broken?[cb.b.x,.25,cb.b.z]:cableAnchor(cb.b,cb.j);
  cablePts(...A,...B,(cb.a.broken&&cb.b.broken)?0:.3,arr,cb.off);
  if(!city.st.noLamps)for(let i=0;i<5;i++)emit((A[0]+B[0])/2,2.5,(A[2]+B[2])/2,(Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4,.5,.2,.05,0x9ad8ff,true,1);
 }
 ch.cableGeo.attributes.position.needsUpdate=true;
}
function breakPole(b,c){b.dead=true;const l=b.lamp;if(!l||l.broken)return;l.broken=true;invalidateStaticShadows();const IM=l.ch&&l.ch.lampIM,M=city.M;
 if(IM){for(const m of [IM.pole,IM.head,IM.glow]){m.setMatrixAt(l.i,ZM);m.instanceMatrix.needsUpdate=true}}
 const g=new THREE.Group();g.position.set(l.x,.2,l.z);const inner=new THREE.Group();inner.rotation.y=Math.atan2(-l.dz,l.dx);
 const pm=new THREE.Mesh(M.poleGeo,M.pole);pm.castShadow=true;inner.add(pm);inner.add(new THREE.Mesh(M.headGeo,deadHeadMat));g.add(inner);city.group.add(g);
 let dx=c.vx,dz=c.vz;const sp=Math.hypot(dx,dz)||1;dx/=sp;dz/=sp;
 fallers.push({g,ax:new THREE.Vector3(dz,0,-dx),th:0,om:Math.min(2.5,sp*.12)+.4,done:false,tip:[l.x+dx*5.4,l.z+dz*5.4]});
 if(fallers.length>40){const o=fallers.shift();if(o.kind!=null)debrisGone(o);else city.group.remove(o.g)}
 if(!city.st.noLamps){for(let i=0;i<14;i++)emit(l.x,.6+Math.random()*4.5,l.z,(Math.random()-.5)*7+dx*3,Math.random()*4,(Math.random()-.5)*7+dz*3,.45,.22,.06,city.st.synth?0xffb050:0xfff0b0,true,1);sparkSound()}
 dropCables(l);c.vx*=.82;c.vz*=.82}
function breakTree(b,c){try{const _t=b&&b.tree;if(_t&&_t.toy)_t.toy.visible=false}catch(e){}b.dead=true;const tr=b.tree;if(!tr||tr.broken||!tr.ch)return;
 const source=tr.forest?tr.ch.forestTreeMesh:tr.ch.plantMesh;
 if(!source)return;tr.broken=true;invalidateStaticShadows();
 const g=source.geometry,pa=g.attributes.position,na=g.attributes.normal,co=g.attributes.color,n=tr.v1-tr.v0;
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);
 for(let k=0;k<n;k++){const i=tr.v0+k;pos[k*3]=pa.getX(i)-tr.x;pos[k*3+1]=pa.getY(i)-tr.y0;pos[k*3+2]=pa.getZ(i)-tr.z;
  nor[k*3]=na.getX(i);nor[k*3+1]=na.getY(i);nor[k*3+2]=na.getZ(i);col[k*3]=co.getX(i);col[k*3+1]=co.getY(i);col[k*3+2]=co.getZ(i);pa.setXYZ(i,0,-200,0)}
 pa.needsUpdate=true;if(typeof ACTOR_GRID!=='undefined')ACTOR_GRID.delete(tr.ch);
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(pos,3));fg.setAttribute('normal',new THREE.BufferAttribute(nor,3));fg.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.Mesh(fg,city.M.plant);m.castShadow=!tr.forest;m.receiveShadow=!tr.forest;const grp=new THREE.Group();grp.position.set(tr.x,tr.y0,tr.z);grp.add(m);city.group.add(grp);
 let dx=c.vx,dz=c.vz;const sp=Math.hypot(dx,dz)||1;dx/=sp;dz/=sp;const h=(tr.night?7:4.5)*tr.s;
 fallers.push({g:grp,ax:new THREE.Vector3(dz,0,-dx),th:0,om:Math.min(2,sp*.1)+.3,done:false,tip:[tr.x+dx*h,tr.z+dz*h],tree:true});
 if(fallers.length>40){const o=fallers.shift();if(o.kind!=null)debrisGone(o);else city.group.remove(o.g)}
 for(let i=0;i<16;i++)emit(tr.x+(Math.random()-.5)*2,2+Math.random()*3*tr.s,tr.z+(Math.random()-.5)*2,(Math.random()-.5)*5+dx*3,Math.random()*3,(Math.random()-.5)*5+dz*3,.9,.6,.2,tr.night?0x1f6a5a:0x4d8a34,false,.9);
 c.vx*=.72;c.vz*=.72;crashSound(9)}
// v78: destroços (poste, árvore, semáforo derrubados) duram 1 min real: 50 s parados, 10 s de esmaecimento em dither
// (mesmo clone do LOD: preserva o onBeforeCompile do shader de luz). Depois o fio caído some, e o objeto em pé volta
// quando o jogador estiver longe (>70 m), pra não "brotar" na frente dele.
const DEBRIS={restore:[],chk:0,M:new THREE.Matrix4()};
function debrisSave(kind,ref){const M=DEBRIS.M;
 if(kind==='lamp'){const IM=ref.ch&&ref.ch.lampIM;ref._mx=IM?[IM.pole,IM.head,IM.glow].map(m=>{m.getMatrixAt(ref.i,M);return M.clone()}):null;const w=ref.ch&&ref.ch.wireIns;ref._wm=w?Array.from({length:ref.wireCount||0},(_,j)=>{w.getMatrixAt(ref.insStart+j,M);return M.clone()}):null}
 if(kind==='tl'){ref._mx=(ref.ch.tlIMs||[]).map(m=>{m.getMatrixAt(ref.i,M);return M.clone()});if(ref.signGroup)ref._sg={p:ref.signGroup.position.clone()}}}
function debrisTag(kind,ref,b,n0){if(fallers.length>n0||(fallers.length&&fallers[fallers.length-1].kind==null)){const f=fallers[fallers.length-1];if(f&&f.kind==null){f.kind=kind;f.ref=ref;f.b=b;f.age=0}}}
breakPole=(F=>function(b,c){const l=b&&b.lamp;if(l&&!l.broken)debrisSave('lamp',l);const n=fallers.length;F.apply(this,arguments);if(l&&l.broken)debrisTag('lamp',l,b,n)})(breakPole);
breakTree=(F=>function(b,c){const tr=b&&b.tree,was=tr&&tr.broken,n=fallers.length;F.apply(this,arguments);if(tr&&tr.broken&&!was)debrisTag('tree',tr,b,n)})(breakTree);
breakTL=(F=>function(b,c){const t=b&&b.tl;if(t&&!t.broken&&t.ch)debrisSave('tl',t);const n=fallers.length;F.apply(this,arguments);if(t&&t.broken)debrisTag('tl',t,b,n)})(breakTL);
function debrisCables(l,gone){const ch=l.ch;if(!ch||!ch.cableGeo)return;const arr=ch.cableGeo.attributes.position.array;
 for(const cb of ch.cables){if(cb.a!==l&&cb.b!==l)continue;const o=cb.a===l?cb.b:cb.a;
  if(l._gone||o._gone){cablePts(0,-50,0,0,-50,0,0,arr,cb.off);continue}
  const A=cb.a.broken?[cb.a.x,.25,cb.a.z]:cableAnchor(cb.a,cb.j),B=cb.b.broken?[cb.b.x,.25,cb.b.z]:cableAnchor(cb.b,cb.j);
  cablePts(...A,...B,(cb.a.broken||cb.b.broken)?((cb.a.broken&&cb.b.broken)?0:.3):.55,arr,cb.off)}
 ch.cableGeo.attributes.position.needsUpdate=true}
function debrisGone(f){city.group.remove(f.g);invalidateStaticShadows();const r=f.ref;if(!r)return;if(f.kind==='lamp'){r._gone=true;debrisCables(r)}DEBRIS.restore.push(f)}
function debrisRestore(f){const r=f.ref,ch=r&&r.ch;if(!ch||!city.chunks||![...city.chunks.values()].includes(ch))return;invalidateStaticShadows();
 if(f.kind==='lamp'){const IM=ch.lampIM;if(IM&&r._mx){[IM.pole,IM.head,IM.glow].forEach((m,k)=>{m.setMatrixAt(r.i,r._mx[k]);m.instanceMatrix.needsUpdate=true})}
  if(ch.wireIns&&r._wm){r._wm.forEach((m,j)=>ch.wireIns.setMatrixAt(r.insStart+j,m));ch.wireIns.instanceMatrix.needsUpdate=true}
  r.broken=false;r._gone=false;debrisCables(r)}
 else if(f.kind==='tree'){const src=r.forest?ch.forestTreeMesh:ch.plantMesh,pos=f.g.children[0]&&f.g.children[0].geometry.attributes.position;
  if(src&&pos){const pa=src.geometry.attributes.position;for(let k=0;k<r.v1-r.v0;k++)pa.setXYZ(r.v0+k,pos.getX(k)+r.x,pos.getY(k)+r.y0,pos.getZ(k)+r.z);pa.needsUpdate=true;if(typeof ACTOR_GRID!=='undefined')ACTOR_GRID.delete(ch)}
  try{if(r.toy)r.toy.visible=true}catch(e){}r.broken=false}
 else if(f.kind==='tl'){const pos=f.g.children[0]&&f.g.children[0].geometry.attributes.position;if(ch.tlpMesh&&pos){const pa=ch.tlpMesh.geometry.attributes.position;for(let k=0;k<r.v1-r.v0;k++)pa.setXYZ(r.v0+k,pos.getX(k)+r.px,pos.getY(k)+.2,pos.getZ(k)+r.pz);pa.needsUpdate=true}
  if(ch.tlIMs&&r._mx){ch.tlIMs.forEach((m,k)=>{if(r._mx[k]){m.setMatrixAt(r.i,r._mx[k]);m.instanceMatrix.needsUpdate=true}})}
  if(r.signGroup&&r._sg){if(f.fade)for(const s2 of f.fade)lodSoftStep(s2,1,1);f.g.remove(r.signGroup);r.signGroup.position.copy(r._sg.p);ch.group.add(r.signGroup)}
  r.broken=false;city.brokenTL.delete(r.tk);const key=r.kx*1000+r.kz;let other=false;for(const c2 of city.chunks.values())for(const t2 of c2.tls||[])if(t2.broken&&t2.kx*1000+t2.kz===key)other=true;if(!other)city.broken.delete(key)}
 if(f.b)f.b.dead=false}
function debrisTick(dt){SKCLK.t+=dt;SKCLK.u.value=SKCLK.t;
 for(let i=fallers.length-1;i>=0;i--){const f=fallers[i];if(f.age==null)continue;f.age+=dt;
  if(f.age>50&&!f.fade){f.fade=[];f.g.traverse(o=>{if(o.isMesh){o.castShadow=false;const s2=lodSoftBind(o,1);if(s2)f.fade.push(s2)}});invalidateStaticShadows()}
  if(f.fade){const a=clamp(1-(f.age-50)/10,0,1);for(const s2 of f.fade)lodSoftStep(s2,a,1)}
  if(f.age>=60){fallers.splice(i,1);debrisGone(f)}}
 if((DEBRIS.chk-=dt)<=0&&DEBRIS.restore.length){DEBRIS.chk=1;const pc=PL.car||PL;
  DEBRIS.restore=DEBRIS.restore.filter(f=>{const r=f.ref,x=r.px??r.x,z=r.pz??r.z;if(Math.hypot(x-pc.x,z-pc.z)<70)return true;try{debrisRestore(f)}catch(e){console.warn('[debris]',e)}return false})}}
function updateFallers(dt){debrisTick(dt);let act=false;for(const f of fallers){if(f.done)continue;act=true;f.om+=(3.2*Math.sin(f.th)+.8)*dt;f.th+=f.om*dt;
 if(f.th>=Math.PI/2-.05){f.th=Math.PI/2-.05;f.done=true;if(f.tree){for(let i=0;i<10;i++)emit(f.tip[0],.6,f.tip[1],(Math.random()-.5)*4,Math.random()*2,(Math.random()-.5)*4,.8,.8,.2,0x6a8a4a,false,.7);thud(6)}
  else for(let i=0;i<10;i++)emit(f.tip[0],.4,f.tip[1],(Math.random()-.5)*6,Math.random()*3,(Math.random()-.5)*6,.4,.2,.05,0xffc060,true,1)}
f.g.quaternion.setFromAxisAngle(f.ax,f.th)}
 for(const k of tumblers){if(k.life!=null&&k.g.visible){k.life-=dt;if(k.life<=0){k.g.visible=false;k.rest=true;invalidateStaticShadows();continue}}if(k.rest)continue;act=true;k.vy-=20*dt;k.g.position.x+=k.vx*dt;k.g.position.y+=k.vy*dt;k.g.position.z+=k.vz*dt;k.g.rotation.x+=k.wx*dt;k.g.rotation.z+=k.wz*dt;
  if(k.g.position.y<.32){k.g.position.y=.32;k.vy*=-.3;k.vx*=.6;k.vz*=.6;k.wx*=.6;k.wz*=.6;if(Math.abs(k.vy)<1&&Math.hypot(k.vx,k.vz)<.5){k.rest=true;k.g.rotation.x=Math.PI/2*(Math.sign(k.g.rotation.x)||1);k.g.rotation.z=0}}}
 if(act||SHADOW_CACHE._fallActive){invalidateStaticShadows();SHADOW_CACHE._fallActive=act}}
const tumblers=[];
function breakTL(b,c){b.dead=true;const t=b.tl,ch=t.ch;if(t.broken||!ch||!ch.tlpMesh)return;t.broken=true;invalidateStaticShadows();city.brokenTL.add(t.tk);
 const g=ch.tlpMesh.geometry,pa=g.attributes.position,na=g.attributes.normal,co=g.attributes.color,n=t.v1-t.v0;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);
 for(let k=0;k<n;k++){const i=t.v0+k;pos[k*3]=pa.getX(i)-t.px;pos[k*3+1]=pa.getY(i)-.2;pos[k*3+2]=pa.getZ(i)-t.pz;nor[k*3]=na.getX(i);nor[k*3+1]=na.getY(i);nor[k*3+2]=na.getZ(i);col[k*3]=co.getX(i);col[k*3+1]=co.getY(i);col[k*3+2]=co.getZ(i);pa.setXYZ(i,0,-200,0)}
 pa.needsUpdate=true;const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(pos,3));fg.setAttribute('normal',new THREE.BufferAttribute(nor,3));fg.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.Mesh(fg,city.M.solid);m.castShadow=true;const grp=new THREE.Group();grp.position.set(t.px,.2,t.pz);grp.add(m);city.group.add(grp);
 // A placa usa o mesmo pivot e a mesma queda do semaforo danificado.
 if(t.signGroup){ch.group.remove(t.signGroup);t.signGroup.position.set(0,-.2,0);grp.add(t.signGroup)}
 if(ch.tlIMs)for(const im of ch.tlIMs){im.setMatrixAt(t.i,ZM);im.instanceMatrix.needsUpdate=true}
 let dx=c.vx,dz=c.vz;const sp=Math.hypot(dx,dz)||1;dx/=sp;dz/=sp;fallers.push({g:grp,ax:new THREE.Vector3(dz,0,-dx),th:0,om:Math.min(2.5,sp*.12)+.4,done:false,tip:[t.px+dx*5.4,t.pz+dz*5.4]});
 if(fallers.length>40){const o=fallers.shift();if(o.kind!=null)debrisGone(o);else city.group.remove(o.g)}
 for(let i=0;i<16;i++)emit(t.px,.6+Math.random()*4.5,t.pz,(Math.random()-.5)*7+dx*3,Math.random()*4,(Math.random()-.5)*7+dz*3,.45,.22,.06,0xffd060,true,1);
 const key=t.kx*1000+t.kz;if(!city.broken.has(key))city.broken.add(key);
 c.vx*=.82;c.vz*=.82;sparkSound(.8);TL.t=0}
function knockBin(b,vx,vz){if(b.dead)return;b.dead=true;const t=b.bin,ch=t&&t.ch;if(!ch||!ch.binMesh)return;invalidateStaticShadows();
 const g=ch.binMesh.geometry,pa=g.attributes.position,na=g.attributes.normal,co=g.attributes.color,n=t.v1-t.v0;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);
 for(let k=0;k<n;k++){const i=t.v0+k;pos[k*3]=pa.getX(i)-t.x;pos[k*3+1]=pa.getY(i)-.65;pos[k*3+2]=pa.getZ(i)-t.z;nor[k*3]=na.getX(i);nor[k*3+1]=na.getY(i);nor[k*3+2]=na.getZ(i);col[k*3]=co.getX(i);col[k*3+1]=co.getY(i);col[k*3+2]=co.getZ(i);pa.setXYZ(i,0,-200,0)}
 pa.needsUpdate=true;const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(pos,3));fg.setAttribute('normal',new THREE.BufferAttribute(nor,3));fg.setAttribute('color',new THREE.BufferAttribute(col,3));
 const m=new THREE.Mesh(fg,city.M.solid);m.castShadow=true;const grp=new THREE.Group();grp.position.set(t.x,.65,t.z);grp.add(m);city.group.add(grp);
 const sp=Math.hypot(vx,vz)||1;if(t.big){grp.scale.setScalar(.6);for(let i=0;i<30;i++)emit(t.x,.9,t.z,vx*.5+(R2()-.5)*6,1.5+R2()*4,vz*.5+(R2()-.5)*6,1,.35,.25,R2()<.6?(t.col?t.col.getHex():0x2f5a3a):0x8a8a8a,false,1)}
 tumblers.push({g:grp,vx:vx*.7+(R2()-.5)*2,vy:3+sp*.15,vz:vz*.7+(R2()-.5)*2,wx:(R2()-.5)*10,wz:(R2()-.5)*10,rest:false,life:t.big?2.2:null});if(tumblers.length>40){const o=tumblers.shift();city.group.remove(o.g)}
 for(let i=0;i<14;i++)emit(t.x,.8,t.z,vx*.4+(R2()-.5)*4,1+R2()*3,vz*.4+(R2()-.5)*4,.9,.22,.15,[0xe8e2d0,0x6a8a4a,0x8a6a4a,0xdddddd][i%4],false,1);thud(4)}


/* ================= v274: JAMMER — APAGÃO + SEMÁFOROS =================
   Mantém o sistema original de iluminação da v227 e acrescenta um blecaute
   do controle de trânsito: semáforos apagados e veículos ignorando seus ciclos
   SOMENTE nas interseções dentro do raio de 100 m, por 60 s reais.
   Não mexer nos SpriteMaterials, atlas nem geometrias compartilhadas da v258.
   Nenhuma nova malha, luz, shader ou pesquisa espacial por veículo.
*/
const JAMMER={x:0,z:0,left:0,day:false,rushT:0,active:{value:0},center:{value:new THREE.Vector2()}};
function jammerBlocked(x,z){if(JAMMER.left<=0||JAMMER.day)return false;const dx=x-JAMMER.x,dz=z-JAMMER.z;return dx*dx+dz*dz<=10000}
// O semáforo e a lógica de tráfego usam o MESMO centro de cruzamento, evitando
// que um veículo obedeça a um vermelho cujo conjunto de lentes está apagado.
function jammerSignalBlocked(kx,kz){if(JAMMER.left<=0)return false;const dx=kx*P-JAMMER.x,dz=kz*P-JAMMER.z;return dx*dx+dz*dz<=10000}
function jammerReset(){JAMMER.left=0;JAMMER.day=false;JAMMER.active.value=0}
function jammerFire(){if(typeof campJamHook==='function'&&campJamHook())return true;if(PL.inside||PL.dead||PL.heli){toast('JAMMER · USE AO AR LIVRE');return false}
 if(S.style==='inverted'||city.haze){toast(translatePlain('ctOS · SEM REDE AQUI'));return false}
 if(JAMMER.left>0){toast(translatePlain('JAMMER · JÁ ESTÁ ATIVO'));return false}
 const p=PL.car||PL;
 /* perto da ponte levadiça: o ctOS ergue a ponte */
 for(const d of city.dbs||[]){const cx=d.cx??d.x,cz=d.cz??d.z;if(Number.isFinite(cx)&&Math.hypot(p.x-cx,p.z-cz)<70){if(d.state==='closed'){dbBeginWarning(d);d.override=true;toast('<span style="color:#5ef0ff">ctOS · PONTE LEVADIÇA</span><br><small style="font-size:11px;color:#fff">'+translatePlain('erguendo a ponte')+'</small>');return true}toast(translatePlain('ctOS · A PONTE JÁ ESTÁ SE MOVENDO'));return false}}
 JAMMER.x=p.x;JAMMER.z=p.z;JAMMER.left=60;JAMMER.center.value.set(p.x,p.z);
 if(DN.nightF>=.55){JAMMER.day=false;JAMMER.active.value=1;DN.t=0;TL.t=0;updateDayNight(0,true);updateTrafficLights(0);toast('JAMMER ATIVO<br><small style="font-size:11px;color:#fff">cause o caos, a energia volta em 1 hora</small>');return true}
 /* de dia: todos os semáforos do raio ficam verdes e o trânsito acelera — batidas */
 JAMMER.day=true;JAMMER.active.value=0;JAMMER.rushT=0;TL.t=0;updateTrafficLights(0);jammerRush();toast('<span style="color:#5ef0ff">ctOS · SEMÁFOROS VERDES</span><br><small style="font-size:11px;color:#fff">'+translatePlain('todo mundo acelera no cruzamento')+'</small>');return true}
/* carros do raio saem do trilho (física), ignoram semáforo e aceleram com tudo */
function jammerRush(){let n=0;for(const c of vehicles){if(n>=14)break;if(!c.alive||c===PL.car||c.police||c.net||c.special||c.keep||c.t.boat||c.type==='bus')continue;if(Math.hypot(c.x-JAMMER.x,c.z-JAMMER.z)>100)continue;
  if(c.mode==='rail'&&!c.rail?.nr){try{toPhys(c)}catch(e){continue}}if(!c.ai)continue;c.ai.vmax=Math.max(c.ai.vmax||10,24+Math.random()*8);c.jamRush=true;c.sleep=false;c.hand=false;n++}}
function jammerTick(dt){if(JAMMER.left<=0)return;JAMMER.left=Math.max(0,JAMMER.left-dt);if(JAMMER.day&&JAMMER.left>0&&(JAMMER.rushT-=dt)<=0){JAMMER.rushT=1;jammerRush()}
 if(JAMMER.day&&JAMMER.left===0){JAMMER.day=false;TL.t=0;updateTrafficLights(0);for(const c of vehicles)if(c.jamRush){c.jamRush=false;if(c.ai)c.ai.vmax=Math.min(c.ai.vmax,c.vmax||14)}toast(translatePlain('ctOS · SEMÁFOROS NORMAIS'));return}
 if(JAMMER.left===0){JAMMER.active.value=0;DN.t=0;TL.t=0;updateDayNight(0,true);updateTrafficLights(0);toast('JAMMER · ENERGIA RESTABELECIDA')}}
function jammerBasicMaterial(mat){mat.onBeforeCompile=sh=>{
  sh.uniforms.jammerActive=JAMMER.active;sh.uniforms.jammerCenter=JAMMER.center;
  sh.vertexShader='varying vec2 jammerXZ;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n jammerXZ=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh.fragmentShader='varying vec2 jammerXZ; uniform float jammerActive; uniform vec2 jammerCenter;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n if(jammerActive>0.5){vec2 jDiff=jammerXZ-jammerCenter;float blackout=1.0-step(10000.0,dot(jDiff,jDiff));diffuseColor.rgb*=1.0-blackout;}');
 };return mat}
function jammerMaterial(mat){mat.onBeforeCompile=sh=>{
  sh.uniforms.jammerActive=JAMMER.active;sh.uniforms.jammerCenter=JAMMER.center;
  sh.vertexShader='varying vec2 jammerXZ;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n jammerXZ=(modelMatrix*vec4(transformed,1.0)).xz;');
  sh.fragmentShader='varying vec2 jammerXZ; uniform float jammerActive; uniform vec2 jammerCenter;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n if(jammerActive>0.5){vec2 jDiff=jammerXZ-jammerCenter;float blackout=1.0-step(10000.0,dot(jDiff,jDiff));totalEmissiveRadiance*=1.0-blackout;}');
 };return mat}
/* ================= WEAPON ================= */
const FP_SK='#e0ac69',FP_SKD='#b88452';
const FP_GUN_SVG={
 knife:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#9aa2ac" d="M7 1h2v7H7z"/><path fill="#e8ecf0" d="M8 1h1v7H8z"/><path fill="#c8ced6" d="M8 0h1v1H8z"/><path fill="#2a2a30" d="M5 8h6v1H5z"/><path fill="#3a2414" d="M7 9h2v4H7z"/><path fill="'+FP_SK+'" d="M5 10h2v4H5z M9 10h2v4H9z M6 13h4v3H6z"/><path fill="'+FP_SKD+'" d="M5 13h1v1H5z M10 12h1v1h-1z"/></svg>', /* v4 r29 */
 bat:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#c8955a" d="M6 0h4v5H6z M7 5h2v5H7z"/><path fill="#e0b47a" d="M7 0h1v5H7z"/><path fill="#9a6a38" d="M9 1h1v4H9z"/><path fill="#22222a" d="M7 10h2v3H7z"/><path fill="#22222a" d="M6 13h4v1H6z"/><path fill="'+FP_SK+'" d="M5 10h2v4H5z M9 11h2v3H9z M6 14h4v2H6z"/><path fill="'+FP_SKD+'" d="M5 13h1v1H5z M10 13h1v1h-1z"/></svg>',
 flame:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path fill="#22232c" d="M7 1h3v4h2v9H4V7h3z"/><path fill="#ba4727" d="M5 7h4v6H5z"/><path fill="#f4a23a" d="M7 2h3v2H7z"/></svg>', /* 16×16, visto por trás/da direita, cano pra dentro da tela */
 pistol:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path class="fl" fill="#ffd23a" d="M6 0h4v1h1v1H5V1h1z"/><path fill="#1c1c22" d="M6 2h4v8H6z"/><path fill="#3a3a44" d="M7 2h2v7H7z"/><path fill="#55555f" d="M7 1h2v1H7z"/><path fill="#2a2a30" d="M5 9h6v2H5z"/><path fill="#141418" d="M6 11h4v5H6z"/><path fill="'+FP_SK+'" d="M4 10h2v6H4z M10 11h2v4h-2z M5 14h6v2H5z"/><path fill="'+FP_SKD+'" d="M4 15h1v1H4z M10 14h2v1h-2z M5 13h1v1H5z"/></svg>',
 smg:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path class="fl" fill="#ffd23a" d="M6 0h4v1h1v1H5V1h1z"/><path fill="#26262c" d="M7 1h2v3H7z"/><path fill="#1c1c22" d="M5 3h6v8H5z"/><path fill="#3a3a44" d="M6 4h1v6H6z M9 4h1v6H9z"/><path fill="#55555f" d="M7 4h2v1H7z"/><path fill="#121216" d="M7 11h2v5H7z"/><path fill="'+FP_SK+'" d="M3 8h2v6H3z M11 9h2v5h-2z M4 14h3v2H4z M9 14h3v2H9z"/><path fill="'+FP_SKD+'" d="M3 13h2v1H3z M11 13h2v1h-2z"/></svg>',
 magnum:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path class="fl" fill="#ffd23a" d="M5 0h6v1h1v1H4V1h1z"/><path fill="#c8ccd4" d="M7 1h2v6H7z"/><path fill="#8a9098" d="M7 6h2v1H7z"/><path fill="#9aa0aa" d="M5 6h6v4H5z"/><path fill="#6a7078" d="M6 7h1v2H6z M9 7h1v2H9z M5 9h6v1H5z"/><path fill="#6a4020" d="M6 10h4v6H6z"/><path fill="#4a2a14" d="M7 11h1v4H7z"/><path fill="'+FP_SK+'" d="M4 10h2v6H4z M10 10h2v5h-2z M5 15h6v1H5z"/><path fill="'+FP_SKD+'" d="M4 15h1v1H4z M11 14h1v1h-1z"/></svg>',
 rpg:'<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path class="fl" fill="#ff8a1a" d="M5 0h6v2H5z"/><path fill="#6a7a3a" d="M6 1h4v2H6z"/><path fill="#2a3018" d="M3 3h10v2H3z"/><path fill="#4a5a2a" d="M4 5h8v11H4z"/><path fill="#5a6c34" d="M5 5h2v11H5z"/><path fill="#2a3018" d="M4 9h8v1H4z"/><path fill="#1c1c22" d="M8 12h3v4H8z"/><path fill="'+FP_SK+'" d="M2 10h2v5H2z M11 12h3v4h-3z"/><path fill="'+FP_SKD+'" d="M2 14h2v1H2z"/></svg>'};
const WPN={pistol:{name:'PISTOLA',cd:.22,dmg:9,spread:.014,key:'1'},smg:{name:'METRALHADORA',cd:.075,dmg:5,spread:.055,key:'2'},rpg:{name:'BAZUCA',cd:1.1,dmg:0,spread:.009,key:'3'},magnum:{name:'COLT MAGNUM',cd:.55,dmg:26,spread:.012,key:'4'},grenade:{name:'GRANADA',cd:.85,dmg:0,spread:.022,key:'6'},remote:{name:'BOMBA PROGRAMADA',cd:.6,dmg:0,spread:0,key:'7'},jammer:{name:'JAMMER',cd:.8,dmg:0,spread:0,key:'8'},flame:{name:'LANÇA-CHAMAS',cd:.12,dmg:5,spread:0,key:'9'}};
const GUN={has:false,ammo:0,cd:0,firing:false,w:'pistol',inv:{}};
function gunReset(){GUN.has=false;GUN.ammo=0;GUN.w='pistol';GUN.inv={};if(typeof MELEE!=='undefined'){MELEE.w='fist';MELEE.inv={knife:false,bat:false}}}
function gunSelect(w,quiet){if(!GUN.inv[w])return false;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;GUN.w=w;GUN.ammo=GUN.inv[w].ammo;GUN.has=true;GUN.cd=Math.max(GUN.cd,.15);if(!quiet)toast(WPN[w].name+' · '+GUN.ammo);return true}
function gunCycle(dir){if(PL.heli)return;const ks=['fist','knife','bat','pistol','magnum','smg','rpg','grenade','remote','flame'].filter(k=>(k==='fist'||(k==='knife'||k==='bat'?MELEE.inv[k]:GUN.inv[k]))&&vehicleWeaponAllowed(k));if(ks.length<2)return;const i=ks.indexOf(GUN.has?GUN.w:meleeW());const k=ks[((i+dir)%ks.length+ks.length)%ks.length];if(k==='fist'){if(GUN.has)gunHolster();MELEE.w='fist'}else if(k==='knife'||k==='bat'){meleeSelect(k);toast(translatePlain(MELEE_N[k]))}else gunSelect(k)}
function ammoCap(w){if(w==='jammer')return PLAYER_PAL.bag?50:3;return (w==='rpg'||w==='grenade'||w==='remote')?(PLAYER_PAL.bag?30:3):(PLAYER_PAL.bag?1500:150)}
function ammoClamp(){if(CHEAT.ammo)return;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;let cut=false;for(const w in GUN.inv){const m=ammoCap(w);if(GUN.inv[w].ammo>m){GUN.inv[w].ammo=m;cut=true}}if(GUN.has&&GUN.inv[GUN.w])GUN.ammo=GUN.inv[GUN.w].ammo;if(cut)toast('SEM MOCHILA · MUNIÇÃO REDUZIDA')}
/* r54 · ctOS: app do celular (Watch Dogs) que invade sistemas públicos. Instalado na loja de munição, vale para Nathan e Claire.
   O JAMMER deixou de ser arma: é a 1ª função do app (noite = apagão; dia = semáforos todos verdes; perto da ponte levadiça = ergue a ponte). */
const CTOS={installed:false,price:3800};
function ctosInstall(quiet){const was=CTOS.installed;CTOS.installed=true;if(GUN.inv&&GUN.inv.jammer){delete GUN.inv.jammer;if(GUN.has&&GUN.w==='jammer')gunHolster(true)}if(!was&&!quiet)toast('<span style="color:#5ef0ff">ctOS INSTALADO</span><br><small style="font-size:11px;color:#fff">'+translatePlain('celular › ctOS')+'</small>');return !was}
function ctosItems(){return ['JAMMER','PERFIL']}
/* r55 · ctOS PERFIL: aponte o celular (direção da câmera) para um pedestre → nome, uma linha (peds.json) e saldo $0–1000; HACKEAR PIX
   exige ficar na faixa segura (6–24 m) até a barra encher: perto demais ele percebe e liga pra polícia; longe demais o sinal cai. */
const PROF={db:null,p:null,hack:null,el:null};
const PROF_FALLBACK={nomes:['Ana','Bruno','Carla','Diego','Lucas','Marina'],sobrenomes:['Silva','Souza','Costa','Lima'],perfis:[{tipo:'geek',pt:'participa de eventos furry',en:'goes to furry conventions'},{tipo:'geek',pt:'é brony há 13 anos',en:'has been a brony for 13 years'},{tipo:'divida',pt:'deve $3.000 ao agiota',en:'owes $3,000 to a loan shark'},{tipo:'procurado',pt:'procurado por furto',en:'wanted for theft'},{tipo:'comum',pt:'tem 14 gatos',en:'has 14 cats'}]};
function profLoad(){if(PROF.db)return;PROF.db=PROF_FALLBACK;try{fetch('peds.json?'+BUILD_TAG).then(r=>r.ok?r.json():null).then(j=>{if(j&&Array.isArray(j.perfis)&&j.perfis.length)PROF.db=j}).catch(()=>{})}catch(e){}}
function profInMission(){try{return !!missionMode()||!!(typeof CAMP!=='undefined'&&CAMP.id)||!!PROLOGUE.active||!!(MIS&&MIS.type)}catch(e){return false}}
function profOf(p){if(p.net){const pe=ONLINE.peers.get(p.net);p.prof={name:pe?pe.name:'?',pt:'jogador online',en:'online player',tipo:'online',bal:-1,net:p.net,bl:!!(pe&&pe.bl)};return p.prof}if(p.prof)return p.prof;profLoad();const db=PROF.db,r=Math.random,pk=a=>a[Math.floor(r()*a.length)];const f=pk(db.perfis);
 p.prof={name:pk(db.nomes)+' '+pk(db.sobrenomes),pt:f.pt,en:f.en,tipo:f.tipo,bal:Math.floor(r()*1001),loot:f.loot||0};return p.prof}
function profTarget(){const pc=PL;if(PL.car||PL.inside||PL.dead)return null;const v=new THREE.Vector3();camera.getWorldDirection(v);let fx=v.x,fz=v.z;const n=Math.hypot(fx,fz);if(n<.01){fx=Math.cos(PL.a||0);fz=Math.sin(PL.a||0)}else{fx/=n;fz/=n}
 let best=null,bs=1e9;for(const q of peds){if(q.state==='dead'||q.state==='inside'||q.state==='lie'||(q.net?!ONLINE.on||!ONLINE.peers.has(q.net):q.main)||q.tommy!==undefined||q.demo||!q.sp||!q.sp.visible)continue;const dx=q.x-pc.x,dz=q.z-pc.z,d=Math.hypot(dx,dz);if(d>38||d<.5)continue;const c=(dx*fx+dz*fz)/d;if(c<.82&&d>8)continue;const sc=d*(2-c);if(sc<bs){bs=sc;best=q}}return best}
function profOpen(){if(PL.car){toast(translatePlain('ctOS · SAIA DO CARRO'));return}const q=profTarget();if(!q){toast(translatePlain('ctOS · NINGUÉM NA MIRA'));return}PROF.p=q;profOf(q);PHONE.scr='perfil';PHONE.zone='scr';PHONE.si=0;clang(.15)}
function profDraw(g,M,sx,sy,sw,cx,hit,foc,retro){const q=PROF.p,en=S.lang==='en';g.textAlign='center';g.fillStyle='#5ef0ff';g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('◉ ctOS · '+(en?'PROFILE':'PERFIL'),cx,sy+14);
 if(!q||!q.prof){g.fillStyle=M.txt;g.fillText('—',cx,sy+50);return}const pr=q.prof;g.fillStyle=M.txt;g.font='bold 9px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(pr.name,cx,sy+28);
 g.font='bold 6.5px system-ui,"Segoe UI",Arial,sans-serif';g.textAlign='left';phoneWrap(g,en?pr.en:pr.pt,sx+6,sy+40,sw-12,8,3);g.textAlign='center';
 g.fillStyle=pr.tipo==='procurado'?'#ff6a6a':pr.tipo==='rico'?'#ffd24a':pr.tipo==='pista'?'#7dff8a':M.txt;g.font='bold 6px system-ui,"Segoe UI",Arial,sans-serif';
 const tag={geek:en?'GEEK':'GEEK',divida:en?'DEBT':'DÍVIDA',procurado:en?'WANTED':'PROCURADO',rico:en?'CARRYING VALUABLES':'LEVA ALGO DE VALOR',pista:en?'LEAD · VINYL':'PISTA · VINIL',comum:en?'CITIZEN':'CIDADÃO',online:pr.bl?(en?'SIGNAL JAMMER':'BLOQUEADOR DE SINAL'):(en?'PLAYER':'JOGADOR')}[pr.tipo]||'';g.fillText(tag,cx,sy+66);
 g.fillStyle=M.txt;g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText((en?'BALANCE ':'SALDO ')+(pr.bal<0?(pr.bl?(en?'PROTECTED':'PROTEGIDO'):'$ ???'):'$'+pr.bal),cx,sy+76);
 const items=profItems();items.forEach((k,i)=>{const y=sy+87+i*11;hit('scr',i,sx+4,y-2,sw-8,11);if(foc(i)){g.fillStyle=M.acc;g.fillRect(sx+6,y-2,sw-12,10);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';
  g.fillText(k==='HACK'?(en?'HACK PIX':'HACKEAR PIX'):(en?'MARK VINYL':'MARCAR VINIL'),cx,y)})}
function profItems(){const q=PROF.p,pr=q&&q.prof;if(!pr)return [];const l=[];if(pr.net){if(!pr.bl)l.push('HACK');return l}if(pr.bal>0)l.push('HACK');if(pr.tipo==='pista'&&!pr.used)l.push('CLUE');return l}
function profAct(k){const q=PROF.p;if(!q||!q.prof)return;
 if(k==='CLUE'){let best=null,bd=1e9;for(const v of pickups)if(v.kind==='vinyl'){const d=Math.hypot(v.x-PL.x,v.z-PL.z);if(d<bd){bd=d;best=v}}if(!best){toast(translatePlain('ctOS · NENHUM VINIL POR PERTO'));return}q.prof.used=true;setMarker(best.x,best.z);toast('<span style="color:#7dff8a">'+translatePlain('PISTA · VINIL MARCADO NO MAPA')+'</span>');if(PHONE.open)phoneToggle();return}
 if(k==='HACK'){if(profInMission()){toast(translatePlain('ctOS · INDISPONÍVEL EM MISSÃO'));return}if(PROF.hack){toast(translatePlain('ctOS · JÁ HÁ UMA TRANSFERÊNCIA'));return}
  if(q.prof.net){const pe=ONLINE.peers.get(q.prof.net);if(!ONLINE.on||!pe){toast(translatePlain('PIX · ALVO PERDIDO'));return}if(pe.bl){toast('PIX · '+netHackFail('blk'));return}PROF.hack={p:q,t:0,dur:7,warn:0,net:true,pid:pe.id,ok:false};ONLINE.out.push({k:'hk0',to:pe.id})}
  else PROF.hack={p:q,t:0,dur:7,warn:0};if(PHONE.open)phoneToggle();toast('<span style="color:#5ef0ff">'+translatePlain('PIX · TRANSFERINDO')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('fique a uma distância segura')+'</small>')}}
function profBar(){if(PROF.el)return PROF.el;const d=document.createElement('div');d.id='ctosBar';d.style.cssText='position:fixed;left:50%;bottom:118px;transform:translateX(-50%);width:min(320px,70vw);padding:6px 10px;background:rgba(6,14,22,.82);border:1px solid #5ef0ff;border-radius:6px;color:#e8fbff;font:800 11px Arial,sans-serif;text-align:center;z-index:40;pointer-events:none;letter-spacing:.5px';
 d.innerHTML='<div id="ctosBarT"></div><div style="height:8px;margin-top:5px;background:#12303a;border-radius:4px;overflow:hidden"><div id="ctosBarF" style="height:100%;width:0;background:#5ef0ff"></div></div>';document.body.appendChild(d);PROF.el=d;return d}
function profEnd(msg,col){const H=PROF.hack;if(H&&H.net&&!H.sent&&ONLINE.on)ONLINE.out.push({k:'hkx',to:H.pid});PROF.hack=null;if(PROF.el)PROF.el.hidden=true;if(msg)toast('<span style="color:'+(col||'#ff6a6a')+'">'+msg+'</span>')}
function profTick(dt){const H=PROF.hack;if(!H){if(PROF.el&&!PROF.el.hidden)PROF.el.hidden=true;return}if(H.net){const pe=ONLINE.peers.get(H.pid);if(!ONLINE.on||!pe){profEnd(translatePlain('PIX · ALVO PERDIDO'));return}if(pe.ped&&peds.includes(pe.ped)&&pe.ped!==H.p){pe.ped.prof=H.p.prof;H.p=pe.ped}
  if(H.sent){H.wt+=dt;$('#ctosBarT').textContent='PIX · '+H.p.prof.name+' · '+(S.lang==='en'?'CONFIRMING…':'CONFIRMANDO…');if(H.wt>8)profEnd(translatePlain('PIX · SINAL PERDIDO'));return}}
 const q=H.p,el=profBar();el.hidden=false;
 if(!peds.includes(q)||q.state==='dead'||q.state==='inside'||PL.dead||PL.inside){profEnd(translatePlain('PIX · ALVO PERDIDO'));return}
 const d=Math.hypot(q.x-PL.x,q.z-PL.z),en=S.lang==='en';let st;
 if(d<6){H.warn+=dt;st=en?'TOO CLOSE!':'PERTO DEMAIS!';if(H.warn>.9&&H.net){profEnd(translatePlain('PIX · VOCÊ FOI VISTO'));return}if(H.warn>.9){say(q,en?'Hey! Are you hacking my phone?!':'Ei! Tá hackeando meu celular?!');q.state='flee';q.timer=6;q.vx=(q.x-PL.x)/(d||1)*5;q.vz=(q.z-PL.z)/(d||1)*5;
  if(!profInMission()&&!ONLINE.on){try{startWanted()}catch(e){}}profEnd(translatePlain('PIX · VOCÊ FOI VISTO'));return}}
 else if(d>24){H.warn+=dt*.6;st=en?'SIGNAL WEAK':'SINAL FRACO';if(H.warn>2.2){profEnd(translatePlain('PIX · SINAL PERDIDO'));return}}
 else{H.warn=Math.max(0,H.warn-dt);H.t+=dt;st=en?'TRANSFERRING':'TRANSFERINDO'}
 const f=Math.min(1,H.t/H.dur);$('#ctosBarT').textContent='PIX · '+q.prof.name+(q.prof.bal>=0?' · $'+q.prof.bal:'')+' · '+st+' · '+Math.round(d)+' m';const bf=$('#ctosBarF');bf.style.width=(f*100).toFixed(1)+'%';bf.style.background=d<6?'#ff5a5a':d>24?'#ffb84a':'#5ef0ff';
 if(f>=1&&H.net){H.sent=true;H.wt=0;ONLINE.out.push({k:'hk1',to:H.pid});return}
 if(f>=1){const n=q.prof.bal;q.prof.bal=0;profEnd(null);money(n,'PIX HACKEADO · +$'+n)}}
function ctosSub(k){const en=S.lang==='en',t=(a,b)=>en?b:a;if(k==='PERFIL')return t('APONTE PARA ALGUÉM','POINT AT SOMEONE');if(k==='JAMMER'){if(JAMMER.left>0)return (JAMMER.day?t('VERDE','GREEN'):t('APAGÃO','BLACKOUT'))+' · '+Math.ceil(JAMMER.left)+'s';const p=PL.car||PL;if((city.dbs||[]).some(d=>Math.hypot(p.x-(d.cx??d.x),p.z-(d.cz??d.z))<70))return t('PONTE LEVADIÇA','DRAWBRIDGE');return DN.nightF>=.55?t('APAGÃO','BLACKOUT'):t('SEMÁFOROS VERDES','GREEN LIGHTS')}return ''}
function ctosAct(k){if(k==='PERFIL'){profOpen();if(PHONE.open)phoneDraw();return}if(k==='JAMMER'){const ok=jammerFire();if(ok&&PHONE.open)phoneToggle();else if(PHONE.open)phoneDraw()}}
function ctosDraw(g,M,sx,sy,sw,cx,hit,foc,retro){g.textAlign='center';g.font='bold 9px system-ui,"Segoe UI",Arial,sans-serif';g.fillStyle='#5ef0ff';g.fillText('◉ ctOS',cx,sy+16);g.fillStyle=M.txt;
 ctosItems().forEach((k,i)=>{const y=sy+34+i*24;hit('scr',i,sx+4,y-2,sw-8,22);if(foc(i)){g.fillStyle=M.acc;g.fillRect(sx+6,y-2,sw-12,21);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;
  g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(translatePlain(k),cx,y);g.font='bold 6px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(ctosSub(k),cx,y+10)});
 g.fillStyle=M.txt;g.globalAlpha=.7;g.font='bold 6px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(translatePlain('APAGAR · VOLTAR'),cx,sy+104);g.globalAlpha=1}
function gunGive(w,n){if(w==='jammer'){ctosInstall();return 1}
 const equipped=GUN.has&&GUN.w===w;
 const current=equipped?GUN.ammo:(GUN.inv[w]?.ammo??0);
 const added=CHEAT.ammo?n:Math.max(0,Math.min(n,ammoCap(w)-current));
 const slot=GUN.inv[w]||(GUN.inv[w]={ammo:0});
 slot.ammo=current+added;
 // gunSelect saves the equipped ammo before switching. Keep it in sync.
 if(equipped)GUN.ammo=slot.ammo;
 gunSelect(w,true);
 return added;
}
function pickKind(id){let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);const r=((h>>>0)%1000)/1000;return r<.46?'gun':r<.58?'magnum':r<.79?'smg':r<.905?'rpg':r<.953?'grenade':'remote'} /* r54: sem jammer no mundo (virou o app ctOS) */
// Granada de mão ovalada: geometrias e materiais reutilizados pelo coletável,
// mão do personagem e projéteis, sem texturas externas ou material por quadro.
const GRN_VIS={
 body:new THREE.SphereGeometry(.18,12,10),
 cap:new THREE.CylinderGeometry(.105,.105,.065,10),
 ring:new THREE.TorusGeometry(.056,.014,4,10),
 shell:new THREE.MeshStandardMaterial({color:0x566c40,metalness:.35,roughness:.58}),
 metal:new THREE.MeshStandardMaterial({color:0x30373a,metalness:.7,roughness:.38})
};
function grenadeMesh(){const g=new THREE.Group(),b=new THREE.Mesh(GRN_VIS.body,GRN_VIS.shell),c=new THREE.Mesh(GRN_VIS.cap,GRN_VIS.metal),r=new THREE.Mesh(GRN_VIS.ring,GRN_VIS.metal);
 b.scale.y=1.25;c.position.y=.248;r.position.set(.035,.305,0);g.add(b,c,r);
 for(const o of g.children)o.userData.shared=true;
 return g}
/* C4 remoto: pequeno pacote 3D de peças compartilhadas, sem textura externa. */
const REMOTE_VIS={
 body:new THREE.BoxGeometry(.44,.28,.095),strap:new THREE.BoxGeometry(.475,.075,.115),
 plate:new THREE.BoxGeometry(.22,.135,.015),led:new THREE.SphereGeometry(.035,8,6),
 shell:new THREE.MeshStandardMaterial({color:0x343b32,metalness:.16,roughness:.77}),
 band:new THREE.MeshStandardMaterial({color:0x111717,roughness:.84}),
 screen:new THREE.MeshStandardMaterial({color:0x879692,metalness:.4,roughness:.39}),
 red:new THREE.MeshStandardMaterial({color:0xec3435,emissive:0xb30a06,emissiveIntensity:.9})
};
function remoteMesh(){const m=new THREE.Group();
 const b=new THREE.Mesh(REMOTE_VIS.body,REMOTE_VIS.shell),strap=new THREE.Mesh(REMOTE_VIS.strap,REMOTE_VIS.band),screen=new THREE.Mesh(REMOTE_VIS.plate,REMOTE_VIS.screen),led=new THREE.Mesh(REMOTE_VIS.led,REMOTE_VIS.red);
 strap.position.y=-.04;screen.position.set(.04,.025,.057);led.position.set(-.15,.08,.067);m.add(b,strap,screen,led);
 for(const o of m.children)o.userData.shared=true;
 return m}
const pickups=[];
// Mesmo afastamento vertical (.075) dos halos dos postes: luz fica no piso/água,
// enquanto a malha do colecionável pode oscilar livremente acima da superfície.
function pickupSurfaceY(x,z){return inWater(x,z)?waterLevel(x,z):groundY(x,z)}
function makePickup(id,x,z,ammo,ch,kind){kind=kind||'gun';const g=new THREE.Group();
 if(kind==='cash'){
  const material=new THREE.MeshStandardMaterial({color:0x55c96b,metalness:.25,roughness:.45,emissive:0x123a16,emissiveIntensity:.2});
  const outline=new THREE.Shape();
  outline.moveTo(.32,.35);
  outline.bezierCurveTo(.12,.59,-.36,.52,-.36,.22);
  outline.bezierCurveTo(-.36,.01,-.12,-.04,.06,-.10);
  outline.bezierCurveTo(.30,-.17,.20,-.36,.03,-.34);
  outline.bezierCurveTo(-.09,-.34,-.18,-.28,-.24,-.21);
  outline.lineTo(-.38,-.36);
  outline.bezierCurveTo(-.14,-.61,.37,-.51,.37,-.23);
  outline.bezierCurveTo(.37,.01,.13,.06,-.06,.12);
  outline.bezierCurveTo(-.28,.19,-.18,.36,-.02,.33);
  outline.bezierCurveTo(.08,.33,.15,.29,.20,.23);
  outline.closePath();
  const geometry=new THREE.ExtrudeGeometry(outline,{depth:.16,steps:1,curveSegments:6,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1});
  geometry.translate(0,0,-.08);
  const symbol=new THREE.Mesh(geometry,material);
  const stem=new THREE.Mesh(new THREE.BoxGeometry(.075,1.035,.19),material);
  g.add(symbol,stem);
 }else
 if(kind==='armor'){// colete à prova de balas: corpo estofado sem mangas, alças nos ombros e cinta na cintura
  const m=new THREE.MeshStandardMaterial({color:0x26272c,metalness:.15,roughness:.75,emissive:0x0c0d10,emissiveIntensity:.3}),m2=new THREE.MeshStandardMaterial({color:0x1a1b1f,metalness:.1,roughness:.85});
  const s=new THREE.Shape();s.moveTo(-.3,.42);s.lineTo(-.38,.3);s.lineTo(-.4,-.42);s.quadraticCurveTo(0,-.5,.4,-.42);s.lineTo(.38,.3);s.lineTo(.3,.42);s.lineTo(.18,.42);s.quadraticCurveTo(0,.18,-.18,.42);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:.2,steps:1,curveSegments:8,bevelEnabled:true,bevelThickness:.09,bevelSize:.07,bevelSegments:3});geo.translate(0,0,-.1);g.add(new THREE.Mesh(geo,m));
  for(const sx of [-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.13,.12,.5),m2);st.position.set(sx*.24,.47,0);g.add(st);const pa=new THREE.Mesh(new THREE.BoxGeometry(.16,.2,.06),m2);pa.position.set(sx*.24,.33,.2);g.add(pa)}
  const band=new THREE.Mesh(new THREE.BoxGeometry(.98,.28,.52),m2);band.position.y=-.2;g.add(band);const flap=new THREE.Mesh(new THREE.BoxGeometry(.3,.26,.04),m);flap.position.set(.12,-.2,.27);g.add(flap)}
 else if(kind==='hp'){const wm=new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:.4}),rm=new THREE.MeshBasicMaterial({color:0xe8202a});
  g.add(new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.3),wm));const a=new THREE.Mesh(new THREE.BoxGeometry(.58,.18,.32),rm),b=new THREE.Mesh(new THREE.BoxGeometry(.18,.58,.32),rm);g.add(a,b)}
 else if(kind==='grenade'||kind==='remote'){const gm=kind==='grenade'?grenadeMesh():remoteMesh();while(gm.children.length)g.add(gm.children[0])}
 else if(kind==='jammer'){const body=new THREE.MeshStandardMaterial({color:0x303b31,roughness:.72}),screen=new THREE.MeshStandardMaterial({color:0x78b69c,emissive:0x0c3530,emissiveIntensity:.32});g.add(new THREE.Mesh(new THREE.BoxGeometry(.43,.65,.15),body));const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.24,.16),screen);m.position.y=.1;g.add(m);const ant=new THREE.Mesh(new THREE.BoxGeometry(.035,.35,.035),body);ant.position.set(.15,.46,0);g.add(ant)}
 else if(kind==='knife'){const st=new THREE.MeshStandardMaterial({color:0xd6dbe2,metalness:.85,roughness:.22}),hm=new THREE.MeshStandardMaterial({color:0x2a1a10,roughness:.7}),gm=new THREE.MeshStandardMaterial({color:0x30323a,metalness:.6,roughness:.4}); /* v4 r29: lâmina para +x */
  const sh=new THREE.Shape();sh.moveTo(0,-.06);sh.lineTo(.62,-.06);sh.quadraticCurveTo(.78,-.02,.86,.07);sh.lineTo(0,.07);sh.closePath();const bg=new THREE.ExtrudeGeometry(sh,{depth:.025,bevelEnabled:false});bg.translate(.05,0,-.0125);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(.42,.13,.08),hm);hd.position.x=-.2;const gd=new THREE.Mesh(new THREE.BoxGeometry(.05,.24,.1),gm);gd.position.x=.02;g.add(new THREE.Mesh(bg,st),hd,gd)}
 else if(kind==='bat'){const wd=new THREE.MeshStandardMaterial({color:0xc8955a,roughness:.55}),tp=new THREE.MeshStandardMaterial({color:0x1e1e24,roughness:.9});
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.045,1.5,10),wd);b.rotation.z=-Math.PI/2;b.position.x=.25;const gr=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.4,8),tp);gr.rotation.z=-Math.PI/2;gr.position.x=-.38;
  const kn=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.05,10),tp);kn.rotation.z=-Math.PI/2;kn.position.x=-.6;const cap=new THREE.Mesh(new THREE.SphereGeometry(.11,10,6),wd);cap.scale.set(.35,1,1);cap.position.x=1;g.add(b,gr,kn,cap)}
 else if(kind==='smg'){const gm=new THREE.MeshStandardMaterial({color:0x26262a,metalness:.6,roughness:.35});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(1.25,.26,.18),gm);b1.position.x=.1;const b2=new THREE.Mesh(new THREE.BoxGeometry(.16,.55,.14),gm);b2.position.set(.05,-.36,0);const b3=new THREE.Mesh(new THREE.BoxGeometry(.18,.4,.15),gm);b3.position.set(-.38,-.25,0);b3.rotation.z=-.3;const b4=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.08),gm);b4.position.set(.85,.03,0);g.add(b1,b2,b3,b4)}
 else if(kind==='rpg'){const gm=new THREE.MeshStandardMaterial({color:0x4a5a2a,roughness:.6}),tm=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.5}),wm=new THREE.MeshStandardMaterial({color:0xb8402a,roughness:.5});
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,1.7,10),gm);tb.rotation.z=Math.PI/2;const w=new THREE.Mesh(new THREE.ConeGeometry(.2,.4,10),wm);w.rotation.z=-Math.PI/2;w.position.x=1.05;const gr=new THREE.Mesh(new THREE.BoxGeometry(.14,.4,.12),tm);gr.position.set(-.1,-.3,0);g.add(tb,w,gr)}
 else if(kind==='magnum'){const sm=new THREE.MeshStandardMaterial({color:0xc8ccd4,metalness:.85,roughness:.25}),wm=new THREE.MeshStandardMaterial({color:0x5a3a22,roughness:.6});
  const br=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.95,12),sm);br.rotation.z=Math.PI/2;br.position.set(.32,.05,0);const dr=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.26,12),sm);dr.rotation.z=Math.PI/2;dr.position.set(-.18,0,0);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(.5,.16,.12),sm);fr.position.set(-.05,.08,0);const gp=new THREE.Mesh(new THREE.BoxGeometry(.18,.46,.15),wm);gp.position.set(-.42,-.24,0);gp.rotation.z=-.35;g.add(br,dr,fr,gp)}
 else{const gm=new THREE.MeshStandardMaterial({color:0x2a2a2e,metalness:.6,roughness:.35});
 const b1=new THREE.Mesh(new THREE.BoxGeometry(.9,.22,.16),gm);b1.position.x=.15;const b2=new THREE.Mesh(new THREE.BoxGeometry(.2,.44,.15),gm);b2.position.set(-.18,-.25,0);b2.rotation.z=-.25;g.add(b1,b2)}
 const ring=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.8),new THREE.MeshBasicMaterial({map:glowTex,color:kind==='hp'?0xff2a3a:kind==='rpg'?0xff7a1a:kind==='grenade'?0x8bd36a:kind==='remote'?0xff4b4f:kind==='smg'?0x8aff3a:kind==='knife'?0xd8e4ff:kind==='bat'?0xffb060:0xffd23a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.85,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
 if(kind==='armor')ring.material.color.setHex(0xd8dcff);
 const surfaceY=pickupSurfaceY(x,z),y0=surfaceY+1.1,scale=kind==='cash'?1.3/3:1.3;
 ring.rotation.x=-Math.PI/2;ring.position.set(x,surfaceY+.075,z);ring.scale.setScalar(scale);ring.renderOrder=2;
 g.position.set(x,y0,z);g.scale.setScalar(scale);scene.add(g,ring);
 const p={id,x,z,ammo,g,glow:ring,ch,kind,y0};pickups.push(p);ch.pickups.push(p);return p}
const HELD={g:null,w:null};
/* ===== COLECIONÁVEIS: 15 discos de vinil na capa, entre o lixo dos becos e nos rios (precisa de lancha).
   Uma textura de capa e uma de disco, geradas 1x e compartilhadas por todos. No mapa aparecem como "?".
   Pegando os 15: armas com munição máxima + colete ao redor da casa segura (reaparecem) e um carro com nitro sempre na porta. */
const VINYL={N:15,got:new Set(),bag:new Set(),cheat:false,spots:[],geo:null,mat:null,car:null,t:0};
function vinylAssets(){if(VINYL.geo)return;const mk=(f)=>{const c=document.createElement('canvas');c.width=c.height=64;f(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;return t};
 const sleeve=mk(g=>{const hu=Math.random()*360;g.fillStyle='hsl('+hu+',70%,45%)';g.fillRect(0,0,64,64);for(let i=0;i<7;i++){g.fillStyle='hsl('+((hu+60+Math.random()*240)%360)+','+(60+Math.random()*40|0)+'%,'+(35+Math.random()*40|0)+'%)';if(i%2)g.fillRect(Math.random()*56|0,0,4+Math.random()*10|0,64);else{g.beginPath();g.arc(Math.random()*64,Math.random()*64,5+Math.random()*14,0,7);g.fill()}}g.strokeStyle='#000';g.lineWidth=4;g.strokeRect(0,0,64,64)});
 const disc=mk(g=>{g.fillStyle='#0a0a0c';g.beginPath();g.arc(32,32,32,0,7);g.fill();g.strokeStyle='#2c2c34';g.lineWidth=1;for(let r=12;r<31;r+=3){g.beginPath();g.arc(32,32,r,0,7);g.stroke()}g.fillStyle='#d62828';g.beginPath();g.arc(32,32,9,0,7);g.fill();g.fillStyle='#f2e6b8';g.fillRect(31,31,2,2)});
 VINYL.geo={box:new THREE.BoxGeometry(.9,.9,.07),disc:new THREE.CircleGeometry(.4,20,0,Math.PI),ring:new THREE.PlaneGeometry(2.8,2.8)};
 VINYL.mat={box:new THREE.MeshBasicMaterial({map:sleeve}),disc:new THREE.MeshBasicMaterial({map:disc,side:THREE.DoubleSide}),ring:new THREE.MeshBasicMaterial({map:glowTex,color:0xc84aff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.85,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})}}
function makeVinyl(i,x,z){vinylAssets();const g=new THREE.Group(),b=new THREE.Mesh(VINYL.geo.box,VINYL.mat.box),d=new THREE.Mesh(VINYL.geo.disc,VINYL.mat.disc),r=new THREE.Mesh(VINYL.geo.ring,VINYL.mat.ring);
 d.position.y=.45;d.position.x=.12;for(const o of [b,d,r])o.userData.shared=true;g.add(b,d);
 // Nos rios a lâmina d'água é RY=-3, não +.3: evitar vinil suspenso vários metros acima.
 const water=inWater(x,z),surfaceY=water?waterLevel(x,z):groundY(x,z),y0=surfaceY+(water?.85:1.1);
 g.position.set(x,y0,z);g.scale.setScalar(1.1);
 r.rotation.x=-Math.PI/2;r.position.set(x,surfaceY+.075,z);r.scale.setScalar(1.1);r.renderOrder=2;
 scene.add(g,r);const k=chunkOf(x,z),ch=city.chunks.get(k[0]+','+k[1])||{pickups:[]};
 const p={id:'vinyl'+i,vi:i,x,z,ammo:0,g,glow:r,ch,kind:'vinyl',y0};pickups.push(p);ch.pickups.push(p);return p}
function vinylPlace(){
 VINYL.spots=[];VINYL.car=null;
 if(city.haze||S.style==='inverted')return;
 const R=mulberry32((S.seed^0x5f3759df)>>>0),E=city.ext;
 // Distância mínima permanente, inclusive entre rios e entre prédios.
 const MIN_VINYL_GAP=28;
 const far=(x,z,d=MIN_VINYL_GAP)=>VINYL.spots.every(s=>Math.hypot(s.x-x,s.z-z)>=d);
 // Não basta estar num retângulo vazio: itens precisam estar fora de colisores físicos
 // e com corredor livre até ao menos um dos dois lados da passagem.
 const open=(x,z,r=.78)=>{
  if(inWater(x,z)||groundY(x,z)<-.05||groundY(x,z)>.6)return false;
  return !query(x,z,r).some(c=>!c.dead&&x+r>c.x0&&x-r<c.x1&&z+r>c.z0&&z-r<c.z1);
 };
 const land=[];
 const add=(x,z)=>{if(!open(x,z))return;land.push({x,z,order:R()})};
 // Os três primeiros discos continuam fluviais e afastados (90 metros).
 for(let k=0;k<6000&&VINYL.spots.length<3;k++){
  const x=20+R()*(E-40),z=20+R()*(E-40);
  if(inWater(x,z)&&inWater(x+3,z)&&inWater(x-3,z)&&inWater(x,z+3)&&inWater(x,z-3)&&outDist(x,z)<=0&&far(x,z,90))VINYL.spots.push({x,z});
 }
 // 1) Becos existentes, inclusive os que não têm contêineres grandes.
 for(const q of city.catSpots||[]){
  const [x0,z0,x1,z1]=q.r,along=(x1-x0)<(z1-z0),len=along?z1-z0:x1-x0;
  if(len<5)continue;
  for(let t=3;t<len-2;t+=4){const x=along?(x0+x1)/2:x0+t,z=along?z0+t:(z0+z1)/2;add(x,z)}
  for(const b of q.bins||[])for(const side of [-1,1]){
   const off=(b.r+1.15)*side,x=along?b.x+off:b.x,z=along?b.z:b.z+off;
   if(x>x0+.8&&x<x1-.8&&z>z0+.8&&z<z1-.8)add(x,z);
  }
 }
 // 2) Passagens reais entre fachadas, com base nos retângulos FINAIS de
 // colisão dos edifícios já construídos (não em subdivisões teóricas).
 // Parear apenas edifícios do mesmo quarteirão evita custo quadrático global.
 const byLot=new Map();for(const b of city.buildingFootprints||[]){let a=byLot.get(b.ri);if(!a){a=[];byLot.set(b.ri,a)}a.push(b)}
 for(const bb of byLot.values())for(let i=0;i<bb.length;i++)for(let j=i+1;j<bb.length;j++){
  const a=bb[i],b=bb[j];
  const corridor=(gap,left,right,at)=>{
   if(gap<2.3||gap>11||right-left<4.5)return;
   const mid=(left+right)/2;
   for(const t of [.19,.38,.62,.81]){
    const p=at(left+(right-left)*t);
    // Corredor longitudinal livre dos dois lados do item, para não o cercar.
    if(open(p[0],p[1],.85)&&open(...at(Math.max(left+1.3,left+(right-left)*t-1.2)),.7)&&open(...at(Math.min(right-1.3,left+(right-left)*t+1.2)),.7))add(p[0],p[1]);
   }
  };
  if(a.x1<=b.x0) corridor(b.x0-a.x1,Math.max(a.z0,b.z0),Math.min(a.z1,b.z1),z=>[(a.x1+b.x0)/2,z]);
  if(b.x1<=a.x0) corridor(a.x0-b.x1,Math.max(a.z0,b.z0),Math.min(a.z1,b.z1),z=>[(b.x1+a.x0)/2,z]);
  if(a.z1<=b.z0) corridor(b.z0-a.z1,Math.max(a.x0,b.x0),Math.min(a.x1,b.x1),x=>[x,(a.z1+b.z0)/2]);
  if(b.z1<=a.z0) corridor(a.z0-b.z1,Math.max(a.x0,b.x0),Math.min(a.x1,b.x1),x=>[x,(b.z1+a.z0)/2]);
 }
 land.sort((a,b)=>a.order-b.order);
 // 3) Dispersão progressiva sem quebrar o mínimo de 28 metros.
 for(const gap of [70,46,MIN_VINYL_GAP])for(const p of land){
  if(VINYL.spots.length>=VINYL.N)break;
  if(far(p.x,p.z,gap))VINYL.spots.push({x:p.x,z:p.z});
 }
 if(VINYL.spots.length<VINYL.N)console.warn('Vinis: espaços válidos insuficientes na seed',S.seed,VINYL.spots.length,'de',VINYL.N,'candidatos terrestres:',land.length);
 VINYL.spots.forEach((s,i)=>{if(!VINYL.got.has(i)&&!VINYL.bag.has(i))makeVinyl(i,s.x,s.z)});
 // Armas, coletes, kits e dinheiro também podem aparecer nas passagens. Mantém
 // limites de população e IDs determinísticos; não altera loot garantido existente.
 let extras=0;const cap=city.N===7?7:18;
 for(let i=0;i<land.length&&extras<cap;i++){
  const p=land[i];if(R()>.14||!far(p.x,p.z,12)||pickups.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<12))continue;
  const id='passage_'+S.seed+'_'+Math.round(p.x*10)+'_'+Math.round(p.z*10);
  if(city.picked.has(id))continue;
  const roll=R();if(roll>=.21&&roll<.42)continue;const kind=roll<.21?pickKind(id):roll<.68?'armor':roll<.91?'hp':'cash';
  const ammo=kind==='armor'?100:kind==='hp'?0:kind==='cash'?25+Math.floor(R()*125):kind==='jammer'?1:(kind==='rpg'||kind==='grenade'||kind==='remote')?3:kind==='smg'?80:kind==='magnum'?12:35;
  const c=chunkOf(p.x,p.z),ch=city.chunks.get(c[0]+','+c[1]);if(!ch)continue;
  makePickup(id,p.x,p.z,ammo,ch,kind);extras++;
 }
 // v232: garantir que alguns itens estejam NOS becos residenciais densos.
 // Nao entram nas quadras comuns nem na lista de candidatos de portal.
 // Cap global baixo para preservar draw calls e memoria.
 {const groups=new Map();for(const q of city.denseAlleySites||[]){if(!groups.has(q.ri))groups.set(q.ri,[]);groups.get(q.ri).push(q)}
  const riList=[...groups.keys()].sort((a,b)=>a-b),budget=city.N===7?5:12;let total=0;
  for(const ri of riList){if(total>=budget)break;
   const r=mulberry32((S.seed^Math.imul(ri+1,0x7feb352d)^0x134d012b)>>>0);
   const sites=groups.get(ri).map(q=>({q,rank:r()})).sort((a,b)=>a.rank-b.rank).map(v=>v.q);let target=null;
   for(const q of sites){if(target)break;
    const [x0,z0,x1,z1]=q.r,along=(x1-x0)<(z1-z0);
    for(const t of [.28,.55,.73]){
     const x=along?(x0+x1)/2:x0+(x1-x0)*t,z=along?z0+(z1-z0)*t:(z0+z1)/2;
     if(open(x,z,.65)&&!pickups.some(p=>Math.hypot(p.x-x,p.z-z)<16)){target={x,z};break}
    }
   }
   if(!target)continue;
   const roll=r();if(roll>=.21&&roll<.42)continue;const kind=roll<.21?pickKind('res'+ri):roll<.72?'hp':roll<.88?'armor':'cash',
     ammo=kind==='hp'?0:kind==='armor'?100:kind==='cash'?60:kind==='jammer'?1:(kind==='rpg'||kind==='remote'||kind==='grenade')?3:kind==='smg'?70:kind==='magnum'?12:40;
   const id='respath_'+S.seed+'_'+ri;if(city.picked.has(id))continue;
   const k=chunkOf(target.x,target.z),ch=city.chunks.get(k[0]+','+k[1]);if(!ch)continue;
   makePickup(id,target.x,target.z,ammo,ch,kind);total++;
  }
 }
 // v254: um jammer de mundo, prioritariamente num beco urbano real, sem sobrepor loot.
 // RNG local: a seed e o layout dos demais objetos nao mudam com essa escolha.
 {const id='alley_jammer_'+S.seed;
  if(false&&!city.picked.has(id)){ /* r54: jammer de beco removido (o jammer agora é o app ctOS) */
   const jr=mulberry32((S.seed^0x5e37c129)>>>0);
   const sites=(city.catSpots||[]).map(q=>({q,rank:jr()})).sort((a,b)=>Number(!!a.q.residential)-Number(!!b.q.residential)||a.rank-b.rank);
   let placed=false;
   for(const {q} of sites){if(placed)break;const [x0,z0,x1,z1]=q.r,along=(x1-x0)<(z1-z0),len=along?z1-z0:x1-x0;
    if(len<7)continue;
    for(const t of [.24,.5,.76]){
     const x=along?(x0+x1)/2:x0+(x1-x0)*t,z=along?z0+(z1-z0)*t:(z0+z1)/2;
     if(!open(x,z,.65)||pickups.some(p=>Math.hypot(p.x-x,p.z-z)<14))continue;
     const c=chunkOf(x,z),ch=city.chunks.get(c[0]+','+c[1]);if(!ch)continue;
     makePickup(id,x,z,1,ch,'jammer');placed=true;break;
    }
   }
  }
 }
}
function vinylSync(){for(const p of pickups.slice())if(p.kind==='vinyl'&&(VINYL.got.has(p.vi)||VINYL.bag.has(p.vi)))removePickup(p)}
/* r62: disco pego vai para a mochila; só conta na coleção (1/15) depois de vendido na casa de penhores. */
const VINYL_PRICE=150;
function vinylGet(p){VINYL.bag.add(p.vi);if(recordsOpen)recordsRefresh();removePickup(p);clang(.35);toast('<span style="color:#ffd24a">'+translatePlain('DISCO RARO')+' · '+(VINYL.got.size+VINYL.bag.size)+'/'+VINYL.N+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('venda na casa de penhores')+'</small>')}
function vinylSell(){const n=VINYL.bag.size;if(!n)return 0;for(const i of VINYL.bag)VINYL.got.add(i);VINYL.bag.clear();if(recordsOpen)recordsRefresh();if(VINYL.got.size>=VINYL.N)setTimeout(vinylDone,2200);return n}
function vinylDone(){toast('COLEÇÃO COMPLETA!<br><small style="font-size:11px;color:#fff">volte para a sua casa segura e veja a surpresa!</small>');clang(.5);VINYL.t=0}
const VINYL_REW=[['gun',1500,'pistol'],['smg',1500,'smg'],['magnum',1500,'magnum'],['rpg',30,'rpg'],['armor',100,'armor']];
function vinylTick(dt){if(VINYL.got.size<VINYL.N||city.haze||S.style==='inverted'||!city.safe||!played)return;if((VINYL.t-=dt)>0)return;VINYL.t=2;const s=city.safe,tx=-s.nz,tz=s.nx,pc=PL.car||PL,dp=Math.hypot(pc.x-s.x,pc.z-s.z);
 // armas + colete em semicírculo na frente da porta; reaparecem quando você se afasta
 VINYL_REW.forEach(([k,am],i)=>{const id='vrew'+i;if(pickups.some(q=>q.id===id))return;const o=(i-2)*1.6,x=s.x+tx*o+s.nx*(1.2+Math.abs(i-2)*.25),z=s.z+tz*o+s.nz*(1.2+Math.abs(i-2)*.25);if(dp<25&&VINYL.rewInit)return;const k2=chunkOf(x,z),ch=city.chunks.get(k2[0]+','+k2[1])||{pickups:[]};makePickup(id,x,z,am,ch,k).respawn=true});VINYL.rewInit=true;
 // carro com nitro sempre na porta (não na garagem)
 const cx=s.x+s.nx*4.6,cz=s.z+s.nz*4.6,c=VINYL.car;if(c&&c.alive&&Math.hypot(c.x-cx,c.z-cz)<6)return;if(PL.car&&PL.car===c&&dp<40)return;if(dp<40&&VINYL.carInit)return;
 if(carsNear(cx,cz,3).length)return;const v=makeVehicle('sports',cx,cz,Math.atan2(tz,tx),'#ff3ea5');v.hand=true;v.sleep=true;v.hasNitro=true;v.vinylCar=true;VINYL.car=v;VINYL.carInit=true}

function heldGunTick(){const hw=GUN.has?GUN.w:meleeW(),melee=!GUN.has&&hw!=='fist',show=(GUN.has||melee)&&!PL.car&&!PL.heli&&!PL.dead&&!PL.down&&!PARA.active&&!TVM.on&&(camMode==='top'||VIEW.tp)&&running;HELD.melee=melee;
 if(!show||HELD.w!==hw){if(HELD.g){scene.remove(HELD.g);HELD.g.traverse(o=>{if(o.userData.shared)return;if(o.geometry&&!o.isSprite)o.geometry.dispose();if(o.material)o.material.dispose()});HELD.g=null;HELD.w=null}if(!show)return}
 if(!HELD.g){const p=hw==='flame'?{g:ammoShowcaseWeapon('flame')}:makePickup('__held',0,0,0,{pickups:[]},hw==='pistol'?'gun':hw);const i=pickups.indexOf(p);if(i>=0)pickups.splice(i,1);
  // O brilho agora é independente da arma/ícone: não deve seguir a mão do jogador.
  removePickupGlow(p);
  const inner=new THREE.Group();while(p.g.children.length)inner.add(p.g.children[0]);p.g.add(inner);p.g.scale.setScalar(GUN.w==='rpg'?.42:.3);p.g.traverse(o=>{if(o.isMesh)o.castShadow=false;o.layers.set(1)});HELD.g=p.g;HELD.w=hw;if(!p.g.parent)scene.add(p.g)}
 let ax,az,ay=0;if(camMode==='top'){ax=PL.face[0];az=PL.face[1]}else{const cp=Math.cos(PL.pitch);ax=-Math.sin(PL.yaw)*cp;az=-Math.cos(PL.yaw)*cp;ay=Math.sin(PL.pitch)}
 const l=Math.hypot(ax,az)||1,nx=ax/l,nz=az/l,top=camMode==='top';
 const lat=top?1.05:.52,fw=top?.2:.35;HELD.g.position.set(PL.x+nx*fw-nz*lat,PL.gy+(PL.jy||0)+(top?2.4:.98),PL.z+nz*fw+nx*lat);HELD.g.scale.setScalar((melee?(hw==='bat'?.55:.3):GUN.w==='rpg'?.42:.3)*(top?2.6:1));HELD.g.rotation.set(0,Math.atan2(-nz,nx),melee?meleeTilt(hw):top?0:Math.asin(clamp(ay,-1,1))*.8)}
/* v4 r29: inclinação da faca/taco na mão: taco erguido, desce no golpe; faca um pouco para baixo, vai à frente */
function meleeTilt(w){const k=MELEE.t>0?Math.sin(Math.max(0,MELEE.t)/MELEE.T*Math.PI):0;return w==='bat'?1.15-2.1*k:-.25+.25*k}
function removePickupGlow(p){if(!p.glow)return;scene.remove(p.glow);if(!p.glow.userData.shared){if(p.glow.geometry&&!p.glow.isSprite)p.glow.geometry.dispose();p.glow.material.dispose()}p.glow=null}
function removePickup(p){if(ONLINE.on&&p.id&&p.id!=='__held'&&!p.netDrop)netPkRemoved(p);removePickupGlow(p);scene.remove(p.g);p.g.traverse(o=>{if(o.userData.shared)return;if(o.geometry&&!o.isSprite)o.geometry.dispose();if(o.material)o.material.dispose()});let i=pickups.indexOf(p);if(i>=0)pickups.splice(i,1);if(p.ch){i=p.ch.pickups.indexOf(p);if(i>=0)p.ch.pickups.splice(i,1)}}
function clearPickups(){while(pickups.length)removePickup(pickups[0])}
function updatePickups(dt){vinylTick(dt);npcDropTick(dt);const pc=PL.car||PL,wl=!worldOn('pickups');for(const p of pickups.slice()){if(p.kind!=='cash'&&p.g){if(wl&&!p.npcDrop){p.g.visible=false;if(p.glow)p.glow.visible=false;continue}if(!p.g.visible&&p.id!=='__held')p.g.visible=true}if(p.glow)p.glow.visible=p.g.visible; /* v78: a luz branca no chão some junto com o item (antes ficava acesa com o coletável bloqueado pela história) */if(p.kind==='vinyl'&&S.style==='inverted'){removePickup(p);continue}if(p.roadCash&&(p.ttl-=dt)<=0){removePickup(p);continue}p.g.rotation.y+=dt*2;p.g.position.y=(p.y0||1.1)+Math.sin(simT*3+p.x)*.15;
 if(!PL.dead&&Math.hypot(pc.x-p.x,pc.z-p.z)<(PL.car?2.8:1.5)){if(p.netDrop){if(!p.lootT||simT-p.lootT>2){p.lootT=simT;ONLINE.out.push({k:'loot',id:p.id})}continue}if(p.kind==='vinyl'){vinylGet(p);continue}if(p.kind==='cash'){if(p.roadCash&&PL.car)continue;if(!p.roadCash)city.picked.add(p.id);money(p.ammo,p.roadCash?'+$'+p.ammo:'$'+p.ammo+' ACHADOS NO RIO<br><small style="font-size:11px;color:#fff">era de quem? melhor não perguntar</small>');clang(.3);removePickup(p);continue}if(p.kind==='armor'){if((PL.armor||0)>=100)continue;if(!p.respawn)city.picked.add(p.id);const a0=PL.armor||0;PL.armor=Math.min(100,a0+(p.ammo||100));toast('COLETE +'+Math.round(PL.armor-a0));clang(.3);removePickup(p);if(p.respawn){const seed=S.seed,st=S.style,q=p;setTimeout(()=>{if(S.seed===seed&&S.style===st&&city.ext&&!pickups.some(k=>k.id===q.id))makePickup(q.id,q.x,q.z,100,q.ch,'armor').respawn=true},120000)}continue}
 if(p.kind==='knife'||p.kind==='bat'){if(MELEE.inv[p.kind])continue;if(!p.npcDrop)city.picked.add(p.id);const first=meleeGive(p.kind);toast(translatePlain(MELEE_N[p.kind])+(first?'<br><small style="font-size:11px;color:#fff">'+translatePlain('segure TAB: roda de armas')+'</small>':''));clang(.3);removePickup(p);continue} /* v4 r29 */
 if(p.kind==='hp'){if(PL.hp>=100)continue;city.picked.add(p.id);const g0=PL.hp;PL.hp=Math.min(100,PL.hp+50);toast('VIDA +'+Math.round(PL.hp-g0));clang(.25);removePickup(p);continue}const w=p.kind==='gun'?'pistol':p.kind;if(!CHEAT.ammo&&GUN.inv[w]&&(GUN.has&&GUN.w===w?GUN.ammo:GUN.inv[w].ammo)>=ammoCap(w)){if(!p.fullT||simT-p.fullT>4){p.fullT=simT;toast('MUNIÇÃO CHEIA · '+WPN[w].name+' '+ammoCap(w)+'<br><small style="font-size:11px;color:#fff">'+(PLAYER_PAL.bag?'limite máximo':'compre uma mochila na Malas & Mochilas Co. do shopping')+'</small>')}continue}if(!p.npcDrop)city.picked.add(p.id);const first=!GUN.inv[w];gunGive(w,p.ammo);toast(WPN[w].name+' · +'+p.ammo+(w==='rpg'?' FOGUETES':w==='grenade'?' GRANADAS':w==='remote'?' BOMBAS':w==='jammer'?' JAMMERS':' BALAS')+'<br><small style="font-size:11px;color:#fff">'+(w==='smg'?'segure o clique para rajada':w==='rpg'?'explode carros na hora':w==='grenade'?'arremesso em arco · explode 5 s após cair':w==='remote'?'plante com clique · detone na Agenda do celular':w==='jammer'?'ative à noite para apagar as luzes':'clique para atirar')+(first?' · segure TAB: roda de armas':'')+'</small>');clang(.3);removePickup(p)}}}
const tracers=[];for(let i=0;i<10;i++){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffe08a,transparent:true}));l.frustumCulled=false;l.visible=false;scene.add(l);tracers.push({l,t:0})}
let trI=0;
function tracer(a,b,col){const t=tracers[trI=(trI+1)%tracers.length];const p=t.l.geometry.attributes.position;p.setXYZ(0,a.x,a.y,a.z);p.setXYZ(1,b.x,b.y,b.z);p.needsUpdate=true;t.l.material.color.setHex(col||0xffe08a);t.l.visible=true;t.t=.08}
function updateTracers(dt){for(const t of tracers)if(t.l.visible){t.t-=dt;t.l.material.opacity=Math.max(0,t.t/.08);if(t.t<=0)t.l.visible=false}}
/* ================= v261: PROJETEIS E ALVOS EM 3D =================
   Nao alterar SpriteMaterial, geometria compartilhada, drawRange, ou iluminacao
   protegidos na v258. Acertos aereos usam esferas matematicas e nao raycasts
   de malha nem um collider 2D que bloqueie balas a qualquer altura. */
function aircraftTargets(){
 const targets=[];
 for(const slot of SKY.slots)if(slot.o&&slot.o.g){
  const a=slot.o;targets.push({type:'sky',owner:slot,x:a.x,y:a.g.position.y,z:a.z,r:slot.kind==='heli'?2.5:4.3})}
 if(COPH.h&&COPH.h.state!=='falling'&&COPH.h.o&&COPH.h.o.g){const a=COPH.h;targets.push({type:'police',owner:a,x:a.x,y:a.o.g.position.y,z:a.z,r:2.5})}
 for(const a of HELI.list)if(a.o&&a.o.g&&a.state!=='dead'&&a.state!=='falling'&&a!==HELI.cur)
  targets.push({type:'parked',owner:a,x:a.x,y:a.o.g.position.y,z:a.z,r:2.5});
 return targets;
}
function raySphereDistance(o,d,x,y,z,r){
 const px=x-o.x,py=y-o.y,pz=z-o.z,b=px*d.x+py*d.y+pz*d.z;
 if(b<0)return Infinity;
 const c=px*px+py*py+pz*pz-r*r,disc=b*b-c;
 if(disc<0)return Infinity;
 return Math.max(0,b-Math.sqrt(disc));
}
function aircraftRayHit(o,d,maxD){
 let best=null,bDist=maxD;
 for(const a of aircraftTargets()){
  const t=raySphereDistance(o,d,a.x,a.y,a.z,a.r);
  if(t<bDist){bDist=t;best={pt:new THREE.Vector3(o.x+d.x*t,o.y+d.y*t,o.z+d.z*t),air:a,dist:t}}
 }
 return best;
}
// Toque/controle nas cameras superiores: assistencia vertical somente se
// um alvo aereo estiver a frente (cone horizontal estreito). Nao mira atravessando
// edificios: o rayHit do disparo continua testando fachadas antes do alvo.
function topAirAssist(o,d){
 let target=null,best=Infinity;const dirXZ=Math.hypot(d.x,d.z)||1;
 for(const a of aircraftTargets()){
  if(a.y<o.y+6)continue;
  const dx=a.x-o.x,dz=a.z-o.z,flat=Math.hypot(dx,dz);
  if(flat<3||flat>230)continue;
  const dot=(dx*d.x+dz*d.z)/(flat*dirXZ);
  if(dot<.976)continue; // 12.5 graus aproximadamente
  const score=flat*(1+(1-dot)*15);
  if(score<best){best=score;target=a}
 }
 return target?new THREE.Vector3(target.x-o.x,target.y-o.y,target.z-o.z).normalize():null;
}
function airBurst(x,y,z){
 boomLight.position.set(x,y,z);boomLight.intensity=10;boomT=.7;
 for(let i=0;i<28;i++){const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI*2,sp=2+Math.random()*7;
  emit(x,y,z,Math.cos(a)*Math.cos(b)*sp,Math.sin(b)*sp,Math.sin(a)*Math.cos(b)*sp,.7,.8,.25,i%3?0xffa024:0xffeb72,true,.9)}
 for(let i=0;i<12;i++)emit(x,y,z,(Math.random()-.5)*4,1+Math.random()*4,(Math.random()-.5)*4,2,1.1,4,0x27242a,false,.75);
 boomSound(Math.hypot(PL.x-x,PL.z-z));
}
function aircraftDamage(a,dmg,pt){
 if(!a)return;
 const obj=a.owner;if(obj.state==='falling')return;
 const defaultHP=a.type==='sky'?(obj.kind==='plane'?130:55):a.type==='police'?90:65;
 obj.hp=(obj.hp??defaultHP)-dmg;
 if(obj.hp>0){for(let i=0;i<5;i++)emit(pt.x,pt.y,pt.z,(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2,.2,.25,.06,0xffd17c,true,1);return}
 airBurst(a.x,a.y,a.z);
 if(a.type==='sky'){skyDrop(obj);obj.t=60+Math.random()*60}
 else if(a.type==='police'){
  Object.assign(obj,{state:'falling',fvx:obj.vx||0,fvz:obj.vz||0,fvy:0,spin:1.8});
  heliSnd(obj,false);
  if(POL.wanted)toast((POL.level||1)>=3?'HELICÓPTERO DA POLÍCIA ABATIDO<br><small style="font-size:11px;color:#fff">'+translatePlain('outro já está a caminho')+'</small>':'HELICÓPTERO DA POLÍCIA ABATIDO');
 }else{
  obj.state='falling';obj.fvx=0;obj.fvz=0;obj.fvy=0;obj.spin=1+Math.random()*2;
 }
}
function rayHit(o,d,maxD,ignoreCar,cop){
 // Hit dos helicopteros/avioes precisa considerar Y; somente buscar entre
 // os alvos aereos uma vez por raio, sem multiplicar custo por passo.
 const air=cop?null:aircraftRayHit(o,d,maxD),reach=air?air.dist:maxD;
 for(let s=.25;s<reach;s+=.45){const x=o.x+d.x*s,y=o.y+d.y*s,z=o.z+d.z*s;
  if(y<.05)return{pt:new THREE.Vector3(x,.05,z)};
  // Sacadas ficam altas e ligeiramente para fora da fachada. Testar antes do colisor
  // opaco do prédio; NPCs internos não recebem esse tratamento especial.
  for(const p of peds){if(!p.balcony||p.state==='dead'||p===cop)continue;const by=(p.gy||0)+(p.jy||0);if(Math.abs(p.x-x)<.48&&Math.abs(p.z-z)<.48&&y>=by-.04&&y<=by+1.9)return{pt:new THREE.Vector3(x,y,z),ped:p}}
  for(const b of query(x,z,.1)){
   if(b.dead||b.kind==='pole'||b.kind==='tree')continue;
   if(x<=b.x0-.22||x>=b.x1+.22||z<=b.z0-.22||z>=b.z1+.22)continue;
   // Corrige limite arbitrario de 45m: RPG e tiros atingem a lateral de predios
   // altos, mas passam SOBRE um telhado quando realmente estao acima dele.
   const top=b.kind==='bld'?(b.top??roofTop(b)):(b.low??2.4);
   if(y>=-.5&&y<=top+.12)return{pt:new THREE.Vector3(x,y,z),wall:b}
  }
  for(const c of carsNear(x,z,5)){if(c===ignoreCar)continue;const dx=x-c.x,dz=z-c.z,ca=Math.cos(c.a),sa=Math.sin(c.a),lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;if(Math.abs(lx)<c.t.L/2&&Math.abs(lz)<c.t.W/2&&y<c.gy+c.t.H+.2)return{pt:new THREE.Vector3(x,y,z),car:c}}
  for(const p of peds){if(p.state==='dead'||p===cop)continue;if(cop&&p.cop)continue;if(Math.abs(p.x-x)<.45&&Math.abs(p.z-z)<.45&&y>=(p.gy||0)+(p.jy||0)-.05&&y<=(p.gy||0)+(p.jy||0)+2.0)return{pt:new THREE.Vector3(x,y,z),ped:p}}
  if(cop&&!PL.car&&!PL.dead&&Math.abs(PL.x-x)<.55&&Math.abs(PL.z-z)<.55&&y<2.1)return{pt:new THREE.Vector3(x,y,z),player:true}}
 return air||{pt:new THREE.Vector3(o.x+d.x*maxD,o.y+d.y*maxD,o.z+d.z*maxD)}}
const mouseNDC=new THREE.Vector2(),_ray=new THREE.Raycaster();
function playerShoot(useFace){if(PL.heli){GUN.firing=false;return}if(!GUN.has||PL.dead||menuOpen||GUN.cd>0)return;
 if(PL.car&&!vehicleWeaponAllowed(GUN.w)){GUN.firing=false;GUN.cd=.5;toast('ARMA INDISPONÍVEL NESTE ASSENTO');return}if(GUN.w==='jammer'){GUN.cd=.8;GUN.firing=false;if(GUN.ammo<=0&&!CHEAT.ammo){toast('SEM JAMMERS');return}if(jammerFire()&&!CHEAT.ammo){GUN.ammo=Math.max(0,GUN.ammo-1);if(GUN.inv.jammer)GUN.inv.jammer.ammo=GUN.ammo}return}if((GUN.w==='grenade'&&(PL.car||PL.heli||PL.inside))||(GUN.w==='remote'&&(PL.car||PL.heli))){GUN.firing=false;toast(GUN.w==='grenade'?'GRANADA · ARREMESSE A PÉ':'BOMBA PROGRAMADA · PLANTE A PÉ');GUN.cd=.8;return}const W=WPN[GUN.w];GUN.cd=W.cd*(1-.10*ammoUpgrade(GUN.w,'rate'));GUN.kickAt=performance.now();
 if(GUN.ammo<=0){GUN.firing=false;toast('SEM MUNIÇÃO');clang(.12);return}GUN.ammo--;dualShot(GUN.w);if(GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;if(GUN.w==='grenade'||GUN.w==='remote')rumble(.3,.35,100);else if(GUN.w==='rpg')rumble(.9,.5,230);else if(GUN.w==='magnum')rumble(.7,.6,160);else if(GUN.w==='smg')rumble(.08,.5,55);else rumble(.25,.55,90);
 const src=PL.car||PL,o=new THREE.Vector3(),d=new THREE.Vector3();const by=PL.car?PL.car.gy+1.2:PL.gy+1.15;
 if(camMode==='top'){
  o.set(src.x,by,src.z);
  if(useFace){if(PL.car)d.set(Math.cos(PL.car.a),0,Math.sin(PL.car.a));else d.set(PL.face[0],0,PL.face[1]);
   const assisted=topAirAssist(o,d);if(assisted)d.copy(assisted);
  }else{
   // Alvo = primeiro objeto real ao longo do raio da camera no mundo 3D.
   // Inclui fachadas, telhados, pedestres e aeronaves; nao achata Y a zero.
   _ray.setFromCamera(mouseNDC,camera);
   const r=_ray.ray,h=rayHit(r.origin,r.direction,320,PL.car||netRideCar(),null);
   d.copy(h.pt).sub(o);
   if(d.lengthSq()<.01)d.set(PL.face[0],0,PL.face[1]);
  }
  d.normalize();if(!PL.car){const l=Math.hypot(d.x,d.z);if(l>.02)plFace(d.x/l,d.z/l)}}
 else if(PL.car&&VIEW.tp){camera.getWorldDirection(d);const cp=camera.position,yT=PL.car.gy+1.05;let tgt;if(d.y<-.01){const t=(yT-cp.y)/d.y;tgt=cp.clone().addScaledVector(d,Math.min(t,90))}else tgt=cp.clone().addScaledVector(d,90);
  o.set(src.x,by,src.z);d.copy(tgt).sub(o).normalize();o.addScaledVector(d,PL.car.t.R*.9)}
 else{camera.getWorldDirection(d);o.copy(camera.position);o.addScaledVector(d,PL.car?(VIEW.tp?7:2.5):(VIEW.tp?4:.4));if(!PL.car){PL.yaw=Math.atan2(-d.x,-d.z)}}
 if(PL.car&&camMode==='fps')LOOK.t=0;
 if(W.spread){const spread=W.spread*(1-.20*ammoUpgrade(GUN.w,'focus'));d.x+=(Math.random()-.5)*spread*2;d.y+=(Math.random()-.5)*spread;d.z+=(Math.random()-.5)*spread*2;d.normalize()}
 if(GUN.w==='flame'){fireFlame(src,by,d);return}
 if(GUN.w==='grenade'){throwGrenade(d);GUN.firing=false;return}
 if(GUN.w==='remote'){remotePlant(d);GUN.firing=false;return}
 if(GUN.w==='rpg'){const s0=PL.car?o.clone().addScaledVector(d,1):(camMode==='top'?new THREE.Vector3(src.x+d.x*1.2,by+.2,src.z+d.z*1.2):o.clone().addScaledVector(d,.8));fireRocket(s0,d);return}
 const h=rayHit(o,d,d.y>.12?260:105,PL.car||netRideCar(),null);if(h.air){aircraftDamage(h.air,W.dmg*(1+.10*ammoUpgrade(GUN.w,'damage')),h.pt);tracer(o,h.pt);gunSound(1,1,GUN.w);return}try{empGoodsHit(h.pt,GUN.w==='magnum'?3:1)}catch(e){}gasShot(h.pt,GUN.w);labTankPoke(h.pt,.4,h.ped);if(PL.inside==='shop'&&SHOP.cashier)SHOP.rob=Math.max(SHOP.rob,2.6);const mz=new THREE.Vector3(src.x+d.x*1,by,src.z+d.z*1);
 let tr0=camMode==='top'?mz:o;if(PL.car){const c=PL.car,ca=Math.cos(c.a),sa=Math.sin(c.a),side=(-sa*d.x+ca*d.z)>=0?1:-1;tr0=new THREE.Vector3(c.x-sa*side*(c.t.W/2+.15)+d.x*.6,c.gy+1.15,c.z+ca*side*(c.t.W/2+.15)+d.z*.6);emit(tr0.x,tr0.y,tr0.z,d.x*3,.4,d.z*3,.08,.6,.1,0xffd070,true,1)}
 tracer(tr0,h.pt);emit(mz.x,mz.y,mz.z,d.x*3,.5,d.z*3,.08,.6,.1,0xffd070,true,1);for(let i=0;i<5;i++)emit(h.pt.x,h.pt.y,h.pt.z,(Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4,.25,.2,.05,0xffc060,true,1);
 gunSound(GUN.w==='smg'?.7:GUN.w==='magnum'?1.25:1,GUN.w==='smg'?1.15:GUN.w==='magnum'?.82:1,GUN.w);
 if(h.ped&&h.ped.state!=='dead')bloodHit(h.pt.x,Math.max(.6,h.pt.y),h.pt.z,d);
 if(h.car&&h.car.net){if(h.car!==netRideCar())netHit(h.car.net,W.dmg*(1+.10*ammoUpgrade(GUN.w,'damage')),true,GUN.w)}
 else if(h.car){const c=h.car;if(c.mode==='rail')toPhys(c);if(c.type==='moto'&&c!==PL.car&&c.hasRider!==false&&(c.ai||c.chase))motoThrow(c,d);c.hp-=W.dmg*(1+.10*ammoUpgrade(GUN.w,'damage'));c.sleep=false;if(c.hp<=0&&c.alive)setOnFire(c);if(policeTrafficCar(c))startWanted();if(c.ai)c.ai.stun=.8}
 if(h.ped&&h.ped.state!=='dead'&&h.ped.net){const q=h.ped,head=h.pt.y-((q.gy||0)+(q.jy||0))>1.42;if(head)toast('TIRO NA CABEÇA');netHitPed(q,head||GUN.w==='magnum'?100:20*(1+.10*ammoUpgrade(GUN.w,'damage')),GUN.w)}
 else if(h.ped&&h.ped.state!=='dead'){const q=h.ped,head=h.pt.y-((q.gy||0)+(q.jy||0))>1.42&&q.state!=='down'&&q.state!=='lie',dmg=head||GUN.w==='magnum'?(q.tommy!==undefined?3:99):.61*(1+.10*ammoUpgrade(GUN.w,'damage'));if(q.hp===undefined)q.hp=3;q.hp-=dmg;if(q.cop)startWanted();
  if(head)toast('TIRO NA CABEÇA');if(q.hp<=0){killPed(q);registerKill(q,true)}else if(!q.cop&&!q.demo&&!q.gang&&!q.balcony&&q.tommy===undefined){const dx=q.x-src.x,dz=q.z-src.z,l=Math.hypot(dx,dz)||1;q.strip=null;q.fixed=false;q.state='flee';q.timer=5+R2()*3;q.vx=dx/l*4.8;q.vz=dz/l*4.8;q.rot=0;dropUmbrella(q);ouch(q.x,q.z,q.pitch);if(Math.random()<.45)say(q,SAY.hurt,2)}}
 if(!POL.wanted&&copSees(src.x,src.z))startWanted()}
const rockets=[];const RKT={geo:new THREE.CylinderGeometry(.09,.09,.7,8),mat:new THREE.MeshStandardMaterial({color:0x5a6a3a,emissive:0x331100})};
function fireFlame(src,y,d){
 const o=new THREE.Vector3(src.x,y+(PL.jy||0),src.z),h=rayHit(o,d,8,null,null),reach=o.distanceTo(h.pt);if(src===PL)labTankPoke(h.pt,.4,h.ped);
 for(let i=0;i<14;i++){
  const t=Math.min(reach,.35+(i+.4)*reach/14),w=.08+t*.052;
  emit(o.x+d.x*t+(Math.random()-.5)*w,o.y+d.y*t+(Math.random()-.5)*w,o.z+d.z*t+(Math.random()-.5)*w,
   d.x*2,1+t*.1,d.z*2,.16+t*.012,.8,.18+t*.048,i%3?0xff7b24:0xffdc56,true,.86);
 }
 const p=h.ped;
 if(p&&p.net){if(src===PL)netHitPed(p,5,'flame')}
 else if(p&&p.state!=='dead'&&p.state!=='inside'&&!p.inCar&&!p.hidden){
  p.hp??=3;
  if(!p.flameBurn){
   p.flameBurn={max:Math.max(3,p.hp),fx:0,tint:p.sp.userData.actorTint?.clone()};
   if(p.state==='bskate')knockPedDown(p,d.x,d.z);
  }
  p.hp=Math.max(0,p.hp-.18);
  if(p.cop)startWanted();
 }
 if(h.car?.alive){h.car.hp-=WPN.flame.dmg;h.car.sleep=false;if(h.car.hp<=0){h.car.fireByPlayer=true;setOnFire(h.car)}if(policeTrafficCar(h.car))startWanted()}
 if(!POL.wanted&&copSees(src.x,src.z))startWanted();
}
function clearBurnBar(p){
 if(!p.flameBurn?.bar)return;
 for(const sprite of p.flameBurn.bar)scene.remove(sprite);
 p.flameBurn.bar=null;
}
let burnBarMaterials;
function pedBurnTick(p,dt){
 const burn=p.flameBurn;
 if(p.state==='dead'){clearBurnBar(p);return}
 p.hp=Math.max(0,p.hp-dt*1.2);
 const life=clamp(p.hp/burn.max,0,1),tint=p.sp.userData.actorTint;
 if(tint&&burn.tint)tint.copy(burn.tint).multiplyScalar(.16+.84*life);
 if(p.hp===0){clearBurnBar(p);killPed(p);registerKill(p,true);return}
 if(!burn.bar){
  burnBarMaterials??=[0x241923,0xff6943].map(color=>new THREE.SpriteMaterial({color,depthWrite:false}));
  burn.bar=burnBarMaterials.map((material,i)=>{const sp=new THREE.Sprite(material);sp.renderOrder=i;scene.add(sp);return sp});
 }
 const [back,fill]=burn.bar,y=p.gy+(p.jy||0)+2.12;
 back.position.set(p.x,y,p.z);back.scale.set(.84,.105,1);
 fill.position.copy(back.position);fill.scale.set(.77*life,.065,1);
 const right=camera.matrixWorld.elements;fill.position.x-=right[0]*.385*(1-life);fill.position.y-=right[1]*.385*(1-life);fill.position.z-=right[2]*.385*(1-life);
 burn.fx-=dt;
 if(burn.fx<=0){burn.fx=.09;emit(p.x+(Math.random()-.5)*.65,p.gy+.65+Math.random()*.75,p.z+(Math.random()-.5)*.65,0,1.4,0,.25,.75,.28,0xff7421,true,.8)}
}
function fireRocket(o,d){const m=new THREE.Mesh(RKT.geo,RKT.mat);m.position.copy(o);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);scene.add(m);rockets.push({p:o.clone(),d:d.clone(),m,life:6.3,ign:PL.car});
 emit(o.x,o.y,o.z,-d.x*4,.5,-d.z*4,.25,1.6,.4,0xffa040,true,1);for(let i=0;i<6;i++)emit(o.x,o.y,o.z,-d.x*3+(Math.random()-.5)*2,Math.random(),-d.z*3+(Math.random()-.5)*2,1.2,.8,2.4,0x9a9690,false,.5);
 if(AC){const t=AC.currentTime,s=AC.createBufferSource();s.buffer=AC._noise;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(600,t);f.frequency.exponentialRampToValueAtTime(2400,t+.5);const g=AC.createGain();g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.75)}
 if(!POL.wanted&&copSees(o.x,o.z))startWanted()}
function updateRockets(dt){for(const r of rockets.slice()){const step=46*dt;r.life-=dt;const h=rayHit(r.p,r.d,step+.3,r.ign,null);const hd=h.pt.distanceTo(r.p);
  if(Math.random()<.9){emit(r.p.x-r.d.x*.4,r.p.y,r.p.z-r.d.z*.4,(Math.random()-.5)*.6,.3,(Math.random()-.5)*.6,.18,.9,.2,Math.random()<.5?0xff8a1a:0xffd050,true,1);emit(r.p.x-r.d.x*.6,r.p.y,r.p.z-r.d.z*.6,(Math.random()-.5)*.5,.6,(Math.random()-.5)*.5,1.4,.5,2.2,0x8a8682,false,.45)}
  if(h.air||h.car||h.ped||hd<step+.25||r.life<=0){const pt=h.air||h.car||h.ped||hd<step+.25?h.pt:r.p;scene.remove(r.m);rockets.splice(rockets.indexOf(r),1);
   if(h.air){aircraftDamage(h.air,160,pt);if(h.air.owner.hp>0)airBurst(pt.x,pt.y,pt.z)}
   else if(h.car&&h.car.alive){const c=h.car;if(policeTrafficCar(c))startWanted();setOnFire(c);c.fuse=0;explode(c,true,true)}
   else if(h.wall&&pt.y>5)airBurst(pt.x,pt.y,pt.z); // explosao na fachada ALTA, nao no chao
   else blastAt(pt.x,pt.z,h.car||null,true,true);continue}
  r.p.addScaledVector(r.d,step);r.m.position.copy(r.p)}}
/* A mesma fuga usada por panicTick (arma à mostra) serve para a granada.
   O ponto de ameaça pode ser o jogador ou uma granada, sem criar outra IA. */
function panicPedFlee(q,x,z,fromGrenade=false){
 let dx=q.x-x,dz=q.z-z,l=Math.hypot(dx,dz);
 if(l<.01){const a=R2()*Math.PI*2;dx=Math.cos(a);dz=Math.sin(a);l=1}
 q.strip=null;q.state='flee';q.timer=4+R2()*3;
 q.vx=dx/l*4.8;q.vz=dz/l*4.8;q.rot=0;
 try{dropUmbrella(q)}catch(e){}
 if(Math.random()<.35)say(q,fromGrenade?['GRANADA!','CORRE!','VAI EXPLODIR!']:SAY.armed,2.2);
}
/* GRANADA: inventário/tiro/soco e explosão existentes; somente voo, espera
   e alarme de fuga durante o voo/no chão são exclusivos deste projétil. */
const grenades=[];
const GRN_GRAVITY=21,GRN_FUSE=5,GRN_PANIC_RADIUS=18;
let grenadePanicSeq=0;
function grenadeScarePeds(g){
 const r2=GRN_PANIC_RADIUS*GRN_PANIC_RADIUS;
 for(const q of peds){
  // Mesmas exclusões da reação à arma: preservar polícia, NPCs fixos e cenas.
  if(q.cop||q.fixed||q.mate||q.state==='dead'||q.state==='down'||q.state==='lie'||q.corpse||q._grenadePanicId===g.panicId)continue;
  const dx=q.x-g.p.x,dz=q.z-g.p.z;
  if(dx*dx+dz*dz>r2)continue;
  q._grenadePanicId=g.panicId;
  // Prioridade da granada mesmo que o pedestre já esteja fugindo do jogador.
  panicPedFlee(q,g.p.x,g.p.z,true);
 }
}
function throwGrenade(d){const l=Math.hypot(d.x,d.z)||1,nx=d.x/l,nz=d.z/l;
 const o=new THREE.Vector3(PL.x+nx*.85,PL.gy+(PL.jy||0)+1.22,PL.z+nz*.85);
 const m=grenadeMesh();m.position.copy(o);scene.add(m);
 grenades.push({m,p:o,v:new THREE.Vector3(nx*18,8.7+clamp(d.y,-.6,.6)*4,nz*18),landed:false,fuse:GRN_FUSE,panicId:++grenadePanicSeq,panicScan:0});
 MELEE.t=.22;MELEE.cd=Math.max(MELEE.cd,.3);MELEE.d=[nx,nz];swingSnd();
 if(camMode==='top')PL.face=[nx,nz];
}
function updateGrenades(dt){for(let i=grenades.length-1;i>=0;i--){const g=grenades[i];
 if(!g.landed){g.v.y-=GRN_GRAVITY*dt;
  const next=g.p.clone().addScaledVector(g.v,dt),surface=pickupSurfaceY(next.x,next.z);
  let touch=next.y<=surface+.22;
  if(!touch){const delta=next.clone().sub(g.p),distance=delta.length();
   if(distance>.44){const h=rayHit(g.p,delta.multiplyScalar(1/distance),distance,null,null);
    if(h.car||h.ped||h.pt.distanceTo(g.p)<distance-.16){next.x=h.pt.x;next.z=h.pt.z;touch=true}}}
  if(touch){g.landed=true;g.p.set(next.x,pickupSurfaceY(next.x,next.z)+.22,next.z);g.m.rotation.set(Math.PI/2,0,0)}
  else{g.p.copy(next);g.m.rotation.x+=dt*10;g.m.rotation.z+=dt*7}
  g.m.position.copy(g.p);
 }else if((g.fuse-=dt)<=0){scene.remove(g.m);grenades.splice(i,1);blastAt(g.p.x,g.p.z,null,true,true);continue}
 // Verificação leve (~3 vezes/s), desde o arremesso até a explosão.
 // A reação vem da posição atual da granada, não da posição do jogador.
 if((g.panicScan-=dt)<=0){g.panicScan=.3;grenadeScarePeds(g)}
}}

/* BOMBA PROGRAMADA: plantio em parede (colisor de edifício) ou chão, e
   detonação pela Agenda. Emprega a explosão blastAt da bazuca/granada.
   Os pacotes não são persistidos: mudando de mundo eles desaparecem. */
const REMOTE={list:[],queue:[],delay:0};
function remoteWorldKey(){return S.seed+':'+S.style+':'+S.size+':'+(city.worldNo||0)}
function remotePlaceTarget(d){
 const mag=Math.hypot(d.x,d.z),nx=mag>.001?d.x/mag:(PL.face?.[0]||1),nz=mag>.001?d.z/mag:(PL.face?.[1]||0);
 const py=PL.gy+(PL.jy||0)+1.12;
 // A detecção de parede usa a grade de colisão existente, sem raycasts de malhas.
 for(let dist=.65;dist<=3.2;dist+=.12){
  const x=PL.x+nx*dist,z=PL.z+nz*dist;
  for(const b of query(x,z,.03)){
   if(b.dead||b.kind!=='bld'||x<b.x0||x>b.x1||z<b.z0||z>b.z1)continue;
   const edges=[{v:Math.abs(x-b.x0),x:b.x0-.075,z,nx:-1,nz:0},
                {v:Math.abs(x-b.x1),x:b.x1+.075,z,nx:1,nz:0},
                {v:Math.abs(z-b.z0),x,z:b.z0-.075,nx:0,nz:-1},
                {v:Math.abs(z-b.z1),x,z:b.z1+.075,nx:0,nz:1}];
   edges.sort((a,b)=>a.v-b.v);
   const f=edges[0];return{x:f.x,y:py,z:f.z,rotY:Math.atan2(f.nx,f.nz),wall:true};
  }
 }
 // Sem parede nas proximidades do personagem, deixar o pacote no piso.
 const x=PL.x+nx*1.35,z=PL.z+nz*1.35;
 return{x,y:pickupSurfaceY(x,z)+.075,z,rotY:Math.atan2(nx,nz),wall:false};
}
function remotePlant(d){
 const p=remotePlaceTarget(d),m=remoteMesh(),i=REMOTE.list.length;
 const led=m.children[3];led.material=REMOTE_VIS.red.clone();led.userData.shared=false;
 // Pequena diferença lateral permite ver vários pacotes plantados juntos.
 const shift=((i%5)-2)*.055;
 if(p.wall){m.rotation.y=p.rotY;p.x+=Math.cos(p.rotY)*shift;p.z-=Math.sin(p.rotY)*shift}
 else{m.rotation.set(-Math.PI/2,p.rotY,0);p.x+=Math.cos(p.rotY)*shift;p.z-=Math.sin(p.rotY)*shift}
 m.position.set(p.x,p.y,p.z);scene.add(m);
 REMOTE.list.push({m,led,x:p.x,y:p.y,z:p.z,world:remoteWorldKey(),queued:false,phase:i*.71});
 const mag=Math.hypot(d.x,d.z)||1;MELEE.t=.22;MELEE.cd=Math.max(MELEE.cd,.3);MELEE.d=[d.x/mag,d.z/mag];swingSnd();
 if(camMode==='top')PL.face=MELEE.d.slice();
 toast(p.wall?'BOMBA FIXADA NA PAREDE':'BOMBA PLANTADA NO CHÃO');
}
function remoteRemove(b){
 if(!b)return;
 scene.remove(b.m);if(b.led&&b.led.material)b.led.material.dispose();
 const i=REMOTE.list.indexOf(b);if(i>=0)REMOTE.list.splice(i,1);
 // Se a Agenda estiver aberta, o contato desaparece após a última bomba.
 if(PHONE.open&&PHONE.scr==='agenda')PHONE.si=clamp(PHONE.si,0,phoneContacts().length-1);
}
function remoteStart(){
 if(!REMOTE.list.length){toast('NENHUMA BOMBA PLANTADA');return false}
 if(REMOTE.queue.length){toast('BOMBAS REMOTAS · SEQUÊNCIA EM ANDAMENTO');return false}
 const pending=REMOTE.list.filter(b=>!b.queued);
 if(!pending.length){toast('BOMBAS REMOTAS · SEQUÊNCIA EM ANDAMENTO');return false}
 for(const b of pending)b.queued=true;
 REMOTE.queue=pending;REMOTE.delay=0;
 toast('BOMBA REMOTA · '+pending.length+' CARGA'+(pending.length===1?'':'S')+' · INTERVALO DE 1 s');
 remoteTick(0);return true;
}
function remoteTick(dt){
 // LED pulsante sem PointLight adicional (até 30 bombas sem custo de iluminação).
 for(const b of REMOTE.list){if(!b.led)continue;const on=Math.sin(simT*11+b.phase)>0;
  b.led.material.emissiveIntensity=on?2.1:.10;
  b.led.material.color.setHex(on?0xff4740:0x581015);
 }
 if(!REMOTE.queue.length)return;
 REMOTE.delay-=dt;
 if(REMOTE.delay>1e-6)return;
 const b=REMOTE.queue.shift(),fp=PL.car||PL,limit=scene.fog?scene.fog.far:STYLES[S.style].fogFar;
 const ok=b.world===remoteWorldKey()&&Math.hypot(fp.x-b.x,fp.z-b.z)<=limit;
 remoteRemove(b);
 if(ok)blastAt(b.x,b.z,null,true,true); // bazuca + ignição de motos e carros
 // Fora da neblina ou em outra cidade: despawn silencioso, nunca detonável.
 if(!REMOTE.queue.length){REMOTE.delay=0;return}
 REMOTE.delay=1;
}
function clearRemoteBombs(){for(const b of REMOTE.list){scene.remove(b.m);if(b.led&&b.led.material)b.led.material.dispose()}REMOTE.list.length=0;REMOTE.queue.length=0;REMOTE.delay=0}

function clearGrenades(){for(const g of grenades)scene.remove(g.m);grenades.length=0}
function clearRockets(){for(const r of rockets)scene.remove(r.m);rockets.length=0;clearGrenades();clearRemoteBombs()}
/* --- blood --- */
const bloodTex=(()=>{const c=cv(64,64),g=c.getContext('2d');const rnd=mulberry32(77);for(let i=0;i<14;i++){const x=32+(rnd()-.5)*30,y=32+(rnd()-.5)*30,r=4+rnd()*12;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(110,4,6,.95)');gr.addColorStop(.7,'rgba(90,0,4,.85)');gr.addColorStop(1,'rgba(80,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
 const t=new THREE.CanvasTexture(c);return t})();
const DECALS=[];{const geo=new THREE.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);for(let i=0;i<70;i++){const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:bloodTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.visible=false;m.renderOrder=1;scene.add(m);DECALS.push({m,t:0})}}
let decI=0;function decal(x,z,size,grow,follow){const d=DECALS[decI=(decI+1)%DECALS.length];d.m.visible=true;d.m.position.set(x,groundY(x,z)+.035+decI*.0004,z);d.m.rotation.y=Math.random()*6.28;d.s=size*.25;d.s1=size;d.grow=grow;d.t=40;d.follow=follow||null;d.m.scale.setScalar(d.s);d.m.material.opacity=1;return d}
function updateDecals(dt){for(const d of DECALS){if(!d.m.visible)continue;d.t-=dt;if(d.s<d.s1){d.s=Math.min(d.s1,d.s+dt*d.grow);d.m.scale.setScalar(d.s)}
 if(d.follow){if(peds.includes(d.follow)&&Math.hypot(d.follow.vx,d.follow.vz)>.3)d.m.position.set(d.follow.x,d.follow.gy+.035,d.follow.z);else if(!peds.includes(d.follow))d.follow=null}
 if(d.t<4)d.m.material.opacity=Math.max(0,d.t/4);if(d.t<=0)d.m.visible=false}}
function clearDecals(){for(const d of DECALS)d.m.visible=false}
function bloodHit(x,y,z,d){for(let i=0;i<9;i++)emit(x,y,z,(d?d.x*2.5:0)+(Math.random()-.5)*3,Math.random()*2.5,(d?d.z*2.5:0)+(Math.random()-.5)*3,.45+Math.random()*.3,.32,.12,Math.random()<.5?0x8a0408:0xb01010,false,.95);
 decal(x+(d?d.x*1.2:0)+(Math.random()-.5),z+(d?d.z*1.2:0)+(Math.random()-.5),.7+Math.random()*.6,6)}
// v270: estampidos procedurais secos, com ataque curto e corpo grave por arma.
// kind é opcional; NPCs continuam com perfil genérico sem mudar sua IA de combate.
const SHOT_TIMBRE={pistol:{len:.135,lp:7000,lo:470,punch:165,bass:.34,noise:.53},smg:{len:.080,lp:6100,lo:700,punch:175,bass:.19,noise:.37},magnum:{len:.195,lp:8500,lo:320,punch:122,bass:.76,noise:.72},rpg:{len:.24,lp:4300,lo:220,punch:105,bass:.82,noise:.60},default:{len:.13,lp:6200,lo:430,punch:155,bass:.36,noise:.48}};
// v284: transientes pré-sintetizados e compartilhados; nenhuma convolução por disparo.
const SHOT_BANK=new Map(),SHOT_ACTIVE=[];
function shotBuffer(kind,variant){
 const key=kind+':'+variant;if(SHOT_BANK.has(key))return SHOT_BANK.get(key);
 const P=SHOT_TIMBRE[kind]||SHOT_TIMBRE.default,len=P.len+.12;
 const buf=AC.createBuffer(1,Math.ceil(AC.sampleRate*len),AC.sampleRate),d=buf.getChannelData(0);
 let low=0,air=0,phase=0,seed=7919+variant*997+Math.round(P.punch*31);
 for(let i=0;i<d.length;i++){
  const t=i/AC.sampleRate;seed=(Math.imul(seed,1664525)+1013904223)|0;
  const noise=(seed>>>0)/2147483648-1;
  const cutoff=P.lo+(P.lp-P.lo)*Math.exp(-t/(P.len*.22));
  low+=(noise-low)*(1-Math.exp(-2*Math.PI*cutoff/AC.sampleRate));
  air+=(noise-air)*.13;
  phase+=2*Math.PI*(38+(P.punch-38)*Math.exp(-t/.025))/AC.sampleRate;
  const attack=Math.min(1,t/.0007),crack=Math.exp(-t/(kind==='smg'?.012:.021));
  const body=Math.sin(phase)*P.bass*Math.exp(-t/(P.len*.25));
  const tail=air*.13*Math.exp(-t/(P.len*.65));
  d[i]=Math.tanh((low*P.noise*Math.exp(-t/(P.len*.18))+(noise-air)*.24*crack+body+tail)*1.5)*attack*.78;
 }
 SHOT_BANK.set(key,buf);return buf;
}
function gunSound(vol=1,pitch=1,kind='default'){
 if(!AC||!AC._noise||!S.sound)return;
 const t=AC.currentTime,cap=MOB_LITE?10:18;
 while(SHOT_ACTIVE.length>=cap){const old=SHOT_ACTIVE.shift();try{old.stop()}catch(e){}}
 const source=AC.createBufferSource(),g=AC.createGain();
 source.buffer=shotBuffer(kind,Math.floor(Math.random()*3));
 source.playbackRate.value=clamp(pitch,.5,2)*soundVary(1,.035);
 g.gain.value=clamp(vol,0,1.4);source.connect(g);g.connect(master);
 SHOT_ACTIVE.push(source);source.onended=()=>{source.disconnect();g.disconnect();const i=SHOT_ACTIVE.indexOf(source);if(i>=0)SHOT_ACTIVE.splice(i,1)};
 source.start(t);
}

function dropRoadCash(p){if(p.roadLoot)return;p.roadLoot=true;const amount=p.prof&&p.prof.loot?p.prof.loot:Math.floor(Math.random()*21);if(!amount)return;const k=chunkOf(p.x,p.z),ch=city.chunks.get(k[0]+','+k[1]);if(!ch)return;const drop=makePickup('road-'+(++roadLootId),p.x,p.z,amount,ch,'cash');drop.roadCash=true;drop.ttl=60;(p.dropPk||(p.dropPk=[])).push(drop)}
let roadLootId=0;
/* v4 r19 · ESPÓLIO: quem morre com arma na mão larga a arma (com munição) do lado do corpo, mais o dinheiro que tiver.
   Vale para todo NPC armado: polícia, gangues, capangas de missão (q.wpn de arma), ped que reage a assalto ou atira (já passou pelo c3Fire).
   Os coletáveis ficam presos ao corpo (p.dropPk): somem quando o corpo some (removePed), e o corpo de quem largou algo fica 25 s no chão.
   Gerador: Math.random (não mexe na seed). No online cada cliente tem os próprios NPCs, então o espólio deles é local. */
const NPCDROP={n:0};
function pedArmedW(p){if(!p||p.net||p.demo||p.main||p.tommy!==undefined||p.medPatient)return null;const w=p.wpn;if(w==='bat'||w==='fist')return null;if(w&&WPN[w]&&w!=='jammer')return w;if(p.cop||p.c3aim)return 'pistol';return null}
function pedDropAt(p,x,z,am,kind,ch){const d=makePickup('npcd-'+(++roadLootId),x,z,am,ch,kind);d.roadCash=kind==='cash';d.npcDrop=true;d.ttl=90;(p.dropPk||(p.dropPk=[])).push(d);NPCDROP.n++;
 if(roomStageKind()){const y=PL.gy||0;d.y0=y+1.1;d.g.position.y=d.y0;if(d.glow)d.glow.position.y=y+.075}return d}
function pedDeathDrop(p){if(!p||p.wDropDone||p.net)return;p.wDropDone=true;const w=pedArmedW(p);let gave=false;
 const k=chunkOf(p.x,p.z),ch=(city.chunks&&city.chunks.get(k[0]+','+k[1]))||{pickups:[]};const a=Math.random()*6.283;
 if(w){const r=Math.random(),am=w==='smg'?30+(r*31|0):w==='magnum'?6+(r*7|0):(w==='rpg'||w==='grenade'||w==='remote')?1+(r*2|0):w==='flame'?40+(r*41|0):12+(r*13|0);
  try{pedDropAt(p,p.x+Math.cos(a)*.9,p.z+Math.sin(a)*.9,am,w==='pistol'?'gun':w,ch);gave=true}catch(e){console.error(e)}
  if(p.c3aim)p.c3aim.t=0}
 if(!w&&p.wpn==='bat'&&!p.net){try{pedDropAt(p,p.x+Math.cos(a)*.9,p.z+Math.sin(a)*.9,1,'bat',ch);gave=true}catch(e){console.error(e)}} /* v4 r29: gangue de bastão larga o taco */
 if(p.gang&&!p.roadLoot){p.roadLoot=true;const m=10+(Math.random()*51|0);try{pedDropAt(p,p.x-Math.cos(a)*.8,p.z-Math.sin(a)*.8,m,'cash',ch);gave=true}catch(e){console.error(e)}}
 if((gave||(p.dropPk&&p.dropPk.length))&&p.state==='dead')p.timer=Math.max(p.timer||0,25)}
function pedDropsClear(p){const l=p.dropPk;if(!l)return;p.dropPk=null;for(const d of l)if(pickups.includes(d))removePickup(d)}
function npcDropTick(dt){if(!NPCDROP.n)return;let n=0;for(let i=pickups.length-1;i>=0;i--){const d=pickups[i];if(!d||!d.npcDrop)continue;if(!d.roadCash&&(d.ttl-=dt)<=0){removePickup(d);continue}n++}NPCDROP.n=n}
function killPed(p){if(p.net){netHitPed(p,100,'x');return}if(p.state==='dead')return;if(p.tommy===undefined&&!p.demo&&!p.gang)dropRoadCash(p);if(p.tommy!==undefined)tommyDefeat(p);if(p.clubType){p.jy=0;p.jv=0}p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;ouch(p.x,p.z,p.pitch);p.state='dead';p.timer=9;p.rot=(R2()<.5?1:-1)*Math.PI/2;try{pedDeathDrop(p)}catch(e){console.error(e)}
 if(p.cop&&p.car&&p.car.copsOut){p.car.copsOut=p.car.copsOut.filter(q=>q!==p)}}
/* v4 r7: TOM DE PELE CONTÍNUO dos NPCs (pedestres, praia, policiais): t 0 = pele clara de antes … 1 = negra retinta.
   skinTone(t) interpola numa rampa de tons naturais (claros, morenos, pardos, marrons, retintos). Os peds continuam
   num pool fixo de roupas (atlas 2D / 2.5D compartilhados, sem textura por ped): cada roupa do pool ganha um t diferente,
   espalhado na faixa toda, e o policial tem COP_PALS (5 tons) sorteados a cada spawn por copPal(). */
const SKIN_RAMP=['#ffdbac','#f1c27d','#e0ac69','#c68642','#a86b3c','#8d5524','#6e4127','#52301d','#3b2218'];
function skinTone(t){t=Math.max(0,Math.min(1,t))*(SKIN_RAMP.length-1);const i=Math.min(SKIN_RAMP.length-2,Math.floor(t)),f=t-i,a=parseInt(SKIN_RAMP[i].slice(1),16),b=parseInt(SKIN_RAMP[i+1].slice(1),16);
 let o='#';for(const sh of [16,8,0]){const x=Math.round(((a>>sh)&255)*(1-f)+((b>>sh)&255)*f);o+=x.toString(16).padStart(2,'0')}return o}
/* t espalhado: n valores, um por faixa de largura 1/n, embaralhados (Math.random: não mexe na seed da cidade) */
function skinSpread(n){const a=[];for(let i=0;i<n;i++)a.push((i+Math.random())/n);for(let i=n-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
/* --- cops on foot --- */
const COP_PALS=skinSpread(5).map(t=>({cap:'#1a2a5a',capDark:'#0e1630',skin:skinTone(t),hair:t>.5?'#141010':'#2a1a10',shirt:'#2a4a8a',pants:'#1a2440',shoes:'#111',belt:'#111',stripe:'#d8d8d8'}));
const COP_PAL=COP_PALS[0]; /* referência (guarda da campanha usa de base); spawn de policial usa copPal() */
function copPal(){return COP_PALS[Math.floor(Math.random()*COP_PALS.length)]}
function deployCops(c,bail=false){
 const out=c.copsOut||(c.copsOut=[]);
 const seats=c.copsAboard??(c.playerStolen||PL.car===c?0:2);
 const ca=Math.cos(c.a),sa=Math.sin(c.a);
 c.copsAboard=seats;
 for(let k=0;k<seats;k++){
  const side=k?-1:1,d=c.t.W/2+.9;
  const p=spawnPed(null,{x:c.x-sa*side*d,z:c.z+ca*side*d,vx:0,vz:0,pal:copPal()});
  if(!p)continue;
  Object.assign(p,{cop:true,fixed:true,state:'cop',hp:3,car:c,bail,bailT:0,shootT:.9+R2()*.6});
  c.copsAboard--;out.push(p);
 }
}
// Entradas do shopping por andar (mesmos pontos de chegada do jogador).
function mallCopSpot(lvl){return lvl?{x:MALL.U.x+MALL_V+1.6,z:MALL.U.z+2.4}:{x:MALL.G.x-mallEntryL()+2.5,z:MALL.G.z}}
function mallCopEnter(p,lvl){const s=mallCopSpot(lvl);p.x=s.x;p.z=s.z;p.vx=p.vz=0;p.mallCop=true;p.lvl=lvl;p.followT=0;if(p.car&&p.car.copsOut)p.car.copsOut=p.car.copsOut.filter(q=>q!==p);p.car=null}
function updateMallCop(p,dt){
 if(!POL.wanted||PL.dead||PL.inside!=='mall'){removePed(p);return}
 if(p.lvl!==MALL.lvl){p.vx=p.vz=0;return}
 const dx=PL.x-p.x,dz=PL.z-p.z,d=Math.hypot(dx,dz)||1;p.mx=dx/d;p.mz=dz/d;
 if(d>1.6){p.vx=dx/d*3.6;p.vz=dz/d*3.6}else p.vx=p.vz=0;
 p.x+=p.vx*dt;p.z+=p.vz*dt;circleVsWorld(p,.35)}
/* v1r20: viatura pegou fogo → os policiais saltam, se afastam do fogo e, com procurado ativo, perseguem a pé atirando no jogador */
function copBail(c){
 if(c.bailed)return;
 c.bailed=true;
 c.copsOut=(c.copsOut||[]).filter(p=>peds.includes(p)&&p.state!=='dead');
 for(const p of c.copsOut){p.bail=true;p.bailT=0}
 deployCops(c,true);
 if(c.copsOut[0])say(c.copsOut[0],POL.wanted?'PARADO AÍ!':'FOGO! SAI DO CARRO!',2.2);
}
function updateCopBail(p,dt){const c=p.car,dx=PL.x-p.x,dz=PL.z-p.z,d=Math.hypot(dx,dz)||1;p.bailT=(p.bailT||0)+dt;
 if(d>90||(!POL.wanted&&p.bailT>25&&d>30)){removePed(p);if(c&&c.copsOut)c.copsOut=c.copsOut.filter(q=>q!==p);return}
 if(p.bailT<.75&&c){const ax=p.x-c.x,az=p.z-c.z,ad=Math.hypot(ax,az)||1;p.vx=ax/ad*5.5;p.vz=az/ad*5.5;p.mx=ax/ad;p.mz=az/ad}
 else if(POL.wanted&&!PL.dead){const run=d>7;p.vx=run?dx/d*4.6:0;p.vz=run?dz/d*4.6:0;p.mx=dx/d;p.mz=dz/d;
  if(!PL.inside){p.shootT-=dt;if(p.shootT<=0&&d<32){p.shootT=.9+Math.random()*.7;copShoot(p)}}}
 else{p.vx=p.vz=0;p.mx=dx/d;p.mz=dz/d}
 p.x+=p.vx*dt;p.z+=p.vz*dt;circleVsWorld(p,.35)}
function updateCop(p,dt){if(p.mallCop){updateMallCop(p,dt);return}if(p.bail){updateCopBail(p,dt);return}const c=p.car;
 // v78k: se o jogador roubou a viatura DESTE policial, ele não "embarca" de volta (antes sumia dentro dela e, quando o
 // jogador descia, a IA da polícia voltava a dirigir o carro roubado). Fica a pé, persegue e atira; some de longe/sem procura.
 if(c&&c===PL.car)c.playerStolen=true;
 if(c&&c.playerStolen){const dx=PL.x-p.x,dz=PL.z-p.z,d=Math.hypot(dx,dz)||1;
  if(!POL.wanted||PL.dead||d>70){removePed(p);if(c.copsOut)c.copsOut=c.copsOut.filter(q=>q!==p);return}
  const run=d>6;p.vx=run?dx/d*4.2:0;p.vz=run?dz/d*4.2:0;p.mx=dx/d;p.mz=dz/d;p.x+=p.vx*dt;p.z+=p.vz*dt;circleVsWorld(p,.35);
  if(PL.inside!=='mall'){p.shootT-=dt;if(p.shootT<=0&&d<30){p.shootT=1+R2()*.8;copShoot(p)}}return}
 const back=PL.car||!POL.wanted||PL.dead||!c||!c.alive;
 let tx=PL.x,tz=PL.z,spd=3.4;
 if(!back&&PL.inside==='mall'&&MALL.out){tx=MALL.out.x;tz=MALL.out.z;spd=4.2;if(Math.hypot(tx-p.x,tz-p.z)<2.2){mallCopEnter(p,MALL.lvl);return}}
 if(back){if(!c||!c.alive){p.vx=p.vz=0;return}tx=c.x;tz=c.z;spd=6}
 const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz)||1;
 if(back&&d<2.4){c.copsAboard=Math.min(2,(c.copsAboard??0)+1);removePed(p);c.copsOut=c.copsOut.filter(q=>q!==p);return}
 if(back||d>9||PL.inside==='mall'){p.vx=dx/d*spd;p.vz=dz/d*spd;p.mx=dx/d;p.mz=dz/d}else{p.vx=p.vz=0;p.mx=dx/d;p.mz=dz/d}
 p.x+=p.vx*dt;p.z+=p.vz*dt;circleVsWorld(p,.35);
 if(!back&&PL.inside!=='mall'){p.shootT-=dt;if(p.shootT<=0&&d<30){p.shootT=1+R2()*.8;copShoot(p)}}}
function copShoot(p){const o=new THREE.Vector3(p.x,1.2,p.z);const err=R2()<POLHIT?0:2.4+Math.hypot(PL.x-p.x,PL.z-p.z)/10;
 const tx=PL.x+(R2()-.5)*err,tz=PL.z+(R2()-.5)*err;const d=new THREE.Vector3(tx-p.x,0,tz-p.z).normalize();
 const h=rayHit(o,d,40,p.car,p);tracer(o,h.pt,0xff9a7a);const dist=Math.hypot(p.x-PL.x,p.z-PL.z);gunSound(Math.max(.15,1-dist/60),.85);
 emit(o.x+d.x*.6,1.2,o.z+d.z*.6,0,.4,0,.08,.5,.1,0xffd070,true,1);
 if(h.player){PL.hp-=armorHit(6+Math.round(R2()*5));rumble(.3,.65,120);bloodHit(PL.x,1.2+(PL.jy||0),PL.z,d);if(PL.hp<=0)killPlayer('ABATIDO')}
 else if(h.car&&h.car!==p.car){h.car.hp-=5;if(h.car.hp<=0&&h.car.alive)setOnFire(h.car)}}
function drown(){if(maskSafe())return; /* v78: com a Maskara anda sobre a água */for(let i=0;i<20;i++)emit(PL.x,waterLevel(PL.x,PL.z)+.3,PL.z,(Math.random()-.5)*5,2+Math.random()*4,(Math.random()-.5)*5,.8,.5,.15,0xd8ecff,false,.9);killPlayer('AFOGADO')}

