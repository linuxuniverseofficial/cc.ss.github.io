'use strict';
/* v4 r41 · PRÉ-CARGA dos sistemas novos (picos de desempenho medidos na r40)
   Causas medidas (Chromium headless, seed 716540):
   1) Atlas 2.5D dos cães/gatos (p3Atlas) montado no meio do jogo: 70–98 ms por cor nova (32 fotos + leitura de GPU).
   2) Programas de shader soltos e recompilados: material clonado por bicho/carro/roupa recebe dispose e, quando o
      último usuário some, o three r128 apaga o programa (usedTimes 0) → o próximo recompila (bichos 3D P3_VS,
      bake dos peds 2.5D (Lambert do charModel3D), barro do carro (|mud)).
   3) Barro (mudInject) compilado na 1ª vez que aparece um carro sujo (r34/r35).
   Correção: "guardiões" (materiais que nunca recebem dispose, compilados no loading com o mesmo contexto de quem usa)
   seguram cada programa na GPU; atlas 2.5D e texturas 3D de TODAS as cores pré-montados no loading e na troca de modo.
   Nada aqui muda visual nem seed. */
const PRELOAD={keep:[],mud:new Set(),petMode:'',ms:{}};
function preKeep(m){PRELOAD.keep.push(m);return m}
/* compila uma lista de malhas numa cena (contexto de luz/fog/neblina daquela cena) e devolve as malhas para fora */
function preCompileIn(sc,cam,meshes,rt){const old=renderer.getRenderTarget();for(const m of meshes)sc.add(m);try{if(rt!==undefined)renderer.setRenderTarget(rt);renderer.compile(sc,cam)}finally{for(const m of meshes)sc.remove(m);if(rt!==undefined)renderer.setRenderTarget(old)}}
function preCam(){const c=new THREE.OrthographicCamera(-1,1,1,-1,-10,10);c.position.set(0,0,5);c.lookAt(0,0,0);return c}

/* ---------- cães e gatos ---------- */
function petPreload(force){const mode=typeof p3Mode==='function'?p3Mode():'2d';if(mode==='2d'||typeof PET3==='undefined')return 0;
 if(!force&&PRELOAD.petMode===mode)return 0;const t0=performance.now();
 const kinds=[['dog',DOG_COLS.length],['cat',CAT_COLS.length]];
 /* guardião do programa no mundo (3D) e na cena de foto (2.5D/atlas) */
 if(!PRELOAD.petMain){const m=preKeep(p3Material('dog',0)),me=new THREE.Mesh(p3Geo('dog'),m);me.position.set(0,-500,0);me.frustumCulled=false;preCompileIn(scene,camera,[me]);PRELOAD.petMain=me}
 if(!PRELOAD.petAtlas){const rt=char3DStage(64,48),m=preKeep(p3Material('cat',0)),me=new THREE.Mesh(p3Geo('cat'),m);char3DWith(()=>preCompileIn(ATLAS8.scene,preCam(),[me],rt));PRELOAD.petAtlas=me}
 for(const [k,n] of kinds){p3Geo(k);for(let ci=0;ci<n;ci++){const t=p3Paint(k,ci);try{renderer.initTexture(t)}catch(e){}
  if(mode==='25d'&&!PET3.atlas[k+ci]){PET3.built=-1;p3Atlas(k,ci)}}}
 PRELOAD.petMode=mode;return PRELOAD.ms.pets=Math.round(performance.now()-t0)}

/* ---------- bake dos peds 2.5D (charModel3D → Lambert na cena de foto) ---------- */
function pedBakePreload(){if(PRELOAD.pedBake||S.sprite8!==true||typeof charModel3D!=='function'||typeof PED_PALS==='undefined')return 0;const t0=performance.now();
 const M=charModel3D(PED_PALS[0]);char3DStage(64,96);  /* nunca dispose: guarda os programas Lambert (cor e rosto pintado) no alvo do bake (a codificação do alvo entra na chave do programa) */
 M.g.traverse(o=>{if(o.material)for(const m of [].concat(o.material))preKeep(m)});
 /* estampa de emoji da camiseta (só algumas roupas têm): Lambert com mapa, transparente, alphaTest .35 */
 {const et=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);et.needsUpdate=true;const em=preKeep(new THREE.MeshLambertMaterial({map:et,transparent:true,alphaTest:.35}));M.g.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1),em))}
 try{char3DBakeWith(()=>{const rts=[typeof ped3Scratch==='function'?ped3Scratch():null,char3DStage(64,96)];for(const rt of rts){if(!rt)continue;ATLAS8.scene.add(M.g);try{renderer.setRenderTarget(rt);renderer.compile(ATLAS8.scene,preCam())}finally{ATLAS8.scene.remove(M.g)}}})}catch(e){console.warn('pedBakePreload',e)}
 PRELOAD.pedBake=M;return PRELOAD.ms.pedBake=Math.round(performance.now()-t0)}
/* esvazia a fila de roupas fora do pool que já pediram atlas (peds nascidos no loading) */
function pedJobsDrain(maxMs){if(typeof ped3dJobTick!=='function'||S.sprite8!==true)return 0;const t0=performance.now();let n=0;
 while((PED3JOB.cur||PED3JOB.q.length)&&performance.now()-t0<maxMs){ped3dJobTick();n++}return n}

/* ---------- barro do carro (um guardião por variante de material de lataria) ---------- */
function mudPreload(L){if(typeof mudInject!=='function'||typeof vehicles==='undefined')return 0;const t0=performance.now(),meshes=[];
 const U={uMud:{value:new THREE.Vector2(.5,0)},uMudB:{value:new THREE.Vector4(1.2,1.3,.35,1)},uMudC1:{value:new THREE.Color()},uMudC2:{value:new THREE.Color()}};
 for(const c of (L||vehicles)){const sh=c&&((c.dentParts&&c.dentParts.shell)||c.dirtShell);if(!sh||!sh.material)continue;
  const base=c.grimeBase||sh.material;if(!base||base.userData&&base.userData.burnt||base.userData&&base.userData.dirt)continue;
  const bk=base.customProgramCacheKey?base.customProgramCacheKey():'',key=base.type+'|'+bk+'|'+(sh.receiveShadow?1:0)+(sh.isInstancedMesh?1:0);if(PRELOAD.mud.has(key))continue;PRELOAD.mud.add(key);
  const m=base.clone(),bob=base.onBeforeCompile;m.onBeforeCompile=(s2,r)=>{if(bob)bob.call(base,s2,r);Object.assign(s2.uniforms,U);mudInject(s2)};m.customProgramCacheKey=()=>bk+'|mud';m.userData={...base.userData,cached:true,dirt:true,keeper:true};preKeep(m);
  const me=new THREE.Mesh(sh.geometry,m);me.position.set(c.x||0,-500,c.z||0);me.castShadow=sh.castShadow;me.receiveShadow=sh.receiveShadow;me.frustumCulled=false;meshes.push(me)}
 if(meshes.length)try{preCompileIn(scene,camera,meshes)}catch(e){console.warn('mudPreload',e)}
 return PRELOAD.ms.mud=Math.round(performance.now()-t0)}

/* barro: a lataria (dentParts.shell/dirtShell) só é montada perto do jogador (LOD), então no fim do loading quase nenhum
   carro tem lataria e o mudPreload achava 0 variantes. Amostras fora da tela: um carro (carHoleL) e a moto (carLamp). */
function mudSamples(){if(typeof makeVehicle!=='function'||typeof buildCarMesh!=='function')return 0;let n=0;
 for(const ty of ['sedan','moto']){let c=null;try{c=makeVehicle(ty,PL.x,PL.z,0);if(!c.dentParts&&!c.dirtShell)buildCarMesh(c);
   const sh=(c.dentParts&&c.dentParts.shell)||c.dirtShell;if(sh&&sh.material){mudPreload([c]);n++}}
  catch(e){console.warn('mudSamples',ty,e)}finally{if(c)try{removeVehicle(c)}catch(e){}}}return n}
/* programas de sistemas antigos que só aparecem depois: sprite do ped morrendo (alphaTest .02, transparente),
   folhas ao vento (FLYLEAF, Lambert dupla face instanciado) e cúpula do paraquedas (Lambert dupla face). */
function miscPreload(){if(PRELOAD.misc)return 0;PRELOAD.misc=true;const t0=performance.now(),meshes=[];
 const tex=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);tex.needsUpdate=true;
 const sp=new THREE.Sprite(preKeep(new THREE.SpriteMaterial({map:tex,alphaTest:.02,transparent:true})));sp.position.set(0,-500,0);meshes.push(sp);
 const geo=new THREE.SphereGeometry(.1,4,3),lm=preKeep(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})),li=preKeep(new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));
 const cols=new Float32Array(geo.attributes.position.count*3).fill(1);geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
 const m1=new THREE.Mesh(geo,lm);m1.position.set(0,-500,0);m1.receiveShadow=false;meshes.push(m1);
 const m2=new THREE.InstancedMesh(geo,li,1);m2.setColorAt(0,new THREE.Color(1,1,1)); /* as folhas usam cor por instância (USE_INSTANCING_COLOR) */m2.position.set(0,-500,0);m2.receiveShadow=false;m2.frustumCulled=false;meshes.push(m2);
 /* v4 r58: neon do tuning (carNeonMesh), agora também no trânsito: mesmo material, sem instância */
 {const nm=new THREE.Mesh(new THREE.PlaneGeometry(1,1),preKeep(new THREE.MeshBasicMaterial({map:glowTex,color:0xff2ad4,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:1})));nm.position.set(0,-500,0);nm.renderOrder=3;meshes.push(nm)}
 for(const m of meshes)m.frustumCulled=false;
 try{preCompileIn(scene,camera,meshes)}catch(e){console.warn('miscPreload',e)}
 PRELOAD.miscObjs=meshes;return PRELOAD.ms.misc=Math.round(performance.now()-t0)}

/* ---------- palcos dos interiores (v4 r49) ----------
   Dentro de um interior com palco (roomStageEnter) a neblina sai e as luzes pontuais/spot da rua ficam ocultas: cada
   material visível lá dentro (paredes, atores, partículas, arma na mão) vira outra variante de programa → 8–10 programas
   compilados na 1ª entrada no cassino (medido na r48: 48 ms no swiftshader, mais o casinoBuild). O renderer.compile do
   three r128 compila TODOS os objetos da cena (até os invisíveis), então a compilação é feita numa cena temporária com só o
   que o palco mantém: luzes ambiente/direcional/hemisférica, a raiz de cada interior, o jogador, alguns atores e as
   partículas. Cassino/boate e banco (montados só na 1ª entrada) passam a ser montados no loading. */
function stagePreload(){if(PRELOAD.stageCity===city)return 0;PRELOAD.stageCity=city;const t0=performance.now();
 if(!city.haze){try{if(!CAS.grp&&city.casino)casinoBuild()}catch(e){console.warn('stagePreload cassino',e)}
  try{if(!BANK.grp&&typeof bankBuild==='function'&&city.bankDoor&&SAFE.IN)bankBuild()}catch(e){console.warn('stagePreload banco',e)}}
 const roots=[];for(const k of ['safe','ammo','shop','mall','casino','pawn','bank','jail','motel','lab']){let r=null;try{r=roomStageRoot(k)}catch(e){}if(r&&r.parent&&!roots.includes(r))roots.push(r)}
 if(!roots.length)return PRELOAD.ms.stage=0;
 const tmp=new THREE.Scene(),moved=[],take=o=>{if(!o||!o.parent||o.parent===tmp)return;moved.push([o,o.parent,o.parent.children.indexOf(o),o.visible]);tmp.add(o)};
 for(const o of [...scene.children])if((o.isAmbientLight||o.isDirectionalLight||o.isHemisphereLight)&&o.visible)take(o);try{if(boomLight&&boomLight.parent===scene)take(boomLight)}catch(e){} /* o laço principal religa a luz da explosão a cada quadro, então ela conta lá dentro */
 for(const r of roots){take(r);r.visible=true}
 take(PL.sp);take(PL.sh);try{if(HELD&&HELD.g)take(HELD.g)}catch(e){}
 /* arma/faca/taco na mão: o palco mantém o HELD.g visível, mas no loading ele ainda não existe → amostras de cada tipo (ficam guardadas: material descartado solta o programa) */
 if(!PRELOAD.held){PRELOAD.held=[];for(const k of ['gun','smg','magnum','rpg','grenade','remote','jammer','knife','bat','flame']){try{const p=k==='flame'?{g:ammoShowcaseWeapon('flame')}:makePickup('__pre',0,-9999,0,{pickups:[]},k);const i=pickups.indexOf(p);if(i>=0)pickups.splice(i,1);try{removePickupGlow(p)}catch(e){}if(p.g){if(p.g.parent)p.g.parent.remove(p.g);p.g.position.set(0,-9999,0);p.g.traverse(o=>{if(o.isMesh)o.castShadow=false});PRELOAD.held.push(p.g)}}catch(e){}}}
 for(const g of PRELOAD.held)tmp.add(g);try{take(PART_NORM_IM);take(PART_ADD_IM)}catch(e){}
 let n=0;for(const q of peds){if(n>=6)break;if(q&&q.sp&&q.sp.parent===scene){take(q.sp);if(q.sh)take(q.sh);n++}}
 try{const L=tmp.children.filter(o=>o.isLight&&(o.isDirectionalLight||o.isPointLight)),vis=L.map(o=>o.visible),D=L.filter(o=>o.isDirectionalLight),P=L.filter(o=>o.isPointLight);
  /* o palco alterna sol (dia/noite) e luz da explosão: compila as 4 combinações */
  for(const d of [1,0])for(const q of [1,0]){D.forEach(o=>o.visible=!!d);P.forEach(o=>o.visible=!!q);renderer.compile(tmp,camera)}
  L.forEach((o,i)=>o.visible=vis[i])}catch(e){console.warn('stagePreload',e)}
 finally{for(const g of PRELOAD.held||[])tmp.remove(g);for(let i=moved.length-1;i>=0;i--){const [o,par,idx,vis]=moved[i];tmp.remove(o);par.children.splice(Math.max(0,Math.min(idx,par.children.length)),0,o);o.parent=par;o.visible=vis}}
 return PRELOAD.ms.stage=Math.round(performance.now()-t0)}

/* ---------- boneco 3D × combinações de luz (v4 r49) ----------
   O material do boneco PS1 (c3Material, ShaderMaterial com fog) só nasce quando o 1º personagem é posicionado, e a chave do
   programa no three r128 inclui fog e a contagem de luzes (sol, pontuais, holofote, hemisférica). Na rua a contagem muda
   (farol do jogador à noite, luz da explosão) e no palco dos interiores não há fog → 1–2 programas novos no meio do jogo.
   Compila um boneco de amostra numa cena temporária com as luzes reais do mundo em todas as combinações. */
function lightVariantsCompile(objs){const tmp=new THREE.Scene(),moved=[],L=scene.children.filter(o=>o.isLight&&!o.isAmbientLight);
 for(const o of L)moved.push([o,scene.children.indexOf(o),o.visible]);for(const o of L)tmp.add(o);const back=[];for(const o of objs){back.push([o,o.parent]);tmp.add(o)}
 const D=L.filter(o=>o.isDirectionalLight),P=L.filter(o=>o.isPointLight),SP=L.filter(o=>o.isSpotLight),H=L.filter(o=>o.isHemisphereLight);
 try{for(const f of [scene.fog,null])for(let q=0;q<=P.length;q++)for(const sp of SP.length?[1,0]:[0]){ /* sol e hemisférica ficam sempre ligados (rua e palco) */
   tmp.fog=f;D.forEach(o=>o.visible=true);H.forEach(o=>o.visible=true);P.forEach((o,i)=>o.visible=i<q);SP.forEach(o=>o.visible=!!sp);renderer.compile(tmp,camera)}}
 catch(e){console.warn('lightVariantsCompile',e)}
 finally{for(const [o,par] of back){tmp.remove(o);if(par)par.add(o)}for(const [o,idx,vis] of moved.sort((a,b)=>a[1]-b[1])){tmp.remove(o);scene.children.splice(Math.min(idx,scene.children.length),0,o);o.parent=scene;o.visible=vis}tmp.fog=null}}
function c3LightPreload(){if(typeof C3_ON!=='function'||!C3_ON()||typeof c3Material!=='function')return 0;const t0=performance.now();
 if(!PRELOAD.c3m){PRELOAD.c3m=new THREE.Mesh(c3Geo(),c3Material());PRELOAD.c3m.frustumCulled=false}
 lightVariantsCompile([PRELOAD.c3m]);return PRELOAD.ms.c3=Math.round(performance.now()-t0)}
/* ---------- pontes levadiças (v4 r49) ----------
   O dbTick só monta as pontes no 1º quadro de jogo (depois do warmCityGPU) → a película molhada da pista (ShaderMaterial
   '|boatBridge') e os materiais da pista compilavam no meio do jogo (1º passeio perto da ponte / 1ª chuva). Monta aqui do
   mesmo jeito que o dbTick (mesma chave DB.key, então o 1º quadro só confere e não refaz) e compila com a película ligada. */
function dbPreload(){if(!city.dbs||!city.dbs.length||typeof dbBuild!=='function')return 0;const t0=performance.now();
 const k=S.seed+':'+S.style;if(DB.key!==k||DB.ref!==city.dbs){DB.key=k;DB.ref=city.dbs;for(const g of DB.groups)scene.remove(g);DB.groups=[];
  for(const d of city.dbs){if(d.g){scene.add(d.g);DB.groups.push(d.g)}else try{dbBuild(d)}catch(e){console.error(e)}}}
 const films=[];for(const d of city.dbs)for(const f of d.wetSurfaces||[])films.push([f,f.visible]);films.forEach(([f])=>f.visible=true);
 try{lightVariantsCompile(DB.groups.slice())}finally{films.forEach(([f,v])=>f.visible=v)}
 return PRELOAD.ms.db=Math.round(performance.now()-t0)}
/* ---------- ganchos ---------- */
/* fim do loading: chamado pelo warmCityGPU (e na troca de modo de personagem, que também chama o charPreload3D) */
{const _cp=charPreload3D;charPreload3D=function(){const r=_cp.apply(this,arguments);
 try{pedBakePreload()}catch(e){console.error(e)}try{c3LightPreload()}catch(e){console.error(e)}try{petPreload(true)}catch(e){console.error(e)}return r}}
{const _w=warmCityGPU;warmCityGPU=async function(){const r=await _w.apply(this,arguments);
 try{setLoadProgress(98,'PREPARANDO BICHOS, BARRO E ROUPAS…');await nextTimeFrame()}catch(e){}
 try{mudPreload();PRELOAD.ms.mudSamples=mudSamples()}catch(e){console.error(e)}try{miscPreload()}catch(e){console.error(e)}try{stagePreload()}catch(e){console.error(e)}try{dbPreload()}catch(e){console.error(e)}try{c3LightPreload()}catch(e){console.error(e)}try{PRELOAD.ms.jobs=pedJobsDrain(IS_MOBILE?1500:4000)}catch(e){console.error(e)}
 console.log('[pré-carga v4]',JSON.stringify(PRELOAD.ms));return r}}
/* ---------- poças / asfalto molhado (v4 r60) ----------
   As 2 malhas do WET (rua e calçada) nascem invisíveis e só compilavam na 1ª chuva (pico no meio do jogo). Depois de cada buildWet
   (no generateCity) são compiladas numa cena temporária (só elas, mesma neblina). */
buildWet=(f=>function(){const r=f.apply(this,arguments);try{if(typeof WET!=='undefined'&&WET.mesh){const ms=[WET.mesh,WET.mesh2].filter(Boolean),vis=ms.map(m=>m.visible),tmp=new THREE.Scene();tmp.fog=scene.fog;
 ms.forEach(m=>{m.visible=true;tmp.add(m)});try{renderer.compile(tmp,camera)}finally{ms.forEach((m,i)=>{m.visible=vis[i];scene.add(m)})}}}catch(e){console.warn('wetPreload',e)}return r})(buildWet);
