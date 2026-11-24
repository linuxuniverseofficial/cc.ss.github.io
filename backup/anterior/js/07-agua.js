'use strict';
/* Coastal Chaos · js/07-agua.js — Água viva (fundo, ondas, cardumes).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v70: água viva (fundo, ondas, cardumes) ================= */
const AQ={bedTex:null,waveTex:null,fish:null,schools:[]};
function aqBedTex(){if(AQ.bedTex)return AQ.bedTex;const N=256,c=cv(N,N),g=c.getContext('2d'),r=mulberry32(4242);g.fillStyle='#c9b48a';g.fillRect(0,0,N,N);
 for(let i=0;i<2600;i++){const v=r();g.fillStyle=v<.5?'rgba(150,128,90,.35)':'rgba(235,220,180,.35)';g.fillRect(r()*N,r()*N,1+r()*2,1+r()*2)}
 for(let i=0;i<9;i++){const x=r()*N,y=r()*N,R=4+r()*12;for(const[dx,dy] of [[0,0],[N,0],[0,N],[N,N],[-N,0],[0,-N]]){const gr=g.createRadialGradient(x+dx-R*.3,y+dy-R*.3,1,x+dx,y+dy,R);gr.addColorStop(0,'#9a9a98');gr.addColorStop(1,'#5e5e60');g.fillStyle=gr;g.beginPath();g.ellipse(x+dx,y+dy,R,R*(.6+r()*.3),r()*3,0,7);g.fill()}}
 for(let i=0;i<34;i++){const x=r()*N,y=r()*N,n=3+Math.floor(r()*4);g.strokeStyle=r()<.5?'#2f6a3a':'#4a8a40';g.lineWidth=1.5;for(let k=0;k<n;k++){g.beginPath();g.moveTo(x,y);let px=x,py=y;for(let s=0;s<6;s++){px+=(r()-.5)*4;py-=2+r()*2;g.lineTo(px,py)}g.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return AQ.bedTex=t}
function aqWaveTex(){if(AQ.waveTex)return AQ.waveTex;const N=256,c=cv(N,N),g=c.getContext('2d'),r=mulberry32(99);g.clearRect(0,0,N,N);g.lineCap='round';
 for(let i=0;i<46;i++){const L=30+r()*90,y=4+r()*(N-8),x0=r()*(N-L),a=.10+r()*.22;g.strokeStyle=`rgba(255,255,255,${a})`;g.lineWidth=1+r()*1.6;g.beginPath();for(let k=0;k<=12;k++){const x=x0+k/12*L,yy=y+Math.sin(k/12*Math.PI*2+i)*2.5;k?g.lineTo(x,yy):g.moveTo(x,yy)}g.stroke()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return AQ.waveTex=t}
function aqMats(M,night){M.bed=new THREE.MeshStandardMaterial({map:aqBedTex(),vertexColors:true,roughness:1,metalness:0});
 const wt=aqWaveTex();M.wave=new THREE.MeshBasicMaterial({map:wt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night?.25:.42,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 M.water.transparent=true;M.water.opacity=night?.82:.72;M.water.depthWrite=true;waterPatch(M.water,'river');causticPatch(M.bed,RY)}
/* v3 r24: ÁGUA NOVA (WTR). Mar e rios ganham, no próprio MeshStandardMaterial (onBeforeCompile, nenhum draw call novo):
   ondas em camadas (normal por soma de ondas direcionais em coordenadas de mundo + marulho indo para a praia no mar),
   reflexo do céu com Fresnel usando as MESMAS cores do skyMat (top/hor/sunDir/moonD: objetos de uniform compartilhados,
   então o reflexo acompanha dia, pôr do sol, noite e os outros mundos sem código na CPU), rastro de brilho do sol/lua
   e cáusticas (luz dançando) no fundo do rio e no raso do mar, multiplicando só a luz direta (respeita sombra e noite).
   Qualidade: S.waterQ 0 BAIXO (2 ondas, sem cáusticas) · 1 MÉDIO (4 ondas, cáusticas 3 passos) · 2 ALTO (7 ondas, cáusticas 5 passos, crista turquesa).
   Ondas pequenas somem com a distância (sem chiado/moiré). Tempestade/chuva deixa o mar mais agitado (wK.x). */
const WTR={U:{wT:{value:0},wQ:{value:new THREE.Vector4(4,3,0,1)},wK:{value:new THREE.Vector4(1,0,0,0)}},k0:-1,k1:-1};
function waterQApply(){const q=S.waterQ;WTR.U.wQ.value.set(q===0?2:q===2?7:4,q===0?0:q===2?5:3,q===2?1:0,1)}
function waterTick(dt){const U=WTR.U;U.wT.value=simT;const st=typeof WX!=='undefined'?Math.max(WX.f||0,WX.stormAmt||0):0,k=1+st*1.2;if(Math.abs(k-WTR.k0)>.005){WTR.k0=k;U.wK.value.x=k}
 const inv=S.style==='inverted'?1:0;if(inv!==WTR.k1){WTR.k1=inv;U.wK.value.y=inv}}
const WTR_GLSL=`uniform float wT;uniform vec4 wQ,wK;uniform vec3 top,hor,sunDir;uniform float night,sunDim,csSun,synth;uniform vec4 moonD;uniform vec3 wSw;varying vec3 vWw;
 vec3 wvSum(vec2 p,float dist){vec3 acc=vec3(0.);float L=11.,A=.085;
  for(int i=0;i<7;i++){if(float(i)>=wQ.x)break;float fi=float(i);float ang=fi*2.39996+.7;vec2 d=vec2(cos(ang),sin(ang));float k=6.2832/L;
   float fade=smoothstep(dist*.01,dist*.035,L);float ph=dot(d,p)*k-sqrt(9.8*k)*wT*.55+fi*1.93;float a=A*fade*wK.x/k;
   acc.xy+=d*k*a*cos(ph);acc.z+=a*sin(ph);L*=.63;A*=.93;}
  if(wSw.z>0.){vec2 d=normalize(wSw.xy);float k=6.2832/23.;float ph=dot(d,p)*k-sqrt(9.8*k)*wT*.5;float s=sin(ph+.35*sin(dot(p,vec2(-d.y,d.x))*.045));float a=.13*wSw.z*wK.x/k*smoothstep(dist*.004,dist*.014,23.);
   acc.xy+=d*k*a*cos(ph);acc.z+=a*s;}
  return acc;}`;
const WTR_CAUS=`uniform float wT;uniform vec4 wQ;uniform float wCy;varying vec3 vWw;
 float wCaus(vec2 uv){vec2 p=mod(uv*6.2832,6.2832)-250.;vec2 i=p;float c=1.,inten=.005;float n=max(wQ.y,1.);
  for(int k=0;k<5;k++){if(float(k)>=wQ.y)break;float t=wT*.32*(1.-(3.5/float(k+1)));i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
   c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
  c/=n;c=1.17-pow(c,1.4);return clamp(pow(abs(c),8.),0.,1.6);}`;
function wtrVert(sh){sh.vertexShader='varying vec3 vWw;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWw=(modelMatrix*vec4(transformed,1.)).xyz;')}
// água (mar e rio): kind 'sea' ganha marulho em direção à praia (AQ.inl); dir = [x,z]
function waterPatch(mat,kind){const old=mat.onBeforeCompile,key=(mat.customProgramCacheKey&&mat.customProgramCacheKey())||'';const sw={value:new THREE.Vector3(0,1,0)};mat.userData.wSw=sw;
 mat.onBeforeCompile=sh=>{if(old)old.call(mat,sh);const K=skyMat.uniforms;Object.assign(sh.uniforms,WTR.U,{top:K.top,hor:K.hor,sunDir:K.sunDir,night:K.night,sunDim:K.sunDim,csSun:K.csSun,synth:K.synth,moonD:K.moonD,wSw:sw});
  wtrVert(sh);const spec=sh.fragmentShader.includes('moonReflect')?'moonReflect':sh.fragmentShader.includes('celestialSpec')?'celestialSpec':'1.';
  sh.fragmentShader=WTR_GLSL+'\n'+sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   float wDist=length(vWw-cameraPosition);vec3 wv=wvSum(vWw.xz,wDist);vec3 nW=normalize(vec3(-wv.x,1.,-wv.y));normal=normalize((viewMatrix*vec4(nW,0.)).xyz);`)
  .replace('#include <tonemapping_fragment>',`{vec3 outgoingLight=gl_FragColor.rgb;vec3 V=normalize(vWw-cameraPosition);vec3 Rv=reflect(V,nW);Rv.y=abs(Rv.y);float cT=clamp(dot(-V,nW),0.,1.);float fr=.02+.98*pow(1.-cT,5.);
    vec3 sk=mix(hor,top,pow(clamp(Rv.y,0.,1.),.55));float inv=wK.y;
    float rk=clamp(fr*mix(.45,.4,inv),0.,1.)*mix(1.,.75,night*(1.-synth));outgoingLight=mix(outgoingLight,sk*mix(.92,.75,inv),rk);
    vec3 sd=normalize(sunDir);float up=smoothstep(-.05,.07,sd.y)*sunDim*(1.-.85*csSun)*${spec};float gold=smoothstep(.02,.4,sd.y);
    vec3 sc=mix(mix(vec3(1.,.5,.22),vec3(1.,.95,.84),gold),vec3(1.,.36,.62),synth);float sdt=max(dot(Rv,sd),0.);
    outgoingLight+=sc*(pow(sdt,mix(380.,1400.,gold))*mix(7.,4.,gold)+pow(sdt,mix(14.,90.,gold))*mix(.45,.1,gold))*up*(1.-inv);
    vec3 md=normalize(moonD.xyz);float mu=smoothstep(-.04,.08,md.y)*night*(1.-synth)*${spec};float mdt=max(dot(Rv,md),0.);
    outgoingLight+=vec3(.78,.85,1.)*(pow(mdt,900.)*3.+pow(mdt,70.)*.16)*mu*(1.-inv);
    if(wQ.z>.5)outgoingLight+=vec3(.02,.1,.09)*clamp(wv.z*2.2,0.,1.)*(1.-night)*(1.-inv)*smoothstep(160.,30.,wDist);
    gl_FragColor=vec4(outgoingLight,clamp(mix(gl_FragColor.a*.92,1.,fr*.9),0.,1.));}
   #include <tonemapping_fragment>`)};
 mat.customProgramCacheKey=()=>key+'|wtr-'+kind;mat.needsUpdate=true;return mat}
// cáusticas no fundo (rio e raso do mar): só abaixo de wCy (nível da água) e somem com a profundidade
function causticPatch(mat,yTop){const old=mat.onBeforeCompile,key=(mat.customProgramCacheKey&&mat.customProgramCacheKey())||'';
 mat.onBeforeCompile=sh=>{if(old)old.call(mat,sh);Object.assign(sh.uniforms,{wT:WTR.U.wT,wQ:WTR.U.wQ,wCy:{value:yTop}});wtrVert(sh);
  sh.fragmentShader=WTR_CAUS+'\n'+sh.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
   if(wQ.y>.5){float dp=wCy-vWw.y;float m=smoothstep(.05,.5,dp)*(1.-smoothstep(3.,9.,dp))*(1.-smoothstep(60.,140.,length(vWw-cameraPosition)));
    if(m>0.){float c=min(wCaus(vWw.xz/5.),1.1);reflectedLight.directDiffuse*=1.+c*.85*m;}}`)};
 mat.customProgramCacheKey=()=>key+'|caus';mat.needsUpdate=true;return mat}
/* v3 r25: EFEITOS LEVES DE SHADER (SHFX). Truques baratos "estilo PS2", todos no shader de materiais que já existem
   (nenhum draw call, textura ou render target novo; nada roda na CPU além de 2 uniforms por quadro em shfxTick).
   Cada efeito tem chave própria em Gráficos (S.fxWet/S.fxGlow/S.fxPaint) que só muda o uniform fxK (sem recompilar):
   fxK.x = reflexo falso no asfalto molhado (sol/lua/brilho da cidade, no shader do WET)
   fxK.y = brilho pintado de janelas e placas (halo pelo mipmap do emissiveMap) + núcleo quente/zumbido dos neons
   fxK.z = livre (era a vegetação balançando da r25, removida na r26)
   fxK.w = reflexo do céu na lataria (Fresnel com as cores do skyMat + linha do horizonte + brilho do sol; carLampInject)
   Para remover um efeito de vez: ver o registro de shaders em CONTEXT.md §2b. */
const SHFX={U:{fxK:{value:new THREE.Vector4(1,1,1,1)},fxT:{value:0},fxN:{value:0}}};
function shfxApply(){SHFX.U.fxK.value.set(S.fxWet!==false?1:0,S.fxGlow!==false?1:0,0,S.fxPaint!==false?1:0);if(typeof SURF!=='undefined')surfApply()}
function shfxTick(dt){const U=SHFX.U;U.fxT.value=simT;
 const n=city&&city.st&&city.st.night?1:(typeof DN!=='undefined'?DN.nightF||0:0);if(Math.abs(n-U.fxN.value)>.004)U.fxN.value=n}
// janelas e placas: halo "pintado" = o próprio emissiveMap lido em mipmaps borrados (2 leituras), somado à emissão.
// Só aparece quando a emissão está acesa (de dia emissiveIntensity=0 → halo 0).
function fxGlowPatch(mat,k){if(!mat||mat.userData.fxGlow)return mat;mat.userData.fxGlow=true;const old=mat.onBeforeCompile,key=(mat.customProgramCacheKey&&mat.customProgramCacheKey())||'';
 mat.onBeforeCompile=sh=>{if(old)old.call(mat,sh);sh.uniforms.fxK=SHFX.U.fxK;sh.uniforms.fxGk={value:k};
  sh.fragmentShader='uniform vec4 fxK;uniform float fxGk;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   #ifdef USE_EMISSIVEMAP
   if(fxK.y>.5){vec3 fxH=texture2D(emissiveMap,vUv,2.).rgb*.55+texture2D(emissiveMap,vUv,3.5).rgb*.45;float fxC=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));totalEmissiveRadiance+=emissive*fxH*fxGk*vec3(1.,.82,.6)*(1.-smoothstep(.15,.9,fxC));}
   #endif`)};
 mat.customProgramCacheKey=()=>key+'|fxGlow';mat.needsUpdate=true;return mat}
// neon (MeshBasic): núcleo mais branco no tubo, zumbido sutil e, à noite, brilho acima de 1 (o bloom pega quando ligado).
function fxNeonPatch(mat){if(!mat||mat.userData.fxNeon||!mat.isMeshBasicMaterial)return mat;mat.userData.fxNeon=true;const old=mat.onBeforeCompile,key=(mat.customProgramCacheKey&&mat.customProgramCacheKey())||'';
 mat.onBeforeCompile=sh=>{if(old)old.call(mat,sh);sh.uniforms.fxK=SHFX.U.fxK;sh.uniforms.fxT=SHFX.U.fxT;sh.uniforms.fxNk=SHFX.U.fxN;
  sh.vertexShader='varying vec3 fxNw;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n fxNw=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader='uniform vec4 fxK;uniform float fxT,fxNk;varying vec3 fxNw;\n'+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(fxK.y>.5){vec3 nc=diffuseColor.rgb;float nl=max(nc.r,max(nc.g,nc.b));float hs=fract(sin(dot(floor(fxNw.xz/12.),vec2(12.99,78.23)))*43758.55);
    float hum=.95+.05*sin(fxT*(23.+hs*17.)+hs*40.);float fl=1.-.55*step(.93,hs)*step(.82,fract(sin(floor(fxT*9.+hs*50.)*1.7)*913.3));
    diffuseColor.rgb=mix(nc,vec3(nl),.22*nl)*(1.+.35*fxNk*nl)*hum*fl;}`)};
 mat.customProgramCacheKey=()=>key+'|fxNeon';mat.needsUpdate=true;return mat}
/* v3 r33: TEXTURAS DE SUPERFÍCIE (SURF). Mesma técnica da água/nuvens: tudo no shader dos materiais que já existem
   (onBeforeCompile), ruído pela posição do mundo (nada se repete, nenhuma textura/geometria/draw call novo, então
   não existe camada nova que possa dar z-fight). Cada superfície ganha camadas de ruído sobrepostas DENTRO do shader:
   areia  = manchas largas + marcas de vento (relevo pela normal) + poros escuros com borda clara + grãos e conchinhas;
   asfalto = manchas largas + remendos + trincas finas + granulado (pedrinhas claras/escuras) + grão miúdo;
   prédios = pelo tom da parede: tijolo (paredes avermelhadas), reboco (bege) ou concreto (cinza: juntas de fôrma e furos).
   Só na parede lisa (a moldura e o vidro das janelas ficam como estavam). Detalhe fino some sozinho com a distância
   (pegada do pixel por fwidth = sem chiado/moiré) e tudo corta a 170 m. Chave: Gráficos › Texturas de areia, asfalto e
   prédios (S.fxSurf → uniform sfOn, sem recompilar). Remover de vez: tirar as chamadas surfPatch(...) (ver CONTEXT §2b). */
const SURF={U:{sfOn:{value:1},sfSeed:{value:0},sfSt:{value:null},sfStK:{value:new THREE.Vector4(76,1,8,0)},sfPaint:{value:new THREE.Vector3(.886,.71,.227)},sfPaintW:{value:new THREE.Vector3(.92,.91,.875)},sfAge:{value:new THREE.Vector3(.86,.85,.8)}}};
const SURF_GLSL=`uniform float sfOn;uniform float sfSeed;uniform sampler2D sfSt;uniform vec4 sfStK;uniform vec3 sfPaint;uniform vec3 sfPaintW;uniform vec3 sfAge;varying vec3 sfW;varying vec3 sfN;
float sfH(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float sfV(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sfH(i),sfH(i+vec2(1.,0.)),f.x),mix(sfH(i+vec2(0.,1.)),sfH(i+vec2(1.,1.)),f.x),f.y);}
float sfAA(float px,float fq){return 1.-smoothstep(.3,.9,px*fq);}
float sfDot(vec2 p,float fq,float th,float r){vec2 c=floor(p*fq),f=fract(p*fq)-.5;float h=sfH(c+11.3);if(h<th)return 0.;vec2 o=(vec2(sfH(c+3.7),sfH(c+8.1))-.5)*.5;return 1.-smoothstep(r*.55,r,length(f-o));}
vec3 sfAsph(vec2 p,float px){float big=sfV(p*.045)*.6+sfV(p*.13+3.1)*.4;float t=mix(.966,1.034,big); /* v3 r51: manchas a 40% (era mix(.9,1.07)) */
 /* v3 r51: remendos cinzentos — retângulo por célula de 9 m sorteada (24%), lado 45–85% da célula ≈ 10% da área; cinza mais claro com ruído próprio e junta escura */
 vec2 c=floor(p/9.),f=fract(p/9.);if(sfH(c+17.)>.76){vec2 lo=vec2(sfH(c+3.),sfH(c+5.))*(1.-(.45+vec2(sfH(c+7.),sfH(c+9.))*.4)),hi=lo+.45+vec2(sfH(c+7.),sfH(c+9.))*.4;
  float e=.004*(sfV(p*2.3)-.5);vec2 dl=f-lo-e,dh=hi-f+e;float dd=min(min(dl.x,dl.y),min(dh.x,dh.y))*9.;
  if(dd>0.){float g=1.16+(sfV(p*1.1+c)-.5)*.14+(sfV(p*4.+7.)-.5)*.08*sfAA(px,4.)+(sfH(floor(p*20.))-.5)*.08*sfAA(px,20.);
   float seam=1.-smoothstep(.03,.09+px,dd);t*=mix(g,.72,seam*sfAA(px,2.));}}
 float cz=smoothstep(.55,.75,sfV(p*.07+9.));if(cz>0.){float n=sfV(p*.42)*.7+sfV(p*1.3)*.3;float w=.012+px*.6;t*=1.-cz*.13*(1.-smoothstep(0.,w,abs(n-.5)))*sfAA(px,.8);}
 float a1=sfAA(px,9.),a2=sfAA(px,3.),a3=sfAA(px,26.);
 if(a1>0.){float lt=sfDot(p,9.,.55,.32),dk=sfDot(p+.37,11.,.6,.3);t*=1.+a1*(lt*.15-dk*.13);}
 t*=1.+a2*(sfV(p*3.)-.5)*.04;if(a3>0.)t*=1.+a3*(sfH(floor(p*26.))-.5)*.09;
 return vec3(t);}
vec3 sfSand(vec2 p,float px){float t=mix(.9,1.07,sfV(p*.06)*.6+sfV(p*.19+5.)*.4);
 float a1=sfAA(px,7.),a4=sfAA(px,16.),a2=sfAA(px,30.),a3=sfAA(px,2.5);float dens=smoothstep(.25,.8,sfV(p*.45+8.));
 if(a1>0.){float pit=sfDot(p,7.,.55,.2)*dens;float rim=max(sfDot(p+vec2(.01,.014),7.,.55,.25)*dens-pit,0.);t*=1.-a1*(pit*.18-rim*.07);
  t=mix(t,1.16,a3*sfDot(p,1.6,.93,.14)*.6);}
 if(a4>0.)t*=1.-a4*sfDot(p+.21,16.,.6,.28)*(1.-dens*.5)*.1;
 if(a2>0.)t*=1.+a2*(sfH(floor(p*30.))-.5)*.14;
 t*=1.+a3*(sfV(p*2.5+1.7)-.5)*.08;
 return vec3(t,t,t*mix(1.,.97,step(1.,t)));}
/* v3 r36 · STREET: tampas de bueiro (cruzamentos) e bocas-de-lobo (meio-fio). Quem tem o quê vem da textura sfSt (1 texel por nó da grade de ruas, feita em JS pela seed):
   R = tampa (0 nenhuma; 1+q = deslocamento q), G = bocas na rua horizontal a leste do nó (4 bits lado norte + 4 bits lado sul), B = idem na rua vertical ao sul (oeste/leste). */
vec3 sfStreet(vec2 p,float px){vec3 m=vec3(1.);if(sfStK.w<.5)return m;float Pp=sfStK.x,n=sfStK.y,o=sfStK.z,aa=max(px,.01);
 vec2 nd=floor(p/Pp+.5);
 if(nd.x>=0.&&nd.y>=0.&&nd.x<n&&nd.y<n){float r=floor(texture2D(sfSt,(nd+.5)/n).r*255.+.5);
  if(r>0.){float q=r-1.;vec2 l=p-nd*Pp-vec2(mod(q,4.)-1.5,floor(q/4.)-1.5)*1.7;float rr=length(l);float cov=1.-smoothstep(.62-aa,.62+aa,rr);
   if(cov>0.){float g=.6+.16*(sfH(floor(l*38.)+3.)-.5)*sfAA(px,38.)+.06*(sfV(l*9.)-.5);
    float groove=smoothstep(.5-aa,.5,rr)*(1.-smoothstep(.555,.555+aa,rr));float rim=smoothstep(.555,.58,rr);
    float grid=sfAA(px,7.)*max(step(.8,fract(l.x*7.)),step(.8,fract(l.y*7.)))*step(rr,.47);
    float t=g*(1.-groove*.5)+rim*.08+grid*.1;m=mix(m,vec3(t*.96,t*.96,t),cov);}}}
 for(int ax=0;ax<2;ax++){float cu=ax==0?p.y:p.x,al=ax==0?p.x:p.y,k=floor(cu/Pp+.5),v=cu-k*Pp,av=abs(v);
  if(av>o-.56&&av<o+.05){float j=floor(al/Pp),sl=al-j*Pp;if(sl>o&&sl<Pp-o){vec2 ni=ax==0?vec2(j,k):vec2(k,j);
   if(ni.x>=0.&&ni.y>=0.&&ni.x<n&&ni.y<n){vec4 d=texture2D(sfSt,(ni+.5)/n);float c=floor((ax==0?d.g:d.b)*255.+.5);float f=v<0.?mod(c,16.):floor(c/16.);
    if(f>0.){float s0=o+4.+(f-1.)/14.*(Pp-2.*o-8.),ds=abs(sl-s0);if(ds<.6){float cov=(1.-smoothstep(.5-aa,.5+aa,ds))*(1.-smoothstep(.46-aa,.46+aa,o-av));
     float bars=sfAA(px,9.)*step(.5,fract(sl*9.));float fr=max(step(.42,ds),max(step(o-.06,av),step(av,o-.39)));
     float t=mix(.08+.2*bars,.4,fr);m=mix(m,vec3(t),cov);}}}}}}
 return m;}
/* v4 r1: rachaduras finas e raras na calçada — células de 4,2 m (e outra grade de 6,7 m deslocada), ~10% com 1 trinca torta de 0,6–2 m */
float sfCrack1(vec2 p,float C,float sd,float px){vec2 id=floor(p/C);float h=sfH(id*1.71+sfSeed+sd);if(h>.1)return 0.;
 vec2 q=p-id*C-vec2(.35+.3*sfH(id+3.3+sd),.35+.3*sfH(id+7.1+sd))*C;float an=sfH(id+11.+sd)*3.1416;vec2 d=vec2(cos(an),sin(an));
 float al=dot(q,d),L=(.15+.2*sfH(id+5.+sd))*C;if(abs(al)>L)return 0.;
 float wob=(sfV(vec2(al*2.2,id.x*3.1+id.y*7.3+sd))-.5)*.22+(sfV(vec2(al*9.,id.y*5.7+sd))-.5)*.05;float ds=abs(dot(q,vec2(-d.y,d.x))-wob);
 float w=.004+.011*(1.-smoothstep(.5,1.,abs(al)/L));float pw=max(px*.75,.002);return (1.-smoothstep(w,w+pw,ds))*min(1.,w/max(px*.5,.001));}
float sfCrack(vec2 p,float px){float a=sfAA(px,6.);if(a<.01)return 0.;return a*max(sfCrack1(p,4.2,.4,px),sfCrack1(p+vec2(1.9,3.3),6.7,9.2,px));}
vec3 sfSide(vec2 p,float px){float t=mix(.95,1.04,sfV(p*.08)*.6+sfV(p*.31+2.)*.4);float a1=sfAA(px,14.),a2=sfAA(px,40.),a3=sfAA(px,4.);t*=1.-.5*sfCrack(p,px);
 if(a1>0.)t*=1.-a1*sfDot(p+.5,14.,.68,.3)*.08;if(a2>0.)t*=1.+a2*(sfH(floor(p*40.))-.5)*.07;t*=1.+a3*(sfV(p*4.)-.5)*.05;return vec3(t);}
vec2 sfRip(vec2 p,float px){float a=sfAA(px,2.2)*smoothstep(.25,.6,sfV(p*.11+2.));if(a<.01)return vec2(0.);vec2 d=normalize(vec2(.8,.6));float w=sfV(p*.35)*5.;float ph=dot(p,d)*5.2+w;float s=cos(ph)+.35*cos(ph*2.+1.);return d*s*a*.2;}
vec3 sfWall(vec3 w,vec3 n,vec3 bc,float px){vec2 tg=normalize(vec2(-n.z,n.x));float s=dot(w.xz,tg),y=w.y;vec2 q=vec2(s,y);
 float mx=max(bc.r,max(bc.g,bc.b)),warm=(bc.r-bc.b)/max(mx,.001);float kb=smoothstep(.22,.27,warm)*(1.-smoothstep(.58,.66,(bc.g-bc.b)/max(bc.r-bc.b,.001))),kp=smoothstep(.1,.13,warm)*(1.-kb);
 float t=1.+(sfV(q*vec2(.35,.5)+4.)-.5)*.1;vec3 col=vec3(t);
 if(kb>0.){float bw=.5,bh=.17,row=floor(y/bh);float u=s/bw+.5*mod(row,2.);float fu=fract(u),fv=fract(y/bh);
  float a=sfAA(px,1./bh);float mwu=max(.05,px/bw*.8),mwv=max(.12,px/bh*.8);float mort=1.-smoothstep(0.,mwu,min(fu,1.-fu))*smoothstep(0.,mwv,min(fv,1.-fv));
  float h=sfH(vec2(floor(u),row)+.3);float bt=.86+h*.2-step(.9,h)*.12;bt*=1.+(sfH(floor(q*28.))-.5)*.08*sfAA(px,28.);
  vec3 bcol=vec3(bt*1.02,bt,bt*.97);vec3 mcol=vec3(1.2,1.2,1.17);col=mix(col,mix(col,mix(bcol,mcol,mort),a),kb);}
 if(kp>0.){float a=sfAA(px,24.);float g=(sfH(floor(q*24.))-.5)*.1*a+(sfV(q*3.)-.5)*.06*sfAA(px,3.);col*=1.+g*kp;}
 float kc=1.-kb-kp;if(kc>0.){float a=sfAA(px,2.);vec2 pn=vec2(s/2.4,y/1.2);vec2 fp=fract(pn);float mw=max(.008,px/1.2*.8);
  float jt=1.-smoothstep(0.,mw*1.6,min(min(fp.x,1.-fp.x)*2.,min(fp.y,1.-fp.y)));
  vec2 th=fract(vec2(s/.6,y/.6)+.5)-.5;float hole=(1.-smoothstep(.04,.07,length(th)))*sfAA(px,6.)*step(.5,sfH(floor(pn)+2.));
  float pore=sfAA(px,30.)*(sfH(floor(q*30.))-.5)*.1;float pan=(sfH(floor(pn))-.5)*.08;
  col*=1.+kc*(pan+pore-jt*.18*a-hole*.25);}
 return col;}
/* v3 r56/r57: ESTRADA DE TERRA — grão de solo (manchas, pedrinhas, poros) + sulcos de pneu: trechos aleatórios e espaçados
   (célula de 18 m por rua, ~38% com trecho de 5–15 m, reto/inclinado ou em curva), par de rodas a 1,6 m, cada sulco
   afundado com 3 cumes no corte (o "efeito onda" da areia limitado a 3). Rua H/V pela grade (sfStK.x = P). */
bool sfIsDirt(vec3 bc){float mx=max(bc.r,max(bc.g,bc.b));if(bc.r>bc.b&&bc.b>bc.g&&mx<.36&&mx>.12){float k=(bc.r-bc.g)/max(bc.r,.001);if(k>.15&&k<.35)return true;} /* v3 r60: terra do Synthwave (#4a3a40, sulco #3a2c34: roxo-terra, verde < azul) */
 return bc.r>=bc.g&&bc.g>=bc.b&&mx<.8&&mx>.15&&(bc.r-bc.b)/max(bc.r,.001)>.25&&(bc.r-bc.b)/max(bc.r,.001)<.62;}
/* v3 r60: ganho da textura em base escura (Synthwave, Mundo Invertido): o SURF é multiplicativo e some em cor quase preta; abaixo de lum .3 o desvio de 1 cresce até 2,3× */
vec3 sfGain(vec3 m,vec3 base){float l=dot(base,vec3(.3,.59,.11));return vec3(1.)+(m-vec3(1.))*(1.+1.3*(1.-smoothstep(.06,.3,l)));}
vec3 sfRut1(float u,float v,float lane,float px){vec3 acc=vec3(0.);float L=18.;
 for(int k=-1;k<=0;k++){float id=floor(u/L)+float(k);vec2 q=vec2(id,lane+sfSeed*.013);if(sfH(q+.17)>.38)continue;
  float s0=id*L+sfH(q+3.1)*8.,len=5.+sfH(q+5.3)*10.,x=(u-s0)/len;if(x<0.||x>1.)continue;
  float env=smoothstep(0.,.18,x)*(1.-smoothstep(.78,1.,x))*(.55+.45*sfH(q+8.8));float cv=sfH(q+2.9);
  float lat=(sfH(q+9.7)-.5)*7.+(cv<.5?(cv-.25)*6.*sin(x*3.1416):(cv-.75)*5.*(x-.5));
  for(int w=0;w<2;w++){float d=v-lat-(w==0?-.8:.8);float hw=.24;if(abs(d)<hw){float t=(d/hw+1.)*.5;float edge=1.-smoothstep(.7,1.,abs(d)/hw);
   float rg=sin(t*9.4248);acc.x=max(acc.x,env*edge);acc.y+=env*edge*rg;acc.z+=env*edge*cos(t*9.4248)*(9.4248/(2.*hw))*.035;}}}
 return acc;}
vec4 sfDirt(vec2 p,float px){float P=sfStK.x,hw=sfStK.z;float t=mix(.92,1.06,sfV(p*.07)*.6+sfV(p*.21+4.)*.4);
 float a1=sfAA(px,6.),a2=sfAA(px,14.),a3=sfAA(px,28.);
 if(a1>0.)t*=1.-a1*(sfDot(p,6.,.62,.26)*.14-sfDot(p+.31,5.,.8,.2)*.08);
 if(a2>0.)t*=1.-a2*sfDot(p+.13,14.,.5,.25)*.08;
 if(a3>0.)t*=1.+a3*(sfH(floor(p*28.))-.5)*.1;
 vec2 g=vec2(0.);float rA=sfAA(px,1.2),rB=sfAA(px,6.);
 if(rA>0.){float cz=floor(p.y/P+.5)*P,cx=floor(p.x/P+.5)*P;
  if(abs(p.y-cz)<hw){vec3 r=sfRut1(p.x,p.y-cz,cz/P,px);t*=1.-rA*r.x*.22+rB*r.y*.08;g.y+=r.z*rB;}
  if(abs(p.x-cx)<hw){vec3 r=sfRut1(p.y,p.x-cx,cx/P+97.,px);t*=1.-rA*r.x*.22+rB*r.y*.08;g.x+=r.z*rB;}}
 return vec4(t,g,0.);}
`;
function surfVert(sh){sh.vertexShader='varying vec3 sfW;varying vec3 sfN;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n sfW=(modelMatrix*vec4(transformed,1.)).xyz;sfN=normalize(mat3(modelMatrix)*objectNormal);')}
// kind: 'asph' (chão de asfalto), 'sand' (areia da praia), 'wall' (paredes de prédios/casas, com janelas no map)
function surfPatch(mat,kind){if(!mat||mat.userData.surf)return mat;mat.userData.surf=kind;const old=mat.onBeforeCompile,key=(mat.customProgramCacheKey&&mat.customProgramCacheKey())||'';
 mat.onBeforeCompile=(sh,r)=>{if(old)old.call(mat,sh,r);sh.uniforms.sfOn=SURF.U.sfOn;sh.uniforms.sfSeed=SURF.U.sfSeed;sh.uniforms.sfSt=SURF.U.sfSt;sh.uniforms.sfStK=SURF.U.sfStK;sh.uniforms.sfPaint=SURF.U.sfPaint;sh.uniforms.sfPaintW=SURF.U.sfPaintW;sh.uniforms.sfAge=SURF.U.sfAge;surfVert(sh);
  const head=`float sfD=distance(sfW,cameraPosition);float sfF=sfOn*(1.-smoothstep(120.,170.,sfD));float sfPx=length(fwidth(sfW));`;
  let fs=SURF_GLSL+'\n'+sh.fragmentShader;
  if(kind==='paint')fs=fs.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   #ifdef USE_COLOR
   {${head}if(sfF>.01&&sfN.y>.6&&sfIsDirt(vColor)){vec2 g=sfDirt(sfW.xz,sfPx).yz*sfF;normal=normalize(normal+(viewMatrix*vec4(-g.x,0.,-g.y,0.)).xyz);}}
   #endif`);
  if(kind==='sand')fs=fs.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   {${head}if(sfF>.01&&sfN.y>.6){vec2 g=sfRip(sfW.xz,sfPx)*sfF;normal=normalize(normal+(viewMatrix*vec4(-g.x,0.,-g.y,0.)).xyz);}}`);
  const body=kind==='asph'?`if(sfN.y>.6){diffuseColor.rgb*=mix(vec3(1.),sfGain(sfAsph(sfW.xz,sfPx),diffuseColor.rgb),sfF);diffuseColor.rgb*=mix(vec3(1.),sfStreet(sfW.xz,sfPx),smoothstep(.0,.25,sfF));}`
   :kind==='paint'?`{vec3 bc=vec3(1.);
     #ifdef USE_COLOR
     bc=vColor;
     #endif
     float lum=dot(bc,vec3(.3,.59,.11));if(sfN.y>.6&&sfIsDirt(bc)){diffuseColor.rgb*=mix(vec3(1.),vec3(sfDirt(sfW.xz,sfPx).x),sfF);}else if(sfN.y>.6&&(lum>.72||distance(bc,sfPaint)<.12||distance(bc,sfPaintW)<.12||(bc.r>.7&&bc.g>.5&&bc.b<bc.r*.4))){
      vec2 cw=sfW.xz;float lvl=.32+.68*(sfH(floor(cw/76.+.5)*1.37+sfSeed)*.6+sfH(floor(cw/19.)*2.11+sfSeed+5.3)*.4);
      float a0=sfAA(sfPx,1.3),am=sfAA(sfPx,2.6),a1=sfAA(sfPx,5.),a2=sfAA(sfPx,22.),big=sfV(cw*.45+3.);
      float nn=.5+a0*(sfV(cw*1.3+7.)-.5)*.7+am*(sfV(cw*2.6+1.7)-.5)*.6+a1*(sfV(cw*5.)-.5)*.8+a2*(sfH(floor(cw*22.))-.5)*.7;
      float th=.55*(.12+.36*lvl+.2*lvl*smoothstep(.45,.85,big))*max(a0*.85,max(am*.95,a1))*sfF; /* v4 r1: ×.55 = metade da área gasta (≈37%→19%) */if(nn<th)discard;diffuseColor.rgb*=1.-(.08+.1*lvl)*sfF*(1.-smoothstep(th,th+.25,nn));}}`
   :kind==='side'?`if(sfN.y>.6){vec3 bc=vec3(.6);
     #ifdef USE_COLOR
     bc=vColor;
     #endif
     float sat=max(bc.r,max(bc.g,bc.b))-min(bc.r,min(bc.g,bc.b));if(sat<.12)diffuseColor.rgb*=mix(vec3(1.),sfGain(sfSide(sfW.xz,sfPx),diffuseColor.rgb),sfF*(1.-smoothstep(.09,.12,sat)));}` /* v3 r60: limite .09→.12 (calçada do Synthwave #2a2238 tem .086 e ficava sem) */
   :kind==='sand'?`if(sfN.y>-.2)diffuseColor.rgb*=mix(vec3(1.),sfSand(sfW.xz,sfPx),sfF);`
   :`if(abs(sfN.y)<.5){vec3 bc=vec3(.6);
     #ifdef USE_COLOR
     bc=vColor;
     #endif
     float wm=1.;
     #ifdef USE_MAP
     vec3 sfT=texture2D(map,vUv).rgb;wm=smoothstep(.88,.97,min(sfT.r,min(sfT.g,sfT.b)));
     #endif
     if(wm>.01)diffuseColor.rgb*=mix(vec3(1.),sfGain(sfWall(sfW,normalize(sfN),bc,sfPx),bc),sfF*wm);}`;
  /* v3 r62: tinta envelhecida (cinza/amarelada) em toda faixa, sem sumir com a distância (só depende de sfOn) */
  const tint=kind==='side'?`if(sfOn>.5&&sfN.y>.6){vec3 bc=vec3(.6);
     #ifdef USE_COLOR
     bc=vColor;
     #endif
     float sat=max(bc.r,max(bc.g,bc.b))-min(bc.r,min(bc.g,bc.b));diffuseColor.rgb*=mix(1.,.86,1.-smoothstep(.09,.12,sat));}` /* v4 r1: concreto da calçada 14% mais escuro (sem corte por distância) */
   :kind==='paint'?`{vec3 bc=vec3(1.);
     #ifdef USE_COLOR
     bc=vColor;
     #endif
     float lum=dot(bc,vec3(.3,.59,.11));if(sfOn>.5&&sfN.y>.6&&!sfIsDirt(bc)&&(lum>.72||distance(bc,sfPaint)<.12||distance(bc,sfPaintW)<.12||(bc.r>.7&&bc.g>.5&&bc.b<bc.r*.4))){
      vec2 cw=sfW.xz;float lvl=.32+.68*(sfH(floor(cw/76.+.5)*1.37+sfSeed)*.6+sfH(floor(cw/19.)*2.11+sfSeed+5.3)*.4);
      vec3 aged=sfAge*mix(vec3(1.),vec3(1.07,1.02,.9),sfV(cw*.21+9.));diffuseColor.rgb*=mix(vec3(1.),aged,.55+.45*lvl);}}`:'';
  fs=fs.replace('#include <color_fragment>',`#include <color_fragment>
   {${head}if(sfF>.01){${body}}}${tint}`);
  sh.fragmentShader=fs};
 mat.customProgramCacheKey=()=>key+'|surf-'+kind;mat.needsUpdate=true;return mat}
function surfApply(){SURF.U.sfOn.value=S.fxSurf!==false?1:0}
/* v3 r36 · STREET: sorteio próprio da seed (não mexe no R()). Tampas só em cruzamentos (3+ ruas) de asfalto; bocas-de-lobo em cada lado de
   cada trecho de rua com 35% (≈1–2 por quarteirão). Fora: zona rural/terra, pontes, água, Point Haze. city.manholes = lista para a fumaça. */
function streetTexBuild(){const N=city.N|0,n=N+1,data=new Uint8Array(n*n*4),r=mulberry32((S.seed^0x6b0e1d3)>>>0),list=[];city.manholes=list;
 const ok=(x,z)=>{if(city.haze||isRural(x,z))return false;for(const d of city.decks||[])if(x>d[0]-2&&x<d[2]+2&&z>d[1]-2&&z<d[3]+2)return false;try{if(waterAt(x,z))return false}catch(e){}return true};
 const core=city.core;
 for(let kz=0;kz<=N;kz++)for(let kx=0;kx<=N;kx++){const i=(kz*n+kx)*4,x=kx*P,z=kz*P,a=r(),q=Math.floor(r()*16),sm=r(),g1=r(),g2=r(),f1=1+Math.floor(r()*14),f2=1+Math.floor(r()*14),b1=r(),b2=r(),e1=1+Math.floor(r()*14),e2=1+Math.floor(r()*14);
  if(nodeDeg(kx,kz)>=3&&a<.45&&ok(x,z)){data[i]=1+q;const mx=x+(q%4-1.5)*1.7,mz=z+(Math.floor(q/4)-1.5)*1.7;list.push({x:mx,z:mz,smoke:!!core&&Math.hypot(mx-core.x,mz-core.z)<170&&sm<.7})}
  if(segExists(kx,kz,0)&&ok(x+P/2,z))data[i+1]=(g1<.35?f1:0)+(g2<.35?f2*16:0);
  if(segExists(kx,kz,1)&&ok(x,z+P/2))data[i+2]=(b1<.35?e1:0)+(b2<.35?e2*16:0)}
 const old=SURF.U.sfSt.value;const t=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;
 SURF.U.sfSt.value=t;SURF.U.sfStK.value.set(P,n,RW/2,city.haze?0:1);SURF.U.sfSeed.value=(S.seed%9973)*.731;{const st=STYLES[S.style]||STYLES.modern,c=COL(st.center),w=COL(st.mark);SURF.U.sfPaint.value.set(c.r,c.g,c.b);SURF.U.sfPaintW.value.set(w.r,w.g,w.b);const ag=st.synth?[.6,.58,.64]:S.style==='inverted'?[.78,.78,.75]:[.86,.85,.8];SURF.U.sfAge.value.set(ag[0],ag[1],ag[2])} /* v3 r62: tinta envelhecida por mundo (o Synth satura com bloom, precisa de mais) */ /* v3 r60: cor da faixa central e da branca do mundo atual (desgaste em todos os mundos) */if(old)old.dispose()}
/* fumaça leve dos bueiros do centro (mesmo emit da fuligem das chaminés, bem mais fraca) */
function manholeSmokeTick(dt){const L=city.manholes;if(!L||!L.length||city.haze||PL.inside)return;const pp=PL.car||PL;
 for(let i=0;i<L.length;i++){const m=L[i];if(!m.smoke||Math.abs(m.x-pp.x)>80||Math.abs(m.z-pp.z)>80)continue;
  if(Math.random()<dt*2.2)emit(m.x+(Math.random()-.5)*.6,.08,m.z+(Math.random()-.5)*.6,(WX.wx||1)*.22+(Math.random()-.5)*.25,.45+Math.random()*.35,(WX.wz||.6)*.22+(Math.random()-.5)*.25,3.6,.7,3.4,0xdedcd6,false,.32)}}
// Superfície do mar em coordenadas de mundo: o mar aberto a partir de SHORE e o canal da foz até a
// ponte da avenida (mesmo material e mesmo nível do rio, então a água do rio entra no mar sem degrau).
// UV = mundo/22, para o mesmo padrão de ondas cobrir mar e canal sem emenda.
function seaSurfaceGeo(dy){const E=city.ext,W=5000,o=RW/2,rects=[city.haze?[E/2-W/2,E/2-W/2,E/2+W/2,E/2+W/2]:tuRect(E/2-W/2,E/2+W/2,SHORE,SHORE+W)];
 if(!city.haze&&city.coast!=null){const c=coastWInit();let a=c.lo+35;for(const z of [...c.no].sort((p,q)=>p[0]-q[0]).concat([[c.hi-35,1e9]])){const b=Math.min(z[0]-10,c.hi-35);if(b>a)rects.push(tuRect(a,b,SHORE-COASTW.in-1.5,SHORE));a=Math.max(a,z[1]+10)}} /* v3 r35: onde a areia recua a água começa antes (a areia acima do nível cobre o resto) */
 if(city.seaBranch){const a=city.seaBranch.a*P+o,b=(city.seaBranch.a+1)*P-o,m=mouthGeo();rects.push(tuRect(a,b,-o,SHORE));
  /* v3 r27: corneta da foz — degraus de 3 m acompanhando a abertura (a areia acima do nível cobre o excesso) */
  if(m&&m.A>0)for(let u=m.u0;u<SHORE-.01;u+=3){const u1=Math.min(SHORE,u+3),w=mouthF(m,u1)+3;rects.push(tuRect(a-w,a,u,u1),tuRect(b,b+w,u,u1))}}
 const pos=[],uv=[],y=SEA_Y+dy;for(const[x0,z0,x1,z1] of rects){for(const[x,z] of [[x0,z1],[x1,z1],[x1,z0],[x0,z1],[x1,z0],[x0,z0]]){pos.push(x,y,z);uv.push(x/22,-z/22)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g}
/* v77: grade neon outrun sobre o mar do mundo SYNTHWAVE.
   Linhas procedurais pela posição no mundo (fwidth = antisserrilhado e some ao longe sem moiré),
   aditivas e apagadas pela própria névoa (a névoa normal somaria cor no horizonte). Um único plano, sem textura. */
function synthGridMat(land){
 const m=land?new THREE.MeshBasicMaterial({color:0x0b0618,fog:true}):new THREE.MeshBasicMaterial({color:0xff2fae,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:true});
 m.onBeforeCompile=sh=>{sh.uniforms.gT=SYNTH_GRID_T;
  sh.vertexShader='varying vec3 vGw;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vGw=(modelMatrix*vec4(transformed,1.)).xyz;');
  const grid=`vec2 q=vGw.xz/9.;vec2 w=max(fwidth(q),vec2(1e-4));vec2 d=abs(fract(q-.5)-.5);vec2 g=d/w;
   float ln=1.-clamp(min(g.x,g.y)-.6,0.,1.);float glow=exp(-min(d.x,d.y)*24.)*.32;
   float far=clamp(1.-max(w.x,w.y)*2.2,0.,1.);float pulse=.85+.15*sin(gT*1.6);float k=(ln*1.15+glow)*far*pulse;`;
  sh.fragmentShader='varying vec3 vGw;uniform float gT;\n'+sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec4 diffuseColor = vec4( diffuse, opacity );\n'+grid+
   (land?'diffuseColor.rgb=mix(diffuse,vec3(1.,.18,.68),clamp(k*.8,0.,1.));':'diffuseColor.rgb=diffuse*k;'));
  if(!land)sh.fragmentShader=sh.fragmentShader.replace('#include <fog_fragment>',`#ifdef USE_FOG
   gl_FragColor.rgb*=1.-smoothstep(fogNear,fogFar,fogDepth);
   #endif`)};
 m.customProgramCacheKey=()=>land?'synthGridLand':'synthGridSea'; // mesmo onBeforeCompile nos dois: sem isso o three reaproveitava o programa errado
 return m}
function synthGrid(grp){
 const mesh=new THREE.Mesh(seaSurfaceGeo(.05),synthGridMat(false));mesh.renderOrder=2;mesh.name='synth-grid';mesh.onBeforeRender=()=>{SYNTH_GRID_T.value=simT};grp.add(mesh);city.synthGrid=mesh;
 return mesh}
const SYNTH_GRID_T={value:0};
// v77: chão além do anel de prédios vira grade neon (no próprio material do chão, então nada que está em cima é coberto)
function synthGroundGrid(mat,E){const old=mat.onBeforeCompile,key=mat.customProgramCacheKey(),a=RW/2+34;
 mat.onBeforeCompile=sh=>{old.call(mat,sh);sh.uniforms.gT=SYNTH_GRID_T;sh.uniforms.sgB={value:new THREE.Vector2(-a,E+a)};
  sh.fragmentShader='uniform float gT;uniform vec2 sgB;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   {vec2 bq=deckWorld.xz;float o=clamp(max(max(sgB.x-bq.x,bq.x-sgB.y),max(sgB.x-bq.y,bq.y-sgB.y))/8.,0.,1.);
    if(o>0.){vec2 q=bq/9.;vec2 w=max(fwidth(q),vec2(1e-4));vec2 d=abs(fract(q-.5)-.5);vec2 g=d/w;
     float ln=1.-clamp(min(g.x,g.y)-.6,0.,1.);float glow=exp(-min(d.x,d.y)*24.)*.32;float far=clamp(1.-max(w.x,w.y)*2.2,0.,1.);
     diffuseColor.rgb*=mix(1.,.22,o);totalEmissiveRadiance+=vec3(1.,.18,.68)*(ln*1.1+glow)*far*o*(.85+.15*sin(gT*1.6));}}`)};
 mat.customProgramCacheKey=()=>key+'|synthGround';mat.needsUpdate=true}
// Cais nos trechos sem praia: parede de pedra da borda do terreno até abaixo da água.
function coastWalls(grp,night){const E=city.ext,o=RW/2,br=beachRange(),mb=new MB(),c1=COL(night?'#4a4458':'#9a958a'),c2=COL(night?'#3a3446':'#7a766c'),G=E+1600;
 const sp=city.coastSpan,L=sp?(sp[0]<0?[E/2,E/2+7]:[E/2-7,E/2]):null;const wall=(t0,t1,u0,u1)=>{if(t1-t0<.05)return;const r=tuRect(t0,t1,u0,u1);mb.box(r[0],SEA_Y-1.6,r[1],r[2],.24,r[3],c1,{});const k=tuRect(t0,t1,u1-.25,u1);mb.box(k[0],.24,k[1],k[2],.32,k[3],c2,{})};
 const pieces=[];if(br[0]>-G)pieces.push([-G,br[0]]);if(br[1]<E+G)pieces.push([br[1],E+G]);
 for(const[t0,t1] of pieces){if(L&&L[1]>t0&&L[0]<t1){wall(t0,Math.max(t0,L[0]),SHORE-.5,SHORE);wall(Math.max(t0,L[0]),Math.min(t1,L[1]),SHORE-.5,SHORE+1.5);wall(Math.min(t1,L[1]),t1,SHORE-.5,SHORE)}else wall(t0,t1,SHORE-.5,SHORE)}
 const m=mb.mesh(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0}),false,true);if(m)grp.add(m)}
function aqSea(grp,night){const E=city.ext,c=city.coast;
 if(city.haze){hazeShore(grp);const W=5000,deep=new THREE.Color('#1e3438');
  const deepP=new THREE.Mesh(new THREE.PlaneGeometry(W,W),new THREE.MeshBasicMaterial({color:deep}));deepP.rotation.x=-Math.PI/2;deepP.position.set(E/2,SEABED.floor-.06,E/2);grp.add(deepP);seaWrecks(grp,night);
  const wt=aqWaveTex().clone();wt.needsUpdate=true;wt.repeat.set(1,1);const wm=new THREE.MeshBasicMaterial({map:wt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.3});
  const wv=new THREE.Mesh(seaSurfaceGeo(.02),wm);wv.renderOrder=2;grp.add(wv);AQ.seaWave=wt;AQ.inl=[0,1];wtrSwell(.5);return}
 // fundo do mar: faixa de areia com pedras e algas que afunda e escurece até o azul profundo
 /* v3 r31: linhas em u = plataforma a cada 3 m, talude a cada 1,5 m, fundo a cada 12 m; cor escurece com a PROFUNDIDADE (a luz entra pouco) */
 const T0=-1600,T1=E+1600,U0=SHORE+2,Sb=SEABED,uT=U0+Sb.shelf,us=[];for(let u=U0;u<uT-4;u+=3)us.push(u);for(let u=uT-4;u<uT+Sb.slope+4;u+=1.5)us.push(u);for(let u=uT+Sb.slope+4;u<SHORE+170;u+=12)us.push(u);us.push(SHORE+170);
 const ts=[];{const br=beachRange(),a=Math.max(T0,br[0]-20),b=Math.min(T1,br[1]+20);for(let t=T0;t<a;t+=22)ts.push(t);for(let t=a;t<b;t+=4)ts.push(t);for(let t=b;t<T1;t+=22)ts.push(t);ts.push(T1)} /* v3 r35: 4 m na praia (borda irregular) */
 const nt=ts.length-1,nu=us.length-1,pos=[],col=[],uv=[],idx=[],y0=seabedY(U0);const deep=new THREE.Color(night?'#070a22':'#0a2c44'),near=new THREE.Color(night?'#5e5a7c':'#e4e0d4'),mid=new THREE.Color(night?'#2a2c50':'#4a8296');
 for(let j=0;j<=nu;j++)for(let i=0;i<=nt;i++){const t=ts[i],u=us[j],p=wTU(c,t,coastUr(t,u)),y=seabedYt(t,u),f=clamp((y0-y)/(y0-Sb.floor),0,1);pos.push(p[0],y,p[1]);const cc=f<.12?near.clone().lerp(mid,f/.12*.55):mid.clone().lerp(deep,Math.pow((f-.12)/.88,.55));col.push(cc.r,cc.g,cc.b);uv.push(p[0]/8,p[1]/8)}
 for(let j=0;j<nu;j++)for(let i=0;i<nt;i++){const a=j*(nt+1)+i,b=a+1,d=a+nt+1,e=d+1;idx.push(a,d,b,b,d,e)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=causticPatch(new THREE.MeshStandardMaterial({map:aqBedTex(),vertexColors:true,roughness:1,side:THREE.DoubleSide}),SEA_Y);const bed=new THREE.Mesh(g,m);bed.receiveShadow=true;grp.add(bed);
 const W=5000,ps=c===0?[E/2,-SHORE-W/2]:c===1?[E/2,E+SHORE+W/2]:c===2?[-SHORE-W/2,E/2]:[E+SHORE+W/2,E/2];
 const deepP=new THREE.Mesh(new THREE.PlaneGeometry(W,W),new THREE.MeshBasicMaterial({color:deep}));deepP.rotation.x=-Math.PI/2;deepP.position.set(ps[0],SEABED.floor-.06,ps[1]);grp.add(deepP);seaWrecks(grp,night); /* v3 r31: plano fundo no piso novo + carcaças */
 const wt=aqWaveTex().clone();wt.needsUpdate=true;wt.repeat.set(1,1);const wm=new THREE.MeshBasicMaterial({map:wt,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night?.22:.38});
 const wv=new THREE.Mesh(seaSurfaceGeo(.02),wm);coastWalls(grp,night);wv.renderOrder=2;grp.add(wv);AQ.seaWave=wt;AQ.inl=c===0?[0,1]:c===1?[0,-1]:c===2?[1,0]:[-1,0];wtrSwell(1)}
/* v3 r31 · carcaças de lanchas no fundo: posições sorteadas por gerador próprio da seed (não mexe no R()), deitadas/afundadas no piso,
   escuras e enferrujadas; um único lote (1 draw call), dentro do grupo da cidade (some na troca de mundo). */
function seaWrecks(grp,night){const E=city.ext,c=city.coast,r=mulberry32((S.seed^0x5eab0a7)>>>0),mb=new MB(),Sb=SEABED,u0=SHORE+2+Sb.shelf+Sb.slope+14,W=new THREE.Matrix4(),L=new THREE.Matrix4(),Mx=new THREE.Matrix4();
 /* v3 r32: 16 no total = 8 no mar (Point Haze: em volta da ilha) + 8 no fundo dos rios (menores, abaixo da superfície; faltando rio, o resto vai para o mar) */
 const spots=[],riv=(city.water||[]).filter(w=>!w.cutOnly&&!w.estuary&&w[2]-w[0]>=40&&w[3]-w[1]>=40&&w[2]-w[0]<=90&&w[3]-w[1]<=90&&w[0]>=0&&w[2]<=E&&w[1]>=0&&w[3]<=E);
 for(let k=riv.length-1;k>0;k--){const j=Math.floor(r()*(k+1));[riv[k],riv[j]]=[riv[j],riv[k]]}
 for(const w of riv.slice(0,8)){const x=(w[0]+w[2])/2+(r()-.5)*12,z=(w[1]+w[3])/2+(r()-.5)*12;spots.push({x,z,y:riverBedY(x,z),s:.7,riv:true})}
 const ns=16-spots.length;for(let k=0;k<ns;k++){const u=u0+r()*(SHORE+(city.haze?120:150)-u0);let p,y;
  if(city.haze){p=hazeRay((k+r()*.8)/ns*6.2832,u);y=seabedY(u)}else{const t=-260+(E+520)*(k+r()*.8)/ns;p=wTU(c,t,u);y=seabedYt(t,coastUe(t,u))}spots.push({x:p[0],z:p[1],y,s:1})}city.wrecks=spots;
 const hullC=['#2c3236','#3a2c24','#30363a','#423024','#262a2e'],dim=night?.55:1;
 const part=(g,x,y,z,sx,sy,sz,rx,ry,rz,col)=>{L.copy(mtx(x,y,z,sx,sy,sz,rx,ry,rz));Mx.multiplyMatrices(W,L);mb.geo(g,Mx,COL(col).multiplyScalar(dim*(.8+r()*.25)))};
 for(const sp of spots){const Lh=5+r()*5,Bh=Lh*.34,roll=(r()<.5?-1:1)*(.25+r()*.9)*(sp.riv?.6:1),pitch=(r()-.5)*.25,a=r()*6.283,hc=hullC[Math.floor(r()*hullC.length)],ss=sp.s;
  W.compose(new THREE.Vector3(sp.x,sp.y+(.25+Math.abs(roll)*.25)*ss,sp.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(roll,a,pitch,'YXZ')),new THREE.Vector3(ss,ss,ss));
  part(BOXG,-Lh*.1,.35,0,Lh*.8,.75,Bh,0,0,0,hc);part(BOXG,-Lh*.1,-.05,0,Lh*.7,.35,Bh*.55,0,0,0,hc);  /* casco: costado + quilha */
  part(GEO.cone,Lh*.38,.3,0,Bh*.5,Lh*.24,.75*.6,0,0,-Math.PI/2,hc);                                  /* proa */
  part(BOXG,-Lh*.48,.45,0,.18,.85,Bh*.95,0,0,0,'#1e2226');                                           /* popa */
  if(r()<.7)part(BOXG,-Lh*.15+r()*.4,1.05,(r()-.5)*.3,Lh*.28,.65+r()*.3,Bh*.62,(r()-.5)*.3,0,(r()-.5)*.35,r()<.5?'#5a5a56':'#4a4038'); /* cabine quebrada */
  if(r()<.5&&!sp.riv)part(BOXG,-Lh*.15,1.6,0,.1,1.4,.1,(r()-.5)*.6,0,(r()-.5)*.9,'#2a2a2a');                    /* mastro torto */
  if(r()<.6)part(BOXG,Lh*.05,.78,Bh*.51,Lh*.35,.12,.05,0,0,0,'#6a3c26')}                              /* faixa de ferrugem */
 const m=mb.mesh(new THREE.MeshLambertMaterial({vertexColors:true}),false,false);if(m){m.frustumCulled=true;grp.add(m)}}
function wtrSwell(k){const u=city.waterMat&&city.waterMat.userData.wSw;if(u)u.value.set(AQ.inl[0],AQ.inl[1],k)}
function hazeShore(grp){const K=240,us=[RW/2-.02,RW/2,RW/2+4,RW/2+8,SAND0-.5,SAND0+.5];for(let u=SAND_FLAT;u<SHORE+8;u+=2.5)us.push(u);for(let u=SHORE+8;u<=SHORE+140;u+=9)us.push(u);
 const grass=hazeBaseCol().clone(),sand=COL('#b3a066'),bed=COL('#6a6248'),deep=COL('#24383a'),pos=[],col=[],uv=[],idx=[],nu=us.length;
 const hy=u=>u<RW/2?0:u<SAND0?.2:u<=SHORE+2?beachProfile(u)+.02:seabedY(u);
 for(let k=0;k<K;k++){const a=k/K*6.2832;for(let j=0;j<nu;j++){const u=us[j],p=hazeRay(a,u),n=Math.sin(p[0]*.37)*Math.cos(p[1]*.29)*.5+Math.sin(p[0]*.11+p[1]*.13)*.5;let c;
   if(u<SAND0-.4)c=grass.clone().multiplyScalar(.97+.06*n);else if(u<=SHORE)c=wetSand(sand.clone().multiplyScalar(.9+.1*n).lerp(grass,clamp((SAND0+3-u)/4,0,1)*.5),u);
   else{const y0=beachProfile(SHORE+2),f=clamp((y0-hy(u))/(y0-SEABED.floor),0,1);c=bed.clone().lerp(deep,f<.12?f/.12*.45:.45+.55*Math.pow((f-.12)/.88,.55))} /* v3 r32: escurece pela profundidade (talude) */
   pos.push(p[0],hy(u),p[1]);col.push(c.r,c.g,c.b);uv.push(p[0]/7,p[1]/7)}}
 {const E=city.ext,R=new Float32Array(K*nu);for(let i=0;i<K*nu;i++)R[i]=Math.hypot(pos[i*3]-E/2,pos[i*3+2]-E/2);city.hzShore={K,nu,us,R,hy:us.map(hy),c:E/2}} // v78: colisão da areia = a própria malha
 for(let k=0;k<K;k++){const k2=(k+1)%K;for(let j=0;j<nu-1;j++){const a=k*nu+j,b=k2*nu+j,c=a+1,d=b+1;idx.push(a,c,b,b,c,d)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 const m=surfPatch(causticPatch(new THREE.MeshStandardMaterial({map:worldSandTex(),vertexColors:true,roughness:1,side:THREE.DoubleSide}),SEA_Y),'sand'); /* v3 r35: mesma textura da praia (SURF) */const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;grp.add(mesh)}
function aqTick(dt){waterTick(dt);shfxTick(dt);if(AQ.seaWave){AQ.seaWave.offset.x+=dt*.004;AQ.seaWave.offset.y+=dt*.012}const M=city.M;if(M&&M.wave&&M.wave.map){M.wave.map.offset.x+=dt*.01;M.wave.map.offset.y+=dt*.006}
 // cardumes
 if(!AQ.fish){const geo=new THREE.ConeGeometry(.09,.5,5);geo.rotateZ(-Math.PI/2);AQ.fish=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0x14232e,transparent:true,opacity:.6,depthWrite:false}),96);AQ.fish.frustumCulled=false;AQ.fish.count=0;scene.add(AQ.fish)}
 const fm=AQ.fish;if(!played||PL.inside||!city.ext){fm.count=0;return}const pc=PL.car||PL,cx=camMode==='top'?pc.x:camera.position.x,cz=camMode==='top'?pc.z:camera.position.z;
 {const L=AQ.schools;let w=0;for(let i=0;i<L.length;i++){const s=L[i];if(Math.hypot(s.x-cx,s.z-cz)<170)L[w++]=s}L.length=w}
 if(AQ.schools.length<4&&Math.random()<dt*2){for(let k=0;k<6;k++){const a=Math.random()*6.28,d=30+Math.random()*90,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;const sea=outDist(x,z)>SHORE+5,riv=!sea&&city.riv&&city.riv.size&&waterAt(x,z)&&riverZone(x,z)&&pollAt(x,z)<.3;
   if(!sea&&!riv)continue;if(city.lh&&lhLand(x,z))continue;const n=8+Math.floor(Math.random()*10),h=Math.random()*6.28;AQ.schools.push({x,z,y:sea?SEA_Y-.95-Math.random()*1.2:RY-.55,h,sp:1.2+Math.random()*1.6,sea,f:Array.from({length:n},()=>[(Math.random()-.5)*3,(Math.random()-.5)*2.2,Math.random()*6.28,(Math.random()-.5)*.25])});break}}
 let n=0;const T=AQ._tmp||(AQ._tmp={m4:new THREE.Matrix4(),q:new THREE.Quaternion(),e:new THREE.Euler(),one:new THREE.Vector3(1,1,1),v:new THREE.Vector3()}),m4=T.m4,q=T.q,e=T.e,one=T.one,v=T.v;
 for(const s of AQ.schools){s.h+=(Math.sin(simT*.3+s.x)*.25)*dt;let nx=s.x+Math.cos(s.h)*s.sp*dt,nz=s.z+Math.sin(s.h)*s.sp*dt;const ok=s.sea?outDist(nx+Math.cos(s.h)*4,nz+Math.sin(s.h)*4)>SHORE+4&&!(city.lh&&lhLand(nx,nz)):(waterAt(nx+Math.cos(s.h)*3,nz+Math.sin(s.h)*3)&&riverZone(nx+Math.cos(s.h)*3,nz+Math.sin(s.h)*3));
  if(!ok)s.h+=Math.PI*(.6+Math.random()*.4)*dt*6;else{s.x=nx;s.z=nz}
  const ca=Math.cos(s.h),sa=Math.sin(s.h);for(const f of s.f){if(n>=96)break;const w=Math.sin(simT*3+f[2])*.35,lx=f[0]+w,lz=f[1];v.set(s.x+ca*lx-sa*lz,s.y+f[3],s.z+sa*lx+ca*lz);e.set(0,-s.h+Math.sin(simT*6+f[2])*.25,0);q.setFromEuler(e);m4.compose(v,q,one);fm.setMatrixAt(n++,m4)}}
 fm.count=n;fm.instanceMatrix.needsUpdate=true}


