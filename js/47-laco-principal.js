'use strict';
/* Coastal Chaos · js/47-laco-principal.js — Laço principal (loop), configurações salvas e início (modo mobile).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
var NET_LIVE=false;
function loop(now){requestAnimationFrame(loop);
 // O aviso de orientacao bloqueia e pausa o jogo enquanto o mobile estiver vertical.
 // Mantem last atualizado para nao criar um salto de dt ao voltar para paisagem.
 NET_LIVE=!!(ONLINE.on&&played&&!BENCH.active); /* v3 r27: no online o menu (ESC), as configurações e a lista de comandos NÃO pausam (jogador "pausado" era atropelado e voltava ileso) */
 if(IS_MOBILE&&!NET_LIVE&&matchMedia('(orientation: portrait)').matches){last=now;fpsFrameLast=now;fpsAccumulator=0;return}
 if(!$('#loading').hidden){last=now;fpsFrameLast=0;fpsAccumulator=0;return}
 try{if(played)missionModeSync()}catch(e){console.error(e)}
 // RAF continua sincronizado ao monitor; so executar simulacao/render nos frames permitidos.
 // Acumulador evita cair para 37,5 FPS em telas de 75 Hz ao selecionar 60.
 const cap=S.fpsLimit;
 if(cap){const interval=1000/cap;
  if(!fpsFrameLast){fpsFrameLast=now;fpsAccumulator=interval}
  else{fpsAccumulator+=Math.min(250,now-fpsFrameLast);fpsFrameLast=now}
  if(fpsAccumulator+0.5<interval)return;
  fpsAccumulator=Math.max(0,fpsAccumulator-interval);
  if(fpsAccumulator>interval*2)fpsAccumulator=0;
 }else{fpsFrameLast=now;fpsAccumulator=0}
 const _t0=performance.now();monBegin(now);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(!BENCH.active&&!STORYFAIL.active)try{padPoll(dt)}catch(e){console.error(e)}try{dualTick()}catch(e){console.warn(e)}try{touchVisible()}catch(e){}
 if(!BENCH.active&&!STORYFAIL.active&&!STORYINTRO.active&&!STORYEND.active&&!PROLOGUE.cut&&running&&!menuOpen&&!cmdsOpen&&!cfgOpen)prologueTick(dt);
 if(!BENCH.active&&!STORYINTRO.active&&!STORYEND.active&&!PROLOGUE.active&&running&&!menuOpen&&!cmdsOpen&&!cfgOpen&&!TUNE.open&&!WARD.open&&!AMMO.uiOpen)try{campTick(dt)}catch(e){console.error('[campanha]',e)}
 if(BENCH.active){if(BENCH.running){benchTick(dt);update(dt);updateWeather(dt);updateLightning(dt)} }else if(STORYFAIL.active){storyMissionFailureTick(dt)}else if(STORYINTRO.active){if(!menuOpen)storyIntroTick(dt)}else if(STORYEND.active){if(!menuOpen)storyFinalTick(dt)}else if(PROLOGUE.cut){prologueCutTick(dt)}else if(TIMEJUMP.busy){if(!TIMEJUMP.loading){updateParts(dt);if(boomT>0){boomT=Math.max(0,boomT-dt);boomLight.intensity=10*boomT/.7}}}else if(running&&(NET_LIVE||!menuOpen&&!cmdsOpen&&!cfgOpen)&&!TUNE.open&&!WARD.open&&!AMMO.uiOpen){specTick(dt);update(dt*TS*SPEC.ts*(WHL.open?.3:1));storyTutorialTick(dt);hudT+=dt;if(hudT>=1/30){updateHUD(hudT);hudT=0}updateNav(dt)}
 try{if(played)slowFxTick(dt)}catch(e){console.error(e)}
 try{storyBarTitleSync()}catch(e){}
 if(NAV.open)drawBigmap();
 if(running&&!ROOM_STAGE.mode&&!TIMEJUMP.busy&&!TIMEJUMP.hide)updateHeadlights();
 if(!ROOM_STAGE.mode)updateNearbyLampLights(dt);
 if(running){if(BENCH.active){if(BENCH.running){benchCamera(dt);updateAudio(dt)}}else if(STORYFAIL.active||PROLOGUE.cut||STORYINTRO.active||STORYEND.active){/* r38: em cena o updateAudio não roda — sem isso o motor ficava travado no último tom (ex.: blitz da missão 1) */if(AC&&typeof engG!=='undefined'){const t=AC.currentTime;engG.gain.setTargetAtTime(0,t,.12);scrG.gain.setTargetAtTime(0,t,.08)}}
 if(running&&!BENCH.active&&!STORYFAIL.active&&!STORYINTRO.active&&!STORYEND.active&&!PROLOGUE.cut){updateCamera(menuOpen&&!NET_LIVE?0:dt);if(!ROOM_STAGE.mode){updateAudio(dt);updateWeather(menuOpen&&!NET_LIVE?0:dt);updateLightning(menuOpen&&!NET_LIVE?0:dt)}else{try{rainAudioSet(WX.f||0)}catch(e){}if(PL.inside==='mall'){try{updateRadio()}catch(e){}}}}} // v77: o palco do interior não rodava o rádio — a trilha do shopping (e o fone da loja de discos) nunca começava
 else{const t=now/1000;camera.up.set(0,1,0);camera.position.set(Math.cos(t*.1)*40,30,Math.sin(t*.1)*40);camera.lookAt(0,0,0)}
 // Atualiza tambem durante cutscenes (updateAudio normal nao roda nelas).
 if(running&&!ROOM_STAGE.mode)airSoundTick();
 sceneRadioTick(menuOpen&&!NET_LIVE?0:dt);
 try{ostTick()}catch(e){}
 try{mcpTick()}catch(e){}
 boomLight.visible=true;monGpu(true);if(!(typeof RIFT!=='undefined'&&RIFT.cover))render(); /* v2 r1: a Fenda cobre a tela inteira → não desenha o 3D por baixo */monGpu(false);monEnd(_t0,now)}
function applyCfgObj(c){if(!c)return;if(typeof c.mobLite==='boolean')MOB_LITE=c.mobLite;if(c.motion){MOTION.mode=['off','dual','phone'].includes(c.motion.mode)?c.motion.mode:'off';MOTION.sens=clamp(+c.motion.sens||1,.25,2);MOTION.dz=clamp(+c.motion.dz||0,0,10);MOTION.invert=c.motion.mode==='dual'&&c.motion.dirVersion!==2?false:!!c.motion.invert;motionReset();motionUI();}Object.assign(VOL,c.vol||{});if(!(VOL.interior>=0&&VOL.interior<=1)||!c.iv2)VOL.interior=.2;if(!c.mv2){VOL.music=.25;setTimeout(()=>{try{saveCfg()}catch(e){}},0)}if(typeof c.shadows==='boolean')S.shadows=c.shadows;if([1,2,4].includes(c.shadowQuality))S.shadowQuality=c.shadowQuality;S.cloudQ=[0,1,2].includes(c.cloudQ)?c.cloudQ:(S.shadowQuality>=4||c.sprite8===true?2:1);S.waterQ=[0,1,2].includes(c.waterQ)?c.waterQ:(S.shadowQuality>=4||c.sprite8===true?2:c.shadows===false&&c.bloom===false?0:1);try{waterQApply()}catch(e){}{const lo=c.shadows===false&&c.bloom===false;for(const k of ['fxWet','fxGlow','fxPaint','fxWin','fxSurf'])S[k]=typeof c[k]==='boolean'?c[k]:!(lo&&(k==='fxWet'||k==='fxPaint'||k==='fxWin'||k==='fxSurf'))}try{shfxApply()}catch(e){}if(typeof c.bloom==='boolean')S.bloom=c.bloom;if(typeof c.refl==='boolean')S.refl=c.refl;if(typeof c.sound==='boolean')S.sound=c.sound;if(typeof c.traffic==='number')S.traffic=clamp(c.traffic,0,100);if(typeof c.peds==='number')S.peds=clamp(c.peds,0,100);if(typeof c.showMinimap==='boolean')S.showMinimap=c.showMinimap;if(typeof c.miniAuto==='boolean')S.miniAuto=c.miniAuto;if(['auto','fade','off'].includes(c.touchHide))S.touchHide=c.touchHide;if(typeof c.showHud==='boolean')S.showHud=c.showHud;if([0,30,45,60].includes(c.fpsLimit))S.fpsLimit=c.fpsLimit;if(Number.isFinite(c.renderScale))S.renderScale=Math.max(0,Math.min(100,Math.round(c.renderScale)));if(Number.isFinite(c.drawDistance))S.drawDistance=clamp(Math.round(c.drawDistance),0,200);if(Number.isFinite(c.objectDistance))S.objectDistance=clamp(Math.round(c.objectDistance),0,100);if(Number.isFinite(c.shadowDistance))S.shadowDistance=clamp(Math.round(c.shadowDistance),0,100);if(typeof c.detailedShadows==='boolean')S.detailedShadows=c.detailedShadows;if(typeof c.poleShadows==='boolean')S.poleShadows=c.poleShadows;if(typeof c.sprite8==='boolean'){S.sprite8=c.sprite8;if(S.sprite8)try{applyPlayerLook()}catch(_){}}if(typeof c.char3d==='boolean')S.char3d=c.char3d&&S.sprite8!==true;{const e=$('#optCharMode');if(e)e.value=charModeOf()}if(c.lang==='br'||c.lang==='en')S.lang=c.lang;if(typeof c.lampLighting==='boolean')S.lampLighting=c.lampLighting;if(Number.isFinite(c.lampCount))S.lampCount=Math.max(1,Math.min(NEAR_LAMP_COUNT,Math.round(c.lampCount)));if(c.mode==='free'||c.mode==='campaign')S.mode=c.mode;if(c.touchSteer==='stick'||c.touchSteer==='arrows')S.touchSteer=c.touchSteer;if(c.touchLayout&&typeof c.touchLayout==='object')S.touchLayout=touchLayoutClean(c.touchLayout);if(c.pad){for(const k of ['vib','sens','dz'])if(typeof c.pad[k]==='number')PAD[k]=c.pad[k];PAD.inv=!!c.pad.inv;if(typeof c.pad.adaptive==='boolean')PAD.adaptive=c.pad.adaptive;if(typeof c.pad.speakerEnabled==='boolean')PAD.speakerEnabled=c.pad.speakerEnabled;if(Number.isFinite(c.pad.speakerVolume))PAD.speakerVolume=clamp(c.pad.speakerVolume,0,1);if(typeof c.pad.lightbar==='boolean')PAD.lightbar=c.pad.lightbar;PAD.scheme=c.pad.scheme==='modern'?'modern':'classic';if(Number.isFinite(c.pad.triggerForce))PAD.triggerForce=clamp(c.pad.triggerForce,.1,1);dualExtraUI();if(!PAD.adaptive)dualClear();if(PAD.adaptive||MOTION.mode==='dual')dualReconnect()}}
// Repara a preferência contaminada pelo benchmark v152–v156: a migração de
// áudio antiga salvava o preset temporário, ocultando HUD e minimapa no próximo jogo.
// Só faz a recuperação quando o registro corresponde *exatamente* a um dos
// três presets (não interfere em quem ocultou só a HUD manualmente).
function recoverBenchmarkHUD(c){
 if(!c||c.showHud!==false||c.showMinimap!==false)return c;
 const sample=[
  {shadows:false,shadowQuality:1,bloom:false,refl:false,traffic:0,peds:0,renderScale:0,lampLighting:false,lampCount:1},
  {shadows:true,shadowQuality:1,bloom:true,refl:true,traffic:50,peds:50,renderScale:100,lampLighting:true,lampCount:4},
  {shadows:true,shadowQuality:4,bloom:true,refl:true,traffic:100,peds:100,renderScale:100,lampLighting:true,lampCount:4}
 ];
 if(!sample.some((p,i)=>Object.keys(p).every(k=>{
  if(k!=='traffic'&&k!=='peds')return c[k]===p[k];
  const preset=GRAPHICS_PRESETS[['LOW','MEDIUM','HIGH'][i]];
  return (c.traffic===p.traffic&&c.peds===p.peds)||(c.traffic===preset.traffic&&c.peds===preset.peds);
 })))return c;
 const fixed={...c,showHud:true,showMinimap:true};
 try{localStorage.setItem('ps_cfg',JSON.stringify(fixed))}catch(e){}
 console.info('PixelCity: HUD/minimapa restaurados após preset de benchmark antigo');
 return fixed;
}
try{applyCfgObj(recoverBenchmarkHUD(JSON.parse(localStorage.getItem('ps_cfg')||'null')))}catch(e){}
// Reconnect silently only when the player already opted in and the site has HID permission.
if(PAD.adaptive||MOTION.mode==='dual')dualReconnect();
try{applyRenderScale()}catch(e){}
/* MODO MOBILE: iniciar com iluminacao dos postes e reflexos desligados,
   preservando ajustes manuais salvos (inclusive de versoes anteriores). */
if(MOB_LITE){
 sun.shadow.mapSize.set(512,512);rainMat.defines.RAIN_LIGHTS=4;rainMat.needsUpdate=true; /* v78: celular também começa em 14×14; 7×7 fica no seletor TAMANHO */
 let saved=null;try{saved=JSON.parse(localStorage.getItem('ps_cfg')||'null')}catch(e){}
 if(!saved||typeof saved.shadows!=='boolean')S.shadows=false;
 if(!saved||typeof saved.refl!=='boolean')S.refl=false;
 if(!saved||typeof saved.lampLighting!=='boolean')S.lampLighting=false;
}
try{const z=localStorage.getItem('ps_size');if(z==='7'||z==='14'){S.size=normalizeCitySize(z);if(typeof syncMenu==='function')syncMenu()}}catch(e){}
// Inicializa o mapa de sombras conforme o padrao ou as preferencias salvas.
applyShadowQuality();
// Sem limite por padrão em todas as plataformas; a preferência salva continua tendo prioridade.
padCfgSync();applyInterfaceVisibility();
function cfgUI(){graphicsPresetUI();cloudQUI();waterQUI();fxUI();{const e=$('#optMobLite');if(e)e.checked=!!MOB_LITE}syncShadowQualityUI();drawDistanceUI();objectDistanceUI();shadowDistanceUI();detailedShadowsUI();$('#fpsLimit').value=String(S.fpsLimit);$('#optLampLighting').checked=S.lampLighting!==false;syncLampCountUI();$('#touchSteer').value=S.touchSteer==='stick'?'stick':'arrows';for(const k of ['master','music','sfx','interior']){$('#vol_'+k).value=Math.round(VOL[k]*100);$('#vol_'+k+'_o').textContent=Math.round(VOL[k]*100)+'%'}$('#optShadows').checked=S.shadows;detailedShadowsUI();$('#optBloom').checked=S.bloom;$('#optRefl').checked=S.refl!==false;$('#optSound').checked=!S.sound;$('#renderScale').value=String(S.renderScale??100);$('#renderScaleOut').textContent=Math.round(S.renderScale??100)+'%';$('#optRain').checked=!!S.rain;$('#optStorm').checked=!!S.storm;$('#optMinimap').checked=S.showMinimap!==false;{const e=$('#optMiniAuto');if(e)e.checked=S.miniAuto!==false;const t=$('#touchHide');if(t)t.value=['auto','fade','off'].includes(S.touchHide)?S.touchHide:'auto'}$('#optHud').checked=S.showHud!==false;applyInterfaceVisibility();try{padCfgSync()}catch(e){}syncMenu();applyLanguage()}
for(const k of ['master','music','sfx','interior']){$('#vol_'+k).value=Math.round(VOL[k]*100);$('#vol_'+k+'_o').textContent=Math.round(VOL[k]*100)+'%'}$('#optShadows').checked=S.shadows;detailedShadowsUI();$('#optBloom').checked=S.bloom;$('#optRefl').checked=S.refl!==false;$('#optSound').checked=!S.sound;$('#renderScale').value=String(S.renderScale??100);$('#renderScaleOut').textContent=Math.round(S.renderScale??100)+'%';drawDistanceUI();objectDistanceUI();shadowDistanceUI();try{graphicsPresetUI()}catch(e){}$('#optLampLighting').checked=S.lampLighting!==false;syncLampCountUI(); /* v77: OBJECT/SHADOW DISTANCE não eram sincronizados no boot: o slider mostrava 50 com o valor salvo ativo */
syncShadowQualityUI();graphicsPresetUI();syncMenu();applyLanguage();
playSumSync();
$('#menuPreparing').hidden=true;
$('#menu').hidden=false;
requestAnimationFrame(loop);
// menu inicial leve. A cidade nao e gerada no carregamento da pagina.
// A geracao, os chunks e o aquecimento da GPU so comecam em startGame(),
// apos GERAR NOVA CIDADE ou CARREGAR SAVE.
// Antes disso o canvas exibe apenas o fundo da cena, sem mundo procedural.

