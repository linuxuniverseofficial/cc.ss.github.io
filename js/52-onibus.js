'use strict';
/* Coastal Chaos · js/52-onibus.js — Linha de ônibus circular + modo passageiro (ônibus e carona) (v4).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html.
   - Pontos: o buildChunk (js/11) registra cada abrigo em city.busStops; aqui cada um vira uma parada na faixa da rua em frente
     (segmento kx,kz,d + faixa li + posição s), escolhendo a faixa mais perto da guia que anda no sentido certo (laneValid).
   - Rota: ordem das paradas por vizinho mais próximo + 2-opt (gerador seed+dia), ligadas por BFS no grafo de nós com estado
     (nó, sentido de chegada) usando canDrive = sem contramão e sem a obra do dia (OBRA). Recalculada a cada dia de jogo (relógio
     próprio pelo avanço de DN.tod, como o atmClock) e quando a obra muda. Fecha em círculo.
   - Ônibus de linha (c.busLine): nascem 80–230 m do jogador num segmento com parada, seguem a rota (rail: r.nd + faixa na curva
     via startTurn; perto do jogador viram físicos e seguem com ai.nd/ai.li/ai.vmax), param 7 s em cada ponto. c.npcId protege do
     populate; somem a >300 m do jogador (a não ser com o jogador dentro). Máx. 3.
   - Passageiro: reaproveita o modo do táxi (PL.taxi = veículo: câmera, rádio, HUD, botão de sair do toque). G/E/→/toque perto da
     porta do ônibus parado ($3) ou de um carro do trânsito parado/devagar (carona: aceita/recusa/foge armado). G/F desce; em
     movimento = pular (dano). Carona: motorista leva a um ponto aleatório pelo GPS (taxiDrive), às vezes correndo; acima de 20 m/s
     chama luckAdd (frente da sorte) se existir.
   - Mapa: no ponto (≤5 m do abrigo) ou dentro do ônibus aparecem os ícones dos pontos e a rota em ciano com mini setas no sentido.
   Online: desligado (o online não tem trânsito). Invertido / Point Haze: sem trânsito nem pontos. */
const BUSL={stops:[],R:[],poly:[],arrows:[],day:-1,okey:'',t0:null,mins:0,lastTod:null,spT:0,list:[],at:null,loop:false};
const RIDE={c:null,kind:null,fp:false,dest:null,cap:15,t:0,h:'',an:null,refT:0};
const BUS_FARE=3,BUS_COL='#3fd8ff',BUS_DWELL=7;const busT=(pt,en)=>S.lang==='en'?en:pt; /* rótulos curtos: tradução local (LANG_RE trocaria 'DESCER' dentro de outras frases) */

/* ---------- v4 r41: menos pontos na cidade (os cortados viram "fantasmas") + pontos na roça ---------- */
const BUS_CITY_KEEP=.9,BUS_CITY_GAP=100,BUS_RURAL_GAP=150;
/* decidido no buildChunk (js/11) na hora de montar o abrigo: gerador próprio por quarteirão (não mexe no fr()/R()) + distância mínima */
function busCityKeep(ri,g){const h=mulberry32(((ri+7)*0x2c1b3c6d^(S.seed>>>0)^0x0b05c17e)>>>0)();if(h>BUS_CITY_KEEP)return false;
 for(const q of city.busStops||[])if(Math.hypot(q.x-g[0],q.z-g[1])<BUS_CITY_GAP)return false;return true}
/* lugar de um abrigo cortado: banca/banco (free do js/11), caixa (js/51) e metrô (js/53) continuam desviando dele como antes */
function busGhostHit(x0,z0,x1,z1,m){const G=city.busGhost;if(!G||!G.length)return false;for(const r of G)if(x1>r[0]-m&&x0<r[2]+m&&z1>r[1]-m&&z0<r[3]+m)return true;return false}
/* pontos da roça: abrigo rústico de madeira na beira da estrada de terra, 3–6 conforme o tamanho da roça (gerador próprio, depois do generateCity) */
const BUSR={list:[],mesh:null};
function busRuralClear(){if(BUSR.mesh){if(BUSR.mesh.parent)BUSR.mesh.parent.remove(BUSR.mesh);BUSR.mesh.geometry.dispose();BUSR.mesh=null}BUSR.list.length=0}
function busRuralPlace(){busRuralClear();if(!city.rects||!city.group||city.haze||S.style==='inverted'||ONLINE.on)return;
 const N=city.N,rng=mulberry32(((S.seed>>>0)^0x6b75a11e)>>>0),cand=[];
 for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)for(let d=0;d<2;d++){const r1=rng(),r2=rng(),r3=rng(); /* sempre 3 sorteios por segmento */
  if(!segExists(kx,kz,d))continue;const s=RW/2+14+r1*(SEG_END-RW/2-28),cx=kx*P+D[d][0]*s,cz=kz*P+D[d][1]*s;if(!isRural(cx,cz))continue;
  cand.push({kx,kz,d,s,cx,cz,side:r2<.5?1:-1,k:r3})}
 if(!cand.length)return;cand.sort((a,b)=>a.k-b.k);
 const want=Math.max(3,Math.min(6,Math.round(cand.length/30))),out=BUSR.list,rj=BUSR.rj={};const no=k=>{rj[k]=(rj[k]||0)+1};
 const HW=1.6,HD=.95; /* meia largura (ao longo da estrada) / meia profundidade do abrigo */
 for(const c of cand){if(out.length>=want)break;
  for(const sd of [c.side,-c.side]){const px=-D[c.d][1]*sd,pz=D[c.d][0]*sd; /* normal: do eixo para fora (lado sd) */
   const off=RW/2+1.35+HD,x=c.cx+px*off,z=c.cz+pz*off,gx=c.cx+px*RW/2,gz=c.cz+pz*RW/2;
   if(inWater(x,z)||inWater(gx,gz)){no('agua');continue}
   const gy=groundY(x,z);let flat=true;for(const a of [-1,1])for(const b of [-1,1]){const qx=x+(c.d?b*HD:a*HW),qz=z+(c.d?a*HW:b*HD);if(Math.abs(groundY(qx,qz)-gy)>.08){flat=false}}if(!flat){no('flat');continue}
   const hx=c.d?HD:HW,hz=c.d?HW:HD;let hit=false;for(const q of query(x,z,6)){if(q.dead)continue;if(q.x1>x-hx-.6&&q.x0<x+hx+.6&&q.z1>z-hz-.6&&q.z0<z+hz+.6){hit=true;break}}if(hit){no('col');continue}
   let near=false;for(const q of city.busStops||[])if(Math.hypot(q.x-gx,q.z-gz)<BUS_RURAL_GAP){near=true;break}if(near){no('perto');continue}
   const st={x,z,gy,hx,hz,nx:-px,nz:-pz,d:c.d,gx,gz};out.push(st);
   (city.busStops||(city.busStops=[])).push({x:gx,z:gz,cx:x,cz:z,nx:-px,nz:-pz,ri:-1,rural:true}); /* nx/nz aponta para a rua (como os da cidade) */
   break}}
 if(!out.length)return;busRuralBuild()}
function busRuralBuild(){const st=city.st||STYLES[S.style],syn=!!st.synth,mb=new MB();
 const wood=COL(syn?'#3a2a4a':'#7a5534'),dark=COL(syn?'#22182e':'#4a3320'),roof=COL(syn?'#5a2a6a':'#6d7378'),seat=COL(syn?'#4a3a5a':'#8a6440'),pole=COL('#9aa0a8'),plate=COL(syn?'#ff3ad0':'#2a6ab0'),white=COL('#f2f2f2');
 const k0=curChunk;
 try{for(const s of BUSR.list){const{x,z,gy,nx,nz}=s,ax=Math.abs(nz),az=Math.abs(nx); /* t = eixo ao longo da estrada; u = do fundo (u=-) para a rua (u=+) */
   const L=(t0,t1,u0,u1,y0,y1,col)=>{const ax0=x+(ax?t0:nx*u0),az0=z+(ax?nz*u0:t0),ax1=x+(ax?t1:nx*u1),az1=z+(ax?nz*u1:t1);mb.box(Math.min(ax0,ax1),gy+y0,Math.min(az0,az1),Math.max(ax0,ax1),gy+y1,Math.max(az0,az1),col)};
   for(const t of [-1.5,1.5]){L(t-.08,t+.08,-.85,-.69,0,2.35,wood);L(t-.08,t+.08,.69,.85,0,2.15,wood);L(t-.06,t+.06,-.69,.69,1.98,2.1,dark)}   /* 4 esteios + travessas laterais */   /* 4 esteios (fundo mais alto: telhado caído para a rua) */
   L(-1.78,1.78,-1.05,-.35,2.35,2.5,roof);L(-1.78,1.78,-.35,.35,2.25,2.4,roof);L(-1.78,1.78,.35,1.2,2.15,2.3,roof); /* telhado de zinco em 3 águas (cai para a rua), beiral na frente */
   L(-1.78,1.78,1.12,1.2,1.98,2.15,dark);L(-1.78,1.78,-1.05,-.97,2.22,2.35,dark);                     /* testeira de madeira (frente e fundo) */
   for(let k=0;k<5;k++){const y=.18+k*.42;L(-1.5,1.5,-.84,-.76,y,y+.34,k%2?wood:dark)}                  /* parede do fundo em tábuas */
   L(-1.15,1.15,-.72,-.3,.48,.56,seat);for(const t of [-1,1])L(t-.05,t+.05,-.6,-.4,0,.48,dark);         /* banco */
   {const t=1.85,u=.75;L(t-.05,t+.05,u-.05,u+.05,0,2.5,pole);L(t-.03,t+.03,u-.32,u+.32,2.05,2.5,plate);L(t-.035,t+.035,u-.24,u+.24,2.18,2.38,white)} /* placa de ônibus no poste */
   const ck=chunkOf(x,z);curChunk=city.chunks.get(ck[0]+','+ck[1])||null;s.colR=addCol(x-s.hx,z-s.hz,x+s.hx,z+s.hz,'rock');s.colR.top=2.5}}
 finally{curChunk=k0}
 const m=mb.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));if(!m)return;m.name='busRural';m.castShadow=true;m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();
 BUSR.mesh=m;city.group.add(m);try{invalidateStaticShadows()}catch(e){}}

/* v4 r41: ônibus de linha suja na estrada de terra e perde a sujeira no asfalto (não cabe no lava-jato). O do jogador ao volante vai pelo dirtTick (js/06). */
function busDirt(dt){for(const c of BUSL.list){if(!c.alive||c===PL.car)continue;const lx=c.bdx,lz=c.bdz;c.bdx=c.x;c.bdz=c.z;if(lx===undefined||dt<=0)continue;
  const sp=Math.hypot(c.x-lx,c.z-lz)/dt;if(sp<1||sp>60)continue;c.grime=c.grime||0;const g0=c.grime;
  if(isRural(c.x,c.z))c.grime=Math.min(1,c.grime+.0007/3*sp*dt);else c.grime=Math.max(0,c.grime-dt*GRIME_SELF);
  if(c.grime!==g0&&(c.bdT=(c.bdT||0)-dt)<=0){c.bdT=.5;dirtApply(c)}}}

/* ---------- paradas ---------- */
function busStopsBuild(){BUSL.stops.length=0;const L=city.busStops||[];
 for(const q of L){const alongX=Math.abs(q.nz)>.5,cands=[];
  if(alongX){const kz=Math.round((q.z+q.nz*RW/2)/P),k0=Math.floor(q.x/P);cands.push([k0,kz,0,q.x-k0*P],[k0+1,kz,2,(k0+1)*P-q.x])}
  else{const kx=Math.round((q.x+q.nx*RW/2)/P),k0=Math.floor(q.z/P);cands.push([kx,k0,1,q.z-k0*P],[kx,k0+1,3,(k0+1)*P-q.z])}
  let best=null,bd=1e9;
  for(const [kx,kz,d,s] of cands){if(!segExists(kx,kz,d)||s<RW/2+8||s>SEG_END-8)continue;
   for(let li=0;li<2;li++){if(!laneValid(kx,kz,d,li))continue;const p=lanePt(kx,kz,d,li,s),dd=Math.hypot(p[0]-q.x,p[1]-q.z);if(dd<bd){bd=dd;best={kx,kz,d,li,s}}}}
  if(best&&bd<11)BUSL.stops.push({i:BUSL.stops.length,x:q.cx,z:q.cz,gx:q.x,gz:q.z,...best})}}

/* ---------- rota (TSP simples + BFS sem contramão) ---------- */
function busRng(k){return mulberry32(((S.seed>>>0)^Math.imul((k|0)+1,0x9E3779B1)^0x5b17c0de)>>>0)}
function busOrder(rng){const T=BUSL.stops,n=T.length;if(!n)return[];const used=new Uint8Array(n);let cur=Math.floor(rng()*n);const ord=[cur];used[cur]=1;
 for(let k=1;k<n;k++){let b=-1,bd=1e18;for(let j=0;j<n;j++){if(used[j])continue;const d=(T[j].x-T[cur].x)**2+(T[j].z-T[cur].z)**2+rng()*900;if(d<bd){bd=d;b=j}}used[b]=1;ord.push(b);cur=b}
 const ds=(a,b)=>Math.hypot(T[a].x-T[b].x,T[a].z-T[b].z);
 for(let it=0,imp=true;imp&&it<30;it++){imp=false;for(let i=0;i<n-2;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;const a=ord[i],b=ord[i+1],c=ord[j],d=ord[(j+1)%n];
  if(ds(a,c)+ds(b,d)+.01<ds(a,b)+ds(c,d)){for(let l=i+1,r=j;l<r;l++,r--){const t=ord[l];ord[l]=ord[r];ord[r]=t}imp=true}}}
 if(rng()<.5)ord.reverse();return ord}
function busOpts(kx,kz,h,out){out.length=0;for(let k=0;k<4;k++){if(k===(h+2)%4)continue;if(canDrive(kx,kz,k))out.push(k)}if(!out.length&&canDrive(kx,kz,(h+2)%4))out.push((h+2)%4);return out}
/* do fim do segmento de A até o segmento de B (incluído): lista de [kx,kz,d] ou null */
function busPath(A,B,perm){const sx=A.kx+D[A.d][0],sz=A.kz+D[A.d][1],key=(x,z,h)=>((x*64+z)<<2)|h,prev=new Map(),q=[[sx,sz,A.d]],o=[];prev.set(key(sx,sz,A.d),-1);let goal=null;
 for(let qi=0;qi<q.length&&qi<20000;qi++){const st=q[qi],x=st[0],z=st[1];busOpts(x,z,st[2],o);if(x===B.kx&&z===B.kz&&o.includes(B.d)){goal=st;break}
  for(const k of perm){if(!o.includes(k))continue;const nx=x+D[k][0],nz=z+D[k][1],kk=key(nx,nz,k);if(prev.has(kk))continue;prev.set(kk,st);q.push([nx,nz,k])}}
 if(!goal)return null;const segs=[[B.kx,B.kz,B.d]];let cur=goal;for(;;){const p=prev.get(key(cur[0],cur[1],cur[2]));if(p===-1||!p)break;segs.push([p[0],p[1],cur[2]]);cur=p}segs.reverse();return segs}
function busRoute(){const R=BUSL.R;R.length=0;BUSL.loop=false;if(BUSL.stops.length<2){busPoly();return}
 const rng=busRng(BUSL.day*7919+(OBRA.key?OBRA.key.length*31:0)),ord=busOrder(rng),perm=()=>{const a=[0,1,2,3];for(let i=3;i>0;i--){const j=Math.floor(rng()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a};
 const seg=(x,z,d,li,st)=>R.push({kx:x,kz:z,d,li,st});let last=null,first=null;
 for(const si of ord){const B=BUSL.stops[si];if(!last){seg(B.kx,B.kz,B.d,B.li,[B]);last=first=B;continue}
  if(last.kx===B.kx&&last.kz===B.kz&&last.d===B.d&&B.s>last.s+8){R[R.length-1].st.push(B);last=B;continue}
  const p=busPath(last,B,perm());if(!p)continue;for(let k=0;k<p.length;k++){const q=p[k],isB=k===p.length-1;seg(q[0],q[1],q[2],isB?B.li:-1,isB?[B]:[])}last=B}
 if(first&&last!==first){const p=busPath(last,first,perm());if(p){for(let k=0;k<p.length-1;k++){const q=p[k];seg(q[0],q[1],q[2],-1,[])}BUSL.loop=true}}
 BUSL.okey=OBRA.key||'';busPoly()}
function busSegLi(g,curLi){if(g.li>=0)return g.li;const L=lineType(g.kx,g.kz,g.d);return L.t==='one'?(curLi===1?1:0):0}
/* traçado para o mapa: pontos na faixa + setas a cada ~38 m */
function busPoly(){const pl=BUSL.poly,ar=BUSL.arrows;pl.length=0;ar.length=0;const R=BUSL.R;if(!R.length)return;
 for(let i=0;i<R.length;i++){const g=R[i],li=busSegLi(g,0),a=lanePt(g.kx,g.kz,g.d,li,RW/2),b=lanePt(g.kx,g.kz,g.d,li,SEG_END);pl.push(a,b)}
 if(BUSL.loop)pl.push(pl[0]);let acc=19;
 for(let i=1;i<pl.length;i++){const a=pl[i-1],b=pl[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.01)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;
  while(acc<=L){ar.push([a[0]+ux*acc,a[1]+uz*acc,Math.atan2(uz,ux)]);acc+=38}acc-=L}}
/* relógio de dias próprio (DN.day vira ao meio-dia) */
function busClock(){const t=DN.tod;if(BUSL.lastTod===null){BUSL.lastTod=t;if(BUSL.t0===null)BUSL.t0=t;return}let d=t-BUSL.lastTod;if(d<0)d+=1440;BUSL.lastTod=t;BUSL.mins+=d;
 const day=Math.floor((BUSL.t0+BUSL.mins)/1440);if(day!==BUSL.day||(OBRA.key||'')!==BUSL.okey){BUSL.day=day;busRoute();for(const c of BUSL.list)busResync(c)}}

/* ---------- ônibus de linha ---------- */
function busActive(){return played&&running&&!ONLINE.on&&S.style!=='inverted'&&!city.haze&&BUSL.R.length>1&&trafficDensity()>0}
function busPose(c){if(c.mode==='rail'&&c.rail&&!c.rail.nr){const r=c.rail;return r.turn?null:{kx:r.kx,kz:r.kz,d:r.d,s:r.s,li:r.li,rail:true}}
 if(c.ai){const ai=c.ai,dx=D[ai.d][0],dz=D[ai.d][1],off=laneOff(ai.kx,ai.kz,ai.d,ai.li||0),ax=ai.kx*P-dz*off,az=ai.kz*P+dx*off;return{kx:ai.kx,kz:ai.kz,d:ai.d,s:(c.x-ax)*dx+(c.z-az)*dz,li:ai.li||0,rail:false}}return null}
function busMatch(g,p){return g.kx===p.kx&&g.kz===p.kz&&g.d===p.d}
function busResync(c){const p=busPose(c),R=BUSL.R,n=R.length;if(!p||!n)return false;const b=c.bl;
 for(let k=0;k<4;k++){const j=(b.i+k)%n;if(busMatch(R[j],p)){if(j!==b.i){b.i=j;b.served=0}return true}}
 for(let j=0;j<n;j++)if(busMatch(R[j],p)){b.i=j;b.served=0;return true}return false}
function busRetire(c){if(!c)return;c.busLine=false;if(c.npcId==='busline')c.npcId=0;if(c.bl&&c.bl.vmax)c.vmax=c.bl.vmax;if(c.ai&&c.bl)c.ai.vmax=c.bl.vmax;const i=BUSL.list.indexOf(c);if(i>=0)BUSL.list.splice(i,1)}
/* velocidade-alvo, próxima direção e faixa; roda antes do railUpdate / aiUpdate */
function busPre(c,dt){const R=BUSL.R,n=R.length,b=c.bl;if(!n){busRetire(c);return}const p=busPose(c);if(!p)return; /* fazendo a curva */
 if(!busMatch(R[b.i],p)&&!busResync(c)){busRetire(c);return}
 const g=R[b.i],nx=R[(b.i+1)%n];let vt=b.vmax;
 if(!BUSL.loop&&b.i===n-1){if(p.rail)c.rail.nd=chooseNext(p.kx+D[p.d][0],p.kz+D[p.d][1],p.d);busRetire(c);return}
 if(p.rail){c.rail.nd=nx.d;c.rail.busNli=busSegLi(nx,c.rail.li)}else{c.ai.nd=nx.d;const want=busSegLi(g,c.ai.li||0);if((c.ai.li||0)!==want&&laneValid(g.kx,g.kz,g.d,want)&&p.s>RW/2+4&&p.s<SEG_END-10)c.ai.li=want}
 for(let k=b.served;k<g.st.length;k++){const st=g.st[k],dist=st.s-p.s;if(dist<-3){b.served=k+1;continue}
  if(dist<1.3&&Math.abs(c.fwd||(c.rail?c.rail.v:0)||0)<.9){b.dw+=dt;vt=0;c.busAt=st;if(b.dw>=BUS_DWELL&&!(RIDE.c===c&&RIDE.hold)){b.dw=0;b.served=k+1;c.busAt=null}}
  else if(dist<1.3)vt=0;else if(dist<32)vt=Math.min(vt,Math.max(1.1,dist*.6));break}
 if(!PL.car&&!PL.taxi&&!PL.dead){const ca=Math.cos(c.a),sa=Math.sin(c.a),ex=PL.x-c.x,ez=PL.z-c.z,al=ex*ca+ez*sa,sd=-ex*sa+ez*ca;if(al>0&&al<c.t.L/2+7&&Math.abs(sd)<c.t.W/2+.9)vt=0}
 if(p.rail)c.vmax=vt;else c.ai.vmax=vt}
function busSpawn(){if(BUSL.list.length>=3)return;const R=BUSL.R,n=R.length,ctr=PL.car||PL;let best=-1,bs=0,bd=1e9;
 for(let j=0;j<n;j++){const g=R[j];if(!g.st.length)continue;const st=g.st[0],s=Math.max(RW/2+4,st.s-34),q=lanePt(g.kx,g.kz,g.d,busSegLi(g,0),s),d=Math.hypot(q[0]-ctr.x,q[1]-ctr.z);
  if(d<80||d>230)continue;const sc=Math.abs(d-140)+Math.random()*40;if(sc<bd){bd=sc;best=j;bs=s}}
 if(best<0)return;const g=R[best],li=busSegLi(g,0),q=lanePt(g.kx,g.kz,g.d,li,bs);if(carsNear(q[0],q[1],10).some(o=>Math.hypot(o.x-q[0],o.z-q[1])<10))return;
 const c=makeVehicle('bus',q[0],q[1],Math.atan2(D[g.d][1],D[g.d][0]),null);c.busDestination='CIRCULAR';c.mode='rail';c.gy=0;
 c.rail={kx:g.kx,kz:g.kz,d:g.d,li,s:bs,nd:R[(best+1)%n].d,turn:null,v:c.vmax*.4};c.busLine=true;c.npcId='busline';c.bl={i:best,dw:0,served:0,vmax:Math.min(c.vmax,11)};c.vmax=c.bl.vmax;
 BUSL.list.push(c);return c}
function busTick(dt){if(!busActive()){if(BUSL.list.length)for(const c of BUSL.list.slice())if(!vehicles.includes(c)||!c.alive)busRetire(c);return}
 busClock();const ctr=PL.car||PL;try{busDirt(dt)}catch(e){console.error(e)}
 for(const c of BUSL.list.slice()){if(!vehicles.includes(c)||!c.alive||c===PL.car){if(c===PL.car&&c.mode==='rail')toPhys(c);busRetire(c);continue}
  if(RIDE.c!==c&&Math.hypot(c.x-ctr.x,c.z-ctr.z)>300){busRetire(c);removeVehicle(c)}}
 if((BUSL.spT-=dt)<=0){BUSL.spT=4;const near=BUSL.list.filter(c=>Math.hypot(c.x-ctr.x,c.z-ctr.z)<260).length;if(near<2&&!PL.inside)busSpawn()}
 BUSL.at=null;if(!PL.car&&!PL.taxi&&!PL.inside&&!PL.dead){for(const st of BUSL.stops){if(Math.abs(st.x-PL.x)<5.5&&Math.abs(st.z-PL.z)<5.5&&Math.hypot(st.x-PL.x,st.z-PL.z)<5){BUSL.at=st;break}}}}
/* rail: próxima direção da linha e faixa na curva (startTurn usa r.nli) */
{const f0=railUpdate;railUpdate=function(c,dt){if(c.busLine&&c.bl)try{busPre(c,dt)}catch(e){console.error(e)}return f0.apply(this,arguments)}}
{const f0=aiUpdate;aiUpdate=function(c,dt){if(c.busLine&&c.bl)try{busPre(c,dt)}catch(e){console.error(e)}
  if(PL.taxi===c&&RIDE.c===c){const x=PL.x,z=PL.z;PL.x=PL.z=-1e6;try{return f0.apply(this,arguments)}finally{PL.x=x;PL.z=z}} /* o passageiro está no centro do próprio ônibus: a IA não pode frear por ele */
  return f0.apply(this,arguments)}}
{const f0=startTurn;startTurn=function(r,u0){const nli=r.busNli;const o=f0.apply(this,arguments);
  if(nli!==undefined&&nli!==r.nli){const bx=r.kx+D[r.d][0],bz=r.kz+D[r.d][1];if(laneValid(bx,bz,r.nd,nli)){r.nli=nli;const p0=r.turn.p0,p2=lanePt(bx,bz,r.nd,nli,RW/2);let p1;
   if(r.nd===r.d)p1=[(p0[0]+p2[0])/2,(p0[1]+p2[1])/2];else if(r.d%2===0)p1=[p2[0],p0[1]];else p1=[p0[0],p2[1]];
   const l01=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]),l12=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),l02=Math.hypot(p2[0]-p0[0],p2[1]-p0[1]);r.turn.p1=p1;r.turn.p2=p2;r.turn.len=Math.max(1,(l01+l12+l02)/2)}}
  r.busNli=undefined;return o}}

/* ---------- passageiro (ônibus e carona) ---------- */
function rideOK(){return played&&running&&!ONLINE.on&&!PL.car&&!PL.heli&&!PL.taxi&&!PL.inside&&!PL.dead&&!PARA.active&&!TVM.on&&!(typeof SKATE!=='undefined'&&SKATE.ride)&&!TAXI.c}
function rideDoor(c){const ca=Math.cos(c.a),sa=Math.sin(c.a),f=c.busLine?c.t.L/2-1.3:-.2;return[c.x+ca*f-sa*(c.t.W/2+.6),c.z+sa*f+ca*(c.t.W/2+.6)]}
function rideBusNear(){if(!rideOK())return null;let best=null,bd=5;for(const c of BUSL.list){if(!c.alive||Math.abs(c.fwd||0)>3)continue;const q=rideDoor(c),d=Math.hypot(q[0]-PL.x,q[1]-PL.z);if(d<bd){bd=d;best=c}}return best}
function rideCarNear(){if(!rideOK()||S.style!=='modern'&&S.style!=='synthwave')return null;let best=null,bd=3.6;
 for(const c of carsNear(PL.x,PL.z,8)){if(!c.alive||c.busLine||c.police||c.chase||c.taxiAI||c.svc||c.net||c.npcId||c.crim||c.keep||c.t.boat||c.t.hover||c.type==='moto'||c.type==='bus'||c.type==='truck'||c.type==='heli')continue;
  if(!(c.mode==='rail'||c.ai)||c.sleep||Math.abs(c.fwd||(c.rail?c.rail.v:0)||0)>2.2)continue;const ca=Math.cos(c.a),sa=Math.sin(c.a),side=-(PL.x-c.x)*sa+(PL.z-c.z)*ca,al=(PL.x-c.x)*ca+(PL.z-c.z)*sa;
  const d=Math.hypot(PL.x-c.x,PL.z-c.z);if(Math.abs(al)<c.t.L/2+.4&&d<bd&&Math.abs(side)<c.t.W/2+1.4){bd=d;best=c}}return best}
function rideBoard(c,kind){if(kind==='bus'){if((PL.money||0)<BUS_FARE){toast(busT('PASSAGEM $','BUS FARE $')+BUS_FARE);return false}money(-BUS_FARE,busT('PASSAGEM','BUS FARE'))}
 RIDE.c=c;RIDE.kind=kind;RIDE.t=0;RIDE.hold=false;PL.taxi=c;PL.sp.visible=false;PL.sh.visible=false;PL.vx=PL.vz=0;if(RADIO.list&&RADIO.list.length)RADIO.lastCar=c;
 if(kind==='car'){if(c.mode==='rail')toPhys(c);c.ai=null;c.rideAI=true;c.npcId='ride';c.path=null;c.pathT=0;c.stuckT=0;c.revT=0;c.sleep=false;c.hand=false;
  RIDE.cap=Math.random()<.45?24+Math.random()*14:13+Math.random()*7;RIDE.dest=rideDest(c);say(c,RIDE.cap>24?['Segura aí!','Aperta o cinto!','Tô atrasado!']:['Sobe aí.','Beleza, entra.','Vou pra lá, serve?'],2.5)}
 return true}
function rideDest(c){const N=city.N;for(let k=0;k<60;k++){const kx=Math.floor(Math.random()*(N+1)),kz=Math.floor(Math.random()*(N+1)),d=Math.floor(Math.random()*4);if(!canDrive(kx,kz,d))continue;
  const q=lanePt(kx,kz,d,0,P/2),dd=Math.hypot(q[0]-c.x,q[1]-c.z);if(dd<220||dd>750||inWater(q[0],q[1]))continue;return q}return lanePt(Math.round(c.x/P),Math.round(c.z/P),0,0,P/2)}
function rideEnd(arrived){const c=RIDE.c;if(!c){PL.taxi=null;return}const sp=Math.abs(c.fwd||(c.rail?c.rail.v:0)||0);const q=rideDoor(c);
 PL.taxi=null;PL.x=q[0];PL.z=q[1];PL.gy=groundY(PL.x,PL.z);PL.sp.visible=true;PL.sh.visible=true;PL.vx=PL.vz=0;camT.x=PL.x;camT.z=PL.z;
 if(RIDE.kind==='car'){c.rideAI=false;if(c.npcId==='ride')c.npcId=0;c.thr=0;c.hand=true;c.steerT=0;c.ai={kx:0,kz:0,d:0,li:0,nd:null,vmax:Math.min(c.vmax||12,13),stun:arrived?1.2:0,blockT:0,ignore:0};try{if(!reacquire(c))c.ai=null}catch(e){c.ai=null}
  if(arrived)say(c,['Chegamos.','É aqui.','Valeu, até mais.'],2.5)}
 RIDE.c=null;RIDE.kind=null;RIDE.dest=null;RIDE.hold=false;
 if(sp>4&&!arrived){const dmg=Math.min(80,8+sp*2.2);PL.vx=Math.cos(c.a)*sp*.4;PL.vz=Math.sin(c.a)*sp*.4;if(!CHEAT.hp){PL.hp=Math.max(0,PL.hp-dmg);if(PL.hp<=0)killPlayer('QUEDA DO VEÍCULO')}try{thud(.6)}catch(e){}}}
/* G / → / E / toque */
function rideAct(){if(RIDE.c){const sp=Math.abs(RIDE.c.fwd||(RIDE.c.rail?RIDE.c.rail.v:0)||0);rideEnd(false);return true}
 const b=rideBusNear();if(b){rideBoard(b,'bus');return true}
 const c=rideCarNear();if(!c)return false;if(simT<RIDE.refT)return true;RIDE.refT=simT+1.2;
 if(GUN.has){say(c,['Sai fora!','Tá maluco?!','Socorro!'],2);if(c.mode==='rail')toPhys(c);if(c.ai){c.ai.vmax=Math.min(c.t.vmax*.5,20);c.ai.stun=0}return true}
 if(POL.wanted){say(c,['Nem pensar!','Tá sendo procurado, cara.'],2);return true}
 if(Math.random()<.35){say(c,['Não dou carona.','Hoje não.','Vai a pé!'],2);return true}
 rideBoard(c,'car');return true}
function rideHint(){RIDE.h='';RIDE.an=null;
 if(RIDE.c){const c=RIDE.c,sp=Math.abs(c.fwd||(c.rail?c.rail.v:0)||0);if(sp<1.5)RIDE.h='<kbd>G</kbd><kbd>→</kbd>'+busT('DESCER','GET OFF');return RIDE.h}
 const b=rideBusNear();if(b){RIDE.an={x:b.x,z:b.z,gy:0,h:4};RIDE.h='<kbd>G</kbd><kbd>→</kbd>'+busT('PEGAR O ÔNIBUS','TAKE THE BUS')+' · $'+BUS_FARE;return RIDE.h}
 const c=rideCarNear();if(c){RIDE.an={x:c.x,z:c.z,gy:0,h:2.3};RIDE.h='<kbd>G</kbd><kbd>→</kbd>'+busT('PEDIR CARONA','HITCH A RIDE');return RIDE.h}return ''}
function rideTick(dt){const c=RIDE.c;if(!c)return;if(!vehicles.includes(c)||!c.alive||PL.dead){rideEnd(false);return}if(PL.taxi!==c){RIDE.c=null;return}RIDE.t+=dt;
 if(RIDE.kind==='car'){if(!RIDE.dest)RIDE.dest=rideDest(c);const done=taxiDrive(c,dt,RIDE.dest[0],RIDE.dest[1],7,RIDE.cap);if(done){rideEnd(true);return}
  const sp=Math.abs(c.fwd||0);if(sp>20&&typeof luckAdd==='function')luckAdd(dt*.15,'carona')}}
/* câmera em 1ª pessoa (V alterna); 3ª pessoa = câmera do táxi */
const RIDE_HOOD={sedan:[.3,1.14],taxi:[.3,1.14],police:[.3,1.15],sports:[.3,1],super:[.3,.96],conv:[.28,1.12],hatch:[.28,1.18],suv:[.3,1.45],pickup:[.3,1.38],van:[.36,1.5],bus:[.515,2.05],truck:[.515,1.95]};
function rideCam(dt){const c=RIDE.c;if(!c||!RIDE.fp)return;const ca=Math.cos(c.a),sa=Math.sin(c.a);let ox,oz,h;
 const HO=RIDE_HOOD[c.type]||RIDE_HOOD.sedan;ox=c.t.L*HO[0];oz=0;h=HO[1]; /* olho no mesmo ponto do motorista em 1ª pessoa (HOOD, js/24): dentro da carroceria só se vê parede escura */
 const y=(c.gy||0)+h,yw=(TAXI.cy||0),pt=-(TAXI.cpit||0)*.5,A=c.a+yw;setLens(72,.15);camera.up.set(0,1,0);
 camera.position.set(c.x+ca*ox-sa*oz,y,c.z+sa*ox+ca*oz);camera.lookAt(camera.position.x+Math.cos(A)*10,y+pt*10-.6,camera.position.z+Math.sin(A)*10)}
{const f0=updateCamera;updateCamera=function(dt,s){const r=f0.apply(this,arguments);try{if(RIDE.c&&RIDE.fp)rideCam(dt)}catch(e){console.error(e)}return r}}
{const f0=cycleView;cycleView=function(){if(RIDE.c){RIDE.fp=!RIDE.fp;return}return f0.apply(this,arguments)}}
/* G (teclado) e → (controle) chamam taxiCall: primeiro tenta ônibus/carona */
{const f0=taxiCall;taxiCall=function(phone){if(!phone&&rideAct())return;return f0.apply(this,arguments)}}
/* E / toque INTERAGIR: ctxAct(1) */
{const f0=ctxAct;ctxAct=function(n){if(n===1&&(RIDE.c||rideBusNear()||rideCarNear())&&rideAct())return;return f0.apply(this,arguments)}}
/* F (enterExit) e o botão sair do toque passam por taxiEnd quando PL.taxi */
{const f0=taxiEnd;taxiEnd=function(msg){if(RIDE.c&&PL.taxi===RIDE.c&&!TAXI.c){rideEnd(false);return}return f0.apply(this,arguments)}}
{const f0=taxiSkip;taxiSkip=function(){if(RIDE.c)return;return f0.apply(this,arguments)}}

/* ---------- mapa e minimapa ---------- */
Object.assign(MAP_ICON_DEFS,{busstop:{c:BUS_COL,p:'M4 4H20Q21 4 21 5V17H3V5Q3 4 4 4Z',d:'M5 6H19V11H5ZM6 20V17M18 20V17M6.5 14.5H8M16 14.5H17.5'}});
function busMapOn(){return busActive()&&(BUSL.at||(RIDE.c&&RIDE.kind==='bus'))}
function busMapDraw(g,sc,lw,rot){if(!busMapOn())return;const pl=BUSL.poly;if(pl.length<2)return;g.save();g.strokeStyle=BUS_COL;g.globalAlpha=.85;g.lineWidth=lw*.8/sc;g.lineJoin='round';g.beginPath();
 for(let i=0;i<pl.length;i++){const q=pl[i];if(i)g.lineTo(q[0]+MOFF,q[1]+MOFF);else g.moveTo(q[0]+MOFF,q[1]+MOFF)}g.stroke();g.globalAlpha=1;g.fillStyle=BUS_COL;g.strokeStyle='#05202a';g.lineWidth=1/sc;const s=Math.max(3.2,5.5/sc);
 for(const a of BUSL.arrows){const x=a[0]+MOFF,z=a[1]+MOFF,ca=Math.cos(a[2]),sa=Math.sin(a[2]);g.beginPath();g.moveTo(x+ca*s,z+sa*s);g.lineTo(x-ca*s*.7-sa*s*.75,z-sa*s*.7+ca*s*.75);g.lineTo(x-ca*s*.25,z-sa*s*.25);g.lineTo(x-ca*s*.7+sa*s*.75,z-sa*s*.7-ca*s*.75);g.closePath();g.fill();g.stroke()}
 g.restore();for(const st of BUSL.stops)drawMapIcon(g,'busstop',st.x+MOFF,st.z+MOFF,(st===BUSL.at?13:10)*(lw>=4?1.3:1)/sc,rot)}
{const f0=drawNav;drawNav=function(g,sc,lw,rot){try{busMapDraw(g,sc,lw,rot||0)}catch(e){console.error(e)}return f0.apply(this,arguments)}}
{const f0=mapLegendItems;mapLegendItems=function(){const A=f0.apply(this,arguments);if(busMapOn())A.push(['busstop','PONTO DE ÔNIBUS',true]);return A}}

/* ---------- ganchos de cidade, quadro e jogo novo ---------- */
{const f0=generateCity;generateCity=async function(){city.busStops=[];city.busGhost=[];busRuralClear();for(const c of BUSL.list.slice())busRetire(c);BUSL.list.length=0;BUSL.R.length=0;BUSL.poly.length=0;BUSL.arrows.length=0;
  const r=await f0.apply(this,arguments);try{try{busRuralPlace()}catch(e){console.error(e)}busStopsBuild();BUSL.day=-1;BUSL.lastTod=null;if(BUSL.t0===null)BUSL.t0=DN.tod||0;BUSL.day=Math.floor((BUSL.t0+BUSL.mins)/1440);busRoute()}catch(e){console.error('[onibus]',e)}return r}}
{const f0=startGame;startGame=function(save){if(RIDE.c){RIDE.c=null;RIDE.kind=null}BUSL.mins=0;BUSL.t0=null;BUSL.lastTod=null;return f0.apply(this,arguments)}}
{const f0=update;update=function(dt){const r=f0.apply(this,arguments);try{if(dt>0){busTick(dt);rideTick(dt)}}catch(e){console.error('[onibus]',e)}return r}}
