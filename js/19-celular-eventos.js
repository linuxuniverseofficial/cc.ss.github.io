'use strict';
/* Coastal Chaos · js/19-celular-eventos.js — Celular, aves, eventos aleatórios, obras, cenas de rua, reação ao carro, gangues.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= CELULAR =================
   P (teclado) ou ↑ no direcional (controle) abre/fecha — em GTA V é ↑ no PC; aqui ↑ também anda, por isso o P.
   Com o celular aberto, setas/WASD navegam, ENTER/E seleciona, BACKSPACE apaga/volta, ESC/P fecha; números discam direto.
   Controle: direcional navega, ✕/A seleciona, ○/B volta. Funciona a pé e dentro de veículos.
   190 polícia · 192 ambulância (com giroflex; o paramédico enche a vida) · 555 táxi.
   SMS de dicas a cada 1 min (desligável no app CONFIG, a engrenagem); apagam após 24 h de jogo. */
const PHONE_MODELS={android:{name:'PIXDROID S',price:400,body:'#1d1f24',edge:'#3a3e46',acc:'#3ddc84',scr:'#0c1512',txt:'#d8ffe8',key:'#1a2a22'},
 ios:{name:'iPIXEL 15',price:800,body:'#e6e6ea',edge:'#a8a8b0',acc:'#0a84ff',scr:'#0c1018',txt:'#eaf2ff',key:'#1c2230'},
 retro:{name:'TIJOLÃO 3310',price:90,body:'#2a3a6a',edge:'#1a2448',acc:'#f2c21a',scr:'#9ab84a',txt:'#1a2a10',key:'#c8ccd4'}};
const PHONE={amt:'',open:false,scr:'home',zone:'keys',k:4,si:0,num:'',msgs:[],notif:true,tipT:120,bag:[],models:['android','ios'],callT:0,callTxt:'',flash:false,el:null,cv:null};
const PHONE_KEYS=['1','2','3','4','5','6','7','8','9','*','0','#','TELA','LIGAR','APAGAR'];
const PHONE_CONTACTS=[{name:'POLÍCIA',number:'190'},{name:'AMBULÂNCIA',number:'192'},{name:'TÁXI',number:'555'}];
// v276: a agenda mostra o companheiro oposto ao personagem ativo (um contato por telefone).
// Números internos não conflitam com polícia, ambulância, táxi ou bomba remota.
function phoneContacts(){const mate=CHAR.cur===0?{name:'CLAIRE',number:'771',mate:1}:{name:'NATHAN',number:'770',mate:0};const list=ONLINE.on?[...PHONE_CONTACTS,{name:'ENTREGA DE VEÍCULO',number:'300'},...netPhoneContacts()]:[...PHONE_CONTACTS,mate];if(REMOTE.list.length)list.push({name:'BOMBA REMOTA',remote:true});return list}
const PHONE_TIPS=['Experimente o paraquedas na praia: suba no terraço com a seta e salte pela borda.','O portal do Upside Down está chamando… procure a fenda num beco.','Cuidado com a chuva em estrada rural: carro pequeno atola na lama.','Lojas de conveniência dão lucro… mire no caixa e veja.','Troque de roupa e de carro para despistar a polícia.','Pintar o carro na oficina conta como trocar de carro.','Na casa segura a vida enche e dá para guardar 2 carros na garagem.','O DeLorean viaja no tempo acima de 140 km/h.','Helicópteros esperam nos helipontos da delegacia, do hospital e do arranha-céu.','Do helicóptero dá para saltar de paraquedas com ESPAÇO.','Algo está à espreita no além-mar, depois do farol.','Nathan tem bullet time a pé com arma; Claire, câmera lenta dirigindo. Caps Lock!','Segure Alt para trocar de personagem.','O colete à prova de balas aparece em becos e na porta da delegacia.','Ambulância parada no hospital? Aperte T dentro dela: missão paramédico.','Táxi parado? T dentro dele vira missão de taxista.','Viatura roubada + T = missão vigilante.','Ligue 555 e um táxi vem te buscar.','Ligue 192 e um paramédico vem encher sua vida.','Ligue 190 e a polícia vem até você.','Com headphone dá para ouvir as rádios a pé. Loja de eletrônicos do shopping!','Na praia dá para andar de sunga. O guarda-roupa tem roupa de praia.','Gatos vivem nos becos e sobem nas caçambas.','Rampas nos becos e nas ruas fazem saltos insanos.','No posto: clique abastece, botão direito conserta.','A tempestade é rara… e terrível. O céu limpa estranhamente antes dela.','Cada cidade tem o seu clima: algumas chovem quase sempre.','Pedestres saem da praia quando chove.','O cemitério esconde armas entre os túmulos.','O farol tem escada até o topo. A vista vale a pena.','Pouse o helicóptero em telhados largos.','Dá para pousar de paraquedas em qualquer telhado.','Pressionado pela polícia? Entre no shopping e troque de roupa.','Na ambulância, a buzina alterna giroflex, sirene e desligado; na polícia, liga/desliga ambos.','Investigue o portal do Upside Down: ele abre por pouco tempo.','Pule de paraquedas do topo do arranha-céu e pouse num telhado.','Roube uma ambulância e salve pacientes pela cidade.','Atravesse a cidade de lancha pelos rios.','Leve o DeLorean a 140 km/h numa reta longa.','A trilha de cada mundo toca sozinha a pé.','No mapa, botão direito marca o destino do GPS.','A oficina pinta o carro e instala nitro.','Zerinho: W + S + direção parado.'];
function phoneModel(){return PHONE_MODELS[PHONE.models[CHAR.cur]]||PHONE_MODELS.android}
function phoneUnread(){return PHONE.msgs.filter(m=>!m.read).length}
function phoneMissionUnread(){return PHONE.msgs.some(m=>!m.read&&m.kind==='mission')}
// Para missões futuras: phoneMission('Tony: tenho um serviço pra você no porto.'). Não chega no modo avião.
function phoneMission(txt){if(!PHONE.notif)return false;PHONE.msgs.unshift({t:gameMin(),txt,read:false,kind:'mission'});phoneBeep();return true}
// Optional phone-only sink. The world mixer and radio keep their normal output.
const PAD_AUDIO={ctx:null,id:'',ready:false,busy:false};
function padAudioStatus(text){const el=$('#padAudioStatus');if(el)el.textContent=text}
function padAudioConnected(){try{return [...navigator.getGamepads()].some(g=>g&&g.connected)}catch(e){return false}}
function padAudioTone(ctx,out,volume){const t=ctx.currentTime;for(const d of [0,.16]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=1320;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.06*volume,t+d+.01);g.gain.linearRampToValueAtTime(0,t+d+.09);o.connect(g);g.connect(out);o.start(t+d);o.stop(t+d+.1);o.onended=()=>{o.disconnect();g.disconnect()}}}
async function padAudioDisable(){PAD_AUDIO.ready=false;PAD_AUDIO.id='';const old=PAD_AUDIO.ctx;PAD_AUDIO.ctx=null;if(old)try{await old.close()}catch(e){}padAudioStatus('Bipe na saída normal.');}
async function padAudioSelect(id){
 await padAudioDisable();if(!id)return;
 const C=window.AudioContext||window.webkitAudioContext;if(!C||!C.prototype.setSinkId){padAudioStatus('Este navegador não permite escolher a saída de áudio.');return}
 const ctx=new C();try{await ctx.setSinkId(id);await ctx.resume();PAD_AUDIO.ctx=ctx;PAD_AUDIO.id=id;PAD_AUDIO.ready=true;padAudioStatus('Saída configurada. Conecte o controle e teste o bipe.');}
 catch(e){try{await ctx.close()}catch(x){}padAudioStatus('Saída indisponível. Bipe mantido na saída normal.');}
}
async function padAudioChoose(){
 if(PAD_AUDIO.busy)return;PAD_AUDIO.busy=true;let stream=null;
 try{
  if(!window.isSecureContext||!navigator.mediaDevices)throw Error('Use HTTPS ou localhost.');
  const C=window.AudioContext||window.webkitAudioContext;if(!C?.prototype.setSinkId)throw Error('Seleção de saída não suportada neste navegador.');
  let chosen=null;
  if(navigator.mediaDevices.selectAudioOutput)chosen=await navigator.mediaDevices.selectAudioOutput();
  let outputs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audiooutput');
  if(!chosen&&!outputs.some(d=>d.deviceId!=='default'&&d.label)){
   stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());stream=null;
   outputs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audiooutput');
  }
  const sel=$('#padAudioOutput');sel.replaceChildren(new Option('Saída normal',''));
  for(const o of outputs)if(o.deviceId!=='default'&&o.deviceId!=='communications')sel.add(new Option(o.label||'Dispositivo de áudio',o.deviceId));
  if(chosen&&!outputs.some(o=>o.deviceId===chosen.deviceId))sel.add(new Option(chosen.label||'Saída selecionada',chosen.deviceId));
  if(chosen){sel.value=chosen.deviceId;await padAudioSelect(chosen.deviceId)}
  else{sel.value=PAD_AUDIO.id;padAudioStatus('Escolha a saída do controle na lista. Prefira conexão USB.');}
 }catch(e){padAudioStatus(e.name==='NotAllowedError'?'Permissão não concedida. Bipe mantido na saída normal.':e.message||'Não foi possível listar as saídas.');}
 finally{if(stream)stream.getTracks().forEach(t=>t.stop());PAD_AUDIO.busy=false;}
}
function padAudioPhoneBeep(){
 if(PAD.speakerEnabled===false||!PAD_AUDIO.ready||!PAD_AUDIO.ctx||!padAudioConnected())return false;
 const ctx=PAD_AUDIO.ctx;
 const play=()=>padAudioTone(ctx,ctx.destination,VOL.master*VOL.sfx*(PAD.speakerVolume??1));
 if(ctx.state==='running'){try{play();return true}catch(e){void padAudioDisable();return false}}
 ctx.resume().then(()=>{if(ctx.state!=='running'||!PAD_AUDIO.ready)throw Error('audio unavailable');if(S.sound&&PAD.speakerEnabled!==false)play()}).catch(()=>{void padAudioDisable();phoneNormalBeep()});return true;
}
$('#padAudioChoose').addEventListener('click',padAudioChoose);
$('#padAudioOutput').addEventListener('change',e=>padAudioSelect(e.target.value));
$('#padAudioTest').addEventListener('click',()=>{initAudio();phoneBeep();});
if(navigator.mediaDevices?.addEventListener)navigator.mediaDevices.addEventListener('devicechange',async()=>{
 if(!PAD_AUDIO.id)return;try{const all=await navigator.mediaDevices.enumerateDevices();if(!all.some(d=>d.kind==='audiooutput'&&d.deviceId===PAD_AUDIO.id)){await padAudioDisable();$('#padAudioOutput').value=''}}catch(e){}
});

function phoneBeep(){if(!S.sound||PHONE.silent){try{rumble(.25,.25,120)}catch(e){}return}if(!padAudioPhoneBeep())phoneNormalBeep()}
function phoneNormalBeep(){if(!AC||!S.sound)return;const t=AC.currentTime;for(const d of [0,.16]){const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=1320;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.06,t+d+.01);g.gain.linearRampToValueAtTime(0,t+d+.09);o.connect(g);g.connect(master);o.start(t+d);o.stop(t+d+.1)}}
/* r66 · CHAMADAS RECEBIDAS: 1× por dia de jogo, numa hora aleatória, o celular toca (toque próprio; no silencioso só vibra).
   Abra o celular (P / ↑ / ícone) para ATENDER ou RECUSAR. É um golpe (pode cair e perder dinheiro) ou propaganda de banco/app.
   Só no modo livre: nada em missão, online, cutscene, diálogo, morte ou interior com palco. */
const CALL={day:-1,at:-1,ring:0,cur:null,rt:0};
const CALL_SCRIPTS=[
 {k:'scam',who:'BANCO SHORES',lines:['Boa tarde! Aqui é da central de segurança do Banco Shores.','Detectamos uma compra suspeita de $899 no seu cartão.','Para estornar, faça um PIX de verificação agora. O valor volta em 5 minutos.'],ch:['Fazer o PIX','Desligar o telefone'],cost:.12,max:900,min:120},
 {k:'scam',who:'PREMIAÇÕES COASTAL',lines:['Parabéns!! Seu número foi sorteado na promoção da rádio!','Você ganhou um carro zero e um ano de gasolina grátis!','Só falta pagar a taxa de entrega por PIX.'],ch:['Pagar a taxa','Desligar o telefone'],cost:.08,max:600,min:80},
 {k:'scam',who:'???',lines:['Oi, sou eu! Troquei de número, salva esse aí.','Tô numa enrascada, o cartão travou e preciso pagar o guincho.','Me empresta? Amanhã eu te devolvo, juro.'],ch:['Mandar o dinheiro','Quem é você?'],cost:.1,max:500,min:60},
 {k:'scam',who:'ENTREGAS PIXEL',lines:['Olá, sua encomenda ficou retida na alfândega.','Para liberar, precisamos de uma taxa de $95.','Pague agora ou ela volta para o remetente.'],ch:['Pagar os $95','Desligar o telefone'],fixed:95},
 {k:'ad',who:'BANCO NEON SHORES',lines:['Oi! Você já conhece o Banco Neon Shores?','Conta digital sem tarifa, cartão roxo brilhante e cashback em gasolina.','Baixe o app e ganhe cinco dólares de boas-vindas!'],ch:['Quero saber mais','Não, obrigado']},
 {k:'ad',who:'SEGUROS COASTAL',lines:['Olá! Seu carro tem seguro?','Na Seguros Coastal, explodiu, a gente cobre. Quase sempre.','Posso te mandar uma proposta?'],ch:['Pode mandar','Desligar o telefone']},
 {k:'ad',who:'TELEPIXEL',lines:['Aqui é da TelePixel! Seu plano foi selecionado para um upgrade.','Internet 5G ilimitada na ilha inteira, até no Upside Down.','Posso confirmar o upgrade?'],ch:['Confirmar o upgrade','Desligar o telefone']}];
function callOK(){try{return played&&running&&!menuOpen&&!PL.dead&&!DLG.on&&!PROLOGUE.cut&&!ONLINE.on&&!profInMission()&&!TIMEJUMP.busy&&!INVERT.switching&&!HAZE.switching&&!!PHONE.models[CHAR.cur]&&(!storyOn()||STORY.cleared)}catch(e){return false}}
function callTone(){if(!AC||!S.sound)return;if(PHONE.silent){try{rumble(.35,.35,300)}catch(e){}return}const t=AC.currentTime;[659,784,988,784,659,523].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;const t0=t+i*.11;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.07,t0+.015);g.gain.linearRampToValueAtTime(0,t0+.1);o.connect(g);g.connect(master);o.start(t0);o.stop(t0+.12)})}
function callStart(){const sc=CALL_SCRIPTS[Math.floor(Math.random()*CALL_SCRIPTS.length)];CALL.cur={...sc,num:'('+(10+Math.floor(Math.random()*89))+') 9'+Math.floor(1000+Math.random()*8999)+'-'+Math.floor(1000+Math.random()*8999)};CALL.ring=16;CALL.rt=0;
 toast('📞 '+translatePlain('CELULAR TOCANDO')+'<br><small style="font-size:11px;color:#fff">'+CALL.cur.num+' · '+translatePlain(TOUCH.on?'toque no celular':PAD.on?'↑ atende':'P atende')+'</small>');if(PHONE.open){PHONE.scr='incoming';PHONE.zone='scr';PHONE.si=0;phoneDraw()}else phonePeekShow()}
/* r20: celular tocando aparece sozinho na tela (modo 'peek': visível, sem capturar teclado/controle; P/↑/toque atende) */
function phonePeekShow(){if(PHONE.open||PHONE.peek)return;const el=phoneEl();PHONE.peek=true;PHONE.scr='incoming';PHONE.zone='scr';PHONE.si=0;el.classList.add('peek');el.hidden=false;phoneDraw()}
function phonePeekHide(){if(!PHONE.peek)return;PHONE.peek=false;const el=PHONE.el;if(el){el.classList.remove('peek');if(!PHONE.open)el.hidden=true}if(!PHONE.open){PHONE.scr='home';PHONE.zone='keys';PHONE.k=4}}
function callEnd(){CALL.ring=0;CALL.cur=null;phonePeekHide();if(PHONE.open&&PHONE.scr==='incoming'){PHONE.scr='home';PHONE.zone='scr';PHONE.si=0;phoneDraw()}}
function callDecline(){if(!CALL.cur)return callEnd();callEnd();clang(.08)}
function callAnswer(){const C=CALL.cur;if(!C)return callEnd();CALL.ring=0;CALL.cur=null;phonePeekHide();if(PHONE.open)phoneToggle();
 dlgOpen({name:C.who,pal:{...pick2(PED_PALS)},lines:C.lines,choices:C.ch,onEnd:(r)=>{
  if(C.k==='scam'&&r===0){const have=Math.max(0,PL.money||0),n=C.fixed?Math.min(have,C.fixed):Math.min(have,Math.max(C.min,Math.min(C.max,Math.round(have*C.cost))));if(n>0){money(-n,translatePlain('GOLPE DO TELEFONE')+' · −$'+n);setTimeout(()=>{try{PHONE.msgs.unshift({t:gameMin(),txt:'Número desconhecido: obrigado pelo PIX, otário. 😂',read:false});phoneBeep()}catch(e){}},9000)}else toast(translatePlain('SEM SALDO · O GOLPISTA DESLIGOU'))}
  else if(r===0){try{PHONE.msgs.unshift({t:gameMin(),txt:C.who+': obrigado pelo interesse! Em breve um consultor entra em contato.',read:false});phoneBeep()}catch(e){}}}})}
function callTick(dt){const day=DN.day||0;if(CALL.day!==day&&CALL.at<0){CALL.at=60*(7+Math.random()*15);CALL.atDay=day}
 if(CALL.cur){if(!callOK()&&!PHONE.open){callEnd();return}CALL.ring-=dt;CALL.rt-=dt;if(CALL.rt<=0){CALL.rt=1.6;callTone()}if(PHONE.open&&PHONE.scr!=='incoming'&&PHONE.scr!=='call'){PHONE.scr='incoming';PHONE.zone='scr';PHONE.si=0}if(PHONE.open||PHONE.peek)phoneDraw();
  if(CALL.ring<=0){const n=CALL.cur.num;callEnd();try{PHONE.msgs.unshift({t:gameMin(),txt:'Chamada perdida: '+n,read:false})}catch(e){}}return}
 if(CALL.at>=0&&CALL.atDay===day&&CALL.day!==day&&(DN.tod||0)>=CALL.at&&callOK()&&!PL.inside){CALL.day=day;CALL.at=-1;callStart()}
 else if(CALL.atDay!==day&&CALL.at>=0)CALL.at=-1}
function phoneTick(dt){if(!played)return;try{callTick(dt)}catch(e){console.error('[chamada]',e)}const now=gameMin();PHONE.msgs=PHONE.msgs.filter(m=>now-m.t<1440&&now>=m.t);
 if(PHONE.notif&&running&&!menuOpen&&(!storyOn()||STORY.cleared)){PHONE.tipT-=dt;if(PHONE.tipT<=0){PHONE.tipT=240+Math.random()*120;if(!PHONE.bag.length)PHONE.bag=PHONE_TIPS.map((_,i)=>i).sort(()=>Math.random()-.5);const petSMS=petFree()&&!PET.adopted&&!PET.smsSent&&Math.random()<.34;const tip=petSMS?'Os gatinhos dos becos são ariscos. Aproxime-se devagar, a pé, para conseguir adotar um.':PHONE_TIPS[PHONE.bag.pop()];if(petSMS)PET.smsSent=true;PHONE.msgs.unshift({t:now,txt:tip,read:false});if(PHONE.msgs.length>30)PHONE.msgs.length=30;phoneBeep()}}
 if(PHONE.callT>0){const r0=Math.floor(PHONE.callT/.8);PHONE.callT-=dt;if(PHONE.callT>0&&Math.floor(PHONE.callT/.8)!==r0)phoneRing();if(PHONE.callT<=0){const n=PHONE.num;PHONE.num='';PHONE.scr='home';phoneDoCall(n)}}
 if(PHONE.open)phoneDraw()}
function phoneTapAt(clientX,clientY){if((!PHONE.open&&!PHONE.peek)||DLG.on)return;if(PHONE.peek&&!PHONE.open){initAudio();const r0=PHONE.el.getBoundingClientRect(),y0=(clientY-r0.top)*232/(r0.height||1);const h0=(PHONE.hits||[]).find(h=>h.zone==='scr'&&h.i===1&&y0>=h.y&&y0<=h.y+h.h&&((clientX-r0.left)*120/(r0.width||1))>=h.x&&((clientX-r0.left)*120/(r0.width||1))<=h.x+h.w);if(h0)callDecline();else callAnswer();return}
 const r=PHONE.el.getBoundingClientRect();if(!r.width||!r.height)return;
 const x=(clientX-r.left)*120/r.width,y=(clientY-r.top)*232/r.height;
 const hit=(PHONE.hits||[]).find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h);
 if(!hit)return;initAudio();
 if(hit.zone==='keys'){PHONE.zone='keys';PHONE.k=hit.i;phoneOK()}
 else{PHONE.zone='scr';PHONE.si=hit.i;if(PHONE.scr==='msgs'){if(PHONE.msgs[hit.i])PHONE.msgs[hit.i].read=true}else phoneOK()}
 if(PHONE.open)phoneDraw();
}
function phoneBindTouch(d){let start=null,ignore=0;
 d.addEventListener('touchstart',e=>{e.stopPropagation();const t=e.touches[0];start=e.touches.length===1?{id:t.identifier,x:t.clientX,y:t.clientY}:null},{passive:true});
 d.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();ignore=performance.now()+800;const p=start;start=null;if(!p||e.touches.length)return;
 const t=Array.from(e.changedTouches).find(t=>t.identifier===p.id);if(!t)return;
 const dx=t.clientX-p.x,dy=t.clientY-p.y;
 if(Math.hypot(dx,dy)<=12)phoneTapAt(t.clientX,t.clientY);
 else if(PHONE.scr==='msgs'&&Math.abs(dy)>25&&Math.abs(dy)>Math.abs(dx)){PHONE.zone='scr';PHONE.si=clamp(PHONE.si+(dy<0?1:-1),0,Math.max(0,PHONE.msgs.length-1));if(PHONE.msgs[PHONE.si])PHONE.msgs[PHONE.si].read=true;phoneDraw()}
 },{passive:false});
 d.addEventListener('touchcancel',()=>{start=null;ignore=performance.now()+800});
 d.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(performance.now()>=ignore)phoneTapAt(e.clientX,e.clientY)});
 d.addEventListener('mousedown',e=>e.stopPropagation());
}
function phoneEl(){if(PHONE.el)return PHONE.el;const d=document.createElement('canvas');d.id='phone';d.width=360;d.height=696;d.hidden=true;document.body.appendChild(d);PHONE.el=d;phoneBindTouch(d);const close=document.createElement('button');close.id='phoneTouchClose';close.className='btn';close.textContent=translatePlain('FECHAR');close.hidden=true;close.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(PHONE.open)phoneToggle()});document.body.appendChild(close);const g=d.getContext('2d'),ft=g.fillText.bind(g);g.fillText=(t,x,y,mw)=>ft(translatePlain(String(t)),x,y,mw||100);PHONE.cv=g;return d}
function phoneToggle(){if(PHONE.peek&&!PHONE.open){if(CALL.cur&&!DLG.on){callAnswer();return}phonePeekHide()}if(!PHONE.open&&missionUiBlocked('phone'))return;if(!PHONE.models[CHAR.cur]){toast('VOCÊ AINDA NÃO TEM CELULAR');return}if(!played||PL.dead||menuOpen||NAV.open||WARD.open||DEAL.open||TVM.on)return;if(TECH.open)closeTech();const el=phoneEl();PHONE.open=!PHONE.open;el.hidden=!PHONE.open;$('#phoneTouchClose').hidden=!PHONE.open;if(PHONE.open){for(const k in keys)keys[k]=false;PHONE.scr=PHONE.num?'dial':'home';PHONE.zone='keys';PHONE.k=4;initAudio();phoneDraw()}}
function phoneItems(){return PHONE.scr==='home'?['APPS','CFG']:PHONE.scr==='apps'?(CTOS.installed?['MSG','AGENDA','PAY','CTOS']:['MSG','AGENDA','PAY']):PHONE.scr==='incoming'?['ATENDER','RECUSAR']:PHONE.scr==='ctos'?ctosItems():PHONE.scr==='perfil'?profItems():PHONE.scr==='agenda'?phoneContacts():PHONE.scr==='msgs'?PHONE.msgs.map((_,i)=>i):PHONE.scr==='cfg'?['NOTIF','SILENT','FLASH']:PHONE.scr==='mate'?['SIM','NÃO']:[]}
function phoneNav(dx,dy){if(PHONE.zone==='keys'){let r=Math.floor(PHONE.k/3),c=PHONE.k%3;if(dy<0&&r===0){const it=phoneItems();if(it.length){PHONE.zone='scr';PHONE.si=(PHONE.scr==='home'||PHONE.scr==='mate'||PHONE.scr==='incoming')?Math.min(PHONE.si,1):it.length-1}return}r=clamp(r+dy,0,4);c=clamp(c+dx,0,2);PHONE.k=r*3+c}
 else{const it=phoneItems();if(PHONE.scr==='home'||PHONE.scr==='mate'||PHONE.scr==='incoming'){if(dx)PHONE.si=dx<0?0:1;if(dy>0){PHONE.zone='keys';PHONE.k=1}return}PHONE.si+=dy;if(PHONE.si>=it.length){PHONE.zone='keys';PHONE.k=1;PHONE.si=it.length-1}if(PHONE.si<0)PHONE.si=0;if(PHONE.scr==='msgs'&&PHONE.msgs[PHONE.si])PHONE.msgs[PHONE.si].read=true}}
function phoneDigit(d){if(PHONE.callT>0)return;if(PHONE.scr==='xfer'){if(/\d/.test(d)&&PHONE.amt.length<7&&!(PHONE.amt===''&&d==='0'))PHONE.amt+=d;return}if(PHONE.num.length<12)PHONE.num+=d;PHONE.scr='dial'}
function phoneBack(){if(PHONE.scr==='incoming'){callDecline();return}if(PHONE.scr==='xfer'){if(PHONE.amt){PHONE.amt=PHONE.amt.slice(0,-1);return}PHONE.scr='apps';PHONE.zone='scr';PHONE.si=2;return}if(PHONE.scr==='dial'&&PHONE.num){PHONE.num=PHONE.num.slice(0,-1);if(!PHONE.num)PHONE.scr='home';return}if(PHONE.scr==='agenda'){PHONE.scr='apps';PHONE.zone='scr';PHONE.si=1;return}if(PHONE.scr==='ctos'){PHONE.scr='apps';PHONE.zone='scr';PHONE.si=3;return}if(PHONE.scr==='msgs'){PHONE.scr='apps';PHONE.zone='scr';PHONE.si=0;return}if(PHONE.scr==='apps'){PHONE.scr='home';PHONE.zone='scr';PHONE.si=0;return}if(PHONE.scr==='cfg'){PHONE.scr='home';PHONE.zone='scr';PHONE.si=1;return}if(PHONE.scr==='perfil'){PHONE.scr='ctos';PHONE.zone='scr';PHONE.si=1;return}if(PHONE.scr!=='home'){PHONE.scr='home';PHONE.zone='keys';return}phoneToggle()}
function phoneOK(){if(PHONE.callT>0)return;if(PHONE.zone==='keys'){const k=PHONE_KEYS[PHONE.k];if(k==='TELA'){PHONE.scr='home';PHONE.zone='scr';PHONE.si=0;return}if(k==='APAGAR'){phoneBack();return}if(k==='LIGAR'){if(PHONE.scr==='xfer'){phoneXfer();return}if(PHONE.scr==='dial'&&PHONE.num){PHONE.callT=2.4;PHONE.scr='call';phoneRing()}else{PHONE.zone='scr';PHONE.si=0}return}phoneDigit(k);return}
 if(PHONE.scr==='home'){if(PHONE.si===0){PHONE.scr='apps';PHONE.si=0;PHONE.zone='scr'}else{PHONE.scr='cfg';PHONE.si=0;PHONE.zone='scr'}return}
 if(PHONE.scr==='incoming'){if(PHONE.si===0)callAnswer();else callDecline();return}
 if(PHONE.scr==='apps'){const k=phoneItems()[PHONE.si];if(k==='MSG'){PHONE.scr='msgs';PHONE.si=0;if(PHONE.msgs[0])PHONE.msgs[0].read=true}else if(k==='AGENDA'){PHONE.scr='agenda';PHONE.si=0;PHONE.zone='scr'}else if(k==='PAY'){PHONE.scr='xfer';PHONE.amt='';PHONE.zone='keys';PHONE.k=4}else if(k==='CTOS'&&CTOS.installed){PHONE.scr='ctos';PHONE.si=0;PHONE.zone='scr'}return}
 if(PHONE.scr==='agenda'){const c=phoneContacts()[PHONE.si];if(c){if(c.remote){remoteStart();PHONE.scr='apps';PHONE.zone='scr';PHONE.si=1}else{PHONE.num=c.number;PHONE.callT=2.4;PHONE.scr='call';PHONE.zone='keys';PHONE.k=13;phoneRing()}}return}
 if(PHONE.scr==='ctos'){ctosAct(ctosItems()[PHONE.si]);return}
 if(PHONE.scr==='perfil'){profAct(profItems()[PHONE.si]);return}
 if(PHONE.scr==='cfg'){const k=phoneItems()[PHONE.si];if(k==='NOTIF'){PHONE.notif=!PHONE.notif;PHONE.tipT=240+Math.random()*120;toast(PHONE.notif?'NOTIFICAÇÕES LIGADAS':'NOTIFICAÇÕES DESLIGADAS')}else if(k==='SILENT'){PHONE.silent=!PHONE.silent;toast(PHONE.silent?'CELULAR NO SILENCIOSO':'SILENCIOSO DESLIGADO')}else if(k==='FLASH'){PHONE.flash=!PHONE.flash;toast(PHONE.flash?'LANTERNA DO CELULAR LIGADA':'LANTERNA DO CELULAR DESLIGADA')}return}
 if(PHONE.scr==='mate'){const yes=PHONE.si===0;PHONE.scr='home';PHONE.zone='scr';PHONE.si=1;if(yes){const ok=phoneMateCall();if(ok&&PHONE.open)phoneToggle()}return}}
function phoneKey(e){const c=e.code;if(c==='Escape'||c==='KeyP'){phoneToggle();return}if(/^(Digit|Numpad)[0-9]$/.test(c)){phoneDigit(c.slice(-1));return}if(c==='NumpadMultiply')return phoneDigit('*');
 if(c==='Backspace')return phoneBack();if(c==='Enter'||c==='NumpadEnter'||c==='KeyE'||c==='Space')return phoneOK();
 if(c==='ArrowUp'||c==='KeyW')phoneNav(0,-1);else if(c==='ArrowDown'||c==='KeyS')phoneNav(0,1);else if(c==='ArrowLeft'||c==='KeyA')phoneNav(-1,0);else if(c==='ArrowRight'||c==='KeyD')phoneNav(1,0)}
function phoneWrap(g,txt,x,y,w,lh,max){txt=translatePlain(String(txt));const words=txt.split(' ');let line='',n=0;for(const wd of words){const t=line?line+' '+wd:wd;if(g.measureText(t).width>w&&line){g.fillText(line,x,y+n*lh);n++;line=wd;if(n>=max)return}else line=t}if(line&&n<max)g.fillText(line,x,y+n*lh)}
function phoneDraw(){const g=PHONE.cv;if(!g)return;PHONE.hits=[];const hit=(zone,i,x,y,w,h)=>PHONE.hits.push({zone,i,x,y,w,h});const M=phoneModel(),retro=M===PHONE_MODELS.retro,ios=M===PHONE_MODELS.ios,W=120,H=232;g.setTransform(3,0,0,3,0,0);g.clearRect(0,0,W,H);g.imageSmoothingEnabled=true;g.textAlign='left';g.textBaseline='top';
 const rr=(x,y,w,hh,r,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+hh,r);g.arcTo(x+w,y+hh,x,y+hh,r);g.arcTo(x,y+hh,x,y,r);g.arcTo(x,y,x+w,y,r);g.fill()};
 rr(0,0,W,H,retro?10:16,'#000');rr(2,2,W-4,H-4,retro?9:14,M.edge);rr(4,4,W-8,H-8,retro?8:12,M.body);
 g.fillStyle='rgba(255,255,255,.14)';g.fillRect(8,6,W-16,1);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(8,H-7,W-16,1);
 if(retro){g.fillStyle=M.edge;g.fillRect(84,0,10,6);g.fillStyle='#0a0f1e';g.fillRect(48,8,24,3)}else{g.fillStyle='#0a0a0e';g.fillRect(50,9,20,2);g.beginPath();g.arc(78,10,1.6,0,7);g.fill()}
 const sx=8,sy=16,sw=104,sh=112;rr(sx-1,sy-1,sw+2,sh+2,retro?2:6,'#000');rr(sx,sy,sw,sh,retro?2:5,M.scr);if(ios){g.fillStyle='#000';rr(44,sy,32,6,3,'#000')}
 g.fillStyle=M.txt;g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.textBaseline='top';const hh=Math.floor(DN.tod/60)%24,mm=Math.floor(DN.tod%60);g.fillText(String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'),sx+4,sy+3);
 if(PHONE.notif){for(let i=0;i<4;i++)g.fillRect(sx+sw-26+i*3,sy+9-i*2,2,2+i*2)}else{const ax=sx+sw-22,ay=sy+7.5;g.save();g.translate(ax,ay);g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,-6);g.quadraticCurveTo(1.3,-6,1.3,-3.5);g.lineTo(1.3,-1);g.lineTo(6,1.6);g.lineTo(6,2.8);g.lineTo(1.3,1.6);g.lineTo(1.1,4.2);g.lineTo(2.6,5.4);g.lineTo(2.6,6.2);g.lineTo(0,5.4);g.lineTo(-2.6,6.2);g.lineTo(-2.6,5.4);g.lineTo(-1.1,4.2);g.lineTo(-1.3,1.6);g.lineTo(-6,2.8);g.lineTo(-6,1.6);g.lineTo(-1.3,-1);g.lineTo(-1.3,-3.5);g.quadraticCurveTo(-1.3,-6,0,-6);g.fill();g.restore()}g.fillRect(sx+sw-12,sy+4,8,5);const un=phoneUnread();if(un){g.fillStyle=M.acc;g.fillRect(sx+52,sy+4,9,6);g.fillStyle=M.scr;g.fillRect(sx+53,sy+5,7,1);g.fillStyle=M.txt;g.fillText(String(un),sx+63,sy+3)}
 const foc=(i)=>PHONE.zone==='scr'&&PHONE.si===i,cx=sx+sw/2;g.textAlign='left';
 if(PHONE.scr==='home'){g.textAlign='center';g.font='bold 16px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'),cx,sy+18);
  /* r66: tela inicial com 2 ícones quadrados — APPS e CONFIG */
  const en=S.lang==='en';[[en?'APPS':'APPS',0],['CONFIG',1]].forEach(([t,i])=>{const w=38,x=sx+(sw/2-w-4)+i*(w+8),y=sy+40;hit('scr',i,x-2,y-2,w+4,w+16);const f=foc(i);
   rr(x,y,w,w,7,f?M.acc:(retro?'#000':'rgba(255,255,255,.14)'));if(retro&&!f)rr(x+1,y+1,w-2,w-2,6,M.scr);g.fillStyle=f?(retro?M.scr:'#000'):M.txt;
   if(i===0){for(let a=0;a<3;a++)for(let b=0;b<3;b++)g.fillRect(x+8+a*8,y+8+b*8,6,6)}else{g.font='bold 24px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('⚙',x+w/2,y+w/2-1)}
   if(i===0&&un){g.fillStyle='#ff4a4a';g.beginPath();g.arc(x+w-3,y+3,6,0,7);g.fill();g.fillStyle='#fff';g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(String(un),x+w-3,y+6)}
   g.fillStyle=M.txt;g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(t,x+w/2,y+w+10)});
  g.fillStyle=M.txt;g.globalAlpha=.7;g.font='bold 6px system-ui,"Segoe UI",Arial,sans-serif';g.fillText((PHONE.silent?'🔕 ':'')+'↑ TELA · NÚMEROS DISCAM',cx,sy+104);g.globalAlpha=1}
 else if(PHONE.scr==='apps'){g.textAlign='center';g.font='bold 9px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('APPS',cx,sy+18);g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';
  const L={MSG:'✉ MENSAGENS'+(un?' ('+un+')':''),AGENDA:'☏ AGENDA',PAY:'$ PIXel',CTOS:'◉ ctOS'};phoneItems().forEach((k,i)=>{const y=sy+38+i*14;hit('scr',i,sx+4,y-3,sw-8,13);if(foc(i)){g.fillStyle=M.acc;g.fillRect(sx+6,y-3,sw-12,12);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;g.fillText(L[k],cx,y)})}
 else if(PHONE.scr==='incoming'){g.textAlign='center';const C=CALL.cur;g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(translatePlain('CHAMADA RECEBIDA'),cx,sy+22);g.font='bold 10px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(C?C.num:'',cx,sy+40);
  g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';g.globalAlpha=.6+.4*Math.abs(Math.sin(simT*4));g.fillText('📞',cx,sy+56);g.globalAlpha=1;
  [[S.lang==='en'?'ANSWER':'ATENDER',0],[S.lang==='en'?'DECLINE':'RECUSAR',1]].forEach(([t,i])=>{const x=sx+12+i*48;hit('scr',i,x-4,sy+66,44,17);if(foc(i)){g.fillStyle=i?'#ff5a5a':'#3ddc84';g.fillRect(x-4,sy+68,44,13);g.fillStyle='#000'}else g.fillStyle=i?'#ff7a7a':'#3ddc84';g.fillText(t,x+18,sy+71)})}
 else if(PHONE.scr==='agenda'){g.textAlign='center';g.font='bold 9px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('☏ AGENDA',cx,sy+19);g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';
  const contacts=phoneContacts(),compact=contacts.length>4;
  contacts.forEach((c,i)=>{const y=sy+(compact?30+i*14:35+i*17);hit('scr',i,sx+4,y-3,sw-8,compact?14:17);if(foc(i)){g.fillStyle=M.acc;g.fillRect(sx+5,y-3,sw-10,compact?13:15);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;g.fillText(c.remote?'BOMBA REMOTA · '+REMOTE.list.length:c.name+' · '+c.number,cx,y)});
  g.fillStyle=M.txt;g.globalAlpha=.7;g.font='bold 6px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('SELECIONE PARA LIGAR',cx,sy+102);g.globalAlpha=1}
 else if(PHONE.scr==='dial'||PHONE.scr==='call'){g.textAlign='center';g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(PHONE.scr==='call'?'CHAMANDO…':'DISCAR',cx,sy+20);g.font='bold 14px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(PHONE.num||'_',cx,sy+44);g.font='bold 6.5px system-ui,"Segoe UI",Arial,sans-serif';g.globalAlpha=.7;g.fillText(PHONE.scr==='call'?(PHONE.num==='190'?'POLÍCIA':PHONE.num==='192'?'AMBULÂNCIA':PHONE.num==='555'?'TÁXI':PHONE.num==='771'?'CLAIRE':PHONE.num==='770'?'NATHAN':''):'LIGAR para chamar',cx,sy+72);g.globalAlpha=1}
 else if(PHONE.scr==='msgs'){g.font='bold 6.5px system-ui,"Segoe UI",Arial,sans-serif';if(!PHONE.msgs.length){g.textAlign='center';g.fillText('SEM MENSAGENS',cx,sy+50)}else{const st=clamp(PHONE.si-1,0,Math.max(0,PHONE.msgs.length-3));
   for(let i=0;i<3&&st+i<PHONE.msgs.length;i++){const m=PHONE.msgs[st+i],y=sy+16+i*12;hit('scr',st+i,sx+3,y-2,sw-6,12);if(foc(st+i)){g.fillStyle=M.acc;g.fillRect(sx+3,y-2,sw-6,11)}g.fillStyle=foc(st+i)&&!retro?'#000':M.txt;g.fillStyle=m.kind==='mission'&&!foc(st+i)?'#ff7a3a':g.fillStyle;g.fillText((m.read?'  ':m.kind==='mission'?'! ':'• ')+translatePlain(m.txt).slice(0,20)+'…',sx+5,y)}
   const m=PHONE.msgs[clamp(PHONE.si,0,PHONE.msgs.length-1)];g.fillStyle=M.txt;g.fillRect(sx+4,sy+53,sw-8,1);phoneWrap(g,m.txt,sx+5,sy+57,sw-10,9,6)}}
 else if(PHONE.scr==='xfer'){const o=CHAR.list[1-CHAR.cur];g.textAlign='center';g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('$ PIXel',cx,sy+18);g.font='bold 6.5px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('PARA '+o.name,cx,sy+32);g.font='bold 14px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('$'+(PHONE.amt||'0'),cx,sy+50);g.font='bold 6.5px system-ui,"Segoe UI",Arial,sans-serif';g.globalAlpha=.75;g.fillText('SALDO $'+(PL.money||0),cx,sy+74);g.fillText('DIGITE · LIGAR ENVIA',cx,sy+86);g.fillText('APAGAR VOLTA',cx,sy+96);g.globalAlpha=1}
 else if(PHONE.scr==='mate'){g.textAlign='center';g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('☏ '+duoName(1-CHAR.cur),cx,sy+18);
  g.font='bold 7px system-ui,"Segoe UI",Arial,sans-serif';g.fillText(PROLOGUE.active&&PROLOGUE.stage==='sms'?'SMS PARA NATHAN?':'CHAMAR '+duoName(1-CHAR.cur),cx,sy+42);g.fillText(PROLOGUE.active&&PROLOGUE.stage==='sms'?'(sem nome)':'PARA CÁ?',cx,sy+53);
  [['SIM',0],['NÃO',1]].forEach(([t,i])=>{const x=sx+20+i*44;hit('scr',i,x-4,sy+66,36,17);if(foc(i)){g.fillStyle=M.acc;g.fillRect(x-4,sy+68,36,13);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;g.fillText(t,x+14,sy+71)})}
 else if(PHONE.scr==='ctos'){ctosDraw(g,M,sx,sy,sw,cx,hit,foc,retro)}
 else if(PHONE.scr==='perfil'){profDraw(g,M,sx,sy,sw,cx,hit,foc,retro)}
 else if(PHONE.scr==='cfg'){g.textAlign='center';g.font='bold 8px system-ui,"Segoe UI",Arial,sans-serif';g.fillText('⚙ CONFIG',cx,sy+18);const en=S.lang==='en',on=v=>v?'ON':'OFF';
  const L={NOTIF:(en?'TIPS ':'DICAS ')+on(PHONE.notif),SILENT:(en?'SILENT ':'SILENCIOSO ')+on(PHONE.silent),FLASH:(en?'FLASHLIGHT ':'LANTERNA ')+on(PHONE.flash)};
  g.font='bold 7.5px system-ui,"Segoe UI",Arial,sans-serif';phoneItems().forEach((k,i)=>{const y=sy+40+i*16;hit('scr',i,sx+4,y-4,sw-8,15);if(foc(i)){g.fillStyle=M.acc;g.fillRect(sx+6,y-4,sw-12,13);g.fillStyle=retro?M.scr:'#000'}else g.fillStyle=M.txt;g.fillText(L[k],cx,y)})}
 g.textAlign='center';g.textBaseline='middle';
 for(let i=0;i<15;i++){const r=Math.floor(i/3),c=i%3,x=11+c*34,y=136+r*18,w=30,hh2=15,f=PHONE.zone==='keys'&&PHONE.k===i;hit('keys',i,x-2,y-1,w+4,hh2+3);
  if(retro){rr(x,y,w,hh2,6,'#000');rr(x+1,y+1,w-2,hh2-2,5,f?M.acc:M.key)}else{rr(x,y,w,hh2,4,f?M.acc:M.key);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+2,y+1,w-4,1)}
  const t=PHONE_KEYS[i];g.fillStyle=retro?'#1a1a1a':f?'#000':'#e8eef4';if(i===13)g.fillStyle=f?'#000':'#3ddc84';if(i===14)g.fillStyle=f?'#000':'#ff5a5a';g.font=(t.length>1?'bold 6.5px':'bold 9px')+' system-ui,"Segoe UI",Arial,sans-serif';g.fillText(t==='TELA'?'▲TELA':t,x+w/2,y+hh2/2+1)}}
function phoneXfer(){const n=+PHONE.amt||0,o=CHAR.list[1-CHAR.cur];if(!n){toast('DIGITE O VALOR');clang(.1);return}if(n>(PL.money||0)){toast('SALDO INSUFICIENTE · $'+(PL.money||0));clang(.1);return}
 money(-n);o.cash=(o.cash||0)+n;o.pixIn=(o.pixIn||[]);o.pixIn.push({from:CHAR.list[CHAR.cur].name,n});PHONE.amt='';toast('PIXel · $'+n.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+' PARA '+o.name);clang(.3);PHONE.scr='apps';PHONE.zone='scr';PHONE.si=2}
function phoneTone(ok){if(!AC||!S.sound)return;const t=AC.currentTime,seq=ok?[[880,0],[1320,.13]]:[[300,0],[220,.18],[160,.36]];for(const[f,d] of seq){const o=AC.createOscillator(),g=AC.createGain();o.type=ok?'sine':'square';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(ok?.09:.05,t+d+.01);g.gain.linearRampToValueAtTime(0,t+d+(ok?.12:.16));o.connect(g);g.connect(master);o.start(t+d);o.stop(t+d+.2)}}
function phoneBusy(){if(!AC||!S.sound)return;const t=AC.currentTime;for(let k=0;k<4;k++)for(const f of [480,620]){const o=AC.createOscillator(),g=AC.createGain(),d=k*.5;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.03,t+d+.02);g.gain.setValueAtTime(.03,t+d+.24);g.gain.linearRampToValueAtTime(0,t+d+.27);o.connect(g);g.connect(master);o.start(t+d);o.stop(t+d+.3)}}
function phoneRing(){if(!AC||!S.sound)return;const t=AC.currentTime;for(const f of [440,480]){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.03);g.gain.setValueAtTime(.035,t+.42);g.gain.linearRampToValueAtTime(0,t+.46);o.connect(g);g.connect(master);o.start(t);o.stop(t+.5)}}
// v276: a confirmação da ligação é uma tela do próprio telefone, idêntica ao SIM/NÃO de CONFIG.
// Reaproveita DUO.follow e duoTick (inclusive embarque automático), sem gerar novo sistema de NPC.
function phoneMateCall(){if(prologueCall())return true;
 const ix=1-CHAR.cur,name=duoName(ix);
 if(!played||PL.dead||!running||SWITCH.on||CAMHOP.on||HAZE.switching||INVERT.switching||TIMEJUMP.busy||TIMEJUMP.loading){toast('NÃO É POSSÍVEL CHAMAR '+name+' AGORA');return false}
 if(PL.inside||PL.heli||PL.taxi||PL.car?.t?.boat){toast('SAIA DO INTERIOR OU VEÍCULO ESPECIAL PARA CHAMAR '+name);return false}
 if(DUO.on||DUO.follow){toast(name+' JÁ ESTÁ COM VOCÊ');return false}
 // Apaga somente o representante temporário do outro personagem e o estado da posição antiga.
 duoWorldClear();if(SAFE.mate&&peds.includes(SAFE.mate))safeMateClear();
 const o=CHAR.list[ix];if(ix===0&&!o.look)o.look={...JASON_LOOK0};
 const px=PL.car?PL.car.x:PL.x,pz=PL.car?PL.car.z:PL.z;
 let x=px+2.5,z=pz+2.0;
 const offsets=[[2.5,2],[-2.5,2],[2.5,-2],[-2.5,-2],[3.5,0],[-3.5,0],[0,3.5],[0,-3.5]];
 for(const [dx,dz] of offsets){const tx=px+dx,tz=pz+dz;
  if(inWater(tx,tz)||riverZone(tx,tz))continue;
  if(query(tx,tz,.75).some(b=>!b.dead&&b.kind!=='pole'&&b.kind!=='tree'&&tx>b.x0-.5&&tx<b.x1+.5&&tz>b.z0-.5&&tz<b.z1+.5))continue;
  x=tx;z=tz;break}
 duoSpawnFollower(x,z);
 if(!DUO.follow||!DUO.ped){toast('NÃO FOI POSSÍVEL CHAMAR '+name);return false}
 o.st=null;toast(name+' CHEGOU');return true
}
function phoneDoCall(n){if(n==='300'&&ONLINE.on){phoneTone(netPvOrder());return}if(ONLINE.on&&/^8\d+$/.test(n)){phoneTone(netPhoneCall(+n.slice(1)));return}if(ONLINE.on&&(n==='770'||n==='771')){toast('CONTATO INDISPONÍVEL');phoneTone(false);return}if(n==='770'&&prologueCall())return;let ok=false;if(n==='1'){ok=remoteStart();phoneTone(ok);return}
 if(n==='771'||n==='770'){
  if((n==='771'&&CHAR.cur!==0)||(n==='770'&&CHAR.cur!==1)){toast('CONTATO INDISPONÍVEL');phoneTone(false);return}
  PHONE.scr='mate';PHONE.zone='scr';PHONE.si=1;phoneTone(true);return
 }if(POL.wanted&&(n==='190'||n==='192'||n==='555')){toast('LIGAÇÃO RECUSADA<br><small style="font-size:11px;color:#fff">ninguém atende quem está fugindo da polícia!</small>')}else if(n==='190')ok=svcCall('pol');else if(n==='192')ok=svcCall('amb');else if(n==='555'){if(PL.car||PL.heli)toast('SAIA DO VEÍCULO PARA PEGAR UM TÁXI');else{taxiCall(true);ok=!!TAXI.c}}else toast('NÚMERO '+n+' NÃO EXISTE');phoneTone(ok)}
// Serviços chamados pelo celular: vêm pelas ruas até você e encostam.
function svcSpawn(type){const pc=PL.car||PL;for(let k=0;k<80;k++){const a=Math.random()*6.283,dd=110+Math.random()*120,kx=clamp(Math.round((pc.x+Math.cos(a)*dd)/P),0,city.N),kz=clamp(Math.round((pc.z+Math.sin(a)*dd)/P),0,city.N),d=Math.floor(Math.random()*4);
  if(!canDrive(kx,kz,d))continue;const li=laneValid(kx,kz,d,0)?0:1,p=lanePt(kx,kz,d,li,P/2);if(inWater(p[0],p[1])||carsNear(p[0],p[1],8).length)continue;return makeVehicle(type,p[0],p[1],Math.atan2(D[d][1],D[d][0]),type==='van'?'#f4f4f0':type==='taxi'?'#f2c21a':'#ffffff')}return null}
function svcOk(t){toast(t);return true}
function svcCall(kind){if(S.style==='haze'){toast('SEM SINAL');return false}if(kind==='pol'&&POL.wanted){toast('A POLÍCIA JÁ ESTÁ ATRÁS DE VOCÊ');return false}if(vehicles.some(c=>c.svc&&c.svc.kind===kind)){toast(kind==='pol'?'A POLÍCIA JÁ ESTÁ A CAMINHO':'A AMBULÂNCIA JÁ ESTÁ A CAMINHO');return false}
 const c=svcSpawn(kind==='pol'?'police':'van');if(!c){toast('NINGUÉM ATENDEU');return false}if(kind==='amb'){c.ambulance=true;c.sirenOn=true}c.lightsOff=false;c.ai=null;c.sleep=false;c.hand=false;c.path=null;c.pathT=0;c.stuckT=0;c.revT=0;c.svc={kind,state:'go',t:0};
 return svcOk(kind==='pol'?'190 · POLÍCIA A CAMINHO<br><small style="font-size:11px;color:#fff">eles só perseguem se virem um crime</small>':'192 · AMBULÂNCIA A CAMINHO<br><small style="font-size:11px;color:#fff">fique perto dela quando chegar</small>')}
function svcAI(c,dt){const s=c.svc;if(!c.alive){c.svc=null;return}s.t+=dt;const p=PL.car||PL;
 if(s.state==='go'){const cp=s.cp||(s.cp=curbPoint(p.x,p.z));if(Math.hypot(cp[0]-p.x,cp[1]-p.z)>14)s.cp=null;if(taxiDrive(c,dt,cp[0],cp[1],6)||s.t>120){s.state='here';s.t=0;toast(s.kind==='pol'?'A POLÍCIA CHEGOU':'A AMBULÂNCIA CHEGOU')}}
 else{c.thr=0;c.hand=true;c.steerT=0;if(s.kind==='amb'&&s.state==='here'&&!PL.dead&&Math.hypot(PL.x-c.x,PL.z-c.z)<10){PL.hp=100;s.state='done';s.t=0;toast('PARAMÉDICO · VIDA 100');say(c,SAY.medic,3);clang(.25)}
  if(s.t>(s.kind==='pol'?30:45)){c.svc=null;c.sleep=false;if(s.kind==='amb'){c.lightsOff=true;c.sirenOn=false}}}}
// Loja de eletrônicos (shopping): celulares e headphone.
const TECH={open:false,el:null};
function openTech(mode){TECH.mode=mode||'tech';if(!TECH.el){const d=document.createElement('div');d.id='tech';d.className='card px';d.hidden=true;document.body.appendChild(d);TECH.el=d}TECH.el.dataset.store=TECH.mode;TECH.open=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();techPaint();TECH.el.hidden=false}
function closeTech(){TECH.open=false;if(TECH.el)TECH.el.hidden=true}
function techPaint(){if(TECH.mode==='bag'){bagPaint();return}const d=TECH.el,cur=PHONE.models[CHAR.cur],hp=WEAR_PAL.headphone.filter(Boolean);
 d.innerHTML='<div class="row"><h2 style="margin:0;font-family:var(--f-disp);font-size:16px;letter-spacing:.14em;color:var(--acc)">ELETRÔNICOS</h2><button class="btn" type="button" data-x="close" style="margin-left:auto">FECHAR [ESC]</button></div><h3 style="margin:10px 0 6px">CELULAR · '+CHAR.list[CHAR.cur].name+'</h3><div class="tgrid">'+
  Object.entries(PHONE_MODELS).map(([k,m])=>'<button class="btn" type="button" data-ph="'+k+'"'+(k===cur?' disabled':'')+'><span class="dot" style="background:'+m.body+';border-color:'+m.acc+'"></span>'+m.name+'<br><small>'+(k===cur?'EM USO':'$'+m.price)+'</small></button>').join('')+'</div><h3 style="margin:12px 0 6px">HEADPHONE · $150 <small style="color:var(--mute)">(ouve as rádios a pé · tire/ponha no guarda-roupa)</small></h3><div class="tgrid">'+
  hp.map(c=>{const own=wearOwned('headphone',c),on=PLAYER_PAL.headphone===c;return'<button class="btn" type="button" data-hp="'+c+'"'+(on?' disabled':'')+'><span class="dot" style="background:'+c+'"></span>'+(on?'USANDO':own?'COLOCAR':'$150')+'</button>'}).join('')+'<button class="btn" type="button" data-hp=""'+(PLAYER_PAL.headphone?'':' disabled')+'>TIRAR</button></div>';
 d.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.x==='close'){closeTech();return}
  if(b.dataset.ph){const m=PHONE_MODELS[b.dataset.ph];if((PL.money||0)<m.price){toast('DINHEIRO INSUFICIENTE · $'+m.price);clang(.1);return}money(-m.price);PHONE.models[CHAR.cur]=b.dataset.ph;prologuePhoneBought();toast('NOVO CELULAR · '+m.name+' · −$'+m.price);clang(.3)}
  else if(b.dataset.hp!==undefined){const c=b.dataset.hp||null;if(c&&!wearOwned('headphone',c)){if((PL.money||0)<150){toast('DINHEIRO INSUFICIENTE · $150');clang(.1);return}money(-150);WEAR_OWNED.headphone.push(c);toast('HEADPHONE COMPRADO · −$150<br><small style="font-size:11px;color:#fff">as rádios agora tocam a pé · Q troca de rádio</small>')}
   PLAYER_PAL.headphone=c;applyPlayerLook();charFaces()}techPaint()}))}
function bagPaint(){const d=TECH.el,cols=WEAR_PAL.bag.filter(Boolean),on=PLAYER_PAL.bag;
 d.innerHTML='<div class="row"><h2 style="margin:0;font-family:var(--f-disp);font-size:16px;letter-spacing:.14em;color:var(--acc)">MALAS & MOCHILAS CO.</h2><button class="btn" type="button" data-x="close" style="margin-left:auto">FECHAR [ESC]</button></div><h3 style="margin:10px 0 6px">MOCHILA · $500 <small style="color:var(--mute)">(munição até 1.500 balas por arma e 30 explosivos por tipo · sem ela: 150 e 3)</small></h3><div class="tgrid">'+
  cols.map(c=>{const own=wearOwned('bag',c),u=on===c;return'<button class="btn" type="button" data-bg="'+c+'"'+(u?' disabled':'')+'><span class="dot" style="background:'+c+'"></span>'+(u?'USANDO':own?'COLOCAR':'$500')+'</button>'}).join('')+'<button class="btn" type="button" data-bg=""'+(on?'':' disabled')+'>TIRAR</button></div><p style="margin:10px 0 0;color:var(--mute);font-size:15px">A laranja é só do paraquedas. Tire ou coloque também no guarda-roupa.</p>';
 d.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.x==='close'){closeTech();return}const c=b.dataset.bg||null;
  if(c&&!wearOwned('bag',c)){if((PL.money||0)<500){toast('DINHEIRO INSUFICIENTE · $500');clang(.1);return}money(-500);WEAR_OWNED.bag.push(c);toast('MOCHILA COMPRADA · −$500<br><small style="font-size:11px;color:#fff">munição até 1.500 por arma</small>');clang(.3)}
  PLAYER_PAL.bag=c;applyPlayerLook();charFaces();ammoClamp();bagPaint()}))}
function heliClear(){for(const h of HELI.list){if(h.o)heliDropModel(h);if(h.snd)heliSnd(h,false)}HELI.list=[];HELI.cur=null;if(typeof PL!=='undefined')PL.heli=null}
function heliDropModel(h){scene.remove(h.o.g);disposeGroup(h.o.g);h.o=null}
// Som do rotor anterior à nova sonoplastia: reutiliza o efeito de voo antigo (240 Hz / 16 Hz),
// sem o pulso quadrado de 650 Hz que acrescentava um ruido agudo.
function heliSound(){return skySound(true)}
function heliSnd(h,on){if(on){if(!h.snd){initAudio();h.snd=heliSound()}}else if(h.snd){try{h.snd.src.stop();if(h.snd.lfo)h.snd.lfo.stop();h.snd.g.disconnect()}catch(e){}h.snd=null}}
function heliSpawnAt(h){h.hp=undefined;h.o=skyHeli(h.police?'police':null);h.o.g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(h.o.g);h.x=h.pad.x;h.z=h.pad.z;h.yaw=h.pad.a;h.y=(Number.isFinite(h.pad.y)?h.pad.y:groundY(h.x,h.z))+.09+HELI_SK;h.v=0;h.state='parked';h.phase='ground';heliPose(h,0)}
function heliAddPad(x,z,a,id,police,y){const h={pad:{x,z,a,y},id,police:!!police};HELI.list.push(h);heliSpawnAt(h);return h}
function heliPose(h,dt,tx){const g=h.o.g,air=h.y-groundY(h.x,h.z)-HELI_SK;if(h.bobPh==null)h.bobPh=Math.random()*6.28;g.position.set(h.x,h.y+(h.phase!=='ground'&&air>2?Math.sin(simT*.9+h.bobPh)*.25:0),h.z);g.rotation.set(0,-h.yaw,0);
 if(h.state!=='parked'){h.tilt=(h.tilt||0)+((-.16*clamp(h.v/36,-.4,1))-(h.tilt||0))*Math.min(1,dt*3);h.bank=(h.bank||0)+(((tx||0)*.22)-(h.bank||0))*Math.min(1,dt*3);g.rotateZ(h.tilt);g.rotateX(h.bank);h.o.rot.rotation.y+=dt*30;h.o.tr.rotation.y+=dt*42}
 h.o.bl.visible=h.state!=='parked'&&Math.floor(simT*1.6)%2===0}
function heliNear(){if(PL.car||PL.dead||PL.inside||(PARA.active&&!PARA.active.roof)||PL.heli)return null;return HELI.list.find(h=>h.state==='parked'&&h.o&&Math.hypot(h.x-PL.x,h.z-PL.z)<5.5)||null}
function heliAct(){const h=HELI.cur;
 if(h){if(h.phase==='ground'){heliLeave();return true}
  if(h.phase==='down')return true;
  {const sh=shipAt(h.x,h.z);if(sh){const[lx,lz]=shipLocal(sh,h.x,h.z);if(lx<-SHIP_L/2+11||Math.abs(lz)>SHIP_W/2-2.5){toast('POUSE NO CONVÉS · CENTRALIZE NO NAVIO');return true}const c=shipContainerAt(sh,h.x,h.z,-.15),support=SEA_Y+(c?c.top:SHIP_DECK);if(support+HELI_SK>h.y-1){toast('CONTÊINER ALTO DEMAIS · SUBA MAIS');return true}h.landY=support+HELI_SK;h.roofC=null;h.onShip=sh;h.phase='down';toast(c?'POUSANDO NO CONTÊINER…':'POUSANDO NO CONVÉS…');return true}}
  if(inWater(h.x,h.z)){toast('NÃO DÁ PRA POUSAR NA ÁGUA');return true}
  {const b=bldAt(h.x,h.z);if(b){if(b.x1-b.x0<9||b.z1-b.z0<9||h.x<b.x0+3.5||h.x>b.x1-3.5||h.z<b.z0+3.5||h.z>b.z1-3.5){toast('TELHADO PEQUENO DEMAIS · CENTRALIZE');return true}if(roofTop(b)+HELI_SK>h.y-1){toast('PRÉDIO ALTO DEMAIS');return true}h.landY=roofTop(b)+HELI_SK;h.roofC=b}
   else{if(bldAt(h.x,h.z,4)){toast('SEM ESPAÇO PARA POUSAR AQUI');return true}h.landY=null;h.roofC=null}}
  h.phase='down';toast('POUSANDO…');return true}
 const n=heliNear();if(!n)return false;heliBoard(n);return true}
function heliBoard(h){if(PARA.active){paraTargetClear();PARA.active=null}if(!VIEW.tp){VIEW.tp=true;VIEW.tpz=1}GUN.firing=false;if(typeof WHL!=='undefined'&&WHL.open==='wpn')wheelClose(false);HELI.cur=h;PL.heli=h;h.state='player';h.phase='ground';h.v=0;PL.sp.visible=false;PL.sh.visible=false;PL.vx=PL.vz=0;heliSnd(h,true);
 toast('HELICÓPTERO<br><small style="font-size:11px;color:#fff">TECLADO: ↑/↓ acelera · ←/→ vira · E pousa · ESPAÇO salta<br>CONTROLE: R2 decola/acelera · L2 freia · ANALÓG. ESQ. vira · Y pousa · X salta</small>')}
function heliLeave(){const h=HELI.cur;if(!h)return;HELI.cur=null;PL.heli=null;h.state='parked';h.v=0;heliSnd(h,false);
 const hp=city.safeHelipad;if(hp&&h.phase==='ground'&&Math.hypot(h.x-hp.x,h.z-hp.z)<hp.r-1){h.pad={x:hp.x,z:hp.z,a:h.yaw};h.safeHome=true;h.noReturn=true;h.noRespawn=true;h.leftAt=null}
 const sx=-Math.sin(h.yaw),sz=Math.cos(h.yaw);let ox=h.x+sx*3.6,oz=h.z+sz*3.6;if(inWater(ox,oz)){ox=h.x-sx*3.6;oz=h.z-sz*3.6}
 if(h.onShip&&h.landY>SEA_Y+SHIP_DECK+HELI_SK+.5){
  const top=shipContainerAt(h.onShip,h.x,h.z);if(top){const f=h.onShip.f,[ux,uz]=shipLocal(h.onShip,h.x+sx*.85,h.z+sz*.85),u=clamp(ux,top.x0+.5,top.x1-.5),v=clamp(uz,top.z0+.5,top.z1-.5);ox=f.cx+u*f.hx-v*f.hz;oz=f.cz+u*f.hz+v*f.hx}else{ox=h.x+sx*.85;oz=h.z+sz*.85}}
 PL.x=ox;PL.z=oz;PL.gy=h.onShip&&h.landY>SEA_Y+SHIP_DECK+HELI_SK+.5?h.landY-HELI_SK:groundY(ox,oz);PL.jy=PL.jv=0;PL.vx=PL.vz=0;PL.sp.visible=true;PL.sh.visible=true;camT.x=PL.x;camT.z=PL.z;heliPose(h,0);if(h.roofC){PL.x=h.x+sx*3;PL.z=h.z+sz*3;standOnRoof(h.roofC)}}
function heliJump(){const h=HELI.cur;HELI.cur=null;PL.heli=null;heliSnd(h,false);h.state='falling';h.fvx=Math.cos(h.yaw)*h.v*.8;h.fvz=Math.sin(h.yaw)*h.v*.8;h.fvy=0;h.spin=1.5+Math.random();
 PL.x=h.x-Math.cos(h.yaw)*1.5;PL.z=h.z-Math.sin(h.yaw)*1.5;PL.gy=h.y-2.5;PL.jy=PL.jv=0;PL.sp.visible=true;
 PARA.active={roof:false,s:null,g:null,target:{x:1e9,z:1e9},heading:h.yaw,glideSpeed:Math.max(3,Math.min(8,h.v*.25)),pitch:0,bank:0,vx:0,vz:0,sink:2};
 toast('PARAQUEDAS ABERTO<br><small style="font-size:11px;color:#fff">← → direção · ↓ planar · ↑ descer mais rápido</small>')}
function heliPlayer(dt){const h=HELI.cur;if(!h)return false;if(POL.wanted&&(POL.level||1)<3&&h.phase!=='ground')wantedUp(3);if(PL.dead){heliLeave();return false}
 const tx=clamp(((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+PAD.lx,-1,1),ty=clamp(((keys.KeyW||keys.ArrowUp)?1:0)-((keys.KeyS||keys.ArrowDown)?1:0)-PAD.ly+PAD.r2-PAD.l2,-1,1);const gY=h.landY!=null?h.landY:groundY(h.x,h.z)+HELI_SK;
 if(h.phase==='ground'){h.v=0;h.y=gY;if(ty>.3){h.phase='up';toast('DECOLANDO…')}}
 else{if(h.phase==='up'){h.y+=13*dt;if(h.y>=HELI_ALT){h.y=HELI_ALT;h.phase='fly';h.landY=null;h.roofC=null}}
  else if(h.phase==='down'){h.y-=10*dt;h.v*=Math.exp(-dt*2.2);if(h.y<=gY){h.y=gY;h.phase='ground';h.v=0;toast('POUSOU<br><small style="font-size:11px;color:#fff">E desembarca · ↑ decola de novo</small>')}}
  if(h.phase!=='ground'){const k=h.phase==='fly'?1:.3;h.yaw+=tx*1.35*dt;const want=ty>0?ty*38*k:ty*10*k;h.v+=(want-h.v)*Math.min(1,dt*1.1);
   const E=city.ext,L=700;h.x=clamp(h.x+Math.cos(h.yaw)*h.v*dt,-L,E+L);h.z=clamp(h.z+Math.sin(h.yaw)*h.v*dt,-L,E+L)}
  if(keys.Space&&h.y>gY+14){keys.Space=false;heliJump();return true}}
 heliPose(h,dt,tx);if(h.snd)h.snd.g.gain.setTargetAtTime(menuOpen||!S.sound?0:.9,AC.currentTime,.2);
 PL.x=h.x;PL.z=h.z;PL.gy=h.y;PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;return true}
// v268: dica do heliponto da casa. Apenas contexto visual; nao mexer no
// sistema de sprites nem nas regras de armazenamento do helicoptero.
const SAFE_HELIPAD_HINT={pad:null,shown:false};
function safeHelipadHintTick(){
 const pad=city.safeHelipad;
 if(SAFE_HELIPAD_HINT.pad!==pad){SAFE_HELIPAD_HINT.pad=pad;SAFE_HELIPAD_HINT.shown=false}
 if(!pad||!played)return;
 const dist=Math.hypot(PL.x-pad.x,PL.z-pad.z);
 // Histerese para nao repetir a mensagem quando o jogador circula na borda.
 if(dist>14){SAFE_HELIPAD_HINT.shown=false;return}
 if(SAFE_HELIPAD_HINT.shown||dist>10||menuOpen||PL.dead||PL.inside||PL.car||PL.heli)return;
 // Qualquer helicoptero pousado no heliponto ocupa a vaga, nao apenas o salvo.
 const occupied=HELI.list.some(h=>h.o&&h.state!=='dead'&&h.phase==='ground'&&
  Math.hypot(h.x-pad.x,h.z-pad.z)<pad.r+0.5);
 if(occupied)return;
 SAFE_HELIPAD_HINT.shown=true;
 toast('VOCÊ PODE GUARDAR UM HELICÓPTERO AQUI','camwarn',6);
}
function heliFallTick(h,dt){h.fvy-=24*dt;h.y+=h.fvy*dt;h.x+=h.fvx*dt;h.z+=h.fvz*dt;h.fvx*=Math.exp(-dt*.3);h.fvz*=Math.exp(-dt*.3);h.yaw+=h.spin*dt;
  const g=h.o.g;g.position.set(h.x,h.y,h.z);g.rotation.set(0,-h.yaw,0);g.rotateZ(-.5);g.rotateX(Math.sin(simT*3)*.3);h.o.rot.rotation.y+=dt*8;
  if(Math.random()<dt*25)emit(h.x,h.y+.5,h.z,(Math.random()-.5)*2,1+Math.random()*2,(Math.random()-.5)*2,1.6,1.5,4,0x2a2626,false,.7);
  const gy=groundY(h.x,h.z);if(h.y<=gy+1.2){if(inWater(h.x,h.z)){for(let i=0;i<30;i++)emit(h.x,SEA_Y+.4,h.z,(Math.random()-.5)*7,3+Math.random()*6,(Math.random()-.5)*7,1,.7,.25,0xd8ecff,false,.9)}else{blastAt(h.x,h.z,null,true);shake=Math.max(shake,.9)}
   heliDropModel(h);h.state='dead';h.respawn=120;return true}
 return false;
}

function heliTick(dt){if(!city.ext)return;safeHelipadHintTick();for(const h of HELI.list){
 if(h.state==='falling')heliFallTick(h,dt); else if(h.state==='dead'){h.respawn-=dt;if(!h.noRespawn&&h.respawn<=0&&Math.hypot(PL.x-h.pad.x,PL.z-h.pad.z)>140)heliSpawnAt(h)}
 else if(h.state==='parked'&&h.o)h.o.bl.visible=false;
 else if(h.state==='idle'&&h.o)heliPose(h,dt,0)}}
function skyTick(dt){if(!city.ext)return;if(S.style==='haze'||S.style==='inverted'){for(const slot of SKY.slots)if(slot.o)skyDrop(slot);return}const pc=TVM.on?TVM.foc:(PL.car||PL);
 for(const slot of SKY.slots){const k=slot.kind,o=slot.o;if(!o){slot.t-=dt;if(slot.t<=0){slot.t=k==='heli'?60+Math.random()*90:80+Math.random()*120;skySpawn(slot)}continue}
  const st=o.v*dt;o.x+=o.dx*st;o.z+=o.dz*st;o.left-=st;const heli=k==='heli';o.g.position.set(o.x,o.y+(heli?Math.sin(simT*.8)*1.5:0),o.z);
  if(heli){o.rot.rotation.y+=dt*28;o.tr.rotation.y+=dt*40;o.g.rotation.z=-.08}o.bl.visible=Math.floor(simT*(heli?1.6:1.2))%2===0;
  if(o.snd){const d=Math.hypot(o.x-pc.x,o.z-pc.z,o.y-2),v=(heli?.32:.22)*Math.pow(clamp(1-d/(heli?700:1100),0,1),2)*(menuOpen?0:1)*(PL.inside&&!TVM.on?.25:1);o.snd.g.gain.setTargetAtTime(v,AC.currentTime,.3)}
  if(o.left<=0)skyDrop(slot)}}
/* ================= AVES: tres lotes instanciados, sem sombras ou texturas extras ================= */
const BIRDS={body:null,left:null,right:null,mat:null,flocks:[],clock:0,scan:0,get cap(){return MOB_LITE?12:24}};
function birdsClear(){for(const k of ['body','left','right']){const m=BIRDS[k];if(m){scene.remove(m);m.geometry.dispose();BIRDS[k]=null}}if(BIRDS.mat)BIRDS.mat.dispose();BIRDS.mat=null;BIRDS.flocks=[];BIRDS.clock=0;BIRDS.scan=0}
function birdWingGeometry(side){
 // Broad shoulder, swept tip and a notched trailing edge: a solid wing silhouette from below.
 const pts=[[.19,0,.10],[.28,.025,.43],[.05,.015,.89],[-.28,-.01,1.19],[-.16,-.02,.91],[-.34,-.015,.96],[-.23,-.01,.70],[-.39,0,.70],[-.29,.015,.39],[-.27,0,.10]],mb=new MB(),root=[-.02,.025,.24*side];
 for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],A=[a[0],a[1],a[2]*side],B=[b[0],b[1],b[2]*side],col=COL(i>=2&&i<=5?'#777a7b':'#eeeeea');mb.qa(root,A,B,B,col,[0,-2,0])}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(mb.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(mb.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(mb.c,3));return g;
}
function birdsInit(){
 birdsClear();const m=new MB(),sphere=new THREE.SphereGeometry(1,8,5).toNonIndexed(),beak=new THREE.ConeGeometry(1,1,5).toNonIndexed(),wh=COL('#f2f0e7');
 m.geo(sphere,mtx(0,0,0,.36,.14,.14),wh);m.geo(sphere,mtx(.30,.10,0,.16,.14,.12),wh);
 m.geo(beak,mtx(.49,.095,0,.075,.22,.065,0,0,-Math.PI/2),COL('#d9aa4a'));
 for(const side of [-1,1])m.geo(sphere,mtx(.365,.145,side*.105,.025,.025,.018),COL('#181a1b'));
 for(const side of [-1,1])m.qa([-.27,.03,0],[-.58,.02,side*.19],[-.52,.03,0],[-.52,.03,0],COL('#d9d7ce'),[0,-2,0]);
 sphere.dispose();beak.dispose();
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(m.p,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(m.n,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(m.c,3));
 BIRDS.mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 // Vistas de baixo (lado sem sol) as aves viravam silhuetas pretas: um pouco de luz própria na cor de cada ave mantém o tom.
 BIRDS.mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;','vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance + diffuseColor.rgb*.25;')};
 const geos=[geo,birdWingGeometry(1),birdWingGeometry(-1)];
 for(let i=0;i<3;i++){const mesh=new THREE.InstancedMesh(geos[i],BIRDS.mat,BIRDS.cap);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // r128: setColorAt cria o buffer de cor com mesh.count; com count=0 ele nascia vazio e todas as aves ficavam pretas.
  mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(BIRDS.cap*3).fill(1),3);mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=mesh.receiveShadow=false;mesh.layers.set(1);scene.add(mesh);BIRDS[['body','left','right'][i]]=mesh}
}
function birdCityRoute(pc){
 const N=city.N;for(let attempt=0;attempt<24;attempt++){
  let x=clamp(Math.round((pc.x+(Math.random()-.5)*220)/P),0,N),z=clamp(Math.round((pc.z+(Math.random()-.5)*220)/P),0,N),last=-1,path=[[x*P,z*P]];
  for(let k=0;k<9;k++){const dirs=[];for(let d=0;d<4;d++){const nx=x+D[d][0],nz=z+D[d][1];if(nx<0||nz<0||nx>N||nz>N||!segExists(x,z,d))continue;if(last>=0&&d===(last+2)%4)continue;dirs.push(d)}if(!dirs.length)break;const d=dirs[Math.floor(Math.random()*dirs.length)];x+=D[d][0];z+=D[d][1];last=d;path.push([x*P,z*P])}
  if(path.length>=5)return path;
 }return null;
}
function birdFlock(kind,pc){
 const f={kind,age:0,phase:Math.random()*6.283,speed:kind==='gull'?7+Math.random()*2:9+Math.random()*3,birds:[]};
 if(kind==='gull'){f.r=18+Math.random()*14;f.cx=pc.x+(Math.random()-.5)*170;f.cz=pc.z+(Math.random()-.5)*170;f.y=15+Math.random()*10}else{f.route=birdCityRoute(pc);if(!f.route)return null;f.t=0;f.y=22+Math.random()*9}
 const count=MOB_LITE?3:4+Math.floor(Math.random()*2);for(let i=0;i<count;i++)f.birds.push({back:i?1.6+i*.75:0,side:i?(i%2?1:-1)*(1+i*.38):0,phase:Math.random()*6.283,scale:kind==='gull'?.9+Math.random()*.16:.56+Math.random()*.12,col:COL(kind==='gull'?'#ffffff':['#c09a70','#cba882','#ab8a63'][Math.floor(Math.random()*3)])});return f;
}
const birdRoot=new THREE.Object3D(),birdJoint=new THREE.Object3D(),birdWingM=new THREE.Matrix4();
const BIRD_KEYS=['body','left','right'];
function birdsTick(dt){
 if(!BIRDS.body)return;BIRDS.clock+=dt;const hidden=S.style==='inverted'||S.style==='haze'||PL.inside&&!TVM.on,storm=BIRDS.storm=(WX.storm||0)>(BIRDS.storm?.3:.6);
 if(hidden||storm){for(const k of BIRD_KEYS)BIRDS[k].count=0;if(storm)BIRDS.flocks=[];return}
 const pc=TVM.on?TVM.foc:PL.car||PL;
 BIRDS.scan-=dt;if(BIRDS.scan<=0){BIRDS.scan=3;const max=MOB_LITE?2:4;
  if(BIRDS.flocks.length<max){const kind=Math.random()<.5?'gull':'city',f=birdFlock(kind,pc);if(f&&rainAt(f.kind==='gull'?f.cx:f.route[0][0],f.kind==='gull'?f.cz:f.route[0][1])<.08)BIRDS.flocks.push(f)}}
 let index=0;
 for(let j=BIRDS.flocks.length-1;j>=0;j--){const f=BIRDS.flocks[j];f.age+=dt;let x,z,y=f.y,ux,uz,bank;
  if(f.kind==='gull'){const a=f.phase+f.age*f.speed/f.r,co=Math.cos(a),si=Math.sin(a);
   x=f.cx+co*f.r;z=f.cz+si*f.r*.55;ux=-si;uz=co*.55;const L=Math.hypot(ux,uz);ux/=L;uz/=L;bank=.16;
  }else{f.t+=f.speed*dt/P;if(f.t>=f.route.length-1){BIRDS.flocks.splice(j,1);continue}const p=riverBoatPose(f.route,f.t,RB_C.p);x=p.x;z=p.z;ux=p.ux;uz=p.uz;bank=Math.sin(f.age*.6+f.phase)*.055}
  if(f.age>95||Math.hypot(x-pc.x,z-pc.z)>340){BIRDS.flocks.splice(j,1);continue}
  if(rainAt(x,z)>.08){BIRDS.flocks.splice(j,1);continue}
  const visible=Math.hypot(x-camera.position.x,z-camera.position.z)<290;
  for(const b of f.birds){if(!visible||index>=BIRDS.cap)continue;const phase=BIRDS.clock*(f.kind==='gull'?5.5:10)+b.phase,glide=f.kind==='gull'&&Math.sin(BIRDS.clock*.42+f.phase)>.25,flap=glide?.08:Math.sin(phase)*.58;
   birdRoot.position.set(x-ux*b.back-uz*b.side,y+Math.sin(f.age*.7+b.phase)*.45,z-uz*b.back+ux*b.side);birdRoot.rotation.set(0,-Math.atan2(uz,ux),bank);birdRoot.scale.setScalar(b.scale);birdRoot.updateMatrix();
   BIRDS.body.setMatrixAt(index,birdRoot.matrix);BIRDS.body.setColorAt(index,b.col);
   for(let wi=0;wi<2;wi++){const key=wi?'right':'left',side=wi?-1:1;birdJoint.rotation.set(side*flap,0,0);birdJoint.updateMatrix();birdWingM.multiplyMatrices(birdRoot.matrix,birdJoint.matrix);BIRDS[key].setMatrixAt(index,birdWingM);BIRDS[key].setColorAt(index,b.col)}index++;
  }
 }
 for(const k of BIRD_KEYS){const m=BIRDS[k];m.count=index;if(index){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}}
}
/* ================= EVENTO: perseguição policial aleatória ================= */
const EVT={t:150,cars:[],life:0,shotT:0};
function evtInit(){evtEnd();EVT.t=90+Math.random()*90}
function evtEnd(){EVT.ending=true;try{evtEnd0()}finally{EVT.ending=false}}
function evtEnd0(){for(const c of EVT.cars)if(vehicles.includes(c)&&c!==PL.car&&c!==PL.lastCar){if(c.target)c.target=null;removeVehicle(c)}else if(c){c.target=null;c.chase=false}EVT.cars=[]}
function evtSpawn(ctr,minD,maxD){const type=pick2(['sedan','sports','hatch','sedan','suv']);
 for(let k=0;k<90;k++){const a=Math.random()*6.283,dd=minD+Math.random()*(maxD-minD),kx=clamp(Math.round((ctr.x+Math.cos(a)*dd)/P),0,city.N),kz=clamp(Math.round((ctr.z+Math.sin(a)*dd)/P),0,city.N),d=Math.floor(Math.random()*4);
  if(!canDrive(kx,kz,d))continue;const li=laneValid(kx,kz,d,0)?0:1;const p=lanePt(kx,kz,d,li,P/2+6);if(inWater(p[0],p[1])||carsNear(p[0],p[1],10).length)continue;
  const ang=Math.atan2(D[d][1],D[d][0]),cr=makeVehicle(type,p[0],p[1],ang,pick2(['#c82020','#202020','#e8e8e8','#2a2a6a','#d8a020']));cr.ai={kx,kz,d,li,nd:null,vmax:24+Math.random()*7,stun:0,blockT:0,ignore:0};cr.crim=true;cr.evt=true;cr.hp=100;cr.sleep=false;cr.vx=Math.cos(ang)*10;cr.vz=Math.sin(ang)*10;
  const bx=p[0]-Math.cos(ang)*15,bz=p[1]-Math.sin(ang)*15;if(inWater(bx,bz)||groundY(bx,bz)!==0){removeVehicle(cr);continue}
  const cop=makeVehicle('police',bx,bz,ang);cop.sleep=false;cop.vx=Math.cos(ang)*9;cop.vz=Math.sin(ang)*9;startChase(cop);cop.target=cr;cop.evt=true;
  EVT.cars=[cr,cop];EVT.life=150;EVT.shotT=2;EVT.returnT=1;EVT.reinforceT=4;EVT.desired=1;return cr}return null}
function eventShoot(from,target,minDamage,maxDamage,listener){
 const origin=new THREE.Vector3(from.x,from.gy+1.05,from.z);
 const aim=new THREE.Vector3(target.x+(Math.random()-.5),target.gy+.85,target.z+(Math.random()-.5));
 const direction=aim.clone().sub(origin),distance=direction.length();direction.normalize();
 const hit=rayHit(origin,direction,distance+2,from,null);
 tracer(origin,hit.pt,from.police?0xffe08a:0xff865c);
 gunSound(Math.max(.03,1-Math.hypot(from.x-listener.x,from.z-listener.z)/120),.9);
 if(hit.car===target&&Math.random()<.72){target.hp-=minDamage+Math.random()*(maxDamage-minDamage);if(target.hp<=0&&target.alive)setOnFire(target)}
}
function evtTick(dt){if(!city.ext||city.haze)return;const pc=TVM.on?TVM.foc:(PL.car||PL);
 if(TVM.on&&TVM.kind==='chase'&&!EVT.cars.length){TVM.re=(TVM.re||0)-dt;if(TVM.re<=0){TVM.re=1.5;const cr=evtSpawn(TVM.foc,40,140);if(cr){EVT.life=9999;EVT.deadT=0}}return}
 if(!EVT.cars.length){if(TVM.on||POL.wanted||MIS.type||PL.inside||PL.dead)return;EVT.t-=dt;if(EVT.t<=0){EVT.t=150+Math.random()*150;if(Math.random()<.65)evtSpawn(pc,140,240)}return}
 const cr=EVT.cars[0];EVT.life-=dt;
 if(TVM.on&&cr&&vehicles.includes(cr)&&!cr.alive){EVT.deadT=(EVT.deadT||0)+dt;if(EVT.deadT<6)return}
 if(!cr||!vehicles.includes(cr)||!cr.alive||cr===PL.car){evtEnd();return}
 const cops=EVT.cars.slice(1).filter(c=>vehicles.includes(c)&&c.alive&&c!==PL.car);
 for(const cop of EVT.cars.slice(1)){
  if(!cop.alive&&!cop.eventLossCounted){cop.eventLossCounted=true;EVT.desired=Math.min(3,(EVT.desired||1)+1)}
 }
 EVT.reinforceT=(EVT.reinforceT||0)-dt;
 if(cops.length<(EVT.desired||1)&&EVT.reinforceT<=0){
  EVT.reinforceT=4;
  const cop=spawnPoliceCar(90,160,cr);
  if(cop){startChase(cop);cop.target=cr;cop.evt=true;cop.lightsOff=false;EVT.cars.push(cop)}
 }
 EVT.shotT-=dt;EVT.returnT=(EVT.returnT||0)-dt;
 if(EVT.shotT<=0){
  EVT.shotT=.65+Math.random()*.6;
  for(const cop of cops)if(Math.hypot(cr.x-cop.x,cr.z-cop.z)<32)eventShoot(cop,cr,6,12,pc);
 }
 if(EVT.returnT<=0&&cops.length){
  EVT.returnT=.65+Math.random()*.7;
  const target=cops.reduce((a,b)=>Math.hypot(a.x-cr.x,a.z-cr.z)<Math.hypot(b.x-cr.x,b.z-cr.z)?a:b);
  if(Math.hypot(cr.x-target.x,cr.z-target.z)<38)eventShoot(cr,target,8,15,pc);
 }

 const far=EVT.cars.every(c=>!vehicles.includes(c)||Math.hypot(c.x-pc.x,c.z-pc.z)>430);if((far&&!TVM.on)||EVT.life<=0)evtEnd()}
/* ================= v77: eventos aleatórios de pedestres =================
 Sorteio a cada 40–70 s (só um evento por vez):
  - tiroteio entre pedestres ........ 7%  (um ped atira em outro, foge; os demais correm)
  - roubo de carro testemunhado ..... 15% (ped corre pra rua, tira o motorista e foge; 35% com polícia atrás)
 Gatilho próprio:
  - roubo do carro do jogador ....... 50% por parada (carro de luxo parado na rua ≥6 s; recarga 90 s)
 Reação do motorista quando o JOGADOR rouba um carro (exceto picape, que já tinha tiros):
  - foge 55% · corre atrás pra tomar o carro de volta 25% · saca arma 20% */
const PEDEV={t:45,stopT:0,rolled:false,jackCool:60,cur:null,ret:[],go:[],
 P:{shoot:.07,witness:.15,playerJack:.5,flee:.55,retake:.25}};
const PEDEV_LUX=new Set(['sports','super','conv','roadster']);
function pedevOK(){return running&&played&&!menuOpen&&!PL.inside&&!PL.dead&&!TVM.on&&!MIS.type&&!PL.heli&&!PL.taxi&&city.ext&&!city.haze&&S.style!=='inverted'&&S.style!=='haze'&&S.peds>0&&!TIMEJUMP.busy&&!prologueLocked()&&!STORYINTRO.active}
function pedevFree(x,z){if(inWater(x,z))return false;for(const b of query(x,z,1))if(!b.dead&&x>b.x0-.45&&x<b.x1+.45&&z>b.z0-.45&&z<b.z1+.45)return false;return true}
function pedevLine(x0,z0,x1,z1){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/1.5);for(let i=1;i<n;i++)if(!pedevFree(x0+(x1-x0)*i/n,z0+(z1-z0)*i/n))return false;return true}
function pedevAmb(p){return p&&!p.fixed&&!p.cop&&!p.gang&&!p.demo&&!p.balcony&&!p.resPath&&!p.clubType&&p.tommy===undefined&&(p.fin===undefined||p.fin>=1)&&(p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze')}
function pedevRun(p,tx,tz,spd){const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz)||1;p.strip=null;p.state='flee';p.timer=2;p.rot=0;p.vx=dx/l*spd;p.vz=dz/l*spd;dropUmbrella(p);return l}
function pedevRelease(p,t){if(!p||!peds.includes(p))return;p.fixed=false;p.pedev=null;if(p.state!=='dead'){p.state='flee';p.timer=t||3}}
function pedevDoor(c,p){const ca=Math.cos(c.a),sa=Math.sin(c.a),lz=-(p.x-c.x)*sa+(p.z-c.z)*ca,s=lz>=0?1:-1,o=c.t.W/2+.55;return[c.x-sa*o*s,c.z+ca*o*s]}
function pedevSpeed(c){return Math.hypot(c.vx||0,c.vz||0)}
// carro sai em fuga com o ladrão ao volante (usa a mesma IA de faixa dos fugitivos)
function pedevDrive(c,pal,crim=true){if(!c||!c.alive)return false;if(c.mode==='rail')toPhys(c);c.rpal=pal||c.rpal;c.sleep=false;c.hand=false;c.keep=false;
 const vmax=crim?26+R2()*6:13+R2()*3;c.ai={kx:0,kz:0,d:0,li:0,nd:null,vmax,stun:0,blockT:0,ignore:0};c.crim=crim;c.pedevThief=crim;
 // fora de uma faixa (estacionado, calçada): sai acelerando reto até cair numa rua e então assume a IA
 if(!reacquire(c)){c.ai=null;c.pedevGo={t:7,vmax};PEDEV.go.push(c)}return true}
// tira o jogador do carro sem dano (só cai no chão por um instante)
function pedevEject(c){if(PL.car!==c)return;const ca=Math.cos(c.a),sa=Math.sin(c.a);
 for(const side of [-1,1,0]){const off=side===0?-(c.t.L/2+1):0,lzv=side*(c.t.W/2+.9),x=c.x+off*ca-lzv*sa,z=c.z+off*sa+lzv*ca,o={x,z};circleVsWorld(o,.4);if(Math.hypot(o.x-x,o.z-z)<.05||side===0){PL.x=o.x;PL.z=o.z;break}}
 c.thr=0;c.steerT=0;PL.lastCar=c;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;PL.vx=-sa*2;PL.vz=ca*2;PL.jy=PL.jv=0;PL.down=1.4;PL.rot=Math.PI/2;
 $('#speed').hidden=true;$('#carbar').hidden=true;rumble(.35,.6,140)}
function pedevGun(p,tgt,ear){const o=new THREE.Vector3(p.x,(p.gy||0)+1.2,p.z),d=new THREE.Vector3(tgt.x-p.x+(R2()-.5)*.3,0,tgt.z-p.z+(R2()-.5)*.3).normalize();
 const end=new THREE.Vector3(tgt.x,(tgt.gy||0)+1,tgt.z);tracer(o,end,0xff9a5c);emit(o.x+d.x*.6,o.y,o.z+d.z*.6,0,.4,0,.08,.5,.1,0xffd070,true,1);
 gunSound(Math.max(.06,1-Math.hypot(p.x-ear.x,p.z-ear.z)/70),.95);p.mx=d.x;p.mz=d.z}
function pedevShoot(){const f=PL.car||PL,c=peds.filter(p=>pedevAmb(p)&&(d=>d>10&&d<40)(Math.hypot(p.x-f.x,p.z-f.z)));
 for(const a of c.sort(()=>R2()-.5)){const b=c.find(q=>q!==a&&(d=>d>2.5&&d<13)(Math.hypot(q.x-a.x,q.z-a.z))&&pedevLine(a.x,a.z,q.x,q.z));if(!b)continue;
  a.fixed=true;a.strip=null;a.state='flee';a.timer=99;a.vx=a.vz=0;a.pedev='shoot';dropUmbrella(a);say(a,['Eu avisei!','Você vai pagar!','Acabou pra você!','Sabia que ia te achar!'],1.6);
  b.fixed=true;b.state='flee';b.timer=99;b.vx=b.vz=0;b.pedev='victim';b.mx=a.x-b.x;b.mz=a.z-b.z;
  PEDEV.cur={kind:'shoot',a,b,t:.9,shots:2+(R2()<.5?1:0),run:0};return true}
 return false}
function pedevWitness(){const f=PL.car||PL;
 const cars=vehicles.filter(c=>c.alive&&c!==PL.car&&c!==PL.lastCar&&(c.ai||c.mode==='rail')&&!c.police&&!c.crim&&!c.chase&&!c.evt&&!c.svc&&!c.taxiAI&&!c.ambulance&&!c.t.boat&&!c.t.hover&&!c.special&&!c.display&&!c.tempPark&&!c.weaponPanic&&!c.bench&&!c.vinylCar&&!(c.bedN>0)&&!(c.convN>0)&&!['bus','truck','moto','police','jetski','vortex','boat'].includes(c.type)&&(d=>d>16&&d<55)(Math.hypot(c.x-f.x,c.z-f.z)));
 for(const c of cars.sort(()=>R2()-.5).slice(0,6)){const ca=Math.cos(c.a),sa=Math.sin(c.a);
  for(const s of R2()<.5?[1,-1]:[-1,1]){const fwd=4+R2()*6,lat=c.t.W/2+5+R2()*3,x=c.x+ca*fwd-sa*lat*s,z=c.z+sa*fwd+ca*lat*s;
   if(!pedevFree(x,z)||Math.abs(groundY(x,z)-groundY(c.x,c.z))>.6||!pedevLine(x,z,c.x-sa*(c.t.W/2+.6)*s,c.z+ca*(c.t.W/2+.6)*s))continue;
   const pal=pick2(PED_PALS),p=spawnPed(null,{x,z,vx:0,vz:0,pal});if(!p)continue;p.fixed=true;p.pedev='thief';p.pal0=pal;
   if(c.mode==='rail')toPhys(c);c.ai=null;c.thr=0;c.hand=true;c.sleep=false;c.pedevHold=true;
   if(R2()<.6)say(p,['Desce! Desce!','Sai do carro!','Esse aqui é meu agora!'],1.8);
   PEDEV.cur={kind:'witness',p,c,t:12};return true}}
 return false}
function pedevPlayerJack(c){for(let k=0;k<24;k++){const a=R2()*6.283,d=10+R2()*7,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;
  if(!pedevFree(x,z)||Math.abs(groundY(x,z)-groundY(c.x,c.z))>.6||!pedevLine(x,z,c.x,c.z))continue;
  const pal=pick2(PED_PALS),p=spawnPed(null,{x,z,vx:0,vz:0,pal});if(!p)return false;p.fixed=true;p.pedev='jacker';p.pal0=pal;
  PEDEV.cur={kind:'pjack',p,c,t:10,x0:c.x,z0:c.z};return true}
 return false}
// chamada pelo enterExit quando o jogador rouba um carro com motorista
function pedevReact(drv,car){if(!drv)return;const r=R2();if(r<PEDEV.P.flee)return;drv.pal0=car.rpal;
 if(r<PEDEV.P.flee+PEDEV.P.retake){drv.fixed=true;drv.pedev='retake';PEDEV.ret.push({p:drv,c:car,t:14,wait:.7});setTimeout(()=>{if(peds.includes(drv))say(drv,['Devolve meu carro!','Volta aqui, ladrão!','Esse carro é meu!'],2)},700);return}
 drv.robberyGun=6+R2()*2;drv.robberyShootT=.6+R2()*.6;drv.robberyCar=car;setTimeout(()=>{if(peds.includes(drv))say(drv,['Vai levar bala!','Desce do meu carro!','Ninguém rouba meu carro!'],1.8)},500)}
function pedevPoliceAfter(c){if(EVT.cars.length||POL.wanted||R2()>.35)return;const cop=spawnPoliceCar(60,140,c);if(!cop)return;
 startChase(cop);cop.target=c;cop.evt=true;cop.lightsOff=false;c.evt=true;EVT.cars=[c,cop];EVT.life=110;EVT.shotT=2.5;EVT.returnT=1.5;EVT.reinforceT=6;EVT.desired=1}
function pedevEnd(){const e=PEDEV.cur;if(!e)return;PEDEV.cur=null;
 if(e.kind==='shoot'){pedevRelease(e.a,3);if(e.b&&peds.includes(e.b)&&e.b.state!=='dead')pedevRelease(e.b,4)}
 else{if(e.p&&peds.includes(e.p)){pedevRelease(e.p,4);if(e.c&&e.c.alive){const dx=e.p.x-e.c.x,dz=e.p.z-e.c.z,l=Math.hypot(dx,dz)||1;e.p.vx=dx/l*5;e.p.vz=dz/l*5}}
  if(e.kind==='witness'&&e.c&&e.c.alive&&e.c.pedevHold&&e.c!==PL.car){e.c.pedevHold=false;pedevDrive(e.c,null,false)}}}
function pedevTick(dt){
 const ok=pedevOK(),ear=PL.car||PL;
 for(let i=PEDEV.go.length-1;i>=0;i--){const c=PEDEV.go[i],g=c.pedevGo;if(!g||!c.alive||c===PL.car||c.ai||!vehicles.includes(c)){c.pedevGo=null;PEDEV.go.splice(i,1);continue}g.t-=dt;
  c.sleep=false;c.hand=false;c.steerT=0;c.thr=g.t>0?.75:0;if(g.t<=0){c.hand=true;c.pedevGo=null;PEDEV.go.splice(i,1);continue}
  const ai={kx:0,kz:0,d:0,li:0,nd:null,vmax:g.vmax,stun:0,blockT:0,ignore:0};c.ai=ai;if(reacquire(c)){c.pedevGo=null;PEDEV.go.splice(i,1)}else c.ai=null}
 // ---- dono tentando pegar o carro de volta
 for(let i=PEDEV.ret.length-1;i>=0;i--){const r=PEDEV.ret[i],p=r.p,c=r.c;r.t-=dt;r.wait-=dt;
  if(!peds.includes(p)||p.state==='dead'||p.state==='down'||!c.alive||!vehicles.includes(c)||r.t<=0||!ok){PEDEV.ret.splice(i,1);if(peds.includes(p)&&p.state!=='dead'){if(r.t<=0)say(p,['Ladrão!','Volta aqui!','Vou chamar a polícia!'],1.8);pedevRelease(p,3)}continue}
  if(r.wait>0)continue;const dp=pedevDoor(c,p),d=Math.hypot(dp[0]-p.x,dp[1]-p.z);
  if(d>48){PEDEV.ret.splice(i,1);pedevRelease(p,3);continue}
  if(d<1.5&&pedevSpeed(c)<2.6&&!c.ai){PEDEV.ret.splice(i,1);
   if(PL.car===c){pedevEject(c);toast('<span style="color:#ff8a3a">O DONO PEGOU O CARRO DE VOLTA!</span>')}
   else if(PL.lastCar===c)PL.lastCar=null;
   const pal=p.pal0;removePed(p);c.owned=false;pedevDrive(c,pal,false);continue}
  pedevRun(p,dp[0],dp[1],6.4)}
 if(!ok){if(PEDEV.cur)pedevEnd();PEDEV.stopT=0;return}
 PEDEV.jackCool-=dt;
 // ---- carro de luxo do jogador parado na rua
 const pc=PL.car;
 if(pc&&!PEDEV.cur&&PEDEV_LUX.has(pc.type)&&!pc.t.boat&&!pc.display&&!pc.vinylCar&&!pc.timeGlow&&!pc.special&&!(SAFE.cars||[]).includes(pc)&&!(DUO.on&&DUO.car===pc)&&!POL.wanted&&pedevSpeed(pc)<.8&&(pc.gy||0)<.6){
  PEDEV.stopT+=dt;if(PEDEV.stopT>6&&!PEDEV.rolled&&PEDEV.jackCool<=0){PEDEV.rolled=true;PEDEV.jackCool=90;if(R2()<PEDEV.P.playerJack)pedevPlayerJack(pc)}}
 else if(!pc||pedevSpeed(pc)>2){PEDEV.stopT=0;PEDEV.rolled=false}
 // ---- sorteio dos eventos de rua
 PEDEV.t-=dt;if(PEDEV.t<=0){PEDEV.t=40+R2()*30;if(!PEDEV.cur&&!POL.wanted){const r=R2();if(r<PEDEV.P.shoot)pedevShoot();else if(r<PEDEV.P.shoot+PEDEV.P.witness)pedevWitness()}}
 const e=PEDEV.cur;if(!e)return;e.t-=dt;
 if(e.kind==='shoot'){const a=e.a,b=e.b;
  if(!peds.includes(a)||a.state==='dead'||a.state==='down'){pedevEnd();return}
  if(e.shots>0){a.vx=a.vz=0;a.timer=99;if(b&&peds.includes(b)&&b.state!=='dead'){b.vx=b.vz=0;b.timer=99;a.mx=b.x-a.x;a.mz=b.z-a.z}
   if(e.t<=0){e.t=.32+R2()*.2;e.shots--;if(b&&peds.includes(b)){pedevGun(a,b,ear);if(b.state!=='dead'){b.fixed=false;b.pedev=null;killPed(b);b.vx=(b.x-a.x)*.6;b.vz=(b.z-a.z)*.6}}
    if(e.shots===0){for(const q of peds)if(q!==a&&q!==b&&!q.cop&&!q.fixed&&q.state!=='dead'&&q.state!=='down'&&Math.hypot(q.x-a.x,q.z-a.z)<28)panicPedFlee(q,a.x,a.z);
     const dx=a.x-ear.x,dz=a.z-ear.z,l=Math.hypot(dx,dz)||1;a.fixed=false;a.pedev=null;a.state='flee';a.timer=9;a.vx=dx/l*6.4;a.vz=dz/l*6.4;PEDEV.cur=null}}}
  else pedevEnd();return}
 const p=e.p,c=e.c;
 if(!peds.includes(p)||p.state==='dead'||p.state==='down'||!c||!c.alive||!vehicles.includes(c)||e.t<=0){pedevEnd();return}
 if(e.kind==='witness'){if(c===PL.car){pedevEnd();return}c.thr=0;c.hand=true;
  const dp=pedevDoor(c,p);if(pedevRun(p,dp[0],dp[1],6.6)<1.3){
   const ca=Math.cos(c.a),sa=Math.sin(c.a),lz=-(p.x-c.x)*sa+(p.z-c.z)*ca,s=lz>=0?-1:1,ox=c.x-sa*(c.t.W/2+.9)*s,oz=c.z+ca*(c.t.W/2+.9)*s;
   const drv=spawnPed(null,{x:ox,z:oz,vx:-sa*s*6.5,vz:ca*s*6.5,pal:c.rpal});if(drv){drv.timer=4.5;say(drv,SAY.jack)}
   const pal=p.pal0;removePed(p);PEDEV.cur=null;c.pedevHold=false;if(pedevDrive(c,pal,true))pedevPoliceAfter(c)}
  return}
 if(e.kind==='pjack'){
  if(PL.car!==c||Math.hypot(c.x-e.x0,c.z-e.z0)>4||pedevSpeed(c)>3){say(p,['Droga!','Escapou...','Fica pra próxima!'],1.6);pedevEnd();return}
  const dp=pedevDoor(c,p);if(pedevRun(p,dp[0],dp[1],7)<1.4){const pal=p.pal0;removePed(p);PEDEV.cur=null;pedevEject(c);
   toast('<span style="color:#ff4a4a">ROUBARAM SEU CARRO!</span>');pedevDrive(c,pal,true)}}
}
/* ================= r53 · OBRAS DE RUA (OBRA) =================
 Todo dia às 6h um trecho de rua (um lado de quarteirão = um segmento entre dois cruzamentos) é fechado para obra:
  1. a via fecha para o trânsito (canDrive/bfsNext/populate ignoram o segmento) e o GPS desvia;
  2. quando ninguém mais está passando ali (ou depois de 45 s), aparecem com fade: 5 cones em cada ponta atravessando a via,
     buraco aberto no asfalto (borda de terra + monte de terra) e 2–3 operários de roupa fluorescente em volta;
  3. v3 r16: fica o dia inteiro; quando o dia muda (obraDay) some com fade e outro trecho é sorteado.
 v3 r16: o miolo preto do buraco falha (BR_GLC) e é a entrada das Backrooms (brWorldTick → brFall); o beco com falha saiu.
 O trecho é sorteado pela seed + dia (igual para todos no online). Radar/mapa: faixa vermelha com pontilhado. Só no mundo moderno. */
const OBRA={key:null,seg:null,phase:'off',day:-1,a:0,t:0,grp:null,mats:[],peds:[],cols:[]};
function obraClosed(kx,kz,d){return !!OBRA.key&&segKey(kx,kz,d)===OBRA.key}
/* v3 r16: no online o DN.day de cada um conta desde que entrou (só a hora vem do servidor) → o dia da obra sai do relógio real
   (1 dia de jogo = 1440×GMIN s, igual ao gameTod do api.php; vira à meia-noite do jogo, fora do horário da obra) */
function obraDay(){return ONLINE.on?Math.floor(Date.now()/(1440000*GMIN)):(DN.day||0)}
function obraActiveHour(){return true} /* v3 r16: dia inteiro (antes 6h–18h) */
function obraPick(day){const N=city.N,rnd=mulberry32(((S.seed>>>0)^Math.imul(day+1,0x2c1b3c6d)^0x0b7a)>>>0),c=[];
 for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)for(const d of [0,1]){if(!segExists(kx,kz,d))continue;const bx=kx+D[d][0],bz=kz+D[d][1];if(bx<1||bz<1||bx>N-1||bz>N-1||kx<1||kz<1)continue;
  let ok=true;for(const t of [.2,.5,.8]){const x=kx*P+D[d][0]*P*t,z=kz*P+D[d][1]*P*t;if(inWater(x,z)||(typeof riverZone==='function'&&riverZone(x,z))||isRural(x-D[d][1]*(RW/2+3),z+D[d][0]*(RW/2+3))||isRural(x+D[d][1]*(RW/2+3),z-D[d][0]*(RW/2+3))){ok=false;break}} /* só rua de asfalto da cidade (nada de estrada de terra da roça) */
  if(ok&&city.isle){const q=city.isle.bridge;if(q&&((q[0]==='h'&&d===0&&kz===q[2])||(q[0]==='v'&&d===1&&kx===q[1])))ok=false}
  if(ok)c.push([kx,kz,d])}
 if(!c.length)return null;return c[Math.floor(rnd()*c.length)]}
function obraSegCars(){const g=OBRA.seg;if(!g)return 0;const [kx,kz,d]=g,ux=D[d][0],uz=D[d][1],x0=kx*P,z0=kz*P;let n=0;
 for(const c of vehicles){if(!c.alive||c===PL.car||c.net||(c.mode!=='rail'&&!c.ai))continue;const s=(c.x-x0)*ux+(c.z-z0)*uz,l=(c.x-x0)*-uz+(c.z-z0)*ux;if(s>RW/2-2&&s<P-RW/2+2&&Math.abs(l)<RW/2+1)n++}return n}
function obraMat(col,hex){const m=new THREE.MeshLambertMaterial({color:hex!==undefined?hex:COL(col),transparent:true,opacity:0,depthWrite:true});OBRA.mats.push(m);return m}
/* v3 r16: decalque do buraco. Canvas 512 px = OBRA_HOLE_M metros; +x do canvas = sentido da rua (lado do monte de terra). */
const OBRA_HOLE_M=6.4;
function obraJag(rnd,R,n,amp){const ph=[rnd()*6.283,rnd()*6.283,rnd()*6.283,rnd()*6.283],w=[.1+rnd()*.06,.06+rnd()*.05,.04+rnd()*.03,.025],pts=[];
 for(let i=0;i<n;i++){const t=i/n*6.283+(rnd()-.5)*.08,r=R*(1+w[0]*Math.sin(2*t+ph[0])+w[1]*Math.sin(3*t+ph[1])+w[2]*Math.sin(5*t+ph[2])+w[3]*Math.sin(9*t+ph[3]))+(rnd()-.5)*amp;pts.push([Math.cos(t)*r,Math.sin(t)*r])}return pts}
function obraPath(g,pts,cx,cy,k){g.beginPath();pts.forEach((q,i)=>{const x=cx+q[0]*(k||1),y=cy+q[1]*(k||1);i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath()}
function obraHoleMat(rnd){const N=512,c=cv(N,N),g=c.getContext('2d'),px=N/OBRA_HOLE_M,C=N/2,R=1.5*px;
 const edge=obraJag(rnd,R,56,R*.07);
 /* poeira de terra espalhada (mais para o lado do monte, +x) */
 for(let i=0;i<900;i++){const a=rnd()*6.283,r=R*(1+Math.pow(rnd(),1.8)*1.05),x=C+Math.cos(a)*r+(rnd()<.55?rnd()*R*.6:0),y=C+Math.sin(a)*r*.9;
  g.fillStyle='rgba('+(98+rnd()*30|0)+','+(70+rnd()*20|0)+','+(44+rnd()*14|0)+','+(.25+rnd()*.4).toFixed(2)+')';const s=1+rnd()*2.6;g.fillRect(x,y,s,s)}
 {const gr=g.createRadialGradient(C+R*.5,C,R*.6,C+R*.5,C,R*1.9);gr.addColorStop(0,'rgba(110,80,50,.28)');gr.addColorStop(1,'rgba(110,80,50,0)');g.fillStyle=gr;g.fillRect(0,0,N,N)}
 /* asfalto afundado/escuro logo em volta da borda */
 g.save();g.filter='blur(5px)';obraPath(g,edge,C,C,1.16);g.fillStyle='rgba(0,0,0,.26)';g.fill();g.restore();
 /* rachaduras saindo da borda para o asfalto, com galhos */
 const crack=(x,y,a,len,w)=>{g.lineWidth=w;g.strokeStyle='rgba(14,14,16,.72)';g.beginPath();g.moveTo(x,y);let L=0;
  while(L<len){const st=5+rnd()*9;a+=(rnd()-.5)*.9;x+=Math.cos(a)*st;y+=Math.sin(a)*st;L+=st;g.lineTo(x,y);if(rnd()<.12&&w>1)crack(x,y,a+(rnd()<.5?-1:1)*(.5+rnd()*.6),len*.4*rnd()+10,w*.6)}g.stroke()};
 const nc=7+(rnd()*5|0);for(let i=0;i<nc;i++){const q=edge[(rnd()*edge.length)|0],a=Math.atan2(q[1],q[0])+(rnd()-.5)*.6;crack(C+q[0]*.98,C+q[1]*.98,a,R*(.35+rnd()*.75),1.4+rnd()*1.4)}
 /* face cortada do asfalto (cinza claro, agregado exposto) */
 obraPath(g,edge,C,C);g.fillStyle='#6d6c69';g.fill();
 for(let i=0;i<260;i++){const q=edge[(rnd()*edge.length)|0],t=.9+rnd()*.1;g.fillStyle=rnd()<.55?'rgba(40,40,42,.6)':'rgba(170,166,158,.45)';g.fillRect(C+q[0]*t,C+q[1]*t,1+rnd()*2,1+rnd()*2)}
 /* parede de terra descendo (gradiente) + fundo escuro fora do centro */
 const wall=edge.map(q=>{const k=.955-rnd()*.04;return [q[0]*k,q[1]*k]}),ox=(rnd()-.5)*R*.18,oy=(rnd()-.5)*R*.18;
 obraPath(g,wall,C,C);{const gr=g.createRadialGradient(C+ox,C+oy,R*.25,C,C,R*.95);gr.addColorStop(0,'#1a120a');gr.addColorStop(.55,'#3e2a18');gr.addColorStop(1,'#6f5034');g.fillStyle=gr;g.fill()}
 g.save();obraPath(g,wall,C,C);g.clip();for(let i=0;i<700;i++){const a=rnd()*6.283,r=R*(.45+rnd()*.5),v=rnd();g.fillStyle=v<.5?'rgba(20,12,6,.45)':v<.8?'rgba(140,105,70,.4)':'rgba(150,150,146,.5)';const s=1+rnd()*3;g.fillRect(C+Math.cos(a)*r,C+Math.sin(a)*r,s,s)}
 /* sombra da borda caindo para dentro (lado de cima do canvas) */
 g.filter='blur(6px)';g.lineWidth=14;g.strokeStyle='rgba(0,0,0,.45)';obraPath(g,wall,C,C-5);g.stroke();g.restore();
 const pit=obraJag(rnd,R*.5,30,R*.08);OBRA.pit={pts:pit.map(q=>[q[0]/px,q[1]/px]),ox:ox/px,oy:oy/px};g.save();g.filter='blur(3px)';obraPath(g,pit,C+ox,C+oy);{const gr=g.createRadialGradient(C+ox,C+oy,0,C+ox,C+oy,R*.55);gr.addColorStop(0,'#030202');gr.addColorStop(.7,'#0b0805');gr.addColorStop(1,'#1c130b');g.fillStyle=gr;g.fill()}g.restore();
 /* lábio quebrado: contorno claro fino + dentes de asfalto entrando na terra */
 g.lineWidth=1.5;g.strokeStyle='rgba(185,180,170,.4)';obraPath(g,edge,C,C,1.005);g.stroke();
 const base=(STYLES[S.style]&&STYLES[S.style].asphalt)||'#46474b';
 for(let i=0;i<16;i++){const q=edge[(rnd()*edge.length)|0],t=rnd()<.6?.86+rnd()*.12:1.05+rnd()*.3,cx=C+q[0]*t,cy=C+q[1]*t,sz=3+rnd()*8,n=5+(rnd()*3|0);g.beginPath();
  for(let j=0;j<n;j++){const a=j/n*6.283,r=sz*(.6+rnd()*.5);j?g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.closePath();g.fillStyle=base;g.fill();g.lineWidth=1;g.strokeStyle='rgba(170,166,158,.6)';g.stroke()}
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;
 const m=new THREE.MeshStandardMaterial({map:t,roughness:.95,metalness:0,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});m.userData.obraDecal=true;OBRA.mats.push(m);return m}
/* monte de terra (v3 r27): icosfera INDEXADA (antes era não indexada: cada triângulo levava ruído próprio → facetado e rachado),
   ruído suave + torrões, base no chão sem aba; normais suaves; UV planar para a textura de terra (obraDirtTex); cor por vértice (mais escuro embaixo) */
function obraPileGeo(rnd){const g=icoIndexed(3),p=g.attributes.position,n=p.count,col=[],uv=[],ph=[rnd()*9,rnd()*9,rnd()*9,rnd()*9],v=new THREE.Vector3(),lumps=[];
 for(let i=0;i<5;i++){const a=rnd()*6.283,e=.15+rnd()*.6;lumps.push([Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e),.08+rnd()*.1])}
 for(let i=0;i<n;i++){v.fromBufferAttribute(p,i);let k=1+.13*Math.sin(v.x*3.1+ph[0])*Math.cos(v.z*2.7+ph[1])+.07*Math.sin(v.y*4.3+v.x*2+ph[2])+.035*Math.sin(v.x*9+v.z*7+ph[3]);
  for(const l of lumps){const d=v.x*l[0]+v.y*l[1]+v.z*l[2];if(d>.82)k+=l[3]*((d-.82)/.18)**2}
  v.multiplyScalar(k);v.x*=1.25;v.y=Math.max(0,v.y*.62+.1);p.setXYZ(i,v.x,v.y,v.z);
  const s2=.66+Math.min(.34,v.y*.6)+.05*Math.sin(v.x*11+ph[2])*Math.sin(v.z*13);col.push(s2,s2,s2);uv.push(v.x*.9,v.z*.9+v.y*.7)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingBox();return g}
/* terra solta: canvas 128 px (manchas, grãos, pedrinhas), repete */
function obraDirtTex(rnd){const c=cv(128,128),g=c.getContext('2d');g.fillStyle='#7a5636';g.fillRect(0,0,128,128);
 for(let i=0;i<900;i++){const v=rnd();g.fillStyle=v<.4?'rgba(60,40,22,.5)':v<.75?'rgba(150,112,72,.45)':'rgba(110,80,50,.6)';const s2=1+rnd()*2.5;g.fillRect(rnd()*128,rnd()*128,s2,s2)}
 for(let i=0;i<26;i++){const x=rnd()*128,y=rnd()*128,r=1.2+rnd()*2.6;g.fillStyle=rnd()<.5?'#8c8a84':'#6e6a62';g.beginPath();g.ellipse(x,y,r,r*.75,rnd()*3,0,6.283);g.fill();g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x-r*.4,y-r*.5,r*.6,r*.35)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
/* v3 r16: falha no miolo preto do buraco (entrada das Backrooms). Canvas pequeno redesenhado ~9×/s só perto do jogador. */
const OBRA_GL_M=2.1;
function obraGlitchMesh(){const c=cv(96,96),t=new THREE.CanvasTexture(c);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;
 const m=new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:true,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6});m.userData.obraDecal=true;OBRA.mats.push(m);
 const me=new THREE.Mesh(new THREE.PlaneGeometry(OBRA_GL_M,OBRA_GL_M),m);me.renderOrder=3;me.userData.obraDecal=true;OBRA.gl={cv:c,g:c.getContext('2d'),tex:t,t:0,on:-1};return me}
function obraGlitchTick(dt){const G=OBRA.gl,h=OBRA.hole;if(!G||!h||!OBRA.pit)return;G.t-=dt;if(G.t>0)return;G.t=.11;
 const near=!PL.inside&&Math.hypot(PL.x-h.x,PL.z-h.z)<90&&typeof brOK==='function'&&brOK(),g=G.g,N=96,k=N/OBRA_GL_M;
 if(!near){if(G.on){g.clearRect(0,0,N,N);G.tex.needsUpdate=true;G.on=0}return}G.on=1;
 g.clearRect(0,0,N,N);g.save();g.beginPath();OBRA.pit.pts.forEach((q,i)=>{const x=N/2+q[0]*k*.92,y=N/2+q[1]*k*.92;i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();g.clip();
 if(Math.random()<.82){const nb=3+(Math.random()*6|0);for(let i=0;i<nb;i++){g.globalAlpha=.45+Math.random()*.55;g.fillStyle=BR_GLC[(Math.random()*BR_GLC.length)|0];
   const y=Math.random()*N,hh=1+Math.random()*(Math.random()<.2?14:5),dx=(Math.random()-.5)*N*.5;g.fillRect(dx,y,N,hh)}
  if(Math.random()<.35){g.globalAlpha=.85;g.fillStyle='#f2dc72';g.fillRect(Math.random()*N*.6,Math.random()*N*.7,6+Math.random()*24,4+Math.random()*10)}
  for(let i=0;i<40;i++){g.globalAlpha=.7;g.fillStyle=BR_GLC[(Math.random()*BR_GLC.length)|0];g.fillRect(Math.random()*N,Math.random()*N,2,2)}}
 g.restore();G.tex.needsUpdate=true}
function obraBuild(){const [kx,kz,d]=OBRA.seg,ux=D[d][0],uz=D[d][1],nx=-uz,nz=ux,L=lineType(kx,kz,d),hw=L.t==='ave'?RW/2-.7:3.3,grp=new THREE.Group();
 const at=(s,l)=>[kx*P+ux*s+nx*l,kz*P+uz*s+nz*l],ang=Math.atan2(uz,ux),rnd=mulberry32(((S.seed>>>0)^(OBRA.day*7919)^0x51f)>>>0);
 const orange=obraMat(null,0xff6a10),white=obraMat(null,0xf4f4f0),black=obraMat(null,0x111114);
 const coneG=new THREE.ConeGeometry(.24,.72,12),baseG=new THREE.BoxGeometry(.5,.06,.5),bandG=new THREE.CylinderGeometry(.155,.19,.12,12);
 for(const s of [RW/2+2.2,P-RW/2-2.2])for(let i=0;i<5;i++){const l=-hw+(2*hw)*i/4,[x,z]=at(s,l),y=groundY(x,z),c=new THREE.Group();
  const b=new THREE.Mesh(baseG,black);b.position.y=.03;c.add(b);const k=new THREE.Mesh(coneG,orange);k.position.y=.39;c.add(k);const w=new THREE.Mesh(bandG,white);w.position.y=.42;c.add(w);c.position.set(x,y,z);grp.add(c)}
 /* buraco no meio do trecho, numa das faixas */
 const hs=P/2+(rnd()-.5)*10,hl=(rnd()<.5?-1:1)*Math.min(hw*.45,2.2),[hx,hz]=at(hs,hl),hy=groundY(hx,hz);
 /* v3 r16: buraco irregular pintado num decalque (canvas) por cima do asfalto: borda quebrada, terra, fundo escuro, rachaduras e cacos;
    o resto do decalque é transparente, então o asfalto de verdade vai até a borda. Monte de terra amassado (não é mais um cone). */
 const hr=mulberry32(((S.seed>>>0)^Math.imul(OBRA.day+3,0x6d2b79f5)^0x0b1e)>>>0),hm=obraHoleMat(hr),dec=new THREE.Mesh(new THREE.PlaneGeometry(OBRA_HOLE_M,OBRA_HOLE_M),hm);
 dec.rotation.x=-Math.PI/2;dec.rotation.z=Math.atan2(-uz,ux);dec.position.set(hx,hy+.045,hz);dec.renderOrder=2;dec.userData.obraDecal=true;grp.add(dec);
 {const gl=obraGlitchMesh();gl.position.set(OBRA.pit.ox,-OBRA.pit.oy,.004);dec.add(gl)}
 const [mx,mz]=at(hs+3.2,hl),pile=new THREE.Mesh(obraPileGeo(hr),obraMat(null,0xffffff));pile.material.vertexColors=true;pile.material.map=obraDirtTex(hr);pile.position.set(mx,groundY(mx,mz),mz);pile.scale.setScalar(.8);pile.rotation.y=hr()*6.283;grp.add(pile);
 /* v3 r27: colisão do monte (não tinha): 3 caixas ao longo do eixo comprido, do tamanho real; baixo o bastante para pular por cima */
 {const bb=pile.geometry.boundingBox,ex=bb.max.x*.8,ez=bb.max.z*.8,ht=bb.max.y*.8,ca=Math.cos(pile.rotation.y),sa=Math.sin(pile.rotation.y);
  for(const f of [-.55,0,.55]){const cx=mx+ca*ex*f,cz=mz-sa*ex*f,w=ez*(f?.72:.9),r=Math.max(w,ex*.4);OBRA.cols.push(Object.assign(addCol(cx-r,cz-r,cx+r,cz+r,'rock'),{low:ht*(f?.75:1)}))}}
 /* cacos de asfalto e torrões soltos em volta (poucos, baixos) */
 const chunkG=rockGeoMake(hr()*1e9,1,.2).scale(.16,.16,.16),clodG=rockGeoMake(hr()*1e9,1,.3).scale(.12,.12,.12),chunkM=obraMat(null,0x3c3d41),clodM=obraMat(null,0x6a4a2e);
 for(let i=0;i<9;i++){const isC=i<5,a=hr()*6.283,r=isC?1.75+hr()*.7:0,[px,pz]=isC?[hx+Math.cos(a)*r,hz+Math.sin(a)*r]:at(hs+3.2+(hr()-.5)*2.6,hl+(hr()-.5)*2.2),m=new THREE.Mesh(isC?chunkG:clodG,isC?chunkM:clodM);
  const k=.6+hr()*.9;m.scale.set(k*(1+hr()*.6),k*(isC?.35:.6),k);m.rotation.set(hr()*.4,hr()*6.283,hr()*.4);m.position.set(px,groundY(px,pz)+.03,pz);grp.add(m)}
 /* cavalete listrado ao lado do buraco */
 const [bx,bz]=at(hs-3,hl),bh=groundY(bx,bz),bar=new THREE.Group();for(const o of [-.9,.9]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.9,.08),white);leg.position.set(o,.45,0);bar.add(leg)}
 for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.45,.22,.06),i%2?white:orange);p.position.set(-.67+i*.45,.8,0);bar.add(p)}bar.position.set(bx,bh,bz);bar.rotation.y=-ang+Math.PI/2;grp.add(bar);
 grp.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=!!o.userData.obraDecal;o.frustumCulled=true}});
 (city.group||scene).add(grp);OBRA.grp=grp;OBRA.hole={x:hx,z:hz};
 /* operários: colete fluorescente e capacete */
 const n=2+(rnd()<.5?1:0),vests=['#d8ff2a','#ff7a1a','#c6f21a'];
 for(let i=0;i<n;i++){let a=i/n*6.283+rnd();const r=2.6+rnd()*.6;for(let k=0;k<6&&Math.hypot(hx+Math.cos(a)*r-mx,hz+Math.sin(a)*r-mz)<1.7;k++)a+=.5; /* r16: fora do monte de terra */const x=hx+Math.cos(a)*r,z=hz+Math.sin(a)*r;
  const pal={...pick2(PED_PALS),shirt:vests[i%3],cap:'#ffd21a',capDark:'#c8a010',pants:'#2b3550'};const q=spawnPed(null,{x,z,vx:0,vz:0,pal});if(!q)continue;
  q.fixed=true;q.state='clerk';q.at={x,z};q.mx=hx-x;q.mz=hz-z;q.obra=true;q.fin=0;try{q.sp.material.opacity=0;q.sh.material.opacity=0}catch(e){}OBRA.peds.push(q)}}
function obraClear(){for(const c of OBRA.cols)remCol(c);OBRA.cols=[];if(OBRA.grp){OBRA.grp.parent&&OBRA.grp.parent.remove(OBRA.grp);OBRA.grp.traverse(o=>{if(o.isMesh)o.geometry.dispose()});OBRA.grp=null}for(const m of OBRA.mats){if(m.map)m.map.dispose();m.dispose()}OBRA.mats=[];
 for(const q of OBRA.peds)if(peds.includes(q))removePed(q);OBRA.peds=[];OBRA.key=null;OBRA.seg=null;OBRA.hole=null;OBRA.pit=null;OBRA.gl=null;OBRA.phase='off'}
function obraAlpha(a){OBRA.a=a;for(const m of OBRA.mats){m.opacity=a;m.depthWrite=a>.98&&!m.userData.obraDecal}
 if(OBRA.phase==='out')for(const q of OBRA.peds)if(peds.includes(q)&&q.state!=='dead'){try{q.sp.material.alphaTest=.02;q.sp.material.opacity=q.sh.material.opacity=a}catch(e){}}}
function obraTick(dt){if(!played||!city||!city.N)return;
 if(S.style!=='modern'||city.haze){if(OBRA.phase!=='off')obraClear();return}
 const on=obraActiveHour();OBRA.t+=dt;
 if(OBRA.phase==='off'){const dy=obraDay();if(on&&OBRA.day!==dy&&!missionMode()){const s=obraPick(dy);OBRA.day=dy;if(!s)return;OBRA.seg=s;OBRA.key=segKey(s[0],s[1],s[2]);OBRA.phase='closing';OBRA.t=0}return}
 if(OBRA.phase==='closing'){if(!on){obraClear();return}if(obraSegCars()===0||OBRA.t>45){obraBuild();OBRA.phase='in';OBRA.t=0;obraAlpha(0)}return}
 if(OBRA.phase==='in'){obraGlitchTick(dt);obraAlpha(Math.min(1,OBRA.t/3));if(OBRA.t>=3)OBRA.phase='on';return}
 if(OBRA.phase==='on'){obraGlitchTick(dt);if(!on||obraDay()!==OBRA.day){OBRA.phase='out';OBRA.t=0}return}
 if(OBRA.phase==='out'){obraAlpha(Math.max(0,1-OBRA.t/3));if(OBRA.t>=3)obraClear()}}
/* radar/mapa: faixa vermelha translúcida + pontilhado vermelho (unidades do mundo; sc = escala do mapa) */
function obraMap(g,sc){if(!OBRA.seg||OBRA.phase==='off')return;const [kx,kz,d]=OBRA.seg,h=RW/2,ax=kx*P+MOFF,az=kz*P+MOFF;
 const r=d===0?[ax+h,az-h,P-RW,RW]:[ax-h,az+h,RW,P-RW];
 g.save();g.fillStyle='rgba(255,40,40,.34)';g.fillRect(r[0],r[1],r[2],r[3]);
 g.strokeStyle='#ff2a2a';g.lineWidth=Math.max(3/sc,RW*.35);g.setLineDash([Math.max(6/sc,RW*.6),Math.max(5/sc,RW*.45)]);g.beginPath();
 if(d===0){g.moveTo(ax+h,az);g.lineTo(ax+P-h,az)}else{g.moveTo(ax,az+h);g.lineTo(ax,az+P-h)}g.stroke();g.setLineDash([]);g.restore()}

/* ================= r46 · CENAS DE RUA (SCN) =================
 Situações curtas espalhadas pela cidade, uma por vez, com chance baixa (uma a cada ~2 min em média):
  crash  carro batido no meio-fio, motorista olhando o capô, fumaça
  stop   viatura atrás de um carro, guarda abordando o motorista → libera (45%) · motorista atira e foge (30%) · guarda atira (25%)
  argue  dois carros batidos, donos discutindo → vão embora (45%) · um sai correndo e o outro vai atrás (30%) · um atira (25%)
  dog    ped faz carinho num cachorro → nada (70%) · o cachorro ataca e mata (30%)
  skate  skatista passa pela calçada e salta com manobra → acerta (65%) · cai (35%)
 Onde: carros SÓ nas ruas estreitas (mão dupla/única; nunca avenida). Nelas o asfalto vai só até 3,9 m do eixo e a calçada
 é larga (3,9→12): o carro fica EM CIMA da calçada a 6,4 m do eixo (faixas a ±1,9 livres) e no meio da quadra;
 gente na linha dos pedestres (2 m da guia; entre 0,5 e 1,5 m da guia ficam postes, árvores e lixeiras). Nasce a 50–110 m, fora da vista.
 Desligado em missão/cutscene (missionMode, CAMP, prólogo), online, procurado, interiores e mundos especiais (pedevOK). */
const SCN={t:90,cur:null,left:[],turn:[],n:0,smokeT:0,W:{crash:.18,stop:.18,argue:.18,dog:.13,skate:.15,purse:.11,chase:.11},CHANCE:.55};
const SCN_CARS=['sedan','hatch','wagon','crossover','suv','pickup','mini','sedan','hatch'];
function scnOK(){return pedevOK()&&!missionMode()&&!(typeof CAMP!=='undefined'&&CAMP.id)&&!PROLOGUE.active&&!PROLOGUE.cut&&!ONLINE.on&&!POL.wanted&&!(EVT.cars&&EVT.cars.length)&&!PEDEV.cur}
let SCN_FR=null;
function scnInView(x,z){try{if(!SCN_FR)SCN_FR=new THREE.Frustum();const m=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);SCN_FR.setFromProjectionMatrix(m);return SCN_FR.containsPoint(new THREE.Vector3(x,1,z))}catch(e){return false}}
/* ponto no meio de uma quadra: car = meio-fio, sw = calçada (0,9–1,2 m da guia), u = sentido da rua, n = normal para a calçada */
function scnSpot(curb,span,lat){lat=lat||10.1;const f=PL.car||PL,N=city.N,cx=Math.round(f.x/P),cz=Math.round(f.z/P);span=span||10;
 for(let k=0;k<60;k++){const kx=clamp(cx+Math.floor(R2()*5)-2,0,N),kz=clamp(cz+Math.floor(R2()*5)-2,0,N),d=R2()<.5?0:1;
  if(!segExists(kx,kz,d))continue;const L=lineType(kx,kz,d);if(curb&&L.t==='ave')continue;if(city.isle&&L===ISLE_TWO)continue;
  const ux=D[d][0],uz=D[d][1],side=R2()<.5?1:-1,nx=-uz*side,nz=ux*side,s=18+span/2+R2()*(P-36-span),bx=kx*P+ux*s,bz=kz*P+uz*s;
  const car=[bx+nx*6.4,bz+nz*6.4],sw=[bx+nx*lat,bz+nz*lat],dd=Math.hypot(sw[0]-f.x,sw[1]-f.z);
  if(dd<50||dd>110||(dd<95&&scnInView(sw[0],sw[1])))continue;
  let bad=false;const ts=[];for(let t=-span/2;t<=span/2+.01;t+=Math.min(4,span/2||1))ts.push(t);for(const t of ts){const x=bx+ux*t,z=bz+uz*t;
   if(inWater(x+nx*6.4,z+nz*6.4)||inWater(x+nx*lat,z+nz*lat)||!pedevFree(x+nx*lat,z+nz*lat)||(curb&&(!pedevFree(x+nx*6.4,z+nz*6.4)||!(groundY(x+nx*6.4,z+nz*6.4)>.1)))||parkingGroundAt(x+nx*lat,z+nz*lat)){bad=true;break}
   const gy=groundY(x+nx*lat,z+nz*lat);if(gy<.05||gy>.6){bad=true;break}}
  if(bad)continue;const ri=rectNear(sw[0],sw[1]),r=city.rects[ri];if(!pedLotOk(ri)||!r||sw[0]<r[0]-.3||sw[0]>r[2]+.3||sw[1]<r[1]-.3||sw[1]>r[3]+.3)continue;
  if(carsNear(car[0],car[1],span/2+6).length||peds.some(p=>p.fixed&&Math.hypot(p.x-sw[0],p.z-sw[1])<span/2+5))continue;
  return{car,sw,ux,uz,nx,nz,side,a:Math.atan2(uz,ux)+(side<0?Math.PI:0),s,bx,bz}}
 return null}
function scnAt(S0,t,lat){return[S0.bx+S0.ux*t+S0.nx*lat,S0.bz+S0.uz*t+S0.nz*lat]}
function scnCar(e,S0,t,type,dmg,tilt){const p=scnAt(S0,t,6.4),c=makeVehicle(type,p[0],p[1],S0.a+(tilt||0),parkedCityColor(type,'scn'+(++SCN.n)));
 c.hand=true;c.sleep=true;c.thr=0;c.scn=true;c.rpal=pick2(PED_PALS);if(dmg){c.dmg=dmg;c.dmgDirty=true;c.hp=Math.min(c.hp||100,45)}e.cars.push(c);return c}
function scnPed(e,x,z,pal){const o={x,z};circleVsWorld(o,.35);const p=spawnPed(null,{x:o.x,z:o.z,vx:0,vz:0,pal:pal||pick2(PED_PALS)});if(!p)return null;
 p.fixed=true;p.strip=null;p.state='flee';p.timer=99;p.vx=p.vz=0;p.pedev='scn';p.scn=true;dropUmbrella(p);e.peds.push(p);return p}
function scnLook(p,o){if(p&&o){p.mx=o.x-p.x;p.mz=o.z-p.z}}
function scnHold(p){if(!p)return;p.vx=p.vz=0;p.timer=99;p.state='flee'}
function scnAlive(p){return p&&peds.includes(p)&&p.state!=='dead'&&p.state!=='down'}
/* volta a andar na calçada como um pedestre comum */
function scnWalk(p){if(!p||!peds.includes(p)||p.state==='dead')return;p.fixed=false;p.pedev=null;p.scn=false;p.rot=0;p.jy=0;p.state='walk';p.vx=p.vz=0;
 try{p.ri=rectNear(p.x,p.z);p.r=perim(p.ri);p.t=perimNearest(p.r,p.x,p.z)}catch(err){pedevRelease(p,2)}}
function scnBoard(it,leave){if(!it)return;if(it.g){skDisposeG(it.g);it.g=null}}
function scnSpawn(kind){const e={kind,peds:[],cars:[],t:0,go:false,ph:0,age:0};
 if(kind==='crash'){const S0=scnSpot(true,6);if(!S0)return null;e.S=S0;const c=scnCar(e,S0,0,pick2(SCN_CARS),{f:2},.13);
  const ca=Math.cos(c.a),sa=Math.sin(c.a),fs=(ca*S0.ux+sa*S0.uz)>=0?1:-1,hq=scnAt(S0,fs*(c.t.L/2+.4),10),p=scnPed(e,hq[0],hq[1],c.rpal);if(!p){scnClear(e,true);return null}
  e.hood=[c.x+ca*(c.t.L/2-.5),c.z+sa*(c.t.L/2-.5)];p.mx=-ca;p.mz=-sa;e.c=c;e.p=p}
 else if(kind==='stop'){const S0=scnSpot(true,11);if(!S0)return null;e.S=S0;const c=scnCar(e,S0,2.6,pick2(SCN_CARS)),pc=scnCar(e,S0,-3.2,'police');pc.stationParked=true;pc.lightsOff=false;pc.sirenOn=false;
  const dp=scnAt(S0,2.6+.6,10.0),cp=scnAt(S0,2.6-.9,10.3),drv=scnPed(e,dp[0],dp[1],c.rpal),cop=scnPed(e,cp[0],cp[1],copPal());if(!drv||!cop){scnClear(e,true);return null}
  scnLook(drv,cop);scnLook(cop,drv);e.c=c;e.pc=pc;e.a=drv;e.b=cop}
 else if(kind==='argue'){const S0=scnSpot(true,11);if(!S0)return null;e.S=S0;const ca=scnCar(e,S0,2.7,pick2(SCN_CARS),{r:2},.04),cb=scnCar(e,S0,-2.6,pick2(SCN_CARS),{f:2},-.06);
  const pa=scnAt(S0,.9,10.0),pb=scnAt(S0,-.9,10.2),A=scnPed(e,pa[0],pa[1],ca.rpal),B=scnPed(e,pb[0],pb[1],cb.rpal);if(!A||!B){scnClear(e,true);return null}
  scnLook(A,B);scnLook(B,A);e.ca=ca;e.cb=cb;e.a=A;e.b=B}
 else if(kind==='dog'){const S0=scnSpot(false,10);if(!S0)return null;e.S=S0;const q=scnAt(S0,1.5,10.1),ci=Math.floor(R2()*DOG_COLS.length),tex=animalTex('dog',ci),sp=makeActorLitSprite(tex);
  const dog={kind:'dog',ci,home:'street',spot:null,y:0,onBin:null,x:q[0],z:q[1],hx:q[0],hz:q[1],tx:q[0],tz:q[1],sp,tex,mx:-S0.ux,mz:-S0.uz,anim:0,wait:999,flee:0,dead:false,deadT:0,scn:true};ANIM.list.push(dog);
  const pq=scnAt(S0,-4.5,10.4),p=scnPed(e,pq[0],pq[1]);if(!p){dog.wait=0;return null}scnLook(p,dog);e.dog=dog;e.p=p}
 else if(kind==='purse'||kind==='chase'){const S0=scnSpot(false,16,10.2);if(!S0)return null;e.S=S0;e.dir=R2()<.5?1:-1;
  const bad={...pick2(PED_PALS),shirt:'#1d1d22',cap:'#141418',capDark:'#0c0c10',pants:'#2a2a30'},qa=scnAt(S0,e.dir*1.2,10.2),qb=scnAt(S0,-e.dir*1.2,10.2);
  const T=scnPed(e,qa[0],qa[1],bad);const V=scnPed(e,qb[0],qb[1],kind==='chase'?copPal():{...pick2(PED_PALS),bag:'#b0306a'});if(!T||!V){scnClear(e,true);return null}
  T.scnBad=true;T.crim=true;if(kind==='chase'){e.a=T;e.b=V;const q0=scnAt(S0,-e.dir*7,10.2);V.x=q0[0];V.z=q0[1]}else{e.a=T;e.b=V;scnLook(T,V);scnLook(V,T)}}
 else if(kind==='skate'){const S0=scnSpot(false,30,10.2);if(!S0)return null;e.S=S0;e.dir=R2()<.5?1:-1;e.u=-e.dir*15;e.lat=10.2;const q=scnAt(S0,e.u,e.lat),p=scnPed(e,q[0],q[1]);if(!p)return null;
  e.look={deck:pick2(SK_DECK),wheel:pick2(SK_WHEEL),print:SK_PRINT[Math.floor(R2()*(SK_PRINT.length-1))]};if(e.look.print==='EMOJI')e.look.emo=[SK_EMO_RND[Math.floor(R2()*SK_EMO_RND.length)]];e.board=skBoard(e.look);e.board.position.set(q[0],-9999,q[1]);scene.add(e.board);
  e.p=p;e.spd=4.6+R2()*1.2;e.trickAt=-e.dir*(1+R2()*4);e.ok=R2()<.65;e.spin=pick2([1,1,2]);e.go=true}
 else return null;
 return e}
function scnClear(e,hard){if(!e)return;if(e.board){skDisposeG(e.board);e.board=null}
 for(const p of e.peds){if(!peds.includes(p))continue;if(hard&&p.state!=='dead')removePed(p);else if(p.scn)scnWalk(p)}
 if(e.dog&&!e.dog.dead){e.dog.wait=hard?999:1;e.dog.scn=false;if(hard){const i=ANIM.list.indexOf(e.dog);if(i>=0){try{pet3Drop(e.dog.sp)}catch(e2){}scene.remove(e.dog.sp);e.dog.tex.dispose();e.dog.sp.material.dispose();ANIM.list.splice(i,1)}}}
 for(const c of e.cars){if(!vehicles.includes(c))continue;if(hard&&c!==PL.car&&c!==PL.lastCar)removeVehicle(c);else if(!SCN.left.includes(c))SCN.left.push(c)}}
function scnEnd(hard){const e=SCN.cur;SCN.cur=null;scnClear(e,hard)}
function scnPick(){let r=R2(),tot=0;for(const k in SCN.W)tot+=SCN.W[k];r*=tot;for(const k in SCN.W){r-=SCN.W[k];if(r<=0)return k}return 'crash'}
function scnSay(p,txt,d){if(scnAlive(p))say(p,txt,d||2.2)}
function scnShoot(a,b){const ear=PL.car||PL;scnLook(a,b);pedevGun(a,b,ear);if(scnAlive(b)){b.fixed=false;b.pedev=null;b.scn=false;killPed(b);b.vx=(b.x-a.x)*.5;b.vz=(b.z-a.z)*.5}
 for(const q of peds)if(q!==a&&q!==b&&!q.cop&&!q.fixed&&q.state!=='dead'&&q.state!=='down'&&Math.hypot(q.x-a.x,q.z-a.z)<28)panicPedFlee(q,a.x,a.z)}
/* sai da calçada: o carro vira ~20° para o lado da rua (aos poucos, em scnTick) e o pedevDrive leva reto até cair na faixa */
function scnDrive(c,p,crim){if(!c||!c.alive||c===PL.car||!vehicles.includes(c))return false;const pal=p&&p.pal0||c.rpal;if(p&&peds.includes(p))removePed(p);c.stationParked=false;
 const e=SCN.cur,S0=e&&e.S;if(S0){const hx=Math.cos(c.a),hz=Math.sin(c.a),cr=hx*S0.nz-hz*S0.nx;SCN.turn.push({c,left:.38,sg:cr>0?-1:1})}
 return pedevDrive(c,pal,!!crim)}
function scnTick(dt){
 for(let i=SCN.turn.length-1;i>=0;i--){const q=SCN.turn[i],c=q.c;if(!vehicles.includes(c)||c===PL.car||q.left<=0){SCN.turn.splice(i,1);continue}const st=Math.min(q.left,.75*dt);q.left-=st;c.a+=q.sg*st}
 for(let i=SCN.left.length-1;i>=0;i--){const c=SCN.left[i];if(!vehicles.includes(c)){SCN.left.splice(i,1);continue}if(c===PL.car||c===PL.lastCar||c.ai){SCN.left.splice(i,1);continue}
  const f=PL.car||PL;if(Math.hypot(c.x-f.x,c.z-f.z)>150&&!scnInView(c.x,c.z)){removeVehicle(c);SCN.left.splice(i,1)}}
 const ok=scnOK();
 if(!ok){if(SCN.cur)scnEnd(!SCN.cur.go||Math.hypot(SCN.cur.S.sw[0]-PL.x,SCN.cur.S.sw[1]-PL.z)>70);return}
 if(!SCN.cur){SCN.t-=dt;if(SCN.t<=0){SCN.t=45+R2()*40;if(R2()<SCN.CHANCE)SCN.cur=scnSpawn(scnPick())}return}
 const e=SCN.cur,f=PL.car||PL,dP=Math.hypot(e.S.sw[0]-f.x,e.S.sw[1]-f.z);e.age+=dt;
 if(!e.go&&(dP>200||e.age>150)){scnEnd(true);return}
 if(e.go&&dP>170){scnEnd(!scnInView(e.S.sw[0],e.S.sw[1]));return}
 if(!e.go&&dP<(PL.car?55:38)){e.go=true;e.t=0;e.ph=0}
 if(e.kind!=='skate'&&e.kind!=='dog')for(const p of e.peds)if(peds.includes(p)&&p.scn&&p.fixed&&p.state==='flee'&&!p.run)scnHold(p);
 const T=e.t;if(e.go)e.t+=dt;
 /* ---- 1 · carro batido soltando fumaça */
 if(e.kind==='crash'){const p=e.p;if(e.c&&e.c.alive&&vehicles.includes(e.c)&&dP<110&&!PL.inside){SCN.smokeT-=dt;if(SCN.smokeT<=0){SCN.smokeT=.07;const gy=groundY(e.hood[0],e.hood[1]);emit(e.hood[0]+(R2()-.5)*.6,gy+1.05,e.hood[1]+(R2()-.5)*.6,(R2()-.5)*.5,1.1+R2()*.6,(R2()-.5)*.5,1.8+R2(),.45,2.2,R2()<.5?0x5a5a5a:0x7a7a7a,false,.42)}}
  if(!scnAlive(p)){if(!e.c||!e.c.alive||e.c===PL.car)scnEnd(false);return}
  if(e.go&&e.ph===0){e.ph=1;scnSay(p,['Que dia...','Alguém chama um guincho!','Meu carro!','Não acredito...'],2.6)}
  if(e.go&&e.ph===1&&T>9){e.ph=2;scnSay(p,['Vai, liga...','Isso vai sair caro.','Era o único carro que eu tinha.'],2.4)}
  if(e.c&&(e.c===PL.car||!e.c.alive)){scnSay(p,['Ei! Esse carro é meu!','Pelo menos leva ele pra oficina!'],2);scnEnd(false)}return}
 /* ---- 2 · abordagem policial */
 if(e.kind==='stop'){const A=e.a,B=e.b;
  if(e.ph<3&&(!scnAlive(A)||!scnAlive(B))){if(scnAlive(B)){B.run=1;scnDrive(e.pc,B,false)}else if(scnAlive(A))pedevRelease(A,4);e.pc.lightsOff=false;scnEnd(false);return}
  if(!e.go)return;
  if(e.ph===0){e.ph=1;scnSay(B,['Documentos, por favor.','Sabe por que eu te parei?','Mãos onde eu possa ver!'],2.4)}
  if(e.ph===1&&T>2.6){e.ph=2;scnSay(A,['Eu não fiz nada, seu guarda!','Tava só um pouquinho rápido...','Pode olhar, tá tudo certo.'],2.4);e.r=R2()}
  if(e.ph===2&&T>6){e.ph=3;if(e.rf!==undefined)e.r=e.rf;
   if(e.r<.30){e.out='run';scnSay(A,['Hoje não, seu guarda!','Você não vai me levar!'],1.4);e.shot=.5}
   else if(e.r<.55){e.out='cop';scnSay(B,['Larga isso!','Parado aí!'],1.4);e.shot=.6}
   else{e.out='ok';scnSay(B,['Tudo certo. Pode ir.','Dessa vez passa. Vai com calma.'],2.2);e.leave=1.6}}
  if(e.ph===3){
   if(e.out==='run'){e.shot-=dt;if(e.shot<=0&&scnAlive(B)){scnShoot(A,B);e.shot=99;e.leave=.7}
    if(e.shot>90){e.leave-=dt;if(e.leave<=0&&scnAlive(A)){if(scnDrive(e.c,A,true))pedevPoliceAfter(e.c);e.pc.lightsOff=false;scnEnd(false)}}}
   else if(e.out==='cop'){e.shot-=dt;if(e.shot<=0&&scnAlive(A)){scnShoot(B,A);e.shot=99;e.leave=4}
    if(e.shot>90){e.leave-=dt;if(e.leave<=0){scnDrive(e.pc,B,false);e.pc.lightsOff=false;scnEnd(false)}}}
   else{e.leave-=dt;if(e.leave<=0&&!e.gone){e.gone=true;scnDrive(e.c,A,false);e.leave2=1.8}
    if(e.gone){e.leave2-=dt;if(e.leave2<=0){scnDrive(e.pc,B,false);if(e.pc.alive)e.pc.lightsOff=true;scnEnd(false)}}}}
  return}
 /* ---- 3 · batida com discussão */
 if(e.kind==='argue'){const A=e.a,B=e.b;
  if(e.ph<3&&(!scnAlive(A)||!scnAlive(B))){for(const p of [A,B])if(scnAlive(p))pedevRelease(p,4);scnEnd(false);return}
  if(!e.go)return;
  const lines=[[A,['Você não olha pra frente não?!','Quem vai pagar isso?','Você me fechou!']],[B,['Você freou do nada!','A culpa é sua!','Nem vem!']],[A,['Vou chamar a polícia!','Olha o que você fez!']],[B,['Chama! Quero ver!','Problema seu!']]];
  if(e.ph===0){e.ph=1;e.li=0;e.lt=0}
  if(e.ph===1){e.lt-=dt;if(e.lt<=0){if(e.li<lines.length){const L=lines[e.li++];scnSay(L[0],L[1],2);e.lt=2.2}else{e.ph=2;e.r=R2()}}}
  if(e.ph===2){e.ph=3;if(e.rf!==undefined)e.r=e.rf;
   if(e.r<.25){e.out='shoot';e.shot=.4;scnSay(A,['Chega, cansei!','Cansei de você!'],1.2)}
   else if(e.r<.55){e.out='chase';e.rt=12;scnSay(B,['Tô fora!','Tô indo embora!'],1.4);B.run=1;A.run=1;const k=R2()<.5?1:-1;e.flee=scnAt(e.S,k*40,10.2)}
   else{e.out='calm';e.leave=1.4;scnSay(A,['Deixa pra lá...','Vou mandar a conta pro seguro.'],2);e.leave2=3.2}}
  if(e.ph===3){
   if(e.out==='shoot'){e.shot-=dt;if(e.shot<=0&&e.shot>-50&&scnAlive(B)){scnShoot(A,B);e.shot=-99;if(scnAlive(A)){const dx=A.x-f.x,dz=A.z-f.z,l=Math.hypot(dx,dz)||1;A.fixed=false;A.pedev=null;A.scn=false;A.state='flee';A.timer=9;A.vx=dx/l*6.4;A.vz=dz/l*6.4}scnEnd(false)}}
   else if(e.out==='chase'){e.rt-=dt;if(scnAlive(B)){const r=pedevRun(B,e.flee[0],e.flee[1],5.6);if(r<1.5){const k=R2()<.5?1:-1;e.flee=[B.x+e.S.nx*-1+e.S.ux*k*30,B.z+e.S.nz*-1+e.S.uz*k*30]}}
    if(scnAlive(A)&&scnAlive(B)){pedevRun(A,B.x,B.z,5.3);if(R2()<dt*.4)scnSay(A,['Volta aqui!','Covarde!','Vai pagar o meu carro!'],1.4)}
    if(e.rt<=0||!scnAlive(A)||!scnAlive(B)){for(const p of [A,B])if(scnAlive(p)){p.run=0;pedevRelease(p,2)}scnEnd(false)}}
   else{e.leave-=dt;e.leave2-=dt;if(e.leave<=0&&!e.g1){e.g1=true;scnDrive(e.ca,A,false)}if(e.leave2<=0){scnDrive(e.cb,B,false);scnEnd(false)}}}
  return}
 /* ---- 4 · carinho no cachorro */
 if(e.kind==='dog'){const p=e.p,g=e.dog;
  if(!g||g.dead||!ANIM.list.includes(g)){if(scnAlive(p))scnWalk(p);scnEnd(false);return}
  if(!scnAlive(p)){if(e.ph>=3&&e.out==='bite'&&p&&peds.includes(p)){g.tx=p.x+.6;g.tz=p.z;if(e.t-e.kt>6){g.wait=0;g.scn=false;e.dog=null;scnEnd(false)}return}g.wait=0;g.scn=false;e.dog=null;scnEnd(false);return}
  if(!e.go){g.wait=999;g.tx=g.x;g.tz=g.z;scnHold(p);scnLook(p,g);return}
  if(e.ph===0){const r=pedevRun(p,g.x+(p.x>g.x?.9:-.9),g.z,1.5);g.wait=999;g.mx=p.x-g.x;g.mz=p.z-g.z;if(r<.5||T>9){e.ph=1;e.t=0;scnHold(p);scnLook(p,g);scnSay(p,['Que fofo!','Oi, amigão!','Vem cá, vem...'],2)}return}
  if(e.ph===1){scnHold(p);scnLook(p,g);if(T>2.4){e.ph=2;e.t=0;e.out=R2()<.3?'bite':'calm';if(e.out==='bite'){scnSay(p,['Ai! Socorro!','Sai! Sai daqui!'],1.6);e.bt=0;e.n=0}}return}
  if(e.out==='calm'){if(e.ph===2){e.ph=3;scnSay(p,['Bom garoto!','Que coisa linda.'],2)}if(T>2.5){g.wait=1;g.scn=false;e.dog=null;scnWalk(p);scnEnd(false)}return}
  /* ataque: o ped tenta fugir pela calçada, o cachorro alcança e morde */
  if(!e.away){e.away=scnAt(e.S,(Math.sign((p.x-g.x)*e.S.ux+(p.z-g.z)*e.S.uz)||1)*40,10.2)}
  pedevRun(p,e.away[0],e.away[1],Math.max(1.2,3.6-e.n*.8));g.wait=0;g.flee=1;g.tx=p.x;g.tz=p.z;e.bt-=dt;
  if(Math.hypot(g.x-p.x,g.z-p.z)<1.2&&e.bt<=0){e.bt=.65;e.n++;bloodHit(p.x,.9,p.z,{x:p.x-g.x,z:p.z-g.z});ouch(p.x,p.z,p.pitch);
   if(e.n>=4){p.fixed=false;p.pedev=null;p.scn=false;killPed(p);e.kt=e.t;e.ph=3;for(const q of peds)if(q!==p&&!q.cop&&!q.fixed&&q.state!=='dead'&&Math.hypot(q.x-p.x,q.z-p.z)<20)panicPedFlee(q,g.x,g.z)}}
  if(T>16){g.wait=0;g.scn=false;e.dog=null;if(scnAlive(p))pedevRelease(p,4);scnEnd(false)}
  return}
 /* ---- 6/7 · r58: ladrão de bolsa / guarda a pé atrás de um bandido. Derrubar o ladrão = recompensa ($50 / $10 bom cidadão) */
 if(e.kind==='purse'||e.kind==='chase'){const T=e.a,V=e.b,ch=e.kind==='chase';
  if(!e.go){scnHold(T);scnHold(V);if(!ch){scnLook(T,V);scnLook(V,T)}return}
  if(e.ph===0){e.ph=1;e.rt=26;e.flee=scnAt(e.S,e.dir*38,10.2);if(ch){scnSay(V,['Pega ladrão!','Parado! Polícia!','Para aí!'],1.8)}else{scnSay(T,['Passa a bolsa!','Isso é meu agora!'],1.2);e.lt=.9}}
  if(!ch&&e.lt>0){e.lt-=dt;if(e.lt<=0)scnSay(V,['Minha bolsa!','Socorro! Ladrão!','Pega ele!'],2)}
  if(e.paid||!scnAlive(T)){if(!e.paid){e.paid=true;const near=Math.hypot(T.x-PL.x,T.z-PL.z)<30&&!PL.dead;
    if(near){const n=ch?10:50;money(n,(ch?'BOM CIDADÃO':'RECOMPENSA')+' · +$'+n);if(scnAlive(V))scnSay(V,ch?['Valeu pela ajuda, cidadão!','Boa! Deixa comigo.']:['Obrigada! Minha bolsa!','Você é um herói!'],2.4)}
    if(scnAlive(V)){if(ch)pedevRun(V,T.x,T.z,1.5);e.leave=3}else e.leave=0}
   e.leave-=dt;if(e.leave<=0){if(scnAlive(V)){V.run=0;scnWalk(V)}scnEnd(false)}return}
  e.rt-=dt;const r=pedevRun(T,e.flee[0],e.flee[1],ch?5.2:5.5);T.run=1;if(r<1.5)e.flee=[T.x+e.S.ux*e.dir*30,T.z+e.S.uz*e.dir*30];
  if(scnAlive(V)){V.run=1;if(ch){pedevRun(V,T.x,T.z,4.9);if(R2()<dt*.35)scnSay(V,['Pega ladrão!','Para!','Volta aqui!'],1.4)}else if(e.t<6)pedevRun(V,T.x,T.z,2.2);else scnHold(V)}
  if(e.rt<=0||(dP>120)){const vis=scnInView(T.x,T.z);for(const q of [T,V])if(scnAlive(q)){q.run=0}if(!vis&&peds.includes(T))removePed(T);else if(scnAlive(T)){T.scnBad=false;scnWalk(T)}if(scnAlive(V))scnWalk(V);scnEnd(false)}
  return}
 /* ---- 5 · skatista com manobra */
 if(e.kind==='skate'){const p=e.p;
  if(!peds.includes(p)||p.state==='dead'){scnEnd(false);return}
  if(e.ph===0){e.u+=e.dir*e.spd*dt;const q=scnAt(e.S,e.u,e.lat);p.x=q[0];p.z=q[1];p.vx=p.vz=0;p.timer=99;p.anim=0;const tx=e.S.ux*e.dir,tz=e.S.uz*e.dir;p.mx=-tz;p.mz=tx;p.gy=groundY(p.x,p.z);let hop=0,roll=0;
   const k=(e.u-e.trickAt)*e.dir;if(k>=0&&k<e.spd*.72&&dP<75){const s=k/(e.spd*.72);hop=4*.62*s*(1-s);roll=s*Math.PI*2*e.spin;if(!e.said&&s>.1){e.said=true;if(R2()<.4)scnSay(p,['Olha essa!','Kickflip!','Segura!'],1.2)}}
   else if(k>=e.spd*.72&&!e.landed){e.landed=true;
    if(!e.ok&&dP<75){e.ph=1;e.t=0;p.rot=(R2()<.5?1:-1)*Math.PI/2;p.jy=0;try{thud(.4)}catch(err){}scnSay(p,['Ai, meu joelho!','Ai, ai...','Droga!'],1.6);
     const b=scnAt(e.S,e.u+e.dir*2.6,e.lat+.2),o={x:b[0],z:b[1]};circleVsWorld(o,.3);skDisposeG(e.board);e.board=null;e.item=(SKATE.items.filter(it=>!skInGarage(it)).length<6)?skAdd(o.x,o.z,Math.atan2(tz,tx),e.look,false):null;return}
    if(R2()<.5)scnSay(p,['Uhuul!','Cravou!','Isso aí!'],1.2)}
   p.jy=SK_UP+hop;if(e.board){e.board.visible=!PL.inside;e.board.position.set(p.x,p.gy+hop,p.z);e.board.rotation.set(0,-Math.atan2(tz,tx),0);if(roll)e.board.rotateX(roll)}
   if(Math.abs(e.u)>17&&e.u*e.dir>0){const vis=scnInView(p.x,p.z)&&dP<90;if(vis){p.jy=0;skDisposeG(e.board);e.board=null;scnWalk(p)}else removePed(p);scnEnd(false)}
   return}
  if(e.ph===1){p.vx=p.vz=0;p.timer=99;if(T>1.8){e.ph=2;p.rot=0;p.jy=0}return}
  if(e.ph===2){const it=e.item;if(!it||!SKATE.items.includes(it)){scnSay(p,['Ei! Meu skate!','Devolve isso!'],1.6);scnWalk(p);scnEnd(false);return}
   if(pedevRun(p,it.x,it.z,1.7)<.6){skRemove(it);e.item=null;scnWalk(p);scnEnd(false)}
   if(T>14){scnWalk(p);scnEnd(false)}}
  return}}
/* ================= r59 · PEDESTRES REAGEM AO SEU CARRO (CARRX) =================
 Só no modo livre do mundo moderno (mesmas travas das cenas: sem missão, online, interiores). A cada 0,3 s olha os pedestres a até 14 m:
  · DeLorean devagar por perto → para, vira e tira foto (flash)   · carro de luxo devagar/parado → elogia
  · carro em cima da calçada (chão > 8 cm) andando → xinga        · parado ao lado de alguém na rua → às vezes pede carona:
    fique 1,5 s parado perto que ele entra; leve até o ponto marcado no mapa e ele paga $20–60. */
const CARRX={t:0,cd:0,ask:null,ride:null};
const CARRX_LUX=new Set(['super','sports','conv','roadster']);
function carrxOK(){return scnOK()&&S.style==='modern'&&!(MIS&&MIS.type)&&!PL.taxi}
function carrxPedOK(q){return q&&q.state==='walk'&&!q.fixed&&!q.cop&&!q.gang&&!q.demo&&!q.net&&!q.main&&q.tommy===undefined&&!q.clubType&&!q.balcony&&!q.skb&&!q.scn&&!q.pedev&&!(q.cr&&q.cr>simT)}
function carrxRideEnd(pay){const R=CARRX.ride;if(!R)return;CARRX.ride=null;const c=PL.car||R.c,a=c?c.a:0,o={x:(c?c.x:PL.x)+Math.sin(a)*2.6,z:(c?c.z:PL.z)-Math.cos(a)*2.6};circleVsWorld(o,.35);
 const q=spawnPed(null,{x:o.x,z:o.z,vx:0,vz:0,pal:R.pal});if(q){q.state='walk';try{q.ri=rectNear(q.x,q.z);q.r=perim(q.ri);q.t=perimNearest(q.r,q.x,q.z)}catch(e){pedevRelease(q,3)}q.cr=simT+60;
  if(pay){const n=20+Math.floor(Math.random()*41);money(n,'CARONA · +$'+n);say(q,['Valeu pela carona!','Salvou meu dia!','Brigadão!'],2.4)}else say(q,['Eu desço aqui mesmo.','Valeu, eu sigo a pé.'],2)}
 if(NAV.marker&&R.m&&NAV.marker.x===R.m.x&&NAV.marker.z===R.m.z){NAV.marker=null;NAV.route=null}}
function carrxTick(dt){const R=CARRX.ride;
 if(R){const c=PL.car;if(!c||c!==R.c||!c.alive||PL.dead||!carrxOK()){carrxRideEnd(false);return}
  const sp=Math.hypot(c.vx||0,c.vz||0),d=Math.hypot(c.x-R.x,c.z-R.z);if(d<14&&sp<2.5){carrxRideEnd(true);return}R.o=R.o||{x:c.x,z:c.z,gy:0};R.o.x=c.x;R.o.z=c.z;R.o.gy=(c.gy||0)+.4;R.sayT-=dt;if(R.sayT<=0){R.sayT=14+Math.random()*10;say(R.o,['Vira ali na frente.','Tá marcado no mapa!','Que carro confortável.','Pode acelerar, tô atrasado!'],2.2)}return}
 CARRX.cd=Math.max(0,CARRX.cd-dt);if((CARRX.t-=dt)>0)return;CARRX.t=.3;
 if(!carrxOK()){CARRX.ask=null;return}const c=PL.car;if(!c||!c.alive||c.t.boat||c.type==='moto'||c.type==='bus'||c.type==='jetski'||c.type==='vortex')return;
 const sp=Math.hypot(c.vx||0,c.vz||0),dmc=c.type==='super'&&c.special,lux=CARRX_LUX.has(c.type),gy=groundY(c.x,c.z),walk=gy>.08&&!isRural(c.x,c.z)&&!(typeof parkingGroundAt==='function'&&parkingGroundAt(c.x,c.z));
 let best=null,bd=14;for(const q of peds){if(!carrxPedOK(q))continue;const d=Math.hypot(q.x-c.x,q.z-c.z);if(d<bd){bd=d;best=q}}
 /* pedido de carona: parado perto de alguém */
 const A=CARRX.ask;if(A){if(!peds.includes(A.p)||A.p.state==='dead'||sp>1.5||Math.hypot(A.p.x-c.x,A.p.z-c.z)>7||(DUO.on&&DUO.car===c)){if(peds.includes(A.p)){A.p.fixed=false;A.p.state='walk';A.p.cr=simT+40}CARRX.ask=null}
  else{A.t+=.3;A.p.vx=A.p.vz=0;A.p.mx=c.x-A.p.x;A.p.mz=c.z-A.p.z;if(A.t>=1.5){const m=sidewalkPoint(160,360);if(!m){CARRX.ask=null;return}const pal=A.p.pal||null;removePed(A.p);CARRX.ask=null;
    CARRX.ride={c,x:m.x,z:m.z,pal,m:{x:m.x,z:m.z},sayT:6};setMarker(m.x,m.z);toast('<span style="color:#ffd24a">'+(S.lang==='en'?'RIDE':'CARONA')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('leve até o ponto no mapa')+'</small>');}}return}
 if(!best||CARRX.cd>0)return;const q=best;
 if(dmc&&sp<14&&bd<13){q.cr=simT+90;q.fixed=true;q.state='fare';q.vx=q.vz=0;q.mx=c.x-q.x;q.mz=c.z-q.z;say(q,['Um DeLorean de verdade!','Foto! Foto!','Ninguém vai acreditar!'],2.2);
  setTimeout(()=>{try{if(peds.includes(q)&&q.state!=='dead'){emit(q.x,(q.gy||0)+1.5,q.z,0,.2,0,.15,.6,.12,0xffffff,true,1);clang(.05)}}catch(e){}},700);
  setTimeout(()=>{try{if(peds.includes(q)&&q.state==='fare'){q.fixed=false;q.state='walk'}}catch(e){}},2600);CARRX.cd=4;return}
 if(walk&&sp>3&&bd<10){q.cr=simT+30;say(q,['Sai da calçada, maluco!','Tá doido?! Isso é calçada!','Olha por onde anda!','Barbeiro!'],2);CARRX.cd=5;return}
 if(lux&&!dmc&&sp<6&&bd<10){q.cr=simT+120;say(q,['Que máquina!','Carrão, hein!','Um dia eu tenho um desses.','Que barulho lindo!'],2.2);CARRX.cd=6;return}
 if(sp<.6&&bd<6&&!walk&&!(DUO.on&&DUO.car===c)&&Math.random()<.18){q.cr=simT+120;q.fixed=true;q.state='fare';say(q,['Ei! Me dá uma carona?','Tá indo pro centro? Pago a gasolina!','Carona? Eu pago!'],2.6);CARRX.ask={p:q,t:0};CARRX.cd=8;return}
 if(sp<.6)CARRX.cd=3}
/* ================= r60 · GANGUES (amarela e verde) =================
 Cada gangue ocupa 1 beco por dia (sorteio por seed+dia, RNG próprio). No mapa: quadrado translúcido sobre o quarteirão.
 6 membros no beco; chegar a 30 m (ou atirar neles) = recebido a tiros. Matar os 6 (pelo menos 1 por você) → +$500 e o quarteirão
 fica limpo até o dia seguinte, quando a gangue aparece em outro. De vez em quando, com você por perto, 3 membros de uma
 vão atacar o beco da outra. Só no mundo moderno do modo livre (nada em missão, online, Synth, invertido, Haze). */
const GANG={day:-1,T:[],raid:null,raidT:120};
const GANG_DEF=[{k:'Y',nm:'AMARELA',col:'#f2d21a',rgb:'242,210,26',pal:{shirt:'#f2d21a',stripe:'#1b1b1b',cap:'#f2d21a',capDark:'#b89a10'}},{k:'G',nm:'VERDE',col:'#2fcf4a',rgb:'47,207,74',pal:{shirt:'#2fcf4a',stripe:'#0f3a18',cap:'#2fcf4a',capDark:'#1a8a30'}}];
const GANG_WPN=['pistol','smg','bat','pistol','smg','fist'];
function gangOK(){try{return played&&S.style==='modern'&&!city.haze&&!ONLINE.on&&!profInMission()&&!PROLOGUE.cut&&!TIMEJUMP.busy&&!INVERT.switching&&!HAZE.switching}catch(e){return false}}
function gangPick(day){const out=[];const sites=(city.catSpots||[]).filter(a=>a&&a.r&&!a.residential&&Math.max(a.r[2]-a.r[0],a.r[3]-a.r[1])>=8);if(!sites.length)return out;
 const R0=mulberry32(((S.seed^0x6a4e7f13)+day*7919)>>>0),avoid=[city.safe,city.hosp,city.polDoor,city.casino&&city.casino.clubDoor,city.bank].filter(Boolean);
 for(let g=0;g<2;g++){for(let k=0;k<40;k++){const a=sites[Math.floor(R0()*sites.length)],x=(a.r[0]+a.r[2])/2,z=(a.r[1]+a.r[3])/2;if(isRural(x,z)||inWater(x,z))continue;
   if(brInBlock(x,z,20)||avoid.some(o=>Math.hypot((o.x??0)-x,(o.z??0)-z)<80))continue;if(out.some(o=>Math.hypot(o.x-x,o.z-z)<240))continue;
   const kx=Math.floor(x/P),kz=Math.floor(z/P);out.push({g,x,z,kx,kz,left:6,byPl:0,clear:false,peds:[],hot:false});break}}return out}
function gangDespawn(t){for(const q of t.peds)if(peds.includes(q))removePed(q);t.peds=[];t.hot=false}
function gangSpawn(t){const D0=GANG_DEF[t.g];for(let k=0;k<t.left;k++){const a=k/t.left*6.283,px=t.x+Math.cos(a)*2.2,pz=t.z+Math.sin(a)*2.2,o={x:px,z:pz};circleVsWorld(o,.35);
  const q=spawnPed(null,{x:o.x,z:o.z,vx:0,vz:0,pal:{...GANG_PAL,glasses:null,...D0.pal}});if(!q)continue;q.state='clerk';q.fixed=true;q.at={x:o.x,z:o.z};q.gang=true;q.gangT=t.g;q.hp=4;q.wpn=GANG_WPN[k%6];q.shootT=1+Math.random();q.hitT=0;q.shootAcc=q.wpn==='smg'?.18:.22;q.mx=t.x-o.x;q.mz=t.z-o.z;t.peds.push(q)}}
function gangAlive(t){return t.peds.filter(q=>peds.includes(q)&&q.state!=='dead'&&q.hp>0)}
function gangReset(){for(const t of GANG.T)gangDespawn(t);gangRaidEnd();GANG.T=[];GANG.day=-1}
function gangRaidEnd(){const r=GANG.raid;if(!r)return;for(const q of r.peds)if(peds.includes(q)&&q.state!=='dead'){if(q.state!=='dead')removePed(q)}GANG.raid=null}
function gangTick(dt){
 if(!gangOK()||!city.catSpots){for(const t of GANG.T)if(t.peds.length)gangDespawn(t);gangRaidEnd();return}
 const day=DN.day||0;if(GANG.day!==day){for(const t of GANG.T)gangDespawn(t);gangRaidEnd();GANG.day=day;GANG.T=gangPick(day);if(GANG.saved&&GANG.saved.d===day){GANG.T.forEach((t,i)=>{const sv=GANG.saved.t[i];if(sv){t.left=sv.l;t.clear=!!sv.c}})}GANG.saved=null}
 const f=PL.car||PL;
 for(const t of GANG.T){if(t.clear)continue;const d=Math.hypot(f.x-t.x,f.z-t.z);
  if(!t.peds.length){if(d<110&&!PL.inside)gangSpawn(t);continue}
  if(d>230||PL.inside){t.left=gangAlive(t).length;gangDespawn(t);continue}
  const alive=gangAlive(t);if(!t.hot&&(alive.length<t.peds.length&&alive.length<t.left||alive.some(q=>q.state!=='clerk')))t.hot=true;t.left=alive.length;
  if(!alive.length){const D0=GANG_DEF[t.g];t.clear=true;gangDespawn(t);if(t.byPl>0)money(500,'<span style="color:'+D0.col+'">'+translatePlain('BECO APAZIGUADO')+'</span> · +$500');else toast(translatePlain('A OUTRA GANGUE LIMPOU O BECO'));continue}
  if(!t.hot&&d<30&&!PL.dead){t.hot=true;const q=alive[0];say(q,['Tá perdido, playboy?','Esse beco é nosso!','Pega ele!'],1.8)}
  if(t.hot)empGangTick({gang:alive},dt);else for(const q of alive){q.vx=q.vz=0}}
 /* guerra: 3 de uma gangue vão atacar o beco da outra (você por perto, os dois becos ativos) */
 const R=GANG.raid;if(!R){GANG.raidT-=dt;if(GANG.raidT<=0){GANG.raidT=150+Math.random()*120;const A=GANG.T.filter(t=>!t.clear);if(A.length===2){const def=A.find(t=>t.peds.length&&!t.hot);if(def){const att=A.find(t=>t!==def),D0=GANG_DEF[att.g];
   const ang=Math.random()*6.283,sx=def.x+Math.cos(ang)*55,sz=def.z+Math.sin(ang)*55,r={att,def,peds:[],t:0,fx:def.x,fz:def.z,shot:1};
   for(let k=0;k<3;k++){const o={x:sx+(k-1)*1.6,z:sz};circleVsWorld(o,.35);const q=spawnPed(null,{x:o.x,z:o.z,vx:0,vz:0,pal:{...GANG_PAL,glasses:null,...D0.pal}});if(!q)continue;q.gang=true;q.gangT=att.g;q.raid=true;q.hp=4;q.fixed=true;r.peds.push(q)}
   if(r.peds.length){GANG.raid=r;say(r.peds[0],['Bora tomar o beco deles!','Hoje o beco é nosso!'],2)}}}}return}
 R.t+=dt;const ra=R.peds.filter(q=>peds.includes(q)&&q.state!=='dead'&&q.hp>0),da=gangAlive(R.def);
 if(!ra.length||!da.length||R.t>60||R.def.clear||!R.def.peds.length){gangRaidEnd();return}
 for(const q of ra){const tg=da[0],dd=Math.hypot(tg.x-q.x,tg.z-q.z);if(dd>11)pedevRun(q,tg.x,tg.z,3.6);else{q.vx=q.vz=0;q.state='flee';q.timer=2;q.mx=tg.x-q.x;q.mz=tg.z-q.z}}
 if(!R.def.hot)for(const q of da){const n=ra[0];q.mx=n.x-q.x;q.mz=n.z-q.z}
 R.shot-=dt;if(R.shot<=0&&Math.hypot(ra[0].x-da[0].x,ra[0].z-da[0].z)<16){R.shot=.5+Math.random()*.4;const fromA=Math.random()<.5,sh=fromA?ra[Math.floor(Math.random()*ra.length)]:da[Math.floor(Math.random()*da.length)],tl=fromA?da:ra,tg=tl[Math.floor(Math.random()*tl.length)];
  try{pedevGun(sh,tg,PL.car||PL)}catch(e){}if(Math.random()<.3){tg.hp-=4;if(tg.hp<=0){try{bloodHit(tg.x,1.1,tg.z,new THREE.Vector3(tg.x-sh.x,0,tg.z-sh.z).normalize())}catch(e){}killPed(tg)}}}}
function gangMap(g,sc){if(!gangOK())return;for(const t of GANG.T){if(t.clear)continue;const D0=GANG_DEF[t.g],x0=t.kx*P+RW/2+MOFF,z0=t.kz*P+RW/2+MOFF,w=P-RW;
 g.save();g.fillStyle='rgba('+D0.rgb+',.28)';g.fillRect(x0,z0,w,w);g.strokeStyle='rgba('+D0.rgb+',.85)';g.lineWidth=Math.max(2/sc,1.5);g.strokeRect(x0,z0,w,w);g.restore()}}
