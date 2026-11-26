'use strict';
/* Coastal Chaos · js/53-metro.js — Metrô (v4).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html.
   - Estações: 3 a 5 por seed, em esquinas de quarteirões de prédios ('bld'), na calçada (centro a 2,05 m da guia e a 5 m da esquina, antes do poste de luz; senão 12,6 ou 15 m),
     com a boca virada para a esquina. Gerador próprio (nunca o R()), roda depois do generateCity (embrulho, depois dos caixas da r25).
     Espalhadas pela cidade (distância mínima que começa em 1/3 do mapa e encolhe até caber o mínimo).
   - Malha (referência: entrada de metrô de NY): guarda-corpo em U com balaústres e corrimão, mureta, placa METRÔ com as bolinhas das linhas,
     2 postes com globo verde na boca. 3 InstancedMesh (corpo Lambert com cor por vértice, placa MeshBasic com canvas, globos) + 1 InstancedMesh
     do "buraco": quadrado na altura da calçada com shader que traça o raio para dentro do poço (escada de 12 degraus, paredes de azulejo,
     faixa amarela na quina de cada degrau, túnel escuro no fundo). O chão da calçada não é furado.
   - Colisor 'rock' no retângulo inteiro (guarda-corpo + poço): ninguém cai no buraco; o jogador usa pela boca.
   - Uso: balão laranja "METRÔ" (PC), E/F/→, → no controle, INTERAGIR no toque → menu com as outras estações (distância, $3) e SAIR.
     Viagem invisível: fade (#fade) ~1 s e o jogador sai na boca da estação escolhida, de costas para a escada.
     Fechado com 2+ estrelas, na missão de abertura (prologueLocked), em evento (eventLock) e no Invertido (apagado/enferrujado, sem uso).
   - Sem metrô na Point Haze (city.haze) e nas Backrooms. Synthwave: guarda-corpo roxo-escuro com corrimão magenta e placa neon.
   - Mapa/minimapa: ícone M azul ('metro'), descoberto como os outros pontos (storyMap). Nada no save (posições vêm da seed). */
const METRO={list:[],body:null,sign:null,glb:null,pit:null,tex:null,pitMat:null,open:false,el:null,cur:null,busy:false,near:{x:0,z:0,gy:0},focus:0};
const MTR={HW:.68,Z0:-1.65,Z1:1.65,RUN:.275,RISE:.2,STEPS:12,OX:.86,OZ0:-1.72,OZ1:1.86,DC:2.05,UC:6.6};
const METRO_NAMES=['CORAL','MARINA','FLAMINGO','ATLÂNTICA','PALMEIRAS','BOA VISTA','VILA NOVA','CENTRAL','PORTO','MIRANTE','ALVORADA','JARDIM'];
function metroStyle(){return S.style==='inverted'?'inv':(city.st||STYLES[S.style]||{}).synth?'syn':'mod'}
/* ---------- placa (canvas): METRÔ + bolinhas das linhas ---------- */
function metroSignTex(sty){const c=cv(512,128),g=c.getContext('2d');const en=S.lang==='en',txt=en?'SUBWAY':'METRÔ';
 g.fillStyle=sty==='syn'?'#12061e':sty==='inv'?'#191716':'#141414';g.fillRect(0,0,512,128);
 g.fillStyle=sty==='syn'?'#59f6ff':sty==='inv'?'#3a3532':'#f2f2f2';g.fillRect(0,10,512,6);g.fillRect(0,112,512,6);
 g.font='bold 62px Arial,sans-serif';g.textBaseline='middle';g.textAlign='left';
 if(sty==='syn'){g.shadowColor='#ff3ad0';g.shadowBlur=18;g.fillStyle='#ffb8f2'}else g.fillStyle=sty==='inv'?'#5a5450':'#ffffff';
 g.fillText(txt,26,66);g.shadowBlur=0;
 const cols=sty==='inv'?['#3a2e2a','#2e3430','#3a3628','#2a2e36','#3a3028']:['#ee352e','#00933c','#fccc0a','#0039a6','#ff6319'];
 for(let i=0;i<5;i++){g.fillStyle=cols[i];g.beginPath();g.arc(318+i*38,66,15,0,6.283);g.fill();if(sty!=='inv'){g.fillStyle='rgba(255,255,255,.85)';g.font='bold 16px Arial,sans-serif';g.textAlign='center';g.fillText(String(i+1),318+i*38,67);g.textAlign='left'}}
 const t=new THREE.CanvasTexture(c);t.anisotropy=2;return t}
/* ---------- geometria (sistema local: x = largura, z = comprimento; boca em z<0, placa em z>0; y=0 é a calçada) ---------- */
function metroGeo(sty){const M=MTR,mb=new MB();
 const rail=COL(sty==='syn'?'#2c1a3c':sty==='inv'?'#3d332d':'#5a55a8'),post=COL(sty==='syn'?'#1e1028':sty==='inv'?'#2e2723':'#47438e'),
  top=COL(sty==='syn'?'#ff3ad0':sty==='inv'?'#4a3a30':'#6d68c2'),base=COL(sty==='syn'?'#1a1224':sty==='inv'?'#2a2624':'#5c5866'),dark=COL('#16141c');
 const ox=M.OX,iz0=M.Z0,bz=M.OZ1;
 /* mureta (base) nos 2 lados e no fundo: cobre a borda do poço */
 mb.box(-ox,-.03,iz0,-M.HW+.005,.2,bz,base);mb.box(M.HW-.005,-.03,iz0,ox,.2,bz,base);mb.box(-ox,-.03,M.Z1-.005,ox,.2,bz,base);
 /* trilho de baixo e corrimão */
 const RL=(x0,z0,x1,z1,y0,y1,c)=>mb.box(x0,y0,z0,x1,y1,z1,c);
 for(const s of[-1,1]){const xa=s*(ox-.1),xb=s*(ox-.02);RL(Math.min(xa,xb),iz0,Math.max(xa,xb),bz,.24,.3,rail);RL(Math.min(xa,xb)-.015,iz0,Math.max(xa,xb)+.015,bz,1.0,1.08,top)}
 RL(-ox,bz-.08,ox,bz,.24,.3,rail);RL(-ox-.015,bz-.095,ox+.015,bz+.015,1.0,1.08,top);
 /* balaústres */
 for(const s of[-1,1]){const xc=s*(ox-.06);for(let z=iz0+.12;z<bz-.06;z+=.14)mb.box(xc-.014,.3,z-.014,xc+.014,1.0,z+.014,rail)}
 for(let x=-ox+.14;x<ox-.08;x+=.14)mb.box(x-.014,.3,bz-.054,x+.014,1.0,bz-.026,rail);
 /* colunas dos cantos */
 for(const[x,z]of[[-ox+.06,iz0+.04],[ox-.06,iz0+.04],[-ox+.06,bz-.04],[ox-.06,bz-.04]]){mb.box(x-.055,.2,z-.055,x+.055,1.14,z+.055,post);mb.box(x-.07,1.14,z-.07,x+.07,1.2,z+.07,top)}
 /* placa no fundo (moldura escura; as faces com a arte vão na malha da placa) */
 mb.box(-ox+.02,1.08,bz-.07,ox-.02,1.5,bz-.03,dark);
 /* postes com globo na boca */
 for(const s of[-1,1]){const x=s*(ox+.08),z=iz0-.06;mb.box(x-.07,-.02,z-.07,x+.07,.14,z+.07,post);mb.box(x-.035,.14,z-.035,x+.035,2.32,z+.035,post);mb.box(x-.06,2.3,z-.06,x+.06,2.36,z+.06,top)}
 const body=mb.mesh(null).geometry;
 const sb=new MB(),W=COL('#ffffff');
 sb.quad([ox-.03,1.1,bz-.071],[-ox+.03,1.1,bz-.071],[-ox+.03,1.48,bz-.071],[ox-.03,1.48,bz-.071],0,0,-1,[0,0,1,1],W); /* frente (vista da boca) */
 sb.quad([-ox+.03,1.1,bz-.029],[ox-.03,1.1,bz-.029],[ox-.03,1.48,bz-.029],[-ox+.03,1.48,bz-.029],0,0,1,[0,0,1,1],W);  /* verso */
 const sign=sb.mesh(null).geometry;
 /* globos: 2 esferas numa geometria só */
 const g1=new THREE.SphereGeometry(.13,10,7);const pos=[],nor=[],idx=[];const P=g1.attributes.position.array,N=g1.attributes.normal.array,I=g1.index.array,nv=P.length/3;
 for(const s of[-1,1]){const base0=pos.length/3,x=s*(ox+.08),z=iz0-.06;for(let i=0;i<nv;i++){pos.push(P[i*3]+x,P[i*3+1]+2.48,P[i*3+2]+z);nor.push(N[i*3],N[i*3+1],N[i*3+2])}for(const k of I)idx.push(k+base0)}
 g1.dispose();const glb=new THREE.BufferGeometry();glb.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));glb.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));glb.setIndex(idx);
 const pit=new THREE.PlaneGeometry(M.HW*2,M.Z1-M.Z0);pit.rotateX(-Math.PI/2);pit.translate(0,.012,(M.Z0+M.Z1)/2);
 return{body,sign,glb,pit}}
/* ---------- shader do poço: traça o raio dentro da caixa (escada + paredes de azulejo + túnel) ---------- */
function metroPitMat(sty){const M=MTR;
 const u=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uL:{value:1},uN:{value:0},
  uT1:{value:COL(sty==='syn'?'#3a2a5a':sty==='inv'?'#4a4642':'#e8e6dc')},uT2:{value:COL(sty==='syn'?'#1a1030':sty==='inv'?'#2a2725':'#1f5a3a')},
  uSt:{value:COL(sty==='syn'?'#5a4a70':sty==='inv'?'#3a3634':'#b9b6ae')},uEd:{value:COL(sty==='syn'?'#59f6ff':sty==='inv'?'#4a4436':'#f2c21a')}}]);
 const D=k=>k.toFixed(4);
 const vs=`#include <common>
#include <fog_pars_vertex>
varying vec3 vL;varying vec3 vC;
void main(){vL=position;vec4 wp=vec4(position,1.);
#ifdef USE_INSTANCING
 wp=instanceMatrix*wp;vec3 d=cameraPosition-instanceMatrix[3].xyz;vC=vec3(dot(instanceMatrix[0].xyz,d),dot(instanceMatrix[1].xyz,d),dot(instanceMatrix[2].xyz,d));
#else
 vC=cameraPosition;
#endif
 wp=modelMatrix*wp;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`;
 const fs=`#include <common>
#include <fog_pars_fragment>
uniform float uL;uniform float uN;uniform vec3 uT1;uniform vec3 uT2;uniform vec3 uSt;uniform vec3 uEd;
varying vec3 vL;varying vec3 vC;
const float HW=${D(M.HW)},Z0=${D(M.Z0)},Z1=${D(M.Z1)},RUN=${D(M.RUN)},RISE=${D(M.RISE)},NS=${D(M.STEPS)};
float stepI(float z){return clamp(floor((z-Z0)/RUN),0.,NS-1.);}
float flo(float z){return -(stepI(z)+1.)*RISE;}
void main(){vec3 ro=vec3(vL.x,0.,vL.z);vec3 rd=normalize(vL-vC);rd.y=min(rd.y,-.002);
 float tx=((rd.x>0.?HW:-HW)-ro.x)/rd.x;float tz=((rd.z>0.?Z1:Z0)-ro.z)/rd.z;float tb=(-NS*RISE-.02-ro.y)/rd.y;
 float tw=min(min(tx,tz),tb);
 float hit=-1.;float dt=tw/48.;
 for(int i=1;i<=48;i++){float tt=dt*float(i);vec3 q=ro+rd*tt;if(q.y<flo(q.z)){hit=tt;break;}}
 vec3 col;vec3 p;
 if(hit>0.){float a=hit-dt,b=hit;for(int j=0;j<6;j++){float m=.5*(a+b);vec3 q=ro+rd*m;if(q.y<flo(q.z))b=m;else a=m;}
  p=ro+rd*b;vec3 qa=ro+rd*a;bool riser=stepI(qa.z)<stepI(p.z);float fz=fract((p.z-Z0)/RUN);
  if(riser)col=uSt*.58;else{col=uSt*(.92+.08*fract(sin(stepI(p.z)*12.9)*437.5));if(fz>.84)col=uEd;}
 }else{p=ro+rd*tw;
  if(tw==tb)col=uSt*.4;
  else{vec2 uv=(tw==tx)?vec2(p.z,p.y):vec2(p.x,p.y);vec2 g=floor(uv/.16);float ch=mod(g.x+g.y,2.);
   col=uT1*(.9+.1*ch);if(p.y<-.32&&p.y>-.52)col=uT2;if(p.y<-1.9)col=mix(uT1,uT2,.55)*.8;
   vec2 f=fract(uv/.16);if(f.x<.07||f.y<.07)col*=.78;
   if(tw==tz&&rd.z>0.){float fl=-NS*RISE;if(abs(p.x)<HW-.2&&p.y<fl+2.05)col=vec3(.02,.02,.025);}
   if(tw==tz&&rd.z<0.)col*=.85;}}
 float dk=exp(p.y*.62);col*=uL*mix(.18,1.,dk);col+=vec3(.05,.045,.03)*uN*dk;
 gl_FragColor=vec4(col,1.);
#include <fog_fragment>
}`;
 const m=new THREE.ShaderMaterial({uniforms:u,vertexShader:vs,fragmentShader:fs,fog:true});
 m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-4;return m}
/* ---------- posição (gerador próprio) ---------- */
function metroClear(){metroClose(true);METRO.list.length=0;METRO.body=METRO.sign=METRO.glb=METRO.pit=null;if(METRO.tex){METRO.tex.dispose();METRO.tex=null}METRO.pitMat=null}
function metroPlace(){metroClear();if(!city.rects||!city.info||city.haze||!city.group)return;
 const M=MTR,rng=mulberry32((S.seed^0x3e7a91c5)>>>0),lmRi=new Set((city.lms||[]).map(l=>l.ri)),al=city.bxAl||[],RJ=METRO.rj={};const rj=k=>{RJ[k]=(RJ[k]||0)+1};
 const gas=[];try{for(const g of GAS.list.values())gas.push(g)}catch(e){}
 const atms=(typeof ATMQ!=='undefined'&&ATMQ.list)||[];
 const cand=[];
 for(let ri=0;ri<city.rects.length;ri++){const f=city.info[ri],r=city.rects[ri];
  const pick=rng(),sd0=rng()*4|0,end0=rng()<.5?0:1; /* 3 sorteios fixos por quarteirão (a ordem de tentativa é fixa: rejeitar não muda os outros) */
  if(!f||!r||f.kind!=='bld'||f.para||f.isle||f.reservedSpecial||f.garage||lmRi.has(ri)){rj('kind');continue}
  let got=null;
  for(let si=0;si<4&&!got;si++){const sd=(sd0+si)%4,nx=sd===2?-1:sd===3?1:0,nz=sd===0?-1:sd===1?1:0,alongX=nz!==0,L=alongX?r[2]-r[0]:r[3]-r[1];if(L<22)continue;
   for(let ei=0;ei<6&&!got;ei++){const end=(end0+ei)%2,uo=[5,5,12.6,12.6,15,15][ei],uC=end===0?uo:L-uo; /* 3 distâncias da esquina × 2 pontas: antes do poste de luz (que fica a ~8 m da esquina) ou logo depois dele */
    const ex=alongX?r[0]+uC:(nx<0?r[0]:r[2]),ez=alongX?(nz<0?r[1]:r[3]):r[1]+uC;  /* ponto na guia */
    const x=ex-nx*M.DC,z=ez-nz*M.DC;
    /* +z local = para longe da esquina, ao longo da guia */
    const ax=alongX?1:0,az=alongX?0:1,zx=end===0?ax:-ax,zz=end===0?az:-az,ang=Math.atan2(zx,zz),cs=Math.cos(ang),sn=Math.sin(ang);
    const W=(lx,lz)=>[x+lx*cs+lz*sn,z-lx*sn+lz*cs];
    const rx=ex+nx*RW/2,rz=ez+nz*RW/2;if(inWater(rx,rz)||Math.abs(groundY(rx,rz))>.05){rj('rua');continue}
    const gy=groundY(x,z);if(gy<.08||gy>.6){rj('gy');continue}
    const cs4=[W(-M.OX-.15,M.OZ0-.25),W(M.OX+.15,M.OZ0-.25),W(M.OX+.15,M.OZ1+.05),W(-M.OX-.15,M.OZ1+.05)];
    let flat=true;for(const q of cs4)if(Math.abs(groundY(q[0],q[1])-gy)>.03){flat=false;break}if(!flat){rj('flat');continue}
    const x0=Math.min(...cs4.map(q=>q[0])),x1=Math.max(...cs4.map(q=>q[0])),z0=Math.min(...cs4.map(q=>q[1])),z1=Math.max(...cs4.map(q=>q[1]));
    /* boca livre na frente (onde o jogador para) */
    const mo=W(0,M.OZ0-.9),bx0=Math.min(x0,mo[0]-.6),bx1=Math.max(x1,mo[0]+.6),bz0=Math.min(z0,mo[1]-.6),bz1=Math.max(z1,mo[1]+.6);
    let hit=null;for(const c of query(x,z,5)){if(c.dead)continue;if(c.x1>bx0-.35&&c.x0<bx1+.35&&c.z1>bz0-.35&&c.z0<bz1+.35){hit=c;break}}if(hit){rj('col:'+hit.kind);continue}
    let bad=false;for(const d of (city.doors&&city.doors.get(ri))||[])if(Math.hypot(d.x-x,d.z-z)<3.5||Math.hypot(d.ox-x,d.oz-z)<3.5){bad=true;break}if(bad){rj('porta');continue}
    for(const a of al)if(x>a[0]-3&&x<a[2]+3&&z>a[1]-3&&z<a[3]+3){bad=true;break}if(bad){rj('beco');continue}
    for(const g of gas)if(Math.hypot(g.x-x,g.z-z)<35){bad=true;break}if(bad){rj('posto');continue}
    for(const a of atms)if(Math.hypot(a.x-x,a.z-z)<10){bad=true;break}if(bad){rj('caixa');continue}
    got={ri,x,z,gy,ang,cs,sn,box:[x0,z0,x1,z1],ord:pick}}}
  if(got)cand.push(got)}
 METRO.cand=cand.length;if(!cand.length)return;
 cand.sort((a,b)=>a.ord-b.ord);
 const want=3+Math.floor(rng()*3),out=[];let dmin=(city.ext||900)*.33;
 for(let it=0;it<8&&out.length<want;it++){for(const c of cand){if(out.length>=want)break;if(out.includes(c))continue;if(out.every(o=>Math.hypot(o.x-c.x,o.z-c.z)>=dmin))out.push(c)}dmin*=.78}
 const names=METRO_NAMES.slice();for(let i=names.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[names[i],names[j]]=[names[j],names[i]]}
 out.forEach((s,i)=>{s.i=i;s.name=names[i];const W=(lx,lz)=>[s.x+lx*s.cs+lz*s.sn,s.z-lx*s.sn+lz*s.cs];const e=W(0,MTR.OZ0-.75),o=W(0,MTR.OZ0-2);s.ex=e[0];s.ez=e[1];s.fx=o[0]-s.x;s.fz=o[1]-s.z;const fl=Math.hypot(s.fx,s.fz)||1;s.fx/=fl;s.fz/=fl});
 METRO.list=out;metroBuild()}
function metroBuild(){const out=METRO.list,n=out.length;if(!n)return;const sty=metroStyle(),geo=metroGeo(sty);METRO.tex=metroSignTex(sty);
 const bm=new THREE.MeshLambertMaterial({vertexColors:true}),sm=new THREE.MeshBasicMaterial({map:METRO.tex}),gm=new THREE.MeshBasicMaterial({color:sty==='inv'?0x121312:sty==='syn'?0x59f6ff:0x3dff7a});
 METRO.pitMat=metroPitMat(sty);
 const B=new THREE.InstancedMesh(geo.body,bm,n),SG=new THREE.InstancedMesh(geo.sign,sm,n),GL=new THREE.InstancedMesh(geo.glb,gm,n),PT=new THREE.InstancedMesh(geo.pit,METRO.pitMat,n);
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),p=new THREE.Vector3(),one=new THREE.Vector3(1,1,1);
 const k0=curChunk;try{for(const s of out){q.setFromAxisAngle(up,s.ang);p.set(s.x,s.gy,s.z);m.compose(p,q,one);for(const M of[B,SG,GL,PT])M.setMatrixAt(s.i,m);
  const ck=chunkOf(s.x,s.z);curChunk=city.chunks.get(ck[0]+','+ck[1])||null;const c=addCol(s.box[0]+.1,s.box[1]+.1,s.box[2]-.1,s.box[3]-.1,'rock');c.top=1.1;s.col=c}}finally{curChunk=k0}
 for(const M of[B,SG,GL,PT]){M.frustumCulled=false;M.matrixAutoUpdate=false;M.updateMatrix();M.instanceMatrix.needsUpdate=true}
 B.castShadow=true;B.receiveShadow=true;for(const M of[SG,GL,PT]){M.castShadow=false;M.receiveShadow=false}
 B.name='metroBody';SG.name='metroSign';GL.name='metroGlobe';PT.name='metroPit';
 METRO.body=B;METRO.sign=SG;METRO.glb=GL;METRO.pit=PT;for(const M of[PT,B,SG,GL])city.group.add(M);
 metroLight(true);try{invalidateStaticShadows()}catch(e){}}
/* luz do poço e dos globos acompanha o anoitecer */
function metroLight(force){if(!METRO.pitMat)return;const nf=clamp(DN.nightF||0,0,1);if(!force&&Math.abs(nf-(METRO.lastNf||0))<.02)return;METRO.lastNf=nf;
 const u=METRO.pitMat.uniforms,inv=metroStyle()==='inv';u.uL.value=(1-.62*nf)*(inv?.3:1);u.uN.value=inv?0:nf; /* Invertido: poço sem luz */
 if(METRO.glb&&metroStyle()!=='inv'){const c=METRO.glb.material.color,b=metroStyle()==='syn'?0x59f6ff:0x3dff7a;c.setHex(b).multiplyScalar(.7+.3*nf)}}
/* ---------- uso ---------- */
function metroNear(){if(METRO.busy||PL.inside||PL.car||PL.heli||PL.dead||S.style==='inverted'||!METRO.list.length)return null;
 for(const s of METRO.list){const dx=PL.x-s.ex,dz=PL.z-s.ez;if(dx*dx+dz*dz<1.3*1.3){const n=METRO.near;n.x=s.x;n.z=s.z;n.gy=s.gy;n.st=s;return n}}return null}
function metroFmtD(d){return d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d/10)*10+' m'}
function metroT(a,b){return S.lang==='en'?b:a}
function metroEl(){if(METRO.el)return METRO.el;
 const st=document.createElement('style');st.textContent='#metroDlg{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(6,6,14,.62);color:#fff;font-family:"Segoe UI",Arial,sans-serif}#metroDlg[hidden]{display:none}#metroDlg .mt-box{width:min(400px,calc(100vw - 32px));background:#101018;border:2px solid #6d68c2;border-radius:12px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.7)}#metroDlg .mt-t{display:flex;align-items:center;gap:10px;font-size:17px;letter-spacing:.5px;margin-bottom:10px}#metroDlg .mt-m{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#3aa0ff;font-weight:800;font-size:17px}#metroDlg .mt-l{display:flex;flex-direction:column;gap:7px}#metroDlg .mt-l .btn{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left}#metroDlg .mt-l .btn small{opacity:.75;font-size:12px}#metroDlg .mt-x{margin-top:10px;width:100%}#metroDlg .mt-pad{font-size:11px;opacity:.65;margin-top:8px;text-align:center}@media (pointer:coarse){#metroDlg .btn{min-height:44px}}';document.head.appendChild(st);
 const d=document.createElement('div');d.id='metroDlg';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML='<div class="mt-box"><div class="mt-t"><span class="mt-m">M</span><b id="mtT"></b></div><div class="mt-l" id="mtL"></div><button type="button" class="btn mt-x" id="mtX"></button><div class="mt-pad" id="mtPad"></div></div>';
 document.body.appendChild(d);METRO.el=d;
 d.querySelector('#mtL').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;metroGo(+b.dataset.i)});
 d.querySelector('#mtX').addEventListener('click',()=>metroClose());
 d.addEventListener('click',e=>{if(e.target===d)metroClose()});return d}
function metroOpen(st){if(METRO.open||!st)return;
 if(prologueLocked&&prologueLocked()){toast(translatePlain('METRÔ FECHADO'));clang(.1);return}
 if((POL.wanted||0)>=2){toast(translatePlain('METRÔ FECHADO · PROCURADO'));clang(.1);return}
 const d=metroEl();METRO.open=true;METRO.cur=st;for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();
 d.querySelector('#mtT').textContent=metroT('ESTAÇÃO ','STATION ')+st.name;
 const L=d.querySelector('#mtL');L.innerHTML='';
 for(const o of METRO.list){if(o===st)continue;const b=document.createElement('button');b.type='button';b.className='btn primary';b.dataset.i=o.i;
  b.innerHTML='<span>'+metroT('ESTAÇÃO ','STATION ')+o.name+'</span><small>'+metroFmtD(Math.hypot(o.x-st.x,o.z-st.z))+' · $3</small>';b.disabled=(PL.money||0)<3;L.appendChild(b)}
 d.querySelector('#mtX').textContent=metroT('SAIR','EXIT');
 const pa=typeof padActive==='function'&&padActive();d.querySelector('#mtPad').textContent=pa?metroT('✕ viaja · ○ sai','✕ ride · ○ exit'):metroT('↑ ↓ escolhe · ESC sai','↑ ↓ choose · ESC exit');
 d.hidden=false;clang(.15);const f=L.querySelector('button:not([disabled])')||d.querySelector('#mtX');f.focus()}
function metroClose(silent){if(!METRO.open)return;METRO.open=false;if(METRO.el){METRO.el.hidden=true;const ae=document.activeElement;if(ae&&METRO.el.contains(ae))ae.blur()}for(const k in keys)keys[k]=false}
function metroRumble(){if(!AC||!master)return;try{const t=AC.currentTime,n=AC.sampleRate*1.6|0,buf=AC.createBuffer(1,n,AC.sampleRate),a=buf.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=l*.985+(Math.random()*2-1)*.015;a[i]=l*(1+.5*Math.sin(i/AC.sampleRate*38))}
 const s=AC.createBufferSource();s.buffer=buf;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=260;const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.9,t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+1.55);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+1.6)}catch(e){}}
function metroGo(i){const from=METRO.cur,to=METRO.list[i];if(!to||!from||to===from||METRO.busy)return;
 if((PL.money||0)<3){toast(translatePlain('SEM DINHEIRO'));clang(.1);return}
 {const ev=eventLock();if(ev&&ev!=='INTERIOR'){toast(translatePlain('METRÔ FECHADO'));return}}
 metroClose();METRO.busy=true;money(-3);initAudio();metroRumble();
 const f=$('#fade');if(f){f.style.transition='opacity .45s';f.style.opacity=1}
 setTimeout(()=>{try{PL.x=to.ex;PL.z=to.ez;PL.vx=PL.vz=0;PL.jy=PL.jv=0;PL.down=0;PL.rot=0;PL.face=[to.fx,to.fz];circleVsWorld(PL,.45);PL.gy=groundY(PL.x,PL.z);camT.x=PL.x;camT.z=PL.z;try{updateCamera(0)}catch(e){}}catch(e){console.error(e)}
  setTimeout(()=>{if(f){f.style.transition='opacity .6s';f.style.opacity=0}METRO.busy=false;toast(metroT('ESTAÇÃO ','STATION ')+to.name)},500)},650)}
document.addEventListener('keydown',e=>{if(!METRO.open)return;const k=e.key;if(/^F\d+$/.test(k))return;const d=METRO.el;
 const bs=[...d.querySelectorAll('button:not([disabled])')],ae=document.activeElement,ix=bs.indexOf(ae);
 if(k==='ArrowDown'||k==='s'||k==='S'||k==='ArrowRight'){(bs[(ix+1)%bs.length]||bs[0]).focus()}
 else if(k==='ArrowUp'||k==='w'||k==='W'||k==='ArrowLeft'){(bs[(ix-1+bs.length)%bs.length]||bs[0]).focus()}
 else if(k==='Escape'||k==='Backspace'){metroClose()}else if(k==='Enter'||k===' '){if(ae&&d.contains(ae)&&ae.click&&!ae.disabled)ae.click()}else if(k==='Tab')return;
 e.preventDefault();e.stopPropagation()},true);
{const f0=ctxAct;ctxAct=function(n){if(n===1&&!METRO.open){const s=metroNear();if(s){metroOpen(s.st);return}}return f0.apply(this,arguments)}}
{const f0=padDialog;padDialog=function(){return METRO.open?METRO.el:f0.apply(this,arguments)}}
{const f0=eventLock;eventLock=function(){return METRO.busy?'METRÔ':f0.apply(this,arguments)}}
function metroTick(){if(!METRO.list.length)return;metroLight(false);if(METRO.open&&!METRO.busy){const s=metroNear();if(!s||s.st!==METRO.cur)metroClose()}}
{const f0=updatePeds;updatePeds=function(dt){f0.apply(this,arguments);try{metroTick()}catch(e){console.error(e)}}}
/* ---------- mapa e minimapa: M azul ---------- */
Object.assign(MAP_ICON_DEFS,{metro:{c:'#3aa0ff',p:'M12 2.5A9.5 9.5 0 1 1 11.99 2.5Z',d:'M7.4 16.4V8.2L12 13.2L16.6 8.2V16.4'}});
{const f0=mapPoiEntries;mapPoiEntries=function(){const A=f0.apply(this,arguments);if(!mapPoiEntries.base&&S.style!=='inverted'&&!city.haze)for(const s of METRO.list)A.push({k:'metro',x:s.x,z:s.z});return A}}
{const f0=mapLegendItems;mapLegendItems=function(){const A=f0.apply(this,arguments);if(city.haze||S.style==='inverted'||!METRO.list.length)return A;if(storyMap('metro'))A.push(['metro','METRÔ',true]);return A}}
/* ---------- cidade nova ---------- */
{const f0=generateCity;generateCity=async function(){const r=await f0.apply(this,arguments);try{metroPlace()}catch(e){console.error('[metrô]',e)}return r}}
