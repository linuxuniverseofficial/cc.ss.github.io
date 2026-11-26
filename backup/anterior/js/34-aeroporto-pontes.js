'use strict';
/* Coastal Chaos · js/34-aeroporto-pontes.js — Aeroporto, navios, pontes levadiças, vortex, banca, eventos do mapa.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
// ---------- AEROPORTO: só cenário ----------
// Um avião estacionado no pátio e outro em ciclo: decola (corrida na pista, sobe e some), espera, pousa (vem de longe, toca e freia), espera.
const AIRY=1.415,AIRP={key:'',parked:null,p:null,snd:null,st:'wait',t:6,s:0,l:0,y:0,th:0,v:0,vy:0,roll:0,pitch:0,next:'to',wp:null};
// Mesmo loop de turbina dos avioes de passagem, agora no aviao fisico do aeroporto.
// O ganho segue a posicao da CAMERA na cinematografia e a do jogador na gameplay.
function airSoundReset(){
 if(!AIRP.snd)return;
 try{AIRP.snd.src.stop();AIRP.snd.g.disconnect()}catch(e){}
 AIRP.snd=null;
}
function airSoundTick(){
 const P=AIRP;if(!AC||!AC._noise||!P.p||!played)return;
 if(!P.snd)P.snd=skySound(false);
 if(!P.snd)return;
 const intro=STORYINTRO.active,cinema=intro&&STORYINTRO.stage==='arrival';
 const audible=!menuOpen&&!cmdsOpen&&!cfgOpen&&!STORYEND.active&&(!intro||cinema)&&S.sound&&P.st!=='wait'&&P.p.g.visible;
 const listener=cinema?camera.position:(PL.car||PL),q=P.p.g.position;
 const dist=Math.hypot(q.x-listener.x,q.y-(cinema?listener.y:2),q.z-listener.z);
 const atten=Math.pow(clamp(1-dist/(cinema?450:700),0,1),2);
 const ground=['taxiOut','taxiIn','hold','rollout'].includes(P.st);
 const power=ground?.5:.95,spd=clamp(P.v/40,0,1);
 const volume=audible?(cinema?.46:.32)*atten*power*(.7+.3*spd):0;
 P.snd.g.gain.setTargetAtTime(volume,AC.currentTime,.14);
 P.snd.src.playbackRate.setTargetAtTime(.78+spd*.43,AC.currentTime,.25);
}

function airPt(s0,l0){const A=city.air;return A.ax?[A.cx+s0,A.cz+l0]:[A.cx+l0,A.cz+s0]}
// v110: aeroporto suave. Tudo é calculado no referencial da pista (s = ao longo, l = lateral, th = rumo nesse plano),
// com velocidade, razão de subida, rolagem e arfagem filtradas e curvas de raio limitado (nada de mudança de estado "seca").
function airWrap(a){return Math.atan2(Math.sin(a),Math.cos(a))}
// v206: aproximacao em patamares suaves. O aviao nao precisa ficar a 100+ m
// de altura ate a reta: desce ja na curva, acompanha as coberturas e libera
// uma nova descida assim que a cauda passou o ultimo obstaculo.
// Calculo de envelope da cidade ocorre UMA VEZ, sem raycasts no render loop.
function airLandingPlan(A){
 const head=-A.L/2,rl=A.rl,ax=A.ax,obstacles=[],roofs=[];
 // Jato a 50% de escala: raio envolvente inclui asas, nariz, cauda e inclinacao.
 const halfWing=9.5,halfLength=15.5;
 const add=(r,y,kind)=>{
  if(!r||!Number.isFinite(y)||y<1)return;
  const s0=(ax?r.x0:r.z0)-(ax?A.cx:A.cz),s1=(ax?r.x1:r.z1)-(ax?A.cx:A.cz);
  const l0=(ax?r.z0:r.x0)-(ax?A.cz:A.cx),l1=(ax?r.z1:r.x1)-(ax?A.cz:A.cx);
  const box={s0,s1,l0,l1,roof:y,kind};
  // Guarda os candidatos proximos do aeroporto para proteger tambem o semi-C.
  if(s1>head-850&&s0<head+1050&&l1>rl-600&&l0<rl+600)roofs.push(box);
  if(l1<rl-halfWing||l0>rl+halfWing||s0>head+2||s1<head-310)return;
  obstacles.push({...box,last:s1+halfLength});
 };
 for(const b of city.buildingFootprints||[])if(b.ri!==A.ri)add(b,b.y||39,'predio');
 for(const h of city.airHouses||[])if(h.ri!==A.ri)add(h,h.y||8,'casa');
 for(const q of city.ring||[])add({x0:q[0],z0:q[1],x1:q[2],z1:q[3]},Math.min(43,(q[5]||28)+3),'anel');
 for(const ch of city.chunks?.values()||[])for(const tr of ch.trees||[]){
  if(tr.broken)continue;
  const r=tr.night?2.6:2.2,top=tr.crown+(tr.night?1.0:1.2)*tr.s;
  add({x0:tr.x-r,z0:tr.z-r,x1:tr.x+r,z1:tr.z+r},top,'arvore');
 }
 if(!(city.buildingFootprints||[]).length&&!(city.airHouses||[]).length)
  for(let i=0;i<(city.rects||[]).length;i++){
   if(i===A.ri)continue;const kind=city.info?.[i]?.kind;
   if(kind==='bld'||kind==='houses'){
    const r=city.rects[i];add({x0:r[0]+3,z0:r[1]+3,x1:r[2]-3,z1:r[3]-3},kind==='bld'?40:9,'reserva');
   }
  }
 // v211: a altura do pouso e determinada por cada obstaculo do corredor,
 // e NAO mais pelo predio mais alto encontrado em qualquer lado da curva.
 // Folga reduzida de 9,5 para 5 m, pois a margem lateral ja cobre as asas.
 const sT=head-460,R=40/.17,clearance=4.2;
 // Zoneamento garante a superficie; nao deslocar a aterrissagem para desviar
 // de predios e nem fabricar quedas bruscas nos ultimos metros.
 const touch=head+10;
 const sorted=obstacles.map(o=>({...o,d:touch-o.last,need:o.roof+clearance})).filter(o=>o.d>0)
  .sort((a,b)=>a.d-b.d);
 const stages=[];let prev=0;
 for(const o of sorted){
  // A transicao alonga a descida sobre casas e evita o mergulho sobre a pista.
  const safeH=Math.min(o.need,o.d*.18/1.14);
  if(safeH>prev+.15){stages.push({d:o.d,h:safeH,kind:o.kind});prev=safeH}
 }
 const cruise=15,basePlan={touch,stages:[],cruise,obstacles,clearance};
 // Perfis LOCAIS para ambos os sentidos da perna paralela + meia-volta.
 // Calculados uma vez ao gerar a cidade, sem procurar predios no render loop.
 const approach={};
 const sStart=A.L/2+420,downLen=sStart-sT,turnLen=Math.PI*R,step=14;
 const floorAt=(s,l)=>{let floor=0;for(const o of roofs){
  const ds=Math.max(o.s0-s,0,s-o.s1),dl=Math.max(o.l0-l,0,l-o.l1);
  if(ds*ds+dl*dl<18*18)floor=Math.max(floor,o.roof+4.2);
 }return floor};
 for(const side of [-1,1]){
  const count=Math.ceil((downLen+turnLen)/step),req=[];
  for(let i=0;i<=count;i++){
   const dist=Math.min(downLen+turnLen,i*(downLen+turnLen)/count);
   let s,l;
   if(dist<=downLen){s=sStart-dist;l=rl+side*2*R}
   else{const a=(dist-downLen)/R;s=sT-R*Math.sin(a);l=rl+side*R*(1+Math.cos(a))}
   const remaining=downLen+turnLen-dist;
   req[i]=Math.max(16,floorAt(s,l),airLandingHeight(touch-sT,basePlan)+Math.min(11,remaining*.013));
  }
  // A altura no fim da curva precisa bater com a reta final sem salto.
  req[count]=Math.max(req[count],airLandingHeight(touch-sT,basePlan));
  const need=Array(count+1);need[count]=req[count];
  for(let i=count-1;i>=0;i--)need[i]=Math.max(req[i],need[i+1]);
  const heights=[need[0]],ds=(downLen+turnLen)/count;
  for(let i=1;i<=count;i++)heights.push(Math.max(need[i],heights[i-1]-.06*ds));
  approach[side]={heights,length:downLen+turnLen,downLen,sStart,sT,R};
 }
 return {...basePlan,approach};
}
function airPreferredLandingSide(plan,fallback){
 const a=plan?.approach?.[-1]?.heights,b=plan?.approach?.[1]?.heights;
 if(!a||!b)return fallback;
 // Penaliza mais um trecho longo com altitude alta que um pico breve.
 const score=h=>h.reduce((sum,v)=>sum+v,0)/h.length+Math.max(...h)*.18;
 const sa=score(a),sb=score(b);
 return Math.abs(sa-sb)>1.5?(sa<sb?-1:1):fallback;
}
function airLandingHeight(d,plan){
 if(d<=0)return 0;
 // v217: o toque volta a acontecer mais cedo. A rampa continua suave,
 // mas termina antes para evitar que o aviao va pousar muito adiante.
 const flare=Math.min(1,d/14),soft=flare*flare*(3-2*flare);
 return (d*.108+7.2*(1-Math.exp(-d/50)))*soft;
}
function airApproachHeight(P,plan,phase){
 const p=plan?.approach?.[P.side];
 if(!p)return airLandingHeight(Math.max(0,(plan?.touch||0)-P.s),plan);
 const progress=phase==='down'?p.sStart-P.s:p.downLen+p.R*(P.turned||0);
 const u=Math.max(0,Math.min(p.heights.length-1,progress/p.length*(p.heights.length-1)));
 const i=Math.floor(u),t=u-i,h=p.heights,n=h.length-1;
 const slope=j=>{if(j<=0||j>=n)return 0;const a=h[j]-h[j-1],b=h[j+1]-h[j];return a*b<=0?0:2*a*b/(a+b)};
 const y0=h[i],y1=h[Math.min(i+1,n)],m0=slope(i),m1=slope(Math.min(i+1,n));
 return AIRY+(2*t*t*t-3*t*t+1)*y0+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*y1+(t*t*t-t*t)*m1;
}
function airLandingProfile(s,sTD,plan){
 const d=Math.max(0,sTD-s),h=airLandingHeight(d,plan);
 // Diferenca centrada da mesma curva que define a altitude; nenhuma
 // mudanca brusca de derivada ao cruzar a proxima etapa do pouso.
 const e=.18,lo=Math.max(0,d-e);
 const slope=(airLandingHeight(d+e,plan)-airLandingHeight(lo,plan))/(d+e-lo);
 return {y:AIRY+h,slope};
}
// v208: calcula uma unica vez se a SUBIDA precisa passar por um edificio
// mais alto logo apos o quarteirao residencial, sem tornar todas as decolagens
// artificialmente ingremes. Mantem o eixo da pista e a fisica de antes.
function airTakeoffRate(A){
 if(city.airZoning)return 9; // a faixa urbana nao exige mais subida de emergencia
 const tail=A.L/2,along=(r)=>A.ax?[r.x0-A.cx,r.x1-A.cx,r.z0-A.cz,r.z1-A.cz]:[r.z0-A.cz,r.z1-A.cz,r.x0-A.cx,r.x1-A.cx];
 const near=r=>{const [s0,s1,l0,l1]=along(r);return s1>tail+25&&s0<tail+200&&l1>A.rl-11&&l0<A.rl+11};
 if((city.buildingFootprints||[]).some(b=>b.ri!==A.ri&&near(b)))return 16;
 if((city.ring||[]).some(q=>near({x0:q[0],z0:q[1],x1:q[2],z1:q[3]})))return 16;
 if((city.lms||[]).some(l=>l.ri!==A.ri&&['sky','hall','hosp','univ','mall','mkt','pol','stad'].includes(l.name)&&city.rects?.[l.ri]&&near({x0:city.rects[l.ri][0],z0:city.rects[l.ri][1],x1:city.rects[l.ri][2],z1:city.rects[l.ri][3]})))return 16;
 return 9;
}
function airLandingTouch(L){return AIRP.landing?.touch??(-L/2+22)}
function airSteer(P,tx,tl,vmax,stop,dt,rMin){const ds=tx-P.s,dl=tl-P.l,d=Math.hypot(ds,dl),err=airWrap(Math.atan2(dl,ds)-P.th);
 let vt=vmax*Math.max(.35,1-Math.abs(err)/1.6);if(stop)vt=Math.min(vt,Math.sqrt(2*1.6*Math.max(0,d-.3)));
 P.v+=clamp(vt-P.v,-3*dt,2.2*dt);const wMax=Math.max(.25,P.v/rMin);P.th+=clamp(err*1.6,-wMax,wMax)*dt;P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;return d}
// v219: duas superfícies simples; a abertura acompanha a parte final da pista.
// A mesma fração controla os freios, sem física extra ou geometria dinâmica.
function airSpoilerMove(P,dt,wanted){
 const prev=P.spoilerLift||0,rate=wanted>prev?.65:.34;
 P.spoilerLift=clamp(prev+clamp(wanted-prev,-rate*dt,rate*dt),0,1);
 if(P.p?.spoilers)for(const hinge of P.p.spoilers)hinge.rotation.z=-1.06*P.spoilerLift;
 return P.spoilerLift;
}
function airRolloutStep(P,L,dt){
 const stopS=L/2-26,slow=6.2;
 const startS=P.rollStartS??(P.rollStartS=P.s);
 const usable=Math.max(1,stopS-startS),pos=clamp((P.s-startS)/usable,0,1);
 // Nos aeroportos curtos, abre um pouco antes para ainda caber a frenagem.
 const openAt=usable<110?.35:.61;
 const u=clamp((pos-openAt)/(.88-openAt),0,1),wanted=u*u*(3-2*u);
 const lift=airSpoilerMove(P,dt,wanted);
 // Antes da abertura ele apenas perde velocidade; com painéis erguidos, freia mais.
 const aeroBrake=1.35+16*lift*lift*lift;
 // Guarda de segurança para o fim da pista (inclui flutuações de FPS).
 const remaining=Math.max(1,stopS-P.s-3);
 const needed=Math.max(0,(P.v*P.v-slow*slow)/(2*remaining));
 const braking=Math.max(aeroBrake,Math.min(35,needed*.95));
 P.v=Math.max(lift<.15?19.5:slow,P.v-braking*dt);
 P.s+=P.v*dt;
 return P.v<=slow+.01;
}
function airTick2(dt){const A=city.air;if(!played||!A||S.style==='inverted'||city.haze){airSoundReset();return}const k=S.seed+':'+S.style+':'+city.worldNo;
 if(AIRP.key!==k){airSoundReset();AIRP.key=k;for(const o of [AIRP.parked,AIRP.p])if(o){scene.remove(o.g);disposeGroup(o.g)}AIRP.parked=null;AIRP.p=skyPlane(true);AIRP.p.g.scale.setScalar(.5);scene.add(AIRP.p.g);const hp=airPt(A.L/2-(A.compact?10:12),-A.Wd/2+(A.compact?13:19)); /* v78: heliponto saiu do estacionamento (lado da rua) pro pátio */if(!HELI.list.some(h=>h.id==='airport'))heliAddPad(hp[0],hp[1],A.ax?0:Math.PI/2,'airport');airpJetsInit(A);AIRP.dead=null;AIRP.hp=null;AIRP.landing=airLandingPlan(A);AIRP.takeoffRate=airTakeoffRate(A);AIRP.st='wait';AIRP.t=4;AIRP.next='to';AIRP.spoilerLift=0;AIRP.rollStartS=null}
 const pc=PL.car||PL,near=STORYINTRO.active||(TVM.on&&TVM.kind==='airport')||Math.hypot(pc.x-A.cx,pc.z-A.cz)<700;const P=AIRP,G=P.p,L=A.L;
 airpJetsTick(A,near,dt);if(airpDeadTick(P,G,A,dt,near))return; /* v4 r45: avião destruído */
 if(A.compact){ // Pista compacta: avião faz aproximações aéreas sem taxiamento fora do lote.
  if(P.st!=='flyby'&&P.st!=='wait'){P.st='wait';P.t=2}
  if(P.st==='wait'){G.g.visible=false;P.t-=dt;if(P.t<=0){P.st='flyby';P.s=-L/2-150;P.l=A.rl;P.y=52;P.th=0}}
  else{P.s+=dt*34;const q=airPt(P.s,P.l);P.y=52+6*Math.sin((P.s+150)*.004);G.g.position.set(q[0],P.y,q[1]);G.g.rotation.set(0,A.ax?0:-Math.PI/2,0);G.g.visible=near;
   if(P.s>L/2+165){P.st='wait';P.t=22}}
  return}

 const hs=-L/2+18,hIn=-A.Wd/2+8,hDoor=A.hd+3,rl=A.rl,sgnH=Math.sign(hDoor-rl)||1,sTD=airLandingTouch(L),W0=.17,th0=P.th;
 P.t-=dt;let ground=true,vyT=0;
 if(P.st==='wait'){G.g.visible=false;if(P.t<=0){
   if(P.next==='to'){P.st='taxiOut';P.wpT=0;P.s=hs;P.l=hIn;P.th=Math.atan2(hDoor-hIn,0);P.v=0;P.y=AIRY;P.vy=0;P.roll=0;P.pitch=0;
    P.wp=[[hs,hDoor,6],[hs,rl+sgnH*9,6],[hs+7,rl+sgnH*2,5],[hs+16,rl,4,1]]}
   else{// chegada: perna do vento paralela à pista, semi-C (curva de 180°) até alinhar na final
    P.side=airPreferredLandingSide(AIRP.landing,Math.random()<.5?-1:1);P.vA=40;P.R=P.vA/W0;P.st='down';P.s=L/2+420;P.l=rl+P.side*2*P.R;P.th=Math.PI;P.v=P.vA;P.y=airApproachHeight(P,AIRP.landing,'down')+2;P.vy=0;P.roll=0;P.pitch=0;P.sT=-L/2-460}}
  airSpoilerMove(P,dt,0);return}
 if(P.st==='taxiOut'||P.st==='taxiIn'){const q=P.wp[0],last=P.wp.length===1,d=airSteer(P,q[0],q[1],q[2],last&&q[3],dt,q[4]||6.5);P.wpT=(P.wpT||0)+dt;
  // v78: raio/tolerância por ponto (retorno apertado na pista) e trava anti-círculo: 14 s no mesmo ponto → segue pro próximo
  if(last?d<.6&&P.v<.4:(d<(q[5]||4.5)||P.wpT>14)){P.wp.shift();P.wpT=0;if(!P.wp.length){if(P.st==='taxiOut'){P.st='hold';P.t=10;P.v=0}else{P.st='wait';P.t=14;P.next='to'}}}}
 else if(P.st==='hold'){P.th+=airWrap(0-P.th)*Math.min(1,dt*2);P.l+=(rl-P.l)*Math.min(1,dt*2);if(P.t<=0){P.st='roll';P.v=0}}
 else if(P.st==='roll'){P.v+=9*dt;P.th+=airWrap(0-P.th)*Math.min(1,dt*3);P.l+=(rl-P.l)*Math.min(1,dt*2);P.s+=P.v*dt;
  if(P.v>26){vyT=Math.min(9,(P.v-26)*1.1);ground=P.y<AIRY+.3&&vyT<.5}if(P.y>AIRY+3){P.st='climb'}}
 else if(P.st==='climb'){ground=false;P.v=Math.min(70,P.v+5*dt);P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;vyT=P.y<110?(P.s<A.L/2+180?(P.takeoffRate??(P.takeoffRate=airTakeoffRate(A))):9):0;
  if(P.s>L/2+120&&P.y>35){P.st='turnOut';P.side=Math.random()<.5?-1:1;P.turned=0}}
 else if(P.st==='turnOut'){ground=false;const w=P.side*W0;P.th+=w*dt;P.turned+=W0*dt;P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;vyT=P.y<120?6:0;if(P.turned>=Math.PI){P.st='out';P.outT=0}}
 else if(P.st==='out'){ground=false;P.v=Math.min(75,P.v+4*dt);P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;vyT=P.y<140?4:0;P.outT=(P.outT||0)+dt;const c=airPt(P.s,P.l),E=city.ext||1000;
  if(P.outT>8&&(c[0]<-350||c[1]<-350||c[0]>E+350||c[1]>E+350||Math.hypot(c[0]-pc.x,c[1]-pc.z)>1400)){P.st='wait';P.t=12;P.next='land'}}
 else if(P.st==='down'){ground=false;P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;const yB=airApproachHeight(P,AIRP.landing,'down');vyT=clamp((yB-P.y)*.42,-4.6,1.6);if(P.s<=P.sT)P.st='base',P.turned=0}
 else if(P.st==='base'){ground=false;const w=P.side*W0;P.th+=w*dt;P.turned+=W0*dt;P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;const yG=airApproachHeight(P,AIRP.landing,'base');vyT=clamp((yG-P.y)*.42,-4.6,1.6);
  if(P.turned>=Math.PI){P.st='final';P.th=airWrap(P.th)}}
 else if(P.st==='final'){ground=false;P.th+=airWrap(0-P.th)*Math.min(1,dt*.8);P.l+=(rl-P.l)*Math.min(1,dt*.5);P.v+=clamp(26.5-P.v,-3.1*dt,2.2*dt);P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt;
  const glide=airLandingProfile(P.s,sTD,AIRP.landing);
  // airLandingProfile já inclui AIRY, a altura do avião com as rodas na pista.
  vyT=clamp((glide.y-P.y)*.95-P.v*glide.slope,-5.4,1.6);
  if(P.y<=AIRY+.10&&P.s>sTD-22){P.st='rollout';P.y=AIRY;P.vy=0;P.rollStartS=P.s;P.spoilerLift=0}}
 else if(P.st==='rollout'){
  // Rolagem inicial livre; da metade para o fim os 2 retangulos sobem
  // gradualmente, com a desaceleracao crescendo na mesma proporcao.
  const finished=airRolloutStep(P,L,dt);
  P.th+=airWrap(0-P.th)*Math.min(1,dt*2.2);
  P.l+=(rl-P.l)*Math.min(1,dt*2.2);
  if(finished){P.st='taxiIn';P.wpT=0;const s0=Math.min(P.s,L/2-24);
   // v78: retorno em U de raio curto logo após a rolagem (lado oposto ao terminal) e volta pela pista direto pro hangar
   P.wp=[[s0+7,rl-sgnH*3.5,4,0,4,2.5],[s0+12,rl-sgnH*2.5,3,0,3.2,2],[s0+13,rl+sgnH*.5,3,0,3.2,2],[s0+10,rl+sgnH*3,3,0,3.2,2.5],[s0+2,rl+sgnH*3,6],[hs+12,rl+sgnH*3,7],[hs,rl+sgnH*10,5],[hs,hDoor,4],[hs,hIn,3,1]]}
 }
 // vertical, arfagem e rolagem suaves
 if(P.st!=='taxiOut'&&P.st!=='taxiIn'&&P.st!=='hold'&&P.st!=='rollout'){P.vy+=clamp(vyT-P.vy,-(P.st==='final'?10:6)*dt,(P.st==='final'?10:6)*dt);P.y=Math.max(AIRY,P.y+P.vy*dt)}else{P.y+=(AIRY-P.y)*Math.min(1,dt*4);P.vy=0}
 // Durante o taxi, os dois paineis recolhem lentamente (~3 s).
 if(P.st!=='rollout')airSpoilerMove(P,dt,0);
 const w=airWrap(P.th-th0)/Math.max(dt,1e-4),wWorld=A.ax?w:-w,rollT=ground?0:clamp(Math.atan(P.v*wWorld/9.8),-.6,.6),pitchT=ground?(P.st==='roll'&&P.v>26?.05:0):clamp(Math.atan2(P.vy,Math.max(10,P.v))+.03,P.st==='final'?-.38:-.12,.28);
 P.roll+=(rollT-P.roll)*Math.min(1,dt*1.8);P.pitch+=(pitchT-P.pitch)*Math.min(1,dt*1.5);
 const c=airPt(P.s,P.l),hw=A.ax?P.th:Math.PI/2-P.th;G.g.visible=near||P.y>8;G.g.position.set(c[0],P.y,c[1]);G.g.rotation.order='YZX';G.g.rotation.set(P.roll,-hw,P.pitch);
 if(G.bl)G.bl.visible=Math.floor(simT*2)%2===0}
// ---------- NAVIOS CARGUEIROS ----------
// Dois navios em "pistas" invisíveis paralelas à praia (150 m e 200 m da areia), em sentidos opostos; no fim do mapa
// param, giram e voltam. Containers com cores/pilhas aleatórias (mesma paleta da indústria). Uma malha por navio.
// Lancha/jet ski batem no casco; dá para pousar o helicóptero no convés e andar nele (você vai junto com o navio).
const SHIP_L=84,SHIP_W=14,SHIP_DECK=3.65,SHIPS={key:'',list:[]};
function shipFrame(sh){const cs=city.coast,c=wTU(cs,sh.t,sh.u),tx=cs<2?1:0,tz=cs<2?0:1;return{cx:c[0],cz:c[1],hx:tx*Math.cos(sh.yaw)-tz*Math.sin(sh.yaw),hz:tz*Math.cos(sh.yaw)+tx*Math.sin(sh.yaw)}}
function shipLocal(sh,x,z){const f=sh.f||shipFrame(sh),dx=x-f.cx,dz=z-f.cz;return[dx*f.hx+dz*f.hz,-dx*f.hz+dz*f.hx]}
function shipAt(x,z,pad){pad=pad||0;for(const sh of SHIPS.list){if(!sh.f)continue;const f=sh.f,dx=x-f.cx,dz=z-f.cz,lx=dx*f.hx+dz*f.hz,lz=-dx*f.hz+dz*f.hx;if(Math.abs(lx)<SHIP_L/2+pad&&Math.abs(lz)<SHIP_W/2+pad)return sh}return null}
// Colisao dos conteineres usa as mesmas caixas e alturas geradas no mesh procedural.
function shipContainerAt(sh,x,z,pad=0){if(!sh||!sh.containers)return null;const[lx,lz]=shipLocal(sh,x,z);for(const c of sh.containers)if(lx>c.x0-pad&&lx<c.x1+pad&&lz>c.z0-pad&&lz<c.z1+pad)return c;return null}
function shipSupportY(x,z,feetY){const sh=shipAt(x,z);if(!sh)return groundY(x,z);const c=shipContainerAt(sh,x,z);const deck=SEA_Y+SHIP_DECK,top=c?SEA_Y+c.top:deck;return c&&feetY>=top-.48?top:deck}
function shipPlayerVsContainers(o,r){if(!SHIPS.list.length||o.inside||o.heli||o.car)return;const sh=shipAt(o.x,o.z);if(!sh||!sh.containers)return;const f=sh.f;let[lx,lz]=shipLocal(sh,o.x,o.z),changed=false;
 for(const c of sh.containers){const top=SEA_Y+c.top;if(o.gy+(o.jy||0)>=top-.48)continue;const x0=c.x0-r,x1=c.x1+r,z0=c.z0-r,z1=c.z1+r;if(lx<=x0||lx>=x1||lz<=z0||lz>=z1)continue;
  const d=[lx-x0,x1-lx,lz-z0,z1-lz],v=Math.min(...d);if(v===d[0])lx=x0;else if(v===d[1])lx=x1;else if(v===d[2])lz=z0;else lz=z1;changed=true}
 if(changed){o.x=f.cx+lx*f.hx-lz*f.hz;o.z=f.cz+lx*f.hz+lz*f.hx;o.vx*=.12;o.vz*=.12}}

function shipBuild(R){const mb=new MB(),containers=[],C=h=>COL(h),hull=C(['#2a2a30','#7a1a1a','#1a3a6a','#2a4a2a'][Math.floor(R()*4)]),trim=C('#a82020'),deckC=C('#5f6d5d'),cabinC=C('#f2f0e8'),glassC=C('#22303a'),accent=C(['#d8a020','#c8402a','#2a6aa8'][Math.floor(R()*3)]),L=SHIP_L/2,W=SHIP_W/2;
 // Casco retrabalhado: menos bloco reto e mais leitura de proa/casco de lancha grande.
 mb.box(-L+4.6,-3.2,-W*.72,L-18,-2.25,W*.72,hull);mb.box(-L+2.6,-2.95,-W*.84,L-13,-1.15,W*.84,hull);mb.box(-L+1.2,-2.48,-W*.94,L-9.2,SHIP_DECK,W*.94,hull);
 mb.box(-L,-1.95,-W*.84,-L+7.4,SHIP_DECK,W*.84,hull);mb.box(-L+1.7,-1.18,-W*.66,-L+10.8,SHIP_DECK,W*.66,hull); // popa arredondada
 mb.box(L-18,-2.8,-W*.88,L-9.6,SHIP_DECK,W*.88,hull);mb.box(L-12,-1.95,-W*.68,L-4.8,SHIP_DECK,W*.68,hull);mb.box(L-6.2,-1.18,-W*.48,L-1.1,SHIP_DECK,W*.48,hull);mb.box(L-2.1,-.55,-W*.26,L,.55,W*.26,hull); // proa afunilada
 mb.box(-L-.08,-3.06,-W*.95,L-.85,-2.16,W*.95,trim);
 mb.box(-L+5.2,SHIP_DECK-.05,-W+1.15,L-5.8,SHIP_DECK,W-1.15,deckC);
 mb.box(-L+5.8,SHIP_DECK,-W+1.55,-L+13.1,11.8,W-1.55,cabinC);mb.box(-L+5.55,9.8,-W+1.38,-L+13.25,10.95,W-1.38,glassC);mb.box(-L+12.7,11.4,-W+1.18,-L+15.0,12.9,W-1.18,cabinC);
 mb.box(-L+8.6,12.9,-1.75,-L+11.8,17.2,1.75,accent);mb.box(-L+9.5,17.2,-.48,-L+10.9,19.2,.48,accent);
 mb.box(-L+3.8,SHIP_DECK,-W*.4,-L+5.15,5.0,W*.4,cabinC);mb.box(-L+3.55,4.08,-W*.32,-L+5.4,4.86,W*.32,glassC);
 for(const x of [-L+14,-L+18.8,-L+23.6]){mb.box(x,SHIP_DECK+.02,-W*.9,x+.38,SHIP_DECK+2.15,W*.9,C('#4d473f'))}
 const cc=['#c8402a','#2a6aa8','#3a8a4a','#d8a020','#7a3a8a','#e8e6e0'];
 for(let x=-L+16;x<L-13;x+=6.2)for(let k=0;k<5;k++){if(R()<.1)continue;const z=-W+1.45+k*2.62,h=1+Math.floor(R()*4),cw=5.75,cd=2.34;containers.push({x0:x,x1:x+cw,z0:z,z1:z+cd,top:SHIP_DECK+h*2.6-.06});for(let j=0;j<h;j++){const col=C(cc[Math.floor(R()*cc.length)]);mb.box(x,SHIP_DECK+j*2.6,z,x+cw,SHIP_DECK+(j+1)*2.6-.06,z+cd,col)}}
 for(let n=0;n<4;n++){const x=L-15+n*2.3;mb.box(x,SHIP_DECK+.02,-W*.9,x+.28,SHIP_DECK+1.3,W*.9,C('#4c463f'))}
 const m=mb.mesh(new THREE.MeshLambertMaterial({vertexColors:true}),false,false);const g=new THREE.Group();g.add(m);g.userData.containers=containers;scene.add(g);return g}
/* v78: um dos dois navios é um transatlântico (mesmo casco/colisão do cargueiro): casco branco com faixa marinho, 3 andares de
   cabines com janelas e varandas, ponte de comando na frente, chaminé, botes salva-vidas laranja, piscina no último deck.
   Os blocos dos andares entram em `containers` (maiores primeiro) → colisão e dá pra pousar/andar por cima. */
/* v78: o cruzeiro virou um transatlântico clássico dos anos 1910: casco preto com faixa vermelha na linha d'água, frisos branco e
   dourado, superestrutura branca baixa e comprida, 4 chaminés ocre com topo preto (inclinadas para trás), 2 mastros com cabo,
   botes salva-vidas no convés dos botes e duas fileiras de vigias. Proa no +x. */
function shipBuildCruise(R){const mb=new MB(),containers=[],C=h=>COL(h),wh=C('#f2f0e8'),blk=C('#151515'),blk2=C('#1e1e1e'),red=C('#8a2a20'),gold=C('#c8a040'),glass=C('#22303a'),buff=C('#d4943a'),wood=C('#b89a6a'),L=SHIP_L/2,W=SHIP_W/2,D=SHIP_DECK;R();
 // casco (mesmas massas do antigo, agora preto) + faixa vermelha na água + friso branco e dourado
 mb.box(-L+4.6,-3.2,-W*.72,L-18,-2.25,W*.72,red);mb.box(-L+2.6,-2.95,-W*.84,L-13,-1.15,W*.84,red);mb.box(-L+1.2,-2.48,-W*.94,L-9.2,D,W*.94,blk);
 mb.box(-L,-1.95,-W*.84,-L+7.4,D,W*.84,blk);mb.box(-L+1.7,-1.18,-W*.66,-L+10.8,D,W*.66,blk2);
 mb.box(L-18,-2.8,-W*.88,L-9.6,D,W*.88,blk);mb.box(L-12,-1.95,-W*.68,L-4.8,D,W*.68,blk);mb.box(L-6.2,-1.18,-W*.48,L-1.1,D,W*.48,blk);mb.box(L-2.1,-.55,-W*.26,L,.55,W*.26,blk2);
 mb.box(-L-.08,-1.4,-W*.955,L-1,-1.0,W*.955,red);
 mb.box(-L+1.2,D-.55,-W*.955,L-9.2,D,W*.955,wh);mb.box(-L+1.2,D-.82,-W*.958,L-9.2,D-.74,W*.958,gold);
 for(const yy of[.2,1.4])for(let x=-L+3;x<L-12;x+=1.2)for(const sg of[-1,1])mb.box(x,yy,sg*W*.94-.03,x+.32,yy+.32,sg*W*.94+.03,C('#cfc8a8')); // vigias
 mb.box(-L+5.2,D-.05,-W+1.15,L-5.8,D,W-1.15,wood);
 // superestrutura branca, baixa e comprida (2 conveses) com janelas
 const tiers=[[-L+8,L-16,W-1.35,2.7],[-L+10.5,L-20,W-2.3,2.5]];let y=D;
 tiers.forEach(([x0,x1,hw,h])=>{mb.box(x0,y,-hw,x1,y+h,hw,wh);mb.box(x0-.05,y+h-.12,-hw-.05,x1+.05,y+h,hw+.05,C('#d8d4c8'));
  for(const sg of[-1,1])for(let x=x0+.7;x<x1-.9;x+=1.15)mb.box(x,y+1.0,sg*hw-.05,x+.55,y+1.85,sg*hw+.05,glass);
  for(const sx of[x0,x1])mb.box(sx-.05,y+1.0,-hw+.7,sx+.05,y+1.85,hw-.7,glass);y+=h});
 const yt=y;containers.push({x0:tiers[1][0],x1:tiers[1][1],z0:-tiers[1][2],z1:tiers[1][2],top:yt},{x0:tiers[0][0],x1:tiers[0][1],z0:-tiers[0][2],z1:tiers[0][2],top:D+2.7});
 mb.box(tiers[1][0],yt,-tiers[1][2],tiers[1][1],yt+.06,tiers[1][2],wood); // convés dos botes
 // ponte de comando na frente
 mb.box(L-24,yt,-W+2.4,L-20.2,yt+2.2,W-2.4,wh);mb.box(L-20.25,yt+1.0,-W+2.5,L-20.15,yt+1.9,W-2.5,glass);mb.box(L-24.2,yt+2.2,-W+2.1,L-20,yt+2.36,W-2.1,C('#d8d4c8'));containers.unshift({x0:L-24,x1:L-20.2,z0:-W+2.4,z1:W-2.4,top:yt+2.2});
 // 4 chaminés ocre com topo preto, inclinadas para trás
 const fx0=-L+16,fx1=L-29;for(let k=0;k<4;k++){const x=fx0+(fx1-fx0)*k/3,h=8.2,rk=.11;
  mb.geo(GEO.cyl16,mtx(x-Math.sin(rk)*h/2,yt+h/2,0,1.55,h,1.1,0,0,rk),buff);mb.geo(GEO.cyl16,mtx(x-Math.sin(rk)*(h+.6),yt+h+.6,0,1.6,1.4,1.15,0,0,rk),blk);
  mb.box(x-1.4,yt,-1.0,x+1.4,yt+.5,1.0,C('#d8d4c8'));containers.unshift({x0:x-1.5,x1:x+1.5,z0:-1.1,z1:1.1,top:yt+h+1.2})}
 // botes salva-vidas brancos nos turcos, dos dois lados
 for(let x=-L+12;x<L-22;x+=3.6){if([0,1,2,3].some(k=>Math.abs(x+1.4-(fx0+(fx1-fx0)*k/3))<2))continue;for(const sg of[-1,1]){const z=sg*(tiers[1][2]-.6);mb.box(x,yt+.5,z-.45,x+2.8,yt+1.0,z+.45,wh);mb.box(x+.15,yt+1.0,z-.38,x+2.65,yt+1.06,z+.38,wood);mb.box(x+.2,yt,z-.05,x+.32,yt+1.4,z+.05,C('#3a3a3a'));mb.box(x+2.48,yt,z-.05,x+2.6,yt+1.4,z+.05,C('#3a3a3a'))}}
 // mastros de proa e popa com o cabo entre eles
 const mh=17;for(const mx of[L-11,-L+9])mb.geo(GEO.cyl,mtx(mx-Math.sin(.06)*mh/2,D+mh/2,0,.22,mh,.22,0,0,.06),C('#6a4a2a'));
 {const a=[L-11-Math.sin(.06)*mh,D+mh],b=[-L+9-Math.sin(.06)*mh,D+mh],len=Math.hypot(b[0]-a[0],b[1]-a[1]);mb.geo(GEO.box||GEO.cyl,mtx((a[0]+b[0])/2,(a[1]+b[1])/2,0,len,.05,.05),C('#2a2a2a'))}
 mb.box(L-14,D+.02,-W*.8,L-13.7,D+1.0,W*.8,C('#4c463f'));
 const m=mb.mesh(new THREE.MeshLambertMaterial({vertexColors:true}),false,false);const g=new THREE.Group();g.add(m);g.userData.containers=containers;g.userData.cruise=true;scene.add(g);return g}
function shipInit(){for(const sh of SHIPS.list)if(sh.g){scene.remove(sh.g);disposeGroup(sh.g)}SHIPS.list=[];SHIPS.key=S.seed+':'+S.style;if(!city.ext||city.coast==null||city.haze||S.style==='inverted')return;
 const R=mulberry32((S.seed^0x5b1b5)>>>0),E=city.ext;for(let i=0;i<2;i++){const dir=i?1:-1,sh={u:SHORE+(i?200:150),t:E*(.2+R()*.6),dir,face:dir,yaw:dir>0?0:Math.PI,turn:0,v:2.4+R()*.8,g:i?shipBuildCruise(R):shipBuild(R)};sh.containers=sh.g.userData.containers;sh.f=shipFrame(sh);SHIPS.list.push(sh)}
 if(Math.abs(SHIPS.list[0].t-SHIPS.list[1].t)<SHIP_L*1.5)SHIPS.list[1].t=(SHIPS.list[0].t+E*.5)%E}
function shipTick(dt){if(!played)return;if(SHIPS.key!==S.seed+':'+S.style)shipInit();if(!SHIPS.list.length)return;const E=city.ext,pc=PL.car||PL;
 for(const sh of SHIPS.list){const f0=sh.f;
  if(sh.turn>0){sh.turn-=dt;const k=1-Math.max(0,sh.turn)/10,y0=sh.face>0?Math.PI:0,y1=sh.face>0?0:Math.PI;sh.yaw=y0+(y1-y0)*(k*k*(3-2*k));if(sh.turn<=0)sh.yaw=y1}
  else{sh.t+=sh.dir*sh.v*dt;if((sh.dir>0&&sh.t>E+SHIP_L)||(sh.dir<0&&sh.t<-SHIP_L)){sh.dir=-sh.dir;sh.face=sh.dir;sh.turn=10}}
  sh.f=shipFrame(sh);const f=sh.f,dx=f.cx-f0.cx,dz=f.cz-f0.cz;
  sh.g.position.set(f.cx,SEA_Y+Math.sin(simT*.6+sh.u)*.08,f.cz);sh.g.rotation.y=-Math.atan2(f.hz,f.hx);sh.g.visible=Math.hypot(pc.x-f.cx,pc.z-f.cz)<900;
  // Pessoas e helicopteros mantem a mesma posicao LOCAL ao navio, mesmo durante a curva.
  const carry=(x,z)=>{const a=x-f0.cx,b=z-f0.cz,lx=a*f0.hx+b*f0.hz,lz=-a*f0.hz+b*f0.hx;return[f.cx+lx*f.hx-lz*f.hz,f.cz+lx*f.hz+lz*f.hx,lx,lz]};
  if(!PL.car&&!PL.heli&&!PL.inside&&PL.gy>SEA_Y+2){const q=carry(PL.x,PL.z);if(Math.abs(q[2])<SHIP_L/2&&Math.abs(q[3])<SHIP_W/2){PL.x=q[0];PL.z=q[1]}}
  for(const h of HELI.list||[]){if(h.onShip!==sh)continue;if(h.phase==='fly'&&h.y>SEA_Y+SHIP_DECK+HELI_SK+2){h.onShip=null;continue}
   const q=carry(h.x,h.z);h.x=q[0];h.z=q[1];if(h===HELI.cur&&h.phase!=='fly'){PL.x=h.x;PL.z=h.z}}
  // casco empurra lanchas e jet skis
  for(const c of carsNear(f.cx,f.cz,SHIP_L/2+6)){if(!c.t.boat&&!c.t.hover||c.mode!=='phys')continue;const[lx,lz]=shipLocal(sh,c.x,c.z),ex=SHIP_L/2+c.t.W/2+.4,ez=SHIP_W/2+c.t.W/2+.4;if(Math.abs(lx)>=ex||Math.abs(lz)>=ez)continue;
   const px=ex-Math.abs(lx),pz=ez-Math.abs(lz);let nx,nz,dep;if(pz<px){const s2=Math.sign(lz)||1;nx=-f.hz*s2;nz=f.hx*s2;dep=pz}else{const s2=Math.sign(lx)||1;nx=f.hx*s2;nz=f.hz*s2;dep=px}
   c.x+=nx*dep;c.z+=nz*dep;const vn=c.vx*nx+c.vz*nz;if(vn<0){c.vx-=1.4*vn*nx;c.vz-=1.4*vn*nz;if(-vn>4){impact(c,-vn,c.x-nx,c.z-nz);if(c===PL.car)shake=Math.max(shake,.4)}}c.sleep=false}}}
// ---------- PONTES LEVADIÇAS ----------
// Uma ponte garantida e uma segunda opcional, de pista dupla (sem arco, fora do pedágio e da foz).
// O trecho móvel é 1/3 da ponte, dividido em duas folhas
// que sobem até 45°: sobe 5 s, aberta 60 s, desce 5 s, fechada 60 s. Procurado: todas sobem e ganham X vermelho no mapa;
// nas guaritas suspensas FORA da calcada (alcance de interacao pela calcada) da para forcar a descida.
// O transito para antes, em fila, sem tentar desviar.
const DB_G=(P-RW)/6,DB_ANG=Math.PI/4,DB_WALL_ANG=DB_ANG*.955,DB_T={warning:5,rising:5,open:60,lowering:5,closed:60};
function dbKey(q){return q[0]+':'+q[1]+':'+q[2]}
// Reserva deterministica (mobile e normal) ANTES dos quarteiroes: um rio e uma
// travessia dirigivel sao obrigatorios, mesmo que a seed sorteie ruas de mao unica.
function dbReserveCrossing(){
 city.dbReserved=null;
 if(!city.riv||!city.riv.size)return;
 const n=city.N,flowX=city.flowX,isle=city.isle?dbKey(city.isle.bridge):'',
  sea=city.seaBranch?(flowX?dbKey(['h',city.seaBranch.a,city.coast===0?0:n]):dbKey(['v',city.coast===2?0:n,city.seaBranch.a])):'',
  rnd=mulberry32((S.seed^0x5f4c18d1)>>>0),pool=[];
 // Ruas transversais ao rio: leito navegavel, longe da foz e do pedagio.
 const add=q=>{if(dbKey(q)===isle||dbKey(q)===sea)return;
  const k=flowX?q[1]:q[2],axis=flowX?q[2]:q[1];
  if(k<1||k>=n||axis<1||axis>=n)return;
  const cx=q[0]==='h'?(q[1]+.5)*P:q[1]*P,cz=q[0]==='h'?q[2]*P:(q[2]+.5)*P;
  if(mouthChannel(cx,cz)||outDist(cx,cz)>-P*.5)return;
  if(flowX?! (isRiv(q[1]-1,q[2])&&isRiv(q[1],q[2])):
             !(isRiv(q[1],q[2]-1)&&isRiv(q[1],q[2])))return;
  pool.push({q,score:Math.abs(k-n/2)*.05+rnd(),open:segExists(q[1],q[2],q[0]==='h'?0:1)})};
 // Travessias preexistentes primeiro; assim nao mexemos em pontes especiais.
 for(const q of city.bridges||[])if(flowX?q[0]==='v':q[0]==='h')add(q);
 let usable=pool.filter(c=>c.open);usable.sort((a,b)=>a.score-b.score);
 if(!usable.length){
  // Fallback para layouts extremos: restaurar uma passagem transversal de agua
  // anteriormente removida por sorteio, sem introduzir rio nem ponte ficticios.
  for(let k=1;k<n;k++)for(let a=1;a<n;a++){
   const q=flowX?['v',k,a]:['h',a,k];
   if((city.bridges||[]).some(b=>dbKey(b)===dbKey(q)))continue;
   add(q);
  }
  usable=pool.slice().sort((a,b)=>a.score-b.score);
 }
 if(!usable.length)throw Error('Seed '+S.seed+' sem travessia valida para ponte levadica');
 const q=usable[0].q,dir=q[0]==='h'?0:1;
 if(!segExists(q[1],q[2],dir))city.segOff.delete(segKey(q[1],q[2],dir));
 if(!city.bridges.some(b=>dbKey(b)===dbKey(q)))city.bridges.push(q);
 city.dbReserved=q.slice();
}
function dbIsSeg(q){return(city.dbs||[]).some(d=>dbKey(d.q)===dbKey(q))}
function dbChoose(){city.dbs=[];if(city.haze||!city.bridges)return;const R=mulberry32((S.seed^0x0db71d9e)>>>0),cand=[];
 const sea=city.seaBranch,N=city.N,seaQ=sea?(city.flowX?['h',sea.a,city.coast===0?0:N]:['v',city.coast===2?0:N,sea.a]):null,isleQ=city.isle?city.isle.bridge:null;
 for(const q of city.bridges){const d=q[0]==='h'?0:1;if(!segExists(q[1],q[2],d))continue;if(lineType(q[1],q[2],d).t!=='ave')continue;{const ln=q[0]==='h'?q[2]:q[1];if(ln<=0||ln>=city.N)continue}if(seaQ&&dbKey(q)===dbKey(seaQ))continue;if(isleQ&&dbKey(q)===dbKey(isleQ))continue;
  const cx=q[0]==='h'?(q[1]+.5)*P:q[1]*P,cz=q[0]==='h'?q[2]*P:(q[2]+.5)*P;if(mouthChannel(cx,cz)||!waterAt(cx,cz)&&!riverZone(cx,cz))continue;if(outDist(cx,cz)>-P*.5)continue;cand.push({q,cx,cz,o:R()})}
 // A travessia reservada vem SEMPRE primeiro; a segunda continua opcional.
 // Se nao houve reserva em mundo urbano, falha explicitamente na geracao.
 const wanted=city.dbReserved&&dbKey(city.dbReserved);
 if(wanted){const k=cand.findIndex(c=>dbKey(c.q)===wanted);
  if(k<0)throw Error('Seed '+S.seed+': ponte reservada nao passou na validacao');
  const force=cand.splice(k,1)[0];cand.sort((a,b)=>a.o-b.o);cand.unshift(force);
 }else if(!city.haze)throw Error('Seed '+S.seed+': ponte levadica sem reserva');
 else cand.sort((a,b)=>a.o-b.o);
 for(const c of cand){if(city.dbs.length>=2)break;if(city.dbs.some(d=>Math.hypot(d.cx-c.cx,d.cz-c.cz)<P*2.5))continue;const h=c.q[0]==='h';
  city.dbs.push({q:c.q,cx:c.cx,cz:c.cz,ux:h?1:0,uz:h?0:1,state:'closed',t:20+R()*40,ang:0,forced:false,override:false,g:null,leaves:[],booths:[],gates:[]})}
 city.pillars=(city.pillars||[]).filter(p=>!city.dbs.some(d=>Math.hypot((p[0]+p[2])/2-d.cx,(p[1]+p[3])/2-d.cz)<4)); /* v79r2: ponte levadiça sem o pilar no meio da água (o vão central abre) */
 for(const d of city.dbs)for(const sd of [-1,1]){const hx=d.cx-d.ux*sd*DB_G,hz=d.cz-d.uz*sd*DB_G,a=.9,b=RW/2+.7;city.pillars.push(d.ux?[hx-a,hz-b,hx+a,hz+b]:[hx-b,hz-a,hx+b,hz+a])} /* v79r4: os pilares voltam, um em cada dobradiça, logo abaixo das engrenagens */
 const U=[DBU.a,DBU.b];U.forEach((u,i)=>{const d=city.dbs[i];if(!d){u.value.set(-1e6,-1e6,-1e6,-1e6);return}const o=RW/2+.25;if(d.ux)u.value.set(d.cx-DB_G,d.cz-o,d.cx+DB_G,d.cz+o);else u.value.set(d.cx-o,d.cz-DB_G,d.cx+o,d.cz+DB_G)})}
function dbLocal(d,x,z){const dx=x-d.cx,dz=z-d.cz;return[dx*d.ux+dz*d.uz,-dx*d.uz+dz*d.ux]}
const DBAT_OUT=[null,0,0];/* v3 r5: dbAt devolve rascunho fixo (os 3 usos leem na hora) */
function dbAt(x,z){for(const d of city.dbs){const dx=x-d.cx,dz=z-d.cz,s=dx*d.ux+dz*d.uz,l=-dx*d.uz+dz*d.ux;if(Math.abs(s)<DB_G&&Math.abs(l)<RW/2){const o=DBAT_OUT;o[0]=d;o[1]=s;o[2]=l;return o}}return null}
function dbGround(x,z){const h=dbAt(x,z);if(!h)return null;const d=h[0],s=h[1],a=d.ang;if(a<.004)return null;const dd=s<0?s+DB_G:DB_G-s;if(dd<=DB_G*Math.cos(a))return dd*Math.tan(a);return 0}
function dbHole(x,z){const h=dbAt(x,z);if(!h)return false;const d=h[0],s=h[1],a=d.ang;if(a<.03)return false;const dd=s<0?s+DB_G:DB_G-s;return dd>DB_G*Math.cos(a)+.05}
// Cruzamento da ponta da folha, comparando sua posição antes e depois do movimento.
function dbRampExit(x0,z0,x,z,vx,vz){
 for(const d of city.dbs||[]){
  if(d.ang<.03)continue;
  const [s0,l0]=dbLocal(d,x0,z0),[s,l]=dbLocal(d,x,z);
  const side=s0<0?-1:1,from=DB_G-s0*side,to=DB_G-s*side;
  if(Math.abs(l0)>=RW/2||Math.abs(l)>=RW/2)continue;
  const run=DB_G*Math.cos(d.ang),oldRun=DB_G*Math.cos(d.prevAng??d.ang);
  if(from<-.05||from>Math.max(run,oldRun)+.05||to<=run||to>DB_G*2)continue;
  const speed=-side*(vx*d.ux+vz*d.uz);
  if(speed<=0)continue;
  return {height:DB_G*Math.sin(d.ang),impulse:speed>5?rampImpulse(speed,Math.tan(d.ang)):0};
 }
 return null;
}
function dbPlayerCarRamp(c){
 if(!c.alive||c.sunk||c.air||c.t.boat||c.wet)return;
 const j=dbRampExit(c.px,c.pz,c.x,c.z,c.vx,c.vz);
 if(!j)return;
 c.gy=0;c.rampY=0;c.airY=j.height;c.airV=j.impulse;
 c.air={bridge:true,t:0};
}
function dbCar(c,dt){if(!city.dbs||!city.dbs.length||c.airY>0||c.t.boat)return;const h=dbAt(c.x,c.z);if(!h){c.dbOn=false;return}const d=h[0],s=h[1],a=d.ang;if(a<.01){c.dbOn=false;return}
 const dd=s<0?s+DB_G:DB_G-s,ext=DB_G*Math.cos(a),out=s<0?1:-1,ux=d.ux*out,uz=d.uz*out,v=c.vx*ux+c.vz*uz;
 if(dd<=ext){c.dbOn=true;const gk=9.81*Math.sin(a)*dt;c.vx-=ux*gk;c.vz-=uz*gk;c.sleep=false}
 else{if(c!==PL.car&&c.dbOn&&v>5){c.airY=Math.max(.3,ext*Math.tan(a));c.airV=v*Math.sin(a)+1;c.air={x0:c.x,z0:c.z,t:0};if(c===PL.car)shake=Math.max(shake,.3)}c.dbOn=false}}
// Folha quase a 45 graus: colisao de parede em vez de rampa.
// Quem ficou sobre a folha durante a subida continua escorregando em
// direcao a dobradica (nao e teleportado para o fim da ponte).
function dbWallActor(o,prevX,prevZ,dt,margin){
 if(!city.dbs||!city.dbs.length)return false;
 for(const d of city.dbs){if(d.ang<DB_WALL_ANG)continue;
  const [s0,l0]=dbLocal(d,prevX,prevZ),[s,l]=dbLocal(d,o.x,o.z);
  if(Math.abs(l)>RW/2+margin||Math.abs(l0)>RW/2+margin)continue;
  const edge=DB_G+margin;if(Math.abs(s)>=edge&&Math.abs(s0)>=edge)continue;
  const sign=s0<0?-1:s0>0?1:s<0?-1:1;
  if(s*sign<-(edge+.3))continue; // Nunca puxar um ator do lado oposto da ponte.
  const inside0=Math.max(0,edge-Math.abs(s0));
  const inside1=Math.max(0,edge-Math.abs(s));
  // Slipping conservador: 5.5 m/s a 45 graus, sempre na direcao da rua.
  const allowed=Math.max(0,inside0-5.5*dt);
  if(inside1<=allowed+.001)continue;
  const fixS=sign*(edge-allowed),ds=fixS-s;
  o.x+=ds*d.ux;o.z+=ds*d.uz;
  const inward=-sign*(o.vx*d.ux+o.vz*d.uz);
  if(inward>0){o.vx+=sign*d.ux*inward;o.vz+=sign*d.uz*inward}
  return true
 }
 return false
}
// Cancela no acesso, antes da folha móvel: só impede quem AINDA não entrou.
const DB_GATE_DIST=DB_G+9;
function dbStopFor(r,t){for(const d of city.dbs){const q=d.q,h=q[0]==='h';let m=false;
 if(h)m=(r.kx===q[1]&&r.kz===q[2]&&r.d===0)||(r.kx===q[1]+1&&r.kz===q[2]&&r.d===2);
 else m=(r.kx===q[1]&&r.kz===q[2]&&r.d===1)||(r.kx===q[1]&&r.kz===q[2]+1&&r.d===3);
 if(!m||r.turn)continue;
 const busy=d.state!=='closed'||d.ang>.002;if(!busy)return null;
 // Evitar freada sobre a ponte: se o para-choque já cruzou a cancela,
 // o carro deve sair do tabuleiro enquanto a folha ainda está parada.
 const stopS=P/2-DB_GATE_DIST-3.1-t.L/2,dist=stopS-r.s;
 return dist>-1.2?dist:null;
 }return null}
function dbDeckOccupied(d){
 const near=carsNear(d.cx,d.cz,DB_G+9);
 for(const c of near){if(!c.alive||c.sunk||c.t.boat||c.t.hover)continue;
  const[s,l]=dbLocal(d,c.x,c.z);if(Math.abs(s)<DB_G+c.t.L*.5+1&&Math.abs(l)<RW/2+1)return true;
 }
 if(!PL.car&&!PL.heli&&!PL.inside&&!PL.dead){const[s,l]=dbLocal(d,PL.x,PL.z);
  if(Math.abs(s)<DB_G+1&&Math.abs(l)<RW/2+1)return true}
 return false;
}
function dbBeginWarning(d){d.state='warning';d.t=DB_T.warning;d.ang=0;d.reopen=false}
// Reaproveita o shader de reflexo do solo (incluindo seus uniforms de chuva,
// poças, câmera e luzes), mas substitui a máscara do mapa pelo tipo real da folha.
// Uma ponte atravessa água, por isso consultar a máscara 2D do terreno esconderia
// justamente os pixels no meio do rio. A geometria gira com cada folha móvel.
function dbWetMaterial(rural){if(!WET.mesh)return null;
 const src=WET.mesh.material,find=`vec2 uv=(vW.xz+off)/sz;vec4 m=texture2D(mask,uv);
#if WALK
   float road=m.b;if(road<.05)discard;
#else
   float road=m.r*roadOn,dirt=m.g;if(road+dirt<.05)discard;
#endif`;
 const substitute=`vec2 uv=(vW.xz+off)/sz;
#if BRIDGE_WET
 #if BRIDGE_DIRT
   float road=0.,dirt=1.;
 #else
   float road=roadOn,dirt=0.;
 #endif
   if(road+dirt<.05)discard;
#else
   vec4 m=texture2D(mask,uv);
 #if WALK
   float road=m.b;if(road<.05)discard;
 #else
   float road=m.r*roadOn,dirt=m.g;if(road+dirt<.05)discard;
 #endif
#endif`;
 if(!src.fragmentShader.includes(find))throw Error('Shader de chuva do solo mudou: ponte sem compatibilidade');
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,
  uniforms:src.uniforms,defines:{WALK:0,WET_LIGHTS:MOB_LITE?6:8,BRIDGE_WET:1,BRIDGE_DIRT:rural?1:0},
  vertexShader:src.vertexShader,fragmentShader:src.fragmentShader.replace(find,substitute)});
 bridgeVisualMaterial(mat,true);return mat}
function dbWetLevel(x,z){if(!WET.wf||!WET.sz)return 0;
 const u=(x+MOFF)/WET.sz,v=(z+MOFF)/WET.sz;if(u<0||v<0||u>=1||v>=1)return 0;
 const i=Math.min(WET.G-1,Math.floor(u*WET.G)),j=Math.min(WET.G-1,Math.floor(v*WET.G));
 return WET.wf[j*WET.G+i]||0}
function dbBuild(d){const g=new THREE.Group(),st=STYLES[S.style],C=c=>new THREE.MeshLambertMaterial({color:c}),
 // O mesmo teste do decalque da via (buildChunk): a ponte acompanha o terreno do trecho.
 // A seed pode colocar a ponte numa avenida rural; ali NAO deve ficar com asfalto.
 rural=isRural(d.cx,d.cz),
 roadMat=rural?new THREE.MeshStandardMaterial({color:st.synth?'#4a3a40':'#9a7b52',roughness:.8,metalness:0,emissive:st.synth?0x262428:0}):
  // v265: nunca permitir material branco na pista móvel se a textura falhar.
  // A malha da folha utiliza UV de mundo como a rua, com asfalto repetido a cada 9m.
  new THREE.MeshStandardMaterial({map:city.groundMat?.map||null,color:city.groundMat?.map?0xb0b0b0:st.asphalt,roughness:.95,metalness:0}),
 // Guardas e passeio neutros, sem o branco excessivo que a ponte pode mostrar ao sol.
 walk=C(st.synth?'#5a5a6a':'#888b93'),wall=C(st.synth?'#6a6a7a':'#969ba2'),under=C('#2a2a30');
 d.rural=rural;d.roadMat=roadMat;d.wetSurfaces=[];
 // Shader compartilhado pelas duas folhas; uniforme conectado ao solo molhado.
 const wetMat=dbWetMaterial(rural);
 const o=RW/2,yaw=Math.atan2(d.uz,d.ux);
 for(const sd of [-1,1]){const piv=new THREE.Group();piv.position.set(d.cx-d.ux*sd*DB_G,0,d.cz-d.uz*sd*DB_G);piv.rotation.y=-(yaw+(sd<0?Math.PI:0));g.add(piv);const tilt=new THREE.Group();piv.add(tilt);
  const B=(w,h,dp,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),m);b.position.set(x,y,z);tilt.add(b);return b};const L=DB_G-.03;
  // Topo de terra fica na mesma altura do decalque rural (.015); asfalto mantém o topo anterior.
  const road=B(L,.5,2*(o-1.6),roadMat,L/2,rural?-.235:-.245,0);road.receiveShadow=true;
  if(wetMat){
   // Topo: +.015 terra / +.005 asfalto. Deslocamento preserva a película sobre
   // o pavimento sem z-fighting, inclusive quando a folha estiver inclinada.
   const geo=new THREE.PlaneGeometry(L,2*(o-1.6));geo.rotateX(-Math.PI/2);
   const film=new THREE.Mesh(geo,wetMat);film.position.set(L/2,rural?.035:.025,0);
   film.renderOrder=3;film.visible=false;tilt.add(film);d.wetSurfaces.push(film);
  }
  if(!rural){
   // UV do asfalto em coordenadas globais, na mesma escala das ruas (9 m por repetição).
   // Não modificar a textura de asfalto nem o alinhamento corrigido na v136.
   road.updateWorldMatrix(true,false);
   // Cada face recebe UV coerente com o asfalto; garante textura ate em
   // orientacoes de ponte onde a face lateral era UV generica branca.
   const pos=road.geometry.attributes.position,nor=road.geometry.attributes.normal,uv=road.geometry.attributes.uv,p=new THREE.Vector3();
   for(let i=0;i<pos.count;i++){
    p.fromBufferAttribute(pos,i).applyMatrix4(road.matrixWorld);
    if(Math.abs(nor.getY(i))>.9)uv.setXY(i,p.x/9,p.z/9);
    else if(Math.abs(nor.getZ(i))>.9)uv.setXY(i,p.x/9,p.y/9);
    else uv.setXY(i,p.z/9,p.y/9);
   }
   uv.needsUpdate=true;
  }
  for(const z of [-1,1]){B(L,.7,1.6,walk,L/2,-.15,z*(o-.8));B(L,1.1,.35,wall,L/2,.6,z*(o-.175))}B(L,.4,2*o,under,L/2,-.65,0);
  // Estradas rurais não possuem as faixas amarelas/brancas das avenidas asfaltadas.
  if(!rural){B(L,.012,.14,C('#f2c21a'),L/2,.006,-.12);B(L,.012,.14,C('#f2c21a'),L/2,.006,.12);for(let k=0;k<L-2;k+=4)for(const z of [-o/2,o/2])B(2,.012,.14,C('#f4f4f0'),k+1.2,.006,z*.95)}
  // dobradiça: dois cilindros grandes sob a junta e uma engrenagem em cada lado
  for(const z of [-1,1]){const cy=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,2.4,14),C('#4a4e56'));cy.rotation.x=Math.PI/2;cy.position.set(0,-.95,z*(o-2));piv.add(cy);
   const gear=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.3,12),C('#6a5a3a'));gear.rotation.x=Math.PI/2;gear.position.set(0,-.95,z*(o+.2));piv.add(gear);for(let k=0;k<6;k++){const tth=new THREE.Mesh(new THREE.BoxGeometry(.32,.32,.32),C('#6a5a3a'));const aa=k/6*Math.PI*2;tth.position.set(Math.cos(aa)*1.15,-.95+Math.sin(aa)*1.15,z*(o+.2));piv.add(tth)}}
  d.leaves.push({tilt})}
 // Guaritas nas CABECEIRAS, a DIREITA do motorista que chega de cada margem.
 // A cabine fica toda para FORA da mureta, pendurada em suportes sob a calcada:
 // nao ocupa as faixas de rolamento nem gera colisor sobre o tabuleiro.
 for(const sd of [-1,1]){const sAt=sd*(P/2-RW/2-3),lat=-sd*(o+1.65),
  bx=d.cx+d.ux*sAt-d.uz*lat,bz=d.cz+d.uz*sAt+d.ux*lat,
  cab=new THREE.Group();cab.position.set(bx,.2,bz);cab.rotation.y=-yaw;g.add(cab);
  const B=(w,h,dp,col,x,y,z,tr)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),tr?new THREE.MeshBasicMaterial({color:0x9ad0f0,transparent:true,opacity:.3,depthWrite:false}):C(col));m.position.set(x,y,z);cab.add(m);return m};
  // Vigas em balanco abaixo do piso, ligando o corpo da guarita ao parapeito.
  B(1.9,.24,3.5,'#454b56',0,-.38,sd*.87);
  for(const sx of [-.65,.65]){B(.16,.62,.16,'#596273',sx,-.76,sd*.78);B(.16,.18,2.3,'#89929e',sx,-.94,sd*.65)}
  B(1.5,.2,1.2,'#9a9aa2',0,.1,0);B(1.3,.9,1.0,'#e8e2d0',0,.65,0);B(1.25,.95,.95,'',0,1.55,0,true);
  for(const sx of [-.6,.6])for(const sz of [-.45,.45])B(.07,1.0,.07,'#e8e2d0',sx,1.55,sz);
  B(1.6,.16,1.3,'#2a6ad6',0,2.12,0);
  const man=makeCharacter({...CLERK_PAL,cap:'#2a6ad6',capDark:'#1a4a9a',shirt:'#2a6ad6',stripe:'#f2c21a'});
  d.booths.push({x:bx,z:bz,s:sAt,l:lat,man:{...man,x:bx,z:bz,gy:.2,mx:-d.uz*sd,mz:d.ux*sd}});
  // Sem addCol: a guarita suspensa nao bloqueia a via, nem bate nos carros.
 }
 // Cancelas rodoviárias não tarifadas nas cabeceiras, próximas das antigas
 // guaritas. Um poste do lado da faixa de CHEGADA em cada acesso: a lateral
 // correta depende do sentido da avenida (laneOff é positivo à esquerda do eixo
 // de tráfego). O braço cobre apenas a metade usada por quem entra na ponte.
 d.gates=[];
 for(const sd of [-1,1]){
  // No lado sd=-1 os carros vêm em +u (faixa +l); em sd=+1 vêm em -u (faixa -l).
  const sAt=sd*DB_GATE_DIST,lAt=-sd*(o+.55),
   bx=d.cx+d.ux*sAt-d.uz*lAt,bz=d.cz+d.uz*sAt+d.ux*lAt;
  const post=new THREE.Group();post.position.set(bx,0,bz);post.rotation.y=-yaw;g.add(post);
  const base=new THREE.Mesh(new THREE.BoxGeometry(.62,1.3,.62),C('#454a52'));
  base.position.y=.65;post.add(base);
  const sig=new THREE.Mesh(new THREE.BoxGeometry(.58,.26,.68),C('#d9b238'));
  sig.position.y=1.27;post.add(sig);
  const pivot=new THREE.Group();pivot.position.y=1.42;post.add(pivot);
  const reach=o-1.05;
  for(let k=0;k<8;k++){
   const len=reach/8,b=new THREE.Mesh(new THREE.BoxGeometry(.15,.18,len+.01),C(k%2?'#f2f2ec':'#d72a28'));
   b.position.set(0,0,sd*(k+.5)*len);pivot.add(b);
  }
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,7,5),st.noLamps?new THREE.MeshStandardMaterial({color:0x2a1818,roughness:.7}):new THREE.MeshBasicMaterial({color:0xff3a2b}));
  lamp.position.set(0,.22,0);pivot.add(lamp);
  // Só a haste na faixa recebe colisão, e apenas quando completamente baixa.
  // Nunca manter colisores quando estiver levantada.
  const l0=-sd*(o+.55),l1=-sd*(o+.55-reach),mn=Math.min(l0,l1),mx=Math.max(l0,l1);
  const p0x=d.cx+d.ux*sAt-d.uz*mn,p0z=d.cz+d.uz*sAt+d.ux*mn,
        p1x=d.cx+d.ux*sAt-d.uz*mx,p1z=d.cz+d.uz*sAt+d.ux*mx;
  const col=addCol(Math.min(p0x,p1x)-.11,Math.min(p0z,p1z)-.11,
                   Math.max(p0x,p1x)+.11,Math.max(p0z,p1z)+.11,'rock');
  col.dead=true;col.drawbridgeGate=true;
  d.gates.push({sd,pivot,col,angle:1.4,lamp});
 }
 scene.add(g);d.g=g;DB.groups.push(g)}
function dbBoothNear(){if(!city.dbs||PL.car||PL.inside)return null;
 for(const d of city.dbs){const[s,l]=dbLocal(d,PL.x,PL.z);
  for(const b of d.booths){
   // O jogador interage da calcada ao lado do parapeito, sem precisar entrar
   // na cabine suspensa. Nao alcanca a guarita a partir do meio da pista.
   if(Math.abs(s-b.s)<2.8&&Math.abs(l-b.l)<3.6&&Math.abs(l)>RW/2-2.15)return d;
  }}return null}
function dbBoothAct(d){clang(.25);
 if(d.state==='warning'){d.state='closed';d.t=DB_T.closed;d.reopen=false;toast('ABERTURA CANCELADA · TRÁFEGO LIBERADO');return}
 if(d.ang>.01||d.state==='rising'||d.state==='open'){
  d.state='lowering';d.t=DB_T.lowering*(d.ang/DB_ANG);d.forced=false;d.reopen=false;
  if(POL.wanted)d.override=true;
  toast('PONTE DESCENDO');
 }else{dbBeginWarning(d);toast('CANCELAS FECHANDO')}
}
const DB={key:'',cT:0,groups:[]};
/* v3 r30: ponte levadiça no online = fase do relógio do servidor (netNow) + defasagem fixa por ponte. Mesma sequência do modo solo:
   fechada 60 s → aviso 5 → subindo 5 → aberta 60 → descendo 5. Não espera o tabuleiro esvaziar (senão cada jogo atrasaria diferente). */
function dbNetSync(d){if(!ONLINE.on||S.style!=='modern'||city.haze)return false;const T=DB_T,L=T.closed+T.warning+T.rising+T.open+T.lowering,i=Math.max(0,city.dbs.indexOf(d));
 let ph=((netNow()+i*47)%L+L)%L;if(ph<T.closed){d.state='closed';d.t=T.closed-ph;return true}ph-=T.closed;
 if(ph<T.warning){d.state='warning';d.t=T.warning-ph;return true}ph-=T.warning;if(ph<T.rising){d.state='rising';d.t=T.rising-ph;return true}ph-=T.rising;
 if(ph<T.open){d.state='open';d.t=T.open-ph;return true}ph-=T.open;d.state='lowering';d.t=T.lowering-ph;return true}
function dbTick(dt){if(!played||!city.dbs)return;const k=S.seed+':'+S.style;if(DB.key!==k||DB.ref!==city.dbs){DB.key=k;DB.ref=city.dbs;
  // v78: troca de mundo (Synth ↔ Point Haze…): as pontes ficavam na cena (boiando no mar da ilha) e, na volta,
  // eram construídas de novo por cima das antigas (duplicadas e congeladas). Agora só ficam as do mundo atual;
  // se a cidade voltou do cache com a mesma ponte (d.g), ela é recolocada em vez de duplicada.
  for(const g of DB.groups)scene.remove(g);DB.groups=[];
  for(const d of city.dbs){if(d.g){scene.add(d.g);DB.groups.push(d.g)}else try{dbBuild(d)}catch(e){console.error(e)}}}
 const pc=PL.car||PL;
 for(const d of city.dbs){
  if(!POL.wanted)d.override=false;
  const want=POL.wanted&&!d.override;
  if(want&&!d.forced){d.forced=true;
   if(d.state==='closed')dbBeginWarning(d);
   else if(d.state==='lowering')d.reopen=true;
  }
  if(!want&&d.forced){d.forced=false;if(d.state==='open')d.t=Math.min(d.t,8);
   if(d.state==='warning'){d.state='closed';d.t=DB_T.closed}}
  if(dbNetSync(d)){}else{ /* v3 r30: no online o ciclo sai do relógio do servidor (todos veem a mesma ponte subindo) */
  d.t-=dt;
  if(d.t<=0){
   if(d.state==='warning'){
    // Nunca erguer com carro ou personagem atravessando a folha móvel.
    if(dbDeckOccupied(d))d.t=.35;
    else{d.state='rising';d.t=DB_T.rising}
   }else if(d.state==='rising'){d.state='open';d.t=DB_T.open}
   else if(d.state==='open'){if(d.forced)d.t=5;else{d.state='lowering';d.t=DB_T.lowering}}
   else if(d.state==='lowering'){d.state='closed';d.t=DB_T.closed;
    if(d.reopen||d.forced)dbBeginWarning(d)}
   else{dbBeginWarning(d)}
  }}
  d.prevAng=d.ang;
  d.ang=d.state==='rising'?DB_ANG*(1-Math.max(0,d.t)/DB_T.rising):
   d.state==='open'?DB_ANG:d.state==='lowering'?DB_ANG*Math.max(0,d.t)/DB_T.lowering:0;
  // Braços abrem primeiro após a descida; descem antes da subida.
  for(const gate of d.gates){
   const closed=d.state==='warning'||d.state==='rising'||d.state==='open'||d.state==='lowering';
   const target=closed?0:1.4,step=dt*(closed?.47:.80); // ~3x mais devagar
   gate.angle+=clamp(target-gate.angle,-step,step);
   gate.pivot.rotation.x=-gate.sd*gate.angle;
   if(!(city.st&&city.st.noLamps))gate.lamp.material.color.setHex(closed?0xff3b30:0x58ee82);
   // Nenhuma colisão acima de 0.1 rad, nem enquanto há carro no braço.
   gate.col.dead=gate.angle>.10||carsNear(d.cx+d.ux*gate.sd*DB_GATE_DIST,
    d.cz+d.uz*gate.sd*DB_GATE_DIST,4).some(c=>c.alive&&(()=>{const[s,l]=dbLocal(d,c.x,c.z);return Math.abs(s-gate.sd*DB_GATE_DIST)<3&&Math.sign(l)===-gate.sd})());
  }
  // Molhamento por posição: a ponte não depende da chuva na posição do jogador.
  // Mesmo fora do pico da chuva, a película persiste enquanto o piso seca.
  if(d.roadMat){const w=Math.max(dbWetLevel(d.cx,d.cz),S.rain?Math.min(1,rainAt(d.cx,d.cz)):0),m=d.roadMat;
   if(d.rural){m.roughness=.8-.38*w;m.metalness=.14*w;m.color.setScalar(1-.2*w)}
   else{m.roughness=.95-.62*w;m.metalness=.28*w;m.color.setScalar(1-.38*w)}}
  const near=Math.hypot(pc.x-d.cx,pc.z-d.cz)<420;if(d.g)d.g.visible=near;for(const L of d.leaves)L.tilt.rotation.z=d.ang;
  for(const b of d.booths){const m=b.man,showMan=near&&S.style!=='inverted';m.sp.visible=showMan;if(showMan){setFrame(m.tex,pickDir(m.mx,m.mz,m.x,m.z),0);placeSprite(m)}}
  // quem estava no trecho móvel quando ela começou a subir vira carro solto (escorrega)
  if(d.ang>.003)for(const c of carsNear(d.cx,d.cz,DB_G+6)){
   if(c===PL.car||c.t.boat||c.dbDebris||!c.alive)continue;
   const[s,l]=dbLocal(d,c.x,c.z);
   if(Math.abs(s)<DB_G+c.t.L/2&&Math.abs(l)<RW/2){
    if(c.mode==='rail')toPhys(c);
    // A ponte tira temporariamente o carro da IA, mas preserva a faixa e o destino.
    // Antes a IA era apagada definitivamente; ao fechar, ficava um obstáculo na pista.
    c.dbRestoreAI=c.ai||null;c.ai=null;c.chase=false;c.dbDebris=true;c.hand=false;c.thr=0;
   }
  }
  if(d.state==='closed'&&d.ang<=.002){
   // Com as duas folhas apoiadas, os motoristas que escorregaram voltam a circular.
   // Não teleporta nem remove carros à vista do jogador.
   for(const c of carsNear(d.cx,d.cz,DB_G+30))if(c.dbDebris){
    c.dbDebris=false;
    if(c.dbRestoreAI&&c.alive&&!c.exploded){
     c.ai=c.dbRestoreAI;c.ai.stun=Math.max(c.ai.stun||0,.5);
     c.sleep=false;c.sleepT=0;c.hand=false;
    }
    c.dbRestoreAI=null;
   }
  }
 }
 // trânsito reduzido nas pontes levadiças (no máx. 3 por ponte), sem sumir na frente do jogador
 DB.cT-=dt;if(DB.cT<=0){DB.cT=1;for(const d of city.dbs){const on=vehicles.filter(c=>c.mode==='rail'&&c!==PL.car&&(()=>{const[s,l]=dbLocal(d,c.x,c.z);return Math.abs(s)<P/2&&Math.abs(l)<RW/2})()).sort((a,b)=>Math.hypot(b.x-pc.x,b.z-pc.z)-Math.hypot(a.x-pc.x,a.z-pc.z));
   while(on.length>3){const c=on.shift();if(Math.hypot(c.x-pc.x,c.z-pc.z)>70)removeVehicle(c);else break}}
  for(const c of vehicles.slice())if(c.dbDebris&&c!==PL.car&&Math.hypot(c.x-pc.x,c.z-pc.z)>220)removeVehicle(c)}}
// ---------- VORTEX (hovercraft anfíbio): sempre na areia ao lado do farol ----------
const VORTEX={v:null,cd:0,key:''};
function vortexTick(){if(!worldOn('vortex'))return;if(!played||!city.lh||S.style==='inverted'||city.haze)return;const k=S.seed+':'+S.style;if(VORTEX.key!==k){VORTEX.key=k;VORTEX.v=null;VORTEX.cd=0}
 const L=city.lh,p=wTU(L.s,L.t,SHORE-7),a=Math.atan2(L.sea[1],L.sea[0]),pc=PL.car||PL,d=Math.hypot(pc.x-p[0],pc.z-p[1]),v=VORTEX.v;
 if(v&&(!vehicles.includes(v)||v.used||v===PL.car)){if(v.used||v===PL.car)VORTEX.cd=gameMin()+120;VORTEX.v=null}
 if(!VORTEX.v&&d<230&&gameMin()>=VORTEX.cd&&!carsNear(p[0],p[1],4).length){const c=makeVehicle('vortex',p[0],p[1],a,'#ff7a1a');c.hand=true;c.sleep=false;VORTEX.v=c}
 else if(VORTEX.v&&d>340&&!VORTEX.v.used){removeVehicle(VORTEX.v);VORTEX.v=null}}
// ---------- CAMA DA CASA SEGURA: deitar = salvar (abre o download do .psave na hora) ----------
/* ================= v78 · BANCA DE JORNAL =================
   Jornal por $1 nas bancas das esquinas. Traz manchetes com o que o jogador aprontou (morte, prisão, carro explodido…),
   com bairro, dia e hora. Fica só aqui — não entra no registro de falas do menu. Guarda as 12 últimas (campo opcional "news" no save). */
const NEWS={items:[],open:false,lastDead:false,cause:'',boomT:-9,veh:''};
function newsNear(){if(PL.inside||PL.car||PL.heli||PL.dead||!city.chunks)return null;for(const ch of city.chunks.values())for(const k of ch.kiosks||[])if(Math.hypot(PL.x-k.x,PL.z-k.z)<1.7)return k;return null}
function newsAdd(k,o){const b=PL.car||PL;NEWS.items.push({k,t:Math.round(gameMin()),d:districtName(b.x,b.z)||'',w:CHAR.cur,...(o||{})});if(NEWS.items.length>12)NEWS.items.shift()}
function newsTick(){const d=!!PL.dead;if(d&&!NEWS.lastDead&&!PROLOGUE.active&&!ONLINE.on){ /* v3 r27: no online a minha morte vem do servidor (netNews), igual para todos */const c=NEWS.cause||'';newsAdd('dead',{c,veh:c==='EXPLODIDO'?NEWS.veh:''})}NEWS.lastDead=d;if(!d)NEWS.cause=''}
function newsTL(pt,en){return S.lang==='en'?en:pt}
function newsWhen(t){const day=Math.floor(t/1440)+1,m=((t%1440)+1440)%1440;return newsTL('DIA ','DAY ')+day+' · '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0')}
function newsStory(n){if(n.k==='net')return netNewsStory(n);const nm=n.w===1?'Claire':'Nathan',fem=n.w===1,bairro=n.d||newsTL('a cidade','town'),em=newsTL('em '+bairro,'in '+bairro),UB=bairro.toUpperCase(),veh=n.veh||newsTL('veículo','vehicle');
 if(n.k==='busted')return[newsTL((fem?'PRESA':'PRESO')+' NO '+UB,'ARREST IN '+UB),newsTL('A polícia de Sunset Shores deteve '+nm+' '+em+' depois de uma perseguição de '+n.lv+' estrela'+(n.lv>1?'s':'')+'. '+(fem?'Ela':'Ele')+' não quis dar entrevista.','Sunset Shores police arrested '+nm+' '+em+' after a '+n.lv+'-star chase. No comment was given.')];
 if(n.k==='maskboom')return[newsTL('MASCARADO RI DE EXPLOSÃO','MASKED MAN LAUGHS OFF BLAST'),newsTL('Testemunhas juram que um homem de cara verde e terno amarelo saiu gargalhando de um '+veh+' em chamas '+em+'. A polícia não comenta.','Witnesses swear a green-faced man in a yellow suit walked out laughing from a burning '+veh+' '+em+'. Police declined to comment.')];
 const c=n.c||'';
 const M={EXPLODIDO:[veh.toUpperCase()+' EXPLODE '+newsTL('NO ','IN ')+UB,newsTL(nm+' estava ao volante de um '+veh+' que pegou fogo e explodiu '+em+'. Sobrou pouca coisa do carro.',nm+' was behind the wheel of a '+veh+' that caught fire and exploded '+em+'. Little was left of the car.')],
  ATROPELADO:[newsTL('ATROPELAMENTO '+'NO '+UB,'HIT-AND-RUN IN '+UB),newsTL(nm+' foi '+(fem?'atropelada':'atropelado')+' '+em+'. O motorista fugiu sem prestar socorro.',nm+' was run over '+em+'. The driver fled the scene.')],
  AFOGADO:[newsTL('AFOGAMENTO '+'NO '+UB,'DROWNING IN '+UB),newsTL(nm+' se afogou '+em+'. Salva-vidas pedem cuidado com a correnteza.',nm+' drowned '+em+'. Lifeguards warn about the currents.')],
  QUEDA:[newsTL('QUEDA '+'NO '+UB,'FATAL FALL IN '+UB),newsTL(nm+' despencou de grande altura '+em+'. Ninguém sabe o que '+(fem?'ela':'ele')+' fazia lá em cima.',nm+' fell from a great height '+em+'. Nobody knows what '+(fem?'she':'he')+' was doing up there.')],
  ABATIDO:[newsTL('TIROTEIO NO '+UB,'SHOOTOUT IN '+UB),newsTL(nm+' foi '+(fem?'baleada':'baleado')+' '+em+' depois de um tiroteio.',nm+' was shot '+em+' after a gunfight.')],
  GANGUE:[newsTL('GANGUE ATACA NO '+UB,'GANG ATTACK IN '+UB),newsTL(nm+' entrou no território errado '+em+' e saiu de maca.',nm+' walked into the wrong turf '+em+' and left on a stretcher.')],
  BANCO:[newsTL('ASSALTO A BANCO TERMINA MAL','BANK HEIST GOES WRONG'),newsTL(nm+' foi '+(fem?'baleada':'baleado')+' durante um assalto ao banco '+em+'.',nm+' was shot during a bank robbery '+em+'.')],
  BICHO:[newsTL('ATAQUE ESTRANHO NO '+UB,'STRANGE ATTACK IN '+UB),newsTL(nm+' foi '+(fem?'atacada':'atacado')+' por uma criatura '+em+'. Moradores falam em monstro.',nm+' was attacked by a creature '+em+'. Locals speak of a monster.')]};
 const key=c==='EXPLODIDO'?'EXPLODIDO':c==='ATROPELADO'?'ATROPELADO':c==='AFOGADO'?'AFOGADO':/QUEDA/.test(c)?'QUEDA':/BANCO/.test(c)?'BANCO':/GANGUE/.test(c)?'GANGUE':/ABATIDO/.test(c)?'ABATIDO':/DEMOGORGON|DEVORADO|MORDIDO|ASSOMBRADO/.test(c)?'BICHO':'';
 return M[key]||[newsTL('MORTE NO '+UB,'DEATH IN '+UB),newsTL(nm+' foi '+(fem?'encontrada':'encontrado')+' desacordad'+(fem?'a':'o')+' '+em+'. A polícia investiga.',nm+' was found unconscious '+em+'. Police are investigating.')]}
const NEWS_FILLER=[['PREFEITURA PROMETE TAPAR BURACOS','CITY HALL VOWS TO FIX POTHOLES','Pela décima vez este ano.','For the tenth time this year.'],['VERÃO BATE RECORDE DE CALOR','SUMMER BREAKS HEAT RECORD','Vendas de protetor FPS 50 disparam na orla.','SPF 50 sales soar on the boardwalk.'],['TIGRÃO DA SORTE PAGA… ÀS VEZES','LUCKY TIGER PAYS… SOMETIMES','Cassino nega que o tigre seja viciado.','Casino denies the tiger is rigged.']];
function newsBuy(){if((PL.money||0)<1){toast('DINHEIRO INSUFICIENTE · $1');clang(.1);return}money(-1);newsOpen()}
function newsOpen(){NEWS.open=true;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();
 const it=NEWS.items.slice(-5).reverse(),esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));let h='';
 it.forEach((n,i)=>{const[H,S2]=newsStory(n);h+='<div class="'+(i?'sm':'')+'"><h3>'+esc(H)+'</h3><div class="s"><b>'+esc(newsWhen(n.t))+'</b> — '+esc(S2)+'</div></div>'});
 if(it.length<3)for(const f of NEWS_FILLER.slice(0,3-it.length))h+='<div class="sm"><h3>'+esc(newsTL(f[0],f[1]))+'</h3><div class="s">'+esc(newsTL(f[2],f[3]))+'</div></div>';
 const el=$('#news');el.querySelector('.np').innerHTML='<div class="mh">'+newsTL('GAZETA DE SUNSET SHORES','SUNSET SHORES GAZETTE')+'</div><div class="ed"><span>'+esc(newsWhen(Math.round(gameMin())))+'</span><span>$1</span></div>'+h+'<div class="ft">'+newsTL('E / ESC / clique para fechar','E / ESC / click to close')+'</div>';
 el.hidden=false;el.onclick=()=>newsClose();try{clang(.15)}catch(e){}}
function newsClose(){if(!NEWS.open)return;NEWS.open=false;$('#news').hidden=true}
function bedNear(){const b=SAFE.bedRect;return PL.inside===true&&!!b&&!PL.dead&&PL.x>b.x0&&PL.x<b.x1&&PL.z>b.z0&&PL.z<b.z1}
function bedSave(){if(SAVE.bedT&&performance.now()-SAVE.bedT<2500)return;SAVE.bedT=performance.now();fadeFlash();PL.hp=Math.max(PL.hp,100);toast('VOCÊ DESCANSOU');if(saveBlocked())return; /* v78: deitar sempre recupera 100% de vida, mesmo sem poder/querer salvar */setTimeout(()=>saveToFile(true),350)}
// ---------- EVENTOS PELO MAPA: RAMPAGE (caveira), CORRIDA (bandeira) e ARRANCADA (carro com fumaça) ----------
const SIDE={key:'',spots:[],msgT:0};
function sideAvail(q){if(!storyOK(q.k==='skull'?'rampage':q.k))return false;if(q.k==='drag'||q.k==='race'){const h=(DN.tod/60)%24;if(h>=8&&h<22)return false}return gameMin()>=(q.cd||0)&&!city.haze&&S.style!=='inverted'}
function sideSkull3D(){const g=new THREE.Group(),w=new THREE.MeshLambertMaterial({color:0xf2efe4,emissive:0x77756c}),k=new THREE.MeshBasicMaterial({color:0x111111});
 const head=new THREE.Mesh(new THREE.SphereGeometry(.3,14,10),w);head.scale.set(1,.95,1.05);head.position.y=.12;const jaw=new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.26),w);jaw.position.set(0,-.12,.06);
 const e1=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),k),e2=e1.clone();e1.position.set(-.11,.1,.26);e2.position.set(.11,.1,.26);const ns=new THREE.Mesh(new THREE.BoxGeometry(.05,.07,.03),k);ns.position.set(0,-.01,.3);
 g.add(head,jaw,e1,e2,ns);for(let i=-1;i<=1;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(.015,.1,.02),k);t.position.set(i*.07,-.12,.195);g.add(t)}scene.add(g);g.userData.d3=true;return g}
function sideFlag3D(){const g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.1,8),new THREE.MeshLambertMaterial({color:0xdadada,emissive:0x444444}));pole.position.y=-.1;
 const c=cv(32,24),x=c.getContext('2d');for(let i=0;i<4;i++)for(let j=0;j<3;j++){x.fillStyle=(i+j)%2?'#111':'#fff';x.fillRect(i*8,j*8,8,8)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;
 const f=new THREE.Mesh(new THREE.PlaneGeometry(.56,.42),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));f.position.set(.3,.24,0);g.add(pole,f);scene.add(g);g.userData.d3=true;return g}
function sideCar3D(){const g=new THREE.Group(),o=new THREE.MeshLambertMaterial({color:0xff7a1a,emissive:0x5a2a08}),k=new THREE.MeshBasicMaterial({color:0x111111}),sm=new THREE.MeshLambertMaterial({color:0xaab0ba,emissive:0x555a60,transparent:true,opacity:.85});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.7,.16,.34),o),cab=new THREE.Mesh(new THREE.BoxGeometry(.34,.14,.3),o);cab.position.set(-.04,.15,0);g.add(body,cab);
 for(const[x,z] of[[.22,.18],[-.22,.18],[.22,-.18],[-.22,-.18]]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.06,10),k);w.rotation.x=Math.PI/2;w.position.set(x,-.08,z);g.add(w)}
 for(const[x,y,r] of[[-.48,-.02,.1],[-.66,.06,.13],[-.86,.14,.16]]){const p=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),sm);p.position.set(x,y,0);g.add(p)}scene.add(g);g.userData.d3=true;return g}
function sideIcon(k){if(k==='skull')return sideSkull3D();if(k==='race')return sideFlag3D();if(k==='drag')return sideCar3D();const c=cv(64,64),g=c.getContext('2d');drawMapIcon(g,k,32,32,30);const t=new THREE.CanvasTexture(c);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));sp.scale.set(2.6,2.6,1);sp.renderOrder=5;scene.add(sp);return sp}
function sideInit(){for(const q of SIDE.spots)if(q.sp){scene.remove(q.sp);if(q.sp.userData.d3)disposeGroup(q.sp);else{q.sp.material.map.dispose();q.sp.material.dispose()}}SIDE.spots=[];SIDE.key=S.seed+':'+S.style;if(!city.ext||city.haze||S.style==='inverted')return;
 const R=mulberry32((S.seed^0x5ca1ab1e)>>>0),E=city.ext,N=city.N,far=(x,z,d)=>SIDE.spots.every(q=>Math.hypot(q.x-x,q.z-z)>d)&&!(city.safe&&Math.hypot(city.safe.x-x,city.safe.z-z)<90);
 const W=['pistol','smg','magnum','rpg'];for(let k=0,n=0;k<200&&n<4;k++){const r=perim(rectNear(R()*E,R()*E)),p=perimPoint(r,R()*400);if(!p||inWater(p[0],p[1])||!far(p[0],p[1],220))continue;SIDE.spots.push({k:'skull',x:p[0],z:p[1],w:W[n],cd:0});n++}
 const straight=(kx,kz,d,n)=>{const L=lineType(kx,kz,d);if(L.t!=='ave')return false;let x=kx,z=kz;for(let i=0;i<n;i++){if(!segExists(x,z,d)||city.riv&&city.riv.size&&(waterAt(x*P+D[d][0]*P/2,z*P+D[d][1]*P/2)))return false;x+=D[d][0];z+=D[d][1]}return true};
 for(const[kind,cnt,len] of [['drag',2,4],['race',3,2]])for(let k=0,n=0;k<400&&n<cnt;k++){const kx=Math.floor(R()*(N+1)),kz=Math.floor(R()*(N+1)),d=Math.floor(R()*4);if(!straight(kx,kz,d,len))continue;const p=lanePt(kx,kz,d,0,22);if(!far(p[0],p[1],260))continue;SIDE.spots.push({k:kind,x:p[0],z:p[1],kx,kz,d,cd:0});n++}
 for(const q of SIDE.spots)q.sp=sideIcon(q.k)}
function sideMsg(t){if(simT-SIDE.msgT<4)return;SIDE.msgT=simT;toast(t)}
function sideHud(t){const el=$('#evhud');if(!t){if(!el.hidden)el.hidden=true;return}if(el.innerHTML!==t)el.innerHTML=t;el.hidden=false}
function sideTick(dt){if(!played)return;if(SIDE.key!==S.seed+':'+S.style)sideInit();const pc=PL.car||PL,tt=simT;
 for(const q of SIDE.spots){if(!q.sp)continue;const on=sideAvail(q)&&!RAMP.on&&!RACE.on&&!PL.inside&&Math.hypot(pc.x-q.x,pc.z-q.z)<260;q.sp.visible=on;if(on){const d3=q.sp.userData.d3;q.sp.position.set(q.x,groundY(q.x,q.z)+(d3?1.0:2.6)+Math.sin(tt*2.4+q.x)*(d3?.12:.25),q.z);if(d3)q.sp.rotation.y=tt*1.6}}
 if(RAMP.on)rampageTick(dt);else if(RACE.on)raceTick(dt);
 else if(!PL.dead&&!PL.inside&&!POL.wanted&&!MIS.type&&QUEST.pier.state!=='ride'&&!PL.heli&&!DEAL.open){for(const q of SIDE.spots){if(!sideAvail(q))continue;const d=Math.hypot(pc.x-q.x,pc.z-q.z);
   if(q.k==='skull'&&!PL.car&&d<1.6){rampStart(q);break}
   if(q.k!=='skull'&&PL.car&&d<7){const c=PL.car;if(c.t.boat||c.type==='bus'||c.type==='truck'){sideMsg('ESSE VEÍCULO NÃO PODE CORRER');continue}if(q.k==='drag'&&!(c.hasNitro||c.special)){sideMsg('ARRANCADA SÓ COM NITRO<br><small style="font-size:11px;color:#fff">instale na oficina</small>');continue}if(Math.abs(c.fwd)>4){sideMsg((q.k==='drag'?'ARRANCADA':'CORRIDA')+' · PARE NO MARCADOR PARA COMEÇAR');continue}raceStart(q,c);break}}}
 if(!RAMP.on&&!RACE.on)sideHud(null)}
// RAMPAGE: demogorgons sem fim (3x a vida de um pedestre); arma do ponto com munição infinita; 90 s
const RAMP={on:false,t:0,kills:0,list:[],spawnT:0,saved:null,spot:null};
const DEMO_PAL={cap:null,capDark:null,skin:'#7a2a2a',hair:'#3a0a0a',shirt:'#4a1010',pants:'#2a0606',shoes:'#1a0404',belt:'#1a0404',stripe:'#a02020',glasses:null,necklace:null,long:true,pack:false,demo:true}; /* v2 r1: rosto de Demogorgon (demo:true: olhos vermelhos, veias, sem botões) no lugar dos óculos vermelhos; o mesmo no lab, Rampage, floresta e Upside Down */
function rampStart(q){if(GUN.has&&GUN.inv[GUN.w])GUN.inv[GUN.w].ammo=GUN.ammo;RAMP.saved={inv:JSON.parse(JSON.stringify(GUN.inv||{})),w:GUN.w,has:GUN.has};RAMP.on=true;RAMP.t=90;RAMP.kills=0;RAMP.list=[];RAMP.spawnT=0;RAMP.spot=q;RAMP.w=q.w;
 GUN.inv[q.w]={ammo:999};gunSelect(q.w,true);clang(.4);toast('<span style="color:#ff3b3b">RAMPAGE!</span><br><small style="font-size:11px;color:#fff">'+WPN[q.w].name+' com munição infinita · abata o máximo de demogorgons em 90 s e sobreviva</small>')}
function rampSpawn(){const pc=PL;for(let k=0;k<12;k++){const a=Math.random()*6.283,d=22+Math.random()*20,x=pc.x+Math.cos(a)*d,z=pc.z+Math.sin(a)*d;if(inWater(x,z)||bldAt(x,z,.6))continue;
  const q=spawnPed(null,{x,z,vx:0,vz:0,pal:{...DEMO_PAL}});if(!q)return;q.state='clerk';q.fixed=true;q.at={x,z};q.mx=0;q.mz=1;q.timer=0;q.demo=true;q.hp=9;q.hitT=0;RAMP.list.push(q);return}}
function rampEnd(ok){RAMP.on=false;for(const q of RAMP.list)if(peds.includes(q))removePed(q);RAMP.list=[];const S0=RAMP.saved;if(S0){GUN.inv=S0.inv;GUN.w=S0.w;GUN.has=false;GUN.ammo=0;GUN.firing=false;if(S0.has&&GUN.inv[S0.w])gunSelect(S0.w,true)}RAMP.saved=null;
 if(RAMP.spot)RAMP.spot.cd=gameMin()+120;sideHud(null);
 if(ok){const pay=CHEAT.used?0:RAMP.kills*10+100;if(pay)money(pay,'RAMPAGE CONCLUÍDA · '+RAMP.kills+' ABATES · +$'+pay);else toast('RAMPAGE CONCLUÍDA · '+RAMP.kills+' ABATES')}else toast('<span style="color:#ff3b3b">RAMPAGE FRACASSADA</span><br><small style="font-size:11px;color:#fff">'+RAMP.kills+' abates</small>')}
function rampageTick(dt){if(PL.dead){rampEnd(false);return}if(PL.car||PL.inside){rampEnd(false);return}RAMP.t-=dt;if(GUN.w===RAMP.w){GUN.ammo=999;GUN.has=true}
 RAMP.spawnT-=dt;const alive=RAMP.list.filter(q=>peds.includes(q)&&q.state!=='dead');if(RAMP.spawnT<=0&&alive.length<Math.min(14,6+Math.floor((90-RAMP.t)/10))){RAMP.spawnT=.5;rampSpawn()}
 for(const q of RAMP.list.slice()){if(!peds.includes(q)){RAMP.list.splice(RAMP.list.indexOf(q),1);continue}if(q.state==='dead'||q.hp<=0){if(!q.counted){q.counted=true;RAMP.kills++;q.deadAt=simT}if(simT-(q.deadAt||simT)>3){removePed(q);RAMP.list.splice(RAMP.list.indexOf(q),1)}continue}
  if(hostileHold(q))continue;const dx=PL.x-q.x,dz=PL.z-q.z,d=Math.hypot(dx,dz)||1;q.mx=dx;q.mz=dz;
  if(d>1.2){const v=Math.min(d-1.1,3.8*dt);q.at.x+=dx/d*v;q.at.z+=dz/d*v}else{q.hitT-=dt;if(q.hitT<=0){q.hitT=1;if(!CHEAT.hp){PL.hp-=armorHit(9);rumble(.3,.6,120);bloodHit(PL.x,1.1,PL.z,new THREE.Vector3(dx,0,dz).normalize());if(PL.hp<=0){killPlayer('DEVORADO');return}}}}}
 sideHud('<span style="color:#ff3b3b">RAMPAGE</span> · '+Math.max(0,Math.ceil(RAMP.t))+' s · '+RAMP.kills+' ABATES');if(RAMP.t<=0)rampEnd(true)}
// v264: guardiao da floresta. Mesmo personagem DEMO_PAL do Rampage (9 HP,
// 3x o pedestre comum), SEM alterar o sistema de sprites / materiais da v258.
// Spawn apenas quando o jogador se aproxima, uma criatura por cidade.
const FOREST={enemy:null};
function forestTick(dt){
 const site=city.forest,p=PL.car||PL;
 if(!worldOn('forest'))return;
 if(!played||!site||city.haze||S.style==='inverted'||!p)return;
 const id=site.enemyId,dist=Math.hypot(p.x-site.x,p.z-site.z),q=FOREST.enemy;
 if(q&&(!peds.includes(q)||q.state==='dead'||q.hp<=0)){
  if(q.state==='dead'||q.hp<=0){city.picked.add(id);if(!q.forestCounted){q.forestCounted=true;toast('DEMOGORGON DERROTADO')}}
  FOREST.enemy=null;
 }
 if(city.picked.has(id))return;
 if(FOREST.enemy&&dist>125){if(peds.includes(FOREST.enemy))removePed(FOREST.enemy);FOREST.enemy=null;return}
 if(!FOREST.enemy&&dist<77&&!PL.inside&&!PL.dead){
  const x=site.x+4,z=site.z+5;
  const e=spawnPed(null,{x,z,vx:0,vz:0,pal:{...DEMO_PAL}});
  e.state='clerk';e.fixed=true;e.at={x,z};e.mx=0;e.mz=1;e.timer=0;
  e.demo=true;e.forestEnemy=true;e.hp=9;e.hitT=0;FOREST.enemy=e;
 }
 const e=FOREST.enemy;
 if(!e||!peds.includes(e)||e.state==='dead'||PL.dead||PL.inside||hostileHold(e))return;
 const dx=PL.x-e.x,dz=PL.z-e.z,d=Math.hypot(dx,dz)||1;
 e.mx=dx/d;e.mz=dz/d;
 if(!PL.car&&d<35){
  if(d>1.5){const v=Math.min(Math.max(0,d-1.5),3.5*dt),x=e.at.x+dx/d*v,z=e.at.z+dz/d*v;
   // Nao atravessar cercas e paredes (arvores decorativas nao criam colisor).
   if(!bldAt(x,z,.6)&&!inWater(x,z)){e.at.x=x;e.at.z=z}}
  else {e.hitT-=dt;if(e.hitT<=0){e.hitT=1.2;if(!CHEAT.hp){PL.hp-=armorHit(12);rumble(.35,.5,120);if(PL.hp<=0)killPlayer('DEMOGORGON DA FLORESTA')}}}
 }
}
// CORRIDA (checkpoints, 2 rivais) e ARRANCADA (reta, 1 rival, exige nitro)
const RACE={on:false};
function raceCar(x,z,a,nitro){const v=makeVehicle('sports',x,z,a,pick2(['#d62828','#2a6ad6','#f2c21a','#1f9e4a','#f4f4f0','#151518']));v.racer=true;v.sleep=false;v.hand=true;v.hasNitro=!!nitro;v.path=null;v.pathT=0;v.stuckT=0;v.revT=0;v.ri=0;v.done=false;return v}
function raceStart(q,c){const a=Math.atan2(D[q.d][1],D[q.d][0]),drag=q.k==='drag',p0=lanePt(q.kx,q.kz,q.d,0,14);
 if(c.mode==='rail')toPhys(c);c.x=p0[0];c.z=p0[1];c.a=a;c.vx=c.vz=c.w=0;c.fwd=0;PL.x=c.x;PL.z=c.z;camT.x=c.x;camT.z=c.z;
 const cps=[];if(drag){cps.push([(q.kx+D[q.d][0]*4)*P,(q.kz+D[q.d][1]*4)*P])}
 else{let x=q.kx,z=q.kz,d=q.d;const N=city.N;for(let i=0;i<7;i++){const st=2+Math.floor(Math.random()*2);for(let s2=0;s2<st;s2++){const opts=[d,(d+1)%4,(d+3)%4].filter(dd=>segExists(x,z,dd));if(!opts.length)break;d=Math.random()<.6&&opts.includes(d)?d:opts[Math.floor(Math.random()*opts.length)];x+=D[d][0];z+=D[d][1]}cps.push([x*P,z*P])}}
 for(const v of carsNear(c.x,c.z,30))if(v!==c&&!v.police&&v.ai&&!v.racer)removeVehicle(v);
 const riv=[];const p1=lanePt(q.kx,q.kz,q.d,1,14);riv.push(raceCar(p1[0],p1[1],a,drag));if(!drag){const p2=lanePt(q.kx,q.kz,q.d,1,4);riv.push(raceCar(p2[0],p2[1],a,false))}
 Object.assign(RACE,{on:true,kind:q.k,spot:q,car:c,cps,i:0,riv,count:3.6,t:0,fin:[],away:0,end:0,sx:p0[0],sz:p0[1],ux:D[q.d][0],uz:D[q.d][1],L:Math.hypot(cps[0][0]-p0[0],cps[0][1]-p0[1])});
 misGPS(cps[0][0],cps[0][1]);toast((drag?'ARRANCADA':'CORRIDA DE RUA')+'<br><small style="font-size:11px;color:#fff">'+(drag?'reta de '+Math.round(RACE.L)+' m · SHIFT = nitro':cps.length+' checkpoints · siga o GPS')+'</small>')}
function raceClear(){for(const v of RACE.riv||[])if(vehicles.includes(v)&&v!==PL.car)removeVehicle(v);RACE.riv=[];if(NAV.misMarker){NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;NAV.misMarker=false}if(RACE.spot)RACE.spot.cd=gameMin()+90;RACE.on=false;sideHud(null)}
function raceTick(dt){const R0=RACE,c=R0.car,drag=R0.kind==='drag';
 if(R0.end>0){R0.end-=dt;if(R0.end<=0)raceClear();return}
 if(!c||!vehicles.includes(c)||!c.alive||PL.dead){toast('CORRIDA ENCERRADA');raceClear();return}
 if(PL.car!==c){R0.away+=dt;tbarShow('race','VOLTE PARA O CARRO',1-R0.away/5);if(R0.away>5){toast('VOCÊ ABANDONOU A CORRIDA');raceClear();return}}else R0.away=0;
 if(R0.count>0){const k0=Math.ceil(R0.count);R0.count-=dt;for(const v of R0.riv){v.thr=0;v.hand=true;v.vx=v.vz=0}const k1=Math.ceil(R0.count);if(k1!==k0)toast(k1>0?String(k1):'<span style="color:#5aff6a">VAI!</span>');if(k1!==k0)clang(.2);sideHud((drag?'ARRANCADA':'CORRIDA')+' · '+Math.max(1,k1));return}
 R0.t+=dt;if(R0.t>300){toast('TEMPO ESGOTADO');raceClear();return}
 const prog=v=>drag?((v.x-R0.sx)*R0.ux+(v.z-R0.sz)*R0.uz):((v===c?R0.i:v.ri)*1000-Math.hypot(v.x-R0.cps[Math.min(R0.cps.length-1,v===c?R0.i:v.ri)][0],v.z-R0.cps[Math.min(R0.cps.length-1,v===c?R0.i:v.ri)][1]));
 for(const v of R0.riv){if(!vehicles.includes(v)||!v.alive||v.done){if(v.done){v.thr=0;v.hand=true}continue}v.sleep=false;
  if(drag){const tx=R0.cps[0][0],tz=R0.cps[0][1],ca=Math.cos(v.a),sa=Math.sin(v.a),ex=tx-v.x,ez=tz-v.z,ang=Math.atan2(-ex*sa+ez*ca,ex*ca+ez*sa);v.steerT=clamp(ang/(v.t.steer*.75),-1,1);v.thr=.93;v.hand=false;v.nitro=R0.t>.6&&R0.t<6;if(prog(v)>=R0.L){v.done=true;R0.fin.push(v)}}
  else{const cp=R0.cps[v.ri];taxiDrive(v,dt,cp[0],cp[1],0,30);if(Math.hypot(v.x-cp[0],v.z-cp[1])<16){v.ri++;if(v.ri>=R0.cps.length){v.done=true;R0.fin.push(v)}}}}
 let done=false;if(drag){if(prog(c)>=R0.L)done=true}else{const cp=R0.cps[R0.i];if(Math.hypot(c.x-cp[0],c.z-cp[1])<15){R0.i++;clang(.15);if(R0.i>=R0.cps.length)done=true;else misGPS(R0.cps[R0.i][0],R0.cps[R0.i][1])}}
 const pos=1+R0.riv.filter(v=>v.done||prog(v)>prog(c)).length,tm=Math.floor(R0.t/60)+':'+String(Math.floor(R0.t%60)).padStart(2,'0');
 sideHud((drag?'ARRANCADA · '+Math.max(0,Math.round(R0.L-prog(c)))+' m':'CORRIDA · CHECKPOINT '+Math.min(R0.i+1,R0.cps.length)+'/'+R0.cps.length)+' · '+tm+' · '+pos+'º');
 if(done){const place=1+R0.fin.length,prize=CHEAT.used?0:drag?(place===1?300:0):[400,150,50][place-1]||0;if(prize)money(prize,(drag?'ARRANCADA':'CORRIDA')+' · '+place+'º LUGAR · +$'+prize);else toast((drag?'ARRANCADA':'CORRIDA')+' · '+place+'º LUGAR'+(drag?' · perdeu':''));R0.end=4;for(const v of R0.riv)v.done=true}}

/* ---------- v4 r45 · AVIÕES DO AEROPORTO EXPLODEM ----------
   Qualquer avião do aeroporto (os jatos parados no pátio e o que taxia/decola/pousa) leva dano de tiro/foguete (alvo no sistema de
   aeronaves, `aircraftTargets`) e de explosão no chão por perto (embrulho do `blastAt`). Destruído: fica todo preto (`burntMat`
   compartilhado, sem compilar nada), 3 explosões seguidas (força de veículo = `blastAt`), fogo e fumaça. Taxiando/parado: para onde
   está. No ar: perde sustentação, mantém o rumo, mergulha e explode no chão. Volta em 2 min de jogo (tempo real jogado): carcaça some e
   o avião volta ao ciclo (pátio/decolagem/pouso). Explodir avião = 3 estrelas (fora do online). Só no aeroporto (o Invertido e a Point
   Haze não têm). Os jatos parados eram parte do lote do chunk (js/11); agora são malhas próprias fora do city.group (removidas na troca). */
const AIRP_HP=150,AIRP_RESPAWN=120,AIRPX=[];AIRP.jets=[];
function airpJetsInit(A){for(const j of AIRP.jets){scene.remove(j.g);disposeGroup(j.g)}AIRP.jets=[];
 for(const k in (A.jets||{})){const d=A.jets[k],g=new THREE.Group(),mb=jetBodyMB(new MB(),COL(d.col));g.add(mb.mesh(carBodyMat,true,false));
  g.position.set(d.x,1.44,d.z);g.rotation.set(0,d.ry,0);g.scale.setScalar(.5);g.visible=false;scene.add(g);AIRP.jets.push({g,x:d.x,z:d.z,hp:AIRP_HP,dead:false,t:0})}}
function airpJetsTick(A,near,dt){for(const j of AIRP.jets){j.g.visible=near;if(!j.dead)continue;j.t+=dt;airpBurnFx(j.g,j.t,near,dt);
  if(j.t>=AIRP_RESPAWN){j.dead=false;j.hp=AIRP_HP;airpPaint(j.g,false)}}}
function airpPaint(g,burnt){g.traverse(o=>{if(!o.isMesh)return;if(burnt){if(o.userData.airpMat===undefined){o.userData.airpMat=o.material;o.userData.airpVis=o.visible}
  if(o.material&&o.material.blending===THREE.AdditiveBlending)o.visible=false;else o.material=burntMat}
 else if(o.userData.airpMat!==undefined){o.material=o.userData.airpMat;o.visible=o.userData.airpVis;delete o.userData.airpMat;delete o.userData.airpVis}})}
const AIRP_V=new THREE.Vector3();
function airpBoomQueue(g,byP){/* 3 explosões seguidas: frente, meio, trás (eixo local x do jato), ~0,4 s entre elas */
 for(let i=0;i<3;i++){AIRP_V.set((1-i)*8,0,0);g.localToWorld(AIRP_V);AIRPX.push({t:.05+i*.42,x:AIRP_V.x,z:AIRP_V.z,byP})}}
function airpBurnFx(g,t,near,dt){if(!near||t>60)return;const p=g.position,k=t<25?1:.4;
 if(Math.random()<dt*9*k)emit(p.x+(Math.random()-.5)*6,p.y+1,p.z+(Math.random()-.5)*6,0,1.5+Math.random()*1.5,0,.7,1.2,.25,Math.random()<.5?0xff5a14:0xffa02a,true,.85);
 if(Math.random()<dt*5)emit(p.x,p.y+2.5,p.z,(Math.random()-.5),2.2,(Math.random()-.5),3.2,1.8,7,0x1e1a1c,false,.55)}
function airpWanted(byP){if(byP&&!ONLINE.on){if(!POL.wanted)startWanted(true);if(POL.wanted)wantedUp(3)}}
function airpKillJet(j,byP){if(j.dead)return;j.dead=true;j.t=0;airpPaint(j.g,true);airpBoomQueue(j.g,byP);airpWanted(byP)}
function airpKillPlane(byP){const P=AIRP,G=P.p;if(!G||P.dead||P.st==='wait'||!G.g.visible)return;airSoundReset();airpPaint(G.g,true);if(G.bl)G.bl.visible=false;
 const air=P.y>AIRY+1.5||['climb','turnOut','out','down','base','final','flyby'].includes(P.st);
 P.deadT=0;P.byP=byP;airpWanted(byP);
 if(air){P.dead='fall';P.vy=Math.min(P.vy||0,0);P.v=Math.max(P.v||30,30);airBurst(G.g.position.x,G.g.position.y,G.g.position.z)}
 else{P.dead='stop';airpBoomQueue(G.g,byP)}}
function airpWreckCol(on){const P=AIRP;if(P.col){for(const k of P.col.keys){const l=grid.get(k);if(l){const i=l.indexOf(P.col);if(i>=0)l.splice(i,1)}}const i=colliders.indexOf(P.col);if(i>=0)colliders.splice(i,1);P.col=null}
 if(on&&P.p){const p=P.p.g.position,cc=curChunk;curChunk=null;try{P.col=addCol(p.x-4,p.z-4,p.x+4,p.z+4,'rock')}finally{curChunk=cc}}}
function airpDeadTick(P,G,A,dt,near){
 for(let i=AIRPX.length-1;i>=0;i--){const e=AIRPX[i];e.t-=dt;if(e.t<=0){AIRPX.splice(i,1);AIRP.inBoom=true;try{blastAt(e.x,e.z,null,e.byP)}finally{AIRP.inBoom=false}}}
 if(!P.dead||!G)return false;P.deadT+=dt;const g=G.g;
 if(P.dead==='fall'){P.vy=Math.max(-32,P.vy-9.8*dt);P.v*=Math.exp(-dt*.15);
  if(A.compact&&P.st==='flyby'){P.s+=P.v*dt}else{P.s+=Math.cos(P.th)*P.v*dt;P.l+=Math.sin(P.th)*P.v*dt}
  P.y+=P.vy*dt;P.pitch+=(-.45-P.pitch)*Math.min(1,dt*1.2);P.roll+=dt*.35;
  const c=airPt(P.s,P.l),gy=groundY(c[0],c[1]);
  if(P.y<=gy+AIRY){P.y=gy+AIRY*.7;P.dead='wreck';P.pitch=-.06;P.roll=.18;g.position.set(c[0],P.y,c[1]);g.rotation.order='YZX';g.rotation.set(P.roll,g.rotation.y,P.pitch);airpBoomQueue(g,P.byP);airpWreckCol(true)}
  else if(Math.random()<dt*14)emit(g.position.x,g.position.y,g.position.z,(Math.random()-.5)*2,1,(Math.random()-.5)*2,1.6,1.2,4,0x2a2426,false,.6);
  if(P.dead==='fall'){const hw=A.ax?P.th:Math.PI/2-P.th;g.position.set(c[0],P.y,c[1]);g.rotation.order='YZX';g.rotation.set(P.roll,A.compact?(A.ax?0:-Math.PI/2):-hw,P.pitch)}
  g.visible=true}
 else{if(P.dead==='stop'){P.v=0;P.vy=0}airpBurnFx(g,P.deadT,near,dt);g.visible=near||P.y>8}
 if(P.deadT>=AIRP_RESPAWN){airpWreckCol(false);airpPaint(g,false);P.dead=null;P.hp=null;P.st='wait';P.t=4;P.next=Math.random()<.5?'to':'land';P.y=AIRY;P.vy=0;P.v=0;P.roll=0;P.pitch=0;g.visible=false}
 return true}
/* alvo de tiro/foguete: esfera no meio de cada avião do aeroporto */
{const f0=aircraftTargets;aircraftTargets=function(){const T=f0.apply(this,arguments);if(!city.air||S.style==='inverted'||city.haze)return T;
  const G=AIRP.p;if(G&&!AIRP.dead&&G.g.visible&&AIRP.st!=='wait'){const p=G.g.position;T.push({type:'airp',owner:AIRP,x:p.x,y:p.y+.8,z:p.z,r:4.5})}
  for(const j of AIRP.jets)if(!j.dead&&j.g.visible)T.push({type:'airp',owner:j,x:j.x,y:2.3,z:j.z,r:4.5});return T}}
{const f0=aircraftDamage;aircraftDamage=function(a,dmg,pt){if(!a||a.type!=='airp')return f0.apply(this,arguments);const o=a.owner;
  if(o===AIRP){if(AIRP.dead)return;AIRP.hp=(AIRP.hp??AIRP_HP)-dmg;if(AIRP.hp>0){for(let i=0;i<5;i++)emit(pt.x,pt.y,pt.z,(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2,.2,.25,.06,0xffd17c,true,1);return}airpKillPlane(true)}
  else{if(o.dead)return;o.hp-=dmg;if(o.hp>0){for(let i=0;i<5;i++)emit(pt.x,pt.y,pt.z,(Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2,.2,.25,.06,0xffd17c,true,1);return}airpKillJet(o,true)}}}
/* explosão no chão perto de um avião (granada, C4, carro explodindo, outro avião) derruba */
{const f0=blastAt;blastAt=function(cx,cz,c,byP){f0.apply(this,arguments);try{if(!city.air||S.style==='inverted'||city.haze)return;
  for(const j of AIRP.jets)if(!j.dead&&Math.hypot(j.x-cx,j.z-cz)<7)airpKillJet(j,!!byP);
  const G=AIRP.p;if(G&&!AIRP.dead&&G.g.visible&&AIRP.st!=='wait'){const p=G.g.position;if(p.y<groundY(p.x,p.z)+8&&Math.hypot(p.x-cx,p.z-cz)<7)airpKillPlane(!!byP)}}catch(e){console.error(e)}}}
