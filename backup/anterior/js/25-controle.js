'use strict';
/* Coastal Chaos · js/25-controle.js — Controle (gamepad, DualSense WebHID).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= GAMEPAD (DualSense / DualShock / Xbox / genéricos) ================= */
const PAD={scheme:'classic',runLatch:false,lastUse:0,on:false,idx:-1,name:'',vib:1,sens:1,dz:.15,inv:false,adaptive:false,triggerForce:.65,speakerVolume:1,speakerEnabled:true,lightbar:true,prev:[],until:0,cur:0,lx:0,ly:0,rx:0,ry:0,r2:0,l2:0,hand:false,nitro:false,firing:false,run:false,contT:0,horn:0};
/* ================= v289: DualSense WebHID (USB + Bluetooth) =================
   WebHID drives ONLY L2/R2 adaptive motors; movement and regular rumble stay on Gamepad API.
   Output protocol: USB ID 0x02, BT ID 0x31 with Sony's CRC32 seed 0xA2.
   No automatic permission prompt: user gesture is required for requestDevice().
*/
const DUAL={dev:null,link:'',error:'',connecting:false,writeBusy:false,pending:null,seq:0,
 last:'',lastAt:0,lastTick:0,testUntil:0,stopped:false,
 shotAt:0,shotType:'',shotSeq:0,carRef:null,gear:-1,gearPulseUntil:0,gearCooldown:0};
const DUAL_OFF=Object.freeze([0,0,0,0,0,0,0,0,0,0,0]);
const DUAL_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function dualCRC(id,payload){let c=0xFFFFFFFF;
 const step=b=>{c=(c>>>8)^DUAL_CRC[(c^b)&255]};step(0xA2);step(id);
 for(let i=0;i<payload.length-4;i++)step(payload[i]);return (c^0xFFFFFFFF)>>>0;
}
function dualLink(dev){let usb=false,bt=false;
 for(const c of dev.collections||[]){for(const r of c.outputReports||[]){usb ||= r.reportId===0x02;bt ||= r.reportId===0x31}
  for(const r of c.inputReports||[]){if(r.reportId===0x31)bt=true}}
 if(bt&&!usb)return 'bluetooth';if(usb&&!bt)return 'usb';
 for(const c of dev.collections||[]){if(c.usagePage!==1||c.usage!==5)continue;
  const bits=(c.inputReports||[]).reduce((m,r)=>Math.max(m,(r.items||[]).reduce((z,i)=>z+(i.reportSize||0)*(i.reportCount||0),0)),0);
  if(bits===616)return 'bluetooth';if(bits===504)return 'usb'}return '';
}
function dualFeedback(pos,str){str=Math.max(0,Math.min(8,Math.round(str)));
 if(!str)return DUAL_OFF;
 let zones=0,force=0;for(let i=pos;i<10;i++){zones|=1<<i;force|=(str-1)<<(i*3)}
 return [0x21,zones&255,(zones>>>8)&255,force&255,(force>>>8)&255,(force>>>16)&255,(force>>>24)&255,0,0,0,0];
}
function dualWeapon(str){str=Math.max(1,Math.min(8,Math.round(str)));return [0x25,(1<<3)|(1<<6),0,str-1,0,0,0,0,0,0,0]}
function dualOutputSize(dev,id){let n=0;const walk=cs=>{for(const c of cs||[]){for(const r of c.outputReports||[])if(r.reportId===id){const bits=(r.items||[]).reduce((v,i)=>v+(i.reportSize||0)*(i.reportCount||0),0);n=Math.max(n,Math.ceil(bits/8))}walk(c.children)}};walk(dev?.collections);return n;}
function dualHealthColor(hp){const h=Math.max(0,Math.min(100,Number.isFinite(hp)?hp:100)),red=[255,32,32],orange=[255,149,26],green=[32,214,96];const a=h<=50?red:orange,b=h<=50?orange:green,t=h<=50?Math.max(0,(h-15)/35):(h-50)/50;return a.map((v,i)=>Math.round(v+(b[i]-v)*t));}
function dualLightColor(now){if(PAD.lightbar===false)return[40,100,255];if(played&&POL.wanted)return Math.floor(now/450)%2?[255,32,32]:[30,70,255];/* v78: giroflex vermelho/azul (antes vermelho/branco) */return dualHealthColor(played?PL.hp:100);}
function dualPacket(l2,r2,rgb=null,setup=false){const bt=DUAL.link==='bluetooth',id=bt?0x31:0x02,n=dualOutputSize(DUAL.dev,id)||(bt?77:47),buffer=new Uint8Array(n),base=bt?2:0;
 if(n<(bt?77:47))throw Error('Tamanho de relatório HID incompatível: '+n);
 if(bt){buffer[0]=(DUAL.seq++&15)<<4;buffer[1]=0x10}
 // Trigger and optional lightbar only. Preserve rumble, speaker and microphone flags.
 buffer[base]=0x0C;
 buffer.set(r2,base+10);buffer.set(l2,base+21);
 if(setup){buffer[base+38]=0x02;buffer[base+41]=0x02;}
 if(rgb){buffer[base+1]=0x04;buffer.set(rgb,base+44);}
 if(bt){const crc=dualCRC(id,buffer),p=buffer.length-4;buffer[p]=crc&255;buffer[p+1]=(crc>>>8)&255;buffer[p+2]=(crc>>>16)&255;buffer[p+3]=(crc>>>24)&255}
 return {id,buffer};
}
function dualStatus(){dualExtraUI();const st=$('#padAdaptiveStatus'),btn=$('#padAdaptiveConnect'),test=$('#padAdaptiveTest');if(!st)return;
 const en=S.lang==='en',ok=!!(DUAL.dev&&DUAL.dev.opened&&DUAL.link);
 st.textContent=DUAL.connecting?(en?'Opening DualSense…':'Abrindo DualSense…'):
 DUAL.error?(en?'WebHID error: ':'Erro WebHID: ')+DUAL.error:
 ok?(en?'DualSense authorized · ':'DualSense autorizado · ')+(DUAL.link==='bluetooth'?'Bluetooth':'USB')+(PAD.adaptive?(en?' · triggers enabled':' · gatilhos ativados'):(en?' · triggers off':' · gatilhos desligados')):
 !('hid' in navigator)?(en?'WebHID is not supported by this browser.':'WebHID indisponível neste navegador.'):
 (en?'Click Authorize DualSense to grant access (USB/Bluetooth).':'Clique em Autorizar DualSense para permitir acesso (USB/Bluetooth).');
 btn.disabled=!('hid' in navigator)||DUAL.connecting;
 test.disabled=!('hid' in navigator)||DUAL.connecting;
}
function dualFail(e){DUAL.error=(e&&e.message)||String(e);DUAL.pending=null;DUAL.last='';DUAL.testUntil=0;DUAL.dev=null;DUAL.link='';dualStatus();console.warn('PixelCity DualSense WebHID:',e)}
// Serial write queue (no HID traffic per animation frame, no overlapping sendReport calls).
async function dualPump(){if(DUAL.writeBusy)return;DUAL.writeBusy=true;
 try{while(DUAL.pending&&DUAL.dev&&DUAL.dev.opened){const job=DUAL.pending;DUAL.pending=null;const dev=DUAL.dev;
   const {id,buffer}=dualPacket(job.l,job.r,job.rgb);await dev.sendReport(id,buffer);
   DUAL.last=job.key;DUAL.lastAt=performance.now();}}
 catch(e){dualFail(e)}finally{DUAL.writeBusy=false}}
function dualQueue(l,r,force=false,overrideRGB){if(!DUAL.dev||!DUAL.dev.opened||!DUAL.link)return;
 const rgb=overrideRGB||dualLightColor(performance.now());const key=l.join(',')+'|'+r.join(',')+'|'+(rgb?rgb.join(','):'off'),now=performance.now();
 if(!force&&key===DUAL.last&&now-DUAL.lastAt<1400&&!DUAL.pending)return;
 if(!force&&DUAL.pending&&DUAL.pending.key===key)return;
 DUAL.pending={l,r,key,rgb};dualPump();
}
function dualClear(){DUAL.testUntil=0;dualQueue(DUAL_OFF,DUAL_OFF,true)}
async function dualOpen(dev){if(!dev||dev.vendorId!==0x054C||![0x0CE6,0x0DF2].includes(dev.productId))return false;
 if(DUAL.connecting)return false;DUAL.connecting=true;DUAL.error='';dualStatus();
 try{if(!dev.opened)await dev.open();
  let link=dualLink(dev);
  if(!link){try{await dev.receiveFeatureReport(0x05)}catch(e){}link=dualLink(dev)}
  if(!link)throw new Error('Protocolo HID USB/Bluetooth não identificado');
  if(link==='bluetooth')try{await dev.receiveFeatureReport(0x05)}catch(e){}
  DUAL.dev=dev;motionDualBind(dev);DUAL.link=link;DUAL.seq=0;DUAL.last='';DUAL.pending=null;
  // Await a valid write so authorization cannot falsely report success.
  const setup=dualPacket(DUAL_OFF,DUAL_OFF,null,true);await dev.sendReport(setup.id,setup.buffer);
  dualQueue(DUAL_OFF,DUAL_OFF,true);return true;
 }catch(e){dualFail(e);return false}finally{DUAL.connecting=false;dualStatus()}
}
async function dualReconnect(){if((!PAD.adaptive&&PAD.lightbar===false&&MOTION.mode!=='dual')||!navigator.hid||DUAL.connecting||(DUAL.dev&&DUAL.dev.opened))return false;
 try{const devices=await navigator.hid.getDevices();const dev=devices.find(d=>d.vendorId===0x054C&&[0x0CE6,0x0DF2].includes(d.productId));return dev?dualOpen(dev):false}
 catch(e){dualFail(e);return false}
}
async function dualChoose(){if(!navigator.hid){dualStatus();return false}
 try{ // Must execute requestDevice synchronously in a direct click/change gesture.
  const devices=await navigator.hid.requestDevice({filters:[{vendorId:0x054C,productId:0x0CE6},{vendorId:0x054C,productId:0x0DF2}]});
  return devices.length?dualOpen(devices[0]):false;
 }catch(e){if(e.name!=='NotFoundError')dualFail(e);else{DUAL.error='';dualStatus()}return false}
}
// Inspired by the feel of GTA V's PS5 DualSense, not a dump or clone of Rockstar calibration.
// Shot events are produced only after ammo is consumed; vehicle responses use existing telemetry.
function dualShot(kind){
 if(!PAD.adaptive||!PAD.on||!DUAL.dev||!DUAL.dev.opened)return;
 if(DUAL.shotType!==kind)DUAL.shotSeq=0;
 DUAL.shotType=kind;DUAL.shotAt=performance.now();DUAL.shotSeq++;
 // Fire feedback is not limited by the slower vehicle/idle poll. Keep HID writes serial.
 if(DUAL.shotAt-DUAL.lastTick>=50)dualTick(true);
}
function dualTick(shotEvent=false){if(DUAL.connecting)return;if((!PAD.adaptive&&PAD.lightbar===false)||!DUAL.dev||!DUAL.dev.opened||!DUAL.link)return;
 const now=performance.now();if(now-DUAL.lastTick<(shotEvent?50:90))return;DUAL.lastTick=now;
 let l=DUAL_OFF,r=DUAL_OFF;
 if(DUAL.testUntil>now){const f=Math.max(2,Math.round(6*PAD.triggerForce));l=dualFeedback(2,f);r=dualFeedback(2,f)}
 else if(!PAD.adaptive||document.hidden||!PAD.on||menuOpen||cfgOpen||cmdsOpen||!played||!running||BENCH.active||PL.dead){/* release */}
 else{const f=Math.max(1,Math.round(PAD.triggerForce*8));
  if(PL.car&&PL.car.alive){
   const c=PL.car,sp=Math.hypot(c.vx||0,c.vz||0),speed=Math.min(1,sp/Math.max(14,(c.t&&c.t.vmax)||32));
   const gas=Math.max(0,Math.min(1,PAD.r2||0)),brake=Math.max(0,Math.min(1,PAD.l2||0));
   const boat=!!(c.t&&c.t.boat),dirt=!!c.dirt,mud=Math.max(0,Math.min(1,c.mudG||0));
   const dmg=Math.max(0,Math.min(1,(100-(Number.isFinite(c.hp)?c.hp:100))/100));
   let gasForce=f*(boat?.35:.43)+(boat?.10:.21)*f*speed+f*.17*gas;
   let brakeForce=f*(boat?.31:.46)+f*.24*speed+f*.18*brake;
   if(c.nitro&&gas>.12)gasForce+=f*.13;
   // Heavy terrain / mud and low vehicle health provide a subtle intermittent pedal pulse.
   if(!boat&&gas>.22&&sp>3&&(dirt||mud>.2)&&Math.floor(now/180)%3===0)gasForce+=f*(.10+.1*mud);
   if(!boat&&gas>.28&&dmg>.55&&Math.floor(now/230)%4===0)gasForce+=f*.13*dmg;
   // Hard braking gets a light ABS-like flutter (not a solid motor lock).
   if(!boat&&brake>.7&&sp>9&&Math.floor(now/115)%2===0)brakeForce+=f*.19;
   const level=x=>Math.max(1,Math.min(8,Math.round(x)));
   r=dualFeedback(boat?4:3,level(gasForce));
   l=dualFeedback(boat?4:3,level(brakeForce));
   // Approximate upshift from telemetry; no physics or driving controls are changed.
   if(DUAL.carRef!==c){DUAL.carRef=c;DUAL.gear=-1;DUAL.gearPulseUntil=0}
   if(!boat&&sp>4){
    const g=Number.isFinite(c._audio284&&c._audio284.gear)?c._audio284.gear:Math.floor(sp/Math.max(9,((c.t&&c.t.vmax)||32)/5));
    if(DUAL.gear>=0&&g>DUAL.gear&&gas>.18&&now>DUAL.gearCooldown){DUAL.gearPulseUntil=now+130;DUAL.gearCooldown=now+650}
    DUAL.gear=g;
    if(now<DUAL.gearPulseUntil)r=dualFeedback(2,level(gasForce+f*.22));
   }else{DUAL.gear=-1;DUAL.gearPulseUntil=0}
  }else if(PL.heli){
   DUAL.carRef=null;DUAL.gear=-1;
   r=dualFeedback(4,Math.max(1,Math.round(f*(.38+.18*PAD.r2))));
   l=dualFeedback(4,Math.max(1,Math.round(f*(.35+.16*PAD.l2))));
  }else{
   DUAL.carRef=null;DUAL.gear=-1;
   if(GUN.has&&(GUN.ammo>0||now-DUAL.shotAt<240)){
    const w=GUN.w,age=now-DUAL.shotAt,active=DUAL.shotType===w&&age>=0&&age<(w==='rpg'?220:w==='magnum'?170:w==='smg'?115:105);
    const level=x=>Math.max(1,Math.min(8,Math.round(x)));
    // Resting notch is milder than the live shot/recoil. Each weapon has a distinct break point.
    if(w==='smg')r=active&&DUAL.shotSeq%2?dualWeapon(level(f*.78)):dualFeedback(3,level(f*.54));
    else if(w==='pistol')r=active?dualWeapon(level(f*.85)):dualFeedback(4,level(f*.68));
    else if(w==='magnum')r=active?dualWeapon(level(f)):dualFeedback(5,level(f*.91));
    else if(w==='rpg')r=active?dualWeapon(level(f)):dualFeedback(5,level(f*.88));
    else if(w==='grenade'||w==='remote'||w==='jammer')r=active?dualWeapon(level(f*.5)):dualFeedback(5,level(f*.36));
   }
  }
 }
 dualQueue(l,r);
}
if(navigator.hid){navigator.hid.addEventListener('disconnect',e=>{if(e.device===DUAL.dev){DUAL.dev=null;DUAL.link='';DUAL.last='';DUAL.pending=null;DUAL.testUntil=0;DUAL.error='';dualStatus()}});
 navigator.hid.addEventListener('connect',()=>{if(PAD.adaptive||MOTION.mode==='dual')dualReconnect()})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)dualQueue(DUAL_OFF,DUAL_OFF,true);else if(PAD.adaptive||MOTION.mode==='dual')dualReconnect()});
addEventListener('blur',()=>dualQueue(DUAL_OFF,DUAL_OFF,true));
addEventListener('pagehide',()=>dualQueue(DUAL_OFF,DUAL_OFF,true));

function padGetRaw(){const gs=navigator.getGamepads?navigator.getGamepads():[];if(PAD.idx>=0&&gs[PAD.idx])return gs[PAD.idx];for(const g of gs)if(g&&g.connected){PAD.idx=g.index;return g}return null}
/* v78: alguns navegadores/sistemas (Firefox, Linux com hid-playstation) entregam o DualSense/DualShock SEM o layout
   "standard": □/△ trocados, L2/R2 como eixos (-1..1), analógico direito nos eixos 3/4 e direcional como eixos 6/7.
   Aqui o controle é convertido para o layout padrão que o jogo inteiro usa (✕0 ○1 □2 △3 L1 4 R1 5 L2 6 R2 7 …). */
function padGet(){const g=padGetRaw();if(!g)return null;PAD.mapping=g.mapping||'';
 if(g.mapping==='standard'||!/dualsense|dualshock|wireless controller|054c|playstation|sony/i.test(g.id||'')||(g.axes||[]).length<6||(g.buttons||[]).length<13)return g;
 const rb=g.buttons,ax=g.axes,bt=(p,v)=>({pressed:!!p,value:v!=null?v:(p?1:0)}),trig=v=>{const t=Math.max(0,Math.min(1,(v+1)/2));return t},
  l2=Math.max(trig(ax[2]),rb[6]&&rb[6].pressed?1:0),r2=Math.max(trig(ax[5]),rb[7]&&rb[7].pressed?1:0),dx=ax[6]||0,dy=ax[7]||0;
 const B=[rb[0],rb[1],rb[3],rb[2],rb[4],rb[5],bt(l2>.35,l2),bt(r2>.35,r2),rb[8],rb[9],rb[11],rb[12],bt(dy<-.5),bt(dy>.5),bt(dx<-.5),bt(dx>.5),rb[10]||bt(false),rb[13]||bt(false)].map(b=>b&&b.pressed!==undefined?b:bt(false));
 return{id:g.id,index:g.index,connected:true,mapping:'standard*',buttons:B,axes:[ax[0]||0,ax[1]||0,ax[3]||0,ax[4]||0]}}
function padName(id){id=(id||'').toLowerCase();return /dualsense|0ce6|0df2/.test(id)?'DualSense':/dualshock|wireless controller|054c|playstation/.test(id)?'DualShock':/xbox|xinput|045e/.test(id)?'Xbox':'Controle'}
function rumble(s,w,ms,cont){if(!PAD.on||PAD.vib<=0)return;const g=padGet();if(!g)return;const now=performance.now();
 if(now>=PAD.until)PAD.cur=0;if(cont){if(now<PAD.until)return}else{if(s+w<PAD.cur*.6)return;PAD.until=now+ms;PAD.cur=s+w}
 const sm=clamp(s*PAD.vib,0,1),wm=clamp(w*PAD.vib,0,1);
 try{const va=g.vibrationActuator;if(va&&va.playEffect){va.playEffect('dual-rumble',{startDelay:0,duration:ms,strongMagnitude:sm,weakMagnitude:wm});return}
  const ha=g.hapticActuators&&g.hapticActuators[0];if(ha&&ha.pulse)ha.pulse(Math.max(sm,wm),ms)}catch(e){}}
function padStatus(){const el=$('#padStatus');if(!el)return;el.innerHTML=PAD.on?'<b style="color:var(--acc)">🎮 '+PAD.name+' conectado</b>':'Nenhum controle detectado. Conecte (USB ou Bluetooth) e <b>aperte qualquer botão</b>.'}
addEventListener('gamepadconnected',e=>{PAD.on=true;PAD.idx=e.gamepad.index;PAD.name=padName(e.gamepad.id);PAD.prev=(padGet()||e.gamepad).buttons.map(b=>b.pressed);if(e.gamepad.mapping!=='standard')console.log('[controle] mapeamento não-padrão:',e.gamepad.id,e.gamepad.buttons.length,'botões',e.gamepad.axes.length,'eixos');padStatus();toast('🎮 '+PAD.name.toUpperCase()+' CONECTADO<br><small style="font-size:11px;color:#fff">START: menu · R3: câmera · ? lista os botões</small>');setTimeout(()=>rumble(.5,.5,180),50)});
addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index!==PAD.idx)return;PAD.idx=-1;const g=padGet();PAD.on=!!g;if(g)PAD.name=padName(g.id);PAD.lx=PAD.ly=PAD.rx=PAD.ry=PAD.r2=PAD.l2=0;PAD.hand=PAD.nitro=PAD.firing=false;GUN.firing=false;padStatus();toast('🎮 CONTROLE DESCONECTADO')});
function padAxis(v){const a=Math.abs(v);if(a<PAD.dz)return 0;return Math.sign(v)*Math.min(1,(a-PAD.dz)/(1-PAD.dz))}
addEventListener('mousemove',()=>document.body.classList.remove('padnav'));addEventListener('keydown',e=>{if(e.code==='Tab'||e.code.startsWith('Arrow'))document.body.classList.add('padnav')});
function padDialog(){return onJoinVis()?$('#onJoin'):NEWS.open?$('#news'):AMMO.uiOpen?AMMO.panel:recordsOpen?$('#records'):SLOT.open?$('#slot'):TABLE_GAME.open?$('#tableGame'):MP.open?$('#modePick'):DEAL.open?$('#deal'):WARD.open?$('#ward'):cfgOpen?$('#cfg'):cmdsOpen?$('#cmds'):TUNE.open?$('#tune'):menuOpen?$('#menu'):null}
// v78: navegação ESPACIAL no controle (e setas do teclado na loja de armas). Antes a seta andava ±1 na ordem do DOM:
// em grades (menu 2×2, abas, rodapés de 2 colunas) "baixo" ia para o vizinho do lado e os botões pareciam pular
// alternados. Agora cada direção escolhe o elemento visível mais próximo naquele sentido (eixo principal + 2× desvio
// lateral); sem candidato naquele sentido, volta ao passo linear antigo (com volta ao início).
/* v3 r28: tela do online (personagem) também é navegável no controle */
function onJoinVis(){const d=document.getElementById('onJoin');return !!d&&!d.hidden}
/* v3 r28: ✕ num campo de texto com o controle abre o teclado na tela (MINIKEY); senha aparece como •••• */
function padTextKey(inp){const pw=inp.type==='password',mx=inp.maxLength>0?inp.maxLength:20;
 miniKeyShow({value:inp.value,max:mx,mask:pw,submit:v=>{inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}})}
function padIsText(e){return !!e&&e.tagName==='INPUT'&&/^(text|password|search|email|tel|url|)$/.test(e.type||'')}
/* cor (input color) no controle: ←/→ trocam entre cores prontas (o seletor nativo não abre no controle) */
const PAD_COLS=['#d62828','#ff8a1a','#f2c21a','#3ab36a','#2ac8c8','#2f6fd6','#7a4ad6','#ff6fae','#f2f2ee','#8a8a90','#1b1b1b','#8a5a3a'];
function padColorStep(inp,d){const v=(inp.value||'').toLowerCase();let i=PAD_COLS.indexOf(v);i=i<0?(d>0?0:PAD_COLS.length-1):(i+d+PAD_COLS.length)%PAD_COLS.length;inp.value=PAD_COLS[i];inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}
function padNavFocus(dlg,dir,vec){document.body.classList.add('padnav');const f=[...dlg.querySelectorAll('button,input,select,[tabindex],label.btn')].filter(e=>!e.disabled&&e.offsetParent!==null&&e.tabIndex>=0);if(!f.length)return;
 const cur=document.activeElement,i0=f.indexOf(cur);let pick=null;
 if(vec&&i0>=0&&dir){const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=1e9;
  for(const e of f){if(e===cur)continue;const q=e.getBoundingClientRect();if(!q.width&&!q.height)continue;
   const dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,along=dx*vec[0]+dy*vec[1];if(along<=4)continue;
   // sobreposição no eixo perpendicular conta como alinhado (desvio 0)
   const side=vec[0]?Math.max(0,Math.max(q.top,r.top)-Math.min(q.bottom,r.bottom)>0?Math.abs(dy):0):Math.max(0,Math.max(q.left,r.left)-Math.min(q.right,r.right)>0?Math.abs(dx):0);
   // desempate: mais alinhado ao centro e, empatado, ordem de leitura (esquerda/cima) — não a ordem do DOM
   const perp=vec[0]?Math.abs(dy):Math.abs(dx),score=along+side*4+perp*.05+(q.left+q.top)*.001 /* v78: peso 4 — prefere o que está na mesma linha/coluna (menu inicial: de GERAR CIDADE ← vai pro 7×7, não pro TELA CHEIA) */;if(score<best){best=score;pick=e}}
  // borda: dá a volta no espaço (o mais distante no sentido oposto, de preferência alinhado), não na ordem do DOM
  if(!pick){let bw=1e9;for(const e of f){if(e===cur)continue;const q=e.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,along=dx*vec[0]+dy*vec[1];if(along>=-4)continue;
   const gap=vec[0]?Math.max(q.top,r.top)-Math.min(q.bottom,r.bottom):Math.max(q.left,r.left)-Math.min(q.right,r.right),side=gap>0?(vec[0]?Math.abs(dy):Math.abs(dx)):0,score=side*4+along;if(score<bw){bw=score;pick=e}}}}
 if(!pick){let i=i0<0?0:(i0+dir+f.length)%f.length;if(i<0)i=0;pick=f[i]}
 pick.focus();if(pick.scrollIntoView)pick.scrollIntoView({block:'nearest'})}
/* v3 r17 · CONTROLES REFINADOS. △/Y = botão de contexto (como o ENTRAR/INTERAGIR do toque): veículo perto → entra/sai;
   loja, bar, mesa, TV, guarda-roupa, médico, aviso de ação → interage; senão enterExit (paraquedas, skate, portas).
   padActive(): o controle foi o último a ser usado (esconde os botões de toque e troca E/F/→ por △ nos avisos). */
function padActive(){return !!(PAD.on&&PAD.lastUse&&PAD.lastUse>=(HUDA.lastTouch||0)&&PAD.lastUse>=(KBM.t||0))}
const KBM={t:0};addEventListener('keydown',()=>{KBM.t=performance.now()},true);addEventListener('mousedown',()=>{KBM.t=performance.now()},true);
function padGlyph(i){const g=PAD.on?padGet():null,xb=g&&/xbox|xinput|microsoft/i.test(g.id||'');return xb?['A','B','X','Y'][i]:['✕','○','□','△'][i]}
function padCtxGlyph(h){const k='<kbd>'+padGlyph(3)+'</kbd>';return h.replace('<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>',k).replace('<kbd>F</kbd><kbd>→</kbd>',k)}
function ctxNearMode(){if(PL.car||PL.heli||PL.dead||(typeof PARA!=='undefined'&&PARA.active))return null;
 const vis=id=>{const e=document.getElementById(id);return !!e&&!e.hidden};
 const skRide=!!(typeof SKATE!=='undefined'&&SKATE.ride);
 let nearV=!PL.inside&&vis('prompt');if(!nearV&&!PL.inside){try{nearV=!!(heliNear()||(!skRide&&(CTX.skate||skNear())))}catch(e){}}
 if(nearV||skRide)return 'enter';
 let inter=(vis('ctxp')&&!CTX.skate)||['jailp','heistp','mallTag','tvp'].some(vis)||!!(CTX.shop||CTX.mall||CTX.club);
 if(!inter)try{inter=!!(wardNear()||medNear())}catch(e){}
 return inter?'interact':null}
function padTriAct(){if(ctxNearMode()==='interact'){initAudio();if(PL.inside==='jail')JAIL.click=performance.now();if(!medLoad())ctxAct(1);return}enterExit()}
function padPoll(dt){const g=PAD.on?padGet():null;if(!g){PAD.lx=PAD.ly=PAD.rx=PAD.ry=PAD.r2=PAD.l2=0;return}
 /* v3 r5: dois buffers alternados para botões (antes 2 arrays novos por quadro com controle ligado) */
 let B=PAD._ba||(PAD._ba=[]);if(B===PAD.prev)B=PAD._bb||(PAD._bb=[]);const V=PAD._bv||(PAD._bv=[]);{const bs=g.buttons,n=bs.length;B.length=n;V.length=n;for(let i=0;i<n;i++){const b=bs[i];B[i]=b.pressed;V[i]=b.value||0}}
 const P0=PAD.prev||B,pr=i=>B[i]&&!P0[i];PAD.prev=B;
 if(TVC.open){tvcPad(B,pr,g,dt);return} /* r68: TV de recursos */
 if(typeof CAMP!=='undefined'&&CAMP.intro&&!menuOpen){if(CAMP.intro.t>.6&&(pr(0)||pr(1)))campIntroEnd();return}
 if((STORYEND.active||STORYINTRO.active)&&!menuOpen){
  if(pr(9)){if(played)openMenu();return}
  if(pr(0)||pr(1))storySkipPart();return;
 }
 /* v78: na cela, SEGURAR ✕/□/R2 cava (antes só o toque contava; o teclado cava segurando E pela repetição da tecla) */if(PL.inside==='jail'&&(B[7]||B[2]||B[0]||V[7]>.35))JAIL.click=performance.now();if(!B[10]&&P0[10])hornUp('pad');
 const ax=g.axes||[];PAD.lx=padAxis(ax[0]||0);PAD.ly=padAxis(ax[1]||0);PAD.rx=padAxis(ax[2]||0);PAD.ry=padAxis(ax[3]||0);
 PAD.r2=V[7]>.06?V[7]:0;PAD.l2=V[6]>.06?V[6]:0;
 if(PAD.r2||PAD.l2||Math.abs(PAD.lx)+Math.abs(PAD.ly)+Math.abs(PAD.rx)+Math.abs(PAD.ry)>.25||B.indexOf(true)>=0)PAD.lastUse=performance.now(); /* v3 r17: controle em uso (esconde o toque, troca a tecla nos avisos) */
 // --- menus e janelas ---
 if(menuOpen&&(STORYINTRO.active||STORYEND.active)&&pr(0)&&document.activeElement===$('#storySkip')){$('#storySkip').click();return}
 if(MINIKEY.open){
  if(pr(1)){miniKeyClose(false);return;}if(pr(3)){miniKeyClose(true);return;}
  const buttons=[...MINIKEY.el.querySelectorAll('button')];let step=0;PAD.navT=(PAD.navT||0)-dt;
  if(pr(12))step=-10;else if(pr(13))step=10;else if(pr(14))step=-1;else if(pr(15))step=1;
  else if(PAD.navT<=0){if(PAD.ly<-.6)step=-10;else if(PAD.ly>.6)step=10;else if(PAD.lx<-.6)step=-1;else if(PAD.lx>.6)step=1;if(step)PAD.navT=.2;}
  if(step){let i=buttons.indexOf(document.activeElement);if(i<0)i=0;let next=(i+(step>0?1:-1)+buttons.length)%buttons.length;
   if(Math.abs(step)===10){const r=buttons[i].getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let score=Infinity;
    buttons.forEach((b,j)=>{const q=b.getBoundingClientRect(),qx=q.left+q.width/2,qy=q.top+q.height/2,dy=(qy-cy)*Math.sign(step);if(dy<5)return;const v=dy*100+Math.abs(qx-cx);if(v<score){score=v;next=j;}});
    if(score===Infinity)next=i;
   }buttons[next].focus();buttons[next].scrollIntoView({block:'nearest'});
  }
  if(pr(0)&&buttons.includes(document.activeElement))document.activeElement.click();return;
 }
 /* v78: MODO FOTO no controle — LS move o foco, RS gira, L2/R2 afasta/aproxima, L1/R1 FOV, ↑/↓ altura,
    ✕ tira a foto, □ filtro, △ esconde/mostra a interface, ○/OPTIONS sai. */
 if(PHOTO.on){if(pr(1)||pr(9)){if($('#photoUI').classList.contains('ui-off'))$('#photoUI').classList.remove('ui-off');else photoExit();return}
  if(pr(0))photoShot();if(pr(2)){PHOTO.f=(PHOTO.f+1)%PHOTO_FILTERS.length;photoFilterSync()}if(pr(3))$('#photoUI').classList.toggle('ui-off');
  const k=PHOTO.keys;for(const c of ['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','KeyR','KeyV'])if(k.has('pad'+c)){k.delete('pad'+c);k.delete(c)}
  const hold=(c,on)=>{if(on){k.add(c);k.add('pad'+c)}};hold('KeyW',PAD.ly<-.35);hold('KeyS',PAD.ly>.35);hold('KeyA',PAD.lx<-.35);hold('KeyD',PAD.lx>.35);
  hold('KeyQ',PAD.l2>.2);hold('KeyE',PAD.r2>.2);hold('KeyR',B[12]);hold('KeyV',B[13]);
  if(PAD.rx||PAD.ry){PHOTO.yaw-=PAD.rx*dt*2.2*PAD.sens;PHOTO.pitch=clamp(PHOTO.pitch+PAD.ry*(PAD.inv?-1:1)*dt*1.6*PAD.sens,-.15,1.45)}
  if(B[4]||B[5]){PHOTO.fov=clamp(PHOTO.fov+(B[4]?-30:30)*dt,20,90);const f=$('#phFov');if(f)f.value=Math.round(PHOTO.fov)}
  return}
 const dlg=padDialog();
 if(EMOKB.open){emoKbPad(pr);return} /* v3r2: teclado de emojis por cima do guarda-roupa/skate shop */
 if(pr(9)){if(onJoinVis()&&!played){onJoinClose();return}if(PHOTO.on)photoExit();else if(NEWS.open)newsClose();else if(AMMO.uiOpen)ammoClose();else if(recordsOpen)closeRecords();else if(cfgOpen)closeCfg();else if(cmdsOpen)closeCmds();else if(TUNE.open)closeTune();else if(SLOT.open)slotClose();else if(TABLE_GAME.open)tableGameClose();else if(MP.open)modePickClose();else if(DEAL.open)dealClose();else if(WARD.open)closeWard(false);else if(NAV.open)closeMap();else if(menuOpen){if(played)closeMenu();else $('#play').click()}else if(played)openMenu();return}
 if(POOL.on){poolPad(pr,dt);return}if(DICE.on){dicePad(pr);return}if(SKATE.ui){skUiPad(pr,dt);return}
 if(NAV.open){cheatPad(pr);if(pr(3))mapIntToggle(); /* v79r3: Y/△ alterna interior ⇄ cidade */
  if(NAV.inMode){const zt=((PAD.r2||0)-(PAD.l2||0))+(Math.abs(PAD.ry||0)>.25?-PAD.ry:0);if(Math.abs(zt)>.12)mapZoomAt(innerWidth/2,innerHeight/2,Math.exp(zt*dt*1.8));if((NAV.zoom||1)>1.001&&Math.hypot(PAD.lx||0,PAD.ly||0)>.15){const v=bigView();NAV.cx=(NAV.cx||0)+PAD.lx*420*dt/v.sc;NAV.cy=(NAV.cy||0)+PAD.ly*420*dt/v.sc;drawBigmap()}if(pr(1)||pr(8)||pr(17))closeMap();return}
  if(!NAV.cur){const p=PL.car||PL;NAV.cur={x:p.x,z:p.z}}const E=city.ext,sp=E*.55*dt;const zk=(NAV.zoom||1);NAV.cur.x=clamp(NAV.cur.x+PAD.lx*sp/zk,-MOFF,E+MOFF);NAV.cur.z=clamp(NAV.cur.z+PAD.ly*sp/zk,-MOFF,E+MOFF);{const zt=((PAD.r2||0)-(PAD.l2||0))+(Math.abs(PAD.ry||0)>.25?-PAD.ry:0);if(Math.abs(zt)>.12)mapZoomAt(innerWidth/2,innerHeight/2,Math.exp(zt*dt*1.8))} /* v78: como no GTA V — RT aproxima, LT afasta (segurar); analógico direito cima/baixo também */
  if((NAV.zoom||1)>1.001){NAV.cx=NAV.cur.x+MOFF;NAV.cy=NAV.cur.z+MOFF}
  {const v=bigView();NAV.hover={x:v.ox+(NAV.cur.x+MOFF)*v.sc,y:v.oy+(NAV.cur.z+MOFF)*v.sc}}
  if(pr(0)){const v=bigView(),cx=v.ox+(NAV.cur.x+MOFF)*v.sc,cy=v.oy+(NAV.cur.z+MOFF)*v.sc;if(mapIconsAt(cx,cy).length)mapPickAt(cx,cy);else if(mapInside(NAV.cur.x,NAV.cur.z)){setMarker(NAV.cur.x,NAV.cur.z);drawBigmap()}}if(pr(1)||pr(8)||pr(17))closeMap();return}
 if(dlg){if(pr(0)&&NEWS.open){newsClose();return}if(pr(1)){if(dlg.id==='onJoin')onJoinClose();else if(NEWS.open)newsClose();else if(AMMO.uiOpen)ammoClose();else if(recordsOpen)closeRecords();else if(cfgOpen)closeCfg();else if(cmdsOpen)closeCmds();else if(TUNE.open)closeTune();else if(SLOT.open)slotClose();else if(TABLE_GAME.open)tableGameClose();else if(MP.open)modePickClose();else if(DEAL.open)dealClose();else if(WARD.open)closeWard(false);else if(menuOpen&&played)closeMenu();return}
  {const ae0=document.activeElement,adj=ae0&&(ae0.type==='range'||ae0.tagName==='SELECT'||ae0.type==='color'),inD=ae0&&dlg.contains(ae0)&&ae0!==dlg;
   // analógico esquerdo também navega (com repetição) e ajusta sliders/listas
   PAD.navT=(PAD.navT||0)-dt;let sv=0,sh=0;if(PAD.navT<=0){if(PAD.ly>.6)sv=1;else if(PAD.ly<-.6)sv=-1;if(PAD.lx>.6)sh=1;else if(PAD.lx<-.6)sh=-1;if(sv||sh)PAD.navT=.2}else if(Math.abs(PAD.ly)<.3&&Math.abs(PAD.lx)<.3)PAD.navT=0;
   const down=pr(13)||sv>0||(!adj&&(pr(15)||sh>0)),up=pr(12)||sv<0||(!adj&&(pr(14)||sh<0));
   if(!inD&&(down||up||pr(0))){padNavFocus(dlg,0);return}
   {const right=!adj&&(pr(15)||sh>0),left=!adj&&(pr(14)||sh<0),vd=pr(13)||sv>0,vu=pr(12)||sv<0;
     if(vd)padNavFocus(dlg,1,[0,1]);else if(vu)padNavFocus(dlg,-1,[0,-1]);else if(right)padNavFocus(dlg,1,[1,0]);else if(left)padNavFocus(dlg,-1,[-1,0])}
   if(adj&&ae0.tagName==='SELECT'&&(pr(14)||pr(15)||sh)){const d=(pr(15)||sh>0)?1:-1,n=ae0.options.length;let i=ae0.selectedIndex;do{i=(i+d+n)%n}while(ae0.options[i].disabled&&i!==ae0.selectedIndex);ae0.selectedIndex=i;ae0.dispatchEvent(new Event('input',{bubbles:true}));ae0.dispatchEvent(new Event('change',{bubbles:true}))}
   if(adj&&ae0.type==='color'&&(pr(14)||pr(15)||sh))padColorStep(ae0,(pr(15)||sh>0)?1:-1);
   if(adj&&ae0.type==='range'&&sh){const st=(+ae0.max-+ae0.min)/20;ae0.value=+ae0.value+(sh>0?st:-st);ae0.dispatchEvent(new Event('input',{bubbles:true}));ae0.dispatchEvent(new Event('change',{bubbles:true}))}}
  const ae=document.activeElement;if(ae&&ae.type==='range'&&(pr(14)||pr(15))){const st=(+ae.max-+ae.min)/20;ae.value=+ae.value+(pr(15)?st:-st);ae.dispatchEvent(new Event('input',{bubbles:true}));ae.dispatchEvent(new Event('change',{bubbles:true}))}
  if(pr(0)&&ae&&ae!==document.body){if(padIsText(ae))padTextKey(ae);else if(ae.type==='color')padColorStep(ae,1);else if(ae.htmlFor==='loadFile'){ae.click();toast('ESCOLHA O ARQUIVO .PSAVE<br><small style="font-size:11px;color:#fff">o navegador só abre a janela de arquivo com mouse ou toque</small>')}else if(ae.type==='checkbox'){ae.click()}else if(ae.click)ae.click()} /* v78: botão A no CARREGAR SAVE: navegador bloqueia o seletor de arquivo sem clique real — avisa */
  return}
 if(!running||!played)return;
 if(TVM.on){if(pr(3)||pr(1))tvOff();else if(pr(14)||pr(15))tvChangeChannel(pr(14)?-1:1);return}
 if(DLG.on){if(pr(0))dlgNext();if(pr(1))dlgClose(-1);if(pr(12))dlgMove(-1);if(pr(13))dlgMove(1);PAD.lx=PAD.ly=0;return}
 PAD.upT=B[12]?(PAD.upT||0)+(dt||.016):0;if(!B[12])PAD.upCtos=false;if(PHONE.open&&PAD.upT>.5&&!PAD.upCtos&&CTOS.installed&&(PHONE.scr==='home'||PHONE.scr==='apps')){PAD.upCtos=true;PHONE.scr='ctos';PHONE.zone='scr';PHONE.si=0;phoneDraw()}
 if(PHONE.open){if(pr(12))phoneNav(0,-1);if(pr(13))phoneNav(0,1);if(pr(14))phoneNav(-1,0);if(pr(15))phoneNav(1,0);if(pr(0))phoneOK();if(pr(1))phoneBack();PAD.lx=PAD.ly=0;return}
 cheatPad(pr);
 initAudio();
 const car=PL.car;
 // --- rodas (segurar L1 a pé / ← no carro) ---
 if(WHL.open&&WHL.src==='pad'){if(WHL.open==='wpn'){const dl=!!B[14],dr=!!B[15];if(dl&&!WHL.dl)wheelPage(-1);if(dr&&!WHL.dr)wheelPage(1);WHL.dl=dl;WHL.dr=dr} /* v78: direcional ←/→ troca a página da fatia */const sx=car?PAD.rx:(PAD.rx||PAD.lx),sy=car?PAD.ry:(PAD.ry||PAD.ly);if(Math.hypot(sx,sy)>.45){WHL.vx=sx*100;WHL.vy=sy*100;wheelPick()}const held=WHL.open==='wpn'?B[4]:B[14];if(!held)wheelClose(true);return}
 // --- câmera (analógico direito) ---
 const rx=PAD.rx,ry=PAD.ry*(PAD.inv?-1:1),sn=PAD.sens;
 if(rx||ry){if(camMode==='fps'){if(PL.car||ONLINE.ride){LOOK.yaw+=rx*dt*2.6*sn;LOOK.pitch=clamp(LOOK.pitch+ry*dt*1.6*sn,-.45,1.1);LOOK.t=0}else{PL.yaw-=rx*dt*2.8*sn;PL.pitch=clamp(PL.pitch-ry*dt*2*sn,-1.35,1.35)}}
  else if(VIEW.orbit)ORB.yaw-=rx*dt*2*sn}
 // --- botões (layout GTA V) ---
 if(pr(3)){if(ONLINE.on&&!PL.car&&!ONLINE.ride&&netPeerCarNear(4.5))ONLINE.padHold=simT;else if(!taxiHoldStart('pad')){padTriAct();radioKick()}}if(ONLINE.padHold!=null){if(!B[3]){ONLINE.padHold=null;enterExit()}else if(simT-ONLINE.padHold>.45){ONLINE.padHold=null;netRideTry()}}
 if(pr(8)||pr(17))openMap();
 if(B[10]&&B[11]&&(pr(10)||pr(11))){specSet(!SPEC.on);PAD.r3c=true}else if(pr(11))PAD.r3c=false;if(!B[11]&&P0[11]){if(!PAD.r3c)cycleView();PAD.r3c=false} /* v3 r17: câmera ao soltar R3, para L3+R3 não trocar a câmera junto */
 const dnPump=false; /* v3 r17: na bomba ↓ só lavava o carro · v3 r58: lavar foi para o lava-jato, ↓ volta ao normal */
 if(B[13]&&!dnPump){CHAR.dpadT+=dt;if(CHAR.dpadT>.35&&!CHAR.open)charOpen('pad')}else{if(P0[13]&&!B[13]&&!dnPump&&CHAR.dpadT<=.35&&!CHAR.open)misStart();CHAR.dpadT=0}
 if(CHAR.open&&CHAR.src==='pad'){const sx=PAD.lx||PAD.rx||(B[14]?-1:B[15]?1:0);if(Math.abs(sx)>.4){CHAR.sel=sx<0?0:1;charSelPaint()}if(!B[13])charClose(true)}
 if(PL.heli){
  // Helicoptero: LS horizontal = virar, R2 = acelerar/decolar, L2 = reduzir,
  // Y = pousar/desembarcar (tratado acima via enterExit), X = paraquedas.
  PAD.hand=PAD.nitro=PAD.firing=false;PAD.run=false;GUN.firing=false;
  if(pr(2)){const h=HELI.cur;if(h&&h.phase!=='ground'&&h.y>(h.landY!=null?h.landY:groundY(h.x,h.z)+HELI_SK)+14)heliJump()}
  if(pr(12))phoneToggle();
  if(pr(14))wheelOpen('radio','pad');
  return;
 }
 if(car){
  if(CTX.car){if(pr(2))ctxAct(1);if(pr(1))ctxAct(2)} /* r61: ▼ lava o carro · v3 r17: ✕ ficou só no nitro (antes abastecia e acionava o nitro juntos) */
  if(pr(14))wheelOpen('radio','pad');if(pr(15))HEAD.mode=headOn()?'off':'on';
  if(pr(1)&&!CTX.car)gunCycle(1); // v275: botão B/○ alterna arma no veículo
  if(pr(12))phoneToggle();
  PAD.hand=B[5]&&!B[4];PAD.nitro=B[0]&&!CTX.car;if(pr(10))hornDown('pad')}
 else{PAD.hand=PAD.nitro=false;const modern=PAD.scheme==='modern';if(pr(modern?0:2))plJump();if(modern&&pr(2))playerPunch(false);
  // v78: X (PS) / A (Xbox) = INTERAGIR quando há algo por perto (loja, shopping, bar, guarda-roupa, caça-níquel, mesa, médico…);
  // segurar continua sendo correr. A seta direita do direcional segue funcionando.
  /* v78: X/A = MESMA ação do E do teclado (ctxAct(1): vendedores, bares, cela, cofres, mesas…). Antes chamava enterExit (=F),
     que não abre balcão de loja, e um comentário // engolia o PAD.run abaixo (correr segurando X não funcionava). */
  /* v3 r17: interagir saiu do ✕ (toque curto disparava ação sem querer ao começar a correr): agora é △ (padTriAct) ou →. */
  if(modern){if(pr(10)&&!B[11])PAD.runLatch=!PAD.runLatch;if(Math.hypot(PAD.lx,PAD.ly)<.2)PAD.runLatch=false}else PAD.runLatch=false;
  PAD.run=Math.hypot(PAD.lx,PAD.ly)>.9||(!modern&&B[0])||B[10]||PAD.runLatch;
  if(pr(1))playerPunch(false);if(pr(4))wheelOpen('wpn','pad');
  if(pr(15)){if(medNear())medLoad();else if(CTX.shop||CTX.mall||CTX.club||wardNear()||PL.inside==='heist'||PL.inside==='pawn'||(PL.inside==='ammo'&&ammoCounterNear())||(bankCounterNear()&&!BANK.rob)||slotNear()>=0||casinoTableNear())ctxAct(1);else taxiCall()}if(pr(14)){if(PLAYER_PAL.headphone)wheelOpen('radio','pad');else gunCycle(-1)}if(pr(12))phoneToggle()}
 const fb=car?((B[4]&&B[5])||(B[2]&&!CTX.car)):V[7]>.35,fbP=car?((B[4]&&pr(5))||(pr(2)&&!CTX.car)):(V[7]>.35&&!PAD.firing);
 if(fb&&!PAD.firing&&fbP){PAD.firing=true;if(GUN.has){GUN.firing=true;playerShoot(camMode==='top')}else if(!car)playerPunch(false)}
 else if(!fb&&PAD.firing){PAD.firing=false;GUN.firing=false}
 // --- vibrações contínuas somente para terreno, nitro e agua; motor da moto nao vibra sozinho ---
 PAD.contT-=dt;if(PAD.contT<=0&&car&&car.alive){PAD.contT=.1;const sp=Math.hypot(car.vx,car.vz);let s=0,w=0;
  if(car.dirt&&sp>3){w+=Math.min(.32,.08+sp*.012);s+=Math.min(.12,sp*.004)}
  if(car.nitro){w+=.35;s+=.1}
  if(car.type==='boat'&&sp>2){s+=.06;w+=.05}
  if(s>0||w>0)rumble(s,w,140,true)}}

