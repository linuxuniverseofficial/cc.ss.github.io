'use strict';
/* Coastal Chaos · js/43-interiores-lab.js — Crime, palco de interiores (motel, laboratório, danceteria, roomStage).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
const CRIME_ROLL={at:-1,peds:10,cars:3};
function crimeRoll(){if(simT<CRIME_ROLL.at&&CRIME_ROLL.at-simT<=30)return;CRIME_ROLL.at=simT+30;CRIME_ROLL.peds=5+Math.floor(Math.random()*11);CRIME_ROLL.cars=1+Math.floor(Math.random()*3)}
/* v272 — INTERIORES ISOLADOS (todas as entradas com seta).
   NÃO ALTERAR AQUI: SpriteMaterial, atlas, geometria compartilhada,
   drawRange ou ciclo de limpeza dos sprites: preservados da v258.
   Cidade + interiores inativos continuam em RAM/VRAM; não destruir meshes.
   Apenas o interior ativo e seus atores recebem desenho/atualizações locais. */
const ROOM_STAGE={mode:null,hidden:[],background:null,fog:null,armed:0};
/* v77 · MOTEL MIRAGEM — quarto 6 (interior). Paleta amarronzada, abajures quentes e penumbra (roomLitMat),
   ventilador de teto girando, janela com cortina e ar-condicionado; a porta (seta) leva de volta à varanda. */
let MOTEL_CEIL_SIDE=THREE.FrontSide;const MOTEL={grp:null,IN:null,arrOut:null,arrIn:null,lock:0,fan:null,claire:null,scene:false};
function motelRoomBuild(){if(MOTEL.grp)return;const X=SAFE.IN.x+110,Z=SAFE.IN.z-70,W=4.6,D=3.6,H=2.9,C=h=>COL(h);MOTEL.IN={x:X,z:Z,W,D,H};
 // v77 (2): quarto 6 com BANHEIRO separado (canto nordeste), móveis detalhados no padrão da casa segura.
 // Coordenadas locais: x −4,6…4,6 (oeste→leste), z −3,6…3,6 (norte→sul); porta da rua no sul, à esquerda.
 const g=new THREE.Group();MOTEL.grp=g;scene.add(g);g.visible=false;const mb=new MB(),m2=new MB(),cb=new MB();
 const cc=c=>typeof c==='string'?C(c):c,B=(a,b,c,d,e,f,col)=>ibox(mb,X+Math.min(a,d),b,Z+Math.min(c,f),X+Math.max(a,d),e,Z+Math.max(c,f),cc(col));
 const CB=(a,b,c,d,e,f,col,r)=>m2.cbox(X+Math.min(a,d),b,Z+Math.min(c,f),X+Math.max(a,d),e,Z+Math.max(c,f),cc(col),r||.04);
 const CY=(x,y0,y1,z,r,col,rz)=>m2.geo(GEO.cyl16,mtx(X+x,(y0+y1)/2,Z+z,r,y1-y0,rz??r),cc(col)),SP=(x,y,z,rx,ry,rz,col)=>m2.geo(GEO.sph,mtx(X+x,y,Z+z,rx,ry,rz),cc(col));
 const cols=[],col=(a,c,b,d)=>cols.push([X+Math.min(a,b),Z+Math.min(c,d),X+Math.max(a,b),Z+Math.max(c,d)]);
 const wall=(x0,z0,x1,z1,colr,away)=>mb.qa([X+x0,0,Z+z0],[X+x1,0,Z+z1],[X+x1,H,Z+z1],[X+x0,H,Z+z0],cc(colr),[X+away[0],1,Z+away[1]]);
 const BX0=1.8,BZ1=-.6,BD0=2.3,BD1=3.2; // banheiro: x 1,8…4,6 · z −3,6…−0,6 · porta x 2,3…3,2 na parede sul
 // ---------- piso: carpete marrom em xadrez gasto (quarto) e ladrilho (banheiro) ----------
 for(let x=-W;x<W-.01;x+=.8)for(let z=-D;z<D-.01;z+=.8){if(x>=BX0-.01&&z<BZ1-.01)continue;const k=(Math.round(x/.8)+Math.round(z/.8))&1;mb.quad([X+x,0,Z+z+.8],[X+x+.8,0,Z+z+.8],[X+x+.8,0,Z+z],[X+x,0,Z+z],0,1,0,[0,0,1,1],C(k?'#5a3c2a':'#654430'))}
 for(let x=BX0;x<W-.01;x+=.3)for(let z=-D;z<BZ1-.01;z+=.3){const k=(Math.round(x/.3)+Math.round(z/.3))&1;mb.quad([X+x,.005,Z+Math.min(BZ1,z+.3)],[X+Math.min(W,x+.3),.005,Z+Math.min(BZ1,z+.3)],[X+Math.min(W,x+.3),.005,Z+z],[X+x,.005,Z+z],0,1,0,[0,0,1,1],C(k?'#d8d0b8':'#b8c8c0'))}
 for(const[x,z,r] of [[-1.2,1.6,.35],[.6,.4,.22],[2.6,2.2,.3],[-3.0,2.6,.25]])CY(x,.004,.008,z,r,'#4a3020',r*.7);
 // ---------- paredes: papel caramelo no quarto, azulejo no banheiro ----------
 const wp=C('#a07a56'),wp2=C('#94704e'),wain=C('#5e3e28'),tile=C('#cfe0dc'),tile2=C('#e8e2d0');
 wall(-W,-D,BX0,-D,wp,[0,-D-9]);wall(-W,D,W,D,wp,[0,D+9]);wall(-W,-D,-W,D,wp2,[-W-9,0]);wall(W,BZ1,W,D,wp2,[W+9,0]);
 // divisórias do banheiro (as duas faces) com vão da porta
 wall(BX0,-D,BX0,BZ1,wp2,[BX0+9,-2]);wall(BX0,-D,BX0,BZ1,tile,[BX0-9,-2]);
 for(const[a,b] of [[BX0,BD0],[BD1,W]]){wall(a,BZ1,b,BZ1,wp,[(a+b)/2,BZ1-9]);wall(a,BZ1,b,BZ1,tile,[(a+b)/2,BZ1+9])}
 mb.qa([X+BD0,2.1,Z+BZ1],[X+BD1,2.1,Z+BZ1],[X+BD1,H,Z+BZ1],[X+BD0,H,Z+BZ1],wp,[X+2.75,1,Z+BZ1-9]);mb.qa([X+BD0,2.1,Z+BZ1],[X+BD1,2.1,Z+BZ1],[X+BD1,H,Z+BZ1],[X+BD0,H,Z+BZ1],tile,[X+2.75,1,Z+BZ1+9]);
 wall(BX0,-D,W,-D,tile2,[3,-D-9]);wall(W,-D,W,BZ1,tile2,[W+9,-2]);
 for(const[a,b] of [[BD0-.08,BD0],[BD1,BD1+.08]])B(a,0,BZ1-.07,b,2.18,BZ1+.07,'#3e2818');B(BD0-.08,2.1,BZ1-.07,BD1+.08,2.18,BZ1+.07,'#3e2818');
 // teto (uma face, invisível de cima) e manchas de umidade
 cb.quad([X-W,H,Z-D],[X+W,H,Z-D],[X+W,H,Z+D],[X-W,H,Z+D],0,-1,0,[0,0,1,1],C('#c2aa8a'));
 cb.quad([X-1.2,H-.01,Z-1.4],[X+.4,H-.01,Z-1.4],[X+.4,H-.01,Z-.4],[X-1.2,H-.01,Z-.4],0,-1,0,[0,0,1,1],C('#a08a68'));
 // lambri, rodapé/friso, mancha no papel
 B(-W,0,-D,BX0,1.0,-D+.05,wain);B(-W,0,D-.05,W,1.0,D,wain);B(-W,0,-D,-W+.05,1.0,D,wain);B(W-.05,0,BZ1,W,1.0,D,wain);B(BX0-.05,0,-D,BX0,1.0,BZ1,wain);B(BX0,0,BZ1,BD0,1.0,BZ1+.05,wain);B(BD1,0,BZ1,W,1.0,BZ1+.05,wain);
 for(const[a,c,b,d] of [[-W,-D,BX0,-D+.07],[-W,D-.07,W,D],[-W,-D,-W+.07,D],[W-.07,BZ1,W,D]])B(a,.98,c,b,1.06,d,'#3e2818');
 mb.quad([X-W+.02,1.1,Z+1.4],[X-W+.02,1.1,Z+2.6],[X-W+.02,2.2,Z+2.6],[X-W+.02,2.2,Z+1.4],1,0,0,[0,0,1,1],C('#8e6a48'));
 // ---------- porta da rua (corrente, olho mágico, plaquinha "não perturbe", quadro de regras) ----------
 B(-3.4,0,D-.08,-2.3,2.15,D,'#6a4228');B(-3.48,2.15,D-.1,-2.22,2.25,D,'#3e2818');for(const x of [-3.48,-2.3])B(x,0,D-.1,x+.08,2.2,D,'#3e2818');
 B(-2.5,1.0,D-.13,-2.42,1.1,D-.08,'#d8b04a');CY(-2.85,1.55,1.57,D-.09,.025,'#c8c8c8');B(-2.62,1.25,D-.13,-2.6,1.45,D-.12,'#b8b8b8');B(-2.5,.85,D-.14,-2.38,1.05,D-.13,'#e8402a');
 B(-1.9,1.3,D-.03,-1.4,1.75,D-.01,'#e8e0c8');B(-1.92,1.28,D-.04,-1.38,1.77,D-.02,'#3e2818');B(-1.0,1.6,D-.05,-.7,1.75,D-.01,'#e8e8e8');
 // ---------- janela (norte) com noite azulada, cortinas vinho e ar-condicionado de parede embaixo ----------
 B(-1.6,1.0,-D,1.4,2.25,-D+.03,'#24304a');B(-1.68,.95,-D,1.48,1.02,-D+.12,'#3e2818');B(-1.68,2.23,-D,1.48,2.3,-D+.1,'#3e2818');B(-.13,1.0,-D,-.07,2.25,-D+.05,'#3e2818');
 CB(-2.05,.12,-D+.06,-1.3,2.45,-D+.22,'#7a2a20',.05);CB(1.1,.12,-D+.06,1.85,2.45,-D+.22,'#6e261c',.05);B(-2.15,2.45,-D+.05,1.95,2.52,-D+.14,'#b89a5a');
 for(const x of [-1.95,-1.6,1.2,1.55])B(x,.15,-D+.21,x+.05,2.4,-D+.24,'#5e1e16');
 CB(-.9,.15,-D+.04,.4,.75,-D+.42,'#c9c2b0',.03);for(let k=0;k<7;k++)B(-.82+k*.17,.5,-D+.42,-.75+k*.17,.7,-D+.43,'#8a847a');col(-.9,-D,.4,-D+.45);
 // ---------- cama de casal (cabeceira acolchoada), colcha bordô com barrado, travesseiros ----------
 CB(-W+.05,0,-1.15,-W+.22,1.3,1.15,'#4a2c18',.05);for(const z of [-.75,0,.75])CB(-W+.2,.6,z-.32,-W+.26,1.15,z+.32,'#6a3a24',.04);
 B(-W+.22,.06,-1.05,-W+2.3,.32,1.05,'#3e2818');for(const z of [-1.0,.95])for(const x of [-W+.3,-W+2.2])B(x,0,z,x+.07,.06,z+.07,'#2a1a10');
 CB(-W+.22,.32,-1.0,-W+2.25,.56,1.0,'#e2d2b8',.08);CB(-W+.75,.55,-1.04,-W+2.31,.62,1.04,'#7e2a22',.04);B(-W+2.26,.18,-1.04,-W+2.32,.6,1.04,'#6e241c');B(-W+.75,.6,-1.05,-W+2.32,.625,-.95,'#c8a050');B(-W+.75,.6,.95,-W+2.32,.625,1.05,'#c8a050');
 CB(-W+.3,.55,-.9,-W+.78,.74,-.1,'#efe4d0',.08);CB(-W+.3,.55,.1,-W+.78,.74,.9,'#efe4d0',.08);col(-W,-1.15,-W+2.33,1.15);
 // criados-mudos (gaveta + puxador) com abajur, telefone, cinzeiro e controle remoto
 for(const s of [-1,1]){const z0=s<0?-1.85:1.25,z1=z0+.6;CB(-W+.1,0,z0,-W+.66,.55,z1,'#5a3a22',.03);B(-W+.66,.3,z0+.08,-W+.67,.48,z1-.08,'#6e4a2c');B(-W+.67,.37,(z0+z1)/2-.08,-W+.69,.41,(z0+z1)/2+.08,'#c8a050');col(-W,z0,-W+.68,z1);
  CY(-W+.38,.55,.58,(z0+z1)/2,.09,'#8a6a40');CY(-W+.38,.58,.92,(z0+z1)/2,.03,'#8a6a40')}
 CB(-W+.25,.55,1.62,-W+.5,.62,1.78,'#1a1a1e',.02);B(-W+.27,.62,1.64,-W+.48,.64,1.68,'#2a2a2e');CY(-W+.42,.55,.58,-1.45,.07,'#9ac8d8');SP(-W+.42,.6,-1.45,.015,.015,.015,'#e8e0d0');B(-W+.15,.55,-1.75,-W+.3,.58,-1.62,'#2a2a2e');
 // ---------- cômoda com TV de tubo e antena, frigobar, porta-malas e poltrona ----------
 CB(W-.6,0,.2,W-.05,.85,2.6,'#5a3820',.03);for(const z of [.35,1.45])for(const y of [.15,.5])B(W-.61,y,z,W-.6,y+.28,z+1.0,'#6e4a2c');for(const z of [.85,1.95])for(const y of [.29,.64])B(W-.63,y,z-.06,W-.61,y+.04,z+.06,'#c8a050');col(W-.6,.2,W,2.6);
 CB(W-.55,.85,.65,W-.1,1.35,1.35,'#2a2420',.04);B(W-.56,.9,.72,W-.55,1.3,1.28,'#3a4a58');SP(W-.32,1.36,1.0,.06,.04,.06,'#1a1a1a');for(const a of [-.35,.35])m2.geo(GEO.cyl,mtx(X+W-.32,1.62,Z+1.0+a*.45,.008,.6,.008,a,0,0),C('#b8b8b8'));
 CB(W-.6,0,2.75,W-.08,.85,3.4,'#e8e4dc',.04);B(W-.61,.75,2.85,W-.6,.8,3.3,'#9a9aa0');col(W-.6,2.7,W,3.45);
 B(-1.6,.0,D-.75,-.6,.5,D-.25,'#4a3020');B(-1.55,.5,D-.7,-.65,.75,D-.3,'#2a3a5a');B(-1.6,.75,D-.72,-.6,.78,D-.28,'#1a2030');col(-1.6,D-.75,-.6,D-.25);
 CB(2.0,0,1.25,2.85,.45,2.05,'#6a4a3a',.06);CB(1.95,.4,1.95,2.9,1.05,2.15,'#6a4a3a',.06);CB(1.95,.4,1.25,2.12,.75,2.05,'#5e4032',.04);CB(2.73,.4,1.25,2.9,.75,2.05,'#5e4032',.04);col(1.95,1.25,2.9,2.15);
 // mesinha redonda com 2 cadeiras perto da janela (balde de gelo, copos)
 CY(1.0,.72,.76,-2.55,.42,'#4a2e1c');CY(1.0,.05,.72,-2.55,.04,'#3a2414');CY(1.0,0,.05,-2.55,.22,'#3a2414');col(.6,-2.95,1.4,-2.15);
 CY(.9,.76,.92,-2.6,.09,'#c8c8d0');CY(1.15,.76,.86,-2.45,.035,'#d8e8f0');for(const[x,z] of [[.35,-2.2],[1.55,-1.95]]){CB(x-.2,.42,z-.2,x+.2,.47,z+.2,'#5e3c24',.03);for(const[p,q] of [[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])B(x+p-.02,0,z+q-.02,x+p+.02,.42,z+q+.02,'#3a2414');CB(x-.2,.47,z+.16,x+.2,.95,z+.2,'#5e3c24',.02);col(x-.22,z-.22,x+.22,z+.22)}
 // tapete, quadro de praia acima da cama, aquecedor de parede, detector de fumaça
 B(-1.9,0,-1.3,-.2,.012,1.3,'#7a5a34');B(-1.8,.012,-1.2,-.3,.016,1.2,'#8a6a40');
 B(-W+.02,1.55,-.8,-W+.06,2.25,.8,'#b08a40');B(-W+.06,1.62,-.72,-W+.07,1.95,.72,'#4a8aa0');B(-W+.06,1.6,-.72,-W+.07,1.75,.72,'#d8b878');B(-W+.06,2.0,.3,-W+.075,2.12,.42,'#f2c860');
 B(W-.12,.15,-.4,W-.03,.7,.1,'#c8c2b0');for(let k=0;k<5;k++)B(W-.13,.25+k*.09,-.35,W-.12,.29+k*.09,.05,'#8a847a');CY(0,H-.03,H,1.8,.08,'#f0f0ea');
 // ---------- BANHEIRO: box com cortina, vaso, pia com gabinete e espelho, toalhas, janelinha ----------
 B(BX0+.05,0,-D+.05,BX0+1.15,.12,-D+1.15,'#e8e8ec');CY(BX0+.6,2.0,2.04,-D+.6,.15,'#c8c8d0');B(BX0+.58,2.04,-D+.05,BX0+.62,2.08,-D+.6,'#c8c8d0');
 B(BX0+.05,2.1,-D+1.13,BX0+1.15,2.13,-D+1.17,'#b8b8c0');CB(BX0+.08,.15,-D+1.12,BX0+.75,2.05,-D+1.18,'#d8e8f0',.02);for(let k=0;k<5;k++)B(BX0+.1+k*.13,.18,-D+1.18,BX0+.13+k*.13,2.0,-D+1.2,'#a8c8e0');
 col(BX0,-D,BX0+1.17,-D+1.2);
 CB(W-.65,0,-D+.12,W-.1,.42,-D+.6,'#f4f4f6',.1);CB(W-.68,.38,-D+.1,W-.08,.46,-D+.62,'#ffffff',.06);CB(W-.25,.4,-D+.05,W-.05,.88,-D+.68,'#f4f4f6',.05);B(W-.15,.88,-D+.25,W-.1,.92,-D+.3,'#c8c8d0');col(W-.7,-D,W,-D+.7);
 const kz0=-2.25,kz1=-1.35;CB(W-.55,0,kz0,W-.05,.8,kz1,'#e8e4dc',.03);CB(W-.57,.8,kz0-.02,W-.03,.86,kz1+.02,'#3a3a40',.02);CY(W-.3,.84,.86,(kz0+kz1)/2,.16,'#c8ccd0');CY(W-.12,.86,1.02,(kz0+kz1)/2,.02,'#c8c8d0');
 B(W-.04,1.1,kz0+.05,W-.01,1.9,kz1-.05,'#c8dce8');B(W-.05,1.08,kz0+.02,W-.02,1.92,kz1-.02,'#8a8a90');col(W-.57,kz0,W,kz1);
 CB(W-.48,.86,kz0+.1,W-.38,1.0,kz0+.2,'#e8a0c0',.02);CB(W-.45,.86,kz1-.22,W-.35,.95,kz1-.1,'#f0f0e8',.02);
 B(BX0+.02,1.25,-1.6,BX0+.07,1.29,-.9,'#c8c8d0');B(BX0+.04,.75,-1.55,BX0+.09,1.27,-.95,'#e8e8f0');B(W-.4,.0,BZ1-.5,W-.05,.02,BZ1-.05,'#7aa8c8');
 B(BX0+1.4,2.0,-D,BX0+2.2,2.4,-D+.04,'#9ad0e0');B(BX0+1.36,1.96,-D,BX0+2.24,2.44,-D+.02,'#e8e8e8');
 // ---------- luzes ----------
 const lights=[[-W+.38,1.15,-1.55],[-W+.38,1.15,1.55],[0,H-.45,.3],[W-1.4,H-.3,-2.1],[W-.3,1.3,1.0]];
 const RL={x0:X-W,z0:Z-D,x1:X+W,z1:Z+D,H,lights:lights.map(([x,y,z])=>[X+x,y,Z+z]),warm:'#ffb46a',amb:.36,pow:.95,rad:3.6,grime:.45};
 g.add(mb.mesh(roomLitMat(RL)));g.add(m2.mesh(roomLitMat(RL)));g.add(cb.mesh(roomLitMat(RL,{side:MOTEL_CEIL_SIDE})));
 for(const p of [lights[0],lights[1]]){const sh=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,.26,10,1,true),new THREE.MeshBasicMaterial({color:0xffd59a,side:THREE.DoubleSide}));sh.position.set(X+p[0],1.05,Z+p[2]);g.add(sh)}
 {const s=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.04,10),new THREE.MeshBasicMaterial({color:0xfff0d0}));s.position.set(X+W-1.4,H-.02,Z-2.1);g.add(s)}
 const tvs=new THREE.Mesh(new THREE.PlaneGeometry(.52,.36),new THREE.MeshBasicMaterial({color:0x2a3c48}));tvs.position.set(X+W-.572,1.1,Z+1.0);tvs.rotation.y=-Math.PI/2;g.add(tvs);MOTEL.tv=tvs.material;
 const fan=new THREE.Group();fan.position.set(X,H-.32,Z+.3);const fm=new THREE.MeshBasicMaterial({color:0x4a3220});fan.add(new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.14,10),new THREE.MeshBasicMaterial({color:0xb08a50})));
 const rod=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.32,6),fm);rod.position.y=.2;fan.add(rod);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:0xffe2b0}));bulb.position.y=-.1;fan.add(bulb);
 for(let k=0;k<4;k++){const bl=new THREE.Mesh(new THREE.BoxGeometry(.75,.02,.17),fm);bl.position.set(Math.cos(k*Math.PI/2)*.48,0,Math.sin(k*Math.PI/2)*.48);bl.rotation.y=-k*Math.PI/2;fan.add(bl)}g.add(fan);MOTEL.fan=fan;
 // ---------- colisões: paredes externas, divisórias do banheiro (com vão) e móveis ----------
 for(const[x0,z0,x1,z1] of [[-W-.5,-D-.5,W+.5,-D+.12],[-W-.5,D,W+.5,D+.5],[-W-.5,-D,-W,D],[W,-D,W+.5,D]])addCol(X+x0,Z+z0,X+x1,Z+z1,'rock');
 col(BX0-.08,-D,BX0+.08,BZ1);col(BX0,BZ1-.08,BD0,BZ1+.08);col(BD1,BZ1-.08,W,BZ1+.08);
 for(const c of cols)addCol(c[0],c[1],c[2],c[3],'rock');
 MOTEL.rooms=[{x0:X+BX0,z0:Z-D,x1:X+W,z1:Z+BZ1},{x0:X-W,z0:Z-D,x1:X+W,z1:Z+D}];
 MOTEL.exit={x:X-2.85,z:Z+D-.75};MOTEL.window={x:X-.6,z:Z-D+1.05};
 if(!MOTEL.arrIn)MOTEL.arrIn=makeArrow();MOTEL.arrIn.position.set(MOTEL.exit.x,1.5,MOTEL.exit.z);MOTEL.arrIn.visible=false}
/* v78 · POINT HAZE — ESCOTILHA + LABORATÓRIO SUBTERRÂNEO (referência: anexo subterrâneo do GTA SA).
   Escotilha de aço no pé do paredão (hazeHatchBuild, montada junto do hazeTerrain). Dentro: PL.inside='lab', palco próprio
   (ROOM_STAGE 'lab'), 2 andares lado a lado longe da cidade (andar 2 = +70 m em z). Coordenadas locais do andar:
   x −18..18, z −14..14; corredores em # (x −7..−4 e 4..7, z −6..−3 e 3..6); célula sul-central = hall de entrada com a escada de marinheiro. */
const LAB={grp:null,hatch:null,lock:0,arrOut:null,arrIn:null,F:[],peds:[],flick:[]};
function hazeHatchBuild(){const T=city.hzT||hazeHInit(),E=city.ext;let dx=E/2-T.cor[0],dz=E/2-T.cor[1];const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;
 let d=24;for(;d<70;d+=.5){if(hazeH(T.cor[0]+dx*d,T.cor[1]+dz*d)<.6)break}
 const hx=T.cor[0]+dx*(d+1.2),hz=T.cor[1]+dz*(d+1.2),y=groundY(hx,hz),nx=dx,nz=dz,tx=-nz,tz=nx,mb=new MB(),C=h=>COL(h),hr=mulberry32((city.hzSeed^0x4a7c)>>>0);
 const P=(a,b)=>[hx+tx*a+nx*b,hz+tz*a+nz*b];const yaw=Math.atan2(-nz,nx);
 const BX=(a,b,w,dd,y0,y1,col)=>{const p=P(a,b);mb.geo(GEO.box,mtx(p[0],(y0+y1)/2,p[1],w,y1-y0,dd,0,yaw,0),col)};
 // colar de concreto, tampa de aço com nervuras, volante e dobradiças
 BX(0,0,2.3,2.3,y-.1,y+.22,C('#7c7a74'));BX(0,0,1.6,1.6,y+.22,y+.3,C('#4a4e52'));for(const a of[-.45,0,.45])BX(a,0,.1,1.5,y+.3,y+.34,C('#3c4044'));
 {const p=P(0,0);mb.geo(GEO.cyl16,mtx(p[0],y+.42,p[1],.32,.04,.32),C('#8a2a20'));mb.geo(GEO.cyl16,mtx(p[0],y+.37,p[1],.05,.1,.05),C('#3c4044'))}
 for(const a of[-.5,.5])BX(a,-.85,.22,.14,y+.22,y+.36,C('#2e3236'));BX(0,.82,.9,.06,y+.24,y+.31,C('#c8a020'));
 // pedras e mato seco em volta (a escotilha fica meio escondida)
 for(let k=0;k<7;k++){const a=k/7*6.2832+hr()*.5,r=1.9+hr()*1.4,p=P(Math.cos(a)*r,Math.sin(a)*r);if(Math.cos(a)<-.2&&Math.abs(Math.sin(a))<.6)continue;const s=.5+hr()*.9,gy=groundY(p[0],p[1]);
  mb.geo(GEO.ico,mtx(p[0],gy+s*.3,p[1],s*(1+hr()*.4),s*(.6+hr()*.3),s*(1+hr()*.4),hr()*3,hr()*6,hr()*3),C('#77736a').multiplyScalar(.85+hr()*.2));addCol(p[0]-s*.8,p[1]-s*.8,p[0]+s*.8,p[1]+s*.8,'rock')}
 for(let k=0;k<6;k++){const a=hr()*6.2832,r=1.5+hr()*1.8,p=P(Math.cos(a)*r,Math.sin(a)*r),s=.35+hr()*.3;mb.geo(GEO.crownSmall,mtx(p[0],groundY(p[0],p[1])+s*.5,p[1],s,s*.7,s),C('#5a5a38').multiplyScalar(.8+hr()*.3))}
 // placa apagada (tinta descascada) e antena enferrujada torta
 {const p=P(2.6,-.9),gy=groundY(p[0],p[1]);mb.geo(GEO.box,mtx(p[0],gy+.8,p[1],.08,1.6,.08,0,yaw,.06),C('#5a4a3a'));mb.geo(GEO.box,mtx(p[0],gy+1.55,p[1],.9,.6,.05,0,yaw+.15,.08),C('#7a5a3a'));
  mb.geo(GEO.box,mtx(p[0],gy+1.6,p[1],.6,.14,.06,0,yaw+.15,.08),C('#8a8070'));addCol(p[0]-.15,p[1]-.15,p[0]+.15,p[1]+.15,'pole')}
 {const p=P(-2.4,-1.6),gy=groundY(p[0],p[1]),lean=.1;for(let k=0;k<5;k++)mb.geo(GEO.box,mtx(p[0]+Math.sin(lean)*k,gy+.5+k,p[1],.09,1,.09,0,0,-lean),C('#7a4a2a'));
  for(const[h,w] of[[2.6,1.3],[3.6,.9],[4.3,.6]])mb.geo(GEO.box,mtx(p[0]+Math.sin(lean)*h,gy+h,p[1],w,.05,.05,0,yaw,-lean),C('#6a3e22'));mb.geo(GEO.sph,mtx(p[0]+Math.sin(lean)*5,gy+5.05,p[1],.09,.09,.09),C('#5a1a14'));addCol(p[0]-.15,p[1]-.15,p[0]+.15,p[1]+.15,'pole')}
 const m=mb.mesh(city.M.solid,true,true);m.name='hazeHatch';city.group.add(m);LAB.hatch={x:hx,z:hz,y,nx,nz}}
function labNumTex(){if(LAB.numTex)return LAB.numTex;const c=cv(512,256),g=c.getContext('2d');g.fillStyle='#d8dcd8';g.fillRect(0,0,512,256);
 for(let k=0;k<32;k++){const x=(k%4)*128,y=Math.floor(k/4)*32;g.fillStyle='#e8ece8';g.fillRect(x+2,y+2,124,28);g.fillStyle='#1c2420';g.font='700 22px monospace';g.textAlign='center';g.textBaseline='middle';
  const f=k<16?1:2,n=k%16;g.fillText((n===15?(f===1?'B1':'B2'):(f*100+n+1)+''),x+64,y+17)}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;LAB.numTex=t;return t}
// cômodos de um andar (célula, lado da porta, posição da porta, lados com janela)
const LAB_CELLS=[{k:'NW',x0:-18,x1:-7,z0:-14,z1:-6,door:'s',da:-12.5,win:['e']},{k:'NE',x0:7,x1:18,z0:-14,z1:-6,door:'s',da:12.5,win:['w']},
 {k:'SW',x0:-18,x1:-7,z0:6,z1:14,door:'n',da:-12.5,win:['e']},{k:'SE',x0:7,x1:18,z0:6,z1:14,door:'n',da:12.5,win:['w']},
 {k:'N',x0:-4,x1:4,z0:-14,z1:-6,door:'s',da:0,win:[]},{k:'W',x0:-18,x1:-7,z0:-3,z1:3,door:'e',da:0,win:['n']},{k:'E',x0:7,x1:18,z0:-3,z1:3,door:'w',da:0,win:['s']},
 {k:'S',x0:-4,x1:4,z0:6,z1:14,door:'n',da:0,win:[]},{k:'C',x0:-4,x1:4,z0:-3,z1:3,door:'n',da:0,door2:'s',win:[]}];
function labFloorBuild(F){const g=LAB.grp,H=LAB.H,FX=F.x,FZ=F.z,f=F.f,C=h=>COL(h);
 const mC=new MB(),mG=new MB(),mL=new MB(),mN=new MB(),mF=new MB(),rooms={};F.rooms=rooms;F.cells=LAB_CELLS;
 const box=(mb,x0,y0,z0,x1,y1,z1,c)=>mb.box(FX+x0,y0,FZ+z0,FX+x1,y1,FZ+z1,typeof c==='string'?C(c):c),col=(x0,z0,x1,z1)=>addCol(FX+Math.min(x0,x1),FZ+Math.min(z0,z1),FX+Math.max(x0,x1),FZ+Math.max(z0,z1),'rock');
 const wallCol='#c4d0c8',corCol='#b8c2c4',flo='#8a8e8c',floC='#7e8486',base='#3a4a44';
 // ---- corredores: piso, faixas, teto, luminárias ----
 const cor=[['x',-6,-3],['x',3,6],['z',-7,-4],['z',4,7]];
 for(const[ax,a,b] of cor){if(ax==='x'){box(mC,-18,-.1,a,18,0,b,floC);for(const zz of[a+.35,b-.45])box(mC,-18,0,zz,18,.004,zz+.1,'#d8b020');}
  else{box(mC,a,-.1,-14,b,0,14,floC);for(const xx of[a+.35,b-.45])box(mC,xx,.002,-14,xx+.1,.006,14,'#d8b020')}}
 // faixa azul no chão saindo do hall (rumo ao núcleo) e zebra nos cruzamentos
 box(mC,-.06,.006,-3,.06,.009,6,'#2a6ab0');
 const cbC=new MB();for(const[ax,a,b] of cor){if(ax==='x')cbC.quad([FX-18,H,FZ+a],[FX+18,H,FZ+a],[FX+18,H,FZ+b],[FX-18,H,FZ+b],0,-1,0,[0,0,1,1],C('#a8b0ac'));else{for(const[z0,z1] of[[-14,-6],[-3,3],[6,14]])cbC.quad([FX+a,H,FZ+z0],[FX+b,H,FZ+z0],[FX+b,H,FZ+z1],[FX+a,H,FZ+z1],0,-1,0,[0,0,1,1],C('#a8b0ac'))}}
 /* v78: cada luminária do teto fica exatamente onde está o spot de luz (cL) — antes as calhas e os focos não batiam */
 const LAMP_AT=[[-5.5,-4.5],[5.5,-4.5],[-5.5,4.5],[5.5,4.5],[-13,-4.5],[13,4.5],[-5.5,-11],[5.5,11]];
 const lamps=LAMP_AT.map(([x,z])=>[x,z,Math.abs(z)>8?0:1]);
 const fl=[];lamps.forEach((l,i)=>{const fk=(i*7+f*3)%17===0;const mb=fk?mF:mL;if(fk)fl.push(l);if(l[2])box(mb,l[0]-.6,H-.05,l[1]-.12,l[0]+.6,H-.01,l[1]+.12,'#eaf4ff');else box(mb,l[0]-.12,H-.05,l[1]-.6,l[0]+.12,H-.01,l[1]+.6,'#eaf4ff')});
 const cL=LAMP_AT.map(([x,z])=>[FX+x,H-.3,FZ+z]);
 const RLc={x0:FX-18,z0:FZ-14,x1:FX+18,z1:FZ+14,H,lights:cL,warm:'#cfe6ff',amb:.42,pow:1.25,rad:8,grime:.4};
 // ---- paredes externas do andar ----
 const ow=[[-18.2,-14.2,18.2,-14],[-18.2,14,18.2,14.2],[-18.2,-14,-18,14],[18,-14,18.2,14]];for(const q of ow){box(mC,q[0],0,q[1],q[2],H,q[3],corCol);col(...q)}
 // ---- cômodos: duas cascas por parede (lado do cômodo / lado do corredor), porta numerada, janelas com vidro ----
 LAB_CELLS.forEach((c,ci)=>{const mR=new MB(),cbR=new MB(),num=ci;rooms[c.k]={x0:FX+c.x0,z0:FZ+c.z0,x1:FX+c.x1,z1:FZ+c.z1,mb:mR,c};
  if(c.k==='C'&&f===1){box(mR,c.x0,-.1,c.z0,c.x1,0,.2,flo);box(mR,c.x0,-.1,2.8,c.x1,0,c.z1,flo);box(mR,c.x0,-.1,.2,-3.7,0,2.8,flo);box(mR,-.8,-.1,.2,c.x1,0,2.8,flo)} // vão da escada que desce (B1)
  else box(mR,c.x0,-.1,c.z0,c.x1,0,c.z1,flo);cbR.quad([FX+c.x0,H,FZ+c.z0],[FX+c.x1,H,FZ+c.z0],[FX+c.x1,H,FZ+c.z1],[FX+c.x0,H,FZ+c.z1],0,-1,0,[0,0,1,1],C('#b0b8b4'));
  const sides={n:['x',c.z0,c.x0,c.x1,-1],s:['x',c.z1,c.x0,c.x1,1],w:['z',c.x0,c.z0,c.z1,-1],e:['z',c.x1,c.z0,c.z1,1]};
  for(const sd of['n','s','w','e']){const[ax,fix,a0,a1,out]=sides[sd],outer=(ax==='x'&&Math.abs(fix)>=14)||(ax==='z'&&Math.abs(fix)>=18);if(outer)continue;
   const ops=[];if(c.door===sd)ops.push({a:c.da,w:1.4,t:'d'});if(c.door2===sd)ops.push({a:c.da,w:1.4,t:'d'});
   if(c.win.includes(sd)){const L=a1-a0;for(let t=a0+1.6;t<a1-1.6;t+=2.6)if(!ops.some(o=>Math.abs(o.a-(t+.8))<1.6))ops.push({a:t+.8,w:1.6,t:'w'})}
   ops.sort((p,q)=>p.a-q.a);
   const seg=(s0,s1,y0,y1,inner)=>{if(s1-s0<.01)return;const th=.1,iz=inner?[fix-out*th,fix]:[fix,fix+out*th];const z0=Math.min(...iz),z1=Math.max(...iz);
    if(ax==='x')box(inner?mR:mC,s0,y0,z0,s1,y1,z1,inner?wallCol:corCol);else box(inner?mR:mC,z0,y0,s0,z1,y1,s1,inner?wallCol:corCol)};
   const both=(s0,s1,y0,y1)=>{seg(s0,s1,y0,y1,true);seg(s0,s1,y0,y1,false)},cc=(s0,s1)=>{if(s1-s0<.01)return;if(ax==='x')col(s0,fix-.1,s1,fix+.1);else col(fix-.1,s0,fix+.1,s1)};
   let t=a0;for(const o of ops){const o0=o.a-o.w/2,o1=o.a+o.w/2;both(t,o0,0,H);cc(t,o0);
    if(o.t==='d'){both(o0,o1,2.3,H);const fr=(s0,s1,y0,y1)=>{if(ax==='x')box(mC,s0,y0,fix+out*.1-.04,s1,y1,fix+out*.1+.04,'#3a4248');else box(mC,fix+out*.1-.04,y0,s0,fix+out*.1+.04,y1,s1,'#3a4248')};
     fr(o0-.08,o0,0,2.3);fr(o1,o1+.08,0,2.3);fr(o0-.08,o1+.08,2.3,2.38);
     // placa numerada acima da porta (lado do corredor)
     const tile=(f-1)*16+(c.k==='S'&&f===1?15:Math.min(14,num)),u0=(tile%4)/4,v0=1-(Math.floor(tile/4)+1)/8,u1=u0+.25,v1=v0+.125,yy0=2.48,yy1=2.72,dd=fix+out*.115;
     if(ax==='x'){const A=[FX+o.a-.36,yy0,FZ+dd],B=[FX+o.a+.36,yy0,FZ+dd],Cq=[FX+o.a+.36,yy1,FZ+dd],D=[FX+o.a-.36,yy1,FZ+dd];if(out>0)mN.quad(A,B,Cq,D,0,0,1,[u0,v0,u1,v1],C('#ffffff'));else mN.quad(B,A,D,Cq,0,0,-1,[u0,v0,u1,v1],C('#ffffff'))}
     else{const A=[FX+dd,yy0,FZ+o.a+.36],B=[FX+dd,yy0,FZ+o.a-.36],Cq=[FX+dd,yy1,FZ+o.a-.36],D=[FX+dd,yy1,FZ+o.a+.36];if(out>0)mN.quad(B,A,D,Cq,1,0,0,[u0,v0,u1,v1],C('#ffffff'));else mN.quad(A,B,Cq,D,-1,0,0,[u0,v0,u1,v1],C('#ffffff'))}}
    else{both(o0,o1,0,.95);both(o0,o1,2.15,H);cc(o0,o1);if(ax==='x')box(mG,o0,.95,fix-.02,o1,2.15,fix+.02,'#9ad0e0');else box(mG,fix-.02,.95,o0,fix+.02,2.15,o1,'#9ad0e0');
     const fr=(s0,s1,y0,y1)=>{for(const sg of[-1,1]){const d0=fix+sg*.1,d1=fix+sg*.13;if(ax==='x')box(sg===out?mC:mR,s0,y0,Math.min(d0,d1),s1,y1,Math.max(d0,d1),'#5a6268');else box(sg===out?mC:mR,Math.min(d0,d1),y0,s0,Math.max(d0,d1),y1,s1,'#5a6268')}};
     fr(o0,o1,.92,.98);fr(o0,o1,2.12,2.18);fr(o0-.04,o0+.04,.95,2.15);fr(o1-.04,o1+.04,.95,2.15)}
    t=o1}
   both(t,a1,0,H);cc(t,a1);
   // rodapé escuro dos dois lados
   const rb=(inner)=>{const iz=inner?[fix-out*.11,fix-out*.1]:[fix+out*.1,fix+out*.11];if(ax==='x')box(inner?mR:mC,a0,0,Math.min(...iz),a1,.14,Math.max(...iz),base);else box(inner?mR:mC,Math.min(...iz),0,a0,Math.max(...iz),.14,a1,base)};rb(true);rb(false)}
  // luz do cômodo (1–2 luminárias no teto)
  const w=c.x1-c.x0,d=c.z1-c.z0,pts=w>9?[[c.x0+w*.3,(c.z0+c.z1)/2],[c.x0+w*.7,(c.z0+c.z1)/2]]:[[(c.x0+c.x1)/2,(c.z0+c.z1)/2]];
  for(const[x,z] of pts)box(mL,x-.6,H-.05,z-.15,x+.6,H-.01,z+.15,'#eaf4ff');
  rooms[c.k].lights=pts.map(([x,z])=>[FX+x,H-.3,FZ+z]);rooms[c.k].cb=cbR});
 return {mC,cbC,mG,mL,mN,mF,RLc,fl}}
function labFloorFinish(F,P){const g=LAB.grp,H=LAB.H;
 const mc=roomLitMat(P.RLc);g.add(P.mC.mesh(mc));g.add(P.cbC.mesh(roomLitMat(P.RLc,{side:THREE.DoubleSide})));F.corMat=mc;
 for(const k in F.rooms){const r=F.rooms[k],RL={x0:r.x0,z0:r.z0,x1:r.x1,z1:r.z1,H,lights:r.lights.concat(r.extra||[]).slice(0,8),warm:r.warm||'#cfe6ff',amb:r.amb??.42,pow:r.pow??1.25,rad:r.rad??7,grime:r.grime??.4};
  const m=r.mb.mesh(roomLitMat(RL));if(m)g.add(m);const c=r.cb.mesh(roomLitMat(RL,{side:THREE.DoubleSide}));if(c)g.add(c);r.mat=m&&m.material;r.litU=[m,c].filter(Boolean).map(o=>o.material.userData.U)}
 const gm=P.mG.mesh(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.28,depthWrite:false}));if(gm){gm.renderOrder=2;g.add(gm)}
 const lm=P.mL.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));if(lm)g.add(lm);
 const nm=P.mN.mesh(new THREE.MeshBasicMaterial({map:labNumTex(),vertexColors:true}));if(nm)g.add(nm);
 const fm=P.mF.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));if(fm){g.add(fm);LAB.flick.push({m:fm.material,u:F.corMat.userData.U,ph:F.f*1.7})}}
function labBuild(){if(LAB.grp)return;const g=new THREE.Group();g.visible=false;scene.add(g);LAB.grp=g;LAB.F=[];LAB.flick=[];LAB.tankBroken=false;LAB.tankT=0;LAB.tankBrokenG=null;LAB.pokeT=0;
 const H=3.2,base={x:SAFE.IN.x-300,z:SAFE.IN.z+200};LAB.H=H;
 for(let f=1;f<=2;f++){const F={x:base.x,z:base.z+(f-1)*70,f};LAB.F.push(F);const P=labFloorBuild(F);labRoomsDress(F);labFloorFinish(F,P);labDressFinish(F)}
 const F=LAB.F[0],FX=F.x,FZ=F.z,r=F.rooms.S;
 // escada de marinheiro do hall (saída) — v79r2: a malha da sala já foi fechada em labFloorFinish, então a escada, a faixa e o fundo da escotilha no teto viram uma malha própria (antes sumiam e a seta ficava sozinha na parede)
 {const lb=new MB(),Z0=FZ+14;for(const s of[-1,1]){lb.box(FX+s*.34-.035,0,Z0-.2,FX+s*.34+.035,H,Z0-.13,COL('#5a5e60'));for(const y of[.9,2.2])lb.box(FX+s*.34-.03,y,Z0-.13,FX+s*.34+.03,y+.05,Z0,COL('#4a4e50'))}for(let y=.3;y<H-.1;y+=.3)lb.box(FX-.34,y,Z0-.19,FX+.34,y+.04,Z0-.14,COL('#7a7e80'));
  lb.box(FX-.62,H-.06,Z0-.95,FX+.62,H-.01,Z0-.02,COL('#3a3e40'));lb.box(FX-.5,H-.08,Z0-.83,FX+.5,H-.06,Z0-.12,COL('#4e5456'));lb.box(FX-.62,H-.1,Z0-.97,FX+.62,H-.06,Z0-.9,COL('#e8c020'));lb.box(FX-.62,H-.1,Z0-.12,FX+.62,H-.06,Z0-.04,COL('#e8c020'));
  lb.geo(GEO.cyl16,mtx(FX,H-.13,Z0-.48,.24,.03,.24,0,0,0),COL('#8a8e92'));lb.box(FX-.24,H-.13,Z0-.5,FX+.24,H-.11,Z0-.46,COL('#8a8e92'));lb.box(FX-.02,H-.13,Z0-.72,FX+.02,H-.11,Z0-.24,COL('#8a8e92'));
  for(let k=0;k<8;k++){const x=-1+k*.25;lb.box(FX+x,0,FZ+12.4,FX+x+.12,.006,FZ+12.55,COL(k%2?'#1a1a1a':'#e8c020'))}
  const lm=lb.mesh(r.mat||new THREE.MeshLambertMaterial({vertexColors:true}));if(lm)LAB.grp.add(lm);addCol(FX-.4,Z0-.22,FX+.4,Z0,'rock')}
 LAB.exit={x:FX,z:FZ+13.3};LAB.spawn={x:FX,z:FZ+11.8};LAB.bounds=LAB.F.map(F=>({x0:F.x-18,z0:F.z-14,x1:F.x+18,z1:F.z+14}));
 if(!LAB.arrIn)LAB.arrIn=makeArrow();LAB.arrIn.position.set(LAB.exit.x,1.5,LAB.exit.z);LAB.arrIn.visible=false}
function labIslandTex(){if(LAB.mapTex)return LAB.mapTex;const N=160,c=cv(N,N),g=c.getContext('2d'),E=city.ext||228,o=RW/2,m=(typeof SHORE!=='undefined'?SHORE:40)+30,id=g.createImageData(N,N),d=id.data;
 // mesmo desenho do minimapa de Point Haze: mar, areia, ilha com relevo (sem marcações)
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-m+(E+2*m)*i/N,z=-m+(E+2*m)*j/N,u=city.haze?hazeU(x,z):9;let r,gg,b;
  if(u>SHORE){r=74;gg=116;b=136}else if(u>SAND0){r=184;gg=168;b=112}else if(u>o){r=154;gg=132;b=88}else{const h=hazeH(x,z),sh=Math.max(-.35,Math.min(.35,(h-hazeH(x-1.5,z-1.5))*.9)),k=Math.min(1,h/12),L=1+sh;r=(140-30*k)*L;gg=(122-14*k)*L;b=(80+18*k)*L;if(hazeCliff(x,z)>.5&&h>2){r=96*L;gg=92*L;b=86*L}}
  const q=(j*N+i)*4;d[q]=r;d[q+1]=gg;d[q+2]=b;d[q+3]=255}
 g.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;LAB.mapTex=t;return t}
function labCityTex(){if(LAB.cityTex)return LAB.cityTex;if(!LAB.homeMap)return null;const t=new THREE.CanvasTexture(LAB.homeMap);t.magFilter=THREE.NearestFilter;LAB.cityTex=t;return t}
function labRoomsDress(F){const g=LAB.grp,H=LAB.H,C=h=>COL(h);F.mE=new MB();F.mT=new MB();const EM=F.mE,TM=F.mT,rnd=mulberry32((city.hzSeed^(F.f*7919))>>>0),pk=a=>a[Math.floor(rnd()*a.length)];
 const K=k=>{const r=F.rooms[k],mb=r.mb,X=r.x0,Z=r.z0;return{r,W:r.x1-r.x0,D:r.z1-r.z0,
  B:(x0,y0,z0,x1,y1,z1,c)=>mb.box(X+Math.min(x0,x1),Math.min(y0,y1),Z+Math.min(z0,z1),X+Math.max(x0,x1),Math.max(y0,y1),Z+Math.max(z0,z1),C(c)),
  E:(x0,y0,z0,x1,y1,z1,c)=>EM.box(X+Math.min(x0,x1),Math.min(y0,y1),Z+Math.min(z0,z1),X+Math.max(x0,x1),Math.max(y0,y1),Z+Math.max(z0,z1),C(c)),
  G:(geo,x,y,z,sx,sy,sz,c,rx=0,ry=0,rz=0,em)=>(em==='t'?TM:em?EM:mb).geo(geo,mtx(X+x,y,Z+z,sx,sy,sz,rx,ry,rz),C(c)),
  col:(x0,z0,x1,z1)=>addCol(X+Math.min(x0,x1),Z+Math.min(z0,z1),X+Math.max(x0,x1),Z+Math.max(z0,z1),'rock'),X,Z}};
 const chair=(R,x,z,face)=>{R.B(x-.24,.42,z-.24,x+.24,.48,z+.24,'#2a2e34');for(const[a,b] of[[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]])R.B(x+a-.02,0,z+b-.02,x+a+.02,.42,z+b+.02,'#5a5e62');
  const bz=face==='n'?z+.22:face==='s'?z-.26:z,bx=face==='w'?x+.22:face==='e'?x-.26:x;if(face==='n'||face==='s')R.B(x-.24,.48,bz,x+.24,1.0,bz+.04,'#2a2e34');else R.B(bx,.48,z-.24,bx+.04,1.0,z+.24,'#2a2e34')};
 if(F.f===1){
  // ===== 101 · CPD (NW): racks com LEDs, terminais de tubo, cabos no teto =====
  {const R=K('NW'),LED=['#2aff6a','#2aff6a','#2aff6a','#ffb020','#ff3030','#2ad6ff'];R.r.warm='#b8d4ff';R.r.amb=.3;
   for(const[z0,z1] of[[1.0,1.7],[3.6,4.3]])for(let x=1.0;x+2.6<=9.9;x+=2.85){R.B(x,0,z0,x+2.6,2.1,z1,'#20242a');R.B(x-.02,2.1,z0-.02,x+2.62,2.16,z1+.02,'#3a3e44');R.col(x,z0,x+2.6,z1);
    for(const zf of[z0-.01,z1+.005])for(let y=.35;y<2;y+=.22)for(let xx=x+.15;xx<x+2.5;xx+=.18)if(rnd()<.55)R.E(xx,y,zf,xx+.05,y+.04,zf+.006,pk(LED));
    for(let y=.3;y<2;y+=.44)for(const zf of[z0-.012,z1+.006])R.B(x+.05,y,zf,x+2.55,y+.02,zf+.006,'#3a3e44')}
   R.B(.5,H-.42,2.55,10.5,H-.36,3.25,'#4a4e52');for(let x=1;x<10.5;x+=1.4)R.B(x,H-.36,2.9,x+.04,H,2.94,'#3a3e44');
   for(let k=0;k<7;k++){const z=2.6+k*.09,c=pk(['#141418','#1a1a1e','#2a2a6a','#6a1a1a','#d8d020']);for(let x=.6;x<10.4;x+=.7)R.B(x,H-.36-(Math.sin((x-.6)/9.8*Math.PI)*.08),z,x+.72,H-.33-(Math.sin((x-.6)/9.8*Math.PI)*.08),z+.05,c)}
   for(const xx of[2.2,5.0,7.9])for(const zz of[1.35,3.95])R.B(xx,2.16,zz-.04,xx+.06,H-.42,zz+.04,'#141418');
   R.B(.6,0,6.1,4.4,.74,7.0,'#5a5e62');R.B(.55,.74,6.05,4.45,.78,7.05,'#2a2e34');R.col(.55,6.05,4.45,7.05);
   for(const x of[1.4,3.4]){R.B(x-.32,.78,6.25,x+.32,1.32,6.85,'#d8d2c0');R.B(x-.26,.82,6.85,x+.26,1.28,6.95,'#c8c2b0');R.E(x-.24,.86,6.235,x+.24,1.24,6.245,'#1e8a3a');
    for(let k=0;k<5;k++)R.E(x-.19,1.15-k*.06,6.229,x-.19+.1+rnd()*.25,1.17-k*.06,6.235,'#7aff9a');R.B(x-.25,.78,5.95,x+.25,.81,6.15,'#3a3a3e');chair(R,x,5.4,'n')}}
  // ===== 102 · ENFERMARIA (NE): macas, soro, biombo, armário com cruz, pia =====
  {const R=K('NE');R.r.warm='#f2f8ff';R.r.amb=.5;
   for(const x of[1.4,4.4,7.4]){for(const[a,b] of[[.05,.6],[.85,.6],[.05,2.3],[.85,2.3]])R.B(x+a-.03,0,b-.03,x+a+.03,.62,b+.03,'#a8acb0');R.B(x,.6,.5,x+.9,.66,2.4,'#b8bcc0');R.B(x+.05,.66,.55,x+.85,.8,2.35,'#e8eef0');R.B(x+.15,.8,.6,x+.75,.9,.95,'#f8f8f8');R.B(x+.05,.8,1.4,x+.85,.84,2.3,'#9ac8d8');R.col(x,.5,x+.9,2.4);
    const sx=x+1.15;R.B(sx-.02,0,1.0,sx+.02,1.95,1.04,'#c8c8d0');R.B(sx-.2,1.9,1.0,sx+.2,1.93,1.04,'#c8c8d0');R.B(sx+.08,1.5,.97,sx+.2,1.82,1.07,'#d8f0f8');R.B(sx+.13,1.1,1.0,sx+.15,1.5,1.02,'#e8e8f0');R.B(sx-.2,0,.85,sx+.2,.04,1.2,'#8a8e92')}
   for(let k=0;k<3;k++){const x=9.0+k*.55,z=3.2+(k%2)*.35;R.G(GEO.box,x,.95,z+.6,.55,1.8,.04,'#9ac0a8',0,(k%2?.5:-.5),0);R.G(GEO.box,x,1.86,z+.6,.58,.04,.06,'#c8c8d0',0,(k%2?.5:-.5),0)}R.col(8.7,3.1,10.7,4.5);
   R.B(10.35,0,5.5,10.95,1.9,7.6,'#e8ecec');R.B(10.33,1.25,6.45,10.35,1.65,6.65,'#d02020');R.B(10.33,1.35,6.35,10.35,1.55,6.75,'#d02020');R.col(10.3,5.5,11,7.6);
   R.B(.1,.8,5.6,.65,.95,6.6,'#d8dce0');R.B(.1,0,5.65,.6,.8,6.55,'#e8ecec');R.B(.05,1.2,5.7,.08,1.9,6.5,'#b8d8e8');R.col(.1,5.6,.65,6.6)}
  // ===== 103 · LAB QUÍMICO (SW): bancadas, vidraria, capela, tanque verde =====
  {const R=K('SW'),liq=['#3aff6a','#2ad6ff','#ff4fa3','#ffd21a','#b06aff'];R.r.warm='#d8ffe8';R.r.amb=.4;
   for(const[z0,z1] of[[2.2,3.2],[4.8,5.8]]){R.B(1.2,0,z0,8.6,.85,z1,'#e4e4de');R.B(1.15,.85,z0-.05,8.65,.92,z1+.05,'#1c1c20');R.col(1.15,z0-.05,8.65,z1+.05);
    for(let x=1.5;x<8.4;x+=.42){if(rnd()<.3)continue;const z=z0+.2+rnd()*(z1-z0-.4),t=rnd(),lc=pk(liq);
     if(t<.35){R.G(GEO.cone,x,1.05,z,.11,.26,.11,'#cfe4ea');R.G(GEO.cone,x,1.0,z,.09,.14,.09,lc,0,0,0,true);R.G(GEO.cyl16,x,1.25,z,.03,.16,.03,'#cfe4ea')}
     else if(t<.7){R.G(GEO.cyl16,x,1.02,z,.07,.2,.07,'#d8ecf2');R.G(GEO.cyl16,x,.98,z,.062,.1,.062,lc,0,0,0,true)}
     else{R.B(x-.15,.92,z-.05,x+.15,1.0,z+.05,'#8a6a40');for(let k=0;k<4;k++)R.G(GEO.cyl16,x-.11+k*.075,1.06,z,.018,.2,.018,pk(liq),0,0,0,true)}}}
   R.B(.1,0,5.6,1.1,.9,7.7,'#d8d8d2');R.B(.1,.9,5.6,1.1,.95,7.7,'#2a2a2e');R.B(.1,.95,5.6,.2,2.2,7.7,'#c8c8c2');R.B(.95,1.25,5.6,1.0,2.0,7.7,'#3a5058');R.B(.1,2.2,5.5,1.2,2.9,7.8,'#b8b8b2');R.col(.1,5.5,1.2,7.8);
   {const tx=9.7,tz=6.8;R.G(GEO.cyl16,tx,.2,tz,.95,.4,.95,'#4a4e52');R.G(GEO.cyl16,tx,1.3,tz,.78,1.8,.78,'#2ad46a',0,0,0,'t');R.G(GEO.cyl16,tx,2.3,tz,.95,.2,.95,'#4a4e52');for(let k=0;k<4;k++){const a=k*1.57;R.B(tx+Math.cos(a)*.86-.04,.4,tz+Math.sin(a)*.86-.04,tx+Math.cos(a)*.86+.04,2.2,tz+Math.sin(a)*.86+.04,'#5a5e62')}
    for(let k=0;k<9;k++)R.G(GEO.sph,tx+(rnd()-.5)*.9,.6+rnd()*1.4,tz+(rnd()-.5)*.9,.05,.05,.05,'#c8ffd8',0,0,0,true);R.G(GEO.cyl16,tx,2.6,tz,.12,.6,.12,'#5a5e62');R.col(tx-1,tz-1,tx+1,tz+1);R.r.extra=[[R.X+tx,1.4,R.Z+tz]]}}
  // ===== 104 · SALA DE CONTROLE (SE): consoles, telas, mesa com o mapa da ilha =====
  {const R=K('SE'),BT=['#ff3030','#2aff6a','#ffd21a','#2ad6ff','#ffffff'];R.r.warm='#c8dcff';R.r.amb=.34;
   R.B(.6,0,7.0,10.4,.9,7.9,'#30343a');R.col(.6,7.0,10.4,7.9);
   for(let x=.7;x<10.3;x+=.9){R.G(GEO.box,x+.42,1.05,7.25,.86,.06,.6,'#3a3e44',-.5,0,0);for(let k=0;k<6;k++)R.G(GEO.box,x+.15+(k%3)*.25,1.1+(k>2?.08:0),7.12+(k>2?.12:0),.08,.03,.06,pk(BT),-.5,0,0,true)}
   for(let x=1;x<10;x+=2.2){R.B(x,1.5,7.88,x+1.8,2.6,7.98,'#1a1c20');R.E(x+.08,1.58,7.875,x+1.72,2.52,7.882,pk(['#123a5a','#0e4a2a','#1a2a4a']));for(let k=0;k<4;k++)R.E(x+.2,1.75+k*.18,7.87,x+.2+.4+rnd()*1.0,1.79+k*.18,7.874,'#7ad8ff')}
   for(const x of[2.2,5.0,7.8])chair(R,x,6.3,'s');
   R.B(3.4,0,2.4,7.6,.85,5.1,'#2a2e34');R.B(3.3,.85,2.3,7.7,.9,5.2,'#1a1c20');R.col(3.3,2.3,7.7,5.2);
   {const HC=LAB.homeCity;if(HC){/* v78: maquete 3D minimalista da cidade sobre a mesa — base branca (ruas), quarteirões cinza em blocos de alturas variadas, verde nos parques/mato; tudo em 3 tons */
    const S2=2.5/HC.E,ox=5.5-1.25,oz=3.75-1.25,y0=.9,mr=mulberry32(4242),gry=['#9a9ea2','#8a8e92','#a8acb0'];R.B(ox-.04,y0,oz-.04,ox+2.54,y0+.02,oz+2.54,'#eef0f0');
    for(const w of HC.water){const c=v=>Math.max(0,Math.min(HC.E,v)),a0=c(w[0]),b0=c(w[1]),a1=c(w[2]),b1=c(w[3]);if(a1-a0>.5&&b1-b0>.5)R.B(ox+a0*S2,y0+.02,oz+b0*S2,ox+a1*S2,y0+.022,oz+b1*S2,'#c8d8d8')}
    for(const q of HC.rects){const a0=ox+q[0]*S2+.004,b0=oz+q[1]*S2+.004,a1=ox+q[2]*S2-.004,b1=oz+q[3]*S2-.004;if(a1-a0<.01||b1-b0<.01)continue;const k=q[4];
     if(k==='rural'||q[6]==='cem'||q[6]==='park'){R.B(a0,y0+.02,b0,a1,y0+.03,b1,'#6a9a5a');if(q[5])for(let n=0;n<3;n++){const x=a0+mr()*(a1-a0),z=b0+mr()*(b1-b0);R.B(x-.008,y0+.03,z-.008,x+.008,y0+.05,z+.008,'#4a7a40')}continue}
     const nx=Math.max(1,Math.round((a1-a0)/.05)),nz=Math.max(1,Math.round((b1-b0)/.05)),w=(a1-a0)/nx,d=(b1-b0)/nz;
     for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(k!=='bld'&&k!=='lm'&&mr()<.35)continue;const h=k==='bld'?.02+mr()*mr()*.16:k==='lm'?.03+mr()*.05:k==='houses'?.012:.02+mr()*.02;
      R.B(a0+i*w+.002,y0+.02,b0+j*d+.002,a0+(i+1)*w-.002,y0+.02+h,b0+(j+1)*d-.002,k==='houses'?'#f4f4f2':gry[Math.floor(mr()*3)])}}}
   else{const mm=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.5),new THREE.MeshBasicMaterial({map:labIslandTex()}));mm.rotation.x=-Math.PI/2;mm.position.set(R.X+5.5,.905,R.Z+3.75);g.add(mm)}}
   {const mm=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:labIslandTex()}));mm.rotation.y=-Math.PI/2;mm.position.set(R.X+10.84,1.7,R.Z+3.5);g.add(mm);R.B(10.86,.4,2.2,10.95,3.0,4.8,'#1a1c20')}}
  // ===== 105 · COPA (N) · 106 · VESTIÁRIO (W) · 107 · SEGURANÇA (E) =====
  {const R=K('N');R.B(.2,0,.15,4.2,.9,.75,'#c8c0b0');R.B(.15,.9,.1,4.25,.95,.8,'#5a5048');R.col(.15,.1,4.25,.8);R.B(4.6,0,.15,5.5,1.9,.85,'#e8e8e4');R.B(5.45,.9,.25,5.5,1.6,.3,'#a8a8a8');R.col(4.6,.15,5.5,.85);
   R.B(1.0,.95,.25,1.4,1.35,.6,'#2a2a2e');R.E(1.12,1.2,.6,1.28,1.26,.605,'#ff3030');R.G(GEO.cyl16,2.2,1.02,.45,.05,.12,.05,'#e8e0d0');
   R.B(2.4,0,3.4,5.6,.74,4.6,'#a08a6a');R.B(2.35,.74,3.35,5.65,.78,4.65,'#c8b090');R.col(2.35,3.35,5.65,4.65);for(const[x,z,f] of[[3,2.8,'n'],[5,2.8,'n'],[3,5.2,'s'],[5,5.2,'s']])chair(R,x,z,f);R.G(GEO.cyl16,4,.84,4,.05,.1,.05,'#e8e8e8')}
  {const R=K('W');for(let k=0;k<7;k++){const z=.3+k*.75;R.B(.1,0,z,.65,1.95,z+.7,pk(['#5a6a7a','#56667a','#4e5e70']));R.B(.64,1.5,z+.1,.66,1.7,z+.6,'#3a4a5a');R.B(.64,.9,z+.55,.67,1.05,z+.6,'#c8c8c8')}R.col(.1,.3,.65,5.6);
   R.B(4,0,2.6,8,.42,3.4,'#8a6a40');R.col(4,2.6,8,3.4);for(const x of[4.3,7.6])R.B(x,0,2.7,x+.1,.4,3.3,'#5a5e62');R.B(9.5,0,.2,10.8,1.8,.6,'#d8d8d4');R.col(9.5,.2,10.8,.6)}
  {const R=K('E');R.B(2,0,.3,8,.75,1.2,'#4a4e54');R.B(1.95,.75,.25,8.05,.79,1.25,'#2a2e34');R.col(1.95,.25,8.05,1.25);
   for(let k=0;k<6;k++){const x=2.3+k*.95;R.B(x,.79,.35,x+.8,1.4,.85,'#1a1c20');R.E(x+.06,.85,.86,x+.74,1.34,.865,pk(['#3a4a3a','#4a5a4a','#2a3a4a']))}
   for(let k=0;k<6;k++){const x=2.3+k*.95;R.B(x+.1,1.45,.4,x+.7,1.95,.85,'#1a1c20');R.E(x+.14,1.5,.86,x+.66,1.9,.865,pk(['#3a4a3a','#2a3a4a']))}chair(R,4,1.9,'s');chair(R,6,1.9,'s');
   R.B(9.6,0,4.6,10.8,1.3,5.8,'#7a7e82');for(let k=0;k<3;k++)R.B(9.59,.2+k*.4,4.8,9.6,.5+k*.4,5.6,'#9a9ea2');R.col(9.6,4.6,10.8,5.8);
   /* v2 r2: gaveta do meio entreaberta com o cartão da sala da fenda (B2) */
   R.B(9.2,.62,4.85,9.6,.66,5.55,'#8a8e92');R.B(9.18,.62,4.85,9.22,.9,5.55,'#9a9ea2');R.B(9.2,.62,4.83,9.6,.9,4.87,'#8a8e92');R.B(9.2,.62,5.53,9.6,.9,5.57,'#8a8e92');
   {const cm=new THREE.Mesh(new THREE.BoxGeometry(.13,.008,.2),new THREE.MeshBasicMaterial({color:0x2a7ad8}));cm.position.set(R.X+9.4,.67,R.Z+5.2);cm.rotation.y=.3;g.add(cm);
    const st=new THREE.Mesh(new THREE.BoxGeometry(.13,.009,.04),new THREE.MeshBasicMaterial({color:0xf0f0f0}));st.position.set(0,.004,.06);cm.add(st);LAB.cardAt={x:R.X+9.0,z:R.Z+5.2,f:1,mesh:cm}}}}
 if(F.f===2){
  // ===== 201 · CONTENÇÃO (NW): cápsula com algo boiando, painel, faixa de quarentena =====
  {const R=K('NW');R.r.warm='#a8d8ff';R.r.amb=.28;const cx=5.5,cz=3.6;
   R.G(GEO.cyl16,cx,.25,cz,1.4,.5,1.4,'#3a3e44');R.G(GEO.cyl16,cx,2.75,cz,1.4,.3,1.4,'#3a3e44');{const gm=new THREE.Mesh(GEO.cyl16,new THREE.MeshBasicMaterial({color:0x3ab8d8,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide}));gm.scale.set(1.12,2.0,1.12);gm.position.set(R.X+cx,1.5,R.Z+cz);gm.renderOrder=3;LAB.grp.add(gm);LAB.tankGlass=gm} /* v2 r2: vidro da cápsula é malha própria (troca pelo quebrado no evento do tanque) */
   for(let k=0;k<6;k++){const a=k/6*6.28;R.B(cx+Math.cos(a)*1.2-.05,.5,cz+Math.sin(a)*1.2-.05,cx+Math.cos(a)*1.2+.05,2.6,cz+Math.sin(a)*1.2+.05,'#5a5e62')}
   // vulto escuro boiando (encolhido, braços compridos)
   LAB.tankAt={x:R.X+cx,z:R.Z+cz}; /* v78: dentro da cápsula boia o demogorgon do próprio jogo (o da floresta) — labTankDemo */
   {const bm=new MB();for(let k=0;k<12;k++)bm.geo(GEO.sph,mtx(R.X+cx+(rnd()-.5)*1.4,.7+rnd()*1.9,R.Z+cz+(rnd()-.5)*1.4,.04,.04,.04),COL('#d8fbff'));const bmm=bm.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));if(bmm){LAB.grp.add(bmm);LAB.tankBub=bmm}}LAB.tankRoom=R.r;LAB.tankC={x:R.X+cx,z:R.Z+cz};R.col(cx-1.5,cz-1.5,cx+1.5,cz+1.5);
   for(let k=0;k<10;k++){const a=k/10*6.28;R.B(cx+Math.cos(a)*2.2-.12,0,cz+Math.sin(a)*2.2-.12,cx+Math.cos(a)*2.2+.12,.006,cz+Math.sin(a)*2.2+.12,k%2?'#1a1a1a':'#e8c020')}
   R.B(9.4,0,.4,10.8,1.1,1.6,'#30343a');R.B(9.55,1.1,.6,10.65,1.14,1.4,'#3a3e44');for(let k=0;k<5;k++)R.E(9.7+k*.2,1.14,.8+(k%2)*.2,9.8+k*.2,1.17,.9+(k%2)*.2,pk(['#ff3030','#2aff6a','#ffd21a'])); /* v79r2: painel/teclado deitado na mesa (antes ficava inclinado) */R.col(9.4,.4,10.8,1.6);
   R.r.extra=[[R.X+cx,1.6,R.Z+cz]]}
  // ===== 202 · ANIMAIS (NE): gaiolas empilhadas, uma arrombada, ração, pegadas =====
  {const R=K('NE');R.r.warm='#e8eef0';R.r.amb=.36;const bars='#8a8e92';
   const cage=(x,y,z,w,h,d,broken)=>{R.B(x,y,z,x+w,y+.05,z+d,'#5a5e62');R.B(x,y+h-.04,z,x+w,y+h,z+d,'#5a5e62');R.B(x+.05,y+.05,z+.05,x+w-.05,y+.07,z+d-.05,'#a08a5a');
    for(let t=x;t<=x+w+.001;t+=.12){if(broken&&t>x+.25&&t<x+w-.25)continue;R.B(t-.01,y,z+d-.02,t+.01,y+h,z+d,bars);R.B(t-.01,y,z,t+.01,y+h,z+.02,bars)}for(let t=z;t<=z+d+.001;t+=.12){R.B(x,y,t-.01,x+.02,y+h,t+.01,bars);R.B(x+w-.02,y,t-.01,x+w,y+h,t+.01,bars)}
    if(broken){for(let k=0;k<4;k++)R.G(GEO.box,x+.3+k*.15,y+h*.5,z+d+.12,.02,h*.8,.02,bars,.9+rnd()*.4,0,(rnd()-.5)*.8)}};
   for(let k=0;k<4;k++)for(let l=0;l<2;l++)cage(.4+k*1.3,l*1.05,.3,1.1,.95,1.0,k===2&&l===0);R.col(.4,.3,5.6,1.3);
   for(let k=0;k<3;k++)cage(8.0+k*.95,0,.3,.8,.7,.8,false);R.col(8,.3,10.9,1.1);
   R.B(1.0,0,6.6,2.6,.9,7.6,'#c8c4b8');for(let k=0;k<3;k++)R.B(1.1+k*.5,.9,6.7,1.5+k*.5,1.25,7.1,'#c8a060');R.col(1,6.6,2.6,7.6);
   for(let k=0;k<9;k++){const x=3.6+k*.55,z=1.6+k*.62+(k%2)*.2;for(const d of[[0,0],[.06,-.06],[-.06,-.06],[0,-.1]])R.B(x+d[0]-.03,0,z+d[1]-.03,x+d[0]+.03,.004,z+d[1]+.03,'#3a2a20')}
   R.B(9.6,0,6.4,10.9,1.9,7.7,'#d8dcd8');R.B(9.59,1.2,6.6,9.6,1.7,7.5,'#9ad0e0');R.col(9.6,6.4,10.9,7.7)}
  // ===== 203 · ARQUIVO (SW): estantes de pastas, gaveteiros, quadro de fotos ligadas por barbante =====
  {const R=K('SW');R.r.warm='#ffe8c8';R.r.amb=.36;const PF=['#c8a050','#a03030','#3a5a8a','#d8d0b0','#3a6a3a'];
   for(const x of[1.6,4.1,6.6]){R.B(x,0,2.4,x+.8,1.75,5.0,'#5a5e62');R.col(x,2.4,x+.8,5.0);for(let y=.15;y<1.3;y+=.5){ /* v79r2: estantes mais estreitas/baixas/curtas (0,8 × 2,6 × 1,75 m) com corredores largos — antes 1,8 × 4,6 × 2,3 travavam a exploração */R.B(x-.02,y,2.4,x+.82,y+.04,5.0,'#4a4e52');for(let z=2.5;z<4.9;z+=.09+rnd()*.05)if(rnd()<.85){const h=.24+rnd()*.1;R.B(x-.01,y+.04,z,x+.01,y+.04+h,z+.06,pk(PF));R.B(x+.79,y+.04,z,x+.81,y+.04+h,z+.06,pk(PF))}}}
   for(let k=0;k<3;k++){const x=8.6+k*.75;R.B(x,0,7.35,x+.6,1.1,7.85,'#7a7e82');for(let l=0;l<3;l++)R.B(x+.08,.12+l*.32,7.34,x+.52,.36+l*.32,7.35,'#8a8e92')}R.col(8.6,7.35,10.9,7.85);
   for(let k=0;k<6;k++)R.G(GEO.box,8.5+rnd()*2,.02,4+rnd()*2,.3,.01,.22,'#e8e0c8',0,rnd()*3,0);
   {const bx=10.88;R.B(bx,1.0,1.0,bx+.06,2.4,4.2,'#8a6a40');R.B(bx-.01,1.06,1.06,bx,2.34,4.14,'#c8a878');const pts=[];for(let k=0;k<9;k++){const z=1.3+rnd()*2.6,y=1.25+rnd()*.95;pts.push([y,z]);R.B(bx-.015,y-.12,z-.1,bx-.01,y+.12,z+.1,pk(['#e8e8e0','#d8d8c8','#c8c8c0']));R.B(bx-.017,y+.08,z-.015,bx-.015,y+.11,z+.015,'#d02020')}
    for(let k=0;k<pts.length-1;k++){const[a,b]=[pts[k],pts[(k*4+3)%pts.length]],dy=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dy,dz);R.G(GEO.box,bx-.02,(a[0]+b[0])/2+.095,(a[1]+b[1])/2,.004,.012,L,'#d02020',Math.atan2(-dy,dz),0,0)}}
   R.B(7.4,0,.4,9.4,.75,1.4,'#6a4a2a');R.B(7.35,.75,.35,9.45,.79,1.45,'#8a6a40');R.col(7.35,.35,9.45,1.45);chair(R,8.4,1.9,'s');R.B(7.8,.79,.6,8.4,.81,1.0,'#e8e0c8');R.G(GEO.cyl16,9,.84,.8,.12,.1,.12,'#2a2a2a')}
  // ===== 204 · GERADOR (SE): 2 bobinas de Tesla com faíscas, transformador, cabos grossos, grade =====
  {const R=K('SE');R.r.warm='#d8e0ff';R.r.amb=.3;LAB.sparks=LAB.sparks||[];
   for(const[cx,cz] of[[3.2,4.4],[7.8,4.4]]){R.G(GEO.cyl16,cx,.3,cz,.9,.6,.9,'#3a3e44');R.G(GEO.cyl16,cx,1.5,cz,.42,1.8,.42,'#b06a2a');for(let y=.7;y<2.4;y+=.08)R.G(GEO.cyl16,cx,y,cz,.45,.03,.45,'#d08a3a');
    R.G(GEO.sph,cx,2.75,cz,.6,.32,.6,'#c8ccd0');R.col(cx-1,cz-1,cx+1,cz+1);
    for(let k=0;k<3;k++){const sp=new MB(),a=rnd()*6.28,L=1.1+rnd()*.8;let px=cx,py=2.8,pz=cz;for(let s=0;s<5;s++){const nx=px+Math.cos(a)*L/5+(rnd()-.5)*.25,ny=py+(rnd()-.4)*.3,nz=pz+Math.sin(a)*L/5+(rnd()-.5)*.25,dx=nx-px,dy=ny-py,dz=nz-pz,l=Math.hypot(dx,dy,dz);
      const m=new THREE.Matrix4().lookAt(new THREE.Vector3(0,0,0),new THREE.Vector3(dx,dy,dz),new THREE.Vector3(0,1,0));m.scale(new THREE.Vector3(.03,.03,l));m.setPosition(R.X+(px+nx)/2,(py+ny)/2,R.Z+(pz+nz)/2);sp.geo(GEO.box,m,COL('#d8f0ff'));px=nx;py=ny;pz=nz}
     const mm=sp.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));mm.visible=false;g.add(mm);LAB.sparks.push({m:mm,ph:rnd()*6})}}
   /* v79r2: invertido — a porta da sala fica no lado norte (z 0): grade logo depois da porta (z 2,2) com portão aberto em x 4,8–6,2; transformador e cabos grossos no fundo (z ~7) */
   R.B(.4,0,6.4,2.4,1.6,7.6,'#4a5a4a');for(let k=0;k<6;k++)R.B(.45+k*.33,.2,6.35,.6+k*.33,1.4,6.4,'#3a4a3a');R.col(.4,6.4,2.4,7.6);
   for(let k=0;k<3;k++)R.B(2.4,.15+k*.12,7.0-k*.12,10.6,.25+k*.12,7.1-k*.12,'#141418');
   const GZ=2.2,G0=4.8,G1=6.2;for(let x=.6;x<10.6;x+=.3)if(x+.03<G0||x>G1)R.B(x,0,GZ,x+.03,2.2,GZ+.03,'#8a8e92');for(const[a,b] of[[.5,G0],[G1,10.6]]){R.B(a,2.2,GZ-.02,b,2.25,GZ+.05,'#8a8e92');R.B(a,1.1,GZ-.02,b,1.14,GZ+.05,'#8a8e92')}R.col(.5,GZ-.05,G0,GZ+.1);R.col(G1,GZ-.05,10.6,GZ+.1);
   for(const x of[G0-.08,G1])R.B(x,0,GZ-.04,x+.08,2.3,GZ+.07,'#e8c020');R.B(G0-.08,2.3,GZ-.04,G1+.08,2.38,GZ+.07,'#e8c020');R.G(GEO.box,G1+.02,1.12,GZ+.62,.03,2.1,1.2,'#8a8e92',0,.35,0);
   R.B(.8,1.5,GZ-.05,1.7,2.0,GZ-.03,'#e8c020');R.E(.95,1.62,GZ-.06,1.55,1.88,GZ-.055,'#141418');LAB.coils=[{x:R.X+3.2,z:R.Z+4.4},{x:R.X+7.8,z:R.Z+4.4}];R.r.extra=[[R.X+3.2,2.6,R.Z+4.4],[R.X+7.8,2.6,R.Z+4.4]]}
  // ===== 205 · DORMITÓRIO (N) · 206 · AMOSTRAS (W) · 207 · DIRETOR (E) · depósito (S) =====
  {const R=K('N');for(const x of[.4,4.4])for(const l of[0,1]){R.B(x,.3+l*1.2,.3,x+2.0,.42+l*1.2,1.2,'#5a5e62');R.B(x+.05,.42+l*1.2,.35,x+1.95,.55+l*1.2,1.15,'#d8dce0');R.B(x+.1,.55+l*1.2,.4,x+.5,.65+l*1.2,1.1,'#f0f0f0')}for(const x of[.4,2.35,4.4,6.35])R.B(x,0,.3,x+.05,2.0,1.2,'#5a5e62');R.col(.4,.3,6.4,1.2);
   R.B(6.6,0,6.8,7.6,1.8,7.7,'#7a7e82');R.col(6.6,6.8,7.6,7.7)}
  {const R=K('W');for(let k=0;k<4;k++){const x=.6+k*2.4;R.B(x,0,.2,x+2.0,1.0,1.0,'#e8ecec');R.B(x+.1,1.0,.25,x+1.9,1.03,.95,'#c8d8e0');R.E(x+.15,.85,1.0,x+.35,.92,1.005,'#2aff6a');R.col(x,.2,x+2,1)}
   R.B(3,0,3.6,8,.9,4.6,'#d8d8d2');R.B(2.95,.9,3.55,8.05,.95,4.65,'#2a2a2e');R.col(2.95,3.55,8.05,4.65);for(let k=0;k<8;k++){R.B(3.3+k*.55,.95,3.9,3.5+k*.55,1.0,4.3,'#8a8e92');for(let l=0;l<3;l++)R.G(GEO.cyl16,3.36+k*.55+l*.05,1.08,4.0+l*.1,.015,.15,.015,pk(['#d02020','#ffd21a','#2ad6ff']),0,0,0,true)}}
  {const R=K('E');R.r.warm='#ffd8a8';R.B(5,0,3.4,8,.76,4.6,'#4a2e1c');R.B(4.95,.76,3.35,8.05,.8,4.65,'#6a4a2a');R.col(4.95,3.35,8.05,4.65);chair(R,6.5,5.1,'n');
   R.B(10.8,0,.4,10.95,2.2,5.6,'#6a4a2a');for(let y=.3;y<2.1;y+=.45)for(let z=.5;z<5.5;z+=.12)if(rnd()<.7)R.B(10.7,y,z,10.8,y+.3+rnd()*.08,z+.09,pk(['#8a2a20','#2a4a6a','#c8a050','#3a5a3a']));R.col(10.6,.4,10.95,5.6);
   R.B(.8,0,.3,2.4,.4,1.4,'#2a2a30');R.B(.8,.4,.3,2.4,.95,.55,'#2a2a30');R.col(.8,.3,2.4,1.4);
   // v78 · 2g: cofre do diretor no canto (abre 1x por dia de jogo)
   R.B(9.2,0,4.9,10.0,1.0,5.75,'#3a4a44');R.B(9.18,.08,4.98,9.2,.92,5.67,'#2e3c36');R.G(GEO.cyl16,9.16,.62,5.32,.13,.04,.13,'#c8c8c0',0,0,Math.PI/2);R.B(9.12,.36,5.1,9.18,.42,5.2,'#c8c8c0');R.E(9.17,.82,5.5,9.18,.86,5.56,'#ff3030');R.col(9.2,4.9,10,5.75);
   LAB.safe={x:R.X+9.0,z:R.Z+5.32,f:2};R.G(GEO.cyl16,6,.86,3.8,.08,.12,.08,'#e8e8e8');R.B(6.6,.8,3.7,7.2,.82,4.1,'#e8e0c8')}
  /* v2 r2: o antigo depósito (S) virou a SALA DA FENDA: fenda permanente para o Upside Down na parede do fundo, sustentada por emissores e um arco de metal; porta de cartão */
  {const R=K('S');for(let k=0;k<6;k++){rnd();pk([0])} /* mantém a sequência do rnd do andar */
   R.r.warm='#ffb4b0';R.r.amb=.26;R.r.grime=.6;
   const st='#3a3e44',st2='#4a4e54',yl='#e8c020',bk='#141418';
   /* arco de metal em volta da fenda (encostado na parede sul, z 8) */
   for(const x of[2.5,5.2]){R.B(x,0,7.35,x+.3,3.05,7.9,st2);for(let y=.2;y<2.9;y+=.5)R.B(x-.005,y,7.34,x+.305,y+.22,7.36,yl);R.col(x,7.35,x+.3,7.9)}
   R.B(2.5,2.95,7.35,5.5,3.15,7.9,st2);for(let x=2.6;x<5.4;x+=.5)R.B(x,2.94,7.34,x+.22,3.16,7.36,yl);
   for(const x of[2.65,5.35])for(let k=0;k<4;k++)R.E(x-.05,.6+k*.6,7.335,x+.05,.66+k*.6,7.34,'#ff3040');
   /* emissores dos dois lados, apontados para a fenda */
   for(const[x,z] of[[1.2,6.0],[6.8,6.0]]){R.G(GEO.cyl16,x,.3,z,.55,.6,.55,st);R.G(GEO.cyl16,x,1.2,z,.18,1.2,.18,'#8a8e92');for(let y=.8;y<1.75;y+=.12)R.G(GEO.cyl16,x,y,z,.24,.03,.24,'#b06a2a');
    R.G(GEO.sph,x,1.95,z,.26,.26,.26,'#c8ccd0');R.G(GEO.sph,x+(4-x)*.07,1.95,z+.18,.12,.12,.12,'#ff3040',0,0,0,true);R.col(x-.6,z-.6,x+.6,z+.6)}
   /* cabos grossos no chão: emissores -> fundo, console -> arco */
   for(let k=0;k<3;k++){R.B(1.2-.04+k*.1,0,6.5,1.24+k*.1,.08,7.95,bk);R.B(6.76+k*.1,0,6.5,6.8+k*.1,.08,7.95,bk)}
   for(let k=0;k<2;k++)R.B(1.0,0,3.3+k*.12,2.6,.07,3.38+k*.12,bk);for(let k=0;k<2;k++)R.B(2.5+k*.12,0,3.3,2.58+k*.12,.07,7.35,bk);
   /* console de monitoramento (parede oeste) e gerador (parede leste) */
   R.B(.15,0,2.2,.95,.9,4.6,'#30343a');R.B(.15,.9,2.15,1.0,.95,4.65,'#1a1c20');R.col(.15,2.15,1.0,4.65);
   for(let z=2.3;z<4.5;z+=.75){R.B(.12,1.15,z,.2,1.85,z+.65,'#1a1c20');R.E(.2,1.2,z+.05,.205,1.8,z+.6,pk(['#4a0e14','#3a0a10']));for(let k=0;k<3;k++)R.E(.206,1.35+k*.15,z+.1,.21,1.39+k*.15,z+.15+rnd()*.35,'#ff6a6a')}
   R.B(7.05,0,1.4,7.85,1.7,3.6,'#4a5a4a');for(let k=0;k<6;k++)R.B(7.0,.2+k*.22,1.6,7.05,.3+k*.22,3.4,'#3a4a3a');R.E(6.99,1.45,2.2,7.0,1.55,2.8,'#2aff6a');R.col(7.0,1.4,7.85,3.6);
   /* faixa de segurança em semicírculo na frente da fenda */
   for(let k=0;k<12;k++){const a=Math.PI+k/11*Math.PI,x=4+Math.cos(a)*2.1,z=7.85+Math.sin(a)*2.1;R.B(x-.13,0,z-.13,x+.13,.006,z+.13,k%2?bk:yl)}
   /* placa de perigo acima da porta, lado de dentro */
   R.B(3.3,2.45,.11,4.7,2.75,.13,yl);R.E(3.4,2.52,.135,4.6,2.68,.14,'#141418');
   R.r.extra=[[R.X+4,1.9,R.Z+7.5],[R.X+1.2,1.95,R.Z+6],[R.X+6.8,1.95,R.Z+6]];
   /* fenda (malhas próprias: anima e solta raios/flocos em labPortalTick) */
   const pv=portalVisualMake(2.4,3.4);pv.g.position.set(R.X+4,0,R.Z+7.86);pv.g.rotation.y=Math.PI;g.add(pv.g);
   LAB.portal={x:R.X+4,z:R.Z+7.86,nx:0,nz:-1,f:2,...pv,boltT:1,flakeT:0};portalBoltsMake(pv.g,LAB.portal);
   /* porta de aço deslizante + leitor de cartão (corredor) */
   {const X0=R.X+4,Zd=R.Z,dm=new MB();dm.box(X0-.72,0,Zd-.05,X0+.72,2.3,Zd+.05,COL('#4a5058'));for(let y=.25;y<2.2;y+=.5)dm.box(X0-.72,y,Zd-.06,X0+.72,y+.12,Zd+.06,COL(yl));dm.box(X0-.04,0,Zd-.07,X0+.04,2.3,Zd+.07,COL('#2a2e34'));
    const dmm=dm.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));g.add(dmm);
    const rd=new MB();rd.box(X0+.86,1.0,Zd-.2,X0+1.08,1.36,Zd-.1,COL('#2a2e34'));rd.box(X0+.9,1.04,Zd-.205,X0+1.04,1.12,Zd-.2,COL('#8a8e92'));const rdm=rd.mesh(new THREE.MeshLambertMaterial({vertexColors:true}));g.add(rdm);
    const led=new THREE.Mesh(new THREE.BoxGeometry(.06,.04,.01),new THREE.MeshBasicMaterial({color:0xff3030}));led.position.set(X0+.97,1.26,Zd-.21);g.add(led);
    LAB.pDoor={x:X0,z:Zd,mesh:dmm,led,open:false}}}}
 // ===== núcleo (C): escada (metade sul) e elevador de carga (metade norte) — iguais nos 2 andares, a escada desce no B1 e sobe no B2 =====
 {const R=K('C'),down=F.f===1;R.r.warm='#d8e4ff';R.r.amb=.4;R.r.lights=[[R.X+4,H-.3,R.Z+1.5],[R.X+2,H-.3,R.Z+4.5]];
  R.B(0,0,2.92,8,H,3.08,'#b8c2c4');R.col(0,2.92,8,3.08);
  // degraus: 7 de 25 cm, de x 3,2 até 0,4 (oeste), largura z 3,3–5,7
  for(let k=0;k<7;k++){const xa=3.2-(k+1)*.4,xb=3.2-k*.4;if(down){const y=-(k+1)*.25;R.B(xa,y-.12,3.3,xb,y,5.7,'#7e8486');R.B(xa,y-.002,3.3,xb-.32,y+.004,5.7,'#6e7476');R.B(xb-.06,y-.001,3.3,xb,y+.006,5.7,'#e8c020')}
   else{const y=(k+1)*.25;R.B(xa,0,3.3,xb,y,5.7,'#7e8486');R.B(xb-.06,y,3.3,xb,y+.006,5.7,'#e8c020')}}
  if(down){R.B(.3,-2.1,3.2,3.3,-1.9,5.8,'#1a1c20');R.B(.3,-2.1,3.2,3.3,0,3.3,'#5a5e60');R.B(.3,-2.1,5.7,3.3,0,5.8,'#5a5e60');R.B(.3,-2.1,3.2,.4,0,5.8,'#2a2c30')}
  else{R.B(.3,1.75,3.3,.4,H,5.7,'#1a1c20')}
  for(const z of[3.25,5.75]){if(down)R.B(.4,.9,z-.03,3.2,.95,z+.03,'#c8a020');else for(let k=0;k<7;k++){const xa=3.2-(k+1)*.4;R.B(xa,(k+1)*.25+.9,z-.03,xa+.4,(k+1)*.25+.95,z+.03,'#c8a020')}for(let x=.6;x<3.2;x+=.6)R.B(x-.02,down?0:(3.2-x)/.4*.25,z-.02,x+.02,down?.95:(3.2-x)/.4*.25+1,z+.02,'#8a8e92')}
  R.col(3.2,3.18,3.4,3.3);R.col(3.2,5.7,3.4,5.82);
  // elevador de carga: cabine x 2,4–5,6, z 0,2–2,8 (porta pela porta norte do núcleo), grade pantográfica, painel, faixas
  R.B(2.3,0,.15,2.4,H,2.9,'#5a5e62');R.B(5.6,0,.15,5.7,H,2.9,'#5a5e62');R.col(2.3,.15,2.4,2.9);R.col(5.6,.15,5.7,2.9);R.B(2.4,H-.1,.2,5.6,H,2.9,'#3a3e44');
  R.B(2.4,0,.2,5.6,.01,2.85,'#4a4e52');for(let x=2.5;x<5.6;x+=.3)R.B(x,.01,.25,x+.15,.016,.4,'#e8c020');for(let x=2.5;x<5.6;x+=.3)R.B(x+.15,.01,.25,x+.3,.016,.4,'#1a1a1a');
  for(let x=2.45;x<5.6;x+=.22)R.G(GEO.box,x,1.15,.18,.025,2.2,.025,'#8a8e92',0,0,.35);
  R.B(5.5,1.1,1.3,5.6,1.7,1.7,'#2a2e34');R.E(5.495,1.55,1.4,5.5,1.62,1.6,F.f===1?'#2aff6a':'#3a4a3a');R.E(5.495,1.25,1.4,5.5,1.32,1.6,F.f===2?'#2aff6a':'#3a4a3a');
  R.B(2.4,0,.2,2.6,1.0,2.8,'#3a3e44');R.B(5.4,0,.2,5.6,1.0,2.8,'#3a3e44');
  for(let k=0;k<2;k++)R.B(6.2,0,.4+k*1.2,7.6,1.4,1.4+k*1.2,'#5a6068');R.col(6.2,.4,7.6,2.6);for(let k=0;k<3;k++)R.G(GEO.cyl16,1.0,1.2+k*.5,1.5,.05,.5,.05,'#3a3e44',Math.PI/2,0,0);R.B(.5,0,.4,1.6,1.6,2.6,'#4a5058');R.col(.5,.4,1.6,2.6)}
 F.dressDone=true}
function labDressFinish(F){if(!F.mE)return;const m=F.mE.mesh(new THREE.MeshBasicMaterial({vertexColors:true}));if(m)LAB.grp.add(m);
 const t=F.mT&&F.mT.mesh(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide}));if(t){t.renderOrder=3;LAB.grp.add(t)}}
function labEnter(){const h=LAB.hatch;if(!h)return;labBuild();fadeFlash();doorEnter('lab','lab',{x:h.x+h.nx*1.8,z:h.z+h.nz*1.8},[h.nx,h.nz]);PL.inside='lab';LAB.grp.visible=true;LAB.arrIn.visible=true;LAB.lock=1.2;
 PL.x=LAB.spawn.x;PL.z=LAB.spawn.z;PL.vx=PL.vz=0;PL.gy=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.3,PL.z+2);camT.x=PL.x;camT.z=PL.z;for(const q of peds.slice())if(!q.fixed)removePed(q);labSpawnPeds()}
function labExit(){const h=LAB.hatch;fadeFlash();labClearPeds();PL.inside=false;if(h)doorExit({x:h.x+h.nx*1.8,z:h.z+h.nz*1.8,nx:h.nx,nz:h.nz});LAB.lock=1.5;if(LAB.grp)LAB.grp.visible=false;if(LAB.arrIn)LAB.arrIn.visible=false}
function labRoom(){if(!LAB.bounds)return null;return LAB.bounds.find(b=>PL.x>b.x0-2&&PL.x<b.x1+2&&PL.z>b.z0-2&&PL.z<b.z1+2)||LAB.bounds[0]}
/* v78 · 2e: escada (B1 desce / B2 sobe) e elevador de carga (ficar 1 s dentro da cabine) entre os andares */
function labFloorAt(){if(!LAB.F.length)return null;return LAB.F.find(F=>Math.abs(PL.x-F.x)<20&&Math.abs(PL.z-F.z)<16)||null}
function labGoFloor(F2,lx,lz,face){fadeFlash();setTimeout(()=>{if(PL.inside==='lab')labSpawnPeds(F2.f)},0);PL.x=F2.x+lx;PL.z=F2.z+lz;PL.vx=PL.vz=0;if(face)PL.face=face;camT.x=PL.x;camT.z=PL.z;if(camMode==='fps')chasePos.set(PL.x,2.3,PL.z+2);LAB.lock=1.2;LAB.cur=F2.f}
function labCoreTick(dt){const F=labFloorAt();if(!F||LAB.lock>0)return;if(F.f===2&&LAB.coils&&PL.hp>0){ /* v79r2: chegar perto das bobinas de Tesla (sala 204) tira 25% da vida por segundo */
  let near=false;for(const c of LAB.coils)if(Math.hypot(PL.x-c.x,PL.z-c.z)<1.75)near=true;if(near){PL.hp-=25*dt;if(!LAB.zapT||simT-LAB.zapT>2.5){LAB.zapT=simT;think(PL,'AI! Choque!',1.6);if(typeof shake==='function')shake(.25)}if(PL.hp<=0)killPlayer()}}if(LAB.safe&&F.f===LAB.safe.f&&Math.hypot(PL.x-LAB.safe.x,PL.z-LAB.safe.z)<.9&&LAB.safeDay!==(DN.day||0)){LAB.safeDay=DN.day||0;money(2500,'COFRE · +$2.500')}if(LAB.safe&&F.f===LAB.safe.f&&Math.hypot(PL.x-LAB.safe.x,PL.z-LAB.safe.z)<.9&&!MASK.have&&CHAR.cur!==0&&!LAB.clMask){LAB.clMask=true;think(PL,'Tem uma máscara verde aí dentro… Nem encosto nisso. Me dá medo.',5)}
 if(LAB.safe&&F.f===LAB.safe.f&&Math.hypot(PL.x-LAB.safe.x,PL.z-LAB.safe.z)<.9&&!MASK.have&&CHAR.cur===0){MASK.have=true;setTimeout(()=>toast('<span style="color:#d9f44a">MASKARA</span><br><small style="font-size:11px;color:#fff">'+translatePlain('na roda de armas, última fatia ›')+'</small>'),1600)}const lx=PL.x-F.x,lz=PL.z-F.z,other=LAB.F[F.f===1?1:0];
 if(lx>-3.4&&lx<-1.1&&lz>.4&&lz<2.6){labGoFloor(other,1.8,1.5,[1,0]);toast(other.f===1?'B1':'B2');return}
 const inCab=Math.abs(lx)<1.1&&lz>-2.5&&lz<-.6;if(!inCab){LAB.elevT=0;LAB.elevHold=false;return}if(LAB.elevHold)return;
 LAB.elevT=(LAB.elevT||0)+dt;if(LAB.elevT>1.0){LAB.elevT=0;LAB.elevHold=true;labGoFloor(other,lx,lz,[0,-1]);toast(other.f===1?'B1':'B2')}}
/* v78 · 2f: equipe do laboratório — todos de branco. Jaleco parado nas janelas olhando pra dentro das salas (e alguns trabalhando lá dentro); seguranças de branco nos cruzamentos e no hall. */
function labClearPeds(){for(const q of LAB.peds)if(peds.includes(q))removePed(q);LAB.peds=[]}
function labSpawnPeds(fl){labClearPeds();fl=fl||1;const rr=mulberry32(((city.hzSeed|0)^((DN.day||0)*131))>>>0),pk=a=>a[Math.floor(rr()*a.length)];
 const coat=()=>({...pk(PED_PALS),shirt:'#f2f2ee',pants:pk(['#e6e6e0','#d8dade','#3a3c44']),shoes:pk(['#e8e8e8','#2a2a2a']),belt:'#c8c8c8',cap:null,stripe:null}),
  guard=()=>({...pk(PED_PALS),shirt:'#f4f4f0',pants:'#ecece6',shoes:'#e0e0e0',belt:'#1a1a1a',cap:'#f2f2f2',capDark:'#c8c8c8',stripe:null});
 const put=(x,z,mx,mz,pal)=>{const q=spawnPed(null,{x,z,vx:0,vz:0,pal});if(!q)return;q.fixed=true;q.state='fare';q.mx=mx;q.mz=mz;q.labStaff=true;LAB.peds.push(q)};
 for(const F of LAB.F){if(F.f!==fl)continue;const wins=[];
  for(const c of LAB_CELLS)for(const sd of c.win){const ax=sd==='n'||sd==='s'?'x':'z',fix=sd==='n'?c.z0:sd==='s'?c.z1:sd==='w'?c.x0:c.x1,out=sd==='n'||sd==='w'?-1:1,a0=ax==='x'?c.x0:c.z0,a1=ax==='x'?c.x1:c.z1;
   for(let t=a0+1.6;t<a1-1.6;t+=2.6){const a=t+.8;if(c.door===sd&&Math.abs(a-c.da)<1.6)continue;const d=fix+out*.75;wins.push(ax==='x'?[a,d,0,-out]:[d,a,-out,0])}}
  for(let k=0;k<5&&wins.length;k++){const w=wins.splice(Math.floor(rr()*wins.length),1)[0];put(F.x+w[0]+(rr()-.5)*.4,F.z+w[1],w[2],w[3],coat())}
  // dentro das salas, de frente pras bancadas/consoles
  const inside=F.f===1?[[-14.3,10.0,0,-1],[-11.5,12.4,0,-1],[10.6,12.4,0,1],[12.9,-11.1,0,-1]]:[[-12.5,-7.6,0,-1],[11,-8.6,0,-1],[-9.6,10.5,-1,0],[12.5,8.0,0,1]];
  for(const[x,z,mx,mz] of inside)if(rr()<.75)put(F.x+x,F.z+z,mx,mz,coat());
  for(const[x,z,mx,mz] of[[-5.5,-4.5,1,0],[5.5,4.5,-1,0]])put(F.x+x,F.z+z,mx,mz,guard());
  if(F.f===1)put(F.x+2.6,F.z+10.6,-1,0,guard());else labTankPed()}}
/* v78: o demogorgon da cápsula da 201 é um PED de verdade (mesmo DEMO_PAL do Rampage/floresta), congelado e boiando:
   segue o modo de peds (2D/3D) como todo mundo. */
/* v2 r2 · EVENTO DO TANQUE (lab do Point Haze, sala 201 · contenção)
   Ficar 30 s (≈30 min de jogo) dentro da sala com o Demogorgon da cápsula → a luz DA SALA cai (uniforms da roomLitMat), pisca,
   vidro estoura; quando acende, a cápsula está quebrada (cacos, vidro no chão, poça) e o bicho anda pelo lab.
   Antes disso, qualquer dano na cápsula (tiro, lança-chamas, soco, explosão) → balão "Pare de me perturbar." (cooldown).
   Estado vale enquanto existir esta ilha (labBuild novo = cápsula inteira). */
/* v2 r2: cartão (B1, segurança) -> porta da sala da fenda (B2) -> Upside Down da cidade de origem */
function labPortalTick(dt){const F=labFloorAt();const C=LAB.cardAt,D=LAB.pDoor,P=LAB.portal;
 if(C&&C.mesh){C.mesh.visible=!LAB.card;if(!LAB.card&&F&&F.f===C.f&&Math.hypot(PL.x-C.x,PL.z-C.z)<.95&&!PL.dead){LAB.card=true;C.mesh.visible=false;clang(.5);toast('<span style="color:#7ab8ff">CARTÃO MAGNÉTICO</span><br><small style="font-size:11px;color:#fff">B2 · '+translatePlain('SALA DA FENDA')+'</small>')}}
 if(D){D.led.material.color.setHex(D.open?0x2aff6a:LAB.card?0xffd21a:0xff3030);
  if(F&&F.f===2&&!D.open){const lx=PL.x-D.x,lz=PL.z-D.z;
   if(Math.abs(lx)<1.6&&lz>-1.6&&lz<.2){if(LAB.card){D.open=true;D.mesh.visible=false;clang(.6);thud(.4);toast('ACESSO LIBERADO')}else if(simT>(LAB.denyT||0)){LAB.denyT=simT+4;try{clang(.2)}catch(e){}toast('<span style="color:#ff5860">'+translatePlain('ACESSO NEGADO')+'</span><br><small style="font-size:11px;color:#fff">'+translatePlain('PRECISA DE CARTÃO')+'</small>')}}
   if(!D.open&&Math.abs(lx)<.9&&lz>-.45&&lz<.6)PL.z=D.z-.45}}
 if(!P)return;const on=F&&F.f===P.f;P.g.visible=true;
 P.plane.material.opacity=.96+.025*Math.sin(simT*4.4);P.glow.material.opacity=.9+.09*Math.sin(simT*5.3);P.glow.scale.set(1.22+.035*Math.sin(simT*3.7),2.45+.06*Math.sin(simT*3.7),1);
 const bob=.08*Math.sin(simT*2.6);P.plane.position.y=P.glow.position.y=1.9+bob;P.vein.material.opacity=.9+.06*Math.sin(simT*1.3);
 /* raios/flocos usam o referencial do mundo: o grupo está girado 180°, então as fitas vão na mesma orientação local (nz -1 → +1 local) */
 portalFxStep(dt,P,P,.95,!!on,0,{nx:0,nz:1});
 if(on&&!PL.dead&&LAB.lock<=0&&!INVERT.switching&&Math.hypot(PL.x-P.x,PL.z-(P.z-.3))<.85){if(!storyOK('rift')){storyLocked('A FENDA NÃO DEIXA PASSAR');PL.z=P.z-1.6;return}LAB.lock=3;void invertShiftWorld('inverted','CAINDO PELA FENDA…',false,{fromLab:true})}}
function labTankPedNow(){return LAB.peds.find(q=>q&&(q.labTank||q.labRoam)&&peds.includes(q))||null}
function labTankPoke(pt,r,ped){if(PL.inside!=='lab'||!LAB.tankC||LAB.tankBroken||LAB.blackout||!pt)return;const q=labTankPedNow();if(!q)return;
 const hitTank=Math.hypot(pt.x-LAB.tankC.x,pt.z-LAB.tankC.z)<1.25+(r||0)&&(pt.y==null||pt.y<3.1);if(!hitTank&&ped!==q)return;
 if(simT<(LAB.pokeT||0))return;LAB.pokeT=simT+3.2;say(q,'Pare de me perturbar.',2.8)}
function labTankLight(k){const r=LAB.tankRoom;if(!r||!r.litU)return;for(const U of r.litU){if(!U.base)U.base=U.uRP.value.clone();U.uRP.value.set(U.base.x*k+.035*(1-k),U.base.y*k,U.base.z,U.base.w)}
 if(LAB.tankGlass)LAB.tankGlass.material.opacity=.42*(.25+.75*k)}
function labTankTick(dt){if(!LAB.tankC||LAB.tankBroken||LAB.blackout)return;const F=labFloorAt(),r=LAB.tankRoom;
 const inRoom=!!(F&&F.f===2&&r&&PL.x>r.x0&&PL.x<r.x1&&PL.z>r.z0&&PL.z<r.z1&&!PL.dead);
 if(!inRoom){LAB.tankT=0;return}LAB.tankT+=dt;if(LAB.tankT>=30)labTankBreak()}
function labTankBrokenBuild(){if(LAB.tankBrokenG)return LAB.tankBrokenG;const g=new THREE.Group(),c=LAB.tankC,rr=mulberry32(((city.hzSeed|0)^0x51f3)>>>0),glass=new MB(),floor=new MB(),Rg=1.12;
 /* cacos presos na base (até ~1 m) e pendurados no aro de cima, em volta do círculo */
 for(let k=0;k<16;k++){const a=k/16*6.283+rr()*.2,w=.32+rr()*.18,ca=Math.cos(a),sa=Math.sin(a),tx=-sa,tz=ca,x=c.x+ca*Rg,z=c.z+sa*Rg;
  const hB=.55+rr()*.6,hT=.25+rr()*.45,P=(dx,y)=>[x+tx*dx,y,z+tz*dx];
  glass.quad(P(-w/2,.5),P(w/2,.5),P(w*(rr()-.5)*.6,.5+hB),P(w*(rr()-.5)*.6,.5+hB),ca,0,sa,[0,0,1,1],COL('#3ab8d8'));
  if(rr()<.7)glass.quad(P(-w/2,2.5),P(w/2,2.5),P(w*(rr()-.5)*.5,2.5-hT),P(w*(rr()-.5)*.5,2.5-hT),ca,0,sa,[0,0,1,1],COL('#3ab8d8'))}
 const gm=glass.mesh(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}));if(gm){gm.renderOrder=3;g.add(gm)}
 /* poça (leque raso) + vidro espalhado no chão */
 {const n=20,y=.008,rad=a=>2.0+.55*Math.sin(a*3+1.3)+.3*Math.sin(a*5),C0=COL('#16303a');for(let k=0;k<n;k++){const a0=k/n*6.283,a1=(k+1)/n*6.283;floor.tri?floor.tri([c.x,y,c.z],[c.x+Math.cos(a0)*rad(a0),y,c.z+Math.sin(a0)*rad(a0)],[c.x+Math.cos(a1)*rad(a1),y,c.z+Math.sin(a1)*rad(a1)],C0):floor.quad([c.x,y,c.z],[c.x,y,c.z],[c.x+Math.cos(a1)*rad(a1),y,c.z+Math.sin(a1)*rad(a1)],[c.x+Math.cos(a0)*rad(a0),y,c.z+Math.sin(a0)*rad(a0)],0,1,0,[0,0,1,1],C0)}}
 for(let k=0;k<26;k++){const a=rr()*6.283,d=1.3+rr()*1.6,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,s=.05+rr()*.09;floor.box(x-s,.012,z-s*.6,x+s,.022,z+s*.6,COL(rr()<.5?'#9fe4f2':'#5cc6dc'))}
 const fm=floor.mesh(new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));if(fm){fm.renderOrder=2;g.add(fm)}
 g.visible=false;LAB.grp.add(g);LAB.tankBrokenG=g;return g}
async function labTankBreak(){if(LAB.blackout||LAB.tankBroken)return;LAB.blackout=true;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 try{thud(.6);for(const k of [.35,1,.15,1,0])labTankLight(k);labTankLight(0);await wait(900);clang(.55);rumble(.6,.5,260);try{shake(.3)}catch(e){}await wait(500);clang(.8);thud(.9);rumble(.9,.6,320);
  if(LAB.tankGlass)LAB.tankGlass.visible=false;if(LAB.tankBub)LAB.tankBub.visible=false;labTankBrokenBuild().visible=true;LAB.tankBroken=true;
  const q=labTankPedNow();if(q){q.labTank=false;labRoamStart(q,LAB.tankRoom,true)}
  await wait(1300);for(const [k,ms] of [[.4,90],[0,140],[.8,80],[.1,160],[1,0]]){labTankLight(k);if(ms)await wait(ms)}}
 catch(e){console.error('tanque',e);labTankLight(1)}finally{LAB.blackout=false;LAB.tankT=0}}
/* bicho solto: anda dentro do retângulo da sala (paredes do lab não são colisores — o jogador também é limitado pelo retângulo)
   e, sem ninguém olhando (longe ou fora da tela), muda de sala de tempos em tempos → vaga pelo andar. */
function labRoamStart(q,room,nearTank){q.labRoam=true;q.fixed=true;q.state='fare';q.room=room;q.roamT=0;q.hopT=18+Math.random()*12;q.sh.visible=true;
 if(nearTank&&LAB.tankC){const r=room;q.x=clamp(LAB.tankC.x+1.9,r.x0+.7,r.x1-.7);q.z=clamp(LAB.tankC.z+1.9,r.z0+.7,r.z1-.7)}labRoamPick(q)}
function labRoamPick(q){const r=q.room;if(!r)return;q.tx=r.x0+.8+Math.random()*Math.max(.1,r.x1-r.x0-1.6);q.tz=r.z0+.8+Math.random()*Math.max(.1,r.z1-r.z0-1.6);q.idle=Math.random()<.35?1+Math.random()*2.5:0}
function labRoamRooms(){const F=LAB.F.find(F=>F.f===2);return F?Object.values(F.rooms).filter(r=>r.x1-r.x0>3&&r.z1-r.z0>3):[]}
function labRoamSpawn(){const rooms=labRoamRooms();if(!rooms.length)return;const room=LAB.tankRoom&&Math.random()<.5?LAB.tankRoom:rooms[Math.floor(Math.random()*rooms.length)];
 const q=spawnPed(null,{x:(room.x0+room.x1)/2,z:(room.z0+room.z1)/2,vx:0,vz:0,pal:{...DEMO_PAL}});if(!q)return;q.labStaff=true;q.demo=true;q.hp=1e9;q.noFlee=true;LAB.peds.push(q);labRoamStart(q,room,false)}
function labRoamStep(q,dt){if(LAB.blackout)return false;q.hopT-=dt;const far=Math.hypot(q.x-PL.x,q.z-PL.z)>14;let seen=false;try{const v=new THREE.Vector3(q.x,1.4,q.z).project(camera);seen=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1}catch(e){}
 if(q.hopT<=0&&(far||!seen)){const rooms=labRoamRooms().filter(r=>r!==q.room);if(rooms.length){q.room=rooms[Math.floor(Math.random()*rooms.length)];q.x=(q.room.x0+q.room.x1)/2;q.z=(q.room.z0+q.room.z1)/2;labRoamPick(q)}q.hopT=18+Math.random()*14}
 if(q.idle>0){q.idle-=dt;return false}const dx=q.tx-q.x,dz=q.tz-q.z,d=Math.hypot(dx,dz);if(d<.3){labRoamPick(q);return false}
 const sp=1.6,st=Math.min(d,sp*dt),nx=q.x+dx/d*st,nz=q.z+dz/d*st,r=q.room,o={x:nx,z:nz};try{circleVsWorld(o,.4)}catch(e){}
 o.x=clamp(o.x,r.x0+.5,r.x1-.5);o.z=clamp(o.z,r.z0+.5,r.z1-.5);const moved=Math.hypot(o.x-q.x,o.z-q.z);q.roamT=moved<st*.3?q.roamT+dt:0;if(q.roamT>1.2){q.roamT=0;labRoamPick(q)}
 q.x=o.x;q.z=o.z;q.mx=dx/d;q.mz=dz/d;return moved>1e-3}
function labTankPed(){if(!LAB.tankAt)return;if(LAB.tankBroken){labRoamSpawn();return}const q=spawnPed(null,{x:LAB.tankAt.x,z:LAB.tankAt.z,vx:0,vz:0,pal:{...DEMO_PAL}});if(!q)return;q.fixed=true;q.state='fare';q.mx=0;q.mz=1;q.labTank=true;q.labStaff=true;q.demo=true;q.hp=1e9;q.noFlee=true;
 if(q.sp.userData&&q.sp.userData.actorTint)q.sp.userData.actorTint.set(0xb8dce8);LAB.peds.push(q)}
function labTick(dt){LAB.lock=Math.max(0,LAB.lock-dt);const h=LAB.hatch;
 if(!city.haze||!h){if(LAB.arrOut)LAB.arrOut.visible=false;return}if(!LAB.arrOut){LAB.arrOut=makeArrow();LAB.arrOut.userData.rest=1.6}
 const near=!PL.inside&&!PL.car&&Math.hypot(PL.x-h.x,PL.z-h.z)<7;LAB.arrOut.visible=near;if(near){LAB.arrOut.position.set(h.x,h.y+1.6+Math.sin(simT*3)*.18,h.z);LAB.arrOut.rotation.y=simT*1.8}
 if(LAB.arrIn&&LAB.arrIn.visible){LAB.arrIn.position.y=1.5+Math.sin(simT*3)*.18;LAB.arrIn.rotation.y=simT*1.8}
 if(PL.inside==='lab'&&LAB.sparks)for(const q of LAB.sparks)q.m.visible=Math.sin(simT*17+q.ph*5)+Math.sin(simT*29.3+q.ph)>1.1;
 if(PL.inside==='lab'){labTankTick(dt);labPortalTick(dt)}
 if(PL.inside==='lab')for(const q of LAB.flick){const t=simT*1.3+q.ph,on=(Math.sin(t*7.1)+Math.sin(t*13.7)+Math.sin(t*2.3))>.9?.18:1;q.m.color.setScalar(on);if(q.u)q.u.uRP.value.y=1.25*(on<1?.82:1)}
 if(PL.dead||LAB.lock>0||PROLOGUE.cut)return;
 if(!PL.inside&&!PL.car&&Math.hypot(PL.x-h.x,PL.z-h.z)<1.1)labEnter();
 else if(PL.inside==='lab'){if(Math.hypot(PL.x-LAB.exit.x,PL.z-LAB.exit.z)<.6){labExit();return}labCoreTick(dt);const r=labRoom();if(r){PL.x=clamp(PL.x,r.x0+.3,r.x1-.3);PL.z=clamp(PL.z,r.z0+.3,r.z1-.3)}}}
function motelDoor(){const M=city.motel;return M?{x:M.x,z:M.z,nx:M.nx,nz:M.nz}:null}
function motelEnter(scene){const d=motelDoor();if(!d)return;if(!scene&&POL.wanted){toast('NÃO DÁ PRA ENTRAR PROCURADO');MOTEL.lock=1.5;return}
 if(!scene&&!storyOK('motel')){storyLocked('MOTEL MIRAGEM · SEM VAGAS');MOTEL.lock=2;return}
 motelRoomBuild();const I=MOTEL.IN;if(!scene)fadeFlash();doorEnter('motel','motel6',{x:d.x+d.nx*.4,z:d.z+d.nz*.4},[d.nx,d.nz]);PL.inside='motel';MOTEL.grp.visible=true;MOTEL.arrIn.visible=!scene;MOTEL.lock=1.1;MOTEL.scene=!!scene;
 PL.x=MOTEL.exit.x+.55;PL.z=MOTEL.exit.z-1.35;PL.vx=PL.vz=0;PL.gy=0;PL.face=[0,-1];PL.yaw=0;if(camMode==='fps')chasePos.set(PL.x,2.3,PL.z+2);camT.x=PL.x;camT.z=PL.z;
 for(const q of peds.slice())if(!q.fixed)removePed(q);if(!scene)toast('MOTEL MIRAGEM · QUARTO 6<br><small style="font-size:11px;color:#fff">ar-condicionado barulhento, colcha de 1987</small>')}
function motelExit(){const d=motelDoor();if(!MOTEL.scene)fadeFlash();PL.inside=false;MOTEL.scene=false;if(d)doorExit({x:d.x+d.nx*.4,z:d.z+d.nz*.4,nx:d.nx,nz:d.nz});MOTEL.lock=1.5;if(MOTEL.grp)MOTEL.grp.visible=false;if(MOTEL.arrIn)MOTEL.arrIn.visible=false;
 if(MOTEL.claire){if(peds.includes(MOTEL.claire))removePed(MOTEL.claire);MOTEL.claire=null}}
// durante a missão 1 a porta do quarto 6 dispara a cena (Nathan entra de arma em punho)
function motelMissionDoor(){return PROLOGUE.active&&(PROLOGUE.stage==='motelDrive'||PROLOGUE.stage==='motelGo')}
/* v78 · arredores da Malibu Flash: holofotes no telhado, fonte da esquina e entrada VIP (seguranças + fila).
   Montados no buildChunk (ramo info.club); aqui só animação e NPCs. Fila cheia à noite, 2 pessoas de dia. */
var CLUBFX=CLUBFX||{q:[]};
const CLUB_GUARD_PAL={cap:null,capDark:null,skin:'#5a3a28',hair:'#141010',shirt:'#15151a',pants:'#15151a',shoes:'#0c0c0e',belt:'#2a2a2a',stripe:null,glasses:'#0a0a0a'};
const CLUB_SHIRTS=['#ff4fa3','#5ff2ff','#c85aff','#ffe14a','#f6f6fc','#ff7a3a','#2ad6a0'];
function clubQueueClear(){for(const q of CLUBFX.q)if(peds.includes(q))removePed(q);CLUBFX.q=[]}
// v78b: matrizes das instâncias dos holofotes (cabeça/lente/feixe seguem pivô + inclinação).
function clubBeamsPose(F){for(const b of F.beams){const t=simT*.32+b.ph;b.pv.rotation.y=b.yaw0+Math.sin(t)*1.05;b.tilt.rotation.z=-(.4+Math.sin(t*1.7+b.ph)*.12);b.pv.updateMatrixWorld(true);
  F.headIM.setMatrixAt(b.i,b.head.matrixWorld);F.lensIM.setMatrixAt(b.i,b.lens.matrixWorld);F.beamIM.setMatrixAt(b.i,b.beam.matrixWorld)}
 F.headIM.instanceMatrix.needsUpdate=F.lensIM.instanceMatrix.needsUpdate=F.beamIM.instanceMatrix.needsUpdate=true}
function clubFxTick(dt){const F=CLUBFX;if(!F||!F.root)return;
 let o=F.root,live=false;while(o){if(o===scene){live=true;break}o=o.parent}
 const K=city.casino;if(!live||!K||!K.clubVip){if(F.q.length)clubQueueClear();return}
 if(S.style==='inverted'||(city.st&&city.st.noLamps)){if(F.beamIM)F.beamIM.visible=false;if(F.lens)F.lens.color.setHex(0x3a3a40);if(F.water)F.water.emissive.setRGB(0,0,0);if(F.lights)F.lights.visible=false;if(F.jetIM)F.jetIM.visible=false;if(F.q.length)clubQueueClear();return}
 const pc=PL.car||PL,d=Math.hypot(pc.x-K.clubDoor.x,pc.z-K.clubDoor.z),nf=DN.nightF||0;
 const on=nf>.25&&d<700&&!PL.inside;
 if(F.beamIM){F.beamIM.visible=on;if(on){F.beamMat.opacity=.15*Math.min(1,(nf-.25)/.35);clubBeamsPose(F)}}
 if(F.lens)F.lens.color.setHex(on?0xfff6d8:0x8a8a90);
 if(F.water&&d<260){const t=simT;for(const j of F.jets){j.m.scale.y=1.3+.4*Math.sin(t*3.1+j.ph)+.12*Math.sin(t*7.3+j.ph*2);j.g.updateMatrixWorld(true);F.jetIM.setMatrixAt(j.k,j.m.matrixWorld)}if(F.jetIM){F.jetIM.visible=true;F.jetIM.instanceMatrix.needsUpdate=true}
  const g=nf*.6,h=(Math.sin(t*.6)+1)/2;F.water.emissive.setRGB(g*(.1+.7*h),g*(.7-.5*h),g*(.8-.2*h));if(F.lights)F.lights.visible=nf>.3}
 const n0=F.q.length;F.q=F.q.filter(q=>peds.includes(q)&&q.state==='fare'&&q.clubVip);
 if(F.q.length<n0)F.cool=30;F.cool=Math.max(0,(F.cool||0)-dt);
 const want=d<140&&!PL.inside?K.clubVip.filter(s=>s.role==='guard'||nf>.5):[] /* r57: de dia só o segurança na porta */;
 for(const q of F.q.slice())if(!want.includes(q.clubVip)){removePed(q);F.q.splice(F.q.indexOf(q),1)}
 if(F.cool>0)return;
 for(const s of want){if(F.q.some(q=>q.clubVip===s))continue;
  const pal=s.role==='guard'?CLUB_GUARD_PAL:{...pick2(PED_PALS),shirt:pick2(CLUB_SHIRTS)};
  const q=spawnPed(null,{x:s.x,z:s.z,vx:0,vz:0,pal});if(!q)continue;
  q.state='fare';q.fixed=true;q.x=s.x;q.z=s.z;q.vx=q.vz=0;q.mx=s.mx;q.mz=s.mz;q.clubVip=s;F.q.push(q)}}
function motelTick(dt){const d=motelDoor();if(!played||!d)return;MOTEL.lock=Math.max(0,MOTEL.lock-dt);if(!MOTEL.arrOut)MOTEL.arrOut=makeArrow();
 if(MOTEL.fan&&MOTEL.grp&&MOTEL.grp.visible)MOTEL.fan.rotation.y+=dt*4.2;
 if(MOTEL.tv&&MOTEL.grp&&MOTEL.grp.visible){const f=.55+Math.sin(simT*9)*.08+Math.sin(simT*23)*.05;MOTEL.tv.color.setRGB(.16*f,.24*f,.3*f)}
 const show=!PL.inside&&(storyOK('motel')||motelMissionDoor())&&Math.hypot(PL.x-d.x,PL.z-d.z)<160;MOTEL.arrOut.visible=show;if(show){MOTEL.arrOut.position.set(d.x,1.5+Math.sin(simT*3)*.18,d.z);MOTEL.arrOut.rotation.y=simT*1.8}
 if(MOTEL.arrIn&&MOTEL.arrIn.visible){MOTEL.arrIn.position.y=1.5+Math.sin(simT*3)*.18;MOTEL.arrIn.rotation.y=simT*1.8}
 if(PL.dead||PL.car||MOTEL.lock>0||PROLOGUE.cut)return;
 if(!PL.inside&&Math.hypot(PL.x-d.x,PL.z-d.z)<1.2){if(motelMissionDoor())prologueMotelDoor();else motelEnter()}
 else if(PL.inside==='motel'&&!MOTEL.scene&&Math.hypot(PL.x-MOTEL.exit.x,PL.z-MOTEL.exit.z)<.6)motelExit();
 if(PL.inside==='motel'&&MOTEL.IN){const I=MOTEL.IN;PL.x=clamp(PL.x,I.x-I.W+.3,I.x+I.W-.3);PL.z=clamp(PL.z,I.z-I.D+.3,I.z+I.D-.3)}}
function roomStageKind(){
 if(TVM.on)return null;
 if(PL.inside===true)return 'safe';
 const kind=PL.inside;
 return ['ammo','shop','mall','casino','club','heist','pawn','emp','bank','jail','motel','lab','backrooms'].includes(kind)?kind:null;
}
function roomStageRoot(kind){
 switch(kind){
  case 'safe':return SAFE.grp;
  case 'ammo':return AMMO.grp;
  case 'shop':return SHOP.grp;
  case 'mall':return MALL.grp;
  case 'casino':case 'club':return CAS.grp;
  case 'heist':return HEIST.cur&&HEIST.house&&HEIST.house.g;
  case 'pawn':return HEIST.pawnGrp;
  case 'emp':return EMP.grp;
  case 'bank':return BANK.grp;
  case 'jail':return JAIL.grp;
  case 'motel':return MOTEL.grp;
  case 'lab':return LAB.grp;
  case 'backrooms':return BR.grp;
 }
 return null;
}
function roomStageArrows(kind){
 switch(kind){
  case 'safe':return [SAFE.arrowIn];
  case 'ammo':return [AMMO.inArrow];
  case 'shop':return [SHOP.arrIn];
  case 'mall':return [MALL.arrIn];
  case 'casino':return [CAS.arrIn];
  case 'club':return [CAS.arrClubIn];
  case 'heist':return [HEIST.arrIn];
  case 'pawn':return [HEIST.pawnArrIn];
  case 'emp':return [EMP.arrIn];
  case 'bank':return [BANK.arrIn];
  case 'jail':return [JAIL.arrowIn];
  case 'motel':return [MOTEL.arrIn];
  case 'lab':return [LAB.arrIn];
 }
 return [];
}
function roomStageExit(){
 if(!ROOM_STAGE.mode)return;
 for(const o of ROOM_STAGE.hidden){if(o&&o.parent)o.visible=true}
 ROOM_STAGE.hidden.length=0;
 scene.background=ROOM_STAGE.background;scene.fog=ROOM_STAGE.fog;
 ROOM_STAGE.background=null;ROOM_STAGE.fog=null;ROOM_STAGE.mode=null;shadowRefreshAt=-1;
 if(S.shadows)renderer.shadowMap.needsUpdate=true;
}
function roomStageEnter(kind){
 const root=roomStageRoot(kind);if(!root)return;
 // v78: a cena já pode ter ligado o rádio do interior (danceteria: casinoEnter → sceneRadioStart) ANTES do palco entrar
 // — na 1ª entrada da sessão o palco só ativa depois. transitionAudioStop derrubava a KRFM sem erro → silêncio.
 const sceneKind=audioCutKeepScene();
 if(ROOM_STAGE.mode)roomStageExit();
 sceneRadioResume(sceneKind);
 ROOM_STAGE.background=scene.background;ROOM_STAGE.fog=scene.fog;
 scene.background=new THREE.Color(0x08090b);scene.fog=null;
 const keep=new Set([root,PL.sp,PL.sh,...roomStageArrows(kind)]);
 // Keep the original held weapon mesh and the existing particle pool available
 // for gunfire inside banks, stores and criminal interiors. No new materials.
 if(HELD.g)keep.add(HELD.g);
 for(const fx of parts){fx.life=0;fx.vis=false}PART_NORM_IM.count=0;PART_ADD_IM.count=0;keep.add(PART_NORM_IM);keep.add(PART_ADD_IM);
 // The characters of the active room are separate top-level sprites,
 // including mall clerks, club patrons, police and Empire opponents.
 for(const q of peds){
  if(!q||!q.sp||!q.sh)continue;
  let inRoom=Math.hypot(q.x-PL.x,q.z-PL.z)<35;
  if(kind==='safe')inRoom=q===SAFE.mate;
  if(kind==='ammo')inRoom=q===AMMO.clerk;
  if(kind==='shop')inRoom=q===SHOP.cashier;
  if(kind==='pawn')inRoom=q===HEIST.clerk;
  if(kind==='club')inRoom=CAS.clubPeds.includes(q);
  if(kind==='mall')inRoom=MALL.peds.includes(q)||!!q.mallCop;
  if(kind==='bank')inRoom=BANK.tellers.includes(q)||BANK.waiters.includes(q)||!!q.bankCop;
  if(kind==='emp')inRoom=!!EMP.cur&&EMP.cur.gang.includes(q);
  if(kind==='jail')inRoom=q===JAIL.guard;
  if(kind==='motel')inRoom=q===MOTEL.claire;
  if(inRoom){keep.add(q.sp);keep.add(q.sh)}
 }
 for(const obj of scene.children){
  // Keep only the common sky/ambient lighting; street PointLights are inactive.
  if(keep.has(obj)||!obj.visible||obj.isAmbientLight||obj.isDirectionalLight||obj.isHemisphereLight)continue;
  obj.visible=false;ROOM_STAGE.hidden.push(obj);
 }
 ROOM_STAGE.mode=kind;
 if(kind==='backrooms'&&BR.fog){scene.fog=BR.fog;scene.background=BR.bg}
}
function roomStageSync(){
 const want=roomStageKind();if(want===ROOM_STAGE.mode)return;
 if(!TVM.on)roomStageLoadFlash();
 if(ROOM_STAGE.mode)roomStageExit();
 if(want)roomStageEnter(want);
}
function roomStageLoadFlash(){
 const el=$('#roomTransit');if(!el)return;
 const token=++ROOM_STAGE.armed;el.hidden=false;el.style.transition='none';el.style.opacity='0';
 requestAnimationFrame(()=>{if(token!==ROOM_STAGE.armed)return;el.style.transition='opacity .18s ease';el.style.opacity='1'});
 setTimeout(()=>{if(token!==ROOM_STAGE.armed)return;el.style.transition='opacity .32s ease';el.style.opacity='0';setTimeout(()=>{if(token===ROOM_STAGE.armed)el.hidden=true},350)},280);
}
function roomStageHeistTick(dt){
 HEIST.lock=Math.max(0,HEIST.lock-dt);const inH=PL.inside==='heist',inP=PL.inside==='pawn',lt=$('#loot'),hp=$('#heistp');
 if(PL.dead&&HEIST.loot.length){HEIST.loot=[]}
 {const sum=HEIST.loot.reduce((a,b)=>a+b.val,0);let t='';if(HEIST.loot.length)t='ROUBADO · '+HEIST.loot.length+(HEIST.loot.length>1?' itens':' item')+' · <b>$'+sum+'</b>';if(inH)t+=(t?'<br>':'')+(HEIST.alarm?'<i>POLÍCIA A CAMINHO · SAIA!</i>':'SAIA '+tbHTML(HEIST.t/15));if(inP)t+=(t?'<br>':'')+(HEIST.pawnAlarm?'<i>POLÍCIA A CAMINHO</i>':'NÃO DEMORE '+tbHTML((10-HEIST.pawnT)/10));
  if(lt){if(lt.dataset.h!==t){lt.dataset.h=t;lt.innerHTML=t}lt.hidden=!t||!played}}
 for(const a of [HEIST.arrIn,HEIST.pawnArrIn,HEIST.pawnArr,...HEIST.arrows])if(a&&a.visible){a.position.y=1.5+Math.sin(simT*3)*.18;a.rotation.y=simT*1.8}
 if(inH){HEIST.t-=dt;if(HEIST.t<=0&&!HEIST.alarm){HEIST.alarm=true;toast('<span style="color:#ff4a4a">UM VIZINHO CHAMOU A POLÍCIA!</span>')}const it=heistFront();const k=PAD.on?'→':'E',h=it?'<kbd>'+k+'</kbd>PEGAR '+LOOT_NM[it.k]+' · $'+it.val:'';if(hp){if(hp.dataset.h!==h){hp.dataset.h=h;hp.innerHTML=h}hp.hidden=!h}
  const hz=HEIST.house;if(hz){PL.x=clamp(PL.x,hz.bb.x0+.3,hz.bb.x1-.3);PL.z=clamp(PL.z,hz.bb.z0+.3,hz.bb.z1-.3);if(HEIST.lock<=0&&Math.hypot(PL.x-hz.X,PL.z-(hz.Z+3.1))<.8)heistExit()}return}
 if(inP){HEIST.pawnT+=dt;if(HEIST.pawnT>10&&!HEIST.pawnAlarm){HEIST.pawnAlarm=true;toast('<span style="color:#ff4a4a">TEM VIATURA RONDANDO A LOJA…</span>')}const c=HEIST.pawnCounter,near=c&&Math.hypot(PL.x-c.x,PL.z-c.z)<2.4,k=PAD.on?'→':'E',h=near?'<kbd>'+k+'</kbd>'+(HEIST.loot.length?'VENDER TUDO · $'+HEIST.loot.reduce((a,b)=>a+b.val,0):'FALAR COM O DONO'):'';if(hp){if(hp.dataset.h!==h){hp.dataset.h=h;hp.innerHTML=h}hp.hidden=!h}
  const IN=HEIST.pawnIN;PL.x=clamp(PL.x,IN.x-5.6,IN.x+5.6);PL.z=clamp(PL.z,IN.z-4.1,IN.z+4.1);if(HEIST.lock<=0&&Math.hypot(PL.x-IN.x,PL.z-(IN.z+3.6))<.8)pawnExit();return}

}
function roomStageEmpireTick(dt){EMP.lock=Math.max(0,EMP.lock-dt);
 if(PL.inside==='emp'&&EMP.cur){const e=EMP.cur;empGangTick(e,dt);if(EMP.arrIn){EMP.arrIn.position.y=1.5+Math.sin(simT*3)*.18;EMP.arrIn.rotation.y=simT*1.8}
  const left=empGangAlive(e).length,gl=EMP.inner.goods.filter(g=>g.hp>0).length;if(e.phase==='inside'){sideHud('<span style="color:#ff8a1a">IMPÉRIO</span> · capangas '+left+' · '+EMP_INFO[e.id].good.toLowerCase()+'s '+gl);if(!left&&!gl){e.phase='sale';clang(.4);toast('<span style="color:#3dd46a">TERRITÓRIO LIMPO</span><br><small style="font-size:11px;color:#fff">o negócio está à venda · compre na porta ($'+EMP_INFO[e.id].price.toLocaleString(S.lang==='en'?'en-US':'pt-BR')+')</small>');sideHud(null)}}
  if(!PL.dead&&EMP.lock<=0&&EMP.IN&&Math.hypot(PL.x-EMP.IN.x,PL.z-(EMP.IN.z+7-.9))<.8)empExit();if(PL.dead){empDespawn(e);empRoomClearCols();EMP.cur=null;EMP.inner=null}return}
}

/* v2 r17: interiores no Upside Down. A porta abre (abrigo seguro para pensar), mas nada funciona: ninguém dentro,
   sem compras/jogos/assalto (ctxAct bloqueado) e os demogorgons não entram (demoTick só caça com PL.inside falso). */
const INVROOM={msgT:0};
function invRoom(){return S.style==='inverted'&&!!PL.inside}
function invRoomTick(kind){CTX.shop=false;CTX.club=false;CTX.mall=null;CTX.st=null;
 for(const q of peds){if(!q||!q.sp||q.net)continue;if(Math.hypot(q.x-PL.x,q.z-PL.z)>70)continue;q.sp.visible=false;if(q.sh)q.sh.visible=false;q.shootT=99;q.vx=q.vz=0}
 try{if(BANK.rob){bankClear();BANK.rob=null}}catch(e){}SHOP.rob=0}
function roomStageLocalTick(dt){
 if(BOOM.slots.some(sl=>sl.car))boomStop();
 if(DLG.on){dlgTick(dt);return}
 const kind=roomStageKind();if(!kind)return;
 phoneTick(dt);if(PHONE.open||DLG.on||PROLOGUE.cut)return;
 simT+=dt;updatePlayer(dt);meleeTick(dt);updateParts(dt);
 // v78: armas nos interiores com palco (impérios, banco, assalto…). Recarga, tiro contínuo, rastros, foguetes e marcas
 // só rodavam em update(): o 1º tiro saía e GUN.cd nunca baixava → arma travada (mouse e controle).
 weaponTick(dt);updateDecals(dt);if(NPCDROP.n)try{updatePickups(dt)}catch(e){console.error(e)} /* v4 r19: espólio de quem morre dentro (banco, gangues do império) */
 // Interior may have been exited by player input, and the exterior must not
 // restart in the same frame. Each room runs only its own local rules.
 if(!roomStageKind())return;
 CTX.car=false;CTX.shop=false;CTX.club=false;CTX.st=null;CTX.mall=null;
 switch(kind){
  case 'safe':updateSafe(dt);break;
  case 'ammo':ammoTick(dt);break;
  case 'shop':shopTick(dt);break;
  case 'mall':mallTick(dt);break;
  case 'casino':case 'club':casinoTick(dt);clubContextTick();if(kind==='club')try{clubInteriorTick(dt)}catch(e){console.error(e)}break;
  case 'heist':case 'pawn':roomStageHeistTick(dt);break;
  case 'emp':roomStageEmpireTick(dt);break;
  case 'bank':bankTick(dt);break;
  case 'jail':jailTick(dt);break;
  case 'motel':motelTick(dt);break;
  case 'lab':labTick(dt);break;
  case 'backrooms':brInsideTick(dt);break;
 }
 // Only animate room actors, without running the citywide pedestrian AI.
 try{ped3dJobTick()}catch(e){console.error(e);PED3JOB.cur=null} // v78: roupas fora do pool também viram 3D dentro dos interiores
 const root=roomStageRoot(kind);
 if(root){for(const q of peds){
  if(!q||!q.sp||!q.sh||!q.sp.visible||!q.sp.parent)continue;
  const near=Math.hypot(q.x-PL.x,q.z-PL.z)<55;
  if(!near)continue;
  if(q.clubType)clubPedJumpTick(q,dt);
  if(q.shopkeep||q===HEIST.clerk||q===AMMO.clerk)clerkTick(q,dt);
  // Interior gang/police targets move their 'at' anchor without the citywide pedestrian loop.
  if(q.at&&q.state==='clerk'&&!q.shopkeep&&!q.clubType&&q!==HEIST.clerk&&q!==AMMO.clerk){q.x=q.at.x;q.z=q.at.z}
  if(q===SAFE.mate){const dx=PL.x-q.x,dz=PL.z-q.z,d=Math.hypot(dx,dz)||1;q.mx=dx/d;q.mz=dz/d}
  // v77: pedestres que passeiam pelo shopping (andam e animam também no palco do interior)
  let wfr=0;if(q.state==='mwalk'&&kind==='mall'){mallWalkStep(q,dt);if(!q.mwIdle){q.anim=(q.anim||0)+dt*q.spd*.9;const f=Math.floor(q.anim*6)%4;wfr=f===1?1:f===3?2:0}}
  if(q.labRoam&&kind==='lab'){const mv=labRoamStep(q,dt);if(mv){q.anim=(q.anim||0)+dt*1.6*.9;const f=Math.floor(q.anim*6)%4;wfr=f===1?1:f===3?2:0}}
  q.gy=q.labTank?.45+Math.sin(simT*.7)*.09:q.clubType==='stage'?.8:0;if(q.labTank)q.sh.visible=false; // v78: demogorgon boiando na cápsula 201; dançarinos do palco em cima do palco (topo do tablado = 0,8 m)
  setFrame(q.tex,pickDir(q.mx||0,q.mz||1,q.x,q.z),q.clubType?Math.floor(simT*6)%3:wfr);
  placeSprite(q);
 }}
 if(invRoom())invRoomTick(kind);
 heldGunTick();if(toastT>0)toastT=Math.max(0,toastT-dt);
}

