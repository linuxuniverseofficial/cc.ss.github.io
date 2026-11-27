'use strict';
/* ===== SORTE (v4) =====
   LUCK.v 0–100 (começa 50). Sobe com trevo de 4 folhas (+8), coletáveis do mapa (+1), discos (+3), dinheiro achado no chão (+0,2),
   tiro na cabeça (+0,5, até +3 por minuto) e carona em alta velocidade (outra frente chama luckAdd(dt*k,'carona')).
   Desce: atropelar gato preto (CAT_COLS[1]) −15, morrer −5, ser preso −5, atropelar inocente −1. Volta devagar para 50 (0,4/min).
   Jogos de azar: luckBias() = −0,08 (sorte 0) … +0,08 (sorte 100) de chance RELATIVA, aplicado num re-sorteio antes de revelar
   (caça-níquel: chance do jackpot; roleta: re-sorteio do número; 21/pôquer: troca do baralho antes de dar as cartas;
   dados: o adversário erra a desconfiança do seu lance). Trevos: 6 por cidade em parque/roça, gerador próprio (seed intacta),
   renascem a cada dia de jogo (DN.day), ícone no mapa depois de avistar (30 m). Barra fina no HUD (abaixo da vida) e no painel do mapa. */
const LUCK={v:50,flash:0,headT:0,headN:0,day:null,acc:0,clov:[],got:new Set(),built:false,geo:null,mats:null,lastV:50,catSeen:new WeakSet()};
const LUCK_DECK_K={bj:7,poker:1.15}; /* força da troca de baralho (calibrado no teste: ±~8% relativo na chance de ganhar/pagamento) */
function luckBias(){return (Math.max(0,Math.min(100,LUCK.v))-50)/50*.08}
function luckMod(){return 1+luckBias()}
function luckChance(p){return Math.random()<p*luckMod()}
function luckAdd(v,src){if(!Number.isFinite(v)||!v)return;const a=LUCK.v;LUCK.v=Math.max(0,Math.min(100,LUCK.v+v));
 LUCK.acc+=LUCK.v-a;if(Math.abs(LUCK.acc)>=1||src==='trevo'||src==='gato'){LUCK.flash=2.6;LUCK.acc=0}}
/* roleta: re-sorteio honesto. p = chance de ganhar com essa aposta; com sorte b>0, se perdeu, sorteia de novo com prob b/(1−p) (e o contrário com b<0) → P(ganhar)=p·(1+b) */
function luckRoul(bt,pk){let n=Math.floor(Math.random()*37);const b=luckBias();if(!b||typeof rlWins!=='function')return n;
 let w=0;for(let i=0;i<37;i++)if(rlWins(bt,i,pk))w++;const p=w/37;if(p<=0||p>=1)return n;const win=rlWins(bt,n,pk),q=Math.abs(b)/(1-p);
 if((b>0&&!win)||(b<0&&win)){if(Math.random()<q)n=Math.floor(Math.random()*37)}return n}
/* 21/pôquer: com chance |b|·K tira um 2º baralho e fica com o melhor (sorte) ou o pior (azar) para o jogador; tudo antes de dar as cartas */
function luckDeckScore(kind,d){const L=d.length;if(kind==='bj'){const pc=[d[L-1],d[L-3]],s=tgBlackScore(pc),up=d[L-2].r===14?11:Math.min(10,d[L-2].r);return s+(s===21?6:0)-up*.5}
 const h=[d[L-1],d[L-2],d[L-3],d[L-4],d[L-5]],r=tgPokerResult(h).rank;let hi=0;const c={};for(const x of h){c[x.r]=(c[x.r]||0)+1;if(x.r>=11)hi++}let pr=0;for(const k in c)if(c[k]>=2)pr+=+k>=11?2:1;return r*20+pr*3+hi}
function luckDeck(kind){const d=tgDeck(),b=luckBias();if(!b||Math.random()>=Math.abs(b)*(LUCK_DECK_K[kind]||1))return d;const d2=tgDeck(),s1=luckDeckScore(kind,d),s2=luckDeckScore(kind,d2);
 if(s1===s2)return d;return (b>0)===(s2>s1)?d2:d}
/* dados (mentiroso): com chance |b|·K o adversário erra (sorte) ou acerta (azar) a resposta ao SEU lance: duvida do lance verdadeiro / aumenta em cima do blefe */
const LUCK_DICE_K=.6;
function luckDiceTruth(b){let c=0;for(const pl of DICE.players)if(pl.dice)for(const d of pl.dice)if(d.val===b.f)c++;return c>=b.q}
function luckDiceRaise(b){for(let f=b.f+1;f<=6;f++)if(diceValid(b.q,f,b))return{q:b.q,f};for(let f=1;f<=6;f++)if(diceValid(b.q+1,f,b))return{q:b.q+1,f};return null}
{const f0=diceAI;diceAI=function(p){const r=f0.apply(this,arguments),b=DICE.bid,bi=luckBias();if(!b||b.p!==0||!bi||Math.random()>=Math.abs(bi)*LUCK_DICE_K)return r;
 const truth=luckDiceTruth(b),wantCall=bi>0?truth:!truth;if(wantCall)return{call:true};if(r&&(r.call||r.spot)){const q=luckDiceRaise(b);if(q)return q}return r}}
/* ---------- trevos ---------- */
function luckWorldOk(){return !!(city&&city.ext&&!city.haze&&!(typeof BR!=='undefined'&&BR.on)&&(S.style==='modern'||S.style==='synthwave'||S.style==='inverted'))}
function cloverGeo(){if(LUCK.geo)return LUCK.geo;const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(-.05,.12,-.24,.2,-.2,.34);leaf.bezierCurveTo(-.17,.43,-.05,.44,0,.36);leaf.bezierCurveTo(.05,.44,.17,.43,.2,.34);leaf.bezierCurveTo(.24,.2,.05,.12,0,0);
 const lg=new THREE.ExtrudeGeometry(leaf,{depth:.03,bevelEnabled:false,curveSegments:5}).toNonIndexed(),parts=[];
 for(let k=0;k<4;k++){const g=lg.clone();g.translate(0,.02,-.015);g.rotateZ(k*Math.PI/2);parts.push(g)}
 const st=new THREE.BoxGeometry(.035,.36,.035).toNonIndexed();st.translate(.02,-.18,0);st.rotateZ(.18);parts.push(st);
 let n=0;for(const g of parts)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;
 for(const g of parts){g.computeVertexNormals();P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;g.dispose()}lg.dispose();
 const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(P,3));ge.setAttribute('normal',new THREE.BufferAttribute(N,3));LUCK.geo=ge;return ge}
function cloverMat(){const st=S.style;LUCK.mats=LUCK.mats||{};if(LUCK.mats[st])return LUCK.mats[st];
 const c=st==='synthwave'?[0xff5fd8,0x9a1a86]:st==='inverted'?[0x5a3a34,0x2a0606]:[0x2fbf4a,0x0d5a1c];
 const m=new THREE.MeshStandardMaterial({color:c[0],emissive:c[1],emissiveIntensity:st==='synthwave'?.9:.45,roughness:.45,metalness:.05,side:THREE.DoubleSide});LUCK.mats[st]=m;return m}
function cloverClear(){for(const c of LUCK.clov){scene.remove(c.g);scene.remove(c.ring);c.ring.material.dispose()}LUCK.clov.length=0}
function cloverPlace(){cloverClear();if(!luckWorldOk())return;const day=DN.day||0;LUCK.day=day;
 const rnd=mulberry32(((S.seed^0x7c10e4a5)+day*7919)>>>0),cands=[];
 for(let i=0;i<city.rects.length;i++){const f=city.info[i];if(f&&(f.kind==='park'||f.kind==='rural')&&!f.isle)cands.push(i)}
 if(!cands.length)return;let tries=0;const want=6;
 while(LUCK.clov.length<want&&tries++<400){const i=cands[Math.floor(rnd()*cands.length)],r=city.rects[i],m=3;if(r[2]-r[0]<2*m+1||r[3]-r[1]<2*m+1)continue;
  const x=r[0]+m+rnd()*(r[2]-r[0]-2*m),z=r[1]+m+rnd()*(r[3]-r[1]-2*m);
  if(inWater(x,z))continue;const q=query(x,z,1.4);if(q&&q.some(o=>!o.dead&&x>=o.x0-.7&&x<=o.x1+.7&&z>=o.z0-.7&&z<=o.z1+.7))continue;if(LUCK.clov.some(c=>Math.hypot(c.x-x,c.z-z)<45))continue;
  const id=day+':'+LUCK.clov.length;if(LUCK.got.has(id)){LUCK.clov.push({id,x,z,taken:true,g:new THREE.Group(),ring:new THREE.Mesh()});continue}
  const y=groundY(x,z),g=new THREE.Mesh(cloverGeo(),cloverMat());g.scale.setScalar(1.6);g.position.set(x,y+.95,z);
  const ring=new THREE.Mesh(LUCK.ringGeo||(LUCK.ringGeo=new THREE.PlaneGeometry(2.2,2.2)), /* v4 pré-carga: geometria do anel compartilhada (antes 1 nova por trevo por dia, nunca descartada) */new THREE.MeshBasicMaterial({map:glowTex,color:S.style==='synthwave'?0xff5fd8:S.style==='inverted'?0x7a3a3a:0x5aff7a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.75,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,y+.08,z);ring.renderOrder=2;scene.add(g,ring);LUCK.clov.push({id,x,z,y,g,ring,seen:false,taken:false})}}
function cloverTick(dt){if(!LUCK.clov.length)return;const pc=PL.car||PL;for(const c of LUCK.clov){if(c.taken)continue;
  c.g.rotation.y+=dt*1.8;c.g.position.y=c.y+.95+Math.sin(simT*2.6+c.x)*.12;const d=Math.hypot(pc.x-c.x,pc.z-c.z);
  if(!c.seen&&d<30)c.seen=true;if(!PL.dead&&!PL.car&&d<1.5){c.taken=true;LUCK.got.add(c.id);scene.remove(c.g);scene.remove(c.ring);luckAdd(8,'trevo');toast('<span style="color:#7dff9e">🍀 +8</span>');clang(.35)}}}
/* ---------- gato preto, HUD, decaimento ---------- */
function luckCatTick(){if(typeof ANIM==='undefined'||!ANIM.list)return;const c=PL.car;for(const a of ANIM.list){if(a.kind!=='cat'||a.ci!==1||!a.dead||a.shot||LUCK.catSeen.has(a))continue;LUCK.catSeen.add(a);
  if(c&&Math.hypot(c.x-a.x,c.z-a.z)<10){luckAdd(-15,'gato');toast('<span style="color:#ff8a8a">🐈‍⬛ −15 🍀</span>')}}}
function luckHudEl(){let el=document.getElementById('luck');if(el)return el;const w=document.getElementById('hpwrap');if(!w)return null;
 if(!document.getElementById('luckCss')){const st=document.createElement('style');st.id='luckCss';st.textContent='#luck{display:flex;align-items:center;gap:5px;margin-top:4px;opacity:0;transition:opacity .4s;justify-content:flex-end}#luck.on,body:has(#mini:hover) #luck{opacity:1}#luck i{font-style:normal;font-size:11px;line-height:1;filter:drop-shadow(1px 1px 0 #000)}#luck b{position:relative;display:block;width:96px;height:5px;background:rgba(0,0,0,.55);border:1px solid rgba(0,0,0,.8)}#luck u{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2f9a45,#7dff9e)}#luck s{position:absolute;left:50%;top:-1px;bottom:-1px;width:1px;background:rgba(255,255,255,.35)}body.hide-gamehud #luck{display:none!important}body.touch #luck b{width:80px}';document.head.appendChild(st)}
 el=document.createElement('div');el.id='luck';el.innerHTML='<i>🍀</i><b><u></u><s></s></b>';w.appendChild(el);return el}
function luckHud(dt){const el=luckHudEl();if(!el)return;if(LUCK.flash>0)LUCK.flash-=dt;const on=LUCK.flash>0||(typeof ROOM_STAGE!=='undefined'&&ROOM_STAGE.mode==='casino'); /* v4 r41: só aparece ao mudar, no cassino ou com o mouse no minimapa */if(el._on!==on){el._on=on;el.classList.toggle('on',on)}
 const v=Math.round(LUCK.v);if(el._v!==v){el._v=v;el.querySelector('u').style.width=v+'%'}}
function luckTick(dt){if(!played||!dt)return;try{LUCK.v+=Math.sign(50-LUCK.v)*Math.min(Math.abs(50-LUCK.v),dt*.4/60);
  if((LUCK.headT-=dt)<=0){LUCK.headT=60;LUCK.headN=0}
  if(luckWorldOk()){if(LUCK.day!==(DN.day||0)||!LUCK.built){LUCK.built=true;cloverPlace()}cloverTick(dt)}else if(LUCK.clov.length)cloverClear();
  luckCatTick();luckHud(dt)}catch(e){console.error('[sorte]',e)}}
/* ---------- ganchos ---------- */
{const f0=update;update=function(dt){const r=f0.apply(this,arguments);luckTick(dt);return r}}
{const f0=toast;toast=function(h){if(h==='TIRO NA CABEÇA'&&LUCK.headN<6){LUCK.headN++;luckAdd(.5,'head')}return f0.apply(this,arguments)}}
{const f0=updatePickups;updatePickups=function(){LUCK.inPick=true;try{return f0.apply(this,arguments)}finally{LUCK.inPick=false}}}
{const f0=removePickup;removePickup=function(p){if(LUCK.inPick&&p&&!PL.dead&&p.kind!=='vinyl'&&!p.netDrop){const pc=PL.car||PL;if(Math.hypot(pc.x-p.x,pc.z-p.z)<3.2)luckAdd(p.roadCash?.2:p.npcDrop?.3:1,'coletavel')}return f0.apply(this,arguments)}}
{const f0=vinylGet;vinylGet=function(){luckAdd(3,'disco');return f0.apply(this,arguments)}}
{const f0=registerKill;registerKill=function(p){const c=PL.car;if(p&&!p.cop&&!p.gang&&!p.net&&!p.demo&&c&&Math.hypot(c.vx||0,c.vz||0)>3&&Math.hypot(c.x-p.x,c.z-p.z)<6)luckAdd(-1,'atropelou');return f0.apply(this,arguments)}}
{const f0=killPlayer;killPlayer=function(){const was=PL.dead,r=f0.apply(this,arguments);if(!was&&PL.dead)luckAdd(-5,'morte');return r}}
{const f0=busted;busted=function(){luckAdd(-5,'preso');return f0.apply(this,arguments)}}
/* painel do mapa: conta + sorte numa caixinha embaixo da hora/dinheiro */
{const f0=drawMapClockUI;drawMapClockUI=function(g,W,H,v){f0.apply(this,arguments);try{const q=mapInfoLayout(W,H,v),en=S.lang==='en',y=q.y+q.h+6,h=50;g.save();
  g.fillStyle='rgba(9,8,16,.91)';g.strokeStyle='#f4e4b0';g.lineWidth=2;roundRectPath(g,q.x,y,q.w,h,10);g.fill();g.stroke();g.textAlign='center';g.textBaseline='top';
  g.fillStyle='#9fe8c0';g.font='12px Segoe UI,Arial,sans-serif';g.fillText((en?'BANK':'CONTA')+' $ '+Math.round(BANKACC.bal||0).toLocaleString(en?'en-US':'pt-BR'),q.cx,y+8,q.w-18);
  const bx=q.x+34,bw=q.w-52,by=y+30;g.font='14px Segoe UI Emoji,Apple Color Emoji,sans-serif';g.textAlign='left';g.fillText('🍀',q.x+12,by-5);
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(bx,by,bw,8);g.fillStyle='#4fd26a';g.fillRect(bx,by,bw*Math.max(0,Math.min(1,LUCK.v/100)),8);g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1;g.strokeRect(bx+.5,by+.5,bw-1,7);
  g.fillStyle='rgba(255,255,255,.35)';g.fillRect(bx+bw/2,by-1,1,10);g.restore()}catch(e){}}}
Object.assign(MAP_ICON_DEFS,{clover:{c:'#4fd26a',p:'M12 9.6A2.7 2.7 0 1 1 12 4.2A2.7 2.7 0 1 1 12 9.6ZM14.4 12A2.7 2.7 0 1 1 19.8 12A2.7 2.7 0 1 1 14.4 12ZM12 14.4A2.7 2.7 0 1 1 12 19.8A2.7 2.7 0 1 1 12 14.4ZM9.6 12A2.7 2.7 0 1 1 4.2 12A2.7 2.7 0 1 1 9.6 12Z',d:'M12 12L15.5 21'}});
{const f0=mapPoiEntries;mapPoiEntries=function(){const A=f0.apply(this,arguments);if(!mapPoiEntries.base)for(const c of LUCK.clov)if(c.seen&&!c.taken)A.push({k:'clover',x:c.x,z:c.z});return A}}
{const f0=storyMap;storyMap=function(k){return k==='clover'?true:f0.apply(this,arguments)}}
{const f0=mapLegendItems;mapLegendItems=function(){const A=f0.apply(this,arguments);if(LUCK.clov.some(c=>c.seen&&!c.taken))A.push(['clover','TREVO DE 4 FOLHAS',true]);return A}}
{const f0=statsHtml;statsHtml=function(){const en=S.lang==='en';return f0.apply(this,arguments)+'<div class="records-stat" style="margin-top:6px">'+(en?'Luck':'Sorte')+': <strong>'+Math.round(LUCK.v)+' / 100 🍀</strong></div>'}}
/* jogo novo, cidade nova, save */
{const f0=startGame;startGame=function(save){if(!save){LUCK.v=50;LUCK.got.clear()}LUCK.built=false;return f0.apply(this,arguments)}}
{const f0=generateCity;generateCity=async function(){cloverClear();LUCK.built=false;return await f0.apply(this,arguments)}}
{const f0=buildSave;buildSave=function(){const d=f0.apply(this,arguments);try{if(d){d.luck=Math.round(LUCK.v*10)/10;d.clov={s:S.seed,day:DN.day||0,g:[...LUCK.got].filter(k=>+k.split(':')[0]===(DN.day||0))}}}catch(e){}return d}}
{const f0=applySave;applySave=function(d){const r=f0.apply(this,arguments);try{if(d){LUCK.v=Number.isFinite(+d.luck)?Math.max(0,Math.min(100,+d.luck)):50;LUCK.got.clear();
  if(d.clov&&d.clov.s===S.seed&&Array.isArray(d.clov.g))for(const k of d.clov.g)LUCK.got.add(String(k));LUCK.built=false}}catch(e){console.error(e)}return r}}
