'use strict';
/* Coastal Chaos · js/44-backrooms.js — Backrooms.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= BACKROOMS (v3 r10) =================
   Sunset Shores: v3 r16 — a entrada é o buraco da obra do dia (OBRA.hole, brHole); o miolo preto falha (obraGlitchTick) e não há
   mais falha no mapa nem beco (BR.seg/brPickSeg ficam sem uso). Pisando/pulando no miolo (a pé) o jogador atravessa o chão (BR.fall em worldPlGy, câmera
   brFallCam por baixo olhando a cidade lá em cima) e, ~1,5 s depois de começar a cair, entra o loading do Nível 0.
   Nível 0 = palco de interior (PL.inside='backrooms', roomStageLocalTick → brInsideTick): labirinto procedural com seed própria
   (6×6 células de 5 m por quadra: cidade 7×7 → 42×42 células; 14×14 → 84×84), carpete, papel de parede, teto com luminárias.
   Malha por pedaço de 6×6 células (3 materiais básicos, sem luz real; vertex color = luz/zonas escuras), colisores em addCol
   (ficam até a próxima geração da cidade, que zera a grade). Depois de 10 min surgem entidades lentas (demogorgon com falhas);
   um trecho de corredor (amarelo mais forte no mapa) devolve o jogador à cidade num ponto aleatório (chance por segundo andando nele). */
const BR={on:false,busy:false,fall:false,fv:0,fallT:0,fx:0,fz:0,seg:null,segK:-1,exitT:180,exitK:-1,t:0,built:'',grp:null,chunks:[],mats:null,texs:null,fog:null,bg:null,
 m:null,W:0,H:0,C:5,HC:3.2,T:.3,ox:-6000,oz:-6000,LV:null,boxes:null,mapCv:null,exit:null,ents:[],entT:0,dist:null,bq:null,distT:0,distC:-1,
 fxEl:null,fxV:-1,glT:0,hum:null,ldEl:null,flick:1,flT:0,ckey:-1,entCv:null,lastCell:-1};
const BR_GLC=['#ff2a8a','#2affea','#ffffff','#f2d21a','#000000','#7a2aff'];
function brWait(ms){return new Promise(r=>setTimeout(r,ms))}
function brOK(){try{return played&&S.style==='modern'&&!city.haze&&!profInMission()&&!PROLOGUE.cut&&!TIMEJUMP.busy&&!TIMEJUMP.loading&&!INVERT.switching&&!HAZE.switching&&!TVM.on&&!(typeof BENCH!=='undefined'&&BENCH.active)}catch(e){return false}}
/* v3 r16: a entrada é o buraco da obra (OBRA.hole); brInBlock mede distância até ele (Fenda, gangues, radar, ponto de volta) */
function brHole(){return typeof OBRA!=='undefined'&&OBRA.hole&&(OBRA.phase==='on'||OBRA.phase==='in')?OBRA.hole:null}
function brInBlock(x,z,m){const h=brHole();return !!h&&Math.hypot(x-h.x,z-h.z)<1.6+m}
function brInitCity(){brReset();city.brBlock=null;BR.seg=null;BR.segK=-1}
/* v3 r11: o que falha é UM trecho reto de beco entre prédios (≤12 m), sorteado pela seed + bloco de 3 h de jogo (DN.day/DN.tod),
   longe da Fenda, do DeLorean, de coletáveis (vinis/armas/colete), do Timoty e das gangues. Gerador próprio (não consome R). */
function brNetOn(){return typeof ONLINE!=='undefined'&&!!ONLINE.on}
/* online (r14): todos precisam do MESMO trecho → chave só pelo relógio do servidor (DN.tod é sincronizado; o dia não) */
function brSegKey(){return (brNetOn()?0:(DN.day||0)*8)+Math.floor((DN.tod||0)/180)}
function brPickSeg(key){const L=(city.alleySites||[]).filter(a=>a&&!a.ramp&&!a.weapon&&Number.isFinite(a.x0));if(!L.length)return null;
 const rnd=mulberry32(((S.seed^0x3b7c0de5)+Math.imul(key+1,2654435761))>>>0),far=[];const add=(x,z,r)=>{if(Number.isFinite(x)&&Number.isFinite(z))far.push(x,z,r)};
 const net=brNetOn(); /* online: só o que é igual para todos (seed); Fenda/coletáveis pegos/carro variam por jogador (gangues já não existem no online) */
 if(INVERT.portal&&!net)add(INVERT.portal.x,INVERT.portal.z,40);for(const t of TOMMY.sites||[])add(t.x,t.z,35);for(const t of GANG.T||[])add(t.x,t.z,70);
 if(!net)for(const q of pickups)add(q.x,q.z,14);for(const q of VINYL.spots||[])add(q.x,q.z,22);if(!net)for(const c of vehicles)if(c.special)add(c.x,c.z,40);if(ISLE.car)add(ISLE.car.x,ISLE.car.z,40);
 /* cidade pequena tem poucos becos: se quase nada passa, afrouxa as distâncias (nunca em cima de nada) */
 let ok=[];for(const sc of [1,.6,.35]){ok=L.filter(a=>{const cx=(a.x0+a.x1)/2,cz=(a.z0+a.z1)/2;if(inWater(cx,cz)||isRural(cx,cz))return false;
  for(let f=0;f<far.length;f+=3){const dx=clamp(far[f],a.x0,a.x1)-far[f],dz=clamp(far[f+1],a.z0,a.z1)-far[f+1],r=Math.max(8,far[f+2]*sc);if(dx*dx+dz*dz<r*r)return false}return true});if(ok.length>=4)break}
 if(ok.length){const a=ok[(rnd()*ok.length)|0];
  const ax=a.x1-a.x0>=a.z1-a.z0,len=ax?a.x1-a.x0:a.z1-a.z0,n=Math.min(12,len),o=rnd()*(len-n);
  return ax?{x0:a.x0+o,x1:a.x0+o+n,z0:a.z0,z1:a.z1,ref:a}:{x0:a.x0,x1:a.x1,z0:a.z0+o,z1:a.z0+o+n,ref:a}}return null}
function brReset(){brEntClear();brHum(false);brFxSet(0);if(BR.ldEl)BR.ldEl.hidden=true;
 if(BR.grp){if(BR.grp.parent)BR.grp.parent.remove(BR.grp);BR.grp.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 if(BR.mats)for(const k in BR.mats)BR.mats[k].dispose();if(BR.texs)for(const t of BR.texs)t.dispose();
 BR.grp=null;BR.mats=null;BR.texs=null;BR.chunks=[];BR.built='';BR.m=null;BR.LV=null;BR.boxes=null;BR.exit=null;BR.on=false;BR.busy=false;BR.fall=false;BR.ckey=-1;
 if(PL.inside==='backrooms')PL.inside=false}
/* ---------- labirinto ---------- */
function brGen(){const N=clamp(city.N||7,4,16),W=N*6,H=N*6,rnd=mulberry32((S.seed^0x51a7e0b1)>>>0);
 const hw=new Uint8Array(W*(H+1)).fill(1),vw=new Uint8Array((W+1)*H).fill(1); /* hw[j*W+i]: linha z=j entre (i,j-1)/(i,j); vw[j*(W+1)+i]: linha x=i entre (i-1,j)/(i,j) */
 const seen=new Uint8Array(W*H),st=new Int32Array(W*H),nb=[0,0,0,0];let sp=0;{const s0=(rnd()*W*H)|0;seen[s0]=1;st[sp++]=s0}
 while(sp){const c=st[sp-1],i=c%W,j=(c/W)|0;let n=0;
  if(j>0&&!seen[c-W])nb[n++]=0;if(i<W-1&&!seen[c+1])nb[n++]=1;if(j<H-1&&!seen[c+W])nb[n++]=2;if(i>0&&!seen[c-1])nb[n++]=3;
  if(!n){sp--;continue}const d=nb[(rnd()*n)|0];let c2;
  if(d===0){hw[j*W+i]=0;c2=c-W}else if(d===1){vw[j*(W+1)+i+1]=0;c2=c+1}else if(d===2){hw[(j+1)*W+i]=0;c2=c+W}else{vw[j*(W+1)+i]=0;c2=c-1}
  seen[c2]=1;st[sp++]=c2}
 for(let j=1;j<H;j++)for(let i=0;i<W;i++)if(hw[j*W+i]&&rnd()<.3)hw[j*W+i]=0;
 for(let j=0;j<H;j++)for(let i=1;i<W;i++)if(vw[j*(W+1)+i]&&rnd()<.3)vw[j*(W+1)+i]=0;
 const pc=[],rooms=Math.round(W*H/45);
 for(let k=0;k<rooms;k++){const rw=2+(rnd()*4|0),rh=2+(rnd()*4|0),i0=(rnd()*(W-rw))|0,j0=(rnd()*(H-rh))|0,pil=rnd()<.55;
  for(let j=j0;j<j0+rh;j++)for(let i=i0+1;i<i0+rw;i++)vw[j*(W+1)+i]=0;
  for(let j=j0+1;j<j0+rh;j++)for(let i=i0;i<i0+rw;i++)hw[j*W+i]=0;
  if(pil)for(let j=j0+1;j<j0+rh;j++)for(let i=i0+1;i<i0+rw;i++)pc.push(i,j)}
 const L=new Float32Array(W*H).fill(1),dk=Math.round(W*H/260)+2;
 for(let k=0;k<dk;k++){const ci=rnd()*W,cj=rnd()*H,rr=2+rnd()*4;for(let j=Math.max(0,(cj-rr-1)|0);j<Math.min(H,cj+rr+2);j++)for(let i=Math.max(0,(ci-rr-1)|0);i<Math.min(W,ci+rr+2);i++){const d=Math.hypot(i+.5-ci,j+.5-cj)/rr;if(d<1)L[j*W+i]=Math.min(L[j*W+i],.16+.84*d*d)}}
 for(let c=0;c<W*H;c++)if(rnd()<.05)L[c]=Math.min(L[c],.62);
 const LV=new Float32Array((W+1)*(H+1));for(let j=0;j<=H;j++)for(let i=0;i<=W;i++){let s=0,n=0;for(let b=j-1;b<=j;b++)for(let a=i-1;a<=i;a++)if(a>=0&&b>=0&&a<W&&b<H){s+=L[b*W+a];n++}LV[j*(W+1)+i]=n?s/n:1}
 const touch=(i,j)=>(i>0&&hw[j*W+i-1])||(i<W&&hw[j*W+i])||(j>0&&vw[(j-1)*(W+1)+i])||(j<H&&vw[j*(W+1)+i]);
 const pil=[];for(let k=0;k<pc.length;k+=2){const i=pc[k],j=pc[k+1];if(!touch(i,j)&&!pil.some((q,x)=>x%2===0&&q===i&&pil[x+1]===j))pil.push(i,j)}
 return{N,W,H,hw,vw,L,LV,pil}}
function brLV(lx,lz){const W=BR.W,H=BR.H,LV=BR.LV;if(!LV)return 1;const fx=clamp(lx/BR.C,0,W-.001),fz=clamp(lz/BR.C,0,H-.001),i=fx|0,j=fz|0,u=fx-i,v=fz-j,R=W+1;
 return(LV[j*R+i]*(1-u)+LV[j*R+i+1]*u)*(1-v)+(LV[(j+1)*R+i]*(1-u)+LV[(j+1)*R+i+1]*u)*v}
function brLightAt(x,z){return brLV(x-BR.ox,z-BR.oz)}
function brSolidAt(x,z,pad){const C=BR.C,W=BR.W,H=BR.H,m=BR.m,lx=x-BR.ox,lz=z-BR.oz,h=BR.T/2+pad;if(lx<0||lz<0||lx>W*C||lz>H*C)return true;
 const i=Math.round(lx/C),j=Math.floor(lz/C);if(Math.abs(lx-i*C)<h&&j>=0&&j<H&&m.vw[j*(W+1)+i])return true;
 const j2=Math.round(lz/C),i2=Math.floor(lx/C);if(Math.abs(lz-j2*C)<h&&i2>=0&&i2<W&&m.hw[j2*W+i2])return true;return false}
/* câmera em 3ª pessoa: até onde dá para recuar a partir de (x,z) na direção (dx,dz) sem atravessar parede fina */
function brCamDist(x,z,dx,dz,max){for(let s=.2;s<=max;s+=.2)if(brSolidAt(x+dx*s,z+dz*s,.22))return Math.max(.3,s-.3);return max}
/* ---------- texturas (canvas) ---------- */
/* v3 r15: penumbra "aconchegante" (mesma ideia do shopping: luz calculada por pixel). Poça de luz sob cada luminária
   (2 por célula, em (.375,.375) e (.875,.875) da célula — onde o brCeilTex pinta os painéis), escurecendo entre elas e no pé
   das paredes; média ~1 para não perder o claro. A força segue a cor de vértice (zonas com luz apagada continuam apagadas). */
const BR_GLSL=`varying vec3 vBP;uniform float uBC;
float brPool(vec2 p,float s){vec2 q=fract(p/uBC)*uBC,a=vec2(.375,.375)*uBC,b=vec2(.875,.875)*uBC;float k=1./(s*s),g=0.;
 g+=exp(-dot(q-a,q-a)*k);g+=exp(-dot(q-b,q-b)*k);vec2 e=q-b+vec2(uBC,uBC);g+=exp(-dot(e,e)*k);e=q-b+vec2(uBC,0.);g+=exp(-dot(e,e)*k);e=q-b+vec2(0.,uBC);g+=exp(-dot(e,e)*k);
 e=q-a-vec2(uBC,0.);g+=exp(-dot(e,e)*k);e=q-a-vec2(0.,uBC);g+=exp(-dot(e,e)*k);return g;}`;
function brLitMat(map,kind){const m=new THREE.MeshBasicMaterial({map,vertexColors:true,fog:true});
 m.onBeforeCompile=sh=>{sh.uniforms.uBC={value:BR.C};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBP;').replace('#include <project_vertex>','#include <project_vertex>\nvBP=transformed;');
  const f=kind===0?'float g=brPool(vBP.xz,1.55);float lv=clamp(vColor.r*1.15,0.,1.);diffuseColor.rgb*=mix(1.,.72+.36*min(g,1.),lv);'
   :kind===1?'float g=brPool(vBP.xz,1.05);float lv=clamp(vColor.r*1.15,0.,1.);diffuseColor.rgb*=mix(1.,.8+.25*min(g,1.),lv);'
   :'float g=brPool(vBP.xz,1.9);float lv=clamp(vColor.r*1.15,0.,1.);float h=clamp(vBP.y/3.2,0.,1.);diffuseColor.rgb*=mix(1.,(.7+.32*min(g,1.))*(.84+.16*smoothstep(0.,.75,h))*(1.-.08*smoothstep(.86,1.,h)),lv);';
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n'+BR_GLSL).replace('#include <color_fragment>','#include <color_fragment>\n'+f)};
 m.customProgramCacheKey=()=>'brLit'+kind;return m}
function brTexFin(c){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function brWallTex(){const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#d2c374';g.fillRect(0,0,256,256);
 for(let x=0;x<256;x+=32){g.fillStyle='rgba(150,128,48,.2)';g.fillRect(x,0,3,256);g.fillStyle='rgba(255,250,200,.13)';g.fillRect(x+16,0,2,256)}
 g.fillStyle='rgba(118,102,42,.26)';for(let y=4;y<232;y+=12)for(let x=6;x<256;x+=32){const o=((y/12)|0)%2;g.fillRect(x+(o?5:0),y,2,2);g.fillRect(x+16+(o?0:5),y+6,2,2)}
 for(let k=0;k<2200;k++){g.fillStyle=Math.random()<.5?'rgba(255,255,220,.05)':'rgba(90,78,30,.07)';g.fillRect(Math.random()*256,Math.random()*256,2,2)}
 for(let k=0;k<4;k++){const x=Math.random()*256,y=120+Math.random()*100,gr=g.createRadialGradient(x,y,2,x,y,34);gr.addColorStop(0,'rgba(120,100,40,.2)');gr.addColorStop(1,'rgba(120,100,40,0)');g.fillStyle=gr;g.fillRect(x-34,y-34,68,68)}
 g.fillStyle='#8e7d45';g.fillRect(0,242,256,14);g.fillStyle='#6e6034';g.fillRect(0,240,256,3);g.fillStyle='rgba(255,245,190,.25)';g.fillRect(0,0,256,2);
 return brTexFin(c)}
function brFloorTex(){const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#a8975a';g.fillRect(0,0,256,256);
 for(let k=0;k<11000;k++){g.fillStyle=Math.random()<.5?'rgba(78,66,28,.11)':'rgba(222,206,140,.08)';g.fillRect((Math.random()*256)|0,(Math.random()*256)|0,1+((Math.random()*2)|0),1)}
 for(let k=0;k<3;k++){const x=Math.random()*256,y=Math.random()*256,r=14+Math.random()*30,gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,'rgba(90,74,30,.22)');gr.addColorStop(1,'rgba(90,74,30,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
 return brTexFin(c)}
function brCeilTex(){const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#d9d09c';g.fillRect(0,0,256,256);
 for(let k=0;k<5000;k++){g.fillStyle=Math.random()<.5?'rgba(120,110,70,.10)':'rgba(255,255,230,.08)';g.fillRect((Math.random()*256)|0,(Math.random()*256)|0,1,1)}
 g.fillStyle='#a99f6a';for(let k=0;k<256;k+=64){g.fillRect(k,0,2,256);g.fillRect(0,k,256,2)}
 for(const[tx,ty]of[[1,1],[3,3]]){const x=tx*64+5,y=ty*64+14;g.fillStyle='#bdb27c';g.fillRect(x-2,y-2,58,40);g.fillStyle='#fffdf0';g.fillRect(x,y,54,36);g.fillStyle='#ffffff';g.fillRect(x+4,y+4,46,28)}
 return brTexFin(c)}
/* ---------- montagem ---------- */
function brGeo(){return{p:[],u:[],c:[],ix:[],n:0}}
function brQ(G,ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz,ua,va,ub,vb,uc,vc,ud,vd,ka,kb,kc,kd){const n=G.n;G.p.push(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz);G.u.push(ua,va,ub,vb,uc,vc,ud,vd);
 G.c.push(ka,ka*.97,ka*.8,kb,kb*.97,kb*.8,kc,kc*.97,kc*.8,kd,kd*.97,kd*.8);G.ix.push(n,n+1,n+2,n,n+2,n+3);G.n+=4}
function brMesh(G,mat){if(!G.n)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(G.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(G.u,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(G.c,3));g.setIndex(G.n>65535?new THREE.Uint32BufferAttribute(G.ix,1):new THREE.Uint16BufferAttribute(G.ix,1));g.computeBoundingSphere();
 const m=new THREE.Mesh(g,mat);m.matrixAutoUpdate=false;m.updateMatrix();return m}
/* caixa de parede (local) → faces laterais com papel de parede; e0/e1 = emitir tampa da ponta (só na ponta de verdade) */
function brWallBox(G,x0,z0,x1,z1,alongX,e0,e1){const h=BR.HC,U=2.2,k00=brLV(x0,z0),k10=brLV(x1,z0),k01=brLV(x0,z1),k11=brLV(x1,z1),B=.66;
 if(alongX){const ua=x0/U,ub=x1/U;
  brQ(G,x0,0,z1,x1,0,z1,x1,h,z1,x0,h,z1,ua,0,ub,0,ub,1,ua,1,k01*B,k11*B,k11,k01);
  brQ(G,x1,0,z0,x0,0,z0,x0,h,z0,x1,h,z0,ub,0,ua,0,ua,1,ub,1,k10*B,k00*B,k00,k10);
  if(e1)brQ(G,x1,0,z1,x1,0,z0,x1,h,z0,x1,h,z1,z1/U,0,z0/U,0,z0/U,1,z1/U,1,k11*B,k10*B,k10,k11);
  if(e0)brQ(G,x0,0,z0,x0,0,z1,x0,h,z1,x0,h,z0,z0/U,0,z1/U,0,z1/U,1,z0/U,1,k00*B,k01*B,k01,k00)}
 else{const ua=z0/U,ub=z1/U;
  brQ(G,x1,0,z1,x1,0,z0,x1,h,z0,x1,h,z1,ub,0,ua,0,ua,1,ub,1,k11*B,k10*B,k10,k11);
  brQ(G,x0,0,z0,x0,0,z1,x0,h,z1,x0,h,z0,ua,0,ub,0,ub,1,ua,1,k00*B,k01*B,k01,k00);
  if(e1)brQ(G,x0,0,z1,x1,0,z1,x1,h,z1,x0,h,z1,x0/U,0,x1/U,0,x1/U,1,x0/U,1,k01*B,k11*B,k11,k01);
  if(e0)brQ(G,x1,0,z0,x0,0,z0,x0,h,z0,x1,h,z0,x1/U,0,x0/U,0,x0/U,1,x1/U,1,k10*B,k00*B,k00,k10)}
 const tk=.55;brQ(G,x0,h,z0,x0,h,z1,x1,h,z1,x1,h,z0,.5,.99,.5,.99,.5,.99,.5,.99,tk,tk,tk,tk)}
function brBuild(){const key=S.seed+'|'+(city.N||7)+'|'+(city.worldNo||0);if(BR.built===key&&BR.grp)return;
 if(BR.grp)brReset();const m=brGen(),C=BR.C,T=BR.T,W=m.W,H=m.H,hw=m.hw,vw=m.vw,NC=m.N;BR.m=m;BR.W=W;BR.H=H;BR.LV=m.LV;
 const hcov=(i,j)=>(i>0&&hw[j*W+i-1])||(i<W&&hw[j*W+i]),vUp=(i,j)=>j>0&&vw[(j-1)*(W+1)+i],vDn=(i,j)=>j<H&&vw[j*(W+1)+i];
 const boxes=[]; /* [x0,z0,x1,z1,alongX,e0,e1] em coordenadas locais */
 for(let j=0;j<=H;j++){let i=0;while(i<W){if(!hw[j*W+i]){i++;continue}let e=i;while(e<W&&hw[j*W+e])e++;let a=i;
   while(a<e){const b=Math.min(e,(Math.floor(a/6)+1)*6);boxes.push(a*C-(a===i?T/2:0),j*C-T/2,b*C+(b===e?T/2:0),j*C+T/2,1,a===i?1:0,b===e?1:0);a=b}i=e}}
 for(let i=0;i<=W;i++){let j=0;while(j<H){if(!vw[j*(W+1)+i]){j++;continue}let e=j+1;while(e<H&&vw[e*(W+1)+i]&&!hcov(i,e)&&e%6!==0)e++;
   const capA=!hcov(i,j)&&!vUp(i,j),capB=!hcov(i,e)&&!vDn(i,e),z0=j*C+(hcov(i,j)?T/2:capA?-T/2:0),z1=e*C-(hcov(i,e)?T/2:capB?-T/2:0);
   if(z1>z0+.01)boxes.push(i*C-T/2,z0,i*C+T/2,z1,0,capA?1:0,capB?1:0);j=e}}
 for(let k=0;k<m.pil.length;k+=2){const x=m.pil[k]*C,z=m.pil[k+1]*C;boxes.push(x-.45,z-.45,x+.45,z+.45,2,1,1)}
 BR.boxes=boxes;
 const tw=brWallTex(),tf=brFloorTex(),tc=brCeilTex();BR.texs=[tw,tf,tc];
 BR.mats={w:brLitMat(tw,2),f:brLitMat(tf,0),c:brLitMat(tc,1)};
 BR.fog=new THREE.Fog(0x5c5330,7,52);BR.bg=new THREE.Color(0x2e2914);
 const grp=new THREE.Group();grp.position.set(BR.ox,0,BR.oz);grp.updateMatrix();grp.matrixAutoUpdate=false;grp.visible=false;scene.add(grp);BR.grp=grp;
 const GW=[],CH=[];for(let k=0;k<NC*NC;k++)GW.push(brGeo());
 for(let b=0;b<boxes.length;b+=7){const x0=boxes[b],z0=boxes[b+1],x1=boxes[b+2],z1=boxes[b+3],kd=boxes[b+4],ci=clamp(Math.floor((x0+x1)/2/(6*C)),0,NC-1),cj=clamp(Math.floor((z0+z1)/2/(6*C)),0,NC-1);
  const G=GW[cj*NC+ci];if(kd===2)brWallBox(G,x0,z0,x1,z1,true,1,1);else brWallBox(G,x0,z0,x1,z1,kd===1,boxes[b+5],boxes[b+6])}
 const HC=BR.HC;
 for(let cj=0;cj<NC;cj++)for(let ci=0;ci<NC;ci++){const gf=brGeo(),gc=brGeo();
  for(let j=cj*6;j<cj*6+6;j++)for(let i=ci*6;i<ci*6+6;i++){const x0=i*C,x1=x0+C,z0=j*C,z1=z0+C,R=W+1,a=m.LV[j*R+i],b=m.LV[(j+1)*R+i],c=m.LV[(j+1)*R+i+1],d=m.LV[j*R+i+1],F=.92,U=2.5;
   brQ(gf,x0,0,z0,x0,0,z1,x1,0,z1,x1,0,z0,x0/U,z0/U,x0/U,z1/U,x1/U,z1/U,x1/U,z0/U,a*F,b*F,c*F,d*F);
   brQ(gc,x0,HC,z0,x1,HC,z0,x1,HC,z1,x0,HC,z1,0,1,1,1,1,0,0,0,a,d,c,b)}
  const g=new THREE.Group();g.matrixAutoUpdate=false;const mw=brMesh(GW[cj*NC+ci],BR.mats.w),mf=brMesh(gf,BR.mats.f),mc=brMesh(gc,BR.mats.c);
  for(const o of[mw,mf,mc])if(o)g.add(o);g.visible=false;grp.add(g);CH.push(g)}
 BR.chunks=CH;
 {const cc=curChunk;curChunk=null;try{for(let b=0;b<boxes.length;b+=7)addCol(BR.ox+boxes[b],BR.oz+boxes[b+1],BR.ox+boxes[b+2],BR.oz+boxes[b+3],'rock')}finally{curChunk=cc}}
 BR.dist=new Int32Array(W*H);BR.bq=new Int32Array(W*H);BR.built=key;BR.ckey=-1}
/* pedaços visíveis: só os perto da câmera (troca só quando a câmera muda de pedaço) */
function brChunkCull(){if(!BR.chunks.length)return;const top=camMode==='top',cx=top?camT.x:camera.position.x,cz=top?camT.z:camera.position.z,S6=6*BR.C,NC=BR.m.N,
 ci=Math.floor((cx-BR.ox)/S6),cj=Math.floor((cz-BR.oz)/S6),rr=top?3:2,key=(ci+64)*4096+(cj+64)*8+rr;if(key===BR.ckey)return;BR.ckey=key;
 for(let j=0;j<NC;j++)for(let i=0;i<NC;i++)BR.chunks[j*NC+i].visible=Math.abs(i-ci)<=rr&&Math.abs(j-cj)<=rr}
/* ---------- mapa ---------- */
function brCellOf(x,z){const i=Math.floor((x-BR.ox)/BR.C),j=Math.floor((z-BR.oz)/BR.C);return i<0||j<0||i>=BR.W||j>=BR.H?-1:j*BR.W+i}
function brIsExit(c){const e=BR.exit;if(!e||c<0)return false;const i=c%BR.W,j=(c/BR.W)|0;return e.ax===0?j===e.j&&i>=e.i&&i<e.i+e.n:i===e.i&&j>=e.j&&j<e.j+e.n}
function brExitRect(){const e=BR.exit,C=BR.C;if(!e)return null;return e.ax===0?[e.i*C,e.j*C,e.n*C,C]:[e.i*C,e.j*C,C,e.n*C]}
function brMapPaint(){const m=BR.m;if(!m)return;const K=2,C=BR.C,W=m.W,H=m.H,c=BR.mapCv||(BR.mapCv=document.createElement('canvas'));c.width=W*C*K;c.height=H*C*K;const g=c.getContext('2d');
 g.fillStyle='#c4b260';g.fillRect(0,0,W*C*K,H*C*K);
 g.fillStyle='#3a2f10';const b=BR.boxes;for(let q=0;q<b.length;q+=7)g.fillRect(b[q]*K,b[q+1]*K,Math.max(1.4,(b[q+2]-b[q])*K),Math.max(1.4,(b[q+3]-b[q+1])*K))}
function brMiniMap(g,p,rot,w,h){if(!BR.mapCv)return false;const k=2.6,Sz=BR.W*BR.C;g.fillStyle='#14110a';g.fillRect(0,0,w,h);g.save();g.translate(w/2,h/2);g.rotate(rot);g.scale(k,k);g.translate(-p.x,-p.z);g.imageSmoothingEnabled=false;
 g.drawImage(BR.mapCv,BR.ox,BR.oz,Sz,BR.H*BR.C);{const r=brExitRect();if(r)brGlitchRect(g,BR.ox+r[0],BR.oz+r[1],r[2],r[3],.4)}
 for(const e of BR.ents){if(Math.abs(e.x-p.x)>34||Math.abs(e.z-p.z)>34)continue;g.fillStyle=(simT*6|0)%2?'#ff2a2a':'#a01010';g.beginPath();g.arc(e.x,e.z,1.3,0,7);g.fill()}
 if(brNetOn())for(const q of ONLINE.peers.values()){const b=q.br;if(!b||Math.abs(b.x-p.x)>34||Math.abs(b.z-p.z)>34)continue;g.fillStyle='#000';g.beginPath();g.arc(b.x,b.z,1.5,0,7);g.fill();g.fillStyle=netPeerCol(q);g.beginPath();g.arc(b.x,b.z,1.1,0,7);g.fill()} /* r14: outros jogadores só por perto */
 g.restore();return true}
function brBigDraw(g,W,H){const Sz=BR.W*BR.C,Hz=BR.H*BR.C,sc=Math.min(W*.92/Sz,H*.8/Hz),ox=(W-Sz*sc)/2,oy=(H-Hz*sc)/2+H*.04;g.fillStyle='#0b0906';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=false;
 if(BR.mapCv)g.drawImage(BR.mapCv,ox,oy,Sz*sc,Hz*sc);/* v3 r13: a saída NÃO aparece no mapa grande (pedido do José); só no minimapa */playerArrow(g,ox+(PL.x-BR.ox)*sc,oy+(PL.z-BR.oz)*sc,1.6);
 const fs=H<500?22:30;g.save();g.font='800 '+fs+'px Fredoka, Arial Black, sans-serif';g.textBaseline='top';g.lineWidth=5;g.strokeStyle='#000';g.fillStyle='#f2dc72';g.strokeText('BACKROOMS',14,12);g.fillText('BACKROOMS',14,12);
 const sub=translatePlain('NÍVEL 0');g.font='700 '+Math.round(fs*.5)+'px Segoe UI, Arial, sans-serif';g.lineWidth=3;g.strokeText(sub,15,16+fs);g.fillStyle='#fff';g.fillText(sub,15,16+fs);g.restore();NAV.icons=[]}
/* falha no mapa: faixas coloridas/pretas sorteadas a cada 110 ms sobre um retângulo (sem lixo por quadro); u = 1 m na escala atual */
function brGlitchRect(g,x0,z0,w,h,u){const pd=4+6*u;x0-=pd;z0-=pd;w+=pd*2;h+=pd*2;let s=((Math.floor(performance.now()/110)+7)*2654435761)>>>0;
 g.save();for(let k=0;k<9;k++){s=(s*1664525+1013904223)>>>0;const y=z0+(s/4294967296)*h;s=(s*1664525+1013904223)>>>0;const hh=u*2+(s/4294967296)*h*.25;s=(s*1664525+1013904223)>>>0;const dx=((s/4294967296)-.5)*w*.35;s=(s*1664525+1013904223)>>>0;
  g.globalAlpha=.55+.45*(s/4294967296);g.fillStyle=BR_GLC[s%BR_GLC.length];g.fillRect(x0+dx,y,w,hh)}
 g.restore()}
function brMapGlitch(g,sc){} /* v3 r16: sem falha no mapa (a entrada agora é o buraco da obra, que já aparece como obra) */
/* ---------- efeito de tela e carregamento ---------- */
function brCss(){if(document.getElementById('brCss'))return;const st=document.createElement('style');st.id='brCss';st.textContent=
 '#brFx{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 4px)}'+
 '#brFx::before,#brFx::after{content:"";position:absolute;left:-6%;right:-6%;top:28%;height:13%;background:linear-gradient(90deg,rgba(255,0,140,.42),rgba(0,255,230,.42) 55%,rgba(255,240,0,.3));mix-blend-mode:screen;animation:brTear .7s steps(5) infinite}'+
 '#brFx::after{top:63%;height:5%;animation-duration:1.15s;animation-direction:reverse}'+
 '@keyframes brTear{0%{transform:translate(0,0)}20%{transform:translate(-3%,-190%)}40%{transform:translate(4%,95%)}60%{transform:translate(-2%,270%)}80%{transform:translate(3%,-70%)}100%{transform:translate(0,150%)}}'+
 '#brLoad{position:fixed;inset:0;z-index:60;background:#1b1709;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#f2dc72;font-family:"Courier New",monospace;opacity:1;transition:opacity .5s ease}'+
 '#brLoad[hidden]{display:none}#brLoad .brl-t{font:800 clamp(30px,7vw,64px) Fredoka,"Arial Black",sans-serif;letter-spacing:.06em;text-shadow:3px 0 #ff2a8a,-3px 0 #2affea;animation:brJit .18s steps(2) infinite}'+
 '#brLoad .brl-s{font-size:15px;letter-spacing:.3em;opacity:.85}#brLoad .brl-b{width:min(320px,70vw);height:6px;background:#3a3214;margin-top:12px}#brLoad .brl-b i{display:block;height:100%;width:0;background:#f2dc72;transition:width .25s}'+
 '@keyframes brJit{0%{transform:translate(0,0)}50%{transform:translate(1px,-1px)}}';document.head.appendChild(st)}
function brFxSet(v){v=Math.round(clamp(v,0,1)*20)/20;if(v===BR.fxV)return;BR.fxV=v;if(!BR.fxEl){if(!v)return;brCss();const d=document.createElement('div');d.id='brFx';d.setAttribute('aria-hidden','true');document.body.appendChild(d);BR.fxEl=d}BR.fxEl.style.opacity=String(v)}
function brLoadShow(on,t,s){brCss();let d=BR.ldEl;if(!d){d=document.createElement('div');d.id='brLoad';d.hidden=true;d.innerHTML='<div class="brl-t"></div><div class="brl-s"></div><div class="brl-b"><i></i></div>';document.body.appendChild(d);BR.ldEl=d}
 if(on){d.querySelector('.brl-t').textContent=t||'';d.querySelector('.brl-s').textContent=translatePlain(s||'');d.querySelector('i').style.width='0%';d.style.transition='none';d.style.opacity='1';d.hidden=false}
 else{d.style.transition='opacity .5s ease';d.style.opacity='0';setTimeout(()=>{if(d.style.opacity==='0')d.hidden=true},520)}}
function brLoadBar(p){if(BR.ldEl)BR.ldEl.querySelector('i').style.width=Math.round(p*100)+'%'}
function brHum(on){if(!AC||!master)return;try{if(on&&!BR.hum){const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=60;o2.type='square';o2.frequency.value=120.4;f.type='lowpass';f.frequency.value=360;g.gain.value=0;
  o.connect(f);o2.connect(f);f.connect(g);g.connect(master);o.start();o2.start();g.gain.setTargetAtTime(.02,AC.currentTime,.8);BR.hum={o,o2,g}}
 else if(!on&&BR.hum){const h=BR.hum,t=AC.currentTime;BR.hum=null;h.g.gain.setTargetAtTime(0,t,.08);h.o.stop(t+.5);h.o2.stop(t+.5)}}catch(e){BR.hum=null}}
/* ---------- entrada pelo quarteirão ---------- */
function brWorldTick(dt){if(BR.on&&PL.inside!=='backrooms'&&!BR.busy)brLeave(); /* morreu/saiu por outro caminho */
 if(BR.busy||BR.on||S.style!=='modern'||city.haze)return;
 const H=brHole();if(!H||!brOK())return;
 const inS=!PL.car&&!PL.heli&&!PL.inside&&!(brNetOn()&&ONLINE.ride)&&!PL.dead&&!PL.taxi&&!SKATE.ride&&!PARA.active&&!(PL.down>0)&&!(LH.up||LH.fall);
 /* v3 r16: pisou (ou caiu do pulo) no miolo do buraco → atravessa o chão na hora */
 if(inS&&!(PL.jy>.05)&&Math.hypot(PL.x-H.x,PL.z-H.z)<1.05){PL.x+=(H.x-PL.x)*.5;PL.z+=(H.z-PL.z)*.5;brFall()}}
async function brFall(){if(BR.busy||PL.dead)return;BR.busy=true;BR.fall=true;BR.fv=0;BR.fallT=0;BR.fx=PL.x;BR.fz=PL.z;PL.vx=PL.vz=0;PL.jy=PL.jv=0;brFxSet(.45);try{ghostSnd(1.1)}catch(e){}rumble(.6,.6,500);
 await brWait(1500);brLoadShow(true,'BACKROOMS','NÍVEL 0');await brWait(80);brLoadBar(.15);
 try{brBuild()}catch(e){console.error('Backrooms:',e);BR.fall=false;PL.gy=groundY(PL.x,PL.z);brLoadShow(false);brFxSet(0);BR.busy=false;return}
 brLoadBar(.65);await brWait(200);BR.exitT=180;BR.exitK=brNetOn()?-2:-1;
 if(POL.wanted)try{endWanted(true,true)}catch(e){}
 BR.on=true;BR.t=0;BR.entT=0;BR.lastCell=-1;BR.fall=false;BR.grp.visible=true;
 const c=brSpawnCell();PL.x=BR.ox+(c%BR.W+.5)*BR.C;PL.z=BR.oz+(((c/BR.W)|0)+.5)*BR.C;PL.gy=0;PL.jy=PL.jv=0;PL.vx=PL.vz=0;PL.inside='backrooms';AREAHUD.zoneT=0;AREAHUD.vehT=0;try{areaHudTick(0)}catch(e){}
 brPickExit(c);brMapPaint();camT.x=PL.x;camT.z=PL.z;BR.ckey=-1;brChunkCull();try{updateCamera(0,true)}catch(e){}
 brLoadBar(1);await brWait(450);brFxSet(0);brHum(true);brLoadShow(false);BR.busy=false;
 toast('<span style="color:#f2dc72">BACKROOMS</span>')}
function brSpawnCell(){const W=BR.W,H=BR.H,m=BR.m;for(let k=0;k<200;k++){const c=(Math.random()*W*H)|0;if(m.L[c]>.85)return c}return((H/2)|0)*W+((W/2)|0)}
/* corredor de saída: trecho reto (paredes dos dois lados) de 3–5 células, longe de onde o jogador caiu */
/* v3 r11: saída = trecho reto de 3 células andáveis (sem parede no meio), sorteado longe do jogador (afrouxa se não achar), nunca o mesmo de antes */
function brPickExit(pc,rnd){const m=BR.m,W=m.W,H=m.H,hw=m.hw,vw=m.vw,net=!!rnd,rn=rnd||Math.random,pi=net?-999:pc%W,pj=net?-999:(pc/W)|0,far=Math.max(8,(W*.35)|0),e0=net?null:BR.exit;let fb=null; /* rnd = sorteio compartilhado do online (sem depender de onde o jogador está) */
 for(let k=0;k<400;k++){const ax=rn()<.5?0:1,i=1+((rn()*(W-(ax===0?4:2)))|0),j=1+((rn()*(H-(ax===1?4:2)))|0);
  let ok=true;for(let q=0;q<2&&ok;q++)ok=ax===0?!vw[j*(W+1)+i+q+1]:!hw[(j+q+1)*W+i];if(!ok)continue;
  if(e0&&e0.ax===ax&&Math.abs(e0.i-i)<3&&Math.abs(e0.j-j)<3)continue;const dd=Math.abs(i+(ax===0?1:0)-pi)+Math.abs(j+(ax===1?1:0)-pj);
  if(dd>=(k<300?far:5)){BR.exit={ax,i,j,n:3};return}if(!fb&&dd>=3)fb={ax,i,j,n:3}}
 BR.exit=fb||{ax:0,i:Math.max(1,Math.min(W-4,pi-1)),j:pj,n:3}}
/* online (r14): outros jogadores no Nível 0. O labirinto é o mesmo (seed da sala); cada um vê os que estão lá (s.wk==='backrooms').
   Boneco próprio (makeCharacter + placeSprite), fora dos peds da cidade; some ao sair/cair fora/desconectar. Entidades continuam locais. */
function brNetTick(dt){const k=1-Math.exp(-dt*12),fr=Math.floor(simT*6)%3;
 for(const p of ONLINE.peers.values()){const s=p.s,show=!!s&&s.wk==='backrooms'&&!s.w&&s.st!=='dead'&&Number.isFinite(s.x)&&Number.isFinite(s.z);let b=p.br;
  if(!show){if(b)brNetDrop(p);continue}
  if(!b){const ch=makeCharacter({...(p.look||PLAYER_PAL),pack:false});b=p.br={x:s.x,z:s.z,gy:0,jy:0,rot:0,sp:ch.sp,sh:ch.sh,tex:ch.tex,mx:1,mz:0}}
  if(Math.abs(s.x-b.x)+Math.abs(s.z-b.z)>12){b.x=s.x;b.z=s.z}else{b.x+=(s.x-b.x)*k;b.z+=(s.z-b.z)*k}
  b.mx=Math.cos(s.f||0);b.mz=Math.sin(s.f||0);placeSprite(b);setFrame(b.tex,pickDir(b.mx,b.mz,b.x,b.z),s.m?fr:0);
  const tag=netTag(p),dx=b.x-camera.position.x,dz=b.z-camera.position.z;tag.visible=dx*dx+dz*dz<40*40;tag.position.set(b.x,2.05,b.z)}}
function brNetDrop(p){const b=p.br;if(!b)return;p.br=null;scene.remove(b.sp);scene.remove(b.sh);b.sp.material.dispose();charTexRelease(b.tex);b.sh.geometry.dispose();b.sh.material.dispose();if(p.tag)p.tag.visible=false}
function brNetClear(){if(typeof ONLINE==='undefined'||!ONLINE.peers)return;for(const p of ONLINE.peers.values())if(p.br)brNetDrop(p)}
/* queda (entrada e saída): câmera abaixo e atrás do jogador olhando para cima — o chão some (só tem face de cima) e o mundo fica
   pendurado lá em cima, tremendo; gravidade igual à queda do farol (26 m/s²) em worldPlGy */
function brFallCam(dt){const f=PL.face||[0,1],t=BR.fallT||0,back=3.6+t*1.6;setLens(80,.1);camera.up.set(0,1,0);
 camera.position.set(PL.x-f[0]*back,PL.gy-1.4-t*1.5,PL.z-f[1]*back);camera.lookAt(PL.x+f[0]*1.2,PL.gy+5+t*6,PL.z+f[1]*1.2);
 if(Math.random()<.35)camera.rotateZ((Math.random()-.5)*.09);PL.sp.visible=true;sky.position.copy(camera.position);
 brFxSet(Math.random()<.3?.75:.35)}
/* ---------- dentro (roomStageLocalTick) ---------- */
function brInsideTick(dt){if(!BR.on||!BR.m)return;BR.t+=dt;
 const top=camMode==='top';if(BR.fog){BR.fog.near=top?70:7;BR.fog.far=top?170:52}
 brChunkCull();
 BR.flT-=dt;if(BR.flT<=0){BR.flT=.05+Math.random()*(Math.random()<.12?.15:2.5);BR.flick=Math.random()<.16?.8+Math.random()*.12:1;if(BR.mats){BR.mats.c.color.setScalar(BR.flick);BR.mats.w.color.setScalar(.96+.04*BR.flick);BR.mats.f.color.setScalar(.96+.04*BR.flick)}}
 brEntTick(dt);
 if(brNetOn()){const k=Math.floor(Date.now()/180000);if(k!==BR.exitK){BR.exitK=k;brPickExit(-1,mulberry32(((S.seed^0x51ed270b)+Math.imul(k+1,2654435761))>>>0))}BR.exitT=180-(Date.now()/1000)%180;brNetTick(dt)} /* r14: online = mesma saída para todos, troca a cada 3 min de relógio */
 else{if(BR.exitK!==-1){BR.exitK=-1;brPickExit(brCellOf(PL.x,PL.z))}BR.exitT-=dt;if(BR.exitT<=0){BR.exitT=180;brPickExit(brCellOf(PL.x,PL.z))}} /* v3 r11: troca a cada 3 min (3 h) */
 if(!BR.busy&&!PL.dead){const c=brCellOf(PL.x,PL.z);if(brIsExit(c)&&Math.hypot(PL.vx,PL.vz)>1&&Math.random()<dt*.3)brClipOut()}}
async function brClipOut(){if(BR.busy)return;BR.busy=true;BR.fall=true;BR.fv=0;BR.fallT=0;BR.fx=PL.x;BR.fz=PL.z;PL.vx=PL.vz=0;PL.jy=PL.jv=0;brFxSet(.45);try{ghostSnd(.9)}catch(e){}rumble(.5,.5,400);
 await brWait(1500);brLoadShow(true,'SUNSET SHORES','DE VOLTA À REALIDADE');await brWait(120);brLoadBar(.4);
 brLeave();const pt=brCityPoint();BR.fall=false;
 if(pt){PL.x=pt.x;PL.z=pt.z}else{const s=city.safe||{x:city.ext/2,z:city.ext/2};PL.x=s.x;PL.z=s.z}
 PL.gy=groundY(PL.x,PL.z);PL.jy=PL.jv=0;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z;BR.segK=-1;
 await brWait(300);brLoadBar(1);try{updateCamera(0,true)}catch(e){}await brWait(250);brFxSet(0);brLoadShow(false);BR.busy=false}
function brLeave(){brEntClear();try{brNetClear()}catch(e){}brHum(false);brFxSet(0);BR.on=false;BR.exit=null;if(BR.grp)BR.grp.visible=false;if(PL.inside==='backrooms')PL.inside=false}
function brCityPoint(){const n=city.rects.length;for(let k=0;k<80;k++){const ri=(Math.random()*n)|0,r=city.rects[ri];if(!r)continue;const pt=perimPoint(perim(ri),Math.random()*400),x=pt[0],z=pt[1];
  if(inWater(x,z)||isRural(x,z)||brInBlock(x,z,40))continue;if(query(x,z,1).some(c=>!c.dead&&x>c.x0-.6&&x<c.x1+.6&&z>c.z0-.6&&z<c.z1+.6))continue;return{x,z}}return null}
/* ---------- entidades (depois de 10 min) ---------- */
function brEntCanvas(){if(BR.entCv)return BR.entCv;const d3=S.sprite8===true;let src;
 if(d3)src=atlas8Canvas({...DEMO_PAL},16,2);else{const t=demoRedAtlas({...DEMO_PAL});src=t.image;t.dispose()}
 const c=cv(src.width,src.height),g=c.getContext('2d'),W=c.width,H=c.height,px=d3?2:1;g.drawImage(src,0,0);
 for(let k=0;k<H/(d3?7:5);k++){const y=(Math.random()*H)|0,h=px*(1+((Math.random()*3)|0)),dx=px*Math.round((Math.random()-.5)*7);if(!dx)continue;const im=g.getImageData(0,y,W,h);g.clearRect(0,y,W,h);g.putImageData(im,dx,y)}
 const im=g.getImageData(0,0,W,H),d=im.data;let row=-1,sw=false;for(let i=0;i<d.length;i+=4){const y=((i/4)/W)|0;if(y!==row){row=y;sw=Math.random()<.06}if(d[i+3]<30)continue;
  if(sw){const r=d[i];d[i]=d[i+2];d[i+2]=r}else{d[i]=d[i]*.85;d[i+1]=d[i+1]*.8+12;d[i+2]=d[i+2]*.8}if(Math.random()<.01){d[i]=40;d[i+1]=255;d[i+2]=230}}
 g.putImageData(im,0,0);BR.entCv=c;return c}
function brEntSpawn(){brDistField();const W=BR.W,H=BR.H,D=BR.dist;let cell=-1;for(let k=0;k<120;k++){const c=(Math.random()*W*H)|0;if(D[c]>=14&&D[c]<=42){cell=c;break}}if(cell<0)return;
 const c=brEntCanvas(),d3=S.sprite8===true;let tex;
 if(d3)tex=atlas8NewTex(c,16,null);else{tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.repeat.set(.25,.25)}
 const sp=makeActorLitSprite(tex);sp.userData.actorTint.set(0xffffff);sp.material.alphaTest=.03;sp.material.needsUpdate=true;
 const gh=[0xff2a8a,0x2affea].map(col=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,fog:true}));s.center.set(.5,0);s.layers.set(1);s.position.set(0,-9999,0);scene.add(s);return s});
 const x=BR.ox+(cell%W+.5)*BR.C,z=BR.oz+(((cell/W)|0)+.5)*BR.C;
 BR.ents.push({x,z,vx:0,vz:0,sp,gh,tex,ph:Math.random()*6,hit:0,gl:0,fx:0,fz:1});
 if(BR.ents.length===1)toast('<span style="color:#ff5a5a">VOCÊ NÃO ESTÁ SOZINHO</span>');try{ghostSnd(.7)}catch(e){}}
function brEntClear(){for(const e of BR.ents){scene.remove(e.sp);e.sp.material.dispose();for(const s of e.gh){scene.remove(s);s.material.dispose()}if(e.tex.isAtlas8)charTexRelease(e.tex);else e.tex.dispose()}BR.ents.length=0}
function brDistField(){const W=BR.W,H=BR.H,D=BR.dist,Q=BR.bq,m=BR.m,hw=m.hw,vw=m.vw,pc=brCellOf(PL.x,PL.z);D.fill(-1);if(pc<0)return;let h=0,t=0;D[pc]=0;Q[t++]=pc;
 while(h<t){const c=Q[h++],i=c%W,j=(c/W)|0,d=D[c]+1;
  if(j>0&&!hw[j*W+i]&&D[c-W]<0){D[c-W]=d;Q[t++]=c-W}if(j<H-1&&!hw[(j+1)*W+i]&&D[c+W]<0){D[c+W]=d;Q[t++]=c+W}
  if(i>0&&!vw[j*(W+1)+i]&&D[c-1]<0){D[c-1]=d;Q[t++]=c-1}if(i<W-1&&!vw[j*(W+1)+i+1]&&D[c+1]<0){D[c+1]=d;Q[t++]=c+1}}
 BR.distC=pc}
function brEntTick(dt){if(BR.t>=600){BR.entT-=dt;if(BR.entT<=0){BR.entT=45;if(BR.ents.length<5)brEntSpawn()}}
 if(!BR.ents.length)return;
 BR.distT-=dt;if(BR.distT<=0||brCellOf(PL.x,PL.z)!==BR.distC){BR.distT=.5;brDistField()}
 const W=BR.W,m=BR.m,hw=m.hw,vw=m.vw,D=BR.dist,C=BR.C,e0=camera.matrixWorld.elements,pc=BR.distC;let near=99;
 for(const e of BR.ents){e.ph+=dt;e.hit=Math.max(0,e.hit-dt);const c=brCellOf(e.x,e.z);let tx=PL.x,tz=PL.z;
  if(c>=0&&c!==pc&&D[c]>0){const i=c%W,j=(c/W)|0;let best=D[c],bc=-1;
   if(j>0&&!hw[j*W+i]&&D[c-W]>=0&&D[c-W]<best){best=D[c-W];bc=c-W}if(j<BR.H-1&&!hw[(j+1)*W+i]&&D[c+W]>=0&&D[c+W]<best){best=D[c+W];bc=c+W}
   if(i>0&&!vw[j*(W+1)+i]&&D[c-1]>=0&&D[c-1]<best){best=D[c-1];bc=c-1}if(i<W-1&&!vw[j*(W+1)+i+1]&&D[c+1]>=0&&D[c+1]<best){best=D[c+1];bc=c+1}
   if(bc>=0){tx=BR.ox+(bc%W+.5)*C;tz=BR.oz+(((bc/W)|0)+.5)*C}}
  const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz)||1,spd=PL.dead?0:2.3*(.75+.5*Math.max(0,Math.sin(e.ph*2.3)));
  if(l>.6){e.x+=dx/l*spd*dt;e.z+=dz/l*spd*dt;e.fx=dx/l;e.fz=dz/l}circleVsWorld(e,.42);
  const dp=Math.hypot(PL.x-e.x,PL.z-e.z);if(dp<near)near=dp;
  if(dp<1.25&&e.hit<=0&&!PL.dead&&!BR.busy){e.hit=1.5;PL.hp-=armorHit(20);rumble(.7,.45,300);try{ghostSnd(1.3)}catch(er){}toast('<span style="color:#ff5555">ENTIDADE · −20 HP</span>');if(PL.hp<=0){killPlayer('PEGO POR UMA ENTIDADE');PL.deadT=1.2}}
  /* falhas: tremida, esticão, rasgo RGB */
  e.gl-=dt;if(e.gl<=0&&Math.random()<dt*1.6)e.gl=.05+Math.random()*.18;const gl=e.gl>0,jx=gl?(Math.random()-.5)*.5:0,sy=2.75+Math.sin(e.ph*7.3)*.08+(gl?(Math.random()-.5)*.3:0),sx=(e.tex.isAtlas8?1.95:2.1)*(1+Math.sin(e.ph*3.1)*.08)+(gl?Math.random()*.6:0);
  const x=e.x+e0[0]*jx,z=e.z+e0[2]*jx;e.sp.position.set(x,0,z);e.sp.scale.set(sx,Math.min(3.05,sy),1);e.sp.material.rotation=gl?(Math.random()-.5)*.35:Math.sin(e.ph*1.7)*.05;
  for(let k=0;k<2;k++){const s=e.gh[k],o=(k?-1:1)*(gl?.16+Math.random()*.2:.07);s.position.set(x+e0[0]*o,0,z+e0[2]*o);s.scale.copy(e.sp.scale);s.material.rotation=e.sp.material.rotation;s.material.opacity=gl?.55:.28}
  setFrame(e.tex,pickDir(e.fx,e.fz,e.x,e.z),Math.floor(e.ph*3)%3)}
 }
window.brDebug={enter:()=>{const b=brHole();if(!b)return'sem obra';PL.x=b.x;PL.z=b.z;return brFall()},out:()=>brClipOut(),time:s=>{BR.t=s;BR.entT=0},seg:()=>brHole(),state:()=>({on:BR.on,busy:BR.busy,t:BR.t,ents:BR.ents.length,exit:BR.exit,exitT:BR.exitT,seg:BR.seg&&{x0:BR.seg.x0,z0:BR.seg.z0,x1:BR.seg.x1,z1:BR.seg.z1},segK:BR.segK,W:BR.W,boxes:BR.boxes?BR.boxes.length/7:0})};

