'use strict';
/* Coastal Chaos · js/05-mundo-placas.js — Placas de neon, areia, espuma, decisões de geração.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= MUNDO: cemitério, farol, delegacia, piscinas, areia, ondas, placas ================= */
const WLD={cem:{f:0,msg:false},pools:new Map(),grills:new Map(),signAtlas:null,sandTex:null,foamTex:null};
const LH={up:false,fall:false,fv:0,cool:0,beam:null,glow:null};
const BOXG=new THREE.BoxGeometry(1,1,1).toNonIndexed();
const _sq=new THREE.Quaternion(),_sv=new THREE.Vector3(),_sm=new THREE.Matrix4(),_sy=new THREE.Vector3(0,1,0),_ss=new THREE.Vector3(),_sp=new THREE.Vector3();
// cilindro (ou qualquer geometria unitária ao longo de Y) de A até B
function wseg(mb,ax,ay,az,bx,by,bz,r0,col,geo){_sv.set(bx-ax,by-ay,bz-az);const L=_sv.length();if(L<1e-4)return;_sv.divideScalar(L);_sq.setFromUnitVectors(_sy,_sv);
 _sm.compose(_sp.set((ax+bx)/2,(ay+by)/2,(az+bz)/2),_sq,_ss.set(r0,L,r0));mb.geo(geo||GEO.cyl,_sm,col)}
// tronco de cone aberto (raio r0 embaixo, r1 em cima)
function wfrust(mb,cx,y0,cz,y1,r0,r1,col,seg){const g=new THREE.CylinderGeometry(r1,r0,y1-y0,seg||20,1,true).toNonIndexed();mb.geo(g,mtx(cx,(y0+y1)/2,cz,1,1,1),col);g.dispose()}
function wTU(s,t,u){const E=city.ext;return s===0?[t,-u]:s===1?[t,E+u]:s===2?[-u,t]:[E+u,t]}

/* ---------- atlas de placas de neon (textos) ---------- */
const WS_HZ=[['HOTEL','COLONY'],['HOTEL','FLAMINGO'],['HOTEL','PARADISO'],['HOTEL','ESTRELA'],['HOTEL','OCEAN'],['HOTEL','AURORA'],['HOTEL','MIRAGE'],['HOTEL','CORAL'],
 ['CAFETERIA','LUNA'],['CAFETERIA','BRISA'],['CAFETERIA','ROMA'],['CAFETERIA','AURORA'],['CAFETERIA','SOLARIS'],['CAFETERIA','CENTRAL'],['CAFETERIA','VIENA'],['CAFETERIA','ESTRELA'],
 ['BAR','VICE'],['BAR','NEPTUNO'],['BAR','EL DORADO'],['BAR','FLAMINGO'],['BAR','TROPICAL'],['BAR','ATLANTIS'],['BAR','DELFIM'],['BAR','SOL E MAR'],
 ['BOATE','PARADISO'],['BOATE','ECLIPSE'],['BOATE','ZENITH'],['BOATE','MIAMI'],['BOATE','LUNA'],['BOATE','NEON'],['BOATE','CAPRI'],['BOATE','VICE']];
const WS_EXTRA=[['DELEGACIA','#4aa8ff'],['POLÍCIA','#ff5a5a'],['CEMITÉRIO','#c8c8d8'],['FAROL','#ffe27a']]; // células 32..35
const WS_VT=['HOTEL','BAR','BOATE','CAFÉ','COLONY','LUNA','VICE','OCEAN','AURORA','MIAMI','ZENITH','CORAL','PARADISO','NEON','ROMA','ESTRELA'];
const WS_COL=['#ff4fa3','#33e6e6','#ffb86b','#b388ff','#ff6b8b','#7dffcf','#ffd23a','#7aff5a'];
function worldSignAtlas(){if(WLD.signAtlas)return WLD.signAtlas;const T=1024,c=cv(T,T),g=c.getContext('2d');g.textAlign='center';g.textBaseline='middle';
 const FONT='"Arial Black",Impact,"Helvetica Neue",Arial,sans-serif';
 const cell=(cx,cy,w,h,txt,col,vert)=>{g.save();g.beginPath();g.rect(cx,cy,w,h);g.clip();g.shadowColor=col;g.shadowBlur=9;g.strokeStyle=col;g.fillStyle='#fff';g.lineJoin='round';
  if(!vert){let fs=h*.6;g.font='900 '+fs+'px '+FONT;const tw=g.measureText(txt).width;if(tw>w-16){fs*=(w-16)/tw;g.font='900 '+fs+'px '+FONT}
   g.lineWidth=Math.max(2,fs*.12);g.strokeText(txt,cx+w/2,cy+h/2+1);g.shadowBlur=3;g.fillText(txt,cx+w/2,cy+h/2+1)}
  else{const n=txt.length,sl=(h-12)/n;let fs=Math.min(w*.78,sl*.95);g.font='900 '+fs+'px '+FONT;g.lineWidth=Math.max(2,fs*.12);
   for(let i=0;i<n;i++){const y=cy+6+(i+.5)*sl;g.shadowBlur=9;g.strokeText(txt[i],cx+w/2,y);g.shadowBlur=3;g.fillText(txt[i],cx+w/2,y)}}
  g.restore()};
 WS_HZ.forEach((p,i)=>cell((i%4)*256,Math.floor(i/4)*64,256,64,p[0]+' '+p[1],WS_COL[(i*3+(i>>2))%WS_COL.length],false));
 WS_EXTRA.forEach((p,k)=>{const i=32+k;cell((i%4)*256,Math.floor(i/4)*64,256,64,p[0],p[1],false)});
 WS_VT.forEach((p,i)=>cell(i*64,640,64,256,p,WS_COL[(i*5+1)%WS_COL.length],true));
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;return WLD.signAtlas=t}
function worldSignUV(idx,vert){const T=1024,e=1.5/T;if(!vert){const cx=(idx%4)*256,cy=Math.floor(idx/4)*64;return[cx/T+e,1-(cy+64)/T+e,(cx+256)/T-e,1-cy/T-e]}const cx=idx*64,cy=640;return[cx/T+e,1-(cy+256)/T+e,(cx+64)/T-e,1-cy/T-e]}
function worldSignPick(x,z,vert){const h=mulberry32(((Math.round(x*13)*73856093)^(Math.round(z*7)*19349663)^(S.seed*5+11))>>>0)();return Math.floor(h*(vert?16:32))}
// quad de texto colado à fachada f; u0/u1 em coordenadas de mundo ao longo da fachada; d = distância da parede
function worldSignQuad(mb,f,x0,z0,x1,z1,u0,u1,y0,y1,d,idx,vert){const w=u1-u0,h=y1-y0,uc=(u0+u1)/2,yc=(y0+y1)/2;let ww,hh;
 if(vert){hh=Math.min(h-.5,(w-.3)*4);ww=hh/4}else{ww=Math.min(w-.5,(h-.4)*4);hh=ww/4}
 if(!(ww>.3&&hh>.3))return;u0=uc-ww/2;u1=uc+ww/2;y0=yc-hh/2;y1=yc+hh/2;let a,b,c,e;
 if(f==='s'){const z=z1+d;a=[u0,y0,z];b=[u1,y0,z];c=[u1,y1,z];e=[u0,y1,z]}
 else if(f==='n'){const z=z0-d;a=[u1,y0,z];b=[u0,y0,z];c=[u0,y1,z];e=[u1,y1,z]}
 else if(f==='e'){const x=x1+d;a=[x,y0,u1];b=[x,y0,u0];c=[x,y1,u0];e=[x,y1,u1]}
 else{const x=x0-d;a=[x,y0,u0];b=[x,y0,u1];c=[x,y1,u1];e=[x,y1,u0]}
 mb.quad(a,b,c,e,0,0,1,worldSignUV(idx,vert),new THREE.Color(1,1,1))}

/* ---------- areia granulada e espuma ---------- */
function worldSandTex(){if(WLD.sandTex)return WLD.sandTex;const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#f4ecd6';g.fillRect(0,0,256,256);const r=mulberry32(77);
 for(let i=0;i<6500;i++){const x=r()*256,y=r()*256,t=r();g.fillStyle=t<.42?`rgba(130,98,54,${.06+r()*.13})`:t<.8?`rgba(255,255,255,${.12+r()*.3})`:`rgba(92,70,40,${.1+r()*.22})`;const s=t>.96?2:1;g.fillRect(x,y,s,s)}
 for(let i=0;i<46;i++){const x=r()*256,y=r()*256,a=r()*3;g.fillStyle=r()<.5?'rgba(255,252,240,.55)':'rgba(120,96,64,.4)';g.beginPath();g.ellipse(x,y,1+r()*1.6,.8+r()*.9,a,0,7);g.fill()}
 g.lineWidth=1;for(let i=0;i<9;i++){g.strokeStyle=`rgba(150,120,72,${.05+r()*.05})`;g.beginPath();const y=r()*256,ph=r()*6;g.moveTo(0,y);for(let x=0;x<=256;x+=8)g.lineTo(x,y+Math.sin(x/256*6.2832*2+ph)*3);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return WLD.sandTex=t}
function worldFoamTex(){if(WLD.foamTex)return WLD.foamTex;const c=cv(128,256),g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,128,256);const r=mulberry32(31);
 for(const by of [30,118,200]){for(let x=0;x<128;x+=2){const y=by+Math.sin(x/128*6.2832*2+by)*5+Math.sin(x/128*6.2832*5)*2,w=.35+.65*Math.abs(Math.sin(x/128*6.2832*3+by*.1));
   const gr=g.createLinearGradient(0,y-8,0,y+8);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.62,`rgba(255,255,255,${.5*w})`);gr.addColorStop(.7,`rgba(255,255,255,${.9*w})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x,y-8,2,16)}
  for(let i=0;i<46;i++){const x=r()*128,y=by+(r()-.4)*14;g.fillStyle=`rgba(255,255,255,${.2+r()*.5})`;g.fillRect(x,y,1+r()*2,1)}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return WLD.foamTex=t}
function fq(mb,a,b,c,d,ta,tb,tc,td,ca,cb,cc,cd){const p0=mb.p.length;if(mb.idx){const b0=p0/3,i0=mb.idx.length;for(const[p,t,k] of [[a,ta,ca],[b,tb,cb],[c,tc,cc],[d,td,cd]]){mb.p.push(p[0],p[1],p[2]);mb.n.push(0,1,0);mb.u.push(t[0],t[1]);mb.c.push(k,k,k)}mb.idx.push(b0,b0+1,b0+2,b0,b0+2,b0+3);if(ZF.on)zfPost(mb.p,p0,true,mb.idx,i0);return}for(const[p,t,k] of [[a,ta,ca],[b,tb,cb],[c,tc,cc],[a,ta,ca],[c,tc,cc],[d,td,cd]]){mb.p.push(p[0],p[1],p[2]);mb.n.push(0,1,0);mb.u.push(t[0],t[1]);mb.c.push(k,k,k)}if(ZF.on)zfPost(mb.p,p0,true)}
// faixa de espuma de A até B, indo na direção (dx,dz) por w metros; brilho 1 -> 0 para fora
function worldFoamStrip(mb,ax,az,bx,bz,dx,dz,w,y){const L=Math.hypot(bx-ax,bz-az);if(L<.3)return;const ub=L/16,vv=w/6;
 fq(mb,[ax,y,az],[bx,y,bz],[bx+dx*w,y,bz+dz*w],[ax+dx*w,y,az+dz*w],[0,0],[ub,0],[ub,vv],[0,vv],1,1,0,0)}
function worldFoamBank(mb,A,B,nx,nz){worldFoamStrip(mb,A[0],A[2],B[0],B[2],-nx,-nz,1.9,RY+.035)}

/* ---------- decisões na geração da cidade ---------- */
// delegacia e cemitério: escolhidos DEPOIS dos outros marcos (não mexe nos sorteios existentes)

