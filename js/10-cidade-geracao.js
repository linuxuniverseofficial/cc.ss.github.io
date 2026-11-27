'use strict';
/* Coastal Chaos · js/10-cidade-geracao.js — Móveis da casa segura, vento/folhas, aeroporto (zoneamento), generateCity, placas de rua, iso-fade, guarda-sóis.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ---------- CASA SEGURA: móveis arredondados ---------- */
function worldSafeFurn(g,mb,X,Z,W,D,H,C,noTv){const m2=new MB();
 const cb=(x0,y0,z0,x1,y1,z1,col,c)=>m2.cbox(x0,y0,z0,x1,y1,z1,col,c),bx=(x0,y0,z0,x1,y1,z1,col)=>ibox(mb,x0,y0,z0,x1,y1,z1,col);
 const cy=(x,y0,y1,z,r,col,mm)=>(mm||m2).geo(GEO.cyl16,mtx(x,(y0+y1)/2,z,r,y1-y0,r),col),sp=(x,y,z,rx,ry,rz,col)=>m2.geo(GEO.sph,mtx(x,y,z,rx,ry,rz),col),ic=(x,y,z,rx,ry,rz,col)=>m2.geo(GEO.ico,mtx(x,y,z,rx,ry,rz,x*3,y*5,z*7),col);
 const wood=C('#7a5232'),wood2=C('#5a3a24'),cream=C('#f0ece4'),gold=C('#d8b040');
 // tapete oval em camadas
 m2.geo(GEO.cyl16,mtx(X-1,.02,Z-.2,1.85,.012,1.4),C('#c8a050'));m2.geo(GEO.cyl16,mtx(X-1,.026,Z-.2,1.55,.012,1.12),C('#8a2a3a'));m2.geo(GEO.cyl16,mtx(X-1,.032,Z-.2,.8,.012,.6),C('#d9bf78'));
 m2.geo(GEO.cyl16,mtx(X-1,.007,Z-.2,2.25,.014,1.75),C('#8a2a3a'));
 // sofá (encosto na parede oeste, de frente para a TV): base, encosto, braços, almofadas
 const so=C('#3a5a8a'),so2=so.clone().multiplyScalar(1.12);
 cb(X-4.9,.18,Z-1.75,X-3.4,.46,Z+1.35,so,.12);cb(X-4.92,.3,Z-1.7,X-4.35,1.05,Z+1.3,so,.16);cb(X-4.88,.18,Z-1.78,X-3.4,.8,Z-1.4,so.clone().multiplyScalar(.92),.12);cb(X-4.88,.18,Z+.98,X-3.4,.8,Z+1.38,so.clone().multiplyScalar(.92),.12);
 cb(X-4.4,.46,Z-1.38,X-3.5,.62,Z-.2,so2,.08);cb(X-4.4,.46,Z-.15,X-3.5,.62,Z+.96,so2,.08);
 for(const[dx,dz] of [[-4.8,-1.65],[-4.8,1.25],[-3.55,-1.65],[-3.55,1.25]])cy(X+dx,0,.18,Z+dz,.06,C('#2a1a10'));
 cb(X-4.35,.6,Z-1.3,X-3.95,.98,Z-.85,C('#e8b84a'),.12);cb(X-4.35,.6,Z+.5,X-3.95,.95,Z+.95,C('#c24a5a'),.12);
 // mesa de centro com tampo redondo e livros
 cy(X-1.75,.38,.44,Z-.15,.62,wood);cy(X-1.75,.06,.38,Z-.15,.05,wood2);cy(X-1.75,0,.06,Z-.15,.26,wood2);cy(X-1.75,.2,.23,Z-.15,.4,wood2);
 m2.geo(BOXG,mtx(X-1.9,.48,Z-.3,.34,.05,.26,0,.4,0),C('#a83a3a'));m2.geo(BOXG,mtx(X-1.9,.53,Z-.3,.3,.04,.22,0,.1,0),C('#e0d8c0'));cy(X-1.45,.44,.56,Z+.05,.045,C('#f4f4f0'));sp(X-1.75,.5,Z+.2,.1,.07,.1,C('#d86a4a'));
 // rack da TV + TV (a tela animada é criada fora: SAFE.tv)
 cb(X+.85,.14,Z-1.4,X+1.5,.55,Z+1.0,C('#3a2a20'),.07);for(const dz of [-1.3,.9])for(const dx of [.95,1.4])cy(X+dx,0,.14,Z+dz,.035,C('#1a1410'));
 for(const zc of [-.5,.3])m2.geo(BOXG,mtx(X+.845,.35,Z+zc,.02,.3,.7),C('#2a1c14'));for(const zc of [-.2,.0])m2.geo(BOXG,mtx(X+.84,.38,Z+zc,.02,.06,.02),gold);
 if(!noTv){cb(X+1.0,.55,Z-1.08,X+1.18,1.47,Z+.68,C('#101014'),.05);cb(X+.9,.55,Z-1.45,X+1.12,.62,Z-1.15,C('#2a2a30'),.05);
 for(const dz of [-1.28,.98]){cb(X+.9,.55,Z+dz-.1,X+1.12,1.15,Z+dz+.12,C('#26262c'),.06)}
 cb(X+1.0,.55,Z-.5,X+1.2,.58,Z+.1,C('#101014'),.03)}
 // cama de casal com travesseiros e coberta
 bx(X+2.2,.1,Z-3.9,X+4.9,.4,Z-1.9,wood2);for(const[lx,lz] of [[2.24,-3.86],[2.24,-1.98],[4.62,-3.86],[4.62,-1.98]])bx(X+lx,0,Z+lz,X+lx+.08,.1,Z+lz+.08,wood2);cb(X+4.7,0,Z-3.95,X+4.97,1.2,Z-1.85,wood,.1);cb(X+2.15,0,Z-3.92,X+2.3,.62,Z-1.88,wood,.05);
 cb(X+2.3,.4,Z-3.82,X+4.75,.66,Z-1.98,cream,.1);cb(X+2.3,.62,Z-3.84,X+4.0,.72,Z-1.96,C('#4a7a5a'),.05);cb(X+2.3,.7,Z-3.8,X+2.6,.76,Z-2.0,C('#3a6a4a'),.03);
 cb(X+4.05,.64,Z-3.72,X+4.7,.85,Z-3.0,C('#ffffff'),.12);cb(X+4.05,.64,Z-2.92,X+4.7,.85,Z-2.2,C('#f6efe0'),.12);
 // criado-mudo com abajur
 cb(X+4.35,0,Z-1.78,X+4.92,.5,Z-1.28,wood,.07);cy(X+4.64,.5,.62,Z-1.52,.1,C('#d8d8d8'));{const g2=new THREE.CylinderGeometry(.14,.2,.26,16,1,true).toNonIndexed();mb.geo(g2,mtx(X+4.64,.76,Z-1.52,1,1,1),C('#ffe9a8'));g2.dispose()}
 // guarda-roupa com portas e puxadores
 bx(X+3.9,0,Z+1.2,X+4.95,2.3,Z+3.2,C('#7a5a3a'));cb(X+3.84,.12,Z+1.24,X+3.92,2.22,Z+2.18,C('#8a6a46'),.03);cb(X+3.84,.12,Z+2.22,X+3.92,2.22,Z+3.16,C('#8a6a46'),.03);sp(X+3.83,1.1,Z+2.1,.04,.04,.04,gold);sp(X+3.83,1.1,Z+2.3,.04,.04,.04,gold);
 // cozinha: balcão, pia, fogão, armários, coifa, geladeira, banquetas
 bx(X-4.95,0,Z+2.2,X-2.2,.9,Z+3.95,C('#e8e4dc'));cb(X-4.98,.88,Z+2.15,X-2.15,.98,Z+3.97,C('#3a3a40'),.04);
 for(let k=0;k<5;k++){const z0=Z+2.25+k*.34;bx(X-2.21,.1,z0,X-2.18,.85,z0+.02,C('#c4bfb4'))}
 for(const z0 of [2.5,3.2])cb(X-2.24,.2,Z+z0,X-2.19,.8,Z+z0+.62,C('#f4f0e8'),.02);
 bx(X-4.5,.98,Z+3.05,X-3.7,1.0,Z+3.65,C('#9a9aa0'));bx(X-4.4,.97,Z+3.15,X-3.8,1.0,Z+3.55,C('#6a6a70'));wseg(m2,X-4.1,.98,Z+3.75,X-4.1,1.35,Z+3.75,.025,C('#c8c8d0'),GEO.cyl16);wseg(m2,X-4.1,1.35,Z+3.75,X-4.1,1.3,Z+3.45,.022,C('#c8c8d0'),GEO.cyl16);
 for(const[bxx,bzz] of [[-3.0,2.6],[-2.6,2.6],[-3.0,3.1],[-2.6,3.1]])cy(X+bxx,.98,1.0,Z+bzz+.2,.13,C('#1a1a1c'));
 cb(X-4.95,1.65,Z+3.58,X-3.32,2.4,Z+3.97,C('#e8e4dc'),.03);for(const xx of [-4.55,-3.75])bx(X+xx,1.72,Z+3.555,X+xx+.18,1.75,Z+3.58,C('#9a9aa0'));cb(X-3.28,1.82,Z+3.3,X-2.22,2.12,Z+3.97,C('#d8d4cc'),.04);bx(X-3.18,1.79,Z+3.36,X-2.32,1.82,Z+3.92,C('#a8a8b0'));bx(X-2.98,2.12,Z+3.62,X-2.52,3.1,Z+3.97,C('#d0ccc4'));
 cb(X-1.95,0,Z+3.0,X-1.0,1.85,Z+3.95,C('#f4f4f6'),.12);m2.geo(BOXG,mtx(X-1.22,1.52,Z+2.97,.05,.3,.05),C('#9a9aa0'));m2.geo(BOXG,mtx(X-1.22,.96,Z+2.97,.05,.4,.05),C('#9a9aa0'));
 for(const z0 of [1.55,2.0]){cy(X-3.5,.68,.75,Z+z0,.19,C('#c8402a'));cy(X-3.5,.05,.68,Z+z0,.03,C('#9a9aa0'));cy(X-3.5,0,.05,Z+z0,.16,C('#9a9aa0'));cy(X-3.5,.3,.33,Z+z0,.13,C('#9a9aa0'))}
 // estante na parede norte com livros e vaso
 cb(X-4.6,1.45,Z-D+.02,X-2.2,1.5,Z-D+.32,wood,.02);cb(X-4.6,2.0,Z-D+.02,X-2.2,2.05,Z-D+.32,wood,.02);
 for(const y of [1.5,2.05]){let x=X-4.5;while(x<X-2.6){const w=.07+R()*.08,h=.22+R()*.2;m2.geo(BOXG,mtx(x+w/2,y+h/2,Z-D+.17,w,h,.2),C(pick(['#c0392b','#2c6aa8','#d8a020','#3a8a4a','#7a3a8a','#e8e0d0','#2a2a3a'])));x+=w+.005}}
 cy(X-2.75,2.05,2.3,Z-D+.17,.1,C('#b8603a'));ic(X-2.75,2.42,Z-D+.17,.2,.2,.2,C('#3f8a3a'));
 // luminária de chão e planta de canto
 cy(X-4.55,0,.04,Z-2.6,.16,C('#2a2a30'));cy(X-4.55,.04,1.55,Z-2.6,.022,C('#2a2a30'));{const g3=new THREE.CylinderGeometry(.2,.3,.34,18,1,true).toNonIndexed();mb.geo(g3,mtx(X-4.55,1.68,Z-2.6,1,1,1),C('#ffeab8'));g3.dispose()}
 cy(X+3.1,0,.5,Z+3.5,.26,C('#a8603a'));for(let k=0;k<7;k++)ic(X+3.1+Math.cos(k*.9)*.22,.8+k*.11,Z+3.5+Math.sin(k*.9)*.22,.2,.28,.2,C(k%2?'#2f7a34':'#3f8a3a'));
 // rosácea no teto
 m2.geo(GEO.cyl16,mtx(X,H-.03,Z,.45,.06,.45),C('#ece4d4'));
 // sombreamento "falso" por normal (o material é MeshBasic)
 {const n=m2.n,c=m2.c;for(let i=0;i<n.length;i+=3){const d=n[i]*.3+n[i+1]*.85+n[i+2]*.4,s=.58+.42*Math.max(0,d/1.0);c[i]*=s;c[i+1]*=s;c[i+2]*=s}}
 const mesh=m2.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));if(mesh)g.add(mesh);
 SAFE.tvPos={x:X+.1,z:Z-.2}}

/* Vento compartilhado: direção da chuva, rajadas e amplitudes dos objetos. */
const WIND={time:{value:0},amp:{value:0},dir:{value:new THREE.Vector2(1,0)},focus:{value:new THREE.Vector2()},tick:0};
const SIGNAL_TMP={rot:new THREE.Matrix4(),swing:new THREE.Matrix4(),shift:new THREE.Matrix4(),euler:new THREE.Euler()};
function windUniforms(sh){sh.uniforms.wTime=WIND.time;sh.uniforms.wAmp=WIND.amp;sh.uniforms.wDir=WIND.dir;sh.uniforms.wFocus=WIND.focus}
function windSignalAngle(time,x,z,amp){return clamp((amp-.12)/.88,0,1)*.2*(.55+.65*Math.sin(time*2.3+x*.13+z*.07))}
const SIGNAL_WIND_GLSL=`uniform float wTime,wAmp;uniform vec2 wDir,wFocus;attribute vec4 windPivot;
 float signalAngle(vec2 p){return clamp((wAmp-.12)/.88,0.,1.)*.2*(.55+.65*sin(wTime*2.3+p.x*.13+p.y*.07))*(1.-smoothstep(160.,200.,distance(p,wFocus)));}
 mat3 signalRotation(float a){float ax=-wDir.y*a,az=wDir.x*a,cx=cos(ax),sx=sin(ax),cz=cos(az),sz=sin(az);return mat3(cz,cx*sz,sx*sz,-sz,cx*cz,sx*cz,0.,-sx,cx);}
`;
const LEAF_COLORS=['#61ad43','#87bd51','#a2c85d','#dfb746','#c78f3b','#a97639'];
function leafColorAt(index,r=Math.random){return LEAF_COLORS[(index%2?3:0)+Math.floor(r()*3)]}
const FLYLEAF={mesh:null,list:[],wait:2,scan:0,trees:[],colorIndex:0,get cap(){return MOB_LITE?80:160}};
function clearWindLeaves(){if(FLYLEAF.mesh){scene.remove(FLYLEAF.mesh);FLYLEAF.mesh.geometry.dispose();FLYLEAF.mesh.material.dispose();FLYLEAF.mesh=null}FLYLEAF.list=[];FLYLEAF.trees=[];FLYLEAF.scan=0;FLYLEAF.wait=2}
function makeWindLeafGeometry(){
 const g=new THREE.BufferGeometry(),pos=[],colors=[],outline=[[0,-.66],[-.19,-.38],[-.31,-.03],[-.23,.31],[0,.61],[.23,.31],[.31,-.03],[.19,-.38]];
 const vertex=(x,y,z,shade)=>{pos.push(x,y,z);colors.push(shade,shade,shade)};
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];vertex(0,.055,-.02,1);vertex(a[0],0,a[1],i<4?.86:.96);vertex(b[0],0,b[1],i<4?.86:.96)}
 // Nervura central clara e haste curta, incorporadas à mesma geometria.
 vertex(-.018,.058,-.5,1);vertex(.018,.058,-.5,1);vertex(0,.058,.5,1);
 vertex(-.018,0,.57,.7);vertex(.018,0,.57,.7);vertex(.012,0,.82,.7);vertex(-.018,0,.57,.7);vertex(.012,0,.82,.7);vertex(-.012,0,.82,.7);
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g
}
function initWindLeaves(){if(FLYLEAF.mesh)return;const geo=makeWindLeafGeometry(),mat=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,emissive:0x000000,fog:true});const m=new THREE.InstancedMesh(geo,mat,FLYLEAF.cap);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(FLYLEAF.cap*3).fill(1),3);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.count=0;m.frustumCulled=false;m.layers.set(1);scene.add(m);FLYLEAF.mesh=m}
function updateWindLeaves(dt){const L=FLYLEAF,pc=PL.car||PL;if(S.style==='inverted'||PL.inside&&!TVM.on){L.list.length=0;if(L.mesh)L.mesh.count=0;return}const amp=WIND.amp.value,dir=WIND.dir.value;L.scan-=dt;
 if(L.scan<=0){L.scan=1;L.trees=[];for(const ch of city.chunks.values())for(const tr of ch.trees||[])if(!tr.broken&&Math.hypot(tr.x-pc.x,tr.z-pc.z)<(MOB_LITE?65:85))L.trees.push(tr)}
 L.wait-=dt;if(L.wait<=0){L.wait=amp>.25?(.045+Math.random()*.13):2.5+Math.random()*5;if(L.trees.length&&L.list.length<L.cap){const tr=pick2(L.trees);if(!tr.broken){const a=Math.random()*6.283,r=Math.random()*1.3*tr.s,sw=Math.max(0,tr.crown-1.2)**2*.045*amp*(.6+.4*Math.sin(WIND.time.value*2.3+tr.x*.13+tr.z*.07));L.list.push({x:tr.x+Math.cos(a)*r+dir.x*sw,z:tr.z+Math.sin(a)*r+dir.y*sw,y:tr.crown-.3+Math.random()*.8,age:0,phase:Math.random()*6.283,size:.25+Math.random()*.18,col:COL(leafColorAt(L.colorIndex++))})}}}
 if(!L.list.length){if(L.mesh)L.mesh.count=0;return}initWindLeaves();let n=0;const now=WIND.time.value;
 for(let i=L.list.length-1;i>=0;i--){const q=L.list[i];q.age+=dt;const gust=.75+.25*Math.sin(now*2.3+q.phase),v=(.25+amp*7)*gust;q.x+=(dir.x*v+Math.sin(now*3+q.phase)*.35)*dt;q.z+=(dir.y*v+Math.cos(now*2.4+q.phase)*.35)*dt;q.y-=(.55+Math.sin(now*4+q.phase)*.22)*dt;
 if(q.age>16||q.y<groundY(q.x,q.z)+.045||Math.hypot(q.x-pc.x,q.z-pc.z)>115){L.list.splice(i,1);continue}L.mesh.setMatrixAt(n,mtx(q.x,q.y,q.z,q.size,q.size,q.size,Math.sin(now*5+q.phase)*1.1,now*2+q.phase,Math.sin(now*3+q.phase)*.7));L.mesh.setColorAt(n,q.col);n++}
 uploadInstances(L.mesh,n)
}
function signalWindTick(dt){WIND.tick-=dt;if(WIND.tick>0)return;WIND.tick=1/30;const pc=TVM.on?TVM.foc:PL.car||PL,dir=WIND.dir.value;
 for(const ch of city.chunks.values()){if(!ch.tlIMs)continue;let changed=false;for(const l of ch.tls){if(l.broken)continue;const near=Math.hypot(l.hx-pc.x,l.hz-pc.z)<200,dist=Math.hypot(l.hx-pc.x,l.hz-pc.z),fade=clamp((200-dist)/40,0,1),angle=near?windSignalAngle(WIND.time.value,l.hx,l.hz,WIND.amp.value)*fade*fade*(3-2*fade):0;if(!angle&&!l.windMoved)continue;l.windMoved=!!angle;
 const rot=SIGNAL_TMP.rot.makeRotationFromEuler(SIGNAL_TMP.euler.set(-dir.y*angle,0,dir.x*angle)),swing=SIGNAL_TMP.swing.makeTranslation(l.hx,5.39,l.hz).multiply(rot).multiply(SIGNAL_TMP.shift.makeTranslation(-l.hx,-5.39,-l.hz));
 for(let j=0;j<3;j++){const m=mtx(l.hx,j===0?5:j===1?4.65:4.3,l.hz,.85,.85,.85);m.premultiply(swing);ch.tlIMs[j].setMatrixAt(l.i,m)}changed=true}if(changed)for(const im of ch.tlIMs)im.instanceMatrix.needsUpdate=true}
}
function environmentWindTick(dt){const d=Math.hypot(WX.wx||0,WX.wz||0);WIND.dir.value.set(d>.001?WX.wx/d:1,d>.001?WX.wz/d:0);WIND.time.value=simT;const pc=TVM.on?TVM.foc:PL.car||PL;WIND.focus.value.set(pc.x,pc.z);WIND.amp.value=STYLES[S.style].noWeather?0:.025+.12*(WX.f||0)+.88*(WX.storm||0)*(WX.f||0);signalWindTick(dt);updateWindLeaves(dt)}
// v208: protecao urbanistica curta — so o primeiro quarteirao de cada ponta
// da pista vira casas TERREAS. Rios naturais continuam no lugar. Depois disso,
// os predios normais da seed podem crescer sem uma grande faixa verde artificial.
function airportShapeFromRect(q,ri){
 const ix0=q[0]+SW,iz0=q[1]+SW,ix1=q[2]-SW,iz1=q[3]-SW,ax=ix1-ix0>=iz1-iz0;
 const bigL=ax?ix1-ix0:iz1-iz0,bigWd=ax?iz1-iz0:ix1-ix0,compact=bigL<105;
 const L=compact?Math.min(bigL,52):bigL,Wd=compact?Math.min(bigWd,52):bigWd,cx=(ix0+ix1)/2,cz=(iz0+iz1)/2;
 return {ri,ax,ix0,iz0,ix1,iz1,cx,cz,L,Wd,compact,rl:compact?Wd/2-8:Wd/2-11,ap:compact?-Wd/2+11:-Wd/2+13,hd:compact?-Wd/2+9:-Wd/2+1+3*(13-6-1)};
}
// A faixa e medida a partir da borda do terreno, nao do centro do quarteirao.
// Serve tambem para suprimir edificios EXTERNOS ao contorno da cidade, so na
// primeira quadra depois da pista. Nao remove rios, ruas nem pontes.
function airportCorridorZone(A,r){
 if(!A||A.compact)return null;
 const s0=(A.ax?r[0]:r[1])-(A.ax?A.cx:A.cz),s1=(A.ax?r[2]:r[3])-(A.ax?A.cx:A.cz);
 const l0=(A.ax?r[1]:r[0])-(A.ax?A.cz:A.cx),l1=(A.ax?r[3]:r[2])-(A.ax?A.cz:A.cx);
 if(l1<A.rl-12||l0>A.rl+12)return null;
 const head=-A.L/2,tail=A.L/2;
 const dh=s0<head-1?Math.max(0,head-s1):Infinity;
 const dt=s1>tail+1?Math.max(0,s0-tail):Infinity;
 return Math.min(dh,dt)<=P+RW/2?'houses':null;
}
function airportReserveCorridors(ri,A){
 let low=0;
 if(!A||A.compact)return {clear:0,low};
 const axis=A.ax?A.cx:A.cz,lat=A.ax?A.cz:A.cx,head=-A.L/2,tail=A.L/2;
 // A agua dentro da primeira quadra ja constitui corredor baixo: nao criar
 // casas no rio nem reservar outra quadra depois dele.
 const riverAt=(side)=>{
  const a=side<0?head-P-RW/2:tail+.1,b=side<0?head-.1:tail+P+RW/2;
  return (city.water||[]).some(w=>{if(w.cutOnly)return false;
   const s0=(A.ax?w[0]:w[1])-axis,s1=(A.ax?w[2]:w[3])-axis;
   const l0=(A.ax?w[1]:w[0])-lat,l1=(A.ax?w[3]:w[2])-lat;
   return s0<b&&s1>a&&l0<A.rl+9.5&&l1>A.rl-9.5;
  });
 };
 for(const side of [-1,1]){
  if(riverAt(side))continue;
  const end=side<0?head:tail,candidates=[];
  for(let i=0;i<city.rects.length;i++){
   if(i===ri||i===city.bankReserveRi)continue;
   const f=city.info[i],r=city.rects[i];
   if(!f||f.isle||f.reservedSpecial||f.kind==='lm')continue;
   const s0=(A.ax?r[0]:r[1])-axis,s1=(A.ax?r[2]:r[3])-axis;
   const l0=(A.ax?r[1]:r[0])-lat,l1=(A.ax?r[3]:r[2])-lat;
   // O eixo da pista + envergadura real (9,5 m), sem pegar quarteiroes laterais.
   if(l1<A.rl-12||l0>A.rl+12)continue;
   const d=side<0?(s0<end-1?Math.max(0,end-s1):Infinity):(s1>end+1?Math.max(0,s0-end):Infinity);
   if(!Number.isFinite(d)||d>P+RW/2)continue;
   const lateral=Math.max(0,l0-(A.rl-9.5),(A.rl+9.5)-l1);
   candidates.push({i,d,lateral});
  }
  if(!candidates.length)continue; // costa ou rio: nenhum terreno a converter
  candidates.sort((a,b)=>a.d-b.d||a.lateral-b.lateral||a.i-b.i);
  // Um UNICO quarteirao de profundidade por cabeca. Se duas parcelas distintas
  // compartilham a mesma testada sobre o corredor, protege as duas.
  const minD=candidates[0].d;
  for(const c of candidates){if(c.d>minD+4)break;
   const f=city.info[c.i];f.kind='houses';f.airCorridor='houses';f.reservedSpecial='aircorridor';f.low=true;low++;
  }
 }
 return {clear:0,low};
}
// v215: zoneamento aeronáutico calculado uma vez, depois de escolher o aeroporto
// e antes dos demais marcos. A paisagem/rios/ruas ja existem; a altura de cada
// edificio e limitada pela superficie de pouso/decolagem, sem mudar suas fachadas.
const AIR_ZONE_RANGE=5*P;
function airportHeightLimitForRect(A,r){
 if(!A||A.compact||!r)return Infinity;
 // O eixo S aponta da cabeceira de pouso (-) para a ponta de decolagem (+).
 const s0=(A.ax?r[0]:r[1])-(A.ax?A.cx:A.cz),s1=(A.ax?r[2]:r[3])-(A.ax?A.cx:A.cz);
 const l0=(A.ax?r[1]:r[0])-(A.ax?A.cz:A.cx),l1=(A.ax?r[3]:r[2])-(A.ax?A.cz:A.cx);
 const head=-A.L/2,tail=A.L/2;
 let d=Infinity;
 if(s0<head-1)d=Math.max(0,head-s1);
 if(s1>tail+1)d=Math.min(d,Math.max(0,s0-tail));
 if(!Number.isFinite(d)||d>AIR_ZONE_RANGE)return Infinity;
 // A faixa cresce gradualmente para fora; nao recorta toda a cidade.
 const half=14+Math.min(d,AIR_ZONE_RANGE)*.055;
 if(l1<A.rl-half||l0>A.rl+half)return Infinity;
 // Superficie inclinada: o limite e de altura TOTAL (inclui telhado, antenas
 // e caixa d'agua), nao apenas a fachada. Primeiro lote baixo, depois cresce.
 return Math.min(44,Math.max(6.3,(d+13)*.107+7.8*(1-Math.exp(-(d+13)/55))-3.0));
}
function airportFootprintLimit(x0,z0,x1,z1){
 return airportHeightLimitForRect(city.air,[x0,z0,x1,z1]);
}
function airportHeightLimit(x,z){return airportFootprintLimit(x-.15,z-.15,x+.15,z+.15)}
function airportSetZoning(A){
 city.airZoning=A&&!A.compact?{range:AIR_ZONE_RANGE,ri:A.ri}:null;
 if(!city.airZoning)return;
 for(let i=0;i<city.rects.length;i++){
  if(i===A.ri)continue;
  const f=city.info[i],cap=airportHeightLimitForRect(A,city.rects[i]);
  if(!Number.isFinite(cap))continue;
  f.airHeightCap=cap;f.airRestricted=true;
  // Rios e terrenos existentes ficam intocados; marcos ainda nao foram
  // selecionados aqui (exceto a reserva do banco, protegida na escolha do aeroporto).
 }
}
// v253: arcos ovais tubulares sobre o rio, com o mesmo orçamento (1-2)
// das pontes levadicas. Nao sao pontes dirigiveis nem criam colisores na agua.
function buildRiverArches(group){
 city.riverArches=[];
 if(city.haze||!city.riv?.size)return;
 const N=city.N,flowX=city.flowX,rng=mulberry32((S.seed^0x4ac711e3)>>>0),cands=[],nearCandidates=[];
 const wet=(a,b)=>flowX?city.riv.has(a*1000+b):city.riv.has(b*1000+a);
 // Em cada seção longitudinal, localizar o primeiro e ultimo lote molhado
 // de um mesmo trecho continuo. Evitar foz, ilhas e rampas/pontes.
 for(let a=1;a<N-1;a++){
  let start=-1;
  for(let b=1;b<=N;b++){
   const on=b<N-1&&wet(a,b);
   if(on&&start<0)start=b;
   if(!on&&start>=0){const end=b-1,count=end-start+1;start=Math.max(1,start);
    if(count===1){
     const x=flowX?(a+.5)*P:(start*P+RW/2-1),z=flowX?(start*P+RW/2-1):(a+.5)*P;
     const x2=flowX?x:(b*P-RW/2+1),z2=flowX?(b*P-RW/2+1):z;
     const mx=(x+x2)/2,mz=(z+z2)/2;
     if(!mouthChannel(mx,mz)&&waterAt(mx,mz)){
      const nearBridge=(city.bridges||[]).some(q=>{
       const cx=q[0]==='h'?(q[1]+.5)*P:q[1]*P,cz=q[0]==='h'?q[2]*P:(q[2]+.5)*P;
       return Math.hypot(cx-mx,cz-mz)<P*.8;
      });
      const rec={x,z,x2,z2,mx,mz,score:rng(),count};
      if(!nearBridge)cands.push(rec);else nearCandidates.push(rec);
     }
    }
    start=-1;
   }
  }
 }
 cands.sort((a,b)=>a.score-b.score);
 nearCandidates.sort((a,b)=>a.score-b.score);
 const limit=Math.max(1,Math.min(2,city.dbs?.length||1)),chosen=[];
 for(const c of cands){if(chosen.length>=limit)break;
  if(chosen.some(q=>Math.hypot(q.mx-c.mx,q.mz-c.mz)<P*2.5))continue;
  chosen.push(c);
 }
 // Em seeds com poucas secoes livres, aceitar um arco um pouco mais
 // perto de outra travessia, sem colocar o tubo SOBRE a pista da ponte.
 if(chosen.length<limit)for(const c of nearCandidates){if(chosen.length>=limit)break;
  if(chosen.some(q=>Math.hypot(q.mx-c.mx,q.mz-c.mz)<P*1.7))continue;
  const bridgeDist=Math.min(...(city.bridges||[]).map(q=>{
   const cx=q[0]==='h'?(q[1]+.5)*P:q[1]*P,cz=q[0]==='h'?q[2]*P:(q[2]+.5)*P;
   return Math.hypot(cx-c.mx,cz-c.mz);
  }));
  if(bridgeDist>P*.38)chosen.push(c);
 }
 if(!chosen.length)return;
 const mat=new THREE.MeshStandardMaterial({color:city.st.synth?0xb4b7cf:0xdddfe1,metalness:.28,roughness:.62});
 city.mats.push(mat);
 for(const c of chosen){
  const tubeR=.52,curvePoints=[],span=Math.hypot(c.x2-c.x,c.z2-c.z),baseY=RY+tubeR,rise=Math.max(3.8,Math.min(5.3,span*.069));
  // v78: a curva ia só até t=16/24 (0,67) → o arco terminava no ar a 2/3 do rio. Agora percorre a margem a margem.
  for(let i=0;i<=24;i++){
   const t=i/24,e=2*t-1;
   const y=baseY+rise*Math.sqrt(Math.max(0,1-e*e));
   curvePoints.push(new THREE.Vector3(c.x+(c.x2-c.x)*t,y,c.z+(c.z2-c.z)*t));
  }
  const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curvePoints),64,.52,8,false);
  const arch=new THREE.Mesh(geo,mat);arch.castShadow=false;arch.receiveShadow=false;
  arch.userData.riverArch=true;group.add(arch);
  city.riverArches.push({x:c.mx,z:c.mz,span,apex:baseY+rise});
 }
}
function skipHiddenMatrixWorld(g){if(g)g.updateMatrixWorld=function(force){if(!this.visible&&!force)return;THREE.Object3D.prototype.updateMatrixWorld.call(this,force)};return g}
async function generateCity(){
 invalidateStaticShadows();
 if(COPH.h?.o){heliSnd(COPH.h,false);heliDropModel(COPH.h)}
 COPH.h=null;COPH.respawnAt=0;
 roomStageExit();
 // Um novo mundo invalida os pontos costeiros cacheados, mesmo com seed/tamanho iguais.
 city.worldNo=(city.worldNo||0)+1;
 // A vitrine da concessionaria vive fora de city.group; precisa ser destruida a cada nova cidade.
 if(DEAL.grp){scene.remove(DEAL.grp);disposeGroup(DEAL.grp);DEAL.grp=null}
 DEAL.car=null;DEAL.clerk=null;DEAL.hi=false;DEAL.ang=0;
 if(DEAL.open){DEAL.open=false;$('#deal').hidden=true}
 paraClear();birdsClear();isoFadeReset();CITY_CACHE.ready=false;CITY_CACHE.building=true;try{S.size=normalizeCitySize(S.size);
 S.seed=S.seed>>>0;
 clearWindLeaves();WIND.amp.value=0;
 R=mulberry32(S.seed);
 city.haze=S.style==='haze';city.hazeCalm=null;city.hzSeed=(S.seed^0x5eed)>>>0;city.hzT=null;city.hazeTerrainMesh=null;city.hzShore=null;{const hr=mulberry32((S.seed^0x41c6ce57)>>>0);city.hazePh=[hr()*6.28,hr()*6.28,hr()*6.28]}
 const st=STYLES[S.style],night=!!st.synth,N=city.haze?3:S.size;city.N=N;city.ext=N*P;city.st=st;const E=city.ext;
 if(city.group){scene.remove(city.group);disposeGroup(city.group)}
 city.mats.forEach(t=>t.dispose&&!disposeShared(t)&&t.dispose());city.mats=[];for(const m of [...DN_SIGNS])if(m.userData.dnClone)DN_SIGNS.delete(m);FAR_MATERIALS=new WeakMap();FAR_MATERIAL_PAIRS.length=0;
 grid=new Map();colliders=[];fallers.length=0;DEBRIS.restore.length=0;tumblers.length=0;city.rects=[];city.info=[];city.segOff=new Set();city.chunks=new Map();city.empParkingSlots=[];city.parkingLots=[];city.heliRects=[];city.motel=null;city.motelRi=null;city.tireRi=null;city.tireOffice=null;city.tireNone=false;city.parkingFloorGrid=new Map();city.parkingFloorReady=false;city.gasFc=null;PARKVIS.t=8;city.delSlot=null;city.picked=new Set();city.taken=new Set();VINYL.got=new Set();VINYL.bag=new Set();VINYL.cheat=false;VINYL.rewInit=false;VINYL.carInit=false;city.ring=[];city.air=null;city.airZoning=null;city.poll=null;city.safeFail=false;city.safeLot=null;city.safeHelipad=null;city.tuneLot=null;city.neonRoad=null;city.nrShop=null;SAFE.slotsNext=null;SAFE.msgFor=null;city.cc=new Map();city.neonPlan=null;city.garSlots=null;city.startCar=null;city.stunts=new Set();city.piers=[];city.ramps=[];city.alleySites=[];city.bxAl=[];city.urbanLBlocks=new Set();city.urbanAlleyCount=0;city.urbanLCount=0;city.denseAlleySites=[];city.denseWalkPaths=[];city.denseLParcels=[];city.denseHouseCount=0;city.buildingFootprints=[];city.airHouses=[];city.gaps=[];city.wild=[];city.forest=null;FOREST.enemy=null;city.hosp=null;city.bankDoor=null;city.bankCell=null;city.bankReserveRi=-1;city.dbReserved=null;city.doors=new Map();city.core=null;city.ind=null;city.lms=[];city.chimneys=[];cityAgeSootReset();city.coastSpan=null;city.brokenTL=new Set();city.broken=new Set();
 /* --- rivers: run parallel to the beach, meander in steps (GTA 1 style) and split the city into islands linked by bridges --- */
 city.coast=Math.floor(mulberry32((S.seed^0x1b873593)>>>0)()*4);
 {const rv=mulberry32((S.seed^0x5f356495)>>>0),cs=city.coast,flowX=cs<2;city.flowX=flowX;city.riv=new Set();city.bridges=[];city.water=[];city.mouths=[[],[],[],[]];
  const nR=city.haze?0:N===14?2:1,inl=a=>(cs===0||cs===2)?a:N-1-a,add=(a,b)=>{const i=flowX?a:inl(b),j=flowX?inl(b):a;city.riv.add(i*1000+j)};
  const bases=[];for(let r=0;r<nR;r++){let b=Math.round(N*(r+1)/(nR+1)+(nR===2?0:(rv()-.5)*2));b=clamp(b,3,N-4);if(bases.some(q=>Math.abs(q-b)<4))continue;bases.push(b)}
  for(const b0 of bases){let cur=b0;for(let a=0;a<N;a++){add(a,cur);if(a<N-1&&rv()<.24){const nx=clamp(cur+(rv()<.5?-1:1),Math.max(3,b0-(nR===2?1:2)),Math.min(N-4,b0+(nR===2?1:2)));if(nx!==cur){add(a,nx);cur=nx}}}}
  // Seeded tributary from the coastal river to the sea; reserve it before roads and lots.
  city.seaBranch=null;if(N===14){const br=mulberry32((S.seed^0x2545f491)>>>0),half=br()<.5?-1:(br()<.5?0:1),lo=half===1?Math.ceil(N/2)+1:2,hi=half===0?Math.floor(N/2)-2:N-3,a=lo+Math.floor(rv()*(hi-lo+1));let b=0;while(b<N){const i=flowX?a:inl(b),j=flowX?inl(b):a;if(city.riv.has(i*1000+j))break;b++}if(b<N){for(let k=0;k<=b;k++)add(a,k);city.seaBranch={a,coast:cs};city.bridges.push(flowX?['h',a,cs===0?0:N]:['v',cs===2?0:N,a])}}
  // Connect both main channels before reserving lots, using an independent seeded stream.
  city.riverLink=null;if(N===14&&bases.length===2){const cr=mulberry32((S.seed^0x732ad81f)>>>0),choices=[];for(let a=2;a<N-2;a++)if(!city.seaBranch||Math.abs(a-city.seaBranch.a)>=3)choices.push(a);const a=choices[Math.floor(cr()*choices.length)],wet=[];for(let b=0;b<N;b++){const i=flowX?a:inl(b),j=flowX?inl(b):a;if(city.riv.has(i*1000+j))wet.push(b)}if(wet.length){const b0=Math.min(...wet),b1=Math.max(...wet);for(let b=b0;b<=b1;b++)add(a,b);city.riverLink={a,b0,b1,bridge:inl(Math.round((b0+b1)/2))}}}
  if(city.riv.size){const iswH=(i,kz)=>isRiv(i,kz-1)&&isRiv(i,kz),iswV=(kx,j)=>isRiv(kx-1,j)&&isRiv(kx,j);
   const cross=new Map(),along=[];
   for(let i=0;i<N;i++)for(let kz=0;kz<=N;kz++)if(iswH(i,kz)){if(flowX)along.push(['h',i,kz]);else{if(!cross.has(kz))cross.set(kz,[]);cross.get(kz).push(['h',i,kz])}}
   for(let kx=0;kx<=N;kx++)for(let j=0;j<N;j++)if(iswV(kx,j)){if(!flowX)along.push(['v',kx,j]);else{if(!cross.has(kx))cross.set(kx,[]);cross.get(kx).push(['v',kx,j])}}
   const key=q=>q[0]==='h'?'h'+q[1]+','+q[2]:'v'+q[1]+','+q[2];for(const q of along){const L=city.riverLink,isLink=L&&(flowX?q[1]===L.a&&q[2]===L.bridge:q[2]===L.a&&q[1]===L.bridge);if(isLink)city.bridges.push(q);else city.segOff.add(key(q))}
   const step=3+Math.floor(rv()*2),off=Math.floor(rv()*step);const keep=new Set();
   for(const[k,list] of cross){const br=k===0||k===N||(k%step)===off;if(br)keep.add(k);else for(const q of list)city.segOff.add(key(q))}
   for(let pass=0;pass<3;pass++)for(const[k,list] of cross){if(keep.has(k))continue;for(const q of list){const nodes=q[0]==='h'?[[q[1],q[2]],[q[1]+1,q[2]]]:[[q[1],q[2]],[q[1],q[2]+1]];
     if(nodes.some(([a,b])=>nodeDeg(a,b)===1)){keep.add(k);for(const q2 of list)city.segOff.delete(key(q2));break}}}
   for(const[k,list] of cross)if(keep.has(k))for(const q of list)city.bridges.push(q);
   // MICRO-ILHA: um quarteirão encostado no rio fica cercado de água, com uma única ponte (com pedágio).
   city.isle=null;if(!city.haze&&N===14){const ir=mulberry32((S.seed^0x15e1a7d)>>>0),cand=[];for(let i=2;i<=N-3;i++)for(let j=2;j<=N-3;j++){if(isRiv(i,j)&&city.riv.has(i*1000+j))continue;if(!city.riv.has(i*1000+j)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>city.riv.has((i+a)*1000+j+b)))cand.push([i,j,ir()])}
    cand.sort((a,b)=>a[2]-b[2]);const K=q=>q[0]==='h'?'h'+q[1]+','+q[2]:'v'+q[1]+','+q[2];
    const segCells=q=>q[0]==='h'?[[q[1],q[2]-1],[q[1],q[2]]]:[[q[1]-1,q[2]],[q[1],q[2]]];
    for(const[i,j] of cand){const added=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){if(!a&&!b)continue;const k=(i+a)*1000+j+b;if(!city.riv.has(k)){city.riv.add(k);added.push(k)}}
     if(!added.length)continue;
     // trechos água-água que surgiram ao redor da ilha
     const segs=[];for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const qs=[['h',i+a,j+b],['v',i+a,j+b]];for(const q of qs){const c=segCells(q);if(c.every(([x,z])=>z>=0&&x>=0&&x<N&&z<N&&city.riv.has(x*1000+z))&&segExists(q[0]==='h'?q[1]:q[1],q[0]==='h'?q[2]:q[2],q[0]==='h'?0:1))segs.push(q)}}
     // ponte: um trecho que sai de um canto da ilha para terra firme
     const corners=[[i,j],[i+1,j],[i,j+1],[i+1,j+1]],isCorner=(x,z)=>corners.some(c=>c[0]===x&&c[1]===z);
     const outs=segs.filter(q=>{const a=q[0]==='h'?[q[1],q[2]]:[q[1],q[2]],b=q[0]==='h'?[q[1]+1,q[2]]:[q[1],q[2]+1];return isCorner(...a)!==isCorner(...b)});
     let bridge=null;for(const q of outs.sort(()=>ir()-.5)){const a=q[0]==='h'?[q[1],q[2]]:[q[1],q[2]],b=q[0]==='h'?[q[1]+1,q[2]]:[q[1],q[2]+1],far=isCorner(...a)?b:a;if(far[0]<=0||far[1]<=0||far[0]>=N||far[1]>=N)continue;bridge=q;break}
     const off=[];if(bridge)for(const q of segs){if(K(q)===K(bridge))continue;if(!city.segOff.has(K(q))){city.segOff.add(K(q));off.push(K(q))}}
     // conectividade: todo nó com rua precisa continuar alcançável
     let ok=!!bridge;if(ok){const start=bridge[0]==='h'?[bridge[1],bridge[2]]:[bridge[1],bridge[2]],seen=new Set([start[0]*100+start[1]]),qq=[start];while(qq.length){const[x,z]=qq.pop();for(let d=0;d<4;d++){if(!segExists(x,z,d))continue;const nx=x+D[d][0],nz=z+D[d][1],kk=nx*100+nz;if(!seen.has(kk)){seen.add(kk);qq.push([nx,nz])}}}
      for(let x=0;x<=N&&ok;x++)for(let z=0;z<=N;z++)if(nodeDeg(x,z)>0&&!seen.has(x*100+z)){ok=false;break}
      for(const c of corners)if(nodeDeg(c[0],c[1])===0)ok=false}
     if(!ok){for(const k of added)city.riv.delete(k);for(const k of off)city.segOff.delete(k);continue}
     city.bridges=city.bridges.filter(q=>!segs.some(s=>K(s)===K(q))||K(q)===K(bridge));if(!city.bridges.some(q=>K(q)===K(bridge)))city.bridges.push(bridge);
     city.isle={i,j,bridge};break}}
   const o=RW/2,W=city.water;for(const kk of city.riv){const i=Math.floor(kk/1000),j=kk%1000;W.push([i*P+o,j*P+o,(i+1)*P-o,(j+1)*P-o])}
   for(let i=0;i<N;i++)for(let kz=0;kz<=N;kz++)if(iswH(i,kz)&&!segExists(i,kz,0))W.push([i*P+o,kz*P-o,(i+1)*P-o,kz*P+o]);
   for(let kx=0;kx<=N;kx++)for(let j=0;j<N;j++)if(iswV(kx,j)&&!segExists(kx,j,1))W.push([kx*P-o,j*P+o,kx*P+o,(j+1)*P-o]);
   for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)if(isRiv(kx-1,kz-1)&&isRiv(kx,kz-1)&&isRiv(kx-1,kz)&&isRiv(kx,kz)&&nodeDeg(kx,kz)===0)W.push([kx*P-o,kz*P-o,kx*P+o,kz*P+o]);
   if(city.seaBranch){const a=city.seaBranch.a,t0=a*P+o,t1=(a+1)*P-o,far=SHORE;city.mouths[cs].push([t0,t1]);const est=cs===0?[t0,-far,t1,o]:cs===1?[t0,E-o,t1,E+far]:cs===2?[-far,t0,o,t1]:[E-o,t0,E+far,t1];est.estuary=true;W.push(est);for(const [l,h]of [[t0-10,t0],[t1,t1+10]]){const cut=cs===0?[l,-far,h,-o]:cs===1?[l,E+o,h,E+far]:cs===2?[-far,l,-o,h]:[E+o,l,E+far,h];cut.cutOnly=true;W.push(cut)}}
   // river mouths: water keeps going past the edge of the map
   const FAR=700;for(const end of [0,1]){const a=end?N-1:0;let run=null;const runs=[];for(let b=0;b<N;b++){const r=flowX?isRiv(a,b):isRiv(b,a);if(r){if(!run)run=[b,b];else run[1]=b}else if(run){runs.push(run);run=null}}if(run)runs.push(run);
    for(const[b0,b1] of runs){const t0=b0*P+o,t1=(b1+1)*P-o;if(flowX){W.push(end?[N*P+o,t0,N*P+o+FAR,t1]:[-o-FAR,t0,-o,t1]);city.mouths[end?3:2].push([t0,t1])}else{W.push(end?[t0,N*P+o,t1,N*P+o+FAR]:[t0,-o-FAR,t1,-o]);city.mouths[end?1:0].push([t0,t1])}}}}}
 // Reserva a travessia obrigatoria ainda no grafo da seed, antes das quadras e edificios.
 // A variante de ilha Point Haze continua sem rios nem pontes levadicas.
 if(!city.haze)dbReserveCrossing();
 /* v166: banco ocupa um único quarteirão INTEIRO. Escolhemos uma célula seca
    ANTES de fundir lotes; não basta limitar o tamanho depois da fusão. */
 if(!city.haze){
  const bankRnd=mulberry32((S.seed^0xbabcbc7d)>>>0),possible=[];
  for(let i=1;i<N-1;i++)for(let j=1;j<N-1;j++){
   if(city.riv.has(i*1000+j)||(city.isle&&city.isle.i===i&&city.isle.j===j))continue;
   const nearRiver=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>city.riv.has((i+a)*1000+j+b)).length;
   const sc=bankRnd()*1.4-Math.hypot(i-(N-1)/2,j-(N-1)/2)*.19-nearRiver*.22;
   possible.push({i,j,sc});
  }
  possible.sort((a,b)=>b.sc-a.sc);if(possible.length)city.bankCell={i:possible[0].i,j:possible[0].j};
 }
 /* --- merged blocks: long ones and L shapes --- */
 const reg=[];for(let i=0;i<N;i++){reg[i]=[];for(let j=0;j<N;j++)reg[i][j]=[[i,j]]}
 const lRnd=mulberry32((S.seed^0x5a17c3e9)>>>0);
 /* v79r47: CEMITÉRIO = SEMPRE 2 quarteirões fundidos num CANTO do fundo do mapa (oposto à praia). Funde antes dos sorteios de fusão; sem canto válido (rio etc.) cai na escolha antiga. */
 city.cemCells=null;{const cr=mulberry32((S.seed^0x3c1e7a55)>>>0),cs=city.coast,J=N-1,far=cs===0?[[0,J],[J,J]]:cs===1?[[0,0],[J,0]]:cs===2?[[J,0],[J,J]]:[[0,0],[0,J]];if(cr()<.5)far.reverse();
  const tries=[];for(const c of far){const ax=cs<2?[c[0]===0?1:-1,0]:[0,c[1]===0?1:-1],pp=cs<2?[0,c[1]===0?1:-1]:[c[0]===0?1:-1,0];tries.push([c,ax],[c,pp])}
  for(const[c,dv] of tries){const b=[c[0]+dv[0],c[1]+dv[1]];if(b[0]<0||b[1]<0||b[0]>=N||b[1]>=N)continue;const cells=[c,b];
   if(cells.some(q=>city.riv.has(q[0]*1000+q[1])))continue;if(city.isle&&cells.some(q=>q[0]===city.isle.i&&q[1]===city.isle.j))continue;if(city.bankCell&&cells.some(q=>q[0]===city.bankCell.i&&q[1]===city.bankCell.j))continue;
   const i=Math.min(c[0],b[0]),j=Math.min(c[1],b[1]),east=dv[0]!==0,key=east?'v'+(i+1)+','+j:'h'+i+','+(j+1),n1=east?[i+1,j]:[i,j+1],n2=[i+1,j+1];if(city.segOff.has(key))continue;
   city.segOff.add(key);if(nodeDeg(n1[0],n1[1])<2||nodeDeg(n2[0],n2[1])<2){city.segOff.delete(key);continue}
   for(const q of cells)reg[q[0]][q[1]]=cells;city.cemCells=cells;break}}
 const cemCell=(c)=>!!city.cemCells&&city.cemCells.some(q=>q[0]===c[0]&&q[1]===c[1]);
 for(let t=0,T=city.haze?0:Math.floor(N*N*.4);t<T;t++){const i=Math.floor(R()*N),j=Math.floor(R()*N),east=R()<.5,i2=east?i+1:i,j2=east?j:j+1;if(i2>=N||j2>=N)continue;
  const A=reg[i][j],B=reg[i2][j2];if(A===B)continue;const cells=A.concat(B);if(cells.length>3||(cells.length===3&&lRnd()>.35))continue; // v176: às vezes 3 quarteirões em L
  if(cells.some(c=>city.riv.has(c[0]*1000+c[1])))continue; // nunca fundir solo com rio
  // A micro-ilha é SEMPRE um único quarteirão, nunca parte de um bloco fundido.
  if(city.isle&&cells.some(c=>c[0]===city.isle.i&&c[1]===city.isle.j))continue;
  if(city.bankCell&&cells.some(c=>c[0]===city.bankCell.i&&c[1]===city.bankCell.j))continue;
  if(cells.some(cemCell))continue; // v79r47: bloco do cemitério não cresce
  const xs=cells.map(c=>c[0]),zs=cells.map(c=>c[1]),w=Math.max(...xs)-Math.min(...xs)+1,h=Math.max(...zs)-Math.min(...zs)+1;
  if(!(w===1||h===1||(w===2&&h===2)))continue;if(cells.length===3&&!(w===2&&h===2))continue; // 3 quarteirões só em L
  const key=east?'v'+(i+1)+','+j:'h'+i+','+(j+1),n1=east?[i+1,j]:[i,j+1],n2=[i+1,j+1];
  city.segOff.add(key);if(nodeDeg(n1[0],n1[1])<2||nodeDeg(n2[0],n2[1])<2){city.segOff.delete(key);continue}
  for(const c of cells)reg[c[0]][c[1]]=cells}
 {const seen=new Set();for(let i=0;i<N;i++)for(let j=0;j<N;j++){const cells=reg[i][j];if(seen.has(cells))continue;seen.add(cells);if(city.riv.has(i*1000+j))continue;
  const xs=cells.map(c=>c[0]),zs=cells.map(c=>c[1]),i0=Math.min(...xs),i1=Math.max(...xs),j0=Math.min(...zs),j1=Math.max(...zs);
  if(i0===i1||j0===j1)city.rects.push([i0*P+RW/2,j0*P+RW/2,(i1+1)*P-RW/2,(j1+1)*P-RW/2]);
  else{const rowJ=zs.filter(z=>z===j0).length===2?j0:j1,other=cells.find(c=>c[1]!==rowJ);
   city.rects.push([i0*P+RW/2,rowJ*P+RW/2,(i1+1)*P-RW/2,(rowJ+1)*P-RW/2]);const r=blockRect(other[0],other[1]);if(other[1]<rowJ)r[3]+=RW;else r[1]-=RW;city.rects.push(r)}}}
 city.deg=[];for(let kx=0;kx<=N;kx++){city.deg[kx]=[];for(let kz=0;kz<=N;kz++)city.deg[kx][kz]=nodeDeg(kx,kz)}
 city.lines={};{const lr=mulberry32((S.seed^0x51ed270b)>>>0);let flip=0;for(let k=1;k<N;k++)for(const H of [1,0]){const r=lr();let L;
  if(r<.5)L={t:'ave'};else if(r<.75)L={t:'two'};else{flip++;L={t:'one',dir:H?((k+flip)%2?0:2):((k+flip)%2?1:3)}}city.lines[(H?'H':'V')+k]=L}}
 // A ponte levadica reservada precisa ter duas faixas por sentido, independentemente
 // do sorteio de vias comuns da seed. Isso ocorre ANTES da malha de faixas e do transito.
 if(city.dbReserved){const q=city.dbReserved,road=(q[0]==='h'?'H'+q[2]:'V'+q[1]);city.lines[road]={t:'ave'};LINE_C.src=null}
 city.strips=[];for(let k=1;k<N;k++)for(let b=0;b<N;b++){const LH=city.lines['H'+k],LV=city.lines['V'+k];
  if(LH&&LH.t!=='ave'&&segExists(b,k,0))for(const sg of [-6,6])city.strips.push([b*P+RW/2+1,k*P+sg,(b+1)*P-RW/2-1,k*P+sg]);
  if(LV&&LV.t!=='ave'&&segExists(k,b,1))for(const sg of [-6,6])city.strips.push([k*P+sg,b*P+RW/2+1,k*P+sg,(b+1)*P-RW/2-1])}
 {const per=city.rects.reduce((a,r)=>a+2*((r[2]-r[0])+(r[3]-r[1])),0);city.pedRatio=per?city.strips.length*(P-RW-2)/per:0}
 city.catSpots=[];animalsClear();petsClear();jammerReset();try{gangReset()}catch(e){}maskReset();AMBS.list.length=0;AMBS.t=30;TAXI.c=null;TAXI.state=null;TAXI.hold=0;if(typeof PL!=='undefined'&&PL.taxi){PL.taxi=null;PL.sp.visible=true}heliClear();clearVehicles();clearPeds();clearSkids();clearPickups();NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;POL.wanted=false;POL.escT=0;GAS.list.clear();GAS.q.length=0;MALL.door=null;if(typeof GHOST!=='undefined'){ghostKill();GHOST.cool=30}WZ.list.length=0;WZ.fade.length=0;WZ.crime=null;WZ.cur=null;WZ.fromZone=null;WZ.susT=0;try{if(typeof OBRA!=='undefined'){obraClear();OBRA.day=-1}}catch(e){}AMMO.reset();gunReset();clearRockets();clearDecals();if(typeof MIS!=='undefined'&&MIS.type)misEnd();PL.money=0;buildInstancing(st);simT=0;
 const grp=skipHiddenMatrixWorld(new THREE.Group());city.group=grp;scene.add(grp);
 document.body.classList.toggle('synth',!!st.synth);document.body.classList.toggle('inverted',S.style==='inverted');
 scene.fog=new THREE.Fog(st.fog,st.fogNear,st.fogFar);scene.background=new THREE.Color(st.bg);captureDrawFogBase();syncFogDrawDistance();
 hemi.color.setHex(st.hemi[0]);hemi.groundColor.setHex(st.hemi[1]);hemi.intensity=st.hemi[2];
 sun.color.setHex(st.sun[0]);sun.intensity=st.sun[1];
 skyMat.uniforms.top.value.setHex(st.sky[0]);skyMat.uniforms.hor.value.setHex(st.sky[1]);skyMat.uniforms.synth.value=st.synth?1:0;
 /* --- shared materials --- */
 const wt=windowTextures(night);const asph=asphaltTexture(S.style==='inverted'?'#'+COL(st.asphalt).multiplyScalar(.8).getHexString():st.asphalt); /* v2 r1: asfalto do Upside Down 20% mais escuro */city.mats.push(wt.map,wt.emissive,asph);
 const M={};city.M=M;
 M.wall=jammerMaterial(new THREE.MeshStandardMaterial({map:wt.map,vertexColors:true,roughness:.88,metalness:0,emissive:0xffffff,emissiveMap:wt.emissive,emissiveIntensity:night?1.25:0}));city.wallMat=M.wall;city.sunOff=st.sunOff.slice();M.abWall=new THREE.MeshStandardMaterial({map:abandonedWindowTexture(),vertexColors:true,roughness:1});city.mats.push(M.abWall.map,M.abWall);
 M.solid=cityAgeMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0}));cityAgeMat(M.wall);if(M.abWall)cityAgeMat(M.abWall);CITY_AGE.k.value=night?.55:1;
 M.solid2=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0,side:THREE.DoubleSide});
 if(city.haze){M.castle=surfPatch(cityAgeMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0})),'wall');city.mats.push(M.castle)} /* v3 r60: castelo da Point Haze com o reboco/pedra do SURF (o M.solid comum não tem, para não texturizar todo objeto) */
 const surfaceTex=surfaceAtlasTexture();city.mats.push(surfaceTex);
 M.surface=new THREE.MeshStandardMaterial({map:surfaceTex,vertexColors:true,roughness:.94,metalness:0});M.surface.onBeforeCompile=surfaceAtlasShader;M.surface.userData.surfaceAtlas=true;
 M.surface2=M.surface.clone();M.surface2.side=THREE.DoubleSide;M.surface2.onBeforeCompile=surfaceAtlasShader;M.surface2.userData.surfaceAtlas=true;surfPatch(M.surface,'side'); /* v3 r35: ruído leve nas calçadas (SURF, só piso cinza) */
 if(S.style==='inverted')for(const m of [M.wall,M.abWall,M.solid,M.solid2,M.surface,M.surface2])rotMat(m); /* dev r2.4: podridão do Upside Down (ROT_GLSL) */ /* dev r2.4: podridão do Upside Down (ROT_GLSL) */
 fxGlowPatch(M.wall,.75); /* v3 r25: brilho pintado das janelas (SHFX) */winReflPatch(M.wall,night);bldLitPatch(M.wall,night?1:S.style==='inverted'?2:0); /* v4 r53: luzes das janelas por prédio */ /* v4 r6/r8: reflexo do céu + cômodo por trás do vidro (SHFX fxK.z) */surfPatch(M.wall,'wall'); /* v3 r33: tijolo/reboco/concreto (SURF) */facadeAtlasPatch(M.wall); /* v4 r57: tipos de fachada (por último) */

 M.plant=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
 M.plant.onBeforeCompile=sh=>{windUniforms(sh);M.plant.userData.sh=sh;
  sh.vertexShader='uniform float wTime,wAmp;uniform vec2 wDir;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float hgt=max(0.,position.y-1.2);float sw=hgt*hgt*.045*wAmp;float gust=.6+.4*sin(wTime*2.3+position.x*.13+position.z*.07);transformed.xz+=wDir*sw*gust;')}; /* v3 r26: brisa/folhas da r25 removidas a pedido (ficou feio) */
 M.cloth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide});
 M.cloth.onBeforeCompile=sh=>{windUniforms(sh);sh.vertexShader='uniform float wTime,wAmp;uniform vec2 wDir;attribute vec3 clothPin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float freeEdge=clamp((clothPin.y-position.y)/max(.1,clothPin.z),0.,1.);float crosswind=abs(dot(wDir,vec2(clothPin.x,1.-clothPin.x)));float flutter=.18+.82*crosswind;float gust=.65+.35*sin(wTime*2.3+position.x*.13+position.z*.07);float bend=freeEdge*freeEdge*wAmp*flutter;transformed.xz+=wDir*bend*(.65*gust+.12*sin(wTime*8.+position.x*2.+position.z*2.));transformed.y+=bend*.10*sin(wTime*6.+position.x);')};
 M.signal=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,metalness:0});
 M.signal.onBeforeCompile=sh=>{windUniforms(sh);sh.vertexShader=SIGNAL_WIND_GLSL+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n if(windPivot.w>.5){vec3 pivot=vec3(windPivot.x,windPivot.z,windPivot.y);transformed=pivot+signalRotation(signalAngle(windPivot.xy))*(transformed-pivot);}') .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n if(windPivot.w>.5)objectNormal=signalRotation(signalAngle(windPivot.xy))*objectNormal;')};
 M.neon=st.noWindows?new THREE.MeshStandardMaterial({vertexColors:true,color:0x62646c,roughness:.78,metalness:.1}):jammerBasicMaterial(new THREE.MeshBasicMaterial({vertexColors:true}));M.neonDN=st.noWindows?new THREE.MeshStandardMaterial({vertexColors:true,color:0x55575e,roughness:.78,metalness:.1}):jammerBasicMaterial(new THREE.MeshBasicMaterial({vertexColors:true,color:0x6a6a6a})); /* v78: neon que acende com o anoitecer (cor animada no updateDayNight) */
 M.neonSt=st.noWindows?new THREE.MeshStandardMaterial({vertexColors:true,color:0x62646c,roughness:.78,metalness:.1}):jammerBasicMaterial(new THREE.MeshBasicMaterial({vertexColors:true})); /* v4 r13: neon fixo (sem zumbido/falha) para letreiros de prédio: a faixa e as cruzes do hospital piscavam em trechos de 12 m */
 fxNeonPatch(M.neon);fxNeonPatch(M.neonDN);fxNeonPatch(M.neonSt,true); /* v3 r25: núcleo quente e zumbido dos neons (SHFX) */
 M.hwin=jammerMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,emissive:0xffc880,emissiveIntensity:0}));
 // v78: vidros grandes de prédios especiais (delegacia, hospital, conveniência) — mesmo tom, emissão bem menor à noite
 M.hwinSoft=jammerMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,emissive:0xffc880,emissiveIntensity:0}));
 M.mark=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,emissive:night?0x262428:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});if(S.style==='inverted')rotMat(M.mark); /* v2 r1: podridão nas estradas de terra e faixas */surfPatch(M.mark,'paint'); /* v3 r36: faixas desgastadas em ~40% da cidade (SURF) */
 M.glow=jammerBasicMaterial(new THREE.MeshBasicMaterial({map:glowTex,vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));
 M.pole=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.3});
 M.head=new THREE.MeshBasicMaterial({vertexColors:true});
 M.lglowBase=shade(st.lamp||(S.style==='modern'||city.haze?'#ff9440':'#ffc070'),night?.5:S.style==='modern'||city.haze?.52:.42); /* v4 r55: sódio */
 M.lglow=new THREE.MeshBasicMaterial({map:glowTex,color:M.lglowBase.clone(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:0,polygonOffsetUnits:-2});/* v78: factor -4 (proporcional a inclinacao) fazia o halo (y .075) vazar por cima da calcada (y .2) em camera obliqua = dente no pe do poste. 7,5 cm sobre o asfalto ja bastam contra z-fight. */
 M.tl=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
 M.water=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.16,metalness:.3,emissive:S.style==='inverted'?0x000000:night?0x08061a:0x061a26,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 // Rio: mesma atenuação do reflexo da fonte celestial aplicada ao mar;
 // preserva vértices, ondas e aparência da água já existente.
 M.water.onBeforeCompile=sh=>{sh.uniforms.celestialSpec={value:1};M.water.userData.celestialShader=sh;sh.fragmentShader='uniform float celestialSpec;\n'+sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directSpecular *= celestialSpec; reflectedLight.indirectSpecular *= celestialSpec;')};aqMats(M,night);
 {const c=cv(32,32),g=c.getContext('2d');g.strokeStyle=night?'#8a84a8':'#5a5e62';g.lineWidth=2;for(let k=-32;k<64;k+=8){g.beginPath();g.moveTo(k,0);g.lineTo(k+32,32);g.stroke();g.beginPath();g.moveTo(k+32,0);g.lineTo(k,32);g.stroke()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;city.mats.push(t);M.fence=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.4,side:THREE.DoubleSide,roughness:.6,metalness:.4})}
 M.cable=new THREE.LineBasicMaterial({color:night?0x0c0a14:0x1c1c20});
 // v77: poste leve — haste/base de 6 lados, curva em 3 segmentos, luminária semiesférica de 8×3 (≈1340 → ≈200 triângulos; antes era o maior peso da cidade)
 // v78: sem as tampas que nunca aparecem (fundo da haste, dentro da base; emendas do braço, uma dentro da outra).
 // Mantidas: topo da haste e da base, e o fundo da base (visível no poste derrubado). 160 → 118 triângulos.
 {const pm=new MB(),hm=new MB();const cP=COL(st.detail),cyl6=new THREE.CylinderGeometry(1,1,1,6,1,true).toNonIndexed(),
   capT=new THREE.CircleGeometry(1,6).toNonIndexed().rotateX(-Math.PI/2).rotateY(Math.PI/6).translate(0,.5,0),capB=new THREE.CircleGeometry(1,6).toNonIndexed().rotateX(Math.PI/2).rotateY(Math.PI/6).translate(0,-.5,0);
   for(const g of[cyl6,capT]){const m=mtx(0,2.6,0,.11,5.2,.11);pm.geo(g,m,cP)}
   for(const g of[cyl6,capT,capB]){const m=mtx(0,.35,0,.17,.5,.17);pm.geo(g,m,cP)}
   {let px=0,py=5.2;const n=3;for(let k=1;k<=n;k++){const t=k/n,qx=1.5*t,qy=5.2+.32*Math.sin(Math.PI*.5*Math.min(1,t*1.6));
     const L=Math.hypot(qx-px,qy-py),a=Math.atan2(qy-py,qx-px);pm.geo(cyl6,mtx((px+qx)/2,(py+qy)/2,0,.065,L+.05,.065,0,0,a-Math.PI/2),cP);px=qx;py=qy}}
   cyl6.dispose();capT.dispose();capB.dispose();
   const cap=new THREE.SphereGeometry(1,8,3,0,Math.PI*2,0,Math.PI/2).toNonIndexed(),bulb=new THREE.SphereGeometry(1,8,2,0,Math.PI*2,Math.PI/2,Math.PI/2).toNonIndexed();pm.geo(cap,mtx(1.6,5.4,0,.36,.17,.22),cP);hm.geo(bulb,mtx(1.6,5.4,0,.36,.17,.22),COL('#ffffff'));cap.dispose();bulb.dispose();
  M.poleGeo=pm.mesh(null).geometry;M.headGeo=hm.mesh(null).geometry;const gg=new THREE.PlaneGeometry(1,1);gg.rotateX(-Math.PI/2);M.glowGeo=gg;M.tlGeo=(()=>{const m=new MB(),d=new THREE.CircleGeometry(.13,8).toNonIndexed();for(let k=0;k<1;k++){ /* v78: só a lente da frente (+z, girada por instância para o trânsito que o semáforo controla). Com 4 lentes, quem vinha pela outra rua via a cor do cruzamento perpendicular = 'semáforo invertido' */const ang=k*Math.PI/2;m.geo(d,mtx(Math.sin(ang)*.185,0,Math.cos(ang)*.185,1,1,1,0,ang,0),COL('#ffffff'))}d.dispose();const g=m.mesh(null).geometry;g.deleteAttribute('color');return g})(); // v77: 4 lentes planas de 8 triângulos, uma em cada face da caixa (antes esfera de 288)
  M.shared=new Set([M.poleGeo,M.headGeo,M.glowGeo,M.tlGeo])}
 /* --- ground + sea --- */
 const gsize=E+1600;asph.wrapS=asph.wrapT=THREE.RepeatWrapping;let gnd;
 // O plano de asfalto termina na linha d'água e não passa sob a areia da praia (que agora desce até o mar).
 city.coastSpan=coastSpanFor(E);const CUTS=[...(city.water||[])];if(city.haze){const G=gsize,o=RW/2;CUTS.push([-G,-G,E+G,-o],[-G,E+o,E+G,E+G],[-G,-o,-o,E+o],[E+o,-o,E+G,E+o])}else{const br=beachRange(),G=gsize;CUTS.push(tuRect(-G,E+G,SHORE,G),tuRect(br[0],br[1],SAND0,SHORE))}
 if(CUTS.length){const G0=E/2-gsize/2,G1=E/2+gsize/2,xs=new Set([G0,G1]),zs=new Set([G0,G1]);for(const w of CUTS){xs.add(clamp(w[0],G0,G1));xs.add(clamp(w[2],G0,G1));zs.add(clamp(w[1],G0,G1));zs.add(clamp(w[3],G0,G1))}
  const X=[...xs].sort((a,b)=>a-b),Z=[...zs].sort((a,b)=>a-b),mb=new MB(),wc=COL('#ffffff');const em=(x0,x1,z0,z1)=>mb.quad([x0,0,z1],[x1,0,z1],[x1,0,z0],[x0,0,z0],0,1,0,[x0/9,z1/9,x1/9,z0/9],wc);
  for(let a=0;a<X.length-1;a++){let st=null;for(let b=0;b<Z.length-1;b++){const cx=(X[a]+X[a+1])/2,cz=(Z[b]+Z[b+1])/2,wet=CUTS.some(w=>cx>w[0]&&cx<w[2]&&cz>w[1]&&cz<w[3]);if(!wet){if(st===null)st=b}else if(st!==null){em(X[a],X[a+1],Z[st],Z[b]);st=null}}if(st!==null)em(X[a],X[a+1],Z[st],Z[Z.length-1])}
  // The mouth cuts the ground mesh too: restore textured road surfaces over every bridge.
  for(const q of city.bridges){const o=RW/2;if(!segExists(q[1],q[2],q[0]==='h'?0:1))continue;if(q[0]==='h')em(q[1]*P+o,(q[1]+1)*P-o,q[2]*P-o,q[2]*P+o);else em(q[1]*P-o,q[1]*P+o,q[2]*P+o,(q[2]+1)*P-o)}
  asph.repeat.set(1,1);gnd=mb.mesh(new THREE.MeshStandardMaterial({map:asph,roughness:.95}),false,true)}
 else{gnd=new THREE.Mesh(new THREE.PlaneGeometry(gsize,gsize),new THREE.MeshStandardMaterial({map:asph,roughness:.95}));asph.repeat.set(gsize/9,gsize/9);gnd.rotation.x=-Math.PI/2;gnd.position.set(E/2,0,E/2)}
 gnd.receiveShadow=true;grp.add(gnd);if(city.haze)gnd.visible=false; /* v78: em Point Haze o chão é o hazeTerrain */city.groundMat=gnd.material;bridgeVisualMaterial(gnd.material);surfPatch(gnd.material,'asph'); /* v3 r33: asfalto granulado (SURF) */if(S.style==='inverted')rotMat(gnd.material); /* v2 r1: podridão também no asfalto */if(st.synth&&!city.haze)synthGroundGrid(gnd.material,E);
 R();
 {city.coastSpan=coastSpanFor(E);
  // urban core: the seed decides where the skyline grows; everything else follows from the distance to it
  const zr=mulberry32((S.seed^0x3c6ef372)>>>0),cs=city.coast,roll=zr(),sp=city.coastSpan;let cx,cz;
  const t=sp?(sp[0]<0?E*(.18+zr()*.2):E*(.62+zr()*.2)):E*(.3+zr()*.4),u=E*(.15+zr()*.1);
  [cx,cz]=cs===0?[t,u]:cs===1?[t,E-u]:cs===2?[u,t]:[E-u,t];
  city.core={x:cx,z:cz};city.zph=[zr()*6.28,zr()*6.28,zr()*6.28];city.ind=null}
 {const W=5000,c=city.coast,s=SHORE;const pos=c===0?[E/2,-s-W/2]:c===1?[E/2,E+s+W/2]:c===2?[-s-W/2,E/2]:[E+s+W/2,E/2];
  const wm=new THREE.MeshStandardMaterial({color:S.style==='inverted'?0x161a24:night?0x141a40:city.haze?0x3a6270:0x2a78a4,roughness:.16,metalness:.3,emissive:S.style==='inverted'?0x000000:night?0x08061a:0x061a26});
  const water=new THREE.Mesh(seaSurfaceGeo(0),wm);wm.onBeforeCompile=sh=>{sh.uniforms.moonReflect={value:1};wm.userData.moonShader=sh;sh.fragmentShader='uniform float moonReflect;\n'+sh.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n reflectedLight.directSpecular *= moonReflect; reflectedLight.indirectSpecular *= moonReflect;')};wm.transparent=true;wm.opacity=(night||S.style==='inverted')?.8:.7;wm.depthWrite=false;water.renderOrder=1;grp.add(water);city.waterMat=wm;waterPatch(wm,'sea');M.water.roughness=wm.roughness;M.water.metalness=wm.metalness;M.water.emissive.copy(wm.emissive);M.water.opacity=wm.opacity;M.water.transparent=true;M.water.depthWrite=false;try{aqSea(grp,night)}catch(e){console.error(e)}if(st.synth&&!city.haze)try{synthGrid(grp)}catch(e){console.error(e)}}
 /* --- per-block plan: independent of texture/cache initialization --- */
 R=mulberry32((S.seed^0x14d7a63b)>>>0);
 city.rects.forEach(r=>{const mx=(r[0]+r[2])/2,mz=(r[1]+r[3])/2,d=zoneD(mx,mz),roll=R();let kind,low=false;
  if(city.haze)kind='haze';else if(d>=ZONE.houses)kind=N===7?'houses':'rural';else if(d>=ZONE.bld){kind=roll<.07?'park':night?'bld':'houses';low=night}else kind=roll<.08?'park':roll<.14?'lot':'bld';
  const isle=city.isle&&Math.abs(mx-(city.isle.i+.5)*P)<1&&Math.abs(mz-(city.isle.j+.5)*P)<1;if(isle){kind='houses';low=false}
  city.info.push({kind,seed:(R()*4294967296)>>>0,dc:clamp(d/ZONE.bld,0,1),d,garage:false,low,isle})});
 // O rect reservado precisa coincidir exatamente com UMA célula 60x60.
 if(city.bankCell){const q=blockRect(city.bankCell.i,city.bankCell.j);
  city.bankReserveRi=city.rects.findIndex(r=>r.every((v,k)=>Math.abs(v-q[k])<.01));
  if(city.bankReserveRi<0)throw new Error('Banco sem lote individual na seed '+S.seed);
 }
 // v253: proteger um quarteirao SECO de frente para a praia antes de selecionar
 // aeroporto e todos os marcos. A reserva nunca toma o banco nem a micro-ilha.
 // Assim turismo/paraquedas nao dependem de sobraram lotes apos os especiais.
 city.beachRi=-1;city.beachCandidates=[];
 if(!city.haze){const cr=mulberry32(((S.seed>>>0)^0xb3ac4e11)>>>0),span=city.coastSpan||[0,E],cs=city.coast;
  const coastal=[];
  for(let i=0;i<city.rects.length;i++){const r=city.rects[i],f=city.info[i];if(i===city.bankReserveRi||f.isle)continue;
   const across=cs<2?[r[0],r[2]]:[r[1],r[3]],overlap=Math.max(0,Math.min(across[1],span[1])-Math.max(across[0],span[0]));
   const edge=cs===0?r[1]<P:cs===1?r[3]>E-P:cs===2?r[0]<P:r[2]>E-P;
   if(edge&&overlap>15&&(r[2]-r[0])>=24&&(r[3]-r[1])>=24){
    const center=(across[0]+across[1])/2;coastal.push({i,score:overlap-Math.abs(center-(span[0]+span[1])/2)*.06+cr()*.01})}
  }
  coastal.sort((a,b)=>b.score-a.score);city.beachCandidates=coastal.map(c=>c.i);
  if(!coastal.length)throw new Error('Nenhum quarteirao seco disponivel junto a praia na seed '+S.seed);
  city.beachRi=coastal[0].i;city.info[city.beachRi].beachReserve=true;
 }
 const area=r=>(r[2]-r[0])*(r[3]-r[1]),ctrOf=r=>[(r[0]+r[2])/2,(r[1]+r[3])/2];
 const beachEdge=(r)=>{const cs=city.coast,c=ctrOf(r);return(cs===0?r[1]<P:cs===1?r[3]>E-P:cs===2?r[0]<P:r[2]>E-P)&&onBeach(c[0],c[1])};
 const backOf=(r)=>{const cs=city.coast,c=ctrOf(r);return clamp(cs===0?c[1]/E:cs===1?1-c[1]/E:cs===2?c[0]/E:1-c[0]/E,0,1)}; /* v79r47: 0 = na praia, 1 = fundo do mapa (lado oposto ao mar) */
 if(!city.haze){
 // Reserva prioritária absoluta: aeroporto grande escolhe primeiro um terreno
 // fundido. Ele permanece protegido antes dos 11 marcos e da indústria.
 let priorityAirI=-1;
 {const ar0=mulberry32((S.seed^0xa1290f7)>>>0),large=[];
  city.info.forEach((f,i)=>{const q=city.rects[i],w=q[2]-q[0],h=q[3]-q[1];
   if(!f.isle&&!f.beachReserve&&Math.max(w,h)>=2*P-RW-2&&Math.min(w,h)>=P-RW-2)large.push(i)});
  if(large.length){const bankSafe=large.filter(i=>i!==city.bankReserveRi&&!(city.bankReserveRi>=0&&Number.isFinite(airportHeightLimitForRect(airportShapeFromRect(city.rects[i],i),city.rects[city.bankReserveRi]))));
   const viable=bankSafe.length?bankSafe:large;
   const inland=viable.filter(i=>!beachEdge(city.rects[i])),land=inland.length?inland:viable,closer=land.filter(i=>city.info[i].d<=.56),pool=closer.length?closer:land;
   let bs=-1e9;for(const i of pool){const sc=-Math.abs(city.info[i].d-.36)*8+ar0()*.12;
    if(sc>bs){bs=sc;priorityAirI=i}}
   city.info[priorityAirI].reservedSpecial='airport';
   // A reserva antecede a selecao dos marcos obrigatorios, sem sacrifica-los.
   const protectedAirport=airportShapeFromRect(city.rects[priorityAirI],priorityAirI);
   airportReserveCorridors(priorityAirI,protectedAirport);airportSetZoning(protectedAirport);}
 }
 // Se o aeroporto tornou a reserva costeira uma zona de aproximacao,
 // trocar por outro quarteirao costeiro seco e sem limite de altura.
 if(city.beachRi>=0){let beach=city.info[city.beachRi];if(beach.reservedSpecial||beach.airRestricted){
  beach.beachReserve=false;
  const eligible=i=>{const f=city.info[i];return !f.isle&&i!==city.bankReserveRi&&f.kind!=='lm'&&f.reservedSpecial!=='airport'&&f.reservedSpecial!=='casino'};
  const backup=city.beachCandidates.find(i=>eligible(i)&&!city.info[i].reservedSpecial&&!city.info[i].airRestricted)??
   city.beachCandidates.find(i=>eligible(i)&&(!city.info[i].reservedSpecial||city.info[i].reservedSpecial==='aircorridor'));
  // Ultimo recurso: predio baixo sob o limite aeronautico, sem ultrapassar a superficie de pouso.
  if(backup==null)throw Error('Nao ha nenhuma quadra costeira util para o salto, seed '+S.seed);
  city.beachRi=backup;beach=city.info[backup];beach.beachReserve=true;
 }}
 // unique landmarks
 {const lr=mulberry32((S.seed^0x2f9a1e33)>>>0),used=new Set();city.lms=[];let mobileBigLandmarks=0;
  const pick=(name,filt,score)=>{let b=-1,bs=-1e9;
   if(name==='bank'&&city.bankReserveRi>=0){const i=city.bankReserveRi,r=city.rects[i],f=city.info[i];
    if(Math.abs(r[2]-r[0]-BS)>.01||Math.abs(r[3]-r[1]-BS)>.01)throw new Error('Banco tentou usar quadra fundida: '+S.seed);
    used.add(i);f.kind='lm';f.lm='bank';f.plaza=false;const c=ctrOf(r);city.lms.push({name,ri:i,x:c[0],z:c[1]});return;
   }
   // Aeroporto já foi reservado. Todos os marcos urbanos tentam caber em um
   // único quarteirão; somente o cemitério pode usar lote fundido quando houver.
   const singleBankLot=r=>(r[2]-r[0]<=BS+1&&r[3]-r[1]<=BS+1&&r[2]-r[0]>=BS*.65&&r[3]-r[1]>=BS*.65);
   const oneOnly=name!=='cem',hasOne=oneOnly&&city.info.some((f,i)=>!used.has(i)&&!f.isle&&!f.reservedSpecial&&!f.airRestricted&&f.kind!=='lm'&&!f.beachReserve&&area(city.rects[i])<=BS*BS*1.18&&filt(f,city.rects[i])),wantBig=false; // v264: cemiterio prefere distancia rural, nao obriga lote urbano fundido
   city.info.forEach((f,i)=>{if(used.has(i)||(name!=='bank'&&i===city.bankReserveRi)||f.isle||f.reservedSpecial||f.beachReserve||f.airRestricted||!filt(f,city.rects[i])||(name==='bank'&&!singleBankLot(city.rects[i]))||(hasOne&&area(city.rects[i])>BS*BS*1.18)||(name==='cem'&&wantBig&&area(city.rects[i])<=BS*BS*1.18))return;const sc=score(f,city.rects[i])+lr()*.25;if(sc>bs){bs=sc;b=i}});
   if(b<0){let free=city.info.map((f,i)=>i).filter(i=>!used.has(i)&&(name==='bank'||i!==city.bankReserveRi)&&!city.info[i].isle&&!city.info[i].reservedSpecial&&!city.info[i].beachReserve&&!city.info[i].airRestricted&&city.info[i].kind!=='lm');if(name==='bank')free=free.filter(i=>singleBankLot(city.rects[i]));else if(name!=='cem'){const one=free.filter(i=>area(city.rects[i])<=BS*BS*1.18);if(one.length)free=one}for(const i of free){const r=city.rects[i],f=city.info[i],sc=score(f,r)-(beachEdge(r)?2:0)+lr()*.25;if(sc>bs){bs=sc;b=i}}}if(b<0)throw new Error('Sem espaço para marco '+name);used.add(b);if(N===7&&area(city.rects[b])>BS*BS*1.18)mobileBigLandmarks++;const f=city.info[b];f.kind='lm';f.lm=name;f.plaza=false;const c=ctrOf(city.rects[b]);city.lms.push({name,ri:b,x:c[0],z:c[1]})};
  const ok=(f,r)=>(f.kind==='bld'||f.kind==='houses'||f.kind==='park'||f.kind==='lot')&&!beachEdge(r);
  pick('sky',(f,r)=>ok(f,r)&&f.d<ZONE.dense+.06,(f,r)=>-f.d*6+Math.min(area(r),5000)/5000);
  const far=(r,k)=>{let m=1e9;for(const L of city.lms){const c=ctrOf(r);m=Math.min(m,Math.hypot(c[0]-L.x,c[1]-L.z))}return Math.min(m,k)/k};
  pick('hall',(f,r)=>ok(f,r)&&f.d<.32,(f,r)=>far(r,P*3)*2-Math.abs(f.d-.18)*3);
  pick('hosp',(f,r)=>ok(f,r)&&f.d<.4,(f,r)=>far(r,P*3)*2-Math.abs(f.d-.26)*3);
  // v264: o cemiterio e um marco RURAL. Escolha a periferia mais distante
  // mesmo quando a quadra ainda esta classificada como 'houses' no Mobile;
  // o zoneamento rural definitivo acontece apenas apos reservar os marcos.
  // A torre de 16.9m nunca pode entrar no cone do aeroporto.
  pick('cem',(f,r)=>!beachEdge(r)&&['rural','houses','bld','lot','park'].includes(f.kind)&&area(r)>BS*BS*.7&&airportHeightLimitForRect(city.air,r)>=18,
    (f,r)=>f.d*110+Math.min(area(r),9500)/(BS*BS)*1.4+far(r,P*3)*.9+(city.cemCells&&city.cemCells.every(q=>{const cx=(q[0]+.5)*P,cz=(q[1]+.5)*P;return cx>r[0]&&cx<r[2]&&cz>r[1]&&cz<r[3]})?1e5:0)); /* v79r47: o bloco reservado do canto */
  pick('univ',(f,r)=>ok(f,r)&&f.d>.22&&f.d<.56,(f,r)=>far(r,P*3)+area(r)/(BS*BS)*.8);
  pick('stad',(f,r)=>ok(f,r)&&f.d>.28&&f.d<.6,(f,r)=>far(r,P*3)+area(r)/(BS*BS)*1.4-Math.abs(Math.log((r[2]-r[0])/(r[3]-r[1])))*.8);
  const parks=city.info.map((f,i)=>f.kind==='park'?i:-1).filter(i=>i>=0);const nearPark=r=>{let m=1e9,bi=-1;const c=ctrOf(r);for(const i of parks){const q=ctrOf(city.rects[i]);const d=Math.hypot(q[0]-c[0],q[1]-c[1]);if(d<m){m=d;bi=i}}return[m,bi]};
  {pick('bank',(f,r)=>ok(f,r)&&f.kind!=='park'&&f.d<.4&&r[2]-r[0]<=BS+1&&r[3]-r[1]<=BS+1,(f,r)=>-nearPark(r)[0]/P*1.5+far(r,P*2))}
  pick('mkt',(f,r)=>ok(f,r)&&f.kind!=='park'&&f.d>.2&&f.d<.56,(f,r)=>far(r,P*3)-Math.abs(f.d-.38)*2);
  pick('mall',(f,r)=>ok(f,r)&&f.d>.16&&f.d<.5,(f,r)=>far(r,P*3)+area(r)/(BS*BS)*1.2);worldPicks(pick,ok,far,area,lr);gasPicks(pick,ok,far,area);
  // v77: o cemitério não força asfalto em volta; o zoneamento rural decide (ruas de terra na roça).
  {const cemL=city.lms.find(l=>l.name==='cem');if(cemL)cemL.rural=true}
  const banks=city.lms.filter(l=>l.name==='bank');
  if(banks.length>1){const keep=banks[0];for(const b of banks.slice(1)){city.info[b.ri].kind='bld'}city.lms=city.lms.filter(l=>l.name!=='bank'||l===keep)}
  const required=['sky','hall','hosp','univ','stad','bank','mkt','mall','pol','cem'];
  const missing=required.filter(name=>!city.lms.some(l=>l.name===name));if(missing.length)console.error('Marcos obrigatórios ausentes:',S.seed,missing)}
 // Reservar todos os locais especiais ANTES de indústria, garagens, praia e zona rural.
 // Mobile privilegia quadras individuais de 60x60m. Só permite quadra fundida em último caso.
 {const selected=new Set(city.lms.map(l=>l.ri)),ar=mulberry32((S.seed^0xa1290f7)>>>0),kr=mulberry32((S.seed^0xca5170)>>>0),dr=mulberry32((S.seed^0x3d1ea1e5)>>>0),tr=mulberry32((S.seed^0x4e1f2a9b)>>>0),sr=mulberry32((S.seed^0x7f4a7c15)>>>0);
  const free=(i,w=0,h=0)=>{const f=city.info[i],r=city.rects[i];return !selected.has(i)&&!f.isle&&!f.beachReserve&&!f.reservedSpecial&&!f.airRestricted&&f.kind!=='lm'&&(r[2]-r[0]>=w)&&(r[3]-r[1]>=h)};
  const choose=(name,w,h,score,rnd,preferSingle=true)=>{
   let pool=[];city.info.forEach((f,i)=>{if(free(i,w,h))pool.push(i)});
   if(!pool.length)throw new Error('Sem quarteirão para '+name+' na seed '+S.seed);
   if(preferSingle){const one=pool.filter(i=>area(city.rects[i])<=BS*BS*1.18);if(one.length)pool=one}
   const land=pool.filter(i=>!beachEdge(city.rects[i]));if(land.length)pool=land;
   let best=-1,bs=-1e9;for(const i of pool){const v=score(city.info[i],city.rects[i])+rnd()*.12;if(v>bs){bs=v;best=i}}
   selected.add(best);city.info[best].reservedSpecial=name;return best;
  };
  // Priorizar aeroporto grande em AMBOS os tamanhos; compacto só se nenhum lote comprido estiver disponível.
  city.air=null;
  let airI=priorityAirI;
  if(airI>=0)selected.add(airI);
  if(airI<0){const c=[];city.info.forEach((f,i)=>{const q=city.rects[i],w=q[2]-q[0],h=q[3]-q[1];if(free(i)&&!f.beachReserve&&Math.max(w,h)>=2*P-RW-2&&Math.min(w,h)>=P-RW-2)c.push(i)});
   if(c.length){const land=c.filter(i=>!beachEdge(city.rects[i])),v=land.length?land:c,near=v.filter(i=>city.info[i].d<=.56),pool=near.length?near:v;let sc=-1e9;for(const i of pool){const score=-Math.abs(city.info[i].d-.36)*8+ar()*.12;if(score>sc){sc=score;airI=i}}selected.add(airI);city.info[airI].reservedSpecial='airport'}}
  if(airI<0)airI=choose('airport',50,50,(f,r)=>-Math.abs(f.d-.36)*8+area(r)/100000,ar);
  {const f=city.info[airI];f.kind='lot';f.airport=true;
   city.air=airportShapeFromRect(city.rects[airI],airI);
   // Rota de excecao para seeds sem lote fundido: protege os terrenos ainda livres.
   if(airI!==priorityAirI){airportReserveCorridors(airI,city.air);airportSetZoning(city.air);}
  }
  if(city.beachRi>=0&&(city.info[city.beachRi].reservedSpecial||city.info[city.beachRi].airRestricted)){
   city.info[city.beachRi].beachReserve=false;
   const eligible=i=>{const f=city.info[i];return !f.isle&&i!==city.bankReserveRi&&f.kind!=='lm'&&f.reservedSpecial!=='airport'&&f.reservedSpecial!=='casino'};
   const backup=city.beachCandidates.find(i=>eligible(i)&&!city.info[i].reservedSpecial&&!city.info[i].airRestricted)??
    city.beachCandidates.find(i=>eligible(i)&&(!city.info[i].reservedSpecial||city.info[i].reservedSpecial==='aircorridor'));
   if(backup==null)throw Error('Nenhuma quadra de praia aproveitavel, seed '+S.seed);
   city.beachRi=backup;city.info[backup].beachReserve=true;
  }
  // v262: cassino e danceteria agora ocupam quadras DIFERENTES,
  // inclusive no Mobile 7x7. Reservar o cassino antes dos demais lotes.
  {const ri=choose('casino',50,46,(f,r)=>-Math.abs(f.d-.25)*3+Math.min(area(r),3600)/3600,kr),f=city.info[ri],r=city.rects[ri];
   f.kind='lot';f.casino=true;
   const ix0=r[0]+SW,iz0=r[1]+SW,ix1=r[2]-SW,iz1=r[3]-SW,cx=(ix0+ix1)/2,cz=(iz0+iz1)/2;
   const frontZ=Math.min(iz1-9,cz+17);
   city.casino={ri,ix0,iz0,ix1,iz1,cx,cz,fz:frontZ,door:{x:cx,z:frontZ+1.3},nrm:[0,1],clubRi:-1,club:null,clubDoor:null,clubNrm:[0,-1]};
  }
  {const sharedCount=N>=9?2:1;city.deals=[];
   for(let m=0;m<sharedCount;m++){
    // v77: o 2º posto fica LONGE do 1º; prefere um posto isolado na zona rural (longe do cemitério).
    if(m===1&&city.deals[0]){const g0=city.deals[0],cem=city.lms.find(l=>l.name==='cem'),cq=cem&&city.rects[cem.ri];let best=-1,bs=-1e9;
     /* v79r47: o 2º posto (borracharia + AMOnições) vai SEMPRE pro fundo do mapa, oposto à praia (antes caía nas laterais e esvaziava a roça) */
     for(const mb of [.66,.5,0]){city.info.forEach((f,i)=>{if(!free(i,50,50))return;const r=city.rects[i];if(beachEdge(r)||!(f.d>=ZONE.houses))return;const bk=backOf(r);if(bk<mb)return;const cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2,dg=Math.hypot(cx-g0.cx,cz-g0.cz);if(dg<P*3)return;
      if(cq&&Math.hypot(cx-(cq[0]+cq[2])/2,cz-(cq[1]+cq[3])/2)<P*2.6)return;if(city.air&&airportHeightLimitForRect(city.air,r)<10)return;
      const sc=bk*2.5-Math.abs(f.d-(ZONE.houses+.06))*1.2+Math.min(dg,P*6)/(P*6)+(area(r)<=BS*BS*1.18?.5:-100)+dr()*.3;if(sc>bs){bs=sc;best=i}});if(best>=0)break} /* v79: posto+borracharia só em quarteirão simples (grande só se não houver outro) */
     if(best>=0){selected.add(best);const f=city.info[best],r=city.rects[best];f.reservedSpecial='gas';f.kind='lm';f.lm='gas';f.plaza=false;city.lms.push({name:'gas',ri:best,x:(r[0]+r[2])/2,z:(r[1]+r[3])/2,rural:true});continue}}
    const far0=m&&city.deals[0]?(f,r)=>Math.min(Math.hypot((r[0]+r[2])/2-city.deals[0].cx,(r[1]+r[3])/2-city.deals[0].cz),P*6)/(P*6)*3:()=>0;
    const ri=choose('dealgas',56,56,(f,r)=>-Math.abs(f.d-.34)*2+Math.min(area(r),3600)/3600+far0(f,r),dr),f=city.info[ri],r=city.rects[ri];
    f.kind='lot';f.dealgas=true;
    const ix0=r[0]+SW,iz0=r[1]+SW,ix1=r[2]-SW,iz1=r[3]-SW,cx=(ix0+ix1)/2,cz=(iz0+iz1)/2;
    city.deals.push({ri,ix0,iz0,ix1,iz1,cx,cz,shared:true});
    city.lms.push({name:'gas',ri,x:cx,z:cz});
   }
   city.deal=city.deals[0]||null;
   // v77: o MOTEL MIRAGEM ocupa um quarteirão VIZINHO ao 2º posto (o afastado); em 7×7, vizinho ao posto da concessionária.
   // (o terreno do posto não comporta o L com 6 quartos + piscina, nem em 14×14)
   // v77: a AMOnições vira o escritório dos fundos da borracharia do 2º posto (ou do posto da concessionária)
   {const g3=city.lms.find(l=>l.name==='gas'&&!city.info[l.ri]?.dealgas);city.tireRi=g3?g3.ri:city.info.findIndex(f=>f.dealgas);if(city.tireRi<0)city.tireRi=null}
   /* v79r48: MOTEL em qualquer quarteirão da ROÇA (sorteado, preferindo o fundo do mapa); não precisa ser vizinho do posto.
      Quarteirão simples, sem corredor aéreo alto demais, fora da praia. 7×7 (sem roça): a faixa mais externa de casas. */
   {const mr=mulberry32((S.seed^0x2d7e91b3)>>>0);let best=-1,bs=-1e9;
    for(const pass of [0,1,2])if(best<0)city.info.forEach((f,i)=>{const r=city.rects[i];const air=f.airRestricted&&!(city.air&&airportHeightLimitForRect(city.air,r)>=6);if(selected.has(i)||f.isle||f.beachReserve||f.reservedSpecial||air||f.kind==='lm'||f.forest||r[2]-r[0]<40||r[3]-r[1]<40||beachEdge(r))return;
     if(area(r)>BS*BS*1.18&&pass<2)return;const bk=backOf(r),rural=f.kind==='rural'||f.d>=ZONE.houses;if(pass===0&&!(rural&&bk>=.45))return;if(pass===1&&!(rural||bk>=.6))return;
     const sc=bk*1.2+mr()*2.2-(area(r)>BS*BS*1.18?50:0);if(sc>bs){bs=sc;best=i}});
    if(best>=0){selected.add(best);const f=city.info[best];f.kind='lot';f.motelLot=true;f.reservedSpecial='motel';city.motelRi=best}}}
  {const ri=choose('tune',50,50,(f,r)=>-Math.abs(f.d-.28)*3+((f.kind==='bld')?.8:0),tr),f=city.info[ri];f.kind='bld';f.low=false;f.tune=true;city.tuneRi=ri;city.tuneSpot=null;try{neonRoadPlan(ri);if(city.neonRoad)f.neon=true}catch(e){console.error('[neon road]',e);city.neonRoad=null}}
  // Casa segura reservada antes de indústria, sem sacrificar qualquer marco.
  {const ri=choose('safe',50,50,(f,r)=>((f.kind==='houses')?1:0)-Math.abs(f.d-.42)*2,sr),f=city.info[ri];f.kind='houses';f.safe=true;city.safeRi=ri;city.safe=null;}
  // v262: a danceteria e um SEGUNDO quarteirao obrigatorio, sem compartilhar
  // parede, piso, colisores ou index com o cassino. O seed de sorteio e proprio
  // para evitar que esta escolha altere os resultados de outros sorteios.
  {const cr=mulberry32((S.seed^0x6bc4f321)>>>0);
   const ri=choose('club',50,46,(f,r)=>-Math.abs(f.d-.3)*2.5+Math.min(area(r),3600)/3600,cr),f=city.info[ri],r=city.rects[ri];
   f.kind='lot';f.club=true;
   const ix0=r[0]+SW,iz0=r[1]+SW,ix1=r[2]-SW,iz1=r[3]-SW,cx=(ix0+ix1)/2,cz=(iz0+iz1)/2;
   const frontZ=iz0+10,backZ=Math.min(iz1-8,frontZ+29);
   city.casino.clubRi=ri;
   city.casino.club={ri,ix0,iz0,ix1,iz1,cx,cz,z0:frontZ,z1:backZ};
   city.casino.clubDoor={x:cx,z:frontZ-1.3};city.casino.clubNrm=[0,-1];
  }
 }
 // Indústria é desejável, porém nunca sacrifica especiais. No Mobile 1–2 quadras.
 {const ir=mulberry32((S.seed^0x6b43a9b5)>>>0),ang=ir()*6.283,byRiver=ir()<.75;let best=-1,bs=1e9;
  const available=(f,r)=>!f.isle&&!f.beachReserve&&f.kind!=='lm'&&!f.reservedSpecial&&!f.airRestricted&&!f.safe&&!f.para&&!f.tune&&!f.deal&&!f.airport&&!f.casino&&!f.club&&!f.garage&&!f.tour&&!beachEdge(r);
  /* v79r47: indústria fica na DIVISA casas→roça (ou fim da cidade→roça), longe do centro: as casas vêm antes, a indústria depois. */
  const indMin=ZONE.houses-.07;
  for(const needRiver of [true,false]){if(best>=0)break; /* v79r47: SEMPRE no pé de um rio (água poluída); sem rio na divisa, cai no critério antigo */
  city.info.forEach((f,i)=>{const r=city.rects[i];if(!available(f,r)||f.d<indMin)return;const c=ctrOf(r),a=Math.atan2(c[1]-city.core.z,c[0]-city.core.x);let da=Math.abs(a-ang);da=Math.min(da,6.283-da);let wd=1e9;for(const w of city.water||[]){const dx=Math.max(w[0]-c[0],0,c[0]-w[2]),dz=Math.max(w[1]-c[1],0,c[1]-w[3]);wd=Math.min(wd,Math.hypot(dx,dz))}if(needRiver&&!(wd<P*.75))return;const sc=da*.8+Math.abs(f.d-(ZONE.houses+.03))*6+(1-backOf(r))*2.2-(byRiver&&wd<P*.9?1.2:0)+wd/P*.8;if(sc<bs){bs=sc;best=i}})}
  if(best<0)city.info.forEach((f,i)=>{if(best<0&&available(f,city.rects[i]))best=i});
  if(best>=0){const c0=ctrOf(city.rects[best]);const cl=city.info.map((f,i)=>[i,Math.hypot(ctrOf(city.rects[i])[0]-c0[0],ctrOf(city.rects[i])[1]-c0[1])]).filter(([i,d])=>d<P*1.7&&available(city.info[i],city.rects[i])&&city.info[i].d>=indMin).sort((a,b)=>a[1]-b[1]).slice(0,N===7?2:4);
   let rr2=0;for(const[i,d] of cl){city.info[i].kind='industrial';city.info[i].plaza=false;rr2=Math.max(rr2,d+Math.max(city.rects[i][2]-city.rects[i][0],city.rects[i][3]-city.rects[i][1])/2)}
   if(cl.length){city.ind={x:c0[0],z:c0[1],r:rr2+10};let near=1e9;for(const w of city.water||[]){const dx=Math.max(w[0]-c0[0],0,c0[0]-w[2]),dz=Math.max(w[1]-c0[1],0,c0[1]-w[3]);near=Math.min(near,Math.hypot(dx,dz))}
    if(near<city.ind.r+P*1.3)city.poll={x:c0[0],z:c0[1],R:city.ind.r+120+ir()*60,ph:[ir()*6.28,ir()*6.28,ir()*6.28,ir()*6.28]}}}}
 // A micro-ilha continua exclusiva da casa/garagem do DeLorean.
 if(city.isle){const ri=city.info.findIndex(f=>f.isle);if(ri<0)throw new Error('Micro-ilha sem quarteirão residencial: '+S.seed);const f=city.info[ri];f.kind='houses';f.low=false;f.garage=false;f.tune=false;f.para=false;f.tour=false;f.deal=false;f.airport=false;f.casino=false;f.club=false}
 // Praia e paraquedas apenas em terrenos LIVRES: nunca sobrepor os obrigatórios.
 city.info.forEach((f,i)=>{if(f.kind==='industrial'||f.kind==='lm'||f.isle||f.reservedSpecial)return;
  const r=city.rects[i],mx=(r[0]+r[2])/2,mz=(r[1]+r[3])/2,cs=city.coast,edge=cs===0?r[1]<P:cs===1?r[3]>E-P:cs===2?r[0]<P:r[2]>E-P;
  if(edge&&onBeach(mx,mz)){f.kind='bld';f.tour=true}});
 {const pr=mulberry32((S.seed^0x29c7a513)>>>0),coastal=[];
  city.info.forEach((f,i)=>{if(f.reservedSpecial||f.airRestricted||f.isle||f.kind==='lm'||f.kind==='industrial')return;const r=city.rects[i],cs=city.coast,edge=cs===0?r[1]<P:cs===1?r[3]>E-P:cs===2?r[0]<P:r[2]>E-P;
   if(edge&&onBeach((r[0]+r[2])/2,(r[1]+r[3])/2))coastal.push(i)});
  coastal.sort((a,b)=>Number(!city.info[a].tour)-Number(!city.info[b].tour));const pref=coastal.filter(i=>city.info[i].tour),pool=pref.length?pref:coastal;
  city.paraRi=city.beachRi>=0?city.beachRi:(pool.length?pool[Math.floor(pr()*pool.length)]:-1);
  if(city.paraRi<0&&!city.haze)throw Error('Seed '+S.seed+' sem edificio de praia/paraquedas');
  if(city.paraRi>=0){const f=city.info[city.paraRi];f.kind='bld';f.tour=true;f.low=false;f.para=true;f.garage=false}}
 {const bl=[];city.info.forEach((f,i)=>{if(f.kind==='bld'&&!f.para&&!f.reservedSpecial&&!f.isle)bl.push(i)});
  const ng=city.isle?0:Math.min(bl.length,Math.round(N*N/70)+1);for(let k=0;k<ng;k++)city.info[bl.splice(Math.floor(R()*bl.length),1)[0]].garage=true}
 // ZONA RURAL É A ÚLTIMA DA FILA; Mobile no máximo 2 quadras rústicas.
 if(N===7){const available=city.info.map((f,i)=>[f,i]).filter(([f])=>!f.reservedSpecial&&!f.isle&&!f.safe&&!f.garage&&!f.para&&!f.tour&&['rural','houses','bld','park','lot'].includes(f.kind));
  available.sort((a,b)=>b[0].d-a[0].d);const selected=available.slice(0,Math.min(2,available.length)).map(q=>q[1]);
  city.info.forEach((f,i)=>{if(f.kind==='rural')f.kind='houses'});for(const i of selected)city.info[i].kind='rural';}
 // v264: uma unica quadra de FLORESTA em area rural, APOS todos os marcos.
 // Nao rouba aeroporto, cemitério, praia, cassino/danceteria nem industria.
 // A escolha depende so da seed e dos lotes rurais realmente restantes.
 {const fr=mulberry32(((S.seed>>>0)^0x7c6f3a91)>>>0),cem=city.lms.find(l=>l.name==='cem');
  const freeRural=q=>!q.f.reservedSpecial&&!q.f.airRestricted&&!q.f.isle&&!q.f.safe&&!q.f.para&&!q.f.tour;
  const lots=city.info.map((f,i)=>({f,i,r:city.rects[i]})),ruralLots=lots.filter(q=>q.f.kind==='rural'&&freeRural(q));
  // Reserva de ultima chance em seed atipica: converter uma casa periferica
  // em floresta, sem jamais retirar um edificio especial ou lote costeiro.
  const candidates=ruralLots.length?ruralLots:lots.filter(q=>q.f.kind==='houses'&&freeRural(q)&&!beachEdge(q.r));
  let best=null,score=-Infinity;
  for(const q of candidates){const x=(q.r[0]+q.r[2])/2,z=(q.r[1]+q.r[3])/2;
   const dc=cem?Math.hypot(x-cem.x,z-cem.z)/P:9,sc=backOf(q.r)*3+q.f.d*1.5+Math.min((q.r[2]-q.r[0])*(q.r[3]-q.r[1])/(BS*BS),3)*.15+Math.min(dc,4)*.35-(dc<1.6?2.5:0)+fr()*.6; /* v79r47: fundo do mapa, mas não colada no cemitério */
   if(sc>score){score=sc;best=q}}
  city.forest=best?{ri:best.i,x:(best.r[0]+best.r[2])/2,z:(best.r[1]+best.r[3])/2,
   lootId:'forestLoot_'+S.seed,enemyId:'forestDemo_'+S.seed,loot:['remote','magnum','smg','grenade'][Math.floor(fr()*4)]}:null;
  if(best){best.f.kind='rural';best.f.forest=true;}
 }
 // v245: TODOS os terrenos efetivamente classificados como casas usam a
 // malha residencial da v232/v235, inclusive a casa segura e os lotes baixos
 // do corredor do aeroporto. A garagem da safe house ganha uma parcela 2x2
 // reservada DENTRO desta malha, sem regressar ao antigo split aleatório.
 // Não consome R e mantém o formato/zoneamento das outras quadras.
 {for(const f of city.info)f.denseHouse=f.kind==='houses';
  city.denseHouseCount=city.info.filter(f=>f.denseHouse).length;
 }
 // Detectar quebra de contrato já durante a geração, nunca entregar um Mobile incompleto silenciosamente.
 {const types=['sky','hall','hosp','univ','stad','bank','mkt','mall','pol','cem','gas'];const missing=types.filter(n=>!city.lms.some(l=>l.name===n));
  if(!city.air)missing.push('airport');if(!city.casino)missing.push('casino');if(!city.casino?.club||city.casino.clubRi===city.casino.ri)missing.push('club');if(!city.deal)missing.push('deal');if(city.tuneRi<0)missing.push('tune');
  if(missing.length)throw new Error('Especial obrigatório não gerado: '+missing.join(', ')+' / seed '+S.seed);}
  {const banks=(city.lms||[]).filter(l=>l.name==='bank');
   if(banks.length>1){const keep=banks[0];for(const b of banks.slice(1)){city.info[b.ri].kind='bld'}city.lms=city.lms.filter(l=>l.name!=='bank'||l===keep)}
   /* v176: o lote do banco NÃO é mais recortado (antes virava 37x37 m e a calçada/chão em volta sumiam). */}
 }else{// ilha: nada de marcos, indústria, garagens ou oficina; o castelo (casa segura) fica no quarteirão central
  city.delSlot=null;city.deals=[];city.deal=null;city.air=null;city.casino=null;city.paraRi=-1;city.tuneRi=-1;city.tuneSpot=null;city.safe=null;city.safeRi=-1;let safeDistance=Infinity;city.rects.forEach((r,i)=>{const d=Math.hypot((r[0]+r[2])/2-E/2,(r[1]+r[3])/2-E/2);if(d<safeDistance){safeDistance=d;city.safeRi=i}});if(city.safeRi<0)throw Error('Point Haze sem lote para o castelo');city.info[city.safeRi].kind='haze';city.info[city.safeRi].safe=true}
 {const o=RW/2;city.decks=[];city.pillars=[];if(city.riv&&city.riv.size){
  for(const q of city.bridges){const r=q[0]==='h'?[q[1]*P+o,q[2]*P-o,(q[1]+1)*P-o,q[2]*P+o]:[q[1]*P-o,q[2]*P+o,q[1]*P+o,(q[2]+1)*P-o];if(!segExists(q[1],q[2],q[0]==='h'?0:1))continue;city.decks.push(r);
   const cx=(r[0]+r[2])/2,cz=(r[1]+r[3])/2;city.pillars.push([cx-1.3,cz-1.3,cx+1.3,cz+1.3])}
  for(let kx=0;kx<=N;kx++)for(let kz=0;kz<=N;kz++)if(isRiv(kx-1,kz-1)&&isRiv(kx,kz-1)&&isRiv(kx-1,kz)&&isRiv(kx,kz)&&nodeDeg(kx,kz)>0)city.decks.push([kx*P-o,kz*P-o,kx*P+o,kz*P+o])}
  dbChoose();if(!city.haze&&!city.dbs.length)throw Error('Seed '+S.seed+': nenhuma ponte levadica gerada');}
 buildPiers();if(!city.haze)buildRamps();
 /* --- outer ring of buildings (not on the coast side) --- */
 if(!city.haze){const o=RW/2,dep=RING_DEPTH,cs=city.coast,sp=city.coastSpan;const reach=(side,t)=>cs===side&&inSpan(t);const bands=[];
  for(const sd of [0,1]){const zc=sd===0?0:E;bands.push([reach(2,zc)?-SHORE:-o-dep,sd===0?-o-dep:E+o+SW,reach(3,zc)?E+SHORE:E+o+dep,sd===0?-o-SW:E+o+dep,sd===0?'s':'n',sd])}
  for(const sd of [2,3]){const xc=sd===2?0:E;bands.push([sd===2?-o-dep:E+o+SW,reach(0,xc)?-SHORE:-o-SW,sd===2?-o-SW:E+o+dep,reach(1,xc)?E+SHORE:E+o+SW,sd===2?'e':'w',sd])}
  for(let[x0,z0,x1,z1,face,sd] of bands){let t0=null,t1=null;
   if(sd===cs){if(!sp)continue;if(sd===0)z0=-SHORE+1;else if(sd===1)z1=E+SHORE-1;else if(sd===2)x0=-SHORE+1;else x1=E+SHORE-1;if(sp[0]<0)t0=E/2+7;else t1=E/2-7}
   const horiz=face==='s'||face==='n';let t=horiz?x0:z0,end=horiz?x1:z1;if(t0!==null)t=Math.max(t,t0);if(t1!==null)end=Math.min(end,t1);
   while(t<end-4){const w=Math.min(rr(10,22),end-t);const h=night?rr(16,48):rr(12,34);const part=horiz?[t+.3,z0,t+w-.3,z1,face,h]:[x0,t+.3,x1,t+w-.3,face,h];
    const wet=city.water&&city.water.some(r=>part[0]<r[2]&&part[2]>r[0]&&part[1]<r[3]&&part[3]>r[1]);// Keep the runway path empty where the ceiling is too low for a facade and its roof kit.
    const roofLimit=airportHeightLimitForRect(city.air,part);
    if(!wet&&roofLimit>=10){if(isRural((part[0]+part[2])/2,(part[1]+part[3])/2))city.wild.push(part);else city.ring.push(part)}t+=w}}}
 // Placas de destino somente em avenidas de quatro faixas:
 // uma a cada quatro quarteiroes e nas cabeceiras das pontes.
 // v192: a busca inclui todas as pontes, nao apenas as levadicas. Os postes
 // ficam sobre a calcada em terra firme, antes do tabuleiro, nunca sobre agua.
 city.signZones=[];
 {const E=city.ext,industrial=city.info.map((f,i)=>f.kind==='industrial'?ctrOf(city.rects[i]):null).filter(Boolean);
  const ic=industrial.length?industrial.reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]).map(v=>v/industrial.length):null;
  const beach=city.coast===0?[E/2,0]:city.coast===1?[E/2,E]:city.coast===2?[0,E/2]:[E,E/2];
  const bridges=new Set((city.bridges||[]).map(q=>q[0]+':'+q[1]+':'+q[2]));
  const head=(kx,kz,h)=>h?(bridges.has('h:'+(kx-1)+':'+kz)||bridges.has('h:'+kx+':'+kz)):
   (bridges.has('v:'+kx+':'+(kz-1))||bridges.has('v:'+kx+':'+kz));
  const activeBridges=(city.bridges||[]).filter(q=>segExists(q[1],q[2],q[0]==='h'?0:1));
  // Para uma placa na cabeca de qualquer ponte, procurar a primeira calcada
  // seca num dos acessos da MESMA avenida. A margem mais proxima tem prioridade;
  // se houver outro trecho de rio, seguir ate a primeira quadra em terra.
  const bridgeSidewalk=(x,z,h)=>{
   let nearest=null,metric=Infinity;
   for(const q of activeBridges){if((q[0]==='h')!==h)continue;
    const cx=(q[1]+(h?.5:0))*P,cz=(q[2]+(h?0:.5))*P;
    const s=h?x-cx:z-cz,l=h?z-cz:x-cx;
    if(Math.abs(s)>P*.88||Math.abs(l)>RW/2+SW+2)continue;
    const score=Math.abs(s)+Math.abs(l-(RW/2+SW*.55))*.05;
    if(score<metric){metric=score;nearest={q,cx,cz,s,l}}
   }
   if(!nearest)return[x,z];
   const {q,cx,cz,s,l}=nearest,first=s<=0?-1:1;
   for(const sd of [first,-first])for(let step=0;step<4;step++){
    const away=sd*(P/2+18+step*P),xx=h?cx+away:cx+l,zz=h?cz+l:cz+away;
    if(xx<=RW/2+SW||zz<=RW/2+SW||xx>=city.ext-RW/2-SW||zz>=city.ext-RW/2-SW)continue;
    const ix=Math.floor(xx/P),iz=Math.floor(zz/P);
    if(!segExists(ix,iz,h?0:1))continue;
    // Postes e placas se projetam da calcada para a margem da pista.
    // Conferir os DOIS pontos, evitando bases flutuantes sobre o rio.
    const px=xx-(h?0:3.8),pz=zz-(h?3.8:0);
    if(riverZone(xx,zz)||riverZone(px,pz)||waterAt(xx,zz)||waterAt(px,pz))continue;
    if(isRural(xx,zz)||isRural(px,pz))continue;
    return[xx,zz];
   }
   // Sem acesso terrestre valido: e melhor omitir esta placa a faze-la flutuar.
   return null;
  };
  for(let kx=1;kx<city.N;kx++)for(let kz=1;kz<city.N;kz++){
   const h=segExists(kx,kz,0)&&lineType(kx,kz,0).t==='ave';
   const v=segExists(kx,kz,1)&&lineType(kx,kz,1).t==='ave';
   if(!h&&!v)continue;
   // Nas esquinas onde ha avenida nos dois eixos, priorizar aquele
   // que realmente contem uma ponte: evita montar placa sobre o rio errado.
   const H=h&&head(kx,kz,true)?true:v&&head(kx,kz,false)?false:h;
   const bridgeHead=head(kx,kz,H);
   if(!bridgeHead&&(H?kx%4!==0:kz%4!==0))continue;
   if(isRural(kx*P,kz*P)||isRural(kx*P+P*.45,kz*P+P*.45)||riverZone(kx*P,kz*P))continue;
   let xx=kx*P+(H?P*.28:RW/2+SW*.55),zz=kz*P+(H?RW/2+SW*.55:P*.28);
   const dry=bridgeSidewalk(xx,zz,H);if(!dry)continue;
   [xx,zz]=dry;
   // Proteger tambem as placas comuns de uma base em agua ou sobre o rio,
   // mesmo quando a quadra atual nao foi marcada como cabeca de ponte.
   if(riverZone(xx,zz)||waterAt(xx,zz))continue;
   // Evitar criar placas grudadas umas nas outras nas margens estreitas.
   if(city.signZones.some(q=>Math.hypot(q.x-xx,q.z-zz)<P*1.5))continue;
   // Cada placa seleciona dois destinos ainda distantes dela.
   // Assim, na praia aparecem CENTRO/INDUSTRIA; na industria, PRAIA/CENTRO.
   const bearing=dest=>Math.atan2(dest[1]-zz,dest[0]-xx);
   const targets=[
    {name:'PRAIA',pos:beach},
    {name:'CENTRO',pos:[city.core.x,city.core.z]},
    ...(ic?[{name:'INDUSTRIA',pos:ic}]:[])
   ].map(t=>({...t,dist:Math.hypot(t.pos[0]-xx,t.pos[1]-zz)}));
   // Distancia ao bairro mais proximo: se ja estamos nele, nao sinaliza-lo.
   // Mesmo nas transicoes, escolher sempre os dois destinos mais afastados.
   targets.sort((a,b)=>b.dist-a.dist);
   // v192: o bearing e calculado SOMENTE DEPOIS da mudanca de margem, usando
   // a posicao final do poste; mudar de cabeceira recalcula as duas setas.
   // A textura é vista na orientação local da placa, não na orientação do mapa.
   // Painel paralelo ao eixo Z (avenida L-O): compensar 90 graus.
   // Painel paralelo ao eixo X (avenida N-S): manter ângulo do mapa.
   const faceOffset=H?-Math.PI/2:0;
   const lines=targets.slice(0,2).map(t=>[t.name,bearing(t.pos)+faceOffset]);
   city.signZones.push({x:xx,z:zz,horiz:H,lines});
  }
 }
 worldGen2(grp,st);buildRiverArches(grp);buildMinimap(st);WX.chance=undefined;WX.stormChance=undefined;WX.lastOpt=undefined;try{buildWet(st)}catch(e){console.error(e)}
 DN.tod=S.hour*60;DN.day=0;DN.t=0;updateDayNight(0,true);updateCityClock(true);
 PL.car=null;PL.x=E/2;PL.z=E/2;await preloadCityRegions();try{pylonsBuild()}catch(e){console.error(e)}city.parkingFloorReady=true;finishParkingRoads();for(const v of vehicles)if(v.sleep&&!v.t.boat){v.gy=groundY(v.x,v.z);if(v.g)v.g.position.y=v.gy;}
 if(city.haze&&(!city.safe||![...city.chunks.values()].some(ch=>ch.hazeCastleMesh)))throw Error('Point Haze: castelo da casa segura não foi montado');if(city.haze&&!city.hazeTerrainMesh){hazeTerrain();hazeHatchBuild()}
 if(city.isle&&!city.delSlot)console.error('DeLorean: garagem da micro-ilha não foi criada para a seed',S.seed);
 if(!city.haze&&city.beachRi>=0&&(!city.info[city.beachRi]?.para||city.info[city.beachRi]?.kind!=='bld'))throw Error('Quadra de praia obrigatoria nao gerada: '+S.seed);
 try{vinylPlace()}catch(e){console.error(e)}try{islePlace()}catch(e){console.error(e)}paraInit();tommyInit();try{brInitCity()}catch(e){console.error(e)}try{streetTexBuild()}catch(e){console.error(e)}spawnPlayer();
 buildCarHash();buildLanes();populate(true);
 for(let i=0;i<pedTarget();i++)spawnPed({x:PL.x,z:PL.z,min:0,max:200});
 buildSafehouse();buildJail();invertInitCity();
 try{beachInit()}catch(e){console.error(e)}try{skyInit()}catch(e){}try{birdsInit()}catch(e){console.error(e)}try{evtInit()}catch(e){}
 $('#stylename').textContent=st.label;$('#seedname').textContent=S.seed;syncVehicleHUD();CITY_CACHE.ready=true;
 }finally{CITY_CACHE.building=false}
}

// Ruas de neon: retas de ponta a ponta. A rua da praia é sempre a primeira; depois, paralelas a ela a cada ~1/3 da cidade.
// Entre duas paralelas de neon entram 1-2 trechos perpendiculares que NÃO encostam nelas. Toda rua que cruza uma rua de neon fica sem neon.
function planNeon(){const N=city.N,c=city.coast,Hpar=c<2,k0=(c===0||c===2)?0:N,dir=k0===0?1:-1,rnd=mulberry32(((S.seed>>>0)^0x5bd1e995)>>>0),segs=new Map();
 const add=(H,k,a,b)=>{const key=(H?'H':'V')+k;if(!segs.has(key))segs.set(key,[]);segs.get(key).push([a,b])};
 const par=[k0];let k=k0;const stp=Math.max(4,Math.round(N/3));for(;;){k+=dir*(stp+Math.floor(rnd()*4)-1);if(k<1||k>N-2)break;par.push(k)}
 for(const q of par)add(Hpar,q,-2,N+2);
 const bounds=par.slice().sort((a,b)=>a-b),gaps=[];for(let i=0;i<bounds.length-1;i++)gaps.push([bounds[i]+1,bounds[i+1]-1]);
 const far=dir>0?N:0,last=par[par.length-1];if(dir>0&&far-last>=3)gaps.push([last+1,N+2]);else if(dir<0&&last-far>=3)gaps.push([-2,last-1]);
 for(const[a,b] of gaps){if(b-a<1.5)continue;const n=1+(rnd()<.5?1:0),used=[];for(let t=0;t<12&&used.length<n;t++){const m=1+Math.floor(rnd()*(N-1));if(used.some(u=>Math.abs(u-m)<3))continue;used.push(m);add(!Hpar,m,a,b)}}
 city.neonPlan={segs,beach:(Hpar?'H':'V')+k0}}
function neonStreet(face,x0,z0,x1,z1){if(!face)return 0;if(!city.neonPlan)planNeon();const H=face==='n'||face==='s',k=H?Math.round((face==='s'?z1:z0)/P):Math.round((face==='e'?x1:x0)/P);
 const key=(H?'H':'V')+k,L=city.neonPlan.segs.get(key);if(!L)return 0;const t=(H?(x0+x1)/2:(z0+z1)/2)/P;for(const g of L)if(t>g[0]&&t<g[1])return key===city.neonPlan.beach?2:1;return 0}
// Sinalizacao procedural: recursos compartilhados entre chunks (sem novas colisões).
const ROAD_SIGNS={materials:new Map()};
// v78: desenho da placa (texto + seta pela direção real do destino) separado do material,
// para o atlas das placas suspensas copiar exatamente os mesmos pixels.
function roadSignCanvas(kind,lines){
 const c=cv(kind==='wrong'?128:512,kind==='wrong'?128:192),g=c.getContext('2d');
 if(kind==='wrong'){
  g.clearRect(0,0,128,128);g.fillStyle='#c9242d';g.beginPath();g.arc(64,64,57,0,Math.PI*2);g.fill();
  g.fillStyle='#f7f6ee';g.fillRect(25,56,78,16);
 }else{
  g.fillStyle='#17633d';g.fillRect(0,0,512,192);g.strokeStyle='#f1f5e8';g.lineWidth=7;g.strokeRect(7,7,498,178);
  g.fillStyle='#ffffff';g.textBaseline='middle';g.textAlign='left';
  for(let i=0;i<lines.length;i++){
   const [label,arrow]=lines[i];let size=43;do{g.font=`bold ${size}px Arial,sans-serif`;if(g.measureText(label).width<355||size<=24)break;size--}while(true);
   const yy=51+i*89;g.fillText(label,28,yy);
   // Seta vetorial rotacionada pela direcao geografica absoluta do destino.
   // No canvas: leste = direita, norte (-Z) = cima, nordeste = diagonal.
   g.save();g.translate(445,yy);g.rotate(typeof arrow==='number'?arrow:0);
   g.strokeStyle='#ffffff';g.fillStyle='#ffffff';g.lineWidth=10;g.lineCap='square';g.lineJoin='miter';
   g.beginPath();g.moveTo(-27,0);g.lineTo(17,0);g.stroke();
   g.beginPath();g.moveTo(29,0);g.lineTo(1,-20);g.lineTo(1,20);g.closePath();g.fill();
   g.restore();
  }
 }
 return c;
}
function roadSignMaterial(kind,lines){
 const key=kind+':'+JSON.stringify(lines);if(ROAD_SIGNS.materials.has(key))return ROAD_SIGNS.materials.get(key);
 const c=roadSignCanvas(kind,lines);
 const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:kind==='wrong',side:kind==='guide'?THREE.FrontSide:THREE.DoubleSide,depthWrite:kind!=='wrong'});
 mat.userData.cached=true;ROAD_SIGNS.materials.set(key,mat);return mat;
}
function roadSignPlane(group,mat,x,y,z,w,h,normalX,normalZ){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),S.style==='inverted'?unlitSignMat(mat):mat);
 mesh.position.set(x,y,z);mesh.rotation.y=Math.atan2(normalX,normalZ);group.add(mesh);return mesh;
}
/* v78 · atlas das placas suspensas de orientação (city.signZones). Cada texto distinto (lines = rótulo + seta
   pela direção real do destino, calculado na geração) ganha um slot 512×192 desenhado por roadSignCanvas — os
   mesmos pixels de antes. As faces de um chunk viram UMA malha (1 draw call) com UVs no slot da sua placa.
   Recriado por cidade (city.signZones novo). Sem slot livre → null (quem chama volta ao plano individual). */
const SIGN_ATLAS={zones:null,canvas:null,tex:null,mat:null,matInv:null,slots:new Map(),cap:0,cols:4,PW:516,PH:196};
function signAtlasSlot(lines){const A=SIGN_ATLAS;
 if(A.zones!==city.signZones){
  const keys=new Set((city.signZones||[]).map(q=>JSON.stringify(q.lines)));A.zones=city.signZones;A.slots=new Map();A.cap=Math.max(1,keys.size);
  A.canvas=cv(A.cols*A.PW,Math.ceil(A.cap/A.cols)*A.PH);if(A.tex)A.tex.dispose();
  A.tex=new THREE.CanvasTexture(A.canvas);A.tex.magFilter=THREE.LinearFilter;A.tex.minFilter=THREE.LinearFilter;
  if(!A.mat){A.mat=new THREE.MeshBasicMaterial({map:A.tex});A.mat.userData.cached=true}else{A.mat.map=A.tex;A.mat.needsUpdate=true}
  if(!A.matInv){A.matInv=new THREE.MeshLambertMaterial({map:A.tex,color:0xb8bcc2});A.matInv.userData.cached=true}else{A.matInv.map=A.tex;A.matInv.needsUpdate=true}}
 const key=JSON.stringify(lines);if(A.slots.has(key))return A.slots.get(key);if(A.slots.size>=A.cap)return null;
 const i=A.slots.size,px=(i%A.cols)*A.PW+2,py=Math.floor(i/A.cols)*A.PH+2,W=A.canvas.width,H=A.canvas.height;
 A.canvas.getContext('2d').drawImage(roadSignCanvas('guide',lines),px,py);A.tex.needsUpdate=true;
 const s={u0:(px+.5)/W,u1:(px+512-.5)/W,v0:1-(py+192-.5)/H,v1:1-(py+.5)/H};A.slots.set(key,s);return s}
// Estrutura das placas (poste, braço, painel, verso): mesmas cores/Lambert de antes, em lote por chunk.
const SIGN_PARTS={};
function signParts(){if(!SIGN_PARTS.pole){SIGN_PARTS.pole=new THREE.CylinderGeometry(.19,.25,6.2,10).toNonIndexed();SIGN_PARTS.box=new THREE.BoxGeometry(1,1,1).toNonIndexed();
  SIGN_PARTS.mat=new THREE.MeshLambertMaterial({vertexColors:true});SIGN_PARTS.mat.userData.cached=true;
  SIGN_PARTS.steel=new THREE.Color(0x687c78);SIGN_PARTS.panel=new THREE.Color(0x145333);SIGN_PARTS.back=new THREE.Color(0x858e8e);SIGN_PARTS.white=new THREE.Color(0xffffff)}return SIGN_PARTS}


// Profundidade da lama (0..1) num ponto: só em estrada de terra molhada, com o mesmo ruído, limiar e
// umidade que o shader usa, então a poça que aparece é a que freia. Poça rasa ~0,25; miolo fundo ~1.
function mudDepthAt(x,z){if(!WET.maskData||!WET.pudData||!WET.wf||!WET.sz)return 0;const u=(x+MOFF)/WET.sz,v=(z+MOFF)/WET.sz;if(u<0||v<0||u>=1||v>=1)return 0;
 if(WET.maskData[(Math.floor(v*WET.maskH)*WET.maskW+Math.floor(u*WET.maskW))*4+1]<128)return 0;
 const G=WET.G,w=WET.wf[Math.min(G-1,Math.floor(v*G))*G+Math.min(G-1,Math.floor(u*G))];if(w<.02)return 0;
 const N=WET.pudN,px=((Math.floor(x/128*N)%N)+N)%N,pz=((Math.floor(z/128*N)%N)+N)%N,n=WET.pudData[(pz*N+px)*4]/255,th=.7-.12*w;
 const ss=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)},pud=ss(th,th+.03,n);if(!pud)return 0;
 return pud*(.25+.75*ss(th,th+.16,n))*Math.min(1,w*1.4)}
// Lama no veículo: c.mudG = perda de aderência (todos); retorno = perda de tração/freio. Carro pequeno atola no
// miolo fundo; van atola menos; caminhão, camionete, SUV e ônibus só escorregam um pouco.
function carMud(c){if(c.t.boat||c.airY>0){c.mudG=0;return 0}const m=mudDepthAt(c.x,c.z);c.mudG=m;if(!m)return 0;
 if(['pickup','truck','suv','bus'].includes(c.type))return m*.12;return c.type==='van'?m*.6:m}
/* Furniture occupants use the same independent pixel sprites as sidewalk pedestrians. */
function spawnPatioGuest(sp,ch){
 const p=spawnLying(sp.x,sp.z,sp.kind==='recline'?pick2(BEACH_PALS):null);p.state='patio';p.fixed=true;p.rot=sp.kind==='recline'?Math.PI/2:0;
 p.mx=Math.sin(sp.angle);p.mz=Math.cos(sp.angle);p.patioSpot=sp;
 p.gy=groundY(sp.x,sp.z);p.sp.visible=true;p.sh.visible=false;sp.p=p;ch.peds.push(p);placeSprite(p);return p;
}
function releasePatioGuest(p){
 const sp=p.patioSpot;if(!sp)return;
 if(sp.p===p){sp.p=null;sp.wait=30+R2()*30}
 p.patioSpot=null;p.fixed=false;p.sp.center.set(.5,0);p.sp.visible=true;p.sh.visible=true;
}
function patioTick(){const pc=PL.car||PL;let budget=MOB_LITE?12:22,active=0;for(const ch of city.chunks.values())for(const sp of ch.patio||[])if(sp.p&&peds.includes(sp.p)&&sp.p.state==='patio')active++;
 for(const ch of city.chunks.values())for(const sp of ch.patio||[]){const near=!PL.inside&&Math.hypot(pc.x-sp.x,pc.z-sp.z)<(MOB_LITE?85:115),good=S.style!=='inverted'&&rainAt(sp.x,sp.z)<.3&&(sp.kind==='seat'||DN.nightF<.5);
  if(sp.p&&!peds.includes(sp.p))sp.p=null;
  if(sp.p&&sp.p.state==='patio'&&(!near||!good)){removePed(sp.p);sp.p=null;active--;sp.wait=12}
  if(sp.p)continue;sp.wait=Math.max(0,(sp.wait||0)-.35);if(near&&good&&active<budget&&!sp.wait){spawnPatioGuest(sp,ch);active++}}
}
// Independent façade plan: details do not advance the city-layout random stream.
function houseFencePlan(seed,x0,z0,x1,z1,face,door,garage,force=false){const r=mulberry32(((Math.round(x0*29)*73856093)^(Math.round(z0*29)*19349663)^(seed*101+37))>>>0);if(!face||(!force&&r()>=.4))return null;
 const kind=r()<.5?'brown':'white',edges=[['n',x0,z0,x1,z0],['s',x0,z1,x1,z1],['w',x0,z0,x0,z1],['e',x1,z0,x1,z1]],segments=[];
 for(const [f,a,b,c,d] of edges){const H=f==='n'||f==='s',lo=H?a:b,hi=H?c:d;let spans=[[lo,hi]];if(f===face){for(const [g0,g1] of [[door-1.1,door+1.1],...(garage?[[garage[0]-.4,garage[1]+.4]]:[])]){const next=[];for(const [u,v] of spans){if(g1<=u||g0>=v)next.push([u,v]);else{if(g0>u)next.push([u,g0]);if(g1<v)next.push([g1,v])}}spans=next}}
 for(const [u,v] of spans)if(v-u>.45)segments.push(H?{x0:u,z0:b,x1:v,z1:b}:{x0:a,z0:u,x1:a,z1:v})}
 return{kind,segments,spacing:Math.max(.48,(2*(x1-x0+z1-z0)-2.2)/64)}}
function claimFenceSpan(lines,q){const H=q.z0===q.z1,key=(H?'h':'v')+(H?q.z0:q.x0).toFixed(3),lo=H?q.x0:q.z0,hi=H?q.x1:q.z1,old=lines.get(key)||[];let spans=[[lo,hi]];
 for(const [a,b] of old){const next=[];for(const [u,v] of spans){if(b<=u+.001||a>=v-.001)next.push([u,v]);else{if(a>u+.001)next.push([u,a]);if(b<v-.001)next.push([b,v])}}spans=next}
 lines.set(key,[...old,[lo,hi]]);return spans.filter(([a,b])=>b-a>.25).map(([a,b])=>H?{x0:a,z0:q.z0,x1:b,z1:q.z1}:{x0:q.x0,z0:a,x1:q.x1,z1:b})}
function houseWindowPlan(x0,z0,x1,z1,front,door){const out=[];for(const f of ['n','s','e','w']){const ns=f==='n'||f==='s',start=ns?x0:z0,len=ns?x1-x0:z1-z0;
 if(f===front){for(const [a,b] of [[start+.55,door-.87],[door+.87,start+len-.55]]){const space=b-a;if(space<.82)continue;out.push({f,u:(a+b)/2,w:Math.min(1.28,space-.08)})}}
 else{const n=Math.min(2,Math.max(1,Math.floor((len-1.2)/3.2))),step=(len-1.2)/n;for(let k=0;k<n;k++)out.push({f,u:start+.6+step*(k+.5),w:Math.min(1.25,step-.48)})}}
 return out.filter(q=>q.w>.65)}
function parkedCityColor(type,id){let h=S.seed>>>0;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;const r=mulberry32(h),st=STYLES[S.style];return type==='taxi'?(st.synth?'#ffd21f':'#f2c21a'):st.carCols[Math.floor(r()*st.carCols.length)]}
// Todos os marcos comuns cabem em um quarteirão. O cemitério pode continuar
// ocupando lote maior; quando sobrar espaço no retângulo, ele vira pátio/estacionamento.
function proceduralFootprint(kind,X0,Z0,X1,Z1){const w=X1-X0,d=Z1-Z0,one=Math.max(24,BS-2*SW-6),
 lim=kind==='cem'?Infinity:kind==='bank'?Math.min(one,BS-2*SW-6):kind==='hosp'?Math.min(one,62):kind==='hall'?Math.min(one,64):kind==='univ'?Math.min(one,68):kind==='stad'?Math.min(one,70):kind==='mall'?Math.min(one,66):kind==='mkt'?Math.min(one,60):kind==='gas'?Math.min(one,50):Math.min(one,Infinity);
 let nw=Math.min(w,lim),nd=Math.min(d,lim);const maxSide=kind==='cem'?(2*P-RW-2*SW):one,areaCap=kind==='cem'?(2*BS*BS):(BS*BS*.98);
 const scale=Math.min(1,maxSide/Math.max(nw,nd),Math.sqrt(areaCap/Math.max(1,nw*nd)));nw*=scale;nd*=scale;const x=(X0+X1-nw)/2,z=(Z0+Z1-nd)/2;return[x,z,x+nw,z+nd]}
/* Isometric occlusion: per-building IDs retain the existing combined geometry/draw calls. */
const ISOFADE={items:[null],active:new Set(),scan:0,data:new Uint8Array(128*64*4).fill(255),tex:null,enabled:{value:0},mats:new Set(),compileOn:false};
ISOFADE.tex=new THREE.DataTexture(ISOFADE.data,128,64,THREE.RGBAFormat);ISOFADE.tex.minFilter=ISOFADE.tex.magFilter=THREE.NearestFilter;ISOFADE.tex.generateMipmaps=false;ISOFADE.tex.needsUpdate=true;
function isoFadeReset(){ISOFADE.items=[null];ISOFADE.nrN=0;ISOFADE.active.clear();ISOFADE.scan=0;ISOFADE.data.fill(255);ISOFADE.tex.needsUpdate=true;ISOFADE.enabled.value=0;ISOFADE.mats.clear();ISOFADE.compileOn=false}
function isoFadeSetCompile(on){const b=!!on;if(ISOFADE.compileOn===b)return;ISOFADE.compileOn=b;for(const m of ISOFADE.mats)m.needsUpdate=true}
function isoRecord(builders,starts){
 let x0=Infinity,y0=Infinity,z0=Infinity,x1=-Infinity,y1=-Infinity,z1=-Infinity;
 for(let k=0;k<builders.length;k++){const b=builders[k];for(let i=starts[k];i<b.p.length;i+=3){if(b.iso&&b.iso[i/3])continue;const x=b.p[i],y=b.p[i+1],z=b.p[i+2];if(y<.7)continue;x0=Math.min(x0,x);y0=Math.min(y0,y);z0=Math.min(z0,z);x1=Math.max(x1,x);y1=Math.max(y1,y);z1=Math.max(z1,z)}}
 if(!Number.isFinite(x0)||y1<2.6||ISOFADE.items.length>=8192)return;
 const id=ISOFADE.items.length;ISOFADE.items.push({id,x0,y0:.45,z0,x1,y1,z1,a:1,want:1});
 for(let k=0;k<builders.length;k++){const b=builders[k];if(!b.iso)b.iso=[];for(let i=starts[k]/3;i<b.p.length/3;i++)if(!b.iso[i])b.iso[i]=id}
}
function isoFadeMaterial(mat){
 if(!mat)return;ISOFADE.mats.add(mat);if(mat.userData.isoFade)return;const original=mat.onBeforeCompile,cache=mat.customProgramCacheKey();mat.userData.isoFade=true;
 mat.onBeforeCompile=(sh,r)=>{if(original)original.call(mat,sh,r);if(!ISOFADE.compileOn)return;sh.uniforms.isoFadeMap={value:ISOFADE.tex};sh.uniforms.isoFadeOn=ISOFADE.enabled;
 sh.vertexShader='attribute float isoId;uniform sampler2D isoFadeMap;uniform float isoFadeOn;varying float vIsoAlpha;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vIsoAlpha=1.;if(isoFadeOn>.5&&isoId>.5){vec2 fadeUV=(vec2(mod(isoId,128.),floor(isoId/128.))+.5)/vec2(128.,64.);vIsoAlpha=texture2D(isoFadeMap,fadeUV).r;}');
 // Stable screen-door coverage avoids transparent-sort errors between batched facades.
 sh.fragmentShader='varying float vIsoAlpha;\n'+sh.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\n if(vIsoAlpha<.999){vec2 cell=mod(floor(gl_FragCoord.xy),4.);float threshold=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);if(threshold>vIsoAlpha)discard;}');
 };mat.customProgramCacheKey=()=>cache+(ISOFADE.compileOn?'|isoFade-v1':'|isoFade-off');mat.needsUpdate=true;
}
function isoAttach(mesh,mb){if(!mesh||!mb.iso)return;const a=new Float32Array(mesh.geometry.attributes.position.count);for(let i=0;i<a.length;i++)a[i]=mb.iso[i]||0;mesh.geometry.setAttribute('isoId',new THREE.BufferAttribute(a,1));isoFadeMaterial(mesh.material)}
function isoRayBox(from,to,b,pad){let lo=0,hi=.985;for(const [key,mn,mx]of [['x','x0','x1'],['y','y0','y1'],['z','z0','z1']]){const d=to[key]-from[key],low=b[mn]-(key==='y'?0:pad),high=b[mx]+(key==='y'?0:pad);if(Math.abs(d)<1e-6){if(from[key]<low||from[key]>high)return false;continue}let a=(low-from[key])/d,c=(high-from[key])/d;if(a>c){const q=a;a=c;c=q}lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return false}return hi>=0&&lo<.985}
// Interior meshes combine walls, furniture and floors. Reveal only fragments
// in front of the character, within a narrow corridor along the viewing ray.
const roomFocus={value:new THREE.Vector3()},roomReveal={value:0};
function prepareRoomCutaway(group){
 if(!group||group.userData.cutawayReady)return;
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;mesh.castShadow=false;// teto e mezanino cortados não podem continuar fazendo sombra
  for(const material of [].concat(mesh.material)){
   if(material.userData.roomCutaway)continue;
   material.userData.roomCutaway=true;
   const prior=material.onBeforeCompile,key=material.customProgramCacheKey();
   material.onBeforeCompile=shader=>{
    prior.call(material,shader);
    shader.uniforms.roomFocus=roomFocus;shader.uniforms.roomReveal=roomReveal;
    shader.vertexShader='varying vec3 roomWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n roomWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 roomWorld;uniform vec3 roomFocus;uniform float roomReveal;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
     if(roomReveal>0.001){
      vec3 axis=cameraPosition-roomFocus;float len=max(length(axis),.001);axis/=len;
      vec3 offset=roomWorld-roomFocus;float along=dot(offset,axis);
      float radius=length(offset-axis*along);
      float cut=roomReveal*(1.-smoothstep(1.35,2.55,radius))*smoothstep(.15,.85,along)*step(along,len);
      if(roomWorld.y>roomFocus.y+1.9)discard;
     }`);
   };
   material.customProgramCacheKey=()=>key+'|roomCutaway';material.needsUpdate=true;
  }
 });group.userData.cutawayReady=true;
}
function updateRoomCutaway(dt){
 const active=camMode==='top'&&PL.inside&&!TVM.on;
 if(!active){roomReveal.value=0;return}
 const group=PL.inside===true?SAFE.grp:PL.inside==='shop'?SHOP.grp:PL.inside==='mall'?MALL.grp:JAIL.grp;
 prepareRoomCutaway(group);
 roomFocus.value.set(PL.x,(PL.gy||0)+(PL.jy||0)+1,PL.z);
 roomReveal.value+=(1-roomReveal.value)*(1-Math.exp(-12*dt));
}
const DBU={a:{value:new THREE.Vector4(-1e6,-1e6,-1e6,-1e6)},b:{value:new THREE.Vector4(-1e6,-1e6,-1e6,-1e6)}};
const bridgeView={focus:{value:new THREE.Vector3()},bounds:{value:new THREE.Vector4()},strength:{value:0}};
function bridgeViewTick(dt){
 const boat=PL.car;
 if(camMode!=='top'||!boat?.t.boat||TVM.on||PL.inside){bridgeView.strength.value=0;return}
 const y=waterLevel(boat.x,boat.z)+.5,cam=camera.position;
 const t=clamp(-y/Math.max(.01,cam.y-y),0,1),x=boat.x+(cam.x-boat.x)*t,z=boat.z+(cam.z-boat.z)*t;
 const r=(city.decks||[]).find(b=>x>b[0]-2&&x<b[2]+2&&z>b[1]-2&&z<b[3]+2);
 if(r)bridgeView.bounds.value.set(...r);
 bridgeView.focus.value.set(boat.x,y,boat.z);
 bridgeView.strength.value+=((r?1:0)-bridgeView.strength.value)*(1-Math.exp(-14*dt));
}
function bridgeVisualMaterial(mat,wet=false){
 if(mat.userData.bridgeVisual)return;
 mat.userData.bridgeVisual=true;
 const old=mat.onBeforeCompile,keyFn=mat.customProgramCacheKey.bind(mat);
 mat.onBeforeCompile=(shader,r)=>{
  old.call(mat,shader,r);
  Object.assign(shader.uniforms,{boatFocus:bridgeView.focus,deckBounds:bridgeView.bounds,deckReveal:bridgeView.strength,dbGapA:DBU.a,dbGapB:DBU.b});
  if(!wet)shader.vertexShader='varying vec3 deckWorld;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n deckWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  const world=wet?'vW':'deckWorld';
  shader.fragmentShader=(wet?'':'varying vec3 deckWorld;\n')+'uniform vec3 boatFocus;uniform vec4 deckBounds;uniform float deckReveal;uniform vec4 dbGapA;uniform vec4 dbGapB;\n'+shader.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/,match=>match+(wet?'':`
    {vec3 q=deckWorld;if(q.y>-1.33&&q.y<1.75&&((q.x>dbGapA.x&&q.x<dbGapA.z&&q.z>dbGapA.y&&q.z<dbGapA.w)||(q.x>dbGapB.x&&q.x<dbGapB.z&&q.z>dbGapB.y&&q.z<dbGapB.w)))discard;}`)+`
    if(deckReveal>.002){
     vec3 p=${world};
     if(all(greaterThanEqual(p.xz,deckBounds.xy-.12))&&all(lessThanEqual(p.xz,deckBounds.zw+.12))&&p.y>=-1.31){
      vec3 ray=normalize(cameraPosition-boatFocus),v=p-boatFocus;
      float d=dot(v,ray),radius=length(v-ray*d);
      float cut=deckReveal*(1.-smoothstep(3.4,5.,radius))*step(.05,d);
      if(fract(dot(mod(floor(gl_FragCoord.xy),4.),vec2(.3125,.1875)))<.95*cut)discard;
     }
    }`);
 };mat.customProgramCacheKey=()=>keyFn()+'|boatBridge';mat.needsUpdate=true;
}
function isoFadeTick(dt){
 bridgeViewTick(dt);updateRoomCutaway(dt);
 /* v78: na VISTA DE CIMA (sem órbita) só o prédio-túnel do Neon Road some; na giratória, todos como antes */
 const orbitOn=camMode==='top'&&VIEW.orbit&&!PL.inside&&!TVM.on,on=orbitOn||(camMode==='top'&&!VIEW.orbit&&!PL.inside&&!TVM.on&&!PHOTO.on&&ISOFADE.nrN>0); /* modo foto: túnel nunca some */ISOFADE.enabled.value=on?1:0;isoFadeSetCompile(on);
 if(!on){if(ISOFADE.active.size){for(const b of ISOFADE.active){b.a=b.want=1;if(b.nrMeshes)for(const m of b.nrMeshes)m.visible=true;ISOFADE.data.fill(255,b.id*4,b.id*4+4)}ISOFADE.active.clear();ISOFADE.tex.needsUpdate=true}ISOFADE.scan=0;return}
 ISOFADE.scan-=dt;if(ISOFADE.scan<=0){ISOFADE.scan=.08;for(const b of ISOFADE.active)b.want=1;
  const p=PL.car||PL,y=(p.gy||0)+(p.airY||0)+(p.rampY||0)+(PL.car?1.1:1.3)+(PL.car?0:PL.jy||0),r=PL.car?Math.min(1.4,p.t.W*.5):.5;
  for(let i=1;i<ISOFADE.items.length;i++){const b=ISOFADE.items[i];if(!orbitOn&&!b.nrTunnel)continue;if(isoRayBox(camera.position,{x:p.x,y,z:p.z},b,r)){b.want=.18;ISOFADE.active.add(b)}}
 }
 let changed=false;for(const b of ISOFADE.active){b.a+=(b.want-b.a)*(1-Math.exp(-dt*10));if(Math.abs(b.want-b.a)<.004)b.a=b.want;const v=Math.round(b.a*255),i=b.id*4;if(ISOFADE.data[i]!==v){ISOFADE.data.fill(v,i,i+4);changed=true}if(b.nrMeshes){const vis=b.a>.55;for(const m of b.nrMeshes)if(m.visible!==vis)m.visible=vis}if(b.a===1&&b.want===1)ISOFADE.active.delete(b)}if(changed)ISOFADE.tex.needsUpdate=true;
}
function isoTouchDrive(c,x,y,yaw){
 const magnitude=Math.min(1,Math.hypot(x,y)),speed=c.fwd||0;
 if(magnitude<.16)return{thr:speed>.8?-.65:0,steer:0,hand:speed<-.6};
 const cy=Math.cos(yaw),sy=Math.sin(yaw),dx=cy*x+sy*y,dz=-sy*x+cy*y,heading=Math.atan2(dz,dx),error=Math.atan2(Math.sin(heading-c.a),Math.cos(heading-c.a));
 const intensity=(magnitude-.16)/.84,target=(3+20*intensity)*(.22+.78*Math.max(0,Math.cos(error)));
 return{thr:clamp((target-speed)*.45,-1,1),steer:clamp(error*1.6-(c.w||0)*.4,-1,1),hand:false};
}
// v77: peças da praia reaproveitadas fora dela (piscina do motel etc.)
const BEACH_UMB_COLS=['#e04a3a','#2a8ad6','#f2c21a','#3ab36a','#ff6fae','#ffffff'];
function beachUmbrella(mb,x,gy,z,col){mb.geo(GEO.cyl,mtx(x,1.3+gy,z,.06,2.3,.06),col||COL('#e8e8e8'));mb.geo(GEO.cone,mtx(x,2.6+gy,z,1.7,.55,1.7),col)}
function beachUmbrellaPole(mb,x,gy,z){mb.geo(GEO.cyl,mtx(x,1.3+gy,z,.06,2.3,.06),COL('#e8e8e8'))}
function beachLounger(mb,x,z,base,ns,tc,flip){const metal=COL('#ddd8cd'),f=flip||1;
 const Q=(du,dv,y,w,d,h,col)=>{dv*=f;const cx=x+(ns?du:dv),cz=z+(ns?dv:du);mb.box(cx-(ns?w:d)/2,base+y,cz-(ns?d:w)/2,cx+(ns?w:d)/2,base+y+h,cz+(ns?d:w)/2,col)};
 Q(0,0,.46,.72,1.9,.09,tc);Q(0,-.8,.5,.72,.18,.43,tc);
 for(const du of [-.29,.29])for(const dv of [-.63,.63])Q(du,dv,0,.055,.055,.48,metal)}
/* v78: texto que encolhe até caber na largura */
/* v78: placas pintadas que acendem ao anoitecer (emissiveMap = a própria arte) */
const DN_SIGNS=new Set();
function dnSignMat(t,k=.5,basic){const m=new THREE.MeshLambertMaterial({map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:0});m.userData.dnK=k;DN_SIGNS.add(m);fxGlowPatch(m,.6);return m}
