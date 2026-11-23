'use strict';
/* Coastal Chaos · js/16-sprites-peds.js — Faróis do jogador, sprites de pixel, personagens 3D (atlas8).
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= PLAYER HEADLIGHTS ================= */
const HEAD={mode:'auto',spot:new THREE.SpotLight(0xfff2d6,0,48,.52,.55,1.4),beam:null};
HEAD.spot.visible=true;scene.add(HEAD.spot);scene.add(HEAD.spot.target);
HEAD.beam=new THREE.Mesh(new THREE.PlaneGeometry(14,7),new THREE.MeshBasicMaterial({map:glowTex,color:0xfff0c8,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.35}));
HEAD.beam.rotation.x=-Math.PI/2;HEAD.beam.renderOrder=3;HEAD.beam.visible=false;scene.add(HEAD.beam);
function headOn(){return HEAD.mode==='on'||(HEAD.mode==='auto'&&DN.nightF>.45)}
function footFlashOn(){return !!(PHONE.flash&&!PL.car&&!PL.heli&&!PL.dead&&!PL.inside)}
const _v3HL=new THREE.Vector3();
function updateHeadlights(){const c=PL.car,carOn=!!c&&c.alive&&headOn(),footOn=footFlashOn(),on=carOn||footOn;HEAD.spot.intensity=carOn?2.2:(footOn?1.75:0);HEAD.spot.visible=true;HEAD.beam.visible=on;if(!on)return;
 if(carOn){const ca=Math.cos(c.a),sa=Math.sin(c.a),fx=c.x+ca*c.t.L/2,fz=c.z+sa*c.t.L/2;HEAD.spot.position.set(fx,c.gy+.8,fz);HEAD.spot.target.position.set(fx+ca*18,0,fz+sa*18);
  HEAD.beam.position.set(c.x+ca*(c.t.L/2+6),c.gy+.09,c.z+sa*(c.t.L/2+6));HEAD.beam.rotation.z=-c.a;return}
 /* v78: lanterna a pé aponta pra onde a CÂMERA olha (não pro boneco) — antes usava PL.yaw com outra convenção e girava ao contrário */
 const cd=camera.getWorldDirection(_v3HL),a=Math.hypot(cd.x,cd.z)>1e-4?Math.atan2(cd.z,cd.x):(Number.isFinite(PL.yaw)?PL.yaw:0),ca=Math.cos(a),sa=Math.sin(a),hx=PL.x+ca*.42-sa*.18,hz=PL.z+sa*.42+ca*.18,gy=groundY(PL.x,PL.z);
 HEAD.spot.position.set(hx,gy+1.08,hz);HEAD.spot.target.position.set(hx+ca*12,gy+.8,hz+sa*12);
 HEAD.beam.position.set(PL.x+ca*4.8,gy+.07,PL.z+sa*4.8);HEAD.beam.rotation.z=-a}

/* ================= PIXEL SPRITES ================= */
// Personagens 2D em 32x48 por quadro (o dobro do antigo). Paleta personalizável:
// cap (chapéu/boné) · shirt (camisa) · pants (calça) · shoes (sapato) · glasses (óculos, cor da lente ou null) · necklace (colar, cor ou null) + skin/hair/belt/stripe/long
// Roupa de praia: shirt null = sem camisa (tronco e braços na cor da pele); swim = cor da sunga/biquíni (as pernas
// ficam à mostra e a calça some); bikini = parte de cima; shoes null = descalço. pack = mochila do paraquedas (sempre laranja).
const PACK_C='#ff7a1a',PACK_D='#b8500c';
/* v78: detalhe da camisa (art): bolso, botões, listras ou estampa. O jogador escolhe na loja (ESTAMPA); peds sem 'art' ganham um
   detalhe sorteado pelas próprias cores (determinístico, sem mexer nos sorteios da cidade). Só com camisa de verdade. */
/* v78: versão carbonizada (Maskara depois de explosão): qualquer quadro de paleta com burnt vira carvão com cinza e brasas.
   Brancos da cabeça (olhos/dentes) continuam claros. Determinístico por pixel. */
function burnFrame(g,ox,oy,b3){const d=g.getImageData(ox,oy,32,48),a=d.data;for(let y=0;y<48;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(a[i+3]<10)continue;const r=a[i],gg=a[i+1],b=a[i+2],v=(r+gg+b)/765,h=((x*73856093)^(y*19349663))>>>0,n=(h%97)/97;
  if((b3||y<17)&&v>.85&&(!b3||n>.5)){a[i]=a[i+1]=a[i+2]=210;continue}
  let c=26+v*38+n*16;if(n>(b3?.985:.93)){a[i]=232;a[i+1]=96+(h%40);a[i+2]=26;continue}if(n<.12)c+=34;a[i]=c;a[i+1]=c*.92;a[i+2]=c*.86}g.putImageData(d,ox,oy)}
function shirtArtOf(p0){if(!p0.shirt||p0.maskSuit||p0.swim)return null;if(p0.art!==undefined)return p0.art;try{if(p0===PLAYER_PAL||CHAR.list.some(c=>c.look===p0))return null}catch(e){}const k=String(p0.shirt)+p0.pants+p0.skin+p0.hair;let h=0;for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return [null,null,null,'bolso','botoes','listras','estampa'][h%7]}
function shirtArt(px,p0,p,back,dk){const a=shirtArtOf(p0);if(!a)return;const c=new THREE.Color(p.shirt),lum=c.r*.3+c.g*.59+c.b*.11,ink=lum>.55?dk(dk(p.shirt)):'#f2f2ee',sh=dk(p.shirt);
 if(a==='listras'){for(const x of[10,13,16,19])px(x,17,1,12,sh);return}
 if(back)return;
 if(a==='bolso'){px(10,20,3,3,sh);px(10,20,3,1,dk(sh))}
 else if(a==='botoes'){px(15,19,1,1,ink);px(15,22,1,1,ink);px(15,25,1,1,ink);px(12,17,2,1,sh);px(18,17,2,1,sh)}
 else if(a==='estampa'){px(13,21,6,5,ink);px(14,22,4,3,p.shirt);px(15,23,2,1,ink)}
 else if(typeof a==='string'&&a.startsWith('c:'))shirtGlyph(a,(x,y)=>px(x,y,1,1,ink))}
function drawCharFrame(g,ox,oy,dir,fr,p0){const blink=fr===3;if(blink)fr=0;const swc=p0.swim,p={...p0};if(!p0.shirt){p.shirt=p0.skin;p.stripe=null}if(swc){p.pants=p0.skin;p.belt=swc}if(!p.shoes)p.shoes=p0.skin // v78j: fr 3 = piscada (quadro 0, olhos fechados) · v78: o comentário estava engolindo o código da roupa de praia;if(!p.pants)p.pants=p0.skin;
 const px=(x,y,w,h,c)=>{if(!c||w<=0||h<=0)return;g.fillStyle=c;g.fillRect(ox+x,oy+y,w,h)},dk=shadeHex,lt=c=>{const q=new THREE.Color(c).lerp(new THREE.Color('#ffffff'),.25);return '#'+q.getHexString()};
 const capD=p.capDark||(p.cap?dk(p.cap):null),hairD=dk(p.hair),skinD=dk(p.skin),hs=(p0.maskSuit&&p0.handSkin)||p.skin,hsD=dk(hs),eye='#1a1420',lip='#a04a42',gl='#121218';
 if(dir===0||dir===1){const back=dir===1,lL=fr===1?-2:0,lR=fr===2?-2:0,aL=fr===1?2:fr===2?-2:0;
  // pernas e sapatos
  px(10,31,6,11+lL,p.pants);px(17,31,6,11+lR,p.pants);px(back?10:14,31,2,11+lL,dk(p.pants));px(back?17:21,31,2,11+lR,dk(p.pants));
  px(9,42+lL,7,3,p.shoes);px(17,42+lR,7,3,p.shoes);px(9,44+lL,7,1,dk(p.shoes));px(17,44+lR,7,1,dk(p.shoes));
  // tronco
  px(8,17,16,13,p.shirt);px(back?8:21,17,3,13,dk(p.shirt));shirtArt(px,p0,p,back,dk);if(p.stripe)px(8,23,16,2,p.stripe);px(8,29,16,2,p.belt);if(!back&&!swc)px(15,29,2,2,'#c8a040');
  if(swc){px(9,29,15,5,swc);px(back?9:20,29,4,5,dk(swc))}if(p0.bikini){px(8,19,16,3,p0.bikini);px(back?8:21,19,3,3,dk(p0.bikini))}
  if(!back){px(13,17,6,2,p.skin);px(14,19,4,1,p.skin)}
  if(!back)shirtEmo2D(g,ox,oy,p0); /* v3r2: estampa emoji */
  // braços
  px(5,17+aL,3,7,p.shirt);px(5,24+aL,3,4,hs);px(5,28+aL,3,2,hsD);px(24,17-aL,3,7,dk(p.shirt));px(24,24-aL,3,4,hs);px(24,28-aL,3,2,hsD);
  // pescoço e cabeça
  px(13,15,6,2,skinD);
  if(!back){px(10,5,12,9,p.skin);px(11,4,10,1,p.skin);px(11,14,10,1,p.skin);px(9,8,1,3,p.skin);px(22,8,1,3,skinD);px(20,6,2,8,skinD);
   if(blink){px(12,10,3,1,eye);px(17,10,3,1,eye)}else{px(12,9,3,2,'#f4f4f4');px(17,9,3,2,'#f4f4f4');px(13,9,2,2,eye);px(18,9,2,2,eye)}px(12,7,3,1,hairD);px(17,7,3,1,hairD);px(15,11,2,2,skinD);px(14,13,4,1,lip);
   if(p.cap){px(10,1,12,5,p.cap);px(12,1,6,1,lt(p.cap));px(10,5,12,1,capD);px(8,6,16,2,capD);px(9,7,1,3,p.hair);px(22,7,1,3,p.hair)}
   else{px(10,2,12,4,p.hair);px(9,4,2,5,p.hair);px(21,4,2,5,p.hair);px(12,2,5,1,lt(p.hair));if(p.long){px(9,4,2,12,p.hair);px(21,4,2,12,p.hair)}}
   if(p.glasses){px(11,9,4,3,gl);px(17,9,4,3,gl);px(12,9,2,2,p.glasses);px(18,9,2,2,p.glasses);px(15,9,2,1,gl);px(10,9,1,1,gl);px(21,9,1,1,gl);px(12,9,1,1,lt(p.glasses));px(18,9,1,1,lt(p.glasses))}
   if(p.headphone){const hd=dk(p.headphone);px(10,0,12,2,p.headphone);px(9,1,2,6,p.headphone);px(21,1,2,6,p.headphone);px(7,7,4,6,p.headphone);px(21,7,4,6,p.headphone);px(7,11,4,2,hd);px(21,11,4,2,hd)}
   if(p.necklace){px(12,17,8,1,p.necklace);px(15,18,2,2,p.necklace)}}
  else{px(10,3,12,12,p.hair);px(12,3,5,1,lt(p.hair));px(9,8,1,3,p.skin);px(22,8,1,3,p.skin);px(13,15,6,2,p.skin);
   if(p.cap){px(10,1,12,5,p.cap);px(10,5,12,1,capD);px(14,6,4,1,capD)}if(p.long)px(10,15,12,4,p.hair);
   if(p.glasses){px(9,9,1,1,gl);px(22,9,1,1,gl)}if(p.headphone){const hd=dk(p.headphone);px(10,0,12,2,p.headphone);px(7,7,4,6,hd);px(21,7,4,6,hd)}}
  if(p0.pack||p0.bag){const PC=p0.bag||PACK_C,PD=p0.bag?dk(p0.bag):PACK_D;if(back){px(9,17,14,13,PC);px(9,17,14,1,PD);px(9,29,14,1,PD);px(9,17,1,13,PD);px(22,17,1,13,PD);px(11,21,10,1,PD);px(14,24,4,3,PD)}else{px(9,17,2,11,PC);px(21,17,2,11,PC);px(9,25,14,1,PD)}}
 }else{ // perfil (olhando para a esquerda; o lado direito é espelhado)
  if(fr===0){px(13,31,6,11,p.pants);px(16,31,2,11,dk(p.pants));px(10,42,9,3,p.shoes);px(10,44,9,1,dk(p.shoes))}
  else{const a=fr===1;px(a?17:11,31,6,11,dk(p.pants));px(a?17:10,42,7,3,p.shoes);px(a?10:17,31,6,11,p.pants);px(a?8:16,42,8,3,p.shoes);px(a?8:16,44,8,1,dk(p.shoes))}
  px(11,17,11,13,p.shirt);px(19,17,3,13,dk(p.shirt));if(p.stripe)px(11,23,11,2,p.stripe);px(11,29,11,2,p.belt);if(swc)px(11,29,11,5,swc);if(p0.bikini)px(11,19,11,3,p0.bikini);
  const sw=fr===1?-2:fr===2?2:0;px(14+sw,18,5,7,dk(p.shirt));px(14+sw,25,4,4,hs);px(14+sw,29,4,2,hsD);
  px(14,15,5,2,skinD);px(11,4,11,11,p.skin);px(9,10,2,2,p.skin);if(blink)px(12,9,3,1,eye);else{px(12,8,3,2,'#f4f4f4');px(12,8,2,2,eye)}px(12,7,3,1,hairD);px(11,13,3,1,lip);px(17,8,2,3,skinD);
  if(p.cap){px(12,1,10,5,p.cap);px(13,1,5,1,lt(p.cap));px(12,5,10,1,capD);px(7,5,7,2,capD);px(18,6,4,5,p.hair)}
  else{px(12,2,10,4,p.hair);px(18,4,4,9,p.hair);px(13,2,4,1,lt(p.hair));if(p.long)px(18,4,4,13,p.hair)}
  if(p.glasses){px(11,9,4,3,gl);px(12,9,2,2,p.glasses);px(12,9,1,1,lt(p.glasses));px(15,9,5,1,gl)}
  if(p.headphone){px(13,0,8,2,p.headphone);px(17,1,2,6,p.headphone);px(15,6,5,6,p.headphone);px(16,7,3,4,dk(p.headphone))}
  if(p.necklace)px(12,17,4,1,p.necklace);
  if(p0.pack||p0.bag){const PC=p0.bag||PACK_C,PD=p0.bag?dk(p0.bag):PACK_D;px(21,17,5,12,PC);px(25,17,1,12,PD);px(21,28,5,1,PD);px(14,17,2,9,PD)}
 }
 // Traje exclusivo The Mask: colete branco, gravata vermelha, manga longa,
 // fita branca nos sapatos; o cabelo tem a cor do rosto (efeito careca).
 if(p0.maskSuit){if(dir===0){px(13,18,6,11,'#f6f5ed');px(15,19,2,8,'#7a4a28');px(15,21,2,1,'#3e2414');px(15,24,2,1,'#3e2414'); /* v78: gravata marrom listrada */px(14,18,4,1,'#f6f5ed');px(5,23,3,5,p.shirt);px(24,23,3,5,p.shirt);if(p0.handSkin){px(5,28,3,2,p0.handSkin);px(24,28,3,2,p0.handSkin)}}
  else if(dir===1){px(5,23,3,5,p.shirt);px(24,23,3,5,p.shirt);if(p0.handSkin){px(5,28,3,2,p0.handSkin);px(24,28,3,2,p0.handSkin)}}
  else{px(12,18,3,11,'#f6f5ed');px(13,19,2,7,'#7a4a28');px(13,21,2,1,'#3e2414');px(13,24,2,1,'#3e2414');px(14,24,5,7,p.shirt)}
  px(10,43,5,1,'#f5f5f5');px(18,43,5,1,'#f5f5f5')}
 if(CHAR_SHADE)charVolumeShade(g,ox,oy);
}
/* v78 · passada de volume da pixel art (estilo "pré-renderizado"). Só muda as CORES dos pixels já desenhados:
   cada trecho horizontal contínuo (braço, tronco, perna, cabeça) recebe sombreado cilíndrico com luz da esquerda/alto,
   contorno de luz na borda iluminada e leve escurecimento para baixo. Formas, atlas (32×48), material, alphaTest e a
   iluminação dinâmica (actorLighting multiplica mat.color) não mudam. CHAR_SHADE=false volta ao desenho antigo. */
let CHAR_SHADE=false; // v78h: 2D = sprite ORIGINAL (pedido do usuário); a passada de volume fica desligada
function charVolumeShade(g,ox,oy){const W=32,H=48,id=g.getImageData(ox,oy,W,H),a=id.data;
 for(let y=0;y<H;y++){let x=0;const vy=1.05-.12*(y/H);
  while(x<W){if(!a[(y*W+x)*4+3]){x++;continue}let x1=x;while(x1+1<W&&a[(y*W+x1+1)*4+3])x1++;const len=x1-x+1;
   for(let xx=x;xx<=x1;xx++){const i=(y*W+xx)*4,u=(xx-x+.5)/len;
    let k=len>2?(u<.28?1.12:u>.7?.84:1):1;                // 3 tons (luz/base/sombra), como pixel art feito à mão
    if(len>3&&xx===x)k+=.07;                              // borda iluminada
    if(len>3&&xx===x1)k-=.05;                             // borda em sombra
    if(y>0&&!a[((y-1)*W+xx)*4+3])k+=.06;                  // topo de cada forma pega luz (ombros, cabeça, boné)
    k*=vy>1?1:vy<.95?.95:1;const r=a[i],gg=a[i+1],b=a[i+2];
    if(r+gg+b<70)continue;                                // olhos/contornos escuros intactos
    a[i]=Math.min(255,r*k);a[i+1]=Math.min(255,gg*k);a[i+2]=Math.min(255,b*k)}
   x=x1+1}}
 g.putImageData(id,ox,oy)}
function shadeHex(h){const c=new THREE.Color(h).multiplyScalar(.72);return '#'+c.getHexString()}
/* v79r29 · ACABAMENTO DOS SPRITES (casar com a cidade): (1) contorno = tom escuro da própria peça vizinha, não preto puro;
   (2) grão de tecido fixo (±6%, em blocos de 1 pixel do desenho); (3) roupa 15% menos saturada; (4) pés e barra da calça mais escuros
   (sombra de contato). Só no canvas do atlas antes de virar textura: material, alphaTest, luz e shader dos sprites ficam iguais. */
const CHAR_GRADE={on:true,desat:.15,grain:.06,feet:.22,ol:.34};
function charGrade(o,B,W,H,R,feet,blk){if(!CHAR_GRADE.on)return;const G=CHAR_GRADE,px=Math.max(1,blk|0),rr=Math.max(1,R|0);
 for(let y=0;y<H;y++){const fy=y/H,ft=feet&&fy>.74?1-G.feet*Math.min(1,(fy-.74)/.24):1;
  for(let x=0;x<W;x++){const i=(y*W+x)*4;if(!o[i+3])continue;
   if(!B[i+3]){let r=0,g=0,b=0,n=0;for(let d=1;d<=rr&&!n;d++)for(let yy=y-d;yy<=y+d;yy++)for(let xx=x-d;xx<=x+d;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const j=(yy*W+xx)*4;if(B[j+3]){r+=B[j];g+=B[j+1];b+=B[j+2];n++}}
    if(n){const k=G.ol;o[i]=r/n*k+10;o[i+1]=g/n*k+7;o[i+2]=b/n*k+14}continue}
   let r=o[i],g=o[i+1],b=o[i+2];const l=.299*r+.587*g+.114*b;if(l<34){continue} /* olhos, sobrancelha e traços escuros intactos */
   r+=(l-r)*G.desat;g+=(l-g)*G.desat;b+=(l-b)*G.desat;
   const gx=(x/px)|0,gy=(y/px)|0,h=((gx*73856093)^(gy*19349663)^(gx*gy*83492791))>>>0,nz=1+((h%1000)/1000-.5)*2*G.grain,f=nz*ft;
   o[i]=r*f;o[i+1]=g*f;o[i+2]=b*f}}}
function makeAtlas(p){const at=cv(128,192),ag=at.getContext('2d');
 for(let d=0;d<4;d++)for(let f=0;f<4;f++){const t=cv(32,48),tg=t.getContext('2d',{willReadFrequently:true});drawCharFrame(tg,0,0,d===3?2:d,f,p);
  const id=tg.getImageData(0,0,32,48),a=id.data,o=new Uint8ClampedArray(a);
  for(let y=0;y<48;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if(a[i+3])continue;
   const n=(xx,yy)=>xx>=0&&xx<32&&yy>=0&&yy<48&&a[(yy*32+xx)*4+3]>0;
   if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1)){o[i]=18;o[i+1]=12;o[i+2]=26;o[i+3]=255}}
  charGrade(o,a,32,48,1,true,1);id.data.set(o);tg.putImageData(id,0,0);
  if(d===3){ag.save();ag.translate(f*32+32,d*48);ag.scale(-1,1);ag.drawImage(t,0,0);ag.restore()}else ag.drawImage(t,f*32,d*48)}
 return at}
const PLAYER_PAL={art:null,cap:'#d62828',capDark:null,skin:'#f1c27d',hair:'#4a2a12',shirt:'#2f6fd6',pants:'#2b3550',swim:null,headphone:null,bag:null,pack:false,shoes:'#1b1b1b',belt:'#3a2a1a',stripe:null,glasses:null,necklace:null};
// futura loja de roupas: muda PLAYER_PAL (cap/shirt/pants/shoes, glasses/necklace on-off) e chama applyPlayerLook()
function applyPlayerLook(){if(PLAYER_PAL.art===undefined)PLAYER_PAL.art=null;atlasCache.delete(PLAYER_PAL);const t=S.sprite8===true?atlas8Tex({...PLAYER_PAL},16,PL_RES3D):atlasTex(PLAYER_PAL);const o=PL.tex;PL.tex=t;PL.sp.material.map=t;PL.sp.material.needsUpdate=true;if(o)o.dispose();try{playerReliefSync()}catch(e){}}
const PED_ATLAS_N=25,PED_PALS=[];(()=>{const skins=['#f1c27d','#e0ac69','#c68642','#8d5524','#ffdbac','#a86b3c'],hairs=['#1b1210','#4a2a12','#c9a04a','#6b3a1e','#2a2a2a','#9a9a9a','#7a1e1e'],
 shirts=['#e04a3a','#3ab36a','#e8e3d6','#2a2a33','#e0b23a','#7a4ad6','#1e8ad6','#d65aa0','#4a6a3a','#c86a2a'],pants=['#2b3550','#3a3a3a','#5a4a3a','#1e2a5a','#6a5a4a','#222'];
 for(let i=0;i<PED_ATLAS_N;i++){const cap=Math.random()<.3;PED_PALS.push({skin:pick2(skins),hair:pick2(hairs),cap:cap?pick2(['#2a6ad6','#e0b23a','#2a2a2a','#3ab36a']):null,capDark:null,shirt:pick2(shirts),pants:pick2(pants),shoes:pick2(['#1b1b1b','#e8e8e8','#6a3a1e']),belt:'#2a1e14',stripe:Math.random()<.3?'#ffffff':null,long:!cap&&Math.random()<.4,glasses:Math.random()<.16?pick2(['#1a1a24','#3a6a8a','#5a3a20']):null,necklace:Math.random()<.12?pick2(['#e8c040','#d8d8e0']):null})}})();
// Avoid a session with no glasses in the shared pedestrian palette pool.
{const candidates=PED_PALS.filter(p=>!p.glasses);let n=PED_PALS.filter(p=>p.glasses).length;while(n<3&&candidates.length){const i=Math.floor(Math.random()*candidates.length),p=candidates.splice(i,1)[0];p.glasses=pick2(['#1a1a24','#3a6a8a','#5a3a20']);n++;}}
/* v3r3: 40% (10 de 25) das roupas da rua sai com estampa de emoji colorido (art 'e:…', emojis diferentes entre si). Fica no próprio PED_PALS,
   então entra no atlas 2D e no pré-carregamento 3D (pedAtlas3Build) como as outras roupas: nenhum boneco novo é montado na rua (sem stutter). */
const PED_EMO=['😎','😂','😍','🤩','😜','🥳','🤠','👽','👾','🤖','💀','👻','🔥','⚡','🌈','⭐','💯','❤️','💚','💙','💜','🌴','🌵','🌻','🌸','🍕','🍔','🍩','🍉','🍒','🥑','🦈','🐙','🦄','🐸','🐱','🐶','🦊','🐼','🦖','🎸','🎮','🏀','⚽','🏄','🛹','🚀','🌊','☀️','🍀','💎','🎧','📼','🌮'];
try{const pool=PED_EMO.filter(e=>emoOk(e)&&emoVisible(e)),cand=PED_PALS.filter(p=>p.shirt);const n=Math.min(pool.length,Math.round(PED_PALS.length*.4));for(let i=0;i<n&&cand.length;i++){const p=cand.splice(Math.floor(Math.random()*cand.length),1)[0],e=pool.splice(Math.floor(Math.random()*pool.length),1)[0];p.art='e:'+e}}catch(e){}
// Banhistas: as mesmas pessoas da cidade, de sunga (cabelo comprido = biquíni), sem camisa e descalças.
const BEACH_PALS=PED_PALS.map(p=>{const s=pick2(['#1e5ab0','#d62828','#1b1b1b','#2ac8c8','#f2c21a','#ff6fae','#3ab36a','#ff8a1a']);return{...p,cap:Math.random()<.2?'#f2f2ee':null,shirt:null,stripe:null,swim:s,bikini:p.long?s:null,shoes:null,glasses:Math.random()<.35?'#121218':null}});
const atlasCache=new Map();
/* v78 · ATLAS ÚNICO DOS PEDS (2D): as 25 roupas da cidade (PED_PALS) + as 25 de praia (BEACH_PALS) num só canvas
   1280×960 (10×5 blocos de 128×192). Uma textura na GPU para todos os pedestres comuns, em vez de uma por ped.
   Cada ped tem um PROXY leve (offset/repeat próprios, nunca vai à GPU); o onBeforeRender do sprite copia o quadro
   para a textura compartilhada logo antes do draw (mesmo mecanismo do v78m). Roupas fora do pool continuam com textura própria. */
const PEDATLAS={tex:null,idx:new Map(),W:1280,H:960};
function pedAtlasBuild(){if(PEDATLAS.tex)return PEDATLAS.tex;const pals=[...PED_PALS,...BEACH_PALS],W=PEDATLAS.W,H=PEDATLAS.H,c=cv(W,H),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 pals.forEach((p,i)=>{const tx=(i%10)*128,ty=Math.floor(i/10)*192;let a=atlasCache.get(p);if(!a){a=makeAtlas(p);atlasCache.set(p,a)}g.drawImage(a,tx,ty);PEDATLAS.idx.set(p,[tx,ty])});
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.isSharedChar=true;try{renderer.initTexture(t)}catch(e){}PEDATLAS.tex=t;
 /* v79r31: variantes de luz por relevo (esquerda/direita) no mesmo layout */
 PEDATLAS.V=[t];for(const side of [-1,1]){const c2=cv(W,H),g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;pals.forEach((p,i)=>{g2.drawImage(makeAtlasV(p,side),(i%10)*128,Math.floor(i/10)*192)});const t2=new THREE.CanvasTexture(c2);t2.magFilter=THREE.NearestFilter;t2.minFilter=THREE.NearestFilter;t2.generateMipmaps=false;t2.isSharedChar=true;try{renderer.initTexture(t2)}catch(e){}PEDATLAS.V.push(t2)}
 return t}
function pedAtlasProxy(p){const t=pedAtlasBuild(),at=PEDATLAS.idx.get(p);if(!at)return null;
 return{isChar:true,isProxy:true,isPedAtlas:true,tile:at,shared:t,sharedV:PEDATLAS.V||null,offset:new THREE.Vector2(at[0]/PEDATLAS.W,1-(at[1]+48)/PEDATLAS.H),repeat:new THREE.Vector2(32/PEDATLAS.W,48/PEDATLAS.H),dispose(){}}}
/* v1r12: sprite 2D do jogador/personagens ampliado 2× com Scale2x (arredonda os degraus sem inventar pixel nem borrar); a base 32×48 continua no atlasCache (relevo e retratos usam ela) */
const atlasCache2x=new WeakMap();
function pixelScale2x(src){const w=src.width,h=src.height,a=src.getContext('2d').getImageData(0,0,w,h).data,c=cv(w*2,h*2),g=c.getContext('2d'),o=g.createImageData(w*2,h*2),O=o.data;
 const px=(x,y)=>{x=x<0?0:x>=w?w-1:x;y=y<0?0:y>=h?h-1:y;const i=(y*w+x)*4;return a[i+3]<128?-1:(a[i]<<16|a[i+1]<<8|a[i+2])};
 const put=(x,y,v)=>{const i=(y*w*2+x)*4;if(v<0){O[i+3]=0;return}O[i]=v>>16&255;O[i+1]=v>>8&255;O[i+2]=v&255;O[i+3]=255};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const P=px(x,y),A=px(x,y-1),B=px(x+1,y),C=px(x-1,y),D=px(x,y+1);let e0=P,e1=P,e2=P,e3=P;
  if(C===A&&C!==D&&A!==B)e0=A;if(A===B&&A!==C&&B!==D)e1=B;if(D===C&&D!==B&&C!==A)e2=C;if(B===D&&B!==A&&D!==C)e3=D;put(2*x,2*y,e0);put(2*x+1,2*y,e1);put(2*x,2*y+1,e2);put(2*x+1,2*y+1,e3)}
 g.putImageData(o,0,0);return c}
function atlasTex(p){let c0=atlasCache.get(p);if(!c0){c0=makeAtlas(p);atlasCache.set(p,c0)}let c=atlasCache2x.get(c0);if(!c){c=pixelScale2x(c0);atlasCache2x.set(c0,c)}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(32/128,48/192);t.isChar=true;return t}
/* v78 · PROTÓTIPO "PRÉ-RENDERIZADO" (estilo Donkey Kong Country), só do jogador, opção S.sprite8.
   Boneco de blocos montado da MESMA paleta (PLAYER_PAL), fotografado pelo próprio renderer numa cena separada em
   8 ângulos × 3 poses, cada foto 32×48 (mesmo quadro do atlas 2D) + o mesmo contorno escuro. Resultado vai num
   CanvasTexture comum: SpriteMaterial, alphaTest, camada e actorLighting (cor multiplicada) não mudam.
   Atlas 96×384: colunas = pose, linhas = ângulo r (0 = de costas, 2 = virado à direita da tela, 4 = de frente, 6 = esquerda). */
const ATLAS8={cache:new Map(),rt:null,scene:null,cam:null};
const PL_RES3D=4; /* v1r12: jogador (e o fantasma da máscara) no modo 3D fotografado em 4× (128×192 por quadro); pedestres seguem 2× no PED3 */
// v78i: boneco 3D separado em charModel3D (usado pelo atlas e pelo retrato). face={eyes:'open'|'closed',mouth:'closed'|'open'}
// só repinta a textura do rosto (setFace), sem refazer a geometria.
function charModel3D(p0,face={}){const p={...p0};if(!p.shirt){p.shirt=p0.skin;p.stripe=null}if(p0.swim){p.pants=p0.skin;p.belt=p0.swim}if(!p.shoes)p.shoes=p0.skin;if(!p.pants)p.pants=p0.skin;
 // Histórico: v78 blocos → v78b cilindros (feio) → v78c chibi (parecia criança) → v78e adulto + blocos arredondados →
 // v78f rosto PINTADO numa textura (olhos em relevo deslizavam na diagonal = "vesgo"), cabeça com raio menor, 2×.
 const mats=[],geos=[],tex=[];
 const rbox=(w,h,d,rmax=1.6)=>{const r=Math.min(rmax,Math.min(w,h,d)*.28),ge=new THREE.BoxGeometry(w,h,d,4,4,4),pa=ge.attributes.position,v=new THREE.Vector3(),hx=w/2-r,hy=h/2-r,hz=d/2-r;
  if(r>.12){for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);const cx=Math.max(-hx,Math.min(hx,v.x)),cy=Math.max(-hy,Math.min(hy,v.y)),cz=Math.max(-hz,Math.min(hz,v.z)),o=new THREE.Vector3(v.x-cx,v.y-cy,v.z-cz);if(o.lengthSq()>1e-8)o.setLength(r);pa.setXYZ(i,cx+o.x,cy+o.y,cz+o.z)}ge.computeVertexNormals()}return ge};
 const g=new THREE.Group(),lam=c=>{const m=new THREE.MeshLambertMaterial({color:new THREE.Color(c)});mats.push(m);return m},
  box=(par,w,h,d,x,y,z,c,rmax)=>{const ge=rbox(w,h,d,rmax);geos.push(ge);const o=new THREE.Mesh(ge,Array.isArray(c)?c:lam(c));o.position.set(x,y,z);par.add(o);return o};
 const fc=cv(32,32),fg=fc.getContext('2d'),R=(x,y,w,h,c)=>{fg.fillStyle=c;fg.fillRect(x,y,w,h)},skD=shadeHex(p.skin),lip='#a04a42';
 const paint=f=>{fg.clearRect(0,0,32,32);R(0,0,32,32,p.skin);R(0,27,32,5,skD);
  for(const ex of[7,18]){R(ex,9,7,2,p.hair); /* v78: olhos mais perto do centro (a borda arredondada da cabeça espremia o lado de fora → vesgo) */
   if(p0.demo){R(ex,12,7,7,'#0a3a12');R(ex+1,13,5,5,'#2aff4a');R(ex+2,14,3,3,'#d0ffd8');continue} /* v2 r1: Demogorgon 3D — olhos sem piscar; v2 r2.1: verdes (pedido do usuário) */
   if(f.eyes==='closed'){R(ex,15,7,2,'#1a1420');R(ex+1,17,5,1,skD)}
   else{const lk=(f.look||0)*2;R(ex,12,7,7,'#f6f6f6');R(ex,18,7,1,skD);R(ex+2+lk,13,3,6,'#1a1420');R(ex+2+lk,13,1,1,'#ffffff');R(ex+3+lk,13,1,1,'#3a3050')}}
  R(15,17,2,4,skD);
  if(p0.demo){R(12,4,8,1,'#e51b27');R(15,5,2,3,'#b71320');R(2,10,2,7,'#b71320');R(28,10,2,7,'#b71320');R(10,22,12,3,'#3a0a0e');return} /* veias da testa/laterais e boca escura, como o atlas 2D */
  if(f.mouth==='open'){R(13,22,6,4,'#4a141a');R(14,22,4,1,'#f4f4f4');R(13,26,6,1,shadeHex(lip))}else{R(13,23,6,2,lip);R(14,25,4,1,shadeHex(lip))}
  if(p.glasses){fg.fillStyle='#121218';for(const ex of[5,18]){fg.fillRect(ex,11,9,1);fg.fillRect(ex,19,9,1);fg.fillRect(ex,11,1,9);fg.fillRect(ex+8,11,1,9)}fg.fillRect(14,13,4,1);fg.globalAlpha=.35;R(6,12,7,7,p.glasses);R(19,12,7,7,p.glasses);fg.globalAlpha=1}};
 paint(face);
 const ft=new THREE.CanvasTexture(fc);ft.magFilter=ft.minFilter=THREE.NearestFilter;ft.generateMipmaps=false;tex.push(ft);
 const faceM=new THREE.MeshLambertMaterial({color:0xffffff,map:ft});mats.push(faceM);const skinM=lam(p.skin),headMats=[skinM,skinM,skinM,skinM,faceM,skinM];
 const legs=[-1,1].map(sx=>{const q=new THREE.Group();q.position.set(sx*3,16,0);g.add(q);box(q,5,14,5,0,-7,0,p.pants);box(q,5.4,3,7,0,-14.5,1,p.shoes);return q});
 box(g,13,13,7,0,22.5,0,p.shirt);if(p.stripe)box(g,13.2,2,7.2,0,23,0,p.stripe);if(p0.bikini){box(g,13.3,3.2,7.3,0,25.4,0,p0.bikini);for(const sx of[-1,1])box(g,1.2,2.8,7.25,sx*3.2,28.1,0,p0.bikini)} /* v78: parte de cima do biquíni também no boneco 3D (faltava) */box(g,13.4,2.2,7.4,0,16.6,0,p.belt||'#3a2a1a');
 /* v78: detalhe da camisa (bolso/botões/listras/estampa da Moda Pixel) também no 3D — antes só o sprite 2D desenhava (shirtArt), então a compra não aparecia */
 {const a=p0.demo?null:shirtArtOf(p0);if(a){const sh=shadeHex(p.shirt),cc=new THREE.Color(p.shirt),ink=(cc.r*.3+cc.g*.59+cc.b*.11)>.55?shadeHex(shadeHex(p.shirt)):'#f2f2ee',F=(x,y,w,h,col,dz=.12)=>box(g,w,h,.3,x+w/2-16,29-(y-17)-h/2,3.5+dz,col,.05);
  if(a==='listras'){for(const x of[10,13,16,19])box(g,1,12,7.16,x+.5-16,23,0,sh,.05)}
  else if(a==='bolso'){F(10,20,3,3,sh);F(10,20,3,1,shadeHex(sh),.16)}
  else if(a==='botoes'){F(15,19,1,1,ink);F(15,22,1,1,ink);F(15,25,1,1,ink);F(12,17,2,1,sh);F(18,17,2,1,sh)}
  else if(a==='estampa'){F(13,21,6,5,ink);F(14,22,4,3,p.shirt,.16);F(15,23,2,1,ink,.2)}
  else if(typeof a==='string'&&a.startsWith('c:'))shirtGlyph(a,(x,y)=>F(x,y,1,1,ink,.16))
  else if(typeof a==='string'&&a.startsWith('e:')){const e=shirtEmoOf(p0);if(e){const et=new THREE.CanvasTexture(emoCanvas(e,64));tex.push(et);const em=new THREE.MeshLambertMaterial({map:et,transparent:true,alphaTest:.35});mats.push(em);const eg=new THREE.PlaneGeometry(7.4,7.4);geos.push(eg);const o=new THREE.Mesh(eg,em);o.position.set(0,22.2,3.82);g.add(o)}}}} /* v3r2: emoji colorido no peito (plano com a textura do emoji; só de frente) */
 if(p0.maskSuit){box(g,5,11,.4,0,23.4,3.65,'#f6f5ed');box(g,1.6,9,.5,0,22.8,3.95,'#7a4a28');box(g,1.7,.6,.6,0,24.8,3.98,'#3e2414');box(g,1.7,.6,.6,0,21.6,3.98,'#3e2414')} /* v78: camisa branca e gravata do traje também no 3D */
 const arms=[-1,1].map(sx=>{const q=new THREE.Group();q.position.set(sx*8,28,0);g.add(q);box(q,3.4,8,3.6,0,-4,0,p.shirt);box(q,3,4,3.2,0,-10,0,(p0.maskSuit&&p0.handSkin)||p.skin);return q}); // v78: Maskara = só a cabeça verde
 box(g,4,2,4,0,30,0,p.skin);const h=new THREE.Group();h.position.set(0,31,0);g.add(h);box(h,11,11,10,0,5.5,0,headMats,.7);
 box(h,1.6,1.8,1.2,0,4.5,5.3,p.skin,.4);
 if(p.cap){box(h,11.8,4.4,10.8,0,10.4,0,p.cap,1);box(h,11.8,1.2,6,0,8.6,6.6,p.capDark||shadeHex(p.cap),.5);box(h,11.4,5,1.2,0,6,-5.1,p.hair)}
 else{box(h,11.8,3.6,10.8,0,10.6,0,p.hair,1);box(h,11.8,8,2,0,7,-4.6,p.hair);for(const sx of[-1,1])box(h,1.2,5,8,sx*5.7,7.5,-.5,p.hair);if(p.long)box(h,11.8,12,2,0,2,-5.4,p.hair)}
 if(p.headphone){box(h,12.4,1.6,2,0,11.8,0,p.headphone);for(const sx of[-1,1])box(h,1.6,4,4,sx*6.2,6,0,p.headphone)}
 if(p.necklace)box(g,8,1,7.6,0,28.4,.1,p.necklace);if(p0.pack||p0.bag)box(g,10,11,3,0,22,-5,p0.bag||(typeof PACK_C!=='undefined'?PACK_C:'#5a3a24'));
 const pose=f=>{const a=f===1?.45:f===2?-.45:0;legs[0].rotation.x=a;legs[1].rotation.x=-a;arms[0].rotation.x=-a*.8;arms[1].rotation.x=a*.8};
 return {g,pose,setFace:f=>{paint(f);ft.needsUpdate=true},dispose:()=>{geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());tex.forEach(x=>x.dispose())}}}
// v78: versão queimada (p.burnt) — 2D: passa o quadro pelo burnFrame; 3D: escurece os materiais do boneco (olhos claros no rosto continuam)
drawCharFrame=(f=>function(g,ox,oy,dir,fr,p0){f.apply(this,arguments);if(p0&&p0.burnt)burnFrame(g,ox,oy)})(drawCharFrame);
atlas8Build=(f=>function(p0){const c=f.apply(this,arguments);if(p0&&p0.burnt&&c&&c.getContext){const g=c.getContext('2d'),W=c.width,H=c.height;for(let y=0;y<H;y+=48)for(let x=0;x<W;x+=32)burnFrame(g,x,y,true)}return c})(atlas8Build); // 3D: carboniza o atlas já assado (não mexe em luz/shader)
// cena/luz compartilhadas; um render target por tamanho
/* v79r32: lado da luz do estúdio dos bonecos 3D (0 = a de sempre, alto-esquerda-frente; −1/1 = luz rasante pela esquerda/direita da tela) */
function char3DLight(side){const d=ATLAS8.dirL;if(!d)return;if(side<0)d.position.set(-1.9,1.05,.55);else if(side>0)d.position.set(1.9,1.05,.55);else d.position.set(-1,1.5,1.3);d.intensity=side?1.15:.8;if(ATLAS8.amb)ATLAS8.amb.intensity=side?.42:.6} /* r33: relevo 2× mais marcado (lado escuro com menos ambiente, lado claro com mais sol) */
function char3DStage(W,H){const A=ATLAS8;A.rts=A.rts||{};const key=W+'x'+H;
 if(!A.rts[key]){const t=new THREE.WebGLRenderTarget(W,H,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});t.texture.encoding=renderer.outputEncoding;A.rts[key]=t}
 if(!A.scene){A.scene=new THREE.Scene();A.amb=new THREE.AmbientLight(0xffffff,.6);A.scene.add(A.amb);const d=new THREE.DirectionalLight(0xffffff,.8);d.position.set(-1,1.5,1.3);A.scene.add(d);A.dirL=d}
 return A.rts[key]}
// fotografa a cena num canvas W×H com contorno escuro de `ol` pixels
function char3DShoot(cam,rt,W,H,ol,feet=true){const buf=new Uint8Array(W*H*4);renderer.setRenderTarget(rt);renderer.clear();renderer.render(ATLAS8.scene,cam);renderer.readRenderTargetPixels(rt,0,0,W,H,buf);
 const c=cv(W,H),cc=c.getContext('2d'),id=cc.createImageData(W,H),o=id.data;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const si=((H-1-y)*W+x)*4,di=(y*W+x)*4;if(buf[si+3]>100){o[di]=buf[si];o[di+1]=buf[si+1];o[di+2]=buf[si+2];o[di+3]=255}}
 const B0=new Uint8ClampedArray(o);for(let pass=0;pass<ol;pass++){const a=new Uint8ClampedArray(o);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(a[i+3])continue;const n=(xx,yy)=>xx>=0&&xx<W&&yy>=0&&yy<H&&a[(yy*W+xx)*4+3]>0;
  if(n(x-1,y)||n(x+1,y)||n(x,y-1)||n(x,y+1)){o[i]=18;o[i+1]=12;o[i+2]=26;o[i+3]=255}}}
 charGrade(o,B0,W,H,ol,feet,Math.max(1,Math.round(H/48)));cc.putImageData(id,0,0);return c}
function char3DWith(fn){const oldRT=renderer.getRenderTarget(),oldC=renderer.getClearColor(new THREE.Color()).clone(),oldA=renderer.getClearAlpha(),sm=renderer.shadowMap,se=sm.enabled,sn=sm.needsUpdate,sa=sm.autoUpdate,ar=renderer.info.autoReset;renderer.setClearColor(0x000000,0);
 /* v78: a foto do boneco não pode consumir a atualização do mapa de sombra do mundo nem refazê-lo */sm.enabled=false;sm.autoUpdate=false;renderer.info.autoReset=false;
 try{return fn()}finally{renderer.setRenderTarget(oldRT);renderer.setClearColor(oldC,oldA);sm.enabled=se;sm.autoUpdate=sa;sm.needsUpdate=sn;renderer.info.autoReset=ar}}
function atlas8Build(p0,N=8,RES0=2,side=0){const A=ATLAS8,RES=RES0,CW=32*RES,CH=48*RES,rt=char3DStage(CW,CH);
 if(!A.cam){const tilt=.17;A.cam=new THREE.OrthographicCamera(-16,16,24.5,-24.5,-80,80);A.cam.position.set(0,23+40*Math.sin(tilt),40*Math.cos(tilt));A.cam.lookAt(0,23,0)}
 const M=charModel3D(p0),out=cv(4*CW,N*CH),oc=out.getContext('2d');A.scene.add(M.g);
 char3DLight(side);try{char3DWith(()=>{for(let r=0;r<N;r++){M.g.rotation.y=Math.PI-r*Math.PI*2/N;{const ya=Math.atan2(Math.sin(M.g.rotation.y),Math.cos(M.g.rotation.y));M.setFace({look:Math.abs(ya)<.3?0:Math.sign(ya)*PED_LOOK})}for(let f=0;f<3;f++){M.pose(f);oc.drawImage(char3DShoot(A.cam,rt,CW,CH,RES),f*CW,r*CH)}
   M.pose(0);M.setFace({eyes:'closed'});oc.drawImage(char3DShoot(A.cam,rt,CW,CH,RES),3*CW,r*CH);M.setFace({})}})} // v78j: coluna 3 = piscada
 finally{A.scene.remove(M.g);M.dispose();char3DLight(0)}
 return out}
/* v78i · RETRATO plano (foto de frente, cabeça e ombros, 192×192) para os cards de modo e a caixa de diálogo.
   Independe de 2D/3D. 4 variações (olhos abertos/fechados × boca fechada/aberta) geradas uma vez por paleta. */
const PORTRAIT={cache:new Map(),cam:null};
function charPortrait(pal){if(S.char3d===true&&typeof c3Portrait==='function')return c3Portrait(pal);/* r42: no modo 3D a foto é do boneco PS1 */const k=JSON.stringify(pal);let P=PORTRAIT.cache.get(k);if(P)return P;
 const S0=192,rt=char3DStage(S0,S0);if(!PORTRAIT.cam){PORTRAIT.cam=new THREE.OrthographicCamera(-12.5,12.5,12.5,-12.5,-80,80);PORTRAIT.cam.position.set(0,33.5+40*Math.sin(.06),40*Math.cos(.06));PORTRAIT.cam.lookAt(0,33.5,0)}
 const M=charModel3D({...pal,pack:false});M.g.rotation.y=0;M.pose(0);ATLAS8.scene.add(M.g);P={};
 try{char3DWith(()=>{for(const eyes of['open','closed'])for(const mouth of['closed','open']){M.setFace({eyes,mouth});P[eyes+'_'+mouth]=char3DShoot(PORTRAIT.cam,rt,S0,S0,3,false)}})}
 finally{ATLAS8.scene.remove(M.g);M.dispose()}
 PORTRAIT.cache.set(k,P);return P}
/* v78l · RESERVA de texturas 3D (stutter a cada ped que surgia: cada ped criava uma textura de ~1,5 MB e a GPU a recebia
   na 1ª renderização). Agora: textura de ped que some volta para a reserva da sua roupa (charTexRelease) e o próximo ped
   com a mesma roupa reaproveita uma já enviada à GPU. charPreload3D() gera os bonecos e pré-envia texturas no carregamento. */
const CHARTEX_POOL=new Map();
function charTexRelease(t){if(!t||t.isProxy||t.isSharedChar)return;if(t.isAtlas8&&t.palKey){let a=CHARTEX_POOL.get(t.palKey);if(!a)CHARTEX_POOL.set(t.palKey,a=[]);if(a.length<48&&!a.includes(t)){t._bk=0;a.push(t);return}}t.dispose()}
function atlas8Key(p,N,RES){return 'b4|'+N+'|'+RES+'|'+JSON.stringify(p)}
function atlas8Canvas(p,N,RES){return atlas8CanvasSide(p,N,RES,0)}
/* v1r22: cache também dos lados de relevo; versão queimada (máscara) sai da normal já assada + carbonização 2D (antes refotografava o boneco 3× → travada) */
function atlas8CanvasSide(p,N,RES,side){const k=(side?'rel'+side+'|':'')+atlas8Key(p,N,RES);let c=ATLAS8.cache.get(k);if(c)return c;
 if(p.burnt){const q={...p};delete q.burnt;const b=atlas8CanvasSide(q,N,RES,side);c=cv(b.width,b.height);const g=c.getContext('2d');g.drawImage(b,0,0);for(let y=0;y<c.height;y+=48)for(let x=0;x<c.width;x+=32)burnFrame(g,x,y,true)}
 else c=atlas8Build(p,N,RES,side);
 ATLAS8.cache.set(k,c);return c}
function atlas8NewTex(c,N,k){const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(1/4,1/N);t.isAtlas8=true;t.dirsN=N;t.isChar=true;t.palKey=k;return t}
function atlas8Tex(p,N=8,RES=2){const k=atlas8Key(p,N,RES),pool=CHARTEX_POOL.get(k);if(pool&&pool.length)return pool.pop();return atlas8NewTex(atlas8Canvas(p,N,RES),N,k)}
// v78m: peds 3D usam UMA textura por roupa (atlas8Shared) + um proxy leve por ped (offset/repeat próprios, nunca enviado
// à GPU). ~15 roupas ≈ 23 MB em vez de ~1,5 MB por ped; ped novo não envia nada à GPU (sem stutter).
const SHARED_TEX=new Map();
function atlas8Shared(p,N,RES){const k=atlas8Key(p,N,RES);let t=SHARED_TEX.get(k);if(!t){t=atlas8NewTex(atlas8Canvas(p,N,RES),N,k);t.isSharedChar=true;try{renderer.initTexture(t)}catch(e){}SHARED_TEX.set(k,t)}return t}
function atlas8Proxy(p,N=16,RES=2){const sh=atlas8Shared(p,N,RES);return{isAtlas8:true,isProxy:true,isChar:true,dirsN:N,shared:sh,palKey:sh.palKey,offset:new THREE.Vector2(),repeat:sh.repeat.clone(),dispose(){}}}
/* ===== v78 · PEDS 3D SEM PICO =====
   Antes: cada roupa nova montava o boneco e tirava 64 fotos (com leitura síncrona da GPU) NO MEIO do jogo → pico.
   Agora: (1) no carregamento, as 25 roupas da cidade + o policial e as 25 de praia viram DOIS atlas 3D (1×, 16 ângulos × 4 quadros,
   1280×2304 cada); (2) ped com roupa fora do pool nasce com a roupa mais parecida do atlas e a roupa dele é montada
   AOS POUCOS (uma fileira de ângulos por quadro, `ped3dJobTick`), trocando sozinha quando fica pronta. */
const PED3={tex:[],rts:[],idx:new Map(),W:1280,H:2304,built:false,ms:0};
const PED_LOOK=1; // v78: lado pra onde as pupilas vão quando o boneco gira (1/−1)
/* Fotos direto numa textura da GPU (sem readPixels = sem esperar a GPU). Contorno escuro de 1 px = silhueta preta deslocada
   ±1 px nas 4 direções antes do boneco (mesmo resultado do contorno que era feito na CPU). Linhas de baixo para cima,
   então a conta de UV é a mesma do canvas. */
const CH3D={olm:null};
function char3DCam(){const A=ATLAS8;if(!A.cam){const tilt=.17;A.cam=new THREE.OrthographicCamera(-16,16,24.5,-24.5,-80,80);A.cam.position.set(0,23+40*Math.sin(tilt),40*Math.cos(tilt));A.cam.lookAt(0,23,0)}char3DStage(32,48);return A.cam}
function char3DBakeRow(rt,M,x0,yTop,r,RS=1){const A=ATLAS8,cam=char3DCam(),CW=32*RS,CH=48*RS; /* v1r15: RS = resolução (o contorno de 1 unidade vira RS px, igual ao jogador) */if(!CH3D.olm)CH3D.olm=new THREE.MeshBasicMaterial({color:new THREE.Color(18/255,12/255,26/255)});
 const p0=cam.position.clone();M.g.rotation.y=Math.PI-r*Math.PI*2/16;
 /* v78: olhar acompanha o giro da cabeça (de 3/4 e de lado as duas pupilas vão pro mesmo lado — antes pareciam vesgas) */
 const ya=Math.atan2(Math.sin(M.g.rotation.y),Math.cos(M.g.rotation.y)),look=Math.abs(ya)<.3?0:Math.sign(ya)*PED_LOOK;M.setFace({look});
 for(let f=0;f<4;f++){if(f<3){M.pose(f)}else{M.pose(0);M.setFace({eyes:'closed'})}
  const vx=x0+f*CW,vy=rt.height-(yTop+(r+1)*CH);rt.viewport.set(vx,vy,CW,CH);rt.scissor.set(vx,vy,CW,CH);rt.scissorTest=true;renderer.setRenderTarget(rt);
  renderer.clear(true,true,false);A.scene.overrideMaterial=CH3D.olm;
  for(const[dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){cam.position.copy(p0);cam.translateX(dx);cam.translateY(dy);cam.updateMatrixWorld();renderer.render(A.scene,cam)}
  cam.position.copy(p0);cam.updateMatrixWorld();A.scene.overrideMaterial=null;renderer.clearDepth();renderer.render(A.scene,cam);
  if(f===3)M.setFace({look})}
 M.setFace({});rt.scissorTest=false}
function char3DBakeWith(fn){const ac=renderer.autoClear;renderer.autoClear=false;try{return char3DWith(fn)}finally{renderer.autoClear=ac}}
function pedAtlasRT(W,H){const rt=new THREE.WebGLRenderTarget(W,H,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true,generateMipmaps:false});rt.texture.generateMipmaps=false;
 rt.viewport.set(0,0,W,H);rt.scissorTest=false;renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear(true,true,false);return rt}
/* v1r15: pedestres 3D em 3× no PC / 2× no celular (antes 1×: 32×48), UMA textura por roupa, SEM variantes de relevo.
   Cada roupa é fotografada numa área de trabalho única (com profundidade) e copiada pra uma DataTexture sem profundidade
   (copyFramebufferToTexture) — memória ≈ 3,5 MB por roupa em 3× (51 roupas ≈ 180 MB), 1,6 MB em 2×. */
function ped3Res(){return MOB_LITE?2:3}
function ped3Scratch(){const R=ped3Res(),W=128*R,H=768*R;let s=PED3.scratch;if(!s||s.width!==W||s.height!==H){if(s)s.dispose();s=PED3.scratch=pedAtlasRT(W,H)}else{renderer.setRenderTarget(s);s.viewport.set(0,0,W,H);s.scissorTest=false;renderer.setClearColor(0x000000,0);renderer.clear(true,true,false)}return s}
function ped3Copy(rt){const t=new THREE.DataTexture(null,rt.width,rt.height,THREE.RGBAFormat);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;
 renderer.setRenderTarget(rt);rt.viewport.set(0,0,rt.width,rt.height);rt.scissorTest=false;renderer.setRenderTarget(rt);renderer.copyFramebufferToTexture(new THREE.Vector2(0,0),t);t.isSharedChar=true;t.isAtlas8=true;t.isChar=true;t.dirsN=16;return t}
function pedAtlas3Build(){if(PED3.built)return PED3.ms;const t0=performance.now();const R=ped3Res(),sets=[[...PED_PALS,typeof COP_PAL!=='undefined'?COP_PAL:null].filter(Boolean),BEACH_PALS];
 char3DBakeWith(()=>{for(const pals of sets)for(const p of pals){const rt=ped3Scratch(),M=charModel3D(p);ATLAS8.scene.add(M.g);try{for(let r=0;r<16;r++)char3DBakeRow(rt,M,0,0,r,R)}finally{ATLAS8.scene.remove(M.g);M.dispose()}PED3.idx.set(p,ped3Copy(rt))}});
 PED3.built=true;PED3.ms=Math.round(performance.now()-t0);return PED3.ms}
function pedPalDist(a,b){const C=h=>{const c=_c3.set(h||'#808080');return[c.r,c.g,c.b]},d=(x,y)=>{const p=C(x),q=C(y);return(p[0]-q[0])**2+(p[1]-q[1])**2+(p[2]-q[2])**2};
 return d(a.shirt,b.shirt)*2+d(a.pants,b.pants)+d(a.skin,b.skin)*1.5+d(a.hair,b.hair)*.5+((!!a.cap)!==(!!b.cap)?.3:0)+((!!a.long)!==(!!b.long)?.2:0)+((!!a.swim)!==(!!b.swim)?3:0)}
function pedAtlas3Proxy(p,fallbackOk){pedAtlas3Build();let t=PED3.idx.get(p),near=null;
 if(!t){if(!fallbackOk)return null;let best=1e9;for(const [q,v] of PED3.idx){const d=pedPalDist(p,q);if(d<best){best=d;near=v}}t=near;if(!t)return null}
 return{isChar:true,isProxy:true,isAtlas8:true,isPedAtlas3:false,dirsN:16,tile:null,shared:t,sharedV:null,offset:new THREE.Vector2(),repeat:new THREE.Vector2(1/4,1/16),dispose(){},standIn:!!near}}
// fila: roupa fora do pool é montada aos poucos (1 fileira de ângulos por quadro, direto na GPU) e troca sozinha quando pronta
const PED3JOB={q:[],cur:null,wait:new Map(),done:new Map()};
function ped3dQueue(p,px,sp){const k=atlas8Key(p,16,1);const ready=PED3JOB.done.get(k);if(ready){ped3dAdopt(px,sp,ready);const V=PED3JOB.doneV&&PED3JOB.doneV.get(k);if(V)px.sharedV=V;else if(PED3JOB.cur&&PED3JOB.cur.k===k)(PED3JOB.cur.adopted=PED3JOB.cur.adopted||[]).push({px,sp});return}
 let w=PED3JOB.wait.get(k);if(!w){w=[];PED3JOB.wait.set(k,w);PED3JOB.q.push({k,p:{...p}})}w.push({px,sp})}
function ped3dAdopt(px,sp,tex){px.shared=tex;px.sharedV=null;px.isPedAtlas3=false;px.tile=null;px.standIn=false;px.repeat.set(1/4,1/16);if(sp&&sp.material&&sp.material.map!==tex){sp.material.map=tex;sp.material.needsUpdate=true}}
function ped3dJobTick(){if(S.sprite8!==true)return;let J=PED3JOB.cur;
 if(!J){const n=PED3JOB.q.shift();if(!n)return;let rt=null;char3DBakeWith(()=>{rt=ped3Scratch()});J=PED3JOB.cur={k:n.k,M:charModel3D(n.p),rt,r:0}}
 /* v79r32: base (16 fileiras) e depois as variantes de relevo esquerda/direita (16 cada) */
 ATLAS8.scene.add(J.M.g);try{char3DBakeWith(()=>char3DBakeRow(J.rt,J.M,0,0,J.r,ped3Res()))}finally{ATLAS8.scene.remove(J.M.g)}
 J.r++;if(J.r===16){let t=null;char3DBakeWith(()=>{t=ped3Copy(J.rt)});J.t=t;PED3JOB.done.set(J.k,t);for(const w of PED3JOB.wait.get(J.k)||[])if(w.sp&&w.sp.parent){ped3dAdopt(w.px,w.sp,t);(J.adopted=J.adopted||[]).push(w)}PED3JOB.wait.delete(J.k)}
 if(J.r<16)return;J.M.dispose();PED3JOB.cur=null}
function charPreload3D(){if(S.sprite8!==true||typeof PED_PALS==='undefined')return 0;const t0=performance.now();
 const pals=[...PED_PALS,typeof COP_PAL!=='undefined'?COP_PAL:null].filter(Boolean),K=Math.ceil(Math.max(20,(S.peds??50)*1.6)/Math.max(1,pals.length))+1;
 pedAtlas3Build(); /* v78: atlas 3D único (cidade+policial / praia) */
 return Math.round(performance.now()-t0)} // three r128: Texture não tem userData
// pickDir guarda o ângulo fino (8 setores) do último cálculo; setFrame o usa só em texturas d8.
// Troca o atlas dos pedestres já na rua ao ligar/desligar a opção (só os que usam a textura original do makeCharacter).
function spritesRefreshPeds(){for(const q of peds){if(!q||!q.pal||!q.sp)continue;const own=q.tex&&(q.sp.material.map===q.tex||(q.tex.isProxy&&q.sp.material.map===q.tex.shared));if(!own)continue;
 const old=q.tex;if(S.sprite8===true){const px=pedAtlas3Proxy(q.pal,true);q.tex=px;q.sp.userData.texProxy=px;q.sp.material.map=px.shared;if(px.standIn)ped3dQueue(q.pal,px,q.sp)}else{const pa=pedAtlasProxy(q.pal);if(pa){q.tex=pa;q.sp.userData.texProxy=pa;q.sp.material.map=pa.shared}else{const t=atlasTex(q.pal);q.tex=t;q.sp.userData.texProxy=null;q.sp.material.map=t}}q.sp.material.needsUpdate=true;charTexRelease(old)}}
/* v3 r40: modo visual dos personagens no menu (2D / 2.5D = antigo "3D experimental" / 3D = boneco PS1 do 49-personagens-3d.js) */
function charModeOf(){return S.char3d===true?'3d':S.sprite8===true?'25d':'2d'}
const PICK8={a:Math.PI,fresh:false},DIR4_ANG=[Math.PI,0,-Math.PI/2,Math.PI/2];
// v78j: piscada na rua — cada textura de personagem tem seu cronômetro; 140 ms de olhos fechados a cada 2,5–6 s, só no quadro 0.
function charBlinkCol(tex,fr){if(fr!==0||!tex.isChar)return fr;const now=performance.now();if(!tex._bk)tex._bk=now+1000+Math.random()*4500;if(now>tex._bk+140)tex._bk=now+2500+Math.random()*3500;return now>=tex._bk?3:0}
function setFrame(tex,dir,fr){tex._fr=fr;fr=charBlinkCol(tex,fr);if(tex.isPedAtlas){const t=tex.tile;tex.offset.set((t[0]+fr*32)/PEDATLAS.W,1-(t[1]+(dir+1)*48)/PEDATLAS.H);return}if(tex.isAtlas8){const N=tex.dirsN||8,a=PICK8.fresh?PICK8.a:(DIR4_ANG[dir]??Math.PI);PICK8.fresh=false;const r=((Math.round(a/(Math.PI*2/N))%N)+N)%N;if(tex.isPedAtlas3){const t=tex.tile;tex.offset.set((t[0]+fr*32)/PED3.W,1-(t[1]+(r+1)*48)/PED3.H);return}tex.offset.set(fr/4,1-(r+1)/N);return}tex.offset.set(fr*32/128,1-(dir+1)*48/192)}
const ACTOR_LIGHT={value:new THREE.Color(1,1,1)};
const ACTOR_LOCAL={time:-1,budget:0,pos:new THREE.Vector3(),dir:new THREE.Vector3(),tmp:new THREE.Color()};
const ACTOR_RAY=new THREE.Raycaster(),ACTOR_HITS=[],ACTOR_CASTERS=new WeakMap(),ACTOR_GRID=new WeakMap();let ACTOR_STAMP=1;ACTOR_RAY.layers.enableAll();
function buildActorGrid(ch){
 let meshes=ACTOR_CASTERS.get(ch);
 if(!meshes){meshes=[];ch.group.updateWorldMatrix(true,true);ch.group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.castShadow&&o.geometry&&o.geometry.attributes&&o.geometry.attributes.position)meshes.push(o)});ACTOR_CASTERS.set(ch,meshes)}
 else ch.group.updateWorldMatrix(true,true);
 let cap=0;for(const o of meshes){const g=o.geometry,ix=g.index;cap+=Math.floor((ix?ix.count:g.attributes.position.count)/3)}
 if(!cap){const empty={empty:true};ACTOR_GRID.set(ch,empty);return empty}
 const tv=new Float32Array(cap*9),tMaxY=new Float32Array(cap),tBox=new Float32Array(cap*4),va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
 let nt=0,minX=1e9,minY=1e9,minZ=1e9,maxX=-1e9,maxY=-1e9,maxZ=-1e9;
 for(const o of meshes){
  const g=o.geometry,pa=g.attributes.position,ix=g.index&&g.index.array,m=o.matrixWorld,cnt=ix?ix.length:pa.count;
  for(let i=0;i+2<cnt;i+=3){
   const i0=ix?ix[i]:i,i1=ix?ix[i+1]:i+1,i2=ix?ix[i+2]:i+2;
   va.fromBufferAttribute(pa,i0).applyMatrix4(m);vb.fromBufferAttribute(pa,i1).applyMatrix4(m);vc.fromBufferAttribute(pa,i2).applyMatrix4(m);
   if(va.y<-90&&vb.y<-90&&vc.y<-90)continue;
   const x0=Math.min(va.x,vb.x,vc.x),x1=Math.max(va.x,vb.x,vc.x),z0=Math.min(va.z,vb.z,vc.z),z1=Math.max(va.z,vb.z,vc.z),y0=Math.min(va.y,vb.y,vc.y),y1=Math.max(va.y,vb.y,vc.y);
   const o9=nt*9;tv[o9]=va.x;tv[o9+1]=va.y;tv[o9+2]=va.z;tv[o9+3]=vb.x;tv[o9+4]=vb.y;tv[o9+5]=vb.z;tv[o9+6]=vc.x;tv[o9+7]=vc.y;tv[o9+8]=vc.z;
   tMaxY[nt]=y1;const o4=nt*4;tBox[o4]=x0;tBox[o4+1]=x1;tBox[o4+2]=z0;tBox[o4+3]=z1;nt++;
   if(x0<minX)minX=x0;if(x1>maxX)maxX=x1;if(y0<minY)minY=y0;if(y1>maxY)maxY=y1;if(z0<minZ)minZ=z0;if(z1>maxZ)maxZ=z1}}
 if(!nt){const empty={empty:true};ACTOR_GRID.set(ch,empty);return empty}
 minX-=.05;maxX+=.05;minY-=.05;maxY+=.05;minZ-=.05;maxZ+=.05;
 const cw=Math.max(.5,(maxX-minX)/16),cd=Math.max(.5,(maxZ-minZ)/16),counts=new Uint32Array(256),cellMaxY=new Float32Array(256);cellMaxY.fill(-1e9);
 for(let t=0;t<nt;t++){const o4=t*4,gx0=clamp(Math.floor((tBox[o4]-minX)/cw),0,15),gx1=clamp(Math.floor((tBox[o4+1]-minX)/cw),0,15),gz0=clamp(Math.floor((tBox[o4+2]-minZ)/cd),0,15),gz1=clamp(Math.floor((tBox[o4+3]-minZ)/cd),0,15),ym=tMaxY[t];
  for(let gz=gz0;gz<=gz1;gz++)for(let gx=gx0;gx<=gx1;gx++){const c=gz*16+gx;counts[c]++;if(ym>cellMaxY[c])cellMaxY[c]=ym}}
 const cellOff=new Uint32Array(257);for(let c=0;c<256;c++)cellOff[c+1]=cellOff[c]+counts[c];
 const cellTri=new Uint32Array(cellOff[256]),cur=cellOff.slice(0,256);
 for(let t=0;t<nt;t++){const o4=t*4,gx0=clamp(Math.floor((tBox[o4]-minX)/cw),0,15),gx1=clamp(Math.floor((tBox[o4+1]-minX)/cw),0,15),gz0=clamp(Math.floor((tBox[o4+2]-minZ)/cd),0,15),gz1=clamp(Math.floor((tBox[o4+3]-minZ)/cd),0,15);
  for(let gz=gz0;gz<=gz1;gz++)for(let gx=gx0;gx<=gx1;gx++){const c=gz*16+gx;cellTri[cur[c]++]=t}}
 const grid={empty:false,tv,tMaxY,cellOff,cellTri,cellMaxY,minX,maxX,minY,maxY,minZ,maxZ,cw,cd,stamp:new Int32Array(nt)};
 ACTOR_GRID.set(ch,grid);return grid}
function actorCovered(x,y,z,dx,dy,dz){try{return actorCovered0(x,y,z,dx,dy,dz)}catch(e){return false}}
function actorCovered0(x,y,z,dx,dy,dz){
 const endX=x+dx*120,endZ=z+dz*120,span=P*CS;
 const x0=Math.floor((Math.min(x,endX)-4)/span),x1=Math.floor((Math.max(x,endX)+4)/span),z0=Math.floor((Math.min(z,endZ)-4)/span),z1=Math.floor((Math.max(z,endZ)+4)/span);
 const st=(ACTOR_STAMP=(ACTOR_STAMP+1)|0)||(ACTOR_STAMP=1);
 for(let cz=z0;cz<=z1;cz++)for(let cx=x0;cx<=x1;cx++){
  const ch=city.chunks.get(cx+','+cz);if(!ch)continue;
  let G=ACTOR_GRID.get(ch);if(!G)G=buildActorGrid(ch);if(G.empty)continue;
  if(dy>=0&&y>G.maxY)continue;
  let t0=.06,t1=120;
  if(Math.abs(dx)<1e-8){if(x<G.minX||x>G.maxX)continue}else{const inv=1/dx;let a=(G.minX-x)*inv,b=(G.maxX-x)*inv;if(a>b){const q=a;a=b;b=q}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1)continue}
  if(Math.abs(dy)<1e-8){if(y<G.minY||y>G.maxY)continue}else{const inv=1/dy;let a=(G.minY-y)*inv,b=(G.maxY-y)*inv;if(a>b){const q=a;a=b;b=q}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1)continue}
  if(Math.abs(dz)<1e-8){if(z<G.minZ||z>G.maxZ)continue}else{const inv=1/dz;let a=(G.minZ-z)*inv,b=(G.maxZ-z)*inv;if(a>b){const q=a;a=b;b=q}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1)continue}
  const cw=G.cw,cd=G.cd;let t=t0,ix=clamp(Math.floor((x+dx*t-G.minX)/cw),0,15),iz=clamp(Math.floor((z+dz*t-G.minZ)/cd),0,15);
  const sx=dx>1e-8?1:dx<-1e-8?-1:0,sz=dz>1e-8?1:dz<-1e-8?-1:0;
  const tdx=sx?cw/Math.abs(dx):1e30,tdz=sz?cd/Math.abs(dz):1e30;
  let tmx=sx>0?(G.minX+(ix+1)*cw-x)/dx:sx<0?(G.minX+ix*cw-x)/dx:1e30;
  let tmz=sz>0?(G.minZ+(iz+1)*cd-z)/dz:sz<0?(G.minZ+iz*cd-z)/dz:1e30;
  const tv=G.tv,tMaxY=G.tMaxY,cellOff=G.cellOff,cellTri=G.cellTri,cellMaxY=G.cellMaxY,stamp=G.stamp;
  for(let step=0;step<34&&t<=t1&&ix>=0&&ix<16&&iz>=0&&iz<16;step++){
   const tn=Math.min(t1,tmx,tmz),cIdx=iz*16+ix,yLo=Math.min(y+dy*t,y+dy*tn);
   if(yLo<=cellMaxY[cIdx]){
    for(let k=cellOff[cIdx],ke=cellOff[cIdx+1];k<ke;k++){
     const ti=cellTri[k];if(stamp[ti]===st)continue;stamp[ti]=st;if(yLo>tMaxY[ti])continue;
     const o=ti*9,ax=tv[o],ay=tv[o+1],az=tv[o+2],e1x=tv[o+3]-ax,e1y=tv[o+4]-ay,e1z=tv[o+5]-az,e2x=tv[o+6]-ax,e2y=tv[o+7]-ay,e2z=tv[o+8]-az;
     const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;
     if(det>-1e-8&&det<1e-8)continue;
     const invD=1/det,tx=x-ax,ty=y-ay,tz=z-az,u=(tx*px+ty*py+tz*pz)*invD;
     if(u<0||u>1)continue;
     const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(dx*qx+dy*qy+dz*qz)*invD;
     if(v<0||u+v>1)continue;
     const hitT=(e2x*qx+e2y*qy+e2z*qz)*invD;
     if(hitT>.06&&hitT<120)return true}}
   if(tmx<tmz){t=tmx;tmx+=tdx;ix+=sx}else{t=tmz;tmz+=tdz;iz+=sz;if(tn>=t1&&!sx&&!sz)break}}
 }return false;
}

function actorLighting(sp,local){try{actorLighting0(sp,local)}catch(e){local.value.setRGB(1,1,1)}}
// v175: sombra suave. Testa o sol em 2 alturas (pés e cabeça): perto da borda da sombra fica "meia sombra",
// e o valor ainda desliza em ~0,25 s; o resto da luz (céu, postes) segue rápido. Nada de troca seca entre sol e sombra.
function actorLighting0(sp,local){
 // v257: mantém a rotina de luz/cores de v253, inclusive a interpolação nativa.
 // Não reinicia a cor do SpriteMaterial ao trocar de mundo.
 // A cidade nova zera simT, mas o sprite do jogador permanece vivo entre gerações.
 // Reinicia o cronômetro local para não congelar a interpolação das sombras/luz
 // durante todo o tempo acumulado na cidade anterior.
 if(simT<local.last){local.last=simT;local.next=simT;local.shade=0;local.shadeS=0;local.value.copy(ACTOR_LIGHT.value)}
 if(PL.inside==='backrooms'&&BR.on){const t=local.target,k=brLightAt(sp.position.x,sp.position.z)*BR.flick;t.setRGB(k,.95*k,.8*k);const dtm=Math.max(0,Math.min(.1,simT-local.last));local.last=simT;const v=local.value;if(!(v.r>=0&&v.g>=0&&v.b>=0))v.copy(t);v.lerp(t,1-Math.exp(-dtm*10));return} /* v3 r10: luz fixa das Backrooms */
 if(PL.inside==='mall'&&MALL.stores){sp.getWorldPosition(ACTOR_LOCAL.pos);const t=local.target;mallLightAt(ACTOR_LOCAL.pos,t);const dtm=Math.max(0,Math.min(.1,simT-local.last));local.last=simT;const v=local.value;if(!(v.r>=0&&v.g>=0&&v.b>=0))v.copy(t);v.lerp(t,1-Math.exp(-dtm*10));return}
 const a=ACTOR_LOCAL;if(a.time!==simT){a.time=simT;a.budget=MOB_LITE?1:2}
 sp.getWorldPosition(a.pos);const pc=PL.car||PL,near=Math.hypot(a.pos.x-pc.x,a.pos.z-pc.z)<(MOB_LITE?45:70);
 if(near&&simT>=local.next&&(sp===PL.sp||a.budget>0)){if(sp!==PL.sp)a.budget--;local.next=simT+(sp===PL.sp?.08:.18+Math.random()*.12);
  a.dir.subVectors(sun.position,sun.target.position).normalize();
  if(S.shadows&&sun.intensity>.01){const h=actorCovered(a.pos.x,a.pos.y+1.5,a.pos.z,a.dir.x,a.dir.y,a.dir.z)?1:0,f=actorCovered(a.pos.x,a.pos.y+.3,a.pos.z,a.dir.x,a.dir.y,a.dir.z)?1:0;local.shade=(h+f)/2}else local.shade=0;
 }
 const dt=Math.max(0,Math.min(.1,simT-local.last));local.last=simT;
 if(!(local.shadeS>=0))local.shadeS=local.shade||0;local.shadeS+=((near?local.shade:0)-local.shadeS)*(1-Math.exp(-dt*9));
 const target=local.target;target.copy(hemi.color).multiplyScalar(hemi.intensity*.65).add(a.tmp.copy(sun.color).multiplyScalar(sun.intensity*(.65-.57*local.shadeS)*(CLDSH.A.x>0?csShadeAt(a.pos.x,a.pos.y,a.pos.z):1)));
 if(near){
 if(S.lampLighting!==false)for(const slot of nearLampLights){const l=slot.light;if(!l.visible||l.intensity<=0)continue;const d=Math.hypot(a.pos.x-l.position.x,a.pos.y+1-l.position.y,a.pos.z-l.position.z),r=l.distance||14;if(d<r){const f=(1-d/r)**2*l.intensity*1.4;target.add(a.tmp.copy(l.color).multiplyScalar(f))}}
 }
 if(!(target.r>=0&&target.g>=0&&target.b>=0))target.setRGB(1,1,1);
 target.r=clamp(target.r,.025,1);target.g=clamp(target.g,.025,1);target.b=clamp(target.b,.025,1);
 const v=local.value;if(!(v.r>=0&&v.g>=0&&v.b>=0))v.copy(target);v.lerp(target,1-Math.exp(-dt*14));
}
// ============================================================================
// >>> NÃO ALTERAR AQUI <<<  SPRITEMATERIAL + ATLAS + LUZ DOS ATORES — v258
// Este conjunto funcionou no jogo com luz, sombras e efeitos nos quatro mundos.
// NÃO introduzir onBeforeCompile, uniforms customizados, recompilação forçada,
// descarte de atlas ou recriação global de material durante viagens entre mundos.
// NÃO confundir invisibilidade (sprite sem render) com ausência de iluminação.
// ============================================================================
// v184: iluminação suave dos sprites com o uniforme NATIVO do SpriteMaterial.
// A renderização não depende mais de onBeforeCompile nem de uniform customizado:
// recompilar sombras e destruir a cidade anterior não afeta shader dos atores.
// Cada sprite mantém sua cor individual e o tint especial para fantasmas.
/* v79r31 · LUZ POR RELEVO (etapa 1: personagens 2D — jogador e pedestres do atlas único). Respeita o bloco protegido dos sprites:
   nada de shader/uniform/recompilação — cada atlas ganha 2 variantes prontas (luz vindo da ESQUERDA ou da DIREITA da tela, 3 tons por faixa
   horizontal de cada forma) e o sprite só troca qual textura usa no onBeforeRender, conforme o lado de onde vem o sol (de dia, fora da sombra)
   ou o poste mais forte por perto (à noite). Sol de frente/de costas, sombra, interiores e modo 3D = variante neutra (a de sempre). */
const RELIEF={on:true,lit:1.22,dark:.76};
function charRelief(c,cw,side){const g=c.getContext('2d'),W=c.width,H=c.height,id=g.getImageData(0,0,W,H),a=id.data,R=RELIEF,op=i=>a[i+3]>0;
 for(let y=0;y<H;y++)for(let x0=0;x0<W;x0+=cw){let x=x0;const x1c=x0+cw;
  while(x<x1c){if(!op((y*W+x)*4)){x++;continue}let x1=x;while(x1+1<x1c&&op((y*W+x1+1)*4))x1++;const len=x1-x+1;
   if(len>3)for(let xx=x+1;xx<x1;xx++){const i=(y*W+xx)*4,l=.299*a[i]+.587*a[i+1]+.114*a[i+2];if(l<34)continue;const u=(xx-x+.5)/len,d=side<0?u:1-u,k=d<.34?R.lit:d>.66?R.dark:1;a[i]=Math.min(255,a[i]*k);a[i+1]=Math.min(255,a[i+1]*k);a[i+2]=Math.min(255,a[i+2]*k)}
   x=x1+1}}
 g.putImageData(id,0,0);return c}
const atlasCacheV=new WeakMap();
/* v2 r2.1: o cache de relevo era por OBJETO de paleta; PLAYER_PAL é o mesmo objeto para Nathan e Claire (troca por Object.assign) →
   os lados com relevo ficavam com o corpo do personagem anterior e, girando a câmera, o sprite alternava entre os dois. Agora vale só
   enquanto o atlas base (atlasCache, que applyPlayerLook apaga) for o mesmo. */
function makeAtlasV(p,side){let base=atlasCache.get(p);if(!base){base=makeAtlas(p);atlasCache.set(p,base)}let e=atlasCacheV.get(p);if(!e||e.src!==base)atlasCacheV.set(p,e={src:base});if(e[side])return e[side];const c=cv(base.width,base.height);c.getContext('2d').drawImage(base,0,0);e[side]=charRelief(c,32,side);return e[side]}
function reliefTex(c){const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.repeat.set(32/128,48/192);t.isChar=true;t.isRelief=true;return t}
function playerReliefSync(){const sp=PL.sp;if(!sp)return;const old=sp.userData.reliefV;if(old)for(let i=1;i<old.length;i++)if(old[i]&&old[i]!==PL.tex)old[i].dispose();
 if(!RELIEF.on||!PL.tex){sp.userData.reliefV=null;return}
 if(S.sprite8===true){const p={...PLAYER_PAL},mk=side=>atlas8NewTex(atlas8CanvasSide(p,16,PL_RES3D,side),16,'rel'+side+'|'+atlas8Key(p,16,PL_RES3D));sp.userData.reliefV=[PL.tex,mk(-1),mk(1)];return}
 sp.userData.reliefV=[PL.tex,reliefTex(pixelScale2x(makeAtlasV(PLAYER_PAL,-1))),reliefTex(pixelScale2x(makeAtlasV(PLAYER_PAL,1)))]}
/* 0 = neutra, 1 = luz da esquerda da tela, 2 = luz da direita (com histerese pra não ficar piscando) */
function reliefSide(sp,local){if(!RELIEF.on||PL.inside||PHOTO.hidePl&&sp===PL.sp){local.bkT=0;return 0}const p=sp.position;let lx=0,lz=0,w=0;
 if(sun.intensity>.2&&!(local.shadeS>.45)){lx=sun.position.x-sun.target.position.x;lz=sun.position.z-sun.target.position.z;const ly=sun.position.y-sun.target.position.y,hl=Math.hypot(lx,lz);w=hl/(Math.hypot(hl,ly)||1)}
 if(w<.18&&S.lampLighting!==false){let best=0;for(const slot of nearLampLights){const l=slot.light;if(!l.visible||l.intensity<=0)continue;const dx=l.position.x-p.x,dz=l.position.z-p.z,d=Math.hypot(dx,dz),r=l.distance||14;if(d>r||d<.3)continue;const f=(1-d/r)**2*l.intensity;if(f>best){best=f;lx=dx;lz=dz;w=Math.min(1,f*3)}}}
 const m=camera.matrixWorld.elements,rx=m[0],rz=m[2],hl=Math.hypot(lx,lz)||1,s=(lx*rx+lz*rz)/hl*Math.min(1,w*2.2);let cur=local.rs||0;
 if(cur===0){if(s>.42)cur=2;else if(s<-.42)cur=1}else if(cur===2){if(s<.22)cur=s<-.42?1:0}else if(s>-.22)cur=s>.42?2:0;local.rs=cur;
 /* v1r11: contraluz — luz ATRÁS do boneco (de frente pra câmera) e sem lado definido: escurece o sprite inteiro até o tom do lado sombreado (antes voltava claro) */
 {const fx=-m[8],fz=-m[10],fl=Math.hypot(fx,fz)||1,back=(lx*fx+lz*fz)/(hl*fl)*Math.min(1,w*2.2);local.bkT=cur===0?clamp((back-.3)/.45,0,1):0}
 return cur}
function reliefApply(sp,mat,local){const V=sp.userData.reliefV,px=sp.userData.texProxy,VS=px&&px.sharedV;if(!V&&!VS)return;
 if(VS){if(!VS.includes(mat.map))return;const t=VS[reliefSide(sp,local)];if(t&&mat.map!==t)mat.map=t;return}
 if(!V.includes(mat.map))return;const base=V[0],t=V[reliefSide(sp,local)]||base;if(t!==base){t.offset.copy(base.offset);t.repeat.copy(base.repeat);t.center.copy(base.center);t.rotation=base.rotation}if(mat.map!==t)mat.map=t}
function makeActorLitSprite(tex){const mat=new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:.5,fog:true});
 const local={value:ACTOR_LIGHT.value.clone(),target:new THREE.Color(),next:0,last:simT,shade:0};
 const sp=new THREE.Sprite(mat);sp.userData.actorTint=new THREE.Color(1,1,1);sp.userData.actorLocal=local; /* v3 r40: o boneco 3D usa a mesma luz do sprite */sp.position.set(0,-9999,0); /* v79r22: nasce longe — até o 1º placeSprite não pisca na origem (0,0) */
 sp.onBeforeRender=(renderer0,scene0,renderCam)=>{if(renderCam===camera){sp.userData.actorLastDraw=simT;actorLighting(sp,local);mat.color.copy(local.value).multiply(sp.userData.actorTint)}else if(!local._init){local._init=1;actorLighting(sp,local);mat.color.copy(local.value).multiply(sp.userData.actorTint)}
  /* v78m: textura 3D COMPARTILHADA por roupa — cada ped guarda seu quadro num proxy; copiado aqui, antes do draw (uvTransform é lido depois). Só se o map ainda for o compartilhado. */try{reliefApply(sp,mat,local);const bt=local.bkT||0,tn=simT,db=Math.min(.12,Math.max(0,tn-(local.bkS??tn)));local.bkS=tn;local.bk=(local.bk||0)+(bt-(local.bk||0))*(1-Math.exp(-db*7));if(local.bk>.004)mat.color.multiplyScalar(1-(1-RELIEF.dark)*local.bk)}catch(e){}const px=sp.userData.texProxy;if(px&&(mat.map===px.shared||px.sharedV&&px.sharedV.includes(mat.map))){mat.map.offset.copy(px.offset);mat.map.repeat.copy(px.repeat)}};
 sp.center.set(.5,0);sp.layers.set(1);scene.add(sp);
 return sp;
}
// v257: verificações limitadas ao estado de geometria/camadas, não à cor nem ao shader.
// O mundo invertido e Point Haze continuam sem pedestres comuns por definição.
let actorSpriteCheckedWorld=-1;
function actorSpriteRenderIntegrity(force=false){
 const world=city.worldNo||0;
 if(!force&&actorSpriteCheckedWorld===world)return;
 actorSpriteCheckedWorld=world;
 camera.layers.enable(1);
 scene.traverse(o=>{if(!o.isSprite||!o.geometry)return;
  const dr=o.geometry.drawRange;
  if(dr.start!==0||dr.count===0||dr.count!==Infinity)o.geometry.setDrawRange(0,Infinity);
 });
 for(const sp of [PL?.sp,...peds.map(p=>p.sp)])if(sp&&sp.isSprite)sp.layers.enable(1);
}
// Diagnóstico não destrutivo: diferencia sprite fora do draw list de shader/alpha.
window.pixelCitySpriteStatus=()=>{
 const all=[PL?.sp,...peds.map(p=>p.sp)].filter(Boolean),recent=all.filter(sp=>simT-(sp.userData.actorLastDraw??-1e9)<1);
 const data=sp=>sp?{visible:sp.visible,parent:!!sp.parent,layer:sp.layers.mask,opacity:sp.material?.opacity,alphaTest:sp.material?.alphaTest,drawRange:sp.geometry?.drawRange,texture:!!sp.material?.map,lastDraw:sp.userData.actorLastDraw??null}:null;
 return{world:S.style,worldNo:city.worldNo,pedTarget:pedTarget(),peds:peds.length,actors:all.length,drawnLastSecond:recent.length,cameraLayers:camera.layers.mask,player:data(PL.sp),samplePed:data(peds[0]?.sp),drawCalls:renderer.info.render.calls};
};
function makeCharacter(pal){const px=pal===PLAYER_PAL?null:S.sprite8===true?pedAtlas3Proxy(pal,true):pedAtlasProxy(pal),tex=px||atlasTex(pal),sp=makeActorLitSprite(px?px.shared:tex);if(px)sp.userData.texProxy=px;
 if(!px&&pal!==PLAYER_PAL&&RELIEF.on&&!tex.isAtlas8)try{sp.userData.reliefV=[tex,reliefTex(makeAtlasV(pal,-1)),reliefTex(makeAtlasV(pal,1))]}catch(e){} /* v79r32: relevo também em policial, atendente e personagens da história (2D) */
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.layers.set(1);sh.position.set(0,-9999,0);scene.add(sh);
 if(px&&px.standIn)ped3dQueue(pal,px,sp);
 return {sp,tex,sh,pal}}
function pickDir(mx,mz,ox,oz){ // move dir m, object pos o
 let vx=0,vz=-1;if(camMode!=='top'||VIEW.orbit){vx=ox-camera.position.x;vz=oz-camera.position.z;const l=Math.hypot(vx,vz)||1;vx/=l;vz/=l}
 const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;const dot=mx*vx+mz*vz,cr=vx*mz-vz*mx;
 PICK8.a=Math.atan2(cr,dot);PICK8.fresh=true;
 if(dot>.707)return 1;if(dot<-.707)return 0;return cr>0?3:2}

