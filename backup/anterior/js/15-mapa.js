'use strict';
/* Coastal Chaos · js/15-mapa.js — Minimapa, mapa grande, marcador e GPS.
   Script clássico (não é módulo): todos os js/NN-*.js dividem o mesmo escopo global e entram na ordem do index.html. */
/* ================= MINIMAP ================= */
const mini=$('#mini'),mctx=mini.getContext('2d');
/* v77: radar com resolução nativa da tela (desenho lógico continua 180×180) */
let MINI_K=1,MINI_F=0;function miniResize(){const r=mini.getBoundingClientRect(),css=r.width||180,k=Math.max(1,Math.min(4,css*(window.devicePixelRatio||1)/180));const px=Math.round(180*k);if(mini.width!==px){mini.width=mini.height=px}MINI_K=px/180}
try{miniResize();addEventListener('resize',()=>setTimeout(miniResize,50))}catch(e){}{const old=mctx.fillText.bind(mctx);mctx.fillText=(t,...args)=>old(translatePlain(String(t)),...args)}
let mapCv=null; const MOFF=60;
function mapBack(g){const st=city.st,E=city.ext,c=city.coast,B=3000;if(!st||!E)return;if(city.haze){g.fillStyle='#4a7488';g.fillRect(-B,-B,E+2*B,E+2*B);return}g.fillStyle=st.map.bld;g.fillRect(-B,-B,E+2*B,E+2*B);g.fillStyle=S.style==='inverted'?'#222228':st.night?'#1a2050':'#3a8ac0';const s0=SHORE;
 if(c===0)g.fillRect(-B,-B,E+2*B,B-s0+MOFF);else if(c===1)g.fillRect(-B,E+s0+MOFF,E+2*B,B);else if(c===2)g.fillRect(-B,-B,B-s0+MOFF,E+2*B);else if(c===3)g.fillRect(E+s0+MOFF,-B,B,E+2*B)}
function buildMinimap(st){const E=city.ext,o=RW/2;mapCv=cv(Math.ceil(E+MOFF*2),Math.ceil(E+MOFF*2));const g=mapCv.getContext('2d');
 g.fillStyle=st.map.road;g.fillRect(0,0,mapCv.width,mapCv.height);const fr=(x0,z0,x1,z1,c)=>{g.fillStyle=c;g.fillRect(x0+MOFF,z0+MOFF,x1-x0,z1-z0)};
 fr(-MOFF,-MOFF,E+MOFF,-o-SW,st.map.bld);fr(-MOFF,E+o+SW,E+MOFF,E+MOFF,st.map.bld);fr(-MOFF,-MOFF,-o-SW,E+MOFF,st.map.bld);fr(E+o+SW,-MOFF,E+MOFF,E+MOFF,st.map.bld);
 const c=city.coast,Wc=S.style==='inverted'?'#222228':st.night?'#1a2050':'#3a8ac0',Sd=S.style==='inverted'?'#77777c':st.night?'#5a4a62':'#e3cf9a';
 const R4=(u0,u1,a,b)=>c===0?[a,-u1,b,-u0]:c===1?[a,E+u0,b,E+u1]:c===2?[-u1,a,-u0,b]:[E+u0,a,E+u1,b];
 const sp=city.coastSpan,ta=sp?Math.max(-o-SW,sp[0]):-o-SW,tb=sp?Math.min(E+o+SW,sp[1]):E+o+SW;let r;if(city.haze){g.fillStyle='#4a7488';g.fillRect(0,0,mapCv.width,mapCv.height);const poly=(u,cc)=>{g.fillStyle=cc;g.beginPath();for(let k=0;k<=240;k++){const p=hazeRay(k/240*6.2832,u);if(k)g.lineTo(p[0]+MOFF,p[1]+MOFF);else g.moveTo(p[0]+MOFF,p[1]+MOFF)}g.closePath();g.fill()};poly(SHORE,'#b8a870');poly(SAND0,'#9a8458');fr(-o,-o,E+o,E+o,st.map.road)}else{r=R4(o,SHORE+COASTW.out+1,ta,tb);fr(r[0],r[1],r[2],r[3],Sd);r=R4(SHORE-COASTW.in-1,SHORE+MOFF,-MOFF,E+MOFF);fr(r[0],r[1],r[2],r[3],Wc);if(c!=null&&c>=0){g.fillStyle=Sd;g.beginPath();let st0=true;for(let t=ta;t<=tb+.01;t+=3){const q=wTU(c,t,coastUr(t,SHORE)),X=q[0]+MOFF,Z=q[1]+MOFF;if(st0){const q0=wTU(c,t,o);g.moveTo(q0[0]+MOFF,q0[1]+MOFF);st0=false}g.lineTo(X,Z)}{const q1=wTU(c,tb,o);g.lineTo(q1[0]+MOFF,q1[1]+MOFF)}g.closePath();g.fill()}} /* v3 r35: areia até a borda irregular */
 if(sp){const pa=sp[0]<0?E/2:E/2-7;r=R4(o+SW,SHORE,pa,pa+7);fr(r[0],r[1],r[2],r[3],st.map.block)}
 for(const w of city.wild)fr(w[0],w[1],w[2],w[3],st.synth?'#1e3a30':'#4a6e3c');
 for(const w of city.water||[]){if(w.cutOnly)continue;fr(w[0],w[1],w[2],w[3],Wc);if(city.poll){const ts=6;for(let x=w[0];x<w[2]-.01;x+=ts)for(let z=w[1];z<w[3]-.01;z+=ts){const p=pollAt(x+ts/2,z+ts/2);if(p>.05){g.globalAlpha=Math.min(1,p*1.1);fr(x,z,Math.min(w[2],x+ts),Math.min(w[3],z+ts),st.synth?'#4a3a22':'#7a6234');g.globalAlpha=1}}}}
 // Draw bridge roads above river and mouth water on the map, just as in the world.
 for(const r of city.decks||[])fr(r[0],r[1],r[2],r[3],st.map.road);
 for(let k=1;k<city.N;k++)for(let b=0;b<city.N;b++){const LH=city.lines['H'+k],LV=city.lines['V'+k];
  if(LH&&LH.t!=='ave'&&segExists(b,k,0)){fr(b*P+o,k*P-o,(b+1)*P-o,k*P-3.9,st.map.block);fr(b*P+o,k*P+3.9,(b+1)*P-o,k*P+o,st.map.block)}
  if(LV&&LV.t!=='ave'&&segExists(k,b,1)){fr(k*P-o,b*P+o,k*P-3.9,(b+1)*P-o,st.map.block);fr(k*P+3.9,b*P+o,k*P+o,(b+1)*P-o,st.map.block)}}
 city.rects.forEach((q,i)=>{const f=city.info[i],k=f.kind;fr(q[0],q[1],q[2],q[3],st.map.block);if(k==='haze'){fr(q[0],q[1],q[2],q[3],'#8c7a50');return}if(k==='rural'){fr(q[0],q[1],q[2],q[3],f.forest?(st.synth?'#163329':'#315d37'):(st.synth?'#24443a':'#7c9a58'));return}if(k==='industrial'){fr(q[0],q[1],q[2],q[3],st.synth?'#3a3446':'#77736b');return}if(k==='lm'){fr(q[0]+SW,q[1]+SW,q[2]-SW,q[3]-SW,f.lm==='cem'?(st.synth?'#294a38':'#5d7a56'):(st.synth?'#6a4a7a':'#c4a878'));return}fr(q[0]+SW,q[1]+SW,q[2]-SW,q[3]-SW,k==='park'?st.map.park:k==='lot'?(f.airCorridor==='clear'?(st.synth?'#344b38':'#79a369'):st.map.lot):k==='houses'?(st.synth?'#294a39':'#84a56d'):st.map.bld)});
 // v78: Point Haze — minimapa com o relevo da ilha (sem a grade de quarteirões): cor por altura + sombreado do lado noroeste
 if(city.haze){const x0=-o,x1=E+o,W=Math.ceil(x1-x0),id=g.getImageData(Math.floor(x0+MOFF),Math.floor(x0+MOFF),W,W),d=id.data;
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){const x=x0+i+.5,z=x0+j+.5,h=hazeH(x,z),sh=clamp((h-hazeH(x-1.5,z-1.5))*.9,-.35,.35),k=Math.min(1,h/12),q=(j*W+i)*4;
   let r=140+(110-140)*k,gg=122+(108-122)*k,b=80+(98-80)*k;if(hazeCliff(x,z)>.5&&h>2){r=96;gg=92;b=86}const L=1+sh;d[q]=r*L;d[q+1]=gg*L;d[q+2]=b*L;d[q+3]=255}
  g.putImageData(id,Math.floor(x0+MOFF),Math.floor(x0+MOFF))}
 const dc=st.synth?'#5a4a4a':'#a88a5c',o2=RW/2;if(!city.haze)for(let kx=0;kx<=city.N;kx++)for(let kz=0;kz<=city.N;kz++){if(segExists(kx,kz,0)&&isRural(kx*P+P/2,kz*P))fr(kx*P-o2,kz*P-o2,(kx+1)*P+o2,kz*P+o2,dc);if(segExists(kx,kz,1)&&isRural(kx*P,kz*P+P/2))fr(kx*P-o2,kz*P-o2,kx*P+o2,(kz+1)*P+o2,dc)}
 // esquinas arredondadas também no mapa (e na máscara das poças, que vem dele)
 if(city.cc&&!city.haze)for(let kx=0;kx<=city.N;kx++)for(let kz=0;kz<=city.N;kz++)for(const sx of [-1,1])for(const sz of [-1,1]){const cc=cornerInfo(kx,kz,sx,sz),X=kx*P+MOFF,Z=kz*P+MOFF;
  if(cc.notch){g.fillStyle=st.map.block;g.beginPath();g.moveTo(X+sx*8,Z+sz*8);const tm=Math.atan2(-sz,-sx);for(let k=0;k<=10;k++){const t=tm-Math.PI/4+k*Math.PI/20;g.lineTo(X+sx*8+Math.cos(t)*4.1,Z+sz*8+Math.sin(t)*4.1)}g.closePath();g.fill()}
  for(const[A,B] of cc.conv){const cx=X+sx*A,cz=Z+sz*B,ox=cx+sx*CR,oz=cz+sz*CR,tm=Math.atan2(-sz,-sx);g.fillStyle=isRural(kx*P+sx*A,kz*P+sz*B)?dc:st.map.road;g.beginPath();g.moveTo(cx,cz);
   for(let k=0;k<=10;k++){const t=tm-Math.PI/4+k*Math.PI/20;g.lineTo(ox+Math.cos(t)*CR,oz+Math.sin(t)*CR)}g.closePath();g.fill()}} worldMapPaint(g,st); if(S.style==='inverted'){const img=g.getImageData(0,0,mapCv.width,mapCv.height),a=img.data;for(let i=0;i<a.length;i+=4){const y=(a[i]*.2126+a[i+1]*.7152+a[i+2]*.0722)|0;a[i]=y;a[i+1]=y;a[i+2]=y}g.putImageData(img,0,0)}
;{const NR=city.neonRoad;if(NR){const q=NR.ar;fr(q[0],q[1],q[2],q[3],st.map.road)}} /* v78: rua nova do Neon Road no minimapa */;if(!city.haze&&S.style!=='inverted'&&S.style!=='haze'){try{const c=cv(256,256),x=c.getContext('2d');x.drawImage(mapCv,0,0,256,256);LAB.homeMap=c;LAB.cityTex=null;LAB.homeCity={E,rects:city.rects.map((q,i)=>{const f=city.info[i]||{};return[q[0],q[1],q[2],q[3],f.kind,f.forest?1:0,f.lm||'']}),water:(city.water||[]).filter(w=>!w.cutOnly).map(w=>[w[0],w[1],w[2],w[3]])}}catch(e){}}}
function safePos(){if(city.safe)return city.safe;const r=city.rects[city.safeRi];return r?{x:(r[0]+r[2])/2,z:(r[1]+r[3])/2}:null}
function tuneIcon(g,s,rot=0){const p=city.tuneSpot||(city.rects[city.tuneRi]?{x:(city.rects[city.tuneRi][0]+city.rects[city.tuneRi][2])/2,z:(city.rects[city.tuneRi][1]+city.rects[city.tuneRi][3])/2}:null);if(p)drawMapIcon(g,'tune',p.x+MOFF,p.z+MOFF,s*.64,rot)}
function safeIcon(g,s,rot=0){const p=safePos();if(p)drawMapIcon(g,'safe',p.x+MOFF,p.z+MOFF,s*.68,rot)}
/* Marcador de destino do Upside Down; o GPS usa drawNav. */
function drawInvertMarker(g,sc){if(NAV.marker)drawMapIcon(g,'gps',NAV.marker.x+MOFF,NAV.marker.z+MOFF,10/sc)}

function drawMinimap(){try{drawMinimap0()}finally{miniClockDraw();const un=phoneUnread();if(un&&played){const g=mctx,b=Math.floor(simT*2)%2===0,x=10,y=10,w=26,hh=18;g.save();g.setTransform(MINI_K,0,0,MINI_K,0,0);g.fillStyle='#000';g.fillRect(x-2,y-2,w+4,hh+4);const mi=phoneMissionUnread();g.fillStyle=mi?(b?'#ff7a3a':'#e8502a'):(b?'#fff6d8':'#f2e6b8');g.fillRect(x,y,w,hh);g.strokeStyle='#8a6a2a';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.lineTo(x+w/2,y+hh*.6);g.lineTo(x+w,y);g.stroke();g.fillStyle='#d62828';g.beginPath();g.arc(x+w,y,6,0,7);g.fill();g.fillStyle='#fff';g.font='700 9px Segoe UI,Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(String(un),x+w,y+.5);g.restore()}}}
/* v3 r28: relógio no radar grande — no meio, em cima (entre o envelope do SMS e a bússola), hora em branco com borda amarela.
   Some com o radar recolhido (mini-rest), igual ao "HORA ATUAL" do mapa cheio (mapClockLabel). */
function miniClockDraw(){if(!played||document.body.classList.contains('mini-rest'))return;const g=mctx,t=mapClockLabel(),cx=90,y=10,w=50,h=19;
 g.save();g.setTransform(MINI_K,0,0,MINI_K,0,0);g.fillStyle='rgba(9,8,16,.82)';g.strokeStyle='#ffd21a';g.lineWidth=2;if(g.roundRect){g.beginPath();g.roundRect(cx-w/2,y,w,h,5)}else{g.beginPath();g.rect(cx-w/2,y,w,h)}g.fill();g.stroke();
 g.fillStyle='#fff';g.font='700 13px Segoe UI,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,cx,y+h/2+1);g.restore()}
// Reduz apenas a representacao da tempestade no mapa, sem alterar a area meteorologica real.
function mapWeatherRadius(c){if(!c.big)return c.r*.8;
 const x=c.x+MOFF,z=c.z+MOFF;
 return Math.max(0,Math.min(c.r*.8,x,z,mapCv.width-x,mapCv.height-z))}
// Pontos de chegada dos serviços do celular: apenas no minimapa (não no mapa completo).
function drawPhoneServiceDots(g,sc,focus){
 const dot=(c,color)=>{if(!c||!c.alive||Math.abs(c.x-focus.x)>210||Math.abs(c.z-focus.z)>210)return;
  const x=c.x+MOFF,z=c.z+MOFF,r=4.6/sc;g.fillStyle=color;g.strokeStyle='#16171e';g.lineWidth=1.8/sc;
  g.beginPath();g.arc(x,z,r,0,Math.PI*2);g.fill();g.stroke()};
 if(TAXI.fromPhone&&(TAXI.state==='call'||TAXI.state==='wait'))dot(TAXI.c,'#ffe02c');
 for(const c of vehicles)if(c.svc&&c.svc.state==='go')dot(c,c.svc.kind==='pol'?'#348dff':'#ffffff');
}
function drawMissionBearingArrow(g,w,h,p,sc,rot){
 const q=missionTargets()[0];if(!q)return;
 const ex=(q.x-p.x)*sc,ez=(q.z-p.z)*sc,cs=Math.cos(rot),sn=Math.sin(rot);
 const dx=ex*cs-ez*sn,dz=ex*sn+ez*cs,limX=w/2-19,limY=h/2-19;
 if(Math.abs(dx)<=limX&&Math.abs(dz)<=limY)return; // ! já está dentro do radar.
 const scale=Math.min(limX/Math.max(1,Math.abs(dx)),limY/Math.max(1,Math.abs(dz)));
 g.save();g.translate(w/2+dx*scale,h/2+dz*scale);g.rotate(Math.atan2(dz,dx));
 g.lineWidth=2.7;g.strokeStyle='#140e00';g.fillStyle='#ffd21a';
 g.beginPath();g.moveTo(15,0);g.lineTo(-8,-10);g.lineTo(-8,10);g.closePath();g.fill();g.stroke();
 g.rotate(-Math.atan2(dz,dx));g.fillStyle='#130e00';g.font='bold 11px Silkscreen,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('!',-2,0);g.restore();
}
function drawMinimap0(){if(!mapCv)return;if((MINI_F=(MINI_F||0)+1)%60===1)miniResize();const w=180,h=180,sc=0.75;mctx.setTransform(MINI_K,0,0,MINI_K,0,0);mapIconReset(mctx,[w/2*MINI_K,h/2*MINI_K]);
 const p=PL.car?PL.car:HELI.cur?HELI.cur:PL; mctx.fillStyle='#000';mctx.fillRect(0,0,w,h);
 let ang; if(PL.car)ang=PL.car.a; else if(HELI.cur)ang=HELI.cur.yaw; else if(camMode==='fps')ang=Math.atan2(-Math.cos(PL.yaw),-Math.sin(PL.yaw)); else ang=Math.atan2(PL.face[1],PL.face[0]);
 {const tg=-Math.PI/2-ang;if(MINI.rot===undefined)MINI.rot=tg;let d=tg-MINI.rot;d=Math.atan2(Math.sin(d),Math.cos(d));MINI.rot+=d*.25}const rot=MINI.rot,cr=Math.cos(rot),sr=Math.sin(rot);
 // v77: dentro de interiores o radar mostra a planta do lugar (paredes/móveis pela colisão) em vez do cinza da cidade
 if(PL.inside&&!PL.car&&!HELI.cur){let ok=false;try{ok=interiorMiniMap(mctx,p,rot,w,h)}catch(e){console.error(e)}if(ok){drawNorth(mctx,w-19,21,14,rot);mctx.save();mctx.translate(w/2,h/2);mctx.rotate(ang+rot);mctx.fillStyle=plArrowCol();mctx.strokeStyle='#000';mctx.lineWidth=2;mctx.beginPath();mctx.moveTo(8,0);mctx.lineTo(-6,-6);mctx.lineTo(-3,0);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.stroke();mctx.restore();return}}
 mctx.save();mctx.translate(w/2,h/2);mctx.rotate(rot);mctx.scale(sc,sc);mctx.translate(-(p.x+MOFF),-(p.z+MOFF));mctx.imageSmoothingEnabled=false;mapBack(mctx);{const cx=p.x+MOFF,cz=p.z+MOFF,mw=mapCv.width,mh=mapCv.height,sx=clamp(Math.floor(cx-178),0,mw),sy=clamp(Math.floor(cz-178),0,mh),sw=clamp(Math.ceil(cx+178),0,mw)-sx,sh=clamp(Math.ceil(cz+178),0,mh)-sy;if(sw>0&&sh>0)mctx.drawImage(mapCv,sx,sy,sw,sh,sx,sy,sw,sh)}brMapGlitch(mctx,sc);
 if(S.style==='inverted'){
  drawPOISet(mctx,sc,true,p,rot);if(storyMap('safe')&&!city.haze)safeIcon(mctx,17/sc,rot);if(storyMap('gas'))gasMapIcons(mctx,15.3/sc,rot);drawTommyRadar(mctx,sc,p);
  drawNav(mctx,sc,3,rot); // GPS amarelo também no minimapa invertido
  demoMapDots(mctx,sc);
  drawPhoneServiceDots(mctx,sc,p);
  {const lc=luciaMapPose();if(lc&&Math.abs(lc.x-p.x)<125&&Math.abs(lc.z-p.z)<125)luciaMapArrow(mctx,lc.x+MOFF,lc.z+MOFF,1/sc,lc.ang)}
  mctx.restore();mapIconFlush(mctx);
  // O radar gira com o jogador: a seta central indica sua posição e direção.
  mctx.save();mctx.translate(w/2,h/2);mctx.rotate(ang+rot);
  mctx.fillStyle='#f4f4f4';mctx.strokeStyle='#151515';mctx.lineWidth=2.5;
  mctx.beginPath();mctx.moveTo(8,0);mctx.lineTo(-6,-6);mctx.lineTo(-3,0);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.stroke();mctx.restore();
  return
 }
 if(ONLINE.on)ONLINE.mmT=mctx.getTransform();
 // veículos comuns e pedestres não são revelados no minimapa.
 // Viaturas só aparecem enquanto estiverem realmente perseguindo o jogador.
 for(const v of vehicles){
  if(v===PL.car||Math.abs(v.x-p.x)>130||Math.abs(v.z-p.z)>130)continue;
  if(v.police){if(POL.wanted&&v.alive&&v.chase){
   mctx.fillStyle=(Math.floor(simT*6)%2)?'#ff3030':'#3b8bff';
   mctx.fillRect(v.x+MOFF-4.2,v.z+MOFF-4.2,8.4,8.4);
  }continue}
  if(v.special)mapUnknown(mctx,v.x+MOFF,v.z+MOFF,12,rot);
 }
 {const q=X9.p;if(q&&peds.includes(q)&&Math.floor(simT*5)%2){mctx.fillStyle='#fff';mctx.beginPath();mctx.arc(q.x+MOFF,q.z+MOFF,9,0,7);mctx.fill();mctx.fillStyle='#ff1a1a';mctx.beginPath();mctx.arc(q.x+MOFF,q.z+MOFF,7,0,7);mctx.fill()}} /* v1r21: X9 pisca vermelho */
 for(const k of pickups){if(k.kind==='hp'||k.kind==='cash'||Math.abs(k.x-p.x)>130||Math.abs(k.z-p.z)>130)continue;mapUnknown(mctx,k.x+MOFF,k.z+MOFF,12,rot)}
 for(const c of CELLS){if(c.s<.05)continue;mctx.fillStyle=`rgba(40,205,200,${.22*c.s})`;mctx.beginPath();mctx.arc(c.x+MOFF,c.z+MOFF,mapWeatherRadius(c),0,7);mctx.fill()}pylonMap(mctx,sc);wzMap(mctx,sc);drawPOISet(mctx,sc,true,p,rot);if(storyMap('gas'))gasMapIcons(mctx,15.3/sc,rot);drawTommyRadar(mctx,sc,p);
 rainArrows(mctx,sc,9);drawNav(mctx,sc,3,rot);drawPhoneServiceDots(mctx,sc,p);if(storyMap('safe')&&!city.haze)safeIcon(mctx,17/sc,rot);if(storyMap('tune'))tuneIcon(mctx,15.3/sc,rot);drawMissionIcons(mctx,sc,true,p,rot);{const lc=luciaMapPose();if(lc&&Math.abs(lc.x-p.x)<125&&Math.abs(lc.z-p.z)<125)luciaMapArrow(mctx,lc.x+MOFF,lc.z+MOFF,1/sc,lc.ang)}mctx.restore();
 mapIconFlush(mctx);if(ONLINE.on&&ONLINE.mmT){mctx.save();mctx.setTransform(ONLINE.mmT);netMinimap(mctx,p,sc);mctx.restore()} /* r22: jogadores por cima de todos os ícones (inclusive o carro pessoal), no mesmo transform do mapa */
 if(NAV.marker){const ex=(NAV.marker.x-p.x)*sc,ez=(NAV.marker.z-p.z)*sc,dx=ex*cr-ez*sr,dz=ex*sr+ez*cr,lim=w/2-10;if(Math.abs(dx)>lim||Math.abs(dz)>lim){const k=lim/Math.max(Math.abs(dx),Math.abs(dz));mctx.save();mctx.translate(w/2+dx*k,h/2+dz*k);mctx.rotate(Math.atan2(dz,dx));mctx.fillStyle='#ffd200';mctx.strokeStyle='#000';mctx.lineWidth=2.4;mctx.beginPath();mctx.moveTo(13.6,0);mctx.lineTo(-8.5,-10.2);mctx.lineTo(-8.5,10.2);mctx.closePath();mctx.fill();mctx.stroke();mctx.restore()}}
 drawMissionBearingArrow(mctx,w,h,p,sc,rot);
 drawNorth(mctx,w-19,21,14,rot);
 // player arrow (o radar gira junto, então a seta aponta sempre pra cima)
 mctx.save();mctx.translate(w/2,h/2);mctx.rotate(ang+rot);mctx.fillStyle=plArrowCol();mctx.strokeStyle='#000';mctx.lineWidth=2;
 mctx.beginPath();mctx.moveTo(8,0);mctx.lineTo(-6,-6);mctx.lineTo(-3,0);mctx.lineTo(-6,6);mctx.closePath();mctx.fill();mctx.stroke();mctx.restore();
}

/* v77: planta de interiores no radar. Feita uma vez por interior (flood fill na grade de colisão a cada 0,5 m)
   e guardada num canvas; só é refeita ao trocar de interior/andar ou ao sair da área coberta. */
const INMAP={key:'',cv:null,ox:0,oz:0,S:.5,N:0};
function interiorMapAnchor(){if(PL.inside==='casino'&&CAS.casinoBase)return{c:{x:CAS.casinoBase.x,z:CAS.casinoBase.z-6},N:200,k:'casino'};if(PL.inside==='mall'&&MALL.G)return{c:MALL.lvl?MALL.U:MALL.G,N:240,k:'mall'+MALL.lvl};return{c:{x:Math.round(PL.x/40)*40,z:Math.round(PL.z/40)*40},N:200,k:String(PL.inside)}}
function interiorMapBuild(an){const S=INMAP.S,N=an.N,ox=an.c.x-N*S/2,oz=an.c.z-N*S/2,g=new Uint8Array(N*N);
 const blocked=(x,z)=>query(x,z,.5).some(b=>!b.dead&&x>b.x0-.22&&x<b.x1+.22&&z>b.z0-.22&&z<b.z1+.22);
 let i0=Math.round((PL.x-ox)/S),j0=Math.round((PL.z-oz)/S);if(i0<0||j0<0||i0>=N||j0>=N)return false;const st=[i0*N+j0];g[st[0]]=1;let n=0;
 while(st.length&&n<N*N){const k=st.pop(),i=(k/N)|0,j=k%N;n++;for(const [a,c] of [[i+1,j],[i-1,j],[i,j+1],[i,j-1]]){if(a<0||c<0||a>=N||c>=N)continue;const q=a*N+c;if(g[q])continue;if(blocked(ox+a*S,oz+c*S)){g[q]=2;continue}g[q]=1;st.push(q)}}
 const cv=INMAP.cv||(INMAP.cv=cv0());function cv0(){return document.createElement('canvas')}cv.width=N;cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N),D=im.data,VW=!!(city.st&&city.st.night);
 const F=VW?[52,38,84]:[46,60,80],Wl=VW?[255,120,210]:[150,200,230];
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const v=g[i*N+j],o=(j*N+i)*4;if(v===1){D[o]=F[0];D[o+1]=F[1];D[o+2]=F[2];D[o+3]=255}else if(v===2){D[o]=Wl[0];D[o+1]=Wl[1];D[o+2]=Wl[2];D[o+3]=255}}
 x.putImageData(im,0,0);INMAP.ox=ox;INMAP.oz=oz;INMAP.N=N;return true}
/* v79r3: mapa grande dentro de interiores — mesma planta do radar (flood fill pelas colisões) em resolução maior, gerada só ao abrir o mapa (cache por lugar/andar) */
const INBIG={key:'',cv:null,ox:0,oz:0,S:.2,N:0,bb:null};
function interiorBigBuild(){const an=interiorMapAnchor(),key=an.k+'|'+an.c.x+'|'+an.c.z+'|'+(city.st&&city.st.night?1:0);if(INBIG.key===key&&INBIG.cv)return true;
 const big=['mall','casino','club','lab','bank','emp'].includes(PL.inside),S=big?.3:.18,N=Math.round(an.N*INMAP.S/S),ox=an.c.x-N*S/2,oz=an.c.z-N*S/2,g=new Uint8Array(N*N);
 const blocked=(x,z)=>query(x,z,.5).some(b=>!b.dead&&x>b.x0-.22&&x<b.x1+.22&&z>b.z0-.22&&z<b.z1+.22);
 const i0=Math.round((PL.x-ox)/S),j0=Math.round((PL.z-oz)/S);if(i0<0||j0<0||i0>=N||j0>=N)return false;const st=[i0*N+j0];g[st[0]]=1;let n=0,a0=N,a1=0,c0=N,c1=0;
 while(st.length&&n<N*N){const k=st.pop(),i=(k/N)|0,j=k%N;n++;for(const [a,c] of [[i+1,j],[i-1,j],[i,j+1],[i,j-1]]){if(a<0||c<0||a>=N||c>=N)continue;const q=a*N+c;if(g[q])continue;if(a<a0)a0=a;if(a>a1)a1=a;if(c<c0)c0=c;if(c>c1)c1=c;if(blocked(ox+a*S,oz+c*S)){g[q]=2;continue}g[q]=1;st.push(q)}}
 const cv=INBIG.cv||(INBIG.cv=document.createElement('canvas'));cv.width=N;cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N),D=im.data,VW=!!(city.st&&city.st.night);
 const F=VW?[52,38,84]:[46,60,80],F2=VW?[60,44,96]:[54,70,92],Wl=VW?[255,120,210]:[150,200,230];
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const v=g[i*N+j],o=(j*N+i)*4;if(v===1){const c=((Math.floor(i*S)+Math.floor(j*S))&1)?F:F2;D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}else if(v===2){D[o]=Wl[0];D[o+1]=Wl[1];D[o+2]=Wl[2];D[o+3]=255}}
 x.putImageData(im,0,0);INBIG.ox=ox;INBIG.oz=oz;INBIG.N=N;INBIG.S=S;INBIG.bb=a1>a0?{x0:ox+a0*S,x1:ox+(a1+1)*S,z0:oz+c0*S,z1:oz+(c1+1)*S}:{x0:PL.x-10,x1:PL.x+10,z0:PL.z-10,z1:PL.z+10};INBIG.key=key;return true}
function interiorBigView(){const W=innerWidth,H=innerHeight,b=INBIG.bb,bw=Math.max(8,b.x1-b.x0),bh=Math.max(8,b.z1-b.z0),z=NAV.zoom||1,sc=Math.min(W*.9/bw,H*.8/bh)*z,mx=(b.x0+b.x1)/2,mz=(b.z0+b.z1)/2;
 if(z<=1.001)return{sc,ox:W/2-mx*sc,oy:H/2-mz*sc};const hx=W/2/sc,hz=H/2/sc,cx=Math.max(b.x0+Math.min(hx,bw/2)*.4,Math.min(b.x1-Math.min(hx,bw/2)*.4,NAV.cx??mx)),cy=Math.max(b.z0+Math.min(hz,bh/2)*.4,Math.min(b.z1-Math.min(hz,bh/2)*.4,NAV.cy??mz));NAV.cx=cx;NAV.cy=cy;return{sc,ox:W/2-cx*sc,oy:H/2-cy*sc}}
function interiorBigDraw(g,W,H){if(!interiorBigBuild())return false;const v=interiorBigView(),S=INBIG.S,N=INBIG.N;g.fillStyle='#05040a';g.fillRect(0,0,W,H);g.save();g.translate(v.ox,v.oy);g.scale(v.sc,v.sc);g.imageSmoothingEnabled=false;g.drawImage(INBIG.cv,INBIG.ox,INBIG.oz,N*S,N*S);
 const dot=(x,z,col,r)=>{g.fillStyle=col;g.beginPath();g.arc(x,z,r/v.sc,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=2/v.sc;g.stroke()};
 if(PL.inside==='mall'&&MALL.G){const L=MALL.lvl?'U':'G',R=MALL.lvl?MALL.U:MALL.G;
  for(const key of Object.keys(MALL))if(key.endsWith(L)&&MALL[key]&&MALL[key].clerk){const f=MALL[key].food,fr=MALL[key].fr,col=f?f[1]:fr&&fr.idx!=null?MALL_SHOPS[fr.idx][1]:'#ffd23a';dot(MALL[key].x,MALL[key].z,col==='#1a1a2a'?'#ffd23a':col,7)}
  g.fillStyle='#ffe066';g.fillRect(R.x-4.5,R.z-1,10.5,2);if(!MALL.lvl)dot(R.x-mallEntryL()+1.2,R.z,'#7dff8a',8)}
 g.restore();interiorLabelsDraw(g,interiorLabels().map(q=>({...q,sx:v.ox+q.x*v.sc,sy:v.oy+q.z*v.sc})),H<500?12:15,PL.inside==='casino'?5:0);playerArrow(g,v.ox+PL.x*v.sc,v.oy+PL.z*v.sc,1.6);
 {const t=interiorMapName(),fs=H<500?22:30;g.save();g.font='800 '+fs+'px Fredoka, Arial Black, sans-serif';g.textBaseline='top';g.lineWidth=5;g.strokeStyle='#000';g.fillStyle='#ffe066';g.strokeText(t,14,12);g.fillText(t,14,12);
  const sub=translatePlain('VOCÊ ESTÁ AQUI · role/pinça para aproximar');g.font='700 '+Math.round(fs*.45)+'px Segoe UI, Arial, sans-serif';g.lineWidth=3;g.strokeText(sub,15,16+fs);g.fillStyle='#fff';g.fillText(sub,15,16+fs);g.restore()}
 NAV.icons=[];return true}
function interiorMapName(){const k=PL.inside,M={mall:'SHOPPING',shop:'LOJA DE CONVENIÊNCIA',casino:'CASSINO',club:'DANCETERIA',bank:'BANCO',jail:'DELEGACIA · CELA',lab:'LABORATÓRIO',motel:'MOTEL',ammo:'LOJA DE ARMAS',pawn:'CASA DE PENHORES',safe:'CASA SEGURA',heist:'CASA',emp:'NEGÓCIO'};let n=translatePlain(M[k]||'INTERIOR');if(k==='mall'&&MALL.G)n+=' · '+translatePlain(MALL.lvl?'PISO SUPERIOR':'TÉRREO');if(k==='lab')n+=' · B'+(LAB.cur||1);return n}
function mapIntAvail(){return !!(PL.inside&&!PL.car&&!HELI.cur&&PL.inside!=='backrooms')}
function mapIntSync(){const b=$('#mapIntToggle');if(!b)return;const av=NAV.open&&mapIntAvail();b.hidden=!av;if(av)b.textContent=translatePlain(NAV.inMode?'🏙 VER CIDADE':'🏠 VER INTERIOR')}
function mapIntToggle(){if(!NAV.open||!mapIntAvail())return;const sv={zoom:NAV.zoom,cx:NAV.cx,cy:NAV.cy},o=NAV.otherView||{zoom:1,cx:null,cy:null};NAV.otherView=sv;NAV.zoom=o.zoom;NAV.cx=o.cx;NAV.cy=o.cy;NAV.inMode=!NAV.inMode;NAV.pick=null;NAV.hover=null;mapIntSync();mapLegendShow(false);drawBigmap()}
function mapPlayerPos(){if(PL.inside&&!PL.car&&typeof DOOR!=='undefined'&&DOOR.from&&DOOR.from.x!=null)return{x:DOOR.from.x,z:DOOR.from.z};return PL.car||PL}
/* v1r9: legendas no mapa dos interiores — nome de cada loja/praça de alimentação/escada/saída no shopping; mesas e caça-níqueis no cassino */
function interiorLabels(){const out=[];
 if(PL.inside==='mall'&&MALL.G){const L=MALL.lvl?'U':'G',R=MALL.lvl?MALL.U:MALL.G;
  let fx=0,fz=0,fn=0,fxm=-1e9;for(const key of Object.keys(MALL))if(key.endsWith(L)&&MALL[key]&&MALL[key].clerk){const m=MALL[key],f=m.food,fr=m.fr;if(f){fx+=m.x;fz+=m.z;fn++;fxm=Math.max(fxm,m.x);continue}const nm=fr&&fr.idx!=null?MALL_SHOPS[fr.idx][0]:'';if(nm)out.push({x:m.x,z:m.z,t:nm,c:MALL_SHOPS[fr.idx][1]})}
  if(fn)out.push({x:fx/fn,z:fz/fn,t:'PRAÇA DE ALIMENTAÇÃO',c:'#ff5a2a'}); /* barracas juntas: uma legenda só (os pontos de cada uma continuam) */
  out.push({x:R.x,z:R.z,t:'ESCADA ROLANTE',c:'#ffe066'});if(!MALL.lvl)out.push({x:R.x-mallEntryL()+1.2,z:R.z,t:'SAÍDA',c:'#7dff8a'})}
 else if(PL.inside==='casino'&&CAS.tables){const nm={dice:"LIAR'S DICE",pool:'SINUCA',bj:'BLACKJACK',roul:'ROLETA'};for(const t of CAS.tables)out.push({x:t.x,z:t.z,t:nm[t.kind]||'VIDEOPÔQUER',c:'#ffd23a'});
  const M=CAS.machines||[];if(M.length){let x=0,z=0;for(const m of M){x+=m.x;z+=m.z}out.push({x:x/M.length,z:z/M.length,t:'CAÇA-NÍQUEIS',c:'#ff4fa0'})}}
 return out}
function interiorLabelsDraw(g,pts,fs,dotR){g.save();g.font='800 '+fs+'px Segoe UI, Arial, sans-serif';g.textBaseline='middle';g.lineJoin='round';
 for(const q of pts){if(dotR){g.fillStyle=q.c;g.beginPath();g.arc(q.sx,q.sy,dotR,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1.5;g.stroke()}
  const t=translatePlain(q.t);g.lineWidth=Math.max(2.5,fs*.32);g.strokeStyle='#000';g.strokeText(t,q.sx+dotR+3,q.sy);g.fillStyle='#fff';g.fillText(t,q.sx+dotR+3,q.sy)}g.restore()}
function interiorMiniMap(g,p,rot,w,h){if(PL.inside==='backrooms')return brMiniMap(g,p,rot,w,h);const an=interiorMapAnchor(),key=an.k+'|'+an.c.x+'|'+an.c.z;
 if(INMAP.key!==key){if(!interiorMapBuild(an))return false;INMAP.key=key}
 const k=['mall','lab','casino','club','bank','emp'].includes(PL.inside)?5.2:7.6,S=INMAP.S,N=INMAP.N; /* v78: mais zoom nos interiores pequenos (conveniência, cela, motel…); v79r2: zoom dobrado */g.fillStyle='#07080c';g.fillRect(0,0,w,h);g.save();g.translate(w/2,h/2);g.rotate(rot);g.scale(k,k);g.translate(-p.x,-p.z);g.imageSmoothingEnabled=false;g.drawImage(INMAP.cv,INMAP.ox,INMAP.oz,N*S,N*S);
 const dot=(x,z,col,r=1.1)=>{g.fillStyle=col;g.beginPath();g.arc(x,z,r,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=.35;g.stroke()};
 if(PL.inside==='mall'&&MALL.G){const L=MALL.lvl?'U':'G',R=MALL.lvl?MALL.U:MALL.G;
  for(const key of Object.keys(MALL))if(key.endsWith(L)&&MALL[key]&&MALL[key].clerk){const f=MALL[key].food,fr=MALL[key].fr,col=f?f[1]:fr&&fr.idx!=null?MALL_SHOPS[fr.idx][1]:'#ffd23a';dot(MALL[key].x,MALL[key].z,col==='#1a1a2a'?'#ffd23a':col)}
  g.fillStyle='#ffe066';g.fillRect(R.x-4.5,R.z-1,10.5,2);if(!MALL.lvl)dot(R.x-mallEntryL()+1.2,R.z,'#7dff8a',1.4)}
 g.restore();
 {const cr=Math.cos(rot),sr=Math.sin(rot),pts=[];for(const q of interiorLabels()){const ex=(q.x-p.x)*k,ez=(q.z-p.z)*k,sx=w/2+ex*cr-ez*sr,sy=h/2+ex*sr+ez*cr;if(sx>-4&&sx<w-10&&sy>4&&sy<h-4)pts.push({...q,sx,sy})}
  interiorLabelsDraw(g,pts,7.5,PL.inside==='casino'?2.2:0)}
 return true}
/* ================= MAP, MARKER, GPS ================= */
const NAV={marker:null,route:null,rT:0,open:false,legend:false,beam:null};
const bigmap=$('#bigmap'),bctx=bigmap.getContext('2d');{const old=bctx.fillText.bind(bctx);bctx.fillText=(t,...args)=>old(translatePlain(String(t)),...args)}
function setMarker(x,z){if(PL.inside==='backrooms')return;if(missionGPSGuard()){toast('GPS DA MISSÃO FIXO · SIGA O !');return}
 // Fora de missao, clicar perto de um ! seleciona precisamente o ponto; clicar de novo o desmarca.
 for(const q of missionTargets())if(!q.active&&Math.hypot(q.x-x,q.z-z)<14){x=q.x;z=q.z;break}
 NAV.misMarker=false;if(NAV.marker&&Math.hypot(NAV.marker.x-x,NAV.marker.z-z)<30){NAV.marker=null;NAV.route=null;if(NAV.beam)NAV.beam.visible=false;toast('MARCADOR REMOVIDO');return}
 NAV.marker={x,z};NAV.rT=0;if(teleportMode){teleportToMarker();return}
 if(PL.taxi&&(TAXI.state==='dest'||TAXI.state==='ride'))taxiBeginRide();
 if(!NAV.beam){const g=new THREE.CylinderGeometry(1.2,1.2,90,16,1,true);NAV.beam=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffd200,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));NAV.beam.renderOrder=4;scene.add(NAV.beam)}
 NAV.beam.visible=true;NAV.beam.position.set(x,45,z)}
function updateNav(dt){missionGPSGuard();if(!NAV.marker)return;const p=PL.car||PL;if(!NAV.misMarker&&Math.hypot(NAV.marker.x-p.x,NAV.marker.z-p.z)<14){NAV.marker=null;NAV.route=null;NAV.beam.visible=false;toast('VOCÊ CHEGOU');return}
 if(!PL.car&&!PL.heli&&!PL.taxi){NAV.route=null;NAV.rT=0;return}
 NAV.rT-=dt;if(NAV.rT>0)return;NAV.rT=.8;const a=PL.car?aheadNode(PL.car):nodeOf(p.x,p.z),b=nodeOf(NAV.marker.x,NAV.marker.z);
 /* v79r25: de carro/moto/táxi o GPS respeita a mão das ruas de mão única (canDrive) e desenha a linha na faixa da direita do sentido; barco/heli seguem o traçado livre */
 const road=!!(PL.car&&!PL.car.t.boat&&!PL.heli);let path=road?bfsNext(a,b,true):null;if(!path)path=bfsNext(a,b);
 NAV.route=path?[[p.x,p.z]].concat(navLaneLine(path,road)).concat([[NAV.marker.x,NAV.marker.z]]):[[p.x,p.z],[NAV.marker.x,NAV.marker.z]]}
function navLaneOff(n,d){const L=lineType(n[0],n[1],d);return L.t==='one'?0:L.t==='two'?LANES[0]:(LANES[0]+LANES[1])/2}
function navLaneLine(path,road){const pts=path.map(n=>[n[0]*P,n[1]*P]);if(!road||path.length<2)return pts;const out=[];
 const seg=[];for(let i=0;i<path.length-1;i++){const dx=path[i+1][0]-path[i][0],dz=path[i+1][1]-path[i][1];const d=D.findIndex(v=>v[0]===dx&&v[1]===dz);if(d<0){seg.push([0,0]);continue}const o=navLaneOff(path[i],d);seg.push([-D[d][1]*o,D[d][0]*o])}
 for(let i=0;i<pts.length;i++){const s0=seg[Math.max(0,i-1)],s1=seg[Math.min(seg.length-1,i)];const ox=i===0?s1[0]:i===pts.length-1?s0[0]:s0[0]+s1[0],oz=i===0?s1[1]:i===pts.length-1?s0[1]:s0[1]+s1[1];out.push([pts[i][0]+ox,pts[i][1]+oz])}return out}
function rainArrows(g,sc,sz){const w=Math.hypot(WX.wx||0,WX.wz||0);if(w<.1)return;const ux=WX.wx/w,uz=WX.wz/w;
 for(const c of CELLS){if(c.s<.08||c.big)continue;const L=Math.min(c.r*.55,(sz*3.2)/sc),x0=c.x+MOFF-ux*L*.5,z0=c.z+MOFF-uz*L*.5,x1=c.x+MOFF+ux*L*.5,z1=c.z+MOFF+uz*L*.5,h=sz*1.1/sc;
  g.strokeStyle='#2f7bff';g.fillStyle='#2f7bff';g.globalAlpha=Math.min(1,.4+c.s);g.lineWidth=sz*.35/sc;g.lineCap='round';g.beginPath();g.moveTo(x0,z0);g.lineTo(x1-ux*h*.6,z1-uz*h*.6);g.stroke();
  g.beginPath();g.moveTo(x1,z1);g.lineTo(x1-ux*h-uz*h*.6,z1-uz*h+ux*h*.6);g.lineTo(x1-ux*h+uz*h*.6,z1-uz*h-ux*h*.6);g.closePath();g.fill();g.globalAlpha=1}}
function drawNav(g,sc,lw,rot=0){if(NAV.route&&(PL.car||PL.heli||PL.taxi)){g.strokeStyle='#ffd200';g.lineWidth=lw/sc;g.lineJoin='round';g.globalAlpha=.9;g.beginPath();NAV.route.forEach((q,i)=>i?g.lineTo(q[0]+MOFF,q[1]+MOFF):g.moveTo(q[0]+MOFF,q[1]+MOFF));g.stroke();g.globalAlpha=1}
 if(NAV.marker)drawMapIcon(g,'gps',NAV.marker.x+MOFF,NAV.marker.z+MOFF,10/sc,rot)}

const MINI={};
function drawNorth(g,x,y,s,rot){g.save();g.translate(x,y);if(rot)g.rotate(rot);g.fillStyle='#000a';g.beginPath();g.arc(0,0,s,0,7);g.fill();g.fillStyle='#ff3b3b';g.beginPath();g.moveTo(0,-s*.8);g.lineTo(s*.38,0);g.lineTo(-s*.38,0);g.closePath();g.fill();
 g.fillStyle='#fff';g.beginPath();g.moveTo(0,s*.8);g.lineTo(s*.38,0);g.lineTo(-s*.38,0);g.closePath();g.fill();g.font=`${Math.round(s*.9)}px Segoe UI,Arial,sans-serif,monospace`;g.textAlign='center';g.textBaseline='bottom';g.fillStyle='#fff';g.fillText('N',0,-s*.82);g.restore()}
function playerArrow(g,x,y,sz){let ang;if(PL.car)ang=PL.car.a;else if(camMode==='fps')ang=Math.atan2(-Math.cos(PL.yaw),-Math.sin(PL.yaw));else ang=Math.atan2(PL.face[1],PL.face[0]);
 g.save();g.translate(x,y);g.rotate(ang);g.scale(sz,sz);g.fillStyle=plArrowCol();g.strokeStyle='#000';g.lineWidth=2/sz;g.beginPath();g.moveTo(8,0);g.lineTo(-6,-6);g.lineTo(-3,0);g.lineTo(-6,6);g.closePath();g.fill();g.stroke();g.restore()}
function bigView(){if(NAV.inMode&&INBIG.bb)return interiorBigView();const W=innerWidth,H=innerHeight,E=city.ext+MOFF*2,z=NAV.zoom||1,sc=Math.min(W,H)/E*.94*z;if(z<=1.001)return{sc,ox:(W-E*sc)/2,oy:(H-E*sc)/2};
 const h=E/2/z,cx=Math.max(h*.6,Math.min(E-h*.6,NAV.cx??E/2)),cy=Math.max(h*.6,Math.min(E-h*.6,NAV.cy??E/2));NAV.cx=cx;NAV.cy=cy;return{sc,ox:W/2-cx*sc,oy:H/2-cy*sc}}
function mapIconName(k){if(k==='quest')return'MISSÃO';if(k==='mycar')return'SEU ÚLTIMO VEÍCULO';try{const it=mapLegendItems().find(q=>q[0]===k);if(it)return it[1];const e=EMP.sites.find(q=>q.id===k);if(e)return e.name||k}catch(e){}return String(k).toUpperCase()}
function mapIconsAt(cx,cy){const BK=NAV.BK||1,X=cx*BK,Y=cy*BK;return(NAV.icons||[]).filter(q=>Math.hypot(q.sx-X,q.sy-Y)<=q.sr+3*BK).sort((a,b)=>Math.hypot(a.sx-X,a.sy-Y)-Math.hypot(b.sx-X,b.sy-Y))}
function mapHoverTip(g){const h=NAV.hover;if(!h||TOUCH.on)return;const L=mapIconsAt(h.x,h.y);if(!L.length)return;const names=[...new Set(L.map(q=>mapIconName(q.kind)))];
 g.setTransform(NAV.BK||1,0,0,NAV.BK||1,0,0);g.font='600 12px monospace';const w=Math.max(...names.map(n=>g.measureText(translatePlain(n)).width))+16,hh=names.length*16+8+(L.length>1?14:0);let x=h.x+14,y=h.y+10;if(x+w>innerWidth-6)x=h.x-14-w;if(y+hh>innerHeight-6)y=h.y-10-hh;
 g.fillStyle='rgba(8,8,14,.88)';g.fillRect(x,y,w,hh);g.strokeStyle='#ffd200';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,hh-1);g.fillStyle='#fff';g.textBaseline='top';names.forEach((n,i)=>g.fillText(n,x+8,y+6+i*16));
 if(L.length>1){g.fillStyle='#ffd200';g.font='600 10px monospace';g.fillText(PAD.on?'A · ALTERNA':'BOTÃO DIREITO · ALTERNA',x+8,y+6+names.length*16)}}
function mapZoomAt(cx,cy,f){const v=bigView(),E=city.ext+MOFF*2,mx=(cx-v.ox)/v.sc,my=(cy-v.oy)/v.sc,z0=NAV.zoom||1,z=Math.max(1,Math.min(6,z0*f));if(z===z0)return;NAV.zoom=z;
 if(z<=1.001){NAV.cx=NAV.cy=null}else{const sc=v.sc/z0*z;NAV.cx=mx-(cx-innerWidth/2)/sc;NAV.cy=my-(cy-innerHeight/2)/sc}drawBigmap()}

function mapClockLabel(){const h=Math.floor(DN.tod/60)%24,m=Math.floor(DN.tod%60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
// O alvo da missao nao depende do GPS: o ! vive no mapa mesmo se a rota for desligada.
// Uma missao em andamento bloqueia seu GPS; pontos de futuras missoes nao bloqueiam o mapa.
function missionTargets(){
 const targets=[];
 if(typeof RACE!=='undefined'&&RACE.on&&RACE.end<=0&&RACE.cps&&RACE.cps[RACE.i]){
  const q=RACE.cps[RACE.i];targets.push({x:q[0],z:q[1],active:true,id:'race'});
 }
 if(typeof MIS!=='undefined'&&MIS.type){
  const q=(MIS.stage==='pickup'||MIS.stage==='goto')?MIS.fare:MIS.dest;
  if(q&&Number.isFinite(q.x)&&Number.isFinite(q.z))targets.push({x:q.x,z:q.z,active:true,id:'service'});
 }
 if(typeof QUEST!=='undefined'&&storyOn()&&!STORY.cleared){
  const Q=QUEST.pier;let q=null;if(PROLOGUE.active&&PROLOGUE.stage==='dealer'){const d=nearestDealRef(PL);if(d)q={x:d.sx,z:d.sz}}else if(PROLOGUE.active&&(PROLOGUE.stage==='motelDrive'||PROLOGUE.stage==='motelGo'))q=prologueMotelTarget();
  if(Q.state==='sent')q=Q.at;
  else if(Q.state==='ride'){const dest=questPierDrop();if(dest)q={x:dest[0],z:dest[1]}}
  else if(Q.state==='home')q=city.safe;
  else if(Q.state==='idle'&&Q.at&&storyAvail('pier'))q=Q.at;
  if(q&&Number.isFinite(q.x)&&Number.isFinite(q.z))targets.push({x:q.x,z:q.z,active:Q.state!=='idle',id:'pier'});
  try{campTargets(targets)}catch(e){}
  // Proximas missoes podem informar {start:{x,z}} sem alterar GPS ou UI.
  for(const m of STORY_MISSIONS){if(m.id==='pier'||!storyAvail(m.id)||!m.start)continue;
   const start=typeof m.start==='function'?m.start():m.start;
   if(start&&Number.isFinite(start.x)&&Number.isFinite(start.z))targets.push({x:start.x,z:start.z,active:false,id:m.id});}
 }
 return targets;
}
function missionObjective(){return missionTargets().find(q=>q.active)||null}
function missionGPSGuard(){const q=missionObjective();if(!q)return false;
 if(!NAV.misMarker||!NAV.marker||Math.hypot(NAV.marker.x-q.x,NAV.marker.z-q.z)>.5)misGPS(q.x,q.z);
 return true;
}
function mapPlaceEntrance(ri,fallback){
 const door=city.doors?.get(ri)?.[0];return door&&Number.isFinite(door.x)&&Number.isFinite(door.z)?{x:door.x,z:door.z}:fallback;
}
const INV_MAP_K=new Set(['mall','casino','club','pol','bank','ammo','pawn','motel']);
function mapPoiEntries(){if(S.style==='inverted'&&!mapPoiEntries.base){let A=[];mapPoiEntries.base=true;try{A=mapPoiEntries().filter(q=>INV_MAP_K.has(q.k))}catch(e){}finally{mapPoiEntries.base=false}if(INVERT.portal)A.push({k:'rift',x:INVERT.portal.x,z:INVERT.portal.z});return A}const A=[];const M={sky:'sky',hall:'hall',hosp:'hosp',pol:'pol',cem:'cem',univ:'univ',stad:'stad',bank:'bank',mkt:'mkt',mall:'mall'};
 // Locais do Imperio conservam seu simbolo (supermercado, aeroporto etc.);
 // o estado do negocio apenas colore o desenho, sem criar um segundo icone de predio.
 for(const l of city.lms||[]){const k=M[l.name];if(k&&(!EMP_IDS.includes(l.name)||!EMP.sites.some(e=>e.id===l.name)))A.push({k,...mapPlaceEntrance(l.ri,{x:l.x,z:l.z})})}
 for(const e of EMP.sites)A.push({k:e.id,...mapPlaceEntrance(e.ri,{x:e.x,z:e.z}),emp:empIcon(e)});
 for(const d of (city.deals&&city.deals.length?city.deals:(city.deal?[city.deal]:[])))A.push({k:'deal',...mapPlaceEntrance(d.ri,{x:d.ex??d.tx??d.cx,z:d.ez??d.tz??d.cz})});
 // Assaltos noturnos: casas sorteadas (ate 15), marcadas como pequenos pontos brancos.
 if(heistNight()&&HEIST.list.length)for(const hs of HEIST.list)if(!HEIST.robbed.has(hs.id))A.push({k:'heist',x:hs.out.x,z:hs.out.z});

 // A casa de penhores nao pertence aos marcos fixos: e escolhida deterministicamente em um beco.
 if(HEIST.pawn)A.push({k:'pawn',x:HEIST.pawn.x,z:HEIST.pawn.z});if(AMMO.pos)A.push({k:'ammo',x:AMMO.pos.x,z:AMMO.pos.z});
 // v77: motel (modo livre e depois da história) — ícone de cama na entrada de carros
 if(storyOK('motel')){const M=city.motel;if(M&&M.entry)A.push({k:'motel',x:M.entry[0],z:M.entry[1]});else if(city.motelRi!=null&&city.rects[city.motelRi]){const r=city.rects[city.motelRi];A.push({k:'motel',x:(r[0]+r[2])/2,z:(r[1]+r[3])/2})}}
 if(city.casino){
  const K=city.casino;
  // Dois quarteiroes separados: cada estabelecimento tem sua propria porta
  // e marcador visivel do lado externo da fachada.
  A.push({k:'casino',x:K.door.x,z:K.door.z});
  A.push({k:'club',x:K.clubDoor.x,z:K.clubDoor.z});
 }
 for(const d of city.dbs||[])A.push({k:d.forced?'dbx':'db',x:d.cx,z:d.cz});
 for(const q of SIDE.spots)if(sideAvail(q))A.push({k:q.k,x:q.x,z:q.z});
 for(const q of missionTargets())A.push({k:'quest',x:q.x,z:q.z});
 for(const site of PARA.sites)A.push({k:'parachute',x:site.ex,z:site.ez});
 if(city.ext){const E=city.ext,o=RW/2,u=(o+SHORE)/2,sp=city.coastSpan,t=sp?(sp[0]<0?E/4:E*3/4):E/2,c=city.coast;const q=c===0?[t,-u]:c===1?[t,E+u]:c===2?[-u,t]:[E+u,t];A.push({k:'beach',x:q[0],z:q[1]})}
 if(typeof INVERT!=='undefined'&&INVERT.portal)A.push({k:'rift',x:INVERT.portal.x,z:INVERT.portal.z});
 return A}
function roundRectPath(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function drawTommyRadar(g,sc,p){
 if(city.haze||S.style==='inverted')return;
 g.save();g.fillStyle='#ff343f';g.strokeStyle='#17121a';g.lineWidth=1.2/sc;
 for(const q of TOMMY.sites){if(TOMMY.got.has(q.id)||q.p?.state==='dead')continue;const t=q.p||q;if(Math.abs(t.x-p.x)>130||Math.abs(t.z-p.z)>130)continue;g.beginPath();g.arc(t.x+MOFF,t.z+MOFF,3.2/sc,0,Math.PI*2);g.fill();g.stroke();}
 g.restore();
}
function mapUnknown(g,x,y,s,rot=0){drawMapIcon(g,'unknown',x,y,s*.8,rot)}
function empMapColor(status){return status==='empg'?'#3dd46a':status==='empr'?'#c82020':status==='empa'?(Math.floor(simT*3)%2?'#ff2020':'#ff8a1a'):'#ff8a1a'}
// Ícones 2D sem fundo: as funções auxiliares precisam existir mesmo com a legenda fechada.
function empBadge(g,status,r,x,y){
 if(!status)return;
 g.save();g.beginPath();g.arc(x,y,Math.max(1.7,r*.22),0,Math.PI*2);
 g.fillStyle=empMapColor(status);g.fill();
 g.lineWidth=Math.max(.65,r*.065);g.strokeStyle='#191520';g.stroke();g.restore();
}
function gasIconPath(g,x,y,r){
 g.beginPath();g.moveTo(x-r*.48,y-r*.83);g.lineTo(x+r*.27,y-r*.83);
 g.lineTo(x+r*.27,y+r*.83);g.lineTo(x-r*.48,y+r*.83);g.closePath();
 g.moveTo(x-r*.35,y-r*.64);g.lineTo(x+r*.14,y-r*.64);
 g.lineTo(x+r*.14,y-r*.22);g.lineTo(x-r*.35,y-r*.22);g.closePath();
 g.moveTo(x+r*.27,y-r*.37);g.lineTo(x+r*.55,y-r*.15);
 g.lineTo(x+r*.55,y+r*.47);g.lineTo(x+r*.77,y+r*.47);
}
// v285: pictogramas originais em grade 24px; caminhos compartilhados por radar/mapa/legenda.
const MAP_ICON_DEFS={"motel":{"c":"#ff8a6a","p":"M2 5H5.5V11.5H22V20H18.8V17.2H5.2V20H2Z","d":"M6.6 11.5V8.6Q6.6 7.8 7.4 7.8H11.8Q12.6 7.8 12.6 8.6V11.5M14 11.5V9.6H20.4Q21.2 9.6 21.2 10.6V11.5"},"safe":{"c":"#8ed6ac","p":"M2 11 L12 2 22 11 19 11 19 21 5 21 5 11Z","d":"M10 21V14H14V21"},"tune":{"c":"#ec89ba","p":"M16 2L13 6 16 9 20 6Q23 13 16 14L7 22 2 17 11 9Q9 2 16 2Z","d":"M5 17L7 19"},"deal":{"c":"#87bcdf","p":"M2 11L5 5H19L22 11V19H19V21H16V19H8V21H5V19H2Z","d":"M5 11L7 7H17L19 11ZM5 15H8M16 15H19"},"casino":{"c":"#ec89ba","p":"M5 2H19Q21 2 21 4V20Q21 22 19 22H5Q3 22 3 20V4Q3 2 5 2Z","d":"M7 6H8V7H7ZM16 6H17V7H16ZM11 11H13V13H11ZM7 17H8V18H7ZM16 17H17V18H16Z"},"club":{"c":"#ec89ba","p":"M2 3H22L14 12V19H19V22H5V19H10V12Z","d":"M6 6H18"},"hosp":{"c":"#e77b7f","p":"M8 2H16V8H22V16H16V22H8V16H2V8H8Z","d":""},"pol":{"c":"#87bcdf","p":"M12 2L21 5V12Q20 18 12 22Q4 18 3 12V5Z","d":"M12 6L13.5 10 18 10 14.5 13 16 17 12 14.5 8 17 9.5 13 6 10 10.5 10Z"},"mall":{"c":"#ec89ba","p":"M4 8H20L22 22H2Z","d":"","e":"M8 9V6Q8 1 12 2Q16 1 16 6V9"},"bank":{"c":"#e8c477","p":"M2 7L12 2 22 7V10H2ZM3 20H21V23H3ZM5 10H8V20H5ZM11 10H14V20H11ZM17 10H20V20H17Z","d":""},"pawn":{"c":"#e8c477","p":"M12 2L21 7V17L12 22 3 17V7Z","d":"M15 7H10Q7 7 8 10L16 14Q17 17 13 17H8M12 5V19"},"ammo":{"c":"#f2e7ce","p":"M2 5H22V11H13L11 21H5L7 11H2Z","d":"M14 7H20M9 12H13V16H11"},"mkt":{"c":"#8ed6ac","p":"M2 3H6L8 7H22L19 16H8L5 6H2ZM8 19A2 2 0 1 0 12 19A2 2 0 1 0 8 19ZM17 19A2 2 0 1 0 21 19A2 2 0 1 0 17 19Z","d":"M10 10H18"},"gas":{"c":"#e8c477","p":"M3 2H14V20H16V23H1V20H3ZM14 8H17L20 11V17Q23 18 23 15V7L19 3 17 5 20 8V15H19V10H14Z","d":"M6 5H11V10H6Z"},"hall":{"c":"#f2e7ce","p":"M10 2H14V6H18V10H21V22H3V10H6V6H10Z","d":"M12 5V8M9 13H15V22M6 13V17M18 13V17"},"univ":{"c":"#87bcdf","p":"M1 8L12 3 23 8 12 13ZM5 12L12 15 19 12V18Q12 23 5 18Z","d":"","e":"M22 9V18"},"stad":{"c":"#8ed6ac","p":"M5 2H19V6H23V10Q23 15 17 15L14 18V20H19V23H5V20H10V18L7 15Q1 15 1 10V6H5Z","d":"M5 7V12M19 7V12"},"cem":{"c":"#f2e7ce","p":"M5 21V9Q5 1 12 1Q19 1 19 9V21H22V23H2V21Z","d":"M12 6V17M8 10H16"},"sky":{"c":"#87bcdf","p":"M3 22V9H9V2H16V7H21V22Z","d":"M12 5V8M12 11V14M6 12V15M6 18V20M17 11V14M17 18V20"},"ind":{"c":"#e8c477","p":"M2 22V12L9 8V12L16 8V12H19L18 2H22V22Z","d":"M5 17H8M11 17H14M17 17H20"},"air":{"c":"#87bcdf","p":"M11 1H13L15 9 23 14V17L14 14V19L18 21V23L12 22 6 23V21L10 19V14L1 17V14L9 9Z","d":""},"beach":{"c":"#8ed6ac","p":"M11 8Q3 11 1 7Q4 3 10 5Q7 1 12 1Q16 2 15 5Q21 2 23 7Q20 10 15 8L13 19H20V22H4V19H9Z","d":""},"parachute":{"c":"#e8c477","p":"M1 11Q2 1 12 1Q22 1 23 11L19 10 15 11 12 10 8 11 5 10Z","d":"","e":"M2 11L10 19H14L22 11M8 11L11 19M16 11L13 19M10 19V22H14V19"},"rift":{"c":"#e77b7f","p":"M12 1Q23 6 21 15Q19 21 12 23Q2 19 3 10Q4 4 12 1Z","d":"M14 5L9 10 15 13 10 19"},"gps":{"c":"#ffd200","p":"M12 23L4 12Q-1 2 12 1Q25 2 20 12Z","d":"M9 8A3 3 0 1 0 15 8A3 3 0 1 0 9 8Z"},"quest":{"c":"#ffd200","p":"M8 1H16L14 15H10ZM9 18H15V23H9Z","d":""},"unknown":{"c":"#e8c477","p":"M4 7Q4 1 12 1Q21 1 21 7Q21 11 15 13V16H9V11Q15 8 15 6Q12 3 9 7ZM9 19H15V23H9Z","d":""},"skull":{"c":"#f2e7ce","p":"M4 16Q0 12 2 6Q4 1 12 1Q20 1 22 6Q24 12 20 16V22H4Z","d":"M6 8H9V12H6ZM15 8H18V12H15ZM10 16L12 13 14 16M9 19V22M15 19V22"},"race":{"c":"#f2e7ce","p":"M3 23V2H22V16H6V23Z","d":"M7 3H12V8H7ZM12 8H17V13H12ZM17 3H21V8H17Z"},"drag":{"c":"#ec89ba","p":"M3 23V2H22V16H6V23Z","d":"M15 3L9 9H14L11 14 20 7H15Z"},"db":{"c":"#e8c477","p":"M1 22V12H5V22ZM19 22V12H23V22ZM5 16L10 5 13 7 8 18ZM16 18L11 7 14 5 19 16Z","d":""},"dbx":{"c":"#e77b7f","p":"M1 22V12H5V22ZM19 22V12H23V22ZM5 16L10 5 13 7 8 18ZM16 18L11 7 14 5 19 16Z","d":"","e":"M2 2L7 7M7 2L2 7"},"heist":{"c":"#f2e7ce","p":"M9 12A3 3 0 1 0 15 12A3 3 0 1 0 9 12Z","d":""},"wz":{"c":"#e77b7f","p":"M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2ZM12 6A6 6 0 1 1 12 18A6 6 0 1 1 12 6Z","d":""},"obra":{"c":"#ff7a1a","p":"M12 3L19 20H5ZM9.5 11H14.5L15.3 13H8.7ZM7.9 15.5H16.1L16.9 17.5H7.1Z","d":""},"wzOff":{"c":"#2f4fae","p":"M12 2A10 10 0 1 0 12 22A10 10 0 1 0 12 2ZM12 6A6 6 0 1 1 12 18A6 6 0 1 1 12 6Z","d":""},"chase":{"c":"#e77b7f","p":"M12 2L21 5V12Q20 18 12 22Q4 18 3 12V5Z","d":"M12 6L17 15H7ZM12 9V12"},"rain":{"c":"#4fd6cc","p":"M5 14Q0 14 1 9Q2 6 6 7Q6 1 12 2Q17 2 18 7Q24 6 23 11Q23 14 19 14Z","d":"","e":"M6 17L4 22M13 17L11 22M20 17L18 22"}};
MAP_ICON_DEFS.gangY={c:'#f2d21a',p:'M3 3H21V21H3ZM7 7V17H17V7Z'};MAP_ICON_DEFS.gangG={c:'#2fcf4a',p:'M3 3H21V21H3ZM7 7V17H17V7Z'};
MAP_ICON_DEFS.copHeli={c:'#87bcdf',p:'M6 9H15Q19 9 19 13V15H7L4 13H2V10H4L6 12Z',e:'M4 5H21M12 5V9M8 16V19M16 16V19M6 19H18'};
MAP_ICON_DEFS.mycar={c:'#55dfcf',p:MAP_ICON_DEFS.deal.p,d:MAP_ICON_DEFS.deal.d};
const MAP_ICON_PATHS=new Map();
// v78: volta o comportamento simples — ícones NÃO desviam mais; quando se sobrepõem, o mais perto do jogador fica por cima
// (desenho adiado por canvas e ordenado pela distância na tela até o jogador). No mapa grande dá pra dar zoom (roda/+/−),
// arrastar, ver o nome dos ícones sob o cursor e, com o botão direito, alternar entre ícones empilhados (marca o GPS no escolhido).
const MAP_ICON_SLOTS=new WeakMap();
function mapIconReset(g,ref){if(g)MAP_ICON_SLOTS.set(g,{list:[],q:[],ref:ref||null})}
function mapIconPlace(g,x,z,r,a){return[x,z]}
function mapIconFlush(g){const reg=MAP_ICON_SLOTS.get(g);if(!reg||!reg.q.length)return;const R=reg.ref;if(R)reg.q.sort((a,b)=>b.d-a.d);const m0=g.getTransform();
 for(const it of reg.q){g.setTransform(it.m);drawMapIcon0(g,it.k,it.x,it.z,it.r,it.a,it.e)}g.setTransform(m0);reg.q.length=0}
function drawMapIcon(g,kind,x,z,r=6,a=0,emp){const reg=MAP_ICON_SLOTS.get(g);
 if(reg&&reg.ref){const m=g.getTransform(),sx=m.a*x+m.c*z+m.e,sy=m.b*x+m.d*z+m.f,sr=Math.hypot(m.a,m.b)*r;reg.q.push({m,k:kind,x,z,r,a,e:emp,d:(sx-reg.ref[0])**2+(sy-reg.ref[1])**2});reg.list.push({kind,x,z,sx,sy,sr});return}
 drawMapIcon0(g,kind,x,z,r,a,emp)}
const MAP_GRAY=new Map();function mapGray(c){let v=MAP_GRAY.get(c);if(v)return v;const m=/^#([0-9a-f]{6})$/i.exec(c||'');if(!m){MAP_GRAY.set(c,c);return c}const n=parseInt(m[1],16),y=Math.round(.3*(n>>16)+.59*((n>>8)&255)+.11*(n&255));v='rgb('+y+','+y+','+y+')';MAP_GRAY.set(c,v);return v}
function drawMapIcon0(g,kind,x,z,r=6,a=0,emp){
 const d0=MAP_ICON_DEFS[kind]||MAP_ICON_DEFS.unknown,bw=S.style==='inverted'&&kind!=='rift'&&kind!=='mycar'&&kind!=='gps'&&kind!=='pv',d=bw?{...d0,c:mapGray(d0.c)}:d0;if(bw)emp=null;
 let paths=MAP_ICON_PATHS.get(kind);if(!paths){paths=[new Path2D(d.p),d.d?new Path2D(d.d):null,d.e?new Path2D(d.e):null];MAP_ICON_PATHS.set(kind,paths)}
 g.save();g.translate(x,z);if(a)g.rotate(-a);g.scale(r/12,r/12);g.translate(-12,-12);
 g.lineCap='round';g.lineJoin='round';g.strokeStyle='#15131d';g.lineWidth=3.2;
 g.stroke(paths[0]);g.fillStyle=d.c;g.fill(paths[0],'evenodd');
 if(paths[1]){g.strokeStyle='#25212b';g.lineWidth=1.7;g.stroke(paths[1])}
 if(paths[2]){g.strokeStyle='#15131d';g.lineWidth=3.8;g.stroke(paths[2]);g.strokeStyle=d.c;g.lineWidth=1.7;g.stroke(paths[2])}
 g.restore();
 if(emp){g.save();g.translate(x,z);if(a)g.rotate(-a);empBadge(g,emp,r*1.08,-r*.70,-r*.70);g.restore()}
}
function drawMissionIcons(g,sc,mini,pRef,rot=0){const size=mini?13/sc:17/sc;for(const q of missionTargets()){if(mini&&pRef&&(Math.abs(q.x-pRef.x)>140||Math.abs(q.z-pRef.z)>140))continue;drawMapIcon(g,'quest',q.x+MOFF,q.z+MOFF,size,rot)}}
function lastVehicleForMap(){const c=PL.lastCar;return c&&c!==PL.car&&c.alive&&!c.sunk&&vehicles.includes(c)?c:null;}
function drawPOISet(g,sc,mini,pRef,rot=0){const size=mini?11.5/sc:14/sc;
 const heli=COPH.h;
 if(heli?.o&&POL.wanted&&!city.haze&&S.style!=='inverted'&&(!mini||!pRef||Math.hypot(heli.x-pRef.x,heli.z-pRef.z)<=135))
  drawMapIcon(g,'copHeli',heli.x+MOFF,heli.z+MOFF,size,rot);
 const last=lastVehicleForMap();if(last&&(!mini||!pRef||(Math.abs(last.x-pRef.x)<=135&&Math.abs(last.z-pRef.z)<=135)))drawMapIcon(g,'mycar',last.x+MOFF,last.z+MOFF,mini?13/sc:17/sc,rot);
 if(ONLINE.on&&S.style==='modern'){const c=ONLINE.pv;if(c&&c!==last&&c!==PL.car&&vehicles.includes(c)&&c.alive&&(!mini||!pRef||(Math.abs(c.x-pRef.x)<=135&&Math.abs(c.z-pRef.z)<=135)))drawMapIcon(g,'mycar',c.x+MOFF,c.z+MOFF,mini?13/sc:17/sc,rot)}
for(const q of mapPoiEntries()){if(q.k==='quest')continue;if(!storyMap(q.k))continue;if(mini&&pRef&&(Math.abs(q.x-pRef.x)>135||Math.abs(q.z-pRef.z)>135))continue;drawMapIcon(g,q.k,q.x+MOFF,q.z+MOFF,size,rot,q.emp||null)} }
function mapInfoLayout(W,H,v){
 const side=Math.min(W,H)*.94,r=Math.min(27,Math.max(14,side*.044));
 const northX=v.ox+side-r-8,northY=v.oy+2*r+8;
 const w=Math.min(188,Math.max(136,W*.32)),x=W-w-14,h=104;
 const overlap=x<northX+r+6 && 18+h>northY-2*r;
 const y=overlap?northY+r+8:18;
 return {x,y,w,h,cx:x+w/2,northX,northY,r};
}
function drawMapClockUI(g,W,H,v){
 const q=mapInfoLayout(W,H,v);g.save();g.fillStyle='rgba(9,8,16,.91)';g.strokeStyle='#f4e4b0';g.lineWidth=2;roundRectPath(g,q.x,q.y,q.w,q.h,10);g.fill();g.stroke();g.textAlign='center';g.textBaseline='top';
 g.fillStyle='#a8a0c2';g.font='11px Segoe UI,Arial,sans-serif';g.fillText('HORA ATUAL',q.cx,q.y+10);g.fillStyle='#f3d66a';g.font='700 25px Segoe UI,Arial,sans-serif';g.fillText(mapClockLabel(),q.cx,q.y+26);
 g.strokeStyle='#4b4359';g.beginPath();g.moveTo(q.x+12,q.y+58);g.lineTo(q.x+q.w-12,q.y+58);g.stroke();g.fillStyle='#7dff9e';g.font='700 19px Segoe UI,Arial,sans-serif';g.fillText('$ '+Math.max(0,Math.round(PL.money||0)).toLocaleString(S.lang==='en'?'en-US':'pt-BR'),q.cx,q.y+72,q.w-18);g.restore();drawNorth(g,q.northX,q.northY,q.r,0);
}
// Nome da região no topo do mapa completo, numa fonte com a cara de cada mundo.
const MAP_TITLE={modern:{t:'Sunset Shores',f:"Pacifico,'Brush Script MT',cursive",c:'#ffd27a',s:'#c2410c',k:1},synthwave:{t:'SUNSET SHORES',f:"Monoton,'Arial Black',sans-serif",c:'#ff5fd2',s:'#2ad8ff',k:.78},
 inverted:{t:'UPSIDE DOWN',f:"Creepster,Impact,fantasy",c:'#ff3b3b',s:'#000',k:1},haze:{t:'Point Haze',f:"'Pirata One',Georgia,serif",c:'#d8d2bc',s:'#2a2724',k:1.08}};
try{document.fonts&&['Pacifico','Monoton','Creepster','Pirata One'].forEach(f=>document.fonts.load('32px "'+f+'"').catch(()=>{}))}catch(e){}
/* r30/r40: título da missão na tarja de cutscene, como abertura de filme: aparece quando a primeira cena da missão começa
   (na missão 1, depois do "Zoio … presents" e do preto) e some 3 s depois. Uma vez por missão. Fonte = MAP_TITLE do mundo. */
const BARTITLE={shown:'',t0:0};
function storyBarTitleSync(){const el=document.getElementById('storyBarTitle');if(!el)return;
 let key='',t='';try{if(typeof CAMP!=='undefined'&&CAMP.id){const m=campM();key='c'+CAMP.id;t=m?m.title:''}else if(PROLOGUE.active||STORYINTRO.active){key='m1';t='Um novo começo'}}catch(e){}
 if(!key){BARTITLE.shown='';BARTITLE.t0=0}
 const cin=document.body.classList.contains('story-cinematic');
 if(cin&&key&&BARTITLE.shown!==key){const b=$('#storyBlack'),cr=$('#storyCredit'),blackOn=b&&!b.hidden&&+(b.style.opacity||0)>.3,credOn=cr&&+(cr.style.opacity||0)>.05;
  if(!blackOn&&!credOn){BARTITLE.shown=key;BARTITLE.t0=performance.now();t=translatePlain(t);const m=MAP_TITLE[S.style]||MAP_TITLE.modern;el.textContent=t;
   el.style.setProperty('font-family',m.f,'important');el.style.color=m.c;el.style.fontSize='calc(clamp(14px,4.2dvh,40px) * '+m.k+')';el.style.textShadow='2px 2px 0 '+m.s+',0 0 6px rgba(0,0,0,.85)';el.style.opacity='1'}}
 const on=cin&&BARTITLE.t0&&performance.now()-BARTITLE.t0<3000;if(!on&&el.style.opacity!=='0')el.style.opacity='0'}
function drawMapTitle(g,W,H){const m=MAP_TITLE[S.style]||MAP_TITLE.modern,x=14,maxW=Math.min(W-28,Math.max(240,W*.32)),fs=Math.round((H<500?26:36)*m.k);
 g.save();g.textAlign='left';g.textBaseline='alphabetic';g.font=fs+'px '+m.f;const y=12+fs*1.05;
 g.lineJoin='round';g.lineWidth=Math.max(3,fs*.14);g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(m.t,x+2,y+2,maxW);g.fillStyle=m.s;g.fillText(m.t,x+2,y+2,maxW);g.fillStyle=m.c;g.fillText(m.t,x,y,maxW);g.restore();return Math.round(y+fs*.42)}
function mapLegendItems(){
 const poi=new Set(mapPoiEntries().map(q=>q.k)),has=k=>poi.has(k);
 const all=[['mycar','ÚLTIMO VEÍCULO',!!lastVehicleForMap()],['gps','GPS / MARCADOR',true],['quest','MISSÃO',has('quest')],['safe','CASA SEGURA',!!safePos()],['tune','OFICINA',city.tuneRi>=0||!!city.tuneSpot],['deal','CONCESSIONÁRIA',!!((city.deals&&city.deals.length)||city.deal)],['casino','CASSINO',!!city.casino],['club','DANCETERIA',!!city.casino],['db','PONTE LEVADIÇA',(city.dbs||[]).length>0],['dbx','PONTE LEVANTADA (PROCURADO)',(city.dbs||[]).some(d=>d.forced)],
  ['skull','RAMPAGE',has('skull')],['race','CORRIDA ILEGAL · 22h–8h',(SIDE.spots||[]).some(q=>q.k==='race')],['drag','ARRANCADA · 22h–8h',(SIDE.spots||[]).some(q=>q.k==='drag')],
  ['hosp','HOSPITAL',has('hosp')],['pol','DELEGACIA',has('pol')],['mall','SHOPPING',has('mall')],['bank','BANCO',has('bank')],['pawn','CASA DE PENHORES',has('pawn')],['motel','MOTEL',has('motel')],['ammo','MUNIÇÕES · ARMAS',has('ammo')],['mkt','SUPERMERCADO',has('mkt')],['gas','POSTO',(city.lms||[]).some(l=>l.name==='gas')],
  ['hall','PREFEITURA',has('hall')],['univ','UNIVERSIDADE',has('univ')],['stad','ESTÁDIO',has('stad')],['cem','CEMITÉRIO',has('cem')],['sky','ARRANHA-CÉU',has('sky')],['ind','INDÚSTRIA',has('ind')],['air','AEROPORTO',has('air')],
  ['beach','PRAIA',has('beach')],['parachute','SALTO DE PARAQUEDAS',has('parachute')],['rift','FENDA · UPSIDE DOWN',has('rift')],
  ['wz','ÁREA DE BUSCA DA POLÍCIA',WZ.list.length>0],['wzOff','BUSCA ENCERRANDO · CRIME AQUI DEVOLVE AS ESTRELAS',WZ.fade.length>0],['obra','OBRA · RUA FECHADA',!!(typeof OBRA!=='undefined'&&OBRA.seg&&OBRA.phase!=='off')],['gangY','GANGUE AMARELA',!!(typeof GANG!=='undefined'&&gangOK()&&GANG.T.some(t=>t.g===0&&!t.clear))],['gangG','GANGUE VERDE',!!(typeof GANG!=='undefined'&&gangOK()&&GANG.T.some(t=>t.g===1&&!t.clear))],['rain','CHUVA',CELLS.some(c=>c.s>=.05)],['unknown','ITEM OU VEÍCULO RARO (RADAR)',true],['chase','VIATURA TE SEGUINDO (RADAR)',true]];
 return all.filter(q=>q[2]&&storyMap(q[0])&&(!city.haze||q[0]==='gps'||q[0]==='beach'||q[0]==='rain'));
 }
function mapLegendRender(){
 const list=$('#mapLegendList');list.replaceChildren();
 for(const [kind,label] of mapLegendItems()){
  const row=document.createElement('div');row.className='mlegrow';
  const icon=document.createElement('canvas');icon.width=96;icon.height=96;icon.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.textContent=label;
  const context=icon.getContext('2d');
  const empire=EMP.sites.find(e=>e.id===kind);
  drawMapIcon(context,kind,48,48,33,0,empire?empIcon(empire):null);
  row.append(icon,name);list.appendChild(row);
 }
 list.scrollTop=0;
}
function mapLegendShow(show){
 if(!NAV.open)show=false;
 NAV.legend=!!show;
 $('#mapLegend').hidden=!NAV.legend;
 const toggle=$('#mapLegendToggle');toggle.hidden=!NAV.open||!!NAV.inMode;if(NAV.inMode){NAV.legend=false;$('#mapLegend').hidden=true}
 toggle.setAttribute('aria-expanded',String(NAV.legend));
 toggle.textContent=NAV.legend?'L · FECHAR LEGENDA':'L · LEGENDA';
 if(NAV.legend)mapLegendRender();
}
function mapLegendToggle(){if(NAV.open)mapLegendShow(!NAV.legend)}
$('#mapLegendToggle').addEventListener('click',e=>{e.stopPropagation();mapLegendToggle()});
for(const ev of ['pointerdown','mousedown','click','touchstart','wheel'])$('#mapPlayers').addEventListener(ev,e=>e.stopPropagation(),{passive:true});$('#netCallOk').addEventListener('click',()=>netCallAnswer(true));$('#netCallNo').addEventListener('click',()=>netCallAnswer(false));$('#mapPlayersHead').addEventListener('click',()=>{ONLINE.plOpen=!ONLINE.plOpen;ONLINE.plT=0;netPlayerPanel()});
$('#mapLegendClose').addEventListener('click',e=>{e.stopPropagation();mapLegendShow(false)});


function drawBigmap(){if(!NAV.open||!mapCv)return;try{drawBigmap0()}finally{if(PAD.on&&NAV.cur&&!NAV.inMode){const v=bigView(),x=v.ox+(NAV.cur.x+MOFF)*v.sc,y=v.oy+(NAV.cur.z+MOFF)*v.sc,g=bctx;g.save();g.strokeStyle='#000';g.lineWidth=5;g.beginPath();g.arc(x,y,11,0,7);g.moveTo(x-18,y);g.lineTo(x+18,y);g.moveTo(x,y-18);g.lineTo(x,y+18);g.stroke();g.strokeStyle='#ffd23a';g.lineWidth=2.5;g.stroke();g.restore();g.save();g.fillStyle='#fff';g.font='700 13px Segoe UI,Arial';g.textAlign='right';g.fillText('A/✕ MARCAR DESTINO · B/○ FECHAR',innerWidth-16,innerHeight-16);g.restore()}}}
function drawBigmap0(){const W=innerWidth,H=innerHeight,BK=Math.min(2.5,window.devicePixelRatio||1);bigmap.width=Math.round(W*BK);bigmap.height=Math.round(H*BK);const g=bctx;g.setTransform(BK,0,0,BK,0,0);if(PL.inside==='backrooms'&&BR.mapCv){NAV.BK=BK;mapIconReset(g,[0,0]);brBigDraw(g,W,H);return}if(ONLINE.on)netPlayerPanel();if(NAV.inMode){NAV.BK=BK;mapIconReset(g,[0,0]);try{if(interiorBigDraw(g,W,H))return}catch(e){console.error(e)}NAV.inMode=false;mapIntSync()}const v=bigView();{const p=mapPlayerPos();mapIconReset(g,[(v.ox+(p.x+MOFF)*v.sc)*BK,(v.oy+(p.z+MOFF)*v.sc)*BK])}NAV.BK=BK;
 g.fillStyle='#05040a';g.fillRect(0,0,W,H);g.save();g.translate(v.ox,v.oy);g.scale(v.sc,v.sc);g.imageSmoothingEnabled=false;g.drawImage(mapCv,0,0);brMapGlitch(g,v.sc);
 if(S.style==='inverted'){
  pylonMap(g,v.sc);drawPOISet(g,v.sc,false,null);if(storyMap('safe')&&!city.haze)safeIcon(g,23.8/v.sc);if(storyMap('gas'))gasMapIcons(g,22.1/v.sc);
  drawNav(g,v.sc,4);drawMissionIcons(g,v.sc,false,null); // Mesmo traçado GPS no mapa completo invertido
  demoMapDots(g,v.sc);
  g.restore();
  const p=mapPlayerPos();
  {const lc=luciaMapPose();if(lc)luciaMapArrow(g,v.ox+(lc.x+MOFF)*v.sc,v.oy+(lc.z+MOFF)*v.sc,1.6,lc.ang)}
  {const reg=MAP_ICON_SLOTS.get(g);NAV.icons=reg?reg.list.slice():[]}mapIconFlush(g);if(ONLINE.on)netBigmap(g,v);playerArrow(g,v.ox+(p.x+MOFF)*v.sc,v.oy+(p.z+MOFF)*v.sc,1.6);
  drawMapClockUI(g,W,H,v);drawMapTitle(g,W,H);if(ONLINE.on)netPlayerPanel();
  return
 }
 /* não exibir tráfego nem pedestres no mapa completo. */
 /* viaturas, garagens especiais e pickups não são revelados no mapa grande. */
 if(storyMap('safe')&&!city.haze)safeIcon(g,23.8/v.sc);if(storyMap('tune'))tuneIcon(g,20.4/v.sc);
 for(const c of CELLS){if(c.s<.05)continue;g.fillStyle=`rgba(40,205,200,${.25*c.s})`;g.beginPath();g.arc(c.x+MOFF,c.z+MOFF,mapWeatherRadius(c),0,7);g.fill()}pylonMap(g,v.sc);wzMap(g,v.sc);drawPOISet(g,v.sc,false,null);if(storyMap('gas'))gasMapIcons(g,22.1/v.sc);
 rainArrows(g,v.sc,14);drawMissionIcons(g,v.sc,false,null);
  drawNav(g,v.sc,4);
 g.restore();const p=mapPlayerPos();{const lc=luciaMapPose();if(lc)luciaMapArrow(g,v.ox+(lc.x+MOFF)*v.sc,v.oy+(lc.z+MOFF)*v.sc,1.6,lc.ang)}{const reg=MAP_ICON_SLOTS.get(g);NAV.icons=reg?reg.list.slice():[]}mapIconFlush(g);if(ONLINE.on)netBigmap(g,v);playerArrow(g,v.ox+(p.x+MOFF)*v.sc,v.oy+(p.z+MOFF)*v.sc,1.6);
 drawMapClockUI(g,W,H,v);drawMapTitle(g,W,H);if(ONLINE.on)netPlayerPanel();mapHoverTip(g)}
function openMap(){if(!played||menuOpen||missionUiBlocked('map'))return;missionGPSGuard();NAV.open=true;NAV.zoom=1;NAV.cx=NAV.cy=null;NAV.hover=null;NAV.pick=null;NAV.inMode=mapIntAvail();NAV.otherView=null;{const p=PL.car||PL;NAV.cur={x:p.x,z:p.z}}bigmap.hidden=false;$('#mapBack').hidden=false;mapIntSync();mapLegendShow(false);for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();drawBigmap()}
function closeMap(){NAV.open=false;NAV.inMode=false;bigmap.hidden=true;$('#mapPlayers').hidden=true;$('#onChatBtn').style.visibility='';$('#mapBack').hidden=true;mapLegendShow(false);mapIntSync()}
mini.addEventListener('click',e=>{e.stopPropagation();openMap()});
mini.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();const r=mini.getBoundingClientRect(),p=PL.car||PL,sc=.75*r.width/180;
 const sx=(e.clientX-r.left-r.width/2)/sc,sy=(e.clientY-r.top-r.height/2)/sc,rt=-(MINI.rot||0),wx=p.x+sx*Math.cos(rt)-sy*Math.sin(rt),wz=p.z+sx*Math.sin(rt)+sy*Math.cos(rt);if(mapInside(wx,wz))setMarker(wx,wz)});
// A short mobile tap marks the GPS. Desktop retains click-to-close/right-click-to-mark.
const MAP_TAP={start:null,ignoreClickUntil:0};
function mapMarkAt(clientX,clientY){if(!NAV.open)return;
 const r=bigmap.getBoundingClientRect(),v=bigView();
 if(!r.width||!r.height)return;
 const x=(clientX-r.left)*innerWidth/r.width,y=(clientY-r.top)*innerHeight/r.height;
 mapPickAt(x,y);
}
$('#mapBack').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeMap()});
$('#mapIntToggle').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();mapIntToggle()});$('#mapIntToggle').addEventListener('touchend',e=>{e.stopPropagation()},{passive:true});
bigmap.addEventListener('click',e=>{e.stopPropagation();if(performance.now()<MAP_TAP.ignoreClickUntil)return;
 if(TOUCH.on)mapMarkAt(e.clientX,e.clientY);else if(!(NAV.dragEndT&&performance.now()-NAV.dragEndT<250))closeMap();
});
bigmap.addEventListener('touchstart',e=>{const t=e.touches[0];MAP_TAP.start=e.touches.length===1?{id:t.identifier,x:t.clientX,y:t.clientY}:null;
 if(e.touches.length===2){const[a,b]=e.touches;MAP_TAP.pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,z:NAV.zoom||1}}else MAP_TAP.pinch=null;MAP_TAP.pan=e.touches.length===1?{x:t.clientX,y:t.clientY}:null},{passive:true});
// v78: pinça = zoom; um dedo arrastando (com zoom) = mover o mapa; toque curto continua marcando o GPS / alternando ícones
bigmap.addEventListener('touchmove',e=>{const P=MAP_TAP.pinch;if(P&&e.touches.length===2){const[a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),want=Math.max(1,Math.min(6,P.z*d/P.d));mapZoomAt((a.clientX+b.clientX)/2,(a.clientY+b.clientY)/2,want/(NAV.zoom||1));return}
 const q=MAP_TAP.pan;if(q&&e.touches.length===1&&(NAV.zoom||1)>1.001&&!MAP_TAP.start){const t=e.touches[0],v=bigView();NAV.cx=(NAV.cx??(city.ext+MOFF*2)/2)-(t.clientX-q.x)/v.sc;NAV.cy=(NAV.cy??(city.ext+MOFF*2)/2)-(t.clientY-q.y)/v.sc;q.x=t.clientX;q.y=t.clientY;drawBigmap()}},{passive:true});
bigmap.addEventListener('touchmove',e=>{const p=MAP_TAP.start;if(!p)return;const t=Array.from(e.touches).find(t=>t.identifier===p.id);
 if(e.touches.length!==1||!t||Math.hypot(t.clientX-p.x,t.clientY-p.y)>12)MAP_TAP.start=null;
},{passive:true});
bigmap.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();MAP_TAP.ignoreClickUntil=performance.now()+800;
 const p=MAP_TAP.start;MAP_TAP.start=null;if(!p||e.touches.length)return;
 const t=Array.from(e.changedTouches).find(t=>t.identifier===p.id);if(t&&Math.hypot(t.clientX-p.x,t.clientY-p.y)<=12)mapMarkAt(t.clientX,t.clientY);
},{passive:false});
bigmap.addEventListener('touchcancel',()=>{MAP_TAP.start=null;MAP_TAP.ignoreClickUntil=performance.now()+800});
bigmap.addEventListener('mousedown',e=>{e.stopPropagation();if(e.button===0)NAV.drag={x:e.clientX,y:e.clientY,moved:false}});
addEventListener('mouseup',()=>{if(NAV.drag&&NAV.drag.moved)NAV.dragEndT=performance.now();NAV.drag=null});
bigmap.addEventListener('mousemove',e=>{const d=NAV.drag;if(d&&(NAV.zoom||1)>1.001){const dx=e.clientX-d.x,dy=e.clientY-d.y;if(d.moved||Math.hypot(dx,dy)>5){d.moved=true;const v=bigView();NAV.cx=(NAV.cx??(city.ext+MOFF*2)/2)-dx/v.sc;NAV.cy=(NAV.cy??(city.ext+MOFF*2)/2)-dy/v.sc;d.x=e.clientX;d.y=e.clientY}}
 NAV.hover={x:e.clientX,y:e.clientY};drawBigmap()});
bigmap.addEventListener('mouseleave',()=>{NAV.hover=null;if(NAV.open)drawBigmap()});
bigmap.addEventListener('wheel',e=>{e.preventDefault();e.stopPropagation();mapZoomAt(e.clientX,e.clientY,e.deltaY<0?1.25:.8)},{passive:false});
addEventListener('keydown',e=>{if(!NAV.open)return;if(e.key==='+'||e.key==='='){mapZoomAt(innerWidth/2,innerHeight/2,1.25);e.preventDefault()}else if(e.key==='-'||e.key==='_'){mapZoomAt(innerWidth/2,innerHeight/2,.8);e.preventDefault()}});
function mapPickAt(cx,cy){if(NAV.inMode)return;const v=bigView(),L=mapIconsAt(cx,cy);
 if(L.length){const same=NAV.pick&&Math.hypot(NAV.pick.x-cx,NAV.pick.y-cy)<8&&NAV.pick.n===L.length,i=same?(NAV.pick.i+1)%L.length:0;NAV.pick={x:cx,y:cy,n:L.length,i};const q=L[i];
  if(L.length>1||!NAV.marker||Math.hypot(NAV.marker.x-(q.x-MOFF),NAV.marker.z-(q.z-MOFF))>2)NAV.marker=null;setMarker(q.x-MOFF,q.z-MOFF);
  if(NAV.marker)toast(mapIconName(q.kind)+(L.length>1?' · '+(i+1)+'/'+L.length:''))}
 else{const wx=(cx-v.ox)/v.sc-MOFF,wz=(cy-v.oy)/v.sc-MOFF;if(!mapInside(wx,wz))return;setMarker(wx,wz)}drawBigmap()}
/* v78: o GPS só marca dentro da área desenhada do mapa (cidade + margem MOFF); toque na borda preta é ignorado */
function mapInside(x,z){const E=city.ext;return x>=-MOFF&&x<=E+MOFF&&z>=-MOFF&&z<=E+MOFF}
bigmap.addEventListener('contextmenu',e=>{e.preventDefault();mapPickAt(e.clientX,e.clientY)});

