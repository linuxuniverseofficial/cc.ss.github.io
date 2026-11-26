'use strict';
/* Coastal Chaos · js/51-caixas-rua.js — Caixas eletrônicos de rua (v4).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html.
   - Posições: depois do generateCity (embrulho), gerador próprio da seed (nunca o R()), ~55% dos quarteirões de prédios ('bld'),
     encostados no fundo da calçada (3,25 m da guia, de frente para a rua), longe de portas, becos, colisores, banco, posto e de outro caixa.
   - Malha: 2 InstancedMesh em city.group (corpo Lambert com cor por vértice + tela/letreiro MeshBasic com textura de canvas);
     queimado = cor da instância escura. Colisor 'rock' por caixa.
   - Uso: mesma janela da conta corrente do banco (#bankDlg) pelo bankAtmNear (embrulho), então balão, E/F/→, △ e toque já funcionam.
   - Explosão (embrulho do blastAt): caixa a <5 m queima por 24 h de jogo (relógio próprio ATMQ.mins, que soma o avanço de DN.tod),
     solta $500–1.500 e dá 2 estrelas se foi o jogador. Mapa/minimapa: cédula verde ('atm') ou vermelha ('atmx').
   - NPC: de vez em quando um pedestre do quarteirão vai até o caixa, usa por alguns segundos e volta (estado 'atmUse');
     morto DEPOIS de usar (p.atmDone) sempre larga o dobro do dinheiro base dos NPCs (dropRoadCash).
   - Sem caixas na Point Haze (city.haze) e nas Backrooms (palco próprio). No Invertido a arquitetura é a mesma: caixas apagados, sem uso e sem ícone.
   - Online: posição igual para todos (mesma seed); explosão, dinheiro e NPCs são locais. */
const ATMQ={list:[],body:null,scr:null,tex:null,dead:new Map(),mins:0,lastTod:null,pedT:1,chkT:0,users:[],done:[],near:{x:0,z:0,gy:0},col:new THREE.Color()};
const ATM_W=.42,ATM_D=.3,ATM_DEPTH=3.25;
function atmKey(i){return S.seed+':'+S.style+':'+i}
function atmTexFor(synth,inv){const c=cv(256,128),g=c.getContext('2d');
 if(inv){g.fillStyle='#0c0e0f';g.fillRect(0,0,256,64);g.fillStyle='#16191b';g.fillRect(150,12,80,6);g.fillStyle='#2a302c';g.fillRect(0,64,256,64);g.fillStyle='#454b47';g.font='bold 40px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('24H  $',128,97);const t0=new THREE.CanvasTexture(c);return t0} /* Invertido: tela e letreiro apagados */
 /* metade de cima = tela; metade de baixo = letreiro do topo */
 const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,synth?'#1a0a3a':'#0b2a4a');gr.addColorStop(1,synth?'#3a0f5e':'#0f4a6e');g.fillStyle=gr;g.fillRect(0,0,256,64);
 g.fillStyle=synth?'#59f6ff':'#bfe8ff';for(let i=0;i<3;i++)g.fillRect(150,12+i*15,80,6);
 g.fillStyle=synth?'#ff4fd8':'#56d27a';g.fillRect(26,14,92,40);g.strokeStyle=synth?'#ffd0f6':'#d8ffe2';g.lineWidth=3;g.strokeRect(32,20,80,28);
 g.beginPath();g.arc(72,34,9,0,6.283);g.stroke();
 g.fillStyle=synth?'#ff3ad0':'#1f9a55';g.fillRect(0,64,256,64);g.fillStyle=synth?'#2a1838':'#0d3a22';g.fillRect(0,64,256,6);g.fillRect(0,122,256,6);
 g.fillStyle='#fff';g.font='bold 40px Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('24H  $',128,97);
 const t=new THREE.CanvasTexture(c);t.anisotropy=2;return t}
function atmGeo(st){const synth=!!st.synth,inv=S.style==='inverted';
 const cb=COL(synth?'#2c1a3c':inv?'#4a4d52':'#5a626c'),cd=COL(synth?'#150c1e':'#2a2d33'),ca=COL(synth?'#ff3ad0':inv?'#3f4a44':'#1f9a55'),ct=COL(synth?'#59f6ff':inv?'#55595e':'#8d969f');
 const mb=new MB();
 mb.box(-.36,-.02,-.28,.36,1.05,.22,cb);              /* pedestal */
 mb.box(-.4,1.05,-.3,.4,1.72,.2,cb);                  /* cabeça */
 mb.box(-.3,.96,.2,.3,1.03,.4,cd);                    /* prateleira do teclado */
 mb.box(-.22,1.031,.24,.22,1.05,.36,ct,{noTop:false});/* teclado */
 mb.box(-.43,1.72,-.33,.43,1.9,.23,ca);               /* topo (marca) */
 mb.box(-.43,1.16,.2,-.39,1.72,.34,cd);mb.box(.39,1.16,.2,.43,1.72,.34,cd); /* abas laterais da tela */
 mb.box(-.4,.08,.22,.4,.14,.25,ca);                   /* friso de baixo */
 const body=mb.mesh(null).geometry;
 const sb=new MB();const W=COL('#ffffff');
 sb.quad([-.27,1.2,.212],[.27,1.2,.212],[.27,1.62,.212],[-.27,1.62,.212],0,0,1,[0,.5,1,1],W);  /* tela: metade de cima da textura */
 sb.quad([-.42,1.74,.242],[.42,1.74,.242],[.42,1.88,.242],[-.42,1.88,.242],0,0,1,[0,0,1,.5],W); /* letreiro: metade de baixo */
 const scr=sb.mesh(null).geometry;return{body,scr}}
function atmClear(){ATMQ.list.length=0;ATMQ.body=null;ATMQ.scr=null;if(ATMQ.tex){ATMQ.tex.dispose();ATMQ.tex=null}for(const p of ATMQ.users)if(p.atmU){p.atmU=null}ATMQ.users.length=0;ATMQ.done.length=0}
function atmPlace(){atmClear();if(!city.rects||!city.info||city.haze||!city.group)return;
 const rng=mulberry32((S.seed^0x7a7c41e5)>>>0),lmRi=new Set((city.lms||[]).map(l=>l.ri));
 let bd=null;try{bd=bankDoor()}catch(e){}
 const gas=[];try{for(const g of GAS.list.values())gas.push(g)}catch(e){}
 const al=city.bxAl||[],out=ATMQ.list,RJ=ATMQ.rj={};const rj=k=>{RJ[k]=(RJ[k]||0)+1};
 for(let ri=0;ri<city.rects.length;ri++){const f=city.info[ri],r=city.rects[ri];
  const roll=rng(),s0=rng()*4|0,u0=rng(); /* sempre 3 sorteios por quarteirão: rejeitar um não muda os outros */
  if(!f||!r||f.kind!=='bld'||f.para||f.isle||f.reservedSpecial||f.garage||lmRi.has(ri)||roll>.55){rj(!f||f.kind!=='bld'?'kind':roll>.55?'roll':'esp');continue}
  let got=null;
  for(let si=0;si<4&&!got;si++){const sd=(s0+si)%4,nx=sd===2?-1:sd===3?1:0,nz=sd===0?-1:sd===1?1:0,alongX=nz!==0,L=alongX?r[2]-r[0]:r[3]-r[1];if(L<16)continue;
   for(let ui=0;ui<3&&!got;ui++){const u=7+((u0+ui*.37)%1)*(L-14);
    const ex=alongX?r[0]+u:(nx<0?r[0]:r[2]),ez=alongX?(nz<0?r[1]:r[3]):r[1]+u;   /* ponto na guia */
    const x=ex-nx*ATM_DEPTH,z=ez-nz*ATM_DEPTH;
    /* eixo da rua (8 m além da borda do quarteirão; nas ruas estreitas a calçada larga passa da borda), seco */
    const rx=ex+nx*RW/2,rz=ez+nz*RW/2;if(inWater(rx,rz)||Math.abs(groundY(rx,rz))>.05){rj('rua');continue}
    /* calçada plana embaixo do caixa */
    const hw=alongX?ATM_W:ATM_D,hd=alongX?ATM_D:ATM_W,gy=groundY(x,z);if(gy<.08||gy>.6){rj('gy');continue}
    let flat=true;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])if(Math.abs(groundY(x+a*(hw+.3),z+b*(hd+.3))-gy)>.03){flat=false;break}if(!flat){rj('flat');continue}
    /* colisores (prédio, lixeira, banca, poste...) com 0,45 m de folga; a parede do prédio fica a ~0,45 m das costas */
    let hit=false;for(const c of query(x,z,3)){if(c.dead)continue;if(c.x1>x-hw-.45&&c.x0<x+hw+.45&&c.z1>z-hd-.45&&c.z0<z+hd+.45){hit=true;break}}if(!hit&&typeof busGhostHit==='function'&&busGhostHit(x-hw,z-hd,x+hw,z+hd,.45))hit=true;if(hit){rj('col');continue}
    /* portas (do prédio e da calçada), becos, banco, posto e outro caixa */
    let bad=false;for(const d of (city.doors&&city.doors.get(ri))||[])if(Math.hypot(d.x-x,d.z-z)<3||Math.hypot(d.ox-x,d.oz-z)<3){bad=true;break}if(bad){rj('porta');continue}
    for(const a of al)if(x>a[0]-2.5&&x<a[2]+2.5&&z>a[1]-2.5&&z<a[3]+2.5){bad=true;break}if(bad){rj('beco');continue}
    if(bd&&Math.hypot(bd.x-x,bd.z-z)<70){rj('banco');continue}
    for(const g of gas)if(Math.hypot(g.x-x,g.z-z)<35){bad=true;break}if(bad){rj('posto');continue}
    for(const o of out)if(Math.hypot(o.x-x,o.z-z)<45){bad=true;break}if(bad){rj('outro');continue}
    got={i:out.length,ri,x,z,nx,nz,gy,ang:Math.atan2(nx,nz),hw,hd,dead:false,left:0,busy:null,smoke:0,
     sx:x+nx*(ATM_D+.5),sz:z+nz*(ATM_D+.5),ax:ex-nx*2,az:ez-nz*2}}}
  if(got)out.push(got)}
 if(!out.length)return;
 const st=city.st||STYLES[S.style],geo=atmGeo(st),n=out.length;ATMQ.tex=atmTexFor(!!st.synth,S.style==='inverted');
 const bm=new THREE.MeshLambertMaterial({vertexColors:true}),sm=new THREE.MeshBasicMaterial({map:ATMQ.tex});
 const B=new THREE.InstancedMesh(geo.body,bm,n),SC=new THREE.InstancedMesh(geo.scr,sm,n);
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),p=new THREE.Vector3(),one=new THREE.Vector3(1,1,1);
 const k0=curChunk;try{for(const a of out){q.setFromAxisAngle(up,a.ang);p.set(a.x,a.gy,a.z);m.compose(p,q,one);B.setMatrixAt(a.i,m);SC.setMatrixAt(a.i,m);
  const ck=chunkOf(a.x,a.z);curChunk=city.chunks.get(ck[0]+','+ck[1])||null;const c=addCol(a.x-a.hw,a.z-a.hd,a.x+a.hw,a.z+a.hd,'rock');c.top=1.9;a.colR=c}}finally{curChunk=k0}
 for(const M of [B,SC]){M.frustumCulled=false;M.matrixAutoUpdate=false;M.updateMatrix();M.instanceMatrix.needsUpdate=true}
 B.castShadow=true;B.receiveShadow=true;SC.castShadow=false;SC.receiveShadow=false;B.name='atmBody';SC.name='atmScreen';
 ATMQ.body=B;ATMQ.scr=SC;city.group.add(B);city.group.add(SC);
 for(const a of out){const v=ATMQ.dead.get(atmKey(a.i));if(v>0){a.dead=true;a.left=v}atmPaint(a)}
 try{invalidateStaticShadows()}catch(e){}}
function atmPaint(a){const c=ATMQ.col;
 if(ATMQ.body){c.setHex(a.dead?0x2a2624:0xffffff);ATMQ.body.setColorAt(a.i,c);ATMQ.body.instanceColor.needsUpdate=true}
 if(ATMQ.scr){c.setHex(a.dead?0x080808:0xffffff);ATMQ.scr.setColorAt(a.i,c);ATMQ.scr.instanceColor.needsUpdate=true}}
/* --- uso pelo jogador: entra no mesmo caminho do caixa do saguão (balão, E/F/→, △, toque) --- */
function atmStreetNear(){if(PL.inside||PL.car||PL.heli||PL.dead||S.style==='inverted'||!ATMQ.list.length)return null;
 for(const a of ATMQ.list){if(a.dead)continue;const dx=PL.x-a.sx,dz=PL.z-a.sz;if(dx*dx+dz*dz<1.1*1.1){const n=ATMQ.near;n.x=a.x;n.z=a.z;n.gy=a.gy;n.atm=a;return n}}return null}
{const f0=bankAtmNear;bankAtmNear=function(){return f0.apply(this,arguments)||atmStreetNear()}}
/* --- explosão --- */
{const f0=blastAt;blastAt=function(cx,cz,c,byP){f0.apply(this,arguments);try{atmBlast(cx,cz,!!byP)}catch(e){console.error(e)}}}
function atmBlast(x,z,byP){for(const a of ATMQ.list)if(!a.dead&&Math.hypot(a.x-x,a.z-z)<5)atmKill(a,byP)}
function atmKill(a,byP){if(a.dead)return;a.dead=true;a.left=1440;a.smoke=25;ATMQ.dead.set(atmKey(a.i),a.left);atmPaint(a);
 if(BANKACC.open&&ATMQ.near.atm===a)bankDlgClose();
 const am=500+Math.floor(Math.random()*1001),k=chunkOf(a.x,a.z),ch=city.chunks.get(k[0]+','+k[1])||{pickups:[]};
 const parts=[Math.floor(am*.4),Math.floor(am*.35)];parts.push(am-parts[0]-parts[1]);
 parts.forEach((v,j)=>{const t=(j-1)*.9,d=1.4+j*.25;const px=a.x+a.nx*d+(a.nz!==0?t:0),pz=a.z+a.nz*d+(a.nx!==0?t:0);
  const pk=makePickup('atm-'+(++roadLootId),px,pz,v,ch,'cash');pk.roadCash=true;pk.ttl=180});
 for(let i=0;i<18;i++){const r=Math.random()*6.28,s=2+Math.random()*4;emit(a.x+a.nx*.4,a.gy+1.3,a.z+a.nz*.4,Math.cos(r)*s*.5+a.nx*s,2+Math.random()*4,Math.sin(r)*s*.5+a.nz*s,1.2,.35,.12,0x6ad27a,false,.9)}
 if(byP&&!ONLINE.on){if(!POL.wanted)startWanted(true);if(POL.wanted)wantedUp(2)}}
/* --- tempo: 24 h de jogo pelo avanço do relógio (DN.day vira ao meio-dia, então não serve de contador) --- */
function atmClock(){const t=DN.tod;if(ATMQ.lastTod===null){ATMQ.lastTod=t;return 0}let d=t-ATMQ.lastTod;if(d<0)d+=1440;ATMQ.lastTod=t;ATMQ.mins+=d;return d}
function atmTick(dt){const dm=atmClock();if(!ATMQ.list.length)return;
 if(dm>0)for(const a of ATMQ.list)if(a.dead){a.left-=dm;if(a.left<=0){a.dead=false;a.left=0;ATMQ.dead.delete(atmKey(a.i));atmPaint(a)}else ATMQ.dead.set(atmKey(a.i),a.left)}
 for(const a of ATMQ.list)if(a.smoke>0){a.smoke-=dt;const dx=a.x-PL.x,dz=a.z-PL.z;if(dx*dx+dz*dz<90*90&&Math.random()<dt*6)emit(a.x+(Math.random()-.5)*.5,a.gy+1.9,a.z+(Math.random()-.5)*.5,(Math.random()-.5)*.4,1.2+Math.random(),(Math.random()-.5)*.4,2.4,1.1,4,0x252224,false,.5)}
 atmPedTick(dt)}
/* --- NPC no caixa --- */
function atmPedOk(p){return p.state==='walk'&&!p.atmU&&!p.fixed&&!p.cop&&!p.gang&&!p.main&&!p.demo&&!p.net&&!p.strip&&!p.rainMode&&!p.umb&&!p.medPatient&&p.tommy===undefined&&!p.clubType&&!p.balcony&&p.r}
function atmRelease(p,toWalk){const u=p.atmU;if(!u)return;if(u.a.busy===p)u.a.busy=null;p.atmU=null;const i=ATMQ.users.indexOf(p);if(i>=0)ATMQ.users.splice(i,1);
 if(toWalk&&p.state==='atmUse'&&peds.includes(p)){p.state='walk';p.timer=0;p.vx=p.vz=0;try{p.r=perim(p.ri);p.t=perimNearest(p.r,p.x,p.z)}catch(e){}}}
function atmPedTick(dt){const U=ATMQ.users;
 ATMQ.pedT-=dt;if(ATMQ.pedT<=0&&S.style!=='inverted'&&U.length<3){ATMQ.pedT=.5;const fp=PL.car||PL;
  for(const a of ATMQ.list){if(a.dead||a.busy||Math.random()>.035)continue;const dx=a.x-fp.x,dz=a.z-fp.z;if(dx*dx+dz*dz>110*110)continue;
   if(Math.hypot(PL.x-a.sx,PL.z-a.sz)<2.2)continue;
   let best=null,bd=12;for(const p of peds){if(p.ri!==a.ri||!atmPedOk(p))continue;const d=Math.hypot(p.x-a.ax,p.z-a.az);if(d<bd){bd=d;best=p}}
   if(best){best.atmU={a,ph:'go',t:0};a.busy=best;best.state='atmUse';best.timer=999;best.vx=best.vz=0;U.push(best);break}}}
 /* mortos depois de usar o caixa: explosão e outros caminhos que não passam pelo dropRoadCash */
 const D=ATMQ.done;for(let i=D.length-1;i>=0;i--){const p=D[i];if(!peds.includes(p)){D.splice(i,1);continue}if(p.state==='dead'&&!p.roadLoot){try{dropRoadCash(p)}catch(e){console.error(e)}D.splice(i,1)}}}
/* movimento antes do updatePeds (o boneco 3D mede o passo pelo deslocamento); o quadro 2D vem depois */
function atmPedPre(dt){const U=ATMQ.users;for(let i=U.length-1;i>=0;i--){const p=U[i],u=p.atmU;
  if(!u||!peds.includes(p)||p.state!=='atmUse'){atmRelease(p,false);continue}
  const a=u.a;if(a.dead&&u.ph!=='back'){u.ph='back'}
  if(u.ph==='use'){p.mx=-a.nx;p.mz=-a.nz;u.t-=dt;if(u.t<=0){p.atmDone=true;if(!ATMQ.done.includes(p)){ATMQ.done.push(p);if(ATMQ.done.length>24)ATMQ.done.shift()}u.ph='back'}continue}
  const tx=u.ph==='go'?a.sx:a.ax,tz=u.ph==='go'?a.sz:a.az,dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
  if(d<.12){if(u.ph==='go'){u.ph='use';u.t=4+Math.random()*4}else atmRelease(p,true);continue}
  const v=Math.min(d,(p.spd||1.3)*dt);p.mx=dx/d;p.mz=dz/d;p.x+=p.mx*v;p.z+=p.mz*v}}
function atmPedFrames(){for(const p of ATMQ.users){const u=p.atmU;if(!u||p.state!=='atmUse'||!p.tex)continue;const mv=u.ph!=='use',k=Math.floor(p.anim*6)%4,fr=mv?(k===1?1:k===3?2:0):0;try{setFrame(p.tex,pickDir(p.mx,p.mz,p.x,p.z),fr)}catch(e){}}}
{const f0=updatePeds;updatePeds=function(dt){try{if(ATMQ.users.length)atmPedPre(dt||0)}catch(e){console.error(e)}f0.apply(this,arguments);try{if(ATMQ.users.length)atmPedFrames();if(dt>0)atmTick(dt)}catch(e){console.error(e)}}}
{const f0=dropRoadCash;dropRoadCash=function(p){if(p&&p.atmDone&&!p.roadLoot){p.roadLoot=true;const base=p.prof&&p.prof.loot?p.prof.loot:1+Math.floor(Math.random()*20),k=chunkOf(p.x,p.z),ch=city.chunks.get(k[0]+','+k[1]);if(!ch)return;
  const d=makePickup('road-'+(++roadLootId),p.x,p.z,base*2,ch,'cash');d.roadCash=true;d.ttl=60;(p.dropPk||(p.dropPk=[])).push(d);if(p.state==='dead')p.timer=Math.max(p.timer||0,25);return}
 return f0.apply(this,arguments)}}
/* --- mapa e minimapa: cédula verde / vermelha --- */
Object.assign(MAP_ICON_DEFS,{atm:{c:'#4fd27a',p:'M3 7.5H21V16.5H3Z',d:'M14.4 12A2.4 2.4 0 1 1 9.6 12A2.4 2.4 0 1 1 14.4 12ZM5.6 10V14M18.4 10V14'},atmx:{c:'#ff4a4a',p:'M3 7.5H21V16.5H3Z',d:'M14.4 12A2.4 2.4 0 1 1 9.6 12A2.4 2.4 0 1 1 14.4 12ZM5.6 10V14M18.4 10V14'}});
{const f0=mapPoiEntries;mapPoiEntries=function(){const A=f0.apply(this,arguments);if(!mapPoiEntries.base&&S.style!=='inverted'&&!city.haze)for(const a of ATMQ.list)A.push({k:a.dead?'atmx':'atm',x:a.x,z:a.z});return A}}
{const f0=storyMap;storyMap=function(k){return f0.call(this,k==='atmx'?'atm':k)}}
{const f0=mapLegendItems;mapLegendItems=function(){const A=f0.apply(this,arguments);if(city.haze||S.style==='inverted'||!ATMQ.list.length)return A;
 if(storyMap('atm')){A.push(['atm','CAIXA ELETRÔNICO',true]);if(ATMQ.list.some(a=>a.dead))A.push(['atmx','CAIXA ELETRÔNICO QUEIMADO',true])}return A}}
/* --- cidade nova, jogo novo, save --- */
{const f0=generateCity;generateCity=async function(){const r=await f0.apply(this,arguments);try{atmPlace()}catch(e){console.error('[caixas]',e)}return r}}
{const f0=startGame;startGame=function(save){if(!save){ATMQ.dead.clear();ATMQ.mins=0}ATMQ.lastTod=null;return f0.apply(this,arguments)}}
{const f0=buildSave;buildSave=function(){const d=f0.apply(this,arguments);try{if(d&&ATMQ.list.length){const l=[];for(const a of ATMQ.list)if(a.dead)l.push([a.i,Math.round(a.left)]);d.atmx={s:S.seed,y:S.style,l}}}catch(e){}return d}}
{const f0=applySave;applySave=function(d){const r=f0.apply(this,arguments);try{if(d&&d.atmx&&d.atmx.s===S.seed&&Array.isArray(d.atmx.l)){for(const a of ATMQ.list){a.dead=false;a.left=0;ATMQ.dead.delete(atmKey(a.i))}
  for(const e of d.atmx.l){const a=ATMQ.list[e&&e[0]];if(a&&e[1]>0&&d.atmx.y===S.style){a.dead=true;a.left=Math.min(1440,+e[1]);ATMQ.dead.set(atmKey(a.i),a.left)}}for(const a of ATMQ.list)atmPaint(a)}ATMQ.lastTod=null}catch(e){console.error(e)}return r}}
