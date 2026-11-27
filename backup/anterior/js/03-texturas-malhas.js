'use strict';
/* Coastal Chaos · js/03-texturas-malhas.js — Texturas, construtor de malhas (MB), grade de colisão, anti z-fight (ZF).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= TEXTURES ================= */
function glowTexture(){const c=cv(64,64),g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
function blobTexture(){const c=cv(64,64),g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.6,'rgba(0,0,0,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
const glowTex=glowTexture(), blobTex=blobTexture();
function asphaltTexture(base){const rnd=mulberry32((S.seed^0x4189baf3)>>>0),texPick=a=>a[Math.floor(rnd()*a.length)];const c=cv(256,256),g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,256);
 for(let i=0;i<5000;i++){const v=rnd();g.fillStyle=v<.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.06)';g.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1+rnd()*2)}
 for(let i=0;i<6;i++){g.fillStyle='rgba(0,0,0,.08)';g.beginPath();g.ellipse(rnd()*256,rnd()*256,10+rnd()*30,6+rnd()*16,rnd()*3,0,7);g.fill()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
// Four 128px cells in one shared 256px atlas: neutral, grass, pavement and roof tiles.
function surfaceAtlasTexture(){const N=128,c=cv(N*2,N*2),g=c.getContext('2d'),im=g.createImageData(N*2,N*2),a=im.data,r=mulberry32((S.seed^0x57a1b39d)>>>0);
 for(let y=0;y<N*2;y++)for(let x=0;x<N*2;x++){const k=Math.floor(x/N)+2*Math.floor(y/N),i=(y*N*2+x)*4;let v=255;if(k){v=(k===1?244:k===2?242:240)+(r()-.5)*(k===1?23:15);if(k===1&&r()<.09)v-=25+r()*40}a[i]=v;a[i+1]=k===1?Math.min(255,v+3):v;a[i+2]=v;a[i+3]=255}g.putImageData(im,0,0);
 // Concrete joints every 2m, with a subdued light edge and fine grain between them.
 g.save();g.beginPath();g.rect(0,N,N,N);g.clip();for(let k=0;k<=2;k++){const t=k*N/2;g.fillStyle='#b3b3b3';g.fillRect(t,N,1,N);g.fillRect(0,N+t,N,1);g.fillStyle='#fafafa';g.fillRect(t+1,N,1,N);g.fillRect(0,N+t+1,N,1)}g.restore();
 // Staggered tile rows: wide horizontal lips and short offset seams.
 g.save();g.beginPath();g.rect(N,N,N,N);g.clip();for(let row=0;row<4;row++){const y=N+row*32;g.fillStyle='#b6b6b6';g.fillRect(N,y,N,2);g.fillStyle='#fcfcfc';g.fillRect(N,y+2,N,1);const off=row%2?16:0;for(let x=-32+off;x<N;x+=32){g.fillStyle='#cdcdcd';g.fillRect(N+x,y+3,1,29);g.fillStyle='#f5f5f5';g.fillRect(N+x+1,y+3,1,29)}}g.restore();
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=2;return t}
function surfaceAtlasShader(sh){sh.vertexShader='attribute float surfaceKind;varying float vSurfaceKind;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vSurfaceKind=surfaceKind;');sh.fragmentShader='varying float vSurfaceKind;\n'+sh.fragmentShader.replace('#include <map_fragment>',`
 #ifdef USE_MAP
 float tile=floor(vSurfaceKind+.5);vec2 cell=vec2(mod(tile,2.),1.-floor(tile/2.));
 vec2 atlasUV=(cell+(fract(vUv)*127.+.5)/128.)*.5;
 vec4 surfaceTexel=mapTexelToLinear(texture2D(map,atlasUV));diffuseColor*=surfaceTexel;
 #endif
 `)}
function prepareSurfaceMesh(mesh,mode,st){if(!mesh)return mesh;const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color,u=g.attributes.uv,kinds=new Float32Array(p.count),grass=COL(st.grass),pave=COL(st.side);
 const err=(i,col)=>{const r=c.getX(i)-col.r,g=c.getY(i)-col.g,b=c.getZ(i)-col.b;return(r*r+g*g+b*b)/Math.max(.0001,col.r*col.r+col.g*col.g+col.b*col.b)};
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);let kind=0,ux=x/2,vy=z/2;
  if(mode==='ground'){const eg=err(i,grass),ep=err(i,pave);const green=c.getY(i)>c.getX(i)*1.08&&c.getY(i)>c.getZ(i)*.87;kind=green&&eg<.14&&eg<ep?1:ep<.16?2:0;if(kind===2){ux=x/4;vy=z/4;if(Math.abs(ny)<.4){ux=(Math.abs(nx)>.5?z:x)/4;vy=y/4}}}
  else if(mode==='flatRoof'){kind=2;ux=x/4;vy=z/4}
  else if(Math.abs(ny)>.15){kind=3;const L=Math.hypot(nx,nz);if(L>.001){ux=(x*nz/L-z*nx/L)/2.4;vy=(-x*ny*nx/L+y*L-z*ny*nz/L)/1.2}else{ux=x/2.4;vy=z/1.2}}
  kinds[i]=kind;u.setXY(i,ux,vy)
 }g.setAttribute('surfaceKind',new THREE.BufferAttribute(kinds,1));return mesh}
function buildIndustrialGate(F,u0,u1,ch){
 const a=F.pt(u0,0),b=F.pt(u1,0),len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;
 const root=new THREE.Group(),pivot=new THREE.Group();root.position.set(a[0],1.15,a[1]);root.rotation.y=-Math.atan2(dz,dx);root.add(pivot);
 const mb=new MB();for(let i=0;i<12;i++)mb.box(i*len/12,-.10,-.065,(i+1)*len/12,.10,.065,COL(i%2?'#f4f4f0':'#d02020'));
 pivot.add(mb.mesh(city.M.solid,true,true));ch.group.add(root);
 const col=addCol(Math.min(a[0],b[0])-.08,Math.min(a[1],b[1])-.08,Math.max(a[0],b[0])+.08,Math.max(a[1],b[1])+.08,'rock');
 if(!ch.industryGates)ch.industryGates=[];ch.industryGates.push({pivot,col,x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,dx,dz,len,angle:0,hold:0});
}
function industrialGateProximity(g,p){
 // Apenas 14 m reais do centro da cancela, sem antecipar a abertura pela velocidade.
 const dx=p.x-g.x,dz=p.z-g.z;
 return dx*dx+dz*dz<=14*14;
}
function updateIndustrialGates(dt){
 const p=PL.car||PL;
 for(const ch of city.chunks.values()){if(!ch.industryGates)continue;for(const g of ch.industryGates){
  const near=!PL.inside&&!PL.dead&&industrialGateProximity(g,p);
  if(near)g.hold=2.5;else g.hold=Math.max(0,g.hold-dt);
  // Keep the opening clear until both the player and other vehicles have passed through it.
  let occupied=!PL.inside&&Math.hypot(p.x-g.x,p.z-g.z)<g.len/2+2;if(!occupied){const gr=g.len/2+2,nc=carsNearTmp(g.x,g.z,gr);for(let i=0;i<nc.length;i++){const c=nc[i];if(c.alive&&Math.hypot(c.x-g.x,c.z-g.z)<gr){occupied=true;break}}}
  const open=near||g.hold>0||g.angle>.10&&occupied,target=open?Math.PI*.48:0,step=dt*(open?.8:.35);
  if(g.angle!==target){g.angle+=clamp(target-g.angle,-step,step);g.pivot.rotation.z=g.angle}g.col.dead=open||g.angle>.12;
 }}
}
function facadePlan(seed,x,z,h,simple,safe){
 const rng=mulberry32(((Math.round(x*13)*73856093)^(Math.round(z*13)*19349663)^(seed*31+7))>>>0),v=rng();
 return{abandoned:!safe&&!simple&&v<.09,family:v<.28?'residential':v<.57?'deco':'office',worn:v>.57&&v<.74,accent:Math.floor(rng()*6),floors:Math.max(1,Math.floor(h/3.2))};
}
function facadeBays(start,length){const n=Math.max(1,Math.floor(length/3.5)),step=length/n;return Array.from({length:n},(_,i)=>({u:start+(i+.5)*step,step,index:i}))}
function abandonedWindowTexture(){
 const c=cv(256,256),g=c.getContext('2d'),r=mulberry32(73851);g.fillStyle='#e8e3d8';g.fillRect(0,0,256,256);
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const x=col*32+5,y=row*32+7,w=22,h=18,boarded=r()<.48;
  g.fillStyle='#aaa296';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle='#1b2228';g.fillRect(x,y,w,h);g.fillStyle='#4b5356';g.fillRect(x+1,y+1,w-2,3);
  if(boarded){for(let k=0;k<3;k++){g.fillStyle=k%2?'#8c7051':'#a0845b';g.fillRect(x,y+1+k*6,w,5);g.fillStyle='#5a4939';g.fillRect(x,y+5+k*6,w,1);g.fillStyle='#302a25';g.fillRect(x+2,y+3+k*6,1,1);g.fillRect(x+w-3,y+3+k*6,1,1)}}
  else{g.strokeStyle='#7b817d';g.lineWidth=1;g.beginPath();g.moveTo(x+w*.5,y);g.lineTo(x+w*.5,y+h);g.stroke();if(r()<.7){g.fillStyle='#0c1115';g.beginPath();g.moveTo(x+3,y+3);g.lineTo(x+11,y+8);g.lineTo(x+6,y+16);g.lineTo(x+2,y+12);g.fill()}}
  g.fillStyle='rgba(65,57,45,.25)';g.fillRect(x,y+h+2,w,2);g.fillRect(x+w-3,y+h+2,2,4);
 }
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function windowTextures(night){const rnd=mulberry32((S.seed^0x643c19b7)>>>0),texPick=a=>a[Math.floor(rnd()*a.length)];
 const c=cv(256,256),g=c.getContext('2d'); const e=cv(256,256),ge=e.getContext('2d');
 g.fillStyle='#fff';g.fillRect(0,0,256,256); ge.fillStyle='#000';ge.fillRect(0,0,256,256);
 for(let i=0;i<1500;i++){g.fillStyle=`rgba(0,0,0,${rnd()*.06})`;g.fillRect(rnd()*256,rnd()*256,2,2)}
 const lit=['#ff4fd8','#41e1ff','#ffb347','#ffd9a0','#9d7bff','#ffe9c4'];
 for(let cx=0;cx<8;cx++)for(let cy=0;cy<8;cy++){
  const x=cx*32+5,y=cy*32+7,w=22,h=18;
  if(!night){g.fillStyle='#d9d6cf';g.fillRect(x-2,y-2,w+4,h+4);
   const gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'#3a4655');gr.addColorStop(.55,'#55687a');gr.addColorStop(1,'#2a333e');
   g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+2,y+2,4,h-4);
   if(rnd()<.3){g.fillStyle='#c9c4b8';g.fillRect(x,y,w,h*rnd()*.7)}
   g.fillStyle='#8f8b84';g.fillRect(x+w/2-1,y,2,h);
   if(rnd()<.62)winLitCell(ge,x,y,w,h,rnd,texPick); /* v4 r53: estilos variados; o shader (bldLitPatch) apaga/tinge por prédio */
  }else{
   g.fillStyle='rgba(0,0,0,.18)';g.fillRect(cx*32,cy*32+30,32,2);
   {const wx=cx*32+8,wy=cy*32+9,ww=16,wh=12;g.fillStyle='#0c0a14';g.fillRect(wx-1,wy-1,ww+2,wh+2);g.fillStyle='#16121f';g.fillRect(wx,wy,ww,wh);
    if(rnd()<.15){const col=rnd()<.75?texPick(['#ffd9a0','#ffc38a','#ffe7c4']):texPick(['#ff8fd0','#8ff0ff']);const a=.45+rnd()*.4;
     ge.globalAlpha=a;ge.fillStyle=col;ge.fillRect(wx,wy,ww,wh);ge.globalAlpha=1;g.fillStyle=col;g.globalAlpha=.5;g.fillRect(wx,wy,ww,wh);g.globalAlpha=1;
     if(rnd()<.4){g.fillStyle='#2a1f2a';g.fillRect(wx,wy,ww,wh*.45)}}}
  }}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;
 const te=new THREE.CanvasTexture(e);te.wrapS=te.wrapT=THREE.RepeatWrapping;
 return {map:t,emissive:te};
}

/* ================= MESH BUILDER ================= */
/* v77: lotes especiais (marcos) têm o piso no nível do asfalto (y=0), mas boa parte do
   detalhamento foi desenhada sobre a antiga laje de .26 m. Enquanto MB_DROP está ativo,
   qualquer primitiva dentro do retângulo cujo pé está entre .15 e 3.2 m desce MB_DROP.off;
   peças altas (topo > 3.2 m) só estendem a base para baixo, mantendo o topo. */
let MB_DROP=null,MB_DROP_IN=0;const _mbBB=new THREE.Box3();
function mbDropIn(x,z){const d=MB_DROP;return !!d&&!MB_DROP_IN&&x>=d.x0&&x<=d.x1&&z>=d.z0&&z<=d.z1}
function mbDropY(x,z,y0,y1){if(!mbDropIn(x,z)||!(y0>=.15&&y0<=3.2))return null;const o=MB_DROP.off;return[Math.max(0,y0-o),y1<=3.2?Math.max(.006,y1-o):y1]}
/* v78: anti z-fight na montagem. Com ZF.on (interiores e chunks), cada face alinhada a um eixo é registrada por plano (eixo, sentido,
   coordenada em passos de 5 mm) numa grade de 4 m. Se uma face nova cai no MESMO plano e sobrepõe uma já registrada,
   (mesmo de cor igual: materiais diferentes também piscam; e também se a outra face aponta para o lado oposto — material DoubleSide) ela é empurrada 4 mm no sentido da própria normal (no sentido da normal) — a peça de detalhe (adicionada depois) ganha sempre, sem piscar. */
const ZF={on:false,map:new Map(),big:new Map(),moved:0,box:0};
function zfBegin(){ZF.on=true;ZF.map.clear();ZF.big.clear()}
function zfEnd(){ZF.on=false;ZF.map.clear();ZF.big.clear()}
function zfWrap(f){return function(){const was=ZF.on;if(!was)zfBegin();try{return f.apply(this,arguments)}finally{if(!was)zfEnd()}}}
function zfFix(ax,sg,c,u0,u1,w0,w1,col,solid){let dir=solid?-sg:sg;const ar=(u1-u0)*(w1-w0); /* face de sólido fechado (caixa, cilindro) RECUA 4 mm para dentro — empurrar para fora abriria uma fresta no contorno; quad solto (decalque, piso, parede fina) avança 4 mm; superfície grande que chega depois de um detalhe no mesmo plano também recua */ // devolve o deslocamento (m) a aplicar na face
 if(u1-u0<.004||w1-w0<.004)return 0;const ci0=Math.floor(u0/4),ci1=Math.floor(u1/4),cj0=Math.floor(w0/4),cj1=Math.floor(w1/4),big=(ci1-ci0+1)*(cj1-cj0+1)>36;
 let off=0;for(let it=0;it<4;it++){const cc=c+off,k=Math.round(cc/.005);let hit=false;
  for(let dd=0;dd<6;dd++){const dk=dd%3-1,pk=ax+((dd<3)===(sg>0)?'+':'-')+(k+dk); /* os dois sentidos: material DoubleSide também pisca com faces opostas */const test=e=>Math.abs(e.c-cc)<.003&&e.u1-u0>.004&&u1-e.u0>.004&&e.w1-w0>.004&&w1-e.w0>.004;
   const chk=e=>{if(test(e))hit=true;if(it===0&&e.sg===sg&&Math.abs(e.c-cc)<.0085&&e.u1-u0>.004&&u1-e.u0>.004&&e.w1-w0>.004&&w1-e.w0>.004&&ar>4*(e.u1-e.u0)*(e.w1-e.w0)){dir=-sg;hit=true}};const B=ZF.big.get(pk);if(B)for(const e of B)chk(e);
   if(big){const A=ZF.map.get(pk+'*');if(A)for(const e of A)chk(e)}
   else for(let i=ci0;i<=ci1;i++)for(let j=cj0;j<=cj1;j++){const A=ZF.map.get(pk+'|'+i+'|'+j);if(A)for(const e of A)chk(e)}
  }
  if(!hit)break;off+=dir*.004}
 const cc=c+off,pk=ax+(sg>0?'+':'-')+Math.round(cc/.005),e={c:cc,u0,u1,w0,w1,sg};
 if(big){let B=ZF.big.get(pk);if(!B)ZF.big.set(pk,B=[]);B.push(e)}else{for(let i=ci0;i<=ci1;i++)for(let j=cj0;j<=cj1;j++){const kk=pk+'|'+i+'|'+j;let A=ZF.map.get(kk);if(!A)ZF.map.set(kk,A=[]);A.push(e)}}
 let A=ZF.map.get(pk+'*');if(!A)ZF.map.set(pk+'*',A=[]);A.push(e);if(off)ZF.moved++;return off}
function zfQuery(ax,sg,cc,u0,u1,w0,w1,tol){tol=tol||.003; // conflitos no plano: {hit, mx (maior área no mesmo sentido), opp}
 const r={hit:false,mx:0,opp:false};if(u1-u0<.004||w1-w0<.004)return r;const ci0=Math.floor(u0/4),ci1=Math.floor(u1/4),cj0=Math.floor(w0/4),cj1=Math.floor(w1/4),big=(ci1-ci0+1)*(cj1-cj0+1)>36,k=Math.round(cc/.005),K=tol>.004?2:1;
 for(let dd=0;dd<2*(2*K+1);dd++){const dk=dd%(2*K+1)-K,ps=(dd<2*K+1)===(sg>0),pk=ax+(ps?'+':'-')+(k+dk);
  const chk=e=>{if(Math.abs(e.c-cc)<tol&&e.u1-u0>.004&&u1-e.u0>.004&&e.w1-w0>.004&&w1-e.w0>.004){r.hit=true;if(e.sg===sg)r.mx=Math.max(r.mx,(e.u1-e.u0)*(e.w1-e.w0));else r.opp=true}};
  const B=ZF.big.get(pk);if(B)for(const e of B)chk(e);
  if(big){const A=ZF.map.get(pk+'*');if(A)for(const e of A)chk(e)}else for(let i=ci0;i<=ci1;i++)for(let j=cj0;j<=cj1;j++){const A=ZF.map.get(pk+'|'+i+'|'+j);if(A)for(const e of A)chk(e)}}
 return r}
/* caixa inteira: antes de gerar as faces, cada face que cair num plano ocupado faz a caixa CRESCER 4 mm daquele lado (o detalhe aparece)
   ou ENCOLHER 4 mm (face bem maior que a já existente no mesmo sentido — parede que chega depois do detalhe). As laterais
   acompanham, então não abre fresta. */
function zfBoxAdj(v){const lo=[Math.min(v[0],v[3]),Math.min(v[1],v[4]),Math.min(v[2],v[5])],hi=[Math.max(v[0],v[3]),Math.max(v[1],v[4]),Math.max(v[2],v[5])];let ch=false;
 for(let ax=0;ax<3;ax++){const u=(ax+1)%3,w=(ax+2)%3;for(const sg of [-1,1]){const ar=(hi[u]-lo[u])*(hi[w]-lo[w]);let dir=0;
   for(let it=0;it<3;it++){const c=sg>0?hi[ax]:lo[ax],q=zfQuery(ax,sg,c,lo[u],hi[u],lo[w],hi[w]);if(!q.hit)break;
    if(!dir){const q2=zfQuery(ax,sg,c,lo[u],hi[u],lo[w],hi[w],.0085);dir=q2.mx&&ar>4*q2.mx?-1:1}const d=sg*dir*.004;if(sg>0)hi[ax]+=d;else lo[ax]+=d;ch=true;if(hi[ax]-lo[ax]<.002)break}}}
 if(!ch)return v;const o=v.slice();for(let a=0;a<3;a++){if(v[a]<=v[a+3]){o[a]=lo[a];o[a+3]=hi[a]}else{o[a]=hi[a];o[a+3]=lo[a]}}return o}
function zfGeo(P,p0,col){ // tampas planas de cilindros/esferas achatadas: agrupa triângulos por plano e empurra o grupo inteiro
 const G=new Map();for(let t=p0;t<P.length;t+=9){const ex=P[t+3]-P[t],ey=P[t+4]-P[t+1],ez=P[t+5]-P[t+2],fx=P[t+6]-P[t],fy=P[t+7]-P[t+1],fz=P[t+8]-P[t+2];
  let nx=ey*fz-ez*fy,ny=ez*fx-ex*fz,nz=ex*fy-ey*fx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)continue;nx/=l;ny/=l;nz/=l;
  const ax=Math.abs(nx)>.999?0:Math.abs(ny)>.999?1:Math.abs(nz)>.999?2:-1;if(ax<0)continue;const sg=Math.sign([nx,ny,nz][ax]),k=ax+(sg>0?'+':'-')+Math.round(P[t+ax]/.001);
  let e=G.get(k);if(!e)G.set(k,e={ax,sg,c:P[t+ax],t:[],u0:1e9,u1:-1e9,w0:1e9,w1:-1e9});e.t.push(t);const u=(ax+1)%3,w=(ax+2)%3;
  for(let q=0;q<3;q++){const U=P[t+q*3+u],W=P[t+q*3+w];if(U<e.u0)e.u0=U;if(U>e.u1)e.u1=U;if(W<e.w0)e.w0=W;if(W>e.w1)e.w1=W}}
 for(const e of G.values()){const off=zfFix(e.ax,e.sg,e.c,e.u0,e.u1,e.w0,e.w1,col,true);if(off)for(const t of e.t)for(let q=0;q<3;q++)P[t+q*3+e.ax]+=off}}
/* anti z-fight dos interiores (ibox=…, buildSafehouse=zfWrap(…), …): está em js/99-pos-carga.js — precisa rodar depois que todos os arquivos definiram essas funções */
function zfPost(P,p0,plain,idx,i0){ // anti z-fight depois de girar/mover: quads (2 triângulos no mesmo plano) ou triângulos soltos
 if(idx){
  const plI=k=>{const q0=idx[k]*3,q1=idx[k+1]*3,q2=idx[k+2]*3,ex=P[q1]-P[q0],ey=P[q1+1]-P[q0+1],ez=P[q1+2]-P[q0+2],fx=P[q2]-P[q0],fy=P[q2+1]-P[q0+1],fz=P[q2+2]-P[q0+2];let nx=ey*fz-ez*fy,ny=ez*fx-ex*fz,nz=ex*fy-ey*fx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return null;nx/=l;ny/=l;nz/=l;const ax=Math.abs(nx)>.999?0:Math.abs(ny)>.999?1:Math.abs(nz)>.999?2:-1;return ax<0?null:{ax,sg:Math.sign([nx,ny,nz][ax]),c:P[q0+ax]}};
  for(let k=i0||0;k+3<=idx.length;){const a=plI(k);let s=3;if(k+6<=idx.length){const b=plI(k+3);if(a&&b&&a.ax===b.ax&&a.sg===b.sg&&Math.abs(a.c-b.c)<1e-4)s=6}
   if(a){const u=(a.ax+1)%3,w=(a.ax+2)%3,vs=[];for(let j=0;j<s;j++){const v=idx[k+j];if(!vs.includes(v))vs.push(v)}let u0=1e9,u1=-1e9,w0=1e9,w1=-1e9;for(const v of vs){const U=P[v*3+u],W=P[v*3+w];if(U<u0)u0=U;if(U>u1)u1=U;if(W<w0)w0=W;if(W>w1)w1=W}
    const off=zfFix(a.ax,a.sg,a.c,u0,u1,w0,w1,null,!plain);if(off)for(const v of vs)P[v*3+a.ax]+=off}
   k+=s}
  return}
 const pl=t=>{const ex=P[t+3]-P[t],ey=P[t+4]-P[t+1],ez=P[t+5]-P[t+2],fx=P[t+6]-P[t],fy=P[t+7]-P[t+1],fz=P[t+8]-P[t+2];let nx=ey*fz-ez*fy,ny=ez*fx-ex*fz,nz=ex*fy-ey*fx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return null;nx/=l;ny/=l;nz/=l;
  const ax=Math.abs(nx)>.999?0:Math.abs(ny)>.999?1:Math.abs(nz)>.999?2:-1;return ax<0?null:{ax,sg:Math.sign([nx,ny,nz][ax]),c:P[t+ax]}};
 for(let t=p0;t+9<=P.length;){const a=pl(t);let n=9;if(t+18<=P.length){const b=pl(t+9);if(a&&b&&a.ax===b.ax&&a.sg===b.sg&&Math.abs(a.c-b.c)<1e-4)n=18}
  if(a){const u=(a.ax+1)%3,w=(a.ax+2)%3;let u0=1e9,u1=-1e9,w0=1e9,w1=-1e9;for(let q=t;q<t+n;q+=3){const U=P[q+u],W=P[q+w];if(U<u0)u0=U;if(U>u1)u1=U;if(W<w0)w0=W;if(W>w1)w1=W}
   const off=zfFix(a.ax,a.sg,a.c,u0,u1,w0,w1,null,!plain);if(off)for(let q=t;q<t+n;q+=3)P[q+a.ax]+=off}
  t+=n}}
/* dev r2.3: trava de consistência — p/n/c/u precisam ter o MESMO número de vértices. Código que grava por deslocamento fixo (ex.: 6 vértices por quad) desalinha tudo que vem depois no lote. Corta o excedente e avisa uma vez. */
let MB_WARN=0;function mbCheck(m){const n=m.p.length/3;if(m.n.length===n*3&&m.c.length===n*3&&m.u.length===n*2)return;if(MB_WARN++<3)console.warn('MB desalinhado',{p:n,n:m.n.length/3,c:m.c.length/3,u:m.u.length/2},new Error().stack);m.n.length=Math.min(m.n.length,n*3);m.c.length=Math.min(m.c.length,n*3);m.u.length=Math.min(m.u.length,n*2)}
class MB{constructor(indexed=true){this.p=[];this.n=[];this.u=[];this.c=[];this.idx=indexed===false?null:[];this.ab=0}
 quad(a,b,c,d,nx,ny,nz,uv,col){if(ZF.on&&col&&!this._nz){const ax=Math.abs(nx)>.999?0:Math.abs(ny)>.999?1:Math.abs(nz)>.999?2:-1;
   if(ax>=0){const u=(ax+1)%3,w=(ax+2)%3,sg=ax===0?Math.sign(nx):ax===1?Math.sign(ny):Math.sign(nz);
    const off=zfFix(ax,sg,a[ax],Math.min(a[u],b[u],c[u],d[u]),Math.max(a[u],b[u],c[u],d[u]),Math.min(a[w],b[w],c[w],d[w]),Math.max(a[w],b[w],c[w],d[w]),col,ZF.box>0);
    if(off){a=a.slice();b=b.slice();c=c.slice();d=d.slice();a[ax]+=off;b[ax]+=off;c[ax]+=off;d[ax]+=off}}}
  const P=this.p,[u0,v0,u1,v1]=uv;
  if(this.idx){const b0=P.length/3,cdSame=c[0]===d[0]&&c[1]===d[1]&&c[2]===d[2],bcSame=!cdSame&&b[0]===c[0]&&b[1]===c[1]&&b[2]===c[2];
   if(cdSame){P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);for(let i=0;i<3;i++){this.n.push(nx,ny,nz);this.c.push(col.r,col.g,col.b)}this.u.push(u0,v0,u1,v0,u1,v1);this.idx.push(b0,b0+1,b0+2)}
   else if(bcSame){P.push(a[0],a[1],a[2],b[0],b[1],b[2],d[0],d[1],d[2]);for(let i=0;i<3;i++){this.n.push(nx,ny,nz);this.c.push(col.r,col.g,col.b)}this.u.push(u0,v0,u1,v0,u0,v1);this.idx.push(b0,b0+1,b0+2)}
   else{P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2],d[0],d[1],d[2]);for(let i=0;i<4;i++){this.n.push(nx,ny,nz);this.c.push(col.r,col.g,col.b)}this.u.push(u0,v0,u1,v0,u1,v1,u0,v1);this.idx.push(b0,b0+1,b0+2,b0,b0+2,b0+3)}
   return}
  P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2],a[0],a[1],a[2],c[0],c[1],c[2],d[0],d[1],d[2]);
  for(let i=0;i<6;i++){this.n.push(nx,ny,nz);this.c.push(col.r,col.g,col.b)}
  this.u.push(u0,v0,u1,v0,u1,v1,u0,v0,u1,v1,u0,v1)}
 flat(x0,z0,x1,z1,y,col){this.quad([x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],0,1,0,[0,0,1,1],col)}
 box(x0,y0,z0,x1,y1,z1,col,o){o=o||{};const top=o.top||this,tc=o.topCol||col;const W=o.win;
  const uv=(len)=>W?[W[0],y0/25.6+W[1],W[0]+(o.facadeGrid?Math.max(1,Math.floor(len/3.5))/8:len/28),y1/25.6+W[1]]:[0,0,1,1];
  if(o.bottom||(this.ab&&o.bottom!==false&&y0>.5&&y1-y0>.04&&y0<36))this.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],0,-1,0,[0,0,1,1],o.bottom||this.ab!==1?col:col.clone().multiplyScalar(1.4));
  if(!o.noTop)top.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,[0,0,1,1],tc);
  this.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0,uv(z1-z0),col);
  this.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0,uv(z1-z0),col);
  this.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1,uv(x1-x0),col);
  this.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1,uv(x1-x0),col)}
 rslab(x0,z0,x1,z1,y0,y1,col,rs){const pts=[],C=[[x1,z1,-1,-1],[x1,z0,-1,1],[x0,z0,1,1],[x0,z1,1,-1]];
  for(let i=0;i<4;i++){const[cx,cz,ix,iz]=C[i],r=rs?rs[i]:0;if(!r){pts.push([cx,cz]);continue}const ox=cx+ix*r,oz=cz+iz*r,tm=Math.atan2(-iz,-ix),n=7;
   for(let k=0;k<=n;k++){const t=tm+Math.PI/4-k*(Math.PI/2)/n;pts.push([ox+Math.cos(t)*r,oz+Math.sin(t)*r])}}
  const mx=(x0+x1)/2,mz=(z0+z1)/2,dn=[mx,y1-5,mz],mid=[mx,(y0+y1)/2,mz];let yt=y1;if(ZF.on&&col)yt+=zfFix(1,1,y1,Math.min(z0,z1),Math.max(z0,z1),Math.min(x0,x1),Math.max(x0,x1),col,ZF.box>0); /* topo inteiro sobe junto (mesmo deslocamento). Ordem do zfFix p/ eixo Y: u = z, w = x (como no quad) */
  const top=[mx,yt,mz];
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-4)continue;
   this.qa(top,[a[0],yt,a[1]],[b[0],yt,b[1]],[b[0],yt,b[1]],col,dn);
   this.qa([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],yt,b[1]],[a[0],yt,a[1]],col,mid)}}
 loft(st,colF){const n=st[0].p.length;for(let a=0;a<st.length-1;a++){const A=st[a],B=st[a+1];for(let i=0;i<n;i++){const j=(i+1)%n,ref=[(A.x+B.x)/2,(A.p[i][1]+A.p[j][1]+B.p[i][1]+B.p[j][1])/4*.0+A.cy,0];
   const q0=[A.x,A.p[i][1],A.p[i][0]],q1=[A.x,A.p[j][1],A.p[j][0]],q2=[B.x,B.p[j][1],B.p[j][0]],q3=[B.x,B.p[i][1],B.p[i][0]];if(Math.hypot(q0[1]-q1[1],q0[2]-q1[2])<1e-4&&Math.hypot(q2[1]-q3[1],q2[2]-q3[2])<1e-4)continue;this.qa(q0,q1,q2,q3,colF(a,i),ref)}}
  for(const[S0,dir] of [[st[0],-1],[st[st.length-1],1]]){const c=[S0.x,S0.cy,0],ref=[S0.x-dir,S0.cy,0];for(let i=0;i<n;i++){const j=(i+1)%n;this.qa(c,[S0.x,S0.p[i][1],S0.p[i][0]],[S0.x,S0.p[j][1],S0.p[j][0]],[S0.x,S0.p[j][1],S0.p[j][0]],colF(dir<0?-1:st.length,i),ref)}}}
 qdisc(ox,oz,r,dx,dz,y0,y1,col){const tm=Math.atan2(dz,dx),n=9,dn=[ox,y1-5,oz],mid=[ox,(y0+y1)/2,oz];let pv=null,yt=y1;
  /* v78: leque inteiro com UM deslocamento anti z-fight (qa pula fatias soltas); caixa = centro + arco */
  if(ZF.on&&col){let x0=ox,x1=ox,z0=oz,z1=oz;for(let k=0;k<=n;k++){const t=tm-Math.PI/4+k*(Math.PI/2)/n,qx=ox+Math.cos(t)*r,qz=oz+Math.sin(t)*r;if(qx<x0)x0=qx;if(qx>x1)x1=qx;if(qz<z0)z0=qz;if(qz>z1)z1=qz}yt+=zfFix(1,1,y1,z0,z1,x0,x1,col,ZF.box>0)}
  const O=[ox,yt,oz];
  for(let k=0;k<=n;k++){const t=tm-Math.PI/4+k*(Math.PI/2)/n,q=[ox+Math.cos(t)*r,oz+Math.sin(t)*r];
   if(pv){this.qa(O,[pv[0],yt,pv[1]],[q[0],yt,q[1]],[q[0],yt,q[1]],col,dn);this.qa([pv[0],y0,pv[1]],[q[0],y0,q[1]],[q[0],yt,q[1]],[pv[0],yt,pv[1]],col,mid)}pv=q}}
 geo(g,m,col){const pa=g.attributes.position,na=g.attributes.normal,v=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m);
  const p0=this.p.length,b0=p0/3;
  if(!this.idx&&g.index){const ix=g.index;for(let i=0;i<ix.count;i++){const vi=ix.getX(i);v.fromBufferAttribute(pa,vi).applyMatrix4(m);this.p.push(v.x,v.y,v.z);v.fromBufferAttribute(na,vi).applyMatrix3(nm).normalize();this.n.push(v.x,v.y,v.z);this.u.push(0,0);this.c.push(col.r,col.g,col.b)}if(ZF.on&&col&&ix.count%3===0)zfGeo(this.p,p0,col);return}
  for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);this.p.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();this.n.push(v.x,v.y,v.z);this.u.push(0,0);this.c.push(col.r,col.g,col.b)}
  if(ZF.on&&col&&!g.index&&pa.count%3===0)zfGeo(this.p,p0,col);
  if(this.idx){if(g.index)for(let i=0,ic=g.index.count;i<ic;i++)this.idx.push(b0+g.index.getX(i));else for(let i=0;i<pa.count;i++)this.idx.push(b0+i)}}
 qa(a,b,c,d,col,ref){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  const mx=(a[0]+b[0]+c[0])/3-ref[0],my=(a[1]+b[1]+c[1])/3-ref[1],mz=(a[2]+b[2]+c[2])/3-ref[2];
  /* v78: leque (c===d, triângulo) não passa pelo anti z-fight: cada fatia subia 4 mm sozinha e abria frestas/linhas entre os triângulos */
  const w0=this._nz;if(c[0]===d[0]&&c[1]===d[1]&&c[2]===d[2])this._nz=true;
  try{if(nx*mx+ny*my+nz*mz<0)this.quad(a,d,c,b,-nx,-ny,-nz,[0,0,1,1],col);else this.quad(a,b,c,d,nx,ny,nz,[0,0,1,1],col)}finally{this._nz=w0}}
 qb(a,b,c,d,col,ref){const m=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];this.qa(a,b,c,d,col,[2*m[0]-ref[0],2*m[1]-ref[1],2*m[2]-ref[2]])}
 cbox(x0,y0,z0,x1,y1,z1,col,c){c=Math.min(c,(y1-y0)*.35,(z1-z0)*.3,(x1-x0)*.3);const yc=(y0+y1)/2,zc=(z0+z1)/2,ref=[(x0+x1)/2,yc,zc];
  const ring=(x,k)=>{const Y0=y0+k*.5,Y1=y1-k,Z0=z0+k,Z1=z1-k;return[[x,Y0,Z0+c],[x,Y0,Z1-c],[x,Y0+c,Z1],[x,Y1-c,Z1],[x,Y1,Z1-c],[x,Y1,Z0+c],[x,Y1-c,Z0],[x,Y0+c,Z0]]};
  const rs=[ring(x0,c),ring(x0+c,0),ring(x1-c,0),ring(x1,c)];
  for(let r=0;r<3;r++)for(let i=0;i<8;i++){const j=(i+1)%8;this.qa(rs[r][i],rs[r][j],rs[r+1][j],rs[r+1][i],col,ref)}
  for(const r of [0,3]){const cc=[rs[r][0][0],yc,zc];for(let i=0;i<8;i++){const j=(i+1)%8;this.qa(cc,rs[r][i],rs[r][j],rs[r][j],col,ref)}}}
 mesh(mat,cast=true,recv=true){if(!this.p.length)return null;mbCheck(this);const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  if(this.idx)g.setIndex(this.idx);
  g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.castShadow=cast;m.receiveShadow=recv;return m}}
for(const k of ['box','cbox']){const f=MB.prototype[k];MB.prototype[k]=function(){let a=arguments;if(ZF.on&&k==='box'){a=[...a];const v=zfBoxAdj(a.slice(0,6));for(let i=0;i<6;i++)a[i]=v[i]}ZF.box++;try{return f.apply(this,a)}finally{ZF.box--}}} // anti z-fight: faces de caixa fechada recuam (zfFix)
/* v3 r34 · BLDX: cor e formato dos prédios do Modern. pc = fração com cor nova (metade branco-concreto, metade amarelado-areia),
   pe = chance de um prédio elegível sair redondo (cilindro ou oval). Sorteios com gerador próprio (bldxRng), nunca o R(): a cidade não muda.
   Elegível (opts.exo): quarteirão sem becos internos do L, sem beco encostado (city.bxAl), sem L/casa segura/pátio/paraquedas/neon/Neon Road. */
const BLDX={pc:.2,pe:.3,white:['#dcd9d1','#e4e1da','#d1cfc7'],sand:['#d4bc86','#cbb07a','#d9c391']};
function bldxRng(x,z,salt){return mulberry32(((Math.round(x*11)*2246822519)^(Math.round(z*11)*374761393)^(S.seed*7+salt))>>>0)}
/* v4 r53: janela acesa (layout de Sunset Shores/Point Haze/Invertido) com estilos variados, como numa cidade de verdade:
   incandescente âmbar, fluorescente esverdeado/azulado, LED branco, spots redondos no teto, barra de LED, persiana, meia cortina, TV azulada e raros tons roxo/rosa.
   O tom dominante e quantas acendem por prédio vêm do bldLitPatch (js/07). */
function winLitCell(ge,x,y,w,h,rnd,pick){const r=rnd(),A=(a,c)=>{ge.globalAlpha=a;ge.fillStyle=c};
 if(r<.26){A(.62+rnd()*.33,pick(['#ffd08a','#ffc070','#ffdca8','#ffb860']));ge.fillRect(x,y,w,h);A(.22,'#000');ge.fillRect(x,y,w,h*.18)}
 else if(r<.44){A(.55+rnd()*.35,pick(['#dcfff2','#c4f2ff','#b8ffe0','#e8fff8']));ge.fillRect(x,y,w,h)}
 else if(r<.56){A(.7+rnd()*.3,'#f4f7ff');ge.fillRect(x,y,w,h)}
 else if(r<.68){const c=pick(['#fff4e0','#eef6ff','#ffffff']);A(.16,c);ge.fillRect(x,y,w,h);const n=rnd()<.5?1:2;
  for(let i=0;i<n;i++){const cx=x+w*(n===1?.5:i?.72:.28),cy=y+5,gr=ge.createRadialGradient(cx,cy,0,cx,cy,7);gr.addColorStop(0,c);gr.addColorStop(.45,c);gr.addColorStop(1,'rgba(0,0,0,0)');ge.globalAlpha=1;ge.fillStyle=gr;ge.fillRect(x,y,w,h*.8)}}
 else if(r<.76){A(.14,'#cfe4ff');ge.fillRect(x,y,w,h);A(.95,'#f2f8ff');ge.fillRect(x,y+Math.round(h*(.25+rnd()*.3)),w,3)}
 else if(r<.86){const c=rnd()<.6?pick(['#ffd08a','#ffe0b0']):'#d8f6ff';for(let k=0;k<h;k+=3){A(k%6?.25:.85,c);ge.fillRect(x,y+k,w,2)}}
 else if(r<.94){A(.7+rnd()*.25,pick(['#ffc880','#ffd9a0']));ge.fillRect(x,y+h*.45,w,h*.55);A(.2,'#ffc880');ge.fillRect(x,y,w,h*.45)}
 else if(r<.98){A(.35+rnd()*.2,'#6f9dff');ge.fillRect(x,y,w,h)}
 else{A(.5,pick(['#d98cff','#ff8fd0']));ge.fillRect(x,y,w,h)}
 ge.globalAlpha=1}
/* v4 r53: por prédio, deslocamento da textura de janelas em células (1/8) e número do prédio (1..15) na parte inteira de v (8·id).
   A textura repete a cada 1, então só o padrão muda; o shader lê floor(v/8). Gerador próprio (bldxRng): não mexe na seed. */
function bldWin(x,z){const r=bldxRng(x,z,0x51d);return[Math.floor(r()*8)/8,8*(1+Math.floor(r()*15))+Math.floor(r()*8)/8]}
function bldxColor(r){const a=r(),k=r(),v=r();if(a>=BLDX.pc)return null;const L=a<BLDX.pc/2?BLDX.white:BLDX.sand;return COL(L[Math.floor(k*L.length)]).multiplyScalar(.95+v*.08)}
function mbOvalN(rx,rz){const per=Math.PI*(3*(rx+rz)-Math.sqrt((3*rx+rz)*(rx+3*rz)));return Math.max(4,Math.floor(per/3.5))}
function mbOval(mb,top,cx,cz,rx,rz,y0,y1,col,tc,o){o=o||{};const nb=mbOvalN(rx,rz),sub=2,n=nb*sub,W=o.win,P=k=>{const t=k/n*Math.PI*2;return[cx+Math.cos(t)*rx,cz+Math.sin(t)*rz]};
 const nz0=top&&top._nz;if(top)top._nz=true;
 for(let k=0;k<n;k++){const a=P(k+1),b=P(k);let nx=-(b[1]-a[1]),nzz=b[0]-a[0];const L=Math.hypot(nx,nzz)||1;nx/=L;nzz/=L;
  const uv=W?[W[0]+(n-k-1)/(8*sub),y0/25.6+W[1],W[0]+(n-k)/(8*sub),y1/25.6+W[1]]:[0,0,1,1];
  mb.quad([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],nx,0,nzz,uv,col);
  if(top)top.quad([cx,y1,cz],[a[0],y1,a[1]],[b[0],y1,b[1]],[b[0],y1,b[1]],0,1,0,[0,0,1,1],tc||col)}
 if(top)top._nz=nz0}
function mbOvalRim(mb,cx,cz,rx,rz,y0,y1,t,col){const n=mbOvalN(rx,rz)*2,P=(k,e)=>{const a=k/n*Math.PI*2;return[cx+Math.cos(a)*(rx-e),cz+Math.sin(a)*(rz-e)]};const nz0=mb._nz;mb._nz=true;
 for(let k=0;k<n;k++){const a=P(k+1,0),b=P(k,0),ai=P(k+1,t),bi=P(k,t);let nx=-(b[1]-a[1]),nzz=b[0]-a[0];const L=Math.hypot(nx,nzz)||1;nx/=L;nzz/=L;
  mb.quad([a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],nx,0,nzz,[0,0,1,1],col);
  mb.quad([bi[0],y0,bi[1]],[ai[0],y0,ai[1]],[ai[0],y1,ai[1]],[bi[0],y1,bi[1]],-nx,0,-nzz,[0,0,1,1],col);
  mb.quad([a[0],y1,a[1]],[b[0],y1,b[1]],[bi[0],y1,bi[1]],[ai[0],y1,ai[1]],0,1,0,[0,0,1,1],col)}
 mb._nz=nz0}
/* colisor do prédio redondo: faixas ao longo do eixo maior, cada uma com a largura da elipse no lado mais perto do centro (cobre a forma toda) */
function bldxCols(e,n){const r=[],ax=e.rx>=e.rz;const A=ax?e.rx:e.rz,B=ax?e.rz:e.rx;for(let i=0;i<n;i++){const u0=-A+2*A*i/n,u1=-A+2*A*(i+1)/n,un=Math.min(Math.abs(u0),Math.abs(u1))*(u0<0&&u1>0?0:1),hb=B*Math.sqrt(Math.max(0,1-(un/A)**2));
 r.push(ax?[e.cx+u0,e.cz-hb,e.cx+u1,e.cz+hb]:[e.cx-hb,e.cz+u0,e.cx+hb,e.cz+u1])}return r}
/* v3 r48: esferas mais leves. sph 18×12 (396 tri) → 10×7 (120); sphHi = a antiga, só p/ peça grande (fuselagem do helicóptero); bulb 6×4 (36) p/ lâmpadas de até ~12 cm.
   hemi 32×12 (736) → 16×6 (176); hemiHi = a antiga, só p/ cúpula grande (≥1,5 m). Copas: crown 10×6 (100) → 8×5 (64), crownSmall 8×5 (64) → 7×4 (42). */
const GEO={crown:new THREE.SphereGeometry(1,8,5).toNonIndexed(),crownSmall:new THREE.SphereGeometry(1,7,4).toNonIndexed(),cyl16:new THREE.CylinderGeometry(1,1,1,16).toNonIndexed(),sph:new THREE.SphereGeometry(1,10,7).toNonIndexed(),sphHi:new THREE.SphereGeometry(1,18,12).toNonIndexed(),bulb:new THREE.SphereGeometry(1,6,4).toNonIndexed(),ico:new THREE.IcosahedronGeometry(1,0),leaf:new THREE.IcosahedronGeometry(1,1),cyl:new THREE.CylinderGeometry(1,1,1,9).toNonIndexed(),cone:new THREE.ConeGeometry(1,1,12).toNonIndexed(),disc:new THREE.CircleGeometry(1,8).toNonIndexed(),hemi:new THREE.SphereGeometry(1,16,6,0,Math.PI*2,0,Math.PI/2).toNonIndexed(),hemiHi:new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2).toNonIndexed()};
GEO.box=new THREE.BoxGeometry(1,1,1).toNonIndexed();
{const P=MB.prototype,wrap=(name,fn)=>{const o=P[name];P[name]=function(...a){if(!MB_DROP||MB_DROP_IN)return o.apply(this,a);fn(a);MB_DROP_IN++;try{return o.apply(this,a)}finally{MB_DROP_IN--}}};
 const bx=a=>{const r=mbDropY((a[0]+a[3])/2,(a[2]+a[5])/2,a[1],a[4]);if(r){a[1]=r[0];a[4]=r[1]}};
 wrap('box',bx);wrap('cbox',bx);
 wrap('flat',a=>{const x=(a[0]+a[2])/2,z=(a[1]+a[3])/2,y=a[4];if(mbDropIn(x,z)&&y>=.15&&y<=3.2)a[4]=Math.max(.045,y-MB_DROP.off)});
 wrap('rslab',a=>{const r=mbDropY((a[0]+a[2])/2,(a[1]+a[3])/2,a[4],a[5]);if(r){a[4]=r[0];a[5]=r[1]}});
 wrap('qdisc',a=>{const r=mbDropY(a[0],a[1],a[5],a[6]);if(r){a[5]=r[0];a[6]=r[1]}});
 wrap('geo',a=>{const g=a[0],m=a[1];if(!g.boundingBox)g.computeBoundingBox();const bb=_mbBB.copy(g.boundingBox).applyMatrix4(m),lo=bb.min.y,hi=bb.max.y;
  if(!mbDropIn(m.elements[12],m.elements[14])||!(lo>=.15&&lo<=3.2))return;const nlo=Math.max(0,lo-MB_DROP.off);let A;
  if(hi<=3.2)A=new THREE.Matrix4().makeTranslation(0,nlo-lo,0);else{const k=(hi-nlo)/Math.max(1e-6,hi-lo);A=new THREE.Matrix4().makeTranslation(0,hi,0).multiply(new THREE.Matrix4().makeScale(1,k,1)).multiply(new THREE.Matrix4().makeTranslation(0,-hi,0))}
  a[1]=A.multiply(m)})}
for(const k in GEO)GEO[k].computeVertexNormals();
// Smooth radial normals remove the faceted lighting while retaining a compact silhouette.
for(const key of ['crown','crownSmall','leaf']){const p=GEO[key].attributes.position,n=GEO[key].attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),l=Math.hypot(x,y,z)||1;n.setXYZ(i,x/l,y/l,z/l)}}
{const pa=GEO.ico.attributes.position,na=GEO.ico.attributes.normal,v=new THREE.Vector3();for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).normalize();na.setXYZ(i,v.x,v.y,v.z)}}
{const pa=GEO.cyl.attributes.position,na=GEO.cyl.attributes.normal;for(let i=0;i<pa.count;i++){if(Math.abs(na.getY(i))>.9)continue;const x=pa.getX(i),z=pa.getZ(i),l=Math.hypot(x,z)||1;na.setXYZ(i,x/l,0,z/l)}}
const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V3=new THREE.Vector3(),SC=new THREE.Vector3(),EU=new THREE.Euler();
function mtx(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){EU.set(rx,ry,rz);Q.setFromEuler(EU);return M4.compose(V3.set(x,y,z),Q,SC.set(sx,sy,sz))}

/* ================= COLLISION GRID ================= */
const GR=20; let grid=new Map(), colliders=[], stampN=0;
/* r51: batidas (parede, carro, poste, árvore, semáforo, queda) tiram 1/3 do que tiravam → veículos aguentam o triplo. Tiros e explosões não mudam. */
const CRASH_DMG=1/3;
function addCol(x0,z0,x1,z1,kind){const c={x0,z0,x1,z1,kind,stamp:0,dead:false,keys:[]};colliders.push(c);if(curChunk)curChunk.cols.push(c);
 for(let gx=Math.floor(x0/GR);gx<=Math.floor(x1/GR);gx++)for(let gz=Math.floor(z0/GR);gz<=Math.floor(z1/GR);gz++){const k=gx*100003+gz;c.keys.push(k);let l=grid.get(k);if(!l){l=[];grid.set(k,l)}l.push(c)}return c}
const qOut=[];
function query(x,z,r){stampN++;qOut.length=0;
 for(let gx=Math.floor((x-r)/GR);gx<=Math.floor((x+r)/GR);gx++)for(let gz=Math.floor((z-r)/GR);gz<=Math.floor((z+r)/GR);gz++){const l=grid.get(gx*100003+gz);if(!l)continue;for(const c of l)if(c.stamp!==stampN){c.stamp=stampN;qOut.push(c)}}return qOut}

/* v4 r48 · ENVELHECIMENTO de mobiliário urbano (banca de jornal, entrada do metrô): ruído determinístico por posição (sem R()),
   cor envelhecida por vértice (tinta desbotada, sujeira subindo da base, escorrido vertical, lascas e ferrugem) e textura de desgaste
   (canvas único, gerado uma vez) para materiais com mapa. Nada roda por quadro. */
const AGE={tex:null};
function ageH(x,y){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function ageN(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=ageH(xi,yi),b=ageH(xi+1,yi),c=ageH(xi,yi+1),d=ageH(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
/* cor envelhecida no ponto (s = coordenada horizontal ao longo da face, y = altura acima da base do objeto); k = intensidade (0–1.3);
   rust = quanto da sujeira de baixo vira ferrugem (metal) */
function ageColor(col,s,y,k,rust,out){const n=ageN(s*1.6,y*1.6)*.6+ageN(s*4.1+7.3,y*4.1)*.4;
 let r=col.r,g=col.g,b=col.b;const L=r*.3+g*.59+b*.11;
 /* desbotado: puxa para o cinza e amarela de leve */const f=.2*k;r+=(L*1.02-r)*f;g+=(L*1.0-g)*f;b+=(L*.86-b)*f;
 /* sujeira subindo da base (altura irregular) */const hb=.22+.5*ageN(s*.9+3.1,.5);const base=(1-Math.min(1,Math.max(0,y/hb)))*(.55+.45*n)*k;
 const dr=rust?.42:.34,dg=rust?.26:.3,db=rust?.15:.24;r+=(dr-r)*base*.7;g+=(dg-g)*base*.7;b+=(db-b)*base*.7;
 /* escorrido vertical (ruído fino na horizontal, longo na vertical) */const st=ageN(s*9.5+1.7,y*.35);const drip=Math.max(0,st-.55)*2.2*k;r*=1-drip*.32;g*=1-drip*.34;b*=1-drip*.35;
 /* manchas grandes */const bl=Math.max(0,n-.55)*1.6*k;r*=1-bl*.26;g*=1-bl*.26;b*=1-bl*.22;
 /* lascas: pontos claros (tinta de baixo) e, no metal, ferrugem */const ch=ageH(Math.floor(s*14),Math.floor(y*14));if(ch>.955-.03*k){if(rust&&ch>.985){r=.48;g=.27;b=.14}else{r=r*.55+.36;g=g*.55+.35;b=b*.55+.32}}
 out[0]=Math.min(1,Math.max(0,r));out[1]=Math.min(1,Math.max(0,g));out[2]=Math.min(1,Math.max(0,b));return out}
const AGE_TMP=[0,0,0];
/* quad subdividido com cor por vértice (MB indexado). a,b,d = cantos (a→b horizontal, a→d vertical); n = normal; fn(x,y,z,out) devolve a cor */
function mbAgedQuad(mb,a,b,d,nx,ny,nz,nu,nv,fn){if(!mb.idx){const c=[b[0]+d[0]-a[0],b[1]+d[1]-a[1],b[2]+d[2]-a[2]];fn((a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2,AGE_TMP);
  mb.quad(a,b,c,d,nx,ny,nz,[0,0,1,1],new THREE.Color(AGE_TMP[0],AGE_TMP[1],AGE_TMP[2]));return}
 const P=mb.p,b0=P.length/3,ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,x=a[0]+ux*u+vx*v,y=a[1]+uy*u+vy*v,z=a[2]+uz*u+vz*v;P.push(x,y,z);mb.n.push(nx,ny,nz);mb.u.push(u,v);fn(x,y,z,AGE_TMP);mb.c.push(AGE_TMP[0],AGE_TMP[1],AGE_TMP[2])}
 const W=nu+1;for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const p0=b0+j*W+i;mb.idx.push(p0,p0+1,p0+W+1,p0,p0+W+1,p0+W)}}
/* caixa alinhada aos eixos com as 4 laterais envelhecidas (topo liso, cor desbotada); gy = altura da base do objeto (sujeira sobe dela) */
function mbAgedBox(mb,x0,y0,z0,x1,y1,z1,col,gy,k,rust,cell){cell=cell||.12;const nv=Math.max(1,Math.round((y1-y0)/cell)),fx=Math.max(1,Math.round((x1-x0)/cell)),fz=Math.max(1,Math.round((z1-z0)/cell));
 const fn=(sx)=>(x,y,z,o)=>ageColor(col,sx(x,z),y-gy,k,rust,o);
 mb.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,[0,0,1,1],ageColor(col,x0+z0,y1-gy+3,k*.6,rust,AGE_TMP)&&new THREE.Color(AGE_TMP[0],AGE_TMP[1],AGE_TMP[2]));
 mbAgedQuad(mb,[x1,y0,z1],[x1,y0,z0],[x1,y1,z1],1,0,0,fz,nv,fn((x,z)=>-z));
 mbAgedQuad(mb,[x0,y0,z0],[x0,y0,z1],[x0,y1,z0],-1,0,0,fz,nv,fn((x,z)=>z+31.7));
 mbAgedQuad(mb,[x0,y0,z1],[x1,y0,z1],[x0,y1,z1],0,0,1,fx,nv,fn((x,z)=>x+57.1));
 mbAgedQuad(mb,[x1,y0,z0],[x0,y0,z0],[x1,y1,z0],0,0,-1,fx,nv,fn((x,z)=>-x+13.3))}
/* textura de desgaste 256² (multiplica a cor do material): lascas, riscos, escorrido, pontos de ferrugem. Gerada uma vez (mulberry32 fixo). */
function ageWearTex(){if(AGE.tex)return AGE.tex;const N=256,c=cv(N,N),g=c.getContext('2d'),r=mulberry32(0x5eed42);g.fillStyle='#f2f2f2';g.fillRect(0,0,N,N);
 const dot=(x,y,rr,col,a)=>{g.globalAlpha=a;g.fillStyle=col;for(const ox of[-N,0,N])for(const oy of[-N,0,N]){g.beginPath();g.arc(x+ox,y+oy,rr,0,6.283);g.fill()}};
 for(let i=0;i<90;i++)dot(r()*N,r()*N,6+r()*22,'#7a7468',.1+r()*.12); /* manchas */
 for(let i=0;i<40;i++){const x=r()*N,w=1+r()*2.5,y0=r()*N,h=20+r()*90;g.globalAlpha=.14+r()*.14;g.fillStyle='#4a4238';for(const ox of[-N,0,N]){g.fillRect(x+ox,y0,w,h);g.fillRect(x+ox,y0-N,w,h)}} /* escorrido (v = vertical) */
 for(let i=0;i<260;i++)dot(r()*N,r()*N,1+r()*2.6,r()<.5?'#ffffff':'#c9c2b4',.5+r()*.4); /* lascas claras */
 for(let i=0;i<70;i++)dot(r()*N,r()*N,1+r()*2.4,'#7a4422',.6+r()*.35); /* ferrugem */
 g.globalAlpha=.18;g.strokeStyle='#4a4640';g.lineWidth=.8;for(let i=0;i<50;i++){const x=r()*N,y=r()*N,a=r()*6.283,l=4+r()*18;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()} /* riscos */
 g.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;AGE.tex=t;return t}
