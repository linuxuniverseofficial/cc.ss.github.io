'use strict';
/* Coastal Chaos · js/17-veiculos.js — Veículos e ferramentas de modelagem.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= VEHICLES ================= */
const VT={
 sedan:{L:4.5,W:1.9,H:1.42,m:1250,acc:7.4,vmax:46,mu:1.12,steer:.6,wr:.34,wb:1.4},
 taxi:{L:4.6,W:1.9,H:1.42,m:1300,acc:7.2,vmax:45,mu:1.1,steer:.6,wr:.34,wb:1.45},
 sports:{L:4.3,W:1.98,H:1.15,m:1150,acc:10.2,vmax:62,mu:1.28,steer:.55,wr:.31,wb:1.35},
 van:{L:5.2,W:2.05,H:2.25,m:2000,acc:6.8,vmax:41,mu:1.0,steer:.55,wr:.38,wb:1.7},
 pickup:{L:5.1,W:2.0,H:1.75,m:1850,acc:7.9,vmax:47,mu:1.05,steer:.55,wr:.4,wb:1.65},
 truck:{L:7.6,W:2.4,H:3.4,m:4800,acc:5.7,vmax:36,mu:.95,steer:.5,wr:.5,wb:2.6},
 bus:{L:11,W:2.55,H:3.2,m:9000,acc:4.85,vmax:32,mu:.92,steer:.5,wr:.5,wb:3.9},
 police:{L:4.7,W:1.95,H:1.5,m:1350,acc:10.6,vmax:60,mu:1.38,steer:.62,wr:.35,wb:1.45},
 super:{L:4.5,W:2.02,H:1.1,m:1120,acc:13.6,vmax:82,mu:1.55,steer:.55,wr:.33,wb:1.45},
 conv:{L:4.4,W:1.92,H:1.15,m:1250,acc:8.6,vmax:56,mu:1.2,steer:.58,wr:.33,wb:1.38},
 hatch:{L:3.9,W:1.76,H:1.48,m:1050,acc:7.6,vmax:44,mu:1.12,steer:.64,wr:.31,wb:1.22},
 suv:{L:4.8,W:2.0,H:1.85,m:1900,acc:8.4,vmax:49,mu:1.08,steer:.56,wr:.4,wb:1.5},
 moto:{L:2.2,W:.9,H:1.45,m:260,acc:8,vmax:54,mu:1.6,steer:.5,wr:.34,wb:.74,vtw:0},
 boat:{L:6.2,W:2.4,H:1.6,m:1100,acc:8,vmax:30,mu:.5,steer:.55,wr:.2,wb:2,boat:true},
 wagon:{L:4.7,W:1.88,H:1.48,m:1350,acc:7.2,vmax:45,mu:1.1,steer:.58,wr:.34,wb:1.5},
 crossover:{L:4.4,W:1.92,H:1.68,m:1600,acc:8.6,vmax:50,mu:1.1,steer:.58,wr:.38,wb:1.4},
 mini:{L:3.3,W:1.62,H:1.5,m:850,acc:7.4,vmax:42,mu:1.12,steer:.7,wr:.29,wb:1.0},
 roadster:{L:3.9,W:1.82,H:1.05,m:1050,acc:10.4,vmax:60,mu:1.3,steer:.6,wr:.32,wb:1.22},
 jetski:{L:3.0,W:1.2,H:1.15,m:380,acc:12,vmax:40,mu:.5,steer:.66,wr:.15,wb:.9,boat:true},
 vortex:{L:4.6,W:2.3,H:2.0,m:900,acc:9.5,vmax:38,mu:.55,steer:.55,wr:.3,wb:1.5,hover:true}
};
for(const k in VT){const t=VT[k];t.eng=t.m*t.acc;t.ks=t.m*12;t.kr=t.m*.1;t.cd=t.eng/(t.vmax*t.vmax);t.R=Math.hypot(t.L/2,t.W/2);t.tw=t.W/2-.2;
 const n=Math.max(2,Math.round(t.L/t.W));t.circ=[];for(let i=0;i<n;i++)t.circ.push(-(t.L/2-t.W/2)+i*(t.L-t.W)/(n-1));t.I=t.m*(t.L*t.L+t.W*t.W)/12}
/* r40 · DESEMPENHO REAL: velocidade final e 0–100 por tipo (o teto antigo era a resistência de rolamento: ~60–105 km/h).
   [final km/h, 0–100 s, marchas, curva das marchas]. Escala: o mais rápido do jogo ficou ~1,5× o anterior (106 → 160).
   A física continua a mesma (força = motor − rolamento − arrasto); só kr/cd/acc são recalculados para bater esses números. */
const VPERF={super:[160,4.6,6,1.35],sports:[150,5.6,6,1.25],roadster:[148,5.9,6,1.25],police:[150,6.2,6,1.2],conv:[140,6.9,5,1.2],moto:[140,4.9,6,1.3],
 crossover:[132,9,5,1.05],suv:[130,9.6,5,1],sedan:[128,9.6,5,1.1],wagon:[125,10.2,5,1.1],taxi:[125,10.2,5,1.1],pickup:[125,10.6,5,.95],hatch:[122,10.6,5,1.05],mini:[115,11.4,4,1],van:[110,13.5,5,.95],truck:[95,19,8,.9],bus:[85,23,6,.85]};
for(const k in VPERF){const t=VT[k],[top,t100,ng,gp]=VPERF[k],vt=top/3.6,capA=2*1.25*t.mu*9.81/4;
 const sim=acc=>{const thr=Math.min(acc,capA),kk=.6*thr/(4*vt),cd=.4*thr/(vt*vt);let v=0,tt=0;const goal=Math.min(27.78,vt*.92);while(v<goal&&tt<60){const a=Math.min(acc,capA)-4*kk*v-cd*v*v;v+=a*.02;tt+=.02}return tt*(27.78/goal)};
 let lo=1,hi=40;for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(sim(mid)>t100)lo=mid;else hi=mid}const acc=(lo+hi)/2,thr=Math.min(acc,capA);
 t.acc=acc;t.eng=t.m*acc;t.kr=t.m*.6*thr/(4*vt);t.cd=t.m*.4*thr/(vt*vt);t.top=vt;t.gears=ng;t.gp=gp}
/* marcha atual pelo desempenho do tipo: trocas mais curtas no começo e mais longas no fim (curva gp); barcos e hover ficam com o esquema antigo */
/* v3 r39: marcha ré = 1 marcha só, até 30 km/h (REV_MAX em m/s). revK = fração da força de ré conforme a velocidade de ré (rv>0):
   cheia até ~0,45 m/s antes do limite, zero logo acima dele e negativa acima (segura o carro em descida/empurrão). Física (carStep/boatStep), som e HUD usam. */
const REV_MAX=30/3.6;function revK(rv){return rv<=0?1:clamp((REV_MAX+.15-rv)/.6,-1,1)}
function engGear(c,sp){const t=c.t;if(!t.gears){const G=ENG_GEARS,gs=Math.max(2.5,t.vmax*.14);const g=Math.min(G-1,Math.floor(sp/gs));let r=(sp-g*gs)/gs;if(g===G-1)r=Math.min(1.6,r);return[g,r]}
 const n=t.gears,top=t.top*.97,f=Math.min(1,sp/top);let g=0;while(g<n-1&&f>Math.pow((g+1)/n,t.gp))g++;const a=Math.pow(g/n,t.gp),b=Math.pow((g+1)/n,t.gp);let r=(f-a)/Math.max(.001,b-a);if(sp>top)r=1+(sp-top)/top*2;return[g,Math.min(1.6,r)]}
function randomType(st,x,z){const b=randomType0(st,x,z),r=R2();return b==='sedan'&&r<.33?'wagon':b==='suv'&&r<.45?'crossover':b==='hatch'&&r<.4?'mini':b==='conv'&&r<.45?'roadster':b}
function randomType0(st,x,z){const r=R2();
 if(x!==undefined&&city.ext){if(isRural(x,z))return r<.45?'pickup':r<.70?'suv':r<.9?'truck':'van';
  if(outDist(x,z)>-95&&onBeach(x,z))return r<.28?'conv':r<.4?'sports':r<.5?'moto':r<.6?'hatch':r<.72?'sedan':r<.8?'suv':r<.9?'taxi':'van';
  const dc=Math.hypot(x-city.ext/2,z-city.ext/2)/(city.ext*.7);if(dc>.55&&!st.synth&&r<.3)return r<.12?'suv':r<.22?'hatch':'pickup'}
 if(st.synth){return r<.3?'sedan':r<.42?'sports':r<.48?'conv':r<.56?'taxi':r<.64?'hatch':r<.71?'moto':r<.78?'van':r<.85?'pickup':r<.93?'truck':'bus'}
 if(r>.93)return'moto';return r<.28?'sedan':r<.45?'taxi':r<.52?'sports':r<.6?'hatch':r<.67?'suv':r<.75?'van':r<.83?'pickup':r<.89?'truck':r<.91?'conv':'bus'}
/* v78: luz dos postes SO na pintura dos veiculos (postes sem PointLight na cena). 4 postes virtuais (nearLampLights) em
   coordenadas de mundo; mesma atenuacao do PointLight (decay 2, alcance 14) e mesmo difuso Lambert. So os pixels de carro pagam. */
const CAR_LAMP={p:{value:[0,1,2,3].map(()=>new THREE.Vector3())},c:{value:[0,1,2,3].map(()=>new THREE.Color(0,0,0))}};
function carLampSync(){for(let i=0;i<4;i++){const s=nearLampLights[i],l=s&&s.light;if(l&&l.intensity>0){CAR_LAMP.p.value[i].copy(l.position);CAR_LAMP.c.value[i].copy(l.color).multiplyScalar(l.intensity)}else CAR_LAMP.c.value[i].setRGB(0,0,0)}}
function carLampInject(sh){sh.uniforms.cLP=CAR_LAMP.p;sh.uniforms.cLC=CAR_LAMP.c;{const K=skyMat.uniforms;sh.uniforms.fxK=SHFX.U.fxK;sh.uniforms.cBurnt={value:0};sh.uniforms.top=K.top;sh.uniforms.hor=K.hor;sh.uniforms.sunDir=K.sunDir;sh.uniforms.night=K.night;sh.uniforms.sunDim=K.sunDim;sh.uniforms.csSun=K.csSun}
 sh.vertexShader='varying vec3 vCWp;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vCWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
 sh.fragmentShader='uniform vec3 cLP[4];uniform vec3 cLC[4];varying vec3 vCWp;uniform vec4 fxK;uniform float cBurnt,night,sunDim,csSun;uniform vec3 top,hor,sunDir;\n'+sh.fragmentShader.replace('#include <tonemapping_fragment>',CAR_SKY_GLSL+'\n#include <tonemapping_fragment>').replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n {vec3 cN=inverseTransformDirection(geometry.normal,viewMatrix);for(int i=0;i<4;i++){if(cLC[i].r+cLC[i].g+cLC[i].b<=0.0)continue;vec3 lv=cLP[i]-vCWp;float d=length(lv);float at=pow(saturate(1.0-d/14.0),2.0);float nl=saturate(dot(cN,lv/max(d,.001)));reflectedLight.directDiffuse+=cLC[i]*(at*nl)*material.diffuseColor;}}')}
/* v3 r25: reflexo do céu na lataria (SHFX fxK.w): Fresnel com as cores do skyMat (top/hor, compartilhadas: acompanha
   dia, pôr do sol, noite e outros mundos sem CPU), abaixo do horizonte reflete "chão" escuro (a linha do horizonte na porta),
   e um brilho pequeno do sol. Carcaça queimada (cBurnt) fica sem. */
const CAR_SKY_GLSL=`if(fxK.w>.5&&cBurnt<.5){vec3 cV=normalize(vCWp-cameraPosition);vec3 cNw=normalize(inverseTransformDirection(normal,viewMatrix));if(dot(cNw,cV)>0.)cNw=-cNw;
 vec3 cR=reflect(cV,cNw);float cT=clamp(dot(-cV,cNw),0.,1.);float cF=.05+.55*pow(1.-cT,3.);float cU=cR.y;
 vec3 cSk=cU>0.?mix(hor,top,pow(cU,.6)):mix(hor*.5,hor*.16+vec3(.03),smoothstep(0.,.18,-cU));
 cSk+=hor*.22*(1.-smoothstep(0.,.07,abs(cU-.015)))*(1.-night);
 vec3 cSd=normalize(sunDir);float cS=pow(max(dot(cR,cSd),0.),260.)*2.*smoothstep(-.03,.08,cSd.y)*sunDim*(1.-.85*csSun)*(1.-night);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,cSk*mix(1.,.65,night),cF*mix(.6,.35,night))+vec3(1.,.93,.8)*cS;}`;
const carBodyMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.18});
carBodyMat.onBeforeCompile=carLampInject;carBodyMat.customProgramCacheKey=()=>'carLamp';
const carLightMat=new THREE.MeshBasicMaterial({vertexColors:true});
// v226: luzes dos estacionados apagadas sem novos materiais, shaders, luzes ou buffers.
function carLampOn(c){
 if(!c||!c.alive||c.exploded)return false;
 /* r38: luz ligada = carro com alguém dirigindo (jogador, trânsito, perseguição, jogador online), mesmo parado no sinal.
    Desligado só quando ninguém está ao volante (estacionado, abandonado, motorista arrancado). O farol de verdade do jogador (spot) continua no HEAD/headOn. */
 if(c===PL.car)return true;
 return !!(c.ai||c.mode==='rail'||c.mode==='net'||c.chase||c.rider&&c.hasRider!==false&&c.type==='moto'&&c.ai)||Math.abs(c.fwd||0)>.65;
}
// v101: carroceria dos carros de perto com a abertura das caixas de roda recortada no shader (espaço local do chassi).
// A roda aparece inteira dentro do arco (inclusive esterçada) e substitui o antigo truque de esconder a metade de cima da roda.
const HOLE_MATS=new Map();
function carHoleMat(c,burnt){const t=c.t,k=c.type+(burnt?'#b':'');let m=HOLE_MATS.get(k);if(m)return m;
 m=(burnt?burntMat:carBodyMat).clone();const A=t.arch||{r0:t.wr+.042,zi:t.tw-.18,capF:9,capR:9},U={hWb:{value:t.wb},hWr:{value:t.wr},hR0:{value:A.r0},hZi:{value:A.zi},hRear:{value:c.type==='truck'?0:1},hCapF:{value:A.capF},hCapR:{value:A.capR},cBurnt:{value:burnt?1:0}};
 m.onBeforeCompile=sh=>{carLampInject(sh);Object.assign(sh.uniforms,U);sh.vertexShader='varying vec3 vLp;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vLp=position;');
  sh.fragmentShader='uniform float hWb,hWr,hR0,hZi,hRear,hCapF,hCapR;varying vec3 vLp;\n'+sh.fragmentShader.replace('void main() {','void main() {\n if(abs(vLp.z)>hZi){float dy=vLp.y-hWr,r2=hR0*hR0*.998,df=vLp.x-hWb,dr=vLp.x+hWb;if((df*df+dy*dy<r2&&vLp.y<hCapF-.001)||(hRear>.5&&dr*dr+dy*dy<r2&&vLp.y<hCapR-.001))discard;}')};
 m.customProgramCacheKey=()=>'carHoleL';m.userData.carBody=true;HOLE_MATS.set(k,m);return m}
const wheelMat=new THREE.MeshStandardMaterial({color:0x151515,roughness:.8});
const hubMat=new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:.4,metalness:.5});
const wheelGeo=new THREE.CylinderGeometry(1,1,.32,16);wheelGeo.rotateX(Math.PI/2);
// v101: roda de liga com aro, 5 raios e cubo (antes era só um disco minúsculo no centro do pneu)
const hubGeo=(()=>{const m=new MB(),c=new THREE.Color(1,1,1),ring=new THREE.RingGeometry(.5,.64,12).toNonIndexed(),sp=new THREE.BoxGeometry(.16,.44,.035).toNonIndexed();
 for(const s of [1,-1]){m.geo(ring,mtx(0,0,s*.171,1,1,1,0,s>0?0:Math.PI,0),c);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;m.geo(sp,mtx(-Math.sin(a)*.29,Math.cos(a)*.29,s*.163,1,1,1,0,0,a),c)}}
 m.geo(new THREE.CylinderGeometry(.13,.13,.37,8).toNonIndexed(),mtx(0,0,0,1,1,1,Math.PI/2,0,0),c);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(m.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(m.n,3));if(m.idx)g.setIndex(m.idx);return g})();
const CAR_WHEEL_CAP=512,CAR_WHEEL_IM=new THREE.InstancedMesh(wheelGeo,wheelMat,CAR_WHEEL_CAP),CAR_HUB_IM=new THREE.InstancedMesh(hubGeo,hubMat,CAR_WHEEL_CAP);
CAR_WHEEL_IM.castShadow=true;CAR_WHEEL_IM.receiveShadow=false;CAR_WHEEL_IM.frustumCulled=false;CAR_WHEEL_IM.count=0;CAR_WHEEL_IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
CAR_HUB_IM.castShadow=false;CAR_HUB_IM.receiveShadow=false;CAR_HUB_IM.frustumCulled=false;CAR_HUB_IM.count=0;CAR_HUB_IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(CAR_WHEEL_IM,CAR_HUB_IM);
function attachCarWheelMeshes(c){if(!c||!c.wheels||c.hasWheelMeshes)return;c.hasWheelMeshes=true;const r=c.t.wr;for(const wh of c.wheels){const wm=new THREE.Mesh(wheelGeo,wheelMat);wm.scale.copy(wh.w.scale);wm.rotation.copy(wh.w.rotation);wm.castShadow=true;wm.add(new THREE.Mesh(hubGeo,hubMat));wh.piv.remove(wh.w);wh.piv.add(wm);wh.w=wm}if(c.mudWheelMat&&(c.grime||0)>=.25&&typeof mudWheels==='function')mudWheels(c,true,Math.min(.5,(c.grime-.25)*.8))}
function syncCarWheelInstances(){let n=0;for(const c of vehicles){if(!c.g||!c.g.visible||!c.wheels||c.hasWheelMeshes)continue;c.g.updateMatrixWorld();for(const wh of c.wheels){if(!wh.piv.visible||n>=CAR_WHEEL_CAP)continue;CAR_WHEEL_IM.setMatrixAt(n,wh.w.matrixWorld);CAR_HUB_IM.setMatrixAt(n,wh.w.matrixWorld);n++}}CAR_WHEEL_IM.count=n;CAR_HUB_IM.count=n;if(n){CAR_WHEEL_IM.instanceMatrix.needsUpdate=true;CAR_HUB_IM.instanceMatrix.needsUpdate=true}}
const WHEEL_FULL=new THREE.CylinderGeometry(1,1,.32,16).toNonIndexed();WHEEL_FULL.rotateX(Math.PI/2);
const WHEEL_NI=new THREE.CylinderGeometry(1,1,.32,16,1,false,-Math.PI/2,Math.PI).toNonIndexed();WHEEL_NI.rotateX(Math.PI/2); // carros distantes: só a metade de baixo da roda
const vehicles=[];let vid=0;
const LANES=[1.9,5.6];
function rearGlassSurface(cabin,x){
 for(let i=0;i<cabin.length-1;i++){const a=cabin[i],b=cabin[i+1];if(x<a.x||x>b.x)continue;const t=(x-a.x)/(b.x-a.x||1);return{y:a.p[2][1]+(b.p[2][1]-a.p[2][1])*t,half:a.p[2][0]+(b.p[2][0]-a.p[2][0])*t}}
 throw new Error('Rear glass sample outside cabin');
}
function addRearGlassSlats(body,cabin,xRear,xRoof,color){
 const span=xRoof-xRear,thick=.016,skin=.006;
 for(let j=0;j<5;j++){
  const x=xRear+span*(.15+j*.16),w=.055;
  // Split at the actual cabin sections: both low and high detail stay flush to their glass.
  const xs=[x-w/2,...cabin.map(c=>c.x).filter(v=>v>x-w/2&&v<x+w/2),x+w/2];
  for(let k=0;k<xs.length-1;k++){
   const a=xs[k],b=xs[k+1],u=rearGlassSurface(cabin,a),v=rearGlassSurface(cabin,b),half=Math.min(u.half,v.half)*.94;
   const mb=new MB();mb.box(a,0,-half,b,thick,half,color,{bottom:true});
   for(let i=0;i<mb.p.length;i+=3){const t=(mb.p[i]-a)/(b-a);mb.p[i+1]+=u.y+(v.y-u.y)*t+skin}
   // Transform normals with the same shear as the inclined strip geometry.
   const slope=(v.y-u.y)/(b-a);for(let i=0;i<mb.n.length;i+=3){let nx=mb.n[i]-slope*mb.n[i+1],ny=mb.n[i+1],nz=mb.n[i+2];const l=Math.hypot(nx,ny,nz)||1;mb.n[i]=nx/l;mb.n[i+1]=ny/l;mb.n[i+2]=nz/l}
   const b0=body.p.length/3;body.p.push(...mb.p);body.n.push(...mb.n);body.u.push(...mb.u);body.c.push(...mb.c);if(body.idx){if(mb.idx)for(const x of mb.idx)body.idx.push(b0+x);else for(let q=0,qn=mb.p.length/3;q<qn;q++)body.idx.push(b0+q)}
  }
 }
}
// ===== v105: ferramentas de modelagem compartilhadas (a mesma receita dos carros: seções + loft + normais suavizadas) =====
// superelipse (e=2 elipse; maior = mais "quadrada" com cantos redondos). Pontos [z,y] começando embaixo, sentido anti-horário.
function supSec(rz,ry,cy,n,e){const p=[],q=2/(e||2);for(let k=0;k<n;k++){const t=-Math.PI/2+k/n*Math.PI*2,c=Math.cos(t),s=Math.sin(t);p.push([rz*Math.sign(c)*Math.pow(Math.abs(c),q),cy+ry*Math.sign(s)*Math.pow(Math.abs(s),q)])}return p}
// suaviza as normais (média por vértice de mesma posição+cor): superfícies redondas sem perder as divisas de cor
function mbSoft(mb,start,keep){keep=keep===undefined?.3:keep;const N=new Map(),key=i=>Math.round(mb.p[i]*1e4)+','+Math.round(mb.p[i+1]*1e4)+','+Math.round(mb.p[i+2]*1e4)+':'+mb.c[i].toFixed(3)+mb.c[i+1].toFixed(3)+mb.c[i+2].toFixed(3);
 for(let i=start;i<mb.p.length;i+=3){const k=key(i),v=N.get(k)||[0,0,0];v[0]+=mb.n[i];v[1]+=mb.n[i+1];v[2]+=mb.n[i+2];N.set(k,v)}
 for(let i=start;i<mb.p.length;i+=3){const v=N.get(key(i)),l=Math.hypot(...v)||1;let x=mb.n[i]*keep+v[0]/l*(1-keep),y=mb.n[i+1]*keep+v[1]/l*(1-keep),z=mb.n[i+2]*keep+v[2]/l*(1-keep);const m=Math.hypot(x,y,z)||1;mb.n[i]=x/m;mb.n[i+1]=y/m;mb.n[i+2]=z/m}}
// loft de estações {x,rz,ry,cy,e} com cor por quad (x,y,z do meio do quad)
function mbLoftSt(mb,ST,n,colF,soft){const BS=ST.map(o=>({x:o.x,cy:o.cy,p:supSec(o.rz,o.ry,o.cy,n,o.e)})),start=mb.p.length;
 mb.loft(BS,(a,i)=>{if(a<0||a>=BS.length-1)return colF((a<0?BS[0]:BS[BS.length-1]).x,BS[0].cy,0,true);const A=BS[a],B=BS[a+1],j=(i+1)%n;return colF((A.x+B.x)/2,(A.p[i][1]+A.p[j][1]+B.p[i][1]+B.p[j][1])/4,(A.p[i][0]+A.p[j][0])/2,false)});
 if(soft!==false)mbSoft(mb,start);return BS}
// superfície aerodinâmica (asa, estabilizador, deriva, pá): perfil entre duas pontas {le,te,s,v,t}; vert=true → envergadura em y
function mbFoil(mb,A,B,col,vert){const sec=o=>{const c=o.le-o.te,T=o.t;return[[o.le,0],[o.le-c*.05,T*.42],[o.le-c*.3,T*.5],[o.le-c*.7,T*.26],[o.te,T*.04],[o.te,-T*.04],[o.le-c*.7,-T*.14],[o.le-c*.3,-T*.28],[o.le-c*.05,-T*.24]]};
 const P=(o,q)=>vert?[q[0],o.s,o.v+q[1]]:[q[0],o.v+q[1],o.s],C=o=>vert?[(o.le*.6+o.te*.4),o.s,o.v]:[(o.le*.6+o.te*.4),o.v,o.s],a=sec(A),b=sec(B),n=a.length,ca=C(A),cb=C(B),mid=[(ca[0]+cb[0])/2,(ca[1]+cb[1])/2,(ca[2]+cb[2])/2],start=mb.p.length;
 for(let i=0;i<n;i++){const j=(i+1)%n;mb.qa(P(A,a[i]),P(A,a[j]),P(B,b[j]),P(B,b[i]),col,mid)}
 for(const[E,e,o] of [[A,a,cb],[B,b,ca]]){const c0=C(E);for(let i=0;i<n;i++){const j=(i+1)%n;mb.qa(c0,P(E,e[i]),P(E,e[j]),P(E,e[j]),col,o)}}
 mbSoft(mb,start,.55)}
// copia um MB aplicando uma matriz (girar/posicionar peças repetidas, ex.: pás do rotor)
function mbAddXf(dst,src,m){const v=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(m),b0=dst.p.length/3;for(let i=0;i<src.p.length;i+=3){v.set(src.p[i],src.p[i+1],src.p[i+2]).applyMatrix4(m);dst.p.push(v.x,v.y,v.z);v.set(src.n[i],src.n[i+1],src.n[i+2]).applyMatrix3(nm).normalize();dst.n.push(v.x,v.y,v.z);dst.c.push(src.c[i],src.c[i+1],src.c[i+2])}for(const u of src.u)dst.u.push(u);if(dst.idx){if(src.idx)for(const x of src.idx)dst.idx.push(b0+x);else for(let k=0,n=src.p.length/3;k<n;k++)dst.idx.push(b0+k)}}
// tubo entre dois pontos (corrimão, trem de pouso, estrutura)
function mbTube(mb,a,b,r,col,seg){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],L=Math.hypot(dx,dy,dz)||1e-3,q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(dx/L,dy/L,dz/L)),m=new THREE.Matrix4().compose(new THREE.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,new THREE.Vector3(r,L,r));mb.geo(seg||GEO.cyl,m,col)}
// z da lateral da carroceria numa seção (pontos [z,y] do lado direito, de baixo pra cima)
function carZAt(P,y){if(y<=P[0][1])return P[0][0];let best=P[0][0];for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if(a[0]<=0||b[0]<=0||b[1]<a[1])break;if(y<=b[1]){const k=(y-a[1])/((b[1]-a[1])||1);return a[0]+(b[0]-a[0])*k}best=b[0]}return best}
const CAR_PLATE_BASE={}; // alturas reais das placas originais, determinadas pelo para-choque
/* v3 r43 · CARG: esferas/cilindros PRÓPRIOS dos veículos, com menos lados que o GEO geral (GEO.sph = 18×12 = 396 triângulos;
   eram ~70% dos triângulos de cada carro: 2 faróis + 2 lanternas + 2 espelhos + 4 setas). Normais continuam lisas: a luz fica redonda,
   só o contorno fica poligonal (visual PS2). Por tamanho: sph (peças grandes: motor de popa, tanque da moto) 12×8 = 168,
   mid (frisos/saias) 10×6 = 100, lamp (faróis/lanternas) 8×6 = 80, mirror (retrovisor) 8×5 = 64, tiny (setas/neblina) 6×4 = 36, cyl 10 lados, rod (varetas finas: guidão, corrimão, antena) 6 lados.
   O LOD instanciado (buildInstancing) troca estes campos por versões ainda menores durante a montagem e devolve no fim. */
const CARG={sph:new THREE.SphereGeometry(1,12,8).toNonIndexed(),mid:new THREE.SphereGeometry(1,10,6).toNonIndexed(),lamp:new THREE.SphereGeometry(1,8,6).toNonIndexed(),
 mirror:new THREE.SphereGeometry(1,8,5).toNonIndexed(),tiny:new THREE.SphereGeometry(1,6,4).toNonIndexed(),cyl:new THREE.CylinderGeometry(1,1,1,10).toNonIndexed(),rod:new THREE.CylinderGeometry(1,1,1,6).toNonIndexed()};
function carParts(type,colHex,st,body,li,cargoHex,riderMB,detail=false){
 const t=VT[type],L=t.L,W=t.W,hw=W/2;
 const col=COL(colHex),dark=COL('#1c1c20'),glass=COL(st.synth?'#151a2a':'#1e2836'),hl=COL('#fff4cc'),tl=COL('#ff1a2a');
 const lights=(fy0,fy1,inset,w)=>{li.box(L/2-.04,fy0,-hw+inset,L/2+.03,fy1,-hw+inset+w,hl);li.box(L/2-.04,fy0,hw-inset-w,L/2+.03,fy1,hw-inset,hl);
  li.box(-L/2-.03,fy0,-hw+inset,-L/2+.04,fy1,-hw+inset+w,tl);li.box(-L/2-.03,fy0,hw-inset-w,-L/2+.04,fy1,hw-inset,tl)};
 if(type==='boat'){const wh=COL('#f2f2ee'),blk=COL('#1c1c22'),gl=COL(st.synth?'#151a2a':'#2a3a4a'),deck=COL('#c8a878'),bot=COL('#26303c'),chr=COL('#c4c8ce'),cush=COL('#e8e2d4');
  // v105: casco em V com quina (chine), proa alta e alargada, borda com faixa na cor do barco e fundo antiincrustante
  const FS=detail?[0,.03,.1,.2,.3,.4,.5,.58,.66,.73,.8,.86,.91,.95,.98,1]:[0,.08,.3,.5,.66,.8,.9,.97,1],HS=[];
  const hull=f=>{const b=Math.max(0,(f-.48)/.52),h=Math.max(.035,hw*(1-Math.pow(b,1.9)*.97))*(f<.015?.96:1),ysh=.95+.16*Math.pow(b,1.6),yk=.1+.5*Math.pow(b,2.3),yc=.4+.16*b;return{b,h,ysh,yk,yc}};
  for(const f of FS){const x=-L/2+f*L,{h,ysh,yk,yc}=hull(f),yv=yk+(yc-yk)*.45;
   HS.push({x,cy:(ysh+yk)/2,p:[[h,ysh],[h,ysh-.2],[h*.97,yc+.07],[h*.92,yc],[h*.8,yc-.025],[h*.42,yv],[0,yk],[-h*.42,yv],[-h*.8,yc-.025],[-h*.92,yc],[-h*.97,yc+.07],[-h,ysh-.2],[-h,ysh]]})}
  {const start=body.p.length;body.loft(HS,(a,i)=>a<0?wh:a>=HS.length?wh:i===12?deck:(i===0||i===10)?col:(i>=3&&i<=8)?bot:wh);if(detail)mbSoft(body,start,.35)}
  if(detail){// friso de borracha na borda (acompanha a curva da borda)
   for(let k=0;k<HS.length-1;k++){const A=hull(FS[k]),B=hull(FS[k+1]),xa=HS[k].x,xb=HS[k+1].x;for(const zs of [-1,1]){
    body.qa([xa,A.ysh-.07,zs*(A.h+.025)],[xb,B.ysh-.07,zs*(B.h+.025)],[xb,B.ysh+.01,zs*(B.h+.025)],[xa,A.ysh+.01,zs*(A.h+.025)],blk,[(xa+xb)/2,.6,0]);
    body.qa([xa,A.ysh+.01,zs*(A.h+.025)],[xb,B.ysh+.01,zs*(B.h+.025)],[xb,B.ysh+.012,zs*B.h],[xa,A.ysh+.012,zs*A.h],blk,[(xa+xb)/2,0,0])}}}
  // console com para-brisa envolvente
  body.cbox(.05,.95,-.5,.62,1.38,.5,wh,.12);body.cbox(.12,1.36,-.42,.5,1.42,.42,blk,.03);
  {const P=(x,y,z)=>[x,y,z],ref=[0,1.1,0],q=(a,b,c,d)=>{body.qa(a,b,c,d,gl,ref);body.qb(a,b,c,d,gl,ref)};
   q(P(.66,1.0,-.5),P(.66,1.0,.5),P(.46,1.55,.46),P(.46,1.55,-.46));for(const zs of [-1,1])q(P(.66,1.0,zs*.5),P(.25,1.0,zs*.92),P(.12,1.5,zs*.82),P(.46,1.55,zs*.46));
   for(const zs of [-1,1]){mbTube(body,[.46,1.56,zs*.46],[.46,1.56,0],.022,chr);mbTube(body,[.46,1.56,zs*.46],[.12,1.51,zs*.82],.022,chr);mbTube(body,[.12,1.51,zs*.82],[.25,1.0,zs*.92],.02,chr)}}
  // bancos do piloto e do passageiro, banco traseiro em U
  for(const zs of [-1,1]){body.cbox(-.4,.95,zs*.48-.24,0,1.3,zs*.48+.24,wh,.08);body.cbox(-.36,1.3,zs*.48-.2,-.02,1.36,zs*.48+.2,cush,.04);body.cbox(-.45,1.3,zs*.48-.22,-.33,1.72,zs*.48+.22,cush,.06)}
  body.cbox(-L/2+.35,.95,-hw+.3,-L/2+1.05,1.25,hw-.3,wh,.1);body.cbox(-L/2+.4,1.25,-hw+.34,-L/2+1.0,1.32,hw-.34,cush,.04);body.cbox(-L/2+.3,1.25,-hw+.32,-L/2+.45,1.6,hw-.32,cush,.06);
  if(detail){body.geo(new THREE.TorusGeometry(.16,.022,6,18).toNonIndexed(),mtx(.02,1.47,-.42,1,1,1,0,Math.PI/2,-.5),blk);body.cbox(.04,1.36,-.46,.12,1.44,-.38,blk,.02);
   for(const[x,z] of [[L/2-.55,0],[-L/2+.25,-hw+.2],[-L/2+.25,hw-.2]])body.cbox(x-.08,.99,z-.03,x+.08,1.04,z+.03,chr,.015)}
  // motor de popa: carenagem arredondada, perna, placa anticavitação e hélice
  {const ex=-L/2-.28;body.geo(CARG.sph,mtx(ex,1.32,0,.36,.42,.3),blk);body.geo(CARG.sph,mtx(ex+.02,1.42,0,.3,.22,.26),col);body.cbox(ex-.12,.3,-.09,ex+.1,1.05,.09,blk,.05);body.cbox(ex-.22,.36,-.2,ex+.14,.4,.2,blk,.02);
   body.geo(CARG.sph,mtx(ex-.02,.26,0,.2,.07,.07),blk);if(detail)for(let k=0;k<3;k++){const a=k*2.094;body.cbox(ex-.21,.24+Math.sin(a)*.1-.02,Math.cos(a)*.1-.04,ex-.17,.24+Math.sin(a)*.1+.02,Math.cos(a)*.1+.04,COL('#8a8f96'),.01)}
   body.cbox(ex+.08,.85,-.12,-L/2+.06,1.05,.12,blk,.03);for(const zs of [-1,1])body.cbox(-L/2-.32,.55,zs*(hw-.55)-.32,-L/2+.02,.6,zs*(hw-.55)+.32,deck,.02)}
  if(detail){const chr=COL('#c4c8ce'),pt=[];for(let f=.6;f<=.975;f+=.075){const x=-L/2+f*L,b=Math.max(0,(f-.48)/.52),h=Math.max(.05,hw*(1-Math.pow(b,1.9)*.97))-.08,y=.95+.16*Math.pow(b,1.6);pt.push([x,y,h])}
   for(const zs of [-1,1]){for(const[x,y,h] of pt)body.geo(CARG.rod,mtx(x,y+.16,zs*h,.018,.32,.018),chr);for(let i=0;i<pt.length-1;i++){const[a,ya,ha]=pt[i],[b,yb,hb2]=pt[i+1],dx=b-a,dz=zs*(hb2-ha);body.geo(CARG.rod,mtx((a+b)/2,(ya+yb)/2+.32,zs*(ha+hb2)/2,.02,Math.hypot(dx,dz,yb-ya),.02,0,Math.atan2(dz,-dx),Math.PI/2),chr)}}
   const e=pt[pt.length-1];body.geo(CARG.rod,mtx(e[0],e[1]+.32,0,.02,e[2]*2,.02,Math.PI/2,0,0),chr)}
  li.box(L/2-1.5,1.0,-.1,L/2-1.35,1.12,.1,hl);li.box(-L/2+.05,1.0,-hw+.1,-L/2+.2,1.1,-hw+.25,COL('#ff2a2a'));li.box(-L/2+.05,1.0,hw-.25,-L/2+.2,1.1,hw-.1,COL('#2aff5a'));
 }else if(type==='vortex'){const blk=COL('#1c1c22'),wh=COL('#f2f2ee'),blk2=COL('#26262c'),chr=COL('#b8bcc4');
  // v105: saia inflada em gomos (superelipse), casco com borda arredondada, cabine em bolha e duto do ventilador em toro com grade e lemes
  const PS=detail?14:8,pl=(u,e)=>Math.pow(Math.max(0,1-Math.pow(Math.abs(u),e)),1/e);
  {const ST=[];for(let k=0;k<=PS;k++){const u=-1+2*k/PS,w=pl(u,3.2);ST.push({x:u*L/2*.995,rz:Math.max(.05,hw*w),ry:.26*(.55+.45*w),cy:.28,e:2.3})}
   const st0=body.p.length;mbLoftSt(body,ST,detail?16:10,(x,y,z,cap)=>cap?blk:(Math.floor((x+L/2)/.4)%2?blk:blk2),detail)}
  {const ST=[];for(let k=0;k<=PS;k++){const u=-1+2*k/PS,w=pl(u,4);ST.push({x:u*(L/2-.12),rz:Math.max(.05,(hw-.14)*w),ry:.15,cy:.64,e:4})}mbLoftSt(body,ST,detail?16:10,(x,y)=>y<.58?wh:col,detail)}
  // cabine em bolha (vidro na frente e nas laterais, teto branco)
  {const ST=[[1.28,.35,.79,1.0],[1.15,.62,.78,1.22],[.9,.76,.78,1.38],[.5,.82,.78,1.46],[0,.84,.78,1.48],[-.4,.82,.78,1.46],[-.62,.66,.78,1.34],[-.72,.35,.78,1.12]].map(([x,rz,y0,y1])=>({x,rz,ry:(y1-y0)/2,cy:(y0+y1)/2,e:3}));
   mbLoftSt(body,ST,detail?18:10,(x,y,z,cap)=>cap?wh:y>1.36?wh:(x>.55&&y>.9)||(y>.98&&y<1.3&&x>-.45&&x<.55)?glass:wh,detail)}
  // O Vortex não tinha placa na lataria; inclui a base integrada, sem outra chapa flutuante.
  if(detail){body.box(-L/2-.06,.45,-.2,-L/2-.045,.58,.2,wh);body.box(-L/2-.065,.548,-.195,-L/2-.060,.578,.195,COL('#1f4fb4'));body.box(L/2+.045,.45,-.2,L/2+.06,.58,.2,wh);body.box(L/2+.060,.548,-.195,L/2+.065,.578,.195,COL('#1f4fb4'));}
  // duto do ventilador traseiro (toro), cubo, pás e grade
  {const fx=-L/2+.55,fy=1.35;body.geo(new THREE.TorusGeometry(.8,.13,detail?10:6,detail?32:16).toNonIndexed(),mtx(fx,fy,0,1,1,1,0,Math.PI/2,0),blk);
   body.geo(CARG.cyl,mtx(fx+.05,fy,0,.8,.18,.8,0,0,Math.PI/2),COL('#3a3a40'));body.geo(CARG.sph,mtx(fx-.05,fy,0,.2,.16,.16),col);
   for(let k=0;k<5;k++){const a=k*Math.PI*2/5,m=new THREE.Matrix4().makeRotationX(a).premultiply(new THREE.Matrix4().makeTranslation(fx,fy,0));const bl=new MB();bl.cbox(-.04,.12,-.09,.04,.72,.09,COL('#55555c'),.02);mbAddXf(body,bl,m)}
   if(detail){for(const d of [-.5,-.25,0,.25,.5]){const hh=Math.sqrt(.8*.8-d*d);mbTube(body,[fx-.17,fy-hh,d],[fx-.17,fy+hh,d],.012,chr);mbTube(body,[fx-.17,fy+d,-hh],[fx-.17,fy+d,hh],.012,chr)}}
   for(const zs of [-1,1])mbTube(body,[fx+.15,.72,zs*.55],[fx+.05,fy-.55,zs*.55],.06,col);
   for(const zs of [-.35,.35])mbFoil(body,{le:-L/2+.18,te:-L/2-.22,s:.72,v:zs,t:.07},{le:-L/2+.12,te:-L/2-.2,s:1.95,v:zs,t:.05},col,true)}
  // corrimão, faróis e lanternas
  if(detail)for(const zs of [-1,1]){mbTube(body,[-1.2,.98,zs*(hw-.32)],[1.0,.98,zs*(hw-.32)],.022,chr);for(const x of [-1.2,-.1,1.0])mbTube(body,[x,.78,zs*(hw-.32)],[x,.98,zs*(hw-.32)],.02,chr)}
  li.geo(CARG.lamp,mtx(L/2-.2,.66,-hw+.55,.06,.07,.16),hl);li.geo(CARG.lamp,mtx(L/2-.2,.66,hw-.55,.06,.07,.16),hl);li.geo(CARG.lamp,mtx(-L/2+.55,.55,-.9,.04,.06,.1),tl);li.geo(CARG.lamp,mtx(-L/2+.55,.55,.9,.04,.06,.1),tl);
 }else if(type==='jetski'){const wh=COL('#f2f2ee'),blk=COL('#18181c');
  body.cbox(-L/2,.12,-hw,L/2-.6,.5,hw,wh,.14);body.geo(CARG.sph,mtx(L/2-.62,.32,0,.62,.19,hw*.96),wh);
  body.cbox(-L/2+.08,.5,-hw+.06,L/2-.7,.64,hw-.06,col,.08);body.geo(CARG.sph,mtx(L/2-.75,.6,0,.5,.14,hw*.8),col);
  body.cbox(-L/2+.3,.64,-.24,.2,.86,.24,blk,.09);body.cbox(.3,.62,-.14,.62,1.0,.14,col,.06);body.geo(CARG.rod,mtx(.52,1.04,0,.03,.78,.03,Math.PI/2,0,0),blk);
  for(const zs of [-1,1])body.cbox(-L/2+.4,.5,zs*(hw-.02)-.06,.4,.56,zs*(hw-.02)+.06,blk,.02);li.geo(CARG.lamp,mtx(L/2-.3,.5,0,.05,.05,.12),hl);
 }else if(type==='moto'){const blk=COL('#18181c'),chr=COL('#b8bcc4'),skin=COL('#e0b08a'),jak=COL(st.synth?'#3a2a5a':'#2a2a30'),pnt=COL('#22283a');
  body.cbox(-.22,.38,-.15,.42,.78,.15,COL('#3a3a40'),.08);body.geo(CARG.cyl,mtx(.1,.55,0,.13,.32,.13,Math.PI/2,0,0),COL('#55555c'));body.geo(CARG.sph,mtx(.32,.9,0,.33,.15,.21),col);body.cbox(-.58,.84,-.17,.14,.97,.17,blk,.06);body.geo(CARG.sph,mtx(-.66,.78,0,.36,.12,.12),col);body.geo(CARG.sph,mtx(.95,.62,0,.22,.05,.12),col);
  for(const zs of [-.08,.08])body.geo(CARG.rod,mtx(.82,.72,zs,.03,.62,.03,0,0,.42),chr);body.geo(CARG.sph,mtx(.73,1.0,0,.13,.12,.16),col);body.geo(CARG.rod,mtx(.68,1.13,0,.025,.74,.025,Math.PI/2,0,0),blk);for(const zs of [-1,1])body.geo(CARG.rod,mtx(.68,1.13,zs*.36,.035,.12,.035,Math.PI/2,0,0),COL('#222'));body.geo(CARG.cyl,mtx(-.22,.4,.17,.05,.75,.05,0,0,Math.PI/2-.08),chr);
  li.geo(CARG.lamp,mtx(.84,.99,0,.05,.08,.09),hl);li.geo(CARG.lamp,mtx(-1.0,.78,0,.03,.04,.07),tl);
  // v201: suporte de placa traseira fixado à rabeta, atrás da roda. A base branca
  // também aparece no LOD instanciado; o texto real entra no modelo detalhado.
  for(const side of [-1,1])body.box(-1.255,.66,side*.135-.015,-.93,.70,side*.135+.015,blk);
  body.box(-1.267,.577,-.184,-1.235,.722,.184,blk);
  li.box(-1.278,.587,-.173,-1.268,.712,.173,COL('#f2f2ef'));
  li.box(-1.282,.696,-.173,-1.278,.714,.173,COL('#1f4fb4'));
  const rb=new MB(); // piloto 3D antigo desativado: agora o piloto é um personagem 2D (motoRiderTick)rb.box(-.38,.96,-.16,-.02,1.08,.16,pnt);rb.box(-.08,.5,-.2,.12,.98,-.1,pnt);rb.box(-.08,.5,.1,.12,.98,.2,pnt);
  rb.box(-.36,1.06,-.2,.02,1.62,.2,jak);rb.box(-.12,1.32,-.28,.5,1.44,-.18,jak);rb.box(-.12,1.32,.18,.5,1.44,.28,jak);rb.box(.45,1.1,-.3,.6,1.2,-.18,skin);rb.box(.45,1.1,.18,.6,1.2,.3,skin);
  rb.cbox(-.3,1.62,-.17,.05,1.98,.17,col,.08);rb.box(.0,1.7,-.14,.07,1.86,.14,COL('#101418'));
 }else{
  // ===== modelagem arredondada comum a todos os carros (referência: sedã) =====
  const ss=(x)=>x<0?0:x>1?1:x*x*(3-2*x),sec=(h,y0,y1,rt,rb)=>{const p=[],arc=(cz,cy,r,a0,a1,n)=>{for(let k=0;k<=n;k++){const tt=a0+(a1-a0)*k/n;p.push([cz+Math.cos(tt)*r,cy+Math.sin(tt)*r])}};
    rt=Math.min(rt,(y1-y0)*.5,h*.5);rb=Math.min(rb,(y1-y0)*.3,h*.3);arc(h-rb,y0+rb,rb,-Math.PI/2,0,2);arc(h-rt,y1-rt,rt,0,Math.PI/2,detail&&type!=='police'&&type!=='van'?6:4);arc(-h+rt,y1-rt,rt,Math.PI/2,Math.PI,detail&&type!=='police'&&type!=='van'?6:4);arc(-h+rb,y0+rb,rb,Math.PI,1.5*Math.PI,2);return p};
  const SV=detail?[-1,-.992,-.98,-.96,-.93,-.88,-.81,-.72,-.62,-.51,-.4,-.28,-.14,0,.14,.28,.4,.51,.62,.72,.81,.88,.93,.96,.98,.992,1]:[-1,-.985,-.95,-.88,-.75,-.55,-.3,0,.3,.55,.75,.88,.95,.985,1];
  const softShell=(start)=>{if(!detail)return;const normals=new Map(),key=i=>Math.round(body.p[i]*10000)+','+Math.round(body.p[i+1]*10000)+','+Math.round(body.p[i+2]*10000)+':'+body.c[i].toFixed(3)+','+body.c[i+1].toFixed(3)+','+body.c[i+2].toFixed(3);
   for(let i=start;i<body.p.length;i+=3){const k=key(i),v=normals.get(k)||[0,0,0];v[0]+=body.n[i];v[1]+=body.n[i+1];v[2]+=body.n[i+2];normals.set(k,v)}
   for(let i=start;i<body.p.length;i+=3){const v=normals.get(key(i)),l=Math.hypot(...v)||1;let x=body.n[i]*.35+v[0]/l*.65,y=body.n[i+1]*.35+v[1]/l*.65,z=body.n[i+2]*.35+v[2]/l*.65;const n=Math.hypot(x,y,z)||1;body.n[i]=x/n;body.n[i+1]=y/n;body.n[i+2]=z/n}
  };
  // carroceria baixa: o = {y0,yF,dF,yR,dR,lift,pinch,rnd,rt,rb,x0,x1,col(a,i,y)}
  const low=(o)=>{const x0=o.x0===undefined?-L/2:o.x0,x1=o.x1===undefined?L/2:o.x1,cx=(x0+x1)/2,hl2=(x1-x0)/2,BS=[];
   for(const sv of SV){const a=Math.abs(sv),e=Math.max(0,(a-(o.rnd||.72))/(1-(o.rnd||.72))),h=(hw*(1-(o.pinch===undefined?.16:o.pinch)*e*e)-(a>.99?.06:0))*(1-(o.waist||0)*Math.exp(-sv*sv/.13));
    const y1=sv>0?o.yF-(o.dF||0)*ss((sv-.25)/.75):o.yR-(o.dR||0)*ss((-sv-.6)/.4),y0=o.y0+(o.lift===undefined?.07:o.lift)*ss((a-.82)/.18)+(a>.99?.06:0);const shoulder=((o.haunch||0)+(sv>0?(o.haunchF||0):0))*Math.exp(-Math.pow((Math.abs(cx+sv*hl2)-t.wb)/.43,2));const rt0=o.rt||.2,gw=Math.exp(-Math.pow((Math.abs(cx+sv*hl2)-t.wb)/.5,2)),need=(y1+shoulder)-(2*t.wr+.12),rtE=rt0-(rt0-Math.max(.05,Math.min(rt0,need)))*gw;BS.push({x:cx+sv*hl2,cy:(y0+y1+shoulder)/2,p:sec(h,y0,y1+shoulder-(a>.99?.05:0),rtE,o.rb||.07)})}
   const start=body.p.length;body.loft(BS,o.col?(a,i)=>o.col(a,i,BS):()=>col);softShell(start);LB=BS;LO=o;return BS};
  // cabine: vidros inclinados + teto curvo; B = coluna central (x0,x1) ou null
  const cab=(o)=>{CO=o;const{xr0,xr1,xf1,xf0,yb,yR}=o,inB=o.inB||.1,inT=o.inT||.3,rc=o.roofCol||col,CS=[],xs=[xr0,xr0+(xr1-xr0)*.35,xr0+(xr1-xr0)*.7,xr1];let bi=-1;
   if(o.B){bi=xs.length;xs.push(o.B[0],o.B[1])}xs.push(xf1,xf1+(xf0-xf1)*.3,xf1+(xf0-xf1)*.65,xf0);
   if(detail){const extra=[];for(let j=0;j<xs.length-1;j++)if(xs[j+1]>xs[j]+.06)extra.push((xs[j]+xs[j+1])/2);xs.push(...extra);xs.sort((a,b)=>a-b);if(o.B)bi=xs.indexOf(o.B[0]);}
   for(const x of xs){const yt=x<xr1?yb+.03+(yR-yb-.03)*Math.sin(Math.PI/2*(x-xr0)/Math.max(.01,xr1-xr0)):x>xf1?yb+.01+(yR-yb-.01)*Math.cos(Math.PI/2*(x-xf1)/Math.max(.01,xf0-xf1)):yR;const hb=hw-inB,ht=hw-inT;
    CS.push({x,cy:(yb+yt)/2,p:[[hb,yb],[ht+.02,Math.max(yb+.01,yt-.12)],[ht-.1,yt],[-ht+.1,yt],[-ht-.02,Math.max(yb+.01,yt-.12)],[-hb,yb]]})}
   const start=body.p.length;body.loft(CS,(a,i)=>{if(a<0||a>=CS.length)return o.capCol||glass;const A=CS[Math.max(0,a)],Bq=CS[Math.min(CS.length-1,a+1)],dy=Math.abs(Bq.p[2][1]-A.p[2][1])/Math.max(.01,Bq.x-A.x);
    if(i===2)return dy>.35?glass:rc;if(i===5)return col;if(i===1||i===3)return rc;if(i===0||i===4)return((o.B&&A.x>=o.B[0]&&A.x<o.B[1])||a===0||a===CS.length-2||(o.solidSide&&o.solidSide(A.x)))?col:glass;return glass});softShell(start);return CS};
  let LB=null,LO=null,CO=null,BU=null,OV=null;
  const bump=(yf,yr,h)=>{BU={yf,yr,h};body.cbox(L/2-.16,yf,-hw+.12,L/2+.05,yf+h,hw-.12,dark,.06);body.cbox(-L/2-.05,yr,-hw+.12,-L/2+.16,yr+h,hw-.12,dark,.06)};
  const ovals=(yh,yt,ins,sz)=>{sz=sz||1;OV={yh,yt,ins,sz};for(const zs of [-1,1]){li.geo(CARG.lamp,mtx(L/2-.04,yh,zs*(hw-ins),.06,.075*sz,.2*sz),hl);li.geo(CARG.lamp,mtx(-L/2+.03,yt,zs*(hw-ins+.06),.05,.07*sz,.22*sz),tl)}};
  const mirrors=(x,y)=>{for(const zs of [-1,1])body.geo(CARG.mirror,mtx(x,y,zs*(hw-.04),.1,.065,.12),col)};
  const handles=(xs,y)=>{for(const zs of [-1,1])for(const hx of xs)body.box(hx,y,zs*(hw-.02)-.01,hx+.18,y+.03,zs*(hw-.02)+.01,COL('#c8ccd2'))};
  if(type==='police'){const wb=COL(st.synth?'#1c1c30':'#f4f4f4'),bk=COL(st.synth?'#33e6e6':'#141414'),cc=col;
   low({y0:.3,yF:.8,dF:.1,yR:.83,dR:.05,col:(a,i,BS)=>{if(a<0||a>=BS.length-1)return wb;const x=(BS[a].x+BS[Math.min(BS.length-1,a+1)].x)/2;const side=i===1||i===2||i===12||i===13;return side&&x>-L*.3&&x<L*.22?bk:wb}});
   const ca=Object.assign;cab({xr0:-L*.34,xr1:-L*.2,xf1:L*.02,xf0:L*.19,yb:.8,yR:1.4,B:[-L*.1,-L*.06],roofCol:wb});
   body.cbox(-.3,1.4,-.75,.2,1.47,.75,COL('#222'),.04);li.geo(CARG.lamp,mtx(-.05,1.53,-.38,.2,.08,.3),COL('#ff2a2a'));li.geo(CARG.lamp,mtx(-.05,1.53,.38,.2,.08,.3),COL('#2a5aff'));
   bump(.3,.3,.18);body.box(L/2-.02,.5,-.42,L/2+.03,.64,.42,COL('#111114'));ovals(.62,.66,.42);handles([-.2,.55],.7);
   for(const zs of [-1,1])body.geo(CARG.mirror,mtx(L*.19-.12,.9,zs*(hw-.04),.1,.065,.12),wb);
  }else if(type==='sedan'||type==='taxi'){
   low({y0:.3,yF:.82,dF:.115,yR:.86,dR:.04,pinch:.13,rnd:.76,rt:.23,waist:.025,haunch:.035});cab({xr0:-L*.33,xr1:-L*.19,xf1:L*.045,xf0:L*.235,yb:.82,yR:1.4,inT:.28,B:[-L*.1,-L*.06]});
   bump(.3,.3,.18);body.box(L/2-.02,.5,-.42,L/2+.03,.64,.42,COL('#111114'));mirrors(L*.19-.12,.9);handles([-.2,.55],.7);ovals(.62,.66,.42);
   if(type==='taxi'&&!detail){body.box(-L/2+.4,.6,-hw+.02,L/2-.4,.66,hw-.02,COL('#111'))}
  }else if(type==='sports'||type==='super'){const sup=type==='super';
   low({y0:.26,yF:sup?.7:.76,dF:sup?.16:.19,yR:sup?.74:.79,dR:.04,pinch:sup?.2:.17,rnd:.66,rt:.24,rb:.07,waist:sup?0:.065,haunch:sup?0:.1,haunchF:sup?.14:0});
   const rearCab=cab({xr0:-L*(sup?.42:.37),xr1:-L*(sup?.12:.22),xf1:-L*(sup?0:.045),xf0:L*(sup?.2:.13),yb:sup?.7:.76,yR:sup?1.08:1.15,inB:.14,inT:.34});
   bump(.26,.26,.14);mirrors(L*.2-.12,.8);ovals(.56,.6,.4,.85);
   if(!sup)body.box(L*.25,.68,-.25,L/2-.25,.7,.25,COL('#ffffff').lerp(col,.3));
   if(sup){
    // Silhueta inspirada no DeLorean: aço escovado, capô plano, vigas e venezianas traseiras.
    const steelD=COL('#636b74');
    body.cbox(-L/2-.05,1.0,-hw+.08,-L/2+.45,1.08,hw-.08,steelD,.03);
    for(const zs of [-1,1]){body.box(-L/2+.2,.72,zs*.45-.05,-L/2+.3,1.0,zs*.45+.05,dark);body.geo(CARG.mid,mtx(-L*.02,.5,zs*(hw-.01),.5,.12,.06),steelD);
    }
    addRearGlassSlats(body,rearCab,-L*.42,-L*.12,steelD);
    li.box(-L/2-.03,.5,-hw+.3,-L/2+.03,.56,hw-.3,COL('#ff1a2a'));
   }
   else{
    body.cbox(-L/2+.02,.8,-hw+.15,-L/2+.4,.85,hw-.15,dark,.02);
    // Sculpted hood rails and discreet side vents; no brand badges or copied body panels.
    for(const zs of [-1,1]){
     if(detail)body.geo(CARG.mid,mtx(L*.27,.70,zs*.48,L*.21,.045,.11),col.clone().multiplyScalar(1.06));
     if(detail){body.cbox(L*.015,.43,zs>0?hw*.94:-hw*.98,L*.18,.59,zs>0?hw*.98:-hw*.94,dark,.025);body.cbox(-L*.13,.28,zs>0?hw*.88:-hw*.96,L*.18,.36,zs>0?hw*.96:-hw*.88,col,.03)}
    }
    body.cbox(L/2-.03,.32,-.48,L/2+.04,.47,.48,dark,.045);
   }
  }else if(type==='conv'){
   low({y0:.3,yF:.8,dF:.1,yR:.82,dR:.04});const it=COL('#3a2a24');
   body.cbox(-L*.32,.6,-hw+.16,L*.12,.84,hw-.16,it,.06);for(const zs of [-1,1]){body.cbox(-L*.22,.84,zs>0?.14:-hw+.28,-L*.22+.22,1.22,zs>0?hw-.28:-.14,it,.07);body.cbox(-L*.2,1.22,zs>0?.22:-hw+.34,-L*.2+.16,1.32,zs>0?hw-.34:-.22,it,.05)}
   {const W0=[L*.12,.8],W1=[L*.06,1.2];const g=glass;body.qa([W0[0],W0[1],-hw+.12],[W0[0],W0[1],hw-.12],[W1[0],W1[1],hw-.14],[W1[0],W1[1],-hw+.14],g,[L,1,0]);body.qa([W0[0],W0[1],-hw+.12],[W0[0],W0[1],hw-.12],[W1[0],W1[1],hw-.14],[W1[0],W1[1],-hw+.14],g,[-L,1,0]);
    body.cbox(W1[0]-.04,1.18,-hw+.12,W1[0]+.06,1.24,hw-.12,dark,.02)}
   body.cbox(-L/2+.12,.8,-hw+.12,-L*.34,.86,hw-.12,col.clone().multiplyScalar(.85),.03);bump(.3,.3,.18);mirrors(L*.12-.05,.88);ovals(.6,.64,.42);
  }else if(type==='hatch'){
   low({y0:.3,yF:.84,dF:.1,yR:.86,dR:.02,rnd:.68});cab({xr0:-L/2+.12,xr1:-L/2+.42,xf1:L*.02,xf0:L*.22,yb:.84,yR:1.46,B:[-L*.08,-L*.03]});
   bump(.3,.3,.18);mirrors(L*.22-.1,.94);handles([-.35,.3],.74);ovals(.66,.72,.38,.9);
  }else if(type==='wagon'){
   low({y0:.3,yF:.82,dF:.115,yR:.88,dR:.03,pinch:.12,rnd:.74,rt:.22,waist:.025});cab({xr0:-L/2+.12,xr1:-L/2+.3,xf1:L*.05,xf0:L*.24,yb:.84,yR:1.44,inT:.26,B:[-L*.12,-L*.08]});
   if(!detail)for(const zs of [-1,1])body.cbox(-L*.4,1.44,zs*(hw-.3)-.03,L*.0,1.49,zs*(hw-.3)+.03,dark,.02);bump(.3,.3,.18);mirrors(L*.2-.12,.9);handles([-.25,.55],.72);ovals(.62,.7,.42);
  }else if(type==='crossover'){
   low({y0:.38,yF:1.0,dF:.12,yR:1.02,dR:.03,lift:.04,rt:.24});cab({xr0:-L*.37,xr1:-L*.16,xf1:L*.04,xf0:L*.22,yb:1.0,yR:1.66,B:[-L*.09,-L*.05],inT:.3});
   if(!detail)for(const zs of [-1,1])body.cbox(-L/2+.12,.34,zs>0?hw-.06:-hw-.03,L/2-.12,.46,zs>0?hw+.03:-hw+.06,dark,.03);bump(.38,.38,.22);mirrors(L*.22-.12,1.1);handles([-.35,.4],.9);ovals(.8,.86,.42);
  }else if(type==='mini'){
   low({y0:.3,yF:.86,dF:.1,yR:.9,dR:.02,rnd:.8,rt:.26});cab({xr0:-L/2+.06,xr1:-L/2+.24,xf1:L*.1,xf0:L*.3,yb:.86,yR:1.48,inT:.24,B:[-L*.06,-L*.01]});
   bump(.3,.3,.16);mirrors(L*.3-.1,.96);handles([-.1,.3],.76);ovals(.68,.74,.34,.85);
  }else if(type==='roadster'){
   low({y0:.28,yF:.74,dF:.1,yR:.78,dR:.04,rnd:.7});const it=COL('#2a2224');
   // Assento acima do topo da carroceria (~.78), sem faces coplanares com a lataria.
   body.cbox(-L*.2,.795,-hw+.18,L*.1,.835,hw-.18,it,.025);for(const zs of [-1,1])body.cbox(-L*.18,.82,zs>0?.12:-hw+.3,-L*.18+.2,1.12,zs>0?hw-.3:-.12,it,.065);
   for(const zs of [-1,1])body.geo(CARG.cyl,mtx(-L*.26,.98,zs*.42,.05,.4,.05),dark);
   {const W0=[L*.1,.76],W1=[L*.04,1.08];body.qa([W0[0],W0[1],-hw+.14],[W0[0],W0[1],hw-.14],[W1[0],W1[1],hw-.16],[W1[0],W1[1],-hw+.16],glass,[L,1,0]);body.qa([W0[0],W0[1],-hw+.14],[W0[0],W0[1],hw-.14],[W1[0],W1[1],hw-.16],[W1[0],W1[1],-hw+.16],glass,[-L,1,0])}
   body.cbox(-L/2+.1,.76,-hw+.14,-L*.24,.82,hw-.14,col.clone().multiplyScalar(.85),.03);bump(.28,.28,.16);mirrors(L*.1-.05,.82);ovals(.56,.6,.4);
  }else if(type==='suv'){
   low({y0:.42,yF:1.1,dF:.12,yR:1.1,dR:.02,lift:.05,rt:.22});cab({xr0:-L/2+.14,xr1:-L/2+.4,xf1:L*.04,xf0:L*.22,yb:1.08,yR:1.8,B:[-L*.1,-L*.05],inT:.26});
   for(const zs of [-1,1]){if(!detail)body.cbox(-L*.3,1.8,zs*(hw-.29)-.04,L*.05,1.86,zs*(hw-.29)+.04,dark,.02);if(!detail)body.cbox(-L/2+.1,.36,zs>0?hw-.06:-hw-.03,L/2-.1,.5,zs>0?hw+.03:-hw+.06,dark,.03)}
   bump(.42,.42,.24);body.box(L/2-.02,.7,-.5,L/2+.03,.92,.5,COL('#111114'));mirrors(L*.22-.12,1.18);handles([-.4,.45],.98);ovals(.86,.9,.42);
  }else if(type==='van'){
   // monovolume: frente curta inclinada, corpo alto arredondado
   const BS=[],xs=SV;for(const sv of xs){const x=sv*L/2,a=Math.abs(sv),e=Math.max(0,(a-.8)/.2),h=hw*(1-.1*e*e)-(a>.99?.05:0);
    const f=Math.max(0,(x-(L/2-1.25))/1.25),yt=x<L/2-1.25?t.H:t.H-(t.H-1.15)*ss(f*1.25)-(a>.99?.04:0),y0=.3+.05*ss((a-.85)/.15);BS.push({x,cy:(y0+yt)/2,p:sec(h,y0,yt,.32,.08),f})}LB=BS;
   body.loft(BS,(a,i)=>{if(a<0||a>=BS.length)return col;const A=BS[Math.max(0,a)];if(i>=4&&i<=10&&A.f>.05&&A.f<.7)return glass;return col});
   for(const zs of [-1,1])body.cbox(L/2-2.35,1.3,zs>0?hw-.06:-hw-.02,L/2-1.15,1.85,zs>0?hw+.02:-hw+.06,glass,.05);
   bump(.3,.3,.22);mirrors(L/2-.95,1.55);ovals(.8,.9,.4);body.box(L/2-.02,.55,-.45,L/2+.03,.72,.45,COL('#111114'));
   body.cbox(-L/2+.4,t.H,-hw+.3,-L/2+1.6,t.H+.08,hw-.3,col.clone().multiplyScalar(.85),.03);
  }else if(type==='pickup'){
   low({y0:.36,yF:1.02,dF:.12,yR:1.02,dR:0,rnd:.75,rt:.18});cab({xr0:-.38,xr1:-.3,xf1:.5,xf0:1.15,yb:1.0,yR:1.68,inT:.26});
   const bc=col.clone().multiplyScalar(.95);for(const zs of [-1,1])body.cbox(-L/2+.02,1.0,zs>0?hw-.13:-hw+.01,-.42,1.3,zs>0?hw-.01:-hw+.13,bc,.04);body.cbox(-L/2+.02,1.0,-hw+.05,-L/2+.14,1.28,hw-.05,bc,.04);
   body.box(-L/2+.14,1.0,-hw+.13,-.42,1.04,hw-.13,COL('#202022'));bump(.36,.36,.22);mirrors(1.05,1.22);handles([.0],.96);ovals(.8,.86,.42);
  }else if(type==='bus'){
   const BS=[];for(const sv of SV){const a=Math.abs(sv),e=Math.max(0,(a-.9)/.1),h=hw*(1-.08*e*e)-(a>.99?.05:0),y0=.42+(a>.99?.05:0),yt=t.H-(a>.99?.06:0);BS.push({x:sv*L/2,cy:(y0+yt)/2,p:sec(h,y0,yt,.35,.1)})}LB=BS;
   body.loft(BS,()=>col);body.box(-L/2+.1,.32,-hw+.15,L/2-.1,.45,hw-.15,dark);
   for(const zs of [-1,1])body.cbox(-L/2+.5,1.55,zs>0?hw-.04:-hw-.03,L/2-.6,2.55,zs>0?hw+.03:-hw+.04,glass,.08);body.cbox(L/2-.06,1.0,-hw+.18,L/2+.03,2.75,hw-.18,glass,.1);
   body.box(-L/2+.2,2.95,-hw-.01,L/2-.2,3.05,hw+.01,COL('#f2f2f2').lerp(col,.4));body.cbox(-L*.15,t.H-.02,-.8,L*.15,t.H+.3,.8,COL('#bdbdbd'),.12);body.cbox(-L/2+.6,1.2,hw-.02,-L/2+1.6,2.5,hw+.04,dark,.04);
   li.box(L/2-.04,2.8,-.9,L/2+.04,3.05,.9,COL('#ffcc33'));ovals(.7,.75,.35,1.3);bump(.35,.35,.25);mirrors(L/2-.2,2.3);
  }else{ // truck
   body.box(-L/2,.42,-hw+.3,L/2,.62,hw-.3,dark);
   {const x0=L/2-2.1,BS=[];for(const sv of SV){const x=x0+(sv+1)/2*2.1,f=(sv+1)/2,e=Math.max(0,(f-.82)/.18),h=hw*(1-.1*e*e)-(f>.995?.05:0),y0=.5,yt=2.6-(f>.995?.06:0)-.25*ss((f-.75)/.25);BS.push({x,cy:(y0+yt)/2,p:sec(h,y0,yt,.28,.08)})}
    body.loft(BS,()=>col);LB=BS}
   body.cbox(L/2-.06,1.45,-hw+.18,L/2+.03,2.3,hw-.18,glass,.08);for(const zs of [-1,1])body.cbox(L/2-1.3,1.55,zs>0?hw-.04:-hw-.03,L/2-.35,2.3,zs>0?hw+.03:-hw+.04,glass,.06);
   const cargo=COL(cargoHex);body.cbox(-L/2,.62,-hw,L/2-2.2,t.H,hw,cargo,.12);body.box(-L/2-.04,.7,-hw+.08,-L/2+.02,t.H-.08,hw-.08,cargo.clone().multiplyScalar(.85));
   bump(.42,.5,.25);mirrors(L/2-.3,2.0);ovals(.95,1.0,.4,1.2);
  }
  // ===== v101: detalhes de perto (só na malha detalhada): caixas de roda, vincos de porta, soleira, grade com frisos,
  // placas Mercosul, escapamento, palhetas, setas/ré, faróis de neblina e itens próprios de cada tipo. Nada copiado de modelo real.
  if(detail){
   const S=(x,y)=>{if(!LB)return hw;let i=0;while(i<LB.length-2&&LB[i+1].x<x)i++;const A=LB[i],B=LB[i+1],k=Math.max(0,Math.min(1,(x-A.x)/((B.x-A.x)||1)));return carZAt(A.p,y)*(1-k)+carZAt(B.p,y)*k};
   t.sideZ=S;t.roofY=x=>{if(!LB)return t.H;let i=0;while(i<LB.length-2&&LB[i+1].x<x)i++;const A=LB[i],B=LB[i+1],k=Math.max(0,Math.min(1,(x-A.x)/((B.x-A.x)||1))),ta=A.p.reduce((m,q)=>Math.max(m,q[1]),0),tb=B.p.reduce((m,q)=>Math.max(m,q[1]),0);return ta+(tb-ta)*k};
   const blk=COL('#0d0d10'),trim=COL('#26262a'),chrome=COL('#b9bec6'),slat=COL('#7c8188'),amber=COL('#ffae1a'),rev=COL('#f4f6ff'),gap=col.clone().multiplyScalar(.38),wip=COL('#141416');
   const plastic=type==='suv'||type==='crossover'||type==='pickup'||type==='truck',R0=t.wr+.05,R1=R0+(plastic?.05:.022),paint=type==='police'?COL(st.synth?'#1c1c30':'#f4f4f4'):col,lipC=plastic?trim:paint.clone().multiplyScalar(.9);
   const yBase=LO?LO.y0:type==='bus'?.42:type==='truck'?.5:.3;
   const strip=(x0,x1,y0,y1,c,o)=>{o=o||.008;const n=Math.max(2,Math.ceil((x1-x0)/.1)),ym=(y0+y1)/2;for(const zs of [-1,1]){const P=(x,y,e)=>[x,y,zs*(S(x,y)+e)];
     for(let k=0;k<n;k++){const xa=x0+(x1-x0)*k/n,xb=x0+(x1-x0)*(k+1)/n,ref=[(xa+xb)/2,ym,0];
      body.qa(P(xa,y0,o),P(xb,y0,o),P(xb,y1,o),P(xa,y1,o),c,ref);body.qa(P(xa,y1,o),P(xb,y1,o),P(xb,y1,0),P(xa,y1,0),c,[(xa+xb)/2,ym-1,0]);body.qa(P(xa,y0,0),P(xb,y0,0),P(xb,y0,o),P(xa,y0,o),c,[(xa+xb)/2,ym+1,0])}
     for(const[xe,dir] of [[x0,1],[x1,-1]])body.qa(P(xe,y0,0),P(xe,y1,0),P(xe,y1,o),P(xe,y0,o),c,[xe+dir,ym,0])}};
   const seam=(x,y0,y1)=>{const n=Math.max(2,Math.ceil((y1-y0)/.04));for(const zs of [-1,1]){const P=(xx,y)=>[xx,y,zs*(S(xx,y)+.004)];for(let k=0;k<n;k++){const ya=y0+(y1-y0)*k/n,yb=y0+(y1-y0)*(k+1)/n;body.qa(P(x-.007,ya),P(x+.007,ya),P(x+.007,yb),P(x-.007,yb),gap,[x,(ya+yb)/2,0])}}}; // vinco contínuo colado na lateral
   // caixa de roda de verdade: a lateral é recortada no shader (carHoleMat) e aqui entra o forro escuro (túnel + parede interna) e o friso
   const ZI=t.tw-.18,AM=body.arch=new MB();
   // topo do trecho reto da lateral (acima disso a lataria já curva pro capô/teto): o arco nunca invade essa curva
   const flatTop=x=>{if(!LB)return 9;let i=0;while(i<LB.length-2&&LB[i+1].x<x)i++;const P=LB[i].p,zm=P.reduce((m,q)=>Math.max(m,q[0]),0);let y=P[0][1];for(const q of P){if(q[0]<=0)break;if(q[0]>=zm-.012)y=Math.max(y,q[1])}return y};
   const bodyTop=x=>{if(!LB)return 9;let i=0;while(i<LB.length-2&&LB[i+1].x<x)i++;return LB[i].p.reduce((m,q)=>Math.max(m,q[1]),0)};
   const archCap=cx=>{let y=9,bt=9;for(let k=-2;k<=2;k++)y=Math.min(y,flatTop(cx+k*R0/2));for(let k=-1;k<=1;k++)bt=Math.min(bt,bodyTop(cx+k*R0/3));return Math.max(2*t.wr+.035,Math.min(bt-.015,archCap0(cx,y)))};
   const archCap0=(cx,y)=>{return 2*t.wr+.05}; // meio-termo: nunca abaixo do topo do pneu + folga
   const capF=archCap(t.wb),capR=type==='truck'?9:archCap(-t.wb);t.arch={r0:R0,zi:ZI,capF,capR,ftF:flatTop(t.wb),ftR:flatTop(-t.wb)};
   const arch=(cx)=>{const yb=yBase-.005,cap=cx>0?capF:capR,a0=Math.asin(Math.max(-1,Math.min(1,(yb-t.wr)/R0))),b0=Math.asin(Math.max(-1,Math.min(1,(yb-t.wr)/R1))),n=16,RL=R0+.002,
     flange=paint.clone().multiplyScalar(.8);
    for(const zs of [-1,1]){const Y=(r,a,c2)=>Math.min(c2,t.wr+Math.sin(a)*r),P=(r,a,o,c2)=>{const x=cx+Math.cos(a)*r,y=Y(r,a,c2);return[x,y,zs*(S(x,y)+o)]},Q=(a,z,c2)=>[cx+Math.cos(a)*RL,Y(RL,a,c2),z],wz=zs*(ZI-.002);
     for(let k=0;k<n;k++){const u0=k/n,u1=(k+1)/n,A0=a0+(Math.PI-2*a0)*u0,A1=a0+(Math.PI-2*a0)*u1,B0=b0+(Math.PI-2*b0)*u0,B1=b0+(Math.PI-2*b0)*u1,am=(A0+A1)/2,ref=[cx+Math.cos(am)*RL*3,t.wr+Math.sin(am)*RL*3,zs*ZI];
      // dobra da lataria pra dentro do arco (acabamento) e depois o forro preto até a parede interna
      const o0=P(RL,A0,.004,cap),o1=P(RL,A1,.004,cap),f0=[o0[0],o0[1],o0[2]-zs*.03],f1=[o1[0],o1[1],o1[2]-zs*.03];
      AM.qa(f0,f1,o1,o0,flange,ref);AM.qa(Q(A0,wz,cap),Q(A1,wz,cap),f1,f0,blk,ref);
      AM.qa([cx,yb,wz],Q(A0,wz,cap),Q(A1,wz,cap),Q(A1,wz,cap),blk,[cx,t.wr,0]);
      // friso: discreto e rente na pintura; alargador de plástico em SUV/picape/viatura/caminhão
      const lo=plastic?.018:.005,c2=cap+(R1-R0);body.qa(P(R0,A0,lo,cap),P(R1,B0,lo,c2),P(R1,B1,lo,c2),P(R0,A1,lo,cap),lipC,[cx,t.wr,0])}}};
   // caixas de roda com fundo escuro e friso (plástico preto em SUV/picape)
   if(type==='truck')arch(t.wb);else{arch(t.wb);arch(-t.wb)}
   // soleira entre as rodas
   if(type!=='truck'&&type!=='bus')strip(-t.wb+R1+.03,t.wb-R1-.03,yBase+.005,yBase+(plastic?.13:.07),trim,.01,.012);
   // vincos das portas
   if(LO){const fa=Math.min((CO?CO.xf0:L*.1)-.06,t.wb-R1-.05),rb=Math.max(-t.wb+R1+.05,(CO?CO.xr1:-L*.25)-.05),yt=(CO?CO.yb:LO.yF-.1)-.03,y0=yBase+.09;
    if(fa-rb>.6){seam(fa,y0,yt);seam(rb,y0,yt);if(CO&&CO.B)seam((CO.B[0]+CO.B[1])/2,y0,yt)}}
   // friso cromado da linha de cintura
   if(CO&&(type==='sedan'||type==='taxi'||type==='wagon'))strip(CO.xr0+.12,CO.xf0-.1,CO.yb-.05,CO.yb-.03,chrome,.014,.01);
   // grade com frisos horizontais
   {const GR={sedan:[.5,.64,.42],taxi:[.5,.64,.42],police:[.5,.64,.42],suv:[.7,.92,.5],van:[.55,.72,.45],sports:[.32,.47,.44],truck:[.72,1.38,.55]};let g=GR[type];
    if(!g&&BU&&OV&&type!=='super'&&type!=='bus'){const top=LO?LO.yF-(LO.dF||0)-.07:9;g=[BU.yf+BU.h+.025,Math.min(OV.yh+.04,top),Math.max(.2,hw-OV.ins-.2*OV.sz-.05)];if(g[1]-g[0]>.08)body.box(L/2-.02,g[0],-g[2],L/2+.03,g[1],g[2],COL('#111114'));else g=null}
    if(type==='truck')body.box(L/2-.02,g[0],-g[2],L/2+.03,g[1],g[2],COL('#111114'));
    if(g){const n=type==='truck'?6:g[1]-g[0]>.17?3:2;for(let j=0;j<n;j++){const y=g[0]+(g[1]-g[0])*(j+1)/(n+1);body.box(L/2+.03,y-.009,-g[2]+.03,L/2+.044,y+.009,g[2]-.03,type==='truck'?chrome:slat)}}}
   // placas Mercosul (branca com faixa azul), dianteira e traseira no para-choque
   if(BU){const plate=(x0,x1,y0)=>{const o=x1>0?1:-1,xo=o>0?x1:x0;body.box(x0,y0,-.2,x1,y0+.13,.2,COL('#efefea'));body.box(Math.min(xo,xo+o*.004),y0+.098,-.195,Math.max(xo,xo+o*.004),y0+.126,.195,COL('#1f4fb4'));};
    const fy=BU.yf+(BU.h-.13)/2,ry=BU.yr+(BU.h-.13)/2;CAR_PLATE_BASE[type]={front:fy,rear:ry};plate(L/2+.045,L/2+.062,fy);plate(-L/2-.062,-L/2-.045,ry)}
   // escapamento (duplo nos esportivos) — caminhão usa chaminés
   if(BU&&type!=='truck'&&type!=='bus'){const two=type==='sports'||type==='super'||type==='roadster'||type==='conv'||type==='police',y=BU.yr-.03,r=two?.04:.035;
    for(const z of two?[-hw*.45,hw*.45]:[-hw*.5]){body.geo(CARG.cyl,mtx(-L/2+.06,y,z,r,.26,r,0,0,Math.PI/2),COL('#5d6066'));body.geo(CARG.cyl,mtx(-L/2-.071,y,z,r*.7,.012,r*.7,0,0,Math.PI/2),COL('#050505'))}}
   // palhetas do para-brisa (e traseira nos hatch/peruas/SUVs)
   if(CO){const x=CO.xf0-.07,y=CO.yb+.01+(CO.yR-CO.yb-.01)*Math.cos(Math.PI/2*(x-CO.xf1)/Math.max(.01,CO.xf0-CO.xf1)),zz=hw-(CO.inB||.1)-.12;
    {const bl=Math.min(.5,zz*.62);body.box(x-.012,y+.01,-.1-bl,x+.012,y+.03,-.1,wip);body.box(x-.012,y+.01,.02,x+.012,y+.03,.02+bl*.9,wip);body.box(x-.01,y,-.12,x+.01,y+.03,-.08,wip);body.box(x-.01,y,0,x+.01,y+.03,.04,wip)}
    if(type==='hatch'||type==='wagon'||type==='suv'||type==='mini'||type==='crossover'){const xr=CO.xr0+(CO.xr1-CO.xr0)*.3,yr=CO.yb+.03+(CO.yR-CO.yb-.03)*Math.sin(Math.PI/2*.3);body.box(xr-.012,yr,-.03,xr+.012,yr+.02,.3,wip)}}
   // setas âmbar na frente e luz de ré branca atrás
   if(OV){t.sigF={x:L/2-.02,y:OV.yh,z:hw-OV.ins-.27*OV.sz};t.sigR={y:OV.yt,z:hw-OV.ins+.06-.15*OV.sz}}if(OV)for(const zs of [-1,1]){body.geo(CARG.tiny,mtx(L/2-.035,OV.yh,zs*(hw-OV.ins-.27*OV.sz),.03,.045*OV.sz,.05*OV.sz),COL('#9a6414'));li.geo(CARG.tiny,mtx(-L/2+.025,OV.yt,zs*(hw-OV.ins+.06-.28*OV.sz),.03,.04*OV.sz,.05*OV.sz),rev)}
   // faróis de neblina no para-choque
   if(BU&&(type==='suv'||type==='crossover'||type==='pickup'||type==='police'||type==='sports'))for(const zs of [-1,1])li.geo(CARG.tiny,mtx(L/2+.045,BU.yf+BU.h*.5,zs*(hw-.32),.02,.035,.06),COL('#fff6d8'));
   // antena no teto
   if(CO&&(type==='sedan'||type==='taxi'||type==='wagon'||type==='police'))body.geo(CARG.rod,mtx(CO.xr1+.1-Math.sin(.3)*.2,CO.yR+Math.cos(.3)*.2,-.25,.008,.4,.008,0,0,.3),wip);
   if(type==='taxi')strip(-L/2+.4,L/2-.4,.6,.66,COL('#111'),.006,.01); // faixa do táxi colada na lateral
   if(type==='police'){// quebra-mato
    for(const zs of [-1,1]){body.box(L/2+.15,.3,zs*.34-.03,L/2+.2,.78,zs*.34+.03,dark);body.box(L/2+.05,.42,zs*.34-.025,L/2+.15,.47,zs*.34+.025,dark)}
    for(const y of [.44,.7])body.box(L/2+.12,y,-.42,L/2+.18,y+.05,.42,dark)}
   if(type==='suv'){// estepe na tampa traseira
    body.geo(CARG.cyl,mtx(-L/2-.13,.98,0,.33,.2,.33,0,0,Math.PI/2),COL('#141416'));body.geo(CARG.cyl,mtx(-L/2-.235,.98,0,.25,.02,.25,0,0,Math.PI/2),col);body.geo(CARG.cyl,mtx(-L/2-.25,.98,0,.06,.02,.06,0,0,Math.PI/2),chrome)}
   // rack de teto: acompanha a curva do teto (antes era uma barra reta que flutuava sobre o vidro traseiro)
   const roofY=x=>x<CO.xr1?CO.yb+.03+(CO.yR-CO.yb-.03)*Math.sin(Math.PI/2*Math.max(0,x-CO.xr0)/Math.max(.01,CO.xr1-CO.xr0)):x>CO.xf1?CO.yb+.01+(CO.yR-CO.yb-.01)*Math.cos(Math.PI/2*Math.min(1,(x-CO.xf1)/Math.max(.01,CO.xf0-CO.xf1))):CO.yR;
   const rails=(x0,x1)=>{const zr=hw-(CO.inT||.3)-.1,n=Math.max(2,Math.ceil((x1-x0)/.2));for(const zs of [-1,1]){for(let k=0;k<n;k++){const xa=x0+(x1-x0)*k/n,xb=x0+(x1-x0)*(k+1)/n,y=Math.min(roofY(xa),roofY(xb));body.box(xa,y-.01,zs*zr-.025,xb,y+.035,zs*zr+.025,dark)}
     for(const xf of [x0+.04,x1-.04]){const y=roofY(xf);body.box(xf-.05,y-.02,zs*zr-.035,xf+.05,y+.045,zs*zr+.035,dark)}}};
   if(CO&&(type==='crossover'||type==='wagon'||type==='suv'))rails(Math.max(CO.xr0+.1,CO.xr1-.25),CO.xf1+.02);
   if(type==='hatch'&&CO)body.cbox(CO.xr1-.18,CO.yR-.03,-hw+.24,CO.xr1+.04,CO.yR+.025,hw-.24,col.clone().multiplyScalar(.9),.02);
   if(type==='pickup'){// santantônio, frisos da caçamba e maçaneta da tampa
    for(const zs of [-1,1])body.geo(CARG.rod,mtx(-.55,1.5,zs*(hw-.07),.035,.42,.035),trim);body.geo(CARG.rod,mtx(-.55,1.71,0,.035,(hw-.07)*2+.07,.035,Math.PI/2,0,0),trim);
    for(const z of [-.5,-.17,.17,.5])body.box(-L/2+.2,1.04,z-.025,-.5,1.055,z+.025,COL('#2c2c30'));body.box(-L/2+.004,1.19,-.15,-L/2+.022,1.23,.15,trim)}
   if(type==='van'){// porta corrediça, trilho, porta dianteira e portas traseiras com vidro
    seam(L/2-1.05,yBase+.09,1.95);seam(L/2-2.3,yBase+.09,1.95);seam(L/2-3.5,yBase+.09,1.95);strip(-L/2+.35,L/2-3.5,1.2,1.24,trim,.01,.01);
    body.box(-L/2-.008,.45,-.007,-L/2+.002,t.H-.15,.007,gap);for(const zs of [-1,1])body.box(-L/2-.006,1.35,zs>0?.08:-hw+.35,-L/2+.002,1.95,zs>0?hw-.35:-.08,glass)}
   if(type==='bus'){// porta dianteira de vidro, colunas das janelas e grade do motor traseiro
    body.box(L/2-.9,.55,hw-.02,L/2-.15,2.65,hw+.045,dark);body.box(L/2-.87,.65,hw+.045,L/2-.54,2.55,hw+.055,glass);body.box(L/2-.51,.65,hw+.045,L/2-.18,2.55,hw+.055,glass);
    for(let x=-L/2+1.1;x<L/2-1.2;x+=1.25)for(const zs of [-1,1])body.box(x-.04,1.55,zs>0?hw+.03:-hw-.045,x+.04,2.55,zs>0?hw+.045:-hw-.03,dark);
    for(let j=0;j<5;j++){const y=.8+j*.11;body.box(-L/2-.012,y,-.8,-L/2+.002,y+.05,.8,dark)}}
   if(type==='truck'){// chaminés cromadas, tanque, para-barros e luzes laterais
    for(const zs of [-1,1]){body.geo(CARG.cyl,mtx(1.85,2.0,zs*(hw+.07),.055,2.6,.055),chrome);body.geo(CARG.cyl,mtx(1.85,3.31,zs*(hw+.07),.06,.04,.06),COL('#222'));
     body.geo(CARG.cyl,mtx(.9,.48,zs*.92,.22,1.1,.22,0,0,Math.PI/2),COL('#a7abb2'));body.box(-t.wb-t.wr-.11,.12,zs>0?.75:-1.15,-t.wb-t.wr-.08,.62,zs>0?1.15:-.75,trim);
     for(let x=-L/2+.4;x<1.4;x+=1.1)li.box(x,.68,zs>0?hw:-hw-.012,x+.1,.73,zs>0?hw+.012:-hw,COL('#ffa21a'))}}
  }
 }
 if(type!=='boat'&&type!=='moto'){const yb=({bus:.45,suv:.42,pickup:.36,truck:.42,sports:.26,super:.26,van:.3})[type]||.28,e=.12;body.quad([-L/2+e,yb,-hw+e],[L/2-e,yb,-hw+e],[L/2-e,yb,hw-e],[-L/2+e,yb,hw-e],0,-1,0,[0,0,1,1],dark)}
}
/* detailed mesh: only for the player's car, wrecks and nearby special cases */
function timeContourPoints(shell,L,W,lane){
 // v77: faixa contínua estilo DeLorean do filme — nasce no ombro atrás da cabine (lado A), desce pela coluna traseira,
 // corre na horizontal até o canto, atravessa a traseira e volta pelo lado B até o ombro. ciano por baixo, magenta por cima.
 const base=new THREE.CatmullRomCurve3([[-.14,.94],[-.18,.925],[-.225,.895],[-.27,.855],[-.30,.81],[-.315,.765],[-.33,.72],[-.36,.695],[-.40,.68],[-.44,.67],[-.465,.665]].map(([x,y])=>new THREE.Vector3(x*L,y,0)),false,'centripetal');
 const off=.03*lane,ray=new THREE.Raycaster(),hit=(o,d)=>{ray.set(o,d);const h=ray.intersectObject(shell,false);return h.length?h[0].point:null};shell.updateMatrixWorld(true);
 const sidePts=side=>{const out=[];for(let i=0;i<=40;i++){const t=i/40,p=base.getPoint(t),d=base.getTangent(t),x=p.x+(-d.y)*off*side*side,y=p.y+d.x*off;let h=null;
   for(const dy of [0,-.015,.015,-.03,.03,-.06,.06]){h=hit(new THREE.Vector3(x,y+dy,side*(W/2+.8)),new THREE.Vector3(0,0,-side));if(h)break}
   if(h)out.push(new THREE.Vector3(h.x,h.y,h.z+side*.014))}return out};
 const A=sidePts(1),B=sidePts(-1).reverse(),yR=.665-off,rear=[];
 for(let i=0;i<=24;i++){const z=W/2*.94*(1-2*i/24);const h=hit(new THREE.Vector3(-L/2-1,yR,z),new THREE.Vector3(1,0,0));if(h)rear.push(new THREE.Vector3(h.x-.014,h.y,h.z))}
 let pts=[...A,...rear,...B];if(pts.length<8)throw new Error('Time contour misses body');
 // remove saltos (raio que pegou outra peça, ex.: venezianas) e suaviza a curva
 pts=pts.filter((p,i)=>{if(i===0||i===pts.length-1)return true;const a=pts[i-1],b=pts[i+1],m=a.clone().add(b).multiplyScalar(.5);return p.distanceTo(m)<.09});
 for(let k=0;k<3;k++)pts=pts.map((p,i)=>i===0||i===pts.length-1?p:pts[i-1].clone().add(p.clone().multiplyScalar(2)).add(pts[i+1]).multiplyScalar(.25));
 return pts;
}
function buildTimeContours(c,shell,ch){
 c.timeGlow=[];
 for(const [color,lane] of [[0x39eaff,1],[0xff4cce,-1]]){
  const points=timeContourPoints(shell,c.t.L,c.t.W,lane);
  const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)if(points[i].distanceTo(points[i-1])>1e-4)path.add(new THREE.LineCurve3(points[i-1],points[i]));
  for(const [radius,gain] of [[.012,.98],[.026,.19]]){
   const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
   const line=new THREE.Mesh(new THREE.TubeGeometry(path,140,radius*1.25,6,false),mat);line.visible=false;line.userData.energyGain=gain;line.userData.timeContour={lane};ch.add(line);c.timeGlow.push(line);
  }
 }
}
/* Letreiro frontal dos onibus: tres destinos, textura compartilhada e leve. */
const BUS_DESTINATIONS=['CENTRO','PRAIA','INDUSTRIA'];
const BUS_SIGN_TEXTURES={};
function busDestinationTexture(destination){
 if(BUS_SIGN_TEXTURES[destination])return BUS_SIGN_TEXTURES[destination];
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#ffcc33';ctx.fillRect(0,0,256,64);
 ctx.fillStyle='#2c2106';ctx.textAlign='center';ctx.textBaseline='middle';
 let fontSize=destination==='INDUSTRIA'?34:43;
 ctx.font='bold '+fontSize+'px monospace';
 ctx.fillText(destination,128,34);
 const texture=new THREE.CanvasTexture(canvas);
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 BUS_SIGN_TEXTURES[destination]=texture;return texture;
}
const CAR_PLATE_CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let CAR_PLATE_ATLAS=null;
function carPlateAtlas(){if(CAR_PLATE_ATLAS)return CAR_PLATE_ATLAS;const cvs=document.createElement('canvas'),cells=6,sz=96;cvs.width=cvs.height=cells*sz;const ctx=cvs.getContext('2d');ctx.clearRect(0,0,cvs.width,cvs.height);ctx.fillStyle='#131316';ctx.font='900 76px "Arial Narrow",Arial,monospace';ctx.textAlign='center';ctx.textBaseline='middle';for(let i=0;i<CAR_PLATE_CHARS.length;i++)ctx.fillText(CAR_PLATE_CHARS[i],(i%cells+.5)*sz,(Math.floor(i/cells)+.54)*sz,sz*.87);const tex=new THREE.CanvasTexture(cvs);tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;CAR_PLATE_ATLAS=tex;return tex}
function randomPlate(){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ',N='0123456789',pick=(src,n)=>{let out='';for(let i=0;i<n;i++)out+=src[Math.floor(R2()*src.length)];return out};return pick(A,3)+pick(N,1)+pick(A,1)+pick(N,2)}
function normPlate(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7)}
function addCarPlates(c,ch){if(c.t.boat||c.type==='jetski')return;c.plate=normPlate(c.plate)||randomPlate();
 // Um atlas unico + um mesh de letras por carro: o fundo branco/azul ja faz parte da geometria existente.
 const L=c.t.L,base=CAR_PLATE_BASE[c.type],isMoto=c.type==='moto',isVortex=c.type==='vortex',cfg=isMoto?{rear:.596}:isVortex?{rear:.465,front:.465}:base;
 if(!cfg)return;const pos=[],uv=[],idx=[];
 for(const face of (isMoto?['rear']:['front','rear'])){const front=face==='front',y0=cfg[face];if(y0===undefined)continue;
  const x=isMoto?-1.293:(front?L/2+.082:-L/2-.082),z0=0,n=c.plate.length,chW=Math.min(.045,.318/Math.max(n,1)),lineW=chW*n,h=isMoto?.078:.073,cy=y0+(isMoto?.038:.050),sgn=front?-1:1;
  for(let k=0;k<n;k++){const g=CAR_PLATE_CHARS.indexOf(c.plate[k]);if(g<0)continue;const zL=z0+sgn*(-lineW/2+chW*k),zR=z0+sgn*(-lineW/2+chW*(k+1)),ii=pos.length/3;
   pos.push(x,cy-h/2,zL,x,cy-h/2,zR,x,cy+h/2,zR,x,cy+h/2,zL);
   const u0=(g%6+.07)/6,u1=(g%6+.93)/6,v1=1-(Math.floor(g/6)+.08)/6,v0=1-(Math.floor(g/6)+.92)/6;
   uv.push(u0,v0,u1,v0,u1,v1,u0,v1);idx.push(ii,ii+1,ii+2,ii,ii+2,ii+3);
  }
 }
 if(!idx.length)return;const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(idx);geom.computeVertexNormals();
 const mat=new THREE.MeshBasicMaterial({map:carPlateAtlas(),transparent:true,alphaTest:.18,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});const mesh=new THREE.Mesh(geom,mat);mesh.renderOrder=2;mesh.userData.plateText=true;ch.add(mesh);c.plateMeshes=[mesh];
}
function setCarPlate(c,text){if(!c)return false;const v=normPlate(text);if(!v)return false;c.plate=v;if(c.g){dropCarMesh(c);buildCarMesh(c)}return true}
// Luminoso de teto do táxi: trapézio (mais largo embaixo) com "TAXI" na frente e atrás. Materiais compartilhados.
const TAXISIGN={};
// A capelinha existente serve de indicador de TAXI LIVRE (sem geometria ou luz extra).
// Materiais/textura compartilhados; todos os meshes do letreiro ficam fora do descarte por LOD.
function taxiSignLit(c){if(S.style==='inverted')return false;return !!(c&&c.alive&&c.taxiFreeLit&&!c.taxiAI&&c!==PL.car&&c!==PL.taxi)||!!(c&&c.alive&&c.taxiFreeLit&&c.taxiAI&&c!==PL.taxi)}
function taxiSignVisual(c){if(!c.taxiSign)return;const lit=taxiSignLit(c);if(c.taxiSign.lit===lit)return;c.taxiSign.lit=lit;
 c.taxiSign.body.material=lit?TAXISIGN.mat:TAXISIGN.matDim;
 for(const f of c.taxiSign.faces)f.material=lit?TAXISIGN.face:TAXISIGN.faceDim}
function taxiSign(c){if(!TAXISIGN.geo){const g=new THREE.CylinderGeometry(.5,.62,.24,4,1);g.rotateY(Math.PI/4);g.scale(.48,1,1.05);TAXISIGN.geo=g;
  TAXISIGN.mat=new THREE.MeshBasicMaterial({color:0xffd23a});TAXISIGN.matDim=new THREE.MeshBasicMaterial({color:0x37332a});
  const canvas=cv(128,40),q=canvas.getContext('2d');q.fillStyle='#ffe066';q.fillRect(0,0,128,40);q.fillStyle='#141414';q.font='900 30px Arial Black,Arial,sans-serif';q.textAlign='center';q.textBaseline='middle';q.fillText('TAXI',64,22);
  const t=new THREE.CanvasTexture(canvas);t.anisotropy=4;
  TAXISIGN.face=new THREE.MeshBasicMaterial({map:t});TAXISIGN.faceDim=new THREE.MeshBasicMaterial({map:t,color:0x35312d});TAXISIGN.pg=new THREE.PlaneGeometry(.66,.19)}
 const sign=new THREE.Group(),body=new THREE.Mesh(TAXISIGN.geo,TAXISIGN.mat),faces=[];sign.add(body);
 for(const d of [1,-1]){const face=new THREE.Mesh(TAXISIGN.pg,TAXISIGN.face);
  // A face lateral da capelinha e inclinada: x = +/-(.190 - .170*y).
  // A placa segue essa inclinacao, apenas 0.008 unidades fora da superficie (sem z-fighting).
  face.position.set(d*.198,0,0);face.rotation.y=d*Math.PI/2;
  face.rotateX(-Math.atan(((.62-.5)*Math.SQRT1_2*.48)/.24));
  sign.add(face);faces.push(face)}
 sign.position.set(-.15,1.54,0);sign.traverse(o=>{o.userData.taxiSign=true});c.taxiSign={body,faces,lit:null};taxiSignVisual(c);return sign}
const CAR_GEO=new Map();
/* v3 r5: geometria do carro detalhado montada ANTES de ele chegar perto (tempo ocioso do navegador).
   Antes ela era montada no quadro em que o carro cruzava os ~118 m — no perfil, ~68 KB/quadro de lixo e o maior pico
   do lado do jogo. Mesma chave, mesmo cache (limite de 400), mesma malha: só muda QUANDO é montada. */
function carGeoKey(c){if(c._gkC!==c.color||c._gkT!==c.type||c._gkG!==c.cargo||c._gkS!==S.style){c._gkC=c.color;c._gkT=c.type;c._gkG=c.cargo;c._gkS=S.style;c._gk=c.type+'|'+c.color+'|'+(c.cargo||'')+'|'+S.style}return c._gk}
function carGeoBuild(c,gk){const st=STYLES[S.style];const body=new MB(),li=new MB(),rid=new MB();carParts(c.type,c.color,st,body,li,c.cargo,rid,true);const keep=CAR_GEO.size<400,geo=mb=>{if(!mb||!mb.p.length)return null;const gg=mb.mesh(carBodyMat).geometry;gg.userData.cached=keep;return gg};
 const G={b:geo(body),a:geo(body.arch),l:geo(li)};if(keep)CAR_GEO.set(gk,G);return G}
const CARPW={t:0,busy:false,n:0};
function carGeoPrewarmTick(dt){if((CARPW.t-=dt)>0||CARPW.busy||CAR_GEO.size>=400||!played)return;CARPW.t=.25;CARPW.busy=true;
 const run=dl=>{CARPW.busy=false;try{const foc=TVM.on?TVM.foc:(PL.car||PL);let best=null,bd=230*230;
  for(let i=0;i<vehicles.length;i++){const c=vehicles[i];if(c.g||!c.alive||c.t.boat||c.t.hover)continue;const d2=(c.x-foc.x)**2+(c.z-foc.z)**2;if(d2>=bd||d2<20*20)continue;if(CAR_GEO.has(carGeoKey(c)))continue;bd=d2;best=c}
  if(best&&(!dl||dl.didTimeout||dl.timeRemaining()>6)){carGeoBuild(best,carGeoKey(best));CARPW.n++}}catch(e){console.warn('[carGeoPrewarm]',e)}};
 if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:1500});else setTimeout(run,0)}
/* r38 · DANO POR ZONA (estilo GTA SA): a batida não deforma a malha na hora — ela TROCA a malha por uma variante pronta.
   Zonas: f (frente), r (traseira), l (lado esquerdo), d (lado direito); nível 0–2 cada. Batida ≥7 m/s sobe 1 nível na zona atingida, ≥15 m/s vai direto pro 2.
   Variantes por tipo+cor+estilo+combinação em CAR_DMG (cached, compartilhadas entre carros iguais). As 8 de zona única (4 zonas × 2 níveis)
   são pré-calculadas em segundo plano quando a malha base do carro é criada; combinações de 2+ zonas na primeira vez que aparecem.
   Nível 2 de frente/traseira: para-choque pendurado (peça separada). Oficina (repairCar) volta a malha original. Não vai pro save nem pro online. */
const CAR_DMG=new Map(),CAR_DMG_Q=[];
function carDmgKey(d){return ''+(d.f|0)+(d.r|0)+(d.l|0)+(d.d|0)}
/* r42: amassado mais fundo (profundidade ×CAR_DMG_K, raio ×CAR_DMG_R) + vincos (ondulação da lata) no nível 2 */
const CAR_DMG_K=1.9,CAR_DMG_R=1.18;
function carDmgDents(t,d){const hl=t.L/2,hw=t.W/2,H=t.H||1.4,out=[];
 const end=(sg,lv)=>{if(!lv)return;const k=lv===1;out.push({x:sg*hl,y:H*.42,z:0,vx:-sg,vy:0,vz:0,r:hw*(k?1.15:1.45),d:k?.2:.42});out.push({x:sg*(hl-.25),y:H*.62,z:hw*.45,vx:-sg*.4,vy:-1,vz:0,r:k?.55:.8,d:k?.07:.16});if(!k)out.push({x:sg*hl,y:H*.35,z:-hw*.7,vx:-sg,vy:0,vz:.3,r:.6,d:.18})};
 const side=(sg,lv)=>{if(!lv)return;const k=lv===1;out.push({x:.15,y:H*.42,z:sg*hw,vx:0,vy:0,vz:-sg,r:k?1.05:1.35,d:k?.13:.27});if(!k){out.push({x:-hl*.55,y:H*.4,z:sg*hw,vx:0,vy:0,vz:-sg,r:.8,d:.17});out.push({x:hl*.55,y:H*.5,z:sg*hw,vx:0,vy:-.4,vz:-sg,r:.7,d:.12})}};
 end(1,d.f|0);end(-1,d.r|0);side(-1,d.l|0);side(1,d.d|0);for(const q of out){q.d*=CAR_DMG_K;q.r*=CAR_DMG_R;q.w=q.d>.35?1:0}return out}
function carDmgDeform(base,D){const g=base.clone();const src=base.attributes.position.array,dst=g.attributes.position.array;
 for(let i=0;i<src.length;i+=3){let x=src[i],y=src[i+1],z=src[i+2];for(const q of D){const ex=x-q.x,ey=(y-q.y)*.8,ez=z-q.z,dd=Math.sqrt(ex*ex+ey*ey+ez*ez);if(dd>=q.r)continue;const f=1-dd/q.r,k=f*f*q.d,wr=q.w?Math.sin(src[i]*9.1+src[i+2]*7.3)*Math.sin(src[i+1]*11.7+src[i]*3.1)*k*.32:0;x+=q.vx*(k+wr);y+=q.vy*k-k*.15+wr*.5;z+=q.vz*(k+wr)}dst[i]=x;dst[i+1]=y;dst[i+2]=z}
 g.attributes.position.needsUpdate=true;if(!g.index)g.computeVertexNormals();g.computeBoundingSphere();return g}
function carDmgVariant(gk,t,G,d){const key=gk+'#'+carDmgKey(d);let V=CAR_DMG.get(key);if(V)return V;const D=carDmgDents(t,d);
 V={b:G.b?carDmgDeform(G.b,D):null,l:G.l?carDmgDeform(G.l,D):null};const keep=CAR_DMG.size<900;for(const k in V)if(V[k])V[k].userData.cached=keep;if(keep)CAR_DMG.set(key,V);return V}
function carDmgPrecalc(gk,t,G){for(const z of ['f','r','l','d'])for(const lv of [1,2])CAR_DMG_Q.push({gk,t,G,d:{[z]:lv}});if(!carDmgPrecalc.run){carDmgPrecalc.run=true;const step=()=>{const t0=performance.now();while(CAR_DMG_Q.length&&performance.now()-t0<3){const q=CAR_DMG_Q.shift();try{carDmgVariant(q.gk,q.t,q.G,q.d)}catch(e){}}if(CAR_DMG_Q.length)(window.requestIdleCallback||setTimeout)(step,{timeout:400});else carDmgPrecalc.run=false};(window.requestIdleCallback||setTimeout)(step,{timeout:400})}}
function carDent(c,v,px,pz){if(!c||!c.t||c.t.boat||c.t.hover||c.type==='moto'||c.type==='jetski'||v<7)return;
 const t=c.t,hl=t.L/2,hw=t.W/2,ca=Math.cos(c.a),sa=Math.sin(c.a),dx=px-c.x,dz=pz-c.z,lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;
 const z=Math.abs(lx)/hl>Math.abs(lz)/hw?(lx>0?'f':'r'):(lz>0?'d':'l');c.dmg=c.dmg||{};const was=c.dmg[z]|0,now=Math.min(2,v>=15?2:was+1);
 if(now!==was){c.dmg[z]=now;c.dmgDirty=true;if(now===2&&(z==='f'||z==='r')&&(c===PL.car||Math.hypot(c.x-PL.x,c.z-PL.z)<40))try{clang(.25)}catch(e){}}}
const BUMPER_GEO=new THREE.BoxGeometry(1,1,1);BUMPER_GEO.userData.cached=true;const BUMPER_MAT=new THREE.MeshStandardMaterial({color:0x2a2a2e,roughness:.7});BUMPER_MAT.userData.cached=true;
function carDmgApply(c){c.dmgDirty=false;const P=c.dentParts;if(!P)return;const d=c.dmg||{},any=(d.f|0)+(d.r|0)+(d.l|0)+(d.d|0)>0;
 const V=any?carDmgVariant(c.dmgGk,c.t,c.dmgG,d):null;P.shell.geometry=V&&V.b?V.b:c.dmgG.b;if(P.lamp)P.lamp.geometry=V&&V.l?V.l:c.dmgG.l;
 if(P.plate){const g=P.plate.geometry,src=P.plateBase.attributes.position.array,dst=g.attributes.position.array;const D=any?carDmgDents(c.t,d):[];
  for(let i=0;i<src.length;i+=3){let x=src[i],y=src[i+1],z=src[i+2];for(const q of D){const ex=x-q.x,ey=(y-q.y)*.8,ez=z-q.z,dd=Math.sqrt(ex*ex+ey*ey+ez*ez);if(dd>=q.r)continue;const f=1-dd/q.r,k=f*f*q.d,wr=q.w?Math.sin(src[i]*9.1+src[i+2]*7.3)*Math.sin(src[i+1]*11.7+src[i]*3.1)*k*.32:0;x+=q.vx*(k+wr);y+=q.vy*k-k*.15+wr*.5;z+=q.vz*(k+wr)}dst[i]=x;dst[i+1]=y;dst[i+2]=z}g.attributes.position.needsUpdate=true}
 for(const k of ['f','r']){const want=(d[k]|0)>=2;let m=P['bump'+k];if(want&&!m){const t=c.t,hl=t.L/2,sg=k==='f'?1:-1;m=new THREE.Mesh(BUMPER_GEO,BUMPER_MAT);m.scale.set(.14,.16,t.W*.78);m.position.set(sg*(hl-.04),.34,t.W*.1);m.rotation.set(-.32*sg,0,.06*sg);m.castShadow=true;c.ch.add(m);P['bump'+k]=m}else if(!want&&m){c.ch.remove(m);P['bump'+k]=null}}}
function buildCarMesh(c){
 const t=c.t,L=t.L,W=t.W,st=STYLES[S.style];c.dentParts=null;
 const g=new THREE.Group(),ch=new THREE.Group();g.add(ch);
 // v104: a malha detalhada é guardada por tipo+cor+carga+estilo, então trocar de LOD perto do jogador não refaz a geometria
 const gk=carGeoKey(c);let G=CAR_GEO.get(gk);
 if(!G)G=carGeoBuild(c,gk);
 const holed=!t.boat&&!t.hover&&c.type!=='moto'&&c.type!=='jetski';const shell=new THREE.Mesh(G.b,holed?carHoleMat(c,!!c.exploded):carBodyMat);shell.castShadow=shell.receiveShadow=true;ch.add(shell);c.dirtShell=(t.boat||t.hover||c.type==='jetski')?null:shell;
 if(G.a)ch.add(new THREE.Mesh(G.a,carBodyMat));c.lampMesh=G.l?new THREE.Mesh(G.l,carLightMat):null;if(holed){c.dentParts={shell,lamp:c.lampMesh};c.dmgGk=gk;c.dmgG=G;if(!G.pre){G.pre=true;carDmgPrecalc(gk,t,G)}if(c.dmg)c.dmgDirty=true}if(c.lampMesh)ch.add(c.lampMesh);c.rider=null;
 if(c.type==='taxi')ch.add(taxiSign(c));
 const nCh0=ch.children.length;addCarPlates(c,ch);
 if(c.dentParts&&ch.children.length>nCh0){const pm=ch.children[ch.children.length-1];if(pm&&pm.isMesh&&pm.geometry&&!pm.geometry.userData.cached){c.dentParts.plate=pm;c.dentParts.plateBase=pm.geometry.clone()}}
 if(c.polBoat){const r=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.5),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x4a1418,roughness:.6}):new THREE.MeshBasicMaterial({color:0xff2020})),b=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.5),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x14224a,roughness:.6}):new THREE.MeshBasicMaterial({color:0x2060ff}));r.position.set(-.2,(t.H||1.2)+.55,-.3);b.position.set(-.2,(t.H||1.2)+.55,.3);ch.add(r,b);c.ambL=[r,b]}
 if(c.ambulance){// ambulância: faixa e cruzes vermelhas coladas na lataria (fita que segue a curva) e giroflex sobre o teto reto
  const m=new MB(),red=COL('#d81e2a'),H=t.H,S=t.sideZ||(()=>W/2),RY=t.roofY||(()=>H);
  const rib=(x0,x1,y0,y1,o)=>{const n=Math.max(2,Math.ceil((x1-x0)/.1));for(const zs of [-1,1]){const P=(x,y)=>[x,y,zs*(S(x,y)+o)];for(let k=0;k<n;k++){const xa=x0+(x1-x0)*k/n,xb=x0+(x1-x0)*(k+1)/n;m.qa(P(xa,y0),P(xb,y0),P(xb,y1),P(xa,y1),red,[(xa+xb)/2,(y0+y1)/2,0])}}};
  const cx=-L/2+.85;rib(-L/2+.15,L/2-.35,H*.445,H*.475,.008);rib(cx-.12,cx+.12,H*.58,H*.88,.01);rib(cx-.4,cx+.4,H*.68,H*.78,.012);
  const rx=-L*.15,ry=RY(rx)+.005;m.box(rx-.5,ry,-.12,rx+.5,ry+.02,.12,red);m.box(rx-.12,ry,-.5,rx+.12,ry+.02,.5,red);ch.add(m.mesh(carBodyMat,false,false));
  const lx=L/2-1.55,ly=RY(lx)+.1,base=new MB();base.cbox(lx-.2,ly-.1,-W*.36,lx+.2,ly-.06,W*.36,COL('#222'),.02);ch.add(base.mesh(carBodyMat,false,false));
  const lr=new THREE.Mesh(new THREE.BoxGeometry(.3,.14,W*.3),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x4a1418,roughness:.6}):new THREE.MeshBasicMaterial({color:0xff2020})),lb=new THREE.Mesh(new THREE.BoxGeometry(.3,.14,W*.3),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x14224a,roughness:.6}):new THREE.MeshBasicMaterial({color:0x2060ff}));lr.position.set(lx,ly,-W*.19);lb.position.set(lx,ly,W*.19);ch.add(lr,lb);c.ambL=[lr,lb]}
 if(c.type==='bus'){
  // +X e a frente do veiculo; plano voltado para fora do para-brisa.
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.66,.225),
   S.style==='inverted'?new THREE.MeshLambertMaterial({map:busDestinationTexture(c.busDestination||'CENTRO'),color:0x9a9aa2,side:THREE.DoubleSide,depthTest:true,polygonOffset:true,polygonOffsetFactor:-2}):new THREE.MeshBasicMaterial({map:busDestinationTexture(c.busDestination||'CENTRO'),side:THREE.DoubleSide,depthTest:true,polygonOffset:true,polygonOffsetFactor:-2}));
  sign.rotation.y=Math.PI/2;
  sign.position.set(L/2+.057,2.925,0);
  ch.add(sign);
 }

 if(c.type==='super'&&c.special){
  // Apenas o DeLorean secreto tem contornos ciano/rosa e esfera temporal.
  buildTimeContours(c,shell,ch);
  // Esfera branca à frente do capô, visível a partir de 112 km/h.
  const orb=new THREE.Group();orb.position.set(L/2+1.1,1.06,0);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.99,depthWrite:false}));
  orb.add(core);
  const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xf1faff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  aura.scale.set(3.2,3.2,1);orb.add(aura);orb.visible=false;ch.add(orb);c.timeBall=orb;
  c.timeWheels=true;
 }
 c.wheels=[];c.hasWheelMeshes=!!c.timeWheels;const r=t.wr;
 for(let k=0;k<(t.boat||t.hover?0:4);k++){const front=k<2,x=front?t.wb:-t.wb,z=(k%2?1:-1)*(t.vtw!==undefined?t.vtw:t.tw);const piv=new THREE.Group();piv.position.set(x,r,z);
  const w=c.hasWheelMeshes?new THREE.Mesh(wheelGeo,wheelMat):new THREE.Object3D();w.scale.set(r,r,1);if(c.hasWheelMeshes){w.castShadow=true;w.add(new THREE.Mesh(hubGeo,hubMat))}piv.add(w);g.add(piv);c.wheels.push({piv,w,front})}
 if(c.timeWheels&&c.timeGlow){// v77: rodas acesas em amarelo (como no filme) junto com as faixas
  const rg=new THREE.RingGeometry(.5,.9,28),dg=new THREE.CircleGeometry(.5,20);
  for(const wh of c.wheels)for(const sd of [1,-1]){for(const [geo,col,gain] of [[rg,0xffe066,.95],[dg,0xfff2b0,.32]]){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));m.position.z=sd*.176;m.visible=false;m.userData.energyGain=gain;wh.w.add(m);c.timeGlow.push(m)}}
 }
 if(c.neon)carNeonMesh(c,g);
 if(st.synth&&c.hasGlow&&!c.neon){const ug=new THREE.Mesh(new THREE.PlaneGeometry(L+2.4,W+2.4),new THREE.MeshBasicMaterial({map:glowTex,color:c.glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.6}));
  ug.rotation.x=-Math.PI/2;ug.position.y=.06;ug.renderOrder=3;g.add(ug)}
 if(st.night&&!st.noLamps){const beam=new THREE.Mesh(new THREE.PlaneGeometry(10,5),new THREE.MeshBasicMaterial({map:glowTex,color:0xfff0c0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.2}));
  beam.rotation.x=-Math.PI/2;beam.position.set(L/2+4.6,.07,0);beam.renderOrder=3;beam.visible=false;g.add(beam);c.headBeam=beam}
 if(c.police){const mk=(z0,z1,col)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.36,.14,z1-z0),S.style==='inverted'?new THREE.MeshStandardMaterial({color:col,roughness:.6}):new THREE.MeshBasicMaterial({color:col}));m.position.set(-.05,1.57,(z0+z1)/2);ch.add(m);return m};
  c.lb=[mk(-.72,-.04,0x5a1010),mk(.04,.72,0x10205a)];const gl=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.45}));
  gl.rotation.x=-Math.PI/2;gl.position.y=.08;gl.renderOrder=3;gl.visible=false;g.add(gl);c.lbGlow=gl}
 if(c.exploded)g.traverse(o=>{if(!o.isMesh)return;if(o.material===carBodyMat)o.material=burntMat;else if(o.material&&o.material.userData.carBody)return;else if(o.material===carLightMat||(o.material&&o.material.blending===THREE.AdditiveBlending))o.visible=false});
 c.g=g;c.ch=ch;scene.add(g);syncCar(c,0);if(!c.exploded&&(c.grime||0)>=.04&&typeof dirtApply==='function')dirtApply(c)} /* v4 r28: malha remontada (LOD/tuning) volta suja */
function dropCarMesh(c){if(!c.g)return;c.timeGlow=null;c.timeBall=null;c.lb=null;c.lbGlow=null;c.hasWheelMeshes=false;scene.remove(c.g);c.g.traverse(o=>{if(o.userData.taxiSign)return;if(o.geometry&&!o.isSprite&&o.geometry!==wheelGeo&&o.geometry!==hubGeo&&!o.geometry.userData.cached)o.geometry.dispose();if(o.material&&o.material!==carBodyMat&&o.material!==carLightMat&&o.material!==wheelMat&&o.material!==hubMat&&o.material!==burntMat&&!o.material.userData.carBody)o.material.dispose()});c.g=null;c.ch=null;c.taxiSign=null;c.wheels=null;c.lampMesh=null;c.headBeam=null;c.wreckFade=null}
const CLOSE_CAR_DETAILS=new Set();let closeCarDetailT=0;
function updateCloseCarDetails(dt){
 closeCarDetailT-=dt;if(closeCarDetailT>0)return;closeCarDetailT=.25;
 const p=PL.car||PL,limit=MOB_LITE?7:14,candidates=[];
 const previousMotos=new Set([...CLOSE_CAR_DETAILS].filter(c=>c.type==='moto'));
 for(const c of vehicles){if(c===PL.car||!c.alive||c.t.boat||c.type==='moto')continue;const d2=(c.x-p.x)**2+(c.z-p.z)**2;if(d2<(CLOSE_CAR_DETAILS.has(c)?74*74:62*62))candidates.push({c,d2})}
 candidates.sort((a,b)=>a.d2-b.d2);CLOSE_CAR_DETAILS.clear();for(const e of candidates.slice(0,limit))CLOSE_CAR_DETAILS.add(e.c);
 // Motos antes eram excluídas do LOD detalhado e a placa com texto nunca aparecia
 // no tráfego. Selecionar poucas motos próximas, mantendo o orçamento dos carros.
 const bikes=[];for(const c of vehicles){if(!c.alive||c.type!=='moto'||c===PL.car)continue;const d2=(c.x-p.x)**2+(c.z-p.z)**2;
  if(d2<(previousMotos.has(c)?64*64:54*54))bikes.push({c,d2})}
 bikes.sort((a,b)=>a.d2-b.d2);
 for(const e of bikes.slice(0,MOB_LITE?2:4))CLOSE_CAR_DETAILS.add(e.c);
}
function ensureDetail(c){const foc=BENCH.running&&BENCH.focus?BENCH.focus:(TVM.on?TVM.foc:(PL.car||PL)),d2=(c.x-foc.x)**2+(c.z-foc.z)**2,actNear=d2<(c.g?135*135:118*118);const want=(c.net&&d2<140*140)||c.bench||c.display||c.tempPark||c.parkFade||c.wreckFade||c.clubVisit||(TVM.on&&(EVT.cars.includes(c)||d2<140*140))||CLOSE_CAR_DETAILS.has(c)||(c.ambulance&&d2<160*160)||c.t.boat||c===PL.car||((!c.alive||c.chase||c.police||c.crim)&&(actNear||(c.burn||0)>0||c.onFire))||(c===PL.lastCar&&d2<80*80);if(want&&!c.g)buildCarMesh(c);else if(!want&&c.g)dropCarMesh(c)}
const PARKVIS={t:8};
function parkFadeStep(c,dt){if(!c.g)buildCarMesh(c);if(!c.g)return;if(!c.parkFade){attachCarWheelMeshes(c);c.parkFade={t:0,mats:[]};const clones=new Map();c.g.traverse(o=>{if(!o.material)return;const clone=m=>{if(!clones.has(m)){const shared=[carBodyMat,carLightMat,wheelMat,hubMat,burntMat].includes(m)||!!m.userData.carBody,n=shared?m.clone():m;if(shared)n.userData.parkFadeTemp=true;n.onBeforeCompile=m.onBeforeCompile;n.transparent=true;n.depthWrite=false;clones.set(m,n);c.parkFade.mats.push(n)}return clones.get(m)};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material)})}
 c.parkFade.t+=dt;const alpha=Math.max(0,1-c.parkFade.t/1.1);for(const m of c.parkFade.mats)m.opacity=alpha;if(!alpha){removeVehicle(c);for(const m of c.parkFade.mats)if(m.userData.parkFadeTemp)m.dispose()}
}
function clubDriveTick(dt){
 const drive=city.casino?.clubDrive;if(!drive||!running||PL.inside||S.style==='inverted')return;
 let c=vehicles.find(v=>v.clubVisit);
 if(c){const t=c.clubVisit;
  if(c===PL.car||!c.alive){c.clubVisit=null;c.keep=false;if(c.mode==='clubVisit'){c.mode='phys';c.ai=null;c.sleep=false;}drive.next=simT+90;return;}
  if(t.wait>0){t.wait-=dt;c.vx=c.vz=c.fwd=0;return;}
  const q=t.points[t.i],dx=q[0]-c.x,dz=q[1]-c.z,dist=Math.hypot(dx,dz);
  if(dist<.35){t.i++;if(t.i===2&&!t.stopped){t.stopped=true;t.wait=10;}
   if(t.i>=t.points.length){c.mode='rail';c.rail=t.exit;c.ai=null;c.keep=false;c.clubVisit=null;railPose(c);drive.next=simT+80+R2()*80;}return;}
  const ux=dx/dist,uz=dz/dist,sp=Math.min(4,dist*2),step=Math.min(dist,sp*dt);
  const blocked=vehicles.some(v=>v!==c&&v.alive&&Math.hypot(v.x-(c.x+ux*3),v.z-(c.z+uz*3))<3)||(!PL.car&&Math.hypot(PL.x-(c.x+ux*3),PL.z-(c.z+uz*3))<1.5);
  if(blocked){c.vx=c.vz=c.fwd=0;return;}
  c.x+=ux*step;c.z+=uz*step;c.a+=clamp(Math.atan2(Math.sin(Math.atan2(uz,ux)-c.a),Math.cos(Math.atan2(uz,ux)-c.a)),-dt*2,dt*2);c.gy=0;c.sleep=false;c.vx=ux*sp;c.vz=uz*sp;c.fwd=sp;return;
 }
 if(simT<drive.next)return;drive.next=simT+5;
 const entry=drive.entry,exit=drive.exit;
 // Find a real lane beside the exit, so departure resumes on the traffic network.
 let best=null,bd=12;for(let d=0;d<4;d++){const kx=Math.round(exit[0]/P)-(d===2?0:d===0?1:0),kz=Math.round(exit[1]/P)-(d===3?0:d===1?1:0);
  if(!segExists(d===2?kx-1:kx,d===3?kz-1:kz,d%2))continue;
  for(let li=0;li<2;li++){const off=laneOff(kx,kz,d,li),[vx,vz]=D[d],u=clamp((exit[0]-kx*P)*vx+(exit[1]-kz*P)*vz,RW/2+2,SEG_END-2),x=kx*P+vx*u-vz*off,z=kz*P+vz*u+vx*off,dd=Math.hypot(x-exit[0],z-exit[1]);if(dd<bd){bd=dd;best={x,z,r:{kx,kz,d,li,s:u,nd:chooseNext(kx+vx,kz+vz,d),turn:null,v:3}};}}
 }
 if(!best)return;
 c=vehicles.find(v=>v.alive&&v.mode==='rail'&&!v.rail.turn&&!v.police&&!v.crim&&!v.t.boat&&v!==PL.car&&v.t.L<5.5&&Math.hypot(v.x-entry[0],v.z-entry[1])<5);
 if(!c)return;c.mode='clubVisit';c.rail=null;c.keep=true;c.sleep=false;c.ai=null;c.clubVisit={i:0,wait:0,points:[entry,drive.stop,exit,[best.x,best.z]],exit:best.r};drive.next=Infinity;
}
function parkingVisitorTick(dt){
 for(const c of listSnap(PARKV_SNAP,vehicles))if(c.tempPark&&c.alive&&c!==PL.car){const tp=c.tempPark;
  if(tp.phase==='arrive'){const dx=tp.slot.x-c.x,dz=tp.slot.z-c.z,dist=Math.hypot(dx,dz);if(dist<.28){c.x=tp.slot.x;c.z=tp.slot.z;c.a=tp.slot.a;c.vx=c.vz=c.fwd=c.w=0;c.sleep=true;tp.phase='parked';tp.leaveAt=simT+60}else{const sp=Math.min(7,Math.max(2.6,dist*2.4)),ux=dx/(dist||1),uz=dz/(dist||1);const step=Math.min(dist,sp*dt);c.x+=ux*step;c.z+=uz*step;c.a=Math.atan2(uz,ux);c.vx=ux*sp;c.vz=uz*sp;c.fwd=sp}}
  else if(tp.phase==='parked'){c.sleep=true;c.a=tp.slot.a;if(simT>=tp.leaveAt){tp.phase='fade';c.sleep=false}}
  else if(tp.phase==='fade'){parkFadeStep(c,dt);if(!vehicles.includes(c))tp.lot.nextVisit=simT+60+R2()*60}
 }
 if(!running||PL.inside||TIMEJUMP.busy||S.style==='inverted'||city.haze)return;
 PARKVIS.t-=dt;if(PARKVIS.t>0)return;PARKVIS.t=5+R2()*5;
 const active=vehicles.filter(v=>v.tempPark&&v.alive).length,cap=MOB_LITE?1:3;if(active>=cap)return;const p=PL.car||PL;
 const lots=(city.parkingLots||[]).filter(l=>l&&l.access&&l.slots&&l.slots.length&&Math.hypot((l.x0+l.x1)/2-p.x,(l.z0+l.z1)/2-p.z)<220);
 if(!lots.length)return;
 // Cada estacionamento tem seu relógio. Primeiro visitante só após >= 60s;
 // fica 60s na vaga e depois aguarda >=60s (até 120s) pelo seguinte.
 for(const l of lots)if(!Number.isFinite(l.nextVisit)){
  if(l.nextVisit===Infinity)continue; l.nextVisit=simT+60+R2()*60
 }
 const ready=lots.filter(l=>l.nextVisit<=simT&&!vehicles.some(v=>v.tempPark?.lot===l&&v.alive));
 if(!ready.length)return;
 const lot=ready[Math.floor(R2()*ready.length)];
 const slots=lot.slots.filter(q=>!vehicles.some(v=>v.alive&&((v.tempPark?.slot===q)||((v.sleep||v.spotId)&&Math.hypot(v.x-q.x,v.z-q.z)<1.1))));
 if(!slots.length){lot.nextVisit=simT+30+R2()*30;return}
 const slot=slots[Math.floor(R2()*slots.length)],type=pick(['sedan','hatch','wagon','suv','mini','pickup','roadster']);
 const v=makeVehicle(type,lot.access.x,lot.access.z,lot.access.a);v.mode='parking';v.rail=null;v.keep=true;v.hand=true;v.sleep=false;v.lightsOff=true;
 v.tempPark={lot,slot,phase:'arrive'};lot.nextVisit=Infinity;ensureDetail(v);if(v.g)syncCar(v,0)
}
function makeVehicle(type,x,z,a,color){const t=VT[type];const st=STYLES[S.style];
 if(type==='super')color='#92969d';
 if(!color)color=type==='taxi'?(st.synth?'#ffd21f':'#f2c21a'):type==='bus'?pick2(st.synth?['#ff4fa3','#33e6e6','#b388ff','#e8e8f0']:['#d9472b','#2a6ad6','#f2c21a','#e8e6e0']):pick2(st.carCols);
 const c={id:++vid,type,t,x,z,a,vx:0,vz:0,w:0,m:t.m,I:t.I,steer:0,steerT:0,thr:0,hand:false,fwd:0,hp:100,alive:true,ai:null,rail:null,mode:'phys',sleep:false,sleepT:0,
  ws:[0,0,0,0],wp:[[0,0],[0,0],[0,0],[0,0]],skid:[null,null,null,null],ax:0,az:0,roll:0,pitch:0,gy:0,spin:0,delta:0,g:null,
  color,icol:COL(color),cargo:type==='truck'?pick2(['#e8e6e0','#d0d4d8','#c9b48a','#8a9aa6']):'#ffffff',glow:COL(st.neon?pick2(st.neon):'#ffffff'),vmax:(type==='bus'?7:9)+R2()*5,hasGlow:R2()<.1,boom:R2()<.07,plate:randomPlate()};
 if(type==='bus')c.busDestination=BUS_DESTINATIONS[Math.floor(R2()*BUS_DESTINATIONS.length)];
 if(type==='taxi')c.taxiFreeLit=R2()<.60; // letreiros acesos/apagados sorteados no trânsito
 if(type==='truck')c.icol=COL(color).lerp(COL(c.cargo),.5);
 if(type==='police'){c.police=true;c.icol=COL('#ffffff');c.hasGlow=false;c.boom=false;c.vmax=11+R2()*3}
 /* v4 r35: carro que nasce na roça já vem com barro (20–100%); Math.random = seed intacta; garagem/save/conversível sobrescrevem c.grime depois */
 if(!t.boat&&!t.hover&&type!=='jetski'&&type!=='heli'&&isRural(x,z)){c.grime=.2+.8*Math.random();try{dirtApply(c)}catch(e){}}
 c.gy=groundY(x,z);vehicles.push(c);return c}
