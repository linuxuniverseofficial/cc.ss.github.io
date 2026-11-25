'use strict';
/* v3 r40 · PERSONAGENS 3D (experimental) — boneco low-poly estilo PS1, formato "compacto" (altura do 2.5D).
   Opção S.char3d (menu Gráficos → Personagens: 2D / 2.5D / 3D). Com ela ligada:
   - o sprite do personagem continua existindo (posição, visibilidade, palco, colisão, tudo igual), só não desenha
     (material.visible=false); o boneco 3D é um FILHO do sprite, então some/aparece junto com ele;
   - quem passa por placeSprite ganha o boneco (jogador, pedestres, online, história, policiais...). Quem não passa fica 2D;
   - roupa = paleta do personagem (pintada num quadro 64×64 de um atlas 1024×512, um quadro por roupa diferente);
   - animação contínua no vertex shader (andar/correr/parar com transição suave, pulo, sentado, deitado, mira, soco).
   Ligar/desligar: C3_ON(). Diagnóstico: c3Debug(). Remover: apagar este arquivo + a linha no index.html + #optCharMode. */
const C3={AW:1024,AH:512,T:64,slots:new Map(),free:[],gen:0,cv:null,tex:null,geo:null,base:null,sunDir:new THREE.Vector3(-.5,.8,.6),dirty:false,list:new Set(),frame:0};
function C3_ON(){return S.char3d===true}
/* ---------- regiões dentro do quadro 64×64 ---------- */
const C3RG={hairL:[2,56,60,7],head:[0,0,40,20],torso:[0,20,40,24],arm:[40,0,12,28],leg:[52,0,12,40],shoe:[40,28,12,8]};
const C3SW={hair:[2,50],skin:[10,50],sole:[18,50],shoe:[26,50],shirt:[34,50],pants:[42,50],hand:[50,50],hairL:[58,50]};
function c3Shade(h,f){const c=new THREE.Color(h||'#808080');c.multiplyScalar(f);return '#'+c.getHexString()}
function c3Key(p){if(!p)return'';let art='';try{art=shirtArtOf(p)||''}catch(e){}
 return [p.skin,p.hair,p.cap,p.capDark,p.shirt,p.stripe,p.pants,p.shoes,p.belt,p.long?1:0,p.glasses,p.necklace,p.swim,p.bikini,p.bag,p.pack?1:0,p.headphone,p.maskSuit?1:0,p.handSkin,p.demo?1:0,p.burnt?1:0,art].join('|')}
/* pinta a roupa no quadro (ox,oy) do atlas — espelha o que o charModel3D/atlas 2D desenham */
function c3Paint(g,ox,oy,p0){const p={...p0};const bare=!p.shirt;if(bare){p.shirt=p0.skin;p.stripe=null}if(p0.swim){p.pants=p0.skin;p.belt=p0.swim}if(!p.shoes)p.shoes=p0.skin;if(!p.pants)p.pants=p0.skin;
 const R=(x,y,w,h,c)=>{if(!c)return;g.fillStyle=c;g.fillRect(ox+x,oy+y,w,h)},T=C3.T,skD=c3Shade(p.skin,.8),hair=p.hair||'#2a1a12',hD=c3Shade(hair,.75),lip='#a04a42';
 g.clearRect(ox,oy,T,T);R(0,0,T,T,p.skin);
 /* cabeça: tira de 40 px ao redor (meio = rosto), 20 de altura */
 const [hx,hy,hw,hh]=C3RG.head;R(hx,hy,hw,hh,p.skin);R(hx,hy+17,hw,3,skD);
 if(p.cap){R(hx,hy,hw,5,p.cap);R(hx+14,hy+5,12,2,p.capDark||c3Shade(p.cap,.7));R(hx,hy+5,13,6,hair);R(hx+27,hy+5,13,6,hair)}
 else if(p.long){R(hx,hy,hw,6,hair);R(hx,hy,12,20,hair);R(hx+28,hy,12,20,hair);R(hx+12,hy+5,2,9,hair);R(hx+26,hy+5,2,9,hair)}
 else{R(hx,hy,hw,6,hair);R(hx,hy,13,12,hair);R(hx+27,hy,13,12,hair);R(hx+14,hy+6,4,1,hair)}
 if(!p.long){R(hx+10,hy+9,2,3,skD);R(hx+28,hy+9,2,3,skD)}
 const ex=hx+20;
 if(p0.demo){R(ex-6,hy+9,4,4,'#0a3a12');R(ex+2,hy+9,4,4,'#0a3a12');R(ex-5,hy+10,2,2,'#2aff4a');R(ex+3,hy+10,2,2,'#2aff4a');R(ex-4,hy+2,8,1,'#e51b27');R(ex-3,hy+14,6,2,'#3a0a0e')}
 else{R(ex-5,hy+8,3,1,hD);R(ex+2,hy+8,3,1,hD);R(ex-5,hy+10,3,2,'#f4f4f0');R(ex+2,hy+10,3,2,'#f4f4f0');R(ex-4,hy+10,2,2,'#1a1420');R(ex+2,hy+10,2,2,'#1a1420');R(ex-1,hy+12,2,2,skD);R(ex-2,hy+15,4,1,lip)}
 if(p.glasses){R(ex-6,hy+9,5,4,'#121218');R(ex+1,hy+9,5,4,'#121218');R(ex-1,hy+10,2,1,'#121218');g.globalAlpha=.55;R(ex-5,hy+10,3,2,p.glasses);R(ex+2,hy+10,3,2,p.glasses);g.globalAlpha=1}
 if(p.headphone){R(hx,hy,hw,2,p.headphone);R(hx+8,hy+8,4,6,p.headphone);R(hx+28,hy+8,4,6,p.headphone)}
 /* tronco: tira 40×24 (ombro → cintura); a frente fica no meio (x 11..29) */
 const [tx,ty,tw,th]=C3RG.torso,sh=p.shirt;R(tx,ty,tw,th,sh);
 if(!bare)R(tx+15,ty,10,2,c3Shade(sh,.8));
 if(p.stripe)R(tx,ty+9,tw,3,p.stripe);
 if(p0.bikini){R(tx,ty+6,tw,4,p0.bikini);R(tx+15,ty,2,6,p0.bikini);R(tx+23,ty,2,6,p0.bikini)}
 if(p0.maskSuit){R(tx+16,ty,8,14,'#f6f5ed');R(tx+19,ty+1,2,11,'#7a4a28')}
 {let a=null;try{a=p0.demo?null:shirtArtOf(p0)}catch(e){}
  if(a){const s2=c3Shade(sh,.78),cc=new THREE.Color(sh),ink=(cc.r*.3+cc.g*.59+cc.b*.11)>.55?c3Shade(sh,.6):'#f2f2ee';
   if(a==='listras'){for(const x of[13,17,21,25])R(tx+x,ty+2,2,th-5,s2)}
   else if(a==='bolso'){R(tx+13,ty+5,5,5,s2);R(tx+13,ty+5,5,1,c3Shade(s2,.8))}
   else if(a==='botoes'){for(const y of[4,9,14])R(tx+20,ty+y,1,1,ink)}
   else if(a==='estampa'){R(tx+16,ty+6,8,8,ink);R(tx+18,ty+8,4,4,sh);R(tx+19,ty+9,2,2,ink)}
   else if(typeof a==='string'&&a.startsWith('c:')){try{shirtGlyph(a,(x,y)=>R(tx+17+(x-14)*2,ty+5+(y-21)*2,2,2,ink))}catch(e){}}
   else if(typeof a==='string'&&a.startsWith('e:')){try{const e=shirtEmoOf(p0);if(e){g.imageSmoothingEnabled=true;g.drawImage(emoCanvas(e,64),ox+tx+14,oy+ty+4,12,12);g.imageSmoothingEnabled=false}}catch(e){}}}}
 if(p.necklace){R(tx+15,ty+2,10,1,p.necklace);R(tx+19,ty+3,2,2,p.necklace)}
 R(tx,ty+th-3,tw,3,p.belt||'#3a2a1a');
 const bag=p0.bag||(p0.pack?PACK_C:null);if(bag){R(tx,ty+3,8,15,bag);R(tx+32,ty+3,8,15,bag);R(tx+12,ty,2,9,c3Shade(bag,.7));R(tx+26,ty,2,9,c3Shade(bag,.7))}
 /* braço: manga em cima, pele embaixo, mão no fim */
 const [ax,ay,aw,ah]=C3RG.arm;R(ax,ay,aw,ah,p.skin);if(!bare&&!p0.bikini){R(ax,ay,aw,9,sh);R(ax,ay+7,aw,2,c3Shade(sh,.82))}R(ax,ay+ah-4,aw,4,c3Shade((p0.maskSuit&&p0.handSkin)||p.skin,.92));
 /* perna */
 const [lx,ly,lw,lh]=C3RG.leg;R(lx,ly,lw,lh,p.pants);if(p0.swim){R(lx,ly,lw,7,p0.swim);R(lx,ly+6,lw,1,c3Shade(p0.swim,.7))}else R(lx,ly+lh-2,lw,2,c3Shade(p.pants,.8));
 /* tênis */
 const [sx,sy,sw,sh2]=C3RG.shoe;R(sx,sy,sw,sh2,p.shoes);R(sx,sy+sh2-2,sw,2,c3Shade(p.shoes,.55));
 /* amostras lisas (tampas) */
 R(0,44,T,20,'#000');const sq=(k,c)=>R(C3SW[k][0]-2,48,7,6,c);
 sq('hair',p.cap||hair);sq('skin',p.skin);sq('sole',c3Shade(p.shoes,.55));sq('shoe',p.shoes);sq('shirt',sh);sq('pants',p0.swim?p0.swim:p.pants);sq('hand',c3Shade((p0.maskSuit&&p0.handSkin)||p.skin,.92));sq('hairL',hair);{const [qx,qy,qw,qh]=C3RG.hairL,hL=c3Shade(hair,1.3);R(qx,qy,qw,qh,hair);for(let x=0;x<qw;x+=3)R(qx+x,qy,1,qh,hD);for(let x=1;x<qw;x+=7)R(qx+x,qy,1,qh-2,hL);R(qx,qy+qh-1,qw,1,hD)} /* r47: fios do cabelo comprido */
 if(p0.burnt){g.globalCompositeOperation='multiply';g.fillStyle='#3a3430';g.fillRect(ox,oy,T,T);g.globalCompositeOperation='source-over';R(ex-5,hy+10,3,2,'#d8d0c0');R(ex+2,hy+10,3,2,'#d8d0c0')}}
/* ---------- atlas: um quadro por roupa; o que não é usado há tempo é reaproveitado ---------- */
function c3Atlas(){if(!C3.cv){C3.cv=cv(C3.AW,C3.AH);C3.g=C3.cv.getContext('2d');C3.g.imageSmoothingEnabled=false;
  const t=new THREE.CanvasTexture(C3.cv);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;C3.tex=t;
  const n=(C3.AW/C3.T)*(C3.AH/C3.T);for(let i=n-1;i>=0;i--)C3.free.push(i)}return C3.tex}
function c3Slot(key,pal){c3Atlas();let s=C3.slots.get(key);const now=performance.now();if(s){s.last=now;return s}
 let i=C3.free.pop();if(i===undefined){let old=null;for(const v of C3.slots.values())if(!old||v.last<old.last)old=v;C3.slots.delete(old.key);i=old.i}
 s={key,i,last:now,gen:++C3.gen};C3.slots.set(key,s);const ox=(i%(C3.AW/C3.T))*C3.T,oy=Math.floor(i/(C3.AW/C3.T))*C3.T;
 try{c3Paint(C3.g,ox,oy,pal);c3Grade(C3.g,ox,oy)}catch(e){console.error(e)}C3.tex.needsUpdate=true;return s}
/* v4 r11: mesmo acabamento do 2D/2.5D (charGrade, CHAR_GRADE): roupa menos saturada e grão fixo por texel, traços escuros (olhos) intactos.
   Contorno e pés mais escuros ficam no shader (C3_FS), porque no 3D a silhueta muda com a câmera. */
function c3Grade(g,ox,oy){if(typeof CHAR_GRADE==='undefined'||!CHAR_GRADE.on)return;const G=CHAR_GRADE,T=C3.T,id=g.getImageData(ox,oy,T,T),o=id.data;
 for(let y=0;y<T;y++)for(let x=0;x<T;x++){const i=(y*T+x)*4;let r=o[i],gg=o[i+1],b=o[i+2];const l=.299*r+.587*gg+.114*b;if(l<34)continue;
  r+=(l-r)*G.desat;gg+=(l-gg)*G.desat;b+=(l-b)*G.desat;const h=((x*73856093)^(y*19349663)^(x*y*83492791))>>>0,f=1+((h%1000)/1000-.5)*1.2*G.grain; /* v4 r13: 60% do grão do 2D (no 3D o texel fica grande na tela e parecia sujeira) */
  o[i]=r*f;o[i+1]=gg*f;o[i+2]=b*f}
 g.putImageData(id,ox,oy)}
/* ---------- geometria (formato compacto, ~380 triângulos, peças rígidas) ---------- */
function c3Geo(){if(C3.geo)return C3.geo;const P=[],N=[],U=[],K=[],I=[];let vi=0;const TW=C3.AW,TH=C3.AH;
 const cl=(a,lo,hi)=>a<lo?lo:a>hi?hi:a,uvAt=(r,u,v)=>[cl(r[0]+u*r[2],r[0]+.5,r[0]+r[2]-.5)/TW,1-cl(r[1]+v*r[3],r[1]+.5,r[1]+r[3]-.5)/TH] /* v4 r1: meio texel para dentro nas bordas (a emenda de trás pegava a coluna do quadro vizinho = risco fino) */,sw=k=>[(C3SW[k][0]+1.5)/TW,1-(C3SW[k][1]+2.5)/TH];
 /* u por ângulo: a frente (90°..270°) ganha 70% da largura da tira (mais pixels para rosto e estampa) */
 const uw=j=>{const t=j*360;return t<90?.15*t/90:t<270?.15+.7*(t-90)/180:.85+.15*(t-270)/90};
 function prism(part,S0,rings,rect,capT,capB,mx=1,ox=0,warp=false){const base=vi;
  /* v4 r1: normal com inclinação vertical (perfil do anel anterior/seguinte), luz contínua de cima a baixo em vez de faixas por anel */
  const Rm=r=>(r.rx+r.rz)/2,slope=rings.map((r,k)=>{const a=rings[Math.max(0,k-1)],b=rings[Math.min(rings.length-1,k+1)],dy=a.y-b.y;return r.ny!==undefined?r.ny:Math.abs(dy)<1e-4?0:Math.max(-1,Math.min(1,(Rm(a)-Rm(b))/dy))});
  rings.forEach((r,k)=>{for(let j=0;j<=S0;j++){const t=j/S0*Math.PI*2,sx=-Math.sin(t),sz=-Math.cos(t);P.push(ox*mx+(r.cx||0)*mx+sx*r.rx,r.y,(r.cz||0)+sz*r.rz);
   const n=new THREE.Vector3(sx/r.rx,0,sz/r.rz).normalize();n.y=slope[k];n.normalize();N.push(n.x,n.y,n.z);const uv=uvAt(rect,warp?uw(j/S0):j/S0,r.v);U.push(uv[0],uv[1]);K.push(part);vi++}});
  for(let a=0;a<rings.length-1;a++)for(let j=0;j<S0;j++){const p=base+a*(S0+1)+j,q=p+S0+1;I.push(p,q,p+1,p+1,q,q+1)}
  const cap=(r,up,uv)=>{if(!uv)return;const c0=vi;for(let j=0;j<S0;j++){const t=j/S0*Math.PI*2;P.push(ox*mx+(r.cx||0)*mx-Math.sin(t)*r.rx,r.y,(r.cz||0)-Math.cos(t)*r.rz);N.push(0,up?1:-1,0);U.push(uv[0],uv[1]);K.push(part);vi++}
   for(let j=1;j<S0-1;j++){if(up)I.push(c0,c0+j,c0+j+1);else I.push(c0,c0+j+1,c0+j)}};
  cap(rings[rings.length-1],false,capB);cap(rings[0],true,capT)}
 function box(part,x0,x1,y0,y1,z0,z1,rect){const f=(a,b,c,d,n)=>{const s=vi;for(const q of[a,b,c,d]){P.push(...q);N.push(...n);K.push(part);vi++}
   U.push(...uvAt(rect,0,0),...uvAt(rect,1,0),...uvAt(rect,1,1),...uvAt(rect,0,1));I.push(s,s+2,s+1,s,s+3,s+2)};
  f([x0,y1,z1],[x1,y1,z1],[x1,y0,z1],[x0,y0,z1],[0,0,1]);f([x1,y1,z0],[x0,y1,z0],[x0,y0,z0],[x1,y0,z0],[0,0,-1]);
  f([x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[x0,y0,z0],[-1,0,0]);f([x1,y1,z1],[x1,y1,z0],[x1,y0,z0],[x1,y0,z1],[1,0,0]);
  f([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);f([x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],[0,-1,0])}
 /* peças: 0 quadril 1 tronco 2 cabeça 3/4 braço/antebraço esq. 5/6 dir. 7/8 coxa/canela esq. 9/10 dir. */
 /* r46: juntas (esferas baixas no pivô de cada articulação, da cor do tecido naquela altura): giram em volta do próprio centro,
    então fecham o vão de ombro, cotovelo, quadril e joelho em qualquer pose sem mexer no shader */
 function ball(part,x,y,z,R,Ry,rect,v,mx){const S0=6,c=uvAt(rect,.5,v),rs=[.42,1.05,1.5708,2.09,2.72].map(a=>({y:y+Ry*Math.cos(a),rx:R*Math.sin(a),rz:R*Math.sin(a)*.96,cx:x,cz:z,v}));prism(part,S0,rs,rect,c,c,mx,0)}
 prism(2,10,[{y:1.73,rx:.09,rz:.085,cz:-.005,v:0},{y:1.70,rx:.155,rz:.15,cz:-.005,v:.12},{y:1.58,rx:.165,rz:.16,v:.45},{y:1.46,rx:.155,rz:.152,cz:.006,v:.72},{y:1.39,rx:.105,rz:.11,cz:.012,v:.92},{y:1.32,rx:.065,rz:.065,v:1}],C3RG.head,sw('hair'),null,1,0,true);
 prism(1,8,[{y:1.36,rx:.15,rz:.09,v:0},{y:1.31,rx:.225,rz:.125,v:.12},{y:1.1,rx:.21,rz:.13,cz:.008,v:.45},{y:.9,rx:.19,rz:.118,v:.85},{y:.8,rx:.195,rz:.12,v:1},{y:.785,rx:.176,rz:.104,v:1},{y:.71,rx:.168,rz:.098,v:1}],C3RG.torso,sw('shirt'),uvAt(C3RG.torso,.5,1),1,0,true); /* r46: saia de 9 cm dentro do quadril (giro/inclinação do tronco não abre a cintura) */
 prism(0,8,[{y:.82,rx:.197,rz:.122,v:0},{y:.7,rx:.2,rz:.125,v:.1}],C3RG.leg,null,sw('pants'));

 /* r47: cabelo comprido = malha própria (peça 11, segue a cabeça), casca dupla em arco atrás da cabeça descendo até as costas.
    Some (vira um ponto) quando o personagem não tem cabelo comprido (uLong=0). Antes era uma faixa pintada nas costas da blusa. */
 {const hc=sw('hairL'),A0=-1.95,A1=1.95,S0=10,prof=[[1.70,.163,.158,-.004],[1.62,.176,.172,-.008],[1.50,.178,.172,-.012],[1.40,.164,.158,-.02],[1.32,.17,.15,-.035],[1.22,.17,.155,-.04],[1.13,.158,.148,-.04]];
  const ring=(k,th)=>{const out=[];for(let j=0;j<=S0;j++){const t=A0+(A1-A0)*j/S0,[y,rx,rz,cz]=prof[k],sx=Math.sin(t),sz=-Math.cos(t),e=th?-.022:0;out.push([sx*(rx+e),y,cz+sz*(rz+e),sx,sz])}return out};
  const V=(q,nx,ny,nz,uu,vv)=>{P.push(q[0],q[1],q[2]);N.push(nx,ny,nz);const w=uvAt(C3RG.hairL,uu,vv);U.push(w[0],w[1]);K.push(11);return vi++};
  for(const inner of[0,1]){const base=vi;for(let k=0;k<prof.length;k++)ring(k,inner).forEach((q,j)=>V(q,inner?-q[3]:q[3],0,inner?-q[4]:q[4],j/S0,(k+.5)/prof.length));
   for(let k=0;k<prof.length-1;k++)for(let j=0;j<S0;j++){const a=base+k*(S0+1)+j,b=a+S0+1;if(inner)I.push(a,a+1,b,a+1,b+1,b);else I.push(a,b,a+1,a+1,b,b+1)}}
  const nP=prof.length*(S0+1),o0=vi-2*nP; /* bordas: pontas (fio de baixo) e laterais */
  const quad=(a,b,c,d)=>{I.push(a,b,c,a,c,d,a,c,b,a,d,c)};
  for(let j=0;j<S0;j++){const k=prof.length-1,a=o0+k*(S0+1)+j,b=o0+nP+k*(S0+1)+j;quad(a,a+1,b+1,b)}
  for(const j of[0,S0])for(let k=0;k<prof.length-1;k++){const a=o0+k*(S0+1)+j,b=o0+nP+k*(S0+1)+j;quad(a,a+S0+1,b+S0+1,b)}}
 for(const mx of[1,-1]){const L=mx>0;
  prism(L?3:5,7,[{y:1.33,rx:.066,rz:.07,v:0},{y:1.18,rx:.062,rz:.065,v:.25},{y:1.04,rx:.056,rz:.058,v:.5}],C3RG.arm,sw('shirt'),null,mx,.265);
  prism(L?4:6,7,[{y:1.04,rx:.055,rz:.057,cx:.27,v:.5},{y:.82,rx:.047,rz:.049,cx:.274,v:.86},{y:.79,rx:.054,rz:.045,cx:.276,v:.9},{y:.68,rx:.042,rz:.036,cx:.272,v:1}],C3RG.arm,null,sw('hand'),mx);
  prism(L?7:9,8,[{y:.8,rx:.095,rz:.098,cx:.1,v:0},{y:.62,rx:.088,rz:.09,cx:.1,v:.3},{y:.44,rx:.075,rz:.078,cx:.1,v:.55}],C3RG.leg,null,null,mx);
  prism(L?8:10,7,[{y:.44,rx:.074,rz:.077,cx:.1,v:.55},{y:.28,rx:.07,rz:.074,cx:.1,cz:-.008,v:.8},{y:.11,rx:.055,rz:.057,cx:.1,v:1}],C3RG.leg,null,null,mx);
  ball(L?3:5,.265,1.3,0,.066,.064,C3RG.arm,.04,mx);ball(L?4:6,.27,1.04,0,.052,.046,C3RG.arm,.5,mx); /* raio um pouco menor que o do membro: sem z-fight com a casca */
  ball(L?7:9,.1,.78,0,.088,.07,C3RG.leg,.03,mx);ball(L?8:10,.1,.44,0,.071,.056,C3RG.leg,.55,mx);
  /* v4 r1: pé oval (antes caixa): anel de 8 lados, peito do pé mais baixo e recuado, sola reta */
  prism(L?8:10,8,[{y:.118,rx:.05,rz:.085,cx:.1025,cz:.02,v:0,ny:1.4},{y:.1,rx:.066,rz:.118,cx:.1025,cz:.045,v:.3},{y:.05,rx:.073,rz:.13,cx:.1025,cz:.05,v:.7},{y:.018,rx:.072,rz:.128,cx:.1025,cz:.05,v:.85,ny:-.3},{y:0,rx:.066,rz:.12,cx:.1025,cz:.05,v:1,ny:-1}],C3RG.shoe,sw('shoe'),sw('sole'),mx)}
 const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3));ge.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 ge.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));ge.setAttribute('part',new THREE.Float32BufferAttribute(K,1));ge.setIndex(I);ge.computeBoundingSphere();ge.boundingSphere.radius+=.5;ge.userData.cached=true;
 C3.geo=ge;return ge}
/* ---------- shader: pose contínua (sem quadros) ---------- */
const C3_VS=`
attribute float part;
uniform float uPhase,uAmt,uRun,uAim,uPunch,uSit,uAir,uIdle,uLong,uRagOn;uniform vec2 uTile;uniform vec3 uLight,uSunDir;uniform mat4 uRM[11];
varying vec2 vUv,vLoc;varying vec3 vLight,vVN,vVP;varying float vFeet;
#include <fog_pars_vertex>
vec3 rx(vec3 v,vec3 p,float a){v-=p;float c=cos(a),s=sin(a);return p+vec3(v.x,c*v.y-s*v.z,s*v.y+c*v.z);}
vec3 rxn(vec3 n,float a){float c=cos(a),s=sin(a);return vec3(n.x,c*n.y-s*n.z,s*n.y+c*n.z);}
vec3 ry(vec3 v,float a){float c=cos(a),s=sin(a);return vec3(c*v.x+s*v.z,v.y,-s*v.x+c*v.z);}
void main(){
 vec3 p=position,n=normal;float ph=uPhase,s=sin(ph),A=uAmt,Rn=uRun;
 if(part>10.5&&uLong<.5)p=vec3(0.,1.5,0.);
 float bob=0.;
 if(uRagOn>.5){int ri=int(part+.5);if(ri>10)ri=2;mat4 RM=uRM[0];for(int k=1;k<11;k++){if(k==ri)RM=uRM[k];} /* v4 r28 · ragdoll: matriz por peça (mundo) */
  p=(RM*vec4(p,1.)).xyz;n=mat3(RM)*n;}else{
 bob=A*(.022+.03*Rn)*abs(cos(ph))-uSit*0.+uIdle*.006*sin(ph*.5);
 float twist=A*(.07+.05*Rn)*s;
 if(part>6.5&&part<10.5){bool L=part<8.5;float sg=L?1.:-1.;float ss=L?s:-s;vec3 hip=vec3(.1*sg,.78,0.),knee=vec3(.1*sg,.44,0.);
  float th=A*(.42+.22*Rn)*ss,kn=A*((.55+.5*Rn)*max(0.,sin(ph+(L?0.:3.14159)+1.3))+.06);
  th=mix(th,L?.25:-.1,uAir);kn=mix(kn,L?.9:.35,uAir);
  th=mix(th,1.45,uSit);kn=mix(kn,1.45,uSit);
  if(part==8.||part==10.){p=rx(p,knee,kn);n=rxn(n,kn);} p=rx(p,hip,-th);n=rxn(n,-th);}
 else{
  if(part>2.5&&part<6.5){bool L=part<4.5;float sg=L?1.:-1.;float ss=L?-s:s;vec3 sh=vec3(.265*sg,1.3,0.),el=vec3(.27*sg,1.04,0.);
   float ar=A*(.36+.3*Rn)*ss,eb=-.12-A*(.18*max(0.,ss)+.04)-Rn*A*.9;
   ar=mix(ar,L?.35:-.25,uAir*.7);
   if(!L){ar=mix(ar,1.45,max(uAim,uPunch));eb=mix(eb,-.05,max(uAim,uPunch));}else{ar=mix(ar,.05,uAim*.8);eb=mix(eb,-.18,uAim*.8);} /* v4 r14: só o braço direito sobe com a arma; o esquerdo fica solto ao lado */
   ar=mix(ar,.45,uSit*(1.-uAim));eb=mix(eb,-.9,uSit*(1.-uAim));
   if(part==4.||part==6.){p=rx(p,el,eb);n=rxn(n,eb);} p=rx(p,sh,-ar);n=rxn(n,-ar);}
  if(part>.5){p=ry(p,twist*(1.-uAim));n=ry(n,twist*(1.-uAim));
   float lean=.12*Rn*A+uIdle*.012*sin(ph*.5+1.);p=rx(p,vec3(0.,.78,0.),lean);n=rxn(n,lean);}
  if(part==2.||part>10.5){float nod=A*.035*sin(ph*2.);p=rx(p,vec3(0.,1.36,0.),nod);}
 }}
 p.y+=bob;
 vec4 wp=modelMatrix*vec4(p,1.);vec3 wn=normalize(mat3(modelMatrix)*n);
 float d=max(dot(wn,uSunDir),0.);vLight=uLight*(.74+.42*d);
 vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
 vUv=uv+uTile;vLoc=uv;vVN=mat3(viewMatrix)*wn;vVP=mvPosition.xyz;vFeet=clamp((.42-position.y)/.38,0.,1.); /* v4 r11: contorno e sombra dos pés (C3_FS) */
 #include <fog_vertex>
}`;
const C3_FS=`
uniform sampler2D map;uniform float uAlpha,uBlink,uGrade;uniform vec2 uTile;varying vec2 vUv,vLoc;varying vec3 vLight,vVN,vVP;varying float vFeet;
#include <fog_pars_fragment>
void main(){vec2 uvv=vUv;float lid=1.;
 /* r52: piscar = olhos (pixels 15–24 × 10–11 do quadro da cabeça) trocados pela pele logo abaixo; a linha de baixo um pouco mais escura (pálpebra) */
 if(uBlink>.5){vec2 q=vec2(vLoc.x*${C3.AW}.,(1.-vLoc.y)*${C3.AH}.);if(q.x>15.&&q.x<25.&&q.y>10.&&q.y<12.){uvv=vec2(16.5/${C3.AW}.,1.-13.5/${C3.AH}.)+uTile;lid=q.y>11.?.78:1.;}}
 vec3 c=texture2D(map,uvv).rgb*vLight*lid;
 /* v4 r11: acabamento do 2D no 3D (CHAR_GRADE): pés até 22% mais escuros perto do chão e contorno na borda da silhueta com o tom escuro da própria peça (34% + leve roxo), não preto */
 if(uGrade>.5){c*=1.-.1*vFeet;float rim=1.-abs(dot(normalize(vVN),normalize(-vVP)));c=mix(c,c*.6+vec3(.02,.014,.03),.55*smoothstep(.8,.97,rim));} /* v4 r13: mais leve (r11 parecia graxa visto de cima) */
 c=floor(c*63.+.5)/63.; /* v4 r1: 64 níveis (31 desenhava curvas de nível no tronco) */gl_FragColor=vec4(c,uAlpha);
 #include <fog_fragment>
}`;
function c3Material(){if(!C3.base)C3.base=new THREE.ShaderMaterial({vertexShader:C3_VS,fragmentShader:C3_FS,fog:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null},uTile:{value:new THREE.Vector2()},uPhase:{value:0},uAmt:{value:0},uRun:{value:0},uAim:{value:0},uPunch:{value:0},uSit:{value:0},uAir:{value:0},uIdle:{value:0},uLong:{value:0},uRagOn:{value:0},uRM:{value:Array.from({length:11},()=>new THREE.Matrix4())},uBlink:{value:0},uGrade:{value:1},uAlpha:{value:1},uLight:{value:new THREE.Color(1,1,1)},uSunDir:{value:new THREE.Vector3(0,1,0)}}])});
 const m=C3.base.clone();m.uniforms.map.value=c3Atlas();m.uniforms.uSunDir.value=C3.sunDir;return m}
/* ---------- boneco preso a um sprite de personagem ---------- */
function c3Make(o){const sp=o.sp,mat=c3Material(),mesh=new THREE.Mesh(c3Geo(),mat);mesh.matrixAutoUpdate=false;mesh.layers.set(1);mesh.castShadow=mesh.receiveShadow=false;mesh.raycast=()=>{};mesh.name='char3d';
 const st={mesh,mat,key:null,slot:null,ang:null,ph:Math.random()*6,amt:0,run:0,aim:0,punch:0,sit:0,air:0,lie:0,lx:null,lz:null,t:performance.now(),kT:0,o};
 mesh.onBeforeRender=(r,sc,cam)=>{const local=sp.userData.actorLocal;if(cam===camera){sp.userData.actorLastDraw=simT;if(local){try{actorLighting(sp,local)}catch(e){}}}
  const L=mat.uniforms.uLight.value;if(local)L.copy(local.value);else L.copy(ACTOR_LIGHT.value);if(sp.userData.actorTint)L.multiply(sp.userData.actorTint)};
 sp.add(mesh);sp.userData.c3=st;C3.list.add(st);return st}
function c3Drop(sp){const st=sp&&sp.userData.c3;if(!st)return;if(st.rag)ragEnd(st);if(st.gun){if(st.gun.parent)st.gun.parent.remove(st.gun);st.gun=null}if(st.mesh.parent)st.mesh.parent.remove(st.mesh);st.mat.dispose();C3.list.delete(st);delete sp.userData.c3;if(sp.material)sp.material.visible=true}
const _c3m=new THREE.Matrix4(),_c3a=new THREE.Matrix4(),_c3q=new THREE.Quaternion(),_c3e=new THREE.Euler(),_c3v=new THREE.Vector3(),_c3s=new THREE.Vector3();
function c3AngTo(a,b,k){let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));return a+d*k}
/* chamado depois do placeSprite original: decide pose, ângulo e roupa */
function c3Place(o){const sp=o.sp;if(!sp||!sp.isSprite)return;
 if(!C3_ON()){if(sp.userData.c3){sp.userData.c3.mesh.visible=false;sp.material.visible=true}return}
 if(sp.userData.demo3d||sp.userData.petTex)return;
 const pal=o===PL?PLAYER_PAL:o.pal;if(!pal)return;
 const st=sp.userData.c3||c3Make(o);st.o=o;st.mesh.visible=true;sp.material.visible=false;
 const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-st.t)/1000));st.t=now;
 /* roupa: confere a chave a cada ~0,4 s (lojas, shopping, emoji, troca de personagem) */
 /* sem lixo por quadro: a chave (string) só é refeita quando a paleta troca de objeto ou, no jogador (lojas mudam PLAYER_PAL no lugar), a cada ~0,4 s ou quando o sprite troca de textura */
 st.kT-=dt;if(!st.slot||pal!==st.pal||o===PL&&(st.kT<=0||sp.material.map!==st.map)){st.kT=.4;st.pal=pal;st.map=sp.material.map;st.mat.uniforms.uLong.value=pal.long?1:0;const k=c3Key(pal);if(k!==st.key){st.key=k;st.slot=null}}
 if(!st.slot||C3.slots.get(st.key)!==st.slot){st.slot=c3Slot(st.key,pal);const n=C3.AW/C3.T;st.mat.uniforms.uTile.value.set((st.slot.i%n)*C3.T/C3.AW,-Math.floor(st.slot.i/n)*C3.T/C3.AH)}else st.slot.last=now;
 if(st.rag&&st.rag.ok){if(o.state==='dead'){ragPlace(o,st);return}ragEnd(st)} /* v4 r28: corpo solto (ragdoll) */
 /* velocidade pelo deslocamento real (suaviza troca entre parado/andar/correr) */
 let spd=0;if(st.lx!==null&&dt>0){const dx=o.x-st.lx,dz=o.z-st.lz,d=Math.hypot(dx,dz);if(d<3){spd=d/dt;st.mvx=dx;st.mvz=dz}else{st.ang=null}}st.lx=o.x;st.lz=o.z;
 const k=1-Math.exp(-dt*7),patio=o.state==='patio'&&o.patioSpot,lying=patio?o.patioSpot.kind==='recline':Math.abs(o.rot||0)>1;let sitting=patio&&!lying;
 const skate=o===PL&&typeof SKATE!=='undefined'&&SKATE.ride||!!o.skb;
 /* r41: quem anda de carona (moto, conversível, caçamba, lancha) não "anda": senta/fica parado e olha para a frente do veículo */
 let rideV=null,ride=null;if(o!==PL){if(RIDERS.has(o)){ride='moto';rideV=RIDERS.get(o)}else if(CONVR.has(o)){ride='seat';rideV=CONVR.get(o)}else if(BEDR.has(o)){ride='stand';rideV=BEDR.get(o)}else if(PBOAT.o===o){ride='stand';rideV=PL.car}}else if(PL.car){ride='moto';rideV=PL.car} /* jogador visível dentro de veículo = moto/jet ski */
 if(ride==='moto'||ride==='seat')sitting=true;
 const still=lying||sitting||skate||!!ride||o.balcony;
 st.spd=(st.spd||0)+((still?0:Math.min(spd,9))-(st.spd||0))*k;
 const amtT=Math.min(1,st.spd/1.2),runT=Math.max(0,Math.min(1,(st.spd-2.6)/2.2));st.amt+=(amtT-st.amt)*k;st.run+=(runT-st.run)*k;
 /* r44: passada casada com o deslocamento (sem "patinar"): a perna gira ±θ no quadril (θ = amt·(0,42+0,22·run), igual ao shader)
    e o pé de apoio anda para trás a L·θ·ω no meio do passo; ω = v/(L·θ) → ciclo = 2π·L·θ (L ≈ 0,72 com o joelho; ×1,5 no top-down) */
 const c3sc=camMode==='top'&&!VIEW.orbit?1.5:1,c3th=Math.max(.04,st.amt*(.42+.22*st.run)),stride=Math.PI*2*.72*c3th*c3sc;st.ph+=(st.spd*dt)/stride*Math.PI*2*(st.amt>.02?1:0);
 st.idle=(st.idle||0)+dt;
 /* mira / soco / pulo / sentado */
 const na=o!==PL&&o.c3aim&&o.c3aim.t>now&&o.state!=='dead'&&o.state!=='down'&&!ride;
 const calm=o===PL&&c3Calm(),aimT=na?1:ride==='moto'?.7:o===PL&&!calm&&(C3AIM.on||typeof GUN!=='undefined'&&GUN.has&&GUN.w!=='jammer'&&(GUN.firing||GUN.cd>0))?1:0,punchT=o===PL&&typeof MELEE!=='undefined'&&MELEE.t>0?1:0;
 st.aim+=(aimT-st.aim)*(1-Math.exp(-dt*(aimT?18:5)));st.punch+=(punchT-st.punch)*(1-Math.exp(-dt*(punchT?30:8)));
 const airT=(o.jy||0)>.08?1:0;st.air+=(airT-st.air)*(1-Math.exp(-dt*10));st.sit+=((sitting?1:skate?.14:0)-st.sit)*(1-Math.exp(-dt*10)); /* skate: joelho levemente dobrado */
 /* direção: para onde olha/anda; gira suave */
 let fx=0,fz=0;if(patio){fx=Math.sin(o.patioSpot.angle||0);fz=Math.cos(o.patioSpot.angle||0)}
 else if(lying&&o.lieNs!==undefined){fx=o.lieNs?0:1;fz=o.lieNs?1:0} /* r52: na toalha, deitado no comprido dela */
 else if(rideV){fx=Math.cos(rideV.a);fz=Math.sin(rideV.a)}
 else if(na){fx=o.c3aim.x;fz=o.c3aim.z} /* v4 r14: ped atirando vira para o alvo */
 else if(skate&&o===PL){fx=Math.cos(SKATE.ride.a);fz=Math.sin(SKATE.ride.a)}
 else if(o===PL&&MELEE&&MELEE.t>0){fx=MELEE.d[0];fz=MELEE.d[1]}
 else if(o===PL&&C3AIM.on&&!calm){fx=C3AIM.x;fz=C3AIM.z}
 else if(o===PL&&PL.face){fx=PL.face[0];fz=PL.face[1]}
 else if(Math.hypot(o.mx||0,o.mz||0)>1e-3){fx=o.mx;fz=o.mz}
 else if(o.face&&o.face.length===2){fx=o.face[0];fz=o.face[1]}
 if(Math.hypot(fx,fz)<1e-3&&st.mvx!==undefined&&st.spd>.2){fx=st.mvx;fz=st.mvz}
 if(Math.hypot(fx,fz)>1e-3){const ta=Math.atan2(fx,fz)+(skate?1.15:0); /* r41: no skate fica de lado na prancha */st.ang=st.ang===null?ta:c3AngTo(st.ang,ta,1-Math.exp(-dt*14))}
 if(st.ang===null)st.ang=0;
 const U=st.mat.uniforms;U.uPhase.value=st.amt>.02?st.ph:st.idle*1.3;U.uAmt.value=st.amt;U.uRun.value=st.run;U.uAim.value=st.aim;U.uPunch.value=st.punch;U.uSit.value=st.sit;U.uAir.value=st.air;U.uIdle.value=1-st.amt;U.uGrade.value=typeof CHAR_GRADE!=='undefined'&&CHAR_GRADE.on?1:0;
 /* r52: piscar a cada 2–6 s (0,13 s fechado); deitado fica de olhos fechados; óculos e demogorgon não piscam */
 st.bk=(st.bk===undefined?Math.random()*4:st.bk)-dt;if(st.bk<-.13)st.bk=2+Math.random()*4;U.uBlink.value=pal.glasses||pal.demo?0:lying||st.bk<0?1:0;
 /* transparência do sprite (fantasma da proteção do online, aparições, revive) vale para o boneco */
 {const op=sp.material.opacity;if(op<.995){if(!st.mat.transparent){st.mat.transparent=true;st.mat.depthWrite=false}U.uAlpha.value=op}else if(st.mat.transparent){st.mat.transparent=false;st.mat.depthWrite=true;U.uAlpha.value=1}}
 /* matriz local = escala inversa do sprite · desce o "lift" do sprite · gira · deita */
 const top=camMode==='top'&&!VIEW.orbit,sc=top?1.5:1;let lift=0,ly=0;
 if(patio)lift=lying?.86:.22;else{lift=(top?.9:0)+((o.rot&&Math.abs(o.rot)>1&&!top)?.3:0)+(o.jy||0)*0}
 if(sitting)ly=ride==='moto'?-.12:-.33;if(lying)ly=patio?lift-.3+.12*sc:.15;
 _c3e.set(0,st.ang,0,'YXZ');if(lying){_c3e.set(o.rot<0&&!patio?Math.PI/2:-Math.PI/2,st.ang,0,'YXZ')}else if(Math.abs(o.rot||0)>.01)_c3e.set(0,st.ang,-(o.rot||0),'YXZ');
 _c3q.setFromEuler(_c3e);_c3v.set(0,-lift+ly,0);
 /* r52: deitado, a malha tem os pés na origem; centra o corpo (≈1,75 m) no colchão/toalha. Espreguiçadeira: cabeça no encosto (lado −frente), pés para +frente */
 if(lying){const hd=_c3e.x>0?1:-1,fa=st.ang,d=(patio?.9:-.85*hd)*sc;_c3v.x+=Math.sin(fa)*d;_c3v.z+=Math.cos(fa)*d}_c3s.set(sc,sc,sc);_c3a.compose(_c3v,_c3q,_c3s);
 const s=sp.scale;_c3m.makeScale(1/(s.x||1),1/(s.y||1),1/(s.z||1));st.mesh.matrix.multiplyMatrices(_c3m,_c3a);st.mesh.matrixWorldNeedsUpdate=true;if(na)c3NpcGun(o,st,sc);else if(st.gun)st.gun.visible=false;if(calm)c3HeldPlace()}
/* sol: direção da luz principal (uma vez por quadro, usada por todos os bonecos) */
function c3Frame(){if(!C3_ON())return;try{C3.sunDir.copy(sun.position).sub(sun.target.position).normalize();if(C3.sunDir.y<.15){C3.sunDir.y=.15;C3.sunDir.normalize()}}catch(e){}
 if(C3.frame%10===0){const t=performance.now();for(const st of C3.list)if(st.gun&&st.gun.visible&&!(st.o&&st.o.c3aim&&st.o.c3aim.t>t&&st.o.sp&&st.o.sp.parent))st.gun.visible=false} /* v4 r14: arma de ped que parou de ser posado (longe/removido) some */
 if(++C3.frame%120===0){for(const st of C3.list)if(!st.o||!st.o.sp||!st.o.sp.parent){if(st.o&&st.o.sp&&st.o.sp.userData.c3===st)c3Drop(st.o.sp);else{C3.list.delete(st);if(st.mesh.parent)st.mesh.parent.remove(st.mesh);st.mat.dispose()}}}}
/* troca de modo: liga/desliga em todos os personagens já criados */
function c3ApplyMode(){if(!C3_ON()){for(const st of [...C3.list]){if(st.o&&st.o.sp&&st.o.sp.userData.c3===st)c3Drop(st.o.sp);else{C3.list.delete(st);if(st.mesh.parent)st.mesh.parent.remove(st.mesh);st.mat.dispose()}}}const all=[PL,...peds];for(const o of all){if(!o||!o.sp)continue;if(!C3_ON())c3Drop(o.sp);else{try{c3Place(o)}catch(e){console.error(e)}}}}
/* gancho: todo personagem posicionado por placeSprite ganha o boneco 3D (quando a opção está ligada) */
placeSprite=(f=>function(o){const r=f.apply(this,arguments);if(o&&o.sp){try{const fr=renderer.info.render.frame;if(C3.lastF!==fr){C3.lastF=fr;c3Frame()}c3Place(o)}catch(e){if(!C3.err){C3.err=1;console.error(e)}}}return r})(placeSprite);
/* arma na mão: no 3D o jogador vira para a mira e a arma vai para a mão direita (no 2D ela fica do lado do sprite) */
const C3AIM={on:false,x:0,z:1};
/* r45: em diálogo/cena (beijo no motel, conversas da campanha) a arma fica baixa na mão, sem a pose de mira.
   Diálogo pausa o update() (heldGunTick não roda), então o próprio c3Place recoloca a arma enquanto o braço desce. */
function c3Calm(){return (typeof DLG!=='undefined'&&DLG.on)||(typeof PROLOGUE!=='undefined'&&!!PROLOGUE.cut)||(typeof CAMP!=='undefined'&&(!!CAMP.cut||!!CAMP.intro))}
function c3HeldPlace(){if(!(C3_ON()&&typeof HELD!=='undefined'&&HELD.g&&PL.sp&&PL.sp.userData.c3))return false;const top=camMode==='top';let ax,az;if(top){ax=PL.face[0];az=PL.face[1]}else{ax=-Math.sin(PL.yaw);az=-Math.cos(PL.yaw)}
  const l=Math.hypot(ax,az)||1,nx=ax/l,nz=az/l,k=top&&!VIEW.orbit?1.5:1,st=PL.sp.userData.c3,a=st.ang==null?Math.atan2(nx,nz):st.ang,fx=Math.sin(a),fz=Math.cos(a),u=st.aim;
  C3AIM.x=nx;C3AIM.z=nz;
  /* mão direita: ombro (−0,265; 1,30) + braço esticado para a frente conforme a pose de mira (u) */
  const fw=(.12+.5*u)*k,lat=.27*k,hy=(.86+.44*u)*k;
  HELD.g.position.set(PL.x+fx*fw-fz*lat,PL.gy+(PL.jy||0)+hy,PL.z+fz*fw+fx*lat);HELD.g.scale.setScalar((GUN.w==='rpg'?.36:.24)*k);HELD.g.rotation.set(0,Math.atan2(-fz,fx),0);return true}
/* v4 r14: polícia, gangue e ped que reage atiram com o braço direito erguido e uma arma na mão (igual ao jogador).
   c3Fire(p,tx,tz) é chamado em cada tiro de ped; a pose e a arma ficam 2,2 s depois do último tiro (os intervalos de tiro vão até ~1,8 s). Arma = 3 caixas com geometria/material compartilhados. */
function c3Fire(p,tx,tz){if(!p||p===PL)return;const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz)||1;const a=p.c3aim||(p.c3aim={t:0,x:0,z:1});a.t=performance.now()+2200;a.x=dx/l;a.z=dz/l;p.mx=a.x;p.mz=a.z}
const C3GUN={};
function c3GunMake(smg){if(!C3GUN.mat){C3GUN.mat=new THREE.MeshLambertMaterial({color:0x26272b});C3GUN.mat.userData.cached=true;C3GUN.body=new THREE.BoxGeometry(1,1,1);C3GUN.body.userData.cached=true}
 const g=new THREE.Group(),b=(x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(C3GUN.body,C3GUN.mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=false;g.add(m)};
 /* cano para +x (mesma convenção do HELD do jogador) */
 if(smg){b(.07,0,0,.34,.075,.05);b(-.02,-.08,0,.05,.13,.045);b(.1,-.08,0,.045,.12,.04)}else{b(.05,0,0,.22,.065,.045);b(-.025,-.075,0,.055,.12,.045)}
 g.position.set(0,-9999,0);scene.add(g);return g}
function c3NpcGun(o,st,k){if(!st.gun||st.gunSmg!==(o.wpn==='smg')){if(st.gun&&st.gun.parent)st.gun.parent.remove(st.gun);st.gunSmg=o.wpn==='smg';st.gun=c3GunMake(st.gunSmg)}
 const a=st.ang,fx=Math.sin(a),fz=Math.cos(a),u=st.aim,fw=(.12+.5*u)*k,lat=.27*k,hy=(.86+.44*u)*k;
 st.gun.visible=o.sp.visible;st.gun.position.set(o.x+fx*fw-fz*lat,(o.gy||0)+(o.jy||0)+hy,o.z+fz*fw+fx*lat);st.gun.scale.setScalar(k);st.gun.rotation.set(0,Math.atan2(-fz,fx),0)}
copShoot=(f=>function(p){try{c3Fire(p,PL.x,PL.z)}catch(e){}return f.apply(this,arguments)})(copShoot);
pedevGun=(f=>function(p,tgt){try{if(tgt)c3Fire(p,tgt.x,tgt.z)}catch(e){}return f.apply(this,arguments)})(pedevGun);
eventShoot=(f=>function(from,target){try{if(from&&target&&from.sp)c3Fire(from,target.x,target.z)}catch(e){}return f.apply(this,arguments)})(eventShoot);
heldGunTick=(f=>function(){const r=f.apply(this,arguments);C3AIM.on=c3HeldPlace();return r})(heldGunTick);
/* r45: diálogo comum pausa o jogo inteiro (update → dlgTick): o boneco do jogador continua sendo posado para abaixar a arma */
dlgTick=(f=>function(){const r=f.apply(this,arguments);try{if(C3_ON()&&PL.sp&&PL.sp.userData.c3&&!PL.car&&PL.sp.visible)c3Place(PL)}catch(e){}return r})(dlgTick);
/* r41: ped criado durante diálogo/cena (que pausam updatePeds) já nasce com o boneco, em vez de ficar 2D até a cena acabar */
spawnPed=(f=>function(){const q=f.apply(this,arguments);if(q&&q.sp&&C3_ON()){try{c3Place(q)}catch(e){}}return q})(spawnPed);
spawnLying=(f=>function(){const q=f.apply(this,arguments);if(q&&q.sp&&C3_ON()){try{c3Place(q)}catch(e){}}return q})(spawnLying);
/* r41: ped removido solta o boneco na hora (antes o sprite fora da cena segurava a malha e a lista crescia a cada troca de cidade) */
removePed=(f=>function(p){try{if(p&&p.sp)c3Drop(p.sp)}catch(e){}return f.apply(this,arguments)})(removePed);
/* r42 · RETRATO 3D ("foto" do boneco PS1) para seleção de modo, diálogo e HUD. Mesmo formato do charPortrait do 2.5D:
   {open_closed, open_open, closed_closed, closed_open} 192×192, uma vez por roupa (cache), fora do quadro do jogo.
   Atlas próprio (PT.cv, 4 tiles: piscada × boca) para não mexer nos slots dos bonecos da rua. */
const C3PT={cache:new Map(),cv:null,g:null,tex:null,mesh:null,cam:null};
function c3Portrait(pal){const k=c3Key(pal);let P=C3PT.cache.get(k);if(P)return P;
 const T=C3.T,n=C3.AW/T;if(!C3PT.cv){C3PT.cv=cv(C3.AW,C3.AH);C3PT.g=C3PT.cv.getContext('2d');C3PT.g.imageSmoothingEnabled=false;const t=new THREE.CanvasTexture(C3PT.cv);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;C3PT.tex=t}
 const g=C3PT.g,hD=c3Shade(pal.hair||'#2a1a12',.75),ex=C3RG.head[0]+20,hy=C3RG.head[1],noEye=!!(pal.glasses||pal.demo);
 for(let i=0;i<4;i++){const ox=i*T;c3Paint(g,ox,0,pal);const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(ox+x,y,w,h)};
  if(i&1&&!noEye){R(ex-5,hy+10,3,2,pal.skin);R(ex+2,hy+10,3,2,pal.skin);R(ex-5,hy+11,3,1,hD);R(ex+2,hy+11,3,1,hD)}
  if(i&2&&!pal.demo){R(ex-2,hy+15,4,1,'#6a2228');R(ex-2,hy+16,4,1,'#2a0a0e')}}
 C3PT.tex.needsUpdate=true;
 if(!C3PT.mesh){const m=c3Material();m.uniforms.map.value=C3PT.tex;m.uniforms.uSunDir.value=new THREE.Vector3(-.45,.55,.9).normalize();m.uniforms.uLight.value.setRGB(1.04,1,.97);
  C3PT.mesh=new THREE.Mesh(c3Geo(),m);C3PT.mesh.frustumCulled=false;
  C3PT.cam=new THREE.OrthographicCamera(-.4,.4,.4,-.4,-5,5);C3PT.cam.position.set(0,1.42+2*Math.sin(.06),2*Math.cos(.06));C3PT.cam.lookAt(0,1.42,0)}
 const S0=192,rt=char3DStage(S0,S0),M=C3PT.mesh,U=M.material.uniforms;ATLAS8.scene.add(M);P={};U.uLong.value=pal&&pal.long?1:0;
 try{char3DWith(()=>{for(let i=0;i<4;i++){U.uTile.value.set((i%n)*T/C3.AW,0);P[(i&1?'closed':'open')+'_'+(i&2?'open':'closed')]=char3DShoot(C3PT.cam,rt,S0,S0,3,false)}})}
 finally{ATLAS8.scene.remove(M)}
 if(C3PT.cache.size>40)C3PT.cache.delete(C3PT.cache.keys().next().value);C3PT.cache.set(k,P);return P}
window.c3Debug=()=>({on:C3_ON(),chars:C3.list.size,slots:C3.slots.size,free:C3.free.length,tris:C3.geo?C3.geo.index.count/3:0});
/* ===================== v4 r28 · RAGDOLL LEVE (só no visual 3D) =====================
   Quem morre com o boneco 3D cai "solto": 14 partículas (Verlet) ligadas por distâncias fixas (tronco e cabeça rígidos,
   braços e pernas com cotovelo/joelho livres), chão plano na altura do quadril, atrito no chão e empurrão para fora das paredes.
   O impulso vem da velocidade que o jogo já dá ao corpo (p.vx/p.vz do atropelamento, explosão, soco) + um pulo para cima;
   morte sem empurrão (tiro) só desaba. Cada peça do boneco recebe uma matriz de mundo (uRM no C3_VS). Dura até ~3 s e congela
   na pose em que caiu; o corpo some como antes. No máximo RAG.MAX simulando ao mesmo tempo (o resto deita do jeito antigo).
   Sem alocação por quadro: buffers criados na largada de cada ragdoll. */
const RAG={MAX:4,live:new Set(),
 /* juntas do modelo (lado esq. = +x): 0 quadril E 1 quadril D 2 pescoço 3 topo da cabeça 4 ombro E 5 cotovelo E 6 mão E 7 ombro D 8 cotovelo D 9 mão D 10 joelho E 11 pé E 12 joelho D 13 pé D */
 J:[[.1,.78,0],[-.1,.78,0],[0,1.33,0],[0,1.73,0],[.265,1.3,0],[.27,1.04,0],[.272,.7,0],[-.265,1.3,0],[-.27,1.04,0],[-.272,.7,0],[.1,.44,0],[.1,.06,0],[-.1,.44,0],[-.1,.06,0]],
 RAD:[.1,.1,.12,.12,.08,.06,.05,.08,.06,.05,.07,.06,.07,.06],
 RIG:[[0,1],[0,2],[1,2],[4,7],[4,2],[7,2],[4,0],[7,1],[4,1],[7,0],[3,2],[3,4],[3,7],[4,5],[5,6],[7,8],[8,9],[0,10],[10,11],[1,12],[12,13]],
 MIN:[[4,6,.26],[7,9,.26],[0,11,.42],[1,13,.42],[6,0,.18],[9,1,.18],[11,1,.16],[13,0,.16]],
 /* peças: [junta proximal, junta distal, peça-mãe] (mãe −1 = tronco) */
 LIMB:{3:[4,5,-1],4:[5,6,3],5:[7,8,-1],6:[8,9,5],7:[0,10,-1],8:[10,11,7],9:[1,12,-1],10:[12,13,9]},
 tmpO:{x:0,z:0},v0:new THREE.Vector3(),v1:new THREE.Vector3(),v2:new THREE.Vector3(),v3:new THREE.Vector3(),q:new THREE.Quaternion(),m:new THREE.Matrix4(),m2:new THREE.Matrix4(),
 rot:Array.from({length:11},()=>new THREE.Matrix4())};
function ragOK(o,st){return !!(st&&st.mesh&&st.mesh.visible&&o&&o.sp&&o.sp.userData.c3===st)}
/* começa: (vx,vz) = velocidade do corpo; up = pulo extra (m/s) */
function ragStart(o,st,vx,vz,up){if(RAG.live.size>=RAG.MAX)return false;
 const sc=camMode==='top'&&!VIEW.orbit?1.5:1,a=st.ang||0,ca=Math.cos(a),sa=Math.sin(a),N=RAG.J.length;
 const r=st.rag||(st.rag={x:new Float32Array(N*3),px:new Float32Array(N*3),L:new Float32Array(RAG.RIG.length),Lm:new Float32Array(RAG.MIN.length),rm:Array.from({length:11},()=>new THREE.Matrix4())});
 r.ok=true;r.t=0;r.calm=0;r.frozen=false;r.sc=sc;r.acc=0;const gy=(o.gy!==undefined?o.gy:groundY(o.x,o.z));r.g=gy;
 const sp=Math.hypot(vx,vz),dirx=sp>.1?vx/sp:-sa,dirz=sp>.1?vz/sp:-ca,soft=sp<1.5; /* sem empurrão: desaba para trás */
 for(let i=0;i<N;i++){const j=RAG.J[i],lx=j[0]*sc,ly=j[1]*sc,lz=j[2]*sc,wx=o.x+ca*lx+sa*lz,wz=o.z-sa*lx+ca*lz,wy=gy+ly,k=i*3;
  r.x[k]=wx;r.x[k+1]=wy;r.x[k+2]=wz;
  /* atropelamento: pernas levam o tranco cheio e o tronco menos (o corpo gira por cima do capô); explosão: tudo junto */
  const legs=i>=10||i<2,head=i===2||i===3,f=soft?(head?1:legs?-.25:.5):legs?1:head?.62:.8,fu=soft?0:(legs?.55:1)*up,h=1/60;
  const ex=soft?dirx*1.3*(ly/1.7):vx*f,ez=soft?dirz*1.3*(ly/1.7):vz*f;
  r.px[k]=wx-ex*h;r.px[k+1]=wy-fu*h;r.px[k+2]=wz-ez*h}
 /* torção leve para não cair sempre "certinho" */
 const tw=(Math.random()-.5)*(soft?.6:2.4);for(let i=0;i<N;i++){const k=i*3,dx=r.x[k]-o.x,dz=r.x[k+2]-o.z;r.px[k]+=dz*tw/60;r.px[k+2]-=dx*tw/60}
 for(let c=0;c<RAG.RIG.length;c++){const[a1,b1]=RAG.RIG[c];r.L[c]=Math.hypot(r.x[a1*3]-r.x[b1*3],r.x[a1*3+1]-r.x[b1*3+1],r.x[a1*3+2]-r.x[b1*3+2])}
 for(let c=0;c<RAG.MIN.length;c++)r.Lm[c]=RAG.MIN[c][2]*sc;
 const U=st.mat.uniforms;U.uRM.value=r.rm;U.uRagOn.value=1;st.mesh.frustumCulled=false;RAG.live.add(st);ragPose(st);return true}
function ragEnd(st){RAG.live.delete(st);if(st.rag){st.rag.ok=false}if(st.mat){st.mat.uniforms.uRagOn.value=0;st.mat.uniforms.uRM.value=RAG.rot}if(st.mesh)st.mesh.frustumCulled=true}
function ragStep(st,h){const r=st.rag,x=r.x,px=r.px,N=RAG.J.length,G=-13*h*h,g=r.g;let mv=0;
 for(let i=0;i<N;i++){const k=i*3;for(let e=0;e<3;e++){const c=x[k+e],v=(c-px[k+e])*.995;px[k+e]=c;x[k+e]=c+v+(e===1?G:0);if(e!==1)mv=Math.max(mv,Math.abs(v))}}
 for(let it=0;it<8;it++){
  for(let c=0;c<RAG.RIG.length;c++){const a=RAG.RIG[c][0]*3,b=RAG.RIG[c][1]*3,dx=x[b]-x[a],dy=x[b+1]-x[a+1],dz=x[b+2]-x[a+2],d=Math.hypot(dx,dy,dz)||1e-6,f=(d-r.L[c])/d*.5;
   x[a]+=dx*f;x[a+1]+=dy*f;x[a+2]+=dz*f;x[b]-=dx*f;x[b+1]-=dy*f;x[b+2]-=dz*f}
  for(let c=0;c<RAG.MIN.length;c++){const a=RAG.MIN[c][0]*3,b=RAG.MIN[c][1]*3,dx=x[b]-x[a],dy=x[b+1]-x[a+1],dz=x[b+2]-x[a+2],d=Math.hypot(dx,dy,dz)||1e-6;if(d>=r.Lm[c])continue;const f=(d-r.Lm[c])/d*.5;
   x[a]+=dx*f;x[a+1]+=dy*f;x[a+2]+=dz*f;x[b]-=dx*f;x[b+1]-=dy*f;x[b+2]-=dz*f}
  for(let i=0;i<N;i++){const k=i*3,lo=g+RAG.RAD[i]*r.sc;if(x[k+1]<lo){x[k+1]=lo;if(px[k+1]<lo)px[k+1]=lo+(lo-px[k+1])*.15; /* quique pequeno */
    px[k]+=(x[k]-px[k])*.12;px[k+2]+=(x[k+2]-px[k+2])*.12}}} /* atrito no chão */
 /* paredes: cada partícula sai das caixas dos colisores (lista pega 1× por quadro em ragTick); colisor baixo (banco, lixeira) só pega o que está abaixo da altura dele */
 const near=r.near;if(near)for(let i=0;i<N;i++){const k=i*3,rr=RAG.RAD[i]*r.sc,hy=x[k+1]-g;for(const c of near){if(c.dead)continue;const top=c.kind==='bin'?(c.bin?.height??.9):c.low;if(top&&hy>top)continue;
   const cx=x[k]<c.x0?c.x0:x[k]>c.x1?c.x1:x[k],cz=x[k+2]<c.z0?c.z0:x[k+2]>c.z1?c.z1:x[k+2],dx=x[k]-cx,dz=x[k+2]-cz,d=Math.hypot(dx,dz);if(d>=rr)continue;
   if(d>1e-5){x[k]=cx+dx/d*rr;x[k+2]=cz+dz/d*rr}else{const d0=x[k]-c.x0,d1=c.x1-x[k],d2=x[k+2]-c.z0,d3=c.z1-x[k+2],m=Math.min(d0,d1,d2,d3);if(m===d0)x[k]=c.x0-rr;else if(m===d1)x[k]=c.x1+rr;else if(m===d2)x[k+2]=c.z0-rr;else x[k+2]=c.z1+rr}
   px[k]+=(x[k]-px[k])*.5;px[k+2]+=(x[k+2]-px[k+2])*.5}} /* perde metade da velocidade ao bater */
 return mv/h}
/* matrizes de mundo de cada peça a partir das partículas */
function ragPose(st){const r=st.rag,x=r.x,sc=r.sc,J=RAG.J,v0=RAG.v0,v1=RAG.v1,v2=RAG.v2,v3=RAG.v3,M=RAG.m,R=RAG.rot,P=(i,v)=>v.set(x[i*3],x[i*3+1],x[i*3+2]);
 const put=(part,rot,jw,jm)=>{/* W = T(jw)·R·S(sc)·T(−jm) */const m=r.rm[part];m.copy(rot);m.elements[0]*=sc;m.elements[1]*=sc;m.elements[2]*=sc;m.elements[4]*=sc;m.elements[5]*=sc;m.elements[6]*=sc;m.elements[8]*=sc;m.elements[9]*=sc;m.elements[10]*=sc;
  const e=m.elements;e[12]=jw.x-(e[0]*jm[0]+e[4]*jm[1]+e[8]*jm[2]);e[13]=jw.y-(e[1]*jm[0]+e[5]*jm[1]+e[9]*jm[2]);e[14]=jw.z-(e[2]*jm[0]+e[6]*jm[1]+e[10]*jm[2]);e[3]=e[7]=e[11]=0;e[15]=1};
 /* tronco: up = quadril→pescoço; lado = ombro D→E + quadril D→E */
 P(0,v0);P(1,v1);const hx=(v0.x+v1.x)/2,hy=(v0.y+v1.y)/2,hz=(v0.z+v1.z)/2;P(2,v2);const up=v3.set(v2.x-hx,v2.y-hy,v2.z-hz).normalize();
 const sx=x[12]-x[21]+v0.x-v1.x,sy=x[13]-x[22]+v0.y-v1.y,sz=x[14]-x[23]+v0.z-v1.z;let d=sx*up.x+sy*up.y+sz*up.z;v0.set(sx-up.x*d,sy-up.y*d,sz-up.z*d).normalize();
 v1.crossVectors(v0,up);R[1].makeBasis(v0,up,v1);v2.set(hx,hy,hz);put(0,R[1],v2,[0,.78,0]);put(1,R[1],v2,[0,.78,0]);
 /* cabeça: up = pescoço→topo, lado do tronco */
 {const nk=P(2,v2),ux=x[9]-nk.x,uy=x[10]-nk.y,uz=x[11]-nk.z,l=Math.hypot(ux,uy,uz)||1;const hu=RAG.v3.set(ux/l,uy/l,uz/l);d=v0.x*hu.x+v0.y*hu.y+v0.z*hu.z;
  const hs=v1.set(v0.x-hu.x*d,v0.y-hu.y*d,v0.z-hu.z*d).normalize(),hf=RAG.v0.crossVectors(hs,hu);R[2].makeBasis(hs,hu,hf);put(2,R[2],v2,[0,1.33,0]);
  /* refaz a base do tronco (v0/v1 foram reaproveitados) */}
 R[0].copy(R[1]);
 for(let part=3;part<=10;part++){const[a,b,par]=RAG.LIMB[part],Rp=par<0?R[1]:R[par],ja=J[a],jb=J[b];
  v0.set(jb[0]-ja[0],jb[1]-ja[1],jb[2]-ja[2]).normalize().applyMatrix4(M.extractRotation(Rp));
  v1.set(x[b*3]-x[a*3],x[b*3+1]-x[a*3+1],x[b*3+2]-x[a*3+2]).normalize();RAG.q.setFromUnitVectors(v0,v1);
  R[part].makeRotationFromQuaternion(RAG.q).multiply(Rp);P(a,v2);put(part,R[part],v2,ja)}}
/* passo da simulação (chamado no update e no palco dos interiores) */
function ragTick(dt){if(!C3_ON()||!dt)return;
 /* largada: corpo 3D recém-morto */
 for(const p of peds){if(p.state!=='dead'){if(p._ragS)p._ragS=0;continue}if(p._ragS)continue;p._ragS=1;const sp=p.sp,st=sp&&sp.userData.c3;if(!ragOK(p,st))continue;
  const v=Math.hypot(p.vx||0,p.vz||0);if(ragStart(p,st,p.vx||0,p.vz||0,v>2?1.6+v*.28:0)){p.vx=p.vz=0}}
 for(const st of RAG.live){const o=st.o,r=st.rag;if(!r||!r.ok||!o||!o.sp||o.sp.userData.c3!==st||o.state!=='dead'){ragEnd(st);continue}
  r.t+=dt;r.acc=Math.min(r.acc+dt,.1);{const A=r.near||(r.near=[]);A.length=0;try{const q=query((r.x[0]+r.x[3])/2,(r.x[2]+r.x[5])/2,2.6*r.sc);for(let i=0;i<q.length;i++)A.push(q[i])}catch(e){}} /* query devolve um vetor compartilhado: copia */let mv=0;const h=1/60;while(r.acc>=h){mv=Math.max(mv,ragStep(st,h));r.acc-=h}
  r.calm=mv<.35?r.calm+dt:0;ragPose(st);
  /* o ped (sombra, espólio, colisão) segue o quadril */
  o.x=(r.x[0]+r.x[3])/2;o.z=(r.x[2]+r.x[5])/2;{const g=groundY(o.x,o.z);if(isFinite(g)&&Math.abs(g-r.g)<1.2)r.g=g}
  if(r.t>3||r.t>1.1&&r.calm>.35){r.frozen=true;RAG.live.delete(st)}}}
/* posiciona o boneco em ragdoll: as matrizes já estão em coordenadas de mundo → anula a matriz do sprite */
function ragPlace(o,st){const sp=o.sp,s=sp.scale,p=sp.position,m=st.mesh.matrix;m.makeTranslation(-p.x,-p.y,-p.z);RAG.m2.makeScale(1/(s.x||1),1/(s.y||1),1/(s.z||1));m.premultiply(RAG.m2);
 if(sp.parent&&sp.parent!==scene){sp.parent.updateMatrixWorld();RAG.m2.copy(sp.parent.matrixWorld).invert();m.multiply(RAG.m2)}
 st.mesh.matrixWorldNeedsUpdate=true;const U=st.mat.uniforms;U.uBlink.value=1;U.uRagOn.value=1;if(st.gun)st.gun.visible=false;
 {const op=sp.material.opacity;if(op<.995){if(!st.mat.transparent){st.mat.transparent=true;st.mat.depthWrite=false}U.uAlpha.value=op}else if(st.mat.transparent){st.mat.transparent=false;st.mat.depthWrite=true;U.uAlpha.value=1}}}
