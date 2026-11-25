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
/* v4 r19 · letreiros novos: o atlas ganhou a metade direita (x 1024..2048): 16 palavras em cursivo de neon (Pacifico, tubo colorido
   com núcleo claro e um risco de 2ª cor) e 16 ícones de tubo (taça, estrela, palmeira, coração…). A metade esquerda continua igual (mesmos UVs em pixel). */
const WS_SC=[['Colony','#ff4fa3','#33e6e6'],['Flamingo','#ff6b8b','#ffd23a'],['Paradiso','#b388ff','#ff4fa3'],['Estrela','#ffd23a','#33e6e6'],['Ocean','#33e6e6','#ff6b8b'],['Aurora','#7dffcf','#b388ff'],['Mirage','#ffb86b','#ff4fa3'],['Coral','#ff6b8b','#7dffcf'],
 ['Vice','#ff4fa3','#33e6e6'],['Neptuno','#33e6e6','#ffd23a'],['El Dorado','#ffd23a','#ff6b8b'],['Flamingo','#ff6fae','#7dffcf'],['Tropical','#7aff5a','#ff4fa3'],['Atlantis','#33e6e6','#b388ff'],['Delfim','#7dffcf','#ffb86b'],['Sol e Mar','#ffb86b','#33e6e6']];
const WS_IC=['cocktail','star','palm','heart','note','moon','arrow','crown','diamond','cherry','sun','bolt','planet','coffee','disco','lips'];
const WS_ICCOL=['#ff4fa3','#ffd23a','#7aff5a','#ff6b8b','#33e6e6','#fff2a8','#ffb86b','#ffd23a','#33e6e6','#ff4f6a','#ff8a2a','#ffd23a','#b388ff','#ffb86b','#7dffcf','#ff3a6a'];
function wsTint(h,k){const c=new THREE.Color(h);c.lerp(new THREE.Color(1,1,1),k);return '#'+c.getHexString()}
function wsIcon(g,kind,cx,cy,s){const P=(x,y)=>[cx+x*s,cy+y*s];g.beginPath();const M=(x,y)=>{const q=P(x,y);g.moveTo(q[0],q[1])},L=(x,y)=>{const q=P(x,y);g.lineTo(q[0],q[1])},A=(x,y,r,a0,a1,ccw)=>{const q=P(x,y);g.arc(q[0],q[1],r*s,a0,a1,ccw)},Q=(x1,y1,x,y)=>{const a=P(x1,y1),b=P(x,y);g.quadraticCurveTo(a[0],a[1],b[0],b[1])};
 switch(kind){
  case'cocktail':M(-.62,-.55);L(.62,-.55);L(0,.12);L(-.62,-.55);M(0,.12);L(0,.62);M(-.34,.64);L(.34,.64);M(.25,-.55);L(.52,-.84);A(.56,-.62,.13,0,6.3);break;
  case'star':for(let i=0;i<=10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.32:.78;i?L(Math.cos(a)*r,Math.sin(a)*r):M(Math.cos(a)*r,Math.sin(a)*r)}break;
  case'palm':M(.06,.78);Q(.18,.1,-.02,-.42);for(const[a,b,c,d]of[[-.75,-.3,-.4,-.62],[-.7,.05,-.35,-.25],[.75,-.25,.42,-.62],[.7,.1,.35,-.2],[.1,-.85,-.2,-.75]]){M(-.02,-.42);Q(c,d,a,b)}M(-.4,.8);L(.5,.8);break;
  case'heart':M(0,.7);Q(-.95,.05,-.62,-.42);Q(-.3,-.82,0,-.36);Q(.3,-.82,.62,-.42);Q(.95,.05,0,.7);break;
  case'note':M(-.3,.52);L(-.3,-.62);L(.5,-.78);L(.5,.36);A(-.48,.52,.2,0,6.3);M(.5,.36);A(.32,.36,.2,0,6.3);M(-.3,-.32);L(.5,-.48);break;
  case'moon':A(0,0,.7,.65,5.63);Q(-.35,0,.55,.42);M(.55,-.42);M(.42,-.12);L(.62,-.2);break;
  case'arrow':M(-.8,0);L(.55,0);M(.2,-.38);L(.62,0);L(.2,.38);M(-.8,-.25);L(-.8,.25);break;
  case'crown':M(-.7,.5);L(.7,.5);L(.8,-.45);L(.38,-.05);L(0,-.65);L(-.38,-.05);L(-.8,-.45);L(-.7,.5);M(-.62,.68);L(.62,.68);break;
  case'diamond':M(-.75,-.2);L(-.42,-.62);L(.42,-.62);L(.75,-.2);L(0,.75);L(-.75,-.2);L(.75,-.2);M(-.42,-.62);L(-.18,-.2);L(0,.75);M(.42,-.62);L(.18,-.2);L(0,.75);break;
  case'cherry':A(-.38,.42,.28,0,6.3);M(.6,.3);A(.32,.3,.28,0,6.3);M(-.3,.15);Q(-.1,-.4,.25,-.72);M(.3,.03);Q(.2,-.4,.25,-.72);M(.25,-.72);Q(.6,-.85,.7,-.55);break;
  case'sun':A(0,0,.72,0,6.3);for(const y of[.14,.34,.54]){const hw=Math.sqrt(.72*.72-y*y);M(-hw,y);L(hw,y)}break;
  case'bolt':M(.18,-.82);L(-.45,.08);L(-.02,.08);L(-.2,.82);L(.45,-.12);L(.02,-.12);L(.18,-.82);break;
  case'planet':A(0,0,.42,0,6.3);M(-.86,.12);Q(0,.58,.86,-.12);Q(0,-.4,-.86,.12);break;
  case'coffee':M(-.55,-.2);L(.35,-.2);L(.28,.58);L(-.48,.58);L(-.55,-.2);M(.35,-.02);Q(.78,0,.32,.36);M(-.25,-.42);Q(-.1,-.62,-.25,-.82);M(.05,-.42);Q(.2,-.62,.05,-.82);M(-.7,.74);L(.5,.74);break;
  case'disco':A(0,.05,.62,0,6.3);M(-.62,.05);L(.62,.05);M(0,-.57);L(0,.67);M(-.48,-.35);L(.48,-.35);M(-.48,.45);L(.48,.45);M(0,-.57);L(0,-.85);break;
  case'lips':M(-.8,0);Q(-.4,-.55,0,-.22);Q(.4,-.55,.8,0);Q(.4,.55,0,.48);Q(-.4,.55,-.8,0);M(-.8,0);Q(0,.12,.8,0);break}
 }
function worldSignAtlas(){if(WLD.signAtlas)return WLD.signAtlas;const T=1024,c=cv(2*T,T),g=c.getContext('2d');
 const FONT='"Arial Black",Impact,"Helvetica Neue",Arial,sans-serif';
 const cell=(cx,cy,w,h,txt,col,vert)=>{g.save();g.beginPath();g.rect(cx,cy,w,h);g.clip();g.shadowColor=col;g.shadowBlur=9;g.strokeStyle=col;g.fillStyle='#fff';g.lineJoin='round';
  if(!vert){let fs=h*.6;g.font='900 '+fs+'px '+FONT;const tw=g.measureText(txt).width;if(tw>w-16){fs*=(w-16)/tw;g.font='900 '+fs+'px '+FONT}
   g.lineWidth=Math.max(2,fs*.12);g.strokeText(txt,cx+w/2,cy+h/2+1);g.shadowBlur=3;g.fillText(txt,cx+w/2,cy+h/2+1)}
  else{const n=txt.length,sl=(h-12)/n;let fs=Math.min(w*.78,sl*.95);g.font='900 '+fs+'px '+FONT;g.lineWidth=Math.max(2,fs*.12);
   for(let i=0;i<n;i++){const y=cy+6+(i+.5)*sl;g.shadowBlur=9;g.strokeText(txt[i],cx+w/2,y);g.shadowBlur=3;g.fillText(txt[i],cx+w/2,y)}}
  g.restore()};
 /* cursivo de tubo: halo largo na cor, tubo na cor, núcleo quase branco; risco embaixo na 2ª cor */
 const script=(cx,cy,w,h,txt,col,col2)=>{g.save();g.beginPath();g.rect(cx,cy,w,h);g.clip();g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineCap='round';
  let fs=h*.62;g.font=fs+'px Pacifico,"Brush Script MT",cursive';const tw=g.measureText(txt).width;if(tw>w-36){fs*=(w-36)/tw;g.font=fs+'px Pacifico,"Brush Script MT",cursive'}
  const x=cx+w/2,y=cy+h*.44,tw2=Math.min(w-30,g.measureText(txt).width);
  g.shadowColor=col2;g.shadowBlur=10;g.strokeStyle=col2;g.lineWidth=Math.max(3,h*.05);g.beginPath();g.moveTo(x-tw2*.42,cy+h*.86);g.bezierCurveTo(x-tw2*.1,cy+h*.74,x+tw2*.15,cy+h*.98,x+tw2*.46,cy+h*.8);g.stroke();
  g.lineWidth=Math.max(1.5,h*.022);g.strokeStyle=wsTint(col2,.65);g.shadowBlur=2;g.stroke();
  g.shadowColor=col;g.shadowBlur=14;g.strokeStyle=col;g.lineWidth=Math.max(3,fs*.09);g.strokeText(txt,x,y);
  g.shadowBlur=4;g.fillStyle=wsTint(col,.72);g.fillText(txt,x,y);g.restore()};
 const icon=(cx,cy,w,h,kind,col)=>{g.save();g.beginPath();g.rect(cx,cy,w,h);g.clip();g.lineJoin='round';g.lineCap='round';
  const s=w*.4;g.shadowColor=col;g.shadowBlur=12;g.strokeStyle=col;g.lineWidth=w*.075;wsIcon(g,kind,cx+w/2,cy+h/2,s);g.stroke();
  g.shadowBlur=3;g.strokeStyle=wsTint(col,.7);g.lineWidth=w*.028;g.stroke();g.restore()};
 const paint=()=>{g.clearRect(0,0,2*T,T);g.textAlign='center';g.textBaseline='middle';
  WS_HZ.forEach((p,i)=>cell((i%4)*256,Math.floor(i/4)*64,256,64,p[0]+' '+p[1],WS_COL[(i*3+(i>>2))%WS_COL.length],false));
  WS_EXTRA.forEach((p,k)=>{const i=32+k;cell((i%4)*256,Math.floor(i/4)*64,256,64,p[0],p[1],false)});
  WS_VT.forEach((p,i)=>cell(i*64,640,64,256,p,WS_COL[(i*5+1)%WS_COL.length],true));
  WS_SC.forEach((p,i)=>script(T+(i%2)*512,(i>>1)*96,512,96,p[0],p[1],p[2]));
  WS_IC.forEach((k,i)=>icon(T+(i%8)*128,768+(i>>3)*128,128,128,k,WS_ICCOL[i]))};
 paint();const t=new THREE.CanvasTexture(c);t.anisotropy=4;
 /* a fonte cursiva só carrega quando alguém pede: redesenha quando chegar (sem isso a 1ª cidade sairia em fonte genérica) */
 try{if(document.fonts&&!document.fonts.check('40px Pacifico'))document.fonts.load('40px Pacifico').then(()=>{paint();t.needsUpdate=true}).catch(()=>{})}catch(e){}
 return WLD.signAtlas=t}
/* UV de uma célula: idx 0..35 = faixas de texto (256×64), vert = colunas (64×256); kind 'sc' = cursivo 0..15 (512×96), 'ic' = ícone 0..15 (128×128) */
function worldSignUV(idx,vert,kind){const W=2048,H=1024,e=1.5;let cx,cy,w,h;
 if(kind==='sc'){cx=1024+(idx%2)*512;cy=(idx>>1)*96;w=512;h=96}else if(kind==='ic'){cx=1024+(idx%8)*128;cy=768+(idx>>3)*128;w=128;h=128}
 else if(!vert){cx=(idx%4)*256;cy=Math.floor(idx/4)*64;w=256;h=64}else{cx=idx*64;cy=640;w=64;h=256}
 return[(cx+e)/W,1-(cy+h-e)/H,(cx+w-e)/W,1-(cy+e)/H]}
function worldSignPick(x,z,vert){const h=mulberry32(((Math.round(x*13)*73856093)^(Math.round(z*7)*19349663)^(S.seed*5+11))>>>0)();return Math.floor(h*(vert?16:32))}
// quad de texto colado à fachada f; u0/u1 em coordenadas de mundo ao longo da fachada; d = distância da parede
function worldSignQuad(mb,f,x0,z0,x1,z1,u0,u1,y0,y1,d,idx,vert){const w=u1-u0,h=y1-y0,uc=(u0+u1)/2,yc=(y0+y1)/2;let ww,hh;
 if(vert){hh=Math.min(h-.5,(w-.3)*4);ww=hh/4}else{ww=Math.min(w-.5,(h-.4)*4);hh=ww/4}
 if(!(ww>.3&&hh>.3))return;worldSignFace(mb,f,x0,z0,x1,z1,uc-ww/2,uc+ww/2,yc-hh/2,yc+hh/2,d,worldSignUV(idx,vert))}
/* v4 r19: retângulo exato (sem ajustar proporção) na fachada f com o UV dado */
function worldSignFace(mb,f,x0,z0,x1,z1,u0,u1,y0,y1,d,uv){let a,b,c,e;
 if(f==='s'){const z=z1+d;a=[u0,y0,z];b=[u1,y0,z];c=[u1,y1,z];e=[u0,y1,z]}
 else if(f==='n'){const z=z0-d;a=[u1,y0,z];b=[u0,y0,z];c=[u0,y1,z];e=[u1,y1,z]}
 else if(f==='e'){const x=x1+d;a=[x,y0,u1];b=[x,y0,u0];c=[x,y1,u0];e=[x,y1,u1]}
 else{const x=x0-d;a=[x,y0,u0];b=[x,y0,u1];c=[x,y1,u1];e=[x,y1,u0]}
 mb.quad(a,b,c,e,0,0,1,uv,WS_WHITE)}
const WS_WHITE=new THREE.Color(1,1,1);
/* v4 r19: placa "bandeira" (em pé, perpendicular à fachada f): plano na posição u ao longo da fachada, da distância d0 até d1 da parede.
   side=+1/-1 escolhe de que lado da chapa o texto fica (os dois lados são emitidos, cada um lendo certo do seu lado). */
function worldSignBlade(mb,f,x0,z0,x1,z1,u,d0,d1,y0,y1,off,uv,side){const ns=f==='n'||f==='s',out=f==='s'||f==='e'?1:-1,base=f==='s'?z1:f==='n'?z0:f==='e'?x1:x0;
 const w0=base+out*d0,w1=base+out*d1,uu=u+side*off;let a,b,c,e;
 /* conferido por print dos dois lados: com flip a borda perto da parede vai para o vértice a (canto inferior esquerdo da célula) */
 const flip=(ns?1:-1)*out*side>0;const p0=flip?w0:w1,p1=flip?w1:w0;
 if(ns){a=[uu,y0,p1];b=[uu,y0,p0];c=[uu,y1,p0];e=[uu,y1,p1]}else{a=[p1,y0,uu];b=[p0,y0,uu];c=[p0,y1,uu];e=[p1,y1,uu]}
 mb.quad(a,b,c,e,0,0,1,uv,WS_WHITE)}
/* v4 r19: estilo do letreiro por prédio (gerador próprio; nunca consome R()). w = pesos [clássico, cursivo, marquise, ícone, bandeira] */
function worldSignStyle(x,z,salt,w){const r=mulberry32(((Math.round(x*7)*2654435761)^(Math.round(z*7)*40503)^(S.seed*29+salt))>>>0);let t=r()*w.reduce((a,b)=>a+b,0),k=0;for(;k<w.length-1;k++){if(t<w[k])break;t-=w[k]}return{k,r}}

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

