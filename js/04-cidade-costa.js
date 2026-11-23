'use strict';
/* Coastal Chaos · js/04-cidade-costa.js — Cidade em chunks, costa/praia/fundo do mar.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= CITY (streamed in chunks) ================= */
const CS=2,BUILD_R=480,SHORE=RW/2+41,RY=-3;
// v243: visual range slider. CS stays 2 blocks (each chunk = 152m). Never dispose chunks.
// 0 = near corner; 1 = ~1 chunk; 50 = ~2; 100 = ~3, measured to closest chunk edge.
function drawDistanceMeters(){const v=clamp(Number.isFinite(S.drawDistance)?S.drawDistance:50,0,200),size=CS*P;
 return v===0?32:v<50?size*(1+(v-1)/49):size*(2+(v-50)/50);
}
const DRAW_FOG_BASE={near:160,far:600};
function captureDrawFogBase(){if(scene.fog){DRAW_FOG_BASE.near=scene.fog.near;DRAW_FOG_BASE.far=scene.fog.far}}
function applyDrawFog(){if(!scene.fog)return;
 const far=(S.drawDistance>100)?drawDistanceMeters():Math.min(DRAW_FOG_BASE.far,drawDistanceMeters());
 scene.fog.far=Math.max(24,far);
 scene.fog.near=Math.min(DRAW_FOG_BASE.near,Math.max(2,scene.fog.far*.72));
}
function drawDistanceUI(){const d=$('#drawDistance'),o=$('#drawDistanceOut');if(!d||!o)return;
 const v=clamp(S.drawDistance??50,0,200);d.value=String(v);
 o.textContent=v===0?'0 · esquina':v===1?'1 · 1 chunk':v===50?'50 · 2 chunks':v===200?'200 · 5 chunks':v===100?'100 · 3 chunks':v+' · '+(drawDistanceMeters()/(CS*P)).toFixed(2)+' chunks';
}
// v253: 0 = perto (0.7x); 50 = 2x; 100 = 4x. Evita dither numa quadra vizinha.
// DRAW DISTANCE limita a distancia FINAL e pode recortar antes destas faixas.
function objectDistanceFactor(){const v=clamp(S.objectDistance??50,0,100);return v<=50?.7+v/50*1.3:2+(v-50)/50*2}
function objectDistanceUI(){const el=$('#objectDistance'),out=$('#objectDistanceOut');if(!el||!out)return;const v=clamp(S.objectDistance??50,0,100);el.value=String(v);out.textContent=v+' · '+(v===50?'padrão':objectDistanceFactor().toFixed(2)+'× LOD')}
// v259: SHADOW DISTANCE is independent of OBJECT DISTANCE and its dither thresholds.
// d is measured to the closest edge of a 2x2 chunk, not the center.
function shadowDistanceMeters(){
 const v=clamp(S.shadowDistance??50,0,100);
 if(MOB_LITE)return v<=50?16+v/50*44:60+(v-50)/50*100;
 return v<=50?30+v/50*95:125+(v-50)/50*175;
}
function shadowDistanceUI(){
 const el=$('#shadowDistance'),out=$('#shadowDistanceOut');if(!el||!out)return;
 const v=clamp(S.shadowDistance??50,0,100);el.value=String(v);
 out.textContent=v+' · '+Math.round(shadowDistanceMeters())+' m'+(v===50?' · padrão':'');
}
function detailedShadowsUI(){
 const el=$('#optDetailedShadows');if(!el)return;
 el.checked=S.detailedShadows===true;el.disabled=!S.shadows;
 const ep=$('#optPoleShadows');if(ep){ep.checked=S.poleShadows!==false;ep.disabled=!S.shadows}
}


const city={group:null,N:14,ext:0,mats:[],rects:[],info:[],segOff:new Set(),chunks:new Map(),M:null,deg:[],ring:[],coast:-1,picked:new Set(),taken:new Set(),st:null};
let curChunk=null;
/* v3 r5: chaves 'h3,5'/'v3,5' guardadas (o texto é igual, então o Set responde igual) — antes era string nova a cada consulta de chão/trânsito */
const SEGK=new Map();
function segStr(h,a,b){if((a|0)!==a||(b|0)!==b||a<-500||a>500||b<-500||b>500)return(h?'h':'v')+a+','+b;const n=((a+512)*1024+(b+512))*2+(h?1:0);let s=SEGK.get(n);if(s===undefined){s=(h?'h':'v')+a+','+b;SEGK.set(n,s)}return s}
/* city.lines['H'+k] sem montar a chave (undefined se não houver) */
function lineHV(h,k){const L=city.lines;if(!L)return undefined;if(LINE_C.src!==L){LINE_C.src=L;LINE_C.H.length=0;LINE_C.V.length=0}const arr=h?LINE_C.H:LINE_C.V;let v=arr[k];if(v===undefined){v=L[(h?'H':'V')+k];if(v&&k>=0&&k<4096&&(k|0)===k)arr[k]=v}return v}
function segKey(kx,kz,d){return d===0?segStr(1,kx,kz):d===2?segStr(1,kx-1,kz):d===1?segStr(0,kx,kz):segStr(0,kx,kz-1)}
function segExists(kx,kz,d){const N=city.N,bx=kx+D[d][0],bz=kz+D[d][1];if(kx<0||kz<0||kx>N||kz>N||bx<0||bz<0||bx>N||bz>N)return false;return!city.segOff.has(segKey(kx,kz,d))}
function lineType(kx,kz,d){const I=city.isle;if(I){const q=I.bridge;if(q[0]==='h'?(d%2===0&&kz===q[2]&&(d===0?kx===q[1]:kx===q[1]+1)):(d%2===1&&kx===q[1]&&(d===1?kz===q[2]:kz===q[2]+1)))return ISLE_TWO}const L=city.lines;if(!L)return LINE_AVE;if(LINE_C.src!==L){LINE_C.src=L;LINE_C.H.length=0;LINE_C.V.length=0}const h=d%2===0,arr=h?LINE_C.H:LINE_C.V,k=h?kz:kx;let v=arr[k];if(v===undefined){v=L[(h?'H':'V')+k];if(!v)return LINE_AVE;if(k>=0&&k<4096&&(k|0)===k)arr[k]=v}return v}
/* v3 r5: lineType sem montar a chave 'H'+kz a cada chamada (era string nova por carro por quadro) */
const LINE_AVE={t:'ave'},LINE_C={src:null,H:[],V:[]};
const ISLE_TWO={t:'two'};
function laneValid(kx,kz,d,li){const L=lineType(kx,kz,d);if(L.t==='ave')return true;if(L.t==='two')return li===0;return d===L.dir}
function laneOff(kx,kz,d,li){return lineType(kx,kz,d).t==='one'?(li?-1.9:1.9):LANES[li]}
function canDrive(kx,kz,d){if(!segExists(kx,kz,d)||(OBRA.key&&obraClosed(kx,kz,d)))return false;const L=lineType(kx,kz,d);return L.t!=='one'||L.dir===d}
function bestLane(kx,kz,d,lat){let b=0,bd=1e9;for(const li of [0,1]){if(!laneValid(kx,kz,d,li))continue;const e=Math.abs(lat-laneOff(kx,kz,d,li));if(e<bd){bd=e;b=li}}return b}
function nodeDeg(kx,kz){let n=0;for(let d=0;d<4;d++)if(segExists(kx,kz,d))n++;return n}
// Point Haze: praia nos 4 lados. u = distância para fora do quadrado das ruas (cantos arredondados) e,
// já na areia, uma ondulação por ângulo deixa a linha d'água irregular (calma perto do píer).
function hazeU(x,z){const E=city.ext,o=RW/2,dx=Math.max(-x,x-E),dz=Math.max(-z,z-E);const u=dx>o&&dz>o?o+Math.hypot(dx-o,dz-o):Math.max(dx,dz);if(u<=SAND0)return u;
 const a=Math.atan2(z-E/2,x-E/2),ph=city.hazePh||[0,0,0],w=6*Math.sin(a*3+ph[0])+3.5*Math.sin(a*7+ph[1])+2*Math.sin(a*13+ph[2]);
 const k=city.hazeCalm?clamp((Math.hypot(x-city.hazeCalm[0],z-city.hazeCalm[1])-25)/45,0,1):1;return u-w*k*clamp((u-SAND0)/22,0,1)}
// Ponto na direção a (a partir do centro da ilha) onde u atinge o valor pedido.
function hazeRay(a,u){const E=city.ext,cx=E/2,dx=Math.cos(a),dz=Math.sin(a);let lo=0,hi=E+u+80;for(let i=0;i<36;i++){const m=(lo+hi)/2;if(hazeU(cx+dx*m,cx+dz*m)<u)lo=m;else hi=m}const r=(lo+hi)/2;return[cx+dx*r,cx+dz*r]}
function outDist(x,z){if(city.haze)return hazeU(x,z);const E=city.ext,c=city.coast,u=c===0?-z:c===1?z-E:c===2?-x:c===3?x-E:-1e9;return u>SAND_FLAT?coastUe(c<2?x:z,u):u}
/* v3 r35 · COASTW: linha d'água da praia irregular (Sunset Shores, Synthwave, Invertido; Point Haze continua com o hazeU).
   coastW(t) = quanto a areia avança (+) ou recua (−) no ponto t da costa: senos longos com fase da seed, um "portão" lento que
   deixa trechos retos, pontas até COASTW.out m e recuos até COASTW.in m (~40% da praia fica reta). Zero perto das pontas da praia (curvas dos cantos e
   farol) e da foz. u "efetivo" = u − w·k(u), k sobe de 0 (SAND_FLAT) a 1 (SAND_FLAT+24): calçadão e faixa plana não mudam.
   outDist já devolve o u efetivo, então água, colisão, chão, jetski, barco, peds e parapente seguem a borda nova sozinhos;
   malhas montadas em (t,u) usam coastUr(t,u) para achar o u real de cada vértice. Gerador próprio (não mexe no R()). */
const COASTW={out:18,in:5,ramp:24};
function coastWInit(){const sp=city.coastSpan,sb=city.seaBranch;let c=city._cw;if(c&&c.seed===S.seed&&c.E===city.ext&&c.cs===city.coast&&c.sp===sp&&c.sb===sb)return c;
 const r=mulberry32((S.seed^0x0c0a57e5)>>>0),br=beachRange(),no=[];if(sb){const o=RW/2,m=mouthGeo();if(m)no.push([m.mid-(m.hw+m.A+m.pad),m.mid+(m.hw+m.A+m.pad)]);else no.push([sb.a*P+o-10,(sb.a+1)*P-o+10])}
 c={seed:S.seed,E:city.ext,cs:city.coast,sp,sb,lo:br[0],hi:br[1],no,ph:[r()*6.283,r()*6.283,r()*6.283,r()*6.283,r()*6.283]};city._cw=c;return c}
function coastW(t){if(city.haze||city.coast==null||!city.ext)return 0;const c=coastWInit();if(t<=c.lo+35||t>=c.hi-35)return 0;
 const p=c.ph,b=.5*Math.sin(t*.028+p[0])+.32*Math.sin(t*.061+p[1])+.18*Math.sin(t*.113+p[2]),g=_sstep(.18,.5,.5+.5*(.75*Math.sin(t*.011+p[3])+.25*Math.sin(t*.031+p[4])));
 let k=_sstep(c.lo+35,c.lo+75,t)*_sstep(c.hi-35,c.hi-75,t);for(const z of c.no){const d=t<z[0]?z[0]-t:t>z[1]?t-z[1]:0;k*=_sstep(10,45,d)}
 return(b>0?b*COASTW.out:b*COASTW.in)*g*k}
function coastUe(t,u){if(u<=SAND_FLAT)return u;const w=coastW(t);return w?u-w*Math.min(1,(u-SAND_FLAT)/COASTW.ramp):u}
function coastUr(t,ue){if(ue<=SAND_FLAT)return ue;const w=coastW(t);if(!w)return ue;const R=COASTW.ramp,u1=ue+w;return u1>=SAND_FLAT+R?u1:SAND_FLAT+(ue-SAND_FLAT)/(1-w/R)}
/* ---------- costa: nível do mar, perfil da praia e fundo ----------
   O mar fica no MESMO nível dos rios (RY). A areia desce em rampa suave do calçadão até a linha
   d'água (SHORE) e continua com a mesma inclinação por baixo da água até encontrar o fundo do mar.
   u = distância para fora da avenida da orla (outDist); t = posição ao longo da costa. */
const SEA_Y=RY,SAND0=RW/2+11,SAND_FLAT=RW/2+16.5;
/* v78 · POINT HAZE — chão único da ilha (antes: laje por quarteirão + estradas de terra = grade visível).
   hazeH(x,z) = relevo em metros acima de .2 (0 nas bordas, casa com a faixa de areia do hazeShore). */
function hzN(x,z){const h=(a,b)=>{let n=(Math.imul(a|0,73856093)^Math.imul(b|0,19349663)^(city.hzSeed|0))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return((n^(n>>>16))>>>0)/4294967296};
 const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return h(i,j)*(1-u)*(1-v)+h(i+1,j)*u*(1-v)+h(i,j+1)*(1-u)*v+h(i+1,j+1)*u*v}
const _hzC=new THREE.Color();
function hazeHInit(){const E=city.ext,r=city.safeRi>=0&&city.rects[city.safeRi],hr=mulberry32((city.hzSeed^0x9e3779b9)>>>0);
 const cx=r?(r[0]+r[2])/2:E/2,cz=r?(r[1]+r[3])/2:E/2,ci=Math.floor(hr()*4),m=26,cor=[[m,m],[E-m,m],[m,E-m],[E-m,E-m]][ci],hills=[];
 // 3 morros baixos longe do castelo e do paredão
 for(let k=0,t=0;k<3&&t<60;t++){const a=hr()*6.2832,d=62+hr()*30,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(x<20||z<20||x>E-20||z>E-20)continue;if(Math.hypot(x-cor[0],z-cor[1])<60)continue;if(hills.some(h=>Math.hypot(h[0]-x,h[1]-z)<45))continue;hills.push([x,z,3+hr()*3.5,18+hr()*10])}
 const T={cx,cz,Hc:4.5,cor,ci,hills,p1:hr()*6.28,p2:hr()*6.28};if(r)city.hzT=T;return T}
const _sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function hazeH(x,z){const T=city.hzT||hazeHInit(),u=hazeU(x,z),inl=RW/2-u;if(inl<=0)return 0;const t=_sstep(0,30,inl);
 // dunas suaves + morros
 let h=(.45*Math.sin(x*.075+T.p1)*Math.cos(z*.06+T.p2)+.55*hzN(x*.045,z*.045)-.1)*t;
 for(const[hx,hz,A,R] of T.hills){const d=Math.hypot(x-hx,z-hz)/R;if(d<1)h+=A*(1-d*d)*(1-d*d)*t}
 // paredão rochoso num canto: sobe rápido, borda áspera, cai em ~8 m até a areia
 {const d=Math.hypot(x-T.cor[0],z-T.cor[1]),k=_sstep(35,27,d+(hzN(x*.22,z*.22)-.5)*9);if(k>0)h=Math.max(h,(10+3*hzN(x*.12+3,z*.12)+1.2*hzN(x*.6,z*.6))*k*_sstep(0,7,inl))}
 // morro do castelo: platô plano (r<21) e rampa até r=44
 const dc=Math.hypot(x-T.cx,z-T.cz),pm=_sstep(44,21,dc);return Math.max(0,h*(1-pm)+T.Hc*pm)}
function hazeCliff(x,z){const T=city.hzT||hazeHInit();return _sstep(40,24,Math.hypot(x-T.cor[0],z-T.cor[1]))}
/* v79r2: tom único da terra da Haze = média do miolo da ilha (mesma fórmula do hazeTerrain sem rocha/encosta); borda do terreno e faixa de terra do hazeShore usam esse tom — sem a moldura mais escura/cinza */
function hazeBaseCol(){if(city.hzBase&&city.hzBaseK===city.hzSeed)return city.hzBase;const g=COL(city.st.grass),dry=COL('#8c7a50'),grn=COL('#6c7346'),c=new THREE.Color(),a=new THREE.Color(0,0,0),E=city.ext;let n=0;
 for(let i=0;i<16;i++)for(let j=0;j<16;j++){const x=E*(.3+.4*i/15),z=E*(.3+.4*j/15),n1=hzN(x*.035,z*.035),n2=hzN(x*.14+7,z*.14+3);c.copy(g).lerp(dry,clamp(n1*1.4-.45,0,1)*.35).lerp(grn,clamp((n2-.6)*2.5,0,1)*.25).multiplyScalar(.92+.08*n2);a.r+=c.r;a.g+=c.g;a.b+=c.b;n++}
 a.multiplyScalar(1/n);city.hzBase=a;city.hzBaseK=city.hzSeed;return a}
function hazeTerrain(){const E=city.ext,o=RW/2,stp=2,n=Math.ceil((E+2*o)/stp),x0=-o,N1=n+1,pos=new Float32Array(N1*N1*3),col=new Float32Array(N1*N1*3),uvs=new Float32Array(N1*N1*2),idx=[];
 const g=COL(city.st.grass),dry=COL('#8c7a50'),grn=COL('#6c7346'),sand=COL('#b3a066'),rock=COL('#6e6a62'),c=new THREE.Color(),H=(x,z)=>.2+hazeH(x,z);
 for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=Math.min(E+o,x0+i*stp),z=Math.min(E+o,x0+j*stp),y=H(x,z),k=(j*N1+i)*3;pos[k]=x;pos[k+1]=y;pos[k+2]=z;uvs[(j*N1+i)*2]=x/7;uvs[(j*N1+i)*2+1]=z/7;
  const sl=Math.hypot(H(x+1,z)-H(x-1,z),H(x,z+1)-H(x,z-1))/2,n1=hzN(x*.035,z*.035),n2=hzN(x*.14+7,z*.14+3);
  c.copy(g).lerp(dry,clamp(n1*1.4-.45,0,1)*.35).lerp(grn,clamp((n2-.6)*2.5,0,1)*.25).multiplyScalar(.92+.08*n2);
  const ed=clamp((hazeU(x,z)+12)/12,0,1);c.lerp(hazeBaseCol(),ed); /* borda = mesma cor da faixa de terra do hazeShore (v79r2: tom do miolo da ilha) */c.lerp(rock,Math.max(clamp((sl-.35)*2,0,1),hazeCliff(x,z)*.3));col[k]=c.r;col[k+1]=c.g;col[k+2]=c.b}
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=j*N1+i,b=a+1,d=a+N1,e=d+1;idx.push(a,d,b,b,d,e)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();
 const mat=surfPatch(new THREE.MeshStandardMaterial({map:worldSandTex(),vertexColors:true,roughness:1,metalness:0}),'sand'); /* v3 r33 SURF · v79r2: mesma textura/rugosidade da faixa do hazeShore — antes o miolo liso e a borda texturizada davam 2 tons com quina reta */city.mats.push(mat);const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.name='hazeTerrain';city.group.add(m);city.hazeTerrainMesh=m;return m}

// Altura da superfície da areia. Plana na faixa das barracas, curva suave no começo da descida e
// rampa constante (~9°) até a água; além de SHORE segue submersa com a mesma inclinação.
function beachProfile(u){if(u<=SAND_FLAT)return .17;const k=(u-SAND_FLAT)/(SHORE-SAND_FLAT),k0=.3,f=k<k0?k*k/(2*k0):(k-k0/2)/(1-k0/2);return .17-(.17-SEA_Y)*f}
// Fundo do mar: continua a areia submersa e afunda até ~4,5 m abaixo da superfície.
/* v3 r31 · TALUDE: depois da linha d'água a areia segue descendo devagar (plataforma de SEABED.shelf m, ~5,5 cm/m), faz a curva e despenca
   (smootherstep de SEABED.slope m) até o fundo plano em SEABED.floor (4× o fundo antigo: −18,6 m abaixo do mar contra −4,65). */
const SEABED={shelf:33,slope:30,lin:.055,floor:SEA_Y-18.6};
function seabedY(u){const u0=SHORE+2,y0=beachProfile(u0);if(u<=u0)return beachProfile(u);const S=SEABED,a=u-u0,end=S.shelf+S.slope,lin=y0-S.lin*Math.min(a,end),q=clamp((a-S.shelf)/S.slope,0,1);
 return lin-(y0-S.lin*end-S.floor)*q*q*q*(q*(q*6-15)+10)}
/* borda do talude ondulada ao longo da costa (só da plataforma para fora): a malha do fundo e a saia do farol usam esta */
function seabedYt(t,u){const u0=SHORE+2;if(u<=u0)return seabedY(u);const w=7*Math.sin(t*.011+1.3)+3.5*Math.sin(t*.041),k=clamp((u-u0)/12,0,1);return seabedY(u-w*k)}
// Topo do terreno junto à praia (usado nas margens da foz): calçadão/grama planos, depois o perfil da areia.
function coastTop(u){return u<SAND0?.17:beachProfile(u)}
function coastSpanFor(E){if(city.haze)return null;const br=mulberry32((S.seed^0x2545f491)>>>0);return br()<.5?null:(br()<.5?[-1e9,E/2]:[E/2,1e9])}
// Trecho da costa (em t) que é praia de areia.
function beachRange(){const E=city.ext,o=RW/2,sp=city.coastSpan;return[sp?Math.max(-o-SW,sp[0]):-o-SW,sp?Math.min(E+o+SW,sp[1]):E+o+SW]}
// Retângulo em coordenadas de costa (t,u) -> retângulo xz [x0,z0,x1,z1].
function tuRect(t0,t1,u0,u1){const a=wTU(city.coast,t0,u0),b=wTU(city.coast,t1,u1);return[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]}
// Altura do chão sobre a areia (null fora da praia). +.03 = mesma folga que o resto do jogo usa sobre a areia.
function coastGround(x,z){if(city.coast===undefined||!city.ext)return null;const u=outDist(x,z);if(u<=SAND0)return null;
 if(city.lh&&lhLand(x,z))return .2;if(city.haze)return beachProfile(u)+.03;const t=city.coast<2?x:z,r=beachRange();if(t<r[0]||t>r[1])return null;return beachProfile(u)+.03}
// Areia molhada: escurece perto da linha d'água.
function wetSand(col,u){const w=clamp((u-(SHORE-3))/3,0,1);return w>0?col.clone().multiplyScalar(1-.28*w):col}
/* v3 r27 · FOZ EM CORNETA. Antes: canal reto (60 m) e margens retas de 10 m até o mar. Agora o canal continua reto sob a ponte e no
   calçadão, e da areia (SAND0) até a linha d'água (SHORE) cada margem abre numa curva assintótica:
     f(k) = A·(1/(1−c·k) − 1 − c·k)/N,  k = (u−SAND0)/(SHORE−SAND0),  N = f sem A em k=1
   (começa tangente ao canal reto e abre cada vez mais rápido, quase paralela à praia no mar). O chão da foz = praia "escavada": rampa de
   inclinação fixa MOUTH.sl a partir da borda d'água (s = distância até a borda ≈ F/√(1+f'²)), unida ao perfil da praia por mínimo suave
   (MOUTH.k → quinas arredondadas) e limitada pelo leito. mouthY serve a física (estuaryAt/groundY/inWater) e a malha (mouthMesh). */
const MOUTH={A:30,c:.7,sl:.35,k:.75,pad:16};
function mouthGeo(){const sb=city.seaBranch;if(!sb)return null;let m=city._mouth;if(m&&m.sb===sb&&m.c===city.coast&&m.sp===city.coastSpan)return m;const o=RW/2,a=sb.a*P+o,b=(sb.a+1)*P-o,br=beachRange();
 const beach=a-10-MOUTH.A-MOUTH.pad>=br[0]&&b+10+MOUTH.A+MOUTH.pad<=br[1]; /* foz fora da areia (meia praia): fica o canal reto antigo */
 return city._mouth={sb,c:city.coast,sp:city.coastSpan,a,b,mid:(a+b)/2,hw:(b-a)/2,u0:SAND0,u1:SHORE,N:1/(1-MOUTH.c)-1-MOUTH.c,beach,A:beach?MOUTH.A:0,pad:beach?MOUTH.pad:10}}
function mouthF(m,u){const k=clamp((u-m.u0)/(m.u1-m.u0),0,1),c=MOUTH.c;return m.A*(1/(1-c*k)-1-c*k)/m.N}
function mouthFd(m,u){const k=(u-m.u0)/(m.u1-m.u0);if(k<=0||k>=1)return 0;const c=MOUTH.c;return m.A*(c/((1-c*k)*(1-c*k))-c)/m.N/(m.u1-m.u0)}
/* v3 r32 · rios 2x mais fundos: fundo raso junto ao muro (1,5 m) e fundo no meio (2,9 m = 2x o antigo 1,45). A profundidade segue a distância
   até a margem (grade de 2 m sobre os retângulos de água + pontes, chamfer), então rio largo = mais fundo no meio; rio estreito fica mais raso. */
const RIVBED={min:1.5,max:2.9,span:18,cell:2};
function riverDistGrid(){if(city._rdg&&city._rdg.w===city.water)return city._rdg;const C=RIVBED.cell,E=city.ext||0,rs=[];
 for(const r of city.water||[]){if(r.cutOnly)continue;const q=[r[0],r[1],r[2],r[3]];if(r.estuary){if(q[0]<=0)q[0]-=80;if(q[1]<=0)q[1]-=80;if(q[2]>=E)q[2]+=80;if(q[3]>=E)q[3]+=80}rs.push(q)}
 for(const r of city.decks||[])if(waterAt((r[0]+r[2])/2,(r[1]+r[3])/2))rs.push(r);
 if(!rs.length)return city._rdg={w:city.water,none:true};let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const r of rs){x0=Math.min(x0,r[0]);z0=Math.min(z0,r[1]);x1=Math.max(x1,r[2]);z1=Math.max(z1,r[3])}
 x0-=4;z0-=4;x1+=4;z1+=4;const nx=Math.ceil((x1-x0)/C)+1,nz=Math.ceil((z1-z0)/C)+1,d=new Float32Array(nx*nz);
 for(const r of rs){const i0=Math.max(0,Math.ceil((r[0]-x0)/C-.5)),i1=Math.min(nx-1,Math.floor((r[2]-x0)/C-.5)),j0=Math.max(0,Math.ceil((r[1]-z0)/C-.5)),j1=Math.min(nz-1,Math.floor((r[3]-z0)/C-.5));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)d[j*nx+i]=1e6}
 const D=1.4142;for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i;if(!d[k])continue;let v=d[k];if(i>0)v=Math.min(v,d[k-1]+1);if(j>0){v=Math.min(v,d[k-nx]+1);if(i>0)v=Math.min(v,d[k-nx-1]+D);if(i<nx-1)v=Math.min(v,d[k-nx+1]+D)}d[k]=v}
 for(let j=nz-1;j>=0;j--)for(let i=nx-1;i>=0;i--){const k=j*nx+i;if(!d[k])continue;let v=d[k];if(i<nx-1)v=Math.min(v,d[k+1]+1);if(j<nz-1){v=Math.min(v,d[k+nx]+1);if(i<nx-1)v=Math.min(v,d[k+nx+1]+D);if(i>0)v=Math.min(v,d[k+nx-1]+D)}d[k]=v}
 return city._rdg={w:city.water,x0,z0,nx,nz,d}}
function riverBedY(x,z){const G=riverDistGrid(),B=RIVBED;if(G.none)return RY-B.min;const C=B.cell,fx=(x-G.x0)/C-.5,fz=(z-G.z0)/C-.5;
 const i=clamp(Math.floor(fx),0,G.nx-2),j=clamp(Math.floor(fz),0,G.nz-2),ax=clamp(fx-i,0,1),az=clamp(fz-j,0,1),k=j*G.nx+i,dd=G.d;
 const dc=((dd[k]*(1-ax)+dd[k+1]*ax)*(1-az)+(dd[k+G.nx]*(1-ax)+dd[k+G.nx+1]*ax)*az)*C-C*.5,q=clamp(dc/B.span,0,1);return RY-(B.min+(B.max-B.min)*q*q*(3-2*q))}
function riverBedCol(y,night){const f=clamp((RY-RIVBED.min-y)/(RIVBED.max-RIVBED.min),0,1);
 return f<.5?COL(night?'#5a5a7a':'#d8d4c8').lerp(COL(night?'#3a3c5e':'#8a968c'),f*2):COL(night?'#3a3c5e':'#8a968c').lerp(COL(night?'#1c1e3a':'#3e5458'),(f-.5)*2)}
function mouthBed(u){const o=RW/2,u1=SHORE+2,b=RY-RIVBED.max;return b+(seabedY(u1)-b)*clamp((u+o)/(u1+o),0,1)}
function sminK(a,b,k){if(k<=0)return Math.min(a,b);const h=clamp(.5+.5*(b-a)/k,0,1);return b+(a-b)*h-k*h*(1-h)}
/* altura do chão da foz em (t,u); null = fora da influência (chão normal da praia/calçadão) */
function mouthY(m,t,u){const dt=Math.abs(t-m.mid),fd=mouthFd(m,u),F=dt-m.hw-mouthF(m,u);
 if((u<m.u0||!m.beach)&&dt>m.hw+10)return null;
 const s=F/Math.sqrt(1+fd*fd),top=coastTop(u)+.03,cut=SEA_Y-.35+MOUTH.sl*s,k=u<m.u0||!m.beach?.04:.04+MOUTH.k*clamp((u-m.u0)/5,0,1);
 if(cut>=top+k)return null;return Math.max(mouthBed(u),sminK(top,cut,k))}
function mouthChannel(x,z,margin=0){const m=mouthGeo();if(!m)return false;const u=outDist(x,z);if(u<-RW/2-2||u>SHORE+3)return false;const t=city.coast<2?x:z;return Math.abs(t-m.mid)<=m.hw+mouthF(m,u)-margin}
function mouthPierBlocked(x,z){const m=mouthGeo();if(!m)return false;const u=outDist(x,z),t=city.coast<2?x:z,w=m.hw+Math.max(24,m.A+8);return u>=-P&&u<=SHORE+60&&Math.abs(t-m.mid)<=w}
/* área de influência da foz no chão (para objetos de praia): true = chão rebaixado/água */
function mouthZone(x,z,pad=0){const m=mouthGeo();if(!m)return false;const u=outDist(x,z);if(u<RW/2||u>SHORE+3)return false;const t=city.coast<2?x:z;if(Math.abs(t-m.mid)>m.hw+m.A+m.pad+pad)return false;
 if(pad<=0)return mouthY(m,t,u)!==null;for(const[dt,du] of [[0,0],[pad,0],[-pad,0],[0,pad],[0,-pad]])if(mouthY(m,t+dt,u+du)!==null)return true;return false}
function pedRiverWall(p,x,z){if(p.corpse||p.state==='dead'||p.state==='down'||!inWater(p.x,p.z)||outDist(p.x,p.z)>SHORE)return;if(!inWater(x,z)){p.x=x;p.z=z;p.dir=-(p.dir||1);p.vx=p.vz=0;return}for(let r=2;r<70;r+=3)for(let k=0;k<8;k++){const a=k*Math.PI/4,nx=p.x+Math.cos(a)*r,nz=p.z+Math.sin(a)*r;if(!inWater(nx,nz)&&!mouthChannel(nx,nz,-10)){p.x=nx;p.z=nz;p.vx=p.vz=0;return}}}
// Foz: chão da corneta (mouthY). edge: 0 = fundo do canal, 1 = topo da margem (compatível com o antigo); wet = água (afoga/peds não entram);
// grad=true calcula também a direção da descida (dx,dz, unitária) e a inclinação (sl) — só o jogador usa (escorrega nas margens íngremes).
/* malha da foz (sandMb/bedMb do chunk de borda dono de cada coluna): grade em (t,u) que cobre a corneta inteira + a faixa de praia em volta
   (a praia normal é recortada em [mid±(hw+A+pad)]); colunas nos mesmos u da beachSand (emenda sem fresta); normais suaves pelo gradiente;
   célula toda abaixo d'água e funda → leito (bedMb, cor do leito antigo com poluição). */
function mouthMesh(sandMb,bedMb,s,ta,tb,night){const m=mouthGeo();if(!m||s!==city.coast)return;const o=RW/2,W=m.hw+m.A+m.pad,t0=m.mid-W,t1=m.mid+W;
 const sp=[t0,t1,m.a-10,m.a,m.b,m.b+10,m.mid],ts=sp.slice();for(let t=t0;t<t1;t+=.75)if(sp.every(q=>Math.abs(q-t)>.2))ts.push(t);ts.sort((x,y)=>x-y);
 const beachUs=[SAND0,SAND_FLAT];for(let u=SAND_FLAT+.75;u<SHORE+2;u+=.75)beachUs.push(u);beachUs.push(SHORE+2); /* passo 0,75 (metade do da beachSand: a emenda cai nos mesmos u) — linha d'água sem serrilhado */
 const bankUs=[o-.3];for(let u=o+2;u<SAND0-.01;u+=2)bankUs.push(u);
 const H=(t,u)=>{const y=mouthY(m,t,u);return(y===null?coastTop(u)+.03:y)-.03},P3=(t,u)=>{const q=wTU(s,t,u);return[q[0],H(t,u),q[1]]};
 const sand=COL(night?'#5a4a62':'#e3cf9a').multiplyScalar(1.12),bedA=COL(night?'#5a5a7a':'#d8d4c8'),bedB=COL(night?'#6a6488':'#ffffff'),bedP=COL(night?'#2a2018':'#5a4630'),c=s;
 const nrm=(mb,st)=>{for(let k=st;k<mb.p.length;k+=3){const x=mb.p[k],z=mb.p[k+2],t=c<2?x:z,u=outDist(x,z),h=.35,gt=(H(t+h,u)-H(t-h,u))/(2*h),gu=(H(t,u+h)-H(t,u-h))/(2*h);
   let nx,nz;if(c===0){nx=-gt;nz=gu}else if(c===1){nx=-gt;nz=-gu}else if(c===2){nx=gu;nz=-gt}else{nx=-gu;nz=-gt}const l=Math.hypot(nx,1,nz);mb.n[k]=nx/l;mb.n[k+1]=1/l;mb.n[k+2]=nz/l;
   const q=k/3;mb.u[q*2]=x/(mb===bedMb?8:9);mb.u[q*2+1]=z/(mb===bedMb?8:9)}};
 for(let i=0;i<ts.length-1;i++){const ta0=ts[i],ta1=ts[i+1],tc=(ta0+ta1)/2;if(tc<ta||tc>=tb)continue;const inner=tc>m.a-10&&tc<m.b+10,us=inner?bankUs.concat(beachUs):beachUs;
  for(let j=0;j<us.length-1;j++){const u=us[j],v=us[j+1],A=P3(ta0,u),B=P3(ta1,u),C=P3(ta1,v),D=P3(ta0,v),ymax=Math.max(A[1],B[1],C[1],D[1]),uc=(u+v)/2,ref=wTU(s,tc,uc);
   if(ymax<SEA_Y-.05&&Math.abs(tc-m.mid)<m.hw+mouthF(m,uc)){const w=wTU(s,tc,uc),inl=wTU(s,tc,-o),pv=Math.max(pollAt(w[0],w[1]),pollAt(inl[0],inl[1])*(1-.35*clamp((uc-o)/(SHORE-o),0,1)));
    const col=bedA.clone().lerp(bedB,clamp((uc+o)/(SHORE+2+o),0,1)).lerp(bedP,clamp(pv*1.4,0,1)),st=bedMb.p.length;bedMb.qa(A,B,C,D,col,[ref[0],-20,ref[1]]);nrm(bedMb,st);continue}
   const yc=(A[1]+B[1]+C[1]+D[1])/4,wt=Math.max(clamp((uc-(SHORE-3))/3,0,1),clamp(1-(yc-SEA_Y)/.6,0,1)),st=sandMb.p.length;
   sandMb.qa(A,B,C,D,sand.clone().multiplyScalar(1-.28*wt),[ref[0],-20,ref[1]]);nrm(sandMb,st)}}}
/* linha d'água da corneta (para a espuma): pontos (t,u) onde o chão cruza o nível do mar, de cada lado */
function mouthShoreline(side){const m=mouthGeo();if(!m||!m.beach)return[];const out=[];
 for(let u=m.u0;u<=SHORE-.2;u+=.75){let lo=m.mid+side*(m.hw*.5),hi=m.mid+side*(m.hw+m.A+m.pad);const wet=t=>{const y=mouthY(m,t,u);return y!==null&&y<SEA_Y};if(!wet(lo)||wet(hi))continue;
  for(let k=0;k<24;k++){const md=(lo+hi)/2;if(wet(md))lo=md;else hi=md}out.push([(lo+hi)/2,u])}return out}
function estuaryAt(x,z,grad){const m=mouthGeo();if(!m)return null;const u=outDist(x,z);if(u<RW/2||u>SHORE)return null;const t=city.coast<2?x:z;if(Math.abs(t-m.mid)>m.hw+m.A+m.pad)return null;
 const y=mouthY(m,t,u);if(y===null)return null;const bot=SEA_Y-.35,top=coastTop(u)+.03,r={edge:clamp((y-bot)/Math.max(.05,top-bot),0,1),y:SEA_Y,ground:y,wet:y<SEA_Y-.05,dx:0,dz:0,sl:0,bank:top-bot};
 if(grad){const h=.4,f=(tt,uu)=>{const q=mouthY(m,tt,uu);return q===null?coastTop(uu)+.03:q},gt=(f(t+h,u)-f(t-h,u))/(2*h),gu=(f(t,u+h)-f(t,u-h))/(2*h),l=Math.hypot(gt,gu);
  if(l>1e-4){r.sl=l;const dt=-gt/l,du=-gu/l,c=city.coast;/* (t,u) → (x,z): wTU */r.dx=c<2?dt:(c===2?-du:du);r.dz=c<2?(c===0?-du:du):dt}}
 return r}
function inWater(x,z){if(SHIPS.list.length&&shipAt(x,z))return false;if(city.dbs&&city.dbs.length&&dbHole(x,z))return true;const est=estuaryAt(x,z);if(est)return est.wet;if(city.piers&&city.piers.length&&pierY(x,z)!==null)return false;if(city.lh&&lhLand(x,z))return false;return outDist(x,z)>SHORE+.4||(city.riv&&city.riv.size>0&&waterAt(x,z))}
function isRiv(i,j){const N=city.N;if(city.flowX){if(j<0||j>=N)return false;i=i<0?0:i>=N?N-1:i}else{if(i<0||i>=N)return false;j=j<0?0:j>=N?N-1:j}return city.riv.has(i*1000+j)}
function riverZone(x,z){if(!city.riv||!city.riv.size)return false;const o=RW/2,kx=Math.round(x/P),kz=Math.round(z/P),onV=Math.abs(x-kx*P)<=o,onH=Math.abs(z-kz*P)<=o;
 if(!onV&&!onH)return isRiv(Math.floor(x/P),Math.floor(z/P));if(onV&&!onH){const j=Math.floor(z/P);return isRiv(kx-1,j)&&isRiv(kx,j)}
 if(onH&&!onV){const i=Math.floor(x/P);return isRiv(i,kz-1)&&isRiv(i,kz)}return isRiv(kx-1,kz-1)&&isRiv(kx,kz-1)&&isRiv(kx-1,kz)&&isRiv(kx,kz)}
function waterAt(x,z){const o=RW/2,kx=Math.round(x/P),kz=Math.round(z/P),onV=Math.abs(x-kx*P)<=o,onH=Math.abs(z-kz*P)<=o;
 if(!onV&&!onH)return isRiv(Math.floor(x/P),Math.floor(z/P));
 if(onV&&!onH){const j=Math.floor(z/P);return isRiv(kx-1,j)&&isRiv(kx,j)&&!segExists(kx,j,1)}
 if(onH&&!onV){const i=Math.floor(x/P);return isRiv(i,kz-1)&&isRiv(i,kz)&&!segExists(i,kz,0)}
 return isRiv(kx-1,kz-1)&&isRiv(kx,kz-1)&&isRiv(kx-1,kz)&&isRiv(kx,kz)&&nodeDeg(kx,kz)===0}
function inSpan(t){const s=city.coastSpan;return!s||(t>=s[0]&&t<=s[1])}
function onBeach(x,z){return inSpan(city.coast<2?x:z)}
const ZONE={dense:.2,bld:.38,houses:.6};
function zoneD(x,z){const c=city.core;if(!c)return 0;const E=city.ext,p=city.zph;return Math.hypot(x-c.x,z-c.z)/E+.055*Math.sin(x/E*5.3+p[0])*Math.cos(z/E*4.1+p[1])+.035*Math.sin((x+z)/E*9+p[2])}
function isRural(x,z){if(city.haze)return true;const edge=city.coast===0?z:city.coast===1?city.ext-z:city.coast===2?x:city.ext-x;if(edge<P+RW&&onBeach(x,z))return false;if(!city.core)return false;if(city.lms&&city.lms.some(l=>{if(l.rural)return false;const r=city.rects[l.ri];return x>=r[0]-RW&&x<=r[2]+RW&&z>=r[1]-RW&&z<=r[3]+RW}))return false;if(city.N===7)return city.info.some((f,i)=>{if(f.kind!=='rural')return false;const r=city.rects[i];return x>=r[0]-RW/2&&x<=r[2]+RW/2&&z>=r[1]-RW/2&&z<=r[3]+RW/2});return zoneD(x,z)>=ZONE.houses}
function pollAt(x,z){const p=city.poll;if(!p)return 0;const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),t=Math.atan2(dz,dx),h=p.ph;
 const r=p.R*(1+.22*Math.sin(3*t+h[0])+.14*Math.sin(5*t+h[1])+.08*Math.sin(9*t+h[2]))*(1+.06*Math.sin(x*.05+h[3])*Math.cos(z*.043));return 1-clamp((d-r*.55)/(r*.45),0,1)}
function waterCol(x,z,base,night){const p=pollAt(x,z);if(p<=0)return base;return base.clone().lerp(COL(night?'#4a3418':'#9a6e30'),p*.95)}
function indAt(x,z){const I=city.ind;if(!I)return 0;return clamp(1-(Math.hypot(x-I.x,z-I.z)-I.r)/140,0,1)}
const CR=3.5;
// Esquinas suaves. A malha original de calçadas é retangular (groundY0); aqui viramos curvas:
//  - cruzamento de duas ruas estreitas: o "dente" quadrado entre as faixas de calçada vira um quarto de disco (r 4,1);
//  - qualquer canto convexo de calçada com rua dos dois lados vira um arco de raio 3,5.
function cornerInfo(kx,kz,sx,sz){const key=kx*4096+kz*4+(sx>0?2:0)+(sz>0?1:0);let c=city.cc.get(key);if(c)return c;
 const G=(a,b)=>groundY0(kx*P+sx*a,kz*P+sz*b);const notch=G(6,6)===0&&G(6,10)===.2&&G(10,6)===.2&&G(6,2)===0&&G(2,6)===0;
 const g1=(a,b)=>notch&&a<=8&&b<=8&&Math.hypot(a-8,b-8)<4.1?.2:G(a,b);const conv=[],e=.15;
 for(const A of [3.9,8])for(const B of [3.9,8])if(g1(A+e,B+e)===.2&&g1(A-e,B+e)===0&&g1(A+e,B-e)===0&&g1(A-e,B-e)===0&&g1(A+CR+.3,B+e)===.2&&g1(A+e,B+CR+.3)===.2)conv.push([A,B]);
 c={notch,conv};city.cc.set(key,c);return c}
// Estacionamentos v230: mesmo nivel da rua (y=0). Busca espacial barata na fisica;
// fica desligada durante a geracao, para nao mudar o comportamento dos geradores.
function finishParkingRoads(){
 const cuts=city.parkingLots.flatMap(l=>l.access?.cut?[l.access.cut]:[]);
 // v77: o rebaixamento atravessa também a faixa extra de calçada das ruas estreitas em concreto,
 // em vez de deixar "dentes" de asfalto entre os trechos de calçada. Entradas da danceteria seguem asfalto.
 const fills=city.parkingLots.flatMap(l=>l.access?.cut&&l.tag!=='club-drive'?[l.access.cut]:[]);
 const NRm=city.neonRoad&&city.neonRoad.mouth?city.neonRoad.mouth.map((m,k)=>m?{m,k}:null).filter(Boolean):[];for(const q of NRm)cuts.push(q.m); /* v78: boca da Neon Road atravessa a calçada da rua estreita */
 for(const ch of city.chunks.values()){
  if(!ch.parkingRoadSlabs?.length)continue;
  const mb=new MB();
  for(const slab of ch.parkingRoadSlabs){let pieces=[slab.r];
   for(const [hx0,hz0,hx1,hz1] of cuts){const next=[];
    for(const [x0,z0,x1,z1] of pieces){const a=Math.max(x0,hx0),b=Math.max(z0,hz0),c=Math.min(x1,hx1),d=Math.min(z1,hz1);
     if(a>=c||b>=d){next.push([x0,z0,x1,z1]);continue}
     if(x0<a)next.push([x0,z0,a,z1]);if(c<x1)next.push([c,z0,x1,z1]);
     if(z0<b)next.push([a,z0,c,b]);if(d<z1)next.push([a,d,c,z1]);
    }pieces=next;
   }
   for(const [x0,z0,x1,z1] of pieces){let rs=null;const NR=city.neonRoad;
    for(const {m,k} of NRm){const ax=NR.ax,E=.05;if(ax==='z'){if(z1<=m[1]+E||z0>=m[3]-E)continue;const outerLow=k===0; /* u = z; ponta u0: guia da rua estreita do lado de z menor */
      if(Math.abs(x1-m[0])<E)rs=outerLow?[0,CR,0,0]:[CR,0,0,0];else if(Math.abs(x0-m[2])<E)rs=outerLow?[0,0,CR,0]:[0,0,0,CR]}
     else{if(x1<=m[0]+E||x0>=m[2]-E)continue;const outerLow=k===0;
      if(Math.abs(z1-m[1])<E)rs=outerLow?[0,0,0,CR]:[CR,0,0,0];else if(Math.abs(z0-m[3])<E)rs=outerLow?[0,0,CR,0]:[0,CR,0,0]}}
    if(rs)mb.rslab(x0,z0,x1,z1,0,.2,slab.col,rs);else sideSlab(mb,x0,0,z0,x1,.2,z1,slab.col)}
   const r=slab.r,cc=slab.col.clone().multiplyScalar(.97);
   for(const [hx0,hz0,hx1,hz1] of fills){const a=Math.max(r[0],hx0),b=Math.max(r[1],hz0),c=Math.min(r[2],hx1),d=Math.min(r[3],hz1);if(c-a>.02&&d-b>.02)mb.box(a,0,b,c,.03,d,cc,{})}
  }
  const mesh=mb.mesh(city.M.surface,false,true);if(mesh){mesh.layers.set(1);ch.group.add(mesh);prepareSurfaceMesh(mesh,'ground',STYLES[S.style]);}
  ch.parkingRoadSlabs=[];
 }
}
function parkingGroundAdd(x0,z0,x1,z1){
 const grid=city.parkingFloorGrid;if(!grid||x1<=x0||z1<=z0)return;
 const q={x0,z0,x1,z1};for(let i=Math.floor(x0/P);i<=Math.floor(x1/P);i++)for(let j=Math.floor(z0/P);j<=Math.floor(z1/P);j++){
  const key=i+','+j,entry=grid.get(key);if(entry)entry.push(q);else grid.set(key,[q])}
}
function parkingGroundAt(x,z){
 if(!city.parkingFloorReady||!city.parkingFloorGrid)return false;
 const list=city.parkingFloorGrid.get(Math.floor(x/P)+','+Math.floor(z/P));
 if(!list)return false;for(const r of list)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)return true;
 return false
}
function groundY(x,z){if(city.gasFc)for(const f of city.gasFc)if(x>f[0]&&x<f[2]&&z>f[1]&&z<f[3])return .29;if(SHIPS.list.length){const sh=shipAt(x,z);if(sh)return SEA_Y+SHIP_DECK}if(city.dbs&&city.dbs.length){const h=dbGround(x,z);if(h!==null)return h}const est=estuaryAt(x,z);if(est)return est.ground;const plaza=city.casino?.clubPlaza;if(plaza){const dx=(x-plaza.tx)/plaza.sc,dz=(z-plaza.tz)/plaza.sc,lx=plaza.ox+dx*plaza.ca+dz*plaza.sa,lz=plaza.oz-dx*plaza.sa+dz*plaza.ca,v=plaza.front-lz;if(v>0&&v<6&&lx>plaza.x0&&lx<plaza.x1){const w=Math.abs(lx-plaza.mx);if(v<4.4&&w<8.2)return .3;if(v<5.2&&w<9)return .2;return .1}}const island=city.casino?.clubIsland;if(island&&x<=island.x&&z>=island.z&&island.x-x+z-island.z<=island.leg&&x>=island.x-island.leg&&z<=island.z+island.leg)return .2;const g=groundY0(x,z);if(g===.2&&parkingGroundAt(x,z))return 0;if((g!==0&&g!==.2)||!city.cc)return g;const kx=Math.round(x/P),kz=Math.round(z/P),dx=x-kx*P,dz=z-kz*P,a=Math.abs(dx),b=Math.abs(dz);
 if(a>12||b>12||a<3.85||b<3.85)return g;const cc=cornerInfo(kx,kz,dx<0?-1:1,dz<0?-1:1);
 if(g===0)return cc.notch&&a<=8&&b<=8&&Math.hypot(a-8,b-8)<4.1?.2:0;
 for(const[A,B] of cc.conv)if(a>=A&&a<=A+CR&&b>=B&&b<=B+CR&&Math.hypot(a-A-CR,b-B-CR)>CR)return 0;return .2}
// raio de arredondamento de um canto de laje de calçada (0 = canto reto)
function slabR(cx,cz){if(!city.cc)return 0;const kx=Math.round(cx/P),kz=Math.round(cz/P),dx=cx-kx*P,dz=cz-kz*P,a=Math.abs(dx),b=Math.abs(dz);if(a>12||b>12)return 0;
 const cc=cornerInfo(kx,kz,dx<0?-1:1,dz<0?-1:1);for(const[A,B] of cc.conv)if(Math.abs(a-A)<.06&&Math.abs(b-B)<.06)return CR;return 0}
function sideSlab(mb,x0,y0,z0,x1,y1,z1,col){const rs=[slabR(x1,z1),slabR(x1,z0),slabR(x0,z0),slabR(x0,z1)];if(rs[0]||rs[1]||rs[2]||rs[3])mb.rslab(x0,z0,x1,z1,y0,y1,col,rs);else mb.box(x0,y0,z0,x1,y1,z1,col,{})}

/* v78: altura da areia de Point Haze lida da MESMA malha do hazeShore (raios por ângulo) — antes o chão por hazeU
   ficava até ~1 m abaixo da areia visível onde a costa ondula rápido (jogador afundado na chegada). */
function hazeShoreY(x,z){const S=city.hzShore;if(!S)return null;const dx=x-S.c,dz=z-S.c,r=Math.hypot(dx,dz);let a=Math.atan2(dz,dx);if(a<0)a+=6.283185307;
 const f=a/6.283185307*S.K,k0=Math.floor(f)%S.K,k1=(k0+1)%S.K,t=f-Math.floor(f),nu=S.nu;let prev=null;
 for(let j=0;j<nu;j++){const rj=S.R[k0*nu+j]*(1-t)+S.R[k1*nu+j]*t;if(r<=rj){if(j===0)return S.hy[0];const s=(r-prev)/Math.max(1e-6,rj-prev);if(S.us[j]>SHORE+2)return null;return S.hy[j-1]+(S.hy[j]-S.hy[j-1])*s}prev=rj}return null}
/* v78 · NEON ROAD: o quarteirão da OFICINA (1 por cidade, já sorteado pela seed) ganha uma rua de mão dupla
   cortando o meio (perpendicular ao lado maior), um prédio baixo com TÚNEL sobre a rua numa das pontas, letreiros
   neon (fontes do jogo), placa verde de destino, coqueiros e postes do jogo. RNG próprio (não mexe no resto da seed).
   city.neonRoad: ax = eixo da rua ('x' corre em X, centro em z=c), u0..u1 = extensão, aw = asfalto, tw = asfalto+calçadas,
   end = ponta do túnel (0 = u0, 1 = u1), ta..tb = túnel ao longo da rua, H = altura, clr = vão livre. */
function neonRoadPlan(ri){city.neonRoad=null;const r=city.rects[ri];if(!r||city.haze)return;const nr=mulberry32((S.seed^0x6e30a7d1)>>>0),W=r[2]-r[0],D=r[3]-r[1],aw=8.4,tw=12.8;
 const ends=ax=>{const c=ax==='x'?(r[1]+r[3])/2:(r[0]+r[2])/2,q=ax==='x'?[[r[0]-RW/2,c],[r[2]+RW/2,c]]:[[c,r[1]-RW/2],[c,r[3]+RW/2]];return q.map(p=>{try{return groundY0(p[0],p[1])===0}catch(e){return false}})};
 let ax=W>D+1?'z':D>W+1?'x':(nr()<.5?'x':'z');{const e=ends(ax),o=ax==='x'?'z':'x',e2=ends(o),n1=e[0]+e[1],n2=e2[0]+e2[1];if(n2>n1&&(W>30&&D>30))ax=o}
 const e=ends(ax),c=(ax==='x'?(r[1]+r[3])/2:(r[0]+r[2])/2)+Math.round((nr()-.5)*4),u0=ax==='x'?r[0]:r[1],u1=ax==='x'?r[2]:r[3],P2=(uu,vv)=>ax==='x'?[uu,vv]:[vv,uu];
 const end=e[0]&&!e[1]?0:e[1]&&!e[0]?1:(nr()<.5?0:1),L=12,ta=end===0?u0+SW:u1-SW-L,tb=ta+L;
 const rect=(ua,ub,va,vb)=>ax==='x'?[ua,va,ub,vb]:[va,ua,vb,ub],tr=rect(ta,tb,c-tw/2,c+tw/2);
 /* arco: semicírculo de raio R com nascente em yc; faixa de fachada até yT; painel dos letreiros acima */
 const R=tw/2-.3,yc=1.2,yT=yc+R+.35;let H=11.5+nr()*3.5;{const cap=airportFootprintLimit(...tr);if(Number.isFinite(cap))H=Math.min(H,cap-.5)}H=Math.max(H,yT+3.4);
 const sg=end===0?1:-1,rightV=ax==='x'?-sg:sg; /* lado DIREITO de quem olha da rua para o túnel (em v) */
 city.neonRoad={ri,ax,c,u0,u1,aw,tw,end,ta,tb,H,clr:yc,R,yc,yT,sg,rightV,leftV:-rightV,rect,ar:rect(u0,u1,c-aw/2,c+aw/2),cr:rect(u0,u1,c-tw/2,c+tw/2),tr,ends:e,seed:(nr()*4294967296)>>>0};
 const NRo=city.neonRoad;NRo.strips=[-1,1].map(sd=>{const v=c+sd*(aw/2+1.1);return ax==='x'?[u0+2,v,u1-2,v]:[v,u0+2,v,u1-2]});if(city.strips)city.strips.push(...NRo.strips); /* pedestres andam nas calçadas da rua */
 /* quinas curvas na boca da rua (raio CR, igual às esquinas da cidade): centro do arco e quadrado recortado, em (u,v) */
 /* v78: rua ESTREITA na boca (calçada de 4,1 m dentro da faixa da rua, fora do quarteirão): a boca atravessa essa calçada também
    (NRo.ext por ponta) e as quinas curvas vão para a guia da rua estreita; com avenida (só asfalto) fica como antes */
 NRo.ext=[0,0];NRo.rect2=rect;nrMouthPrep(NRo)}
/* v78: boca da Neon Road numa rua ESTREITA: a calçada dela (4,1 m, dentro da faixa da rua) também é cortada e as quinas curvas
   vão pra guia da rua estreita. Lido das linhas da cidade (city.lines) — chamado no plano e de novo antes de montar os chunks. */
function nrMouthPrep(N){const {ax,u0,u1,c,aw}=N,rect=N.rect2;
 N.ext=[u0,u1].map((uE,k)=>{const kk=Math.round((uE+(k===0?-1:1)*RW/2)/P),L=city.lines&&city.lines[(ax==='x'?'V':'H')+kk],mid=ax==='x'?[uE+(k===0?-1:1)*RW/2,c]:[c,uE+(k===0?-1:1)*RW/2];
  return L&&L.t!=='ave'&&!isRural(mid[0],mid[1])?RW/2-3.9:0});
 N.mouth=[0,1].map(k=>{const ex=N.ext[k];if(!ex)return null;const uE=k===0?u0:u1,du=k===0?1:-1;return rect(Math.min(uE,uE-du*ex),Math.max(uE,uE-du*ex),c-aw/2,c+aw/2)});
 N.fil=[];[u0,u1].forEach((uB,k)=>{const du=k===0?1:-1,uE=uB-du*N.ext[k];for(const sd of [-1,1]){const vE=c+sd*aw/2;N.fil.push({u0:Math.min(uE,uE+du*CR),u1:Math.max(uE,uE+du*CR),v0:Math.min(vE,vE+sd*CR),v1:Math.max(vE,vE+sd*CR),cu:uE+du*CR,cv:vE+sd*CR})}})}
/* letreiro de texto neon (canvas transparente com brilho) usando as fontes que o jogo já carrega */
const NEON_TXT=new Map();
function neonTextMat(txt,font,fg,w,h,glow){const key=txt+'|'+font+'|'+fg+'|'+w+'x'+h;if(NEON_TXT.has(key))return NEON_TXT.get(key);
 const c=cv(w,h),g=c.getContext('2d'),draw=()=>{g.clearRect(0,0,w,h);let fs=Math.floor(h*.62);const f=()=>g.font=(font==='Pacifico'?'':'400 ')+fs+'px "'+font+'", Fredoka, sans-serif';f();while(g.measureText(txt).width>w*.92&&fs>10){fs--;f()}
  g.textAlign='center';g.textBaseline='middle';for(const [b,a] of [[h*.22,.9],[h*.1,1],[0,1]]){g.shadowColor=glow||fg;g.shadowBlur=b;g.globalAlpha=a;g.fillStyle=b?fg:'#fff8fb';g.fillText(txt,w/2,h/2+fs*.04);if(!b){g.globalAlpha=.55;g.fillStyle=fg;g.fillText(txt,w/2,h/2+fs*.04)}}g.globalAlpha=1;g.shadowBlur=0};
 draw();const t=new THREE.CanvasTexture(c);t.anisotropy=4;const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});m.userData.cached=true;
 try{if(document.fonts&&!document.fonts.check(fs0(font)))document.fonts.load(fs0(font)).then(()=>{draw();t.needsUpdate=true}).catch(()=>{})}catch(e){}
 NEON_TXT.set(key,m);return m}
function fs0(font){return '48px "'+font+'"'}
function groundY0(x,z){const N=city.N;if(city.haze){const py=pierY(x,z);if(py!==null)return py;const u=hazeU(x,z);if(u<=RW/2)return .2+hazeH(x,z);if(u>700)return 0;if(u<=SHORE+2){const y=hazeShoreY(x,z);if(y!==null)return y}} /* v78: interiores ficam a >1 km — o perfil da praia de Haze descia pra −250 m lá (jogador caía no breu) */if(city.piers){const h=pierY(x,z);if(h!==null)return h}if(city.riv&&city.riv.size&&waterAt(x,z))return RY;{const cg=coastGround(x,z);if(cg!==null)return cg}if(x<-RW/2||z<-RW/2||x>N*P+RW/2||z>N*P+RW/2)return .2;const u=x-RW/2,w=z-RW/2;const i=Math.floor(u/P),j=Math.floor(w/P);
 {const NR=city.neonRoad;if(NR){const a=NR.ar;if(NR.mouth)for(const m of NR.mouth)if(m&&x>m[0]&&x<m[2]&&z>m[1]&&z<m[3])return 0;const ex=NR.ext?Math.max(NR.ext[0],NR.ext[1]):0;if(x>a[0]-CR-ex&&x<a[2]+CR+ex&&z>a[1]-CR-ex&&z<a[3]+CR+ex){if(x>a[0]&&x<a[2]&&z>a[1]&&z<a[3])return 0;const u=NR.ax==='x'?x:z,v=NR.ax==='x'?z:x;for(const f of NR.fil)if(u>f.u0&&u<f.u1&&v>f.v0&&v<f.v1&&Math.hypot(u-f.cu,v-f.cv)>CR)return 0}}} /* v78: rua nova do quarteirão da oficina (com quinas curvas) */
 const inX=(i>=0&&i<N&&u-i*P<=BS), inZ=(j>=0&&j<N&&w-j*P<=BS);
 if(inX&&inZ){if(city.motelRi!=null){const m=city.rects[city.motelRi];if(m&&x>m[0]+SW&&x<m[2]-SW&&z>m[1]+SW&&z<m[3]-SW)return .045} /* v79: pátio do motel é rebaixado (asfalto a 4,5 cm) — carros e jogador não flutuam */return .2}
 const kx=Math.round(x/P),kz=Math.round(z/P),onV=Math.abs(x-kx*P)<=RW/2,onH=Math.abs(z-kz*P)<=RW/2;
 if(onV&&onH){const dx=x-kx*P,dz=z-kz*P;if(city.lines&&city.deg&&city.deg[kx]&&city.deg[kx][kz]>=2&&!isRural(kx*P,kz*P)){if(Math.abs(dz)>3.9){const LH=lineHV(1,kz);if(LH&&LH.t!=='ave'&&!segExists(kx,dz<0?kz-1:kz,1))return .2}if(Math.abs(dx)>3.9){const LV=lineHV(0,kx);if(LV&&LV.t!=='ave'&&!segExists(dx<0?kx-1:kx,kz,0))return .2}}return 0}if(city.lines){if(onV){const L=lineHV(0,kx);if(L&&L.t!=='ave'&&Math.abs(x-kx*P)>3.9&&!isRural(x,z))return .2}if(onH){const L=lineHV(1,kz);if(L&&L.t!=='ave'&&Math.abs(z-kz*P)>3.9&&!isRural(x,z))return .2}}
 if(onV&&city.segOff.has(segStr(0,kx,Math.floor(z/P))))return .2;if(onH&&city.segOff.has(segStr(1,Math.floor(x/P),kz)))return .2;return 0}
function blockRect(i,j){return [i*P+RW/2,j*P+RW/2,(i+1)*P-RW/2,(j+1)*P-RW/2]}
// ============================================================================
// >>> NÃO ALTERAR AQUI <<<  PIXELCITY v258 — PROTEÇÃO DOS SPRITES (TESTADO NO JOGO)
// ESTE BLOCO FOI VALIDADO: Modern, Synthwave, Mundo Invertido, Point Haze,
// inclusive ida/volta entre mundos. NUNCA descarte a geometria compartilhada
// de THREE.Sprite ao limpar cenas, veículos ou efeitos. Isso faz sprites SUMIREM.
// Qualquer mudança exige teste visual real de TODAS as transições.
// ============================================================================
// Three.js r128 usa a MESMA geometria interna para todos os THREE.Sprite.
// Nunca descarte Sprite.geometry ao limpar uma cidade/grupo: isso inutiliza a
// geometria usada por jogadores, pedestres, partículas e sprites de outros mundos.
// v77: recursos compartilhados dos carros nunca são descartados aqui. Ao trocar de mundo (DeLorean) um carro dentro do grupo da cidade
// descartava wheelGeo/wheelMat/hubGeo/hubMat de TODOS os veículos; em GPUs reais as rodas sumiam depois disso.
function disposeShared(x){if(x&&x.userData&&(x.userData.cached||x.userData.carBody))return true;try{return x===wheelGeo||x===hubGeo||x===wheelMat||x===hubMat||x===carBodyMat||x===carLightMat||x===burntMat||x===WHEEL_FULL||x===WHEEL_NI}catch(e){return false}}
function disposeGroup(g){const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.geometry&&!o.isSprite&&!geometries.has(o.geometry)){geometries.add(o.geometry);if(!disposeShared(o.geometry))o.geometry.dispose()}if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!materials.has(m)){materials.add(m);if(!disposeShared(m))m.dispose()}})}})}
function chunkOf(x,z){const NC=Math.ceil(city.N/CS);return[clamp(Math.floor(x/(P*CS)),0,NC-1),clamp(Math.floor(z/(P*CS)),0,NC-1)]}
function chunkBox(ci,cj){const NC=Math.ceil(city.N/CS),E=city.ext;return[ci===0?-260:ci*CS*P,cj===0?-260:cj*CS*P,ci===NC-1?E+260:(ci+1)*CS*P,cj===NC-1?E+260:(cj+1)*CS*P]}
const HOUSE_WALLS=['#e8dcc4','#d9c7a8','#c9d6d9','#e6c9b8','#cfd9c0','#f0e6d2','#d8b8a0','#b9c4d0','#e4d0d8'],HOUSE_ROOFS=['#8a3a2a','#6a4a3a','#4a4e56','#7a5a3a','#5a3028','#3a4a5a','#9a5a3a'];

