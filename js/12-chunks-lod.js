'use strict';
/* Coastal Chaos · js/12-chunks-lod.js — Mapa de carregamento, distância, LOD e culling dos chunks.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
function paintChunkMap(ch){if(!mapCv||ch.painted)return;ch.painted=true;const g=mapCv.getContext('2d'),m=city.st.map;
 for(const ri of ch.rects){const k=city.info[ri].kind;if(k!=='bld'&&k!=='houses')continue;const r=city.rects[ri];g.fillStyle=k==='houses'?'#8fa070':m.block;g.fillRect(r[0]+SW+MOFF,r[1]+SW+MOFF,r[2]-r[0]-2*SW,r[3]-r[1]-2*SW)}
 for(const c of ch.cols){if(c.kind!=='bld')continue;const hz=city.rects.some((r,i)=>city.info[i].kind==='houses'&&c.x0>=r[0]&&c.x1<=r[2]&&c.z0>=r[1]&&c.z1<=r[3]);
  g.fillStyle=hz?'#c9a27a':m.bld;g.fillRect(c.x0+MOFF,c.z0+MOFF,c.x1-c.x0,c.z1-c.z0)}}
/* v79r46: tela de carregamento desenha o mapa cru da cidade (o mesmo canvas do minimapa, sem marcadores) pedaço por pedaço,
   na ordem em que os chunks ficam prontos — o chunk recém-feito ganha contorno amarelo até o próximo. Só decorativo. */
const LMAP={ctx:null,last:null};
function loadMapStart(){const c=$('#loadMap');LMAP.last=null;LMAP.ctx=null;if(!c||!mapCv){if(c)c.hidden=true;return}c.width=mapCv.width;c.height=mapCv.height;const g=c.getContext('2d');g.fillStyle='#05070c';g.fillRect(0,0,c.width,c.height);LMAP.ctx=g;c.hidden=false}
function loadMapPaint(ci,cj){const g=LMAP.ctx;if(!g||!mapCv)return;const W=mapCv.width,H=mapCv.height,cl=(v,m)=>Math.max(0,Math.min(m,v));
 const put=r=>{if(r[2]>0&&r[3]>0)g.drawImage(mapCv,r[0],r[1],r[2],r[3],r[0],r[1],r[2],r[3])};if(LMAP.last)put(LMAP.last);
 const b=chunkBox(ci,cj),x0=cl(Math.floor(b[0]+MOFF),W),z0=cl(Math.floor(b[1]+MOFF),H),x1=cl(Math.ceil(b[2]+MOFF),W),z1=cl(Math.ceil(b[3]+MOFF),H),r=[x0,z0,x1-x0,z1-z0];put(r);
 const lw=Math.max(2,W/220);g.strokeStyle='#ffd23a';g.lineWidth=lw;g.strokeRect(r[0]+lw/2,r[1]+lw/2,r[2]-lw,r[3]-lw);LMAP.last=r}
function loadMapEnd(){if(LMAP.last&&LMAP.ctx&&mapCv){const r=LMAP.last;if(r[2]>0&&r[3]>0)LMAP.ctx.drawImage(mapCv,r[0],r[1],r[2],r[3],r[0],r[1],r[2],r[3])}LMAP.last=null}
async function preloadCityRegions(){const n=Math.ceil(city.N/CS),total=n*n;let done=0;try{loadMapStart()}catch(e){}
 for(let ci=0;ci<n;ci++)for(let cj=0;cj<n;cj++){if(!city.chunks.has(ci+','+cj))buildChunk(ci,cj);try{loadMapPaint(ci,cj)}catch(e){}done++;setLoadProgress(10+Math.round(done/total*33),'CARREGANDO CIDADE · '+done+' / '+total);await nextTimeFrame()}try{loadMapEnd()}catch(e){}}
// A cidade inteira fica residente na memória durante a partida (pré-carregada em generateCity).
// Não desenhar atrás do fim da névoa. Atualiza apenas quando a distância
// muda de faixa (8 m), inclusive em tempestades: não recalcular a projeção a cada quadro.
// Os 5..12 m de folga ficam totalmente encobertos pela névoa, evitando cortes.
function syncFogDrawDistance(){
 applyDrawFog();
 const fog=scene.fog;if(!fog||!Number.isFinite(fog.far))return;
 const far=Math.max(32,Math.ceil((fog.far+5)/8)*8);
 if(Math.abs(camera.far-far)<.01)return;
 camera.far=far;camera.updateProjectionMatrix();
 // A esfera do céu precisa ficar ATRÁS do alcance visível da névoa e DENTRO
 // da câmera; .9 fazia o céu cobrir objetos próximos ao novo recorte.
 sky.scale.setScalar(far*.995/1500);
}
const _fr=new THREE.Frustum(),_pm=new THREE.Matrix4(),_bx=new THREE.Box3();
// v231: LOD só altera o material quando um chunk cruza uma faixa de distância.
// A lista é limpa ao gerar uma nova cidade para não segurar materiais antigos na memória.
let FAR_MATERIALS=new WeakMap();const FAR_MATERIAL_PAIRS=[];
function farMaterial(src){
 let m=FAR_MATERIALS.get(src);
 if(!m){m=new THREE.MeshLambertMaterial({map:src.map,vertexColors:src.vertexColors,side:src.side,transparent:src.transparent,opacity:src.opacity,alphaTest:src.alphaTest,emissiveMap:src.emissiveMap,fog:src.fog,polygonOffset:src.polygonOffset,polygonOffsetFactor:src.polygonOffsetFactor,polygonOffsetUnits:src.polygonOffsetUnits});
  if(src.userData.surfaceAtlas){m.onBeforeCompile=surfaceAtlasShader;m.userData.surfaceAtlas=true}
  if(src.userData.isoFade)isoFadeMaterial(m);
  if(src.userData.bridgeVisual)bridgeVisualMaterial(m);
  m.color.copy(src.color);m.emissive.copy(src.emissive);m.emissiveIntensity=src.emissiveIntensity;
  FAR_MATERIALS.set(src,m);FAR_MATERIAL_PAIRS.push({src,m});if(city.mats)city.mats.push(m)
 }
 return m;
}
// Sincroniza uma vez POR MATERIAL compartilhado, não uma vez POR MESH/POR CHUNK.
// Mantém os materiais distantes coerentes com horário, clima e outras alterações dinâmicas.
function syncFarMaterials(){
 for(const {src,m} of FAR_MATERIAL_PAIRS){
  if(!m.color.equals(src.color))m.color.copy(src.color);
  if(!m.emissive.equals(src.emissive))m.emissive.copy(src.emissive);
  if(m.emissiveIntensity!==src.emissiveIntensity)m.emissiveIntensity=src.emissiveIntensity;
  if(m.opacity!==src.opacity)m.opacity=src.opacity;
 }
}
// v241: transição de LOD em dither: pixels alternados saem gradualmente.
// Não usa transparent/opacity nem recria geometria ou objetos por frame.
// Cada malha combinada mantém seu próprio uniform (programa GLSL compartilhado).
function lodSoftBind(mesh,initAlpha,reverse=false){
 if(!mesh||!mesh.material)return null;
 const src=mesh.material,mat=src.clone(),before=src.onBeforeCompile;
 const uni={value:initAlpha},rev={value:reverse?1:0};
 mat.onBeforeCompile=function(sh,renderer){
  if(before)before.call(this,sh,renderer);
  sh.uniforms.pcLodVis=uni;sh.uniforms.pcLodReverse=rev;
  sh.fragmentShader='uniform float pcLodVis;uniform float pcLodReverse;\n'+sh.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
   // Dither estável em pixels: dispensa sorting e depthWrite transparente.
   if(pcLodVis<0.999){
    float cell=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
    if(pcLodReverse>0.5)cell=1.0-cell;
    if(cell>pcLodVis)discard;
   }`);
 };
 mat.customProgramCacheKey=()=>src.customProgramCacheKey()+'|chunkDither-v241';
 if(src.userData&&src.userData.isoFade)ISOFADE.mats.add(mat);
 // v78: o clone do LOD perdia o acender da noite — neonDN divide a MESMA cor animada; placas dnSign entram no DN_SIGNS
 if(city.M&&src===city.M.neonDN)mat.color=src.color;
 if(DN_SIGNS.has(src)){mat.userData.dnClone=true;DN_SIGNS.add(mat)}
 mesh.userData.pcLodSoft=true;
 city.mats.push(mat);
 const vis=initAlpha>0.004;mesh.visible=vis;
 mesh.material=initAlpha>=0.999?src:mat;
 return {mesh,srcMat:src,ditherMat:mat,uni,alpha:initAlpha,target:initAlpha};
}
const lodSmooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function lodSoftAssignMat(mesh,m){
 if(typeof ITS!=='undefined'&&ITS.on&&mesh.material&&mesh.material.userData&&mesh.material.userData.its){if(mesh.userData.itsOrig!==m){mesh.userData.itsOrig=m;mesh.material=itsFor(m,mesh)}}
 else if(mesh.material!==m)mesh.material=m;
}
function lodSoftStep(s,target,k){
 if(!s)return;
 /* v3 r5: só escreve quando muda (gravar número quebrado em campo genérico cria um objeto novo a cada vez) */
 if(s.alpha!==target){if(Math.abs(target-s.alpha)<.006)s.alpha=target;
 else s.alpha+=(target-s.alpha)*k}
 if(s.uni.value!==s.alpha)s.uni.value=s.alpha;
 const vis=s.alpha>.004;
 if(s.mesh.visible!==vis)s.mesh.visible=vis;
 if(vis)lodSoftAssignMat(s.mesh,s.alpha>=.999?s.srcMat:s.ditherMat);
}
function chunkLod(ch,d,immediate=false){
 // v241: mantém a grade 2x2 e os limites da v240.
 // Desktop 50/70/100m; mobile 16/40/80m. Fade espacial + temporal.
 const factor=objectDistanceFactor(),nearLimit=(MOB_LITE?16:50)*factor,midLimit=(MOB_LITE?40:70)*factor,farLimit=(MOB_LITE?80:100)*factor;
 // Abertura das faixas: dither progressivo, sem alterar as distâncias médias.
 const nw=(MOB_LITE?4:7)*factor,mw=(MOB_LITE?5:8)*factor,fw=(MOB_LITE?7:10)*factor;
 const near=1-lodSmooth(nearLimit-nw,nearLimit+nw,d);
 const mid=1-lodSmooth(midLimit-mw,midLimit+mw,d);
 const far=1-lodSmooth(farLimit-fw,farLimit+fw,d);
 const windows=(1-mid)*far;
 const farMat=ch._far===undefined?d>farLimit:d>(ch._far?farLimit-5:farLimit+5);
 if(!ch._lodMeshes){ch._lodMeshes=[];ch.group.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&o.material!==city.M.plant&&o.material!==city.M.cloth&&o.material!==city.M.signal&&!o.material.transparent&&!o.isInstancedMesh)ch._lodMeshes.push({o,near:o.material})})}
 if(!ch._lodFade){
  // São malhas batch já existentes. Apenas um clone de material por batch.
  const batch=(meshes,a,reverse=false)=>meshes.filter(Boolean).map(o=>lodSoftBind(o,a,reverse)).filter(Boolean);
  ch._lodFade={near:batch([ch.lodNearMesh,ch.fenceMesh],near),
   mid:batch([ch.lodMidMesh,ch.markMesh,ch.binMesh,ch.wireIns,ch.tlpMesh,ch.plantMesh,ch.forestTreeMesh,ch.glowMesh,ch.neonMesh,ch.neonDNMesh,ch.adMesh,ch.magMesh,...(ch.tlIMs||[])],mid),
   windows:batch([ch.lodFarWindowMesh],windows,true),
   // v78: postes (haste + luminária) somem com dither na faixa "far" (100 m desktop / 80 m mobile × OBJECT DISTANCE).
   // Antes ficavam sempre, chunk inteiro, até o fim da névoa. O brilho noturno (glow) continua.
   far:batch([ch.lampIM&&ch.lampIM.pole,ch.lampIM&&ch.lampIM.head],far)};
  // Exclui os materiais animados do fallback Lambert, que ocultaria o dither.
  ch._lodMeshes=ch._lodMeshes.filter(e=>!e.o.userData.pcLodSoft);
  ch._lodFadeT=performance.now();
  ch._geoShadow=undefined;
 }
 if(ch._far!==farMat){for(const e of ch._lodMeshes)lodSoftAssignMat(e.o,farMat?farMaterial(e.near):e.near);ch._far=farMat}
 const t=performance.now(),dt=clamp((t-ch._lodFadeT)/1000,0,.05);ch._lodFadeT=t;
 // Aproximadamente 0,3 s para acompanhar a nova faixa, até em teleporte.
 const k=immediate?1:1-Math.exp(-11*dt);
 for(const s of ch._lodFade.near)lodSoftStep(s,near,k);
 for(const s of ch._lodFade.mid)lodSoftStep(s,mid,k);
 for(const s of ch._lodFade.windows)lodSoftStep(s,windows,k);
 for(const s of ch._lodFade.far||[])lodSoftStep(s,far,k);
 // v259: Shadow casters are classified once per chunk. This NEVER changes visibility,
 // geometry, sprite rendering or the dithered LOD; only castShadow of STATIC batches.
 const shadowReach=Math.max(shadowDistanceMeters(),shadowSize*1.35);
 ensureChunkShadowCasters(ch,d<shadowReach);
}
function ensureChunkShadowCasters(ch,mainCast){
 if(!ch._shadowCasterGroups){
  const details=new Set([ch.detMesh,ch.binMesh,ch.lodNearMesh,ch.lodMidMesh].filter(o=>o&&o.isMesh&&!o.isSprite));
  const poles=new Set(ch.group.children.filter(o=>o.isMesh&&o.castShadow&&(o.geometry===city.M.poleGeo||o===ch.tlpMesh)));
  ch._shadowCasterGroups={
   main:ch.group.children.filter(o=>o.isMesh&&!o.isSprite&&o.castShadow&&!details.has(o)&&!poles.has(o)),
   details:[...details],poles:[...poles]
  };
  ch._shadowStateMain=undefined;ch._shadowStateDetails=undefined;ch._shadowStatePoles=undefined;
 }
 const detailCast=S.detailedShadows===true&&mainCast;
 if(ch._shadowStateMain!==mainCast){
  for(const m of ch._shadowCasterGroups.main)m.castShadow=mainCast;
  ch._shadowStateMain=mainCast;
 }
 {const pc=S.poleShadows!==false&&mainCast;if(ch._shadowStatePoles!==pc){for(const m of ch._shadowCasterGroups.poles||[])m.castShadow=pc;ch._shadowStatePoles=pc}}
 if(ch._shadowStateDetails!==detailCast){
  for(const m of ch._shadowCasterGroups.details)m.castShadow=detailCast;
  ch._shadowStateDetails=detailCast;
 }
}
function cullChunks(){camera.updateMatrixWorld();_pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);_fr.setFromProjectionMatrix(_pm);
 for(const ch of city.chunks.values()){_bx.min.set(ch.x0-12,-5,ch.z0-12);_bx.max.set(ch.x1+12,(ch.y1||60)+8,ch.z1+12);const d=Math.hypot(Math.max(ch.x0-camera.position.x,0,camera.position.x-ch.x1),Math.max(ch.z0-camera.position.z,0,camera.position.z-ch.z1));
  const visible=d<=(scene.fog?.far??drawDistanceMeters())+12&&_fr.intersectsBox(_bx);
  if(ch.group.visible!==visible)ch.group.visible=visible;
  if(visible)chunkLod(ch,d)
 }
 syncFarMaterials();
}

