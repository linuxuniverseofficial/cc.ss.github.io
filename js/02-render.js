'use strict';
/* Coastal Chaos · js/02-render.js — Renderer, sombras, pós-processamento, shaders comuns.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= RENDERER ================= */
const canvas=$('#gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
// v77: perda de contexto da GPU não derruba a aba; avisa e recarrega quando o navegador devolver o contexto.
let GL_LOST=false; /* r27: com o contexto perdido/recém-restaurado, consultas de GPU antigas viram centenas de INVALID_OPERATION */
/* r27: o navegador nem sempre devolve o contexto (ficava preso em "Recarregando…"). Agora: salva na hora, recarrega sozinho em 3 s
   (ou no botão). Se a GPU cair 3× em 2 min, para de recarregar sozinho e explica o que fazer (evita loop). */
function glHardReload(){if(window._glReloading)return;window._glReloading=true;try{const k='glLostLog',a=JSON.parse(sessionStorage.getItem(k)||'[]').filter(t=>Date.now()-t<120000);a.push(Date.now());sessionStorage.setItem(k,JSON.stringify(a))}catch(_){}
 try{const u=new URL(location.href);u.searchParams.set('r',Date.now().toString(36));location.replace(u.toString())}catch(_){location.reload()}}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();GL_LOST=true;try{const G=MON.gpu;G.q=[];G.act=null;G.tried=false;G.ext=null}catch(_){}console.warn('[PixelCity] WebGL context lost');
 let saved=false;try{if(played&&!PL.dead&&!STORYFAIL.active&&!saveBlocked()){sessionStorage.setItem('glRescue',JSON.stringify(buildSave()));saved=true}}catch(e){console.warn('glRescue save',e)}
 let many=false;try{many=JSON.parse(sessionStorage.getItem('glLostLog')||'[]').filter(t=>Date.now()-t<120000).length>=2}catch(_){}
 try{const d=document.createElement('div');d.id='glLost';d.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:#000d;color:#fff;font:700 16px monospace;text-align:center;padding:20px';
  const t=document.createElement('div'),b=document.createElement('button');b.textContent=translatePlain('RECARREGAR AGORA');b.style.cssText='font:700 15px monospace;padding:10px 22px;border:2px solid #ffd23a;background:#1a1408;color:#ffd23a;border-radius:8px;cursor:pointer';b.onclick=glHardReload;
  d.append(t,b);document.body.appendChild(d);
  if(many){t.innerHTML=translatePlain('A placa de vídeo caiu várias vezes seguidas.')+'<br><small style="font-weight:400;opacity:.85">'+translatePlain(saved?'Jogo salvo. Feche outras abas pesadas e recarregue; se continuar, reinicie o navegador.':'Feche outras abas pesadas e recarregue; se continuar, reinicie o navegador.')+'</small>'}
  else{let n=3;const tick=()=>{t.innerHTML=translatePlain('A placa de vídeo reiniciou.')+'<br><small style="font-weight:400;opacity:.85">'+translatePlain(saved?'Jogo salvo · recarregando em':'Recarregando em')+' '+n+'…</small>';if(n--<=0)glHardReload();else setTimeout(tick,1000)};tick()}}catch(_){glHardReload()}},false);
canvas.addEventListener('webglcontextrestored',()=>{try{const G=MON.gpu;G.q=[];G.act=null;G.tried=false;G.ext=null}catch(_){}try{if(typeof SHADOW_CACHE!=='undefined'){SHADOW_CACHE.rt=null;SHADOW_CACHE.key='';SHADOW_CACHE.gen=(SHADOW_CACHE.gen+1)|0}}catch(_){}if(!document.getElementById('glLost')||!/várias|several/.test(document.getElementById('glLost').textContent))glHardReload()},false);
const BASE_PIXEL_RATIO=Math.min(window.devicePixelRatio||1,1); // limite nativo 1x, sem supersampling 1.5x
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,2500);camera.layers.enable(1);
camera.position.set(0,60,0);
let composer=null,bloomPass=null;
/* Bloom sempre em meia resolucao (reduz ~75% do fill-rate dos 11 passes sem perda perceptivel; bloomHalf -1 = recalcular) */
let bloomHalf=-1;function bloomResFit(){if(!composer||!bloomPass)return;const pr=renderer.getPixelRatio(),w=Math.max(1,Math.round(innerWidth*pr*.5)),h=Math.max(1,Math.round(innerHeight*pr*.5)),key=w*65536+h;if(key===bloomHalf)return;bloomHalf=key;bloomPass.setSize(w,h)}
function renderScale01(){return Math.max(.12,(S.renderScale??100)/100)}
function applyRenderScale(){
  const sc=renderScale01(),pr=Math.max(.18,BASE_PIXEL_RATIO*sc);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.domElement.style.width='100vw';
  renderer.domElement.style.height='100vh';
  renderer.domElement.style.imageRendering=sc<=.45?'pixelated':'auto';
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  if(composer){composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);bloomHalf=-1;}
  const o=$('#renderScaleOut'); if(o)o.textContent=Math.round(S.renderScale??100)+'%';
}
applyRenderScale();
try{ if(THREE.EffectComposer&&THREE.UnrealBloomPass&&THREE.RenderPass){
  const rt=new THREE.WebGLRenderTarget(innerWidth*renderer.getPixelRatio(),innerHeight*renderer.getPixelRatio(),{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false});
  composer=new THREE.EffectComposer(renderer,rt);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);
  composer.addPass(new THREE.RenderPass(scene,camera));
  bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(Math.max(1,Math.round(innerWidth*renderer.getPixelRatio()*.5)),Math.max(1,Math.round(innerHeight*renderer.getPixelRatio()*.5))),0.95,0.55,0.5);
  composer.addPass(bloomPass);bloomResFit();
}}catch(e){composer=null;console.warn('bloom off',e)}
addEventListener('resize',()=>{applyRenderScale()});

const hemi=new THREE.HemisphereLight(0xffffff,0x444444,0.7); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;let shadowRefreshAt=-1;
sun.shadow.camera.near=1; sun.shadow.camera.far=400; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03;
scene.add(sun); scene.add(sun.target);
const SHADOW_CACHE={enabled:true,rt:null,w:0,h:0,key:'',gen:1,hits:0,misses:0,lastStaticCalls:0,lastDynCalls:0,_verified:false,_fallActive:false,_biasSec:0,_vis:[],_chVis:[]};
function invalidateStaticShadows(){SHADOW_CACHE.gen=(SHADOW_CACHE.gen+1)|0}
(function(){
 const origShadowRender=renderer.shadowMap.render.bind(renderer.shadowMap),noopClear=()=>{};
 function blitShadowRT(srcRT,dstRT,w,h){
  const gl=renderer.getContext();if(!gl||typeof gl.blitFramebuffer!=='function')return false;
  const sp=renderer.properties.get(srcRT),dp=renderer.properties.get(dstRT);
  const sf=sp&&sp.__webglFramebuffer,df=dp&&dp.__webglFramebuffer;if(!sf||!df)return false;
  const prevRT=renderer.getRenderTarget(),prevFace=renderer.getActiveCubeFace(),prevMip=renderer.getActiveMipmapLevel();
  renderer.state.setScissorTest(false);renderer.state.buffers.color.setMask(true);renderer.state.buffers.depth.setMask(true);
  renderer.state.bindFramebuffer(gl.READ_FRAMEBUFFER,sf);renderer.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,df);
  if(!SHADOW_CACHE._verified){
   const ok=gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE&&gl.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
   if(!ok){renderer.state.bindFramebuffer(gl.READ_FRAMEBUFFER,null);renderer.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);renderer.setRenderTarget(prevRT,prevFace,prevMip);return false}
   SHADOW_CACHE._verified=true;
  }
  gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);
  renderer.state.bindFramebuffer(gl.READ_FRAMEBUFFER,null);renderer.state.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
  renderer.setRenderTarget(prevRT,prevFace,prevMip);
  return true;
 }
 /* dev r2.3: sombra independente do culling da câmera. cullChunks esconde chunks atrás da câmera; de costas pro sol são
    exatamente eles que fazem sombra na frente do jogador → a sombra sumia/voltava conforme o chunk entrava e saía do culling
    ("trepidando"). Os dois caminhos (cache e sem cache) mostram como emissores todos os chunks perto do alvo da sombra. */
 function shadowChunksForce(tx,tz){const sv=SHADOW_CACHE._chVis;sv.length=0;const pad=shadowSize+75;
  for(const ch of city.chunks.values()){
   if(ch.x1<tx-pad||ch.x0>tx+pad||ch.z1<tz-pad||ch.z0>tz+pad)continue;
   const wasVis=ch.group.visible,wasMain=ch._shadowStateMain;
   if(!wasVis||wasMain!==true){sv.push(ch,wasVis,wasMain);ch.group.visible=true;ch.group.updateMatrixWorld(false);ensureChunkShadowCasters(ch,true)}}}
 function shadowChunksRestore(){const sv=SHADOW_CACHE._chVis;for(let i=0;i<sv.length;i+=3){const ch=sv[i],wv=sv[i+1],wm=sv[i+2];ch.group.visible=wv;if(wm!==undefined)ensureChunkShadowCasters(ch,wm)}sv.length=0}
 function plainShadowRender(sm,lights,scn,cam){
  if(scn===scene&&city.group&&city.group.visible&&city.chunks&&!ROOM_STAGE.mode&&S.shadows&&sun.castShadow&&lights.indexOf(sun)>=0&&(sm.autoUpdate||sm.needsUpdate)){
   shadowChunksForce(sun.target.position.x,sun.target.position.z);try{return origShadowRender(lights,scn,cam)}finally{shadowChunksRestore()}}
  return origShadowRender(lights,scn,cam)}
 renderer.shadowMap.render=function(lights,scn,cam){
  if(!SHADOW_CACHE.enabled||!renderer.capabilities.isWebGL2||scn!==scene||!city.group||!city.group.visible||!city.chunks||ROOM_STAGE.mode||ITS.on||!S.shadows||!sun.castShadow||lights.length!==1||lights[0]!==sun){
   return plainShadowRender(this,lights,scn,cam);
  }
  if(!this.enabled||(!this.autoUpdate&&!this.needsUpdate))return;
  try{
   const w=sun.shadow.mapSize.x|0,h=sun.shadow.mapSize.y|0;
   if(!SHADOW_CACHE.rt||SHADOW_CACHE.w!==w||SHADOW_CACHE.h!==h){
    if(SHADOW_CACHE.rt)SHADOW_CACHE.rt.dispose();
    SHADOW_CACHE.rt=new THREE.WebGLRenderTarget(w,h,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat});
    const pRT=renderer.getRenderTarget(),pFace=renderer.getActiveCubeFace(),pMip=renderer.getActiveMipmapLevel();
    renderer.setRenderTarget(SHADOW_CACHE.rt);renderer.clear();renderer.setRenderTarget(pRT,pFace,pMip);
    SHADOW_CACHE.w=w;SHADOW_CACHE.h=h;SHADOW_CACHE.key='';SHADOW_CACHE._verified=false;
   }
   for(const ch of city.chunks.values()){if(!ch.industryGates)continue;for(const g of ch.industryGates){if(Math.abs(g.angle-(g._shAng||0))>.004){g._shAng=g.angle;SHADOW_CACHE.gen=(SHADOW_CACHE.gen+1)|0}}}
   const tx=sun.target.position.x,tz=sun.target.position.z,sx=sun.position.x,sy=sun.position.y,szp=sun.position.z;
   const key=SHADOW_CACHE.gen+'|'+S.seed+'|'+S.style+'|'+w+'x'+h+'|'+shadowSize.toFixed(2)+'|'+(S.detailedShadows?1:0)+'|'+(S.poleShadows!==false?1:0)+'|'+this.type+'|'+tx.toFixed(3)+','+tz.toFixed(3)+'|'+sx.toFixed(2)+','+sy.toFixed(2)+','+szp.toFixed(2);
   let hit=SHADOW_CACHE.key===key&&!!sun.shadow.map;
   if(hit&&!blitShadowRT(SHADOW_CACHE.rt,sun.shadow.map,w,h)){hit=false;SHADOW_CACHE.key=''}
   if(!hit){
    shadowChunksForce(tx,tz);
    const visSaved=SHADOW_CACHE._vis;visSaved.length=0;const chs=scene.children;
    for(let i=0;i<chs.length;i++){const o=chs[i];if(o!==city.group&&o!==sun&&o!==sun.target&&o.visible){visSaved.push(o);o.visible=false}}
    const c0=renderer.info.render.calls;
    try{this.needsUpdate=true;sun.shadow.needsUpdate=true;origShadowRender(lights,scn,cam)}finally{
     for(let i=0;i<visSaved.length;i++)visSaved[i].visible=true;
     shadowChunksRestore();
    }
    SHADOW_CACHE.lastStaticCalls=renderer.info.render.calls-c0;
    if(!sun.shadow.map||!blitShadowRT(sun.shadow.map,SHADOW_CACHE.rt,w,h)){SHADOW_CACHE.enabled=false;return}
    SHADOW_CACHE.key=key;SHADOW_CACHE.misses++;
   }else{
    SHADOW_CACHE.lastStaticCalls=0;SHADOW_CACHE.hits++;
   }
   const origClear=renderer.clear,c1=renderer.info.render.calls;
   city.group.visible=false;renderer.clear=noopClear;
   try{this.needsUpdate=true;sun.shadow.needsUpdate=true;origShadowRender(lights,scn,cam)}finally{renderer.clear=origClear;city.group.visible=true}
   SHADOW_CACHE.lastDynCalls=renderer.info.render.calls-c1;
  }catch(e){console.warn('shadow cache fallback',e);SHADOW_CACHE.enabled=false;try{shadowChunksRestore()}catch(_){}return plainShadowRender(this,lights,scn,cam)}
 };
})();

/* sky dome */
/* v2 r70: SOMBRA DAS NUVENS (CLDSH). Nuvens de bom tempo (camada `fair`) agora ficam presas no mundo (plano a CLDSH.H m) e andam com o vento.
   A MESMA função de ruído (CS_GLSL, espelhada em csF) desenha a nuvem no céu e a sombra no chão: a luz direta (sol) de todo material
   lambert/phong/standard é multiplicada por csShadeF() (ShaderChunk, uniforms csA/csB compartilhados por referência, objeto simples
   para o UniformsUtils.clone não copiar). Sprites: csShadeAt() no actorLighting0. Disco do sol escurece quando a nuvem passa (csSun).
   csA: x força (0 = desligado, early-out), y frequência (1/m), z limiar, w maciez. csB: xy deslocamento (vento + projeção do plano), zw inclinação do sol. */
const CLDSH={H:260,f:1/110,A:{x:0,y:1/110,z:.7,w:.22},B:{x:0,y:0,z:0,w:0},wx:37,wz:11,lt:0,sun:0};
const CS_GLSL=`float csH(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float csN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 a=mod(i,256.),b=mod(i+1.,256.);return mix(mix(csH(a),csH(vec2(b.x,a.y)),f.x),mix(csH(vec2(a.x,b.y)),csH(b),f.x),f.y);}
float csF(vec2 p){return csN(p)*.55+csN(p*2.+vec2(17.,9.))*.3+csN(p*4.+vec2(5.,31.))*.15;}
`;
(function csPatchShaders(){try{
 const C=THREE.ShaderChunk,L=THREE.ShaderLib,G='#ifdef CS_LIT\n';
 for(const n of ['lambert','phong','standard','physical']){const l=L[n];if(l){l.vertexShader='#define CS_LIT\n'+l.vertexShader;l.fragmentShader='#define CS_LIT\n'+l.fragmentShader}}
 C.shadowmap_pars_vertex+='\n'+G+'varying vec2 vCsW;uniform vec4 csB;\n#endif\n';
 C.worldpos_vertex+='\n'+G+'{vec4 csw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\ncsw=instanceMatrix*csw;\n#endif\ncsw=modelMatrix*csw;vCsW=csw.xz-csw.y*csB.zw;}\n#endif\n';
 C.shadowmap_pars_fragment+='\n'+G+'varying vec2 vCsW;uniform vec4 csA,csB;\n'+CS_GLSL+'float csShadeF(){if(csA.x<=0.)return 1.;return 1.-csA.x*smoothstep(csA.z,csA.z+csA.w,csF(vCsW*csA.y+csB.xy));}\n#endif\n';
 const k='getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );';
 if(C.lights_fragment_begin.includes(k))C.lights_fragment_begin=C.lights_fragment_begin.replace(k,k+'\n'+G+'directLight.color*=csShadeF();\n#endif\n');
 const lk='* getShadowMask();';if(L.lambert.fragmentShader.includes(lk))L.lambert.fragmentShader=L.lambert.fragmentShader.replace(lk,'* getShadowMask() * csShadeF();');
 for(const n of ['lambert','phong','standard','physical']){const u=L[n]&&L[n].uniforms;if(u){u.csA={value:CLDSH.A};u.csB={value:CLDSH.B}}}
}catch(e){console.warn('csPatchShaders',e)}})();
function csSS(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function csFr(x){return x-Math.floor(x)}
function csHj(x,y){let a=csFr(x*.1031),b=csFr(y*.1031),c=a;const d=a*(b+33.33)+b*(c+33.33)+c*(a+33.33);a+=d;b+=d;c+=d;return csFr((a+b)*c)}
function csNj(x,y){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const ax=ix-256*Math.floor(ix/256),ay=iy-256*Math.floor(iy/256),bx=(ix+1)-256*Math.floor((ix+1)/256),by=(iy+1)-256*Math.floor((iy+1)/256);
 const h00=csHj(ax,ay),h10=csHj(bx,ay),h01=csHj(ax,by),h11=csHj(bx,by);return(h00+(h10-h00)*fx)*(1-fy)+(h01+(h11-h01)*fx)*fy}
function csFj(x,y){return csNj(x,y)*.55+csNj(x*2+17,y*2+9)*.3+csNj(x*4+5,y*4+31)*.15}
function csCoverAt(x,y,z){const A=CLDSH.A,B=CLDSH.B,n=csFj((x-y*B.z)*A.y+B.x,(z-y*B.w)*A.y+B.y),t=clamp((n-A.z)/A.w,0,1);return t*t*(3-2*t)}
function csShadeAt(x,y,z){return CLDSH.A.x>0?1-CLDSH.A.x*csCoverAt(x,y,z):1}
function csTick(){
 const U=skyMat.uniforms,s=_csV.copy(U.sunDir.value).normalize(),fair=U.fair.value||0,dt=clamp(simT-CLDSH.lt,0,.1);CLDSH.lt=simT;
 const wl=Math.hypot(WX.wx||0,WX.wz||0),wx=wl>.01?WX.wx/wl:.93,wz=wl>.01?WX.wz/wl:.37,sp=6*(1+Math.min(2,wl*2));
 CLDSH.wx=(CLDSH.wx+wx*sp*dt*CLDSH.f)%256;CLDSH.wz=(CLDSH.wz+wz*sp*dt*CLDSH.f)%256;
 const sy=Math.max(.02,s.y),slx=s.x/(sy+.12),slz=s.z/(sy+.12);CLDSH.B.z=slx;CLDSH.B.w=slz;CLDSH.B.x=CLDSH.wx+CLDSH.H*slx*CLDSH.f;CLDSH.B.y=CLDSH.wz+CLDSH.H*slz*CLDSH.f;
 /* v3 r12: zona industrial (WX.ind) sempre com nuvem baixa: mais cobertura e sombra mais forte; céu fechado de lá (U.cloud) não apaga mais a sombra. Tempestade (WX.f/gloom) apaga. */
 const ind=clamp(WX.ind||0,0,1),fairE=Math.max(fair,.65*ind),fc=.16+fairE*.36+.1*ind;CLDSH.A.y=CLDSH.f;CLDSH.A.z=1-fc-.06;CLDSH.A.w=.22-.06*ind;
 const world=S.style==='modern'&&!city.haze&&!ROOM_STAGE.mode&&!PL.inside&&!(typeof ITS!=='undefined'&&ITS.on);
 const vis=world?csSS(.01,.08,fairE)*csSS(.04,.2,s.y)*(1-csSS(.25,.6,Math.max(WX.f||0,WX.gloom||0)))*(1-(ECLIPSE.dark||0)):0;
 CLDSH.A.x=S.shadows?(.7+.15*ind)*vis:0;
 {const q=S.cloudQ;if(q===0)U.csQ.value.set(2,70,.26,1);else if(q===2)U.csQ.value.set(8,280,1.04,4);else U.csQ.value.set(4,140,.52,2); /* r22: opção NUVENS (Gráficos): 0 BAIXO = 1x (2 camadas, como r19), 1 MÉDIO = 2x, 2 ALTO = 4x */let on=U.stormK.value.w>.001;if(!on)for(const k of CELLS)if(k.s>0&&k.r<700){on=true;break}U.csOn.value=on?1:0;U.csTint.value=S.style==='synthwave'?1:S.style==='inverted'?2:0} /* 1 = Synthwave, 2 = Mundo Invertido (base vermelha, aparece por baixo do céu fechado) */ /* r21: 4x no ALTO, 2x no resto; csOn liga a camada mesmo sem nuvem de tempo bom (chuva localizada/tempestade) */
 const cp=camera.position;CLDSH.sun=vis>0?vis*csCoverAt(cp.x,cp.y,cp.z):0;U.csSun.value=CLDSH.sun;
}
const _csV=new THREE.Vector3();
const CELLS=[],CELLS_U=[];for(let i=0;i<6;i++)CELLS_U.push(new THREE.Vector4(0,0,1,0));
function makeSkyNoiseTexture(){
 const N=512,d=new Uint8Array(N*N*4),fract=x=>x-Math.floor(x),wrap=(x,n)=>((x%n)+n)%n;
 const hash=(x,y,n)=>fract(Math.sin(wrap(x,n)*127.1+wrap(y,n)*311.7)*43758.5453);
 const noise=(x,y,n)=>{const ix=Math.floor(x),iy=Math.floor(y);let fx=fract(x),fy=fract(y);fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=hash(ix,iy,n),b=hash(ix+1,iy,n),c=hash(ix,iy+1,n),e=hash(ix+1,iy+1,n);return(a+(b-a)*fx)*(1-fy)+(c+(e-c)*fx)*fy};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N*32,v=y/N*32,k=(y*N+x)*4;let val=0,amp=.5,freq=1;for(let j=0;j<5;j++){val+=amp*noise(u*freq,v*freq,32*freq);amp*=.5;freq*=2}d[k]=Math.round(val*255);d[k+1]=Math.round(noise(u,v,32)*255);d[k+2]=d[k];d[k+3]=255}
 const tex=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.generateMipmaps=false;tex.needsUpdate=true;return tex;
}
const SKY_NOISE=makeSkyNoiseTexture();
/* v79r2: estrela cadente — à noite, em média 1 por hora de jogo (≈3 min reais desde a v3 r23), risco curto com rastro que some; só no céu (shader) */
const METEOR={on:false,t:0,dur:.9,A:new THREE.Vector3(),D:new THREE.Vector3(),len:.3};
function meteorTick(dt,nf){const U=skyMat.uniforms;if(!METEOR.on){U.metK.value=0;if(!(dt>0)||nf<.6||(typeof S!=='undefined'&&S.style==='inverted'))return;if(U.cloud.value>.35)return;if(Math.random()>dt*(typeof S!=='undefined'&&S.style==='synthwave'?10:1)/(60*(typeof GMIN!=='undefined'?GMIN:1)))return; /* v2 r2.1: Synthwave = 10× mais estrelas cadentes */
  const az=Math.random()*6.2832,el=.45+Math.random()*.5,A=METEOR.A.set(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el)),e=new THREE.Vector3(-Math.sin(az),0,Math.cos(az)).multiplyScalar(Math.random()<.5?1:-1),n=new THREE.Vector3().crossVectors(A,e).normalize();if(n.y>0)n.negate();
  METEOR.D.copy(e).multiplyScalar(.75).addScaledVector(n,.65).normalize();METEOR.on=true;METEOR.t=0;METEOR.dur=.7+Math.random()*.5;METEOR.len=.22+Math.random()*.16;return}
 METEOR.t+=dt;const k=METEOR.t/METEOR.dur;if(k>=1){METEOR.on=false;U.metK.value=0;return}
 const hd=METEOR.len*k,tl=METEOR.len*Math.max(0,k-.38);U.metB.value.copy(METEOR.A).addScaledVector(METEOR.D,hd).normalize();U.metA.value.copy(METEOR.A).addScaledVector(METEOR.D,tl).normalize();U.metK.value=Math.min(1,k*6)*(1-Math.max(0,(k-.7)/.3))*1.4}
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{metA:{value:new THREE.Vector3(0,1,0)},metB:{value:new THREE.Vector3(0,1,0)},metK:{value:0},eclipsePrep:{value:0},eclipse:{value:new THREE.Vector4(0,0,0,0)},noiseTex:{value:SKY_NOISE},sunDim:{value:1},top:{value:new THREE.Color()},hor:{value:new THREE.Color()},synth:{value:0},cloud:{value:0},fair:{value:0},time:{value:0},cloudCol:{value:new THREE.Color(1,1,1)},C:{value:CELLS_U},stormK:{value:new THREE.Vector4(1,0,2,0)},stormB:{value:new THREE.Vector4(2,0,0,0)},camP:{value:new THREE.Vector3()},sunDir:{value:new THREE.Vector3(-.4,.55,-.3)},night:{value:0},gC:{value:new THREE.Vector4(0,0,1,0)},moonD:{value:new THREE.Vector4(0,-1,0,1)},csA:{value:CLDSH.A},csB:{value:CLDSH.B},csSun:{value:0},csQ:{value:new THREE.Vector4(4,140,.52,2)},csOn:{value:0},csTint:{value:0}},
 vertexShader:`varying vec3 vPr;void main(){vPr=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D noiseTex;uniform vec3 top,hor,sunDir,cloudCol,camP;uniform float synth,night,cloud,time,fair,sunDim;uniform float eclipsePrep;uniform vec3 metA,metB;uniform float metK;uniform vec4 moonD,eclipse;varying vec3 vPr;
 uniform vec4 C[6];uniform vec4 stormK,stormB;uniform vec4 gC;uniform vec4 csA,csB,csQ;uniform float csSun,csOn,csTint;${CS_GLSL}float rf(vec2 q){float r=0.;for(int i=0;i<6;i++){vec4 k=C[i];if(k.w<=0.||(i==0&&stormB.z>.5)||k.z<700.)continue; /* r21: chuva localizada não faz mais disco: vira nuvem fofa (camada fair) */float d=length(q-k.xy)/k.z;r=max(r,k.w*smoothstep(.45,.7,k.w)*(1.-smoothstep(.55,1.,d)));}return r;}
 float rfc(vec2 q){float r=0.;for(int i=0;i<6;i++){vec4 k=C[i];if(k.w<=0.||(i==0&&stormB.z>.5)||k.z<700.)continue; /* r21: chuva localizada não faz mais disco: vira nuvem fofa (camada fair) */float d=length(q-k.xy)/(k.z*3.);r=max(r,k.w*(1.-smoothstep(.35,1.,d)));}return r;}
 float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float nz(vec2 p){return texture2D(noiseTex,p/32.).g;}
 float fbm(vec2 p){return texture2D(noiseTex,p/32.).r;}
 void main(){vec3 vP=normalize(vPr);float h=vP.y;vec3 c=mix(hor,top,pow(clamp(h,0.,1.),.55));if(h<0.)c=hor*.55;float sv=0.,tr=1.; /* r52: estrelas somadas no fim, vezes a transparência do que está na frente (lua, céu fechado, nuvens) */
 if(synth>.5){vec3 sd=normalize(sunDir);float d=distance(vP,sd);float sun=1.-smoothstep(.13,.135,d);
  float st=step(.45,fract(vP.y*70.));float cut=smoothstep(sd.y+.02,sd.y-.2,vP.y);sun*=mix(1.,st,cut);
  vec3 sc=mix(vec3(1.,.74,.36),vec3(.92,.26,.58),clamp((sd.y+.25-vP.y)/.5,0.,1.))*.84;
  c=mix(c,sc,sun*.92*sunDim*(1.-eclipse.x*eclipse.w));c+=vec3(1.,.36,.62)*.18*exp(-d*5.5)*sunDim*(1.-eclipse.x*eclipse.w);
  float s=fract(sin(dot(floor(vP*380.),vec3(12.9898,78.233,37.719)))*43758.5453);sv=step(.9975,s)*smoothstep(.15,.45,h)*.9*night*step(.0312,length(vP-normalize(moonD.xyz)));
 }else{vec3 sd=normalize(sunDir);float up=smoothstep(-.1,.05,sd.y)*sunDim*(1.-eclipse.x*eclipse.w)*(1.-.85*csSun);float sdt=dot(vP,sd);float gold=smoothstep(.02,.4,sd.y);vec3 sdc=mix(vec3(1.,.62,.3),vec3(1.,.97,.88),gold),hl=mix(vec3(1.,.5,.2),vec3(1.,.95,.8),gold),hw=mix(vec3(1.,.45,.15),vec3(1.,.8,.6),gold);c+=sdc*smoothstep(.99995,.9999725,sdt)*1.4*up;c+=(hl*pow(max(sdt,0.),400.)*mix(.75,1.1,gold)+hw*pow(max(dot(vP,sd),0.),8.)*mix(.32,.2,gold))*up;
  float s=fract(sin(dot(floor(vP*380.),vec3(12.9898,78.233,37.719)))*43758.5453);sv=step(.997,s)*smoothstep(.1,.4,h)*night*.8*step(.0312,length(vP-normalize(moonD.xyz))); /* v78: estrela não aparece por cima do disco da lua */
  vec3 md=normalize(moonD.xyz);float mup=smoothstep(-.04,.06,md.y)*(.3+.7*night);
  if(eclipse.x<.5&&mup>0.){vec3 mx=normalize(cross(md,vec3(0.,1.,0.)));vec3 my=cross(mx,md);float rad=.03;vec2 p=vec2(dot(vP,mx),dot(vP,my))/rad;float r2=dot(p,p);float dm=dot(vP,md);
   if(dm>0.){float lf=abs(moonD.w);c+=vec3(.55,.65,.9)*exp(-max(0.,1.-dm)*90.)*.25*lf*mup;
    if(r2<1.){vec3 n=vec3(p,sqrt(1.-r2));float fw=abs(moonD.w);float a=fw<.01?3.1416:(1.-fw)*3.1416*(moonD.w<0.?-1.:1.);
     vec3 L=vec3(sin(a),0.,cos(a));float lit=smoothstep(-.06,.06,dot(n,L));if(fw>.01&&fw<.99){vec2 shadow=p-vec2(moonD.w<0.?-.63:.63,0.);lit=smoothstep(.98,1.02,length(shadow));}
     float cr=nz(p*2.6+3.)*.55+nz(p*6.+9.)*.3;vec3 mc=vec3(.95,.94,.88)*(1.-cr*.35);
     float edge=smoothstep(1.,.9,r2);tr*=1.-edge*step(.001,mup);c=mix(c,mix(c*.55+vec3(.03,.035,.05),mc,lit),edge*mup);}}}}
 if(eclipse.x>.5){
  vec3 es=normalize(sunDir),em=normalize(moonD.xyz);
  float ds=length(vP-es),dm=length(vP-em),sr=.0308,mr=.030;
  float disk=1.-smoothstep(sr-.0006,sr+.0006,ds),mask=1.-smoothstep(mr-.0005,mr+.0005,dm);
  // Exact overlap area: no attenuation until the apparent disks touch.
  float sep=length(es-em),coverage=0.;
  if(sep<=sr-mr)coverage=(mr*mr)/(sr*sr);
  else if(sep<sr+mr){
   float a=acos(clamp((sep*sep+sr*sr-mr*mr)/(2.*sep*sr),-1.,1.));
   float b=acos(clamp((sep*sep+mr*mr-sr*sr)/(2.*sep*mr),-1.,1.));
   float area=sr*sr*a+mr*mr*b-.5*sqrt(max(0.,(-sep+sr+mr)*(sep+sr-mr)*(sep-sr+mr)*(sep+sr+mr)));
   coverage=area/(3.14159265*sr*sr);
  }
  float occult=clamp(coverage/((mr*mr)/(sr*sr)),0.,1.);
  float emission=mix(.72,.48,occult);
  // Final halo has twice the radial falloff width of the red rim (500 vs 1000).
  float width=mix(mix(55.,170.,eclipsePrep),500.,occult*occult);
  float halo=exp(-abs(ds-sr)*width)*mix(mix(.55,.32,eclipsePrep),.38,occult);
  // Reversible, continuous warm shift only near maximum alignment.
  float redShift=smoothstep(.72,.995,occult);
  vec3 ringColor=mix(vec3(1.,.97,.90),vec3(1.,.28,.085),redShift);
  c+=ringColor*(disk*emission+halo)*(1.-mask)*eclipse.w;
  // Thin warm chromosphere with subtle red variations, outside the lunar silhouette.
  float rim=exp(-abs(ds-sr)*1000.)*.13*occult;
  c+=vec3(1.,.22,.12)*rim*(1.-mask)*eclipse.w;
  c=mix(c,vec3(.008,.009,.018),mask*disk*eclipse.w);
 }
 if(metK>0.){vec3 ab=metB-metA;float tt=clamp(dot(vP-metA,ab)/max(dot(ab,ab),1e-7),0.,1.);float dd=length(vP-(metA+ab*tt)),w=.0012+.0024*tt;c+=vec3(.92,.96,1.)*(1.-smoothstep(w*.35,w,dd))*tt*tt*metK*night;}
 float sAl=dot(vP.xz,stormK.xy),sN=stormK.w>.001?fbm(vP.xz/(abs(h)+.18)*1.7+vec2(time*.012,time*.005))-.5:0.,sAl2=sAl+sN*.5*smoothstep(-.02,.12,h);
 float msk=stormK.w*smoothstep(stormK.z-.2,stormK.z+.2,sAl2)*(1.-smoothstep(stormB.x-.2,stormB.x+.2,sAl2));
 c=mix(c,c*.38,msk*.8);tr*=1.-msk*.8;
 if(h>.02){vec3 sdn=normalize(sunDir);float sg=(1.-synth)*sunDim*smoothstep(-.14,-.02,sdn.y)*(1.-smoothstep(.06,.34,sdn.y));vec2 hz=vP.xz;float dd=(length(hz)>1e-4&&length(sdn.xz)>1e-4)?dot(normalize(hz),normalize(sdn.xz)):0.;float tw=dd*.5+.5;tw*=tw;vec3 stc=mix(vec3(1.,.56,.5),vec3(1.,.64,.3),tw);float lum=clamp(dot(cloudCol,vec3(.3333))+.4,.7,1.1); /* v79r42: sol baixo pinta as nuvens — laranja do lado do sol, rosa do lado oposto */
 vec2 uv=vP.xz/(h+.15)*1.25+vec2(time*.012,time*.005);float n=fbm(uv);vec2 cq=camP.xz+vP.xz/max(h,.04)*210.;float cv=max(max(cloud,min(1.,rfc(cq)*1.5+rf(cq)*.6)),min(1.,msk*1.25));float gcl=gC.w*(1.-smoothstep(gC.z*.4,gC.z,length(cq-gC.xy)));cv=max(cv,min(1.,gcl*1.7));float cl=smoothstep(1.-cv,1.-cv+.32,n)*smoothstep(.02,.22,h);
  vec3 cc=mix(cloudCol,cloudCol*.5,smoothstep(.45,.95,n)*cv);cc*=mix(1.,.3,msk);cc*=mix(1.,.2,gcl);{float sk=sg*(.6+.4*tw)*(1.-.7*cloud)*(1.-msk)*(1.-gcl);float edge=1.-.3*smoothstep(.45,.95,n);cc=mix(cc,stc*(.85+.4*tw)*edge*lum,sk*.9);} /* v79r43: só céu fechado (cloud) e tempestade em cima (msk/gcl) tiram a cor; nuvens de chuva ao longe também pegam o laranja */c=mix(c,cc,cl*mix(.92,.99,msk));tr*=1.-min(1.,cl*1.3);
  if(fair>.01||csOn>.5){ /* v3 r17: nuvem com cara de volumétrica (falsa): base no plano da sombra (260 m), topo a +70 m, luz pelo ruído deslocado para o sol, base grossa mais escura e borda clara contra o sol. 4 csF por pixel do céu. */float hb=max(20.,260.-camP.y);vec2 vd=vP.xz/(h+.12)*csA.y,fb=(camP.xz-csB.zw*260.)*csA.y+csB.xy,fu=fb+vd*hb;vec2 qw=camP.xz+vP.xz/(h+.12)*hb;float cb=0.;for(int i=0;i<6;i++){vec4 k=C[i];if(k.w<=0.||k.z>=700.)continue;vec2 dv=(qw-k.xy)/k.z;float d=length(dv)+(csF(fu*1.4+vec2(41.,13.)+k.xy*.01)-.5)*1.1+(csN(fu*3.1+vec2(7.,29.))-.5)*.35;cb=max(cb,k.w*smoothstep(.3,.7,k.w)*(1.-smoothstep(.35,1.1,d)));} /* r21b: contorno quebrado por ruído (sem disco) */float msk2=stormK.w*smoothstep(stormK.z-.55,stormK.z-.15,sAl2)*(1.-smoothstep(stormB.x-.2,stormB.x+.2,sAl2));float sbk=clamp(msk2-msk*.6,0.,1.)*smoothstep(.05,.3,h);float bst=max(cb*.5,sbk*.5);float cbk=clamp(cb*1.6,0.,1.); /* r21: nuvem fofa da chuva localizada (do tamanho da área) e camada da tempestade avançando à frente */float fn=csF(fu)+bst;float th=csA.z,sw=max(csA.w,.05),den=smoothstep(th,th+sw,fn);vec2 ext=vd*csQ.y;float el=length(ext);if(el>csQ.z)ext*=csQ.z/el;ext*=1.-.75*smoothstep(.3,.85,h); /* r22: olhando para cima vê-se a base, não a altura: sem 'colunas' perto do zênite */float br=smoothstep(th-sw*1.6,th+sw*.2,fn);float acc=1.,hs=0.,ws=0.;for(int i=1;i<=8;i++){if(float(i)>csQ.x)break;float t=float(i)/csQ.x;float d=smoothstep(th-sw*(.2+.1*t),th+sw*(1.5+.3*t),csF(fu+ext*t)+bst)*mix(.55,1.,br)*mix(1.,br,t);acc*=1.-d*mix(.9,.78,t);hs+=d*t;ws+=d;}float cov=1.-(1.-den)*acc,tpv=hs/(den+ws+.25); /* r21: camadas por preset (csQ: ALTO 8 = 4x, demais 4 = 2x) */ /* r17b: topo só cresce de nuvem que já existe (br) e com amostra no meio: não parece cópia deslocada */vec3 sdv=normalize(sunDir);vec2 sx=length(sdv.xz)>1e-3?normalize(sdv.xz):vec2(0.);float fs=csF(fu+sx*.4)+bst;float sl=clamp(.55+(fn-fs)*3.2,0.,1.)*smoothstep(-.12,.08,sdv.y);float thick=smoothstep(th,th+sw*2.6,fn);vec3 lit=mix(mix(cloudCol,vec3(1.),.35),stc*(.85+.45*tw)*lum,sg*(.6+.4*tw)*.9);float hgt=pow(clamp(tpv*1.1+(1.-thick)*.3,0.,1.),1.+.25*(csQ.w-1.)),su=clamp(sdv.y,0.,1.);float kl=clamp(hgt*mix(.5,.8,su)+sl*mix(.5,.2,su),0.,1.);/* r19: paleta da nuvem vem do próprio céu. Dia: base cinza-azulada, topo claro. Pôr do sol: base laranja (luz por baixo, cor do horizonte), topo mais frio/lilás (cor do topo do céu). Brilho perto do sol limitado ao céu (sem 'lanterna'). */float sgk=sg*(1.-.7*cloud)*(1.-smoothstep(.25,.6,cloud)); /* r22: céu fechado (Point Haze, zona industrial) sem base laranja: virava mancha */vec3 dB=lit*vec3(.6,.64,.72),dT=lit*1.04;vec3 sB=hor*vec3(1.12,.84,.5)+vec3(.09,.035,0.),sT=mix(top,hor,.4)*vec3(.95,.84,.9);vec3 col=mix(mix(dB,sB,sgk),mix(dT,sT,sgk),mix(kl,hgt,sgk*.6));col*=1.-.09*(csQ.w-1.)*(1.-hgt)*(1.-.5*sgk);float sdt=max(dot(vP,sdv),0.),near=pow(sdt,5.)*sgk;col*=1.-.32*near*thick;float sup=smoothstep(-.1,.05,sdv.y)*sunDim*(1.-eclipse.x*eclipse.w);float rim=clamp(cov*(1.-thick)*2.,0.,1.)*pow(sdt,60.)*sup;col+=mix(vec3(1.,.93,.8),hor,sgk)*rim*.35*(1.-.7*night);col=mix(col,min(col,c*1.12+.05),sgk);col+=vec3(.05,.035,.025)*night*(1.-hgt)*(1.-cloud);float tI=step(1.5,csTint);col=mix(col,cloudCol*(.75+.7*kl)+hor*(.2+.4*tI)*(1.-hgt),min(csTint,1.)); /* r22: Synthwave usa a cor de nuvem do estilo (roxo), não a paleta de dia */col*=1.-.42*max(cbk,sbk)*(1.-.45*hgt);float fa=cov*smoothstep(.03,.25,h)*(1.-cl*(1.-max(max(cbk,sbk),.8*tI)))*mix(.84,.95,max(cbk,sbk));c=mix(c,col,fa);tr*=1.-min(1.,fa*1.4);}}
 c+=sv*tr;
 gl_FragColor=vec4(c,1.);}`});
const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat); sky.renderOrder=10; sky.frustumCulled=false; sky.layers.set(1); scene.add(sky);

