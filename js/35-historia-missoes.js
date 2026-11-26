'use strict';
/* Coastal Chaos · js/35-historia-missoes.js — Modo história, missões (blocos/cutscene), concessionária, blitz.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
// ================= MODO HISTÓRIA =================
// Base para a campanha. Regra de design: no começo o mapa está vazio (só o "!" da missão atual) e só existe o que
// tem contexto de gameplay na própria cidade: polícia, pontes, trânsito, NPCs, conveniência, delegacia, hospital, casa segura.
// O resto (shopping, oficina, concessionária, Point Haze, fenda, synthwave, eventos, dupla no carro) fica TRANCADO
// até uma missão liberar (unlock) e o ícone só aparece no mapa quando uma missão revela (reveal).
// Modo livre: tudo liberado e visível, como antes.
// Para criar a próxima missão: acrescente em STORY_MISSIONS {id,title,needs:[ids],unlock:[recursos],reveal:[ícones]}
// e escreva o tick dela no padrão de questTick (usa phoneMission, misGPS, o "!" no mapa e storyComplete(id,pagamento)).
// Ideia de uso: missões que exigem trocar Nathan/Claire no meio (bullet time a pé × câmera lenta dirigindo; dupla no carro).
const STORY_LOCKED=['motel','pawn','safe','casino','bankrob','empire','mall','tune','deal','haze','rift','synth','rampage','race','drag','duo'];
const STORY_MISSIONS=[
 {id:'pier',title:'Um novo começo',needs:[],unlock:['safe'],reveal:['safe'],world:['pickups','tommy','ghost','forest','vortex','empire','side'],after:()=>{},
  // Missão 1 = abertura (avião) + prólogo + cena final + créditos. Funções no bloco PROLOGUE.
  script:{active:()=>PROLOGUE.active,cut:()=>!!PROLOGUE.cut||(PROLOGUE.active&&SWITCH.on),begin:()=>prologueBegin(),reset:()=>prologueReset(),tick:dt=>prologueTick(dt),cutTick:dt=>prologueCutTick(dt),skip:()=>missionDebugSkip(),complete:()=>prologueCompleteNow()}},
 // {id:'oficina',title:'...',needs:['pier'],unlock:['tune'],reveal:['tune']},
 // {id:'irmaos',title:'...',needs:['oficina'],unlock:['duo'],reveal:['safe']},
];
// ================= MISSÕES: BLOCOS, MODO MISSÃO E MODO CUTSCENE (v77) =================
// Como acrescentar a missão 2 (e seguintes):
//  1. Entrada em STORY_MISSIONS: {id, title, needs:[id anterior], unlock:[recursos de STORY_LOCKED], reveal:[ícones],
//     world:[ids de WORLD_FEATURES que ela libera], script:{active, cut, begin, reset, tick, cutTick, skip, complete}}.
//  2. Lista ordenada em MISSION_STAGES[id]: {id, kind:'play'|'cut', objective|null, what}. O texto do objetivo sai
//     daqui (prologueStage('x') sem texto), então traduções e revisões ficam num lugar só.
//  3. Use MISSION_MODE para saber se o jogo está em 'mission' (jogável, roteiro fixo) ou 'cutscene'
//     (sem controle). Nos dois, o conteúdo do modo livre (WORLD_FEATURES) fica oculto e inerte, e a interface
//     de depuração/menus que quebram o roteiro (monitor, salvar, troca de personagem, mapa na cutscene) some.
//  4. Missões são sequenciais por `needs`; a campanha só é "concluída" (STORY.cleared) quando TODAS terminam.
// Conteúdo do modo livre que só aparece depois da missão indicada (e nunca durante uma missão/cutscene).
const WORLD_FEATURES={
 pickups:{unlockedBy:'pier',what:'armas, munição, coletes, vinis e itens largados pela cidade (dinheiro de pedestre continua)'},
 tommy:{unlockedBy:'pier',what:'alvos Tommy armados nos pátios'},
 ghost:{unlockedBy:'pier',what:'fantasma do cemitério'},
 forest:{unlockedBy:'pier',what:'demogorgon da floresta'},
 vortex:{unlockedBy:'pier',what:'hovercraft Vortex na areia do farol'},
 empire:{unlockedBy:'pier',what:'gangues e carros de império (também trancado por storyOK("empire"))'},
 side:{unlockedBy:'pier',what:'corridas, arrancadas e rampage (também trancados por storyOK)'},
};
// Estágios da missão 1 em ordem. kind 'cut' = câmera/roteiro sem controle do jogador.
const MISSION_STAGES={
 pier:[
  {id:'dealer',kind:'play',objective:'Vá à concessionária e compre um conversível.',what:'Nathan a pé; GPS na concessionária; só o conversível à venda; diálogo da culpa'},
  {id:'driveFirst',kind:'play',objective:'Dê uma volta com seu conversível.',what:'balão de pensamento (10 anos, 3 cumpridos); dirigir 12–24 s'},
  {id:'prison',kind:'cut',objective:null,what:'troca aérea para Claire na cela + legenda ANO 3 DE 10'},
  {id:'escape',kind:'play',objective:'Cave no canto marcado quando o guarda se afastar.',what:'Claire combina o plano com a colega e cava a fuga'},
  {id:'steal',kind:'play',objective:'Livre, mas a pé e sem grana. Roube um carro!',what:'qualquer veículo'},
  {id:'driveMall',kind:'play',objective:'Vá até o shopping e compre um celular.',what:'GPS na porta do shopping; entrar a pé'},
  {id:'phoneBuy',kind:'play',objective:'Compre um celular na loja de eletrônicos. Claire gosta do modelo iPixel.',sub:'Se desejar pode comprar roupas e acessórios nas demais lojas!',what:'pensamento sobre a confiança; loja de eletrônicos'},
  {id:'sms',kind:'play',objective:'Abra o celular e ligue para Nathan pela agenda.',what:'agenda do celular · dá ocupado'},
  {id:'smsSend',kind:'cut',objective:null,what:'ligação dá ocupado; Claire pensa e sai do shopping'},
  {id:'smsSwitch',kind:'cut',objective:null,what:'troca aérea para Nathan dirigindo'},
  {id:'smsDrive',kind:'play',objective:'Continue curtindo seu conversível novo!',what:'~10 s dirigindo até chegar o SMS'},
  {id:'smsRead',kind:'play',objective:'Leia o SMS.',what:'abrir o celular lê a mensagem do número desconhecido'},
  {id:'smsRead2',kind:'cut',objective:null,what:'SMS + monólogo do Nathan'},
  {id:'ammo',kind:'play',objective:'Passe no escritório da borracharia.',what:'GPS na loja de armas; qualquer compra'},
  {id:'motelDrive',kind:'play',objective:'Vá ao Motel Miragem, quarto 6.',what:'GPS no motel; blitz no caminho após 8–14 s ao volante'},
  {id:'blitz',kind:'cut',objective:null,what:'fade para a blitz; inspeção ~11 s com falas dos policiais'},
  {id:'motelGo',kind:'play',objective:'Siga para o Motel Miragem, quarto 6.',what:'GPS no motel; seta na porta do 6'},
  {id:'motelRoom',kind:'cut',objective:null,what:'câmera da porta com arma em punho, Claire de costas na janela, ela se vira, beijo'},
  {id:'motelTalk',kind:'cut',objective:null,what:'diálogo no quarto; convite para a orla'},
  {id:'beach',kind:'cut',objective:null,what:'cena final na orla + logo; fade para créditos e casa'},
 ]};
// Estado atual do modo de jogo do roteiro: null (livre/sem missão), 'mission' ou 'cutscene'.
const MISSION_MODE={mode:null,last:null};
function missionActive(){return STORY_MISSIONS.find(m=>m.script&&m.script.active())||null}
function missionMode(){
 if(STORYINTRO.active||STORYEND.active)return 'cutscene';
 const m=missionActive();if(!m)return null;
 if(m.script.cut())return 'cutscene';
 const st=(MISSION_STAGES[m.id]||[]).find(q=>q.id===PROLOGUE.stage);
 return st&&st.kind==='cut'?'cutscene':'mission'}
function missionUiBlocked(what){const m=MISSION_MODE.mode||missionMode();if(!m)return false;
 if(m==='cutscene')return ['map','phone','wheel','char','cfg','monitor','save','cheat'].includes(what);
 return ['monitor','save','char','cheat'].includes(what)}
// Liga/desliga conteúdo do modo livre. Nunca durante missão/cutscene; depois, só quando a missão que o libera terminou.
function worldOn(id){if(!storyOn())return true;if(MISSION_MODE.mode||missionMode())return false;if(STORY.cleared)return true;
 const f=WORLD_FEATURES[id];return !f||!f.unlockedBy||STORY.done.has(f.unlockedBy)}
function missionModeSync(){const m=missionMode();if(m===MISSION_MODE.mode)return;MISSION_MODE.last=MISSION_MODE.mode;MISSION_MODE.mode=m;
 const b=document.body;b.classList.toggle('mode-mission',m==='mission');b.classList.toggle('mode-cutscene',m==='cutscene');
 if(m){ // fecha o que não pertence ao roteiro
  if(m==='cutscene'){try{if(NAV.open)closeMap()}catch(e){}try{if(PHONE.open)prologueClosePhone()}catch(e){}try{if(WHL.open)wheelClose()}catch(e){}try{if(CHAR.open){CHAR.open=false;charSelPaint()}}catch(e){}}
  missionWorldHide()}
 try{charSelPaint()}catch(e){}}
// Esconde imediatamente o que já tinha surgido do modo livre (ex.: itens perto do aeroporto na abertura).
function missionWorldHide(){
 try{for(const p of pickups)if(p.kind!=='cash'&&p.g)p.g.visible=false}catch(e){}
 try{for(const q of TOMMY.sites)if(q.p&&peds.includes(q.p)){removePed(q.p);q.p=null}}catch(e){}
 try{if(GHOST.g)ghostKill()}catch(e){}
 try{if(FOREST.enemy&&peds.includes(FOREST.enemy))removePed(FOREST.enemy);FOREST.enemy=null}catch(e){}
 try{if(VORTEX.v&&!VORTEX.v.used&&VORTEX.v!==PL.car){removeVehicle(VORTEX.v);VORTEX.v=null}}catch(e){}
}
const STORY={done:new Set(),unl:new Set(),map:new Set(),cleared:false,fresh:false,lockMsgT:0,checkpoint:null};
const STORYFAIL={active:false,t:0,reason:'',mission:null};
function storyMissionPending(){return storyOn()&&played&&!STORYINTRO.active&&!STORYEND.active&&!STORYFAIL.active&&!STORY.done.has('pier')&&!STORY.checkpoint}
function storyClearObjective(){
 NAV.marker=null;NAV.route=null;NAV.misMarker=false;NAV.rT=0;
 if(NAV.beam)NAV.beam.visible=false;
}
// Não recria AudioContext: desliga fontes persistentes da tentativa anterior.
// A nova cutscene inicia sua própria rádio somente em ZOIO PRESENTS.
function storyMissionAudioReset(advanceFlashback=false){
 const flash=advanceFlashback?sceneRadioStation():null;
 sceneRadioStop();
 RADIO.sceneActive=false;RADIO.sceneStation=null;RADIO.preview=false;RADIO.err='';RADIO.blocked=false;
 RADIO.idx=-1;RADIO.carSt=null;RADIO.beforeOst=null;RADIO.autoDone=false;RADIO.tryT=0;RADIO.lastLbl=null;
 SCENE_RADIO.active=false;SCENE_RADIO.kind='off';SCENE_RADIO.scene='';SCENE_RADIO.currentSong=null;
 SCENE_RADIO.introSong=null;SCENE_RADIO.station=null;SCENE_RADIO.elapsed=0;SCENE_RADIO.wait=0;
 SCENE_RADIO.fadeTotal=0;SCENE_RADIO.fadeLeft=0;SCENE_RADIO.bad.clear();
 try{RADIO.el.pause();RADIO.el.currentTime=0;RADIO.el.removeAttribute('src');RADIO.el.dataset.url='';RADIO.el.load()}catch(e){}
 try{stopLive()}catch(e){}
 // Próxima tentativa começa por outra faixa quando há mais de uma; com uma só, recomeça do zero.
 if(flash&&flash.songs.length>1){sceneRadioEnsureOrder(flash);flash.pos=(flash.pos+1)%flash.songs.length}
 if(AC){const t=AC.currentTime;
  const zero=node=>{try{if(node&&node.gain){node.gain.cancelScheduledValues(t);node.gain.setValueAtTime(0,t)}}catch(e){}};
  if(POL.siren)zero(POL.siren.g);
  zero(engG);zero(scrG);
  if(PL.car){PL.car.sirenOn=false;PL.car.lightsOff=true}
  const mute=s=>{if(s&&s.g)zero(s.g)};
  for(const c of vehicles)mute(c.snd);
  for(const h of HELI.list)mute(h.snd);
  if(HELI.cur)mute(HELI.cur.snd);
  if(COPH.h)mute(COPH.h.snd);
  for(const sl of SKY.slots)if(sl.o)mute(sl.o.snd);
 }
 airSoundReset();
 // Viaturas da perseguição não podem reativar a sirene no tick seguinte.
 for(const c of vehicles)if((c.chase||c.polBoat||(c.police&&c.sirenOn))||c===PL.car){c.sirenOn=false;c.lightsOff=true}
 RADIO.label.hidden=true;
}
function storyMissionFail(reason='FALHA',mission='pier'){if(typeof CAMP!=='undefined'&&CAMP.id&&!PROLOGUE.active)return campFail(reason);if(PROLOGUE.active){PROLOGUE.cut=null;SWITCH.on=false;document.body.classList.remove('story-cinematic');}
 if(mission!=='pier'||!storyMissionPending())return false;
 STORYFAIL.active=true;STORYFAIL.t=0;STORYFAIL.mission=mission;STORYFAIL.reason=reason;
 const el=$('#storyFailOverlay');el.hidden=false;el.style.opacity='0';$('#storyFailReason').textContent=reason;
 void el.offsetWidth;el.style.opacity='1';
 $('#storyGuide').hidden=true;monStoryShiftSync();$('#ko').hidden=true;$('#ko').textContent='NOCAUTE';
 storyClearObjective();storyMissionAudioReset(true);
 for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();
 return true;
}
function storyMissionReset(mission='pier'){prologueReset();if(CHAR.cur!==0){wearSwap(0);Object.assign(PLAYER_PAL,CHAR.list[0].look||WEAR_DEFAULT);applyPlayerLook();}
 if(mission!=='pier')return;
 // Reposiciona entidades e reseta a missão SEM modificar chunks, prédios, rios ou seed.
 storyMissionAudioReset(false);storyClearObjective();
 const missionPursuers=vehicles.filter(c=>(c.chase&&!c.target)||c.zonePatrol||c.polBoat);
 if(POL.wanted)endWanted(true,true);
 POL.wanted=false;POL.level=0;POL.bustT=0;POL.escT=0;POL.spawnT=5;POL.truce=simT+8;
 WZ.crime=null;WZ.fromZone=null;WZ.list.length=0;WZ.cur=null;WZ.susT=0;
 for(const q of peds.slice())if(q.cop)removePed(q);
 for(const c of missionPursuers)if(vehicles.includes(c)){if(c!==PL.car)removeVehicle(c);else{c.chase=false;c.zonePatrol=null;c.sirenOn=false;c.lightsOff=true}}
 questLoad(null);STORY.done.clear();STORY.unl.clear();STORY.map.clear();STORY.cleared=false;STORY.fresh=false;STORY.checkpoint=null;try{campReset()}catch(e){}
 if(MIS.type)misEnd();
 if(PL.taxi){PL.taxi=null}if(DLG.on)try{dlgClose()}catch(e){}
 PL.car=null;PL.heli=null;PL.inside=false;DOOR.from=null;PL.dead=false;PL.deadT=0;PL.hp=100;PL.armor=0;PL.down=0;PL.rot=0;PL.jy=PL.jv=0;PL.vx=PL.vz=0;PL.sp.visible=true;PL.sh.visible=true;
 $('#ko').hidden=true;document.body.classList.remove('ko-grayscale','story-reunion');
 if(JAIL.grp)JAIL.grp.visible=false;if(JAIL.arrowIn)JAIL.arrowIn.visible=false;if(JAIL.arrowOut)JAIL.arrowOut.visible=false;JAIL.locked=false;JAIL.left=0;
 let car=city.startCar;
 if(!car||!vehicles.includes(car)||!car.alive){
  if(car&&vehicles.includes(car))removeVehicle(car);
  // Criar a entidade de volta; o ponto de parada correto e definido logo abaixo.
  car=makeVehicle('sports',city.air.cx,city.air.cz,0,STYLES[S.style].synth?'#ff2e88':'#d62828');
  city.startCar=car;
 }
 car.hp=100;car.alive=true;car.exploded=false;car.onFire=false;car.fuse=0;car.burn=0;car.owned=false;car.sleep=false;car.hand=true;
 car.thr=0;car.vx=car.vz=car.fwd=car.w=0;car.ai=null;
 // O reset original recriava o carro no MEIO do aeroporto. Este mesmo
 // posicionamento e usado na abertura e tambem no fallback sem cinematic.
 storyAirportSpawn();
 syncVehicleHUD();$('#storyCheckpoint').hidden=true;
}
/* v78 · CHECKPOINTS DA MISSÃO 1: cada trecho que o Ctrl+Shift+F9 pula é uma linha de checkpoint. Ao chegar num deles
   (prologueStage) guardamos o estágio + as escolhas do jogador (dinheiro, roupas, armas, celulares, carro comprado).
   Se a missão falhar (morte, polícia, perder o carro…), ela reinicia e avança sozinha pelos mesmos pulos atrás de uma tela
   preta (sem marcar cheat) até o checkpoint; depois as escolhas são devolvidas. */
var MCP={stage:null,snap:null,ff:false,keep:false,t0:0,last:0};
const MCP_STAGES=['driveFirst','prison','steal','phoneBuy','sms','ammo','motelDrive','motelGo'];
function mcpIdx(st){const L=MISSION_STAGES.pier;return L.findIndex(q=>q.id===st)}
function mcpSnap(){const cp=o=>o?JSON.parse(JSON.stringify(o)):null;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;
 return{money:PL.money||0,bank:BANKACC.bal||0,luck:LUCK.v,cur:CHAR.cur,pal:cp(PLAYER_PAL),looks:CHAR.list.map(c=>cp(c.look)),jail:CHAR.list.map(c=>cp(c.jailLook)),inv:cp(GUN.inv),w:GUN.w,phones:[...PHONE.models],car:PROLOGUE.car?PROLOGUE.car.type:null}}
function mcpMark(stage){if(MCP.ff||!PROLOGUE.active||!MCP_STAGES.includes(stage))return;if(MCP.stage&&mcpIdx(MCP.stage)>=mcpIdx(stage))return;
 MCP.stage=stage;MCP.snap=mcpSnap();if(stage!=='driveFirst')toast('<span style="color:#7dff8a">CHECKPOINT</span>')}
function mcpRestore(){const S0=MCP.snap;if(!S0)return;const cp=o=>o?JSON.parse(JSON.stringify(o)):null;
 PL.money=S0.money;if(S0.bank!=null)BANKACC.bal=S0.bank;if(S0.luck!=null)LUCK.v=S0.luck;PHONE.models=[...S0.phones];
 CHAR.list.forEach((c,i)=>{const L=S0.cur===i?S0.pal:S0.looks[i];if(i===CHAR.cur){if(S0.cur!==i)return;Object.assign(PLAYER_PAL,cp(L));c.look={...PLAYER_PAL}}else if(L)c.look=cp(L);if(S0.jail[i])c.jailLook=cp(S0.jail[i]);else delete c.jailLook});
 try{applyPlayerLook();charFaces()}catch(e){}
 if(S0.inv&&Object.keys(S0.inv).length){GUN.inv=cp(S0.inv);if(GUN.has){const w=GUN.inv[S0.w]?S0.w:Object.keys(GUN.inv)[0];gunSelect(w,true)}}}
function mcpBegin(){if(!MCP.stage)return false;MCP.ff=true;MCP.t0=performance.now();$('#cpOverlay').hidden=false;return true}
function mcpFinish(ok){MCP.ff=false;if(ok)mcpRestore();$('#cpOverlay').hidden=true;transitionAudioStop();
 toast(ok?'<span style="color:#7dff8a">DE VOLTA AO CHECKPOINT</span>':'MISSÃO REINICIADA · SIGA O NOVO OBJETIVO')}
function mcpTick(){if(!MCP.ff)return;const now=performance.now();if(now-MCP.last<60)return;MCP.last=now;
 if(now-MCP.t0>45000||!PROLOGUE.active&&!STORYINTRO.active){mcpFinish(false);return}
 const I=PROLOGUE,tg=mcpIdx(MCP.stage),cur=mcpIdx(I.stage);
 if(!STORYINTRO.active&&cur>=tg&&!I.cut&&!SWITCH.on){mcpFinish(true);return}
 /* motelGo vem depois da blitz: o pulo do motelDrive iria direto pra porta do quarto */
 if(MCP.stage==='motelGo'&&I.stage==='motelDrive'&&!I.cut&&!DLG.on){I.blitzDone=true;prologueStage('motelGo');const T=prologueMotelTarget();if(T)misGPS(T.x,T.z);return}
 try{missionDebugSkip()}catch(e){console.error('[checkpoint]',e);mcpFinish(false)}}
function storyMissionFailureTick(dt){if(STORYFAIL.mission==='camp'){campFailTick(dt);return}
 if(!STORYFAIL.active)return;
 STORYFAIL.t+=dt;
 const el=$('#storyFailOverlay');
 if(STORYFAIL.t>=2&&STORYFAIL.t<2+dt){el.style.opacity='0'}
 if(STORYFAIL.t<2.8)return;
 storyMissionReset(STORYFAIL.mission);STORYFAIL.active=false;STORYFAIL.t=0;STORYFAIL.mission=null;el.hidden=true;el.style.opacity='0';
 MCP.keep=true;const intro=storyIntroBegin();if(!intro){storyAirportSpawn();prologueBegin()}MCP.keep=false;if(!mcpBegin()&&!intro)toast('MISSÃO REINICIADA · SIGA O NOVO OBJETIVO')
}
function storyCheckpointOffer(){if(!storyOn()||!STORY.checkpoint)return;if(CHEAT.used&&!VINYL.cheat)return; // v77: com cheat (inclusive pular missão) o salvamento é proibido; não oferece o .psave
 $('#storyCheckpoint').hidden=false}
$('#storyCheckpointSave').addEventListener('click',async()=>{if(await saveToFile(false))$('#storyCheckpoint').hidden=true});
$('#storyCheckpointClose').addEventListener('click',()=>{$('#storyCheckpoint').hidden=true});
/* storyOn: está em js/28-save-carga.js */
function storyOK(f){return !storyOn()||(typeof CAMP!=='undefined'&&CAMP.id&&CAMP.allow.has(f))||STORY.cleared||!STORY_LOCKED.includes(f)||STORY.unl.has(f)}
// ícones sempre visíveis na história: GPS, missão e as marcações de situação (polícia, chuva, itens do radar)
function storyMap(k){if(!storyOn())return true;if(k==='motel')return storyOK('motel');
 if(['gps','quest'].includes(k))return true;
 const alias={pol:'police',hosp:'hospital',mkt:'super',cem:'cemetery',univ:'univ',stad:'stadium',club:'casino',air:'airport'};
 const key=alias[k]||k;
 if(STORY.map.has(key))return true;
 // After the introductory mission, find places by exploring the city.
 if(STORY.cleared||STORY.done.has('pier')){const p=PL.car||PL,near=(x,z)=>Math.hypot(p.x-x,p.z-z)<85;
  const found=mapPoiEntries().some(q=>(alias[q.k]||q.k)===key&&near(q.x,q.z));
  if(found){STORY.map.add(key);return true}
 }return false;
}
function storyAvail(id){if(!storyOn())return false;const m=STORY_MISSIONS.find(x=>x.id===id);return!!m&&!STORY.done.has(id)&&m.needs.every(n=>STORY.done.has(n))}
function storySafeOpen(){return storyOK('safe')||(storyOn()&&QUEST.pier.state==='home')}
function storyLocked(t){if(simT-STORY.lockMsgT<4)return;STORY.lockMsgT=simT;toast(t+'<br><small style="font-size:11px;color:#fff">ainda não está disponível na história</small>')}
function storyComplete(id,pay,autoSave=true){const m=STORY_MISSIONS.find(x=>x.id===id);STORY.done.add(id);if(id==='pier')STORY.checkpoint='pier';if(m){for(const f of m.unlock)STORY.unl.add(f);for(const k of m.reveal)STORY.map.add(k)}
 if(pay)money(pay,'MISSÃO CONCLUÍDA · +$'+pay);else toast('MISSÃO CONCLUÍDA');if(m&&m.after)try{m.after()}catch(e){}if(autoSave)try{saveGame(true)}catch(e){}}
function storySave(){return{done:[...STORY.done],unl:[...STORY.unl],map:[...STORY.map],cleared:!!STORY.cleared,checkpoint:STORY.checkpoint,vars:STORY.vars||{}}}
function storyLoad(d){STORY.done=new Set(d&&d.done||[]);STORY.unl=new Set(d&&d.unl||[]);STORY.map=new Set(d&&d.map||[]);STORY.cleared=!!(d&&d.cleared);STORY.checkpoint=(d&&(d.checkpoint||STORY.done.has('pier')&&'pier'))||null;STORY.vars=(d&&d.vars&&typeof d.vars==='object')?JSON.parse(JSON.stringify(d.vars)):{hook:{}};if(!STORY.vars.hook)STORY.vars.hook={};/* r26: saves de quando a história acabava na missão 1 (cleared) — continua tudo liberado, mas as missões 2–5 aparecem */if(STORY.cleared&&STORY.done.has('pier')&&!STORY.done.has('m5')){STORY.cleared=false;for(const f of STORY_LOCKED)STORY.unl.add(f)}}
function storyTick(){if(STORYINTRO.active||!STORY.fresh||!played)return;STORY.fresh=false;if(!storyOn())return;try{const p=charSidewalk(false);PL.x=p[0];PL.z=p[1];PL.gy=groundY(PL.x,PL.z);camT.x=PL.x;camT.z=PL.z}catch(e){}}
// ---------- PISTA: CORRIDA ATÉ O PÍER (curiosidade → Point Haze) ----------
// Um único SMS opcional depois que o jogador já andou um pouco. A passageira espera numa calçada (ícone no mapa);
// qualquer carro serve. No píer ela comenta da transmissão vinda do mar. Se ninguém atender, o SMS volta no dia seguinte.
const QUEST={pier:{state:'idle',play:0,at:null,ped:null,sentAt:0,dist:0,t:0}};
function questPierDrop(){const E=city.ext;if(!E)return null;const p=(city.piers||[]).find(q=>q.id==='marina');if(p)return curbPoint(clamp(p.cx,0,E),clamp(p.cz,0,E));const pp=(city.piers||[])[0];if(pp)return curbPoint(clamp(pp.cx,0,E),clamp(pp.cz,0,E));if(city.coast==null)return null;const q=wTU(city.coast,E/2,0);return curbPoint(clamp(q[0],0,E),clamp(q[1],0,E))}
function questTick(dt){if(PROLOGUE.active)return;const Q=QUEST.pier;if(GAMEMODE==='free'||Q.state==='done'||!played||city.haze||S.style==='inverted')return;const drop=questPierDrop();if(!drop)return;
 if(Q.state==='idle'){if(!storyAvail('pier'))return;if(!PL.inside&&!POL.wanted&&!menuOpen)Q.play+=dt;if(Q.play<2||PL.inside||POL.wanted)return;
  const sp=sidewalkPoint(120,380);if(!sp||Math.hypot(sp.x-drop[0],sp.z-drop[1])<300)return;Q.at={x:sp.x,z:sp.z};Q.state='sent';Q.sentAt=gameMin();
  phoneMission('Número desconhecido: Consegue um táxi? Preciso chegar ao píer antes que meu irmão saia com a lancha. Tô na calçada marcada no seu mapa.');misGPS(Q.at.x,Q.at.z);toast('<span style="color:#ffd21a">NOVA MISSÃO</span><br><small style="font-size:11px;color:#fff">siga o GPS até o ! no mapa</small>');return}
 if(Q.state==='home'){if(city.safe&&!PL.inside)missionGPSGuard();return}
 if(Q.state==='sent'){if(gameMin()-Q.sentAt>1380){Q.sentAt=gameMin();phoneMission('Número desconhecido: Ainda tô esperando aquela carona até o píer… a calçada tá marcada no mapa.')}
  const pc=PL.car||PL,d=Math.hypot(pc.x-Q.at.x,pc.z-Q.at.z);missionGPSGuard();
  if(d<140&&!PL.inside&&(!Q.ped||!peds.includes(Q.ped))){Q.pal=Q.pal||{...CLERK_PAL,cap:null,capDark:null,shirt:'#2a8a8a',stripe:null,hair:'#3a2418',long:true};const q=spawnPed(null,{x:Q.at.x,z:Q.at.z,vx:0,vz:0,pal:Q.pal});if(q){q.state='clerk';q.fixed=true;q.at={x:Q.at.x,z:Q.at.z};q.mx=0;q.mz=1;q.timer=0;q.quest=true;Q.ped=q}}
  if(d>180&&Q.ped){if(peds.includes(Q.ped))removePed(Q.ped);Q.ped=null}
  const q=Q.ped;if(!q||!peds.includes(q))return;if(q.state==='dead'){Q.ped=null;return}const dx=pc.x-q.x,dz=pc.z-q.z;if(d<20){q.mx=dx;q.mz=dz}
  const c=PL.car;if(c&&!c.t.boat&&c.type!=='moto'&&!MIS.type&&d<9&&Math.abs(c.fwd)<2.2){removePed(q);Q.ped=null;Q.state='ride';Q.car=c;Q.dist=Math.hypot(drop[0]-c.x,drop[1]-c.z);Q.t=Math.round(Q.dist/8.5+30);misGPS(drop[0],drop[1]);clang(.2);
   dlgOpen({name:'PASSAGEIRA',pal:Q.pal,lines:['Valeu! Me deixa no píer da praia, rápido!','Meu irmão vai sair com a lancha a qualquer momento. Siga o GPS!']})}
  else if(d<16&&!c&&!Q.hi){Q.hi=true;say(q,'Você tem carro? Preciso ir pro píer!',3)}return}
 if(Q.state==='ride'){const c=PL.car;Q.t-=dt;if(!c||c!==Q.car||!c.alive){Q.state='sent';Q.at={x:(c||PL).x,z:(c||PL).z};Q.hi=false;if(NAV.misMarker){NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;NAV.misMarker=false}toast('A PASSAGEIRA DESCEU');return}
  missionGPSGuard();
  if(Math.hypot(c.x-drop[0],c.z-drop[1])<14&&Math.abs(c.fwd)<2.5){const base=Math.round(15+Q.dist/10),bonus=Q.t>0?20:0,pay=CHEAT.used?0:base+bonus;Q.reward=pay;
   NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;NAV.misMarker=false;Q.state='home';if(city.safe)misGPS(city.safe.x,city.safe.z);
   phoneMission('Claire: Nathan, vem pra casa. Estou te esperando.');toast('OBJETIVO ATUALIZADO · ENCONTRE CLAIRE NA CASA SEGURA');
   const sd=Math.cos(c.a),cd=Math.sin(c.a),q=spawnPed({x:c.x,z:c.z,min:0,max:1});if(q){q.strip=null;q.x=c.x-cd*(c.t.W/2+.9);q.z=c.z+sd*(c.t.W/2+.9);q.ri=rectNear(q.x,q.z);q.r=perim(q.ri);q.t=perimNearest(q.r,q.x,q.z);
}
   try{saveGame(true)}catch(e){}}}}
// Modo história (missões e pistas por SMS) × modo livre (só a cidade). O seletor só vale ao gerar uma cidade nova;
// o modo da partida (GAMEMODE) vem da cidade gerada ou do save carregado.
let GAMEMODE='campaign',modeSel='campaign';
function modePaint(){const c=$('#modeCamp'),f=$('#modeFree');if(!c)return;const free=modeSel==='free';c.setAttribute('aria-pressed',String(!free));f.setAttribute('aria-pressed',String(free));c.classList.toggle('primary',!free);f.classList.toggle('primary',free)}
function modeSet(m){modeSel=m;S.mode=m;modePaint();saveCfg()}
setTimeout(()=>{modeSel=S.mode==='free'?'free':'campaign';GAMEMODE=modeSel;modePaint()},0);
function questSave(){return{pier:QUEST.pier.state==='done',pierHome:QUEST.pier.state==='home',reward:QUEST.pier.reward||0}}
function questLoad(d){const Q=QUEST.pier;if(Q.ped&&peds.includes(Q.ped))removePed(Q.ped);Object.assign(Q,{state:d&&d.pier?'done':d&&d.pierHome?'home':'idle',reward:d&&d.reward||0,play:0,at:null,ped:null,hi:false})}
// ---------- NATHAN + CLAIRE JUNTOS ----------
// Como juntar: (1) na casa segura, fale com o outro (E) e ele sai com você; ao entrar num carro ele vai junto.
// (2) dirija até o carro onde o outro ficou e entre: ele continua ao volante.
// No carro, Alt troca o controle na hora: quem controla o motorista dirige; quem controla o passageiro atira.
// Motorista IA: vai até o marcador do GPS; sem marcador, roda pela cidade (com polícia, foge dela). Carro 70% mais resistente.
// Atirador IA: com polícia atrás, atira nas viaturas e policiais (70% de acerto).
const DUO={on:false,car:null,drv:0,ped:null,follow:false,wp:null,hp0:100,fireT:0,arr:false,worldPed:null,worldIndex:-1,worldHi:false,chatEl:null,chatUntil:0};
function duoName(i){return CHAR.list[i].name}
// O outro personagem continua no mundo por ate 5h de jogo. Quando o jogador
// se aproxima, surge um NPC visual TEMPORARIO usando a paleta salva; ao interagir
// ele passa para o acompanhamento ja existente (nao e um novo sistema de NPC).
function duoWorldClear(){const q=DUO.worldPed;if(q&&peds.includes(q))removePed(q);DUO.worldPed=null;DUO.worldIndex=-1;DUO.worldHi=false;
 if(DUO.chatEl)DUO.chatEl.hidden=true;DUO.chatUntil=0}
function duoWorldChat(q,ix){if(!DUO.chatEl){const d=document.createElement('div');d.id='duoStreetChat';
 d.style.cssText='position:fixed;z-index:28;pointer-events:none;transform:translate(-50%,0);background:rgba(12,14,22,.88);border:1px solid #efad50;border-radius:8px;padding:5px 11px;color:#fff;font:700 12px/1.45 Arial,sans-serif;text-align:center;text-shadow:0 1px 2px #000;box-shadow:0 3px 12px #0007;white-space:nowrap;';
 document.body.appendChild(d);DUO.chatEl=d}
 DUO.chatEl.innerHTML=ix===0?'<span style="color:#ffcd72">NATHAN:</span> E aí, Claire!<div><span style="color:#ffcd72">CLAIRE:</span> Bora dar um rolê?</div>':'<span style="color:#ffcd72">CLAIRE:</span> Oi, Nathan!<div><span style="color:#ffcd72">NATHAN:</span> Bora dar um rolê?</div>';
 DUO.chatEl.hidden=false;DUO.chatUntil=simT+4.5}
function duoWorldChatTick(q){const d=DUO.chatEl;if(!d||d.hidden)return;
 if(simT>=DUO.chatUntil){d.hidden=true;return}
 // Texto embaixo dos dois personagens, acompanhando o encontro na tela.
 const p=new THREE.Vector3((PL.x+q.x)*.5,Math.min(PL.gy||0,q.gy||0)-.25,(PL.z+q.z)*.5).project(camera);
 if(p.z>1||Math.abs(p.x)>1.25||Math.abs(p.y)>1.25){d.hidden=true;return}
 d.style.left=((p.x*.5+.5)*innerWidth)+'px';d.style.top=((1-(p.y*.5+.5))*innerHeight+9)+'px';}

function duoWorldNear(){const q=DUO.worldPed;return !!(q&&peds.includes(q)&&!PL.car&&!PL.inside&&Math.hypot(PL.x-q.x,PL.z-q.z)<2.8)}
function duoWorldTick(){const ix=1-CHAR.cur,o=CHAR.list[ix],st=o.st;
 const valid=played&&!ONLINE.on&&!PROLOGUE.active&&!charOtherHidden()&&!DUO.on&&!DUO.follow&&!PL.dead&&!PL.inside&&!PL.car&&!HAZE.switching&&!INVERT.switching&&!SWITCH.on&&charFresh(o)&&st&&!st.safe&&!st.heli&&st.world?.seed===S.seed&&st.world?.style===S.style&&st.world?.size===S.size;
 if(!valid){duoWorldClear();return}
 const c=st.car?.ref;let x=c&&vehicles.includes(c)?c.x:st.x,z=c&&vehicles.includes(c)?c.z:st.z;
 if(c&&vehicles.includes(c)){const ca=Math.cos(c.a),sa=Math.sin(c.a);x+=-sa*(c.t.W/2+1.25);z+=ca*(c.t.W/2+1.25)}
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(PL.x-x,PL.z-z)>38){duoWorldClear();return}
 let q=DUO.worldPed;
 if(!q||!peds.includes(q)||DUO.worldIndex!==ix){duoWorldClear();q=spawnPed(null,{x,z,vx:0,vz:0,main:true,pal:{...(st.look||o.look||(ix?LUCIA_PAL:PLAYER_PAL)),pack:false}});
  if(!q)return;q.state='clerk';q.fixed=true;q.at={x,z};q.mx=0;q.mz=1;q.timer=0;q.duoWorld=true;q.duoChar=ix;DUO.worldPed=q;DUO.worldIndex=ix}
 q.at.x=x;q.at.z=z;q.mx=PL.x-q.x;q.mz=PL.z-q.z;
 if(!DUO.worldHi&&Math.hypot(PL.x-q.x,PL.z-q.z)<7){DUO.worldHi=true;
  say(q,ix===0?'E aí, Claire! Bora dar um rolê?':'Oi, Nathan! Bora dar um rolê?',3.4)} /* v79r4: só o balão — sem a legenda de baixo (duoWorldChat) */
 duoWorldChatTick(q);
}
function duoAutoOn(){return DUO.on&&PL.car===DUO.car&&CHAR.cur!==DUO.drv}
function duoShooter(){return DUO.on&&PL.car===DUO.car&&CHAR.cur!==DUO.drv}
function duoSpawnFollower(x,z){if(DUO.ped&&peds.includes(DUO.ped))removePed(DUO.ped);const o=CHAR.list[1-CHAR.cur];const q=spawnPed(null,{x,z,vx:0,vz:0,main:true,pal:{...(o.look||LUCIA_PAL),pack:false}});if(!q){DUO.follow=false;return}q.state='duoFollow';q.fixed=true;q.at={x,z};q.mx=0;q.mz=1;q.timer=0;q.duoMoving=false;q.duo=true;DUO.ped=q;DUO.follow=true}
function duoDrop(msg){duoWorldClear();if(DUO.ped&&peds.includes(DUO.ped))removePed(DUO.ped);DUO.ped=null;DUO.follow=false;DUO.on=false;DUO.car=null;CHAR.list[1-CHAR.cur].st=null;if(msg)toast(msg)}
function duoMateNear(){return PL.inside===true&&SAFE.mate&&peds.includes(SAFE.mate)&&!DUO.follow&&Math.hypot(PL.x-SAFE.mate.x,PL.z-SAFE.mate.z)<2.6}
function duoPedNear(){return !PL.car&&DUO.ped&&peds.includes(DUO.ped)&&Math.hypot(PL.x-DUO.ped.x,PL.z-DUO.ped.z)<2.4}
function duoCtx(){if(duoWorldNear()&&storyOK('duo')){const ix=1-CHAR.cur,q=DUO.worldPed;
  if(q)say(q,'Bora rolê! Vamos juntos!',3);
  duoWorldClear();CHAR.list[ix].st=null;duoSpawnFollower(PL.x+1.35,PL.z+.85);
  toast(duoName(ix)+' · BORA ROLÊ!<br><small style="font-size:11px;color:#fff">entre num carro com '+duoName(ix)+' por perto · Alt troca o controle</small>');return true}
 if(duoMateNear()&&storyOK('duo')){DUO.follow=true;safeMateClear();toast(duoName(1-CHAR.cur)+' VAI SAIR COM VOCÊ<br><small style="font-size:11px;color:#fff">entre num carro com ela por perto · Alt troca o controle</small>');return true}
 if(duoPedNear()){duoDrop(duoName(1-CHAR.cur)+' VOLTOU PRA CASA SEGURA');return true}return false}
function duoJoinCar(c){const o=1-CHAR.cur,st=CHAR.list[o].st;if(!storyOK('duo')||DUO.on||!charFresh(CHAR.list[o])||!st||!st.car||st.car.ref!==c)return false;
 CHAR.list[o].st=null;DUO.on=true;DUO.car=c;DUO.drv=1;DUO.follow=false;DUO.wp=null;DUO.arr=false;DUO.hp0=c.hp;c.owned=true;c.path=null;c.pathT=0;c.stuckT=0;c.revT=0;
 toast('CLAIRE NO VOLANTE · NATHAN DE CARONA<br><small style="font-size:11px;color:#fff">Alt troca quem você controla</small>');return true}
function duoSwap(){if(prologueLocked())return;if(CAMHOP.on)return;if(DRUNK.coma<=0){DRUNK.t=0;DRUNK.level=0;DRUNK.drinks=0}const to=1-CHAR.cur;if(SPEC.on)specSet(false);CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};
 const pp=DUO.ped&&peds.includes(DUO.ped)?[DUO.ped.x,DUO.ped.z]:null,me=[PL.x,PL.z];
 wearSwap(to);Object.assign(PLAYER_PAL,{long:false},CHAR.list[to].look||{});PLAYER_PAL.pack=false;applyPlayerLook();CHAR.list[0].st=CHAR.list[1].st=null;
 if(pp&&!PL.car){PL.x=pp[0];PL.z=pp[1];PL.vx=PL.vz=0;duoSpawnFollower(me[0],me[1]);camT.x=PL.x;camT.z=PL.z}
 if(DUO.on&&PL.car===DUO.car){const c=DUO.car;c.path=null;c.pathT=0;c.stuckT=0;c.revT=0;DUO.hp0=c.hp;DUO.wp=null;DUO.arr=false;
  void 0}
 else toast(duoName(CHAR.cur));if(PL.car&&(PL.car.type==='conv'||PL.car.type==='roadster'))PL.car.convSign=null;charFaces();camHopStart(me[0],me[1])}
function duoAuto(c,dt){let tx,tz,stop=8,cap=POL.wanted?27:17;
 if(NAV.marker){const cp=curbPoint(NAV.marker.x,NAV.marker.z);tx=cp[0];tz=cp[1];DUO.wp=null}
 else{const E=city.ext;if(!DUO.wp||Math.hypot(DUO.wp[0]-c.x,DUO.wp[1]-c.z)<40){let a=Math.random()*6.283;if(POL.wanted){let b=null,bd=1e9;for(const v of vehicles)if(v.police&&v.chase&&v.alive){const d=Math.hypot(v.x-c.x,v.z-c.z);if(d<bd){bd=d;b=v}}if(b)a=Math.atan2(c.z-b.z,c.x-b.x)+(Math.random()-.5)}
   const d=250+Math.random()*300;DUO.wp=curbPoint(clamp(c.x+Math.cos(a)*d,0,E),clamp(c.z+Math.sin(a)*d,0,E));DUO.arr=false}tx=DUO.wp[0];tz=DUO.wp[1];stop=2}
 if(DUO.rev>0){DUO.rev-=dt;c.thr=-1;c.steerT=-DUO.rs;c.hand=false;return}
 const arrived=taxiDrive(c,dt,tx,tz,stop,cap);c.nitro=false;if(!arrived&&Math.abs(c.fwd)<1.2&&c.thr>0){DUO.stk=(DUO.stk||0)+dt;if(DUO.stk>1.2){DUO.stk=0;DUO.rev=1.1;DUO.rs=Math.sign(c.steerT)||1}}else DUO.stk=Math.max(0,(DUO.stk||0)-dt);
 if(arrived){if(NAV.marker&&!DUO.arr){DUO.arr=true;toast('CHEGAMOS · '+duoName(DUO.drv)+' estacionou')}else if(!NAV.marker)DUO.wp=null}}
function duoGunner(dt){if(!POL.wanted)return;DUO.fireT-=dt;if(DUO.fireT>0)return;DUO.fireT=.5+Math.random()*.3;const c=DUO.car;let best=null,bd=42;
 for(const v of carsNear(c.x,c.z,42))if(v.police&&v.alive&&v!==c&&(v.chase||v.blitz)){const d=Math.hypot(v.x-c.x,v.z-c.z);if(d<bd){bd=d;best=v}}
 if(!best)for(const q of peds)if(q.cop&&q.state!=='dead'){const d=Math.hypot(q.x-c.x,q.z-c.z);if(d<bd){bd=d;best=q}}
 if(!best)return;const hit=Math.random()<.7,ca=Math.cos(c.a),sa=Math.sin(c.a),side=(-sa*(best.x-c.x)+ca*(best.z-c.z))>=0?1:-1,o=new THREE.Vector3(c.x-sa*side*(c.t.W/2+.15),c.gy+1.15,c.z+ca*side*(c.t.W/2+.15));
 const end=new THREE.Vector3(best.x+(hit?0:(Math.random()-.5)*5),(best.t?(best.gy||0)+.9:(best.gy||0)+1.1),best.z+(hit?0:(Math.random()-.5)*5));tracer(o,end,0xffd070);gunSound(.8,1.05);emit(o.x,o.y,o.z,0,.4,0,.08,.6,.1,0xffd070,true,1);
 if(!hit)return;if(best.t){if(best.mode==='rail')toPhys(best);best.hp-=14;best.sleep=false;if(best.hp<=0&&best.alive)setOnFire(best);if(best.ai)best.ai.stun=.8}
 else{best.hp=(best.hp===undefined?3:best.hp)-.61;bloodHit(end.x,1,end.z,new THREE.Vector3(best.x-c.x,0,best.z-c.z).normalize());if(best.hp<=0){killPed(best);registerKill(best,true)}}}
function duoTick(dt){if(!played)return;duoWorldTick();
 if(DUO.on){const c=DUO.car;
  if(PL.dead||PL.inside||PL.heli||!c||!vehicles.includes(c)||!c.alive||PL.car!==c){const x=c?c.x:PL.x,z=c?c.z:PL.z;DUO.on=false;DUO.car=null;if(!PL.dead&&!PL.inside&&!PL.heli&&c&&!PL.car){const sd=Math.cos(c.a),cd=Math.sin(c.a);duoSpawnFollower(x+cd*(c.t.W/2+1),z-sd*(c.t.W/2+1))}else duoDrop();return}
  if(duoAutoOn()){if(c.hp<DUO.hp0)c.hp=DUO.hp0-(DUO.hp0-c.hp)*.3;DUO.hp0=c.hp}else{DUO.hp0=c.hp;duoGunner(dt)}return}
 if(DUO.follow&&DUO.ped){const q=DUO.ped;if(!peds.includes(q)||q.state==='dead'){duoDrop(q.state==='dead'?null:null);return}
  if(PL.dead||PL.heli||(PL.inside&&PL.inside!==true)||HAZE.switching||INVERT.switching){duoDrop();return}
  const pc=PL.car||PL,d=Math.hypot(pc.x-q.x,pc.z-q.z);
  if(PL.car&&d<12&&!PL.car.t.boat){const c=PL.car;removePed(q);DUO.ped=null;DUO.follow=false;DUO.on=true;DUO.car=c;DUO.drv=1;DUO.hp0=c.hp;c.owned=true;toast('CLAIRE NO VOLANTE · NATHAN DE CARONA<br><small style="font-size:11px;color:#fff">Alt troca o personagem ativo, sem trocar os bancos</small>');return}
  if(d>90){duoDrop(duoName(1-CHAR.cur)+' FICOU PRA TRÁS E VOLTOU PRA CASA SEGURA');return}
  const px=q.at.x,pz=q.at.z;
  if(d>2.2&&!PL.car){const sp=d>8?6.5:4,l=d||1;q.at.x+=(pc.x-q.x)/l*Math.min(d-2,sp*dt);q.at.z+=(pc.z-q.z)/l*Math.min(d-2,sp*dt)}
  q.duoMoving=Math.hypot(q.at.x-px,q.at.z-pz)>.008;q.mx=pc.x-q.x;q.mz=pc.z-q.z}}
// ---------- v77: NOMES DE VEÍCULOS E BAIRROS NA TELA (estilo GTA III/VC/SA) ----------
// Ao entrar num veículo aparece o modelo; ao cruzar a divisa de um bairro aparece o nome dele, no canto inferior
// direito, e somem sozinhos. Nada aparece em cutscenes, interiores ou no mundo invertido.
const VMODEL={sedan:'Westline Crossway',taxi:'Westline Crossway Cab',police:'Westline Crossway Patrol',wagon:'Westline Crossway Touring',
 hatch:'Kipwell Zip',mini:'Kipwell Pocket',crossover:'Alderwick Overlook',suv:'Alderwick Ridgeback',pickup:'Granton Gravel',van:'Shorelink Parcel',
 truck:'Granton Freight 760',bus:'Shorelink 1100',sports:'Breakwater Runout GT',super:'Veycross Slipstream R',conv:'Breakwater Open Sky',
 roadster:'Redwick Shortwave',moto:'Redwick Quickstep 250',boat:'Harborline Tidecut 620',jetski:'Harborline Sprayline 300',vortex:'Fenward Driftfin HX'};
function vehicleModelName(c){if(!c)return '';if(c.isHeli||c.yaw!==undefined&&c.phase!==undefined&&!c.type)return c.police?'Kestrel H4 Patrol':'Kestrel H4';
 const t=c.type;if(t==='super'&&c.special)return 'Veycross Rewind 88';if(t==='van'&&c.ambulance)return 'Shorelink Medic';if(t==='boat'&&c.polBoat)return 'Harborline Tidecut 620 Patrol';
 return VMODEL[t]||(t?t.toUpperCase():'')}
// Bairros. Classificação pela quadra sob o ponto (zona, tipo da quadra, rio, costa, aeroporto, floresta, ilha).
const DISTRICT_NAMES={downtown:'DOWNTOWN',mid:'Palm Heights',beach:'Saltwater Drive',houses:'Almond Grove',river:'Cedar Reach',ind:'Iron Yard',air:'Windfield',rural:'Heron Acres',isle:'Timeless Island',forest:'Mistwood Forest'};
function districtAt(x,z){if(!city.rects||!city.rects.length||city.haze)return null;const E=city.ext||0,ci=Math.floor(x/P),cj=Math.floor(z/P);
 if(city.isle&&ci===city.isle.i&&cj===city.isle.j)return 'isle';
 const cs=city.coast,dc=cs===0?z:cs===1?E-z:cs===2?x:E-x;if(dc<P*.55)return 'beach';
 const A=city.air;if(A&&x>A.ix0-14&&x<A.ix1+14&&z>A.iz0-14&&z<A.iz1+14)return 'air';
 if(x<-8||z<-8||x>E+8||z>E+8)return 'rural';
 let ri=-1,best=1e9;for(let i=0;i<city.rects.length;i++){const r=city.rects[i];if(x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3]){ri=i;break}const dx=Math.max(r[0]-x,0,x-r[2]),dz=Math.max(r[1]-z,0,z-r[3]),d=dx+dz;if(d<best){best=d;ri=i}}
 const f=city.info[ri];if(!f)return null;
 if(f.forest)return 'forest';if(f.kind==='industrial')return 'ind';
 // margem do rio: água a até ~24 m do ponto (faixa das quadras que encostam no canal), não a quadra inteira
 const near=!!(city.riv&&city.riv.size)&&[[24,0],[-24,0],[0,24],[0,-24]].some(([a,b])=>riverZone(x+a,z+b)||inWater(x+a,z+b));
 if(f.d<ZONE.dense&&(f.kind==='bld'||f.kind==='lot'||f.kind==='lm'||f.kind==='park'))return 'downtown';
 if(near||riverZone(x,z))return 'river';
 if(f.kind==='rural'||f.d>=ZONE.houses)return 'rural';
 if(f.kind==='houses')return 'houses';
 return f.d<ZONE.bld?'mid':'houses'}
function districtName(x,z){const k=districtAt(x,z);return k?DISTRICT_NAMES[k]:''}
const AREAHUD={t:0,last:null,pend:null,pendT:0,veh:null,vehT:0,zoneT:0,ck:0};
function areaHudTick(dt){const el=$('#areaHud');if(!el)return;AREAHUD.vehT=Math.max(0,AREAHUD.vehT-dt);AREAHUD.zoneT=Math.max(0,AREAHUD.zoneT-dt);
 const blocked=!played||PL.dead||PL.inside||(typeof MISSION_MODE!=='undefined'&&MISSION_MODE.mode==='cutscene')||STORYINTRO.active||STORYEND.active||city.haze;
 const v=PL.heli||PL.car||null;if(v!==AREAHUD.veh){AREAHUD.veh=v;if(v&&!blocked){$('#areaVeh').textContent=vehicleModelName(PL.heli?{isHeli:true,police:!!v.police}:v);AREAHUD.vehT=3.6}}
 AREAHUD.ck-=dt;if(AREAHUD.ck<=0){AREAHUD.ck=.25;const p=v||PL,k=blocked?null:districtAt(p.x,p.z);
  if(k&&k!==AREAHUD.last){if(AREAHUD.pend!==k){AREAHUD.pend=k;AREAHUD.pendT=0}AREAHUD.pendT+=.25;if(AREAHUD.pendT>=.75||AREAHUD.last===null){AREAHUD.last=k;AREAHUD.pend=null;$('#areaZone').textContent=DISTRICT_NAMES[k];AREAHUD.zoneT=4.2}}
  else if(k===AREAHUD.last)AREAHUD.pend=null}
 if(blocked){AREAHUD.vehT=0;AREAHUD.zoneT=0}
 const vOn=AREAHUD.vehT>0,zOn=AREAHUD.zoneT>0;el.classList.toggle('veh-on',vOn);el.classList.toggle('zone-on',zOn);
 $('#areaVeh').style.opacity=String(vOn?Math.min(1,AREAHUD.vehT/.5,(3.6-AREAHUD.vehT)/.25+.0001):0);$('#areaZone').style.opacity=String(zOn?Math.min(1,AREAHUD.zoneT/.6,(4.2-AREAHUD.zoneT)/.35+.0001):0)}
// ---------- CONCESSIONÁRIA (PIXEL MOTORS) ----------
const VNAME={vortex:'VORTEX',mini:'COMPACTO',wagon:'PERUA',crossover:'CROSSOVER',roadster:'ROADSTER',jetski:'JET SKI',moto:'MOTO',hatch:'HATCH',taxi:'TÁXI',sedan:'SEDÃ',van:'VAN',pickup:'PICAPE',suv:'SUV',conv:'CONVERSÍVEL',sports:'ESPORTIVO',police:'EX-VIATURA',super:'SUPERCARRO',truck:'CAMINHÃO',bus:'ÔNIBUS',boat:'LANCHA'};
// preços pensados na economia: um táxi rende ~$30–60 por corrida, um assalto ~$120–280
const DEAL_PRICES={moto:1200,mini:1400,hatch:1800,taxi:2200,sedan:2500,wagon:2700,van:3200,jetski:3500,pickup:3800,crossover:4200,suv:5000,boat:6000,conv:6500,roadster:7500,truck:8000,sports:9000,police:12000,bus:15000,super:25000};
const DEAL_COLS=['#d62828','#ff7a1a','#f2c21a','#1f9e4a','#2a6ad6','#3ad6ff','#7a2ad6','#ff4fa3','#f4f4f0','#8a8f99','#151518','#6b4226'];
const DEAL={open:false,list:Object.keys(DEAL_PRICES).filter(k=>dealFits(k)),i:0,ci:0,car:null,grp:null,clerk:null,ang:0,last:null,hi:false,px:0,pz:0,ref:null,plateDraft:null};
function dealList(){return (city.deals&&city.deals.length)?city.deals:(city.deal?[city.deal]:[])}
function nearestDealRef(src=PL){const list=dealList();if(!list.length)return null;let b=list[0],bd=1e9;for(const d of list){const x=d.tx||d.cx,z=d.tz||d.cz,dd=Math.hypot((src.x||PL.x)-x,(src.z||PL.z)-z);if(dd<bd){bd=dd;b=d}}return b}
function dealFits(k){const t=VT[k];return !!t&&!t.boat&&t.L<=5.6}
function dealFixedCol(k){return k==='super'||k==='police'}
function dealNear(){const d=nearestDealRef(PL);DEAL.ref=d;return !!(S.style!=='inverted'&&d&&storyOK('deal')&&played&&!PL.inside&&!PL.car&&!PL.dead&&!DEAL.open&&!POL.wanted&&DEAL.clerk&&DEAL.clerk.dealRi===d.ri&&Math.hypot(PL.x-d.sx,PL.z-d.sz)<2.8)}
function dealShow(){const d=DEAL.ref||nearestDealRef(PL);if(!d)return;DEAL.ref=d;if(DEAL.car&&vehicles.includes(DEAL.car))removeVehicle(DEAL.car);const k=DEAL.list[DEAL.i];const c=makeVehicle(k,d.tx,d.tz,DEAL.ang,dealFixedCol(k)?null:DEAL_COLS[DEAL.ci]);c.display=true;c.hand=true;c.sleep=false;c.thr=0;c.hasRider=false;if(DEAL.plateDraft)setCarPlate(c,DEAL.plateDraft);DEAL.car=c}
const DEAL_PLINTH=.62,DEAL_DISC_R=3.62;
/* v1r2: colisão circular do expositor — empurra pra fora jogador a pé, pedestres e carros (caixa do carro × círculo) e freia quem bate */
function dealDiscCollide(d){const R=DEAL_DISC_R,cx=d.tx,cz=d.tz;
 const pushP=(o,r)=>{const dx=o.x-cx,dz=o.z-cz,L=Math.hypot(dx,dz),m=R+r;if(L>=m)return;const nx=L>1e-3?dx/L:1,nz=L>1e-3?dz/L:0;o.x=cx+nx*m;o.z=cz+nz*m;if(o.vx!=null){const vn=o.vx*nx+o.vz*nz;if(vn<0){o.vx-=vn*nx;o.vz-=vn*nz}}};
 if(!PL.car&&!PL.inside&&!PL.dead&&!(PL.jy>DEAL_PLINTH))pushP(PL,.35);
 for(const p of peds)if(p&&!p.dead&&Math.abs(p.x-cx)<R+2&&Math.abs(p.z-cz)<R+2)pushP(p,.35);
 for(const c of vehicles){if(c===DEAL.car||c.display||!c.alive||c.t.boat||Math.abs(c.x-cx)>R+6||Math.abs(c.z-cz)>R+6)continue;
  const ca=Math.cos(c.a),sa=Math.sin(c.a),dx=cx-c.x,dz=cz-c.z,lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca,qx=clamp(lx,-c.t.L/2,c.t.L/2),qz=clamp(lz,-c.t.W/2,c.t.W/2);
  const px=c.x+qx*ca-qz*sa,pz=c.z+qx*sa+qz*ca;let ex=px-cx,ez=pz-cz,e=Math.hypot(ex,ez);if(e>=R)continue;
  if(e<1e-3){ex=c.x-cx;ez=c.z-cz;e=Math.hypot(ex,ez)||1}const nx=ex/e,nz=ez/e,k=R-Math.min(e,R);c.x+=nx*k;c.z+=nz*k;
  const vn=(c.vx||0)*nx+(c.vz||0)*nz;if(vn<0){c.vx-=vn*nx*1.3;c.vz-=vn*nz*1.3;if(c.fwd)c.fwd*=.35}}}
function dealTick(dt){const pc=PL.car||PL,d=nearestDealRef(pc);if(!d)return;DEAL.ref=d;const dist=Math.hypot(pc.x-d.tx,pc.z-d.tz),near=dist<150&&!PL.inside&&S.style!=='inverted';
 // v77: expositor novo — pedestal grafite mais alto, prato giratório cinza metálico, faixa de LED pulsante e cortina de luz subindo.
 if(!DEAL.grp){const g=new THREE.Group(),top=new THREE.Group(),H=DEAL_PLINTH;
  const skirt=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.62,H-.12,48),new THREE.MeshLambertMaterial({color:0x2c2f36}));skirt.position.y=(H-.12)/2;
  const lip=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,.04,48),new THREE.MeshLambertMaterial({color:0x1b1d22}));lip.position.y=H-.12;
  const led=new THREE.Mesh(new THREE.CylinderGeometry(3.47,3.55,.07,48,1,true),new THREE.MeshBasicMaterial({color:0x3ad6ff}));led.position.y=(H-.12)*.55;
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(3.25,3.25,.12,48),new THREE.MeshStandardMaterial({color:0x9ea3ab,metalness:.55,roughness:.32}));plate.position.y=H-.06;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(3.24,.045,6,64),new THREE.MeshBasicMaterial({color:0xdff7ff}));rim.rotation.x=Math.PI/2;rim.position.y=H;
  const sm=new THREE.MeshLambertMaterial({color:0x70757e});for(const r of [0,Math.PI/2]){const st=new THREE.Mesh(new THREE.BoxGeometry(6.2,.012,.16),sm);st.rotation.y=r;st.position.y=H+.004;top.add(st)}
  const cv=document.createElement('canvas');cv.width=4;cv.height=64;const cx=cv.getContext('2d'),gr=cx.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.7,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,1)');cx.fillStyle=gr;cx.fillRect(0,0,4,64);
  const curtain=new THREE.Mesh(new THREE.CylinderGeometry(3.05,3.3,2.4,48,1,true),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),color:0x3ad6ff,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true}));curtain.position.y=H+1.2;curtain.renderOrder=3;
  top.add(plate,rim);g.add(skirt,lip,led,top,curtain);DEAL.top=top;DEAL.led=led;DEAL.curtain=curtain;g.position.set(d.tx,Math.max(groundY(d.tx,d.tz),.24),d.tz);scene.add(g);DEAL.grp=g}
 if(DEAL.grp.parent!==scene)scene.add(DEAL.grp);
 DEAL.grp.position.set(d.tx,Math.max(groundY(d.tx,d.tz),.24),d.tz);
 DEAL.grp.visible=near;
 if(near)dealDiscCollide(d); /* v1r2: o disco do expositor (raio 3,6 m) não tinha colisão */
 if(DEAL.open&&(POL.wanted||PL.dead||!near||DEAL.ref&&DEAL.ref.ri!==d.ri))dealClose();
 if(near&&(!DEAL.car||!vehicles.includes(DEAL.car)||!DEAL.car.alive))dealShow();
 if(!near&&DEAL.car){if(vehicles.includes(DEAL.car))removeVehicle(DEAL.car);DEAL.car=null}
 DEAL.ang+=dt*(DEAL.open?.5:.3);DEAL.top.rotation.y=-DEAL.ang;{const k=.5+.5*Math.sin(simT*2.2);DEAL.led.material.color.setHSL(.53,.9,.45+.2*k);DEAL.curtain.material.opacity=.14+.12*k}
 const c=DEAL.car;if(c){c.x=d.tx;c.z=d.tz;c.vx=c.vz=c.w=0;c.a=DEAL.ang;c.thr=0;c.hand=true;c.hp=100;c.ai=null;c.sleep=false;c.sleepT=0;c.dealLift=DEAL.grp.position.y+DEAL_PLINTH-groundY(d.tx,d.tz);ensureDetail(c);syncCar(c,dt)} // sleepT zerado: antes o carro 'dormia' após 1 s e o giro congelava
 const ok=near&&dist<90;if(ok&&(!DEAL.clerk||!peds.includes(DEAL.clerk)||DEAL.clerk.dealRi!==d.ri)){if(DEAL.clerk&&peds.includes(DEAL.clerk))removePed(DEAL.clerk);const q=spawnPed(null,{x:d.sx,z:d.sz,vx:0,vz:0,pal:{...CLERK_PAL,cap:'#1a3a6a',capDark:'#10243f',shirt:'#f4f4f0',stripe:'#1a3a6a',glasses:'#1b1b1b'}});if(q){q.state='clerk';q.fixed=true;q.dealRi=d.ri;q.at={x:d.sx,z:d.sz};q.mx=-1;q.mz=0;q.timer=0;DEAL.clerk=q}}
 if(!ok&&DEAL.clerk){if(peds.includes(DEAL.clerk))removePed(DEAL.clerk);DEAL.clerk=null;DEAL.hi=false}
 const q=DEAL.clerk;if(q&&peds.includes(q)&&q.state==='clerk'){const dx=PL.x-q.x,dz=PL.z-q.z,l=Math.hypot(dx,dz)||1;if(l<14){q.mx=dx/l;q.mz=dz/l}if(l<7&&!DEAL.hi&&!PL.car){DEAL.hi=true;say(q,'Procurando um carro novo? Chega mais!',3)}if(l>20)DEAL.hi=false}
 if(DEAL.open){PL.x=DEAL.px;PL.z=DEAL.pz;PL.vx=PL.vz=0}}
function dealCam(dt){const d=DEAL.ref||nearestDealRef(PL);if(!d)return;camera.up.set(0,1,0);setLens(46,camera.near);const nar=innerWidth<640;
 if(nar){camera.position.set(d.tx,6.5,d.tz+13);camera.lookAt(d.tx,-1.2,d.tz+1)}else{camera.position.set(d.tx+3.4,4.2,d.tz+12.5);camera.lookAt(d.tx+3.6,.9,d.tz)}sky.position.copy(camera.position)}
function dealOpen(){if(PROLOGUE.active&&PROLOGUE.stage==='dealer'){DEAL.list=['conv'];DEAL.i=0;}else{DEAL.list=Object.keys(DEAL_PRICES).filter(k=>dealFits(k));DEAL.i=clamp(DEAL.i,0,DEAL.list.length-1);}DEAL.ref=nearestDealRef(PL)||DEAL.ref;if(!DEAL.ref)return;DEAL.plateDraft=null;dealShow();DEAL.open=true;DEAL.px=PL.x;DEAL.pz=PL.z;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();$('#deal').hidden=false;dealSync();$('#dealBuy').focus();if(DEAL.clerk)say(DEAL.clerk,'Bem-vindo à Coastal Car Shop! Olha essa belezinha.',3)}
function dealClose(){if(!DEAL.open)return;DEAL.open=false;$('#deal').hidden=true;camT.x=PL.x;camT.z=PL.z}
function dealSync(){const k=DEAL.list[DEAL.i],t=VT[k],pr=DEAL_PRICES[k],fits=dealFits(k),m=PL.money||0;
 $('#dealName').textContent=(VMODEL[k]||VNAME[k]||k).toUpperCase();$('#dealPrice').textContent='$'+pr.toLocaleString(S.lang==='en'?'en-US':'pt-BR');
 $('#dealStats').innerHTML='vel. máx. '+Math.round((t.top||t.vmax)*3.6)+' km/h · aceleração '+'█'.repeat(Math.max(1,Math.round(t.acc/1.4)))+'<br>'+(DEAL.i+1)+' de '+DEAL.list.length;
 const sw=$('#dealSw');if(!sw.dataset.ok){sw.dataset.ok=1;DEAL_COLS.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className='sw';b.style.background=c;b.setAttribute('aria-label','cor '+(i+1));b.addEventListener('click',()=>{DEAL.ci=i;dealShow();dealSync()});sw.appendChild(b)})}
 [...sw.children].forEach((b,i)=>{b.style.outline=i===DEAL.ci&&!dealFixedCol(k)?'3px solid #3ad6ff':'none';b.style.outlineOffset='2px';b.disabled=dealFixedCol(k);b.style.opacity=dealFixedCol(k)?.25:1});
 const free=(SAFE.stored||[]).filter(x=>x).length<2;let st='';
 if(!fits)st='<span style="color:#ff4a4a">NÃO CABE NA GARAGEM · só para ver</span>';else if(m<pr)st='<span style="color:#ff4a4a">FALTAM $'+(pr-m).toLocaleString(S.lang==='en'?'en-US':'pt-BR')+'</span>';else if(!free){const o=(SAFE.stored[0].t||0)<=(SAFE.stored[1].t||0)?SAFE.stored[0]:SAFE.stored[1];st='<span style="color:#ffd21a">GARAGEM CHEIA · o '+(VNAME[o.type]||'veículo')+' mais antigo será substituído</span>'}else st='<span style="color:#5aff6a">CABE NA GARAGEM · documento no seu nome</span>';
 if(dealFixedCol(k))st+='<br><small style="color:var(--mute)">cor de fábrica</small>';
 $('#dealSt').innerHTML=st;$('#dealPlateCur').textContent=normPlate(DEAL.plateDraft||DEAL.car?.plate)||'—';$('#dealPlateEdit').disabled=!fits;$('#dealBuy').disabled=!fits||m<pr;$('#dealBuy').textContent=fits?'COMPRAR · $'+pr.toLocaleString(S.lang==='en'?'en-US':'pt-BR'):'NÃO CABE NA GARAGEM'}
function dealStep(dm,dc){if(dm){DEAL.i=(DEAL.i+dm+DEAL.list.length)%DEAL.list.length;dealShow()}if(dc){DEAL.ci=(DEAL.ci+dc+DEAL_COLS.length)%DEAL_COLS.length;if(!dealFixedCol(DEAL.list[DEAL.i]))dealShow()}dealSync()}
function dealKey(e){const c=e.code;if(c==='Escape'){e.preventDefault();dealClose();return}
 if(c==='ArrowLeft'||c==='KeyA'){e.preventDefault();dealStep(-1,0)}else if(c==='ArrowRight'||c==='KeyD'){e.preventDefault();dealStep(1,0)}
 else if(c==='ArrowUp'||c==='KeyW'){e.preventDefault();dealStep(0,-1)}else if(c==='ArrowDown'||c==='KeyS'){e.preventDefault();dealStep(0,1)}
 else if(c==='KeyE'||(c==='Enter'&&!(document.activeElement&&document.activeElement.tagName==='BUTTON'))){e.preventDefault();dealBuy()}}
function dealBuy(){if(PROLOGUE.active&&PROLOGUE.stage==='dealer'&&DEAL.list[DEAL.i]!=='conv'){toast('ESCOLHA UM CONVERSÍVEL');return}const k=DEAL.list[DEAL.i],pr=DEAL_PRICES[k],d=DEAL.ref||nearestDealRef(PL);if(!d)return;
 if(!dealFits(k)){toast('ESSE VEÍCULO NÃO CABE NA GARAGEM');clang(.1);return}
 if((PL.money||0)<pr){toast('DINHEIRO INSUFICIENTE · $'+pr.toLocaleString(S.lang==='en'?'en-US':'pt-BR'));clang(.1);return}
 if(!Array.isArray(SAFE.stored))SAFE.stored=[SAFE.stored||null,null];if(!SAFE.cars)SAFE.cars=[null,null];
 let i=SAFE.stored.findIndex(x=>!x);if(i<0)i=(SAFE.stored[0].t||0)<=(SAFE.stored[1].t||0)?0:1;
 const old=SAFE.cars[i];if(old&&vehicles.includes(old)&&old!==PL.car)removeVehicle(old);SAFE.cars[i]=null;
 // comprou outro na sequência: o anterior some daqui (continua na garagem, se ainda tiver vaga)
 const L=DEAL.last;if(L&&L!==old&&vehicles.includes(L)&&L!==PL.car){const j=SAFE.cars.indexOf(L);removeVehicle(L);if(j>=0)SAFE.cars[j]=null}
 money(-pr);dealClose();
 const chosenPlate=normPlate(DEAL.plateDraft||DEAL.car?.plate);const c=makeVehicle(k,d.ex,d.ez,Math.PI/2,dealFixedCol(k)?null:DEAL_COLS[DEAL.ci]);if(chosenPlate)setCarPlate(c,chosenPlate);DEAL.plateDraft=null;c.legal=true;c.owned=true;c.sleep=false;c.hand=false;c.thr=0;
 SAFE.stored[i]={...carRec(c),t:Date.now()};SAFE.cars[i]=c;DEAL.last=c;
 PL.car=c;PL.x=c.x;PL.z=c.z;PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;$('#speed').hidden=false;$('#carbar').hidden=false;camT.x=c.x;camT.z=c.z;if(camMode==='fps')chasePos.set(c.x-Math.cos(c.a)*9,4,c.z-Math.sin(c.a)*9);
 prologuePurchase(c);clang(.3);toast('VEÍCULO COMPRADO · −$'+pr.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+'<br><small style="font-size:11px;color:#fff">documento no seu nome · vaga '+(i+1)+' da garagem</small>');if(DEAL.clerk)say(DEAL.clerk,'Negócio fechado! Boa estrada!',3);try{saveGame(true)}catch(e){}}
$('#dealPrev').addEventListener('click',()=>dealStep(-1,0));$('#dealNext').addEventListener('click',()=>dealStep(1,0));$('#dealBuy').addEventListener('click',()=>dealBuy());$('#dealClose').addEventListener('click',()=>dealClose());
$('#dealPlateEdit').addEventListener('click',()=>{if(!DEAL.open||!DEAL.car)return;const target=DEAL.car;
 openTextInput({placeholder:'PLACA (ATÉ 7) + ENTER',max:7,value:normPlate(DEAL.plateDraft||target.plate)||'',sanitize:v=>normPlate(v),submit:v=>{
  if(!DEAL.open||!v)return;if(!DEAL.car)return;DEAL.plateDraft=v;setCarPlate(DEAL.car,v);dealSync();toast('PLACA ESCOLHIDA · '+v);
 }});
});
// ---------- BLITZ ----------
const BLITZ={on:null,cd:30};
function blitzPlate(c){return normPlate(c?.plate)||'SEM PLACA'}
function blitzCone(owned=false){const g=new THREE.Group();if(!BLITZ.geo){BLITZ.geo={c:new THREE.ConeGeometry(.24,.72,12),b:new THREE.BoxGeometry(.5,.06,.5),s:new THREE.CylinderGeometry(.155,.19,.12,12)};BLITZ.mat={o:new THREE.MeshLambertMaterial({color:0xff6a10}),w:new THREE.MeshLambertMaterial({color:0xf4f4f0}),k:new THREE.MeshLambertMaterial({color:0x111114})}}
 const b=new THREE.Mesh(BLITZ.geo.b,BLITZ.mat.k);b.position.y=.03;const c=new THREE.Mesh(BLITZ.geo.c,BLITZ.mat.o);c.position.y=.42;const s=new THREE.Mesh(BLITZ.geo.s,BLITZ.mat.w);s.position.y=.44;g.add(b,c,s);if(owned)g.traverse(o=>{if(o.isMesh){o.geometry=o.geometry.clone();o.material=o.material.clone()}});return g}
function blitzWant(){if(POL.wanted){return POL.level===2&&PL.car&&!PL.inside&&!city.haze&&S.style!=='inverted'&&!PL.dead&&!RAMP.on?'wanted':null} /* v78: no nível 2 aparecem blitzes à frente; furar = nível 3 */
 if(PL.inside||city.haze||S.style==='inverted'||PL.dead)return null;const pc=PL.car||PL;if(WZ.list.some(z=>Math.hypot(pc.x-z.x,pc.z-z.z)<z.r))return null;const z=WZ.list.find(z=>z.lk||z.ck);if(z)return z;BLITZ.calmT=(BLITZ.calmT==null?120:BLITZ.calmT);return BLITZ.calmT<=0?'calm':null}
// Blitz só em rua de mão única: viaturas ocupam uma faixa, cones na divisória levam o trânsito para a outra,
// um policial fica no meio da faixa livre e põe um cone na sua frente; outro vem até a janela.
// Todos os motoristas compartilham esta operação e sua fila única.
function blitzCop(x,z){const q=spawnPed(null,{x,z,vx:0,vz:0,pal:copPal()});if(!q)return null;q.state='clerk';q.fixed=true;q.blitzCop=true;q.at={x,z};q.mx=0;q.mz=1;q.timer=0;return q}
function blitzBuildAt(site,z){const {kx,kz,d,s}=site,cx=kx*P+D[d][0]*s,cz=kz*P+D[d][1]*s;
  const ux=D[d][0],uz=D[d][1],a=Math.atan2(uz,ux),grp=new THREE.Group(),cars=[],P0=(li,t)=>lanePt(kx,kz,d,li,s+t);
  for(const t of [-3,6]){const p=P0(1,t),v=makeVehicle('police',p[0],p[1],a);v.blitz=true;v.hand=true;v.sleep=false;v.thr=0;v.lightsOff=false;cars.push(v)}
  for(let t=-26;t<=-8;t+=3){const f=clamp((t+26)/18,0,1),o=1.9*(1-f)+0*f,x=kx*P+ux*(s+t)-uz*(-o),zz=kz*P+uz*(s+t)+ux*(-o);const cn=blitzCone(true);cn.position.set(x,groundY(x,zz),zz);grp.add(cn)}
  for(let t=-6;t<=12;t+=3){const x=kx*P+ux*(s+t),zz=kz*P+uz*(s+t);const cn=blitzCone(true);cn.position.set(x,groundY(x,zz),zz);grp.add(cn)}
  const cp=[kx*P+ux*(s+10.5),kz*P+uz*(s+10.5)],cop1=blitzCop(cp[0],cp[1]),c2=P0(1,1.5),cop2=blitzCop(c2[0],c2[1]);
  scene.add(grp);
  return {x:cx,z:cz,ux,uz,px:-uz,pz:ux,kx,kz,d,s,cars,grp,zone:z==='calm'?null:z,t:0,phase:'wait',funnel:false,seq:0,cop1,cop2,stop:P0(0,5),seen:false};
}
function blitzRandomSite(near){
 const candidates=[];
 for(let kx=1;kx<city.N-1;kx++)for(let kz=1;kz<city.N-1;kz++)for(let d=0;d<4;d++){
  if(!segExists(kx,kz,d))continue;const L=lineType(kx,kz,d);if(L.t!=='one'||L.dir!==d)continue;
  const s=P/2,x=kx*P+D[d][0]*s,z=kz*P+D[d][1]*s,ux=D[d][0],uz=D[d][1];
  if([-24,0,16].some(t=>riverZone(x+ux*t,z+uz*t)||inWater(x+ux*t,z+uz*t)))continue;
  candidates.push({kx,kz,d,s,x,z});
 }
 const last=BLITZ.lastSite,far=candidates.filter(q=>!last||Math.hypot(q.x-last.x,q.z-last.z)>P*1.5),pool=far.length?far:candidates;
 if(!pool.length)return null;const q=near?pool.reduce((a,b)=>Math.hypot(b.x-near.x,b.z-near.z)<Math.hypot(a.x-near.x,a.z-near.z)?b:a):pool[Math.floor(Math.random()*pool.length)];BLITZ.lastSite={x:q.x,z:q.z};return q;
}
function blitzMake(z,near){const wb=z==='wanted';if(wb&&!near){const c=PL.car||PL,sp=Math.hypot(c.vx||0,c.vz||0),fx=sp>2?(c.vx||0)/sp:(PL.face?PL.face[0]:1),fz=sp>2?(c.vz||0)/sp:(PL.face?PL.face[1]:0);near={x:c.x+fx*170,z:c.z+fz*170}}const site=blitzRandomSite(near);if(!site)return false;if(BLITZ.on)blitzEnd();BLITZ.on=blitzBuildAt(site,wb?'calm':z);if(wb){BLITZ.on.wb=true;BLITZ.on.seen=true}BLITZ.calmT=180+Math.random()*120;return true}
function blitzEnd(){const b=BLITZ.on;if(!b)return;scene.remove(b.grp);disposeGroup(b.grp);for(const v of b.cars)if(vehicles.includes(v)&&v!==PL.car&&v.blitz)removeVehicle(v);for(const q of [b.cop1,b.cop2])if(q&&peds.includes(q))removePed(q);BLITZ.on=null;BLITZ.cd=POL.wanted&&POL.level===2?25+Math.random()*20:60+Math.random()*60}
function blitzTick(dt){const b=BLITZ.on;if(!b){if(!played)return;if(BLITZ.calmT!=null)BLITZ.calmT-=dt;BLITZ.cd-=dt;if(BLITZ.cd>0)return;BLITZ.cd=8;const z=blitzWant();if(z)blitzMake(z);return}
 blitzNpcTick(b,dt);b.t+=dt;const pc=TVM.on&&b.broadcast?TVM.foc:PL.car||PL,dist=Math.hypot(pc.x-b.x,pc.z-b.z),sp=PL.car?Math.abs(PL.car.fwd):0,rx=pc.x-b.kx*P,rz=pc.z-b.kz*P,along=rx*b.ux+rz*b.uz-b.s,lat=Math.abs(rx*b.px+rz*b.pz);
 // Traffic is retained and queued by checkpointSpeed/railUpdate/aiUpdate.
 for(const q of [b.cop1,b.cop2])if(q&&peds.includes(q)&&q.state==='clerk'){const dx=PL.x-q.x,dz=PL.z-q.z,l=Math.hypot(dx,dz)||1;q.mx=dx/l;q.mz=dz/l}
 if(POL.wanted&&b.phase!=='done'&&!b.wb)b.phase='done';if(b.wb&&b.phase!=='done'&&(!POL.wanted||POL.level>=3))b.phase='done';
 if(b.phase==='done'||PL.dead||PL.inside==='jail'){if(dist>120||b.t>200)blitzEnd();return}
 if(b.t>150&&!b.serving&&!b.releasing){blitzEnd();return}
 if(b.serving||b.releasing)return;
 if(b.broadcast)return;if(b.prologue&&PROLOGUE.cut==='switch')return;
 if(dist<60)b.seen=true;
 // policial no meio da faixa põe o cone na sua frente
 if(!b.funnel&&along>-45&&along<4&&lat<7&&PL.car){b.funnel=true;const x=b.kx*P+b.ux*(b.s+8.5)-b.uz*1.9,zz=b.kz*P+b.uz*(b.s+8.5)+b.ux*1.9;const cn=blitzCone(true);cn.position.set(x,groundY(x,zz),zz);b.grp.add(cn);b.frontCone=cn;if(b.cop1)say(b.cop1,'Encoste aqui!',3)}
 for(const cn of b.grp.children)if(!cn.userData.down&&Math.hypot(cn.position.x-pc.x,cn.position.z-pc.z)<1.6&&sp>3){cn.userData.down=true;cn.rotation.z=1.4;cn.position.x+=(Math.random()-.5);clang(.08)}
 if(b.phase==='wait'){if(!b.wb&&PL.car&&along>-6&&along<9&&lat<7&&sp<1.2){b.phase='talk';b.seq=0;b.tt=0}else if(b.seen&&along>11&&lat<9&&PL.car){blitzBreak();return}}
 if(b.phase==='talk'){if(Math.hypot(pc.x-b.stop[0],pc.z-b.stop[1])>14||along>12){blitzBreak();return}b.tt+=dt;const cop=b.cop2&&peds.includes(b.cop2)?b.cop2:b.cars[0];
  // o segundo policial caminha até a janela do motorista
  if(b.cop2&&b.cop2.at){const c=PL.car,win=blitzDriverWindow(c),tx=win.x,tz=win.z,ax=tx-b.cop2.at.x,az=tz-b.cop2.at.z,l=Math.hypot(ax,az);if(l>.3){b.cop2.at.x+=ax/l*Math.min(l,dt*1.6);b.cop2.at.z+=az/l*Math.min(l,dt*1.6)}}
  if(b.tt<1.6)return;
  if(!b.zone){const stolen=PL.car&&!PL.car.legal&&!PL.car.vinylCar;
   if(b.seq===0){say(cop,'Documentos, por favor.',2.6);b.seq=1;b.t2=b.tt}
   else if(b.seq===1&&b.tt-b.t2>2.8){if(!stolen){say(cop,'Hmm... a placa '+blitzPlate(PL.car)+' está dentro dos conformes. Pode seguir.',3.2);b.seq=3;b.phase='done';blitzOpen(b)}else{say(cop,'Hmm... essa sua placa '+blitzPlate(PL.car)+' consta como roubada!',3.2);b.seq=2}}
   else if(b.seq===2&&b.tt-b.t2>6){b.seq=3;b.phase='done';blitzStolen(b,cop)}return}
  if(b.seq===0&&PL.car&&!PL.car.legal&&!PL.car.vinylCar&&!(b.zone.lk&&b.zone.ck)){b.zone=null;return}
  if(b.seq===0){say(cop,'Deixe eu ver seus documentos.',2.6);b.seq=1;b.t2=b.tt}
  else if(b.seq===1&&b.tt-b.t2>2.8){say(cop,'Hmm... a placa '+blitzPlate(PL.car)+(PL.car?.legal?' está regular, mas acho que te reconheço…':' consta como roubada!'),3.2);b.seq=2}
  else if(b.seq===2&&b.tt-b.t2>5.6){const z=b.zone,both=z.lk&&z.ck,caught=both||Math.random()<.5;b.seq=3;b.phase='done';
   if(caught){say(cop,'Está preso!',2.5);setTimeout(()=>{if(PL.car){const c=PL.car;c.thr=0;c.hand=true;PL.lastCar=c;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}busted()},1200)}
   else{say(cop,'Pode seguir. Dirija com cuidado.',2.6);blitzOpen(b);toast('LIBERADO NA BLITZ<br><small style="font-size:11px;color:#fff">foi por pouco…</small>')}}}}
// carro roubado na blitz: a polícia sempre percebe; 50% de chance de ser preso, 50% de ser liberado
function blitzStolen(b,cop){if(Math.random()<.5){say(cop,'Está preso! Desce do carro!',2.5);setTimeout(()=>{if(PL.car){const c=PL.car;c.thr=0;c.hand=true;PL.lastCar=c;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}busted()},1200)}
 else{say(cop,'Hoje é seu dia de sorte… some daqui.',2.8);blitzOpen(b);void 0}}
function blitzOpen(b){if(b.cop1?.at){b.cop1.at.x=b.x+b.ux*10.5+b.uz*1.9;b.cop1.at.z=b.z+b.uz*10.5-b.ux*1.9}if(b.frontCone){b.grp.remove(b.frontCone);disposeGroup(b.frontCone);b.frontCone=null}}
function blitzBreak(){const b=BLITZ.on;if(!b||b.phase==='done')return;b.phase='done';say(b.cop1&&peds.includes(b.cop1)?b.cop1:b.cars[0],'PARADO! FUROU A BLITZ!',2.6);if(b.zone){WZ.fromZone=b.zone;const i=WZ.list.indexOf(b.zone);if(i>=0)WZ.list.splice(i,1)}startWanted(true);if(b.wb)toast('<span style="color:#ff4a4a">FUROU A BLITZ!</span>');wantedUp(b.wb?3:2);for(const v of b.cars)if(v.alive){v.blitz=false;startChase(v)}}
