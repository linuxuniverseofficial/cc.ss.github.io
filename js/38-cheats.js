'use strict';
/* Coastal Chaos · js/38-cheats.js — Laço principal (variáveis), cheats, Themask, ImpossibleToSee.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= MAIN LOOP ================= */
let last=performance.now(),fpsFrameLast=0,fpsAccumulator=0,recycleT=0,hudT=0;
let popT=0;
/* ================= CHEATS (nao permitem salvar o jogo) ================= */
const CHEAT={hp:false,ammo:false,car:false,wanted:false,used:false};
function cheatTick(){
 if(CHEAT.hp||CHEAT.ammo||CHEAT.car||CHEAT.wanted)CHEAT.used=true;
 if(CHEAT.hp&&!PL.dead)PL.hp=Math.max(PL.hp,100);
 if(CHEAT.ammo&&GUN.has){GUN.ammo=Math.max(GUN.ammo,99);if(GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=Math.max(GUN.inv[GUN.w].ammo||0,99)}
 const pc=PL.car;
 if(CHEAT.car&&pc){pc.hp=Math.max(pc.hp,100);if(!pc.alive){pc.alive=true;pc.exploded=false;pc.burn=0;pc.fuse=0}}
 if(CHEAT.wanted&&POL.wanted)endWanted(true);
}

/* cheats de deslocamento — aparecem ao lado do alvo, nunca sobre ele. */
function cheatWarp(x,z){
 if(PL.car){const c=PL.car;c.thr=0;c.hand=true;c.steerT=0;PL.lastCar=c;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}
 PL.inside=false;PL.dead=false;PL.x=x;PL.z=z;PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.down=0;PL.rot=0;
 circleVsWorld(PL,.45);circleVsCars(PL,.45,true);
 PL.gy=groundY(PL.x,PL.z);camT.x=PL.x;camT.z=PL.z;
 updateCamera(0);
}
let teleportMode=false;
function teleportToMarker(){
 if(!teleportMode||!NAV.marker||NAV.misMarker)return;
 const target={...NAV.marker};
 {const ev=eventLock();if(ev){toast('TELEPORT BLOQUEADO · '+ev+'');return}}
 cheatWarp(target.x,target.z);
 NAV.marker=null;NAV.route=null;
 if(NAV.beam)NAV.beam.visible=false;
 if(NAV.open)closeMap();
 toast('TELEPORT · DESTINO ALCANÇADO');
}
function cheatTeleport(){
 teleportMode=!teleportMode;
 if(teleportMode)teleportToMarker();
}
function cheatBackToTheFuture(){
 let list=vehicles.filter(c=>c.alive&&c.type==='super'&&c.special);
 // Garagens distantes podem ainda nao ter sido criadas pelo streaming.
 // Construimos somente os chunks das garagens especiais mais proximas, se necessario.
 if(!list.length){const garages=[];for(let i=0;i<city.info.length;i++)if(city.info[i].garage){const r=city.rects[i];if(r)garages.push({x:(r[0]+r[2])*.5,z:(r[1]+r[3])*.5})}
 garages.sort((a,b)=>Math.hypot(a.x-PL.x,a.z-PL.z)-Math.hypot(b.x-PL.x,b.z-PL.z));
 for(const g of garages){const [ci,cj]=chunkOf(g.x,g.z),key=ci+','+cj;if(!city.chunks.has(key))buildChunk(ci,cj);list=vehicles.filter(c=>c.alive&&c.type==='super'&&c.special);if(list.length)break}}
 if(!list.length){toast('NENHUM BACK TO THE PAST ENCONTRADO');return}
 list.sort((a,b)=>Math.hypot(a.x-PL.x,a.z-PL.z)-Math.hypot(b.x-PL.x,b.z-PL.z));const c=list[0];
 const ca=Math.cos(c.a),sa=Math.sin(c.a),offset=c.t.W*.5+1.15;
 let target=null;
 for(const [side,forward] of [[1,0],[-1,0],[1,-1.4],[-1,-1.4]]){
  const x=c.x-sa*side*offset+ca*forward,z=c.z+ca*side*offset+sa*forward;
  const p={x,z};circleVsWorld(p,.45);
  if(Math.hypot(p.x-x,p.z-z)<.4){target=p;break}
 }
 if(!target){target={x:c.x-sa*(c.t.W*.5+2.3),z:c.z+ca*(c.t.W*.5+2.3)};circleVsWorld(target,.45)}
 cheatWarp(target.x,target.z);
 toast('<span style="color:#56f4d6">BACK TO THE PAST</span>');
}
function cheatUpsideDown(){
 const o=INVERT.portal;if(!o||INVERT.shift<=0){toast('A FENDA ESTÁ FECHANDO · AGUARDE A PRÓXIMA');return}
 const r=o.ref,along=r.along,side=INVERT.side;
 // 3.8 m da parede, proximo da fenda mas fora do gatilho de travessia.
 let x=o.x,z=o.z;if(along)x+=(side<0?1:-1)*3.0;else z+=(side<0?1:-1)*3.0;
 let pos={x,z};circleVsWorld(pos,.45);
 if(Math.hypot(pos.x-o.x,pos.z-o.z)<2.4){pos={x:o.x+(along?(side<0?4:-4):0),z:o.z+(!along?(side<0?4:-4):0)};circleVsWorld(pos,.45)}
 cheatWarp(pos.x,pos.z);
 toast('<span style="color:#ff3c50">UPSIDE DOWN</span><br><small style="color:#fff">fenda localizada · '+Math.max(1,Math.ceil(INVERT.shift))+' s restantes — aproxime-se para atravessar</small>');
}

/* ================= v227: THEMASK / TORNADO LEVE ================= */
/* v78 · MASKARA: item de verdade (achada no cofre da sala 207 do laboratório, ilha Point Haze) e não cheat. Fica na roda de armas,
   na fatia do JAMMER (página 2/2). Vestir/tirar = rodopio rápido com "vento" (fitas aditivas em hélice, mesma linguagem do rastro da
   câmera lenta da Claire) + partículas. Com ela: imortal, supervelocidade a pé e todo carro dirigido ganha nitro (SHIFT).
   O cheat THEMASK continua existindo e usa o mesmo efeito. */
const MASK={original:null,t:0,fx:null,positions:null,geom:null,have:false,off:false,wind:null,DUR:1.5};
const MASK_SUIT={skin:'#34b846',hair:'#34b846',long:false,cap:'#f1d521',capDark:'#b4941a',shirt:'#efd123',pants:'#edca20',belt:'#191919',shoes:'#101015',stripe:null,necklace:null,glasses:null,headphone:null,bag:null,pack:false,swim:null,maskSuit:true};
function maskOn(){return !!MASK.original&&!MASK.fx&&!MASK.off}
/* v78: proteção já vale durante o rodopio de vestir (vestir em queda livre cancela a morte) */
function maskSafe(){return !!MASK.original&&!MASK.off}
/* situações em que tirar a Maskara mataria: sobre a água, em queda livre, de paraquedas no ar, queimando ou no chão */
function maskRisky(){return (!PL.inside&&!PL.car&&!PL.heli&&inWater(PL.x,PL.z))||(typeof LH!=='undefined'&&LH.fall)||(PARA.active&&!PARA.active.roof)||(PL.jy||0)>1.5||MASK.burnT>0||PL.down>0}
/* v78: reações da Maskara (valem em 2D e 3D: a tinta vai no actorTint do sprite, que os dois modos usam) */
const MASK_LINES={burn:['Tô defumado!','Esse churrasco é dos bons!','Ao ponto, por favor!','Alguém pediu bem passado?'],
 fall:['Essa vai deixar marca!','Essa doeu!','Ai, minha coluna… brincadeira!','Chão: 1. Eu: imortal.'],
 hit:['Fez cócegas!','Só isso?','Errou… quer dizer, acertou. Mas não doeu!','Minha vez!']};
function maskSay(kind){const L=MASK_LINES[kind],t=simT;if(t<(MASK.sayT||0))return;MASK.sayT=t+3.2;say(PL,translatePlain(L[Math.floor(Math.random()*L.length)]),3)}
function maskBurn(){if(!PLAYER_PAL.burnt&&!(MASK.fadeT>0&&MASK.fadeTo==='burnt')){MASK.fadeT=.6;MASK.fadeTo='burnt'}MASK.burnT=10;MASK.sayT=0;maskSay('burn');setTimeout(()=>{if(MASK.burnT>4){MASK.sayT=0;maskSay('burn')}},4200)}
function maskFall(){PL.down=Math.max(PL.down||0,1.6);PL.rot=Math.PI/2;PL.vx=PL.vz=0;try{thud(9)}catch(e){}for(let i=0;i<12;i++)emit(PL.x,PL.gy+.2,PL.z,(Math.random()-.5)*4,1+Math.random()*2,(Math.random()-.5)*4,.7,.4,1.2,0x9a8a70,false,.6);MASK.sayT=0;maskSay('fall')}
function maskFxClear(){if(MASK.fx){scene.remove(MASK.fx);MASK.geom.dispose();MASK.fx.material.dispose();MASK.fx=null;MASK.geom=null;MASK.positions=null}
 if(MASK.wind){scene.remove(MASK.wind.mesh);MASK.wind.geo.dispose();MASK.wind.mesh.material.dispose();MASK.wind=null}maskGhostEnd()}
function maskReset(){const wasFx=!!MASK.fx;maskFxClear();MASK.t=0;if(MASK.off)maskRestore();else if(wasFx&&MASK.original){Object.assign(PLAYER_PAL,MASK_SUIT,{handSkin:MASK.original.skin});applyPlayerLook()}} // v78: troca de cidade/ilha não perde a Maskara vestida
function maskNosClear(){for(const v of vehicles)if(v._maskNos){v.hasNitro=false;v._maskNos=false}}
// v78: com a Maskara, TODAS as armas com munição infinita; ao tirar, volta o arsenal de antes e o Nathan fica com 15% de vida e colete.
const MASK_GUNS=['pistol','magnum','smg','rpg','grenade','remote','flame'];
// v78: em área de busca (fugiu da perseguição, polícia procurando), vestir ou tirar a Maskara é um disfarce perfeito: zera a busca.
function maskSearchClear(){if(POL.wanted||!(WZ.list.length||vehicles.some(c=>c.zonePatrol)))return;wzFadeAll();WZ.list.length=0;WZ.crime=null;WZ.fromZone=null;WZ.cur=null;WZ.susT=0;POL.truce=Math.max(POL.truce,simT+20);for(const c of vehicles)if(c.zonePatrol){c.zonePatrol=null;c.sirenOn=false} /* viaturas de busca voltam à ronda normal, sem sumir na frente do jogador */toast(translatePlain('DISFARCE PERFEITO · BUSCA ENCERRADA'))}
function maskKitSave(){if(MASK.kit)return;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;MASK.kit={inv:JSON.parse(JSON.stringify(GUN.inv||{})),w:GUN.w}}
function maskGunSave(){return MASK.kit?{w:MASK.kit.w,inv:MASK.kit.inv}:{w:GUN.w,inv:GUN.inv}} // save/snapshot nunca leva o arsenal da Maskara
function maskArm(){for(const w of MASK_GUNS){const cap=ammoCap(w),it=GUN.inv[w]||(GUN.inv[w]={ammo:0});if(it.ammo<cap)it.ammo=cap}if(GUN.has&&GUN.inv[GUN.w]&&GUN.ammo<GUN.inv[GUN.w].ammo)GUN.ammo=GUN.inv[GUN.w].ammo}
function maskUnkit(){const k=MASK.kit;if(!k)return;MASK.kit=null;GUN.inv=k.inv||{};GUN.w=k.inv&&k.inv[k.w]?k.w:'pistol';GUN.has=false;GUN.ammo=0;GUN.firing=false;if(!PL.dead){PL.hp=15;PL.armor=15}}
function maskRestore(){maskUnkit();MASK.burnT=0;MASK.fadeT=0;if(PL.sp&&PL.sp.userData.actorTint)PL.sp.userData.actorTint.setRGB(1,1,1);const old=MASK.original;MASK.original=null;MASK.off=false;if(!old)return;Object.keys(PLAYER_PAL).forEach(k=>{if(!(k in old))delete PLAYER_PAL[k]});Object.assign(PLAYER_PAL,old);applyPlayerLook();maskNosClear()}
function maskInstantOff(){if(!MASK.original)return;maskFxClear();MASK.t=0;maskRestore()}
/* v78: transformação com esmaecimento: durante o rodopio um "fantasma" com a roupa de destino (traje ou roupa normal) aparece
   por cima do personagem enquanto a roupa atual some (opacidade cruzada). Mesmo quadro do atlas do jogador (2D ou 3D). */
function maskGhostStart(target){maskGhostEnd();const t=S.sprite8===true?atlas8Tex({...target},16,PL_RES3D):atlasTex({...target});const sp=makeActorLitSprite(t);const ob=sp.onBeforeRender;
 sp.onBeforeRender=function(){const m=PL.sp.material.map;if(m&&sp.material.map){sp.material.map.offset.copy(m.offset);sp.material.map.repeat.copy(m.repeat)}return ob.apply(this,arguments)};
 sp.renderOrder=(PL.sp.renderOrder||0)+1;sp.material.alphaTest=.01;sp.material.opacity=0;sp.material.needsUpdate=true;PL.sp.material.alphaTest=.01;PL.sp.material.needsUpdate=true;MASK.ghost={sp,t}}
function maskGhostTick(k){const G=MASK.ghost;if(!G)return;const e=k*k*(3-2*k);G.sp.position.copy(PL.sp.position);G.sp.scale.copy(PL.sp.scale);G.sp.visible=PL.sp.visible;G.sp.material.opacity=e;PL.sp.material.opacity=1-e}
function maskGhostEnd(){const G=MASK.ghost;if(!G)return;scene.remove(G.sp);G.sp.material.dispose();try{charTexRelease(G.t)}catch(e){}MASK.ghost=null;PL.sp.material.opacity=1;PL.sp.material.alphaTest=.5;PL.sp.material.needsUpdate=true}
function maskFxStart(){maskFxClear();MASK.t=MASK.DUR;try{maskGhostStart(MASK.off?MASK.original:{...PLAYER_PAL,...MASK_SUIT,handSkin:(MASK.original&&MASK.original.skin)||PLAYER_PAL.skin})}catch(e){console.error(e)}
 const n=90,geom=new THREE.BufferGeometry(),a=new Float32Array(n*3);geom.setAttribute('position',new THREE.BufferAttribute(a,3).setUsage(THREE.DynamicDrawUsage));
 const mat=new THREE.PointsMaterial({color:0xd9f44a,size:.14,transparent:true,opacity:.9,depthWrite:false});MASK.geom=geom;MASK.positions=a;MASK.fx=new THREE.Points(geom,mat);MASK.fx.frustumCulled=false;scene.add(MASK.fx);
 const K=6,M=30,g=new THREE.BufferGeometry(),pos=new Float32Array(K*M*2*3),col=new Float32Array(K*M*2*3),idx=[];
 for(let k=0;k<K;k++)for(let j=0;j<M-1;j++){const a0=(k*M+j)*2,b0=a0+2;idx.push(a0,a0+1,b0,a0+1,b0+1,b0)}
 g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
 const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));mesh.frustumCulled=false;mesh.renderOrder=6;scene.add(mesh);
 MASK.wind={mesh,geo:g,pos,col,K,M}}
function maskWear(on,src){if(on&&CHAR.cur!==0){think(PL,'Nem pensar. Essa coisa me dá medo.',3.5);return} /* v78: só o Nathan usa a Maskara */
 if(on){if(MASK.original&&!MASK.off)return;if(MASK.original&&MASK.off){MASK.off=false;maskFxStart();return}MASK.original={...PLAYER_PAL};MASK.off=false;maskKitSave();maskFxStart();toast(src==='cheat'?'THE MASK':'MASKARA')}
 else{if(!MASK.original||MASK.off)return;if(maskRisky()){think(PL,translatePlain(inWater(PL.x,PL.z)&&!PL.inside?'Tirar a máscara aqui? Eu afundo!':'Agora não!'),3);return}MASK.off=true;maskFxStart()}}
// v78: o cheat THEMASK = abrir o cofre: ganha a Maskara como item (roda de armas) e veste; repetir o cheat guarda e devolve o item
// (se ele veio do cheat). Salvar continua bloqueado depois de qualquer cheat (CHEAT.used / saveBlocked).
function maskToggle(){if(CHAR.cur!==0){think(PL,'Nem pensar. Essa coisa me dá medo.',3.5);return}
 if(MASK.cheatHave&&MASK.original&&!MASK.off){maskWear(false);if(MASK.off){MASK.have=false;MASK.cheatHave=false}return}
 if(!MASK.have){MASK.have=true;MASK.cheatHave=true}maskWear(true,'cheat')}
const _mkA=new THREE.Color('#d9f44a'),_mkB=new THREE.Color('#ffffff'),_mkC=new THREE.Color();
function maskTick(dt){
 /* queimado: troca o atlas (2D) / boneco (3D) pela versão carbonizada com esmaecimento — escurece, troca no meio, clareia */
 if(MASK.fadeT>0){const a0=MASK.fadeT;MASK.fadeT=Math.max(0,a0-dt);const mid=.3,tint=PL.sp&&PL.sp.userData.actorTint,v=Math.min(1,Math.abs(MASK.fadeT-mid)/.3);if(tint)tint.setRGB(v,v,v);
  if(a0>mid&&MASK.fadeT<=mid){if(MASK.fadeTo==='burnt'){if(MASK.original&&!MASK.off){PLAYER_PAL.burnt=true;applyPlayerLook()}}else if(PLAYER_PAL.burnt){delete PLAYER_PAL.burnt;applyPlayerLook()}}
  if(MASK.fadeT<=0&&tint)tint.setRGB(1,1,1)}
 if(MASK.burnT>0){MASK.burnT-=dt;if(maskOn()&&Math.random()<dt*14){const b=PL.car||PL;emit(b.x+(Math.random()-.5)*.4,(b.gy||0)+1.2+Math.random()*.8,b.z+(Math.random()-.5)*.4,(Math.random()-.5)*.6,1.2+Math.random(),(Math.random()-.5)*.6,1.4,.3,1.3,0x3a3632,false,.55);if(Math.random()<.25)emit(b.x,(b.gy||0)+.9,b.z,(Math.random()-.5)*1.5,1.5,(Math.random()-.5)*1.5,.5,.12,.04,0xff7a2a,true,.9)}
  if(MASK.burnT<=0){MASK.fadeT=.6;MASK.fadeTo='normal'}}
 if(maskOn()){if(!PL.dead&&PL.hp<99&&!(MASK.burnT>0)&&!PL.maskKO)maskSay('hit');if(!PL.dead)PL.hp=Math.max(PL.hp,100);if(MASK.kit)maskArm();const c=PL.car;if(c&&c.alive&&!c.hasNitro&&!c.special&&!c.t.boat&&!c.t.hover){c.hasNitro=true;c._maskNos=true}}
 if(!MASK.fx)return;MASK.t=Math.max(0,MASK.t-dt);const T=MASK.DUR-MASK.t,env=Math.min(1,T/.18)*Math.min(1,MASK.t/.3),W=30;
 const anchor=PL.car||PL,ax=anchor.x,ay=anchor.gy||0,az=anchor.z;
 if(!PL.car){const a=simT*W*.75;PL.face=[Math.cos(a),Math.sin(a)]} // o personagem rodopia junto
 MASK.fx.position.set(ax,ay,az);const a=MASK.positions,n=a.length/3;
 for(let i=0;i<n;i++){const u=i/n,r=.45+.75*u+.12*Math.sin(i*3.7+simT*7),ang=simT*W+u*Math.PI*11;a[i*3]=Math.cos(ang)*r;a[i*3+1]=.15+u*3.2;a[i*3+2]=Math.sin(ang)*r}
 MASK.geom.attributes.position.needsUpdate=true;MASK.fx.material.opacity=.9*env;maskGhostTick(clamp((T-.15)/(MASK.DUR-.35),0,1)); // troca de roupa no meio do giro
 const Wd=MASK.wind;if(Wd){const {pos,col,K,M}=Wd;for(let k=0;k<K;k++)for(let j=0;j<M;j++){const u=j/(M-1),ph=k/K*Math.PI*2,ang=simT*W*(k%2?1:1.18)+u*Math.PI*2.6+ph,r=.32+.85*u+.07*Math.sin(simT*9+k*2.1),r2=r+.06,y=.12+u*2.95+.12*Math.sin(k*1.7),w=.05+.13*u;
   const o=(k*M+j)*6,c=Math.cos(ang),s2=Math.sin(ang);pos[o]=ax+c*r;pos[o+1]=ay+y-w;pos[o+2]=az+s2*r;pos[o+3]=ax+c*r2;pos[o+4]=ay+y+w;pos[o+5]=az+s2*r2;
   const b=Math.pow(Math.sin(Math.PI*u),1.2)*env*(k%2?.55:.85);_mkC.copy(_mkA).lerp(_mkB,u*.7).multiplyScalar(b);col[o]=col[o+3]=_mkC.r;col[o+1]=col[o+4]=_mkC.g;col[o+2]=col[o+5]=_mkC.b}
  Wd.geo.attributes.position.needsUpdate=true;Wd.geo.attributes.color.needsUpdate=true}
 if(MASK.t<=0){maskFxClear();maskSearchClear();if(MASK.off){maskRestore();toast(translatePlain('MASKARA GUARDADA'));setTimeout(()=>{if(!PL.dead&&!MASK.original)say(PL,'Que sono....',3,true)},500)}else{Object.assign(PLAYER_PAL,MASK_SUIT,{handSkin:(MASK.original&&MASK.original.skin)||'#e0ac69'});applyPlayerLook();toast('S-S-S-SMOKIN!')}}}
/* códigos de cheat estilo GTA San Andreas (teclado, console com ' e sequência no controle) */
/* ================= v79r12 · CHEAT IMPOSSIBLETOSEE =================
   Tudo vira chiado preto e branco PRESO A CADA OBJETO (espaço do objeto/instância; sprites pelo próprio pixel).
   Parado = estática uniforme; só dá pra ver o que se mexe (ou quando a câmera anda: paralaxe).
   Troca o material de cada mesh/sprite por um clone "chiado" (cache por material original) e devolve tudo ao desligar.
   Transparentes sem recorte, partículas, linhas, sombras-blob, brilhos e setas somem. Sem sombra, bloom, reflexo; sempre meio-dia. */
var ITS={on:false,objs:new Set(),cache:new Map(),hide:null,t:0,K:{value:.003},save:null};
const ITS_GLSL='varying vec3 vItsP;varying vec3 vItsN;varying float vItsD;uniform float itsK;\nfloat itsH(vec3 p){p=mod(p,2039.);p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}\n';
function itsMeshMat(o){const m=new THREE.MeshBasicMaterial({color:0xffffff,map:o.map||null,alphaTest:o.map&&(o.transparent||o.alphaTest>0)?Math.max(.5,o.alphaTest||0):0,side:o.side,fog:false,toneMapped:false});
 m.onBeforeCompile=sh=>{sh.uniforms.itsK=ITS.K;
  sh.vertexShader=ITS_GLSL+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 itsLp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nitsLp=instanceMatrix*itsLp;\n#endif\nvItsP=itsLp.xyz*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));vItsN=abs(normal);').replace('#include <project_vertex>','#include <project_vertex>\nvItsD=-mvPosition.z;');
  sh.fragmentShader=ITS_GLSL+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float l=log2(max(vItsD*itsK,.0015)),lf=floor(l),fr=l-lf;vec3 q0=vItsP/exp2(lf)+vItsN*.37,q1=vItsP/exp2(lf+1.)+vItsN*.37;float pick=itsH(floor(q0)+vec3(91.7+lf));float h=pick<fr?itsH(floor(q1)+vec3((lf+1.)*7.13)):itsH(floor(q0)+vec3(lf*7.13));gl_FragColor=vec4(vec3(step(.5,h)),1.);} /* troca de escala sorteada por célula: sem anéis */')};
 m.customProgramCacheKey=()=>'its-mesh';m.userData.its=true;return m}
function itsSpriteMat(o){const m=new THREE.SpriteMaterial({color:0xffffff,map:o.map||null,alphaTest:.5,fog:false,toneMapped:false,sizeAttenuation:o.sizeAttenuation!==false});
 m.onBeforeCompile=sh=>{sh.fragmentShader='float itsH(vec3 p){p=mod(p,2039.);p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}\n'+sh.fragmentShader.replace('#include <fog_fragment>','#include <fog_fragment>\n{vec2 ts=vec2(128.);\n#if defined(USE_MAP) && __VERSION__ >= 300\nts=vec2(textureSize(map,0));\n#endif\nfloat h=itsH(vec3(floor(vUv*ts*4.),3.));gl_FragColor=vec4(vec3(step(.5,h)),gl_FragColor.a);}')};
 m.customProgramCacheKey=()=>'its-sprite';m.userData.its=true;return m}
function itsHidden(){if(!ITS.hide){ITS.hide=new THREE.MeshBasicMaterial({visible:false});ITS.hide.userData.its=true}return ITS.hide}
function itsFor(o,obj){if(!o)return o;if(o.userData&&o.userData.its)return o;let n=ITS.cache.get(o);if(n){if(n.map!==(o.map||null)&&n!==ITS.hide)n.map=o.map||null;return n}
 const add=o.blending===THREE.AdditiveBlending,clearT=o.transparent&&!o.map&&(o.opacity??1)<.98;
 if(obj.isPoints||obj.isLine||add||clearT||(o.transparent&&o.map&&!o.alphaTest&&o.depthWrite===false)||(typeof ARROW_MATS!=='undefined'&&ARROW_MATS.includes(o)))n=itsHidden();
 else if(obj.isSprite)n=itsSpriteMat(o);else n=itsMeshMat(o);ITS.cache.set(o,n);return n}
function itsSwap(obj){if(!(obj.isMesh||obj.isSprite||obj.isPoints||obj.isLine))return;const m=obj.material;if(!m)return;
 if(Array.isArray(m)){if(m.every(x=>x&&x.userData&&x.userData.its))return;if(!obj.userData.itsOrig||obj.userData.itsOrig!==m)obj.userData.itsOrig=m;obj.material=m.map(x=>itsFor(x,obj));ITS.objs.add(obj);return}
 if(m.userData&&m.userData.its)return;obj.userData.itsOrig=m;obj.material=itsFor(m,obj);ITS.objs.add(obj)}
function itsSync(){if(!ITS.on)return;ITS.K.value=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.max(1,renderer.domElement.height)*1.25;
 /* v2 r3.1: relógio de verdade continua andando por baixo do meio-dia forçado. Salto grande = alguém acertou a hora (troca de mundo:
    Fenda, Point Haze, DeLorean) → adota a hora nova; antes, ao desligar depois de trocar de mundo, voltava a hora do mundo anterior. */
 {const d=DN.tod-720;if(ITS.save){if(Math.abs(d)>5)ITS.save.tod=DN.tod;else ITS.save.tod=((ITS.save.tod+d)%1440+1440)%1440}}DN.tod=720;
 scene.traverse(itsSwap); /* v79r13: varre TODO quadro, logo antes do render — carro/ped que nasce já aparece com o chiado (antes piscava colorido até a varredura de 0,4 s) */const now=performance.now();if(now-ITS.t>400){ITS.t=now;for(const o of ITS.objs){const or=o.userData.itsOrig;if(or&&!Array.isArray(or)&&or.map!==undefined){const n=ITS.cache.get(or);if(n&&n!==ITS.hide&&n.map!==(or.map||null))n.map=or.map||null}}}}
function itsToggle(){ITS.on=!ITS.on;
 if(ITS.on){ITS.save={shadow:renderer.shadowMap.enabled,bg:scene.background,fog:scene.fog,tod:DN.tod};renderer.shadowMap.enabled=false;scene.background=new THREE.Color(0x808080);scene.fog=null;ITS.t=0;itsSync();toast('IMPOSSIBLE TO SEE<br><small style="font-size:11px;color:#fff">só o que se move aparece · digite de novo para sair</small>')}
 else{for(const o of ITS.objs){const or=o.userData.itsOrig;if(or){const cur=o.material,isIts=Array.isArray(cur)?cur.some(x=>x&&x.userData&&x.userData.its):cur&&cur.userData&&cur.userData.its;if(isIts)o.material=or}delete o.userData.itsOrig}ITS.objs.clear();
  for(const m of ITS.cache.values())if(m!==ITS.hide)m.dispose();ITS.cache.clear();const s=ITS.save||{};renderer.shadowMap.enabled=s.shadow??renderer.shadowMap.enabled;scene.background=s.bg??scene.background;scene.fog=s.fog??scene.fog;if(s.tod!=null)DN.tod=s.tod;try{updateDayNight(0,true)}catch(e){}toast('IMPOSSIBLE TO SEE · DESLIGADO')}}

