'use strict';
/* Coastal Chaos · js/50-pets-3d.js — Cães e gatos em 2.5D e 3D (v4).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html.
   O sprite 2D do bicho (animalTex, 32×24, js/18) continua existindo: posição, visibilidade, colisão e IA não mudam.
   - 3D (S.char3d): malha low-poly no mesmo estilo do boneco PS1 (js/49), filha do sprite (material.visible=false),
     com pose no vertex shader: passo em diagonal (trote) andando, galope correndo, rabo abanando (cão) ou balançando (gato),
     cabeça olhando em volta parado, sentado e deitado de lado (morto). Luz = a mesma do sprite (actorLocal), contorno leve.
   - 2.5D (S.sprite8): a MESMA malha fotografada num atlas (8 ângulos × 4 quadros: parado, passo A, passo B, sentado) com o
     contorno/acabamento do 2.5D dos humanos (char3DShoot); uma textura por raça/cor + proxy de quadro por bicho.
   - 2D: sprite original.
   Gancho: pet3(sp,kind,ci,x,z,mx,mz,st,wag,y0) chamado por animalsTick/petsTick (js/18) depois de posicionar o sprite.
   st: 0 = em pé/andando, 1 = sentado, 2 = morto. Liberar antes de descartar o sprite: pet3Drop(sp).
   Diagnóstico: pet3Debug(). Remover: apagar este arquivo, a linha no index.html e as chamadas pet3/pet3Drop no js/18. */
const PET3={TW:128,TH:40,geo:{},tex:{},atlas:{},base:null,list:new Set(),built:-1,
 /* proporções (m): o sprite do cão tem ~1,25 m de quadro (25,6 px/m, igual aos humanos de 1,9 m) → cão médio (vira-lata) e gato */
 K:{dog:{hip:[0,.46,-.25],sit:.62,drop:.25,leg:.43,wag:11,run:1},cat:{hip:[0,.22,-.13],sit:.7,drop:.12,leg:.21,wag:2.2,run:1}}};
/* regiões do quadro 128×40 (u = volta do anel, v = ao longo da peça) */
const P3RG={body:[0,0,32,32],leg:[32,0,16,32],tail:[48,0,16,32],head:[64,0,64,32]};
const P3SW={fur:[2,34],dark:[10,34],light:[18,34],nose:[26,34],ear:[34,34],eye:[42,34]};
const P3EYE={dog:'#1a1210',cat:'#3a8a3a'};
function p3Mix(a,b,t){const c=new THREE.Color(a).lerp(new THREE.Color(b),t);return '#'+c.getHexString()}
function p3Cols(kind,ci){const L=kind==='dog'?DOG_COLS:CAT_COLS,[c,d]=L[((ci|0)%L.length+L.length)%L.length];const lum=new THREE.Color(c);const dk=(lum.r+lum.g+lum.b)/3<.25;
 return{c,d,light:dk?p3Mix(c,'#8a8890',.35):p3Mix(c,'#f6eedc',.5)}}
/* ---------- textura por raça/cor (128×40) ---------- */
function p3Paint(kind,ci){const k=kind+ci;if(PET3.tex[k])return PET3.tex[k];const W=PET3.TW,H=PET3.TH,c0=cv(W,H),g=c0.getContext('2d');g.imageSmoothingEnabled=false;
 const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)},{c,d,light}=p3Cols(kind,ci),cat=kind==='cat';
 const tabby=cat&&(ci===0||ci===3||ci===4),saddle=!cat&&(ci===0||ci===5),spots=!cat&&ci===4;
 /* corpo: u 0 = lado direito, .25 = dorso, .5 = lado esquerdo, .75 = barriga */
 {const[x,y,w,h]=P3RG.body;R(x,y,w,h,c);R(x+21,y+4,6,h-6,light);R(x+20,y+4,1,h-6,p3Mix(c,light,.5));R(x+27,y+4,1,h-6,p3Mix(c,light,.5));
  if(saddle)R(x+3,y+6,10,h-12,d);
  if(tabby)for(let v=3;v<h-2;v+=5){R(x+1,y+v,15,2,d);R(x+3,y+v+2,11,1,p3Mix(c,d,.5))}
  if(spots){R(x+4,y+8,6,5,d);R(x+9,y+19,5,4,d)}}
 /* pernas: pelo em cima, pata mais escura embaixo */
 {const[x,y,w,h]=P3RG.leg;R(x,y,w,h,c);if(spots)R(x,y+4,w,6,d);R(x,y+h-6,w,6,cat?light:p3Mix(c,d,.6));R(x,y+h-2,w,2,d)}
 /* rabo: ponta escura (cão) / anéis (gato listrado) */
 {const[x,y,w,h]=P3RG.tail;R(x,y,w,h,c);if(tabby)for(let v=4;v<h;v+=6)R(x,y+v,w,3,d);else R(x,y+h-8,w,8,cat?c:d)}
 /* cabeça: v 0 = nuca, 1 = ponta do focinho; olhos na frente-de-cima (u .25±.10) */
 {const[x,y,w,h]=P3RG.head;R(x,y,w,h,c);
  R(x+40,y+12,24,h-12,light);R(x+38,y+16,2,h-16,p3Mix(c,light,.5)); /* queixo/focinho por baixo */
  if(!cat)R(x+8,y+20,32,h-20,p3Mix(c,light,.55)); /* focinho do cão mais claro */
  if(tabby){R(x+12,y+1,8,2,d);R(x+14,y+5,4,2,d);R(x+12,y+9,8,1,d)}
  if(saddle)R(x+10,y,12,10,d);
  const ex=[x+7,x+21],ey=y+15,e=P3EYE[kind];
  for(const X of ex){R(X,ey,4,4,'#111014');R(X,ey,4,3,e);R(X+1,ey+1,2,2,cat?'#0e140e':'#050404');R(X+(X===ex[0]?2:1),ey,1,1,'#f4f4f0')}
  R(x+11,y+26,10,1,p3Mix(light,'#000',.35))}
 /* amostras lisas */
 R(0,32,W,8,'#000');const sq=(k2,col)=>R(P3SW[k2][0]-2,32,7,8,col);sq('fur',c);sq('dark',d);sq('light',light);sq('nose',cat?'#e88aa0':'#141012');sq('ear',cat?'#e8a0aa':d);sq('eye',P3EYE[kind]);
 /* acabamento leve igual ao dos humanos 3D (c3Grade: desbotado + grão fixo por texel, 60% do 2D) */
 try{if(typeof CHAR_GRADE!=='undefined'&&CHAR_GRADE.on){const G=CHAR_GRADE,id=g.getImageData(0,0,W,32),o=id.data;for(let yy=0;yy<32;yy++)for(let xx=0;xx<W;xx++){const i=(yy*W+xx)*4;let r=o[i],gg=o[i+1],b=o[i+2];const l=.299*r+.587*gg+.114*b;if(l<34)continue;r+=(l-r)*G.desat;gg+=(l-gg)*G.desat;b+=(l-b)*G.desat;const hh=((xx*73856093)^(yy*19349663)^(xx*yy*83492791))>>>0,f=1+((hh%1000)/1000-.5)*1.2*G.grain;o[i]=r*f;o[i+1]=gg*f;o[i+2]=b*f}g.putImageData(id,0,0)}}catch(e){}
 const t=new THREE.CanvasTexture(c0);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;PET3.tex[k]=t;return t}
/* ---------- geometria (por espécie, compartilhada) ----------
   peças: 0 corpo, 1 cabeça (+orelhas), 2 rabo, 3 diant. dir., 4 diant. esq., 5 tras. dir., 6 tras. esq.
   atributo piv = pivô da peça (ombro/quadril/pescoço/base do rabo) — o shader gira em volta dele. Frente = +z. */
function p3Geo(kind){if(PET3.geo[kind])return PET3.geo[kind];const P=[],N=[],U=[],K=[],V=[],I=[];let vi=0;const TW=PET3.TW,TH=PET3.TH,cat=kind==='cat';
 const cl=(a,lo,hi)=>a<lo?lo:a>hi?hi:a,uvAt=(r,u,v)=>[cl(r[0]+u*r[2],r[0]+.5,r[0]+r[2]-.5)/TW,1-cl(r[1]+v*r[3],r[1]+.5,r[1]+r[3]-.5)/TH],sw=k=>[(P3SW[k][0]+1.5)/TW,1-(P3SW[k][1]+3.5)/TH];
 const _t=new THREE.Vector3(),_u=new THREE.Vector3(),_w=new THREE.Vector3(),_n=new THREE.Vector3(),UPV=new THREE.Vector3(0,1,0),FWV=new THREE.Vector3(0,0,1);
 /* loft: anéis elípticos ao longo de um caminho (pts: {c:[x,y,z], a, b, v}); S lados; tampas com a cor da amostra */
 function loft(part,piv,S,pts,rect,capA,capB,mx=1){const base=vi,M=pts.length;
  const fr=pts.map((q,i)=>{const a=pts[Math.max(0,i-1)].c,b=pts[Math.min(M-1,i+1)].c;_t.set((b[0]-a[0])*mx,b[1]-a[1],b[2]-a[2]).normalize();
   const ref=Math.abs(_t.y)>.8?FWV:UPV;_u.crossVectors(_t,ref).normalize();if(Math.abs(_t.y)>.8)_u.set(-1,0,0);_w.crossVectors(_u,_t).normalize();if(_w.y<0&&Math.abs(_t.y)<=.8)_w.negate();return[_u.clone(),_w.clone()]});
  pts.forEach((q,i)=>{const[u,w]=fr[i];for(let j=0;j<=S;j++){const t=j/S*Math.PI*2,co=Math.cos(t),si=Math.sin(t);
    P.push(q.c[0]*mx+co*q.a*u.x+si*q.b*w.x,q.c[1]+co*q.a*u.y+si*q.b*w.y,q.c[2]+co*q.a*u.z+si*q.b*w.z);
    _n.set(co/q.a*u.x+si/q.b*w.x,co/q.a*u.y+si/q.b*w.y,co/q.a*u.z+si/q.b*w.z).normalize();N.push(_n.x,_n.y,_n.z);
    const uv=uvAt(rect,mx<0?((1.5-j/S)%1):j/S,q.v);U.push(uv[0],uv[1]);K.push(part);V.push(piv[0]*mx,piv[1],piv[2]);vi++}});
  for(let a=0;a<M-1;a++)for(let j=0;j<S;j++){const p=base+a*(S+1)+j,q=p+S+1;if(mx>0)I.push(p,p+1,q,p+1,q+1,q);else I.push(p,q,p+1,p+1,q,q+1)}
  const cap=(i,end,uv)=>{if(!uv)return;const q=pts[i],[u,w]=fr[i],c0=vi;_t.set(0,0,0);const a2=pts[Math.max(0,i-1)].c,b2=pts[Math.min(M-1,i+1)].c;_t.set((b2[0]-a2[0])*mx,b2[1]-a2[1],b2[2]-a2[2]).normalize();if(!end)_t.negate();
   for(let j=0;j<S;j++){const t=j/S*Math.PI*2,co=Math.cos(t),si=Math.sin(t);P.push(q.c[0]*mx+co*q.a*u.x+si*q.b*w.x,q.c[1]+co*q.a*u.y+si*q.b*w.y,q.c[2]+co*q.a*u.z+si*q.b*w.z);N.push(_t.x,_t.y,_t.z);U.push(uv[0],uv[1]);K.push(part);V.push(piv[0]*mx,piv[1],piv[2]);vi++}
   const flip=(end?1:0)^(mx<0?1:0);for(let j=1;j<S-1;j++){if(flip)I.push(c0,c0+j,c0+j+1);else I.push(c0,c0+j+1,c0+j)}};
  cap(0,false,capA);cap(M-1,true,capB)}
 /* junta: bolinha no pivô (fecha a fresta quando a perna gira, como o ball() dos humanos) */
 function ball(part,piv,c,R,rect,v,mx){const rs=[.5,1.15,1.5708,2.0,2.65].map(a=>({c:[c[0],c[1]+R*Math.cos(a)*.9,c[2]],a:Math.max(.004,R*Math.sin(a)),b:Math.max(.004,R*Math.sin(a)),v}));loft(part,piv,6,rs,rect,uvAt(rect,.5,v),uvAt(rect,.5,v),mx)}
 if(!cat){
  /* CÃO (vira-lata médio): dorso ~0,52 m, cabeça ~0,74 m, focinho→garupa ~0,98 m; tronco fundo e coxas grossas (sem cara de cabrito) */
  loft(0,[0,.46,0],10,[{c:[0,.5,-.4],a:.06,b:.065,v:0},{c:[0,.49,-.36],a:.125,b:.135,v:.08},{c:[0,.475,-.25],a:.15,b:.16,v:.22},{c:[0,.46,-.06],a:.15,b:.165,v:.45},{c:[0,.44,.12],a:.155,b:.185,v:.7},{c:[0,.47,.25],a:.135,b:.165,v:.88},{c:[0,.54,.33],a:.09,b:.1,v:1}],P3RG.body,sw('fur'),null);
  const hp=[0,.57,.3];
  loft(1,hp,10,[{c:[0,.55,.27],a:.085,b:.09,v:0},{c:[0,.62,.35],a:.108,b:.105,v:.15},{c:[0,.65,.43],a:.118,b:.11,v:.4},{c:[0,.63,.5],a:.095,b:.088,v:.6},{c:[0,.6,.57],a:.066,b:.058,v:.8},{c:[0,.588,.63],a:.048,b:.042,v:.95},{c:[0,.585,.655],a:.032,b:.028,v:1}],P3RG.head,null,sw('nose'));
  for(const mx of[1,-1]){/* orelhas caídas (dobradas para o lado e para baixo) */loft(1,hp,5,[{c:[.07,.735,.4],a:.045,b:.016,v:0},{c:[.115,.72,.405],a:.042,b:.013,v:.4},{c:[.135,.665,.41],a:.03,b:.01,v:.8},{c:[.138,.635,.412],a:.012,b:.006,v:1}],P3RG.leg,sw('ear'),sw('ear'),mx)}
  loft(2,[0,.52,-.38],6,[{c:[0,.52,-.38],a:.04,b:.04,v:0},{c:[0,.58,-.47],a:.034,b:.034,v:.4},{c:[0,.67,-.54],a:.025,b:.025,v:.75},{c:[0,.74,-.565],a:.012,b:.012,v:1}],P3RG.tail,null,sw('dark'));
  for(const mx of[1,-1]){for(const fr of[1,0]){const z=fr?.18:-.25,y0=.42,part=fr?(mx>0?3:4):(mx>0?5:6),piv=[.08,y0,z];
   const L=fr?[{c:[.08,y0+.04,z],a:.068,b:.08,v:0},{c:[.08,.3,z],a:.055,b:.06,v:.35},{c:[.08,.14,z+.005],a:.042,b:.046,v:.7},{c:[.08,.05,z+.01],a:.04,b:.044,v:.86},{c:[.08,.025,z+.035],a:.05,b:.066,v:.93},{c:[.08,0,z+.035],a:.046,b:.062,v:1}]
           :[{c:[.08,y0+.05,z],a:.075,b:.1,v:0},{c:[.08,.3,z-.035],a:.066,b:.075,v:.3},{c:[.08,.19,z-.05],a:.045,b:.05,v:.55},{c:[.08,.08,z-.02],a:.04,b:.044,v:.8},{c:[.08,.025,z+.015],a:.05,b:.066,v:.93},{c:[.08,0,z+.015],a:.046,b:.062,v:1}];
   loft(part,piv,7,L,P3RG.leg,null,sw('dark'),mx);
   ball(part,piv,[.08,y0,z],.05,P3RG.leg,.05,mx)}}}
 else{
  /* GATO: dorso ~0,28 m, orelhas ~0,46 m, comprimento ~0,5 m + rabo erguido */
  loft(0,[0,.22,0],10,[{c:[0,.235,-.22],a:.035,b:.04,v:0},{c:[0,.23,-.19],a:.07,b:.075,v:.1},{c:[0,.225,-.08],a:.08,b:.085,v:.35},{c:[0,.215,.06],a:.075,b:.085,v:.65},{c:[0,.235,.16],a:.065,b:.075,v:.88},{c:[0,.27,.2],a:.045,b:.05,v:1}],P3RG.body,sw('fur'),null);
  const hp=[0,.28,.18];
  loft(1,hp,10,[{c:[0,.27,.17],a:.05,b:.05,v:0},{c:[0,.31,.21],a:.075,b:.07,v:.2},{c:[0,.33,.26],a:.085,b:.078,v:.45},{c:[0,.318,.31],a:.068,b:.062,v:.7},{c:[0,.3,.34],a:.04,b:.036,v:.9},{c:[0,.298,.355],a:.022,b:.02,v:1}],P3RG.head,null,sw('nose'));
  for(const mx of[1,-1]){/* orelhas pontudas */loft(1,hp,4,[{c:[.045,.375,.25],a:.032,b:.014,v:0},{c:[.052,.42,.25],a:.017,b:.008,v:.6},{c:[.056,.46,.25],a:.004,b:.003,v:1}],P3RG.leg,sw('ear'),sw('fur'),mx)}
  loft(2,[0,.245,-.21],6,[{c:[0,.245,-.21],a:.022,b:.022,v:0},{c:[0,.3,-.3],a:.02,b:.02,v:.3},{c:[0,.39,-.35],a:.018,b:.018,v:.55},{c:[0,.47,-.34],a:.015,b:.015,v:.8},{c:[0,.52,-.3],a:.008,b:.008,v:1}],P3RG.tail,null,sw('fur'));
  for(const mx of[1,-1]){for(const fr of[1,0]){const z=fr?.12:-.14,y0=.21,part=fr?(mx>0?3:4):(mx>0?5:6),piv=[.05,y0,z];
   loft(part,piv,6,[{c:[.05,y0+.01,z],a:.034,b:.036,v:0},{c:[.05,.12,z-(fr?0:.015)],a:.026,b:.028,v:.45},{c:[.05,.03,z],a:.022,b:.024,v:.85},{c:[.05,.012,z+.012],a:.026,b:.032,v:.92},{c:[.05,0,z+.012],a:.024,b:.03,v:1}],P3RG.leg,null,sw('light'),mx);
   ball(part,piv,[.05,y0,z],.033,P3RG.leg,.05,mx)}}}
 const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(P,3));ge.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 ge.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));ge.setAttribute('part',new THREE.Float32BufferAttribute(K,1));ge.setAttribute('piv',new THREE.Float32BufferAttribute(V,3));/* v4 r27: desvira o triângulo cuja face não bate com a normal (2/3 estavam do avesso → bicho "transparente") */
 for(let t=0;t<I.length;t+=3){const a=I[t]*3,b=I[t+1]*3,c=I[t+2]*3,ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
  if((uy*vz-uz*vy)*(N[a]+N[b]+N[c])+(uz*vx-ux*vz)*(N[a+1]+N[b+1]+N[c+1])+(ux*vy-uy*vx)*(N[a+2]+N[b+2]+N[c+2])<0){const k=I[t+1];I[t+1]=I[t+2];I[t+2]=k}}
 ge.setIndex(I);
 ge.computeBoundingSphere();ge.boundingSphere.radius+=.4;ge.userData.cached=true;PET3.geo[kind]=ge;return ge}
/* ---------- shader: pose contínua ---------- */
const P3_VS=`
attribute float part;attribute vec3 piv;
uniform float uPhase,uAmt,uRun,uSit,uWag,uT,uCat,uSitA,uDrop,uLook;uniform vec3 uHip,uLight,uSunDir;
varying vec2 vUv;varying vec3 vLight,vVN,vVP;
#include <fog_pars_vertex>
vec3 rx(vec3 v,vec3 p,float a){v-=p;float c=cos(a),s=sin(a);return p+vec3(v.x,c*v.y-s*v.z,s*v.y+c*v.z);}
vec3 rxn(vec3 n,float a){float c=cos(a),s=sin(a);return vec3(n.x,c*n.y-s*n.z,s*n.y+c*n.z);}
vec3 ryp(vec3 v,vec3 p,float a){v-=p;float c=cos(a),s=sin(a);return p+vec3(c*v.x+s*v.z,v.y,-s*v.x+c*v.z);}
vec3 ryn(vec3 n,float a){float c=cos(a),s=sin(a);return vec3(c*n.x+s*n.z,n.y,-s*n.x+c*n.z);}
void main(){
 vec3 p=position,n=normal;float A=uAmt,Rn=uRun,ph=uPhase;
 if(part>2.5){
  /* trote (diagonais juntas) andando; galope (pares da frente e de trás) correndo */
  float oT=(part==3.||part==6.)?0.:3.14159;float oG=part==3.?0.:part==4.?.7:part==5.?3.3:4.;
  float th=A*(.42+.3*Rn)*sin(ph+mix(oT,oG,Rn));
  bool rear=part>4.5;
  th=mix(th,rear?-1.32:uSitA,uSit);
  p=rx(p,piv,th);n=rxn(n,th);}
 if(part==2.){float w=uWag*sin(uT*(uCat>.5?2.2:11.))*(uCat>.5?.32:.55);p=ryp(p,piv,w);n=ryn(n,w);
  float lift=uCat>.5?(.06*sin(uT*1.1)-.12*uSit):(.25*uWag-.15*Rn*A);p=rx(p,piv,-lift);n=rxn(n,-lift);}
 if(part==1.){float nod=A*.05*sin(ph*2.)+uSit*.25;p=rx(p,piv,nod);n=rxn(n,nod);float lk=uLook*(1.-A)*.45*sin(uT*.37+uCat*2.);p=ryp(p,piv,lk);n=ryn(n,lk);}
 /* galope: o corpo arfa um pouco */
 float pitch=Rn*A*.07*sin(ph);if(part<2.5){p=rx(p,vec3(0.,piv.y,0.),pitch);}
 /* sentado: tudo menos as patas de trás gira em volta do quadril (frente sobe) e o quadril desce */
 if(!(part>4.5)){float sa=-uSitA*uSit;p=rx(p,uHip,sa);n=rxn(n,sa);}
 p.y-=uDrop*uSit;
 p.y+=A*(.012+.02*Rn)*abs(cos(ph));
 vec4 wp=modelMatrix*vec4(p,1.);vec3 wn=normalize(mat3(modelMatrix)*n);
 float d=max(dot(wn,uSunDir),0.);vLight=uLight*(.74+.42*d);
 vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
 vUv=uv;vVN=mat3(viewMatrix)*wn;vVP=mvPosition.xyz;
 #include <fog_vertex>
}`;
const P3_FS=`
uniform sampler2D map;uniform float uAlpha,uBlink,uGrade;varying vec2 vUv;varying vec3 vLight,vVN,vVP;
#include <fog_pars_fragment>
void main(){vec2 uvv=vUv;
 /* piscar: a faixa dos olhos (y 15–18 do quadro da cabeça) vira pelo */
 if(uBlink>.5){vec2 q=vec2(vUv.x*${PET3.TW}.,(1.-vUv.y)*${PET3.TH}.);if(q.x>70.&&q.x<90.&&q.y>15.&&q.y<19.)uvv=vec2(80.5/${PET3.TW}.,1.-9.5/${PET3.TH}.);}
 vec3 c=texture2D(map,uvv).rgb*vLight;
 if(uGrade>.5){float rim=1.-abs(dot(normalize(vVN),normalize(-vVP)));c=mix(c,c*.6+vec3(.02,.014,.03),.5*smoothstep(.8,.97,rim));}
 c=floor(c*63.+.5)/63.;gl_FragColor=vec4(c,uAlpha);
 #include <fog_fragment>
}`;
function p3Material(kind,ci){if(!PET3.base)PET3.base=new THREE.ShaderMaterial({vertexShader:P3_VS,fragmentShader:P3_FS,fog:true,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:null},uPhase:{value:0},uAmt:{value:0},uRun:{value:0},uSit:{value:0},uWag:{value:0},uT:{value:0},uCat:{value:0},uSitA:{value:.6},uDrop:{value:0},uLook:{value:1},uHip:{value:new THREE.Vector3()},uBlink:{value:0},uGrade:{value:1},uAlpha:{value:1},uLight:{value:new THREE.Color(1,1,1)},uSunDir:{value:new THREE.Vector3(0,1,0)}}])});
 const m=PET3.base.clone(),K=PET3.K[kind],U=m.uniforms;U.map.value=p3Paint(kind,ci);U.uCat.value=kind==='cat'?1:0;U.uSitA.value=K.sit;U.uDrop.value=K.drop;U.uHip.value.set(K.hip[0],K.hip[1],K.hip[2]);
 U.uSunDir.value=typeof C3!=='undefined'?C3.sunDir:new THREE.Vector3(0,1,0);return m}
/* ---------- estado por bicho ---------- */
const _p3m=new THREE.Matrix4(),_p3a=new THREE.Matrix4(),_p3q=new THREE.Quaternion(),_p3e=new THREE.Euler(),_p3v=new THREE.Vector3(),_p3s=new THREE.Vector3();
function p3Mode(){return S.char3d===true?'3d':S.sprite8===true?'25d':'2d'}
function p3State(sp,kind,ci){let st=sp.userData.p3;if(!st||st.kind!==kind||st.ci!==ci){if(st)pet3Drop(sp);st={kind,ci,mesh:null,mat:null,px:null,orig:sp.material.map,ph:Math.random()*6,amt:0,run:0,sit:0,spd:0,lx:null,lz:null,ang:null,t:performance.now(),bk:Math.random()*4,wag:0};sp.userData.p3=st;PET3.list.add(st)}return st}
function p3Mesh(sp,st){if(st.mesh)return;const mat=p3Material(st.kind,st.ci),mesh=new THREE.Mesh(p3Geo(st.kind),mat);mesh.matrixAutoUpdate=false;mesh.layers.set(1);mesh.castShadow=mesh.receiveShadow=false;mesh.raycast=()=>{};mesh.name='pet3d';
 mesh.onBeforeRender=(r,sc,cam)=>{const local=sp.userData.actorLocal;if(cam===camera){sp.userData.actorLastDraw=simT;if(local){try{actorLighting(sp,local)}catch(e){}}}
  const L=mat.uniforms.uLight.value;if(local)L.copy(local.value);else L.copy(ACTOR_LIGHT.value);if(sp.userData.actorTint)L.multiply(sp.userData.actorTint)};
 st.mesh=mesh;st.mat=mat;sp.add(mesh)}
function p3MeshDrop(sp,st){if(!st.mesh)return;if(st.mesh.parent)st.mesh.parent.remove(st.mesh);st.mat.dispose();st.mesh=st.mat=null;sp.material.visible=true}
function p3SpriteRestore(sp,st){if(st.px){if(sp.material.map!==st.orig){sp.material.map=st.orig;sp.material.needsUpdate=true}if(sp.userData.texProxy===st.px)delete sp.userData.texProxy;st.px=null}}
/* libera antes de descartar o sprite (devolve a textura 2D original: quem descarta dá dispose nela, nunca no atlas compartilhado) */
function pet3Drop(sp){const st=sp&&sp.userData.p3;if(!st)return;p3MeshDrop(sp,st);p3SpriteRestore(sp,st);PET3.list.delete(st);delete sp.userData.p3}
/* ---------- 2.5D: atlas fotografado da malha 3D (8 ângulos × [parado, passo A, passo B, sentado]) ---------- */
function p3Atlas(kind,ci){const k=kind+ci;if(PET3.atlas[k])return PET3.atlas[k];
 if(PET3.built===(renderer.info.render.frame|0))return null; /* no máximo um atlas novo por quadro */
 PET3.built=renderer.info.render.frame|0;
 const RES=2,FW=32*RES,FH=24*RES,Nd=8,sw=kind==='dog'?1.25:.95,sh=sw*.75,rt=char3DStage(FW,FH),tilt=.17;
 const cam=new THREE.OrthographicCamera(-sw/2,sw/2,sh/2,-sh/2,-10,10);cam.position.set(0,sh/2+5*Math.sin(tilt),5*Math.cos(tilt));cam.lookAt(0,sh/2,0);
 const mat=p3Material(kind,ci),U=mat.uniforms;U.uSunDir.value=new THREE.Vector3(-1,1.5,1.3).normalize();U.uLight.value.setRGB(1,1,1);U.uLook.value=0;U.uWag.value=0;U.uT.value=0;
 const mesh=new THREE.Mesh(p3Geo(kind),mat),out=cv(4*FW,Nd*FH),oc=out.getContext('2d');ATLAS8.scene.add(mesh);
 try{char3DWith(()=>{for(let r=0;r<Nd;r++){mesh.rotation.y=Math.PI-r*Math.PI*2/Nd;mesh.updateMatrixWorld(true);
   for(let f=0;f<4;f++){U.uSit.value=f===3?1:0;U.uAmt.value=f===1||f===2?1:0;U.uRun.value=0;U.uPhase.value=f===1?Math.PI/2:f===2?Math.PI*1.5:0;
    oc.drawImage(char3DShoot(cam,rt,FW,FH,RES,false),f*FW,r*FH)}}})}
 finally{ATLAS8.scene.remove(mesh);mat.dispose()}
 const t=new THREE.CanvasTexture(out);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(1/4,1/Nd);t.petAtlas=true;
 try{renderer.initTexture(t)}catch(e){}PET3.atlas[k]=t;return t}
/* ---------- chamado a cada quadro por animalsTick/petsTick (js/18), depois do sprite posicionado ----------
   y0 = altura dos pés no mundo (chão, ou tampa da lixeira); o sprite pode estar mais alto na vista de cima. */
function pet3(sp,kind,ci,x,z,mx,mz,stc,wag,y0){if(!sp||!sp.isSprite)return;ci=ci|0;const mode=p3Mode();
 if(mode==='2d'){const st=sp.userData.p3;if(st){p3MeshDrop(sp,st);p3SpriteRestore(sp,st)}return}
 const st=p3State(sp,kind,ci),now=performance.now(),dt=Math.min(.1,Math.max(0,(now-st.t)/1000));st.t=now;
 let spd=0;if(st.lx!==null&&dt>0){const dx=x-st.lx,dz=z-st.lz,d=Math.hypot(dx,dz);if(d<3)spd=d/dt}st.lx=x;st.lz=z;
 const k=1-Math.exp(-dt*7),still=stc!==0;st.spd+=((still?0:Math.min(spd,9))-st.spd)*k;
 const amtT=Math.min(1,st.spd/.5),runT=Math.max(0,Math.min(1,(st.spd-2.2)/1.8));st.amt+=(amtT-st.amt)*k;st.run+=(runT-st.run)*k;
 st.sit+=((stc===1?1:0)-st.sit)*(1-Math.exp(-dt*6));st.wag+=((wag||0)-st.wag)*(1-Math.exp(-dt*4));
 const K=PET3.K[kind],th=Math.max(.05,st.amt*(.42+.3*st.run)),stride=Math.PI*2*K.leg*1.1*th;if(st.amt>.02)st.ph+=st.spd*dt/stride*Math.PI*2;
 if(Math.hypot(mx||0,mz||0)>1e-3){const ta=Math.atan2(mx,mz);st.ang=st.ang===null?ta:st.ang+Math.atan2(Math.sin(ta-st.ang),Math.cos(ta-st.ang))*(1-Math.exp(-dt*10))}if(st.ang===null)st.ang=0;
 const top=camMode==='top'&&!VIEW.orbit,sc=top?1.5:1;
 if(mode==='3d'){p3SpriteRestore(sp,st);p3Mesh(sp,st);sp.material.visible=false;st.mesh.visible=true;
  const U=st.mat.uniforms,dead=stc===2;U.uPhase.value=st.ph;U.uAmt.value=dead?0:st.amt;U.uRun.value=st.run;U.uSit.value=dead?0:st.sit;U.uWag.value=dead?0:st.wag;U.uT.value=simT+st.ph;U.uLook.value=dead||stc===1&&kind==='cat'?0:1;
  U.uGrade.value=typeof CHAR_GRADE!=='undefined'&&CHAR_GRADE.on?1:0;
  st.bk-=dt;if(st.bk<-.14)st.bk=2+Math.random()*4;U.uBlink.value=dead||st.bk<0?1:0;
  {const op=sp.material.opacity;U.uAlpha.value=op<.995?op:1;st.mat.transparent=op<.995}
  /* matriz local = escala inversa do sprite · desce até os pés · gira · deita de lado (morto) */
  _p3e.set(0,st.ang,dead?Math.PI/2:0,'YXZ');_p3q.setFromEuler(_p3e);_p3v.set(0,(y0==null?0:y0-sp.position.y)+(dead?(kind==='dog'?.15:.085)*sc:0),0);
  if(dead){const hy=(kind==='dog'?.46:.22)*sc;_p3v.x+=Math.cos(st.ang)*hy;_p3v.z-=Math.sin(st.ang)*hy}
  _p3s.set(sc,sc,sc);_p3a.compose(_p3v,_p3q,_p3s);const s=sp.scale;_p3m.makeScale(1/(s.x||1),1/(s.y||1),1/(s.z||1));st.mesh.matrix.multiplyMatrices(_p3m,_p3a);st.mesh.matrixWorldNeedsUpdate=true;return}
 /* 2.5D */
 p3MeshDrop(sp,st);const at=p3Atlas(kind,ci);if(!at){p3SpriteRestore(sp,st);return}
 if(!st.px)st.px={offset:new THREE.Vector2(),repeat:new THREE.Vector2(1/4,1/8),shared:at};
 if(sp.material.map!==at){sp.material.map=at;sp.material.needsUpdate=true}sp.userData.texProxy=st.px;
 pickDir(Math.sin(st.ang),Math.cos(st.ang),x,z);PICK8.fresh=false;const r=((Math.round(PICK8.a/(Math.PI/4))%8)+8)%8;
 const fr=stc===2?0:st.sit>.5?3:st.amt>.25?1+(Math.floor(st.ph/Math.PI)&1):0;st.px.offset.set(fr/4,1-(r+1)/8)}
/* troca de modo no menu: nada a fazer (pet3 resolve no próximo quadro); diagnóstico */
function pet3Debug(){const out={mode:p3Mode(),bichos:PET3.list.size,malhas:0,triangulos:{},atlas:Object.keys(PET3.atlas)};for(const st of PET3.list)if(st.mesh)out.malhas++;for(const k in PET3.geo)out.triangulos[k]=PET3.geo[k].index.count/3;return out}
