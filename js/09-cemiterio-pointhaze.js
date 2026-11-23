'use strict';
/* Coastal Chaos · js/09-cemiterio-pointhaze.js — Fantasma do cemitério, travessia da Point Haze, quintal, cemitério, delegacia, farol.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= v70: fantasma do cemitério (easter egg) ================= */
const GHOST={g:null,t:0,cool:30,hitCd:0,tex:null};
function ghostTex(){if(GHOST.tex)return GHOST.tex;const c=cv(32,40),g=c.getContext('2d'),px=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
 const W='#f6f6fa',S='#c8c8d2',D='#9a9aa8',E='#24242e';
 px(10,2,12,2,W);px(8,4,16,2,W);px(6,6,20,4,W);px(5,10,22,20,W);px(5,30,4,4,W);px(11,30,4,5,W);px(17,30,4,4,W);px(23,30,4,5,W);
 px(22,8,4,22,S);px(24,30,3,5,S);px(5,26,22,4,S);px(18,30,3,4,S);px(7,4,2,2,S);
 px(10,12,4,5,E);px(18,12,4,5,E);px(11,13,1,1,'#ffffff');px(19,13,1,1,'#ffffff');px(14,20,4,4,E);px(15,21,2,2,D);
 px(1,15,4,3,W);px(1,18,2,3,S);px(27,14,4,3,W);px(29,17,2,3,S);
 const id=g.getImageData(0,0,32,40),a=id.data,o=new Uint8ClampedArray(a);for(let y=0;y<40;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(a[i+3])continue;const n=(xx,yy)=>xx>=0&&xx<32&&yy>=0&&yy<40&&a[(yy*32+xx)*4+3]>0;if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1)){o[i]=70;o[i+1]=70;o[i+2]=84;o[i+3]=200}}id.data.set(o);g.putImageData(id,0,0);
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;return GHOST.tex=t}
function ghostSnd(v){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain(),f=AC.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(260,t);o.frequency.linearRampToValueAtTime(170,t+1.6);l.frequency.value=6;lg.gain.value=18;l.connect(lg);lg.connect(o.frequency);f.type='lowpass';f.frequency.value=900;
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18*v,t+.3);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);o.connect(f);f.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+1.9);l.stop(t+1.9)}
function ghostSpawn(){const C=city.cem;if(!C)return;const r=C.rect;for(let k=0;k<10;k++){const x=r[0]+3+Math.random()*(r[2]-r[0]-6),z=r[1]+3+Math.random()*(r[3]-r[1]-6);if(Math.hypot(x-PL.x,z-PL.z)<12)continue;
  const ch=makeCharacter({cap:Math.random()<.3?'#d8dae4':null,capDark:null,skin:'#eef0f8',hair:'#b8bccc',shirt:'#f6f6fc',pants:'#d4d6e2',shoes:'#a8acbc',belt:'#c4c6d4',stripe:Math.random()<.4?'#c8cad8':null,glasses:null,necklace:null,long:Math.random()<.4}),sp=ch.sp;scene.remove(ch.sh);ch.sh.geometry.dispose();ch.sh.material.dispose();sp.material.alphaTest=.02;sp.material.opacity=0;sp.material.depthWrite=false;sp.userData.actorTint.setRGB(.92,.95,1.1);sp.material.needsUpdate=true;
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xdfe6ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));gl.scale.set(5,5,1);scene.add(gl);
  GHOST.g={x,z,sp,gl,tex:ch.tex,life:45+Math.random()*50,a:0,tx:x,tz:z,ph:Math.random()*6,state:'roam',mx:0,mz:1};ghostSnd(1);toast('<span style="color:#dfe6ff">…UUUUUH…</span><br><small style="font-size:11px;color:#fff">algo se mexeu entre os túmulos</small>');return}}
function ghostKill(){const G=GHOST.g;if(!G)return;scene.remove(G.sp);scene.remove(G.gl);G.sp.material.dispose();if(G.tex)G.tex.dispose();G.gl.material.dispose();GHOST.g=null}
function ghostTick(dt){if(!worldOn('ghost'))return;GHOST.cool-=dt;GHOST.hitCd=Math.max(0,GHOST.hitCd-dt);const C=city.cem,G=GHOST.g;
 if(!G){if(!C||!played||PL.inside||GHOST.cool>0)return;const r=C.rect,d=Math.hypot(Math.max(r[0]-PL.x,0,PL.x-r[2]),Math.max(r[1]-PL.z,0,PL.z-r[3]));if(d>70)return;
  const nf=Math.max(DN.nightF||0,city.st.night?.6:0),chance=(.004+.05*nf)*dt;if(Math.random()<chance)ghostSpawn();else GHOST.cool=1;return}
 G.ph+=dt;const r=C?C.rect:[G.x-20,G.z-20,G.x+20,G.z+20];
 if(G.state==='revive'){G.rt+=dt;const k=Math.min(1,G.rt/2.6);G.sp.material.opacity=(1-k)*.85;G.sp.userData.actorTint.setRGB(1,1-k*.2,1-k*.4);G.gl.material.opacity=.7*(1-k)+.3*Math.sin(k*Math.PI);
  if(G.ped&&peds.includes(G.ped)){G.ped.sp.material.opacity=G.ped.sh.material.opacity=k;G.ped.x=G.x;G.ped.z=G.z;if(Math.random()<dt*20)emit(G.x+(Math.random()-.5),.5+Math.random()*2,G.z+(Math.random()-.5),0,1.2,0,.8,.3,.9,Math.random()<.5?0xffffff:0xffe6a0,true,.9)}
  G.sp.position.set(G.x,groundY(G.x,G.z)+.5+G.rt*.25+(camMode==='top'&&!VIEW.orbit?.9:0),G.z);G.gl.position.set(G.x,groundY(G.x,G.z)+1.4,G.z);
  if(k>=1){if(G.ped&&peds.includes(G.ped)){G.ped.sp.material.alphaTest=.5;G.ped.sp.material.needsUpdate=true;G.ped.state='flee';G.ped.timer=6;G.ped.fixed=false;G.ped.vx=(Math.random()-.5)*4;G.ped.vz=(Math.random()-.5)*4}ghostKill();GHOST.cool=180}return}
 G.life-=dt;const pc=PL.car||PL,dp=Math.hypot(pc.x-G.x,pc.z-G.z);let sp=1.2;
 if(!PL.dead&&!PL.inside&&dp<26){G.tx=pc.x;G.tz=pc.z;sp=PL.car?2.2:3.4;if(G.state!=='hunt'){G.state='hunt';ghostSnd(.8)}}
 else{if(G.state==='hunt')G.state='roam';if(Math.hypot(G.tx-G.x,G.tz-G.z)<1.5){G.tx=r[0]+3+Math.random()*(r[2]-r[0]-6);G.tz=r[1]+3+Math.random()*(r[3]-r[1]-6)}}
 const dx=G.tx-G.x,dz=G.tz-G.z,l=Math.hypot(dx,dz)||1;if(l>.3){G.mx=dx/l;G.mz=dz/l}G.x+=dx/l*Math.min(l,sp*dt)+Math.sin(G.ph*1.3)*dt*.6;G.z+=dz/l*Math.min(l,sp*dt)+Math.cos(G.ph*1.1)*dt*.6;
 G.a=Math.min(1,G.a+dt*.6);if(G.life<3)G.a=Math.max(0,G.life/3);const fl=.62+.18*Math.sin(G.ph*7)+.08*Math.sin(G.ph*17);
 G.sp.material.opacity=G.a*fl;G.gl.material.opacity=G.a*.3;const top=camMode==='top'&&!VIEW.orbit,hg=top?2.9:1.9,gy=groundY(G.x,G.z)+.55+Math.sin(G.ph*2.2)*.18;G.sp.scale.set(hg*16/24,hg,1);G.sp.position.set(G.x,gy+(top?.9:0),G.z);G.gl.position.set(G.x,gy+1,G.z);G.sp.material.rotation=Math.sin(G.ph*1.7)*.06;setFrame(G.tex,pickDir(G.mx,G.mz,G.x,G.z),Math.floor(G.ph*2.5)%4===1?1:Math.floor(G.ph*2.5)%4===3?2:0);
 if(Math.random()<dt*5)emit(G.x+(Math.random()-.5)*.8,gy-.3,G.z+(Math.random()-.5)*.8,(Math.random()-.5)*.3,.25,(Math.random()-.5)*.3,1.4,.5,1.2,0xe8ecff,false,.35*G.a);
 if(!PL.dead&&!PL.inside&&G.a>.5&&GHOST.hitCd<=0){const hit=PL.car?dp<PL.car.t.L/2+.4:dp<.95;if(hit){GHOST.hitCd=1.1;const dmg=PL.car?8:20;PL.hp-=armorHit(dmg);rumble(.6,.4,300);ghostSnd(1.2);for(let i=0;i<10;i++)emit(PL.x,1.2,PL.z,(Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3,.6,.4,.1,0xdfe6ff,true,.9);
   toast('<span style="color:#dfe6ff">O FANTASMA TE TOCOU</span> · −'+dmg+' HP');
   if(PL.hp<=0){if(PL.car)enterExit();killPlayer('ASSOMBRADO');PL.deadT=5;G.state='revive';G.rt=0;const q=spawnPed(null,{x:G.x,z:G.z,vx:0,vz:0,pal:pick2(PED_PALS)});q.state='fare';q.fixed=true;q.sp.material.alphaTest=.02;q.sp.material.opacity=q.sh.material.opacity=0;q.sp.material.needsUpdate=true;G.ped=q;ghostSnd(1.4);
    setTimeout(()=>toast('<span style="color:#ffe6a0">Ele roubou o seu sopro de vida</span>'),900)}}}
 if(G.life<=0)ghostKill()}

const INVERT={shift:60,idx:0,side:1,portal:null,cands:[],group:null,plane:null,glow:null,ghosts:[],hitCd:0,switching:false,deathReturn:false,homeTod:null,homeDay:0};
function invertStateSave(){return{shift:INVERT.shift,idx:INVERT.idx,side:INVERT.side,homeTod:INVERT.homeTod,homeDay:INVERT.homeDay}}
function invertKillGhost(g){if(!g)return;scene.remove(g.sp);scene.remove(g.gl);g.sp.material.dispose();if(g.tex)g.tex.dispose();g.gl.material.dispose();const i=INVERT.ghosts.indexOf(g);if(i>=0)INVERT.ghosts.splice(i,1)}
function invertClearGhosts(){for(const g of INVERT.ghosts.slice())invertKillGhost(g);INVERT.ghosts.length=0;INVERT.hitCd=0}
function invertCityReset(){demoDestroy();invertClearGhosts();INVERT.cands=[];INVERT.portal=null;INVERT.group=null;INVERT.plane=null;INVERT.glow=null;INVERT.vein=null;INVERT.bolts=null;if(INVERT.veinTex){INVERT.veinTex.dispose();INVERT.veinTex=null}}
// DEMOGORGONS: inimigos leves do Upside Down. Navegacao nas ruas, becos seguros.
const DEMO={list:[],spawnT:0,damage:25,speed:50/3.6};
function demoAlley(x,z,pad=2.5){return(city.alleySites||[]).some(a=>x>a.x0-pad&&x<a.x1+pad&&z>a.z0-pad&&z<a.z1+pad)}
function demoBlocked(x,z,r=.55){if(inWater(x,z)||riverZone(x,z)||demoAlley(x,z,0))return true;
 return colliders.some(c=>!c.dead&&c.kind==='bld'&&x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r)}
function demoLineClear(x,z,tx,tz){const dx=tx-x,dz=tz-z,len=Math.hypot(dx,dz);if(len>65)return false;
 const steps=Math.ceil(len/1.2);for(let i=1;i<steps;i++){const t=i/steps;if(demoBlocked(x+dx*t,z+dz*t,.35))return false}return true}
function demoRoadPoint(){const n=city.N;for(let k=0;k<45;k++){
 const i=Math.floor(Math.random()*(n+1)),j=Math.floor(Math.random()*(n+1));
 const dirs=[0,1,2,3].filter(d=>segExists(i,j,d));if(!dirs.length)continue;
 const d=dirs[Math.floor(Math.random()*dirs.length)],f=.2+Math.random()*.6;
 const x=(i+D[d][0]*f)*P,z=(j+D[d][1]*f)*P;
 if(!demoBlocked(x,z,1.5)&&!demoAlley(x,z,5))return{x,z};
 }return null}
function demoDestroy(){for(const g of DEMO.list){scene.remove(g.sp);scene.remove(g.gl);if(g.gl2){scene.remove(g.gl2);g.gl2.material.dispose()}g.sp.material.dispose();g.gl.material.dispose();if(g.eyeTex)g.eyeTex.dispose();if(g.tex){if(g.tex.isAtlas8)charTexRelease(g.tex);else g.tex.dispose()}}DEMO.list.length=0;DEMO.spawnT=0}
// Detalhes organicos em vermelho diretamente no atlas pixel-art: acompanham animacao e rotacao.
function demoRedAtlas(pal){
 const canvas=makeAtlas(pal),c=canvas.getContext('2d');
 const pixel=(x,y,w,h,color='#d91824')=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 for(let dir=0;dir<4;dir++)for(let fr=0;fr<3;fr++){
  const x=fr*32,y=dir*48;
  // Tracos finos na testa, laterais da cabeca e olhos; sem discos de brilho.
  pixel(x+12,y+5,8,1,'#e51b27');pixel(x+15,y+6,2,3,'#b71320');
  pixel(x+8,y+9,2,7,'#b71320');pixel(x+22,y+9,2,7,'#b71320');
  if(dir!==2){pixel(x+12,y+13,2,2,'#3aff5a');pixel(x+19,y+13,2,2,'#3aff5a')} /* v2 r2.1: olhos verdes */
  // Ombros, veias assimetricas e desenho em V no peito.
  pixel(x+5,y+21,4,2,'#e3262d');pixel(x+23,y+21,4,2,'#e3262d');
  pixel(x+10,y+23,3,2);pixel(x+19,y+23,3,2);
  pixel(x+12,y+25,3,2);pixel(x+17,y+25,3,2);
  pixel(x+14,y+27,4,2,'#ff3030');pixel(x+15,y+29,2,3,'#b71320');
  pixel(x+4,y+29,2,6);pixel(x+6,y+32,2,3,'#ff3030');
  pixel(x+26,y+28,2,7);pixel(x+24,y+32,2,3,'#ff3030');
  // Veias nas pernas, tornozelos e botas.
  pixel(x+11,y+36,2,6,'#bd1420');pixel(x+13,y+39,2,3,'#e3262d');
  pixel(x+21,y+36,2,6,'#bd1420');pixel(x+19,y+40,2,3,'#e3262d');
  pixel(x+9,y+44,6,1);pixel(x+18,y+44,6,1);
 }
 const t=new THREE.CanvasTexture(canvas);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(.25,.25);return t;
}

/* v2 r1: com personagens 3D o Demogorgon usa o mesmo boneco 3D do jogador (atlas8, 16 ângulos 2×) e a mesma DEMO_PAL do laboratório (olhos/veias vermelhos). */
function demoSpawn3D(pt){const tex=atlas8Tex({...DEMO_PAL},16,2),sp=makeActorLitSprite(tex);sp.userData.demo3d=true;sp.userData.actorTint.set(0xffffff);sp.material.alphaTest=.03;sp.material.needsUpdate=true;return {sp,tex}}
function demoSpawn(){const pt=demoRoadPoint();if(!pt)return;
 if(S.sprite8===true){const o=demoSpawn3D(pt);demoEyesMake(o,pt);return}
 const ch=makeCharacter({...DEMO_PAL});
 scene.remove(ch.sh);ch.sh.geometry.dispose();ch.sh.material.dispose();
 const sp=ch.sp;ch.tex.dispose();ch.tex=demoRedAtlas({...DEMO_PAL});sp.material.map=ch.tex;sp.userData.actorTint.set(0xffffff);sp.material.alphaTest=.03;sp.material.opacity=1;sp.material.needsUpdate=true;
 demoEyesMake({sp,tex:ch.tex},pt);
}
// Dois olhos emissivos, visiveis mesmo na noite do Upside Down. Nascem longe (y −9999) até o 1º posicionamento (armadilha 13).
function demoEyesMake(o,pt){const c=cv(48,48),ctx=c.getContext('2d');ctx.clearRect(0,0,48,48);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(24,24,17,0,7);ctx.fill();const eyeTex=new THREE.CanvasTexture(c);
 const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:eyeTex,color:0x2aff48,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,opacity:.68}));gl.scale.set(.15,.15,1);gl.position.set(0,-9999,0);scene.add(gl);const gl2=new THREE.Sprite(gl.material.clone());gl2.scale.set(.15,.15,1);gl2.position.set(0,-9999,0);scene.add(gl2);
 DEMO.list.push({x:pt.x,z:pt.z,sp:o.sp,gl,gl2,tex:o.tex,eyeTex,ph:Math.random()*6.28,dir:Math.random()*4|0,turnT:0,hop:Math.random()*6.28,hitCd:0,route:null,stuck:0,lastX:pt.x,lastZ:pt.z,teleportEvery:DEMO.list.length+1,teleportT:0});
}
/* v2 r1: olhos presos ao desenho. Antes: deslocamento fixo nos eixos do MUNDO (±.19 X, +.14 Z) → saíam da cabeça conforme o ângulo,
   não seguiam o balanço do sprite e apareciam de costas. Agora: posição do olho no quadro do atlas → eixos da câmera (o sprite é
   alinhado à tela, ancorado na base), com a rotação do sprite. 3D: olho do charModel3D (x ±1,89, y 36,67, z 5) girado pelo mesmo
   ângulo que o atlas usa (rotation.y = π − r·2π/N) e projetado pela câmera do atlas (inclinação .17, y de −1,5 a 47,5 → 49 un);
   some quando o rosto vira para trás. 2D: pixels dos olhos do demoRedAtlas (x 13 e 20 de 32, linha 13,5 de 48); some na direção 2. */
/* v2 r2.1: a conta de cima errava de perfil (olho flutuando fora da cabeça). Agora os olhos são LIDOS do próprio atlas:
   em cada quadro (direção × passo) acha os pixels do miolo do olho (#d0ffd8 — único tom verde-claro do boneco) e guarda o centro
   de cada olho em fração do quadro. Feito uma vez por textura (fica no canvas do atlas). */
function demoEyeMap(tex){if(tex.eyeMap)return tex.eyeMap;const c=tex.image,N=tex.dirsN||16;if(!c||!c.getContext)return null;const CW=c.width/4,CH=c.height/N,ctx=c.getContext('2d'),map=[];
 for(let r=0;r<N;r++){const row=[];for(let f=0;f<3;f++){let d;try{d=ctx.getImageData(f*CW,r*CH,CW,CH).data}catch(e){return null}const pts=[];
   for(let y=0;y<CH*.5;y++)for(let x=0;x<CW;x++){const i=(y*CW+x)*4;if(d[i+3]>200&&d[i+1]>150&&d[i]>100&&d[i+1]>d[i])pts.push([x,y])}
   pts.sort((a,b)=>a[0]-b[0]);let cut=-1,gap=2.5;for(let i=1;i<pts.length;i++){const gg=pts[i][0]-pts[i-1][0];if(gg>gap){gap=gg;cut=i}}
   const cen=q=>{let sx=0,sy=0;for(const p of q){sx+=p[0];sy+=p[1]}return{u:(sx/q.length+.5)/CW,v:(sy/q.length+.5)/CH,v8:true}};
   row.push(!pts.length?[]:cut<0?[cen(pts)]:[cen(pts.slice(0,cut)),cen(pts.slice(cut))])}map.push(row)}
 tex.eyeMap=map;return map}
function demoEyes(g,dirI,a,baseY){const e=camera.matrixWorld.elements,SX=g.sp.scale.x,SY=g.sp.scale.y,rot=g.sp.material.rotation||0,cr=Math.cos(rot),sr=Math.sin(rot);
 let L,Rt;const EM=g.tex.isAtlas8?demoEyeMap(g.tex):null;
 if(EM){const N=g.tex.dirsN||16,r=((Math.round(a/(Math.PI*2/N))%N)+N)%N,f=Math.max(0,Math.min(2,g.tex._fr||0)),E=EM[r][f]||[],P=q=>q?{x:(q.u-.5)*SX,h:(1-q.v)*SY,v:true}:{v:false};L=P(E[0]);Rt=P(E[1])}
 else if(g.tex.isAtlas8){const N=g.tex.dirsN||16,q=Math.round(a/(Math.PI*2/N)),th=Math.PI-q*Math.PI*2/N,ct=Math.cos(th),st=Math.sin(th),tc=Math.cos(.17),ts=Math.sin(.17);
  const P=ex=>{const x=ex*ct+5*st,z=-ex*st+5*ct;return{x:x/32*SX,h:((36.67-23)*tc+z*ts+24.5)/49*SY,v:z>1.4}};L=P(-1.89);Rt=P(1.89)}
 else{const v=dirI!==2;L={x:-3/32*SX,h:34.5/48*SY,v};Rt={x:4/32*SX,h:34.5/48*SY,v}}
 const put=(o,E)=>{o.visible=E.v;if(!E.v)return;const x=E.x*cr-E.h*sr,h=E.x*sr+E.h*cr;o.position.set(g.x+e[0]*x+e[4]*h+e[8]*.12,baseY+e[1]*x+e[5]*h+e[9]*.12,g.z+e[2]*x+e[6]*h+e[10]*.12)};
 put(g.gl,L);put(g.gl2,Rt)}
function demoChooseRoad(g){const n=nodeOf(g.x,g.z),dirs=[0,1,2,3].filter(d=>segExists(n[0],n[1],d));
 if(!dirs.length){g.route=null;return}
 let d=dirs[Math.random()*dirs.length|0];if(dirs.includes(g.dir)&&Math.random()<.6)d=g.dir;
 g.dir=d;g.route={x:(n[0]+D[d][0])*P,z:(n[1]+D[d][1])*P};g.turnT=1.4+Math.random()*2.2;
}
function demoTick(dt){if(S.style!=='inverted'||!played||INVERT.switching){if(DEMO.list.length)demoDestroy();return}
 DEMO.spawnT+=dt;for(let attempt=0;attempt<10&&DEMO.list.length<10;attempt++){const before=DEMO.list.length;demoSpawn();if(DEMO.list.length===before)break}
 const target=PL.car||PL,alley=demoAlley(target.x,target.z,1.3);
 for(const g of DEMO.list){g.hitCd=Math.max(0,g.hitCd-dt);g.ph+=dt;g.hop+=dt*10.5;g.turnT-=dt;
 // Dez teleportes individuais: 1, 2, 3, 4, 5, 6, 7, 8, 9 e 10 segundos; sempre em ruas, nunca em becos.
 g.teleportT+=dt;
 if(g.teleportT>=g.teleportEvery){const pt=demoRoadPoint();if(pt){g.x=pt.x;g.z=pt.z;g.route=null;g.stuck=0;g.teleportT%=g.teleportEvery}}
 const dist=Math.hypot(target.x-g.x,target.z-g.z);
 const chase=!PL.dead&&!PL.inside&&!alley&&dist<65&&demoLineClear(g.x,g.z,target.x,target.z);
 let tx,tz;
 if(chase){tx=target.x;tz=target.z;g.route=null}
 else{if(!g.route||g.turnT<=0||Math.hypot(g.route.x-g.x,g.route.z-g.z)<2.5)demoChooseRoad(g);
  tx=g.route?g.route.x:g.x;tz=g.route?g.route.z:g.z}
 const dx=tx-g.x,dz=tz-g.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l;
 const sway=chase?0:Math.sin(g.ph*1.9)*.22;
 const vx=(ux-uz*sway),vz=(uz+ux*sway),vl=Math.hypot(vx,vz)||1;
 const step=Math.min(DEMO.speed*dt,l),nx=g.x+vx/vl*step,nz=g.z+vz/vl*step;
 if(!demoBlocked(nx,nz,.55)&&!demoAlley(nx,nz,1.2)){g.x=nx;g.z=nz}else{g.route=null;g.turnT=0;g.stuck+=dt}
 if(Math.hypot(g.x-g.lastX,g.z-g.lastZ)<.02)g.stuck+=dt;else g.stuck=0;
 g.lastX=g.x;g.lastZ=g.z;if(g.stuck>1.5){const pt=demoRoadPoint();if(pt){g.x=pt.x;g.z=pt.z}g.route=null;g.stuck=0}
 const gy=groundY(g.x,g.z),jump=Math.max(0,Math.sin(g.hop))*.72;
 g.sp.position.set(g.x,gy+.75+jump,g.z);g.sp.scale.set(g.tex.isAtlas8?1.86:2.05,2.85,1);g.sp.material.rotation=Math.sin(g.hop)*.07;
 g.gl.material.opacity=g.gl2.material.opacity=.58+.10*Math.sin(g.ph*5);
 {const dI=pickDir(vx,vz,g.x,g.z),pa=PICK8.a;setFrame(g.tex,dI,Math.floor(g.ph*4)%3);demoEyes(g,dI,pa,gy+.75+jump)}
 if(chase&&dist<1.6&&g.hitCd<=0&&!PL.dead){g.hitCd=1.4;PL.hp-=armorHit(DEMO.damage);rumble(.7,.45,300);ghostSnd(1.3);
  toast('<span style="color:#ff5555">DEMOGORGON · −25 HP</span>');
  if(PL.hp<=0){killPlayer('DEMOGORGON');PL.deadT=.9}}
 }

}
function demoMapDots(g,sc){if(S.style!=='inverted')return;g.save();for(const d of DEMO.list){const x=d.x+MOFF,z=d.z+MOFF,r=4.5/sc;g.fillStyle='#ff2424';g.shadowColor='#ff1717';g.shadowBlur=12/sc;g.beginPath();g.arc(x,z,r,0,7);g.fill()}g.restore()}
function invertPose(r,side){
 const along=r.along,half=.925,skin=.035;
 const lo=(along?r.z0:r.x0)+3,hi=(along?r.z1:r.x1)-3;
 if(hi<=lo)return null;
 const edge=along?(side<0?r.x0:r.x1):(side<0?r.z0:r.z1);
 for(let k=0;k<11;k++){
  const t=k%2===0?.5+(k/2)*.065:.5-((k+1)/2)*.065;
  const v=lo+(hi-lo)*clamp(t,.08,.92);
  // Use a complete, live building face, including the actual lot setback.
  let wall=null,face=0,best=3;
  for(const c of colliders){
   if(c.dead||c.kind!=='bld')continue;
   const cLo=along?c.z0:c.x0,cHi=along?c.z1:c.x1;
   if(v-half<cLo+.08||v+half>cHi-.08)continue;
   const f=along?(side<0?c.x1:c.x0):(side<0?c.z1:c.z0);
   const gap=(edge-f)*(side<0?1:-1);
   if(gap<-.05||gap>best)continue;
   wall=c;face=f;best=gap;
  }
  if(!wall)continue;
  const nx=along?(side<0?1:-1):0,nz=along?0:(side<0?1:-1);
  const px=along?face+nx*skin:v,pz=along?v:face+nz*skin;
  const ax=px+nx*.8,az=pz+nz*.8;
  if((r.bins||[]).some(b=>Math.hypot(ax-b.x,az-b.z)<b.r+1.05))continue;
  if((city.ramps||[]).some(q=>Math.hypot(ax-(q.x+q.dx*q.L*.5),az-(q.z+q.dz*q.L*.5))<q.L*.7+2))continue;
  if(colliders.some(c=>!c.dead&&c!==wall&&c.kind==='bld'&&ax>c.x0-.5&&ax<c.x1+.5&&az>c.z0-.5&&az<c.z1+.5))continue;
  return{x:px,z:pz,a:along?Math.PI/2:0,reach:v,nx,nz,wall,wLo:along?wall.z0:wall.x0,wHi:along?wall.z1:wall.x1};
 }
 return null;
}
// Portal textures: a luminous red heart, a black rim, then black RGB fading to alpha.
function invertPortalTexture(core){
 const key=core?'coreTexture':'rimTexture';if(INVERT[key])return INVERT[key];
 const c=cv(256,256),ctx=c.getContext('2d'),gr=ctx.createRadialGradient(128,128,0,128,128,126);
 const stops=core?[[0,'rgba(255,185,178,1)'],[.24,'rgba(255,113,102,.98)'],[.52,'rgba(255,55,65,.8)'],[.76,'rgba(255,28,45,.24)'],[1,'rgba(255,28,45,0)']]:[[0,'rgba(255,100,100,1)'],[.3,'rgba(255,55,68,1)'],[.5,'rgba(182,13,30,1)'],[.66,'rgba(28,0,4,1)'],[.76,'rgba(0,0,0,1)'],[.86,'rgba(0,0,0,.74)'],[.94,'rgba(0,0,0,.26)'],[1,'rgba(0,0,0,0)']];
 for(const [t,col] of stops)gr.addColorStop(t,col);ctx.fillStyle=gr;ctx.fillRect(0,0,256,256);
 const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;INVERT[key]=tex;return tex;
}
/* v2 r2: mancha de tentáculos na parede da fenda (uma por fenda; desenho novo a cada fenda, só visual: Math.random, não R) */
function invertVeinTexture(W,H){const PX=96,cw=Math.max(64,Math.round(W*PX)),ch=Math.round(H*PX),c=cv(cw,ch),g=c.getContext('2d'),ox=cw/2,oy=ch*.5;
 g.lineCap='round';g.lineJoin='round';
 const arm=(x,y,a,len,w0,depth)=>{let px=x,py=y,ang=a;const n=10+Math.floor(Math.random()*6),st=len/n;
  for(let i=0;i<n;i++){ang+=(Math.random()-.5)*.55;const nx=px+Math.cos(ang)*st,ny=py+Math.sin(ang)*st,k=1-i/n,w=Math.max(.8,w0*k);
   g.strokeStyle='rgba(6,2,3,'+(.95*Math.min(1,k*1.6)).toFixed(3)+')';g.lineWidth=w;g.beginPath();g.moveTo(px,py);g.lineTo(nx,ny);g.stroke();
   if(w>2.2&&Math.random()<.5){g.strokeStyle='rgba(138,20,34,'+(.55*k).toFixed(3)+')';g.lineWidth=Math.max(.7,w*.22);g.beginPath();g.moveTo(px,py);g.lineTo(nx,ny);g.stroke()}
   if(depth<2&&i>1&&Math.random()<.2)arm(nx,ny,ang+(Math.random()<.5?-1:1)*(.5+Math.random()*.6),len*(.25+Math.random()*.3)*k,w*.7,depth+1);
   px=nx;py=ny}};
 const R0=Math.min(cw,ch*1.1)*.47;
 for(let k=0;k<15;k++){const a=k/15*6.283+(Math.random()-.5)*.35,sx=ox+Math.cos(a)*cw*.07,sy=oy+Math.sin(a)*ch*.16;
  const up=Math.sin(a)<0,len=R0*(.55+Math.random()*.45)*(up?1:.75);arm(sx,sy,a,len,9+Math.random()*7,0)}
 const gr=g.createRadialGradient(ox,oy,0,ox,oy,cw*.2);gr.addColorStop(0,'rgba(4,1,2,.95)');gr.addColorStop(.7,'rgba(4,1,2,.6)');gr.addColorStop(1,'rgba(4,1,2,0)');
 g.save();g.translate(ox,oy);g.scale(1,ch*.32/(cw*.2));g.translate(-ox,-oy);g.fillStyle=gr;g.beginPath();g.arc(ox,oy,cw*.2,0,7);g.fill();g.restore();
 const t=new THREE.CanvasTexture(c);t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;return t}
/* v2 r2: fenda estática (laboratório): mancha + núcleo + tentáculos; devolve {g,plane,glow,vein,tex} */
function portalVisualMake(hw,H){const g=new THREE.Group();
 const pm=new THREE.MeshBasicMaterial({map:invertPortalTexture(false),color:0xffffff,transparent:true,opacity:.96,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.85,3.35),pm);plane.position.y=1.9;g.add(plane);
 const rm=new THREE.MeshBasicMaterial({map:invertPortalTexture(true),color:0xffaaa3,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,opacity:.94,toneMapped:false});
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),rm);glow.position.set(0,1.9,.008);glow.scale.set(1.22,2.45,1);glow.renderOrder=1;g.add(glow);
 const tex=invertVeinTexture(hw*2,H),vm=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const vein=new THREE.Mesh(new THREE.PlaneGeometry(hw*2,H),vm);vein.position.set(0,1.9,-.012);vein.renderOrder=-1;g.add(vein);return{g,plane,glow,vein,tex}}
function invertBuildVisual(){
 if(INVERT.group){if(INVERT.group.parent)INVERT.group.parent.remove(INVERT.group);disposeGroup(INVERT.group)}
 if(INVERT.veinTex){INVERT.veinTex.dispose();INVERT.veinTex=null}INVERT.bolts=null;
 if(!city.group||!INVERT.portal)return;
 const p=INVERT.portal,g=new THREE.Group();
 const pm=new THREE.MeshBasicMaterial({map:invertPortalTexture(false),color:0xffffff,transparent:true,opacity:.96,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
 const stain=new THREE.Mesh(new THREE.PlaneGeometry(1.85,3.35),pm);stain.position.y=1.9;stain.rotation.y=p.a;g.add(stain);
 // Keep the bright heart parallel to the wall so its black rim remains visible at every view angle.
 const rm=new THREE.MeshBasicMaterial({map:invertPortalTexture(true),color:0xffaaa3,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,opacity:.94,toneMapped:false});
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),rm);glow.position.set((p.nx||0)*.008,1.9,(p.nz||0)*.008);glow.rotation.y=p.a;glow.scale.set(1.22,2.45,1);glow.renderOrder=1;g.add(glow);
 {const hw=Math.max(1.1,Math.min(2.7,(p.reach-(p.wLo??-1e9))-.06,((p.wHi??1e9)-p.reach)-.06)),H=3.6,tex=invertVeinTexture(hw*2,H);INVERT.veinTex=tex;
  const vm=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  const vein=new THREE.Mesh(new THREE.PlaneGeometry(hw*2,H),vm);vein.position.set(-(p.nx||0)*.012,1.9,-(p.nz||0)*.012);vein.rotation.y=p.a;vein.renderOrder=-1;g.add(vein);INVERT.vein=vein}
 portalBoltsMake(g,INVERT);
 g.position.set(p.x,groundY(p.x,p.z),p.z);city.group.add(g);INVERT.group=g;INVERT.plane=stain;INVERT.glow=glow;invertAnimatePortal();
}
function invertSetPortal(idx,side,quiet){
 if(!INVERT.cands.length){INVERT.portal=null;return}
 const len=INVERT.cands.length,start=((idx%len)+len)%len;
 let found=null;
 for(let k=0;k<len&&!found;k++){
  const j=(start+k)%len,r=INVERT.cands[j];const bb=BR.seg;if(bb&&len>1&&r.x1>bb.x0-20&&r.x0<bb.x1+20&&r.z1>bb.z0-20&&r.z0<bb.z1+20)continue; /* v3 r11: a Fenda não abre no beco que falha (Backrooms) */
  for(const sd of [side||1,-(side||1)]){const pose=invertPose(r,sd);if(pose){found={idx:j,side:sd,pose,r};break}}
 }
 if(!found){INVERT.portal=null;if(INVERT.group)INVERT.group.visible=false;return}
 INVERT.idx=found.idx;INVERT.side=found.side;
 INVERT.portal={...found.pose,ref:found.r};invertBuildVisual();
 if(!quiet&&played&&S.style==='inverted')toast('<span style="color:#ff5860">A FENDA MUDOU DE BECO</span>','wx',3.2)
}
function invertShiftPortal(quiet){
 if(!INVERT.cands.length)return;
 const previous=INVERT.portal&&INVERT.portal.ref;
 // Close at the old site, then prefer another alley. Never flash back into the same opening.
 const options=INVERT.cands.map((r,idx)=>({r,idx})).filter(o=>o.r!==previous);
 for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]]}
 let next=null;
 for(const o of options){for(const side of [-1,1]){if(invertPose(o.r,side)){next={idx:o.idx,side};break}}if(next)break}
 if(INVERT.group){if(INVERT.group.parent)INVERT.group.parent.remove(INVERT.group);disposeGroup(INVERT.group)}
 INVERT.group=INVERT.plane=INVERT.glow=INVERT.vein=null;INVERT.bolts=null;if(INVERT.veinTex){INVERT.veinTex.dispose();INVERT.veinTex=null}INVERT.portal=null;INVERT.shift=60;
 if(next)invertSetPortal(next.idx,next.side,quiet);
}
function invertPortalLife(remaining){
 const age=60-remaining;
 return{scale:1-.88*clamp(age/59,0,1),alpha:remaining>0?1:clamp(1+remaining/.65,0,1),active:remaining>0};
}
function invertAnimatePortal(){
 if(!INVERT.group||!INVERT.portal)return;
 const life=invertPortalLife(INVERT.shift),bob=.08*Math.sin(simT*2.6);
 INVERT.group.visible=life.alpha>0;
 INVERT.plane.scale.set(life.scale,life.scale,1);
 INVERT.plane.material.opacity=(.96+.025*Math.sin(simT*4.4))*life.alpha;
 INVERT.glow.material.opacity=(.9+.09*Math.sin(simT*5.3))*life.alpha;
 INVERT.glow.scale.set((1.22+.035*Math.sin(simT*3.7))*life.scale,(2.45+.06*Math.sin(simT*3.7))*life.scale,1);
 INVERT.plane.position.y=INVERT.glow.position.y=1.9+bob*life.scale;
 if(INVERT.vein){const va=INVERT.shift>0?1:clamp(1+INVERT.shift/.95,0,1),vs=.62+.38*life.scale;INVERT.vein.material.opacity=va*(.9+.06*Math.sin(simT*1.3));INVERT.vein.scale.set(vs,vs,1)}
 INVERT.group.position.y=groundY(INVERT.portal.x,INVERT.portal.z);
}
/* v2 r2: flocos flutuando e raios esparsos saindo de uma fenda (beco ou laboratório). H guarda bolts/boltT/flakeT/glow;
   o = {x,z,nx,nz}; s = tamanho (0..1); on = fenda ativa; gy = chão. Para tudo quando on=false. */
function portalBoltsMake(g,H){H.bolts=[];const rib=()=>{const geo=new THREE.BufferGeometry(),idx=[];geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(32*3),3));for(let i=0;i<15;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}geo.setIndex(idx);geo.setDrawRange(0,0);return geo};
 for(let i=0;i<3;i++){const gc=rib(),gh=rib();
  const core=new THREE.Mesh(gc,new THREE.MeshBasicMaterial({color:0xffe3e6,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  const halo=new THREE.Mesh(gh,new THREE.MeshBasicMaterial({color:0xff2a3a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  for(const o of[core,halo]){o.frustumCulled=false;o.visible=false;o.renderOrder=2;g.add(o)}H.bolts.push({gc,gh,core,halo,t:0})}
 H.boltT=.4+Math.random()*1.2;H.flakeT=0}
function portalFxStep(dt,H,o,s,on,gy,lo){const B=H.bolts;if(!o||!B)return;const L=lo||o,tx=L.nz?1:0,tz=L.nx?1:0,nx=L.nx||0,nz=L.nz||0,wtx=o.nz?1:0,wtz=o.nx?1:0,wnx=o.nx||0,wnz=o.nz||0;
 for(const b of B){if(b.t>0){b.t-=dt;const k=Math.max(0,b.t/b.d);b.core.material.opacity=k;b.halo.material.opacity=.8*k;if(b.t<=0){b.core.visible=b.halo.visible=false}}}
 if(!on)return;
 H.boltT-=dt;if(H.boltT<=0){H.boltT=.6+Math.random()*2.4;const b=B.find(q=>q.t<=0);if(b){
  const a=Math.random()*6.283,ex=Math.cos(a),ey=Math.sin(a),r0x=.52*s,r0y=1.15*s,len=(.7+Math.random()*1.4)*(.5+.5*s),n=7+Math.floor(Math.random()*8),pts=[];
  let u=ex*r0x,y=1.9+ey*r0y,ang=a;for(let i=0;i<n;i++){pts.push([u,y]);ang+=(Math.random()-.5)*1.1;u+=Math.cos(ang)*len/n;y=Math.max(.08,y+Math.sin(ang)*len/n)}
  /* fita no plano da parede: largura perpendicular ao trecho, afinando na ponta */
  for(const[geo,w0,off] of[[b.gc,.022,.035],[b.gh,.075,.03]]){const arr=geo.attributes.position.array;
   for(let i=0;i<n;i++){const P0=pts[Math.max(0,i-1)],P1=pts[Math.min(n-1,i+1)];let du=P1[0]-P0[0],dy=P1[1]-P0[1];const L=Math.hypot(du,dy)||1;du/=L;dy/=L;const w=w0*(1-.7*i/n),pu=-dy*w,py=du*w;
    for(let sgn=0;sgn<2;sgn++){const k=(i*2+sgn)*3,q=sgn?-1:1,uu=pts[i][0]+pu*q;arr[k]=tx*uu+nx*off;arr[k+1]=pts[i][1]+py*q;arr[k+2]=tz*uu+nz*off}}
   geo.attributes.position.needsUpdate=true;geo.setDrawRange(0,(n-1)*6)}
  b.d=b.t=.1+Math.random()*.14;b.core.visible=b.halo.visible=true;b.core.material.opacity=1;b.halo.material.opacity=.8;
  if(H.glow)H.glow.material.opacity=Math.min(1,H.glow.material.opacity+.1);
  if(Math.random()<.35){H.boltT=.05+Math.random()*.1}}}
 H.flakeT+=dt*(3.5+2*s);while(H.flakeT>=1){H.flakeT-=1;const u=(Math.random()-.5)*.9*s,y=gy+1.9+(Math.random()-.5)*2*s,out=.18+Math.random()*.32;
  emit(o.x+wtx*u+wnx*.08,y,o.z+wtz*u+wnz*.08,wnx*out+wtx*(Math.random()-.5)*.25,.04+Math.random()*.14,wnz*out+wtz*(Math.random()-.5)*.25,3.2+Math.random()*1.6,.2,.5,Math.random()<.3?0xffc8cc:0xf2eef0,false,.32);parts[partI].nograv=true}}
function invertPortalFx(dt){const o=INVERT.portal;if(!o||!INVERT.group||!INVERT.bolts)return;const life=invertPortalLife(INVERT.shift),P=PL.car||PL,near=Math.abs(P.x-o.x)<70&&Math.abs(P.z-o.z)<70;
 portalFxStep(dt,INVERT,o,life.scale,life.active&&INVERT.group.visible&&near,INVERT.group.position.y)}
function invertInitCity(){invertCityReset();INVERT.cands=(city.alleySites||[]).filter(r=>!r.ramp&&!r.weapon);const interior=INVERT.cands.filter(r=>r.interior&&(invertPose(r,-1)||invertPose(r,1)));if(interior.length)INVERT.cands=interior;if(!INVERT.cands.length)return;INVERT.shift=isFinite(INVERT.shift)&&INVERT.shift>=-1?INVERT.shift:60;invertSetPortal(Math.min(INVERT.idx,INVERT.cands.length-1),INVERT.side||1,true)}
function applyInvertState(d){if(!d){INVERT.shift=60;INVERT.idx=0;INVERT.side=1;INVERT.homeTod=null;INVERT.homeDay=0;if(INVERT.cands.length)invertSetPortal(0,1,true);return}INVERT.shift=Number.isFinite(d.shift)?clamp(d.shift,-1,60):INVERT.shift;INVERT.idx=typeof d.idx==='number'?d.idx:INVERT.idx;INVERT.side=d.side===-1?-1:1;INVERT.homeTod=typeof d.homeTod==='number'?d.homeTod:null;INVERT.homeDay=d.homeDay||0;if(INVERT.cands.length)invertSetPortal(INVERT.idx,INVERT.side,true)}
function invertGhostSpawn(){const p=PL.car||PL;for(let k=0;k<18;k++){const a=Math.random()*6.283,d=22+Math.random()*46,x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;if(Math.abs(x-p.x)>110||Math.abs(z-p.z)>110||inWater(x,z)||riverZone(x,z))continue;
 const ch=makeCharacter({cap:Math.random()<.3?'#d8dae4':null,capDark:null,skin:'#eef0f8',hair:'#b8bccc',shirt:'#f6f6fc',pants:'#d4d6e2',shoes:'#a8acbc',belt:'#c4c6d4',stripe:Math.random()<.4?'#c8cad8':null,glasses:null,necklace:null,long:Math.random()<.4}),sp=ch.sp;
 scene.remove(ch.sh);ch.sh.geometry.dispose();ch.sh.material.dispose();
 sp.material.alphaTest=.02;sp.material.opacity=0;sp.material.depthWrite=false;sp.userData.actorTint.setRGB(.92,.95,1.1);sp.material.needsUpdate=true;
 const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xd8deff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0}));gl.scale.set(5,5,1);scene.add(gl);
 INVERT.ghosts.push({x,z,sp,gl,tex:ch.tex,ph:Math.random()*6.28,a:0,mx:0,mz:1});break}}
/* v2 r1 · efeito da Fenda (Mundo Invertido) no lugar da tela de carregamento: captura o último quadro, a fenda rasga a tela
   (camadas CSS só com transform/opacity → lisas mesmo com o JS ocupado gerando a cidade) e uma barra fina no rodapé.
   A barra segue o progresso real (setLoadProgress) e, entre uma atualização e outra, avança sozinha por animação de composição,
   sempre para frente (nunca volta). TRAVEL guarda os tempos da última travessia (MONITOR → TRAVEL). */
const RIFT={on:false,cover:false,el:null,a:0,b:0,t0:0,dur:1};const TRAVEL={last:null};
function riftBuild(){if(RIFT.el)return RIFT.el;const d=document.createElement('div');d.id='riftFx';d.hidden=true;d.setAttribute('aria-hidden','true');document.body.appendChild(d);RIFT.el=d;return d}
function riftCrackSVG(glow){let x=50;const pts=[];for(let y=-2;y<=102;y+=3.2){x=Math.max(30,Math.min(70,x+(Math.random()-.5)*14));pts.push([x,y])}
 const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');const br=[];for(let k=0;k<7;k++){const p=pts[2+Math.floor(Math.random()*(pts.length-4))],dir=Math.random()<.5?-1:1;let bx=p[0],by=p[1],q='M'+bx.toFixed(1)+' '+by.toFixed(1);for(let j=0;j<3;j++){bx+=dir*(4+Math.random()*7);by+=(Math.random()-.5)*6;q+=' L'+bx.toFixed(1)+' '+by.toFixed(1)}br.push(q)}
 const P=(dd,c,w)=>'<path d="'+dd+'" stroke="'+c+'" stroke-width="'+w+'" fill="none" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
 return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+P(d,'#ff1e3a33',34)+P(d,'#ff2a3a55',16)+P(d,'#ff2a3a',5)+P(d,'#ffe3e6',1.6)+br.map(q=>P(q,'#ff3b4c',1.4)).join('')+'</svg>'}
function riftVeinsSVG(){const out=[];const edge=()=>{const sd=Math.floor(Math.random()*4),t=Math.random()*100;return sd===0?[t,-3]:sd===1?[t,103]:sd===2?[-3,t]:[103,t]};const f1=v=>v.toFixed(1);
 for(let k=0;k<26;k++){const a=edge(),cx=50+(Math.random()-.5)*30,cy=50+(Math.random()-.5)*50,f=.35+Math.random()*.35,ex=a[0]+(cx-a[0])*f,ey=a[1]+(cy-a[1])*f,m1=[a[0]+(Math.random()-.5)*30,a[1]+(Math.random()-.5)*30],m2=[ex+(Math.random()-.5)*20,ey+(Math.random()-.5)*20],w=(1+Math.random()*4.5).toFixed(1);
  const dd='M'+f1(a[0])+' '+f1(a[1])+' C'+f1(m1[0])+' '+f1(m1[1])+' '+f1(m2[0])+' '+f1(m2[1])+' '+f1(ex)+' '+f1(ey);
  out.push('<path d="'+dd+'" stroke="#060203" stroke-width="'+w+'" stroke-linecap="round" fill="none" vector-effect="non-scaling-stroke"/>');
  if(Math.random()<.7)out.push('<path d="'+dd+'" stroke="#8a1422" stroke-width="1.1" fill="none" vector-effect="non-scaling-stroke"/>')}
 return '<svg class="rfVein" viewBox="0 0 100 100" preserveAspectRatio="none">'+out.join('')+'</svg>'}
function riftBarSet(p){const el=RIFT.el&&RIFT.el.querySelector('#riftBar i');if(!el)return;const now=performance.now(),k=Math.min(1,(now-RIFT.t0)/RIFT.dur),e=1-Math.pow(1-k,2),cur=RIFT.a+(RIFT.b-RIFT.a)*e;
 const a=Math.max(cur,Math.min(1,p)),b=a>=1?1:Math.min(.97,a+.14),dur=a>=1?250:9000;RIFT.a=a;RIFT.b=b;RIFT.t0=now;RIFT.dur=dur;
 el.style.setProperty('--a',a.toFixed(4));el.style.setProperty('--b',b.toFixed(4));el.style.setProperty('--t',dur+'ms');el.style.animation='none';void el.offsetWidth;el.style.animation=''}
async function riftIn(){const d=riftBuild();RIFT.on=true;RIFT.a=0;RIFT.b=0;RIFT.t0=performance.now();RIFT.dur=1;d.className='';
 const w=Math.max(2,Math.round(innerWidth*.6)),h=Math.max(2,Math.round(innerHeight*.6)),snap=document.createElement('canvas');snap.width=w;snap.height=h;snap.className='rfSnap';
 try{render();snap.getContext('2d').drawImage(renderer.domElement,0,0,w,h)}catch(e){}
 let motes='';for(let i=0;i<18;i++){const sz=(1.5+Math.random()*3.5).toFixed(1);motes+='<i class="rfMote" style="--s:'+sz+'px;--x:'+(Math.random()*100).toFixed(1)+'%;--y:'+(Math.random()*100).toFixed(1)+'%;--d:'+(5+Math.random()*7).toFixed(1)+'s;--w:-'+(Math.random()*8).toFixed(1)+'s;--dx:'+((Math.random()-.5)*60).toFixed(0)+'px;--dy:'+(-20-Math.random()*60).toFixed(0)+'px"></i>'}
 d.innerHTML='<div class="rfRed"></div>'+riftVeinsSVG()+'<div class="rfCrack">'+riftCrackSVG()+'</div>'+motes+'<div id="riftBar"><i></i></div>';
 d.insertBefore(snap,d.firstChild);d.hidden=false;RIFT.cover=true;riftBarSet(.02);await nextTimeFrame();await nextTimeFrame();await delayTimeJump(1050)}
async function riftOut(){const d=RIFT.el;if(!d)return;riftBarSet(1);RIFT.cover=false;try{render()}catch(e){}await nextTimeFrame();d.classList.add('out');await delayTimeJump(900);d.hidden=true;d.className='';d.innerHTML='';RIFT.on=false}
function riftAbort(){if(RIFT.el){RIFT.el.hidden=true;RIFT.el.innerHTML='';RIFT.el.className=''}RIFT.on=false;RIFT.cover=false}
function travelLog(kind,T){TRAVEL.last={kind,...T};const f=v=>(v/1000).toFixed(1)+'s';const el=document.getElementById('mTrav');if(el)el.textContent=f(T.total)+' (city '+f(T.gen)+' · GPU '+f(T.gpu)+')';console.info('['+kind+'] travessia '+f(T.total)+' · gerar cidade '+f(T.gen)+' · preparar GPU '+f(T.gpu))}
async function invertShiftWorld(target,msg,death,opt){opt=opt||{};if(INVERT.switching||HAZE.switching||TIMEJUMP.busy||TIMEJUMP.loading)return;INVERT.switching=true;if(opt.fromLab){labClearPeds();PL.inside=false;if(LAB.grp)LAB.grp.visible=false;if(LAB.arrIn)LAB.arrIn.visible=false;const h=LAB.hatch;if(h){try{doorExit({x:h.x+h.nx*1.8,z:h.z+h.nz*1.8,nx:h.nx,nz:h.nz})}catch(e){}}if(POL.wanted)endWanted(true,true)}const loading=$('#loading'),fade=$('#timeFade');let snap=null;try{snap=buildSave()}catch(e){console.warn('Invert snapshot',e)}if(!snap)snap={v:1,seed:S.seed,size:S.size,style:S.style,tod:DN.tod,day:DN.day||0,x:PL.x,z:PL.z,hp:Math.max(1,PL.hp||100),car:null,garage:SAFE.stored,safeHeli:safeHeliSave(),gun:maskGunSave(),ammoUp:AMMO.up,money:PL.money||0,picked:[...city.picked],stunts:[...(city.stunts||[])],look:MASK.original?{...MASK.original}:{...PLAYER_PAL},wardrobe:wearSave(),wardrobeChars:wearChars(),kits:CHAR.list.map((c,i)=>i===CHAR.cur?null:(c.kit||null)),cheatUsed:!!CHEAT.used,moneyChars:CHAR.list.map((c,i)=>i===CHAR.cur?(PL.money||0):(c.cash||0)),wxs:wxState(),inv:invertStateSave()};if(S.style!=='inverted'&&target==='inverted'){INVERT.homeTod=DN.tod;INVERT.homeDay=DN.day||0}snap.style=target;if(opt.fromLab){const hm=HAZE.home||hazeHomeFallback();snap.seed=hm.seed;snap.size=hm.size;snap.car=null;snap.wantedZones=[]}snap.inv=invertStateSave();if(target==='inverted'){snap.tod=180;snap.day=INVERT.homeDay}else if(target==='modern'&&INVERT.homeTod!==null){snap.tod=INVERT.homeTod;snap.day=INVERT.homeDay}if(death){snap.car=null;snap.hp=100}const TT={t0:performance.now()};try{musicTravelOut();await riftIn();S.style=target;if(opt.fromLab){S.seed=snap.seed;S.size=snap.size}clearRiverBoats();const g0=performance.now();await generateCity();TT.gen=performance.now()-g0;initRiverBoats();applyShadows();setLoadProgress(48);await nextTimeFrame();const w0=performance.now();await warmCityGPU();TT.gpu=performance.now()-w0;applySave(snap);if(opt.fromLab){PL.inside=false;const o=INVERT.portal;if(o){PL.x=o.x;PL.z=o.z;PL.gy=groundY(o.x,o.z)}else respawnBase()}if(!death)invertArriveClear();if(target==='modern'&&!death&&snap.style==='modern'&&!PL.dead){PL.money=(PL.money||0)+1500;toast('VOCÊ SOBREVIVEU AO UPSIDE DOWN · +$1.500')}if(death&&target==='modern'){if(PL.car){PL.lastCar=PL.car;PL.car=null;PL.sp.visible=true;PL.sh.visible=true;$('#speed').hidden=true;$('#carbar').hidden=true}respawnBase()}updateDayNight(0,true);syncMenu();musicTravelIn();updateCamera(0);await riftOut();TT.total=performance.now()-TT.t0;travelLog('Fenda',TT);toast(target==='inverted'?'<span style="color:#ff5860">UPSIDE DOWN</span><br><small style="font-size:11px;color:#fff">03:00</small>':'<span style="color:#ffd27a">você escapou da fenda</span>')}catch(err){musicTravelReset();console.error('Fenda temporal:',err);riftAbort();loading.hidden=true;fade.hidden=true;fade.style.opacity='0';toast('ERRO NA TRAVESSIA · VEJA O CONSOLE DO NAVEGADOR')}finally{INVERT.switching=false;INVERT.deathReturn=false}}
/* ================= POINT HAZE: travessia de lancha =================
   De Sunset Shores (modern/synthwave), 300 m mar adentro numa lancha -> a ilha. Da ilha, 300 m para fora -> volta.
   A seed da ilha deriva da seed da cidade; na chegada todo nível de procurado some. */
const HAZE={home:null,switching:false,el:null};
function hazeSeed(s){return((s^0x7a1e2d3b)>>>0)||1}
function hazeHomeFallback(){return{seed:(S.seed^0x7a1e2d3b)>>>0,size:normalizeCitySize(S.size),style:'modern',t:.5}}
function hazeMeter(){if(HAZE.el)return HAZE.el;const d=document.createElement('div');d.id='hazeMeter';d.hidden=true;d.innerHTML='<b></b><div class="hzBar"><i></i></div><span></span>';document.body.appendChild(d);HAZE.el=d;return d}
/* v2 r6.1: a travessia vale para o JOGADOR, seja como for que ele chegue a 300 m da costa (barco, jet ski, hovercraft, helicóptero,
   a pé de Maskara ou qualquer veículo/modo novo que ande na água). Carro comum afunda antes, então não chega. */
function hazeTick(dt){const el=hazeMeter(),c=PL.heli?(PL.heli.phase==='fly'?{x:PL.heli.x,z:PL.heli.z,t:{},heli:true}:null):PL.car?PL.car:(!PL.inside?{x:PL.x,z:PL.z,t:{},foot:true}:null); /* v78: Nathan de Maskara vai a pé (correndo no mar) */
 if(!played||!running||PL.dead||PL.inside||HAZE.switching||INVERT.switching||TIMEJUMP.busy||TIMEJUMP.loading||S.style==='inverted'||!c||!city.ext){el.hidden=true;return}
 const u=outDist(c.x,c.z)-SHORE;if(u<=0||(!city.haze&&riverZone(c.x,c.z))){el.hidden=true;return}
 const m=clamp(u,0,300);el.hidden=true;el.firstChild.textContent=city.haze?'SUNSET SHORES':'POINT HAZE';el.querySelector('i').style.width=(m/300*100).toFixed(1)+'%';el.lastChild.textContent=Math.round(m)+' / 300 m';
 if(u>=300){el.hidden=true;if(storyOK('haze'))void hazeShift(!city.haze);else storyLocked('MAR AGITADO DEMAIS PRA SEGUIR')}}
function hazeBoard(v){v.sleep=false;v.hand=false;v.thr=0;v.vx=v.vz=0;if(v.mode==='rail')toPhys(v);PL.car=v;PL.x=v.x;PL.z=v.z;PL.vx=PL.vz=0;PL.sp.visible=false;PL.sh.visible=false;$('#speed').hidden=false;$('#carbar').hidden=false;camT.x=v.x;camT.z=v.z;if(camMode==='fps')chasePos.set(v.x-Math.cos(v.a)*9,4,v.z-Math.sin(v.a)*9)}
async function hazeShift(toHaze){if(HAZE.switching||INVERT.switching||TIMEJUMP.busy||TIMEJUMP.loading)return;HAZE.switching=true;const loading=$('#loading'),fade=$('#timeFade');
 const viaHeli=!!PL.heli,viaFoot=!viaHeli&&!PL.car,boat=viaHeli?{x:PL.heli.x,z:PL.heli.z}:viaFoot?{x:PL.x,z:PL.z}:PL.car,col=!viaHeli&&boat&&boat.color,vType=!viaHeli&&!viaFoot&&boat&&boat.type&&VT[boat.type]?boat.type:'boat',E0=city.ext,tAlong=boat?clamp((city.coast<2?boat.x:boat.z)/E0,.1,.9):.5;
 let snap=null;try{snap=buildSave()}catch(e){console.warn('Haze snapshot',e)}const maskKeep=MASK.original&&!MASK.off?{...MASK.original}:null;const kitKeep=maskKeep?MASK.kit:null; /* v78: a Maskara atravessa o mar junto */
 try{if(!snap)throw new Error('sem snapshot');musicTravelOut();
  if(toHaze){HAZE.home={seed:S.seed,size:S.size,style:S.style,t:tAlong};snap.seed=hazeSeed(S.seed);snap.style='haze'}
  else{const hm=HAZE.home||hazeHomeFallback();snap.seed=hm.seed;snap.size=hm.size;snap.style=STYLES[hm.style]&&hm.style!=='haze'?hm.style:'modern'}
  snap.car=null;snap.wantedZones=[];if(POL.wanted)endWanted(true,true);
  await camSky(true);timeFadeTo(true);await delayTimeJump(650);loading.hidden=false;setLoadProgress(10,toHaze?'NAVEGANDO PARA A NÉVOA…':'VOLTANDO PARA SUNSET SHORES…');await nextTimeFrame();fade.hidden=true;fade.style.opacity='0';
  if(viaHeli){try{heliSnd(PL.heli,false)}catch(e){}HELI.cur=null;PL.heli=null}PL.car=null;PL.sp.visible=true;PL.sh.visible=true;
  S.seed=snap.seed;S.size=snap.size;S.style=snap.style;clearRiverBoats();await generateCity();initRiverBoats();applyShadows();
  setLoadProgress(48,toHaze?'POINT HAZE SURGINDO NO HORIZONTE…':'AVISTANDO A COSTA…');await nextTimeFrame();await warmCityGPU();
  applySave(snap);if(maskKeep){MASK.original=maskKeep;MASK.kit=kitKeep;MASK.off=false;Object.assign(PLAYER_PAL,MASK_SUIT,{handSkin:maskKeep.skin});applyPlayerLook()}WZ.list.length=0;WZ.crime=null;POL.wanted=false;
  {const cs=city.coast,inl=cs===0?[0,1]:cs===1?[0,-1]:cs===2?[1,0]:[-1,0],a=Math.atan2(inl[1],inl[0]),E=city.ext;let v=null,x,z;
   if(toHaze){const p=(city.piers||[]).find(q=>q.id==='marina');v=vType!=='boat'?null:vehicles.find(q=>q.spotId==='marina'&&q.t.boat)||null; /* v78: chega no MESMO tipo de embarcação (jet ski continua jet ski, ida e volta) */x=(p?p.boat.x:E/2)-inl[0]*28;z=(p?p.boat.z:E/2)-inl[1]*28}
   else{const t=E*(HAZE.home?HAZE.home.t:.5),q=wTU(cs,t,SHORE+45);x=q[0];z=q[1]}
   if(viaHeli){if(v&&vehicles.includes(v)&&!toHaze)removeVehicle(v);const hl=heliAddPad(x,z,a,'hz'+Date.now());hl.noReturn=true;heliBoard(hl);hl.phase='fly';hl.y=HELI_ALT*.6;hl.v=20;hl.yaw=a;PL.x=x;PL.z=z}
   else if(viaFoot){PL.x=x;PL.z=z;PL.vx=PL.vz=0;
    /* sem Maskara (ou outro jeito de andar na água) não chega boiando: anda para a terra até sair da água */
    if(!maskOn()){for(let k=0;k<120&&inWater(PL.x,PL.z);k++){PL.x+=inl[0]*3;PL.z+=inl[1]*3}PL.gy=groundY(PL.x,PL.z)}else PL.gy=waterLevel(x,z)}
   else{if(!v)v=makeVehicle(vType,x,z,a,col||'#c8282a');v.x=x;v.z=z;v.a=a;hazeBoard(v)}}
  updateDayNight(0,true);syncMenu();setLoadProgress(100,toHaze?'POINT HAZE':'SUNSET SHORES');fade.hidden=false;fade.style.transition='none';fade.style.opacity='1';await nextTimeFrame();loading.hidden=true;musicTravelIn();updateCamera(0);await nextTimeFrame();camSkyStart(false);fade.style.transition='opacity .6s ease-in-out';fade.style.opacity='0';await delayTimeJump(650);fade.hidden=true;await camSkyWait();
  toast(toHaze?'<span style="color:#c9c2a8">POINT HAZE</span>':'<span style="color:#ffd27a">SUNSET SHORES</span>')}
 catch(err){musicTravelReset();console.error('Point Haze:',err);loading.hidden=true;fade.hidden=true;fade.style.opacity='0';toast('ERRO NA TRAVESSIA · VEJA O CONSOLE DO NAVEGADOR')}finally{HAZE.switching=false}}
/* dev r2.4: a Fenda fica no mesmo beco nos dois mundos e a chegada usa a posição da entrada → o jogador nascia dentro do gatilho
   e voltava no quadro seguinte (loop infinito parado). Na chegada: sai alguns metros para o beco, de costas para a parede,
   e o gatilho só rearma depois de se afastar. */
function invertTrigR(){return PL.car?2.8:1.25}
function invertArriveClear(){INVERT.rearm=true;const o=INVERT.portal,p=PL.car||PL;if(!o||PL.dead)return;
 if(Math.hypot(p.x-o.x,p.z-o.z)>invertTrigR()+1.2)return;
 const nx=o.nx||0,nz=o.nz||0,k=PL.car?4.6:2.6,q={x:o.x+nx*k,z:o.z+nz*k};circleVsWorld(q,PL.car?.9:.4);
 if(PL.car){const c=PL.car;c.x=q.x;c.z=q.z;c.vx=c.vz=0;c.fwd=0;c.a=Math.atan2(nz,nx);try{syncCar(c,0)}catch(e){}}
 else{PL.face=[nx,nz];PL.yaw=Math.atan2(-nx,-nz)}
 PL.x=q.x;PL.z=q.z;PL.gy=groundY(q.x,q.z);PL.vx=PL.vz=0;camT.x=q.x;camT.z=q.z}
function invertTick(dt){if(!INVERT.cands.length)return;
 // Same simulation minutes as DN.tod: menus pause both, cheats do not reset this timer.
 INVERT.shift-=dt;
 if(INVERT.shift<=-1)invertShiftPortal(false);
 if(INVERT.shift>0&&INVERT.portal&&INVERT.portal.wall&&INVERT.portal.wall.dead)invertSetPortal(INVERT.idx,INVERT.side,true);
 invertAnimatePortal();invertPortalFx(dt);
 const p=PL.car||PL,o=INVERT.portal,pd=o?Math.hypot(p.x-o.x,p.z-o.z):1e9;if(INVERT.rearm&&pd>invertTrigR()+1.5)INVERT.rearm=false;if(INVERT.shift>0&&!INVERT.rearm&&!PL.dead&&!PL.inside&&o&&pd<invertTrigR()&&!INVERT.switching&&storyOK('rift'))void invertShiftWorld(S.style==='inverted'?'modern':'inverted',S.style==='inverted'?'FECHANDO A FENDA…':'CAINDO PELA FENDA…',false);if(S.style!=='inverted'){demoDestroy();invertClearGhosts();return}demoTick(dt);INVERT.hitCd=Math.max(0,INVERT.hitCd-dt);const want=Math.max(2,Math.min(6,Math.round(city.N*.32)));if(INVERT.ghosts.length<want&&Math.random()<dt*(.55+.08*want))invertGhostSpawn();for(const g of INVERT.ghosts.slice()){g.ph+=dt;const tgt=PL.car||PL,dx=tgt.x-g.x,dz=tgt.z-g.z,dist=Math.hypot(dx,dz)||1;if(dist>160){invertKillGhost(g);continue}g.mx=dx/dist;g.mz=dz/dist;const sp=PL.car?1.85:2.8;g.x+=g.mx*Math.min(dist,sp*dt)+Math.sin(g.ph*1.7)*dt*.4;g.z+=g.mz*Math.min(dist,sp*dt)+Math.cos(g.ph*1.5)*dt*.4;g.a=Math.min(1,g.a+dt*.8);const gy=groundY(g.x,g.z)+.55+Math.sin(g.ph*2.2)*.17;g.sp.position.set(g.x,gy+(camMode==='top'&&!VIEW.orbit?.9:0),g.z);g.sp.scale.set((camMode==='top'&&!VIEW.orbit?1.7:1.3),camMode==='top'&&!VIEW.orbit?2.4:1.9,1);g.sp.material.opacity=g.a*(.65+.15*Math.sin(g.ph*7));g.sp.material.rotation=Math.sin(g.ph*1.9)*.06;g.gl.position.set(g.x,gy+1,g.z);g.gl.material.opacity=g.a*.22;const top=camMode==='top'&&!VIEW.orbit;setFrame(g.tex,pickDir(g.mx,g.mz,g.x,g.z),Math.floor(g.ph*2.5)%4===1?1:Math.floor(g.ph*2.5)%4===3?2:0);if(Math.random()<dt*4){emit(g.x+(Math.random()-.5)*.7,gy-.2+Math.random()*.6,g.z+(Math.random()-.5)*.7,(Math.random()-.5)*.12,(Math.random()-.5)*.08,(Math.random()-.5)*.12,2.4,.225,.55,0xe7ebff,false,.28);parts[partI].nograv=true} /* dev r2.4: flocos do fantasma suspensos (sem gravidade, deriva lenta) e metade do diâmetro */if(!PL.car&&INVERT.hitCd<=0&&dist<.95){INVERT.hitCd=1.05;PL.hp-=armorHit(20);rumble(.6,.38,260);ghostSnd(1);for(let i=0;i<8;i++)emit(PL.x,1.1,PL.z,(Math.random()-.5)*2.5,Math.random()*2,(Math.random()-.5)*2.5,.5,.3,.1,0xdfe6ff,true,.9);toast('<span style="color:#dfe6ff">O FANTASMA TE TOCOU</span> · −20 HP');if(PL.hp<=0){killPlayer('ASSOMBRADO');PL.deadT=.9}}}const fx=PL.car||PL;if(Math.random()<dt*26)emit(fx.x+(Math.random()-.5)*34,1+Math.random()*8,fx.z+(Math.random()-.5)*34,(WX.wx||.18)*.16+(Math.random()-.5)*.08,-.18-Math.random()*.12,(WX.wz||.08)*.16+(Math.random()-.5)*.08,.13,.22,1.9,0xf4f4f6,false,.4);if(Math.random()<dt*8)emit(fx.x+(Math.random()-.5)*26,.35,fx.z+(Math.random()-.5)*26,(Math.random()-.5)*.1,.08,(Math.random()-.5)*.1,2.2,.8,3.8,0xd8d8dc,false,.18)}



function lhC(L,u){const k=clamp((u-L.u0)/(L.uC-L.u0),0,1),q=k*k*(3-2*k);return L.t+(L.off||0)*(1-q)}
// Meia-largura do caminho: alarga na saída da praia e, no fim, abre até o raio da ponta redonda (tangente, sem canto).
function lhW(L,u){const k=clamp((u-(L.uC-L.pad-8))/8,0,1);return L.hw+3.4*Math.pow(clamp(1-(u-L.u0)/7,0,1),2)+(L.pad-L.hw)*k*k*(3-2*k)}
// Faixa do caminho do farol (com folga m) — usada para não espalhar objetos de praia em cima dele.
function lhNear(x,z,m){const L=city.lh;if(!L)return false;const u=outDist(x,z);if(u<L.u0-m||u>L.uC+L.pad+m)return false;return Math.abs((city.coast<2?x:z)-lhC(L,u))<lhW(L,u)+m||Math.hypot(x-L.cx,z-L.cz)<L.pad+m}
function lhLand(x,z){const L=city.lh;if(!L)return false;const u=outDist(x,z);if(u<L.u0-1||u>L.uC+L.pad+1)return false;
 return(u<=L.uC&&Math.abs((city.coast<2?x:z)-lhC(L,u))<lhW(L,u))||Math.hypot(x-L.cx,z-L.cz)<L.pad}
function worldGen2(grp,st){const E=city.ext,night=!!st.synth,M=city.M,o=RW/2;
 WLD.pools.clear();WLD.grills.clear();LH.up=false;LH.fall=false;LH.fv=0;LH.cool=0;WLD.cem.f=0;WLD.cem.msg=false;
 city.mausoleum=null;city.polDoor=null;city.cem=null;city.lh=null;
 M.sand=surfPatch(new THREE.MeshStandardMaterial({map:worldSandTex(),vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),'sand'); /* v3 r33: areia porosa (SURF) */
 M.foam=S.style==='inverted'?new THREE.MeshBasicMaterial({map:worldFoamTex(),vertexColors:true,color:0x6a6e78,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.28,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}):new THREE.MeshBasicMaterial({map:worldFoamTex(),vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,opacity:night?.5:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
 M.sign=st.noWindows?new THREE.MeshLambertMaterial({map:worldSignAtlas(),color:0xb8bcc2,transparent:true,alphaTest:.04,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}):new THREE.MeshBasicMaterial({map:worldSignAtlas(),transparent:true,alphaTest:.04,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6});
 // cemitério
 const lc=city.lms.find(l=>l.name==='cem');if(lc){const r=city.rects[lc.ri];city.cem={x:lc.x,z:lc.z,rect:[r[0]+SW,r[1]+SW,r[2]-SW,r[3]-SW]}}
 skyMat.uniforms.gC.value.set(lc?lc.x:0,lc?lc.z:0,340,0);
 // Point Haze: só espuma, contornando a ilha inteira
 if(city.haze){const fm=new MB(),K=240,pts=[];for(let k=0;k<=K;k++)pts.push(hazeRay(k/K*6.2832,SHORE+.3));
  for(let k=0;k<K;k++){const a=pts[k],b=pts[k+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;worldFoamStrip(fm,a[0],a[1],b[0],b[1],dz/L,-dx/L,11,SEA_Y+.035)}
  const fmesh=fm.mesh(M.foam,false,false);if(fmesh){fmesh.renderOrder=3;fmesh.frustumCulled=false;grp.add(fmesh)}return}
 // farol: na ponta livre da praia
 {const s=city.coast,sp=city.coastSpan,rs=mulberry32((S.seed^0x7c3a5d21)>>>0);let tend,dir;
  if(!sp){const e=rs()<.5;tend=e?-o-SW:E+o+SW;dir=e?1:-1}else if(sp[0]<0){tend=-o-SW;dir=1}else{tend=E+o+SW;dir=-1}
  const t=tend+dir*26,uC=SHORE+38,c=wTU(s,t,uC),inl=s===0?[0,1]:s===1?[0,-1]:s===2?[1,0]:[-1,0],sea=[-inl[0],-inl[1]],R0=3.05,R1=2.15,H=24.2;
  city.lh={s,t,uC,cx:c[0],cz:c[1],hw:4.4,pad:6.8,inl,sea,R0,R1,H,rail:4.4,porch:1.7,
   door:[c[0]+inl[0]*(R0+1.7+.65),c[1]+inl[1]*(R0+1.7+.65)],out:[c[0]+inl[0]*(R0+1.7+3.4),c[1]+inl[1]*(R0+1.7+3.4)],
   arrive:[c[0]+inl[0]*3.9,c[1]+inl[1]*3.9],topDoor:[c[0]+sea[0]*3.3,c[1]+sea[1]*3.3]};
  const L=city.lh;{const hr=mulberry32((S.seed^0x51a7c0de)>>>0);L.u0=SAND_FLAT;L.off=(hr()<.5?-1:1)*(7+hr()*6)}
  // feixe giratório + brilho da lâmpada (só à noite)
  const bg=new THREE.CylinderGeometry(7.5,.2,170,14,6,true);bg.rotateZ(-Math.PI/2);bg.translate(85,0,0);
  {const pa=bg.attributes.position,col=new Float32Array(pa.count*3);for(let i=0;i<pa.count;i++){const k=clamp(pa.getX(i)/170,0,1),v=Math.pow(1-k,1.25)*(k<.03?k/.03:1);col[i*3]=col[i*3+1]=col[i*3+2]=v}bg.setAttribute('color',new THREE.BufferAttribute(col,3))}
  const bm=new THREE.MeshBasicMaterial({color:night?0xffc8f0:0xfff0b8,vertexColors:true,transparent:true,opacity:.34,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const beam=new THREE.Group();beam.add(new THREE.Mesh(bg,bm));const b2=new THREE.Mesh(bg,bm);b2.rotation.y=Math.PI;beam.add(b2);beam.position.set(L.cx,L.H+2.1,L.cz);beam.visible=false;beam.traverse(q=>q.frustumCulled=false);grp.add(beam);LH.beam=beam;
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:night?0xffa0e0:0xfff0b0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.9}));gl.scale.set(15,15,1);gl.position.set(L.cx,L.H+2.1,L.cz);gl.visible=false;grp.add(gl);LH.glow=gl;
  // espuma do mar ao longo de toda a costa + em volta da barra
  const fm=new MB(),W=SHORE+.3,a=wTU(s,-SHORE-40,W),b=wTU(s,E+SHORE+40,W),sd=sea;
  {const mq=mouthGeo(),mL=mouthShoreline(-1),mR=mouthShoreline(1),gaps=city.seaBranch?[mq&&mq.beach&&mL.length&&mR.length?[mL[mL.length-1][0],mR[mR.length-1][0]]:[city.seaBranch.a*P+o,(city.seaBranch.a+1)*P-o]]:[];
   /* v3 r27: espuma acompanhando a linha d'água em curva da foz */
   for(const cl of [mL,mR])for(let k=0;k<cl.length-1;k++){const A=cl[k],B=cl[k+1],dt=B[0]-A[0],du=B[1]-A[1],l=Math.hypot(dt,du)||1;let nt=-du/l,nu=dt/l;const y=mouthY(mq,(A[0]+B[0])/2+nt*1.5,(A[1]+B[1])/2+nu*1.5);if(y===null||y>=SEA_Y){nt=-nt;nu=-nu}
    const p0=wTU(s,A[0],A[1]),p1=wTU(s,B[0],B[1]),q=wTU(s,A[0]+nt,A[1]+nu);worldFoamStrip(fm,p0[0],p0[1],p1[0],p1[1],q[0]-p0[0],q[1]-p0[1],2.6,SEA_Y+.04)}let t0=-SHORE-40;for(const[g0,g1] of [...gaps,[E+SHORE+40,E+SHORE+40]]){foamCoast(fm,s,t0,g0,W,sd);t0=g1}}
  {const tg=s<2?[1,0]:[0,1];for(let u=SHORE+1.2;u<L.uC-.01;u+=2){const u1=Math.min(L.uC,u+2);for(const sd of [-1,1]){const p0=wTU(s,lhC(L,u)+sd*(lhW(L,u)+1.6),u),p1=wTU(s,lhC(L,u1)+sd*(lhW(L,u1)+1.6),u1);worldFoamStrip(fm,p0[0],p0[1],p1[0],p1[1],sd*tg[0],sd*tg[1],2.4,SEA_Y+.04)}}
   for(let k=0;k<20;k++){const a0=k/20*6.2832,a1=(k+1)/20*6.2832,r0=L.pad,r1=r0+2.6,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
    const mid=(a0+a1)/2,mx=L.cx+Math.cos(mid)*r0,mz=L.cz+Math.sin(mid)*r0;if(outDist(mx,mz)<L.uC-1)continue;
    fq(fm,[L.cx+c0*r0,SEA_Y+.04,L.cz+s0*r0],[L.cx+c1*r0,SEA_Y+.04,L.cz+s1*r0],[L.cx+c1*r1,SEA_Y+.04,L.cz+s1*r1],[L.cx+c0*r1,SEA_Y+.04,L.cz+s0*r1],[k/20*5,0],[(k+1)/20*5,0],[(k+1)/20*5,.45],[k/20*5,.45],1,1,0,0)}}
  const fmesh=fm.mesh(M.foam,false,false);if(fmesh){fmesh.renderOrder=3;fmesh.frustumCulled=false;grp.add(fmesh)}}
}

/* ---------- atualização por frame ---------- */
function worldCemWx(dt){const C=city.cem;let tgt=0;
 if(city.haze&&played&&!PL.inside)tgt=.8;
 if(C&&played&&!PL.inside){const p=PL.car||PL,r=C.rect,d=Math.hypot(Math.max(r[0]-p.x,0,p.x-r[2]),Math.max(r[1]-p.z,0,p.z-r[3]));tgt=1-clamp(d/70,0,1);tgt=tgt*tgt*(3-2*tgt)}
 WLD.cem.f+=(tgt-WLD.cem.f)*Math.min(1,dt*1.4);
 if(WLD.cem.f>.55&&!WLD.cem.msg&&!city.haze){WLD.cem.msg=true;void 0}else if(WLD.cem.f<.15)WLD.cem.msg=false}
function worldReset(){LH.up=false;LH.fall=false;LH.cool=1.5}
function worldSkipDrown(){return LH.fall}
function worldUpdate(dt){const M=city.M;if(!M)return;if(M.foam&&M.foam.map)M.foam.map.offset.y+=dt*.11;
 const pc=PL.car||PL,L=city.lh;
 if(L){const d2=(L.cx-camera.position.x)**2+(L.cz-camera.position.z)**2;
  if(LH.beam){const on=!city.st.noLamps&&(DN.nightF>.3||city.st.night)&&d2<1100*1100;LH.beam.visible=on;LH.glow.visible=on;if(on)LH.beam.rotation.y=simT*.7;LH.glow.material.opacity=.7+.25*Math.sin(simT*3)}
  LH.cool=Math.max(0,LH.cool-dt);
  if(!PL.dead&&!PL.car&&!PL.inside&&LH.cool<=0&&!LH.fall){
   if(!LH.up&&Math.hypot(PL.x-L.door[0],PL.z-L.door[1])<1.2){fadeFlash();LH.up=true;LH.cool=1.6;PL.x=L.arrive[0];PL.z=L.arrive[1];PL.gy=L.H;PL.jy=0;PL.jv=0;PL.vx=PL.vz=0;PL.face=[L.sea[0],L.sea[1]];PL.yaw=Math.atan2(-L.sea[0],-L.sea[1]);
    camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x-L.sea[0]*4,PL.gy+2.6,PL.z-L.sea[1]*4)}
   else if(LH.up&&Math.hypot(PL.x-L.topDoor[0],PL.z-L.topDoor[1])<1){fadeFlash();LH.up=false;LH.cool=2.2;PL.x=L.out[0];PL.z=L.out[1];PL.gy=groundY(PL.x,PL.z);PL.jy=0;PL.jv=0;PL.vx=PL.vz=0;PL.face=[L.inl[0],L.inl[1]];camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x+L.sea[0]*4,PL.gy+2.6,PL.z+L.sea[1]*4)}}}
 // piscinas: dá pra andar dentro (mais devagar), não afoga
 if(WLD.pools.size&&!PL.car&&!PL.dead&&PL.jy<.4){for(const r of WLD.pools.values()){if(PL.x>r[0]&&PL.x<r[2]&&PL.z>r[1]&&PL.z<r[3]){const k=Math.pow(.5,dt*60);PL.vx*=k;PL.vz*=k;if(Math.hypot(PL.vx,PL.vz)>.8&&Math.random()<dt*14)emit(PL.x,.4,PL.z,(Math.random()-.5)*2,1.2+Math.random(),(Math.random()-.5)*2,.5,.35,.9,0xcdeeff,false,.8);break}}}
 // fumaça das churrasqueiras acesas
 // usar o mesmo perfil visual da fumaça das chaminés da indústria, subindo corretamente.
 if(WLD.grills.size){for(const g of WLD.grills.values()){
  if(!g.lit||Math.abs(g.x-pc.x)>90||Math.abs(g.z-pc.z)>90)continue;
  if(Math.random()<dt*4)emit(
   g.x+(Math.random()-.5)*.18,
   g.y,
   g.z+(Math.random()-.5)*.18,
   (WX.wx||1.5)*.4+(Math.random()-.5),
   1.6+Math.random(),
   (WX.wz||.8)*.4+(Math.random()-.5),
   5,2,9,
   STYLES[S.style].synth?0x4a4458:0x9a9894,
   false,.5
  )
 }}
}
// no lugar da interpolação do PL.gy: sobre a sacada do farol / em queda
function worldPlGy(dt){if(BR.fall){BR.fallT+=dt;BR.fv+=26*dt;PL.gy-=BR.fv*dt;PL.x=BR.fx;PL.z=BR.fz;PL.vx=PL.vz=0;return true}if(PL.inside==='backrooms'){PL.gy=0;return true} /* v3 r10: Backrooms (queda pelo chão e piso do Nível 0) */
 const L=city.lh;if(!L||(!LH.up&&!LH.fall))return false;
 if(LH.up){const dx=PL.x-L.cx,dz=PL.z-L.cz,d=Math.hypot(dx,dz);
  if(d>L.rail){if(PL.jy>.85){LH.up=false;LH.fall=true;LH.fv=0}else{PL.x=L.cx+dx/d*L.rail;PL.z=L.cz+dz/d*L.rail;PL.vx*=.3;PL.vz*=.3;PL.gy=L.H;return true}}
  else{PL.gy=L.H;return true}}
 if(LH.fall){LH.fv+=26*dt;PL.gy-=LH.fv*dt;const wat=inWater(PL.x,PL.z),fl=wat?SEA_Y:groundY(PL.x,PL.z);
  if(PL.gy<=fl){LH.fall=false;PL.gy=fl;PL.jy=0;PL.jv=0;PL.vx=PL.vz=0;if(wat)drown();else{for(let i=0;i<16;i++)emit(PL.x,.4,PL.z,(Math.random()-.5)*5,1+Math.random()*4,(Math.random()-.5)*5,.8,.5,.15,0xc01818,false,.9);killPlayer('QUEDA FATAL')}}
  return true}
 return false}
function worldRespawnSpot(){const jail=!!PL.jail;PL.jail=false;const lm=(city.lms||[]).find(l=>l.name===(jail?'pol':'hosp'));if(!lm)return null;
 let sp=jail?city.polDoor:city.hosp;if(!sp){const c=chunkOf(lm.x,lm.z);try{buildChunk(c[0],c[1])}catch(e){console.error(e)}sp=jail?city.polDoor:city.hosp}
 return sp?{x:sp.x,z:sp.z,pol:jail}:null}
function worldMapPaint(g,st){const fr=(x0,z0,x1,z1,c)=>{g.fillStyle=c;g.fillRect(x0+MOFF,z0+MOFF,x1-x0,z1-z0)};
 if(city.cem){const r=city.cem.rect,cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2;
  fr(r[0],r[1],r[2],r[3],st.synth?'#294a38':'#5d7a56');
  const gravel=st.synth?'#79757f':'#b2aa98',stone=st.synth?'#b2acc0':'#e4e0d4';
  // Mesmos dois eixos de caminhos do cemiterio 3D; cruz central e obelisco.
  fr(cx-1.6,r[1]+1,cx+1.6,r[3]-7,gravel);fr(r[0]+2,cz-1.1,r[2]-2,cz+1.1,gravel);
  g.fillStyle=stone;g.fillRect(cx-2+MOFF,cz-2+MOFF,4,4);
  // Lapides discretas para nao confundir este terreno com parque comum.
  g.fillStyle=st.synth?'#777a83':'#c5c4bd';for(let z=r[1]+6;z<r[3]-9;z+=7)for(let x=r[0]+6;x<r[2]-5;x+=7){if(Math.abs(x-cx)<4||Math.abs(z-cz)<4)continue;g.fillRect(x+MOFF,z+MOFF,1.4,2.2)}
 }
 for(const l of city.lms||[])if(l.name==='pol'){const r=city.rects[l.ri];fr(r[0]+SW,r[1]+SW,r[2]-SW,r[3]-SW,st.synth?'#34457a':'#7f97c8')}
 const L=city.lh;if(L){const sd=st.synth?'#5a4a62':'#e3cf9a';g.fillStyle=sd;g.beginPath();const pts=[];for(let u=L.u0;u<=L.uC+.01;u+=2)pts.push(wTU(L.s,lhC(L,u)-lhW(L,u),u));for(let u=L.uC;u>=L.u0-.01;u-=2)pts.push(wTU(L.s,lhC(L,u)+lhW(L,u),u));pts.forEach((p,i)=>i?g.lineTo(p[0]+MOFF,p[1]+MOFF):g.moveTo(p[0]+MOFF,p[1]+MOFF));g.fill();
  g.fillStyle=sd;g.beginPath();g.arc(L.cx+MOFF,L.cz+MOFF,L.pad,0,7);g.fill();g.fillStyle='#d8403a';g.beginPath();g.arc(L.cx+MOFF,L.cz+MOFF,3,0,7);g.fill()}}

/* ---------- quintal: piscina + churrasqueira ---------- */
function worldPoolPlan(x0,z0,x1,z1,face,safe,bs0){if(safe)return null;
 const h=mulberry32(((Math.round(x0*5)*73856093)^(Math.round(z0*5)*19349663)^(S.seed*3+9))>>>0),a=h(),b=h(),c=h();
 const ns=face==='n'||face==='s',depth=ns?z1-z0:x1-x0,width=ns?x1-x0:z1-z0;
 const pool=a<.35&&depth>=15.5&&width>=12,grill=pool?b<.85:(b<.4&&bs0>=2.0);if(!pool&&!grill)return null;
 return{pool,grill,lit:c<.55,bs:pool?Math.min(7.2,depth-10.5):bs0,seed:Math.floor(h()*1e9)+1}}
function worldPoolBuild(K,plan,face,x0,z0,x1,z1,hx0,hz0,hx1,hz1){const{det,side,wat,neon}=K,night=!!city.st.synth,m=.4,rnd=mulberry32(plan.seed>>>0);
 // referencial do quintal: u = ao longo da frente do lote, v = da parede dos fundos da casa até o muro do fundo
 let uA,uB,bs;const W2=face==='s'?(u,v)=>[u,hz0-v]:face==='n'?(u,v)=>[u,hz1+v]:face==='e'?(u,v)=>[hx0-v,u]:(u,v)=>[hx1+v,u];
 if(face==='s'||face==='n'){uA=x0+m;uB=x1-m;bs=face==='s'?hz0-z0:z1-hz1}else{uA=z0+m;uB=z1-m;bs=face==='e'?hx0-x0:x1-hx1}
 const lb=(u0,u1,v0,v1,y0,y1,col,mb)=>{const a=W2(u0,v0),b=W2(u1,v1);(mb||det).box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col)};
 const lf=(u0,u1,v0,v1,y,col,mb)=>{const a=W2(u0,v0),b=W2(u1,v1);(mb||wat).flat(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),y,col)};
 const L=uB-uA,cu=(uA+uB)/2,sg=rnd()<.5?-1:1;if(L<6||bs<1.2)return;
 const tile=COL(night?'#7a86c0':'#d8ecf2'),tile2=COL(night?'#5a6aa8':'#b6d4de');
 let pu0=0,pu1=0;
 if(plan.pool){const pl=Math.min(L*.46,8.6),pd=Math.min(bs-2.6,4.8);
  if(pd>=2.4&&pl>=4.5){const pc=cu+sg*(L/2-pl/2-1.0),v0=1.5+(bs-2.6-pd)*.35,v1=v0+pd;pu0=pc-pl/2;pu1=pc+pl/2;const bw=.5;
   // borda de azulejo, água em duas tonalidades, escada, trampolim e luz noturna
   lb(pu0-bw,pu1+bw,v0-bw,v0,.24,.34,tile);lb(pu0-bw,pu1+bw,v1,v1+bw,.24,.34,tile);lb(pu0-bw,pu0,v0,v1,.24,.34,tile);lb(pu1,pu1+bw,v0,v1,.24,.34,tile);
   lb(pu0-bw-.12,pu1+bw+.12,v0-bw-.1,v1+bw+.1,.2,.255,tile2,side);
   const inv=S.style==='inverted';
   if(inv){ /* v2 r2: Mundo Invertido = água parada e suja como a do motel (lodo, folha morta, tábua boiando); hash próprio, não consome rnd */
    lf(pu0,pu1,v0,v1,.30,COL('#2c3618'));lf(pu0+.15,pu1-.15,v0+.15,v0+pd*.4,.302,COL('#3a4420'));
    const hq=mulberry32((plan.seed^0x5ad7)>>>0);for(let k=0;k<5;k++){const u=pu0+.4+hq()*(pl-.8),v=v0+.3+hq()*(pd-.6),r=.25+hq()*.55;lf(u-r,u+r,v-r*.7,v+r*.7,.306+k*.003,COL(k&1?'#1a1e10':'#4a4a26'))}
    {const u=pu0+pl*(.25+hq()*.5),v=v0+pd*(.3+hq()*.4),p=W2(u,v);det.geo(GEO.box,mtx(p[0],.31,p[1],1.4,.05,.2,0,hq()*3,0),COL('#4a3a2a'))}
   }else{
   lf(pu0,pu1,v0,v1,.30,COL(night?'#1d3f9a':'#2a9cc4'));lf(pu0+.15,pu1-.15,v0+.15,v0+pd*.4,.302,COL(night?'#2a56b8':'#58c8e2'));
   for(let u=pu0+1;u<pu1-.5;u+=1.1)lf(u,u+.05,v0+.2,v1-.2,.304,COL(night?'#3a66c8':'#7fdcee'));}
   const ldr=pu0+(pu1-pu0)*.18,pr=COL('#cfd6dc');for(const du of [-.25,.25]){const p=W2(ldr+du,v1+.18);det.geo(GEO.cyl16,mtx(p[0],.7,p[1],.04,.9,.04),pr)}
   {const p=W2(ldr-.25,v1+.18),q=W2(ldr+.25,v1+.18);wseg(det,p[0],1.15,p[1],q[0],1.15,q[1],.04,pr,GEO.cyl16)}
   if((plan.seed%3)===0){const bu=pu1+bw;lb(bu-1.6,bu+.2,v0+pd*.5-.4,v0+pd*.5+.4,.34,.6,COL('#c8c4bc'));lb(bu-.2,bu+1.7,v0+pd*.5-.3,v0+pd*.5+.3,.6,.7,COL('#2a8ad6'));}
   if(night&&!inv){for(const[uu,vv] of [[pu0+.4,v0+.12],[pu1-.4,v0+.12],[pu0+.4,v1-.12],[pu1-.4,v1-.12]]){const p=W2(uu,vv);neon.box(p[0]-.1,.31,p[1]-.1,p[0]+.1,.34,p[1]+.1,COL('#6af0ff'))}}
   const key=plan.seed;if(!WLD.pools.has(key)){const a=W2(pu0,v0),b=W2(pu1,v1);WLD.pools.set(key,[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])])}}}
 if(plan.grill){ // churrasqueira de tijolo com coifa e chaminé, junto ao muro do fundo
  let gu=plan.pool&&pu1>pu0?(pu0+pu1)/2-sg*((pu1-pu0)/2+L*.28):cu+(rnd()-.5)*L*.35;gu=clamp(gu,uA+1.8,uB-1.8);
  const gv=bs-.4,brick=COL(night?'#7a4048':'#a8503a'),dark=COL('#2c2a2e'),hw=.7;
  lb(gu-hw,gu+hw,gv-.85,gv,.24,1.0,brick);lb(gu-hw-.08,gu+hw+.08,gv-.9,gv+.0,.94,1.04,brick.clone().multiplyScalar(.82));
  lb(gu-hw+.12,gu+hw-.12,gv-.8,gv-.15,1.0,1.06,dark);for(let k=0;k<7;k++){const uu=gu-hw+.18+k*.17;lb(uu,uu+.04,gv-.8,gv-.15,1.06,1.085,COL('#6a6a70'))}
  const lit=plan.lit&&!city.st.noLamps;lb(gu-hw+.1,gu+hw-.1,gv-.78,gv-.2,.9,.97,lit?COL('#ff6a18'):COL('#1e1a1c'),lit?neon:det);
  lb(gu-hw,gu+hw,gv-.55,gv,1.04,1.5,brick.clone().multiplyScalar(.9));lb(gu-.3,gu+.3,gv-.4,gv-.05,1.5,2.75,brick.clone().multiplyScalar(.78));lb(gu-.38,gu+.38,gv-.46,gv,2.72,2.86,COL('#3a3a40'));
  {const a=W2(gu-hw-.05,gv-.9),b=W2(gu+hw+.05,gv+.05);addCol(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),'rock')}
  // mesinha com bancos
  const tu=clamp(gu+(gu>cu?-3.4:3.4),uA+1,uB-1),tv=gv-1.4;if(bs>=3.2&&Math.abs(tu-gu)>2){lb(tu-.7,tu+.7,tv-.45,tv+.45,.72,.8,COL('#8a6a48'));for(const[du,dv] of [[-.6,-.35],[.6,-.35],[-.6,.35],[.6,.35]])lb(tu+du-.05,tu+du+.05,tv+dv-.05,tv+dv+.05,.24,.72,COL('#5a4a38'));
   for(const dv of [-.85,.85])lb(tu-.6,tu+.6,tv+dv-.17,tv+dv+.17,.45,.52,COL('#a8885a'));{const a=W2(tu-.8,tv-.9),b=W2(tu+.8,tv+.9);addCol(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),'rock').low=.9}}
  const fp=W2(gu,gv-.25),key=fp[0].toFixed(1)+','+fp[1].toFixed(1);if(!WLD.grills.has(key))WLD.grills.set(key,{x:fp[0],y:2.95,z:fp[1],lit})}
}
// Quintal fixo da casa segura: objetos em batch, sem novos loops de render.
// u percorre a frente do lote; v cresce na direção do fundo.
function safeYardBuild(K,face,x0,z0,x1,z1,hx0,hz0,hx1,hz1){
 const {det,side,wat,tree}=K,night=!!city.st.synth,ns=face==='n'||face==='s';
 const W=ns?x1-x0:z1-z0,D=ns?z1-z0:x1-x0;
 const pt=(u,v)=>face==='n'?[x0+u,z0+v]:face==='s'?[x0+u,z1-v]:face==='w'?[x0+v,z0+u]:[x1-v,z0+u];
 const box=(u0,v0,u1,v1,y0,y1,col,mb=det)=>{const a=pt(u0,v0),b=pt(u1,v1);mb.box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col)};
 const water=(u0,v0,u1,v1,col)=>{const a=pt(u0,v0),b=pt(u1,v1);wat.flat(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]),.307,col)};
 const poolU=Math.max(2.4,W*.12),poolV=Math.min(D*.46,13),poolW=Math.min(6.2,W*.24),poolD=Math.min(3.7,D*.15),tile=COL(night?'#6c8fac':'#d8ebf0');
 // Piscina menor atrás da casa, após o volume residencial (v~3..12).
 if(D>=19){box(poolU-.4,poolV-.4,poolU+poolW+.4,poolV+poolD+.4,.24,.3,tile,side);water(poolU,poolV,poolU+poolW,poolV+poolD,COL(night?'#235a91':'#37b4ce'));water(poolU+.15,poolV+.15,poolU+poolW-.15,poolV+poolD*.32,COL('#65d1e6'))}
 // Churrasqueira de tijolos no fundo, separada do corredor da garagem.
 const gu=Math.min(W-2.1,poolU+poolW+1.0),gv=D-2.25,red=COL('#9c4c37');
 box(gu-.7,gv-.8,gu+.7,gv,.24,1.05,red);box(gu-.56,gv-.71,gu+.56,gv-.1,.9,1.03,COL('#292528'));box(gu-.25,gv-.45,gu+.25,gv-.08,1.02,2.55,red);
 const gb0=pt(gu-.82,gv-1),gb1=pt(gu+.82,gv+.15);addCol(Math.min(gb0[0],gb1[0]),Math.min(gb0[1],gb1[1]),Math.max(gb0[0],gb1[0]),Math.max(gb0[1],gb1[1]),'rock');
 // Heliponto recuado atrás da garagem, livre das casas; um pouso tem raio útil ~4.8 m.
 const hu=Math.max(W*.67,W-6.15),hv=Math.min(D-5.3,Math.max(16.6,D*.66)),a=pt(hu,hv),r=4.8;
 if(hu>r&&hu+r<W-1&&hv>r+7.3&&hv+r<D-.45){
  box(hu-r,hv-r,hu+r,hv+r,.244,.268,COL('#656b70'),side);
  // H amarelo; linhas ficam no plano do heliponto, sem barrar veículos.
  const yellow=COL('#f2c524');box(hu-1.65,hv-1.6,hu-1.3,hv+1.6,.269,.277,yellow);
  box(hu+1.3,hv-1.6,hu+1.65,hv+1.6,.269,.277,yellow);
  box(hu-1.5,hv-.18,hu+1.5,hv+.18,.269,.277,yellow);
  city.safeHelipad={x:a[0],z:a[1],a:face==='n'?Math.PI/2:face==='s'?-Math.PI/2:face==='e'?Math.PI:0,r};
 }
 // Duas árvores fora da rota frontal e a pelo menos 6 m do heliponto.
 for(const [u,v] of [[W-1.4,D-1.7],[1.45,D-2.0]]){const p=pt(u,v);if(!city.safeHelipad||Math.hypot(p[0]-a[0],p[1]-a[1])>6.5)tree(p[0],p[1],.24,.82)}
}
/* ---------- CEMITÉRIO (estilo Los Santos) ---------- */
/* v2 r1: versão leve da árvore morta (Mundo Invertido e Point Haze): mesma forma, cilindros abertos de 5/4/3 lados em vez de 9 com tampa.
   Medido: 1.420 → ~330 triângulos por árvore (a viva tem 200). */
let DT_LITE=null;function dtLiteGeo(){if(!DT_LITE)DT_LITE={t:new THREE.CylinderGeometry(1,1,1,5,1,true),b:new THREE.CylinderGeometry(1,1,1,4,1,true),w:new THREE.CylinderGeometry(1,1,1,3,1,true)};return DT_LITE}
function worldDeadTree(mb,x,z,s,col,lite){const G=lite?dtLiteGeo():null,gT=G&&G.t,gB=G&&G.b,gW=G&&G.w;const J=[];let px=x,py=.28,pz=z,r=.25*s,ang=rr(0,6.28);const n=5+(R()<.5?1:0);
 for(let i=0;i<n;i++){ang+=rr(-.8,.8);const lat=rr(.1,.45)*s,nx=px+Math.cos(ang)*lat,nz=pz+Math.sin(ang)*lat,ny=py+rr(.85,1.25)*s,r2=r*.82;wseg(mb,px,py,pz,nx,ny,nz,(r+r2)*.5,col,gT);J.push([nx,ny,nz,r2]);px=nx;py=ny;pz=nz;r=r2}
 for(let i=1;i<J.length;i++){const[jx,jy,jz,jr]=J[i],nb=1+(R()<.55?1:0);
  for(let b=0;b<nb;b++){let a=rr(0,6.28),bx=jx,by=jy,bz=jz,br=jr*.6;const segs=2+(R()<.5?1:0);
   for(let k=0;k<segs;k++){a+=rr(-.6,.6);const l=rr(.7,1.3)*s*(1-k*.15),ex=bx+Math.cos(a)*l*.8,ez=bz+Math.sin(a)*l*.8,ey=by+l*rr(.25,.7),br2=br*.7;wseg(mb,bx,by,bz,ex,ey,ez,(br+br2)*.5,col,gB);
    if(k===segs-1)for(let t=0;t<2;t++){const a2=a+rr(-1.1,1.1),tl=l*.6;wseg(mb,ex,ey,ez,ex+Math.cos(a2)*tl*.7,ey+tl*rr(.2,.8),ez+Math.sin(a2)*tl*.7,br2*.55,col,gW)}
    bx=ex;by=ey;bz=ez;br=br2}}}
 const top=J[J.length-1];for(let t=0;t<3;t++){const a=rr(0,6.28),l=rr(.8,1.3)*s;wseg(mb,top[0],top[1],top[2],top[0]+Math.cos(a)*l*.6,top[1]+l,top[2]+Math.sin(a)*l*.6,top[3]*.6,col,gB)}}
function softStain(mb,cx,cz,rx,rz,y,c0,edge,ph){ // v78: mancha plana irregular com degradê até a cor do chão (leque de 12 setores, 2 anéis)
  const N=12,mid=edge.clone().lerp(c0,.75),P=mb.p,Nn=mb.n,U=mb.u,Cc=mb.c,c=[cx,cz];ph=ph%6.283;
  const ring=(f,j)=>{const t=j/N*6.283,w=1+.22*Math.sin(t*3+ph)+.12*Math.sin(t*5-ph*1.7);return[cx+Math.cos(t)*rx*f*w,cz+Math.sin(t)*rz*f*w]};
  const tri=(p1,k1,p2,k2,p3,k3)=>{for(const [pp,kk] of [[p1,k1],[p3,k3],[p2,k2]]){P.push(pp[0],y,pp[1]);Nn.push(0,1,0);U.push(0,0);Cc.push(kk.r,kk.g,kk.b)}};
  for(let j=0;j<N;j++){const i0=ring(.5,j),i1=ring(.5,j+1),o0=ring(1,j),o1=ring(1,j+1);tri(c,c0,i0,mid,i1,mid);tri(i0,mid,o0,edge,o1,edge);tri(i0,mid,o1,edge,i1,mid)}}
 function worldTomb(det,x,z,yaw,type,col,tilt){const cy=Math.cos(yaw),sy=Math.sin(yaw),c2=col.clone().multiplyScalar(.82),base=col.clone().multiplyScalar(.7);
 const Pt=(lx,lz)=>[x+lx*cy+lz*sy,z-lx*sy+lz*cy];const bx=(lx,ly,lz,sx,sY,sz,c,rx,rz)=>{const p=Pt(lx,lz);det.geo(BOXG,mtx(p[0],ly,p[1],sx,sY,sz,rx||0,yaw,rz||0),c)};
 const tx=tilt?(R()-.5)*.5:0,tz=tilt?(R()-.5)*.5:0;
 if(type===0){bx(0,.36,0,1.1,.2,.55,base);bx(0,1.05,0,.85,1.1,.22,col,tx,tz);const p=Pt(0,0);det.geo(GEO.cyl,mtx(p[0],1.6+Math.sin(tz)*.1,p[1],.425,.22,.425,Math.PI/2+tx,yaw,tz),col)}
 else if(type===1){bx(0,.35,0,.8,.22,.5,base);bx(0,1.15,0,.2,1.6,.2,col,tx,tz);bx(0,1.55,0,.82,.2,.2,col,tx,tz)}
 else if(type===2){bx(0,.35,0,1.35,.18,.65,base);bx(0,.82,0,1.1,.75,.26,col,tx,tz)}
 else if(type===3){bx(0,.3,0,.75,.2,.75,base);bx(0,1.0,0,.42,1.3,.42,col,tx,tz);const p=Pt(0,0);det.geo(GEO.cone,mtx(p[0],1.9,p[1],.3,.5,.3,tx,yaw,tz),c2)}
 else if(type===4){bx(0,.55,0,.9,.9,.65,base);const p=Pt(0,0);det.geo(GEO.cyl,mtx(p[0],1.55,p[1],.3,1.0,.3,tx,yaw,tz),c2);det.geo(GEO.sph,mtx(p[0],2.2,p[1],.2,.2,.2),c2);
  for(const sd of [-1,1]){const w=Pt(sd*.34,-.12);det.geo(GEO.ico,mtx(w[0],1.75,w[1],.07,.5,.34,0,yaw,sd*.35),col)}det.geo(GEO.ico,mtx(Pt(.32,.18)[0],1.5,Pt(.32,.18)[1],.07,.07,.4,0,yaw,0),c2)}
 else{bx(0,.3,0,.9,.12,1.7,base);bx(0,.4,.3,.8,.1,.5,col,tx*.5,tz*.5)}}
function worldCemetery(K){const{det,side,plants,neon,glow,signs,night,F,W,D,f,roadAt}=K;
 const grass=COL(night?'#1f2a26':'#6e7a54'),dirt=COL(night?'#2a2630':'#7a6a54'),gravel=COL(night?'#4a4656':'#b2aa98'),stone=COL(night?'#7a7690':'#aaa69a'),stone2=stone.clone().multiplyScalar(.82),iron=COL(night?'#0c0a12':'#1a1a1e'),bark=COL(night?'#2a2433':'#3d3631');
 const mw=.35,wt=.55,vi=mw+wt;
 side.box(K.X0,.26,K.Z0,K.X1,.31,K.Z1,grass,{});
 /* v78: manchas de terra/grama do gramado REMOVIDAS a pedido (ficavam estranhas e sobrepostas = 2.764 conflitos de z-fight no detector). Os sorteios continuam aqui SÓ para não mudar o resto da seed (armadilha 6). */
 for(let k=0;k<(W*D)/260;k++){rr(vi+2,W-vi-6);rr(vi+2,D-vi-6);rr(3,7);rr(3,7);if(!(rr(0,1)<.6))rr(.75,.9)}
 const gw=3.3,backRoad=roadAt(...F.pt(W/2,D+SW+7.4));
 // pilares
 const pil=(u)=>{F.box(u-.5,u+.5,vi-1.05,vi+.05,.26,2.75,stone,det,'rock');F.box(u-.62,u+.62,vi-1.17,vi+.17,2.75,2.95,stone2,det);const p=F.pt(u,vi-.5);det.geo(GEO.sph,mtx(p[0],3.15,p[1],.26,.26,.26),stone2)};
 const pilB=(u)=>{F.box(u-.5,u+.5,D-vi-.05,D-vi+1.05,.26,2.75,stone,det,'rock');F.box(u-.62,u+.62,D-vi-.17,D-vi+1.17,2.75,2.95,stone2,det)};
 const us=[];{const gl=W/2-gw-.25,gr=W/2+gw+.25;us.push(gl,gr);for(let u=gl-8.4;u>mw+.8;u-=8.4)us.push(u);for(let u=gr+8.4;u<W-mw-.8;u+=8.4)us.push(u);us.push(mw+.5,W-mw-.5)}
 us.sort((a,b)=>a-b);
 const bars=(u0,u1,v,y0,y1)=>{for(let u=u0+.3;u<u1-.2;u+=.42){F.box(u-.035,u+.035,v-.035,v+.035,y0,y1,iron,det);if(((u*100)|0)%2===0){const p=F.pt(u,v);det.geo(GEO.cone,mtx(p[0],y1+.13,p[1],.07,.3,.07),iron)}}
  F.box(u0,u1,v-.045,v+.045,y0+.2,y0+.3,iron,det);F.box(u0,u1,v-.045,v+.045,y1-.25,y1-.15,iron,det)};
 // muro da frente (grades de ferro) e dos fundos
 for(let i=0;i<us.length;i++){pil(us[i]);if(i<us.length-1){const a=us[i],b=us[i+1];if(Math.abs(a-(W/2-gw-.25))<.01&&Math.abs(b-(W/2+gw+.25))<.01)continue;F.box(a+.5,b-.5,mw,vi,.26,.8,stone,det,'rock');bars(a+.5,b-.5,mw+wt/2,.8,2.55)}}
 const ub=[];ub.push(mw+.5);const gb=false;for(let u=mw+.5;u<W-mw-.5;u+=9.5){ub.push(u)}ub.push(W-mw-.5);
 for(let i=0;i<ub.length;i++){pilB(ub[i]);if(i<ub.length-1){const a=ub[i],b=ub[i+1];if(gb&&a<W/2+gw&&b>W/2-gw){continue}F.box(a+.5,b-.5,D-vi,D-mw,.26,2.15,stone,det,'rock');F.box(a+.4,b-.4,D-vi-.08,D-mw+.08,2.15,2.3,stone2,det)}}
 F.box(mw,vi,vi,D-vi,.26,2.15,stone,det,'rock');F.box(W-vi,W-mw,vi,D-vi,.26,2.15,stone,det,'rock');F.box(mw-.08,vi+.08,vi,D-vi,2.15,2.3,stone2,det);F.box(W-vi-.08,W-mw+.08,vi,D-vi,2.15,2.3,stone2,det);
 // portão da frente: duas folhas abertas para dentro + arco de ferro com o nome
 for(const sd of [-1,1]){const hu=W/2+sd*(gw-.15);for(let vv=vi+.5;vv<vi+3.4;vv+=.34)F.box(hu-.035,hu+.035,vv-.035,vv+.035,.35,2.5,iron,det);
  F.box(hu-.045,hu+.045,vi+.3,vi+3.55,.35,.45,iron,det);F.box(hu-.045,hu+.045,vi+.3,vi+3.55,1.4,1.5,iron,det);F.box(hu-.045,hu+.045,vi+.3,vi+3.55,2.4,2.5,iron,det);
  for(let vv=vi+.7;vv<vi+3.4;vv+=.68){const p=F.pt(hu,vv);det.geo(GEO.cone,mtx(p[0],2.65,p[1],.07,.3,.07),iron)}}
 F.box(W/2-gw-.3,W/2+gw+.3,vi-.2,vi+.2,3.3,3.55,iron,det);
 for(let k=0;k<=6;k++){const u=W/2-gw+k*gw/3;F.box(u-.03,u+.03,vi-.05,vi+.05,3.0,3.3,iron,det)}
 F.box(W/2-gw+.3,W/2+gw-.3,vi-.28,vi+.28,3.7,5.2,iron,det);
 {const a=F.pt(W/2-gw,vi-.3),b=F.pt(W/2+gw,vi+.3),x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),z0=Math.min(a[1],b[1]),z1=Math.max(a[1],b[1]);
  }
 sunsetFacade(K.ch,F,W/2,vi-.32,4.43,gw*1.65,1.14,['CEMITÉRIO DE','SUNSET SHORES'],'#33313d','#f3eee4');
 if(night){for(const sd of [-1,1]){const p=F.pt(W/2+sd*(gw+.25),vi-.5);neon.box(p[0]-.14,3.2,p[1]-.14,p[0]+.14,3.5,p[1]+.14,COL('#ffd08a'))}}
 // portão dos fundos, se há rua atrás
 if(false&&backRoad){const vb0=D-vi;for(const sd of [-1,1]){const hu=W/2+sd*(gw-.15);for(let vv=vb0-.5;vv>vb0-3.4;vv-=.34)F.box(hu-.035,hu+.035,vv-.035,vv+.035,.35,2.5,iron,det);
   for(const y of [.35,1.4,2.4])F.box(hu-.045,hu+.045,vb0-3.55,vb0-.3,y,y+.1,iron,det);for(let vv=vb0-.7;vv>vb0-3.4;vv-=.68){const p=F.pt(hu,vv);det.geo(GEO.cone,mtx(p[0],2.65,p[1],.07,.3,.07),iron)}}
  F.box(W/2-gw-.3,W/2+gw+.3,vb0-.2,vb0+.2,3.3,3.55,iron,det);for(let k=0;k<=6;k++){const u=W/2-gw+k*gw/3;F.box(u-.03,u+.03,vb0-.05,vb0+.05,3.0,3.3,iron,det)}}
 // caminhos
 const cxo=W/2,czo=D/2,vf=D-16,vb=D-7.5;
 F.box(W/2-1.6,W/2+1.6,vi,czo-6.5,.31,.335,gravel,side);F.box(W/2-1.6,W/2+1.6,czo+6.5,vf-.5,.31,.335,gravel,side);F.box(vi+1.5,W-vi-1.5,czo-1.1,czo+1.1,.31,.335,gravel,side);
 {const p=F.pt(cxo,czo);det.geo(GEO.cyl16,mtx(p[0],.34,p[1],7,.025,7),gravel);det.geo(GEO.cyl16,mtx(p[0],.358,p[1],3.4,.02,3.4),grass.clone().multiplyScalar(.9))}
 // armas escondidas entre os túmulos (motivo pra entrar… e fugir do fantasma)
 if(K.ch){const L=[[.18,.78,'magnum',18],[.82,.3,'smg',90],[.78,.82,'rpg',3],[.22,.28,'hp',1],[.62,.54,'grenade',3],[.37,.66,'remote',3]];L.forEach((q,i)=>{const id='cem'+i+'_'+S.seed;if(city.picked.has(id)||pickups.some(k=>k.id===id))return;const p=F.pt(W*q[0],D*q[1]);try{makePickup(id,p[0],p[1],q[3],K.ch,q[2])}catch(e){}})}
 // obelisco central
 {const p=F.pt(cxo,czo),mx=p[0],mz=p[1];det.box(mx-2.2,.3,mz-2.2,mx+2.2,.9,mz+2.2,stone2);det.box(mx-1.7,.9,mz-1.7,mx+1.7,1.5,mz+1.7,stone);det.box(mx-1.3,1.5,mz-1.3,mx+1.3,2.1,mz+1.3,stone2);
  const q=(h,r)=>[[mx-r,h,mz-r],[mx+r,h,mz-r],[mx+r,h,mz+r],[mx-r,h,mz+r]],A=q(2.1,.95),B=q(15.2,.55),ap=[mx,16.9,mz],sh=stone.clone().multiplyScalar(1.08);
  for(let i=0;i<4;i++){const j=(i+1)%4;det.qa(A[i],A[j],B[j],B[i],sh,[mx,8,mz]);det.qa(B[i],B[j],ap,ap,sh,[mx,15.2,mz])}
  addCol(mx-2.2,mz-2.2,mx+2.2,mz+2.2,'rock');
  for(const sd of [[-1,0],[1,0],[0,-1],[0,1]]){det.box(mx+sd[0]*3.2-.35,.3,mz+sd[1]*3.2-.35,mx+sd[0]*3.2+.35,.7,mz+sd[1]*3.2+.35,stone2)}}
 // mausoléu com porta (futuramente enterável)
 {const uA=W/2-5.2,uB=W/2+5.2,H=5.4,col=stone.clone().multiplyScalar(1.04);
  F.box(uA,uB,vf,vb,.26,H,col,det,'bld');F.box(uA-.5,uB+.5,vf-1.7,vb+.5,H,H+.55,stone2,det);F.box(uA-.8,uB+.8,vf-3.2,vf-1.5,.26,.5,stone2,det);F.box(uA-.6,uB+.6,vf-2.6,vf-1.5,.5,.8,stone2,det);
  for(let k=0;k<4;k++){const u=uA+.2+k*(uB-uA-.4)/3,p=F.pt(u,vf-1.1);det.geo(GEO.cyl16,mtx(p[0],2.7,p[1],.4,4.2,.4),stone2);det.geo(GEO.cyl16,mtx(p[0],.62,p[1],.55,.25,.55),stone2);det.geo(GEO.cyl16,mtx(p[0],4.9,p[1],.55,.25,.55),stone2)}
  F.box(uA-.5,uB+.5,vf-1.7,vf,4.7,H,stone2,det);
  const RA=F.p3(uA-.6,H+.55,vf-1.7),RB=F.p3(uB+.6,H+.55,vf-1.7),RT=F.p3(W/2,H+2.3,vf-1.7),RA2=F.p3(uA-.6,H+.55,vb+.5),RB2=F.p3(uB+.6,H+.55,vb+.5),RT2=F.p3(W/2,H+2.3,vb+.5),ref=F.p3(W/2,3,(vf+vb)/2),rc=stone2.clone().multiplyScalar(.9);
  det.qa(RA,RB,RT,RT,col,ref);det.qa(RA2,RB2,RT2,RT2,col,ref);det.qa(RA,RT,RT2,RA2,rc,ref);det.qa(RB,RT,RT2,RB2,rc,ref);
  F.box(W/2-.1,W/2+.1,vf-1.8,vf-1.6,H+.7,H+1.9,stone2,det);F.box(W/2-.5,W/2+.5,vf-1.8,vf-1.6,H+1.3,H+1.5,stone2,det);
  // porta
  F.box(W/2-1.15,W/2+1.15,vf-.22,vf,.3,3.7,stone2,det);F.box(W/2-.88,W/2+.88,vf-.3,vf-.2,.3,3.45,iron,det);
  for(let k=-2;k<=2;k++)F.box(W/2+k*.3-.025,W/2+k*.3+.025,vf-.34,vf-.28,2.2,3.35,COL('#4a4a52'),det);F.box(W/2-.88,W/2+.88,vf-.34,vf-.28,2.15,2.25,COL('#4a4a52'),det);
  F.box(W/2-.06,W/2+.06,vf-.4,vf-.2,.3,3.45,COL('#2a2a30'),det);F.box(W/2+.35,W/2+.5,vf-.42,vf-.3,1.5,1.65,COL('#c8a030'),det);
  const pd=F.pt(W/2,vf-.9);city.mausoleum={x:pd[0],z:pd[1],face:f};
  for(const sd of [-1,1]){const p=F.pt(W/2+sd*(uB-W/2+1.3),vf-2.4);det.geo(GEO.cyl,mtx(p[0],.95,p[1],.45,1.3,.45),stone2);det.geo(GEO.hemi,mtx(p[0],1.6,p[1],.62,.5,.62),stone2)}}
 // árvores secas e retorcidas
 const treeAt=[];const nT=Math.max(7,Math.round(W*D/620));
 for(let k=0,tries=0;k<nT&&tries<80;tries++){const u=rr(vi+3,W-vi-3),v=rr(vi+3,D-vi-3);if(Math.abs(u-W/2)<4||Math.abs(v-czo)<3.2||Math.hypot(u-cxo,v-czo)<9||(Math.abs(u-W/2)<9&&v>vf-4)||treeAt.some(q=>Math.hypot(q[0]-u,q[1]-v)<8))continue;
  treeAt.push([u,v]);const p=F.pt(u,v);worldDeadTree(plants,p[0],p[1],rr(1.15,1.7),bark,true);addCol(p[0]-.35,p[1]-.35,p[0]+.35,p[1]+.35,'rock');k++}
 // lápides
 const stones=night?['#8a86a6','#6e6a88','#a09cb8','#5e5a78']:['#9a968c','#b4b0a4','#7c7a76','#c4c0b4','#8a8c88'];
 for(let u=vi+2.6;u<W-vi-2.4;u+=3.7){for(let v=vi+3.2;v<D-vi-2.4;v+=4.6){
   const uu=u+rr(-.45,.45),vv=v+rr(-.5,.5);
   if(Math.abs(uu-W/2)<2.8&&vv<vf)continue;if(Math.abs(vv-czo)<2.2)continue;if(Math.hypot(uu-cxo,vv-czo)<8.6)continue;if(Math.abs(uu-W/2)<9&&vv>vf-4.5)continue;if(vv<vi+4&&Math.abs(uu-W/2)<5)continue;
   if(treeAt.some(q=>Math.hypot(q[0]-uu,q[1]-vv)<2.2))continue;if(R()<.2)continue;
   const p=F.pt(uu,vv),r=R(),type=r<.34?0:r<.5?1:r<.7?2:r<.82?3:r<.86?4:5,tilt=R()<.2;
   const yaw=(f==='s'?0:f==='n'?Math.PI:f==='e'?Math.PI/2:-Math.PI/2)+rr(-.12,.12);
   if(R()<.55)rr(.8,1.05); /* v78: mancha de terra da cova REMOVIDA a pedido; sorteios mantidos para não mudar a seed */
   worldTomb(det,p[0],p[1],yaw,type,COL(pick(stones)).multiplyScalar(rr(.82,1.05)),tilt);
   if(R()<.22){const fp=F.pt(uu+rr(-.3,.3),vv-.9);det.box(fp[0]-.12,.31,fp[1]-.12,fp[0]+.12,.55,fp[1]+.12,COL(pick(['#c82a3a','#e8e0d0','#d8b030','#7a4ad6'])))}
   addCol(p[0]-.55,p[1]-.4,p[0]+.55,p[1]+.4,'rock').low=.85}}
 // névoa rasteira (manchas de brilho suave)
 for(let k=0;k<Math.round(W*D/190);k++){const p=F.pt(rr(vi,W-vi),rr(vi,D-vi)),s=rr(5,10);glow.flat(p[0]-s,p[1]-s,p[0]+s,p[1]+s,.5,COL(night?'#7a86b8':'#c8d2dc').multiplyScalar(night?.12:.2))}}

/* ---------- DELEGACIA ---------- */
function wbox(F,u0,u1,v0,v1){const a=F.pt(u0,v0),b=F.pt(u1,v1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]}
function worldPolice(K){const{det,neon,hwin,walls,signs,night,F,W,D,f,doorAt,tree}=K;
 const wc=COL(night?'#9a9cc4':'#e6eaf0'),wc2=wc.clone().multiplyScalar(.88),blue=COL(night?'#4a5cc8':'#1f4a9a'),blue2=blue.clone().multiplyScalar(.62),glass=COL(night?'#ffd9a0':'#7ab0d0'),red=COL('#d8303a'),v0=10.5,v1=D-7,m0=W*.3,m1=W*.7,H=13,ns=f==='n'||f==='s';
 F.box(m0,m1,v0,v1,.26,H,wc,walls,true,{win:[.25,.25]});F.box(m0-.3,m1+.3,v0-.3,v1+.3,H,H+.7,blue,det);
 for(const[a,b] of [[W*.1,m0],[m1,W*.9]]){F.box(a,b,v0+4,v1-5,.26,8.2,wc2,walls,true,{win:[.125,.25]});F.box(a-.25,b+.25,v0+3.75,v1-4.75,8.2,8.8,blue,det);F.box(a,b,v0+3.9,v0+4,3.9,4.5,blue2,det)}
 F.box(m0+1,m1-1,v0-.12,v0,5.0,H-1.6,glass,hwin);F.box(m0,m1,v0-.2,v0,4.6,5.0,blue,det);F.box(m0,m1,v0-.2,v0,H-1.6,H-1.2,blue,det);
 // pórtico de entrada, degraus e porta de vidro
 for(let k=0;k<3;k++)F.box(W/2-5.6-k*.4,W/2+5.6+k*.4,v0-1.5-k*.9,v0,.26+k*.0,.26+(3-k)*.2,COL(night?'#8a8aa8':'#c8c8c0'),det,k===0?'rock':false);
 F.box(W/2-5.6,W/2+5.6,v0-4.4,v0,4.2,4.7,blue,det);for(const u of [W/2-5.2,W/2-1.8,W/2+1.8,W/2+5.2]){const p=F.pt(u,v0-3.9);det.geo(GEO.cyl16,mtx(p[0],2.3,p[1],.32,4,.32),wc)}
 F.box(W/2-2.4,W/2+2.4,v0-.14,v0,.8,3.8,glass,hwin);F.box(W/2-2.5,W/2+2.5,v0-.2,v0-.1,.8,.95,blue2,det);F.box(W/2-2.5,W/2+2.5,v0-.2,v0-.1,3.7,3.9,blue2,det);F.box(W/2-.05,W/2+.05,v0-.2,v0-.1,.8,3.8,blue2,det);
 // letreiro: só a placa oficial no painel da fachada (o neon POLÍCIA saiu; os dois ocupavam o mesmo lugar)
 F.box(W/2-5.2,W/2+5.2,v0-.3,v0,6.2,9.1,blue2,det);
 sunsetFacade(K.ch,F,W/2,v0-.34,7.65,10.1,1.92,['DELEGACIA DE','SUNSET SHORES'],'#172b55','#f2f5ff');
 // teto: antena, parabólica, sirenes e bandeira
 {const p=F.pt(m0+3,v1-4);det.box(p[0]-.1,H+.7,p[1]-.1,p[0]+.1,H+9,p[1]+.1,COL('#6a6a72'));for(let y=H+3;y<H+8;y+=1.6){const q=F.pt(m0+3,v1-4);det.box(q[0]-.7,y,q[1]-.04,q[0]+.7,y+.07,q[1]+.04,COL('#6a6a72'))}
  neon.box(p[0]-.15,H+9,p[1]-.15,p[0]+.15,H+9.4,p[1]+.15,COL('#ff2a1a'));
  const d=F.pt(m1-4,v1-6);det.geo(GEO.hemi,mtx(d[0],H+1.6,d[1],1.5,.8,1.5,2.4,0,0),COL('#e8e8ee'));det.box(d[0]-.08,H+.7,d[1]-.08,d[0]+.08,H+1.6,d[1]+.08,COL('#6a6a72'));
  for(const[u,col] of [[m0+1,'#ff2a3a'],[m1-1,'#2a6aff']]){const q=F.pt(u,v0+2);neon.box(q[0]-.4,H+.7,q[1]-.4,q[0]+.4,H+1.2,q[1]+.4,COL(col))}
  const fp=F.pt(W*.18,3.2);det.box(fp[0]-.08,.26,fp[1]-.08,fp[0]+.08,9,fp[1]+.08,COL('#cfd0d6'));F.box(W*.18+.08,W*.18+1.9,3.2-.02,3.2+.02,6.9,8.4,COL('#2a4ab0'),det)}
 // faixas azuis e grades nas laterais, árvores na frente
 for(const u of [W*.05,W*.95]){const p=F.pt(u,5);tree(p[0],p[1],.26,1.05)}
 for(let u=W*.1;u<m0-3;u+=6.5){const p=F.pt(u,v0+9);det.box(p[0]-.5,.26,p[1]-.5,p[0]+.5,1.1,p[1]+.5,COL(night?'#1e4a3c':'#3a6a3a'))}
 if(night){F.box(m0,m1,v0-.3,v0-.2,H-.1,H+.1,COL('#4aa8ff'),neon);F.box(W/2-5.6,W/2+5.6,v0-4.5,v0-4.4,4.1,4.25,COL('#ff3a4a'),neon)}
 /* v78 · DELEGACIA (ref. Los Santos PD): pátio cercado nos fundos, guarita, holofotes, heliponto no telhado, 2º mastro */
 {const roofD=K.roofD||det,metal=COL(night?'#7a7e8a':'#b8bcc4'),dmetal=COL(night?'#3a3c44':'#6a6e76'),y=H+.7;
  // heliponto marcado no telhado do bloco central (sem sombra)
  {const c=F.pt(W/2,(v0+v1)/2),r=Math.min((m1-m0)/2-1.5,(v1-v0)/2-1.5,6);roofD.geo(GEO.cyl,mtx(c[0],y+.04,c[1],r,.06,r),COL(night?'#3a3c48':'#5a5c64'));roofD.geo(GEO.cyl,mtx(c[0],y+.08,c[1],r-.3,.02,r-.3),COL('#f2c21a'));roofD.geo(GEO.cyl,mtx(c[0],y+.09,c[1],r-.6,.02,r-.6),COL(night?'#3a3c48':'#5a5c64'));
   const hs=COL('#f4f4f0'),k=r*.32;F.box(W/2-k,W/2-k*.6,(v0+v1)/2-k*1.3,(v0+v1)/2+k*1.3,y+.1,y+.13,hs,roofD);F.box(W/2+k*.6,W/2+k,(v0+v1)/2-k*1.3,(v0+v1)/2+k*1.3,y+.1,y+.13,hs,roofD);F.box(W/2-k*.6,W/2+k*.6,(v0+v1)/2-k*.2,(v0+v1)/2+k*.2,y+.1,y+.13,hs,roofD)}
  for(const[a,b] of [[W*.1,m0],[m1,W*.9]])for(let k=0;k<2;k++){const u=a+1.5+k*((b-a)-4),v=v1-7;F.box(u,u+1.4,v,v+1.1,8.8,9.7,metal,roofD)}
  // pátio cercado (alambrado com fios horizontais e arame no topo)
  if(D-v1>=5){const u0=W*.1,u1=W*.9,b0=v1+.4,b1=D-.6,post=(u,v)=>F.box(u-.06,u+.06,v-.06,v+.06,.26,2.9,dmetal,det),run=(ua,va,ub,vb)=>{for(const yy of[.5,1.1,1.7,2.3])F.box(Math.min(ua,ub),Math.max(ua,ub)+.02,Math.min(va,vb),Math.max(va,vb)+.02,yy,yy+.03,metal,det);F.box(Math.min(ua,ub),Math.max(ua,ub)+.02,Math.min(va,vb),Math.max(va,vb)+.02,2.75,2.8,dmetal,det)};
   for(let u=u0;u<=u1;u+=2.5){post(u,b1)}for(let v=b0;v<=b1;v+=2.5){post(u0,v);post(u1,v)}run(u0,b1,u1,b1);run(u0,b0,u0,b1);run(u1,b0,u1,b1);
   {const a=F.pt(u0,b1),c=F.pt(u1,b1+.1);addCol(Math.min(a[0],c[0]),Math.min(a[1],c[1]),Math.max(a[0],c[0]),Math.max(a[1],c[1]),'rock');for(const u of[u0,u1]){const q=F.pt(u,b0),r=F.pt(u+.1,b1);addCol(Math.min(q[0],r[0]),Math.min(q[1],r[1]),Math.max(q[0],r[0]),Math.max(q[1],r[1]),'rock')}}
   // guarita junto ao portão lateral
   {const u=u1-3.2,v=b0+.3;F.box(u,u+2.2,v,v+2,.26,2.6,wc,det,'rock');F.box(u-.15,u+2.35,v-.15,v+2.15,2.6,2.8,blue,det);F.box(u+.3,u+1.9,v-.02,v,1.2,2.2,glass,hwin)}
   // viaturas guardadas no pátio
   for(const[k,u] of [[0,W*.3],[1,W*.5]]){const id='station-yard-'+K.ch.key+'-'+Math.round(F.pt(W/2,D)[0])+'-'+k;if(city.taken.has(id)||S.style==='inverted')continue;const p=F.pt(u,(b0+b1)/2);const car=makeVehicle(k?'van':'police',p[0],p[1],Math.atan2(F.nrm[1],F.nrm[0])+Math.PI/2);car.hand=true;car.sleep=true;car.lightsOff=true;car.stationParked=true;car.spotId=id;K.ch.cars.push(car)}
   // postes de holofote nos cantos do pátio
   for(const u of[u0+.4,u1-.4]){const p=F.pt(u,b1-.4);det.box(p[0]-.1,.26,p[1]-.1,p[0]+.1,7,p[1]+.1,dmetal);det.box(p[0]-.5,7,p[1]-.3,p[0]+.5,7.4,p[1]+.3,metal);if(night)neon.box(p[0]-.45,6.92,p[1]-.25,p[0]+.45,7,p[1]+.25,COL('#fff6d8'))}}
}
 // porta: ponto de renascimento de quem é preso
 // Two parked patrol cars flank the entrance, within the station forecourt.
 for(const [slot,u]of [[0,W*.25],[1,W*.75]]){
  const id='station-police-'+K.ch.key+'-'+Math.round(F.pt(W/2,1.8)[0])+'-'+slot;
  if(city.taken.has(id)||S.style==='inverted')continue;
  const point=F.pt(u,3);
  const car=makeVehicle('police',point[0],point[1],Math.atan2(F.nrm[1],F.nrm[0]));
  car.hand=true;car.sleep=true;car.lightsOff=true;car.stationParked=true;car.spotId=id;K.ch.cars.push(car);
 }
 doorAt(F,W/2,v0-4.2);const sp=F.pt(W/2,1.8);city.polDoor={x:sp[0],z:sp[1]};if(K.ch&&!pickups.some(k=>k.id==='polarmor')){const ap=F.pt(W/2+3.4,1.6);makePickup('polarmor',ap[0],ap[1],100,K.ch,'armor').respawn=true}}

/* ---------- FAROL na ponta da barra de areia ---------- */
// Faixa de areia em rampa entre t0 e t1: do fim da grama até um pouco abaixo da água. Nas pontas reais
// da praia (início/fim do trecho de areia) fecha a lateral até o nível do terreno vizinho.
/* v3 r35: espuma da costa em pedaços de 3 m seguindo a linha d'água irregular (reto onde coastW = 0) */
function foamCoast(fm,s,t0,t1,W,sd){if(t1-t0<.05)return;const tg=s<2?[1,0]:[0,1];let a=t0,pa=wTU(s,a,coastUr(a,W));
 while(a<t1-.01){let b=Math.min(t1,a+3);if(!coastW(a)&&!coastW(b)&&!coastW((a+b)/2)){let e=b;while(e<t1-.01&&!coastW(Math.min(t1,e+3)))e=Math.min(t1,e+3);b=e}
  const pb=wTU(s,b,coastUr(b,W)),dx=pb[0]-pa[0],dz=pb[1]-pa[1],L=Math.hypot(dx,dz)||1;let nx=dz/L,nz=-dx/L;if(nx*sd[0]+nz*sd[1]<0){nx=-nx;nz=-nz}
  worldFoamStrip(fm,pa[0],pa[1],pb[0],pb[1],nx,nz,11,SEA_Y+.035);a=b;pa=pb}}
function beachSand(mb,s,t0,t1,col){const us=[SAND0,SAND_FLAT];for(let u=SAND_FLAT+1.5;u<SHORE+3;u+=1.5)us.push(u);us.push(SHORE+3);
 const P3=(t,u,y)=>{const q=wTU(s,t,coastUr(t,u));return[q[0],y,q[1]]},uv=start=>{for(let k=start.p;k<mb.p.length;k+=3){const i=k/3;mb.u[i*2]=mb.p[k]/9;mb.u[i*2+1]=mb.p[k+2]/9}};
 /* v3 r35: u aqui é o efetivo (perfil igual ao de antes); cada coluna de 4 m é empurrada para a borda irregular por coastUr */
 const nT=Math.max(1,Math.ceil((t1-t0)/4));for(let j=0;j<nT;j++){const ta=t0+(t1-t0)*j/nT,tb=t0+(t1-t0)*(j+1)/nT;
 for(let i=0;i<us.length-1;i++){const u=us[i],v=us[i+1],yu=beachProfile(u),yv=beachProfile(v),st={p:mb.p.length};mb.qa(P3(ta,u,yu),P3(tb,u,yu),P3(tb,v,yv),P3(ta,v,yv),wetSand(col,(u+v)/2),P3((ta+tb)/2,u,-20));uv(st)}}
 const br=beachRange(),wall=COL(city.st&&city.st.synth?'#4a4458':'#9a958a');
 for(const[t,inside] of [[t0,t0+5],[t1,t1-5]]){if(Math.abs(t-br[0])>.01&&Math.abs(t-br[1])>.01)continue;
  for(let i=0;i<us.length-1;i++){const u=us[i],v=Math.min(SHORE-.5,us[i+1]);if(u>=v)break;mb.qa(P3(t,u,beachProfile(u)),P3(t,v,beachProfile(v)),P3(t,v,.2),P3(t,u,.2),wall,P3(t+(t-inside),(u+v)/2,0))}}}
/* v3 r27 · PEDRAS LISAS (estilo PS2): icosfera INDEXADA (vértices compartilhados → normais suaves e sem rachar quando o ruído desloca),
   amassada por senos + 3 cortes planos (faces de pedra lascada com quina macia), base achatada; atributo color = sombreado (base mais escura,
   manchas). mbGeoTint copia para o lote multiplicando a cor do lote por esse atributo. Variantes cacheadas em ROCK_GEOS (não descartar). */
function icoIndexed(det){const g=new THREE.IcosahedronGeometry(1,det),p=g.attributes.position,map=new Map(),pos=[],idx=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=Math.round(x*1e4)+','+Math.round(y*1e4)+','+Math.round(z*1e4);let j=map.get(k);if(j===undefined){j=pos.length/3;map.set(k,j);pos.push(x,y,z)}idx.push(j)}
 g.dispose();const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setIndex(idx);return o}
function rockGeoMake(seed,det,fl){const r=mulberry32(seed>>>0),g=icoIndexed(det),p=g.attributes.position,n=p.count,ph=[],cuts=[];fl=fl??.3;
 for(let i=0;i<6;i++)ph.push(r()*6.283);
 for(let i=0;i<3;i++){const a=r()*6.283,e=(r()-.3)*1.2,c=Math.cos(e);cuts.push([Math.cos(a)*c,Math.sin(e),Math.sin(a)*c,.62+r()*.2])}
 const col=new Float32Array(n*3);
 for(let i=0;i<n;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const k=1+.17*Math.sin(x*2.3+ph[0])*Math.sin(z*2.1+ph[1])+.11*Math.sin(y*3.7+x*1.3+ph[2])+.06*Math.sin(z*5.1+y*4.4+ph[3])+(r()-.5)*.05;x*=k;y*=k;z*=k;
  for(const c of cuts){const d=x*c[0]+y*c[1]+z*c[2]-c[3];if(d>0){x-=c[0]*d*.85;y-=c[1]*d*.85;z-=c[2]*d*.85}}
  if(y<-fl)y=-fl+(y+fl)*.18;p.setXYZ(i,x,y,z);
  const sh=.68+.32*clamp((y+fl)/(1+fl),0,1),sp=.9+.2*(.5+.5*Math.sin(x*6.3+ph[4])*Math.sin(z*5.7+ph[5]));col[i*3]=col[i*3+1]=col[i*3+2]=sh*sp}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();g.computeBoundingBox();return g}
let ROCK_GEOS=null;
function rockGeos(){return ROCK_GEOS||(ROCK_GEOS=[0,1,2,3,4,5].map(i=>rockGeoMake(0x5eed1+i*977,1)))}
function mbGeoTint(mb,g,m,col){const c0=mb.c.length;mb.geo(g,m,col);const ca=g.attributes.color;if(!ca)return;const ix=(!mb.idx&&g.index)?g.index:null,n=(mb.c.length-c0)/3;
 for(let i=0;i<n;i++){const k=ca.getX(ix?ix.getX(i):i),q=c0+i*3;mb.c[q]*=k;mb.c[q+1]*=k;mb.c[q+2]*=k}}
function lhSkY(p){return Math.min(SEA_Y-1,seabedYt(city.coast<2?p[0]:p[1],outDist(p[0],p[1]))-.4)}
function worldLighthouse(K){const L=city.lh,{det,neon,hwin,sandMb,signs,night}=K,s=L.s,wt=(t,u)=>wTU(s,t,u);
 const sandC=COL(night?'#5a4a62':'#e3cf9a'),skirt=sandC,Y=.18; /* v79r2: mesmo tom da praia principal (sem o ×1,12 que deixava a areia clara) */
 const sandFace=(a,b,c,d)=>{const start=sandMb.p.length;
  const up=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  if(up<0)sandMb.quad(a,d,c,b,0,1,0,[0,0,1,1],sandC);else sandMb.quad(a,b,c,d,0,1,0,[0,0,1,1],sandC);
  for(let k=start;k<sandMb.p.length;k+=3){const q=k/3;sandMb.u[q*2]=sandMb.p[k]/9;sandMb.u[q*2+1]=sandMb.p[k+2]/9} /* dev r2.3: por vértice (MB indexado: quad = 4 vértices, não 6) */
 };
 // barra de areia + ponta redonda (com saia inclinada até o fundo)
 {const sk=3.5,stp=1.25,rr2=mulberry32((S.seed^0x2b0c4e11)>>>0),rockC=[COL(night?'#5a566e':'#8a8a8e'),COL(night?'#4a465e':'#6e6e72'),COL(night?'#6a6680':'#a2a09a')];
  /* v3 r27: pedra = variante lisa (rockGeos) + colisão do tamanho real da pedra (caixa ~78% do raio, só se passar do chão do caminho) */
  const RG=rockGeos(),skY=e=>Y-(Y-(SEA_Y-1))*e/sk,rockAt=(x,y,z,sx,sy,sz,ry,col)=>{const g=RG[Math.floor(rr2()*RG.length)],bb=g.boundingBox;
   mbGeoTint(det,g,mtx(x,y,z,sx,sy,sz,(rr2()-.5)*.3,ry,(rr2()-.5)*.3),col);const top=y+sy*bb.max.y;if(top<Y+.2)return;
   const r=.78*Math.max(sx*Math.max(-bb.min.x,bb.max.x),sz*Math.max(-bb.min.z,bb.max.z));addCol(x-r,z-r,x+r,z+r,'rock').low=top-Y};
  for(let u=L.u0;u<L.uC-.01;u+=stp){const u1=Math.min(L.uC,u+stp),c0=lhC(L,u),c1=lhC(L,u1),w0=lhW(L,u),w1=lhW(L,u1);
   const A=wt(c0-w0,u),B=wt(c0+w0,u),C2=wt(c1+w1,u1),D2=wt(c1-w1,u1);
   sandFace([A[0],Y,A[1]],[B[0],Y,B[1]],[C2[0],Y,C2[1]],[D2[0],Y,D2[1]]);
   for(const sd of [-1,1]){
    // A saia da barra termina exatamente onde a borda do caminho encontra a ponta redonda (dali em diante quem fecha é a saia da ponta).
    const edge=v=>wt(lhC(L,v)+sd*lhW(L,v),v),inPad=v=>{const e=edge(v);return Math.hypot(e[0]-L.cx,e[1]-L.cz)<L.pad};if(inPad(u))continue;let ue=u1;
    if(inPad(u1)){let lo=u,hi=u1;for(let k=0;k<20;k++){const m=(lo+hi)/2;if(inPad(m))hi=m;else lo=m}ue=hi}
    const e0=edge(u),e1=edge(ue),o0=wt(lhC(L,u)+sd*(lhW(L,u)+sk),u),o1=wt(lhC(L,ue)+sd*(lhW(L,ue)+sk),ue),mid=wt(lhC(L,(u+ue)/2),(u+ue)/2);
    sandMb.qa([e0[0],Y,e0[1]],[e1[0],Y,e1[1]],[o1[0],lhSkY(o1),o1[1]],[o0[0],lhSkY(o0),o0[1]],skirt,[mid[0],SEA_Y-3,mid[1]]); /* v3 r31: saia desce até o fundo (talude) */
    /* v3 r27: enrocamento — pedras lisas assentadas na saia (descendo até a água) + algumas pequenas no topo; todas com colisão */
    if(rr2()<.92){const uu=u+rr2()*stp,e=.35+rr2()*1.25,sc=.75+rr2()*.75,p=wt(lhC(L,uu)+sd*(lhW(L,uu)+e),uu);
      if(Math.hypot(p[0]-L.cx,p[1]-L.cz)>L.pad+.8)rockAt(p[0],skY(e)+sc*.2,p[1],sc*(1+rr2()*.5),sc*(.6+rr2()*.3),sc*(1+rr2()*.4),rr2()*6.28,rockC[Math.floor(rr2()*3)])}
    if(rr2()<.3){const uu=u+rr2()*stp,sc=.22+rr2()*.25,p=wt(lhC(L,uu)+sd*(lhW(L,uu)-.35-rr2()*.5),uu);
      if(Math.hypot(p[0]-L.cx,p[1]-L.cz)>L.pad+.5)rockAt(p[0],Y+sc*.12,p[1],sc*(1+rr2()*.4),sc*(.55+rr2()*.3),sc*(1+rr2()*.4),rr2()*6.28,rockC[Math.floor(rr2()*3)])}}}
  const N=28,cx=L.cx,cz=L.cz,pr=L.pad;
  for(let k=0;k<N;k++){const a0=k/N*6.2832,a1=(k+1)/N*6.2832,p0=[cx+Math.cos(a0)*pr,cz+Math.sin(a0)*pr],p1=[cx+Math.cos(a1)*pr,cz+Math.sin(a1)*pr];
   sandFace([cx,Y,cz],[p0[0],Y,p0[1]],[p1[0],Y,p1[1]],[p1[0],Y,p1[1]]);
   // saia em volta da ponta inteira (o lado da barra fica escondido sob o topo do caminho)
   {const q1=[cx+Math.cos(a1)*(pr+sk),cz+Math.sin(a1)*(pr+sk)],q0=[cx+Math.cos(a0)*(pr+sk),cz+Math.sin(a0)*(pr+sk)];sandMb.qa([p0[0],Y,p0[1]],[p1[0],Y,p1[1]],[q1[0],lhSkY(q1),q1[1]],[q0[0],lhSkY(q0),q0[1]],skirt,[cx,SEA_Y-3,cz])}}
  /* v3 r27: pé do farol — enrocamento em volta da ponta redonda (fora do lado que liga ao caminho), duas camadas */
  for(let k=0;k<34;k++){const a=(k+rr2()*.6)/34*6.2832,ca=Math.cos(a),sa=Math.sin(a);if(outDist(cx+ca*pr,cz+sa*pr)<L.uC-1)continue;
   for(let q=0;q<2;q++){const e=q?1.5+rr2()*.9:.3+rr2()*.7,sc=q?.9+rr2()*.7:.7+rr2()*.6;rockAt(cx+ca*(pr+e),skY(e)+sc*.2,cz+sa*(pr+e),sc*(1+rr2()*.5),sc*(.6+rr2()*.35),sc*(1+rr2()*.4),rr2()*6.28,rockC[Math.floor(rr2()*3)])}}}
 // torre listrada e arredondada
 const cx=L.cx,cz=L.cz,red=COL(night?'#ff3e9a':'#c8282a'),wht=COL(night?'#e8e0f4':'#f2f2ee'),stone=COL(night?'#6a6482':'#8a8a8c'),iron=COL('#1c1c22'),H=L.H;
 const rad=y=>L.R0-(y-1.2)/(H-1.2-1.4)*(L.R0-L.R1);
 det.geo(GEO.cyl16,mtx(cx,.7,cz,3.7,1.04,3.7),stone);
 {const bands=5,y0=1.2,y1=H-1.4,bh=(y1-y0)/bands;for(let b=0;b<bands;b++){const ya=y0+b*bh,yb=ya+bh;wfrust(det,cx,ya,cz,yb,rad(ya),rad(yb),b%2?wht:red,24)}
  wfrust(det,cx,y1,cz,H-.35,rad(y1),L.R1+.2,stone,24);
  for(const[dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])for(const y of [6,11.5,17]){const r=rad(y)+.02,px=cx+dx*r,pz=cz+dz*r,hx=dx?.07:.25,hz=dz?.07:.25;det.box(px-hx,y,pz-hz,px+hx,y+1.1,pz+hz,COL(night?'#241a38':'#20303c'))}}
 // galeria (sacada) com grade e laje redonda
 det.geo(GEO.cyl16,mtx(cx,H-.2,cz,4.75,.4,4.75),stone);wfrust(det,cx,H-1.5,cz,H-.38,L.R1+.1,4.2,COL(night?'#4a4466':'#6a6a6e'),24);
 {const N=26,pr=L.rail-.05;let pa=null;for(let k=0;k<=N;k++){const a=k/N*6.2832,x=cx+Math.cos(a)*pr,z=cz+Math.sin(a)*pr;if(k<N)det.box(x-.04,H,z-.04,x+.04,H+1.05,z+.04,iron);
   if(pa){wseg(det,pa[0],H+1.05,pa[1],x,H+1.05,z,.04,iron,GEO.cyl16);wseg(det,pa[0],H+.55,pa[1],x,H+.55,z,.03,iron,GEO.cyl16)}pa=[x,z]}}
 // sala da lanterna
 det.geo(GEO.cyl16,mtx(cx,H+.45,cz,1.7,.9,1.7),red);wfrust(hwin,cx,H+.9,cz,H+3.1,1.55,1.5,COL('#b8dcf0'),20);
 for(let k=0;k<8;k++){const a=k/8*6.2832;wseg(det,cx+Math.cos(a)*1.56,H+.9,cz+Math.sin(a)*1.56,cx+Math.cos(a)*1.52,H+3.1,cz+Math.sin(a)*1.52,.06,iron,GEO.cyl16)}
 hwin.geo(GEO.sph,mtx(cx,H+2.0,cz,.62,.62,.62),COL('#fff4c8'));
 det.geo(GEO.cyl16,mtx(cx,H+3.2,cz,1.9,.2,1.9),iron);det.geo(GEO.hemi,mtx(cx,H+3.3,cz,1.95,1.5,1.95),red);det.geo(GEO.cyl16,mtx(cx,H+5.0,cz,.12,.8,.12),iron);det.geo(GEO.sph,mtx(cx,H+5.5,cz,.28,.28,.28),iron);
 // porta de baixo (lado da terra): alpendre baixo + porta + letreiro
 const ax=(dir,r0,r1,hw,y0,y1,col,mb)=>{const d=dir;let x0,x1,z0,z1;if(d[0]){x0=cx+Math.min(d[0]*r0,d[0]*r1);x1=cx+Math.max(d[0]*r0,d[0]*r1);z0=cz-hw;z1=cz+hw}else{z0=cz+Math.min(d[1]*r0,d[1]*r1);z1=cz+Math.max(d[1]*r0,d[1]*r1);x0=cx-hw;x1=cx+hw}(mb||det).box(x0,y0,z0,x1,y1,z1,col)};
 {const d=L.inl,r0=L.R0-.4,r1=L.R0+L.porch;ax(d,r0,r1,1.5,.18,3.1,wht);ax(d,r0,r1+.35,1.75,3.1,3.4,red);ax(d,r1-.02,r1+.1,.95,.18,2.75,stone);ax(d,r1+.08,r1+.14,.72,.18,2.6,COL('#3a2418'));ax(d,r1+.1,r1+.2,.06,.18,2.6,iron);ax(d,r1+.12,r1+.3,.06,1.1,1.2,COL('#d8b040'));
  for(let k=0;k<2;k++)ax(d,r1+.1+k*.35,r1+.6+k*.35,1.2-k*.1,.18,.18+(2-k)*.1,stone);
  const fc=d[1]>0?'s':d[1]<0?'n':d[0]>0?'e':'w',rr1=r1+.12;worldSignQuad(signs,fc,cx-rr1,cz-rr1,cx+rr1,cz+rr1,(d[0]?cz:cx)-1.35,(d[0]?cz:cx)+1.35,3.45,4.45,.08,35,false);
  if(night)ax(d,r1+.1,r1+.16,.7,3.02,3.08,COL('#ffd9a0'),neon)}
 // porta de cima (lado do mar)
 {const d=L.sea,r0=L.R1-.3,r1=L.R1+.5;ax(d,r0,r1,.75,H,H+2.2,wht);ax(d,r0,r1+.5,.95,H+2.2,H+2.4,red);ax(d,r1-.02,r1+.08,.52,H,H+1.95,COL('#3a2418'));ax(d,r1+.06,r1+.14,.05,H,H+1.95,iron)}
 // colisão: anel de caixas ao redor do fuste (a calçada do topo fica livre)
 for(let k=0;k<12;k++){const a=k/12*6.2832,x=cx+Math.cos(a)*2.5,z=cz+Math.sin(a)*2.5;addCol(x-.62,z-.62,x+.62,z+.62,'rock')}
 /* v3 r27: no chão, o pedestal de pedra tem raio 3,7 (o anel acima parava o jogador ~0,4 m dentro dele) + caixa do alpendre da porta. lhBase = ignoradas lá em cima (LH.up). */
 for(let k=0;k<16;k++){const a=k/16*6.2832,x=cx+Math.cos(a)*3.2,z=cz+Math.sin(a)*3.2;addCol(x-.52,z-.52,x+.52,z+.52,'rock').lhBase=true}
 {const d=L.inl,r0=L.R0-.4,r1=L.R0+L.porch,p0=[cx+d[0]*r0-Math.abs(d[1])*1.5,cz+d[1]*r0-Math.abs(d[0])*1.5],p1=[cx+d[0]*r1+Math.abs(d[1])*1.5,cz+d[1]*r1+Math.abs(d[0])*1.5];
  addCol(Math.min(p0[0],p1[0]),Math.min(p0[1],p1[1]),Math.max(p0[0],p1[0]),Math.max(p0[1],p1[1]),'rock').lhBase=true}}

