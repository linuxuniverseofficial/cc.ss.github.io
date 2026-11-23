'use strict';
/* Coastal Chaos · js/26-pocas-monitor-bench.js — Asfalto molhado, MONITOR, debug de colisões, benchmark.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= ASFALTO MOLHADO / POÇAS COM REFLEXO ================= */
// Reflexo planar: a cena é renderizada por uma câmera espelhada (abaixo do chão) numa textura de meia resolução,
// e um plano fino sobre as ruas mostra essa textura onde o asfalto está molhado (mancha fraca) e nas poças (espelho forte).
const WET={mesh:null,rt:null,cam:new THREE.PerspectiveCamera(),grid:null,tex:null,G:64,t:0,max:0,
 clip:[new THREE.Plane(new THREE.Vector3(0,1,0),-.06)],tm:new THREE.Matrix4(),pm:new THREE.Matrix4(),fr:new THREE.Frustum(),bx:new THREE.Box3(),bias:new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1)};
function buildWet(st){if(WET.mesh){scene.remove(WET.mesh);WET.mesh.geometry.dispose();WET.mesh.material.dispose();if(WET.mesh2){scene.remove(WET.mesh2);WET.mesh2.material.dispose()}if(WET.mask)WET.mask.dispose()}
 const E=city.ext,S0=Math.ceil(E+MOFF*2);
 // máscara: R = asfalto (cor de rua no mapa), G = estrada de terra, B = calçada (cor de quarteirão no mapa)
 const rdC=cv(mapCv.width,mapCv.height),g0=rdC.getContext('2d',{willReadFrequently:true}),_cp=g0.drawImage(mapCv,0,0),src=g0.getImageData(0,0,mapCv.width,mapCv.height).data,mc=cv(mapCv.width,mapCv.height),mg=mc.getContext('2d'),out=mg.createImageData(mapCv.width,mapCv.height),o=out.data;
 const rc=new THREE.Color(st.map.road),rr0=Math.round(rc.r*255),rg0=Math.round(rc.g*255),rb0=Math.round(rc.b*255),dc=new THREE.Color(st.synth?'#5a4a4a':'#a88a5c'),dr=Math.round(dc.r*255),dg=Math.round(dc.g*255),db=Math.round(dc.b*255),sc=new THREE.Color(st.map.block),sr=Math.round(sc.r*255),sg=Math.round(sc.g*255),sb=Math.round(sc.b*255);
 for(let i=0;i<src.length;i+=4){const r=src[i],gg=src[i+1],b=src[i+2];o[i]=(Math.abs(r-rr0)<3&&Math.abs(gg-rg0)<3&&Math.abs(b-rb0)<3)?255:0;o[i+1]=(Math.abs(r-dr)<3&&Math.abs(gg-dg)<3&&Math.abs(b-db)<3)?255:0;o[i+2]=(Math.abs(r-sr)<3&&Math.abs(gg-sg)<3&&Math.abs(b-sb)<3)?255:0;o[i+3]=255}
 mg.putImageData(out,0,0);WET.maskData=o;WET.maskW=mapCv.width;WET.maskH=mapCv.height;WET.sz=S0;WET.mask=new THREE.CanvasTexture(mc);WET.mask.flipY=false;WET.mask.minFilter=THREE.LinearFilter;WET.mask.generateMipmaps=false;
 WET.grid=new Uint8Array(WET.G*WET.G*4);WET.tex=new THREE.DataTexture(WET.grid,WET.G,WET.G,THREE.RGBAFormat);WET.tex.magFilter=THREE.LinearFilter;WET.tex.minFilter=THREE.LinearFilter;WET.tex.needsUpdate=true;WET.wf=new Float32Array(WET.G*WET.G);WET.max=0;
 if(!WET.pud)WET.pud=wetPudTex();
 if(!WET.rt){WET.rt=new THREE.WebGLRenderTarget(16,16,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});WET.rt.texture.generateMipmaps=false}
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
  uniforms:{fake:{value:1},skyA:{value:new THREE.Color()},skyB:{value:new THREE.Color()},L:{value:WX.lights},LC:{value:WX.lcol},mask:{value:WET.mask},wetT:{value:WET.tex},pudT:{value:WET.pud},refl:{value:WET.rt.texture},tm:{value:WET.tm},time:{value:0},camP:{value:new THREE.Vector3()},camF:{value:new THREE.Vector3(0,-1,0)},camUp:{value:new THREE.Vector3(0,0,-1)},C:{value:CELLS_U},sz:{value:S0},off:{value:MOFF},fogN:{value:200},fogF:{value:900},on:{value:1},skyK:{value:1},nightK:{value:0},syn:{value:st.synth?1:0},roadOn:{value:1},fxK:SHFX.U.fxK,sunDir:skyMat.uniforms.sunDir,moonD:skyMat.uniforms.moonD,sunDim:skyMat.uniforms.sunDim,csSun:skyMat.uniforms.csSun},
  defines:{WALK:0,WET_LIGHTS:MOB_LITE?6:8},
  vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float fake;uniform vec3 skyA,skyB;uniform vec4 L[12];uniform vec3 LC[12];uniform sampler2D mask,wetT,refl,pudT;uniform mat4 tm;uniform float time,sz,off,fogN,fogF,on,skyK,nightK,syn,roadOn;uniform vec3 camP,camF,camUp;uniform vec4 C[6];varying vec3 vW;uniform vec4 fxK,moonD;uniform vec3 sunDir;uniform float sunDim,csSun;
  float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec3 dv=camP-vW;float dd=length(dv);if(dd>175.)discard;
   vec2 uv=(vW.xz+off)/sz;vec4 m=texture2D(mask,uv);
#if WALK
   float road=m.b;if(road<.05)discard;
#else
   float road=m.r*roadOn,dirt=m.g;if(road+dirt<.05)discard;
#endif
   vec4 wt=texture2D(wetT,uv);float w=wt.r;if(w<.02)discard;
   float n=texture2D(pudT,vW.xz/128.).r;float fog=(1.-smoothstep(fogN,fogF,dd))*(1.-smoothstep(130.,175.,dd));
#if WALK
   // calçada: só escurece e dá um brilho leve (sem espelho e sem gotas)
   float pud=smoothstep(.63-.12*w,.66-.12*w,n);float a=road*w*(.10+.22*pud)*fog*on;if(a<.004)discard;gl_FragColor=vec4(vec3(.05,.06,.08)+.10*pud,a);}
#else
   float th=.7-.12*w,pud=smoothstep(th,th+.03,n);
   // estrada de terra: poça de lama (mesmo padrão das poças da rua), sem reflexo; o miolo fundo fica mais escuro e opaco
   if(dirt>road){float deep=smoothstep(th,th+.16,n),aMud=dirt*pud*min(1.,w*1.4)*(.82+.16*deep)*fog;if(aMud<.004)discard;
    vec3 mc=mix(vec3(.50,.37,.23),vec3(.22,.14,.08),deep);if(syn>.5)mc*=vec3(.72,.66,.86);mc*=clamp(max(skyB.r,max(skyB.g,skyB.b))*1.35,.22,1.);gl_FragColor=vec4(mc,aMud);return;}
   float rh=wt.g;vec2 dist=vec2(0.);
   if(dd<25.){// gotas só perto da câmera
    vec2 cell=floor(vW.xz/.7),fc=fract(vW.xz/.7)-.5;float ph=fract(time*1.3+hh(cell)*7.);vec2 ctr=(vec2(hh(cell+3.1),hh(cell+7.7))-.5)*.5;
    float rd=length(fc-ctr);float ring=sin((rd-ph*.45)*55.)*smoothstep(.45,.0,abs(rd-ph*.45)*6.)*(1.-ph);
    dist=(fc-ctr)/max(rd,.001)*ring*.012*rh*step(hh(cell+1.3),.6)*(1.-dd/25.);}
   dist+=(texture2D(pudT,vW.xz/9.+vec2(time*.05,time*.04)).r-.5)*.008*(.4+rh);
   float vy=clamp(dv.y/dd,0.,1.),f1=1.-vy,f2=f1*f1,fr=.03+.97*f2*f2*f1;vec3 r;
   if(fake>.5){// reflexo falso: céu em gradiente + rastros verticais das luzes próximas (postes, faróis, semáforos, giroflex)
    r=mix(skyA,skyB,clamp(fr*1.3,0.,1.))*(.72+.2*n)*(.28+.72*skyK);// Orientacao da trilha em coordenadas da camera, nao radial ao carro.
    // TPS: perspectiva horizontal. Aerea: eixo vertical da imagem.
    // TPS: trilhas radiais em relacao ao veiculo/jogador, como na v32.
    // Top-down: trilhas alinhadas ao eixo vertical da camera, como na v33.
    vec2 carRadial=normalize(-dv.xz+vec2(1e-4));
    vec2 screenVertical=normalize(camUp.xz+vec2(1e-4));
    float aerial=smoothstep(.55,.94,abs(camF.y));
    vec2 vd=normalize(mix(carRadial,screenVertical,aerial)+vec2(1e-4));
    vec2 pp=vW.xz+dist*60.;
    for(int i=0;i<WET_LIGHTS;i++){vec4 l=L[i];if(l.y<-100.)continue;vec2 q=l.xz-pp;float al=dot(q,vd),pe=dot(q,vec2(-vd.y,vd.x));
     float s=exp(-pe*pe/(.10+.012*abs(al)))*exp(-max(0.,-al)*2.5)*exp(-max(0.,al)/(l.y*.4+.75))*l.w;r+=LC[i]*s*2.6;}
    /* v3 r25 (SHFX fxK.x): sol/lua refletidos (rastro esticado pela distorção das gotas) e, à noite, o brilho da cidade no horizonte do reflexo */
    if(fxK.x>.5){vec3 rv=normalize(vec3(-dv.x,dv.y,-dv.z));rv.xz+=dist*9.;rv=normalize(rv);vec3 sd=normalize(sunDir);
     float su=smoothstep(-.04,.08,sd.y)*sunDim*(1.-.85*csSun)*skyK;float gold=smoothstep(.02,.4,sd.y);float sdt=max(dot(rv,sd),0.);
     r+=mix(vec3(1.,.55,.25),vec3(1.,.95,.85),gold)*(pow(sdt,mix(90.,260.,gold))*3.+pow(sdt,12.)*.18)*su*mix(1.,.6,syn);
     vec3 md=normalize(moonD.xyz);float mdt=max(dot(rv,md),0.);r+=vec3(.75,.82,1.)*(pow(mdt,200.)*1.6+pow(mdt,20.)*.06)*smoothstep(-.04,.08,md.y)*nightK*(1.-syn)*skyK;
     r+=mix(vec3(1.,.62,.32),vec3(1.,.3,.7),syn)*.16*nightK*fr*(.6+.4*n);}}
   else{vec4 pr=tm*vec4(vW.x,0.,vW.z,1.);pr.xy+=dist*pr.w*mix(.5,1.,pud);r=texture2DProj(refl,pr).rgb*mix(.32+.68*skyK,1.,nightK);}
   float aRoad=road*w*(.1+.38*fr)*(1.-pud)+road*pud*min(1.,w*1.4)*(.6+.35*fr);
   vec3 col=r*mix(.75,1.,pud);
   float lum=max(col.r,max(col.g,col.b));float hot=max(lum-.45,0.);col+=max(col-.5,0.)*1.5;float a=clamp(aRoad*(1.+hot*4.),0.,.96)*fog*on;if(a<.004)discard;gl_FragColor=vec4(col,a);}
#endif
`});
 const geo=new THREE.PlaneGeometry(356,356);geo.rotateX(-Math.PI/2);bridgeVisualMaterial(mat,true);WET.mesh=new THREE.Mesh(geo,mat);WET.mesh.position.set(E/2,.018,E/2);/* acima do decalque da estrada de terra (.015), senão a lama ficava escondida */WET.mesh.renderOrder=2;WET.mesh.frustumCulled=false;WET.mesh.visible=false;scene.add(WET.mesh);
 // calçadas: segunda malha (mesma geometria e uniforms compartilhados) na altura da calçada, só pixels B da máscara
 const mat2=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,uniforms:mat.uniforms,defines:{WALK:1,WET_LIGHTS:MOB_LITE?6:8},vertexShader:mat.vertexShader,fragmentShader:mat.fragmentShader});
 WET.mesh2=new THREE.Mesh(geo,mat2);WET.mesh2.position.set(E/2,.212,E/2);WET.mesh2.renderOrder=2;WET.mesh2.frustumCulled=false;WET.mesh2.visible=false;scene.add(WET.mesh2)}
function wetPudTex(){const N=512,T=128,d=new Uint8Array(N*N*4);const H=(i,j,p,s)=>{i=((i%p)+p)%p;j=((j%p)+p)%p;const v=Math.sin(i*127.1+j*311.7+s*17.3)*43758.5453;return v-Math.floor(v)};
 const vn=(x,y,p,s)=>{const i=Math.floor(x),j=Math.floor(y);let fx=x-i,fy=y-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=H(i,j,p,s),b=H(i+1,j,p,s),c=H(i,j+1,p,s),e=H(i+1,j+1,p,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+e)*fx*fy};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;const n=vn(u*12,v*12,12,1)*.6+vn(u*40,v*40,40,2)*.3+vn(u*166,v*166,166,3)*.1;const o=(y*N+x)*4;d[o]=d[o+1]=d[o+2]=Math.round(n*255);d[o+3]=255}
 const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;t.needsUpdate=true;WET.pudT=T;WET.pudData=d;WET.pudN=N;return t}
function stormCalmStart(cheat){WX.calm=cheat?30:30*GMIN;WX.postClear=null;WX.freeze=true;WX.cheatStorm=!!cheat;WX.stormNext=null;
 for(const c of CELLS){if(c.storm)continue;if(c.wait>0){c.dead=true;continue}c.life=Math.min(c.life,c.age)}WX.fairTg=0;WX.fairT=simT+60*GMIN}
// tempestade natural: cada seed tem a sua chance; antes dela o céu fica estranhamente limpo e só então vem a previsão
function stormTick(dt){if(!city.ext||!played||TVM.on)return;if(WX.stormChance===undefined){const sr=mulberry32((S.seed^0x3e5f7a91)>>>0);sr();WX.stormChance=city.haze?.8:Math.pow(sr(),1.4)}
 const busy=!!WX.stormCell||WX.stormEta!=null||WX.calm!=null;
 if(!busy&&!netWxFollow()){if(WX.stormRoll==null)WX.stormRoll=(180+Math.random()*420)*GMIN;WX.stormRoll-=dt;if(WX.stormRoll<=0){WX.stormRoll=(300+Math.random()*600)*GMIN;if(Math.random()<WX.stormChance)stormCalmStart(false)}}
 if(WX.freeze){WX.fairTg=0;WX.fairT=simT+60*GMIN;WX.fair=Math.max(0,(WX.fair||0)-dt*.035*(WX.cheatStorm?1:1/GMIN))}
 if(WX.postClear!=null){WX.postClear-=dt;WX.fair=0;if(WX.postClear<=0){WX.postClear=null;WX.freeze=false;WX.cellT=.001}}
 if(WX.calm!=null){if(CELLS.some(c=>!c.dead&&(c.s>.001||c.wait>0))||(WX.fair||0)>.001){WX.calm=WX.cheatStorm?30:30*GMIN}else WX.calm-=dt;if(WX.calm<=0){WX.calm=null;if(WX.cheatStorm){WX.stormEta=25;WX.stormMsg=25;WX.stormDir=Math.random()*6.283;wxToast('PREVISÃO DO TEMPO: TEMPESTADE CHEGANDO','vindo do '+dirName(Math.cos(WX.stormDir),Math.sin(WX.stormDir)).toLowerCase()+'')}else WX.stormReq=true}}}
function stepWet(dt){if(!WET.grid||!city.ext)return;WET.t-=dt;if(WET.t>0)return;const st=.5;WET.t=st;const G=WET.G,E=city.ext,S0=E+MOFF*2;let mx=0;
 for(let j=0;j<G;j++)for(let i=0;i<G;i++){const k=j*G+i,x=(i+.5)/G*S0-MOFF,z=(j+.5)/G*S0-MOFF;const r=CELLS.length?rainAt(x,z):0;let w=WET.wf[k];
  if(r>.25)w=Math.min(1,w+r*st/22);else w=Math.max(0,w-st/(DN.nightF>.5?95:60)*(w<.25?1.6:1));WET.wf[k]=w;WET.grid[k*4]=w*255;WET.grid[k*4+1]=Math.min(1,r)*255;if(w>mx)mx=w}
 WET.max=mx;WET.tex.needsUpdate=true}
// v270: atenuação da reflexão da fonte celestial (sol/lua) pela cobertura.
// NÃO altera luzes artificiais, normal maps, SpriteMaterial ou shader dos personagens.
function skyReflectionVisibility(){
 const wet=clamp(WX.f||0,0,1),dark=clamp(WX.gloom||0,0,1);
 const cover=Math.max(wet*.76,dark*.94);
 const fair=clamp(WX.fair||0,0,1)*.12;
 return clamp((1-cover)*(1-fair)*(1-.18*clamp(WX.ind||0,0,1)),.10,1);
}
// Com o reflexo desligado, a malha continua só para a lama das estradas de terra (as poças da rua e da calçada somem como antes).
function renderReflection(){const m=WET.mesh;if(!m)return;const cp=camera.position,inRange=Math.abs(cp.y-.1)<=175.5,refl=S.refl!==false,on=WET.max>.02&&(!PL.inside||TVM.on)&&!NAV.open&&!city.haze; /* v78: Point Haze tem relevo — plano plano de chuva atravessaria os morros e marcava a grade das ruas */m.visible=on&&inRange;if(WET.mesh2)WET.mesh2.visible=on&&refl&&inRange;
 // Filmes das folhas acompanham a visibilidade da película de chuva global.
 if(city.dbs)for(const d of city.dbs)if(d.wetSurfaces)for(const film of d.wetSurfaces)film.visible=on;
 if(!on)return;
 if(inRange){m.position.x=cp.x;m.position.z=cp.z;if(WET.mesh2){WET.mesh2.position.x=cp.x;WET.mesh2.position.z=cp.z}}
 const u=m.material.uniforms;u.roadOn.value=refl?1:0;u.time.value=simT;u.camP.value.copy(cp);
 camera.getWorldDirection(u.camF.value);
 u.camUp.value.set(0,1,0).applyQuaternion(camera.quaternion);
 u.on.value=.5*(city.st.night?1:.48+.52*Math.max(DN.nightF||0,clamp((WX.f||0)*1.6,0,1)));u.skyK.value=skyReflectionVisibility();u.nightK.value=DN.nightF||0;if(scene.fog){u.fogN.value=scene.fog.near*.9;u.fogF.value=scene.fog.far*.95}
 u.fake.value=WET.fake===false?0:1;u.skyA.value.copy(skyMat.uniforms.top.value).multiplyScalar(.8);u.skyB.value.copy(skyMat.uniforms.hor.value).multiplyScalar(.8);if(u.fake.value||!refl||!inRange)return;
 const sz=renderer.getDrawingBufferSize(WET.v2||(WET.v2=new THREE.Vector2())),q=camMode==='top'?.3:.36,w=Math.max(64,Math.floor(sz.x*q)),h=Math.max(64,Math.floor(sz.y*q));if(WET.rt.width!==w||WET.rt.height!==h)WET.rt.setSize(w,h);
 const c=WET.cam;camera.updateMatrixWorld();c.fov=camera.fov;c.aspect=camera.aspect;c.near=camera.near;c.far=camera.far;c.updateProjectionMatrix();
 const fw=(WET._fw||(WET._fw=new THREE.Vector3()));camera.getWorldDirection(fw);const up=(WET._up||(WET._up=new THREE.Vector3())).set(0,1,0).applyQuaternion(camera.quaternion);
 c.position.set(cp.x,-cp.y,cp.z);c.up.set(up.x,-up.y,up.z);c.lookAt(cp.x+fw.x,-(cp.y+fw.y),cp.z+fw.z);c.updateMatrixWorld();
 WET.tm.copy(WET.bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
 const sp=sky.position.clone(),sm=renderer.shadowMap.autoUpdate,rv=rain.visible;sky.position.copy(c.position);m.visible=false;if(WET.mesh2)WET.mesh2.visible=false;
 // Reflexo planar não deve enxergar a própria película (evita realimentação).
 for(const d of city.dbs||[])for(const film of d.wetSurfaces||[])film.visible=false;
 renderer.shadowMap.autoUpdate=false;rain.visible=false;
 // culling dos chunks: a câmera principal esconde chunks fora da tela, mas o reflexo mostra o que está acima/atrás -> união com o frustum espelhado
 WET.pm.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);WET.fr.setFromProjectionMatrix(WET.pm);
 if(city.chunks)for(const ch of city.chunks.values()){const dd=Math.hypot(Math.max(ch.x0-cp.x,0,cp.x-ch.x1),Math.max(ch.z0-cp.z,0,cp.z-ch.z1));if(dd>80){ch.group.visible=false;continue}if(ch.group.visible)continue;WET.bx.min.set(ch.x0-12,-5,ch.z0-12);WET.bx.max.set(ch.x1+12,(ch.y1||60)+8,ch.z1+12);if(WET.fr.intersectsBox(WET.bx))ch.group.visible=true}
 renderer.clippingPlanes=WET.clip;renderer.setRenderTarget(WET.rt);const cc0=renderer.getClearColor(WET.cc||(WET.cc=new THREE.Color())).clone(),ca0=renderer.getClearAlpha();renderer.setClearColor(skyMat.uniforms.hor.value.clone().lerp(skyMat.uniforms.top.value,.5).multiplyScalar(.8),1);renderer.clear();renderer.render(scene,c);renderer.setRenderTarget(null);renderer.setClearColor(cc0,ca0);renderer.clippingPlanes=[];
 if(city.chunks)cullChunks();
 sky.position.copy(sp);renderer.shadowMap.autoUpdate=sm;rain.visible=rv;m.visible=true;if(WET.mesh2)WET.mesh2.visible=true;
 for(const d of city.dbs||[])for(const film of d.wetSurfaces||[])film.visible=on}

/* ================= MONITOR (desempenho desta aba) ================= */
// O navegador não expõe o uso real de CPU/GPU/RAM de uma aba. Medimos de dentro do jogo:
//  CPU = tempo de JS+envio de desenho por quadro / intervalo entre quadros (thread principal);
//  GPU = tempo da placa por quadro via EXT_disjoint_timer_query_webgl2 (quando o navegador libera);
//  RAM = heap JavaScript (performance.memory, Chrome/Edge); VRAM = estimativa de malhas + texturas + buffers.
const PERF={traffic:0,peds:0,frames:0,skipFarCollision:0,rainHits:0};
const MON={on:false,last:0,acc:{n:0,busy:0,iv:0},gpu:{ext:null,tried:false,q:[],act:null,ms:0,n:0,sum:0,ok:false},vram:0,vT:0,t:0,cpu:0,fps:0,fms:0,coords:''};
function monSeedRefresh(){const v=Number.isFinite(S.seed)?String(S.seed>>>0):'';$('#mSeedVal').textContent=v?'SEED: '+v:'SEED: --';$('#mSeedCopy').disabled=!v}
/* v78: TELA CHEIA no menu inicial (PC): Fullscreen API no documento todo (como F11, mas sai com Esc); o texto acompanha o estado */
{const fb=$('#fsBtn');if(fb){const can=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen),pc=!(matchMedia('(pointer:coarse)').matches);
 const sync=()=>{const on=!!(document.fullscreenElement||document.webkitFullscreenElement);fb.textContent=on?'SAIR DA TELA CHEIA':'TELA CHEIA'};
 fb.hidden=!(can&&pc);sync();document.addEventListener('fullscreenchange',sync);document.addEventListener('webkitfullscreenchange',sync);
 fb.addEventListener('click',()=>{const d=document,el=d.documentElement;try{if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);else{const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);if(r&&r.catch)r.catch(()=>{})}}catch(e){}});
 const ia=$('#installApp');if(ia)fb.classList.toggle('half',!ia.hidden)}}
/* v78: monitor flutuante — arrasta SÓ pela barra de título (PC e toque); um toque/clique sem arrastar recolhe/expande.
   Posição guardada em ps_mon_pos e sempre mantida dentro da tela. */
function monClampPos(){const m=$('#mon');if(!m||!m.style.left)return;const touch=document.body.classList.contains('touch');m.style.maxHeight='';const r=m.getBoundingClientRect(),hh=m.querySelector('.mh').getBoundingClientRect().height||30;
 const x=clamp(r.left,0,Math.max(0,innerWidth-r.width));let y=clamp(r.top,0,Math.max(0,innerHeight-hh));
 if(!touch)y=clamp(y,0,Math.max(0,innerHeight-r.height)); /* PC: a janela inteira cabe na tela */
 m.style.left=x+'px';m.style.top=y+'px';if(touch)m.style.maxHeight=Math.max(hh+20,innerHeight-y-8)+'px' /* toque: rola no espaço que sobra abaixo */}
{const m=$('#mon'),h=m&&m.querySelector('.mh');
 try{const q=JSON.parse(localStorage.getItem('ps_mon_pos')||'null');if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y)){m.style.left=q.x+'px';m.style.top=q.y+'px';m.classList.add('moved')}}catch(e){}
 let D=null;
 if(h){h.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();e.stopPropagation();const r=m.getBoundingClientRect();D={id:e.pointerId,x0:e.clientX,y0:e.clientY,l:r.left,t:r.top,moved:false};try{h.setPointerCapture(e.pointerId)}catch(_){}});
  h.addEventListener('pointermove',e=>{if(!D||e.pointerId!==D.id)return;e.preventDefault();const dx=e.clientX-D.x0,dy=e.clientY-D.y0;if(!D.moved&&Math.hypot(dx,dy)<6)return;D.moved=true;m.classList.add('moved','dragging');m.style.left=(D.l+dx)+'px';m.style.top=(D.t+dy)+'px';monClampPos()});
  const up=e=>{if(!D||e.pointerId!==D.id)return;e.stopPropagation();const was=D.moved;D=null;m.classList.remove('dragging');
   if(was){try{const r=m.getBoundingClientRect();localStorage.setItem('ps_mon_pos',JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)}))}catch(_){}}
   else{m.classList.toggle('mini');try{localStorage.setItem('ps_mon_mini',m.classList.contains('mini')?'1':'0')}catch(_){}try{monClampPos()}catch(_){}}};
  h.addEventListener('pointerup',up);h.addEventListener('pointercancel',e=>{if(D&&e.pointerId===D.id){D=null;m.classList.remove('dragging')}});
  h.addEventListener('dblclick',e=>{e.preventDefault();m.style.left=m.style.top='';m.classList.remove('moved');try{localStorage.removeItem('ps_mon_pos')}catch(_){}});}
 addEventListener('resize',()=>{try{monClampPos()}catch(_){}});}
function monSet(on){try{if(on&&localStorage.getItem('ps_mon_mini')==='1')$('#mon').classList.add('mini')}catch(e){}if(on)requestAnimationFrame(()=>{try{monClampPos()}catch(e){}});MON.on=on;$('#mon').hidden=!on;monSeedRefresh();monStoryShiftSync();const b=$('#monBtn');b.textContent='MONITOR';b.classList.toggle('monitor-on',!!on);b.setAttribute('aria-pressed',on?'true':'false');renderer.info.autoReset=!on;try{localStorage.setItem('ps_mon',on?'1':'0')}catch(e){}}
// Reutiliza a cópia das coordenadas para a seed (HTTPS e fallback HTTP).
// Copia SOMENTE o valor, sem rótulos ou formatação.
async function monCopyText(txt,button,originalTitle){if(!txt)return;
 let ok=false;
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(txt);ok=true}}catch(err){}
 if(!ok){const t=document.createElement('textarea');t.value=txt;t.readOnly=true;t.style.cssText='position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';document.body.appendChild(t);
  try{t.focus();t.select();ok=!!document.execCommand('copy')}catch(err){}finally{t.remove()}}
 button.textContent=ok?'COPIADO':'ERRO AO COPIAR';button.title=ok?'Copiado':'O navegador bloqueou a cópia';
 setTimeout(()=>{button.textContent='COPIAR';button.title=originalTitle},1500);
}
$('#mCoordCopy').addEventListener('click',e=>{e.stopPropagation();void monCopyText(MON.coords,$('#mCoordCopy'),'Copiar X,Y,Z')});
/* v79r19: debug — cola "X,Y,Z" (o mesmo texto do COPIAR) ou "X,Z" e teleporta. Conta como cheat de teleporte: desativa o save. */
function monTeleport(){const el=$('#mTpIn'),n=(String(el.value||'').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
 if(!played||n.length<2||!n.every(Number.isFinite)){toast('TELEPORT · USE X,Y,Z OU X,Z');return}
 const x=n[0],z=n.length>=3?n[2]:n[1];{const ev=eventLock();if(ev){toast('TELEPORT BLOQUEADO · '+ev);return}}
 if(SKATE.ride)skDismount(false);CHEAT.used=true;try{syncSave()}catch(e){}cheatWarp(x,z);el.blur();toast('TELEPORT · '+x.toFixed(2)+', '+z.toFixed(2)+'<br><small style="font-size:11px;color:#fff">cheat: save desativado</small>')}
$('#mTpGo').addEventListener('click',e=>{e.stopPropagation();monTeleport()});
/* v79r21: o monitor tem pointer-events:none (só os botões recebiam clique) — o campo não pegava foco nem Ctrl+V. Agora recebe; e COLAR lê a área de transferência */
$('#mTpPaste').addEventListener('click',async e=>{e.stopPropagation();const el=$('#mTpIn');let t='';try{if(navigator.clipboard&&navigator.clipboard.readText)t=await navigator.clipboard.readText()}catch(err){}
 if(t){el.value=t.trim().slice(0,80);el.focus()}else{el.focus();el.select();toast(translatePlain('O NAVEGADOR BLOQUEOU A LEITURA')+'<br><small style="font-size:11px;color:#fff">'+translatePlain('clique no campo e use Ctrl+V')+'</small>')}});
$('#mTpIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();monTeleport()}});
for(const ev of ['keyup','pointerdown','click'])$('#mTpIn').addEventListener(ev,e=>e.stopPropagation());
/* v78 · EXPORTAR .GLB (debug, F3): a cena GERADA vira um .glb para abrir no editor do three.js ou no Blender.
   Peso zero no jogo: o GLTFExporter (r128, mesmo CDN do three) só é baixado no 1º clique. Só geometria + cores/texturas:
   materiais viram MeshStandardMaterial simples, InstancedMesh vira malha mesclada, sprites/partículas/céu ficam de fora. */
const GLB={busy:false};
function glbLoadExporter(){if(THREE.GLTFExporter)return Promise.resolve();return new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='lib/three/exporters/GLTFExporter.js';sc.onload=()=>THREE.GLTFExporter?ok():no(new Error('GLTFExporter ausente'));sc.onerror=()=>no(new Error('sem rede para baixar o exportador'));document.head.appendChild(sc)})}
function glbMat(m,cache,geo,inside){const hasUV=!!(geo&&geo.attributes.uv),hasC=!!(geo&&geo.attributes.color),glow=m.blending===THREE.AdditiveBlending||m.toneMapped===false,hooked=m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile,inBasic=!!inside&&!!m.isMeshBasicMaterial&&!glow&&hooked, /* Basic COM shader de luz próprio (mallMat/roomLit) = superfície iluminada pelo jogo → Standard; Basic puro (neon, letreiro) = emissivo de verdade → unlit */ck=m.uuid+(hasUV?'u':'')+(hasC?'c':'')+(inBasic?'i':'');if(cache.has(ck))return cache.get(ck);
 const imgOk=t=>!!(t&&t.image&&(t.image instanceof HTMLCanvasElement||t.image instanceof HTMLImageElement||(typeof ImageBitmap!=='undefined'&&t.image instanceof ImageBitmap)));
 const okMap=hasUV&&m.map&&imgOk(m.map),okEm=hasUV&&m.emissiveMap&&imgOk(m.emissiveMap);let n;
 if(m.isMeshBasicMaterial&&!inBasic){ /* v78: Basic = sem luz (neon, letreiro, halo): sai como KHR_materials_unlit (o Blender importa como emissão pura); antes virava Standard apagado */
  n=new THREE.MeshBasicMaterial({color:m.color?m.color.clone():new THREE.Color(1,1,1),map:okMap?m.map:null,vertexColors:!!m.vertexColors&&hasC,transparent:!!m.transparent||m.blending===THREE.AdditiveBlending,opacity:m.opacity??1,side:m.side??THREE.FrontSide,alphaTest:m.alphaTest||0,depthWrite:m.blending===THREE.AdditiveBlending?false:m.depthWrite!==false})}
 else{
  /* v78: emissão de volta. Regra: se o material tem emissiveMap (janelas acesas, letreiros pintados), exporta o MAPA com emissive branco; sem mapa válido, só exporta a cor
     emissive se o original não dependia de mapa (cor branca sem mapa estourava prédios inteiros). A intensidade do jogo (0 de dia, 1,25 de noite) é ignorada nos mapas: a luz vai sempre acesa. */
  let em=new THREE.Color(0),emI=1,emMap=null;
  if(m.emissiveMap){if(okEm){em=new THREE.Color(1,1,1);emMap=m.emissiveMap}}
  else if(m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>0){em=m.emissive.clone();emI=Math.max(m.emissiveIntensity??1,0)||0}
  /* v78: interior (mall etc.) usa Basic + iluminação própria no shader; unlit no Blender saía estourado. Vira Standard (recebe luz do Blender) com 30% de auto-iluminação pela própria textura, pra nunca ficar preto sem luzes */
  if(inBasic&&okMap){em=new THREE.Color(.3,.3,.3);emMap=m.map}
  /* v78: glTF exige emissiveFactor 0..1 e o GLTFExporter r128 grava emissive×intensidade sem limitar (LED da bomba: 2,1) → excesso vai para emissiveStrength */
  let emS=0;{const f=Math.max(em.r,em.g,em.b)*emI;if(f>1){em.multiplyScalar(emI/f);emI=1;emS=f}}
  n=new THREE.MeshStandardMaterial({color:m.color?m.color.clone():new THREE.Color(1,1,1),map:okMap?m.map:null,vertexColors:!!m.vertexColors&&hasC,transparent:!!m.transparent,opacity:m.opacity??1,side:m.side??THREE.FrontSide,alphaTest:m.alphaTest||0,roughness:m.roughness??.9,metalness:m.metalness??0,emissive:em,emissiveMap:emMap,emissiveIntensity:emI});if(emS)n.userData={emissiveStrength:+emS.toFixed(3)}}
 n.name=m.name||m.type;cache.set(ck,n);return n}
function glbGeo(g,M){const src=g.index?g.toNonIndexed():g,out=new THREE.BufferGeometry();for(const k of ['position','normal','color','uv']){const a=src.attributes[k];if(a){let arr;if(a.isInterleavedBufferAttribute){arr=new Float32Array(a.count*a.itemSize);for(let i=0;i<a.count;i++){arr[i*a.itemSize]=a.getX(i);if(a.itemSize>1)arr[i*a.itemSize+1]=a.getY(i);if(a.itemSize>2)arr[i*a.itemSize+2]=a.getZ(i);if(a.itemSize>3)arr[i*a.itemSize+3]=a.getW(i)}}else if(a.array instanceof Float32Array)arr=a.array.slice();else{const d=a.normalized?(a.array instanceof Uint8Array?255:a.array instanceof Uint16Array?65535:a.array instanceof Int8Array?127:a.array instanceof Int16Array?32767:1):1;arr=new Float32Array(a.array.length);for(let i=0;i<arr.length;i++)arr[i]=a.array[i]/d}if(k==='color'&&a.itemSize===4){const c3=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){c3[i*3]=arr[i*4];c3[i*3+1]=arr[i*4+1];c3[i*3+2]=arr[i*4+2]}out.setAttribute(k,new THREE.BufferAttribute(c3,3))}else out.setAttribute(k,new THREE.BufferAttribute(arr,a.itemSize))}}if(M)out.applyMatrix4(M);if(src!==g)src.dispose();return out}
function glbClean(g){if(!g)return g;for(const k in g.attributes){const a=g.attributes[k],A=a.array;if(!(A instanceof Float32Array))continue;let bad=false;for(let i=0;i<A.length;i++)if(!Number.isFinite(A[i])){A[i]=0;bad=true}
 if(k==='normal'){for(let i=0;i<A.length;i+=3){const l=Math.hypot(A[i],A[i+1],A[i+2]);if(l<1e-6){A[i]=0;A[i+1]=1;A[i+2]=0}else if(Math.abs(l-1)>1e-3){A[i]/=l;A[i+1]/=l;A[i+2]/=l}}}
 if(k==='color'){for(let i=0;i<A.length;i++)A[i]=Math.min(1,Math.max(0,A[i]))}}return g} // v78: o glTF não aceita NaN/Infinity (o Blender recusava o arquivo); normais unitárias, cores 0..1
function glbMergeInst(im,near){const g=im.geometry,M=new THREE.Matrix4(),W=new THREE.Matrix4(),parts=[];for(let i=0;i<im.count;i++){im.getMatrixAt(i,M);if(Math.abs(M.determinant())<1e-9)continue;W.multiplyMatrices(im.matrixWorld,M);if(near&&Math.hypot(W.elements[12]-near.x,W.elements[14]-near.z)>near.r)continue;parts.push(glbGeo(g,W))}if(!parts.length)return null;
 const keys=['position','normal','color','uv'].filter(k=>parts.every(p=>p.attributes[k])),out=new THREE.BufferGeometry();for(const k of keys){const sz=parts[0].attributes[k].itemSize,tot=parts.reduce((a,p)=>a+p.attributes[k].array.length,0),arr=new Float32Array(tot);let o=0;const nz=parts[0].attributes[k].normalized&&!(parts[0].attributes[k].array instanceof Float32Array);for(const p of parts){const A=p.attributes[k].array;if(nz){const d=A instanceof Uint8Array?255:A instanceof Uint16Array?65535:1;for(let i=0;i<A.length;i++)arr[o+i]=A[i]/d}else arr.set(A,o);o+=A.length}out.setAttribute(k,new THREE.BufferAttribute(arr,sz))}parts.forEach(p=>p.dispose());return out}
/* v78: neon do interior = BARRA emissiva (não pontos de luz). O glTF não tem luz de área, então a malha neon (Basic puro, cor por vértice) é separada por matiz em malhas Standard com emissive = matiz (máx. 1) e extras.emissiveStrength; glbPatchEmissive() converte isso em KHR_materials_emissive_strength no .glb (o Blender importa como Emission Strength). */
const GLB_NEON_STRENGTH=25;
function glbSplitNeon(geo){const P=geo.attributes.position,C=geo.attributes.color,N=geo.attributes.normal,I=geo.index,tri=Math.floor((I?I.count:P.count)/3),gi=(t,k)=>I?I.getX(t*3+k):t*3+k,grp=new Map(),rest=[];
 for(let t=0;t<tri;t++){const a=gi(t,0),r=C.getX(a),g=C.getY(a),b=C.getZ(a),mx=Math.max(r,g,b);if(mx<.55){rest.push(t);continue}const sc=1/mx,key=Math.round(r*sc*7)+','+Math.round(g*sc*7)+','+Math.round(b*sc*7);let o=grp.get(key);if(!o)grp.set(key,o={ts:[],c:new THREE.Color(r*sc,g*sc,b*sc),br:0});o.ts.push(t);o.br+=mx}
 const build=ts=>{const g2=new THREE.BufferGeometry(),pos=new Float32Array(ts.length*9),nor=N?new Float32Array(ts.length*9):null,col=new Float32Array(ts.length*9);let o=0;
  for(const t of ts)for(let k=0;k<3;k++){const v=gi(t,k);pos[o]=P.getX(v);pos[o+1]=P.getY(v);pos[o+2]=P.getZ(v);if(nor){nor[o]=N.getX(v);nor[o+1]=N.getY(v);nor[o+2]=N.getZ(v)}col[o]=C.getX(v);col[o+1]=C.getY(v);col[o+2]=C.getZ(v);o+=3}
  g2.setAttribute('position',new THREE.BufferAttribute(pos,3));if(nor)g2.setAttribute('normal',new THREE.BufferAttribute(nor,3));g2.setAttribute('color',new THREE.BufferAttribute(col,3));return g2};
 return {bars:[...grp.values()].map(o=>({geo:build(o.ts),color:o.c,br:o.br/o.ts.length})),rest:rest.length?build(rest):null}}
function glbPatchEmissive(buf){try{const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x46546C67)return buf;const jl=dv.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl)));let n=0;
 for(const m of j.materials||[]){const k=m.extras&&m.extras.emissiveStrength;if(k){(m.extensions=m.extensions||{}).KHR_materials_emissive_strength={emissiveStrength:k};delete m.extras.emissiveStrength;if(!Object.keys(m.extras).length)delete m.extras;n++}}
 if(!n)return buf;j.extensionsUsed=[...new Set([...(j.extensionsUsed||[]),'KHR_materials_emissive_strength'])];const t=new TextEncoder().encode(JSON.stringify(j)),pad=(4-t.length%4)%4,jb=new Uint8Array(t.length+pad);jb.fill(32);jb.set(t);
 const rest=new Uint8Array(buf,20+jl),out=new Uint8Array(20+jb.length+rest.length),o=new DataView(out.buffer);o.setUint32(0,0x46546C67,true);o.setUint32(4,2,true);o.setUint32(8,out.length,true);o.setUint32(12,jb.length,true);o.setUint32(16,0x4E4F534A,true);out.set(jb,20);out.set(rest,20+jb.length);return out.buffer}catch(e){console.warn('[glb emissive]',e);return buf}}
/* v78: luzes no .GLB (KHR_lights_punctual). Sol = direcional do jogo (lux = 2049 × intensidade → força ~3 no Blender); postes = pontuais quentes na cabeça de cada poste (até 300, os mais próximos do jogador); PointLights de cena com intensidade > 0 (interiores) também. Unidades glTF: candela (pontual) / lux (sol). */
function glbLights(mode,pc,root,R){const out=[],M4=new THREE.Matrix4(),V=new THREE.Vector3(),CD=8000;
 try{
  if(mode!=='inside'&&typeof sun!=='undefined'&&sun&&sun.intensity>.02){const d=new THREE.DirectionalLight(sun.color.clone(),2049*Math.min(sun.intensity,2));d.name='sol';d.add(d.target);d.target.position.set(0,0,-1);
   const v=sun.position.clone().sub(sun.target.position);if(v.lengthSq()>1e-6)d.lookAt(v.negate()); /* em luz, lookAt aponta o -Z local para o alvo; a luz viaja do sol para o chão (-v) */root.add(d);out.push(d)}
  if(mode!=='inside'&&city&&city.chunks){const hg=city.M&&city.M.headGeo;let HC=new THREE.Vector3(0,0,0);if(hg){hg.computeBoundingBox();hg.boundingBox.getCenter(HC)}const c=[];
   for(const ch of city.chunks.values())for(const l of ch.lamps||[]){if(l.broken)continue;let x=l.x,y=6,z=l.z;
    try{const IM=ch.lampIM;if(IM&&IM.head){IM.head.getMatrixAt(l.i,M4);V.copy(HC).applyMatrix4(M4).applyMatrix4(IM.head.matrixWorld);if(Number.isFinite(V.x+V.y+V.z)){x=V.x;y=V.y;z=V.z}}}catch(e){}
    const dd=Math.hypot(x-pc.x,z-pc.z);if(mode==='area'&&dd>R+20)continue;c.push({x,y,z,dd})}
   c.sort((a,b)=>a.dd-b.dd);for(const q of c.slice(0,300)){const L=new THREE.PointLight(0xffc477,CD,0,2);L.position.set(q.x,q.y-.3,q.z);L.name='poste';root.add(L);out.push(L)}}
  /* v78: interior sem luz própria (mall, cassino, danceteria: a luz do jogo é shader) → luzes de preenchimento no teto, uma por célula de 10 m que tem chão, na altura do forro (face de baixo mais alta até 9 m). Cor/intensidade seguem o dia/noite do jogo (mall: paleta uDay). Selecione todas as luzes no Blender e ajuste "Power" pra calibrar. */
  if(mode==='inside'){const CELL=10,cells=new Map(),ys={},PY=Number.isFinite(pc.gy)?pc.gy:(Number.isFinite(pc.y)?pc.y:0),MALLON=(()=>{try{return !!(MALL&&MALL.grp&&MALL.grp.visible)}catch(e){return false}})();let nv=0; /* shopping: mantém o cálculo antigo (aprovado) */ /* v78: piso = altura do jogador (pc.y não existe → antes contava o topo das paredes como piso) */
   for(const me of root.children){const g=me.geometry;if(!g||!g.attributes.position||!g.attributes.normal)continue;const P=g.attributes.position.array,N=g.attributes.normal.array;
    for(let i=0;i<P.length;i+=3){const dx=P[i]-pc.x,dz=P[i+2]-pc.z;if(dx*dx+dz*dz>6400||(!MALLON&&Math.abs(P[i+1]-PY)>1.2))continue;if(N[i+1]>.9){const k=Math.round(P[i+1]*20)/20;ys[k]=(ys[k]||0)+1}}}
   let fy=MALLON?0:PY,best=0;for(const k in ys)if(ys[k]>best){best=ys[k];fy=+k}
   for(const me of root.children){const g=me.geometry;if(!g||!g.attributes.position||!g.attributes.normal)continue;const P=g.attributes.position.array,N=g.attributes.normal.array;
    for(let i=0;i<P.length;i+=3){const x=P[i],y=P[i+1],z=P[i+2],dx=x-pc.x,dz=z-pc.z;if(dx*dx+dz*dz>6400)continue;const ny=N[i+1];
     if(ny>.9&&Math.abs(y-fy)<.12){const key=Math.floor(x/CELL)+','+Math.floor(z/CELL);let c=cells.get(key);if(!c)cells.set(key,c={sx:0,sz:0,n:0,cy:-1e9});c.sx+=x;c.sz+=z;c.n++}
     else if(ny<-.9&&y>fy+2&&y<fy+9){const key=Math.floor(x/CELL)+','+Math.floor(z/CELL);let c=cells.get(key);if(!c)cells.set(key,c={sx:0,sz:0,n:0,cy:-1e9});if(y>c.cy)c.cy=y}}}
   let TOPY=-1e9;for(const me of root.children){const g=me.geometry;if(!g||!g.attributes.position)continue;const P=g.attributes.position.array;for(let i=0;i<P.length;i+=3){const dx=P[i]-pc.x,dz=P[i+2]-pc.z;if(dx*dx+dz*dz<6400&&P[i+1]>TOPY&&P[i+1]<fy+12)TOPY=P[i+1]}}if(TOPY<fy+2.5)TOPY=fy+3.5;
   let col=new THREE.Color(0xfff1dc),I=12000;try{if(typeof MALL_LU!=='undefined'&&MALL&&MALL.grp&&MALL.grp.visible){const u=MALL_LU.uDay.value;col=new THREE.Color(u.x,u.y,u.z);if(city.st&&city.st.night)I=7000}}catch(e){}
   const arr=[...cells.values()].filter(c=>c.n>=4).map(c=>({x:c.sx/c.n,z:c.sz/c.n,y:Math.min(TOPY-.3,Math.max(fy+2.2,c.cy>-1e8?c.cy-.35:fy+3.2)), /* teto do interior (TOPY) é o limite; nunca abaixo de 2,2 m (mesa/letreiro não é forro) */ /* v78: logo abaixo do forro achado (antes: no mínimo piso+3,2 m → no quarto do motel, forro a 2,9 m, a luz ficava FORA do quarto e tudo saía preto) */d:Math.hypot(c.sx/c.n-pc.x,c.sz/c.n-pc.z)})).sort((a,b)=>a.d-b.d).slice(0,200);
   for(const q of arr){const L=new THREE.PointLight(col.clone(),I,0,2);L.position.set(q.x,q.y,q.z);L.name='preenchimento';root.add(L);out.push(L)}}
  scene.traverse(o=>{if(!o.isPointLight||!o.visible||!(o.intensity>0))return;if(typeof nearLampLights!=='undefined'&&nearLampLights.some(s=>s.light===o))return;
   o.getWorldPosition(V);if(mode!=='city'&&Math.hypot(V.x-pc.x,V.z-pc.z)>(mode==='inside'?90:R+20))return;
   const L=new THREE.PointLight(o.color.clone(),Math.min(o.intensity,3)*(mode==='inside'?2500:CD*.9),0,2);L.position.copy(V);L.name='luz';root.add(L);out.push(L)})
 }catch(e){console.warn('[glb luzes]',e)}
 return out.length}
function glbCollect(mode){const scn=new THREE.Scene(),root=new THREE.Group();scn.add(root);const cache=new Map(),pc=PL.car||PL,R=150,tmp=new THREE.Vector3();scene.updateMatrixWorld(true);let n=0;
 const skip=o=>o===sky||o.isSprite||o.isPoints||o===PL.sp||o===PL.sh; // v78: NÃO filtrar camada 1 — é onde ficam paredes, árvores, calçadas e grama (eram ~80% dos triângulos)
 const take=(o,force)=>{o.traverse(c=>{if(skip(c))return;if(!force&&!c.visible)return;if(!c.isMesh)return; /* v78: linhas (fios) fora — alguns importadores (Blender antigo) quebram com primitivas LINES */const m=Array.isArray(c.material)?c.material[0]:c.material;if(!m||m.isShaderMaterial||m.isRawShaderMaterial||m.isSpriteMaterial)return;
   if(c.geometry&&!c.geometry.boundingSphere)c.geometry.computeBoundingSphere();
   if(mode!=='city'){const bs=c.geometry&&c.geometry.boundingSphere;if(!bs)return;tmp.copy(bs.center).applyMatrix4(c.matrixWorld);const rr=mode==='inside'?90:R;if(!c.isInstancedMesh&&(Math.hypot(tmp.x-pc.x,tmp.z-pc.z)>rr+bs.radius||(mode==='inside'&&bs.radius>300)))return}
   let geo=null;try{geo=c.isInstancedMesh?glbMergeInst(c,mode==='city'?null:{x:pc.x,z:pc.z,r:mode==='inside'?90:R}):glbGeo(c.geometry,c.matrixWorld)}catch(e){return}geo=glbClean(geo);if(!geo||!geo.attributes.position||!geo.attributes.position.count)return;
   const mat=c.isLineSegments||c.isLine?new THREE.LineBasicMaterial({color:m.color?m.color.clone():0xffffff}):glbMat(m,cache,geo,mode==='inside');if(mode==='inside'&&mat.isMeshBasicMaterial&&mat.vertexColors&&!mat.transparent&&geo.attributes.color&&!c.isLine&&!c.isLineSegments){ /* halos (aditivos/transparentes) ficam unlit */const sp=glbSplitNeon(geo);for(const b of sp.bars){const em=new THREE.MeshStandardMaterial({color:new THREE.Color(.02,.02,.02),emissive:b.color,roughness:.5,metalness:0});em.name='neon_'+b.color.getHexString();em.userData={emissiveStrength:+(GLB_NEON_STRENGTH*b.br).toFixed(2)};const mm=new THREE.Mesh(b.geo,em);mm.name='neon';root.add(mm);n++}
   if(sp.rest){const mm=new THREE.Mesh(sp.rest,mat);mm.name='mesh';root.add(mm);n++}return}
   const o2=c.isLineSegments?new THREE.LineSegments(geo,mat):c.isLine?new THREE.Line(geo,mat):new THREE.Mesh(geo,mat);o2.name=c.name||(c.isInstancedMesh?'instanced':'mesh');root.add(o2);n++})};
 if(mode==='city')take(city.group,true);
 else if(mode==='area')take(city.group,false);
 else{for(const c of scene.children)if(c!==city.group&&c.visible&&!skip(c))take(c,false)}
 {const cx=mode==='city'?(city.ext||0)/2:(PL.car||PL).x,cz=mode==='city'?(city.ext||0)/2:(PL.car||PL).z;root.position.set(-cx,0,-cz);root.name='coastal_chaos_'+mode} // v78: centrado na origem (no Blender aparece no meio da vista)
 const nl=glbLights(mode,pc,root,R);
 return {root:scn,n,nl}}
async function glbExport(mode,btn){if(GLB.busy)return;if(mode==='inside'&&!PL.inside){toast('ENTRE NUM INTERIOR PARA EXPORTAR');return}GLB.busy=true;const t0=btn?btn.textContent:'';if(btn)btn.textContent='…';
 try{await glbLoadExporter();await new Promise(r=>setTimeout(r,30));const {root,n,nl}=glbCollect(mode);if(!n){toast('NADA PARA EXPORTAR');return}
  const data=await new Promise((ok,no)=>{try{new THREE.GLTFExporter().parse(root,ok,{binary:true,onlyVisible:false,truncateDrawRange:true})}catch(e){no(e)}});
  const blob=new Blob([glbPatchEmissive(data)],{type:'model/gltf-binary'}),a=document.createElement('a'),nm=mode==='inside'?String(PL.inside===true?'casa':PL.inside):mode;a.href=URL.createObjectURL(blob);a.download='coastal-chaos_seed'+(S.seed>>>0)+'_'+nm+'.glb';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
  root.traverse(o=>{if(o.geometry)o.geometry.dispose()});toast('.GLB EXPORTADO · '+n+' '+translatePlain('malhas')+(nl?' · '+nl+' '+translatePlain('luzes'):'')+' · '+(blob.size/1048576).toFixed(1)+' MB')}
 catch(e){console.error(e);toast('ERRO AO EXPORTAR .GLB<br><small style="font-size:11px;color:#fff">'+String(e.message||e).slice(0,80)+'</small>')}
 finally{GLB.busy=false;if(btn)btn.textContent=t0}}
for(const b of document.querySelectorAll('#mGlb button'))b.addEventListener('click',e=>{e.stopPropagation();glbExport(b.dataset.glb,b)});
/* ================= v3 r2 · DEBUG: COLISÕES + WIREFRAME (DBGWF) =================
   MONITOR › DEBUG (botões COLISÕES / WIREFRAME) ou F4 (cicla: desligado → colisões → colisões+wireframe → desligado).
   Colisões: caixas dos colisores (addCol, AABB em XZ; altura estimada pelo tipo/low/top) num raio de DBGWF.R em volta
   do jogador, cilindros dos peds (r .3) e do jogador (r .4), caixa orientada dos carros (t.L × t.W × t.H).
   Um só LineSegments com buffer pré-alocado (1 draw call), depthTest desligado, refeito a cada quadro em render()
   (roda também nos interiores com palco). Fora de city.group de propósito: não é cenário e não passa pela troca de mundo.
   Wireframe: liga material.wireframe dos Mesh/InstancedMesh da cena (sprites ficam normais), guarda quais mudou e
   desfaz ao desligar; varre de novo a cada 0,5 s para pegar o que nasceu depois. Só visual: não mexe em save nem cheat. */
const DBGWF={col:false,wire:false,R:60,MAXV:240000,obj:null,pos:null,colr:null,n:0,mats:new Set(),sweepT:0,stat:{c:0,p:0,v:0}};
const DBGWF_COL={bld:[.2,.9,1],rock:[1,.6,.15],pole:[1,.95,.2],tlight:[1,.95,.2],tree:[.35,1,.35],bin:[1,.35,1],jail:[1,.25,.25],low:[.55,.75,1],def:[.85,.85,.85],ped:[1,.3,.75],pl:[.6,1,.2],car:[1,.25,.2],mycar:[1,1,1]};
function dbgWfInit(){if(DBGWF.obj)return;const g=new THREE.BufferGeometry();DBGWF.pos=new Float32Array(DBGWF.MAXV*3);DBGWF.colr=new Float32Array(DBGWF.MAXV*3);
 g.setAttribute('position',new THREE.BufferAttribute(DBGWF.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(DBGWF.colr,3).setUsage(THREE.DynamicDrawUsage));g.setDrawRange(0,0);
 const m=new THREE.LineBasicMaterial({vertexColors:true,depthTest:false,depthWrite:false,transparent:true,opacity:.9,fog:false,toneMapped:false});m.userData.cached=true;
 const o=new THREE.LineSegments(g,m);o.frustumCulled=false;o.renderOrder=9999;o.matrixAutoUpdate=false;o.visible=false;o.name='dbgWf';o.layers.set(1); /* camada 1: a câmera principal vê, o reflexo da chuva não */o.userData.dbgWf=true;DBGWF.obj=o;scene.add(o)}
function dbgWfSeg(ax,ay,az,bx,by,bz,c){let n=DBGWF.n;if(n+2>DBGWF.MAXV)return;const P=DBGWF.pos,C=DBGWF.colr;let i=n*3;
 P[i]=ax;P[i+1]=ay;P[i+2]=az;C[i]=c[0];C[i+1]=c[1];C[i+2]=c[2];i+=3;P[i]=bx;P[i+1]=by;P[i+2]=bz;C[i]=c[0];C[i+1]=c[1];C[i+2]=c[2];DBGWF.n=n+2}
/* caixa por 4 cantos (XZ) entre y0 e y1 */
function dbgWfBox4(q,y0,y1,c){for(let k=0;k<4;k++){const a=q[k],b=q[(k+1)&3];dbgWfSeg(a[0],y0,a[1],b[0],y0,b[1],c);dbgWfSeg(a[0],y1,a[1],b[0],y1,b[1],c);dbgWfSeg(a[0],y0,a[1],a[0],y1,a[1],c)}}
function dbgWfCyl(x,z,r,y0,y1,c){const N=10;let px=x+r,pz=z;for(let k=1;k<=N;k++){const a=k/N*Math.PI*2,nx=x+Math.cos(a)*r,nz=z+Math.sin(a)*r;dbgWfSeg(px,y0,pz,nx,y0,nz,c);dbgWfSeg(px,y1,pz,nx,y1,nz,c);if((k&1)===0)dbgWfSeg(nx,y0,nz,nx,y1,nz,c);px=nx;pz=nz}}
function dbgWfColH(b){if(b.top>0)return b.top;if(b.low>0)return b.low;if(b.kind==='bin')return b.bin?.height??.9;return b.kind==='bld'?6:b.kind==='pole'||b.kind==='tlight'?4:b.kind==='tree'?3:b.kind==='rock'?1.2:b.kind==='jail'?3:2}
function dbgWfGY(x,z){const y=groundY(x,z);return Number.isFinite(y)?y:0}
function dbgWfBuild(){DBGWF.n=0;const st=DBGWF.stat;st.c=0;st.p=0;st.v=0;const fx=PL.car?PL.car.x:PL.x,fz=PL.car?PL.car.z:PL.z,R=DBGWF.R,R2=R*R;
 for(const b of query(fx,fz,R)){if(b.dead||!Number.isFinite(b.x0+b.z0+b.x1+b.z1))continue;const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;if((cx-fx)**2+(cz-fz)**2>R2*1.6)continue;
  const y0=Math.min(dbgWfGY(cx,cz),dbgWfGY(b.x0,b.z0),dbgWfGY(b.x1,b.z1))+.02,c=DBGWF_COL[b.kind]||(b.low?DBGWF_COL.low:DBGWF_COL.def);
  dbgWfBox4([[b.x0,b.z0],[b.x1,b.z0],[b.x1,b.z1],[b.x0,b.z1]],y0,y0+dbgWfColH(b),c);st.c++}
 for(const p of peds){if(!p||!Number.isFinite(p.x)||(p.sp&&!p.sp.visible))continue;if((p.x-fx)**2+(p.z-fz)**2>R2)continue;const y=(Number.isFinite(p.gy)?p.gy:dbgWfGY(p.x,p.z))+(p.jy||0);dbgWfCyl(p.x,p.z,.3,y+.02,y+(p.lying||p.state==='dead'?.35:1.75),DBGWF_COL.ped);st.p++}
 if(!PL.car&&!PL.dead&&Number.isFinite(PL.x)){const y=dbgWfGY(PL.x,PL.z)+(PL.jy||0);dbgWfCyl(PL.x,PL.z,.4,y+.02,y+1.8,DBGWF_COL.pl)}
 for(const c of vehicles){if(!c||!c.t||!Number.isFinite(c.x)||(c.g&&!c.g.visible))continue;if((c.x-fx)**2+(c.z-fz)**2>R2)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a),hl=c.t.L/2,hw=c.t.W/2;
  const y0=(c.g?c.g.position.y:Number.isFinite(c.gy)?c.gy:dbgWfGY(c.x,c.z))+.05,q=[[1,1],[1,-1],[-1,-1],[-1,1]].map(([f,s])=>[c.x+ca*hl*f-sa*hw*s,c.z+sa*hl*f+ca*hw*s]);
  dbgWfBox4(q,y0,y0+(c.t.H||1.5),c===PL.car?DBGWF_COL.mycar:DBGWF_COL.car);st.v++}
 const g=DBGWF.obj.geometry;g.setDrawRange(0,DBGWF.n);g.attributes.position.needsUpdate=true;g.attributes.color.needsUpdate=true}
function dbgWfIsMat(m){return m&&!m.isSpriteMaterial&&!m.isPointsMaterial&&!m.isLineBasicMaterial&&!m.isShadowMaterial}
function dbgWfSweep(){scene.traverse(o=>{if(!(o.isMesh||o.isInstancedMesh)||o.userData?.dbgWf)return;const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!dbgWfIsMat(m)||m.wireframe||DBGWF.mats.has(m))continue;m.wireframe=true;DBGWF.mats.add(m)}})}
function dbgWfUnwire(){for(const m of DBGWF.mats)m.wireframe=false;DBGWF.mats.clear()}
function dbgWfSet(col,wire){dbgWfInit();DBGWF.col=!!col;if(!!wire!==DBGWF.wire){DBGWF.wire=!!wire;if(DBGWF.wire){DBGWF.sweepT=0;dbgWfSweep()}else dbgWfUnwire()}
 DBGWF.obj.visible=DBGWF.col;if(!DBGWF.col)DBGWF.obj.geometry.setDrawRange(0,0);
 for(const [id,on] of [['mDbgCol',DBGWF.col],['mDbgWire',DBGWF.wire]]){const b=$('#'+id);if(b){b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('on',on)}}}
/* F4: desligado → colisões → colisões+wireframe → desligado */
function dbgWfCycle(){const s=!DBGWF.col&&!DBGWF.wire?1:DBGWF.col&&!DBGWF.wire?2:0;dbgWfSet(s>0,s===2);toast(s===0?'DEBUG DESLIGADO':s===1?'DEBUG · COLISÕES':'DEBUG · COLISÕES + WIREFRAME')}
let dbgWfLast=0;
function dbgWfTick(){if(!DBGWF.obj||(!DBGWF.col&&!DBGWF.wire))return;const now=performance.now(),dt=Math.min(.25,(now-(dbgWfLast||now))/1000);dbgWfLast=now;
 if(DBGWF.wire&&(DBGWF.sweepT-=dt)<=0){DBGWF.sweepT=.5;dbgWfSweep()}
 if(DBGWF.col){if(DBGWF.obj.parent!==scene)scene.add(DBGWF.obj);DBGWF.obj.visible=true;{const hl=ROOM_STAGE.hidden,i=hl?hl.indexOf(DBGWF.obj):-1;if(i>=0)hl.splice(i,1)} /* o palco do interior esconde tudo que é filho da cena */try{dbgWfBuild()}catch(e){if(!DBGWF.err){DBGWF.err=1;console.error('dbgWf',e)}}}}
$('#mDbgCol')?.addEventListener('click',e=>{e.stopPropagation();dbgWfSet(!DBGWF.col,DBGWF.wire)});
$('#mDbgWire')?.addEventListener('click',e=>{e.stopPropagation();dbgWfSet(DBGWF.col,!DBGWF.wire)});
$('#mSeedCopy').addEventListener('click',e=>{e.stopPropagation();if(!Number.isFinite(S.seed))return;void monCopyText(String(S.seed>>>0),$('#mSeedCopy'),'Copiar seed')});
function monBegin(now){if(!MON.on)return;if(MON.last){const d=now-MON.last;MON.acc.iv+=d;if(d>(MON.acc.max||0))MON.acc.max=d;if(d>50)MON.acc.hitch=(MON.acc.hitch||0)+1}MON.last=now;renderer.info.reset()}
function monGpu(start){if(!MON.on||GL_LOST)return;const G=MON.gpu,gl=renderer.getContext();if(gl.isContextLost&&gl.isContextLost())return;
 if(!G.tried){G.tried=true;try{G.ext=renderer.capabilities.isWebGL2?gl.getExtension('EXT_disjoint_timer_query_webgl2'):null}catch(e){G.ext=null}}
 if(!G.ext)return;const ext=G.ext;
 if(start){if(G.act||G.q.length>4)return;const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);G.act=q}
 else{if(G.act){gl.endQuery(ext.TIME_ELAPSED_EXT);G.q.push(G.act);G.act=null}
  while(G.q.length){const q=G.q[0];if(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE))break;const dis=gl.getParameter(ext.GPU_DISJOINT_EXT);if(!dis){G.sum+=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;G.n++;G.ok=true}gl.deleteQuery(q);G.q.shift()}}}
function monVram(){let b=0,cpu=0,lt=0;const geos=new Set(),tex=new Set();scene.traverse(o=>{if(o.isLight&&o.visible&&o.intensity>0&&!o.isAmbientLight&&!o.isHemisphereLight)lt++;if(o.geometry&&!geos.has(o.geometry)){geos.add(o.geometry);const g=o.geometry,b0=b;for(const k in g.attributes){const a=g.attributes[k];if(a.array)b+=a.array.byteLength}if(g.index&&g.index.array)b+=g.index.array.byteLength;cpu+=b-b0;
  if(o.isInstancedMesh){b+=o.instanceMatrix.array.byteLength;if(o.instanceColor)b+=o.instanceColor.array.byteLength}}
  const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms)for(const k of ['map','emissiveMap','alphaMap','normalMap']){const t=m[k];if(t&&!tex.has(t)){tex.add(t);const im=t.image;if(im&&im.width){b+=im.width*im.height*4*(t.generateMipmaps!==false?1.33:1);cpu+=im.width*im.height*4}}}});MON.cpuBuf=cpu/1048576;MON.lights=lt;
 const sz=renderer.getDrawingBufferSize(new THREE.Vector2()),px=sz.x*sz.y;b+=px*8;if(composer)b+=px*4*3.5;if(typeof WET!=='undefined'&&WET.rt)b+=WET.rt.width*WET.rt.height*8;if(renderer.shadowMap.enabled&&sun.shadow&&sun.shadow.mapSize)b+=sun.shadow.mapSize.x*sun.shadow.mapSize.y*4;MON.vram=b/1048576}
/* v78: RAM revisada. performance.memory (só Chrome) dá apenas o heap JS e, fora de páginas cross-origin isolated, o Chrome
   arredonda o valor e só o atualiza a cada ~20 min — por isso aparecia 10 MB logo depois de abrir. Os buffers das geometrias e os pixels
   dos canvas/imagens ficam FORA desse heap. Agora: com measureUserAgentSpecificMemory (página isolada) usa a medida real da aba;
   senão mostra ~(heap JS + buffers de geometria/textura que o jogo mantém na RAM) e marca * quando o heap do Chrome está congelado. */
function monRam(pm){const R=MON.ram||(MON.ram={ua:null,uaT:0,last:-1,lastT:performance.now(),stale:false});const now=performance.now();
 if(self.crossOriginIsolated&&performance.measureUserAgentSpecificMemory&&now-R.uaT>20000){R.uaT=now;performance.measureUserAgentSpecificMemory().then(r=>{R.ua=r.bytes/1048576}).catch(()=>{})}
 if(R.ua!==null){$('#mRam').textContent=R.ua.toFixed(0)+' MB';monBar('mRamB',R.ua/4096);return}
 const buf=MON.cpuBuf||0;if(!pm){$('#mRam').textContent=buf?'~'+buf.toFixed(0)+' MB buf':'n/d';monBar('mRamB',buf/2048);return}
 const h=pm.usedJSHeapSize;if(h!==R.last){R.last=h;R.lastT=now}R.stale=now-R.lastT>30000;
 const u=h/1048576+buf;$('#mRam').textContent='~'+u.toFixed(0)+' MB'+(R.stale?'*':'');$('#mRam').title='heap JS '+(h/1048576).toFixed(0)+' MB'+(R.stale?' (o Chrome só atualiza a cada ~20 min)':'')+' + buffers '+buf.toFixed(0)+' MB';monBar('mRamB',u/2048)}
/* v78: painéis do monitor (cena / sistemas) + gráfico do tempo de quadro (média e pior quadro por janela de 0,5 s) */
function monKV(id,rows){const el=$('#'+id);if(!el)return;const h=rows.map(r=>'<div><span>'+r[0]+'</span><b'+(r[2]?' class="'+r[2]+'"':'')+'>'+r[1]+'</b></div>').join('');if(el.dataset.h!==h){el.dataset.h=h;el.innerHTML=h}}
function monPanels(ri,trMs,pdMs,skip,iv,A){
 const worst=A.max||iv;MON.hist=MON.hist||[];MON.hist.push([iv,worst]);if(MON.hist.length>64)MON.hist.shift();
 $('#mWorst').textContent=worst.toFixed(0)+' ms';$('#mHitch').textContent=String(A.hitch||0);$('#mBuild').textContent='v'+GAME_VER+' · '+(typeof BUILD_TAG!=='undefined'?BUILD_TAG:'');
 {const c=$('#mSpark'),g=c.getContext('2d'),W=c.width,H=c.height,n=MON.hist.length,bw=W/64;g.clearRect(0,0,W,H);
  const y=ms=>H-Math.min(H,ms/50*H);g.fillStyle='#ffffff12';for(const ms of[16.7,33.3])g.fillRect(0,y(ms),W,1);
  MON.hist.forEach((h,k)=>{const x=W-(n-k)*bw;g.fillStyle=h[1]>50?'#ff5a5a':h[1]>33.4?'#ffc23a':'#4ad66d55';g.fillRect(x,y(h[1]),bw-1,H-y(h[1]));g.fillStyle=h[0]>33.4?'#ffc23a':'#4ad66d';g.fillRect(x,y(h[0]),bw-1,H-y(h[0]))});
  g.fillStyle='#8c94ad';g.font='9px system-ui';g.fillText('60',2,y(16.7)-2);g.fillText('30',2,y(33.3)-2)}
 const rail=vehicles.filter(c=>c.mode==='rail').length,dc=ri.render.calls,tr=ri.render.triangles/1000;
 monKV('mScene',[['desenhos',dc,dc>1500?'bad':dc>900?'warn':''],['triângulos',tr.toFixed(0)+'k',tr>1500?'bad':tr>800?'warn':''],['geometrias',ri.memory.geometries],['texturas',ri.memory.textures],['luzes',MON.lights==null?'--':MON.lights,MON.lights>8?'warn':''],['chunks',city.chunks?city.chunks.size:0],['veículos',vehicles.length+' ('+rail+' trilho)'],['pedestres',peds.length]]);
 monKV('mSys',[['trânsito',trMs,trMs>2?'warn':''],['pedestres',pdMs,pdMs>2?'warn':''],['colisões poupadas',skip],['escala',(renderer.getPixelRatio()).toFixed(2)+'×']]);
}
function monBar(id,f){const u=$('#'+id);u.style.width=Math.round(clamp(f,0,1)*100)+'%';u.style.background=f>.85?'#ff4a4a':f>.6?'#ffc23a':'#4ad66d'}
function monEnd(t0,now){if(!MON.on)return;const A=MON.acc;A.busy+=performance.now()-t0;A.n++;MON.t+=1;
 if(A.iv<500)return;const iv=A.iv/A.n,busy=A.busy/A.n,fps=1000/iv;
 $('#mFps').textContent=fps.toFixed(0)+' · '+iv.toFixed(1)+'ms';monBar('mFpsB',1-Math.min(1,fps/60)+.0001);$('#mFpsB').style.width=Math.round(clamp(fps/60,0,1)*100)+'%';$('#mFpsB').style.background=fps<30?'#ff4a4a':fps<50?'#ffc23a':'#4ad66d';
 const cpu=busy/iv;$('#mCpu').textContent=Math.round(cpu*100)+'% · '+busy.toFixed(1)+'ms';monBar('mCpuB',cpu);
 const G=MON.gpu;const gpuMs=G.ext&&G.n?G.sum/G.n:null;if(G.ext&&G.n){const g=G.sum/G.n;$('#mGpu').textContent=Math.round(g/iv*100)+'% · '+g.toFixed(1)+'ms';monBar('mGpuB',g/iv);G.sum=0;G.n=0}
 else if(!G.ext){$('#mGpu').textContent='n/d';monBar('mGpuB',0)}
 const pm=performance.memory;monRam(pm);
 MON.vT-=A.iv;if(MON.vT<=0){MON.vT=3000;try{monVram()}catch(e){}}$('#mVram').textContent='~'+MON.vram.toFixed(0)+' MB';monBar('mVramB',MON.vram/1024);if(typeof BENCH!=='undefined'&&BENCH.active&&BENCH.running)benchRecord({fps,cpu:cpu*100,gpu:gpuMs===null?null:gpuMs/iv*100,ram:pm?pm.usedJSHeapSize/1048576:null,vram:MON.vram,draw:renderer.info.render.calls,tris:renderer.info.render.triangles/1000});
 const ri=renderer.info; const _pf=Math.max(1,PERF.frames),_trafficMS=(PERF.traffic/_pf).toFixed(2),_pedMS=(PERF.peds/_pf).toFixed(2),_skip=PERF.skipFarCollision;PERF.traffic=PERF.peds=PERF.frames=PERF.skipFarCollision=PERF.rainHits=0;
 // O personagem conserva X/Z ao dirigir; para Y usa o veículo/heli quando embarcado,
 // ou a altura do chão mais a altura do salto quando está a pé.
 const _mv=PL.car||HELI.cur||PL.taxi;
 const _my=_mv?(Number.isFinite(_mv.y)?_mv.y:(Number.isFinite(_mv.gy)?_mv.gy:PL.gy))+(_mv.airY||0)+(_mv.rampY||0):(PL.gy||0)+(PL.jy||0);
 const _coord=v=>Number.isFinite(v)?v.toFixed(2):'N/D';
 const coordX=_coord(PL.x),coordY=_coord(_my),coordZ=_coord(PL.z);
 MON.coords=[PL.x,_my,PL.z].every(Number.isFinite)?`${coordX},${coordY},${coordZ}`:'';
 monSeedRefresh();
 $('#mCoordXYZ').textContent=`X: ${coordX} · Y: ${coordY} · Z: ${coordZ}`;{const sp=$('#mCoordXYZ'),ti=$('#mTpIn');if(ti&&sp.offsetWidth){const w=sp.offsetWidth+'px';if(ti.style.width!==w)ti.style.width=w}} /* v79r20: campo do TP com a largura do texto X/Y/Z → TP fica embaixo do COPY */
 $('#mCoordCopy').disabled=!MON.coords;
monPanels(ri,_trafficMS,_pedMS,_skip,iv,A)
 A.n=0;A.busy=0;A.iv=0;A.max=0;A.hitch=0}
/* ================= v152: BENCHMARK (o mesmo motor do modo Livre) ================= */
const BENCH={active:false,preparing:false,running:false,finished:false,cancelRequested:false,wallStart:0,preset:'',elapsed:0,duration:88,seq:0,wave:null,exploded:0,
 samples:null,before:null,monWas:false,storms:null,focus:{x:0,z:0},anchor:null,broadcast:null,lastTicker:-1,report:'',seed:0,stage:'',reportReady:false,tvOverlay:null,cancelled:false,camPolice:null,camPos:null,tickerSampled:false};
const BENCH_METRICS=[['fps','FPS','FPS'],['cpu','CPU · thread principal','%'],['gpu','GPU · tempo relativo','%'],['ram','RAM JS','MB'],['vram','VRAM estimada','MB'],['draw','Chamadas de desenho','calls'],['tris','Triângulos renderizados','k']];
function benchSampleNew(){return{n:0,sum:0,min:Infinity,max:-Infinity}}
function benchRecord(sample){if(!BENCH.samples)return;for(const [k]of BENCH_METRICS){const v=sample[k];if(!Number.isFinite(v)||v<0)continue;
 const a=BENCH.samples[k];a.n++;a.sum+=v;a.min=Math.min(a.min,v);a.max=Math.max(a.max,v)}}
function benchStats(k){const a=BENCH.samples?.[k];return a&&a.n?{min:a.min,mean:a.sum/a.n,max:a.max,n:a.n}:null}
function benchNum(n,unit){return n===null||!Number.isFinite(n)?'N/D':(unit==='FPS'?n.toFixed(1):n.toFixed(1))+' '+unit}
function benchPreset(name){
 const pc={...CFG_DEF,mv2:1,iv2:1,vol:{...VOL}};
 if(name==='LOW')Object.assign(pc,{shadows:false,shadowQuality:1,bloom:false,refl:false,renderScale:0,drawDistance:0,objectDistance:0,shadowDistance:0,detailedShadows:false,lampLighting:false,lampCount:1});
 if(name==='HIGH')Object.assign(pc,{shadows:true,shadowQuality:4,bloom:true,refl:true,renderScale:100,drawDistance:100,objectDistance:100,shadowDistance:100,detailedShadows:true,lampLighting:true,lampCount:4});
 if(name==='MEDIUM')Object.assign(pc,{shadows:true,shadowQuality:1,bloom:true,refl:true,renderScale:100,drawDistance:50,objectDistance:50,shadowDistance:50,detailedShadows:false,lampLighting:true,lampCount:4});
 const density=GRAPHICS_PRESETS[name];
 if(density){pc.traffic=density.traffic;pc.peds=density.peds}
 // FPS ilimitado em todos os perfis, para a comparação medir capacidade real.
 pc.fpsLimit=0;pc.showHud=false;pc.showMinimap=false;
 return pc;
}
function benchStart(profile){
 if(BENCH.active||played||!$('#loading').hidden)return;
 // Preserva as preferências persistidas (e as efetivas) antes de aplicar o perfil.
 const savedCfgRaw=(()=>{try{return localStorage.getItem('ps_cfg')}catch(e){return null}})();
 BENCH.before={played,save:null,cfg:cfgObj(),savedCfgRaw,seed:S.seed,size:S.size,style:S.style,hour:S.hour,rain:S.rain,storm:S.storm,mode:modeSel,mon:MON.on,fov:camera.fov};
 BENCH_CFG_LOCK=true;BENCH.active=true;BENCH.preparing=true;BENCH.running=false;BENCH.finished=false;BENCH.cancelRequested=false;BENCH.cancelled=false;BENCH.camPolice=null;BENCH.camPos=null;BENCH.tickerSampled=false;BENCH.preset=profile;BENCH.report='';BENCH.reportReady=false;
 BENCH.samples=Object.fromEntries(BENCH_METRICS.map(([k])=>[k,benchSampleNew()]));BENCH.elapsed=0;BENCH.seq=0;BENCH.wave=null;BENCH.exploded=0;
 $('#benchMenu').hidden=true;$('#benchResults').hidden=true;$('#benchHud').hidden=false;$('#tvbar').hidden=true;document.body.classList.remove('benchmark-broadcast');$('#benchStage').textContent='PREPARANDO CIDADE NORMAL · '+profile;
 $('#benchProgress').style.width='0%';$('#benchLive').textContent='Aquecimento de shaders, veículos e chuva…';
 for(const k in keys)keys[k]=false;GUN.firing=false;
 applyCfgObj(benchPreset(profile));S.size=14;S.seed=3031265903;BENCH.seed=S.seed;S.hour=6;S.style='modern';S.rain=true;S.storm=false;modeSel='free';GAMEMODE='free';
 applyRenderScale();try{applyShadows();refreshLampLighting()}catch(e){console.warn(e)}cfgUI();
 startGame(null);
}
function benchReady(){
 BENCH.preparing=false;if(BENCH.cancelRequested){BENCH.running=false;benchFinish('cancelled');return}BENCH.running=true;BENCH.elapsed=0;BENCH.wallStart=performance.now();BENCH.seq=0;BENCH.wave=null;
 BENCH.focus.x=PL.x;BENCH.focus.z=PL.z;
 // Quarteirão fixo e câmera da TV: todos os pares correm no mesmo local.
 BENCH.anchor={x:PL.x,z:PL.z};const road=benchPickRoads(1)[0];
 if(road){BENCH.road=road;const p=lanePt(road.kx,road.kz,road.d,0,RW/2+32);BENCH.focus.x=p[0];BENCH.focus.z=p[1]}else BENCH.road=null;
 BENCH.broadcast={kind:'benchmark',foc:BENCH.focus,ang:.7,chk:0,camH:30};BENCH.lastTicker=-1;BENCH.camPolice=null;BENCH.camPos=null;
 $('#tvbar').hidden=false;document.body.classList.add('benchmark-broadcast');
 BENCH.tvOverlay={live:$('#tvbar .tvlive').textContent,logo:$('#tvbar .tvlogo').innerHTML};
 $('#tvbar .tvlive').textContent='● BENCHMARK AO VIVO';$('#tvbar .tvlogo').innerHTML='PIXEL<b>BENCH</b>';
 benchTicker(true);
 // O clima para benchmark usa a chuva real do jogo e evita eventos meteorológicos extras.
 CELLS.length=0;WX.stormCell=spawnCell(false,null,true);WX.stormCell.s=.01;WX.stormCell.max=1;WX.stormCell.life=10000;
 WX.cover=0;WX.pre=0;WX.freeze=true;WX.stormEta=null;WX.stormReq=false;WX.stormRoll=10000;WX.lastOpt=true;WX.fairTg=0;
 DN.tod=360;DN.day=0;updateDayNight(0,true);
 BENCH.monWas=BENCH.before.mon;monSet(true);MON.acc={n:0,busy:0,iv:0};MON.last=0;MON.vT=0;
 for(const a of Object.values(BENCH.samples)){a.n=0;a.sum=0;a.min=Infinity;a.max=-Infinity}
 $('#benchStage').textContent='CICLO 24H · FORMAR TEMPESTADE';
}
function benchPickRoads(n){
 // Escolhe uma rua real, sem rio e sem ponte, para comportar a grade de até 10 veículos.
 const candidates=[],ctr=BENCH.anchor||BENCH.focus,rnd=mulberry32((BENCH.seed^0x52a1f00d)>>>0);
 for(let kx=1;kx<city.N;kx++)for(let kz=1;kz<city.N;kz++)for(let d=0;d<4;d++){
  if(!segExists(kx,kz,d)||!laneValid(kx,kz,d,0)||!canDrive(kx,kz,d))continue;
  const pos=lanePt(kx,kz,d,0,RW/2+32),dist=Math.hypot(pos[0]-ctr.x,pos[1]-ctr.z);
  if(dist<35||dist>260||inWater(pos[0],pos[1])||groundY(pos[0],pos[1])!==0)continue;
  if(city.dbs&&city.dbs.some(b=>Math.hypot((b.cx||0)-pos[0],(b.cz||0)-pos[1])<70))continue;
  const crowd=carsNear(pos[0],pos[1],38).length;
  candidates.push({kx,kz,d,dist,score:Math.abs(dist-140)+crowd*55+rnd()*16});
 }
 candidates.sort((a,b)=>a.score-b.score);
 return candidates.slice(0,Math.max(1,n));
}
function benchClearWave(w){if(!w)return;for(const pair of w.pairs)for(const c of [pair.suspect,pair.police]){
 if(vehicles.includes(c)&&c!==PL.car){c.keep=false;removeVehicle(c)}
}}
function benchBeginWave(n){
 // Uma só rua, duas fileiras: até cinco suspeitos à frente e cinco viaturas atrás.
 // Usa makeVehicle + IA original de perseguição + colisão física real.
 if(BENCH.wave)benchClearWave(BENCH.wave);
 const road=BENCH.road||benchPickRoads(1)[0],pairs=[];
 if(!road){BENCH.wave={n,pairs,at:BENCH.elapsed,detonated:false};BENCH.seq=n;return}
 const {kx,kz,d}=road,dx=D[d][0],dz=D[d][1],rx=-dz,rz=dx,a=Math.atan2(dz,dx);
 const rowPos=(s,off)=>({x:kx*P+dx*s+rx*off,z:kz*P+dz*s+rz*off});
 const offsets=Array.from({length:n},(_,i)=>(i-(n-1)/2)*2.85);
 for(let i=0;i<n;i++)try{
  const sp=rowPos(RW/2+35,offsets[i]),cp=rowPos(RW/2+18,offsets[i]);
  const suspect=makeVehicle('sports',sp.x,sp.z,a,['#d43230','#ffb020','#6223cf','#37c5ce','#e7e7e7'][i]);
  const police=makeVehicle('police',cp.x,cp.z,a);
  for(const c of [suspect,police]){
   c.bench=true;c.keep=true;c.display=true;c.benchWave=n;c.sleep=false;c.hp=100;
   c.vx=dx*7;c.vz=dz*7;c.fwd=7;c.vmax=16;ensureDetail(c);if(c.g)syncCar(c,0);
  }
  suspect.crim=true;suspect.ai={kx,kz,d,li:0,nd:d,vmax:16,stun:0,blockT:0,ignore:0};
  startChase(police);police.target=suspect;police.lightsOff=false;police.sirenOn=true;
  pairs.push({suspect,police});
 }catch(err){console.warn('Benchmark - par de perseguicao',err)}
 BENCH.wave={n,pairs,at:BENCH.elapsed,detonated:false};BENCH.seq=n;
 // Escolha pseudoaleatória e reproduzível por seed/onda: UMA viatura por perseguição.
 const rnd=mulberry32((BENCH.seed ^ Math.imul(n,0x9e3779b9) ^ 0x56ac1e2f)>>>0);
 BENCH.camPolice=pairs.length?pairs[Math.floor(rnd()*pairs.length)].police:null;
 BENCH.camPos=null;
 if(BENCH.camPolice){BENCH.focus.x=BENCH.camPolice.x;BENCH.focus.z=BENCH.camPolice.z}
 $('#benchStage').textContent=`CENA ${n}/5 · ${pairs.length} VIATURA(S) / ${pairs.length} SUSPEITO(S)`;
 benchTicker();
}
function benchDetonateWave(w){
 if(!w||w.detonated)return;w.detonated=true;
 // Todas as explosões são chamadas dentro do MESMO frame, e não em fila.
 for(const pair of w.pairs)for(const c of [pair.suspect,pair.police]){
  if(!vehicles.includes(c)||c.exploded)continue;
  try{explode(c,false);BENCH.exploded++}catch(e){console.error('Benchmark explosao',e)}
 }
 $('#benchStage').textContent=`CENA ${w.n}/5 · ${w.pairs.length*2} EXPLOSÕES SIMULTÂNEAS`;
 benchTicker();
}
// Faixa corrida como uma noticia única: o texto só é atualizado a cada VOLTA completa.
// Evita saltar de trecho a cada 8 s, com a animação da TV preservada.
function benchTicker(force=false,iteration=false){
 if(!BENCH.running)return;
 const fps=benchStats('fps');
 $('#tvHead').textContent=`BENCHMARK ${BENCH.preset} · CENA ${Math.min(5,BENCH.seq)}/5 · ${Math.floor(BENCH.elapsed)} / ${BENCH.duration}s · FPS MÉDIO ${fps?fps.mean.toFixed(1):'--'}`;
 if(!force&&!iteration&&BENCH.lastTicker>=0)return;
 BENCH.lastTicker=Math.floor(BENCH.elapsed);
 const desc={fps:'FPS',cpu:'CPU THREAD PRINCIPAL',gpu:'GPU TEMPO RELATIVO',ram:'RAM JS',vram:'VRAM ESTIMADA',draw:'DRAW CALLS',tris:'TRIÂNGULOS (MIL)'};
 const part=BENCH_METRICS.map(([k,,unit])=>{
  const st=benchStats(k),f=x=>st?st[x].toFixed(1):'N/D';
  return `${desc[k]}: MÍN ${f('min')} / MÉD ${f('mean')} / MÁX ${f('max')} ${unit}`;
 });
 $('#tvTick').textContent=`COASTAL CHAOS BENCHMARK AO VIVO · PERFIL ${BENCH.preset} · SEED ${BENCH.seed} · ${part.join(' · ')} · EXPLOSÕES ${BENCH.exploded} DE 30 · HORAS VIRTUAIS 24 · CPU/GPU: CARGA RELATIVA, NÃO UTILIZAÇÃO TOTAL · `;
}

function benchTick(dt){
 if(!BENCH.running)return;
 BENCH.elapsed=Math.min(BENCH.duration,Math.max(0,(performance.now()-BENCH.wallStart)/1000));
 // Relógio real, mesmo se um dispositivo executar menos de 20 quadros/s.
 // O updateDayNight(dt) seguinte adiciona seu próprio dt.
 DN.tod=(360+BENCH.elapsed*1440/BENCH.duration-dt+1440)%1440;
 // Céu fecha progressivamente, acompanha o período de perseguições, depois limpa.
 const t=BENCH.elapsed,storm=WX.stormCell;
 if(storm){
  if(t<68){storm.fading=false;storm.s=Math.max(.01,Math.min(1,t/32));storm.max=1;storm.life=10000;storm.age=1}
  else{storm.fading=true;storm.life=0;storm.age=10001;storm.s=Math.max(0,(BENCH.duration-t)/(BENCH.duration-68))}
 }
 if(t>=8&&t<68){const n=Math.min(5,Math.floor((t-8)/12)+1);
  if(n!==BENCH.seq)benchBeginWave(n);
  if(BENCH.wave&&t-BENCH.wave.at>=10)benchDetonateWave(BENCH.wave);
 }else if(t>=68){if(BENCH.wave)benchDetonateWave(BENCH.wave);
  BENCH.wave=null;BENCH.seq=5;$('#benchStage').textContent='CENA 5/5 · FIM DA CHUVA · AMANHECER';}
 else $('#benchStage').textContent='CICLO 24H · FORMANDO TEMPESTADE';
 // Não permitir inputs do usuário, mantendo o cenário e o tráfego realmente simulados.
 for(const k in keys)keys[k]=false;GUN.firing=false;
 if(Math.floor(t*4)!==Math.floor((t-dt)*4)){
  $('#benchProgress').style.width=(t/BENCH.duration*100).toFixed(1)+'%';
  const fps=benchStats('fps');$('#benchLive').textContent=`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')} / 1:28 · FPS ${fps?fps.mean.toFixed(1):'--'} · ondas ${Math.min(5,BENCH.seq)}/5`;
  if(fps&&!BENCH.tickerSampled){BENCH.tickerSampled=true;benchTicker(true)}else benchTicker();
 }
 if(t>=BENCH.duration)benchFinish();
}
function benchCamera(dt){
 const w=BENCH.wave;
 // A perseguição acompanha UMA viatura, em terceira pessoa, baixa e próxima.
 // A escolha acontece uma só vez na criação da onda; não há troca pelo jogador.
 const c=BENCH.camPolice;
 if(w&&c&&vehicles.includes(c)){
  BENCH.focus.x=c.x;BENCH.focus.z=c.z;
  const ca=Math.cos(c.a),sa=Math.sin(c.a),h=c.gy+(c.airY||0)+(c.rampY||0);
  const desired=new THREE.Vector3(c.x-ca*9.5,h+3.5,c.z-sa*9.5);
  if(!BENCH.camPos)BENCH.camPos=desired.clone();
  else BENCH.camPos.lerp(desired,Math.min(1,dt*5));
  camera.up.set(0,1,0);
  if(camera.fov!==66){camera.fov=66;camera.updateProjectionMatrix()}
  camera.position.copy(BENCH.camPos);
  camera.lookAt(c.x+ca*8,h+1.7,c.z+sa*8);
  sky.position.copy(camera.position);
  return;
 }
 // Entre ondas, plano geral ~30 graus, baixo o bastante para mostrar horizonte/céu.
 if(BENCH.broadcast)broadcastCam(dt,BENCH.broadcast);
}

function benchMakeReport(){
 if(S.lang==='en'){
  const labels={'CPU · thread principal':'CPU · main thread','GPU · tempo relativo':'GPU · relative time','VRAM estimada':'Estimated VRAM','Chamadas de desenho':'Draw calls','Triângulos renderizados':'Rendered triangles'};
  const en=[`Coastal Chaos v${GAME_VER} · BENCHMARK`,`Date: ${new Date().toISOString()}`,`Preset: ${BENCH.preset}`,
   `City: Normal 14x14 · Free mode · seed ${BENCH.seed}`,
   `Duration: ${BENCH.elapsed.toFixed(1)} of ${BENCH.duration} planned seconds · 24 planned in-game hours`,
   `Status: ${BENCH.cancelled?'CANCELLED BY PLAYER (PARTIAL SAMPLES)':'COMPLETED'}`,
   'Sequence: 5 waves at the same location, 1 to 5 paired vehicles in formation; 2/4/6/8/10 simultaneous explosions per wave, storm, lightning, day/night and cleanup',
   `Explosions executed: ${BENCH.exploded} · Visuals: police-car chase camera, TV broadcast and live metrics ticker`,
   `Settings: traffic ${S.traffic}% · pedestrians ${S.peds}% · resolution ${S.renderScale}% · shadows ${S.shadows?'ON':'OFF'} / ${S.shadowQuality}x · bloom ${S.bloom?'ON':'OFF'} · reflections ${S.refl?'ON':'OFF'} · streetlights ${S.lampLighting?'ON':'OFF'}`,'',
   'Metric                        minimum       average       maximum        samples'];
  for(const [k,name,unit] of BENCH_METRICS){const st=benchStats(k);en.push((labels[name]||name).padEnd(27)+['min','mean','max'].map(v=>benchNum(st?st[v]:null,unit).padStart(15)).join('')+'    '+(st?.n||0))}
  en.push('','METHOD AND LIMITATIONS:',
   'FPS: rendered frames divided by the sampling interval measured by MONITOR.',
   'CPU (%): main JS thread and render submission time divided by frame time. This is NOT overall CPU utilization.',
   'GPU (%): EXT_disjoint_timer_query_webgl2 timing divided by frame time. This is NOT overall GPU utilization; N/A when unavailable.',
   'RAM: ~ JS heap + geometry/texture buffers the game keeps in memory (estimate). Chrome only refreshes the heap every ~20 min outside cross-origin isolated pages (* = frozen); the exact tab total is used when the browser allows it. Hover shows the split.',
   'VRAM: an estimate of WebGL meshes, buffers, textures and render targets, not a measurement from the GPU driver.',
   'Draw calls and triangles: WebGL renderer geometry metrics, not GPU utilization percentages.',
   'Readings sampled approximately every 0.5 seconds. Browsers do not provide standard physical CPU/GPU/VRAM usage metrics.',
   'Temporary benchmark: the previous saved game should not be overwritten.');
  return en.join('\n')+'\n';
 }
 const lines=[`Coastal Chaos v${GAME_VER} · BENCHMARK`,`Data: ${new Date().toISOString()}`,`Preset: ${BENCH.preset}`,
  `Cidade: Normal 14x14 · modo Livre · seed ${BENCH.seed}`,`Duração: ${BENCH.elapsed.toFixed(1)} s de ${BENCH.duration} s previstos · 24 h virtuais planejadas`,
  `Status: ${BENCH.cancelled?'CANCELADO PELO JOGADOR (AMOSTRAS PARCIAIS)':'CONCLUÍDO'}`, 
  'Sequência: 5 ondas no mesmo trecho, de 1 a 5 pares em formação; 2/4/6/8/10 explosões simultâneas por onda, tempestade, relâmpagos, dia/noite, limpeza',
  `Explosões executadas: ${BENCH.exploded} · Visual: terceira pessoa de uma viatura, transmissão da TV, ticker com métricas reais`,
  `Configuração: tráfego ${S.traffic}% · pedestres ${S.peds}% · resolução ${S.renderScale}% · sombras ${S.shadows?'ON':'OFF'} / ${S.shadowQuality}x · bloom ${S.bloom?'ON':'OFF'} · reflexos ${S.refl?'ON':'OFF'} · postes ${S.lampLighting?'ON':'OFF'}`, '',
  'Indicador                      mínimo         média         máximo       amostras'];
 for(const [k,name,unit] of BENCH_METRICS){const st=benchStats(k);lines.push(name.padEnd(27)+['min','mean','max'].map(v=>benchNum(st?st[v]:null,unit).padStart(15)).join('')+'    '+(st?.n||0))}
 lines.push('','MÉTODO E LIMITAÇÕES:',
  'FPS: quadros renderizados / intervalo de tempo amostrado pelo MONITOR.',
  'CPU (%): tempo consumido na thread JS + submissão do render dividido pelo intervalo do quadro. NÃO é utilização total da CPU.',
  'GPU (%): tempo de consultas EXT_disjoint_timer_query_webgl2 dividido pelo intervalo do quadro. NÃO é utilização total da GPU; N/D quando indisponível.',
  'RAM: ~ heap JS + buffers de geometria/textura que o jogo mantém na memória (estimativa). Fora de página isolada o Chrome só atualiza o heap a cada ~20 min (* = congelado); quando o navegador permite, usa o total real da aba. Passe o mouse para ver a divisão.',
  'VRAM: estimativa dos buffers/malhas/texturas de WebGL e alvos de renderização, não leitura do driver.',
  'Desenhos e triângulos: métricas de geometria do renderer WebGL, não ocupação percentual da GPU.',
  'Medições colhidas a cada ~0,5 segundo; não há suporte padrão de browser para uso físico CPU/GPU/VRAM.',
  'Benchmark temporário: o save anterior não deve ser sobrescrito.');
 return lines.map(translatePlain).map(x=>S.lang==='en'?x.replace(/(\d+(?:[.,]\d+)?)\s+de\s+(\d+(?:[.,]\d+)?)/g,'$1 of $2'):x).join('\n')+'\n';
}
function benchBroadcastOff(){
 $('#tvbar').hidden=true;document.body.classList.remove('benchmark-broadcast');
 if(BENCH.tvOverlay){$('#tvbar .tvlive').textContent=BENCH.tvOverlay.live;$('#tvbar .tvlogo').innerHTML=BENCH.tvOverlay.logo;BENCH.tvOverlay=null}
}
function benchFinish(reason='complete'){
 if(!BENCH.active||BENCH.finished)return;
 if(BENCH.preparing&&reason!=='cancelled')return;
 if(BENCH.preparing){
  // A construção não pode ser interrompida no meio de um await; mostrar resultados
  // assim que o mundo estiver pronto, sem registrar valores artificiais.
  BENCH.cancelRequested=true;
  $('#benchStage').textContent='CANCELANDO APÓS O CARREGAMENTO…';
  return;
 }
 if(BENCH.running)BENCH.elapsed=Math.min(BENCH.duration,Math.max(BENCH.elapsed,(performance.now()-BENCH.wallStart)/1000));
 BENCH.cancelled=reason==='cancelled';BENCH.running=false;BENCH.finished=true;
 benchBroadcastOff();
 $('#benchHud').hidden=true;$('#benchResults').hidden=false;
 const rows=$('#benchRows');rows.textContent='';
 for(const [k,name,unit] of BENCH_METRICS){const st=benchStats(k),tr=document.createElement('tr');
  for(const content of [name,benchNum(st?st.min:null,unit),benchNum(st?st.mean:null,unit),benchNum(st?st.max:null,unit)]){
   const td=document.createElement('td');td.textContent=content;tr.appendChild(td)}rows.appendChild(tr)}
 $('#benchSummary').textContent=S.lang==='en'?`${BENCH.preset} · seed ${BENCH.seed} · ${BENCH.cancelled?'CANCELLED':'COMPLETED'} · ${BENCH.elapsed.toFixed(1)} of ${BENCH.duration} s · ${BENCH.exploded} explosions · ${benchStats('fps')?.n||0} FPS samples`:`${BENCH.preset} · seed ${BENCH.seed} · ${BENCH.cancelled?'CANCELADO':'CONCLUÍDO'} · ${BENCH.elapsed.toFixed(1)} de ${BENCH.duration} s · ${BENCH.exploded} explosões · ${benchStats('fps')?.n||0} amostras de FPS`;
 BENCH.report=benchMakeReport();BENCH.reportReady=true;
}
function benchExit(){
 if(!BENCH.active)return;
 if(BENCH.preparing){benchFinish('cancelled');return}
 const old=BENCH.before;
 BENCH.running=false;BENCH.finished=false;BENCH.preparing=false;BENCH.active=false;
 if(BENCH.wave)benchClearWave(BENCH.wave);BENCH.wave=null;BENCH.camPolice=null;BENCH.camPos=null;
 benchBroadcastOff();
 $('#benchHud').hidden=true;$('#benchResults').hidden=true;$('#benchMenu').hidden=true;
 // O benchmark é acessível só antes de iniciar uma partida: NUNCA gerar outra
 // cidade com startGame() ao sair, mesmo que haja um snapshot anterior.
 running=false;played=false;menuOpen=true;
 $('#menu').hidden=false;$('#hud').hidden=true;$('#resume').hidden=true;$('#menuX').hidden=true;
 try{if(old){camera.fov=old.fov||68;camera.updateProjectionMatrix();applyCfgObj(old.cfg);
  S.seed=old.seed;S.size=old.size;S.style=old.style;S.hour=old.hour;
  S.rain=old.rain;S.storm=old.storm;modeSel=old.mode;GAMEMODE=old.mode;
  applyRenderScale();applyShadows();refreshLampLighting();cfgUI();monSet(old.mon);modePaint();}
  syncSave();syncMenu();requestAnimationFrame(alignSaveToLoad);
 }catch(e){console.warn('Benchmark: restauração de menu',e)}finally{
  // Garantia dupla: nenhum preset LOW/MEDIUM/HIGH pode substituir as preferências salvas.
  BENCH_CFG_LOCK=false;
  try{if(old&&old.savedCfgRaw!==undefined){if(old.savedCfgRaw===null)localStorage.removeItem('ps_cfg');else localStorage.setItem('ps_cfg',old.savedCfgRaw)}}catch(e){}
 }
 BENCH.before=null;
}

function benchExport(){if(!BENCH.reportReady||!BENCH.report)return;
 const blob=new Blob([BENCH.report],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`CoastalChaos_v${GAME_VER}_benchmark_${BENCH.preset}_${BENCH.seed}.txt`;document.body.appendChild(a);a.click();
 setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);
}
let benchFromCfg=false;$('#benchBtn').addEventListener('click',()=>{if(played||BENCH.active)return;benchFromCfg=cfgOpen;if(cfgOpen)closeCfg();$('#benchMenu').hidden=false;$('#benchMedium').focus()});
$('#benchClose').addEventListener('click',()=>{$('#benchMenu').hidden=true;if(benchFromCfg){openCfg()}$('#benchBtn').focus();benchFromCfg=false});
for(const [id,preset] of [['benchLow','LOW'],['benchMedium','MEDIUM'],['benchHigh','HIGH']])$('#'+id).addEventListener('click',()=>benchStart(preset));
$('#benchCancel').addEventListener('click',()=>benchFinish('cancelled'));
$('#benchExit').addEventListener('click',benchExit);$('#benchExport').addEventListener('click',benchExport);
$('#tvTick').addEventListener('animationiteration',()=>{if(BENCH.active&&BENCH.running)benchTicker(false,true)});

