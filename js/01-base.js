'use strict';
/* Coastal Chaos · js/01-base.js — Utilitários, constantes, configurações, volume.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
var ONLINE={on:false,peers:new Map()}; /* v2 r5: declarado cedo (o módulo online fica mais abaixo) */
/* ================= UTIL ================= */
const $=s=>document.querySelector(s);
const ANDROID_APK=!!window.CoastalAndroid;
if(ANDROID_APK)document.documentElement.classList.add('android-apk');
const desktopLauncher=window.CoastalDesktop;
if(desktopLauncher)document.documentElement.classList.add('desktop-launcher');
const exitHost=desktopLauncher || window.CoastalAndroid;
if(typeof exitHost?.exitGame === 'function'){
 const exitButton=document.getElementById('exitGame');
 exitButton.hidden=false;
 exitButton.addEventListener('click',()=>exitHost.exitGame());
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let R=Math.random; const R2=Math.random;
const rr=(a,b)=>a+(b-a)*R(), ri=(a,b)=>Math.floor(rr(a,b+1)), pick=a=>a[Math.floor(R()*a.length)];
const pick2=a=>a[Math.floor(R2()*a.length)];const pickR=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const COL=h=>new THREE.Color(h);
const shade=(h,v)=>new THREE.Color(h).multiplyScalar(v);

/* ================= CONSTANTS ================= */
const BS=60, RW=16, P=BS+RW, SW=4, LANE=1.9;
const D=[[1,0],[0,1],[-1,0],[0,-1]];
// v77: VOL.interior = trilha dos interiores (shopping); 20% = padrão
const VOL={master:.85,music:.25,sfx:.85,interior:.2};let musicBus=null;const MUS_K=.6; // escala da música: 50 no slider = 30 da escala antiga
// Fade reservado ao audio musical na transicao de mundos; nao toca no master dos SFX.
const MUSIC_TRAVEL={on:false,from:1,to:1,at:0,duration:1};
function musicTravelFactor(){return musicTravelFactor0()*ostDuck()}function musicTravelFactor0(){if(!MUSIC_TRAVEL.on)return 1;const t=Math.max(0,Math.min(1,(performance.now()-MUSIC_TRAVEL.at)/MUSIC_TRAVEL.duration));
 const x=t*t*(3-2*t),v=MUSIC_TRAVEL.from+(MUSIC_TRAVEL.to-MUSIC_TRAVEL.from)*x;
 if(t>=1){MUSIC_TRAVEL.from=MUSIC_TRAVEL.to;if(MUSIC_TRAVEL.to===1)MUSIC_TRAVEL.on=false}return v}
function musicTravelOut(){MUSIC_TRAVEL.from=musicTravelFactor();MUSIC_TRAVEL.to=0;MUSIC_TRAVEL.at=performance.now();MUSIC_TRAVEL.duration=550;MUSIC_TRAVEL.on=true}
function musicTravelIn(){MUSIC_TRAVEL.from=0;MUSIC_TRAVEL.to=1;MUSIC_TRAVEL.at=performance.now();MUSIC_TRAVEL.duration=900;MUSIC_TRAVEL.on=true}
function musicTravelReset(){MUSIC_TRAVEL.on=false;MUSIC_TRAVEL.from=MUSIC_TRAVEL.to=1;applyVolumes()}
function musVol(){return VOL.master*VOL.music*MUS_K}
function applyVolumes(){
 if(master)master.gain.value=S.sound?.55*VOL.master*VOL.sfx:0;
 if(musicBus)musicBus.gain.value=S.sound?1.1*VOL.master*VOL.music*MUS_K*musicTravelFactor():0;
 // Stream online nao passa pelo musicBus; atualiza ao mover os sliders, sem esperar tick do jogo.
 if(typeof RADIO!=='undefined'){
  if(RADIO.live)RADIO.live.volume=S.sound?Math.min(1,.8*musVol()*1.25*musicTravelFactor()):0;
  if(RADIO.el&&!RADIO.routed)RADIO.el.volume=S.sound?.75*musVol()*musicTravelFactor():0;
 }
}
function cfgObj(){return{motion:{dirVersion:2,mode:MOTION.mode,sens:MOTION.sens,dz:MOTION.dz,invert:MOTION.invert},mv2:1,iv2:1,vol:{...VOL},shadows:S.shadows,shadowQuality:S.shadowQuality,cloudQ:S.cloudQ,waterQ:S.waterQ,fxWet:S.fxWet!==false,fxGlow:S.fxGlow!==false,fxPaint:S.fxPaint!==false,fxWin:S.fxWin!==false,fxSurf:S.fxSurf!==false,bloom:S.bloom,refl:S.refl!==false,mobLite:!!MOB_LITE,sound:S.sound,traffic:S.traffic,peds:S.peds,showMinimap:S.showMinimap!==false,miniAuto:S.miniAuto!==false,touchHide:['auto','fade','off'].includes(S.touchHide)?S.touchHide:'auto',showHud:S.showHud!==false,fpsLimit:S.fpsLimit,renderScale:S.renderScale,drawDistance:S.drawDistance,objectDistance:S.objectDistance,shadowDistance:S.shadowDistance,detailedShadows:S.detailedShadows,poleShadows:S.poleShadows!==false,sprite8:S.sprite8===true,char3d:S.char3d===true,lang:S.lang,lampLighting:S.lampLighting!==false,lampCount:Math.min(NEAR_LAMP_COUNT,S.lampCount),touchSteer:S.touchSteer==='stick'?'stick':'arrows',touchLayout:S.touchLayout||null,mode:S.mode,pad:{vib:PAD.vib,sens:PAD.sens,dz:PAD.dz,inv:PAD.inv,adaptive:PAD.adaptive,triggerForce:PAD.triggerForce,speakerVolume:PAD.speakerVolume??1,speakerEnabled:PAD.speakerEnabled!==false,lightbar:PAD.lightbar!==false,scheme:PAD.scheme==='modern'?'modern':'classic'}}}
// O benchmark usa perfis temporários. Nunca gravá-los como preferências do jogador.
let BENCH_CFG_LOCK=false;
function saveCfg(){if(BENCH_CFG_LOCK||(typeof ONLINE!=='undefined'&&ONLINE.on))return;try{localStorage.setItem('ps_cfg',JSON.stringify(cfgObj()))}catch(e){}}
function supportedCitySize(n){return Number(n)===7||Number(n)===14}
function normalizeCitySize(n){return Number(n)===7?7:14}
const CITY_CACHE={ready:false,building:false};
const S={char3d:false,cloudQ:1,waterQ:1,fxWet:true,fxGlow:true,fxPaint:true,fxWin:true,fxSurf:true,mode:'campaign',hour:8,view:'fps',style:'modern',seed:(Math.random()*1e6)|0,size:14,rain:true,storm:true,traffic:50,peds:50,shadows:true,poleShadows:false,shadowQuality:1,bloom:true,refl:true,sprite8:false,sound:true,showMinimap:true,miniAuto:true,touchHide:'auto',showHud:true,fpsLimit:0,renderScale:90,drawDistance:150,objectDistance:25,shadowDistance:0,detailedShadows:true,/* v78: padrão = preset MÉDIO (peds 2D; 3D só no ALTO) */lang:((navigator.language||'pt-BR').toLowerCase().startsWith('pt')?'br':'en'),lampLighting:!pixelIsMobile(),lampCount:4,touchSteer:'arrows'};

const STYLES={
 modern:{label:'MODERN',sky:[0x6fa6de,0xd4e4ef],fog:0xc9d4dc,fogNear:160,fogFar:600,bg:0x55585c,
  hemi:[0xdde9ff,0x5f564c,0.58],sun:[0xffe9c8,0.98],sunOff:[-60,130,-45],
  asphalt:'#46474b',side:'#9b978f',grass:'#5f8b40',mark:'#ebe8df',center:'#e2b53a',
  walls:['#a3a39e','#b8afa2','#8e6c58','#a68d75','#7e8388','#c4beb2','#6f6a66','#9b8f84','#8a7a6c'],
  roof:['#6d6760','#77716a','#5f5b57','#857d72','#6a6a6a'],detail:'#8e8a84',
  carCols:['#1d1f24','#25282e','#c9ccd2','#ececec','#7a1f1f','#1f3a6b','#4a4f57','#335c3a','#8a8f96','#14161a'],
  map:{road:'#4a4b50',block:'#9d988f',bld:'#6f6a64',park:'#5c8a3e',lot:'#55565b'},bloom:false,night:false,synth:false},
 synthwave:{label:'SYNTHWAVE',sky:[0x07031a,0xb0205e],fog:0x1a0a30,fogNear:55,fogFar:330,bg:0x0e0820,
  hemi:[0x7a5ac0,0x1a0c28,0.78],sun:[0xb09aff,0.5],sunOff:[-130,120,10],
  asphalt:'#15121c',side:'#2a2238',grass:'#141f30',mark:'#cfe4ff',center:'#ff4fb0',
  walls:['#4a3570','#2f4570','#6a3462','#2c5468','#56407a','#7a3a5c','#3a3f78'], // v77 outrun: fachadas mais escuras, o neon é que dá a cor
  roof:['#1a1528','#211a33','#161424'],detail:'#2b2540',
  neon:['#ff3ea5','#2ee6ff','#ff9a4a','#a77bff','#ff5a7a','#4dfff0'],lamp:'#ff6fcf',
  carCols:['#14121c','#2b1d4a','#3a0f3f','#0f2a3a','#e8e8f0','#c21f6a','#1a8fb0','#18151f'],
  map:{road:'#1b1526',block:'#2a2140',bld:'#4a2a72',park:'#14283e',lot:'#201a30'},bloom:true,night:true,synth:true},
 inverted:{label:'UPSIDE DOWN',sky:[0x040406,0x101014],fog:0x08090b,fogNear:24,fogFar:180,bg:0x050507,
  hemi:[0xa8adb8,0x050507,0.14],sun:[0xc2c7d2,0.18],sunOff:[-42,24,-16],
  asphalt:'#1d1f24',side:'#2b2d32',grass:'#45474c',mark:'#b9b9bf',center:'#7d2428',
  walls:['#57575d','#66666d','#4b4b52','#73737a','#3a3b40','#87878e','#5f6066'],
  roof:['#1e1f24','#2c2d33','#373840','#15161a'],detail:'#44464c',neon:['#34070b','#5b0b12','#76161d','#240507'],lamp:'#120f12',
  carCols:['#2b2b2f','#3c3c42','#55555c','#6d6d74','#8b8b92','#1d1f24','#14161a'],
  map:{road:'#17181d',block:'#6a6b72',bld:'#3a3b40',park:'#4a4b50',lot:'#26272d'},bloom:false,night:true,synth:false,freezeTod:180,noWeather:true,noLamps:true,noWindows:true},
 // Point Haze: ilhota 3x3 desabitada, sempre encoberta e com névoa (ver hazeShift)
 haze:{label:'POINT HAZE',sky:[0x7d858c,0xaeb3b2],fog:0x9aa09e,fogNear:120,fogFar:520,bg:0x6a6e70,
  hemi:[0xc8ccd0,0x4a4438,0.52],sun:[0xe6e2d8,0.62],sunOff:[-60,130,-45],
  asphalt:'#6e6250',side:'#8a7c62',grass:'#a08a5a',mark:'#d8d2c4',center:'#c8a040',
  walls:['#7a756c','#8a8478','#6a665e'],roof:['#4a4640','#55504a'],detail:'#6e685e',
  carCols:['#3a3a3a','#6a6a6a','#8a2a24','#2a4a6a'],
  map:{road:'#8a7350',block:'#a08a5a',bld:'#5e5a54',park:'#8c7a50',lot:'#6a5e48'},bloom:false,night:false,synth:false,noLamps:true}
};

