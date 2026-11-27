'use strict';
/* Coastal Chaos · js/08-shopping.js — Shopping center (fachada, interior, lojas).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= shopping center (fachada nova + interior de 2 andares + loja de roupas) ================= */
const MALL={door:null,out:null,nrm:null,grp:null,G:null,U:null,lvl:0,lock:0,peds:[],arrow:null,arrIn:null,tex:{},HX:40,HZ:12,CZ:6,CZG:6,CZU:10,VZ:4,SK:3,SX0:-32,SP:18,VX0:-28,VX1:28,EX0:18,EX1:28,FX:-12};
const MALL_SHOPS=[['MODA PIXEL','#ff4fa0','wear'],['CONVENIÊNCIA','#2ad67a','food'],['GAMES','#7a4ad6'],['SAPATOS','#d8402a','shoes'],['BRINQUEDOS','#ff8a1a'],['CAFÉ','#7a4a2a','cafe'],['ÓTICA','#2ac8c8','optic'],['JOIAS','#e8b830','jewel'],
 ['ELETRÔNICOS','#2a8ad6','tech'],['MALAS & MOCHILAS CO.','#c8762a','bag'],['MÚSICA · DISCOS','#a02ad6','music'],['MODA PRAIA','#1e9ab0','beach'],['PERFUMES','#e86ac8'],['PIZZA','#e8282a'],['FARMÁCIA','#2a9a5a','pharm'],['CINEMA','#1a1a2a'],['SKATE SHOP','#2ad6c8','skate']];
function mallSignMat(txt,bg,fg,w,h){txt=translatePlain(txt);const key=(S.lang||'br')+'|'+txt+bg+fg;if(MALL.tex[key])return MALL.tex[key];const W=w||256,H=h||48,c=cv(W,H),g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle=fg;let fs=Math.floor(H*.55);g.font=`700 ${fs}px Silkscreen,monospace`;while(g.measureText(txt).width>W-12&&fs>8){fs--;g.font=`700 ${fs}px Silkscreen,monospace`}g.textAlign='center';g.textBaseline='middle';g.fillText(txt,W/2,H/2+1);
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return MALL.tex[key]=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide})}
// Identidade municipal: placas compactas, com quebra de linha sem aumentar a fachada.
// ar = largura/altura da placa: a textura é gerada nessa proporção para o texto não sair esticado.
function sunsetSignMat(lines,bg='#142436',fg='#f5f2e9',ar=4){
 const CW=Math.round(clamp(128*ar,256,4096)),key='SUNSET:'+lines.join('|')+bg+fg+CW;
 if(MALL.tex[key])return MALL.tex[key];
 const c=cv(CW,128),g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,CW,128);
 g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
 const n=lines.length,band=128/n;
 for(let i=0;i<n;i++){let fs=n===1?72:46;do{g.font=`700 ${fs}px Silkscreen,monospace`;if(g.measureText(lines[i]).width<=CW-28||fs<=13)break;fs--}while(true);
  g.fillText(lines[i],CW/2,band*(i+.5)+1)}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
 return MALL.tex[key]=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide});
}
function sunsetFacade(ch,F,u,v,y,w,h,lines,bg,fg){
 const p=F.p3(u,y,v),n=F.nrm;
 return signPlane(ch.group,sunsetSignMat(lines,bg,fg,w/h),p[0]+n[0]*.15,p[1],p[2]+n[1]*.15,w,h,Math.atan2(n[0],n[1]));
}
/* relogios digitais nas fachadas, sincronizados ao horario do jogo. */
const CITY_CLOCKS={canvas:null,ctx:null,texture:null,material:null,last:''};
function cityClockMaterial(){
 if(CITY_CLOCKS.material)return CITY_CLOCKS.material;
 const c=cv(256,128),g=c.getContext('2d'),t=new THREE.CanvasTexture(c);
 t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;
 CITY_CLOCKS.canvas=c;CITY_CLOCKS.ctx=g;CITY_CLOCKS.texture=t;
 CITY_CLOCKS.material=new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,transparent:false});
 CITY_CLOCKS.material.userData.cached=true;
 updateCityClock(true);return CITY_CLOCKS.material;
}
function updateCityClock(force=false){
 if(!CITY_CLOCKS.ctx)return;
 const off=S.style==='inverted',h=Math.floor(DN.tod/60)%24,m=Math.floor(DN.tod%60);
 const label=off?'OFF':String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
 if(!force&&label===CITY_CLOCKS.last)return;
 CITY_CLOCKS.last=label;const g=CITY_CLOCKS.ctx;
 g.fillStyle='#050507';g.fillRect(0,0,256,128);
 g.strokeStyle=off?'#24221e':'#4c4325';g.lineWidth=5;g.strokeRect(5,5,246,118);
 if(!off){g.fillStyle='#f3d66a';g.textAlign='center';g.textBaseline='middle';
  g.font='bold 61px Silkscreen,monospace';g.fillText(label,128,67)}
 CITY_CLOCKS.texture.needsUpdate=true;
}
function maybeBuildingClock(ch,x0,z0,x1,z1,h,face){
 if(!face||h<13)return;
 const ix=Math.floor((x0+x1)*.5),iz=Math.floor((z0+z1)*.5);
 let v=(Math.imul(ix,73856093)^Math.imul(iz,19349663)^Math.imul(S.seed|0,83492791))>>>0;
 v=Math.imul(v^(v>>>16),2246822519)>>>0;v=Math.imul(v^(v>>>13),3266489917)>>>0;v^=v>>>16;
 // Aproximadamente 3-4 fachadas numa cidade normal, com distribuicao fixa por seed.
 if((v>>>0)/4294967296>=.013)return;
 const w=6.7,ht=3.35,mid=(face==='n'||face==='s')?(x0+x1)/2:(z0+z1)/2;
 const y=Math.min(h-2.5,Math.max(9,h*.76));
 const nx=face==='e'?1:face==='w'?-1:0,nz=face==='s'?1:face==='n'?-1:0;
 const x=nx? (nx>0?x1+.14:x0-.14):mid,z=nz?(nz>0?z1+.14:z0-.14):mid;
 signPlane(ch.group,cityClockMaterial(),x,y,z,w,ht,Math.atan2(nx,nz));
}
function unlitSignMat(mat){if(!mat||!mat.isMeshBasicMaterial)return mat;if(!mat.userData._invMat){const m=new THREE.MeshLambertMaterial({map:mat.map||null,color:mat.color?mat.color.clone().multiplyScalar(.78):0xb8bcc2,vertexColors:!!mat.vertexColors,transparent:!!mat.transparent,opacity:mat.opacity??1,alphaTest:mat.alphaTest||0,side:mat.side,depthWrite:mat.depthWrite,depthTest:mat.depthTest,polygonOffset:mat.polygonOffset,polygonOffsetFactor:mat.polygonOffsetFactor,polygonOffsetUnits:mat.polygonOffsetUnits});if(mat.userData.cached)m.userData.cached=true;mat.userData._invMat=m}if(mat.map&&mat.userData._invMat.map!==mat.map){mat.userData._invMat.map=mat.map;mat.userData._invMat.needsUpdate=true}return mat.userData._invMat}
function signPlane(grp,mat,x,y,z,w,h,ry){const useMat=(S.style==='inverted'&&curChunk&&grp===curChunk.group)?unlitSignMat(mat):mat;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),useMat);m.position.set(x,y,z);m.rotation.y=ry;grp.add(m);return m}
/* --- fachada --- */
function mallBuild(K){const{F,W,D,night,det,walls,hwin,neon,glow,doorAt,ch,dressWall,dressPal}=K;const roofD=K.roofD||det,neonDN=K.neonDN||neon;const C=h=>COL(h);
 const body=C(night?'#e8b4c8':'#e4e0d8'),body2=C(night?'#46c0b8':'#c8c2b8'),acc=C(night?'#ff2238':'#d8402a'),acc2=C(night?'#ff2238':'#2a6ab0'),glass=C(night?'#596575':'#658692'),dark=C('#2a2a32'),H=13,v0=10,v1=D-2;
 F.box(10,W-10,v0,v1,.26,H,body,det,true);F.box(2,10,v0-2,v1,.26,H+2.5,body2,det,true);F.box(W-10,W-2,v0-2,v1,.26,H+2.5,body2,det,true);
 F.box(1.8,10.2,v0-2.2,v0-1.8,H+1.6,H+2.7,acc2,det);F.box(W-10.2,W-1.8,v0-2.2,v0-1.8,H+1.6,H+2.7,acc,det);
 /* v78 · SHOPPING: telhado com claraboias em faixa, condensadoras, mureta; equipamentos nas torres laterais (roofD = sem sombra) */
 {const grav=C(night?'#3a3446':'#8e8a80'),metal=C(night?'#5a5e6a':'#a8acb4'),dmetal=C(night?'#2e3038':'#5a5e66'),sky=C(night?'#ffe8c0':'#a8d0e0');
  roofD.box(...(()=>{const a=F.pt(10,v0),b=F.pt(W-10,v1);return[Math.min(a[0],b[0]),H+.01,Math.min(a[1],b[1]),Math.max(a[0],b[0]),H+.06,Math.max(a[1],b[1])]})(),grav);
  F.box(10,W-10,v0,v0+.25,H,H+.9,body,roofD);F.box(10,W-10,v1-.25,v1,H,H+.9,body,roofD);
  // claraboias: 3 faixas em pirâmide baixa sobre o corredor central
  for(let k=0;k<3;k++){const vv=v0+4+k*((v1-v0-8)/2);F.box(W/2-12,W/2+12,vv-1.4,vv+1.4,H,H+.5,dmetal,roofD);F.box(W/2-11.7,W/2+11.7,vv-1.1,vv+1.1,H+.5,H+1.1,sky,roofD);for(let u=W/2-11;u<=W/2+11;u+=2.75)F.box(u-.06,u+.06,vv-1.15,vv+1.15,H+.5,H+1.15,dmetal,roofD)}
  // condensadoras em grupo
  for(const[uc,vc] of[[16,v1-6],[W-16,v1-6],[16,v0+6],[W-16,v0+6]])for(let i=0;i<2;i++)for(let j=0;j<2;j++){const u=uc+i*2-1.6,v=vc+j*1.7-.8;F.box(u,u+1.6,v,v+1.3,H,H+1.1,metal,roofD);const c=F.p3(u+.8,H+1.12,v+.65);roofD.geo(GEO.cyl,mtx(c[0],c[1],c[2],.5,.04,.5),dmetal)}
  // torres laterais: caixa d'água, antena e casa de máquinas
  for(const[a,b] of[[2,10],[W-10,W-2]]){const um=(a+b)/2,y=H+2.5;F.box(um-1.6,um+1.6,v1-5,v1-2,y,y+2.2,body2,roofD);const p=F.pt(um,v0+3);roofD.geo(GEO.cyl,mtx(p[0],y+1.4,p[1],1,2.2,1),C(night?'#5a6a7a':'#8aa0b0'));const q=F.pt(um,(v0+v1)/2);roofD.box(q[0]-.05,y,q[1]-.05,q[0]+.05,y+5,q[1]+.05,dmetal);neon.box(q[0]-.12,y+5,q[1]-.12,q[0]+.12,y+5.25,q[1]+.12,C('#ff2a1a'))}}
 // vidro térreo e janelas do 1º andar
 for(const[a,b] of [[10.3,W/2-7.3],[W/2+7.3,W-10.3]]){F.box(a,b,v0-.12,v0,.6,4.6,glass,det);F.box(a,b,v0-.12,v0,7.4,11.4,glass,det);for(let u=a;u<=b+.01;u+=3.4){const uu=Math.min(u,b-.3);F.box(uu,uu+.3,v0-.35,v0,.26,H,body2,det)}}
 F.box(10,W-10,v0-.45,v0,6.2,6.9,acc,night?neon:det);F.box(10,W-10,v0-.3,v0,H-.5,H,body2,det);
 for(const[a,b] of [[2,10],[W-10,W-2]]){F.box(a+.6,b-.6,v0-2.12,v0-2,1,5,glass,det);F.box(a+.6,b-.6,v0-2.12,v0-2,7.4,H-1,glass,det)}
 // pórtico central de vidro
 const pu0=W/2-7,pu1=W/2+7,pv=5;F.box(pu0,pu1,pv,v0,.26,H+4,body,walls,true);F.box(pu0+.8,pu1-.8,pv-.12,pv,.26,H+1.2,glass,det);
 for(let u=pu0+.8;u<=pu1-.8+.01;u+=2.48)F.box(u-.09,u+.09,pv-.2,pv,.26,H+1.2,dark,det);for(const y of [4.6,8.6,H+1.2])F.box(pu0+.8,pu1-.8,pv-.2,pv,y-.09,y+.09,dark,det);
 F.box(pu0-.3,pu1+.3,pv-.3,v0,H+4,H+4.5,body2,det);F.box(pu0-.3,pu0+.5,pv-.3,pv+.5,.26,H+4,body2,det);F.box(pu1-.5,pu1+.3,pv-.3,pv+.5,.26,H+4,body2,det);
 // marquise da entrada
 F.box(W/2-9,W/2+9,1.4,pv,4.4,4.85,body2,det);for(const u of [W/2-8.4,W/2+8.4]){const p=F.pt(u,1.9);det.geo(GEO.cyl16,mtx(p[0],2.33,p[1],.22,4.15,.22),dark)}
 if(night){F.box(W/2-9.1,W/2+9.1,1.3,1.42,4.4,4.52,acc2,neon);for(const[a,b] of [[pu0-.35,pu0-.25],[pu1+.25,pu1+.35]])F.box(a,b,pv-.35,pv-.25,.3,H+4.4,acc,neon);F.box(pu0-.35,pu1+.35,pv-.35,pv-.25,H+4.35,H+4.45,acc,neon);glow.flat(...(()=>{const a=F.pt(W/2-12,-2),b=F.pt(W/2+12,7);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]})(),.3,COL('#ff8ad8').multiplyScalar(.3))}
 // Layered facade: recessed spandrels, fins, display panels and entrance hardware.
 const stone=C('#9f9996'),metal=C('#515461'),warm=C('#c2ab86');
 for(const [a,b,v] of [[2,10,v0-2],[W-10,W-2,v0-2],[10.3,W/2-7.3,v0],[W/2+7.3,W-10.3,v0]]){
  if(b<=a)continue;
  F.box(a+.3,b-.3,v-.25,v-.13,5.25,7.1,metal,det); // v77: fachada mais limpa — saíram as aletas a cada 1,5 m e as 2 fileiras de painéis
 }
 for(const y of [4.95,9.0]){F.box(pu0+.8,pu1-.8,pv-.18,pv-.13,y,y+.48,metal,det)}
 F.box(W/2-.06,W/2+.06,pv-.27,pv-.13,.3,4.4,metal,det);
 for(const u of [W/2-.45,W/2+.45])F.box(u-.04,u+.04,pv-.38,pv-.26,1.15,2.1,stone,det);
 F.box(W/2-8.7,W/2+8.7,1.38,1.43,4.6,4.72,C('#70aeb5'),neon);
  // v77: laterais (alas de H+2,5) e fundos vestidos: pilastras, janelas com grade, cornija, guarda-corpo, canteiros
 {const ud=F.pt(1,0),o0=F.pt(0,0),U=[ud[0]-o0[0],ud[1]-o0[1]],vd=F.pt(0,1),V=[vd[0]-o0[0],vd[1]-o0[1]],Pb=dressPal(body2),Pm=dressPal(body);
  const W2=(u0,v0_,u1,v1_,n,h,P,o)=>{const a=F.pt(u0,v0_),b=F.pt(u1,v1_);dressWall(a[0],a[1],b[0],b[1],n[0],n[1],h,P,o)};
  const ws={winStyle:[60,19],win:[.375,.375]}; // faixas de janela largas (cara de galeria comercial)
  W2(2,v1,2,v0-.5,[-U[0],-U[1]],H+2.5,Pb,ws);W2(W-2,v0-.5,W-2,v1,[U[0],U[1]],H+2.5,Pb,ws);
  W2(10,v1,2,v1,[V[0],V[1]],H+2.5,Pb,ws);W2(W-2,v1,W-10,v1,[V[0],V[1]],H+2.5,Pb,ws);W2(W-10,v1,10,v1,[V[0],V[1]],H,Pm,{...ws,door:true})}
 // claraboia e máquinas no teto
 F.box(W*.3,W*.7,v0+6,v1-6,H,H+1.3,glass,det);for(let k=0;k<6;k++){const u=12+(k*7.3)%(W-24),v=v0+3+((k*11)%(v1-v0-6));F.box(u,u+1.8,v,v+1.4,H,H+1.1,C('#9a9aa2'),det)}
 // letreiros (texturas)
 const ry=Math.atan2(F.nrm[0],F.nrm[1]),pl=(u,y,v,w,h,mat)=>{const p=F.p3(u,y,v);signPlane(ch.group,mat,p[0]+F.nrm[0]*.05,p[1],p[2]+F.nrm[1]*.05,w,h,ry)};
 pl(W/2,H+2.6,pv-.3,11.6,2,sunsetSignMat(['SHOPPING','SUNSET SHORES'],'#242634','#efd3b2'));
 if(false){const R=C('#ff2238');for(const[a,b,v,h] of [[10,W-10,v0,H],[2,10,v0-2,H+2.5],[W-10,W-2,v0-2,H+2.5]]){F.box(a-.1,b+.1,v-.32,v-.2,h-.12,h+.02,R,neon);F.box(a-.1,b+.1,v-.32,v-.2,.3,.42,R,neon)}for(const u of [2,10,W-10,W-2])F.box(u-.06,u+.06,v0-2.32,v0-2.2,.3,H+2.5,R,neon)}
 pl(6,H+2.15,v0-2.22,7.6,1,mallSignMat('CINEMA',night?'#0a1a2a':'#2a6ab0','#ffffff'));pl(W-6,H+2.15,v0-2.22,7.6,1,mallSignMat('MODA',night?'#2a0a1a':'#d8402a','#ffffff'));
 // v77: fachada neon estilo Starcourt — Miami (modern: ciano/magenta) ou outrun (synthwave: azul/vermelho)
 {const MP=mallPal(),NA=C(MP.a),NB=C(MP.b),NW=C(night?'#ff6a8a':'#fff2f6'),NP=C(MP.c);
  const tube=(u0,y0,v0_,u1,y1,v1_,c,r=.07)=>{const a=F.p3(u0,y0,v0_),b=F.p3(u1,y1,v1_),A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),L=d.length();if(L<.01)return;const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());(night?neon:neonDN).geo(GEO.cyl16,new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),q,new THREE.Vector3(r,L,r)),c)};
  /* v78: neon enxuto (acento, anos 80 = caro) e apagado de dia: topo das 2 alas, contorno do pórtico, 1 chevron, 2 arcos sobre a porta, moldura do letreiro.
     Saíram: linha entre pisos, linha do corpo, faixas verticais das alas, arestas da claraboia. Interior do shopping: NÃO MEXER. */
  // linha superior escalonada: ala esq. -> corpo -> pórtico -> corpo -> ala dir.
  const yW=H+1.95,yB=H-.55,vw=v0-2.25,vb=v0-.38;
  tube(1.7,yW,vw,10,yW,vw,NA);tube(W-10,yW,vw,W-1.7,yW,vw,NA);
  // pórtico: contorno, chevron duplo e arcos sobre a porta
  const vp=pv-.42;tube(pu0-.35,.3,vp,pu0-.35,H+4.3,vp,NB);tube(pu1+.35,.3,vp,pu1+.35,H+4.3,vp,NB);tube(pu0-.35,H+4.3,vp,pu1+.35,H+4.3,vp,NB);
  for(const dy of [0]){tube(pu0+.6,H+.9+dy,vp,W/2,H-.9+dy,vp,NB,.08);tube(W/2,H-.9+dy,vp,pu1-.6,H+.9+dy,vp,NB,.08)}
  for(const [rad,c] of [[1.75,NA],[2.3,NP]]){const n=14,cy=4.88;for(let k=0;k<n;k++){const a0=Math.PI*k/n,a1=Math.PI*(k+1)/n;tube(W/2+Math.cos(a0)*rad,cy+Math.sin(a0)*rad,vp,W/2+Math.cos(a1)*rad,cy+Math.sin(a1)*rad,vp,c,.06)}}
  // moldura neon do letreiro principal
  {const y0=H+1.55,y1=H+3.65,a=W/2-6,b=W/2+6,v=pv-.45;tube(a,y0,v,b,y0,v,NB,.05);tube(a,y1,v,b,y1,v,NB,.05);tube(a,y0,v,a,y1,v,NB,.05);tube(b,y0,v,b,y1,v,NB,.05)}
  // claraboia piramidal de vidro sobre o pórtico, com arestas iluminadas
  {const cu=W/2,cv=(pv+v0)/2,yb=H+4.5,h=2.6,hs=2.25,pg=new THREE.ConeGeometry(hs*Math.SQRT2,h,4,1).toNonIndexed();pg.rotateY(Math.PI/4);const c=F.p3(cu,yb+h/2,cv);det.geo(pg,new THREE.Matrix4().makeTranslation(c[0],c[1],c[2]),C(night?'#3a4a7a':'#8fc4dc'));
   const ap=[cu,yb+h,cv];}
  // faixas de luz nas laterais das alas (cantos verticais)

 }
 const dp=F.pt(W/2,pv-1.4),op=F.pt(W/2,pv-3.2);MALL.door={x:dp[0],z:dp[1]};MALL.out={x:op[0],z:op[1]};MALL.nrm=F.nrm.slice();doorAt(F,W/2,pv)}
/* --- interior --- */
// Shopping geometry uses mirrored rows: always normalize bounds before triangulating.
function mallBox(mb,x0,y0,z0,x1,y1,z1,col){ibox(mb,Math.min(x0,x1),Math.min(y0,y1),Math.min(z0,z1),Math.max(x0,x1),Math.max(y0,y1),Math.max(z0,z1),col)}
function mallStoreFit(g,mb,X,Z,x0,s,key,up,cols){
 const B=(a,b,c,d,e,f,h)=>mallBox(mb,X+x0+a,b,Z+s*c,X+x0+d,e,Z+s*f,COL(h));
 const block=(a,c,d,f)=>cols.push([X+x0+a,Z+Math.min(s*c,s*f),X+x0+d,Z+Math.max(s*c,s*f)]);
 const label=(t,x,y,z,w,h,bg,fg)=>signPlane(g,mallSignMat(t,bg,fg),X+x0+x,y,Z+s*z,w,h,s>0?Math.PI:0);
 const plant=(x,z)=>{block(x-.24,z-.24,x+.24,z+.24);B(x-.22,0,z-.22,x+.22,.55,z+.22,'#b9946b');for(let k=0;k<3;k++)mb.geo(GEO.cone,mtx(X+x0+x+(k-1)*.16,.85+k*.15,Z+s*z,.35,.7,.35),COL(k%2?'#56844e':'#315c43'))};
 // Recessed skirting and cornice leave storefronts and service paths clear.
 B(.08,.06,11.48,9.32,.24,11.62,'#62596c');if(!MALL_THEMED.has(key))B(.08,3.15,11.45,9.32,3.23,11.58,'#e4d5bd');
 if(key==='cafe'||key==='tech'){
  const cafe=key==='cafe';
  // Warm wood floor / cool showroom border, separated from the original floor.
  B(.02,.025,6.05,9.38,.045,11.6,cafe?'#bd976d':'#c3d1d5');
  for(let n=0;n<12;n++)B(.04+n*.78,.046,6.08,.065+n*.78,.05,11.58,cafe?'#99724f':'#a8bec4');
  B(.25,0,8.7,3.25,1.03,9.38,cafe?'#70472f':'#293c50');B(.19,1.03,8.64,3.31,1.13,9.44,cafe?'#e3c797':'#e6edf1');block(.19,8.64,3.31,9.44);
  B(2.5,1.13,8.85,3.03,1.45,9.12,'#202933');B(2.54,1.23,8.83,2.98,1.42,8.85,'#66cbd1');
  MALL[key+(up?'U':'G')]={x:X+x0+1.8,z:Z+s*8,clerk:{x:X+x0+1.8,z:Z+s*10.3},door:{x:X+x0+4.7,z:Z+s*4.7,zf:Z+s*5.6,s}};
  if(cafe){
   // Barista backbar, espresso group, grinders, cups and pastry cabinet.
   B(.25,0,11,3.7,1.1,11.5,'#734d34');B(.2,1.1,10.96,3.75,1.18,11.55,'#d6b98a');
   B(.4,1.18,11.02,1.8,1.9,11.45,'#b9b4a5');B(.49,1.42,10.98,1.7,1.7,11.01,'#292b2c');
   for(const x of [.7,1.35]){B(x,1.33,10.9,x+.08,1.51,11.1,'#d7c7a6');B(x-.08,1.18,10.83,x+.16,1.32,11.04,'#fff0d2')}
   B(2.2,1.18,11.06,2.52,1.7,11.4,'#282b2b');B(2.22,1.7,11.08,2.5,1.98,11.38,'#8b6344');
   B(.4,1.13,8.75,1.55,1.65,9.24,'#91a7a2');B(.45,1.2,8.7,1.5,1.53,8.74,'#eed9b6');
   for(let j=0;j<4;j++)B(.52+j*.22,1.23,8.66,.68+j*.22,1.34,8.72,j%2?'#bd7c3c':'#e6b86d');
   label('CAFÉ · $5',1.9,2.65,11.42,2.9,.65,'#302b25','#ffd799');
   label('+25 VIDA',1.9,2.13,11.42,2.1,.32,'#302b25','#f4e6c6');
   // Slatted feature wall and two lounge tables; central entry remains open.
   for(let n=0;n<16;n++)B(4+n*.32,.2,11.44,4.1+n*.32,3.1,11.57,'#805a3e');
   for(const [x,z] of [[5.5,9.3],[7.9,10.5]]){
    for(let k=0;k<12;k++){const a=k*Math.PI/6,b=(k+1)*Math.PI/6,p=[X+x0+x,.054,Z+s*z],q=[p[0]+Math.cos(a)*.85,.054,p[2]+Math.sin(a)*.85],r=[p[0]+Math.cos(b)*.85,.054,p[2]+Math.sin(b)*.85];const base=mb.p.length;mb.quad(p,r,q,q,0,1,0,[0,0,1,1],COL('#bd976d'));{const c=COL('#e9c78c');for(let k=base;k<mb.p.length;k+=3)if(mb.p[k]===p[0]&&mb.p[k+2]===p[2]){mb.c[k]=c.r;mb.c[k+1]=c.g;mb.c[k+2]=c.b}} /* dev r2.3: pinta o centro pela posição (MB indexado: o leque vira 3 vértices; índice fixo [0,3] gravava cor além do fim) */}
    B(x-.48,.68,z-.38,x+.48,.78,z+.38,'#b67f4e');B(x-.08,0,z-.08,x+.08,.68,z+.08,'#363c39');block(x-.5,z-.4,x+.5,z+.4);
    for(const d of [-.85,.85]){B(x-.38,.18,z+d-.3,x+.38,.48,z+d+.3,'#815944');B(x-.38,.48,z+d+(d>0?.2:-.3),x+.38,.95,z+d+(d>0?.3:-.2),'#c18f5d');block(x-.38,z+d-.3,x+.38,z+d+.3)}
    B(x-.12,.78,z-.12,x+.08,.94,z+.08,'#f8ead0');
    B(x-.025,2.9,z-.025,x+.025,4.12,z+.025,'#42382e');B(x-.32,2.72,z-.25,x+.32,2.9,z+.25,'#e5bc73');B(x-.26,2.7,z-.2,x+.26,2.72,z+.2,'#fff1ac');
   }
   plant(8.85,7);plant(3.9,11.1);
  }else{
   label('PIXEL TECH',4.7,2.95,11.42,6,.55,'#142733','#59e1ec');
   // Wall monitors with stands, screen bezels and visible UI tiles.
   for(let k=0;k<3;k++){const x=.6+k*2.9;B(x,.3,11.02,x+2.35,.42,11.5,'#546876');B(x+1.06,.42,11.1,x+1.23,1.12,11.24,'#252d37');B(x,.98,11.08,x+2.35,2.4,11.35,'#172330');B(x+.1,1.09,11.04,x+2.25,2.3,11.07,['#347b92','#7465a3','#287e78'][k]);for(let j=0;j<3;j++)B(x+.22+j*.64,1.25,11.02,x+.7+j*.64,1.6,11.04,'#91d5d6')}
   for(const x of [4.7,7.25]){
    B(x,0,8.1,x+1.35,.85,9.8,'#536674');B(x-.08,.85,8.02,x+1.43,.96,9.88,'#edf0e8');block(x-.08,8.02,x+1.43,9.88);
    for(let k=0;k<3;k++){const z=8.2+k*.5;B(x+.18,.96,z,x+.58,1.02,z+.32,'#17232e');B(x+.22,1.02,z+.025,x+.54,1.035,z+.28,['#70cad5','#e4e8f1','#ad76cb'][k]);B(x+.88,.96,z,x+1.16,1.12,z+.32,'#d8dde1')}
   }
   plant(8.9,7);label('CELULARES · AUDIO',6.65,3.03,10.35,3.8,.34,'#233d4c','#b7eff0');
  }
 }else{
  const names={wear:'MODA · COLEÇÃO',food:'LANCHES & BEBIDAS',bag:'MALAS & VIAGENS',pharm:'CUIDADO & SAÚDE',jewel:'JOIAS · COLEÇÃO'};
  if(names[key])label(names[key],4.7,2.96,11.4,5.6,.42,'#292b38','#e9ddc7');
  if(key==='pharm'){B(4.38,2.22,11.02,4.62,2.75,11.09,'#439e81');B(4.23,2.37,11.01,4.77,2.6,11.08,'#439e81')}
  // Back-wall shelving with shelf edges, packages and small labels, all shops.
  const sa=key==='wear'?4.1:.45,nk=Math.floor((8.95-sa-.15)/.68); // v77: na Moda Pixel a prateleira começa depois do caixa (a vendedora ficava presa embaixo)
  if(!MALL_THEMED.has(key))for(let r=0;r<3;r++){
   B(sa,.7+r*.65,11.05,8.95,.77+r*.65,11.46,'#585263');
   for(let k=0;k<nk;k++){const x=sa+.15+k*.68;B(x,.78+r*.65,11.12,x+.42,1.08+r*.65,11.4,['#b9d7d2','#dcb991','#c488ad','#809abb'][(k+r)%4]);B(x+.04,.8+r*.65,11.1,x+.25,.88+r*.65,11.12,'#f0e8d8')}
  }
 }
}
/* =====================================================================
   v77 — SHOPPING: neon por estilo, penumbra com luz real por proximidade,
   texturas procedurais e lojas decorativas abertas.
   - Modern = Miami (ciano/magenta/rosa); Synthwave = outrun (azul escuro/vermelho).
   - Todo o interior usa mallMat(): MeshBasic + iluminação própria no shader
     (penumbra, poças de luz do teto, AO falso e até 4 luzes reais por loja).
   - Neon (MALL_NB) e halos aditivos (MALL_HB) ficam fora da penumbra.
   ===================================================================== */
/* v77: CIDADE COM HISTÓRIA — desgaste procedural nos prédios externos (sem textura nem geometria extra:
   ruído de valor na posição do mundo, então nada se repete). Diferente do shopping: escorridos de chuva sob
   cada pavimento, respingo/umidade na base com borda irregular (marrom ou esverdeada), manchas grandes
   desbotadas e lajes encardidas; tom levemente quente/frio por região. Some a partir de 160–260 m. */
const CITY_AGE={k:{value:1},soot:{value:[...Array(8)].map(()=>new THREE.Vector4(0,0,0,0))},box:{value:new THREE.Vector4(0,0,0,0)},boxH:{value:3.3}};
// fuligem das chaminés da indústria: até 8 chaminés (x,z,topo,raio); w=0 desliga
function cityAgeSootReset(){for(const v of CITY_AGE.soot.value)v.set(0,0,0,0);CITY_AGE.box.value.set(0,0,0,0)}
function cityAgeSootAdd(x,z,top){const a=CITY_AGE.soot.value;if(a.some(v=>v.w>0&&v.x===x&&v.y===z))return;const f=a.find(v=>v.w===0);if(f)f.set(x,z,top,1.35)}
const CITY_AGE_GLSL=`uniform float uAgeK;uniform vec4 uSoot[8];uniform vec4 uAgeBox;uniform float uAgeBoxH;varying vec3 vAgW;varying vec3 vAgN;varying float vAgTop;
float agH(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float agN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(agH(i),agH(i+vec2(1.,0.)),f.x),mix(agH(i+vec2(0.,1.)),agH(i+vec2(1.,1.)),f.x),f.y);}
vec3 cityAge(){if(uAgeK<.01)return vec3(1.);vec3 w=vAgW;float dist=distance(w,cameraPosition);if(dist>190.)return vec3(1.);
 vec3 n=normalize(vAgN);float fd=(1.-smoothstep(120.,190.,dist))*uAgeK;vec3 col=vec3(1.);
 // v77: só ~metade da cidade tem desgaste — máscara regional bem suave (esmaece entre regiões, sem emenda); fora dela nem calcula
 float reg=smoothstep(.44,.6,agN(w.xz*.011+vec2(7.1,3.3)));
 if(reg>.01){float tone=agN(w.xz*.021+3.7);vec3 tint=mix(vec3(1.02,.995,.96),vec3(.96,.985,1.02),tone);vec3 t=vec3(1.);
  if(abs(n.y)<.6){vec2 tg=vec2(-n.z,n.x);float s=dot(w.xz,tg);float dTop=vAgTop-w.y,len=1.4+agN(vec2(s*.9,4.1))*2.6;
   float streak=vAgTop>.5&&dTop<4.?smoothstep(.6,.9,agN(vec2(s*1.7,7.3)))*(1.-smoothstep(len*.35,len,dTop)):0.;
   float edge=.45+agN(vec2(s*.9,1.1))*1.2;float base=1.-smoothstep(edge*.45,edge,w.y);
   float blot=smoothstep(.6,.88,agN(vec2(s*.11,w.y*.13)+tone*5.));
   vec3 dirt=mix(vec3(.6,.54,.45),vec3(.53,.6,.5),smoothstep(.55,.8,tone));
   t=mix(vec3(1.),dirt,clamp(streak*.44+base*.5+blot*.28,0.,.62));}
  else if(n.y>.6){t=mix(vec3(1.),vec3(.8,.77,.72),smoothstep(.5,.85,agN(w.xz*.18))*.32);}
  float low=vAgTop>.5&&vAgTop<4.6?.3:1.; // v78: casas (paredes baixas) quase limpas
  col=mix(vec3(1.),t*tint,fd*reg*low);}
 // v78: motel — manchas do interior do shopping (umidade subindo da base, infiltração sob cada andar; no chão, manchas largas desbotadas)
 if(w.x>uAgeBox.x&&w.x<uAgeBox.z&&w.z>uAgeBox.y&&w.z<uAgeBox.w){vec3 mt=vec3(1.);
  if(abs(n.y)<.5){vec2 tg=vec2(-n.z,n.x);float s=dot(w.xz,tg),y=w.y,yf=mod(y,uAgeBoxH);float a=agN(vec2(s*.45,y*.9))*.65+agN(vec2(s*1.7,y*2.3))*.35;
   float damp=smoothstep(.46,.76,a)*(1.-smoothstep(.1,1.6+agN(vec2(s*.3,7.))*1.2,y));
   float leak=smoothstep(.5,.8,agN(vec2(s*.6,3.1+floor(y/uAgeBoxH))))*smoothstep(uAgeBoxH-2.2+agN(vec2(s*2.,1.))*1.2,uAgeBoxH,yf)*(.6+.4*agN(vec2(s*3.,y*4.)));
   mt=mix(vec3(1.),vec3(.6,.52,.4),clamp(damp*.8+leak*.85,0.,1.)*.4);} /* v78: metade da sujeira do motel */
  else if(n.y>.5&&w.y<1.){float st=smoothstep(.5,.82,agN(w.xz*.3)*.7+agN(w.xz*.9)*.3)*(.55+.45*agN(w.xz*1.3));mt=mix(vec3(1.),mix(vec3(.62,.58,.46),vec3(.5,.52,.3),smoothstep(.4,.7,agN(w.xz*.07+5.))),st*.4);}
  col*=mix(vec3(1.),mt,(1.-smoothstep(120.,190.,dist)));}
 // indústria: fuligem preta no topo das chaminés e depósito escuro em volta (lajes e paredes até ~45 m) — vale em toda a cidade
 float soot=0.,sootN=-1.;for(int i=0;i<8;i++){vec4 c=uSoot[i];if(c.w<.5)continue;float hd=distance(w.xz,c.xy);
  if(hd<c.w+.4){float dt=c.z-w.y;soot=max(soot,(1.-smoothstep(1.,10.+agN(vec2(atan(w.z-c.y,w.x-c.x)*3.,1.))*8.,dt))*.85);}
  else if(hd<45.){if(sootN<0.)sootN=.55+.45*agN(w.xz*.3);soot=max(soot,(1.-smoothstep(8.,45.,hd))*(n.y>.6?.45:.3)*sootN);}}
 return col*mix(vec3(1.),vec3(.24,.22,.21),soot*fd);}`;
function cityAgeMat(mat){if(!mat||mat.userData.cityAge)return mat;mat.userData.cityAge=true;const old=mat.onBeforeCompile,key=mat.customProgramCacheKey();
 mat.onBeforeCompile=(sh,r)=>{old.call(mat,sh,r);sh.uniforms.uAgeK=CITY_AGE.k;sh.uniforms.uSoot=CITY_AGE.soot;sh.uniforms.uAgeBox=CITY_AGE.box;sh.uniforms.uAgeBoxH=CITY_AGE.boxH;
  sh.vertexShader='attribute float aTop;varying vec3 vAgW;varying vec3 vAgN;varying float vAgTop;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vAgW=(modelMatrix*vec4(transformed,1.0)).xyz;vAgN=normalize(mat3(modelMatrix)*objectNormal);vAgTop=aTop>0.?(modelMatrix*vec4(0.,aTop,0.,1.)).y:0.;');
  sh.fragmentShader=CITY_AGE_GLSL+'\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=cityAge();')};
 mat.customProgramCacheKey=()=>key+'|cityAge4';return mat}
/* dev r2.4 · UPSIDE DOWN — podridão: manchas negras orgânicas no chão (com veias finas ligando as manchas) e subindo das bases das
   paredes de prédios, casas e indústrias (altura irregular + tendões verticais tipo cipó). Só ruído pela posição de mundo, sem textura;
   corta a 160 m. Injetado SÓ quando S.style==='inverted' (generateCity). Nada de 'patch' como nome: é palavra reservada no GLSL ES 3. */
const ROT={k:{value:1}};
const ROT_GLSL=`uniform float uRotK;varying vec3 vRtW;varying vec3 vRtN;
float rtH(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float rtN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rtH(i),rtH(i+vec2(1.,0.)),f.x),mix(rtH(i+vec2(0.,1.)),rtH(i+vec2(1.,1.)),f.x),f.y);}
float rtF(vec2 p){return rtN(p)*.5+rtN(p*2.03+7.1)*.3+rtN(p*4.1+3.3)*.2;}
float rtLine(vec2 p,float w){return 1.-smoothstep(0.,w,abs(rtN(p)-.5));}
vec2 rotFx(){if(uRotK<.01)return vec2(0.);vec3 w=vRtW;float dist=distance(w,cameraPosition);if(dist>160.)return vec2(0.);
 float fd=1.-smoothstep(110.,160.,dist);vec3 n=normalize(vRtN);float cov=0.,vein=0.;
 if(n.y>.6){vec2 p=w.xz;vec2 wp=p*.08+vec2(rtN(p*.05),rtN(p*.05+9.))*1.6;float m=rtF(wp);float pch=smoothstep(.56,.70,m);
  vec2 q=p*.32+vec2(rtN(p*.11+2.),rtN(p*.11+5.))*3.;float ln=rtLine(q,.045)*smoothstep(.40,.58,m);float ln2=rtLine(q*2.3+4.,.06)*smoothstep(.50,.66,m)*.8;
  float up=w.y<1.2?1.:.35;cov=max(pch,max(ln,ln2))*up;vein=max(ln,ln2)*(1.-pch);}
 else if(n.y>-.5){vec2 tg=normalize(vec2(-n.z,n.x)+1e-5);float s=dot(w.xz,tg),y=w.y;float H=1.1+4.2*smoothstep(.3,.8,rtF(vec2(s*.07,3.1)));
  float edge=y+(rtF(vec2(s*.45,y*.35))-.5)*1.8;float base=(1.-smoothstep(H*.55,H,edge))*smoothstep(.22,.42,rtF(vec2(s*.11,1.7))+.18);
  float xs=s*.75+(rtN(vec2(s*.22,y*.16))-.5)*2.6;float reach=H*(1.6+1.4*rtN(vec2(s*.3,8.)));float tend=rtLine(vec2(xs,y*.12),.05)*(1.-smoothstep(reach*.7,reach,y));
  float tend2=rtLine(vec2(xs*1.9+3.,y*.2),.07)*(1.-smoothstep(H*.8,H*1.6,y))*.8;cov=max(base,max(tend,tend2));vein=max(tend,tend2)*(1.-base);}
 return vec2(clamp(cov*fd*uRotK,0.,1.),vein);}`;
function rotMat(mat){if(!mat||mat.userData.rot)return mat;mat.userData.rot=true;const old=mat.onBeforeCompile,key=mat.customProgramCacheKey();
 mat.onBeforeCompile=(sh,r)=>{old.call(mat,sh,r);sh.uniforms.uRotK=ROT.k;
  sh.vertexShader='varying vec3 vRtW;varying vec3 vRtN;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vRtW=(modelMatrix*vec4(transformed,1.0)).xyz;vRtN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=ROT_GLSL+'\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n vec2 rotRf=rotFx();diffuseColor.rgb=mix(diffuseColor.rgb,mix(vec3(.028,.024,.03),vec3(.16,.025,.04),rotRf.y*.55),rotRf.x);').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance*=1.-rotRf.x;')};
 mat.customProgramCacheKey=()=>key+'|rot2';return mat}
// aTop: altura do topo da face (y máx. do triângulo) — os escorridos nascem só ali, não no meio da parede
function ageTopAttr(geo){const P=geo&&geo.attributes.position;if(!P||geo.attributes.aTop)return;const a=P.array,n=P.count,o=new Float32Array(n),ix=geo.index&&geo.index.array;
 if(ix){for(let i=0;i+2<ix.length;i+=3){const i0=ix[i],i1=ix[i+1],i2=ix[i+2],t=Math.max(a[i0*3+1],a[i1*3+1],a[i2*3+1],.01);if(t>o[i0])o[i0]=t;if(t>o[i1])o[i1]=t;if(t>o[i2])o[i2]=t}}else{for(let i=0;i+2<n;i+=3){const t=Math.max(a[i*3+1],a[i*3+4],a[i*3+7],.01);o[i]=o[i+1]=o[i+2]=t}}geo.setAttribute('aTop',new THREE.BufferAttribute(o,1))}
/* v77: luz de interior no clima das lojas do shopping — ambiente baixo, poças quentes sob as luminárias,
   penumbra nos cantos/rodapé/teto. grime>0 (cela) soma umidade e manchas leves. Só MeshBasic + cor de vértice. */
const ROOM_GLSL=`uniform vec4 uRB;uniform vec2 uRY;uniform vec3 uRW;uniform vec4 uRP;uniform vec3 uRL[8];uniform int uRN;varying vec3 vRW;varying vec3 vRN;
float rmH(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float rmN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rmH(i),rmH(i+vec2(1.,0.)),f.x),mix(rmH(i+vec2(0.,1.)),rmH(i+vec2(1.,1.)),f.x),f.y);}
vec3 roomLit(){vec3 w=vRW,n=normalize(vRN);float y=w.y-uRY.x,H=uRY.y;
 float dw=min(min(w.x-uRB.x,uRB.z-w.x),min(w.z-uRB.y,uRB.w-w.z));float pen=mix(.55,1.,smoothstep(0.,2.4,dw));
 float pl=0.;for(int i=0;i<8;i++){if(i>=uRN)break;vec3 d=uRL[i]-w;float dist=length(d);float a=clamp(1.-dist/uRP.z,0.,1.);a*=a;pl+=a*(max(dot(n,d/max(dist,.001)),0.)*.7+.3);}
 vec3 f=(vec3(uRP.x)+uRW*pl*uRP.y)*pen;
 if(abs(n.y)<.5)f*=mix(.72,1.,smoothstep(0.,1.2,y))*mix(1.,.8,smoothstep(H-1.3,H,y));
 if(n.y<-.5)f*=.75;
 if(uRP.w>0.){float s=n.y>.5||n.y<-.5?0.:dot(w.xz,vec2(-n.z,n.x));
  if(abs(n.y)<.5){float a=rmN(vec2(s*.5,y*.9))*.65+rmN(vec2(s*1.8,y*2.4))*.35;float damp=smoothstep(.48,.78,a)*(1.-smoothstep(.1,1.4+rmN(vec2(s*.3,7.))*1.,y));
   float leak=smoothstep(.58,.84,rmN(vec2(s*.7,3.1)))*smoothstep(H-1.6,H,y)*(.6+.4*rmN(vec2(s*3.,y*4.)));f*=mix(vec3(1.),vec3(.66,.58,.46),clamp(damp*.75+leak*.7,0.,1.)*uRP.w);}
  else if(n.y>.5){float st=smoothstep(.6,.9,rmN(w.xz*.7))*(.5+.5*rmN(w.xz*3.1));f*=mix(vec3(1.),vec3(.72,.66,.56),st*.5*uRP.w);}}
 return f;}`;
function roomLitMat(R,opt){const m=new THREE.MeshBasicMaterial(Object.assign({vertexColors:true},opt||{}));const L=(R.lights||[]).slice(0,8);while(L.length<8)L.push([0,-99,0]);const wc=COL(R.warm||'#ffc890');
 const U={uRB:{value:new THREE.Vector4(R.x0,R.z0,R.x1,R.z1)},uRY:{value:new THREE.Vector2(R.y0||0,R.H)},uRW:{value:new THREE.Vector3(wc.r,wc.g,wc.b)},uRP:{value:new THREE.Vector4(R.amb??.48,R.pow??.8,R.rad??6.5,R.grime||0)},uRL:{value:L.map(p=>new THREE.Vector3(...p))},uRN:{value:Math.min(8,(R.lights||[]).length)}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRW;varying vec3 vRN;').replace('#include <project_vertex>','#include <project_vertex>\nvRW=(modelMatrix*vec4(transformed,1.)).xyz;vRN=normalize(mat3(modelMatrix)*normal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+ROOM_GLSL).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=roomLit();')};
 m.customProgramCacheKey=()=>'roomLit1';return m}
// luminárias em grade no teto quando o cômodo não tem as suas
function roomGrid(x0,z0,x1,z1,y){const o=[],w=x1-x0,d=z1-z0,nx=Math.max(1,Math.min(4,Math.round(Math.sqrt(8*w/d)))),nz=Math.max(1,Math.min(Math.floor(8/nx),Math.round(nx*d/w)||1));for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)o.push([x0+(i+.5)*(x1-x0)/nx,y,z0+(j+.5)*(z1-z0)/nz]);return o.slice(0,8)}
function mallMat(opt){const m=new THREE.MeshBasicMaterial(Object.assign({vertexColors:true},opt||{}));m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,MALL_LU);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMW;varying vec3 vMN;').replace('#include <project_vertex>','#include <project_vertex>\nvMW=(modelMatrix*vec4(transformed,1.)).xyz;vMN=normalize(mat3(modelMatrix)*normal);');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMW;varying vec3 vMN;\n'+MALL_GLSL).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mallLight(vMW,normalize(vMN));')};
 m.customProgramCacheKey=()=>'mallLit1';return m}
/* v78 · PALETA ÚNICA DE NEON por mundo (consultar sempre esta):
   Sunset Shores (vaporwave/Miami): a=ciano #2af0ff · b=rosa #ff3ec8 · c=rosa-claro · d=amarelo-sol #ffd36a
   Synthwave (outrun): a=azul #2b4dff · b=vermelho #ff1f3d · c=roxo · d=laranja #ff5a2a */
function mallPal(){const VW=!!(city.st&&city.st.night);return VW?{a:'#2b4dff',b:'#ff1f3d',c:'#7f30ff',d:'#ff5a2a',lamp:'#ff7a5a',dim:.5}:{a:'#2af0ff',b:'#ff3ec8',c:'#ff8fd0',d:'#ffd36a',lamp:'#ffd8a0',dim:.6}}
/* ---------- texturas procedurais (cache global) ---------- */
const MALL_TT={};
function mallTex(name){if(MALL_TT[name])return MALL_TT[name];const P=MALL_TP[name];if(!P)return null;const c=P();const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;MALL_TT[name]=t;return t}
const MALL_TP={
 albums(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(91),P=['#e8505b','#f9d56e','#14b1ab','#2a3d66','#ff8c42','#a05195','#f2efe6','#1b1b1b','#3ab36a','#ff4fa0','#7a4ad6','#2ac8c8','#c9a227'];
  g.fillStyle='#2a2430';g.fillRect(0,0,512,256);for(let y=0;y<4;y++)for(let x=0;x<8;x++){const X=x*64,Y=y*64,a=P[r()*P.length|0];let b=P[r()*P.length|0];if(b===a)b='#f2efe6';g.fillStyle=a;g.fillRect(X+3,Y+3,58,58);g.fillStyle=b;const t=r()*5|0;
   if(t===0){g.beginPath();g.arc(X+32,Y+32,12+r()*10,0,7);g.fill()}else if(t===1){g.fillRect(X+3,Y+34,58,9)}else if(t===2){g.beginPath();g.moveTo(X+9,Y+56);g.lineTo(X+32,Y+12);g.lineTo(X+55,Y+56);g.fill()}else if(t===3){for(let k=0;k<4;k++)g.fillRect(X+9,Y+12+k*11,46,4)}else{g.fillRect(X+14,Y+14,36,36);g.fillStyle=a;g.fillRect(X+22,Y+22,20,20)}
   g.fillStyle='rgba(255,255,255,.8)';g.fillRect(X+8,Y+7,14+r()*26,4);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(X+3,Y+59,58,2)}return c},
 dots(){const c=cv(256,128),g=c.getContext('2d'),r=mulberry32(7);g.fillStyle='#f1e6d2';g.fillRect(0,0,256,128);for(let k=0;k<26;k++){const x=r()*256,y=r()*128,rad=5+r()*16;g.fillStyle=r()<.5?'#f2a0ae':'#ef8d9f';for(const dx of [-256,0,256])for(const dy of [-128,0,128]){g.beginPath();g.arc(x+dx,y+dy,rad,0,7);g.fill()}}g.strokeStyle='rgba(120,70,80,.35)';g.lineWidth=3;g.strokeRect(1,1,254,126);return c},
 crates(){const c=cv(256,128),g=c.getContext('2d'),r=mulberry32(19),P=['#e8505b','#f9d56e','#14b1ab','#ff8c42','#a05195','#3ab36a','#ff4fa0','#2a6ad6','#f2efe6'];g.fillStyle='#1d1820';g.fillRect(0,0,256,128);
  for(let k=0;k<24;k++){const x=k*10.6+1;g.fillStyle=P[r()*P.length|0];g.fillRect(x,8+r()*6,9,112);g.fillStyle='rgba(255,255,255,.55)';g.fillRect(x+2,24,5,2)}return c},
 games(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(33),P=['#2a6ad6','#d62828','#3ab36a','#f2c21a','#7a4ad6','#ff6fae','#1b1b1b','#2ac8c8','#ff8a1a'];g.fillStyle='#e9e3d6';g.fillRect(0,0,512,256);
  for(let row=0;row<4;row++){g.fillStyle='#8a7766';g.fillRect(0,row*64+58,512,6);for(let k=0;k<20;k++){const x=k*25.6+2,h=40+r()*12;g.fillStyle=P[r()*P.length|0];g.fillRect(x,row*64+58-h,22,h);g.fillStyle='#ffffff';g.fillRect(x+3,row*64+58-h+6,16,6);g.fillStyle='rgba(0,0,0,.3)';g.fillRect(x+3,row*64+58-12,16,3)}}return c},
 shoes(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(5),P=['#1b1b1b','#f2f2ee','#7a4a2a','#d62828','#2a5ab0','#c8c8d0','#e8b830','#3ab36a','#ff6fae'];g.fillStyle='#d8cdb9';g.fillRect(0,0,512,256);
  for(let row=0;row<4;row++){const Y=row*64;g.fillStyle='#9a8466';g.fillRect(0,Y+56,512,8);for(let k=0;k<9;k++){const X=k*57+6,col=P[r()*P.length|0];g.fillStyle=col;g.beginPath();g.moveTo(X,Y+54);g.lineTo(X,Y+34);g.quadraticCurveTo(X+8,Y+22,X+20,Y+30);g.lineTo(X+44,Y+44);g.quadraticCurveTo(X+50,Y+50,X+46,Y+54);g.closePath();g.fill();g.fillStyle='#f4f0e8';g.fillRect(X,Y+51,46,4)}}return c},
 glasses(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(11),P=['#121218','#3a6aa8','#a83a3a','#e8b830','#ff4fd8','#2ad6c8','#5a3a2a'];g.fillStyle='#ece6dd';g.fillRect(0,0,512,256);
  for(let row=0;row<5;row++){const Y=row*51+24;g.fillStyle='#c9bfb2';g.fillRect(0,Y+16,512,3);for(let k=0;k<7;k++){const X=k*73+12,col=P[r()*P.length|0];g.strokeStyle=col;g.lineWidth=4;g.fillStyle='rgba(90,140,170,.35)';const rd=r()<.5;for(const dx of [0,28]){g.beginPath();if(rd)g.arc(X+12+dx,Y,11,0,7);else g.rect(X+1+dx,Y-9,22,18);g.fill();g.stroke()}g.beginPath();g.moveTo(X+23,Y-2);g.lineTo(X+29,Y-2);g.stroke()}}return c},
 perfume(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(13),P=['#ff9ad5','#ffd36a','#9ad8ff','#c6a0ff','#ffffff','#ff6f91'];const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#f6dde8');gr.addColorStop(1,'#d9b4c8');g.fillStyle=gr;g.fillRect(0,0,512,256);
  for(let row=0;row<3;row++){const Y=row*84+70;g.fillStyle='rgba(255,255,255,.7)';g.fillRect(0,Y+4,512,4);for(let k=0;k<11;k++){const X=k*46+10,h=26+r()*24,col=P[r()*P.length|0];g.fillStyle=col;g.globalAlpha=.85;g.fillRect(X,Y-h,22,h);g.globalAlpha=1;g.fillStyle='#e8c040';g.fillRect(X+7,Y-h-8,8,8);g.fillStyle='rgba(255,255,255,.6)';g.fillRect(X+3,Y-h+4,3,h-8)}}return c},
 toys(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(23),P=['#ff3b3b','#ffd21a','#2a8ad6','#3ab36a','#ff8a1a','#ff6fae','#7a4ad6','#2ac8c8'];g.fillStyle='#fff3d6';g.fillRect(0,0,512,256);
  for(let row=0;row<4;row++){const Y=row*64;g.fillStyle='#e0c690';g.fillRect(0,Y+58,512,6);for(let k=0;k<12;k++){const X=k*42+4,col=P[r()*P.length|0],t=r()*3|0;g.fillStyle=col;if(t===0)g.fillRect(X,Y+20,34,38);else if(t===1){g.beginPath();g.arc(X+17,Y+40,17,0,7);g.fill()}else{g.fillRect(X+4,Y+30,26,28);g.beginPath();g.arc(X+17,Y+26,10,0,7);g.fill()}g.fillStyle='rgba(255,255,255,.7)';g.fillRect(X+6,Y+44,14,4)}}return c},
 beach(){const c=cv(512,256),g=c.getContext('2d'),r=mulberry32(31),P=['#1e5ab0','#d62828','#2ac8c8','#f2c21a','#ff6fae','#3ab36a','#ff8a1a','#1b1b1b'];g.fillStyle='#e8e0cc';g.fillRect(0,0,512,256);
  g.fillStyle='#8a8a90';g.fillRect(0,22,512,4);for(let k=0;k<12;k++){const X=k*42+8,col=P[r()*P.length|0],bik=k%2;g.strokeStyle='#8a8a90';g.lineWidth=2;g.beginPath();g.moveTo(X+13,26);g.lineTo(X+13,34);g.stroke();g.fillStyle=col;
   if(bik){g.beginPath();g.arc(X+7,46,7,0,Math.PI);g.arc(X+19,46,7,0,Math.PI);g.fill();g.fillRect(X+5,38,16,2);g.beginPath();g.moveTo(X+4,70);g.lineTo(X+22,70);g.lineTo(X+13,82);g.closePath();g.fill()}
   else{g.beginPath();g.moveTo(X+2,40);g.lineTo(X+24,40);g.lineTo(X+24,52);g.lineTo(X+16,62);g.lineTo(X+10,62);g.lineTo(X+2,52);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.5)';g.fillRect(X+2,43,22,2)}}
  for(let k=0;k<9;k++){const X=k*56+10,col=P[r()*P.length|0];for(let q=0;q<3;q++){const Y=170-q*28;g.fillStyle=col;g.fillRect(X,Y,46,24);g.fillStyle='rgba(255,255,255,.55)';g.fillRect(X,Y+8,46,4);g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.arc(X+46,Y+12,11,0,7);g.fill()}}
  g.fillStyle='#9a8a78';g.fillRect(0,198,512,6);return c},
 posters(){const c=cv(768,384),g=c.getContext('2d');const T=[['PALM VICE','#ff3ec8','#2a0b3a','#ffd36a'],['OUTRUN 86','#2b4dff','#06051a','#ff1f3d'],['SUNSET 2','#ff8a1a','#3a0b1a','#2af0ff']];
  T.forEach(([t,a,b,s],i)=>{const X=i*256;const gr=g.createLinearGradient(0,0,0,384);gr.addColorStop(0,b);gr.addColorStop(.6,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(X+8,8,240,368);g.fillStyle=s;g.beginPath();g.arc(X+128,190,60,Math.PI,0);g.fill();
   g.fillStyle=b;for(let k=0;k<6;k++)g.fillRect(X+68,140+k*9+k*k,120,3);g.strokeStyle=s;g.lineWidth=2;for(let k=0;k<7;k++){g.beginPath();g.moveTo(X+8,250+k*k*3);g.lineTo(X+248,250+k*k*3);g.stroke()}
   g.fillStyle='#ffffff';g.font='900 34px Fredoka, Inter, sans-serif';g.textAlign='center';g.fillText(t,X+128,60);g.font='700 14px Inter, sans-serif';g.fillText('EM BREVE · SÓ NOS CINEMAS',X+128,350);g.strokeStyle='#d8c08a';g.lineWidth=6;g.strokeRect(X+5,5,246,374)});return c},
 band(){const c=cv(512,128),g=c.getContext('2d');g.fillStyle='#0d0b10';g.fillRect(0,0,512,128);g.fillStyle='#ff2a3a';g.font='900 58px Fredoka, Inter, sans-serif';g.textAlign='center';g.fillText('NEON PALMS',256,68);g.fillStyle='#f2e6d2';g.font='700 18px Inter, sans-serif';g.fillText('O NOVO ÁLBUM · "NOITES DE VERÃO"',256,100);g.strokeStyle='#ff2a3a';g.lineWidth=4;g.strokeRect(6,6,500,116);return c},
 pizza(){const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#1f2d24';g.fillRect(0,0,256,256);g.strokeStyle='#c9a46a';g.lineWidth=8;g.strokeRect(4,4,248,248);g.fillStyle='#f4efe2';g.textAlign='center';g.font='900 30px Fredoka, Inter, sans-serif';g.fillText('CARDÁPIO',128,48);g.font='700 17px Inter, sans-serif';
  ['MARGHERITA ..... $8','CALABRESA ...... $9','4 QUEIJOS ...... $10','PORTUGUESA ..... $10','REFRI .......... $3'].forEach((t,i)=>g.fillText(t,128,92+i*30));g.fillStyle='#ffd36a';g.font='italic 700 18px Inter, sans-serif';g.fillText('FATIA DO DIA!',128,240);return c},
 directory(){const c=cv(256,384),g=c.getContext('2d');g.fillStyle='#13121c';g.fillRect(0,0,256,384);g.fillStyle='#ffd36a';g.textAlign='center';g.font='900 22px Fredoka, Inter, sans-serif';g.fillText('SUNSET SHORES',128,32);g.fillStyle='#2af0ff';g.font='700 14px Inter, sans-serif';g.fillText('SHOPPING · DIRETÓRIO',128,52);
  g.textAlign='left';let y=82;for(const [t,a,b] of [['TÉRREO',0,8],['1º ANDAR',8,16]]){g.fillStyle='#ff3ec8';g.font='800 15px Inter, sans-serif';g.fillText(t,16,y);y+=20;for(let i=a;i<b;i++){g.fillStyle=MALL_SHOPS[i][1]==='#1a1a2a'?'#ffd36a':MALL_SHOPS[i][1];g.fillRect(16,y-10,10,10);g.fillStyle='#e9e2d4';g.font='600 13px Inter, sans-serif';g.fillText(MALL_SHOPS[i][0],32,y);y+=19}y+=8}
  g.fillStyle='#ffd36a';g.font='700 12px Inter, sans-serif';g.fillText('● VOCÊ ESTÁ AQUI',16,372);return c},
 info(){const c=cv(128,128),g=c.getContext('2d');g.fillStyle='#173a52';g.fillRect(0,0,128,128);g.fillStyle='#e8382a';g.beginPath();g.arc(64,56,40,0,7);g.fill();g.fillStyle='#ffffff';g.font='900 54px Georgia, serif';g.textAlign='center';g.fillText('i',64,76);g.font='700 13px Inter, sans-serif';g.fillText('INFORMAÇÕES',64,118);return c},
 mural(){const c=cv(512,256),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#2a0b4a');gr.addColorStop(.55,'#ff4f8a');gr.addColorStop(.75,'#ffb35a');gr.addColorStop(1,'#1b0f2a');g.fillStyle=gr;g.fillRect(0,0,512,256);
  g.fillStyle='#ffd36a';g.beginPath();g.arc(256,170,70,Math.PI,0);g.fill();g.fillStyle='#ff4f8a';for(let k=0;k<6;k++)g.fillRect(186,118+k*9+k*k*.6,140,2+k*.6);g.fillStyle='#120a1e';g.fillRect(0,170,512,86);g.strokeStyle='#2af0ff';g.lineWidth=2;for(let k=0;k<7;k++){g.beginPath();g.moveTo(0,172+k*k*1.8);g.lineTo(512,172+k*k*1.8);g.stroke()}for(let k=-8;k<=8;k++){g.beginPath();g.moveTo(256,172);g.lineTo(256+k*70,256);g.stroke()}
  const palm=(x,h,sc)=>{g.fillStyle='#0d0716';g.beginPath();g.moveTo(x-3*sc,172);g.quadraticCurveTo(x+6*sc,172-h*.5,x+12*sc,172-h);g.lineTo(x+16*sc,172-h);g.quadraticCurveTo(x+10*sc,172-h*.5,x+3*sc,172);g.fill();for(let k=0;k<7;k++){const a=-2.9+k*.55;g.beginPath();g.moveTo(x+14*sc,172-h);g.quadraticCurveTo(x+14*sc+Math.cos(a)*30*sc,172-h+Math.sin(a)*16*sc-10*sc,x+14*sc+Math.cos(a)*52*sc,172-h+Math.sin(a)*30*sc+14*sc);g.lineTo(x+14*sc+Math.cos(a)*40*sc,172-h+Math.sin(a)*24*sc+10*sc);g.fill()}};palm(60,110,1.1);palm(120,80,.8);palm(420,120,1.2);palm(470,70,.7);
  g.fillStyle='#ffffff';g.font='italic 900 34px Fredoka, Inter, sans-serif';g.textAlign='center';g.shadowColor='#ff2a8a';g.shadowBlur=12;g.fillText('Sunset Shores',256,58);g.shadowBlur=0;g.strokeStyle='#ffd36a';g.lineWidth=6;g.strokeRect(3,3,506,250);return c},
 vend(){const c=cv(128,256),g=c.getContext('2d');g.fillStyle='#c8102e';g.fillRect(0,0,128,256);g.fillStyle='#1b1b20';g.fillRect(10,30,78,170);const P=['#d62828','#2a6ad6','#f2c21a','#3ab36a','#ff8a1a','#f2f2ee'];for(let r=0;r<5;r++)for(let k=0;k<4;k++){g.fillStyle=P[(r+k)%6];g.fillRect(16+k*18,40+r*32,12,22)}g.fillStyle='#ffffff';g.font='900 20px Fredoka, Inter, sans-serif';g.textAlign='center';g.fillText('REFRI',64,22);g.fillStyle='#2a2a30';g.fillRect(96,60,22,60);g.fillStyle='#9ae6ff';g.fillRect(98,64,18,10);g.fillStyle='#111';g.fillRect(14,212,74,30);return c}
};
/* painel texturizado alinhado aos eixos (normal informada) */
function mallPanel(mb,x0,y0,z0,x1,y1,z1,n,uv,col){const c=col||COL('#ffffff'),u=uv||[0,0,1,1];
 if(n[1]>.5){mb.quad([x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],0,1,0,u,c);return}
 if(Math.abs(n[2])>.5){const z=z0;if(n[2]>0)mb.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],0,0,1,u,c);else mb.quad([x1,y0,z],[x0,y0,z],[x0,y1,z],[x1,y1,z],0,0,-1,u,c);return}
 const x=x0;if(n[0]>0)mb.quad([x,y0,z1],[x,y0,z0],[x,y1,z0],[x,y1,z1],1,0,0,u,c);else mb.quad([x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],-1,0,0,u,c)}
/* luzes por loja (cor da luz real, ambiente no modo real) */
function mallStoreLight(idx){const k=MALL_SHOPS[idx][2]||MALL_DECO[idx]||'';const VW=!!(city.st&&city.st.night);
 // v77: todas as lojas no clima da cafeteria/loja de discos — ambiente baixo e luz quente pendurada
 const T={cafe:['#ffae5c',.17,9],music:['#ff8c8c',.16,9.5],tech:['#ffd0a0',.18,9],wear:['#ffb8c8',.18,9],jewel:['#ffd890',.17,8.5],skate:['#d8fff4',.18,9],pharm:['#fff0d0',.2,9],food:['#ffd8a0',.19,9],bag:['#ffc080',.17,9],
  games:['#c89cff',.14,9],shoes:['#ffc89a',.17,9],toys:['#ffe0a0',.19,9],optic:['#ffe8c8',.18,9],beach:['#ffe6b8',.19,9],perfume:['#ffb0d0',.17,9],pizza:['#ffa060',.17,9],cinema:['#ff6a5a',.1,9.5]};
 const t=T[k]||['#fff0d8',.3,9];const c=COL(t[0]);if(VW)c.lerp(COL(k==='cafe'||k==='pizza'?'#ff7040':'#ff5a7a'),.25);return{col:c,amb:t[1],rad:t[2]}}
const MALL_DECO={2:'games',3:'shoes',4:'toys',6:'optic',11:'beach',12:'perfume',13:'pizza',15:'cinema'};
/* ---------- neon do interior ---------- */
/* ---------- detalhes do corredor ---------- */
/* ---------- lojas: detalhes temáticos ---------- */
function mallStoreDecor(g,mb,tm,nb,X,Z,x0,s,idx,up,cols){const k=MALL_SHOPS[idx][2]||MALL_DECO[idx];if(!k)return;const P=mallPal();
 const W=(a,c)=>[X+x0+a,Z+s*c];
 const B=(a,y0,c,d,y1,f,h)=>mallBox(mb,X+x0+a,y0,Z+s*c,X+x0+d,y1,Z+s*f,typeof h==='string'?COL(h):h);
 const NB=(a,y0,c,d,y1,f,h)=>mallBox(nb,X+x0+a,y0,Z+s*c,X+x0+d,y1,Z+s*f,typeof h==='string'?COL(h):h);
 const col=(a,c,d,f)=>cols.push([X+x0+Math.min(a,d),Z+Math.min(s*c,s*f),X+x0+Math.max(a,d),Z+Math.max(s*c,s*f)]);
 // painel na parede do fundo (voltado para a frente da loja) e nas laterais
 const back=(t,a0,a1,y0,y1,c=11.62,rep=1)=>mallPanel(tm[t],X+x0+a0,y0,Z+s*c,X+x0+a1,y1,Z+s*c,[0,0,-s],[0,0,rep,1]);
 const sideP=(t,a,c0,c1,y0,y1,rep=1)=>{const z0=Z+Math.min(s*c0,s*c1),z1=Z+Math.max(s*c0,s*c1);mallPanel(tm[t],X+x0+a,y0,z0,X+x0+a,y1,z1,[a<4.7?1:-1,0,0],[0,0,rep,1])};
 const ceilGlow=(c)=>{const p=W(4.7,9);nb.geo(GEO.cyl16,mtx(p[0],4.17,p[1],1.1,.02,.7),c)};
 if(k==='music'){
  // carpete escuro, paredes de capas de discos, cubas inclinadas e ilha de bolinhas (referência VC)
  B(.02,.012,6.05,9.38,.03,11.6,'#3b3445');
  back('albums',.4,9.0,1.45,3.1,11.6,2);sideP('albums',.03,6.8,11.4,1.45,3.1,1.5);sideP('albums',9.37,6.8,11.4,1.45,3.1,1.5);
  // cubas de discos inclinadas ao longo das paredes
  const bin=(a0,a1,c0,c1,slopeSide)=>{B(a0,0,c0,a1,.82,c1,'#d9cdb8');const n=Math.round(Math.abs(a1-a0)/.42)||Math.round(Math.abs(c1-c0)/.42);for(let j=0;j<n;j++){const t0=j/n,t1=(j+.8)/n;if(Math.abs(a1-a0)>Math.abs(c1-c0)){const a=a0+(a1-a0)*t0,b=a0+(a1-a0)*t1;B(a,.82,c0+.05,b,1.12,c1-.05,['#e8505b','#f9d56e','#14b1ab','#2a3d66','#ff8c42','#a05195','#f2efe6'][j%7])}else{const c=c0+(c1-c0)*t0,d=c0+(c1-c0)*t1;B(a0+.05,.82,c,a1-.05,1.12,d,['#e8505b','#f9d56e','#14b1ab','#2a3d66','#ff8c42','#a05195','#f2efe6'][j%7])}}};
  bin(.35,1.15,6.9,11.2);bin(1.2,8.2,10.75,11.45);col(.3,6.85,1.2,11.5);col(1.15,10.7,8.25,11.5); // v77: sem a cuba da parede oposta ao balcão — abre o corredor do fundo entre a ilha e a estante
  // ilha central com bolinhas
  for(const [a,c] of [[3.8,8.4],[6.1,8.4]]){B(a,0,c,a+1.9,.85,c+1.2,'#f1e6d2');for(const [n,pa,pc,qa,qc] of [[[0,0,-s],a,c-.002,a+1.9,c-.002],[[0,0,s],a,c+1.202,a+1.9,c+1.202]]){const z=Z+s*pc;mallPanel(tm.dots,X+x0+pa,.02,z,X+x0+qa,.83,z,n,[0,0,1,1])}
   for(let j=0;j<4;j++)B(a+.12+j*.44,.85,c+.15,a+.48+j*.44,1.2,c+1.05,['#14b1ab','#ff8c42','#e8505b','#f9d56e'][j]);col(a,c,a+1.9,c+1.2)}
  // torre giratória de CDs e cartaz da banda
  {const p=W(4.7,11.5);const bm=signPlane(g,new THREE.MeshBasicMaterial({map:mallTex('band')}),p[0],3.55,Z+s*11.58,3.6,.9,s>0?Math.PI:0)}
  // balcão curvo escuro (em volta do ponto de atendimento existente)
  for(let j=0;j<=8;j++){const t=Math.PI*j/8,a=1.75+Math.cos(t)*1.4,c=9.4-Math.sin(t)*.6;B(a-.3,0,c-.26,a+.3,1.0,c+.26,j%2?'#1d1a22':'#26222c');B(a-.32,1.0,c-.28,a+.32,1.07,c+.28,'#3a3442')}
  col(.05,8.5,3.45,9.7);
  ceilGlow(COL(P.b).multiplyScalar(.6));
 }else if(k==='skate'){
  // v79r14: SKATE SHOP — piso de concreto com juntas, parede de shapes no fundo, estante de rodas e capacetes, rack de skates montados e podium com mini rampa
  const decks=['#e8282a','#1e6ad6','#2ab36a','#f2c21a','#ff4fa0','#7a4ad6','#ff8a1a','#2ac8c8','#1a1a1e','#f4f2ea'],inkOf=h=>['#1a1a1e','#7a4ad6','#1e6ad6','#e8282a'].includes(h)?'#f4f2ea':'#1a1a1e',wcol=['#f4f2ea','#f2c21a','#e8282a','#2ac8c8'];
  B(.02,.012,6.05,9.38,.03,11.6,'#8d8c90');for(let n=1;n<6;n++)B(.02+n*1.56,.03,6.05,.05+n*1.56,.034,11.6,'#6e6d72');
  // parede de shapes (2 fileiras) com trilhos
  for(let r=0;r<2;r++){const y=1.0+r*1.05;B(.35,y-.06,11.47,9.05,y-.01,11.6,'#2a2a30');for(let j=0;j<16;j++){const a=.5+j*.53,h=decks[(j*3+r*5)%10];B(a,y,11.5,a+.24,y+.85,11.57,h);const ik=inkOf(h);if((j+r)%3===0)B(a+.06,y+.2,11.495,a+.18,y+.65,11.5,ik);else if((j+r)%3===1){B(a+.04,y+.38,11.495,a+.2,y+.47,11.5,ik)}else{B(a+.08,y+.3,11.495,a+.16,y+.55,11.5,ik);B(a+.04,y+.38,11.495,a+.2,y+.47,11.5,ik)}}}
  // estante de rodas e capacetes (parede esquerda, antes do balcão)
  B(.05,0,6.45,.12,2.2,8.25,'#3a3440');for(const y of [.5,1.1,1.7]){B(.12,y,6.45,.58,y+.04,8.25,'#6a5a4a');for(let j=0;j<5;j++){const c=6.65+j*.35;if((j+Math.round(y*10))%2){for(let q=0;q<4;q++){const p=W(.3,c);mb.geo(GEO.cyl16,mtx(p[0],y+.075+q*.065,p[1],.06,.06,.06),COL(wcol[(j+q)%4]))}}else{const p=W(.32,c);mb.geo(GEO.hemi,mtx(p[0],y+.04,p[1],.15,.14,.15),COL(decks[(j*2+Math.round(y*10))%10]))}}}
  col(.05,6.45,.6,8.25);
  // rack de skates montados (parede direita)
  for(const y of [.8,1.45,2.1])for(let k2=0;k2<4;k2++){const c0=6.7+k2*1.0,h=decks[(k2*4+Math.round(y*10))%10],wh=wcol[(k2+Math.round(y*10))%4];B(9.04,y,c0,9.28,y+.025,c0+.8,h);B(9.06,y+.025,c0+.06,9.26,y+.03,c0+.74,'#26262a');for(const cw of [.14,.66]){B(9.1,y-.04,cw+c0-.03,9.22,y,cw+c0+.03,'#9aa0a8');B(9.06,y-.07,cw+c0-.035,9.1,y-.02,cw+c0+.035,wh);B(9.22,y-.07,cw+c0-.035,9.26,y-.02,cw+c0+.035,wh)}B(9.28,y-.1,c0+.38,9.36,y,c0+.42,'#2a2a30')}
  col(9.0,6.6,9.38,10.6);
  // podium com mini rampa e 3 skates em exposição
  B(4.4,0,8.7,7.7,.2,10.4,'#c9c2b6');B(4.38,.2,8.68,7.72,.24,10.42,'#8a8a90');for(let t=0;t<5;t++){B(4.4,.24,10.0+t*.08,7.7,.24+(t+1)*.07,10.08+t*.08,'#b8b0a4');B(4.4,.24,9.1-t*.08,7.7,.24+(t+1)*.07,9.18-t*.08,'#b8b0a4')}B(4.4,.6,10.36,7.7,.64,10.42,'#9aa0a8');
  for(let j=0;j<3;j++){const a=4.75+j*1.0,h=decks[(j*3+2)%10];B(a,.3,9.25,a+.24,.325,10.0,h);B(a+.06,.326,9.4,a+.18,.33,9.85,inkOf(h));for(const cw of [9.4,9.85]){const p=W(a+.12,cw);mb.geo(GEO.cyl16,mtx(p[0],.272,p[1],.03,.2,.03,0,0,Math.PI/2),COL(wcol[j%4]))}}
  col(4.4,8.7,7.7,10.4);
  {const p=W(4.7,11.55);signPlane(g,mallSignMat('SKATE · SHAPES · RODAS','#111118','#2ad6c8',512,64),p[0],3.12,p[1],4.2,.52,s>0?Math.PI:0)}
  NB(.4,2.95,11.6,9.0,2.99,11.62,COL(P.b).multiplyScalar(.9));
  ceilGlow(COL('#2ad6c8').multiplyScalar(.5));
 }else if(k==='cafe'){
  // cafeteria mais intimista: forro escuro, pendentes acesos e lousa
  B(.05,4.0,6.1,9.35,4.18,11.55,'#2a1d16');
  for(const [a,c] of [[5.5,9.3],[7.9,10.5],[1.8,7.2]])nb.geo(GEO.sph,mtx(X+x0+a,2.64,Z+s*c,.06,.05,.06),COL('#ffcf7a'));
  // v77: a lâmpada da frente do balcão flutuava — ganhou fio e cúpula como as das mesas
  B(1.775,2.9,7.175,1.825,4.12,7.225,'#42382e');B(1.48,2.72,6.95,2.12,2.9,7.45,'#e5bc73');
  B(7.6,1.5,11.5,8.8,2.5,11.56,'#1f2d24');B(7.55,1.45,11.52,8.85,2.55,11.57,'#6a4a32');
 }else if(k==='games'){
  B(.02,.012,6.05,9.38,.03,11.6,'#1b1630');back('games',.4,9.0,.3,3.0,11.6,2);
  // v77: fliperamas encostados na parede da direita de quem entra (antes bloqueavam a porta) + pôster com o logo do jogo na da esquerda
  {const d=s>0?1:-1,w0=s>0?.04:9.36,a1=w0+d*.8;for(let j=0;j<3;j++){const c=7.0+j*1.05;B(w0,0,c,a1,1.85,c+.85,'#241a3a');B(a1,1.0,c+.06,a1+d*.04,1.55,c+.79,'#08080c');NB(a1+d*.04,1.04,c+.1,a1+d*.05,1.5,c+.75,j%2?P.a:P.b);NB(a1,1.66,c+.04,a1+d*.01,1.8,c+.81,P.d);B(a1,.8,c,a1+d*.25,.92,c+.85,'#30304a');col(w0,c,a1+d*.25,c+.85)}
   const lw=s>0?9.36:.04,lt=mallLogoTex();if(lt){const p=W(lw+(s>0?-.035:.035),8.9),m=new THREE.MeshBasicMaterial({map:lt,transparent:true,color:0xd8d0e0});signPlane(g,m,p[0],2.35,p[1],3.6,1.26,(s>0?-1:1)*Math.PI/2);B(lw-.02,1.66,7.05,lw+.02,3.04,10.75,'#0e0a18')}}
  for(const a of [4.4,6.6]){B(a,0,8.6,a+1.6,.9,9.6,'#2a2440');for(let j=0;j<6;j++)B(a+.1+j*.25,.9,8.75,a+.3+j*.25,1.15,9.45,['#2a6ad6','#d62828','#3ab36a','#f2c21a','#7a4ad6','#ff6fae'][j]);col(a,8.6,a+1.6,9.6)}
  NB(.5,3.3,11.5,8.9,3.36,11.56,P.b);ceilGlow(COL('#7a4ad6').multiplyScalar(.7));
 }else if(k==='shoes'){
  back('shoes',.4,9.0,.3,3.0,11.6,2);sideP('shoes',.03,7.2,11.4,.3,2.6,1.2);
  for(const a of [4.4,6.8]){B(a,0,8.5,a+1.4,.42,9.3,'#7a4a5a');B(a+.05,.42,8.55,a+1.35,.48,9.25,'#a0607a');col(a,8.5,a+1.4,9.3)}
  B(8.5,0,6.6,8.9,2.2,6.75,'#d8f0ff');B(8.45,0,6.55,8.95,.1,6.8,'#3a3a40');col(8.45,6.55,8.95,6.8);
 }else if(k==='toys'){
  B(.02,.012,6.05,9.38,.03,11.6,'#f2d48a');back('toys',.4,9.0,.3,3.0,11.6,2);
  {const p=W(7.4,9.6);mb.geo(GEO.sph,mtx(p[0],.75,p[1],.75,.75,.7),COL('#a0683a'));mb.geo(GEO.sph,mtx(p[0],1.75,p[1],.5,.5,.48),COL('#a0683a'));for(const d of [-.35,.35])mb.geo(GEO.sph,mtx(p[0]+d,2.15,p[1],.17,.17,.12),COL('#7a4a2a'));col(6.6,8.8,8.2,10.4)}
  for(let j=0;j<7;j++){const p=W(2+j*.45,8.6+(j%2)*.5);mb.geo(GEO.sph,mtx(p[0],.22,p[1],.22,.22,.22),COL(['#ff3b3b','#ffd21a','#2a8ad6','#3ab36a','#ff8a1a','#ff6fae','#7a4ad6'][j]))}
  B(1.6,0,8.2,5.2,.12,9.6,'#2a8ad6');col(1.6,8.2,5.2,9.6);
 }else if(k==='optic'){
  back('glasses',.4,9.0,.4,3.0,11.6,2);sideP('glasses',.03,7.0,11.4,.6,2.6,1.4);
  for(const a of [3.2,6.0]){B(a,0,8.6,a+1.3,1.0,9.3,'#e8f0f2');B(a+.05,1.0,8.65,a+1.25,1.04,9.25,'#bfe6f4');col(a,8.6,a+1.3,9.3)}
  {const p=W(9.05,8.6);mb.geo(GEO.cyl16,mtx(p[0],1.6,p[1],.45,.03,.45,0,0,Math.PI/2),COL('#d8f0ff'))}
 }else if(k==='beach'){
  // v77: MODA PRAIA — piso de "areia", pranchas na parede, araras de biquíni/sunga e guarda-sol
  B(.02,.012,6.05,9.38,.03,11.6,'#d8c8a0');back('beach',.4,9.0,.4,3.0,11.6,2);
  for(let j=0;j<4;j++){const a=1.0+j*.62,cc=['#ff8a1a','#2ac8c8','#f2c21a','#ff6fae'][j],p=W(a,11.42);mb.geo(GEO.sph,mtx(p[0],1.75,p[1],.25,1.45,.05),COL(cc));mb.geo(GEO.sph,mtx(p[0],1.75,p[1]-s*.02,.04,1.35,.055),COL('#f2f2ee'))}
  for(const [o,c] of [[4.0,10.55],[6.6,7.0]]){B(o,0,c-.04,o+.06,1.55,c+.04,'#8a8a90');B(o+2.4,0,c-.04,o+2.46,1.55,c+.04,'#8a8a90');B(o,1.5,c-.03,o+2.46,1.55,c+.03,'#8a8a90');
   for(let q=0;q<7;q++){const a=o+.25+q*.3,cc=['#1e5ab0','#d62828','#2ac8c8','#f2c21a','#ff6fae','#3ab36a','#1b1b1b'][(q+(c>8?3:0))%7];B(a,1.0,c-.1,a+.2,1.45,c+.1,cc)}col(o-.05,c-.14,o+2.5,c+.14)}
  {const p=W(6.3,9.2);mb.geo(GEO.cyl,mtx(p[0],1.3,p[1],.06,2.3,.06),COL('#e8e8e8'));mb.geo(GEO.cone,mtx(p[0],2.6,p[1],1.7,.55,1.7),COL('#1e9ab0')); // mesmo guarda-sol da praia
   B(5.3,0,8.9,7.3,.38,9.5,'#c8a070');B(5.35,.38,8.95,7.25,.42,9.45,'#1e9ab0');col(5.3,8.9,7.3,9.5)}
 }else if(k==='perfume'){
  B(.02,.012,6.05,9.38,.03,11.6,'#e9d6dd');back('perfume',.4,9.0,.5,3.0,11.6,2);
  for(const [a,c] of [[3.0,8.2],[6.2,8.2],[4.6,9.8]]){B(a-.35,0,c-.35,a+.35,1.0,c+.35,'#f2e8ee');B(a-.38,1.0,c-.38,a+.38,1.04,c+.38,'#e8c040');for(let j=0;j<4;j++)NB(a-.25+j*.15,1.04,c-.05,a-.17+j*.15,1.22+(j%2)*.08,c+.05,['#ff9ad5','#ffd36a','#9ad8ff','#c6a0ff'][j]);col(a-.38,c-.38,a+.38,c+.38)}
  ceilGlow(COL(P.c).multiplyScalar(.6));
 }else if(k==='pizza'){
  B(.02,.012,6.05,9.38,.03,11.6,'#c9b79a');
  // balcão, forno a lenha e mesas
  B(.3,0,10.2,6.0,1.05,10.8,'#7a2a22');B(.25,1.05,10.15,6.05,1.12,10.85,'#e8d8c0');col(.25,10.15,6.05,10.85);
  {const p=W(7.6,10.9);mb.geo(GEO.hemi,mtx(p[0],1.0,p[1],1.15,1.1,.9),COL('#8a4a32'));B(6.4,0,10.2,8.8,1.0,11.6,'#6a3a2a');NB(7.2,1.05,10.08,8.0,1.45,10.1,'#ff8a2a');col(6.4,10.0,8.8,11.6)}
  {const p=W(3.1,11.55);signPlane(g,new THREE.MeshBasicMaterial({map:mallTex('pizza')}),p[0],2.35,Z+s*11.56,1.4,1.4,s>0?Math.PI:0)}
  for(const [a,c] of [[2.2,8.0],[5.2,8.0]]){B(a-.45,.72,c-.45,a+.45,.78,c+.45,'#f2f2ee');for(let q=0;q<4;q++)B(a-.45+(q%2)*.45,.781,c-.45+(q>>1)*.45,a+(q%2)*.45,.783,c+(q>>1)*.45,(q===0||q===3)?'#d62828':'#f2f2ee');B(a-.05,0,c-.05,a+.05,.72,c+.05,'#2a2a30');for(const d of [-.75,.75])B(a+d-.2,.0,c-.2,a+d+.2,.48,c+.2,'#d62828');col(a-.95,c-.5,a+.95,c+.5)}
 }else if(k==='cinema'){
  B(.02,.012,6.05,9.38,.03,11.6,'#5a0f18');B(.05,4.0,6.1,9.35,4.18,11.55,'#120a10');
  mallPanel(tm.posters,X+x0+.6,.9,Z+s*11.6,X+x0+8.8,3.6,Z+s*11.6,[0,0,-s]);
  B(.4,0,7.2,2.6,1.15,8.4,'#2a0a12');B(.35,1.15,7.15,2.65,1.22,8.45,'#d8b060');B(.4,1.22,7.9,2.6,2.6,7.95,'#bfe6f4');col(.35,7.15,2.65,8.45);
  {B(7.0,0,7.2,8.0,1.0,8.0,'#c81e2a');B(7.05,1.0,7.25,7.95,1.9,7.95,'#fff1a8');B(7.0,1.9,7.2,8.0,2.05,8.0,'#c81e2a');for(let j=0;j<10;j++){const p=W(7.15+(j%5)*.17,7.4+(j>>1)%3*.2);mb.geo(GEO.ico,mtx(p[0],1.1+(j%3)*.12,p[1],.07,.07,.07),COL('#fff6d0'))}col(7.0,7.2,8.0,8.0)}
  for(const a of [3.4,4.6,5.8]){B(a-.05,0,8.55,a+.05,.95,8.65,'#d8b060');}B(3.4,.85,8.58,5.8,.9,8.62,'#a01020');col(3.3,8.5,5.9,8.7);
  NB(.4,3.75,11.5,9.0,3.8,11.55,'#ff3040');
 }else if(k==='jewel'){
  for(const a of [4.6,7.0]){NB(a+.05,1.5,8.25,a+.85,1.53,10.55,'#ffe7a0')}
 }else if(k==='pharm'){
  NB(4.38,3.35,11.5,4.62,3.85,11.55,'#3ae08a');NB(4.23,3.48,11.5,4.77,3.72,11.55,'#3ae08a');
 }else if(k==='tech'){
  NB(.6,2.42,11.33,9.3,2.46,11.36,P.a);
 }else if(k==='wear'){
  NB(x0>=0?.4:.4,3.3,11.55,9.0,3.36,11.6,P.b);
 }
}

/* ---------- v77: propagandas das próprias lojas (quadros nas paredes) ---------- */
/* v77: coqueiro leve e bonitinho — tronco curvo afunilado em anéis, folhas arqueadas com folíolos (V dobrado, dupla face) e cocos.
   Geometrias criadas uma vez; ~600 triângulos por coqueiro (o antigo usava ~1000 com folhas em "bolha"). */
const PALM_GEO=(()=>{const mk=N=>{const P=[],push=(a,b,c)=>P.push(...a,...b,...c);const L=[],C=[],Rr=[];
 for(let i=0;i<=N;i++){const t=i/N,x=t,y=.42*t-.95*t*t,w=.2*Math.sin(Math.PI*Math.min(1,t*1.08))*(i%2?.62:1)+.004,f=w*.5;C.push([x,y,0]);L.push([x,y-f,-w]);Rr.push([x,y-f,w])}
 for(let i=0;i<N;i++){for(const S of [L,Rr]){const a=S[i],b=S[i+1],c=C[i],d=C[i+1];
   if(S===L){push(c,a,b);push(c,b,d);push(c,b,a);push(c,d,b)}else{push(c,b,a);push(c,d,b);push(c,a,b);push(c,b,d)}}}
 const frond=new THREE.BufferGeometry();frond.setAttribute('position',new THREE.Float32BufferAttribute(P,3));frond.computeVertexNormals();return frond};
 // v77: frondS = folha baixa mais simples (5 segmentos, 40 tri) para a saia de folhas velhas caídas
 const frond=mk(4),frondS=mk(4),trunk=new THREE.CylinderGeometry(.82,1,1,7,1,true).toNonIndexed();return{frond,frondS,trunk}})();
/* v2 r2: coqueiro-esqueleto do Mundo Invertido — vareta arqueada no lugar de cada folha (mesmos sorteios, seed intacta) */
function palmStick(mb,top,a,tilt,l,s,col,droop){let x=top.x,y=top.y,z=top.z,ang=tilt;const n=3,st=l/n,ca=Math.cos(a),sa=Math.sin(a);
 for(let i=0;i<n;i++){const nx=x+ca*Math.cos(ang)*st,ny=y+Math.sin(ang)*st,nz=z+sa*Math.cos(ang)*st;wseg(mb,x,y,z,nx,ny,nz,(.035-.009*i)*s,col,PALM_GEO.trunk);
  if(i>0){for(const sd of[-1,1]){const pa=a+sd*1.25,q=st*.55;wseg(mb,nx,ny,nz,nx+Math.cos(pa)*q,ny-q*.45,nz+Math.sin(pa)*q,.012*s,col,PALM_GEO.trunk)}}
  x=nx;y=ny;z=nz;ang-=droop}}
function palmBuild(mb,x,y0,z,s,night,rnd,opt){opt=opt||{};const inv=S.style==='inverted',r=()=>rnd?rnd():Math.random(),h=(opt.h||(5+r()*3))*s,la=r()*Math.PI*2,lean=(opt.lean!=null?opt.lean:.10+r()*.16)*h;
 const seg=6,pts=[];for(let i=0;i<=seg;i++){const t=i/seg,b=t*t;pts.push(new THREE.Vector3(x+Math.cos(la)*lean*b,y0+h*t,z+Math.sin(la)*lean*b))}
 const tA=COL(night?'#3a2a35':'#7a5a3e'),tB=COL(night?'#2c2029':'#5f4530'),up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),m=new THREE.Matrix4(),sc=new THREE.Vector3();
 const iC=COL('#1e1a1c'),iC2=COL('#2a2224');
 for(let i=0;i<seg;i++){const a=pts[i],b=pts[i+1],d=b.clone().sub(a),len=d.length(),rad=(.24-.09*i/seg)*s*(inv?.42:1);q.setFromUnitVectors(up,d.normalize());sc.set(rad,len*1.04,rad);m.compose(a.clone().add(b).multiplyScalar(.5),q,sc);mb.geo(PALM_GEO.trunk,m,inv?(i%2?iC2:iC):i%2?tB:tA)}
 const top=pts[seg],G=night?['#1f5a4a','#1b4a52','#2a6a4c','#22605a']:['#3f8a3a','#4f9a40','#2f7a3a','#5aa048'];
 {const r1=r(),r2=r();mb.geo(GEO.ico,mtx(top.x,top.y-.05*s,top.z,.26*s*(inv?.5:1),.22*s*(inv?.6:1),.26*s*(inv?.5:1),r1,r2,0),inv?iC:tA)}
 for(let k=0;k<3;k++){const a=la+k*2.1+.4,r1=r(),r2=r();if(!inv)mb.geo(GEO.ico,mtx(top.x+Math.cos(a)*.2*s,top.y-.22*s,top.z+Math.sin(a)*.2*s,.13*s,.15*s,.13*s,r1,r2,0),COL(night?'#4a3a2a':'#6a4a22'))}
 for(const [n,tilt,len,dk] of [[4,.5,1.9,.85],[6,-.05,2.6,1]]){const off=r()*6.28;for(let i=0;i<n;i++){const a=off+i/n*Math.PI*2+(r()-.5)*.35,l=len*s*(.85+r()*.3),c=COL(G[(r()*G.length)|0]).multiplyScalar(dk);
   const lz=l*(.9+r()*.25),tl=tilt+(r()-.5)*.25;if(inv)palmStick(mb,top,a,tl,l*.9,s,i&1?iC:iC2,.45);else mb.geo(PALM_GEO.frond,mtx(top.x,top.y,top.z,l,l,lz,0,-a,tl),c)}}
 // v77: saia de folhas menores e mais velhas, penduradas abaixo da copa (como no coqueiro real)
 {const n=opt.lowN!=null?opt.lowN:0,off=r()*6.28,Y=night?['#28463a','#2e4a3e']:['#6f8a34','#86913a','#5f7a30'];for(let i=0;i<n;i++){const a=off+i/n*Math.PI*2+(r()-.5)*.5,l=1.45*s*(.85+r()*.3),c=COL(Y[(r()*Y.length)|0]).multiplyScalar(.85);
   const tl=-.75+(r()-.5)*.3;if(inv)palmStick(mb,{x:top.x,y:top.y-.22*s,z:top.z},a,tl,l*.8,s,iC,.3);else mb.geo(PALM_GEO.frondS,mtx(top.x,top.y-.22*s,top.z,l,l*1.15,l*.8,0,-a,tl),c)}}
 return top.y}
const MALL_AD_TXT={wear:['COLEÇÃO VERÃO 86','ATÉ 50% OFF'],food:['TUDO PRA SUA NOITE','ABERTO ATÉ TARDE'],games:['NOVOS CARTUCHOS!','JOGUE AGORA'],shoes:['PISE COM ESTILO','LANÇAMENTOS'],toys:['DIVERSÃO GARANTIDA','PRA TODAS AS IDADES'],cafe:['CAFÉ FRESQUINHO','+25 DE ENERGIA'],
 optic:['VEJA O VERÃO','ÓCULOS ESPELHADOS'],jewel:['BRILHE NA NOITE','OURO 18K'],tech:['WALKMAN · TV · VHS','O FUTURO CHEGOU'],bag:['LEVE TUDO','MOCHILAS NOVAS'],music:['VINIL · K7 · CD','NEON PALMS AO VIVO'],beach:['VERÃO O ANO TODO','SUNGAS · BIQUÍNIS'],
 perfume:['ESSÊNCIA DE MIAMI','NOVA FRAGRÂNCIA'],pizza:['FATIA $3','FORNO A LENHA'],pharm:['CUIDE-SE','24 HORAS'],cinema:['PALM VICE','EM CARTAZ']};
// v77: logo do jogo (o mesmo da cena final da primeira missão) como textura de pôster
let MALL_LOGO=null;function mallLogoTex(){if(MALL_LOGO)return MALL_LOGO;try{const el=$('#prologueTitle');if(!el)return null;prologueTitleDraw();const c=cv(el.width,el.height),g=c.getContext('2d');g.fillStyle='#0e0a18';g.fillRect(0,0,c.width,c.height);g.drawImage(el,0,0);MALL_LOGO=new THREE.CanvasTexture(c);MALL_LOGO.anisotropy=4;return MALL_LOGO}catch(e){console.error(e);return null}}
function mallKind(idx){return MALL_SHOPS[idx][2]||MALL_DECO[idx]||'cinema'}
function mallAdIcon(g,k,x,y,r,c,c2){g.save();g.translate(x,y);g.fillStyle=c;g.strokeStyle=c;g.lineWidth=r*.12;g.lineCap='round';g.lineJoin='round';const P=(pts)=>{g.beginPath();pts.forEach(([a,b],i)=>i?g.lineTo(a*r,b*r):g.moveTo(a*r,b*r));g.closePath();g.fill()};
 switch(k){
  case 'music':g.beginPath();g.arc(0,0,r,0,7);g.fill();g.fillStyle=c2;g.beginPath();g.arc(0,0,r*.32,0,7);g.fill();g.fillStyle=c;g.beginPath();g.arc(0,0,r*.07,0,7);g.fill();g.strokeStyle=c2;g.lineWidth=1.5;for(const q of [.5,.65,.8]){g.beginPath();g.arc(0,0,r*q,0,7);g.stroke()}break;
  case 'cafe':g.fillRect(-r*.6,-r*.3,r*1.1,r*.95);g.beginPath();g.arc(r*.55,r*.15,r*.28,-1.4,1.4);g.stroke();for(const d of [-.3,0,.3]){g.beginPath();g.moveTo(d*r,-r*.45);g.quadraticCurveTo(d*r+r*.15,-r*.7,d*r,-r*.95);g.stroke()}break;
  case 'games':g.fillRect(-r,-r*.35,r*2,r*.8);g.fillStyle=c2;g.fillRect(-r*.75,-r*.12,r*.45,r*.14);g.fillRect(-r*.6,-r*.27,r*.14,r*.45);g.beginPath();g.arc(r*.45,-r*.05,r*.12,0,7);g.arc(r*.75,r*.12,r*.12,0,7);g.fill();break;
  case 'shoes':P([[-1,.4],[-1,-.2],[-.6,-.5],[-.2,-.1],[.7,.1],[1,.3],[1,.4]]);g.fillStyle=c2;g.fillRect(-r,r*.32,r*2,r*.12);break;
  case 'toys':g.beginPath();g.arc(0,r*.2,r*.6,0,7);g.arc(0,-r*.55,r*.38,0,7);g.fill();g.beginPath();g.arc(-r*.32,-r*.85,r*.15,0,7);g.arc(r*.32,-r*.85,r*.15,0,7);g.fill();break;
  case 'optic':g.lineWidth=r*.14;for(const d of [-.52,.52]){g.beginPath();g.arc(d*r,0,r*.42,0,7);g.stroke()}g.beginPath();g.moveTo(-r*.12,-r*.05);g.lineTo(r*.12,-r*.05);g.stroke();break;
  case 'jewel':P([[-.8,-.3],[-.4,-.8],[.4,-.8],[.8,-.3],[0,.9]]);g.strokeStyle=c2;g.lineWidth=2;g.beginPath();g.moveTo(-.8*r,-.3*r);g.lineTo(.8*r,-.3*r);g.moveTo(-.4*r,-.8*r);g.lineTo(0,.9*r);g.lineTo(.4*r,-.8*r);g.stroke();break;
  case 'tech':g.fillRect(-r*.9,-r*.7,r*1.8,r*1.2);g.fillStyle=c2;g.fillRect(-r*.75,-r*.55,r*1.5,r*.9);g.fillStyle=c;g.fillRect(-r*.2,r*.5,r*.4,r*.3);g.fillRect(-r*.5,r*.78,r,r*.1);break;
  case 'bag':g.fillRect(-r*.8,-r*.35,r*1.6,r*1.1);g.lineWidth=r*.14;g.beginPath();g.arc(0,-r*.35,r*.42,Math.PI,0);g.stroke();g.fillStyle=c2;g.fillRect(-r*.8,r*.05,r*1.6,r*.1);break;
  case 'beach':g.beginPath();g.arc(0,-r*.1,r*.85,Math.PI,0);g.closePath();g.fill();g.fillStyle=c2;for(const d of [-.57,0,.57]){g.beginPath();g.arc(d*r,-r*.1,r*.28,Math.PI,0);g.fill()}g.fillStyle=c;g.fillRect(-r*.05,-r*.1,r*.1,r*.95);break;
  case 'perfume':g.fillRect(-r*.55,-r*.3,r*1.1,r*1.15);g.fillRect(-r*.18,-r*.62,r*.36,r*.34);g.fillStyle=c2;g.fillRect(-r*.4,-r*.1,r*.18,r*.75);break;
  case 'pizza':P([[0,-.9],[.75,.7],[-.75,.7]]);g.fillStyle=c2;for(const [a,b] of [[0,-.2],[-.25,.35],[.25,.35]]){g.beginPath();g.arc(a*r,b*r,r*.13,0,7);g.fill()}break;
  case 'pharm':g.fillRect(-r*.28,-r*.85,r*.56,r*1.7);g.fillRect(-r*.85,-r*.28,r*1.7,r*.56);break;
  case 'cinema':g.fillRect(-r*.9,-r*.5,r*1.4,r*1.0);P([[.5,-.2],[.95,-.5],[.95,.5],[.5,.2]]);g.fillStyle=c2;for(let k=0;k<4;k++)g.fillRect(-r*.8+k*r*.35,-r*.42,r*.18,r*.12);break;
  case 'wear':P([[-.35,-.8],[-1,-.45],[-.8,0],[-.55,-.15],[-.55,.85],[.55,.85],[.55,-.15],[.8,0],[1,-.45],[.35,-.8],[0,-.55]]);break;
  case 'food':g.fillRect(-r*.75,-r*.2,r*1.5,r*.95);g.lineWidth=r*.1;g.beginPath();g.moveTo(-r*.6,-r*.2);g.lineTo(-r*.35,-r*.8);g.lineTo(r*.35,-r*.8);g.lineTo(r*.6,-r*.2);g.stroke();break;
  default:g.beginPath();g.arc(0,0,r,0,7);g.fill()}
 g.restore()}
function mallAdCanvas(idx,v){const c=cv(512,256),g=c.getContext('2d'),[name,acc]=MALL_SHOPS[idx],k=mallKind(idx),a=acc==='#1a1a2a'?'#ffd23a':acc,T=MALL_AD_TXT[k]||['',''],up=idx>=8,lay=(idx*3+v)%4;
 const dark='#120a1c',cream='#f6ecd8';g.textAlign='center';g.textBaseline='middle';const F=(w,sz,f='Fredoka, Inter, sans-serif')=>{g.font=`${w} ${sz}px ${f}`};const fit=(t,w,sz,wt)=>{let s=sz;F(wt,s);while(g.measureText(t).width>w&&s>10){s--;F(wt,s)}};
 if(lay===0){const gr=g.createLinearGradient(0,0,512,256);gr.addColorStop(0,a);gr.addColorStop(1,dark);g.fillStyle=gr;g.fillRect(0,0,512,256);g.fillStyle='rgba(255,255,255,.08)';for(let i=-4;i<12;i++){g.save();g.translate(i*60,0);g.rotate(.5);g.fillRect(0,-60,22,420);g.restore()}
  mallAdIcon(g,k,400,128,70,cream,a);g.fillStyle='#fff';fit(name,300,46,'900');g.textAlign='left';g.fillText(name,28,88);F('700',22,'Inter, sans-serif');g.fillStyle='#ffe9a8';g.fillText(T[0],28,140);g.fillStyle='#fff';F('600',17,'Inter, sans-serif');g.fillText(T[1],28,176)}
 else if(lay===1){g.fillStyle=cream;g.fillRect(0,0,512,256);g.fillStyle=a;g.fillRect(0,0,190,256);mallAdIcon(g,k,95,118,62,cream,a);g.fillStyle=dark;fit(name,290,40,'900');g.fillText(name,352,82);g.fillStyle=a;g.fillRect(232,108,240,4);F('800',21,'Inter, sans-serif');g.fillStyle=dark;g.fillText(T[0],352,144);F('600',16,'Inter, sans-serif');g.fillStyle='#6a5a6a';g.fillText(T[1],352,178);g.fillStyle=a;F('800',13,'Inter, sans-serif');g.fillText(up?'1º ANDAR':'TÉRREO',95,232)}
 else if(lay===2){const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#1b0a33');gr.addColorStop(.62,a);gr.addColorStop(.63,dark);gr.addColorStop(1,dark);g.fillStyle=gr;g.fillRect(0,0,512,256);g.fillStyle='#ffd36a';g.beginPath();g.arc(256,160,58,Math.PI,0);g.fill();g.fillStyle=dark;for(let i=0;i<5;i++)g.fillRect(190,118+i*9+i*i,132,2+i*.5);g.strokeStyle=a;g.lineWidth=1.5;for(let i=0;i<6;i++){g.beginPath();g.moveTo(0,165+i*i*2.6);g.lineTo(512,165+i*i*2.6);g.stroke()}
  g.fillStyle='#fff';g.shadowColor=a;g.shadowBlur=14;fit(name,440,50,'italic 900');g.fillText(name,256,56);g.shadowBlur=0;F('800',20,'Inter, sans-serif');g.fillStyle='#ffe9a8';g.fillText(T[0]+'  ·  '+T[1],256,224)}
 else{g.fillStyle=dark;g.fillRect(0,0,512,256);for(let i=0;i<9;i++)mallAdIcon(g,k,40+i*58,40+(i%2)*14,18,i%2?a:'#3a2a4a',dark);g.fillStyle=a;g.fillRect(0,92,512,96);g.fillStyle=dark;fit(name,470,48,'900');g.fillText(name,256,140);g.fillStyle='#fff';F('800',19,'Inter, sans-serif');g.fillText(T[0],256,214);g.fillStyle='#ffd36a';g.beginPath();g.arc(458,206,36,0,7);g.fill();g.fillStyle=dark;F('900',14,'Inter, sans-serif');g.fillText(up?'1º':'NOVO',458,206)}
 g.strokeStyle='#d8c08a';g.lineWidth=8;g.strokeRect(4,4,504,248);return c}
for(let i=0;i<16;i++)for(let v=0;v<2;v++)MALL_TP['ad'+i+'_'+v]=()=>mallAdCanvas(i,v);
/* moldura + propaganda: lado s, centro gx, largura w (parede voltada para o corredor) */
function mallAdFrame(mb,tm,nb,X,Z,gx,zw,s,w,y0,y1,idx,v,lit){const B=(a,b,c,d,e,f,h)=>mallBox(mb,X+a,b,Z+c,X+d,e,Z+f,COL(h));const n=[0,0,-s];
 mallPanel(tm['ad'+idx+'_'+v],X+gx-w/2,y0,Z+zw,X+gx+w/2,y1,Z+zw,n);B(gx-w/2-.1,y0-.08,zw-.05,gx+w/2+.1,y0,zw+.05,'#2a2430');B(gx-w/2-.1,y1,zw-.05,gx+w/2+.1,y1+.08,zw+.05,'#2a2430');
 for(const e of [-1,1])B(gx+e*(w/2+.05)-.05,y0,zw-.05,gx+e*(w/2+.05)+.05,y1,zw+.05,'#2a2430');
 if(lit){const c=COL(mallPal().lamp);for(const d of [-w/3,w/3]){mallBox(mb,X+gx+d-.03,y1+.08,Z+zw-s*.02,X+gx+d+.03,y1+.12,Z+zw-s*.42,COL('#2a2a30'));nb.geo(GEO.hemi,mtx(X+gx+d,y1+.06,Z+zw-s*.42,.12,.07,.12,Math.PI,0,0),c)}}}
/* ---------- v77: fachadas com identidade (uma por tipo de loja) ---------- */
function mallFacade(g,mb,nb,X,Z,x0,s,idx,up,cols){const col=(a,c,d,f)=>cols&&cols.push([X+x0+Math.min(a,d),Z+Math.min(s*c,s*f),X+x0+Math.max(a,d),Z+Math.max(s*c,s*f)]);const k=mallKind(idx),acc=MALL_SHOPS[idx][1],P=mallPal(),x1=x0+9.4,m=x0+4.7;
 const B=(a,y0,c,d,y1,f,h)=>mallBox(mb,X+x0+a,y0,Z+s*c,X+x0+d,y1,Z+s*f,typeof h==='string'?COL(h):h);
 const NB=(a,y0,c,d,y1,f,h)=>mallBox(nb,X+x0+a,y0,Z+s*c,X+x0+d,y1,Z+s*f,typeof h==='string'?COL(h):h);
 const awning=(c1,c2,y=3.35,depth=.9,n=10)=>{for(let j=0;j<n;j++){const a=.1+j*9.2/n,b=a+9.2/n;for(let st=0;st<3;st++){const yy=y-st*.14,dd=5.8-st*depth/3;B(a,yy-.12,dd-depth/3,b,yy,dd,j%2?c1:c2)}B(a,y-.62,5.8-depth-.02,b,y-.42,5.8-depth+.02,j%2?c1:c2)}};
 const bulbs=(y,col,step=.42)=>{for(let a=.25;a<9.2;a+=step)nb.geo(GEO.bulb,mtx(X+x0+a,y,Z+s*5.74,.045,.045,.045),COL(col))};
 const sideCol=(h,w=.32)=>{for(const a of [-.35,9.4-w+.35])B(a,0,5.62,a+w,h,5.82,h>4?'#2a2430':acc)};
 switch(k){
  case 'wear':B(-.35,0,5.7,.15,4.6,5.8,'#121216');B(9.25,0,5.7,9.75,4.6,5.8,'#121216');B(.15,3.36,5.7,9.25,3.42,5.78,'#e8c060');B(.15,4.55,5.7,9.25,4.62,5.78,'#e8c060');NB(1.2,4.72,5.8,8.2,4.76,5.84,acc);
   for(const a of [.9,6.4]){B(a,0,5.86,a+2.1,.25,5.94,'#e8c060')}break;
  case 'food':awning('#2ad67a','#f4f4ee');B(.4,0,5.0,1.4,.9,5.6,'#2a6a3a');col(.38,4.98,1.42,5.62);B(.45,.9,5.05,1.35,1.0,5.55,'#f2c21a');break;
  case 'games':for(let a=-.3;a<9.7;a+=.32){const j=Math.round((a+.3)/.32);NB(a,4.62,5.75,a+.26,4.88,5.81,['#ff3b3b','#2af0ff','#ffd21a','#3ab36a','#ff4fd8'][j%5])}for(let y=.2;y<4.6;y+=.32){const j=Math.round(y/.32);for(const a of [-.32,9.46])NB(a,y,5.75,a+.26,y+.26,5.81,['#2af0ff','#ff4fd8','#ffd21a'][j%3])}break;
  case 'shoes':B(-.35,0,5.7,.15,4.6,5.8,'#6a3a22');B(9.25,0,5.7,9.75,4.6,5.8,'#6a3a22');for(let j=0;j<12;j++){const t=Math.PI*j/11,a=4.7+Math.cos(t)*4.3,y=3.42+Math.sin(t)*.9;B(a-.22,y-.1,5.72,a+.22,y+.1,5.8,'#8a5a32')}break;
  case 'toys':for(const a of [-.35,9.25])for(let j=0;j<7;j++)B(a,j*.66,5.68,a+.5,j*.66+.62,5.82,['#ff3b3b','#ffd21a','#2a8ad6','#3ab36a','#ff8a1a','#ff6fae','#7a4ad6'][j]);awning('#ff3b3b','#ffd21a',3.35,.7,12);break;
  case 'cafe':awning('#5a3422','#efe0c4',3.35,1.0,8);for(const a of [-.1,9.5]){B(a-.04,2.55,5.62,a+.04,2.62,5.4,'#2a2a30');nb.geo(GEO.sph,mtx(X+x0+a,2.5,Z+s*5.35,.07,.07,.07),COL('#ffcf7a'))}
   B(7.6,0,4.7,8.4,.06,5.1,'#3a2a20');col(7.6,4.7,8.4,5.1);B(7.7,.06,4.85,8.3,1.05,4.9,'#1f2d24');B(7.68,1.05,4.83,8.32,1.1,4.92,'#6a4a32');break;
  case 'optic':for(const d of [-1.05,1.05]){for(let j=0;j<16;j++){const t=j/16*Math.PI*2,t2=(j+1)/16*Math.PI*2;const ax=4.7+d+Math.cos(t)*.75,ay=5.05+Math.sin(t)*.42;NB(ax-.045,ay-.045,5.76,ax+.045,ay+.045,5.82,P.a)}}NB(4.45,5.12,5.76,4.95,5.18,5.82,P.a);break;
  case 'jewel':B(-.35,0,5.7,.15,4.6,5.8,'#16161c');B(9.25,0,5.7,9.75,4.6,5.8,'#16161c');for(const a of [-.1,9.5])NB(a-.02,.3,5.81,a+.02,4.3,5.83,'#ffe7a0');
   {const cx=4.7,cy=5.1,r=.35;for(const [a,b,c,d] of [[-r,0,0,-r*1.2],[0,-r*1.2,r,0],[r,0,r*.55,r*.45],[r*.55,r*.45,-r*.55,r*.45],[-r*.55,r*.45,-r,0]]){const L=Math.hypot(c-a,d-b),ang=Math.atan2(d-b,c-a);nb.geo(GEO.cyl,mtx(X+x0+cx+(a+c)/2,cy+(b+d)/2,Z+s*5.79,.03,L,.03,0,0,ang-Math.PI/2),COL('#ffe7a0'))}}break;
  case 'tech':for(let a=.3;a<9.2;a+=.5)NB(a,4.64,5.76,a+.36,4.7,5.82,P.a);for(const a of [-.3,9.3]){B(a,2.2,5.55,a+.4,3.2,5.62,'#0a0a10');NB(a+.04,2.26,5.54,a+.36,3.14,5.55,['#2a8ad6','#ff4fd8'][a<0?0:1])}break;
  case 'bag':B(-.35,0,5.7,.15,4.6,5.8,'#6a4026');B(9.25,0,5.7,9.75,4.6,5.8,'#6a4026');for(let y=.3;y<4.4;y+=.3)for(const a of [-.12,9.5])B(a,y,5.81,a+.06,y+.14,5.82,'#e8c890');break;
  case 'music':{const cx=X+x0+8.6,cy=4.0;nb.geo(GEO.cyl16,mtx(cx,cy,Z+s*5.7,.95,.06,.95,Math.PI/2,0,0),COL('#0d0b10'));nb.geo(GEO.cyl16,mtx(cx,cy,Z+s*5.66,.34,.07,.34,Math.PI/2,0,0),COL(acc));for(const r of [.55,.75])for(let j=0;j<20;j++){const t=j/20*Math.PI*2;nb.geo(GEO.bulb,mtx(cx+Math.cos(t)*r,cy+Math.sin(t)*r,Z+s*5.65,.02,.02,.02),COL('#3a3046'))}
   for(const [a,y] of [[.5,3.9],[1.1,4.35]]){NB(a,y,5.78,a+.06,y+.42,5.82,P.b);NB(a-.14,y-.04,5.78,a+.06,y+.08,5.82,P.b)}}break;
  case 'beach':for(let j=0;j<6;j++)B(-.35+j*.17,0,5.68,-.35+j*.17+.17,4.6,5.82,j%2?'#f2f2ee':'#1e9ab0');for(let j=0;j<6;j++)B(9.75-(j+1)*.17,0,5.68,9.75-j*.17,4.6,5.82,j%2?'#f2f2ee':'#1e9ab0');awning('#f2f2ee','#1e9ab0');break;
  case 'perfume':B(-.35,0,5.7,.15,4.6,5.8,'#e8d0dc');B(9.25,0,5.7,9.75,4.6,5.8,'#e8d0dc');for(let j=0;j<14;j++){const t=Math.PI*j/13,a=4.7+Math.cos(t)*4.4,y=4.6+Math.sin(t)*.55;B(a-.2,y-.08,5.7,a+.2,y+.08,5.8,'#e8c060')}NB(.2,4.66,5.79,9.2,4.7,5.83,P.c);break;
  case 'pizza':for(let j=0;j<10;j++)for(let r=0;r<2;r++){const a=.1+j*.92;B(a,3.08+r*.14,5.0+r*.3,a+.92,3.22+r*.14,5.3+r*.3,(j+r)%2?'#e8282a':'#f4f0e8')}{const cx=8.7,cy=5.05;for(const [a,b,c,d] of [[0,.4,.32,-.3],[.32,-.3,-.32,-.3],[-.32,-.3,0,.4]]){const L=Math.hypot(c-a,d-b),ang=Math.atan2(d-b,c-a);nb.geo(GEO.cyl,mtx(X+x0+cx+(a+c)/2,cy+(b+d)/2,Z+s*5.79,.035,L,.035,0,0,ang-Math.PI/2),COL('#ffb03a'))}}break;
  case 'pharm':B(-.35,0,5.7,.15,4.6,5.8,'#f2f6f4');B(9.25,0,5.7,9.75,4.6,5.8,'#f2f6f4');NB(.15,3.32,5.76,9.25,3.36,5.82,'#3ae08a');break;
  case 'cinema':B(.0,4.62,5.2,9.4,5.5,5.8,'#7a0a14');B(-.1,4.55,5.15,9.5,4.62,5.85,'#d8b060');bulbs(4.58,'#fff1a8',.36);for(let a=.25;a<9.2;a+=.36)nb.geo(GEO.bulb,mtx(X+x0+a,5.5,Z+s*5.2,.04,.04,.04),COL('#fff1a8'));
   for(const a of [-.1,9.5])for(let y=.4;y<4.5;y+=.36)nb.geo(GEO.bulb,mtx(X+x0+a,y,Z+s*5.78,.04,.04,.04),COL('#fff1a8'));break;
 }}

const MALL_THEMED=new Set(['music','games','shoes','toys','optic','beach','perfume','cinema','pizza','skate']);
/* =====================================================================
   v77 — SHOPPING EM CRUZ (+): átrio central com escada rolante e claraboia,
   quatro braços por andar. Mesmas 16 lojas, só redistribuídas; o resto
   são lojas fechadas (grade de enrolar / tapume "EM BREVE").
   Térreo: oeste = entrada (lojas fechadas), leste = praça de alimentação,
           norte/sul = lojas. 1º andar: quatro braços de lojas.
   Cada braço é montado num quadro canônico (corredor ao longo de +x) e
   depois girado 90° em volta do átrio: caixas continuam alinhadas ao eixo,
   então colisão, fachadas e decoração das lojas antigas são reaproveitadas.
   ===================================================================== */
const MALL_A=[12,16],MALL_CZL=[6,10],MALL_HC=[4.6,6],MALL_V=7,MALL_SP2=12.4,MALL_FC_NECK=3;
// slots: [lado +, lado −]; número = índice em MALL_SHOPS, 'g' = grade fechada, 'b' = tapume "em breve"
const MALL_LAYOUT=[
 [{type:'food',L:40},{type:'shops',L:37,slots:[[5,10],[0,14]]},{type:'entry',L:49.4,slots:[['b','g','b'],['g','b','g']]},{type:'shops',L:37,slots:[[15,2],[3,4]]}],
 [{type:'shops',L:41,slots:[['g',8],[6,16]]},{type:'shops',L:41,slots:[[9,'b'],['g',7]]},{type:'shops',L:41,slots:[['b',1],[11,'g']]},{type:'shops',L:41,slots:[[12,'g'],['b',13]]}]];
const MALL_WDIR=[[1,0,0,1],[0,-1,1,0],[-1,0,0,-1],[0,1,-1,0]]; // dir.x,dir.z,lat.x,lat.z  (igual a rotation.y = w·90°)
// Lanchonetes da praça de alimentação: nome, cor, preço, vida
const MALL_FOOD=[['BURGER RAD','#ff5a2a',12,30],['PASTEL DO CAIS','#f2c21a',6,15],['AÇAÍ TROPICAL','#a04ad6',9,22],['TACO LOCO','#3ab36a',10,26],['SUSHI NEON','#2ac8e8',18,45],['HOT DOG 88','#e8282a',5,12]];
function mallWingX0(lv,k){return MALL_A[lv]+1.6+k*MALL_SP2}
function mallRot(R,w,x,z){const d=MALL_WDIR[w],u=x-R.x,v=z-R.z;return[R.x+u*d[0]+v*d[2],R.z+u*d[1]+v*d[3]]}
function mallUnrot(R,w,x,z){const d=MALL_WDIR[w],lx=x-R.x,lz=z-R.z;return[lx*d[0]+lz*d[1],lx*d[2]+lz*d[3]]}
// quadro de uma loja: a = ao longo da fachada (0..9.4), c = profundidade (6 = frente, 11.8 = fundo)
function mallL2W(fr,a,c){const v=fr.s*(fr.cz-6)+fr.s*c;return mallRot(fr.R,fr.w,fr.R.x+fr.x0+a,fr.R.z+v)}
function mallW2L(fr,x,z){const [u,v]=mallUnrot(fr.R,fr.w,x,z);return[u-fr.x0,fr.s*v-(fr.cz-6)]}
function mallMergeRot(dst,src,R,w){const d=MALL_WDIR[w],P=src.p,N=src.n,p0=dst.p.length,b0=p0/3,i0=dst.idx?dst.idx.length:0;for(let i=0;i<P.length;i+=3){const u=P[i]-R.x,v=P[i+2]-R.z;dst.p.push(R.x+u*d[0]+v*d[2],P[i+1],R.z+u*d[1]+v*d[3]);const nu=N[i],nv=N[i+2];dst.n.push(nu*d[0]+nv*d[2],N[i+1],nu*d[1]+nv*d[3])}
 for(const x of src.c)dst.c.push(x);for(const x of src.u)dst.u.push(x);if(dst.idx){if(src.idx)for(const x of src.idx)dst.idx.push(b0+x);else for(let k=0,n=P.length/3;k<n;k++)dst.idx.push(b0+k)}if(ZF.on)zfPost(dst.p,p0,false,dst.idx,i0)} // v78: peças montadas em coordenada local e giradas: anti z-fight já no lugar final
function mallColRot(c,R,w){const a=mallRot(R,w,c[0],c[1]),b=mallRot(R,w,c[2],c[3]);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]}
/* ---------- casca de uma loja (antigo corpo do laço de mallRoom), no quadro da loja ---------- */
function mallStoreShell(g,mb,nb,hb,X,ZS,x0,s,idx,up,cols,C,Hc){
 const info=MALL_SHOPS[idx],func=!!info[2],x1=x0+9.4,zf=s*6,zb=s*11.8,acc=C(info[1]),z0=Math.min(zf,zb),z1=Math.max(zf,zb),P=mallPal();
 for(let x=x0;x<x1;x+=1.9)mb.quad([X+x,.01,ZS+z1],[X+Math.min(x1,x+1.9),.01,ZS+z1],[X+Math.min(x1,x+1.9),.01,ZS+z0],[X+x,.01,ZS+z0],0,1,0,[0,0,1,1],func?C(info[2]==='wear'?'#e8d8e4':'#e8f0e8'):C('#a5a5bd'));
 mallBox(mb,X+x0-.3,0,ZS+z0,X+x0,4.2,ZS+z1,C('#b5a4c2'));mallBox(mb,X+x1,0,ZS+z0,X+x1+.3,4.2,ZS+z1,C('#b5a4c2'));mallBox(mb,X+x0,0,ZS+(s>0?z1-.15:z0),X+x1,4.2,ZS+(s>0?z1:z0+.15),acc.clone().lerp(C('#ffffff'),.55));
 mallBox(mb,X+x0,4.2,ZS+z0,X+x1,4.35,ZS+z1,C('#4a3f4c'));
 if(!['cafe','music','cinema','games'].includes(info[2]||MALL_DECO[idx])){const lamp=COL(mallStoreLight(idx).col.getHexString?'#'+mallStoreLight(idx).col.getHexString():'#ffcf7a');for(const a of [2.6,6.8]){const c=8.8;mallBox(mb,X+x0+a-.012,2.75,ZS+s*c-.012,X+x0+a+.012,4.2,ZS+s*c+.012,C('#2a2a30'));mb.geo(GEO.hemi,mtx(X+x0+a,2.78,ZS+s*c,.2,.13,.2,Math.PI,0,0),C('#2a2228'));nb.geo(GEO.sph,mtx(X+x0+a,2.7,ZS+s*c,.07,.05,.07),lamp);const k=lamp.clone().multiplyScalar(.13);hb.quad([X+x0+a-1.2,.056,ZS+s*c+1.2],[X+x0+a+1.2,.056,ZS+s*c+1.2],[X+x0+a+1.2,.056,ZS+s*c-1.2],[X+x0+a-1.2,.056,ZS+s*c-1.2],0,1,0,[0,0,1,1],k)}}
 mallBox(mb,X+x0-.35,0,ZS+zf-.2,X+x0+.15,4.6,ZS+zf+.2,C('#b8b0a4'));mallBox(mb,X+x1-.15,0,ZS+zf-.2,X+x1+.35,4.6,ZS+zf+.2,C('#b8b0a4'));mallBox(mb,X+x0,3.4,ZS+zf-.18,X+x1,4.6,ZS+zf+.18,acc);
 if(Hc>4.6)mallBox(mb,X+x0-.35,4.6,ZS+zf-.2,X+x1+.35,Hc,ZS+zf+.2,C('#d8cbbf'));
 signPlane(g,mallSignMat(info[0],'#111118',info[1]==='#1a1a2a'?'#ffd23a':info[1]),X+(x0+x1)/2,4.0,ZS+zf-s*.212,6.4,.8,s>0?Math.PI:0);
 const dg=1.6;{const m=(x0+x1)/2;mallBox(mb,X+x0+.15,0,ZS+zf-.05,X+m-dg,3.4,ZS+zf+.05,C('#a8d0e8'));mallBox(mb,X+m+dg,0,ZS+zf-.05,X+x1-.15,3.4,ZS+zf+.05,C('#a8d0e8'));cols.push([X+x0,ZS+zf-.15,X+m-dg,ZS+zf+.15],[X+m+dg,ZS+zf-.15,X+x1,ZS+zf+.15])}
 cols.push([X+x0-.4,ZS+z0,X+x0,ZS+z1],[X+x1,ZS+z0,X+x1+.4,ZS+z1],[X+x0-.37,ZS+zf-.22,X+x0+.17,ZS+zf+.22],[X+x1-.17,ZS+zf-.22,X+x1+.37,ZS+zf+.22]);
 const pr=mulberry32(idx*977+3),prod=['#d8202a','#f2c21a','#2a8ad6','#3ab36a','#ff6fae','#f2f2ee','#7a4ad6','#ff8a1a'];
 if(!func&&!MALL_DECO[idx]){for(let k=0;k<3;k++){const xx=x0+1.2+k*2.8,zz=s*9.4;mallBox(mb,X+xx,0,ZS+zz-.5,X+xx+1.8,1.5,ZS+zz+.5,C('#ece8e0'));for(let j=0;j<5;j++)mallBox(mb,X+xx+.1+j*.34,1.5,ZS+zz-.3,X+xx+.36+j*.34,1.5+.25+pr()*.4,ZS+zz+.3,C(prod[Math.floor(pr()*8)]))}}
 else if(info[2]==='wear'){
  for(let k=0;k<3;k++){const xx=x0+1.4+k*2.6,zz=s*8.6;mallBox(mb,X+xx,1.6,ZS+zz-.04,X+xx+1.8,1.68,ZS+zz+.04,C('#8a8a90'));mallBox(mb,X+xx,0,ZS+zz-.04,X+xx+.06,1.68,ZS+zz+.04,C('#8a8a90'));mallBox(mb,X+xx+1.74,0,ZS+zz-.04,X+xx+1.8,1.68,ZS+zz+.04,C('#8a8a90'));for(let j=0;j<7;j++)mallBox(mb,X+xx+.12+j*.24,.75,ZS+zz-.32,X+xx+.3+j*.24,1.6,ZS+zz+.32,C(prod[(j+k*3)%8]));cols.push([X+xx,ZS+zz-.35,X+xx+1.8,ZS+zz+.35])}
  for(const xx of [x0+.8,x1-1.2]){cols.push([X+xx-.02,ZS+Math.min(s*7,s*7+.4)-.02,X+xx+.42,ZS+Math.max(s*7,s*7+.4)+.02]);mallBox(mb,X+xx,0,ZS+s*7,X+xx+.4,.2,ZS+s*7+.4,C('#3a3a40'));mallBox(mb,X+xx+.12,.2,ZS+s*7+.12,X+xx+.28,1.1,ZS+s*7+.28,C('#f0e8e0'));mallBox(mb,X+xx+.02,1.1,ZS+s*7+.02,X+xx+.38,1.75,ZS+s*7+.38,C(prod[Math.floor(pr()*8)]));mallBox(mb,X+xx+.1,1.75,ZS+s*7+.1,X+xx+.3,2,ZS+s*7+.3,C('#f0e8e0'))}
  mallBox(mb,X+x1-1.4,.4,ZS+(s>0?11.6:-11.8),X+x1-.3,2.6,ZS+(s>0?11.8:-11.6),C('#d8f0ff'));
  mallBox(mb,X+x0+.3,0,ZS+s*10.2-.4,X+x0+3.4,1.05,ZS+s*10.2+.4,C('#5a3a28'));cols.push([X+x0+.3,ZS+s*10.2-.4,X+x0+3.4,ZS+s*10.2+.4]);MALL['wear'+(up?'U':'G')]={x:X+x0+1.8,z:ZS+s*9.2,clerk:{x:X+x0+1.8,z:ZS+s*10.9}}}
 else if(info[2]==='cafe'||info[2]==='tech'){}
 else if(func){const bg=info[2]==='bag',tk=info[2]==='tech'||bg,tp=bg?['#2f6fd6','#d62828','#1b1b1b','#3ab36a','#f2c21a','#7a4ad6','#8a5a3a','#5a5a62']:['#1b1b1b','#2a6ad6','#e8e8ee','#3a3e46','#d62828','#0a84ff','#3ddc84','#1d1f24'];if(!['music','optic','shoes','beach','skate'].includes(info[2]))for(let k=0;k<2;k++){const xx=x0+4.6+k*2.4;mallBox(mb,X+xx,0,ZS+s*8.2,X+xx+.9,1.5,ZS+s*10.6,C(bg?'#8a6a44':tk?'#3a3e46':'#d8d8dc'));for(let j=0;j<5;j++)for(let r=0;r<3;r++)mallBox(mb,X+xx-.06,.2+r*.45,ZS+s*8.3+j*.45*s,X+xx+.96,.5+r*.45-(tk?.12:0),ZS+s*8.3+j*.45*s+.3*s,C(tk?tp[(j+r+k)%8]:prod[(j+r+k)%8]));cols.push([X+xx,ZS+Math.min(s*8.2,s*10.6),X+xx+.9,ZS+Math.max(s*8.2,s*10.6)])}
  if(info[2]!=='music'){mallBox(mb,X+x0+.3,0,ZS+s*9-.4,X+x0+3.2,1.05,ZS+s*9+.4,C('#5a3a28'));mallBox(mb,X+x0+1.2,1.05,ZS+s*9-.3,X+x0+1.9,1.35,ZS+s*9+.3,C('#2a2a30'))}cols.push([X+x0+.3,ZS+s*9-.4,X+x0+3.2,ZS+s*9+.4]);MALL[info[2]+(up?'U':'G')]={x:X+x0+1.8,z:ZS+s*8,clerk:{x:X+x0+1.8,z:ZS+s*10.3}}}
 const tm=MALL._tm;mallStoreFit(g,mb,X,ZS,x0,s,info[2]||MALL_DECO[idx],up,cols);mallStoreDecor(g,mb,tm,nb,X,ZS,x0,s,idx,up,cols);mallFacade(g,mb,nb,X,ZS,x0,s,idx,up,cols);
 cols.push([X+x0,ZS+Math.min(s*11.0,s*11.9),X+x1,ZS+Math.max(s*11.0,s*11.9)]);
 // moldura neon do letreiro + reflexo suave no piso
 const N=(a,y0,c,d,y1,f,col)=>mallBox(nb,X+a,y0,ZS+c,X+d,y1,ZS+f,col),cc=COL(((idx%2)?P.a:P.b)),zfn=s*6-s*.22;
 N(x0+.05,3.36,zfn-.025,x1-.05,3.41,zfn+.025,cc);N(x0+.05,4.64,zfn-.025,x1-.05,4.69,zfn+.025,cc);
 /* v78: removido o "reflexo" do neon no chão rente às vitrines (faixa ciano/rosa plana que não acendia) */}
/* ---------- loja fechada: grade de enrolar ou tapume "em breve" ---------- */
function mallFakeStore(g,mb,nb,X,ZS,x0,s,kind,seed,cols,C,Hc){const x1=x0+9.4,zf=s*6,r=mulberry32(seed);
 mallBox(mb,X+x0-.35,0,ZS+zf-.2,X+x0+.15,4.6,ZS+zf+.2,C('#a8a29a'));mallBox(mb,X+x1-.15,0,ZS+zf-.2,X+x1+.35,4.6,ZS+zf+.2,C('#a8a29a'));
 mallBox(mb,X+x0,3.4,ZS+zf-.18,X+x1,4.6,ZS+zf+.18,C(kind==='g'?'#3a3640':'#c9c2b6'));if(Hc>4.6)mallBox(mb,X+x0-.35,4.6,ZS+zf-.2,X+x1+.35,Hc,ZS+zf+.2,C('#d8cbbf'));
 if(kind==='g'){// grade de enrolar: lâminas horizontais escuras, caixa do rolo e trava no pé
  mallBox(mb,X+x0+.15,0,ZS+zf+s*.02,X+x1-.15,3.4,ZS+zf+s*.12,C('#4a4a52'));for(let y=.12;y<3.3;y+=.17)mallBox(mb,X+x0+.15,y,ZS+zf-s*.0,X+x1-.15,y+.07,ZS+zf+s*.02,C(r()<.08?'#6a6470':'#5c5a64'));
  mallBox(mb,X+x0+.1,3.22,ZS+zf-s*.12,X+x1-.1,3.42,ZS+zf+s*.04,C('#2e2c34'));mallBox(mb,X+x0+4.4,.05,ZS+zf-s*.08,X+x0+5.0,.25,ZS+zf,C('#8a8a90'));
  if(r()<.6){const m=signPlane(g,mallSignMat(r()<.5?'ALUGA-SE':'PASSO O PONTO','#d8d4c8','#c8282a',256,48),X+x0+(2+r()*5),1.9,ZS+zf-s*.03,1.5,.3,s>0?Math.PI:0);m.rotation.z=(r()-.5)*.08}
  if(r()<.5){const old=['VÍDEO LOCADORA','FOTO 1 HORA','LAN HOUSE','MODA 2000','DISCO MANIA'][Math.floor(r()*5)];signPlane(g,mallSignMat(old,r()<.5?'#1b1b22':'#2a2a33','#5a5662',512,64),X+x0+4.7,4.0,ZS+zf-s*.212,6.4,.8,s>0?Math.PI:0)}} // v78: letreiro velho apagado (antes placa lisa escura que parecia painel sem textura)
 else{// tapume com arte "em breve" (texto em 3 linhas, sem esticar)
  // v77: tapume em tons de cinza/marrom e arte menor e apagada (antes estourava em branco com o bloom)
  const pal=[['#4a433c','#c9a48c'],['#3b4047','#8fb4bc'],['#4d3b31','#c8a878'],['#45404a','#b89ab0']][Math.floor(r()*4)];
  mallBox(mb,X+x0+.15,0,ZS+zf-s*.02,X+x1-.15,3.4,ZS+zf+s*.08,C(pal[0]));
  signPlane(g,sunsetSignMat(['EM BREVE','UMA NOVA EXPERIÊNCIA','PARA VOCÊ'],pal[0],pal[1],5.6/1.7),X+x0+4.7,1.8,ZS+zf-s*.04,5.6,1.7,s>0?Math.PI:0);
  signPlane(g,mallSignMat('EM BREVE','#2a2622',pal[1]),X+x0+4.7,4.0,ZS+zf-s*.212,3.6,.45,s>0?Math.PI:0)}
 cols.push([X+x0-.37,ZS+Math.min(zf-s*.2,zf+s*.22),X+x1+.37,ZS+Math.max(zf-s*.2,zf+s*.22)])}
/* ---------- um braço (quadro canônico: corredor de A até L ao longo de +x) ---------- */
function mallWing(g,mb,nb,hb,X,Z,lv,w,cfg,cols,C){const up=lv===1,A=MALL_A[lv],CZ=MALL_CZL[lv],Hc=MALL_HC[lv],L=cfg.L,VW=!!(city.st&&city.st.night),P=mallPal(),tm=MALL._tm;
 const B=(a,y0,c,d,y1,f,h)=>mallBox(mb,X+a,y0,Z+c,X+d,y1,Z+f,typeof h==='string'?C(h):h),col=(a,c,d,f)=>cols.push([X+Math.min(a,d),Z+Math.min(c,f),X+Math.max(a,d),Z+Math.max(c,f)]);
 const NB=(a,y0,c,d,y1,f,h)=>mallBox(nb,X+a,y0,Z+c,X+d,y1,Z+f,typeof h==='string'?COL(h):h);
 const t1=C(VW?'#8a76a8':'#b4adb4'),t2=C(VW?'#2e2846':'#9aa6a8'),path=C(VW?'#a090c0':'#cfc8c4'),wl=C(VW?'#6a5a88':'#bcb0c4'),cl=C(VW?'#2c2640':'#aaa8bc');
 const food=cfg.type==='food',W=food?11.8:CZ,u0=food?A+MALL_FC_NECK:A;
 // piso: faixa central clara (caminho) e bordas em xadrez escuro, como no corredor de referência
 const tile=(a,b,c,d,col)=>mb.quad([X+a,0,Z+d],[X+b,0,Z+d],[X+b,0,Z+c],[X+a,0,Z+c],0,1,0,[0,0,1,1],col);
 for(let u=A;u<L;u+=2){const ww=u<u0?CZ:W;for(let v=-ww;v<ww;v+=2){const ub=Math.min(L,u+2),inPath=Math.abs(v+1)<(food?ww-2.5:CZ*.45);tile(u,ub,v,v+2,inPath?((u/2+v/2)&1?path:path.clone().multiplyScalar(.95)):(((u+v)/2&1)?t1:t2))}}
 // teto plano como o do shopping atual (usuário prefere), com as faixas de sanca do antigo mallGalleryFit
 const ceil=(a,b,ww)=>mb.qa([X+a,Hc,Z-ww],[X+b,Hc,Z-ww],[X+b,Hc,Z+ww],[X+a,Hc,Z+ww],cl,[X+(a+b)/2,Hc+9,Z]);
 if(food){ceil(A,u0,CZ);ceil(u0,L,W)}else ceil(A,L,W);
 {const cy=Hc-.2;for(const z of [-W*.45,W*.45]){B(u0+.4,cy-.18,z-.32,L-.4,cy-.02,z+.32,'#817b8a')} // v77: sem as linhas neon extras do teto (só a sanca de cada lado)
  for(let u=A+6.2;u<L-1;u+=MALL_SP2)B(u-.08,cy-.12,-W*.45,u+.08,cy-.04,W*.45,'#aaa1ac')}
 // sancas neon (uma cor por lado) e pequenas lâmpadas de serviço no eixo
 const ca=COL(P.a),cb=COL(P.b),ce=C('#e8e2d8');
 for(const s of [-1,1]){const c=s<0?ca:cb,zc=s*(W-.14);NB(u0+.2,Hc-.07,zc-.035,L-.3,Hc-.015,zc+.035,c.clone().multiplyScalar(.8));const k=c.clone().multiplyScalar(.14);hb.quad([X+u0+.2,Hc-.01,Z+zc-.7],[X+L-.3,Hc-.01,Z+zc-.7],[X+L-.3,Hc-.01,Z+zc+.6],[X+u0+.2,Hc-.01,Z+zc+.6],0,-1,0,[0,0,1,1],k)} // v77: sanca rente ao teto
 // fileiras de lojas
 if(cfg.slots)for(const [si,s] of [[0,1],[1,-1]]){const row=cfg.slots[si],ZS=Z+s*(CZ-6);let prev=A;
  row.forEach((e,k)=>{const x0=A+1.6+k*MALL_SP2;
   if(typeof e==='number'){const keys=Object.keys(MALL).filter(q=>/(G|U)$/.test(q)&&MALL[q]&&MALL[q].clerk);const before=new Set(keys.map(q=>q+'@'+MALL[q].x));
    mallStoreShell(g,mb,nb,hb,X,ZS,x0,s,e,up,cols,C,Hc);
    for(const q of Object.keys(MALL))if(/(G|U)$/.test(q)&&MALL[q]&&MALL[q].clerk&&!before.has(q+'@'+MALL[q].x))MALL[q].fr={R:{x:X,z:Z},w,x0,s,cz:CZ,lv,idx:e};
    (MALL._fr||(MALL._fr={}))[e]={R:{x:X,z:Z},w,x0,s,cz:CZ,lv,idx:e};
    MALL._slotMap[(lv*4+w)*6+(s>0?0:3)+k]=e}
   else mallFakeStore(g,mb,nb,X,ZS,x0,s,e,(lv*97+w*13+k*5+(s>0?1:0))*31,cols,C,Hc);
   // trecho de parede antes da loja (com propaganda se couber)
   const ga=prev,gb=x0-.3;if(gb-ga>.05){B(ga,0,s*CZ,gb,Hc,s*(CZ+5.8),wl);col(ga,s*CZ,gb,s*(CZ+5.8));const gw=gb-ga;if(gw>2.4&&k>0){const gx=(ga+gb)/2,ad=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15][(lv*7+w*5+k*3+(s>0?0:2))%16];mallAdFrame(mb,tm,nb,X,Z,gx,s*(CZ-.01),s,gw-.5,1.4,2.75,ad,(k+w)%2,true)}}
   prev=x0+9.4+.3});
  const ga=prev,gb=L;B(ga,0,s*CZ,gb,Hc,s*(CZ+5.8),wl);col(ga,s*CZ,gb,s*(CZ+5.8))}
 // paredes laterais lisas do pescoço da praça de alimentação
 if(food)for(const s of [-1,1]){B(A,0,s*CZ,u0,Hc,s*(W+.3),wl);col(A,s*CZ,u0,s*(W+.3))}
 // parede do fundo do braço
 const ent=cfg.type==='entry';
 if(ent){for(const s of [-1,1]){B(L,0,s*2,L+.3,Hc,s*(CZ+5.8),wl);col(L,s*2,L+.6,s*(CZ+5.8))}B(L,2.9,-2,L+.3,Hc,2,wl);col(L+.25,-2.1,L+.6,2.1);
  // portas de vidro com a luz do dia lá fora
  B(L+.02,0,-2,L+.12,2.9,2,C(VW?'#a86a90':'#b8bcc4'));for(const v of [-2,-.04,1.96])B(L-.04,0,v,L+.02,2.9,v+.08,'#2a2a30');B(L-.06,2.82,-2.05,L+.02,2.95,2.05,'#2a2a30');
  signPlane(g,mallSignMat('SAÍDA','#14301c','#7dff8a'),X+L-.08,3.3,Z,1.4,.32,-Math.PI/2);
  {const k=COL(VW?'#ff9ad0':'#fff4e0').multiplyScalar(.08);hb.quad([X+L-6,.03,Z+2.4],[X+L,.03,Z+2.4],[X+L,.03,Z-2.4],[X+L-6,.03,Z-2.4],0,1,0,[0,0,1,1],k)}}
 else{B(L,0,-(W+(food?.3:5.8)),L+.3,Hc+.5,W+(food?.3:5.8),wl);col(L,-(W+(food?.3:5.8)),L+.6,W+(food?.3:5.8))}
 // decoração do corredor: canteiros compridos com arbustos + bancos de ripa (referência), máquinas no fundo
 if(cfg.type==='shops'||ent){const bush=(x,z,k)=>{for(let j=0;j<k;j++)mb.geo(GEO.ico,mtx(X+x+(j-(k-1)/2)*.62,.95+(j%2)*.12,Z+z+((j*7)%3-1)*.12,.42,.36,.42,j,j*.7,0),C(j%2?'#4f7a44':'#36603e'))};
  const bench=(x,z,len,rot)=>{const a=rot?.35:len/2,c=rot?len/2:.35;B(x-a,.42,z-c,x+a,.5,z+c,'#8a6a52');for(let j=0;j<6;j++){const t=-1+(j+.5)/3;rot?B(x-a,.5,z+t*c-.02,x+a,.51,z+t*c+.02,'#a07e62'):B(x+t*a-.02,.5,z-c,x+t*a+.02,.51,z+c,'#a07e62')}for(const e of [-1,1])rot?B(x-a+.05,0,z+e*(c-.12)-.05,x+a-.05,.42,z+e*(c-.12)+.05,'#3a3a42'):B(x+e*(a-.12)-.05,0,z-c+.05,x+e*(a-.12)+.05,.42,z+c-.05,'#3a3a42');col(x-a,z-c,x+a,z+c)};
  const nS=cfg.slots?cfg.slots[0].length:0,mid=3.2;
  for(let k=0;k<nS-1+(up?1:0);k++){const gc=k<nS-1?A+1.6+9.4+1.5+k*MALL_SP2:A+1.6+nS*MALL_SP2+1.2;if(gc+2.6>L-1.5)continue;const u=gc-2.6,len=5.2;if(ent)continue;
   for(const zc of (up?[-mid]:[CZ-2.2,-(CZ-2.2)])){B(u,0,zc-.7,u+len,.62,zc+.7,'#6e6470');B(u+.08,.62,zc-.62,u+len-.08,.66,zc+.62,'#4a3a36');bush(u+len/2,zc,6);col(u,zc-.7,u+len,zc+.7);bench(u+len/2,zc+(zc>0?-1.15:1.15),3.2,false)}
   if(up){bench(u+2.6,mid+1.2,3.2,false);B(u+.2,0,mid-.6,u+1.2,.62,mid+.6,'#6e6470');bush(u+.7,mid,2);col(u+.2,mid-.6,u+1.2,mid+.6)}}
  if(ent){// entrada: dois canteiros nas laterais e um quiosque fechado com lona
   for(const s of [-1,1]){const z=s*(CZ-1.3);B(L-14,0,z-.6,L-6,.62,z+.6,'#6e6470');B(L-13.9,.62,z-.52,L-6.1,.66,z+.52,'#4a3a36');bush(L-10,z,8);col(L-14,z-.6,L-6,z+.6)}
   {const u=A+14;B(u-1.2,0,-1.2,u+1.2,1.05,1.2,'#5a4a5a');B(u-1.3,1.05,-1.3,u+1.3,1.12,1.3,'#8a8090');B(u-1.25,1.12,-1.25,u+1.25,2.2,1.25,'#3a6aa8');B(u-1.35,2.2,-1.35,u+1.35,2.3,1.35,'#2a4a78');col(u-1.3,-1.3,u+1.3,1.3);
    signPlane(g,mallSignMat('VOLTAMOS LOGO','#2a4a78','#f2f2ee'),X+u,1.7,Z+1.26,2.2,.36,0);signPlane(g,mallSignMat('VOLTAMOS LOGO','#2a4a78','#f2f2ee'),X+u,1.7,Z-1.26,2.2,.36,Math.PI)}}
  // fundo do braço: mural, máquina de refrigerante e banco (menos no braço da entrada)
  if(!ent){mallPanel(tm.mural,X+L-.01,1.0,Z-3.2,X+L-.01,3.6,Z+3.2,[-1,0,0],[.1,0,.9,1]);B(L-.06,.92,-3.3,L,1.0,3.3,'#2a2430');B(L-.06,3.6,-3.3,L,3.68,3.3,'#2a2430');
   const vz=CZ-1.6;for(const z of [vz-.45,-vz+.45]){const n=MALL._vdn=(MALL._vdn||0)+1;MALL['vd'+n+(up?'U':'G')]={x:X+L-1.7,z:Z+z,clerk:{x:X+L-.5,z:Z+z},vend:true}}B(L-.95,0,vz-.9,L,1.95,vz,'#a80d24');mallPanel(tm.vend,X+L-.955,.05,Z+vz-.85,X+L-.955,1.9,Z+vz-.05,[-1,0,0]);col(L-.95,vz-.9,L,vz);
   B(L-.95,0,-vz,L,1.95,-vz+.9,'#1b5aa8');mallPanel(tm.vend,X+L-.955,.05,Z-vz+.05,X+L-.955,1.9,Z-vz+.85,[-1,0,0]);col(L-.95,-vz,L,-vz+.9)}}
 if(food)mallFoodCourt(g,mb,nb,hb,X,Z,lv,w,A,u0,L,W,Hc,cols,C);}
/* ---------- praça de alimentação (térreo, braço leste): lanchonetes nas paredes + mesas ---------- */
function mallFoodCourt(g,mb,nb,hb,X,Z,lv,w,A,u0,L,W,Hc,cols,C){const B=(a,y0,c,d,y1,f,h)=>mallBox(mb,X+a,y0,Z+c,X+d,y1,Z+f,typeof h==='string'?C(h):h),col=(a,c,d,f)=>cols.push([X+Math.min(a,d),Z+Math.min(c,f),X+Math.max(a,d),Z+Math.max(c,f)]),P=mallPal();
 const wl=C('#c8bcb0');for(const s of [-1,1]){B(u0,0,s*W,L,Hc,s*(W+.3),wl);col(u0,s*W,L,s*(W+.3))}
 // 6 lanchonetes: 3 em cada parede lateral; cada uma com balcão, cardápio luminoso e atendente
 let n=0;for(const s of [1,-1])for(let k=0;k<3;k++){const f=MALL_FOOD[n],a=u0+1.2+k*8.4,b=a+7.2,acc=COL(f[1]),key='fc'+n;
  B(a,0,s*(W-2.6),b,1.05,s*(W-2.0),C('#3a3440'));B(a-.05,1.05,s*(W-2.65),b+.05,1.13,s*(W-1.95),C('#e8e0d4'));col(a,s*(W-2.65),b,s*(W-1.95));
  for(const e of [a-.25,b])B(e,0,s*(W-2.65),e+.25,Hc,s*W,C('#b0a49a'));col(a-.25,s*(W-2.65),a,s*W);col(b,s*(W-2.65),b+.25,s*W);
  B(a,3.0,s*(W-2.7),b,3.9,s*(W-2.55),acc);mallBox(nb,X+a+.1,2.94,Z+s*(W-2.72),X+b-.1,2.98,Z+s*(W-2.69),acc.clone().lerp(COL('#ffffff'),.4));
  signPlane(g,mallSignMat(f[0],'#111118',f[1]),X+(a+b)/2,3.45,Z+s*(W-2.73),5.8,.72,s>0?Math.PI:0);
  signPlane(g,mallSignMat('$'+f[2]+' · +'+f[3]+' VIDA','#1b1820','#ffe9b0'),X+(a+b)/2,2.15,Z+s*(W-.04),4.2,.5,s>0?Math.PI:0);
  for(let j=0;j<3;j++)B(a+.8+j*2.2,1.3,s*(W-.12),a+2.4+j*2.2,1.9,s*(W-.02),C(['#f2c21a','#ff8a5a','#9ad8ff'][(j+n)%3]));
  {const kk=acc.clone().multiplyScalar(.16);hb.quad([X+a,.026,Z+s*(W-2.7)],[X+b,.026,Z+s*(W-2.7)],[X+b,.026,Z+s*(W-5)],[X+a,.026,Z+s*(W-5)],0,1,0,[0,0,1,1],kk)}
  MALL[key+'G']={x:X+(a+b)/2,z:Z+s*(W-3.4),clerk:{x:X+(a+b)/2,z:Z+s*(W-1.1)},food:f};n++}
 // fundo: letreiro grande e bebedouros
 signPlane(g,sunsetSignMat(['PRAÇA DE ALIMENTAÇÃO'],'#1b1428',P.b,9),X+L-.05,3.4,Z,7.2,.8,-Math.PI/2);B(L-.08,3.0,-3.8,L,3.8,3.8,'#2a2430');
 // mesas com 4 cadeiras (colisão no conjunto)
 for(let u=u0+4.2;u<L-3;u+=4.4)for(const v of [-5.4,-1.8,1.8,5.4]){B(u-.55,.74,v-.55,u+.55,.8,v+.55,'#e8e2d8');B(u-.07,0,v-.07,u+.07,.74,v+.07,'#3a3a44');B(u-.35,0,v-.35,u+.35,.04,v+.35,'#3a3a44');
  for(const [du,dv] of [[-.95,0],[.95,0],[0,-.95],[0,.95]]){const cu=u+du,cv=v+dv,cc=((u+v)|0)%2?'#c8402a':'#2a8ad6';B(cu-.22,.44,cv-.22,cu+.22,.5,cv+.22,cc);B(cu-.03,0,cv-.03,cu+.03,.44,cv+.03,'#3a3a44');if(du)B(cu+Math.sign(du)*.18,.5,cv-.22,cu+Math.sign(du)*.22,.95,cv+.22,cc);else B(cu-.22,.5,cv+Math.sign(dv)*.18,cu+.22,.95,cv+Math.sign(dv)*.22,cc)}
  col(u-1.2,v-1.2,u+1.2,v+1.2)}
}
/* ---------- átrio central (quadro do andar, sem rotação) ---------- */
function mallAtrium(g,mb,nb,hb,X,Z,lv,cols,C){const up=lv===1,A=MALL_A[lv],CZ=MALL_CZL[lv],Hc=MALL_HC[lv],V=MALL_V,VW=!!(city.st&&city.st.night),P=mallPal(),tm=MALL._tm;
 const B=(a,y0,c,d,y1,f,h)=>mallBox(mb,X+a,y0,Z+c,X+d,y1,Z+f,typeof h==='string'?C(h):h),col=(a,c,d,f)=>cols.push([X+Math.min(a,d),Z+Math.min(c,f),X+Math.max(a,d),Z+Math.max(c,f)]);
 const NB=(a,y0,c,d,y1,f,h)=>mallBox(nb,X+a,y0,Z+c,X+d,y1,Z+f,typeof h==='string'?COL(h):h),ca=COL(P.a),cb=COL(P.b),cc=COL(P.c);
 const t1=C(VW?'#8a76a8':'#c0b6ae'),t2=C(VW?'#2e2846':'#8e8a96'),wl=C(VW?'#6a5a88':'#bcb0c4'),cl=C(VW?'#2c2640':'#aaa8bc');
 const tile=(a,b,c,d,y,col)=>mb.quad([X+a,y,Z+d],[X+b,y,Z+d],[X+b,y,Z+c],[X+a,y,Z+c],0,1,0,[0,0,1,1],col);
 const inV=(x,z)=>Math.abs(x+1)<V&&Math.abs(z+1)<V;
 for(let x=-A;x<A;x+=2)for(let z=-A;z<A;z+=2){if(up&&inV(x,z))continue;const r=Math.max(Math.abs(x+1),Math.abs(z+1));tile(x,x+2,z,z+2,0,r<V-1&&!up?((x+z)/2&1?C('#d8c8b0'):C('#a0503c')):((x+z)/2&1?t1:t2))}
 // paredes do átrio entre as bocas dos braços
 for(let w=0;w<4;w++){const d=MALL_WDIR[w],seg=(l0,l1,y0,y1)=>{const p=[d[0]*(A-.03)+d[2]*l0,d[1]*(A-.03)+d[3]*l0],q=[d[0]*(A+.3)+d[2]*l1,d[1]*(A+.3)+d[3]*l1];B(Math.min(p[0],q[0]),y0,Math.min(p[1],q[1]),Math.max(p[0],q[0]),y1,Math.max(p[1],q[1]),wl);if(y0<1)col(Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1]))};
  seg(CZ,A+.3,0,Hc);seg(-A-.3,-CZ,0,Hc)}
 // teto: anel em volta do vão / claraboia
 const ring=(y,c)=>{for(const[a,b,cz,dz] of [[-A,A,-A,-V],[-A,A,V,A],[-A,-V,-V,V],[V,A,-V,V]])mb.qa([X+a,y,Z+cz],[X+b,y,Z+cz],[X+b,y,Z+dz],[X+a,y,Z+dz],c,[X,y+9,Z])};
 ring(Hc,cl);
 const sky=up?Hc+.1:10.9;
 if(!up){// vão de pé-direito duplo: borda da laje, guarda-corpo de vidro e "galeria de cima" falsa
  for(const[a,b,c,d] of [[-V,V,-V-.05,-V+.05],[-V,V,V-.05,V+.05],[-V-.05,-V+.05,-V,V],[V-.05,V+.05,-V,V]]){B(a,4.6,c,b,5.0,d,'#e8e2d8');B(a,5.0,c,b,6.0,d,'#bfe6f4');B(a-.03,6.0,c-.03,b+.03,6.08,d+.03,'#9a9aa2')}
  const A2=MALL_A[1],H2=10.8;for(let w=0;w<4;w++){const d=MALL_WDIR[w];for(const[l0,l1] of [[10,A2],[-A2,-10]]){const p=[d[0]*A2+d[2]*l0,d[1]*A2+d[3]*l0],q=[d[0]*(A2+.3)+d[2]*l1,d[1]*(A2+.3)+d[3]*l1];B(Math.min(p[0],q[0]),5.0,Math.min(p[1],q[1]),Math.max(p[0],q[0]),H2,Math.max(p[1],q[1]),wl)}
   // fundo escuro de cada braço de cima, com a luz das vitrines ao longe
   const p=[d[0]*(A2+5)+d[2]*-10,d[1]*(A2+5)+d[3]*-10],q=[d[0]*(A2+5.2)+d[2]*10,d[1]*(A2+5.2)+d[3]*10];B(Math.min(p[0],q[0]),5.0,Math.min(p[1],q[1]),Math.max(p[0],q[0]),H2,Math.max(p[1],q[1]),C(VW?'#1a1428':'#5a5466'));
   for(const s of [-1,1]){const a=[d[0]*(A2+.4)+d[2]*s*9.6,d[1]*(A2+.4)+d[3]*s*9.6],b2=[d[0]*(A2+5)+d[2]*s*9.65,d[1]*(A2+5)+d[3]*s*9.65];NB(Math.min(a[0],b2[0]),H2-.4,Math.min(a[1],b2[1]),Math.max(a[0],b2[0]),H2-.36,Math.max(a[1],b2[1]),s<0?ca:cb)}}
  for(const[a,b,cz,dz] of [[-A2,A2,-A2,-V],[-A2,A2,V,A2],[-A2,-V,-V,V],[V,A2,-V,V]])mb.qa([X+a,5.0,Z+cz],[X+b,5.0,Z+cz],[X+b,5.0,Z+dz],[X+a,5.0,Z+dz],C('#d8d0c4'),[X,9,Z]);
  for(const[a,b,cz,dz] of [[-A2,A2,-A2,-V],[-A2,A2,V,A2],[-A2,-V,-V,V],[V,A2,-V,V]])mb.qa([X+a,H2,Z+cz],[X+b,H2,Z+cz],[X+b,H2,Z+dz],[X+a,H2,Z+dz],cl,[X,H2+9,Z])}
 else{// 1º andar: vão com corrimão de vidro e o térreo (falso) lá embaixo
  const Y=-4.8;for(let x=-V;x<V;x+=2)for(let z=-V;z<V;z+=2){const r=Math.max(Math.abs(x+1),Math.abs(z+1));tile(x,x+2,z,z+2,Y,r<V-1?((x+z)/2&1?C('#d8c8b0'):C('#a0503c')):((x+z)/2&1?t1:t2))}
  for(const[a,b,c,d,ref] of [[-V,V,-V,-V,[0,-2,-V-5]],[-V,V,V,V,[0,-2,V+5]],[-V,-V,-V,V,[-V-5,-2,0]],[V,V,-V,V,[V+5,-2,0]]])mb.qa([X+a,0,Z+c],[X+b,0,Z+d],[X+b,Y,Z+d],[X+a,Y,Z+c],C('#b5a4c2'),[X+ref[0],ref[1],Z+ref[2]]);
  for(const[a,c,b,d] of [[-V,-V-.05,V,-V+.05],[-V,V-.05,V,V+.05],[-V-.05,-V,-V+.05,V],[V-.05,-V,V+.05,-1.3],[V-.05,1.3,V+.05,V]]){B(a,0,c,b,1.05,d,'#bfe6f4');B(a-.02,1.05,c-.02,b+.02,1.12,d+.02,'#9a9aa2');col(a,c,b,d)}
  // vista de baixo: canteiros nos cantos do térreo
  for(const[x,z] of [[-5.4,-5.4],[-5.4,5.4],[5.4,-5.4],[5.4,5.4]]){B(x-.7,Y,z-.7,x+.7,Y+.62,z+.7,'#6e6470');for(let j=0;j<4;j++)mb.geo(GEO.ico,mtx(X+x+(j%2-.5)*.6,Y+1.0,Z+z+((j>>1)-.5)*.6,.42,.38,.42,j,0,0),C(j%2?'#4f7a44':'#36603e'))}}
 // claraboia sobre o vão: vidro + caixilhos + moldura neon
 {const T=sky,b=up?Hc:10.8;mb.qa([X-V,T,Z-V],[X+V,T,Z-V],[X+V,T,Z+V],[X-V,T,Z+V],C(VW?'#3a3a7a':'#a8c4dc'),[X,T+9,Z]);for(const[a,c,b2,d] of [[-V,-V,V,-V],[-V,V,V,V],[-V,-V,-V,V],[V,-V,V,V]])mb.qa([X+a,b,Z+c],[X+b2,b,Z+d],[X+b2,T,Z+d],[X+a,T,Z+c],cl,[X,b,Z]);
  for(let x=-V+2.33;x<V;x+=2.33)B(x-.05,T-.1,-V,x+.05,T-.01,V,'#4a4a56');for(let z=-V+2.33;z<V;z+=2.33)B(-V,T-.1,z-.05,V,T-.01,z+.05,'#4a4a56');}
 // escada rolante: no térreo sobe para +x; no 1º andar o topo chega pela borda leste do vão
 {const y0=up?0:0,y1=up?-4.8:4.8,xa=up?6:-4,xb=up?-4:6,n=18;for(let k=0;k<n;k++){const xs=xa+(xb-xa)*k/n,xe=xa+(xb-xa)*(k+1)/n,ys=y0+(y1-y0)*k/n,ye=y0+(y1-y0)*(k+1)/n,lo=Math.min(ys,ye);B(Math.min(xs,xe),lo-.25,-1,Math.max(xs,xe),Math.max(ys,ye),1,k%2?'#5a5a62':'#6a6a72')}
  for(const s of [-1,1])for(let k=0;k<n;k++){const xs=xa+(xb-xa)*k/n,xe=xa+(xb-xa)*(k+1)/n,ys=y0+(y1-y0)*k/n,ye=y0+(y1-y0)*(k+1)/n;B(Math.min(xs,xe),Math.min(ys,ye)-.3,s*1.05-.06,Math.max(xs,xe),Math.max(ys,ye)+.95,s*1.05+.06,'#bfe6f4');B(Math.min(xs,xe),Math.max(ys,ye)+.95,s*1.05-.09,Math.max(xs,xe),Math.max(ys,ye)+1.05,s*1.05+.09,'#1a1a20')}
  {const L=Math.hypot(xb-xa,y1-y0),ang=Math.atan2(y1-y0,xb-xa);for(const s of [-1,1])nb.geo(GEO.cyl16,mtx(X+(xa+xb)/2,(y0+y1)/2+1.07,Z+s*1.05,.035,L,.035,0,0,ang-Math.PI/2),s<0?ca:cb)}
  if(!up)col(-3.4,-1.2,6.6,1.2);else{B(V,0,-1.3,V+.6,.02,1.3,'#8a8a92');col(V-.6,-1.3,V-.15,1.3)}} // v77: trava a boca do vão (pedestres entravam por ela); o gatilho da escada continua alcançável
 // cantos do átrio: canteiro com palmeira e bancos virados para o centro
 const cw=up?A-10:A-CZ,cm=(A+(up?10:CZ))/2;for(const sx of [-1,1])for(const sz of [-1,1]){const x=sx*cm,z=sz*cm;if(!up&&sx<0&&false)continue;
  B(x-.75,0,z-.75,x+.75,.66,z+.75,'#6e6470');B(x-.68,.66,z-.68,x+.68,.7,z+.68,'#4a3a36');col(x-.75,z-.75,x+.75,z+.75);palmBuild(mb,X+x,.66,Z+z,.5,false,mulberry32((sx+2)*7+(sz+2)*31+lv*101),{h:4.2,lean:.06});
  if(!up&&cw>3){const bx=x-sx*2.1;B(bx-.35,.42,z-1.3,bx+.35,.5,z+1.3,'#8a6a52');for(const e of [-1,1])B(bx-.3,0,z+e*1.1-.05,bx+.3,.42,z+e*1.1+.05,'#3a3a42');col(bx-.35,z-1.3,bx+.35,z+1.3)}}
 if(!up){// quiosque de informações e diretório perto da boca da entrada (oeste)
  {const x=-9.4,z=-3.8;// v77: totem de informações menor (~60%)
   B(x-.34,0,z-.34,x+.34,.08,z+.34,'#2a2a30');B(x-.05,.08,z-.05,x+.05,1.25,z+.05,'#1b1b20');B(x-.38,1.25,z-.38,x+.38,1.92,z+.38,'#173a52');B(x-.41,1.92,z-.41,x+.41,1.97,z+.41,'#0f1c28');
   for(const [n,px,pz] of [[[0,0,1],0,.385],[[0,0,-1],0,-.385],[[1,0,0],.385,0],[[-1,0,0],-.385,0]]){if(n[2])mallPanel(tm.info,X+x-.33,1.29,Z+z+pz,X+x+.33,1.88,Z+z+pz,n);else mallPanel(tm.info,X+x+px,1.29,Z+z-.33,X+x+px,1.88,Z+z+.33,n)}col(x-.25,z-.25,x+.25,z+.25)}
  {const x=-9.4,z=3.8;B(x-.12,0,z-.6,x+.12,2.4,z+.6,'#24222e');mallPanel(tm.directory,X+x+.125,.55,Z+z-.5,X+x+.125,2.3,Z+z+.5,[1,0,0]);mallPanel(tm.directory,X+x-.125,.55,Z+z-.5,X+x-.125,2.3,Z+z+.5,[-1,0,0]);col(x-.14,z-.6,x+.14,z+.6)}
  // ilha sob a parte alta da escada rolante: canteiro, coqueiro baixo e 3 bancos
  {B(2.6,0,-2.4,6.4,.5,2.4,'#6e6470');B(2.68,.5,-2.32,6.32,.54,2.32,'#4a3a36');col(2.6,-2.4,6.4,2.4);palmBuild(mb,X+4.7,.54,Z,.5,false,mulberry32(4242),{h:3.6,lean:.04});
   for(let j=0;j<4;j++)mb.geo(GEO.ico,mtx(X+3.1+j*.9,.8,Z+(j%2?-1.7:1.7),.38,.32,.38,j,0,0),C(j%2?'#4f7a44':'#36603e'));
   const bench=(x,z,rot)=>{const a=rot?.33:1.3,c=rot?1.3:.33;B(x-a,.42,z-c,x+a,.5,z+c,'#8a6a52');for(let j=0;j<5;j++){const t=-1+(j+.5)/2.5;rot?B(x-a,.5,z+t*c-.02,x+a,.51,z+t*c+.02,'#a07e62'):B(x+t*a-.02,.5,z-c,x+t*a+.02,.51,z+c,'#a07e62')}for(const e of [-1,1])rot?B(x-a+.05,0,z+e*(c-.12)-.05,x+a-.05,.42,z+e*(c-.12)+.05,'#3a3a42'):B(x+e*(a-.12)-.05,0,z-c+.05,x+e*(a-.12)+.05,.42,z+c-.05,'#3a3a42');col(x-a,z-c,x+a,z+c)};
   bench(4.5,-3.0,false);bench(4.5,3.0,false);bench(7.0,0,true)}
  // banners pendurados no vão
  const mt=mallSignMat('SHOPPING SUNSET SHORES',P.a==='#2af0ff'?'#1b0f2a':'#0a0a1a',P.b,512,64);for(const z of [-V+.4,V-.4]){signPlane(g,mt,X,8.2,Z+z,6.4,.8,z<0?0:Math.PI)}
 }
}
/* ---------- um andar inteiro ---------- */
function mallLevel(g,mb,X,Z,lv){MALL._vdn=0;const C=h=>COL(h).lerp(COL('#91868f'),.22).multiplyScalar(.83),cols=[],R={x:X,z:Z};
 mallAtrium(g,mb,MALL._nb,MALL._hb,X,Z,lv,cols,C);
 MALL_LAYOUT[lv].forEach((cfg,w)=>{const wm=new MB(),wn=new MB(),wh=new MB(),wt={},wg=new THREE.Group(),wc=[],tm0=MALL._tm;
  MALL._tm=new Proxy(wt,{get:(o,k)=>o[k]||(o[k]=new MB())});
  const keys0=new Set(Object.keys(MALL).filter(q=>/(G|U)$/.test(q)&&MALL[q]&&MALL[q].clerk));
  // Todos os braços usam o mesmo quadro temporário. Só verificar faces
  // sobrepostas depois de rotacioná-las para a posição real, em mallMergeRot.
  const checkFaces=ZF.on;
  ZF.on=false;
  try{mallWing(wg,wm,wn,wh,X,Z,lv,w,cfg,wc,C)}finally{ZF.on=checkFaces}
  MALL._tm=tm0;mallMergeRot(mb,wm,R,w);mallMergeRot(MALL._nb,wn,R,w);mallMergeRot(MALL._hb,wh,R,w);for(const k of Object.keys(wt))mallMergeRot(MALL._tm[k],wt[k],R,w);
  const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),w*Math.PI/2);for(const m of wg.children.slice()){const p=mallRot(R,w,m.position.x,m.position.z);m.position.x=p[0];m.position.z=p[1];m.quaternion.premultiply(q);g.add(m)}
  for(const c of wc)cols.push(mallColRot(c,R,w));
  for(const k of Object.keys(MALL))if(/(G|U)$/.test(k)&&MALL[k]&&MALL[k].clerk&&!keys0.has(k)){const sp=MALL[k],a=mallRot(R,w,sp.x,sp.z),b=mallRot(R,w,sp.clerk.x,sp.clerk.z);sp.x=a[0];sp.z=a[1];sp.clerk={x:b[0],z:b[1]};if(!sp.fr)sp.fr={R,w,x0:0,s:1,cz:MALL_CZL[lv],lv,none:true}}});
 for(const c of cols)addCol(c[0],c[1],c[2],c[3],'rock')}
function buildMall(){if(MALL.grp){scene.remove(MALL.grp);disposeGroup(MALL.grp)}if(!MALL.arrIn)MALL.arrIn=makeArrow();if(!MALL.arrow)MALL.arrow=makeArrow();if(!MALL.arrGd){MALL.arrGd=makeArrow();MALL.arrGd.userData.floorRay=()=>MALL.grp}
 MALL.G={x:SAFE.IN.x+160,z:SAFE.IN.z};MALL.U={x:SAFE.IN.x+260,z:SAFE.IN.z};const g=new THREE.Group();MALL.grp=g;scene.add(g);
 for(const k of Object.keys(MALL))if(/(G|U)$/.test(k)&&MALL[k]&&MALL[k].clerk)delete MALL[k];
 MALL._slotMap=new Array(48).fill(-1);
 const tmP={};MALL._tm=new Proxy(tmP,{get:(o,k)=>o[k]||(o[k]=new MB())});MALL._nb=new MB();MALL._hb=new MB();
 for(const lv of [0,1]){const R=lv?MALL.U:MALL.G,mb=new MB();MALL.CZ=MALL_CZL[lv];mallLevel(g,mb,R.x,R.z,lv);const m=mb.mesh(mallMat());if(m)g.add(m)}
 {const m=MALL._nb.mesh(new THREE.MeshBasicMaterial({vertexColors:true}),false,false);if(m)g.add(m)}
 {const m=MALL._hb.mesh(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}) /* v78: halos de luz rentes ao teto/piso sempre por cima, sem piscar */,false,false);if(m){m.renderOrder=-1;g.add(m)}}
 for(const k of Object.keys(tmP)){const m=tmP[k].mesh(mallMat({map:mallTex(k),side:THREE.DoubleSide}),false,false);if(m)g.add(m)}
 MALL._tm=MALL._nb=MALL._hb=null;mallLightsInit();
 MALL.arrIn.visible=false;MALL.arrow.visible=false;MALL.arrGd.visible=false}
/* ---------- iluminação: braço dobrado no shader (o mesmo cálculo serve para os quatro braços) ---------- */
const MALL_LU={uG:{value:new THREE.Vector2()},uU:{value:new THREE.Vector2()},uSlot:{value:new Array(48).fill(-1)},uSC:{value:[...Array(17)].map(()=>new THREE.Vector3(1,.8,.6))},uSK:{value:new Array(17).fill(.22)},
 uLenG:{value:new THREE.Vector4(40,37,49.4,37)},uLenU:{value:new THREE.Vector4(41,41,41,41)},uDim:{value:.5},uOn:{value:1},uCA:{value:new THREE.Vector3(.16,.94,1)},uCB:{value:new THREE.Vector3(1,.24,.78)},uDay:{value:new THREE.Vector3(1,.95,.88)}};
const MALL_GLSL=`uniform vec2 uG;uniform vec2 uU;uniform float uSlot[48];uniform vec3 uSC[17];uniform float uSK[17];uniform vec4 uLenG;uniform vec4 uLenU;uniform float uDim;uniform float uOn;uniform vec3 uCA;uniform vec3 uCB;uniform vec3 uDay;
float mPool(vec2 p,vec2 c,float r){vec2 d=(p-c)/r;return exp(-dot(d,d)*2.2);}
float mH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float mN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mH(i),mH(i+vec2(1.,0.)),f.x),mix(mH(i+vec2(0.,1.)),mH(i+vec2(1.,1.)),f.x),f.y);}
// v77: envelhecimento leve — umidade subindo do rodapé, manchas de infiltração sob o teto e cantos encardidos (só em alguns trechos)
vec3 mAge(vec2 l,float y,vec3 n,float Hc,float dw){float s=l.x+l.y*1.37;vec3 tint=vec3(1.);
 if(abs(n.y)<.5){float pit=y<-.05?1.:0.;y=pit>.5?y+4.8:y;float a=mN(vec2(s*.45,y*.9))*.65+mN(vec2(s*1.7,y*2.3))*.35;float damp=smoothstep(.46,.76,a)*(1.-smoothstep(.1,1.6+mN(vec2(s*.3,7.))*1.2,y));
  float leak=smoothstep(.55,.82,mN(vec2(s*.6,3.1)))*smoothstep(Hc-2.2+mN(vec2(s*2.,1.))*1.2,Hc,y)*(.6+.4*mN(vec2(s*3.,y*4.)));
  tint*=mix(vec3(1.),vec3(.6,.52,.4),clamp(damp*.8+leak*.85,0.,1.)*(pit>.5?.35:1.));}
 else if(n.y<-.5){float st=smoothstep(.62,.9,mN(l*.22))*(.5+.5*mN(l*1.3));tint*=mix(vec3(1.),vec3(.78,.72,.62),st*.55);}
 else{float g=(1.-smoothstep(0.,1.4,dw))*smoothstep(.45,.8,mN(l*.5));tint*=mix(vec3(1.),vec3(.84,.8,.74),g*.5);}
 return tint;}
vec3 mallLight(vec3 w,vec3 n){
 if(uOn<.5)return vec3(1.);
 bool up=abs(w.x-uU.x)+abs(w.z-uU.y)<abs(w.x-uG.x)+abs(w.z-uG.y);vec2 R=up?uU:uG;vec2 l=w.xz+n.xz*.06-R;
 float A=up?16.:12.;float CZ=up?10.:6.;float Hc=up?6.:4.6;float y=w.y;float ax=abs(l.x),az=abs(l.y);
 int wi=-1;vec2 dir=vec2(1.,0.),lat=vec2(0.,1.);float L=0.;
 if(max(ax,az)>A){if(ax>=az){wi=l.x>0.?0:2;}else{wi=l.y<0.?1:3;}
  if(wi==1){dir=vec2(0.,-1.);lat=vec2(1.,0.);}else if(wi==2){dir=vec2(-1.,0.);lat=vec2(0.,-1.);}else if(wi==3){dir=vec2(0.,1.);lat=vec2(-1.,0.);}
  vec4 LL=up?uLenU:uLenG;L=wi==0?LL.x:wi==1?LL.y:wi==2?LL.z:LL.w;}
 float u=dot(l,dir),v=dot(l,lat),av=abs(v);
 bool food=!up&&wi==0;float W=food&&u>A+3.?11.8:CZ;
 // ---- dentro de uma loja: luz própria, quente e baixa (aconchegante)
 if(wi>=0&&av>CZ+.02&&av<CZ+5.9&&!food){float k=floor((u-A-1.6)/12.4);float fx=u-A-1.6-k*12.4;
  if(k>=0.&&k<3.&&fx<9.42){int slot=(up?24:0)+wi*6+(v<0.?3:0)+int(k);float si=-1.;for(int i=0;i<48;i++){if(i==slot)si=uSlot[i];}
   if(si>=0.){vec3 col=vec3(1.,.8,.6);float amb=.22;for(int i=0;i<17;i++){if(float(i)==si){col=uSC[i];amb=uSK[i];}}
    float lu=A+1.6+k*12.4+4.7;vec3 lp=vec3(R.x,3.6,R.y)+vec3(dir.x*lu+lat.x*sign(v)*(CZ+3.1),0.,dir.y*lu+lat.y*sign(v)*(CZ+3.1));
    vec3 d=lp-w;float dist=length(d);float att=clamp(1.-dist/7.6,0.,1.);att*=att;float nl=max(dot(n,d/max(dist,.001)),0.)*.75+.25;
    vec3 f=vec3(amb)+col*att*nl*1.0+col*.05;
    float back=smoothstep(CZ+4.6,CZ+5.8,av);f*=1.-back*.25;
    if(n.y<-.5)f*=.75;if(abs(n.y)<.5)f*=mix(.7,1.,smoothstep(0.,1.,y));
    return f;}}}
 // ---- corredores e átrio: luz baixa, poças sob as luminárias, penumbra baked nos cantos e nas pontas
 float pools=0.;
 if(wi>=0){float uc=A+12.4*.75+12.4*floor((u-A-12.4*.25)/12.4);pools=mPool(vec2(u,v),vec2(uc,0.),food?6.:4.6)+mPool(vec2(u,v),vec2(uc+12.4,0.),food?6.:4.6)*.0;}
 else{pools=mPool(l,vec2(0.),up?6.:8.)*(up?.9:1.4)+mPool(l,vec2(-A*.62,0.),3.)*.5+mPool(l,vec2(A*.62,0.),3.)*.5+mPool(l,vec2(0.,A*.62),3.)*.5+mPool(l,vec2(0.,-A*.62),3.)*.5;}
 float dw=wi>=0?W-av:min(az>CZ?A-ax:99.,ax>CZ?A-az:99.);
 float pen=mix(.5,1.,smoothstep(0.,2.6,dw));
 float endf=1.;if(wi>=0){float e=L-u;endf=(!up&&wi==2)?1.:mix(.45,1.,smoothstep(0.,9.,e));}
 vec3 f=vec3(uDim*.9+pools*.42)*pen*endf;
 // saída de luz das vitrines (cor da loja em frente)
 if(wi>=0&&!food&&av>CZ-3.){float k=floor((u-A-1.6)/12.4);float fx=u-A-1.6-k*12.4;if(k>=0.&&k<3.&&fx<9.42){int slot=(up?24:0)+wi*6+(v<0.?3:0)+int(k);float si=-1.;for(int i=0;i<48;i++){if(i==slot)si=uSlot[i];}
  if(si>=0.){vec3 col=vec3(1.);for(int i=0;i<17;i++){if(float(i)==si)col=uSC[i];}float sp=smoothstep(CZ-3.,CZ,av)*(1.-smoothstep(0.,2.6,y))*sin(3.1416*fx/9.42);f+=col*sp*.32;}}}
 // entrada com luz do dia
 if(!up&&wi==2){f+=uDay*mPool(vec2(u,v),vec2(L,0.),4.)*.22;}
 float cove=smoothstep(W-3.,W-.2,av)*smoothstep(Hc-2.4,Hc,y);f+=(v<0.?uCA:uCB)*cove*.22;
 if(n.y<-.5){f*=mix(.62,.9,smoothstep(0.,2.,dw));}
 if(abs(n.y)<.5){f*=mix(.62,1.,smoothstep(0.,1.4,y))*mix(1.,.75,smoothstep(Hc-1.4,Hc,y));}
 f*=mAge(l,y,n,Hc,dw);
 return f;
}`;
function mallLightsInit(){const U=MALL_LU,P=mallPal();U.uG.value.set(MALL.G.x,MALL.G.z);U.uU.value.set(MALL.U.x,MALL.U.z);const a=COL(P.a),b=COL(P.b);U.uCA.value.set(a.r,a.g,a.b);U.uCB.value.set(b.r,b.g,b.b);U.uDim.value=P.dim;
 const VW=!!(city.st&&city.st.night),day=COL(VW?'#ff9ad0':'#fff1dc');U.uDay.value.set(day.r,day.g,day.b);
 for(let i=0;i<48;i++)U.uSlot.value[i]=MALL._slotMap?MALL._slotMap[i]:-1;
 for(let idx=0;idx<MALL_SHOPS.length;idx++){const L=mallStoreLight(idx);U.uSC.value[idx].set(L.col.r,L.col.g,L.col.b);U.uSK.value[idx]=L.amb}
 U.uLenG.value.set(...MALL_LAYOUT[0].map(c=>c.L));U.uLenU.value.set(...MALL_LAYOUT[1].map(c=>c.L));
 MALL._slotMapLive=MALL._slotMap;MALL.stores=[];for(const k of Object.keys(MALL))if(/(G|U)$/.test(k)&&MALL[k]&&MALL[k].fr&&!MALL[k].fr.none)MALL.stores.push(MALL[k].fr)}
function mallLightsTick(dt){}
/* Iluminação aproximada para sprites (mesma dobra do shader). */
function mallLightAt(p,out){const U=MALL_LU,G=U.uG.value,Uu=U.uU.value,up=Math.abs(p.x-Uu.x)+Math.abs(p.z-Uu.y)<Math.abs(p.x-G.x)+Math.abs(p.z-G.y),R=up?Uu:G,lx=p.x-R.x,lz=p.z-R.y,lv=up?1:0,A=MALL_A[lv],CZ=MALL_CZL[lv],ax=Math.abs(lx),az=Math.abs(lz);
 const pool=(u,v,cu,cv,r)=>{const dx=(u-cu)/r,dz=(v-cv)/r;return Math.exp(-(dx*dx+dz*dz)*2.2)};let wi=-1;if(Math.max(ax,az)>A)wi=ax>=az?(lx>0?0:2):(lz<0?1:3);
 const d=MALL_WDIR[Math.max(0,wi)],u=lx*d[0]+lz*d[1],v=lx*d[2]+lz*d[3],av=Math.abs(v),food=!up&&wi===0,W=food&&u>A+3?11.8:CZ;let r,g,b;
 if(wi>=0&&!food&&av>CZ+.02&&av<CZ+5.9){const k=Math.floor((u-A-1.6)/12.4),fx=u-A-1.6-k*12.4,si=k>=0&&k<3&&fx<9.42?(MALL._slotMapLive||[])[lv*24+wi*6+(v<0?3:0)+k]:-1;
  if(si>=0){const c=U.uSC.value[si],am=U.uSK.value[si],lu=A+1.6+k*12.4+4.7,dist=Math.hypot(u-lu,av-(CZ+3.1),2.6),att=Math.max(0,1-dist/8.5)**2;r=am+c.x*(att*1.1+.1);g=am+c.y*(att*1.1+.1);b=am+c.z*(att*1.1+.1);out.setRGB(clamp(r*1.1,.14,1),clamp(g*1.1,.14,1),clamp(b*1.1,.14,1));return out}}
 let pl=0;if(wi>=0){const uc=A+12.4*.75+12.4*Math.floor((u-A-12.4*.25)/12.4);pl=pool(u,v,uc,0,food?6:4.6)}else pl=pool(lx,lz,0,0,up?6:8)*(up?.9:1.4);
 const dw=wi>=0?W-av:Math.min(az>CZ?A-ax:99,ax>CZ?A-az:99),pen=.5+.5*mallSmooth(0,2.6,dw),L=wi>=0?[U.uLenG,U.uLenU][lv].value.getComponent(wi):0,endf=wi<0||(!up&&wi===2)?1:.45+.55*mallSmooth(0,9,L-u);
 const f=(U.uDim.value*.9+pl*.42)*pen*endf+.14;out.setRGB(clamp(f*1.08,.14,1),clamp(f*1.05,.14,1),clamp(f*1.1,.14,1));return out}
function mallSmooth(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
/* ---------- entrar / sair / andares ---------- */
function mallRandSpot(lv,rr){for(let t=0;t<20;t++){const w=Math.floor(rr()*5),A=MALL_A[lv],CZ=MALL_CZL[lv];let x,z;
  if(w===4){x=(rr()*2-1)*(A-1.5);z=(rr()*2-1)*(A-1.5);if(Math.abs(x)<MALL_V+.6&&Math.abs(z)<MALL_V+.6&&(lv||Math.abs(z)<3.4))continue}
  else{const cfg=MALL_LAYOUT[lv][w];if(cfg.type==='food')continue;const u=A+2+rr()*(cfg.L-A-5),v=(rr()*2-1)*(CZ-1.6);const R=lv?MALL.U:MALL.G,p=mallRot({x:0,z:0},w,u,v);x=p[0];z=p[1]}
  const R=lv?MALL.U:MALL.G,X=R.x+x,Z=R.z+z;if(query(X,Z,.6).some(b=>!b.dead&&X>b.x0-.5&&X<b.x1+.5&&Z>b.z0-.5&&Z<b.z1+.5))continue;return[X,Z]}return null}
const MALL_CLERK_KEYS=['wear','food','tech','bag','cafe','jewel','music','pharm','optic','shoes','beach','skate'];
function mallSpawnPeds(R,up){for(const q of MALL.peds)if(peds.includes(q))removePed(q);MALL.peds=[];const rr=mulberry32((up?77:33)+(DN.day||0)),lv=up?1:0;
 const mallN=(DN.nightF||0)>.5?(up?15:14):(up?5:5); /* r57: shopping cheio à noite, vazio de dia */
 for(let k=0;k<mallN;k++){const p=mallRandSpot(lv,rr);if(!p)continue;const q=spawnPed(null,{x:p[0],z:p[1],vx:0,vz:0,pal:pick2(PED_PALS)});if(!q)continue;q.fixed=true;const a=rr()*6.28;q.mx=Math.cos(a);q.mz=Math.sin(a);
  // v77: ~75% andam pelos corredores (de vitrine em vitrine), o resto fica parado olhando
  if(rr()<.75){q.state='mwalk';q.mlv=lv;q.spd=1.05+rr()*.5;q.path=null;q.mwIdle=true;q.wait=rr()*3}else q.state='fare';MALL.peds.push(q)}
 for(const key of MALL_CLERK_KEYS){const sp=MALL[key+(up?'U':'G')];if(!sp)continue;const q=spawnPed(null,{x:sp.clerk.x,z:sp.clerk.z,vx:0,vz:0,pal:key==='wear'?{...CLERK_PAL,shirt:'#ff4fa0',cap:null,long:true,hair:'#2a1a10'}:CLERK_PAL});q.state='clerk';q.fixed=true;q.at=sp.clerk;q.mallClerk=key;if(key==='skate')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#2ad6c8',cap:null,headphone:'#1b1b1b'});if(key==='bag')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#c8762a',cap:null,bag:'#3ab36a'});if(key==='tech')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#2a8ad6',cap:null,headphone:'#1b1b1b'});if(key==='music')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#a02ad6',cap:null,headphone:'#ff4fa3'});if(key==='cafe')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#f4f0e8',cap:null,stripe:'#7a4a2a'});if(key==='pharm')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#f4f4f0',cap:null,stripe:'#2a9a5a'});if(key==='jewel')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#1b1b1b',cap:null,necklace:'#e8c040'});if(key==='optic')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#f2f6f8',cap:null,stripe:'#2ac8c8',glasses:'#121218'});if(key==='shoes')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#d8402a',cap:null,shoes:'#f2f2ee'});if(key==='beach')q.sp.material.map=atlasTex({...CLERK_PAL,shirt:'#1e9ab0',stripe:'#f2f2ee',cap:'#f2f2ee',glasses:'#121218'});MALL.peds.push(q)}
 // atendentes da praça de alimentação e clientes sentados nas mesas
 if(!up){for(let n=0;n<MALL_FOOD.length;n++){const sp=MALL['fc'+n+'G'];if(!sp)continue;const q=spawnPed(null,{x:sp.clerk.x,z:sp.clerk.z,vx:0,vz:0,pal:{...CLERK_PAL,shirt:MALL_FOOD[n][1],cap:null}});if(!q)continue;q.state='clerk';q.fixed=true;q.at=sp.clerk;q.mallClerk='fc'+n;MALL.peds.push(q)}
  const A=MALL_A[0],u0=A+MALL_FC_NECK;for(let k=0;k<((DN.nightF||0)>.5?7:3);k++){const u=u0+4.2+4.4*Math.floor(rr()*4),v=[-5.4,-1.8,1.8,5.4][Math.floor(rr()*4)],du=(rr(),k%2?-.95:.95), /* v79r4: alterna o lado da mesa (antes o sorteio deixava quase todos virados pro mesmo lado); o rr() continua sendo consumido */p=mallRot({x:0,z:0},0,u+du,v);const q=spawnPed(null,{x:R.x+p[0],z:R.z+p[1],vx:0,vz:0,pal:pick2(PED_PALS)});if(!q)continue;q.state='clerk';q.fixed=true;q.at={x:q.x,z:q.z};{const c=mallRot({x:0,z:0},0,u,v),dx=R.x+c[0]-q.x,dz=R.z+c[1]-q.z,l=Math.hypot(dx,dz)||1;q.mx=dx/l;q.mz=dz/l} /* v79r4: cada cliente olha pra própria mesa (antes −sign(du) no eixo X do mundo, sem girar com o braço: todos pro mesmo lado) */MALL.peds.push(q)}}
 // clientes: na loja de discos ouvindo com fone, na cafeteria tomando café
 for(const key of ['music','cafe']){const sp=MALL[key+(up?'U':'G')];if(!sp||!sp.fr||sp.fr.none)continue;for(let k=0;k<2;k++){const [x,z]=key==='music'?mallL2W(sp.fr,k?7.0:4.8,k?10.2:7.75):mallL2W(sp.fr,5+k*2.4,7.4+k*1.1);const pal={...pick2(PED_PALS)};if(key==='music')pal.headphone=['#1b1b1b','#ff4fa3','#2a6ad6'][k%3];const q=spawnPed(null,{x,z,vx:0,vz:0,pal});if(!q)continue;q.state='clerk';q.fixed=true;q.at={x,z};const d=MALL_WDIR[sp.fr.w];if(key==='music'){q.mx=d[2]*sp.fr.s;q.mz=d[3]*sp.fr.s}else{q.mx=d[0]*(k?-1:1);q.mz=d[1]*(k?-1:1)}MALL.peds.push(q)}}}
/* v77: pedestres andando no shopping. Destino aleatório (corredor ou átrio); para trocar de braço
   passam pela boca do braço e contornam o átrio por 4 pontos nos cantos (sem cruzar escada/ilha/vão). */
function mallWingOf(lv,x,z){const R=lv?MALL.U:MALL.G,lx=x-R.x,lz=z-R.z,ax=Math.abs(lx),az=Math.abs(lz);if(Math.max(ax,az)<=MALL_A[lv])return -1;return ax>=az?(lx>0?0:2):(lz<0?1:3)}
function mallNewPath(p){const lv=p.mlv,R=lv?MALL.U:MALL.G,t=mallRandSpot(lv,Math.random);if(!t)return null;const A=MALL_A[lv],ring=lv?11.5:5.5;
 const cw=mallWingOf(lv,p.x,p.z),tw=mallWingOf(lv,t[0],t[1]);if(cw>=0&&cw===tw)return[t];
 const pts=[],mouth=w=>{const q=mallRot({x:0,z:0},w,A-1,(Math.random()-.5)*2);return[R.x+q[0],R.z+q[1]]};
 if(cw>=0)pts.push(mouth(cw));const a0=Math.atan2((cw>=0?pts[0][1]:p.z)-R.z,(cw>=0?pts[0][0]:p.x)-R.x),endP=tw>=0?mouth(tw):t,a1=Math.atan2(endP[1]-R.z,endP[0]-R.x);
 const q=a=>Math.round((a-Math.PI/4)/(Math.PI/2)),i0=q(a0),i1=q(a1);let d=((i1-i0)%4+4)%4;const step=d>2?-1:1;if(d>2)d=4-d;
 if(!(cw<0&&tw<0&&d===0))for(let k=0;k<=d;k++){const a=Math.PI/4+(i0+k*step)*Math.PI/2;pts.push(lv?[R.x+Math.cos(a)*ring*Math.SQRT2,R.z+Math.sin(a)*ring*Math.SQRT2]:[R.x+Math.sign(Math.cos(a))*7.9,R.z+Math.sign(Math.sin(a))*7.0])}
 if(tw>=0)pts.push(endP);pts.push(t);return pts}
function mallWalkStep(p,dt){if(PL.inside!=='mall'||p.mlv!==MALL.lvl){p.vx=p.vz=0;return}
 if(p.wait>0){p.wait-=dt;p.mwIdle=true;p.vx=p.vz=0;return}
 if(!p.path||!p.path.length){p.path=mallNewPath(p);p.mst=0;p.mlx=p.x;p.mlz=p.z;if(!p.path){p.wait=2;return}}
 const [tx,tz]=p.path[0],dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
 if(d<.45){p.path.shift();if(!p.path.length){p.wait=1.5+Math.random()*5;p.mwIdle=true;p.vx=p.vz=0;
   // às vezes para virado para a vitrine mais próxima
   const sp=Object.keys(MALL).filter(k=>k.endsWith(p.mlv?'U':'G')&&MALL[k]&&MALL[k].clerk).map(k=>MALL[k]).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];if(sp&&Math.hypot(sp.x-p.x,sp.z-p.z)<9){const l=Math.hypot(sp.x-p.x,sp.z-p.z)||1;p.mx=(sp.x-p.x)/l;p.mz=(sp.z-p.z)/l}}return}
 p.mwIdle=false;p.vx=dx/d*p.spd;p.vz=dz/d*p.spd;p.mx=dx/d;p.mz=dz/d;p.x+=p.vx*dt;p.z+=p.vz*dt;circleVsWorld(p,.3);
 // preso num canteiro/banco: refaz o trajeto a partir de onde está (pular um canto do anel cortava o vão)
 p.mst=(p.mst||0)+dt;if(p.mst>1.4){const moved=Math.hypot(p.x-p.mlx,p.z-p.mlz);if(moved<.5)p.path=null;p.mst=0;p.mlx=p.x;p.mlz=p.z}}
function mallGo(lvl,x,z,face){fadeFlash();const R=lvl?MALL.U:MALL.G;MALL.lvl=lvl;PL.x=R.x+x;PL.z=R.z+z;PL.vx=PL.vz=0;PL.face=face;PL.yaw=Math.atan2(-face[0],-face[1]);MALL.lock=1;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x-face[0]*3,2.6,PL.z-face[1]*3);mallSpawnPeds(R,!!lvl)}
function mallEntryL(){return MALL_LAYOUT[0][2].L}
function enterMall(){if(!MALL.G)buildMall();for(const p of peds.slice())if(!p.fixed)removePed(p);PL.inside='mall';if(MALL.out)doorEnter('mall','mall',MALL.out,MALL.nrm||[0,1]);mallGo(0,-mallEntryL()+2.5,0,[1,0])}
function exitMall(){fadeFlash();if(MUSIC.tmp){MUSIC.tmp=false;if(PLAYER_PAL.headphone!==MUSIC.prev){PLAYER_PAL.headphone=MUSIC.prev;applyPlayerLook()}}for(const q of MALL.peds)if(peds.includes(q))removePed(q);MALL.peds=[];PL.inside=false;const o=MALL.out,n=MALL.nrm;doorExit({x:o.x,z:o.z,nx:n[0],nz:n[1]});MALL.lock=1.2;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x-n[0]*4,2.6,PL.z-n[1]*4);}
const MUSIC={tmp:false,prev:null};
// Loja de discos: perto das prateleiras você ganha um fone de cortesia (aparece no visual) e as rádios tocam; ao sair, devolve.
function musicTick(){const sp=MALL.G&&MALL['music'+(MALL.lvl?'U':'G')];let inS=false;if(PL.inside==='mall'&&sp&&sp.fr&&!sp.fr.none&&!PL.dead){const [a,c]=mallW2L(sp.fr,PL.x,PL.z);inS=c>6.6&&c<11.6&&a>-.2&&a<9.6}
 if(inS&&!MUSIC.tmp){MUSIC.tmp=true;MUSIC.prev=PLAYER_PAL.headphone;if(!PLAYER_PAL.headphone){PLAYER_PAL.headphone='#a02ad6';applyPlayerLook()}toast('FONE DE CORTESIA')}
 else if(!inS&&MUSIC.tmp){MUSIC.tmp=false;if(PLAYER_PAL.headphone!==MUSIC.prev){PLAYER_PAL.headphone=MUSIC.prev;applyPlayerLook()}}}
function mallTick(dt){MALL.lock=Math.max(0,MALL.lock-dt);const inM=PL.inside==='mall';try{musicTick()}catch(e){}
 if(inM)for(const p of peds)if(p.mallCop&&p.lvl!==MALL.lvl&&(p.followT=(p.followT||0)+dt)>3.5)mallCopEnter(p,MALL.lvl);
 if(MALL.arrow){const show=!!MALL.door&&!PL.inside&&Math.hypot(PL.x-MALL.door.x,PL.z-MALL.door.z)<160;MALL.arrow.visible=show;if(show){MALL.arrow.position.set(MALL.door.x,1.5+Math.sin(simT*3)*.18,MALL.door.z);MALL.arrow.rotation.y=simT*1.8}}
 const guide=inM&&PROLOGUE.active&&PROLOGUE.stage==='phoneBuy';
 if(MALL.arrIn){MALL.arrIn.visible=inM&&MALL.lvl===0&&!guide;if(inM){MALL.arrIn.position.set(MALL.G.x-mallEntryL()+1.2,1.5+Math.sin(simT*3)*.18,MALL.G.z);MALL.arrIn.rotation.y=simT*1.8}}
 if(MALL.arrGd){MALL.arrGd.visible=guide;if(guide){const dr=MALL.techU&&MALL.techU.door,t=MALL.lvl===0?{x:MALL.G.x-4,z:MALL.G.z}:dr||MALL.techU||{x:MALL.U.x,z:MALL.U.z};if(MALL.lvl===1&&dr&&(PL.z-dr.zf)*dr.s>0)MALL.arrGd.visible=false; // v77: seta na PORTA da loja; some ao entrar
  MALL.arrGd.position.set(t.x,(MALL.lvl===0?2.2:2.0)+Math.sin(simT*3)*.18,t.z);MALL.arrGd.rotation.y=simT*1.8}}
 if(!inM){if(MALL.door&&!PL.car&&!PL.dead&&!PL.inside&&MALL.lock<=0&&Math.hypot(PL.x-MALL.door.x,PL.z-MALL.door.z)<1.3){if(storyOK('mall'))enterMall();else storyLocked('SHOPPING FECHADO')}return}
 if(PL.dead||MALL.lock>0)return;const R=MALL.lvl?MALL.U:MALL.G,lx=PL.x-R.x,lz=PL.z-R.z;
 if(MALL.lvl===0){if(lx<-mallEntryL()+1.4&&Math.abs(lz)<1.8){exitMall();return}if(lx>-4.8&&lx<-3.15&&Math.abs(lz)<1.1){mallGo(1,MALL_V+1.6,2.4,[1,0]);toast('1º ANDAR');return}}
 else if(lx>MALL_V-.1&&lx<MALL_V+.75&&Math.abs(lz)<1.1){mallGo(0,-6.2,2.6,[-1,0]);toast('TÉRREO');return}
 let best=null,bd=1.7;for(const key of [...MALL_CLERK_KEYS,...MALL_FOOD.map((f,i)=>'fc'+i),...Array.from({length:12},(_,i)=>'vd'+(i+1))]){if(MALLROB[key]&&MALLROB[key].closed)continue;const sp=MALL[key+(MALL.lvl?'U':'G')];if(!sp)continue;const d=Math.hypot(PL.x-sp.x,PL.z-sp.z);if(d<bd){bd=d;best=key}}if(best)CTX.mall=best}
function mallAct(key){if(key==='skate'){skUiOpen('shop');return}if(/^vd\d+$/.test(key)){if(PL.hp>=100){toast('VOCÊ ESTÁ COM A VIDA CHEIA');return}if((PL.money||0)<1){toast('DINHEIRO INSUFICIENTE · REFRIGERANTE $1');clang(.1);return}money(-1);PL.hp=Math.min(100,PL.hp+1);toast('REFRIGERANTE · +1 VIDA · −$1');clang(.2);return}
 if(/^fc\d$/.test(key)){const f=MALL_FOOD[+key[2]],[nm,,price,gain]=f;if(PL.hp>=100){toast('VOCÊ JÁ ESTÁ SATISFEITO');return}if((PL.money||0)<price){toast('DINHEIRO INSUFICIENTE · '+nm+' $'+price);clang(.1);return}money(-price);const g0=PL.hp;PL.hp=Math.min(100,PL.hp+gain);toast(nm+' · +'+Math.round(PL.hp-g0)+' VIDA · −$'+price);clang(.25);const q=peds.find(p=>p.mallClerk===key);if(q)say(q,SAY.thanks);return}
 if(key==='cafe'||key==='pharm'){const cafe=key==='cafe',price=cafe?5:60,gain=cafe?25:100,nm=cafe?'CAFÉ':'REMÉDIO';if(PL.hp>=100){toast(cafe?'VOCÊ JÁ ESTÁ ELÉTRICO DE CAFÉ':'VOCÊ ESTÁ COM A VIDA CHEIA');return}if((PL.money||0)<price){toast('DINHEIRO INSUFICIENTE · '+nm+' $'+price);clang(.1);return}money(-price);const g0=PL.hp;PL.hp=Math.min(100,PL.hp+gain);toast(nm+' · +'+Math.round(PL.hp-g0)+' VIDA · −$'+price);clang(.25);const q=peds.find(p=>p.mallClerk===key);if(q)say(q,SAY.thanks);return}
 if(key==='jewel'){openWard('jewel');return}if(key==='optic'){openWard('optic');return}if(key==='shoes'){openWard('shoes');return}if(key==='beach'){openWard('beach');return}if(key==='music'){toast('LOJA DE DISCOS<br><small style="font-size:11px;color:#fff">fone de cortesia para ouvir as rádios</small>');return}
 if(key==='tech'){openTech();return}if(key==='bag'){openTech('bag');return}if(key==='wear'){openWard();return}if(key==='food'){if(PL.hp>=100){toast('VOCÊ JÁ ESTÁ SATISFEITO');return}if((PL.money||0)<20){toast('DINHEIRO INSUFICIENTE · O LANCHE CUSTA $20');clang(.1);return}money(-20);const g0=PL.hp;PL.hp=Math.min(100,PL.hp+50);toast('LANCHE · +'+Math.round(PL.hp-g0)+' VIDA · −$20');clang(.25);say(SHOP.cashier&&PL.inside==='shop'?SHOP.cashier:peds.find(p=>p.mallClerk==='food'),SAY.thanks)}}

const SHIRT_ART=[null,'bolso','botoes','listras','estampa'];
/* v79r4: estampa custom = 1 caractere na camisa (como a placa do carro): art = 'c:X'. Fonte 3×5 em pixel (sprite e 3D). */
const SHIRT_FONT={"A": "010101111101101", "B": "110101110101110", "C": "011100100100011", "D": "110101101101110", "E": "111100110100111", "F": "111100110100100", "G": "011100101101011", "H": "101101111101101", "I": "111010010010111", "J": "001001001101010", "K": "101101110101101", "L": "100100100100111", "M": "101111111101101", "N": "110101101101101", "O": "010101101101010", "P": "110101110100100", "Q": "010101101110011", "R": "110101110101101", "S": "011100010001110", "T": "111010010010010", "U": "101101101101111", "V": "101101101101010", "W": "101101111111101", "X": "101101010101101", "Y": "101101010010010", "Z": "111001010100111", "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110", "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001110", "!": "010010010000010", "?": "110001010000010", "%": "101001010100101", "#": "101111101111101", "$": "011110010011110", "&": "010101010101011", "@": "111101111100011", "+": "000010111010000", "-": "000000111000000", "*": "101010101000000", "=": "000111000111000", "<": "001010100010001", ">": "100010001010100", "/": "001001010100100", "\\": "100100010001001", ".": "000000000000010", ":": "000010000010000", "^": "010101000000000", "_": "000000000000111", "(": "001010010010001", ")": "100010010010100", "\"": "101101000000000", "'": "010010000000000"};
function shirtGlyphOk(ch){return typeof ch==='string'&&ch.length===1&&Object.prototype.hasOwnProperty.call(SHIRT_FONT,ch)}
function wearValid(k,c){return WEAR_PAL[k].includes(c)||(k==='art'&&typeof c==='string'&&c.length===3&&c.startsWith('c:')&&shirtGlyphOk(c[2]))||(k==='art'&&typeof c==='string'&&c.startsWith('e:')&&emoOk(c.slice(2)))}
function shirtGlyph(a,fn){const ch=a.slice(2),b=SHIRT_FONT[ch];if(!b)return;for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(b[y*3+x]==='1')fn(14+x,21+y)}
/* v3r2 · EMOJIS COLORIDOS (camiseta e skate) + TECLADO DE EMOJIS (#emoKb)
   EMO_DATA = 9 grupos Unicode (emoji 17, 1.914 bases; "~" = aceita tom de pele → 5 variações). EMO_NEW = emojis por versão ≥11:
   o teclado esconde as versões que o aparelho não desenha (teste de 1 representante por versão; bandeiras testadas uma a uma).
   Estampa da camisa: art = 'e:<emoji>' ($25 como as outras, fica no guarda-roupa). Skate: estampa 'EMOJI' com look.emo = até 3.
   Só emojis da lista passam (emoOk) — save, online e guarda-roupa usam a mesma checagem. */
const EMO_DATA=["😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😶‍🌫️ 😏 😒 🙄 😬 😮‍💨 🤥 🫨 🙂‍↔️ 🙂‍↕️ 😌 😔 😪 🤤 😴 🫩 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 😵‍💫 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🫪 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🙈 🙉 🙊 💌 💘 💝 💖 💗 💓 💞 💕 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹 ❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💋 💯 💢 🫯 💥 💫 💦 💨 🕳️ 💬 👁️‍🗨️ 🗨️ 🗯️ 💭 💤", "~👋 ~🤚 ~🖐️ ~✋ ~🖖 ~🫱 ~🫲 ~🫳 ~🫴 ~🫷 ~🫸 ~👌 ~🤌 ~🤏 ~✌️ ~🤞 ~🫰 ~🤟 ~🤘 ~🤙 ~👈 ~👉 ~👆 ~🖕 ~👇 ~☝️ ~🫵 ~👍 ~👎 ~✊ ~👊 ~🤛 ~🤜 ~👏 ~🙌 ~🫶 ~👐 ~🤲 ~🤝 ~🙏 ~✍️ ~💅 ~🤳 ~💪 🦾 🦿 ~🦵 ~🦶 ~👂 ~🦻 ~👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦 ~👶 ~🧒 ~👦 ~👧 ~🧑 ~👱 ~👨 ~🧔 ~🧔‍♂️ ~🧔‍♀️ ~👨‍🦰 ~👨‍🦱 ~👨‍🦳 ~👨‍🦲 ~👩 ~👩‍🦰 ~🧑‍🦰 ~👩‍🦱 ~🧑‍🦱 ~👩‍🦳 ~🧑‍🦳 ~👩‍🦲 ~🧑‍🦲 ~👱‍♀️ ~👱‍♂️ ~🧓 ~👴 ~👵 ~🙍 ~🙍‍♂️ ~🙍‍♀️ ~🙎 ~🙎‍♂️ ~🙎‍♀️ ~🙅 ~🙅‍♂️ ~🙅‍♀️ ~🙆 ~🙆‍♂️ ~🙆‍♀️ ~💁 ~💁‍♂️ ~💁‍♀️ ~🙋 ~🙋‍♂️ ~🙋‍♀️ ~🧏 ~🧏‍♂️ ~🧏‍♀️ ~🙇 ~🙇‍♂️ ~🙇‍♀️ ~🤦 ~🤦‍♂️ ~🤦‍♀️ ~🤷 ~🤷‍♂️ ~🤷‍♀️ ~🧑‍⚕️ ~👨‍⚕️ ~👩‍⚕️ ~🧑‍🎓 ~👨‍🎓 ~👩‍🎓 ~🧑‍🏫 ~👨‍🏫 ~👩‍🏫 ~🧑‍⚖️ ~👨‍⚖️ ~👩‍⚖️ ~🧑‍🌾 ~👨‍🌾 ~👩‍🌾 ~🧑‍🍳 ~👨‍🍳 ~👩‍🍳 ~🧑‍🔧 ~👨‍🔧 ~👩‍🔧 ~🧑‍🏭 ~👨‍🏭 ~👩‍🏭 ~🧑‍💼 ~👨‍💼 ~👩‍💼 ~🧑‍🔬 ~👨‍🔬 ~👩‍🔬 ~🧑‍💻 ~👨‍💻 ~👩‍💻 ~🧑‍🎤 ~👨‍🎤 ~👩‍🎤 ~🧑‍🎨 ~👨‍🎨 ~👩‍🎨 ~🧑‍✈️ ~👨‍✈️ ~👩‍✈️ ~🧑‍🚀 ~👨‍🚀 ~👩‍🚀 ~🧑‍🚒 ~👨‍🚒 ~👩‍🚒 ~👮 ~👮‍♂️ ~👮‍♀️ ~🕵️ ~🕵️‍♂️ ~🕵️‍♀️ ~💂 ~💂‍♂️ ~💂‍♀️ ~🥷 ~👷 ~👷‍♂️ ~👷‍♀️ ~🫅 ~🤴 ~👸 ~👳 ~👳‍♂️ ~👳‍♀️ ~👲 ~🧕 ~🤵 ~🤵‍♂️ ~🤵‍♀️ ~👰 ~👰‍♂️ ~👰‍♀️ ~🤰 ~🫃 ~🫄 ~🤱 ~👩‍🍼 ~👨‍🍼 ~🧑‍🍼 ~👼 ~🎅 ~🤶 ~🧑‍🎄 ~🦸 ~🦸‍♂️ ~🦸‍♀️ ~🦹 ~🦹‍♂️ ~🦹‍♀️ ~🧙 ~🧙‍♂️ ~🧙‍♀️ ~🧚 ~🧚‍♂️ ~🧚‍♀️ ~🧛 ~🧛‍♂️ ~🧛‍♀️ ~🧜 ~🧜‍♂️ ~🧜‍♀️ ~🧝 ~🧝‍♂️ ~🧝‍♀️ 🧞 🧞‍♂️ 🧞‍♀️ 🧟 🧟‍♂️ 🧟‍♀️ 🧌 🫈 ~💆 ~💆‍♂️ ~💆‍♀️ ~💇 ~💇‍♂️ ~💇‍♀️ ~🚶 ~🚶‍♂️ ~🚶‍♀️ ~🚶‍➡️ ~🚶‍♀️‍➡️ ~🚶‍♂️‍➡️ ~🧍 ~🧍‍♂️ ~🧍‍♀️ ~🧎 ~🧎‍♂️ ~🧎‍♀️ ~🧎‍➡️ ~🧎‍♀️‍➡️ ~🧎‍♂️‍➡️ ~🧑‍🦯 ~🧑‍🦯‍➡️ ~👨‍🦯 ~👨‍🦯‍➡️ ~👩‍🦯 ~👩‍🦯‍➡️ ~🧑‍🦼 ~🧑‍🦼‍➡️ ~👨‍🦼 ~👨‍🦼‍➡️ ~👩‍🦼 ~👩‍🦼‍➡️ ~🧑‍🦽 ~🧑‍🦽‍➡️ ~👨‍🦽 ~👨‍🦽‍➡️ ~👩‍🦽 ~👩‍🦽‍➡️ ~🏃 ~🏃‍♂️ ~🏃‍♀️ ~🏃‍➡️ ~🏃‍♀️‍➡️ ~🏃‍♂️‍➡️ ~🧑‍🩰 ~💃 ~🕺 ~🕴️ ~👯 ~👯‍♂️ ~👯‍♀️ ~🧖 ~🧖‍♂️ ~🧖‍♀️ ~🧗 ~🧗‍♂️ ~🧗‍♀️ 🤺 ~🏇 ⛷️ ~🏂 ~🏌️ ~🏌️‍♂️ ~🏌️‍♀️ ~🏄 ~🏄‍♂️ ~🏄‍♀️ ~🚣 ~🚣‍♂️ ~🚣‍♀️ ~🏊 ~🏊‍♂️ ~🏊‍♀️ ~⛹️ ~⛹️‍♂️ ~⛹️‍♀️ ~🏋️ ~🏋️‍♂️ ~🏋️‍♀️ ~🚴 ~🚴‍♂️ ~🚴‍♀️ ~🚵 ~🚵‍♂️ ~🚵‍♀️ ~🤸 ~🤸‍♂️ ~🤸‍♀️ ~🤼 ~🤼‍♂️ ~🤼‍♀️ ~🤽 ~🤽‍♂️ ~🤽‍♀️ ~🤾 ~🤾‍♂️ ~🤾‍♀️ ~🤹 ~🤹‍♂️ ~🤹‍♀️ ~🧘 ~🧘‍♂️ ~🧘‍♀️ ~🛀 ~🛌 ~🧑‍🤝‍🧑 ~👭 ~👫 ~👬 ~💏 ~👩‍❤️‍💋‍👨 ~👨‍❤️‍💋‍👨 ~👩‍❤️‍💋‍👩 ~💑 ~👩‍❤️‍👨 ~👨‍❤️‍👨 ~👩‍❤️‍👩 👨‍👩‍👦 👨‍👩‍👧 👨‍👩‍👧‍👦 👨‍👩‍👦‍👦 👨‍👩‍👧‍👧 👨‍👨‍👦 👨‍👨‍👧 👨‍👨‍👧‍👦 👨‍👨‍👦‍👦 👨‍👨‍👧‍👧 👩‍👩‍👦 👩‍👩‍👧 👩‍👩‍👧‍👦 👩‍👩‍👦‍👦 👩‍👩‍👧‍👧 👨‍👦 👨‍👦‍👦 👨‍👧 👨‍👧‍👦 👨‍👧‍👧 👩‍👦 👩‍👦‍👦 👩‍👧 👩‍👧‍👦 👩‍👧‍👧 🗣️ 👤 👥 🫂 👪 🧑‍🧑‍🧒 🧑‍🧑‍🧒‍🧒 🧑‍🧒 🧑‍🧒‍🧒 👣 🫆", "🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐦‍🔥 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🫍 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🦀 🦞 🦐 🦑 🦪 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🪹 🪺 🍄 🪾", "🍇 🍈 🍉 🍊 🍋 🍋‍🟩 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🫐 🥝 🍅 🫒 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🫚 🫛 🍄‍🟫 🫜 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🫖 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🫗 🥤 🧋 🧃 🧉 🧊 🥢 🍽️ 🍴 🥄 🔪 🫙 🏺", "🌍 🌎 🌏 🌐 🗺️ 🗾 🧭 🏔️ ⛰️ 🛘 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🪨 🪵 🛖 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎠 🛝 🎡 🎢 💈 🎪 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚙 🛻 🚚 🚛 🚜 🏎️ 🏍️ 🛵 🦽 🦼 🛺 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ 🛢️ ⛽ 🛞 🚨 🚥 🚦 🛑 🚧 ⚓ 🛟 ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸 🛎️ 🧳 ⌛ ⏳ ⌚ ⏰ ⏱️ ⏲️ 🕰️ 🕛 🕧 🕐 🕜 🕑 🕝 🕒 🕞 🕓 🕟 🕔 🕠 🕕 🕡 🕖 🕢 🕗 🕣 🕘 🕤 🕙 🕥 🕚 🕦 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 🌡️ ☀️ 🌝 🌞 🪐 ⭐ 🌟 🌠 🌌 ☁️ ⛅ ⛈️ 🌤️ 🌥️ 🌦️ 🌧️ 🌨️ 🌩️ 🌪️ 🌫️ 🌬️ 🌀 🌈 🌂 ☂️ ☔ ⛱️ ⚡ ❄️ ☃️ ⛄ ☄️ 🔥 💧 🌊", "🎃 🎄 🎆 🎇 🧨 ✨ 🎈 🎉 🎊 🎋 🎍 🎎 🎏 🎐 🎑 🧧 🎀 🎁 🎗️ 🎟️ 🎫 🎖️ 🏆 🏅 🥇 🥈 🥉 ⚽ ⚾ 🥎 🏀 🏐 🏈 🏉 🎾 🥏 🎳 🏏 🏑 🏒 🥍 🏓 🏸 🥊 🥋 🥅 ⛳ ⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🎯 🪀 🪁 🔫 🎱 🔮 🪄 🎮 🕹️ 🎰 🎲 🧩 🧸 🪅 🪩 🪆 ♠️ ♥️ ♦️ ♣️ ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢", "👓 🕶️ 🥽 🥼 🦺 👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 🪭 👛 👜 👝 🛍️ 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 🪮 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎼 🎵 🎶 🎙️ 🎚️ 🎛️ 🎤 🎧 📻 🎷 🎺 🪊 🪗 🎸 🎹 🎻 🪕 🥁 🪘 🪇 🪈 🪉 📱 📲 ☎️ 📞 📟 📠 🔋 🪫 🔌 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 🎞️ 📽️ 🎬 📺 📷 📸 📹 📼 🔍 🔎 🕯️ 💡 🔦 🏮 🪔 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ 🪙 💰 🪎 💴 💵 💶 💷 💸 💳 🧾 💹 ✉️ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳️ ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 💼 📁 📂 🗂️ 📅 📆 🗒️ 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ 🔒 🔓 🔏 🔐 🔑 🗝️ 🔨 🪓 ⛏️ ⚒️ 🛠️ 🗡️ ⚔️ 💣 🪃 🏹 🛡️ 🪚 🔧 🪛 🔩 ⚙️ 🗜️ ⚖️ 🦯 🔗 ⛓️‍💥 ⛓️ 🪝 🧰 🧲 🪜 🪏 ⚗️ 🧪 🧫 🧬 🔬 🔭 📡 💉 🩸 💊 🩹 🩼 🩺 🩻 🚪 🛗 🪞 🪟 🛏️ 🛋️ 🪑 🚽 🪠 🚿 🛁 🪤 🪒 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🫧 🪥 🧽 🧯 🛒 🚬 ⚰️ 🪦 ⚱️ 🧿 🪬 🗿 🪧 🪪", "🏧 🚮 🚰 ♿ 🚹 🚺 🚻 🚼 🚾 🛂 🛃 🛄 🛅 ⚠️ 🚸 ⛔ 🚫 🚳 🚭 🚯 🚱 🚷 📵 🔞 ☢️ ☣️ ⬆️ ↗️ ➡️ ↘️ ⬇️ ↙️ ⬅️ ↖️ ↕️ ↔️ ↩️ ↪️ ⤴️ ⤵️ 🔃 🔄 🔙 🔚 🔛 🔜 🔝 🛐 ⚛️ 🕉️ ✡️ ☸️ ☯️ ✝️ ☦️ ☪️ ☮️ 🕎 🔯 🪯 ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ 🔀 🔁 🔂 ▶️ ⏩ ⏭️ ⏯️ ◀️ ⏪ ⏮️ 🔼 ⏫ 🔽 ⏬ ⏸️ ⏹️ ⏺️ ⏏️ 🎦 🔅 🔆 📶 🛜 📳 📴 ♀️ ♂️ ⚧️ ✖️ ➕ ➖ ➗ 🟰 ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 〰️ 💱 💲 ⚕️ ♻️ ⚜️ 🔱 📛 🔰 ⭕ ✅ ☑️ ✔️ ❌ ❎ ➰ ➿ 〽️ ✳️ ✴️ ❇️ ©️ ®️ ™️ 🫟 #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔠 🔡 🔢 🔣 🔤 🅰️ 🆎 🅱️ 🆑 🆒 🆓 ℹ️ 🆔 Ⓜ️ 🆕 🆖 🅾️ 🆗 🅿️ 🆘 🆙 🆚 🈁 🈂️ 🈷️ 🈶 🈯 🉐 🈹 🈚 🈲 🉑 🈸 🈴 🈳 ㊗️ ㊙️ 🈺 🈵 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ◼️ ◻️ ◾ ◽ ▪️ ▫️ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲", "🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇦🇨 🇦🇩 🇦🇪 🇦🇫 🇦🇬 🇦🇮 🇦🇱 🇦🇲 🇦🇴 🇦🇶 🇦🇷 🇦🇸 🇦🇹 🇦🇺 🇦🇼 🇦🇽 🇦🇿 🇧🇦 🇧🇧 🇧🇩 🇧🇪 🇧🇫 🇧🇬 🇧🇭 🇧🇮 🇧🇯 🇧🇱 🇧🇲 🇧🇳 🇧🇴 🇧🇶 🇧🇷 🇧🇸 🇧🇹 🇧🇻 🇧🇼 🇧🇾 🇧🇿 🇨🇦 🇨🇨 🇨🇩 🇨🇫 🇨🇬 🇨🇭 🇨🇮 🇨🇰 🇨🇱 🇨🇲 🇨🇳 🇨🇴 🇨🇵 🇨🇶 🇨🇷 🇨🇺 🇨🇻 🇨🇼 🇨🇽 🇨🇾 🇨🇿 🇩🇪 🇩🇬 🇩🇯 🇩🇰 🇩🇲 🇩🇴 🇩🇿 🇪🇦 🇪🇨 🇪🇪 🇪🇬 🇪🇭 🇪🇷 🇪🇸 🇪🇹 🇪🇺 🇫🇮 🇫🇯 🇫🇰 🇫🇲 🇫🇴 🇫🇷 🇬🇦 🇬🇧 🇬🇩 🇬🇪 🇬🇫 🇬🇬 🇬🇭 🇬🇮 🇬🇱 🇬🇲 🇬🇳 🇬🇵 🇬🇶 🇬🇷 🇬🇸 🇬🇹 🇬🇺 🇬🇼 🇬🇾 🇭🇰 🇭🇲 🇭🇳 🇭🇷 🇭🇹 🇭🇺 🇮🇨 🇮🇩 🇮🇪 🇮🇱 🇮🇲 🇮🇳 🇮🇴 🇮🇶 🇮🇷 🇮🇸 🇮🇹 🇯🇪 🇯🇲 🇯🇴 🇯🇵 🇰🇪 🇰🇬 🇰🇭 🇰🇮 🇰🇲 🇰🇳 🇰🇵 🇰🇷 🇰🇼 🇰🇾 🇰🇿 🇱🇦 🇱🇧 🇱🇨 🇱🇮 🇱🇰 🇱🇷 🇱🇸 🇱🇹 🇱🇺 🇱🇻 🇱🇾 🇲🇦 🇲🇨 🇲🇩 🇲🇪 🇲🇫 🇲🇬 🇲🇭 🇲🇰 🇲🇱 🇲🇲 🇲🇳 🇲🇴 🇲🇵 🇲🇶 🇲🇷 🇲🇸 🇲🇹 🇲🇺 🇲🇻 🇲🇼 🇲🇽 🇲🇾 🇲🇿 🇳🇦 🇳🇨 🇳🇪 🇳🇫 🇳🇬 🇳🇮 🇳🇱 🇳🇴 🇳🇵 🇳🇷 🇳🇺 🇳🇿 🇴🇲 🇵🇦 🇵🇪 🇵🇫 🇵🇬 🇵🇭 🇵🇰 🇵🇱 🇵🇲 🇵🇳 🇵🇷 🇵🇸 🇵🇹 🇵🇼 🇵🇾 🇶🇦 🇷🇪 🇷🇴 🇷🇸 🇷🇺 🇷🇼 🇸🇦 🇸🇧 🇸🇨 🇸🇩 🇸🇪 🇸🇬 🇸🇭 🇸🇮 🇸🇯 🇸🇰 🇸🇱 🇸🇲 🇸🇳 🇸🇴 🇸🇷 🇸🇸 🇸🇹 🇸🇻 🇸🇽 🇸🇾 🇸🇿 🇹🇦 🇹🇨 🇹🇩 🇹🇫 🇹🇬 🇹🇭 🇹🇯 🇹🇰 🇹🇱 🇹🇲 🇹🇳 🇹🇴 🇹🇷 🇹🇹 🇹🇻 🇹🇼 🇹🇿 🇺🇦 🇺🇬 🇺🇲 🇺🇳 🇺🇸 🇺🇾 🇺🇿 🇻🇦 🇻🇨 🇻🇪 🇻🇬 🇻🇮 🇻🇳 🇻🇺 🇼🇫 🇼🇸 🇽🇰 🇾🇪 🇾🇹 🇿🇦 🇿🇲 🇿🇼 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿"];
const EMO_NEW={"11.0": "🥰 🥵 🥶 🥴 🥳 🥺 🦵 🦶 🦷 🦴 👨‍🦰 👨‍🦱 👨‍🦳 👨‍🦲 👩‍🦰 👩‍🦱 👩‍🦳 👩‍🦲 🦸 🦸‍♂️ 🦸‍♀️ 🦹 🦹‍♂️ 🦹‍♀️ 🦝 🦙 🦛 🦘 🦡 🦢 🦚 🦜 🦞 🦟 🦠 🥭 🥬 🥯 🧂 🥮 🧁 🧭 🧱 🛹 🧳 🧨 🧧 🥎 🥏 🥍 🧩 🧸 ♟️ 🧵 🧶 🥽 🥼 🥾 🥿 🧮 🧾 🧰 🧲 🧪 🧫 🧬 🧴 🧷 🧹 🧺 🧻 🧼 🧽 🧯 🧿 ♾️ 🏴‍☠️", "12.0": "🥱 🤎 🤍 🤏 🦾 🦿 🦻 🧏 🧏‍♂️ 🧏‍♀️ 🧍 🧍‍♂️ 🧍‍♀️ 🧎 🧎‍♂️ 🧎‍♀️ 👨‍🦯 👩‍🦯 👨‍🦼 👩‍🦼 👨‍🦽 👩‍🦽 🧑‍🤝‍🧑 🦧 🦮 🐕‍🦺 🦥 🦦 🦨 🦩 🦪 🧄 🧅 🧇 🧆 🧈 🧃 🧉 🧊 🛕 🦽 🦼 🛺 🪂 🪐 🤿 🪀 🪁 🦺 🥻 🩱 🩲 🩳 🩰 🪕 🪔 🪓 🦯 🩸 🩹 🩺 🪑 🪒 🟠 🟡 🟢 🟣 🟤 🟥 🟧 🟨 🟩 🟦 🟪 🟫", "12.1": "🧑‍🦰 🧑‍🦱 🧑‍🦳 🧑‍🦲 🧑‍⚕️ 🧑‍🎓 🧑‍🏫 🧑‍⚖️ 🧑‍🌾 🧑‍🍳 🧑‍🔧 🧑‍🏭 🧑‍💼 🧑‍🔬 🧑‍💻 🧑‍🎤 🧑‍🎨 🧑‍✈️ 🧑‍🚀 🧑‍🚒 🧑‍🦯 🧑‍🦼 🧑‍🦽", "13.0": "🥲 🥸 🤌 🫀 🫁 🥷 🤵‍♂️ 🤵‍♀️ 👰‍♂️ 👰‍♀️ 👩‍🍼 👨‍🍼 🧑‍🍼 🧑‍🎄 🫂 🐈‍⬛ 🦬 🦣 🦫 🐻‍❄️ 🦤 🪶 🦭 🪲 🪳 🪰 🪱 🪴 🫐 🫒 🫑 🫓 🫔 🫕 🫖 🧋 🪨 🪵 🛖 🛻 🛼 🪄 🪅 🪆 🪡 🪢 🩴 🪖 🪗 🪘 🪙 🪃 🪚 🪛 🪝 🪜 🛗 🪞 🪟 🪠 🪤 🪣 🪥 🪦 🪧 ⚧️ 🏳️‍⚧️", "13.1": "😶‍🌫️ 😮‍💨 😵‍💫 ❤️‍🔥 ❤️‍🩹 🧔‍♂️ 🧔‍♀️", "14.0": "🫠 🫢 🫣 🫡 🫥 🫤 🥹 🫱 🫲 🫳 🫴 🫰 🫵 🫶 🫦 🫅 🫃 🫄 🧌 🪸 🪷 🪹 🪺 🫘 🫗 🫙 🛝 🛞 🛟 🪩 🪫 🩼 🩻 🫧 🪬 🪪 🟰", "15.0": "🫨 🩷 🩵 🩶 🫷 🫸 🫎 🫏 🪽 🐦‍⬛ 🪿 🪼 🪻 🫚 🫛 🪭 🪮 🪇 🪈 🪯 🛜", "15.1": "🙂‍↔️ 🙂‍↕️ 🚶‍➡️ 🚶‍♀️‍➡️ 🚶‍♂️‍➡️ 🧎‍➡️ 🧎‍♀️‍➡️ 🧎‍♂️‍➡️ 🧑‍🦯‍➡️ 👨‍🦯‍➡️ 👩‍🦯‍➡️ 🧑‍🦼‍➡️ 👨‍🦼‍➡️ 👩‍🦼‍➡️ 🧑‍🦽‍➡️ 👨‍🦽‍➡️ 👩‍🦽‍➡️ 🏃‍➡️ 🏃‍♀️‍➡️ 🏃‍♂️‍➡️ 🧑‍🧑‍🧒 🧑‍🧑‍🧒‍🧒 🧑‍🧒 🧑‍🧒‍🧒 🐦‍🔥 🍋‍🟩 🍄‍🟫 ⛓️‍💥", "16.0": "🫩 🫆 🪾 🫜 🪉 🪏 🫟 🇨🇶", "17.0": "🫪 🫯 🫈 🧑‍🩰 🫍 🛘 🪊 🪎"};
const EMO_REP={"11.0": "🥰", "12.0": "🥱", "12.1": "🧑‍🦰", "13.0": "🥲", "13.1": "😶‍🌫️", "14.0": "🫠", "15.0": "🫨", "15.1": "🙂‍↔️", "16.0": "🫩", "17.0": "🫪"};
const EMO_TONES=['','\u{1F3FB}','\u{1F3FC}','\u{1F3FD}','\u{1F3FE}','\u{1F3FF}'],EMO_ICONS=['🕘','😀','👋','🐶','🍔','✈️','⚽','💡','❤️','🏁'];
const EMOKB={open:false,cb:null,tab:1,tone:0,all:null,mb:null,ver:null,ok:new Map(),el:null,multi:false};
function emoBase(){if(EMOKB.all)return;const all=new Set(),mb=new Set();for(const g of EMO_DATA)for(const it of g.split(' ')){const t=it[0]==='~',e=t?it.slice(1):it;all.add(e);if(t)mb.add([...e][0])}
 EMOKB.mb=mb;for(const g of EMO_DATA)for(const it of g.split(' '))if(it[0]==='~')for(let i=1;i<6;i++)all.add(emoTone(it.slice(1),i));EMOKB.all=all;
 const ver=new Map();for(const v in EMO_NEW)for(const e of EMO_NEW[v].split(' '))ver.set(e,+v);EMOKB.ver=ver}
function emoTone(e,t){if(!t)return e;const T=EMO_TONES[t],segs=e.split('‍');return segs.map(s=>{const c=[...s];if(segs.length>1&&c[0]==='\u{1F91D}')return s;if(!EMOKB.mb||!EMOKB.mb.has(c[0]))return s;return c[0]+T+c.slice(1).filter((x,i)=>!(i===0&&x==='️')).join('')}).join('‍')}
function emoOk(e){if(typeof e!=='string'||!e||e.length>40)return false;emoBase();return EMOKB.all.has(e)}
const EMO_FONT='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","Android Emoji",sans-serif';
const EMO_CV=new Map();
function emoCanvas(e,S=64){const k=S+'|'+e;let c=EMO_CV.get(k);if(c)return c;c=cv(S,S);const g=c.getContext('2d');g.font=Math.round(S*.84)+'px '+EMO_FONT;g.textAlign='center';g.textBaseline='middle';
 const w=g.measureText(e).width;if(w>S*.98){const s=S*.98/w;g.translate(S/2,S/2);g.scale(s,s);g.fillText(e,0,S*.04)}else g.fillText(e,S/2,S/2+S*.04);if(EMO_CV.size>300)EMO_CV.delete(EMO_CV.keys().next().value);EMO_CV.set(k,c);return c}
/* o aparelho desenha esse emoji? colorido (não é o quadradinho/tofu) e sem virar 2 desenhos lado a lado (sequência ZWJ que ele não conhece) */
function emoDraws(e){if(EMOKB.ok.has(e))return EMOKB.ok.get(e);let ok=true;try{const c=cv(32,32),g=c.getContext('2d',{willReadFrequently:true});g.font='26px '+EMO_FONT;g.textBaseline='top';const ref=g.measureText('\u{1F600}').width||26;
  if(g.measureText(e).width>ref*1.35)ok=false;else{g.fillText(e,0,2);const d=g.getImageData(0,0,32,32).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>60&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])>40)n++;ok=n>6}}catch(err){ok=true}
 EMOKB.ok.set(e,ok);return ok}
function emoVisible(e){emoBase();const v=EMOKB.ver.get(e);if(v&&!emoDraws(EMO_REP[String(v)]||EMO_REP[v.toFixed(1)]||e))return false;if(/[\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}]/u.test(e))return emoDraws(e);return true}
function emoRecent(){try{const a=JSON.parse(localStorage.getItem('ccss_emo_recent')||'[]');return Array.isArray(a)?a.filter(emoOk).slice(0,40):[]}catch(e){return[]}}
function emoRecentAdd(e){try{const a=[e,...emoRecent().filter(x=>x!==e)].slice(0,40);localStorage.setItem('ccss_emo_recent',JSON.stringify(a))}catch(err){}}
function emoKbBuild(){if(EMOKB.el)return EMOKB.el;const st=document.createElement('style');st.textContent=
 '#emoKb{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(6,4,14,.55);font-family:"Segoe UI",Arial,sans-serif;color:#fff;padding:0 env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0)}#emoKb[hidden]{display:none}'+
 '#emoKb .ek-box{width:min(560px,calc(100vw - 16px));height:min(440px,calc(100vh - 16px));height:min(440px,calc(100dvh - 16px));display:flex;flex-direction:column;background:#15121e;border:2px solid #ffd23a;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.6)} /* v3 r30: centralizado na tela (era preso embaixo como teclado de celular e ficava cortado/por cima do botão) */'+
 '#emoKb .ek-hd{display:flex;align-items:center;gap:8px;padding:8px 12px 4px;font:700 15px Silkscreen,monospace;color:#ffd23a}#emoKb .ek-hd b{flex:1}#emoKb .ek-x{background:none;border:0;color:#fff;font-size:20px;cursor:pointer;padding:2px 6px}'+
 '#emoKb .ek-tone{display:flex;gap:5px}#emoKb .ek-tone button{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.3);padding:0;cursor:pointer}#emoKb .ek-tone button.on{border-color:#fff;box-shadow:0 0 0 2px #ffd23a}'+
 '#emoKb .ek-tabs{display:flex;gap:2px;padding:0 8px;border-bottom:1px solid #2c2840;overflow-x:auto;scrollbar-width:none}#emoKb .ek-tabs button{flex:1 0 auto;min-width:40px;height:38px;font-size:21px;background:none;border:0;border-bottom:3px solid transparent;cursor:pointer;opacity:.55;font-family:'+EMO_FONT.replace(/"/g,"'")+'}#emoKb .ek-tabs button.on{opacity:1;border-bottom-color:#ffd23a}'+
 '#emoKb .ek-grid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:2px;padding:8px;align-content:start;-webkit-overflow-scrolling:touch}'+
 '#emoKb .ek-grid button{height:44px;font-size:28px;line-height:1;background:none;border:0;border-radius:8px;cursor:pointer;padding:0;font-family:'+EMO_FONT.replace(/"/g,"'")+'}#emoKb .ek-grid button:hover,#emoKb .ek-grid button:focus{background:#2c2840;outline:none}'+
 '#emoKb .ek-empty{grid-column:1/-1;color:#9a94b0;font-size:13px;text-align:center;padding:24px 0}'+
 /* v3 r28: rodapé com os botões do controle; toque com alvos maiores e rolagem só vertical na grade */
 '#emoKb .ek-ft{padding:6px 12px 8px;border-top:1px solid #2c2840;font:700 11px Silkscreen,monospace;color:#cfc8e8;letter-spacing:.04em;text-align:center}#emoKb .ek-ft[hidden]{display:none}#emoKb .ek-ft kbd{display:inline-block;min-width:16px;padding:0 4px;margin:0 2px;border:1px solid #ffd23a;border-radius:4px;color:#ffd23a;font:inherit}'+
 '#emoKb button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}#emoKb .ek-grid{touch-action:pan-y;overscroll-behavior:contain}#emoKb .ek-tabs{touch-action:pan-x}'+
 '@media (pointer:coarse){#emoKb .ek-tone{gap:7px}#emoKb .ek-tone button{width:28px;height:28px}#emoKb .ek-x{font-size:24px;min-width:44px;min-height:40px}#emoKb .ek-tabs button{min-width:46px;height:44px}#emoKb .ek-grid{grid-template-columns:repeat(auto-fill,minmax(48px,1fr))}#emoKb .ek-grid button{height:48px}}';
 document.head.appendChild(st);const el=document.createElement('div');el.id='emoKb';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML='<div class="ek-box"><div class="ek-hd"><b id="ekT"></b><span class="ek-tone" id="ekTone"></span><button type="button" class="ek-x" id="ekX" aria-label="fechar">✕</button></div><div class="ek-tabs" id="ekTabs"></div><div class="ek-grid" id="ekGrid"></div><div class="ek-ft" id="ekFt" hidden></div></div>';
 document.body.appendChild(el);el.addEventListener('click',e=>{if(e.target===el)emoKbClose()});el.querySelector('#ekX').addEventListener('click',emoKbClose);
 const tn=el.querySelector('#ekTone');['#ffcc22','#f7d7c4','#e8b48f','#c58c62','#9c6440','#5c3a28'].forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.style.background=c;b.title=i?'tom '+i:'padrão';b.addEventListener('click',()=>{EMOKB.tone=i;try{localStorage.setItem('ccss_emo_tone',String(i))}catch(err){}emoKbRender()});tn.appendChild(b)});
 const tb=el.querySelector('#ekTabs');EMO_ICONS.forEach((ic,i)=>{const b=document.createElement('button');b.type='button';b.textContent=ic;b.addEventListener('click',()=>{EMOKB.tab=i;emoKbRender();el.querySelector('#ekGrid').scrollTop=0});tb.appendChild(b)});
 el.querySelector('#ekGrid').addEventListener('click',e=>{const b=e.target.closest('button[data-e]');if(b)emoKbPick(b.dataset.e)});
 try{EMOKB.tone=Math.max(0,Math.min(5,+localStorage.getItem('ccss_emo_tone')||0))}catch(err){}
 return EMOKB.el=el}
function emoKbRender(){const el=EMOKB.el;if(!el)return;el.querySelector('#ekT').textContent=translatePlain('TECLADO DE EMOJIS');
 el.querySelectorAll('#ekTabs button').forEach((b,i)=>b.classList.toggle('on',i===EMOKB.tab));el.querySelectorAll('#ekTone button').forEach((b,i)=>b.classList.toggle('on',i===EMOKB.tone));
 const gr=el.querySelector('#ekGrid'),f=document.createDocumentFragment();let list;
 if(EMOKB.tab===0)list=emoRecent();else list=EMO_DATA[EMOKB.tab-1].split(' ').map(it=>it[0]==='~'?emoTone(it.slice(1),EMOKB.tone):it);
 let n=0;for(const e of list){if(EMOKB.tab&&!emoVisible(e.replace(/[\u{1F3FB}-\u{1F3FF}]/gu,'')))continue;const b=document.createElement('button');b.type='button';b.dataset.e=e;b.textContent=e;f.appendChild(b);n++}
 gr.innerHTML='';if(!n){const d=document.createElement('div');d.className='ek-empty';d.textContent=translatePlain('nenhum emoji usado ainda');gr.appendChild(d)}gr.appendChild(f)}
/* abre o teclado; cb(emoji) recebe o escolhido. O teclado fecha sozinho depois de escolher. */
function emoKbOpen(cb){emoKbBuild();emoBase();EMOKB.cb=cb;EMOKB.open=true;EMOKB.back=document.activeElement;emoKbFoot();if(EMOKB.tab===0&&!emoRecent().length)EMOKB.tab=1;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();EMOKB.el.hidden=false;emoKbRender();
 try{if(document.body.classList.contains('padnav'))emoKbFocus0(EMOKB.el)}catch(e){}}
function emoKbClose(){if(!EMOKB.open)return;EMOKB.open=false;EMOKB.cb=null;if(EMOKB.el)EMOKB.el.hidden=true;
 /* v3 r28: no controle o foco volta ao botão que abriu o teclado (guarda-roupa, skate shop, tela do online) */
 const b=EMOKB.back;EMOKB.back=null;try{if(b&&b.isConnected&&!b.disabled&&b.offsetParent!==null&&document.body.classList.contains('padnav'))b.focus()}catch(e){}}
/* rodapé com os botões do controle (só aparece quando o controle está em uso) */
function emoKbFoot(){const f=EMOKB.el&&EMOKB.el.querySelector('#ekFt');if(!f)return;let on=false;try{on=padActive()}catch(e){}f.hidden=!on;if(!on)return;
 const en=S.lang==='en',k=t=>'<kbd>'+t+'</kbd>',xb=padGlyph(0)==='A';f.innerHTML=k(padGlyph(0))+(en?' PICK':' ESCOLHER')+' · '+k(padGlyph(1))+(en?' CLOSE':' FECHAR')+' · '+k(xb?'LB':'L1')+k(xb?'RB':'R1')+(en?' TAB':' ABA')+' · '+k(padGlyph(3))+(en?' SKIN TONE':' TOM DE PELE')}
function emoKbPick(e){if(!emoOk(e))return;emoRecentAdd(e);const cb=EMOKB.cb,back=EMOKB.back;emoKbClose();try{clang(.08)}catch(err){}if(cb)cb(e);emoKbRefocus(back)}
/* v3 r28: no controle, se o botão de origem ficou desativado depois da escolha (skate com 3 emojis), o foco vai para perto dele na mesma janela */
function emoKbRefocus(b){if(!b||!document.body.classList.contains('padnav'))return;const a=document.activeElement,dlg=b.closest&&b.closest('#skShop,#ward,#onJoin');if(!dlg)return;
 if(a&&a!==document.body&&dlg.contains(a)&&!a.disabled&&a.offsetParent!==null)return;const L=dlg.id==='skShop'&&[...dlg.querySelectorAll('#skEmoList button')].pop();if(L){L.focus();return}padNavFocus(dlg,0)}
/* controle: direcional/analógico navega, ✕ escolhe, ○ fecha, L1/R1 trocam a aba */
function emoKbFocus0(el){document.body.classList.add('padnav');const b=el.querySelector('#ekGrid button')||el.querySelector('#ekTabs button');if(b){b.focus();try{b.scrollIntoView({block:'nearest'})}catch(e){}}}
function emoKbPad(pr){const el=EMOKB.el;if(!el)return;if(pr(1)||pr(9)){emoKbClose();return}
 if(el.querySelector('#ekFt').hidden)emoKbFoot();
 if(pr(3)){const ae=document.activeElement,gi=ae&&ae.parentElement&&ae.parentElement.id==='ekGrid'?[...ae.parentElement.children].indexOf(ae):-1;EMOKB.tone=(EMOKB.tone+1)%6;try{localStorage.setItem('ccss_emo_tone',String(EMOKB.tone))}catch(err){}emoKbRender();const nb=gi>=0&&el.querySelector('#ekGrid').children[gi];if(nb&&nb.focus)nb.focus();return}
 if(pr(4)||pr(5)){EMOKB.tab=(EMOKB.tab+(pr(5)?1:EMO_ICONS.length-1))%EMO_ICONS.length;emoKbRender();el.querySelector('#ekGrid').scrollTop=0;emoKbFocus0(el);return}
 const ae=document.activeElement,inD=ae&&el.contains(ae);PAD.navT=(PAD.navT||0)-(1/60);let sv=0,sh=0;if(PAD.navT<=0){if(PAD.ly>.6)sv=1;else if(PAD.ly<-.6)sv=-1;if(PAD.lx>.6)sh=1;else if(PAD.lx<-.6)sh=-1;if(sv||sh)PAD.navT=.2}else if(Math.abs(PAD.ly)<.3&&Math.abs(PAD.lx)<.3)PAD.navT=0;
 const d=pr(13)||sv>0,u=pr(12)||sv<0,r=pr(15)||sh>0,l=pr(14)||sh<0;
 if(!inD&&(d||u||r||l||pr(0))){emoKbFocus0(el);return}
 if(d)padNavFocus(el,1,[0,1]);else if(u)padNavFocus(el,-1,[0,-1]);else if(r)padNavFocus(el,1,[1,0]);else if(l)padNavFocus(el,-1,[-1,0]);
 else if(pr(0)&&ae&&ae.click){ae.click();try{ae.scrollIntoView({block:'nearest'})}catch(e){}}
 if((d||u||r||l)&&document.activeElement&&el.contains(document.activeElement))try{document.activeElement.scrollIntoView({block:'nearest'})}catch(e){}}
addEventListener('keydown',e=>{if(!EMOKB.open)return;if(e.code==='Escape'){e.preventDefault();emoKbClose()}e.stopImmediatePropagation()},true);
addEventListener('keyup',e=>{if(EMOKB.open)e.stopImmediatePropagation()},true);
/* camiseta: emoji colorido no peito (2D e 3D) */
function shirtEmoOf(p0){const a=shirtArtOf(p0);return typeof a==='string'&&a.startsWith('e:')&&emoOk(a.slice(2))?a.slice(2):null}
function shirtEmo2D(g,ox,oy,p0){const e=shirtEmoOf(p0);if(!e)return;const s=g.imageSmoothingEnabled;g.imageSmoothingEnabled=true;g.drawImage(emoCanvas(e,64),ox+12,oy+20,8,8);g.imageSmoothingEnabled=s}
const WEAR_PAL={bikini:[null,'#1e5ab0','#d62828','#1b1b1b','#2ac8c8','#f2c21a','#ff6fae','#3ab36a','#ff8a1a','#f2f2ee'],shirt:[null,'#2f6fd6','#d62828','#f2f2ee','#1b1b1b','#3ab36a','#f2c21a','#ff6fae','#7a4ad6','#ff8a1a','#2ac8c8','#8a5a3a','#5a5a62'],pants:['#2b3550','#1b1b1b','#5a4a3a','#3a5a8a','#8a8a90','#c8b890','#6a2a2a','#2a4a2a'],swim:[null,'#1e5ab0','#d62828','#1b1b1b','#2ac8c8','#f2c21a','#ff6fae','#3ab36a'],shoes:[null,'#1b1b1b','#f2f2ee','#7a4a2a','#d62828','#2a5ab0','#c8c8d0','#e8b830','#3a3a40'],
 art:SHIRT_ART,
 cap:[null,'#d62828','#1b1b1b','#2f6fd6','#f2f2ee','#3ab36a','#f2c21a','#ff6fae','#7a4ad6','#ff8a1a'],glasses:[null,'#121218','#3a6aa8','#a83a3a','#e8b830','#ff4fd8','#2ad6c8'],necklace:[null,'#e8c040','#d8d8e0','#ff4fa0','#2ad6ff'],belt:['#3a2a1a','#1b1b1b','#e8c040','#d8d8e0','#c8203a','#2a6ad6','#ff4fa0','#3ab36a'],bag:[null,'#2f6fd6','#d62828','#f2f2ee','#1b1b1b','#3ab36a','#f2c21a','#ff6fae','#7a4ad6','#2ac8c8','#8a5a3a','#5a5a62'],headphone:[null,'#1b1b1b','#f2f2ee','#d62828','#2a6ad6','#ff4fa3','#3ab36a']};
const WEAR_NM={bikini:'BIQUÍNI · PARTE DE CIMA',shirt:'CAMISA',art:'ESTAMPA DA CAMISA',pants:'CALÇA',swim:'SUNGA (ROUPA DE PRAIA)',shoes:'CALÇADO',cap:'BONÉ',glasses:'ÓCULOS',necklace:'COLAR',belt:'FIVELA DO CINTO',headphone:'HEADPHONE (LOJA DE ELETRÔNICOS)',bag:'MOCHILA (MALAS & MOCHILAS CO.)'},WEAR_PRICE=25;
const WEAR_DEFAULT={bikini:null,art:null,belt:'#3a2a1a',shirt:'#2f6fd6',pants:'#2b3550',swim:null,headphone:null,bag:null,shoes:'#1b1b1b',cap:'#d62828',glasses:null,necklace:null};
let WEAR_OWNED=Object.fromEntries(Object.entries(WEAR_DEFAULT).map(([k,c])=>[k,[...new Set([c,...(WEAR_PAL[k].includes(null)?[null]:[])])]]));
function wearOwned(k,c){return !!WEAR_OWNED[k]?.includes(c||null)}
// Cada personagem tem o próprio guarda-roupa: o que um compra, o outro não ganha.
function charKitGet(){if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;return{inv:JSON.parse(JSON.stringify(GUN.inv||{})),w:GUN.w,hp:Math.max(1,Math.round(PL.hp)),armor:Math.round(PL.armor||0),ch:{hp:!!CHEAT.hp,ammo:!!CHEAT.ammo,wanted:!!CHEAT.wanted}}}
function charKitSet(k){k=k||{};GUN.inv=k.inv?JSON.parse(JSON.stringify(k.inv)):{};GUN.w=k.w||'pistol';GUN.has=false;GUN.ammo=0;GUN.firing=false;PL.hp=k.hp||100;PL.armor=k.armor||0;CHEAT.hp=!!(k.ch&&k.ch.hp);CHEAT.ammo=!!(k.ch&&k.ch.ammo);CHEAT.wanted=!!(k.ch&&k.ch.wanted)}
function wearSwap(to){if(to===CHAR.cur)return;CHAR.list[CHAR.cur].kit=charKitGet();charKitSet(CHAR.list[to].kit);setTimeout(()=>{const c=CHAR.list[to];if(!c||!c.pixIn||!c.pixIn.length||CHAR.cur!==to)return;for(const p of c.pixIn){const t=p.from+' te enviou um PIXel de $'+p.n.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+'!';PHONE.msgs.unshift({t:gameMin(),txt:t,read:false})}const p=c.pixIn[c.pixIn.length-1];toast('<span style="color:#7dff8a">'+p.from+' te enviou um PIXel de $'+p.n.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+'!</span>');c.pixIn=[];phoneBeep()},2600);CHAR.list[CHAR.cur].owned=WEAR_OWNED;CHAR.list[CHAR.cur].cash=PL.money||0;PL.money=CHAR.list[to].cash||0;CHAR.cur=to;const o=CHAR.list[to].owned;if(o)WEAR_OWNED=o;else{wearLoad(null,CHAR.list[to].look||(to===1?LUCIA_PAL:WEAR_DEFAULT));CHAR.list[to].owned=WEAR_OWNED}}
function wearChars(){return CHAR.list.map((c,i)=>{const o=i===CHAR.cur?WEAR_OWNED:c.owned;return o?Object.fromEntries(Object.keys(WEAR_PAL).map(k=>[k,[...(o[k]||[])]])):null})}
function wearSave(){return Object.fromEntries(Object.keys(WEAR_PAL).map(k=>[k,[...WEAR_OWNED[k]]]))}
function wearLoad(data,look){WEAR_OWNED={};for(const k of Object.keys(WEAR_PAL)){const a=[WEAR_DEFAULT[k],...(Array.isArray(data?.[k])?data[k]:[]),look?.[k],...(WEAR_PAL[k].includes(null)?[null]:[])];WEAR_OWNED[k]=[...new Set(a.filter(c=>wearValid(k,c))) ]}}
function wardNear(){const w=SAFE.wardRect;return PL.inside===true&&!PL.car&&!PL.dead&&!!w&&PL.x>=w.x0&&PL.x<w.x1&&PL.z>=w.z0&&PL.z<w.z1}
const WARD={open:false,pal:null,home:false};
// v77: o que cada loja vende (casa mostra tudo). Óculos só na ótica, calçados só na sapataria, sunga/biquíni na Moda Praia.
const WARD_ALLOW={store:['shirt','art','pants','cap','headphone','bag'],jewel:['necklace','belt'],optic:['glasses'],shoes:['shoes'],beach:['swim','bikini','shirt','shoes']};
function openWard(mode){WARD.open=true;WARD.home=mode==='home';WARD.mode=mode||'store';WARD.pal={...PLAYER_PAL};for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();const box=$('#wardSecs');box.innerHTML='';$('#wardT').textContent=WARD.home?'CASA · GUARDA-ROUPA':WARD.mode==='jewel'?'JOIAS · COLARES E FIVELAS':WARD.mode==='optic'?'ÓTICA · ÓCULOS':WARD.mode==='shoes'?'SAPATOS · CALÇADOS':WARD.mode==='beach'?'MODA PRAIA · SUNGA E BIQUÍNI':'MODA PIXEL · PROVADOR';
 $('#ward').dataset.store=WARD.mode;for(const k of Object.keys(WEAR_PAL)){const allow=WARD_ALLOW[WARD.mode];if(allow&&!allow.includes(k))continue;if(k==='bikini'&&CHAR.cur!==1)continue;const lu=CHAR.cur===1,bt=WARD.mode==='beach'?(k==='swim'?(lu?'BIQUÍNI · PARTE DE BAIXO':'SUNGA'):k==='shirt'?(lu?'SEM BLUSA':'SEM CAMISA'):k==='shoes'?'DESCALÇO':WEAR_NM[k]):(k==='swim'&&lu?'BIQUÍNI · PARTE DE BAIXO':WEAR_NM[k]);const sec=document.createElement('div');sec.className='msec';sec.innerHTML=`<h2>${bt}</h2>`;const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:6px';
  if((k==='headphone'||k==='bag')&&!(WEAR_OWNED[k]||[]).some(Boolean))continue;
  for(const c of WEAR_PAL[k]){if((k==='headphone'||k==='bag')&&!wearOwned(k,c))continue;if(WARD.mode==='beach'&&(k==='shirt'||k==='shoes')&&c!==null)continue;const owned=wearOwned(k,c),locked=(WARD.home||k==='headphone'||k==='bag')&&!owned,b=document.createElement('button');b.type='button';b.className='sw';b.style.height='36px';b.title=(c||'nenhum')+(k==='bag'&&!owned?' · compre na Malas & Mochilas Co. do shopping':'')+(k==='headphone'&&!owned?' · compre na loja de eletrônicos do shopping':'')+(locked?' · compre na loja':owned?' · disponível':' · $'+WEAR_PRICE);b.style.background=k==='art'&&c?'#2a2a30':c||'repeating-linear-gradient(45deg,#222 0 6px,#444 6px 12px)';if(!c)b.textContent='✕';else if(k==='art'){b.textContent={bolso:'▣',botoes:'⋮',listras:'|||',estampa:'◎'}[c]||'?';b.style.color='#fff';b.style.fontSize='14px';b.title=({bolso:'bolso',botoes:'botões',listras:'listras',estampa:'estampa'}[c]||c)+(locked?' · compre na loja':owned?' · disponível':' · $'+WEAR_PRICE)}if(locked){b.textContent='🔒';b.disabled=true;b.style.opacity='.28'}b.style.color='#fff';b.dataset.k=k;b.dataset.c=c||'';
   b.addEventListener('click',()=>{if(WARD.home&&!wearOwned(k,c))return;WARD.pal[k]=c;if(k==='cap')WARD.pal.capDark=null;wardPaint()});row.appendChild(b)}
  if(k==='art')wardArtCustom(row);sec.appendChild(row);box.appendChild(sec)}
 $('#ward').hidden=false;wardPaint();$('#wardBuy').focus()}
/* v79r4: estampa com 1 caractere — campo de 1 letra/número/símbolo + as estampas custom já compradas */
function wardArtCustom(row){const own=(WEAR_OWNED.art||[]).filter(c=>typeof c==='string'&&c.startsWith('c:'));
 for(const c of own){const b=document.createElement('button');b.type='button';b.className='sw';b.style.cssText='height:36px;background:#2a2a30;color:#fff;font:700 16px Silkscreen,monospace';b.textContent=c[2];b.title=translatePlain('estampa')+' «'+c[2]+'» · '+translatePlain('disponível');b.dataset.k='art';b.dataset.c=c;b.addEventListener('click',()=>{WARD.pal.art=c;wardPaint()});row.appendChild(b)}
 wardArtEmoji(row);
 const w=document.createElement('label');w.className='sw';w.style.cssText='height:36px;display:flex;align-items:center;justify-content:center;gap:2px;background:#1c1c24;border:1px dashed #8a8aa0;grid-column:span 2;padding:0 4px';w.title=translatePlain('Estampa com 1 caractere: letra, número ou símbolo (ex.: A, J, %, ?)')+(WARD.home?'':' · $'+WEAR_PRICE);
 const t=document.createElement('span');t.textContent='Aa';t.style.cssText='color:#ffd23a;font:700 11px Silkscreen,monospace';const inp=document.createElement('input');inp.type='text';inp.maxLength=2;inp.autocomplete='off';inp.spellcheck=false;inp.setAttribute('autocapitalize','characters');inp.id='wardArtChar';inp.style.cssText='width:30px;height:28px;text-align:center;font:700 18px Silkscreen,monospace;background:#0c0c12;color:#fff;border:1px solid #555;border-radius:4px;padding:0';
 const cur=WARD.pal.art;if(typeof cur==='string'&&cur.startsWith('c:'))inp.value=cur[2];
 inp.addEventListener('keydown',e=>e.stopPropagation());inp.addEventListener('keyup',e=>e.stopPropagation());
 inp.addEventListener('input',()=>{let ch=[...inp.value.toUpperCase()].filter(shirtGlyphOk).pop()||'';inp.value=ch;if(!ch)return;const c='c:'+ch;if(WARD.home&&!wearOwned('art',c)){toast(translatePlain('COMPRE ESSA ESTAMPA NA LOJA'));inp.value='';return}WARD.pal.art=c;wardPaint()});
 w.appendChild(t);w.appendChild(inp);row.appendChild(w)}
/* v3r2: estampa emoji — emojis já comprados + botão que abre o teclado de emojis (o botão mostra o emoji escolhido ainda não comprado) */
function wardArtEmoji(row){const EF=EMO_FONT.replace(/"/g,"'"),own=(WEAR_OWNED.art||[]).filter(c=>typeof c==='string'&&c.startsWith('e:')&&emoOk(c.slice(2)));
 for(const c of own){const b=document.createElement('button');b.type='button';b.className='sw';b.style.cssText='height:36px;background:#2a2a30;font-size:22px;line-height:1;padding:0;font-family:'+EF;b.textContent=c.slice(2);b.title=translatePlain('estampa')+' '+c.slice(2)+' · '+translatePlain('disponível');b.dataset.k='art';b.dataset.c=c;b.addEventListener('click',()=>{WARD.pal.art=c;wardPaint()});row.appendChild(b)}
 const k=document.createElement('button');k.type='button';k.className='sw';k.id='wardEmoBtn';k.dataset.k='art';const cur=WARD.pal.art,pend=typeof cur==='string'&&cur.startsWith('e:')&&!own.includes(cur)?cur:null;k.dataset.c=pend||'emo?';
 k.style.cssText='height:36px;background:#1c1c24;border:1px dashed #ffd23a;grid-column:span 2;font-size:20px;line-height:1;padding:0 4px;color:#ffd23a;font-family:'+EF;k.textContent=pend?pend.slice(2)+' ✎':'😀 +';k.title=translatePlain('Estampa com emoji colorido')+(WARD.home?'':' · $'+WEAR_PRICE);
 k.addEventListener('click',()=>emoKbOpen(e=>{if(!WARD.open)return;const c='e:'+e;if(WARD.home&&!wearOwned('art',c)){toast(translatePlain('COMPRE ESSA ESTAMPA NA LOJA'));return}WARD.pal.art=c;const own2=row.querySelector('.sw[data-c="'+CSS.escape(c)+'"]:not(#wardEmoBtn)');k.dataset.c=own2?'emo?':c;k.textContent=own2?'😀 +':e+' ✎';wardPaint()}));row.appendChild(k)}
function wardDiff(){let n=0;for(const k of Object.keys(WEAR_PAL))if((WARD.pal[k]||null)!==(PLAYER_PAL[k]||null))n++;return n}
function wardCost(){return Object.keys(WEAR_PAL).filter(k=>(WARD.pal[k]||null)!==(PLAYER_PAL[k]||null)&&!wearOwned(k,WARD.pal[k])).length*WEAR_PRICE} // v78: peça não trocada (ex.: uniforme laranja da cadeia) não é cobrada
function wardPaint(){const cvs=$('#wardPrev'),g=cvs.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,cvs.width,cvs.height);const at=makeAtlas(WARD.pal);g.drawImage(at,0,0,32,48,0,0,96,144);g.drawImage(at,0,96,32,48,104,0,96,144);
 for(const b of document.querySelectorAll('#wardSecs .sw')){const on=(WARD.pal[b.dataset.k]||'')===(b.dataset.c||'');b.style.outline=on?'3px solid var(--acc)':'none';b.style.outlineOffset='2px'}
 const n=wardDiff(),cost=wardCost();$('#wardBuy').textContent=!n?'SEM MUDANÇAS':cost?`COMPRAR E EQUIPAR · $${cost}`:'EQUIPAR · GRÁTIS';$('#wardInfo').textContent=WARD.home?'Troque gratuitamente entre suas peças. Cores bloqueadas e acessórios novos são vendidos na loja.':`Cores e acessórios novos: $${WEAR_PRICE} cada. Peças adquiridas são grátis. Você tem $${PL.money||0}.`}
function closeWard(buy){if(!WARD.open)return;if(buy){const n=wardDiff();if(n){for(const k of Object.keys(WEAR_PAL))if(!wearValid(k,WARD.pal[k]||null)&&(WARD.pal[k]||null)!==(PLAYER_PAL[k]||null)){toast('VISUAL INVÁLIDO');return}const cost=wardCost();if(WARD.home&&cost){toast('COMPRE ESSA COR OU ACESSÓRIO NA LOJA');return}if((PL.money||0)<cost){toast('DINHEIRO INSUFICIENTE · $'+cost);clang(.1);return}if(cost)money(-cost);const jch=CHAR.list[CHAR.cur],jl=jch&&jch.jailLook;for(const k of Object.keys(WEAR_PAL)){let c=WARD.pal[k]||null;if(jl&&c===(PLAYER_PAL[k]||null)&&!wearValid(k,c))c=jl[k]||null;if(wearValid(k,c)&&!wearOwned(k,c))WEAR_OWNED[k].push(c);PLAYER_PAL[k]=c}if(jl){if(PLAYER_PAL.belt==='#f07818')PLAYER_PAL.belt=jl.belt;if(jl.stripe!=null)PLAYER_PAL.stripe=jl.stripe;delete jch.jailLook}PLAYER_PAL.capDark=null;if(jch)jch.look={...PLAYER_PAL,pack:false};applyPlayerLook();toast(cost?'VISUAL NOVO · −$'+cost:'VISUAL EQUIPADO');clang(.3);wzDisguise()}}
{const f=closeWard;closeWard=function(b){const r=f(b);try{ammoClamp()}catch(e){}return r}}
 WARD.open=false;$('#ward').hidden=true}
