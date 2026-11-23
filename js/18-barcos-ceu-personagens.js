'use strict';
/* Coastal Chaos · js/18-barcos-ceu-personagens.js — Tráfego fluvial, praia, céu, helicóptero, Nathan e Claire, táxi, cães e gatos.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v51: trafego fluvial por celulas, como o trafego rodoviario ================= */
const RIVER_BOATS={list:[],routes:[],timer:0,spawnDelay:0,desired:6};
function clearRiverBoats(){
 for(const b of RIVER_BOATS.list){scene.remove(b.g);disposeGroup(b.g)}
 RIVER_BOATS.list=[];RIVER_BOATS.routes=[];RIVER_BOATS.timer=0;RIVER_BOATS.spawnDelay=0;
}
// Monta os percursos a partir das celulas reais de agua, sem depender de pontes ou cabeceiras.
// Percorre apenas celulas vizinhas conectadas, inclusive nas bifurcacoes.
function riverBoatRoutes(){
 const N=city.N,fx=city.flowX,wet=(a,b)=>a>=0&&b>=0&&a<N&&b<N&&(fx?isRiv(a,b):isRiv(b,a)),routes=[],used=new Set();
 // Traverse adjacent water cells; a junction must never average two separate river beds.
 for(let start=0;start<N;start++){if(!wet(0,start))continue;const queue=[[0,start]],prev=new Map([['0,'+start,null]]);let goal=null;
  for(let k=0;k<queue.length;k++){const [a,b]=queue[k],key=a+','+b;if(a===N-1){goal=key;break}for(const [da,db]of [[1,0],[0,1],[0,-1],[-1,0]]){const x=a+da,z=b+db,id=x+','+z;if(wet(x,z)&&!prev.has(id)){prev.set(id,key);queue.push([x,z])}}}
  if(!goal)continue;const path=[];for(let k=goal;k!==null;k=prev.get(k)){const[a,b]=k.split(',').map(Number);path.push([(fx?a:b)*P+P/2,(fx?b:a)*P+P/2])}path.reverse();const sig=path.map(p=>p.join(',')).join(';');if(path.length>=4&&!used.has(sig)){used.add(sig);routes.push(path)}}return routes;
}
// Sob as pontes ha agua navegavel mesmo quando waterAt() reporta piso da via:
// waterAt exclui propositalmente os segmentos com estrada, travando os barcos.
// riverZone testa o leito do rio sem considerar o tabuleiro; pilares seguem solidos.
function riverBoatClear(x,z){
 const bankMargin=5.5,pillarMargin=5.5;
 if(!riverZone(x,z)||!riverZone(x+bankMargin,z)||!riverZone(x-bankMargin,z)||!riverZone(x,z+bankMargin)||!riverZone(x,z-bankMargin))return false;
 for(const p of city.pillars||[])
  if(x>p[0]-pillarMargin&&x<p[2]+pillarMargin&&z>p[1]-pillarMargin&&z<p[3]+pillarMargin)return false;
 return true;
}
function riverBoatPose(route,t,out){
 const L=route.length-1,i=Math.min(L-1,Math.max(0,Math.floor(t))),f=Math.max(0,Math.min(1,t-i));
 const p0=route[Math.max(0,i-1)],p1=route[i],p2=route[i+1],p3=route[Math.min(L,i+2)];
 // Tangentes continuas como nas curvas dos NPCs; nao vira em angulo reto.
 const ax=(p2[0]-p0[0])*.5,az=(p2[1]-p0[1])*.5,bx=(p3[0]-p1[0])*.5,bz=(p3[1]-p1[1])*.5;
 const f2=f*f,f3=f2*f,h0=2*f3-3*f2+1,h1=f3-2*f2+f,h2=-2*f3+3*f2,h3=f3-f2;
 const x=h0*p1[0]+h1*ax+h2*p2[0]+h3*bx,z=h0*p1[1]+h1*az+h2*p2[1]+h3*bz;
 const dx=(6*f2-6*f)*p1[0]+(3*f2-4*f+1)*ax+(-6*f2+6*f)*p2[0]+(3*f2-2*f)*bx;
 const dz=(6*f2-6*f)*p1[1]+(3*f2-4*f+1)*az+(-6*f2+6*f)*p2[1]+(3*f2-2*f)*bz;
 const len=Math.hypot(dx,dz)||1;if(out){out.x=x;out.z=z;out.ux=dx/len;out.uz=dz/len;return out}return{x,z,ux:dx/len,uz:dz/len};
}
/* v3 r5: 'out' opcional = sem objeto novo (o laço das lanchas usa 3 rascunhos fixos) */
const RB_A={x:0,z:0,p:{x:0,z:0,ux:0,uz:0}},RB_B={x:0,z:0,p:{x:0,z:0,ux:0,uz:0}},RB_C={x:0,z:0,p:{x:0,z:0,ux:0,uz:0}};
function riverBoatPosition(route,t,offset,out){
 if(out){const p=riverBoatPose(route,t,out.p);out.x=p.x-p.uz*offset;out.z=p.z+p.ux*offset;return out}
 const p=riverBoatPose(route,t);
 return{x:p.x-p.uz*offset,z:p.z+p.ux*offset,p};
}
function riverBoatMoveClear(from,to){const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)));for(let i=1;i<=n;i++)if(!riverBoatClear(from.x+(to.x-from.x)*i/n,from.z+(to.z-from.z)*i/n))return false;return true}
function makeRiverBoat(route,t,dir,offset,kind='boat'){
 // Mesmo modelo da lancha dirigivel, nao uma geometria inventada.
 const colors=['#e8e8de','#e94d36','#2d91cf','#e8b73e','#40b3a1'];
 const body=new MB(),lights=new MB(),rider=new MB();
 carParts(kind,colors[Math.floor(Math.random()*colors.length)],STYLES[S.style],body,lights,null,rider);
 const g=new THREE.Group();g.add(body.mesh(carBodyMat,true,true));g.add(lights.mesh(carLightMat,false,false));if(kind==='jetski'){const rm=rider.mesh(carBodyMat,true,true);if(rm)g.add(rm)}scene.add(g);
 const b={g,kind,route,t,dir,off:offset,target:offset,v:7+Math.random()*3,speed:9+Math.random()*3,
  turn:0,phase:Math.random()*6.28,alive:true,age:0};
 const pos=riverBoatPosition(route,t,offset);
 g.position.set(pos.x,RY+.15,pos.z);
 g.rotation.y=-Math.atan2(pos.p.uz*dir,pos.p.ux*dir);
 RIVER_BOATS.list.push(b);return b;
}
function riverBoatTrySpawn(kind='boat'){
 const player=PL.car||PL;if(!player||!RIVER_BOATS.routes.length)return false;
 const candidates=[];
 for(const route of RIVER_BOATS.routes){
  for(let i=1;i<route.length-1;i++){
   const p=route[i],dist=Math.hypot(p[0]-player.x,p[1]-player.z);
   if(dist<P*1.7||dist>P*3.3)continue;
   // Variar a posicao dentro do quarteirao, mantendo os dois sentidos separados.
   candidates.push({route,t:i+(.2+Math.random()*.6),dist});
  }
 }
 // Se o rio tiver pouca extensao, procurar ate quatro quarteiroes.
 if(!candidates.length)for(const route of RIVER_BOATS.routes)for(let i=1;i<route.length-1;i++){
  const p=route[i],dist=Math.hypot(p[0]-player.x,p[1]-player.z);
  if(dist>=P*.8&&dist<P*4.4)candidates.push({route,t:i+.5,dist});
 }
 if(!candidates.length)return false;
 for(let tries=0;tries<Math.min(24,candidates.length*3);tries++){
  const entry=candidates[Math.floor(Math.random()*candidates.length)];
  const dir=Math.random()<.5?1:-1,route=entry.route;
  if(dir>0&&entry.t>=route.length-2||dir<0&&entry.t<=1)continue;
  // A mao fluvial so define uma preferencia lateral; nao e uma faixa fixa.
  for(const off of [dir*9,dir*12,dir*6,0,-dir*7]){
   const pos=riverBoatPosition(route,entry.t,off);
   if(!riverBoatClear(pos.x,pos.z))continue;
   if(RIVER_BOATS.list.some(b=>Math.hypot(b.g.position.x-pos.x,b.g.position.z-pos.z)<P*.7))continue;
   makeRiverBoat(route,entry.t,dir,off,kind);return true;
  }
 }
 return false;
}
function initRiverBoats(){
 clearRiverBoats();if(S.style==='inverted'||city.haze)return; // Nenhuma lancha no Upside Down
 RIVER_BOATS.routes=riverBoatRoutes();
 RIVER_BOATS.desired=6;
 // A primeira tentativa e feita apos o jogador ser posicionado, no update.
 RIVER_BOATS.spawnDelay=.1;
}
function riverBoatsTick(dt){
 if(S.style==='inverted'){if(RIVER_BOATS.list.length)clearRiverBoats();return}
 if(!running||PL.inside||!RIVER_BOATS.routes.length)return;
 const player=PL.car||PL;RIVER_BOATS.timer+=dt;RIVER_BOATS.spawnDelay-=dt;
 if(RIVER_BOATS.spawnDelay<=0){
  RIVER_BOATS.spawnDelay=RIVER_BOATS.list.length<RIVER_BOATS.desired?1.4:3;
  if(RIVER_BOATS.list.length<RIVER_BOATS.desired){
   let nJet=0;for(const b of RIVER_BOATS.list)if(b.kind==='jetski')nJet++;
   const nBoat=RIVER_BOATS.list.length-nJet;
   // 2 jet skis + 4 lanchas nos rios da cidade normal, sem aumentar o orçamento total.
   const kind=nJet<2&&nBoat>nJet?'jetski':'boat';
   riverBoatTrySpawn(kind);
  }
 }
 for(let i=RIVER_BOATS.list.length-1;i>=0;i--){
  const b=RIVER_BOATS.list[i],L=b.route.length-1;
  const pos=riverBoatPosition(b.route,b.t,b.off,RB_A),p=pos.p;
  let targetV=b.speed;
  for(const other of RIVER_BOATS.list){
   if(other===b)continue;
   const dx=other.g.position.x-pos.x,dz=other.g.position.z-pos.z;
   const ahead=(dx*p.ux+dz*p.uz)*b.dir,dist=Math.hypot(dx,dz);
   if(ahead>0&&dist<30)targetV=Math.min(targetV,Math.max(0,(dist-9)*.55));
  }
  b.v+=Math.max(-8*dt,Math.min(3*dt,targetV-b.v));
  b.age+=dt;
  // Direcao continua e variacao sutil; testa as margens antes de mudar de faixa.
  if(RIVER_BOATS.timer>b.turn){b.target=b.dir*(7+Math.random()*6);b.turn=RIVER_BOATS.timer+4+Math.random()*6}
  const off=b.off+(b.target-b.off)*Math.min(1,dt*.45);
  const nextT=b.t+b.dir*b.v*dt/P;
  let next=riverBoatPosition(b.route,Math.max(.01,Math.min(L-.01,nextT)),off,RB_B);
  if(!riverBoatMoveClear(pos,next)){
   let free=false;
   for(const alt of [b.off,b.dir*7,b.dir*4,0,-b.dir*5]){
    const q=riverBoatPosition(b.route,Math.max(.01,Math.min(L-.01,nextT)),alt,RB_C);
    if(riverBoatMoveClear(pos,q)){b.off=alt;b.target=alt;next=q;free=true;break}
   }
   if(!free){b.v=Math.max(0,b.v-10*dt);b.blocked=(b.blocked||0)+dt;if(b.blocked>3){b.dir*=-1;b.target=b.off;b.blocked=0}continue}b.blocked=0
  }else{b.off=off;b.blocked=0}
  b.t=nextT;
  // Despawn ao chegar ao fim do curso ou quando longe demais do jogador.
  if(b.t<=.2||b.t>=L-.2||Math.hypot(next.x-player.x,next.z-player.z)>P*6.5){
   scene.remove(b.g);disposeGroup(b.g);RIVER_BOATS.list.splice(i,1);continue;
  }
  b.g.position.set(next.x,RY+.15+Math.sin(simT*2+b.phase)*.06,next.z);
  // colisão com lanchas/jetskis dirigíveis (as do rio eram atravessáveis)
  for(const c of vehicles){if(!c.t.boat||c.mode!=='phys'||!c.alive)continue;const dx=c.x-next.x,dz=c.z-next.z,d=Math.hypot(dx,dz),R0=c.t.R+2.7;if(d>=R0||d<.01)continue;const nx=dx/d,nz=dz/d,dep=R0-d;c.x+=nx*dep;c.z+=nz*dep;const vn=c.vx*nx+c.vz*nz;if(vn<0){c.vx-=1.5*vn*nx;c.vz-=1.5*vn*nz;if(-vn>4){impact(c,-vn,next.x+nx*2.4,next.z+nz*2.4);if(c===PL.car)shake=Math.max(shake,.35)}}c.sleep=false;b.v=Math.min(b.v,2)}
  const ux=next.p.ux*b.dir,uz=next.p.uz*b.dir;
  const yaw=-Math.atan2(uz,ux),dy=Math.atan2(Math.sin(yaw-b.g.rotation.y),Math.cos(yaw-b.g.rotation.y));
  b.g.rotation.y+=Math.max(-dt*1.35,Math.min(dt*1.35,dy));
  b.g.rotation.z=Math.sin(simT*1.6+b.phase)*.025;
  b.g.visible=Math.hypot(next.x-player.x,next.z-player.z)<P*5;
 }
}
/* ================= PRAIA: gente caminhando e fogueiras ================= */
const BEACH={ok:false,fires:[],walkers:[],t:0};
function beachInit(){for(const f of BEACH.fires){scene.remove(f.g);disposeGroup(f.g)}BEACH.fires=[];BEACH.walkers=[];for(const q of BEACH.skaters||[])if(peds.includes(q))removePed(q);BEACH.skaters=[];BEACH.ok=false;if(city.coast===undefined||!city.ext||city.haze)return;
 const E=city.ext,o=RW/2,s=city.coast,sp=city.coastSpan,t0=sp?Math.max(-o-SW,sp[0]):-o-SW,t1=sp?Math.min(E+o+SW,sp[1]):E+o+SW;
 Object.assign(BEACH,{ok:t1-t0>40,s,t0,t1,u0:o+SW+4,u1:SHORE-5,TU:(t,u)=>s===0?[t,-u]:s===1?[t,E+u]:s===2?[-u,t]:[E+u,t]});if(!BEACH.ok)return;
 const rnd=mulberry32(((S.seed>>>0)^0x2545f491)>>>0),n=1+(rnd()<.5?1:0),st=STYLES[S.style];
 for(let k=0;k<n;k++){let chosen=null;
  for(let tr=0;tr<36;tr++){
   const t=t0+30+rnd()*(t1-t0-60),u=BEACH.u0+8+rnd()*(BEACH.u1-BEACH.u0-12),q=BEACH.TU(t,u),x=q[0],z=q[1];
   // Respeitar a margem do canal rio-mar e a faixa de areia molhada:
   // a fogueira e seus NPCs não podem aparecer sobre a água nem junto à foz.
   if(mouthPierBlocked(x,z)||mouthChannel(x,z)||riverZone(x,z)||inWater(x,z)||lhNear(x,z,5)||query(x,z,3).some(b=>!b.dead))continue;
   chosen={x,z};break;
  }
  if(!chosen)continue;
  const {x,z}=chosen,g=new THREE.Group(),mb=new MB(),stone=COL(st.synth?'#4a4458':'#8a8680'),wood=COL('#5a3a22');
  for(let a=0;a<10;a++){const ang=a/10*Math.PI*2;mb.geo(GEO.sph,mtx(Math.cos(ang)*.95,.12,Math.sin(ang)*.95,.22,.16,.2),stone)}
  for(let a=0;a<4;a++){const ang=a/4*Math.PI+.3;mb.geo(GEO.cyl16,mtx(0,.25,0,.09,1.3,.09,Math.PI/2-.35,ang,0),wood)}
  g.add(mb.mesh(carBodyMat,true,false));
  const fm=new THREE.MeshBasicMaterial({color:0xff7a1a,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false}),fm2=new THREE.MeshBasicMaterial({color:0xffd04a,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
  const f1=new THREE.Mesh(new THREE.ConeGeometry(.5,1.4,10),fm),f2=new THREE.Mesh(new THREE.ConeGeometry(.3,.95,10),fm2);f1.position.y=.85;f2.position.y=.7;g.add(f1,f2);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex,color:0xff8a2a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8}));gl.rotation.x=-Math.PI/2;gl.position.y=.22;g.add(gl);
  g.position.set(x,groundY(x,z),z);scene.add(g);const c=addCol(x-.95,z-.95,x+.95,z+.95,'rock');c.low=.5;
  BEACH.fires.push({x,z,g,f1,f2,gl,peds:[],nd:1+(rnd()<.5?1:0),nn:5+(rnd()<.5?1:0)})}}
function beachTick(dt){if(!BEACH.ok)return;const pc=PL.car||PL,near=!PL.inside&&outDist(pc.x,pc.z)>-260;BEACH.t-=dt;
 for(const f of BEACH.fires){const isNight=DN.nightF>.5&&S.style!=='inverted';f.g.visible=isNight;if(!isNight&&f.peds.length){for(const q of f.peds)removePed(q);f.peds=[]}const fl=1+Math.sin(simT*17+f.x)*.08+Math.sin(simT*7.3)*.06;f.f1.scale.set(fl,1+Math.sin(simT*11)*.12,fl);f.f2.scale.set(fl,1+Math.sin(simT*13+1)*.15,fl);f.gl.scale.setScalar(3+DN.nightF*5+Math.sin(simT*9)*.3);
  const d=Math.hypot(f.x-pc.x,f.z-pc.z);if(isNight&&d<160&&Math.random()<dt*6)emit(f.x+(Math.random()-.5)*.4,1.3,f.z+(Math.random()-.5)*.4,(Math.random()-.5)*.6,1.6+Math.random(),(Math.random()-.5)*.6,.6,.4,.12,Math.random()<.5?0xffa030:0xff6a1a,true,.95);
  f.peds=f.peds.filter(q=>peds.includes(q)&&q.state==='fire');const want=isNight&&d<230&&!PL.inside?f.nn:0;
  while(f.peds.length>want){const q=f.peds.pop();removePed(q)}
  while(f.peds.length<want){const ang=Math.random()*6.283,r=2.2+Math.random()*.7,q=spawnLying(f.x+Math.cos(ang)*r,f.z+Math.sin(ang)*r);q.state='fire';q.rot=0;q.fx=f.x;q.fz=f.z;q.fixed=true;f.peds.push(q)}}
 BEACH.walkers=BEACH.walkers.filter(q=>peds.includes(q)&&q.state==='bwalk');
 for(const q of BEACH.walkers.slice())if(Math.hypot(q.x-pc.x,q.z-pc.z)>330||S.style==='inverted'){removePed(q)}
 /* v79r14: de dia, até 2 skatistas deslizando pelo calçadão da orla */
 BEACH.skaters=(BEACH.skaters||[]).filter(q=>peds.includes(q)&&q.state==='bskate');for(const q of BEACH.skaters.slice())if(Math.hypot(q.x-pc.x,q.z-pc.z)>330||S.style==='inverted')removePed(q);
 BEACH.skT=(BEACH.skT||0)-dt;if(BEACH.skT<=0){BEACH.skT=4+Math.random()*6;const wantS=near&&S.style!=='inverted'&&DN.nightF<.5&&!(CELLS.length&&rainAt(pc.x,pc.z)>.2)?2:0;if(BEACH.skaters.length<wantS&&Math.random()<.6)pedSkSpawn(pc)}
 if(BEACH.t>0)return;BEACH.t=1.5;const want=near&&S.style!=='inverted'?(DN.nightF>.5?2:6):0;
 if(BEACH.walkers.length<want){const B=BEACH,pt=B.s<2?pc.x:pc.z,t=clamp(pt+(Math.random()-.5)*260,B.t0+6,B.t1-6),u=B.u0+Math.random()*(B.u1-B.u0),q0=B.TU(t,u);
  if(Math.hypot(q0[0]-pc.x,q0[1]-pc.z)>45||Math.random()<.3){const q=spawnLying(q0[0],q0[1],pick2(BEACH_PALS));q.state='bwalk';q.rot=0;q.fixed=true;q.bt=t;q.bu=u;q.bdir=Math.random()<.5?1:-1;q.spd=.9+Math.random()*.6;q.fin=0;q.sp.material.opacity=0;q.sh.material.opacity=0;B.walkers.push(q)}}}
/* v79r14: skatista da orla — anda numa faixa do calçadão (u entre RW/2+1,5 e +4,4, longe dos postes e da mureta), desvia trocando de faixa, para e volta se não tiver passagem.
   Derrubado (carro, soco, tiro) o skate sai do pé e fica no chão como pickup (dá pra pegar). */
function skLaneFree(x,z,self){if(inWater(x,z)||Math.abs(groundY(x,z)-.2)>.12)return false;for(const b of query(x,z,.9)){if(b.dead)continue;const cx=clamp(x,b.x0,b.x1),cz=clamp(z,b.z0,b.z1);if(Math.hypot(x-cx,z-cz)<.5)return false}
 if(!PL.car&&!PL.inside&&Math.hypot(PL.x-x,PL.z-z)<1.1)return false;for(const q of peds){if(q===self||q.state==='lie'||q.state==='fire'||Math.abs(q.x-x)>1||Math.abs(q.z-z)>1)continue;if(Math.hypot(q.x-x,q.z-z)<.9)return false}return true}
function skTRange(){const B=BEACH;return[Math.max(B.t0,0)+10,Math.min(B.t1,city.ext)-10]}
function pedSkSpawn(pc){const B=BEACH,o=RW/2,pt=B.s<2?pc.x:pc.z,TR=skTRange();if(TR[1]-TR[0]<30)return null;for(let k=0;k<6;k++){const t=clamp(pt+(Math.random()<.5?-1:1)*(55+Math.random()*95),TR[0]+4,TR[1]-4),u=o+1.8+Math.random()*2.4,q0=B.TU(t,u);
  if(Math.hypot(q0[0]-pc.x,q0[1]-pc.z)<45||!skLaneFree(q0[0],q0[1],null))continue;
  const q=spawnLying(q0[0],q0[1]);q.state='bskate';q.rot=0;q.fixed=true;q.bt=t;q.bu=u;q.bU=u;q.bdir=Math.random()<.5?1:-1;q.spd=3.6+Math.random()*2.2;q.sv=q.spd*.6;q.fin=0;q.sp.material.opacity=0;q.sh.material.opacity=0;
  q.skLook={deck:SK_DECK[Math.floor(Math.random()*SK_DECK.length)],wheel:SK_WHEEL[Math.floor(Math.random()*SK_WHEEL.length)],print:SK_PRINT[Math.floor(Math.random()*(SK_PRINT.length-1))]};if(q.skLook.print==='EMOJI')q.skLook.emo=[SK_EMO_RND[Math.floor(Math.random()*SK_EMO_RND.length)]];q.skb=skBoard(q.skLook);scene.add(q.skb);q.gy=groundY(q.x,q.z);q.jy=SK_UP;BEACH.skaters.push(q);return q}return null}
function pedSkTick(p,dt){const B=BEACH,o=RW/2,lo=o+1.5,hi=o+4.4,ah=B.TU(p.bt+p.bdir*1.7,p.bU);
 if(!skLaneFree(ah[0],ah[1],p)){let ok=false;for(const du of [-1,1,-2,2]){const u=clamp(p.bU+du*.9,lo,hi);if(Math.abs(u-p.bU)<.1)continue;const a2=B.TU(p.bt+p.bdir*1.7,u),a3=B.TU(p.bt,u);if(skLaneFree(a2[0],a2[1],p)&&skLaneFree(a3[0],a3[1],p)){p.bU=u;ok=true;break}}
  if(!ok){p.sv=Math.max(0,p.sv-9*dt);if(p.sv<.4){p.bdir*=-1;p.sv=.8;p.flips=(p.flips||0)+1}}}
 else{p.sv=Math.min(p.spd,p.sv+1.6*dt);if(p.sv>=p.spd)p.flips=0}
 const TR=skTRange();if((p.bt<TR[0]&&p.bdir<0)||(p.bt>TR[1]&&p.bdir>0)){p.bdir*=-1;p.sv=.8}
 if(p.flips>3){removePed(p);return true} /* preso entre dois bloqueios: some em vez de ficar tremendo */
 const du=p.bU-p.bu,st=Math.sign(du)*Math.min(Math.abs(du),1.6*dt);p.bu+=st;p.bt+=p.bdir*p.sv*dt;
 const q=B.TU(p.bt,p.bu),q2=B.TU(p.bt+p.bdir,p.bu),tx=q2[0]-q[0],tz=q2[1]-q[1];p.mx=-tz;p.mz=tx; /* de lado na prancha: o sprite olha pra direita do movimento */p.vx=tx*p.sv;p.vz=tz*p.sv;p.x=q[0];p.z=q[1];p.gy=groundY(p.x,p.z);p.jy=SK_UP;p.anim=0;
 if(p.skb){const vis=!PL.inside&&(p.fin===undefined||p.fin>.3);p.skb.visible=vis;p.skb.position.set(p.x,p.gy,p.z);p.skb.rotation.set(0,-Math.atan2(tz,tx),0);const side=(B.TU(p.bt,p.bu+1)[0]-q[0])*tz-(B.TU(p.bt,p.bu+1)[1]-q[1])*tx;p.skb.rotateX(clamp(dt>0?st/dt/1.6:0,-1,1)*.15*Math.sign(side||1))}}
function pedSkDrop(p){const L=p.skLook,g=p.skb;p.skb=null;p.jy=0;skDisposeG(g);if(!L||!peds.includes(p)||p.state==='bskate')return;
 const loose=SKATE.items.filter(it=>!skInGarage(it)).length;if(loose>=6)return;const a=Math.random()*6.283,o={x:p.x+Math.cos(a)*1.1,z:p.z+Math.sin(a)*1.1};circleVsWorld(o,.3);if(inWater(o.x,o.z))return;skAdd(o.x,o.z,Math.random()*6.283,L,true)}
function knockPedDown(p,dx,dz){if(p&&p.net){netHitPed(p,30,'car');return}if(p&&p.prof&&p.prof.loot)dropRoadCash(p);
 const skater=p.state==='bskate';
 p.state='down';p.timer=2.6;p.fixed=false;p.rot=(R2()<.5?1:-1)*Math.PI/2;
 p.vx=dx*5;p.vz=dz*5;p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;
 if(skater)pedSkDrop(p);
}
function bumpBeachSkater(x,z){
 if(PL.inside||!BEACH.skaters?.length)return;
 const dx=PL.x-x,dz=PL.z-z,len=Math.hypot(dx,dz);
 if(len<.001)return;
 const ux=dx/len,uz=dz/len;
 for(const p of BEACH.skaters){
  if(p.state!=='bskate'||Math.abs(PL.gy+(PL.jy||0)-p.gy)>1.3)continue;
  const px=p.x-x,pz=p.z-z,along=px*ux+pz*uz;
  if(along<0)continue;
  const t=Math.min(len,along);
  if(Math.hypot(px-ux*t,pz-uz*t)>.74)continue;
  knockPedDown(p,ux,uz);ouch(p.x,p.z,p.pitch);
 }
}
/* ================= CÉU: helicóptero e avião passando ================= */
// faixas de altitude separadas (heli ~135-150 m, avião ~240-280 m): os dois nunca colidem nem atravessam prédios
// Três fluxos independentes por tipo: 3× o tráfego, sem sincronizar horários ou rotas.
const SKY={slots:Array.from({length:3},()=>[{kind:'heli',o:null,t:20+Math.random()*30},{kind:'plane',o:null,t:45+Math.random()*50}]).flat()};
function skyInit(){for(const slot of SKY.slots){skyDrop(slot);slot.t=slot.kind==='heli'?20+Math.random()*30:45+Math.random()*50}}
function skyDrop(slot){const a=slot.o;if(!a)return;scene.remove(a.g);disposeGroup(a.g);if(a.snd){try{a.snd.src.stop();if(a.snd.lfo)a.snd.lfo.stop();a.snd.g.disconnect()}catch(e){}}slot.o=null}
function skyHeli(paint){const g=new THREE.Group(),mb=new MB(),li=new MB(),st=STYLES[S.style],pol=paint==='police',col=COL(pol?'#1d3470':pick2(st.synth?['#33e6e6','#ff4fa3','#e8e8f0']:['#d62828','#f2c21a','#2a6ad6','#e8e8e8'])),dk=COL('#1c1c22'),gl=COL(st.synth?'#151a2a':'#2a3a4a'),wh=COL('#f4f4f0'),chr=COL('#9aa0a8');
 // v105: fuselagem em gota (bolha de vidro na frente, janelas laterais com coluna de porta), cone de cauda afinando, deriva e estabilizador com perfil
 const F=[[2.6,.06,-.3,-.18],[2.48,.42,-.7,.18],[2.28,.78,-.92,.55],[1.98,1.02,-1.02,.82],[1.52,1.18,-1.06,.98],[.92,1.26,-1.08,1.06],[.22,1.28,-1.08,1.1],[-.58,1.24,-1.06,1.1],[-1.28,1.1,-.95,1.04],[-1.88,.85,-.62,.95],[-2.32,.52,-.12,.82],[-2.58,.33,.14,.66]];
 mbLoftSt(mb,F.map(([x,rz,y0,y1])=>({x,rz,ry:(y1-y0)/2,cy:(y0+y1)/2,e:2.5})),22,(x,y,z,cap)=>{if(cap)return col;
  if(x>.78&&y>-.5&&!(Math.abs(z)<.07&&y>.25&&x<2.2))return gl;                                   // bolha frontal (com montante central)
  if(x>-1.25&&x<.6&&y>-.05&&y<.8&&!(x>.16&&x<.3))return gl;                                        // janelas laterais / porta
  if(pol&&y>-.62&&y<-.36)return wh;if(!pol&&y>-.5&&y<-.38)return wh;return col});              // faixa
 mbLoftSt(mb,[[-2.3,.33,.42],[-3.2,.27,.47],[-4.2,.2,.52],[-5.1,.15,.56],[-5.55,.11,.58]].map(([x,r,cy])=>({x,rz:r,ry:r,cy,e:2})),12,()=>col);
 mbFoil(mb,{le:-4.95,te:-5.75,s:.42,v:0,t:.16},{le:-5.45,te:-5.98,s:2.0,v:0,t:.1},col,true);                       // deriva
 mbFoil(mb,{le:-5.1,te:-5.6,s:.55,v:0,t:.1},{le:-5.4,te:-5.65,s:-.05,v:0,t:.07},col,true);                         // quilha inferior
 for(const zs of [-1,1]){mbFoil(mb,{le:-4.35,te:-4.95,s:zs*.1,v:.52,t:.09},{le:-4.5,te:-4.95,s:zs*1.0,v:.52,t:.07},col,false);
  mbFoil(mb,{le:-4.42,te:-4.98,s:.3,v:zs*1.02,t:.05},{le:-4.6,te:-5.0,s:.82,v:zs*1.02,t:.04},col,true)}         // estabilizador + placas
 // carenagem do motor no teto, entradas de ar e escapes
 mbLoftSt(mb,[[-1.75,.12,1.1],[-1.5,.42,1.22],[-.8,.56,1.28],[.2,.58,1.28],[.62,.38,1.2],[.82,.08,1.1]].map(([x,rz,cy])=>({x,rz,ry:.27,cy,e:3})),16,(x,y,z,cap)=>cap?col:col.clone().multiplyScalar(.9));
 for(const zs of [-1,1]){mb.cbox(.1,1.18,zs*.56-.03,.5,1.36,zs*.56+.03,dk,.02);mbTube(mb,[-1.55,1.25,zs*.25],[-1.95,1.32,zs*.3],.1,dk,GEO.cyl16)}
 mb.geo(GEO.cyl16,mtx(-.2,1.6,0,.15,.4,.15),dk);
 // esquis: tubos com ponta curvada pra cima e travessas
 for(const zs of [-1,1]){mbTube(mb,[-1.6,-1.55,zs*1.05],[1.55,-1.55,zs*1.05],.07,dk,GEO.cyl16);mbTube(mb,[1.55,-1.55,zs*1.05],[1.95,-1.32,zs*1.05],.07,dk,GEO.cyl16);
  for(const xs of [-.8,.7])mbTube(mb,[xs,-1.55,zs*1.05],[xs+.05,-.95,zs*.72],.055,dk,GEO.cyl16);mb.cbox(.5,-.82,zs*1.08-.04,1.0,-.76,zs*1.08+.04,dk,.02)}
 if(pol){mb.geo(GEO.cyl16,mtx(1.9,-.98,.35,.14,.2,.14,0,0,Math.PI/2),dk);li.geo(GEO.sph,mtx(2.0,-.98,.35,.03,.11,.11),COL('#fff6d8'))}
 li.geo(GEO.sph,mtx(2.15,-.85,0,.04,.08,.12),COL('#fff6d8'));li.geo(GEO.sph,mtx(-4.6,.52,-1.06,.06,.06,.06),COL('#ff2a2a'));li.geo(GEO.sph,mtx(-4.6,.52,1.06,.06,.06,.06),COL('#2aff5a'));
 g.add(mb.mesh(carBodyMat,true,false));g.add(li.mesh(S.style==='inverted'?carBodyMat:carLightMat,false,false));
 // rotor: cubo + 4 pás com perfil e ponta pintada
 const rm=new MB();rm.geo(GEO.sph,mtx(0,0,0,.32,.16,.32),dk);{const bl=new MB();mbFoil(bl,{le:.24,te:-.24,s:.3,v:0,t:.07},{le:.2,te:-.2,s:5.4,v:-.04,t:.045},dk,false);mbFoil(bl,{le:.2,te:-.2,s:5.4,v:-.04,t:.045},{le:.19,te:-.19,s:6,v:-.05,t:.04},COL('#f2c21a'),false);
  for(let k=0;k<4;k++)mbAddXf(rm,bl,new THREE.Matrix4().makeRotationY(k*Math.PI/2+Math.PI/4))}
 const rot=rm.mesh(carBodyMat,false,false);rot.position.y=1.72;g.add(rot);
 const tm=new MB();tm.geo(GEO.sph,mtx(0,0,0,.09,.09,.09),dk);tm.cbox(-.8,-.03,-.08,.8,.03,.08,dk,.02);tm.cbox(-.08,-.03,-.8,.08,.03,.8,dk,.02);const tr=tm.mesh(carBodyMat,false,false);tr.position.set(-5.5,1.25,.2);tr.rotation.x=Math.PI/2;g.add(tr);
 const bl=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x3a1414,roughness:.7}):new THREE.MeshBasicMaterial({color:0xff2020}));bl.position.set(-5.72,2.05,0);g.add(bl);let pl=null;
 if(pol){const r=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.3),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x4a1418,roughness:.6}):new THREE.MeshBasicMaterial({color:0xff2020})),b=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.3),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x14224a,roughness:.6}):new THREE.MeshBasicMaterial({color:0x2060ff}));r.position.set(1.15,1.04,-.3);b.position.set(1.15,1.04,.3);g.add(r,b);pl=[r,b]}
 return{g,rot,tr,bl,pl}}
/* v78: corpo do jato separado para reaproveitar nos aviões parados do pátio (mesma malha do avião do aeroporto) */
function jetBodyMB(mb,ac){const wh=COL('#e8eaee'),dk=COL('#22252c'),gry=COL('#b9bdc4'),win=COL('#1a2230');
 // v105: jato comercial — fuselagem tubular com nariz e cone de cauda erguido, asas enflechadas ~25° com diedro e winglets,
 // motores em naceles sob as asas (pilone, entrada escura, cone), cauda convencional, carenagem de barriga e trem de pouso
 const F=[[14.75,.05,0],[14.45,.55,-.05],[13.85,.98,-.06],[13.0,1.27,-.05],[12.0,1.45,-.02],[10.6,1.52,0],[-7,1.52,0],[-9.4,1.43,.12],[-11.4,1.16,.36],[-13.4,.82,.62],[-15.1,.47,.86],[-16.1,.2,.96]];
 mbLoftSt(mb,F.map(([x,r,cy])=>({x,rz:r,ry:r*1.03,cy,e:2})),24,(x,y,z,cap)=>{if(cap)return wh;if(x>12.5&&x<13.7&&y>.32)return win;if(y<-.42&&y>-.66&&x<12.3&&x>-12)return ac;if(y<-1.1)return gry;return wh});
 for(let x=-9.6;x<10.6;x+=.86)for(const zs of [-1,1]){if(Math.abs(x-.6)<.5)continue;mb.box(x-.15,.3,zs>0?1.44:-1.47,x+.15,.58,zs>0?1.47:-1.44,win)}
 for(const dx of [11.2,-8.6])for(const zs of [-1,1])mb.box(dx-.42,-.7,zs>0?1.48:-1.495,dx+.42,.95,zs>0?1.495:-1.48,COL('#cfd3da'));
 mb.geo(GEO.sph,mtx(.4,-1.02,0,6.8,.72,1.48),wh);
 for(const zs of [-1,1]){
  mbFoil(mb,{le:4.4,te:-2.8,s:zs*1.2,v:-.78,t:.55},{le:-1.75,te:-3.8,s:zs*14,v:.36,t:.14},wh,false);                // asa
  mbFoil(mb,{le:-1.8,te:-3.82,s:.38,v:zs*14.02,t:.12},{le:-3.25,te:-3.95,s:2.0,v:zs*14.25,t:.08},ac,true);          // winglet
  mbFoil(mb,{le:-12.1,te:-15.1,s:zs*.6,v:.58,t:.32},{le:-14.7,te:-16.1,s:zs*5.6,v:.88,t:.1},wh,false);              // estabilizador
  // nacele do motor (loft centrado e depois deslocado), entrada escura com cone, bocal e pilone
  {const nm=new MB(),ey=-1.38;mbLoftSt(nm,[[4.35,.72],[4.22,.86],[3.4,.92],[2.2,.86],[1.2,.66],[.55,.42]].map(([x,r])=>({x,rz:r,ry:r,cy:ey,e:2})),18,(x,y,z,cap)=>cap?dk:x>4.15?gry:wh);
   nm.geo(GEO.cyl16,mtx(4.3,ey,0,.7,.05,.7,0,0,Math.PI/2),dk);nm.geo(GEO.cone,mtx(4.38,ey,0,.2,.34,.2,0,0,-Math.PI/2),gry);nm.geo(GEO.cone,mtx(.35,ey,0,.3,.5,.3,0,0,Math.PI/2),dk);
   mbFoil(nm,{le:3.9,te:.9,s:ey+.7,v:0,t:.22},{le:3.4,te:.3,s:ey+1.18,v:0,t:.2},wh,true);
   mbAddXf(mb,nm,new THREE.Matrix4().makeTranslation(0,0,zs*5.8))}
 }
 // deriva na cor da companhia
 mbFoil(mb,{le:-10.8,te:-15.9,s:1.1,v:0,t:.36},{le:-14.7,te:-16.45,s:5.35,v:0,t:.12},ac,true);
 // trem de pouso: bequilha dupla e dois trens principais com 4 rodas
 {const tyre=COL('#141416');mbTube(mb,[11.1,-1.3,0],[11.1,-2.05,0],.09,gry,GEO.cyl16);for(const zs of [-1,1])mb.geo(GEO.cyl16,mtx(11.1,-2.15,zs*.17,.25,.13,.25,Math.PI/2,0,0),tyre);
  for(const zs of [-1,1]){mbTube(mb,[-.3,-1.0,zs*2.6],[-.3,-1.85,zs*2.6],.13,gry,GEO.cyl16);mb.cbox(-.95,-1.95,zs*2.6-.06,.35,-1.85,zs*2.6+.06,gry,.02);
   for(const dx of [-.75,.15])for(const dz of [-.26,.26])mb.geo(GEO.cyl16,mtx(-.3+dx,-1.9,zs*2.6+dz,.5,.2,.5,Math.PI/2,0,0),tyre)}}
 return mb}
function skyPlane(airfield=false){const g=new THREE.Group(),mb=new MB(),wh=COL('#e8eaee'),st=STYLES[S.style],ac=COL(pick2(st.synth?['#ff4fa3','#33e6e6']:['#d62828','#2a6ad6','#1e8a4a'])),dk=COL('#22252c'),gry=COL('#b9bdc4'),win=COL('#1a2230');
 jetBodyMB(mb,ac);
 g.add(mb.mesh(carBodyMat,true,false));
 // v220: dois paineis curtos no sentido do voo e largos ao longo das asas (2 triangulos cada).
 // Criados SOMENTE no aviao do aeroporto: trafego aereo permanece inalterado.
 let spoilers=null;
 if(airfield){
  spoilers=[];
  const panelGeo=new THREE.PlaneGeometry(1.32,3.15);
  // A lataria usa carBodyMat (MeshStandardMaterial com vertexColors).
  // Os spoilers compartilham exatamente o mesmo material/shader e o branco
  // linear das asas, sem criar novos materiais, texturas ou draw calls extras.
  const panelColors=[];
  for(let i=0;i<panelGeo.attributes.position.count;i++)panelColors.push(wh.r,wh.g,wh.b);
  panelGeo.setAttribute('color',new THREE.Float32BufferAttribute(panelColors,3));
  const panelMat=carBodyMat;
  for(const side of [-1,1]){
   const hinge=new THREE.Group();hinge.position.set(.65,-.095,side*6.1);
   const plate=new THREE.Mesh(panelGeo,panelMat);plate.rotation.x=-Math.PI/2;plate.position.x=-.43;
   plate.castShadow=false;plate.receiveShadow=false;hinge.add(plate);g.add(hinge);spoilers.push(hinge);
  }
 }
 const L=(c,x,y,z)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.28,8,6),S.style==='inverted'?new THREE.MeshStandardMaterial({color:0x2e2e34,roughness:.7}):new THREE.MeshBasicMaterial({color:c}));m.position.set(x,y,z);g.add(m);return m};
 L(0xff2020,-2.8,.4,-14.2);L(0x20ff40,-2.8,.4,14.2);const st2=L(0xffffff,-16.2,5.45,0);return{g,bl:st2,spoilers}}
function skySound(heli){if(!AC||!AC._noise)return null;try{const src=AC.createBufferSource();src.buffer=AC._noise;src.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=heli?240:380;const g=AC.createGain();g.gain.value=0;
  let lfo=null;if(heli){lfo=AC.createOscillator();const lg=AC.createGain(),am=AC.createGain();lfo.frequency.value=16;lg.gain.value=.5;am.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);f.connect(am);am.connect(g);lfo.start()}else f.connect(g);
  src.connect(f);g.connect(master);src.start();return{src,g,lfo}}catch(e){return null}}
function skySpawn(slot){slot.hp=undefined;const k=slot.kind,pc=PL.car||PL,E=city.ext,heli=k==='heli';const near=Math.random()<.6;const cx=near?pc.x+(Math.random()-.5)*240:Math.random()*E,cz=near?pc.z+(Math.random()-.5)*240:Math.random()*E;
 const a=Math.random()*6.283,L=heli?650:1500,o=heli?skyHeli():skyPlane();o.dx=Math.cos(a);o.dz=Math.sin(a);o.x=cx-o.dx*L;o.z=cz-o.dz*L;o.y=heli?135+Math.random()*15:240+Math.random()*40;o.v=heli?24+Math.random()*8:68+Math.random()*12;o.left=2*L;
 o.g.rotation.y=-a;o.g.position.set(o.x,o.y,o.z);scene.add(o.g);o.snd=skySound(heli);slot.o=o} /* v79r22: posiciona antes de entrar na cena (antes o avião/heli aparecia 1 quadro no chão em 0,0) */
/* ================= HELICÓPTERO DO JOGADOR =================
   Mesmo modelo dos helicópteros que cruzam o céu. Fica parado nos helipontos (delegacia, hospital e arranha-céu).
   E perto dele: embarca. ↑ decola até a altitude fixa (acima dos prédios, abaixo dos helicópteros NPC).
   No ar: ↑/↓ velocidade, ←/→ vira. E: pousa onde estiver (não na água nem em cima de prédio); no chão, E desembarca.
   ESPAÇO no ar: salta de paraquedas; o helicóptero cai mais rápido e explode no chão. */
const HELI={list:[],cur:null},HELI_ALT=118,HELI_SK=1.62;
/* ================= NATHAN E CLAIRE (troca de personagem estilo GTA V) =================
   Segure Alt (teclado) ou ↓ no direcional (controle) para abrir o seletor; ←/→ escolhe, soltar troca.
   Clique/toque no círculo do canto também troca. A câmera sobe, desliza pela cidade e desce onde o outro está.
   Especial (Caps Lock ou L3+R3): Nathan = bullet time a pé com arma na mão; Claire = câmera lenta dirigindo.
   A barra enche sozinha (cheia a cada 3 min reais) e pode ser ligada/desligada à vontade. */
const LUCIA_PAL={art:null,headphone:null,bag:null,cap:null,capDark:null,skin:'#c68642',hair:'#2a1610',shirt:'#d62a6a',pants:'#22325e',shoes:'#f2f2ee',belt:'#1a1a1a',stripe:null,glasses:null,necklace:'#e8c040',long:true,swim:null,pack:false};
const CHAR={cur:0,list:[{name:'NATHAN',look:null,sp:1},{name:'CLAIRE',look:{...LUCIA_PAL},sp:1}],sel:0,open:false,src:null,dpadT:0};
const SPEC={on:false,ts:1};
const SWITCH={on:false,t:0};
// v281: arco PRÓXIMO = a orientacao VERTICAL da v279, sem o salto a 25 m.
// 1) curva de camera de gameplay a nadir (pitch no proprio eixo local X), sobe;
// 2) troca o ponto central no apice e desce; 3) retorna ao modo de camera normal.
// Nao interpola uma orbita lateral como a v280. Nao altera SpriteMaterial/atlas.
const CAMHOP={on:false,t:0,dur:.92,x0:0,z0:0,x1:0,z1:0,inside:false,car:null,
 srcPos:null,srcQuat:null,srcNadir:null,peakY:0};
const _hopPos=new THREE.Vector3(),_hopQuat=new THREE.Quaternion(),_hopForward=new THREE.Vector3();
const _hopLocalX=new THREE.Vector3(1,0,0);
function camNadirPitch(q){
 // A rotacao ocorre exclusivamente sobre o eixo horizontal da camera,
 // preservando o azimute — sem giro de lado nem 'olhar para tras'.
 _hopForward.set(0,0,-1).applyQuaternion(q);
 const a=Math.acos(clamp(-_hopForward.y,-1,1));
 return q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(_hopLocalX,-a));
}
function camHopStart(x0=PL.x,z0=PL.z){
 if(!played||!running||CAMHOP.on||SWITCH.on||CAMX.on||HAZE.switching||INVERT.switching||TIMEJUMP.busy||TIMEJUMP.loading)return false;
 const h=CAMHOP;h.inside=!!PL.inside;h.car=PL.car||null;
 h.x0=x0;h.z0=z0;h.x1=PL.x;h.z1=PL.z;
 h.srcPos=camera.position.clone();h.srcQuat=camera.quaternion.clone();h.srcNadir=camNadirPitch(h.srcQuat);
 h.peakY=h.inside?Math.max(2.65,h.srcPos.y+1.0):Math.max((PL.gy||0)+10,h.srcPos.y+9);
 h.t=0;h.on=true;return true;
}
function camHopTick(dt){
 const h=CAMHOP;
 // A camera normal de destino precisa continuar se atualizando durante a curva.
 h.on=false;updateCamera(dt);h.on=true;
 const destPos=camera.position.clone(),destQuat=camera.quaternion.clone();
 const k=clamp((h.t+=Math.max(0,dt))/h.dur,0,1);
 if(k>=1){h.on=false;return}
 const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
 const rise=k<.5?smooth(k*2):smooth((1-k)*2);
 const move=smooth((k-.38)/.24);
 const aboard=h.car&&PL.car===h.car;
 const offX=aboard?h.car.x-h.x1:0,offZ=aboard?h.car.z-h.z1:0;
 const sx=h.x0+offX,sz=h.z0+offZ,ex=aboard?h.car.x:h.x1,ez=aboard?h.car.z:h.z1;
 _hopPos.set(sx+(ex-sx)*move,h.peakY,sz+(ez-sz)*move);
 if(k<.5){
  const j=smooth(k*2);
  camera.position.set(h.srcPos.x+offX,h.srcPos.y,h.srcPos.z+offZ).lerp(_hopPos,j);
  camera.quaternion.copy(h.srcQuat).slerp(h.srcNadir,j);
 }else{
  const j=smooth((k-.5)*2);
  camera.position.copy(_hopPos).lerp(destPos,j);
  camera.quaternion.copy(h.srcNadir).slerp(destQuat,j);
 }
 sky.position.copy(camera.position);
}
// Momentos em que teleportar ou trocar de personagem poderia quebrar o jogo. Retorna o motivo ('' = livre).
function eventLock(){if(PL.dead||(PL.hp||0)<=0)return'MORTO';if(BR.busy||BR.fall)return'TRANSIÇÃO';if(PARA.active&&!PARA.active.roof)return'PARAQUEDAS';if(PARA.active)return'TERRAÇO';if(TVM.on)return'TV';
 if(TIMEJUMP.busy||TIMEJUMP.loading)return'VIAGEM NO TEMPO';if(PL.car&&PL.car.type==='super'&&PL.car.special&&S.style!=='inverted'&&Math.abs(PL.car.fwd||0)*3.6>=70)return'PORTAL DO DELOREAN ABERTO';
 if(HAZE.switching||INVERT.switching||SWITCH.on||CAMHOP.on)return'TRANSIÇÃO';if(LH.up||LH.fall)return'FAROL';if(JUMP.active)return'SALTO';
 if(PL.heli)return PL.heli.phase==='fly'||PL.heli.phase==='ground'?'HELICÓPTERO':'HELICÓPTERO EM MANOBRA';if(PL.inside)return'INTERIOR';if(PL.down>0)return'NOCAUTE';if(PL.taxi)return'TÁXI';return''}
function charLockWhy(){return PL.inside==='mall'?'SAIA DO SHOPPING PARA TROCAR DE PERSONAGEM':PL.inside&&PL.inside!==true?'SAIA DO LOCAL PARA TROCAR DE PERSONAGEM':WARD.open?'FECHE O GUARDA-ROUPA PARA TROCAR DE PERSONAGEM':'FECHE O MENU PARA TROCAR DE PERSONAGEM'}
function charLock(){if(prologueLocked())return true;if(!storyOK('safe'))return true;if(DEAL.open||PHONE.open||TECH.open||AMMO.uiOpen||PL.inside==='ammo'||PL.inside==='heist'||PL.inside==='pawn')return true;const ev=eventLock();return(ev&&ev!=='TERRAÇO'&&ev!=='HELICÓPTERO'&&!(ev==='INTERIOR'&&PL.inside===true))||!!POL.wanted||PL.inside==='jail'||PL.inside==='shop'||PL.inside==='mall'||menuOpen||cmdsOpen||cfgOpen||TUNE.open||WARD.open||NAV.open||!!WHL.open}
function charCan(){return played&&running&&!charLock()&&!PL.dead&&(!PL.inside||PL.inside===true)&&!(PARA.active&&!PARA.active.roof)&&!TVM.on&&!SWITCH.on&&!CAMHOP.on&&!HAZE.switching&&!INVERT.switching&&!TIMEJUMP.busy&&!menuOpen&&!(PL.heli&&PL.heli.phase!=='fly'&&PL.heli.phase!=='ground')}
function charFaces(){const box=$('#chsel');if(!box)return;const looks=[CHAR.cur===0?PLAYER_PAL:CHAR.list[0].look||PLAYER_PAL,CHAR.cur===1?PLAYER_PAL:CHAR.list[1].look];
 box.querySelectorAll('.half').forEach((d,i)=>{const c=d.querySelector('canvas'),g=c.getContext('2d');g.clearRect(0,0,40,40);g.imageSmoothingEnabled=false;/* v78: rosto centrado em cada metade (antes ficava cortado pela divisória = "vesgo"); 2D por padrão, 3D só com "Pedestres em 3D" */try{if(S.sprite8!==true&&S.char3d!==true)throw 0;const P=charPortrait({...looks[i],pack:false});g.imageSmoothingEnabled=true;g.drawImage(P.open_closed,40,8,112,112,0,0,40,40)}catch(e){g.imageSmoothingEnabled=false;const at=makeAtlas({...looks[i],pack:false});g.drawImage(at,4,0,24,24,2,4,36,36)}d.classList.toggle('cur',CHAR.cur===i)});charSelPaint()}
/* r43: na história, a troca livre Nathan↔Claire só abre depois da missão 2 (antes disso só o roteiro troca, via campSwitch) */
function claireFree(){try{return !storyOn()||STORY.cleared||STORY.done.has('m2')}catch(e){return true}}
/* r46: o outro personagem (ponto rosa no mapa, ped ocioso na rua) não existe durante missão nem antes da missão 2 liberar a troca */
function charOtherHidden(){try{return storyOn()&&(!!missionMode()||!!(typeof CAMP!=='undefined'&&CAMP.id)||!claireFree())}catch(e){return false}}
function plArrowCol(){return CHAR&&CHAR.cur===1?'#ff4fb8':'#ff3030'}
function charSelPaint(){const box=$('#chsel');if(!box)return;box.hidden=prologueLocked()||!claireFree();const storyBlocked=!storyOK('safe')||!claireFree(),locked=charLock();box.classList.toggle('vehicle',!!PL.car);box.classList.toggle('locked',locked);box.classList.toggle('story-locked',storyBlocked);box.setAttribute('aria-disabled',locked?'true':'false');box.tabIndex=locked?-1:0;box.classList.toggle('open',CHAR.open);box.querySelectorAll('.half').forEach((d,i)=>{d.classList.toggle('cur',CHAR.cur===i);d.classList.toggle('sel',CHAR.open&&CHAR.sel===i)});box.querySelector('.nm').textContent=CHAR.open?CHAR.list[CHAR.sel].name:CHAR.list[CHAR.cur].name}
function charOpen(src){if(ONLINE.on)return;if(prologueLocked())return;if(!storyOK('safe')||!claireFree())return;if((DUO.on&&PL.car===DUO.car)||(DUO.follow&&DUO.ped&&peds.includes(DUO.ped)&&!PL.car)){if(!PL.dead&&!menuOpen&&!PHONE.open&&!CAMHOP.on)duoSwap();return}if(charLock()&&played){toast(PL.inside==='jail'?'PRESO · NÃO DÁ PARA TROCAR DE PERSONAGEM':POL.wanted?'PROCURADO · NÃO DÁ PARA TROCAR DE PERSONAGEM':eventLock()&&eventLock()!=='INTERIOR'?'AGORA NÃO DÁ PARA TROCAR · '+eventLock():charLockWhy());return}if(!charCan())return;CHAR.open=true;CHAR.src=src;CHAR.sel=1-CHAR.cur;charSelPaint()}
function charClose(go){if(!CHAR.open)return;CHAR.open=false;charSelPaint();if(go&&CHAR.sel!==CHAR.cur)charSwitch(CHAR.sel)}
/* Persistência: quem sai fica onde estava (a pé, no carro, no helicóptero, na casa segura) por 5 h de jogo (15 min reais).
   Depois disso volta para a calçada da cidade inicial. Se o outro estiver em outro mundo, o jogo recarrega aquele mundo.
   Na casa segura, quem não está "em atividade" aparece lá dentro; trocar ali (ou com o outro a menos de 45 m) é na hora. */
const CHAR_TTL=300;
function gameMin(){return(DN.day||0)*1440+DN.tod}
function charWorld(){return{seed:S.seed,size:S.size,style:S.style,hh:HAZE.home?{...HAZE.home}:null}}
function charBase(){if(S.style==='haze'){const hm=HAZE.home||hazeHomeFallback();return{seed:hm.seed,size:hm.size,style:'modern',hh:null}}return{seed:S.seed,size:S.size,style:'modern',hh:null}}
function charFresh(c){return!!(c&&c.st&&gameMin()-c.st.at<=CHAR_TTL&&gameMin()>=c.st.at)}
// v281: Claire vive na cidade mesmo antes da primeira troca de personagem.
// A logica e os estados ja ficam em CHAR.list[1].st. O ped 3D so nasce
// quando o jogador chega perto (duoWorldTick), sem simular uma segunda cidade.
// 5 horas de jogo = 300 min de jogo = ~15 min reais (v3 r23). Nao realocar quando
// Claire esta com Nathan, em veiculo proprio ou em outro mundo.
const LUCIA_IDLE_INTERVAL=300;
function luciaIdlePlace(){
 const p=charSidewalk(true);
 return {at:gameMin(),world:charWorld(),x:p[0],z:p[1],safe:false,car:null,heli:null,
  look:{...(CHAR.list[1].look||LUCIA_PAL),pack:false},heading:Math.random()*Math.PI*2};
}
function luciaIdleTick(){
 if(!played||!city.ext||CHAR.cur===1||PROLOGUE.active||ONLINE.on||charOtherHidden()||DUO.on||DUO.follow||HAZE.switching||INVERT.switching||SWITCH.on||TIMEJUMP.busy||TIMEJUMP.loading)return;
 const c=CHAR.list[1],st=c.st;
 if(!st){c.st=luciaIdlePlace();return}
 // Nao deslocar a Claire que ficou num mundo diferente ou em um veiculo/heli.
 if(!st.world||st.world.seed!==S.seed||st.world.size!==S.size||st.world.style!==S.style||st.car||st.heli||st.safe)return;
 if(!Number.isFinite(st.x)||!Number.isFinite(st.z)||!Number.isFinite(st.at)){c.st=luciaIdlePlace();return}
 if(gameMin()-st.at>=LUCIA_IDLE_INTERVAL){c.st=luciaIdlePlace();duoWorldClear()}
}
function luciaMapPose(){
 if(!played||!city.ext||CHAR.cur===1||PROLOGUE.active||ONLINE.on||charOtherHidden())return null; // v78: na missão 1 a Claire está na história, sem ponto ocioso no mapa · se Claire for controlada, a seta vermelha ja e dela
 let x,z,ang=0;
 if(DUO.on&&DUO.car){x=DUO.car.x;z=DUO.car.z;ang=DUO.car.a}
 else if(DUO.follow&&DUO.ped&&peds.includes(DUO.ped)){
  x=DUO.ped.x;z=DUO.ped.z;ang=Math.atan2(DUO.ped.mz||0,DUO.ped.mx||1);
 }else if(SAFE.mate&&peds.includes(SAFE.mate)&&PL.inside===true&&city.safe){
  x=city.safe.x;z=city.safe.z;
 }else{
  const st=CHAR.list[1].st;if(!st||!st.world||st.world.seed!==S.seed||st.world.style!==S.style||st.world.size!==S.size)return null;
  if(st.safe&&city.safe){x=city.safe.x;z=city.safe.z}
  else if(st.car){x=st.car.x;z=st.car.z;ang=st.car.a||0}
  else if(st.heli){x=st.heli.x;z=st.heli.z;ang=st.heli.yaw||0}
  else{x=st.x;z=st.z;ang=st.heading||0}
 }
 if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 // Um interior no black hell deve aparecer na localizacao da porta, nunca fora da cidade.
 if((x<0||z<0||x>city.ext||z>city.ext)&&city.safe){x=city.safe.x;z=city.safe.z}
 return{x,z,ang};
}
function luciaMapArrow(g,x,y,scale=1,ang=0){
 g.save();g.translate(x,y);g.rotate(ang);g.scale(scale,scale);
 // Mesma silhueta e proporcao da seta vermelha do jogador; rosa para Claire.
 g.fillStyle='#ff63b5';g.strokeStyle='#1d0820';g.lineWidth=2/scale;
 g.beginPath();g.moveTo(8,0);g.lineTo(-6,-6);g.lineTo(-3,0);g.lineTo(-6,6);g.closePath();g.fill();g.stroke();g.restore();
}
function charSidewalk(far){const E=city.ext;for(let k=0;k<40;k++){const r=perim(rectNear(Math.random()*E,Math.random()*E)),p=perimPoint(r,Math.random()*400);if(!inWater(p[0],p[1])&&(!far||Math.hypot(p[0]-PL.x,p[1]-PL.z)>E*.25))return p}const r=perim(rectNear(E/2,E/2));return perimPoint(r,0)}
// Fotografa o que o personagem atual está fazendo e o "solta" no mundo.
function charLeave(){const c=PL.car,hl=PL.heli,st={at:gameMin(),world:charWorld(),x:PL.x,z:PL.z,safe:PL.inside===true,car:null,heli:null,look:{...PLAYER_PAL,pack:false}};
 if(c&&c.alive){st.car={ref:c,type:c.type,color:c.color,hp:c.hp,fuel:c.fuel,a:c.a,x:c.x,z:c.z,boat:!!c.t.boat};c.thr=0;c.hand=true;c.steerT=0;c.keep=true;PL.lastCar=c;PL.car=null;$('#speed').hidden=true;$('#carbar').hidden=true}
 if(hl){st.heli={ref:hl,x:hl.x,z:hl.z,y:hl.y,yaw:hl.yaw,phase:hl.phase==='ground'?'ground':'fly',landY:hl.landY,roofC:hl.roofC};HELI.cur=null;PL.heli=null;heliSnd(hl,false);hl.state='idle';hl.v=0}
 if(PARA.active&&PARA.active.roof){st.roof=PARA.active.s;paraTargetClear();PARA.active=null}
 if(PL.inside===true){safeMateClear();PL.inside=false;DOOR.from=null;if(city.safe){st.x=city.safe.x;st.z=city.safe.z}}
 if(POL.wanted)endWanted(true,true);WZ.list.length=0;return st}
// Coloca o personagem "to" no mundo atual, retomando o que fazia (tgt) ou na posição p.
function charEnter(to,tgt,p){maskInstantOff();try{for(const b of BAL.list.slice())if(b.o===PL)balDrop(b)}catch(e){} /* v78: pensamento do personagem anterior não passa pro próximo */if(DRUNK.coma<=0){DRUNK.t=0;DRUNK.level=0;DRUNK.drinks=0} /* v78: a bebedeira é de quem bebeu */PL.car=null;PL.heli=null;wearSwap(to);Object.assign(PLAYER_PAL,{long:false},(tgt&&tgt.look)||CHAR.list[to].look||{});PLAYER_PAL.pack=false;applyPlayerLook();
 PL.inside=false;PL.dead=false;PL.down=0;PL.rot=0;PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.sp.visible=true;PL.sh.visible=true;
 PL.x=p[0];PL.z=p[1];PL.gy=groundY(PL.x,PL.z);
 if(tgt&&tgt.car){let c=charUnstashCar(tgt.car.ref);if(!c||!vehicles.includes(c)){c=makeVehicle(tgt.car.type,tgt.car.x,tgt.car.z,tgt.car.a,tgt.car.color);c.hp=tgt.car.hp;if(typeof tgt.car.fuel==='number')c.fuel=tgt.car.fuel}
  if(c.alive){c.keep=false;c.sleep=false;c.hand=false;if(c.mode==='rail')toPhys(c);PL.car=c;PL.x=c.x;PL.z=c.z;PL.sp.visible=false;PL.sh.visible=false;$('#speed').hidden=false;$('#carbar').hidden=false}
  else{PL.x=c.x+3;PL.z=c.z;PL.gy=groundY(PL.x,PL.z)}}
 else if(tgt&&tgt.heli){let hl=tgt.heli.ref;if(!hl||!HELI.list.includes(hl)){hl={pad:{x:tgt.heli.x,z:tgt.heli.z,a:tgt.heli.yaw},id:'hx'+Date.now()};HELI.list.push(hl);heliSpawnAt(hl);hl.y=tgt.heli.y;hl.yaw=tgt.heli.yaw}
  if(hl.state==='idle'||hl.state==='parked'){hl.landY=tgt.heli.landY;hl.roofC=tgt.heli.roofC;heliBoard(hl);hl.phase=tgt.heli.phase;PL.x=hl.x;PL.z=hl.z;PL.gy=hl.y}}
 else if(tgt&&tgt.prologueJail){PROLOGUE.allowJail=true;try{jailEnter(true)}finally{PROLOGUE.allowJail=false}}
 else if(tgt&&tgt.safe&&city.safe){PL.x=city.safe.x;PL.z=city.safe.z;enterSafe()}
 else if(tgt&&tgt.roof){paraTargetClear();PARA.active={roof:true,s:tgt.roof,g:null,target:{x:1e9,z:1e9}};PL.gy=tgt.roof.y}
 // Restore room visibility first, then materialize the destination car before camera descent.
 roomStageSync();transitionPromptClear();if(PL.car){ensureDetail(PL.car);if(PL.car.g)PL.car.g.visible=true;syncCar(PL.car,0);convRiderTick();}
 camT.x=PL.x;camT.z=PL.z;chasePos.set(PL.x,PL.gy+30,PL.z+1);charFaces()}
function charSwitch(to){if(ONLINE.on)return;if(prologueLocked())return;if(!storyOK('safe')||!claireFree())return;if(charLock()&&played){toast(PL.inside==='jail'?'PRESO · NÃO DÁ PARA TROCAR DE PERSONAGEM':POL.wanted?'PROCURADO · NÃO DÁ PARA TROCAR DE PERSONAGEM':eventLock()&&eventLock()!=='INTERIOR'?'AGORA NÃO DÁ PARA TROCAR · '+eventLock():charLockWhy());return}if(to===CHAR.cur||!charCan())return;duoWorldClear();if(SPEC.on)specSet(false);
 const o=CHAR.list[to],fresh=charFresh(o),tgt=fresh?o.st:null;
 // Troca feita DENTRO da safehouse deve continuar dentro dela, mesmo que o
 // personagem de destino tenha uma posição exterior guardada (st.fresh).
 // O antigo ramo caia em charLeave/charSidewalk, teleportava para outra loja
 // e aplicava chasePos/groundY externos ao interior da casa.
 if(PL.inside===true&&SAFE.IN){
  const I=SAFE.IN,inside=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x-I.x)<4.3&&Math.abs(z-I.z)<3.4;
  const me=[inside(PL.x,PL.z)?PL.x:I.x,inside(PL.x,PL.z)?PL.z:I.z+1.3];
  const mate=SAFE.mate&&inside(SAFE.mate.x,SAFE.mate.z)?[SAFE.mate.x,SAFE.mate.z]:[I.x-2.4,I.z-1.2];
  const prev=CHAR.cur;CHAR.list[prev].look={...PLAYER_PAL,pack:false};safeMateClear();
  // Os dois agora estao na safehouse; estados antigos em outras areas nao sao
  // usados nem reativados por engano durante a troca.
  CHAR.list[prev].st=null;o.st=null;
  wearSwap(to);Object.assign(PLAYER_PAL,{long:false},o.look||{});PLAYER_PAL.pack=false;applyPlayerLook();
  PL.inside=true;PL.car=null;PL.heli=null;PL.x=mate[0];PL.z=mate[1];PL.gy=0;PL.jy=PL.jv=0;PL.vx=PL.vz=0;PL.sp.visible=true;PL.sh.visible=true;
  if(!DOOR.from||DOOR.from.interior!=='safe'||DOOR.from.seed!==S.seed){const q=city.safe;doorEnter('safe',city.haze?'safe:haze':'safe',{x:q.x+q.nx*2.3,z:q.z+q.nz*2.3},[q.nx,q.nz])}
  camT.x=PL.x;camT.z=PL.z;chasePos.set(clamp(PL.x+Math.sin(PL.yaw)*2.2,I.x-4.45,I.x+4.45),2.35,clamp(PL.z+Math.cos(PL.yaw)*2.2,I.z-3.45,I.z+3.45));
  safeMateSpawn(me);charFaces();camHopStart(me[0],me[1]);toast(o.name);return}
 const world=tgt?tgt.world:charBase(),same=world.seed===S.seed&&world.style===S.style;
 CHAR.list[CHAR.cur].look={...PLAYER_PAL,pack:false};
 // v77: origem da troca = onde o personagem ESTÁ agora (veículo/heli), não onde desceu a pé por último.
 const src0=PL.heli||PL.car||PL,from={x:Number.isFinite(src0.x)?src0.x:PL.x,z:Number.isFinite(src0.z)?src0.z:PL.z};
 const me=charLeave();CHAR.list[CHAR.cur].st=me;
 if(!same){void charWorldJump(to,tgt,world);return}
 const p=tgt?[tgt.heli?tgt.heli.x:tgt.car?tgt.car.x:tgt.x,tgt.heli?tgt.heli.z:tgt.car?tgt.car.z:tgt.x!=null?tgt.z:0]:charSidewalk(true);
 if(Math.hypot(p[0]-from.x,p[1]-from.z)<45){const priorCamera=camera.position.clone();charEnter(to,tgt,p);chasePos.copy(priorCamera);camHopStart(from.x,from.z);toast(o.name);return}
 SWITCH.on=true;SWITCH.t=0;SWITCH.to=to;SWITCH.tgt=tgt;SWITCH.done=false;SWITCH.a=[from.x,from.z];SWITCH.b=[p[0],p[1]];SWITCH.h0=Math.max(25,camera.position.y);SWITCH.H=city.haze?55:clamp(STYLES[S.style].fogFar*.55,90,300);
 SWITCH.srcPos=camera.position.clone();SWITCH.srcQuat=camera.quaternion.clone();
 SWITCH.srcNadir=camNadirPitch(SWITCH.srcQuat);switchCameraPrepare(); // mesma inclinacao SEM giro lateral da troca curta aprovada
 // Conserva o azimute da camera real no ceu; nao realinha ao norte (v283).
}
async function charWorldJump(to,tgt,world){HAZE.switching=true;const loading=$('#loading'),fade=$('#timeFade');const keep=CHAR.list.map(c=>c.st),looks=CHAR.list.map(c=>c.look);
 try{const snap=buildSave();musicTravelOut();snap.car=null;snap.wantedZones=[];snap.seed=world.seed;snap.size=world.size;snap.style=world.style;
  await camSky(true);timeFadeTo(true);await delayTimeJump(650);loading.hidden=false;setLoadProgress(10,'TROCANDO PARA '+CHAR.list[to].name+'…');await nextTimeFrame();fade.hidden=true;fade.style.opacity='0';
  HAZE.home=world.hh||null;S.seed=world.seed;S.size=world.size;S.style=world.style;clearRiverBoats();await generateCity();initRiverBoats();applyShadows();setLoadProgress(60,STYLES[S.style].label);await nextTimeFrame();await warmCityGPU();
  applySave(snap);CHAR.list.forEach((c,i)=>{c.st=keep[i];c.look=looks[i]});
  const p=tgt&&tgt.x!=null?[tgt.heli?tgt.heli.x:tgt.car?tgt.car.x:tgt.x,tgt.heli?tgt.heli.z:tgt.car?tgt.car.z:tgt.z]:charSidewalk(false);
  charEnter(to,tgt,p);updateDayNight(0,true);syncMenu();setLoadProgress(100,STYLES[S.style].label);fade.hidden=false;fade.style.transition='none';fade.style.opacity='1';await nextTimeFrame();loading.hidden=true;musicTravelIn();updateCamera(0);await nextTimeFrame();camSkyStart(false);fade.style.transition='opacity .6s ease-in-out';fade.style.opacity='0';await delayTimeJump(650);fade.hidden=true;await camSkyWait();toast(CHAR.list[to].name+'<br><small style="font-size:11px;color:#fff">'+STYLES[S.style].label+'</small>')}
 catch(err){musicTravelReset();console.error('Troca de personagem:',err);loading.hidden=true;fade.hidden=true;fade.style.opacity='0';toast('ERRO NA TROCA · VEJA O CONSOLE')}finally{HAZE.switching=false}}
// Personagem parado dentro da casa segura (o outro, quando não está em atividade).
function safeMateClear(){if(SAFE.mate){removePed(SAFE.mate);SAFE.mate=null}}
function safeMateSpawn(at,force=false){safeMateClear();if(ONLINE.on||!claireFree())return;const o=CHAR.list[1-CHAR.cur];if(!SAFE.IN||(charFresh(o)&&!force))return;const IN=SAFE.IN,x=at?at[0]:IN.x-2.4,z=at?at[1]:IN.z-1.2;
 const q=spawnPed(null,{x,z,vx:0,vz:0,main:true,pal:{...(o.look||LUCIA_PAL),pack:false}});if(!q)return;q.state='clerk';q.fixed=true;q.mx=force?PL.x-x:0;q.mz=force?PL.z-z:1;q.timer=0;q.mate=true;SAFE.mate=q}
// Same local pitch arc as CAMHOP, followed by strictly vertical sky legs.
function switchCameraPrepare(){const h=SWITCH;
 // Both campaign and free roam enter through this same preparation.
 const e=new THREE.Euler().setFromQuaternion(h.srcQuat,'YXZ');e.z=0;h.srcYaw=e.y;
 h.srcQuat.setFromEuler(e);h.srcNadir=camNadirPitch(h.srcQuat);

 h.srcFov=camera.fov;h.srcNear=camera.near;h.dest=null;
 h.h0=Math.max(h.srcPos.y+9,groundY(h.a[0],h.a[1])+10);
 h.H=Math.max(h.H,h.h0+35,(h.tgt?.heli?.y||h.tgt?.roof?.y||groundY(h.b[0],h.b[1]))+100);
}
function switchCameraDestination(){const h=SWITCH;
 const pos=camera.position.clone(),quat=camera.quaternion.clone(),up=camera.up.clone(),fov=camera.fov,near=camera.near;
 h.done=true;charEnter(h.to,h.tgt,h.b);h.b=[PL.x,PL.z];camH=46;
 // v77 (estilo GTA V): a pé, o personagem de destino herda o azimute da câmera de origem;
 // assim o voo inteiro acontece sem giro no eixo vertical.
 if(!PL.car&&!PL.heli&&camMode==='fps'&&Number.isFinite(h.srcYaw)){PL.yaw=h.srcYaw;PL.face=[-Math.sin(h.srcYaw),-Math.cos(h.srcYaw)];chasePos.set(PL.x+Math.sin(PL.yaw)*4.4,PL.gy+2.9,PL.z+Math.cos(PL.yaw)*4.4)}
 h.on=false;try{updateCamera(0,true)}finally{h.on=true}
 h.dest={pos:camera.position.clone(),quat:camera.quaternion.clone(),up:camera.up.clone(),fov:camera.fov,near:camera.near};
 h.dest.nadir=camNadirPitch(h.dest.quat);
 h.dest.low=Math.max(h.dest.pos.y+9,(PL.gy||0)+10);

 camera.position.copy(pos);camera.quaternion.copy(quat);camera.up.copy(up);setLens(fov,near);
}
function switchCam(dt){const h=SWITCH;h.t+=Math.max(0,dt);const t=h.t,ss=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
 const T0=.8,T1=T0+1.2,T2=T1+1.8,T3=T2+1.2,T4=T3+.8;
 if(t>=T1&&!h.done)switchCameraDestination();
 if(t<T0){const k=ss(t/T0);
  // Half of the nearby swap: curve toward the character while pitching down.
  _hopPos.set(h.a[0],h.h0,h.a[1]);camera.position.copy(h.srcPos).lerp(_hopPos,k);
  camera.quaternion.copy(h.srcQuat).slerp(h.srcNadir,k);
  setLens(h.srcFov+(50-h.srcFov)*k,h.srcNear+(1-h.srcNear)*k);
 }else if(t<T1){const k=ss((t-T0)/(T1-T0));
  camera.position.set(h.a[0],h.h0+(h.H-h.h0)*k,h.a[1]);
  camera.quaternion.copy(h.srcNadir);setLens(50,1);
 }else if(t<T2){const k=ss((t-T1)/(T2-T1));
  camera.position.set(h.a[0]+(h.b[0]-h.a[0])*k,h.H,h.a[1]+(h.b[1]-h.a[1])*k);
  // v77: sem giro no voo; mantém o azimute de origem (GTA V).
  camera.quaternion.copy(h.srcNadir);setLens(50,1);
 }else if(t<T3){const k=ss((t-T2)/(T3-T2));
  camera.position.set(h.b[0],h.H+(h.dest.low-h.H)*k,h.b[1]);
  camera.quaternion.copy(h.srcNadir);setLens(50,1);
 }else{const k=ss((t-T3)/(T4-T3)),d=h.dest;
  _hopPos.set(h.b[0],d.low,h.b[1]);camera.position.copy(_hopPos).lerp(d.pos,k);
  camera.quaternion.copy(h.srcNadir).slerp(d.quat,k);camera.up.copy(d.up);
  setLens(50+(d.fov-50)*k,1+(d.near-1)*k);
  if(t>=T4){h.on=false;chasePos.copy(d.pos);camT.x=PL.x;camT.z=PL.z;camH=46;toast(CHAR.list[CHAR.cur].name)}
 }
 sky.position.copy(camera.position);
}
function specOk(){return CHAR.cur===0?(GUN.has&&(!PL.car||duoShooter())&&!PL.heli&&!PL.dead&&!PL.inside):(!!PL.car&&!PL.dead&&!duoShooter())}
// v77: na história, os especiais nascem travados; a missão 1 libera (Claire ao volante após a fuga, Nathan na cena do motel)
function specUnlocked(i){return !storyOn()||STORY.cleared||STORY.done.has('pier')||STORY.unl.has(i===0?'specN':'specC')}
function specKey(){return PAD.on?'L3 + R3':TOUCH.on?'o botão ESPECIAL':'CAPS LOCK'}
function specSet(on){if(on&&!specUnlocked(CHAR.cur)){toast(CHAR.cur===0?'BULLET TIME AINDA BLOQUEADO':'CÂMERA LENTA AINDA BLOQUEADA');return}if(on&&(!specOk()||CHAR.list[CHAR.cur].sp<.03)){toast(CHAR.cur===0?'BULLET TIME: A PÉ OU DE CARONA, COM ARMA NA MÃO':'CÂMERA LENTA: SÓ DIRIGINDO');return}SPEC.on=on;$('#spbar').classList.toggle('on',on)}
function specTick(dt){const c=CHAR.list[CHAR.cur];if(SPEC.on){c.sp=Math.max(0,c.sp-dt/10);if(c.sp<=0||!specOk()||SWITCH.on)specSet(false)}else c.sp=Math.min(1,c.sp+dt/180);
 const o=CHAR.list[1-CHAR.cur];o.sp=Math.min(1,o.sp+dt/180);SPEC.ts+=((SPEC.on?.4:1)-SPEC.ts)*Math.min(1,dt*6);$('#spbar u').style.width=(c.sp*100).toFixed(1)+'%';const sb=$('#spbar');if(sb){const lk=!specUnlocked(CHAR.cur),v=lk?'hidden':'';if(sb.style.visibility!==v){sb.style.visibility=v;const ab=$('#armbar');if(ab){ab.style.left=lk?'0':'';ab.style.width=lk?'100%':''}}}} // v78: especial bloqueado → a faixa some e o colete ocupa a largura toda (antes sobrava vermelho da vida no lugar)
/* v78 · efeito visual dos especiais.
   1) Filtro VINTAGE (o mesmo do modo foto) enquanto câmera lenta (Claire) ou bullet time (Nathan / cena do motel) estão
      ativos, com transição suave (~1 s) entrando e saindo. Não mexe no canvas enquanto o modo foto está aberto.
   2) Rastro da câmera lenta da Claire: duas fitas cruzadas (largura e ~55% da altura do veículo EM USO, de c.t.W/c.t.H)
      saindo da traseira, brilho aditivo ciano→rosa que afina e apaga com a idade. Malha própria, solta do carro:
      funciona com qualquer veículo e continua sumindo suavemente depois que o especial acaba. */
const SLOWFX={w:0,applied:'',cine:false,trail:null};
function slowFxFilter(w){if(w<.004)return '';const f=v=>+v.toFixed(3);
 return 'sepia('+f(.35*w)+') saturate('+f(1-.2*w)+') contrast('+f(1-.08*w)+') brightness('+f(1+.08*w)+') hue-rotate('+f(-8*w)+'deg)'}
function slowTrailInit(){const N=56,geo=new THREE.BufferGeometry(),pos=new Float32Array(N*4*3),col=new Float32Array(N*4*3),idx=[];
 for(let i=0;i<N-1;i++){const a=i*4,b=(i+1)*4;idx.push(a,a+1,b,a+1,b+1,b, a+2,a+3,b+2,a+3,b+3,b+2)}
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage));geo.setIndex(idx);geo.setDrawRange(0,0);
 const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 mesh.frustumCulled=false;mesh.renderOrder=6;scene.add(mesh);return SLOWFX.trail={mesh,geo,pos,col,N,pts:[],maxAge:.85}}
const _trCA=new THREE.Color('#3ee8ff'),_trCB=new THREE.Color('#ff3ec8'),_trC=new THREE.Color();
function slowFxTick(dt){
 // --- filtro ---
 const want=(SPEC.on&&running&&!PL.dead)||SLOWFX.cine;
 SLOWFX.w+=((want?1:0)-SLOWFX.w)*Math.min(1,dt*2.6);if(!want&&SLOWFX.w<.004)SLOWFX.w=0;
 if(typeof PHOTO!=='undefined'&&PHOTO.on)SLOWFX.applied='(foto)'; // o modo foto manda no filtro; ao sair, reaplica
 else{const css=slowFxFilter(SLOWFX.w);if(css!==SLOWFX.applied){canvas.style.filter=css;SLOWFX.applied=css}}
 // --- rastro ---
 const T=SLOWFX.trail||slowTrailInit(),c=PL.car,paused=menuOpen||!running;
 if(!paused){for(const p of T.pts)p.age+=dt;while(T.pts.length&&T.pts[0].age>T.maxAge)T.pts.shift()}
 const emit=!paused&&SPEC.on&&CHAR.cur===1&&c&&c.alive!==false&&!PL.inside;
 if(emit){const ca=Math.cos(c.a),sa=Math.sin(c.a),L=c.t.L||4.4,W=(c.t.W||1.9)*.92,H=(c.t.H||1.4)*.55,y=(c.gy||0)+(c.airY||0)+(c.t.H||1.4)*.5;
  const x=c.x-ca*(L*.5+.15),z=c.z-sa*(L*.5+.15),last=T.pts[T.pts.length-1]; // 15 cm atrás do para-choque (não pinta a traseira)
  if(!last||Math.hypot(x-last.x,z-last.z)>.18||last.age>.06){T.pts.push({x,z,y,rx:-sa,rz:ca,W,H,age:0});if(T.pts.length>T.N)T.pts.shift()}
  else{last.x=x;last.z=z;last.y=y;last.rx=-sa;last.rz=ca}}
 const n=T.pts.length;T.mesh.visible=n>1;if(n<2){T.geo.setDrawRange(0,0);return}
 const P=T.pos,C=T.col;
 for(let i=0;i<n;i++){const p=T.pts[i],k=Math.max(0,1-p.age/T.maxAge),taper=Math.sqrt(k),hw=p.W*.5*taper,hh=p.H*.5*taper,o=i*12,g=k*(i===n-1&&emit?0:.8);
  P[o]=p.x-p.rx*hw;P[o+1]=p.y;P[o+2]=p.z-p.rz*hw; P[o+3]=p.x+p.rx*hw;P[o+4]=p.y;P[o+5]=p.z+p.rz*hw;
  P[o+6]=p.x;P[o+7]=p.y-hh;P[o+8]=p.z; P[o+9]=p.x;P[o+10]=p.y+hh;P[o+11]=p.z;
  _trC.copy(_trCA).lerp(_trCB,1-k).multiplyScalar(g);for(let v=0;v<4;v++){C[o+v*3]=_trC.r;C[o+v*3+1]=_trC.g;C[o+v*3+2]=_trC.b}}
 T.geo.attributes.position.needsUpdate=T.geo.attributes.color.needsUpdate=true;T.geo.setDrawRange(0,(n-1)*12)}
// Colete: absorve o dano antes da vida.
function armorHit(d){d=+d||0;const a=Math.min(PL.armor||0,Math.max(0,d));PL.armor=(PL.armor||0)-a;return d-a}
// Altura do telhado de um prédio (colisor 'bld'): a dos prédios comuns vem da geração; a dos demais sai de
// um raio de cima para baixo no chunk (feito uma vez por prédio e guardado).
const _rcR=new THREE.Raycaster(),_rcO=new THREE.Vector3(),_rcD=new THREE.Vector3(0,-1,0);
function roofTop(c){if(c.top!=null)return c.top;const k=chunkOf((c.x0+c.x1)/2,(c.z0+c.z1)/2),ch=city.chunks.get(k[0]+','+k[1]);let best=null;
 if(ch)for(const[u,v] of [[.3,.3],[.7,.7],[.3,.7],[.7,.3]]){_rcO.set(c.x0+(c.x1-c.x0)*u,400,c.z0+(c.z1-c.z0)*v);_rcR.set(_rcO,_rcD);_rcR.far=420;const hit=_rcR.intersectObject(ch.group,true).find(q=>q.object.isMesh&&q.object.visible);if(hit)best=best===null?hit.point.y:Math.min(best,hit.point.y)}
 c.top=best===null?3:best;return c.top}
function bldAt(x,z,pad=0){return query(x,z,2).find(b=>!b.dead&&b.kind==='bld'&&x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad)||null}
// Telhado vira um "terraço": dá para andar, embarcar no helicóptero e saltar de paraquedas pelas bordas.
function roofSite(c){const y=roofTop(c);return{x0:c.x0+.6,z0:c.z0+.6,x1:c.x1-.6,z1:c.z1-.6,y,x:(c.x0+c.x1)/2,z:(c.z0+c.z1)/2,landings:[{x:1e9,z:1e9}],free:true}}
function standOnRoof(c){const s=roofSite(c);paraTargetClear();PARA.active={roof:true,s,g:null,target:{x:1e9,z:1e9}};PL.gy=s.y;PL.jy=PL.jv=0;PL.x=clamp(PL.x,s.x0,s.x1);PL.z=clamp(PL.z,s.z0,s.z1)}
/* ================= TÁXI =================
   G (teclado) ou ↑ no direcional (controle, a pé): chama o táxi mais próximo do quarteirão. Ele vem até você e encosta.
   Segure F (ou Y/△) para entrar como passageiro; um toque rápido continua roubando o carro, como em GTA.
   O mapa abre: marque o destino (botão direito / toque longo; no controle, analógico move a mira e A/✕ marca, B/○ fecha).
   A corrida cobra $5 de bandeirada + $1 a cada 10 m. Sem dinheiro, sem corrida. F desce e encerra a corrida. */
const TAXI={c:null,state:null,hold:0,src:null,paid:0,acc:0,lx:0,lz:0,waitT:0,fromPhone:false,skipping:false};
function taxiFree(c){return c&&c.alive&&c.type==='taxi'&&c!==PL.car&&c.taxiFreeLit===true&&!c.chase&&!c.police&&!c.keep&&vehicles.includes(c)}
function taxiCall(phone){if(!played||PL.car||PL.heli||PL.dead||PL.inside||PARA.active||TVM.on||TAXI.c)return;if(POL.wanted){toast('NENHUM TÁXI ATENDE ALGUÉM PROCURADO!');return}
 if((PL.money||0)<5){toast('SEM DINHEIRO PARA O TÁXI<br><small style="font-size:11px;color:#fff">a corrida custa $5 + $1 a cada 10 m</small>');return}
 let best=null,bd=phone?420:P*1.6;for(const c of vehicles){if(!taxiFree(c))continue;const d=Math.hypot(c.x-PL.x,c.z-PL.z);if(d<bd){bd=d;best=c}}if(!best&&phone){best=svcSpawn('taxi');if(best)best.taxiFreeLit=true;}
 if(!best){toast('NENHUM TÁXI POR PERTO');return}
 if(best.mode==='rail')toPhys(best);best.ai=null;best.taxiAI=true;best.sleep=false;best.hand=false;best.path=null;best.pathT=0;best.stuckT=0;best.revT=0;TAXI.c=best;TAXI.state='call';TAXI.waitT=0;TAXI.cp=null;TAXI.dp=null;TAXI.dm=null;TAXI.nearT=0;TAXI.fromPhone=!!phone;TAXI.skipping=false;best.taxiFreeLit=true;taxiSignVisual(best);
 toast('TÁXI A CAMINHO')}
function taxiEnd(msg){const c=TAXI.c;if(c){c.taxiAI=false;c.thr=0;c.hand=true;c.steerT=0;c.taxiFreeLit=!!c.alive}if(PL.taxi){const ca=Math.cos(c.a),sa=Math.sin(c.a);PL.taxi=null;PL.x=c.x+sa*(c.t.W/2+1);PL.z=c.z-ca*(c.t.W/2+1);PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z}
 TAXI.c=null;TAXI.state=null;TAXI.hold=0;TAXI.cp=null;TAXI.dp=null;TAXI.dm=null;TAXI.fromPhone=false;if(c)taxiSignVisual(c);if(msg)toast(msg)}
// Dirige até (tx,tz) pelas ruas (mesma lógica de rota da polícia), sem pressa; retorna true ao chegar.
function taxiDrive(c,dt,tx,tz,stop,capFar){c.sleep=false;const dist=Math.hypot(tx-c.x,tz-c.z);if(dist<35){c.nearT=(c.nearT||0)+dt;if(c.nearT>6){c.nearT=0;c.thr=0;c.hand=true;return true}}else c.nearT=0;if(dist<stop){c.thr=Math.abs(c.fwd)>.5?-.6:0;c.hand=true;c.steerT=0;return Math.abs(c.fwd)<1.2}
 let wx=tx,wz=tz,turnAhead=0;const ca=Math.cos(c.a),sa=Math.sin(c.a);
 if(dist>30){c.pathT-=dt;if(c.pathT<=0||!c.path||!c.path.length){c.pathT=.8;const a=aheadNode(c);c.path=bfsNext(a,nodeOf(tx,tz))||[a]}
  while(c.path.length){const n=c.path[0],ex=n[0]*P-c.x,ez=n[1]*P-c.z,d=Math.hypot(ex,ez);if(d<7||(d<22&&ex*ca+ez*sa<0))c.path.shift();else break}
  if(c.path.length){const n=c.path[0];wx=n[0]*P;wz=n[1]*P;if(c.path.length>1){const m=c.path[1],ax=n[0]*P-c.x,az=n[1]*P-c.z,bx=m[0]-n[0],bz=m[1]-n[1],la=Math.hypot(ax,az)||1;turnAhead=Math.abs((ax*bz-az*bx)/la)>.5&&la<34?1:0}}}
 if(dist<=30&&groundY(tx,tz)>0){const kx=Math.round(tx/P),kz=Math.round(tz/P);if(Math.abs(tx-kx*P)<Math.abs(tz-kz*P)){wx=kx*P;wz=tz}else{wx=tx;wz=kz*P}}
 const ex=wx-c.x,ez=wz-c.z,lx=ex*ca+ez*sa,lz=-ex*sa+ez*ca,ang=Math.atan2(lz,lx);
 if(c.revT>0){c.revT-=dt;c.thr=-1;c.steerT=-(Math.sign(ang)||1);c.hand=false;return false}
 c.steerT=clamp(ang/(c.t.steer*.75),-1,1);const sp=c.fwd,cap=dist<40?(capFar>20?capFar*.55:7):(capFar||15);
 c.thr=Math.abs(ang)>1.4?.35:(turnAhead&&sp>10)||sp>cap?-.4:.8;c.hand=Math.abs(ang)>1.0&&sp>9;
 if(sp<1.5&&c.thr>0){c.stuckT+=dt;if(c.stuckT>1.5){c.revT=.9;c.stuckT=0}}else c.stuckT=Math.max(0,c.stuckT-dt*2);return false}
// Ponto da rua mais próximo (faixa junto à calçada), para o táxi encostar.
function curbPoint(x,z){const kx=Math.round(x/P),kz=Math.round(z/P),dx=x-kx*P,dz=z-kz*P;if(Math.abs(dx)<Math.abs(dz))return[kx*P+Math.sign(dx||1)*4.2,z];return[x,kz*P+Math.sign(dz||1)*4.2]}
function taxiAI(c,dt){if(c!==TAXI.c||!c.alive){c.taxiAI=false;if(c===TAXI.c)taxiEnd('O TÁXI FOI DESTRUÍDO');return}
 if(TAXI.state==='call'){TAXI.waitT+=dt;const cp=TAXI.cp||(TAXI.cp=curbPoint(PL.x,PL.z));if(Math.hypot(cp[0]-PL.x,cp[1]-PL.z)>14)TAXI.cp=null;if(taxiDrive(c,dt,cp[0],cp[1],6)){TAXI.state='wait';TAXI.cp=null;say(c,SAY.taxi,3);toast('TÁXI CHEGOU')}else if(TAXI.waitT>90)taxiEnd('O TÁXI DESISTIU')}
 else if(TAXI.state==='wait'){c.thr=0;c.hand=true;c.steerT=0;if(Math.hypot(PL.x-c.x,PL.z-c.z)>60)taxiEnd('O TÁXI FOI EMBORA')}
 else if(TAXI.state==='dest'){c.thr=0;c.hand=true;c.steerT=0;if(NAV.marker&&!NAV.misMarker)taxiBeginRide()}
 else if(TAXI.state==='ride'){if(!NAV.marker){taxiEnd('CHEGAMOS · TOTAL $'+TAXI.paid);return}
  if(!TAXI.dp||TAXI.dm!==NAV.marker){TAXI.dm=NAV.marker;TAXI.dp=curbPoint(NAV.marker.x,NAV.marker.z)}const arrived=taxiDrive(c,dt,TAXI.dp[0],TAXI.dp[1],8);
  TAXI.acc+=Math.hypot(c.x-TAXI.lx,c.z-TAXI.lz);TAXI.lx=c.x;TAXI.lz=c.z;while(TAXI.acc>=10){TAXI.acc-=10;if((PL.money||0)<1){taxiEnd('SEM DINHEIRO · FIM DA CORRIDA');return}money(-1);TAXI.paid++}
  if(arrived){NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;taxiEnd('CHEGAMOS · TOTAL $'+TAXI.paid)}}}
// Transição explicitamente acionada pelo marcador, sem precisar clicar no canvas para iniciar.
function taxiBeginRide(){const c=PL.taxi;if(!c||c!==TAXI.c||!NAV.marker||NAV.misMarker)return;
 const starting=TAXI.state!=='ride';TAXI.state='ride';TAXI.dp=null;TAXI.dm=null;TAXI.lx=c.x;TAXI.lz=c.z;
 c.path=null;c.pathT=0;c.nearT=0;c.stuckT=0;c.revT=0;c.hand=false;c.sleep=false;
 if(NAV.open)closeMap();
 if(starting)toast('A CAMINHO DO DESTINO<br><small style="font-size:11px;color:#fff">F desce · T / ↓ pula a viagem · mouse/analógico direito gira a câmera</small>');
}
async function taxiSkip(){const c=PL.taxi;if(!c||TAXI.skipping)return;if(TAXI.state==='dest'&&NAV.marker&&!NAV.misMarker)taxiBeginRide();if(TAXI.state!=='ride'||!NAV.marker){toast('MARQUE O DESTINO NO MAPA PRIMEIRO');return}TAXI.skipping=true;const fade=$('#timeFade');timeFadeTo(true);await delayTimeJump(650);
 try{const dp=TAXI.dp||curbPoint(NAV.marker.x,NAV.marker.z),fare=Math.max(1,Math.round(Math.hypot(dp[0]-c.x,dp[1]-c.z)/10));if(c.mode==='rail')toPhys(c);c.x=dp[0];c.z=dp[1];c.vx=c.vz=0;c.fwd=0;c.sleep=false;PL.x=c.x;PL.z=c.z;camT.x=c.x;camT.z=c.z;chasePos.set(c.x-Math.cos(c.a)*9,4,c.z-Math.sin(c.a)*9);
  const pay=Math.min(fare,PL.money||0);if(pay>0)money(-pay);TAXI.paid+=pay;NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;taxiEnd('VIAGEM PULADA · CHEGAMOS · TOTAL $'+TAXI.paid)}catch(e){console.error(e)}
 fade.style.opacity='0';await delayTimeJump(650);fade.hidden=true;TAXI.skipping=false}
function taxiBoard(){const c=TAXI.c;if(!c||TAXI.state!=='wait')return;if((PL.money||0)<5){toast('SEM DINHEIRO PARA A BANDEIRADA ($5)');return}money(-5);TAXI.paid=5;TAXI.acc=0;
 PL.taxi=c;PL.sp.visible=false;PL.sh.visible=false;PL.vx=PL.vz=0;TAXI.state='dest';taxiSignVisual(c);if(RADIO.list.length)RADIO.lastCar=c;
 if(NAV.marker&&!NAV.misMarker)taxiBeginRide()
 else{openMap();NAV.cur={x:PL.x,z:PL.z};toast('MARQUE O DESTINO NO MAPA<br><small style="font-size:11px;color:#fff">botão direito / toque longo · controle: analógico + A</small>')}}
// segurar F perto do táxi parado = passageiro; toque rápido = comportamento normal
function taxiHoldStart(src){const c=TAXI.c;if(!c||TAXI.state!=='wait'||PL.car||PL.taxi||Math.hypot(c.x-PL.x,c.z-PL.z)>9)return false;TAXI.hold=performance.now();TAXI.src=src;return true}
function taxiTick(dt){if(TAXI.hold){const held=TAXI.src==='kb'?keys.KeyF:(PAD.prev&&PAD.prev[3]);const t=performance.now()-TAXI.hold;
  if(t>=450){TAXI.hold=0;taxiBoard()}else if(!held){TAXI.hold=0;enterExit();radioKick()}}
 if(TAXI.c&&(!vehicles.includes(TAXI.c)||!TAXI.c.alive))taxiEnd(PL.taxi?'O TÁXI FOI DESTRUÍDO':null)}
function taxiPlayer(dt){const c=PL.taxi;if(!c)return false;PL.x=c.x;PL.z=c.z;PL.gy=c.gy||.2;PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;return true}
/* ================= CÃES E GATOS =================
   Sprites 2D no mesmo estilo dos pedestres (quadros 32x24, 4 direções x 3 passos, contorno escuro).
   Gatos: becos (comuns). Cães: quintais das casas e areia da praia. Os dois aparecem raramente nas calçadas.
   Andam devagar perto de onde surgiram, fogem de quem chega correndo e podem ser atropelados. */
const ANIM={list:[],t:0,cache:new Map()};
const DOG_COLS=[['#a86b3c','#7a4a24'],['#e8d8b8','#c8b48e'],['#2a2220','#1a1414'],['#d8a060','#b07a40'],['#f2f0ea','#c8c4b8'],['#6a5a4a','#4a3a2e']],CAT_COLS=[['#f08a2a','#c86a14'],['#3a3a3e','#1e1e22'],['#ececea','#c4c4c0'],['#8a8a92','#606068'],['#c8a070','#9a7448']];
function drawAnimalFrame(g,dir,fr,kind,c,d){const px=(x,y,w,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,w,hh)},eye='#141018',dog=kind==='dog';
 if(dir===2){// perfil olhando para a esquerda
  const lg=fr===1?[0,1,0,1]:fr===2?[1,0,1,0]:[0,0,0,0];
  if(dog){px(9,9,14,7,c);px(9,14,14,2,d);[10,13,19,22].forEach((x,i)=>px(x-lg[i],16,2,5,i%2?d:c));px(3,5,8,7,c);px(1,8,3,3,c);px(1,8,1,1,'#111');px(8,3,3,5,d);px(5,7,1,1,eye);px(23,7,2,2,c);px(24,5,2,2,c)}
  else{px(10,11,12,5,c);px(10,14,12,1,d);[11,13,19,21].forEach((x,i)=>px(x-lg[i],16,1,5,i%2?d:c));px(4,7,7,6,c);px(4,5,2,2,c);px(8,5,2,2,c);px(5,9,1,1,'#3a8a3a');px(4,11,1,1,'#e88aa0');px(22,6,2,6,c);px(23,4,2,2,c)}}
 else if(dir===0){// de frente
  const lo=fr===1?1:fr===2?-1:0;
  if(dog){px(11,11,10,8,c);px(12,19+lo,2,4,d);px(18,19-lo,2,4,d);px(11,3,10,8,c);px(9,4,3,5,d);px(20,4,3,5,d);px(13,6,2,2,eye);px(17,6,2,2,eye);px(14,9,4,2,d);px(15,9,2,1,'#111')}
  else{px(12,12,8,7,c);px(13,19+lo,2,4,d);px(17,19-lo,2,4,d);px(11,5,10,8,c);px(11,3,2,3,c);px(19,3,2,3,c);px(13,8,2,2,'#3a8a3a');px(17,8,2,2,'#3a8a3a');px(15,10,2,1,'#e88aa0')}}
 else{// de costas
  const lo=fr===1?1:fr===2?-1:0;
  if(dog){px(11,9,10,10,c);px(12,19+lo,2,4,d);px(18,19-lo,2,4,d);px(11,3,10,7,c);px(9,4,3,5,d);px(20,4,3,5,d);px(15,5,2,5,c);px(15,1,2,4,c)}
  else{px(12,10,8,9,c);px(13,19+lo,2,4,d);px(17,19-lo,2,4,d);px(11,4,10,7,c);px(11,2,2,3,c);px(19,2,2,3,c);px(15,1,2,9,d)}}}
function animalTex(kind,ci){const key=kind+ci;let cv0=ANIM.cache.get(key);if(!cv0){const[c,d]=(kind==='dog'?DOG_COLS:CAT_COLS)[ci];cv0=cv(128,96);const ag=cv0.getContext('2d');
  for(let dd=0;dd<4;dd++)for(let f=0;f<3;f++){const t=cv(32,24),tg=t.getContext('2d',{willReadFrequently:true});drawAnimalFrame(tg,dd===3?2:dd,f,kind,c,d);
   const id=tg.getImageData(0,0,32,24),a=id.data,o=new Uint8ClampedArray(a);for(let y=0;y<24;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(a[i+3])continue;const n=(xx,yy)=>xx>=0&&xx<32&&yy>=0&&yy<24&&a[(yy*32+xx)*4+3]>0;if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1)){o[i]=18;o[i+1]=12;o[i+2]=26;o[i+3]=255}}
   id.data.set(o);tg.putImageData(id,0,0);if(dd===3){ag.save();ag.translate(f*32+32,dd*24);ag.scale(-1,1);ag.drawImage(t,0,0);ag.restore()}else ag.drawImage(t,f*32,dd*24)}ANIM.cache.set(key,cv0)}
 const t=new THREE.CanvasTexture(cv0);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(32/128,24/96);return t}

/* ================= v227: CARAMELO & GATINHO (SPRITES EXISTENTES) ================= */
const PET={dog:null,cat:null,adopted:false,catCi:0,smsSent:false,speechT:0};
function petFree(){return GAMEMODE==='free'&&!city.haze&&S.style!=='inverted'}
function petDestroy(sp){if(!sp)return;scene.remove(sp);sp.material.map.dispose();sp.material.dispose()}
function petsClear(){petDestroy(PET.dog);petDestroy(PET.cat);PET.dog=PET.cat=null}
function petNew(kind,ci){const tex=animalTex(kind,ci),sp=makeActorLitSprite(tex);sp.scale.set(kind==='dog'?1.4:1.05,kind==='dog'?1.06:.79,1);sp.userData.petTex=tex;return sp}
function petNearCat(){if(!petFree()||PET.adopted||PL.dead||PL.inside||PL.car||PL.heli||Math.hypot(PL.vx||0,PL.vz||0)>1.35)return null;
 let best=null,dd=2.25;for(const a of ANIM.list){if(a.kind!=='cat'||a.home!=='alley'||a.dead||a.onBin||a.flee>0)continue;const d=Math.hypot(PL.x-a.x,PL.z-a.z);if(d<dd){best=a;dd=d}}return best}
function petAdopt(){const a=petNearCat();if(!a)return false;PET.adopted=true;PET.catCi=a.ci??0;
 scene.remove(a.sp);a.tex.dispose();a.sp.material.dispose();ANIM.list.splice(ANIM.list.indexOf(a),1);toast('GATINHO ADOTADO!<br><small style="font-size:11px;color:#fff">ele vai esperar por você na casa segura</small>');return true}
function petsTick(dt){if(!petFree()||!city.safe){if(PET.dog)PET.dog.visible=false;if(PET.cat)PET.cat.visible=false;return}
 const ss=city.safe,dx=ss.x+ss.nx*3.8, dz=ss.z+ss.nz*3.8;
 const dogNear=!PL.inside&&Math.hypot(PL.x-dx,PL.z-dz)<145;
 if(dogNear&&!PET.dog)PET.dog=petNew('dog',3);
 if(PET.dog){PET.dog.visible=dogNear; if(dogNear){PET.dog.position.set(dx,groundY(dx,dz),dz);PET.dog.userData.petTex.offset.set((Math.floor(simT*.5)%3)*.25,1-24/96)}}
 const catNear=!!(PET.adopted&&PL.inside===true);
 if(catNear&&!PET.cat)PET.cat=petNew('cat',PET.catCi);
 if(PET.cat){PET.cat.visible=catNear;if(catNear){const cs=SAFE.catSpot||{x:SAFE.IN.x+2.75,z:SAFE.IN.z-.7},cx=cs.x,cz=cs.z;PET.cat.position.set(cx,groundY(cx,cz),cz);PET.cat.userData.petTex.offset.set(0,1-24/96)}}
}
function animalsClear(){for(const a of ANIM.list){scene.remove(a.sp);a.sp.material.map.dispose();a.sp.material.dispose()}ANIM.list.length=0}
function animalOk(x,z,a){if(inWater(x,z)||riverZone(x,z))return false;if(query(x,z,1).some(b=>!b.dead&&(b.kind==='bld'||b.kind==='rock'||b.kind==='tree')&&x>b.x0-.3&&x<b.x1+.3&&z>b.z0-.3&&z<b.z1+.3))return false;if(a&&a.home==='yard'&&groundY(x,z)===0)return false;return true}
function catAlleyNearby(){const p=PL.car||PL;return (city.catSpots||[]).some(q=>{const r=q.r;return Math.hypot((r[0]+r[2])*.5-p.x,(r[1]+r[3])*.5-p.z)<125})}
function catSpawnInAlley(){
 if(!city.ext||S.style==='inverted'||S.style==='haze')return false;
 const catCap=MOB_LITE?1:2;
 if(ANIM.list.filter(a=>a.kind==='cat'&&!a.dead).length>=catCap)return false;
 const p=PL.car||PL,sites=(city.catSpots||[]).filter(q=>{
  const [x0,z0,x1,z1]=q.r,dx=(x0+x1)*.5-p.x,dz=(z0+z1)*.5-p.z;
  return x1-x0>=1.35&&z1-z0>=1.35&&dx*dx+dz*dz<125*125;
 });
 if(!sites.length)return false;
 // Tenta mais de uma passagem e amostras dentro dela. Spawn fora da vista imediata.
 for(let i=0;i<Math.min(16,sites.length);i++){
  const q=sites[Math.floor(Math.random()*sites.length)],r=q.r;
  for(let j=0;j<5;j++){
   const x=r[0]+.40+Math.random()*Math.max(.01,r[2]-r[0]-.80),z=r[1]+.40+Math.random()*Math.max(.01,r[3]-r[1]-.80);
   const d=Math.hypot(x-p.x,z-p.z);
   if(d<13||d>123||!animalOk(x,z,{home:'alley'}))continue;
   if((q.bins||[]).some(b=>Math.hypot(x-b.x,z-b.z)<b.r+.3))continue;
   if(ANIM.list.some(a=>!a.dead&&Math.hypot(x-a.x,z-a.z)<15))continue;
   const ci=Math.floor(Math.random()*CAT_COLS.length),tex=animalTex('cat',ci),sp=makeActorLitSprite(tex);
   ANIM.list.push({kind:'cat',ci,home:'alley',spot:q,y:0,onBin:null,x,z,hx:x,hz:z,tx:x,tz:z,sp,tex,mx:1,mz:0,anim:0,wait:Math.random()*3,flee:0,dead:false,deadT:0});
   return true;
  }
 }
 return false;
}
function animalSpawn(){if(!city.ext||S.style==='inverted'||S.style==='haze')return;const p=PL.car||PL,E=city.ext,r=Math.random();let kind,x,z,home;
 const near=(xx,zz)=>{const d=Math.hypot(xx-p.x,zz-p.z);return d>28&&d<110};
 if(r<.52){if(Math.random()<.23||ANIM.list.filter(a=>a.kind==='cat').length>=(MOB_LITE?1:2))return;const L=(city.catSpots||[]).filter(q=>near((q.r[0]+q.r[2])/2,(q.r[1]+q.r[3])/2));if(!L.length)return;var spot=L[Math.floor(Math.random()*L.length)],s=spot.r;kind='cat';home='alley';x=s[0]+.6+Math.random()*(s[2]-s[0]-1.2);z=s[1]+.6+Math.random()*(s[3]-s[1]-1.2);
  if(ANIM.list.some(a=>a.kind==='cat'&&!a.dead&&Math.hypot(a.x-x,a.z-z)<20))return}
 else if(r<.76){const L=[];city.rects.forEach((q,i)=>{const k=city.info[i].kind;if((k==='houses'||k==='rural')&&near((q[0]+q[2])/2,(q[1]+q[3])/2))L.push(q)});if(!L.length)return;const q=L[Math.floor(Math.random()*L.length)];kind='dog';home='yard';x=q[0]+5+Math.random()*(q[2]-q[0]-10);z=q[1]+5+Math.random()*(q[3]-q[1]-10)}
 else if(r<.90){if(city.coast===undefined)return;const t=(city.coast<2?p.x:p.z)+(Math.random()-.5)*160,u=SAND_FLAT+2+Math.random()*(SHORE-SAND_FLAT-8);if(!onBeach(city.coast<2?t:0,city.coast<2?0:t)&&city.coastSpan)return;const q=wTU(city.coast,t,u);kind='dog';home='beach';x=q[0];z=q[1];if(!near(x,z))return}
 else{const rr0=perim(rectNear(p.x+(Math.random()-.5)*160,p.z+(Math.random()-.5)*160)),q=perimPoint(rr0,Math.random()*400);kind='dog';home='street';x=q[0];z=q[1];if(!near(x,z))return}
 if(!animalOk(x,z,{home}))return;const ci=Math.floor(Math.random()*(kind==='dog'?DOG_COLS:CAT_COLS).length),tex=animalTex(kind,ci);
 const sp=makeActorLitSprite(tex);
 ANIM.list.push({kind,ci,home,spot:home==='alley'?spot:null,y:0,onBin:null,x,z,hx:x,hz:z,tx:x,tz:z,sp,tex,mx:1,mz:0,anim:0,wait:Math.random()*3,flee:0,dead:false,deadT:0})}
function animalsTick(dt){if(!city.ext)return;const hidden=PL.inside&&!TVM.on;ANIM.t-=dt;const cap=MOB_LITE?4:8;
 if(ANIM.t<=0){ANIM.t=1.2;if(ANIM.list.length<cap&&!hidden){
   const cats=ANIM.list.filter(a=>a.kind==='cat'&&!a.dead).length,catMax=MOB_LITE?1:2,needCat=cats<catMax&&catAlleyNearby();
   if(needCat&&catSpawnInAlley()){}else if(!needCat||ANIM.list.length<cap-1)animalSpawn();
 }}
 const p=PL.car||PL,pv=PL.car?Math.hypot(PL.car.vx,PL.car.vz):Math.hypot(PL.vx||0,PL.vz||0);
 for(let i=ANIM.list.length-1;i>=0;i--){const a=ANIM.list[i];const d=Math.hypot(a.x-p.x,a.z-p.z);
  if(d>170||(a.dead&&(a.deadT+=dt)>25)){scene.remove(a.sp);a.tex.dispose();a.sp.material.dispose();ANIM.list.splice(i,1);continue}
  a.sp.visible=!hidden;if(a.dead){a.sp.material.rotation=Math.PI/2;a.sp.position.set(a.x,groundY(a.x,a.z)+.05,a.z);continue}
  // atropelamento
  if(!a.onBin)for(const c of carsNear(a.x,a.z,6)){const sp=Math.hypot(c.vx||0,c.vz||0);if(sp<3||!c.alive)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a),dx=a.x-c.x,dz=a.z-c.z,lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;
   if(Math.abs(lx)<c.t.L/2+.3&&Math.abs(lz)<c.t.W/2+.3){a.dead=true;a.deadT=0;bloodHit(a.x,.5,a.z,{x:ca,z:sa});thud&&thud(3);break}}
  if(a.dead)continue;
  if(a.onBin&&!query(a.onBin.x,a.onBin.z,1).some(c=>c.kind==='bin'&&!c.dead&&Math.abs((c.x0+c.x1)/2-a.onBin.x)<.2&&Math.abs((c.z0+c.z1)/2-a.onBin.z)<.2)){a.onBin=null;a.goBin=false;a.flee=1.6;a.wait=0;const q=a.spot.r;a.tx=q[0]+.5+Math.random()*(q[2]-q[0]-1);a.tz=q[1]+.5+Math.random()*(q[3]-q[1]-1)}
  // fuga de quem chega correndo / carro rápido
  if(a.aggro){if(PL.car||PL.inside||PL.dead||d>45){a.aggro=false;a.hx=a.x;a.hz=a.z;a.tx=a.x;a.tz=a.z;a.flee=0}else{a.tx=p.x;a.tz=p.z;a.flee=1;a.wait=0;a.biteT=(a.biteT||0)-dt;if(d<1.1&&a.biteT<=0){a.biteT=.9;PL.hp=Math.max(0,PL.hp-armorHit(6));bloodHit(PL.x,1,PL.z,{x:p.x-a.x,z:p.z-a.z});toast('<span style="color:#ff4a4a">O CACHORRO TE MORDEU!</span>');rumble&&rumble(.5,.5,120);if(PL.hp<=0)killPlayer('MORDIDO')}}}
  else if(d<(PL.car?12:5)&&(pv>3||d<2.2)&&!PL.dead&&!a.onBin&&!(a.kind==='cat'&&petFree()&&!PET.adopted&&pv<1.35&&d<3.3)){const l=d||1;a.tx=a.x+(a.x-p.x)/l*10;a.tz=a.z+(a.z-p.z)/l*10;if(a.spot){const q=a.spot.r;a.tx=clamp(a.tx,q[0]+.4,q[2]-.4);a.tz=clamp(a.tz,q[1]+.4,q[3]-.4)}a.flee=1.6;a.wait=0;a.goBin=false}
  if(a.kind==='cat'&&petFree()&&!PET.adopted&&!PL.car&&pv<1.35&&d<3.3&&a.flee<=0){a.tx=a.x;a.tz=a.z;a.wait=Math.max(a.wait,.22)}
  const sp=a.flee>0?(a.kind==='cat'?5.2:4.6):(a.kind==='cat'?1.1:1.5);a.flee=Math.max(0,a.flee-dt);
  if(a.wait>0){a.wait-=dt;a.anim=0}else{const ex=a.tx-a.x,ez=a.tz-a.z,l=Math.hypot(ex,ez);
   if(l<.4){a.wait=1.5+Math.random()*4;if(a.spot){if(a.onBin){a.onBin=null;a.wait=.3}else{const bn=a.spot.bins.find(b=>Math.hypot(b.x-a.x,b.z-a.z)<b.r+.3);if(a.goBin&&bn){a.onBin=bn;a.wait=3+Math.random()*6}}a.goBin=false;const q=a.spot.r;
     const alive=a.spot.bins.filter(b=>query(b.x,b.z,1).some(c=>c.kind==='bin'&&!c.dead&&Math.abs((c.x0+c.x1)/2-b.x)<.2&&Math.abs((c.z0+c.z1)/2-b.z)<.2));if(!a.onBin&&alive.length&&Math.random()<.35){const bn=alive[Math.floor(Math.random()*alive.length)];a.tx=bn.x;a.tz=bn.z;a.goBin=true}else if(!a.onBin){a.tx=q[0]+.5+Math.random()*(q[2]-q[0]-1);a.tz=q[1]+.5+Math.random()*(q[3]-q[1]-1)}}
    else{const R0=a.home==='street'?4:a.home==='beach'?9:6;a.tx=a.hx+(Math.random()-.5)*2*R0;a.tz=a.hz+(Math.random()-.5)*2*R0}}
   else{const nx=a.x+ex/l*sp*dt,nz=a.z+ez/l*sp*dt;if(a.spot&&(nx<a.spot.r[0]+.2||nx>a.spot.r[2]-.2||nz<a.spot.r[1]+.2||nz>a.spot.r[3]-.2)){a.tx=a.x;a.tz=a.z}else if(animalOk(nx,nz,a)){a.x=nx;a.z=nz;a.mx=ex;a.mz=ez;a.anim+=dt*sp*1.8}else{a.tx=a.x;a.tz=a.z}}}
  const top=camMode==='top'&&!VIEW.orbit,s=(a.kind==='dog'?1.25:.95)*(top?1.5:1);a.sp.scale.set(s,s*.75,1);a.sp.material.rotation=0;a.y+=((a.onBin?1.32:0)-a.y)*Math.min(1,dt*10);a.sp.position.set(a.x,groundY(a.x,a.z)+a.y+(top?.6:0),a.z);
  const dir=pickDir(a.mx,a.mz,a.x,a.z),fr=a.wait>0?0:1+(Math.floor(a.anim*3)%2);a.tex.offset.set(fr*32/128,1-(dir+1)*24/96)}}
