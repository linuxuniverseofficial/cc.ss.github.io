'use strict';
/* Coastal Chaos · js/40-console-cheats.js — Console de cheats, teclado na tela, entrada de texto.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
const CHC={buf:'',pad:[],list:[
 {c:'ECLIPSE',p:[4,5,12,15,13,14,3,3],n:'ECLIPSE SOLAR',f:eclipseStart},
 {c:'COLLECTTHEMALL',n:'TODOS OS 15 DISCOS (DESATIVA O SAVE)',f:()=>{if(city.haze||S.style==='inverted'){toast('VOLTE PARA A CIDADE');return}for(let i=0;i<VINYL.N;i++)VINYL.got.add(i);vinylSync();VINYL.cheat=true;vinylDone()}},
 {c:'HESOYAM',p:[5,7,4,0,14,13,15,12,14,13,15,12],n:'VIDA, COLETE, $250.000 E CONSERTO',f:()=>{PL.hp=100;PL.armor=100;money(250000);const c=PL.car;if(c&&c.alive){repairCar(c);c.fuel=100}}},
 {c:'AEZAKMI',p:[1,15,1,15,14,2,3,12],n:'NUNCA SER PROCURADO',t:'wanted'},
 {c:'BAGUVIX',p:[13,0,15,14,15,5,15,13,12,3],n:'VIDA INFINITA',t:'hp'},
 {c:'FULLCLIP',p:[4,5,2,5,14,7,5,14,2,13,4,4],n:'MUNIÇÃO INFINITA',t:'ammo'},
 {c:'LXGIWYL',p:[5,7,4,7,14,13,15,12,14,13,15,12],n:'ARMAS 1 (pistola + metralhadora)',f:()=>{gunGive('smg',300);gunGive('pistol',100)}},
 {c:'KJKSZPJ',p:[5,7,4,7,14,13,15,12,14,13,13,14],n:'ARMAS 2 (+ Colt Magnum)',f:()=>{gunGive('smg',300);gunGive('pistol',100);gunGive('magnum',60)}},
 {c:'JAMMER',n:'APP ctOS INSTALADO',f:()=>{ctosInstall()}},
 {c:'UZUMYMW',p:[5,7,4,7,14,13,15,12,14,13,13,13],n:'ARMAS 3 (+ bazuca, lança-chamas, granada, bomba remota e jammer)',f:()=>{gunGive('pistol',100);gunGive('magnum',60);gunGive('smg',300);gunGive('rpg',20);gunGive('flame',ammoCap('flame'));gunGive('grenade',3);gunGive('remote',3)}},
 {c:'TURNUPTHEHEAT',p:[5,5,1,7,14,15,14,15,14,15],n:'POLÍCIA NA COLA',f:()=>{CHEAT.wanted=false;startWanted(true)}},
 {c:'TURNDOWNTHEHEAT',p:[5,5,1,7,12,13,12,13,12,13],n:'POLÍCIA ESQUECEU',f:()=>{if(POL.wanted)endWanted(true);WZ.list.length=0;WZ.crime=null}},
 {c:'ASNAEB',n:'POLÍCIA ESQUECEU',f:()=>{if(POL.wanted)endWanted(true);WZ.list.length=0;WZ.crime=null}},
 {c:'CPKTNWT',p:[7,6,5,4,6,7,2,3,1,3,6,4],n:'TODOS OS CARROS EXPLODEM',f:()=>{const pc=PL.car||PL;for(const v of vehicles.slice())if(v!==PL.car&&v.alive&&!v.t.boat&&Math.hypot(v.x-pc.x,v.z-pc.z)<160){if(v.mode==='rail')toPhys(v);setOnFire(v);v.fuse=.2+Math.random()*1.5}}},
 {c:'AUIFRVQS',p:[7,0,4,4,6,6,6,1],n:'TEMPESTADE',f:()=>{if(WX.stormCell||WX.stormEta!=null||WX.calm!=null){toast('A TEMPESTADE JÁ ESTÁ A CAMINHO');return}stormCalmStart(true)}},
 {c:'AFZLLQLL',p:[7,0,4,4,6,6,6,13],n:'TEMPO ENSOLARADO',f:()=>{WX.cellT=300;WX.stormReq=false;WX.stormEta=null;WX.stormCell=null;WX.calm=null;WX.postClear=null;WX.freeze=false;WX.cheatStorm=false;WX.stormRoll=600;WX.cover=0;CELLS.length=0}},
 {c:'BACKTOTHEFUTURE',p:[4,6,12,13,14,15,12,13],n:'IR AO TOP SECRET MAIS PROXIMO',f:cheatBackToTheFuture},
 {c:'UPSIDEDOWN',p:[6,4,13,12,15,14,13,12],n:'IR PARA PERTO DA FENDA',f:cheatUpsideDown},
 {c:'TELEPORT',p:[4,5,14,15,12,13,0],n:'TELEPORTE PELO MARCADOR (LIGA/DESLIGA)',f:cheatTeleport},
 {c:'THEMASK',n:'MASKARA (ITEM + TRAJE · LIGA/DESLIGA · DESATIVA O SAVE)',f:maskToggle},
 {c:'SPEEDFREAK',n:'NITRO NO CARRO',f:()=>{const c=PL.car;if(c){c.hasNitro=true}}},
 {c:'IMPOSSIBLETOSEE',n:'IMPOSSIBLE TO SEE · SÓ O QUE SE MOVE APARECE (LIGA/DESLIGA)',f:itsToggle}]};

/* v79r13: lista de cheats na aba COMANDOS → CHEATS gerada do próprio CHC.list (sempre completa), com descrição e sequência do controle; rolável */
const CHEAT_DESC={COLLECTTHEMALL:'conta os 15 discos de vinil e libera o prêmio · desativa o save',HESOYAM:'vida, colete, $250.000 e conserta/abastece o carro',AEZAKMI:'nunca ser procurado (liga/desliga)',BAGUVIX:'vida infinita (liga/desliga)',FULLCLIP:'munição infinita (liga/desliga)',LXGIWYL:'armas 1: pistola e metralhadora',KJKSZPJ:'armas 2: + Colt Magnum',UZUMYMW:'armas 3: + bazuca, lança-chamas, granada e bomba remota',JAMMER:'instala o app ctOS (jammer e perfil de pedestres no celular)',TURNUPTHEHEAT:'polícia na cola',TURNDOWNTHEHEAT:'limpa o procurado e as zonas vermelhas',ASNAEB:'limpa o procurado e as zonas vermelhas',CPKTNWT:'explode todos os carros por perto',AUIFRVQS:'tempestade (o céu limpa, depois ela chega)',AFZLLQLL:'sol (limpa chuva e tempestade)',BACKTOTHEFUTURE:'teleporta ao lado do Top Secret mais próximo (garagem BACK TO THE PAST)',UPSIDEDOWN:'teleporta para perto da fenda dimensional, sem atravessar',TELEPORT:'liga/desliga o teleporte ao marcar destino no mapa; com marcador já posto, teleporta na hora',THEMASK:'Maskara: item + traje (liga/desliga) · corre sobre a água · desativa o save',SPEEDFREAK:'nitro no carro atual',ECLIPSE:'eclipse solar',IMPOSSIBLETOSEE:'IMPOSSIBLE TO SEE: tudo vira chiado preto e branco; só o que se move aparece (liga/desliga)'};
const PAD_SYM=['✕','○','□','△','L1','R1','L2','R2','SELECT','START','L3','R3','↑','↓','←','→'];
function cheatListRender(){const el=$('#cheatList');if(!el)return;el.innerHTML=CHC.list.map(it=>'<div class="ch-it"><kbd>'+it.c+'</kbd><span>'+translatePlain(CHEAT_DESC[it.c]||it.n.toLowerCase())+'</span>'+(it.p?'<small>'+it.p.map(k=>PAD_SYM[k]||k).join(' ')+'</small>':'<small class="kb">'+translatePlain('só teclado (ou caixa de cheat)')+'</small>')+'</div>').join('')}
setTimeout(cheatListRender,0);
function cheatRun(code){const it=CHC.list.find(q=>q.c===code);if(!it||!played)return false;if(ONLINE.on){toast(translatePlain('SEM CHEATS NO ONLINE'));CHC.buf='';CHC.pad.length=0;return true}
 if(SWITCH.on||HAZE.switching||INVERT.switching||TIMEJUMP.busy||TIMEJUMP.loading){toast('CHEAT BLOQUEADO · AGUARDE A TRANSIÇÃO');CHC.buf='';CHC.pad.length=0;return true}const firstCheat=!CHEAT.used;CHEAT.used=true;
 if(it.t){const on=!CHEAT[it.t];CHEAT[it.t]=on;toast('CHEAT '+(on?'ATIVADO':'DESATIVADO')+'<br><small style="font-size:11px;color:#fff">'+it.c+' · '+it.n+'</small>')}
 else{try{it.f()}catch(e){console.error(e)}if(it.c!=='THEMASK')toast('CHEAT ATIVADO<br><small style="font-size:11px;color:#fff">'+it.c+' · '+it.n+'</small>')}
 if(firstCheat)toast('⚠ CHEATS PODEM QUEBRAR O JOGO<br><small style="font-size:11px;color:#fff">POR SEGURANÇA, SALVAR ESTÁ PROIBIDO ATÉ INICIAR NOVO JOGO</small>');
 clang(.35);if(NAV.open)closeMap();return true}
function cheatKey(e){if(!played||!/^Key[A-Z]$/.test(e.code))return false;const ch=e.code[3],cand=CHC.buf+ch;let L=0;
 for(let k=Math.min(cand.length,15);k>0;k--){const sfx=cand.slice(-k);if(CHC.list.some(q=>q.c.startsWith(sfx))){L=k;break}}
 CHC.buf=L?cand.slice(-L):'';const full=CHC.list.find(q=>q.c===CHC.buf);if(full){CHC.buf='';cheatRun(full.c);return true}
 return L>=3&&!['KeyW','KeyA','KeyS','KeyD'].includes(e.code)}
function cheatPad(pr){for(const i of [0,1,2,3,4,5,6,7,12,13,14,15])if(pr(i)){CHC.pad.push(i);if(CHC.pad.length>16)CHC.pad.shift();
  for(const q of CHC.list)if(q.p&&CHC.pad.length>=q.p.length&&q.p.every((v,j)=>CHC.pad[CHC.pad.length-q.p.length+j]===v)){CHC.pad.length=0;cheatRun(q.c);return}}}
const MINIKEY={open:false,el:null,opt:null,value:'',index:0,back:null};
function miniKeyClose(apply){if(!MINIKEY.open)return;const opt=MINIKEY.opt,back=MINIKEY.back;let value=MINIKEY.value;if(opt.sanitize)value=opt.sanitize(value);MINIKEY.open=false;MINIKEY.el.hidden=true;MINIKEY.opt=null;if(back&&back.isConnected)back.focus();if(apply){if(opt.submit)opt.submit(value);}else if(opt.cancel)opt.cancel();}
/* v3 r28: tecla aA alterna minúsculas (senha do online diferencia maiúsculas) */
function miniKeyCase(){if(!MINIKEY.el)return;for(const b of MINIKEY.el.querySelectorAll('button[data-l]'))b.textContent=MINIKEY.lower?b.dataset.l.toLowerCase():b.dataset.l}
function miniKeyShown(){const v=MINIKEY.value;return v?(MINIKEY.opt&&MINIKEY.opt.mask?'•'.repeat([...v].length):v):'—'}
function miniKeyShow(opt){MINIKEY.opt=opt||{};MINIKEY.back=document.activeElement;MINIKEY.value=String(opt.value||'');MINIKEY.index=0;
 if(!MINIKEY.el){const e=document.createElement('div');e.id='miniKey';e.hidden=true;e.setAttribute('role','dialog');e.setAttribute('aria-modal','true');e.setAttribute('aria-label','Teclado');e.style.cssText='position:fixed;inset:0;z-index:100010;display:grid;place-items:center;background:#000b;padding:12px';e.innerHTML='<div style="width:min(520px,100%);max-height:95dvh;overflow:auto;background:#171620;border:1px solid #655673;border-radius:8px;padding:18px;box-sizing:border-box;color:#eee;font:14px Segoe UI,system-ui"><h3 style="margin:0 0 12px">TECLADO</h3><output style="display:block;background:#0d1019;padding:12px;margin-bottom:12px;font:22px monospace;letter-spacing:.12em;min-height:26px"></output><div class="keys" style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px"></div><small style="display:block;margin-top:12px">DIRECIONAL: NAVEGAR · ✕ / A: DIGITAR · ○ / B: CANCELAR · △ / Y: APLICAR</small></div>';document.body.appendChild(e);const st=document.createElement('style');st.textContent='#miniKey[hidden]{display:none!important}#miniKey button{background:#222632;color:#eee;border:1px solid #51465f;border-radius:4px;min-height:38px;font:700 14px system-ui;cursor:pointer}#miniKey button:focus{outline:2px solid #e7c371;outline-offset:1px;background:#493e2a}';document.head.appendChild(st);
 for(const key of [...'1234567890QWERTYUIOPASDFGHJKLZXCVBNM','aA','ESPAÇO','APAGAR','LIMPAR','CANCELAR','APLICAR']){const b=document.createElement('button');b.type='button';b.textContent=key;if(key==='A')b.style.gridColumn='1';if(key==='Z')b.style.gridColumn='2';if(key==='ESPAÇO'){b.style.gridColumn='1 / span 2';}if(['APAGAR','LIMPAR','CANCELAR','APLICAR','aA'].includes(key))b.style.gridColumn='span 2';if(key.length===1&&/[A-Z]/.test(key))b.dataset.l=key;b.onclick=()=>{if(key==='aA'){MINIKEY.lower=!MINIKEY.lower;miniKeyCase();return;}if(key==='CANCELAR'){miniKeyClose(false);return;}if(key==='APLICAR'){miniKeyClose(true);return;}if(key==='APAGAR')MINIKEY.value=MINIKEY.value.slice(0,-1);else if(key==='LIMPAR')MINIKEY.value='';else if(MINIKEY.value.length<(MINIKEY.opt.max||20))MINIKEY.value+=key==='ESPAÇO'?' ':MINIKEY.lower&&b.dataset.l?key.toLowerCase():key;e.querySelector('output').textContent=miniKeyShown();};e.querySelector('.keys').appendChild(b);}MINIKEY.el=e;
 e.addEventListener('keydown',ev=>{if(ev.key==='Escape'){miniKeyClose(false);ev.preventDefault();}ev.stopPropagation();});
 }MINIKEY.lower=false;miniKeyCase();MINIKEY.open=true;MINIKEY.el.hidden=false;MINIKEY.el.querySelector('output').textContent=miniKeyShown();MINIKEY.el.querySelector('button').focus();for(const k in keys)keys[k]=false;
}
const TEXTIN={submit:null,cancel:null,sanitize:null};
function openTextInput(opt){if(PAD.on){miniKeyShow(opt||{});return;}const el=$('#chin');if(!el)return;/* A oficina fica acima do HUD; o editor precisa ser filho do body para nao ser coberto. */if(el.parentElement!==document.body)document.body.appendChild(el);el.style.position='fixed';el.style.zIndex='100002';el.style.pointerEvents='auto';TEXTIN.submit=opt&&opt.submit||null;TEXTIN.cancel=opt&&opt.cancel||null;TEXTIN.sanitize=opt&&opt.sanitize||null;el.maxLength=opt&&opt.max||20;el.placeholder=opt&&opt.placeholder||'DIGITE + ENTER';el.value=opt&&opt.value||'';el.hidden=false;el.focus();el.select();for(const k in keys)keys[k]=false}
function closeTextInput(runCancel){const ci=$('#chin');if(!ci)return;ci.hidden=true;ci.blur();const cancel=TEXTIN.cancel;TEXTIN.submit=TEXTIN.cancel=TEXTIN.sanitize=null;if(runCancel&&cancel)try{cancel()}catch(e){}}
function cheatConsole(){openTextInput({placeholder:'DIGITE O CHEAT + ENTER',max:20,value:'',sanitize:v=>v.toUpperCase().replace(/[^A-Z]/g,''),submit:v=>{if(v&&!cheatRun(v))toast('CHEAT INVÁLIDO')}})}
{const ci=$('#chin');ci.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){let v=ci.value;if(TEXTIN.sanitize)v=TEXTIN.sanitize(v);const submit=TEXTIN.submit;closeTextInput(false);if(submit)try{submit(v)}catch(err){console.error(err)}}else if(e.key==='Escape'||e.code==='Backquote'){e.preventDefault();closeTextInput(true)}});ci.addEventListener('blur',()=>{ci.hidden=true;TEXTIN.submit=TEXTIN.cancel=TEXTIN.sanitize=null})}

/* v250 — localization across ALL game UI surfaces (not world-state keys). */
