'use strict';
/* Coastal Chaos · js/11-buildChunk.js — Outdoors/grafites + buildChunk (monta cada pedaço da cidade).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ===== v78 · OUTDOORS: 1 atlas com 16 anúncios fictícios (1024×512, blocos 256×128) e 1 material compartilhado
   que acende ao anoitecer (DN_SIGNS). Cada chunk junta suas placas numa malha só (ch.adMesh = 1 draw). ===== */
const ADS={tex:null,mat:null,N:16};
function adsAtlas(){if(ADS.mat)return ADS.mat;const W=1024,H=512,c=cv(W,H),g=c.getContext('2d');
 const P=mallPal(),VW=!!(city.st&&city.st.synth);
 const L=[ // [título, sub, fundo1, fundo2, cor do texto, enfeite]
  ['COLA SOL','gelada como o mar','#ff5a3a','#ffd36a','#fff','sun'],['KRFM 98.6','o som da costa','#1a1440','#ff3ec8','#2af0ff','wave'],
  ['MALIBU FLASH','dance até o sol nascer','#140a2a','#7f30ff','#ff8fd0','star'],['BANCO SUNSET','seu dinheiro na praia','#0e2a4a','#2a6ab0','#ffd36a','coin'],
  ["HANK'S DOGS",'o cachorro-quente nº 1','#d8202a','#f2c21a','#fff','dot'],['SURFMAX','pranchas & parafina','#0aa0c8','#2af0ff','#fff','wave'],
  ['MIRAGEM MOTEL','ar-condicionado e TV','#2a1a3a','#ff7ad8','#ffe8c0','star'],['SUNSET ROYALE','a sorte mora aqui','#120a08','#c9a03a','#ffd36a','coin'],
  ['iPIXEL','o celular da cidade','#f4f4f0','#cfd6dc','#1a1a20','dot'],['BURGÃO','o maior da orla','#2a1a10','#ff8a1a','#ffd36a','sun'],
  ['ÓCULOS RAYÔ','veja o verão','#ff3ec8','#ffd36a','#1a1440','sun'],['AERO SUNSET','voe para o paraíso','#2a6ab0','#9ad8ff','#fff','wave'],
  ['PROTETOR FPS 50','não vire camarão','#ffd36a','#ff8a5a','#d8202a','sun'],['CINEMA ORLA','estreia sexta','#0a0a14','#3a2a6a','#ffd36a','star'],
  ['TÁXI AMARELO','ligue 555-0101','#f2c21a','#ffe85a','#1a1a20','dot'],['VOTE NO PREFEITO','Sunset Shores pra frente','#f4f4f0','#2a8a3a','#1a3a2a','dot']];
 L.forEach((a,i)=>{const x=(i%4)*256,y=Math.floor(i/4)*128,gr=g.createLinearGradient(x,y,x+256,y+128);gr.addColorStop(0,a[2]);gr.addColorStop(1,a[3]);g.fillStyle=gr;g.fillRect(x,y,256,128);
  g.save();g.beginPath();g.rect(x,y,256,128);g.clip();
  if(a[5]==='sun'){g.fillStyle='rgba(255,240,180,.55)';g.beginPath();g.arc(x+210,y+100,46,0,7);g.fill()}
  else if(a[5]==='wave'){g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=5;for(let k=0;k<3;k++){g.beginPath();for(let u=0;u<=256;u+=8)g.lineTo(x+u,y+96+k*10+Math.sin(u*.06+k)*5);g.stroke()}}
  else if(a[5]==='star'){g.fillStyle='rgba(255,255,255,.6)';for(let k=0;k<14;k++)g.fillRect(x+((k*53)%250),y+((k*37)%120),3,3)}
  else if(a[5]==='coin'){g.fillStyle='rgba(255,215,90,.5)';for(let k=0;k<3;k++){g.beginPath();g.arc(x+200+k*14,y+92-k*8,14,0,7);g.fill()}}
  else {g.fillStyle='rgba(0,0,0,.12)';for(let k=0;k<6;k++)g.fillRect(x+k*44,y,22,128)}
  g.restore();g.textAlign='left';g.textBaseline='middle';g.fillStyle=a[4];fitFill(g,translatePlain(a[0]),x+14,y+50,228,40,'Fredoka, Arial Black, sans-serif');
  g.globalAlpha=.9;fitFill(g,translatePlain(a[1]),x+16,y+90,200,20,'Fredoka, Arial, sans-serif');g.globalAlpha=1;
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=4;g.strokeRect(x+2,y+2,252,124)});
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;ADS.tex=t;ADS.mat=dnSignMat(t,.55);ADS.mat.side=THREE.DoubleSide;ADS.mat.userData.cached=true;return ADS.mat}
/* r33 · PICHAÇÃO: atlas 8×4 (32 desenhos) feito uma vez em canvas — pichação reta de letras altas, throw-ups, tags e símbolos.
   Gerado com sorteio fixo (não usa R()). Material compartilhado (cached), decal a 4 cm da parede + polygonOffset (sem z-fight). */
const GRAF={tex:null,mat:null,N:32};
function grafAtlas(){if(GRAF.mat)return GRAF.mat;const T=128,c=cv(T*8,T*4),g=c.getContext('2d'),rnd=mulberry32(0x9a7f11);const rr2=(a,b)=>a+rnd()*(b-a),pk=a=>a[Math.floor(rnd()*a.length)];
 const INK=['#111114','#1a1a2a','#2a0a0a','#0e2a1a','#14141c'],POP=['#ff3e6a','#2af0ff','#ffd21a','#7dff6a','#ff8a1a','#c27aff','#ffffff','#ff5adc'],WORDS=['ZOIO','SSX','KRFM','NATE','CLR','VLT','HAZE','88','RIFT','LANG','ORLA','SUN'];
 const drip=(x,y,col,n)=>{g.strokeStyle=col;g.lineWidth=2;for(let k=0;k<n;k++){const dx=x+rr2(-20,20),L=rr2(6,26);g.beginPath();g.moveTo(dx,y);g.lineTo(dx,y+L);g.stroke();g.beginPath();g.arc(dx,y+L,1.8,0,7);g.fillStyle=col;g.fill()}};
 for(let i=0;i<GRAF.N;i++){const x=(i%8)*T,y=Math.floor(i/8)*T;g.save();g.beginPath();g.rect(x+2,y+2,T-4,T-4);g.clip();g.translate(x,y);g.lineCap='round';g.lineJoin='round';const kind=i%4;
  if(kind===0){/* pichação: letras altas e retas, em linha, com sublinhado */const col=pk(INK),n=3+Math.floor(rnd()*3),w=(T-20)/n;g.strokeStyle=col;g.lineWidth=rr2(6,9);
   for(let k=0;k<n;k++){const lx=10+k*w,top=rr2(18,32),bot=rr2(84,100);g.beginPath();g.moveTo(lx,bot);g.lineTo(lx,top);g.lineTo(lx+w*.7,top+rr2(-6,6));if(rnd()<.6)g.lineTo(lx+w*.7,bot*.75+top*.25);if(rnd()<.5){g.moveTo(lx,(top+bot)/2);g.lineTo(lx+w*.6,(top+bot)/2+rr2(-8,8))}if(rnd()<.5){g.moveTo(lx+w*.7,top);g.lineTo(lx+w*.75,bot)}g.stroke()}
   g.beginPath();g.moveTo(8,108);g.lineTo(T-10,104+rr2(-4,4));g.stroke();drip(T/2,100,col,3)}
  else if(kind===1){/* throw-up: letras gordas com contorno */const w=pk(WORDS).slice(0,4),fs=w.length>3?42:56;g.font='700 '+fs+'px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.textBaseline='middle';g.translate(T/2,T/2);g.rotate(rr2(-.18,.18));
   g.lineWidth=14;g.strokeStyle='#111';g.strokeText(w,0,0);g.lineWidth=7;g.strokeStyle=pk(POP);g.strokeText(w,0,0);g.fillStyle=pk(POP);g.fillText(w,0,0);g.setTransform(1,0,0,1,0,0);drip(x+T/2,y+T/2+22,'#111',2)}
  else if(kind===2){/* tag na fonte gótica / com escorrido */const w=pk(WORDS),f=rnd()<.5?"'Pirata One', Georgia, serif":"Creepster, Impact, fantasy";g.font=(w.length>3?52:68)+'px '+f;g.textAlign='center';g.textBaseline='middle';g.translate(T/2,T/2);g.rotate(rr2(-.25,.12));
   const col=rnd()<.6?pk(INK):pk(POP);g.fillStyle=col;g.fillText(w,0,0);g.lineWidth=3;g.strokeStyle=col;g.beginPath();g.moveTo(-44,26);g.quadraticCurveTo(0,40,48,22);g.stroke();g.setTransform(1,0,0,1,0,0);drip(x+T/2,y+T/2+18,col,2)}
  else{/* símbolo */const col=rnd()<.5?pk(INK):pk(POP),s=Math.floor(rnd()*6);g.strokeStyle=col;g.fillStyle=col;g.lineWidth=10;const cx=T/2,cy=T/2;
   if(s===0){g.beginPath();g.moveTo(30,84);g.lineTo(34,44);g.lineTo(50,64);g.lineTo(64,36);g.lineTo(78,64);g.lineTo(94,44);g.lineTo(98,84);g.closePath();g.stroke()}
   else if(s===1){g.beginPath();g.arc(cx,cy,38,0,7);g.stroke();g.beginPath();g.moveTo(cx-26,cy+30);g.lineTo(cx,cy-36);g.lineTo(cx+26,cy+30);g.moveTo(cx-18,cy+8);g.lineTo(cx+18,cy+8);g.stroke()}
   else if(s===2){g.beginPath();g.moveTo(20,cy);g.lineTo(96,cy);g.moveTo(74,cy-22);g.lineTo(100,cy);g.lineTo(74,cy+22);g.stroke()}
   else if(s===3){g.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?16:40;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.closePath();g.stroke()}
   else if(s===4){g.beginPath();g.arc(cx,cy,36,0,7);g.stroke();g.beginPath();g.arc(cx-13,cy-8,4,0,7);g.arc(cx+13,cy-8,4,0,7);g.fill();g.beginPath();g.arc(cx,cy+4,20,.2,Math.PI-.2);g.stroke()}
   else{g.beginPath();g.moveTo(70,16);g.lineTo(40,68);g.lineTo(62,68);g.lineTo(48,112);g.lineTo(88,52);g.lineTo(66,52);g.lineTo(82,16);g.closePath();g.fill()}
   drip(cx,cy+30,col,2)}
  g.restore()}
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;GRAF.tex=t;
 const m=new THREE.MeshLambertMaterial({map:t,transparent:true,alphaTest:.3,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});m.userData.cached=true;GRAF.mat=m;return m}
function grafMesh(list){if(!list||!list.length)return null;const pos=[],uv=[],idx=[];list.forEach((q,n)=>{const i=q.tile,u0=(i%8)/8,u1=u0+.125,v1=1-Math.floor(i/8)/4,v0=v1-.25;
  for(const p of q.pts)pos.push(...p);uv.push(u0,v0,u1,v0,u1,v1,u0,v1);const b=n*4;idx.push(b,b+1,b+2,b,b+2,b+3)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,grafAtlas());m.castShadow=false;m.receiveShadow=true;m.renderOrder=2;return m}
function adsMesh(list){if(!list||!list.length)return null;const pos=[],uv=[],idx=[];list.forEach((q,n)=>{const i=q.tile,u0=(i%4)/4,u1=u0+.25,v1=1-Math.floor(i/4)/4,v0=v1-.25;
  for(const p of q.pts)pos.push(...p);uv.push(u0,v0,u1,v0,u1,v1,u0,v1);const b=n*4;idx.push(b,b+1,b+2,b,b+2,b+3)});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,adsAtlas());m.castShadow=false;m.receiveShadow=false;return m}
function fitFill(g,t,x,y,maxW,px,fam){let f=px;g.font='700 '+f+'px '+fam;while(f>8&&g.measureText(t).width>maxW){f--;g.font='700 '+f+'px '+fam}g.fillText(t,x,y)}
function buildChunk(ci,cj){const key=ci+','+cj;if(city.chunks.has(key))return;if(city.neonRoad&&!city.neonRoad.prepped){city.neonRoad.prepped=true;try{nrMouthPrep(city.neonRoad)}catch(e){}}
 const st=city.st,night=!!st.synth,M=city.M,N=city.N,E=city.ext,NC=Math.ceil(N/CS),o=RW/2,Rsave=R;
 const bb=chunkBox(ci,cj);const ch={key,ci,cj,group:new THREE.Group(),cols:[],trees:[],lamps:[],tls:[],cables:[],cars:[],peds:[],pickups:[],x0:bb[0],z0:bb[1],x1:bb[2],z1:bb[3]};
 city.chunks.set(key,ch);curChunk=ch;let gunN=0,garaged=0,curRi=-1,curI=null;const pendingParkingSidewalk=[];if(!city.doors)city.doors=new Map();
 const regDoor=(dx,dz,f,u,house)=>{if(curRi<0)return;const r=city.rects[curRi];let ox,oz;if(f==='n'||f==='s'){ox=clamp(u,r[0]+2.5,r[2]-2.5);oz=f==='n'?r[1]+2:r[3]-2}else{oz=clamp(u,r[1]+2.5,r[3]-2.5);ox=f==='w'?r[0]+2:r[2]-2}
  city.doors.get(curRi).push({x:dx,z:dz,ox,oz,ri:curRi,td:perimNearest(perim(curRi),ox,oz),house,f})};
 const lodNear=new MB(),lodMid=new MB(),lodFarWindow=new MB(),signs=new MB(),clothes=new MB(),clothPins=[],sandMb=new MB(),towelMb=new MB(),foamMb=new MB(),wat=new MB(),fence=new MB(),walls=new MB(),abWalls=new MB(),roofs=new MB(),det=new MB(),roofD=new MB(),neonDN=new MB(),neon=new MB(),side=new MB(),forestFloor=new MB(),roadGround=new MB(),marks=new MB(),glow=new MB(),plants=new MB(false),forestPlants=new MB(false),roofs2=new MB(),hwin=new MB(),hwinS=new MB(),bins=new MB(false),tlp=new MB(false),bedMb=new MB(),waveMb=new MB(),hazeCastle=new MB();det.ab=1;lodNear.ab=1;lodMid.ab=1;neon.ab=1;tlp.ab=1;
 const isoBuilders=[walls,abWalls,roofs,roofs2,det,roofD,neonDN,lodNear,lodMid,lodFarWindow,hwin,hwinS,neon,glow,signs];
 const isoCapture=fn=>(...args)=>{const starts=isoBuilders.map(b=>b.p.length),result=fn(...args);isoRecord(isoBuilders,starts);return result};
 const cMark=COL(st.mark),cCenter=COL(st.center),cSide=COL(st.side),cGrass=COL(st.grass),cDet=COL(st.detail);
 const own=(x,z)=>{const c=chunkOf(x,z);return c[0]===ci&&c[1]===cj};
 const roadAt=(x,z)=>(city.parkingFloorReady?groundY0(x,z):groundY(x,z))===0;
 R=mulberry32((S.seed*7+ci*7919+cj*104729)>>>0);
 const notchFill=()=>{for(let kx=0;kx<=city.N;kx++)for(let kz=0;kz<=city.N;kz++){if(!own(kx*P,kz*P))continue;for(const sx of [-1,1])for(const sz of [-1,1]){const cc=cornerInfo(kx,kz,sx,sz);
   if(cc.notch)side.qdisc(kx*P+sx*8,kz*P+sz*8,4.1,-sx,-sz,0,.2,isRural(kx*P+sx*8,kz*P+sz*8)?cGrass:cSide)}}};
 notchFill();
 const roadMarks=(H,c,a0,a1,L)=>{L=L||{t:'ave'};const F=(u0,u1,v0,v1)=>H?marks.flat(u0,c+v0,u1,c+v1,0.02,arguments[5]):0;
  const fl=(u0,u1,v0,v1,col)=>{if(H)marks.flat(u0,c+v0,u1,c+v1,0.02,col);else marks.flat(c+v0,u0,c+v1,u1,0.02,col)};
  const sb=(u0,u1,v0,v1)=>{(ch.parkingRoadSlabs||(ch.parkingRoadSlabs=[])).push({r:H?[u0,c+v0,u1,c+v1]:[c+v0,u0,c+v1,u1],col:cSide.clone()})};
  const w=L.t==='ave'?RW/2:3.75;
  if(L.t!=='ave'){sb(a0,a1,-RW/2,-3.9);sb(a0,a1,3.9,RW/2);
   /* v78: a linha de borda não atravessa a boca da Neon Road */
   const NRm=city.neonRoad&&city.neonRoad.mouth?city.neonRoad.mouth.filter(Boolean):[],edge=(v0,v1)=>{let segs=[[a0+5,a1-5]];const vw=c+(v0+v1)/2;
    for(const m of NRm){const along=H?[m[0],m[2]]:[m[1],m[3]],acr=H?[m[1],m[3]]:[m[0],m[2]];if(vw<acr[0]-1||vw>acr[1]+1)continue;const g0=along[0]-CR,g1=along[1]+CR;segs=segs.flatMap(([p,q])=>q<=g0||p>=g1?[[p,q]]:[[p,g0],[g1,q]].filter(([x,y])=>y-x>.5))}
    for(const [p,q] of segs)fl(p,q,v0,v1,cMark)};edge(-3.75,-3.6);edge(3.6,3.75)}
  if(L.t==='one'){for(let u=a0+6;u<a1-8;u+=6)fl(u,u+3,-.08,.08,cMark);
   const sg=(L.dir===0||L.dir===1)?1:-1;for(const v of [-1.9,1.9])for(const u of [a0+8,a1-10]){const t0=sg>0?u:u+2.4;fl(Math.min(t0,t0+sg*2.4),Math.max(t0,t0+sg*2.4),v-.1,v+.1,cMark);const tip=t0+sg*2.4;
    for(let q=0;q<4;q++){const uu=tip-sg*q*.22;fl(Math.min(uu,uu-sg*.22),Math.max(uu,uu-sg*.22),v-.12-q*.13,v+.12+q*.13,cMark)}}}
  else if(L.t==='two')fl(a0+5,a1-5,-.08,.08,cCenter);
  else{fl(a0+5,a1-5,-.32,-.18,cCenter);fl(a0+5,a1-5,.18,.32,cCenter)}
  if(L.t==='ave')for(let u=a0+6;u<a1-8;u+=6){fl(u,u+3,-3.9,-3.75,cMark);fl(u,u+3,3.75,3.9,cMark)}
  for(const[a,b] of [[a0+.6,a0+3.8],[a1-3.8,a1-.6]])for(let t=-w+.6;t<w-.6;t+=1.25)fl(a,b,t,t+.6,cMark)};
 const hseg=(z,x0,x1,L)=>roadMarks(true,z,x0,x1,L),vseg=(x,z0,z1,L)=>roadMarks(false,x,z0,z1,L);
 const kx0=ci*CS,kx1=ci===NC-1?N:(ci+1)*CS-1,kz0=cj*CS,kz1=cj===NC-1?N:(cj+1)*CS-1,pcol=COL(night?'#2b2540':'#3a3a3c');
 const dirtC=COL(night?'#4a3a40':'#9a7b52'),rutC=COL(night?'#3a2c34':'#7d6140');if(S.style==='inverted'){dirtC.multiplyScalar(.6);rutC.multiplyScalar(.6)} /* v2 r1: terra do Upside Down 40% mais escura */
 const dirt=(H,c,a0,a1)=>{const fl=(u0,u1,v0,v1,col)=>{if(H)roadGround.flat(u0,c+v0,u1,c+v1,0.015,col);else roadGround.flat(c+v0,u0,c+v1,u1,0.015,col)};fl(a0,a1,-o,o,dirtC)};
 for(let kx=kx0;kx<=kx1;kx++)for(let kz=kz0;kz<=kz1;kz++){
  if(city.haze)continue; // v78: Point Haze sem estradas de terra (era a grade de quarteirões no chão)
  /* v79: cruzamento é de terra também quando TODAS as ruas que chegam nele são de terra (antes sobrava um quadrado de asfalto isolado perto
     de landmark, ex. indústria na roça); com rua asfaltada chegando, a borda terra/asfalto fica reta (sem as quinas curvas de terra) */
  const sgN=[[kx,kz,0,kx*P+P/2,kz*P],[kx-1,kz,0,kx*P-P/2,kz*P],[kx,kz,1,kx*P,kz*P+P/2],[kx,kz-1,1,kx*P,kz*P-P/2]].filter(q=>segExists(q[0],q[1],q[2])),urbN=sgN.some(q=>!isRural(q[3],q[4]));
  const rN=isRural(kx*P,kz*P)||(sgN.length>0&&!urbN);if(rN&&city.deg[kx][kz]>0)roadGround.flat(kx*P-o,kz*P-o,kx*P+o,kz*P+o,0.015,dirtC);
  if(rN&&city.cc&&city.deg[kx][kz]>0)for(const sx of [-1,1])for(const sz of [-1,1]){if(urbN&&!isRural(kx*P+sx*P*.5,kz*P+sz*P*.5))continue; /* v79r4: com rua asfaltada chegando, a quina curva de terra só vai nos quarteirões rurais (sem ela aparecia o asfalto por baixo da quina arredondada) */const cc=cornerInfo(kx,kz,sx,sz);for(const[A,B] of cc.conv){const X=a=>kx*P+sx*a,Z=b=>kz*P+sz*b,ca=A+CR,cb=B+CR,n=8,S0=[X(A),.016,Z(B)];
   for(const qx of [1,-1])for(const qz of [1,-1])for(let k=0;k<n;k++){const ox=A+qx*CR,oz=B+qz*CR,ta=Math.atan2(0,-qx);let dd=Math.atan2(-qz,0)-ta;dd=Math.atan2(Math.sin(dd),Math.cos(dd));const t0=ta+dd*k/n,t1=ta+dd*(k+1)/n,p0=[X(ox+Math.cos(t0)*CR),.016,Z(oz+Math.sin(t0)*CR)],p1=[X(ox+Math.cos(t1)*CR),.016,Z(oz+Math.sin(t1)*CR)];roadGround.qa(S0,p0,p1,p1,dirtC,[S0[0],-5,S0[2]])}}}
  if(segExists(kx,kz,0)){if(isRural(kx*P+P/2,kz*P))dirt(true,kz*P,kx*P+o,(kx+1)*P-o);else hseg(kz*P,kx*P+o,(kx+1)*P-o,lineType(kx,kz,0))}
  if(segExists(kx,kz,1)){if(isRural(kx*P,kz*P+P/2))dirt(false,kx*P,kz*P+o,(kz+1)*P-o);else vseg(kx*P,kz*P+o,(kz+1)*P-o,lineType(kx,kz,1))}
  if(!rN&&city.deg[kx][kz]>=2){const LH=city.lines['H'+kz],LV=city.lines['V'+kx];
   for(const sz of [-1,1])if(LH&&LH.t!=='ave'&&!segExists(kx,sz<0?kz-1:kz,1)&&segExists(kx-1,kz,0)&&segExists(kx,kz,0)){const z0=sz<0?kz*P-o:kz*P+3.9,z1=sz<0?kz*P-3.9:kz*P+o;sideSlab(side,kx*P-o,0,z0,kx*P+o,.2,z1,cSide)}
   for(const sx of [-1,1])if(LV&&LV.t!=='ave'&&!segExists(sx<0?kx-1:kx,kz,0)&&segExists(kx,kz-1,1)&&segExists(kx,kz,1)){const x0=sx<0?kx*P-o:kx*P+3.9,x1=sx<0?kx*P-3.9:kx*P+o;sideSlab(side,x0,0,kz*P-o,x1,.2,kz*P+o,cSide)}}
  if(city.deg[kx][kz]>=3&&!rN)for(let d=0;d<4;d++){const ax=kx-D[d][0],az=kz-D[d][1];if(!segExists(ax,az,d))continue;
   const rx=-D[d][1],rz=D[d][0],oo=o+1.2;const px=kx*P+D[d][0]*oo+rx*oo,pz=kz*P+D[d][1]*oo+rz*oo;
   const tk=kx+','+kz+','+d;if(city.brokenTL.has(tk))continue;const hx=px-rx*3.2,hz=pz-rz*3.2,v0=tlp.p.length/3;
   tlp.geo(GEO.cyl,mtx(px,2.85,pz,.13,5.3,.13),pcol);tlp.geo(GEO.cyl,mtx(px,.4,pz,.2,.4,.2),pcol);tlp.geo(GEO.crownSmall,mtx(px,5.5,pz,.14,.14,.14),pcol); // v77: 9 lados e esfera 8×5 (≈610 → ≈200 triângulos por poste)
   {const L=Math.hypot(hx-px,hz-pz);tlp.geo(GEO.cyl,mtx((px+hx)/2,5.39,(pz+hz)/2,.08,L,.08,Math.abs(hz-pz)>Math.abs(hx-px)?Math.PI/2:0,0,Math.abs(hx-px)>=Math.abs(hz-pz)?Math.PI/2:0),pcol)}
   const vh=tlp.p.length/3;tlp.box(hx-.15,3.98,hz-.15,hx+.15,5.32,hz+.15,COL('#e8b81a'));tlp.box(hx-.19,5.32,hz-.19,hx+.19,5.38,hz+.19,COL('#c89a10'));const t={kx,kz,d,hx,hz,px,pz,v0,vh,v1:tlp.p.length/3,i:ch.tls.length,ch,tk};
   const tc=addCol(px-.2,pz-.2,px+.2,pz+.2,'tlight');tc.tl=t;ch.tls.push(t);

  }}
 // Placas de contramao sao montadas nos postes dos semaforos acima.
 // Nao existe mais poste isolado sobre a faixa de pedestres.
 // Placas suspensas nas transicoes de bairro: orientacoes reais para a praia e industria.
 // Raras, deterministicas e limitadas a vias urbanas com espaco livre.
 // v78: mesma geometria, cores e posições de antes, mas em lote: estrutura (poste, braço, painel, verso) numa
 // malha Lambert por chunk e as faces informativas numa malha só, com UVs no atlas (signAtlasSlot). O texto e a
 // seta continuam vindo de q.lines (direção real do destino, calculada na geração); nada muda no desenho.
 if(city.signZones){const SP=signParts(),sMB=new MB(),fMB=new MB();let nS=0;
  const part=(g,x,y,z,w,h,d,col)=>{sMB.geo(g,mtx(x,y,z,w,h,d),col)};
  for(const q of city.signZones){if(!own(q.x,q.z))continue;nS++;
   // Estrutura em L: base na calcada e braco curto sobre a borda da via.
   part(SP.pole,q.x,3.1,q.z,1,1,1,SP.steel);
   const reach=3.8,armY=6.03;
   part(SP.box,q.x-(q.horiz?0:reach/2),armY,q.z-(q.horiz?reach/2:0),q.horiz?.32:reach,.28,q.horiz?reach:.32,SP.steel);
   const sx=q.x-(q.horiz?0:reach),sz=q.z-(q.horiz?reach:0);
   // Painel com metade da largura e altura anteriores.
   part(SP.box,sx,5.14,sz,q.horiz?.16:4.25,1.73,q.horiz?4.25:.16,SP.panel);
   // A face informativa aponta para o trafego que se aproxima na faixa junto a calcada.
   const nx=q.horiz?-1:0,nz=q.horiz?0:1;
   // Apenas frente informativa; verso cinza opaco, ligeiramente menor.
   const slot=signAtlasSlot(q.lines);
   if(slot){const cx=sx+nx*.095,cy=5.14,cz=sz+nz*.095,hw=4.07/2,hh=1.55/2,rx=nz,rz=-nx;
    fMB.quad([cx-rx*hw,cy-hh,cz-rz*hw],[cx+rx*hw,cy-hh,cz+rz*hw],[cx+rx*hw,cy+hh,cz+rz*hw],[cx-rx*hw,cy+hh,cz-rz*hw],nx,0,nz,[slot.u0,slot.v0,slot.u1,slot.v1],SP.white)}
   else roadSignPlane(ch.group,roadSignMaterial('guide',q.lines),sx+nx*.095,5.14,sz+nz*.095,4.07,1.55,nx,nz);
   part(SP.box,sx-nx*.104,5.14,sz-nz*.104,q.horiz?.025:3.94,1.43,q.horiz?3.94:.025,SP.back);
  }
  if(nS){const m1=sMB.mesh(SP.mat,false,false),m2=fMB.mesh(st.noWindows?SIGN_ATLAS.matInv:SIGN_ATLAS.mat,false,false);if(m1)ch.group.add(m1);if(m2)ch.group.add(m2)}
 }
 const lamp=(x,z,dx,dz)=>{if(!roadAt(x+dx*7.4,z+dz*7.4))return;const l={x,z,dx,dz,broken:false,th:.3+R()*.4,ch};ch.lamps.push(l);l.col=addCol(x-.18,z-.18,x+.18,z+.18,'pole');l.col.lamp=l};
 // Grama procedural de baixo custo: manchas em camadas e tufos esparsos.
 // A cor-base e igual entre lotes vizinhos; bordas recebem uma transicao suave.
 // v266: a floresta usa UMA textura de sombra difusa no solo, em vez de
 // desenhar dezenas de copas no shadow pass. Gerada uma vez, sem animação,
 // e sem nenhuma alteração nos materiais ou shaders de sprites (v258).
 const forestShadowTexture=(seed)=>{
  const canvas=cv(192,192),g=canvas.getContext('2d'),rand=mulberry32((seed^0x6f23b51d)>>>0);
  g.clearRect(0,0,192,192);
  // Mancha principal irregular com bordas macias, reforçada por massas de copas.
  const blob=(x,y,rx,ry,strength)=>{
   g.save();g.translate(x,y);g.scale(rx,ry);
   const grad=g.createRadialGradient(0,0,.06,0,0,1);
   grad.addColorStop(0,'rgba(8,17,11,'+strength.toFixed(3)+')');
   grad.addColorStop(.55,'rgba(9,21,13,'+(strength*.82).toFixed(3)+')');
   grad.addColorStop(1,'rgba(10,24,16,0)');
   g.fillStyle=grad;g.fillRect(-1,-1,2,2);g.restore();
  };
  for(let k=0;k<95;k++){
   const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.83;
   blob(96+Math.cos(a)*r*79,96+Math.sin(a)*r*77,
    15+rand()*28,13+rand()*26,.085+rand()*.095);
  }
  // A clareira central e a trilha de entrada ficam um pouco mais claras.
  g.save();g.globalCompositeOperation='destination-out';
  let grad=g.createRadialGradient(96,96,4,96,96,25);
  grad.addColorStop(0,'rgba(0,0,0,.68)');grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;g.fillRect(70,70,52,52);
  grad=g.createLinearGradient(0,0,87,0);
  grad.addColorStop(0,'rgba(0,0,0,.33)');grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;g.fillRect(0,89,88,14);g.restore();
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;
  texture.generateMipmaps=false;texture.needsUpdate=true;city.mats.push(texture);
  return texture;
 };
 const forestShadowPatch=(x0,z0,x1,z1,seed)=>{
  const texture=forestShadowTexture(seed),material=new THREE.MeshBasicMaterial({
   map:texture,transparent:true,depthWrite:false,depthTest:true,
   side:THREE.DoubleSide,opacity:night?.8:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
  });
  city.mats.push(material);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0-.8,z1-z0-.8),material);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.set((x0+x1)/2,.227,(z0+z1)/2);
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.renderOrder=2;mesh.layers.set(1);
  ch.group.add(mesh);ch.forestShadowMesh=mesh;
 };
 const lawn=(x0,z0,x1,z1,y=.24,density=1,tints=true,floorMB=side,foliageMB=plants)=>{
  if(x1-x0<2||z1-z0<2)return;
  const w=x1-x0,d=z1-z0,base=COL(st.grass),r=mulberry32(((Math.floor(x0*19)*73856093)^(Math.floor(z0*19)*19349663)^(S.seed*41))>>>0);
  const rand=(a,b)=>a+r()*(b-a);
  // Tons transparentes por geometria: faixas largas e progressivamente mais sutis.
  const count=tints?Math.min(30,Math.floor(w*d/95)):0;
  for(let i=0;i<count;i++){
   const x=rand(x0+.8,x1-.8),z=rand(z0+.8,z1-.8),rx=Math.min(rand(1.3,4.5),x-x0,x1-x),rz=Math.min(rand(1.2,4.4),z-z0,z1-z);
   if(rx<.4||rz<.4)continue;
   const tint=base.clone().multiplyScalar(rand(.90,1.08));
   // manchas largas em alturas minimas para evitar z-fighting.
   softStain(floorMB,x,z,rx*.8,rz*.8,y+.004+(i%3)*.0004,tint,base,x*3.7+z*1.9); // v78: mancha suave (antes placa quadrada), borda na cor da grama
  }
  // Textura de pequenas laminas em grupos, sem objetos/meshes individuais.
  const tufts=Math.min(105,Math.floor(w*d/34*density));
  for(let i=0;i<tufts;i++){
   const x=rand(x0+.65,x1-.65),z=rand(z0+.65,z1-.65),h=rand(.12,.38),a=rand(0,6.283),sz=rand(.07,.14),c=base.clone().multiplyScalar(rand(.84,1.22));
   const ux=Math.cos(a)*sz,uz=Math.sin(a)*sz;
   foliageMB.qa([x-ux,y+.012,z-uz],[x+ux,y+.012,z+uz],[x+ux*.25,y+h,z+uz*.25],[x-ux*.25,y+h,z-uz*.25],c,[x,y+.1,z]);
  }
 };
 const treeRaw=(x,z,y0,s,palm,noCol,forestOnly=false)=>{const cap=airportHeightLimit(x,z);
  if(Number.isFinite(cap))s=Math.min(s,Math.max(.45,(cap-y0-1.8)/8.5));
  const near=query(x,z,2.3);
  for(const b of near){
   if(!b||b.dead)continue;
   if(['bld','rock','house','roof','bin'].includes(b.kind)||b.top||b.kind==='tree'){
    const cx=clamp(x,b.x0,b.x1),cz=clamp(z,b.z0,b.z1);
    if(Math.hypot(x-cx,z-cz)<1.55)return;
   }
  }
  const plantMB=forestOnly?forestPlants:plants;
  const v0=plantMB.p.length/3,palmy=!!palm||(night&&!forestOnly&&!isRural(x,z)); // v77: no synth, mata e zona rural voltam a ter árvores comuns (coqueiro só na cidade/praia) — os coqueiros pesavam no desenho
  /* r32: na ROÇA a árvore comum fica 2× mais alta e com copa 2× maior (tronco 1,5× mais grosso); na cidade continua igual */
  let T=(!palmy&&TREE_RURAL_K>1&&!city.haze&&!Number.isFinite(cap)&&isRural(x,z))?TREE_RURAL_K:1;
  /* perto de casa/galpão a árvore fica no tamanho normal (a copa 2× invadiria o telhado) */
  if(T>1){const rr0=1.9*s*T+1.2;for(const b of query(x,z,rr0+2)){if(!b||b.dead||!(b.kind==='bld'||b.kind==='house'||b.kind==='roof'||b.top))continue;if(Math.hypot(x-clamp(x,b.x0,b.x1),z-clamp(z,b.z0,b.z1))<rr0){T=1;break}}}
  let crown=y0+4.1*s*T;
  if(palmy){ // palm
   crown=palmBuild(plantMB,x,y0,z,s,night,()=>rr(0,1));
  }else if(S.style==='inverted'){ /* dev r2.4: Mundo Invertido = árvore morta do Point Haze no lugar da comum. A comum é montada num lote descartável
   só para consumir o R() igual ao Sunset Shores (mesma cidade); a morta usa gerador próprio pela posição. */
   const S2=s*T,junk=new MB(false),g=COL(pick(['#3f7a2e','#4d8a34','#356b2a','#5a9440']));junk.geo(GEO.crown,mtx(x,y0,z,1,1,1,rr(0,3),rr(0,3),0),g);junk.geo(GEO.crownSmall,mtx(x+rr(-.6,.6),y0,z+rr(-.6,.6),1,1,1,rr(0,3),rr(0,3),0),g);
   const R0=R;R=mulberry32(((Math.round(x*10)*73856093)^(Math.round(z*10)*19349663)^S.seed)>>>0);
   try{const m0=plantMB.p.length;worldDeadTree(plantMB,x,z,S2*1.05,COL(pick(['#2c2629','#332b2c','#262224'])),true);if(y0)for(let k=m0+1;k<plantMB.p.length;k+=3)plantMB.p[k]+=y0}finally{R=R0}
   crown=y0+5.2*S2;
  }else{
   const tw=.22*s*(T>1?1.5:1),S2=s*T;plantMB.geo(GEO.cyl,mtx(x,y0+1.1*S2,z,tw,2.2*S2,tw),COL(night?'#3a2a35':'#5a4030'));
   const g=COL(pick(night?['#1f5a4a','#1b4a52','#2a6a4c','#22605a']:['#3f7a2e','#4d8a34','#356b2a','#5a9440']));
   plantMB.geo(GEO.crown,mtx(x,y0+3.1*S2,z,1.9*S2,1.6*S2,1.9*S2,rr(0,3),rr(0,3),0),g);
   plantMB.geo(GEO.crownSmall,mtx(x+rr(-.6,.6)*S2,y0+4.1*S2,z+rr(-.6,.6)*S2,1.3*S2,1.2*S2,1.3*S2,rr(0,3),rr(0,3),0),shade(g.getHexString&&('#'+g.getHexString()),1.15));
  }
  const tr={x,z,y0,s:s*T,big:T>1,v0,v1:plantMB.p.length/3,night:palmy,ch,crown,forest:forestOnly};ch.trees=ch.trees||[];ch.trees.push(tr);
  if(noCol)return;const tc=addCol(x-.3,z-.3,x+.3,z+.3,'tree');tc.tree=tr;
 };
 const tree=(x,z,y0,...a)=>{const d=MB_DROP;if(d){const r=mbDropY(x,z,y0,y0+.01);if(r)y0=r[0];MB_DROP=null}try{return treeRaw(x,z,y0,...a)}finally{MB_DROP=d}};

 /* v78 NEON ROAD: linha amarela, prédio-túnel (isoCapture → some no top-down/isométrico), letreiros, placa verde, postes e coqueiros */
 const neonRoadDeco=(ri,bx0,bz0,bx1,bz1)=>{const NR=city.neonRoad,q=mulberry32(NR.seed),qr=(a,b)=>a+(b-a)*q(),{ax,c,aw,tw,ta,tb,H,clr}=NR,h=tw/2;
  const Wp=(u,v)=>ax==='x'?[u,v]:[v,u],bxU=(mb,ua,ub,va,vb,y0,y1,col,o)=>{const A=Wp(ua,va),B=Wp(ub,vb);mb.box(Math.min(A[0],B[0]),y0,Math.min(A[1],B[1]),Math.max(A[0],B[0]),y1,Math.max(A[1],B[1]),col,o||{})};
  const ua=ax==='x'?bx0:bz0,ub=ax==='x'?bx1:bz1,inner=NR.end===0?tb:ta,sg=NR.end===0?1:-1,outer=NR.end===0?ta:tb,nW=Wp(sg,0),ry=Math.atan2(nW[0],nW[1]);
  {const A=Wp(ua+1.2,c-.08),B=Wp(ub-1.2,c+.08);marks.flat(Math.min(A[0],B[0]),Math.min(A[1],B[1]),Math.max(A[0],B[0]),Math.max(A[1],B[1]),.02,cCenter)}
  const wc0=COL(night?['#3a3448','#2e3442','#40384a'][Math.floor(q()*3)]:['#b8a690','#a3acb5','#c4b49c','#9a948c'][Math.floor(q()*4)]),wc=(()=>{const B=(ch.bwc||[]).filter(b=>b.ri===ri);if(!B.length)return wc0;const m=[(NR.tr[0]+NR.tr[2])/2,(NR.tr[1]+NR.tr[3])/2];B.sort((a,b)=>Math.hypot((a.x0+a.x1)/2-m[0],(a.z0+a.z1)/2-m[1])-Math.hypot((b.x0+b.x1)/2-m[0],(b.z0+b.z1)/2-m[1]));return B[0].wc.clone()})(), /* v78: túnel no tom do prédio vizinho mais próximo */rc=COL(night?'#1d1a26':'#6d6862'),dk=COL('#111116'),vc=COL(night?'#2a2632':'#5c5853');
  const {R:RA,yc,yT,rightV,leftV}=NR,umid=(ta+tb)/2,P3=(u,v,y)=>ax==='x'?[u,y,v]:[v,y,u],nA=16;
  /* túnel em ARCO (meio cilindro): faixas laterais finas + tímpanos do arco nas duas fachadas + abóbada por dentro + corpo com janelas acima */
  let pv0=c-h,pv1=c+h;const isoN0=ISOFADE.items.length;isoCapture(()=>{
   bxU(det,ta,tb,c-h,c-RA,.2,yT,wc);bxU(det,ta,tb,c+RA,c+h,.2,yT,wc); /* faixas laterais (a face interna é a parede baixa do túnel) */
   bxU(walls,ta,tb,c-h,c+h,yT,H,wc,{top:roofs,topCol:rc,win:[0,0]}); /* corpo acima do arco */
   const refIn=P3(umid,c,yc+RA*.5),axis=P3(umid,c,yc);
   for(let k=0;k<nA;k++){const a0=Math.PI*k/nA,a1=Math.PI*(k+1)/nA,va=c+RA*Math.cos(a0),ya=yc+RA*Math.sin(a0),vb=c+RA*Math.cos(a1),yb=yc+RA*Math.sin(a1);
    for(const fu of [ta,tb])det.qa(P3(fu,va,ya),P3(fu,vb,yb),P3(fu,vb,yT),P3(fu,va,yT),wc,refIn); /* tímpano */
    det.qb(P3(ta,va,ya),P3(tb,va,ya),P3(tb,vb,yb),P3(ta,vb,yb),vc,axis)} /* abóbada, normal para dentro */
   for(const fu of [ta,tb]){const s2=fu===inner?sg:-sg;for(let k=0;k<nA;k++){const a0=Math.PI*k/nA,a1=Math.PI*(k+1)/nA,r2=RA+.35; /* friso em arco */
     det.qa(P3(fu+s2*.06,c+RA*Math.cos(a0),yc+RA*Math.sin(a0)),P3(fu+s2*.06,c+RA*Math.cos(a1),yc+RA*Math.sin(a1)),P3(fu+s2*.06,c+r2*Math.cos(a1),yc+r2*Math.sin(a1)),P3(fu+s2*.06,c+r2*Math.cos(a0),yc+r2*Math.sin(a0)),rc,P3(fu-s2,c,yc))}}
   /* v78: sem painel preto (pedido): letreiro direto na fachada */
   /* asas laterais: fecham o vão até o prédio vizinho (entram .25 m nele → a face de encontro fica escondida, sem z-fight) */
   for(const sd of [-1,1]){let gap=null;const vE=c+sd*h;
    for(const cl of ch.cols){if(cl.dead||cl.kind!=='bld'||cl.nrTunnel)continue;const ua2=ax==='x'?cl.x0:cl.z0,ub2=ax==='x'?cl.x1:cl.z1,va2=ax==='x'?cl.z0:cl.x0,vb2=ax==='x'?cl.z1:cl.x1;if(ub2<ta-.5||ua2>tb+.5)continue;
     const g=sd>0?va2-vE:vE-vb2;if(g>-.1&&g<6&&(gap===null||g<gap))gap=g}
    if(gap===null)gap=1.6;if(gap<.15)continue;const v1=vE+sd*(gap+.25);if(sd<0)pv0=v1;else pv1=v1;bxU(walls,ta,tb,Math.min(vE,v1),Math.max(vE,v1),.2,H,wc,{top:roofs,topCol:rc,win:[0,0]});
    const A=Wp(ta,Math.min(vE,v1)),B=Wp(tb,Math.max(vE,v1)),cl2=addCol(Math.min(A[0],B[0]),Math.min(A[1],B[1]),Math.max(A[0],B[0]),Math.max(A[1],B[1]),'bld');cl2.top=H;cl2.nrTunnel=true}
   /* topo: platibanda + casas de máquina + caixa d'água (mesmo kit dos prédios) */
   {const pc=wc.clone().multiplyScalar(.9),pT=H+.55;bxU(det,ta,tb,pv0,pv0+.25,H,pT,pc);bxU(det,ta,tb,pv1-.25,pv1,H,pT,pc);bxU(det,ta,ta+.25,pv0+.25,pv1-.25,H,pT,pc);bxU(det,tb-.25,tb,pv0+.25,pv1-.25,H,pT,pc); /* platibanda em volta do telhado inteiro (túnel + asas) */
    const nAC=1+Math.floor(q()*3);for(let k=0;k<nAC;k++){const uu=qr(ta+1.2,tb-2.6),vv=qr(c-h+1.2,c+h-2.6),sz=qr(1,1.7);bxU(det,uu,uu+sz,vv,vv+sz*.8,H,H+.85,night?COL('#3a3350'):COL('#b9b6ae'));bxU(det,uu+.15,uu+sz-.15,vv+.15,vv+sz*.8-.15,H+.85,H+1.05,night?COL('#24203a'):COL('#8d8a84'))}
    {const cap=airportFootprintLimit(...NR.tr);if(!Number.isFinite(cap)||H+4<=cap){const p=Wp(qr(ta+2.5,tb-2.5),c+(q()<.5?-1:1)*qr(2,h-2.2));det.geo(GEO.cyl,mtx(p[0],H+2.2,p[1],1.4,2.4,1.4),COL(night?'#2a2440':'#7a6a5a'));det.box(p[0]-.06,H,p[1]-.06,p[0]+.06,H+4,p[1]+.06,cDet)}}}
  })();
  const nrIt=[];for(let i=isoN0;i<ISOFADE.items.length;i++){const it=ISOFADE.items[i];if(it){it.nrTunnel=true;it.nrMeshes=[];nrIt.push(it);ISOFADE.nrN=(ISOFADE.nrN||0)+1}}const nrSign=m=>{if(nrIt[0])nrIt[0].nrMeshes.push(m);return m}; /* letreiros somem junto com o túnel */
  for(const [va,vb] of [[c-h,c-RA],[c+RA,c+h]]){const A=Wp(ta,va),B=Wp(tb,vb),cl=addCol(Math.min(A[0],B[0]),Math.min(A[1],B[1]),Math.max(A[0],B[0]),Math.max(A[1],B[1]),'bld');cl.top=H;cl.nrTunnel=true}
  const fu=inner+sg*.15,pB=yT+.1,pT=Math.min(H-.4,yT+3),pW=h-.5; /* painel: v em c±pW, y em pB..pT */
  {const w=6.4,hh=1.6,eL=leftV>0?pv1:pv0,p=Wp(inner+sg*.06,eL-leftV*(.75+w/2));nrSign(signPlane(ch.group,neonTextMat('Zoio Direto','Pacifico','#ff5a78',1024,256,'#ff2a55'),p[0],H-.75-hh/2,p[1],w,hh,ry))} /* letra ~1 m, canto superior ESQUERDO do prédio (com asas), 75 cm das bordas, acompanha a altura H da seed */
  {const E=city.ext,beach=city.coast===0?[E/2,0]:city.coast===1?[E/2,E]:city.coast===2?[0,E/2]:[E,E/2],ind=[];city.info.forEach((f,i)=>{if(f.kind==='industrial'){const r=city.rects[i];ind.push([(r[0]+r[2])/2,(r[1]+r[3])/2])}});
   const ic=ind.length?[ind.reduce((a,b)=>a+b[0],0)/ind.length,ind.reduce((a,b)=>a+b[1],0)/ind.length]:null,sp=Wp(fu+sg*.01,c+rightV*(pW-.3-1.8)),f=[-nW[0],-nW[1]];
   const arrow=d=>{const dx=d[0]-sp[0],dz=d[1]-sp[1];return Math.atan2(-(dx*f[0]+dz*f[1]),dx*(-f[1])+dz*f[0])}; /* seta na visão de quem olha a placa */
   const tg=[{name:'PRAIA',pos:beach},...(city.core?[{name:'CENTRO',pos:[city.core.x,city.core.z]}]:[]),...(ic?[{name:'INDUSTRIA',pos:ic}]:[])].map(t=>({...t,dist:Math.hypot(t.pos[0]-sp[0],t.pos[1]-sp[1])})).sort((a,b)=>b.dist-a.dist);
   nrSign(roadSignPlane(ch.group,roadSignMaterial('guide',tg.slice(0,2).map(t=>[t.name,arrow(t.pos)])),sp[0],(pB+pT)/2,sp[1],3.6,1.35,nW[0],nW[1]))}
  const ts=city.tuneSpot,nearT=(x,z,m)=>ts&&Math.hypot(x-ts.x,z-ts.z)<m,uA=ua+SW+2.5,uB=ub-SW-2.5,lampsAt=[];
  for(let u=uA+5,k=0;u<uB;u+=17,k++){if(u>ta-4&&u<tb+4)continue;const s2=k%2?1:-1,p=Wp(u,c+s2*(aw/2+.45));if(nearT(p[0],p[1],9.5))continue;const d=Wp(0,-s2); /* entrada da oficina livre para o carro */
   const l={x:p[0],z:p[1],dx:d[0],dz:d[1],broken:false,th:.3+q()*.4,ch};ch.lamps.push(l);l.col=addCol(p[0]-.18,p[1]-.18,p[0]+.18,p[1]+.18,'pole');l.col.lamp=l;lampsAt.push(p)}
  /* coqueiros FIXOS (referência): 1 junto ao túnel do lado da placa verde + 2 nas esquinas do começo da rua */
  const palmsAt=[],palmAt=(u,sdv)=>{let uu=u;for(let k=0;k<3;k++){const p=Wp(uu,c+sdv*(h-1.05));if(!lampsAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<2.4)&&!nearT(p[0],p[1],9.5)){tree(p[0],p[1],.2,qr(1.05,1.25),true);palmsAt.push(p);return}uu+=(u<(ua+ub)/2?1:-1)*2.2}};
  palmAt(inner+sg*6.8,NR.rightV) /* v78: mais longe do túnel (sentido do banco) pra não tampar a placa verde */;{const uF=NR.end===0?ub:ua,dF=NR.end===0?-1:1;palmAt(uF+dF*6.5,-1);palmAt(uF+dF*6.5,1)}
  let sd=0;for(let u=uA+qr(0,4);u<uB;u+=qr(10,13)){if(u>ta-3&&u<tb+3)continue;sd^=1;const p=Wp(u,c+(sd?1:-1)*(h-1.05));if(nearT(p[0],p[1],9.5)||lampsAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<2.4)||palmsAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<5))continue;tree(p[0],p[1],.2,qr(.95,1.2),true);palmsAt.push(p)}
  /* banco de praça no pé do prédio à esquerda da oficina (visto da rua), virado para a rua */
  const benchAt=[];if(ts){const tu=ax==='x'?ts.x:ts.z,leftU=ax==='x'?NR.rightV:-NR.rightV,bu=tu+leftU*(4.6+3.4),bv=c+NR.rightV*(h-.55),wood=COL(night?'#4a3a5a':'#8a5a36'),metal=COL(night?'#2a2838':'#3a3a40');
   const B3=(u0,u1,v0,v1,y0,y1,col)=>bxU(det,Math.min(u0,u1),Math.max(u0,u1),Math.min(v0,v1),Math.max(v0,v1),y0,y1,col),nv=-NR.rightV;
   B3(bu-.95,bu+.95,bv-.22,bv+.22,.62,.7,wood);B3(bu-.95,bu+.95,bv-nv*.24,bv-nv*.3,.7,1.15,wood);for(const du of [-.8,.8]){B3(bu+du-.05,bu+du+.05,bv-.2,bv+.2,.2,.62,metal);B3(bu+du-.05,bu+du+.05,bv-nv*.24,bv-nv*.3,.62,1.12,metal)}
   const A=Wp(bu-1,bv-.3),Bq=Wp(bu+1,bv+.3);const bc=addCol(Math.min(A[0],Bq[0]),Math.min(A[1],Bq[1]),Math.max(A[0],Bq[0]),Math.max(A[1],Bq[1]),'rock');bc.low=1.15;benchAt.push(Wp(bu,bv))}
  /* lixo na calçada (exceção da cidade, como na referência): sacos e caixas derrubáveis, rente à fachada, perto de onde os pedestres passam */
  {const busy=(p,m)=>nearT(p[0],p[1],9.5)||lampsAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<m)||palmsAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<m)||benchAt.some(a=>Math.hypot(a[0]-p[0],a[1]-p[1])<m+.8);
   const nCl=3+Math.floor(q()*3);for(let k=0;k<nCl;k++){const sdv=q()<.5?-1:1,u0c=qr(uA+2,uB-2);if(u0c>ta-4&&u0c<tb+4)continue;const n=1+Math.floor(q()*3);
    for(let j=0;j<n;j++){const u=u0c+qr(-1,1),v=c+sdv*(h-qr(.35,.6)),p=Wp(u,v);if(busy(p,1.6))continue;const v0=bins.p.length/3,box=q()<.3;let col,sz;
     if(box){sz=qr(.3,.45);col=COL(night?'#5a4a3a':'#a07a4a');bins.box(p[0]-sz,.2,p[1]-sz*.8,p[0]+sz,.2+sz*1.1,p[1]+sz*.8,col)}else{sz=qr(.29,.46);col=COL(['#1c1c1e','#262629','#343337','#40413d'][Math.floor(q()*4)]);bins.geo(GEO.ico,mtx(p[0],.2+sz*.48,p[1],sz,sz*.95,sz,qr(0,3),qr(0,3),0),col)}
     const bc=addCol(p[0]-sz,p[1]-sz,p[0]+sz,p[1]+sz,'bin');bc.bin={x:p[0],z:p[1],v0,v1:bins.p.length/3,ch,col}}}}
  {const cand=[];for(const cl of ch.cols){if(cl.dead||cl.kind!=='bld'||cl.nrTunnel)continue;const mx=(cl.x0+cl.x1)/2,mz=(cl.z0+cl.z1)/2;if(mx<bx0||mx>bx1||mz<bz0||mz>bz1||nearT(mx,mz,9))continue;
    const lo=ax==='x'?cl.z0:cl.x0,hi=ax==='x'?cl.z1:cl.x1,u2a=ax==='x'?cl.x0:cl.z0,u2b=ax==='x'?cl.x1:cl.z1,span=u2b-u2a;if(span<6||(u2b>ta-2&&u2a<tb+2))continue;
    let fv=null,s3=0;if(c-h-hi>-.1&&c-h-hi<4){fv=hi;s3=1}else if(lo-(c+h)>-.1&&lo-(c+h)<4){fv=lo;s3=-1}if(fv===null||-s3!==NR.leftV)continue;cand.push({fv,s3,u2a,u2b,span,top:cl.top})}
   if(cand.length){cand.sort((a,b)=>b.span-a.span);const k=cand[Math.floor(q()*Math.min(3,cand.length))],w=Math.min(k.span*.8,7.5),y=(k.top||9)>=10.6?8:clamp(Math.min((k.top||9)-1.4,4.9),3.4,20) /* v78: no meio do 3º andar (faixas de acabamento em 6,4 e 9,6) */,p=Wp((k.u2a+k.u2b)/2,k.fv+k.s3*.06),n=Wp(0,k.s3);
    signPlane(ch.group,neonTextMat('OCEAN VIEW','Monoton','#ff7ad9',1024,256,'#ff2ac0'),p[0],y,p[1],w,w*.27,Math.atan2(n[0],n[1]));NR.oceanAt=[p[0],y,p[1]];cand.splice(cand.indexOf(k),1)}
   /* cartazes de propaganda do shopping (mesma arte do mall) em outras fachadas da rua, alternando os lados */
   const all=[];for(const cl of ch.cols){if(cl.dead||cl.kind!=='bld'||cl.nrTunnel)continue;const mx=(cl.x0+cl.x1)/2,mz=(cl.z0+cl.z1)/2;if(mx<bx0||mx>bx1||mz<bz0||mz>bz1||nearT(mx,mz,8))continue;
    const lo=ax==='x'?cl.z0:cl.x0,hi=ax==='x'?cl.z1:cl.x1,u2a=ax==='x'?cl.x0:cl.z0,u2b=ax==='x'?cl.x1:cl.z1;if(u2b-u2a<4.5||(u2b>ta-2&&u2a<tb+2))continue;let fv=null,s3=0;if(c-h-hi>-.1&&c-h-hi<4){fv=hi;s3=1}else if(lo-(c+h)>-.1&&lo-(c+h)<4){fv=lo;s3=-1}if(fv===null)continue;
    if(NR.oceanAt&&Math.hypot(((u2a+u2b)/2)-(ax==='x'?NR.oceanAt[0]:NR.oceanAt[2]),fv-(ax==='x'?NR.oceanAt[2]:NR.oceanAt[0]))<4)continue;all.push({fv,s3,u2a,u2b,top:cl.top})}
   const nAd=Math.min(3,all.length);let lastS=0;for(let k=0;k<nAd;k++){let i=all.findIndex(a=>a.s3!==lastS);if(i<0)i=0;const a=all.splice(i,1)[0];lastS=a.s3;const idx=Math.floor(q()*(typeof MALL_SHOPS!=='undefined'?16:1)),vv=Math.floor(q()*2),key='nrAd'+idx+'_'+vv;
    let mat=NEON_TXT.get(key);if(!mat){try{const t=new THREE.CanvasTexture(mallAdCanvas(idx,vv));t.anisotropy=4;mat=new THREE.MeshBasicMaterial({map:t});mat.userData.cached=true;NEON_TXT.set(key,mat)}catch(e){console.error('[neon road ad]',e);break}}
    const w=Math.min(3.4,(a.u2b-a.u2a)*.7),hh=w/2,y=clamp(Math.min((a.top||9)-hh/2-.8,3.4+hh/2),2.6+hh/2,20),um2=a.u2a+(a.u2b-a.u2a)*qr(.35,.65),p=Wp(um2,a.fv+a.s3*.07),n=Wp(0,a.s3);
    signPlane(ch.group,mat,p[0],y,p[1],w,hh,Math.atan2(n[0],n[1]));const fr=COL('#2a2430');bxU(det,um2-w/2-.1,um2+w/2+.1,Math.min(a.fv,a.fv+a.s3*.05),Math.max(a.fv,a.fv+a.s3*.05),y-hh/2-.1,y+hh/2+.1,fr)}}
  NR.built=true};
 const rock=(x,z,s,col)=>{const c=COL(col||(night?'#4a4458':'#8a8680')).multiplyScalar(rr(.85,1.1));det.geo(GEO.ico,mtx(x,s*.35,z,s*rr(.9,1.3),s*rr(.55,.85),s*rr(.9,1.3),rr(0,3),rr(0,3),rr(0,.4)),c)};
 const coastPatio=(x0,z0,x1,z1,f,hotel,seed)=>{
  const ns=f==='n'||f==='s',nx=f==='w'?-1:f==='e'?1:0,nz=f==='n'?-1:f==='s'?1:0,cx=(x0+x1)/2,cz=(z0+z1)/2,fx=ns?cx:f==='w'?x0:x1,fz=ns?(f==='n'?z0:z1):cz,ux=ns?1:0,uz=ns?0:1,rr2=mulberry32(seed),width=ns?x1-x0:z1-z0;
  if(width<8)return;ch.patio=ch.patio||[];const metal=COL('#ddd8cd'),cloth=COL(rr2()<.5?'#2c9ca4':'#e8bc66'),wood=COL('#735037');
  const Q=(u,v,y,w,d,h,col)=>{const x=fx+ux*u+nx*v,z=fz+uz*u+nz*v;det.box(x-(ns?w:d)/2,y,z-(ns?d:w)/2,x+(ns?w:d)/2,y+h,z+(ns?d:w)/2,col)};
  // Recuo de fachada: móveis no lote, corredor e porta central livres.
  for(const side of [-1,1]){const u=side*Math.min(width*.3,3.3),v=1.7;
   if(hotel){continue;
   }else{Q(u,v,1.01,.78,.78,.1,wood);Q(u,v,.2,.12,.12,.81,metal);const x=fx+ux*u+nx*v,z=fz+uz*u+nz*v;addCol(x-.43,z-.43,x+.43,z+.43,'rock').low=1.12;
    for(const dv of [-.85,.85]){Q(u,v+dv,.7,.53,.53,.08,cloth);Q(u,v+dv+Math.sign(dv)*.25,.76,.53,.06,.6,metal);for(const du of [-.21,.21])for(const dd of [-.2,.2])Q(u+du,v+dv+dd,.2,.045,.045,.5,metal);
     ch.patio.push({x:fx+ux*u+nx*(v+dv),z:fz+uz*u+nz*(v+dv),kind:'seat',angle:Math.atan2(-nx*Math.sign(dv),-nz*Math.sign(dv)),p:null,wait:rr2()*8})}
    Q(u-.2,v,1.12,.1,.1,.17,COL('#f4e4ad'));Q(u+.2,v,1.12,.08,.08,.2,COL('#8fb8ab'));
   }
  }
  const fs=ns?x0:z0;worldSignQuad(signs,f,x0,z0,x1,z1,fs+width*.2,fs+width*.8,3.45,4.65,.065,hotel?seed%8:16+seed%8,false);
 };
 const building=isoCapture((x0,z0,x1,z1,h,opts={})=>{
   // Os braços de um L já foram medidos/recortados no planejamento. Encolher
   // cada braço isoladamente pelo limite de lote comum quebrava o encontro,
   // sobretudo em quarteirões fundidos. Não alterar a regra dos outros prédios.
   if(!opts.linkedL)[x0,z0,x1,z1]=proceduralFootprint('building',x0,z0,x1,z1);
   const localAirCap=airportFootprintLimit(x0,z0,x1,z1);
   // No grupo L, cada componente recebe EXATAMENTE a altura comum, calculada
   // pelo menor teto aeroportuário dos dois braços + emenda.
   const airCap=opts.linkedL?Math.min(localAirCap,opts.linkedL.airCap):localAirCap;
   h=opts.linkedL?opts.linkedL.h:Math.min(h,35.2,Number.isFinite(airCap)?Math.max(5.8,airCap-5):Infinity);
  const airRoof={x0,z0,x1,z1,ri:curRi,y:h+2};if(curRi>=0)city.buildingFootprints.push(airRoof);const fp=facadePlan(S.seed,x0,z0,h,opts.simple,opts.safe||opts.patio),facadeWalls=fp.abandoned&&!opts.linkedL?abWalls:walls;const NS=night&&!opts.patio&&neonStreet(opts.face,x0,z0,x1,z1);det.ab=0;
  const wc=opts.pal?COL(opts.pal[0]):COL(pick(st.walls)).multiplyScalar(rr(.9,1.08)), rc=opts.pal?COL(opts.pal[1]):COL(pick(st.roof)).multiplyScalar(rr(.9,1.1));
  /* v3 r34 · BLDX: cor nova (~20%) e prédio redondo (elegíveis), sorteio próprio pela seed + posição */
  if(!opts.pal&&st===STYLES.modern&&!city.haze){const nc=bldxColor(bldxRng(x0,z0,0x0e5));if(nc)wc.copy(nc)}
  let EX=null;const exIn=(x,z,m)=>{if(!EX)return[x,z];const rx=Math.max(.2,EX.rx-m),rz=Math.max(.2,EX.rz-m),q=Math.hypot((x-EX.cx)/rx,(z-EX.cz)/rz);return q>1?[EX.cx+(x-EX.cx)/q,EX.cz+(z-EX.cz)/q]:[x,z]};
  if(opts.exo&&(!night||!NS)&&!city.haze&&!opts.pal&&!opts.linkedL&&!opts.safe&&!opts.patio&&!opts.para&&!opts.tour&&!opts.nrf&&Math.min(x1-x0,z1-z0)>=9){const er=bldxRng(x0,z0,0x7a3),e0=er(),e1=er();
   if(e0<BLDX.pe&&!(city.bxAl||[]).some(a=>a[0]<x1+3&&a[2]>x0-3&&a[1]<z1+3&&a[3]>z0-3)){const hw=(x1-x0)/2,hd=(z1-z0)/2,oval=e1<.5&&Math.max(hw,hd)/Math.min(hw,hd)>1.15,r=Math.min(hw,hd);
    let cx=(x0+x1)/2,cz=(z0+z1)/2;if(!oval&&opts.face){const f=opts.face;if(f==='n')cz=z0+r;else if(f==='s')cz=z1-r;else if(f==='w')cx=x0+r;else cx=x1-r}
    EX={cx,cz,rx:oval?hw:r,rz:oval?hd:r,oval}}}
  (ch.bwc||(ch.bwc=[])).push({x0,z0,x1,z1,wc,ri:curRi});
  ri(0,7);ri(0,7);if(fp.abandoned&&!opts.linkedL)wc.lerp(COL('#918777'),.32);if(EX){mbOval(facadeWalls,roofs,EX.cx,EX.cz,EX.rx,EX.rz,0,h,wc,rc,{win:[0,0]});(ch.bldx||(ch.bldx=[])).push(EX)}else facadeWalls.box(x0,0,z0,x1,h,z1,wc,{top:roofs,topCol:rc,win:[0,0],facadeGrid:true});
  if(EX){for(const q of bldxCols(EX,8))addCol(q[0],q[1],q[2],q[3],'bld').top=h}else addCol(x0,z0,x1,z1,'bld').top=h;
  /* r33 · pichação perto das esquinas, mais nas faces de beco (as que não dão pra rua) */
  if(!EX&&!opts.safe&&!opts.patio&&!city.haze&&h>3){const gr=mulberry32(((Math.round(x0*17)*2246822519)^(Math.round(z0*17)*3266489917)^(S.seed*13+0x6f1))>>>0),grr=(a,b)=>a+gr()*(b-a);
   const ext0=[];if(curI){if(z0<curI[1]+1.5)ext0.push('n');if(z1>curI[3]-1.5)ext0.push('s');if(x0<curI[0]+1.5)ext0.push('w');if(x1>curI[2]-1.5)ext0.push('e')}
   for(const f of ['n','s','w','e']){if(gr()>(ext0.includes(f)?.12:.38))continue;const ns=f==='n'||f==='s',L=ns?x1-x0:z1-z0;if(L<3)continue;
    const W=grr(2,3.2),Hh=W*grr(.6,.85),end=gr()<.5,t=end?grr(.3,Math.min(2.6,L*.3)):L-grr(.3,Math.min(2.6,L*.3))-W,y0=grr(.3,.8),y1=Math.min(h-.2,y0+Hh),tile=Math.floor(gr()*GRAF.N),o=.04;
    if(t<0||t+W>L)continue;let pts;
    if(f==='n'){const z=z0-o,a=x0+t;pts=[[a+W,y0,z],[a,y0,z],[a,y1,z],[a+W,y1,z]]}
    else if(f==='s'){const z=z1+o,a=x0+t;pts=[[a,y0,z],[a+W,y0,z],[a+W,y1,z],[a,y1,z]]}
    else if(f==='w'){const x=x0-o,a=z0+t;pts=[[x,y0,a],[x,y0,a+W],[x,y1,a+W],[x,y1,a]]}
    else{const x=x1+o,a=z0+t;pts=[[x,y0,a+W],[x,y0,a],[x,y1,a],[x,y1,a+W]]}
    (ch.graf=ch.graf||[]).push({pts,tile})}}
  if(!EX)maybeBuildingClock(ch,x0,z0,x1,z1,h,opts.face);
  let tx0=x0,tz0=z0,tx1=x1,tz1=z1,th=h;
  const w=x1-x0,d=z1-z0;
  if(!opts.simple&&R()<.38&&w>12&&d>12&&!opts.para){const ins=rr(2,Math.min(w,d)*.25);tx0=x0+ins;tz0=z0+ins;tx1=x1-ins;tz1=z1-ins;const h2=Math.min(Math.round((h+rr(4,night?14:10))/3.2)*3.2,41.6,Number.isFinite(airCap)?Math.max(h,airCap-4.1):Infinity);
   const wc2=wc.clone().multiplyScalar(rr(.92,1.05));ri(0,7);ri(0,7);if(EX){const E0=EX;EX={cx:E0.cx,cz:E0.cz,rx:Math.max(2,E0.rx-ins),rz:Math.max(2,E0.rz-ins),oval:E0.oval};mbOval(facadeWalls,roofs,EX.cx,EX.cz,EX.rx,EX.rz,h,h2,wc2,rc,{win:[0,0]});mbOvalRim(det,E0.cx,E0.cz,E0.rx,E0.rz,h,h+.6,.35,wc.clone().multiplyScalar(.8))}else{facadeWalls.box(tx0,h,tz0,tx1,h2,tz1,wc2,{top:roofs,topCol:rc,win:[0,0],facadeGrid:true});
   // parapet lower tier
   const pc=wc.clone().multiplyScalar(.8);
   det.box(x0,h,z0,x1,h+.6,z0+.35,pc);det.box(x0,h,z1-.35,x1,h+.6,z1,pc);det.box(x0,h,z0,x0+.35,h+.6,z1,pc);det.box(x1-.35,h,z0,x1,h+.6,z1,pc);}th=h2;
  }
  if(opts.para){ch.paraRoofs=ch.paraRoofs||[];ch.paraRoofs.push({x:(tx0+tx1)/2,z:(tz0+tz1)/2,y:th+.1,x0:tx0+.75,x1:tx1-.75,z0:tz0+.75,z1:tz1-.75,area:(tx1-tx0)*(tz1-tz0),ri:curRi})}
  airRoof.y=Number.isFinite(airCap)?Math.min(airCap,Math.max(h+2,th+3.2)):Math.max(h+2,th+3.2);
  const pc=wc.clone().multiplyScalar(.82);
  if(EX)mbOvalRim(det,EX.cx,EX.cz,EX.rx,EX.rz,th,th+.7,.4,pc);else{det.box(tx0,th,tz0,tx1,th+.7,tz0+.4,pc);det.box(tx0,th,tz1-.4,tx1,th+.7,tz1,pc);det.box(tx0,th,tz0,tx0+.4,th+.7,tz1,pc);det.box(tx1-.4,th,tz0,tx1,th+.7,tz1,pc)}
  // roof props
  const nA=ri(1,3);for(let i=0;i<nA;i++){if(Number.isFinite(airCap)&&th+1.05>airCap)continue;let ax=rr(tx0+1.5,tx1-3),az=rr(tz0+1.5,tz1-(opts.ring?3.5:3));const s=rr(1,1.8);if(EX){const q=exIn(ax+s/2,az+s*.4,s*.65+.6);ax=q[0]-s/2;az=q[1]-s*.4}
   det.box(ax,th,az,ax+s,th+.85,az+s*.8,night?COL('#3a3350'):COL('#b9b6ae'));det.box(ax+.15,th+.85,az+.15,ax+s-.15,th+1.05,az+s*.8-.15,night?COL('#24203a'):COL('#8d8a84'))}
  if(R()<.35&&(tx1-tx0)>8&&(!Number.isFinite(airCap)||th+2.4<=airCap)){let ax=rr(tx0+2,tx1-5),az=rr(tz0+2,tz1-5);if(EX){const q=exIn(ax+1.5,az+1.3,2.6);ax=q[0]-1.5;az=q[1]-1.3}if(!EX||Math.min(EX.rx,EX.rz)>3.4)det.box(ax,th,az,ax+3,th+2.4,az+2.6,pc.clone().multiplyScalar(.95),{topCol:rc})}
  const tankRoll=R();
  if(opts.ring){
   // Reserve an equipment strip outside the random condenser range.
   let ax=tx1-1.15,az=tz1-1.15;if(EX){const q=exIn(ax,az,1.2);ax=q[0];az=q[1]}const base=th+.32;
   det.box(ax-.34,th,az-.34,ax+.34,base,az+.34,pc);
   det.geo(GEO.cyl,mtx(ax,base+.57,az,.62,1.14,.62),COL(night?'#34324b':'#526f89'));
   det.geo(GEO.cyl,mtx(ax,base+1.19,az,.64,.10,.64),COL(night?'#424058':'#607f98'));
  }else if(tankRoll<.18&&(!Number.isFinite(airCap)||th+4<=airCap)){const ax=(tx0+tx1)/2,az=(tz0+tz1)/2;det.geo(GEO.cyl,mtx(ax,th+2.2,az,1.4,2.4,1.4),COL(night?'#2a2440':'#7a6a5a'));det.box(ax-.06,th,az-.06,ax+.06,th+4,az+.06,cDet)}
  {const ar=mulberry32(((Math.round(x0*13)*73856093)^(Math.round(z0*13)*19349663)^(S.seed*31+7))>>>0),arr=(a,b)=>a+ar()*(b-a);
  const ext=[];if(curI){if(z0<curI[1]+1.5)ext.push('n');if(z1>curI[3]-1.5)ext.push('s');if(x0<curI[0]+1.5)ext.push('w');if(x1>curI[2]-1.5)ext.push('e')}else if(opts.face)ext.push(opts.face);if(opts.nrf&&!ext.includes(opts.nrf))ext.push(opts.nrf); /* v78 Neon Road: fachada/porta para a rua nova */
  const FL=f=>(f==='n'||f==='s')?[x0,x1-x0]:[z0,z1-z0];
  ar();const abandoned=fp.abandoned,nf=fp.floors;let doorInfo=null;
  /* v78 · outdoor no telhado: ~1 em 4 prédios com fachada pra rua; armação no lote sem sombra, face no atlas do chunk */
  {const br=mulberry32(((Math.round(x0*7)*2654435761)^(Math.round(z0*7)*40503)^(S.seed*17+3))>>>0),f=opts.face||ext[0];
   const bw=Math.min(8.4,((f==='n'||f==='s')?(tx1-tx0):(tz1-tz0))-2),bh=bw*.5,yb=th+1.6,top=yb+bh;
   if(f&&!EX&&!opts.simple&&!opts.patio&&!opts.safe&&!abandoned&&br()<.26&&bw>=5&&(!Number.isFinite(airCap)||top+.6<=airCap)){
    const tile=Math.floor(br()*ADS.N),post=COL('#4a4c54'),back=COL('#2a2c34');
    const cx=(tx0+tx1)/2,cz=(tz0+tz1)/2,o=1.1;let pts,P=[];
    if(f==='n'){const z=tz0+o;pts=[[cx+bw/2,yb,z],[cx-bw/2,yb,z],[cx-bw/2,top,z],[cx+bw/2,top,z]];roofD.box(cx-bw/2-.1,yb-.1,z+.02,cx+bw/2+.1,top+.1,z+.18,back);P=[[cx-bw*.3,z+.4],[cx+bw*.3,z+.4]]}
    else if(f==='s'){const z=tz1-o;pts=[[cx-bw/2,yb,z],[cx+bw/2,yb,z],[cx+bw/2,top,z],[cx-bw/2,top,z]];roofD.box(cx-bw/2-.1,yb-.1,z-.18,cx+bw/2+.1,top+.1,z-.02,back);P=[[cx-bw*.3,z-.4],[cx+bw*.3,z-.4]]}
    else if(f==='w'){const x=tx0+o;pts=[[x,yb,cz-bw/2],[x,yb,cz+bw/2],[x,top,cz+bw/2],[x,top,cz-bw/2]];roofD.box(x+.02,yb-.1,cz-bw/2-.1,x+.18,top+.1,cz+bw/2+.1,back);P=[[x+.4,cz-bw*.3],[x+.4,cz+bw*.3]]}
    else {const x=tx1-o;pts=[[x,yb,cz+bw/2],[x,yb,cz-bw/2],[x,top,cz-bw/2],[x,top,cz+bw/2]];roofD.box(x-.18,yb-.1,cz-bw/2-.1,x-.02,top+.1,cz+bw/2+.1,back);P=[[x-.4,cz-bw*.3],[x-.4,cz+bw*.3]]}
    for(const[px,pz] of P){roofD.box(px-.09,th,pz-.09,px+.09,top-.2,pz+.09,post);roofD.box(px-.06,yb-.6,pz-.06,px+.06,yb-.45,pz+.06,post)}
    // passarela e 3 refletores na base, virados pra placa (acendem com o neon da noite)
    {const a=pts[0],b=pts[1],dx=(b[0]-a[0])/bw,dz=(b[2]-a[2])/bw,nx=f==='w'?-1:f==='e'?1:0,nz=f==='n'?-1:f==='s'?1:0;
     for(let k=0;k<3;k++){const t=(k+.5)/3,x=a[0]+(b[0]-a[0])*t+nx*.6,z=a[2]+(b[2]-a[2])*t+nz*.6;roofD.box(x-.04,yb-.4,z-.04,x+.04,yb-.1,z+.04,post);neonDN.box(x-.16,yb-.42,z-.12,x+.16,yb-.3,z+.12,COL('#fff2c8'))}
     roofD.box(Math.min(a[0],b[0])+nx*.2-(nz?0:.3)+(nx<0?-.5:0),yb-.55,Math.min(a[2],b[2])+nz*.2-(nx?0:.3)+(nz<0?-.5:0),Math.max(a[0],b[0])+nx*.2+(nz?0:.3)+(nx>0?.5:0),yb-.48,Math.max(a[2],b[2])+nz*.2+(nx?0:.3)+(nz>0?.5:0),post)}
    (ch.ads=ch.ads||[]).push({pts,tile})}}

  const trim=wc.clone().multiplyScalar(.78),lightTrim=wc.clone().lerp(COL('#e2dcd0'),.25),glassDark=COL('#1c2632');det.ab=1;
  // One entrance bay, repeated floor heights and restrained plinth/cornice establish a common rhythm.
  if(opts.face){const f=opts.face,[fs,flen]=FL(f),bays=facadeBays(fs,flen),u=opts.patio?fs+flen/2:bays[Math.floor(bays.length/2)].u;
   if(flen>5){
    const bg=abandoned?det:hwin;
    fbox(x0,z0,x1,z1,f,u-1.32,u+1.32,.2,2.95,0,.075,det,trim);
    fbox(x0,z0,x1,z1,f,u-1.08,u+1.08,.25,2.72,.075,.10,bg,glassDark);
    fbox(x0,z0,x1,z1,f,u-.045,u+.045,.25,2.72,.10,.14,det,trim);
    fbox(x0,z0,x1,z1,f,u-1.52,u+1.52,3.02,3.20,0,.85,det,trim);
    fbox(x0,z0,x1,z1,f,u-1.4,u+1.4,.2,.28,0,.45,det,cSide.clone().multiplyScalar(.92));
    doorInfo={f,u};
    if(abandoned){const wood=COL(night?'#66513e':'#8d7051');for(const yy of [.65,1.22,1.79,2.36])fbox(x0,z0,x1,z1,f,u-1.06,u+1.06,yy,yy+.22,.11,.15,det,wood);fbox(x0,z0,x1,z1,f,u-.34,u+.34,2.78,2.92,.08,.13,det,COL('#a18c65'))}
    else{const dp=f==='n'?[u,z0-.35]:f==='s'?[u,z1+.35]:f==='w'?[x0-.35,u]:[x1+.35,u];if(opts.safe)setSafeDoor(dp[0],dp[1],f);else regDoor(dp[0],dp[1],f,u,false)}
   }
  }
  for(const f of EX?[]:ext){const[fs,flen]=FL(f),bays=facadeBays(fs,flen);
   // A continuous base and a single cornice frame the facade, without random mid-window stripes.
   fbox(x0,z0,x1,z1,f,fs,fs+flen,.25,.56,0,.07,lodNear,trim);
   fbox(x0,z0,x1,z1,f,fs-.04,fs+flen+.04,h-.28,h-.10,0,.13,lodNear,lightTrim);
   if(fp.family==='deco'){
    for(const edge of [fs+.20,fs+flen-.20])fbox(x0,z0,x1,z1,f,edge-.08,edge+.08,.56,h-.28,0,.11,lodNear,lightTrim);
    for(let k=2;k<bays.length;k+=3){const u=fs+k*bays[0].step;fbox(x0,z0,x1,z1,f,u-.07,u+.07,3.2,h-.28,0,.09,lodNear,lightTrim)}
    for(let k=2;k<nf;k+=3)fbox(x0,z0,x1,z1,f,fs+.28,fs+flen-.28,k*3.2-.12,k*3.2+.04,0,.085,lodNear,trim);
   }else if(fp.family==='office'){
    for(let k=2;k<nf;k+=2)fbox(x0,z0,x1,z1,f,fs+.20,fs+flen-.20,k*3.2-.12,k*3.2+.02,0,.065,lodNear,lightTrim);
   }
   if(!abandoned&&fp.family==='residential'&&f===opts.face&&h>10){
    const columns=bays.length>3?[1,bays.length-2]:bays.length>1?[0,bays.length-1]:[];
    for(const bi of [...new Set(columns)])for(let k=1;k<Math.min(nf,5);k++){
     const u=bays[bi].u,half=Math.min(1.23,bays[bi].step*.35),y=k*3.2+.06,rail=COL(night?'#88849a':'#64686c');
     fbox(x0,z0,x1,z1,f,u-.64,u+.64,y+.14,y+2.55,.01,.055,lodNear,trim);
     fbox(x0,z0,x1,z1,f,u-.52,u+.52,y+.22,y+2.43,.055,.075,hwin,glassDark);

     fbox(x0,z0,x1,z1,f,u-half,u+half,y,y+.14,.01,.92,lodNear,trim);
     fbox(x0,z0,x1,z1,f,u-half,u+half,y+.92,y+.98,.87,.93,lodNear,rail);
     for(const t of [u-half+.07,u,u+half-.07])fbox(x0,z0,x1,z1,f,t-.025,t+.025,y+.14,y+.92,.87,.93,lodNear,rail);
     for(const t of [u-half+.03,u+half-.03])fbox(x0,z0,x1,z1,f,t-.025,t+.025,y+.92,y+.98,.04,.90,lodNear,rail);
     if(ar()<.21){const d=.48,px=f==='n'?u:f==='s'?u:f==='w'?x0-d:x1+d,pz=f==='n'?z0-d:f==='s'?z1+d:u,py=y+.14,mx=f==='n'?0:f==='s'?0:f==='w'?-1:1,mz=f==='n'?-1:f==='s'?1:0;const q=spawnBalconyPed(px,pz,py,mx,mz);if(q)ch.peds.push(q)}
    }
   }
   // AC units share one vertical service bay and sit on the sill line, not random window centers.
   if(!abandoned&&bays.length>2&&fp.family==='residential')for(let k=1;k<nf;k+=2){const u=bays[bays.length-1].u,y=k*3.2+.39;fbox(x0,z0,x1,z1,f,u-.38,u+.38,y,y+.40,.02,.32,lodNear,COL(night?'#9690a1':'#c8c6bf'));fbox(x0,z0,x1,z1,f,u-.26,u+.26,y+.10,y+.28,.32,.335,lodNear,trim)}
   if(abandoned||fp.worn){
    const stain=COL(night?'#3a3340':'#796f61');
    // Wear collects under the cornice and along a drain, with no floating crosses over openings.
    const u=fs+.35;fbox(x0,z0,x1,z1,f,u,u+.12,.58,h-.40,.002,.018,lodNear,stain);
    for(let k=2;k<nf;k+=3)fbox(x0,z0,x1,z1,f,fs+.26,fs+flen-.26,k*3.2-.16,k*3.2-.09,.002,.015,lodNear,stain);
   }
  }
  /* v78 · toldos listrados nas lojas do térreo (fachada principal, fora da porta); sorteio próprio, 2 degraus por listra */
  if(!EX&&!abandoned&&!opts.patio&&!opts.safe&&!opts.simple&&!opts.tour&&opts.face&&!opts.linkedL){const tr=mulberry32(((Math.round(x0*5)*73856093)^(Math.round(z0*5)*83492791)^(S.seed*13+11))>>>0);
   if(tr()<(fp.family==='residential'?.3:.55)){const f=opts.face,[fs,flen]=FL(f),bays=facadeBays(fs,flen),PAL=[['#d8202a','#f4f0e6'],['#1e7a46','#f4f0e6'],['#1e5aa8','#f4f0e6'],['#f2a21a','#5a3422'],['#7a2a6a','#f2d6a0'],['#2a9ab0','#f4f0e6'],['#c83a3a','#f2c21a']],nA=Math.min(3,1+Math.floor(tr()*3));
    const free=bays.filter(b=>b.step>=2.6&&(!doorInfo||Math.abs(b.u-doorInfo.u)>b.step*.5+1.4));
    for(let i=0;i<nA&&free.length;i++){const b=free.splice(Math.floor(tr()*free.length),1)[0],pl=PAL[Math.floor(tr()*PAL.length)],c1=COL(pl[0]),c2=COL(pl[1]),half=b.step*.5-.18,ns=Math.max(3,Math.round(half*2/.42)),sw=half*2/ns;
     for(let k=0;k<ns;k++){const a=b.u-half+k*sw,c=k%2?c2:c1;fbox(x0,z0,x1,z1,f,a,a+sw,3.02,3.16,0,.6,det,c);fbox(x0,z0,x1,z1,f,a,a+sw,2.86,3.02,.6,1.2,det,c);fbox(x0,z0,x1,z1,f,a,a+sw,2.58,2.86,1.18,1.24,det,c)}}}}
  if(!abandoned&&!opts.patio&&opts.tour&&opts.face&&ar()<.75){const f=opts.face,[fs,flen]=FL(f),NC=st.neon||['#ff3a6a','#2ad6ff','#ffd23a','#7aff5a','#ff8a2a'],c1=COL(NC[Math.floor(ar()*NC.length)]),c2=COL(NC[Math.floor(ar()*NC.length)]),bk=COL('#18141e');
   const vert=ar()<.5&&h>14;let bw,bh;if(vert){bw=arr(1.6,2.3);bh=arr(5,Math.min(10,h-6))}else{bw=Math.min(arr(5,9),flen-2);bh=arr(1.4,2.2)}
   if(bw>1.2&&flen>bw+1.6){const u0=fs+arr(.8,flen-bw-.8),u1=u0+bw,y0=vert?arr(4,Math.max(4.2,h-bh-1.5)):arr(3.5,Math.min(h-bh-.5,7.5)),y1=y0+bh,t=.12;
    fbox(x0,z0,x1,z1,f,u0,u1,y0,y1,.02,.28,det,bk);fbox(x0,z0,x1,z1,f,u0,u1,y1-t,y1,.28,.38,neon,c1);fbox(x0,z0,x1,z1,f,u0,u1,y0,y0+t,.28,.38,neon,c1);fbox(x0,z0,x1,z1,f,u0,u0+t,y0,y1,.28,.38,neon,c1);fbox(x0,z0,x1,z1,f,u1-t,u1,y0,y1,.28,.38,neon,c1);
    worldSignQuad(signs,f,x0,z0,x1,z1,u0,u1,y0,y1,.3,worldSignPick(x0,z0,vert),vert);}
   const ac=COL(['#e04a3a','#2a8ad6','#f2c21a','#3ab36a','#ff6fae'][Math.floor(ar()*5)]);for(let k=0;k<2;k++){const a=fs+arr(1,Math.max(1.2,flen-6));fbox(x0,z0,x1,z1,f,a,a+4.5,3.1,3.3,0,1.5,det,ac);fbox(x0,z0,x1,z1,f,a,a+4.5,2.75,3.1,1.42,1.5,det,COL('#f4f4f0'))}}
  // roof antennas, masts and dishes
  det.ab=0;
  if((!opts.simple||ar()<.5)&&!Number.isFinite(airCap)){const pcl=COL(night?'#4a4460':'#6a6a6e'),na=ar()<.55?1+(ar()<.45?1:0)+(ar()<.2?1:0):0;
   for(let i=0;i<na;i++){let ax=arr(tx0+1,tx1-1),az=arr(tz0+1,tz1-1);const t=ar();if(EX){const q=exIn(ax,az,1.3);ax=q[0];az=q[1]}
    if(t<.3&&th>22&&!opts.ring){const mh=arr(6,12);det.box(ax-.09,th,az-.09,ax+.09,th+mh,az+.09,pcl);for(let y=th+2;y<th+mh-.5;y+=arr(1.8,2.6))det.box(ax-.6,y,az-.04,ax+.6,y+.08,az+.04,pcl);
     neon.box(ax-.14,th+mh,az-.14,ax+.14,th+mh+.28,az+.14,COL('#ff2a1a'))}
    else if(t<.72){const mh=arr(2.2,4.2),alongX=ar()<.5;det.box(ax-.05,th,az-.05,ax+.05,th+mh,az+.05,pcl);
     for(let k=0;k<3;k++){const y=th+mh-.15-k*.45,L=1.3-k*.3;if(alongX)det.box(ax-L/2,y,az-.03,ax+L/2,y+.05,az+.03,pcl);else det.box(ax-.03,y,az-L/2,ax+.03,y+.05,az+L/2,pcl)}}
    else{det.box(ax-.06,th,az-.06,ax+.06,th+.9,az+.06,pcl);det.geo(GEO.cone,mtx(ax,th+1.25,az,.75,.28,.75,0,arr(0,6.28),2.2),COL(night?'#9a96b0':'#e6e6e2'))}}}}
 // Registro da cobertura efetiva para a aproximação do aeroporto (sem novos objetos 3D).
 // O para-raios é fino, mas a margem adicional mantém as asas afastadas do telhado.
 airRoof.y=th+3;
 det.ab=1;
 if(night&&NS&&!fp.abandoned&&opts.face){
  const f=opts.face,fs=(f==='n'||f==='s')?x0:z0,flen=(f==='n'||f==='s')?w:d,cols=st.neon||['#ff4fa3','#33e6e6'],nc=COL(cols[fp.accent%cols.length]);
  fbox(x0,z0,x1,z1,f,fs+.20,fs+flen-.20,h-.34,h-.22,.10,.15,neon,nc);
  if(fp.family==='deco'&&h>14)for(const edge of [fs+.32,fs+flen-.32])fbox(x0,z0,x1,z1,f,edge-.045,edge+.045,3.4,h-.34,.10,.16,neon,nc);
  if(h>9&&flen>8){const step=flen/Math.max(1,Math.floor(flen/3.5)),u=fs+step,sw=Math.min(.85,step*.22),y=3.6,sh=Math.min(5.2,h-4.4),a=u-sw/2,b=u+sw/2;
   fbox(x0,z0,x1,z1,f,a,b,y,y+sh,.03,.17,det,COL('#15101e'));
   for(const edge of [a,b-.045])fbox(x0,z0,x1,z1,f,edge,edge+.045,y,y+sh,.17,.20,neon,nc);
   worldSignQuad(signs,f,x0,z0,x1,z1,a+.05,b-.05,y+.08,y+sh-.08,.205,worldSignPick(x0,z0,true),true);
  }

 }

 });
 // Register the visible footprint and the vertex range used by knockBin together.
 const registerBin=(x,z,v0,col,big=false)=>{
  let x0=Infinity,z0=Infinity,y0=Infinity,x1=-Infinity,z1=-Infinity,y1=-Infinity;
  for(let i=v0*3;i<bins.p.length;i+=3){
   const [px,py,pz]=[bins.p[i],bins.p[i+1],bins.p[i+2]];
   x0=Math.min(x0,px);x1=Math.max(x1,px);
   y0=Math.min(y0,py);y1=Math.max(y1,py);
   z0=Math.min(z0,pz);z1=Math.max(z1,pz);
  }
  const collider=addCol(x0,z0,x1,z1,'bin');
  collider.bin={x,z,v0,v1:bins.p.length/3,ch,col,big,height:y1-y0};
 };
 const alley=(x0,z0,x1,z1,opts={})=>{(city.bxAl||(city.bxAl=[])).push([x0,z0,x1,z1]);const along=(x1-x0)<(z1-z0),site={x0,z0,x1,z1,along,bins:[],ramp:false,weapon:false,interior:!!opts.interior,ri:curRi};
  {const ah=mulberry32(((Math.round(x0*3)*73856093)^(Math.round(z0*3)*19349663)^S.seed^0x5bd1)>>>0);if(!opts.interior&&ah()<.4){const len=along?z1-z0:x1-x0;if(len>24){const back=ah()<.5,id='A'+Math.round(x0)+','+Math.round(z0);
   site.ramp=true;if(!city.ramps.some(r=>r.id===id)){const cx=(x0+x1)/2,cz=(z0+z1)/2,L=6,dx=along?0:(back?-1:1),dz=along?(back?-1:1):0,sx=along?cx:(back?x1-1-L:x0+1),sz=along?(back?z1-1-L:z0+1):cz;
    const r={x:along?cx:(back?x1-1:x0+1),z:along?(back?z1-1:z0+1):cz,dx,dz,L,w:3,h:1.5,kind:'alley',insane:false,id,need:16};city.ramps.push(r);site.ramp=true}}}}
  // Miolos alternam ruas de servico relativamente limpas e vias com entulho.
  // A densidade total não é ampliada linearmente com a contagem de becos.
  const br=mulberry32(((S.seed>>>0)^Math.imul(Math.round(x0*11),73856093)^Math.imul(Math.round(z0*13),19349663)^0x8fa391)>>>0),n=opts.interior?(br()<.22?2:1):ri(0,2);
  let tPrev=null;const lenA=Math.max(1,along?z1-z0:x1-x0);
  for(let k=0;k<n;k++){let t=rr(.2,.8);// duas caçambas não podem se sobrepor (as faces coincidentes piscavam)
   if(tPrev!==null&&Math.abs(t-tPrev)*lenA<5.2)t=tPrev+(tPrev<.5?1:-1)*5.2/lenA;tPrev=t;const cx=along?(x0+x1)/2:x0+(x1-x0)*t,cz=along?z0+(z1-z0)*t:(z0+z1)/2;const hx=along?.6:.9,hz=along?.9:.6;
   // Mesmo sistema de lixeiras destrutiveis das casas: geometria em bins,
   // colisao do tipo bin e animacao/fisica pelo knockBin existente.
   const dc2=COL(pick(night?['#2a3a4a','#3a2a4a']:['#2f5a3a','#2a4a6a','#5a4a2a']));
   const v0=bins.p.length/3;
   bins.box(cx-hx,.2,cz-hz,cx+hx,1.4,cz+hz,dc2);
   bins.box(cx-hx-.05,1.4,cz-hz-.05,cx+hx+.05,1.5,cz+hz+.05,dc2.clone().multiplyScalar(.7));
   registerBin(cx,cz,v0,dc2,true);site.bins.push({x:cx,z:cz,r:Math.max(hx,hz)+.58});
  }
  const bagCount=opts.interior?1+Math.floor(br()*3):3;
  for(let k=0;k<bagCount;k++){
   const bx=rr(x0+.65,x1-.65),bz=rr(z0+.65,z1-.65),v0=bins.p.length/3;
   if(site.bins.some(b=>Math.hypot(b.x-bx,b.z-bz)<b.r+2.0))continue;
   const sz=rr(.29,.48),bagC=COL(pick(['#1c1c1e','#262629','#343337','#40413d']));
   bins.geo(GEO.ico,mtx(bx,.2+sz*.48,bz,sz,sz*.95,sz,rr(0,3),rr(0,3),0),bagC);
   registerBin(bx,bz,v0,bagC);site.bins.push({x:bx,z:bz,r:sz+.58});
  }
  {const pr=mulberry32(((Math.round(x0*5)*83492791)^(Math.round(z0*5)*19349663)^S.seed^0x7e57)>>>0),pr2=(a,b)=>a+pr()*(b-a),len=along?z1-z0:x1-x0,cnt=opts.interior?2+Math.floor(pr()*Math.min(6,1+len/5)):5+Math.floor(pr()*Math.min(9,len/4));
   for(let k=0;k<cnt;k++){const side=pr()<.5?0:1,t=pr2(.08,.92),e=.55;const px=along?(side?x1-e:x0+e):x0+(x1-x0)*t,pz=along?z0+(z1-z0)*t:(side?z1-e:z0+e);
    if(site.bins.some(b=>Math.hypot(b.x-px,b.z-pz)<b.r+1.7))continue;const v0=bins.p.length/3,kind=pr();let r0=.5,col;
    if(kind<.35){col=COL(pick(['#b08a5a','#c49a64','#9a7448']));const s=pr2(.32,.5),hh=pr2(.3,.6);bins.box(px-s,.2,pz-s,px+s,.2+hh,pz+s,col);if(pr()<.5){const s2=s*.8;bins.box(px-s2,.2+hh,pz-s2,px+s2,.2+hh+s2*1.2,pz+s2,col.clone().multiplyScalar(.9))}r0=s}
    else if(kind<.55){col=COL('#6a4a2e');bins.box(px-.45,.2,pz-.45,px+.45,.9,pz+.45,col);bins.box(px-.47,.5,pz-.47,px+.47,.58,pz+.47,col.clone().multiplyScalar(.75));r0=.47}
    else if(kind<.72){col=COL('#1a1a1c');for(let j=0,nn=1+Math.floor(pr()*3);j<nn;j++)bins.geo(GEO.cyl16,mtx(px,.32+j*.24,pz,.36,.22,.36),col);r0=.36}
    else if(kind<.86){col=COL(pick(['#3a5a8a','#8a3a2a','#3a6a3a','#6a6a6a']));bins.geo(GEO.cyl16,mtx(px,.65,pz,.32,.9,.32),col);bins.geo(GEO.cyl16,mtx(px,1.11,pz,.33,.04,.33),col.clone().multiplyScalar(.7));r0=.33}
    else{col=COL('#8a6a44');bins.box(px-.6,.2,pz-.5,px+.6,.36,pz+.5,col);for(let j=-1;j<=1;j++)bins.box(px-.62,.2,pz+j*.4-.06,px+.62,.24,pz+j*.4+.06,col.clone().multiplyScalar(.75));r0=.6}
    registerBin(px,pz,v0,col);site.bins.push({x:px,z:pz,r:r0+.5})}}
  if(night&&R()<.5){const cx=(x0+x1)/2,cz=(z0+z1)/2;glow.flat(cx-4,cz-4,cx+4,cz+4,.24,COL(pick(st.neon)).multiplyScalar(.35))}
  let gR=1;if(!site.ramp&&(gR=R())<.2){const id=ch.key+':g'+(gunN++),am=Math.floor(R()*101);if(!city.picked.has(id)){ /* v1r18: arma em metade dos becos — mesmo número de sorteios (seed intacta), só cria se gR<.1 */
   // Cada beco tem pontos candidatos ao longo do comprimento (não só nas saídas).
   const ts=[.18+R()*.18,.43+R()*.15,.67+R()*.17];let spot=null;
   for(const tt of ts){const gx=along?(x0+x1)/2:x0+(x1-x0)*tt,gz=along?z0+(z1-z0)*tt:(z0+z1)/2;
    if(site.bins.some(b=>Math.hypot(b.x-gx,b.z-gz)<b.r+1.2))continue;
    if(pickups.some(p=>Math.hypot(p.x-gx,p.z-gz)<16))continue;
    spot={x:gx,z:gz};break}
   if(spot&&gR<.1){site.weapon=true;const k=pickKind(id);makePickup(id,spot.x,spot.z,k==='jammer'?1:k==='rpg'?3+am%6:k==='smg'?60+am*1.4|0:k==='magnum'?6+am%7:am,ch,k)}
  }}
  {const aid=ch.key+':a'+Math.round(x0)+','+Math.round(z0);if(!site.ramp&&!site.weapon&&((Math.round(x0*7+z0*13)^S.seed)>>>0)%6===0&&!city.picked.has(aid)){
   const ax=along?(x0+x1)/2:x0+(x1-x0)*.72,az=along?z0+(z1-z0)*.72:(z0+z1)/2;
   if(!site.bins.some(b=>Math.hypot(b.x-ax,b.z-az)<b.r+1.2)&&!pickups.some(p=>Math.hypot(p.x-ax,p.z-az)<16))makePickup(aid,ax,az,100,ch,'armor')
  }}
  (city.catSpots=city.catSpots||[]).push({r:[x0,z0,x1,z1],bins:site.bins.filter(b=>b.r>1.1)});
  // Só becos realmente internos são candidatos a portal quando o novo layout existe.
  if(!site.ramp&&!site.weapon&&(!city.urbanLBlocks||!city.urbanLBlocks.has(curRi)||site.interior))city.alleySites.push(site);};
 // v232: caminhos da vila residencial. Gatos, lixeiras e itens podem usar
 // essas faixas, mas nunca entram em city.alleySites (portal so de predios).
 const residentialPassage=(x0,z0,x1,z1,ri,pathNo)=>{
  const along=(x1-x0)<(z1-z0),len=along?z1-z0:x1-x0;
  if(len<7||Math.min(x1-x0,z1-z0)<1.5)return;
  const site={r:[x0,z0,x1,z1],bins:[],ri,residential:true};
  city.catSpots.push(site);
  city.denseAlleySites.push(site);
  // Somente os corredores PÚBLICOS da v232 (os internos da parcela L
  // foram removidos): poucos NPCs podem andar por eles sem abrir caminhos L.
  const pathMidX=(x0+x1)/2,pathMidZ=(z0+z1)/2;
  city.denseWalkPaths.push({ri,points:along?[[pathMidX,z0+.65],[pathMidX,z1-.65]]:[[x0+.65,pathMidZ],[x1-.65,pathMidZ]]});
  // Pequeno lixo ao lado do corredor (sem fechar o eixo livre central).
  // Todo o sorteio e local; nao modifica a sequencia dos lotes nem das ruas.
  const seed=(Math.imul((ri+1)>>>0,0x4f1bbcdc)^Math.imul(pathNo+1,0x5bd1e995)^(S.seed>>>0))>>>0;
  const r=mulberry32(seed);
  if(r()>.58)return;
  const t=.18+r()*.64,side0=r()<.5?-1:1;
  const cx=along?(side0<0?x0+.28:x1-.28):x0+len*t;
  const cz=along?z0+len*t:(side0<0?z0+.28:z1-.28);
  const radius=.20+r()*.09,c=COL(r()<.5?'#313038':'#514b43'),v0=bins.p.length/3;
  bins.geo(GEO.ico,mtx(cx,.22+radius*.6,cz,radius,radius*.85,radius),c);
  const bc=addCol(cx-radius,cz-radius,cx+radius,cz+radius,'bin');
  bc.bin={x:cx,z:cz,v0,v1:bins.p.length/3,ch,col:c};site.bins.push({x:cx,z:cz,r:radius+.4});
 };
 const garage=isoCapture((x0,z0,x1,z1,face,ri,tune)=>{const n=face==='s'?[0,1]:face==='n'?[0,-1]:face==='e'?[1,0]:[-1,0],tg=[-n[1],n[0]];
  const fx=face==='e'?x1:face==='w'?x0:(x0+x1)/2,fz=face==='s'?z1:face==='n'?z0:(z0+z1)/2;
  const lb=(u0,u1,v0,v1,y0,y1,col,mb,coll)=>{const ax=fx+tg[0]*u0-n[0]*v0,az=fz+tg[1]*u0-n[1]*v0,bx=fx+tg[0]*u1-n[0]*v1,bz=fz+tg[1]*u1-n[1]*v1;
   const X0=Math.min(ax,bx),X1=Math.max(ax,bx),Z0=Math.min(az,bz),Z1=Math.max(az,bz);mb.box(X0,y0,Z0,X1,y1,Z1,col);if(coll)addCol(X0,Z0,X1,Z1,'bld');return[X0,Z0,X1,Z1]};
  const W=tune?4.6:3.5,Dp=tune?10:8.6,H=tune?5:4.3,wc=COL(tune?(night?'#3a2a48':'#5a5a62'):night?'#3a3048':'#8c8a86'),rc=COL(night?'#1a1528':'#5f5b57');
  lb(-W,W,Dp-.4,Dp,.2,H,wc,det,true);lb(-W,-W+.4,0,Dp,.2,H,wc,det,true);lb(W-.4,W,0,Dp,.2,H,wc,det,true);
  lb(-W,W,0,Dp,H,H+.35,rc,det,false);lb(-W+.4,W-.4,0,.35,H-.8,H,COL('#18181a'),det,false);lb(-W+.4,W-.4,0,Dp-.4,.2,.24,COL('#3a3a40'),det,false);
  const dv0=det.p.length; /* v79: começo da oficina no lote det (penumbra no fim) */
  if(!tune){lb(-2.4,2.4,-.35,-.05,H-.75,H-.2,COL(night?'#ff4fa3':'#ff8a1e'),neon,false);lb(-1.2,1.2,Dp*.35,Dp*.65,H-.12,H-.02,COL('#fff2c8'),neon,false)} /* v79: na oficina sem a barra rosa e sem a luminária grande (ficava dupla) */
  if(tune){ /* v79: sem painel preto e sem faixas/blocos neon — só o texto VELOZ E FURIOSO (letreiro transparente com brilho) */
   // All workshop furniture uses the same local frame as the bay and its collisions.
   const prop=(u0,u1,v0,v1,y0,y1,c,solid=false)=>lb(u0,u1,v0,v1,y0,y1,COL(c),det,solid);
   const pt=(u,y,v)=>[fx+tg[0]*u-n[0]*v,y,fz+tg[1]*u-n[1]*v];
   const blocker=(u0,u1,v0,v1)=>{const a=pt(u0,0,v0),b=pt(u1,0,v1);addCol(Math.min(a[0],b[0]),Math.min(a[2],b[2]),Math.max(a[0],b[0]),Math.max(a[2],b[2]),'bld')};
   // Tool cabinets, drawers and wall board; no oversized solid strip along the bay.
   prop(-4.08,-3.28,2.0,4.4,.24,1.2,'#95404c',true);
   for(let v=2.1;v<4.3;v+=.42){prop(-3.27,-3.24,v,v+.34,.4,1.08,'#b45b62');prop(-3.23,-3.2,v+.07,v+.26,.79,.84,'#b9c1bd')}
   prop(-4.12,-3.2,1.94,4.46,1.2,1.29,'#999e98',true);
   prop(-4.15,-4.07,2,4.4,1.5,2.7,'#49545c');
   for(let v=2.14;v<4.3;v+=.4){prop(-4.04,-3.99,v,v+.045,1.7,2.34,'#b0b9ba');prop(-4.04,-3.99,v-.07,v+.12,2.27,2.38,'#a0abaf')}
   // Back workbench with vise, small engine and diagnostic equipment.
   prop(-3.9,3.9,8.65,9.42,.24,1.05,'#48525a',true);
   prop(-3.98,3.98,8.56,9.48,1.05,1.15,'#aaa79a',true);
   prop(-3.3,-2.85,8.6,9.04,1.15,1.52,'#68808a');prop(-3.43,-2.74,8.58,8.72,1.4,1.58,'#959f9e');
   prop(-.85,.5,8.72,9.24,1.15,1.66,'#555c64');
   for(let u=-.7;u<.5;u+=.28)prop(u,u+.12,8.69,9.27,1.58,1.75,'#929b9d');
   prop(2.15,3.2,8.65,9.25,1.15,1.23,'#323b49');prop(2.32,3.05,9.06,9.14,1.23,1.85,'#2f3946');prop(2.37,3,9.04,9.055,1.29,1.79,'#6bacae');
   // Tire racks with visible rims instead of uncollidable cylinders.
   for(let k=0;k<3;k++){const v=3+k*1.45,p=pt(3.6,.59,v);det.geo(GEO.cyl,mtx(p[0],p[1],p[2],.48,.7,.48),COL('#262932'));blocker(3.1,4.1,v-.5,v+.5);const q=pt(3.6,.955,v);det.geo(GEO.cyl,mtx(q[0],q[1],q[2],.25,.035,.25),COL('#8e9a9f'));}
   prop(3.03,4.16,2.4,6.45,1.46,1.55,'#5a6870');
   for(const v of [2.45,6.4])prop(4.04,4.13,v-.04,v+.04,.24,2.2,'#67767c',true);
   // Compact compressor in the corner, clear of the entrance and service trigger.
   const cp=pt(-3.65,.67,6.3);det.geo(GEO.cyl,mtx(cp[0],cp[1],cp[2],.39,.86,.39),COL('#597e8a'));blocker(-4.07,-3.23,5.88,6.72);
   prop(-3.94,-3.4,6.08,6.5,1.1,1.34,'#3f4c56');prop(-3.57,-3.51,6.3,6.36,1.34,1.58,'#bcc3b7');
   // Lift posts flank the car, arms remain lowered. Decoration, no new lifting mechanic.
   for(const u of [-2.85,2.85]){prop(u-.16,u+.16,5.5,5.85,.24,3.55,'#627782',true);prop(u-.2,u+.2,5.47,5.88,3.55,3.7,'#b39d65');prop(Math.min(u,u*.55),Math.max(u,u*.55),5.52,5.7,.245,.3,'#ba9e61')}
   // Floor lane markings and ceiling strips are flush visual details, not obstacles.
   for(const u of [-2.35,2.35])for(let v=.8;v<8;v+=1.1)prop(u-.025,u+.025,v,v+.65,.245,.25,'#b9b19a');
   for(const u of [-2.4,2.4]){prop(u-.16,u+.16,1.4,8.1,H-.3,H-.21,'#5f666d');lb(u-.1,u+.1,1.45,8.05,H-.31,H-.3,COL(u<0?'#82b8bf':'#c590b5'),neon,false);}

   // Luminária interna da oficina: luz quente visível também durante o dia.
   const lx=fx-n[0]*Dp*.52,lz=fz-n[1]*Dp*.52;
   det.box(lx-.9,H-.42,lz-.32,lx+.9,H-.3,lz+.32,COL('#f4f0dc'));
   const lamp=new THREE.PointLight(0xffe9bd,1.15,13,2);lamp.position.set(lx,H-1.0,lz);city.group.add(lamp);
   // Letreiro frontal orientado conforme a rua, sem depender da curvatura da fachada.
   const signX=fx+n[0]*.1,signZ=fz+n[1]*.1; /* v79r4: letreiro encostado na fachada (antes 53 cm pra fora) */
   signPlane(ch.group,neonTextMat(translatePlain('VELOZ E FURIOSO'),'Silkscreen','#ff65dd',1024,160,'#ff2ad4'),signX,H+.75,signZ,W*1.9,1.1,Math.atan2(n[0],n[1]));
   /* v79: penumbra lá dentro (como os interiores): escurece as cores da oficina do fundo pra boca */
   for(let i=dv0;i<det.p.length;i+=3){const dx=det.p[i]-fx,dz=det.p[i+2]-fz,v=-(dx*n[0]+dz*n[1]),u=dx*tg[0]+dz*tg[1];if(v<.3||v>Dp+.1||Math.abs(u)>W+.1||det.p[i+1]>H+.36)continue;const k=.82-.42*clamp(v/Dp,0,1);det.c[i]*=k;det.c[i+1]*=k;det.c[i+2]*=k}
   const c0=[fx-n[0]*Dp*.5,fz-n[1]*Dp*.5];glow.flat(c0[0]-3.4,c0[1]-3.4,c0[0]+3.4,c0[1]+3.4,.25,COL('#ff2ad4').multiplyScalar(.55));city.tuneSpot={x:c0[0],z:c0[1],nx:n[0],nz:n[1]}}
  else{
   // Luminária de teto na garagem TOP SECRET, sem alterar o spawn do superesportivo.
   const lx=fx-n[0]*Dp*.52,lz=fz-n[1]*Dp*.52;
   det.box(lx-.75,H-.42,lz-.28,lx+.75,H-.30,lz+.28,COL('#e5fff6'));
   const lamp=new THREE.PointLight(0xc7fff0,1.15,12,2);lamp.position.set(lx,H-1.0,lz);city.group.add(lamp);
   // Garagem do superesportivo raro: identificação própria na fachada.
   const signX=fx+n[0]*.53,signZ=fz+n[1]*.53;
   signPlane(ch.group,mallSignMat('BACK TO THE PAST','#101820','#56f4d6',768,80),signX,H-.38,signZ,W*1.75,.72,Math.atan2(n[0],n[1]));
   const id='G'+ri;if(!city.taken.has(id)){const v=makeVehicle('super',fx-n[0]*Dp*.5,fz-n[1]*Dp*.5,Math.atan2(n[1],n[0]),'#92969d');v.hand=true;v.sleep=true;v.special=true;v.hasNitro=true;v.hasGlow=false;v.spotId=id;ch.cars.push(v)}}
  // building on the rest of the lot
  const rest=face==='s'?[x0,z0,x1,z1-Dp-1]:face==='n'?[x0,z0+Dp+1,x1,z1]:face==='e'?[x0,z0,x1-Dp-1,z1]:[x0+Dp+1,z0,x1,z1];
  if(rest[2]-rest[0]>7&&rest[3]-rest[1]>7)building(rest[0],rest[1],rest[2],rest[3],Math.round(rr(9,22)/3.2)*3.2,{})});
 const fbox=(X0,Z0,X1,Z1,f,u0,u1,y0,y1,d0,d1,mb,col)=>{if(f==='n')mb.box(u0,y0,Z0-d1,u1,y1,Z0-d0,col);else if(f==='s')mb.box(u0,y0,Z1+d0,u1,y1,Z1+d1,col);else if(f==='w')mb.box(X0-d1,y0,u0,X0-d0,y1,u1,col);else mb.box(X1+d0,y0,u0,X1+d1,y1,u1,col)};
 const roof=(x0,z0,x1,z1,y,rh,rc,wc)=>{const cx=(x0+x1)/2,cz=(z0+z1)/2,ref=[cx,y+rh*.3,cz],gc=wc.clone().multiplyScalar(.95),rc2=rc.clone().multiplyScalar(.86);
  const A=[x0,y,z0],B=[x1,y,z0],C=[x1,y,z1],Dd=[x0,y,z1];
  if(x1-x0>=z1-z0){const r0=[x0,y+rh,cz],r1=[x1,y+rh,cz];roofs2.qa(A,B,r1,r0,rc,ref);roofs2.qa(Dd,C,r1,r0,rc2,ref);roofs2.qa(A,Dd,r0,r0,gc,ref);roofs2.qa(B,C,r1,r1,gc,ref)}
  else{const r0=[cx,y+rh,z0],r1=[cx,y+rh,z1];roofs2.qa(A,Dd,r1,r0,rc,ref);roofs2.qa(B,C,r1,r0,rc2,ref);roofs2.qa(A,B,r0,r0,gc,ref);roofs2.qa(Dd,C,r1,r1,gc,ref)}};
 const garBuild=isoCapture((x0,z0,x1,z1,face,gar)=>{const gp=COL(night?'#4a4458':'#b8b2a6'),yl=COL('#ffd21a'),dk=COL(night?'#3a3448':'#6a6660'),n0=face==='s'?[0,1]:face==='n'?[0,-1]:face==='e'?[1,0]:[-1,0],ns0=face==='n'||face==='s';
   const fr=face==='s'?z1:face==='n'?z0:face==='e'?x1:x0,dep=7.2,G=(u0,u1,v0,v1,y0,y1,col,mb)=>{const a=ns0?[u0,fr-n0[1]*v0]:[fr-n0[0]*v0,u0],b=ns0?[u1,fr-n0[1]*v1]:[fr-n0[0]*v1,u1];(mb||det).box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]};
   G(gar[0],gar[1],0,dep,.2,.26,gp,side);const mid=(gar[0]+gar[1])/2;for(const u of [gar[0]+.1,mid-.06,gar[1]-.16])G(u,u+.12,.3,dep-.3,.26,.28,yl,marks);G(gar[0]+.1,gar[1]-.04,dep-.42,dep-.3,.26,.28,yl,marks);
   const wl=G(gar[0],gar[1],dep,dep+.3,.2,2.6,dk);addCol(wl[0],wl[1],wl[2],wl[3],'bld');G(gar[0]-.1,gar[1]+.1,1.2,dep+.3,2.6,2.75,dk);for(const u of [gar[0]+.1,gar[1]-.3])G(u,u+.2,1.2,1.4,.26,2.6,dk);
   const sl=[];for(const u of [(gar[0]+mid)/2,(mid+gar[1])/2]){const p=ns0?[u,fr-n0[1]*3.6]:[fr-n0[0]*3.6,u];sl.push({x:p[0],z:p[1],a:Math.atan2(-n0[1],-n0[0])})}return sl});
 const garLotB=(x0,z0,x1,z1,face)=>{if(city.info[curRi]?.kind!=='houses'){side.box(x0+.15,0.2,z0+.15,x1-.15,0.24,z1-.15,cGrass,{});lawn(x0+.4,z0+.4,x1-.4,z1-.4,.244,.8);}const ns0=face==='n'||face==='s',c=ns0?(x0+x1)/2:(z0+z1)/2;
  const sl=garBuild(x0,z0,x1,z1,face,[c-4.1,c+4.1]);city.garSlots=sl;if(city.safe)applySafeSlots(sl)};
 const houseDetails=(x0,z0,x1,z1,h,rh,front,door,wc,rc,style)=>{
  const pr=mulberry32(((Math.round(x0*23)*73856093)^(Math.round(z0*23)*19349663)^(S.seed*53))>>>0),family=Math.floor(pr()*3),trim=COL(style.abandoned?'#a49c8b':family===1?'#e2d3b8':'#ece7dc'),wood=COL(family===2?'#435a55':'#76553b'),glass=COL(style.abandoned?'#20292c':'#344957'),dark=wc.clone().multiplyScalar(.62),metal=COL('#696d69');
  const fq=(f,a,b,y0,y1,d,col,mb=lodMid)=>{let q;if(f==='s')q=[[a,y0,z1+d],[b,y0,z1+d],[b,y1,z1+d],[a,y1,z1+d]];else if(f==='n')q=[[b,y0,z0-d],[a,y0,z0-d],[a,y1,z0-d],[b,y1,z0-d]];else if(f==='e')q=[[x1+d,y0,b],[x1+d,y0,a],[x1+d,y1,a],[x1+d,y1,b]];else q=[[x0-d,y0,a],[x0-d,y0,b],[x0-d,y1,b],[x0-d,y1,a]];mb.qa(...q,col,[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2])};
  const windows=houseWindowPlan(x0,z0,x1,z1,front,door);
  for(const q of windows)fq(q.f,q.u-q.w/2,q.u+q.w/2,1.04,2.10,.044,glass,lodFarWindow);
  for(const q of windows){const a=q.u-q.w/2,b=q.u+q.w/2,y0=1.04,y1=2.10;
   fq(q.f,a-.11,b+.11,y0-.1,y1+.1,.012,dark);fq(q.f,a,b,y0,y1,.025,glass,!style.abandoned&&pr()<.28?hwin:lodMid);
   for(const [u,v,Y0,Y1] of [[a-.08,a,y0-.08,y1+.08],[b,b+.08,y0-.08,y1+.08],[a,b,y0-.08,y0],[a,b,y1,y1+.08]])fq(q.f,u,v,Y0,Y1,.06,trim);
   fq(q.f,q.u-.025,q.u+.025,y0,y1,.065,trim);fq(q.f,a,b,1.61,1.65,.065,trim);
   fbox(x0,z0,x1,z1,q.f,a-.14,b+.14,y0-.14,y0-.08,.015,.17,lodMid,trim.clone().multiplyScalar(.85));
   if(q.f===front&&style.shutters&&Math.abs(q.u-door)>q.w/2+1.02){for(const [u,v] of [[a-.32,a-.13],[b+.13,b+.32]]){fq(q.f,u,v,y0-.03,y1+.03,.035,wood);for(const y of [1.26,1.55,1.84])fq(q.f,u+.025,v-.025,y,y+.035,.045,dark)}}
   if(style.abandoned){for(let k=0;k<2;k++)fq(q.f,a-.035,b+.035,1.23+k*.43,1.38+k*.43,.095,COL(k?'#927750':'#a38b65'))}
  }
  // Door surround, recessed panels, handle and a shallow threshold stay aligned to the actual entrance.
  fq(front,door-.62,door-.5,.24,2.29,.10,trim);fq(front,door+.5,door+.62,.24,2.29,.10,trim);fq(front,door-.62,door+.62,2.20,2.32,.10,trim);
  for(const y of [.55,1.30])fq(front,door-.35,door+.35,y,y+.49,.075,wood);fq(front,door+.33,door+.40,1.08,1.18,.11,COL('#bca56e'));
  fbox(x0,z0,x1,z1,front,door-.66,door+.66,.26,.34,0,.33,lodMid,trim.clone().multiplyScalar(.78));
  if(style.porch&&!style.abandoned){const ns=front==='n'||front==='s',len=ns?x1-x0:z1-z0,aw=Math.min(2.5,len-.6),canopy=COL(family===2?'#48685e':'#82664c');fbox(x0,z0,x1,z1,front,door-aw/2,door+aw/2,2.38,2.51,.03,.85,lodMid,canopy);
   for(const u of [door-aw*.38,door+aw*.38])fbox(x0,z0,x1,z1,front,u-.035,u+.035,2.16,2.38,.04,.45,lodMid,trim)}
  // Eaves, ridge cap and a single downpipe form one restrained roof-detail kit.
  for(const f of ['n','s','e','w']){const ns=f==='n'||f==='s',a=ns?x0:z0,b=ns?x1:z1;fbox(x0,z0,x1,z1,f,a-.34,b+.34,h-.10,h+.025,.27,.40,lodMid,trim.clone().multiplyScalar(.87))}
  const alongX=x1-x0>=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  if(alongX)lodMid.box(x0-.4,h+rh-.03,cz-.075,x1+.4,h+rh+.065,cz+.075,rc.clone().multiplyScalar(.9));else lodMid.box(cx-.075,h+rh-.03,z0-.4,cx+.075,h+rh+.065,z1+.4,rc.clone().multiplyScalar(.9));
  for(const f of alongX?['e','w']:['n','s']){const u=alongX?cz:cx;fq(f,u-.22,u+.22,h+.25,h+.62,.045,dark);for(const y of [h+.32,h+.44,h+.56])fq(f,u-.19,u+.19,y,y+.025,.055,trim)}
  const a=front==='n'||front==='s'?x0:z0;fbox(x0,z0,x1,z1,front,a+.15,a+.22,.55,h-.08,.08,.15,lodMid,metal);
 };
 const buildHouseFence=(plan)=>{if(!plan)return;ch.houseFenceLines=ch.houseFenceLines||new Map();ch.houseFencePosts=ch.houseFencePosts||new Set();const white=plan.kind==='white',wood=COL(white?'#eee9dc':'#815735'),shade=COL(white?'#d1cbbf':'#67432a'),base=.24,h=white?.98:1.02;
 for(const edge of plan.segments)for(const q of claimFenceSpan(ch.houseFenceLines,edge)){const H=q.z0===q.z1,L=H?q.x1-q.x0:q.z1-q.z0,point=t=>[q.x0+(H?t:0),q.z0+(H?0:t)],box=(a,b,y0,y1,w,col)=>{const A=point(a),B=point(b);lodNear.box(H?A[0]:A[0]-w/2,y0,H?A[1]-w/2:A[1],H?B[0]:B[0]+w/2,y1,H?B[1]+w/2:B[1],col)};
 const posts=Math.max(1,Math.ceil(L/2.6));for(let k=0;k<=posts;k++){const [x,z]=point(L*k/posts),pk=x.toFixed(3)+','+z.toFixed(3);if(ch.houseFencePosts.has(pk))continue;ch.houseFencePosts.add(pk);lodNear.box(x-.075,base,z-.075,x+.075,base+h+.08,z+.075,wood)}
 for(const y of white?[base+.26,base+.65]:[base+.35,base+.76])box(0,L,y,y+(white?.065:.15),white?.055:.08,shade);
 if(white){const n=Math.max(1,Math.floor(L/plan.spacing)),step=L/n,w=Math.min(.13,step*.31);for(let k=0;k<n;k++){const t=step*(k+.5),A=point(t-w/2),B=point(t+w/2),C=point(t),y=base+h-.13;
 for(const sign of [-1,1]){const dx=H?0:sign*.027,dz=H?sign*.027:0,ref=[C[0]-dx,base+.4,C[1]-dz];lodNear.qa([A[0]+dx,base,A[1]+dz],[B[0]+dx,base,B[1]+dz],[B[0]+dx,y,B[1]+dz],[A[0]+dx,y,A[1]+dz],wood,ref);lodNear.qa([A[0]+dx,y,A[1]+dz],[B[0]+dx,y,B[1]+dz],[C[0]+dx,base+h,C[1]+dz],[C[0]+dx,base+h,C[1]+dz],wood,ref)}}}
 const c=addCol(Math.min(q.x0,q.x1)-.065,Math.min(q.z0,q.z1)-.065,Math.max(q.x0,q.x1)+.065,Math.max(q.z0,q.z1)+.065,'rock');c.low=base+h;
 }};
 // Uma árvore do jardim deve respeitar o recuo real da casa, não só os limites do lote.
 // Candidatos na lateral da área frontal (oposta à porta). Não cria árvore atravessando paredes.
 const houseTreeSpot=(x0,z0,x1,z1,hx0,hz0,hx1,hz1,face,door)=>{
  const side=door<(face==='n'||face==='s'?(x0+x1)/2:(z0+z1)/2)?1:-1;
  const px=side>0?x1-.85:x0+.85,pz=side>0?z1-.85:z0+.85;
  const pos=face==='s'?[px,z1-.65]:face==='n'?[px,z0+.65]:face==='e'?[x1-.65,pz]:[x0+.65,pz];
  const [tx,tz]=pos,dx=Math.max(hx0-tx,0,tx-hx1),dz=Math.max(hz0-tz,0,tz-hz1);
  if(!Number.isFinite(tx)||!Number.isFinite(tz)||Math.hypot(dx,dz)<1.65)return null;
  return pos;
 };
 // As parcelas em L são uniões de três micro-lotes: 1 casa + 2 jardins.
 // Os corredores entre membros do mesmo L viram gramado, sem cerca interna.
 let denseParcelByKey=new Map(),residentialFenceDone=new Set();
 const denseParcelFence=(x0,z0,x1,z1,face,door,garage,member,force=false)=>{
  if(!member)return houseFencePlan(S.seed,x0,z0,x1,z1,face,door,garage,force);
  if(!member.fenced&&!force)return null;
  const edges=[['n',x0,z0,x1,z0],['s',x0,z1,x1,z1],['w',x0,z0,x0,z1],['e',x1,z0,x1,z1]],segments=[];
  for(const [f,a,b,c,d] of edges){if(member.shared.has(f))continue;
   const H=f==='n'||f==='s',lo=H?a:b,hi=H?c:d;let spans=[[lo,hi]];
   if(f===face&&Number.isFinite(door))for(const [g0,g1] of [[door-1.1,door+1.1],...(garage?[[garage[0]-.4,garage[1]+.4]]:[])]){
    const next=[];for(const [u,v] of spans){if(g1<=u||g0>=v)next.push([u,v]);else{if(g0>u)next.push([u,g0]);if(g1<v)next.push([g1,v])}}spans=next
   }
   for(const [u,v] of spans)if(v-u>.45)segments.push(H?{x0:u,z0:b,x1:v,z1:b}:{x0:a,z0:u,x1:a,z1:v});
  }
  return{kind:member.kind,segments,spacing:.72}
 };
 const house=isoCapture((x0,z0,x1,z1,face,safe)=>{
  if(city.info[curRi]?.kind!=='houses'){side.box(x0+.15,0.2,z0+.15,x1-.15,0.24,z1-.15,cGrass,{});lawn(x0+.4,z0+.4,x1-.4,z1-.4,.244,.8);}
  if(!face){if(R()<.7)tree((x0+x1)/2+rr(-2,2),(z0+z1)/2+rr(-2,2),.24,rr(.9,1.3));return}
  const fs=rr(2.5,4.5),ss=safe?.5:rr(1.2,2.2),bs0=rr(1.5,3),plan=worldPoolPlan(x0,z0,x1,z1,face,safe,bs0),bs=plan?plan.bs:bs0;let hx0=x0+ss,hz0=z0+ss,hx1=x1-ss,hz1=z1-ss;
  if(face==='s'){hz1=z1-fs;hz0=z0+bs}else if(face==='n'){hz0=z0+fs;hz1=z1-bs}else if(face==='e'){hx1=x1-fs;hx0=x0+bs}else{hx0=x0+fs;hx1=x1-bs}
  let gar=null;
  if(safe===true){
   // A reserva privada é grande para caber garagem + jardim + helicóptero,
   // mas a construção TEM apenas ~10x9 m, como as outras casas residenciais.
   const ns0=face==='n'||face==='s',span=ns0?x1-x0:z1-z0,depth=ns0?z1-z0:x1-x0;
   const width=Math.min(10.4,Math.max(8.8,span*.37)),dep=Math.min(9.1,Math.max(7.8,depth*.34)),margin=2.35;
   const side0=(ns0?x0:z0)+margin;
   if(ns0){hx0=side0;hx1=side0+width;hz0=face==='n'?z0+fs:z1-fs-dep;hz1=hz0+dep}
   else{hz0=side0;hz1=side0+width;hx0=face==='w'?x0+fs:x1-fs-dep;hx1=hx0+dep}
   const g0=side0+width+1.15,g1=Math.min((ns0?x1:z1)-.75,g0+8.5);
   if(g1-g0>=7.2)gar=[g0,g1];
  }else if(safe){const ns0=face==='n'||face==='s',gw=safe==='del'?4.9:7.9;
   if((ns0?hx1-hx0:hz1-hz0)>=gw+(safe==='del'?3.2:5)){if(ns0){hx1-=gw;gar=[hx1+.5,x1-.25]}else{hz1-=gw;gar=[hz1+.5,z1-.25]}}
  }
  if(hx1-hx0<5||hz1-hz0<5)return;
  if(gar){const sl=garBuild(x0,z0,x1,z1,face,gar);if(safe==='del')city.delSlot={x:(sl[0].x+sl[1].x)/2,z:(sl[0].z+sl[1].z)/2,a:sl[0].a};else SAFE.slotsNext=sl}
  const wc=COL(pick(HOUSE_WALLS)).multiplyScalar(rr(.92,1.04)),rc=COL(pick(HOUSE_ROOFS)),h=rr(2.9,3.5);
  const houseCap=airportFootprintLimit(hx0,hz0,hx1,hz1);
  det.box(hx0,.24,hz0,hx1,h,hz1,wc);det.box(hx0-.06,.24,hz0-.06,hx1+.06,.55,hz1+.06,wc.clone().multiplyScalar(.72));addCol(hx0,hz0,hx1,hz1,'bld');
  const rh=Math.min(rr(1.2,2.1),Number.isFinite(houseCap)?Math.max(.75,houseCap-h-1.8):Infinity);city.airHouses=city.airHouses||[];city.airHouses.push({x0:hx0-.5,z0:hz0-.5,x1:hx1+.5,z1:hz1+.5,y:h+rh+2,ri:curRi});roof(hx0-.4,hz0-.4,hx1+.4,hz1+.4,h,rh,rc,wc);
  {const ar=mulberry32(((Math.round(x0*11)*73856093)^(Math.round(z0*11)*19349663)^(S.seed*17+3))>>>0),t=ar(),pcl=COL('#5a5a5e');const alongX=(hx1-hx0)>=(hz1-hz0),cx=(hx0+hx1)/2,cz=(hz0+hz1)/2;
   if(t<.6&&(!Number.isFinite(houseCap)||h+rh+2.6<=houseCap)){const k=.2+ar()*.6,ax=alongX?hx0+(hx1-hx0)*k:cx,az=alongX?cz:hz0+(hz1-hz0)*k,y0=h+rh-.15,mh=1.4+ar()*1.2;det.box(ax-.04,y0,az-.04,ax+.04,y0+mh,az+.04,pcl);
    for(let j=0;j<3;j++){const y=y0+mh-.1-j*.35,L=1.1-j*.25;if(alongX)det.box(ax-.025,y,az-L/2,ax+.025,y+.04,az+L/2,pcl);else det.box(ax-L/2,y,az-.025,ax+L/2,y+.04,az+.025,pcl)}}
   else if(t<.85&&(!Number.isFinite(houseCap)||h+rh+1.2<=houseCap)){
    // Parabólica sobre a cumeeira: antes o mastro ficava na parede lateral e sob o beiral.
    const sd=ar()<.5?-1:1;
    const ax=alongX?cx+sd*(hx1-hx0)*.27:cx;
    const az=alongX?cz:cz+sd*(hz1-hz0)*.27;
    const y0=h+rh-.13;
    det.box(ax-.05,y0,az-.05,ax+.05,y0+.94,az+.05,pcl);
    det.geo(GEO.cone,mtx(ax,y0+1.07,az,.45,.16,.45,0,ar()*6.28,2.2),COL('#e8e8e4'))
   }}
  /* v78 · caixa d'água azul de fibra (no telhado, sem sombra) e varal com roupas no quintal dos fundos; sorteio próprio */
  {const xr=mulberry32(((Math.round(x0*19)*2654435761)^(Math.round(z0*19)*40503)^(S.seed*29+5))>>>0),cx=(hx0+hx1)/2,cz=(hz0+hz1)/2,alongX=(hx1-hx0)>=(hz1-hz0);
   if(!safe&&xr()<.45&&(!Number.isFinite(houseCap)||h+rh+.6<=houseCap)){const s2=xr()<.5?-1:1,ax=alongX?cx+s2*(hx1-hx0)*.36:cx,az=alongX?cz:cz+s2*(hz1-hz0)*.36,y0=h+rh-.25;
    roofD.box(ax-.65,y0,az-.65,ax+.65,y0+.12,az+.65,COL('#8a8478'));roofD.geo(GEO.cyl,mtx(ax,y0+.5,az,.55,.76,.55),COL('#2a6ab0'));roofD.geo(GEO.cyl,mtx(ax,y0+.92,az,.6,.08,.6),COL('#3a7ac0'))}
   const back=face==='s'?[z0,hz0,'z']:face==='n'?[hz1,z1,'z']:face==='e'?[x0,hx0,'x']:[hx1,x1,'x'];
   if(!plan&&xr()<.5&&back[1]-back[0]>=1.6){const m=(back[0]+back[1])/2,pole=COL('#7a7a7e'),cols=['#f4f4f0','#d8202a','#2a6ab0','#f2c21a','#ff8fd0','#3ab36a','#6a4a8a'];
    const a0=(back[2]==='z'?hx0:hz0)+1,a1=(back[2]==='z'?hx1:hz1)-1;if(a1-a0>2.5){const P=(t,y)=>back[2]==='z'?[t,y,m]:[m,y,t];
     for(const t of[a0,a1]){const q=P(t,0);det.box(q[0]-.04,.24,q[2]-.04,q[0]+.04,1.85,q[2]+.04,pole)}
     {const q0=P(a0,1.8),q1=P(a1,1.8);det.box(Math.min(q0[0],q1[0]),1.79,Math.min(q0[2],q1[2])-.01,Math.max(q0[0],q1[0])+.01,1.81,Math.max(q0[2],q1[2])+.01,pole)}
     for(let t=a0+.35;t<a1-.3;t+=.55+xr()*.4){if(xr()<.25)continue;const w=.3+xr()*.25,hh=.35+xr()*.35,c=COL(cols[Math.floor(xr()*cols.length)]),q=P(t,0);
      if(back[2]==='z')det.box(t-w/2,1.8-hh,m-.02,t+w/2,1.8,m+.02,c);else det.box(m-.02,1.8-hh,t-w/2,m+.02,1.8,t+w/2,c)}}}}
  const ns=face==='n'||face==='s',fl=ns?hx1-hx0:hz1-hz0,fu=ns?hx0:hz0,dU=fu+fl*rr(.3,.7);
  fbox(hx0,hz0,hx1,hz1,face,dU-.5,dU+.5,.24,2.2,0,.06,det,COL(pick(['#5a3a24','#2a3a5a','#7a2a2a','#2a4a2a'])));{const dp=face==='n'?[dU,hz0-.3]:face==='s'?[dU,hz1+.3]:face==='w'?[hx0-.3,dU]:[hx1+.3,dU];if(safe===true)setSafeDoor(dp[0],dp[1],face);else regDoor(dp[0],dp[1],face,dU,true)}
  for(const u of [fu+.9,fu+fl-2.1])if(Math.abs(u+.6-dU)>1.4)R(); // preserve the original per-lot random stream
  if(face==='s')side.box(dU-.55,.2,hz1,dU+.55,.27,z1,cSide,{});else if(face==='n')side.box(dU-.55,.2,z0,dU+.55,.27,hz0,cSide,{});else if(face==='e')side.box(hx1,.2,dU-.55,x1,.27,dU+.55,cSide,{});else side.box(x0,.2,dU-.55,hx0,.27,dU+.55,cSide,{});
  const hv=mulberry32(((Math.round(hx0*17)*73856093)^(Math.round(hz0*17)*19349663)^(S.seed*13+11))>>>0),porch=hv()<.34,shutters=hv()<.55,abH=hv()<.07;
  if(porch)R(); // old awning-color draw; new details use their independent seed
  houseDetails(hx0,hz0,hx1,hz1,h,rh,face,dU,wc,rc,{porch,shutters,abandoned:abH&&!safe});
  if(R()<.65){R();R()} // preserve the old wall-color/height draws without drawing duplicate walls
  {const key=x0.toFixed(1)+','+z0.toFixed(1),member=denseParcelByKey.get(key);
   const force=city.info[curRi]?.kind==='houses'&&!residentialFenceDone.has(curRi);
   const fencePlan=denseParcelFence(x0,z0,x1,z1,face,dU,gar,member,force);
   if(fencePlan&&fencePlan.segments.length)residentialFenceDone.add(curRi);
   buildHouseFence(fencePlan)}
  {const hr=mulberry32(((Math.round(x0*7)*73856093)^(Math.round(z0*7)*19349663)^S.seed)>>>0);
   if(hr()<.32&&!plan){// clothesline in the back yard
    const by=face==='s'?hz0-(hz0-z0)/2:face==='n'?hz1+(z1-hz1)/2:0,bxx=face==='e'?hx0-(hx0-x0)/2:face==='w'?hx1+(x1-hx1)/2:0,pc2=COL('#8a8a86');
    const A=ns?[hx0+.6,by]:[bxx,hz0+.6],B=ns?[hx1-.6,by]:[bxx,hz1-.6];
    if(ns?Math.abs(by-(face==='s'?z0:z1))>1.2:Math.abs(bxx-(face==='e'?x0:x1))>1.2){
     det.box(A[0]-.05,.24,A[1]-.05,A[0]+.05,2,A[1]+.05,pc2);det.box(B[0]-.05,.24,B[1]-.05,B[0]+.05,2,B[1]+.05,pc2);
     if(ns)det.box(A[0],1.9,by-.012,B[0],1.93,by+.012,COL('#dddddd'));else det.box(bxx-.012,1.9,A[1],bxx+.012,1.93,B[1],COL('#dddddd'));
     const L=ns?B[0]-A[0]:B[1]-A[1];for(let u=.4;u<L-.4;u+=.55+hr()*.35){const w=.35+hr()*.3,hh=.45+hr()*.45,cc=COL(['#e04a3a','#2a8ad6','#f2c21a','#ffffff','#3ab36a','#ff8fc8','#7a4ad6','#1e2a5a'][Math.floor(hr()*8)]);
      const vi=clothes.p.length/3;if(ns)clothes.box(A[0]+u,1.9-hh,by-.03,A[0]+u+w,1.9,by+.03,cc);else clothes.box(bxx-.03,1.9-hh,A[1]+u,bxx+.03,1.9,A[1]+u+w,cc);for(let v=vi;v<clothes.p.length/3;v++)clothPins.push(ns?0:1,1.9,hh);u+=w}}}
   if(hr()<.45){// trash cans on the sidewalk, knockable
    const off=dU+(hr()<.5?-1:1)*(1.4+hr()*1.2),cv0=COL(['#2f5a3a','#3a3a40','#2a4a7a','#7a6a2a'][Math.floor(hr()*4)]);
    const p0=ns?[off,face==='s'?z1+1.1:z0-1.1]:[face==='e'?x1+1.1:x0-1.1,off];
    for(let k=0;k<(hr()<.4?2:1);k++){const bx=p0[0]+(ns?k*.75:0),bz=p0[1]+(ns?0:k*.75);const v0=bins.p.length/3;
     bins.geo(GEO.cyl,mtx(bx,.65,bz,.3,.9,.3),cv0);bins.geo(GEO.cyl,mtx(bx,1.13,bz,.33,.07,.33),cv0.clone().multiplyScalar(.75));
     registerBin(bx,bz,v0,cv0);}}}
  if(R()<.45&&!gar&&(!city.info[curRi]?.denseHouse||mulberry32(((Math.round(x0*37)*73856093)^(Math.round(z0*37)*19349663)^S.seed^0x32323232)>>>0)()<.24)){const spot=houseTreeSpot(x0,z0,x1,z1,hx0,hz0,hx1,hz1,face,dU);if(spot)tree(spot[0],spot[1],.24,rr(.8,1.1))}if(plan)worldPoolBuild({det,side,wat,neon},plan,face,x0,z0,x1,z1,hx0,hz0,hx1,hz1);if(safe===true)safeYardBuild({det,side,wat,tree},face,x0,z0,x1,z1,hx0,hz0,hx1,hz1);});
 const parkCar=(x,z,a,id)=>{const type=pick(['sedan','taxi','sports','van','pickup','sedan','hatch','suv','conv','hatch','wagon','crossover','mini','roadster']);if(city.taken.has(id))return;const v=makeVehicle(type,x,z,a,parkedCityColor(type,id));v.hand=true;v.sleep=true;v.spotId=id;ch.cars.push(v)};
 // Acesso real: rasgo de 4,8m no passeio + pista asfaltada da rua ate a vaga.
 // O gerador recorta a laje ANTES de materializar o mesh, sem plano de asfalto sobre calçada.
 const parkingAccess=(x0,z0,x1,z1)=>{
  parkingGroundAdd(x0,z0,x1,z1);
  const r=city.rects[curRi];if(!r)return null;
  // v77: no máximo UM rebaixamento por quadra; os demais pátios usam o mesmo acesso.
  if(city.parkingLots.some(l=>l.ri===curRi&&l.access))return null;
  const cx=(x0+x1)/2,cz=(z0+z1)/2,width=4.8,hw=width/2;
  const near=[
   {face:'w',gap:Math.abs(x0-r[0]),u:cz,road:groundY0(r[0]-7.4,cz)===0},
   {face:'e',gap:Math.abs(r[2]-x1),u:cz,road:groundY0(r[2]+7.4,cz)===0},
   {face:'n',gap:Math.abs(z0-r[1]),u:cx,road:groundY0(cx,r[1]-7.4)===0},
   {face:'s',gap:Math.abs(r[3]-z1),u:cx,road:groundY0(cx,r[3]+7.4)===0}
  ].filter(e=>e.road&&((e.face==='n'||e.face==='s')?(x1-x0>=width+.6):(z1-z0>=width+.6)));
  if(!near.length)return null;
  near.sort((a,b)=>a.gap-b.gap);const face=near[0].face;
  // Centro da abertura a uma vaga de distancia do canto, com passagem para 1 van.
  let cut,entry;
  if(face==='n'||face==='s'){
   const u=clamp(x0+Math.min(6,(x1-x0)*.28),x0+hw+.25,x1-hw-.25),a=u-hw,b=u+hw;
   cut=face==='n'?[a,r[1]-.03,b,z0+.25]:[a,z1-.25,b,r[3]+.03];
   entry={x:u,z:face==='n'?r[1]+.6:r[3]-.6,a:face==='n'?Math.PI/2:-Math.PI/2,face,cut,width};
  }else{
   const u=clamp(z0+Math.min(6,(z1-z0)*.28),z0+hw+.25,z1-hw-.25),a=u-hw,b=u+hw;
   cut=face==='w'?[r[0]-.03,a,x0+.25,b]:[x1-.25,a,r[2]+.03,b];
   entry={x:face==='w'?r[0]+.6:r[2]-.6,z:u,a:face==='w'?0:Math.PI,face,cut,width};
  }
  // Extend through the additional sidewalk along narrow streets.
  const extra=RW/2-3.9+.04;
  if(face==='n')cut[1]-=extra;if(face==='s')cut[3]+=extra;
  if(face==='w')cut[0]-=extra;if(face==='e')cut[2]+=extra;
  parkingGroundAdd(...cut);
  // Mesma textura e altura da rua; os 20 cm de calçada SERÃO AUSENTES aqui.
  // O asfalto texturizado do chão global já está exatamente em y=0.
  // Não cobrir com um box cinza sem textura: fica idêntico à rua.
  return entry
 };
 const finishParkingSidewalk=(bx0,bz0,bx1,bz1,ri,col)=>{
  let pieces=[[bx0,bz0,bx1,bz1]];
  for(const lot of city.parkingLots){if(lot.ri!==ri)continue;
   // Remove BOTH the entire parking slab and its connector from the raised sidewalk.
   for(const hole of [[lot.x0,lot.z0,lot.x1,lot.z1],...(lot.access?.cut?[lot.access.cut]:[])]){
    const [hx0,hz0,hx1,hz1]=hole,next=[];
    for(const [x0,z0,x1,z1] of pieces){const a=Math.max(x0,hx0),b=Math.max(z0,hz0),c=Math.min(x1,hx1),d=Math.min(z1,hz1);
     if(a>=c||b>=d){next.push([x0,z0,x1,z1]);continue}
     if(x0<a)next.push([x0,z0,a,z1]);if(c<x1)next.push([c,z0,x1,z1]);
     if(z0<b)next.push([a,z0,c,b]);if(d<z1)next.push([a,d,c,z1]);
    }pieces=next;
   }
  }
  for(const [x0,z0,x1,z1] of pieces)if(x1-x0>.005&&z1-z0>.005)sideSlab(side,x0,0,z0,x1,.2,z1,col);
  // v77: piso de CONCRETO nos pátios e nos rebaixamentos (antes era o asfalto da rua aparecendo).
  // Fica 3 cm acima do asfalto (física continua em y=0) e usa a textura de juntas da calçada.
  // Tom varia por lote para quebrar a repetição; o rebaixamento sai um pouco mais claro.
  const sub=(list,hole)=>{const out=[];for(const [x0,z0,x1,z1] of list){const [hx0,hz0,hx1,hz1]=hole,a=Math.max(x0,hx0),b=Math.max(z0,hz0),c=Math.min(x1,hx1),d=Math.min(z1,hz1);
    if(a>=c||b>=d){out.push([x0,z0,x1,z1]);continue}if(x0<a)out.push([x0,z0,a,z1]);if(c<x1)out.push([c,z0,x1,z1]);if(z0<b)out.push([a,z0,c,b]);if(d<z1)out.push([a,d,c,z1])}return out};
  const done=[];
  // Recorta ao contorno do quarteirão: o concreto nunca avança sobre a rua.
  const pour=(rect0,shade)=>{const rect=[Math.max(rect0[0],bx0),Math.max(rect0[1],bz0),Math.min(rect0[2],bx1),Math.min(rect0[3],bz1)];if(rect[2]<=rect[0]||rect[3]<=rect[1])return;let parts=[rect];for(const h of done)parts=sub(parts,h);done.push(rect);
   for(const [x0,z0,x1,z1] of parts)if(x1-x0>.02&&z1-z0>.02)side.box(x0,0,z0,x1,.03,z1,shade,{})};
  const lots=city.parkingLots.filter(l=>l.ri===ri);
  // Rebaixamentos primeiro (tom mais claro, faixa contínua da rua até o pátio).
  // Danceteria: entradas e o miolo diagonal são RUA contínua (asfalto); só a ilha da esquina é calçada.
  const isl=city.casino?.clubRi===ri?city.casino.clubIsland:null;
  if(isl){const D=isl.road||24;done.push([isl.x-D,isl.z,isl.x,isl.z+D]);
   const cc=col.clone().multiplyScalar(.9);side.quad([isl.x-D,.03,isl.z+D],[isl.x,.03,isl.z+D],[isl.x-D,.03,isl.z],[isl.x-D,.03,isl.z],0,1,0,[0,0,1,1],cc)}
  for(const lot of lots)if(lot.access?.cut&&lot.tag!=='club-drive'){const c=col.clone().multiplyScalar(.97);pour(lot.access.cut,c)}
  for(const lot of lots){if(lot.tag==='club-drive'||lot.tag.startsWith('club-park'))continue;const h=((Math.round(lot.x0*7)*73856093)^(Math.round(lot.z0*7)*19349663)^(S.seed*31))>>>0,v=(h%1000)/1000;
   const c=col.clone().multiplyScalar(.84+v*.1);c.r=Math.min(1,c.r*(1+(v-.5)*.05));c.b*=1-(v-.5)*.05;pour([lot.x0,lot.z0,lot.x1,lot.z1],c)}
 };
 /* --- frame helper for big lots: u runs along the front, v goes inward from the front --- */
 const LF=(f,X0,Z0,X1,Z1)=>{const ns=f==='n'||f==='s',W=ns?X1-X0:Z1-Z0,D=ns?Z1-Z0:X1-X0;
  const pt=(u,v)=>f==='s'?[X0+u,Z1-v]:f==='n'?[X0+u,Z0+v]:f==='e'?[X1-v,Z0+u]:[X0+v,Z0+u];
  const box=(u0,u1,v0,v1,y0,y1,col,mb,coll,o)=>{const a=pt(u0,v0),b=pt(u1,v1),x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),z0=Math.min(a[1],b[1]),z1=Math.max(a[1],b[1]);(mb||det).box(x0,y0,z0,x1,y1,z1,col,o);if(coll)addCol(x0,z0,x1,z1,coll===true?'bld':coll);return[x0,z0,x1,z1]};
  const p3=(u,y,v)=>{const p=pt(u,v);return[p[0],y,p[1]]};const nrm=f==='s'?[0,1]:f==='n'?[0,-1]:f==='e'?[1,0]:[-1,0];return{W,D,pt,box,p3,nrm,f}};

 /* v77: laterais e fundos dos prédios especiais — menos "caixote" sem pesar: no máx. ~5 caixas por vão (pilastra,
    peitoril+vidro em 2 alturas) e 4 por face (rodapé, friso, cornija, mureta); canteiro em 1 a cada 3 vãos.
    Vai no lodNear: some com a distância e não projeta sombra (sombra de detalhe só com "sombras detalhadas"). */
 const dressPal=(wall)=>{const w=wall.clone(),hsl={};w.getHSL(hsl);const tr=w.clone().offsetHSL(0,-.04,hsl.l>.6?-.1:.1);
  return{skin:w.clone(),base:w.clone().multiplyScalar(.7),trim:tr,trim2:tr.clone().multiplyScalar(.9),glass:COL(night?'#38405a':'#4a5864'),
   planter:COL(night?'#5a4e5e':'#8c7a68'),leaf:COL(night?'#2c4a34':'#3f7a45'),door:COL(night?'#3a3848':'#4a4c54'),ac:COL(night?'#7a7888':'#a8aab0')}};
 const dressWall=(xa,za,xb,zb,nx,nz,H,P,o={})=>{const L=Math.hypot(xb-xa,zb-za);if(L<3||H<2.5)return;const tx=(xb-xa)/L,tz=(zb-za)/L,y0=o.y0||0,M=lodNear;
  const B=(t0,t1,d0,d1,a,b,c)=>{const ax=xa+tx*t0+nx*d0,az=za+tz*t0+nz*d0,bx=xa+tx*t1+nx*d1,bz=za+tz*t1+nz*d1;M.box(Math.min(ax,bx),a,Math.min(az,bz),Math.max(ax,bx),b,Math.max(az,bz),c,{noTop:b-a>1})};
  B(0,L,0,.07,y0,y0+.5,P.base);
  if(o.cornice!==false)B(-.15,L+.15,0,.26,H-.45,H+.05,P.trim);
  if(H>7.5)B(0,L,0,.1,H*.5-.08,H*.5+.08,P.trim);
  if(o.rail!==false)B(0,L,-.2,-.05,H,H+.75,P.trim2); // mureta na borda da laje (no lugar dos montantes do guarda-corpo)
  const nb=Math.max(1,Math.round(L/6.4)),bw=L/nb;
  for(let k=1;k<nb;k++){const t=k*bw;B(t-.22,t+.22,0,.12,y0+.5,H-.45,P.trim)}
  // janelas como nos prédios gerados: 1 quad com a textura de janelas da cidade (acende à noite), em vez de caixas
  {const ex=nz,ez=-nx,fw=(tx*ex+tz*ez)>0,sx=fw?xa:xb,sz=fw?za:zb,qx=sx+ex*L,qz=sz+ez*L,d=.03,ya=y0+.5,yb=H-.45,Wn=o.win||[.25,.5],Ws=o.winStyle||[28,25.6],
    uv=[Wn[0],ya/Ws[1]+Wn[1],Wn[0]+L/Ws[0],yb/Ws[1]+Wn[1]],c=o.skin||P.skin; // winStyle=[m por 8 janelas na horizontal, m por 8 na vertical]: muda proporção e espaçamento
   walls.quad([sx+nx*d,ya,sz+nz*d],[qx+nx*d,ya,qz+nz*d],[qx+nx*d,yb,qz+nz*d],[sx+nx*d,yb,sz+nz*d],nx,0,nz,uv,c)}
  for(let k=0;k<nb;k++){const t=(k+.5)*bw,hw=Math.min(1.1,bw*.28);
   if(o.door&&k===Math.floor(nb/2)){B(t-.65,t+.65,0,.05,y0,y0+2.3,P.door);B(t-.85,t+.85,0,.6,y0+2.42,y0+2.54,P.trim2);continue}
   if(o.plants!==false&&k%3===1){B(t-hw,t+hw,.08,.55,y0,y0+.45,P.planter);const p=[xa+tx*t+nx*.32,za+tz*t+nz*.32];M.geo(GEO.ico,mtx(p[0],y0+.66,p[1],hw*.75,.3,.3,k,0,0),P.leaf)}}};
 // caixa alinhada aos eixos: veste as 3 faces que não são a frente (nx,nz = normal da frente)
 const dressBox=(x0,z0,x1,z1,H,fx,fz,P,o={})=>{const F4=[[x0,z0,x1,z0,0,-1],[x1,z0,x1,z1,1,0],[x1,z1,x0,z1,0,1],[x0,z1,x0,z0,-1,0]];
  for(const [a,b,c,d,nx,nz] of F4){if(nx===fx&&nz===fz)continue;dressWall(a,b,c,d,nx,nz,H,P,{...o,door:o.door!==false&&nx===-fx&&nz===-fz})}
  if(o.ac!==false){const cx=(x0+x1)/2,cz=(z0+z1)/2,bx=cx-fx*(x1-x0)*.25,bz=cz-fz*(z1-z0)*.25;for(const s2 of [-1,1]){const ox=bx+(fz?s2*3:0),oz=bz+(fx?s2*3:0);lodNear.box(ox-.9,H,oz-.7,ox+.9,H+1.1,oz+.7,P.ac)}}};

 /* v77: MOTEL MIRAGEM — motel de beira de estrada em L ao lado do posto (no lugar do pátio da borracharia).
    6 quartos (4 na perna longa, 2 na curta), varanda coberta com pilares, neon vermelho na borda do telhado,
    recepção (guarita), letreiro alto com seta, coqueiros, cerca velha e estacionamento. Só o quarto 6 é entrável. */
 const motelBuild=(F,u0,u1,v0,v1,ri)=>{const W=u1-u0,D=v1-v0;if(W<34||D<34)return false;
  // v77 (2): motel de beira de estrada em L, 2 andares, no porte do motel abandonado do GTA V.
  // Lógica do terreno: entrada de carro pela frente (ao lado da recepção e do letreiro) → corredor de manobra em L
  // com vagas de bico para os quartos → piscina num pátio cercado (carro não chega nela) com coqueiros em canteiros.
  const C=h=>COL(h),jr=mulberry32(((ri*9277)^S.seed^0x6d07)>>>0),yaw=Math.atan2(F.nrm[0],F.nrm[1]);
  const wallC=C(night?'#d6c2b2':'#e8dcc4'),wall2=wallC.clone().multiplyScalar(.88),trim=C(night?'#4a5aa0':'#2d5d96'),roofC=C(night?'#352a40':'#5a4636'),doorC=C('#5e3a22'),
   winC=C(night?'#ffc77a':'#6f8088'),curtC=C(night?'#b06a3a':'#b88552'),acC=C('#bdbdb4'),walk=C(night?'#5a5464':'#a49e92'),post=C(night?'#4a4458':'#ece4d4'),red=C('#ff2a32'),nRed=C(mallPal().b),nCy=C(mallPal().a),NE=night?neon:neonDN /* v78: neon do motel — rosa/ciano em Sunset Shores, vermelho no Synthwave; apagado de dia */,
   wood=C(night?'#4a3a34':'#8a6a4a'),wood2=wood.clone().multiplyScalar(.8),asph=C(night?'#2c2a34':'#4a4a4e'),line=C(night?'#b89a2a':'#e2b81e'),white=C(night?'#9a96a8':'#e8e6e0'),
   wallLow=C(night?'#8a8494':'#d8d0c0'),soil=C(night?'#2a2420':'#5a4030'),gold=C('#d8b04a');
  const B=(a,b,c,d,y0,y1,col,mb=det,coll=false)=>F.box(u0+Math.min(a,b),u0+Math.max(a,b),v0+Math.min(c,d),v0+Math.max(c,d),y0,y1,col,mb,coll);
  const G=(a,b)=>F.pt(u0+a,v0+b),o0=F.pt(0,0),o1=F.pt(1,0),o2=F.pt(0,1),U=[o1[0]-o0[0],o1[1]-o0[1]],V=[o2[0]-o0[0],o2[1]-o0[1]];
  const colR=(a,b,c,d,k,low)=>{const A=G(a,c),Bp=G(b,d),cc=addCol(Math.min(A[0],Bp[0]),Math.min(A[1],Bp[1]),Math.max(A[0],Bp[0]),Math.max(A[1],Bp[1]),k||'rock');if(low)cc.low=low;return cc}; /* r46: low = dá pra pular (circleVsWorld) */
  const ctr=G(W/2,D/2),floors=airportHeightLimit(ctr[0],ctr[1])>=7.6?2:1;
  const rw=4.4,rd=6.8,Hf=3.3,Ht=Hf*floors,wd=2.0,stall=5.2,aisle=7.0;
  const su1=W-1.6,su0=su1-rd,lv1=D-1.6,lv0=lv1-rd,uL0=5,sv0=Math.min(15,D*.3);
  const nL=Math.floor((su0-uL0-.2)/rw),nS=Math.floor((lv0-sv0-.2)/rw);if(nL<4||nS<2)return false;
  // ---------- corpo, faixa entre andares, telhado com beiral e neon ----------
  B(uL0,su1,lv0,lv1,0,Ht,wallC,det,true);B(su0,su1,sv0,lv0,0,Ht,wallC,det,true);
  B(uL0-.06,su1+.06,lv0-.06,lv1+.06,0,.4,wall2);B(su0-.06,su1+.06,sv0-.06,lv0,0,.4,wall2);
  if(floors>1){B(uL0-.05,su0,lv0-.05,lv0,Hf-.18,Hf+.05,trim);B(su0-.05,su0,sv0,lv0,Hf-.18,Hf+.05,trim)}
  B(uL0-.35,su1+.35,lv0-wd-.25,lv1+.35,Ht,Ht+.34,roofC);B(su0-wd-.25,su1+.35,sv0-.35,lv0-wd-.25,Ht,Ht+.34,roofC);
  B(uL0-.35,su0-wd-.25,lv0-wd-.3,lv0-wd-.22,Ht+.02,Ht+.14,nRed,NE);B(su0-wd-.3,su0-wd-.22,sv0-.35,lv0-wd-.3,Ht+.02,Ht+.14,nRed,NE);
  B(uL0-.37,su0-wd-.25,lv0-wd-.28,lv0-wd-.24,Ht-.14,Ht,trim);B(su0-wd-.28,su0-wd-.24,sv0-.35,lv0-wd-.25,Ht-.14,Ht,trim);
  /* v78 · motel encardido por fora: manchas suaves no shader (estilo do interior do shopping), região em CITY_AGE.box */
  {const A=G(-2,-2),Bq=G(W+2,D+2);CITY_AGE.box.value.set(Math.min(A[0],Bq[0]),Math.min(A[1],Bq[1]),Math.max(A[0],Bq[0]),Math.max(A[1],Bq[1]));CITY_AGE.boxH.value=Hf}
  // ---------- varandas: térreo + passarela do 2º andar com guarda-corpo, pilares ----------
  B(uL0,su0,lv0-wd,lv0,0,.15,walk);B(su0-wd,su0,sv0,lv0-wd,0,.15,walk);
  if(floors>1){B(uL0,su0,lv0-wd,lv0,Hf-.16,Hf,walk);B(su0-wd,su0,sv0,lv0-wd,Hf-.16,Hf,walk);
   const rail=(a0,b0,a1,b1)=>{const L=Math.hypot(a1-a0,b1-b0),n=Math.max(1,Math.round(L/.55));B(a0,a1,b0,b1,Hf+.95,Hf+1.03,post);B(a0,a1,b0,b1,Hf+.08,Hf+.14,post);
    for(let k=0;k<=n;k++){const t=k/n,a=a0+(a1-a0)*t,b=b0+(b1-b0)*t;B(a-.025,a+.025,b-.025,b+.025,Hf+.14,Hf+.95,post)}};
   rail(uL0+1.4,lv0-wd+.04,su0-wd,lv0-wd+.04);rail(su0-wd+.04,sv0+1.4,su0-wd+.04,lv0-wd)}
  for(let u=uL0+.1;u<su0-wd;u+=rw){B(u-.11,u+.11,lv0-wd+.04,lv0-wd+.26,.15,Ht,post);colR(u-.15,u+.15,lv0-wd,lv0-wd+.3)}
  for(let v=sv0+.1;v<lv0-wd;v+=rw){B(su0-wd+.04,su0-wd+.26,v-.11,v+.11,.15,Ht,post);colR(su0-wd,su0-wd+.3,v-.15,v+.15)}
  B(su0-wd+.04,su0-wd+.26,lv0-wd+.04,lv0-wd+.26,.15,Ht,post);
  // ---------- fachada dos quartos (porta, janela com cortina, ar-condicionado, plaquinha) ----------
  const rooms=[];
  const room=(along,a,y,n)=>{const seg=(t0,t1,y0,y1,dd,col,mb)=>along==='u'?B(a+t0,a+t1,lv0-dd,lv0,y+y0,y+y1,col,mb):B(su0-dd,su0,a+t0,a+t1,y+y0,y+y1,col,mb);
   seg(.55,1.55,.15,2.25,.06,doorC);seg(.45,1.65,2.25,2.37,.1,trim);seg(1.32,1.42,1.05,1.2,.1,gold);seg(.85,1.25,1.55,1.75,.08,C('#e8dcc0'));
   seg(2.1,3.9,1.0,2.05,.05,winC);seg(2.1,2.75,1.0,2.05,.07,curtC);seg(3.3,3.9,1.0,2.05,.07,curtC);seg(2.02,3.98,.93,1.0,.12,trim);
   if(jr()<.75)seg(2.6,3.4,.45,.9,.42,acC);if(night&&jr()<.3)seg(2.1,3.9,1.0,2.05,.04,C('#ffe0a0'));
   const pp=along==='u'?G(a+1.05,lv0-.05):G(su0-.05,a+1.05);rooms.push({n,pp,along,a,y});return pp};
  let num=1;for(let f=0;f<floors;f++){const y=f*Hf;for(let k=0;k<nL;k++)room('u',uL0+.2+k*rw,y,(f?100:0)+num++);for(let k=0;k<nS;k++)room('v',sv0+.2+k*rw,y,(f?100:0)+num++);num=1}
  const r6=rooms.find(r=>r.n===6)||rooms[0];
  // v78: número de TODOS os quartos na plaquinha creme da própria porta (atlas único + 1 malha; antes só o 6, numa placa dourada à parte)
  {const cols=8,rowsN=Math.ceil(rooms.length/cols),cw=64,chh=32,c=cv(cols*cw,rowsN*chh),g=c.getContext('2d');g.fillStyle='#e8dcc0';g.fillRect(0,0,c.width,c.height);
   g.fillStyle='#2a1a10';g.font='900 25px Georgia,serif';g.textAlign='center';g.textBaseline='middle';
   rooms.forEach((r,i)=>g.fillText(String(r.n),(i%cols)*cw+cw/2,Math.floor(i/cols)*chh+chh/2+1));
   const t=new THREE.CanvasTexture(c);t.anisotropy=4;const pm=new MB(),wc=C('#ffffff');
   rooms.forEach((r,i)=>{const P=t0=>r.along==='u'?G(r.a+t0,lv0-.084):G(su0-.084,r.a+t0),A=P(.87),Bp=P(1.23),y0=r.y+1.57,y1=r.y+1.73,nr=r.along==='u'?[-V[0],-V[1]]:[-U[0],-U[1]];
    let L=A,R=Bp;const ex=R[0]-L[0],ez=R[1]-L[1];if(ez*nr[0]-ex*nr[1]>0){L=Bp;R=A} // esquerda→direita vista de frente
    const u0=(i%cols)/cols,u1=(i%cols+1)/cols,v1=1-Math.floor(i/cols)/rowsN,v0=1-(Math.floor(i/cols)+1)/rowsN;
    pm.quad([L[0],y0,L[1]],[R[0],y0,R[1]],[R[0],y1,R[1]],[L[0],y1,L[1]],nr[0],0,nr[1],[u0,v0,u1,v1],wc)});
   const m=pm.mesh(new THREE.MeshLambertMaterial({map:t}),false,true);if(m)ch.group.add(m)}
  // ---------- escadas para a passarela (ponta da perna longa e frente da perna curta) ----------
  if(floors>1){const stairs=(along,s0,s1,runA,runB)=>{const n=12;for(let k=0;k<n;k++){const t0=runA+(runB-runA)*k/n,t1=runA+(runB-runA)*(k+1)/n,h=Hf*(k+1)/n;
     if(along==='v')B(s0,s1,Math.min(t0,t1),Math.max(t0,t1),h-.18,h,C(night?'#6a6474':'#b4ada0'));else B(Math.min(t0,t1),Math.max(t0,t1),s0,s1,h-.18,h,C(night?'#6a6474':'#b4ada0'))}
    const sl=C(night?'#4a4458':'#8a8478');if(along==='v'){B(s0-.06,s0,Math.min(runA,runB),Math.max(runA,runB),0,1.0,sl);B(s1,s1+.06,Math.min(runA,runB),Math.max(runA,runB),0,1.0,sl);colR(s0-.06,s1+.06,Math.min(runA,runB),Math.max(runA,runB))}
    else{B(Math.min(runA,runB),Math.max(runA,runB),s0-.06,s0,0,1.0,sl);B(Math.min(runA,runB),Math.max(runA,runB),s1,s1+.06,0,1.0,sl);colR(Math.min(runA,runB),Math.max(runA,runB),s0-.06,s1+.06)}};
   stairs('v',uL0+.05,uL0+1.3,lv0-wd-4.8,lv0-wd);stairs('u',sv0+.05,sv0+1.3,su0-wd-4.8,su0-wd)}
  // ---------- pátio: asfalto do corredor em L, entrada, vagas de bico com carros ----------
  const aL0=lv0-wd-stall-aisle,aL1=lv0-wd-stall,aS0=su0-wd-stall-aisle,aS1=su0-wd-stall;
  B(uL0,su0-wd,aL0,lv0-wd,.03,.045,asph,lodNear);B(aS0,su0-wd,0,aL0,.03,.045,asph,lodNear);
  for(let v=2;v<aL0-1;v+=3)B((aS0+aS1)/2-.07,(aS0+aS1)/2+.07,v,v+1.5,.046,.048,line,lodNear);
  for(let u=uL0+2;u<aS0-1;u+=3)B(u,u+1.5,(aL0+aL1)/2-.07,(aL0+aL1)/2+.07,.046,.048,line,lodNear);
  const carA=(dx,dz)=>Math.atan2(dz,dx);
  let pk=0;const park=(x,z,a)=>{if(jr()<.45)parkCar(x,z,a,'motel'+ri+':'+(pk++))};
  const r6u=(()=>{const r=rooms.find(q=>q.n===6);return r&&r.along==='u'?r.a+1.05:-99})();
  for(let u=uL0+1.6;u+2.8<=su0-wd-.2;u+=2.8){B(u,u+.12,aL1,lv0-wd-.6,.046,.048,line,lodNear);B(u+.6,u+2.2,lv0-wd-1.0,lv0-wd-.75,.03,.14,white);const p=G(u+1.4,aL1+stall/2-.35);if(Math.abs(u+1.4-r6u)>1.6)park(p[0],p[1],carA(V[0],V[1]))}
  for(let v=sv0+1.6;v+2.8<=aL0-.4;v+=2.8){B(aS1,su0-wd-.6,v,v+.12,.046,.048,line,lodNear);B(su0-wd-1.0,su0-wd-.75,v+.6,v+2.2,.03,.14,white);const p=G(aS1+stall/2-.35,v+1.4);park(p[0],p[1],carA(U[0],U[1]))}
  // telhado: condensadoras, respiros e caixa d'água
  for(let k=0;k<Math.floor(nL/2);k++){const u=uL0+2+k*rw*2;B(u,u+1.1,lv0+2,lv0+2.8,Ht+.34,Ht+1.0,acC);B(u+.15,u+.95,lv0+1.98,lv0+2.0,Ht+.45,Ht+.9,C('#7a7a74'))}
  for(let k=0;k<Math.floor(nS/2);k++){const v=sv0+2+k*rw*2;B(su0+2,su0+2.8,v,v+1.1,Ht+.34,Ht+1.0,acC)}
  B(su0+1.5,su0+4,lv0+1,lv0+3.5,Ht+.34,Ht+1.8,C(night?'#5a5a66':'#9aa0a6'));
  // ---------- recepção junto à entrada, ao lado do letreiro (janela de check-in virada para a pista) ----------
  const rc0=aS1+.6,rc1=Math.min(su1-.5,rc0+4.6),rv0=2.0,rv1=Math.min(sv0-1.5,rv0+4.0);
  B(rc0,rc1,rv0,rv1,0,3.0,wallC,det,true);B(rc0-.05,rc0,rv0+.7,rv1-.7,1.0,2.1,winC);B(rc0-.25,rc0,rv0+.6,rv1-.6,.95,1.0,trim);B(rc0+.2,rc0+1.2,rv0-.05,rv0,.0,2.2,doorC);
  B(rc0-.6,rc1+.4,rv0-.6,rv1+.4,3.0,3.22,roofC);B(rc0-.62,rc0-.56,rv0-.6,rv1+.4,3.04,3.16,nRed,NE);
  {const p=F.p3(u0+(rc0+rc1)/2,2.65,v0+rv0-.05);signPlane(ch.group,mallSignMat('RECEPÇÃO','#1c1a24','#ffcf6a',256,48),p[0]-F.nrm[0]*.02,p[1],p[2]-F.nrm[1]*.02,2.6,.45,yaw)}
  // ---------- letreiro alto na esquina, ao lado da recepção ----------
  {const lu=Math.min(W-2.2,rc1+2.4),lv=3.0,p=G(lu,lv),dy=Math.max(-4.6,Math.min(0,airportHeightLimit(p[0],p[1])-.4-10.55));det.box(p[0]-.16,0,p[1]-.16,p[0]+.16,7.2+dy,p[1]+.16,C('#6a5040'));addCol(p[0]-.3,p[1]-.3,p[0]+.3,p[1]+.3,'pole');
   const c=cv(512,300),g=c.getContext('2d');g.fillStyle='#14233a';g.beginPath();g.moveTo(30,40);g.lineTo(470,20);g.lineTo(490,210);g.lineTo(40,240);g.closePath();g.fill();g.strokeStyle='#e8c060';g.lineWidth=8;g.stroke();
   g.fillStyle=night?'#ff5a4a':'#ff7ad8';g.font='italic 700 74px Georgia,serif';g.textAlign='center';g.fillText('Miragem',258,118);g.font='800 70px Inter,Arial,sans-serif';g.fillStyle='#fff0c8';g.fillText('MOTEL',262,200);
   g.fillStyle='#ffcc3a';for(let k=0;k<14;k++){g.beginPath();g.arc(60+k*30,22-k*.9+12,5,0,7);g.fill()}
   g.fillStyle=night?'#c82030':'#1e8a9a';g.fillRect(60,250,190,44);g.fillStyle=night?'#ff6a6a':'#bff8ff';g.font='800 30px Inter,Arial,sans-serif';g.fillText(translatePlain('VAGAS'),155,283);
   const t=new THREE.CanvasTexture(c);const mt=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide});signPlane(ch.group,mt,p[0],8.3+dy,p[1],5.2,3.05,yaw);
   const q=(a,b,c2,d,y0,y1)=>{const A=G(lu+a,lv+b),Bq=G(lu+c2,lv+d);NE.box(Math.min(A[0],Bq[0]),y0+dy,Math.min(A[1],Bq[1]),Math.max(A[0],Bq[0]),y1+dy,Math.max(A[1],Bq[1]),nCy)};
   q(-2.4,-.06,1.6,.06,10.05,10.25);q(1.3,-.06,1.5,.06,9.75,10.55);q(1.5,-.06,1.7,.06,9.85,10.45);q(1.7,-.06,1.9,.06,10.0,10.3);q(-2.45,-.06,-2.25,.06,9.2,10.25)}
  // ---------- muros/cercas: mureta na frente (com vão da entrada), cerca velha nos fundos e laterais ----------
  const fence=(a0,b0,a1,b1)=>{const L=Math.hypot(a1-a0,b1-b0),n=Math.max(1,Math.round(L/.5));for(let k=0;k<n;k++){if(jr()<.12)continue;const t=(k+.5)/n,a=a0+(a1-a0)*t,b=b0+(b1-b0)*t,h=1.2+jr()*.35-(jr()<.1?.5:0),c=jr()<.5?wood:wood2;B(a-.11,a+.11,b-.03,b+.03,0,h,c)}
   for(const y of [.45,1.0])B(Math.min(a0,a1)-.02,Math.max(a0,a1)+.02,Math.min(b0,b1)-.05,Math.max(b0,b1)+.05,y,y+.09,wood2);colR(Math.min(a0,a1)-.06,Math.max(a0,a1)+.06,Math.min(b0,b1)-.06,Math.max(b0,b1)+.06,'rock',1.5)};
  fence(.2,D-.35,W-.2,D-.35);fence(W-.35,rv1+1,W-.35,D-.35);fence(.35,.6,.35,D-.35);
  const mur=(a0,a1)=>{if(a1-a0<.5)return;B(a0,a1,.2,.5,0,.75,wallLow,det);B(a0-.03,a1+.03,.17,.53,.75,.82,white,det);colR(a0,a1,.15,.55,'rock',.95)};
  mur(.35,aS0-.3);
  // ---------- pátio da piscina, cercado (mureta + gradil) — carro não entra ----------
  const pz0=1.2,pz1=aL0-.8,pa0=1.2,pa1=aS0-.8;
  B(pa1,pa1+.25,pz0+.6,pz1,0,.5,wallLow,det);B(pa0,pa1,pz1,pz1+.25,0,.5,wallLow,det);colR(pa1,pa1+.25,pz0+.6,pz1,'rock',1.3);colR(pa0,pa1+.25,pz1,pz1+.25,'rock',1.3);
  for(let v=pz0+.6;v<pz1;v+=.45)B(pa1+.1,pa1+.15,v,v+.05,.5,1.25,post);for(let u=pa0;u<pa1;u+=.45)B(u,u+.05,pz1+.1,pz1+.15,.5,1.25,post);
  B(pa1+.08,pa1+.17,pz0+.6,pz1,1.22,1.28,post);B(pa0,pa1+.17,pz1+.08,pz1+.17,1.22,1.28,post);
  // portão de pedestre no canto do corredor
  B(pa1-.02,pa1+.27,pz1-1.8,pz1-.6,0,1.3,C(night?'#5a5868':'#8a8e94'));
  // deck e canteiros com coqueiros junto às cercas
  B(pa0,pa1,pz0,pz1,.03,.08,C(night?'#6a6672':'#a8a294'));for(let k=0;k<30;k++){jr();jr();jr();jr();jr()} // v78: os quadrados do deck viraram manchas suaves no shader (CITY_AGE.box)
  const planter=(a,b)=>{B(a-.75,a+.75,b-.75,b+.75,0,.45,wallLow,det);B(a-.62,a+.62,b-.62,b+.62,.45,.47,soil,det);const p=G(a,b);palmBuild(det,p[0],.45,p[1],1,night,jr,{h:6.5+jr()*2.5});colR(a-.75,a+.75,b-.75,b+.75)};
  for(let u=pa0+2.2;u<pa1-1.5;u+=6.5)planter(u,pz0+1.1);for(let v=pz0+7.5;v<pz1-1.5;v+=6.5)planter(pa0+1.1,v);
  for(let v=pz0+3.5;v<pz1-1.5;v+=7)planter(pa1-1.0,v);
  // ---------- PISCINA: fundo azulejado manchado, água TRANSPARENTE esverdeada (poluição da indústria) ----------
  let poolC=null;{const pw=Math.min(16,pa1-pa0-9),ph=Math.min(8,pz1-pz0-9),pu0=(pa0+pa1)/2-pw/2+1,pu1=pu0+pw,pv0=(pz0+pz1)/2-ph/2,pv1=pv0+ph;
   if(pw>=7&&ph>=4){poolC=G((pu0+pu1)/2,(pv0+pv1)/2);const cop=C(night?'#8c8896':'#e0d8c8'),tileA=C(night?'#3a5a6a':'#7eb0b8'),tileB=C(night?'#2c4652':'#5e8e98'),gunk=C(night?'#3a3a20':'#6a6a30');
    for(let a=pu0,i=0;a<pu1-.01;a+=1,i++)for(let b=pv0,j=0;b<pv1-.01;b+=1,j++){const c=jr()<.18?gunk:(i+j)&1?tileA:tileB;B(a,Math.min(pu1,a+1),b,Math.min(pv1,b+1),.04,.05,c,lodNear)}
    B(pu0,pu1,pv0,pv0+.06,.05,.42,tileB);B(pu0,pu1,pv1-.06,pv1,.05,.42,tileB);B(pu0,pu0+.06,pv0,pv1,.05,.42,tileB);B(pu1-.06,pu1,pv0,pv1,.05,.42,tileB);
    B(pu0-.4,pu1+.4,pv0-.4,pv0,.0,.5,cop);B(pu0-.4,pu1+.4,pv1,pv1+.4,0,.5,cop);B(pu0-.4,pu0,pv0,pv1,0,.5,cop);B(pu1,pu1+.4,pv0,pv1,0,.5,cop);
    B(pu0+2.1,pu0+2.8,pv1+.02,pv1+.42,.49,.52,C(night?'#5f5a66':'#958d7c'));B(pu1-1.6,pu1-1.1,pv0-.42,pv0-.02,.49,.52,C(night?'#5f5a66':'#958d7c'));
    {const wm=new THREE.MeshStandardMaterial({color:night?0x2a3a20:0x6c8a3c,transparent:true,opacity:.26,roughness:.08,metalness:.1,depthWrite:false});city.mats.push(wm);
     const wg=new THREE.PlaneGeometry(pw-.12,ph-.12);wg.rotateX(-Math.PI/2);const w=new THREE.Mesh(wg,wm);const c=G((pu0+pu1)/2,(pv0+pv1)/2);w.position.set(c[0],.36,c[1]);w.rotation.y=yaw;w.renderOrder=2;ch.group.add(w)}
    for(let k=0;k<7;k++){jr();jr();jr();jr()} // v78: lodo da piscina = manchas suaves no shader (CITY_AGE.box), sem quadrados
    {const p=G(pu0+pw*.3,pv0+ph*.55);det.geo(GEO.cyl,mtx(p[0],.38,p[1],.42,.12,.42),C('#1c1c1c'))}
    {const p=G(pu0+pw*.7,pv0+ph*.35);det.geo(GEO.box,mtx(p[0],.37,p[1],1.6,.06,.22,0,yaw+.6,0),C(night?'#4a3a2a':'#7a5a3a'))}
    {const p=G(pu0+pw*.5,pv0+ph*.5);det.geo(GEO.box,mtx(p[0],.12,p[1],.6,.12,.9,.2,yaw+.3,.1),C(night?'#3a3a40':'#6a6e74'))}
    for(const dx of [0,.5]){const p=G(pu1-1.4+dx,pv1-.08);det.geo(GEO.cyl,mtx(p[0],.75,p[1],.03,.9,.03),C('#7a5a3a'))}
    colR(pu0-.4,pu1+.4,pv0-.4,pv1+.4);
    {const p=G(pu1+2.6,pv0+.8);beachUmbrella(det,p[0],.08,p[1],C(night?'#7a4a3a':'#c9705a'))}{const p=G(pu0+pw*.5,pv1+3.6);beachUmbrella(det,p[0],.08,p[1],C(night?'#3a5a6a':'#6aa8b8'))}
    {const p=G(pu0-2.6,pv1-.6);det.geo(GEO.cyl,mtx(p[0],.15,p[1],.05,2.3,.05,0,yaw,Math.PI/2-.08),C('#c8c4b8'));const q=G(pu0-2.6,pv1+.6);det.geo(GEO.cone,mtx(q[0],.42,q[1],1.05,.3,1.05,1.4,yaw,0),C(night?'#7a4a3a':'#b4806a'))}
    for(let k=0;k<4;k++){const a=pu0+.8+k*3.6;if(a+.8>pu1)break;if(k===1){const p=G(a+.4,pv1+2.0);det.geo(GEO.box,mtx(p[0],.3,p[1],.75,.16,1.9,0,yaw+.4,Math.PI*.55),C('#b9b09c'))}else{const p=G(a+.375,pv1+2.0),ns=Math.abs(V[1])>.5;beachLounger(det,p[0],p[1],.08,ns,C(night?'#7a7468':['#d8a890','#9cc0c8','#d8cc90'][(jr()*3)|0]),-Math.sign(ns?V[1]:V[0])||1)}}
    {const p=G(pu1+1.8,pv1+1.6);det.geo(GEO.cyl,mtx(p[0],.48,p[1],.32,.95,.32),C(night?'#4a2e1e':'#7a4426'));det.geo(GEO.cyl,mtx(p[0],.6,p[1],.33,.14,.33),C('#c8a020'));colR(pu1+1.45,pu1+2.15,pv1+1.25,pv1+1.95)}}}
  // ---------- máquina de gelo/refri e lixeira na varanda, perto da recepção ----------
  B(su0-wd+.25,su0-wd+1.0,sv0+.3,sv0+1.2,.15,1.9,C('#c8302a'),det,true);B(su0-wd+.22,su0-wd+.26,sv0+.4,sv0+1.1,1.2,1.75,C('#ffe8c0'));
  // ---------- porta entrável do quarto 6 ----------
  const nrm=r6.along==='u'?[-V[0],-V[1]]:[-U[0],-U[1]],d6=r6.pp,gp=r6.along==='u'?G(r6.a+1.05,aL1-2):G(aS1-2,r6.a+1.05);
  city.motel={pool:poolC,fn:[F.nrm[0],F.nrm[1]],ctr,ri,floors,x:d6[0]+nrm[0]*.9,z:d6[1]+nrm[1]*.9,nx:nrm[0],nz:nrm[1],sign:G(Math.min(W-2.2,rc1+2.4),3),gps:gp,entry:G((aS0+aS1)/2,1)};
  return true};

 const gasYard=(F,u0,u1,v0,v1,ri)=>{const tireAmmo=ri!=null&&ri===city.tireRi;const X0=F.pt(u0,v0)[0],Z0=F.pt(u0,v0)[1],jr=mulberry32(((Math.round(X0*3)*73856093)^(Math.round(Z0*3)*19349663)^(S.seed*131+7))>>>0),J=(a,b)=>a+jr()*(b-a),jp=a=>a[Math.floor(jr()*a.length)];
    const dirt=COL(night?'#3c3440':'#8a7a62'),dirt2=dirt.clone().multiplyScalar(.86),tire=COL('#1b1b1d'),rim=COL('#8c9096'),shed=COL(night?'#5a5468':jp(['#c9b48a','#b8c0c4','#d0a878'])),roofC=COL(night?'#2c2838':'#6a5048'),fenceC=COL(night?'#4a4858':'#7c8288'),rust=['#8a4a2a','#6e5a3a','#5a6a72','#7a2e2a','#4e5e3e','#9a8a6a'];
    // chão batido / terreno baldio com manchas
    F.box(u0,u1,v0,v1,.03,.05,dirt,det);for(let k=0;k<7;k++){const a=J(u0+1,u1-4),b=J(v0+1,v1-4),w=J(1.5,4);F.box(a,a+w,b,b+w*J(.5,1.2),.05,.055,dirt2,det)}
    // cerca de tela nos fundos e na lateral externa
    for(const[a0,a1,b0,b1] of [[u0,u1,v1-.08,v1],[u1-.08,u1,v0+6,v1]]){const alongU=a1-a0>b1-b0,len=alongU?a1-a0:b1-b0;F.box(a0,a1,b0,b1,0,.01,fenceC,new MB(),'rock');
     for(let t=0;t<=len+.01;t+=2.4){if(alongU)F.box(a0+t-.05,a0+t+.05,b0,b1,0,1.6,fenceC,det);else F.box(a0,a1,b0+t-.05,b0+t+.05,0,1.6,fenceC,det)}
     for(const y of[.5,1.5])F.box(a0,a1,b0,b1,y,y+.06,fenceC,det)}
    // galpão da borracharia, aberto para a frente
    const s0=u0+.6,s1=Math.min(u1-.8,s0+11),sb0=v0+6,sb1=Math.min(v1-2,sb0+8),H=4.2;
    F.box(s0,s1,sb1-.25,sb1,0,H,shed,det,'bld');F.box(s0,s0+.25,sb0,sb1,0,H,shed,det,'bld');F.box(s1-.25,s1,sb0,sb1,0,H,shed,det,'bld');
    F.box(s0-.3,s1+.3,sb0-1.2,sb1+.2,H,H+.3,roofC,det);F.box(s0,s0+.3,sb0-.2,sb0+.1,0,H,shed,det);F.box(s1-.3,s1,sb0-.2,sb0+.1,0,H,shed,det);
    {const c=F.pt((s0+s1)/2,sb0-1.25);signPlane(ch.group,mallSignMat('BORRACHARIA','#f2c21a','#141210',512,80),c[0]+F.nrm[0]*.02,H-.55,c[1]+F.nrm[1]*.02,Math.min(8,(s1-s0)-1),1.1,Math.atan2(F.nrm[0],F.nrm[1]))}
    // bancada, compressor e pneus pendurados lá dentro
    F.box(s0+.4,s0+1.2,sb0+1,sb1-1,0,.95,COL('#5a4a3a'),det,'rock');F.box(s1-1.6,s1-.5,sb1-1.4,sb1-.4,0,1.1,COL('#c8302a'),det,'rock');
    const tireAt=(u,v,y)=>{const p=F.pt(u,v);cyl(p[0],y,y+.26,p[1],.42,tire);cyl(p[0],y+.25,y+.27,p[1],.22,rim)};
    for(let k=0;k<4;k++)tireAt(s0+2+k*1.1,sb1-.5,2.2);
    // pilhas de pneus no pátio
    const piles=[];for(let k=0;k<5;k++){const u=J(s1+1.5,u1-1.5),v=J(v0+1.5,v1-2.5);if(u>u1-1)continue;const n=2+Math.floor(jr()*5);for(let j=0;j<n;j++)tireAt(u+J(-.06,.06),v+J(-.06,.06),.03+j*.26);const a=F.pt(u-.45,v-.45),b=F.pt(u+.45,v+.45);addCol(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),'rock')}
    for(let k=0;k<3;k++){const u=s0+1+k*.95,v=sb0-2.2;tireAt(u,v,.03);tireAt(u,v,.29);tireAt(u,v,.55)}
    // v77: escritório (cubículo) DENTRO do galpão, encostado na parede lateral = entrada disfarçada da AMOnições
    if(tireAmmo){const o1=s1-.25,o0=o1-Math.min(2.9,(s1-s0)*.32),ov0=sb0+1.0,ov1=Math.min(sb1-1.6,ov0+2.6),oh=2.7,ply=COL(night?'#5a5060':'#a8946a'),ply2=ply.clone().multiplyScalar(.85),dk=COL('#2a2420');
     F.box(o0,o1,ov1-.12,ov1,0,oh,ply,det,'bld');F.box(o0,o0+.12,ov0,ov1,0,oh,ply,det,'bld');F.box(o1-.12,o1,ov0,ov1,0,oh,ply,det,'bld');
     const dc=o0+.85;F.box(o0,dc-.5,ov0,ov0+.12,0,oh,ply2,det,'bld');F.box(dc+.5,o1,ov0,ov0+.12,0,oh,ply2,det,'bld');F.box(dc-.5,dc+.5,ov0,ov0+.12,2.15,oh,ply2,det);
     F.box(dc-.48,dc+.48,ov0+.02,ov0+.08,0,2.12,dk,det);F.box(dc+.3,dc+.38,ov0-.03,ov0,1.0,1.08,COL('#c8a040'),det);
     F.box(o0-.2,o1+.2,ov0-.45,ov1+.2,oh,oh+.12,COL(night?'#4a4a56':'#7a7a80'),det);
     // janelinha com persiana e ar-condicionado velho
     F.box(dc+.75,o1-.3,ov0-.02,ov0,1.2,1.9,COL(night?'#1a2a3a':'#3a5a6a'),det);for(let y=1.25;y<1.88;y+=.09)F.box(dc+.75,o1-.3,ov0-.035,ov0-.02,y,y+.03,COL('#d8d0b8'),det);
     {const c=F.pt(dc,ov0-.02);signPlane(ch.group,mallSignMat(translatePlain('ESCRITÓRIO'),'#e8e0c8','#2a2420',256,48),c[0]+F.nrm[0]*.04,2.4,c[1]+F.nrm[1]*.04,1.3,.26,Math.atan2(F.nrm[0],F.nrm[1]))}
     const dp=F.pt(dc,ov0),n=[F.nrm[0],F.nrm[1]];city.tireOffice={x:dp[0]+n[0]*.9,z:dp[1]+n[1]*.9,nrm:n,out:{x:dp[0]+n[0]*.9,z:dp[1]+n[1]*.9},side:[-n[1],n[0]]};try{ammoTireReady()}catch(e){console.error(e)}}
    // carcaças de carros (uma sobre blocos, sem rodas) e tambores de óleo
    const wreck=(u,v,ang,blocks)=>{const ca=Math.abs(Math.cos(ang))>.5,L=4.2,Wd=1.8,hu=ca?L/2:Wd/2,hv=ca?Wd/2:L/2;
     F.box(u-hu,u+hu,v-hv,v+hv,0,.01,COL('#000'),new MB(),'rock');
     // v77: carcaça = modelo de carro normal já explodido (lataria queimada), sem rodas, assentado no chão.
     try{const type=jp(['sedan','hatch','suv','wagon','pickup','crossover']),p=F.pt(u,v),fa=Math.atan2(F.nrm[1],F.nrm[0])+(ca?Math.PI/2:0)+J(-.25,.25);
      const fake={id:0,type,t:VT[type],x:p[0],z:p[1],a:fa,vx:0,vz:0,w:0,fwd:0,steer:0,roll:0,pitch:0,gy:0,ws:[0,0,0,0],color:jp(rust),cargo:'#ffffff',icol:COL('#888'),exploded:true,alive:false,plate:'WRECK00'};
      buildCarMesh(fake);const g=fake.g;scene.remove(g);
      g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.userData&&o.geometry.userData.cached)o.geometry=o.geometry.clone()});
      for(const wh of fake.wheels||[])wh.piv.visible=false;
      if(fake.ch){fake.ch.position.set(0,0,0);fake.ch.rotation.set(0,0,0)}
      g.position.set(p[0],(blocks?.12:-.03)-fake.t.wr*.55,p[1]);g.rotation.set(J(-.05,.05),-fa,J(-.06,.06));ch.group.add(g);
      if(blocks)for(const su of[-1,1])for(const sv of[-1,1])F.box(u+su*hu*.7-.18,u+su*hu*.7+.18,v+sv*hv*.7-.18,v+sv*hv*.7+.18,.03,.4,COL('#8a8680'),det);
     }catch(e){console.warn('sucata',e);F.box(u-hu,u+hu,v-hv,v+hv,.15,.9,COL('#5a4a3a'),det)}};
    const wu=Math.min(u1-3,s1+4);wreck(wu,v1-4.5,0,true);if(u1-u0>16)wreck(Math.min(u1-3,wu+5.5),v1-8.5,Math.PI/2,false);
    for(let k=0;k<4;k++){const u=J(u0+1,s0+(s1-s0)*.3),v=J(v0+.8,v0+3.5),p=F.pt(u,v);cyl(p[0],.03,1.0,p[1],.32,COL(jp(['#2a5ab0','#c8302a','#3a7a3a','#d8a020'])))}};
 // Sub-frame: mesmo frame u/v deslocado em u, com largura/profundidade limitadas.
 const subF=(F,off,W,D)=>({...F,W,D,pt:(u,v)=>F.pt(u+off,v),p3:(u,y,v)=>F.p3(u+off,y,v),box:(u0,u1,...r)=>F.box(u0+off,u1+off,...r)});
 // Posto compacto: no máx. 30 m de frente e 36 m de fundo; o resto vira borracharia.
 const jrGas=(ri,k,sd)=>((Math.imul(ri*73856093^(k+3)*19349663^(sd+5)*83492791^S.seed,2654435761)>>>0)%1000)/1000;
 const gasCompact=(F,ri)=>{const W=F.W,D=F.D,Wg=W>=44?Math.max(26,Math.min(30,W*.52)):Math.min(W,30),off=W>=44?0:(W-Wg)/2,Dg=Math.min(D,36),G=subF(F,off,Wg,Dg);
  gasBuild({F:G,W:Wg,D:Dg,f:F.f,ch,ri,doorAt});
  // 4 vagas na porta da conveniência (2 de cada lado da entrada), carros de frente para a loja.
  {const st=GAS.list.get(ri),sv0=st.sv[0],v0=sv0-5.4,v1=sv0-.5,cP=COL(night?'#b89a2a':'#e2b81e'),stop=COL(night?'#6a6570':'#b9b4aa'),a=Math.atan2(-F.nrm[1],-F.nrm[0]),rect=(u0,u1,va,vb)=>{const p=G.pt(u0,va),q=G.pt(u1,vb);return[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1])]};
   for(const sd of[-1,1]){const us=[Wg/2+sd*1.4,Wg/2+sd*4.2,Wg/2+sd*7.0];for(const u of us){const r=rect(u-.06,u+.06,v0,v1);marks.flat(r[0],r[1],r[2],r[3],.042,cP)}
    for(let k=0;k<2;k++){const u=(us[k]+us[k+1])/2,r=rect(u-.8,u+.8,v1-.45,v1-.2);det.box(r[0],.03,r[1],r[2],.14,r[3],stop);const c=G.pt(u,v1-2.6);if(jrGas(ri,k,sd)<.4)parkCar(c[0],c[1],a,'gasd'+ri+':'+sd+k)}}}const lm=(city.lms||[]).find(v=>v.name==='gas'&&v.ri===ri);if(lm){const c=G.pt(Wg/2,Dg*.45);lm.x=c[0];lm.z=c[1]}
  if(W-Wg>=14)gasYard(F,Wg+1.5,W-1.2,2.2,D-1.5,ri);else if(D-Dg>=14)gasYard(F,1.5,W-1.5,Dg+1,D-1.5,ri);else if(ri===city.tireRi)ammoTireFallback()};
 const faceOf=(X0,Z0,X1,Z1)=>{const c=[['s',(X0+X1)/2,Z1+SW+7.4,'H'+Math.round((Z1+SW+8)/P)],['n',(X0+X1)/2,Z0-SW-7.4,'H'+Math.round((Z0-SW-8)/P)],['e',X1+SW+7.4,(Z0+Z1)/2,'V'+Math.round((X1+SW+8)/P)],['w',X0-SW-7.4,(Z0+Z1)/2,'V'+Math.round((X0-SW-8)/P)]].filter(q=>roadAt(q[1],q[2]));
  if(!c.length)return's';const av=c.filter(q=>{const L=city.lines[q[3]];return!L||L.t==='ave'});return(av.length?av:c)[0][0]};
 const cyl=(x,y0,y1,z,r,col,mb)=>(mb||det).geo(GEO.cyl,mtx(x,(y0+y1)/2,z,r,y1-y0,r),col);
 const doorAt=(F,u,v)=>{const p=F.pt(u,v-.35);regDoor(p[0],p[1],F.f,F.f==='s'||F.f==='n'?p[0]:p[1],false);return p};
 /* --- industrial district --- */
 const industrial=(X0,Z0,X1,Z1)=>{const conc=COL(night?'#3a3644':'#8e8b84'),wallC=COL(night?'#4a4458':'#b4ada0'),dark=COL('#2a2a2e');
  const ir=mulberry32(((Math.round(X0*5)*73856093)^(Math.round(Z0*5)*19349663)^(S.seed*97+19))>>>0),abF=ir()<.18,wornF=abF||ir()<.55;
  sideSlab(side,X0,0,Z0,X1,.19,Z1,conc);const f=faceOf(X0+SW,Z0+SW,X1-SW,Z1-SW),F=LF(f,X0+1.5,Z0+1.5,X1-1.5,Z1-1.5),W=F.W,D=F.D;
  {const g=F.pt(W/2,0),ns=f==='n'||f==='s';for(let i=ch.lamps.length-1;i>=0;i--){const l=ch.lamps[i],du=ns?Math.abs(l.x-g[0]):Math.abs(l.z-g[1]),dv=ns?Math.abs(l.z-g[1]):Math.abs(l.x-g[0]);if(du<7&&dv<6){if(l.col)l.col.dead=true;ch.lamps.splice(i,1)}}}
  // perimeter: tall concrete walls or chain-link fences, gate on the front
  const gate=[W/2-4.5,W/2+4.5];const sides=[['f',0],['b',D],['l',0],['r',W]];
  for(const[s0,k] of sides){const wall=s0==='f'||R()<.5,len=s0==='f'||s0==='b'?W:D;
   const seg=(a,b)=>{if(b-a<.5)return;if(wall){if(s0==='f'||s0==='b')F.box(a,b,k-.2,k+.2,.2,3.4,wallC,det,'rock');else F.box(k-.2,k+.2,a,b,.2,3.4,wallC,det,'rock');
     if(s0==='f'||s0==='b')F.box(a,b,k-.28,k+.28,3.4,3.6,wallC.clone().multiplyScalar(.8));else F.box(k-.28,k+.28,a,b,3.4,3.6,wallC.clone().multiplyScalar(.8))}
    else{for(let t=a;t<=b;t+=3){if(s0==='f'||s0==='b')F.box(t-.06,t+.06,k-.06,k+.06,.2,3.3,dark);else F.box(k-.06,k+.06,t-.06,t+.06,.2,3.3,dark)}
     const A=s0==='f'||s0==='b'?F.p3(a,.2,k):F.p3(k,.2,a),B=s0==='f'||s0==='b'?F.p3(b,.2,k):F.p3(k,.2,b),L=Math.hypot(B[0]-A[0],B[2]-A[2]);
     fence.quad(A,[B[0],.2,B[2]],[B[0],3.2,B[2]],[A[0],3.2,A[2]],0,0,1,[0,0,L/1.2,3/1.2],COL('#ffffff'));
     const c=s0==='f'||s0==='b'?F.box(a,b,k-.08,k+.08,.2,3.3,dark,fence,'rock'):F.box(k-.08,k+.08,a,b,.2,3.3,dark,fence,'rock')}};
   if(s0==='f'){seg(0,gate[0]);seg(gate[1],W);F.box(gate[0]-.3,gate[0]+.3,-.3,.3,.2,3.8,COL('#e8c020'),det,'rock');F.box(gate[1]-.3,gate[1]+.3,-.3,.3,.2,3.8,COL('#e8c020'),det,'rock');
    buildIndustrialGate(F,gate[0]+.3,gate[1]-.3,ch);F.box(gate[0]-1.6,gate[0]-.4,.4,2,.2,2.6,COL('#d8d4c8'),det,'rock')}
   else seg(0,len)}
  // warehouse with a sawtooth roof
  const wu0=3,wu1=W*.62,wv0=D*.52,wv1=D-3,wh=7.5,wc=COL(night?'#5a5070':pick(['#8a8f96','#7a8a7a','#9a8a72','#6f7a8a']));
  F.box(wu0,wu1,wv0,wv1,.2,wh,wc,walls,true,{win:[0,.875]});const teeth=Math.max(3,Math.round((wu1-wu0)/6)),tw=(wu1-wu0)/teeth,rc=COL(night?'#3a3448':'#5a5e64'),gl=COL(night?'#ffcf7a':'#9ac0d8');
  for(let k=0;k<teeth;k++){const u0=wu0+k*tw,u1=u0+tw;const a=F.p3(u0,wh,wv0),b=F.p3(u0,wh,wv1),c=F.p3(u1,wh+2.4,wv1),d=F.p3(u1,wh+2.4,wv0),e=F.p3(u1,wh,wv0),g=F.p3(u1,wh,wv1);const ref=F.p3(u0+tw*.7,wh-1,(wv0+wv1)/2);
   roofs2.qa(a,b,c,d,rc,ref);det.qa(e,g,c,d,COL(night?'#2a3440':'#5f7c8e'),F.p3(u0,wh+1,(wv0+wv1)/2)); /* v78: vidro dos sheds apagado (antes todos brilhavam à noite) */roofs2.qa(a,d,e,e,rc,F.p3(u0+tw/2,wh+.5,wv0+5));roofs2.qa(b,c,g,g,rc,F.p3(u0+tw/2,wh+.5,wv1-5))}
  for(let k=0;k<3;k++){const u=wu0+3+k*((wu1-wu0-6)/3);F.box(u,u+4.2,wv0-.12,wv0,.2,4.6,COL(night?'#2a2638':'#c8c4b8'));F.box(u,u+4.2,wv0-.16,wv0-.1,4.6,4.8,COL('#d8a020'))}
  if(wornF){
   const dirt=COL(night?'#28242f':'#70675c');
   for(let k=0;k<4;k++){const u=wu0+ir()*(wu1-wu0-2),v=wv0+ir()*(wv1-wv0-2),hh=1.6+ir()*4.5;
    F.box(u,u+.45,v,v+.15,2.2,2.2+hh,dirt)}
   for(let k=0;k<3;k++){const u=wu0+1.5+ir()*(wu1-wu0-3),y=2.5+ir()*3.5;
    F.box(u,u+.09,wv0-.14,wv0-.08,y,y+2.4,dirt);F.box(u-.35,u+.65,wv0-.12,wv0-.06,y+1.15,y+1.26,dirt)}
  }
  if(abF){
   const wood=COL(night?'#5e4535':'#8a6640'),tape=COL('#f0c020');
   for(let k=0;k<2;k++){const u=wu0+4+k*((wu1-wu0-10)/2);
    for(const y of [1.35,2.05,2.75])F.box(u,u+2.2,wv0-.13,wv0-.04,y,y+.12,wood);
   }

  }
  // storage tanks
  const nt=2+Math.floor(R()*3),tr=rr(3.4,5),tc=COL(night?'#9a96b0':pick(['#e8e8e4','#d8dce0','#c8ccd0']));
  for(let k=0;k<nt;k++){const u=W*.7+tr+ (k%2)*(tr*2.3),v=D*.2+tr+Math.floor(k/2)*(tr*2.3);if(u+tr>W-2||v+tr>D-2)continue;const p=F.pt(u,v),th=rr(8,13);
   cyl(p[0],.2,th,p[1],tr,tc);det.geo(GEO.hemi,mtx(p[0],th,p[1],tr,tr*.35,tr),tc.clone().multiplyScalar(.95));cyl(p[0],th-.4,th-.2,p[1],tr+.1,COL('#8a8a8a'));
   det.box(p[0]+tr-.05,.2,p[1]-.3,p[0]+tr+.2,th,p[1]-.25,dark);det.box(p[0]+tr-.05,.2,p[1]+.25,p[0]+tr+.2,th,p[1]+.3,dark);for(let y=1;y<th;y+=.6)det.box(p[0]+tr,y,p[1]-.3,p[0]+tr+.18,y+.06,p[1]+.3,dark);
   addCol(p[0]-tr*.85,p[1]-tr*.85,p[0]+tr*.85,p[1]+tr*.85,'rock')}
  // pipe rack from tanks to the warehouse
  {const pc=COL(night?'#7a6a9a':'#a8743a');const v=D*.45;F.box(wu1-2,W*.7,v-.25,v+.25,4.4,4.9,pc);F.box(wu1-2,W*.7,v+.5,v+.9,4.6,5,COL('#7a7a80'));for(let u=wu1;u<W*.7;u+=4)F.box(u-.12,u+.12,v-.3,v+.9,.2,4.4,dark)}
  // chimneys with red and white bands
  const nc=1+(R()<.6?1:0);for(let k=0;k<nc;k++){const p=F.pt(wu0+4+k*6,wv1-3),ch2=rr(26,38);for(let y=.2,j=0;y<ch2;y+=3.6,j++)cyl(p[0],y,Math.min(ch2,y+3.6),p[1],1.25-y/ch2*.35,j%2?COL('#f2f2ee'):COL('#c8282a'));
   cyl(p[0],ch2,ch2+.5,p[1],1.05,dark);addCol(p[0]-1.2,p[1]-1.2,p[0]+1.2,p[1]+1.2,'rock');if(!city.chimneys.some(q=>q.x===p[0]&&q.z===p[1]))city.chimneys.push({x:p[0],z:p[1],y:ch2+.6});cityAgeSootAdd(p[0],p[1],ch2+.5);if(night)neon.box(p[0]-.15,ch2+.5,p[1]-.15,p[0]+.15,ch2+.8,p[1]+.15,COL('#ff2a1a'))}
  // container stacks
  const cc=['#c8402a','#2a6aa8','#3a8a4a','#d8a020','#7a3a8a','#e8e6e0'];for(let k=0;k<4;k++){const u=4+k*3.2,v=D*.18;if(u+2.6>W*.6)break;const hgt=1+Math.floor(R()*3);
   for(let j=0;j<hgt;j++){const col=COL(cc[Math.floor(R()*cc.length)]);F.box(u,u+2.5,v,v+6.1,.2+j*2.6,.2+(j+1)*2.6-.05,col);F.box(u+.1,u+2.4,v-.03,v+.02,.4+j*2.6,(j+1)*2.6-.1,col.clone().multiplyScalar(.8))}F.box(u,u+2.5,v,v+6.1,0,.2,dark,det,'rock')}
  if(night)for(const[u,v] of [[W*.3,D*.35],[W*.75,D*.6]]){const p=F.pt(u,v);glow.flat(p[0]-7,p[1]-7,p[0]+7,p[1]+7,.25,COL('#ffb050').multiplyScalar(.45))}};
 /* --- landmarks --- */
 const parking=(x0,z0,x1,z1,tag,noAccess)=>{let k=0;const along=(x1-x0)>=(z1-z0);const lot={ri:curRi,tag,x0,z0,x1,z1,slots:[],access:null};city.parkingLots.push(lot);lot.access=noAccess?null:parkingAccess(x0,z0,x1,z1);const slot=(x,z,a)=>{const rec={ri:curRi,x,z,a,lot};city.empParkingSlots.push(rec);lot.slots.push(rec)};
  // v77: faixas amarelas sobre o concreto, batente de concreto no fundo de cada vaga
  // e faixa de fechamento na ponta das fileiras (sem colisor: são 12 cm de altura).
  const cP=COL(night?'#b89a2a':'#e2b81e'),stop=COL(night?'#6a6570':'#b9b4aa');
  // v77: com uma fileira só, ela encosta na borda mais próxima da calçada (contorno da quadra), e o batente fica desse lado.
  const RB=city.rects[curRi],flipZ=RB&&(z1-z0)<=14&&((RB[3]-SW)-z1)<(z0-(RB[1]+SW)),flipX=RB&&(x1-x0)<=14&&((RB[2]-SW)-x1)<(x0-(RB[0]+SW));
  if(along){let last=null;for(let x=x0+1.5;x<x1-2.6;x+=2.8){last=x;if(z1-z0>7&&(z1-z0>14||!flipZ)){marks.flat(x,z0+.6,x+.12,z0+5.4,.042,cP);det.box(x+.6,.03,z0+.75,x+2.2,.14,z0+1.0,stop);slot(x+1.4,z0+3,Math.PI/2);if(R()<.35)parkCar(x+1.4,z0+3,Math.PI/2,tag+':'+(k++))}if(z1-z0>14||(z1-z0>7&&flipZ)){marks.flat(x,z1-5.4,x+.12,z1-.6,.042,cP);det.box(x+.6,.03,z1-1.0,x+2.2,.14,z1-.75,stop);slot(x+1.4,z1-3,-Math.PI/2);if(R()<.35)parkCar(x+1.4,z1-3,-Math.PI/2,tag+':'+(k++))}}
   if(last!==null){const xe=last+2.8;if(z1-z0>7&&(z1-z0>14||!flipZ))marks.flat(xe,z0+.6,xe+.12,z0+5.4,.042,cP);if(z1-z0>14||(z1-z0>7&&flipZ))marks.flat(xe,z1-5.4,xe+.12,z1-.6,.042,cP)}}
  else{let last=null;for(let z=z0+1.5;z<z1-2.6;z+=2.8){last=z;if(x1-x0>7&&(x1-x0>14||!flipX)){marks.flat(x0+.6,z,x0+5.4,z+.12,.042,cP);det.box(x0+.75,.03,z+.6,x0+1.0,.14,z+2.2,stop);slot(x0+3,z+1.4,0);if(R()<.35)parkCar(x0+3,z+1.4,0,tag+':'+(k++))}if(x1-x0>14||(x1-x0>7&&flipX)){marks.flat(x1-5.4,z,x1-.6,z+.12,.042,cP);det.box(x1-1.0,.03,z+.6,x1-.75,.14,z+2.2,stop);slot(x1-3,z+1.4,Math.PI);if(R()<.35)parkCar(x1-3,z+1.4,Math.PI,tag+':'+(k++))}}
   if(last!==null){const ze=last+2.8;if(x1-x0>7&&(x1-x0>14||!flipX))marks.flat(x0+.6,ze,x0+5.4,ze+.12,.042,cP);if(x1-x0>14||(x1-x0>7&&flipX))marks.flat(x1-5.4,ze,x1-.6,ze+.12,.042,cP)}}};
 const dealLotShell=(x0,z0,x1,z1,ri,compact=false)=>{const cx=(x0+x1)/2,H=compact?5.8:6.2,pad=compact?1.0:1.5,fw=Math.min((x1-x0)-pad*2,compact?14:30),sx0=cx-fw/2,sx1=cx+fw/2,sz0=z0+pad,sz1=Math.min(z0+(compact?11.5:14),z1-pad);
   /* estacionamento usa o próprio asfalto do mundo em y=0, sem laje sobre rodas */
   const wall=COL(night?'#2c3442':'#e8e8ec'),glass=COL(night?'#3ad6ff':'#8fcfe6'),roof=COL(night?'#151a24':'#3a3f48'),trim=COL(night?'#ff3b6b':'#d62828');
   det.box(sx0,.24,sz0,sx1,H,sz0+.5,wall);det.box(sx0,.24,sz0,sx0+.5,H,sz1,wall);det.box(sx1-.5,.24,sz0,sx1,H,sz1,wall);
   det.box(sx0+.5,.24,sz1-.25,sx1-.5,.9,sz1,wall);det.box(sx0+.5,.9,sz1-.2,sx1-.5,H-.6,sz1-.05,glass);
   for(let x=sx0+4.2;x<sx1-1;x+=4.2)det.box(x-.12,.9,sz1-.3,x+.12,H-.6,sz1,wall);
   det.box(sx0,H-.6,sz0,sx1,H,sz1+.3,wall);det.box(sx0-.2,H,sz0-.2,sx1+.2,H+.35,sz1+.5,roof);det.box(sx0,H-.62,sz1+.28,sx1,H-.45,sz1+.36,trim);
   addCol(sx0,sz0,sx1,sz1,'bld');
   signPlane(ch.group,mallSignMat('CONCESSIONÁRIA COASTAL','#0d1420','#3ad6ff',512,80),cx,H+1.1,sz1+.55,compact?11:16,compact?1.45:1.8,0);
   const pz0=compact?sz1+1.4:z0+18,pz1=compact?z1-2.5:z1-9;
   const _drop=MB_DROP;MB_DROP=null; /* v1r3: o lote é laje de calçada (topo .212); com o rebaixo a pintura ia pra .045, por baixo do piso */
   for(let z=pz0;z<pz1;z+=compact?3.0:3.2){if(x0+6.5<x1-6.5){marks.flat(x0+1,z,x0+6.1,z+.12,0.224,cMark);marks.flat(x1-6.1,z,x1-1,z+.12,0.224,cMark);if(R()<.45)parkCar(x0+3.5,z+1.45,0,ri+':dw'+z.toFixed(0));if(R()<.45)parkCar(x1-3.5,z+1.45,Math.PI,ri+':de'+z.toFixed(0));}}
   if(x0+6.5<x1-6.5){const st=compact?3:3.2;let zl=pz0;while(zl+st<pz1)zl+=st;marks.flat(x0+6.0,pz0,x0+6.12,zl+.12,0.224,cMark);marks.flat(x1-6.12,pz0,x1-6.0,zl+.12,0.224,cMark)} /* fundo das vagas */
   /* v1r3: bandeirolas em postes baixos (frente e lateral externa, com vão de entrada) + placa amarela num poste alto na esquina */
   {const Y0=.212,PH=2.35,FL=['#d62828','#2a6ad6','#f2c21a','#f2f2ee','#1e8a4a','#ff7a1a'].map(h=>COL(h)),poleC=COL(night?'#4a4e58':'#7a7e86'),ropeC=COL('#26262a');let fi=0;
    const pole=(x,z)=>{det.box(x-.055,Y0,z-.055,x+.055,Y0+PH+.08,z+.055,poleC);addCol(x-.13,z-.13,x+.13,z+.13,'rock')};
    const rope=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.max(2,Math.round(L/.8)),alongX=Math.abs(bx-ax)>=Math.abs(bz-az),dip=Math.min(.55,L*.06),yy=t=>Y0+PH-dip*Math.sin(Math.PI*t);
     for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n,xa=ax+(bx-ax)*t0,za=az+(bz-az)*t0,xb=ax+(bx-ax)*t1,zb=az+(bz-az)*t1,y=(yy(t0)+yy(t1))/2,e=.014;
      det.box(Math.min(xa,xb)-(alongX?0:e),y-e,Math.min(za,zb)-(alongX?e:0),Math.max(xa,xb)+(alongX?0:e),y+e,Math.max(za,zb)+(alongX?e:0),ropeC);
      const mx=(xa+xb)/2,mz=(za+zb)/2,c=FL[fi++%FL.length],th=.01;
      for(const[hw,h0,h1] of [[.17,.015,.15],[.105,.15,.27],[.045,.27,.38]]){if(alongX)det.box(mx-hw,y-h1,mz-th,mx+hw,y-h0,mz+th,c);else det.box(mx-th,y-h1,mz-hw,mx+th,y-h0,mz+hw,c)}}};
    const line=(ax,az,bx,bz,step)=>{const L=Math.hypot(bx-ax,bz-az);if(L<2)return;const n=Math.max(1,Math.round(L/step));let px=ax,pz=az;pole(ax,az);for(let k=1;k<=n;k++){const qx=ax+(bx-ax)*k/n,qz=az+(bz-az)*k/n;pole(qx,qz);rope(px,pz,qx,qz);px=qx;pz=qz}};
    const fz=z1-.45,gx0=cx-4.6,gx1=cx+4.6;line(x0+.5,fz,gx0,fz,7);line(gx1,fz,x1-.5,fz,7);line(x1-.45,sz1+1.2,x1-.45,fz,7);if(!compact)line(x0+.45,sz1+1.2,x0+.45,fz,7);
    /* placa da esquina: poste alto + painel amarelo de 2 linhas, dos dois lados */
    const px=x1-1.4,pz=z1-1.4,ph=4.95,bw=3.45,bh=2.1;det.box(px-.13,Y0,pz-.13,px+.13,ph,pz+.13,COL(night?'#3a3428':'#6a5a30'));addCol(px-.3,pz-.3,px+.3,pz+.3,'rock');
    det.box(px-bw/2-.1,ph-.08,pz-.11,px+bw/2+.1,ph+bh+.1,pz+.11,COL(night?'#2a2620':'#3a3428')); /* v1r10: placa a 75% e 3 linhas */
    for(const sd of [1,-1]){const ry=sd>0?0:Math.PI,zz=pz+sd*.13;signPlane(ch.group,mallSignMat('COASTAL CARS','#f2d84a','#1a1a1a',512,150),px,ph+bh*.74,zz,bw,bh*.46,ry);signPlane(ch.group,mallSignMat('SEMINOVOS','#f2d84a','#b3121f',512,100),px,ph+bh*.4,zz,bw,bh*.23,ry);signPlane(ch.group,mallSignMat('FINANCIAMOS','#f2d84a','#b3121f',512,100),px,ph+bh*.15,zz,bw,bh*.23,ry)}}
   MB_DROP=_drop;
   const out={ri,cx,ix0:x0,iz0:z0,ix1:x1,iz1:z1,tx:cx,tz:Math.min(z1-4,sz1+4.1),sx:Math.min(x1-2,cx+Math.min(5.6,(x1-x0)*.22)),sz:Math.min(z1-1.3,sz1+1.1),ex:cx,ez:Math.min(z1-2.2,Math.max(sz1+4.8,z1-3.2)),shared:compact};
   const ds=city.deals&&city.deals.find(v=>v.ri===ri);if(ds)Object.assign(ds,out);if(!city.deal)city.deal=ds||out;return out};
  /* ===== v78 · KIT DE ACABAMENTO dos prédios especiais =====
     F = moldura do lote (v=0 na rua). Corpo do prédio em u0..u1 × v0..v1 (frente em v0), altura H.
     Telhado → roofD (lote SEM sombra). Fachadas e fundos → det (sombra só com "Sombras Detalhadas").
     Sorteio com gerador próprio por lote: não mexe no R() da cidade (determinismo da seed). */
  const bldKit=(F,u0,u1,v0,v1,H,o={})=>{const kr=mulberry32(((curRi+1)*7919+Math.round(u0*31+v1*17))>>>0),kk=(a,b)=>a+kr()*(b-a);
   const base=o.col||COL(night?'#6a6478':'#cfc8b8'),dk=base.clone().multiplyScalar(.78),lt=base.clone().multiplyScalar(1.08),metal=COL(night?'#6a6e7a':'#a8acb4'),dmetal=COL(night?'#3a3c44':'#6a6e76'),grav=COL(night?'#4a4656':'#9a968a');
   const W0=u1-u0,D0=v1-v0,av=o.avoid||[],free=(a,b,m=1.5)=>av.every(q=>Math.hypot(a-q[0],b-q[1])>q[2]+m);
   // --- telhado (sem sombra) ---
   if(o.roof!==false){const y=H;
    roofD.box(...(()=>{const a=F.pt(u0,v0),b=F.pt(u1,v1);return[Math.min(a[0],b[0]),y+.01,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y+.06,Math.max(a[1],b[1])]})(),grav);
    if(o.parapet!==false){const t=.28,ph=.9;F.box(u0,u1,v0,v0+t,y,y+ph,lt,roofD);F.box(u0,u1,v1-t,v1,y,y+ph,lt,roofD);F.box(u0,u0+t,v0,v1,y,y+ph,lt,roofD);F.box(u1-t,u1,v0,v1,y,y+ph,lt,roofD);
     F.box(u0-.06,u1+.06,v0-.06,v0+t+.06,y+ph,y+ph+.1,dk,roofD);F.box(u0-.06,u1+.06,v1-t-.06,v1+.06,y+ph,y+ph+.1,dk,roofD);F.box(u0-.06,u0+t+.06,v0,v1,y+ph,y+ph+.1,dk,roofD);F.box(u1-t-.06,u1+.06,v0,v1,y+ph,y+ph+.1,dk,roofD)}
    // casinha da escada
    if(W0>8&&D0>8&&free(u0+2.5,v1-2.7)){const a=u0+1.2,b=v1-4.2;F.box(a,a+2.6,b,b+3,y,y+2.6,base,roofD);F.box(a-.1,a+2.7,b-.1,b+3.1,y+2.6,y+2.75,dk,roofD);F.box(a+.7,a+1.8,b-.02,b,y,y+2.1,dmetal,roofD)}
    // condensadoras e exaustores
    const nAC=Math.max(2,Math.min(7,Math.round(W0*D0/90)));for(let k=0;k<nAC;k++){const a=kk(u0+1.5,u1-3),b=kk(v0+1.5,v1-3);if((a<u0+4.5&&b>v1-5.5)||!free(a+.7,b+.5))continue;F.box(a,a+1.4,b,b+1.1,y,y+.9,metal,roofD);F.box(a+.15,a+1.25,b-.01,b,y+.2,y+.75,dmetal,roofD);const c=F.p3(a+.7,y+.92,b+.55);roofD.geo(GEO.cyl,mtx(c[0],c[1],c[2],.42,.04,.42),dmetal)}
    for(let k=0;k<Math.max(2,Math.round(W0/7));k++){const ua=kk(u0+1,u1-1),va=kk(v0+1,v1-1);if(!free(ua,va,.5))continue;const p=F.pt(ua,va);roofD.geo(GEO.cyl,mtx(p[0],y+.5,p[1],.18,1,.18),metal);roofD.geo(GEO.cyl,mtx(p[0],y+1.05,p[1],.3,.1,.3),dmetal)}
    // caixa d'água sobre pés
    if(o.tank!==false&&W0>10&&free(u1-3,v1-3)){const p=F.pt(u1-3,v1-3);for(const[dx,dz] of [[-.8,-.8],[.8,-.8],[-.8,.8],[.8,.8]])roofD.box(p[0]+dx-.08,y,p[1]+dz-.08,p[0]+dx+.08,y+1.6,p[1]+dz+.08,dmetal);roofD.geo(GEO.cyl,mtx(p[0],y+2.5,p[1],1.15,1.8,1.15),COL(night?'#5a6a7a':'#8aa0b0'));roofD.geo(GEO.cone,mtx(p[0],y+3.6,p[1],1.2,.4,1.2),dmetal)}
    // parabólica e antena
    {const p=F.pt(u0+2.2,v0+2.2);roofD.box(p[0]-.05,y,p[1]-.05,p[0]+.05,y+1.1,p[1]+.05,dmetal);roofD.geo(GEO.sph,mtx(p[0],y+1.3,p[1],.6,.6,.18,0,.7,.5),COL('#e8e8ec'));const q=F.pt(u1-1.6,v0+1.6);roofD.box(q[0]-.04,y,q[1]-.04,q[0]+.04,y+4,q[1]+.04,dmetal);for(const h of [1.6,2.6,3.4])roofD.box(q[0]-.6,y+h,q[1]-.03,q[0]+.6,y+h+.05,q[1]+.03,dmetal)}
   }
   // --- fachada: faixa de base, frisos por andar, cornija, pilares de canto (laterais e fundos) ---
   if(o.facade!==false){const out=.07,sides=[[u0,v0,u0,v1,-1,0],[u1,v0,u1,v1,1,0],[u0,v1,u1,v1,0,1]];if(o.front)sides.push([u0,v0,u1,v0,0,-1]);
    for(const[a0,b0,a1,b1,nu,nv] of sides){const bx=(y0,y1,c,d)=>{if(nu)F.box(nu<0?a0-d:a0,nu<0?a0:a0+d,b0,b1,y0,y1,c,det);else F.box(a0,a1,nv<0?b0-d:b0,nv<0?b0:b0+d,y0,y1,c,det)};
     bx(.27,1.1,dk,out);for(let y=3.6;y<H-1.5;y+=3.6)bx(y,y+.12,dk,out*.8);bx(H-.55,H-.04,lt,.22)} /* topo da cornija abaixo da laje existente (evita z-fight) */
    for(const[a,b] of [[u0,v0],[u1,v0],[u0,v1],[u1,v1]])F.box(a-.12,a+.12,b-.12,b+.12,.27,H-.05,lt,det);
    // calhas descendo nos fundos
    for(const a of [u0+.5,u1-.5]){F.box(a-.07,a+.07,v1,v1+.14,.27,H-.06,dmetal,det)}
    // condensadoras penduradas nas laterais
    if(o.wallAC!==false)for(let k=0;k<Math.min(6,Math.round(D0/6));k++){const s2=k%2?1:-1,b=kk(v0+2,v1-2),y=kk(3,Math.max(3.5,H-3));const a=s2<0?u0:u1;F.box(s2<0?a-.55:a,s2<0?a:a+.55,b,b+.8,y,y+.6,metal,det);F.box(s2<0?a-.56:a+.54,s2<0?a-.54:a+.56,b+.1,b+.7,y+.08,y+.52,dmetal,det)}
    // escada de incêndio em prédio alto
    if(H>12&&o.fireEscape!==false){const a=u0+W0*.6,b=v1;for(let y=3.6;y<H-2;y+=3.6){F.box(a,a+3,b,b+.9,y,y+.08,dmetal,det);F.box(a,a+3,b+.85,b+.9,y,y+1,dmetal,det)}F.box(a+2.6,a+2.7,b+.4,b+.5,.26,H-2.5,dmetal,det)}
   }
   // --- fundos: área de serviço ---
   if(o.service!==false&&(o.backRoom??(D-v1))>=2.2){const b=v1,dm=Math.min(3,(o.backRoom??(D-v1))-.4),uc=o.svcU??(u0+W0*.28);
    F.box(uc-.6,uc+.6,b-.02,b+.03,.26,2.4,dmetal,det);F.box(uc-.9,uc+.9,b,b+1.1,2.6,2.7,metal,det);neon.box(...(()=>{const p=F.pt(uc,b+.3);return[p[0]-.12,2.45,p[1]-.12,p[0]+.12,2.55,p[1]+.12]})(),COL('#ffe2a0'));
    for(let k=0;k<2;k++){const a=uc+1.6+k*2.1,c=k?COL(night?'#2a4a3a':'#2e6a44'):COL(night?'#3a3a4a':'#4a5a6a');F.box(a,a+1.8,b+.3,b+Math.min(1.5,dm),.26,1.4,c,det,'rock');F.box(a-.05,a+1.85,b+.25,b+Math.min(1.55,dm+.05),1.4,1.5,c.clone().multiplyScalar(.8),det)}
    {const a=uc-2.8;F.box(a,a+1.2,b+.3,b+1.3,.26,.4,COL('#8a6a40'),det);F.box(a+.1,a+1.1,b+.4,b+1.2,.4,1.0,COL('#b89a6a'),det);F.box(a+1.3,a+2,b+.3,b+.9,.26,.7,COL('#a8865a'),det)}
    {const a=u1-2.5;F.box(a,a+1.6,b,b+.25,.8,1.6,COL('#7a7a80'),det);for(let k=0;k<3;k++)F.box(a+.15+k*.48,a+.5+k*.48,b+.25,b+.3,1.0,1.4,COL('#e8e8ec'),det)}
    {const a=u0+W0*.55;const gc=[COL('#ff3e9a'),COL('#2ad6ff'),COL('#f2c21a'),COL('#7a4ad6')];for(let k=0;k<4;k++)F.box(a+k*.7,a+k*.7+kk(.5,1.1),b+.01,b+.03,kk(.6,1),kk(1.4,2.2),gc[k],det)}
   }};
 const landmark=isoCapture((kind,X0,Z0,X1,Z1)=>{const paved=COL(night?'#4a4258':'#c9c2b2');/* no raised blanket over surrounding parking/asphalt */
  {const w=X1-X0,d=Z1-Z0,fit=proceduralFootprint(kind,X0,Z0,X1,Z1),nx0=fit[0],nz0=fit[1],nw=fit[2]-fit[0],nd=fit[3]-fit[1];
   /* v286: lote especial usa o asfalto global; sem placa sobre estacionamento. */
   {const rest=[];
    if(nw<w)rest.push([X0,Z0,nx0-.5,Z1],[nx0+nw+.5,Z0,X1,Z1]);if(nd<d)rest.push([nx0,Z0,nx0+nw,nz0-.5],[nx0,nz0+nd+.5,nx0+nw,Z1]);
    for(const r of rest){if(r[2]-r[0]<3||r[3]-r[1]<3)continue;if(kind==='univ'){side.box(r[0],.26,r[1],r[2],.32,r[3],cGrass,{});for(let k=0;k<(r[2]-r[0])*(r[3]-r[1])/120;k++)tree(rr(r[0]+2,r[2]-2),rr(r[1]+2,r[3]-2),.32,rr(.9,1.3))}else if(kind!=='gas')parking(r[0],r[1],r[2],r[3],'lp'+curRi+r[0].toFixed(0)+r[1].toFixed(0))}
    X0=nx0;Z0=nz0;X1=nx0+nw;Z1=nz0+nd}}
  const f=faceOf(X0,Z0,X1,Z1),F=LF(f,X0,Z0,X1,Z1),W=F.W,D=F.D;
  const cx=(X0+X1)/2,cz=(Z0+Z1)/2;
  // Only the structural base is extended to asphalt; roofs/doors retain their height.
  const baseBox=F.box;F.box=(u0,u1,v0,v1,y0,y1,...args)=>{if(y0===.26){const p=F.pt((u0+u1)/2,(v0+v1)/2);if(!mbDropIn(p[0],p[1]))y0=0}return baseBox(u0,u1,v0,v1,y0,y1,...args)};
  if(kind==='sky'){const hb=Math.min(W,D)/2-3,wc=COL(night?'#7a7088':'#c8bca6'),pier=wc.clone().multiplyScalar(1.12),tiers=[[1,0,24],[.76,24,58],[.56,58,84],[.4,84,100],[.26,100,109]];
   for(const[s,y0,y1] of tiers){const h=hb*s;walls.box(cx-h,y0,cz-h,cx+h,y1,cz+h,wc,{top:roofs,topCol:wc.clone().multiplyScalar(.85),win:[.25,.5]});
    const n=Math.max(2,Math.round(h/3.2));for(let k=0;k<=n;k++){const t=-h+k*(2*h/n);det.box(cx+t-.28,y0,cz-h-.18,cx+t+.28,y1+.4,cz-h,pier);det.box(cx+t-.28,y0,cz+h,cx+t+.28,y1+.4,cz+h+.18,pier);det.box(cx-h-.18,y0,cz+t-.28,cx-h,y1+.4,cz+t+.28,pier);det.box(cx+h,y0,cz+t-.28,cx+h+.18,y1+.4,cz+t+.28,pier)}
    if(y1<109){const led=COL(mallPal().a),e=h+.22;for(const[x0,z0,x1,z1] of [[cx-e,cz-e-.05,cx+e,cz-e+.05],[cx-e,cz+e-.05,cx+e,cz+e+.05],[cx-e-.05,cz-e,cx-e+.05,cz+e],[cx+e-.05,cz-e,cx+e+.05,cz+e]])neonDN.box(x0,y1-.05,z0,x1,y1+.45,z1,led)} /* v79r2: cada recuo ganha a mesma faixa de LED da coroa (antes só um friso amarelo à noite) */
    else if(night)neon.box(cx-h-.25,y1-.2,cz-h-.25,cx+h+.25,y1,cz+h+.25,COL('#ffe2a0'))}
   det.geo(GEO.cone,mtx(cx,109+10,cz,1.4,20,1.4),pier);det.box(cx-.12,129,cz-.12,cx+.12,133,cz+.12,cDet);neon.box(cx-.25,133,cz-.25,cx+.25,133.5,cz+.25,COL('#ff2a1a'));addCol(cx-hb,cz-hb,cx+hb,cz+hb,'bld');
   const e=F.pt(W/2,(D-2*hb)/2);F.box(W/2-3,W/2+3,(D-2*hb)/2-2.4,(D-2*hb)/2,3.6,3.9,COL('#2a2a30'));doorAt(F,W/2,(D-2*hb)/2);
   if(!night)for(const s2 of [-1,1]){const p=F.pt(W/2+s2*(hb+1),2.5);tree(p[0],p[1],.26,1)}
   /* v78 · ARRANHA-CÉU: terraços dos recuos, coroa com LED, letreiro, balancim e entrada */
   {const metal=COL(night?'#5a5e6a':'#a8acb4'),dmetal=COL(night?'#2e3038':'#5a5e66'),leaf=COL(night?'#2a4a34':'#3f7a45'),pot=COL(night?'#5a4a40':'#8a6a4a'),glass=COL(night?'#3a5a7a':'#8ab0c8');
    // terraços: guarda-corpo na borda + condensadoras + canteiros (sem sombra)
    for(let i=0;i<tiers.length-1;i++){const hO=hb*tiers[i][0],hI=hb*tiers[i+1][0],y=tiers[i][2];if(hO-hI<1.2)continue;
     for(const[x0,z0,x1,z1] of [[cx-hO,cz-hO,cx+hO,cz-hO+.08],[cx-hO,cz+hO-.08,cx+hO,cz+hO],[cx-hO,cz-hO,cx-hO+.08,cz+hO],[cx+hO-.08,cz-hO,cx+hO,cz+hO]]){roofD.box(x0,y+1,z0,x1,y+1.08,z1,metal);roofD.box(x0,y,z0,x1,y+.15,z1,dmetal)}
     const m=(hO+hI)/2;for(const[dx,dz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=cx+dx*m,z=cz+dz*m;roofD.box(x-.5,y,z-.5,x+.5,y+.6,z+.5,pot);roofD.geo(GEO.ico,mtx(x,y+1.1,z,.7,.6,.7),leaf)}
     for(let k=0;k<3;k++){const x=cx-hI+2+k*((2*hI-4)/2),z=cz+(hI+hO)/2;roofD.box(x-.6,y,z-.4,x+.6,y+.8,z+.4,metal)}}
    // coroa em treliça no topo + faixa de LED
    {const h=hb*tiers[tiers.length-1][0],y=109;for(const[dx,dz] of [[-1,-1],[1,-1],[1,1],[-1,1]])roofD.box(cx+dx*h-.15,y,cz+dz*h-.15,cx+dx*h+.15,y+6,cz+dz*h+.15,pier);
     /* v1r16: anéis de treliça removidos — acima do último andar ficam só as 4 pontas */
     const led=COL(mallPal().a);for(const[x0,z0,x1,z1] of [[cx-h,cz-h-.05,cx+h,cz-h+.05],[cx-h,cz+h-.05,cx+h,cz+h+.05],[cx-h-.05,cz-h,cx-h+.05,cz+h],[cx+h-.05,cz-h,cx+h+.05,cz+h]])neonDN.box(x0,y-.05,z0,x1,y+.45,z1,led)} /* v1r16: faixa ciano desceu pra borda do último andar (antes flutuava a +5,5 m nas pontas) */
    // letreiro no topo, virado para a frente
    {const c=cv(512,96),g=c.getContext('2d');g.fillStyle='#14161e';g.fillRect(0,0,512,96);g.font='700 54px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=night?'#ffe2a0':'#e8e4d8';g.fillText('SUNSET TOWER',256,50);
     const t=new THREE.CanvasTexture(c),mat=dnSignMat(t,.6),h=hb*tiers[tiers.length-2][0],p=F.p3(W/2,96,(D-2*h)/2-.34);signPlane(ch.group,mat,p[0],p[1],p[2],h*1.5,h*.28,Math.atan2(F.nrm[0],F.nrm[1]))}
    // balancim de limpeza na fachada da frente
    {const h=hb*tiers[1][0],p=F.p3(W/2+h*.35,44,(D-2*h)/2-.7);det.box(p[0]-2,p[1],p[2]-.4,p[0]+2,p[1]+.9,p[2]+.4,COL(night?'#8a8a40':'#e8c020'));for(const dx of[-1.9,1.9])det.box(p[0]+dx-.02,p[1]+.9,p[2]-.02,p[0]+dx+.02,58,p[2]+.02,dmetal)}
    // entrada: marquise maior, canteiros, mastros com bandeiras e frades
    {const v=(D-2*hb)/2;F.box(W/2-5,W/2+5,v-2.6,v,3.8,4.05,dmetal,det);F.box(W/2-5,W/2+5,v-2.65,v-2.55,3.6,4.1,glass,det);
     for(const s2 of[-1,1]){F.box(W/2+s2*7-1,W/2+s2*7+1,v-1.6,v-.2,.26,.8,COL(night?'#6a6470':'#bcb4a8'),det,'rock');const q=F.pt(W/2+s2*7,v-.9);det.geo(GEO.ico,mtx(q[0],1.3,q[1],.9,.6,.6),leaf);
      const fp=F.pt(W/2+s2*9.5,v-1.4);det.box(fp[0]-.06,.26,fp[1]-.06,fp[0]+.06,9,fp[1]+.06,metal);F.box(W/2+s2*9.5+.06*s2,W/2+s2*9.5+s2*1.9,v-1.42,v-1.38,7.6,8.8,s2<0?COL('#2a5ab0'):COL('#d8282a'),det)}
     for(let u=W/2-4.5;u<=W/2+4.5;u+=1.5){const q=F.pt(u,v-3.4);det.geo(GEO.cyl,mtx(q[0],.65,q[1],.12,.8,.12),metal)}}}
  }
  else if(kind==='hall'){const st2=COL(night?'#8a80a0':'#ece4d0'),st3=st2.clone().multiplyScalar(.86),w0=W*.12,w1=W*.88,v0=16,v1=D-5,H=15,po0=W*.3,po1=W*.7;
   F.box(w0,w1,v0,v1,.26,H,st2,walls,true,{win:[.5,.25]});F.box(w0-.3,w1+.3,v0-.3,v1+.3,H,H+.8,st3);
   for(let k=0;k<3;k++)F.box(po0-1-k*.6,po1+1+k*.6,4.5+k*1.2,v0,.26+k*.38,.26+(k+1)*.38,st3,det,k===0?'rock':false);
   F.box(po0,po1,7.6,v0,1.4,1.5,st3);const nC=8;for(let k=0;k<nC;k++){const u=po0+.9+k*((po1-po0-1.8)/(nC-1)),p=F.pt(u,8.6);cyl(p[0],1.4,12,p[1],.62,st2);cyl(p[0],11.6,12.3,p[1],.85,st3);cyl(p[0],1.4,1.9,p[1],.85,st3)}
   F.box(po0-.4,po1+.4,7.8,v0,12.3,13.6,st3);const A=F.p3(po0-.4,13.6,7.8),B=F.p3(po1+.4,13.6,7.8),T=F.p3(W/2,17.4,7.8),A2=F.p3(po0-.4,13.6,v0),B2=F.p3(po1+.4,13.6,v0),T2=F.p3(W/2,17.4,v0),ref=F.p3(W/2,14,v0+2);
   det.qa(A,B,T,T,st2,ref);det.qa(A,T,T2,A2,st3,F.p3(po0-6,10,(7.8+v0)/2));det.qa(B,T,T2,B2,st3,F.p3(po1+6,10,(7.8+v0)/2));det.qb(A,B,T,T,st2,ref);det.qb(A,T,T2,A2,st3,F.p3(po0-6,10,(7.8+v0)/2));det.qb(B,T,T2,B2,st3,F.p3(po1+6,10,(7.8+v0)/2));det.qa(A2,B2,T2,T2,st2,F.p3(W/2,14,v0-6));
   const dc=F.pt(W/2,(v0+v1)/2);cyl(dc[0],H+.8,H+4.5,dc[1],5.2,st2);det.geo(GEO.hemiHi,mtx(dc[0],H+4.5,dc[1],5.4,5.4,5.4),COL(night?'#4a8a9a':'#6a9a8a'));cyl(dc[0],H+9.9,H+12,dc[1],.8,st2);
   det.box(dc[0]-.06,H+12,dc[1]-.06,dc[0]+.06,H+16,dc[1]+.06,cDet);det.box(dc[0]+.06,H+14.6,dc[1]-.02,dc[0]+1.9,H+15.8,dc[1]+.02,COL('#2a8a3a'));
   for(const u of [W*.18,W*.82]){const p=F.pt(u,3);det.box(p[0]-.08,.26,p[1]-.08,p[0]+.08,10,p[1]+.08,cDet);det.box(p[0]+.08,8.4,p[1]-.02,p[0]+2.2,9.8,p[1]+.02,COL(u<W/2?'#2a5ab0':'#f0c020'))}
   bldKit(F,w0,w1,v0,v1,H+.8,{col:st2,parapet:false,avoid:[[W/2,(v0+v1)/2,6.5]]});
   /* v78 · PREFEITURA: nome no friso, jardins com sebes, chafariz, postes clássicos na escadaria */
   {const ry=Math.atan2(F.nrm[0],F.nrm[1]),hedge=COL(night?'#244a30':'#3a7a40'),water=COL(night?'#3a6a8a':'#6ab0d0'),lamp=COL('#2a2a30');
    /* nome: já existe a placa 'PREFEITURA DE SUNSET SHORES' (civic) */
    for(const s2 of[-1,1]){const a0=s2<0?w0:po1+2,a1=s2<0?po0-2:w1;if(a1-a0<5)continue;
     F.box(a0,a1,3.5,4,.26,1.05,hedge,det,'rock');F.box(a0,a0+.5,4,v0-1,.26,1.05,hedge,det);F.box(a1-.5,a1,4,v0-1,.26,1.05,hedge,det);
     const gc=(a0+a1)/2,gv=(4+v0)/2;if(s2<0){const p=F.pt(gc,gv);det.geo(GEO.cyl16,mtx(p[0],.55,p[1],2.4,.6,2.4),st3);det.geo(GEO.cyl16,mtx(p[0],.82,p[1],2.15,.05,2.15),water);det.geo(GEO.cyl,mtx(p[0],1.4,p[1],.35,1.4,.35),st2);det.geo(GEO.cyl16,mtx(p[0],2.15,p[1],1,.15,1),st3);det.geo(GEO.ico,mtx(p[0],2.45,p[1],.28,.28,.28),water);addCol(p[0]-2.4,p[1]-2.4,p[0]+2.4,p[1]+2.4,'rock')}
     else for(let k=0;k<3;k++){const p=F.pt(a0+1.5+k*((a1-a0-3)/2),gv);det.geo(GEO.ico,mtx(p[0],1,p[1],.9,.8,.9),hedge)}}
    for(const u of[po0-1.8,po1+1.8]){const p=F.pt(u,5);det.geo(GEO.cyl,mtx(p[0],1.9,p[1],.08,3.3,.08),lamp);for(const d of[-.45,.45]){det.geo(GEO.sph,mtx(p[0]+d,3.6,p[1],.22,.22,.22),COL(night?'#fff2c8':'#e8e8e0'));if(night)neon.box(p[0]+d-.12,3.48,p[1]-.12,p[0]+d+.12,3.72,p[1]+.12,COL('#fff2c8'))}det.box(p[0]-.5,3.45,p[1]-.04,p[0]+.5,3.5,p[1]+.04,lamp)}}
   doorAt(F,W/2,v0);if(night)glow.flat(cx-16,cz-16,cx+16,cz+16,.3,COL('#ffd9a0').multiplyScalar(.3))}
  else if(kind==='hosp'){const wc=COL(night?'#9a98b8':'#f2f2ee'),wc2=COL(night?'#8a88a8':'#e6e8ea'),tl=COL(night?'#3ad6c8':'#2a9a9a'),red=COL('#e01e2a'),v0=13,v1=D-4,H=rr(27,32),Hw=13,tu0=W*.33,tu1=W*.67;
   F.box(tu0,tu1,v0,v1,.26,H,wc,walls,true,{win:[.125,.125]});F.box(tu0+2,tu1-2,v0+3,v1-3,H,H+4,wc2,walls,false,{win:[.125,.125]});F.box(tu0-.3,tu1+.3,v0-.3,v1+.3,H,H+.5,wc.clone().multiplyScalar(.85));
   F.box(W*.05,tu0,v0+8,v1,.26,Hw,wc2,walls,true,{win:[.125,.25]});F.box(tu1,W*.95,v0+8,v1,.26,Hw,wc2,walls,true,{win:[.125,.25]});
   for(const[u0,u1] of [[W*.05,tu0],[tu1,W*.95]]){F.box(u0,u1,v0+7.7,v0+8,Hw-1.4,Hw-.6,tl);F.box(u0-.2,u1+.2,v0+7.8,v1+.2,Hw,Hw+.5,wc.clone().multiplyScalar(.85))}
   F.box(W/2-2.4,W/2+2.4,v0-.12,v0,6,H-2,COL(night?'#ffd9a0':'#7ab0d0'),hwinS);F.box(tu0,tu0+.6,v0-.4,v0,.26,H,tl);F.box(tu1-.6,tu1,v0-.4,v0,.26,H,tl);
   F.box(W/2-8,W/2+8,v0-6,v0,.26,5,COL(night?'#ffd9a0':'#9ac8e0'),hwinS,true);F.box(W/2-8.3,W/2+8.3,v0-6.3,v0,5,5.4,wc);F.box(W/2-8.3,W/2+8.3,v0-6.35,v0-6.2,4.6,5.4,red,neon);
   const cr=(u,y,s2,v)=>{F.box(u-s2*.5,u+s2*.5,v-.25,v-.05,y-s2*1.5,y+s2*1.5,red,neon);F.box(u-s2*1.5,u+s2*1.5,v-.25,v-.05,y-s2*.5,y+s2*.5,red,neon)};cr(W/2,H-3.5,1.3,v0);cr(W*.19,Hw-4,.9,v0+8);cr(W*.81,Hw-4,.9,v0+8);
   const hp=F.pt(W/2,(v0+v1)/2),HH=H+4;cyl(hp[0],HH,HH+.15,hp[1],Math.min(7,(v1-v0)/2-4),COL('#3a3a40'));const hs=COL('#f4f4f0');det.box(hp[0]-2,HH+.15,hp[1]-2.5,hp[0]-1.2,HH+.22,hp[1]+2.5,hs);det.box(hp[0]+1.2,HH+.15,hp[1]-2.5,hp[0]+2,HH+.22,hp[1]+2.5,hs);det.box(hp[0]-1.2,HH+.15,hp[1]-.4,hp[0]+1.2,HH+.22,hp[1]+.4,hs);
   bldKit(F,tu0,tu1,v0,v1,H+.5,{col:wc,roof:false,backRoom:D-v1});for(const[a0,a1] of [[W*.05,tu0],[tu1,W*.95]])bldKit(F,a0,a1,v0+8,v1,Hw+.5,{col:wc2,service:false,fireEscape:false,tank:false});
   /* v78 · HOSPITAL (ref. GTA IV/SA): marquise de concreto das ambulâncias, letreiros, placa no gramado, torre de antenas, chaminé, oxigênio */
   {const ry=Math.atan2(F.nrm[0],F.nrm[1]),conc=COL(night?'#7a7684':'#c8c2b4'),dmetal=COL(night?'#2e3038':'#5a5e66'),metal=COL(night?'#5a5e6a':'#a8acb4');
    // marquise de concreto sobre as ambulâncias (ala esquerda)
    {const a0=W*.06,a1=W*.27,b0=v0+.6,b1=v0+6.6;F.box(a0,a1,b0,b1,4.3,4.9,conc,det);F.box(a0-.1,a1+.1,b0-.1,b0+.1,4.9,5.3,conc,det);
     for(const[u,v] of [[a0+.4,b0+.4],[a1-.4,b0+.4],[a0+.4,b1-.4],[a1-.4,b1-.4]])F.box(u-.4,u+.4,v-.4,v+.4,.26,4.3,conc,det,'rock')}
    // letreiros em letras soltas (fundo transparente)
    const letters=(txt,col,w,h,u,y,v)=>{const c=cv(1024,128),g=c.getContext('2d');g.font='700 96px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.strokeStyle='#1a1a20';g.strokeText(translatePlain(txt),512,68);g.fillStyle=col;g.fillText(translatePlain(txt),512,68);
     const t=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.4}),p=F.p3(u,y,v);signPlane(ch.group,m,p[0],p[1],p[2],w,h,ry)};
    letters('HOSPITAL CENTRAL',night?'#e8f4ff':'#e8eef2',(tu1-tu0)*.9,(tu1-tu0)*.11,W/2,H-1.2,v0-.45);
    letters('EMERGÊNCIA','#ffffff',6.5,.8,W/2,5.0,v0-6.42); /* sobre a faixa vermelha, abaixo da placa do hospital */
    // placa baixa de pedra no gramado da frente
    {const u=W*.84,v=4.6;F.box(u-2.6,u+2.6,v-.35,v+.35,.26,1.5,conc,det,'rock');F.box(u-2.8,u+2.8,v-.45,v+.45,1.5,1.62,conc.clone().multiplyScalar(.9),det);
     const c=cv(512,96),g=c.getContext('2d');g.fillStyle='#e8e2d4';g.fillRect(0,0,512,96);g.fillStyle='#2a6a6a';g.font='700 40px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.fillText(translatePlain('HOSPITAL DE'),256,42);g.font='700 30px Fredoka, Arial Black, sans-serif';g.fillText('SUNSET SHORES',256,80);
     const t=new THREE.CanvasTexture(c),p=F.p3(u,.95,v-.37);signPlane(ch.group,new THREE.MeshLambertMaterial({map:t}),p[0],p[1],p[2],4.6,.9,ry)}
    // torre de antenas treliçada na ala direita + pratos (sem sombra)
    {const c=F.pt((tu1+W*.95)/2,(v0+8+v1)/2),y=Hw+.5,hh=12;for(const[dx,dz] of [[-.9,-.9],[.9,-.9],[.9,.9],[-.9,.9]])roofD.box(c[0]+dx-.07,y,c[1]+dz-.07,c[0]+dx+.07,y+hh,c[1]+dz+.07,metal);
     for(let k=1;k<6;k++){const yy=y+k*hh/6;roofD.box(c[0]-.95,yy,c[1]-.95,c[0]+.95,yy+.08,c[1]-.85,metal);roofD.box(c[0]-.95,yy,c[1]+.85,c[0]+.95,yy+.08,c[1]+.95,metal);roofD.box(c[0]-.95,yy,c[1]-.95,c[0]-.85,yy+.08,c[1]+.95,metal);roofD.box(c[0]+.85,yy,c[1]-.95,c[0]+.95,yy+.08,c[1]+.95,metal)}
     for(const[yy,a] of [[y+6,0],[y+8,1.6],[y+9.5,3.2],[y+7,4.6]])roofD.geo(GEO.sph,mtx(c[0]+Math.cos(a)*1.1,yy,c[1]+Math.sin(a)*1.1,.55,.55,.16,0,-a,0),COL('#e8e8ec'));
     roofD.box(c[0]-.04,y+hh,c[1]-.04,c[0]+.04,y+hh+3,c[1]+.04,dmetal);neon.box(c[0]-.12,y+hh+3,c[1]-.12,c[0]+.12,y+hh+3.25,c[1]+.12,COL('#ff2a1a'))}
    // chaminé de exaustão na ala esquerda
    {const c=F.pt((W*.05+tu0)/2,v1-3);roofD.geo(GEO.cyl,mtx(c[0],Hw+.5+3,c[1],.5,6,.5),conc);roofD.geo(GEO.cyl,mtx(c[0],Hw+.5+6.1,c[1],.6,.2,.6),dmetal)}
    // cilindros de oxigênio cercados nos fundos
    if(D-v1>=2.5){const u=tu1+3;for(let k=0;k<6;k++){const p=F.pt(u+(k%3)*.7,v1+.6+Math.floor(k/3)*.7);det.geo(GEO.cyl,mtx(p[0],1.2,p[1],.25,1.9,.25),COL(k%2?'#2a8a4a':'#e8e8ec'))}F.box(u-.4,u+2.2,v1+2.05,v1+2.1,.26,2.1,metal,det)}}
   const dp0=doorAt(F,W/2,v0-6);city.hosp={x:dp0[0]+F.nrm[0]*6,z:dp0[1]+F.nrm[1]*6};
   // quatro kits de primeiros socorros permanentes na frente do hospital,
   // coletáveis uma única vez e salvos via city.picked, como os demais pickups.
   {const tx=-F.nrm[1],tz=F.nrm[0];
    for(let j=0;j<4;j++){const off=(j-1.5)*3.2,id='hosp_med_'+curRi+'_'+j;
     if(city.picked.has(id)||pickups.some(p=>p.id===id))continue;
     makePickup(id,city.hosp.x+tx*off,city.hosp.z+tz*off,0,ch,'hp')}}
   // ambulâncias estacionadas na frente das alas do hospital, de frente para a rua
   {const a=Math.atan2(-F.nrm[1],-F.nrm[0]);[[W*.11,v0+3.4],[W*.2,v0+3.4],[W*.86,v0+3.4]].forEach(([u,v],j)=>{const id='amb'+curRi+'_'+j;if(city.taken.has(id)||u>W-3)return;const p=F.pt(u,v),c=makeVehicle('van',p[0],p[1],a,'#f4f4f0');c.ambulance=true;c.hand=true;c.sleep=true;c.spotId=id;ch.cars.push(c)})}

   {const id='amb'+curRi;if(!city.taken.has(id)){const p=F.pt(W/2+11,v0-3.5);const v=makeVehicle('van',p[0],p[1],Math.atan2(F.nrm[1],F.nrm[0])+Math.PI/2,'#f6f6f2');v.hand=true;v.sleep=true;v.spotId=id;ch.cars.push(v)}}}
  else if(kind==='gas'){gasCompact(F,curRi)}
  else if(kind==='pol'){worldPolice({det,neon,hwin:hwinS,walls,signs,night,F,W,D,f,doorAt,tree,ch,roofD})}
  else if(kind==='cem'){worldCemetery({det,side,plants,neon,glow,signs,night,F,W,D,f,roadAt,X0,Z0,X1,Z1,ch})}
  else if(kind==='bank'){const sc=COL(night?'#8a7aa0':'#d8ccb4'),sc2=sc.clone().multiplyScalar(.85),gold=COL('#e8b830'),v0=11,v1=D-8,w0=W*.18,w1=W*.82,H=14;
   F.box(w0,w1,v0,v1,.26,H,sc,walls,true,{win:[.625,.5]});F.box(w0-.4,w1+.4,v0-.4,v1+.4,H,H+1.2,sc2);F.box(w0-.2,w1+.2,v0-.25,v0,H-1.6,H-1.1,gold);F.box(w0-.2,w1+.2,v0-.25,v0,.26,1.2,sc2);
   for(let k=0;k<3;k++)F.box(W/2-6-k*.5,W/2+6+k*.5,v0-2.35+k*.7,v0,.26+k*.3,.26+(k+1)*.3,sc2,det,k===0?'rock':false);
   for(let k=0;k<4;k++){const u=W/2-4.5+k*3,p=F.pt(u,v0-1.2);cyl(p[0],1.16,H-1.6,p[1],.45,sc);cyl(p[0],H-2.1,H-1.6,p[1],.62,sc2)}F.box(W/2-5.4,W/2+5.4,v0-1.9,v0,H-1.6,H-.4,sc2);
   F.box(W/2-1.6,W/2+1.6,v0-.15,v0,1.16,4.4,COL('#1a1a20'));F.box(W/2-1.7,W/2+1.7,v0-.2,v0-.1,4.4,4.6,gold);
   {const vs=v0-.05,yb=H+1.75,sg=F.pt(W/2,vs);F.box(W/2-1.3,W/2+1.3,vs-.35,vs+.35,H+1.2,yb,sc2);F.box(W/2-1.4,W/2+1.4,vs-.42,vs+.42,yb-.12,yb,gold); /* v78: base aparente na borda da cornija (antes parecia flutuar) */neon.box(sg[0]-.06,yb+.18,sg[1]-.06,sg[0]+.06,yb+2.4,sg[1]+.06,gold);for(const y of [yb+2.05,yb+1.25,yb+.45])F.box(W/2-.7,W/2+.7,vs-.1,vs+.1,y,y+.22,gold,neon);F.box(W/2-.7,W/2-.48,vs-.1,vs+.1,yb+1.25,yb+2.27,gold,neon);F.box(W/2+.48,W/2+.7,vs-.1,vs+.1,yb+.45,yb+1.47,gold,neon)} // v77: "$" inteiro num plano só, apoiado na cornija
   for(const u of [w0+2,w1-3.2]){F.box(u,u+1.2,v0-.8,v0,.26,2.2,COL('#3a3a44'),det,'rock');F.box(u+.15,u+1.05,v0-.82,v0-.78,1.2,1.8,COL('#5ad0ff'),neon)}
   bldKit(F,w0,w1,v0,v1,H+1.2,{col:sc,parapet:false,avoid:[[W/2,v0+.6,2.5]]});
   /* v78 · BANCO: caixas eletrônicos na lateral, baia do carro-forte nos fundos, câmeras, nome na fachada */
   {const ry=Math.atan2(F.nrm[0],F.nrm[1]),dmetal=COL(night?'#2e3038':'#5a5e66'),metal=COL(night?'#5a5e6a':'#a8acb4');
    // lateral direita: nicho com 2 caixas eletrônicos e toldo
    {const v=(v0+v1)/2;F.box(w1,w1+.12,v-2.4,v+2.4,.26,3.2,sc2,det);F.box(w1,w1+1.4,v-2.6,v+2.6,3.2,3.45,gold,det);
     for(const dv of[-1.1,1.1]){F.box(w1+.12,w1+.62,v+dv-.45,v+dv+.45,.26,1.9,COL('#3a3a44'),det,'rock');F.box(w1+.62,w1+.64,v+dv-.3,v+dv+.3,1.25,1.7,COL('#5ad0ff'),neon);F.box(w1+.62,w1+.7,v+dv-.25,v+dv+.25,1.0,1.08,COL('#1a1a20'),det)}
     const c=cv(256,64),g=c.getContext('2d');g.fillStyle='#1a2a4a';g.fillRect(0,0,256,64);g.fillStyle='#ffd23a';g.textAlign='center';fitFill(g,translatePlain('24 HORAS'),128,44,236,34,'Silkscreen,monospace');
     const t=new THREE.CanvasTexture(c),p=F.p3(w1+1.42,3.35,v);signPlane(ch.group,dnSignMat(t,.5),p[0],p[1],p[2],2.4,.6,ry+Math.PI/2)}
    // fundos: portão do carro-forte, frades, carro-forte estacionado
    {const u=W/2+3;F.box(u-2.2,u+2.2,v1,v1+.06,.26,3.4,dmetal,det);for(let y=.6;y<3.4;y+=.45)F.box(u-2.2,u+2.2,v1+.06,v1+.09,y,y+.05,metal,det);F.box(u-2.4,u+2.4,v1,v1+.12,3.4,3.7,gold,det);
     for(const du of[-2.9,2.9]){const p=F.pt(u+du,v1+1.2);det.geo(GEO.cyl,mtx(p[0],.75,p[1],.15,1,.15),COL('#f2c21a'))}
     const id='armored'+curRi;if(!city.taken.has(id)&&D-v1>=6){const p=F.pt(u,v1+3.3);const c=makeVehicle('van',p[0],p[1],Math.atan2(F.nrm[1],F.nrm[0])+Math.PI,'#5a6a5a');c.hand=true;c.sleep=true;c.spotId=id;ch.cars.push(c)}}
    // câmeras de segurança nos 4 cantos
    for(const[u,v] of[[w0,v0],[w1,v0],[w0,v1],[w1,v1]]){const p=F.pt(u,v);det.box(p[0]-.1,H-1.4,p[1]-.1,p[0]+.1,H-1.2,p[1]+.1,dmetal);det.geo(GEO.cyl,mtx(p[0],H-1.55,p[1],.12,.35,.12,.6,0,0),COL('#e8e8ec'))}
    /* nome: já existe a placa 'BANCO DE SUNSET SHORES' (civic) */}
   doorAt(F,W/2,v0);{const pt=F.pt(W/2,v0-3.55);city.bankDoor={ri:curRi,x:pt[0],z:pt[1],nx:F.nrm[0],nz:F.nrm[1]}}if(night)glow.flat(cx-12,cz-12,cx+12,cz+12,.3,COL('#ffd070').multiplyScalar(.3))}
  else if(kind==='mkt'){const wc=COL(night?'#5a5070':'#e8e4dc'),band=COL(night?pick(st.neon||['#ff3e9a']):pick(['#d8282a','#2a8a3a','#e8a020','#1e5ab0'])),v0=D*.46,v1=D-3,H=7.5;
   F.box(3,W-3,v0,v1,.26,H,wc,det,true);F.box(2.8,W-2.8,v0-.3,v0+.2,H-.2,H+1.6,band,night?neon:det);
   {const o0=F.pt(0,0),ud=F.pt(1,0),vd=F.pt(0,1),U=[ud[0]-o0[0],ud[1]-o0[1]],V=[vd[0]-o0[0],vd[1]-o0[1]],P=dressPal(wc),W2=(u0,a,u1,b,n,o)=>{const p=F.pt(u0,a),q=F.pt(u1,b);dressWall(p[0],p[1],q[0],q[1],n[0],n[1],H,P,o)};
    const ws={winStyle:[22,30],win:[.625,.5]};W2(3,v1,3,v0+.3,[-U[0],-U[1]],ws);W2(W-3,v0+.3,W-3,v1,[U[0],U[1]],ws);W2(W*.65-.5,v1,3,v1,[V[0],V[1]],{...ws,plants:false})} /* v77: laterais/fundos do mercado */
   /* v78: vitrine acesa só no miolo da entrada; o resto é vidro escuro com montantes (antes a fachada inteira brilhava) */
   {const gl=COL(night?'#2a3440':'#7fa8bc');F.box(4,W/2-3.5,v0-.12,v0,.8,4.2,gl,det);F.box(W/2+3.5,W-4,v0-.12,v0,.8,4.2,gl,det);F.box(W/2-3.5,W/2+3.5,v0-.12,v0,.8,4.2,COL(night?'#e8c890':'#a8d0e0'),hwin);
    for(let u=4;u<W-4.01;u+=3)F.box(u-.06,u+.06,v0-.16,v0-.1,.8,4.2,COL('#3a3e48'))}
   F.box(W/2-5,W/2+5,v0-3,v0,4.2,4.5,band);for(const u of [W/2-4.8,W/2+4.8]){const p=F.pt(u,v0-2.8);det.box(p[0]-.1,.26,p[1]-.1,p[0]+.1,4.2,p[1]+.1,cDet)}
   for(let k=0;k<2;k++){const u=k?W*.8:W*.2;F.box(u-2,u+2,v0-4,v0-2.6,.26,1.1,COL('#9a9aa2'),det,'rock');for(let j=0;j<4;j++)F.box(u-1.8+j*.9,u-1.1+j*.9,v0-3.9,v0-2.7,.5,1.05,COL('#c8c8d0'))}
   parking(...(()=>{const a=F.pt(3,1.5),b=F.pt(W-3,v0-5.5);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]})(),'mk'+curRi);
   F.box(W*.65,W*.65+8,v1-.2,v1+.1,.26,4.4,COL('#3a3a40'));{const id='tk'+curRi;if(!city.taken.has(id)&&v1+5<D){const p=F.pt(W*.65+4,v1+1.2);const v=makeVehicle('truck',p[0],p[1],Math.atan2(F.nrm[1],F.nrm[0]),parkedCityColor('truck',id));v.hand=true;v.sleep=true;v.spotId=id;ch.cars.push(v)}}
   bldKit(F,3,W-3,v0,v1,H,{col:wc,svcU:W*.3,avoid:[[W/2,v0+.5,3]]});
   /* v78 · SUPERMERCADO: doca, prensa, carrinhos, faixas de oferta e letreiro de letras no telhado */
   {const ry=Math.atan2(F.nrm[0],F.nrm[1]),metal=COL(night?'#5a5e6a':'#9aa0a8'),dmetal=COL(night?'#2e3038':'#5a5e66'),yel=COL('#f2c21a'),blk=COL('#1a1a20');
    // doca: 2 portas com para-choques pretos, luzes e frades amarelos
    for(let k=0;k<2;k++){const u=W*.65+.6+k*3.8;F.box(u,u+3.2,v1,v1+.05,.26,3.6,dmetal,det);for(const du of[0,2.9])F.box(u+du,u+du+.3,v1,v1+.35,.6,1.4,blk,det);(night?neon:neonDN).box(...(()=>{const p=F.pt(u+1.6,v1+.2);return[p[0]-.15,4.1,p[1]-.15,p[0]+.15,4.25,p[1]+.15]})(),COL('#ffe2a0'))}
    for(const u of[W*.65-.4,W*.65+8.4]){const p=F.pt(u,v1+.9);det.geo(GEO.cyl,mtx(p[0],.75,p[1],.14,1,.14),yel)}
    // prensa de papelão com fardos
    {const u=W*.1;F.box(u,u+2.4,v1+.2,v1+1.8,.26,2.2,COL(night?'#3a4a6a':'#3a6ab0'),det,'rock');F.box(u+.2,u+2.2,v1+.15,v1+.2,1.2,2,dmetal,det);for(let k=0;k<2;k++)F.box(u+2.6+k*1.1,u+3.6+k*1.1,v1+.3,v1+1.2,.26,1,COL('#b89a6a'),det)}
    // ref. do usuário: fila de carrinhos encaixados ao lado da porta + frades de aço ao longo da vitrine
    {const c0=W/2+5.8,wire=COL(night?'#7a7e88':'#c4c8ce'),hdl=COL(night?'#8a2a3a':'#d83a3a'),tb=.035;for(let k=0;k<11;k++){const u=c0+k*.42,a0=v0-1.9,a1=v0-1.2;
      for(const y of[.55,1.05])for(const[x0,x1] of[[u,u+tb],[u+.9-tb,u+.9]])F.box(x0,x1,a0,a1,y,y+tb,wire,det);
      for(const y of[.55,1.05])F.box(u,u+.9,a0,a0+tb,y,y+tb,wire,det);F.box(u,u+.9,a1-tb,a1,.55,1.05,wire,det);
      F.box(u+.05,u+.85,a1-.02,a1+.06,1.08,1.14,hdl,det);for(const du of[.08,.82])F.box(u+du-.02,u+du+.02,a0+.05,a0+.09,.26,.55,wire,det)}
     const a=F.pt(c0,v0-1.9),b=F.pt(c0+5.5,v0-1.2);addCol(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),'rock')}
    for(let u=4.5;u<W-4.5;u+=2){if(Math.abs(u-W/2)<5.6||(u>W/2+5.4&&u<W/2+12))continue;const p=F.pt(u,v0-2.4);det.geo(GEO.cyl,mtx(p[0],.75,p[1],.09,1,.09),COL(night?'#9aa0aa':'#d4d8de'))}
    // faixas de OFERTAS na fachada (planos pintados, viradas para a rua)
    const ban=(txt,sub,col)=>{const c=cv(256,96),g=c.getContext('2d');g.fillStyle=col;g.fillRect(0,0,256,96);g.fillStyle='#fff';g.textAlign='center';fitFill(g,translatePlain(txt),128,46,236,40,'Silkscreen,monospace');g.fillStyle='#ffe85a';fitFill(g,translatePlain(sub),128,80,236,22,'Silkscreen,monospace');const t=new THREE.CanvasTexture(c);return dnSignMat(t,.35)};
    for(const[u,txt,sub,col] of [[W*.18,'OFERTAS','ATÉ 50% OFF','#d8202a'],[W*.82,'HORTIFRÚTI','FRESQUINHO','#2a8a3a']]){const p=F.p3(u,5.6,v0-.08);signPlane(ch.group,ban(txt,sub,col),p[0],p[1],p[2],4,1.5,ry)}
    // letreiro de letras soltas no telhado, com estrutura metálica atrás
    {const c=cv(1024,160),g=c.getContext('2d');g.clearRect(0,0,1024,160);g.font='700 128px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=10;g.strokeStyle='#1a1a20';g.strokeText(translatePlain('SUPERMERCADO'),512,84);g.fillStyle=night?'#ffe85a':'#d8202a';g.fillText(translatePlain('SUPERMERCADO'),512,84);
     const t=new THREE.CanvasTexture(c);const mat=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.4});const p=F.p3(W/2,H+3.3,v0+.4);signPlane(ch.group,mat,p[0],p[1],p[2],15,2.4,ry);
     for(let k=0;k<5;k++){const u=W/2-6+k*3;F.box(u-.06,u+.06,v0+.55,v0+.67,H+1.6,H+4.3,dmetal,roofD)}F.box(W/2-7.4,W/2+7.4,v0+.55,v0+.67,H+2.3,H+2.4,dmetal,roofD)}}
   doorAt(F,W/2,v0);if(night)glow.flat(cx-16,cz-16,cx+16,cz+16,.3,COL('#fff2c8').multiplyScalar(.28))}
  else if(kind==='mall'){mallBuild({F,W,D,night,det,walls,hwin,neon,glow,doorAt,ch,dressWall,dressPal,roofD,neonDN})}
  else if(kind==='univ'){const br=COL(night?'#8a4a6a':'#9a4a36'),trm=COL(night?'#d8d0e0':'#ece4d4'),H=13,dep=Math.min(16,D*.28),gap=W*.18;
   F.box(4,W-4,D-4-dep,D-4,.26,H,br,walls,true,{win:[.375,.375]});F.box(4,4+dep,8,D-4-dep,.26,H-2,br,walls,true,{win:[.375,.375]});F.box(W-4-dep,W-4,8,D-4-dep,.26,H-2,br,walls,true,{win:[.375,.375]});
   F.box(3.7,W-3.7,D-4.3-dep,D-3.7,H,H+.6,trm);F.box(3.7,4.3+dep,7.7,D-4-dep,H-2,H-1.4,trm);F.box(W-4.3-dep,W-3.7,7.7,D-4-dep,H-2,H-1.4,trm);
   const q0=4+dep,q1=W-4-dep;side.box(...(()=>{const a=F.pt(q0,8),b=F.pt(q1,D-4-dep);return[Math.min(a[0],b[0]),.26,Math.min(a[1],b[1]),Math.max(a[0],b[0]),.32,Math.max(a[1],b[1])]})(),cGrass,{});
   F.box(W/2-1.2,W/2+1.2,0,D-4-dep,.26,.34,paved);for(let k=0;k<6;k++){const p=F.pt(q0+3+R()*(q1-q0-6),10+R()*(D-dep-18));if(Math.abs(F.pt(W/2,0)[0]-p[0])<2.5&&(F.f==='s'||F.f==='n'))continue;tree(p[0],p[1],.32,rr(.9,1.2))}
   const tp=F.pt(W/2,D-4-dep/2),TH=32;det.box(tp[0]-3.5,.26,tp[1]-3.5,tp[0]+3.5,TH,tp[1]+3.5,br);det.box(tp[0]-3.8,TH-6,tp[1]-3.8,tp[0]+3.8,TH-5.5,tp[1]+3.8,trm);addCol(tp[0]-3.5,tp[1]-3.5,tp[0]+3.5,tp[1]+3.5,'bld');
   const ap=[tp[0],TH+6,tp[1]],q=[[tp[0]-3.6,TH,tp[1]-3.6],[tp[0]+3.6,TH,tp[1]-3.6],[tp[0]+3.6,TH,tp[1]+3.6],[tp[0]-3.6,TH,tp[1]+3.6]];for(let k=0;k<4;k++)roofs2.qa(q[k],q[(k+1)%4],ap,ap,COL('#3a4a5a'),[tp[0],TH+1,tp[1]]);
   for(const[ry,dx,dz] of [[0,0,3.52],[Math.PI,0,-3.52],[Math.PI/2,3.52,0],[-Math.PI/2,-3.52,0]]){det.geo(GEO.disc,mtx(tp[0]+dx,TH-3,tp[1]+dz,1.6,1.6,1,0,ry,0),COL('#f4f0e0'));const hx=dx?0:1,hz=dx?1:0;det.box(tp[0]+dx*1.003-hx*.06-(dx?.02:0),TH-3,tp[1]+dz*1.003-hz*.06,tp[0]+dx*1.003+hx*.06+(dx?.02:0),TH-1.7,tp[1]+dz*1.003+hz*.06,COL('#1a1a1a'))}
   for(const u of [q0-1,q1+1]){F.box(u-.8,u+.8,0,1.6,.26,4.2,trm,det,'rock');det.geo(GEO.ico,mtx(...(()=>{const p=F.pt(u,.8);return[p[0],4.6,p[1]]})(),.5,.5,.5),trm)}
   bldKit(F,4,W-4,D-4-dep,D-4,H+.6,{col:br,parapet:false,roof:false,backRoom:4});
   /* v78 · UNIVERSIDADE (ref. Harvard): mansarda de ardósia, frontões na fachada, chaminés, pórtico com escadaria e guarda-corpo, estátua, bancos e postes no pátio */
   {const vf=D-4-dep,vb=D-4,slate=COL(night?'#3a3e4e':'#4e5560'),trm2=trm,ctr=[W/2,(vf+vb)/2],lamp=COL('#2a2a30'),bench=COL(night?'#5a4030':'#8a6038'),stone=COL(night?'#b8b0bc':'#e2dccc');
    // mansarda: 4 águas inclinadas + topo, sem sobrepor a torre do relógio
    {const y0=H+.6,y1=H+3.4,i=2.2,o=[[3.7,vf-.3],[W-3.7,vf-.3],[W-3.7,vb+.3],[3.7,vb+.3]],n=[[3.7+i,vf-.3+i],[W-3.7-i,vf-.3+i],[W-3.7-i,vb+.3-i],[3.7+i,vb+.3-i]],c=F.p3(ctr[0],y0,ctr[1]);
     for(let k=0;k<4;k++){const a=o[k],b2=o[(k+1)%4],c2=n[(k+1)%4],d=n[k];roofs2.qa(F.p3(a[0],y0,a[1]),F.p3(b2[0],y0,b2[1]),F.p3(c2[0],y1,c2[1]),F.p3(d[0],y1,d[1]),slate,c)}
     roofs2.qa(F.p3(n[0][0],y1,n[0][1]),F.p3(n[1][0],y1,n[1][1]),F.p3(n[2][0],y1,n[2][1]),F.p3(n[3][0],y1,n[3][1]),slate.clone().multiplyScalar(.9),F.p3(ctr[0],y1-5,ctr[1]));
     for(const u of[W*.2,W*.4,W*.6,W*.8])if(Math.abs(u-W/2)>6)F.box(u-.5,u+.5,vb-1.2,vb-.2,y0,y1+1.6,br,roofD);
     // trapeiras (janelinhas na água da frente)
     for(let k=0;k<6;k++){const u=6+k*((W-12)/5);if(Math.abs(u-W/2)<4.5)continue;F.box(u-.7,u+.7,vf+.4,vf+1.4,y0+.4,y0+2.2,trm2,roofD);F.box(u-.45,u+.45,vf+.38,vf+.42,y0+.7,y0+1.9,COL(night?'#ffd9a0':'#3a4a5a'),roofD)}}
    // mesma mansarda nas duas alas
    for(const[a0,a1] of [[3.7,4.3+dep],[W-4.3-dep,W-3.7]]){const y0=H-1.4,y1=H+.8,i=1.8,o=[[a0,7.7],[a1,7.7],[a1,vf],[a0,vf]],n=[[a0+i,7.7+i],[a1-i,7.7+i],[a1-i,vf-.2],[a0+i,vf-.2]],c=F.p3((a0+a1)/2,y0,(7.7+vf)/2);
     for(let k=0;k<4;k++){const a=o[k],b2=o[(k+1)%4],c2=n[(k+1)%4],d=n[k];roofs2.qa(F.p3(a[0],y0,a[1]),F.p3(b2[0],y0,b2[1]),F.p3(c2[0],y1,c2[1]),F.p3(d[0],y1,d[1]),slate,c)}
     roofs2.qa(F.p3(n[0][0],y1,n[0][1]),F.p3(n[1][0],y1,n[1][1]),F.p3(n[2][0],y1,n[2][1]),F.p3(n[3][0],y1,n[3][1]),slate.clone().multiplyScalar(.9),F.p3((a0+a1)/2,y1-5,(7.7+vf)/2));
     F.box((a0+a1)/2-.45,(a0+a1)/2+.45,12,13,y0,y1+1.4,br,roofD)}
    // frontões pontudos na fachada (triângulos de tijolo com friso claro e janela redonda)
    for(const u of[W*.22,W*.78]){const y0=H+.6,hw=3.4,A=F.p3(u-hw,y0,vf-.05),B=F.p3(u+hw,y0,vf-.05),T=F.p3(u,y0+4.2,vf-.05),ref=F.p3(u,y0,vf+3);
     det.qa(A,B,T,T,br,ref);det.qb(A,B,T,T,br,ref);F.box(u-hw-.2,u+hw+.2,vf-.25,vf,y0-.25,y0,trm2,det);const wc0=F.p3(u,y0+1.7,vf-.12);det.geo(GEO.disc,mtx(wc0[0],wc0[1],wc0[2],.75,.75,1,0,Math.atan2(F.nrm[0],F.nrm[1]),0),COL(night?'#ffd9a0':'#3a4a5a'))}
    // pórtico da entrada: escadaria, 2 pilares, frontão pequeno e guarda-corpo baixo
    {const u=W/2;for(let k=0;k<3;k++)F.box(u-2.8+k*.25,u+2.8-k*.25,vf-2.6+k*.75,vf,.26,.26+(k+1)*.2,stone,det,k===0?'rock':false);
     for(const s2 of[-1,1])F.box(u+s2*2.3-.35,u+s2*2.3+.35,vf-2.2,vf-1.5,.86,4,stone,det,'rock');F.box(u-2.8,u+2.8,vf-2.4,vf,4,4.5,trm2,det);
     {const A=F.p3(u-3,4.5,vf-2.42),B=F.p3(u+3,4.5,vf-2.42),T=F.p3(u,6.2,vf-2.42),ref=F.p3(u,4.5,vf+1);det.qa(A,B,T,T,br,ref);det.qb(A,B,T,T,br,ref)}
     for(const s2 of[-1,1]){F.box(Math.min(u+s2*3.2,u+s2*7.5),Math.max(u+s2*3.2,u+s2*7.5),vf-1.7,vf-1.3,.26,1.1,trm2,det,'rock');for(let k=0;k<6;k++){const uu=u+s2*(3.5+k*.7);F.box(uu-.08,uu+.08,vf-1.6,vf-1.4,1.1,1.1,trm2,det)}}}
    // pátio: estátua sobre pedestal, bancos e postes ao longo do caminho
    {const sv=(8+vf)/2,su=W/2+5;F.box(su-.9,su+.9,sv-.9,sv+.9,.26,1.4,stone,det,'rock');const p=F.p3(su,1.4,sv);det.box(p[0]-.35,1.4,p[2]-.25,p[0]+.35,2.7,p[2]+.25,COL(night?'#4a6a5a':'#5a8a6a'));det.geo(GEO.ico,mtx(p[0],3,p[2],.24,.28,.24),COL(night?'#4a6a5a':'#5a8a6a'))}
    for(let v=10;v<vf-2;v+=6)for(const s2 of[-1,1]){const u=W/2+s2*2.2,p=F.pt(u,v);det.geo(GEO.cyl,mtx(p[0],2.1,p[1],.06,3.7,.06),lamp);det.geo(GEO.sph,mtx(p[0],4.1,p[1],.26,.26,.26),COL(night?'#fff2c8':'#e8e8e0'));if(night)neon.box(p[0]-.15,3.95,p[1]-.15,p[0]+.15,4.25,p[1]+.15,COL('#fff2c8'))}
    for(const[u,v] of[[W/2-4.5,14],[W/2+4.5,14],[W/2-4.5,vf-6],[W/2+8,vf-6]])if(v<vf-2){F.box(u-.9,u+.9,v-.25,v+.25,.26+.45,.26+.55,bench,det);F.box(u-.9,u+.9,v+.2,v+.3,.7,1.25,bench,det);for(const du of[-.8,.8])F.box(u+du-.06,u+du+.06,v-.2,v+.2,.26,.7,lamp,det)}
    {const u=W/2-6.5,v=vf-3.5;for(let k=0;k<5;k++)F.box(u+k*.55,u+k*.55+.05,v,v+.05,.26,.85,lamp,det);F.box(u,u+2.25,v,v+.05,.8,.85,lamp,det)}}
   doorAt(F,W/2,D-4-dep)}
  else if(kind==='stad'){const a=W/2-2,b=D/2-2,N2=28,Hs=13,c1=COL(night?'#5a4a7a':'#b8b4ac'),s1=COL(night?'#2ad6ff':'#2a6ab0'),s2=COL(night?'#ff3e9a':'#d83a2a'),fieldC=COL(night?'#1e5a3a':'#3a8a3a');
   side.box(cx-a*.6,.26,cz-b*.55,cx+a*.6,.32,cz+b*.55,fieldC,{});const ln=COL('#f0f0ea');marks.flat(cx-.12,cz-b*.5,cx+.12,cz+b*.5,.33,ln);marks.flat(cx-a*.55,cz-.12,cx+a*.55,cz+.12,.33,ln);
   const P2=(t,r,y)=>[cx+Math.cos(t)*a*r,y,cz+Math.sin(t)*b*r];const gapK=[0,N2/2];
   for(let k=0;k<N2;k++){const t0=k/N2*6.283,t1=(k+1)/N2*6.283,isGap=gapK.includes(k);const top=isGap?4:Hs,col=k%2?s1:s2;
    if(!isGap){det.qa(P2(t0,.74,1.2),P2(t1,.74,1.2),P2(t1,.98,top),P2(t0,.98,top),col,P2((t0+t1)/2,1.6,-30));for(let r=.78;r<.97;r+=.06){const y=1.2+(r-.74)/.24*(top-1.2);det.qa(P2(t0,r,y),P2(t1,r,y),P2(t1,r,y+.12),P2(t0,r,y+.12),col.clone().multiplyScalar(.7),P2((t0+t1)/2,.5,y))}}
    if(isGap){for(const t of [t0,t1]){const p=P2(t,1,0);det.box(p[0]-.6,.26,p[2]-.6,p[0]+.6,7,p[2]+.6,c1);addCol(p[0]-.6,p[2]-.6,p[0]+.6,p[2]+.6,'rock')}
     const A=P2(t0,1,6.2),B=P2(t1,1,6.2);det.qa(A,B,[B[0],7.2,B[2]],[A[0],7.2,A[2]],c1.clone().multiplyScalar(.9),[cx,3,cz]);det.qa(A,B,[B[0],7.2,B[2]],[A[0],7.2,A[2]],c1.clone().multiplyScalar(.9),P2((t0+t1)/2,3,3));continue}
    det.qa(P2(t0,1,.26),P2(t1,1,.26),P2(t1,1,top),P2(t0,1,top),c1,[cx,4,cz]);det.qa(P2(t0,.98,top),P2(t1,.98,top),P2(t1,1.0,top+.4),P2(t0,1.0,top+.4),c1.clone().multiplyScalar(.85),[cx,top-5,cz]);
    for(const[t,nb,dir] of [[t0,k-1,1],[t1,k+1,-1]]){if(!gapK.includes((nb+N2)%N2))continue;const A=P2(t,.74,.26),B=P2(t,1,.26),C=P2(t,1,top+.4),D2=P2(t,.98,top),E2=P2(t,.74,1.2),ref=P2(t+dir*.08,.87,4);det.qa(A,B,C,D2,c1.clone().multiplyScalar(.92),ref);det.qa(A,D2,E2,E2,c1.clone().multiplyScalar(.92),ref)}
    for(const rq of [.8,.93])for(const fr of [.25,.75]){const q=P2(t0+(t1-t0)*fr,rq,0),hs=Math.max(1.8,a*.05);addCol(q[0]-hs,q[2]-hs,q[0]+hs,q[2]+hs,'bld')}}
   for(const t of [.785,2.356,3.927,5.498]){const p=P2(t,1.03,0);det.box(p[0]-.35,.26,p[2]-.35,p[0]+.35,26,p[2]+.35,cDet);det.box(p[0]-2,26,p[2]-2,p[0]+2,28.5,p[2]+2,COL('#2a2a30'));neon.box(p[0]-1.8,26.2,p[2]-1.8,p[0]+1.8,28.3,p[2]+1.8,COL(night?'#fff6d8':'#d8d8d0'));addCol(p[0]-.4,p[2]-.4,p[0]+.4,p[2]+.4,'rock')}
   {const t0=0,t1=6.283/N2,A=P2(t0,1,0),B=P2(t1,1,0),tc=(t0+t1)/2,m=P2(tc,1,0);let nx=Math.cos(tc)/a,nz=Math.sin(tc)/b;const L=Math.hypot(nx,nz);nx/=L;nz/=L;
    const w=Math.hypot(B[0]-A[0],B[2]-A[2])+1.4;det.box(Math.min(A[0],B[0])-.3,7.2,Math.min(A[2],B[2])-.3,Math.max(A[0],B[0])+.3,7.35,Math.max(A[2],B[2])+.3,c1);
    signPlane(ch.group,sunsetSignMat(['ESTÁDIO DE','SUNSET SHORES'],'#192c3e','#f7eee0',w/1.4),m[0]+nx*.35,7.98,m[2]+nz*.35,w,1.4,Math.atan2(nx,nz))}
   /* v78 · ESTÁDIO: bilheterias nas 2 entradas, telão no alto da arquibancada, faixas na parede externa */
   {const metal=COL(night?'#5a5e6a':'#a8acb4'),dk=COL('#1a1a20');
    for(const tg of[0,Math.PI]){for(const sd of[-1,1]){const t=tg+sd*(6.283/N2)*1.9,p=P2(t,1.12,0),ex=Math.cos(t)/a,ez=Math.sin(t)/b,ax=Math.abs(ex)>=Math.abs(ez),nx=ax?Math.sign(ex):0,nz=ax?0:Math.sign(ez),L=1; /* cabine é alinhada aos eixos: placa e janela na face que olha pra fora */
      det.box(p[0]-1.3,.26,p[2]-1.3,p[0]+1.3,2.8,p[2]+1.3,c1);det.box(p[0]-1.5,2.8,p[2]-1.5,p[0]+1.5,3.05,p[2]+1.5,s2);addCol(p[0]-1.3,p[2]-1.3,p[0]+1.3,p[2]+1.3,'rock');
      const c=cv(256,64),g=c.getContext('2d');g.fillStyle='#192c3e';g.fillRect(0,0,256,64);g.fillStyle='#f7eee0';g.textAlign='center';fitFill(g,translatePlain('BILHETERIA'),128,42,236,30,'Silkscreen,monospace');
      const tx=new THREE.CanvasTexture(c);signPlane(ch.group,dnSignMat(tx,.5),p[0]+nx*1.33,2.3,p[2]+nz*1.33,2.2,.5,Math.atan2(nx,nz));
      {const w=.75,dd=.06;det.box(p[0]+nx*1.3-(nz?w:dd),1.1,p[2]+nz*1.3-(nx?w:dd),p[0]+nx*1.3+(nz?w:dd),1.8,p[2]+nz*1.3+(nx?w:dd),COL(night?'#ffd9a0':'#7ab0d0'))}}}
    {const t=Math.PI/2,p=P2(t,.99,0),nx=Math.cos(t)/a,nz=Math.sin(t)/b,L=Math.hypot(nx,nz),w=Math.min(16,a*.6);det.box(p[0]-w/2,Hs+.4,p[2]-.4,p[0]+w/2,Hs+6.4,p[2]+.4,dk);for(const dx of[-w/3,w/3])det.box(p[0]+dx-.25,Hs,p[2]-.25,p[0]+dx+.25,Hs+.4,p[2]+.25,metal);
     const c=cv(512,192),g=c.getContext('2d');g.fillStyle='#05070c';g.fillRect(0,0,512,192);if(!st.noLamps){g.fillStyle='#ffd23a';g.font='700 36px Silkscreen,monospace';g.textAlign='center';g.fillText('SUNSET  2 x 1  PORTO',256,72);g.fillStyle='#56f4ff';g.font='700 30px Silkscreen,monospace';g.fillText("78'",256,124);g.fillStyle='#ff3e9a';g.fillRect(40,150,432,8)}
     const tx=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({map:tx});signPlane(ch.group,m,p[0]-nx/L*.42,Hs+3.4,p[2]-nz/L*.42,w-.6,5.4,Math.atan2(-nx,-nz))}
    for(let k=0;k<N2;k++){if(k%3!==1||gapK.includes(k))continue;const t=(k+.5)/N2*6.283,p=P2(t,1.005,0),nx=Math.cos(t)/a,nz=Math.sin(t)/b,L=Math.hypot(nx,nz);
     const c=cv(64,192),g=c.getContext('2d');g.fillStyle=k%2?'#2a6ab0':'#d83a2a';g.fillRect(0,0,64,192);g.fillStyle='#f7eee0';g.fillRect(8,20,48,6);g.fillRect(8,166,48,6);g.font='700 40px Silkscreen,monospace';g.textAlign='center';g.fillText('SS',32,110);
     const tx=new THREE.CanvasTexture(c);signPlane(ch.group,new THREE.MeshLambertMaterial({map:tx}),p[0]+nx/L*.25,Hs-4.5,p[2]+nz/L*.25,1.6,5,Math.atan2(nx,nz))}}
   const g0=P2(0,1.02,0);regDoor(g0[0],g0[2],'e',g0[2],false);if(night)glow.flat(cx-a*.7,cz-b*.7,cx+a*.7,cz+b*.7,.36,COL('#fff2c8').multiplyScalar(.25))}
  // Referências municipais somente nas fachadas, sem alterar o mapa ou a geometria.
  const civic={hall:{lines:['PREFEITURA DE','SUNSET SHORES'],v:7.65,y:11.45,w:Math.min(15,W*.38),h:1.12},
   hosp:{lines:['HOSPITAL DE','SUNSET SHORES'],v:12.55,y:7.3,w:11,h:1.5},
   bank:{lines:['BANCO DE SUNSET SHORES'],v:11-1.92,y:13,w:10.2,h:.9}, /* v78: colada no frontão do pórtico (antes 2 m à frente, flutuando) */
   univ:{lines:['UNIVERSIDADE DE','SUNSET SHORES'],v:D-4-Math.min(16,D*.28)-.16,y:10.1,w:Math.min(18,W*.43),h:1.24},
   };
  if(civic[kind]){const q=civic[kind];sunsetFacade(ch,F,W/2,q.v,q.y,q.w,q.h,q.lines,'#192c3e','#f7eee0')}
 });
 /* --- city blocks owned by this chunk --- */
 ch.rects=[];city.rects.forEach((rect,ri)=>{const[bx0,bz0,bx1,bz1]=rect;if(!own((bx0+bx1)/2,(bz0+bz1)/2))return;ch.rects.push(ri);const info=city.info[ri];R=mulberry32(info.seed);curRi=ri;curI=null;city.doors.set(ri,[]);
  const BW=bx1-bx0,BH=bz1-bz0,dc=info.dc,cx=E/2;
  if(info.motelLot){const ix0=bx0+SW,iz0=bz0+SW,ix1=bx1-SW,iz1=bz1-SW,mf=faceOf(ix0,iz0,ix1,iz1),MF=LF(mf,ix0,iz0,ix1,iz1);sideSlab(side,ix0,0,iz0,ix1,.03,iz1,COL(night?'#3c3844':'#6a675f'));/* r29: faixa de 4 m em volta do motel não tinha laje nenhuma (aparecia o asfalto do chão, cinza fora do padrão); motel na roça → grama como os lotes rurais; na cidade (7×7 sem roça) → calçada normal; cantos arredondados */{const mx=(bx0+bx1)/2,mz=(bz0+bz1)/2,rur=[[bx0-2,mz],[bx1+2,mz],[mx,bz0-2],[mx,bz1+2]].filter(q=>isRural(q[0],q[1])).length>=2,g=rur?cGrass:cSide,y1=.2;side.rslab(bx0,bz0,bx1,iz0,0,y1,g,[0,slabR(bx1,bz0),slabR(bx0,bz0),0]);side.rslab(bx0,iz1,bx1,bz1,0,y1,g,[slabR(bx1,bz1),0,0,slabR(bx0,bz1)]);side.box(bx0,0,iz0,ix0,y1,iz1,g);side.box(ix1,0,iz0,bx1,y1,iz1,g)}motelBuild(MF,1.5,MF.W-1.5,1.5,MF.D-1.5,ri);return}
  if(info.kind==='haze'){ // v78: sem laje/gramado por lote — o chão da ilha é um terreno único (hazeTerrain)
   const hzMB=[side,det,plants,hazeCastle,lodNear,marks,glow,roofD,neonDN],hzL=hzMB.map(m=>m.p.length),hzLift=()=>{hzMB.forEach((m,k)=>{const p=m.p;for(let j=hzL[k];j<p.length;j+=3)p[j+1]+=hazeH(p[j],p[j+2])})}; // v78: tudo do lote acompanha o relevo
   const bark=COL('#4a3f36'),cx0=(bx0+bx1)/2,cz0=(bz0+bz1)/2,keep=info.safe?[cx0-19,cz0-17,cx0+19,bz1]:null,free=(x,z,m)=>!keep||x<keep[0]-m||x>keep[2]+m||z<keep[1]-m||z>keep[3]+m;
   const boulder=(x,z,sc)=>{det.geo(GEO.ico,mtx(x,.1+sc*.3,z,sc*rr(1,1.5),sc*rr(.55,.95),sc*rr(1,1.5),rr(0,3),rr(0,6),rr(0,3)),COL(pick(['#8a8a8e','#6e6e72','#a2a09a'])).multiplyScalar(rr(.85,1.05)));addCol(x-sc*.95,z-sc*.95,x+sc*.95,z+sc*.95,'rock')};
   if(info.safe){// castelo em ruínas: torre de menagem (a casa segura), 4 torres e muralha caída com portão ao sul
    const st1=COL('#a09684'),st2=COL('#8a8274'),st3=COL('#726b60'),dk=COL('#2a2724'),kx0=cx0-7,kx1=cx0+7,kz0=cz0-6,kz1=cz0+6;
    const kH=[10,10,7.2,9.2];[[kx0,kz0,cx0,cz0],[cx0,kz0,kx1,cz0],[kx0,cz0,cx0,kz1],[cx0,cz0,kx1,kz1]].forEach((q,i)=>{hazeCastle.box(q[0],.2,q[1],q[2],kH[i],q[3],i%2?st1:st1.clone().multiplyScalar(.96));
     for(let x=q[0]+.3;x<q[2]-.5;x+=1.6)for(const z of [q[1],q[3]-.6])if(R()<.75)hazeCastle.box(x,kH[i],z,x+.8,kH[i]+.9,z+.6,st2);
     for(let z=q[1]+.3;z<q[3]-.5;z+=1.6)for(const x of [q[0],q[2]-.6])if(R()<.75)hazeCastle.box(x,kH[i],z,x+.6,kH[i]+.9,z+.8,st2)});
    addCol(kx0,kz0,kx1,kz1,'bld');
    /* v78: pedra com relevo — blocos salientes claros/escuros espalhados, faixa de musgo e umidade na base, sorteio próprio */
    {const sr=mulberry32((city.hzSeed^0x51a7)>>>0),moss=COL('#5a6a44'),pal=[COL('#b0a694'),COL('#8e8676'),COL('#9a9282'),COL('#7e776a')];
     const faces=[['z',kz1,kx0,kx1,1],['z',kz0,kx0,kx1,-1],['x',kx0,kz0,kz1,-1],['x',kx1,kz0,kz1,1]];
     for(const[ax,c,a0,a1,sg] of faces){const top=7;for(let k=0;k<34;k++){const t=a0+.3+sr()*(a1-a0-1.3),y=.6+sr()*(top-1),w=.6+sr()*.5,col=pal[Math.floor(sr()*pal.length)],o0=c+sg*.0,o1=c+sg*.05;
       if(ax==='z')hazeCastle.box(t,y,Math.min(o0,o1),t+w,y+.32,Math.max(o0,o1),col);else hazeCastle.box(Math.min(o0,o1),y,t,Math.max(o0,o1),y+.32,t+w,col)}
      if(ax==='z')hazeCastle.box(a0,.2,Math.min(c,c+sg*.03),a1,.2+.7+sr()*.3,Math.max(c,c+sg*.03),moss);else hazeCastle.box(Math.min(c,c+sg*.03),.2,a0,Math.max(c,c+sg*.03),.2+.7+sr()*.3,a1,moss)}}
    for(const y of [4.2,7.4])for(const sx of [-4.2,0,4.2]){if(y>6&&sx>0&&R()<.6)continue;hazeCastle.box(cx0+sx-.25,y,kz1,cx0+sx+.25,y+1.3,kz1+.06,dk);hazeCastle.box(cx0+sx-.25,y,kz0-.06,cx0+sx+.25,y+1.3,kz0,dk)}
    hazeCastle.box(cx0-1.3,.2,kz1,cx0+1.3,3.1,kz1+.08,dk);hazeCastle.box(cx0-1.6,3.1,kz1,cx0+1.6,3.5,kz1+.3,st3);
    const tw=[[kx0-1,kz0-1,13],[kx1+1,kz0-1,11.5],[kx0-1,kz1+1,12.4],[kx1+1,kz1+1,6.5]];for(const[x,z,H] of tw){hazeCastle.geo(GEO.cyl16,mtx(x,.2+H/2,z,2.4,H,2.4),st2);
     for(let k=0;k<8;k++){if(H<8&&k%3===0)continue;const a=k/8*6.2832;hazeCastle.box(x+Math.cos(a)*2.1-.35,.2+H,z+Math.sin(a)*2.1-.35,x+Math.cos(a)*2.1+.35,.2+H+.9,z+Math.sin(a)*2.1+.35,st3)}addCol(x-2.3,z-2.3,x+2.3,z+2.3,'bld')}
    // muralha externa: trechos com falhas e alturas desiguais
    const wl=(x0,z0,x1,z1)=>{const H=rr(1.4,4.2);hazeCastle.box(x0,.2,z0,x1,H,z1,R()<.5?st1:st2);addCol(x0,z0,x1,z1,'bld')};
    for(const[a,b,horiz,c] of [[cx0-16,cx0+16,true,cz0-14],[cx0-16,cx0-4,true,cz0+15],[cx0+4,cx0+16,true,cz0+15],[cz0-14,cz0+15,false,cx0-16],[cz0-14,cz0+15,false,cx0+16]]){
     for(let t=a;t<b-.5;){const L=Math.min(rr(3,7),b-t);if(R()<.72){if(horiz)wl(t,c-.5,t+L,c+.5);else wl(c-.5,t,c+.5,t+L)}else{const p=horiz?[t+L/2,c]:[c,t+L/2];rock(p[0]+rr(-1,1),p[1]+rr(-1,1),rr(.8,1.4),'#7a7468')}t+=L}}
    side.flat(cx0-1.8,kz1+.3,cx0+1.8,bz1,.208,dirtC);
    setSafeDoor(cx0,kz1+.35,'s')}
   const nT=Math.round(BW*BH/(info.safe?300:140));for(let k=0,t=0;k<nT&&t<nT*5;t++){const x=rr(bx0+3,bx1-3),z=rr(bz0+3,bz1-3);if(!free(x,z,2))continue;worldDeadTree(plants,x,z,rr(1.1,1.8),bark,true);addCol(x-.35,z-.35,x+.35,z+.35,'rock');k++}
   for(let k=0,kn=3+Math.floor(R()*3);k<kn;k++){const x=rr(bx0+5,bx1-5),z=rr(bz0+5,bz1-5);if(!free(x,z,3))continue;boulder(x,z,rr(1.6,3.4));if(R()<.5)boulder(x+rr(-3,3),z+rr(-3,3),rr(.8,1.5))}
   for(let k=0;k<6;k++){const x=rr(bx0+3,bx1-3),z=rr(bz0+3,bz1-3);if(free(x,z,1))rock(x,z,rr(.6,1.1),'#6e6a5a')}
   hzLift();return}
  if(info.kind==='rural'&&info.forest){
   // v264: floresta de lote inteiro, usando a MESMA arvore batched da cidade.
   // Clareira central e acesso oeste para encontrar o item e enfrentar a criatura.
   // Solo separado sem receber sombras dinâmicas. Árvore original v264
   // em batch próprio, sem castShadow; só uma mancha disforme no chão.
   sideSlab(forestFloor,bx0,0,bz0,bx1,.2,bz1,cGrass);
   lawn(bx0+1,bz0+1,bx1-1,bz1-1,.204,.7,true,forestFloor,forestPlants);
   forestShadowPatch(bx0+1,bz0+1,bx1-1,bz1-1,info.seed);
   const cx=(bx0+bx1)/2,cz=(bz0+bz1)/2,areaT=(bx1-bx0)*(bz1-bz0);
   const nT=Math.min(95,Math.round(areaT/36)),placed=[];/* r36: igual em todo aparelho (mexer aqui muda a cidade da seed) */
   for(let k=0,t=0;k<nT&&t<nT*11;t++){
    const x=rr(bx0+3.5,bx1-3.5),z=rr(bz0+3.5,bz1-3.5);
    if(Math.hypot(x-cx,z-cz)<8.7||x<cx&&Math.abs(z-cz)<2.7||placed.some(q=>(q[0]-x)**2+(q[1]-z)**2<6.25))continue;
    tree(x,z,.22,rr(.85,1.55),false,false,true);placed.push([x,z]);k++;
   }
   for(let k=0;k<5;k++){const a=R()*6.283,d=9+R()*9,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    if(x>bx0+3&&x<bx1-3&&z>bz0+3&&z<bz1-3)rock(x,z,rr(.5,1.0))}
   if(city.forest?.ri===ri&&ch&&!city.picked.has(city.forest.lootId)&&!pickups.some(p=>p.id===city.forest.lootId)){
    const ammo=city.forest.loot==='jammer'?1:city.forest.loot==='grenade'?3:city.forest.loot==='magnum'?18:50;
    makePickup(city.forest.lootId,cx,cz,ammo,ch,city.forest.loot);
   }
   return;
  }
  if(info.kind==='rural'){sideSlab(side,bx0,0,bz0,bx1,0.2,bz1,cGrass);lawn(bx0+1,bz0+1,bx1-1,bz1-1,.204,.5);
   const edges=[[bx0+1,bz0+1,bx1-1,bz0+1,0,-1],[bx0+1,bz1-1,bx1-1,bz1-1,0,1],
                [bx0+1,bz0+1,bx0+1,bz1-1,-1,0],[bx1-1,bz0+1,bx1-1,bz1-1,1,0]];
   const fenced=edges.map(()=>R()>=.3);
   let hl=null;if(R()<.5){const faces=[['s',bz1+8.5,(bx0+bx1)/2,true],['n',bz0-8.5,(bx0+bx1)/2,true],['e',(bz0+bz1)/2,bx1+8.5,false],['w',(bz0+bz1)/2,bx0-8.5,false]].filter(f=>f[3]?roadAt(f[2],f[1]):roadAt(f[2],f[1]));
    if(faces.length){const f=faces[Math.floor(R()*faces.length)][0],w=rr(15,19),d=rr(15,18),u=rr(.15,.55);
     hl=f==='s'?[bx0+2+(BW-w-4)*u,bz1-2-d,bx0+2+(BW-w-4)*u+w,bz1-2]:f==='n'?[bx0+2+(BW-w-4)*u,bz0+2,bx0+2+(BW-w-4)*u+w,bz0+2+d]:f==='e'?[bx1-2-d,bz0+2+(BH-w-4)*u,bx1-2,bz0+2+(BH-w-4)*u+w]:[bx0+2,bz0+2+(BH-w-4)*u,bx0+2+d,bz0+2+(BH-w-4)*u+w];
     house(hl[0],hl[1],hl[2],hl[3],f);
     for(let k=0,kn=2+Math.floor(R()*3);k<kn;k++){const hx=rr(bx0+4,bx1-4),hz=rr(bz0+4,bz1-4);if(hx>hl[0]-2&&hx<hl[2]+2&&hz>hl[1]-2&&hz<hl[3]+2)continue;det.geo(GEO.cyl,mtx(hx,.85,hz,.75,1.3,.75,Math.PI/2,rr(0,3),0),COL(night?'#7a6a4a':'#d8b860'));addCol(hx-.8,hz-.8,hx+.8,hz+.8,'rock')}}}
   const nT=Math.round(BW*BH/95),cl=[rr(bx0+8,bx1-8),rr(bz0+8,bz1-8)];
   for(let k=0;k<nT;k++){let x,z;if(k%2){x=cl[0]+rr(-14,14);z=cl[1]+rr(-14,14)}else{x=rr(bx0+3,bx1-3);z=rr(bz0+3,bz1-3)}x=clamp(x,bx0+2.5,bx1-2.5);z=clamp(z,bz0+2.5,bz1-2.5);
    if(hl&&x>hl[0]-2&&x<hl[2]+2&&z>hl[1]-2&&z<hl[3]+2)continue;tree(x,z,.2,rr(.9,1.5))}
   for(let k=0,kn=1+Math.floor(R()*3);k<kn;k++){const x=rr(bx0+5,bx1-5),z=rr(bz0+5,bz1-5);if(hl&&x>hl[0]-3&&x<hl[2]+3&&z>hl[1]-3&&z<hl[3]+3)continue;const sz=rr(1.2,2.4);rock(x,z+0,sz);addCol(x-sz*.8,z-sz*.8,x+sz*.8,z+sz*.8,'rock')}
   const wood=COL(night?'#3a2e3a':'#7a5a3a');
   let gateSide=-1,gateAt=0,best=-1;
   for(let i=0;i<edges.length;i++){
    const [x,z,endX,endZ,nx,nz]=edges[i],len=Math.hypot(endX-x,endZ-z);
    const ux=(endX-x)/len,uz=(endZ-z)/len;
    if(len<8)continue;
    for(const f of [.5,.3,.7,.2,.8]){
     const at=clamp(len*f,4,len-4),gx=x+ux*at,gz=z+uz*at;
     const road=roadAt(gx+nx*9.5,gz+nz*9.5);
     const clear=!query(gx-nx*2,gz-nz*2,7).some(c=>!c.dead&&
      c.x0<gx+(ux?3.25:5)&&c.x1>gx-(ux?3.25:5)&&
      c.z0<gz+(uz?3.25:5)&&c.z1>gz-(uz?3.25:5));
     const score=(road?4:0)+(clear?8:0)+(fenced[i]?1:0);
     if(score>best){best=score;gateSide=i;gateAt=at}
    }
   }
   for(let i=0;i<edges.length;i++){
    if(!fenced[i])continue;
    const [x,z,endX,endZ]=edges[i],len=Math.hypot(endX-x,endZ-z),ux=(endX-x)/len,uz=(endZ-z)/len;
    const spans=i===gateSide?[[0,gateAt-3.1],[gateAt+3.1,len]]:[[0,len]];
    for(const [start,end] of spans){
     const count=Math.ceil((end-start)/3.2);
     for(let k=0;k<=count;k++){
      const t=start+(end-start)*k/count;
      // Each corner post belongs to the horizontal side when both sides are fenced.
      if(i>=2&&((t===0&&fenced[0])||(t===len&&fenced[1])))continue;
      const px=x+ux*t,pz=z+uz*t;det.box(px-.08,.2,pz-.08,px+.08,1.25,pz+.08,wood);
     }
     const ax=x+ux*start,az=z+uz*start,bx=x+ux*end,bz=z+uz*end;
     for(const y of [.6,1.05])det.box(ax-(uz?.04:0),y,az-(ux?.04:0),bx+(uz?.04:0),y+.09,bz+(ux?.04:0),wood);
     addCol(ax-.08,az-.08,bx+.08,bz+.08,'rock').low=1.25;
    }
   }
   return}
  const blockSideCol=info.kind!=='industrial'?cSide.clone().multiplyScalar(rr(.95,1.03)):null;
  if(info.kind==='industrial')rr(.95,1.03);
  const deferParkingSlab=info.kind==='lm'||info.kind==='lot';
  /* v78 NEON ROAD: no quarteirão da oficina a laje vira duas (a rua nova fica no nível 0) e nada de poste/árvore na boca da rua */
  const NRb=info.neon&&city.neonRoad&&city.neonRoad.ri===ri?city.neonRoad:null,nrM=(x,z,m)=>{if(!NRb)return false;const a=NRb.cr;return x>a[0]-m&&x<a[2]+m&&z>a[1]-m&&z<a[3]+m},lampB=(x,z,dx,dz)=>{if(!nrM(x,z,1.6))lamp(x,z,dx,dz)},treeB=(x,z,...a)=>{if(!nrM(x,z,2))tree(x,z,...a)};
  const nrFace=(x0,z0,x1,z1)=>{if(!NRb)return null;const h=NRb.tw/2,ua=NRb.ax==='x'?x0:z0,ub=NRb.ax==='x'?x1:z1;if(ub>NRb.ta-2&&ua<NRb.tb+2)return null;
   if(NRb.ax==='x'){if(Math.abs(z1-(NRb.c-h))<1.2)return 's';if(Math.abs(z0-(NRb.c+h))<1.2)return 'n'}else{if(Math.abs(x1-(NRb.c-h))<1.2)return 'e';if(Math.abs(x0-(NRb.c+h))<1.2)return 'w'}return null};
  if(blockSideCol&&!deferParkingSlab){if(NRb){const a=NRb.ar,S2=(x0,z0,x1,z1,rs)=>side.rslab(x0,z0,x1,z1,0,.2,blockSideCol,rs.map((r,k)=>r===null?slabR(...[[x1,z1],[x1,z0],[x0,z0],[x0,z1]][k]):r)); /* canto da boca da rua com raio CR */
   const r0=NRb.ext&&NRb.ext[0]?0:CR,r1=NRb.ext&&NRb.ext[1]?0:CR; /* com calçada da rua estreita a boca continua: canto do quarteirão reto */
   if(NRb.ax==='x'){S2(bx0,bz0,bx1,a[1],[r1,null,null,r0]);S2(bx0,a[3],bx1,bz1,[null,r1,r0,null])}else{S2(bx0,bz0,a[0],bz1,[r1,r0,null,null]);S2(a[2],bz0,bx1,bz1,[null,null,r0,r1])}}else sideSlab(side,bx0,0,bz0,bx1,.2,bz1,blockSideCol)}
  for(let t=8;t<BW-4;t+=22){lampB(bx0+t,bz0+.8,0,-1);lampB(bx1-t,bz1-.8,0,1)}for(let t=8;t<BH-4;t+=22){lampB(bx0+.8,bz1-t,-1,0);lampB(bx1-.8,bz0+t,1,0)}
  if(!night||R()<.5){for(let t=14;t<BW-8;t+=22){if(R()<.45&&roadAt(bx0+t,bz0-7.4))treeB(bx0+t+rr(-1,1),bz0+2.2,0.2,rr(.8,1));if(R()<.45&&roadAt(bx1-t,bz1+7.4))treeB(bx1-t,bz1-2.2,0.2,rr(.8,1))}
   for(let t=14;t<BH-8;t+=22){if(R()<.3&&roadAt(bx0-7.4,bz1-t))treeB(bx0+2.2,bz1-t,0.2,rr(.8,1));if(R()<.3&&roadAt(bx1+7.4,bz0+t))treeB(bx1-2.2,bz0+t,0.2,rr(.8,1))}}
  {const hr=mulberry32((info.seed^0x6a09e667)>>>0);if(hr()<.07){const id='h'+ri;if(!city.picked.has(id)){const side=Math.floor(hr()*4),t=.2+hr()*.6;const q=side===0?[bx0+BW*t,bz0+2.2]:side===1?[bx0+BW*t,bz1-2.2]:side===2?[bx0+2.2,bz0+BH*t]:[bx1-2.2,bz0+BH*t];makePickup(id,q[0],q[1],0,ch,'hp')}}}
  const ix0=bx0+SW,iz0=bz0+SW,ix1=bx1-SW,iz1=bz1-SW;
  if(info.kind==='industrial'&&!info.isle){industrial(bx0,bz0,bx1,bz1);return}
  if(info.kind==='lm'){
   if(info.lm!=='gas')MB_DROP={x0:ix0-.05,z0:iz0-.05,x1:ix1+.05,z1:iz1+.05,off:.26};try{landmark(info.lm,ix0,iz0,ix1,iz1)}finally{MB_DROP=null}
   // Interior inteiro no nivel da rua; manter jardins e estruturas locais.
   parkingGroundAdd(ix0,iz0,ix1,iz1);
   const hasAccess=city.parkingLots.some(l=>l.ri===ri&&l.access);
   city.parkingLots.push({ri,tag:'special-yard:'+ri,x0:ix0,z0:iz0,x1:ix1,z1:iz1,slots:[],access:hasAccess?null:parkingAccess(ix0,iz0,ix1,iz1)});
   pendingParkingSidewalk.push({bx0,bz0,bx1,bz1,ri,col:blockSideCol});return
  }
  if(info.kind==='park'){
   /* v3 r52: gramado e caminhos rentes ao chão de colisão (0,2): grama a 0,24 como os outros gramados (antes 0,28 e caminhos 0,3 → rastros de pneu (0,252) ficavam por baixo e carro/gente afundavam); base do centro com colisor */
   side.box(ix0,0.2,iz0,ix1,0.24,iz1,cGrass,{});lawn(ix0+.3,iz0+.3,ix1-.3,iz1-.3,.24,.85);
   const mx=(ix0+ix1)/2,mz=(iz0+iz1)/2;side.box(mx-1.5,0.2,iz0,mx+1.5,0.248,iz1,cSide,{});side.box(ix0,0.2,mz-1.5,ix1,0.248,mz+1.5,cSide,{});
   if(night){neon.box(mx-3,0.248,mz-3,mx+3,0.31,mz+3,COL('#27e3ff'));glow.flat(mx-10,mz-10,mx+10,mz+10,0.4,COL('#27a3ff').multiplyScalar(.5))}
   else if(!info.plaza){det.geo(GEO.cyl,mtx(mx,0.55,mz,3,.64,3),COL('#9a958c'));addCol(mx-2.5,mz-2.5,mx+2.5,mz+2.5,'rock')}
   const PZ=info.plaza?Math.min(13,(ix1-ix0)*.28,(iz1-iz0)*.28):0;
   if(PZ){side.box(mx-PZ,0.2,mz-PZ,mx+PZ,0.31,mz+PZ,cSide.clone().multiplyScalar(1.06),{});const stc=COL(night?'#5a5070':'#cfc8b8'),stc2=stc.clone().multiplyScalar(.9);
    det.box(mx-3.4,.31,mz-3.4,mx+3.4,.8,mz+3.4,stc2);det.box(mx-2.6,.8,mz-2.6,mx+2.6,1.3,mz+2.6,stc);det.box(mx-1.5,1.3,mz-1.5,mx+1.5,2.6,mz+1.5,stc2);
    const H=rr(13,19),b=1.05,t=.55,ref=[mx,H/2,mz],sh=stc.clone().multiplyScalar(1.04);const q=(h,r)=>[[mx-r,h,mz-r],[mx+r,h,mz-r],[mx+r,h,mz+r],[mx-r,h,mz+r]],A=q(2.6,b),B=q(2.6+H,t),ap=[mx,2.6+H+1.4,mz];
    for(let i=0;i<4;i++){const j=(i+1)%4;det.qa(A[i],A[j],B[j],B[i],sh,ref);det.qa(B[i],B[j],ap,ap,sh,[mx,2.6+H,mz])}
    if(night)neon.box(mx-3.45,.75,mz-3.45,mx+3.45,.82,mz+3.45,COL(pick(st.neon)));addCol(mx-3.4,mz-3.4,mx+3.4,mz+3.4,'rock');
    const bc=COL(night?'#3a3048':'#6a4a32'),bz=COL('#2a2a2c');for(const[dx,dz,rot] of [[0,-PZ+1.4,0],[0,PZ-1.4,0],[-PZ+1.4,0,1],[PZ-1.4,0,1]])for(const off of [-4.5,4.5]){const x=mx+dx+(rot?0:off),z=mz+dz+(rot?off:0);
     if(rot){det.box(x-.3,.6,z-1,x+.3,.7,z+1,bc);det.box(x+(dx<0?-.32:.24),.7,z-1,x+(dx<0?-.24:.32),1.15,z+1,bc);det.box(x-.25,.31,z-.9,x+.25,.6,z-.8,bz);det.box(x-.25,.31,z+.8,x+.25,.6,z+.9,bz)}
     else{det.box(x-1,.6,z-.3,x+1,.7,z+.3,bc);det.box(x-1,.7,z+(dz<0?-.32:.24),x+1,1.15,z+(dz<0?-.24:.32),bc);det.box(x-.9,.31,z-.25,x-.8,.6,z+.25,bz);det.box(x+.8,.31,z-.25,x+.9,.6,z+.25,bz)}}
    const brz=COL(night?'#3f8a8a':'#4f6a52');for(const[sx,sz] of [[-1,-1],[1,1]]){if(R()<.35)continue;const x=mx+sx*(PZ-3.2),z=mz+sz*(PZ-3.2);det.box(x-.8,.31,z-.8,x+.8,1.9,z+.8,stc2);
     det.box(x-.22,1.9,z-.14,x-.04,2.8,z+.14,brz);det.box(x+.04,1.9,z-.14,x+.22,2.8,z+.14,brz);det.box(x-.3,2.8,z-.2,x+.3,3.7,z+.2,brz);det.box(x-.46,2.95,z-.1,x-.3,3.6,z+.1,brz);det.box(x+.3,3.3,z-.1,x+.46,4.1,z+.1,brz);det.geo(GEO.ico,mtx(x,3.95,z,.22,.26,.22),brz);addCol(x-.8,z-.8,x+.8,z+.8,'rock')}}
   for(let k=0;k<26*BW*BH/3600;k++){const x=rr(ix0+2,ix1-2),z=rr(iz0+2,iz1-2);if(Math.abs(x-mx)<3||Math.abs(z-mz)<3)continue;if(PZ&&Math.abs(x-mx)<PZ+1.5&&Math.abs(z-mz)<PZ+1.5)continue;tree(x,z,0.24,rr(.9,1.4))}
  }else if(info.kind==='lot'&&info.casino&&city.casino&&city.casino.ri===ri){
   // v262: somente o SUNSET ROYALE ocupa este lote; toda a estrutura da
   // danceteria foi transferida para outro terreno da cidade.
   const K=city.casino,cx=K.cx,fz=K.fz,casH=9.4;
   /* v288: asphalt yard */
   const gold=COL(night?'#e8b830':'#c9a03a'),red=COL(night?'#ff2a6a':'#a8283a');
   const casX0=cx-14.5,casX1=cx+14.5,casZ0=Math.max(iz0+7,fz-26),casZ1=fz;
   // v77: cassino na mesma linguagem da danceteria e da cidade — reboco claro, laje cinza com cornija dourada fina;
   // a cor fica no letreiro, na marquise e em 4 frisos de neon (antes 7), e as laterais/fundos ganham janelas, grades e canteiros.
   const casWall=COL(night?'#d9c3cf':'#e2d3bd');
   det.box(casX0,0,casZ0,casX1,casH,casZ1,casWall);addCol(casX0,casZ0,casX1,casZ1,'bld');
   det.box(casX0-.3,casH,casZ0-.3,casX1+.3,casH+.3,casZ1+.3,COL(night?'#4a3e58':'#77727a'));det.box(casX0-.36,casH-.12,casZ1+.18,casX1+.36,casH+.32,casZ1+.36,gold);
   det.box(casX0,0,casZ1,casX1,1.1,casZ1+.08,red.clone().multiplyScalar(.75));
   det.box(casX0,casH-.62,casZ1+.2,casX1,casH-.46,casZ1+.32,red);
   for(const x of [casX0+.9,K.door.x-5.4,K.door.x+5.4,casX1-.9])neon.box(x-.11,1.1,casZ1,x+.11,casH-.62,casZ1+.12,x<cx?red:gold);
   dressBox(casX0,casZ0,casX1,casZ1,casH,0,1,dressPal(casWall),{winStyle:[44,25.6],win:[.125,.25]}); // janelas largas e baixas
   det.box(K.door.x-3.4,0,casZ1,K.door.x+3.4,4.2,casZ1+.12,COL('#120a18'));
   det.box(K.door.x-4.2,4.2,casZ1,K.door.x+4.2,4.62,casZ1+3.8,gold);
   for(const sx of[-3.95,3.95])det.box(K.door.x+sx-.18,0,casZ1+3.42,K.door.x+sx+.18,4.2,casZ1+3.8,gold);
   neon.box(K.door.x-4.25,4.62,casZ1+3.64,K.door.x+4.25,4.78,casZ1+3.82,red);
   signPlane(ch.group,mallSignMat('CASSINO SUNSET ROYALE','#120a18','#ffd21a',512,80),K.door.x,casH+2.0,casZ1+.55,13.5,2.45,0);
   for(let x=ix0+2.2;x<ix1-2.2;x+=3){if(Math.abs(x-cx)<5.5)continue;marks.flat(x,casZ1+5,x+.12,casZ1+8.6,.042,cMark)}
   for(const px of[casX0-1.8,casX1+1.8])tree(px,casZ1+1.1,0,1.0);
   const pot=COL('#7a5538'),leaf=COL('#3c8c4a');
   for(const px of[casX0+2.6,casX1-2.6]){const pz=casZ1+.9;det.box(px-.5,0,pz-.4,px+.5,.6,pz+.4,pot);det.geo(GEO.ico,mtx(px,.95,pz,.55,.5,.45),leaf)}
   /* v78 · CASSINO: lâmpadas na marquise e no letreiro, manobrista com púlpito e carro VIP, telhado e fundos */
   {const bulb=COL(mallPal().d),B=night?neon:neonDN,metal=COL(night?'#5a5e6a':'#a8acb4'),dmetal=COL(night?'#2e3038':'#5a5e66'),grav=COL(night?'#3a3446':'#8e8a80'),dx0=K.door.x;
    const dot=(x,y,z)=>B.box(x-.07,y-.07,z-.07,x+.07,y+.07,z+.07,bulb);
    for(let x=dx0-4.1;x<=dx0+4.1;x+=.45)dot(x,4.5,casZ1+3.86);for(let z=casZ1+.3;z<=casZ1+3.7;z+=.45){dot(dx0-4.26,4.5,z);dot(dx0+4.26,4.5,z)}
    for(let x=dx0-6.8;x<=dx0+6.8;x+=.5){dot(x,casH+.72,casZ1+.62);dot(x,casH+3.28,casZ1+.62)}for(let y=casH+.72;y<=casH+3.28;y+=.5){dot(dx0-6.85,y,casZ1+.62);dot(dx0+6.85,y,casZ1+.62)}
    // manobrista: púlpito com caixa de chaves e cone; carro VIP na vaga da frente
    {const x=dx0+5.4,z=casZ1+2.4;det.box(x-.35,0,z-.3,x+.35,1.15,z+.3,COL('#1a1218'));det.box(x-.42,1.15,z-.37,x+.42,1.22,z+.37,gold);det.box(x-.3,.6,z+.3,x+.3,1,z+.33,red);addCol(x-.4,z-.35,x+.4,z+.35,'rock');det.geo(GEO.cone,mtx(x+1.2,.35,z+.4,.25,.7,.25),COL('#ff8a1a'))}
    {const id='cas-vip'+curRi;if(!city.taken.has(id)){const c=makeVehicle('super',cx-7.5,casZ1+6.8,-Math.PI/2,'#121216');c.hand=true;c.sleep=true;c.spotId=id;ch.cars.push(c)}}
    // telhado (sem sombra): cascalho, mureta, condensadoras, parabólica
    roofD.box(casX0,casH+.31,casZ0,casX1,casH+.36,casZ1,grav);for(const[x0,z0,x1,z1] of [[casX0,casZ0,casX1,casZ0+.25],[casX0,casZ0,casX0+.25,casZ1-1],[casX1-.25,casZ0,casX1,casZ1-1]])roofD.box(x0,casH+.3,z0,x1,casH+1,z1,COL(night?'#5a4e68':'#b8aea4'));
    for(let k=0;k<5;k++){const x=casX0+3+k*5.6,z=casZ0+3+(k%2)*4;roofD.box(x,casH+.3,z,x+1.5,casH+1.3,z+1.2,metal);roofD.geo(GEO.cyl,mtx(x+.75,casH+1.32,z+.6,.45,.04,.45),dmetal)}
    roofD.box(casX1-3.05,casH+.3,casZ0+2.95,casX1-2.95,casH+1.5,casZ0+3.05,dmetal);roofD.geo(GEO.sph,mtx(casX1-3,casH+1.8,casZ0+3,.8,.8,.24,0,.6,.5),COL('#e8e8ec'));
    // fundos: porta de serviço com luz, caçambas, engradados de bebida
    {const z=casZ0;det.box(cx-1.1,0,z-.06,cx+1.1,2.5,z,dmetal);det.box(cx-1.5,2.6,z-1.2,cx+1.5,2.7,z,metal);neon.box(cx-.15,2.75,z-.25,cx+.15,2.9,z-.02,COL('#ffe2a0'));
     for(let k=0;k<2;k++){const x=cx+2.5+k*2.2;det.box(x,0,z-1.6,x+1.9,1.4,z-.2,k?COL('#2e6a44'):COL('#4a5a6a'));addCol(x,z-1.6,x+1.9,z-.2,'rock')}
     for(let k=0;k<4;k++)det.box(cx-4.5+(k%2)*.95,(k>>1)*.42,z-1.1,cx-3.6+(k%2)*.95,(k>>1)*.42+.38,z-.5,COL(k%2?'#d8202a':'#f2c21a'))}}
  }else if(info.kind==='lot'&&info.club&&city.casino?.club&&city.casino.clubRi===ri){
   const rotBuilders=[det,neon,side,marks,lodNear,walls,roofD,neonDN],rotStarts=rotBuilders.map(m=>m.p.length),colStart=ch.cols.length,objStart=ch.group.children.length,carStart=ch.cars.length;
   // v262: MALIBU FLASH no seu PROPRIO quarteirao, sem sobreposicao ao cassino.
   const K=city.casino,C=K.club,cx=C.cx,clZ0=C.z0,clZ1=C.z1,clH=8.8,marqZ=clZ0-1.2;
   const clX0=cx-16.5,clX1=cx+16.5,cyan=COL(night?'#53efff':'#2cc9ff');
   const clubWall=COL(night?'#efe5dc':'#e8dccf'),clubTrim=COL(night?'#ff63d7':'#d948b7'),clubDark=COL(night?'#23172f':'#705a62');
   /* v288: asphalt yard */
   det.box(clX0,.24,clZ0,clX1,clH,clZ1,clubWall);addCol(clX0,clZ0,clX1,clZ1,'bld');
   det.box(clX0-.3,clH,clZ0-.3,clX1+.3,clH+.3,clZ1+.3,COL(night?'#4a3e58':'#77727a'));det.box(clX0-.36,clH-.12,clZ0-.36,clX1+.36,clH+.32,clZ0-.18,clubTrim);
   det.box(clX0,clH-.65,clZ0-.25,clX1,clH-.48,clZ0-.1,clubTrim);
   dressBox(clX0,clZ0,clX1,clZ1,clH,0,-1,dressPal(clubWall),{y0:.24,winStyle:[17,34],win:[0,.875]}); // janelas estreitas e altas // v77: laterais/fundos vestidos (antes caixa lisa)
   const mx=K.clubDoor.x,mr=4.6,my=4.4;
   const disc=new THREE.Mesh(new THREE.CylinderGeometry(mr,mr,.34,18),st.noWindows?new THREE.MeshLambertMaterial({color:clubTrim}):new THREE.MeshBasicMaterial({color:clubTrim}));disc.position.set(mx,my,marqZ+2.2);ch.group.add(disc);
   const disc2=new THREE.Mesh(new THREE.CylinderGeometry(mr-1.1,mr-1.1,.18,18),st.noWindows?new THREE.MeshLambertMaterial({color:clubDark}):new THREE.MeshBasicMaterial({color:clubDark}));disc2.position.set(mx,my+.18,marqZ+2.2);ch.group.add(disc2);
   det.box(mx-3.2,.24,marqZ+1.1,mx-2.45,my,marqZ+3.15,clubWall);
   det.box(mx+2.45,.24,marqZ+1.1,mx+3.2,my,marqZ+3.15,clubWall);
   addCol(mx-3.2,marqZ+1.1,mx-2.45,marqZ+3.15,'bld');addCol(mx+2.45,marqZ+1.1,mx+3.2,marqZ+3.15,'bld');
   det.box(mx-5.6,.24,marqZ+3.55,mx+5.6,4.2,marqZ+3.72,COL('#120a18'));
   det.box(mx-2.42,.24,clZ0-.08,mx+2.42,3.4,clZ0,COL('#120a18')); // v77: porta para fora da fachada (antes coplanar → z-fight); a marquise de dentro saiu
   signPlane(ch.group,mallSignMat('MALIBU FLASH','#1b1126','#67efff',512,80),mx,clH+1.9,clZ0-.48,11.5,2.25,Math.PI);
   addCol(mx-5.5,marqZ+1.0,mx+5.5,marqZ+5.2,'rock');
   // Carro e paisagismo ficam no patio frontal, fora do volume do predio.
   R(); // keep seeded sequence
   

   // v77 · fachada estilo Malibu (Vice City): pódio com degraus voltado para a esquina,
   // marquise escura com neon, muretas com canteiros, faixa rosa na base, contornos neon
   // e estátua no pódio. Tudo em coordenadas locais (frente = clZ0) e girado junto abaixo.
   {const pw=8.2,pz0=clZ0-4.4,terr=COL(night?'#6e6070':'#ddd2cb'),terr2=terr.clone().multiplyScalar(.92),pink=COL(night?'#b24f9c':'#e07cc4'),navy=COL(night?'#1c1a2c':'#2c2a40'),bush=COL(night?'#2c4a34':'#3f7a45'),stone=COL(night?'#b9a7b8':'#efd6e4');
    det.box(mx-pw-1.2,0,clZ0-6,mx+pw+1.2,.1,clZ0-5.2,terr2);
    det.box(mx-pw-.8,0,clZ0-5.2,mx+pw+.8,.2,pz0,terr);
    det.box(mx-pw,0,pz0,mx+pw,.3,clZ0,terr2);
    for(const sd of[-1,1]){const x=mx+sd*pw;
     det.box(Math.min(x,x-sd*.35),.3,pz0,Math.max(x,x-sd*.35),.95,clZ0,pink);addCol(Math.min(x,x-sd*.35),pz0,Math.max(x,x-sd*.35),clZ0,'rock');
     for(let z=pz0+.6;z<clZ0-.4;z+=1.2)det.geo(GEO.ico,mtx(x-sd*.7,1.15,z+.3,.55,.45,.55),bush);
     det.box(Math.min(x-sd*1.3,x-sd*.35),.3,pz0,Math.max(x-sd*1.3,x-sd*.35),.75,clZ0,pink.clone().multiplyScalar(.85));
     // pilares da marquise
     det.box(x-sd*1.6-.2,.3,pz0+.15,x-sd*1.6+.2,3.45,pz0+.55,stone);addCol(x-sd*1.6-.2,pz0+.15,x-sd*1.6+.2,pz0+.55,'rock')}
    det.box(mx-pw+.6,3.45,pz0-.2,mx+pw-.6,3.82,clZ0,navy);
    det.box(mx-pw+.6,3.82,pz0-.2,mx+pw-.6,3.9,pz0+.1,pink);
    if(night){neon.box(mx-pw+.6,3.4,pz0-.26,mx+pw-.6,3.48,pz0-.18,clubTrim);neon.box(mx-pw+.6,3.86,pz0-.26,mx+pw-.6,3.94,pz0-.18,cyan)}
    // estátua sobre pedestal, no canto do pódio
    {const sx=mx-pw+2.4,sz=pz0+1.2;det.box(sx-.6,.3,sz-.6,sx+.6,1.3,sz+.6,terr2);addCol(sx-.6,sz-.6,sx+.6,sz+.6,'rock');
     det.box(sx-.32,1.3,sz-.22,sx+.32,2.5,sz+.22,stone);det.box(sx-.26,2.5,sz-.2,sx+.26,3.15,sz+.2,stone);det.box(sx-.42,2.6,sz-.12,sx-.26,3.25,sz+.06,stone);det.box(sx+.26,2.75,sz-.1,sx+.4,3.45,sz+.06,stone);det.geo(GEO.ico,mtx(sx,3.38,sz,.2,.24,.2),stone)}
    // v78 · entrada VIP: tapete do vão da porta até a rua (sobe os 3 degraus), postes dourados com
    // cordão de veludo e o corredor da fila encostado na fachada, à direita da porta.
    // Seguranças e fila (NPCs) ficam em clubFxTick, a partir de K.clubVip.
    {const carpet=COL(night?'#9a1f52':'#c8285e'),gold=COL(night?'#e8c860':'#d9ae3c'),velvet=COL(night?'#8a1238':'#7a1030'),dark=COL('#1a1218'),cw=1.1;
     det.box(mx-cw,.3,pz0,mx+cw,.325,clZ0-.1,carpet);
     det.box(mx-cw,.2,clZ0-5.2,mx+cw,.225,pz0,carpet);
     det.box(mx-cw,.1,clZ0-6,mx+cw,.125,clZ0-5.2,carpet);
     det.box(mx-cw,.2,pz0-.03,mx+cw,.325,pz0,carpet);
     det.box(mx-cw,.1,clZ0-5.23,mx+cw,.225,clZ0-5.2,carpet);
     det.box(mx-cw,0,clZ0-6.03,mx+cw,.125,clZ0-6,carpet);
     for(const sd of[-1,1])det.box(Math.min(mx+sd*cw,mx+sd*(cw+.07)),.3,pz0,Math.max(mx+sd*cw,mx+sd*(cw+.07)),.335,clZ0-.1,gold);
     const post=(x,z)=>{det.geo(GEO.cyl,mtx(x,.33,z,.17,.06,.17),gold);det.geo(GEO.cyl,mtx(x,.8,z,.045,.95,.045),gold);det.geo(GEO.sph,mtx(x,1.32,z,.085,.085,.085),gold)};
     const rope=(x0,z0,x1,z1)=>{const n=5;for(let k=0;k<n;k++){const a=k/n,b=(k+1)/n,y=1.2-Math.sin((a+b)/2*Math.PI)*.13,xa=x0+(x1-x0)*a,xb=x0+(x1-x0)*b,za=z0+(z1-z0)*a,zb=z0+(z1-z0)*b;
      det.box(Math.min(xa,xb)-.03,y-.03,Math.min(za,zb)-.03,Math.max(xa,xb)+.03,y+.03,Math.max(za,zb)+.03,velvet)}};
     const rl=(pts)=>{pts.forEach(p=>post(...p));for(let k=1;k<pts.length;k++)rope(...pts[k-1],...pts[k])};
     const xl=mx-cw-.35,xr=mx+cw+.35,zq=clZ0-2.6;
     rl([[xl,clZ0-3.9],[xl,zq],[xl,clZ0-1.3]]);                                  // lado esquerdo do tapete
     rl([[xr,clZ0-3.9],[xr,zq],[mx+2.75,zq],[mx+4.05,zq],[mx+5.35,zq],[mx+6.4,zq]]); // direita + corredor da fila
     // púlpito do hostess (lista VIP) ao lado esquerdo da porta
     det.box(mx-2.15,.3,clZ0-1.75,mx-1.6,1.3,clZ0-1.3,dark);det.box(mx-2.22,1.3,clZ0-1.82,mx-1.53,1.36,clZ0-1.23,gold);
    }
    // faixa rosa na base e contornos de neon nas fachadas
    // v77: faixa rosa e contorno neon só na frente (antes davam a volta no prédio inteiro, em 2 alturas)
    det.box(clX0-.08,0,clZ0-.08,clX1+.08,1.1,clZ0+.02,pink);
    {const b=night?neon:neonDN;b.box(clX0-.14,clH-1.1,clZ0-.14,clX1+.14,clH-.98,clZ0-.04,clubTrim)}
    /* ===== v78 · DANCETERIA: laterais, fundos e telhado =====
       telhado em roofD (sem sombra); fundos e laterais em det. Tudo em coordenadas locais (frente = clZ0, fundos = clZ1). */
    {const grav=COL(night?'#3a3446':'#8e8a80'),metal=COL(night?'#5a5e6a':'#9aa0a8'),dmetal=COL(night?'#2e3038':'#5a5e66'),blk=COL('#141018'),y=clH+.3;
     // telhado: cascalho, mureta, caixas de som, holofotes, condensadoras
     roofD.box(clX0,y+.01,clZ0,clX1,y+.06,clZ1,grav);
     for(const[x0,z0,x1,z1] of [[clX0,clZ0,clX1,clZ0+.25],[clX0,clZ1-.25,clX1,clZ1],[clX0,clZ0,clX0+.25,clZ1],[clX1-.25,clZ0,clX1,clZ1]])roofD.box(x0,y,z0,x1,y+.7,z1,COL(night?'#5a4e68':'#b8aea4'));
     for(const sx of[-1,1]){const x=mx+sx*9,z=clZ0+2.2;roofD.box(x-.6,y,z-.6,x+.6,y+.25,z+.6,dmetal);roofD.geo(GEO.cyl,mtx(x,y+.9,z,.45,1.1,.45,-.5,0,sx*.25),metal);roofD.geo(GEO.cyl,mtx(x,y+1.45,z-.32,.5,.12,.5,-.5,0,sx*.25),COL('#f8f4e0'))}
     for(const x of[clX0+3,clX1-3]){roofD.box(x-.7,y,clZ1-3.4,x+.7,y+1.9,clZ1-2.4,blk);for(const h of[.5,1.3])roofD.geo(GEO.cyl,mtx(x,y+h,clZ1-3.42,.32,.04,.32,Math.PI/2,0,0),COL('#3a3a44'))}
     for(let k=0;k<4;k++){const x=clX0+6+k*5.5,z=clZ0+(k%2?6:9);roofD.box(x,y,z,x+1.5,y+1,z+1.2,metal);roofD.geo(GEO.cyl,mtx(x+.75,y+1.02,z+.6,.45,.04,.45),dmetal)}
     // fundos: porta de artistas com toldo e luz, caçambas, barris de chope, engradados, gerador
     const bz=clZ1;det.box(mx-1.2,.24,bz,mx+1.2,2.6,bz+.06,dmetal);det.box(mx-1.6,2.75,bz,mx+1.6,2.85,bz+1.3,clubTrim);
     neon.box(mx-.2,2.9,bz+.02,mx+.2,3.05,bz+.25,COL('#ffe2a0'));
     for(let k=0;k<2;k++){const x=mx+3.5+k*2.3,c=k?COL(night?'#2a4a3a':'#2e6a44'):COL(night?'#3a3a4a':'#4a5a6a');det.box(x,.24,bz+.3,x+1.9,1.5,bz+1.7,c);det.box(x-.05,1.5,bz+.25,x+1.95,1.6,bz+1.75,c.clone().multiplyScalar(.8));addCol(x,bz+.3,x+1.9,bz+1.7,'rock')}
     for(let k=0;k<5;k++){const x=mx-3.4-(k%3)*.62,z=bz+.5+Math.floor(k/3)*.62;det.geo(GEO.cyl,mtx(x,.24+.45,z,.27,.9,.27),COL('#b8bcc4'));det.geo(GEO.cyl,mtx(x,.24+.92,z,.12,.04,.12),COL('#2a2a30'))}
     for(let k=0;k<3;k++){const x=mx-6.5,z=bz+.4;det.box(x,.24+k*.42,z,x+.9,.24+(k+1)*.42-.04,z+.6,COL(k%2?'#d8202a':'#f2c21a'))}
     det.box(clX1-4.5,.24,bz+.3,clX1-1.5,1.6,bz+1.8,COL(night?'#4a5a3a':'#7a8a4a'));det.box(clX1-4.3,1.6,bz+.6,clX1-3.9,2.2,bz+1,dmetal);addCol(clX1-4.5,bz+.3,clX1-1.5,bz+1.8,'rock');
     // condensadoras penduradas nas laterais
     for(const sx of[-1,1])for(let k=0;k<3;k++){const x=sx<0?clX0:clX1,z=clZ0+6+k*7,yy=3+((k*7)%4);det.box(sx<0?x-.55:x,yy,z,sx<0?x:x+.55,yy+.6,z+.8,metal)}
     // faixa de neon única dando a volta no topo (laterais e fundos)
     /* v78: neon como acento (anos 80, caro): só um tubo no topo, saindo da frente e dobrando 1/3 de cada lateral.
        Sunset Shores = ciano; Synthwave = azul. Acende ao anoitecer (neonDN). */
     {const b=night?neon:neonDN,cy=COL(mallPal().a),o=.06,d=.16,yy=clH-1.12,zz=clZ0+(clZ1-clZ0)/3;
      b.box(clX0-o-d,yy,clZ0-.14,clX0-o,yy+.14,zz,cy);b.box(clX1+o,yy,clZ0-.14,clX1+o+d,yy+.14,zz,cy)}
     // mural pintado na lateral esquerda (pôr do sol, coqueiros e letreiro)
     {const c=cv(512,192),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,192);gr.addColorStop(0,'#2a1a5a');gr.addColorStop(.45,'#d8487a');gr.addColorStop(.75,'#ff9a3a');gr.addColorStop(1,'#ffd26a');g.fillStyle=gr;g.fillRect(0,0,512,192);
      g.fillStyle='#ffe2a0';g.beginPath();g.arc(256,150,58,Math.PI,0);g.fill();g.fillStyle='#ff6a8a';for(let k=0;k<5;k++)g.fillRect(190,108+k*9,132,3);
      g.fillStyle='#1a0e24';const palm=(x,h)=>{g.fillRect(x-3,192-h,6,h);for(let a=0;a<7;a++){g.save();g.translate(x,192-h);g.rotate(-1.4+a*.47);g.fillRect(0,-2,46,5);g.restore()}};palm(70,120);palm(120,90);palm(420,130);palm(470,95);
      g.fillStyle='#1a0e24';g.fillRect(0,178,512,14);g.font='700 44px Fredoka, Arial Black, sans-serif';g.textAlign='center';g.fillStyle='#67efff';g.fillText('MALIBU',256,60);g.strokeStyle='#ff63d7';g.lineWidth=2;g.strokeText('MALIBU',256,60);
      const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(18,6.4),dnSignMat(t,.35));m.position.set(clX0-.08,3.6,(clZ0+clZ1)/2);m.rotation.y=-Math.PI/2;ch.group.add(m)}
    }
   }
   // Rotate every exterior component around the same origin, including collision.
   const ox=cx,oz=(clZ0+clZ1)/2,sc=Math.min(.66,(ix1-ix0-20)/45,(iz1-iz0-20)/45),ang=Math.PI/4,ca=Math.cos(ang),sa=Math.sin(ang);let tx=(ix0+ix1)/2-3,tz=(iz0+iz1)/2+3;
   const tr=(x,z)=>[tx+sc*((x-ox)*ca-(z-oz)*sa),tz+sc*((x-ox)*sa+(z-oz)*ca)];
   // v77: encosta o pódio (borda do 1º degrau) exatamente na borda da rua diagonal do canto.
   {const D=24,c0=ix1-iz0-D,P=tr(K.clubDoor.x,clZ0-6),d=((P[0]-P[1])-c0)/Math.SQRT2;tx-=d*Math.SQRT1_2;tz+=d*Math.SQRT1_2}
   rotBuilders.forEach((m,k)=>{for(let j=rotStarts[k];j<m.p.length;j+=3){const q=tr(m.p[j],m.p[j+2]);m.p[j]=q[0];m.p[j+2]=q[1];if(m.p[j+1]===.24)m.p[j+1]=0;const x=m.n[j],z=m.n[j+2];m.n[j]=x*ca-z*sa;m.n[j+2]=x*sa+z*ca;}});
   for(const o of ch.group.children.slice(objStart)){const q=tr(o.position.x,o.position.z);o.position.x=q[0];o.position.z=q[1];o.rotation.y-=ang;o.scale.x*=sc;o.scale.z*=sc;}
   // Thin horizontal strips approximate the rotated footprint without a giant AABB.
   for(const c of ch.cols.slice(colStart)){c.dead=true;const poly=[[c.x0,c.z0],[c.x1,c.z0],[c.x1,c.z1],[c.x0,c.z1]].map(q=>tr(...q)),lo=Math.min(...poly.map(q=>q[1])),hi=Math.max(...poly.map(q=>q[1]));
    for(let z=lo;z<hi;z+=.6){const mid=Math.min(hi-.001,z+.3),xs=[];for(let j=0;j<4;j++){const A=poly[j],B=poly[(j+1)%4];if((A[1]<=mid&&B[1]>mid)||(B[1]<=mid&&A[1]>mid))xs.push(A[0]+(mid-A[1])*(B[0]-A[0])/(B[1]-A[1]));}if(xs.length===2)addCol(Math.min(...xs),z,Math.max(...xs),Math.min(hi,z+.6),c.kind);}
   }
   K.clubDoorLocal={x:K.clubDoor.x,z:K.clubDoor.z};K.clubPlaza={ox,oz,tx,tz,sc,ca,sa,mx,front:clZ0,x0:mx-8.2-1.2,x1:mx+8.2+1.2};
   const dp=tr(K.clubDoor.x,K.clubDoor.z);K.clubDoor={x:dp[0],z:dp[1]};K.clubNrm=[sa,-ca];
   // v78: pontos da entrada VIP (já girados) para clubFxTick: 2 seguranças + 5 lugares na fila.
   {const rd=(dx,dz)=>[dx*ca-dz*sa,dx*sa+dz*ca],S=(x,z,dx,dz,role)=>{const p=tr(x,z),d=rd(dx,dz);return{x:p[0],z:p[1],mx:d[0],mz:d[1],role}};
    K.clubVip=[S(mx+1.3,clZ0-2.1,1,.4,'guard'),S(mx-1.35,clZ0-.85,0,-1,'guard')];
    for(let k=0;k<5;k++)K.clubVip.push(S(mx+2.3+k,clZ0-1.35,-1,0,'q'+k))}
   // v78: holofotes no telhado (coordenadas de mundo, fora da rotação acima). Varrem o céu à noite,
   // espelhados, cruzando os feixes na frente da danceteria. Animados em clubFxTick.
   // v78b: em InstancedMesh (base, cabeça, lente e feixe = 4 draws para os 2 holofotes, antes 8). Pivôs são
   // Object3D fora da cena; clubFxTick recalcula as matrizes das instâncias. Mesmo material/forma de antes.
   {const g0=new THREE.Group();ch.group.add(g0);const beams=[];
    const metal=new THREE.MeshStandardMaterial({color:0x2a2a32,roughness:.55,metalness:.5}),lensM=new THREE.MeshBasicMaterial({color:0x8a8a90});
    const beamGeo=new THREE.CylinderGeometry(3.6,.32,70,18,1,true);beamGeo.translate(0,35,0);
    const beamMat=new THREE.MeshBasicMaterial({color:0xcfeaff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const IM=(geo,mat)=>{const m=new THREE.InstancedMesh(geo,mat,2);m.frustumCulled=false;g0.add(m);return m};
    const baseIM=IM(new THREE.CylinderGeometry(.5,.62,.55,12),metal),headIM=IM(new THREE.CylinderGeometry(.42,.34,1,14),metal),
     lensIM=IM(new THREE.CircleGeometry(.4,14),lensM),beamIM=IM(beamGeo,beamMat);beamIM.visible=false;beamIM.renderOrder=5;
    const yaw0=Math.atan2(ca,sa),o3=new THREE.Object3D();
    [[clX0+3.2,0],[clX1-3.2,Math.PI]].forEach(([lx,ph],i)=>{const p=tr(lx,clZ0+3),y=clH+.3;
     o3.position.set(p[0],y+.27,p[1]);o3.updateMatrix();baseIM.setMatrixAt(i,o3.matrix);
     const pv=new THREE.Object3D();pv.position.set(p[0],y+.85,p[1]);const tilt=new THREE.Object3D();pv.add(tilt);
     const head=new THREE.Object3D();head.position.y=.15;const lens=new THREE.Object3D();lens.rotation.x=-Math.PI/2;lens.position.y=.66;const beam=new THREE.Object3D();beam.position.y=.6;tilt.add(head,lens,beam);
     beams.push({i,pv,tilt,head,lens,beam,ph,yaw0})});
    const F=CLUBFX=Object.assign(CLUBFX||{q:[]},{root:g0,beams,beamIM,headIM,lensIM,beamMat,lens:lensM,jets:[],lights:null,water:null});
    clubBeamsPose(F)}
   // Corner island and two generous driveway mouths, connected by the asphalt yard.
   const ex=ix1,ez=iz0,leg=13,A=[ex,.2,ez],B=[ex-leg,.2,ez],T=[ex,.2,ez+leg];
   // v77: ilha da esquina vira canteiro gramado com palmeira (projeto: triângulo verde).
   const grassC=COL(night?'#26402c':'#4a8040'),Ag=[ex-.35,.26,ez+.35],Bg=[ex-leg+1.2,.26,ez+.35],Tg=[ex-.35,.26,ez+leg-1.2];
   side.quad(A,B,T,T,0,1,0,[0,0,1,1],cSide);
   side.quad([ex-leg,0,ez],[ex,0,ez+leg],T,B,-.707,0,.707,[0,0,1,1],cSide);
   side.quad(Ag,Bg,Tg,Tg,0,1,0,[0,0,1,1],grassC);
   tree(ex-3.6,ez+3.6,.26,1.2,true);
   // v78: fonte iluminada na ilha. A palmeira acima fica no centro, numa ilhota de azulejo (mesma chamada
   // de tree → sequência R intacta); colisor da fonte só depois dela. Palmeiras extras com R isolado.
   {const fx=ex-3.6,fz=ez+3.6,y0=.26,rad=2.75,
     tile=COL(night?'#7d6a86':'#f2d7e3'),cap=COL(night?'#a993b0':'#fbeef3'),deep=COL(night?'#123a52':'#1f6f92'),soil=COL('#4a3626');
    det.geo(GEO.cyl16,mtx(fx,y0+.23,fz,rad,.46,rad),tile);
    det.geo(GEO.cyl16,mtx(fx,y0+.48,fz,rad+.1,.08,rad+.1),cap);
    det.geo(GEO.cyl16,mtx(fx,y0+.525,fz,rad-.22,.02,rad-.22),deep);
    det.geo(GEO.cyl16,mtx(fx,y0+.5,fz,.95,1,.95),tile);
    det.geo(GEO.cyl16,mtx(fx,y0+1.03,fz,1.05,.08,1.05),cap);
    det.geo(GEO.cyl16,mtx(fx,y0+1.075,fz,.86,.02,.86),soil);
    const F=CLUBFX||(CLUBFX={q:[]}),root=F.root||ch.group;
    const water=new THREE.MeshStandardMaterial({color:0x3bc4d6,transparent:true,opacity:.8,roughness:.12,metalness:.1,emissive:0x000000,depthWrite:false});
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.0,rad-.22,32),water);ring.rotation.x=-Math.PI/2;ring.position.set(fx,y0+.555,fz);root.add(ring);
    // v78b: 8 jatos e 8 luzes submersas em 2 InstancedMesh (antes 16 malhas). Jatos: mesma cor/opacidade, então a
    // ordem de desenho entre eles não muda a mistura; luzes: cor por instância (ciano/rosa alternados).
    const jetGeo=new THREE.CylinderGeometry(.03,.09,1,8,1,true);jetGeo.translate(0,.5,0);
    const jetM=new THREE.MeshBasicMaterial({color:0xe8fbff,transparent:true,opacity:.55,depthWrite:false});
    const jetIM=new THREE.InstancedMesh(jetGeo,jetM,8),litIM=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),8);
    jetIM.frustumCulled=litIM.frustumCulled=false;litIM.visible=false;root.add(jetIM,litIM);
    const lc=[new THREE.Color(0x5ff2ff),new THREE.Color(0xff5fd2)],o3=new THREE.Object3D(),jets=[];
    for(let k=0;k<8;k++){const a=k/8*Math.PI*2,jx=fx+Math.cos(a)*(rad-.55),jz=fz+Math.sin(a)*(rad-.55);
     const g=new THREE.Object3D();g.position.set(jx,y0+.55,jz);g.rotation.order='YXZ';g.rotation.y=Math.atan2(fx-jx,fz-jz);g.rotation.x=.5;
     const m=new THREE.Object3D();m.scale.set(1,1.3,1);g.add(m);g.updateMatrixWorld(true);jetIM.setMatrixAt(k,m.matrixWorld);jets.push({g,m,k,ph:k*.8});
     const b=Math.PI*2*(k+.5)/8;o3.position.set(fx+Math.cos(b)*(rad-.45),y0+.5,fz+Math.sin(b)*(rad-.45));o3.updateMatrix();litIM.setMatrixAt(k,o3.matrix);litIM.setColorAt(k,lc[k%2])}
    F.water=water;F.jets=jets;F.jetIM=jetIM;F.lights=litIM;
    {const R0=R;R=mulberry32(((ex*73856093)^(ez*19349663)^0x5f1a)>>>0);try{tree(ex-10.2,ez+1.5,.26,1,true);tree(ex-1.5,ez+10.2,.26,1,true)}finally{R=R0}}
    const c=addCol(fx-rad*.86,fz-rad*.86,fx+rad*.86,fz+rad*.86,'rock');c.low=.6}
   // palmeiras ladeando o pódio da entrada (posição já girada)
   for(const sd of[-1,1]){const q=tr(K.clubDoorLocal.x+sd*10.4,clZ0-3.2);tree(q[0],q[1],0,1.05,true)}
   K.clubIsland={x:ex,z:ez,leg,road:24};
   // v77: resto do pátio vira estacionamento em volta do prédio (fileiras de 7,5 m nas quatro bordas),
   // sem novos recortes de calçada: o acesso é a rua diagonal. Pula trechos com colisores e a faixa da rua.
   {const c0=ix1-iz0-24,segs=[];const L=14,dp=7.5;
    for(let z=iz0+.5;z+L<=iz1-.5;z+=L+.4)segs.push([ix0+.5,z,ix0+.5+dp,z+L]);
    for(let x=ix0+dp+1;x+L<=ix1-dp-1;x+=L+.4)segs.push([x,iz1-.5-dp,x+L,iz1-.5]);
    for(let x=ix0+dp+1;x+L<=ix1-25;x+=L+.4)segs.push([x,iz0+.5,x+L,iz0+.5+dp]);
    for(let z=iz0+25;z+L<=iz1-dp-1;z+=L+.4)segs.push([ix1-.5-dp,z,ix1-.5,z+L]);
    let n=0;curRi=ri;for(const[a,b,c,d] of segs){if(c-d>c0-2||(c-b)>c0-2)continue;
     if(query((a+c)/2,(b+d)/2,12).some(o=>!o.dead&&o.x1>a-.8&&o.x0<c+.8&&o.z1>b-.8&&o.z0<d+.8))continue;
     parking(a,b,c,d,'club-park:'+ri+':'+(n++),true)}}
   const cuts=[[ix1-24,bz0-(RW/2-3.9)-.1,ix1-13,iz0+1],[ix1-1,iz0+13,bx1+(RW/2-3.9)+.1,iz0+24]];
   for(const cut of cuts){parkingGroundAdd(...cut);city.parkingLots.push({ri,tag:'club-drive',x0:cut[0],z0:cut[1],x1:cut[2],z1:cut[3],slots:[],access:{cut,x:(cut[0]+cut[2])/2,z:(cut[1]+cut[3])/2,a:0}});}
   K.clubDrive={entry:[ix1-18.5,bz0-(RW/2-3.9)-1],stop:[ix1-10,iz0+10],exit:[bx1+(RW/2-3.9)+1,iz0+18.5],next:0};
  }else if(info.kind==='lot'&&info.airport&&city.air){const A=city.air,ax=A.ax,L=A.L,Wd=A.Wd;
   // coordenadas do aeroporto: s ao longo do eixo comprido, l na largura
   const pt=(s0,l0)=>ax?[A.cx+s0,A.cz+l0]:[A.cx+l0,A.cz+s0];const rb=(mb,s0,s1,l0,l1,y0,y1,col,coll)=>{const a=pt(s0,l0),b=pt(s1,l1);const X0=Math.min(a[0],b[0]),X1=Math.max(a[0],b[0]),Z0=Math.min(a[1],b[1]),Z1=Math.max(a[1],b[1]);if(y1-y0<.06)mb.flat(X0,Z0,X1,Z1,y1,col);else mb.box(X0,y0,Z0,X1,y1,Z1,col);if(coll)addCol(X0,Z0,X1,Z1,'bld')};
   const grass=COL(night?'#2a3a30':'#5f8a4a'),asph=COL(night?'#1d1f24':'#3c3d42'),ap=COL(night?'#2a2c34':'#8a8c92'),wh=COL('#f4f4f0'),yl=COL('#f2c21a');
   side.box(ix0,0.2,iz0,ix1,0.23,iz1,grass,{});
   if(A.compact){
    // Aeródromo Mobile: pista, taxiway, terminal, torre, hangar e heliponto em 52x52m.
    rb(marks,-L/2+3,L/2-3,A.rl-5,A.rl+5,0,.245,asph);
    for(let t=-L/2+11;t<L/2-8;t+=8)rb(marks,t,t+4,A.rl-.16,A.rl+.16,0,.252,wh);
    for(const end of [-1,1])for(let k=-2;k<=2;k++){
     const q=end<0?-L/2+4:L/2-6;rb(marks,q,q+2,A.rl+k*1.65-.3,A.rl+k*1.65+.3,0,.253,wh)}
    rb(marks,-L/2+3,L/2-3,-Wd/2+12,A.rl-6,0,.239,ap);
    rb(marks,-L/2+3,L/2-3,A.rl-6,A.rl-4,0,.246,asph);
    const term=COL(night?'#394356':'#d4d7dc'),glass=COL(night?'#34cbef':'#83bfd4'),roof=COL(night?'#151a24':'#505a66');
    rb(det,-8,8,-Wd/2+1,-Wd/2+7,.24,6.4,term,true);
    rb(det,-7.5,7.5,-Wd/2+7,-Wd/2+7.2,1,5.7,glass);
    rb(det,-8.5,8.5,-Wd/2+.5,-Wd/2+7.6,6.4,6.9,roof);
    {const c=pt(0,-Wd/2+7.3);signPlane(ch.group,mallSignMat('AEROPORTO DE WINDFIELD','#0d1420','#ffd21a',512,80),c[0],8.4,c[1],11,1.35,ax?0:Math.PI/2)}
    rb(det,-L/2+2,-L/2+14,-Wd/2+1,-Wd/2+8,.24,5.8,COL(night?'#464953':'#99a2ab'),true);
    rb(det,-L/2+3,-L/2+13,-Wd/2+8,-Wd/2+8.1,.3,4.5,COL('#2a3038'));
    rb(det,11,15,-Wd/2+2,-Wd/2+6,.24,12,term,true);
    rb(det,10.5,15.5,-Wd/2+1.5,-Wd/2+6.5,12,13.3,glass);
    rb(det,10,16,-Wd/2+1,-Wd/2+7,13.3,13.8,roof);
    // Heliponto: na faixa central do pátio, sem entrar no volume da torre.
    const hh=pt(L/2-10,-Wd/2+13);rb(marks,L/2-15,L/2-5,-Wd/2+9,-Wd/2+19,0,.252,COL('#39444c'));
    rb(marks,L/2-13,L/2-7,-Wd/2+13-.35,-Wd/2+13+.35,0,.258,wh);
    rb(marks,L/2-10-.35,L/2-10+.35,-Wd/2+10,-Wd/2+16,0,.258,wh);
   }else{
   rb(marks,-L/2+3,L/2-3,A.rl-7,A.rl+7,0,.245,asph);for(let s0=-L/2+18;s0<L/2-18;s0+=10)rb(marks,s0,s0+5,A.rl-.2,A.rl+.2,0,.25,wh);
   for(const e of [-1,1])for(let k=-3;k<=3;k++)rb(marks,e>0?L/2-9:-L/2+5,e>0?L/2-5:-L/2+9,A.rl+k*1.8-.45,A.rl+k*1.8+.45,0,.25,wh);
   rb(marks,-L/2+12,L/2-12,A.rl-9.5,A.rl-7,0,.245,asph);rb(marks,-L/2+12,L/2-12,A.ap-6,A.rl-9.5,0,.243,ap);for(let s0=-L/2+14;s0<L/2-14;s0+=3)rb(marks,s0,s0+1.5,A.rl-8.4,A.rl-8.1,0,.25,yl);
   // terminal, torre de controle e hangar
   const term=COL(night?'#3a4252':'#e6e2d6'),glass=COL(night?'#3ad6ff':'#7fb8d8'),roof=COL(night?'#151a24':'#5a5f68');
   rb(det,-22,22,-Wd/2+4.5,A.ap-4,.24,8,term,true);rb(neonDN,-21,21,A.ap-4.05,A.ap-3.9,1.2,6.8,COL('#6aa8c4'));rb(det,-23,23,-Wd/2+.5,A.ap-3,8,8.5,roof);
   {const c=pt(0,A.ap-3.7);signPlane(ch.group,mallSignMat('AEROPORTO DE WINDFIELD','#0d1420','#ffd21a',512,80),c[0]+(ax?0:.01),9.6,c[1]+(ax?.01:0),14,1.6,ax?0:Math.PI/2)}
   rb(det,30,34,-Wd/2+2,-Wd/2+6,.24,20,term,true);rb(neonDN,29,35,-Wd/2+1,-Wd/2+7,20,23.5,COL('#6fbccc'));rb(det,28.6,35.4,-Wd/2+.6,-Wd/2+7.4,23.5,24.2,roof);
   rb(det,-L/2+6,-L/2+30,-Wd/2+1,A.hd,.24,10,COL(night?'#3a3f4c':'#9aa0a8'),true);rb(det,-L/2+7,-L/2+29,A.hd-.05,A.hd+.1,.3,8,COL('#2a2c34'));rb(det,-L/2+5.6,-L/2+30.4,-Wd/2+.6,A.hd+.4,10,10.6,COL(night?'#151a24':'#5a5f68'));
   /* v78 · AEROPORTO completo — tudo nos lotes do chunk (det/neonDN/roofD/marks), sem draw call novo além da placa EMBARQUE.
      Terminal com fachada de vidro em curva + marquise de embarque; torre com passarela, mastro e luz vermelha; 2–3 jatos parados
      (mesma malha do avião do aeroporto, 50%) com fingers ou escada; rebocador com carrinhos de bagagem; caminhão de combustível;
      luzes azuis na beira da pista, cabeceiras verdes, biruta e placas de pista; estacionamento de ônibus e táxis. Sorteio próprio. */
   {const a0=-Wd/2,xr=mulberry32(((ri*7919)^S.seed^0x41a7)>>>0),hs=-L/2+18,NE=neonDN;
    const rbr=(mb,s0,l0,s1,l1,y0,y1,th,col)=>{const p=pt(s0,l0),q=pt(s1,l1),dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);mb.geo(GEO.box,mtx((p[0]+q[0])/2,(y0+y1)/2,(p[1]+q[1])/2,len,y1-y0,th,0,Math.atan2(-dz,dx),0),col)};
    const col2=(s0,s1,l0,l1,k='bld')=>{const p=pt(s0,l0),q=pt(s1,l1);addCol(Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1]),k)};
    const dark=COL('#2a2e36'),steel=COL(night?'#5a5e6a':'#9aa0a8'),white=COL('#eef0f2');
    // terminal: fachada de vidro em curva voltada pra rua (o corpo antigo vai até a borda; o vidro fica na frente dele, por fora)
    {const N=14,S0=-22,S1=22,lf=s0=>a0+4.5-3.3*(1-(s0/22)**2),gl=COL('#6aa8c4');
     rb(det,-22,22,a0+1,a0+4.5,.24,.3,COL(night?'#4a4a56':'#c8c4b8'));
     for(let k=0;k<N;k++){const s0=S0+(S1-S0)*k/N,s1=S0+(S1-S0)*(k+1)/N,l0=lf(s0),l1=lf(s1);rbr(NE,s0,l0,s1,l1,.3,7.9,.06,gl);rbr(det,s0,l0-.05,s1,l1-.05,3.95,4.1,.1,dark);
      const pm=pt(s0,l0-.04);det.box(pm[0]-.07,.3,pm[1]-.07,pm[0]+.07,7.9,pm[1]+.07,dark);col2(s0,s1,Math.min(l0,l1)-.05,a0+4.5)}
     rb(det,-1.6,1.6,a0+1.02,a0+1.1,.3,2.7,dark);rb(det,-1.68,1.68,a0+1.0,a0+1.12,2.7,2.85,steel)}
    // marquise de embarque sobre a calçada, com pilares na guia, faixa de luz embaixo e placa
    {rb(det,-21,21,a0-3.6,a0+4.4,4.4,4.7,COL(night?'#8a8a98':'#e4e2dc'));rb(det,-21.05,21.05,a0-3.75,a0-3.6,4.15,4.8,COL('#2a6ab0'));
     for(const s0 of [-18,-9,0,9,18]){rb(det,s0-.18,s0+.18,a0-3.2,a0-2.84,.2,4.4,steel);col2(s0-.2,s0+.2,a0-3.22,a0-2.82,'pole')}
     for(let s0=-19.5;s0<20;s0+=3)rb(NE,s0-.6,s0+.6,a0-1.2,a0-.9,4.36,4.4,COL('#fff2c8'));
     const c=pt(0,a0-3.77);signPlane(ch.group,mallSignMat('EMBARQUE','#2a6ab0','#ffffff',256,48),c[0],4.47,c[1],4.2,.6,ax?Math.PI:-Math.PI/2)}
    // máquinas no telhado do terminal (sem sombra)
    for(let k=0;k<4;k++){const s0=-16+k*10+xr()*3,l0=a0+3+xr()*2.5;rb(roofD,s0,s0+2.2,l0,l0+1.6,8.5,9.3,COL('#b9b6ae'));rb(roofD,s0+.2,s0+2,l0+.2,l0+1.4,9.3,9.42,COL('#8d8a84'))}
    // torre: passarela com guarda-corpo, montantes do vidro, mastro com luz vermelha
    {rb(det,28.4,35.6,a0+.4,a0+7.6,19.8,20,steel);for(const[s0,s1,l0,l1] of [[28.4,35.6,a0+.4,a0+.48],[28.4,35.6,a0+7.52,a0+7.6],[28.4,28.48,a0+.4,a0+7.6],[35.52,35.6,a0+.4,a0+7.6]])rb(det,s0,s1,l0,l1,20,21,steel);
     for(const s0 of [29,32,35])for(const l0 of [a0+1,a0+7])rb(det,s0-.07,s0+.07,l0-.07,l0+.07,20,23.5,dark);
     rb(roofD,31.6,32.4,a0+3.6,a0+4.4,24.2,24.8,steel);rb(roofD,31.94,32.06,a0+3.94,a0+4.06,24.8,29.6,steel);for(const y of [26,27.4])rb(roofD,31.3,32.7,a0+3.97,a0+4.03,y,y+.06,steel);
     rb(NE,31.82,32.18,a0+3.82,a0+4.18,29.6,29.96,COL('#ff2a1a'));rb(roofD,30.2,30.4,a0+1.6,a0+1.8,24.2,25.6,steel);rb(roofD,30,30.6,a0+1.4,a0+2,25.6,25.7,dark)}
    // jatos parados: 2 com finger, o 3º (se couber) com escada
    {const s0=Math.max(-16,hs+18.5),planes=[];for(let k=0;k<3;k++){const sc=s0+k*19;if(sc+7>Math.min(L/2-14,40))break;planes.push(sc)}
     const ACS=['#d62828','#2a6ad6','#1e8a4a','#f2a21a','#7a2a8a'],lc=a0+19.375,ry=ax?Math.PI/2:Math.PI;
     planes.forEach((sc,k)=>{const mb=jetBodyMB(new MB(),COL(ACS[Math.floor(xr()*ACS.length)])),p=pt(sc,lc),M4b=new THREE.Matrix4().compose(new THREE.Vector3(p[0],1.44,p[1]),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(.5,.5,.5));mbAddXf(det,mb,M4b);
      col2(sc-.8,sc+.8,a0+12.2,a0+27.2);for(const zs of [-1,1])col2(sc+zs*2.9-.5,sc+zs*2.9+.5,lc-2.2,lc+.2);
      const finger=k<2&&sc-3>=-22&&sc-1.3<=22,tc=COL('#c9ccd2'),dl=COL('#1c2632');
      if(finger){rb(det,sc-3,sc-1.3,a0+9,a0+14.8,.95,2.75,tc);rb(det,sc-3.04,sc-1.26,a0+9,a0+14.8,2.75,2.85,steel);rb(det,sc-3.02,sc-1.28,a0+9.2,a0+14.6,1.75,2.25,dl);
       rb(det,sc-1.3,sc-.8,a0+12.9,a0+14.7,.9,2.8,COL('#3a3e48'));rb(det,sc-3.6,sc-.7,a0+8.95,a0+10.4,.3,3.0,tc);
       for(const s1 of [sc-2.8,sc-1.5])rb(det,s1-.08,s1+.08,a0+13.4,a0+13.6,.24,.95,steel);rb(det,sc-3,sc-1.3,a0+13.2,a0+13.8,.24,.5,dark);col2(sc-3,sc-1.3,a0+13.2,a0+13.8,'rock')}
      else{// escada de passageiros num chassi de caminhãozinho, encostada na porta da frente
       rb(det,sc-5.2,sc-1.2,a0+13.1,a0+14.5,.24,.7,COL('#e8e6e0'));rb(det,sc-5.2,sc-4.2,a0+13.1,a0+14.5,.7,1.6,COL('#f2c21a'));rb(det,sc-5.15,sc-4.25,a0+13.15,a0+14.45,1.1,1.5,dl);
       for(let j=0;j<6;j++){const ss=sc-3.9+j*.45;rb(det,ss,ss+.45,a0+13.2,a0+14.4,.7,.85+j*.12,COL('#d0d4d8'))}rb(det,sc-1.2,sc-.8,a0+13.2,a0+14.4,1.32,1.4,steel);
       for(const l0 of [a0+13.15,a0+14.35])rbr(det,sc-3.9,l0,sc-.9,l0,1.6,1.66,.05,steel);col2(sc-5.2,sc-1.2,a0+13.1,a0+14.5,'rock')}});
     // rebocador + 3 carrinhos de bagagem entre o terminal e os narizes
     if(planes.length){const sb=planes[0]+2,lb=a0+10.05,lug=['#2a6ab0','#d8202a','#3a3a3e','#f2c21a','#3ab36a','#8a5a3a'];
      rb(det,sb,sb+1.8,lb,lb+1.2,.24,.95,COL('#f2c21a'));rb(det,sb+1.1,sb+1.8,lb+.1,lb+1.1,.95,1.6,COL('#f2c21a'));rb(det,sb+1.15,sb+1.75,lb+.15,lb+1.05,1.15,1.5,COL('#1c2632'));
      for(let c=0;c<3;c++){const s1=sb-2.2*(c+1);rb(det,s1,s1+1.9,lb+.05,lb+1.15,.45,.55,steel);for(const w of [s1+.2,s1+1.6])rb(det,w-.12,w+.12,lb+.05,lb+1.15,.24,.45,dark);
       for(let b=0;b<3;b++){const bs=s1+.15+b*.58;rb(det,bs,bs+.5,lb+.15+xr()*.2,lb+.75+xr()*.25,.55,.85+xr()*.25,COL(lug[Math.floor(xr()*lug.length)]))}}col2(sb-6.6,sb+1.8,lb,lb+1.2,'rock')}
     // caminhão de combustível atrás da asa do 2º avião
     if(planes.length>1){const sf=planes[1]+2,lf=a0+22,red=COL('#c8202a');rb(det,sf,sf+6,lf,lf+1.6,.24,.75,dark);rb(det,sf+4.6,sf+6,lf,lf+1.6,.75,1.9,red);rb(det,sf+5.6,sf+6.02,lf+.15,lf+1.45,1.2,1.75,COL('#1c2632'));
      const p=pt(sf+2.2,lf+.8);det.geo(GEO.cyl16,mtx(p[0],1.45,p[1],.72,4.2,.72,ax?0:Math.PI/2,0,ax?Math.PI/2:0),white);rb(det,sf+.2,sf+4.2,lf+.7,lf+.9,1.95,2.25,red);col2(sf,sf+6,lf,lf+1.6,'rock')}}
    // luzes da pista: azuis nas bordas, verdes nas cabeceiras (acendem ao anoitecer)
    {const bl=COL('#2a6aff'),gr=COL('#2aff6a');for(let s0=-L/2+5;s0<=L/2-5;s0+=8)for(const l0 of [A.rl-7.4,A.rl+7.4])rb(NE,s0-.14,s0+.14,l0-.14,l0+.14,.24,.52,bl);
     for(const s0 of [-L/2+3.6,L/2-3.6])for(let l0=A.rl-6;l0<=A.rl+6.01;l0+=1.5)rb(NE,s0-.14,s0+.14,l0-.14,l0+.14,.24,.46,gr)}
    // biruta
    {const s0=L/2-16,l0=Math.min(A.rl+9,Wd/2-1.6),p=pt(s0,l0);rb(det,s0-.07,s0+.07,l0-.07,l0+.07,.24,5.2,steel);rb(NE,s0-.12,s0+.12,l0-.12,l0+.12,5.2,5.4,COL('#ff2a1a'));
     for(let k=0;k<4;k++){const r=.42-k*.07,q=pt(s0+.5+k*.55,l0);det.geo(GEO.cyl16,mtx(q[0],4.9-k*.06,q[1],r,.55,r,ax?0:Math.PI/2,0,ax?Math.PI/2:0),COL(k%2?'#f4f4f0':'#ff6a1a'))}}
    // placas de pista: amarelas com borda preta, no lado do pátio da taxiway
    for(const s0 of [-6,14,L/2-24]){const l0=A.rl-12.4;rb(det,s0-.95,s0+.95,l0-.07,l0+.07,.45,1.15,COL('#141416'));rb(det,s0-.85,s0+.85,l0-.09,l0+.09,.53,1.07,COL('#f2c21a'));rb(det,s0-.2,s0+.2,l0-.1,l0+.1,.62,.98,COL('#141416'));
     for(const s1 of [s0-.75,s0+.75])rb(det,s1-.04,s1+.04,l0-.04,l0+.04,.24,.45,steel)}
    // heliponto no pátio (o helicóptero do aeroporto nasce aqui)
    {const hs0=L/2-12,hl0=a0+19;rb(marks,hs0-4,hs0+4,hl0-4,hl0+4,0,.25,COL(night?'#3a3e48':'#5a6068'));rb(marks,hs0-.3,hs0+.3,hl0-1.3,hl0+1.3,0,.253,wh);for(const q of [-1.3,1.3])rb(marks,hs0-1.6,hs0+1.6,hl0+q-.25,hl0+q+.25,0,.253,wh)}
    // estacionamento de ônibus e táxis ao lado da torre (lado da rua)
    if(L/2-2-37>=14){const s0=36.8,s1=L/2-1.5,cMk=COL('#f4f4f0');rb(marks,s0,s1,a0+.9,a0+10.1,0,.249,asph);
     rb(marks,s0+1,s0+13.5,a0+1.2,a0+1.32,0,.252,yl);rb(marks,s0+1,s0+13.5,a0+4.5,a0+4.62,0,.252,yl);rb(marks,s0+1,s0+1.12,a0+1.2,a0+4.62,0,.252,yl);
     {const bp=pt(s0+7.2,a0+2.9),bid='airbus'+ri;if(!city.taken.has(bid)){const v=makeVehicle('bus',bp[0],bp[1],ax?0:Math.PI/2,'#2a6ad6');v.hand=true;v.sleep=true;v.spotId=bid;ch.cars.push(v)}}
     let n=0;for(let x=s0+15.5;x+2.8<=s1-.5;x+=2.8){rb(marks,x,x+.12,a0+5,a0+10,0,.252,cMk);if(n<3&&xr()<.6){const tp=pt(x+1.4,a0+7.5),tid='airtx'+ri+':'+(n++);if(!city.taken.has(tid)){const v=makeVehicle('taxi',tp[0],tp[1],ax?Math.PI/2:0,parkedCityColor('taxi',tid));v.hand=true;v.sleep=true;v.spotId=tid;ch.cars.push(v)}}}}
   }
   // cerca em volta com cancela na cabeceira (mesma cancela da indústria)
   {const fc=COL(night?'#5a6070':'#8a9098'),g0=A.ap-2,g1=A.ap+8,e=.6,fen=(s0,s1,l0,l1)=>{rb(det,s0,s1,l0,l1,.24,1.9,fc,true)};
    {const a0=-Wd/2,pk=L/2-2-37>=14;fen(-L/2+e,-23,a0+e,a0+e+.12);fen(-23.12,-23,a0+e,a0+4.6);fen(22,22.12,a0+e,a0+4.6);
     if(pk){fen(22,36.5,a0+e,a0+e+.12);fen(36.5,36.62,a0+e,a0+10.3);fen(36.5,L/2-e,a0+10.2,a0+10.32)}else fen(22,L/2-e,a0+e,a0+e+.12)}
    fen(-L/2+e,L/2-e,Wd/2-e-.12,Wd/2-e);fen(-L/2+e,-L/2+e+.12,-Wd/2+e,Wd/2-e);
    fen(L/2-e-.12,L/2-e,-Wd/2+e,g0);fen(L/2-e-.12,L/2-e,g1,Wd/2-e);
    buildIndustrialGate({pt:(u,v)=>pt(L/2-e,u)},g0+.3,g1-.3,ch)}
   } // fim do aeroporto Normal; o Mobile usa a versão compacta acima.
  }else if(info.kind==='lot'&&info.dealgas){const splitX=(ix1-ix0)>=(iz1-iz0);let gx0=ix0,gz0=iz0,gx1=ix1,gz1=iz1,dx0=ix0,dz0=iz0,dx1=ix1,dz1=iz1;
   if(splitX){const mid=(ix0+ix1)/2;gx1=mid-.9;dx0=mid+.9}else{const mid=(iz0+iz1)/2;gz1=mid-.9;dz0=mid+.9}
   const gf=faceOf(gx0,gz0,gx1,gz1),GF=LF(gf,gx0,gz0,gx1,gz1);gasCompact(GF,ri);
   MB_DROP={x0:dx0-.05,z0:dz0-.05,x1:dx1+.05,z1:dz1+.05,off:.24};try{dealLotShell(dx0,dz0,dx1,dz1,ri,true)}finally{MB_DROP=null}
  }else if(info.kind==='lot'&&info.deal&&city.deal){MB_DROP={x0:ix0-.05,z0:iz0-.05,x1:ix1+.05,z1:iz1+.05,off:.24};try{dealLotShell(ix0,iz0,ix1,iz1,ri,false)}finally{MB_DROP=null}
  }else if(info.kind==='lot'){
   let k=0;const lot={ri,tag:'lot:'+ri,x0:ix0,z0:iz0,x1:ix1,z1:iz1,slots:[],access:null};city.parkingLots.push(lot);lot.access=parkingAccess(ix0,iz0,ix1,iz1);const slot=(x,z,a)=>{const rec={ri,x,z,a,lot};city.empParkingSlots.push(rec);lot.slots.push(rec)};
   for(let x=ix0+2;x<ix1-2.6;x+=2.8){marks.flat(x,iz0+1,x+.12,iz0+6.5,0.042,cMark);marks.flat(x,iz1-6.5,x+.12,iz1-1,0.042,cMark);
    if(!(info.rampLot&&x<ix0+11))slot(x+1.4,iz0+3.7,Math.PI/2);slot(x+1.4,iz1-3.7,-Math.PI/2);
    if(R()<.33&&!(info.rampLot&&x<ix0+11))parkCar(x+1.4,iz0+3.7,Math.PI/2,ri+':'+(k++));if(R()<.33)parkCar(x+1.4,iz1-3.7,-Math.PI/2,ri+':'+(k++))}
  }else{
   const houses=info.kind==='houses',minS=houses?17:24;
   if(houses){side.flat(ix0,iz0,ix1,iz1,.24,cGrass);lawn(ix0+.2,iz0+.2,ix1-.2,iz1-.2,.244,.8,false)}
   const lots=[],urbanMeta=new Map(),urbanPending=[];const urbanKey=q=>q[0].toFixed(2)+','+q[1].toFixed(2);
   const split=(x0,z0,x1,z1,dp)=>{const w=x1-x0,d=z1-z0;if((w<minS&&d<minS)||dp>(houses?6:4)){lots.push([x0,z0,x1,z1]);return}
    const al=!houses&&dp<2&&R()<.20&&Math.max(w,d)>30;
    if(w>=d){const s=x0+w*rr(.36,.64);if(al){alley(s-1.8,z0,s+1.8,z1);split(x0,z0,s-1.8,z1,dp+1);split(s+1.8,z0,x1,z1,dp+1)}else{split(x0,z0,s,z1,dp+1);split(s,z0,x1,z1,dp+1)}}
    else{const s=z0+d*rr(.36,.64);if(al){alley(x0,s-1.8,x1,s+1.8);split(x0,z0,x1,s-1.8,dp+1);split(x0,s+1.8,x1,z1,dp+1)}else{split(x0,z0,x1,s,dp+1);split(x0,s,x1,z1,dp+1)}}};
   const denseFaces=new Map();let delGarageKey=null,delGarageFace=null,denseSafeLot=null;
   denseParcelByKey=new Map();
   if(houses){
    // v234: base da v232, 4x4 de casas pequenas, com 1 ou 2 parcelas em L
    // (3 micro-lotes compartilhados, porém UMA casa). Nada de caminho em L
    // criado no lote vazio: o L é o formato do terreno PRIVADO.
    // Malha 4×4 no quarteirão normal; lotes residenciais fundidos recebem
    // linhas/colunas adicionais para manter o MESMO tamanho de cada casa.
    const W=ix1-ix0,D=iz1-iz0,g=.95,nx=Math.max(3,Math.round(W/13)),nz=Math.max(3,Math.round(D/13));
    const cell=(ix,iz)=>({ix,iz,x0:ix0+W*ix/nx+(ix?g:0),x1:ix0+W*(ix+1)/nx-(ix<nx-1?g:0),
      z0:iz0+D*iz/nz+(iz?g:0),z1:iz0+D*(iz+1)/nz-(iz<nz-1?g:0)}),
      key=(ix,iz)=>ix+','+iz,parcelGrid=new Map();
    // Casa segura: uma única parcela de 2x2 micro-lotes na ESQUINA, com
    // espaço para garagem própria, porta, respawn e caminho externo. A quadra
    // restante conserva os lotes pequenos, cercas, árvores, gatos e lixo.
    let safeSquare=null;
    if(info.safe){
     const sr=mulberry32(((S.seed>>>0)^Math.imul(ri+1,0x547f2a19)^0x6df6bc31)>>>0);
     const opts=[[0,0],[nx-2,0],[0,nz-2],[nx-2,nz-2]].map(([sx,sz])=>{
      const a=cell(sx,sz),b=cell(sx+1,sz+1),q=[a.x0,a.z0,b.x1,b.z1],mx=(q[0]+q[2])/2,mz=(q[1]+q[3])/2,oo=SW+7.4;
      const faces=[sz===0?'n':'s',sx===0?'w':'e'];
      const available=faces.filter(f=>roadAt(f==='w'?q[0]-oo:f==='e'?q[2]+oo:mx,f==='n'?q[1]-oo:f==='s'?q[3]+oo:mz));
      return{sx,sz,q,face:available[0]||faces[0],score:available.length*10+sr()};
     }).sort((a,b)=>b.score-a.score)[0];
     safeSquare={ix:opts.sx,iz:opts.sz,lot:opts.q,face:opts.face,cells:new Set()};denseSafeLot=opts.q;
     for(let a=opts.sx;a<opts.sx+2;a++)for(let b=opts.sz;b<opts.sz+2;b++){
      safeSquare.cells.add(key(a,b));parcelGrid.set(key(a,b),safeSquare);
     }
    }
    if(info.isle&&city.isle){
     const q=city.isle.bridge,dir=q[0]==='h'?(q[1]<city.isle.i?'w':'e'):(q[2]<city.isle.j?'n':'s');
     const ix=dir==='w'?0:dir==='e'?nx-1:(q[1]<=city.isle.i?0:nx-1),
           iz=dir==='n'?0:dir==='s'?nz-1:(q[2]<=city.isle.j?0:nz-1);
     delGarageKey=cell(ix,iz).x0.toFixed(1)+','+cell(ix,iz).z0.toFixed(1);
     delGarageFace=dir;
    }
    const pr=mulberry32(((S.seed>>>0)^Math.imul(ri+1,0x7feb352d)^0x43ee921d)>>>0),candidates=[];
    for(let iz=0;iz<nz-1;iz++)for(let ix=0;ix<nx-1;ix++)for(let omit=0;omit<4;omit++){
     const cells=[[ix,iz],[ix+1,iz],[ix,iz+1],[ix+1,iz+1]].filter((_,j)=>j!==omit);
     if(cells.some(([a,b])=>{const c=cell(a,b);return c.x0.toFixed(1)+','+c.z0.toFixed(1)===delGarageKey}))continue;
     candidates.push({cells,score:pr()+.08*Math.hypot(ix-1,iz-1)});
    }
    candidates.sort((a,b)=>a.score-b.score);
    const maxL=info.isle?2:Math.max(1,Math.round(nx*nz/16))+(pr()<.27?1:0);
    let placedL=0;
    for(const cand of candidates){if(placedL>=maxL)break;
     if(cand.cells.some(([a,b])=>parcelGrid.has(key(a,b))))continue;
     // O cotovelo tem dois vizinhos no L; ali nasce a casa. Os outros dois
     // sublotes continuam unidos como jardim, não como lotes vazios soltos.
     const center=cand.cells.find(([a,b])=>cand.cells.filter(([x,z])=>Math.abs(x-a)+Math.abs(z-b)===1).length===2);
     if(!center)continue;
     const id=ri+':'+center.join(','),fenced=pr()<.4,kind=pr()<.5?'brown':'white';
     const parcel={ri,id,cells:cand.cells.map(([a,b])=>[a,b]),home:center,fenced,kind};city.denseLParcels.push(parcel);placedL++;
     for(const [a,b] of cand.cells)parcelGrid.set(key(a,b),parcel);
    }
    // Calçadas públicas: abrir o trecho entre duas células apenas quando
    // ambas fazem parte DA MESMA parcela L. Intersecções permanecem públicas.
    for(let k=1;k<nx;k++){
     const x=ix0+W*k/nx;
     for(let j=0;j<nz;j++){
      const p0=parcelGrid.get(key(k-1,j)),p1=parcelGrid.get(key(k,j));
      if(p0&&p0===p1)continue;
      const za=iz0+D*j/nz+(j?g:0),zb=iz0+D*(j+1)/nz-(j<nz-1?g:0);
      side.box(x-g,.241,za,x+g,.267,zb,cSide,{});
      residentialPassage(x-g,za,x+g,zb,ri,20+k*nz+j);
     }
    }
    for(let k=1;k<nz;k++){
     const z=iz0+D*k/nz;
     for(let i=0;i<nx;i++){
      const p0=parcelGrid.get(key(i,k-1)),p1=parcelGrid.get(key(i,k));
      if(p0&&p0===p1)continue;
      const xa=ix0+W*i/nx+(i?g:0),xb=ix0+W*(i+1)/nx-(i<nx-1?g:0);
      side.box(xa,.241,z-g,xb,.267,z+g,cSide,{});
      residentialPassage(xa,z-g,xb,z+g,ri,40+k*nx+i);
     }
    }
    for(let kx=1;kx<nx;kx++)for(let kz=1;kz<nz;kz++){
     if(safeSquare&&kx===safeSquare.ix+1&&kz===safeSquare.iz+1)continue;
     const x=ix0+W*kx/nx,z=iz0+D*kz/nz;
     side.box(x-g,.241,z-g,x+g,.267,z+g,cSide,{});
    }
    for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
     if(safeSquare&&safeSquare.cells.has(key(ix,iz))){
      if(ix===safeSquare.ix&&iz===safeSquare.iz){
       lots.push(safeSquare.lot);
       const lk=safeSquare.lot[0].toFixed(1)+','+safeSquare.lot[1].toFixed(1);
       denseFaces.set(lk,safeSquare.face);
      }
      continue;
     }
     const c=cell(ix,iz);if(c.x1-c.x0<9.5||c.z1-c.z0<9.5)continue;
     lots.push([c.x0,c.z0,c.x1,c.z1]);
     const lk=c.x0.toFixed(1)+','+c.z0.toFixed(1),parcel=parcelGrid.get(key(ix,iz));
     const shared=new Set();if(parcel)for(const [a,b] of parcel.cells){if(a===ix&&b===iz-1)shared.add('n');if(a===ix&&b===iz+1)shared.add('s');if(a===ix-1&&b===iz)shared.add('w');if(a===ix+1&&b===iz)shared.add('e')}
     if(parcel)denseParcelByKey.set(lk,{...parcel,shared,garden:!(parcel.home[0]===ix&&parcel.home[1]===iz)});
     const pref=nx===4&&nz===4?(ix===1?'w':ix===2?'e':iz===1?'n':'s'):
       ix>0&&ix<nx-1?(ix<nx/2?'w':'e'):iz>0&&iz<nz-1?(iz<nz/2?'n':'s'):(ix===0?'w':'e');
     denseFaces.set(lk,shared.has(pref)?['n','s','w','e'].find(f=>!shared.has(f)):pref);
    }
   }else if(!houses&&info.kind==='bld'&&!info.safe&&!info.tune&&!info.garage&&!info.reservedSpecial&&!info.low&&(ix1-ix0)>=43&&(iz1-iz0)>=43){
    // v248: áreas comuns e turísticas usam malha 4x4 para densidade de orla;
    // grupo L ocupa três células interligadas,
    // as demais recebem edifícios separados; o espaço central pode ficar livre.
    // O planejamento NÃO consome o RNG principal, garantindo layout determinístico.
    const nx=(ix1-ix0)>=48&&iz1-iz0>=48?4:3,nz=nx,W=ix1-ix0,D=iz1-iz0,dx=W/nx,dz=D/nz,g=nx===4?1.90:1.65;
    const ur=mulberry32(((S.seed>>>0)^Math.imul(ri+1,0x9e3779b1)^0xa981d1)>>>0),uid=(x,z)=>x+','+z;
    const occupied=new Set();const cells=(x,z)=>[ix0+x*dx,iz0+z*dz,ix0+(x+1)*dx,iz0+(z+1)*dz];
    const emit=(q,group=null)=>{if((q[2]-q[0]<7||q[3]-q[1]<7)&&!(group?.connector&&q[2]-q[0]>=4&&q[3]-q[1]>=4))return;
     lots.push(q);if(group)urbanMeta.set(urbanKey(q),group)};
    const groups=[];
    if(nx===4){
     // v264: 4 quadrantes disjuntos de 2x2, cada um pode receber um L curto
     // de 3 celulas. Reduz torres isoladas sem mudar os Ls de lotes grandes.
     for(let iz=0;iz<4;iz+=2)for(let ix=0;ix<4;ix+=2){
      const omit=Math.floor(ur()*4),cs=[[ix,iz],[ix+1,iz],[ix,iz+1],[ix+1,iz+1]].filter((_,j)=>j!==omit);
      groups.push({cs,score:ur()});
     }
    }else for(let iz=0;iz<nz-1;iz++)for(let ix=0;ix<nx-1;ix++)for(let omit=0;omit<4;omit++){
     const cs=[[ix,iz],[ix+1,iz],[ix,iz+1],[ix+1,iz+1]].filter((_,j)=>j!==omit);
     groups.push({cs,score:ur()+(.05*Math.hypot(ix-.5,iz-.5))});
    }groups.sort((a,b)=>a.score-b.score);
    const want=nx===4?(ur()<.78?4:3):2;let made=0;
    for(const grp of groups){if(made>=want||grp.cs.some(([a,b])=>occupied.has(uid(a,b))))continue;
     for(const [a,b] of grp.cs)occupied.add(uid(a,b));city.urbanLCount=(city.urbanLCount||0)+1;
     const groupId=ri+':L'+made,palette=[pick(st.walls),pick(st.roof)],ht=Math.round((night?rr(16,32):rr(12,28))*(1+(1-dc)*(night?1.4:1.0))/3.2)*3.2;if(st===STYLES.modern&&!city.haze){const nc=bldxColor(bldxRng(ri*7.31+made,made*3.17+ri,0x1b5));if(nc)palette[0]='#'+nc.getHexString()} /* v3 r34: cor do L inteiro */
     const rows=[...new Set(grp.cs.map(q=>q[1]))].sort((a,b)=>a-b);
     const bigRow=rows.find(z=>grp.cs.filter(q=>q[1]===z).length===2);
     const narrow=grp.cs.find(q=>q[1]!==bigRow),wide=grp.cs.filter(q=>q[1]===bigRow).sort((a,b)=>a[0]-b[0]);
     const qa=cells(wide[0][0],bigRow),qb=cells(wide[1][0],bigRow),qc=cells(narrow[0],narrow[1]);
     // Braços ligados sem fresta no encontro, mas recuados nas bordas externas.
     const seam=bigRow<narrow[1]?qa[3]:qa[1];
     const a=[qa[0]+g,qa[1]+g,qb[2]-g,qa[3]-g];
     const b=[qc[0]+g,qc[1]+g,qc[2]-g,qc[3]-g];
     // Ponte interna de 4.1 m une os braços sem ocupar os lotes vizinhos:
     // cada braço principal respeita o recuo externo, mesmo entre grupos L.
     const joinHalf=Math.max(2.18,g+.24),connector=[qc[0]+g,seam-joinHalf,qc[2]-g,seam+joinHalf];
     // v244: se QUALQUER pedaço do L invadir a faixa de aproximação,
      // todos os três volumes usam a altura mais baixa. É a união real das
      // peças (não o centro isolado nem a caixa do pátio vazio).
      const airCap=Math.min(airportFootprintLimit(...a),airportFootprintLimit(...b),airportFootprintLimit(...connector));
      const maxFacade=Math.min(ht,35.2,Number.isFinite(airCap)?airCap-3.0:Infinity);
      // Reserva 3 m para parapeito, máquinas de teto e margem de voo.
      // Permitimos um único pavimento perto da cabeceira (teto mínimo 6.3 m).
      const sharedHeight=Math.max(3.2,Math.floor((maxFacade+1e-6)/3.2)*3.2);
      const meta={id:groupId,pal:palette,h:sharedHeight,airCap};
      emit(a,meta);emit(b,meta);emit(connector,{...meta,connector:true});made++;
    }
    // Ocasionalmente nasce um pátio interno amplo, sem prédio central.
    const emptyCenter=ur()<.38;
    for(let iz=0;iz<nz;iz++)for(let ix=0;ix<nx;ix++){
     if(occupied.has(uid(ix,iz)))continue;
     if(ix===Math.floor(nx/2)&&iz===Math.floor(nz/2)&&emptyCenter)continue;
     if(ur()<.035&&ix>0&&iz>0)continue;
     const q=cells(ix,iz);emit([q[0]+g,q[1]+g,q[2]-g,q[3]-g]);
    }
    // Sites candidatos: intervalos livres nas divisórias internas.
    // São validados DEPOIS da construção real para não colocar lixo em paredes.
    for(let x=1;x<nx;x++)urbanPending.push({along:true,pos:ix0+x*dx,lo:iz0+8,hi:iz1-8});
    for(let z=1;z<nz;z++)urbanPending.push({along:false,pos:iz0+z*dz,lo:ix0+8,hi:ix1-8});
    city.urbanLBlocks=city.urbanLBlocks||new Set();city.urbanLBlocks.add(ri);
   }else if(NRb){const h=NRb.tw/2;if(NRb.ax==='x'){split(ix0,iz0,ix1,NRb.c-h,0);split(ix0,NRb.c+h,ix1,iz1,0)}else{split(ix0,iz0,NRb.c-h,iz1,0);split(NRb.c+h,iz0,ix1,iz1,0)}}else split(ix0,iz0,ix1,iz1,0);curI=[ix0,iz0,ix1,iz1];
   const faceOfLot=(x0,z0,x1,z1)=>{const edgeTol=urbanPending.length?3.0:1,mx=(x0+x1)/2,mz=(z0+z1)/2,oo=SW+7.4;
    // Esquina de quadra perto da água: tentar TODAS as faces com rua real,
    // não abandonar uma casa só porque a primeira face toca uma via fechada.
    const faces=[z1>iz1-edgeTol?'s':null,z0<iz0+edgeTol?'n':null,x0<ix0+edgeTol?'w':null,x1>ix1-edgeTol?'e':null].filter(Boolean);
    return faces.find(face=>roadAt(face==='e'?x1+oo:face==='w'?x0-oo:mx,face==='s'?z1+oo:face==='n'?z0-oo:mz))||nrFace(x0,z0,x1,z1)||null};
   // the safe house takes the widest street-facing lot of its block, so there is room for the side garage
   let safeLot=denseSafeLot;if(info.safe&&!safeLot){let bw=-1;for(const L of lots){const f=faceOfLot(...L);if(!f)continue;const w=(f==='n'||f==='s')?L[2]-L[0]:L[3]-L[1],dp=(f==='n'||f==='s')?L[3]-L[1]:L[2]-L[0];if(dp<11)continue;if(w>bw){bw=w;safeLot=L}}}
   // narrow lot (or apartment block): reserve a neighbouring street-facing lot as a 2-spot garage so cars never stay on the sidewalk
   let garLot=null;if(info.safe){const sw=safeLot?((faceOfLot(...safeLot)==='n'||faceOfLot(...safeLot)==='s')?safeLot[2]-safeLot[0]:safeLot[3]-safeLot[1]):0;
    if(!houses||sw<13.9){let bd=1e9;const sc=safeLot?[(safeLot[0]+safeLot[2])/2,(safeLot[1]+safeLot[3])/2]:[(ix0+ix1)/2,(iz0+iz1)/2];for(const L of lots){if(L===safeLot)continue;const f=faceOfLot(...L);if(!f)continue;const ns=f==='n'||f==='s',w=ns?L[2]-L[0]:L[3]-L[1],dp=ns?L[3]-L[1]:L[2]-L[0];if(w<8.6||dp<8)continue;const dd=Math.hypot((L[0]+L[2])/2-sc[0],(L[1]+L[3])/2-sc[1]);if(dd<bd){bd=dd;garLot=L}}}}
   /* v78 NEON ROAD: lote da oficina = lado DIREITO (visto da rua para o túnel), o mais perto do meio do trecho livre */
   let nrTuneKey=null;if(NRb&&info.tune){const uIn=NRb.end===0?NRb.tb:NRb.ta,uFar=NRb.end===0?NRb.u1:NRb.u0,um=(uIn+uFar)/2;let best=1e9,anyKey=null;
    for(const L of lots){const f=nrFace(...L);if(!f)continue;const ns=f==='n'||f==='s',fl=ns?L[2]-L[0]:L[3]-L[1],fd=ns?L[3]-L[1]:L[2]-L[0];if(fl<=10.5||fd<=11.5)continue;
     const k=L[0].toFixed(1)+','+L[1].toFixed(1),vc=NRb.ax==='x'?(L[1]+L[3])/2:(L[0]+L[2])/2,uc=NRb.ax==='x'?(L[0]+L[2])/2:(L[1]+L[3])/2;if(!anyKey)anyKey=k;if(Math.sign(vc-NRb.c)!==NRb.rightV)continue;const d=Math.abs(uc-um);if(d<best){best=d;nrTuneKey=k}}
    if(!nrTuneKey)nrTuneKey=anyKey}
   for(const[x0,z0,x1,z1] of lots){
    // No contorno da micro-ilha há água em três acessos; não depender de roadAt
    // para que a casa e a garagem apareçam mesmo com somente uma ponte.
    const isleFace=info.isle?(()=>{const d={n:z0-iz0,s:iz1-z1,w:x0-ix0,e:ix1-x1};return Object.keys(d).reduce((a,b)=>d[b]<d[a]?b:a)})():null;
    const lk=x0.toFixed(1)+','+z0.toFixed(1),member0=denseParcelByKey.get(lk),face0=info.isle&&lk===delGarageKey?delGarageFace:(faceOfLot(x0,z0,x1,z1)||denseFaces.get(lk)||(info.isle?isleFace:null)),
      face=member0&&member0.shared.has(face0)?(denseFaces.get(lk)||face0):face0;
    const sOK=info.safe&&face&&(city.safe?city.safeLot===lk:(!safeLot||city.safeFail||(safeLot[0]===x0&&safeLot[1]===z0))),had=city.safe;
    if(garLot&&garLot[0]===x0&&garLot[1]===z0&&(!city.safe||city.safeLot!==lk)){garLotB(x0,z0,x1,z1,face);continue}
    const member=denseParcelByKey.get(lk);
    if(houses&&member&&member.garden){
     // 1–2 árvores no braço ajardinado do terreno L. Sem novo ped/mesh por frame.
     const r=mulberry32(((S.seed>>>0)^Math.imul(ri+1,0x45d9f3b)^Math.imul(Math.round(x0*11+z0*13),0x7feb352d))>>>0),count=1+(r()<.45?1:0);
     for(let k=0;k<count;k++){const px=x0+(x1-x0)*(count===1?.5:k?.69:.31),pz=z0+(z1-z0)*(.4+r()*.2);
      tree(px,pz,.24,.75+r()*.24)}
     buildHouseFence(denseParcelFence(x0,z0,x1,z1,null,null,null,member));
     continue;
    }
    if(houses&&info.isle&&face&&!info.delDone&&lk===delGarageKey){const ns=face==='n'||face==='s',w=ns?x1-x0:z1-z0,dp=ns?z1-z0:x1-x0;if(w>=11.5&&dp>=10){info.delDone=true;house(x0,z0,x1,z1,face,'del');continue}}
    if(houses){if(sOK){house(x0,z0,x1,z1,face,true);if(city.safe&&!had)city.safeLot=lk;if(city.safe)continue;city.safeFail=true}house(x0,z0,x1,z1,face);continue}
    const um=urbanMeta.get(urbanKey([x0,z0,x1,z1]));
    if(!um&&R()<.08&&!info.para&&!NRb){if(!night)tree((x0+x1)/2,(z0+z1)/2,0.2,1.1);continue} /* Neon Road: sem lote vazio */
    if(um&&um.connector){
     // Emenda do L: mesmo material/altura, sem portas, antenas ou dezenas de janelas extras.
     isoCapture(()=>{walls.box(x0,0,z0,x1,um.h,z1,COL(um.pal[0]),{top:roofs,topCol:COL(um.pal[1]),win:[0,0]});})();
     addCol(x0,z0,x1,z1,'bld').top=um.h;
     city.buildingFootprints.push({x0,z0,x1,z1,ri:curRi,y:um.h+2});
     continue;
    }
    {const tf=NRb?nrFace(x0,z0,x1,z1):face; /* v78: no Neon Road a oficina abre para a rua nova, no lote escolhido acima */
    if(tf&&info.tune&&(!NRb||x0.toFixed(1)+','+z0.toFixed(1)===nrTuneKey)&&(!city.tuneSpot||city.tuneLot===x0.toFixed(1)+','+z0.toFixed(1))){const fl=(tf==='n'||tf==='s')?x1-x0:z1-z0,fd=(tf==='n'||tf==='s')?z1-z0:x1-x0;if(fl>10.5&&fd>11.5){garage(x0,z0,x1,z1,tf,ri,true);city.tuneLot=x0.toFixed(1)+','+z0.toFixed(1);
     if(NRb){/* v78: a oficina fica DENTRO de um prédio (como o túnel): pilares dos lados + andares por cima + fundo, mesma cor e janelas;
              a boca da garagem (−W..W, até 5,2 m) fica aberta. Becos de ~1,6 m entre esse prédio e os vizinhos (L) */
      {const ns2=tf==='n'||tf==='s',n2=tf==='s'?[0,1]:tf==='n'?[0,-1]:tf==='e'?[1,0]:[-1,0],tg2=[-n2[1],n2[0]],fx=tf==='e'?x1:tf==='w'?x0:(x0+x1)/2,fz=tf==='s'?z1:tf==='n'?z0:(z0+z1)/2;
       const Wg=4.6,Hg=5,Pw=1.0,Ds=Math.min(11.6,((tf==='n'||tf==='s')?z1-z0:x1-x0)-.6),SW2=Wg+Pw;
       const LB=(u0,u1,v0,v1)=>{const ax=fx+tg2[0]*u0-n2[0]*v0,az=fz+tg2[1]*u0-n2[1]*v0,bx=fx+tg2[0]*u1-n2[0]*v1,bz=fz+tg2[1]*u1-n2[1]*v1;return[Math.min(ax,bx),Math.min(az,bz),Math.max(ax,bx),Math.max(az,bz)]};
       let hu=Math.round(rr(10,17)/3.2)*3.2;{const Q0=LB(-SW2,SW2,0,Ds),cap=airportFootprintLimit(...Q0);if(Number.isFinite(cap))hu=Math.min(hu,Math.floor((cap-.3)/3.2)*3.2)}hu=Math.max(hu,Hg+.55);
       const col=COL(pick(st.walls)).multiplyScalar(rr(.9,1.06)),rc2=COL(pick(st.roof)).multiplyScalar(rr(.9,1.1)),ax2=rr(0,1),az2=rr(0,1),sz2=rr(1,1.6);
       isoCapture(()=>{const BX=(q,y0,y1,o)=>walls.box(q[0],y0,q[1],q[2],y1,q[3],col,Object.assign({top:roofs,topCol:rc2,win:[0,0]},o||{}));
        const PL0=LB(-SW2,-Wg+.2,-.05,Ds),PR0=LB(Wg-.2,SW2,-.05,Ds),BK=LB(-Wg+.2,Wg-.2,10,Ds),UP=LB(-SW2,SW2,-.05,Ds);
        BX(PL0,.2,Hg+.25);BX(PR0,.2,Hg+.25);if(Ds>10.2)BX(BK,.2,Hg+.25);BX(UP,Hg+.25,hu); /* pilares e fundo vão até a laje; o bloco de cima cobre tudo */
        for(const q of [PL0,PR0])addCol(q[0],q[1],q[2],q[3],'bld').top=hu;if(Ds>10.2){const c2=addCol(BK[0],BK[1],BK[2],BK[3],'bld');c2.top=hu}
        const Q=LB(-SW2,SW2,0,Ds),aw2=Q[0]+1.2+(Q[2]-Q[0]-3.8)*ax2,ad2=Q[1]+1.2+(Q[3]-Q[1]-3.8)*az2;det.box(aw2,hu,ad2,aw2+sz2,hu+.85,ad2+sz2*.8,night?COL('#3a3350'):COL('#b9b6ae'));
        {const pc=col.clone().multiplyScalar(.9),pT=hu+.5;det.box(Q[0],hu,Q[1],Q[2],pT,Q[1]+.25,pc);det.box(Q[0],hu,Q[3]-.25,Q[2],pT,Q[3],pc);det.box(Q[0],hu,Q[1]+.25,Q[0]+.25,pT,Q[3]-.25,pc);det.box(Q[2]-.25,hu,Q[1]+.25,Q[2],pT,Q[3]-.25,pc)}
        city.buildingFootprints.push({x0:Q[0],z0:Q[1],x1:Q[2],z1:Q[3],ri:curRi,y:hu+2})})();
       city.nrShop={sw:SW2+1.6}}
      /* prédios na sobra do lote, dos dois lados da oficina (sem buraco vazio) — pelo building() do jogo: portas, topo, caixa d'água */const ns=tf==='n'||tf==='s',a0=ns?x0:z0,a1=ns?x1:z1,mid=(a0+a1)/2,gap=(city.nrShop&&city.nrShop.sw)||5.1,m2=.6,b0=ns?z0:x0,b1=ns?z1:x1; /* v78: beco entre o prédio da oficina e os vizinhos */
      for(const [s0,s1] of [[a0+m2,mid-gap],[mid+gap,a1-m2]]){if(s1-s0<3.6)continue;const R0=[ns?s0:b0+m2,ns?b0+m2:s0,ns?s1:b1-m2,ns?b1-m2:s1];let hh=Math.max(6.4,Math.round(rr(8,18)/3.2)*3.2);{const cap=airportFootprintLimit(...R0);if(Number.isFinite(cap))hh=Math.max(3.2,Math.floor((cap-.3)/3.2)*3.2)}
       building(R0[0],R0[1],R0[2],R0[3],hh,{face:tf,nrf:tf})}}
     continue}}}
    if(face&&info.garage&&!garaged){const fl=(face==='n'||face==='s')?x1-x0:z1-z0,fd=(face==='n'||face==='s')?z1-z0:x1-x0;if(fl>8&&fd>9.5){garage(x0,z0,x1,z1,face,ri);garaged++;continue}}
    // Prédios recuam para DENTRO de seus lotes; não invadem calçadas nem ruas.
    const m=um?0:Math.min(rr(1.35,1.65),Math.max(.55,(Math.min(x1-x0,z1-z0)-9)/2));let h=um?um.h:(night?rr(10,40):rr(8,30));if(!um){h*=1+(1-dc)*(night?1.9:1.4);if(R()<.07)h*=1.8;if(info.low)h=rr(6.4,12.8);if(info.para)h=Math.max(h,19.2)}
    {let a=x0+m,b=z0+m,c=x1-m,d=z1-m;const shoreFace=['n','s','w','e'][city.coast],coastDist=city.coast===0?z0:city.coast===1?E-z1:city.coast===2?x0:E-x1,ps=((Math.round(x0*17)*73856093)^(Math.round(z0*13)*19349663)^S.seed)>>>0,pr=mulberry32(ps),eligible=face===shoreFace&&coastDist<o+SW+3&&onBeach((x0+x1)/2,(z0+z1)/2)&&!sOK&&!info.safe&&!info.tune&&!info.garage,patio=eligible&&pr()<.65,hotel=pr()<.5;
     if(patio){if(face==='n')b+=3.3;if(face==='s')d-=3.3;if(face==='w')a+=3.3;if(face==='e')c-=3.3}
     building(a,b,c,d,um?um.h:Math.round(h/3.2)*3.2,{exo:!urbanPending.length,face,nrf:NRb?nrFace(x0,z0,x1,z1):null,tour:info.tour,para:info.para,safe:sOK,patio,pal:um&&um.pal,simple:!!um,linkedL:um||null});if(patio)coastPatio(a,b,c,d,face,hotel,ps)};if(sOK&&city.safe&&!had)city.safeLot=lk;
   }
   if(urbanPending.length){
    // v253: nao somar duas margens de 1.55m (cada lado e cada ponto):
    // com isso o corredor 4x4 era SEMPRE rejeitado. Três amostras +/-1.45m
    // ja cobrem a largura 3m, com .15m extra nos footprints reais.
    const fp=(city.buildingFootprints||[]).filter(b=>b.ri===ri);
    const free=(x,z)=>!fp.some(b=>x>b.x0-.15&&x<b.x1+.15&&z>b.z0-.15&&z<b.z1+.15);
    const spans=[];
    for(const p of urbanPending){let start=null;
     for(let t=p.lo;t<=p.hi+1.01;t+=1.25){const last=t>p.hi,xx=p.along?p.pos:t,zz=p.along?t:p.pos;
      const good=!last&&free(xx,zz)&&free(xx+(p.along?1.45:0),zz+(p.along?0:1.45))&&free(xx-(p.along?1.45:0),zz-(p.along?0:1.45));
      if(good&&start===null)start=t;
      if(!good&&start!==null){const end=Math.min(t-1.25,p.hi);if(end-start>10){const lo=start+1,hi=end-1;
       if(p.along)spans.push([p.pos-1.5,lo,p.pos+1.5,hi]);else spans.push([lo,p.pos-1.5,hi,p.pos+1.5])}start=null}
     }
    }
    // Prioriza trechos longos no interior e alterna lixo limpo/sujo por seed.
    spans.sort((a,b)=>((b[2]-b[0])+(b[3]-b[1]))-((a[2]-a[0])+(a[3]-a[1])));
    for(let k=0;k<Math.min(6,spans.length);k++){
     const q=spans[k];alley(q[0],q[1],q[2],q[3],{interior:true});
    }
    city.urbanAlleyCount=(city.urbanAlleyCount||0)+Math.min(6,spans.length);
   }
  }
  if(info.casino||info.club){parkingGroundAdd(ix0,iz0,ix1,iz1);city.parkingLots.push({ri,tag:'entertainment-yard',x0:ix0,z0:iz0,x1:ix1,z1:iz1,slots:[],access:info.club?null:parkingAccess(ix0,iz0,ix1,iz1)});}
  if(NRb)try{neonRoadDeco(ri,bx0,bz0,bx1,bz1)}catch(e){console.error('[neon road deco]',e)}
  if(deferParkingSlab&&blockSideCol)pendingParkingSidewalk.push({bx0,bz0,bx1,bz1,ri,col:blockSideCol});
 });
 /* --- outer edge: sidewalks, beach, ring buildings --- */
 R=mulberry32((S.seed*7+ci*7919+cj*104729+17)>>>0);
 const TU=(s,t,u)=>s===0?[t,-u]:s===1?[t,E+u]:s===2?[-u,t]:[E+u,t];
 const rTU=(s,t0,t1,u0,u1)=>{const a=TU(s,t0,u0),b=TU(s,t1,u1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]};
  if(city.haze){const bark=COL('#4a3f36'),cm=city.hazeCalm;for(let k=0;k<70;k++){const a=R()*6.2832,u=SAND0-6+R()*(SHORE+2-SAND0+6),p=hazeRay(a,u);if(!own(clamp(p[0],0,E-1),clamp(p[1],0,E-1)))continue;if(cm&&Math.hypot(p[0]-cm[0],p[1]-cm[1])<16)continue;
    if(u<SAND0-1&&R()<.5){worldDeadTree(plants,p[0],p[1],rr(1,1.6),bark,true);addCol(p[0]-.35,p[1]-.35,p[0]+.35,p[1]+.35,'rock');continue}
    const sc=rr(1.3,3.6),y=groundY(p[0],p[1]);det.geo(GEO.ico,mtx(p[0],y-.15+sc*.3,p[1],sc*rr(1,1.5),sc*rr(.55,.95),sc*rr(1,1.5),rr(0,3),rr(0,6),rr(0,3)),COL(pick(['#8a8a8e','#6e6e72','#a2a09a'])).multiplyScalar(rr(.8,1)));addCol(p[0]-sc*.95,p[1]-sc*.95,p[0]+sc*.95,p[1]+sc*.95,'rock')}}
 for(let s=0;s<4;s++){const onEdge=s===0?cj===0:s===1?cj===NC-1:s===2?ci===0:ci===NC-1;if(!onEdge||city.haze)continue;
  const idx=s<2?ci:cj;const ta=idx===0?-o-SW:idx*CS*P,tb=idx===NC-1?E+o+SW:(idx+1)*CS*P;
  const bx=(t0,t1,u0,u1,y0,y1,col,mb)=>{const r=rTU(s,t0,t1,u0,u1);(mb||side).box(r[0],y0,r[1],r[2],y1,r[3],col,{})};
  const dI=s===0?[0,1]:s===1?[0,-1]:s===2?[1,0]:[-1,0];
  const t0l=Math.ceil((ta-10)/24)*24+10;
  const span=s===city.coast?(city.coastSpan||[-1e9,1e9]):null,segs=[];
  if(!span)segs.push([ta,tb,0]);else{const a=Math.max(ta,span[0]),b=Math.min(tb,span[1]);if(b>a){if(a>ta)segs.push([ta,a,0]);segs.push([a,b,1]);if(b<tb)segs.push([b,tb,0])}else segs.push([ta,tb,0])}
  if(s===city.coast&&city.seaBranch){const a=city.seaBranch.a*P+o,b=(city.seaBranch.a+1)*P-o;const clean=[];for(const[l,h,k]of segs){if(h<=a-10||l>=b+10)clean.push([l,h,k]);else{if(l<a-10)clean.push([l,a-10,k]);if(h>b+10)clean.push([b+10,h,k])}}segs.splice(0,segs.length,...clean);
   // Margens: rampa de areia do topo (calçadão/praia) até o fundo do canal, acompanhando o perfil da praia até o mar.
   const point=(t,u,y)=>{const q=TU(s,t,u);return[q[0],y,q[1]]},col=COL(night?'#5a4a62':'#e3cf9a'),cw=COL(night?'#4a4460':'#8a857c'),bot=SEA_Y-.35,pc=COL(night?'#4a4460':'#c8c2b4'),pc2=pc.clone().multiplyScalar(.8);
   // A rampa começa 30 cm dentro da mureta da cabeceira: a areia tem polygonOffset e, com a borda na face da mureta, ela vazava como um risco em ângulos rasantes.
   const us=[o-.3];for(let u=o+2;u<SHORE+2;u+=2)us.push(u);us.push(SHORE+2);
   for(const[outer,inner] of [[a-10,a],[b+10,b]]){const mid=(outer+inner)/2;if(mid<ta||mid>=tb)continue;
    /* v3 r27: a rampa reta das margens saiu — mouthMesh desenha a foz inteira (margens em curva + leito + praia em volta) */
    // Muretas da cabeceira: continuam a mureta da ponte pela borda da avenida e fecham o calçadão sobre a margem.
    const sg=Math.sign(inner-outer),rail=(t0,t1,u0,u1,y0)=>{const r=rTU(s,Math.min(t0,t1),Math.max(t0,t1),u0,u1);det.box(r[0],y0,r[1],r[2],1.0,r[3],pc);det.box(r[0]-.05,1.0,r[1]-.05,r[2]+.05,1.12,r[3]+.05,pc2);addCol(r[0],r[1],r[2],r[3],'rock').low=1.15};
    rail(outer,inner,o-.35,o,bot);rail(outer,outer-sg*.35,o,SAND0,0)}
   mouthMesh(sandMb,bedMb,s,ta,tb,night);
  }
  const sand=COL(night?'#5a4a62':'#e3cf9a'),prom=COL(night?'#3a3046':'#cbbca4'),mur=COL(night?'#4a3a5a':'#ddd4c2');
  for(const[sa,sb,beach] of segs){
   if(!beach){const ms=city.mouths?city.mouths[s]:[];let pcs=[[sa,sb]];for(const[m0,m1] of ms){const nx=[];for(const[a,b] of pcs){if(m1<=a||m0>=b){nx.push([a,b]);continue}if(m0>a)nx.push([a,m0]);if(m1<b)nx.push([m1,b])}pcs=nx}
    for(const[a,b] of pcs){bx(a,b,o,o+SW,0,.2,cSide);for(let t=t0l;t<b;t+=24){if(t<a||t<0||t>E)continue;const p=TU(s,t,o+.8);lamp(p[0],p[1],dI[0],dI[1])}}continue}
   bx(sa,sb,o,o+5,0,.2,prom);bx(sa,sb,o+5,o+11,0,.24,cGrass);
   // Matinhos baixos na faixa de grama da orla, reaproveitando o mesmo lote de geometria dos quintais.
   // Semente por trecho: distribuicao estavel e sem criar Mesh individual para cada folha.
   {const pr=mulberry32(((S.seed*59)^(s*83492791)^(Math.floor(sa)*19349663))>>>0);
    const count=Math.min(190,Math.floor((sb-sa)*.72));
    for(let k=0;k<count;k++){
     const t=sa+1+pr()*Math.max(0,sb-sa-2),u=o+5.65+pr()*4.65;
     if(t<sa+1||t>sb-1)continue;
     const p=TU(s,t,u),x=p[0],z=p[1],h=.12+pr()*.29,angle=pr()*6.283,sz=.065+pr()*.075;
     const ux=Math.cos(angle)*sz,uz=Math.sin(angle)*sz;
     const col=cGrass.clone().multiplyScalar(.83+pr()*.39);
     plants.qa([x-ux,.254,z-uz],[x+ux,.254,z+uz],[x+ux*.2,.24+h,z+uz*.2],[x-ux*.2,.24+h,z-uz*.2],col,[x,.32,z]);
    }
   }{const mq=s===city.coast?mouthGeo():null,sc=sand.clone().multiplyScalar(1.12);if(!mq)beachSand(sandMb,s,sa,sb,sc);else{const w=mq.hw+Math.max(10,mq.A+mq.pad); /* v3 r27: a praia em volta da foz vem da mouthMesh */
    for(const[q0,q1] of [[sa,Math.min(sb,mq.mid-w)],[Math.max(sa,mq.mid+w),sb]])if(q1-q0>.01)beachSand(sandMb,s,q0,q1,sc)}}
   const curb=rTU(s,sa,sb,o+5,o+5.35),curbTop=.6;
   det.box(curb[0],.2,curb[1],curb[2],curbTop,curb[3],mur,{});
   addCol(...curb,'rock').low=curbTop;
   for(let t=t0l;t<sb;t+=24){if(t<sa)continue;const p=TU(s,t,o+.8);lamp(p[0],p[1],dI[0],dI[1])}
   for(let t=sa+4;t<sb-2;t+=rr(9,16)){const p=TU(s,t,o+8);tree(p[0],p[1],.24,rr(.9,1.25),true)}
   // beach kiosks (barracas)
   for(let t=sa+rr(12,30);t<sb-8;t+=rr(40,70)){const u=o+14.6,wd=COL(night?'#4a3448':'#8a5a36'),st1=COL(pick(['#e04a3a','#2a8ad6','#f2c21a','#3ab36a','#ff6fae'])),wh=COL('#f6f2ea');
    for(const[dt,du] of [[-1.5,-1.5],[1.35,-1.5],[-1.5,1.35],[1.35,1.35]])bx(t+dt,t+dt+.15,u+du,u+du+.15,.16,2.55,wd,det);
    for(let k=0;k<4;k++)bx(t-1.75+k*.875,t-1.75+(k+1)*.875,u-1.8,u+1.8,2.55,2.75,k%2?wh:st1,det);
    bx(t-1.5,t+1.5,u-1.6,u-1,.16,1.05,wd,det);bx(t-1.6,t+1.6,u-1.7,u-.9,1.05,1.12,wh,det);
    if(night)bx(t-1.3,t+1.3,u-1.9,u-1.82,2.3,2.4,COL(pick(st.neon||['#ff4fa3'])),neon);
    const r=rTU(s,t-1.6,t+1.6,u-1.7,u+1.5);addCol(r[0],r[1],r[2],r[3],'rock')}
   for(let t=sa+6;t<sb-4;t+=rr(7,14)){const u=rr(o+15,SHORE-5),p=TU(s,t,u),gy=beachProfile(coastUe(t,u))-.17;
    if(lhNear(p[0],p[1],4))continue;
    if(R()<.55){const uc=COL(pick(BEACH_UMB_COLS));if(!mouthZone(p[0],p[1],1.5)){beachUmbrellaPole(det,p[0],gy,p[1]);det.geo(GEO.cone,mtx(p[0],2.6+gy,p[1],1.7,.55,1.7),uc)}} /* v3 r27: fora da corneta da foz (sem mudar a sequência de R) */
    const q=TU(s,t+rr(-1.5,1.5),u+rr(1.2,2));const tc=COL(pick(['#e04a3a','#2a8ad6','#f2c21a','#3ab36a','#ff6fae','#7a4ad6']));
    // Keep props above the sand and away from the estuary slopes.
    const qm=mouthZone(q[0],q[1],1.2);if(lhNear(q[0],q[1],3)||(!qm&&inWater(q[0],q[1])))continue;
    if(R()<.35){const w8=rr(0,8);if(!qm){
     const ns=s<2,x=q[0],z=q[1],base=groundY(x,z);beachLounger(det,x,z,base,ns,tc);
     addCol(x-(ns?.4:1),z-(ns?1:.4),x+(ns?.4:1),z+(ns?1:.4),'rock').low=.85;
     ch.patio=ch.patio||[];ch.patio.push({x,z,kind:'recline',angle:ns?0:Math.PI/2,p:null,wait:w8});}
    }else{
     if(!qm){const hx=s<2?.5:1,hz=s<2?1:.5,Y=(x,z)=>groundY(x,z)+.035;towelMb.qa([q[0]-hx,Y(q[0]-hx,q[1]-hz),q[1]-hz],[q[0]+hx,Y(q[0]+hx,q[1]-hz),q[1]-hz],[q[0]+hx,Y(q[0]+hx,q[1]+hz),q[1]+hz],[q[0]-hx,Y(q[0]-hx,q[1]+hz),q[1]+hz],tc,[q[0],-20,q[1]])}
     if(R()<.75&&!qm){ch.beach=ch.beach||[];const sp={x:q[0],z:q[1],p:null,t:0,ns:s<2};ch.beach.push(sp);if(!CITY_CACHE.building&&DN.nightF<=.5&&rainAt(q[0],q[1])<.2){sp.p=spawnLying(q[0],q[1],pick2(BEACH_PALS));sp.p.lieNs=sp.ns;ch.peds.push(sp.p)}}
    }
   }}

  // where a half-side beach ends: a promenade running down to the sea (the L)
  if(span&&city.coastSpan){const pa=span[0]<0?E/2:E/2-7,pb=pa+7,a=Math.max(ta,pa),b=Math.min(tb,pb);
   if(b>a){bx(a,b,o+SW,SHORE+1.5,0,.2,prom);const wl=E/2;if(wl>=ta&&wl<=tb){bx(wl-.18,wl+.18,o+5,SHORE+1.5,.2,.75,mur,det)}
    if(pb<=tb&&pa>=ta){bx(pa,pb,SHORE+1.2,SHORE+1.5,.2,1.1,mur,det);const r=rTU(s,pa,pb,SHORE+1.1,SHORE+1.6);addCol(r[0],r[1],r[2],r[3],'rock');
     for(let u=o+SW+6;u<SHORE;u+=11){const p=TU(s,(pa+pb)/2,u);det.box(p[0]-.12,.2,p[1]-.12,p[0]+.12,3.6,p[1]+.12,cDet);det.geo(GEO.ico,mtx(p[0],3.8,p[1],.35,.35,.35),COL('#fff2c8'))}}}}
 }
 // wild edge (rural corners): dense woods and boulders instead of buildings
 /* --- piers & boats --- */
 for(const p of city.piers||[]){if(!own(clamp(p.cx,0,E-1),clamp(p.cz,0,E-1)))continue;const wood=COL(night?'#5a4048':'#8a6a48'),wood2=wood.clone().multiplyScalar(.8),rail=COL(night?'#4a4460':'#d8d4cc'),post=COL('#4a3a2a');
  if(p.beach){const r=p.r;det.box(r[0],p.y-.25,r[1],r[2],p.y,r[3],wood,{bottom:true});const along=(r[2]-r[0])>(r[3]-r[1]);
   for(let t=0;t<(along?r[2]-r[0]:r[3]-r[1]);t+=3){for(const sd of [0,1]){const x=along?r[0]+t:(sd?r[2]-.2:r[0]+.2),z=along?(sd?r[3]-.2:r[1]+.2):r[1]+t;det.geo(GEO.cyl,mtx(x,(p.y+SEA_Y-2)/2,z,.18,p.y-SEA_Y+2,.18),post)}}
   const side=along?[[r[0],r[1],r[2],r[1]+.15],[r[0],r[3]-.15,r[2],r[3]]]:[[r[0],r[1],r[0]+.15,r[3]],[r[2]-.15,r[1],r[2],r[3]]];det.box(side[0][0],p.y,side[0][1],side[0][2],p.y+1,side[0][3],rail);addCol(side[0][0],side[0][1],side[0][2],side[0][3],'rock').low=1.1}
  else{const{ax,az,tx,tz,nx,nz,ts}=p;const Q=(t0,t1,d0,d1,y0,y1,col,coll,bt)=>{const a=[ax+tx*t0+nx*d0,az+tz*t0+nz*d0],b=[ax+tx*t1+nx*d1,az+tz*t1+nz*d1];const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),z0=Math.min(a[1],b[1]),z1=Math.max(a[1],b[1]);if(col)det.box(x0,y0,z0,x1,y1,z1,col,bt?{bottom:true}:undefined);if(coll)addCol(x0,z0,x1,z1,'rock').low=coll;return[x0,z0,x1,z1]};
   const cst=COL(night?'#5a5470':'#a8a298');Q(ts-2.4,ts,.35,2.6,-.4,0,cst);for(let k=0;k<8;k++){const y=-(k+1)/8*2.4;Q(ts+k,ts+k+1,.35,2.6,y-.3,y+.3*0,cst)}
   Q(ts+8,ts+20,.35,4.4,DY-.3,DY,wood,0,true);for(let t=ts+8;t<=ts+20;t+=3)for(const d of [.6,4.2]){const q=[ax+tx*t+nx*d,az+tz*t+nz*d];det.geo(GEO.cyl,mtx(q[0],(DY+RY-1.5)/2,q[1],.16,DY-RY+1.5,.16),post)}
   Q(ts-2.4,ts+8,2.6,2.75,0,0,rail);for(let k=0;k<8;k++)Q(ts+k,ts+k+.12,2.6,2.75,-(k+1)/8*2.4,-(k+1)/8*2.4+1,rail);Q(ts-.2,ts+8,2.6,2.75,-1.2,-1.1,rail);Q(ts,ts+8,2.55,2.8,-2.4,0,null,1.4);
   Q(ts+8,ts+20,4.3,4.45,DY,DY+1,rail,1.4);Q(ts+19.85,ts+20,.35,4.45,DY,DY+1,rail,1.4);Q(ts+8,ts+8.15,2.75,4.45,DY,DY+1,rail,1.4);
   {const q=[ax+tx*(ts+19)+nx*2,az+tz*(ts+19)+nz*2];det.box(q[0]-.08,DY,q[1]-.08,q[0]+.08,DY+3,q[1]+.08,cDet);det.geo(GEO.ico,mtx(q[0],DY+3.2,q[1],.3,.3,.3),COL('#fff2c8'));if(night)glow.flat(q[0]-5,q[1]-5,q[0]+5,q[1]+5,DY+.05,COL('#ffd9a0').multiplyScalar(.4))}}
  const boatColor=p.boat?pick(['#c8282a','#2a6ab0','#2a8a5a','#e8a020','#1a1a2a']):null;if(S.style!=='inverted'&&p.boat&&!city.taken.has(p.id)){const v=makeVehicle('boat',p.boat.x,p.boat.z,p.boat.a,boatColor);v.hand=true;v.sleep=true;v.spotId=p.id;ch.cars.push(v)}}
 if(city.lh&&own(clamp(city.lh.cx,0,E-1),clamp(city.lh.cz,0,E-1)))worldLighthouse({det,neon,hwin,sandMb,signs,night});
 for(const r of city.ramps||[]){if(!own(clamp(r.x,0,E-1),clamp(r.z,0,E-1)))continue;if(r.field!=null&&!rampField(r))continue;rampMesh(r,det,neon,marks)}
 if(city.body&&!city.picked.has(city.body.id)&&own(clamp(city.body.x,0,E-1),clamp(city.body.z,0,E-1))&&bodyInWater(city.body)){const b=city.body;const q=spawnLying(b.x,b.z);q.corpse=true;q.gy=RY+.05;ch.peds.push(q);const am=b.loot==='cash'?250:b.loot==='rpg'?4:120;makePickup(b.id,b.x+1.5,b.z,am,ch,b.loot)}
 for(const wp of city.wild){const[x0,z0,x1,z1]=wp;if(!own((x0+x1)/2,(z0+z1)/2))continue;side.box(x0,0,z0,x1,.22,z1,cGrass,{});lawn(x0+.4,z0+.4,x1-.4,z1-.4,.224,.7);addCol(x0,z0,x1,z1,'rock');
  for(let x=x0+1.5;x<x1-1;x+=rr(3.4,5))for(let z=z0+1.5;z<z1-1;z+=rr(3.4,5)){if(R()<.16){rock(x,z,rr(2,4.5))}else tree(x+rr(-1,1),z+rr(-1,1),.22,rr(1.05,1.75),false,true)}}
 /* --- rivers: water, parapets along every water edge, bridge decoration --- */
 if(city.water&&city.water.length){const wc=COL(night?'#141a40':'#2a78a4'),pc=COL(night?'#4a4460':'#c8c2b4'),pc2=pc.clone().multiplyScalar(.8);
  const PL2=city.poll,cw=COL(night?'#3a3448':'#8a857c'),cw2=COL(night?'#2a2436':'#5a5a52');
  /* v3 r32: leito do rio em grade de 4 m com altura de riverBedY e cor por profundidade (pv = sujeira do rio poluído) */
  const rbed=(X0,Z0,X1,Z1,pv)=>{const nx=Math.max(1,Math.round((X1-X0)/4)),nz=Math.max(1,Math.round((Z1-Z0)/4)),dirt=COL(night?'#2a2018':'#5a4630'),st=bedMb.p.length;
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const xa=X0+(X1-X0)*i/nx,xb=X0+(X1-X0)*(i+1)/nx,za=Z0+(Z1-Z0)*j/nz,zb=Z0+(Z1-Z0)*(j+1)/nz;
    bedMb.qa([xa,riverBedY(xa,zb),zb],[xb,riverBedY(xb,zb),zb],[xb,riverBedY(xb,za),za],[xa,riverBedY(xa,za),za],COL('#ffffff'),[(xa+xb)/2,RY-20,(za+zb)/2])}
   for(let k=st;k<bedMb.p.length;k+=3){const q=k/3,cc=riverBedCol(bedMb.p[k+1],night);if(pv)cc.lerp(dirt,clamp(pv*1.4,0,1));bedMb.u[q*2]=bedMb.p[k]/8;bedMb.u[q*2+1]=bedMb.p[k+2]/8;bedMb.c[k]=cc.r;bedMb.c[k+1]=cc.g;bedMb.c[k+2]=cc.b}};
  for(const r of city.water){if(r.cutOnly)continue;const mx=(r[0]+r[2])/2,mz=(r[1]+r[3])/2;if(!own(clamp(mx,0,E-1),clamp(mz,0,E-1)))continue;
   if(r.estuary){
    const a=city.seaBranch.a*P+o,b=(city.seaBranch.a+1)*P-o,pt=(t,u,y)=>{const q=TU(city.coast,t,u);return[q[0],y,q[1]]},u1=SHORE+2,floor=(t,u)=>{const q=pt(t,u,0),f=clamp((u+o)/(2*o),0,1),s=f*f*(3-2*f);return riverBedY(q[0],q[2])*(1-s)+mouthBed(u)*s};
    for(let u=-o;u<o-.3;u+=4){const v=Math.min(o-.3,u+4); /* v3 r27: daqui para o mar o leito é da mouthMesh */
     for(let t=a;t<b;t+=4){const end=Math.min(b,t+4),center=(t+end)/2,world=pt(center,(u+v)/2,0),inlet=pt(center,-o,0);
      const pollution=Math.max(pollAt(world[0],world[2]),pollAt(inlet[0],inlet[2])*(1-.35*clamp((u-o)/(SHORE-o),0,1)));
      const bed=COL(night?'#5a5a7a':'#d8d4c8').lerp(COL(night?'#6a6488':'#ffffff'),clamp((u+o)/(u1+o),0,1)).lerp(COL(night?'#2a2018':'#5a4630'),clamp(pollution*1.4,0,1)),st=bedMb.p.length;
      bedMb.qa(pt(t,u,floor(t,u)),pt(end,u,floor(end,u)),pt(end,v,floor(end,v)),pt(t,v,floor(t,v)),bed,pt(t,u,-20));
      for(let k=st;k<bedMb.p.length;k+=3){const q=k/3;bedMb.u[q*2]=bedMb.p[k]/8;bedMb.u[q*2+1]=bedMb.p[k+2]/8;const uu=outDist(bedMb.p[k],bedMb.p[k+2]),f=clamp((uu+o)/(2*o),0,1),cc=riverBedCol(bedMb.p[k+1],night).lerp(bed,f*f*(3-2*f));bedMb.c[k]=cc.r;bedMb.c[k+1]=cc.g;bedMb.c[k+2]=cc.b}}}
    continue}
   const pr=PL2?Math.hypot(clamp(PL2.x,r[0],r[2])-PL2.x,clamp(PL2.z,r[1],r[3])-PL2.z):1e9;const dirty=PL2&&pr<PL2.R*1.4;
   if(!dirty)rbed(r[0],r[1],r[2],r[3],null);
   if(!dirty)waveMb.quad([r[0],RY+.012,r[3]],[r[2],RY+.012,r[3]],[r[2],RY+.012,r[1]],[r[0],RY+.012,r[1]],0,1,0,[r[0]/16,r[3]/16,r[2]/16,r[1]/16],COL('#ffffff'));
   if(PL2&&pr<PL2.R*1.4){const ts=5;for(let x=r[0];x<r[2]-.01;x+=ts)for(let z=r[1];z<r[3]-.01;z+=ts){const x1=Math.min(r[2],x+ts),z1=Math.min(r[3],z+ts);wat.flat(x,z,x1,z1,RY,waterCol((x+x1)/2,(z+z1)/2,wc,night));const pv=pollAt((x+x1)/2,(z+z1)/2);rbed(x,z,x1,z1,pv);if(pv<.25)waveMb.quad([x,RY+.012,z1],[x1,RY+.012,z1],[x1,RY+.012,z],[x,RY+.012,z],0,1,0,[x/16,z1/16,x1/16,z/16],COL('#ffffff').multiplyScalar(1-pv*4))}
    const jr=mulberry32(((Math.round(r[0])*73856093)^(Math.round(r[1])*19349663)^S.seed)>>>0);const n=Math.round((r[2]-r[0])*(r[3]-r[1])/160);
    for(let k=0;k<n;k++){const x=r[0]+1+jr()*(r[2]-r[0]-2),z=r[1]+1+jr()*(r[3]-r[1]-2),pv=pollAt(x,z);if(jr()>pv)continue;const t=jr();
     if(t<.35)det.geo(GEO.cyl,mtx(x,RY+.18,z,.32,.75,.32,Math.PI/2,jr()*6,0),COL(jr()<.5?'#c8a020':'#3a6a3a'));else if(t<.75){const sc=waterCol(x,z,COL(night?'#141a40':'#2a78a4'),night).multiplyScalar(.78).lerp(COL(night?'#2a2a3a':'#3a3a30'),.25),k=2+Math.floor(jr()*3);for(let q=0;q<k;q++){const r1=.8+jr()*1.8;wat.geo(GEO.disc,mtx(x+(jr()-.5)*2.4,RY+.015+q*.002,z+(jr()-.5)*2.4,r1*(.7+jr()*.6),r1*(.7+jr()*.6),1,-Math.PI/2,0,jr()*6.28),sc)}}else det.box(x-.4,RY-.02,z-.3,x+.4,RY+.17,z+.3,COL('#e8e4dc'))}}
   else wat.flat(r[0],r[1],r[2],r[3],RY,wc);
   const edges=[[r[0],r[1],r[2],r[1],0,-1],[r[0],r[3],r[2],r[3],0,1],[r[0],r[1],r[0],r[3],-1,0],[r[2],r[1],r[2],r[3],1,0]];
   for(const[x0,z0,x1,z1,nx,nz] of edges){const L=Math.hypot(x1-x0,z1-z0);if(L<.5)continue;let a=null;
    for(let t=0;t<=L+.01;t+=Math.min(4,L)){const tt=Math.min(t,L),px=x0+(x1-x0)*tt/L+nx*.7,pz=z0+(z1-z0)*tt/L+nz*.7;const land=!riverZone(px,pz)&&!mouthChannel(px,pz)&&Math.abs(px)<E+300&&Math.abs(pz)<E+300&&px>-300&&pz>-300;
     if(land&&a===null)a=tt;if((!land||tt>=L)&&a!==null){const b=land?L:tt;if(b-a>.3){const ax=x0+(x1-x0)*a/L,az=z0+(z1-z0)*a/L,bx2=x0+(x1-x0)*b/L,bz2=z0+(z1-z0)*b/L;
       const X0=Math.min(ax,bx2)-(nx?(nx>0?.35:0):0),X1=Math.max(ax,bx2)+(nx?(nx<0?.35:0):0),Z0=Math.min(az,bz2)-(nz?(nz>0?.35:0):0),Z1=Math.max(az,bz2)+(nz?(nz<0?.35:0):0);
       const xa=nx?(nx>0?r[2]-.35:r[0]):X0,xb=nx?(nx>0?r[2]:r[0]+.35):X1,za=nz?(nz>0?r[3]-.35:r[1]):Z0,zb=nz?(nz>0?r[3]:r[1]+.35):Z1;
       for(const[qa,qz,qb,qw] of carveGap(xa,za,xb,zb)){det.box(qa,0,qz,qb,1.0,qw,pc);det.box(qa-.05,1.0,qz-.05,qb+.05,1.12,qw+.05,pc2);if(qa>-o-60&&qb<E+o+60&&qz>-o-60&&qw<E+o+60)addCol(qa,qz,qb,qw,'rock').low=1.15}
       {const ix=nx?(nx>0?r[2]-.35:r[0]+.35):0,iz=nz?(nz>0?r[3]-.35:r[1]+.35):0,A=nx?[ix,0,Math.min(az,bz2)]:[Math.min(ax,bx2),0,iz],B=nx?[ix,0,Math.max(az,bz2)]:[Math.max(ax,bx2),0,iz];
        det.qa(A,B,[B[0],RY-1.5,B[2]],[A[0],RY-1.5,A[2]],cw,[(A[0]+B[0])/2+nx*5,-1,(A[2]+B[2])/2+nz*5]);det.qa([A[0],RY+.35,A[2]],[B[0],RY+.35,B[2]],[B[0],RY-.05,B[2]],[A[0],RY-.05,A[2]],cw2,[(A[0]+B[0])/2+nx*5,-1,(A[2]+B[2])/2+nz*5]);worldFoamBank(foamMb,A,B,nx,nz)}}a=null}}}}
  for(const r of city.decks||[]){const mx=(r[0]+r[2])/2,mz=(r[1]+r[3])/2;if(!own(clamp(mx,0,E-1),clamp(mz,0,E-1)))continue;// Sobre a foz a água e o leito já vêm do mar/canal; nas demais pontes são desenhados sob a laje.
   const overSea=mouthChannel(mx,mz);det.box(r[0],-1.3,r[1],r[2],-.01,r[3],cw,{noTop:true,bottom:true});if(!overSea){wat.flat(r[0],r[1],r[2],r[3],RY,waterCol(mx,mz,wc,night));waveMb.quad([r[0],RY+.012,r[3]],[r[2],RY+.012,r[3]],[r[2],RY+.012,r[1]],[r[0],RY+.012,r[1]],0,1,0,[r[0]/16,r[3]/16,r[2]/16,r[1]/16],COL('#ffffff'));rbed(r[0],r[1],r[2],r[3],null);}
   for(const[x0,z0,x1,z1,nx,nz] of [[r[0],r[1],r[2],r[1],0,-1],[r[0],r[3],r[2],r[3],0,1],[r[0],r[1],r[0],r[3],-1,0],[r[2],r[1],r[2],r[3],1,0]]){const px=(x0+x1)/2+nx*.7,pz=(z0+z1)/2+nz*.7;
    let xa=nx?(nx>0?r[2]-.35:r[0]):x0,xb=nx?(nx>0?r[2]:r[0]+.35):x1,za=nz?(nz>0?r[3]-.35:r[1]):z0,zb=nz?(nz>0?r[3]:r[1]+.35):z1;
    if(!waterAt(px,pz)&&!mouthChannel(px,pz)){if(!riverZone(px,pz))det.box(xa,RY-.4,za,xb,-1.3,zb,cw2);continue}det.box(xa,0,za,xb,1.0,zb,pc);det.box(xa-.05,1.0,za-.05,xb+.05,1.12,zb+.05,pc2);addCol(xa,za,xb,zb,'rock').low=1.15}}
  for(const p of city.pillars||[]){const mx=(p[0]+p[2])/2,mz=(p[1]+p[3])/2;if(!own(clamp(mx,0,E-1),clamp(mz,0,E-1)))continue;det.box(p[0],RY-RIVBED.max-.2,p[1],p[2],-1.3,p[3],cw2)}
  // Agrupa trechos contiguos da mesma ponte antes de construir os arcos.
  // Assim o arco acompanha o comprimento real da travessia, mesmo quando
  // o rio ocupa varios quarteiroes consecutivos.
  const bridgeSets=new Map();
  for(const q of city.bridges){const key=q[0]+':'+(q[0]==='v'?q[1]:q[2]);if(!segExists(q[1],q[2],q[0]==='h'?0:1))continue;
   if(!bridgeSets.has(key))bridgeSets.set(key,[]);if(!bridgeSets.get(key).some(b=>b[1]===q[1]&&b[2]===q[2]))bridgeSets.get(key).push(q)}
  for(const list of bridgeSets.values()){
   const vert=list[0][0]==='v';list.sort((a,b)=>a[vert?2:1]-b[vert?2:1]);
   const groups=[];let group=[];
   for(const q of list){if(group.length&&q[vert?2:1]!==group[group.length-1][vert?2:1]+1){groups.push(group);group=[]}group.push(q)}
   if(group.length)groups.push(group);
   for(const segment of groups){const first=segment[0],last=segment[segment.length-1],k=first[1],j=first[2];
    const start=first[vert?2:1]*P+RW/2,end=(last[vert?2:1]+1)*P-RW/2;
    const span=end-start,midAlong=(start+end)/2;
    const cx2=vert?k*P:midAlong,cz2=vert?midAlong:j*P;
    if(!own(clamp(cx2,0,E-1),clamp(cz2,0,E-1)))continue;
    const hr=mulberry32(((k*73856093)^(j*19349663)^S.seed)>>>0);
    const decoRoll=hr();
    if(decoRoll<.28)continue;if(segment.some(q=>dbIsSeg(q)))continue;
    const stc=COL(night?'#7a6aa8':pick(['#3a6a9a','#9a3a2a','#5a6a6a'])),shade=stc.clone().multiplyScalar(.75),trim=stc.clone().lerp(COL('#e4d9ca'),.24);
    const H2=9,deckY=1.08,style=decoRoll<.62?'arch':'cable';
    if(style==='arch'){
     const steps=Math.max(20,Math.ceil(span/3)),thick=1.06,depth=1.02;
     for(const sd of [-1,1])for(let n=0;n<steps;n++){
      const t0=-span/2+n*span/steps,t1=-span/2+(n+1)*span/steps;
      const y0=1.12+H2*(1-(2*t0/span)**2),y1=1.12+H2*(1-(2*t1/span)**2);
      const off=sd*(RW/2-.175-depth/2),outward=vert?[sd,0,0]:[0,0,sd];
      const A=vert?[cx2+off,y0,cz2+t0]:[cx2+t0,y0,cz2+off];
      const B=vert?[cx2+off,y1,cz2+t1]:[cx2+t1,y1,cz2+off];
      const shift=(v,d,h=0)=>[v[0]+outward[0]*d,v[1]+h,v[2]+outward[2]*d];
      const C=shift(A,depth),D=shift(B,depth);
      const AT=shift(A,0,thick),BT=shift(B,0,thick),CT=shift(C,0,thick),DT=shift(D,0,thick);
      const inside=shift([(A[0]+B[0])/2,(y0+y1)/2,(A[2]+B[2])/2],depth/2,thick/2);
      det.qa(A,B,BT,AT,stc,inside);det.qa(C,D,DT,CT,stc,inside);det.qa(AT,BT,DT,CT,trim,inside);det.qa(A,B,D,C,shade,inside);
      if(n===0)det.qa(A,C,CT,AT,shade,inside);if(n===steps-1)det.qa(B,D,DT,BT,shade,inside);
      const L0=shift(C,0,.15),L1=shift(D,0,.15);det.qa(C,D,L1,L0,shade,inside);
      if(n>0&&n<steps-1&&n%Math.max(1,Math.round(steps/4))===0){const x=B[0]+outward[0]*depth*.5,z=B[2]+outward[2]*depth*.5;det.box(x-.13,1,z-.13,x+.13,Math.max(1.12,B[1]),z+.13,stc)}
     }
    }else{
     // O tabuleiro de TODAS as pontes tem RW de largura (inclusive a ponte
     // de duas mãos da micro-ilha). lineType só muda o trânsito e as calçadas,
     // nunca a largura estrutural: os arcos já usam RW/2 neste mesmo trecho.
     const halfRoad=RW/2,mastBaseW=.72,mastBaseD=.92;
     const mastGap=halfRoad+mastBaseW*.5+.06,edgeCable=halfRoad-.12;
     const mastTop=1.12+H2+1.06-.35; // topo da travessa = crista máxima do arco
     if(vert){
      for(const sd of [-1,1]){
       const x=cx2+sd*mastGap;
       det.box(x-mastBaseW/2,deckY,cz2-mastBaseD/2,x+mastBaseW/2,mastTop,cz2+mastBaseD/2,stc);
       det.box(x-.75,deckY,cz2-.67,x+.75,deckY+.75,cz2+.67,shade);
      }
      det.box(cx2-mastGap-mastBaseW/2,mastTop-.45,cz2-.46,cx2+mastGap+mastBaseW/2,mastTop+.35,cz2+.46,trim);
     }else{
      for(const sd of [-1,1]){
       const z=cz2+sd*mastGap;
       det.box(cx2-mastBaseD/2,deckY,z-mastBaseW/2,cx2+mastBaseD/2,mastTop,z+mastBaseW/2,stc);
       det.box(cx2-.67,deckY,z-.75,cx2+.67,deckY+.75,z+.75,shade);
      }
      det.box(cx2-.46,mastTop-.45,cz2-mastGap-mastBaseW/2,cx2+.46,mastTop+.35,cz2+mastGap+mastBaseW/2,trim);
     }
     const pts=[],anchors=Math.max(4,Math.min(7,Math.round(span/8)+2));
     const pushCable=(a,b)=>{pts.push(a[0],a[1],a[2],b[0],b[1],b[2])};
     for(let m=0;m<anchors;m++){
      const u=anchors===1?.5:m/(anchors-1),along=-span*.45+span*.9*u;
      if(vert){
       const topL=[cx2-mastGap,mastTop-.35,cz2],topR=[cx2+mastGap,mastTop-.35,cz2],botL=[cx2-edgeCable,deckY+.12,cz2+along],botR=[cx2+edgeCable,deckY+.12,cz2+along];
       pushCable(topL,botL);pushCable(topR,botR);det.box(botL[0]-.08,deckY,botL[2]-.08,botL[0]+.08,deckY+.28,botL[2]+.08,trim);det.box(botR[0]-.08,deckY,botR[2]-.08,botR[0]+.08,deckY+.28,botR[2]+.08,trim);
      }else{
       const topL=[cx2,mastTop-.35,cz2-mastGap],topR=[cx2,mastTop-.35,cz2+mastGap],botL=[cx2+along,deckY+.12,cz2-edgeCable],botR=[cx2+along,deckY+.12,cz2+edgeCable];
       pushCable(topL,botL);pushCable(topR,botR);det.box(botL[0]-.08,deckY,botL[2]-.08,botL[0]+.08,deckY+.28,botL[2]+.08,trim);det.box(botR[0]-.08,deckY,botR[2]-.08,botR[0]+.08,deckY+.28,botR[2]+.08,trim);
      }
     }
     const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const ls=new THREE.LineSegments(g,city.M.cable);ls.frustumCulled=false;ch.group.add(ls);
    }
    if(night)glow.flat(cx2-6,cz2-6,cx2+6,cz2+6,.3,COL('#ffd9a0').multiplyScalar(.25));
   }
  }}
 curRi=-1;curI=null;
 const ringGeometry=[];
 for(const rp of city.ring){
  const [x0,z0,x1,z1,face,h]=rp;
  if(!own((x0+x1)/2,(z0+z1)/2))continue;
  const starts=isoBuilders.map(b=>b.p.length/3);
  const colStart=ch.cols.length,pedStart=ch.peds.length,childStart=ch.group.children.length,isoStart=ISOFADE.items.length;
  building(x0,z0,x1,z1,h,{simple:true,face,ring:true,exo:true});
  const ranges=isoBuilders.flatMap((builder,i)=>builder.p.length/3>starts[i]?[{builder,from:starts[i],to:builder.p.length/3}]:[]);
  ringGeometry.push({rp,ranges,col:ch.cols[colStart],actors:ch.peds.slice(pedStart),props:ch.group.children.slice(childStart),iso:ISOFADE.items[isoStart]});
 }
 /* --- v78 · MOBILIÁRIO URBANO nos quarteirões de prédios: ponto de ônibus (abrigo + banco + painel do atlas de anúncios),
    banca de jornal e caixa de correio. Sorteio próprio por quarteirão; só onde a calçada está livre (sem colisor/poste). --- */
 for(let ri=0;ri<city.rects.length;ri++){const r=city.rects[ri],info=city.info[ri];if(!info||info.kind!=='bld'||info.isle||city.haze)continue;if(!own((r[0]+r[2])/2,(r[1]+r[3])/2))continue;
  const fr=mulberry32((ri*2246822519+S.seed*3266489917)>>>0),pkF=()=>['n','s','w','e'][Math.floor(fr()*4)];
  // frame lateral: P(t,d) = ponto a t metros ao longo do lado e d metros da guia pra dentro; nx/nz aponta pra rua
  const side=f=>{const L=f==='n'||f==='s'?r[2]-r[0]:r[3]-r[1];return{L,P:(t,d)=>f==='n'?[r[0]+t,r[1]+d]:f==='s'?[r[2]-t,r[3]-d]:f==='w'?[r[0]+d,r[3]-t]:[r[2]-d,r[1]+t],n:f==='n'?[0,-1]:f==='s'?[0,1]:f==='w'?[-1,0]:[1,0],f}};
  const nrC=city.neonRoad&&city.neonRoad.ri===ri?city.neonRoad.cr:null; /* v78: boca da Neon Road não recebe abrigo/banca/caixa (corredor da rua + 2 m) */
  const free=(x0,z0,x1,z1)=>{if(nrC&&x1>nrC[0]-2&&x0<nrC[2]+2&&z1>nrC[1]-2&&z0<nrC[3]+2)return false;for(const c of query((x0+x1)/2,(z0+z1)/2,Math.max(x1-x0,z1-z0)+1))if(!c.dead&&c.x1>x0-.3&&c.x0<x1+.3&&c.z1>z0-.3&&c.z0<z1+.3)return false;return true};
  const BX=(S0,t0,t1,d0,d1,y0,y1,col,mb=det)=>{const a=S0.P(t0,d0),b=S0.P(t1,d1);mb.box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col)};
  const rect=(S0,t0,t1,d0,d1)=>{const a=S0.P(t0,d0),b=S0.P(t1,d1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]};
  // ponto de ônibus
  if(fr()<.5){const S0=side(pkF()),t=S0.L/2+(fr()-.5)*14,d0=2.25,d1=3.55,R0=rect(S0,t-1.9,t+1.9,d0-.2,d1+.1);
   if(free(...R0)){const glass=COL('#5f8a98'),frame=COL('#3a3e48'),roof=COL('#2a6ab0'),seat=COL('#8a6a52');
    BX(S0,t-1.8,t+1.8,d0-.15,d1+.05,2.45,2.6,roof);BX(S0,t-1.8,t+1.8,d1-.06,d1,.3,2.45,glass);BX(S0,t-1.8,t+1.8,d1-.1,d1,.26,.32,frame);
    for(const tt of[t-1.75,t+1.75])BX(S0,tt-.05,tt+.05,d1-.12,d1,.26,2.45,frame);for(const tt of[t-1.75,t+1.75])BX(S0,tt-.05,tt+.05,d0-.1,d0,.26,2.45,frame);
    BX(S0,t-1.2,t+1.2,d1-.6,d1-.12,.5,.58,seat);for(const tt of[t-1.1,t+1.1])BX(S0,tt-.04,tt+.04,d1-.5,d1-.2,.26,.5,frame);
    // painel lateral com anúncio do atlas (lado esquerdo do abrigo, virado para a calçada)
    {const tt=t-1.82,y0=.4,y1=2.3,tile=Math.floor(fr()*16);BX(S0,tt-.06,tt,d0,d1,.26,2.45,frame);
     // v78: uma peça de cada lado da moldura, cada uma montada pra quem olha daquele lado (esq.→dir., de baixo pra cima) — nenhuma lê espelhada
     const c0=S0.P(tt-.03,(d0+.05+d1-.1)/2),pu=S0.P(tt+.97,(d0+.05+d1-.1)/2),ux=pu[0]-c0[0],uz=pu[1]-c0[1],hw=(d1-.1-d0-.05)/2;
     for(const sg of[-1,1]){const nx=ux*sg,nz=uz*sg,rx=nz,rz=-nx,cx=c0[0]+nx*.05,cz=c0[1]+nz*.05;
      (ch.ads=ch.ads||[]).push({pts:[[cx-rx*hw,y0,cz-rz*hw],[cx+rx*hw,y0,cz+rz*hw],[cx+rx*hw,y1,cz+rz*hw],[cx-rx*hw,y1,cz-rz*hw]],tile})}}
    addCol(...rect(S0,t-1.85,t+1.85,d1-.12,d1),'rock')}}
  /* v78: banco de praça no pé dos prédios em ~40% dos quarteirões (gerador próprio: não muda a seed); de costas pro prédio, virado pra rua */
  {const br=mulberry32(((ri+1)*2246822519^(S.seed*40503+0x5be7c))>>>0);if(br()<.4){const S0=side(['n','s','w','e'][Math.floor(br()*4)]),t=8+br()*Math.max(0,S0.L-16),d0=2.75,d1=3.45,R0=rect(S0,t-1.15,t+1.15,d0-.15,d1+.1);
   if(S0.L>18&&free(...R0)){const wood=COL(night?'#4a3a5a':'#8a5a36'),metal=COL(night?'#2a2838':'#3a3a40');
    const db=d0+.44; /* v79r33: encosto colado no fundo do assento (antes ficava 20 cm atrás, solto) */BX(S0,t-.95,t+.95,d0,d0+.44,.62,.7,wood);BX(S0,t-.95,t+.95,db-.07,db,.7,1.15,wood);
    for(const du of[-.8,.8]){BX(S0,t+du-.05,t+du+.05,d0+.02,d0+.42,.2,.62,metal);BX(S0,t+du-.05,t+du+.05,db-.07,db,.62,1.12,metal)}
    const bc=addCol(...rect(S0,t-1,t+1,d0,db),'rock');bc.low=1.15}}}
  // banca de jornal numa esquina + caixa de correio
  if(fr()<.42){const S0=side(pkF()),t=4.8+fr()*2,d0=2.0,d1=3.6,R0=rect(S0,t-1.3,t+1.3,d0-.9,d1);
   if(free(...R0)){const kiosk=COL('#2a7a4a'),awn=COL('#e8c040'),mag=['#d8202a','#2a6ab0','#f2c21a','#ff6fae','#f4f4f0','#3ab36a'];
    BX(S0,t-1.2,t+1.2,d0,d1,.26,2.3,kiosk);BX(S0,t-1.35,t+1.35,d0-.9,d1+.1,2.3,2.42,awn);BX(S0,t-1.35,t+1.35,d0-.95,d0-.85,2.0,2.42,awn);
    for(let k=0;k<6;k++){const tt=t-1.05+k*.36;BX(S0,tt,tt+.3,d0-.06,d0,1.0,1.4,COL(mag[k]));BX(S0,tt,tt+.3,d0-.06,d0,1.5,1.9,COL(mag[(k+2)%6]))}
    BX(S0,t-1.2,t+1.2,d0-.35,d0,.26,.9,COL('#1e5a38'));for(let k=0;k<5;k++){const tt=t-1+k*.42;BX(S0,tt,tt+.34,d0-.34,d0-.04,.9,.93,COL(mag[(k+3)%6]))}
    addCol(...rect(S0,t-1.2,t+1.2,d0-.35,d1),'rock');{const kp=S0.P(t,d0-.85);(ch.kiosks=ch.kiosks||[]).push({x:kp[0],z:kp[1]})} // v78: ponto do cliente da banca (jornal $1)
    const m=S0.P(t+2.1,.9);if(free(m[0]-.4,m[1]-.4,m[0]+.4,m[1]+.4)){det.box(m[0]-.28,.26,m[1]-.22,m[0]+.28,1.1,m[1]+.22,COL('#2a5ab0'));det.geo(GEO.cyl,mtx(m[0],1.1,m[1],.28,.06,.22),COL('#2a5ab0'));det.box(m[0]-.2,.9,m[1]-.23,m[0]+.2,.95,m[1]+.23,COL('#f2c21a'));det.box(m[0]-.05,.26,m[1]-.05,m[0]+.05,.4,m[1]+.05,COL('#1a1a20'))}}}
 }
 /* --- r33 · LIXO NAS CALÇADAS dos quarteirões de prédios: pouco e espalhado, na faixa entre a linha dos pedestres (2 m da guia) e a fachada (SW=4).
    Mesmos objetos derrubáveis dos becos (geometria em bins + registerBin → knockBin). Sorteio próprio por quarteirão (não consome R()). Evita portas e qualquer colisor. --- */
 for(let ri=0;ri<city.rects.length;ri++){const r=city.rects[ri],info=city.info[ri];if(!info||info.kind!=='bld'||info.isle||city.haze)continue;if(!own((r[0]+r[2])/2,(r[1]+r[3])/2))continue;
  const lr=mulberry32((ri*1597334677+S.seed*2654435761+0x1177e)>>>0),lrr=(a,b)=>a+lr()*(b-a),doors=(city.doors&&city.doors.get(ri))||[];
  const nrC=city.neonRoad&&city.neonRoad.ri===ri?city.neonRoad.cr:null;
  /* pontos de lixo: 0–1 por lado do quarteirão, cada um com 2–3 itens juntos ao longo da calçada (saco, latão redondo, latão quadrado, caixa de papelão) */
  for(const f of ['n','s','w','e']){if(lr()<.5)continue;const L=f==='n'||f==='s'?r[2]-r[0]:r[3]-r[1],n=2+(lr()<.45?1:0),t0=lrr(6,L-6),d0=lrr(2.85,3.3),gap=lrr(.75,.95);
   const at=(t,d)=>f==='n'?[r[0]+t,r[1]+d]:f==='s'?[r[2]-t,r[3]-d]:f==='w'?[r[0]+d,r[3]-t]:[r[2]-d,r[1]+t];
   const c0=at(t0,d0);if(doors.some(q=>Math.hypot(q.x-c0[0],q.z-c0[1])<3.6))continue;if(nrC&&c0[0]>nrC[0]-3&&c0[0]<nrC[2]+3&&c0[1]>nrC[1]-3&&c0[1]<nrC[3]+3)continue;
   let hit=false;for(const c of query(c0[0],c0[1],3))if(!c.dead&&c.x1>c0[0]-1.9&&c.x0<c0[0]+1.9&&c.z1>c0[1]-1.9&&c.z0<c0[1]+1.9){hit=true;break}if(hit)continue;
   for(let k=0;k<n;k++){const P=at(t0+(k-(n-1)/2)*gap,d0+lrr(-.15,.15)),px=P[0],pz=P[1],kind=lr(),v0=bins.p.length/3;let col;
    if(kind<.32){col=COL(['#1c1c1e','#262629','#343337','#2a3a2a'][Math.floor(lr()*4)]);const sz=lrr(.26,.4);bins.geo(GEO.ico,mtx(px,.2+sz*.48,pz,sz,sz*.95,sz,lr()*3,lr()*3,0),col);if(lr()<.4){const s2=sz*.75;bins.geo(GEO.ico,mtx(px+lrr(-.2,.2),.2+sz*.9+s2*.3,pz+lrr(-.2,.2),s2,s2*.9,s2,lr()*3,lr()*3,0),col.clone().multiplyScalar(1.15))}}
    else if(kind<.56){col=COL(['#2f5a3a','#3a3a40','#2a4a7a','#6a6a6a'][Math.floor(lr()*4)]);bins.geo(GEO.cyl,mtx(px,.65,pz,.3,.9,.3),col);bins.geo(GEO.cyl,mtx(px,1.13,pz,.33,.07,.33),col.clone().multiplyScalar(.75))}
    else if(kind<.76){col=COL(['#2f5a3a','#3a4a5a','#5a4a2a'][Math.floor(lr()*3)]);bins.box(px-.36,.2,pz-.36,px+.36,.95,pz+.36,col);bins.box(px-.39,.95,pz-.39,px+.39,1.03,pz+.39,col.clone().multiplyScalar(.7))}
    else{col=COL(['#b08a5a','#c49a64','#9a7448'][Math.floor(lr()*3)]);const sq=lrr(.26,.38),hh=lrr(.26,.5);bins.box(px-sq,.2,pz-sq,px+sq,.2+hh,pz+sq,col);if(lr()<.45){const s2=sq*.8;bins.box(px-s2,.2+hh,pz-s2,px+s2,.2+hh+s2*1.1,pz+s2,col.clone().multiplyScalar(.9))}}
    registerBin(px,pz,v0,col)}}}
 /* --- helipontos: delegacia, hospital e arranha-céu (no estacionamento/pátio livre do quarteirão) --- */
 for(const L of city.lms||[]){if(L.name!=='pol'&&L.name!=='hosp'&&L.name!=='sky')continue;const r=city.rects[L.ri];if(!own((r[0]+r[2])/2,(r[1]+r[3])/2))continue;
  const hit=(x0,z0,x1,z1)=>{const m=SW+.8;if(x0<r[0]+m||z0<r[1]+m||x1>r[2]-m||z1>r[3]-m)return true;for(const c of query((x0+x1)/2,(z0+z1)/2,Math.max(x1-x0,z1-z0)))if(!c.dead&&c.kind!=='pole'&&c.x1>x0&&c.x0<x1&&c.z1>z0&&c.z0<z1)return true;for(const t of ch.trees||[])if(t.x>x0-1.2&&t.x<x1+1.2&&t.z>z0-1.2&&t.z<z1+1.2)return true;for(const l of ch.lamps||[])if(l.x>x0-1&&l.x<x1+1&&l.z>z0-1&&l.z<z1+1)return true;for(const v of ch.cars)if(v.ambulance&&v.x>x0-3&&v.x<x1+3&&v.z>z0-3&&v.z<z1+3)return true;if(strictLots)for(const l of city.parkingLots)if(l.ri===L.ri&&l.x1>x0-.5&&l.x0<x1+.5&&l.z1>z0-.5&&l.z0<z1+.5)return true;return false}; // v77: 1ª tentativa fora das vagas pintadas
  let best=null,strictLots=true;for(const pass of [0,1]){if(best)break;strictLots=pass===0;for(const H of [7,6,5.5])if(!best){for(let x=r[0]+H+SW+1;x<=r[2]-H-SW-1;x+=1.5)for(let z=r[1]+H+SW+1;z<=r[3]-H-SW-1;z+=1.5){if(hit(x-H,z-H,x+H,z+H))continue;const e=Math.min(x-r[0],r[2]-x,z-r[1],r[3]-z);if(!best||e<best.e)best={x,z,H,e}}}}
  if(!best)continue;const{x,z,H}=best;
  // v77: se o heliponto ficou sobre um estacionamento, as vagas debaixo dele deixam de existir (nenhum carro nasce no H)
  {const keep=sl=>!(Number.isFinite(sl.x)&&Math.abs(sl.x-x)<H+1.5&&Math.abs(sl.z-z)<H+1.5);for(const l of city.parkingLots)if(l.slots&&l.slots.length)l.slots=l.slots.filter(keep);city.empParkingSlots=city.empParkingSlots.filter(keep)}(city.heliRects||(city.heliRects=[])).push([x-H-1,z-H-1,x+H+1,z+H+1]);
  for(const v of ch.cars.slice())if(Math.abs(v.x-x)<H+2.4&&Math.abs(v.z-z)<H+2.4){ch.cars.splice(ch.cars.indexOf(v),1);removeVehicle(v)}
  side.box(x-H,0,z-H,x+H,.08,z+H,COL(night?'#2c2a36':'#46484e'),{});const yl=COL('#f2c21a'),wh=COL('#f4f4f0');
  marks.flat(x-H+.4,z-H+.4,x+H-.4,z-H+.7,.086,yl);marks.flat(x-H+.4,z+H-.7,x+H-.4,z+H-.4,.086,yl);marks.flat(x-H+.4,z-H+.4,x-H+.7,z+H-.4,.086,yl);marks.flat(x+H-.7,z-H+.4,x+H-.4,z+H-.4,.086,yl);
  marks.flat(x-2.2,z-2.6,x-1.4,z+2.6,.086,wh);marks.flat(x+1.4,z-2.6,x+2.2,z+2.6,.086,wh);marks.flat(x-1.4,z-.4,x+1.4,z+.4,.086,wh);
  heliAddPad(x,z,Math.abs(x-(r[0]+r[2])/2)>Math.abs(z-(r[1]+r[3])/2)?Math.PI/2:0,'heli'+L.ri,L.name==='pol',.08-.09); // pad.y + .09 = topo do heliponto (.08)
  // arranha-céu: o pátio vazio ao lado do heliponto vira estacionamento
  if(L.name==='sky')for(const s of [[x+H+.6,z-H,x+H+12.6,z+H],[x-H-12.6,z-H,x-H-.6,z+H],[x-H,z+H+.6,x+H,z+H+12.6],[x-H,z-H-12.6,x+H,z-H-.6]]){if(!hit(...s)){curRi=L.ri;parking(s[0],s[1],s[2],s[3],'skp'+L.ri);curRi=-1;break}}}
 // v288: small parking bays in available perimeter strips, never across a building.
 for(const p of pendingParkingSidewalk){const f=city.info[p.ri];if(f.kind!=='lm'&&!f.casino&&!f.club)continue;if(f.lm==='gas')continue;
  const r=city.rects[p.ri],x0=r[0]+SW+1,z0=r[1]+SW+1,x1=r[2]-SW-1,z1=r[3]-SW-1,seen=[];
  const candidates=[];for(let z=z0;z+9<z1;z+=11){candidates.push([x0,z,x0+8,z+9],[x1-8,z,x1,z+9]);}for(let x=x0+9;x+9<x1-8;x+=11)candidates.push([x,z1-8,x+9,z1]);
  let count=0;for(const q of candidates){if(count>=4)break;const [a,b,c,d]=q;
   if(f.lm==='bank'&&city.bankDoor&&Math.hypot((a+c)/2-city.bankDoor.x,(b+d)/2-city.bankDoor.z)<18)continue;
   if(f.club&&a>x1-26&&b<z0+26)continue;
   if(query((a+c)/2,(b+d)/2,12).some(o=>!o.dead&&o.x1>a-.8&&o.x0<c+.8&&o.z1>b-.8&&o.z0<d+.8))continue;
   if(ch.trees.some(t=>t.x>a-2&&t.x<c+2&&t.z>b-2&&t.z<d+2)||ch.cars.some(v=>v.x>a-3&&v.x<c+3&&v.z>b-3&&v.z<d+3))continue;
   if(city.parkingLots.some(l=>l.ri===p.ri&&l.slots.length&&l.x1>a&&l.x0<c&&l.z1>b&&l.z0<d))continue;
   if((city.heliRects||[]).some(h=>h[2]>a&&h[0]<c&&h[3]>b&&h[1]<d))continue; // v77: vagas novas fora do heliponto
   curRi=p.ri;parking(...q,'special:'+p.ri+':'+count);city.parkingLots[city.parkingLots.length-1].nextVisit=Infinity;count++;
  }curRi=-1;
 }
 if(city.isle&&!city.delSlot){const ri=city.info.findIndex(f=>f.isle),r=city.rects[ri];if(r&&own((r[0]+r[2])/2,(r[1]+r[3])/2)){
  // v77: garagem de reserva sempre com a abertura virada para um pátio livre (≥7 m) que leva à rua.
  const busy=(a0,b0,a1,b1)=>query((a0+a1)/2,(b0+b1)/2,Math.max(a1-a0,b1-b0)).some(c=>!c.dead&&c.x1>a0&&c.x0<a1&&c.z1>b0&&c.z0<b1);
  const ix0=r[0]+SW+.6,iz0=r[1]+SW+.6,ix1=r[2]-SW-.6,iz1=r[3]-SW-.6,cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2;let best=null;
  for(let x=ix0;x<ix1;x+=1)for(let z=iz0;z<iz1;z+=1)for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const ns=dx===0,W=6,D=8,AP=7.5;let g,ap;
   if(ns){g=[x,z,x+W,z+D];ap=dz>0?[x,z+D,x+W,z+D+AP]:[x,z-AP,x+W,z]}else{g=[x,z,x+D,z+W];ap=dx>0?[x+D,z,x+D+AP,z+W]:[x-AP,z,x,z+W]}
   if(g[0]<ix0||g[2]>ix1||g[1]<iz0||g[3]>iz1)continue;
   const apIn=[Math.max(ap[0],ix0),Math.max(ap[1],iz0),Math.min(ap[2],ix1),Math.min(ap[3],iz1)],apOut=(ap[2]-ap[0])*(ap[3]-ap[1])-(Math.max(0,apIn[2]-apIn[0])*Math.max(0,apIn[3]-apIn[1]));
   if(busy(g[0]-.3,g[1]-.3,g[2]+.3,g[3]+.3)||(apIn[2]>apIn[0]&&apIn[3]>apIn[1]&&busy(apIn[0],apIn[1],apIn[2],apIn[3])))continue;
   // prefere abrir para a borda do quarteirão (rua) e ficar junto a ela
   const fx=(g[0]+g[2])/2+dx*6,fz=(g[1]+g[3])/2+dz*6,edge=Math.min(fx-r[0],r[2]-fx,fz-r[1],r[3]-fz),score=edge-apOut*.02;
   if(!best||score<best.score)best={g,dx,dz,score}}
  if(best){const {g,dx,dz}=best,c=COL('#777c86'),tr=COL('#5a5e66'),[x0,z0,x1,z1]=g,t=.2,H=3;
   const wall=(a0,b0,a1,b1)=>{det.box(a0,0,b0,a1,H,b1,c);addCol(a0,b0,a1,b1,'bld')};
   if(dz!==0){wall(x0,z0,x0+t,z1);wall(x1-t,z0,x1,z1);if(dz>0)wall(x0,z0,x1,z0+t);else wall(x0,z1-t,x1,z1)}
   else{wall(x0,z0,x1,z0+t);wall(x0,z1-t,x1,z1);if(dx>0)wall(x0,z0,x0+t,z1);else wall(x1-t,z0,x1,z1)}
   det.box(x0,H,z0,x1,H+.2,z1,c);
   // batente da porta + faixa amarela na soleira, para a abertura ficar óbvia
   const ox=dx>0?x1:dx<0?x0:null,oz=dz>0?z1:dz<0?z0:null;
   if(oz!==null){det.box(x0,H-.35,oz-.12,x1,H,oz+.12,tr);marks.box(x0+.3,.012,oz-.25,x1-.3,.02,oz-.05,COL('#ffd21a'))}
   else{det.box(ox-.12,H-.35,z0,ox+.12,H,z1,tr);marks.box(ox-.25,.012,z0+.3,ox-.05,.02,z1-.3,COL('#ffd21a'))}
   const mx=(x0+x1)/2,mz=(z0+z1)/2;city.delSlot={x:mx-dx*.6,z:mz-dz*.6,a:Math.atan2(dz,dx)}}
 }}
 for(const p of pendingParkingSidewalk)finishParkingSidewalk(p.bx0,p.bz0,p.bx1,p.bz1,p.ri,p.col);
 /* --- assemble --- */
 const ringBatches=new Map();
 const reflOK=new Set([walls,abWalls,roofs,roofs2,neon,hwin,hwinS,glow]);const add=(mb,mat,cast,recv,ro)=>{const m=mb.mesh(mat,cast,recv);if(m){if(mat&&mat.userData.cityAge)ageTopAttr(m.geometry);isoAttach(m,mb);if(mb===det||mb===marks||mb===roadGround||mb===side)bridgeVisualMaterial(mat);ch.group.add(m);if(ro)m.renderOrder=ro;if(!reflOK.has(mb))m.layers.set(1);if(ringGeometry.length&&isoBuilders.includes(mb))ringBatches.set(mb,m)}return m};
 ch.binMesh=add(bins,M.solid,true,true);ch.tlpMesh=add(tlp,M.signal,true,true);if(ch.tlpMesh){const a=new Float32Array(tlp.p.length/3*4);for(const t of ch.tls)for(let v=t.vh;v<t.v1;v++)a.set([t.hx,t.hz,5.39,1],v*4);ch.tlpMesh.geometry.setAttribute('windPivot',new THREE.BufferAttribute(a,4))}
 const clothMesh=add(clothes,M.cloth,false,true);if(clothMesh)clothMesh.geometry.setAttribute('clothPin',new THREE.Float32BufferAttribute(clothPins,3));
 // Point Haze castle is structural geometry, independent of shared detail shaders/LOD.
 if(hazeCastle.p.length){const mat=M.castle||M.solid; /* v3 r60: M.castle = M.solid + reboco do SURF */const mesh=add(hazeCastle,mat,true,true); /* v78: material comum dos detalhes (o Standard próprio deixava o castelo quase preto) */ch.group.add(mesh);ch.hazeCastleMesh=mesh;}
 ch.actorWallMesh=add(walls,M.wall,true,true);ch.actorAbWallMesh=add(abWalls,M.abWall,true,true);prepareSurfaceMesh(add(roofs,M.surface,false,true),'flatRoof',st);ch.detMesh=add(det,M.solid,true,true);ch.roofDetMesh=add(roofD,M.solid,false,true); /* v78: objetos de telhado SEM sombra (fora dos grupos de sombra) */ch.lodNearMesh=add(lodNear,M.solid,true,true);ch.lodMidMesh=add(lodMid,M.solid,true,true);ch.lodFarWindowMesh=add(lodFarWindow,M.solid,false,true);if(ch.lodFarWindowMesh)ch.lodFarWindowMesh.visible=false;prepareSurfaceMesh(add(side,M.surface,false,true),'ground',st);ch.actorRoofMesh=prepareSurfaceMesh(add(roofs2,M.surface2,true,true),'roof',st);add(hwin,M.hwin,false,false);add(hwinS,M.hwinSoft||M.hwin,false,false);
 const towelMat=new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-8,polygonOffsetUnits:-8});city.mats.push(towelMat);add(towelMb,towelMat,false,true,4);
 add(bedMb,M.bed,false,true);add(wat,M.water,false,true,1);add(waveMb,M.wave,false,false,2);add(sandMb,M.sand,false,true,1);add(foamMb,M.foam,false,false,3);add(signs,M.sign,false,false,4);ch.fenceMesh=add(fence,M.fence,false,false);ch.roadGroundMesh=add(roadGround,M.mark,false,true);ch.markMesh=add(marks,M.mark,false,true);ch.plantMesh=add(plants,M.plant,true,true);
 // NÃO ALTERAR: malha da floresta não projeta NEM recebe sombras reais;
 // a copa original fica visível e segue o LOD. Fora da lista de castShadow.
 ch.forestTreeMesh=add(forestPlants,M.plant,false,false);
 prepareSurfaceMesh(add(forestFloor,M.surface,false,false),'ground',st);
 ch.neonMesh=add(neon,M.neon,false,false);if(ch.ads&&ch.ads.length&&!city.haze){ch.adMesh=adsMesh(ch.ads);if(ch.adMesh)ch.group.add(ch.adMesh)}if(ch.graf&&ch.graf.length){ch.grafMesh=grafMesh(ch.graf);if(ch.grafMesh)ch.group.add(ch.grafMesh)}ch.neonDNMesh=add(neonDN,M.neonDN,false,false);ch.glowMesh=st.noLamps?null:add(glow,M.glow,false,false,2);
 // v264: registrar a geometria estrutural de oclusao dos atores NA GERACAO.
 // O SHADOW DISTANCE (v259) altera castShadow dinamicamente; se o raycaster
 // montar o cache DEPOIS dessa alteracao, paredes de prédios largos e em L
 // podem sumir definitivamente do teste de sombra do sprite.
 // Este cache nao muda castShadow, visibilidade, materiais nem shaders.
 // Inclui paredes/ligacoes em L, telhados volumetricos e vegetacao, exclui
 // ornamentos pequenos do teste de raios para manter o custo previsivel.
 ACTOR_CASTERS.set(ch,[ch.hazeCastleMesh,ch.actorWallMesh,ch.actorAbWallMesh,ch.actorRoofMesh,ch.plantMesh]
  .filter(o=>o&&o.isMesh&&o.geometry?.attributes?.position));
 ch.ringGeometry=ringGeometry;
 for(const entry of ringGeometry)for(const range of entry.ranges){
  range.mesh=ringBatches.get(range.builder);
  delete range.builder;
 }
 buildChunkLamps(ch);buildCables(ch);try{buildStuckToys(ch)}catch(e){console.error(e)}
 if(ch.tls.length){ch.tlIMs=[];[5.0,4.65,4.3].forEach((y,j)=>{const im=new THREE.InstancedMesh(M.tlGeo,M.tl,ch.tls.length);ch.tls.forEach((l,i)=>{im.setMatrixAt(i,mtx(l.hx,y,l.hz,.85,.85,.85,0,Math.atan2(-D[l.d][0],-D[l.d][1]),0));im.setColorAt(i,tlLens(j,sig(l.kx,l.kz,l.d),false))});im.frustumCulled=false;ch.group.add(im);ch.tlIMs.push(im)});ch.tlIM=ch.tlIMs[0]}
 // v78: caixa do chunk em coordenadas de MUNDO (antes ignorava position/rotation das malhas: toda malha posicionada
 // por .position puxava a caixa até a origem (0,0) → 35 de 49 chunks com caixa de centenas de metros, nunca
 // cortados por distância e sempre no LOD "perto" em cullChunks/chunkLod e no passe de reflexo).
 {const bb=new THREE.Box3(),tb=new THREE.Box3();ch.group.updateMatrixWorld(true);ch.group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.geometry){o.geometry.computeBoundingBox();tb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   // matriz inválida (ex.: rodas ocultas das carcaças com rotação NaN) envenenaria a caixa inteira → chunk nunca visível
   if([tb.min.x,tb.min.y,tb.min.z,tb.max.x,tb.max.y,tb.max.z].every(Number.isFinite))bb.union(tb)}});
  if(!bb.isEmpty()){ch.x0=Math.min(ch.x0,bb.min.x);ch.z0=Math.min(ch.z0,bb.min.z);ch.x1=Math.max(ch.x1,bb.max.x);ch.z1=Math.max(ch.z1,bb.max.z);ch.y1=bb.max.y}}
 paintChunkMap(ch);
 city.group.add(ch.group);
 {const dyn=new Set();for(const t of ch.tls)if(t.signGroup)t.signGroup.traverse(x=>dyn.add(x));for(const g of ch.industryGates||[])if(g.pivot)g.pivot.traverse(x=>dyn.add(x));
  ch.group.updateMatrixWorld(true);ch.group.traverse(o=>{if(!dyn.has(o))o.matrixAutoUpdate=false});skipHiddenMatrixWorld(ch.group)}
 curChunk=null;R=Rsave;
}
