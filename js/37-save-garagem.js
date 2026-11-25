'use strict';
/* Coastal Chaos · js/37-save-garagem.js — Garagem, casa segura, save (.psave), versão do save, menu inicial.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
function carRec(c){return{type:c.type,color:c.color,nitro:!!c.hasNitro,special:!!c.special,legal:!!c.legal,turbo:!!c.turbo,neon:c.neon?c.neonCol:null,plate:normPlate(c.plate)||randomPlate(),grime:+(c.grime||0).toFixed(2)}} /* v4 r28: sujeira vai junto (garagem/conversível) */
/* v79r24: CONVERSÍVEL DA HISTÓRIA = permanente. Mora na vaga 1 da garagem (sem a marcação amarela/P); a vaga 2 é a única livre pra guardar carro.
   Salvo com placa (d.conv). Se sumir do mundo ou for destruído longe de você, volta inteiro pra vaga. Saves antigos: o conv da vaga 1 vira o permanente. */
function convPerm(){return !!SAFE.conv}
function convTick(s,p){const sl=s.slots[0];if(SAFE.pads&&SAFE.pads[0])SAFE.pads[0].visible=!!sl&&!SAFE.conv;if(!SAFE.conv||!sl)return;let cc=SAFE.convCar;
 if(cc&&!vehicles.includes(cc))cc=SAFE.convCar=null;
 if(cc&&(!cc.alive||cc.exploded)&&PL.car!==cc&&Math.hypot((PL.car||PL).x-cc.x,(PL.car||PL).z-cc.z)>70){removeVehicle(cc);cc=SAFE.convCar=null}
 if(!cc&&Math.hypot(p.x-sl.x,p.z-sl.z)<220&&VT[SAFE.conv.type]){const R=SAFE.conv;let c=vehicles.find(v=>v.alive&&!v.exploded&&v.type===R.type&&v!==PL.car&&!SAFE.cars.includes(v)&&Math.hypot(v.x-sl.x,v.z-sl.z)<2.5);
  if(!c){c=makeVehicle(R.type,sl.x,sl.z,sl.a,R.color);c.hasNitro=!!R.nitro;c.turbo=!!R.turbo;if(R.neon){c.neon=true;c.neonCol=R.neon}c.special=!!R.special;c.sleep=true;c.grime=+R.grime||0;dirtApply(c)}
  if(R.plate)c.plate=normPlate(R.plate)||c.plate;c.legal=!!R.legal;c.owned=true;c.keep=true;c.hand=true;c.homeConv=true;SAFE.convCar=cc=c}
 if(cc&&PL.car===cc)SAFE.conv={...carRec(cc),legal:!!(SAFE.conv.legal||cc.legal)}}
function convMigrate(){if(SAFE.conv||!Array.isArray(SAFE.stored))return;const r=SAFE.stored[0];if(r&&r.type==='conv'&&(STORY.cleared||STORY.done.has('pier')||(typeof PROLOGUE!=='undefined'&&PROLOGUE.stage==='done'))){SAFE.conv={...r,legal:true};SAFE.stored[0]=null;const c=SAFE.cars[0];if(c){SAFE.convCar=c;c.homeConv=true;c.keep=true;SAFE.cars[0]=null}}}
function safeGarage(){const s=city.safe;if(!s||!s.slots||PL.inside)return;const p=PL.car||PL;if(!Array.isArray(SAFE.stored))SAFE.stored=[SAFE.stored||null,null];if(!SAFE.cars)SAFE.cars=[null,null];if(PL.car)SAFE.msgFor=null;
 convMigrate();convTick(s,p);
 for(let i=0;i<2;i++){const sl=s.slots[i];if(!sl)continue;if(i===0&&SAFE.conv)continue;let car=SAFE.cars[i];
  // a garagem é a sua frota: o carro sai e continua seu; se sumir do mundo, volta pra vaga; destruído, a vaga fica livre
  if(car&&(!car.alive||car.exploded)){if(SAFE.stored[i]){SAFE.stored[i]=null;toast('SEU VEÍCULO FOI DESTRUÍDO<br><small style="font-size:11px;color:#fff">a vaga '+(i+1)+' da garagem ficou livre</small>')}SAFE.cars[i]=car=null}
  else if(car&&!vehicles.includes(car))SAFE.cars[i]=car=null;
  const st=SAFE.stored[i];if(st&&!car&&Math.hypot(p.x-sl.x,p.z-sl.z)<220&&VT[st.type]){ /* v79r23: se o carro dessa vaga já está parado nela (ex.: conversível da missão 1, ou após carregar o jogo sem recriar a cidade), adota em vez de criar outro igual */
   const here=vehicles.find(v=>v.alive&&!v.exploded&&v.type===st.type&&v!==PL.car&&!SAFE.cars.includes(v)&&Math.hypot(v.x-sl.x,v.z-sl.z)<2.5);if(here){here.owned=true;here.hand=true;SAFE.cars[i]=here;car=here}}
  if(st&&!car&&Math.hypot(p.x-sl.x,p.z-sl.z)<220&&VT[st.type]){const c=makeVehicle(st.type,sl.x,sl.z,sl.a,st.color);c.hasNitro=st.nitro;c.turbo=!!st.turbo;if(st.neon){c.neon=true;c.neonCol=st.neon}if(st.plate)c.plate=normPlate(st.plate)||c.plate;c.special=st.special;c.legal=!!st.legal;c.owned=true;c.hand=true;c.sleep=true;c.grime=+st.grime||0;dirtApply(c);SAFE.cars[i]=c}
  car=SAFE.cars[i];if(car&&PL.car===car&&st)SAFE.stored[i]={...carRec(car),legal:!!(st.legal||car.legal),t:st.t||Date.now()}}
 const lc=PL.lastCar;if(PL.car||!lc||!lc.alive||lc.t.boat||Math.hypot(lc.vx,lc.vz)>1||SAFE.msgFor===lc&&lc.hp>=100)return;
 for(let i=0;i<2;i++){const sl=s.slots[i];if(!sl||Math.hypot(lc.x-sl.x,lc.z-sl.z)>3.4)continue;
  if(i===0&&SAFE.conv){SAFE.msgFor=lc;if(lc===SAFE.convCar){if(lc.hp<100){repairCar(lc);toast('CONVERSÍVEL CONSERTADO NA GARAGEM');clang(.3)}}else toast('ESSA VAGA É DO CONVERSÍVEL<br><small style="font-size:11px;color:#fff">use a outra vaga</small>');return}
  if(SAFE.cars[i]===lc){if(lc.hp<100){repairCar(lc);toast('CARRO CONSERTADO NA GARAGEM');clang(.3)}SAFE.msgFor=lc;return}
  SAFE.msgFor=lc;const oc=SAFE.cars[i];if(oc&&vehicles.includes(oc)&&Math.hypot(oc.x-sl.x,oc.z-sl.z)<6){toast('ESSA VAGA JÁ ESTÁ OCUPADA');return}if(lc.t.L>5.6||lc.t.boat){toast('ESSE VEÍCULO NÃO CABE NA GARAGEM');return}
  const was=SAFE.stored[i];if(oc&&vehicles.includes(oc)&&oc!==PL.car)removeVehicle(oc);if(DEAL.last===oc)DEAL.last=null;
  const j=SAFE.cars.indexOf(lc);if(j>=0){SAFE.cars[j]=null;SAFE.stored[j]=null}
  SAFE.stored[i]={...carRec(lc),t:Date.now()};SAFE.cars[i]=lc;lc.hand=true;lc.owned=true;repairCar(lc);toast((was&&j<0?'AGORA ESSE CARRO É SEU<br><small style="font-size:11px;color:#fff">o '+(VNAME[was.type]||'veículo')+' que estava nessa vaga sumiu':'CARRO GUARDADO E CONSERTADO<br><small style="font-size:11px;color:#fff">vaga '+(i+1)+' de 2 · fica aqui mesmo depois de carregar o jogo')+(lc.legal?'':' · sem documento: cuidado com blitz')+'</small>');saveGame(true);return}}
function safePoliceClear(){
 // Mesma função para História e Modo Livre: a casa segura limpa todo o estado de busca.
 const forceClear=POL.wanted||WZ.list.length||vehicles.some(c=>c.zonePatrol||(c.chase&&!c.target));
 if(!forceClear)return false;
 const targets=vehicles.filter(c=>c!==PL.car&&c.alive&&(c.zonePatrol||(c.chase&&!c.target)));
 wzFadeAll();endWanted(true,true);POL.truce=Math.max(POL.truce,simT+20);POL.spawnT=5;POL.bustT=0;
 WZ.list.length=0;WZ.crime=null;WZ.fromZone=null;WZ.cur=null;WZ.susT=0;
 for(const q of peds.slice())if(q.cop)removePed(q);
 for(const c of targets){if(vehicles.includes(c))removeVehicle(c)}
 return true;
}
function enterSafe(){if(DUO.ped||DUO.follow){if(DUO.ped&&peds.includes(DUO.ped))removePed(DUO.ped);DUO.ped=null;DUO.follow=false}if(safePoliceClear())toast('CASA SEGURA · POLÍCIA E BUSCA ENCERRADAS');{const s=city.safe;doorEnter('safe',city.haze?'safe:haze':'safe',{x:s.x+s.nx*2.3,z:s.z+s.nz*2.3},[s.nx,s.nz])}const IN=SAFE.IN;PL.inside=true;PL.x=IN.x;PL.z=IN.z+1.3;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;PL.hp=Math.max(PL.hp,100);SAFE.lock=1;
 if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+3);camT.x=PL.x;camT.z=PL.z;for(const p of peds.slice())if(!p.fixed)removePed(p);let fixed=false;{const c=PL.lastCar;if(c&&c.alive&&!c.exploded&&Math.hypot(c.x-city.safe.x,c.z-city.safe.z)<40&&c.hp<100){repairCar(c);fixed=true}}toast('CASA SEGURA<br><small style="font-size:11px;color:#fff">vida recuperada'+(fixed?' · seu veículo foi consertado':'')+' · para salvar: MENU → SALVAR JOGO</small>');try{const reunion=storyOn()&&QUEST.pier.state==='home';safeMateSpawn(reunion?[SAFE.IN.x-1.55,SAFE.IN.z+1.25]:null,reunion);if(reunion)setTimeout(()=>storyReunionDialog(),650);else if(SAFE.mate){const adopting=petFree()&&!PET.adopted&&Math.random()<.38;setTimeout(()=>{if(PL.inside!==true)return;say(CHAR.cur===0?SAFE.mate:PL,adopting?'Seria bom adotar um dos gatinhos de rua, né?':SAY.mate,4.5)},900)}}catch(e){console.error(e)}}
function exitSafe(){const fol=DUO.follow;safeMateClear();const s=city.safe;PL.inside=false;doorExit({x:s.x+s.nx*2.3,z:s.z+s.nz*2.3,nx:s.nx,nz:s.nz});SAFE.lock=1;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x-s.nx*4,2.6,PL.z-s.nz*4);if(fol)duoSpawnFollower(PL.x+s.nx*.8+s.nz*1.2,PL.z+s.nz*.8-s.nx*1.2)}
function fadeFlash(){const f=$('#fade');if(!f)return;f.style.transition='none';f.style.opacity=1;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0})}
function updateSafe(dt){const t=simT;SAFE.lock=Math.max(0,SAFE.lock-dt);
 for(const a of [SAFE.arrowOut,SAFE.arrowIn])if(a){a.position.y=1.5+Math.sin(t*3)*.18;a.rotation.y=t*1.8}
 if(SAFE.arrowOut&&city.safe){if(SAFE.arrowOut.parent!==scene)scene.add(SAFE.arrowOut);SAFE.arrowOut.position.set(city.safe.x+city.safe.nx*.65,groundY(city.safe.x,city.safe.z)+1.5+Math.sin(t*3)*.18,city.safe.z+city.safe.nz*.65);SAFE.arrowOut.traverse(o=>{if(o.isMesh){o.material.depthTest=true;o.renderOrder=0}})}
 if(SAFE.arrowOut)SAFE.arrowOut.visible=!!city.safe&&!city.haze&&storySafeOpen()&&!PL.inside&&Math.hypot(PL.x-city.safe.x,PL.z-city.safe.z)<260;if(SAFE.arrowIn)SAFE.arrowIn.visible=PL.inside===true;
 if(SAFE.pads&&city.safe&&city.safe.slots)for(let i=0;i<2;i++)if(SAFE.pads[i])SAFE.pads[i].visible=!!city.safe.slots[i]&&S.style!=='inverted';
 if(SAFE.tv){SAFE.tvT-=dt;if(SAFE.tvT<=0){SAFE.tvT=.15+Math.random()*.9;SAFE.tv.color.setHSL(.5+Math.random()*.2,.5,.35+Math.random()*.3)}}
 if(storySafeOpen()&&S.style!=='inverted')safeGarage();if(SAFE.heliStored&&city.safeHelipad&&S.style!=='inverted'){safeHeliRestore(SAFE.heliStored);SAFE.heliStored=null}
 if(SAVE.bedPending&&played&&city.safe&&SAFE.IN&&!PL.inside&&!PL.car){SAVE.bedPending=false;PL.x=city.safe.x;PL.z=city.safe.z;enterSafe();{const b=SAFE.bedSpot||{x:SAFE.IN.x+3.3,z:SAFE.IN.z-.9};PL.x=b.x;PL.z=b.z}toast('BOM DIA!<br><small style="font-size:11px;color:#fff">jogo carregado na casa segura</small>')}
 if(PL.dead||PL.car||SAFE.lock>0)return;
 if(!PL.inside&&city.safe&&!city.haze&&Math.hypot(PL.x-city.safe.x,PL.z-city.safe.z)<1.1){if(storySafeOpen())enterSafe(); /* v78: em Point Haze o castelo não é casa segura (a ilha já é segura; a graça é o bunker) */else storyLocked('CASA TRANCADA')}
 else if(PL.inside===true&&Math.hypot(PL.x-SAFE.IN.x,PL.z-(SAFE.IN.z+4-.9))<.8)exitSafe();
 }
function safeHeliSave(){const pad=city.safeHelipad;if(!pad)return null;const h=HELI.list.find(q=>q&&q.state==='parked'&&q.phase==='ground'&&Math.hypot(q.x-pad.x,q.z-pad.z)<pad.r-1);
 return h?{parked:true,police:!!h.police,yaw:h.yaw}:null}
function safeHeliRestore(saved){const pad=city.safeHelipad;if(!saved?.parked||!pad||HELI.list.some(h=>h.safeHome&&h.state==='parked'))return;
 const h=heliAddPad(pad.x,pad.z,Number.isFinite(saved.yaw)?saved.yaw:pad.a,'safehome-'+S.seed,!!saved.police);h.noReturn=true;h.noRespawn=true;h.safeHome=true}
function saveBlocked(){if(ONLINE.on){toast(translatePlain('ONLINE · SEM SAVE'));return true}if(PROLOGUE.active){toast("CONCLUA A MISSÃO INICIAL PARA SALVAR");return true;}if(BR.on||BR.busy){toast('NÃO DÁ PARA SALVAR NAS BACKROOMS');return true}if(CHEAT.used&&!VINYL.cheat){toast('⚠ CHEATS PODEM QUEBRAR O JOGO<br><small style="font-size:11px;color:#fff">POR SEGURANÇA, SALVAR ESTÁ PROIBIDO ATÉ INICIAR NOVO JOGO</small>');return true}if(VINYL.cheat){toast('CHEAT COLLECTTHEMALL ATIVO<br><small style="font-size:11px;color:#fff">este jogo não pode mais ser salvo</small>');return true}if(PARA.active){toast('TERMINE O SALTO ANTES DE SALVAR');return true}if(PL.inside==='jail'){toast('SAIA DA DELEGACIA PARA SALVAR O JOGO');return true}if(typeof MIS!=='undefined'&&MIS.type){toast('NÃO É POSSÍVEL SALVAR DURANTE UMA MISSÃO');return true}if(POL.wanted){toast('NÃO É POSSÍVEL SALVAR DURANTE A FUGA DA POLÍCIA');return true}return false}
function saveGame(quiet){if(!played||PL.dead||STORYFAIL.active||storyOn()&&!STORY.checkpoint||saveBlocked())return;try{SAVE.last=buildSave()}catch(e){}}
const SAVE={last:null,fileT:0};
function buildSave(){{const c=PL.car,s=PL.inside&&DOOR.from&&DOOR.from.seed===S.seed?DOOR.from:PL.inside==='mall'&&MALL.out?MALL.out:PL.inside==='shop'&&SHOP.st?SHOP.st.out:PL.inside&&city.safe?city.safe:null;if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;
 const d={v:1,gv:GAME_VER,saveSeries:SAVE_SERIES,ctos:CTOS.installed?1:0,gang:GANG.day>=0?{d:GANG.day,t:GANG.T.map(t=>({l:t.peds.length?gangAlive(t).length:t.left,c:t.clear?1:0}))}:null,tommy:{got:[...TOMMY.got],bonus:TOMMY.bonus},stats:{...STATS},maskara:MASK.have?1:0,labCard:LAB.card?1:0,t:Date.now(),seed:S.seed,style:S.style,size:S.size,tod:DN.tod,day:DN.day||0,x:s?s.x:PL.x,z:s?s.z:PL.z,hp:Math.max(1,Math.round(PL.hp)),car:c&&c.alive&&!c.t.boat?{type:c.type,color:c.color,a:c.a,hp:c.hp,nitro:!!c.hasNitro,special:!!c.special,fuel:c.fuel,turbo:!!c.turbo,neon:c.neon?c.neonCol:null,grime:+(c.grime||0).toFixed(2),plate:normPlate(c.plate)||null,legal:!!c.legal,owned:!!c.owned,slot:(SAFE.cars||[]).indexOf(c),conv:c===SAFE.convCar}:null,conv:SAFE.conv||null,wantedZones:wzSave(),garage:SAFE.stored,safeHeli:safeHeliSave(),gun:maskGunSave(),skates:skSave(),loan:loanSave(),news:NEWS.items.slice(-12),ammoUp:AMMO.up,money:PL.money||0,bank:Math.max(0,Math.round(BANKACC.bal||0)),melee:{k:!!MELEE.inv.knife,b:!!MELEE.inv.bat,w:MELEE.w},picked:[...city.picked].slice(-400),quest:questSave(),emp:empSave(),mode:GAMEMODE,pets:{cat:PET.adopted,ci:PET.catCi},story:storySave(),vinyl:{seed:S.seed,got:[...VINYL.got],bag:[...VINYL.bag],cheat:VINYL.cheat},records:RECLOG.items.slice(),stunts:[...(city.stunts||[])],wx:WX.wx,wz:WX.wz,cfg:cfgObj(),wxs:wxState(),look:MASK.original?{...MASK.original}:{...PLAYER_PAL},wardrobe:wearSave(),wardrobeChars:wearChars(),kits:CHAR.list.map((c,i)=>i===CHAR.cur?null:(c.kit||null)),cheatUsed:!!CHEAT.used,moneyChars:CHAR.list.map((c,i)=>i===CHAR.cur?(PL.money||0):(c.cash||0)),inv:invertStateSave()};if(S.style==='haze')d.hazeHome=HAZE.home||hazeHomeFallback();d.armor=Math.round(PL.armor||0);d.phone={models:PHONE.models.slice(),notif:PHONE.notif,silent:!!PHONE.silent,callDay:CALL.day};d.chars={cur:CHAR.cur,looks:CHAR.list.map((c,i)=>i===CHAR.cur?null:c.look),sp:CHAR.list.map(c=>c.sp),lucia:CHAR.cur===0&&CHAR.list[1].st&&(!CHAR.list[1].st.car&&!CHAR.list[1].st.heli)?{...CHAR.list[1].st,world:CHAR.list[1].st.world}:null};
 return d}}
/* PixelCity PSAVE v2: chave fixa do jogo, IV aleatorio e autenticacao AES-GCM.
   Preserve PSAVE_KEY_BYTES em futuras versoes para manter saves compativeis. */
const PSAVE_KEY_BYTES=new Uint8Array([117,24,201,56,143,92,11,230,44,165,78,193,7,251,108,39,184,63,222,15,96,177,52,209,133,26,245,70,159,34,198,81]);
let psaveCryptoKey=null;
async function psaveKey(){
 if(!crypto||!crypto.subtle)throw new Error('Web Crypto indisponivel: use HTTPS ou localhost');
 if(!psaveCryptoKey)psaveCryptoKey=await crypto.subtle.importKey('raw',PSAVE_KEY_BYTES,{name:'AES-GCM'},false,['encrypt','decrypt']);
 return psaveCryptoKey;
}
function psaveB64(bytes){
 let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(str);
}
function psaveUnb64(str){
 const raw=atob(str),arr=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
 return arr;
}
async function psaveEncode(data){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const payload=new TextEncoder().encode(JSON.stringify({game:'pixel-city',...data}));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128},await psaveKey(),payload);
 return JSON.stringify({format:'PixelCitySave',version:2,algorithm:'AES-256-GCM',keyId:'pixelcity-v1',iv:psaveB64(iv),data:psaveB64(new Uint8Array(encrypted))});
}
async function psaveDecode(obj){
 if(obj&&obj.format==='PixelCitySave'){
  if(obj.version!==2||obj.algorithm!=='AES-256-GCM'||obj.keyId!=='pixelcity-v1'||typeof obj.iv!=='string'||typeof obj.data!=='string')throw new Error('Formato de save nao suportado');
  const iv=psaveUnb64(obj.iv),bytes=psaveUnb64(obj.data);
  if(iv.length!==12||bytes.length<17)throw new Error('Save incompleto');
  const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv,tagLength:128},await psaveKey(),bytes);
  return JSON.parse(new TextDecoder().decode(clear));
 }
 throw new Error('Save antigo sem criptografia bloqueado');
}
async function saveToFile(bed){
 if(storyOn()&&!STORY.checkpoint){toast('CHECKPOINT NECESSÁRIO · CONCLUA A PRIMEIRA MISSÃO PARA SALVAR');return}
 if(STORYFAIL.active||STORYINTRO.active||STORYEND.active){toast('AGUARDE O FIM DA MISSÃO PARA SALVAR');return}
 if(CHEAT.used){toast('⚠ CHEATS PODEM QUEBRAR O JOGO<br><small style="font-size:11px;color:#fff">POR SEGURANÇA, SALVAR ESTÁ PROIBIDO ATÉ INICIAR NOVO JOGO</small>');return}
 if(!played)return;
 if(PL.dead){toast('NÃO DÁ PRA SALVAR AGORA');return}
 if(saveBlocked())return;
 let d;try{d=buildSave();if(bed===true)d.bed=true}catch(e){console.error(e);toast('ERRO AO SALVAR');return}
 try{
  const txt=await psaveEncode(d),b=new Blob([txt],{type:'application/octet-stream'}),a=document.createElement('a'),dt=new Date(d.t),pad=n=>String(n).padStart(2,'0');
  a.download='pixel-city_seed'+d.seed+'_'+dt.getFullYear()+pad(dt.getMonth()+1)+pad(dt.getDate())+'-'+pad(dt.getHours())+pad(dt.getMinutes())+'.psave';
  a.href=URL.createObjectURL(b);document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  SAVE.fileT=simT;toast('JOGO SALVO · ARQUIVO PROTEGIDO');syncSave();return true;
 }catch(e){console.error('Falha ao criptografar save:',e);toast('ERRO AO PROTEGER SAVE · USE HTTPS OU LOCALHOST')}
}
function showPsaveError(message){
 const dialog=document.getElementById('psaveErrorDialog'),msg=document.getElementById('psaveErrorMessage'),ok=document.getElementById('psaveErrorOk');
 msg.textContent=message;dialog.hidden=false;
 ok.onclick=()=>{dialog.hidden=true;};
 ok.focus();
}
function loadFromFile(file){
 if(!file||played)return;
 const r=new FileReader();
 r.onload=async()=>{
  if(played)return;
  let d=null;
  try{
   d=await psaveDecode(JSON.parse(r.result));
  }catch(e){
   console.warn('Save invalido, corrompido ou adulterado:',e);
   showPsaveError('Save inválido, corrompido ou adulterado detectado.');
   return;
  }
  // Decodificacao assíncrona pode terminar depois de uma partida ter iniciado.
  startFromSaveData(d);
 };
 r.onerror=()=>showPsaveError('Não foi possível ler o arquivo .psave selecionado.');
 r.readAsText(file);
}
function startFromSaveData(d){{
  if(played)return;
  if(!d||d.v!==1||typeof d.seed!=='number'){showPsaveError('O arquivo .psave não contém dados válidos do Coastal Chaos.');return}
  if(!saveVersionCompatible(d.gv,d.saveSeries)){showPsaveError('Este save é de outra versão do jogo ('+(d.gv?'v'+d.gv:'versão antiga')+'). A versão atual é v'+GAME_VER+' e não carrega saves de versões diferentes. Gere uma nova cidade.');return}
  if(!supportedCitySize(d.size||14)){showPsaveError('O tamanho da cidade deste save não está disponível. Use Mobile ou Normal.');return}
  S.seed=d.seed;if(STYLES[d.style])S.style=d.style;S.size=normalizeCitySize(d.size||S.size);S.hour=Math.floor((d.tod||480)/60)%24;
  if(d.cfg){const gc={...d.cfg};for(const k of ['shadows','shadowQuality','bloom','refl','traffic','peds','fpsLimit','renderScale','drawDistance','objectDistance','shadowDistance','detailedShadows','lampLighting','lampCount'])delete gc[k];applyCfgObj(gc);saveCfg();applyVolumes();try{applyShadows()}catch(e){}} // v77: carregar save não troca os gráficos do aparelho
  if(d.wxs){S.rain=true;S.storm=true}
  SAVE.bedPending=!!d.bed;cfgUI();startGame(d);SAVE.fileT=simT;
 }}
/* r27: volta da queda da GPU — o save de emergência (sessionStorage, só desta aba) é carregado sozinho depois do reload */
function glRescueResume(){let d=null;try{d=JSON.parse(sessionStorage.getItem('glRescue')||'null')}catch(_){}try{sessionStorage.removeItem('glRescue')}catch(_){}
 if(!d||played)return;try{startFromSaveData(d);setTimeout(()=>{try{toast(translatePlain('A placa de vídeo reiniciou · jogo retomado'))}catch(_){}},4000)}catch(e){console.warn('glRescue',e)}}
window.addEventListener('load',()=>setTimeout(glRescueResume,700));
// Versão do jogo gravada no save. Suba este número a cada atualização: saves de outra versão são recusados.
const DOOR_NOW=()=>performance.now()/1000;
const GAME_VER=4; /* v4 r1 (24/11/2026, pedido do José): depois da v3 r62; 4 já está em saveVersionCompatible. */ /* v3 r1 (21/11/2026, pedido do José): depois da v2 r70. 3 já está em saveVersionCompatible, então saves da v1 e v2 abrem. */ /* v2 r1: depois da v1 dev r2.4. Saves da v1 continuam aceitos (2 já está em saveVersionCompatible). */ /* numeração reorganizada: depois da v79 r49 vem v1 r1 (saves 1–79 continuam aceitos em saveVersionCompatible) */
const SAVE_SERIES='pixelcity-restart-1';
// v261 preserva saves v260 (AMOnições), v259 e v258. Nenhum dado de câmera é removido.
/* saveVersionCompatible: está em js/28-save-carga.js */
const menuBuildEl=document.getElementById('menuBuild');if(menuBuildEl)menuBuildEl.textContent='v'+GAME_VER+' · '+BUILD_TAG;const menuBuildLine=document.getElementById('menuBuildLine');if(menuBuildLine)menuBuildLine.textContent='v'+GAME_VER+' · '+BUILD_TAG; /* v78: rótulo da entrega (rN) para conferir qual build está aberta */
/* readSave: está em js/28-save-carga.js */
/* Alinha SALVAR (linha superior) exatamente sobre CARREGAR (linha inferior),
   sem usar porcentagens que variam com o viewport. */
/* alignSaveToLoad: está em js/28-save-carga.js */
/* syncSave: está em js/28-save-carga.js */
addEventListener('resize',()=>{if(!$('#menu').hidden)requestAnimationFrame(alignSaveToLoad)});
function wxState(){const K=['x','z','r','s','max','life','age','big','storm','fading','split','wait'];let wet=null;
 if(WET.wf){const b=new Uint8Array(WET.wf.length);for(let i=0;i<b.length;i++)b[i]=Math.round(WET.wf[i]*255);let t='';for(let i=0;i<b.length;i++)t+=String.fromCharCode(b[i]);wet=btoa(t)}
 return{rain:!!S.rain,storm:!!S.storm,wx:WX.wx,wz:WX.wz,chance:WX.chance,cellT:WX.cellT,stormEta:WX.stormEta,stormMsg:WX.stormMsg,stormDir:WX.stormDir,stormNext:WX.stormNext,cover:WX.cover,coverMsg:WX.coverMsg,pre:WX.pre,calm:WX.calm,freeze:WX.freeze,postClear:WX.postClear,stormRoll:WX.stormRoll,cheatStorm:WX.cheatStorm,
  cells:CELLS.map(c=>{const o={};for(const k of K)if(c[k]!==undefined)o[k]=c[k];return o}),stormIdx:CELLS.indexOf(WX.stormCell),wet}}
function applyWx(w){if(!w)return;S.rain=true;S.storm=true;$('#optRain').checked=S.rain;$('#optStorm').checked=S.storm;
 for(const k of ['wx','wz','chance','cellT','stormEta','stormMsg','stormDir','stormNext','cover','coverMsg','pre','calm','freeze','stormRoll','cheatStorm','postClear'])WX[k]=w[k]===undefined?WX[k]:w[k];
 CELLS.length=0;for(const c of w.cells||[])CELLS.push({...c});WX.stormCell=w.stormIdx>=0?CELLS[w.stormIdx]||null:null;WX.lastOpt=S.rain;WX.stormReq=false;WX.f=0;
 if(w.wet&&WET.wf){const t=atob(w.wet);for(let i=0;i<Math.min(t.length,WET.wf.length);i++)WET.wf[i]=t.charCodeAt(i)/255;WET.t=0;try{stepWet(0)}catch(e){}}}
function applySave(d){NEWS.items=Array.isArray(d.news)?d.news.filter(n=>n&&typeof n.k==='string'&&Number.isFinite(n.t)).slice(-12):[];NEWS.lastDead=false;MASK.have=!!d.maskara;LAB.card=!!d.labCard;MASK.cheatHave=false;MASK.original=null;MASK.off=false;MASK.kit=null; /* v78: campo opcional — saves antigos continuam valendo */TOMMY.got=new Set((d.tommy?.got||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<5));TOMMY.bonus=!!d.tommy?.bonus;for(const k in STATS)STATS[k]=Math.max(0,+(d.stats&&d.stats[k])||0);RECLOG.items=Array.isArray(d.records)?d.records.slice(-(RECLOG.max+RECLOG.maxStory)).filter(r=>r&&typeof r.text==='string').map(r=>({who:String(r.who||'NPC ALEATÓRIO').slice(0,80),text:r.text.slice(0,700),type:r.type==='mission'?'mission':'npc',time:String(r.time||'--:--').slice(0,10)})):[];recordsTrim();try{EMP.saved=d.emp||null;EMP.key='';storyLoad(d.story);questLoad(d.quest);GAMEMODE=d.mode==='free'?'free':'campaign';modeSel=GAMEMODE;modePaint()}catch(e){}PET.adopted=!!d.pets?.cat;PET.catCi=Math.max(0,Math.min(CAT_COLS.length-1,d.pets?.ci|0));if(d.vinyl&&d.vinyl.seed===S.seed){VINYL.got=new Set((d.vinyl.got||[]).filter(i=>i>=0&&i<VINYL.N));VINYL.bag=new Set((d.vinyl.bag||[]).filter(i=>i>=0&&i<VINYL.N&&!VINYL.got.has(i)));VINYL.cheat=!!d.vinyl.cheat;vinylSync()}PL.armor=clamp(+d.armor||0,0,100);if(d.phone){PHONE.models=Array.isArray(d.phone.models)?d.phone.models.slice(0,2):['android','ios'];PHONE.notif=d.phone.notif!==false;PHONE.silent=!!d.phone.silent;CALL.day=d.phone.callDay??-1}else if(!HAZE.switching){PHONE.models=['android','ios'];PHONE.notif=true}if(!HAZE.switching)CHAR.list.forEach(c=>{c.st=null;c.owned=null;c.cash=0;c.kit=null});CHAR.cur=0;CHAR.list[0].look=null;CHAR.list[1].look={...LUCIA_PAL};CHAR.list.forEach(c=>c.sp=1);if(d.chars){CHAR.cur=d.chars.cur===1?1:0;if(d.chars.looks&&d.chars.looks[0])CHAR.list[0].look=d.chars.looks[0];for(const c of CHAR.list)if(c.look&&!('art' in c.look))c.look.art=null; /* v78: save antigo: protagonista sem estampa sorteada */if(Array.isArray(d.chars.sp))d.chars.sp.forEach((v,i)=>{if(CHAR.list[i])CHAR.list[i].sp=clamp(+v||0,0,1)});const ls=d.chars.lucia;if(CHAR.cur===0&&ls&&ls.world&&Number.isFinite(ls.x)&&Number.isFinite(ls.z)&&Number.isFinite(ls.at)){CHAR.list[1].st={...ls,car:null,heli:null}}}setTimeout(charFaces,0);if(d.style==='haze')HAZE.home=d.hazeHome||HAZE.home||hazeHomeFallback();wearLoad(d.wardrobe,d.look||WEAR_DEFAULT);{const cur=WEAR_OWNED,wc=Array.isArray(d.wardrobeChars)?d.wardrobeChars:[];CHAR.list.forEach((c,i)=>{if(i===CHAR.cur){c.owned=cur;return}if(wc[i]){wearLoad(wc[i],c.look||(i?LUCIA_PAL:WEAR_DEFAULT));c.owned=WEAR_OWNED}else c.owned=null});WEAR_OWNED=cur};PL.hp=d.hp||100;WZ.list=Array.isArray(d.wantedZones||d.wz)?(d.wantedZones||d.wz).map(z=>({x:z.x,z:z.z,r:wzSearchRadius(),lvl:clamp(z.lvl||1,1,3),looks:z.looks||[],cars:z.cars||[],age:z.age||0})):[];if(d.look){Object.assign(PLAYER_PAL,d.look);PLAYER_PAL.pack=false;if(!('art' in d.look))PLAYER_PAL.art=null;if(!('swim' in d.look))PLAYER_PAL.swim=null;try{applyPlayerLook()}catch(e){}}try{applyWx(d.wxs)}catch(e){console.error(e)}PL.money=d.money||0;BANKACC.bal=Math.max(0,+d.bank||0);if(Array.isArray(d.kits))CHAR.list.forEach((c,i)=>{if(d.kits[i])c.kit=d.kits[i]});if(d.cheatUsed)CHEAT.used=true;if(Array.isArray(d.moneyChars))CHAR.list.forEach((c,i)=>{if(i!==(d.chars&&d.chars.cur===1?1:0))c.cash=Math.max(0,+d.moneyChars[i]||0)});AMMO.up=d.ammoUp&&typeof d.ammoUp==='object'?JSON.parse(JSON.stringify(d.ammoUp)):{};CTOS.installed=!!d.ctos;try{gangReset();GANG.saved=d.gang||null}catch(e){}GUN.inv=d.gun&&d.gun.inv||{};{const m=d.melee||{};MELEE.inv={knife:!!m.k,bat:!!m.b};MELEE.w=m.w==='knife'||m.w==='bat'?m.w:'fist'} /* v4 r29 */if(GUN.inv.jammer){delete GUN.inv.jammer;CTOS.installed=true}GUN.has=false;GUN.ammo=0;const w=d.gun&&d.gun.w;if(w&&GUN.inv[w])gunSelect(w,true);else{const k=Object.keys(GUN.inv)[0];if(k)gunSelect(k,true)}
 for(const id of d.picked||[])city.picked.add(id);city.stunts=new Set(d.stunts||[]);for(const p of pickups.slice())if(city.picked.has(p.id))removePickup(p);
 if(typeof d.tod==='number'){DN.tod=d.tod;DN.day=d.day||0;updateDayNight(0,true)}
 let x=d.x,z=d.z;const o={x,z};circleVsWorld(o,.6);if(inWater(o.x,o.z)||!isFinite(o.x)){if(city.safe){o.x=city.safe.x;o.z=city.safe.z}}PL.x=o.x;PL.z=o.z;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z;
 for(const p of pickups.slice())if(city.picked.has(p.id))removePickup(p);
 try{skLoad(d.skates)}catch(e){console.error(e)}
 try{loanLoad(d.loan)}catch(e){console.error(e)}
 SAFE.stored=Array.isArray(d.garage)?d.garage.slice(0,2):[d.garage||null,null];SAFE.heliStored=d.safeHeli||null;SAFE.cars=[null,null];{const old=SAFE.convCar;SAFE.convCar=null;if(old&&vehicles.includes(old)){if(old===PL.car)PL.car=null;removeVehicle(old)}}SAFE.conv=d.conv&&VT[d.conv.type]?{...d.conv}:null;if(d.car&&VT[d.car.type]){const c=makeVehicle(d.car.type,PL.x,PL.z,d.car.a||0,d.car.color);c.hasNitro=!!d.car.nitro;c.grime=+d.car.grime||0;c.turbo=!!d.car.turbo;if(d.car.neon){c.neon=true;c.neonCol=d.car.neon}if(d.car.plate)c.plate=normPlate(d.car.plate)||c.plate;c.legal=!!d.car.legal;if(d.car.owned)c.owned=true;if(d.car.conv){SAFE.convCar=c;c.homeConv=true;c.keep=true;c.owned=true}else if(d.car.slot>=0&&d.car.slot<2&&SAFE.stored[d.car.slot]){SAFE.cars[d.car.slot]=c;c.owned=true}c.hp=Math.max(25,d.car.hp||100);if(typeof d.car.fuel==='number')c.fuel=d.car.fuel;c.sleep=false;c.hand=false;if(d.car.type==='super'&&d.car.special){c.special=true;c.hasNitro=true;c.hasGlow=false}
  PL.car=c;PL.sp.visible=false;PL.sh.visible=false;$('#speed').hidden=false;$('#carbar').hidden=false;if(camMode==='fps')chasePos.set(c.x-Math.cos(c.a)*9,4,c.z-Math.sin(c.a)*9)}
 for(const p of peds.slice())if(!p.fixed)removePed(p);for(const v of vehicles.slice())if(v!==PL.car&&(v.mode==='rail'||v.ai))removeVehicle(v);buildCarHash();buildLanes();populate(true);
 for(let i=0;i<pedTarget();i++)spawnPed({x:PL.x,z:PL.z,min:0,max:200});applyInvertState(d.inv);
 if(!HAZE.switching&&!INVERT.switching)void 0}
// v158: qualquer ponto do ícone (inclusive o retrato ativo, borda e nome) alterna o personagem.
// pointerup dá resposta imediata em mouse/touch; o click posterior é ignorado para não trocar duas vezes.
// click sem pointerup mantém acessibilidade e compatibilidade com navegadores antigos.
{const swap=$('#chsel');let pointerSwapAt=-1e9;
 const activate=()=>charSwitch(1-CHAR.cur);
 swap.addEventListener('pointerdown',e=>{if(e.isPrimary)e.stopPropagation()});
 swap.addEventListener('pointerup',e=>{if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();e.stopPropagation();pointerSwapAt=performance.now();activate()});
 swap.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();
  if(performance.now()-pointerSwapAt<500)return;activate()});
 swap.addEventListener('keydown',e=>{if(!e.repeat&&(e.code==='Enter'||e.code==='Space')){
  e.preventDefault();e.stopPropagation();activate()}});
}
$('#saveFile').addEventListener('click',saveToFile);$('#monBtn').addEventListener('click',()=>monSet(!MON.on));try{if(localStorage.getItem('ps_mon')==='1')setTimeout(()=>monSet(true),0)}catch(e){}$('#loadFile').addEventListener('change',e=>{loadFromFile(e.target.files[0]);e.target.value=''});
$('#loadSave').addEventListener('click',()=>{if(played)return;const d=readSave();if(!d)return;S.seed=d.seed;if(STYLES[d.style])S.style=d.style;S.size=normalizeCitySize(d.size||S.size);S.hour=Math.floor((d.tod||480)/60)%24;syncMenu();startGame(d)});
addEventListener('beforeunload',e=>{if(played&&simT-SAVE.fileT>60){e.preventDefault();e.returnValue=''}});

