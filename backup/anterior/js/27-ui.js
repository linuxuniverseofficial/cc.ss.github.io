'use strict';
/* Coastal Chaos · js/27-ui.js — UI (menus), modo foto, Top Secret (viagem entre dimensões).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= UI ================= */
let toastT=0;const NOTES=[];
// notificações empilhadas: cada uma com seu tempo; a missão fica em cima, as novas entram embaixo
function toast(html,cls,dur){if(typeof MCP!=='undefined'&&MCP.ff)return;/* Keep BR source text: DOM localizer can switch EN ↔ BR without losing it. */const box=$('#notes');let n=NOTES.find(q=>q.html===html);
 if(!n){const el=document.createElement('div');el.className='note'+(cls?' '+cls:'');el.innerHTML=html;box.appendChild(el);n={el,html};NOTES.push(n);while(NOTES.length>4){const o=NOTES.shift();o.el.remove()}}
 n.t=dur||3;n.el.style.opacity=1;$('#toast').innerHTML=html;toastT=n.t;
 const m=$('#mission');m.style.marginTop=NOTES.length?'0':'42px';if(NOTES.length&&m.parentNode===box)box.insertBefore(m,box.firstChild)}
function tickNotes(dt){for(let i=NOTES.length-1;i>=0;i--){const n=NOTES[i];n.t-=dt;if(n.t<=0)n.el.style.opacity=0;if(n.t<-.5){n.el.remove();NOTES.splice(i,1)}}if(!NOTES.length)$('#mission').style.marginTop='42px'}
function wxToast(title,sub){toast('☁ '+title+(sub?'<br><small style="font-size:11px">'+sub+'</small>':''),'wx',5.5)}
function toastIf(c,m){if(c)toast(m)}
function syncMenu(){try{setTimeout(playSumSync,0)}catch(e){}
 S.size=normalizeCitySize(S.size);
 $('#seed').value=S.seed;monSeedRefresh();$('#traffic').value=S.traffic;$('#trafficOut').textContent=S.traffic+'%';$('#peds').value=S.peds;$('#pedsOut').textContent=S.peds+'%';
 $('#hour').value=S.hour;$('#hourOut').textContent=String(S.hour).padStart(2,'0')+':00';document.querySelectorAll('.vopt').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===S.view));
 $('#size').value=String(S.size);$('#sizeOut').textContent={7:'7×7',14:'14×14'}[S.size];if(typeof sizeSegSync==='function')sizeSegSync();document.body.classList.toggle('synth',S.style==='synthwave');document.body.classList.toggle('inverted',S.style==='inverted')}
$('#hour').addEventListener('input',e=>{S.hour=+e.target.value;$('#hourOut').textContent=String(S.hour).padStart(2,'0')+':00';playSumSync()});
function playSumSync(){const el=$('#playSum');if(!el)return;const v=parseInt($('#seed').value,10);el.textContent='seed '+(Number.isFinite(v)?(v>>>0):(S.seed>>>0))+' · '+S.size+'×'+S.size+' '+translatePlain('quadras')+' · '+String(S.hour).padStart(2,'0')+':00'}
$('#seed').addEventListener('input',()=>playSumSync());
{const l2=$('#loadFile2');if(l2)l2.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#loadFile').click()}})}
document.querySelectorAll('.vopt').forEach(b=>b.addEventListener('click',()=>{S.view=b.dataset.view;syncMenu();if(played)setView(S.view)}));
function randomizeCitySeed(){const old=S.seed>>>0;let next=(Math.random()*4294967296)>>>0;if(next===old)next=(next+1)>>>0;S.seed=next;syncMenu();return next}
function menuCitySeed(){const value=parseInt($('#seed').value,10);return Number.isFinite(value)?value>>>0:S.seed>>>0}
function generateNewCity(){if(played||!$('#loading').hidden)return;modePick(()=>{if(played)return;randomizeCitySeed();startGame(null)})}
function generateCityFromSeed(){if(played||!$('#loading').hidden)return;modePick(()=>{if(played)return;S.seed=menuCitySeed();syncMenu();startGame(null)})}
// Janela de escolha do modo ao gerar cidade: Nathan = história, Claire = livre (preto e branco; colore ao focar).
const MP={open:false,go:null};const JASON_LOOK0={...PLAYER_PAL};
/* v2 r11: card ONLINE = silhueta preta do personagem com um "?" branco (jogador desconhecido); segue 2D/3D como os outros */
function mpPaintOnline(cv0){mpPaint(cv0,{...PLAYER_PAL},'#1f5a3a');const t=document.createElement('canvas');t.width=t.height=192;const tg=t.getContext('2d');mpPaint(t,{...PLAYER_PAL},'rgba(0,0,0,0)');
 tg.globalCompositeOperation='source-in';tg.fillStyle='#0b0d0c';tg.fillRect(0,0,192,192);
 const g=cv0.getContext('2d');g.fillStyle='#1f5a3a';g.fillRect(0,0,192,192);for(let y=0;y<192;y+=12){g.fillStyle='rgba(255,255,255,.04)';g.fillRect(0,y,192,6)}g.drawImage(t,0,0);
 const m3=S.sprite8===true||S.char3d===true,sz=m3?84:70,y=m3?92:84;g.font='900 '+sz+'px Segoe UI,Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=sz*.12;g.strokeStyle='#000';g.strokeText('?',96,y);g.fillStyle='#fff';g.fillText('?',96,y)}
function mpPaint(cv0,pal,bg){const g=cv0.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle=bg;g.fillRect(0,0,192,192);for(let y=0;y<192;y+=12){g.fillStyle='rgba(255,255,255,.04)';g.fillRect(0,y,192,6)}/* v78: 2D (pixel art) é o padrão; retrato 3D só com "Pedestres em 3D" */if(S.sprite8!==true&&S.char3d!==true){const at=makeAtlas({...pal,pack:false});g.drawImage(at,0,0,32,32,8,16,176,176);return}try{const P=charPortrait(pal);g.imageSmoothingEnabled=true;g.drawImage(P.open_closed,0,0,192,192)}catch(e){console.error(e);const at=makeAtlas({...pal,pack:false});g.drawImage(at,0,0,32,32,8,16,176,176)}}
function modePick(go){MP.open=true;MP.go=go;$('#modePick').hidden=false;mpPaint($('#mpStory canvas'),JASON_LOOK0,'#2a3a6a');mpPaint($('#mpFree canvas'),LUCIA_PAL,'#6a2a4a');mpPaintOnline($('#mpOnline canvas')); /* v78: menu sempre com a roupa padrão (sem estampa); a roupa trocada vale no jogo/save/cenas */(modeSel==='free'?$('#mpFree'):$('#mpStory')).focus()}
function modePickClose(){MP.open=false;$('#modePick').hidden=true;MP.go=null;try{$('#play').focus()}catch(e){}}
for(const id of ['#mpStory','#mpFree','#mpOnline'])$(id).addEventListener('mouseenter',e=>e.currentTarget.focus());
$('#mpOnline').addEventListener('click',()=>{MP.open=false;$('#modePick').hidden=true;MP.go=null;onJoinOpen()});
for(const id of ['#mpStory','#mpFree'])$(id).addEventListener('click',e=>{const m=e.currentTarget.dataset.m,go=MP.go;modeSet(m);MP.open=false;$('#modePick').hidden=true;MP.go=null;if(go)go()});
$('#modePick').addEventListener('click',e=>{if(e.target.id==='modePick')modePickClose()});
$('#seedRnd').addEventListener('click',randomizeCitySeed);$('#seedPlay').addEventListener('click',generateCityFromSeed);
$('#seed').addEventListener('change',e=>{const v=parseInt(e.target.value,10);S.seed=isNaN(v)?S.seed:v>>>0;syncMenu()});
$('#traffic').addEventListener('input',e=>{S.traffic=+e.target.value;$('#trafficOut').textContent=S.traffic+'%';saveCfg()});
$('#peds').addEventListener('input',e=>{S.peds=+e.target.value;$('#pedsOut').textContent=S.peds+'%';saveCfg()});
$('#size').addEventListener('change',e=>{S.size=normalizeCitySize(e.target.value);try{localStorage.setItem('ps_size',String(S.size))}catch(_){}syncMenu()}); /* v78: lembra a escolha (padrão 14×14 também no celular) */
/* v77 UX: tamanho da cidade como controle segmentado (o select continua como fonte da verdade) */
function sizeSegSync(){const sel=$('#size');let seg=$('#sizeSeg');if(!sel)return;if(!seg){seg=document.createElement('div');seg.id='sizeSeg';seg.className='size-seg';seg.setAttribute('role','radiogroup');seg.setAttribute('aria-label','Tamanho da cidade');sel.insertAdjacentElement('afterend',seg)}
 const opts=[...sel.options];if(seg.children.length!==opts.length){seg.textContent='';for(const o of opts){const b=document.createElement('button');b.type='button';b.className='btn';b.dataset.v=o.value;b.setAttribute('role','radio');const parts=o.textContent.split('·');const t=document.createElement('b');t.textContent=parts[0].trim();b.appendChild(t);if(parts[1]){const sm=document.createElement('small');sm.textContent=parts[1].trim();b.appendChild(sm)}b.addEventListener('click',()=>{if(sel.value===o.value)return;sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}))});seg.appendChild(b)}}
 for(const b of seg.children){const on=b.dataset.v===sel.value;b.classList.toggle('on',on);b.setAttribute('aria-checked',on?'true':'false')}}
sizeSegSync();
$('#optShadows').addEventListener('change',e=>{S.shadows=e.target.checked;applyShadows();detailedShadowsUI();saveCfg()});
function cloudQUI(){const e=$('#cloudQ'),o=$('#cloudQOut');if(e)e.value=String(S.cloudQ);if(o)o.textContent=translatePlain(['BAIXO','MÉDIO','ALTO'][S.cloudQ]||'MÉDIO')}
$('#cloudQ').addEventListener('input',e=>{S.cloudQ=clamp(Math.round(+e.target.value),0,2);cloudQUI();saveCfg()});
function waterQUI(){const e=$('#waterQ'),o=$('#waterQOut');if(e)e.value=String(S.waterQ);if(o)o.textContent=translatePlain(['BAIXO','MÉDIO','ALTO'][S.waterQ]||'MÉDIO')}
$('#waterQ').addEventListener('input',e=>{S.waterQ=clamp(Math.round(+e.target.value),0,2);waterQApply();waterQUI();saveCfg()});
$('#shadowQuality').addEventListener('input',e=>{S.shadowQuality=[1,2,4][Number(e.target.value)]||1;applyShadowQuality();saveCfg()});
function applyInterfaceVisibility(){document.body.classList.toggle('hide-minimap',S.showMinimap===false);document.body.classList.toggle('hide-gamehud',S.showHud===false)}
$('#optMinimap').addEventListener('change',e=>{S.showMinimap=e.target.checked;applyInterfaceVisibility();saveCfg()});
$('#optHud').addEventListener('change',e=>{S.showHud=e.target.checked;applyInterfaceVisibility();saveCfg()});
$('#optBloom').addEventListener('change',e=>{S.bloom=e.target.checked;saveCfg()});
$('#optRefl').addEventListener('change',e=>{S.refl=e.target.checked;saveCfg()});
/* v3 r25: chaves dos efeitos leves de shader (SHFX): só mudam o uniform fxK, sem recompilar */
function fxUI(){for(const k of ['fxWet','fxGlow','fxPaint','fxWin','fxSurf']){const e=$('#'+k);if(e)e.checked=S[k]!==false}}
for(const k of ['fxWet','fxGlow','fxPaint','fxWin','fxSurf'])$('#'+k).addEventListener('change',e=>{S[k]=e.target.checked;shfxApply();try{graphicsPresetUI()}catch(_){}saveCfg()});
$('#fpsLimit').addEventListener('change',e=>{S.fpsLimit=Number(e.target.value);fpsAccumulator=0;saveCfg()});
$('#renderScale').addEventListener('input',e=>{S.renderScale=Number(e.target.value);applyRenderScale();saveCfg()});
$('#drawDistance').addEventListener('input',e=>{S.drawDistance=clamp(+e.target.value,0,200);drawDistanceUI();syncFogDrawDistance();saveCfg()});
$('#objectDistance').addEventListener('input',e=>{S.objectDistance=clamp(+e.target.value,0,100);objectDistanceUI();saveCfg()});
$('#shadowDistance').addEventListener('input',e=>{S.shadowDistance=clamp(+e.target.value,0,100);shadowDistanceUI();renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;saveCfg()});
$('#optDetailedShadows').addEventListener('change',e=>{S.detailedShadows=e.target.checked;renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;saveCfg()});
{const e=$('#optCharMode');if(e){e.value=charModeOf();e.addEventListener('change',ev=>{const v=ev.target.value;S.char3d=v==='3d';S.sprite8=v==='25d';atlasCache.clear();saveCfg();try{c3ApplyMode()}catch(err){console.error(err)}try{applyPlayerLook()}catch(err){console.error(err)}try{charPreload3D()}catch(err){console.error(err)}try{spritesRefreshPeds()}catch(err){console.error(err)}try{charFaces()}catch(err){}})}}
$('#optPoleShadows').addEventListener('change',e=>{S.poleShadows=e.target.checked;renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;try{graphicsPresetUI()}catch(_){}saveCfg()});
// v263: PRESETS DE GRÁFICOS. NÃO ALTERAR AQUI os sprites protegidos da v258.
// Apenas configurações públicas já existentes; nenhuma alteração em SpriteMaterial,
// atlas, geometria compartilhada, drawRange ou recursos das viagens entre mundos.
// Limite FPS, clima, som, HUD, idioma, gamepad e tamanho da cidade NÃO são presets gráficos.
// FIX v263: IS_MOBILE precisa ser inicializado ANTES deste objeto literal.
// Se ficar abaixo, o acesso na inicializacao de MEDIUM gera ReferenceError
// e interrompe todo o menu (seed vazia, botoes sem eventos).
const IS_MOBILE=pixelIsMobile();
const GRAPHICS_PRESETS={
 LOW:{traffic:25,peds:25,drawDistance:0,objectDistance:0,shadowDistance:0,renderScale:40,
      shadows:false,shadowQuality:1,detailedShadows:false,poleShadows:false,bloom:false,refl:false,lampLighting:false,lampCount:1,sprite8:false,char3d:false,cloudQ:1,waterQ:0,fxWet:false,fxGlow:true,fxPaint:false,fxWin:false,fxSurf:false},
 MEDIUM:{traffic:50,peds:50,drawDistance:150,objectDistance:25,shadowDistance:0,renderScale:90,
       shadows:true,shadowQuality:1,detailedShadows:true,poleShadows:false,bloom:true,refl:true,lampLighting:!MOB_LITE,lampCount:4,sprite8:true,char3d:false,cloudQ:1,waterQ:1,fxWet:true,fxGlow:true,fxPaint:true,fxWin:true,fxSurf:true},
 HIGH:{traffic:50,peds:50,drawDistance:200,objectDistance:100,shadowDistance:100,renderScale:100,
      shadows:true,shadowQuality:4,detailedShadows:true,poleShadows:true,bloom:true,refl:true,lampLighting:true,lampCount:4,sprite8:false,char3d:true,cloudQ:2,waterQ:2,fxWet:true,fxGlow:true,fxPaint:true,fxWin:true,fxSurf:true}
};
function graphicsPresetSelected(){
 for(const [name,values] of Object.entries(GRAPHICS_PRESETS))
  if(Object.entries(values).every(([key,value])=>S[key]===value))return name;
 return null;
}
function graphicsPresetUI(){
 const current=graphicsPresetSelected();
 for(const b of document.querySelectorAll('[data-graphics-preset]'))
  b.setAttribute('aria-pressed',String(b.dataset.graphicsPreset===current));
 const status=$('#graphicsPresetStatus');if(status)status.textContent=current==='LOW'?'BAIXO ativo':current==='MEDIUM'?'MÉDIO ativo':current==='HIGH'?'ALTO ativo · desempenho pode cair':'PERSONALIZADO · controles manuais';
}
function graphicsPresetApply(name){
 const values=GRAPHICS_PRESETS[name];if(!values||BENCH.active)return;
 const oldShadows=S.shadows,oldQuality=S.shadowQuality,oldLamp=S.lampLighting,oldLampCount=S.lampCount;
 const oldScale=S.renderScale,oldDraw=S.drawDistance,oldDetail=S.detailedShadows,oldPole=S.poleShadows,oldShadowDistance=S.shadowDistance,oldSprite=charModeOf(); /* v3 r41: ALTO = 3D, MÉDIO = 2.5D, BAIXO = 2D */
 Object.assign(S,values);try{waterQApply()}catch(err){}try{shfxApply();fxUI()}catch(err){}
 if(oldSprite!==charModeOf()){try{c3ApplyMode()}catch(err){console.error(err)}const e=$('#optCharMode');if(e)e.value=charModeOf();atlasCache.clear();try{applyPlayerLook()}catch(err){console.error(err)}try{charPreload3D()}catch(err){console.error(err)}try{spritesRefreshPeds()}catch(err){console.error(err)}try{charFaces()}catch(err){}}
 // Atualiza SOMENTE os mecanismos normais dos controles da aba Gráficos.
 if(oldShadows!==S.shadows)applyShadows();
 else if(oldQuality!==S.shadowQuality)applyShadowQuality();
 if(oldLamp!==S.lampLighting)refreshLampLighting();
 else if(oldLampCount!==S.lampCount)nearLampTimer=0;
 if(oldScale!==S.renderScale)applyRenderScale();
 if(oldDraw!==S.drawDistance)syncFogDrawDistance();
 if(oldShadowDistance!==S.shadowDistance||oldDetail!==S.detailedShadows||oldPole!==S.poleShadows){renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;}
 // O jogo já aplica tráfego/pedestres/LOD de forma dinâmica nos ticks normais.
 syncMenu();cfgUI();saveCfg();
}
for(const b of document.querySelectorAll('[data-graphics-preset]'))
 b.addEventListener('click',()=>graphicsPresetApply(b.dataset.graphicsPreset));
// Se o jogador mexer em um slider/checkbox, a indicação passa a PERSONALIZADO.
$('#cfg-panel-3').addEventListener('input',graphicsPresetUI);
$('#cfg-panel-3').addEventListener('change',graphicsPresetUI);

function refreshLampLighting(){
 nearLampTimer=0;
 if(S.lampLighting===false)for(const slot of nearLampLights){slot.light.intensity=0;slot.lamp=null}
 for(const ch of city.chunks.values()){
  const IM=ch.lampIM;if(!IM)continue;
  for(const l of ch.lamps)IM.glow.setMatrixAt(l.i,l.on&&!l.broken&&S.lampLighting!==false?lampGlowM(l):ZM);
  IM.glow.instanceMatrix.needsUpdate=true;
 }
}
function syncLampCountUI(){/* v78: slider LUZES REAIS DOS POSTES removido (postes sem PointLight) */}
$('#optLampLighting').addEventListener('change',e=>{S.lampLighting=e.target.checked;refreshLampLighting();syncLampCountUI();saveCfg()});
/* r36 · MODO MOBILE: liga/desliga os cortes de desempenho do celular antigo (MOB_LITE). Ao ligar, também desliga sombra, reflexo e luz dos postes (como o celular começava). */
$('#optMobLite').addEventListener('change',e=>{MOB_LITE=e.target.checked;if(MOB_LITE){S.shadows=false;S.refl=false;S.lampLighting=false;try{applyShadows()}catch(err){}try{refreshLampLighting()}catch(err){}}else{try{applyShadowQuality()}catch(err){}}
 try{rainMat.defines.RAIN_LIGHTS=MOB_LITE?4:6;rainMat.needsUpdate=true}catch(err){}try{syncMenu()}catch(err){}cfgUI();saveCfg();toast(translatePlain(MOB_LITE?'MODO MOBILE LIGADO':'MODO MOBILE DESLIGADO')+'<br><small style="font-size:11px;color:#fff">'+translatePlain('alguns itens valem depois de recarregar')+'</small>')});


for(const k of ['master','music','sfx','interior']){const el=$('#vol_'+k);el.value=Math.round(VOL[k]*100);$('#vol_'+k+'_o').textContent=el.value+'%';el.addEventListener('input',()=>{VOL[k]=el.value/100;$('#vol_'+k+'_o').textContent=el.value+'%';applyVolumes();saveCfg()})}
$('#optShadows').checked=S.shadows;detailedShadowsUI();$('#optBloom').checked=S.bloom;$('#optRefl').checked=S.refl!==false;$('#optSound').checked=!S.sound;$('#renderScale').value=String(S.renderScale??100);$('#renderScaleOut').textContent=Math.round(S.renderScale??100)+'%';
let cfgOpen=false;function openCfg(){if(STORYINTRO.active||STORYEND.active||missionUiBlocked('cfg'))return;cfgOpen=true;try{netCfgSync()}catch(e){}try{cfgUI()}catch(e){}$('#benchRow').hidden=!!played||BENCH.active;$('#cfg').hidden=false;padStatus();applyLanguage();for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();$('#cfgClose').focus()}
function closeCfg(){cfgOpen=false;$('#cfg').hidden=true;if(AUDIO_TEST.mode||AUDIO_TEST.pending)audioPreviewStop()}
$('#cfgBtnMenu').addEventListener('click',openCfg);$('#cfgClose').addEventListener('click',closeCfg);$('#cfg').addEventListener('click',e=>{if(e.target.id==='cfg')closeCfg()});
function padCfgSync(){const set=(id,v,t)=>{const e=$('#'+id);if(e){e.value=v;$('#'+id+'_o').textContent=t}};set('pad_vib',Math.round(PAD.vib*100),Math.round(PAD.vib*100)+'%');set('pad_sens',Math.round(PAD.sens*100),Math.round(PAD.sens*100)+'%');set('pad_dz',Math.round(PAD.dz*100),Math.round(PAD.dz*100)+'%');const iv=$('#pad_inv');if(iv)iv.checked=PAD.inv;{const sc=$('#pad_scheme');if(sc)sc.value=PAD.scheme==='modern'?'modern':'classic'}$('#pad_adaptive').checked=!!PAD.adaptive;$('#pad_trigger_force').value=Math.round(PAD.triggerForce*100);$('#pad_trigger_force_o').textContent=Math.round(PAD.triggerForce*100)+'%';padStatus();dualStatus()}
$('#pad_vib').addEventListener('input',e=>{PAD.vib=e.target.value/100;$('#pad_vib_o').textContent=e.target.value+'%';saveCfg()});
$('#pad_vib').addEventListener('change',()=>rumble(.6,.6,200));
$('#pad_sens').addEventListener('input',e=>{PAD.sens=e.target.value/100;$('#pad_sens_o').textContent=e.target.value+'%';saveCfg()});
$('#pad_dz').addEventListener('input',e=>{PAD.dz=e.target.value/100;$('#pad_dz_o').textContent=e.target.value+'%';saveCfg()});
$('#pad_inv').addEventListener('change',e=>{PAD.inv=e.target.checked;saveCfg()});
$('#pad_scheme').addEventListener('change',e=>{PAD.scheme=e.target.value==='modern'?'modern':'classic';PAD.runLatch=false;saveCfg()});
$('#touchEditBtn').addEventListener('click',()=>touchEditStart());
const MOTION={mode:'off',sens:1,dz:2,invert:false,ready:false,angle:0,center:0,value:0,last:0,pendingCenter:true,dev:null,phoneAngle:null};
function motionStatus(t){const e=$('#motionStatus');if(e)e.textContent=t}
function motionReset(){MOTION.ready=false;MOTION.value=0;MOTION.last=0;MOTION.pendingCenter=true;}
function motionSample(angle){if(!Number.isFinite(angle))return;if(MOTION.pendingCenter){MOTION.center=angle;MOTION.pendingCenter=false;}MOTION.angle=angle;if(!MOTION.ready)motionStatus('Sensor ativo. Incline para virar; use Centralizar se necessário.');MOTION.ready=true;MOTION.last=performance.now();}
function motionHasData(){return MOTION.mode!=='off'&&MOTION.ready&&performance.now()-MOTION.last<650&&(MOTION.mode!=='dual'||!!DUAL.dev?.opened)}
function motionSteer(dt){if(!motionHasData()){MOTION.value=0;return null}let d=((MOTION.angle-MOTION.center+540)%360)-180;if(MOTION.invert)d=-d;const full=35/MOTION.sens,a=Math.abs(d),target=a<=MOTION.dz?0:Math.sign(d)*Math.min(1,(a-MOTION.dz)/Math.max(1,full-MOTION.dz));MOTION.value+=(target-MOTION.value)*(1-Math.exp(-Math.min(.1,dt)*12));return MOTION.value;}
function motionCalibrate(){if(motionHasData()){MOTION.center=MOTION.angle;MOTION.value=0;motionStatus('Centro ajustado. Incline para virar.')}else{MOTION.pendingCenter=true;motionStatus('Aguardando dados do sensor para centralizar.')}}
function motionDualInput(e){if(MOTION.mode!=='dual'||e.device!==DUAL.dev)return;const base=e.reportId===0x31?1:e.reportId===1&&e.data.byteLength>=63?0:-1;if(base<0||e.data.byteLength<base+27)return;
 const x=e.data.getInt16(base+21,true),y=e.data.getInt16(base+23,true),z=e.data.getInt16(base+25,true);if(Math.hypot(x,y,z)<100)return;
 // Gravity-relative banking, independent of compass heading; no gyro integration drift.
 motionSample(-Math.atan2(x,Math.hypot(y,z))*180/Math.PI);
}
function motionDualBind(dev){if(MOTION.dev===dev)return;if(MOTION.dev)MOTION.dev.removeEventListener('inputreport',motionDualInput);MOTION.dev=dev;dev.addEventListener('inputreport',motionDualInput);motionReset();}
function motionPhoneAngle(beta,gamma,screenAngle){const b=beta*Math.PI/180,g=gamma*Math.PI/180,a=screenAngle*Math.PI/180,x=Math.sin(g)*Math.cos(b),y=-Math.sin(b),z=Math.cos(g)*Math.cos(b),right=x*Math.cos(a)+y*Math.sin(a),up=-x*Math.sin(a)+y*Math.cos(a);return Math.atan2(right,Math.hypot(up,z))*180/Math.PI;}
function motionPhoneInput(e){if(MOTION.mode!=='phone'||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;const a=screen.orientation?.angle??window.orientation??0;motionSample(motionPhoneAngle(e.beta,e.gamma,a));}
async function motionEnable(mode){MOTION.mode=mode;motionReset();motionUI();
 if(mode==='off'){motionStatus('Direção no analógico ou nos comandos normais.');saveCfg();return}
 if(mode==='dual'){
  motionStatus('Autorize o DualSense e mantenha-o na posição central.');
  if(!DUAL.dev?.opened&&!await dualChoose()){MOTION.mode='off';motionUI();motionStatus('Controle não autorizado. Direção normal mantida.');saveCfg();return}
  motionDualBind(DUAL.dev);motionStatus('Sensor conectado. Centro automático na próxima leitura; use Centralizar se necessário.');
 }else{
  try{if(!window.isSecureContext)throw Error('Sensor do celular requer HTTPS ou localhost.');const E=window.DeviceOrientationEvent;if(!E)throw Error('Sensor de orientação indisponível neste aparelho.');
   if(typeof E.requestPermission==='function'&&await E.requestPermission()!=='granted')throw Error('Permissão de movimento não concedida.');
   motionStatus('Segure o celular em paisagem. Use Centralizar na posição confortável.');
  }catch(e){MOTION.mode='off';motionStatus(e.message);motionUI();}
 }saveCfg();
}
function motionUI(){const mode=$('#motionMode');if(!mode)return;mode.value=MOTION.mode;$('#motionSensitivity').value=Math.round(MOTION.sens*100);$('#motionSensitivityOut').textContent=Math.round(MOTION.sens*100)+'%';$('#motionDeadzone').value=MOTION.dz;$('#motionDeadzoneOut').textContent=MOTION.dz+'°';$('#motionInvert').checked=MOTION.invert;}
window.addEventListener('deviceorientation',motionPhoneInput);
window.addEventListener('orientationchange',()=>{if(MOTION.mode==='phone'){motionReset();motionStatus('Orientação alterada: centralize o celular novamente.')}});
window.addEventListener('blur',()=>{MOTION.value=0;MOTION.last=0;keys.KeyW=keys.KeyS=false});
$('#motionMode').addEventListener('change',e=>motionEnable(e.target.value));
$('#touchSteer').addEventListener('change',e=>{S.touchSteer=e.target.value==='stick'?'stick':'arrows';saveCfg()});
$('#touchHide').addEventListener('change',e=>{S.touchHide=['auto','fade','off'].includes(e.target.value)?e.target.value:'auto';HUDA.lastTouch=performance.now();saveCfg()});
$('#optMiniAuto').addEventListener('change',e=>{S.miniAuto=e.target.checked;HUDA.miniT=performance.now();saveCfg()});
$('#motionCenter').addEventListener('click',motionCalibrate);
$('#motionAuthorize').addEventListener('click',()=>motionEnable($('#motionMode').value));
$('#motionSensitivity').addEventListener('input',e=>{MOTION.sens=+e.target.value/100;motionUI();saveCfg()});
$('#motionDeadzone').addEventListener('input',e=>{MOTION.dz=+e.target.value;motionUI();saveCfg()});
$('#motionInvert').addEventListener('change',e=>{MOTION.invert=e.target.checked;MOTION.value=0;motionUI();saveCfg()});

function dualExtraUI(){const v=$('#padSpeakerVolume');if(v){v.value=String(Math.round((PAD.speakerVolume??1)*100));$('#padSpeakerVolumeOut').textContent=v.value+'%';$('#padHealthLight').checked=PAD.lightbar!==false;$('#padSpeakerEnabled').checked=PAD.speakerEnabled!==false;v.disabled=PAD.speakerEnabled===false;}}
const DUAL_LINUX_COMMAND=`sudo tee /etc/udev/rules.d/70-pixelcity-dualsense.rules >/dev/null <<'EOF'
# DualSense USB
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0ce6", MODE="0660", TAG+="uaccess"
# DualSense Bluetooth
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", KERNELS=="*054C:0CE6*", MODE="0660", TAG+="uaccess"
# DualSense Edge USB
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0df2", MODE="0660", TAG+="uaccess"
# DualSense Edge Bluetooth
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", KERNELS=="*054C:0DF2*", MODE="0660", TAG+="uaccess"
EOF
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=hidraw`;
$('#dualLinuxCommand').textContent=DUAL_LINUX_COMMAND;
$('#dualLinuxCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(DUAL_LINUX_COMMAND);$('#dualLinuxCopyStatus').textContent='Comando copiado.'}catch(e){const selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('#dualLinuxCommand'));selection.removeAllRanges();selection.addRange(range);$('#dualLinuxCopyStatus').textContent='Selecionei o comando. Use Ctrl+C para copiar.'}});
$('#padSpeakerEnabled').addEventListener('change',e=>{PAD.speakerEnabled=e.target.checked;saveCfg();dualExtraUI();padAudioStatus(PAD.speakerEnabled?(PAD_AUDIO.ready?'Saída do controle ativada.':'Escolha a saída de áudio do controle.'):'Alto-falante do controle desligado. Bipe na saída normal.');});
$('#padSpeakerVolume').addEventListener('input',e=>{PAD.speakerVolume=+e.target.value/100;$('#padSpeakerVolumeOut').textContent=e.target.value+'%';saveCfg()});
$('#padHealthLight').addEventListener('change',async e=>{PAD.lightbar=e.target.checked;saveCfg();if(PAD.lightbar){if(!DUAL.dev?.opened)await dualChoose();DUAL.last='';dualTick(true)}else dualQueue(DUAL_OFF,DUAL_OFF,true,[40,100,255]);dualStatus()});

$('#pad_adaptive').addEventListener('change',async e=>{
 PAD.adaptive=e.target.checked;saveCfg();if(!PAD.adaptive){dualClear();dualStatus();return}
 if(!DUAL.dev||!DUAL.dev.opened){const ok=await dualChoose();if(!ok){PAD.adaptive=false;e.target.checked=false;saveCfg()}}
 dualStatus();
});
$('#pad_trigger_force').addEventListener('input',e=>{PAD.triggerForce=Number(e.target.value)/100;$('#pad_trigger_force_o').textContent=e.target.value+'%';DUAL.last='';saveCfg()});
$('#padAdaptiveConnect').addEventListener('click',async()=>{const ok=await dualChoose();if(ok){PAD.adaptive=true;$('#pad_adaptive').checked=true;saveCfg()}dualStatus()});
$('#padAdaptiveTest').addEventListener('click',async()=>{
 if(!DUAL.dev||!DUAL.dev.opened){if(!await dualChoose())return}
 PAD.adaptive=true;$('#pad_adaptive').checked=true;saveCfg();DUAL.testUntil=performance.now()+1800;DUAL.lastTick=0;dualTick();dualStatus();
});

const CFG_DEF={cloudQ:1,waterQ:1,fxWet:true,fxGlow:true,fxPaint:true,fxWin:true,fxSurf:true,mobLite:false,motion:{mode:'off',sens:1,dz:2,invert:false},vol:{master:.85,music:.25,sfx:.85,interior:.2},shadows:true,shadowQuality:1,bloom:true,refl:!MOB_LITE,sound:true,traffic:50,peds:50,showMinimap:true,miniAuto:true,touchHide:'auto',showHud:true,fpsLimit:0,renderScale:100,drawDistance:50,objectDistance:50,shadowDistance:50,detailedShadows:false,lang:((navigator.language||"pt-BR").toLowerCase().startsWith("pt")?"br":"en"),lampLighting:!MOB_LITE,lampCount:4,pad:{vib:1,sens:1,dz:.15,inv:false,adaptive:false,triggerForce:.65,speakerVolume:1,speakerEnabled:true,lightbar:true}};
{let armT=0;$('#cfgReset').addEventListener('click',()=>{const b=$('#cfgReset');if(performance.now()-armT>3000){armT=performance.now();b.textContent='CLIQUE DE NOVO PARA CONFIRMAR';$('#cfgResetMsg').textContent='Volta áudio e controle ao padrão e os gráficos ao MÉDIO.';setTimeout(()=>{if(performance.now()-armT>=2900){b.textContent='RESTAURAR PADRÕES';$('#cfgResetMsg').textContent=''}},3100);return}
  armT=0;applyCfgObj(JSON.parse(JSON.stringify(CFG_DEF)));try{graphicsPresetApply('MEDIUM')}catch(e){console.error(e)}/* v78: gráficos padrão = preset MÉDIO */refreshLampLighting();saveCfg();applyVolumes();try{applyShadows()}catch(e){}cfgUI();b.textContent='RESTAURAR PADRÕES';$('#cfgResetMsg').textContent='Configurações restauradas.';setTimeout(()=>$('#cfgResetMsg').textContent='',2500)})}
$('#padTest').addEventListener('click',()=>{if(!PAD.on){toast('NENHUM CONTROLE<br><small style="font-size:11px;color:#fff">conecte e aperte um botão</small>');return}PAD.until=0;rumble(1,.2,350);setTimeout(()=>{PAD.until=0;rumble(.1,1,350)},450)});
$('#optRain').addEventListener('change',e=>{S.rain=e.target.checked});
$('#optStorm').addEventListener('change',e=>{S.storm=e.target.checked;WX.stormNext=null;if(S.storm){if(!WX.stormCell&&WX.stormEta==null)WX.stormReq=true}else{WX.stormReq=false;if(WX.stormEta!=null){WX.stormEta=null;if(played)wxToast('PREVISÃO DO TEMPO','tempestade cancelada')}const sc=WX.stormCell;if(sc){if(sc.s<.05&&!sc.fading){sc.dead=true;WX.pre=1}else{sc.life=Math.min(sc.life,sc.age);sc.fading=true;sc.age=Math.max(sc.age,sc.life)}}}});
$('#optSound').addEventListener('change',e=>{S.sound=!e.target.checked;if(!S.sound&&AUDIO_TEST.mode)audioPreviewStop();applyVolumes();saveCfg()});
function shadowBaseSize(){return MOB_LITE?512:1024}
function shadowMapPixels(){const gpuCap=Math.min(renderer.capabilities.maxTextureSize||4096,MOB_LITE?2048:4096);return Math.min(shadowBaseSize()*S.shadowQuality,gpuCap)}
function syncShadowQualityUI(){const slider=$('#shadowQuality'),out=$('#shadowQualityOut');if(!slider||!out)return;
 slider.value=String(Math.max(0,[1,2,4].indexOf(S.shadowQuality)));
 const px=shadowMapPixels(),requested=shadowBaseSize()*S.shadowQuality;
 out.textContent=S.shadowQuality+'× · '+px+'²'+(px<requested?' (limite GPU)':'')+(S.shadowQuality===1?' · padrão':'')}
function applyShadowQuality(){const size=shadowMapPixels();if(sun.shadow.mapSize.x!==size||sun.shadow.mapSize.y!==size){sun.shadow.mapSize.set(size,size);
 if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}
 invalidateStaticShadows();renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1}syncShadowQualityUI()}
function applyShadows(){applyShadowQuality();invalidateStaticShadows();sun.castShadow=S.shadows;renderer.shadowMap.enabled=S.shadows;renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;scene.traverse(o=>{if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.needsUpdate=true)}})}
if(IS_MOBILE){ /* v3 r6: era MOB_LITE (desligado desde a r35) e o aviso de girar nunca fechava */
 let fsSkip=false;
 const portrait=matchMedia('(orientation: portrait)'),gate=$('#rotatePhone'),menuFull=$('#menuFullscreen');
 const syncOrientation=()=>{
  const vertical=portrait.matches;
  /* v3 r8: botão some só com tela cheia de verdade (Chrome deitado ainda mostra a barra de endereço) */
  menuFull.hidden=!!document.fullscreenElement||!document.documentElement.requestFullscreen;
  // Mobile vertical: aviso obrigatorio, inclusive no menu e durante a partida.
  // Nao abre o menu automaticamente; ao voltar para paisagem retoma a tela anterior.
  /* v3 r8: deitado sem tela cheia de verdade (Chrome ainda mostra a barra) = mesma tela, só com o botão.
     Não aparece sem a API (iPhone), instalado como app, ou depois de um pedido recusado (fsSkip). */
  const needFs=!vertical&&!fsSkip&&!document.fullscreenElement&&!!document.documentElement.requestFullscreen&&!matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  gate.classList.toggle('fs-only',needFs);
  gate.hidden=!(vertical||needFs);
  if(vertical||needFs){for(const k in keys)keys[k]=false;GUN.firing=false}
 };
 portrait.addEventListener('change',syncOrientation);
 addEventListener('orientationchange',syncOrientation);
 addEventListener('resize',syncOrientation);
 syncOrientation();
 async function requestLandscape(full){
  try{if(full&&!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{fsSkip=true}
  try{await screen.orientation?.lock?.('landscape')}catch{}
  syncOrientation();
 }
 $('#landscapeBtn').addEventListener('click',()=>requestLandscape(true));
 menuFull.addEventListener('click',()=>requestLandscape(true));
 document.addEventListener('fullscreenchange',syncOrientation);
 for(const id of ['play','seedPlay','resume'])document.getElementById(id).addEventListener('click',()=>requestLandscape(true));
}
function mgModeSync(){const stOn=!!played&&storyOn(),wLock=!!played&&!stOn&&!!POL.wanted;document.body.classList.toggle('story-on',stOn);const mb=$('#mgBtn'),mn=$('#mgLockNote');if(mb){mb.classList.toggle('wanted-lock',wLock);mb.setAttribute('aria-disabled',wLock?'true':'false');const msg=wLock?(S.lang==='en'?'MINIGAMES LOCKED · POLICE PURSUIT ACTIVE':'MINIGAMES BLOQUEADOS · EM PERSEGUIÇÃO POLICIAL'):translatePlain('Minigames');mb.title=msg;mb.setAttribute('aria-label',msg)}if(mn){mn.hidden=!wLock;if(wLock)mn.textContent='🚨 '+(S.lang==='en'?'MINIGAMES LOCKED · POLICE PURSUIT ACTIVE':'MINIGAMES BLOQUEADOS · EM PERSEGUIÇÃO POLICIAL')}const mp=$('#mgPanel');if(wLock&&mp&&!mp.hidden)mgClosePanel()}
function openMenu(){menuOpen=true;try{mgModeSync()}catch(e){}$('#menu').hidden=false;$('#resume').hidden=!played;$('#menuX').hidden=!played;modeSel=GAMEMODE;modePaint();syncSave();for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();syncMenu();applyLanguage();storySkipSync();const menuFocus=(STORYINTRO.active||STORYEND.active)?$('#storySkip'):(played?$('#resume'):$('#play'));menuFocus.focus()}
function closeMenu(){if(IS_MOBILE&&matchMedia('(orientation: portrait)').matches){$('#rotatePhone').hidden=false;return}if(played&&city.st&&city.st!==STYLES[S.style]){const active=Object.keys(STYLES).find(k=>STYLES[k]===city.st);if(active){S.style=active;syncMenu()}else{console.warn('Estilo ativo diferente: cidade atual preservada; reinicie a pagina para gerar outro mundo')}}menuOpen=false;$('#menu').hidden=true;if(AUDIO_TEST.mode)audioPreviewStop();storySkipSync();radioKick()}
$('#menuBtn').addEventListener('click',openMenu);$('#cmdBtn').addEventListener('click',openCmds);$('#cfgCmdBtn').addEventListener('click',openCmds);$('#regBtnMenu').addEventListener('click',openRecords);$('#cmdsClose').addEventListener('click',closeCmds);$('#cmds').addEventListener('click',e=>{if(e.target.id==='cmds')closeCmds()});
$('#resume').addEventListener('click',closeMenu);$('#menuX').addEventListener('click',closeMenu);
/* ===== v77: MODO FOTO (botão no menu de pausa) =====
   O jogo continua pausado (menuOpen=true); só o menu é ocultado e a câmera vira órbita livre
   em torno do personagem/veículo. Captura = render() + cópia imediata do canvas. */
const PHOTO={on:false,yaw:0,pitch:.35,dist:8,fov:50,tx:0,ty:1,tz:0,bx:0,bz:0,f:0,prevFov:50,prevNear:.1,ptrs:new Map(),pinch:0,keys:new Set(),hideT:0};
const PHOTO_FILTERS=[{n:'NORMAL',css:''},{n:'P&B',css:'grayscale(1) contrast(1.1)'},{n:'SÉPIA',css:'sepia(.85) contrast(1.05) brightness(1.03)'},{n:'VINTAGE',css:'sepia(.35) saturate(.8) contrast(.92) brightness(1.08) hue-rotate(-8deg)'},{n:'SUNSET',css:'saturate(1.45) contrast(1.08) hue-rotate(-14deg) brightness(1.04)'},{n:'NEON',css:'saturate(1.9) contrast(1.2) hue-rotate(18deg)'},{n:'NOIR',css:'grayscale(1) contrast(1.6) brightness(.9)'},{n:'VHS',css:'url(#vhsF) saturate(1.22) contrast(.92) brightness(1.07) sepia(.08)',vhs:true}];
function photoTarget(){if(PL.heli)return[PL.heli.x,PL.heli.y+1,PL.heli.z];if(PL.car)return[PL.car.x,(PL.car.gy||0)+1,PL.car.z];return[PL.x,(PL.gy||0)+1,PL.z]}
function photoFilterSync(){const f=PHOTO_FILTERS[PHOTO.f];canvas.style.filter=f.css||'';try{vhsShow(!!f.vhs&&PHOTO.on)}catch(e){}const b=$('#phFilter');if(b)b.textContent=(S.lang==='en'?'FILTER · ':'FILTRO · ')+(S.lang==='en'?({'NORMAL':'NONE','P&B':'B&W','SÉPIA':'SEPIA'}[f.n]||f.n):f.n)}
function photoEnter(){if(!played||!menuOpen||PHOTO.on)return;PHOTO.on=true;for(const m of ARROW_MATS)m.visible=false;const t=photoTarget();PHOTO.bx=t[0];PHOTO.bz=t[2];PHOTO.tx=t[0];PHOTO.ty=t[1];PHOTO.tz=t[2];
 const dx=camera.position.x-t[0],dy=camera.position.y-t[1],dz=camera.position.z-t[2],d=Math.hypot(dx,dy,dz)||8;PHOTO.dist=clamp(d,2,40);PHOTO.yaw=Math.atan2(dx,dz);PHOTO.pitch=clamp(Math.asin(clamp(dy/d,-1,1)),-.15,1.45);
 PHOTO.prevFov=camera.fov;PHOTO.prevNear=camera.near;PHOTO.fov=Math.round(clamp(camera.fov,20,90));$('#phFov').value=PHOTO.fov;
 PHOTO.ty0=PHOTO.ty;PHOTO.hOff=0;{const top=camMode==='top',h=$('#phHeight');h.value=0;h.disabled=top;$('#phHeightL').classList.toggle('off',top)} // v77: altura da câmera (não vale no topo/isométrico)
 $('#menu').hidden=true;$('#photoUI').hidden=false;$('#photoUI').classList.remove('ui-off');document.body.classList.add('photo-mode');photoFilterSync();try{applyLanguage()}catch(e){}
 clearTimeout(PHOTO.hideT);$('#phHint').style.opacity=1;PHOTO.hideT=setTimeout(()=>{const h=$('#phHint');if(h)h.style.opacity=0},4500);try{$('#phShot').focus()}catch(e){}requestAnimationFrame(photoMarkUI)}
function photoExit(){if(!PHOTO.on)return;try{vhsShow(false)}catch(e){}for(const m of ARROW_MATS)m.visible=true;if(PHOTO.hidePl){PHOTO.hidePl=false;phHidePlApply();const c=$('#phHidePl');if(c)c.checked=false}try{phSceneRestore()}catch(e){console.error(e)}{const P=$('#phScenePanel');if(P)P.hidden=true}{const P=$('#phMarkPanel');if(P)P.hidden=true;PHOTO.wmEdit=false;PHOTO.drag=null;canvas.style.cursor=''}PHOTO.on=false;PHOTO.ptrs.clear();PHOTO.keys.clear();canvas.style.filter='';document.body.classList.remove('photo-mode');$('#photoUI').hidden=true;
 camera.fov=PHOTO.prevFov;camera.near=PHOTO.prevNear;camera.updateProjectionMatrix();$('#menu').hidden=false;try{$('#photoBtn').focus()}catch(e){}}
/* v79r41: no modo foto o jogo está pausado, então o lado do sprite (frente/costas/perfil) não era recalculado e o boneco parecia preso à câmera.
   Agora, a cada quadro, só a DIREÇÃO é refeita a partir da câmera de foto; a pose (quadro da animação) fica congelada. Vale pro 2D e pro 3D (8 direções), jogador e pedestres por perto. */
function photoFaceTick(){if(PL.sp&&PL.sp.visible&&PL.tex&&PL.face)setFrame(PL.tex,pickDir(PL.face[0],PL.face[1],PL.x,PL.z),PL.tex._fr||0);
 for(const p of peds){if(!p.tex||!p.sp||!p.sp.visible||p.mx==null||p.inCar||p.hidden)continue;if(Math.abs(p.x-camera.position.x)>90||Math.abs(p.z-camera.position.z)>90)continue;if(!(p.mx||p.mz))continue;setFrame(p.tex,pickDir(p.mx,p.mz,p.x,p.z),p.tex._fr||0)}}
function photoCam(){const k=PHOTO.keys,step=.25*Math.max(1,PHOTO.dist/10),fx=-Math.sin(PHOTO.yaw),fz=-Math.cos(PHOTO.yaw),rx=-fz,rz=fx;
 let mx=0,mz=0;if(k.has('KeyW')||k.has('ArrowUp'))mz+=1;if(k.has('KeyS')||k.has('ArrowDown'))mz-=1;if(k.has('KeyD')||k.has('ArrowRight'))mx+=1;if(k.has('KeyA')||k.has('ArrowLeft'))mx-=1;
 if(k.has('KeyQ')||k.has('Minus')||k.has('NumpadSubtract'))PHOTO.dist=clamp(PHOTO.dist*1.03,2,40);if(k.has('KeyE')||k.has('Equal')||k.has('NumpadAdd'))PHOTO.dist=clamp(PHOTO.dist/1.03,2,40);
 if(camMode!=='top'&&(k.has('KeyR')||k.has('KeyV'))){PHOTO.hOff=clamp((PHOTO.hOff||0)+(k.has('KeyR')?.08:-.08),-1,25);PHOTO.ty=PHOTO.ty0+PHOTO.hOff;const h=$('#phHeight');if(h)h.value=PHOTO.hOff}
 if(mx||mz){PHOTO.tx+=(fx*mz+rx*mx)*step;PHOTO.tz+=(fz*mz+rz*mx)*step;const ox=PHOTO.tx-PHOTO.bx,oz=PHOTO.tz-PHOTO.bz,o=Math.hypot(ox,oz),L=30;if(o>L){PHOTO.tx=PHOTO.bx+ox/o*L;PHOTO.tz=PHOTO.bz+oz/o*L}}
 const cp=Math.cos(PHOTO.pitch),x=PHOTO.tx+Math.sin(PHOTO.yaw)*cp*PHOTO.dist,z=PHOTO.tz+Math.cos(PHOTO.yaw)*cp*PHOTO.dist;let y=PHOTO.ty+Math.sin(PHOTO.pitch)*PHOTO.dist;
 try{const g=groundY(x,z);if(y<g+.3)y=g+.3}catch(e){}
 camera.up.set(0,1,0);if(camera.fov!==PHOTO.fov||camera.near!==.1){camera.fov=PHOTO.fov;camera.near=.1;camera.updateProjectionMatrix()}camera.position.set(x,y,z);camera.lookAt(PHOTO.tx,PHOTO.ty,PHOTO.tz)}
{const _uc=updateCamera;updateCamera=function(dt,snap){if(PHOTO.on){photoCam();try{photoFaceTick()}catch(e){}return}if(POOL.on){poolCam(dt);return}if(DICE.on){diceCam(dt);return}return _uc(dt,snap)}}
/* v79r28: filtro VHS do modo foto — sem scanlines. Ao vivo: filtro SVG (#vhsF: luma levemente borrada na horizontal,
   vermelho puxado pra esquerda e azul borrado/puxado pra direita = sangria de cor) + OSD "PLAY ▶ / SP / data" + chiado e faixa de tracking embaixo (#vhsOSD).
   Na foto salva: o mesmo efeito refeito em pixels (vhsBake: YIQ com croma borrada e deslocada, preto levantado, ruído, tracking) + OSD desenhado. */
function vhsDateTxt(){const m=Math.floor(DN.tod||0),h=Math.floor(m/60)%24,mi=m%60,ap=h<12?'AM':'PM',h12=((h+11)%12)+1,MON=['JAN.','FEB.','MAR.','APR.','MAY','JUN.','JUL.','AUG.','SEP.','OCT.','NOV.','DEC.'],d=new Date();return[ap+' '+h12+':'+String(mi).padStart(2,'0'),MON[d.getMonth()]+' '+d.getDate()+' 1996']}
function vhsShow(on){const el=$('#vhsOSD');if(!el)return;if(on)try{document.fonts.load('40px VT323')}catch(e){}el.hidden=!on;if(on&&!VHS.iv){VHS.iv=setInterval(vhsAnim,70)}if(!on&&VHS.iv){clearInterval(VHS.iv);VHS.iv=null}}
var VHS={iv:null,t:0};
function vhsAnim(){const el=$('#vhsOSD');if(!el||el.hidden)return;VHS.t++;const [a,b]=vhsDateTxt();$('#vhsTime').textContent=a;$('#vhsDate').textContent=b;
 const c=$('#vhsNoise'),W=160,H=90;if(c.width!==W){c.width=W;c.height=H}const g=c.getContext('2d'),im=g.createImageData(W,H),d=im.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=Math.random()<.5?14:0}
 const band=H-6-Math.floor(Math.random()*3);for(let y=band;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4,v=Math.random()<.35?255:60;d[i]=d[i+1]=d[i+2]=v;d[i+3]=Math.random()<.6?120:30}g.putImageData(im,0,0);
 $('#vhsPlay').style.opacity=VHS.t%14<10?1:.85}
function vhsBake(x,w,h){const im=x.getImageData(0,0,w,h),d=im.data,n=w*h,Y=new Float32Array(n),I=new Float32Array(n),Q=new Float32Array(n);
 for(let p=0,i=0;p<n;p++,i+=4){const r=d[i],g=d[i+1],b=d[i+2];Y[p]=.299*r+.587*g+.114*b;I[p]=.596*r-.274*g-.322*b;Q[p]=.211*r-.523*g+.312*b}
 const k=Math.max(1,Math.round(w/640)),RC=7*k,SH=4*k,RY=k,tmp=new Float32Array(w);
 const blur=(A,rad,shift)=>{for(let y=0;y<h;y++){const o=y*w;let s=0,c=0;for(let x=-rad;x<=rad;x++){const xx=Math.min(w-1,Math.max(0,x));s+=A[o+xx];c++}for(let x=0;x<w;x++){tmp[x]=s/c;const a=Math.max(0,x-rad),bb=Math.min(w-1,x+rad+1);s+=A[o+bb]-A[o+a]}for(let x=0;x<w;x++)A[o+x]=tmp[Math.min(w-1,Math.max(0,x-shift))]}};
 blur(Y,RY,0);blur(I,RC,SH);blur(Q,RC,SH);
 const tb=Math.floor(h*.94);
 for(let y=0;y<h;y++){const off=y>=tb?Math.floor((Math.random()-.5)*14*k):0,o=y*w;for(let x=0;x<w;x++){const p=o+Math.min(w-1,Math.max(0,x+off)),i=(o+x)*4;
  let yy=Y[p]*.9+16,ii=I[p]*1.3,qq=Q[p]*1.2;const nz=(Math.random()-.5)*14;yy+=nz;
  let r=yy+.956*ii+.621*qq,g=yy-.272*ii-.647*qq,b=yy-1.106*ii+1.703*qq;r=r*1.03+4;b=b*.96;
  if(y>=tb&&Math.random()<.04){r=g=b=235}
  d[i]=r<0?0:r>255?255:r;d[i+1]=g<0?0:g>255?255:g;d[i+2]=b<0?0:b>255?255:b}}
 x.putImageData(im,0,0);
 const fs=Math.round(h*.045),pad=Math.round(h*.05),[a,bt]=vhsDateTxt();x.save();x.font='400 '+Math.round(fs*1.25)+'px "VT323","Silkscreen","Courier New",monospace';x.textBaseline='top';x.fillStyle='#f4f4f4';x.shadowColor='rgba(0,0,0,.85)';x.shadowOffsetX=Math.max(1,fs*.06);x.shadowOffsetY=Math.max(1,fs*.06);x.shadowBlur=0;
 x.fillText('PLAY ▶',pad,pad);x.textAlign='right';x.fillText('SP',w-pad,pad);x.textAlign='left';x.textBaseline='bottom';x.fillText(a,pad,h-pad-fs*1.2);x.fillText(bt,pad,h-pad);x.restore()}
function photoStamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())}
/* v78: marca d'água da foto — 'text' (assinatura original), 'logo' (a mesma logo do fim da missão 1, #prologueTitle) ou 'none'; PHOTO.wmS = escala 0,5–2,5. */
const PHOTO_MARKS=['logo','text','none'];
// v78: logo é a marca padrão; tamanho e posição ficam guardados por marca (localStorage) e a marca pode ser arrastada na tela.
const PHMARK=(()=>{let o={};try{o=JSON.parse(localStorage.getItem('pcPhotoMark')||'{}')||{}}catch(e){}return{wm:PHOTO_MARKS.includes(o.wm)?o.wm:'logo',s:o.s&&typeof o.s==='object'?o.s:{},p:o.p&&typeof o.p==='object'?o.p:{}}})();
function phMarkSave(){PHMARK.wm=PHOTO.wm;try{localStorage.setItem('pcPhotoMark',JSON.stringify({wm:PHMARK.wm,s:PHMARK.s,p:PHMARK.p}))}catch(e){}}
PHOTO.wm=PHMARK.wm;PHOTO.wmS=PHMARK.s[PHOTO.wm]||1;
function photoMarkDraw(x,w,h){const m=PHOTO.wm||'logo',k=(PHOTO.wmS||1);PHOTO.wmBox=null;if(m==='none')return;x.save();const pos=PHMARK.p[m];
 if(m==='text'){const fs=Math.max(10,Math.round(h*.026*k));x.font='700 '+fs+'px Fredoka, Inter, sans-serif';x.textAlign='right';x.textBaseline='bottom';x.shadowColor='rgba(0,0,0,.85)';x.shadowBlur=fs*.3;x.shadowOffsetX=x.shadowOffsetY=Math.max(1,fs*.06);const sub='Sunset Shores',sw=x.measureText(sub).width;const tw=x.measureText('Coastal Chaos ·').width+fs*.35+sw;let rx=w-fs*1.1,by=h-fs*.9;if(pos){rx=pos[0]*w+tw/2;by=pos[1]*h+fs/2}rx=clamp(rx,tw+2,w-2);by=clamp(by,fs+2,h-2);PHOTO.wmBox=[rx-tw,by-fs*1.1,rx,by+fs*.1,w,h];x.fillStyle='#5fe8ff';x.fillText(sub,rx,by);x.fillStyle='#ffd43a';x.fillText('Coastal Chaos ·',rx-sw-fs*.35,by)}
 else{try{const el=$('#prologueTitle');if(!PHOTO.logoOk){prologueTitleDraw();PHOTO.logoOk=true}const lw=Math.round(w*.22*k),lh=Math.round(lw*el.height/el.width),pad=Math.round(h*.02);let lx=w-lw-pad,ly=h-lh-pad;if(pos){lx=pos[0]*w-lw/2;ly=pos[1]*h-lh/2}lx=clamp(lx,0,Math.max(0,w-lw));ly=clamp(ly,0,Math.max(0,h-lh));PHOTO.wmBox=[lx,ly,lx+lw,ly+lh,w,h];x.drawImage(el,lx,ly,lw,lh)}catch(e){console.error(e)}}
 x.restore()}
function photoMarkPrev(){const c=$('#phMarkPrev');if(!c)return;const w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h}const x=c.getContext('2d');x.clearRect(0,0,w,h);if(PHOTO.on)photoMarkDraw(x,w,h);
 /* v78: contorno tracejado só na pré-visualização (não sai na foto) enquanto "Reposicionar" está ligado */
 const B=PHOTO.wmBox;if(PHOTO.on&&PHOTO.wmEdit&&B){x.save();x.setLineDash([6,4]);x.lineWidth=2;x.strokeStyle='#ffd43a';x.shadowColor='#000';x.shadowBlur=3;x.strokeRect(B[0]-4,B[1]-4,B[2]-B[0]+8,B[3]-B[1]+8);x.restore()}}
/* acerto do clique na marca (coords da pré-visualização) → dados do arrasto, ou null */
function phMarkHit(e){const B=PHOTO.wmBox,c=$('#phMarkPrev'),r=c&&c.getBoundingClientRect();if(!B||!r||!r.width)return null;const sx=r.width/B[4],sy=r.height/B[5],mx=(e.clientX-r.left)/sx,my=(e.clientY-r.top)/sy;
 if(mx<B[0]-8||mx>B[2]+8||my<B[1]-8||my>B[3]+8)return null;return{ox:mx-(B[0]+B[2])/2,oy:my-(B[1]+B[3])/2,w:B[4],h:B[5],sx,sy,r}}
function photoMarkUI(){const m=PHOTO.wm||'logo',b=$('#phMark');if(b)b.textContent=translatePlain('MARCA · '+({text:'TEXTO',logo:'LOGO',none:'NENHUMA'}[m]));const L=$('#phMarkSzL');if(L)L.classList.toggle('off',m==='none');const r=$('#phMarkSz');if(r){r.disabled=m==='none';r.value=Math.round((PHOTO.wmS||1)*100)}
 {const o=$('#phMarkSzO');if(o)o.textContent=Math.round((PHOTO.wmS||1)*100)+'%'}for(const q of document.querySelectorAll('#phMarkPanel [data-wm]'))q.setAttribute('aria-pressed',q.dataset.wm===m?'true':'false');
 {const t=$('#phMarkMoveT');if(t)t.textContent=translatePlain(m==='text'?'Reposicionar texto':'Reposicionar logo');const ml=$('#phMarkMoveL'),mv=$('#phMarkMove');if(m==='none'&&PHOTO.wmEdit){PHOTO.wmEdit=false}if(mv){mv.checked=!!PHOTO.wmEdit;mv.disabled=m==='none'}if(ml)ml.classList.toggle('off',m==='none');const rs=$('#phMarkReset');if(rs)rs.disabled=m==='none';const ce=$('#phMarkCenter');if(ce)ce.disabled=m==='none'}
 photoMarkPrev()}
function photoShot(){if(!PHOTO.on)return;photoCam();try{render()}catch(e){console.error(e)}
 const w=canvas.width,h=canvas.height,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const css=PHOTO_FILTERS[PHOTO.f].css;
 if(PHOTO_FILTERS[PHOTO.f].vhs){x.drawImage(canvas,0,0);vhsBake(x,w,h)}else{if(css&&'filter' in x)x.filter=css;x.drawImage(canvas,0,0);x.filter='none'}
 photoMarkDraw(x,w,h);
 const fl=$('#phFlash');fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');
 const name='coastal-chaos-seed'+S.seed+'-'+photoStamp()+'.png'; /* r33: seed no nome do arquivo */
 c.toBlob(async blob=>{if(!blob){toast(S.lang==='en'?'COULD NOT SAVE THE PHOTO':'NÃO FOI POSSÍVEL SALVAR A FOTO');return}
  try{if(TOUCH.on&&navigator.canShare){const file=new File([blob],name,{type:'image/png'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Coastal Chaos'});return}}}catch(e){if(e&&e.name==='AbortError')return}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast((S.lang==='en'?'PHOTO SAVED':'FOTO SALVA')+'<br><small>'+name+'</small>')},'image/png')}
/* v78: CENÁRIO do modo foto — hora, céu fechado (etapa da tempestade), chuva, clarão, raio parado e eclipse.
   O jogo segue pausado: updateWeather(0) recalcula o céu a partir do estado; aqui o estado é sobrescrito a cada quadro
   (pré e pós) só enquanto o modo foto está aberto. Ao sair, hora/eclipse/clima voltam ao que eram. */
const PHS={act:false,save:null,hour:null,cloud:0,rain:false,flash:false,bolt:null,ecl:0};
function phSceneOK(){const st=STYLES[S.style];return !(st.noWeather||city.haze||S.style==='inverted')}
function phSceneSave(){if(PHS.save)return;PHS.save={tod:DN.tod,day:DN.day,ecl:{...ECLIPSE},f:WX.f,gloom:WX.gloom,stormAmt:WX.stormAmt}}
function phSceneRestore(){const v=PHS.save;phBoltSet(false);PHS.act=false;PHS.cloud=0;PHS.rain=false;PHS.flash=false;PHS.ecl=0;PHS.hour=null;if(!v)return;PHS.save=null;
 DN.tod=v.tod;DN.day=v.day;Object.keys(ECLIPSE).forEach(k=>delete ECLIPSE[k]);Object.assign(ECLIPSE,v.ecl);WX.f=v.f;WX.gloom=v.gloom;WX.stormAmt=v.stormAmt;
 try{updateWeather(0);updateDayNight(0,true)}catch(e){console.error(e)}}
function phSceneUI(){const h=PHS.hour!=null?PHS.hour:DN.tod/60,hh=Math.floor(h),mm=Math.round((h-hh)*60);
 $('#phHour').value=h;$('#phHourO').textContent=String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');$('#phCloud').value=PHS.cloud;$('#phCloudO').textContent=PHS.cloud+'%';
 $('#phRain').checked=PHS.rain;$('#phFlashL').checked=PHS.flash;$('#phBolt').checked=!!PHS.bolt;$('#phEcl').value=PHS.ecl;$('#phEclO').textContent=PHS.ecl+'%'}
function phBoltSet(on){if(PHS.bolt){scene.remove(PHS.bolt);PHS.bolt.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});PHS.bolt=null}if(!on)return;
 const fw=new THREE.Vector3();camera.getWorldDirection(fw);fw.y=0;if(fw.lengthSq()<1e-4)fw.set(0,0,-1);fw.normalize();const sd=new THREE.Vector3(-fw.z,0,fw.x),d=230+Math.random()*120,lat=(Math.random()-.5)*d*.7;
 const x=camera.position.x+fw.x*d+sd.x*lat,z=camera.position.z+fw.z*d+sd.z*lat,pts=[];let px=x,pz=z;for(let y=170;y>0;y-=8+Math.random()*10){pts.push(px,y,pz);px+=(Math.random()-.5)*14;pz+=(Math.random()-.5)*14}pts.push(px,0,pz);
 const grp=new THREE.Group();for(const w of [0,.9,-.9]){const g=new THREE.BufferGeometry(),arr=pts.slice();for(let i=0;i<arr.length;i+=3){arr[i]+=w;arr[i+2]+=w*.5}g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));grp.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:w?0xb8c8ff:0xffffff,transparent:true,opacity:w?.55:1,fog:false})))}
 for(let k=0;k<3;k++){const i=3*(2+Math.floor(Math.random()*(pts.length/3-4)));const br=[pts[i],pts[i+1],pts[i+2]];let bx=pts[i],by=pts[i+1],bz=pts[i+2];for(let s2=0;s2<4;s2++){bx+=(Math.random()-.5)*16;by-=10+Math.random()*8;bz+=(Math.random()-.5)*16;br.push(bx,by,bz)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(br,3));grp.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xc8d4ff,transparent:true,opacity:.7,fog:false})))}
 scene.add(grp);PHS.bolt=grp}
function phSceneApply(){if(!PHOTO.on||!PHS.act||!phSceneOK())return;
 if(PHS.hour!=null)DN.tod=((PHS.hour*60)%1440+1440)%1440;
 // eclipse: 0% = lua (invisível) a alguns "cm" do sol · 100% = total
 if(PHS.ecl>0){const k=PHS.ecl/100;Object.assign(ECLIPSE,{on:true,stage:'photo',t:0,fade:1,sep:.12*(1-k)+.0001,style:S.style,seed:S.seed});ECLIPSE.dark=k>=1?1:eclipseDarkness(ECLIPSE.sep)}
 else if(ECLIPSE.stage==='photo'){ECLIPSE.on=false;ECLIPSE.dark=0;ECLIPSE.fade=0;ECLIPSE.stage=''}
 if(PHS.rain)WX.f=Math.max(.75,WX.f||0);else if(PHS.save)WX.f=Math.min(WX.f||0,PHS.cloud>0?PHS.save.f:WX.f||0)}
function phScenePost(){if(!PHOTO.on||!PHS.act||!phSceneOK())return;const k=PHS.cloud/100;
 if(k>0){const u=skyMat.uniforms.stormK.value,ub=skyMat.uniforms.stormB.value,dd=WX.stormDir||0;u.set(Math.cos(dd),Math.sin(dd),1.6-3.3*k,1);ub.set(1.6,0,1,0);
  WX.gloom=stormGloomTarget(k,true,false,1);WX.stormAmt=k;skyMat.uniforms.sunDim.value=1-.77*WX.gloom}
 if(PHS.rain){rain.visible=true;rainMat.uniforms.amt.value=.6+.4*Math.max(k,.3);/* a intensidade da chuva vem das células (CELLS_U): célula forte em volta da câmera; recalculada a cada quadro pelo clima */CELLS_U[0].set(camera.position.x,camera.position.z,600,1);rainGeo.setDrawRange(0,2*Math.round(MOB_LITE?3200:6000))}else if(PHS.save)rain.visible=false;
 updateDayNight(0,true);
 if(PHS.flash){hemi.intensity+=1.25;skyMat.uniforms.cloudCol.value.lerp(_c3.setRGB(.95,.95,1),.8)}}
{const _uw=updateWeather;updateWeather=function(dt){if(PHOTO.on&&PHS.act)phSceneApply();const r=_uw(dt);if(PHOTO.on&&PHS.act)phScenePost();return r}}
function phSceneTouch(){phSceneSave();PHS.act=true;phSceneApply();try{updateWeather(0)}catch(e){console.error(e)}phSceneUI()}
$('#phScene').addEventListener('click',()=>{const P=$('#phScenePanel');if(!phSceneOK()){toast(S.lang==='en'?'SCENE CONTROLS ONLY IN SUNSET SHORES':'CENÁRIO SÓ EM SUNSET SHORES');return}P.hidden=!P.hidden;if(!P.hidden){phSceneUI();const Q=$('#phMarkPanel');if(Q)Q.hidden=true}});
$('#phHour').addEventListener('input',e=>{PHS.hour=+e.target.value;phSceneTouch()});
$('#phCloud').addEventListener('input',e=>{PHS.cloud=+e.target.value;phSceneTouch()});
$('#phRain').addEventListener('change',e=>{PHS.rain=e.target.checked;phSceneTouch()});
/* v79r2: modo foto · ocultar o personagem (sprite + sombra); volta ao sair */
function phHidePlApply(){const h=!!PHOTO.hidePl;if(h){if(PHOTO.plVis==null)PHOTO.plVis=[PL.sp.visible,PL.sh.visible];PL.sp.visible=false;PL.sh.visible=false}else if(PHOTO.plVis){PL.sp.visible=PHOTO.plVis[0];PL.sh.visible=PHOTO.plVis[1];PHOTO.plVis=null}}
$('#phHidePl').addEventListener('change',e=>{PHOTO.hidePl=e.target.checked;phHidePlApply()});
$('#phFlashL').addEventListener('change',e=>{PHS.flash=e.target.checked;phSceneTouch()});
$('#phBolt').addEventListener('change',e=>{phSceneSave();PHS.act=true;phBoltSet(e.target.checked)});
$('#phBoltNew').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();phSceneSave();PHS.act=true;phBoltSet(true);$('#phBolt').checked=true});
$('#phEcl').addEventListener('input',e=>{PHS.ecl=+e.target.value;phSceneTouch()});
$('#phSceneReset').addEventListener('click',()=>{phSceneRestore();phSceneUI()});
/* v78: janela MARCA D'ÁGUA (botão da barra / M): tipo, tamanho, "Reposicionar" (arrastar só com o tick) e restaurar o padrão. Abre uma janela por vez (CENÁRIO ou MARCA). */
$('#phMark').addEventListener('click',()=>{const P=$('#phMarkPanel');P.hidden=!P.hidden;if(!P.hidden){const Q=$('#phScenePanel');if(Q)Q.hidden=true}photoMarkUI()});
for(const q of document.querySelectorAll('#phMarkPanel [data-wm]'))q.addEventListener('click',()=>{PHOTO.wm=q.dataset.wm;PHOTO.wmS=PHMARK.s[PHOTO.wm]||1;phMarkSave();photoMarkUI()});
$('#phMarkSz').addEventListener('input',e=>{PHOTO.wmS=+e.target.value/100;PHMARK.s[PHOTO.wm]=PHOTO.wmS;phMarkSave();const o=$('#phMarkSzO');if(o)o.textContent=Math.round(PHOTO.wmS*100)+'%';photoMarkPrev()});
$('#phMarkMove').addEventListener('change',e=>{PHOTO.wmEdit=e.target.checked;if(!PHOTO.wmEdit)canvas.style.cursor='';photoMarkPrev()});
/* r28: centraliza a marca (logo ou texto) no meio da foto, X e Y */
$('#phMarkCenter').addEventListener('click',()=>{const m=PHOTO.wm||'logo';if(m==='none')return;PHMARK.p[m]=[.5,.5];phMarkSave();photoMarkUI()});
$('#phMarkReset').addEventListener('click',()=>{const m=PHOTO.wm||'logo';delete PHMARK.p[m];delete PHMARK.s[m];PHOTO.wmS=1;phMarkSave();photoMarkUI()});
addEventListener('resize',()=>{if(PHOTO.on)photoMarkPrev()});
$('#photoBtn').addEventListener('click',photoEnter);$('#phBack').addEventListener('click',photoExit);$('#phShot').addEventListener('click',photoShot);
$('#phFilter').addEventListener('click',()=>{PHOTO.f=(PHOTO.f+1)%PHOTO_FILTERS.length;photoFilterSync()});
$('#phFov').addEventListener('input',e=>{PHOTO.fov=+e.target.value});$('#phHeight').addEventListener('input',e=>{if(camMode==='top')return;PHOTO.hOff=+e.target.value;PHOTO.ty=(PHOTO.ty0??PHOTO.ty)+PHOTO.hOff});
$('#phHide').addEventListener('click',e=>{e.stopPropagation();$('#photoUI').classList.add('ui-off')});
addEventListener('keydown',e=>{if(!PHOTO.on)return;const c=e.code;
 if(c==='Escape'){e.preventDefault();e.stopImmediatePropagation();if($('#photoUI').classList.contains('ui-off'))$('#photoUI').classList.remove('ui-off');else photoExit();return}
 if((c==='Space'||c==='Enter'||c==='NumpadEnter')&&!(document.activeElement&&document.activeElement.id&&document.activeElement.id!=='phShot'&&document.activeElement.tagName==='BUTTON')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)photoShot();return}
 if(c==='KeyH'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('#photoUI').classList.toggle('ui-off');return}
 if(c==='KeyM'&&!(document.activeElement&&document.activeElement.tagName==='INPUT')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('#phMark').click();return}
 if(c==='KeyC'&&!(document.activeElement&&document.activeElement.tagName==='INPUT')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)$('#phScene').click();return}
 if(c==='KeyF'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){PHOTO.f=(PHOTO.f+1)%PHOTO_FILTERS.length;photoFilterSync()}return}
 if(c==='Tab'||c.startsWith('Arrow')&&document.activeElement&&(document.activeElement.id==='phFov'||document.activeElement.id==='phHeight'))return;
 PHOTO.keys.add(c);if(!e.ctrlKey&&!e.metaKey){e.preventDefault();e.stopImmediatePropagation()}},true);
addEventListener('keyup',e=>{if(!PHOTO.on)return;PHOTO.keys.delete(e.code);e.stopImmediatePropagation()},true);
addEventListener('blur',()=>PHOTO.keys.clear());
{const P=PHOTO,isGl=e=>e.target===canvas;
 addEventListener('pointerdown',e=>{if(!P.on||!isGl(e))return;e.preventDefault();e.stopImmediatePropagation();
  /* v78: arrastar a marca SÓ com "Reposicionar" ligado na janela MARCA D'ÁGUA (antes a marca capturava o clique; e um // no meio desta linha engolia o P.ptrs.set abaixo → a câmera não girava com o mouse) */
  {const h=P.wmEdit&&!P.ptrs.size&&phMarkHit(e);if(h){P.drag=Object.assign({id:e.pointerId},h);try{canvas.setPointerCapture(e.pointerId)}catch(_){}return}}
  P.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId)}catch(_){}
  if($('#photoUI').classList.contains('ui-off')&&P.ptrs.size===1){P.tap={x:e.clientX,y:e.clientY,t:performance.now()}}
  if(P.ptrs.size===2){const a=[...P.ptrs.values()];P.pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}},true);
 addEventListener('pointermove',e=>{const D=P.drag;if(P.on&&D&&D.id===e.pointerId){e.preventDefault();e.stopImmediatePropagation();const mx=(e.clientX-D.r.left)/D.sx-D.ox,my=(e.clientY-D.r.top)/D.sy-D.oy;PHMARK.p[P.wm]=[clamp(mx/D.w,0,1),clamp(my/D.h,0,1)];photoMarkPrev();return}
  if(P.on&&!P.ptrs.size&&e.target===canvas){const c=P.wmEdit&&phMarkHit(e)?'move':'';if(canvas.style.cursor!==c)canvas.style.cursor=c}
  if(!P.on||!P.ptrs.has(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();const prev=P.ptrs.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;P.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(P.ptrs.size===1){P.yaw-=dx*.006;P.pitch=clamp(P.pitch+dy*.005,-.15,1.45)}
  else if(P.ptrs.size===2){const a=[...P.ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(P.pinch>0)P.dist=clamp(P.dist*P.pinch/d,2,40);P.pinch=d}},true);
 const up=e=>{if(P.drag&&P.drag.id===e.pointerId){P.drag=null;phMarkSave();e.stopImmediatePropagation();return}if(!P.on||!P.ptrs.has(e.pointerId))return;e.stopImmediatePropagation();P.ptrs.delete(e.pointerId);P.pinch=0;
  if(P.tap&&performance.now()-P.tap.t<300&&Math.hypot(e.clientX-P.tap.x,e.clientY-P.tap.y)<10)$('#photoUI').classList.remove('ui-off');P.tap=null};
 addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);
 /* r31: mesma trava da sinuca — sem dedos na tela, não sobra dedo-fantasma (giro/pinça do modo foto) */
 for(const ev of['touchend','touchcancel'])addEventListener(ev,e=>{if(P.on&&!e.touches.length&&P.ptrs.size){P.ptrs.clear();P.pinch=0}},true);
 addEventListener('wheel',e=>{if(!P.on||!isGl(e))return;e.preventDefault();e.stopImmediatePropagation();P.dist=clamp(P.dist*Math.exp(e.deltaY*.0012),2,40)},{capture:true,passive:false});
 for(const ev of ['touchstart','touchmove','mousedown','mousemove','click','contextmenu'])addEventListener(ev,e=>{if(P.on&&isGl(e)){e.stopImmediatePropagation();if(ev!=='click')try{e.preventDefault()}catch(_){}}},{capture:true,passive:false});}

$('#play').addEventListener('click',generateCityFromSeed); /* v78: um botão só — gera com a seed do campo (sorteada a cada abertura; SORTEAR troca) usando tamanho e hora escolhidos */
// Retorno verdadeiro à tela inicial, sem depender de F5/teclado: o botão recebe
// foco pelo mesmo navegador de menus do gamepad e é acionado por X/A.
// Não tenta salvar automaticamente nem mantém a cidade antiga na memória.
$('#backToStart').addEventListener('click',()=>{if(!played||!menuOpen)return;const b=$('#backToStart');if(!b.classList.contains('armed')){b.classList.add('armed');b.dataset.label=b.textContent;b.textContent=S.lang==='en'?'TAP AGAIN TO CONFIRM':'TOQUE DE NOVO PARA CONFIRMAR';clearTimeout(b._armT);b._armT=setTimeout(()=>{b.classList.remove('armed');if(b.dataset.label)b.textContent=b.dataset.label},3200);return}location.reload()});
// Aquecimento da GPU: prepara texturas e programas antes de liberar os controles.
// A cidade residente permanece preparada durante a partida.
function setLoadProgress(p,msg){
 const n=Math.max(0,Math.min(100,Math.round(p)));if(typeof RIFT!=='undefined'&&RIFT.on)riftBarSet(n/100);if(n<10){const lm=$('#loadMap');if(lm)lm.hidden=true}
 $('#loadFill').style.width=n+'%';$('#loadPercent').textContent=n+'%';
 $('#loadTrack').setAttribute('aria-valuenow',String(n));
 if(msg)$('#loadText').textContent=msg;
}
async function warmCityGPU(){
 const textures=new Set();scene.traverse(obj=>{const mats=obj.material?Array.isArray(obj.material)?obj.material:[obj.material]:[];for(const m of mats)if(m)for(const key of ['map','normalMap','roughnessMap','metalnessMap','alphaMap','emissiveMap','aoMap','bumpMap']){const t=m[key];if(t&&t.isTexture&&t.image)textures.add(t)}});
 const batch=IS_MOBILE?6:20,all=[...textures];for(let i=0;i<all.length;i+=batch){for(const tex of all.slice(i,i+batch))try{renderer.initTexture(tex)}catch(err){console.warn('Texture warmup:',err)}setLoadProgress(45+Math.round(18*Math.min(1,(i+batch)/Math.max(1,all.length))),'PREPARANDO TEXTURAS…');await nextTimeFrame()}
 setLoadProgress(64,'PREPARANDO EXPLOSÕES, FUMAÇA, LUZES E TEMPESTADE…');await nextTimeFrame();
 {const hid=[];scene.traverse(o=>{if(!o.visible){hid.push(o);o.visible=true}});const rk=new THREE.Group();rk.add(new THREE.Mesh(RKT.geo,RKT.mat));try{rk.add(new THREE.Mesh(RKT.geo,burntMat))}catch(e){}rk.position.set(PL.x,-50,PL.z);scene.add(rk);const tod=DN.tod;
  try{_partM.compose(_partV.set(PL.x,-50,PL.z),camera.quaternion,_partS.set(1,1,1));PART_NORM_IM.setMatrixAt(0,_partM);PART_ADD_IM.setMatrixAt(0,_partM);PART_NORM_IM.count=1;PART_ADD_IM.count=1;PART_NORM_IM.instanceMatrix.needsUpdate=true;PART_ADD_IM.instanceMatrix.needsUpdate=true;if(typeof renderer.compileAsync==='function')await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
   DN.tod=23*60;try{updateDayNight(0,true)}catch(e){}renderer.compile(scene,camera);if(composer){try{composer.render()}catch(e){console.warn('Bloom warmup:',e)}}DN.tod=tod;try{updateDayNight(0,true)}catch(e){}}catch(err){console.warn('FX warmup:',err)}finally{PART_NORM_IM.count=0;PART_ADD_IM.count=0;scene.remove(rk);for(const o of hid)o.visible=false}}
 const chunks=[...city.chunks.values()];
 setLoadProgress(65,'PREPARANDO MATERIAIS PRÓXIMOS E DISTANTES…');await nextTimeFrame();
 // Compilação em TODAS as faixas do fade (clean + dither + isoFade off/on) durante o carregamento, sem esperar a primeira visita.
 try{
  const warmPass=async()=>{if(typeof renderer.compileAsync==='function')await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera)};
  for(const isoOn of [true,false]){isoFadeSetCompile(isoOn);
   for(const d of [1e6,MOB_LITE?80:100,MOB_LITE?40:70,MOB_LITE?16:50,0]){for(const ch of chunks)chunkLod(ch,d,true);await warmPass()}}
 }catch(err){console.warn('Shader warmup:',err)}finally{isoFadeSetCompile(false);for(const ch of chunks)chunkLod(ch,0,true)}
 // ============================================================================
 // >>> NÃO ALTERAR AQUI <<<  GPU WARMUP / drawRange DOS SPRITES — v258
 // Não aplicar setDrawRange(0,0) a THREE.Sprite nem deixar o drawRange alterado
 // após o warmup. Não descartar sua geometria compartilhada.
 // A v258 foi testada com sucesso em múltiplas viagens entre os mundos.
 // ============================================================================
 // A zero-vertex offscreen render still lets Three upload all BufferAttributes.
 // No extra copy of the resident geometry is kept; ranges and visibility are restored afterwards.
 const target=new THREE.WebGLRenderTarget(8,8,{depthBuffer:false,stencilBuffer:false}),previous=renderer.getRenderTarget(),visible=new Map(),frustum=new Map(),ranges=new Map(),autoShadow=renderer.shadowMap.autoUpdate,shadowDirty=renderer.shadowMap.needsUpdate,layers=camera.layers.mask;
 try{renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;camera.layers.enableAll();
  // O THREE.Sprite usa uma geometria compartilhada (inclusive com sprites de outros mundos).
  // Nunca zerar drawRange dos sprites: esse estado pode sobreviver à troca de cidade.
  scene.traverse(o=>{visible.set(o,o.visible);if(o.isMesh||o.isSprite||o.isLine||o.isPoints){frustum.set(o,o.frustumCulled);o.frustumCulled=false;if(!o.isSprite&&o.geometry&&!ranges.has(o.geometry)){ranges.set(o.geometry,{...o.geometry.drawRange});o.geometry.setDrawRange(0,0)}}});
  // Upload também dos buffers LOD normalmente ocultos (zero triângulos; sem pop no primeiro uso).
  for(const ch of chunks)if(ch._lodFade)for(const group of Object.values(ch._lodFade))for(const e of group)e.mesh.visible=true;
  for(const root of scene.children)if(root!==city.group&&!root.isLight)root.visible=false;city.group.visible=true;for(const ch of chunks)ch.group.visible=false;renderer.setRenderTarget(target);
  for(let i=0;i<chunks.length;i++){const ch=chunks[i];ch.group.visible=true;renderer.render(scene,camera);ch.group.visible=false;setLoadProgress(70+Math.round(25*(i+1)/chunks.length),'PREPARANDO REGIÕES NA GPU · '+(i+1)+' / '+chunks.length);await nextTimeFrame()}
 }catch(err){console.warn('Geometry warmup:',err)}finally{for(const [g,r] of ranges)g.setDrawRange(r.start,r.count);for(const [o,v] of visible)o.visible=v;for(const [o,f] of frustum)o.frustumCulled=f;camera.layers.mask=layers;renderer.shadowMap.autoUpdate=autoShadow;renderer.shadowMap.needsUpdate=shadowDirty;renderer.setRenderTarget(previous);target.dispose()}
 // Garante o drawRange compartilhado dos sprites e a camada de renderização após warmup.
 // Nenhum material, atlas, programa GLSL ou textura é refeito aqui.
 actorSpriteRenderIntegrity(true);
 setLoadProgress(97,'FINALIZANDO A CIDADE…');await nextTimeFrame();
 try{const ms=charPreload3D();if(ms)console.log('[sprites 3D] pré-carregados em',ms,'ms')}catch(e){console.error(e)}
}
// Real first-frame preparation, including all camera directions and the
// postprocessing targets. The regular loop is suspended by the loading panel.
async function warmInitialViews(){
 setLoadProgress(97,'PREPARANDO VEÍCULOS E PERSONAGENS…');
 updateCloseCarDetails(1);
 const focus=PL.car||PL;
 for(const car of vehicles){
  ensureDetail(car);
  if(car.g)syncCar(car,0);
 }
 writeInstances();updatePeds(0);updateDayNight(0,true);
 camT.x=focus.x;camT.z=focus.z;updateCamera(1);
 updateWeather(0);updateHeadlights();updateNearbyLampLights(0);
 const settleAllLod=()=>{for(const ch of city.chunks.values())chunkLod(ch,Math.hypot(Math.max(ch.x0-camera.position.x,0,camera.position.x-ch.x1),Math.max(ch.z0-camera.position.z,0,camera.position.z-ch.z1)),true);cullChunks()};
 settleAllLod();
 const position=camera.position.clone(),quaternion=camera.quaternion.clone(),up=camera.up.clone();
 const distance=Math.max(8,Math.min(70,Math.hypot(position.x-focus.x,position.z-focus.z)));
 try{
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3;
   camera.up.set(0,1,0);
   camera.position.set(focus.x+Math.cos(angle)*distance,Math.max((focus.gy||0)+3,position.y),focus.z+Math.sin(angle)*distance);
   camera.lookAt(focus.x,(focus.gy||0)+1.3,focus.z);
   updateNearbyLampLights(1);render();
   setLoadProgress(97+Math.round(2*(i+1)/6),'DESENHANDO VISTAS INICIAIS · '+(i+1)+' / 6');
   await nextTimeFrame();
  }
 }finally{
  camera.position.copy(position);camera.quaternion.copy(quaternion);camera.up.copy(up);settleAllLod();
 }
 render();
 // Wait for submitted GPU work, rather than a fixed timeout.
 const gl=renderer.getContext();
 if(gl.fenceSync){
  const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
  try{while(true){const status=gl.clientWaitSync(fence,0,0);if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED)break;if(status===gl.WAIT_FAILED)throw new Error('Falha na preparação da GPU');await nextTimeFrame()}}
  finally{gl.deleteSync(fence)}
 }else gl.finish();
}
/* ================= v83: TOP SECRET — VIAGEM ENTRE DIMENSÕES ================= */
const TIMEJUMP={busy:false,cool:0,armed:true,loading:false};
const delayTimeJump=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const nextTimeFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
function timeFadeTo(black){const el=$('#timeFade');if(black){el.hidden=false;el.style.transition='none';el.style.opacity='0';void el.offsetWidth;el.style.transition='opacity .6s ease-in-out';el.style.opacity='1'}else{el.style.opacity='0'}}
function timeFlash(x,z){
 // Mesmos flashes, fogo, fumaça, faíscas e áudio da explosão comum,
 // mas estritamente visuais: sem chamar blastAt (que causa danos e mata o jogador).
 boomLight.position.set(x,4,z);boomLight.intensity=10;boomT=.7;
 for(let i=0;i<34;i++){const a=Math.random()*6.28,v=Math.random()*9;emit(x,1+Math.random()*1.5,z,Math.cos(a)*v,2+Math.random()*7,Math.sin(a)*v,.6+Math.random()*.5,2.6,5.5,Math.random()<.5?0xff7a1a:0xffc040,true,.95)}
 for(let i=0;i<22;i++){const a=Math.random()*6.28,v=Math.random()*4;emit(x,2,z,Math.cos(a)*v,1.5+Math.random()*3,Math.sin(a)*v,2.4+Math.random(),2.5,8,0x1c1818,false,.75)}
 for(let i=0;i<30;i++){const a=Math.random()*6.28,v=6+Math.random()*12;emit(x,1,z,Math.cos(a)*v,4+Math.random()*8,Math.sin(a)*v,.8,.3,.08,0xffd070,true,1)}
 shake=Math.max(shake,1.6);rumble(1,.8,500);boomSound(0);
}
function engineCut(){if(!AC)return;const t=AC.currentTime;for(const g of[engG,scrG]){try{g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.setTargetAtTime(0,t,.03)}catch(e){}}}
async function timeJump(){
 const c=PL.car;
 if(S.style==='inverted'||TIMEJUMP.busy||TIMEJUMP.cool>0||!running||!played||!c||c.type!=='super'||!c.special||!c.alive||PL.dead)return;
 TIMEJUMP.busy=true;TIMEJUMP.armed=false;TIMEJUMP.cool=5;
 const from={x:c.x,z:c.z,a:c.a,vx:c.vx,vz:c.vz,w:c.w,hp:c.hp,fuel:c.fuel};
 let snapshot=null;try{snapshot=buildSave()}catch(e){console.warn('Time jump snapshot:',e)}
 if(!snapshot){TIMEJUMP.busy=false;return}
 const target=S.style==='modern'?'synthwave':'modern';
 const fade=$('#timeFade'),loading=$('#loading');
 try{
  musicTravelOut();
  // 0 ms: explosão normal VISUAL, sem o dano da blastAt; a cena continua renderizando.
  timeFlash(from.x,from.z);
  /* v2 r3.1: motor (e chiado de pneu) calam na explosão e só voltam quando o carro reaparece na outra ponta;
     durante o carregamento o loop não roda updateAudio e o ganho ficava preso no último valor */
  TIMEJUMP.mute=true;engineCut();
  await delayTimeJump(100);
  // 100 ms: o Top Secret desaparece, incluindo barras e esfera branca.
  if(c.g)c.g.visible=false;
  if(c.timeGlow)for(const b of c.timeGlow)b.visible=false;
  if(c.timeBall)c.timeBall.visible=false;
  HEAD.spot.intensity=0;HEAD.beam.visible=false;
  /* v2 r3.1: com TIMEJUMP.busy o loop não roda update() → simT parado → o mapa de sombra não era refeito e a sombra do carro
     ficava no chão depois que ele sumia. Força uma atualização agora (a chegada já roda update normalmente). */
  renderer.shadowMap.needsUpdate=true;shadowRefreshAt=-1;
  // 1000 ms após a explosão: iniciar fade in preto, com a explosão ainda animando até lá.
  await delayTimeJump(900);
  timeFadeTo(true);
  await delayTimeJump(650); // carregar SOMENTE quando a tela estiver toda preta
  TIMEJUMP.loading=true;
  loading.hidden=false;setLoadProgress(5,'140 KM/H · RUPTURA TEMPORAL…');
  await nextTimeFrame();
  // O loading passa a ser visível sob a transição negra (sem corte brusco).
  fade.hidden=true;fade.style.opacity='0';
  S.style=target;clearRiverBoats();await generateCity();initRiverBoats();applyShadows();
  setLoadProgress(45,'RECONSTRUINDO O MESMO MUNDO…');
  await nextTimeFrame();await warmCityGPU();
  snapshot.style=target;snapshot.x=from.x;snapshot.z=from.z;
  snapshot.car={...snapshot.car,type:'super',color:'#92969d',a:from.a,hp:from.hp,fuel:from.fuel,nitro:true};
  applySave(snapshot);
  if(PL.car){
   const nc=PL.car;nc.color='#92969d';nc.icol=COL(nc.color);nc.special=true;nc.hasNitro=true;nc.hasGlow=false;
   nc.vx=from.vx;nc.vz=from.vz;nc.w=from.w;nc.fwd=from.vx*Math.cos(nc.a)+from.vz*Math.sin(nc.a);
   nc.sleep=false;nc.hand=false;nc.hp=from.hp;nc.fuel=from.fuel;
   PL.x=nc.x;PL.z=nc.z;
   ensureDetail(nc);syncCar(nc,0);
  }
  // Chegada: o mapa já está pronto, mas o Top Secret ainda NÃO existe visualmente.
  // Isso evita que ele apareça parado durante o fade de saída do loading.
  const arrived=PL.car;
  if(arrived){
   ensureDetail(arrived);syncCar(arrived,0);
   if(arrived.g)arrived.g.visible=false;
   if(arrived.timeGlow)for(const bar of arrived.timeGlow)bar.visible=false;
   if(arrived.timeBall)arrived.timeBall.visible=false;
  }
  HEAD.spot.intensity=0;HEAD.beam.visible=false;
  updateDayNight(0,true);syncMenu();
  setLoadProgress(100,'VIAGEM CONCLUÍDA!');
  fade.hidden=false;fade.style.transition='none';fade.style.opacity='1';
  await nextTimeFrame();loading.hidden=true;musicTravelIn();
  updateCamera(0);await nextTimeFrame();
  // Chegada sem pausa: a física volta a rodar já durante o fade, com o carro mantendo os 140 km/h (ainda invisível).
  TIMEJUMP.busy=false;TIMEJUMP.loading=false;TIMEJUMP.hide=true;TIMEJUMP.armed=false;
  // Inverso da ida: parado e invisível até a explosão; no flash ele surge e já sai andando.
  if(arrived)TIMEJUMP.hold={c:arrived,x:arrived.x,z:arrived.z,a:arrived.a,vx:arrived.vx,vz:arrived.vz,fwd:arrived.fwd};
  // Revelar primeiro o mundo vazio: o carro só retorna na segunda explosão.
  fade.style.transition='opacity .6s ease-in-out';fade.style.opacity='0';
  await delayTimeJump(650);fade.hidden=true;
  if(arrived){
   timeFlash(PL.car===arrived?arrived.x:arrived.x,arrived.z);
   // Primeiros 100 ms: apenas a explosão, ainda sem carro.
   await delayTimeJump(100);
   {const H=TIMEJUMP.hold;TIMEJUMP.hold=null;if(H){arrived.vx=H.vx;arrived.vz=H.vz;arrived.fwd=H.fwd}}TIMEJUMP.show=true;TIMEJUMP.mute=false;if(arrived.g)arrived.g.visible=true;
   // A reaparição não reativa as barras/esfera da viagem anterior.
   if(arrived.timeGlow)for(const bar of arrived.timeGlow)bar.visible=false;
   if(arrived.timeBall)arrived.timeBall.visible=false;
   // Deixar a explosão terminar antes de liberar física, volante e acelerador.
   await delayTimeJump(450);
  }
  TIMEJUMP.hide=false;TIMEJUMP.show=false;TIMEJUMP.cool=5;
  toast(target==='synthwave'?'140 KM/H · BEM-VINDO AO SYNTHWAVE':'140 KM/H · DE VOLTA AO MODERN');
 }catch(err){
  musicTravelReset();console.error('Viagem temporal:',err);
  if(c.g)c.g.visible=true;
  if(PL.car&&PL.car.g)PL.car.g.visible=true;
  loading.hidden=true;fade.hidden=true;fade.style.opacity='0';
  toast('ERRO NA VIAGEM TEMPORAL · VEJA O CONSOLE');
 }finally{TIMEJUMP.mute=false;TIMEJUMP.hold=null;TIMEJUMP.hide=false;TIMEJUMP.show=false;TIMEJUMP.busy=false;TIMEJUMP.loading=false;TIMEJUMP.cool=Math.max(TIMEJUMP.cool,4)}
}
function timeJumpTick(dt){{const H=TIMEJUMP.hold;if(H&&H.c){const c=H.c;c.x=H.x;c.z=H.z;c.a=H.a;c.vx=c.vz=0;c.fwd=0;if(c===PL.car){PL.x=c.x;PL.z=c.z}}}
 TIMEJUMP.cool=Math.max(0,TIMEJUMP.cool-dt);
 const c=PL.car;
 if(S.style==='inverted'||!c||c.type!=='super'||!c.special||!c.alive||PL.dead)return;
 const kmh=Math.abs(c.fwd)*3.6;
 if(kmh<92&&!TIMEJUMP.busy)TIMEJUMP.armed=true;
 if(c.timeGlow){
  const t=clamp((kmh-64)/76,0,1),pulse=.75+.25*Math.sin(simT*14);
  for(const bar of c.timeGlow){bar.visible=!TIMEJUMP.busy&&!TIMEJUMP.hide&&kmh>=64;bar.material.opacity=(.12+.88*t)*pulse*(bar.userData.energyGain||.98)}
 }
 if(c.timeBall){
  const t=clamp((kmh-112)/28,0,1);
  c.timeBall.visible=!TIMEJUMP.busy&&!TIMEJUMP.hide&&kmh>=112;
  if(c.timeBall.visible){const sc=.65+t*.65; c.timeBall.scale.setScalar(sc*(.94+.06*Math.sin(simT*17)))}
 }
 if(kmh>=140&&TIMEJUMP.armed&&!TIMEJUMP.busy&&TIMEJUMP.cool<=0&&storyOK('synth'))void timeJump();
}
