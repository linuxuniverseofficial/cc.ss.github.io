#!/usr/bin/env node
/* =====================================================================================================
   COASTAL CHAOS · Detector de z-fight (faces coplanares que piscam)
   -----------------------------------------------------------------------------------------------------
   O que faz: abre o jogo num Chromium sem janela (Playwright), monta todos os interiores e a cidade, e
   procura pares de faces que:
     · estão no mesmo plano alinhado a um eixo (distância ≤ 2,5 mm);
     · têm aparência diferente (outra cor de vértice, outro material ou outra textura);
     · se sobrepõem de verdade (≥ 1 cm nos dois sentidos);
     · são visíveis (um ponto 1,2 cm à frente da face não fica dentro de outro sólido nem fora do
       ambiente fechado — nos interiores, o raio tem que bater em algo nas 6 direções).
   Para cada conflito informa: ambiente, eixo, posição no mundo, área, distância entre os planos e as
   LINHAS (arquivo.js:linha) que geraram cada face (rastreia MB.quad). Ignora materiais com polygonOffset,
   sem depthTest ou invisíveis.

   Uso (servidor local servindo a pasta do jogo, ex.: python3 -m http.server 8791):
     npm i playwright            # uma vez (e: npx playwright install chromium)
     node tools/zfight-detector.js [url] [--seed 777] [--size 7] [--only lab,motel] [--ext] [--off]
       url      padrão http://localhost:8791/index.html (precisa carregar o three.js; use a cópia local se
                o CDN não estiver acessível)
       --seed   semente da cidade (padrão 777)        --size  tamanho da cidade (padrão 7)
       --only   limita os interiores (safe,ammo,shop,mall,casino,pawn,bank,jail,motel,lab)
       --ext    também varre os exteriores dos prédios especiais (landmarks, motel, loja de pneus, aeroporto)
       --off    desliga o anti z-fight (ZF) do jogo — mostra o "antes"
       --top N  quantos conflitos listar por ambiente (padrão 15)
   Saída: resumo no terminal + zfight-report.json (todos os conflitos com posição e linhas).
   Regra do projeto: rodar ao criar/alterar QUALQUER ambiente, cenário ou objeto; o alvo é 0 conflitos
   com área relevante (> ~0,01 m²). Ver CONTEXT.md › "Detector de z-fight".
   ===================================================================================================== */
const fs=require('fs');
let chromium;try{({chromium}=require('playwright'))}catch(e){console.error('Instale o Playwright: npm i playwright && npx playwright install chromium');process.exit(1)}
const argv=process.argv.slice(2),opt={url:'http://localhost:8791/index.html',seed:777,size:7,only:null,ext:false,off:false,top:15};
for(let i=0;i<argv.length;i++){const a=argv[i];if(a==='--seed')opt.seed=+argv[++i];else if(a==='--size')opt.size=+argv[++i];else if(a==='--only')opt.only=argv[++i].split(',');
 else if(a==='--ext')opt.ext=true;else if(a==='--off')opt.off=true;else if(a==='--top')opt.top=+argv[++i];else if(!a.startsWith('--'))opt.url=a}

/* roda dentro da página: coleta faces axiais de uma raiz, cruza, filtra visibilidade e mapeia para linhas */
function scanInPage(cfg){
 const v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],e1=new THREE.Vector3(),e2=new THREE.Vector3(),n=new THREE.Vector3(),M=new THREE.Matrix4();
 const appear=(mat,col)=>(mat.map?mat.map.uuid:'')+'|'+(mat.color?mat.color.getHexString():'')+'|'+col+'|'+(mat.transparent?'T':'')+mat.uuid;
 const inZ=p=>{if(!cfg.zones)return 'in';for(const z of cfg.zones)if(p[0]>=z.x0&&p[0]<=z.x1&&p[2]>=z.z0&&p[2]<=z.z1)return z.n;return null};
 const out={};
 for(const [rn,root] of cfg.roots){if(!root)continue;root.updateMatrixWorld(true);const B=new Map();let ntri=0;
  root.traverse(o=>{if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;const mats=Array.isArray(o.material)?o.material:[o.material];
   const g=o.geometry,P=g.attributes.position,Cc=g.attributes.color,I=g.index,cnt=I?I.count:P.count,insts=o.isInstancedMesh?o.count:1;
   for(let k=0;k<insts;k++){if(o.isInstancedMesh){o.getMatrixAt(k,M);M.premultiply(o.matrixWorld)}else M.copy(o.matrixWorld);
    const grp=g.groups&&g.groups.length?g.groups:[{start:0,count:cnt,materialIndex:0}];
    for(const G of grp){const mat=mats[G.materialIndex||0]||mats[0];if(!mat||mat.visible===false||mat.polygonOffset||mat.depthTest===false||mat.opacity===0)continue;const ds=mat.side===THREE.DoubleSide;
     for(let t=G.start;t<G.start+G.count;t+=3){const ia=I?I.getX(t):t,ib=I?I.getX(t+1):t+1,ic=I?I.getX(t+2):t+2;
      v[0].fromBufferAttribute(P,ia).applyMatrix4(M);v[1].fromBufferAttribute(P,ib).applyMatrix4(M);v[2].fromBufferAttribute(P,ic).applyMatrix4(M);
      e1.subVectors(v[1],v[0]);e2.subVectors(v[2],v[0]);n.crossVectors(e1,e2);const L=n.length();if(L<1e-7)continue;n.divideScalar(L);
      let a=-1;if(Math.abs(n.x)>.999)a=0;else if(Math.abs(n.y)>.999)a=1;else if(Math.abs(n.z)>.999)a=2;if(a<0)continue;
      const s=ds?0:Math.sign(n.getComponent(a)),c=(v[0].getComponent(a)+v[1].getComponent(a)+v[2].getComponent(a))/3,u=(a+1)%3,w=(a+2)%3;
      const bb=[Math.min(v[0].getComponent(u),v[1].getComponent(u),v[2].getComponent(u)),Math.max(v[0].getComponent(u),v[1].getComponent(u),v[2].getComponent(u)),Math.min(v[0].getComponent(w),v[1].getComponent(w),v[2].getComponent(w)),Math.max(v[0].getComponent(w),v[1].getComponent(w),v[2].getComponent(w))];
      const col=Cc?[Cc.getX(ia),Cc.getY(ia),Cc.getZ(ia)].map(x=>Math.round(x*40)).join(','):'';const key=a+':'+Math.round(c/.004);ntri++;
      let arr=B.get(key);if(!arr)B.set(key,arr=[]);arr.push({a,s,c,bb,ap:appear(mat,col),nm:'#'+o.id+(o.name?' '+o.name:'')+(col?' rgb40('+col+')':'')})}}}});
  const hits=[],seen=new Set();
  for(const [key,arr] of B){const [a,q]=key.split(':').map(Number),nb=[arr,B.get(a+':'+(q+1))||[]];
   for(let i=0;i<arr.length;i++){const A=arr[i];for(const L2 of nb)for(let j=(L2===arr?i+1:0);j<L2.length;j++){const Bt=L2[j];
    if(Math.abs(A.c-Bt.c)>.0025||(A.s&&Bt.s&&A.s!==Bt.s)||A.ap===Bt.ap)continue;
    const ou=Math.min(A.bb[1],Bt.bb[1])-Math.max(A.bb[0],Bt.bb[0]),ow=Math.min(A.bb[3],Bt.bb[3])-Math.max(A.bb[2],Bt.bb[2]);if(ou<.01||ow<.01)continue;
    const p=[0,0,0];p[a]=A.c;p[(a+1)%3]=(Math.max(A.bb[0],Bt.bb[0])+Math.min(A.bb[1],Bt.bb[1]))/2;p[(a+2)%3]=(Math.max(A.bb[2],Bt.bb[2])+Math.min(A.bb[3],Bt.bb[3]))/2;
    const zn=inZ(p);if(!zn)continue;const k2=a+':'+p.map(x=>Math.round(x*5)).join(',')+':'+[A.ap,Bt.ap].sort().join('~');if(seen.has(k2))continue;seen.add(k2);
    hits.push({zone:zn,sg:A.s||Bt.s,ax:'xyz'[a],p:p.map(x=>+x.toFixed(3)),area:+(ou*ow).toFixed(4),dc:+(A.c-Bt.c).toFixed(4),A:A.nm,B:Bt.nm})}}}
  // visibilidade
  const meshes=[];root.traverse(o=>{if(o.isMesh&&o.material)meshes.push(o)});const saved=meshes.map(o=>o.material);
  for(const o of meshes)o.material=Array.isArray(o.material)?o.material.map(m=>{const c=m.clone();c.side=THREE.DoubleSide;return c}):(()=>{const c=o.material.clone();c.side=THREE.DoubleSide;return c})();
  const RC=new THREE.Raycaster(),D6=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const vis=h=>{const a='xyz'.indexOf(h.ax);for(const s of (h.sg?[h.sg]:[1,-1])){const p=new THREE.Vector3(...h.p);p.setComponent(a,p.getComponent(a)+s*.012);const d=new THREE.Vector3();d.setComponent(a,s);
    let esc=0;for(const D of D6){RC.set(p,new THREE.Vector3(...D));RC.near=0;RC.far=80;if(!RC.intersectObjects(meshes,false).length)esc++}if(esc>=cfg.maxEscape)continue;
    RC.set(p,d);RC.near=0;RC.far=60;const r=RC.intersectObjects(meshes,false);if(r.length){const f=r[0],fn=f.face.normal.clone().transformDirection(f.object.matrixWorld);if(fn.dot(d)>0&&f.distance<3)continue}else if(cfg.maxEscape<6)continue;
    RC.set(p,d.clone().negate());RC.far=.03;const r2=RC.intersectObjects(meshes,false);if(r2.length&&r2[0].distance<.009)continue;return true}return false};
  const hv=hits.filter(vis);meshes.forEach((o,i)=>{o.material=saved[i]});
  // linhas do código (registro de MB.quad feito antes da montagem)
  for(const h of hv){const ax='xyz'.indexOf(h.ax),u=(ax+1)%3,w=(ax+2)%3,Ls=new Set();for(const q of (window.__ZFQ||[])){if(q.ax!==ax||Math.abs(q.c-h.p[ax])>.006)continue;if(h.p[u]<q.u0-.006||h.p[u]>q.u1+.006||h.p[w]<q.w0-.006||h.p[w]>q.w1+.006)continue;Ls.add(q.st)}h.lines=[...Ls].slice(0,4)}
  hv.sort((x,y)=>y.area-x.area);out[rn]={tris:ntri,hits:hv.length,area:+hv.reduce((s,h)=>s+h.area,0).toFixed(3),list:hv}}
 return out}

(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await (await b.newContext({viewport:{width:800,height:450}})).newPage();
 const err=[];pg.on('pageerror',e=>err.push(e.message));
 await pg.goto(opt.url);await pg.waitForFunction(()=>typeof startGame==='function'&&typeof MB==='function',null,{timeout:120000});
 await pg.evaluate(o=>{ // rastreio de linhas: quem chamou MB.quad (pula o próprio MB, ibox e wrappers)
  window.__ZFQ=[];const own=new Set();const q0=MB.prototype.quad;
  MB.prototype.quad=function(a,b,c,d,nx,ny,nz){let ax=-1;if(Math.abs(nx)>.999)ax=0;else if(Math.abs(ny)>.999)ax=1;else if(Math.abs(nz)>.999)ax=2;
   if(ax>=0&&window.__ZFQ.length<4e6){const u=(ax+1)%3,w=(ax+2)%3,P=[a,b,c,d];const fr=(new Error().stack||'').split('\n').slice(2).map(l=>{const m=l.match(/\/([^\/?#:]+\.(?:js|html))(?:\?[^:]*)?:(\d+):\d+\)?$/);return m?m[1]+':'+m[2]:0}).filter(Boolean);
    const skip=n=>{const [f,ln]=n.split(':');return (f===window.__ZFmbFile&&+ln<=window.__ZFmbEnd&&+ln>=window.__ZFmbStart)||(window.__ZFskip||[]).includes(n)};const st=fr.filter(n=>!skip(n)).slice(0,3).join('>');
    window.__ZFQ.push({ax,c:a[ax],u0:Math.min(...P.map(p=>p[u])),u1:Math.max(...P.map(p=>p[u])),w0:Math.min(...P.map(p=>p[w])),w1:Math.max(...P.map(p=>p[w])),st})}
   return q0.apply(this,arguments)};
  window.__ZFmbStart=0;window.__ZFmbEnd=0; // preenchido abaixo pelo script Node (linhas da class MB)
  if(o.off&&typeof zfBegin==='function')zfBegin=function(){};
  S.renderScale=60;modeSel='free';GAMEMODE='free';S.size=o.size;S.seed=o.seed;S.hour=15;startGame(null)},opt);
 // faixa de linhas da class MB/ibox para não poluir o rastreio
 try{/* v3 r37: o jogo agora é index.html + js/NN-*.js → as linhas viram "arquivo.js:linha" */
  const html=await (await pg.request.get(opt.url)).text();const names=[...html.matchAll(/<script src="(js\/[^"?]+)/g)].map(m=>m[1]);
  let mbF='',a=0,b=0;const sk=[];
  for(const n of names){const src=await (await pg.request.get(new URL(n,opt.url).href)).text(),L=src.split('\n'),f=n.split('/').pop();
   const s0=L.findIndex(l=>/^class MB\b/.test(l));if(s0>=0){let s1=s0;for(let i=s0;i<L.length&&i<s0+200;i++)if(/^const GEO=/.test(L[i])){s1=i;break}mbF=f;a=s0+1;b=s1+1}
   L.forEach((l,i)=>{if(/^function ibox\b|^ibox=\(f=>|^for\(const k of \['box','cbox'\]\)|^function zf[A-Z]/.test(l))sk.push(f+':'+(i+1))})}
  await pg.evaluate(([mf,a,b,sk])=>{window.__ZFmbFile=mf;window.__ZFmbStart=a;window.__ZFmbEnd=b;window.__ZFskip=sk},[mbF,a,b,sk])}catch(e){}
 await pg.waitForFunction(()=>played&&$('#loading').hidden,null,{timeout:600000});await pg.waitForTimeout(1500);
 const report={opt,when:new Date().toISOString(),interiors:{},exteriors:null,errors:[]};
 // interiores: remonta cada um (registra as linhas) e varre
 const names=['safe','ammo','shop','mall','casino','pawn','bank','jail','motel','lab'].filter(n=>!opt.only||opt.only.includes(n));
 report.interiors=await pg.evaluate(([names,scanSrc])=>{const scan=eval('('+scanSrc+')');const B={safe:['SAFE','buildSafehouse'],ammo:['AMMO','ammoBuild'],shop:['SHOP','buildShop'],mall:['MALL','buildMall'],casino:['CAS','casinoBuild'],bank:['BANK','bankBuild'],jail:['JAIL','buildJail'],motel:['MOTEL','motelRoomBuild'],lab:['LAB','labBuild']};
  const roots=[];for(const n of names){try{if(n==='pawn'){if(HEIST.pawnGrp){scene.remove(HEIST.pawnGrp);HEIST.pawnGrp=null}buildPawn();roots.push([n,HEIST.pawnGrp]);continue}
    const [o,f]=B[n],O=eval(o);if(O.grp){scene.remove(O.grp);O.grp=null}eval(f)();roots.push([n,O.grp])}catch(e){roots.push([n,null])}}
  return scan({roots,zones:null,maxEscape:1})},[names,scanInPage.toString()]);
 if(opt.ext)report.exteriors=await pg.evaluate(scanSrc=>{const scan=eval('('+scanSrc+')');const Z=[];const add=(n,r,m=6)=>{if(r)Z.push({n,x0:r[0]-m,z0:r[1]-m,x1:r[2]+m,z1:r[3]+m})};
  for(const l of city.lms||[])add(l.name,city.rects[l.ri]);add('motel',city.rects[city.motelRi]);add('tire',city.rects[city.tireRi]);const A=city.air;if(A)add('air',[A.ix0,A.iz0,A.ix1,A.iz1],2);
  const roots=[];for(const ch of city.chunks.values())roots.push(['chunk '+ch.key,ch.group]);const r=scan({roots,zones:Z,maxEscape:6});
  const byZone={};for(const k in r)for(const h of r[k].list){(byZone[h.zone]=byZone[h.zone]||{hits:0,area:0,list:[]});const z=byZone[h.zone];z.hits++;z.area=+(z.area+h.area).toFixed(3);z.list.push(h)}
  for(const z of Object.values(byZone))z.list.sort((a,b)=>b.area-a.area);return byZone},scanInPage.toString());
 report.errors=err;fs.writeFileSync('zfight-report.json',JSON.stringify(report,null,1));
 const show=(title,obj)=>{console.log('\n== '+title);for(const [k,o] of Object.entries(obj||{})){console.log(`${k.padEnd(10)} conflitos ${String(o.hits).padStart(4)}  área ${o.area} m²`);
  for(const h of o.list.slice(0,opt.top))console.log(`   ${h.ax}${h.sg>0?'+':h.sg<0?'-':'±'} ${JSON.stringify(h.p)}  ${h.area} m²  Δ${h.dc}  linhas ${h.lines&&h.lines.length?h.lines.join(' | '):'(fora do MB)'}\n      ${h.A}  ×  ${h.B}`)}};
 show('INTERIORES (seed '+opt.seed+', tamanho '+opt.size+(opt.off?', ZF desligado':'')+')',report.interiors);if(opt.ext)show('EXTERIORES ESPECIAIS',report.exteriors);
 if(err.length)console.log('\nErros da página:',err.slice(0,5));console.log('\nRelatório completo: zfight-report.json');await b.close()})();
