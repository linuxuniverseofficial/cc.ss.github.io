'use strict';
/* Coastal Chaos · js/39-online.js — Modo online.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v2 r5 · MODO ONLINE (estilo SA-MP) =================
   Servidor: online/api.php (Apache+PHP+SQLite). Sem conexão persistente: netLoop faz um POST ~6×/s com o estado do jogador
   e recebe o dos outros. A cidade sai da seed do dia (igual para todos). Cada jogo só tem os SEUS NPCs: no online trânsito,
   pedestres e polícia ficam desligados (cidade vazia, como no SA-MP); só os jogadores são sincronizados.
   Outros jogadores = ped 'duoFollow' (p.net) com a roupa deles; no carro = cópia local (c.net, mode 'net', sem física).
   Dano: quem acerta manda {hit}; a vítima aplica no próprio jogo e avisa a morte (kill feed). Sem save e sem cheats. */
var ONLINE={on:false,url:'online/api.php',id:0,token:'',name:'',me:null,since:0,peers:new Map(),out:[],dmg:new Map(),lookStr:'',lastOk:0,fail:0,
 chatOpen:false,lastHitBy:0,lastHitT:-99,wasDead:false,tod:null,stopped:false,count:0,
 /* r14: mundo compartilhado */ws:0,cars:new Map(),pk:new Set(),pkRec:new Map(),drops:new Map(),drv:null,drvCar:null,carN:0,cityRef:null,ride:0,jack:null,rejoining:false,jl:null};
/* v2 r8: campo SERVIDOR. Vazio = Automático (o api.php do próprio site). Aceita "192.168.0.10:8080", "meuhost.com", URL completa da pasta ou do api.php.
   Sem esquema usa o mesmo do site (página https não fala com servidor http: o navegador bloqueia). */
function netSrvUrl(v){v=String(v||'').trim();if(!v)return 'online/api.php';if(!/^https?:\/\//i.test(v))v=location.protocol+'//'+v;
 try{const u=new URL(v);if(!/\.php$/i.test(u.pathname)){u.pathname=u.pathname.replace(/\/+$/,'')+(/\/online$/i.test(u.pathname.replace(/\/+$/,''))?'/api.php':'/online/api.php')}return u.toString().replace(/\?.*$/,'')}catch(e){return 'online/api.php'}}
/* r14: 404/403 = endereço errado → sugere digitar outro servidor */
function netSrvErr(st){const custom=!!String($('#onSrv').value||'').trim();if(st===404||st===403)return custom?'SERVIDOR NÃO ENCONTRADO · CONFIRA O ENDEREÇO OU DIGITE OUTRO':'SEM SERVIDOR NESTE SITE · DIGITE UM EM SERVIDOR';return custom?'SERVIDOR NÃO RESPONDE':'SEM SERVIDOR NESTE SITE · USE O CAMPO SERVIDOR'}
function netSrvInfo(){const url=netSrvUrl($('#onSrv').value);ONLINE.url=url;$('#onInfo').textContent=translatePlain('CONECTANDO…');let st=0;
 fetch(url+'?a=info',{cache:'no-store'}).then(r=>{st=r.status;return r.json()}).then(r=>{if(!r.ok)throw 0;$('#onInfo').textContent=translatePlain('SESSÃO DE HOJE')+' · '+r.players+'/'+r.max+' '+(S.lang==='en'?'players':'jogadores');netRankPaint(r.rank,r.tit)}).catch(()=>{$('#onInfo').textContent=translatePlain(netSrvErr(st));netRankPaint(null)})}
/* v3 r38: proteção ao renascer — NET_PROT s imortal (dano de jogador, atropelamento, explosão, queda: killPlayer devolve a vida)
   e semitransparente para todos (estado s.g=1; o servidor também não conta a morte nesse tempo). Acaba antes se ele atacar outro jogador. */
const NET_PROT=15;
function netProt(){return ONLINE.on&&simT<(ONLINE.protT||0)}
function netProtStart(){ONLINE.protT=simT+NET_PROT}
function netProtEnd(){ONLINE.protT=0}
/* sprite meio transparente: mesmo truque do fantasma da Maskara (alphaTest baixo enquanto a opacidade < 1, depois volta a .5) */
function netGhost(sp,sh,on){if(!sp||!sp.material)return;const m=sp.material;
 if(on){if(!sp.netGhost){sp.netGhost=true;m.alphaTest=.02;m.needsUpdate=true}m.opacity=.42}
 else if(sp.netGhost){sp.netGhost=false;m.opacity=1;m.alphaTest=.5;m.needsUpdate=true}}
function netProtFrame(){const on=netProt()&&!PL.dead;netGhost(PL.sp,PL.sh,on);
 if(on&&!ONLINE.protTo){ONLINE.protTo=1;toast(netT('PROTEGIDO','PROTECTED')+'<br><small style="font-size:11px;color:#fff">'+NET_PROT+' s</small>')}
 if(!on&&ONLINE.protTo){ONLINE.protTo=0;if(!PL.dead)toast(netT('PROTEÇÃO ACABOU','PROTECTION OVER'))}}
/* v3 r38: estatísticas do ranking que só este jogo vê (carros roubados, tempo procurado, batidas): manda o que mudou desde o último tick */
function netStatsOut(){const B=ONLINE.stB,j=STATS.stolen|0,w=+STATS.wanted||0,c=ONLINE.crN|0;
 if(!B||j<B.j||w<B.w){ONLINE.stB={j,w,c};return}const dj=Math.min(3,j-B.j),dw=Math.min(6,w-B.w),dc=Math.min(3,c-B.c);
 if(dj>0||dw>=.5||dc>0){ONLINE.out.push({k:'st',j:dj,w:+dw.toFixed(2),c:dc});B.j+=dj;B.w+=dw;B.c+=dc}}
/* chamado pelo impact() (js/20): batida do meu carro com força */
function netCrash(c,v){if(ONLINE.on&&c===PL.car&&v>9&&simT>(ONLINE.crT||0)){ONLINE.crT=simT+2;ONLINE.crN=(ONLINE.crN||0)+1}}
/* v3 r38: títulos do ranking (chave do servidor = categoria + 0/1 quando há dois) */
const NET_TIT={k0:['Exterminador de Bairro','Neighborhood Exterminator'],k1:['Ceifador da Orla','Boardwalk Reaper'],j0:['Mão Leve','Light Fingers'],j1:['Rei do Desmanche','Chop Shop King'],
 d0:['Saco de Pancada','Punching Bag'],d1:['Usuário Premium do Hospital','Hospital Premium Member'],w0:['Tá devendo pensão','Dodging Child Support'],c0:['Lataria de Papel','Paper Bodywork'],
 m0:['Magnata','Tycoon'],h0:['Clonador de Cartão','Card Cloner'],s0:['Duro de Matar','Die Hard']};
const NET_TIT_WHY={k:['mais abates','most kills'],j:['mais carros roubados','most cars stolen'],d:['mais mortes','most deaths'],w:['mais tempo procurado','most time wanted'],c:['mais batidas','most crashes'],m:['mais dinheiro','richest'],h:['mais hacks de Pix','most Pix hacks'],s:['mais abates sem morrer','longest kill streak']};
/* v3 r38: ranking na tela de entrada (top 10 por abates, guardado na conta pelo servidor). null = sem servidor (some); servidor antigo não manda rank (some) */
function netRankPaint(rk,tit){const box=$('#onRank');if(!box)return;if(!Array.isArray(rk)){box.hidden=true;box.innerHTML='';$('#onJoin').classList.remove('rk');return}
 const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),me=String($('#onName').value||'').trim().toLowerCase();
 let h='<div class="rkH"><b>🏆 '+netT('RANKING','RANKING')+'</b><em>'+netT('abates/mortes','kills/deaths')+'</em></div>';
 h+='<div class="rkL">';if(!rk.length)h+='<p class="rkE">'+netT('Ninguém pontuou ainda','Nobody has scored yet')+'</p>';
 else{const T=new Map();for(const t of Array.isArray(tit)?tit:[]){const L=NET_TIT[t.t];if(!L)continue;const key=String(t.n).toLowerCase();if(!T.has(key))T.set(key,{n:t.n,l:[]});T.get(key).l.push('<u title="'+esc(netT(...NET_TIT_WHY[t.t[0]]))+'">'+esc(netT(...L))+'</u>')}
  const row=(r,pos,cls)=>{const key=String(r.n).toLowerCase(),t=T.get(key);T.delete(key);return '<li class="'+cls+(me&&key===me?' me':'')+'"><i>'+pos+'</i><b>'+esc(r.n)+(r.on?'<s title="'+netT('online agora','online now')+'"></s>':'')+(t?'<small>('+t.l.join(', ')+')</small>':'')+'</b><em>'+(r.k==null?'':(r.k|0)+'/'+(r.d|0))+'</em></li>'};
  h+='<ol>'+rk.slice(0,10).map((r,i)=>row(r,i+1,i<3?'p'+(i+1):'')).join('')+'</ol>';
  /* quem tem título e está fora do top 10 aparece embaixo, sem posição */
  if(T.size)h+='<ol class="rkT">'+[...T.values()].map(t=>row({n:t.n},'★','')).join('')+'</ol>'}
 box.innerHTML=h+'</div>';box.hidden=false;$('#onJoin').classList.add('rk')}
const NET_CARS=['sedan','sports','hatch','suv','pickup','van','wagon','crossover','mini','roadster','conv','taxi','moto'];
function netLookOf(pal){const o={};for(const k in pal){const v=pal[k];if(v===null||['string','number','boolean'].includes(typeof v))o[k]=v}o.pack=false;return o}
function netLook(){return netLookOf(PLAYER_PAL)}
/* r52: cada jogador diz em que mundo está (moderno, synthwave, invertido, Point Haze). Quem está no MESMO mundo se vê;
   o mundo compartilhado (carros do servidor, coletáveis, drops) continua só no moderno (netWorldOk). */
function netWorldKey(){return city&&city.haze?'haze':(S.style||'modern')}
function netTransit(){return !!(TIMEJUMP.busy||HAZE.switching||INVERT.switching)}
function netHidden(){return !!PL.inside||netTransit()}
function netAway(){return netWorldKey()!=='modern'}
function netPeerShown(s){return !!s&&!s.w&&(s.wk||'modern')===netWorldKey()}
function netWorldOk(){return S.style==='modern'&&!city.haze&&!HAZE.switching&&!INVERT.switching&&!TIMEJUMP.busy}
function netState(){const c=PL.car,s={x:+PL.x.toFixed(2),z:+PL.z.toFixed(2),f:+Math.atan2(PL.face[1],PL.face[0]).toFixed(3),m:Math.hypot(PL.vx||0,PL.vz||0)>.4?1:0,st:PL.dead?'dead':ONLINE.ride?'ride':c?'car':'foot',w:netHidden()&&!(PL.inside==='backrooms'&&!BR.busy)?1:0,wk:PL.inside==='backrooms'?'backrooms':netWorldKey()};if(netTransit())s.tj=1;if(netProt())s.g=1; /* r14: nas Backrooms aparece para quem também está lá */
 if(ONLINE.ride){s.r=ONLINE.ride;s.rt=ONLINE.rideT||0}if(PL.inside&&PL.inside!=='backrooms')s.in=1;
 if(c&&!c.t.boat){s.c={t:c.type,col:c.color,pl:c.plate||'',x:+c.x.toFixed(2),z:+c.z.toFixed(2),a:+c.a.toFixed(3),v:+(c.fwd||0).toFixed(2),f:c.onFire||!c.alive?1:0};if(c.neon&&c.neonCol)s.c.ne=c.neonCol;if(c.spotId)s.c.sid=c.spotId;netCarDmgOut(c,s.c)}return s}
function netPost(a,body){return fetch(ONLINE.url+'?a='+a,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body),cache:'no-store'}) /* text/plain = pedido "simples": servidor em outro endereço não precisa de preflight CORS */.then(r=>r.json().catch(()=>({ok:false,http:r.status,err:netSrvErr(r.status)})))}
/* ---------- tela de entrada: personagem (Nathan ou Claire) + roupas, exportar/importar ---------- */
const NET_BASE0={art:null,cap:'#d62828',capDark:null,skin:'#f1c27d',hair:'#4a2a12',shirt:'#2f6fd6',pants:'#2b3550',swim:null,headphone:null,bag:null,pack:false,shoes:'#1b1b1b',belt:'#3a2a1a',stripe:null,glasses:null,necklace:null};
const NET_WEAR=['shirt','art','pants','shoes','cap','glasses','necklace','belt'];
/* rótulos curtos: tradução local (chave curta no LANG_EN muda outras frases) */
const NET_WEAR_T={shirt:['CAMISA','SHIRT'],art:['ESTAMPA','PRINT'],pants:['CALÇA','PANTS'],shoes:['CALÇADO','SHOES'],cap:['BONÉ','CAP'],glasses:['ÓCULOS','GLASSES'],necklace:['COLAR','NECKLACE'],belt:['FIVELA','BUCKLE']},NET_ART_T={bolso:['BOLSO','POCKET'],botoes:['BOTÕES','BUTTONS'],listras:['LISTRAS','STRIPES'],estampa:['ESTAMPA','PRINT']};
function netT(pt,en){return S.lang==='en'?en:pt}
function netBase(g){return g?{...LUCIA_PAL,pack:false}:{...NET_BASE0}}
function onJl(){if(!ONLINE.jl)ONLINE.jl={g:0,pal:netBase(0)};return ONLINE.jl}
function onWearValid(k,c){return !!WEAR_PAL[k]&&(WEAR_PAL[k].includes(c)||(k==='art'&&typeof c==='string'&&c.startsWith('e:')&&emoOk(c.slice(2))))} /* v3 r28: estampa emoji ('e:<emoji>', só da lista do teclado) */
function onJlSet(o){const g=o&&o.g===1?1:0,pal=netBase(g);if(o&&o.pal)for(const k of NET_WEAR)if(k in o.pal&&onWearValid(k,o.pal[k]))pal[k]=o.pal[k];ONLINE.jl={g,pal};onWearBuild()}
function onWearBuild(){const J=onJl(),box=$('#onWear');if(!box)return;box.innerHTML='';
 $('#onSexN').classList.toggle('on',J.g===0);$('#onSexC').classList.toggle('on',J.g===1);
 for(const k of NET_WEAR){const sec=document.createElement('div'),t=document.createElement('b');t.textContent=netT(...(NET_WEAR_T[k]||[k,k]));sec.appendChild(t);const row=document.createElement('div');row.className='onSw';
  for(const c of WEAR_PAL[k]){const b=document.createElement('button');b.type='button';b.dataset.k=k;b.dataset.c=c===null?'':c;
   if(k==='art'){b.style.cssText='width:auto;padding:0 6px;background:#2a2a32;color:#fff;font:700 10px Segoe UI,Arial';b.textContent=c===null?'—':netT(...(NET_ART_T[c]||[String(c).toUpperCase(),String(c).toUpperCase()]))}
   else if(c===null){b.className='none';b.title=netT('nenhum','none')}else b.style.background=c;
   b.addEventListener('click',()=>{onJl().pal[k]=c;if(k==='cap')onJl().pal.capDark=null;onWearPaint()});row.appendChild(b)}
  if(k==='art')onWearEmoBtn(row);sec.appendChild(row);box.appendChild(sec)}
 onWearPaint()}
/* v3 r28: estampa emoji na tela do online — o botão abre o mesmo teclado de emojis da loja (mouse, toque e controle) e mostra o escolhido */
function onWearEmoBtn(row){const b=document.createElement('button');b.type='button';b.id='onEmoBtn';b.className='emo';b.dataset.k='art';b.title=netT('Estampa com emoji','Emoji print');
 b.addEventListener('click',()=>emoKbOpen(e=>{if($('#onJoin').hidden)return;onJl().pal.art='e:'+e;onWearPaint()}));row.appendChild(b)}
function onWearPaint(){{const eb=$('#onEmoBtn'),a=onJl().pal.art,e=typeof a==='string'&&a.startsWith('e:')&&emoOk(a.slice(2))?a.slice(2):null;if(eb){eb.dataset.c=e?a:'emo?';eb.textContent=e?e+' ✎':'😀 +'}}const J=onJl(),cvs=$('#onPrev');if(!cvs)return;const g=cvs.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,cvs.width,cvs.height);
 try{const at=makeAtlas({...J.pal,pack:false});g.drawImage(at,0,0,32,48,4,3,96,144);g.drawImage(at,0,96,32,48,108,3,96,144)}catch(e){}
 for(const b of document.querySelectorAll('#onWear .onSw button'))b.classList.toggle('on',(J.pal[b.dataset.k]??'')===(b.dataset.c||'')||(J.pal[b.dataset.k]===null&&!b.dataset.c))}
function onCfg(){const J=onJl();return{v:1,name:$('#onName').value.trim(),car:$('#onCar').value,col:$('#onCol').value,plate:normPlate($('#onPlate').value)||'',srv:$('#onSrv').value.trim(),g:J.g,pal:Object.fromEntries(NET_WEAR.map(k=>[k,J.pal[k]??null]))}}
function onCfgApply(sv){setTimeout(onCarPaint,0);if(!sv||typeof sv!=='object')return false;const sel=$('#onCar');if(typeof sv.name==='string')$('#onName').value=sv.name.slice(0,16);if(sv.car&&NET_CARS.includes(sv.car))sel.value=sv.car;if(/^#[0-9a-f]{6}$/i.test(sv.col||''))$('#onCol').value=sv.col;if(typeof sv.plate==='string'&&sv.plate)$('#onPlate').value=normPlate(sv.plate)||'';if(typeof sv.srv==='string')$('#onSrv').value=sv.srv.slice(0,200);onJlSet({g:sv.g,pal:sv.pal});return true}
function onExport(){const cfg=onCfg(),b=new Blob([JSON.stringify(cfg,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='coastal-chaos-online'+(cfg.name?'-'+cfg.name.replace(/[^\w-]+/g,'_'):'')+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);$('#onErr').textContent=''}
function onImport(f){if(!f)return;f.text().then(t=>{const sv=JSON.parse(t);if(!onCfgApply(sv))throw 0;$('#onErr').textContent='';netSrvInfo()}).catch(()=>{$('#onErr').textContent=translatePlain('ARQUIVO INVÁLIDO')})}
/* r19: miniatura 3D do veículo escolhido (mesma malha do jogo: carParts + rodas), renderizada fora da tela pelo renderer
   principal num alvo pequeno e copiada para o canvas da tela. Guarda por tipo+cor. */
const NET_THUMB={rt:null,scene:null,cam:null,root:null,cache:new Map()};
function netCarThumb(type,color){const key=type+'|'+color;if(NET_THUMB.cache.has(key))return NET_THUMB.cache.get(key);const W=464,H=232,T=NET_THUMB;
 if(!T.rt){T.rt=new THREE.WebGLRenderTarget(W,H,{samples:0});T.scene=new THREE.Scene();T.cam=new THREE.PerspectiveCamera(30,W/H,.1,100);
  T.scene.add(new THREE.HemisphereLight(0xdfe8ff,0x3a3428,1.1));const d=new THREE.DirectionalLight(0xffffff,1.2);d.position.set(4,8,6);T.scene.add(d);const d2=new THREE.DirectionalLight(0xa8c0ff,.5);d2.position.set(-6,3,-4);T.scene.add(d2)}
 if(T.root){T.scene.remove(T.root);T.root.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry!==wheelGeo&&o.geometry!==hubGeo)o.geometry.dispose()});T.root=null}
 const t=VT[type];if(!t)return null;const g=new THREE.Group(),body=new MB(),li=new MB(),rid=new MB();
 try{carParts(type,color,STYLES.modern,body,li,'#ffffff',rid,true)}catch(e){console.error(e);return null}
 for(const [mb,mat] of [[body,carBodyMat],[body.arch,carBodyMat],[li,carLightMat],[rid,carBodyMat]])if(mb&&mb.p&&mb.p.length)g.add(mb.mesh(mat));
 if(!t.boat&&!t.hover){const r=t.wr;for(let k=0;k<4;k++){const x=k<2?t.wb:-t.wb,z=(k%2?1:-1)*(t.vtw!==undefined?t.vtw:t.tw);const w=new THREE.Mesh(wheelGeo,wheelMat);w.scale.set(r,r,1);w.position.set(x,r,z);w.add(new THREE.Mesh(hubGeo,hubMat));g.add(w)}}
 g.rotation.y=-.62;T.scene.add(g);T.root=g;
 const box=new THREE.Box3().setFromObject(g),c=box.getCenter(new THREE.Vector3()),sz=box.getSize(new THREE.Vector3()),R=Math.max(sz.x,sz.z,sz.y*1.6);
 T.cam.position.set(c.x+R*.1,c.y+R*.42,c.z+R*1.34);T.cam.lookAt(c.x,c.y-sz.y*.08,c.z);
 const cv0=document.createElement('canvas');cv0.width=W;cv0.height=H;
 try{const prev=renderer.getRenderTarget(),pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();renderer.setRenderTarget(T.rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(T.scene,T.cam);
  const buf=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(T.rt,0,0,W,H,buf);renderer.setRenderTarget(prev);renderer.setClearColor(pc,pa);
  const img=cv0.getContext('2d').createImageData(W,H);for(let y=0;y<H;y++)img.data.set(buf.subarray((H-1-y)*W*4,(H-y)*W*4),y*W*4);cv0.getContext('2d').putImageData(img,0,0)}catch(e){console.error(e);return null}
 if(NET_THUMB.cache.size>40)NET_THUMB.cache.clear();NET_THUMB.cache.set(key,cv0);return cv0}
function onCarPaint(){const cv=$('#onCarPrev');if(!cv||$('#onStep2').hidden)return;const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);const im=netCarThumb($('#onCar').value,$('#onCol').value||'#d62828');if(im)g.drawImage(im,0,0)}
function onSetLab(id,pt,en){const l=$(id);if(l&&l.firstChild&&l.firstChild.nodeType===3)l.firstChild.textContent=netT(pt,en)}
function onStep(n){const d=$('#onJoin');ONLINE.step=n;d.classList.toggle('s1',n===1);$('#onStep1').hidden=n!==1;$('#onStep2').hidden=n!==2;$('#onErr').textContent='';
 $('#onGo').textContent=n===1?netT('ENTRAR','LOG IN'):netT('JOGAR','PLAY');$('#onT').textContent=n===1?'ONLINE':netT('PERSONAGEM','CHARACTER');
 if(n===2){onWearBuild();onCarPaint();setTimeout(()=>{try{$('#onGo').focus()}catch(e){}},30)}else{netSrvInfo();setTimeout(()=>{try{($('#onName').value?$('#onPass'):$('#onName')).focus()}catch(e){}},30)}}
function onJoinOpen(){const d=$('#onJoin');d.hidden=false;
 onSetLab('#onLName','NOME','NAME');onSetLab('#onLPass','SENHA','PASSWORD');onSetLab('#onLSrv','SERVIDOR','SERVER');onSetLab('#onLCar','VEÍCULO','VEHICLE');onSetLab('#onLCol','COR','COLOR');onSetLab('#onLPlate','PLACA','PLATE');
 $('#onSrv').placeholder=netT('Automático','Automatic');$('#onPass').placeholder=netT('mín. 6','min. 6');$('#onHint').textContent=netT('nome novo cria a conta · a senha guarda roupa, carro e dinheiro','a new name creates the account · the password keeps your clothes, car and money');
 $('#onBack').textContent=netT('VOLTAR','BACK');$('#onExp').textContent=netT('EXPORTAR','EXPORT');$('#onImp').textContent=netT('IMPORTAR','IMPORT');$('#onChatIn').placeholder=netT('mensagem…','message…');
 const sel=$('#onCar');if(!sel.options.length)for(const t of NET_CARS){const o=document.createElement('option');o.value=t;o.textContent=VMODEL[t]||t;sel.appendChild(o)}
 let ok=false;try{ok=onCfgApply(JSON.parse(localStorage.getItem('ps_online')||'null'))}catch(e){}if(!ok)onJlSet(null);$('#onPass').value='';
 if(!$('#onPlate').value)$('#onPlate').value=randomPlate();onStep(1)}
function onJoinClose(){if(ONLINE.step===2){onStep(1);return}$('#onJoin').hidden=true;try{$('#play').focus()}catch(e){}}
/* passo 1: nome + senha → cria ou entra na conta e puxa o preset salvo (roupa, personagem, carro) */
async function onLogin(){const name=$('#onName').value.trim(),pass=$('#onPass').value;$('#onErr').textContent='';
 if(pass.length<6){$('#onErr').textContent=netT('SENHA · MÍNIMO 6 CARACTERES','PASSWORD · AT LEAST 6 CHARACTERS');$('#onPass').focus();return}
 $('#onGo').disabled=true;ONLINE.url=netSrvUrl($('#onSrv').value);
 try{const r=await netPost('login',{name,pass});if(!r.ok){$('#onErr').textContent=translatePlain(r.err||'ERRO');if(/SENHA/.test(r.err||''))try{$('#onPass').focus();$('#onPass').select()}catch(e){}else if(r.http===404||r.http===403)try{$('#onSrv').focus();$('#onSrv').select()}catch(e){}return}
  ONLINE.login={name:r.name,pass,acct:r.acct||{},isNew:!!r.new};const a=ONLINE.login.acct;
  /* r45: conta nova (ou sem preset salvo) começa do zero — antes herdava a roupa/carro/placa do último personagem desta aba/navegador */
  if(r.new||!a.look||typeof a.look!=='object'){onJlSet(null);$('#onCar').value=NET_CARS[0];$('#onCol').value='#d62828';$('#onPlate').value=randomPlate();setTimeout(onCarPaint,0)}
  if(a.look&&typeof a.look==='object')onJlSet({g:a.look.g,pal:a.look.pal});
  if(a.car&&typeof a.car==='object'){if(NET_CARS.includes(a.car.type))$('#onCar').value=a.car.type;if(/^#[0-9a-f]{6}$/i.test(a.car.color||''))$('#onCol').value=a.car.color;if(a.car.plate)$('#onPlate').value=normPlate(a.car.plate)||$('#onPlate').value}
  $('#onName').value=r.name;onStep(2);$('#onInfo').textContent=(r.new?netT('CONTA CRIADA · ','ACCOUNT CREATED · '):netT('BEM-VINDO, ','WELCOME, '))+r.name+(Number.isFinite(a.m)?' · $'+(a.m|0):'')}
 catch(e){console.error(e);$('#onErr').textContent=translatePlain(netSrvErr(0))}finally{$('#onGo').disabled=false}}
function onGoClick(){if(ONLINE.step===2)onJoinGo();else onLogin()}
async function onJoinGo(){if(ONLINE.on||played||!ONLINE.login)return;const {name,pass}=ONLINE.login,type=$('#onCar').value,col=$('#onCol').value||'#d62828',plate=normPlate($('#onPlate').value)||randomPlate(),J=onJl();
 $('#onErr').textContent='';$('#onGo').disabled=true;
 try{const look=netLookOf({...J.pal,capDark:null});const preset={look:{g:J.g,pal:Object.fromEntries(NET_WEAR.map(k=>[k,J.pal[k]??null]))},car:{type,color:col,plate}};
  const r=await netPost('join',{name,pass,look,preset,car:{type,color:col,plate}});if(!r.ok){$('#onErr').textContent=translatePlain(r.err||'ERRO');return}
  try{localStorage.setItem('ps_online',JSON.stringify(onCfg()))}catch(e){}
  ONLINE.on=true;ONLINE.id=r.id;ONLINE.token=r.token;ONLINE.name=r.name;ONLINE.pass=pass;ONLINE.admin=!!r.admin;ONLINE.sig=!!r.bl;ONLINE.acct=r.acct||{};ONLINE.house=Number.isInteger(r.house)?r.house:-1;ONLINE.since=r.last||0;ONLINE.me={car:{type,color:col,plate}};ONLINE.tod=r.tod;ONLINE.ws=0;
  document.body.classList.add('online');$('#onJoin').hidden=true;
  /* só em memória (saveCfg fica desligado no online): cidade do dia, sem trânsito/pedestres */
  S.seed=r.seed>>>0;S.size=r.size;S.style='modern';S.traffic=0;S.peds=0;S.rain=true;S.storm=true;modeSel='free';S.mode='free';try{syncMenu()}catch(e){}
  startGame(null);
  /* personagem e roupa escolhidos na tela (sem roda de troca no online) */
  CHAR.cur=J.g;CHAR.list[J.g].look=null;Object.assign(PLAYER_PAL,netBase(J.g),J.pal);PLAYER_PAL.capDark=null;PLAYER_PAL.pack=false;try{wearLoad(null,PLAYER_PAL);applyPlayerLook();charFaces()}catch(e){console.error(e)}
  ONLINE.acctNew=!!r.new;ONLINE.acctDone=false;
  netChatSys(translatePlain('ONLINE')+' · '+r.day+' · '+translatePlain('aperte T para conversar'));netChatSys(translatePlain('G no carro de outro jogador: carona · F: roubar'));netChatSys(translatePlain('Carro sumiu: celular → ENTREGA DE VEÍCULO (1 h) ou delegacia (paga e sai na hora)'));netChatSys(translatePlain('Quem está online: mapa (M) ou /jogadores no chat'));netChatSys(translatePlain('Ligue para outro jogador pela agenda do celular (P) para se encontrar'));netLoop()}
 catch(e){console.error(e);$('#onErr').textContent=translatePlain(netSrvErr(0))}finally{$('#onGo').disabled=false}}

/* ---------- laço de rede ----------
   r14: o espera fica num Worker (timer de aba em 2º plano não é estrangulado para 1×/min como o setTimeout da página). */
const NET_TMR=(()=>{try{const b=new Blob(['onmessage=function(e){setTimeout(function(){postMessage(e.data[0])},e.data[1])}'],{type:'text/javascript'}),w=new Worker(URL.createObjectURL(b)),cb=new Map();let n=0;w.onmessage=e=>{const f=cb.get(e.data);cb.delete(e.data);if(f)f()};return{sleep:ms=>new Promise(r=>{const i=++n;cb.set(i,r);w.postMessage([i,ms])})}}catch(e){return null}})();
function netSleep(ms){return NET_TMR?NET_TMR.sleep(ms):new Promise(r=>setTimeout(r,ms))}
async function netLoop(){while(ONLINE.on&&!ONLINE.stopped){const t0=performance.now();try{await netTick()}catch(e){ONLINE.fail++;if(ONLINE.fail===8)netChatSys(translatePlain('CONEXÃO INSTÁVEL…'))}await netSleep(Math.max(30,(document.hidden?600:100)-(performance.now()-t0)))}}
/* sessão perdida (aba parada, celular bloqueado, rede caiu): entra de novo sozinho com o mesmo nome */
async function netRejoin(){if(ONLINE.rejoining)return;ONLINE.rejoining=true;netChatSys(translatePlain('RECONECTANDO…'));
 try{for(let i=0;i<30&&ONLINE.on;i++){let r=null;try{r=await netPost('join',{name:ONLINE.name,pass:ONLINE.pass,look:netLook(),car:ONLINE.me.car})}catch(e){}
   if(r&&r.ok){ONLINE.id=r.id;ONLINE.token=r.token;ONLINE.saveT=0;if(Number.isInteger(r.house))ONLINE.house=r.house;ONLINE.since=r.last||0;ONLINE.ws=0;ONLINE.drv=null;ONLINE.drvCar=null;ONLINE.ride=0;ONLINE.lookStr='';ONLINE.fail=0;netChatSys(translatePlain('RECONECTADO'));if((r.seed>>>0)!==(S.seed>>>0))netChatSys(translatePlain('O DIA MUDOU NO SERVIDOR · SAIA E ENTRE DE NOVO'));return}
   await netSleep(3000)}
  ONLINE.stopped=true;netChatSys(translatePlain('VOCÊ FOI DESCONECTADO · RECARREGUE A PÁGINA'))}finally{ONLINE.rejoining=false}}
async function netTick(){if(!played){return}
 /* conta: aplica quando a cidade terminou de carregar (o carregamento zera dinheiro/armas) */
 if(!ONLINE.acctDone&&$('#loading').hidden){ONLINE.acctDone=true;netAcctApply(ONLINE.acct,ONLINE.acctNew)}
 if(netWorldOk()&&city&&ONLINE.cityRef!==city){ONLINE.cityRef=city;netHouseApply();netPvAdopt();netExtraCars();netReapply()}
 /* morte: avisa quem matou (último acerto em até 8 s) e larga o drop */
 if(PL.dead&&!ONLINE.wasDead){ONLINE.out.push({k:'dead',by:simT-ONLINE.lastHitT<8?ONLINE.lastHitBy:0,x:Math.round(PL.x),z:Math.round(PL.z),c:String(NEWS.cause||'').slice(0,24)});const dr=netDeathDrop();if(dr)ONLINE.out.push(dr)}if(ONLINE.wasDead&&!PL.dead)netProtStart();ONLINE.wasDead=PL.dead;netStatsOut();
 for(const [to,v] of ONLINE.dmg){ONLINE.out.push({k:'hit',to,d:Math.round(v.d*10)/10,car:v.car?1:0,w:v.w||''})}ONLINE.dmg.clear();
 if(netWorldOk())netCarTick();
 netWxTick();
 netTaxiTick();
 const body={token:ONLINE.token,s:netState(),since:ONLINE.since,ws:ONLINE.ws,ev:ONLINE.out.splice(0,16),kv:[...ONLINE.peers.values()].map(p=>p.id+':'+p.lv).join(',')};
 netNpcOut(body);
 const ls=JSON.stringify(netLook());if(ls!==ONLINE.lookStr){body.look=JSON.parse(ls);ONLINE.lookStr=ls}
 if(ONLINE.acctDone&&performance.now()>(ONLINE.saveT||0)){ONLINE.saveT=performance.now()+10000;body.save=netSaveData()}
 const tq0=Date.now()/1000,r=await netPost('tick',body),tq1=Date.now()/1000;
 if(!r.ok){ONLINE.fail++;if(/REMOVIDO|CONTA APAGADA/.test(r.err||'')){netKicked(r.err);return}if(/sessão/.test(r.err||'')){ONLINE.out.unshift(...body.ev.filter(e=>e.k!=='hit'));await netRejoin()}return}
 ONLINE.fail=0;ONLINE.lastOk=performance.now();if(Number.isFinite(r.now)){const o=r.now-(tq0+tq1)/2; /* meio da ida e volta */ONLINE.srvOff=ONLINE.srvOff==null?o:ONLINE.srvOff+(o-ONLINE.srvOff)*.2}ONLINE.since=r.last;ONLINE.tod=r.tod;ONLINE.count=r.players.length+1;ONLINE.meKD=r.me||null;if(r.me&&'bl' in r.me)ONLINE.sig=!!r.me.bl;
 const seen=new Set();for(const q of r.players){seen.add(q.id);let p=ONLINE.peers.get(q.id);if(!p){p={id:q.id,name:q.n,lv:0,look:null,s:null,rx:null,rz:null,ra:0,ped:null,car:null,carT:0,tag:null};ONLINE.peers.set(q.id,p)}
  if(q.look){p.look=q.look;p.lv=q.lv;if(p.ped){removePed(p.ped);p.ped=null}}p.s=q.s;p.k=q.k;p.d=q.d;p.bl=!!q.bl;p.age=q.age;p.recv=performance.now()}
 for(const [id,p] of ONLINE.peers)if(!seen.has(id))netDropPeer(p);
 if(Array.isArray(r.w)){ONLINE.ws=r.wv||ONLINE.ws;netWorld(r.w);ONLINE.wGot=true}
 netPvAnnounce();
 netNpcApply(r.npc);
 for(const e of r.ev)netEvent(e);
 /* roubo de carro: o motorista saiu → entra no carro que ficou parado */
 if(ONLINE.jack){if(simT-ONLINE.jack.t>7)ONLINE.jack=null;else if(!PL.car&&!PL.dead){const c=netCarFind(ONLINE.jack.sid);if(c&&c.alive&&Math.hypot(c.x-PL.x,c.z-PL.z)<12){ONLINE.jack=null;ONLINE.jackGo=c}}}
 /* relógio: um só para todos (salta só se desviar > 2 min) */
 if(S.style==='modern'&&!PL.inside&&Number.isFinite(r.tod)){let d=r.tod-DN.tod;if(d>720)d-=1440;if(d<-720)d+=1440;if(Math.abs(d)>2)DN.tod=((r.tod%1440)+1440)%1440}}
function netDropPeer(p){if(p.br)try{brNetDrop(p)}catch(e){}if(p.ped&&peds.includes(p.ped))removePed(p.ped);p.ped=null;if(p.car&&vehicles.includes(p.car))removeVehicle(p.car);p.car=null;if(p.tag){scene.remove(p.tag);p.tag.material.map.dispose();p.tag.material.dispose();p.tag=null}if(ONLINE.ride===p.id)netRideExit();ONLINE.peers.delete(p.id)}
function netPeerName(id){const p=ONLINE.peers.get(id);return p?p.name:'?'}
function netEvent(e){const d=e.d||{};
 if(e.k==='chat'){netChatAdd(d.n,d.m,e.src===ONLINE.id);const p=ONLINE.peers.get(e.src);if(p&&p.ped&&peds.includes(p.ped))try{say(p.ped,d.m,4)}catch(_){}else if(e.src===ONLINE.id)try{say(PL,d.m,4,true)}catch(_){}}
 else if(e.k==='nph')netNpcHit(d);
 else if(e.k==='sys'){netChatSys(S.lang==='en'?(d.en||d.m):d.m);if(d.pix)netNews('pix',d.pix);if(d.left){const p=ONLINE.peers.get(d.left);if(p)netDropPeer(p)}}
 else if(e.k==='dead'){netChatSys(d.by?(d.by+(S.lang==='en'?' killed ':' matou ')+d.n):(d.n+(S.lang==='en'?' died':' morreu')));netNews(d.by?'kill':'dead',d)}
 else if(e.k==='loot'){let t=[];if(d.w&&WPN[d.w]&&d.am>0){try{gunGive(d.w,d.am)}catch(_){}t.push(WPN[d.w].name+' +'+d.am)}if(d.m>0){money(d.m);t.push('$'+d.m)}try{clang(.3)}catch(_){}toast('DROP'+(d.n?' · '+d.n:'')+(t.length?'<br><small style="font-size:11px;color:#fff">'+t.join(' · ')+'</small>':''))}
 else if(e.k==='jack'){if(PL.car&&!PL.dead&&!PL.heli){const c=PL.car;if(c.t.boat)return;enterExit();PL.vx=-Math.sin(c.a)*4;PL.vz=Math.cos(c.a)*4;try{thud(.4)}catch(_){}toast((d.n||'?')+' '+netT('ROUBOU SEU CARRO','STOLE YOUR CAR'))}}
 else if(e.k==='ride'){toast((d.n||'?')+' '+netT('PEGOU CARONA','HOPPED IN'))}
 else if(e.k==='unride'){if(ONLINE.ride&&!netTransit()){netRideExit();try{thud(.35)}catch(_){}toast((d.n||'?')+' '+netT('TE TIROU DO CARRO','PULLED YOU OUT OF THE CAR'))}}
 else if(e.k==='call'){netCallIncoming(e.src,d.n)}
 else if(e.k==='callok'){netCallAccepted(e.src,d.n)}
 else if(e.k==='callno'){toast((d.n||'?')+' '+netT('NÃO ATENDEU','DID NOT ANSWER'));netChatSys((d.n||'?')+' '+netT('recusou a ligação','declined the call'))}
 else if(e.k==='sig'||e.k==='hk'||e.k==='hkw'||e.k==='hkx'||e.k==='pixed')netHackEvent(e.k,d,e.src);
 else if(e.k==='pay'){const m=Math.max(0,Math.min(2000,d.m|0));if(m){money(m);toast(netT('CORRIDA','FARE')+' · '+(d.n||'?')+'<br><small style="font-size:11px;color:#7dff8a">+$'+m+'</small>')}}
 else if(e.k==='hit'){if(PL.dead||PROLOGUE.active||netProt())return;ONLINE.lastHitBy=e.src;ONLINE.lastHitT=simT;const who=netPeerName(e.src);
  if(d.car&&PL.car&&PL.car.alive){const c=PL.car;c.hp-=d.d;c.sleep=false;try{thud(.25)}catch(_){}if(c.hp<=0)setOnFire(c)}
  else if(!d.car&&!PL.car){if(CHEAT.hp)return;PL.hp-=armorHit(d.d);try{bloodHit(PL.x,(PL.gy||0)+1.1,PL.z,new THREE.Vector3(0,0,0));rumble(.4,.6,120)}catch(_){}if(PL.hp<=0)killPlayer(translatePlain('ABATIDO POR')+' '+who)}}}
/* ================= v3 r9 · HACK DE PIX ENTRE JOGADORES + BLOQUEADOR DE SINAL =================
   ctOS › PERFIL apontado para outro jogador → HACKEAR PIX (mesma barra de 7 s e faixa 6–24 m do hack de pedestre).
   O servidor decide: alvo protegido (Bloqueador de Sinal), distância, tempo mínimo, valor (20% do saldo salvo da vítima, máx. $5.000),
   recarga de 90 s de quem hackeia e 5 min de proteção de quem foi hackeado. Bloqueador: AMOnições › APP ctOS, $5.000, fica na conta. */
const SIG={price:5000,wait:false};
function netSigBuy(){if(!ONLINE.on){return}if(ONLINE.sig){toast(netT('BLOQUEADOR JÁ ATIVO','JAMMER ALREADY ACTIVE'));return}if(SIG.wait)return;
 if((PL.money||0)<SIG.price){toast(netT('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+SIG.price);return}
 SIG.wait=true;ONLINE.saveT=0;ONLINE.out.push({k:'sigbuy'});try{ammoRender()}catch(e){}}
function netHackFail(r,s){return ({blk:netT('ALVO COM BLOQUEADOR DE SINAL','TARGET HAS A SIGNAL JAMMER'),far:netT('ALVO FORA DE ALCANCE','TARGET OUT OF RANGE'),gone:netT('ALVO PERDIDO','TARGET LOST'),
 cd:netT('RECARREGANDO · ','COOLING DOWN · ')+(s|0)+' s',shield:netT('ALVO HACKEADO HÁ POUCO','TARGET WAS HACKED RECENTLY'),poor:netT('SALDO BAIXO DEMAIS','BALANCE TOO LOW'),time:netT('TRANSFERÊNCIA RECUSADA','TRANSFER REFUSED')})[r]||netT('TRANSFERÊNCIA RECUSADA','TRANSFER REFUSED')}
function netHackEvent(k,d,src){
 if(k==='sig'){SIG.wait=false;if(d.ok){ONLINE.sig=true;if(d.paid>0){money(-Math.min(d.paid,Math.max(0,PL.money||0)));clang(.25);toast('<span style="color:#5ef0ff">'+netT('BLOQUEADOR DE SINAL ATIVO','SIGNAL JAMMER ACTIVE')+'</span>')}}else toast(netT('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY')+' · $'+SIG.price);try{ammoRender()}catch(e){}return}
 const H=PROF.hack;
 if(k==='hk'){if(!H||!H.net||H.pid!==d.to)return;
  if(d.st==='go'){H.ok=true;return}
  if(d.st==='ok'){const m=Math.max(0,d.m|0);profEnd(null);if(m)money(m,'PIX HACKEADO · +$'+m);if(H.p&&H.p.prof)H.p.prof.bal=0;return}
  profEnd('PIX · '+netHackFail(d.r,d.s));if(d.r==='blk'){const p=ONLINE.peers.get(d.to);if(p)p.bl=true}return}
 if(k==='hkw'){ONLINE.saveT=0;ONLINE.hackBy={id:src,n:d.n||'?',t:simT};try{rumble(.3,.3,160)}catch(e){}toast('<span style="color:#ff6a6a">'+netT('SEU PIX ESTÁ SENDO HACKEADO','YOUR PIX IS BEING HACKED')+'</span><br><small style="font-size:11px;color:#fff">'+netT('fuja de ','get away from ')+(d.n||'?')+'</small>');netChatSys((d.n||'?')+netT(' está hackeando seu PIX',' is hacking your PIX'));return}
 if(k==='hkx'){if(ONLINE.hackBy&&ONLINE.hackBy.id===src){ONLINE.hackBy=null;toast('<span style="color:#7dff8a">'+netT('HACK INTERROMPIDO','HACK STOPPED')+'</span>')}return}
 if(k==='pixed'){ONLINE.hackBy=null;const m=Math.max(0,d.m|0);if(m){money(-Math.min(m,Math.max(0,PL.money||0)));toast('<span style="color:#ff6a6a">'+netT('PIX HACKEADO','PIX HACKED')+' · -$'+m+'</span><br><small style="font-size:11px;color:#fff">'+(d.n||'?')+' · '+netT('Bloqueador de Sinal na AMOnições','Signal Jammer at AMOnições')+'</small>')}}}
/* ---------- dano em outro jogador: acumula por tick ---------- */
/* v3 r27: banca de jornais no online — mortes, quem matou quem e hacks de PIX dos jogadores viram manchete (para todos) */
function netNews(e,d){try{const o={e,nm:String(d.n||d.b||''),by:String(d.by||d.a||''),c:String(d.c||''),m:d.m|0};if(Number.isFinite(d.x)&&Number.isFinite(d.z))o.d=districtName(d.x,d.z)||'';newsAdd('net',o)}catch(_){}}
function netNewsStory(n){const T=newsTL,bairro=n.d||T('a cidade','town'),em=T('em '+bairro,'in '+bairro),UB=bairro.toUpperCase(),A=n.by,B=n.nm,c=n.c||'';
 if(n.e==='pix')return[T(A.toUpperCase()+' HACKEIA O PIX DE '+B.toUpperCase(),A.toUpperCase()+' HACKS '+B.toUpperCase()+"'S PIX"),T('Um golpe pelo celular tirou $'+n.m+' da conta de '+B+'. A vítima diz que estava parada na rua quando o saldo sumiu.','A phone scam took $'+n.m+' from '+B+"'s account. The victim says the money vanished in the middle of the street.")];
 if(n.e==='kill'){const car=/ATROPELADO/.test(c);return[car?T(A.toUpperCase()+' ATROPELA '+B.toUpperCase()+' NO '+UB,A.toUpperCase()+' RUNS OVER '+B.toUpperCase()+' IN '+UB):T(A.toUpperCase()+' MATA '+B.toUpperCase()+' NO '+UB,A.toUpperCase()+' KILLS '+B.toUpperCase()+' IN '+UB),
  car?T('Testemunhas viram '+A+' passar por cima de '+B+' '+em+' e seguir em frente.','Witnesses saw '+A+' drive over '+B+' '+em+' and keep going.'):T('A rixa entre '+A+' e '+B+' terminou mal '+em+'. A polícia procura testemunhas.','The feud between '+A+' and '+B+' ended badly '+em+'. Police are looking for witnesses.')]}
 const k=/EXPLOD/.test(c)?0:/ATROPELADO/.test(c)?1:/AFOGADO/.test(c)?2:/QUEDA/.test(c)?3:-1;
 const H=[[T('EXPLOSÃO NO ','BLAST IN '),T('Um carro explodiu '+em+' com '+B+' ao volante.','A car blew up '+em+' with '+B+' at the wheel.')],[T('ATROPELAMENTO NO ','HIT-AND-RUN IN '),T(B+' foi atingido por um carro '+em+'. O motorista fugiu.',B+' was hit by a car '+em+'. The driver fled.')],[T('AFOGAMENTO NO ','DROWNING IN '),T(B+' se afogou '+em+'. Salva-vidas pedem cuidado.',B+' drowned '+em+'. Lifeguards urge caution.')],[T('QUEDA NO ','FATAL FALL IN '),T(B+' despencou de grande altura '+em+'.',B+' fell from a great height '+em+'.')]][k];
 return H?[H[0]+UB,H[1]]:[T('MORTE NO ','DEATH IN ')+UB,T(B+' foi encontrado desacordado '+em+'. A polícia investiga.',B+' was found unconscious '+em+'. Police are investigating.')]}
/* v3 r30: relógio do servidor em segundos (ponte levadiça, nuvens) */
function netNow(){return Date.now()/1000+(ONLINE.srvOff||0)}
function netHit(id,dmg,car,w){if(!ONLINE.on||!id||!(dmg>0))return;if(typeof id==='string'){if(id[0]==='n')netNpcDmg(+id.slice(1),dmg);return}if(netProt())netProtEnd(true); /* v3 r27: carro do servidor de outro host */const v=ONLINE.dmg.get(id)||{d:0,car:!!car,w:w||''};v.d=Math.min(250,v.d+dmg);v.car=!!car;ONLINE.dmg.set(id,v)}
function netHitPed(p,dmg,w){if(p&&p.net){netHit(p.net,dmg,false,w);p.hp=3;try{ouch(p.x,p.z,p.pitch)}catch(_){}}}
/* ================= r15 · CLIMA COMPARTILHADO =================
   O clima é sorteado (Math.random) em cada jogo, então cada um via um céu. Agora um jogador é o "dono do clima"
   (o de menor id que está na cidade normal, fora de interior): ele manda o estado a cada 3 s (linha 'wx:now' do servidor)
   e os outros copiam. Quem copia não sorteia nada (netWxFollow); a física das nuvens continua rodando igual entre as cópias.
   Se o dono sai ou entra num interior, o próximo assume a partir do estado que já tinha recebido. */
function netWxLead(){if(!ONLINE.on||netHidden())return false;for(const p of ONLINE.peers.values())if(p.s&&!p.s.w&&p.id<ONLINE.id)return false;return true}
function netWxFollow(){return !!(ONLINE.on&&ONLINE.wxFollow)}
const NET_WXK=['wx','wz','chance','cellT','stormEta','stormMsg','stormDir','stormNext','cover','coverMsg','pre','calm','freeze','postClear','stormRoll','cheatStorm','fair','fairTg','stormChance'];
const NET_WXC=['x','z','r','s','max','life','age','big','storm','fading','split','wait','dead'];
function netRnd(v){return typeof v==='number'?Math.round(v*1000)/1000:v}
function netWxTick(){const lead=netWxLead();ONLINE.wxFollow=!lead&&!netHidden();
 if(!lead||S.style!=='modern'||city.haze)return;if(simT<(ONLINE.wxT||0)&&ONLINE.wxT-simT<10)return;ONLINE.wxT=simT+3;
 const d={};for(const k of NET_WXK)if(WX[k]!==undefined&&WX[k]!==null)d[k]=netRnd(WX[k]);
 d.cells=CELLS.slice(0,6).map(c=>{const o={};for(const k of NET_WXC)if(c[k]!==undefined)o[k]=netRnd(c[k]);return o});d.si=CELLS.indexOf(WX.stormCell);d.cw=[netRnd(CLDSH.wx),netRnd(CLDSH.wz)]; /* v3 r30: posição da camada de nuvens */
 ONLINE.out.push({k:'wx',d})}
function netWxApply(d){if(!d||!ONLINE.wxFollow||S.style!=='modern'||city.haze||!Array.isArray(d.cells))return;
 const had=WX.stormEta!=null;
 for(const k of NET_WXK)WX[k]=k in d?d[k]:(['stormEta','stormNext','calm','postClear','stormDir'].includes(k)?null:WX[k]);
 /* células: reaproveita os objetos (mesmo índice) para não piscar a chuva; a intensidade local WX.f continua suave */
 const n=Math.min(6,d.cells.length);for(let i=0;i<n;i++){const c=CELLS[i]||{};for(const k of NET_WXC)if(k in d.cells[i])c[k]=d.cells[i][k];else if(k!=='x'&&k!=='z'&&k!=='r'&&k!=='s')delete c[k];CELLS[i]=c}
 CELLS.length=n;WX.stormCell=d.si>=0?CELLS[d.si]||null:null;if(Array.isArray(d.cw)&&Number.isFinite(d.cw[0])&&Number.isFinite(d.cw[1])){CLDSH.wx=d.cw[0];CLDSH.wz=d.cw[1]}WX.stormReq=false;WX.lastOpt=S.rain;WX.fairT=simT+30;
 /* previsão: quem copia também vê o aviso de 1h (o de 30/10 min sai sozinho da contagem) */
 if(!had&&WX.stormEta!=null&&WX.stormEta>30*GMIN&&played)wxToast('PREVISÃO DO TEMPO: TEMPESTADE EM 1H','vindo do '+dirName(Math.cos(WX.stormDir||0),Math.sin(WX.stormDir||0)).toLowerCase()+'')}
/* ================= r14 · MUNDO COMPARTILHADO =================
   Carros: todo carro estacionado da seed (spotId) + os extras do online são "do servidor". Quem entra marca o carro (drv) e os outros
   escondem a cópia parada (veem o carro andando pelo estado do jogador); ao sair, a posição nova vale para todos; explodiu = some para todos.
   Carro sem spotId (o do começo, concessionária, garagem) ganha um id ao ser dirigido e passa a existir no servidor.
   Coletáveis: pegou = some para todos e volta depois de 5 min (servidor). Drop: quem morre larga a arma da mão + 10% do dinheiro. */
/* v3 r30: dano dos carros dos jogadores para todos — hp (vida/motor: fumaça < 35, fogo em 0) e dm = nível dos amassados por zona
   "frld" (frente, trás, esquerda, direita; 0..2). Vai no estado do jogador (s.c) e no registro do carro estacionado (servidor guarda). */
function netCarDmgOut(c,o){const h=Math.round(clamp(c.hp,0,100));if(h<100)o.hp=h;const d=c.dmg;if(d&&(d.f|d.r|d.l|d.d))o.dm=''+(d.f|0)+(d.r|0)+(d.l|0)+(d.d|0);return o}
function netCarDmgIn(c,o,copy){const dm=/^[0-2]{4}$/.test(o.dm||'')?o.dm:'';if((c.netDm||'')!==dm||(!dm&&c.dmg)){c.netDm=dm;c.dmg=dm?{f:+dm[0],r:+dm[1],l:+dm[2],d:+dm[3]}:null;c.dmgDirty=true;if(c.g&&c.dentParts&&c.ch)try{carDmgApply(c)}catch(_){}else if(!dm&&c.g)try{dropCarMesh(c);buildCarMesh(c)}catch(_){}}
 const h=Number.isFinite(o.hp)?clamp(o.hp,0,100):100;if(copy)c.netHp=h;else if(c.alive&&!c.onFire)c.hp=Math.max(1,h)}
/* fumaça do motor na cópia (a cópia dorme, então o laço de carros não solta a fumaça dela) */
function netCarSmoke(c,dt){const h=c.netHp??100;if(!c.alive||h>=35||!c.g||R2()>=dt*(h<18?12:5))return;const ca=Math.cos(c.a),sa=Math.sin(c.a);emit(c.x+ca*c.t.L*.35,c.gy+1.2,c.z+sa*c.t.L*.35,(R2()-.5)*.6,1.5+R2(),(R2()-.5)*.6,1.8,1,4,0x8a8a8a,false,.55)}
function netCarFind(sid){for(const c of vehicles)if(c.spotId===sid&&!c.net)return c;return null}
function netCarApply(sid){if(!netWorldOk())return;const r=ONLINE.cars.get(sid);if(!r)return;const c=netCarFind(sid),d=r.d||{};
 if(d.dead){if(c&&c!==PL.car&&c.alive)removeVehicle(c);city.taken.add(sid);return}
 if(r.o&&r.o!==ONLINE.id){if(c&&c===PL.car){/* dois pegaram o mesmo carro: ficou com quem chegou primeiro ao servidor */ONLINE.drv=null;ONLINE.drvCar=null;enterExit();if(PL.car===c)return;if(PL.lastCar===c)PL.lastCar=null;removeVehicle(c);toast(netT('OUTRO JOGADOR PEGOU ESSE CARRO','ANOTHER PLAYER TOOK THIS CAR'));return}if(c&&c!==PL.car&&c!==PL.lastCar)removeVehicle(c);else if(c&&c===PL.lastCar){PL.lastCar=null;removeVehicle(c)}return}
 if(r.o===ONLINE.id||!Number.isFinite(d.x)||!Number.isFinite(d.z))return;
 if(c){if(c===PL.car||!c.alive)return;
  /* tunado por outro jogador: cor, neon e placa iguais para todos */
  const nc=/^#[0-9a-f]{6}$/i.test(d.col||'')?d.col:null,nn=d.ne||'';if((nc&&c.color!==nc)||(c.neon?c.neonCol:'')!==nn){if(nc){c.color=nc;c.icol=COL(nc)}c.neon=!!nn;c.neonCol=nn||c.neonCol;if(c.g){try{dropCarMesh(c);buildCarMesh(c)}catch(e){}}}if(d.pl&&c.plate!==d.pl)try{setCarPlate(c,d.pl)}catch(e){}
  netCarDmgIn(c,d,false);if(Math.hypot(c.x-d.x,c.z-d.z)>1.2){c.x=d.x;c.z=d.z;c.a=d.a||0;c.vx=c.vz=c.fwd=c.w=0;c.sleep=true;c.hand=true;c.gy=groundY(c.x,c.z);try{syncCar(c,0)}catch(e){}}return}
 const t=VT[d.t]&&!VT[d.t].boat?d.t:'sedan',n=makeVehicle(t,d.x,d.z,d.a||0,d.col||parkedCityColor(t,sid));if(d.pl)try{setCarPlate(n,d.pl)}catch(e){}if(d.ne){n.neon=true;n.neonCol=d.ne}n.spotId=sid;n.hand=true;n.sleep=true;netCarDmgIn(n,d,false);
 const pv=ONLINE.pv;if(pv&&pv!==n&&pv!==PL.car&&vehicles.includes(pv)&&pv.alive&&Math.hypot(pv.x-n.x,pv.z-n.z)<5.6&&netPvFree(pv))ONLINE.out.push(netCarRec(pv,{drv:0})) /* v3 r30: carro de outro jogador chegou em cima do meu: o meu vai para a vaga livre */}
function netCarRec(c,o){return{k:'car',id:c.spotId,t:c.type,col:/^#[0-9a-f]{6}$/i.test(c.color||'')?c.color:null,ne:c.neon&&/^#[0-9a-f]{6}$/i.test(c.neonCol||'')?c.neonCol:'',pl:c.plate||'',x:+c.x.toFixed(2),z:+c.z.toFixed(2),a:+c.a.toFixed(3),...netCarDmgOut(c,{}),...o}}
function netCarTick(){const c=PL.car&&!PL.car.net&&PL.car.alive&&!PL.car.t.boat&&VT[PL.car.type]?PL.car:null;
 if(c&&!c.spotId)c.spotId='u'+ONLINE.id+'-'+(++ONLINE.carN)+'-'+(Date.now()%1e6);
 const sid=c?c.spotId:null;
 if(sid!==ONLINE.drv){const o=ONLINE.drvCar;if(ONLINE.drv&&o&&o.alive&&vehicles.includes(o))ONLINE.out.push(netCarRec(o,{drv:0}));if(c)ONLINE.out.push(netCarRec(c,{drv:1}));ONLINE.drv=sid;ONLINE.drvCar=c}
 for(const v of vehicles)if(v.spotId&&!v.alive&&!v.net&&!v.netDead){v.netDead=true;ONLINE.out.push({k:'car',id:v.spotId,dead:1})}}
/* carros extras do online: completa vagas dos estacionamentos e põe alguns no meio-fio. Gerador próprio (não mexe no R da cidade);
   o id sai do índice, então é o mesmo em todos os jogos mesmo que um ponto seja pulado em um deles. */
function netExtraCars(){if(!city||!city.N)return;const rnd=mulberry32(((S.seed>>>0)^0x5a17c0de)>>>0),types=['sedan','hatch','suv','pickup','van','wagon','crossover','mini','sports','roadster','conv','taxi','moto','sedan','hatch'];let n=0;
 const mk=(x,z,a,id,t)=>{if(city.taken.has(id)||netCarFind(id))return;if(!Number.isFinite(x)||!Number.isFinite(z)||inWater(x,z))return;if(carsNear(x,z,4.5).some(o=>Math.hypot(o.x-x,o.z-z)<4.2))return;if(query(x,z,3).some(o=>!o.dead&&x+1.7>o.x0&&x-1.7<o.x1&&z+1.7>o.z0&&z-1.7<o.z1))return;const c=makeVehicle(t,x,z,a,parkedCityColor(t,id));c.hand=true;c.sleep=true;c.spotId=id;n++};
 (city.empParkingSlots||[]).forEach((q,i)=>{const go=rnd()<.4,t=types[Math.floor(rnd()*types.length)];if(go)mk(q.x,q.z,q.a,'ol'+i,t)});
 const N=city.N,M=Math.round(N*N*.45);
 for(let i=0;i<M;i++){const kx=Math.floor(rnd()*(N+1)),kz=Math.floor(rnd()*(N+1)),d=rnd()<.5?0:1,side=rnd()<.5?1:-1,s=16+rnd()*(P-32),t=types[Math.floor(rnd()*types.length)];
  if(!segExists(kx,kz,d))continue;const x=kx*P+D[d][0]*s-D[d][1]*side*6.5,z=kz*P+D[d][1]*s+D[d][0]*side*6.5,a=Math.atan2(D[d][1],D[d][0])+(side<0?Math.PI:0);mk(x,z,a,'oc'+i,t)}
 return n}
function netReapply(){for(const sid of ONLINE.cars.keys())netCarApply(sid);for(const id of ONLINE.pk)netPkGone(id);for(const k of ONLINE.drops.keys())netDropShow(k)}
function netWorld(rows){for(const r of rows){const k=String(r.k||''),i=k.indexOf(':');if(i<0)continue;const kind=k.slice(0,i),id=k.slice(i+1);
 if(kind==='car'){ONLINE.cars.set(id,{o:r.o|0,d:r.d||{}});netCarApply(id)}
 else if(kind==='pk'){if(r.g){ONLINE.pk.delete(id);netPkBack(id)}else{ONLINE.pk.add(id);netPkGone(id)}}
 else if(kind==='drop'){if(r.g){ONLINE.drops.delete(k);netDropGone(k)}else{ONLINE.drops.set(k,r.d||{});netDropShow(k)}}
 else if(kind==='wx'&&!r.g&&r.o!==ONLINE.id){ONLINE.wxLast=r.d;netWxApply(r.d)}}}
function netPkRemoved(p){if(!p.netRemote&&!city.picked.has(p.id))return;ONLINE.pkRec.set(p.id,{x:p.x,z:p.z,ammo:p.ammo,ch:p.ch,kind:p.kind});if(!p.netRemote&&!ONLINE.pk.has(p.id)){ONLINE.pk.add(p.id);ONLINE.out.push({k:'pk',id:p.id})}}
function netPkGone(id){if(!netWorldOk())return;city.picked.add(id);const p=pickups.find(k=>k.id===id);if(p){p.netRemote=true;removePickup(p)}}
function netPkBack(id){if(!netWorldOk())return;city.picked.delete(id);const r=ONLINE.pkRec.get(id);if(r&&r.ch&&!pickups.some(k=>k.id===id))try{makePickup(id,r.x,r.z,r.ammo,r.ch,r.kind)}catch(e){}}
const NET_DROPW={pistol:'gun',magnum:'magnum',smg:'smg',rpg:'rpg',grenade:'grenade',remote:'remote',jammer:'jammer'};
function netDropShow(k){if(!netWorldOk()||pickups.some(p=>p.id===k))return;const d=ONLINE.drops.get(k);if(!d||!Number.isFinite(d.x)||!Number.isFinite(d.z))return;const kind=NET_DROPW[d.w]&&d.am>0?NET_DROPW[d.w]:'cash';try{const p=makePickup(k,d.x,d.z,d.am||d.m||0,{pickups:[]},kind);if(p)p.netDrop=d}catch(e){console.error(e)}}
function netDropGone(k){const p=pickups.find(q=>q.id===k);if(p)removePickup(p)}
function netDeathDrop(){let w='',am=0;if(GUN.has&&GUN.inv[GUN.w]&&NET_DROPW[GUN.w]){w=GUN.w;am=Math.max(0,GUN.ammo|0);gunHolster(true);delete GUN.inv[w]}const m=Math.max(0,Math.round(PL.money||0));if(m>0){PL.money=0;setTimeout(()=>toast('<span style="color:#ff6a6a">−$'+m+'</span> · '+netT('DINHEIRO NO CHÃO','CASH DROPPED')+'<br><small style="font-size:11px;color:#fff">'+netT('o que está na conta corrente do banco não cai','money in your checking account is safe')+'</small>'),2600)}if(!am&&!m)return null; /* v4 r19: cai TODO o dinheiro em mãos (antes 10%, até $5.000); a conta do banco fica */return{k:'drop',x:+PL.x.toFixed(2),z:+PL.z.toFixed(2),w,am,m}}
/* ================= r16 · CONTA, CARRO PESSOAL E TÁXI =================
   Conta: nome + senha (servidor). Guarda dinheiro, armas, colete e o id do carro pessoal; salva a cada 10 s e ao fechar a aba.
   Conta nova começa com o dinheiro inicial do servidor (START_MONEY). */
function netSaveData(){const inv={};for(const w in GUN.inv){const a=GUN.has&&GUN.w===w?GUN.ammo:(GUN.inv[w]&&GUN.inv[w].ammo)||0;if(a>0)inv[w]=Math.min(9999,a|0)}
 return{m:Math.max(-1e6,Math.min(1e8,Math.round(PL.money||0))),bk:Math.max(0,Math.min(1e8,Math.round(BANKACC.bal||0))),ct:CTOS.installed?1:0,inv,ar:Math.round(PL.armor||0),pv:ONLINE.pvSid||null,car:ONLINE.me&&ONLINE.me.car,look:{g:CHAR.cur,pal:Object.fromEntries(NET_WEAR.map(k=>[k,PLAYER_PAL[k]??null]))}}}
function netAcctApply(a,isNew){a=a||{};PL.money=Number.isFinite(a.m)?a.m:500;BANKACC.bal=Number.isFinite(a.bk)?Math.max(0,a.bk):0;if(a.ct)CTOS.installed=true;PL.armor=clamp(+a.ar||0,0,100);GUN.inv={};GUN.has=false;GUN.ammo=0;
 if(a.inv&&typeof a.inv==='object')for(const w in a.inv)if(WPN[w]&&a.inv[w]>0)try{gunGive(w,a.inv[w]|0)}catch(e){}
 try{gunHolster(true)}catch(e){}if(typeof a.pv==='string'&&/^pv[\w-]{1,60}$/.test(a.pv)){ONLINE.pvSid=a.pv;const c=ONLINE.pv;if(c&&vehicles.includes(c)){c.spotId=a.pv;netCarApply(a.pv)}}
 if(isNew)setTimeout(()=>toast(netT('CONTA CRIADA','ACCOUNT CREATED')+'<br><small style="font-size:11px;color:#7dff8a">$'+(PL.money|0)+'</small>'),1500)}
addEventListener('pagehide',()=>{if(!ONLINE.on||!ONLINE.token||!ONLINE.acctDone)return;try{navigator.sendBeacon(ONLINE.url+'?a=leave',JSON.stringify({token:ONLINE.token,save:netSaveData()}))}catch(e){}});
function netPvId(){return 'pv'+String(ONLINE.name||'x').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'').slice(0,16)+'-'+Date.now().toString(36)}
/* carro pessoal: o do começo. Fica no servidor com o id da conta → na volta ele está onde você largou (se não explodiu nem foi levado) */
function netPvAdopt(){const c=city.startCar;if(!c||!vehicles.includes(c)||c.spotId)return;if(!ONLINE.pvSid)ONLINE.pvSid=netPvId();c.spotId=ONLINE.pvSid;ONLINE.pv=c;ONLINE.pvAnn=true}
/* v3 r30: o carro pessoal aparece para todos já ao entrar (antes só depois da 1ª vez que o dono dirigia). Espera o mundo do servidor
   chegar: se o servidor já tem esse carro (sessão anterior), vale a posição de lá; se não tem, anuncia onde ele nasceu. */
function netPvAnnounce(){if(!ONLINE.pvAnn||!ONLINE.wGot)return;ONLINE.pvAnn=false;const c=ONLINE.pv,sid=ONLINE.pvSid;if(!c||!sid||c.spotId!==sid||!vehicles.includes(c)||!c.alive||c===PL.car||ONLINE.cars.has(sid))return;netPvFree(c);ONLINE.out.push(netCarRec(c,{drv:0}))}
/* todo mundo entra no mesmo ponto da cidade: o carro pessoal anda pelo meio-fio até uma vaga sem outro carro (senão os carros nasciam um dentro do outro) */
function netPvClear(c,x,z){if(!Number.isFinite(x)||!Number.isFinite(z)||inWater(x,z))return false;for(const o of vehicles)if(o!==c&&Math.abs(o.x-x)<5.6&&Math.abs(o.z-z)<5.6&&Math.hypot(o.x-x,o.z-z)<5.6)return false; /* lista inteira: carro recém-criado ainda não está na grade do carsNear */return !query(x,z,3).some(o=>!o.dead&&x+1.6>o.x0&&x-1.6<o.x1&&z+1.6>o.z0&&z-1.6<o.z1)}
function netPvFree(c){if(netPvClear(c,c.x,c.z))return false;const ca=Math.cos(c.a),sa=Math.sin(c.a);
 for(let k=1;k<=12;k++)for(const sg of [1,-1]){const x=c.x+ca*k*6.5*sg,z=c.z+sa*k*6.5*sg;if(netPvClear(c,x,z)){c.x=x;c.z=z;c.vx=c.vz=c.fwd=c.w=0;c.sleep=true;c.gy=groundY(x,z);try{syncCar(c,0)}catch(e){}return true}}return false}
/* carro pessoal sumido = explodiu, foi levado por outro jogador ou não existe mais aqui */
function netPvState(){const c=ONLINE.pv,row=ONLINE.pvSid&&ONLINE.cars.get(ONLINE.pvSid);if(row&&row.o&&row.o!==ONLINE.id)return 'stolen';if(row&&row.d&&row.d.dead)return 'dead';if(c&&vehicles.includes(c)&&c.alive)return 'ok';return 'gone'}
/* celular → ENTREGA DE VEÍCULO (ou /carro): o carro chega depois de 60 s reais (20 min de jogo desde a v3 r23) na rua mais perto */
function netPvOrder(){if(!ONLINE.on||!played)return false;if(ONLINE.pvDue){netChatSys(netT('ENTREGA A CAMINHO · ','DELIVERY ON THE WAY · ')+Math.max(1,Math.ceil(ONLINE.pvDue-simT))+' s');toast(netT('ENTREGA A CAMINHO','DELIVERY ON THE WAY'));return true}
 const st=netPvState();if(st==='ok'){toast(netT('SEU CARRO ESTÁ INTEIRO','YOUR CAR IS FINE')+'<br><small style="font-size:11px;color:#fff">'+netT('está marcado no mapa','it is marked on the map')+'</small>');return false}
 ONLINE.pvDue=simT+60;toast(netT('ENTREGA DE VEÍCULO','VEHICLE DELIVERY')+'<br><small style="font-size:11px;color:#fff">'+netT('chega em 20 min','arrives in 20 min')+'</small>');return true}
function netPvDueTick(){if(!ONLINE.pvDue||simT<ONLINE.pvDue)return;if(PL.car||PL.inside||PL.dead||ONLINE.ride||!netWorldOk())return;ONLINE.pvDue=0;netPvSpawnNear();netChatSys(netT('O SEU CARRO CHEGOU','YOUR CAR IS HERE'));toast(netT('O SEU CARRO CHEGOU','YOUR CAR IS HERE'))}
/* delegacia: na porta, E paga 15% do dinheiro (mín. $100) e o carro sai na hora */
function netImpoundFee(){return Math.max(100,Math.round((PL.money||0)*.15))}
function netImpoundNear(){const d=city.polDoor;return !!(d&&!PL.inside&&!PL.car&&!PL.dead&&netWorldOk()&&Math.hypot(PL.x-d.x,PL.z-d.z)<7)}
function netImpoundTry(){if(!netImpoundNear()||netPvState()==='ok')return false;const fee=netImpoundFee();if((PL.money||0)<fee){toast(netT('PÁTIO DA DELEGACIA · $','IMPOUND · $')+fee+'<br><small style="font-size:11px;color:#fff">'+netT('dinheiro insuficiente','not enough money')+'</small>');clang(.1);return true}
 money(-fee);ONLINE.pvDue=0;netPvSpawnNear();toast(netT('CARRO LIBERADO · −$','CAR RELEASED · −$')+fee);return true}
function netImpoundHint(){if(simT<(ONLINE.impT||0)||!netImpoundNear()||netPvState()==='ok')return;ONLINE.impT=simT+20;toast(netT('PÁTIO DA DELEGACIA','IMPOUND')+'<br><small style="font-size:11px;color:#fff">E: '+netT('liberar o seu carro','release your car')+' · $'+netImpoundFee()+'</small>')}
function netPvSpawnNear(){const old=ONLINE.pvSid&&netCarFind(ONLINE.pvSid),row=ONLINE.pvSid&&ONLINE.cars.get(ONLINE.pvSid);
 if(ONLINE.pvSid&&!(row&&row.o&&row.o!==ONLINE.id))ONLINE.out.push({k:'car',id:ONLINE.pvSid,dead:1});if(old&&old!==PL.car)removeVehicle(old);
 /* rua mais perto: eixo X ou Z da grade, encostado no meio-fio */
 const kx=Math.round(PL.x/P),kz=Math.round(PL.z/P),dx=PL.x-kx*P,dz=PL.z-kz*P;let x,z,a;
 if(Math.abs(dx)<Math.abs(dz)){const sd=dx>=0?1:-1;x=kx*P+sd*6.5;z=PL.z+(Math.abs(dz)<14?(dz>=0?14-dz:-14-dz):0);a=sd>0?Math.PI/2:-Math.PI/2}else{const sd=dz>=0?1:-1;z=kz*P+sd*6.5;x=PL.x+(Math.abs(dx)<14?(dx>=0?14-dx:-14-dx):0);a=sd>0?Math.PI:0}
 if(inWater(x,z)||query(x,z,3).some(o=>!o.dead&&x+1.4>o.x0&&x-1.4<o.x1&&z+1.4>o.z0&&z-1.4<o.z1)){const o={x:PL.x+2.5,z:PL.z};circleVsWorld(o,1.4);x=o.x;z=o.z;a=0}
 const m=ONLINE.me.car,t=VT[m.type]?m.type:'sedan',c=makeVehicle(t,x,z,a,m.color);try{setCarPlate(c,m.plate)}catch(e){}c.hand=true;c.sleep=true;ONLINE.pvSid=netPvId();c.spotId=ONLINE.pvSid;ONLINE.pv=c;ONLINE.saveT=0;
 ONLINE.out.push(netCarRec(c,{drv:0}));try{clang(.3)}catch(e){}return c}
/* casa segura do online: uma por conta (índice do servidor). As 24 casas saem da seed (portas de casas da cidade; a 0 é a casa
   segura da história). Só o dono vê o ícone e só ele entra: a porta de city.safe passa a ser a da casa dele. */
function netHousePool(){const L=[];for(const[ri,arr] of city.doors||[]){if(city.info[ri]?.kind!=='houses'||city.info[ri]?.safe)continue;for(const d of arr)if(d.house&&d.f)L.push(d)}
 L.sort((a,b)=>a.x-b.x||a.z-b.z);const R=mulberry32(((S.seed>>>0)^0x40e5e5)>>>0);for(let i=L.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[L[i],L[j]]=[L[j],L[i]]}
 const out=[];const far=(x,z)=>out.every(q=>Math.hypot(q.x-x,q.z-z)>60);for(const d of L){if(out.length>=23)break;if(far(d.x,d.z))out.push(d)}
 return out.map(d=>{const n=d.f==='n'?[0,-1]:d.f==='s'?[0,1]:d.f==='e'?[1,0]:[-1,0];return{x:d.x+n[0]*.4,z:d.z+n[1]*.4,nx:n[0],nz:n[1]}})}
function netHouseApply(){if(!city.safe)return;if(!ONLINE.safe0||ONLINE.safe0.city!==city)ONLINE.safe0={city,x:city.safe.x,z:city.safe.z,nx:city.safe.nx,nz:city.safe.nz};const h=ONLINE.house;
 if(!(h>0))return; /* 0 = a casa da história; -1 = sem casa (usa a da história) */
 const pool=netHousePool(),q=pool[(h-1)%Math.max(1,pool.length)];if(!q)return;Object.assign(city.safe,{x:q.x,z:q.z,nx:q.nx,nz:q.nz})}
/* táxi entre jogadores: carona num carro do tipo táxi é paga ao motorista (bandeirada $10 + $1 a cada 25 m), cobrada a cada $25 e ao descer */
function netTaxiTick(){const c=netRideCar(),p=ONLINE.ride&&ONLINE.peers.get(ONLINE.ride);const T=ONLINE.taxi;
 if(!c||!p||c.type!=='taxi'){if(T&&T.due>0)netTaxiPay(T);ONLINE.taxi=null;return}
 if(!T||T.id!==p.id){if(T&&T.due>0)netTaxiPay(T);ONLINE.taxi={id:p.id,x:c.x,z:c.z,d:0,due:10,paid:0};toast(netT('TÁXI','TAXI')+' · '+p.name+'<br><small style="font-size:11px;color:#fff">$10 + $1/25 m</small>');return}
 const d=Math.hypot(c.x-T.x,c.z-T.z);if(d<60){T.d+=d}T.x=c.x;T.z=c.z;while(T.d>=25){T.d-=25;T.due++}if(T.due>=25)netTaxiPay(T)}
function netTaxiPay(T){const m=Math.min(T.due,Math.max(0,Math.floor(PL.money||0)));T.due=0;if(m<=0)return;money(-m);T.paid+=m;ONLINE.out.push({k:'pay',to:T.id,m})}
/* ================= r25 · CONTA E ADMIN =================
   CONFIGURAÇÕES → ONLINE (só aparece no online): APAGAR MINHA CONTA (todos) e, para a conta admin, LIMPAR BANCO DE DADOS
   (apaga todas as contas menos o admin, carros/coletáveis/drops do mundo e o chat; quem está jogando é desconectado).
   Admin no chat: /contas · /apagar Nome · /limparbanco confirmar. Senha do admin = a do servidor (CCSS_ADMIN_PASS ou data/admin-pass.txt). */
function netKicked(msg){ONLINE.stopped=true;ONLINE.on=false;netChatSys(translatePlain(msg||'VOCÊ FOI REMOVIDO DO SERVIDOR'));toast(translatePlain(msg||'VOCÊ FOI REMOVIDO DO SERVIDOR'));setTimeout(()=>location.reload(),3500)}
async function netAcctDelete(){if(!ONLINE.on)return;const r=await netPost('acct_delete',{token:ONLINE.token}).catch(()=>null);if(!r||!r.ok){toast(translatePlain((r&&r.err)||'ERRO'));return}
 try{const sv=JSON.parse(localStorage.getItem('ps_online')||'null');if(sv){delete sv.name;localStorage.setItem('ps_online',JSON.stringify(sv))}}catch(e){}netKicked('CONTA APAGADA')}
async function netAdmin(cmd,extra){const r=await netPost('admin',{token:ONLINE.token,cmd,...(extra||{})}).catch(()=>null);if(!r||!r.ok){netChatSys(translatePlain((r&&r.err)||'ERRO'));return null}return r}
async function netAdminCmd(m){if(!ONLINE.admin){netChatSys(netT('Comando só do admin','Admin-only command'));return}const a=m.trim().split(/\s+/),c=a[0].toLowerCase();
 if(c==='/contas'){const r=await netAdmin('list');if(r)netChatSys(netT('CONTAS','ACCOUNTS')+' ('+r.accounts.length+'): '+r.accounts.map(x=>x.n+' $'+x.m).join(' · '));return}
 if(c==='/apagar'){const n=a.slice(1).join(' ');if(!n){netChatSys('/apagar Nome');return}const r=await netAdmin('del',{name:n});if(r)netChatSys(r.deleted?netT('Conta apagada: ','Account deleted: ')+n:netT('Conta não existe: ','No such account: ')+n);return}
 if(c==='/limparbanco'){if((a[1]||'').toLowerCase()!=='confirmar'){netChatSys(netT('Apaga todas as contas (menos o admin) e o mundo. Para confirmar: /limparbanco confirmar','Deletes every account (except admin) and the world. To confirm: /limparbanco confirmar'));return}const r=await netAdmin('wipe');if(r)netChatSys(netT('Banco zerado · contas apagadas: ','Database reset · accounts deleted: ')+r.accounts);return}}
/* botão de 2 toques: o 1º pede confirmação por 4 s */
function netTwoStep(btn,fn){btn.addEventListener('click',()=>{if(btn.dataset.arm==='1'){btn.dataset.arm='';netCfgSync();fn();return}btn.dataset.arm='1';netCfgSync();setTimeout(()=>{if(btn.dataset.arm==='1'){btn.dataset.arm='';netCfgSync()}},4000)})}
setTimeout(function netCfgTab(){const t5=$('#cfg-tab-5'),p5=$('#cfg-panel-5');if(!t5||!p5)return;
 const t=document.createElement('button');t.className=t5.className.replace(/\bon\b/,'');t.type='button';t.setAttribute('role','tab');t.id='cfg-tab-7';t.dataset.cfg='7';t.setAttribute('aria-controls','cfg-panel-7');t.setAttribute('aria-selected','false');
 t.innerHTML='<span class="ico" aria-hidden="true">🌐</span><span class="lbl">ONLINE</span>';t5.after(t);t.addEventListener('click',()=>{netCfgSync();selectCfgCategory('7',false)});
 const p=document.createElement('div');p.className=p5.className;p.dataset.cfgPanel='7';p.setAttribute('role','tabpanel');p.id='cfg-panel-7';p.setAttribute('aria-labelledby','cfg-tab-7');p.hidden=true;
 p.innerHTML='<h2>ONLINE</h2><p id="netCfgWho" style="margin:4px 0 14px;color:#c8c0d8"></p><div style="display:flex;flex-direction:column;gap:10px;max-width:360px"><button type="button" class="btn" id="netCfgDel"></button><p id="netCfgDelHint" style="margin:-4px 0 6px;font-size:12px;color:#9a92ae"></p><div id="netCfgAdmin" hidden style="display:flex;flex-direction:column;gap:10px;border-top:1px solid #3a3450;padding-top:12px"><b style="color:#ffd23a;letter-spacing:.1em">ADMIN</b><button type="button" class="btn" id="netCfgWipe"></button><p id="netCfgWipeHint" style="margin:-4px 0 0;font-size:12px;color:#9a92ae"></p></div></div>';
 p5.after(p);netTwoStep($('#netCfgDel'),netAcctDelete);netTwoStep($('#netCfgWipe'),async()=>{const r=await netAdmin('wipe');if(r)toast(netT('BANCO ZERADO · ','DATABASE RESET · ')+r.accounts+netT(' contas apagadas',' accounts deleted'))});netCfgSync()},0);
function netCfgSync(){const t=$('#cfg-tab-7');if(!t)return;t.hidden=!ONLINE.on;if(!ONLINE.on)return;
 $('#netCfgWho').textContent=netT('Conta: ','Account: ')+(ONLINE.name||'');
 const d=$('#netCfgDel'),w=$('#netCfgWipe');d.hidden=!!ONLINE.admin;$('#netCfgDelHint').hidden=!!ONLINE.admin;
 const set=(b,a,c)=>{b.textContent=b.dataset.arm==='1'?c:a;b.onmouseenter=null};set(d,netT('APAGAR MINHA CONTA','DELETE MY ACCOUNT'),netT('TOQUE DE NOVO PARA APAGAR','TAP AGAIN TO DELETE'));
 $('#netCfgDelHint').textContent=netT('Apaga dinheiro, armas, roupa e carro salvos e sai do servidor. Não tem volta.','Deletes your saved money, weapons, clothes and car and leaves the server. No undo.');
 $('#netCfgAdmin').hidden=!ONLINE.admin;set(w,netT('LIMPAR BANCO DE DADOS','CLEAR DATABASE'),netT('TOQUE DE NOVO PARA LIMPAR TUDO','TAP AGAIN TO CLEAR EVERYTHING'));$('#netCfgWipeHint').textContent=netT('Apaga todas as contas menos a do admin, os carros e coletáveis do mundo e o chat. Quem estiver jogando é desconectado.','Deletes every account except admin, the world cars and pickups and the chat. Everyone playing is disconnected.')}
/* ================= r23 · AGENDA DA SALA =================
   Todo jogador conectado vira contato no celular dos outros (ordem alfabética), número 8+id. Ligar = pedido de encontro:
   quem recebe atende ou recusa (Y/N, ou os botões); atendeu → quem ligou é levado para perto dele (teleporte seguro). */
function netPhoneContacts(){return [...ONLINE.peers.values()].filter(p=>p.name).sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'})).map(p=>({name:p.name.toUpperCase().slice(0,16),number:'8'+p.id,peer:p.id}))}
function netPhoneCall(id){const p=ONLINE.peers.get(id);if(!p){toast(netT('NÚMERO FORA DE ÁREA','OUT OF SERVICE'));return false}
 if(simT<(ONLINE.callT||0)){toast(netT('ESPERE UM POUCO PARA LIGAR DE NOVO','WAIT A BIT BEFORE CALLING AGAIN'));return false}ONLINE.callT=simT+10;ONLINE.calling=id;
 ONLINE.out.push({k:'call',to:id});toast(netT('CHAMANDO ','CALLING ')+p.name+'…');return true}
function netCallIncoming(id,name){const p=ONLINE.peers.get(id);if(!p)return;ONLINE.ring={id,name:name||p.name,t:performance.now()};const d=$('#netCall');
 $('#netCallTxt').textContent=(name||p.name)+' '+netT('quer te encontrar','wants to meet you');$('#netCallOk').textContent=netT('ATENDER (Y)','ANSWER (Y)');$('#netCallNo').textContent=netT('RECUSAR (N)','DECLINE (N)');d.hidden=false;try{phoneRing()}catch(e){}
 clearTimeout(ONLINE.ringTO);ONLINE.ringTO=setTimeout(()=>netCallAnswer(false),20000)}
function netCallAnswer(ok){const r=ONLINE.ring;$('#netCall').hidden=true;clearTimeout(ONLINE.ringTO);ONLINE.ring=null;if(!r)return;
 if(ok&&(netHidden()||PL.dead)){toast(netT('VOCÊ ESTÁ FORA DE ALCANCE','YOU ARE OUT OF REACH'));ok=false}
 ONLINE.out.push({k:ok?'callok':'callno',to:r.id});if(ok)toast(r.name+' '+netT('ESTÁ A CAMINHO','IS ON THE WAY'))}
function netCallAccepted(id,name){if(ONLINE.calling!==id)return;ONLINE.calling=0;const p=ONLINE.peers.get(id),s=p&&p.s;
 if(!s||s.w||s.in||s.st==='dead'){toast(netT('NÃO DEU PARA CHEGAR ATÉ ','COULD NOT REACH ')+(name||'?'));return}
 if(PL.inside||PL.dead||ONLINE.ride||!netWorldOk()||(typeof eventLock==='function'&&eventLock())){toast(netT('SAIA DO INTERIOR PARA IR ATÉ ','LEAVE THE INTERIOR TO GO TO ')+(name||'?'));return}
 const [x,z]=s.st==='car'&&s.c?[s.c.x,s.c.z]:[s.x,s.z],a=Math.random()*Math.PI*2;fadeFlash();cheatWarp(x+Math.cos(a)*4,z+Math.sin(a)*4);toast(netT('VOCÊ CHEGOU ATÉ ','YOU REACHED ')+(name||'?'))}
addEventListener('keydown',e=>{if(!ONLINE.ring||$('#netCall').hidden||ONLINE.chatOpen)return;if(e.code==='KeyY'){e.preventDefault();e.stopPropagation();netCallAnswer(true)}else if(e.code==='KeyN'){e.preventDefault();e.stopPropagation();netCallAnswer(false)}},true);
/* ---------- carona (G) e roubo (F) do carro de outro jogador ---------- */
function netPeerCarNear(r){let best=null,bd=r;for(const p of ONLINE.peers.values()){const c=p.car;if(!c||!vehicles.includes(c)||!p.s||p.s.st!=='car'||!c.alive)continue;const d=Math.hypot(c.x-PL.x,c.z-PL.z)-c.t.W/2;if(d<bd){bd=d;best=p}}return best?{p:best,d:bd}:null}
function netLocalCarNear(r){let bd=r;for(const c of carsNearTmp(PL.x,PL.z,9)){if(!c.alive||c.display||c.net)continue;const d=Math.hypot(c.x-PL.x,c.z-PL.z)-c.t.W/2;if(d<bd)bd=d}return bd}
function netRideCar(){if(!ONLINE.ride)return null;const p=ONLINE.peers.get(ONLINE.ride);return p&&p.car&&vehicles.includes(p.car)?p.car:null}
/* r65: bancos de carona por veículo — 4 portas: motorista + 3; picape: motorista + 1 na cabine + 2 na caçamba; 2 portas/moto: motorista + 1.
   Lotado: G tira quem entrou primeiro (depois o 2º, o 3º…) e você pega o lugar. */
const NET_SEATS4=new Set(['sedan','taxi','police','suv','wagon','crossover','hatch','van','bus']);
function netSeatCap(t){return NET_SEATS4.has(t)||t==='pickup'?3:1}
function netRidersOf(id){const l=[];for(const o of ONLINE.peers.values())if(o.s&&o.s.st==='ride'&&o.s.r===id&&!o.s.w)l.push(o);return l.sort((a,b)=>(a.s.rt||0)-(b.s.rt||0))}
function netRideTry(){if(PL.car||PL.dead||ONLINE.ride||PL.inside||PL.heli)return false;const q=netPeerCarNear(4.5);if(!q)return false;
 const t=q.p.s.c&&q.p.s.c.t,cap=netSeatCap(t),rid=netRidersOf(q.p.id);if(rid.length>=cap)ONLINE.out.push({k:'unride',to:rid[0].id});
 const n=Math.min(cap,rid.length+(rid.length>=cap?0:1)),bed=t==='pickup'&&n>=2;
 ONLINE.ride=q.p.id;ONLINE.rideT=Date.now();ONLINE.out.push({k:'ride',to:q.p.id});PL.vx=PL.vz=0;toast(netT('CARONA','RIDE')+' · '+q.p.name+' · '+n+'/'+cap+(bed?netT(' · caçamba',' · truck bed'):'')+'<br><small style="font-size:11px;color:#fff">'+netT('F: descer','F: get out')+'</small>');return true}
/* passageiro: mesma viagem do motorista, sem carro próprio (fade, nova cidade, aparece no ponto do motorista e segue de carona) */
async function netRideTimeJump(target,x,z){if(TIMEJUMP.busy||!ONLINE.ride)return;const rideId=ONLINE.ride;TIMEJUMP.busy=true;
 const fade=$('#timeFade'),loading=$('#loading');let snap=null;try{snap=buildSave()}catch(e){console.warn('carona · snapshot',e)}
 if(!snap){TIMEJUMP.busy=false;netRideExit();return}
 try{musicTravelOut();TIMEJUMP.mute=true;try{engineCut()}catch(e){}timeFadeTo(true);await delayTimeJump(650);
  TIMEJUMP.loading=true;loading.hidden=false;setLoadProgress(5,'140 KM/H · RUPTURA TEMPORAL…');await nextTimeFrame();fade.hidden=true;fade.style.opacity='0';
  S.style=target;clearRiverBoats();await generateCity();initRiverBoats();applyShadows();
  setLoadProgress(45,'RECONSTRUINDO O MESMO MUNDO…');await nextTimeFrame();await warmCityGPU();
  snap.style=target;snap.x=x;snap.z=z;snap.car=null;applySave(snap);if(PL.car){const c=PL.car;PL.car=null;try{removeVehicle(c)}catch(e){}}
  ONLINE.ride=rideId;PL.x=x;PL.z=z;PL.gy=groundY(x,z);PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;$('#speed').hidden=true;$('#carbar').hidden=true;
  updateDayNight(0,true);syncMenu();setLoadProgress(100,'VIAGEM CONCLUÍDA!');
  fade.hidden=false;fade.style.transition='none';fade.style.opacity='1';await nextTimeFrame();loading.hidden=true;musicTravelIn();updateCamera(0);await nextTimeFrame();
  TIMEJUMP.busy=false;TIMEJUMP.loading=false;fade.style.transition='opacity .6s ease-in-out';fade.style.opacity='0';await delayTimeJump(650);fade.hidden=true;
  toast(target==='synthwave'?'140 KM/H · BEM-VINDO AO SYNTHWAVE':'140 KM/H · DE VOLTA AO MODERN')}
 catch(err){try{musicTravelReset()}catch(e){}console.error('Viagem de carona:',err);loading.hidden=true;fade.hidden=true;fade.style.opacity='0';toast('ERRO NA VIAGEM TEMPORAL · VEJA O CONSOLE')}
 finally{TIMEJUMP.mute=false;TIMEJUMP.busy=false;TIMEJUMP.loading=false;TIMEJUMP.cool=Math.max(TIMEJUMP.cool,4)}}
function netRideExit(){const c=netRideCar();ONLINE.ride=0;try{PL.sp.visible=true;PL.sh.visible=true}catch(e){}if(c){const a=c.a+Math.PI/2,o={x:c.x+Math.cos(a)*(c.t.W/2+1),z:c.z+Math.sin(a)*(c.t.W/2+1)};circleVsWorld(o,.4);PL.x=o.x;PL.z=o.z;PL.gy=groundY(PL.x,PL.z)}PL.vx=PL.vz=0}
function netRideFrame(){if(!ONLINE.ride)return;const p=ONLINE.peers.get(ONLINE.ride);
 /* r52: motorista trocando de mundo (DeLorean a 140): o passageiro espera escondido e vai junto */
 if(p&&p.s&&!PL.dead&&!PL.inside&&(p.s.st==='car'||p.s.tj||ONLINE.rideWait)){const wk=p.s.wk||'modern';
  if(p.s.tj||netTransit()){PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;ONLINE.rideWait=(ONLINE.rideWait||0)+1;return}
  if(wk!==netWorldKey()){const me=netWorldKey();
   /* r65: troca de mundo leva todos os passageiros — DeLorean (modern↔synthwave), fenda (↔ invertido) e névoa (↔ Point Haze) */
   if((wk==='synthwave'&&me==='modern')||(wk==='modern'&&me==='synthwave')){if(p.s.c)void netRideTimeJump(wk,p.s.c.x,p.s.c.z);else netRideExit();return}
   if(wk==='inverted'||me==='inverted'){PL.sp.visible=false;PL.sh.visible=false;void invertShiftWorld(wk==='inverted'?'inverted':'modern');return}
   if(wk==='haze'||me==='haze'){PL.sp.visible=false;PL.sh.visible=false;void hazeShift(wk==='haze');return}
   netRideExit();return}}
 ONLINE.rideWait=0;const c=netRideCar();if(!c||!p||!p.s||p.s.st!=='car'||!c.alive||c.onFire||PL.dead||PL.car||PL.inside){netRideExit();return}
 PL.x=c.x;PL.z=c.z;PL.vx=0;PL.vz=0;PL.gy=c.gy||groundY(c.x,c.z);PL.sp.visible=false;PL.sh.visible=false;LOOK.t=0 /* carona: olhar livre não volta sozinho para a frente */}
function netEnterHook(){if(ONLINE.ride){netRideExit();return true}if(PL.car||PL.dead||PL.inside||PL.heli)return false;
 const q=netPeerCarNear(4.5);if(!q||netLocalCarNear(q.d)<q.d)return false;const sid=q.p.s.c&&q.p.s.c.sid;if(!sid)return false;
 ONLINE.out.push({k:'jack',to:q.p.id});ONLINE.jack={sid,t:simT};toast(translatePlain('ROUBANDO O CARRO…'));return true}
/* ---------- quadro: posiciona os outros jogadores ---------- */
/* v3 r30: barra de vida do carro embaixo do nome (redesenha só quando muda de faixa de 5%) */
function netTagCar(p,c){const tag=p.tag;if(!tag)return;const h=c&&c.alive?Math.round((c.netHp??100)/5)*5:-1;if(tag.hpShown===h)return;tag.hpShown=h;const cvs=tag.material.map.image,g=cvs.getContext('2d');
 g.clearRect(0,0,cvs.width,cvs.height);g.font='800 26px Segoe UI,Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(p.name,128,24);g.fillStyle='#ffffff';g.fillText(p.name,128,24);
 if(h>=0&&h<100){g.fillStyle='rgba(0,0,0,.8)';g.fillRect(70,39,116,8);g.fillStyle=h<35?'#ff4a3a':h<65?'#ffc53a':'#4ade6a';g.fillRect(72,41,112*h/100,4)}tag.material.map.needsUpdate=true}
function netTag(p){if(p.tag)return p.tag;const c=cv(256,48),g=c.getContext('2d');g.font='800 26px Segoe UI,Arial';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(p.name,128,24);g.fillStyle='#ffffff';g.fillText(p.name,128,24);
 const t=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,sizeAttenuation:false,fog:false,toneMapped:false}));sp.scale.set(.26,.049,1);sp.renderOrder=6;sp.position.set(0,-9999,0);scene.add(sp);p.tag=sp;return sp}
function netAngLerp(a,b,k){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*k}
function netFrame(dt){if(!ONLINE.on)return;const hideAll=netHidden(),k=1-Math.exp(-dt*12);netProtFrame();
 /* roubo: entra no quadro seguinte (o carro recém-criado já está na grade de carsNear) */
 if(ONLINE.jackGo){const c=ONLINE.jackGo;ONLINE.jackGo=null;if(c.alive&&vehicles.includes(c)&&!PL.car&&!PL.dead){PL.x=c.x+Math.cos(c.a+Math.PI/2)*(c.t.W/2+.6);PL.z=c.z+Math.sin(c.a+Math.PI/2)*(c.t.W/2+.6);enterExit()}}
 for(const p of ONLINE.peers.values()){const s=p.s,tag=netTag(p);
  if(!netPeerShown(s)||hideAll){if(p.ped&&peds.includes(p.ped)){removePed(p.ped)}p.ped=null;if(p.car&&vehicles.includes(p.car))removeVehicle(p.car);p.car=null;tag.visible=false;continue}
  const lag=Math.min(.35,(performance.now()-(p.recv||0))/1000);let ax,az,ay=1.95;
  if(s.st==='car'&&s.c){const C=s.c;if(p.ped&&peds.includes(p.ped))removePed(p.ped);p.ped=null;
   /* carro do servidor: a minha cópia parada some enquanto ele dirige */
   if(C.sid&&C.sid!==p.sid){p.sid=C.sid;const lc=netCarFind(C.sid);if(lc&&lc!==PL.car){if(PL.lastCar===lc)PL.lastCar=null;removeVehicle(lc)}}
   if(!p.car||!vehicles.includes(p.car)||p.car.type!==C.t||p.car.color!==C.col||(p.car.neon?p.car.neonCol:0)!==(C.ne||0)){if(p.car&&vehicles.includes(p.car))removeVehicle(p.car);
    const t=VT[C.t]&&!VT[C.t].boat?C.t:'sedan',c=makeVehicle(t,C.x,C.z,C.a,C.col);c.net=p.id;c.mode='net';c.rail=null;c.ai=null;c.keep=true;c.hand=true;c.sleep=true;c.hp=1e6;c.legal=true;if(C.ne){c.neon=true;c.neonCol=C.ne}if(C.pl)setCarPlate(c,C.pl);p.car=c;p.rx=C.x;p.rz=C.z;p.ra=C.a}
   if(C.pl&&p.car.plate!==C.pl)try{setCarPlate(p.car,C.pl)}catch(e){}
   const c=p.car,tx=C.x+Math.cos(C.a)*C.v*lag,tz=C.z+Math.sin(C.a)*C.v*lag;if(Math.hypot(tx-c.x,tz-c.z)>25){c.x=tx;c.z=tz}else{c.x+=(tx-c.x)*k;c.z+=(tz-c.z)*k}c.a=netAngLerp(c.a,C.a,k);c.fwd=C.v;c.vx=Math.cos(c.a)*C.v;c.vz=Math.sin(c.a)*C.v;c.gy=groundY(c.x,c.z);
   if(c.alive)c.hp=1e6;netCarDmgIn(c,C,true);netCarSmoke(c,dt);netTagCar(p,c);if(c.g&&c.sleep)try{syncCar(c,dt)}catch(e){} /* r16: carro parado (sleep) não passa pelo syncCar do laço: a malha ficava onde nasceu */if(C.f&&c.alive&&!c.onFire){c.netFire=true;setOnFire(c)}p.carT=C.sid?0:8;ax=c.x;az=c.z;ay=(c.gy||0)+c.t.H+.9;
   /* atropelado pelo carro de outro jogador: a vítima (eu) aplica o dano */
   if(!PL.car&&!PL.dead&&ONLINE.ride!==p.id&&Math.abs(C.v)>5&&Math.hypot(PL.x-c.x,PL.z-c.z)<c.t.L*.45&&simT>(ONLINE.runT||0)){ONLINE.runT=simT+1;ONLINE.lastHitBy=p.id;ONLINE.lastHitT=simT;PL.hp-=armorHit(Math.abs(C.v)*3);try{knockPlayer&&knockPlayer(c.vx,c.vz)}catch(_){}if(PL.hp<=0)killPlayer(translatePlain('ATROPELADO POR')+' '+p.name)}}
  else{/* a pé (ou morto): ped com a roupa do jogador; carro do servidor que ele largou some já (o mundo põe a cópia parada); outro fica 8 s parado e some */
   p.sid=null;netTagCar(p,null);if(p.car){p.carT-=dt;if(p.carT<=0||!vehicles.includes(p.car)){if(vehicles.includes(p.car))removeVehicle(p.car);p.car=null}else{p.car.fwd=p.car.vx=p.car.vz=0}}
   if(s.st==='dead'||s.st==='ride'){if(p.ped&&peds.includes(p.ped))removePed(p.ped);p.ped=null;tag.visible=false;continue}
   if(!p.ped||!peds.includes(p.ped)){const q=spawnPed(null,{x:s.x,z:s.z,vx:0,vz:0,main:true,pal:{...(p.look||PLAYER_PAL),pack:false}});if(!q){tag.visible=false;continue}q.state='duoFollow';q.fixed=true;q.at={x:s.x,z:s.z};q.mx=Math.cos(s.f);q.mz=Math.sin(s.f);q.net=p.id;q.hp=3;q.duoMoving=false;p.ped=q;p.mk=(p.mk||0)+1}
   const q=p.ped,tx=s.x,tz=s.z;if(Math.hypot(tx-q.at.x,tz-q.at.z)>12){q.at.x=tx;q.at.z=tz}else{q.at.x+=(tx-q.at.x)*k;q.at.z+=(tz-q.at.z)*k}q.mx=Math.cos(s.f);q.mz=Math.sin(s.f);q.duoMoving=!!s.m;q.hp=3;if(q.state!=='duoFollow'){q.state='duoFollow';q.fixed=true}netGhost(q.sp,q.sh,!!s.g);
   ax=q.at.x;az=q.at.z;ay=(q.gy||groundY(ax,az))+2.05}
  tag.visible=Math.hypot(ax-camera.position.x,az-camera.position.z)<90;tag.position.set(ax,ay,az)}
 netNpcFrame(dt);netRideFrame();netCollide();netPvDueTick();netImpoundHint();
 if(!PL.car&&!ONLINE.ride&&!PL.dead&&simT>(ONLINE.hintT||0)&&netPeerCarNear(3.5)){ONLINE.hintT=simT+25;toast(translatePlain('G CARONA · F ROUBAR'))}}
/* v3 r27: carros dos outros (jogadores e trânsito/viaturas de outro host) são corpos sólidos com massa. Cada jogo aplica só a SUA metade
   do choque (posição + impulso no próprio carro); o outro lado calcula a dele. Batida em carro do servidor manda o empurrão para quem simula (nph). */
function netCarHit(A,B,n){const dx=A.x-B.x,dz=A.z-B.z,rs=A.t.R+B.t.R;if(dx*dx+dz*dz>rs*rs)return;if(!!A.t.boat!==!!B.t.boat)return;if((A.airY||0)>B.t.H-.3||(B.airY||0)>A.t.H-.3)return;
 const caA=Math.cos(A.a),saA=Math.sin(A.a),caB=Math.cos(B.a),saB=Math.sin(B.a),rA=A.t.W/2,rB=B.t.W/2;let best=0,bnx=0,bnz=0,bpx=0,bpz=0;
 for(const oa of A.t.circ){const ax=A.x+oa*caA,az=A.z+oa*saA;for(const ob of B.t.circ){const bx=B.x+ob*caB,bz=B.z+ob*saB,ex=ax-bx,ez=az-bz,d=Math.hypot(ex,ez),pen=rA+rB-d;if(pen>best&&d>1e-4){best=pen;bnx=ex/d;bnz=ez/d;bpx=bx+bnx*rB;bpz=bz+bnz*rB}}}
 if(best<=0)return;const iA=1/A.m,iB=1/B.m,sh=Math.max(.6,iA/(iA+iB));A.x+=bnx*best*sh;A.z+=bnz*best*sh;
 B.w=0;const[avx,avz]=pointVel(A,bpx,bpz),[bvx,bvz]=pointVel(B,bpx,bpz),vn=(avx-bvx)*bnx+(avz-bvz)*bnz;if(vn>=0)return;
 /* a cópia remota segue andando pela previsão (velocidade antiga) uns quadros depois da batida: um impulso só a cada 0,4 s por carro */
 if(simT<(B.netHitT||0))return;B.netHitT=simT+.4;
 const rnA=(bpx-A.x)*bnz-(bpz-A.z)*bnx,rnB=(bpx-B.x)*bnz-(bpz-B.z)*bnx,j=-1.3*vn/(iA+iB+rnA*rnA/A.I+rnB*rnB/B.I);
 A.vx+=j*bnx*iA;A.vz+=j*bnz*iA;A.w+=rnA*j/A.I;A.sleep=false;try{impact(A,-vn,bpx,bpz)}catch(_){}
 if(n&&n.h!==ONLINE.id&&simT>(n.hitT||0)){n.hitT=simT+.25;const v=-vn;ONLINE.out.push({k:'nph',to:n.h,id:n.id,jx:+(-j*bnx*iB).toFixed(2),jz:+(-j*bnz*iB).toFixed(2),d:v>6?Math.round((v-6)*3.2*CRASH_DMG*10)/10:0})}}
/* lista dos carros remotos deste quadro (jogadores + trânsito de outro host) */
function netRemoteCars(){const L=ONLINE.rc||(ONLINE.rc=[]);L.length=0;for(const p of ONLINE.peers.values()){const c=p.car;if(c&&vehicles.includes(c))L.push(c)}for(const n of ONLINE.npc.values()){const c=n.car;if(c&&n.h!==ONLINE.id&&vehicles.includes(c))L.push(c)}return L}
/* chamado em cada subpasso da física (update): o meu carro contra os remotos — pega batida de frente em alta velocidade */
function netSubHit(){const me=PL.car;if(!me||!me.alive||me.mode!=='phys'||!ONLINE.rc)return;for(const c of ONLINE.rc){if(c===me||!vehicles.includes(c))continue;netCarHit(me,c,c.npcId?ONLINE.npc.get(c.npcId):null)}}
function netCollide(){const L=netRemoteCars();if(PL.car||PL.dead||ONLINE.ride)return;
 for(const c of L){const dx=PL.x-c.x,dz=PL.z-c.z,d=Math.hypot(dx,dz)||1,R=c.t.L*.42;if(d<R){PL.x+=dx/d*(R-d);PL.z+=dz/d*(R-d)}
  /* atropelado por carro do trânsito de outro host (o dos jogadores já é tratado no netFrame) */
  if(c.npcId&&c.alive&&Math.abs(c.fwd||0)>5&&d<c.t.L*.45&&simT>(ONLINE.runT||0)){ONLINE.runT=simT+1;PL.hp-=armorHit(Math.abs(c.fwd)*3);try{knockPlayer&&knockPlayer(c.vx,c.vz)}catch(_){}if(PL.hp<=0)killPlayer(translatePlain('ATROPELADO'))}}}

/* ================= v3 r27 · TRÁFEGO E VIATURAS DO SERVIDOR =================
   O servidor decide quantos carros existem (2 de trânsito por jogador + viaturas pelo total de jogadores) e quem simula cada um (host).
   O host cria o carro numa faixa perto dele (fora da câmera), dirige com a IA normal de trilho e manda a posição no tick (np).
   Os outros jogos desenham uma cópia sem física (mode 'net', c.net='n'+id), igual aos carros dos jogadores. Longe demais / destruído /
   o host entrou nele = some (nx) e o servidor cria outro. Tiro/batida na cópia vira evento nph para o host aplicar. */
ONLINE.npc=new Map();ONLINE.npcGone=[];
function netNpcCanHost(){return !!(played&&city&&city.N&&netWorldOk()&&!PL.inside&&!PL.dead&&$('#loading').hidden)}
function netNpcSpot(kind){const pc=PL.car||PL,N=city.N,cx=Math.round(pc.x/P),cz=Math.round(pc.z/P),cam=camera.position,fx=pc.x-cam.x,fz=pc.z-cam.z,fl=Math.hypot(fx,fz)||1;
 for(let k=0;k<70;k++){const kx=clamp(cx+Math.floor(Math.random()*7)-3,0,N),kz=clamp(cz+Math.floor(Math.random()*7)-3,0,N),d=Math.floor(Math.random()*4),li=kind==='p'?0:Math.random()<.5?0:1;
  if(!segExists(kx,kz,d)||obraClosed(kx,kz,d)||!laneValid(kx,kz,d,li))continue;const s=RW/2+4+Math.random()*(SEG_END-RW/2-8),p=lanePt(kx,kz,d,li,s),dd=Math.hypot(p[0]-pc.x,p[1]-pc.z);
  if(dd<45||dd>160||inWater(p[0],p[1]))continue;
  /* na frente da câmera e perto: ia "brotar" na vista */
  const vx=p[0]-cam.x,vz=p[1]-cam.z,vl=Math.hypot(vx,vz)||1;if(vl<130&&(vx*fx+vz*fz)/(vl*fl)>.45)continue;
  if(carsNear(p[0],p[1],8).length)continue;let nearPeer=false;for(const q of ONLINE.peers.values()){const s2=q.s;if(s2&&!s2.w&&Math.hypot(s2.x-p[0],s2.z-p[1])<35){nearPeer=true;break}}if(nearPeer)continue;
  return makeRailCar(kx,kz,d,li,s,kind==='p'?'police':undefined)}return null}
function netNpcDrop(n,keepCar){const c=n.car;n.car=null;if(c){c.npcId=0;if(!keepCar&&vehicles.includes(c)&&c!==PL.car)removeVehicle(c)}}
/* resposta do tick: [id,k,host,tipo,cor,x,z,a,v,f] */
function netNpcApply(rows){if(!Array.isArray(rows))return;const seen=new Set();
 for(const r of rows){if(!Array.isArray(r))continue;const id=r[0]|0;if(!id)continue;seen.add(id);let n=ONLINE.npc.get(id);
  if(!n){n={id,k:r[1]==='p'?'p':'t',h:r[2]|0,car:null};ONLINE.npc.set(id,n)}
  if((r[2]|0)!==n.h){netNpcDrop(n);n.h=r[2]|0}
  if(n.h===ONLINE.id)continue;n.t=String(r[3]||'sedan');n.col=r[4]||null;n.x=r[5];n.z=r[6];n.a=+r[7]||0;n.v=+r[8]||0;n.f=!!r[9];n.recv=performance.now()}
 for(const [id,n] of ONLINE.npc)if(!seen.has(id)){/* o meu sumiu do servidor (expirou): larga também */netNpcDrop(n,n.h===ONLINE.id&&n.car===PL.car);ONLINE.npc.delete(id)}}
/* corpo do tick: posso simular? posições dos meus e os que sumiram */
function netNpcOut(body){const can=netNpcCanHost();body.nh=can?1:0;if(!can){for(const n of ONLINE.npc.values())if(n.h===ONLINE.id)netNpcDrop(n);ONLINE.npcGone.length=0;return}
 const np=[];for(const n of ONLINE.npc.values()){if(n.h!==ONLINE.id){if(n.dmg>0){ONLINE.out.push({k:'nph',to:n.h,id:n.id,jx:0,jz:0,d:Math.min(250,Math.round(n.dmg*10)/10)});n.dmg=0}continue}
  const c=n.car;if(!c||!vehicles.includes(c))continue;np.push([n.id,+c.x.toFixed(2),+c.z.toFixed(2),+c.a.toFixed(3),+(c.mode==='rail'&&c.rail?c.rail.v:c.fwd||0).toFixed(2),c.onFire||!c.alive?1:0,c.type,/^#[0-9a-f]{6}$/i.test(c.color||'')?c.color:''])}
 if(np.length)body.np=np;if(ONLINE.npcGone.length)body.nx=ONLINE.npcGone.splice(0,12)}
function netNpcGone(n){netNpcDrop(n,true);ONLINE.npcGone.push(n.id);ONLINE.npc.delete(n.id)}
/* tiro/fogo numa cópia remota (netHit com id 'nID'): acumula e manda para o host no próximo tick */
function netNpcDmg(id,dmg){const n=ONLINE.npc.get(id);if(n&&n.h!==ONLINE.id&&dmg>0)n.dmg=Math.min(250,(n.dmg||0)+dmg)}
/* host: alguém bateu/atirou no meu carro do servidor */
function netNpcHit(d){const n=ONLINE.npc.get(d.id|0);const c=n&&n.h===ONLINE.id&&n.car;if(!c||!vehicles.includes(c)||!c.alive)return;
 const jx=+d.jx||0,jz=+d.jz||0;if(jx||jz){if(c.mode==='rail')toPhys(c);c.vx+=jx;c.vz+=jz;c.sleep=false;if(c.ai)c.ai.stun=1.5+Math.random();if(Math.hypot(jx,jz)>3)try{carDent(c,Math.hypot(jx,jz)*2,c.x,c.z)}catch(_){}}
 if(+d.d>0){if(c.mode==='rail')toPhys(c);c.hp-=+d.d;c.sleep=false;if(c.hp<=0)setOnFire(c)}}
function netNpcFrame(dt){const me=ONLINE.id,can=netNpcCanHost(),pc=PL.car||PL,k=1-Math.exp(-dt*12);
 for(const n of [...ONLINE.npc.values()]){
  if(n.h===me){if(!can)continue;const c=n.car;
   if(c){if(c===PL.car){netNpcGone(n);continue} /* entrei nele: vira o meu carro */
    if(!vehicles.includes(c)||c.sunk||Math.hypot(c.x-pc.x,c.z-pc.z)>240||(!c.alive&&simT-(c.wreckAt||simT)>20)){if(vehicles.includes(c)&&c!==PL.car)removeVehicle(c);netNpcGone(n)}continue}
   if(simT<(n.tryT||0))continue;n.tryT=simT+1.5;const nc=netNpcSpot(n.k);if(nc){nc.npcId=n.id;nc.keep=false;n.car=nc}continue}
  /* cópia de outro host */
  const ok=can&&Number.isFinite(n.x)&&Number.isFinite(n.z)&&Math.abs(n.x-pc.x)<NET_NPC_R&&Math.abs(n.z-pc.z)<NET_NPC_R;
  if(!ok){if(n.car)netNpcDrop(n);continue}
  let c=n.car;const t=VT[n.t]&&!VT[n.t].boat?n.t:'sedan';
  if(!c||!vehicles.includes(c)||c.type!==t){if(c&&vehicles.includes(c))removeVehicle(c);c=makeVehicle(t,n.x,n.z,n.a,n.col||null);c.net='n'+n.id;c.npcId=n.id;c.mode='net';c.rail=null;c.ai=null;c.keep=true;c.hand=true;c.sleep=true;c.hp=1e6;c.legal=true;c.w=0;n.car=c}
  if(c.alive){if(c.hp<1e6){netNpcDmg(n.id,1e6-c.hp);c.hp=1e6}
   const lag=Math.min(.35,(performance.now()-(n.recv||0))/1000),tx=n.x+Math.cos(n.a)*n.v*lag,tz=n.z+Math.sin(n.a)*n.v*lag;
   if(Math.hypot(tx-c.x,tz-c.z)>25){c.x=tx;c.z=tz}else{c.x+=(tx-c.x)*k;c.z+=(tz-c.z)*k}c.a=netAngLerp(c.a,n.a,k);c.fwd=n.v;c.vx=Math.cos(c.a)*n.v;c.vz=Math.sin(c.a)*n.v;c.w=0;c.gy=groundY(c.x,c.z);
   if(c.g&&c.sleep)try{syncCar(c,dt)}catch(e){}if(n.f&&!c.onFire){c.netFire=true;setOnFire(c)}}}}
const NET_NPC_R=300;
/* ---------- chat (T) ---------- */
function netChatEl(){return $('#onChatLog')}
function netChatLine(html){const el=netChatEl();if(!el)return;const d=document.createElement('div');d.className='ocl';d.append(...html);el.appendChild(d);while(el.children.length>40)el.removeChild(el.firstChild);el.scrollTop=el.scrollHeight;d._t=performance.now();el.classList.add('fresh');clearTimeout(netChatLine._h);netChatLine._h=setTimeout(()=>el.classList.remove('fresh'),9000)}
function netChatAdd(name,msg,mine){const n=document.createElement('b');n.textContent=name+': ';n.style.color=mine?'#7ad8ff':'#ffd23a';const m=document.createElement('span');m.textContent=msg;netChatLine([n,m])}
function netChatSys(msg){const m=document.createElement('i');m.textContent=msg;netChatLine([m])}
function netChatOpen(){if(!ONLINE.on||ONLINE.chatOpen)return;ONLINE.chatOpen=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();const i=$('#onChatIn');i.hidden=false;i.value='';$('#onChatLog').classList.add('open');setTimeout(()=>i.focus(),0)}
function netChatClose(send){const i=$('#onChatIn');if(send){const m=i.value.trim();if(/^\/(carro|car)\b/i.test(m))setTimeout(netPvOrder,0);else if(/^\/(jogadores|players|online|quem|who)\b/i.test(m))setTimeout(netPlayersChat,0);else if(/^\/(contas|apagar|limparbanco)\b/i.test(m))setTimeout(()=>netAdminCmd(m),0);else if(m)ONLINE.out.push({k:'chat',m:m.slice(0,120)})}ONLINE.chatOpen=false;i.hidden=true;i.blur();$('#onChatLog').classList.remove('open')}
/* minimapa: outros jogadores como bolinhas */
/* r14: cor da bolinha = cor da camisa do jogador (sem camisa: biquíni/pele) */
function netPeerCol(q){const L=q.look||{};return L.shirt||L.bikini||L.swim||L.skin||'#3aff8a'}
function netPeerPos(q){const s=q.s;if(s.st==='car'&&q.car&&vehicles.includes(q.car))return [q.car.x,q.car.z];if(s.st!=='car'&&q.ped&&q.ped.at&&peds.includes(q.ped))return [q.ped.at.x,q.ped.at.z];return s.st==='car'&&s.c?[s.c.x,s.c.z]:[s.x,s.z]}
function netMinimap(g,p,sc){const r0=sc?7/sc:5.6,r1=sc?5.2/sc:4;for(const q of ONLINE.peers.values()){const s=q.s;if(!netPeerShown(s))continue;const [x,z]=netPeerPos(q);if(Math.abs(x-p.x)>130||Math.abs(z-p.z)>130)continue;
 g.fillStyle='#000';g.beginPath();g.arc(x+MOFF,z+MOFF,r0,0,7);g.fill();g.fillStyle=s.st==='dead'?'#888':netPeerCol(q);g.beginPath();g.arc(x+MOFF,z+MOFF,r1,0,7);g.fill()}}
/* r20: lista de quem está na sessão — no mapa grande (abaixo do título) e com /jogadores no chat */
function netPlayerRows(){const st=s=>!s?'…':s.wk==='backrooms'?'Backrooms':s.in?netT('em um interior','inside'):(s.w||(s.wk&&s.wk!=='modern'))?netT('fora da cidade','away'):s.st==='dead'?netT('morto','dead'):s.st==='car'?netT('dirigindo','driving'):s.st==='ride'?netT('de carona','riding'):netT('a pé','on foot');
 const me={name:ONLINE.name,me:true,col:PLAYER_PAL.shirt||PLAYER_PAL.bikini||'#fff',k:ONLINE.meKD?ONLINE.meKD.k:0,d:ONLINE.meKD?ONLINE.meKD.d:0,st:PL.dead?netT('morto','dead'):PL.inside==='backrooms'?'Backrooms':(netAway()||netTransit())&&!PL.inside?netT('fora da cidade','away'):PL.inside?netT('em um interior','inside'):PL.car?netT('dirigindo','driving'):ONLINE.ride?netT('de carona','riding'):netT('a pé','on foot')};
 const L=[...ONLINE.peers.values()].map(p=>({name:p.name,col:netPeerCol(p),k:p.k|0,d:p.d|0,st:st(p.s)})).sort((a,b)=>b.k-a.k||a.name.localeCompare(b.name));return [me,...L]}
/* painel retrátil no mapa grande (acima de LEGENDA / VER CIDADE): 0 a 24 jogadores, inclusive quem está em interior ou fora da cidade */
function netPlayerPanel(){const box=$('#mapPlayers'),cb=$('#onChatBtn');if(!ONLINE.on||!NAV.open){box.hidden=true;if(cb)cb.style.visibility='';return}box.hidden=false;if(cb)cb.style.visibility='hidden'; /* o botão do chat (celular) ficava por cima da lista */
 if(performance.now()<(ONLINE.plT||0))return;ONLINE.plT=performance.now()+500;const rows=netPlayerRows(),open=!!ONLINE.plOpen,h=$('#mapPlayersHead'),L=$('#mapPlayersList');
 h.textContent=(open?'▾ ':'▸ ')+netT('JOGADORES','PLAYERS')+' · '+rows.length;h.setAttribute('aria-expanded',String(open));L.hidden=!open;if(!open)return;
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const html='<div class="pr ph"><b></b><em>'+netT('abates/mortes','kills/deaths')+'</em></div>'+rows.map(r=>'<div class="pr'+(r.me?' me':'')+'"><i style="background:'+esc(r.col)+'"></i><b>'+esc(r.name)+'<small>'+esc(r.st)+'</small></b><em>'+r.k+'/'+r.d+'</em></div>').join('');if(L.dataset.h!==html){L.dataset.h=html;L.innerHTML=html}}
function netPlayersChat(){const rows=netPlayerRows();netChatSys(netT('JOGADORES','PLAYERS')+' ('+rows.length+'): '+rows.map(r=>r.name+' ('+r.k+netT(' abates, ',' kills, ')+r.d+netT(' mortes)',' deaths)')).join(' · '))}
/* r14: mapa grande — bolinha com a cor da camisa + nome */
function netBigmap(g,v){g.save();g.font='700 12px Segoe UI,Arial';g.textAlign='center';g.textBaseline='bottom';g.lineWidth=3;
 for(const q of ONLINE.peers.values()){const s=q.s;if(!netPeerShown(s))continue;const [x,z]=netPeerPos(q),sx=v.ox+(x+MOFF)*v.sc,sy=v.oy+(z+MOFF)*v.sc;
  g.fillStyle='#000';g.beginPath();g.arc(sx,sy,7.5,0,7);g.fill();g.fillStyle=s.st==='dead'?'#888':netPeerCol(q);g.beginPath();g.arc(sx,sy,5.5,0,7);g.fill();
  g.strokeStyle='rgba(0,0,0,.9)';g.strokeText(q.name,sx,sy-9);g.fillStyle='#fff';g.fillText(q.name,sx,sy-9)}
 g.restore()}
$('#onGo').addEventListener('click',onGoClick);$('#onCar').addEventListener('change',onCarPaint);$('#onCol').addEventListener('input',onCarPaint);$('#onSexN').addEventListener('click',()=>{if(onJl().g!==0)onJlSet({g:0,pal:{}})});$('#onSexC').addEventListener('click',()=>{if(onJl().g!==1)onJlSet({g:1,pal:{}})});$('#onExp').addEventListener('click',onExport);$('#onImp').addEventListener('click',()=>$('#onImpF').click());$('#onImpF').addEventListener('change',e=>{onImport(e.target.files&&e.target.files[0]);e.target.value=''});$('#onBack').addEventListener('click',()=>{onJoinClose()});
$('#onSrv').addEventListener('change',netSrvInfo);
for(const id of ['#onName','#onPass','#onPlate','#onSrv','#onChatIn'])$(id).addEventListener('keydown',e=>{e.stopPropagation();if(id==='#onChatIn'){if(e.key==='Enter'){e.preventDefault();netChatClose(true)}else if(e.key==='Escape'){e.preventDefault();netChatClose(false)}}else{if(e.key==='Enter'){e.preventDefault();onGoClick()}else if(e.key==='Escape'){e.preventDefault();onJoinClose()}}});
for(const id of ['#onName','#onPass','#onPlate','#onSrv','#onChatIn'])$(id).addEventListener('keyup',e=>e.stopPropagation());
$('#onChatBtn').addEventListener('click',()=>{if(ONLINE.chatOpen)netChatClose(true);else netChatOpen()});
addEventListener('keydown',e=>{if(!ONLINE.on||!played||ONLINE.chatOpen||menuOpen||e.repeat)return;if(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName||''))return;const c=PL.car,misK=!!(PL.taxi||MIS.type||(c&&(c.type==='taxi'||c.police||c.ambulance))); /* v3 r17: T no veículo de serviço = missão; ENTER também abre a conversa */
 if((e.code==='KeyT'&&!misK)||(e.code==='Enter'&&!DLG.on&&!PHONE.open&&!NAV.open&&!SLOT.open&&!TABLE_GAME.open&&!cfgOpen&&!cmdsOpen&&!SKATE.ui)){e.preventDefault();e.stopImmediatePropagation();netChatOpen()}},true);
addEventListener('pagehide',()=>{if(ONLINE.on&&ONLINE.token)try{navigator.sendBeacon(ONLINE.url+'?a=leave',new Blob([JSON.stringify({token:ONLINE.token})],{type:'text/plain'}))}catch(e){}});

