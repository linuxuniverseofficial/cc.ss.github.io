'use strict';
/* Coastal Chaos · js/21-transito-peds.js — Trânsito (faixas, semáforos) e pedestres.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= TRAFFIC: lanes, lights, rail mode ================= */
const SEG_END=P-RW/2;let simT=0;const CYC=22;
function lanePt(kx,kz,d,li,s){const off=laneOff(kx,kz,d,li);return[kx*P+D[d][0]*s-D[d][1]*off,kz*P+D[d][1]*s+D[d][0]*off]}
function laneKey(kx,kz,d,li){return((kx*64+kz)*4+d)*2+li}
function validNext(bx,bz,d){const o=[];for(let k=0;k<4;k++){if(k===(d+2)%4)continue;if(canDrive(bx,bz,k))o.push(k)}if(!o.length){if(canDrive(bx,bz,(d+2)%4))o.push((d+2)%4);else for(let k=0;k<4;k++)if(segExists(bx,bz,k)&&!obraClosed(bx,bz,k))o.push(k)}if(!o.length)o.push((d+2)%4);return o}
function chooseNext(bx,bz,d){const o=validNext(bx,bz,d);if(!o.length)return(d+2)%4;return(o.includes(d)&&R2()<.5)?d:o[Math.floor(R2()*o.length)]}
function nodeOff(kx,kz){return(Math.abs((kx*73856093)^(kz*19349663))%997)/997*CYC}
// Sinal para o TRÂNSITO: o jammer corta a sinalização do cruzamento.
// Retorno 3 = sem restrição por semáforo; outras regras (colisão, ponte etc.) continuam.
function sigT(kx,kz,d){if(jammerSignalBlocked(kx,kz))return 3;if(city.core&&isRural(kx*P,kz*P))return city.deg[kx][kz]<3?0:3;if(city.deg&&city.deg[kx]&&city.deg[kx][kz]<3)return 0;const t=(simT+nodeOff(kx,kz))%CYC;if(d%2===0)return t<9?0:t<11?1:2;return t<11?2:t<20?0:1}
function sig(kx,kz,d){if(JAMMER.day&&jammerSignalBlocked(kx,kz))return 0; /* r54: jammer de dia = tudo verde */if((city.st&&city.st.noLamps)||jammerSignalBlocked(kx,kz))return -1;if(city.broken&&city.broken.has(kx*1000+kz))return 3;if(city.core&&isRural(kx*P,kz*P))return city.deg[kx][kz]<3?0:3;if(city.deg&&city.deg[kx]&&city.deg[kx][kz]<3)return 0;const t=(simT+nodeOff(kx,kz))%CYC;if(d%2===0)return t<9?0:t<11?1:2;return t<11?2:t<20?0:1}
const TL={im:null,list:[],t:0};
const TLC=[COL('#35ff6e'),COL('#ffc838'),COL('#ff2b2b'),COL('#ffb020')],TLC_OFF=COL('#2a2418');
function buildTrafficLights(st,det,grp){const N=city.N;TL.list=[];const pc=COL(st.synth?'#2b2540':'#3a3a3c');
 city.deg=[];for(let kx=0;kx<=N;kx++){city.deg[kx]=[];for(let kz=0;kz<=N;kz++)city.deg[kx][kz]=nodeDeg(kx,kz)}
 for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)for(let d=0;d<4;d++){const ax=kx-D[d][0],az=kz-D[d][1];if(!segExists(ax,az,d)||city.deg[kx][kz]<3)continue;
  const rx=-D[d][1],rz=D[d][0],o=RW/2+1.2;const px=kx*P+D[d][0]*o+rx*o,pz=kz*P+D[d][1]*o+rz*o;
  det.box(px-.12,0.2,pz-.12,px+.12,5.5,pz+.12,pc);const hx=px-rx*3.2,hz=pz-rz*3.2;
  det.box(Math.min(px,hx)-.08,5.3,Math.min(pz,hz)-.08,Math.max(px,hx)+.08,5.48,Math.max(pz,hz)+.08,pc);
  det.box(hx-.3,4.1,hz-.3,hx+.3,5.3,hz+.3,COL('#141414'));
  addCol(px-.2,pz-.2,px+.2,pz+.2,'tlight');TL.list.push({kx,kz,d,hx,hz})}
 const g=new THREE.BoxGeometry(.46,.46,.46);const im=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff}),TL.list.length);
 TL.list.forEach((l,i)=>{im.setMatrixAt(i,mtx(l.hx,5.55,l.hz,1,1,1));im.setColorAt(i,TLC[0])});im.frustumCulled=false;grp.add(im);TL.im=im;TL.t=0}
const TL_D=[COL('#3a0a0a'),COL('#3a2a06'),COL('#0a2a12')],TL_ON=[COL('#ff2b2b'),COL('#ffc838'),COL('#35ff6e')],TL_BLACK=COL('#080808');
function tlLens(j,g,bl){if(g===-1)return TL_BLACK;if(g===3)return j===1&&bl?TL_ON[1]:TL_D[j];const want=g===0?2:g===1?1:0;return j===want?TL_ON[j]:TL_D[j]}
function updateTrafficLights(dt){TL.t-=dt;if(TL.t>0)return;TL.t=.15;for(const ch of city.chunks.values()){if(!ch.tlIMs)continue;const bl=Math.floor(simT*2.2)%2===0,storm=WX.storm>.5;ch.tls.forEach((l,i)=>{const k=sig(l.kx,l.kz,l.d),g=k===-1?-1:storm?3:k;for(let j=0;j<3;j++)ch.tlIMs[j].setColorAt(i,tlLens(j,g,bl))});for(const im of ch.tlIMs)im.instanceColor.needsUpdate=true}}
const laneMap=new Map();
function buildLanes(){for(const a of laneMap.values())a.length=0;
 for(const c of vehicles){if(!c.alive||c.exploded||c.sunk)continue;let k,s,nk;
  if(c.mode==='rail'){const r=c.rail;if(!r){c.mode='phys';c.sleep=true;c.ai=null;continue}k=laneKey(r.kx,r.kz,r.d,r.li);s=r.turn?SEG_END+r.turn.u:r.s;nk=laneKey(r.kx+D[r.d][0],r.kz+D[r.d][1],r.nd,r.li)}
  else if(c.ai&&c.alive){const ai=c.ai,[dx,dz]=D[ai.d];s=(c.x-ai.kx*P)*dx+(c.z-ai.kz*P)*dz;k=laneKey(ai.kx,ai.kz,ai.d,ai.li||0);nk=laneKey(ai.kx+dx,ai.kz+dz,ai.nd===null?ai.d:ai.nd,ai.li||0)}
  else continue;
  c._k=k;c._s=s;c._nk=nk;let a=laneMap.get(k);if(!a){a=[];laneMap.set(k,a)}a.push(c)}
 for(const a of laneMap.values())if(a.length>1)laneSortS(a);if(laneMap.size>900)for(const[k,a] of laneMap)if(!a.length)laneMap.delete(k)}
function laneSortS(a){/* v3 r5: inserção estável sem closure (listas curtas e quase ordenadas) */for(let i=1;i<a.length;i++){const v=a[i],s=v._s;let j=i-1;while(j>=0&&a[j]._s>s){a[j+1]=a[j];j--}a[j+1]=v}}
function leaderGap(c){const a=laneMap.get(c._k);if(!a)return 999;const i=a.indexOf(c);
 if(i>=0&&i<a.length-1){const o=a[i+1];return o._s-c._s-(o.t.L+c.t.L)/2}
 const b=laneMap.get(c._nk);if(b&&b.length){const o=b[0];return(SEG_END+14-c._s)+(o._s-RW/2)-(o.t.L+c.t.L)/2}return 999}
function makeRailCar(kx,kz,d,li,s,forceType){const st=STYLES[S.style];let type=forceType||randomType(st,kx*P,kz*P);if(li===1&&(type==='truck'||type==='bus'))type='van';
 const p=lanePt(kx,kz,d,li,s);const c=makeVehicle(type,p[0],p[1],Math.atan2(D[d][1],D[d][0]),null);
 c.mode='rail';c.gy=0;c.rail={kx,kz,d,li,s,nd:chooseNext(kx+D[d][0],kz+D[d][1],d),turn:null,v:c.vmax*.5};return c}
function startTurn(r,u0){const bx=r.kx+D[r.d][0],bz=r.kz+D[r.d][1];r.nli=laneValid(bx,bz,r.nd,r.li)?r.li:(laneValid(bx,bz,r.nd,0)?0:1);const p0=lanePt(r.kx,r.kz,r.d,r.li,SEG_END),p2=lanePt(bx,bz,r.nd,r.nli,RW/2);let p1;
 if(r.nd===r.d)p1=[(p0[0]+p2[0])/2,(p0[1]+p2[1])/2];else if(r.d%2===0)p1=[p2[0],p0[1]];else p1=[p0[0],p2[1]];
 const l01=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),l12=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),l02=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]);
 r.turn={p0,p1,p2,len:Math.max(1,(l01+l12+l02)/2),u:u0}}
// Shared one-at-a-time traffic corridor for live and televised checkpoints.
function checkpointFor(c){
 if(c===PL.car||c.t.boat||c.blitz||!c.alive)return null;
 const b=BLITZ.on;if(!b)return null;
 const dx=c.x-b.x,dz=c.z-b.z,a=dx*b.ux+dz*b.uz,l=-dx*b.uz+dz*b.ux;
 if(a< -90||a>38||Math.abs(l)>7||Math.cos(c.a)*b.ux+Math.sin(c.a)*b.uz<.8)return null;
 return {b,a,l};
}
function checkpointOffset(a){const t=clamp((a+65)/40,0,1),u=clamp((a-20)/18,0,1);return t*t*(3-2*t)*(1-u*u*(3-2*u))}
const CPP_TMP=[0,0,0];/* v3 r5: checkpointPose devolve este array reaproveitado (único uso: railPose, lido na hora) */
function checkpointPose(c,x,z,a){const cp=checkpointFor(c),o=CPP_TMP;if(!cp){o[0]=x;o[1]=z;o[2]=a;return o}const b=cp.b,dx=x-b.x,dz=z-b.z,along=dx*b.ux+dz*b.uz,lat=-dx*b.uz+dz*b.ux,k=checkpointOffset(along),off=lat+(2.8-lat)*k;
 const ahead=along+.3,off2=lat+(2.8-lat)*checkpointOffset(ahead),slope=(off2-off)/.3;
 o[0]=b.x+b.ux*along-b.uz*off;o[1]=b.z+b.uz*along+b.ux*off;o[2]=Math.atan2(b.uz+b.ux*slope,b.ux-b.uz*slope);return o;
}
function checkpointSpeech(b,c,clear){
 const guard=b.cop2||b.cop1;if(!guard||!peds.includes(guard))return;
 const plate=blitzPlate(c),en=S.lang==='en';
 say(guard,clear?(en?'Plate '+plate+': documents in order. You may go.':'Placa '+plate+': documentos em ordem. Pode seguir.'):(en?'Your documents, please.':'Seus documentos, por favor.'),clear?3.2:2.5);
}
function blitzDriverWindow(c){const w=(c.t?.W||2)/2+.65;return{x:c.x+Math.sin(c.a)*w,z:c.z-Math.cos(c.a)*w}}
function blitzMoveCop(q,x,z,dt){
 if(!q||!peds.includes(q)||!q.at)return true;const dx=x-q.at.x,dz=z-q.at.z,d=Math.hypot(dx,dz);
 if(d>.12){const step=Math.min(d,dt*1.6);q.at.x+=dx/(d||1)*step;q.at.z+=dz/(d||1)*step;q.mx=dx/(d||1);q.mz=dz/(d||1)}return d<.3;
}
function blitzNpcBegin(b,c){
 b.serving=c;b.npcPhase='approach';b.npcTime=0;b.npcHome=[b.cop2?.at?{...b.cop2.at}:null,b.cop1?.at?{...b.cop1.at}:null];
 if(!b.frontCone){const cone=blitzCone(true);const x=b.x+b.ux*8.5-b.uz*1.9,z=b.z+b.uz*8.5+b.ux*1.9;cone.position.set(x,groundY(x,z),z);b.grp.add(cone);b.frontCone=cone;b.funnel=true}
 if(b.cop1)say(b.cop1,S.lang==='en'?'Pull over here!':'Encoste aqui!',2);
}
function blitzNpcTick(b,dt){
 const c=b.serving;if(!c)return;
 if(!c.alive||!vehicles.includes(c)){b.npcPhase='retreat';b.npcAbort=true}
 b.npcTime=(b.npcTime||0)+dt;
 if(b.npcPhase==='approach'){
  const win=blitzDriverWindow(c),reached=blitzMoveCop(b.cop2,win.x,win.z,dt);
  if(reached){checkpointSpeech(b,c,false);b.npcPhase='documents';b.npcTime=0}
 }else if(b.npcPhase==='documents'&&b.npcTime>=2.8){
  checkpointSpeech(b,c,true);b.npcPhase='retreat';b.npcTime=0;
 }else if(b.npcPhase==='retreat'){
  const home=b.npcHome?.[0],clear1=home?blitzMoveCop(b.cop2,home.x,home.z,dt):true;
  const clear2=blitzMoveCop(b.cop1,b.x+b.ux*10.5+b.uz*1.9,b.z+b.uz*10.5-b.ux*1.9,dt);
  if(clear1&&clear2){blitzOpen(b);if(!b.npcAbort){b.passed.add(c);b.releasing=c;c.xT=0;c.xGap=999;c.xBlock=false;if(c.ai){c.ai.blockT=0;c.ai.rev=0;c.ai.dodge=0}}
   b.serving=null;b.npcPhase=null;b.npcAbort=false;
  }
 }
}
function checkpointSpeed(c,cp){
 const {b,a}=cp;if(!b.passed)b.passed=new WeakSet();
 if(b.releasing&&(!b.releasing.alive||!vehicles.includes(b.releasing)||(b.releasing.x-b.x)*b.ux+(b.releasing.z-b.z)*b.uz>20))b.releasing=null;
 if(b.serving&&(!b.serving.alive||!vehicles.includes(b.serving)))b.serving=null;
 let limit=a< -50?10:4;
 // Cars already beyond the stop line when the operation appears can clear it.
 if(a>12&&b.serving!==c)b.passed.add(c);
 const stop=5-c.t.L/2,dist=stop-a;
 if(!b.passed.has(c)){
  const player=PL.car,pa=player?(player.x-b.x)*b.ux+(player.z-b.z)*b.uz:-999,pl=player?-(player.x-b.x)*b.uz+(player.z-b.z)*b.ux:999,playerBusy=b.phase==='talk'||(player&&pa>=a-1&&pa<12&&Math.abs(pl)<7);
  if(dist<.8&&dist> -3&&Math.abs(c.fwd)<.7&&!b.serving&&!b.releasing&&!playerBusy)blitzNpcBegin(b,c);
  if(!b.passed.has(c))limit=Math.min(limit,Math.max(0,dist)*.9);
 }
 // A common projected queue sees both source lanes before they merge.
 for(const o of carsNear(c.x,c.z,100)){
  if(o===c||!o.alive||o.t.boat||o.blitz)continue;
  const dx=o.x-b.x,dz=o.z-b.z,oa=dx*b.ux+dz*b.uz,ol=-dx*b.uz+dz*b.ux;
  if(Math.abs(ol)>7||oa>30)continue;
  // Moving traffic of the same direction joins the funnel. Parked/opposite-lane
  // vehicles only block if their actual body occupies the open corridor.
  const sameWay=Math.cos(o.a)*b.ux+Math.sin(o.a)*b.uz>.8;
  const joining=sameWay&&(o.mode==='rail'||!!o.ai)&&checkpointFor(o)?.b===b;
  const corridor=cp.l+(2.8-cp.l)*checkpointOffset(oa);
  if(!joining&&Math.abs(ol-corridor)>(c.t.W+o.t.W)/2+.5)continue;
  if(oa<a-.05||Math.abs(oa-a)<=.05&&vehicles.indexOf(o)>vehicles.indexOf(c))continue;
  const gap=oa-a-(c.t.L+o.t.L)/2-3;limit=Math.min(limit,Math.max(0,gap)*.9);
 }
 return Math.max(0,limit);
}
function railPose(c){const r=c.rail;if(r&&r.nr){nrRailPose(c);return}let x,z,a;
 if(!r.turn){const off=laneOff(r.kx,r.kz,r.d,r.li),Dd=D[r.d];x=r.kx*P+Dd[0]*r.s-Dd[1]*off;z=r.kz*P+Dd[1]*r.s+Dd[0]*off;a=Math.atan2(Dd[1],Dd[0])}
 else{const T=r.turn,t=clamp(T.u/T.len,0,1),m=1-t;x=m*m*T.p0[0]+2*m*t*T.p1[0]+t*t*T.p2[0];z=m*m*T.p0[1]+2*m*t*T.p1[1]+t*t*T.p2[1];
  const tx=2*m*(T.p1[0]-T.p0[0])+2*t*(T.p2[0]-T.p1[0]),tz=2*m*(T.p1[1]-T.p0[1])+2*t*(T.p2[1]-T.p1[1]);a=Math.atan2(tz,tx)}
 if(!r.turn){const q=checkpointPose(c,x,z,a);x=q[0];z=q[1];a=q[2]}
 c.x=x;c.z=z;c.a=a;c.fwd=r.v;c.vx=Math.cos(a)*r.v;c.vz=Math.sin(a)*r.v;c.w=0;c.gy=0;c.roll=c.pitch=0}
function railUpdate(c,dt){if(c.rail&&c.rail.nr){nrRailUpdate(c,dt);return}const r=c.rail,t=c.t;let vt=c.vmax;const gap=leaderGap(c),cp=checkpointFor(c);if(cp)vt=Math.min(vt,checkpointSpeed(c,cp));
 if(!r.turn){const bx=r.kx+D[r.d][0],bz=r.kz+D[r.d][1];const stopS=SEG_END-4.4-t.L/2,dist=stopS-r.s;
  if(dist>-.6){const sg=sigT(bx,bz,r.d);if(sg===2||(sg===1&&dist>2.5))vt=Math.min(vt,Math.max(0,dist)*1.1)}
  if(r.nd!==r.d&&SEG_END-r.s<18)vt=Math.min(vt,6.5)}
 else if(r.nd!==r.d)vt=Math.min(vt,6.5);
 if(city.dbs&&city.dbs.length){const sd=dbStopFor(r,t);if(sd!==null)vt=Math.min(vt,Math.max(0,sd)*1.1)}
 // In a checkpoint, original lane indices no longer describe the merged path.
 if(!cp)vt=Math.min(vt,Math.max(0,(gap-3.2)*1.0));
 if((c.xT=(c.xT||0)-dt)<=0){c.xT=.12;const ca=Math.cos(c.a),sa=Math.sin(c.a),fx=c.x+ca*(t.L/2+5),fz=c.z+sa*(t.L/2+5);c.xGap=999;
  for(const o of carsNearTmp(fx,fz,12)){if(o===c||!o.alive)continue;const dx=o.x-c.x,dz=o.z-c.z,along=dx*ca+dz*sa,side=-dx*sa+dz*ca;
   if(along>0&&Math.abs(side)<(t.W+o.t.W)/2+.65){const gap=along-(o.t.L+t.L)/2;c.xGap=Math.min(c.xGap,gap)}}
  c.xBlock=c.xGap<8;
 }
 // Desacelerar de maneira progressiva ANTES de encostar na fila (inclusive carros físicos).
 if(c.xGap<999)vt=Math.min(vt,Math.max(0,(c.xGap-3)*1.6));
 if(c.xBlock){c.xWait=(c.xWait||0)+dt}else c.xWait=0;
 // Frenagem firme na fila; volta a acelerar só depois que a pista ficou livre.
 r.v+=clamp(vt-r.v,-(c.xBlock?24:15)*dt,3*dt);if(r.v<0)r.v=0;const adv=r.v*dt;
 if(!r.turn){r.s+=adv;if(r.s>=SEG_END)startTurn(r,r.s-SEG_END)}
 else{r.turn.u+=adv;if(r.turn.u>=r.turn.len){const ex=r.turn.u-r.turn.len;r.kx+=D[r.d][0];r.kz+=D[r.d][1];r.d=r.nd;if(r.nli!==undefined)r.li=r.nli;r.s=RW/2+ex;r.turn=null;r.nd=chooseNext(r.kx+D[r.d][0],r.kz+D[r.d][1],r.d)}}
 railPose(c)}
/* v78 · NEON ROAD: trânsito de mão dupla na rua nova. Carros nascem escondidos (dentro do túnel ou na ponta longe do jogador),
   andam na faixa da direita com freio por obstáculo (jogador, pedestres, carros) e, na boca da rua, fazem uma curva calculada até a faixa
   da avenida — aí viram trânsito 'rail' comum. Caminho cinemático: ônibus/caminhão não "erram" a curva. Pedestres também nascem nas calçadas. */
const NRT={t:0};
function nrLaneV(NR,side){return NR.c+side*NR.aw/4}
function nrExit(NR,dir){const uE=dir>0?NR.u1:NR.u0,k=Math.round((uE+dir*RW/2)/P),hx=NR.ax==='x'?dir:0,hz=NR.ax==='x'?0:dir,rx=-hz,rz=hx,out=[];
 for(const d of (NR.ax==='x'?[1,3]:[0,2])){const dv=D[d][NR.ax==='x'?1:0],n0=dv>0?Math.floor(NR.c/P):Math.ceil(NR.c/P),s=dv>0?NR.c-n0*P:n0*P-NR.c,kx=NR.ax==='x'?k:n0,kz=NR.ax==='x'?n0:k;
  if(!canDrive(kx,kz,d)||s<RW/2+2||s>SEG_END-6)continue;const right=D[d][0]===rx&&D[d][1]===rz;for(const li of (right?[1,0]:[0]))if(laneValid(kx,kz,d,li))out.push({kx,kz,d,li,s,right})}
 out.sort((a,b)=>(b.right-a.right));return out[0]||null}
function nrRailPose(c){const r=c.rail,N=r.nr,NR=city.neonRoad;let x,z,a;
 if(N.ph==='st'||!NR){const v=NR?nrLaneV(NR,N.side):0;x=NR&&NR.ax==='x'?N.u:v;z=NR&&NR.ax==='x'?v:N.u;a=NR&&NR.ax==='x'?(N.dir>0?0:Math.PI):(N.dir>0?Math.PI/2:-Math.PI/2)}
 else{const T=N.T,t=clamp(T.u/T.len,0,1),m=1-t;x=m*m*T.p0[0]+2*m*t*T.p1[0]+t*t*T.p2[0];z=m*m*T.p0[1]+2*m*t*T.p1[1]+t*t*T.p2[1];
  const tx=2*m*(T.p1[0]-T.p0[0])+2*t*(T.p2[0]-T.p1[0]),tz=2*m*(T.p1[1]-T.p0[1])+2*t*(T.p2[1]-T.p1[1]);a=Math.atan2(tz,tx)}
 c.x=x;c.z=z;c.a=a;c.fwd=r.v;c.vx=Math.cos(a)*r.v;c.vz=Math.sin(a)*r.v;c.w=0;c.gy=0;c.roll=c.pitch=0}
function nrRailUpdate(c,dt){const r=c.rail,N=r.nr,NR=city.neonRoad;if(!NR){removeVehicle(c);return}let vt=N.vmax;
 if((c.xT=(c.xT||0)-dt)<=0){c.xT=.12;const ca=Math.cos(c.a),sa=Math.sin(c.a);let g=999;const chk=(x,z,rad)=>{const dx=x-c.x,dz=z-c.z,al=dx*ca+dz*sa,sd=-dx*sa+dz*ca;if(al>0&&Math.abs(sd)<c.t.W/2+rad+.35)g=Math.min(g,al-c.t.L/2-rad)};
  for(const o of carsNearTmp(c.x+ca*8,c.z+sa*8,14)){if(o===c||!o.alive)continue;chk(o.x,o.z,o.t.L/2)}
  if(!PL.car&&!PL.inside)chk(PL.x,PL.z,.45);for(const p of peds){if(Math.abs(p.x-c.x)<16&&Math.abs(p.z-c.z)<16)chk(p.x,p.z,.45)}c.xGap=g}
 if(c.xGap<999)vt=Math.min(vt,Math.max(0,(c.xGap-2.5)*1.6));
 r.v+=clamp(vt-r.v,-18*dt,3*dt);if(r.v<0)r.v=0;const adv=r.v*dt;
 if(N.ph==='st'){N.u+=N.dir*adv;if((N.dir>0&&N.u>=N.uEnd)||(N.dir<0&&N.u<=N.uEnd)){N.u=N.uEnd;const e=nrExit(NR,N.dir);
   if(!e){r.v=0;const f=PL.car||PL;if(Math.hypot(f.x-c.x,f.z-c.z)>60)removeVehicle(c);return}
   const p0=NR.ax==='x'?[N.u,nrLaneV(NR,N.side)]:[nrLaneV(NR,N.side),N.u],p2=lanePt(e.kx,e.kz,e.d,e.li,e.s+4),p1=NR.ax==='x'?[p2[0],p0[1]]:[p0[0],p2[1]];
   const l01=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),l12=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),l02=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]);N.T={p0,p1,p2,len:Math.max(1,(l01+l12+l02)/2),u:0};N.exit=e;N.ph='turn';N.vmax=Math.min(N.vmax,6)}}
 else if(N.ph==='in'){N.T.u+=adv;if(N.T.u>=N.T.len){N.ph='st';N.u=N.uStart+N.dir*(N.T.u-N.T.len);N.T=null;N.vmax=N.vmax0||N.vmax}}
 else{N.T.u+=adv;if(N.T.u>=N.T.len){const e=N.exit;r.kx=e.kx;r.kz=e.kz;r.d=e.d;r.li=e.li;r.s=e.s+4+(N.T.u-N.T.len);r.turn=null;r.nd=chooseNext(e.kx+D[e.d][0],e.kz+D[e.d][1],e.d);r.nr=null;railPose(c);return}}
 nrRailPose(c)}
/* v2 r2.1: a rua também RECEBE carros da cidade. Carro comum (rail) chegando na boca, na faixa de quem vira à direita para dentro,
   faz a curva (bezier até a faixa da rua), desce a rua e sai pela outra boca com o caminho que já existia (nrExit). Só mexe no carro capturado. */
function nrCapture(NR){for(const dirOut of[-1,1]){const uE=dirOut>0?NR.u1:NR.u0,k=Math.round((uE+dirOut*RW/2)/P),w=-dirOut,wx=NR.ax==='x'?w:0,wz=NR.ax==='x'?0:w;
  for(const d of (NR.ax==='x'?[1,3]:[0,2])){if(-D[d][1]!==wx||D[d][0]!==wz)continue; /* só curva à direita para dentro da rua */
   const dv=D[d][NR.ax==='x'?1:0],n0=dv>0?Math.floor(NR.c/P):Math.ceil(NR.c/P),sM=dv>0?NR.c-n0*P:n0*P-NR.c,kx=NR.ax==='x'?k:n0,kz=NR.ax==='x'?n0:k;
   if(!segExists(kx,kz,d)||sM<RW/2+2||sM>SEG_END-6)continue;const liR=laneValid(kx,kz,d,1)?1:0;
   for(const c of vehicles){if(!c.alive||c.mode!=='rail'||!c.rail||c.rail.nr||c.rail.turn||c.police||c.keep||c.owned||c.blitz||c===PL.lastCar)continue;const r=c.rail;
    if(r.kx!==kx||r.kz!==kz||r.d!==d||r.li!==liR)continue;const dist=sM-r.s;if(dist<7||dist>24)continue;
    const p0=lanePt(kx,kz,d,liR,r.s),side=NR.ax==='x'?w:-w,v=nrLaneV(NR,side),uIn=uE+w*4,p2=NR.ax==='x'?[uIn,v]:[v,uIn],p1=NR.ax==='x'?[p0[0],p2[1]]:[p2[0],p0[1]];
    if(vehicles.some(o=>o!==c&&o.alive&&Math.hypot(o.x-p2[0],o.z-p2[1])<9))continue;
    const l01=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),l12=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),l02=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]),vm=Math.min(c.vmax*.45,10);
    r.nr={ph:'in',T:{p0,p1,p2,len:Math.max(1,(l01+l12+l02)/2),u:0},dir:w,side,uStart:uIn,uEnd:w>0?NR.u1-1:NR.u0+1,vmax:Math.min(vm,6),vmax0:vm};r.v=Math.min(r.v,8);nrRailPose(c);return true}}}return false}
function nrTrafficTick(dt){const NR=city.neonRoad;if(!NR||!NR.built||PL.inside||!running||PHOTO.on||S.style==='inverted')return; /* v2 r2.1: o Upside Down não tem trânsito nem pedestres (a rua tinha gerador próprio) */NRT.t-=dt;if(NRT.t>0)return;NRT.t=1.4;
 const f=PL.car||PL,P2=u=>NR.ax==='x'?[u,NR.c]:[NR.c,u],mid=P2((NR.u0+NR.u1)/2);if(Math.hypot(f.x-mid[0],f.z-mid[1])>170)return;
 /* pedestres nas calçadas da rua (até 3), nascendo longe do jogador */
 if(NR.strips&&peds.filter(p=>p.nrStrip).length<3&&R2()<.55){const st=NR.strips[Math.floor(R2()*2)],L=Math.hypot(st[2]-st[0],st[3]-st[1]),t=R2()<.5?.5:L-.5,px=st[0]+(st[2]-st[0])*t/L,pz=st[1]+(st[3]-st[1])*t/L; /* entra pela ponta da calçada, vindo da avenida */
  if(Math.hypot(f.x-px,f.z-pz)>12){try{const p=spawnPed({x:px,z:pz,min:0,max:1});p.strip=st;p.t=t;p.dir=t<1?1:-1;p.nrStrip=true;p.ri=NR.ri;p.r=perim(NR.ri);const q=pedPoint(p);p.x=q[0];p.z=q[1]}catch(e){console.error('[neon road ped]',e)}}}
 if(trafficDensity()<=0||vehicles.filter(v=>v.alive&&v.mode==='rail'&&v.rail&&v.rail.nr).length>=2)return;if(R2()<.45&&nrCapture(NR))return;if(R2()>.5)return;
 const cand=[],tunU=(NR.ta+NR.tb)/2,pt=P2(tunU);if(Math.hypot(f.x-pt[0],f.z-pt[1])>14)cand.push({u:tunU,dir:NR.end===0?1:-1}); /* nasce dentro do túnel e sai dele */
 const farU=NR.end===0?NR.u1-3:NR.u0+3,pf=P2(farU);if(Math.hypot(f.x-pf[0],f.z-pf[1])>40)cand.push({u:farU,dir:NR.end===0?-1:1});
 if(!cand.length)return;const sp=cand[Math.floor(R2()*cand.length)],side=NR.ax==='x'?sp.dir:-sp.dir,pos=NR.ax==='x'?[sp.u,nrLaneV(NR,side)]:[nrLaneV(NR,side),sp.u];
 if(vehicles.some(v=>v.alive&&Math.hypot(v.x-pos[0],v.z-pos[1])<10))return;
 const type=randomType(STYLES[S.style],pos[0],pos[1]),a=NR.ax==='x'?(sp.dir>0?0:Math.PI):(sp.dir>0?Math.PI/2:-Math.PI/2),c=makeVehicle(type,pos[0],pos[1],a,null);
 c.mode='rail';c.gy=0;c.rail={kx:-99,kz:-99,d:0,li:0,s:0,nd:0,turn:null,v:5,nr:{ph:'st',u:sp.u,dir:sp.dir,side,uEnd:sp.dir>0?NR.u1-1:NR.u0+1,vmax:Math.min(c.vmax*.45,10)}};railPose(c)}
function toPhys(c){const r=c.rail;railPose(c);c.mode='phys';c.rail=null;c.sleep=false;c.thr=0;c.steer=c.steerT=0;c.hand=false;
 c.ai=r.nr?null:{kx:r.kx,kz:r.kz,d:r.d,li:r.li,nd:r.nd,vmax:c.vmax,stun:0,blockT:0,ignore:0}; /* carro do Neon Road atingido/roubado: fica parado (sem IA de grade dentro do quarteirão) */
 if(r.turn&&!r.nr){c.ai.kx+=D[r.d][0];c.ai.kz+=D[r.d][1];c.ai.d=r.nd;c.ai.nd=null}}
function tryRail(c){const ai=c.ai;if(!ai||ai.stun>0||!c.alive||c.jamRush)return false;const[dx,dz]=D[ai.d],off=laneOff(ai.kx,ai.kz,ai.d,ai.li||0);
 const s=(c.x-ai.kx*P)*dx+(c.z-ai.kz*P)*dz,lat=(c.x-ai.kx*P)*(-dz)+(c.z-ai.kz*P)*dx-off;
 if(s<RW/2+1||s>SEG_END-1||Math.abs(lat)>1.4||Math.cos(c.a-Math.atan2(dz,dx))<.97||c.fwd<0)return false;
 c.mode='rail';c.rail={kx:ai.kx,kz:ai.kz,d:ai.d,li:ai.li||0,s,nd:ai.nd!==null?ai.nd:chooseNext(ai.kx+dx,ai.kz+dz,ai.d),turn:null,v:Math.max(0,c.fwd)};
 c.vmax=ai.vmax;c.ai=null;c.sleep=false;railPose(c);return true}
// v265: o slider continua mostrando 0-100, mas 100 corresponde a 75
// da escala antiga. Preserva a curva nao linear e os presets existentes.
function trafficDensity(){if(S.style==='inverted'||S.style==='haze'||ONLINE.on)return 0;const effective=clamp(S.traffic*.75,0,75),f=effective*.5/100;return(1/600)*Math.pow(600/8.5,Math.pow(f,.7))}
function policeTarget(){if(S.style==='inverted'||S.style==='haze'||ONLINE.on)return 0; /* v3 r27: no online as viaturas vêm do servidor (netNpc) */return S.traffic<=50?1:S.traffic<=90?2:3}
// Contagem regional de trafego: inclui veiculos AI fisicos, nao apenas os que estao nos trilhos.
// Os carros existentes ocupam a cota ate sairem da regiao ou serem removidos.
function trafficRegionIndex(){
 const cells=new Map(),size=P;
 const key=(x,z)=>Math.floor(x/size)+','+Math.floor(z/size);
 const add=c=>{const k=key(c.x,c.z);let a=cells.get(k);if(!a){a=[];cells.set(k,a)}a.push(c)};
 for(const c of vehicles)if(c.alive&&!c.exploded&&!c.sunk&&!c.police&&c!==PL.car&&(c.mode==='rail'||c.ai))add(c);
 const nearby=(x,z,r)=>{let n=0;const ix=Math.floor(x/size),iz=Math.floor(z/size),rr=r*r;
  for(let i=ix-1;i<=ix+1;i++)for(let j=iz-1;j<=iz+1;j++){
   const a=cells.get(i+','+j);if(!a)continue;
   for(const c of a){const dx=c.x-x,dz=c.z-z;if(dx*dx+dz*dz<rr)n++}}
  return n};
 return{add,nearby};
}
/* v79r16: zona calma — some com o trânsito comum em volta (blitz da história: só o jogador e as viaturas) e não nasce carro novo ali até o tempo acabar */
var TRAFFIC_CALM=null;
function trafficCalm(x,z,r,sec){TRAFFIC_CALM={x,z,r,until:simT+sec};for(const c of vehicles.slice()){if(c===PL.car||c.police||c.keep||c.owned||c.stashed||c.blitz||c===PL.lastCar||(SAFE.cars||[]).includes(c))continue;if(!(c.mode==='rail'||c.ai||c.parkedNpc||c.tempPark))continue;if(Math.hypot(c.x-x,c.z-z)<r)removeVehicle(c)}
 const B=typeof BLITZ!=='undefined'&&BLITZ.on;if(B&&B.serving&&!vehicles.includes(B.serving)){B.serving=null;B.npcPhase=null}}
function trafficCalmAt(x,z){const T=TRAFFIC_CALM;if(!T)return false;if(simT>T.until){TRAFFIC_CALM=null;return false}return Math.hypot(x-T.x,z-T.z)<T.r}
function roadTrafficFactor(x,z,dx,dz){
 const side=RW/2+2;
 return isRural(x+dz*side,z-dx*side)||isRural(x-dz*side,z+dx*side)?.5:1;
}
function populate(initial){const ctr=TVM.on?TVM.foc:PL.car||PL;const Rp=3*P;const viewR=camMode==='top'?camH*1.3+25:150;
 const want=trafficDensity()*(SEG_END-RW/2);let budget=initial?100000:90;
 // Limite efetivo por regiao, proporcional a densidade configurada e a frota acumulada.
 const region=trafficRegionIndex(),regionRadius=P*.8;
 if(!POL.wanted&&!WZ.list.length&&vehicles.filter(c=>c.police&&!c.stationParked&&c.alive&&Math.hypot(c.x-ctr.x,c.z-ctr.z)<Rp).length<policeTarget())spawnPoliceCar(initial?40:viewR+20,Rp);
 for(const c of vehicles.slice()){
  if(c.fleeAbandoned&&simT-c.fleeAbandoned>20&&Math.hypot(c.x-ctr.x,c.z-ctr.z)>120){removeVehicle(c);continue}
  if(c===PL.car||c.chase||c.npcId||(c.g&&!c.police))continue;if(!(c.mode==='rail'||c.ai))continue;if(Math.hypot(c.x-ctr.x,c.z-ctr.z)>Rp+45)removeVehicle(c)}
 if(!initial)for(const a of laneMap.values()){
  const rail=a.find(c=>c.rail)?.rail;if(!rail)continue;
  const {kx,kz,d}=rail,dir=D[d];
  const factor=dir?roadTrafficFactor(kx*P+dir[0]*P/2,kz*P+dir[1]*P/2,dir[0],dir[1]):1;
  let extra=a.length-(Math.ceil(want*factor)+1);for(let i=a.length-1;i>=0&&extra>0;i--){const c=a[i];if(c.mode!=='rail'||c.police||c.npcId||!vehicles.includes(c))continue;if(Math.hypot(c.x-ctr.x,c.z-ctr.z)<viewR+15)continue;removeVehicle(c);extra--}}
 const N=city.N,k0x=Math.max(0,Math.floor((ctr.x-Rp)/P)),k1x=Math.min(N,Math.ceil((ctr.x+Rp)/P)),k0z=Math.max(0,Math.floor((ctr.z-Rp)/P)),k1z=Math.min(N,Math.ceil((ctr.z+Rp)/P));
 for(let kx=k0x;kx<=k1x;kx++)for(let kz=k0z;kz<=k1z;kz++)for(let d=0;d<4;d++){if(!segExists(kx,kz,d)||obraClosed(kx,kz,d))continue;
  const mx=kx*P+D[d][0]*P/2,mz=kz*P+D[d][1]*P/2;const md=Math.hypot(mx-ctr.x,mz-ctr.z);if(md>Rp)continue;
  const localWant=want*roadTrafficFactor(mx,mz,D[d][0],D[d][1]);
  const regionLimit=Math.max(2,Math.ceil(localWant*7));
  for(let li=0;li<2;li++){if(budget<=0)return;if(!laneValid(kx,kz,d,li))continue;const a=laneMap.get(laneKey(kx,kz,d,li));const ss=a?a.map(o=>o._s):[];
   let need=Math.floor(localWant-ss.length+R2());if(need<=0)continue;let sites;
   if(initial||md>viewR+30)sites=null;else{const ep=lanePt(kx,kz,d,li,RW/2+3);if(Math.hypot(ep[0]-ctr.x,ep[1]-ctr.z)<viewR)continue;sites=[RW/2+3];need=1}
   for(let n=0;n<need&&budget>0;n++){const s=sites?sites[0]:RW/2+3+R2()*(SEG_END-RW/2-9);if(ss.some(o=>Math.abs(o-s)<9))continue;
    const p=lanePt(kx,kz,d,li,s);if(Math.hypot(p[0]-PL.x,p[1]-PL.z)<9||trafficCalmAt(p[0],p[1]))continue;if(carsNear(p[0],p[1],5).some(o=>Math.hypot(o.x-p[0],o.z-p[1])<6))continue;
    if(region.nearby(p[0],p[1],regionRadius)>=regionLimit)continue;
    const spawned=makeRailCar(kx,kz,d,li,s);region.add(spawned);ss.push(s);budget--}}}
 // 0% de trânsito significa ultra-baixa densidade, não deserto sem veículos.
 // Verifica a região do jogador e coloca ao menos um veículo ambiente se estiver vazia.
 if(S.traffic<=1&&S.style!=='inverted'&&S.style!=='haze'&&!ONLINE.on){
  const origin=PL.car||PL;
  if(!vehicles.some(c=>c!==PL.car&&c.alive&&!c.police&&!c.bench&&Math.hypot(c.x-origin.x,c.z-origin.z)<180)){
   let spawned=false;
   for(let k=0;k<city.N*city.N*4&&!spawned;k++){
    const kx=Math.max(0,Math.min(city.N,Math.round(origin.x/P)+(Math.floor(k/4)%7)-3));
    const kz=Math.max(0,Math.min(city.N,Math.round(origin.z/P)+(Math.floor(k/28)%7)-3));
    const d=k%4,li=0;
    if(!segExists(kx,kz,d)||obraClosed(kx,kz,d)||!laneValid(kx,kz,d,li))continue;
    const sp=lanePt(kx,kz,d,li,RW/2+10),dist=Math.hypot(sp[0]-origin.x,sp[1]-origin.z);
    if(dist<14||dist>170||carsNear(sp[0],sp[1],8).length)continue;
    makeRailCar(kx,kz,d,li,RW/2+10);spawned=true;
   }
  }
 }
}

function reacquire(c){const N=city.N,ca=Math.cos(c.a),sa=Math.sin(c.a);
 const tryH=()=>{const kz=Math.round(c.z/P);if(kz<0||kz>N||Math.abs(c.z-kz*P)>RW/2+1)return false;const d=ca>=0?0:2;const kx=d===0?Math.floor(c.x/P):Math.ceil(c.x/P);if(!canDrive(kx,kz,d))return false;c.ai.kx=kx;c.ai.kz=kz;c.ai.d=d;c.ai.nd=null;c.ai.li=bestLane(kx,kz,d,(c.z-kz*P)*D[d][0]);return true};
 const tryV=()=>{const kx=Math.round(c.x/P);if(kx<0||kx>N||Math.abs(c.x-kx*P)>RW/2+1)return false;const d=sa>=0?1:3;const kz=d===1?Math.floor(c.z/P):Math.ceil(c.z/P);if(!canDrive(kx,kz,d))return false;c.ai.kx=kx;c.ai.kz=kz;c.ai.d=d;c.ai.nd=null;c.ai.li=bestLane(kx,kz,d,-(c.x-kx*P)*D[d][1]);return true};
 const ok=Math.abs(ca)>=Math.abs(sa)?(tryH()||tryV()):(tryV()||tryH());if(ok)return true;
 /* v1r6: antes, sem via reta na frente, c.ai=null e o carro ficava com acelerador/volante TRAVADOS no último valor → rodava em círculos e batia nos prédios.
    Agora tenta a faixa mais próxima (≤18 m, no sentido do carro se der); sem nenhuma, para (freio de mão) e sai depois, fora de vista. */
 {let best=null,bd=Infinity;const cx=Math.round(c.x/P),cz=Math.round(c.z/P);
  for(let ix=Math.max(0,cx-1);ix<=Math.min(N,cx+1);ix++)for(let iz=Math.max(0,cz-1);iz<=Math.min(N,cz+1);iz++)for(let d=0;d<4;d++){if(!canDrive(ix,iz,d))continue;
   for(let li=0;li<2;li++){if(!laneValid(ix,iz,d,li))continue;const dx=D[d][0],dz=D[d][1],ss=clamp((c.x-ix*P)*dx+(c.z-iz*P)*dz,RW/2+3,SEG_END-3),pt=lanePt(ix,iz,d,li,ss),dist=Math.hypot(pt[0]-c.x,pt[1]-c.z)+(dx*ca+dz*sa<0?6:0);
    if(dist<bd){bd=dist;best={kx:ix,kz:iz,d,li,nd:null}}}}
  if(best&&bd<18){Object.assign(c.ai,best);c.ai.stun=0;c.ai.blockT=0;c.ai.rev=0;c.ai.dodge=0;return true}}
 c.ai=null;c.thr=0;c.steerT=0;c.hand=true;c.fleeAbandoned=simT;return false}
/* v3 r5: sem closure/objeto por carro por quadro (antes: chk=()=>{} e dbStopFor({...ai,s})) */
const AI_DBQ={kx:0,kz:0,d:0,turn:null,s:0};
function aiChk(c,ca,sa,scan,ox,oz,len,block){const ex=ox-c.x,ez=oz-c.z;if(ex*ex+ez*ez>(scan+2)*(scan+2))return block;const lx=ex*ca+ez*sa,lz=-ex*sa+ez*ca;if(lx>0&&lx<scan&&Math.abs(lz)<2.2)return Math.min(block,lx-c.t.L/2-len);return block}
function aiUpdate(c,dt){
 const ai=c.ai,N=city.N,panic=!!c.weaponPanic,checkpoint=checkpointFor(c);
 if(!laneValid(ai.kx,ai.kz,ai.d,ai.li||0))ai.li=0;
 if(panic)ai.panicLaneCd=Math.max(0,(ai.panicLaneCd||0)-dt);
 const off=laneOff(ai.kx,ai.kz,ai.d,ai.li||0);
 if(!c.alive){c.thr=0;c.hand=true;return}
 if(ai.stun>0){ai.stun-=dt;c.thr=-.4;c.steerT=0;if(ai.stun<=0)reacquire(c);return}
 if(ai.rev>0){ai.rev-=dt;c.hand=false;c.steerT=-ai.side;c.thr=c.fwd>-2.5?-.65:0;if(ai.rev<=0)ai.dodge=2.8;return}
 const[dx,dz]=D[ai.d],rx=-dz,rz=dx;const ax=ai.kx*P+rx*off,az=ai.kz*P+rz*off;
 const s=(c.x-ax)*dx+(c.z-az)*dz,lat=(c.x-ax)*rx+(c.z-az)*rz;
 if(Math.abs(lat)>11||s<-14||s>P+14){reacquire(c);return}
 const bkx=ai.kx+dx,bkz=ai.kz+dz;
 if(ai.nd===null)ai.nd=chooseNext(bkx,bkz,ai.d);
 const nd=ai.nd,[ndx,ndz]=D[nd],nrx=-ndz,nrz=ndx;const nli=laneValid(bkx,bkz,nd,ai.li||0)?(ai.li||0):(laneValid(bkx,bkz,nd,0)?0:1),noff=laneOff(bkx,bkz,nd,nli);const bax=bkx*P+nrx*noff,baz=bkz*P+nrz*noff;const sn=(c.x-bax)*ndx+(c.z-baz)*ndz;
 const LOOK=6+Math.abs(c.fwd)*.45;let tx,tz;
 const straight=nd===ai.d;
 if(straight?s+LOOK<P:s+LOOK<P-RW/2-2){tx=ax+dx*(s+LOOK);tz=az+dz*(s+LOOK)}
 else{const q=Math.max(sn,0)+(straight?LOOK:4.5);tx=bax+ndx*q;tz=baz+ndz*q}
 if(sn>RW/2+1){ai.kx=bkx;ai.kz=bkz;ai.d=nd;ai.li=nli;ai.nd=null}
 // Com medo, o motorista acelera tudo nas retas, mas reduz nas curvas para continuar na rua.
 let vt=panic?Math.min(c.t.vmax*.42,19):ai.vmax;
 if(!straight&&s>P-RW/2-22)vt=Math.min(vt,panic?6.8:5.5);
 if(city.dbs&&city.dbs.length){const q=AI_DBQ;q.kx=ai.kx;q.kz=ai.kz;q.d=ai.d;q.turn=ai.turn;q.s=s;const stop=dbStopFor(q,c.t);if(stop!==null)vt=Math.min(vt,Math.max(0,stop)*1.1)}
 // traffic light
 if(s<SEG_END-1&&!c.crim&&!c.npcAmb&&!panic){const stopS=SEG_END-4.4-c.t.L/2,dist=stopS-s;if(dist>-.6){const sg=sigT(bkx,bkz,ai.d);if(sg===2||(sg===1&&dist>2.5))vt=Math.min(vt,Math.max(0,dist)*1.1)}}
 const ca=Math.cos(c.a),sa=Math.sin(c.a);let block=99;
 const scan=panic?30:20,nearbyCars=carsNearTmp(c.x,c.z,scan+3);
 for(const o of nearbyCars)if(o!==c&&o.alive)block=aiChk(c,ca,sa,scan,o.x,o.z,o.t.L/2,block);
 if(!PL.car&&!PL.dead)block=aiChk(c,ca,sa,scan,PL.x,PL.z,.4,block);
 for(const p of peds)if(p.state==='flee'||p.state==='down'||p.blitzCop)block=aiChk(c,ca,sa,scan,p.x,p.z,.4,block);
 if(c.crim&&block<14){ai.dodge=Math.max(ai.dodge||0,.5);ai.side=ai.side||(R2()<.5?1:-1)}
 if(panic&&block<17&&block>0&&s>RW/2+9&&s<SEG_END-20&&(ai.panicLaneCd||0)<=0){
  // Só ultrapassa pela OUTRA faixa do MESMO sentido e se houver espaço lateral.
  // Ruas estreitas ou faixa ocupada: freia e espera, sem usar calçada ou contramão.
  const other=1-(ai.li||0);
  if(laneValid(ai.kx,ai.kz,ai.d,other)){
   const shift=laneOff(ai.kx,ai.kz,ai.d,other)-off;
   let clear=true;
   for(const o of nearbyCars){if(o===c||!o.alive)continue;
    const ox=o.x-c.x,oz=o.z-c.z,along=ox*dx+oz*dz,side=ox*rx+oz*rz;
    if(along>-9&&along<19&&Math.abs(side-shift)<(c.t.W+o.t.W)*.5+.9){clear=false;break}
   }
   if(clear)for(const q of peds){if(q.state==='dead'||q.state==='inside'||q.state==='lie')continue;
    const ox=q.x-c.x,oz=q.z-c.z,along=ox*dx+oz*dz,side=ox*rx+oz*rz;
    if(along>-4&&along<17&&Math.abs(side-shift)<c.t.W*.5+1){clear=false;break}
   }
   if(clear){ai.li=other;ai.panicLaneCd=3.0;tx+=rx*shift;tz+=rz*shift;vt=Math.min(vt,Math.max(5,block*1.35));}
  }
 }
 if(c.jamRush&&JAMMER.day&&JAMMER.left>0&&!panic){block=99;vt=Math.max(vt,straight?ai.vmax:9)} /* r54: ctOS de dia — ignora quem está na frente e o sinal */
 if(block<99){
  const lim=panic?Math.min(Math.max(0,(block-2.6)*1.7),Math.sqrt(Math.max(0,block-2.8)*13)):
   Math.max(0,(block-2.2)*1.1);
  if(panic)vt=Math.min(vt,(ai.panicLaneCd||0)>2.2?Math.max(lim,5):lim);
  else if(ai.ignore>0||ai.dodge>0)vt=Math.min(vt,ai.dodge>0?Math.max(lim,4.5):4);
  else vt=Math.min(vt,lim)
 }
 if(vt<.5&&block<99&&block<4){ai.blockT+=dt;const near=Math.hypot(c.x-PL.x,c.z-PL.z)<40;
  if(ai.blockT>2.2&&(ai.hornT=(ai.hornT||0)-dt)<=0){ai.hornT=3+R2()*2.5;if(near)horn(.16)}
  if(!ai.patience)ai.patience=10+R2()*5;
  if(!panic&&!checkpoint&&ai.blockT>ai.patience){ai.blockT=0;ai.patience=0;ai.side=R2()<.5?1:-1;ai.rev=1.1;if(near)horn(.22);return}}else{ai.blockT=0;ai.hornT=0}
 if(ai.dodge>0){ai.dodge-=dt;if(!panic){tx+=-sa*ai.side*3.4;tz+=ca*ai.side*3.4}}
 if(ai.ignore>0)ai.ignore-=dt;
 if(checkpoint){const b=checkpoint.b,along=checkpoint.a+Math.max(5,Math.abs(c.fwd)*.5),k=checkpointOffset(along),lat=off+(2.8-off)*k;tx=b.x+b.ux*along-b.uz*lat;tz=b.z+b.uz*along+b.ux*lat;vt=Math.min(vt,checkpointSpeed(c,checkpoint));ai.rev=0;ai.dodge=0;}
 const ex=tx-c.x,ez=tz-c.z;const lx=ex*ca+ez*sa,lz=-ex*sa+ez*ca;
 c.steerT=clamp(Math.atan2(lz,lx)/(c.t.steer*.85),-1,1);
 const v=c.fwd;
 if(v<vt)c.thr=panic?clamp((vt-v)*.75,0,1):clamp((vt-v)*.45,0,.85);else if(v>vt+.8)c.thr=-clamp((v-vt)*.35,.1,1);else c.thr=0;
 c.hand=vt<.3&&v<.6;if(c.hand)c.thr=0;
}

/* ================= PEDESTRIANS ================= */
const peds=[];
function perim(ri){const[x0,z0,x1,z1]=city.rects[ri];return[x0+2,z0+2,x1-2,z1-2]}
function rectNear(x,z){let best=0,bd=1e9;city.rects.forEach((r,i)=>{const cx=clamp(x,r[0],r[2]),cz=clamp(z,r[1],r[3]),d=Math.hypot(x-cx,z-cz);if(d<bd){bd=d;best=i}});return best}
function perimPoint(r,t){const[x0,z0,x1,z1]=r,w=x1-x0,h=z1-z0,L=2*(w+h);t=((t%L)+L)%L;
 if(t<w)return[x0+t,z0,1,0];t-=w;if(t<h)return[x1,z0+t,0,1];t-=h;if(t<w)return[x1-t,z1,-1,0];t-=w;return[x0,z1-t,0,-1]}
function perimNearest(r,x,z){const[x0,z0,x1,z1]=r,w=x1-x0,h=z1-z0;const cx=clamp(x,x0,x1),cz=clamp(z,z0,z1);
 const dN=Math.abs(z-z0),dS=Math.abs(z-z1),dW=Math.abs(x-x0),dE=Math.abs(x-x1);const m=Math.min(dN,dS,dW,dE);
 if(m===dN)return cx-x0;if(m===dE)return w+(cz-z0);if(m===dS)return w+h+(x1-cx);return 2*w+h+(z1-cz)}
function inland(){const c=city.coast;return c===0?[0,1]:c===1?[0,-1]:c===2?[1,0]:[-1,0]}
function spawnLying(x,z,pal){const ch=makeCharacter(pal||pick2(PED_PALS));const p={...ch,ri:0,r:null,pitch:.8+R2()*.5,t:0,spd:0,dir:1,state:'lie',fixed:true,timer:0,x,z,vx:0,vz:0,mx:1,mz:0,anim:0,gy:coastGround(x,z)??.2,rot:(R2()<.5?1:-1)*Math.PI/2};peds.push(p);return p}
const TOMMY={sites:[],got:new Set(),bonus:false};
/* r63 · estatísticas do save (aba ESTATÍSTICAS do Registro) */
const STATS={destroyed:0,wanted:0,drive:0,arrests:0,escapes:0,stolen:0};
function statsTick(dt){if(!played||PROLOGUE.cut||PL.dead)return;if(POL.wanted)STATS.wanted+=dt;if(PL.car&&PL.car.alive&&!PL.heli)STATS.drive+=dt}
function statsFmt(sec){const m=Math.floor(sec/60),h=Math.floor(m/60);return h?h+'h '+String(m%60).padStart(2,'0')+'min':m+'min '+String(Math.floor(sec%60)).padStart(2,'0')+'s'}
function statsHtml(){const en=S.lang==='en',t=(a,b)=>en?b:a,row=(l,v)=>'<div class="records-stat" style="margin-top:6px">'+l+': <strong>'+v+'</strong></div>';
 return row(t('Carros destruídos','Cars destroyed'),STATS.destroyed)+row(t('Tempo procurado','Time wanted'),statsFmt(STATS.wanted))+row(t('Tempo dirigindo','Time driving'),statsFmt(STATS.drive))+row(t('Dias que se passaram','Days passed'),DN.day||0)+row(t('Vezes preso','Times arrested'),STATS.arrests)+row(t('Fugas da prisão','Jail escapes'),STATS.escapes)+row(t('Carros roubados','Cars stolen'),STATS.stolen)}
function tommyInit(){
 TOMMY.sites=[];TOMMY.got=new Set();TOMMY.bonus=false;
 if(city.haze||S.style==='inverted')return;
 const rand=mulberry32((S.seed^0x74104d59)>>>0),candidates=[],used=new Set();
 const clear=(x,z)=>!inWater(x,z)&&!query(x,z,.65).some(c=>!c.dead&&c.kind!=='pole'&&x>c.x0-.6&&x<c.x1+.6&&z>c.z0-.6&&z<c.z1+.6);
 for(const q of city.catSpots||[]){if(q.residential)continue;const r=q.r,x=(r[0]+r[2])/2,z=(r[1]+r[3])/2,ri=rectNear(x,z),b=city.rects[ri];if(city.info[ri]?.kind!=='bld'||Math.min(x-b[0],b[2]-x,z-b[1],b[3]-z)<SW+7||!clear(x,z))continue;candidates.push({x,z,ri,rank:rand()});}
 // Fallback: search the central interior of building blocks, never a sidewalk.
 for(let ri=0;ri<city.rects.length;ri++){if(city.info[ri].kind!=='bld')continue;const b=city.rects[ri],cx=(b[0]+b[2])/2,cz=(b[1]+b[3])/2;for(const [dx,dz] of [[0,0],[4,0],[-4,0],[0,4],[0,-4],[7,7],[-7,-7]]){const x=cx+dx,z=cz+dz;if(Math.min(x-b[0],b[2]-x,z-b[1],b[3]-z)>=SW+7&&clear(x,z)){candidates.push({x,z,ri,rank:2+rand()});break;}}}
 candidates.sort((a,b)=>a.rank-b.rank);for(const q of candidates){if(used.has(q.ri))continue;used.add(q.ri);TOMMY.sites.push({...q,id:TOMMY.sites.length,p:null});if(TOMMY.sites.length===5)break;}
 if(TOMMY.sites.length<5)for(const q of candidates){if(TOMMY.sites.some(t=>Math.hypot(t.x-q.x,t.z-q.z)<12))continue;TOMMY.sites.push({...q,id:TOMMY.sites.length,p:null});if(TOMMY.sites.length===5)break;}
 if(TOMMY.sites.length<5)console.warn('Tommy: only',TOMMY.sites.length,'safe building interiors for seed',S.seed);
}
function tommyDefeat(p){if(p.tommy===undefined||TOMMY.got.has(p.tommy))return;TOMMY.got.add(p.tommy);if(!CHEAT.used)money(1000,'TOMMY · +$1.000');if(TOMMY.got.size===5&&!TOMMY.bonus){TOMMY.bonus=true;if(!CHEAT.used)money(5000,'TIMOTY VERTECCIO · +$5.000');}toast('Matar Timoty Verteccio '+TOMMY.got.size+'/5'+(TOMMY.got.size===5?' · COMPLETO':''));}
function tommyTick(dt){
 if(!running||!worldOn('tommy'))return;
 for(const q of TOMMY.sites){let p=q.p;if(TOMMY.got.has(q.id)){if(p&&p.state!=='dead'){removePed(p);q.p=null;}continue;}
  if(p&&p.state==='dead'){tommyDefeat(p);continue;}
  if(!p||!peds.includes(p)){p=q.p=spawnPed(null,{x:q.x,z:q.z,vx:0,vz:0,pal:{...PED_PALS[0],cap:'#212025',capDark:'#17161d',shirt:'#45b8ac',pants:'#ddd9cd',shoes:'#31281f',hair:'#34251d',skin:'#dca67b'}});p.tommy=q.id;p.hp=30;p.fixed=true;p.state='patio';p.gy=groundY(p.x,p.z);p.fireT=.8;}
  p.vx=p.vz=0;const target=PL.car||PL,dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);if(PL.inside||PL.dead){p.tommyAlert=false;continue;}if(d<=16)p.tommyAlert=true;if(d>48){p.tommyAlert=false;continue;}if(!p.tommyAlert)continue;p.mx=dx/(d||1);p.mz=dz/(d||1);p.fireT-=dt;if(p.fireT>0)continue;p.fireT=.13;
  const o=new THREE.Vector3(p.x,p.gy+1.2,p.z),aim=new THREE.Vector3(target.x+(R2()-.5)*.35,(target.gy||0)+(target===PL?(PL.jy||0)+1.0:Math.min(1.0,target.t.H*.65)),target.z+(R2()-.5)*.35),dir=aim.sub(o).normalize(),hit=rayHit(o,dir,50,null,p);
  tracer(o,hit.pt,0xffbc69);gunSound(Math.max(.08,1-d/60),1,'smg');
  if(hit.player){PL.hp-=armorHit(9);if(PL.hp<=0)killPlayer('TOMMY');}else if(hit.car){hit.car.hp-=6;if(hit.car.hp<=0&&hit.car.alive)setOnFire(hit.car);}
 }
}
/* r34: lote não-rural cercado de roça (motel, posto da roça…) era o único "aceito" no sorteio perto do jogador → juntava pedestre ali.
   Agora conta como roça: o sorteio espalha os pedestres pelos lotes do entorno. */
function lotRuralIsle(ri){const f=city.info[ri];if(!f)return false;if(f._rIsle!==undefined)return f._rIsle;const r=city.rects[ri],mx=(r[0]+r[2])/2,mz=(r[1]+r[3])/2,o=RW+6;let n=0;
 for(const[x,z] of [[r[0]-o,mz],[r[2]+o,mz],[mx,r[1]-o],[mx,r[3]+o]]){const j=rectNear(x,z),g=j>=0&&city.info[j];if(g&&j!==ri&&(g.kind==='rural'||g.forest))n++}return f._rIsle=n>=2}
function pedLotOk(ri){const f=city.info[ri];return f&&f.kind!=='rural'&&f.kind!=='industrial'&&!lotRuralIsle(ri)}
function spawnPed(near,at){const NR=city.rects.length;let ri=0,fb=-1;
 for(let tr=0;tr<6;tr++){if(near){const a=R2()*6.283,d=near.min+R2()*(near.max-near.min);ri=rectNear(near.x+Math.cos(a)*d,near.z+Math.sin(a)*d)}else ri=Math.floor(R2()*NR);if(at||pedLotOk(ri)||tr===5&&R2()<.25)break;if(fb<0&&city.info[ri]&&city.info[ri].kind==='rural')fb=ri}
 if(!at&&near&&fb>=0&&!pedLotOk(ri)&&(!lotRuralIsle(ri)||R2()>.15))ri=fb; /* sem lote de calçada perto: um lote de roça comum, não a ilha */
 const ch=makeCharacter(at&&at.pal||pick2(PED_PALS));const r=perim(ri);const L=2*((r[2]-r[0])+(r[3]-r[1]));
 const p={...ch,ri,r,pitch:.8+R2()*.5,t:R2()*L,spd:1.1+R2()*.8,dir:R2()<.5?1:-1,state:'walk',timer:0,x:0,z:0,vx:0,vz:0,mx:1,mz:0,anim:R2()*10,gy:.2,rot:0};
 const pt=perimPoint(r,p.t);p.x=pt[0];p.z=pt[1];
 if(!at&&near&&city.strips&&city.strips.length&&R2()<city.pedRatio/(1+city.pedRatio)){const c=city.strips.filter(q=>{const d=Math.hypot((q[0]+q[2])/2-near.x,(q[1]+q[3])/2-near.z);return d>near.min&&d<near.max});
  if(c.length){p.strip=c[Math.floor(R2()*c.length)];p.t=R2()*Math.hypot(p.strip[2]-p.strip[0],p.strip[3]-p.strip[1]);const q=pedPoint(p);p.x=q[0];p.z=q[1]}}
 if(at){p.x=at.x;p.z=at.z;p.state='flee';p.timer=2.5;p.vx=at.vx;p.vz=at.vz;p.ri=rectNear(p.x,p.z);p.r=perim(p.ri)}
 peds.push(p);if(at&&at.main)pedExact(p);return p}
/* v79r16: Claire/Nathan como ped (motel, dupla, casa): no modo 3D o ped nascia com o boneco "mais parecido" do pool (NPC comum, outra calça, botões) até a roupa dele ser montada aos poucos — e nos cortes a fila nem andava. Agora monta na hora. */
function pedExact(p){const px=p&&p.sp&&p.sp.userData.texProxy;if(S.sprite8!==true||!px||!px.standIn)return;for(let i=0;i<800&&px.standIn;i++){try{ped3dJobTick()}catch(e){console.error(e);break}}}
function spawnBalconyPed(x,z,y,mx,mz,pal){const ch=makeCharacter(pal||pick2(PED_PALS));const gy=groundY(x,z);const p={...ch,ri:rectNear(x,z),r:null,pitch:.8+R2()*.5,t:0,spd:0,dir:1,state:'fare',fixed:true,timer:0,x,z,vx:0,vz:0,mx:mx||0,mz:mz||1,anim:R2()*10,gy,rot:0,jy:Math.max(.1,y-gy),balcony:true};p.r=perim(p.ri);p.sh.visible=false;peds.push(p);return p}
const UMB={geo:new THREE.ConeGeometry(.85,.38,12),stick:new THREE.CylinderGeometry(.03,.03,1,5),mats:['#e04a3a','#2a8ad6','#f2c21a','#1e1e24','#3ab36a','#ff6fae','#7a4ad6'].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.55})),sm:new THREE.MeshStandardMaterial({color:0x333333})};
function giveUmbrella(p){const g=new THREE.Group();const c=new THREE.Mesh(UMB.geo,UMB.mats[Math.floor(R2()*UMB.mats.length)]);c.castShadow=true;const st=new THREE.Mesh(UMB.stick,UMB.sm);st.position.y=-.5;g.add(c,st);scene.add(g);p.umb=g}
function dropUmbrella(p){if(p.umb){scene.remove(p.umb);p.umb=null}}
/* v78: densidade por zona — na roça/indústria em volta do foco, bem menos gente (antes o alvo era o mesmo e todos nasciam na roça) */
const PEDZ={t:-9,k:1};
function pedZoneK(){const now=simT||0;if(now-PEDZ.t<2)return PEDZ.k;PEDZ.t=now;const f=TVM.on?TVM.foc:(PL.car||PL);let n=0,r=0;
 city.rects.forEach((q,ri)=>{const cx=(q[0]+q[2])/2,cz=(q[1]+q[3])/2;if(Math.abs(cx-f.x)>160||Math.abs(cz-f.z)>160)return;n++;const k=city.info[ri]&&city.info[ri].kind;if(k==='rural'||k==='industrial'||k==='haze')r++});
 const urb=n?1-r/n:1;PEDZ.k=.18+.82*urb;return PEDZ.k}
function pedTarget(){if(S.style==='inverted'||S.style==='haze')return 0;return Math.max(1,Math.round(S.peds*(50/75)*1.25*(1+(city.pedRatio||0))*pedZoneK()))}
/* v3 r5: pedPointTmp = pedPoint sem alocar (devolve PEDPT reaproveitado; ler na hora). Usado no laço de updatePeds. */
const PEDPT=[0,0,0,0];
function pedPointTmp(p){const o=PEDPT;if(!p.strip){const r=p.r,x0=r[0],z0=r[1],x1=r[2],z1=r[3],w=x1-x0,h=z1-z0,L=2*(w+h);let t=((p.t%L)+L)%L;
 if(t<w){o[0]=x0+t;o[1]=z0;o[2]=1;o[3]=0;return o}t-=w;if(t<h){o[0]=x1;o[1]=z0+t;o[2]=0;o[3]=1;return o}t-=h;if(t<w){o[0]=x1-t;o[1]=z1;o[2]=-1;o[3]=0;return o}t-=w;o[0]=x0;o[1]=z1-t;o[2]=0;o[3]=-1;return o}
 const q=p.strip,L=Math.hypot(q[2]-q[0],q[3]-q[1]);if(p.t>L){p.t=L;p.dir=-1}else if(p.t<0){p.t=0;p.dir=1}
 const ux=(q[2]-q[0])/L,uz=(q[3]-q[1])/L;o[0]=q[0]+ux*p.t;o[1]=q[1]+uz*p.t;o[2]=ux;o[3]=uz;return o}
function pedPoint(p){if(!p.strip)return perimPoint(p.r,p.t);const q=p.strip,L=Math.hypot(q[2]-q[0],q[3]-q[1]);if(p.t>L){p.t=L;p.dir=-1}else if(p.t<0){p.t=0;p.dir=1}
 const ux=(q[2]-q[0])/L,uz=(q[3]-q[1])/L;return[q[0]+ux*p.t,q[1]+uz*p.t,ux,uz]}
function removePed(p){clearBurnBar(p);if(p.dropPk)pedDropsClear(p); /* v4 r19: espólio some com o corpo */if(p.skb){skDisposeG(p.skb);p.skb=null}{const V=p.sp&&p.sp.userData.reliefV;if(V){for(let i=1;i<V.length;i++)if(V[i])V[i].dispose();p.sp.userData.reliefV=null}}releasePatioGuest(p);for(const ch of city.chunks.values()){const i=(ch.peds||[]).indexOf(p);if(i>=0)ch.peds.splice(i,1)}if(p.poseMesh){scene.remove(p.poseMesh);p.poseMesh.geometry.dispose();p.poseMesh.material.dispose();p.poseMesh=null}dropUmbrella(p);scene.remove(p.sp);scene.remove(p.sh);p.sp.material.dispose();charTexRelease(p.tex);p.sh.geometry.dispose();p.sh.material.dispose();const k=peds.indexOf(p);if(k>=0)peds.splice(k,1)}
function clearPeds(){while(peds.length)removePed(peds[0])}
function circleVsWorld(o,r){const near=query(o.x,o.z,r+1);
 const jy=o.jy||0;for(const b of near){if(b.dead||(b.drawbridgeGate&&o===PL&&SKATE.ride)||(b.lhBase&&LH.up))continue;if(b.kind==='bin'&&jy>(b.bin?.height??.9))continue;if(o===PL&&b.kind==='bin'&&b.bin&&!b.bin.big&&Math.hypot(o.x-clamp(o.x,b.x0,b.x1),o.z-clamp(o.z,b.z0,b.z1))<r){const bx=(b.x0+b.x1)/2-o.x,bz=(b.z0+b.z1)/2-o.z,l=Math.hypot(bx,bz)||1;knockBin(b,bx/l*5,bz/l*5);continue}if(o===PL&&PL.ubr&&b.low)continue;if(jy>0&&b.low&&jy>b.low-.15)continue;const cx=clamp(o.x,b.x0,b.x1),cz=clamp(o.z,b.z0,b.z1);let dx=o.x-cx,dz=o.z-cz;const d=Math.hypot(dx,dz);
  if(d<r){if(d>1e-5){o.x=cx+dx/d*r;o.z=cz+dz/d*r;const vn=(o.vx||0)*dx/d+(o.vz||0)*dz/d;if(vn<0&&o.vx!==undefined){o.vx-=vn*dx/d*1.5;o.vz-=vn*dz/d*1.5}}
   else{const d0=o.x-b.x0,d1=b.x1-o.x,d2=o.z-b.z0,d3=b.z1-o.z,m=Math.min(d0,d1,d2,d3);if(m===d0)o.x=b.x0-r;else if(m===d1)o.x=b.x1+r;else if(m===d2)o.z=b.z0-r;else o.z=b.z1+r}}}}
function circleVsCars(o,r,isPlayer){let hit=0,hc=null;const jy=o.jy||0;
 for(const c of carsNearTmp(o.x,o.z,10)){if(c===PL.car&&isPlayer)continue;if(c.t.boat||c.airY>1.2)continue;if(jy>c.t.H-.35)continue;const dx=o.x-c.x,dz=o.z-c.z;if(dx*dx+dz*dz>(c.t.R+r+.5)**2)continue;
  const ca=Math.cos(c.a),sa=Math.sin(c.a);const lx=dx*ca+dz*sa,lz=-dx*sa+dz*ca;const hl=c.t.L/2+r,hw=c.t.W/2+r;
  if(Math.abs(lx)<hl&&Math.abs(lz)<hw){const ex=hl-Math.abs(lx),ez=hw-Math.abs(lz);let nlx=0,nlz=0,dep;if(ex<ez){nlx=Math.sign(lx);dep=ex}else{nlz=Math.sign(lz);dep=ez}
   const nx=nlx*ca-nlz*sa,nz=nlx*sa+nlz*ca;o.x+=nx*dep;o.z+=nz*dep;
   const[pvx,pvz]=pointVel(c,o.x,o.z);const rel=pvx*nx+pvz*nz-((o.vx||0)*nx+(o.vz||0)*nz);
   if(rel>hit){hit=rel;hc={c,nx,nz,pvx,pvz,front:ex<ez&&((nlx>0&&c.fwd>.5)||(nlx<0&&c.fwd<-.5))}}}}
 return hc&&hit>0?{...hc,v:hit}:null}
// Apenas alguns moradores transitam pelos caminhos residenciais PERTO do jogador.
// Nao se mantém um NPC por quarteirao: o orçamento global evita custos altos.
let resPedTimer=3;
function residentialPedTick(dt){
 resPedTimer-=dt;if(resPedTimer>0)return;resPedTimer=3.5+R2()*2;
 const focus=TVM.on?TVM.foc:PL.car||PL,active=peds.filter(p=>p.resPath);
 for(const p of active)if(!p.fixed||p.state==='dead'||Math.hypot(p.x-focus.x,p.z-focus.z)>120){if(p.state!=='dead')removePed(p);else p.resPath=null}
 for(const p of active)if(p.resPath&&p.state!=='resWalk'){p.resPath=null;p.fixed=false}
 const count=peds.filter(p=>p.resPath).length,cap=MOB_LITE?2:4;
 if(!running||PL.inside||S.peds<12||S.style==='inverted'||S.style==='haze'||count>=cap)return;
 const near=(city.denseWalkPaths||[]).filter(q=>q.points.length>=2&&Math.hypot(q.points[0][0]-focus.x,q.points[0][1]-focus.z)<105&&Math.hypot(q.points[0][0]-focus.x,q.points[0][1]-focus.z)>9&&
  !peds.some(p=>p.resPath&&p.resRi===q.ri));
 if(!near.length)return;
 const q=near[Math.floor(R2()*near.length)],path=q.points;
 const p=spawnPed(null,{x:path[0][0],z:path[0][1],vx:0,vz:0});
 p.ri=q.ri;p.r=perim(q.ri);p.fixed=true;p.resPath=path;p.resRi=q.ri;p.resIdx=1;p.resDir=1;p.state='resWalk';p.spd=1+R2()*.4;p.vx=p.vz=0;p.gy=groundY(p.x,p.z);
}
const PEDS_SNAP=[];
function updatePeds(dt){try{ped3dJobTick()}catch(e){console.error(e);PED3JOB.cur=null}
 const anyRain=CELLS.length>0;
 const frameDt=dt,focal=TVM.on?TVM.foc:PL.car||PL;
 const _pl=PEDS_SNAP;_pl.length=0;for(let i=0;i<peds.length;i++)_pl.push(peds[i]); /* v3 r5: cópia num array reaproveitado (era peds.slice() por quadro) */
 for(let _i=0;_i<_pl.length;_i++){const p=_pl[_i];
  if(p.flameBurn)pedBurnTick(p,frameDt);
  const dryX=p.x,dryZ=p.z;dt=frameDt;const dist2=(p.x-focal.x)**2+(p.z-focal.z)**2;
  const ambient=!p.fixed&&!p.cop&&(p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze'||p.state==='bwalk')&&(p.fin===undefined||p.fin>=1);
  const interval=ambient?(dist2>140*140?.12:dist2>80*80?.066:dist2>42*42?.033:0):0; /* v78: >42 m a 30 Hz, >80 m a 15 Hz, >140 m a 8 Hz */
  if(interval){p._simPending=(p._simPending||0)+frameDt;p._simWait=(p._simWait===undefined?((p.x*7.13+p.z*3.17)%1+1)%1*interval:p._simWait)-frameDt;if(p._simWait>0)continue;dt=p._simPending;p._simPending=0;p._simWait+=interval}else{dt+=p._simPending||0;p._simPending=0;p._simWait=undefined}
  p.anim+=dt;
  if(p.robberyGun>0){p.robberyGun-=dt;p.robberyShootT-=dt;
   if(p.robberyGun>0&&p.robberyShootT<=0&&p.state!=='dead'&&p.state!=='down'&&!PL.dead&&PL.car===p.robberyCar&&Math.hypot(p.x-PL.x,p.z-PL.z)<34){
    p.robberyShootT=1+R2()*.8;copShoot(p)}
   if(p.robberyGun<=0)p.robberyCar=null}
  if(!p.fixed&&(p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze')){{
   // Chuvas ambientais mudam devagar: amostrar por pedestre a ~4 Hz em vez de todo frame.
   p._rainT=(p._rainT||0)-dt;
   if(p._rainT<=0){p._rainT=.20+R2()*.10;p._rainValue=anyRain?rainAt(p.x,p.z):0;}
   const rl=p._rainValue||0;if(rl>.45&&!p.rainMode){p.rainMode=R2()<.55?'umb':'run';if(p.rainMode==='umb')giveUmbrella(p);else p.state='walk'}else if(rl<.2&&p.rainMode){p.rainMode=null;dropUmbrella(p)}}}
  if(p.skb&&p.state!=='bskate')pedSkDrop(p);
  if(p.umb&&(p.state==='dead'||p.state==='down'))dropUmbrella(p);if(p.state==='dead'&&!p.wDropDone)try{pedDeathDrop(p)}catch(e){console.error(e)}if(p.state==='dead'&&!p.bled){p.bled=true;bloodHit(p.x,.8,p.z,null);decal(p.x,p.z,1.9+Math.random()*.8,.9,p)}if(p.state==='dead'&&p.timer<=0){removePed(p);continue}
  if(p.state==='cop'){updateCop(p,dt);if(!peds.includes(p))continue}
  else if(p.state==='lie'){if(DN.nightF>.5&&!p.corpse){removePed(p);continue}p.vx=p.vz=0;if(!p.corpse&&CELLS.length&&rainAt(p.x,p.z)>.3&&R2()<dt*1.5){const dI=inland();p.state='leave';p.rot=0;p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;p.timer=14;p.vx=dI[0]*2.6+(R2()-.5);p.vz=dI[1]*2.6+(R2()-.5);p.mx=dI[0];p.mz=dI[1]}}
  else if(p.state==='leave'){p.x+=p.vx*dt;p.z+=p.vz*dt;p.timer-=dt;if(p.timer<3)p.sp.material.opacity=p.sh.material.opacity=Math.max(0,p.timer/3);if(p.timer<=0){removePed(p);continue}}
  else if(p.state==='resWalk'){const path=p.resPath;
   if(!path||!path.length){p.state='walk';p.r=perim(p.ri);p.t=perimNearest(p.r,p.x,p.z)}
   else{const next=path[p.resIdx],dx=next[0]-p.x,dz=next[1]-p.z,d=Math.hypot(dx,dz);
    if(d<.26){if(p.resIdx===path.length-1)p.resDir=-1;else if(p.resIdx===0)p.resDir=1;p.resIdx+=p.resDir;p.resIdx=clamp(p.resIdx,0,path.length-1)}
    else{const v=Math.min(d,p.spd*dt),ux=dx/(d||1),uz=dz/(d||1);p.mx=ux;p.mz=uz;p.vx=ux*p.spd;p.vz=uz*p.spd;p.x+=ux*v;p.z+=uz*v}}
  }
  else if(p.state==='goto'){if(DN.nightF>.5){removePed(p);continue}const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz);if(d<.3){p.state='lie';p.rot=(R2()<.5?1:-1)*Math.PI/2;p.vx=p.vz=0}else{p.vx=dx/d*1.6;p.vz=dz/d*1.6;p.mx=dx/d;p.mz=dz/d;p.x+=p.vx*dt;p.z+=p.vz*dt}}
  else if(p.state==='toDoor'||p.state==='fromDoor'){const w=p.wp[0],dx=w[0]-p.x,dz=w[1]-p.z,d=Math.hypot(dx,dz),v=p.spd*(p.rainMode==='run'?2.4:1);
   if(d<.25){p.wp.shift();if(!p.wp.length){if(p.state==='toDoor'){p.state='inside';p.timer=.7;p.vx=p.vz=0;p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true}else{p.state='walk';p.t=perimNearest(p.r,p.x,p.z)}}}
   else{const st=Math.min(d,v*dt);p.mx=dx/d;p.mz=dz/d;p.vx=p.mx*v;p.vz=p.mz*v;p.x+=p.mx*st;p.z+=p.mz*st}}
  else if(p.state==='bskate'){if(!BEACH.ok){removePed(p);continue}if(pedSkTick(p,dt))continue}
  else if(p.state==='bwalk'){const B=BEACH;if(!B.ok){removePed(p);continue}if(CELLS.length&&rainAt(p.x,p.z)>.4){const dI=inland();p.state='leave';p.timer=14;p.vx=dI[0]*2.6;p.vz=dI[1]*2.6}
   else{if(p.bt<B.t0+4||p.bt>B.t1-4||R2()<dt*.015)p.bdir*=-1;p.bt+=p.bdir*p.spd*dt;p.bu=clamp(p.bu+(R2()-.5)*dt*.5,B.u0,B.u1);const q=B.TU(p.bt,p.bu),q2=B.TU(p.bt+p.bdir,p.bu);
    p.mx=q2[0]-q[0];p.mz=q2[1]-q[1];p.vx=p.mx*p.spd;p.vz=p.mz*p.spd;p.x=q[0];p.z=q[1]}}
  else if(p.state==='fire'){p.vx=p.vz=0;const dx=p.fx-p.x,dz=p.fz-p.z,l=Math.hypot(dx,dz)||1;p.mx=dx/l;p.mz=dz/l}
  else if(p.state==='patio'){p.vx=p.vz=0}
  else if(p.state==='fare'){p.vx=p.vz=0}
  else if(p.state==='mwalk'){try{mallWalkStep(p,dt)}catch(e){p.state='fare';p.vx=p.vz=0}}
  else if(p.state==='clerk'){p.vx=p.vz=0;clerkTick(p,dt)}
  else if(p.state==='duoFollow'){p.vx=p.vz=0;if(p.at){p.x=p.at.x;p.z=p.at.z}} // duoTick atualiza destino; atualiza posicao e quadros de caminhada
  else if(p.state==='board'){}
  else if(p.state==='inside'){p.timer-=dt;p.sp.material.opacity=p.sh.material.opacity=Math.max(0,p.timer/.7);if(p.timer<=0){removePed(p);continue}}
  else if(p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze'){
   if(p.state!=='walk'){p.timer-=dt;if(p.state==='talk'&&p.mate&&peds.includes(p.mate)&&p.mate.state==='talk'){const dx=p.mate.x-p.x,dz=p.mate.z-p.z,l=Math.hypot(dx,dz)||1;p.mx=dx/l;p.mz=dz/l}else if(p.state==='talk'&&p.timer>1.5)p.timer=1.5;
    if(p.timer<=0){if(p.state==='talk'&&p.leaveDir)p.dir=p.leaveDir;p.state='walk';p.mate=null;p._npcChatLeader=false}}
   else{const run=p.rainMode==='run',t0=p.t;p.t+=p.dir*p.spd*dt*(run?2.7:1);if(!run&&R2()<dt*.04){p.state='idle';p.timer=1+R2()*3}if(!run&&R2()<dt*.03)p.dir*=-1;
    if(!p.strip&&p.r&&!p.cop){const ds=city.doors&&city.doors.get(p.ri);
     if(ds&&ds.length){const L=2*((p.r[2]-p.r[0])+(p.r[3]-p.r[1])),a=((t0%L)+L)%L,stp=Math.abs(p.t-t0);
      for(const d of ds){const g=p.dir>0?((d.td-a)%L+L)%L:((a-d.td)%L+L)%L;if(g<=stp&&R2()<(p.rainMode?.5:d.house?.14:.1)){p.state='toDoor';p.wp=[[d.ox,d.oz],[d.x,d.z]];break}}}
     if(p.state==='walk'&&!run&&R2()<dt*.005&&city.info[p.ri]&&city.info[p.ri].kind==='bld'){const pt=pedPointTmp(p);p.state='gaze';p.timer=5+R2()*9;p.mx=-pt[3];p.mz=pt[2]}}}
   if(p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze'){let pt=pedPointTmp(p);if(p.state==='walk'&&pedBlockAt(pt[0],pt[1])&&!pedBlockAt(p.x,p.z)){p.dir*=-1;p.t+=p.dir*.35;pt=pedPointTmp(p)} /* v4 r42: meia-volta antes de banca/metrô/caixa eletrônico */const nx=pt[0],nz=pt[1];if(p.state==='walk'){p.mx=pt[2]*p.dir;p.mz=pt[3]*p.dir}
    p.x=nx;p.z=nz;p.vx=p.mx*p.spd;p.vz=p.mz*p.spd;if(p.state!=='walk'){p.vx=p.vz=0}}
  }else{
   p.timer-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;const f=(p.state==='down'||p.state==='dead')?Math.exp(-dt*3):1;p.vx*=f;p.vz*=f;
   if(p.state==='flee'){const l=Math.hypot(p.vx,p.vz)||1;p.mx=p.vx/l;p.mz=p.vz/l}
   circleVsWorld(p,.35);
   if(p.state==='dead'){if(p.timer<4)p.sp.material.opacity=p.sh.material.opacity=Math.max(0,p.timer/4);}
   else if(p.timer<=0){p.strip=null;p.ri=rectNear(p.x,p.z);p.r=perim(p.ri);p.t=perimNearest(p.r,p.x,p.z);p.state='walk';p.rot=0}
  }
  pedRiverWall(p,dryX,dryZ);
  if(p.state!=='down'&&p.state!=='dead'){
   // Nao consultar colisao com carros para figurantes muito distantes do jogador.
   // Policiais, fugitivos e NPCs em estados especiais continuam completos.
   const _focal=TVM.on?TVM.foc:PL.car||PL,_dx=p.x-_focal.x,_dz=p.z-_focal.z;
   const _ambient=p.state==='walk'||p.state==='idle'||p.state==='talk'||p.state==='gaze'||p.state==='bwalk';
   const _checkCars=!_ambient||p.cop||_dx*_dx+_dz*_dz<105*105;
   if(!_checkCars&&MON.on)PERF.skipFarCollision++;
   const h=_checkCars?circleVsCars(p,.35,false):null;if(h&&h.v>3.2){dropRoadCash(p);p.sp.material.alphaTest=.02;p.sp.material.needsUpdate=true;p.state='dead';p.timer=9;p.vx=h.pvx*.9+h.nx*3;p.vz=h.pvz*.9+h.nz*3;p.rot=(R2()<.5?1:-1)*Math.PI/2;
   ouch(p.x,p.z,p.pitch);if(p.cop&&p.car&&p.car.copsOut)p.car.copsOut=p.car.copsOut.filter(q=>q!==p);if(h.c===PL.car){thud(h.v);registerKill(p,true)}}}
  if(p.patioSpot&&p.state!=='patio')releasePatioGuest(p);
  if(!p.balcony)p.gy+=(groundY(p.x,p.z)-p.gy)*Math.min(1,dt*10);
  if(p.fin!==undefined&&p.fin<1&&p.state!=='dead'){p.fin=Math.min(1,p.fin+dt*1.4);p.sp.material.opacity=p.sh.material.opacity=p.fin;if(p.fin>=1){p.sp.material.alphaTest=.5;p.sp.material.needsUpdate=true}}
  if(p.demo){if(p._lx!==undefined&&Math.hypot(p.x-p._lx,p.z-p._lz)>dt*.3)p._dmT=.2;else p._dmT=Math.max(0,(p._dmT||0)-dt);p._lx=p.x;p._lz=p.z} // v78: demogorgon (floresta/Rampage) anda pelo 'at' de clerk — anima as pernas quando se desloca
  const moving=(p._dmT>0&&p.state!=='dead')||((p.state==='mwalk'&&!p.mwIdle)||p.state==='walk'||p.state==='bwalk'||p.state==='resWalk'||p.state==='flee'||p.state==='leave'||p.state==='goto'||p.state==='toDoor'||p.state==='fromDoor'||p.state==='board'||(p.state==='duoFollow'&&p.duoMoving));const ar=p.state==='flee'||p.rainMode==='run'?11:6;let fr=moving?(Math.floor(p.anim*ar)%4===1?1:Math.floor(p.anim*ar)%4===3?2:0):0;if(p.state==='talk'&&Math.sin(p.anim*(3+p.pitch*2)+p.pitch*9)>.75)fr=1;
  const _dxV=p.x-camera.position.x,_dzV=p.z-camera.position.z;
  const _farVisual=_dxV*_dxV+_dzV*_dzV>110*110&&!p.cop&&p.state!=='flee'&&p.state!=='dead';
  p._frameClock=(p._frameClock||0)-dt;
  if(!_farVisual||p._frameClock<=0){setFrame(p.tex,pickDir(p.mx,p.mz,p.x,p.z),fr);p._frameClock=_farVisual?.125:0;}
  if(p.clubType){if(p.clubType==='stage')p.gy=.8;clubPedJumpTick(p,dt)}
  if(p.labTank){p.x=LAB.tankAt.x;p.z=LAB.tankAt.z;p.vx=p.vz=0;p.state='fare';p.gy=.45+Math.sin(simT*.7)*.09}
  placeSprite(p);if(p.labTank&&p.sh)p.sh.visible=false;if(p.umb){if(camMode==='top'&&!VIEW.orbit)p.umb.position.set(p.x,p.gy+1.6,p.z-2.35);else p.umb.position.set(p.x,p.gy+2.15,p.z)}
 }
}
function placeSprite(o){
 if(o.state==='patio'&&o.patioSpot){
  const sp=o.patioSpot,lying=sp.kind==='recline';
  o.sp.center.set(.5,lying?.5:0);o.sp.scale.set((lying?1.75:1.38)*16/24,lying?1.75:1.38,1);
  o.sp.position.set(sp.x,o.gy+(lying?.86:.22),sp.z);
  // Match the lounger axis in screen space, including orbit and overhead views.
  if(lying){const a=new THREE.Vector3(sp.x,o.gy+.86,sp.z).project(camera),b=new THREE.Vector3(sp.x+Math.sin(sp.angle),o.gy+.86,sp.z+Math.cos(sp.angle)).project(camera);
   o.sp.material.rotation=Math.atan2((b.y-a.y)*innerHeight,(b.x-a.x)*innerWidth)+Math.PI/2;
  }else o.sp.material.rotation=0;
  o.sh.visible=false;return;
 }
 const top=camMode==='top'&&!VIEW.orbit;const hgt=top?2.9:1.9,jy=o.jy||0;o.sp.scale.set(hgt*16/24,hgt,1);o.sp.material.rotation=o.rot||0;
 o.sp.position.set(o.x,o.gy+jy+(top?.9:0)+(o.rot&&Math.abs(o.rot)>1&&!top?.3:0),o.z);
 if(o.balcony){o.sh.visible=false;return}
 /* v78: sombra redonda só até ~38 m da câmera (longe ela some na tela e custava 1 draw por ped) */if(o!==PL&&!PL.inside){const c=camera.position,dx=o.x-c.x,dz=o.z-c.z;if(dx*dx+dz*dz>38*38){o.sh.visible=false;return}}
 o.sh.visible=true;o.sh.position.set(o.x,o.gy+(PL.inside?.075:.045),o.z);const ss=1/(1+jy*.35);o.sh.scale.set(ss,ss,ss)}


/* v4 r42 · obstáculos de calçada que o pedestre não atravessa (banca de jornal, entrada do metrô, caixa eletrônico): ao chegar perto dá meia-volta.
   Lista montada uma vez por cidade (PEDOBS.city), caixas com folga de 0,3 m. */
const PEDOBS={city:null,b:[]};
function pedObsBuild(){PEDOBS.city=city;const B=PEDOBS.b;B.length=0;const add=(x0,z0,x1,z1)=>{B.push(Math.min(x0,x1)-.3,Math.min(z0,z1)-.3,Math.max(x0,x1)+.3,Math.max(z0,z1)+.3)};
 if(city&&city.chunks)for(const ch of city.chunks.values())for(const k of ch.kiosks||[])if(k.box)add(k.box[0],k.box[1],k.box[2],k.box[3]);
 if(typeof METRO!=='undefined')for(const s of METRO.list||[])if(s.box)add(s.box[0],s.box[1],s.box[2],s.box[3]);
 if(typeof ATMQ!=='undefined')for(const a of ATMQ.list||[])add(a.x-a.hw,a.z-a.hd,a.x+a.hw,a.z+a.hd)}
function pedBlockAt(x,z){if(PEDOBS.city!==city||PEDOBS.n!==((typeof METRO!=='undefined'?METRO.list.length:0)+(typeof ATMQ!=='undefined'?ATMQ.list.length:0))){pedObsBuild();PEDOBS.n=(typeof METRO!=='undefined'?METRO.list.length:0)+(typeof ATMQ!=='undefined'?ATMQ.list.length:0)}
 const B=PEDOBS.b;for(let i=0;i<B.length;i+=4)if(x>B[i]&&x<B[i+2]&&z>B[i+1]&&z<B[i+3])return true;return false}
/* v4 r58 · NEON EMBAIXO DO CARRO (underglow). De vez em quando um carro do trânsito comum da cidade (fora da roça) nasce com neon
   de cor aleatória: ~3% de dia, ~13% à noite (sorteado ao nascer, makeRailCar). Só Sunset Shores e Synthwave.
   Desenho: brilho no asfalto (glowTex, aditivo) + barra de neon sob a carroceria, ambos InstancedMesh globais com cor por instância
   (1 material cada, sempre na cena com instâncias zeradas → compilam no loading). Até UG.N carros mais perto da câmera (≤ 170 m).
   Fica fora do city.group de propósito (vale em qualquer cidade); carro sem c.ug não aparece. */
const UG={N:24,cols:['#ff2ad4','#2af0ff','#7a3cff','#39ff6a','#ff3a3a','#ffd23a','#2a6aff','#ff7a1a'].map(h=>new THREE.Color(h)),
 types:new Set(['sedan','sports','hatch','conv','suv','pickup','taxi']),m:new THREE.Matrix4(),q:new THREE.Quaternion(),e:new THREE.Euler(),v:new THREE.Vector3(),s:new THREE.Vector3(),c:new THREE.Color(),list:[]};
{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);
 UG.glowMat=new THREE.MeshBasicMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 UG.glow=new THREE.InstancedMesh(g,UG.glowMat,UG.N);UG.barMat=new THREE.MeshBasicMaterial({});UG.bar=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),UG.barMat,UG.N);
 for(const im of [UG.glow,UG.bar]){im.frustumCulled=false;im.renderOrder=2;for(let i=0;i<UG.N;i++){im.setMatrixAt(i,ZM);im.setColorAt(i,UG.cols[i%UG.cols.length])}im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(im)}
 UG.glow.userData.cached=UG.bar.userData.cached=true}
function ugRoll(c,type,x,z){if(city.haze||(S.style!=='modern'&&S.style!=='synthwave')||!UG.types.has(type)||isRural(x,z))return;
 const n=S.style==='synthwave'?1:(DN.nightF||0);if(Math.random()<.03+.10*n)c.ug=UG.cols[Math.floor(Math.random()*UG.cols.length)]}
makeRailCar=(f=>function(kx,kz,d,li,s,forceType){const c=f.apply(this,arguments);try{if(c&&!forceType)ugRoll(c,c.type,c.x,c.z)}catch(e){}return c})(makeRailCar);
function ugTick(){const L=UG.list;L.length=0;const cx=camera.position.x,cz=camera.position.z;
 if(!PL.inside)for(const c of vehicles){if(!c.ug||!c.alive||c.exploded)continue;const d=Math.abs(c.x-cx)+Math.abs(c.z-cz);if(d<240){c._ugd=d;L.push(c)}}
 if(L.length>UG.N)L.sort((a,b)=>a._ugd-b._ugd);const n=Math.min(L.length,UG.N),k=S.style==='synthwave'?1.6:.6+1.0*(DN.nightF||0);
 for(let i=0;i<UG.N;i++){if(i>=n){UG.glow.setMatrixAt(i,ZM);UG.bar.setMatrixAt(i,ZM);continue}const c=L[i],t=c.t,y=(c.gy||0)+(c.rampY||0)+(c.airY||0);
  UG.e.set(0,-c.a,0);UG.q.setFromEuler(UG.e);
  UG.v.set(c.x,y+.045,c.z);UG.s.set(t.L*1.7,1,t.W*2.6);UG.m.compose(UG.v,UG.q,UG.s);UG.glow.setMatrixAt(i,UG.m);UG.c.copy(c.ug).multiplyScalar(k);UG.glow.setColorAt(i,UG.c);
  UG.v.set(c.x,y+.2,c.z);UG.s.set(t.L*.78,.05,t.W*.86);UG.m.compose(UG.v,UG.q,UG.s);UG.bar.setMatrixAt(i,UG.m);UG.bar.setColorAt(i,c.ug)}
 UG.glow.instanceMatrix.needsUpdate=UG.bar.instanceMatrix.needsUpdate=true;UG.glow.instanceColor.needsUpdate=UG.bar.instanceColor.needsUpdate=true}
myTick=(f=>function(dt){f.apply(this,arguments);try{ugTick()}catch(e){if(!UG.err){UG.err=1;console.error(e)}}})(myTick);
