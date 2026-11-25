'use strict';
/* Coastal Chaos · js/32-imperio-banco-cassino.js — Império, banco, cassino.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
// ================= IMPÉRIO (estilo Vice City Stories) =================
// Prédios só decorativos (arranha-céu, supermercado, universidade, estádio, indústria, aeroporto) viram negócios de gangue.
// Tomada: 1) destrua o carro da gangue rival parado na frente  2) derrube os membros que saem armados
// 3) entre (seta) e limpe o interior: capangas de punho/taco + os bens do negócio (atire ou E para quebrar)
// 4) o prédio fica À VENDA: compre na porta. Comprado: escolha o ramo, pague o aporte e recolha os lucros na porta.
// Ramos: DROGAS (aporte $1.500 · $400/dia · risco alto, atacantes com metralhadora), CONTRABANDO ($1.000 · $250/dia · risco médio,
// pistolas) e ROUBO ($500 · $150/dia · risco baixo, tacos). O cofre acumula até 3 dias. Atacado: ícone pisca, o lucro para
// até você defender (3 atacantes na porta). Mapa: laranja = tomar · verde = seu · vermelho = indisponível (história).
const EMP_IDS=['sky','mkt','univ','stad','ind','air'];
const EMP_INFO={sky:{nm:'ARRANHA-CÉU',biz:'GRÁFICA DE DINHEIRO FALSO',good:'IMPRESSORA',gc:'#d8d8e0',price:6000},mkt:{nm:'SUPERMERCADO',biz:'AGIOTAGEM',good:'COFRE DE NOTAS',gc:'#6a6e78',price:2500},
 univ:{nm:'UNIVERSIDADE',biz:'FÁBRICA DE DIPLOMAS',good:'PRENSA',gc:'#8a5a3a',price:3000},stad:{nm:'ESTÁDIO',biz:'APOSTAS CLANDESTINAS',good:'MÁQUINA DE APOSTAS',gc:'#2a8ad6',price:4000},
 ind:{nm:'INDÚSTRIA',biz:'DESMANCHE',good:'BANCADA DE PEÇAS',gc:'#c8762a',price:3500},air:{nm:'AEROPORTO',biz:'CONTRABANDO AÉREO',good:'CAIXA DE CARGA',gc:'#3a6a3a',price:5000}};
const EMP_TYPES={drugs:{nm:'DROGAS',ap:1500,inc:400,risk:.3,atk:'smg'},smuggle:{nm:'CONTRABANDO',ap:1000,inc:250,risk:.15,atk:'pistol'},theft:{nm:'ROUBO',ap:500,inc:150,risk:.06,atk:'bat'}};
const GANG_PAL={...CLERK_PAL,cap:'#5a1020',capDark:'#3a0810',shirt:'#1b1b1b',stripe:'#c8203a',pants:'#2a2a30',glasses:'#121218'};
const EMP={key:'',sites:[],saved:null,cur:null,grp:null,IN:null,lock:0,arrIn:null,inner:null,day:-1};
function empFront(r){return{x:(r[0]+r[2])/2,z:r[3]-SW+1.3}}
function empIcon(e){if(e.phase==='owned')return e.attack?'empa':'empg';if(!storyOK('empire'))return 'empr';return 'emp'}
function empInit(){for(const e of EMP.sites)empDespawn(e,true);EMP.sites=[];EMP.key=S.seed+':'+S.style;EMP.day=Math.floor(gameMin()/1440);if(city.haze||S.style==='inverted')return;
 const add=(id,d,ri)=>{if(!d)return;const sv=EMP.saved&&EMP.saved[id];EMP.sites.push({id,x:d.x,z:d.z,ri,phase:sv?sv.phase:'rival',type:sv?sv.type:null,cofre:sv?sv.cofre||0:0,attack:sv?!!sv.attack:false,car:null,gang:[]})};
 for(const l of city.lms||[])if(['sky','mkt','univ','stad'].includes(l.name))add(l.name,empFront(city.rects[l.ri]),l.ri);
 if(city.ind){const ri=rectNear(city.ind.x,city.ind.z);if(ri>=0)add('ind',empFront(city.rects[ri]),ri)}
 if(city.air){const A=city.air,p=airPt(A.L/2+2.5,A.ap+3);add('air',{x:p[0],z:p[1]},A.ri)}}
function empCarSpot(e){
 // Reaproveita as vagas pintadas nos estacionamentos do proprio empreendimento.
 // Filtra pelo quarteirao: nao camufla o carro em estacionamento vizinho.
 const slots=(city.empParkingSlots||[]).filter(q=>q.ri===e.ri).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z));
 const blocked=p=>vehicles.find(v=>v!==PL.car&&v.alive&&Math.hypot(v.x-p.x,v.z-p.z)<3.1);
 for(const s of slots){if(!blocked(s))return{x:s.x,z:s.z,a:s.a,parking:true}}
 // Se todas as vagas estao ocupadas, substitui SOMENTE um figurante estacionado.
 for(const s of slots){const v=blocked(s);if(v&&v.spotId&&!v.owned&&!v.empire){removeVehicle(v);return{x:s.x,z:s.z,a:s.a,parking:true}}}
 if(e.id==='air'&&city.air){const A=city.air,p=airPt(-A.L/2+34,A.hd-4);return{x:p[0],z:p[1],a:A.ax?0:Math.PI/2}}
 const ri=Number.isInteger(e.ri)?e.ri:rectNear(e.x,e.z-3),r=city.rects[ri];if(r)return{x:r[2]-SW-4,z:r[3]-SW-3,a:0};return{x:e.x+6,z:e.z-7,a:0}
}
function empSave(){const o={};for(const e of EMP.sites)o[e.id]={phase:e.phase==='defend'||e.phase==='inside'?'rival':e.phase,type:e.type,cofre:Math.round(e.cofre),attack:e.attack};return o}
function empDespawn(e,all){for(const q of e.gang||[])if(peds.includes(q))removePed(q);e.gang=[];if(all&&e.car&&vehicles.includes(e.car)&&e.car!==PL.car)removeVehicle(e.car);if(all)e.car=null}
function empGang(e,n,weapon,x,z,spread){for(let k=0;k<n;k++){const a=Math.random()*6.283,r=spread*(.5+Math.random()*.5),px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;const q=spawnPed(null,{x:px,z:pz,vx:0,vz:0,pal:{...GANG_PAL}});if(!q)continue;q.state='clerk';q.fixed=true;q.at={x:px,z:pz};q.gang=true;q.hp=weapon==='bat'||weapon==='fist'?4:3;q.wpn=weapon;q.shootT=1+Math.random();q.hitT=0;q.mx=0;q.mz=1;e.gang.push(q)}}
// Defesa inicial do negocio: quatro homens saem pela entrada e abrem fogo com metralhadoras.
function empGangFromDoor(e){if(e.gang.length)return;for(let k=0;k<4;k++){
 const x=e.x+(k-1.5)*.42,z=e.z-.65,q=spawnPed(null,{x,z,vx:0,vz:0,pal:{...GANG_PAL}});if(!q)continue;
 q.state='clerk';q.fixed=true;q.at={x,z};q.gang=true;q.hp=3;q.wpn='smg';q.shootAcc=.30;q.shootT=1.4+k*.25;q.hitT=0;q.mx=0;q.mz=1;
 q.doorWait=k*.22;q.doorOutZ=e.z+3.2+k*.35;e.gang.push(q)}}
function empGangAlive(e){return e.gang.filter(q=>peds.includes(q)&&q.state!=='dead'&&q.hp>0)}
/* v4 r14: inimigo derrubado (soco com hp 1, skate etc.) fica caído até levantar; ao retomar o controle, volta em pé (rot 0).
   Antes o tick forçava 'clerk' com o rot de deitado ainda setado → o corpo deslizava atrás do jogador. */
function hostileHold(q){if(q.state==='dead'||q.hp<=0)return true;if(q.state==='down')return true;
 if(q.state!=='clerk'){q.state='clerk';q.fixed=true;q.at={x:q.x,z:q.z};q.rot=0;q.vx=q.vz=0}return false}
function empGangTick(e,dt){for(const q of e.gang){if(!peds.includes(q)||hostileHold(q))continue;
  if(q.doorOutZ!==undefined){q.doorWait-=dt;if(q.doorWait>0)continue;
   q.at.z=Math.min(q.doorOutZ,q.at.z+4.6*dt);q.x=q.at.x;q.z=q.at.z;
   if(q.at.z<q.doorOutZ-.04)continue;q.doorOutZ=undefined}
  const dx=PL.x-q.x,dz=PL.z-q.z,d=Math.hypot(dx,dz)||1;q.mx=dx;q.mz=dz;if(PL.dead||PL.car&&q.wpn!=='smg'&&q.wpn!=='pistol')continue;
  if(q.wpn==='bat'||q.wpn==='fist'){if(d>1.2){const v=Math.min(d-1.1,3.6*dt);q.at.x+=dx/d*v;q.at.z+=dz/d*v}else{q.hitT-=dt;if(q.hitT<=0){q.hitT=q.wpn==='bat'?1.1:.8;if(!CHEAT.hp&&!PL.car){PL.hp-=armorHit(q.wpn==='bat'?11:6);punchSnd&&punchSnd();rumble(.3,.6,120);if(PL.hp<=0){killPlayer('ESPANCADO PELA GANGUE');return}}}}}
  else{const want=q.wpn==='smg'?9:12;if(d>want+2){const v=Math.min(d-want,3*dt);q.at.x+=dx/d*v;q.at.z+=dz/d*v}q.shootT-=dt;if(q.shootT<=0&&d<40){if(typeof c3Fire==='function')c3Fire(q,PL.x,PL.z);q.shootT=q.wpn==='smg'?.45+Math.random()*.3:1.1+Math.random()*.7;const hit=Math.random()<(q.shootAcc??(q.wpn==='smg'?.22:.28)),o=new THREE.Vector3(q.x,1.3,q.z),e2=new THREE.Vector3(PL.x+(hit?0:(Math.random()-.5)*3),1.2,PL.z+(hit?0:(Math.random()-.5)*3));tracer(o,e2,0xffb070);gunSound(.7,.9);
   if(hit){if(PL.car&&PL.car.alive){PL.car.hp-=5;if(PL.car.hp<=0)setOnFire(PL.car)}else if(!CHEAT.hp){PL.hp-=armorHit(q.wpn==='smg'?5:7);rumble(.3,.6,120);if(PL.hp<=0){killPlayer('ABATIDO PELA GANGUE');return}}}}}}}
function empNear(){if(PL.inside||PL.dead)return null;let b=null,bd=2.2;for(const e of EMP.sites){const d=Math.hypot(PL.x-e.x,PL.z-e.z);if(d<bd){bd=d;b=e}}return b}
function empHint(){if(PL.car)return '';if(PL.inside==='emp'){const g=empGoodNear();return g?'<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd><span style="color:#ff8a1a">QUEBRAR '+EMP_INFO[EMP.cur.id].good+'</span>':''}const e=empNear();if(!e)return '';const I=EMP_INFO[e.id];
 if(!storyOK('empire'))return I.nm+' · império indisponível por enquanto';if(e.phase==='sale')return '<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>COMPRAR '+I.nm+' · $'+I.price.toLocaleString(S.lang==='en'?'en-US':'pt-BR');
 if(e.phase==='owned'){if(e.attack)return '<span style="color:#ff4a4a">SOB ATAQUE · derrube os rivais</span>';if(!e.type)return '<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>ESCOLHER O RAMO DO NEGÓCIO';return '<kbd>E</kbd><kbd>F</kbd><kbd>→</kbd>RECOLHER LUCRO · $'+Math.floor(e.cofre).toLocaleString(S.lang==='en'?'en-US':'pt-BR')}return ''}
function empAct(){if(PL.inside==='emp'){const g=empGoodNear();if(g){empGoodDmg(g,1);punchSnd&&punchSnd();return true}return false}const e=empNear();if(!e||!storyOK('empire'))return false;const I=EMP_INFO[e.id];
 if(e.phase==='sale'){if((PL.money||0)<I.price){toast('DINHEIRO INSUFICIENTE · $'+I.price.toLocaleString(S.lang==='en'?'en-US':'pt-BR'));clang(.1);return true}money(-I.price);e.phase='owned';e.cofre=0;clang(.4);toast('<span style="color:#3dd46a">'+I.nm+' É SEU!</span><br><small style="font-size:11px;color:#fff">'+I.biz+'</small>');setTimeout(()=>empChoose(e),900);try{saveGame(true)}catch(err){}return true}
 if(e.phase==='owned'&&!e.attack){if(!e.type){empChoose(e);return true}const v=Math.floor(e.cofre);if(v<=0){toast('COFRE VAZIO · volte amanhã');return true}e.cofre-=v;money(v,'LUCRO DO IMPÉRIO · +$'+v.toLocaleString(S.lang==='en'?'en-US':'pt-BR'));return true}return false}
function empChoose(e){const T=EMP_TYPES,ks=['drugs','smuggle','theft'];dlgOpen({name:'CONTADOR',pal:{...CLERK_PAL,cap:null,shirt:'#2a2a30',glasses:'#121218'},lines:['Parabéns pelo '+EMP_INFO[e.id].nm.toLowerCase()+'. Com o que a gente vai mexer aqui?'],choices:ks.map(k=>T[k].nm+' · aporte $'+T[k].ap.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+' · $'+T[k].inc+'/dia · risco '+(T[k].risk>.2?'alto':T[k].risk>.1?'médio':'baixo')).concat(['DECIDO DEPOIS']),
  onEnd:res=>{const k=ks[res];if(!k)return;if((PL.money||0)<T[k].ap){toast('FALTA DINHEIRO PRO APORTE · $'+T[k].ap.toLocaleString(S.lang==='en'?'en-US':'pt-BR'));return}money(-T[k].ap);e.type=k;e.cofre=0;toast('NEGÓCIO DE '+T[k].nm+' ABERTO<br><small style="font-size:11px;color:#fff">rende $'+T[k].inc+' por dia de jogo · recolha na porta</small>');try{saveGame(true)}catch(err){}}})}
// interior: sala genérica com a cor do negócio; capangas de punho/taco e 3 bens para destruir
function empGoodNear(){if(!EMP.inner)return null;return EMP.inner.goods.find(g=>g.hp>0&&Math.hypot(PL.x-g.x,PL.z-g.z)<1.8)||null}
function empGoodDmg(g,n){g.hp-=n;g.m.scale.y=Math.max(.3,g.hp/3);if(g.hp<=0){g.m.visible=false;if(g.col)g.col.dead=true;for(let i=0;i<14;i++)emit(g.x,1,g.z,(Math.random()-.5)*5,1+Math.random()*3,(Math.random()-.5)*5,.5,.6,.12,0xffb030,true,1);clang(.3);toast(EMP_INFO[EMP.cur.id].good+' DESTRUÍDA')}}
function empGoodsHit(pt,n){if(PL.inside!=='emp'||!EMP.inner||!pt)return;for(const g of EMP.inner.goods)if(g.hp>0&&Math.hypot(pt.x-g.x,pt.z-g.z)<1.3){empGoodDmg(g,n);break}}
function empRoomClearCols(){const old=new Set(EMP.roomCols||[]);for(const c of old){c.dead=true;for(const key of c.keys||[]){const bucket=grid.get(key);if(!bucket)continue;const next=bucket.filter(q=>q!==c);if(next.length)grid.set(key,next);else grid.delete(key)}}if(old.size)colliders=colliders.filter(c=>!old.has(c));EMP.roomCols=[];}
function empRoomCol(x0,z0,x1,z1){const c=addCol(x0,z0,x1,z1,'rock');(EMP.roomCols||(EMP.roomCols=[])).push(c);return c}
function empRoomFit(mb,X,Z,id){
 const accent={sky:'#7d9a9d',mkt:'#a88a5a',univ:'#a58c71',stad:'#627da7',ind:'#b58351',air:'#788f78'}[id];
 const B=(a,b,c,d,e,f,h)=>ibox(mb,X+a,b,Z+c,X+d,e,Z+f,COL(h));
 const solid=(a,c,d,f)=>empRoomCol(X+a,Z+c,X+d,Z+f);
 for(const side of [-1,1]){const x=side*9.93;B(x-.025,.1,-6.9,x+.025,1.0,6.8,accent);B(x-.035,1.02,-6.9,x+.035,1.09,6.8,'#b7ada0')}
 for(const z of [-4,0,4]){B(-2,4.18,z-.25,2,4.35,z+.25,'#67727a');B(-1.85,4.15,z-.16,1.85,4.18,z+.16,'#d9d6bc')}
 for(const x of [-.98,.9])B(x,0,6.85,x+.08,2.57,6.98,'#8d8879');B(-.98,2.5,6.85,.98,2.58,6.98,'#8d8879');
 // Side furniture stays beyond the combat area and preserves the approach to objectives.
 for(const side of [-1,1]){const x=side<0?-9.65:8.25;B(x,0,-3.5,x+1.4,1.0,2.5,'#49545b');B(x-.04,1,-3.55,x+1.44,1.1,2.55,accent);solid(x-.04,-3.55,x+1.44,2.55);
  if(id==='sky'||id==='univ'){
   for(let z=-3;z<2.4;z+=.8){B(x+.2,1.1,z,x+1.2,1.34,z+.5,'#ded7c3');B(x+.26,1.34,z+.06,x+1.14,1.36,z+.1,accent)}
   for(const y of [1.65,2.35]){B(x,y,-3.5,x+1.4,y+.08,2.5,'#687479');for(let z=-3.35;z<2.3;z+=.42)B(x+.2,y+.08,z,x+1.2,y+.46,z+.3,id==='univ'?'#926e52':'#a8b4b2')}
  }else if(id==='mkt'){
   for(let z=-3.2;z<2.1;z+=.65){B(x+.15,1.1,z,x+1.15,1.35,z+.4,'#87735b');B(x+.55,1.35,z+.02,x+.68,1.37,z+.38,'#d1c5a0')}
   B(x+.25,1.1,-.1,x+1.15,1.7,.04,'#34454d');B(x+.3,1.18,-.12,x+1.1,1.63,-.1,'#769f9e');
  }else if(id==='stad'){
   for(let z=-3.2;z<2;z+=1.5){B(x+.15,1.1,z,x+1.25,1.8,z+.12,'#2a3747');B(x+.22,1.18,z-.02,x+1.18,1.71,z,'#739b9e');B(x+.2,1.1,z+.2,x+1.1,1.15,z+.6,'#a5b2b8')}
  }else if(id==='ind'){
   for(let z=-3.1;z<2.2;z+=1.2){B(x+.2,1.1,z,x+1.15,1.45,z+.6,'#56636d');for(let k=0;k<4;k++)B(x+.25+k*.2,1.45,z,x+.34+k*.2,1.62,z+.6,'#99a4a7')}
   B(x+.15,1.8,-3.3,x+.25,2.8,2.3,'#687579');
  }else{
   for(let z=-3.2;z<2.2;z+=1.3){B(x+.08,1.1,z,x+1.3,1.9,z+1.05,'#9b8767');B(x+.2,1.3,z-.02,x+.7,1.6,z,'#d7cfb7');B(x+.62,1.1,z-.03,x+.7,1.92,z+1.06,'#5d6e65')}
  }
 }
 // Rear storage, filing or shipment racks share a clear boundary at z=-6.
 for(const x of [-8,-4,4,8]){B(x-.85,0,-6.9,x+.85,.12,-6.1,'#7e6951');solid(x-.85,-6.9,x+.85,-6.1);for(let k=0;k<3;k++)B(x-.75+k*.5,.12,-6.8,x-.32+k*.5,1.45,-6.2,accent)}
}
// v77: esconderijos dos impérios mais vividos — sofá velho, mesinha com garrafas e baralho, TV num caixote,
// pichações da gangue, sacos de lixo, caixas, e uma "estação" do negócio de cada prédio na frente à direita.
function empTagTex(id){const c=cv(256,128),q=c.getContext('2d');q.clearRect(0,0,256,128);const cols=['#ff3a6a','#3ad8ff','#ffd21a','#7dff5a','#c86aff','#ff8a1a'];
 const R=mulberry32((S.seed^(id.charCodeAt(0)*977+id.length*31))>>>0),words=['VKS','ZONA','13','R4T','BRK','OSC','RX','SLS','NÓS'];
 for(let k=0;k<3;k++){q.save();q.translate(30+R()*190,30+R()*70);q.rotate((R()-.5)*.5);q.font='900 '+(26+R()*26|0)+'px Impact,Arial Black,sans-serif';q.lineWidth=6;q.strokeStyle='#111';const w=words[Math.floor(R()*words.length)];q.strokeText(w,0,0);q.fillStyle=cols[Math.floor(R()*cols.length)];q.fillText(w,0,0);q.restore()}
 for(let k=0;k<6;k++){q.fillStyle=cols[Math.floor(R()*cols.length)];q.globalAlpha=.5;q.fillRect(R()*250,R()*120,2,6+R()*16)}q.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;return t}
function empRoomExtra(g,mb,X,Z,id,cols){const B=(a,b,c,d,e,f,h)=>ibox(mb,X+Math.min(a,d),b,Z+Math.min(c,f),X+Math.max(a,d),e,Z+Math.max(c,f),COL(h)),solid=(a,c,d,f)=>empRoomCol(X+a,Z+c,X+d,Z+f);
 const cyl=(x,y0,y1,z,r,h)=>mb.geo(GEO.cyl16,mtx(X+x,(y0+y1)/2,Z+z,r,y1-y0,r),COL(h)),R=mulberry32((S.seed^0x3e17)>>>0);
 // sala de espera da gangue (frente à esquerda)
 B(-9.9,0,3.7,-8.9,.42,6.3,'#6a3a2a');B(-9.95,.42,3.7,-9.6,1.1,6.3,'#5a3022');B(-9.9,.42,3.7,-8.9,.7,3.95,'#5a3022');B(-9.9,.42,6.05,-8.9,.7,6.3,'#5a3022');
 B(-9.55,.42,4.1,-9.0,.55,4.9,'#7a4a3a');B(-9.55,.42,5.05,-9.0,.55,5.9,'#6e4232');solid(-9.95,3.7,-8.9,6.3);
 B(-8.1,0,4.35,-6.9,.42,5.55,'#4a3424');B(-8.15,.42,4.3,-6.85,.46,5.6,'#5a4030');solid(-8.15,4.3,-6.85,5.6);
 for(let k=0;k<4;k++)cyl(-7.95+R()*.9,.46,.46+.22+R()*.08,4.5+R()*.9,.04,['#2a6a2a','#5a3a1a','#c8c8d0','#3a2a1a'][k]);
 for(let k=0;k<5;k++)B(-7.6+k*.09,.46,4.6+k*.05,-7.53+k*.09,.465,4.7+k*.05,k%2?'#e8e0d0':'#c83a3a');
 B(-6.0,0,4.4,-5.2,.55,5.4,'#8a6a40');B(-5.95,.55,4.5,-5.25,1.05,5.3,'#1a1a1e');B(-5.96,.6,4.55,-5.95,1.0,5.25,'#2a4a60');solid(-6.0,4.4,-5.2,5.4);
 // lixo, caixas de pizza, tambores e engradados nos cantos de trás
 for(const[x,z] of [[-9.3,-5.4],[9.3,-5.3],[-9.2,6.4],[2.8,6.3]]){mb.geo(GEO.sph,mtx(X+x,.32,Z+z,.36,.34,.34),COL('#1a1a1c'));mb.geo(GEO.sph,mtx(X+x+.4,.25,Z+z-.2,.3,.26,.28),COL('#222226'))}
 for(let k=0;k<3;k++){const x=-3.6+k*1.1+R()*.3,z=5.4+R()*.8;B(x,0,z,x+.42,.04,z+.42,'#c8a070');B(x+.05,.04,z+.05,x+.37,.045,z+.37,'#d8b888')}
 for(const[x,z,c] of [[9.3,-1.8+0,'#2a5ab0'],[9.3,-.9,'#c8302a'],[-9.2,2.9,'#3a7a3a']]){cyl(x,0,1.0,z,.32,c);cyl(x,1.0,1.03,z,.33,'#1a1a1a')}
 for(const[x,z] of [[-2.9,-6.5],[2.9,-6.5]]){B(x-.45,0,z-.4,x+.45,.8,z+.4,'#8a6a40');B(x-.3,.8,z-.3,x+.3,1.4,z+.3,'#7a5a34');B(x-.46,.38,z-.41,x+.46,.42,z+.41,'#5a4024');solid(x-.45,z-.4,x+.45,z+.4)}
 // pichações (frente, ao lado da porta) e tag no fundo
 const tex=empTagTex(id);for(const[x,z,ry,w,h,y] of [[-5.2,6.9,Math.PI,3.6,1.8,1.7],[5.6,6.9,Math.PI,3.2,1.6,1.8],[-7.4,-6.92,0,3.2,1.4,2.5],[7.4,-6.92,0,3.2,1.4,2.5]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,color:0xb8b0a8}));m.position.set(X+x,y,Z+z);m.rotation.y=ry;g.add(m)}
 // estação do negócio (frente à direita)
 const sx0=5.6,sx1=9.6,sz0=3.8,sz1=6.4;
 if(id==='sky'){B(sx0,0,sz0,sx1-.4,.8,sz0+1.2,'#5a5a62');solid(sx0,sz0,sx1-.4,sz0+1.2);for(let k=0;k<7;k++){const x=sx0+.2+k*.48;B(x,.8,sz0+.25,x+.36,.8+.06+R()*.22,sz0+.45,'#5aa86a')}
  B(sx0+.4,.8,sz0+.7,sx0+1.0,.9,sz0+1.05,'#c8c8d0');for(let k=0;k<9;k++){const x=sx0+.3+k*.42;B(x,1.9,sz1-.6,x+.3,2.05,sz1-.58,'#7ac87a')}B(sx0,2.08,sz1-.62,sx1-.4,2.1,sz1-.56,'#d8d8d8')}
 else if(id==='mkt'){B(sx0+.5,0,sz0+.3,sx1-.6,.78,sz0+1.2,'#5a3a24');solid(sx0+.5,sz0+.3,sx1-.6,sz0+1.2);B(sx0+.9,.78,sz0+.5,sx0+1.5,.84,sz0+.95,'#e8e0c8');cyl(sx1-1.2,.78,1.2,sz0+.6,.06,'#2a2a2a');cyl(sx1-1.2,1.15,1.3,sz0+.6,.16,'#4aa86a');
  B(sx1-1.2,0,sz1-1.0,sx1-.3,.9,sz1-.2,'#4a4e56');B(sx1-1.22,.3,sz1-1.02,sx1-1.2,.6,sz1-.5,'#8a8e96');cyl(sx1-1.21,.55,.57,sz1-.75,.1,'#c8a040');solid(sx1-1.2,sz1-1.0,sx1-.3,sz1-.2)}
 else if(id==='univ'){B(sx0,0,sz0,sx1-.4,.8,sz0+1.2,'#6a4a30');solid(sx0,sz0,sx1-.4,sz0+1.2);for(let k=0;k<8;k++){const x=sx0+.3+k*.42;mb.geo(GEO.cyl16,mtx(X+x,.86,Z+sz0+.6,.05,.5,.05,Math.PI/2,0,0),COL('#f0ead8'));B(x-.02,.82,sz0+.58,x+.02,.9,sz0+.62,'#c8302a')}
  for(let k=0;k<3;k++){const x=sx0+.4+k*1.2;B(x,1.6,sz1+.42,x+.8,2.2,sz1+.46,'#b08a40');B(x+.08,1.68,sz1+.4,x+.72,2.12,sz1+.42,'#f0ead8')}}
 else if(id==='stad'){const c=cv(256,128),q=c.getContext('2d');q.fillStyle='#0a1a12';q.fillRect(0,0,256,128);q.font='700 15px monospace';const tm=['TUBARÕES','PIRATAS','GAIVOTAS','FAROL FC','MARÉ ALTA','CORAIS'];for(let k=0;k<6;k++){q.fillStyle=k%2?'#7dff8a':'#ffd21a';q.fillText(tm[k],8,20+k*19);q.fillText((1.2+R()*3).toFixed(2),200,20+k*19)}
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.6),new THREE.MeshBasicMaterial({map:t}));m.position.set(X+7.6,2.3,Z+6.92);m.rotation.y=Math.PI;g.add(m);
  B(sx0+.4,0,sz0+.4,sx1-.6,.95,sz0+1.0,'#2a3747');solid(sx0+.4,sz0+.4,sx1-.6,sz0+1.0);for(let k=0;k<10;k++){const x=sx0+.5+R()*2.8;B(x,.95,sz0+.45+R()*.4,x+.12,.952,sz0+.6+R()*.4,'#f0f0e0')}}
 else if(id==='ind'){B(sx0+.6,0,sz0+.5,sx0+1.6,.5,sz0+1.5,'#3a3a40');B(sx0+.7,.5,sz0+.6,sx0+1.5,1.2,sz0+1.4,'#6a6e74');for(let k=0;k<4;k++)cyl(sx0+.85+k*.2,1.2,1.32,sz0+1.0,.06,'#8a8e94');solid(sx0+.6,sz0+.5,sx0+1.6,sz0+1.5);
  for(let j=0;j<4;j++){cyl(sx1-.9,.03+j*.26,.29+j*.26,sz1-.9,.42,'#1b1b1d');cyl(sx1-.9,.29+j*.26,.3+j*.26,sz1-.9,.22,'#8c9096')}solid(sx1-1.35,sz1-1.35,sx1-.45,sz1-.45);
  B(sx0+2.2,0,sz0+.3,sx0+3.0,.9,sz0+.8,'#c8302a');B(sx0+2.2,.9,sz0+.3,sx0+3.0,.95,sz0+.8,'#a82a22');solid(sx0+2.2,sz0+.3,sx0+3.0,sz0+.8)}
 else{for(let k=0;k<2;k++){const x=sx0+.3+k*1.7;B(x,0,sz0+.3,x+1.4,.14,sz0+1.5,'#a8865a');B(x+.1,.14,sz0+.4,x+1.3,1.1,sz0+1.4,'#b89a6a');B(x+.09,.5,sz0+.39,x+1.31,.62,sz0+.4,'#2a2a2a');solid(x,sz0+.3,x+1.4,sz0+1.5)}
  B(sx1-1.4,0,sz1-1.6,sx1-.4,.9,sz1-.4,'#e8b81a');B(sx1-1.35,.9,sz1-1.5,sx1-.6,1.6,sz1-1.0,'#2a2a2a');B(sx1-1.6,.05,sz1-1.5,sx1-1.4,.1,sz1-.5,'#5a5a5a');solid(sx1-1.6,sz1-1.6,sx1-.4,sz1-.4)}}
function empGoodModel(id,color){const g=new THREE.Group(),mb=new MB();
 const B=(a,b,c,d,e,f,h)=>ibox(mb,a,b,c,d,e,f,COL(h));
 B(-.8,0,-.55,.8,.18,.55,'#414b53');
 if(id==='sky'){
  B(-.75,.18,-.5,.75,.9,.5,color);B(-.64,.9,-.44,.64,1.22,.4,'#aab9b7');B(-.55,.63,.5,.55,.77,.57,'#263941');B(-.55,.77,.56,.55,.79,.78,'#e2dac4');B(.38,1.22,-.3,.68,1.48,.05,'#3b505b');
 }else if(id==='mkt'){
  B(-.72,.18,-.5,.72,1.5,.5,'#667681');B(-.6,.28,.5,.6,1.38,.55,'#8b9a9b');B(.25,.75,.55,.32,1.05,.62,'#b8ad85');B(-.2,.83,.55,.08,1.07,.6,'#344957');
 }else if(id==='univ'){
  B(-.75,.18,-.5,.75,.78,.5,'#876a4f');for(const x of [-.65,.57])B(x,.78,-.42,x+.08,1.6,.42,'#6c7c85');B(-.69,1.5,-.45,.69,1.63,.45,'#9aabb0');B(-.55,.79,-.34,.55,.9,.38,'#e0d4b8');B(-.08,.9,-.08,.08,1.5,.08,'#536772');
 }else if(id==='stad'){
  B(-.7,.18,-.48,.7,1.5,.48,color);B(-.59,.83,.48,.59,1.37,.53,'#253a4e');B(-.5,.91,.53,.5,1.29,.55,'#83a9ac');for(let k=0;k<4;k++)B(-.48+k*.26,.54,.48,-.32+k*.26,.64,.55,'#bfc1ae');B(-.35,.3,.49,.35,.38,.56,'#2c3a48');
 }else if(id==='ind'){
  for(const x of [-.72,.62])for(const z of [-.47,.37])B(x,0,z,x+.1,.8,z+.1,'#586770');B(-.8,.8,-.55,.8,.9,.55,color);B(-.55,.9,-.35,.45,1.3,.35,'#667780');for(let k=0;k<4;k++)B(-.5+k*.24,1.3,-.36,-.38+k*.24,1.48,.36,'#adb6b4');
 }else{
  B(-.75,.18,-.5,.75,1.35,.5,color);for(const x of [-.5,.4])B(x,.18,-.52,x+.1,1.37,.52,'#b5ac8b');B(-.24,.65,.51,.24,.99,.53,'#ddd6bd');
 }
 g.add(mb.mesh(new THREE.MeshBasicMaterial({vertexColors:true})));return g;
}
function empEnter(e){if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');EMP.lock=1.5;return}const I=EMP_INFO[e.id],X=SAFE.IN.x,Z=SAFE.IN.z-140,W=10,D=7,H=4.4,C=h=>COL(h);EMP.IN={x:X,z:Z};
 empRoomClearCols();
 if(EMP.grp){scene.remove(EMP.grp);disposeGroup(EMP.grp)}const g=new THREE.Group();EMP.grp=g;scene.add(g);const mb=new MB();
 for(let x=X-W;x<X+W;x+=2)for(let z=Z-D;z<Z+D;z+=2)mb.quad([x,0,z+2],[x+2,0,z+2],[x+2,0,z],[x,0,z],0,1,0,[0,0,1,1],(((x-X)/2+(z-Z)/2)&1)?C('#4a4a50'):C('#3a3a40'));
 const wl=C('#5a5248');mb.qa([X-W,0,Z-D],[X+W,0,Z-D],[X+W,H,Z-D],[X-W,H,Z-D],wl,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wl,[X,1,Z+D+9]);mb.qa([X-W,0,Z-D],[X-W,0,Z+D],[X-W,H,Z+D],[X-W,H,Z-D],wl,[X-W-9,1,Z]);mb.qa([X+W,0,Z-D],[X+W,0,Z+D],[X+W,H,Z+D],[X+W,H,Z-D],wl,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],C('#2a2a30'),[X,H+9,Z]);
 ibox(mb,X-W,0,Z-D,X+W,.6,Z-D+.06,C('#c8203a'));ibox(mb,X-.9,0,Z+D-.06,X+.9,2.5,Z+D,C('#2a1a12'));empRoomFit(mb,X,Z,e.id);empRoomExtra(g,mb,X,Z,e.id);
 // v77: luz quente das 3 calhas + cantos, penumbra e muita sujeira (esconderijo de gangue)
 g.add(mb.mesh(roomLitMat({x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights:[[X,H-.5,Z-4],[X,H-.5,Z],[X,H-.5,Z+4],[X-7,H-.6,Z+4.5],[X+7,H-.6,Z+4.5],[X-7,H-.6,Z-3],[X+7,H-.6,Z-3]],warm:'#ffd08a',amb:.52,pow:1.15,rad:6.8,grime:.6})));
 {const c=cv(256,48),q=c.getContext('2d');q.fillStyle='#1a1018';q.fillRect(0,0,256,48);q.fillStyle='#ff8a1a';q.font='700 18px Silkscreen,monospace';q.textAlign='center';q.textBaseline='middle';q.fillText(I.biz,128,25,244);const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(6,1.1),new THREE.MeshBasicMaterial({map:t}));m.position.set(X,3.4,Z-D+.08);g.add(m)}
 for(const[x0,z0,x1,z1] of [[X-W-.5,Z-D-.5,X+W+.5,Z-D],[X-W-.5,Z+D,X+W+.5,Z+D+.5],[X-W-.5,Z-D,X-W,Z+D],[X+W,Z-D,X+W+.5,Z+D]])empRoomCol(x0,z0,x1,z1);
 const goods=[];for(const[gx,gz] of [[-5,-4.5],[0,-4.8],[5,-4.5]]){const m=empGoodModel(e.id,I.gc);m.position.set(X+gx,0,Z+gz);g.add(m);const col=empRoomCol(X+gx-.8,Z+gz-.55,X+gx+.8,Z+gz+(e.id==='sky'?.78:.55));goods.push({x:X+gx,z:Z+gz,hp:3,m,col})}
 EMP.cur=e;EMP.inner={goods};fadeFlash();doorEnter('emp','emp',{x:e.x,z:e.z+1.2},[0,1]);PL.inside='emp';EMP.lock=1;PL.x=X;PL.z=Z+D-1.8;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+3);camT.x=PL.x;camT.z=PL.z;
 for(const q of peds.slice())if(!q.fixed)removePed(q);empDespawn(e);const before=e.gang.length;empGang(e,2,'bat',X,Z-.5,2.6);empGang(e,2,'fist',X,Z-.5,2.6);if(!EMP.arrIn)EMP.arrIn=makeArrow();EMP.arrIn.position.set(X,1.5,Z+D-.9);EMP.arrIn.visible=true;
 toast(I.biz+'<br><small style="font-size:11px;color:#fff">derrube os capangas e destrua as '+I.good.toLowerCase()+'s (tiros ou E)</small>')}
function empExit(){empRoomClearCols();const e=EMP.cur;fadeFlash();PL.inside=false;doorExit({x:e.x,z:e.z+1.2,nx:0,nz:1});EMP.lock=1.5;if(EMP.grp)EMP.grp.visible=false;if(EMP.arrIn)EMP.arrIn.visible=false;empDespawn(e);EMP.cur=null;EMP.inner=null}
function empTick(dt){if(!played)return;if(S.style==='inverted'){if(EMP.arrOut)EMP.arrOut.visible=false;return}if(EMP.key!==S.seed+':'+S.style)empInit();if(!EMP.sites.length)return;EMP.lock=Math.max(0,EMP.lock-dt);const pc=PL.car||PL;
 // dias: lucros e ataques
 const day=Math.floor(gameMin()/1440);if(day!==EMP.day){const n=Math.max(0,Math.min(3,day-EMP.day));EMP.day=day;for(const e of EMP.sites){if(e.phase!=='owned'||!e.type)continue;const T=EMP_TYPES[e.type];for(let k=0;k<n;k++){if(!e.attack)e.cofre=Math.min(T.inc*3,e.cofre+T.inc);if(!e.attack&&Math.random()<T.risk){e.attack=true;phoneMission('Contador: Tão atacando o '+EMP_INFO[e.id].nm.toLowerCase()+'! O lucro parou até você resolver.')}}}}
 // interior
 if(PL.inside==='emp'&&EMP.cur){const e=EMP.cur;empGangTick(e,dt);if(EMP.arrIn){EMP.arrIn.position.y=1.5+Math.sin(simT*3)*.18;EMP.arrIn.rotation.y=simT*1.8}
  const left=empGangAlive(e).length,gl=EMP.inner.goods.filter(g=>g.hp>0).length;if(e.phase==='inside'){sideHud('<span style="color:#ff8a1a">IMPÉRIO</span> · capangas '+left+' · '+EMP_INFO[e.id].good.toLowerCase()+'s '+gl);if(!left&&!gl){e.phase='sale';clang(.4);toast('<span style="color:#3dd46a">TERRITÓRIO LIMPO</span><br><small style="font-size:11px;color:#fff">o negócio está à venda · compre na porta ($'+EMP_INFO[e.id].price.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+')</small>');sideHud(null)}}
  if(!PL.dead&&EMP.lock<=0&&EMP.IN&&Math.hypot(PL.x-EMP.IN.x,PL.z-(EMP.IN.z+7-.9))<.8)empExit();if(PL.dead){empDespawn(e);empRoomClearCols();EMP.cur=null;EMP.inner=null}return}
 if(!storyOK('empire'))return;let hud=null;
 for(const e of EMP.sites){const d=Math.hypot(pc.x-e.x,pc.z-e.z),near=d<90;
  if(e.phase==='rival'){if(near&&!e.car){const spot=empCarSpot(e);const c=makeVehicle('suv',spot.x,spot.z,spot.a,'#5a1020');c.hand=true;c.sleep=false;c.empire=e.id;c.hp=60;e.car=c}
   if(e.car&&(!vehicles.includes(e.car)||!e.car.alive||e.car.hp<=0)){e.car=null;e.phase='defend';empGangFromDoor(e);toast('<span style="color:#ff8a1a">A GANGUE SAIU PRA DEFENDER!</span>')}
   else if(e.car&&d>260){removeVehicle(e.car);e.car=null}if((e.car?Math.hypot(pc.x-e.car.x,pc.z-e.car.z):d)<14)hud='<span style="color:#ff8a1a">IMPÉRIO · '+EMP_INFO[e.id].nm+'</span> · destrua o carro da gangue'}
  else if(e.phase==='defend'){if(near&&!e.gang.length)empGangFromDoor(e);if(d>260)empDespawn(e);empGangTick(e,dt);const n=empGangAlive(e).length;if(e.gang.length&&!n){empDespawn(e);e.phase='inside';toast('ENTRE E LIMPE O LUGAR')}if(d<70)hud='<span style="color:#ff8a1a">IMPÉRIO</span> · membros da gangue '+n}
  else if(e.phase==='inside'){if(!PL.car&&!PL.dead&&EMP.lock<=0&&d<1.2)empEnter(e);if(d<70)hud='<span style="color:#ff8a1a">IMPÉRIO</span> · entre no prédio (seta)'}
  else if(e.phase==='owned'&&e.attack){if(near&&!e.gang.length){const T=EMP_TYPES[e.type||'theft'];empGang(e,3,T.atk,e.x,e.z+6,6);toast('<span style="color:#ff4a4a">RIVAIS NO SEU '+EMP_INFO[e.id].nm+'!</span>')}if(d>260)empDespawn(e);empGangTick(e,dt);if(e.gang.length&&!empGangAlive(e).length){empDespawn(e);e.attack=false;toast('<span style="color:#3dd46a">TERRITÓRIO DEFENDIDO</span>')}if(d<70)hud='<span style="color:#ff4a4a">SOB ATAQUE</span> · rivais '+empGangAlive(e).length}}
 if(hud)sideHud(hud);
 // seta na porta quando é hora de entrar
 if(!EMP.arrOut)EMP.arrOut=makeArrow();const en=EMP.sites.find(e=>e.phase==='inside'&&Math.hypot(pc.x-e.x,pc.z-e.z)<120);EMP.arrOut.visible=!!en&&!PL.inside;if(en){EMP.arrOut.position.set(en.x,1.5+Math.sin(simT*3)*.18,en.z);EMP.arrOut.rotation.y=simT*1.8}}
// ---------- BANCO: interior + assalto ----------
// Porta na calçada da frente do quarteirão do banco (seta amarela). Dentro: saguão de mármore, balcão com 3 caixas e o cofre.
// Assalto (E no balcão, com arma): 3 estrelas na hora, policiais entram em ondas (8 no total) e atiram; derrube todos
// e o cofre abre: +$1.000. Sair antes de terminar = assalto fracassado (continua procurado). Banco fecha por 1 dia de jogo.
// Base para a futura missão de roubo a banco (storyOK('bankrob')).
const BANK={grp:null,IN:null,lock:0,arrOut:null,arrIn:null,rob:null,closedUntil:0,tellers:[],waiters:[]};
/* v4 r19 · CAIXA 2: conta no Sunset Bank, nos dois caixas eletrônicos do saguão (cantos do fundo, ao lado do balcão).
   Saldo da conta (BANKACC.bal) não cai com a morte, prisão, assalto ou PIX hackeado (o PIX do online mexe só no dinheiro em mãos).
   Conta do hospital: primeiro o dinheiro em mãos, o resto sai da conta (bankPay). Uma conta só para Nathan e Claire.
   Vai no save (bank), nos checkpoints da história e, no online, na conta do jogador (campo bk do save da conta). */
const BANKACC={bal:0,open:false,i:3,el:null,css:false};
const BANKACC_ST=[10,50,100,500,1000,5000,10000,50000,0]; /* 0 = TUDO */
const BANK_ATM=[{x:0,z:0,gy:0},{x:0,z:0,gy:0}];
function bankAtmNear(){const IN=BANK.IN;if(PL.inside!=='bank'||!IN||PL.dead||BANK.rob)return null;for(let i=0;i<2;i++){const sx=i?9.9:-9.875;if(Math.abs(PL.x-(IN.x+sx))<1.15&&PL.z<IN.z-3.5&&PL.z>IN.z-5.3){const a=BANK_ATM[i];a.x=IN.x+sx;a.z=IN.z-5.4;return a}}return null}
function bankFmt(n){return '$'+Math.max(0,Math.round(n||0)).toLocaleString(S.lang==='en'?'en-US':'pt-BR')}
function bankAmt(kind){const v=BANKACC_ST[BANKACC.i],mx=kind==='dep'?Math.max(0,Math.floor(PL.money||0)):Math.floor(BANKACC.bal);return v===0?mx:Math.min(v,mx)}
function bankPay(fee){fee=Math.max(0,Math.round(fee||0));const m=Math.max(0,Math.floor(PL.money||0)),a=Math.min(m,fee);if(a)PL.money=m-a;const r=Math.min(Math.floor(BANKACC.bal),fee-a);if(r>0)BANKACC.bal-=r;return{hand:a,acc:Math.max(0,r)}}
function bankDlgEl(){if(BANKACC.el)return BANKACC.el;if(!BANKACC.css){BANKACC.css=true;const st=document.createElement('style');st.textContent='#bankDlg{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(4,10,8,.6);color:#fff;font-family:"Segoe UI",Arial,sans-serif}#bankDlg[hidden]{display:none}#bankDlg .bk-box{width:min(420px,calc(100vw - 32px));background:#0d1a16;border:2px solid #5ee0a0;border-radius:12px;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.7);text-align:center}#bankDlg .bk-t{font-size:18px;color:#7dffb0;letter-spacing:.5px}#bankDlg .bk-s{display:flex;justify-content:center;gap:18px;margin:10px 0 2px;font-size:14px}#bankDlg .bk-s b{display:block;font-size:20px;color:#ffd23a}#bankDlg .bk-s .bk-a b{color:#7dffb0}#bankDlg .bk-n{font-size:11px;opacity:.75;margin:4px 0 0}#bankDlg .bk-btns{display:flex;gap:10px;justify-content:center;margin-top:10px}#bankDlg .bk-btns .btn{min-width:120px}#bankDlg .bk-btns .btn:disabled{opacity:.35}#bankDlg .bk-pad{font-size:11px;opacity:.7;margin-top:8px}#money .bkHud{display:block;font-size:11px;color:#9fe8c0;opacity:.85;margin-top:2px}@media (pointer:coarse){#bankDlg .btn{min-height:44px}}';document.head.appendChild(st)}
 const d=document.createElement('div');d.id='bankDlg';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML='<div class="bk-box"><b class="bk-t" id="bkT"></b><div class="bk-s"><span class="bk-h"><small id="bkHL"></small><b id="bkH"></b></span><span class="bk-a"><small id="bkAL"></small><b id="bkA"></b></span></div><p class="bk-n" id="bkN"></p><div class="betStep" id="bkStep"><button type="button" class="btn" data-d="-1">−</button><b></b><button type="button" class="btn" data-d="1">+</button></div><div class="bk-btns"><button type="button" class="btn primary" id="bkDep"></button><button type="button" class="btn primary" id="bkSaq"></button></div><div class="bk-btns"><button type="button" class="btn" id="bkNo"></button></div><div class="bk-pad" id="bkPad"></div></div>';
 document.body.appendChild(d);BANKACC.el=d;
 d.querySelector('#bkStep').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;e.stopPropagation();BANKACC.i=clamp(BANKACC.i+(+b.dataset.d),0,BANKACC_ST.length-1);bankDlgUpd()});
 d.querySelector('#bkDep').addEventListener('click',()=>bankMove('dep'));d.querySelector('#bkSaq').addEventListener('click',()=>bankMove('saq'));d.querySelector('#bkNo').addEventListener('click',()=>bankDlgClose());
 d.addEventListener('click',e=>{if(e.target===d)bankDlgClose()});return d}
function bankDlgUpd(){const d=BANKACC.el;if(!d)return;const en=S.lang==='en',t=(a,b)=>en?b:a,v=BANKACC_ST[BANKACC.i];
 d.querySelector('#bkT').textContent=t('CONTA CORRENTE','CHECKING ACCOUNT');d.querySelector('#bkHL').textContent=t('NA MÃO','CASH');d.querySelector('#bkAL').textContent=t('NA CONTA','IN ACCOUNT');
 d.querySelector('#bkH').textContent=bankFmt(PL.money);d.querySelector('#bkA').textContent=bankFmt(BANKACC.bal);{const n=d.querySelector('#bkN');n.textContent='';n.style.display='none'}
 const sb=d.querySelector('#bkStep');sb.querySelector('b').textContent=v===0?t('TUDO','ALL'):bankFmt(v);const[mn,pl]=sb.querySelectorAll('button');mn.disabled=BANKACC.i<=0;pl.disabled=BANKACC.i>=BANKACC_ST.length-1;
 const a=bankAmt('dep'),b=bankAmt('saq');const bd=d.querySelector('#bkDep'),bs=d.querySelector('#bkSaq');bd.textContent=t('DEPOSITAR','DEPOSIT')+(a>0?' '+bankFmt(a):'');bs.textContent=t('SACAR','WITHDRAW')+(b>0?' '+bankFmt(b):'');bd.disabled=a<=0;bs.disabled=b<=0;
 d.querySelector('#bkNo').textContent=t('SAIR','EXIT');const pa=typeof padActive==='function'&&padActive();d.querySelector('#bkPad').textContent=pa?t('✕ confirma · ○ sai','✕ select · ○ exit'):t('← → valor · ESC sai','← → amount · ESC exit')}
function bankDlgOpen(){if(BANKACC.open)return;const d=bankDlgEl();BANKACC.open=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();bankDlgUpd();d.hidden=false;clang(.15);const f=d.querySelector('#bkDep');(f.disabled?d.querySelector('#bkSaq'):f).focus()}
function bankDlgClose(){if(!BANKACC.open)return;BANKACC.open=false;if(BANKACC.el){BANKACC.el.hidden=true;const ae=document.activeElement;if(ae&&BANKACC.el.contains(ae))ae.blur()}for(const k in keys)keys[k]=false}
function bankMove(kind){const v=bankAmt(kind);if(v<=0){clang(.1);return}const en=S.lang==='en';
 if(kind==='dep'){PL.money=Math.max(0,Math.floor(PL.money||0)-v);BANKACC.bal+=v;toast((en?'DEPOSITED · ':'DEPÓSITO · ')+bankFmt(v))}
 else{BANKACC.bal=Math.max(0,BANKACC.bal-v);money(v);toast((en?'WITHDRAWN · ':'SAQUE · ')+bankFmt(v))}
 clang(.25);const el=$('#money');if(el){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}bankDlgUpd();const d=BANKACC.el,ae=document.activeElement;if(d&&ae&&ae.disabled){const o=d.querySelector(kind==='dep'?'#bkSaq':'#bkDep');(o.disabled?d.querySelector('#bkNo'):o).focus()}}
document.addEventListener('keydown',e=>{if(!BANKACC.open)return;const k=e.key;if(/^F\d+$/.test(k))return;
 if(k==='ArrowLeft'||k==='a'||k==='A'){BANKACC.i=clamp(BANKACC.i-1,0,BANKACC_ST.length-1);bankDlgUpd()}else if(k==='ArrowRight'||k==='d'||k==='D'){BANKACC.i=clamp(BANKACC.i+1,0,BANKACC_ST.length-1);bankDlgUpd()}
 else if(k==='Escape'||k==='Backspace'){bankDlgClose()}else if(k==='Enter'||k===' '){const ae=document.activeElement;if(ae&&BANKACC.el.contains(ae)&&ae.click&&!ae.disabled)ae.click()}else if(k==='Tab'||k==='ArrowUp'||k==='ArrowDown')return;
 e.preventDefault();e.stopPropagation()},true);
function bankLm(){return(city.lms||[]).find(l=>l.name==='bank')}
function bankDoor(){const L=bankLm();if(!L)return null;
 if(city.bankDoor&&city.bankDoor.ri===L.ri)return city.bankDoor;
 // Local calculado do MESMO footprint e da MESMA escolha de fachada que o landmark:
 // a seta não pode ficar no lado sul por padrão quando a porta está voltada ao norte/leste/oeste.
 const r=city.rects[L.ri];if(!r)return null;
 const q=proceduralFootprint('bank',r[0]+SW,r[1]+SW,r[2]-SW,r[3]-SW),[x0,z0,x1,z1]=q;
 const cand=[['s',(x0+x1)/2,z1+SW+7.4,'H'+Math.round((z1+SW+8)/P)],['n',(x0+x1)/2,z0-SW-7.4,'H'+Math.round((z0-SW-8)/P)],['e',x1+SW+7.4,(z0+z1)/2,'V'+Math.round((x1+SW+8)/P)],['w',x0-SW-7.4,(z0+z1)/2,'V'+Math.round((x0-SW-8)/P)]].filter(v=>groundY(v[1],v[2])===0);
 const av=cand.filter(v=>{const line=city.lines&&city.lines[v[3]];return !line||line.t==='ave'});
 const f=(av[0]||cand[0]||['s'])[0],v=11-3.55;
 const x=f==='s'||f==='n'?(x0+x1)/2:f==='e'?x1-v:x0+v;
 const z=f==='s'?z1-v:f==='n'?z0+v:(z0+z1)/2;
 return{ri:L.ri,x,z,nx:f==='e'?1:f==='w'?-1:0,nz:f==='s'?1:f==='n'?-1:0}}

function bankBuild(){const X=SAFE.IN.x-70,Z=SAFE.IN.z+70,W=11,D=8,H=5,C=h=>COL(h);BANK.IN={x:X,z:Z};const g=new THREE.Group();BANK.grp=g;scene.add(g);g.visible=false;const mb=new MB();const solid=(a,c,d,f)=>addCol(X+a,Z+c,X+d,Z+f,'rock');const B=(a,b,c,d,e,f,h)=>ibox(mb,X+a,b,Z+c,X+d,e,Z+f,C(h));
 const wall=C('#d8d0bc'),wall2=C('#c8bfa8'),ceiling=C('#efe9dc'),trim=C('#c8a040'),wood=C('#5a3a24'),marbleA=C('#e8e4da'),marbleB=C('#d4cdbf');
 // piso em placas maiores com faixa central e área de espera mais clara
 for(let x=X-W;x<X+W;x+=1)for(let z=Z-D;z<Z+D;z+=1){let cc=((Math.floor(x-X)+Math.floor(z-Z))&1)?marbleA:marbleB; if(Math.abs(x-X)<3.2 && z>Z-3.2 && z<Z+5.8) cc=((Math.floor((x-X)*2)+Math.floor((z-Z)*2))&1)?C('#f0ece2'):C('#ddd6c6'); mb.quad([x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z],0,1,0,[0,0,1,1],cc)}
 mb.qa([X-W,0,Z-D],[X+W,0,Z-D],[X+W,H,Z-D],[X-W,H,Z-D],wall,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wall,[X,1,Z+D+9]);
 mb.qa([X-W,0,Z-D],[X-W,0,Z+D],[X-W,H,Z+D],[X-W,H,Z-D],wall2,[X-W-9,1,Z]);mb.qa([X+W,0,Z-D],[X+W,0,Z+D],[X+W,H,Z+D],[X+W,H,Z-D],wall2,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],ceiling,[X,H+9,Z]);
 // molduras e porta de entrada
 ibox(mb,X-W,H-.4,Z-D,X+W,H-.24,Z-D+.06,trim);ibox(mb,X-W,.0,Z-D,X+W,.14,Z-D+.06,trim);ibox(mb,X-W,.0,Z+D-.06,X+W,.14,Z+D,trim);
 ibox(mb,X-1.05,0,Z+D-.1,X+1.05,2.75,Z+D,C('#c8a040'));ibox(mb,X-.95,0,Z+D-.12,X+.95,2.65,Z+D,C('#3a2a1e'));ibox(mb,X+.62,1.1,Z+D-.17,X+.78,1.18,Z+D-.12,C('#d8c860'));ibox(mb,X-W+.35,0,Z+D-1.2,X-W+1.7,2.8,Z+D-.05,C('#c8bfa8'));ibox(mb,X+W-1.7,0,Z+D-1.2,X+W-.35,2.8,Z+D-.05,C('#c8bfa8'));
 // balcão longo dos atendentes com divisórias
 ibox(mb,X-8.2,0,Z-2.35,X+8.2,1.1,Z-1.2,wood);ibox(mb,X-8.25,1.1,Z-2.4,X+8.25,1.18,Z-1.12,C('#f6f2ea'));
 for(const px of [-5.4,0,5.4]){B(px-1.6,0,-5.4,px+1.6,.82,-4.7,'#6d4c34');B(px-1.65,.82,-5.45,px+1.65,.91,-4.65,'#cfc5ae');solid(px-1.65,-5.45,px+1.65,-4.65);
 B(px+.7,1.18,-2.25,px+1.25,1.25,-1.95,'#485560');B(px+.93,1.25,-2.15,px+1.02,1.5,-2.07,'#485560');B(px+.58,1.43,-2.17,px+1.38,1.96,-2.08,'#35434f');B(px+.63,1.48,-2.18,px+1.33,1.91,-2.17,'#779f9d');B(px-.8,1.18,-1.7,px-.24,1.2,-1.27,'#dedbd0');B(px-.7,1.2,-1.63,px-.32,1.21,-1.59,'#899aab');
 B(px-1.9,1.18,-2.39,px-1.84,2.47,-1.13,'#a4a99e');B(px-1.9,2.47,-1.82,px+1.9,2.54,-1.72,'#b4b7ac');
 }
 // colunas decorativas e sancas
 for(const px of [-10.4,10.4]){ibox(mb,X+px-.32,0,Z+2.2,X+px+.32,H,Z+3.05,C('#efe9dc'));ibox(mb,X+px-.42,H-.32,Z+2.1,X+px+.42,H,Z+3.15,C('#ddd2ba'));}
 // área de espera: bancos, cadeiras e mesas laterais
 function bench(x,z,w=2.6,col='#24496a'){ibox(mb,x-w/2,0,z-.38,x+w/2,.48,z+.38,C(col));ibox(mb,x-w/2,.48,z+.22,x+w/2,1.05,z+.38,C(col));for(const dx of[-w/2+.18,w/2-.18])ibox(mb,x+dx-.06,0,z-.28,x+dx+.06,.48,z-.18,C('#7e858c'))}
 bench(X-W+2.25,Z+5.05,2.8,'#2a4a6a'); bench(X-W+2.25,Z+6.35,2.8,'#2a4a6a'); bench(X+W-2.25,Z+5.05,2.8,'#2a4a6a'); bench(X+W-2.25,Z+6.35,2.8,'#2a4a6a');
 function chair(x,z,ry=0,col='#5b7c97'){
 const sign=Math.cos(ry)>0?1:-1;
 ibox(mb,x-.28,.43,z-.27,x+.28,.53,z+.27,C(col));
 const za=z+sign*.2,zb=z+sign*.3;ibox(mb,x-.28,.53,Math.min(za,zb),x+.28,1.05,Math.max(za,zb),C(col));
 for(const dx of [-.22,.22])for(const dz of [-.21,.21])ibox(mb,x+dx-.03,0,z+dz-.03,x+dx+.03,.43,z+dz+.03,C('#7c8992'));
 addCol(x-.28,z-.3,x+.28,z+.3,'rock');
 }
 for(const sx of [-1,1])for(const dx of [-.85,.85])chair(X+sx*6.1+dx,Z+.85,0); // v77: par de cadeiras ladeando a mesinha
 for(const x of [-8.75,8.75])for(const z of [5.05,6.35])solid(x-1.4,z-.38,x+1.4,z+.38);
 for(const x of [-10.4,10.4])solid(x-.32,2.2,x+.32,3.05);
 // Wall finishes, teller numbering supports and compact waiting-area furniture.
 for(const side of [-1,1]){const x=side*10.92;B(x-.025,.18,-7.5,x+.025,.92,7.5,'#a49b86');B(x-.035,.94,-7.5,x+.035,1.0,7.5,'#b79b5c');}
 for(const x of [-6.1,6.1]){B(x-.4,.68,.35,x+.4,.77,1.25,'#ac997a');B(x-.08,0,.72,x+.08,.68,.88,'#66747d');solid(x-.4,.35,x+.4,1.25);B(x-.24,.77,.5,x+.24,.82,.85,'#b6c2c7');}
 // Suspended queue sign attached to ceiling, not floating in the hall.
 for(const x of [-1.5,1.5])B(x-.025,4.18,1.05,x+.025,4.99,1.1,'#78827f');
 for(const z of [-5,0,5]){B(-2.3,4.86,z-.35,2.3,4.98,z+.35,'#9b9e95');B(-2.15,4.84,z-.22,2.15,4.86,z+.22,'#e6e2c7');}
 // Deposit boxes and office storage behind the tellers.
 for(const x of [-7.2,7.2]){B(x-1.25,0,-7.9,x+1.25,2.55,-7.45,'#687880');solid(x-1.25,-7.9,x+1.25,-7.45);for(let row=0;row<4;row++)for(let col=0;col<4;col++){const xx=x-1.15+col*.59,y=.15+row*.56;B(xx,y,-7.44,xx+.52,y+.48,-7.42,'#9da9a8');B(xx+.2,y+.2,-7.41,xx+.32,y+.25,-7.39,'#4a5a64')}}
 // ATM screen, keypad and receipt slot facing the public hall.
 B(9.47,1.2,-5.045,10.33,1.84,-5.02,'#243f53');B(9.53,1.27,-5.015,10.27,1.76,-5.005,'#78aaa7');
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)B(9.65+col*.16,.7+row*.12,-5.015,9.75+col*.16,.77+row*.12,-5.005,'#bfc8c2');
 B(9.58,.48,-5.015,10.2,.54,-5.005,'#263740');
 // Small wall-mounted security cameras; no additional surveillance logic.
 for(const x of [-9.8,9.8]){B(x-.08,3.4,-7.92,x+.08,3.48,-7.45,'#78878c');B(x-.2,3.3,-7.5,x+.2,3.62,-7.05,'#b3b8ac');B(x-.1,3.37,-7.04,x+.1,3.55,-7.01,'#354754');}
 solid(-3.4,-8,3.4,-7.38);
 for(const x of [-10.05,10.05])solid(x-.34,1.21,x+.34,1.89);
 // divisores de fila simples
 for(const p of [[X-2.6,Z+1.7],[X+2.6,Z+1.7],[X-2.6,Z+3.0],[X+2.6,Z+3.0]]){ibox(mb,p[0]-.08,0,p[1]-.08,p[0]+.08,.86,p[1]+.08,C('#aeb4be'));ibox(mb,p[0]-.18,.82,p[1]-.18,p[0]+.18,.92,p[1]+.18,C('#d8c860'));addCol(p[0]-.18,p[1]-.18,p[0]+.18,p[1]+.18,'rock')}
 // v77: fitas retráteis ligando os postes da fila
 for(const sx of [-2.6,2.6]){ibox(mb,X+sx-.025,.78,Z+1.78,X+sx+.025,.84,Z+2.92,C('#b0202a'));addCol(X+sx-.1,Z+1.7,X+sx+.1,Z+3.0,'rock')}
 // v77: rodapé nas paredes laterais (o lambri começava a 18 cm do chão sem nada embaixo)
 for(const sx of [-1,1])ibox(mb,sx<0?X-W:X+W-.06,0,Z-D+.06,sx<0?X-W+.06:X+W,.14,Z+D-.06,trim);
 // moldura e porta do cofre mais detalhada
 ibox(mb,X-3.4,0,Z-D,X+3.4,4.5,Z-D+.45,C('#6e727c'));ibox(mb,X-3.1,.25,Z-D+.42,X+3.1,4.2,Z-D+.58,C('#4b5058'));ibox(mb,X-3.25,4.2,Z-D+.35,X+3.25,4.45,Z-D+.62,C('#979da6'));
 // mesinhas de apoio, vasos e bebedouro/caixa eletrônica decorativos
 ibox(mb,X-W+.55,0,Z-6.2,X-W+1.7,2.2,Z-5.15,C('#9098a4'));ibox(mb,X-W+.68,.25,Z-5.17,X-W+1.58,1.95,Z-5.12,C('#d6e8f2'));ibox(mb,X-W+.8,1.2,Z-5.13,X-W+1.46,1.75,Z-5.11,C('#3a6a8a'));ibox(mb,X-W+.8,.5,Z-5.13,X-W+1.46,.62,Z-5.11,C('#8a96a2'));
 ibox(mb,X+W-1.7,0,Z-6.25,X+W-.55,2.1,Z-5.05,C('#79808a'));
 g.add(mb.mesh(roomLitMat({x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights:roomGrid(X-W,Z-D,X+W,Z+D,H-.4),warm:'#ffcf98',amb:.5,pow:.78,rad:7.5}))); // v77: luz de loja do shopping
 // vidros transparentes dos caixas (50%)
 const glassMat=new THREE.MeshBasicMaterial({color:0xbfe4f0,transparent:true,opacity:.32,depthWrite:false});
 const deco=[]; const add=o=>{g.add(o);deco.push(o);return o};
 for(const px of [-5.4,0,5.4]){const pane=new THREE.Mesh(new THREE.BoxGeometry(3.7,1.2,.06),glassMat);pane.position.set(X+px,1.82,Z-1.78);add(pane);for(const sx of[-1.83,1.83]){const mull=new THREE.Mesh(new THREE.BoxGeometry(.09,1.26,.09),new THREE.MeshBasicMaterial({color:0xe6e1d2}));mull.position.set(X+px+sx,1.82,Z-1.78);add(mull)}const slot=new THREE.Mesh(new THREE.BoxGeometry(.95,.11,.08),new THREE.MeshBasicMaterial({color:0x4b4e54}));slot.position.set(X+px,1.3,Z-1.76);add(slot)}
 // placas dos guichês
 function panel(txt,x,y,z,ry,w,h,bg='#1a2a3a',fg='#e8c860',sub=''){const c=cv(256,96),q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,256,96);q.fillStyle=fg;q.textAlign='center';q.textBaseline='middle';q.font='700 26px Silkscreen,monospace';q.fillText(translatePlain(txt),128,35);if(sub){q.font='700 13px monospace';q.fillText(translatePlain(sub),128,67)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true}));m.position.set(x,y,z);m.rotation.y=ry;add(m);return m}
 panel('BANCO SUNSET',X-6.8,3.5,Z-D+.08,0,4.4,.8,'#1a2a3a','#e8c860','atendimento · cofres');
 panel('CAIXA 1',X-5.4,2.75,Z-1.16,0,1.45,.48,'#233243','#fff1bf','depósitos'); panel('CAIXA 2',X,2.75,Z-1.16,0,1.45,.48,'#233243','#fff1bf','saques'); panel('CAIXA 3',X+5.4,2.75,Z-1.16,0,1.45,.48,'#233243','#fff1bf','pagamentos');
 panel('FILA PREFERENCIAL',X,4.0,Z+1.05,0,3.5,.42,'#31506a','#eef6ff','aguarde sua vez');
 // porta do cofre com textura em canvas e detalhes mecânicos
 {const c=cv(256,256),q=c.getContext('2d');q.fillStyle='#9ea4ad';q.beginPath();q.arc(128,128,108,0,7);q.fill();q.strokeStyle='#d9dde2';q.lineWidth=12;q.stroke();q.fillStyle='#7a8089';q.beginPath();q.arc(128,128,82,0,7);q.fill();q.strokeStyle='#cfd5dd';q.lineWidth=6;q.stroke();q.strokeStyle='#59606a';q.lineWidth=12;q.beginPath();q.moveTo(128,62);q.lineTo(128,194);q.moveTo(62,128);q.lineTo(194,128);q.stroke();q.fillStyle='#d8c860';for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=128+Math.cos(a)*89,y=128+Math.sin(a)*89;q.beginPath();q.arc(x,y,7,0,7);q.fill()}q.fillStyle='#44505a';q.beginPath();q.arc(128,128,24,0,7);q.fill();q.strokeStyle='#dfe4eb';q.lineWidth=4;q.beginPath();q.arc(128,128,31,0,7);q.stroke();const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;const vault=new THREE.Mesh(new THREE.CircleGeometry(1.95,24),new THREE.MeshBasicMaterial({map:tex}));vault.position.set(X,2.18,Z-D+.61);add(vault);BANK.vault=vault;const frame=new THREE.Mesh(new THREE.RingGeometry(1.98,2.28,24),new THREE.MeshBasicMaterial({color:0x61666e}));frame.position.set(X,2.18,Z-D+.6);add(frame)}
 // relógio e vasos
 for(const[posx,posz] of [[X-W+.95,Z+1.55],[X+W-.95,Z+1.55]]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.26,.32,.42,8),new THREE.MeshBasicMaterial({color:0x7a5538}));pot.position.set(posx,.21,posz);add(pot);const leaf=new THREE.Mesh(new THREE.ConeGeometry(.4,.9,7),new THREE.MeshBasicMaterial({color:0x4b9354}));leaf.position.set(posx,.86,posz);add(leaf)}
 {const c=cv(128,128),q=c.getContext('2d');q.fillStyle='#f6f6f2';q.beginPath();q.arc(64,64,60,0,7);q.fill();q.strokeStyle='#4b5564';q.lineWidth=6;q.stroke();q.strokeStyle='#59616b';q.lineWidth=3;for(let i=0;i<12;i++){const a=i*Math.PI/6;q.beginPath();q.moveTo(64+Math.sin(a)*49,64-Math.cos(a)*49);q.lineTo(64+Math.sin(a)*55,64-Math.cos(a)*55);q.stroke();}const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;const clk=new THREE.Mesh(new THREE.CircleGeometry(.62,18),new THREE.MeshBasicMaterial({map:tex}));clk.position.set(X+6.8,3.55,Z-D+.08);add(clk);
 const hand=(length,width,depth)=>{const geo=new THREE.PlaneGeometry(width,length);geo.translate(0,length/2,0);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x25313b}));m.position.set(X+6.8,3.55,Z-D+depth);add(m);return m};
 BANK.clockHands={hour:hand(.29,.045,.095),minute:hand(.44,.028,.105),last:-1};bankClockTick();}
 for(const[x0,z0,x1,z1] of [[X-W-.5,Z-D-.5,X+W+.5,Z-D],[X-W-.5,Z+D,X+W+.5,Z+D+.5],[X-W-.5,Z-D,X-W,Z+D],[X+W,Z-D,X+W+.5,Z+D],[X-8.25,Z-2.4,X+8.25,Z-1.12],[X-W+.45,Z-6.25,X-W+1.8,Z-5.1],[X+W-1.8,Z-6.3,X+W-.5,Z-5.0],[X-W+.35,Z+D-1.2,X-W+1.7,Z+D],[X+W-1.7,Z+D-1.2,X+W-.35,Z+D]])addCol(x0,z0,x1,z1,'rock');
 BANK.arrIn=makeArrow();BANK.arrIn.position.set(X,1.5,Z+D-.9);BANK.arrIn.visible=false}
function bankClockTick(){const h=BANK.clockHands;if(!h)return;const now=new Date(),stamp=Math.floor(now.getTime()/1000);if(h.last===stamp)return;h.last=stamp;const minutes=now.getMinutes()+now.getSeconds()/60;h.minute.rotation.z=-minutes*Math.PI/30;h.hour.rotation.z=-((now.getHours()%12)+minutes/60)*Math.PI/6;}
function bankEnter(){if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');BANK.lock=1.5;return}if(gameMin()<BANK.closedUntil){toast('BANCO FECHADO<br><small style="font-size:11px;color:#fff">reabre amanhã</small>');BANK.lock=2;return}if(!BANK.grp)bankBuild();const d=bankDoor(),IN=BANK.IN;fadeFlash();doorEnter('bank','bank',{x:d.x,z:d.z},[d.nx,d.nz]);PL.inside='bank';BANK.grp.visible=true;BANK.arrIn.visible=true;BANK.lock=1;
 PL.x=IN.x;PL.z=IN.z+8-1.8;PL.vx=PL.vz=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+3);camT.x=PL.x;camT.z=PL.z;for(const q of peds.slice())if(!q.fixed)removePed(q);
 BANK.tellers=[];BANK.waiters=[];
 for(const dx of [-5.4,0,5.4]){const q=spawnPed(null,{x:IN.x+dx,z:IN.z-3.0,vx:0,vz:0,pal:{...CLERK_PAL,cap:null,capDark:null,shirt:'#f4f4f0',stripe:'#2a3a5a'}});if(q){q.state='clerk';q.fixed=true;q.at={x:IN.x+dx,z:IN.z-3.0};q.mx=0;q.mz=1;q.timer=0;BANK.tellers.push(q)}}
 const waits=[[-2.6,4.0],[0,4.2],[2.6,4.0],[-2.2,5.35],[2.2,5.35],[-6.9,5.1],[6.9,5.1]];
 const pb=()=>pick2(PED_PALS),pals=[{...pb()},{...pb(),shirt:'#4e78b0',stripe:'#d8e4ff'},{...pb(),shirt:'#a35a4a',stripe:'#f2d4c8'},{...pb(),shirt:'#5a8c5a',stripe:'#e2f2de'}]; // v77: PED_PAL não existia (ReferenceError cortava a entrada no banco)
 waits.forEach((p,i)=>{const q=spawnPed(null,{x:IN.x+p[0],z:IN.z+p[1],vx:0,vz:0,pal:pals[i%pals.length]});if(q){q.fixed=true;q.state='idle';q.at={x:IN.x+p[0],z:IN.z+p[1]};q.mx=0;q.mz=i<3?-1:(i<5?1:0);q.timer=0;BANK.waiters.push(q)}});
 toast('BANCO DE SUNSET SHORES')}
function bankClear(){for(const q of BANK.tellers)if(peds.includes(q))removePed(q);BANK.tellers=[];for(const q of BANK.waiters)if(peds.includes(q))removePed(q);BANK.waiters=[];if(BANK.rob){for(const q of BANK.rob.cops)if(peds.includes(q))removePed(q)}}
function bankExit(){const d=bankDoor();fadeFlash();PL.inside=false;doorExit({x:d.x,z:d.z,nx:d.nx,nz:d.nz});BANK.lock=1.5;if(BANK.grp)BANK.grp.visible=false;if(BANK.arrIn)BANK.arrIn.visible=false;
 if(BANK.rob&&!BANK.rob.done){toast('<span style="color:#ff4a4a">ASSALTO FRACASSADO</span><br><small style="font-size:11px;color:#fff">você saiu sem o dinheiro</small>');BANK.closedUntil=gameMin()+1440}
 bankClear();BANK.rob=null;if(POL.wanted)wantedUp(3)}
function bankCounterNear(){const IN=BANK.IN;return PL.inside==='bank'&&IN&&!PL.dead&&Math.abs(PL.x-IN.x)<7&&PL.z>IN.z-1.4&&PL.z<IN.z+.4}
function bankRobStart(){if(!storyOK('bankrob')){storyLocked('ASSALTO A BANCO');return}const has=GUN.has||Object.keys(GUN.inv||{}).length;if(!has){toast('VOCÊ PRECISA DE UMA ARMA');return}if(!GUN.has){const w=Object.keys(GUN.inv)[0];gunSelect(w,true)}
 BANK.rob={cops:[],spawned:0,killed:0,spawnT:2,done:false,total:8};for(const q of BANK.tellers){say(q,['Não atira!','Calma, calma!','Leva o que quiser!'][Math.floor(Math.random()*3)],2.5);q.state='clerk'}
 startWanted(true);wantedUp(3);clang(.5);toast('<span style="color:#ff4a4a">ASSALTO AO BANCO!</span><br><small style="font-size:11px;color:#fff">a polícia está entrando · derrube todos e o cofre abre</small>')}
function bankTick(dt){if(PL.inside==='bank')bankClockTick();const d=bankDoor();if(!played||!d||city.haze)return;BANK.lock=Math.max(0,BANK.lock-dt);if(!BANK.arrOut)BANK.arrOut=makeArrow();
 BANK.arrOut.position.set(d.x,1.5+Math.sin(simT*3)*.18,d.z);BANK.arrOut.rotation.y=simT*1.8;BANK.arrOut.visible=!PL.inside&&!PL.car&&!PL.dead&&Math.hypot(PL.x-d.x,PL.z-d.z)<140;
 if(BANK.arrIn&&BANK.arrIn.visible){BANK.arrIn.position.y=1.5+Math.sin(simT*3)*.18;BANK.arrIn.rotation.y=simT*1.8}
 const R0=BANK.rob;if(R0&&PL.inside==='bank'){const IN=BANK.IN;
  if(PL.dead){bankClear();BANK.rob=null;BANK.closedUntil=gameMin()+1440;return}
  // ondas de policiais entrando pela porta
  R0.spawnT-=dt;const alive=R0.cops.filter(q=>peds.includes(q)&&q.state!=='dead'&&q.hp>0);
  if(!R0.done&&R0.spawned<R0.total&&alive.length<3&&R0.spawnT<=0){R0.spawnT=1.6;const x=IN.x+(Math.random()-.5)*2,z=IN.z+7.2;const q=spawnPed(null,{x,z,vx:0,vz:0,pal:copPal()});if(q){q.cop=true;q.bankCop=true;q.hp=3;q.state='clerk';q.fixed=true;const tx=[-8.5,-3.5,3.5,8.5][R0.spawned%4];q.at={x,z};q.goal={x:IN.x+tx+(Math.random()<.5?-1.3:1.3),z:IN.z+3.4+Math.random()*2};q.shootT=1.2+Math.random();q.mx=0;q.mz=-1;q.timer=0;R0.cops.push(q);R0.spawned++;say(q,['POLÍCIA! MÃOS PRA CIMA!','LARGA A ARMA!','CERCA ELE!'][R0.spawned%3],2)}}
  for(const q of R0.cops){if(!peds.includes(q))continue;if(q.state==='dead'||q.hp<=0){if(!q.counted){q.counted=true;R0.killed++}continue}if(hostileHold(q))continue;
   const gx=q.goal.x-q.at.x,gz=q.goal.z-q.at.z,gl=Math.hypot(gx,gz);if(gl>.2){q.at.x+=gx/gl*Math.min(gl,3.2*dt);q.at.z+=gz/gl*Math.min(gl,3.2*dt)}
   const dx=PL.x-q.x,dz=PL.z-q.z,dd=Math.hypot(dx,dz)||1;q.mx=dx;q.mz=dz;q.shootT-=dt;
   if(q.shootT<=0){if(typeof c3Fire==='function')c3Fire(q,PL.x,PL.z);q.shootT=1+Math.random()*.8;const hit=Math.random()<.32,o=new THREE.Vector3(q.x,1.3,q.z),e=new THREE.Vector3(PL.x+(hit?0:(Math.random()-.5)*2.6),hit?1.1:1.4,PL.z+(hit?0:(Math.random()-.5)*2.6));tracer(o,e,0xff9a7a);gunSound(.7,.85);
    if(hit&&!CHEAT.hp){PL.hp-=armorHit(7);rumble(.3,.6,120);bloodHit(PL.x,1.1,PL.z,new THREE.Vector3(dx,0,dz).normalize().negate());if(PL.hp<=0){killPlayer('ABATIDO NO BANCO');return}}}}
  if(!R0.done&&R0.killed>=R0.total){R0.done=true;BANK.closedUntil=gameMin()+1440;if(BANK.vault)BANK.vault.rotation.z=1.2;const pay=CHEAT.used?0:1000;if(pay)money(pay,'<span style="color:#5aff6a">COFRE ABERTO · +$1.000</span>');else toast('COFRE ABERTO · SEM PAGAMENTO (CHEAT)');toast('SAIA DO BANCO E DESPISTE A POLÍCIA')}
  sideHud(R0.done?'<span style="color:#5aff6a">DINHEIRO NA MÃO</span> · fuja!':'<span style="color:#ff4a4a">ASSALTO</span> · policiais '+R0.killed+'/'+R0.total)}
 else if(!R0&&PL.inside==='bank'&&!RAMP.on&&!RACE.on)sideHud(null);
 if(PL.dead||PL.car||BANK.lock>0)return;
 if(!PL.inside&&Math.hypot(PL.x-d.x,PL.z-d.z)<1.2)bankEnter();
 else if(PL.inside==='bank'&&BANK.IN&&Math.hypot(PL.x-BANK.IN.x,PL.z-(BANK.IN.z+8-.9))<.8)bankExit()}
// ---------- CASSINO ----------
// Fachada neon num quarteirão; ao entrar, salão interno (como a casa de penhores) com 5 caça-níqueis.
// Jogada: $10. Vitória com chance de 1 em 25 (sorteio antes de girar): três símbolos iguais = $1.000.
const CAS={grp:null,casinoBase:null,clubBase:null,lock:0,arrOut:null,arrIn:null,arrClubOut:null,arrClubIn:null,machines:[],tables:[],clubPeds:[],entry:'casino',bar:null,bartender:null,exitCasino:null,exitClub:null},SLOT={open:false,spin:false,bet:10},SLOT_SYM=['🍒','🍋','🔔','⭐','💎','7️⃣'];
const DRUNK={t:0,ph:0,level:0,drinks:0,coma:0};
function casinoBuild(){const CX=SAFE.IN.x+70,CZ=SAFE.IN.z+70,H=4.2,C=h=>COL(h),BX=SAFE.IN.x+102,BZ=SAFE.IN.z+70;CAS.casinoBase={x:CX,z:CZ};CAS.clubBase={x:BX,z:BZ};CAS.entry='casino';const g=new THREE.Group();CAS.grp=g;scene.add(g);g.visible=false;let mb=new MB();const addObj=o=>{g.add(o);return o};
 function mkCanvas(draw,w=256,h=128){const c=cv(w,h),ctx=c.getContext('2d');draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearFilter;return t}
 function addPanel(txt,x,y,z,ry,w,h,bg='#1a1020',fg='#ffd21a',sub=''){const tex=mkCanvas((q,ww,hh)=>{q.fillStyle=bg;q.fillRect(0,0,ww,hh);q.fillStyle=fg;q.textAlign='center';q.textBaseline='middle';q.font='700 28px Silkscreen, monospace';q.fillText(translatePlain(txt),ww/2,hh/2-8);if(sub){q.font='700 13px monospace';q.fillText(translatePlain(sub),ww/2,hh/2+22)}},256,96);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true}));m.position.set(x,y,z);m.rotation.y=ry;addObj(m);return m}
 function addSlotDisplay(txt,x,y,z,w=.72,h=.3){const tex=mkCanvas((q,ww,hh)=>{q.fillStyle='#0d1018';q.fillRect(0,0,ww,hh);q.fillStyle='#70f8ff';q.font='700 28px monospace';q.textAlign='center';q.textBaseline='middle';q.fillText(translatePlain(txt),ww/2,hh/2)},160,64);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);addObj(m);return m}
 function makeFeltTexture(title,bg='#0b5b33',accent='#f7f1d3'){return mkCanvas((q,ww,hh)=>{q.fillStyle=bg;q.fillRect(0,0,ww,hh);q.strokeStyle=accent;q.lineWidth=6;q.strokeRect(10,10,ww-20,hh-20);q.fillStyle=accent;q.font='700 20px monospace';q.textAlign='center';q.fillText(translatePlain(title),ww/2,28);q.font='700 12px monospace';q.fillText('SUNSET ROYALE',ww/2,hh-14);q.strokeStyle='rgba(255,255,255,.18)';q.lineWidth=2;q.beginPath();q.moveTo(ww*.18,hh*.55);q.lineTo(ww*.82,hh*.55);q.stroke();q.beginPath();q.moveTo(ww*.5,hh*.38);q.lineTo(ww*.5,hh*.76);q.stroke()},256,128)}
 function addChip(x,y,z,col='#d03535'){const chip=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.05,8),new THREE.MeshBasicMaterial({color:new THREE.Color(col)}));chip.position.set(x,y,z);addObj(chip)}
 function addStool(x,z,col=0x6d2846){const seat=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.11,10),new THREE.MeshBasicMaterial({color:col}));seat.position.set(x,.48,z);addObj(seat);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.42,6),new THREE.MeshBasicMaterial({color:0xaeb4be}));leg.position.set(x,.21,z);addObj(leg)}
 function addTable(kind,x,z,ry=0,opt={}){const felt=opt.felt||'#0b5b33',edge=opt.edge||0x5a331e,mode=opt.mode||'oval',dealer=opt.dealer!==false;let topGeo;if(mode==='round')topGeo=new THREE.CylinderGeometry(1.05,1.05,.12,12);else topGeo=new THREE.CylinderGeometry(1.45,1.45,.12,14);const topMat=new THREE.MeshBasicMaterial({map:makeFeltTexture(kind,felt)});const top=new THREE.Mesh(topGeo,topMat);top.position.set(x,.92,z);top.rotation.y=ry;top.scale.set(mode==='round'?1:.9,1,mode==='round'?1:.72);addObj(top);const rim=new THREE.Mesh(new THREE.CylinderGeometry(mode==='round'?1.12:1.52,mode==='round'?1.12:1.52,.12,14),new THREE.MeshBasicMaterial({color:edge}));rim.position.set(x,.88,z);rim.rotation.y=ry;rim.scale.set(mode==='round'?1:.92,1,mode==='round'?1:.76);addObj(rim);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.17,.25,.82,8),new THREE.MeshBasicMaterial({color:0x9a6a48}));leg.position.set(x,.41,z);addObj(leg);if(dealer){for(const ang of[-1.2,0,1.2])addChip(x+Math.sin(ry+ang)*.6,1.005,z+Math.cos(ry+ang)*.35,ang<0?'#d23b52':ang>0?'#3a88ff':'#f0d14a')}const localSeats=mode==='round'?[[-.95,0],[-.3,.88],[.3,.88],[.95,0],[0,-1.02]]:[[-1.2,.8],[0,1.05],[1.2,.8],[-1.2,-.82],[0,-1.06],[1.2,-.82]];for(const[sx,sz]of localSeats){const rx=Math.cos(ry)*sx-Math.sin(ry)*sz,rz=Math.sin(ry)*sx+Math.cos(ry)*sz;(kind==='ROULETTE'?addStool(x+rx,z+rz,0x763750):null)}}
 // casino interior
 {const X=CX,Z=CZ,W=10,D=7;CAS.machines=[];CAS.tables=[{kind:'bj',x:X-4.2,z:Z-1.0},{kind:'poker',x:X+.7,z:Z-1.0},{kind:'roul',x:X+4.5,z:Z+2.7},{kind:'pool',x:X-15.5,z:Z},{kind:'dice',x:X+15.5,z:Z-1.8}];
  /* v79r13: cassino em + como o shopping — salão central 20×14 com 3 alas: NORTE (caça-níqueis), OESTE (sinuca), LESTE (dados/Liar's Dice). Cada ala tem malha e luz próprias (WG). */
  const WG={N:new MB(),W:new MB(),E:new MB()},WN={x0:X-6,x1:X+6,z0:Z-19,z1:Z-D},WW={x0:X-21,x1:X-W,z0:Z-4.5,z1:Z+4.5},WE={x0:X+W,x1:X+21,z0:Z-4.5,z1:Z+.9},OPN=[X-6,X+6],OPW=[Z-4.5,Z+4.5],OPE=[Z-4.5,Z+.9];CAS.wings={N:WN,W:WW,E:WE};CAS.wgN=WG.N;CAS.wgW=WG.W;CAS.wgE=WG.E;const floor1=C('#27152f'),floor2=C('#341c3f'),wall1=C('#3a2048'),wall2=C('#2d1938'),gold=C('#e8b830');for(let x=X-W;x<X+W;x++)for(let z=Z-D;z<Z+D;z++){const cc=((x+z)&1)?floor1:floor2;mb.quad([x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z],0,1,0,[0,0,1,1],cc)}for(const[a,b] of [[X-W,OPN[0]],[OPN[1],X+W]])mb.qa([a,0,Z-D],[b,0,Z-D],[b,H,Z-D],[a,H,Z-D],wall1,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wall1,[X,1,Z+D+9]);for(const[a,b] of [[Z-D,OPW[0]],[OPW[1],Z+D]])mb.qa([X-W,0,a],[X-W,0,b],[X-W,H,b],[X-W,H,a],wall2,[X-W-9,1,Z]);for(const[a,b] of [[Z-D,OPE[0]],[OPE[1],Z+D]])mb.qa([X+W,0,a],[X+W,0,b],[X+W,H,b],[X+W,H,a],wall2,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],C('#1a0a20'),[X,H+9,Z]);ibox(mb,X-W,H-.5,Z-D,X+W,H-.35,Z-D+.06,gold);for(const[a,b] of [[X-W,OPN[0]],[OPN[1],X+W]])ibox(mb,a,0,Z-D,b,.14,Z-D+.06,gold);ibox(mb,X-W,0,Z+D-.06,X+W,.14,Z+D,gold);for(const[a,b] of [[Z-D,OPW[0]],[OPW[1],Z+D]])ibox(mb,X-W,0,a,X-W+.06,H,b,C('#6a2440'));for(const[a,b] of [[Z-D,OPE[0]],[OPE[1],Z+D]])ibox(mb,X+W-.06,0,a,X+W,H,b,C('#6a2440'));for(const x of OPN)ibox(mb,x-.12,0,Z-D-.12,x+.12,H,Z-D+.12,gold);for(const z of OPW)ibox(mb,X-W-.12,0,z-.12,X-W+.12,H,z+.12,gold);for(const z of OPE)ibox(mb,X+W-.12,0,z-.12,X+W+.12,H,z+.12,gold);ibox(mb,X-1.1,0,Z+D-.1,X+1.1,2.5,Z+D,gold);ibox(mb,X-1.0,0,Z+D-.12,X+1.0,2.4,Z+D,C('#120a18'));ibox(mb,X-2.8,0,Z+D-1.12,X-1.35,1.05,Z+D-.18,C('#4a2a18'));ibox(mb,X+1.35,0,Z+D-1.12,X+2.8,1.05,Z+D-.18,C('#4a2a18'));ibox(mb,X-2.8,1.05,Z+D-1.1,X-1.35,1.15,Z+D-.18,gold);ibox(mb,X+1.35,1.05,Z+D-1.1,X+2.8,1.15,Z+D-.18,gold);
  function addSlotBank(x,z0,body='#c8203a',screenCol='#f8f4e8'){ibox(mb,x-.78,0,z0,x+.78,2.02,z0+1.06,C(body));ibox(mb,x-.82,2.02,z0,x+.82,2.3,z0+1.08,gold);ibox(mb,x-.6,1.08,z0+1.02,x+.6,1.76,z0+1.06,C(screenCol));ibox(mb,x-.65,.36,z0+.98,x+.65,.9,z0+1.03,C('#2f2638'));for(const dx of[-.36,-.12,.12,.36])ibox(mb,x+dx-.08,.48,z0+1.03,x+dx+.08,.64,z0+1.06,C(dx<-.2?'#ff5050':dx<0?'#ffd24a':dx<.2?'#49d070':'#4aa8ff'));ibox(mb,x-.28,.72,z0+1.03,x+.28,.84,z0+1.075,C('#d8dde8'));ibox(mb,x+.72,1.16,z0+.42,x+.83,1.95,z0+.56,C('#9aa0a8'));ibox(mb,x+.69,1.87,z0+.36,x+.92,2.06,z0+.62,C('#ff2a2a'));CAS.machines.push({x,z:z0+1.7});addStool(x,z0+2.35,0x763750);addCol(x-.24,z0+2.11,x+.24,z0+2.59,'rock');addCol(x-.82,z0,x+.92,z0+1.08,'rock')}
  {const mbC=mb;mb=WG.N;const labels=['777','BAR','GOLD','PIXEL','LUCK','TIGRE'],SL=[[X-4.2,Z-18.85],[X-1.4,Z-18.85],[X+1.4,Z-18.85],[X+4.2,Z-18.85],[X-3,Z-13.4],[X+3,Z-13.4]];SL.forEach(([x,z0],k)=>{addSlotBank(x,z0,k%2?'#c8203a':'#2a6ad6',k%2?'#f7f3e8':'#e8f2ff');addSlotDisplay(labels[k],x,1.42,z0+1.11,.82,.34)});mb=mbC}
  addPanel('SUNSET ROYALE',X,3.28,Z-19+.08,0,5.2,.94,'#120a18','#ffd21a','caça-níqueis');addPanel('CAIXA',X+9.85,2.35,Z+2.7,-Math.PI/2,2.1,.55,'#201322','#fff0b4','fichas');addPanel('SINUCA',X-20.9,2.75,Z,Math.PI/2,1.9,.5,'#183224','#fff0b4','castigado · $50');addPanel('JACKPOT',X+5.9,2.7,Z-15,-Math.PI/2,2.2,.48,'#341230','#ffcf52','$ 1.000');addPanel('DADOS',X+20.9,2.75,Z-1.8,-Math.PI/2,2.0,.5,'#2a1838','#fff0b4',"liar's dice · $50");
  // v77: propaganda de aposta com um tigre (desenho próprio, procedural) — 2 banners pendurados e 1 pôster
  {const tiger=(q,cx,cy,r)=>{q.save();q.translate(cx,cy);
     q.fillStyle='#f28a1e';for(const sx of[-1,1]){q.beginPath();q.arc(sx*r*.72,-r*.72,r*.3,0,7);q.fill()}q.fillStyle='#ffd7b0';for(const sx of[-1,1]){q.beginPath();q.arc(sx*r*.72,-r*.72,r*.15,0,7);q.fill()}
     q.fillStyle='#f28a1e';q.beginPath();q.ellipse(0,0,r,r*.92,0,0,7);q.fill();
     q.fillStyle='#1a1410';for(const sx of[-1,1]){for(const [a,b,c] of [[.25,-.85,.18],[.55,-.55,.16],[.85,-.15,.14]]){q.beginPath();q.moveTo(sx*a*r,b*r);q.lineTo(sx*(a+c)*r,(b+.28)*r);q.lineTo(sx*(a-.04)*r,(b+.2)*r);q.fill()}}
     q.beginPath();q.moveTo(-r*.12,-r*.92);q.lineTo(r*.12,-r*.92);q.lineTo(0,-r*.55);q.fill();
     q.fillStyle='#fff6e8';q.beginPath();q.ellipse(0,r*.38,r*.55,r*.4,0,0,7);q.fill();
     q.fillStyle='#fff';for(const sx of[-1,1]){q.beginPath();q.ellipse(sx*r*.36,-r*.12,r*.2,r*.16,0,0,7);q.fill()}
     q.fillStyle='#2a8a3a';for(const sx of[-1,1]){q.beginPath();q.arc(sx*r*.36,-r*.1,r*.1,0,7);q.fill()}q.fillStyle='#000';for(const sx of[-1,1]){q.fillRect(sx*r*.36-r*.025,-r*.18,r*.05,r*.16)}
     q.fillStyle='#d6455a';q.beginPath();q.ellipse(0,r*.18,r*.13,r*.09,0,0,7);q.fill();
     q.strokeStyle='#1a1410';q.lineWidth=r*.05;q.beginPath();q.moveTo(0,r*.26);q.lineTo(0,r*.42);q.moveTo(-r*.2,r*.5);q.quadraticCurveTo(0,r*.62,r*.2,r*.5);q.stroke();
     q.fillStyle='#ffd21a';q.beginPath();q.moveTo(-r*.5,-r*.95);q.lineTo(-r*.3,-r*1.35);q.lineTo(-r*.1,-r*1.05);q.lineTo(0,-r*1.42);q.lineTo(r*.1,-r*1.05);q.lineTo(r*.3,-r*1.35);q.lineTo(r*.5,-r*.95);q.closePath();q.fill(); // coroa
     q.restore()};
   const coin=(q,x,y,r)=>{q.fillStyle='#e8b830';q.beginPath();q.arc(x,y,r,0,7);q.fill();q.strokeStyle='#9a7010';q.lineWidth=r*.18;q.stroke();q.fillStyle='#9a7010';q.font=`900 ${r*1.2}px monospace`;q.textAlign='center';q.textBaseline='middle';q.fillText('$',x,y+r*.05)};
   const banner=(t1,t2,t3,bg)=>mkCanvas((q,w,h)=>{const g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,bg[0]);g.addColorStop(1,bg[1]);q.fillStyle=g;q.fillRect(0,0,w,h);
     q.strokeStyle='#ffd21a';q.lineWidth=8;q.strokeRect(8,8,w-16,h-16);q.textAlign='center';q.textBaseline='middle';
     const fit=(t,sz,wt)=>{let k=sz;do{q.font=`${wt} ${k}px Fredoka, Inter, sans-serif`;k--}while(q.measureText(t).width>w-44&&k>12)};q.fillStyle='#ffd21a';fit(translatePlain(t1),34,900);q.fillText(translatePlain(t1),w/2,52);tiger(q,w/2,h*.47,w*.3);
     for(const [x,y,r] of [[40,h*.33,16],[w-44,h*.4,20],[54,h*.62,14],[w-40,h*.66,13]])coin(q,x,y,r);
     q.fillStyle='#fff';fit(translatePlain(t2),30,800);q.fillText(translatePlain(t2),w/2,h-92);q.fillStyle='#ffcf52';fit(translatePlain(t3),18,700);q.fillText(translatePlain(t3),w/2,h-52)},256,420);
   const hang=(tex,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.15,1.9),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;addObj(m);
     for(const sx of[-.5,.5]){const c=new THREE.Mesh(new THREE.BoxGeometry(.02,H-y-.95,.02),new THREE.MeshBasicMaterial({color:0x3a3030}));c.position.set(x+Math.cos(ry)*sx,(H+y+.95)/2,z-Math.sin(ry)*sx);addObj(c)}
     const rod=new THREE.Mesh(new THREE.BoxGeometry(1.25,.05,.05),new THREE.MeshBasicMaterial({color:0xc59d56}));rod.position.set(x,y+.97,z);rod.rotation.y=ry;addObj(rod)};
   hang(banner('TIGRÃO DA SORTE','APOSTE JÁ!','bônus de boas-vindas',['#5a0e1a','#200610']),X-6.2,2.75,Z+.6,0);
   hang(banner('GIRE O TIGRE','PAGA ATÉ 100x','o tigre paga... às vezes',['#0e3a2a','#061810']),X+6.0,2.75,Z+.6,0);
   {const m=new THREE.Mesh(new THREE.PlaneGeometry(1.25,2.05),new THREE.MeshBasicMaterial({map:banner('NOITE DO TIGRE','SEXTA · 22H','jogue com responsabilidade',['#2a0e4a','#100620'])}));m.position.set(X+9.9,2.2,Z+5.6);m.rotation.y=-Math.PI/2;addObj(m)}}
  for(const p of [[X-4.8,H-.58,Z-1.9],[X,H-.58,Z-1.2],[X+4.8,H-.58,Z-1.9],[X-3.4,H-.58,Z+2.2],[X+3.4,H-.58,Z+2.2]]){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xffe7a8}));lamp.position.set(p[0],p[1]+.28,p[2]);addObj(lamp);/* v3 r48/r49: lâmpada de 46 → 18 cm, mais perto do teto; haste curta do teto até ela */const stem=new THREE.Mesh(new THREE.BoxGeometry(.04,.22,.04),new THREE.MeshBasicMaterial({color:0x7f6d44}));stem.position.set(p[0],p[1]+.47,p[2]);addObj(stem)}
  addTable('BLACKJACK',X-4.2,Z-1.0,0,{felt:'#0b5b33',edge:0x5b351f});addTable('POKER',X+.7,Z-1.0,0,{felt:'#124a7a',edge:0x4d2d1c});addTable('ROULETTE',X+4.5,Z+2.7,0,{felt:'#7a1010',edge:0x5b351f,mode:'round'});
  addPanel('BLACKJACK',X-9.85,2.45,Z-5.75,Math.PI/2,2.2,.5,'#14281d','#fff0b4');addPanel('POKER',X+9.85,2.45,Z-5.75,-Math.PI/2,2.0,.5,'#16243a','#fff0b4');addPanel('SAÍDA',X,2.65,Z+D-.112,Math.PI,1.6,.45,'#173b30','#f5e9ca');
  for(const p of [[X-9.2,Z-6.1],[X+9.2,Z-6.1],[X-9.3,Z+5.9],[X+9.3,Z+5.9],[X-5.3,Z-18.3],[X+5.3,Z-18.3],[X-20.3,Z-3.8],[X-20.3,Z+3.8],[X+20.3,Z+.3],[X+20.3,Z-3.9]]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.46,8),new THREE.MeshBasicMaterial({color:0x7a5538}));pot.position.set(p[0],.23,p[1]);addObj(pot);const leaf=new THREE.Mesh(new THREE.ConeGeometry(.42,1.0,7),new THREE.MeshBasicMaterial({color:0x3c8c4a}));leaf.position.set(p[0],.95,p[1]);addObj(leaf)}
  // Detailed joinery is batched with the room geometry.
  const wood=C('#633e36'),darkWood=C('#30252b'),brass=C('#c59d56'),stone=C('#d9cdb4'),velvet=C('#763750');
  const box=(x0,y0,z0,x1,y1,z1,c)=>ibox(mb,x0,y0,z0,x1,y1,z1,c);
  // Bar on west wall and cashier on east wall: visible volumes match collisions.
  /* v79r5: sem o bar do lado oeste (virou a mesa de sinuca); o caixa do leste é um balcão raso como o da conveniência, com o atendente atrás */
  for(const [x0,x1] of [[X+7.4,X+8.2]]){
   box(x0,0,Z+1.15,x1,1.02,Z+4.35,wood);box(x0-.08,1.02,Z+1.07,x1+.08,1.16,Z+4.43,stone);
   // v77: frisos e ripas na face voltada ao salão (antes estavam na ponta estreita, virada pra parede do fundo)
   const west=x0<X,xf=west?x1:x0,a0=west?xf:xf-.06,a1=west?xf+.06:xf;
   box(a0,.12,Z+1.2,a1,.22,Z+4.3,brass);box(a0,.78,Z+1.2,a1,.86,Z+4.3,brass);
   for(let z=Z+1.45;z<Z+4.2;z+=.55)box(west?xf:xf-.065,.25,z,west?xf+.065:xf,.73,z+.055,darkWood);
   box(x0,.12,Z+1.09,x1,.22,Z+1.15,brass);
  }
  // v79r5: caixa — maquininha, bandejas de fichas no balcão, estante de fichas na parede do fundo e laterais fechando o corredor do atendente
  box(X+7.55,1.16,Z+3.25,X+8.05,1.42,Z+3.85,C('#22222a'));box(X+7.6,1.42,Z+3.35,X+7.98,1.62,Z+3.4,C('#2a3a2a'));box(X+7.61,1.45,Z+3.34,X+7.97,1.6,Z+3.35,C('#5aff8a'));
  for(let j=0;j<2;j++){box(X+7.5,1.16,Z+1.5+j*.75,X+8.1,1.22,Z+2.05+j*.75,darkWood);for(let k=0;k<4;k++)addChip(X+7.8,1.24+k*.04,Z+1.78+j*.75,j===0?'#b64750':'#467c9b')}
  box(X+9.55,0,Z+1.3,X+9.95,2.3,Z+4.2,darkWood);for(const y of [.6,1.15,1.7])box(X+9.5,y,Z+1.35,X+9.55,y+.05,Z+4.15,brass);
  for(const y of [.65,1.2,1.75])for(let k=0;k<6;k++)addChip(X+9.66,y+.05,Z+1.6+k*.45,['#b64750','#467c9b','#d4b75e','#3c8c4a','#f4f0e8','#30333d'][k]);
  box(X+8.2,0,Z+1.07,X+9.95,1.02,Z+1.2,wood);box(X+8.2,0,Z+4.3,X+9.95,1.02,Z+4.43,wood);
  // v79r5: mesa de sinuca no lugar do bar (eixo maior em z; área de jogo 1,12 × 2,24 m, superfície a 0,8 m)
  {const mbC=mb;mb=WG.W; /* v79r13: sinuca na ala oeste */
   const TX=X-15.5,TZ=Z,hw=.56,hl=1.12,rw=.12,felt=C('#0d6b3a'),feltD=C('#0a5a30'),rail=C('#4a2a1a'),blk=C('#0a0a0c');CAS.pool={x:TX,z:TZ,y:.8,hw,hl};
   box(TX-hw,.62,TZ-hl,TX+hw,.8,TZ+hl,felt);
   /* v79r5: tabelas e frisos interrompidos nas 6 caçapas; cada caçapa é um "copo" — cilindro preto que desce do pano (dá pra ver o alvo do buraco) */
   {const gc=.075,gs=.068,zs=[[-hl+gc,-gs],[gs,hl-gc]],xs=[[-hw+gc,hw-gc]];
    for(const [z0,z1] of zs){box(TX-hw-rw,.6,TZ+z0,TX-hw,.86,TZ+z1,rail);box(TX+hw,.6,TZ+z0,TX+hw+rw,.86,TZ+z1,rail);box(TX-hw,.8,TZ+z0,TX-hw+.035,.835,TZ+z1,feltD);box(TX+hw-.035,.8,TZ+z0,TX+hw,.835,TZ+z1,feltD)}
    for(const [x0,x1] of xs){box(TX+x0,.6,TZ-hl-rw,TX+x1,.86,TZ-hl,rail);box(TX+x0,.6,TZ+hl,TX+x1,.86,TZ+hl+rw,rail);box(TX+x0,.8,TZ-hl,TX+x1,.835,TZ-hl+.035,feltD);box(TX+x0,.8,TZ+hl-.035,TX+x1,.835,TZ+hl,feltD)}
    /* v79r8: cantos e meios das tabelas na altura da tabela, com o furo redondo da caçapa recortado (desenho de caçapa; antes ficavam rebaixados e parecia que a bola caía da mesa) */
    /* v79r10: a peça da caçapa só ocupa a TABELA (fora do pano): contorno em L (cantos) ou retângulo (meios) com o arco do furo; antes era um quadrado com furo que invadia o pano */
    const arc=(pts,cx,cz,r,a0,a1,mid)=>{let d=a1-a0;const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));const inc=((m)=>{let x=wrap(m-a0);if(x<0)x+=Math.PI*2;let y=wrap(a1-a0);if(y<0)y+=Math.PI*2;return x<y})(mid);let y=wrap(a1-a0);if(inc){if(y<0)y+=Math.PI*2}else{if(y>0)y-=Math.PI*2}for(let k=1;k<24;k++){const a=a0+y*k/24;pts.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r])}};
    const jawP=(pts,sx,sz)=>{const sh=new THREE.Shape();pts.forEach((p,k)=>{const x=p[0]*sx,y=-p[1]*sz;if(k)sh.lineTo(x,y);else sh.moveTo(x,y)});const ge=new THREE.ExtrudeGeometry(sh,{depth:.26,bevelEnabled:false});ge.rotateX(-Math.PI/2);mb.geo(ge.index?ge.toNonIndexed():ge,mtx(TX,.6,TZ,1,1,1),rail)};
    {const cx=hw+.01,cz=hl+.01,r=.07,qz=cz-Math.sqrt(r*r-(hw-cx)**2),qx=cx-Math.sqrt(r*r-(hl-cz)**2),P=[[hw-gc,hl],[hw-gc,hl+rw],[hw+rw,hl+rw],[hw+rw,hl-gc],[hw,hl-gc],[hw,qz]];arc(P,cx,cz,r,Math.atan2(qz-cz,hw-cx),Math.atan2(hl-cz,qx-cx),Math.PI/4);P.push([qx,hl]);
     for(const sx of [-1,1])for(const sz of [-1,1])jawP(P,sx,sz)}
    {const cx=hw+.01,r=.062,qz=Math.sqrt(r*r-(hw-cx)**2),P=[[hw,-gs],[hw+rw,-gs],[hw+rw,gs],[hw,gs],[hw,qz]];arc(P,cx,0,r,Math.atan2(qz,hw-cx),Math.atan2(-qz,hw-cx),0);P.push([hw,-qz]);for(const sx of [-1,1])jawP(P,sx,1)}
    for(const [px,pz] of [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]){const x=TX+px*(hw+.01),z=TZ+pz*(hl+(pz?.01:0)),r=pz?.07:.062;mb.geo(GEO.cyl16,mtx(x,.6975,z,r-.001,.215,r-.001),blk)}}
   for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])box(TX+a*(hw+.02)-.07,0,TZ+b*(hl+.02)-.07,TX+a*(hw+.02)+.07,.62,TZ+b*(hl+.02)+.07,darkWood);
   box(TX-hw-.05,.4,TZ-hl-.05,TX+hw+.05,.6,TZ+hl+.05,darkWood);
   box(TX-.3,3.62,TZ-.9,TX+.3,3.77,TZ+.9,C('#1c2a22'));box(TX-.27,3.61,TZ-.87,TX+.27,3.62,TZ+.87,C('#fff2c8'));for(const dz of [-.8,.8])box(TX-.01,3.77,TZ+dz-.01,TX+.01,H,TZ+dz+.01,C('#3a3030')); /* luminária alta: a vista de cima passa por baixo dela */
   box(X-20.97,1.0,TZ-2.2,X-20.9,1.9,TZ-1.5,darkWood);for(let k=0;k<4;k++)box(X-20.9,1.05,TZ-2.12+k*.17,X-20.86,1.85,TZ-2.1+k*.17,C('#b8925a'));mb=mbC}
  // Upholstered chairs with backrests, four legs and brass feet.
  function chair(x,z,angle){const ca=Math.cos(angle),sa=Math.sin(angle),pt=(u,v)=>[x+ca*u-sa*v,z+sa*u+ca*v];
   const cb=(u0,u1,v0,v1,y0,y1,col)=>{const A=pt(u0,v0),B=pt(u1,v0),C0=pt(u1,v1),D0=pt(u0,v1),M=pt((u0+u1)/2,(v0+v1)/2);for(const [P,Q] of [[A,B],[B,C0],[C0,D0],[D0,A]])mb.qa([P[0],y0,P[1]],[Q[0],y0,Q[1]],[Q[0],y1,Q[1]],[P[0],y1,P[1]],col,[M[0],(y0+y1)/2,M[1]]);mb.qa([A[0],y1,A[1]],[D0[0],y1,D0[1]],[C0[0],y1,C0[1]],[B[0],y1,B[1]],col,[M[0],y1-1,M[1]]);}; // v77: faces orientadas pela própria caixa
   cb(-.29,.29,-.28,.28,.46,.58,velvet);cb(-.3,.3,.22,.31,.55,1.12,wood);cb(-.24,.24,.205,.22,.67,1.05,velvet);
   for(const u of [-.22,.22])for(const v of [-.21,.21]){cb(u-.035,u+.035,v-.035,v+.035,.05,.46,darkWood);cb(u-.04,u+.04,v-.04,v+.04,0,.07,brass);}
  }
  for(const [tx,tz] of [[X-4.2,Z-1],[X+.7,Z-1]])for(const [u,v] of [[-1.1,1.55],[0,1.65],[1.1,1.55]]){chair(tx+u,tz+v,0);addCol(tx+u-.3,tz+v-.28,tx+u+.3,tz+v+.31,'rock')}
  // Lounge near entrance, clear central arrival aisle.
  box(X-8.6,0,Z+5.2,X-4.4,.28,Z+6.6,darkWood);box(X-8.6,.28,Z+5.2,X-4.4,.65,Z+6.6,velvet);box(X-8.6,.65,Z+6.3,X-4.4,1.2,Z+6.65,velvet);
  addCol(X-8.6,Z+5.2,X-4.4,Z+6.65,'rock');
  // Accurate table footprints: narrow strips follow oval/round edges rather than blocking their corners.
  const ovalCol=(x,z,rx,rz)=>{for(let i=0;i<12;i++){const z0=-rz+2*rz*i/12,z1=-rz+2*rz*(i+1)/12,near=z0<=0&&z1>=0?0:Math.min(Math.abs(z0),Math.abs(z1)),w=rx*Math.sqrt(Math.max(0,1-near*near/(rz*rz)));addCol(x-w,z+z0,x+w,z+z1,'rock')}};
  for(const x of [X-4.2,X+.7])ovalCol(x,Z-1,1.52*.92,1.52*.76);
  ovalCol(X+4.5,Z+2.7,1.12,1.12);
  for(const [u,v] of [[-.95,0],[-.3,.88],[.3,.88],[.95,0],[0,-1.02]])addCol(X+4.5+u-.24,Z+2.7+v-.24,X+4.5+u+.24,Z+2.7+v+.24,'rock');
  addCol(X+7.32,Z+1.07,X+8.28,Z+4.43,'rock');addCol(X+8.28,Z+1.07,X+9.95,Z+1.2,'rock');addCol(X+8.28,Z+4.3,X+9.95,Z+4.43,'rock');addCol(X+9.5,Z+1.3,X+9.95,Z+4.2,'rock'); /* v79r5: caixa raso + laterais */
  addCol(X-15.5-.68,Z-1.24,X-15.5+.68,Z+1.24,'rock'); /* v79r5: mesa de sinuca (v79r13: ala oeste) */
  /* v79r13: mesa redonda do Liar's Dice (ala leste) — pano vinho, borda de madeira, 3 banquetas */
  {const mbC=mb;mb=WG.E;const TX=X+15.5,TZ=Z-1.8;CAS.dice={x:TX,z:TZ,y:.82};mb.geo(GEO.cyl16,mtx(TX,.8,TZ,.92,.04,.92),C('#5a1424'));mb.geo(GEO.cyl16,mtx(TX,.79,TZ,1.0,.06,1.0),C('#4a2a1a'));mb.geo(GEO.cyl16,mtx(TX,.4,TZ,.14,.76,.14),darkWood);mb.geo(GEO.cyl16,mtx(TX,.03,TZ,.55,.06,.55),darkWood);
   for(let p=0;p<3;p++){const a=Math.PI+p*2*Math.PI/3,sx=TX+Math.cos(a)*1.35,sz=TZ+Math.sin(a)*1.35;if(p===0)mb.geo(GEO.cyl16,mtx(sx,.5,sz,.22,.08,.22),velvet);mb.geo(GEO.cyl16,mtx(TX+Math.cos(a)*.55,.821,TZ+Math.sin(a)*.55,.13,.002,.13),C('#7a2434'))}
   box(TX-.45,3.62,TZ-.45,TX+.45,3.77,TZ+.45,C('#2a1838'));box(TX-.42,3.61,TZ-.42,TX+.42,3.62,TZ+.42,C('#ffe2b0'));box(TX-.01,3.77,TZ-.01,TX+.01,H,TZ+.01,C('#3a3030'));mb=mbC}
  addCol(X+15.5-.95,Z-1.8-.95,X+15.5+.95,Z-1.8+.95,'rock');
  for(const [a,b] of [[-2.8,-1.35],[1.35,2.8]])addCol(X+a,Z+5.88,X+b,Z+6.82,'rock');
  for(const [x,z] of [[-9.2,-6.1],[9.2,-6.1],[-9.3,5.9],[9.3,5.9],[-5.3,-18.3],[5.3,-18.3],[-20.3,-3.8],[-20.3,3.8],[20.3,.3],[20.3,-3.9]])addCol(X+x-.34,Z+z-.34,X+x+.34,Z+z+.34,'rock');
  // Cards, dealer trays and chip stacks on the actual playable tables.
  for(const x of [X-4.2,X+.7]){
   for(let j=0;j<3;j++){const xx=x-.75+j*.65;box(xx,.99,Z-1.2,xx+.3,1.004,Z-.78,stone);box(xx+.06,1.004,Z-1.13,xx+.12,1.012,Z-1.04,C(j%2?'#b44d5b':'#354454'))}
   box(x-.48,.99,Z-1.7,x+.48,1.045,Z-1.43,darkWood);
   for(let j=0;j<3;j++)for(let k=0;k<3;k++)addChip(x-.3+j*.3,1.06+k*.05,Z-1.56,['#ba4a61','#4e8ca6','#d3b567'][j]);
  }
  // Roulette model: wheel, alternating pockets, central spindle. Decoration only.
  mb.geo(GEO.cyl,mtx(X+4.5,1.025,Z+2.7,.68,.06,.68),brass);
  mb.geo(GEO.cyl,mtx(X+4.5,1.07,Z+2.7,.55,.03,.55),darkWood);
  for(let j=0;j<16;j++){const a=j*Math.PI/8;mb.geo(GEO.cyl,mtx(X+4.5+Math.sin(a)*.46,1.095,Z+2.7+Math.cos(a)*.46,.075,.03,.075),C(j%2?'#b24a55':'#30333d'))}
  box(X+4.46,1.085,Z+2.66,X+4.54,1.27,Z+2.74,brass);
  // Glasses, service register, mirrors and framed wall insets.
  box(X+7.65,1.16,Z+1.45,X+8.15,1.42,Z+1.85,darkWood);box(X+7.64,1.24,Z+1.5,X+7.65,1.38,Z+1.8,C('#76a6a4'));
  
  // Wall panels and cornice, avoiding door and machine displays.
  for(const sx of [-1,1])for(let z=Z-4.8;z<Z+5;z+=2.4){const O=sx<0?OPW:OPE;if(z+1.7>O[0]&&z<O[1])continue;const xx=X+sx*9.93;box(xx-.035,.15,z,xx+.035,.85,z+1.7,wood);box(xx-.045,.86,z,xx+.045,.92,z+1.7,brass);}
  for(const zz of [Z-D+.04,Z+D-.04]){box(X-W,3.82,zz-.035,X+W,3.94,zz+.035,wood);box(X-W,3.8,zz-.045,X+W,3.83,zz+.045,brass);}
  for(const[x0,z0,x1,z1] of [[X-W-.5,Z-D-.5,OPN[0],Z-D],[OPN[1],Z-D-.5,X+W+.5,Z-D],[X-W-.5,Z+D,X+W+.5,Z+D+.5],[X-W-.5,Z-D,X-W,OPW[0]],[X-W-.5,OPW[1],X-W,Z+D],[X+W,Z-D,X+W+.5,OPE[0]],[X+W,OPE[1],X+W+.5,Z+D],
   [WN.x0-.5,WN.z0-.5,WN.x1+.5,WN.z0],[WN.x0-.5,WN.z0,WN.x0,WN.z1],[WN.x1,WN.z0,WN.x1+.5,WN.z1],[WW.x0-.5,WW.z0-.5,WW.x1,WW.z0],[WW.x0-.5,WW.z1,WW.x1,WW.z1+.5],[WW.x0-.5,WW.z0,WW.x0,WW.z1],[WE.x0,WE.z0-.5,WE.x1+.5,WE.z0],[WE.x0,WE.z1,WE.x1+.5,WE.z1+.5],[WE.x1,WE.z0,WE.x1+.5,WE.z1]])addCol(x0,z0,x1,z1,'rock');
  /* cascas das 3 alas: piso xadrez, paredes, teto, rodapé e friso dourado */
  for(const[k,R,cl] of [['N',WN,'#2a1a40'],['W',WW,'#1f2a20'],['E',WE,'#2e1a34']]){const M=WG[k],f1=C(cl),f2=C('#341c3f');for(let x=Math.floor(R.x0);x<R.x1;x++)for(let z=Math.floor(R.z0);z<R.z1;z++){const x0=Math.max(x,R.x0),x1=Math.min(x+1,R.x1),z0=Math.max(z,R.z0),z1=Math.min(z+1,R.z1);M.quad([x0,0,z1],[x1,0,z1],[x1,0,z0],[x0,0,z0],0,1,0,[0,0,1,1],((x+z)&1)?f1:f2)}
   const cx=(R.x0+R.x1)/2,cz=(R.z0+R.z1)/2,wl=(a,b,c,d,col,ref)=>M.qa(a,b,c,d,col,ref);
   wl([R.x0,0,R.z0],[R.x1,0,R.z0],[R.x1,H,R.z0],[R.x0,H,R.z0],wall1,[cx,1,R.z0-9]);
   if(k!=='N')wl([R.x0,0,R.z1],[R.x1,0,R.z1],[R.x1,H,R.z1],[R.x0,H,R.z1],wall1,[cx,1,R.z1+9]);
   if(k!=='E')wl([R.x0,0,R.z0],[R.x0,0,R.z1],[R.x0,H,R.z1],[R.x0,H,R.z0],wall2,[R.x0-9,1,cz]);if(k!=='W')wl([R.x1,0,R.z0],[R.x1,0,R.z1],[R.x1,H,R.z1],[R.x1,H,R.z0],wall2,[R.x1+9,1,cz]);
   M.qa([R.x0,H,R.z0],[R.x1,H,R.z0],[R.x1,H,R.z1],[R.x0,H,R.z1],C('#1a0a20'),[cx,H+9,cz]);
   for(const[a,b,c,d] of k==='N'?[[R.x0,R.z0,R.x1,R.z0+.06],[R.x0,R.z0,R.x0+.06,R.z1],[R.x1-.06,R.z0,R.x1,R.z1]]:k==='W'?[[R.x0,R.z0,R.x1,R.z0+.06],[R.x0,R.z1-.06,R.x1,R.z1],[R.x0,R.z0,R.x0+.06,R.z1]]:[[R.x0,R.z0,R.x1,R.z0+.06],[R.x0,R.z1-.06,R.x1,R.z1],[R.x1-.06,R.z0,R.x1,R.z1]]){ibox(M,a,0,b,c,.14,d,gold);ibox(M,a,H-.5,b,c,H-.35,d,gold)}}CAS.exitCasino={x:X,z:Z+D-.9}}
 // v272: close casino geometry before constructing the club, so only the active establishment is drawn.
 {const W0=CAS.wings,lt=(R,n)=>{const o=[];const nx=n[0],nz=n[1];for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)o.push([R.x0+(i+.5)*(R.x1-R.x0)/nx,H-.6,R.z0+(j+.5)*(R.z1-R.z0)/nz]);return o};
  g.add(CAS.wgN.mesh(roomLitMat({x0:W0.N.x0,z0:W0.N.z0,x1:W0.N.x1,z1:W0.N.z1+2.4,H,lights:lt(W0.N,[2,3]),warm:'#ffb0e0',amb:.6,pow:.85,rad:6.5})));g.add(CAS.wgW.mesh(roomLitMat({x0:W0.W.x0,z0:W0.W.z0,x1:W0.W.x1+2.4,z1:W0.W.z1,H,lights:[[W0.W.x0+5.5,H-.6,CZ],[W0.W.x0+2,H-.6,CZ-2.5],[W0.W.x0+2,H-.6,CZ+2.5],[W0.W.x1-1.5,H-.6,CZ]],warm:'#ffd9a0',amb:.55,pow:.9,rad:6})));g.add(CAS.wgE.mesh(roomLitMat({x0:W0.E.x0-2.4,z0:W0.E.z0,x1:W0.E.x1,z1:W0.E.z1,H,lights:[[CX+15.5,H-.6,CZ-1.8],[CX+12,H-.6,CZ-1.8],[CX+19,H-.6,CZ-1.8]],warm:'#ffc070',amb:.58,pow:.9,rad:6})))}
 const casinoObjectCount=g.children.length;g.add(mb.mesh(roomLitMat({x0:CX-12.4,z0:CZ-9.4,x1:CX+12.4,z1:CZ+7,H,lights:[[CX-4.8,H-.6,CZ-1.9],[CX,H-.6,CZ-1.2],[CX+4.8,H-.6,CZ-1.9],[CX-3.4,H-.6,CZ+2.2],[CX+3.4,H-.6,CZ+2.2],[CX-8,H-.6,CZ+3.5],[CX+8,H-.6,CZ+3.5]],warm:'#ffc070',amb:.58,pow:.85,rad:6.5})));mb=new MB();
 // club interior
 {const X=BX,Z=BZ,W=10,D=7;const floorA=C('#1b1230'),floorB=C('#281843'),wallA=C('#efe5dc'),wallB=C('#d8cabb'),pink=C('#ff53d1'),cyan=C('#67efff');for(let x=X-W;x<X+W;x++)for(let z=Z-D;z<Z+D;z++){let cc=((x+z)&1)?floorA:floorB;if(Math.abs(x-X)<3.2&&Math.abs(z-Z)<2.5)continue;mb.quad([x,0,z+1],[x+1,0,z+1],[x+1,0,z],[x,0,z],0,1,0,[0,0,1,1],cc)}mb.qa([X-W,0,Z-D],[X+W,0,Z-D],[X+W,H,Z-D],[X-W,H,Z-D],wallA,[X,1,Z-D-9]);mb.qa([X-W,0,Z+D],[X+W,0,Z+D],[X+W,H,Z+D],[X-W,H,Z+D],wallA,[X,1,Z+D+9]);mb.qa([X-W,0,Z-D],[X-W,0,Z+D],[X-W,H,Z+D],[X-W,H,Z-D],wallB,[X-W-9,1,Z]);mb.qa([X+W,0,Z-D],[X+W,0,Z+D],[X+W,H,Z+D],[X+W,H,Z-D],wallB,[X+W+9,1,Z]);mb.qa([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],C('#140d20'),[X,H+9,Z]);ibox(mb,X-W,H-.5,Z-D,X+W,H-.35,Z-D+.06,pink);ibox(mb,X-W,0,Z-D,X+W,.14,Z-D+.06,pink);ibox(mb,X-W,0,Z+D-.06,X+W,.14,Z+D,pink);ibox(mb,X-W,0,Z-D,X-W+.06,H,Z+D,C('#6f4860'));ibox(mb,X+W-.06,0,Z-D,X+W,H,Z+D,C('#6f4860'));ibox(mb,X-1.0,0,Z-D,X+1.0,2.4,Z-D+.06,C('#120a18'));
  // v78: base escura da pista de LED (os ladrilhos animados ficam 6 mm acima; antes o "xadrez" saía todo rosa)
  mb.quad([X-3,0,Z+3],[X+3,0,Z+3],[X+3,0,Z-2],[X-3,0,Z-2],0,1,0,[0,0,1,1],C('#0b0712'));
  ibox(mb,X-8.6,0,Z+D-2.65,X+8.6,.7,Z+D-.55,C('#4a1d66'));ibox(mb,X-8.7,.7,Z+D-2.72,X+8.7,.8,Z+D-.48,pink);ibox(mb,X-8.8,.8,Z+D-.6,X+8.8,3.35,Z+D-.42,C('#2f153d'));ibox(mb,X-8.0,2.75,Z+D-.66,X+8.0,3.1,Z+D-.6,cyan);
  // Counter has a real service aisle instead of a solid block enclosing the bartender.
  const B=(a,b,c,d,e,f,h)=>ibox(mb,X+a,b,Z+c,X+d,e,Z+f,C(h));
  const solid=(a,c,d,f)=>addCol(X+a,Z+c,X+d,Z+f,'rock');
  B(-6.42,0,1.35,-5.95,1.02,4.5,'#63404e');B(-6.52,1.02,1.24,-5.8,1.14,4.6,'#b794a8');
  B(-5.94,.17,1.4,-5.91,.23,4.44,'#c8a571');B(-5.94,.8,1.4,-5.91,.86,4.44,'#ac749a');solid(-6.52,1.24,-5.8,4.6);
  B(-9.7,0,1.35,-9.1,1.0,4.4,'#493644');solid(-9.7,1.35,-9.1,4.4);
  for(const y of [1.05,1.8,2.55]){B(-9.78,y,1.3,-9.08,y+.08,4.45,'#8e728a');for(let k=0;k<6;k++){const z=1.5+k*.46;B(-9.45,y+.08,z,-9.22,y+.4,z+.2,k%2?'#5b9c92':'#b37e63');B(-9.4,y+.4,z+.05,-9.27,y+.53,z+.15,'#c1b07d')}}
  for(const z of [1.65,2.1,3.65,4.1]){B(-6.32,1.14,z,-6.14,1.4,z+.18,'#b6cdd1');B(-6.29,1.4,z+.03,-6.17,1.42,z+.15,'#cd9a76')}
  addPanel('MALIBU FLASH',X,3.25,Z-D+.12,0,5.2,.92,'#140d20','#67efff','dance floor · flashback fm');addPanel('BAR',X-W+.1,3.72,Z+2.88,Math.PI/2,1.9,.55,'#183224','#fff0b4','bebidas'); /* v79r2: placa do bar acima da estante de garrafas (antes ficava atrás delas) */addPanel('PALCO',X-8.7,2.15,Z+D-1.58,Math.PI/2,1.65,.42,'#231227','#fff0b4','flashback fm');
  // v78: os 4 lustres-bola (esferas de 46 cm em MeshBasic) saíram; a luz vem do globo espelhado e dos refletores.
  // v78: caixas de som coladas na parede lateral, viradas para a pista, no material iluminado do salão.
  for(const[sx,sz] of [[-1,-D+1.0],[1,-D+1.0],[-1,-1.6],[1,1.2]]){const wx=X+sx*(W-.06),ix=wx-sx*.42,zc=Z+sz;
   ibox(mb,Math.min(wx,ix),1.35,zc-.26,Math.max(wx,ix),2.45,zc+.26,C('#141418'));
   for(const[y,r] of [[1.68,.15],[2.17,.09]]){mb.geo(GEO.cyl,mtx(ix-sx*.012,y,zc,r,.03,r,0,0,Math.PI/2),C('#3a3f4a'));mb.geo(GEO.cyl,mtx(ix-sx*.02,y,zc,r*.45,.03,r*.45,0,0,Math.PI/2),C('#5cecff'))}}
  // v78: plantas proporcionais (vaso 42 cm + 7 folhas), no material iluminado do salão.
  for(const p of [[X-8.8,Z-2.9],[X+8.8,Z-2.9],[X-8.8,Z-.1],[X+8.8,Z-4.3]]){mb.geo(GEO.cyl,mtx(p[0],.21,p[1],.27,.42,.27),C('#5a3c2a'));mb.geo(GEO.cyl,mtx(p[0],.43,p[1],.3,.04,.3),C('#7a5538'));
   for(let k=0;k<7;k++){const a=k/7*6.283+p[0],lean=.35+(k%3)*.12,len=.62+(k%2)*.18,dx=Math.sin(lean)*Math.cos(a),dy=Math.cos(lean),dz=Math.sin(lean)*Math.sin(a);
    mb.geo(GEO.box,mtx(p[0]+dx*len/2,.45+dy*len/2,p[1]+dz*len/2,.05,len,.17,0,-a,-lean),C(k%2?'#2f7a3c':'#3f9448'))}
   mb.geo(GEO.ico,mtx(p[0],.62,p[1],.16,.2,.16),C('#2c6b36'))}
  // Banquettes and cocktail tables stay outside the central dance area and exit aisle.
  for(const z of [-.3,2.3]){
   B(8.3,0,z-.75,9.65,.22,z+.75,'#34313f');B(8.3,.22,z-.75,9.65,.62,z+.75,'#805477');B(9.42,.62,z-.75,9.7,1.24,z+.75,'#9a6b8b');solid(8.3,z-.75,9.7,z+.75);
   B(7.15,.68,z-.38,7.95,.78,z+.38,'#a9869d');B(7.48,0,z-.08,7.62,.68,z+.08,'#69777e');solid(7.15,z-.38,7.95,z+.38);
   B(7.44,.78,z-.08,7.58,1.0,z+.06,'#b7c9cf');
  }
  // DJ equipment behind stage dancers; existing spawn positions stay clear.
  B(-1.6,.8,5.87,1.6,1.55,6.35,'#282634');B(-1.7,1.55,5.82,1.7,1.65,6.38,'#6c566f');
  for(const x of [-.95,.95]){mb.geo(GEO.cyl,mtx(X+x,1.68,Z+6.05,.3,.05,.3),C('#191e2a'));mb.geo(GEO.cyl,mtx(X+x,1.71,Z+6.05,.11,.015,.11),C('#b5a5b8'))}
  for(let i=0;i<5;i++){B(-.3+i*.13,1.65,5.88,-.25+i*.13,1.7,6.17,'#c7b6c7');B(-.3+i*.13,1.7,6.05,-.25+i*.13,1.74,6.1,i%2?'#78c7cf':'#d995c1')}
  // Stage monitors, subwoofer cabinets, cable covers and wall mounts.
  for(const x of [-7.7,7.7]){B(x-.42,.8,5.1,x+.42,1.75,5.85,'#272937');B(x-.33,.89,5.06,x+.33,1.64,5.1,'#49505e');for(let y=1;y<1.6;y+=.12)B(x-.27,y,5.045,x+.27,y+.025,5.06,'#252833')}
  // Ceiling trusses and small light fixtures: color without extra shadow-casting lights.
  for(const z of [-3.1,3.65]){B(-8,3.88,z-.06,8,3.96,z+.06,'#676374');B(-8,3.62,z-.06,8,3.69,z+.06,'#676374');for(let x=-8;x<=8;x+=2){B(x-.03,3.65,z-.06,x+.03,3.93,z+.06,'#676374');B(x-.14,3.38,z-.14,x+.14,3.63,z+.14,'#36313f');B(x-.11,3.36,z-.11,x+.11,3.38,z+.11,x%4?'#d78bbd':'#89cbd4')}}
  for(const x of [-9.85,9.85])for(let z=-5.3;z<5;z+=2.1){B(x-.035,.22,z,x+.035,1.55,z+1.7,'#594357');B(x-.045,1.56,z,x+.045,1.63,z+1.7,'#aa849c')}
  for(const [x,z] of [[-8.8,-2.9],[8.8,-2.9],[-8.8,-.1],[8.8,-4.3]])solid(x-.34,z-.34,x+.34,z+.34);
  // v78 · efeitos da pista (animados em clubInteriorTick): LED 12×10, globo espelhado com pontos de luz,
  // 6 refletores móveis na treliça (feixe + círculo no chão) e névoa baixa de máquina de fumaça.
  {const FX=CAS.clubFx={},o3=new THREE.Object3D(),add=m=>{m.frustumCulled=false;addObj(m);return m};
   const led=add(new THREE.InstancedMesh(new THREE.PlaneGeometry(.46,.46).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff}),120));FX.led=led;FX.tiles=[];
   for(let i=0,k=0;i<12;i++)for(let j=0;j<10;j++,k++){o3.position.set(X-3+.25+i*.5,.006,Z-2+.25+j*.5);o3.updateMatrix();led.setMatrixAt(k,o3.matrix);led.setColorAt(k,C('#221133'));FX.tiles.push({i,j,u:(i-5.5)/6,v:(j-4.5)/5})}
   const by=3.05;FX.ballC=new THREE.Vector3(X,by,Z+.5);
   const bg=new THREE.IcosahedronGeometry(.34,2).toNonIndexed(),bn=bg.attributes.position.count,bc=new Float32Array(bn*3);
   for(let f=0;f<bn;f+=3){const v=.35+Math.random()*.6;for(let q=0;q<3;q++)bc.set([v,v,v*1.06],(f+q)*3)}bg.setAttribute('color',new THREE.BufferAttribute(bc,3));
   FX.ball=add(new THREE.Mesh(bg,new THREE.MeshBasicMaterial({vertexColors:true})));FX.ball.position.copy(FX.ballC);FX.ballCol=bc;FX.ballBase=bc.slice();
   mb.geo(GEO.cyl,mtx(X,(H+by+.34)/2,Z+.5,.015,H-by-.34,.015),C('#3a3a40'));
   FX.spot=add(new THREE.InstancedMesh(new THREE.CircleGeometry(.07,8),new THREE.MeshBasicMaterial({color:0xfff4fb,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}),48));FX.spotDirs=[];
   for(let i=0;i<48;i++){const u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);FX.spotDirs.push(new THREE.Vector3(r*Math.cos(a),u*.85-.2,r*Math.sin(a)).normalize())}
   const beamG=new THREE.CylinderGeometry(.05,.55,1,16,1,true);beamG.translate(0,-.5,0);
   FX.beam=add(new THREE.InstancedMesh(beamG,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),6));
   FX.pool=add(new THREE.InstancedMesh(new THREE.CircleGeometry(.6,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,blending:THREE.AdditiveBlending,depthWrite:false}),6));
   FX.heads=[[-6,-3.1],[-2,-3.1],[2,-3.1],[6,-3.1],[-4,3.65],[4,3.65]].map(([dx,dz],i)=>{FX.beam.setColorAt(i,C('#ffffff'));FX.pool.setColorAt(i,C('#ffffff'));return{x:X+dx,z:Z+dz,y:3.34,ph:i*1.13}});
   const hc=document.createElement('canvas');hc.width=hc.height=128;const hg=hc.getContext('2d'),gr=hg.createRadialGradient(64,64,4,64,64,64);
   gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.5,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');hg.fillStyle=gr;hg.fillRect(0,0,128,128);
   const ht=new THREE.CanvasTexture(hc);FX.haze=[];
   for(let i=0;i<9;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ht,color:i%2?0xb48cff:0xff9ad8,transparent:true,opacity:.11,depthWrite:false}));const s0=3.5+Math.random()*2.5;sp.scale.set(s0,s0*.55,1);addObj(sp);
    FX.haze.push({sp,x0:X+(Math.random()*2-1)*6.5,z0:Z+(Math.random()*2-1)*4.2+.6,y0:.45+Math.random()*.55,ph:Math.random()*6.28})}
  }
  addPanel('SAÍDA',X,2.62,Z-D+.10,0,1.5,.36,'#254a43','#e2e6cf');
  for(const[x0,z0,x1,z1] of [[X-W-.5,Z-D-.5,X+W+.5,Z-D],[X-W-.5,Z+D,X+W+.5,Z+D+.5],[X-W-.5,Z-D,X-W,Z+D],[X+W,Z-D,X+W+.5,Z+D],[X-8.8,Z+D-2.72,X+8.8,Z+D-.42]])addCol(x0,z0,x1,z1,'rock');CAS.bar={x:X-6.9,z:Z+2.95};CAS.exitClub={x:X,z:Z-D+.9}}
 g.add(mb.mesh(roomLitMat({x0:BX-10,z0:BZ-7,x1:BX+10,z1:BZ+7,H,lights:[[BX-6.6,H-.6,BZ-1.6],[BX-3.8,H-.6,BZ+1.0],[BX+3.4,H-.6,BZ-1.8],[BX+7.2,H-.6,BZ+1.2],[BX,H-.6,BZ+4.5],[BX-7.5,H-.6,BZ+3]],warm:'#ffa8c8',amb:.46,pow:.85,rad:6.5})));
 const casinoScene=new THREE.Group(),clubScene=new THREE.Group();
 for(const [i,obj] of g.children.slice().entries()){g.remove(obj);(i<=casinoObjectCount?casinoScene:clubScene).add(obj)}
 g.add(casinoScene,clubScene);CAS.casinoScene=casinoScene;CAS.clubScene=clubScene;
 CAS.arrIn=makeArrow();CAS.arrIn.position.set(CX,1.5,CZ+7-.9);CAS.arrIn.visible=false;CAS.arrClubIn=makeArrow();CAS.arrClubIn.position.set(BX,1.5,BZ-7+.9);CAS.arrClubIn.visible=false}
// v78 · animação dos efeitos da pista da Malibu Flash (só roda com o palco 'club' ativo). Batida ~124 bpm.
const CLUB_PAL=['#ff3ec8','#3ee8ff','#9a5bff','#ffd23e','#3eff9a'].map(h=>new THREE.Color(h)),CLUB_DOWN=new THREE.Vector3(0,-1,0),CLUB_O3=new THREE.Object3D(),CLUB_V=new THREE.Vector3(),CLUB_C=new THREE.Color();
function clubInteriorTick(dt){const F=CAS.clubFx,B=CAS.clubBase;if(!F||!B||!CAS.clubScene||!CAS.clubScene.visible)return;
 const t=simT,beat=t/.484,b=Math.floor(beat),bf=beat-b,o=CLUB_O3,v=CLUB_V,P=CLUB_PAL,sc=Math.floor(b/8)%P.length;
 // seta de saída: some só enquanto a câmera está colada nela (na entrada ela tapava metade da tela)
 if(CAS.arrClubIn)CAS.arrClubIn.visible=camera.position.distanceTo(CAS.arrClubIn.position)>2.2;
 // pista de LED: padrão novo a cada batida (xadrez, onda do centro, brilho aleatório), pulso de brilho entre batidas
 if(F._b!==b){F._b=b;const mode=Math.floor(b/16)%3,cA=P[sc],cB=P[(sc+2)%P.length];
  for(let k=0;k<F.tiles.length;k++){const q=F.tiles[k];const w=mode===0?(((q.i>>1)+(q.j>>1)+b)&1):mode===1?(Math.floor(Math.hypot(q.u,q.v)*4-b)&1):(Math.random()<.3?1:0);
   CLUB_C.copy(w?cA:cB).multiplyScalar(w?.95:.3);F.led.setColorAt(k,CLUB_C)}F.led.instanceColor.needsUpdate=true}
 F.led.material.color.setScalar(.7+.3*(1-bf));
 // globo: gira e cintila
 F.ball.rotation.y=t*.6;F._sp=(F._sp||0)-dt;if(F._sp<=0){F._sp=.08;const c=F.ballCol;c.set(F.ballBase);for(let n=0;n<14;n++){const f=Math.floor(Math.random()*c.length/9)*9;for(let q=0;q<9;q++)c[f+q]=1}F.ball.geometry.attributes.color.needsUpdate=true}
 // pontos de luz do globo nas paredes, teto e chão (raio do centro do globo até a caixa do salão)
 const C0=F.ballC,ca=Math.cos(t*.6),sa=Math.sin(t*.6),xm=B.x-9.92,xM=B.x+9.92,zm=B.z-6.92,zM=B.z+6.92;
 for(let i=0;i<F.spotDirs.length;i++){const d=F.spotDirs[i],dx=d.x*ca-d.z*sa,dz=d.x*sa+d.z*ca,dy=d.y;let tt=1e9,nx=0,ny=0,nz=0,q;
  if(dx>0&&(q=(xM-C0.x)/dx)<tt){tt=q;nx=-1;ny=0;nz=0}else if(dx<0&&(q=(xm-C0.x)/dx)<tt){tt=q;nx=1;ny=0;nz=0}
  if(dz>0&&(q=(zM-C0.z)/dz)<tt){tt=q;nx=0;ny=0;nz=-1}else if(dz<0&&(q=(zm-C0.z)/dz)<tt){tt=q;nx=0;ny=0;nz=1}
  if(dy>0&&(q=(4.19-C0.y)/dy)<tt){tt=q;nx=0;ny=-1;nz=0}else if(dy<0&&(q=(.014-C0.y)/dy)<tt){tt=q;nx=0;ny=1;nz=0}
  o.position.set(C0.x+dx*tt,C0.y+dy*tt,C0.z+dz*tt);v.set(o.position.x+nx,o.position.y+ny,o.position.z+nz);o.scale.set(1,1,1);o.lookAt(v);o.updateMatrix();F.spot.setMatrixAt(i,o.matrix)}
 F.spot.instanceMatrix.needsUpdate=true;
 // refletores móveis: alvo no chão da pista varrendo em elipses defasadas; feixe estica até o chão
 for(let i=0;i<F.heads.length;i++){const h=F.heads[i],tx=B.x+2.8*Math.sin(t*.9+h.ph),tz=B.z+.3+2.2*Math.cos(t*.7+h.ph*1.7);
  v.set(tx-h.x,-h.y,tz-h.z);const L=v.length();v.divideScalar(L);
  o.position.set(h.x,h.y,h.z);o.quaternion.setFromUnitVectors(CLUB_DOWN,v);o.scale.set(1,L,1);o.updateMatrix();F.beam.setMatrixAt(i,o.matrix);
  o.position.set(tx,.016,tz);o.quaternion.identity();o.scale.set(1,1,1);o.updateMatrix();F.pool.setMatrixAt(i,o.matrix);
  const c=P[(sc+i)%P.length];F.beam.setColorAt(i,c);F.pool.setColorAt(i,c)}
 F.beam.instanceMatrix.needsUpdate=F.pool.instanceMatrix.needsUpdate=F.beam.instanceColor.needsUpdate=F.pool.instanceColor.needsUpdate=true;
 F.beam.material.opacity=.13+.09*(1-bf);
 // névoa baixa: deriva lenta
 for(const h of F.haze){h.sp.position.set(h.x0+Math.sin(t*.07+h.ph)*1.2,h.y0+Math.sin(t*.2+h.ph)*.12,h.z0+Math.cos(t*.06+h.ph)*.9);h.sp.material.opacity=.08+.04*Math.sin(t*.3+h.ph)}}
/* r57: show (palco) só depois das 22h (até 5h); de dia pista quase vazia, à noite antes das 22h pista média */
function clubShowOn(){const t=DN.tod||0;return t>=22*60||t<5*60}
function clubSpawnPeds(){if(CAS.clubPeds.length||!CAS.clubBase)return;const X=CAS.clubBase.x,Z=CAS.clubBase.z;const show=clubShowOn(),nDance=show?10:(DN.nightF||0)>.5?6:3;const makeClubPed=(x,z,pal,type,mx=0,mz=1)=>{const q=spawnPed(null,{x,z,vx:0,vz:0,pal:pal||pick2(PED_PALS)});if(!q)return null;q.state='clerk';q.fixed=true;q.at={x,z};q.mx=mx;q.mz=mz;q.timer=0;q.clubType=type;q.clubPh=Math.random()*6.283;q.jy=0;q.jv=0;q.clubCD=Math.random()*.5;CAS.clubPeds.push(q);return q};[[-3.2,-.7],[-1.9,-.9],[-.6,-.7],[.7,-.8],[2.0,-.75],[-3.0,.6],[-1.7,.72],[-.3,.68],[1.1,.62],[2.3,.7]].forEach((p,i)=>[0,7,3,5,9,1,8,2,6,4].indexOf(i)<nDance&&makeClubPed(X+p[0],Z+p[1],pick2(PED_PALS),'dance',i%2?1:-1,0));[[-5.8,5.0],[-3.0,4.95],[-.4,5.05],[2.5,4.95],[5.2,5.0]].forEach((p,i)=>show&&makeClubPed(X+p[0],Z+p[1],pick2(PED_PALS),'stage',0,1));CAS.bartender=makeClubPed(CAS.bar.x,CAS.bar.z,{...CLERK_PAL,cap:null,capDark:null,shirt:'#f4f0e8',stripe:'#6c3f24',long:true,hair:'#2a1a10'},'bar',1,0)}
function clubPedJumpTick(p,dt){
 // velocidade e gravidade iguais às do player (plJump / updatePlayer): jv=7.4 e g=16.
 // Não reimpulsionar mortos ou caídos: o sprite deve ficar no chão.
 if(p.state==='dead'||p.state==='down'||p.state==='lie'||!PL.inside||PL.inside!=='club'){
  p.jv=0;p.jy=0;return;
 }
 if(p.state!=='clerk'||p.clubType==='bar'){p.jv=0;p.jy=0;return}
 p.clubCD=(p.clubCD||0)-dt;
 // v78: pulos de balada, não de jogador: palco ~28 cm (jv 3,0), pista ~55 cm (jv 4,2).
 if((p.jy||0)<=0&&(p.jv||0)<=0&&p.clubCD<=0){p.jy=.001;p.jv=p.clubType==='stage'?3.0:4.2;p.clubCD=(p.clubType==='stage'?.10:.22)+(p.clubPh%1)*.23}
 if(p.jy>0||p.jv>0){p.jv-=16*dt;p.jy+=p.jv*dt;if(p.jy<=0){p.jy=0;p.jv=0}}
}
function clubClearPeds(){for(const q of CAS.clubPeds.slice())if(peds.includes(q))removePed(q);CAS.clubPeds=[];CAS.bartender=null}
function clubContextTick(){CTX.club=clubBarNear()}
function clubBarNear(){return !!(CAS.bar&&PL.inside==='club'&&!PL.car&&!PL.dead&&Math.hypot(PL.x-CAS.bar.x,PL.z-CAS.bar.z)<1.85)}
function clubAleyDrop(ref){const p=ref||city.casino&&city.casino.clubDoor||{x:PL.x,z:PL.z},pt=INVERT.portal;let best=null,bd=1e9;for(const q of city.catSpots||[]){if(q.residential)continue;const r=q.r,x=(r[0]+r[2])/2,z=(r[1]+r[3])/2,d=Math.hypot(x-p.x,z-p.z);if(d<35||d>220)continue;if(pt&&Math.hypot(pt.x-x,pt.z-z)<80)continue;if(pickups.some(k=>k.kind!=='hp'&&k.kind!=='cash'&&k.kind!=='armor'&&Math.hypot(k.x-x,k.z-z)<30))continue;if(d<bd){bd=d;best={x,z}}}return best||{x:p.x+26,z:p.z-18}}
function clubDrink(){if(DRUNK.coma>0)return;if((PL.money||0)<10){toast('DINHEIRO INSUFICIENTE · DRINK $10');clang(.1);return}money(-10);DRUNK.t=Math.min(95,DRUNK.t+24);DRUNK.ph+=.8;DRUNK.level=clamp(DRUNK.t/48,0,1);DRUNK.drinks=(DRUNK.drinks||0)+1;clang(.18);toast('DRINK · −$10<br><small style="font-size:11px;color:#fff">dose '+DRUNK.drinks+'/5</small>');if(CAS.bartender&&peds.includes(CAS.bartender))say(CAS.bartender,DRUNK.drinks>=5?'Ei, pega leve!':'Mais um flashback pra viagem?',2.4);if(DRUNK.drinks>=5)clubComa()}
function clubComa(){if(DRUNK.coma>0)return;DRUNK.coma=4.6;DRUNK.t=0;DRUNK.level=1;slotClose();tableGameClose();sceneRadioFade(.55);PL.hp=Math.max(1,Math.round((PL.hp||100)-15));PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.rot=Math.PI/2;PL.down=Math.max(PL.down,DRUNK.coma+.2);$('#ko').textContent='COMA ALCOÓLICO';$('#ko').hidden=false;toast('<span style="color:#ffd27a">COMA ALCOÓLICO</span><br><small style="font-size:11px;color:#fff">−15 VIDA · apaguei total…</small>')}
function clubWake(){const K=city.casino||{},best=clubAleyDrop(K.clubDoor||K.door);fadeFlash();PL.inside=false;DOOR.from=null;PL.dead=false;PL.x=best.x;PL.z=best.z;PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.down=0;PL.rot=0;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x,PL.gy+2.4,PL.z+3);if(CAS.grp)CAS.grp.visible=false;if(CAS.arrIn)CAS.arrIn.visible=false;if(CAS.arrClubIn)CAS.arrClubIn.visible=false;slotClose();tableGameClose();clubClearPeds();sceneRadioStop();DRUNK.coma=0;DRUNK.drinks=0;DRUNK.t=9.6;DRUNK.level=.2/* v78: com t=0 o nível .2 nunca decaía (balanço eterno); agora ressaca some em ~17 s */;document.body.classList.remove('ko-grayscale');$('#ko').hidden=true;$('#ko').textContent='NOCAUTE';toast('COMA ALCOÓLICO<br><small style="font-size:11px;color:#fff">você acordou largado num beco aleatório</small>')}
function casinoEnter(kind='casino'){if(POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');CAS.lock=1.5;return}if(!storyOK('casino')){storyLocked(kind==='club'?'DANCETERIA FECHADA':'CASSINO FECHADO');CAS.lock=2;return}if(!CAS.grp)casinoBuild();const K=city.casino,door=kind==='club'?K.clubDoor:K.door,nrm=kind==='club'?(K.clubNrm||[0,-1]):(K.nrm||[0,1]);fadeFlash();doorEnter(kind,kind,{x:door.x+nrm[0]*1.2,z:door.z+nrm[1]*1.2},nrm);PL.inside=kind;CAS.entry=kind;CAS.grp.visible=true;CAS.casinoScene.visible=kind==='casino';CAS.clubScene.visible=kind==='club';CAS.arrIn.visible=kind==='casino';CAS.arrClubIn.visible=kind==='club';CAS.lock=1;const exit=kind==='club'?CAS.exitClub:CAS.exitCasino;PL.x=exit.x;PL.z=exit.z+(kind==='club'?1.5:-1.1);PL.vx=PL.vz=0;PL.face=[0,kind==='club'?1:-1];PL.yaw=kind==='club'?Math.PI:0;if(camMode==='fps')chasePos.set(PL.x,2.4,PL.z+(kind==='club'?-3:3));camT.x=PL.x;camT.z=PL.z;for(const q of peds.slice())if(!q.fixed)removePed(q);if(kind==='club'){casPedsClear();diceNpcsClear();clubSpawnPeds();sceneRadioStart('club');toast('DANCETERIA MALIBU FLASH')}else{clubClearPeds();casPedsSpawn();diceNpcsSpawn();sceneRadioStop();toast('CASSINO SUNSET ROYALE')}}
function casinoExit(kind){const K=city.casino,mode=kind||CAS.entry||'casino',door=mode==='club'?K.clubDoor:K.door,nrm=mode==='club'?(K.clubNrm||[0,-1]):(K.nrm||[0,1]);fadeFlash();PL.inside=false;doorExit({x:door.x+nrm[0]*1.2,z:door.z+nrm[1]*1.2,nx:nrm[0],nz:nrm[1]});CAS.lock=1.5;if(CAS.grp)CAS.grp.visible=false;if(CAS.arrIn)CAS.arrIn.visible=false;if(CAS.arrClubIn)CAS.arrClubIn.visible=false;slotClose();tableGameClose();poolClose();diceClose();casPedsClear();diceNpcsClear();clubClearPeds();sceneRadioFade(.7)}
function casinoTick(dt){const K=city.casino;if(!played||!K)return;CAS.lock=Math.max(0,CAS.lock-dt);if(!CAS.arrOut){CAS.arrOut=makeArrow();CAS.arrClubOut=makeArrow()}if(DRUNK.t>0&&DRUNK.coma<=0){DRUNK.t=Math.max(0,DRUNK.t-dt*.55);DRUNK.ph+=dt*(1.8+DRUNK.level*1.7);DRUNK.level=clamp(DRUNK.t/48,0,1);if(DRUNK.t<=0){DRUNK.drinks=0;DRUNK.level=0}}else DRUNK.ph+=dt*.7;if(DRUNK.coma>0){DRUNK.coma=Math.max(0,DRUNK.coma-dt);PL.down=Math.max(PL.down,DRUNK.coma+.05);if(DRUNK.coma<=0)clubWake()}if(CAS.clubPeds.length){for(const q of CAS.clubPeds){if(!peds.includes(q))continue;if(q.clubType==='bar'){q.jy=0;q.mx=1;q.mz=0;continue}if(q.state!=='clerk'){q.jy=0;q.jv=0;continue}if(q.clubType==='stage'){// v78: coreografia sincronizada (estilo Village People): todos mudam de lado juntos a cada 2 batidas (~124 bpm);
// passo 6 espelhado (metade p/ cada lado) e passo 7 de costas. Frente = para a pista (−z). Antes ficavam de costas (+z).
const st=Math.floor(simT/.968)%8,k=CAS.clubPeds.filter(r=>r.clubType==='stage').indexOf(q);const F=[[0,-1],[0,-1],[-1,0],[1,0],[0,-1],[0,-1],[k%2?1:-1,0],[0,1]][st];q.mx=F[0];q.mz=F[1]}else{q.mx=Math.sin(simT*1.8+q.clubPh);q.mz=Math.cos(simT*1.5+q.clubPh)*.2+.8}}}
 CAS.arrOut.position.set(K.door.x,1.5+Math.sin(simT*3)*.18,K.door.z+.6);CAS.arrOut.rotation.y=simT*1.8;CAS.arrOut.visible=!PL.inside&&storyOK('casino')&&Math.hypot(PL.x-K.door.x,PL.z-K.door.z)<160;CAS.arrClubOut.position.set(K.clubDoor.x,1.5+Math.sin(simT*3+.9)*.18,K.clubDoor.z-.6);CAS.arrClubOut.rotation.y=simT*1.8;CAS.arrClubOut.visible=!PL.inside&&storyOK('casino')&&Math.hypot(PL.x-K.clubDoor.x,PL.z-K.clubDoor.z)<160;if(CAS.arrIn&&CAS.arrIn.visible){CAS.arrIn.position.y=1.5+Math.sin(simT*3)*.18;CAS.arrIn.rotation.y=simT*1.8}if(CAS.arrClubIn&&CAS.arrClubIn.visible){CAS.arrClubIn.position.y=1.5+Math.sin(simT*3+.8)*.18;CAS.arrClubIn.rotation.y=simT*1.8}
 if(PL.dead||PL.car||CAS.lock>0)return;if(!PL.inside&&Math.hypot(PL.x-K.door.x,PL.z-K.door.z)<1.2)casinoEnter('casino');else if(!PL.inside&&Math.hypot(PL.x-K.clubDoor.x,PL.z-K.clubDoor.z)<1.2)casinoEnter('club');else if(PL.inside==='casino'&&CAS.exitCasino&&Math.hypot(PL.x-CAS.exitCasino.x,PL.z-CAS.exitCasino.z)<.8)casinoExit('casino');else if(PL.inside==='club'&&CAS.exitClub&&Math.hypot(PL.x-CAS.exitClub.x,PL.z-CAS.exitClub.z)<.8)casinoExit('club')}
function slotNear(){if(PL.inside!=='casino'||PL.car||PL.dead)return -1;return CAS.machines.findIndex(m=>Math.hypot(PL.x-m.x,PL.z-m.z)<1.3)}

// v273: SUNSET ROYALE — jogos de mesa com dinheiro exclusivamente virtual do PixelCity.
// Nenhum novo mesh, material, textura, updateTick ou alteracao no pipeline de sprites.
const TABLE_GAME={open:false,kind:null,phase:'ready',bet:50,deck:[],player:[],dealer:[],holds:new Set(),msg:'',wager:0};
const tgLocale=(pt,en)=>S.lang==='en'?en:pt;
const tgCash=()=>'$'+Math.round(PL.money||0).toLocaleString(S.lang==='en'?'en-US':'pt-BR');
function casinoTableNear(){if(PL.inside!=='casino'||PL.car||PL.dead||!CAS.tables||!CAS.tables.length)return null;let best=null,dist=2.85;for(const t of CAS.tables){const d=Math.hypot(PL.x-t.x,PL.z-t.z);if(d<dist){best=t;dist=d}}return best}
function tgDeck(){const a=[];for(let s=0;s<4;s++)for(let r=2;r<=14;r++)a.push({r,s});for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function tgCardText(c){return (c.r===14?'A':c.r===13?'K':c.r===12?'Q':c.r===11?'J':String(c.r))+['♠','♥','♦','♣'][c.s]}
function tgBlackScore(a){let total=0,aces=0;for(const c of a){total+=(c.r===14?11:Math.min(10,c.r));if(c.r===14)aces++}while(total>21&&aces>0){total-=10;aces--}return total}
function tgPokerResult(a){if(a.length!==5)return {rank:0,pt:'',en:''};const rs=a.map(x=>x.r).sort((x,y)=>x-y),suited=a.every(x=>x.s===a[0].s),uniq=[...new Set(rs)];let straight=uniq.length===5&&(uniq[4]-uniq[0]===4);if(!straight&&uniq.join(',')==='2,3,4,5,14')straight=true;
 const counts=new Map();for(const r of rs)counts.set(r,(counts.get(r)||0)+1);const vals=[...counts.values()].sort((x,y)=>y-x),royal=suited&&straight&&rs.join(',')==='10,11,12,13,14';
 if(royal)return {rank:250,pt:'ROYAL FLUSH',en:'ROYAL FLUSH'};
 if(straight&&suited)return {rank:50,pt:'STRAIGHT FLUSH',en:'STRAIGHT FLUSH'};
 if(vals[0]===4)return {rank:25,pt:'QUADRA',en:'FOUR OF A KIND'};
 if(vals[0]===3&&vals[1]===2)return {rank:9,pt:'FULL HOUSE',en:'FULL HOUSE'};
 if(suited)return {rank:6,pt:'FLUSH',en:'FLUSH'};
 if(straight)return {rank:4,pt:'SEQUÊNCIA',en:'STRAIGHT'};
 if(vals[0]===3)return {rank:3,pt:'TRINCA',en:'THREE OF A KIND'};
 if(vals[0]===2&&vals[1]===2)return {rank:2,pt:'DOIS PARES',en:'TWO PAIR'};
 const highPair=[...counts].some(([r,n])=>n===2&&(r===14||r>=11));return highPair?{rank:1,pt:'PAR DE VALETE OU MAIOR',en:'JACKS OR BETTER'}:{rank:0,pt:'SEM COMBINAÇÃO',en:'NO WIN'};
}
function tgDrawCards(parent,cards,hidden=false){const el=$(parent);el.replaceChildren();for(let i=0;i<cards.length;i++){const c=cards[i],isBack=hidden&&i===1,canHold=TABLE_GAME.kind==='poker'&&TABLE_GAME.phase==='playing'&&parent==='#tgPlayer',b=document.createElement('button');b.type='button';b.className='tgCard'+(isBack?' back':(!isBack&&(c.s===1||c.s===2)?' red':''))+(TABLE_GAME.holds.has(i)&&canHold?' hold':'');// v77: carta com índice nos cantos e naipe grande no centro; carta nova entra virando (com atraso por posição)
  if(isBack){b.innerHTML='<span class="tgBackArt">✦</span>'}else{const rk=tgCardText(c).slice(0,-1),su=['♠','♥','♦','♣'][c.s];b.innerHTML=`<span class="tgIx">${rk}<i>${su}</i></span><span class="tgPip">${su}</span><span class="tgIx tgIx2">${rk}<i>${su}</i></span>`}
  {const key=parent+i,id=isBack?'back':tgCardText(c),seen=TABLE_GAME.seen||(TABLE_GAME.seen={});if(seen[key]!==id){seen[key]=id;b.classList.add('deal');b.style.animationDelay=(i*80)+'ms'}}
  b.disabled=!canHold;if(canHold)b.style.cursor='pointer';if(canHold){b.setAttribute('aria-pressed',String(TABLE_GAME.holds.has(i)));b.addEventListener('click',()=>{if(TABLE_GAME.holds.has(i))TABLE_GAME.holds.delete(i);else TABLE_GAME.holds.add(i);tableGameRender()});if(TABLE_GAME.holds.has(i)){const lab=document.createElement('span');lab.className='tgHold';lab.textContent=tgLocale('MANTER','HOLD');b.appendChild(lab)}}el.appendChild(b)}}
// v77: ROLETA europeia (0–36) na mesma janela das mesas. Aposta em cor, par/ímpar, metade ou número exato.
const RL_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const RL_BETS=[['red','VERMELHO','RED','red'],['black','PRETO','BLACK','blk'],['even','PAR','EVEN',''],['odd','ÍMPAR','ODD',''],['low','1–18','1–18',''],['high','19–36','19–36',''],['num','NÚMERO','NUMBER','grn']];
const rlCol=n=>n===0?'grn':RL_RED.has(n)?'red':'blk';
const rlWins=(b,n,pick)=>b==='num'?n===pick:n!==0&&(b==='red'?RL_RED.has(n):b==='black'?!RL_RED.has(n):b==='even'?n%2===0:b==='odd'?n%2===1:b==='low'?n<=18:n>=19);
// roda europeia desenhada em 2D (canvas): 37 casas na ordem real, números, bola branca que perde velocidade e cai na casa
const RL_ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
function rlWheelDraw(cv,wa,ba,br,res){const g=cv.getContext('2d'),W=cv.width,c=W/2,R=W*.46,N=37,st=Math.PI*2/N;g.clearRect(0,0,W,W);
 g.fillStyle='#5a3418';g.beginPath();g.arc(c,c,R+W*.035,0,7);g.fill();g.fillStyle='#c59d56';g.beginPath();g.arc(c,c,R+W*.012,0,7);g.fill();
 for(let i=0;i<N;i++){const n=RL_ORDER[i],a0=wa+i*st-st/2;g.fillStyle=n===0?'#11883e':RL_RED.has(n)?'#b8202f':'#141418';g.beginPath();g.moveTo(c,c);g.arc(c,c,R,a0,a0+st);g.closePath();g.fill();
  g.strokeStyle='#c59d56';g.lineWidth=1;g.beginPath();g.moveTo(c+Math.cos(a0)*R*.62,c+Math.sin(a0)*R*.62);g.lineTo(c+Math.cos(a0)*R,c+Math.sin(a0)*R);g.stroke();
  g.save();g.translate(c+Math.cos(a0+st/2)*R*.86,c+Math.sin(a0+st/2)*R*.86);g.rotate(a0+st/2+Math.PI/2);g.fillStyle=res===n?'#ffd21a':'#fff';g.font=`700 ${Math.round(W*.045)}px Inter,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),0,0);g.restore()}
 g.fillStyle='#3a2416';g.beginPath();g.arc(c,c,R*.62,0,7);g.fill();g.fillStyle='#6a4426';g.beginPath();g.arc(c,c,R*.42,0,7);g.fill();
 g.strokeStyle='#e8c070';g.lineWidth=W*.02;for(let k=0;k<4;k++){const a=wa+k*Math.PI/2;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a)*R*.38,c+Math.sin(a)*R*.38);g.stroke()}g.fillStyle='#e8c070';g.beginPath();g.arc(c,c,W*.04,0,7);g.fill();
 const bx=c+Math.cos(ba)*br*R,by=c+Math.sin(ba)*br*R;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(bx+2,by+2,W*.026,0,7);g.fill();g.fillStyle='#fbfbf6';g.beginPath();g.arc(bx,by,W*.026,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(bx-W*.008,by-W*.008,W*.009,0,7);g.fill()}
function roulRender(){const t=TABLE_GAME,el=$('#tgPlayer');el.replaceChildren();if(t.rlBet==null)t.rlBet='red';if(t.rlPick==null)t.rlPick=7;
 if(!t.rlCv){t.rlCv=document.createElement('canvas');t.rlCv.width=t.rlCv.height=240;t.rlCv.className='rlWheel';t.rlA={wa:0,ba:-Math.PI/2,br:.93,res:-1}}el.append(t.rlCv);const A=t.rlA;rlWheelDraw(t.rlCv,A.wa,A.ba,A.br,A.res);
 if(t.phase==='spin')return
 const board=document.createElement('div');board.className='rlBoard';for(const [k,pt,en,c] of RL_BETS){const b=document.createElement('button');b.type='button';b.className='rlBtn '+c+(t.rlBet===k?' on':'');b.textContent=tgLocale(pt,en);b.setAttribute('aria-pressed',String(t.rlBet===k));b.addEventListener('click',()=>{t.rlBet=k;tableGameRender()});board.append(b)}
 if(t.rlBet==='num'){const inp=document.createElement('input');inp.type='number';inp.min='0';inp.max='36';inp.className='rlNum';inp.value=String(t.rlPick);inp.setAttribute('aria-label',tgLocale('número da aposta','bet number'));inp.addEventListener('change',()=>{t.rlPick=clamp(Math.round(+inp.value||0),0,36);inp.value=String(t.rlPick)});board.append(inp)}
 el.append(board)}
function roulSpin(){const t=TABLE_GAME;if(!t.open||t.phase==='spin')return;const bet=Number($('#tgBet').value)||50;if((PL.money||0)<bet){t.msg=tgLocale('DINHEIRO INSUFICIENTE','NOT ENOUGH MONEY');tableGameRender();return}
 t.bet=bet;t.wager=bet;gambleCharge(bet);t.phase='spin';t.msg=tgLocale('A bola está girando…','The ball is spinning…');const n=Math.floor(Math.random()*37),bt=t.rlBet,pk=t.rlPick;
 // animação: roda gira num sentido e a bola no outro; a bola desacelera, desce da pista para as casas, quica e para na casa sorteada
 tableGameRender();const A=t.rlA,w0=A.wa,b0=A.ba,dur=4600,st=Math.PI*2/37,idx=RL_ORDER.indexOf(n),wEnd=w0+Math.PI*2*(1.6+Math.random()*.8),bEnd=wEnd+idx*st-Math.PI*2*(4+Math.floor(Math.random()*2)),t0=performance.now();let lastPocket=-1;A.res=-1;
 const ease=x=>1-Math.pow(1-x,3);
 const frame=now=>{if(!t.open){t.phase='ready';return}const x=Math.min(1,(now-t0)/dur);A.wa=w0+(wEnd-w0)*ease(x);A.ba=b0+(bEnd-b0)*ease(x);
  const drop=x<.62?0:Math.min(1,(x-.62)/.3);A.br=.93-.2*drop+(drop>0&&drop<1?Math.abs(Math.sin(drop*Math.PI*3))*.035*(1-drop):0);
  if(x>.62){const p=Math.round(((A.ba-A.wa)/st)%37+37)%37;if(p!==lastPocket){lastPocket=p;clang(.02)}}
  rlWheelDraw(t.rlCv,A.wa,A.ba,A.br,-1);if(x<1){requestAnimationFrame(frame);return}A.ba=A.wa+idx*st;A.br=.73;A.res=n;t.rlShow=n;{
   const win=rlWins(bt,n,pk),mult=bt==='num'?36:2,cn=n===0?tgLocale('VERDE','GREEN'):RL_RED.has(n)?tgLocale('VERMELHO','RED'):tgLocale('PRETO','BLACK');
   t.phase='ready';tgFinish(win?t.wager*mult:0,(win?'VOCÊ GANHOU · ':'NÃO FOI DESSA VEZ · ')+n+' '+cn,(win?'YOU WIN · ':'NO LUCK · ')+n+' '+cn)}};
 requestAnimationFrame(frame)}
function tgBetOpts(){const t=TABLE_GAME,busy=t.phase==='playing'||t.phase==='spin';for(const o of $('#tgBet').options)o.disabled=!busy&&+o.value>(PL.money||0);if(!busy&&t.bet>(PL.money||0))t.bet=betFix(t.bet)}
function tableGameRender(){if(!TABLE_GAME.open)return;const t=TABLE_GAME,bj=t.kind==='bj',active=t.phase==='playing',ready=!active;
 if(t.kind==='roul'){const spin=t.phase==='spin';$('#tgTitle').textContent='SUNSET ROYALE · '+tgLocale('ROLETA','ROULETTE');$('#tgInfo').textContent=tgLocale('Escolha onde apostar e gire. O zero é verde e só paga no número exato.','Pick a bet and spin. Zero is green and only pays on an exact number bet.');
  $('#tgBetLabel').textContent=tgLocale('APOSTA','BET');$('#tgBet').disabled=spin;tgBetOpts();$('#tgBet').value=String(t.bet);$('#tgCash').textContent=tgLocale('SALDO ','BALANCE ')+tgCash();
  $('#tgDealerLabel').hidden=true;$('#tgDealer').hidden=true;$('#tgPlayerLabel').textContent=spin?tgLocale('GIRANDO…','SPINNING…'):t.phase==='done'?tgLocale('RESULTADO · NOVA APOSTA','RESULT · NEW BET'):tgLocale('SUA APOSTA','YOUR BET');roulRender();
  $('#tgDeal').hidden=spin;$('#tgDeal').textContent=tgLocale('GIRAR','SPIN');for(const id of ['#tgHit','#tgStand','#tgDouble','#tgDraw'])$(id).hidden=true;
  $('#tgClose').disabled=spin;$('#tgClose').textContent=tgLocale('SAIR [ESC]','EXIT [ESC]');$('#tgMsg').textContent=t.msg||tgLocale('Escolha a aposta e gire.','Choose a bet and spin.');
  $('#tgRules').textContent=tgLocale('Cor, par/ímpar ou metade: paga 2× · número exato: paga 36× · no zero, só o número 0 ganha.','Color, even/odd or half: pays 2× · exact number: pays 36× · on zero, only a 0 number bet wins.');return}
 $('#tgClose').disabled=false;
 $('#tgTitle').textContent=bj?'SUNSET ROYALE · BLACKJACK 21':'SUNSET ROYALE · VIDEOPÔQUER';
 $('#tgInfo').textContent=bj?tgLocale('Chegue a 21 sem ultrapassar. A banca para em 17.','Reach 21 without busting. Dealer stands on 17.'):tgLocale('Escolha as cartas para manter e troque as demais.','Hold cards and draw replacements.');
 $('#tgBetLabel').textContent=tgLocale('APOSTA','BET');$('#tgBet').disabled=active;tgBetOpts();$('#tgBet').value=String(t.bet);$('#tgCash').textContent=tgLocale('SALDO ','BALANCE ')+tgCash();
 $('#tgDealerLabel').hidden=!bj;$('#tgDealer').hidden=!bj;$('#tgDealerLabel').textContent=tgLocale('BANCA','DEALER')+(t.dealer.length?(!active?' · '+tgBlackScore(t.dealer):' · ?'):'');
 if(bj)tgDrawCards('#tgDealer',t.dealer,active);
 $('#tgPlayerLabel').textContent=tgLocale('SUAS CARTAS','YOUR CARDS')+(bj&&t.player.length?' · '+tgBlackScore(t.player):'');tgDrawCards('#tgPlayer',t.player);
 $('#tgDeal').hidden=!ready;$('#tgDeal').textContent=t.phase==='done'?tgLocale('JOGAR NOVAMENTE','PLAY AGAIN'):tgLocale('DAR CARTAS','DEAL');
 $('#tgHit').hidden=!(bj&&active);$('#tgHit').textContent=tgLocale('PEDIR','HIT');$('#tgStand').hidden=!(bj&&active);$('#tgStand').textContent=tgLocale('PARAR','STAND');
 $('#tgDouble').hidden=!(bj&&active&&t.player.length===2);$('#tgDouble').disabled=(PL.money||0)<t.wager;$('#tgDouble').textContent=tgLocale('DOBRAR','DOUBLE');
 $('#tgDraw').hidden=!(!bj&&active);$('#tgDraw').textContent=tgLocale('TROCAR','DRAW');
 $('#tgClose').textContent=active?tgLocale('SAIR · PERDER A APOSTA','LEAVE · FORFEIT BET'):tgLocale('SAIR [ESC]','EXIT [ESC]');
 $('#tgMsg').textContent=t.msg||tgLocale('Escolha a aposta e comece.','Select a bet and play.');
 if(!bj){tgPayTable()}else $('#tgRules').textContent=tgLocale('Vitória: 2× aposta · blackjack natural: 2,5× · empate: devolução.','Win: 2× bet · natural blackjack: 2.5× · push: refund.');if(false)$('#tgRules').textContent=tgLocale('Prêmios (multiplicador): Royal 250× · sequência de mesmo naipe 50× · quadra 25× · full house 9× · flush 6× · sequência 4× · trinca 3× · 2 pares 2× · par J+ 1×.','Payouts: Royal 250× · Straight Flush 50× · Four 25× · Full House 9× · Flush 6× · Straight 4× · Three 3× · Two Pair 2× · Jacks+ 1×.');
}
function tableGameOpen(kind){if(kind==='pool'){if(!POOL.on&&PL.inside==='casino'&&!PL.car&&!PL.dead)betAsk('SINUCA','Vencer paga 2× a aposta.',POOL.bet,v=>{POOL.bet=v;poolOpen()});return}if(kind==='dice'){if(!DICE.on&&PL.inside==='casino'&&!PL.car&&!PL.dead)betAsk("LIAR'S DICE",'Vencer paga 3× a aposta.',DICE.bet,v=>{DICE.bet=v;diceOpen()});return}if(TABLE_GAME.open||PL.inside!=='casino'||!['bj','poker','roul'].includes(kind))return;const t=TABLE_GAME;t.open=true;t.kind=kind;t.phase='ready';t.player=[];t.dealer=[];t.holds.clear();t.wager=0;t.msg='';for(const k in keys)keys[k]=false;GUN.firing=false;if(document.pointerLockElement)document.exitPointerLock();$('#tableGame').hidden=false;tableGameRender();$('#tgDeal').focus()}
function tableGameClose(){const t=TABLE_GAME;if(!t.open||t.phase==='spin')return;if(t.phase==='playing'){t.msg=tgLocale('Aposta perdida por abandonar a rodada.','Bet forfeited for leaving the hand.');t.wager=0}t.open=false;t.phase='ready';t.player=[];t.dealer=[];t.holds.clear();$('#tableGame').hidden=true}
